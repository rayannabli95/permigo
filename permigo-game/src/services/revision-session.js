// ═══════════════════════════════════════════════════════════════
// Revision Session — suit une session d'enchaînement « Continue à réviser »
// pour produire un récap de fin de session (façon Clash Royale) :
//   - X quizz réussis dans la session
//   - +N places gagnées dans la ligue Révision (dépassement d'autres élèves)
//   - +P points de révision, éventuel passage de palier de ligue
//
// Pourquoi un service : la révision enchaîne plusieurs mounts de quiz.js
// (chaque quiz = une navigation). On persiste l'état dans sessionStorage,
// et on capture le rang AVANT le 1er quiz (sinon le score a déjà bougé).
//
// Lecture seule : aucune écriture DB (le RPC get_theory_leaderboard est en
// SECURITY DEFINER, scope école, déjà utilisé par classement.js).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";

const KEY = "permigo:revision_session_v1";
const TTL_MS = 3 * 60 * 60 * 1000; // session "du jour" — expire après 3h d'inactivité

function read() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.startedAt || Date.now() - s.startedAt > TTL_MS) return null;
    return s;
  } catch {
    return null;
  }
}

function write(s) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* mode privé / quota — best-effort */
  }
}

export function isRevisionSessionActive() {
  return !!read()?.active;
}

/**
 * Démarre la session si besoin et capture l'état de départ (rang + score
 * dans la ligue Révision), AVANT que le 1er quiz n'affecte le score.
 * Idempotent : no-op si une session est déjà active.
 */
export async function ensureRevisionSessionStarted() {
  if (read()?.active) return;
  write({
    active: true,
    startedAt: Date.now(),
    nQuiz: 0,
    nPassed: 0,
    oldRang: null,
    oldScore: null,
    snapshotReady: false,
  });
  try {
    const { data } = await sb.rpc("get_theory_leaderboard", {
      p_scope: "ecole",
      p_limit: 500,
    });
    const mine = (data || []).find((r) => r.is_me);
    const cur = read();
    if (cur?.active) {
      cur.oldRang = mine?.rang ?? null;
      cur.oldScore = mine?.score ?? 0;
      cur.snapshotReady = true;
      write(cur);
    }
  } catch {
    /* snapshot best-effort — le récap dégradera proprement */
  }
}

/** Incrémente les compteurs de la session (à chaque quiz de révision terminé). */
export function noteRevisionQuiz({ passed } = {}) {
  const s = read();
  if (!s?.active) return;
  s.nQuiz += 1;
  if (passed) s.nPassed += 1;
  write(s);
}

export function clearRevisionSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/**
 * Construit le résumé de fin de session : compteurs + delta de rang/score
 * dans la ligue Révision + élève(s) dépassé(s).
 * @returns {Promise<null | {
 *   nQuiz:number, nPassed:number,
 *   oldScore:number, newScore:number, pointsGained:number,
 *   oldRang:number|null, newRang:number|null, ranksGained:number,
 *   me:object|null, rival:object|null, overtaken:Array,
 *   league:object|null, leagueUp:object|null
 * }>}
 */
export async function buildRevisionSummary() {
  const s = read();
  if (!s?.active) return null;

  let rows = [];
  try {
    const { data } = await sb.rpc("get_theory_leaderboard", {
      p_scope: "ecole",
      p_limit: 500,
    });
    rows = data || [];
  } catch {
    /* on dégrade : récap sans leaderboard */
  }

  const mine = rows.find((r) => r.is_me) || null;
  const newScore = mine?.score ?? s.oldScore ?? 0;
  const newRang = mine?.rang ?? s.oldRang ?? null;
  const oldScore = typeof s.oldScore === "number" ? s.oldScore : newScore;
  const oldRang =
    typeof s.oldRang === "number" && s.oldRang != null ? s.oldRang : newRang;

  const ranksGained =
    oldRang != null && newRang != null ? Math.max(0, oldRang - newRang) : 0;
  const pointsGained = Math.max(0, newScore - oldScore);

  // Élèves dépassés = ceux désormais SOUS moi qui étaient AU-DESSUS avant.
  let overtaken = [];
  if (newRang != null && oldRang != null && ranksGained > 0) {
    overtaken = rows
      .filter((r) => !r.is_me && r.rang > newRang && r.rang <= oldRang)
      .sort((a, b) => a.rang - b.rang);
  }
  // Le rival mis en scène = l'élève juste au-dessus duquel on vient de passer.
  const rival =
    overtaken[0] ||
    (newRang != null
      ? rows.find((r) => !r.is_me && r.rang === newRang + 1) || null
      : null);

  const { theoryLeague } = await import("@/utils/theory-league.js");
  const lgBefore = theoryLeague(oldScore);
  const lgAfter = theoryLeague(newScore);
  const leagueUp = lgAfter.idx > lgBefore.idx ? lgAfter.league : null;

  return {
    nQuiz: s.nQuiz,
    nPassed: s.nPassed,
    oldScore,
    newScore,
    pointsGained,
    oldRang,
    newRang,
    ranksGained,
    me: mine,
    rival,
    overtaken,
    league: lgAfter.league,
    leagueUp,
  };
}
