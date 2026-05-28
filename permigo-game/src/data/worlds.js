// ═══════════════════════════════════════════════════════════════
// Les 4 mondes PermiGo — mapping visuel des 4 compétences REMC
// ═══════════════════════════════════════════════════════════════
export const WORLDS = [
  {
    id: 1,
    code: 'campagne',
    nom: 'Campagne',
    titre: 'Maîtriser le véhicule',
    description: 'Les bases : démarrer, freiner, diriger.',
    couleur: 'var(--gr)', // emerald
    emoji: '🌾', // legacy fallback
    image: '/skins/permigo-remc-maitrise-vehicule-flag-v1.png',
    sousCompetences: 9, // C1a → C1i
  },
  {
    id: 2,
    code: 'ville',
    nom: 'Ville',
    titre: 'Circuler en conditions normales',
    description: 'Intersections, ronds-points, partage de la route.',
    couleur: '#06b6d4', // cyan
    emoji: '🏙️',
    image: '/skins/permigo-remc-circulation-normale-v2.png',
    sousCompetences: 8, // C2a → C2h
  },
  {
    id: 3,
    code: 'montagne',
    nom: 'Montagne',
    titre: 'Conditions difficiles',
    description: 'Autoroute, nuit, intempéries, dépassements.',
    couleur: 'var(--pu)', // violet
    emoji: '⛰️',
    image: '/skins/permigo-remc-conditions-difficiles-v1.png',
    sousCompetences: 7, // C3a → C3g
  },
  {
    id: 4,
    code: 'sommet',
    nom: 'Sommet',
    titre: 'Conduite autonome & sûre',
    description: 'Voyage longue distance, éco-conduite, sécurité.',
    couleur: 'var(--am)', // amber
    emoji: '🏔️',
    image: '/skins/permigo-autonomie-crown-v1.png',
    sousCompetences: 7, // C4a → C4g
  },
];

export function getWorld(id) {
  return WORLDS.find(w => w.id === id);
}
