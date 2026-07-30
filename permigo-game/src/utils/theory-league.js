// ═══════════════════════════════════════════════════════════════
// Révision travaillée en autonomie — COMPTAGE (plus une ligue).
//
// L'échelle de paliers Novice → Révision certifiée et le bloc « +1 pt
// Révision » ont été RETIRÉS le 30/07/2026 (décision Rayan, du point de vue
// de l'élève) : ils ne débloquaient rien et s'ajoutaient aux volants, à la
// mission du jour et à la série sur le même geste. Ne restent ici que le
// seuil de réussite et le comptage factuel (combien de compétences quizzées,
// combien d'examens blancs réussis) — lu par la vue moniteur et la sélection
// des questions du jour.
//
// ⚠️ Métier : PermiGo ne couvre PAS le code/ETG — la « révision » ici
// = connaissances REMC travaillées en autonomie (quiz + exam blanc CEPC).
// Aucun libellé ne doit mentionner « code » / « ETG ».
// ═══════════════════════════════════════════════════════════════

// Seuil de réussite d'un quiz compétence pour qu'il compte comme travaillé
export const THEORY_QUIZ_PASS_PCT = 70;

/**
 * Calcule {nComp, nExams} depuis des lignes quiz_attempts :
 * nComp  = compétences distinctes avec un quiz réussi (≥ seuil)
 * nExams = parcours d'examen blanc distincts réussis
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
  return { nComp: comps.size, nExams: exams.size };
}
