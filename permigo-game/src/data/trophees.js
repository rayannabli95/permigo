// ═══════════════════════════════════════════════════════════════
// Trophées élève — 8 trophées avec visuels premium ChatGPT
//
// Chaque trophée a :
//  - ico   : emoji fallback (si image manquante)
//  - image : PNG premium /skins/ (préféré si présent)
//  - check : fn pure (contexte → bool)
//
// Boucle dopamine : 1 trophée tous les 3-5 jours d'activité régulière
// → micro-victoires (Duolingo) + collection visible (Clash Royale)
// ═══════════════════════════════════════════════════════════════
import { ASSETS } from '@/utils/assets.js';

export const TROPHEES = [
  // ─── Onboarding ───────────────────────────────────────────────
  {
    id: 'first_spark',
    ico: '⚡',
    image: ASSETS.trophy.firstValidation,
    nom: 'Première Étincelle',
    desc: 'Valide ta toute première compétence REMC.',
    rarity: 'commun',
    color: '#6366f1',
    xp: 50,
    check: ({ validatedCount }) => validatedCount >= 1,
  },

  // ─── Streak ───────────────────────────────────────────────────
  {
    id: 'streak_3',
    ico: '🔥',
    image: null, // pas d'asset dédié, on garde l'emoji
    nom: 'Série de 3',
    desc: 'Maintiens ton streak 3 jours d\'affilée.',
    rarity: 'commun',
    color: '#f59e0b',
    xp: 50,
    check: ({ longestStreak }) => longestStreak >= 3,
  },
  {
    id: 'streak_7',
    ico: '🌟',
    image: ASSETS.trophy.streak7d,
    nom: 'Semaine de Feu',
    desc: 'Maintiens ton streak 7 jours d\'affilée.',
    rarity: 'rare',
    color: '#3b82f6',
    xp: 100,
    check: ({ longestStreak }) => longestStreak >= 7,
  },
  {
    id: 'streak_30',
    ico: '💎',
    image: ASSETS.trophy.streak30d,
    nom: 'Mois sans rater',
    desc: '30 jours consécutifs — discipline d\'acier.',
    rarity: 'légendaire',
    color: '#a855f7',
    xp: 500,
    check: ({ longestStreak }) => longestStreak >= 30,
  },

  // ─── Quiz ─────────────────────────────────────────────────────
  {
    id: 'perfect_quiz',
    ico: '🎯',
    image: ASSETS.trophy.firstQuizPerfect,
    nom: 'Sans-Faute',
    desc: 'Obtiens 100 % à ton premier quiz post-validation.',
    rarity: 'commun',
    color: '#10b981',
    xp: 75,
    check: ({ hasPerfectQuiz }) => !!hasPerfectQuiz,
  },

  // ─── Conditions spéciales (déclenchables côté moniteur via flag leçon) ─
  {
    id: 'night_rider',
    ico: '🌙',
    image: ASSETS.trophy.nightRider,
    nom: 'Pilote de Nuit',
    desc: 'Réalise une leçon programmée après 21h.',
    rarity: 'rare',
    color: '#6366f1',
    xp: 80,
    check: ({ hasNightSession }) => !!hasNightSession,
  },
  {
    id: 'eco_driver',
    ico: '🌿',
    image: ASSETS.trophy.ecoDriver,
    nom: 'Éco-Pilote',
    desc: 'Réalise une leçon dédiée à l\'éco-conduite.',
    rarity: 'rare',
    color: '#10b981',
    xp: 80,
    check: ({ hasEcoSession }) => !!hasEcoSession,
  },

  // ─── Étapes majeures ──────────────────────────────────────────
  {
    id: 'ten_comps',
    ico: '🏔️',
    image: ASSETS.trophy.tenComps,
    nom: 'Tiers du chemin',
    desc: '10 compétences validées sur 31.',
    rarity: 'rare',
    color: '#8b5cf6',
    xp: 150,
    check: ({ validatedCount }) => validatedCount >= 10,
  },
  {
    id: 'permis_virtuel',
    ico: '👑',
    image: ASSETS.trophy.permisVirtuel,
    nom: 'Permis Virtuel',
    desc: 'Les 31 compétences validées — prêt pour l\'examen.',
    rarity: 'légendaire',
    color: '#f59e0b',
    xp: 1000,
    check: ({ validatedCount }) => validatedCount >= 31,
  },
];

export const RARITY_LABEL = {
  commun: 'Commun',
  rare: 'Rare',
  'légendaire': 'Légendaire',
};

export const RARITY_COLOR = {
  commun: '#94a3b8',
  rare: '#8b5cf6',
  'légendaire': '#f59e0b',
};
