// ═══════════════════════════════════════════════════════════════
// Moniteur — 50 niveaux + outils débloqués
// Source : docs/MONITEUR_VISION_V3.md
// Principe : récompenses UTILES (PDF, stats, templates), pas cosmétiques
// ═══════════════════════════════════════════════════════════════

/**
 * Titre pro par tranche de niveau.
 */
function titleFor(level) {
  if (level <= 5)  return 'Moniteur en route';
  if (level <= 10) return 'Moniteur confirmé';
  if (level <= 20) return 'Enseignant chevronné';
  if (level <= 30) return 'Référent pédagogique';
  if (level <= 40) return 'Maître enseignant';
  return 'Expert REMC';
}

/**
 * Outils débloqués aux paliers clés (la "récompense utile" du tier).
 */
const UNLOCKS = {
  5:  { icon: '📄', name: 'Export PDF Livret',       desc: 'Export PDF personnalisé du livret élève' },
  10: { icon: '📊', name: 'Stats avancées élèves',   desc: 'Tableaux de bord détaillés par élève' },
  15: { icon: '📋', name: 'Templates bilan pédago',  desc: 'Modèles de bilans mensuels prêts à l\'emploi' },
  20: { icon: '🎯', name: 'Prépa examen enrichie',   desc: 'Mode préparation examen avec checkpoints' },
  25: { icon: '📈', name: 'Analytics comparatives',  desc: 'Comparaison anonyme vs cohorte nationale' },
  30: { icon: '⭐', name: 'Profil mis en avant',     desc: 'Ton profil remonte aux nouveaux élèves' },
  35: { icon: '🎓', name: 'Modules formation',       desc: 'Accès aux modules de formation continue' },
  40: { icon: '🤝', name: 'Programme mentorat',      desc: 'Accompagne d\'autres moniteurs débutants' },
  45: { icon: '🔬', name: 'Expert Hub',              desc: 'Communauté privée des experts REMC' },
  50: { icon: '💎', name: 'Cercle Or',               desc: 'Statut Expert REMC certifié PermiGo' },
};

/**
 * Threshold XP par niveau (progression douce puis exponentielle).
 * Total à N50 = ~38 500 XP = environ 1540 validations REMC (à 25 XP/validation).
 * Calcul de carrière réaliste (3-5 ans pour un moniteur actif).
 */
function thresholdFor(level) {
  if (level <= 1) return 0;
  // Progression douce : ~ 100 * level * level / 2
  return Math.round(50 * level * (level - 1));
}

/**
 * Liste complète des 50 niveaux pré-calculés (lookup rapide).
 */
export const MONITEUR_LEVELS = Array.from({ length: 50 }, (_, i) => {
  const level = i + 1;
  return {
    level,
    threshold: thresholdFor(level),
    title: titleFor(level),
    unlock: UNLOCKS[level] || null,
  };
});

/**
 * Calcule l'état du moniteur depuis son XP brut.
 * @param {number} xp
 * @returns {{
 *   current: {level, threshold, title, unlock},
 *   next: {level, threshold, title, unlock} | null,
 *   xpInLevel: number,
 *   xpToNext: number,
 *   pctInLevel: number,
 *   nextUnlock: {level, icon, name, desc} | null,
 *   xpUntilNextUnlock: number
 * }}
 */
export function getMoniteurState(xp = 0) {
  const safe = Math.max(0, xp);
  let current = MONITEUR_LEVELS[0];
  let next = MONITEUR_LEVELS[1] || null;
  for (let i = 0; i < MONITEUR_LEVELS.length; i++) {
    if (safe >= MONITEUR_LEVELS[i].threshold) {
      current = MONITEUR_LEVELS[i];
      next = MONITEUR_LEVELS[i + 1] || null;
    } else break;
  }
  const xpInLevel = safe - current.threshold;
  const xpToNext = next ? next.threshold - safe : 0;
  const span = next ? next.threshold - current.threshold : 1;
  const pctInLevel = next ? Math.round((xpInLevel / span) * 100) : 100;

  // Prochain UNLOCK utile (peut être plusieurs niveaux plus loin)
  let nextUnlock = null;
  let xpUntilNextUnlock = 0;
  for (let i = current.level; i < MONITEUR_LEVELS.length; i++) {
    const lv = MONITEUR_LEVELS[i];
    if (lv.unlock) {
      nextUnlock = { level: lv.level, ...lv.unlock };
      xpUntilNextUnlock = lv.threshold - safe;
      break;
    }
  }

  return { current, next, xpInLevel, xpToNext, pctInLevel, nextUnlock, xpUntilNextUnlock };
}
