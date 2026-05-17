// ═══════════════════════════════════════════════════════════════
// Prestige — paliers évolutifs côté élève et enseignant
// Élève    : 3 paliers (tous les 10 compétences validées sur 31)
// Enseignant : 10 paliers (progression sur sa carrière de validations)
// ═══════════════════════════════════════════════════════════════

/** Tiers élève — basé sur # compétences validées (max 31) */
export const PRESTIGE_ELEVE = [
  { p: 0, threshold: 0,  name: 'Débutant',  emoji: '🌱', accent: '#94a3b8' },
  { p: 1, threshold: 10, name: 'Apprenti',  emoji: '🌿', accent: '#10b981' },
  { p: 2, threshold: 20, name: 'Confirmé',  emoji: '🚗', accent: '#6366f1' },
  { p: 3, threshold: 30, name: 'Expert',    emoji: '👑', accent: '#f59e0b' },
];

/** Tiers enseignant — basé sur # validations totales faites */
export const PRESTIGE_ENSEIGNANT = [
  { p: 0,  threshold: 0,    name: 'Débutant',  emoji: '✏️', accent: '#94a3b8' },
  { p: 1,  threshold: 10,   name: 'Confirmé',  emoji: '📘', accent: '#06b6d4' },
  { p: 2,  threshold: 25,   name: 'Expert',    emoji: '🎯', accent: '#0ea5e9' },
  { p: 3,  threshold: 50,   name: 'Mentor',    emoji: '🧭', accent: '#6366f1' },
  { p: 4,  threshold: 100,  name: 'Coach',     emoji: '🚀', accent: '#8b5cf6' },
  { p: 5,  threshold: 200,  name: 'Maître',    emoji: '🏅', accent: '#ec4899' },
  { p: 6,  threshold: 350,  name: 'Légende',   emoji: '⭐', accent: '#f59e0b' },
  { p: 7,  threshold: 500,  name: 'Icône',     emoji: '🌟', accent: '#f97316' },
  { p: 8,  threshold: 750,  name: 'Mythique',  emoji: '🔥', accent: '#ef4444' },
  { p: 9,  threshold: 1000, name: 'Sage',      emoji: '🦉', accent: '#db2777' },
  { p: 10, threshold: 1500, name: 'Élite',     emoji: '💎', accent: '#7c3aed' },
];

/**
 * Calcule le tier de prestige actuel + progression vers le suivant.
 * @param {'eleve'|'enseignant'} role
 * @param {number} count  - compétences validées (élève) ou validations faites (enseignant)
 * @returns {{
 *   current: {p,threshold,name,emoji,accent},
 *   next: {p,threshold,name,emoji,accent} | null,
 *   pctToNext: number,  // 0–100
 *   max: number         // valeur maximale du barème (pour barre exp globale)
 * }}
 */
export function getPrestige(role, count = 0) {
  const tiers = role === 'enseignant' ? PRESTIGE_ENSEIGNANT : PRESTIGE_ELEVE;
  const max = tiers[tiers.length - 1].threshold;
  let current = tiers[0];
  let next = tiers[1] || null;

  for (let i = 0; i < tiers.length; i++) {
    if (count >= tiers[i].threshold) {
      current = tiers[i];
      next = tiers[i + 1] || null;
    } else break;
  }

  let pctToNext = 100;
  if (next) {
    const span = next.threshold - current.threshold;
    const done = count - current.threshold;
    pctToNext = Math.max(0, Math.min(100, Math.round((done / span) * 100)));
  }

  return { current, next, pctToNext, max };
}
