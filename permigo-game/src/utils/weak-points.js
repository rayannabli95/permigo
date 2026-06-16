// ═══════════════════════════════════════════════════════════════
// weak-points — « tes points faibles »
// Agrège, par THÈME (tag de question), les réponses de l'élève aux quiz
// (parcours + examen officiel + révision) pour repérer ce qu'il rate le plus.
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
