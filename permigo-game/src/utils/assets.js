// ═══════════════════════════════════════════════════════════════
// Assets centralisés — pointe vers les PNG premium ChatGPT
// Source : Rayan + ChatGPT (DA director)
// Tous dans /public/skins/ pour l'instant (à réorganiser plus tard)
// ═══════════════════════════════════════════════════════════════

export const ASSETS = {
  // ── Streak (remplace emoji 🔥) ─────────────────────────────────
  streakFlame: '/skins/permigo-streak-flame-v1.png',

  // ── Décor parcours élève ────────────────────────────────────────
  parcoursMap: '/skins/permigo-parcours-map-v1.png',

  // ── 4 mondes REMC (illustrations premium) ──────────────────────
  worldC1: '/skins/permigo-remc-maitrise-vehicule-flag-v1.png',
  worldC2: '/skins/permigo-remc-circulation-normale-v2.png',
  worldC3: '/skins/permigo-remc-conditions-difficiles-v1.png',
  worldC4: '/skins/permigo-autonomie-crown-v1.png',

  // ── Badges 3D (9 skins + Cercle Or) ─────────────────────────────
  // déjà câblés dans MONITEUR_SKINS et ELEVE_SKINS
  badge: n => `/skins/badge-3d-${String(n).padStart(2, '0')}.png`,
  badgeUltimate: '/skins/badge-3d-ultimate.png',
};
