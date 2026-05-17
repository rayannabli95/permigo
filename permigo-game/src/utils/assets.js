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
  worldC2: '/skins/permigo-remc-circulation-normale-v3.png',
  worldC3: '/skins/permigo-remc-conditions-difficiles-v1.png',
  worldC4: '/skins/permigo-autonomie-crown-v1.png',

  // ── Badges 3D (9 skins + Cercle Or) ─────────────────────────────
  // déjà câblés dans MONITEUR_SKINS et ELEVE_SKINS
  badge: n => `/skins/badge-3d-${String(n).padStart(2, '0')}.png`,
  badgeUltimate: '/skins/badge-3d-ultimate.png',

  // ── Trophées élève (8 visuels premium — streak_3 utilise emoji fallback) ───
  trophy: {
    firstValidation:  '/skins/trophy-first-validation.png',
    streak7d:         '/skins/trophy-streak-7d.png',
    streak30d:        '/skins/trophy-streak-30d.png',
    firstQuizPerfect: '/skins/trophy-first-quiz-perfect.png',
    nightRider:       '/skins/trophy-night-rider.png',
    ecoDriver:        '/skins/trophy-eco-driver.png',
    tenComps:         '/skins/trophy-10-comps.png',
    permisVirtuel:    '/skins/trophy-permis-virtuel.png',
  },

  // ── Avatars par défaut (6 choix au signup) ─────────────────────
  // NB : 03 et 04 ont un tiret en trop dans le fichier — conservé tel quel
  avatar: [
    '/skins/avatar-default-01.png',
    '/skins/avatar-default-02.png',
    '/skins/avatar-default-03-.png',
    '/skins/avatar-default-04-.png',
    '/skins/avatar-default-05-v2.png',
    '/skins/avatar-default-06.png',
  ],
};
