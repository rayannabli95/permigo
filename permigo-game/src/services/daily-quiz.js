// ═══════════════════════════════════════════════════════════════
// Question du jour — la boucle solo quotidienne de l'élève.
// (Plan rétention 2026-06-10 : 3 questions/jour, source hybride
// progressive, ligue théorique en vedette, streak silencieux,
// ZÉRO gemme sur le quotidien.)
//
// Source hybride :
//  - 0 compétence acquise → mode DÉCOUVERTE : une compétence du
//    monde 1 (bases), tournée par jour, cadrée « sans pression »
//    (submit_competence_quiz ne touche AUCUN statut sans ligne de
//    validation → la triple validation reste intacte).
//  - ≥1 acquise → mode CONSOLIDATION : la compétence acquise la
//    moins récemment quizzée (approximation de répétition espacée).
//
// L'état « fait aujourd'hui » vit en localStorage (clé datée) :
// suffisant pour l'UX ; la mesure produit passe par track().
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { REMC } from "@/data/remc.js";
import { THEORY_QUIZ_PASS_PCT } from "@/utils/theory-league.js";

const LS_DONE = "pg-daily-quiz-done"; // valeur = YYYY-MM-DD (local)

// ─── Série quotidienne (streak boucle solo) ───────────────────────
// Clés localStorage best-effort. Totalement indépendant de la table
// `streaks` (qui suit la connexion / activité générale côté serveur).
// Celui-ci ne mesure que les jours où la question du jour est FAITE.
// Règles non-négociables :
//  - Pas de menace de perte : JAMAIS « tu vas perdre ta série ! »
//  - Affiché avec fierté quand >= 2 jours, ignoré à 0 ou 1
//  - Remis à 0 silencieusement si un jour est sauté (sans bruit)
export const LS_DAILY_STREAK = "pg-daily-streak"; // entier (jours consécutifs)
export const LS_DAILY_STREAK_LAST = "pg-daily-streak-last"; // YYYY-MM-DD du dernier jour fait

/** Clé du jour en heure locale (pas UTC : l'élève vit en heure locale). */
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Clé du jour précédent en heure locale. */
export function yesterdayKey() {
  const d = new Date(Date.now() - 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Clé (YYYY-MM-DD) en heure locale pour un timestamp donné (ex : completed_at). */
export function dayKey(dateLike) {
  const d = new Date(dateLike);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isDailyDone() {
  try {
    return localStorage.getItem(LS_DONE) === todayKey();
  } catch {
    return false;
  }
}

/**
 * Lit la série de jours consécutifs où la question du jour a été faite.
 * Retourne 0 si la série est cassée (jour sauté) ou si pas encore fait.
 * @returns {number}
 */
export function getDailyStreak() {
  try {
    const last = localStorage.getItem(LS_DAILY_STREAK_LAST);
    const count = parseInt(localStorage.getItem(LS_DAILY_STREAK) || "0", 10);
    if (!last || !count) return 0;
    // La série est valide si le dernier jour fait = hier ou aujourd'hui
    const today = todayKey();
    const yesterday = yesterdayKey();
    if (last === today || last === yesterday) return count;
    return 0; // jour sauté → série cassée silencieusement
  } catch {
    return 0;
  }
}

export function markDailyDone() {
  try {
    const today = todayKey();
    localStorage.setItem(LS_DONE, today);
    // Mise à jour de la série quotidienne
    const last = localStorage.getItem(LS_DAILY_STREAK_LAST);
    const count = parseInt(localStorage.getItem(LS_DAILY_STREAK) || "0", 10);
    if (last === today) return; // idempotent : déjà marqué aujourd'hui
    const yesterday = yesterdayKey();
    const newCount = last === yesterday ? count + 1 : 1;
    localStorage.setItem(LS_DAILY_STREAK, String(newCount));
    localStorage.setItem(LS_DAILY_STREAK_LAST, today);
  } catch {
    /* localStorage indisponible → la carte restera proposée, pas grave */
  }
}

// Index de jour stable (rotation déterministe des compétences)
function dayIndex() {
  return Math.floor(Date.now() / 86_400_000);
}

/**
 * Choisit la compétence du jour.
 * @param {string} userId
 * @param {string[]} validatedIds — compétences au statut "acquis"
 *        (déjà fetchées par l'accueil, on ne refait pas la requête)
 * @returns {Promise<{competenceId: string, mode: "decouverte"|"consolidation"}>}
 */
export async function pickDailyQuiz(userId, validatedIds) {
  // ─ Mode découverte : rien d'acquis → les bases du monde 1, sans enjeu ─
  if (!validatedIds?.length) {
    const subs = REMC[0].subs;
    return {
      competenceId: subs[dayIndex() % subs.length].c,
      mode: "decouverte",
    };
  }

  // ─ Mode consolidation : l'acquise la moins récemment quizzée ─
  try {
    const { data, error } = await sb
      .from("quiz_attempts")
      .select("competence_id, completed_at")
      .eq("user_id", userId)
      .in("competence_id", validatedIds)
      .order("completed_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const lastSeen = {};
    for (const a of data || []) {
      if (!(a.competence_id in lastSeen))
        lastSeen[a.competence_id] = a.completed_at;
    }
    const never = validatedIds.filter((c) => !(c in lastSeen));
    const competenceId = never.length
      ? never[dayIndex() % never.length]
      : validatedIds
          .slice()
          .sort((a, b) => new Date(lastSeen[a]) - new Date(lastSeen[b]))[0];
    return { competenceId, mode: "consolidation" };
  } catch {
    // Fallback réseau : rotation simple sur les acquises
    return {
      competenceId: validatedIds[dayIndex() % validatedIds.length],
      mode: "consolidation",
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// Enchaînement « Continue à réviser » — l'élève déterminé enchaîne
// des quiz au-delà de la question du jour. Chaque quiz réussi nourrit
// la Ligue Révision. On évite de re-proposer les dernières compétences
// pour garder de la variété (sessionStorage, remis à zéro à la session).
// ═══════════════════════════════════════════════════════════════
const SS_RECENT = "pg-revision-recent"; // JSON: derniers competence_id joués
const RECENT_KEEP = 6;

function readRecent() {
  try {
    const arr = JSON.parse(sessionStorage.getItem(SS_RECENT) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Mémorise une compétence jouée en révision (pour varier la suivante). */
export function pushRevisionRecent(competenceId) {
  if (!competenceId) return;
  try {
    const next = [
      competenceId,
      ...readRecent().filter((c) => c !== competenceId),
    ].slice(0, RECENT_KEEP);
    sessionStorage.setItem(SS_RECENT, JSON.stringify(next));
  } catch {
    /* sessionStorage indispo → pas de mémoire de variété, pas grave */
  }
}

const ALL_COMPETENCES = REMC.flatMap((cat) => cat.subs.map((s) => s.c));

/**
 * Choisit la prochaine compétence à réviser dans une session d'enchaînement.
 * Priorité aux compétences acquises (consolidation, répétition espacée), puis
 * découverte si rien d'acquis. Exclut les dernières jouées pour la variété.
 * @param {string} userId
 * @returns {Promise<{competenceId: string, mode: "decouverte"|"consolidation"}>}
 */
export async function pickRevisionQuiz(userId) {
  const recent = new Set(readRecent());

  // Compétences acquises de l'élève
  let acquired = [];
  try {
    const { data, error } = await sb
      .from("validations")
      .select("competence_id")
      .eq("eleve_id", userId)
      .eq("statut", "acquis");
    if (error) throw error;
    acquired = (data || []).map((r) => r.competence_id);
  } catch {
    acquired = [];
  }

  // ─ Consolidation : acquise la moins récemment quizzée, hors « recent » ─
  const pool = acquired.filter((c) => !recent.has(c));
  const consolidPool = pool.length ? pool : acquired;
  if (consolidPool.length) {
    try {
      const { data } = await sb
        .from("quiz_attempts")
        .select("competence_id, completed_at")
        .eq("user_id", userId)
        .in("competence_id", consolidPool)
        .order("completed_at", { ascending: false })
        .limit(200);
      const lastSeen = {};
      for (const a of data || []) {
        if (!(a.competence_id in lastSeen))
          lastSeen[a.competence_id] = a.completed_at;
      }
      const never = consolidPool.filter((c) => !(c in lastSeen));
      const competenceId = never.length
        ? never[Math.floor(Math.random() * never.length)]
        : consolidPool
            .slice()
            .sort((a, b) => new Date(lastSeen[a]) - new Date(lastSeen[b]))[0];
      return { competenceId, mode: "consolidation" };
    } catch {
      const competenceId =
        consolidPool[Math.floor(Math.random() * consolidPool.length)];
      return { competenceId, mode: "consolidation" };
    }
  }

  // ─ Découverte : rien d'acquis → une compétence au hasard, hors « recent » ─
  const disco = ALL_COMPETENCES.filter((c) => !recent.has(c));
  const fromPool = disco.length ? disco : ALL_COMPETENCES;
  return {
    competenceId: fromPool[Math.floor(Math.random() * fromPool.length)],
    mode: "decouverte",
  };
}

/**
 * Variante « cible mes lacunes » : ne pioche QUE des compétences pas encore
 * réussies (aucun quiz à ≥ THEORY_QUIZ_PASS_PCT %) — donc « pas faites OU pas
 * réussies ». Parcourt dans l'ordre du parcours (progressif), hors « recent ».
 * @param {string} userId
 * @returns {Promise<{competenceId: string, mode: "decouverte"} | null>}
 *          null = tout est déjà réussi (l'appelant bascule sur le mode normal).
 */
export async function pickUnseenRevisionQuiz(userId) {
  const recent = new Set(readRecent());

  // Compétences déjà réussies (au moins un quiz à ≥ seuil de réussite)
  let passed = new Set();
  try {
    const { data, error } = await sb
      .from("quiz_attempts")
      .select("competence_id, score")
      .eq("user_id", userId)
      .gte("score", THEORY_QUIZ_PASS_PCT)
      .not("competence_id", "is", null)
      .limit(500);
    if (error) throw error;
    for (const a of data || []) {
      if (a.competence_id) passed.add(a.competence_id);
    }
  } catch {
    passed = new Set(); // réseau KO → on considère que rien n'est réussi
  }

  const notPassed = ALL_COMPETENCES.filter((c) => !passed.has(c));
  if (!notPassed.length) return null; // tout réussi → fallback côté appelant

  // Priorité aux non-réussies hors « recent » ; ordre parcours = progressif.
  const pool = notPassed.filter((c) => !recent.has(c));
  const fromPool = pool.length ? pool : notPassed;
  return { competenceId: fromPool[0], mode: "decouverte" };
}
