// ═══════════════════════════════════════════════════════════════
// Revision Session — suit une session d'enchaînement « Continue à réviser »
// pour produire un récap de fin de session : combien de quiz joués, combien
// de réussis. C'est tout.
//
// Pourquoi un service : la révision enchaîne plusieurs mounts de quiz.js
// (chaque quiz = une navigation) → on persiste les compteurs dans
// sessionStorage.
//
// Retrait du 30/07/2026 (décision Rayan) : ce service lisait aussi le
// classement théorique pour afficher rang, places gagnées et points de
// révision dans le récap. Plus rien de tout ça n'est montré à l'élève —
// donc plus aucun appel réseau ici, ni au démarrage ni à la fin.
// ═══════════════════════════════════════════════════════════════

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
 * Démarre la session si besoin. Idempotent : no-op si une session est déjà
 * active. Purement local (plus de snapshot serveur à capturer).
 */
export function ensureRevisionSessionStarted() {
  if (read()?.active) return;
  write({
    active: true,
    startedAt: Date.now(),
    nQuiz: 0,
    nPassed: 0,
  });
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
 * Construit le résumé de fin de session : les compteurs de la session.
 * @returns {null | { nQuiz:number, nPassed:number }}
 */
export function buildRevisionSummary() {
  const s = read();
  if (!s?.active) return null;
  return { nQuiz: s.nQuiz, nPassed: s.nPassed };
}
