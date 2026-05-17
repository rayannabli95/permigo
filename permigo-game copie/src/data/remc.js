/**
 * Référentiel REMC officiel — 31 sous-compétences sur 4 catégories.
 * Source : programme officiel auto-école (extrait conservé depuis v6).
 *
 * @typedef {{c: string, n: string}} SubComp
 * @typedef {{id: string, ico: string, name: string, tname: string, subs: SubComp[]}} Category
 */

/** @type {Category[]} */
export const REMC = [
  {
    id: 'C1',
    ico: '🏁',
    name: 'Maîtrise du véhicule',
    tname: 'Premiers Tours de Roues',
    subs: [
      { c: 'C1a', n: 'Organes, commandes, vérifications' },
      { c: 'C1b', n: "S'installer au poste de conduite" },
      { c: 'C1c', n: 'Tenir le volant, trajectoire' },
      { c: 'C1d', n: "Démarrer et s'arrêter" },
      { c: 'C1e', n: 'Doser accélération et freinage' },
      { c: 'C1f', n: 'Utiliser la boîte de vitesses' },
      { c: 'C1g', n: 'Contrôles de sécurité extérieure' },
      { c: 'C1h', n: 'Manœuvres : créneau, demi-tour' },
      { c: 'C1i', n: 'Autonomie sur manœuvres de base' },
    ],
  },
  {
    id: 'C2',
    ico: '🛣️',
    name: 'Circulation normale',
    tname: 'Chasseur de Routes',
    subs: [
      { c: 'C2a', n: 'Infos visuelles' },
      { c: 'C2b', n: 'Adapter sa conduite' },
      { c: 'C2c', n: 'Trajectoire et placement' },
      { c: 'C2d', n: 'Vitesse et trajectoire en virage' },
      { c: 'C2e', n: 'Croisements et dépassements' },
      { c: 'C2f', n: 'Intersections, ronds-points' },
      { c: 'C2g', n: 'Communication avec les autres usagers' },
      { c: 'C2h', n: 'Conduite en autonomie' },
    ],
  },
  {
    id: 'C3',
    ico: '⚡',
    name: 'Conditions difficiles',
    tname: 'Maître des Conditions',
    subs: [
      { c: 'C3a', n: 'Conduite de nuit' },
      { c: 'C3b', n: 'Conduite par mauvaise visibilité' },
      { c: 'C3c', n: 'Conduite sur chaussée glissante' },
      { c: 'C3d', n: 'Adhérence et freinage d\'urgence' },
      { c: 'C3e', n: 'Voies rapides et autoroutes' },
      { c: 'C3f', n: 'Tunnels, ponts, zones spécifiques' },
      { c: 'C3g', n: 'Conduite en zones urbaines denses' },
    ],
  },
  {
    id: 'C4',
    ico: '👑',
    name: 'Conduite autonome',
    tname: 'As du Volant',
    subs: [
      { c: 'C4a', n: 'Planifier un trajet' },
      { c: 'C4b', n: 'Suivre un itinéraire' },
      { c: 'C4c', n: 'Conduite éco-responsable' },
      { c: 'C4d', n: 'Anticipation et stress' },
      { c: 'C4e', n: 'Partage de la route' },
      { c: 'C4f', n: 'Présentation à l\'examen' },
      { c: 'C4g', n: 'Conduite après examen' },
    ],
  },
];

/** Total des sous-compétences. Doit valoir 31. */
export const REMC_TOTAL = REMC.reduce((sum, c) => sum + c.subs.length, 0);

/**
 * Cherche une sous-compétence par son ID (ex: "C1a").
 * @returns {SubComp | undefined}
 */
export function findSubComp(compId) {
  for (const cat of REMC) {
    const found = cat.subs.find(s => s.c === compId);
    if (found) return found;
  }
}

/**
 * Cherche la catégorie qui contient le compId.
 * @returns {Category | undefined}
 */
export function findCategory(compId) {
  return REMC.find(cat => cat.subs.some(s => s.c === compId));
}
