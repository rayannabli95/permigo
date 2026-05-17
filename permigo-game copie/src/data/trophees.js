// ─── Trophées Sprint 1 ───────────────────────────────────────────
// Chaque trophée a une condition vérifiable côté client.
// "rarity" : commun | rare | légendaire

export const TROPHEES = [
  {
    id: 'first_spark',
    ico: '⚡',
    nom: 'Première Étincelle',
    desc: 'Valide ta toute première compétence REMC.',
    rarity: 'commun',
    color: '#6366f1',
    check: ({ validatedCount }) => validatedCount >= 1,
  },
  {
    id: 'streak_3',
    ico: '🔥',
    nom: 'Série de 3',
    desc: 'Maintiens ton streak 3 jours d\'affilée.',
    rarity: 'commun',
    color: '#f59e0b',
    check: ({ longestStreak }) => longestStreak >= 3,
  },
  {
    id: 'streak_7',
    ico: '🌟',
    nom: 'Semaine de Feu',
    desc: 'Maintiens ton streak 7 jours d\'affilée.',
    rarity: 'rare',
    color: '#8b5cf6',
    check: ({ longestStreak }) => longestStreak >= 7,
  },
  {
    id: 'perfect_quiz',
    ico: '🎯',
    nom: 'Quiz Parfait',
    desc: 'Obtiens 3/3 à ton premier quiz post-validation.',
    rarity: 'commun',
    color: '#10b981',
    check: ({ hasPerfectQuiz }) => hasPerfectQuiz,
  },
  {
    id: 'world_1_complete',
    ico: '👑',
    nom: 'Maître Campagne',
    desc: 'Valide toutes les compétences du Monde 1 (Maîtrise du véhicule).',
    rarity: 'légendaire',
    color: '#f59e0b',
    check: ({ c1ValidatedCount }) => c1ValidatedCount >= 9,
  },
];

export const RARITY_LABEL = {
  commun: 'Commun',
  rare: 'Rare',
  légendaire: 'Légendaire',
};

export const RARITY_COLOR = {
  commun: '#94a3b8',
  rare: '#8b5cf6',
  légendaire: '#f59e0b',
};
