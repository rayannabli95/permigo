// ═══════════════════════════════════════════════════════════════
// Edge Function : duel
//
// Le jeu de soirée « Défie tes amis ». Un élève connecté crée une partie,
// envoie le lien, ses amis jouent SANS COMPTE.
//
// Pourquoi tout passe par ici plutôt que par des policies RLS : un invité
// n'a aucune session Supabase, donc aucune policy ne peut le décrire. C'est
// cette fonction qui autorise, avec le code de la partie comme secret
// partagé. Elle est déployée en --no-verify-jwt (les invités n'ont pas de
// jeton) ; l'action `create` vérifie le JWT à la main.
//
// Actions : create · join · questions · finish · results
//
// ⚠️ `questions` renvoie correct_index : la correction se fait dans le
// navigateur pour que le joueur ait sa réponse tout de suite. C'est assumé,
// ce n'est PAS un quiz certifiant (rien n'est écrit dans quiz_attempts, aucune
// compétence n'est validée). Un tricheur ne gagne qu'une soirée entre potes.
//
// Deploy : supabase functions deploy duel --no-verify-jwt
// ═══════════════════════════════════════════════════════════════
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const NB_QUESTIONS = 10;
const MAX_JOUEURS = 8;
// Points de vitesse : une bonne réponse vaut de 500 (au buzzer) à 1000
// (instantanée). Le plafond sert uniquement à borner ce qu'un client peut
// envoyer, la règle de calcul vit dans la page.
const PTS_MAX = 1000;

// Alphabet sans caractère ambigu : pas de 0/O, 1/I/L, 2/Z, 5/S, 8/B. Le code
// se lit à voix haute dans une soirée sans que personne ne se trompe.
const ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";

function codeAleatoire(n = 5) {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// Un prénom d'affichage, rien d'autre : on coupe, on retire les retours à la
// ligne, et on refuse le vide. L'échappement XSS reste fait côté page.
function nettoiePrenom(raw: unknown) {
  const s = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
  return s.length ? s : null;
}

function melange<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Charge la partie par son code, en refusant celles qui ont expiré.
async function chargeDuel(code: string) {
  const { data, error } = await admin
    .from("duels")
    .select("id, code, host_id, question_ids, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "body" }, 400);
  }

  const action = String(body.action ?? "");
  const code = String(body.code ?? "")
    .toUpperCase()
    .trim();

  try {
    // ── create : réservé à un compte connecté ────────────────────────────
    if (action === "create") {
      const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
      if (!jwt) return json({ error: "auth" }, 401);
      const asUser = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false },
      });
      const {
        data: { user },
      } = await asUser.auth.getUser();
      if (!user) return json({ error: "auth" }, 401);

      const prenom = nettoiePrenom(body.name) ?? "Moi";

      // Tirage : on prend tous les identifiants puis on mélange côté fonction
      // (la banque tient en quelques centaines de lignes, pas besoin de SQL
      // aléatoire). Les questions sans options exploitables sont écartées.
      const { data: bank, error: bankErr } = await admin
        .from("questions_competence")
        .select("id, options");
      if (bankErr) throw bankErr;
      const utilisables = (bank ?? []).filter(
        (q) => Array.isArray(q.options) && q.options.length >= 2,
      );
      if (utilisables.length < NB_QUESTIONS) {
        return json({ error: "banque_insuffisante" }, 503);
      }
      const ids = melange(utilisables.map((q) => q.id)).slice(0, NB_QUESTIONS);

      // Collision de code : on retente quelques fois avant d'abandonner.
      let duel = null;
      for (let essai = 0; essai < 5 && !duel; essai++) {
        const { data, error } = await admin
          .from("duels")
          .insert({
            code: codeAleatoire(),
            host_id: user.id,
            question_ids: ids,
          })
          .select("id, code")
          .maybeSingle();
        if (!error) duel = data;
        else if (error.code !== "23505") throw error;
      }
      if (!duel) return json({ error: "code" }, 500);

      const { data: joueur, error: pErr } = await admin
        .from("duel_players")
        .insert({
          duel_id: duel.id,
          user_id: user.id,
          name: prenom,
          is_host: true,
        })
        .select("id")
        .maybeSingle();
      if (pErr) throw pErr;

      return json({ code: duel.code, playerId: joueur?.id });
    }

    // ── join : ouvert à tous, le code fait l'autorisation ────────────────
    if (action === "join") {
      const duel = await chargeDuel(code);
      if (!duel) return json({ error: "introuvable" }, 404);
      const prenom = nettoiePrenom(body.name);
      if (!prenom) return json({ error: "prenom" }, 400);

      const { data: deja, error: listErr } = await admin
        .from("duel_players")
        .select("id, name")
        .eq("duel_id", duel.id);
      if (listErr) throw listErr;
      if ((deja ?? []).length >= MAX_JOUEURS) {
        return json({ error: "complet" }, 409);
      }

      const { data: joueur, error } = await admin
        .from("duel_players")
        .insert({ duel_id: duel.id, name: prenom })
        .select("id, name")
        .maybeSingle();
      if (error) throw error;

      return json({
        playerId: joueur?.id,
        name: joueur?.name,
        players: (deja ?? []).map((p) => p.name),
        total: NB_QUESTIONS,
      });
    }

    // ── questions : les 10 de la partie, dans l'ordre, pour tout le monde ─
    if (action === "questions") {
      const duel = await chargeDuel(code);
      if (!duel) return json({ error: "introuvable" }, 404);

      const { data, error } = await admin
        .from("questions_competence")
        .select("id, question, options, correct_index, explanation")
        .in("id", duel.question_ids);
      if (error) throw error;

      // `.in()` ne garantit pas l'ordre : on remet la suite tirée à la
      // création, sinon deux joueurs ne verraient pas la même question 4.
      const parId = new Map((data ?? []).map((q) => [q.id, q]));
      const questions = duel.question_ids
        .map((id: string) => parId.get(id))
        .filter(Boolean);

      return json({ questions });
    }

    // ── finish : le jeton du joueur autorise l'écriture de SON score ─────
    if (action === "finish") {
      const playerId = String(body.playerId ?? "");
      const score = Number(body.score);
      const correct = Number(body.correct);
      if (!playerId || !Number.isInteger(score) || score < 0) {
        return json({ error: "score" }, 400);
      }
      const missed = Array.isArray(body.missed)
        ? (body.missed as string[]).slice(0, NB_QUESTIONS)
        : [];

      const { data, error } = await admin
        .from("duel_players")
        .update({
          // Points de VITESSE, plus un nombre de bonnes réponses : le plafond
          // est celui d'une partie parfaite, pas celui du nombre de questions.
          score: Math.min(score, NB_QUESTIONS * PTS_MAX),
          correct_count: Number.isInteger(correct)
            ? Math.min(Math.max(correct, 0), NB_QUESTIONS)
            : null,
          missed_ids: missed,
          finished_at: new Date().toISOString(),
        })
        .eq("id", playerId)
        .is("finished_at", null) // on ne rejoue pas son score
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "deja_joue" }, 409);

      return json({ ok: true });
    }

    // ── results : le classement + la question que tout le monde a ratée ──
    if (action === "results") {
      const duel = await chargeDuel(code);
      if (!duel) return json({ error: "introuvable" }, 404);

      const { data: joueurs, error } = await admin
        .from("duel_players")
        .select(
          "id, name, score, correct_count, missed_ids, finished_at, is_host",
        )
        .eq("duel_id", duel.id)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const classement = (joueurs ?? [])
        .map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          correct: p.correct_count,
          fini: !!p.finished_at,
        }))
        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

      // La question la plus ratée du groupe : c'est elle qu'on propose de
      // revoir à la fin. Sans elle, l'écran final n'est qu'un score.
      const compte = new Map<string, number>();
      for (const p of joueurs ?? []) {
        for (const qid of p.missed_ids ?? []) {
          compte.set(qid, (compte.get(qid) ?? 0) + 1);
        }
      }
      let pire: { id: string; rates: number } | null = null;
      for (const [id, rates] of compte) {
        if (!pire || rates > pire.rates) pire = { id, rates };
      }

      let ratee = null;
      if (pire && pire.rates >= 2) {
        const { data: q } = await admin
          .from("questions_competence")
          .select("id, question, options, correct_index, explanation")
          .eq("id", pire.id)
          .maybeSingle();
        if (q) ratee = { ...q, rates: pire.rates };
      }

      // Le nom de l'hôte est renvoyé À PART : le classement est trié par
      // score, donc dès que quelqu'un finit, l'hôte n'est plus en première
      // ligne. C'est lui qui donne le « Machin te défie » de l'écran d'accueil.
      const hote = (joueurs ?? []).find((p) => p.is_host)?.name ?? null;

      return json({ classement, ratee, hote, total: NB_QUESTIONS });
    }

    return json({ error: "action" }, 400);
  } catch (e) {
    console.error("[duel]", action, e);
    return json({ error: "serveur" }, 500);
  }
});
