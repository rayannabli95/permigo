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
    color: 'var(--a)',
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
    color: 'var(--am)',
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
    color: 'var(--bl2)',
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
    color: 'var(--pul)',
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
    color: 'var(--gr)',
    xp: 75,
    check: ({ hasPerfectQuiz }) => !!hasPerfectQuiz,
  },

  // ─── Conditions spéciales (basées sur l'heure d'activité élève) ─
  {
    id: 'night_rider',
    ico: '🌙',
    image: ASSETS.trophy.nightRider,
    nom: 'Pilote de Nuit',
    desc: 'Valide une compétence après 21h.',
    rarity: 'rare',
    color: 'var(--a)',
    xp: 80,
    check: ({ hasNightValidation }) => !!hasNightValidation,
  },

  // ─── Étapes majeures ──────────────────────────────────────────
  {
    id: 'ten_comps',
    ico: '🏔️',
    image: ASSETS.trophy.tenComps,
    nom: 'Tiers du chemin',
    desc: '10 compétences validées sur 31.',
    rarity: 'rare',
    color: 'var(--pu)',
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
    color: 'var(--am)',
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
  commun: 'var(--mu2)',
  rare: 'var(--pu)',
  'légendaire': 'var(--am)',
};
