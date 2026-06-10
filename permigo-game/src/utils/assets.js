// ═══════════════════════════════════════════════════════════════
// Assets centralisés — pointe vers les PNG premium ChatGPT
// Source : Rayan + ChatGPT (DA director)
// Tous dans /public/skins/ pour l'instant (à réorganiser plus tard)
// ═══════════════════════════════════════════════════════════════

export const ASSETS = {
  // ── Streak (remplace emoji 🔥) ─────────────────────────────────
  streakFlame: '/skins/permigo-streak-flame-v1.webp',

  // ── Décor parcours élève ────────────────────────────────────────
  parcoursMap: '/skins/permigo-parcours-map-v1.webp',

  // ── 4 mondes REMC (illustrations premium) ──────────────────────
  // Monde 1 (Maîtrise du véhicule) = volant 3D (remplace le drapeau de course)
  worldC1: '/skins/permigo-volant-bg.webp',
  worldC2: '/skins/permigo-remc-circulation-normale-v3.webp',
  worldC3: '/skins/permigo-remc-conditions-difficiles-v1.webp',
  worldC4: '/skins/permigo-autonomie-crown-v1.webp',

  // ── Volant — background filigrane du parcours (1 image qui rapproche tout) ──
  volantBg: '/skins/permigo-volant-bg.webp',

  // ── Badges 3D (9 skins + Cercle Or) ─────────────────────────────
  // déjà câblés dans MONITEUR_SKINS et ELEVE_SKINS
  badge: n => `/skins/badge-3d-${String(n).padStart(2, '0')}.webp`,
  badgeUltimate: '/skins/badge-3d-ultimate.webp',

  // ── Trophées élève (8 visuels premium — streak_3 utilise emoji fallback) ───
  trophy: {
    firstValidation:  '/skins/trophy-first-validation.webp',
    streak7d:         '/skins/trophy-streak-7d.webp',
    streak30d:        '/skins/trophy-streak-30d.webp',
    firstQuizPerfect: '/skins/trophy-first-quiz-perfect.webp',
    nightRider:       '/skins/trophy-night-rider.webp',
    ecoDriver:        '/skins/trophy-eco-driver.webp',
    tenComps:         '/skins/trophy-10-comps.webp',
    permisVirtuel:    '/skins/trophy-permis-virtuel.webp',
  },

  // ── Avatars par défaut (6 choix au signup) ─────────────────────
  // Skins fournis par Rayan (skin1–6) — remplacent les anciens avatar-default-*
  avatar: [
    '/skins/avatars/skin1.png',
    '/skins/avatars/skin2.png',
    '/skins/avatars/skin3.png',
    '/skins/avatars/skin4.png',
    '/skins/avatars/skin5.png',
    '/skins/avatars/skin6.png',
  ],

  // ── Fonds carte permis (3 paliers évolutifs) ───────────────────
  // Mesh = neutre/débutant, Route = milieu, Holographic = expert
  permisBg: {
    mesh:         '/skins/permis-bg-mesh.webp',
    route:        '/skins/permis-bg-route.webp',
    holographic:  '/skins/permis-bg-holographic.webp',
  },
};

/**
 * Renvoie le fond carte permis adapté au nombre de compétences validées.
 * Système narratif : ta carte évolue avec ta progression.
 * @param {number} count - compétences validées (élève) ou validations faites (enseignant)
 * @param {'eleve'|'enseignant'} role - barème différent par rôle
 */
export function getPermisBg(count = 0, role = 'eleve') {
  if (role === 'enseignant') {
    // Enseignant : barème 10 paliers (10 → 380)
    if (count >= 230) return ASSETS.permisBg.holographic; // tier 7+
    if (count >= 100) return ASSETS.permisBg.route;       // tier 4-6
    return ASSETS.permisBg.mesh;                          // tier 1-3
  }
  // Élève : barème 31 compétences max
  if (count >= 20) return ASSETS.permisBg.holographic; // expert
  if (count >= 10) return ASSETS.permisBg.route;       // apprenti
  return ASSETS.permisBg.mesh;                         // débutant
}
