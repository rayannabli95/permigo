// ═══════════════════════════════════════════════════════════════
// Ligue THÉORIQUE — échelle de paliers partagée (élève + enseignant)
// Score = compétences distinctes avec quiz réussi ≥70% (+1 pt)
//       + parcours d'examen blanc distincts réussis CEPC (+4 pts)
// Max 30 + 20 = 50 pts. Échelle de progression, PAS de reset hebdo.
// Dimension SÉPARÉE de la ligue REMC (pratique).
// ⚠️ Métier : PermiGo ne couvre PAS le code/ETG — la « théorie » ici
// = connaissances REMC travaillées en autonomie (quiz + exam blanc CEPC).
// Aucun libellé ne doit mentionner « code » / « ETG ».
// ═══════════════════════════════════════════════════════════════

// Barème — SOURCE DE VÉRITÉ unique (UI : légende, tuto, animation de gain)
export const THEORY_PTS = { quiz: 1, exam: 4 };
// Seuil de réussite d'un quiz compétence pour marquer le point théorie
export const THEORY_QUIZ_PASS_PCT = 70;

export const THEORY_LEAGUES = [
  { n: 1, name: "Novice", color: "#22c55e", startAt: 1 },
  { n: 2, name: "Apprenti", color: "#3b82f6", startAt: 8 },
  { n: 3, name: "Sérieux", color: "#eab308", startAt: 18 },
  { n: 4, name: "Confirmé", color: "#8b5cf6", startAt: 30 },
  { n: 5, name: "Théorie maîtrisée", color: "#f59e0b", startAt: 42 },
];

/**
 * @param {number} score - score théorique (0-50)
 * @returns {{league: object|null, idx: number, next: object|null, toNext: number, top: boolean}}
 *   league = null → pas encore dans la ligue (0 pt)
 */
export function theoryLeague(score) {
  const s = Math.max(0, score || 0);
  let idx = -1;
  for (let i = 0; i < THEORY_LEAGUES.length; i++) {
    if (s >= THEORY_LEAGUES[i].startAt) idx = i;
  }
  const league = idx >= 0 ? THEORY_LEAGUES[idx] : null;
  const next = THEORY_LEAGUES[idx + 1] || null;
  return {
    league,
    idx,
    next,
    toNext: next ? next.startAt - s : 0,
    top: idx === THEORY_LEAGUES.length - 1,
  };
}

/**
 * Calcule {score, nComp, nExams} depuis des lignes quiz_attempts.
 * @param {Array<{competence_id: string|null, type: string, score: number|null, ref_id: string|null, passed: boolean|null}>} attempts
 */
export function computeTheoryScore(attempts) {
  const comps = new Set();
  const exams = new Set();
  for (const a of attempts || []) {
    if (a.type === "exam_blanc") {
      if (a.passed && a.ref_id != null) exams.add(a.ref_id);
    } else if (a.competence_id && (a.score ?? 0) >= THEORY_QUIZ_PASS_PCT) {
      comps.add(a.competence_id);
    }
  }
  return {
    nComp: comps.size,
    nExams: exams.size,
    score: comps.size * THEORY_PTS.quiz + exams.size * THEORY_PTS.exam,
  };
}
