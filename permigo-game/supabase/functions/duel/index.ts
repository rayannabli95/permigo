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
// ── Synchro temps réel (06/08) ────────────────────────────────────────────
// Avant, chaque téléphone jouait sa propre copie des 10 questions à son
// rythme. Maintenant, `duels` porte un ÉTAT DE MANCHE unique (status /
// current_index / round_deadline), pareil pour tout le monde. Cette fonction
// diffuse chaque changement à tous les téléphones via Supabase Realtime
// Broadcast (canal `duel:<code>`), en appelant directement l'API REST du
// service Realtime plutôt qu'en ouvrant un websocket : une edge function vit
// le temps d'une requête, un websocket n'aurait pas le temps de s'établir.
// Le client garde en plus un sondage de secours (action `state`) pour le cas
// où un message de diffusion se perd (réseau qui tousse) : la vitesse vient
// de la diffusion, la fiabilité vient du sondage.
//
// Le score n'est plus calculé par le client puis simplement plafonné ici :
// il est calculé ICI, à partir de l'horloge du SERVEUR (temps restant avant
// round_deadline), pour qu'un téléphone à l'heure fausse ne puisse pas se
// donner un avantage de vitesse. Une bonne réponse vaut de 1 à 10 points
// selon la rapidité, une mauvaise ou un temps écoulé vaut 0.
//
// Actions : create · join · questions · start · answer · next · state · results
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
const SERVICE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ??
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
// 20 secondes par question (inchangé, décision Rayan 03/08). Une bonne
// réponse vaut de 1 point (au buzzer) à 10 points (instantanée).
const DUREE_MS = 20000;
const PTS_MAX_Q = 10;
// L'écran de reveal (les deux réponses côte à côte + le commentaire) tient
// 4 secondes avant d'enchaîner tout seul sur la question suivante.
const REVEAL_MS = 4000;
// La pause de mi-temps, entre la question 5 et la question 6. Même durée que
// l'ancien écran d'entracte côté page.
const INTERMISSION_MS = 5000;
const MI_TEMPS = 5;
// Langues servies pour les questions. Une valeur inconnue retombe en français
// plutôt que de renvoyer une partie vide.
const LANGUES = new Set(["en", "ar"]);

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

// Diffuse un événement à tous les téléphones connectés au salon `duel:<code>`.
// Passe par l'API REST du Realtime (pas par un websocket : une edge function
// n'a pas le temps d'en ouvrir un proprement) et ne fait JAMAIS échouer
// l'action qui l'appelle : si la diffusion tombe, le sondage de secours
// (`state`) rattrape le client dans les 2 secondes qui suivent.
async function diffuse(code: string, event: string, payload: unknown) {
  try {
    await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
      body: JSON.stringify({
        messages: [{ topic: `duel:${code}`, event, payload }],
      }),
    });
  } catch (e) {
    console.error("[duel:diffuse]", event, e);
  }
}

// Charge la partie par son code, en refusant celles qui ont expiré.
async function chargeDuel(code: string) {
  const { data, error } = await admin
    .from("duels")
    .select(
      "id, code, host_id, question_ids, expires_at, status, current_index, round_deadline, reveal_until, intermission_shown",
    )
    .eq("code", code)
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data;
}

// L'état public de la manche : ce que `start` / `next` diffusent, et ce que
// `state` renvoie au sondage de secours. Toujours la même forme, pour que le
// client n'ait qu'UN seul rendu à écrire des deux côtés (diffusion ou sondage).
function etatManche(duel: {
  status: string;
  current_index: number;
  round_deadline: string | null;
  reveal_until: string | null;
}) {
  return {
    status: duel.status,
    index: duel.current_index,
    deadline: duel.round_deadline,
    revealUntil: duel.reveal_until,
    total: NB_QUESTIONS,
  };
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
      // La partie ferme ses portes dès qu'elle a démarré : impossible de
      // rejoindre une question déjà en cours dans une partie synchronisée.
      if (duel.status !== "lobby") return json({ error: "commencee" }, 409);
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
      let questions = duel.question_ids
        .map((id: string) => parId.get(id))
        .filter(Boolean);

      // Langue demandée par le joueur. Les 415 questions de la banque
      // existent en anglais et en arabe. `correct_index` NE BOUGE PAS : les
      // options traduites gardent l'ordre de la source (cf. le commentaire
      // de la table question_translations). Une traduction manquante se
      // replie sur le français, question par question.
      const lang = LANGUES.has(String(body.lang ?? ""))
        ? String(body.lang)
        : "fr";
      if (lang !== "fr") {
        const { data: tr } = await admin
          .from("question_translations")
          .select("question_id, question, options, explanation")
          .eq("lang", lang)
          .in("question_id", duel.question_ids);
        const parTr = new Map((tr ?? []).map((x) => [x.question_id, x]));
        questions = questions.map((q) => {
          const x = parTr.get(q.id);
          return x
            ? {
              ...q,
              question: x.question,
              options: x.options,
              explanation: x.explanation,
            }
            : q;
        });
      }

      return json({ questions, lang, status: duel.status });
    }

    // ── start : l'hôte lance la première question pour TOUT LE MONDE ─────
    if (action === "start") {
      const playerId = String(body.playerId ?? "");
      const duel = await chargeDuel(code);
      if (!duel) return json({ error: "introuvable" }, 404);
      if (duel.status !== "lobby") return json(etatManche(duel)); // déjà lancée : idempotent
      const { data: joueur } = await admin
        .from("duel_players")
        .select("is_host")
        .eq("id", playerId)
        .eq("duel_id", duel.id)
        .maybeSingle();
      if (!joueur?.is_host) return json({ error: "hote" }, 403);

      const deadline = new Date(Date.now() + DUREE_MS).toISOString();
      const { data: maj, error } = await admin
        .from("duels")
        .update({
          status: "playing",
          current_index: 0,
          round_deadline: deadline,
        })
        .eq("id", duel.id)
        .eq("status", "lobby") // idempotent si deux clics se croisent
        .select("status, current_index, round_deadline, reveal_until")
        .maybeSingle();
      if (error) throw error;
      const etat = maj ? etatManche(maj) : etatManche({
        ...duel,
        status: "playing",
        current_index: 0,
        round_deadline: deadline,
      });
      await diffuse(code, "round", etat);
      return json(etat);
    }

    // ── answer : un joueur répond à la question en cours ─────────────────
    // Le score dépend du temps restant sur L'HORLOGE DU SERVEUR, jamais de
    // celle envoyée par le téléphone. Dès que tout le monde a répondu (ou
    // qu'un dernier retardataire arrive avec choice=-1 à l'expiration de son
    // chrono local), cette requête bascule elle-même la manche en `reveal` et
    // diffuse le résultat : aucun cron n'est nécessaire.
    if (action === "answer") {
      const playerId = String(body.playerId ?? "");
      const qIndex = Number(body.index);
      const choix = Number.isInteger(body.choice) ? Number(body.choice) : -1;
      const duel = await chargeDuel(code);
      if (!duel) return json({ error: "introuvable" }, 404);
      if (duel.status !== "playing" || duel.current_index !== qIndex) {
        // La manche a déjà avancé : ce n'est pas une erreur pour ce
        // téléphone, juste une réponse arrivée trop tard. Il rattrapera
        // l'état réel au prochain sondage.
        return json({ ok: true, perime: true });
      }

      const q = await admin
        .from("questions_competence")
        .select("correct_index")
        .eq("id", duel.question_ids[qIndex])
        .maybeSingle();
      const correctIndex = q.data?.correct_index ?? -1;
      const correct = choix === correctIndex;
      const restant = Math.max(
        0,
        new Date(duel.round_deadline!).getTime() - Date.now(),
      );
      const points = correct
        ? Math.max(1, Math.round((PTS_MAX_Q * restant) / DUREE_MS))
        : 0;

      const { error: ansErr } = await admin.from("duel_answers").insert({
        duel_id: duel.id,
        player_id: playerId,
        q_index: qIndex,
        choice: choix,
        correct,
        points,
      });
      // Conflit = ce joueur a déjà répondu à cette question (double appel,
      // p. ex. un clic ET l'expiration du chrono qui se croisent) : on ne
      // compte pas deux fois, on renvoie simplement l'état.
      if (ansErr && ansErr.code !== "23505") throw ansErr;

      if (!ansErr) {
        await admin.rpc("increment_duel_score", {
          p_player_id: playerId,
          p_points: points,
          p_correct: correct ? 1 : 0,
        });
      }

      // Tout le monde a-t-il répondu ? Si oui, on bascule en reveal.
      const [{ count: nbJoueurs }, { data: reponses }] = await Promise.all([
        admin
          .from("duel_players")
          .select("id", { count: "exact", head: true })
          .eq("duel_id", duel.id),
        admin
          .from("duel_answers")
          .select("player_id, choice, correct, points")
          .eq("duel_id", duel.id)
          .eq("q_index", qIndex),
      ]);

      let reveal = null;
      if ((reponses ?? []).length >= (nbJoueurs ?? 0) && (nbJoueurs ?? 0) > 0) {
        const revealUntil = new Date(Date.now() + REVEAL_MS).toISOString();
        const { data: maj } = await admin
          .from("duels")
          .update({ status: "reveal", reveal_until: revealUntil })
          .eq("id", duel.id)
          .eq("status", "playing")
          .eq("current_index", qIndex)
          .select("status, current_index, round_deadline, reveal_until")
          .maybeSingle();
        if (maj) {
          const { data: joueurs } = await admin
            .from("duel_players")
            .select("id, name, score")
            .eq("duel_id", duel.id);
          const parJoueur = new Map((joueurs ?? []).map((p) => [p.id, p]));
          reveal = {
            ...etatManche(maj),
            correctIndex,
            reponses: (reponses ?? []).map((r) => ({
              playerId: r.player_id,
              name: parJoueur.get(r.player_id)?.name ?? "?",
              choice: r.choice,
              correct: r.correct,
              points: r.points,
              total: parJoueur.get(r.player_id)?.score ?? 0,
            })),
          };
          await diffuse(code, "reveal", reveal);
        }
      }

      return json({ ok: true, correct, points, correctIndex, reveal });
    }

    // ── next : fait avancer la manche (reveal→question suivante, ou
    // reveal→intermission, ou intermission→question, ou dernière→classement).
    // Gardée par l'état ATTENDU : si un autre téléphone a déjà fait avancer
    // la partie entre-temps, cet appel est un no-op qui renvoie l'état réel.
    // N'importe quel téléphone peut appeler `next`, c'est voulu : c'est celui
    // dont le minuteur local arrive à zéro en premier qui fait avancer tout
    // le monde.
    if (action === "next") {
      const duel = await chargeDuel(code);
      if (!duel) return json({ error: "introuvable" }, 404);
      const expectedStatus = String(body.expectedStatus ?? "");
      const expectedIndex = Number(body.expectedIndex);
      if (
        duel.status !== expectedStatus ||
        duel.current_index !== expectedIndex
      ) {
        return json(etatManche(duel)); // déjà avancée par un autre téléphone
      }

      let patch: Record<string, unknown>;
      if (expectedStatus === "reveal") {
        const prochain = expectedIndex + 1;
        if (prochain >= NB_QUESTIONS) {
          patch = { status: "finished" };
          await admin
            .from("duel_players")
            .update({ finished_at: new Date().toISOString() })
            .eq("duel_id", duel.id)
            .is("finished_at", null);
        } else if (prochain === MI_TEMPS && !duel.intermission_shown) {
          patch = {
            status: "intermission",
            current_index: prochain,
            reveal_until: new Date(Date.now() + INTERMISSION_MS).toISOString(),
            intermission_shown: true,
          };
        } else {
          patch = {
            status: "playing",
            current_index: prochain,
            round_deadline: new Date(Date.now() + DUREE_MS).toISOString(),
          };
        }
      } else if (expectedStatus === "intermission") {
        patch = {
          status: "playing",
          round_deadline: new Date(Date.now() + DUREE_MS).toISOString(),
        };
      } else {
        return json(etatManche(duel));
      }

      const { data: maj, error } = await admin
        .from("duels")
        .update(patch)
        .eq("id", duel.id)
        .eq("status", expectedStatus)
        .eq("current_index", expectedIndex)
        .select("status, current_index, round_deadline, reveal_until")
        .maybeSingle();
      if (error) throw error;
      const etat = maj ? etatManche(maj) : etatManche(duel);
      await diffuse(
        code,
        etat.status === "finished"
          ? "finished"
          : etat.status === "intermission"
          ? "intermission"
          : "round",
        etat,
      );
      return json(etat);
    }

    // ── state : l'état courant de la manche, sondé en filet de sécurité ──
    if (action === "state") {
      const duel = await chargeDuel(code);
      if (!duel) return json({ error: "introuvable" }, 404);
      return json(etatManche(duel));
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
      // revoir à la fin. On la déduit maintenant de duel_answers (choix
      // incorrects), missed_ids n'étant plus alimenté par le client.
      const { data: rates } = await admin
        .from("duel_answers")
        .select("q_index")
        .eq("duel_id", duel.id)
        .eq("correct", false);
      const compte = new Map<number, number>();
      for (const r of rates ?? []) {
        compte.set(r.q_index, (compte.get(r.q_index) ?? 0) + 1);
      }
      let pire: { index: number; rates: number } | null = null;
      for (const [index, n] of compte) {
        if (!pire || n > pire.rates) pire = { index, rates: n };
      }

      let ratee = null;
      if (pire && pire.rates >= 2) {
        const { data: q } = await admin
          .from("questions_competence")
          .select("id, question, options, correct_index, explanation")
          .eq("id", duel.question_ids[pire.index])
          .maybeSingle();
        if (q) ratee = { ...q, rates: pire.rates };
      }

      // Le nom de l'hôte est renvoyé À PART : le classement est trié par
      // score, donc dès que quelqu'un finit, l'hôte n'est plus en première
      // ligne. C'est lui qui donne le « Machin te défie » de l'écran d'accueil.
      const hote = (joueurs ?? []).find((p) => p.is_host)?.name ?? null;

      return json({
        classement,
        ratee,
        hote,
        total: NB_QUESTIONS,
        ...etatManche(duel),
      });
    }

    return json({ error: "action" }, 400);
  } catch (e) {
    console.error("[duel]", action, e);
    return json({ error: "serveur" }, 500);
  }
});
