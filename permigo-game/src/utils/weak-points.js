// ═══════════════════════════════════════════════════════════════
// weak-points — « tes points faibles »
// Agrège, par THÈME (tag de question), les réponses de l'élève aux quiz
// pour repérer ce qu'il rate le plus. Sources :
//   - exam-blanc.js (parcours + examen officiel + révision) : tags portés
//     par les questions de data/parcours-quiz.js
//   - quiz-engine.js (Arène : post-validation + consolidation) : thèmes
//     déduits de la compétence REMC via REMC_THEME_TAGS
//   - exam-conduite.js : tags portés par les items de
//     data/exam-conduite-phases.js
// Stockage local (par appareil) : suffisant pour une révision ciblée v1.
// Évolution future : persistance DB pour le cross-device.
// ═══════════════════════════════════════════════════════════════
const KEY = "permigo_weak_points_v1";

// Tags pédagogiques → libellés FR affichables. Un tag absent d'ici n'est pas
// considéré comme un « thème » (ex. faute_eliminatoire = un flag, pas un sujet).
export const TAG_LABELS = {
  priorite: "Priorités",
  rond_point: "Ronds-points",
  vitesse: "Vitesse & distances",
  signalisation: "Signalisation",
  manoeuvre: "Manœuvres",
  cycliste: "Cyclistes",
  pieton: "Piétons",
  verification_exterieure: "Vérifs extérieures",
  verification_interieure: "Vérifs intérieures",
  premiers_secours: "Premiers secours",
  eco_conduite: "Éco-conduite",
  courtoisie: "Courtoisie",
  alcool: "Alcool",
  stupefiants: "Stupéfiants",
  permis: "Permis à points",
  equipement: "Équipement & sécurité",
};

// Compétence REMC → thèmes de révision. Approximation assumée (une question
// C2f parle bien de priorités/ronds-points) : elle permet à l'Arène de nourrir
// « Mes fautes » sans taguer une à une les questions en DB. Les compétences
// sans thème théorique évident (itinéraire, stress, présentation…) ne sont
// volontairement PAS mappées : mieux vaut rien que du bruit.
// ⚠️ N'utiliser que des tags présents dans TAG_LABELS **et** portés par des
// questions de parcours-quiz.js (sinon « Réviser » n'a rien à rejouer).
const REMC_THEME_TAGS = {
  C1a: ["verification_interieure", "verification_exterieure"],
  C1b: ["verification_interieure"],
  C1c: ["manoeuvre"],
  C1d: ["manoeuvre"],
  C1e: ["vitesse"],
  C1f: ["eco_conduite"],
  C1g: ["verification_exterieure"],
  C1h: ["manoeuvre"],
  C1i: ["manoeuvre"],
  C2a: ["signalisation"],
  C2b: ["vitesse"],
  C2c: ["manoeuvre"],
  C2d: ["vitesse"],
  C2e: ["manoeuvre"],
  C2f: ["priorite", "rond_point"],
  C2g: ["courtoisie"],
  C3a: ["verification_interieure", "vitesse"],
  C3b: ["verification_interieure", "vitesse"],
  C3c: ["vitesse"],
  C3d: ["vitesse"],
  C3e: ["vitesse", "manoeuvre"],
  C3f: ["signalisation"],
  C3g: ["pieton", "cycliste"],
  C4c: ["eco_conduite"],
  C4e: ["pieton", "cycliste", "courtoisie"],
  C4g: ["permis"],
};

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
function save(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* quota / mode privé → on ignore */
  }
}

/**
 * Enregistre une réponse pour chaque thème de la question.
 * @param {string[]} tags  tags de la question
 * @param {boolean} isCorrect
 */
export function recordAnswer(tags, isCorrect) {
  if (!Array.isArray(tags) || !tags.length) return;
  const d = load();
  for (const t of tags) {
    if (!TAG_LABELS[t]) continue; // ignore les tags non « thème »
    const e = d[t] || { seen: 0, wrong: 0 };
    e.seen += 1;
    if (!isCorrect) e.wrong += 1;
    d[t] = e;
  }
  save(d);
}

/**
 * Variante pour les quiz de compétence (Arène) : les questions DB n'ont pas
 * de tags, on enregistre sur les thèmes de la compétence REMC.
 * @param {string} competenceId  ex: "C2f"
 * @param {boolean} isCorrect
 */
export function recordCompetenceAnswer(competenceId, isCorrect) {
  recordAnswer(REMC_THEME_TAGS[competenceId] || [], isCorrect);
}

/**
 * Thèmes faibles, triés par taux d'erreur décroissant.
 * @param {{minSeen?: number, limit?: number}} opts
 * @returns {Array<{tag, label, seen, wrong, rate}>}
 */
export function getWeakPoints({ minSeen = 3, limit = 3 } = {}) {
  const d = load();
  return Object.entries(d)
    .filter(([t, e]) => TAG_LABELS[t] && e.seen >= minSeen && e.wrong > 0)
    .map(([t, e]) => ({
      tag: t,
      label: TAG_LABELS[t],
      seen: e.seen,
      wrong: e.wrong,
      rate: e.wrong / e.seen,
    }))
    .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong)
    .slice(0, limit);
}
