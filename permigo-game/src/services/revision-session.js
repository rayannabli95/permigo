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
 * Démarre la session si besoin et capture le score de départ (progression
 * Révision), AVANT que le 1er quiz ne l'affecte.
 * Idempotent : no-op si une session est déjà active.
 */
export async function ensureRevisionSessionStarted() {
  if (read()?.active) return;
  write({
    active: true,
    startedAt: Date.now(),
    nQuiz: 0,
    nPassed: 0,
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
 * Construit le résumé de fin de session : compteurs + points gagnés dans la
 * progression Révision (niveaux Novice → Révision certifiée).
 *
 * Ligue unique (30/07/2026) : la révision n'est plus un CLASSEMENT — le récap
 * ne met donc plus en scène de rang ni d'élève dépassé (ce classement-là
 * n'existe plus nulle part dans l'app). Il célèbre l'effort et le niveau.
 *
 * @returns {Promise<null | {
 *   nQuiz:number, nPassed:number,
 *   oldScore:number, newScore:number, pointsGained:number,
 *   me:object|null, league:object|null, leagueUp:object|null
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
    /* on dégrade : récap sans score serveur */
  }

  const mine = rows.find((r) => r.is_me) || null;
  const newScore = mine?.score ?? s.oldScore ?? 0;
  const oldScore = typeof s.oldScore === "number" ? s.oldScore : newScore;
  const pointsGained = Math.max(0, newScore - oldScore);

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
    me: mine,
    league: lgAfter.league,
    leagueUp,
  };
}
