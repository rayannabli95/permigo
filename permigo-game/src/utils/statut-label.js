// ═══════════════════════════════════════════════════════════════
// Labels statut REMC — source unique côté moniteur
// Mapping statut technique (acquis, a_valider, en_cours, a_retravailler)
//   → libellé FR lisible + couleurs.
// AFFICHAGE UNIQUEMENT. Ne JAMAIS utiliser ces clés pour la logique :
// les comparaisons restent sur la valeur brute (ex. statut === 'a_valider').
// ═══════════════════════════════════════════════════════════════

/**
 * Config par statut : { label, color, bg, dot }
 * `null` = compétence non encore évaluée.
 */
export const STATUT_CFG = {
  acquis:         { label: 'Acquis',                color: 'var(--grd)',    bg: 'rgba(16,185,129,.12)', dot: 'var(--gr)' },
  a_valider:      { label: 'En attente quiz élève', color: 'var(--amx)',    bg: 'rgba(245,158,11,.12)', dot: 'var(--am)' },
  en_cours:       { label: 'En cours',              color: 'var(--amx)',    bg: 'rgba(245,158,11,.12)', dot: 'var(--am)' },
  a_retravailler: { label: 'À retravailler',        color: 'var(--rdx)',    bg: 'rgba(239,68,68,.12)',  dot: 'var(--rd)' },
  null:           { label: 'Non évalué',            color: 'var(--ink)', bg: 'var(--su2)',           dot: 'var(--bo)' },
};

const FALLBACK = STATUT_CFG.null;

/**
 * Renvoie la config d'affichage d'un statut REMC.
 * Fallback propre (« Non évalué ») — jamais le code technique brut.
 * @param {string|null|undefined} statut
 * @returns {{label: string, color: string, bg: string, dot: string}}
 */
function statutCfg(statut) {
  if (statut == null) return FALLBACK;
  return STATUT_CFG[statut] || FALLBACK;
}

/**
 * Raccourci : libellé FR lisible d'un statut REMC.
 * @param {string|null|undefined} statut
 * @returns {string}
 */
export function statutLabel(statut) {
  return statutCfg(statut).label;
}
