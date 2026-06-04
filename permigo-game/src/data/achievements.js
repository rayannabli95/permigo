// ═══════════════════════════════════════════════════════════════
// Achievements élève — source de vérité UNIQUE (front).
// Miroir de la fonction SQL _achievement_meta + des triggers
// check_validation_achievements / check_streak_achievements /
// check_quiz_achievements. Déblocage = table achievements_unlocked
// (RPC get_my_achievements).
//
// ⚠️ Les clés sont historiques et ne reflètent PAS le seuil réel :
//   quiz_10  → débloqué à 5 quiz réussis (≥70%)
//   quiz_50  → débloqué à 20 quiz réussis
//   streak_60 → débloqué à 30 jours d'affilée
// Voir SEUILS ci-dessous (alignés sur les triggers serveur).
//
// Consommé par : pages/eleve/trophees.js + pages/eleve/galerie.js
// ═══════════════════════════════════════════════════════════════

export const CATALOG = [
  // Compétences
  { key: 'comp_5',         emoji: '🎯', image: '/skins/achievements/ach_comp_5.png',         title: 'Premières racines',    body: '5 compétences validées. Tu démarres fort !',                    rarity: 'commun',    xp: 50,   gemmes: 15,  group: 'Compétences' },
  { key: 'comp_10',        emoji: '🌱', image: '/skins/achievements/ach_comp_10.png',        title: '10/31',                body: 'Tu maîtrises un tiers du parcours. Belle dynamique !',          rarity: 'rare',      xp: 120,  gemmes: 30,  group: 'Compétences' },
  { key: 'comp_15',        emoji: '⚡', image: '/skins/achievements/ach_comp_15.png',        title: 'Cap des 15',            body: 'Presque la moitié du chemin. Continue !',                      rarity: 'rare',      xp: 200,  gemmes: 50,  group: 'Compétences' },
  { key: 'comp_20',        emoji: '🔥', image: '/skins/achievements/ach_comp_20.png',        title: '20 acquises',           body: "Deux tiers du parcours. L'examen approche.",                   rarity: 'epique',    xp: 300,  gemmes: 75,  group: 'Compétences' },
  { key: 'comp_25',        emoji: '💎', image: '/skins/achievements/ach_comp_25.png',        title: '25/31',                 body: 'Tu touches au but. Plus que 6 compétences !',                  rarity: 'epique',    xp: 450,  gemmes: 110, group: 'Compétences' },
  { key: 'comp_28',        emoji: '🎓', image: '/skins/achievements/ach_comp_28.png',        title: 'Prêt examen blanc',     body: "28/31. Tu peux passer ton examen blanc.",                      rarity: 'legendaire',xp: 600,  gemmes: 150, group: 'Compétences' },
  { key: 'comp_31',        emoji: '👑', image: '/skins/achievements/ach_comp_31.png',        title: '31/31 — Complet !',     body: "Toutes les compétences validées. Prêt pour l'officiel.",        rarity: 'legendaire',xp: 1000, gemmes: 300, group: 'Compétences' },
  // Séries
  { key: 'streak_3',       emoji: '🔥', image: '/skins/achievements/ach_streak_3.png',       title: '3 jours',               body: 'Premier vrai streak. Continue !',                              rarity: 'commun',    xp: 30,   gemmes: 10,  group: 'Séries' },
  { key: 'streak_14',      emoji: '🔥', image: '/skins/achievements/ach_streak_14.png',      title: 'Deux semaines',          body: 'Tu es accroché à PermiGo !',                                   rarity: 'rare',      xp: 180,  gemmes: 50,  group: 'Séries' },
  { key: 'streak_60',      emoji: '🔥', image: '/skins/achievements/ach_streak_60.png',      title: "30 jours d'affilée",    body: 'Inarrêtable. Respect.',                                        rarity: 'legendaire',xp: 800,  gemmes: 200, group: 'Séries' },
  // Quiz
  { key: 'quiz_10',        emoji: '🧠', image: '/skins/achievements/ach_quiz_10.png',        title: '5 quiz réussis',        body: 'Tu deviens un pro des quiz.',                                  rarity: 'commun',    xp: 50,   gemmes: 15,  group: 'Quiz' },
  { key: 'quiz_50',        emoji: '🧠', image: '/skins/achievements/ach_quiz_50.png',        title: '20 quiz réussis',       body: 'Mémoire en béton.',                                            rarity: 'epique',    xp: 250,  gemmes: 80,  group: 'Quiz' },
  { key: 'quiz_perfect_5', emoji: '✨', image: '/skins/achievements/ach_quiz_perfect_5.png', title: '5 quiz parfaits',        body: 'La précision incarnée.',                                       rarity: 'epique',    xp: 200,  gemmes: 60,  group: 'Quiz' },
];

export const RARITY_META = {
  commun:     { label: 'Commun',     gradient: 'linear-gradient(145deg,var(--mu4),var(--mu3))' },
  rare:       { label: 'Rare',       gradient: 'linear-gradient(145deg,var(--blk2),#60a5fa)' },
  epique:     { label: 'Épique',     gradient: 'linear-gradient(145deg,#6d28d9,#a78bfa)' },
  legendaire: { label: 'Légendaire', gradient: 'linear-gradient(145deg,var(--amx),var(--aml2))' },
};

// Couleur d'accent pleine (cartes galerie, puces rareté)
export const RARITY_COLOR = {
  commun:     'var(--mu2)',
  rare:       'var(--bl2)',
  epique:     'var(--pu)',
  legendaire: 'var(--am)',
};

// Seuils RÉELS débloqués côté serveur (triggers check_*_achievements).
export const STREAK_SEUIL = { streak_3: 3, streak_14: 14, streak_60: 30 };
export const QUIZ_SEUIL   = { quiz_10: 5, quiz_50: 20 };

// Texte de progression "objectif" pour une carte verrouillée.
export function shortProgress(key, stats = { compCount: 0, streak: 0 }) {
  if (key.startsWith('comp_')) {
    const seuil = parseInt(key.replace('comp_', ''), 10);
    return `${Math.min(stats.compCount, seuil - 1)}/${seuil} compétences`;
  }
  if (key.startsWith('streak_')) {
    const seuil = STREAK_SEUIL[key] ?? parseInt(key.replace('streak_', ''), 10);
    return `${Math.min(stats.streak, seuil - 1)}/${seuil} jours`;
  }
  if (key === 'quiz_perfect_5') return '5 quiz 100%';
  if (QUIZ_SEUIL[key])          return `${QUIZ_SEUIL[key]} quiz réussis`;
  return '?';
}
