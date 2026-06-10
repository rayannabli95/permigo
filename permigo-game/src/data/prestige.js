// ═══════════════════════════════════════════════════════════════
// Prestige — paliers évolutifs côté élève et enseignant
// Élève    : 3 paliers (tous les 10 compétences validées sur 31)
// Enseignant : 10 paliers (progression sur sa carrière de validations)
// ═══════════════════════════════════════════════════════════════

/** Tiers élève — basé sur # compétences validées (max 31) */
export const PRESTIGE_ELEVE = [
  {
    p: 0,
    threshold: 0,
    name: "Débutant",
    iconName: "zap",
    accent: "var(--mu2)",
  },
  {
    p: 1,
    threshold: 10,
    name: "Apprenti",
    iconName: "sun",
    accent: "var(--gr)",
  },
  {
    p: 2,
    threshold: 20,
    name: "Confirmé",
    iconName: "car",
    accent: "var(--a)",
  },
  {
    p: 3,
    threshold: 30,
    name: "Expert",
    iconName: "crown",
    accent: "var(--am)",
  },
];

/**
 * Skins élève — RÉUTILISE les mêmes 9 PNG que côté moniteur (/public/skins/skin-01..09.png)
 * Thresholds adaptés à l'échelle élève (1-31 compétences au lieu de 1-380 validations).
 * Cercle Or = 31 compétences = permis virtuel complet.
 */
// Élève : cadence régulière tous les 3 comp sur 31 (max = Cercle Or à 30)
export const ELEVE_SKINS = [
  {
    threshold: 3,
    slug: "premier-kilometre",
    name: "Premier kilomètre",
    accent: "var(--a)",
    image: "/skins/badge-3d-01.webp",
  },
  {
    threshold: 6,
    slug: "volant-souple",
    name: "Volant souple",
    accent: "var(--bl2)",
    image: "/skins/badge-3d-02.webp",
  },
  {
    threshold: 9,
    slug: "phares-allumes",
    name: "Phares allumés",
    accent: "#06b6d4",
    image: "/skins/badge-3d-03.webp",
  },
  {
    threshold: 12,
    slug: "boite-fluide",
    name: "Boîte fluide",
    accent: "var(--gr)",
    image: "/skins/badge-3d-04.webp",
  },
  {
    threshold: 15,
    slug: "carte-ouverte",
    name: "Carte ouverte",
    accent: "var(--bl)",
    image: "/skins/badge-3d-05.webp",
  },
  {
    threshold: 18,
    slug: "compas-cale",
    name: "Compas calé",
    accent: "var(--pul)",
    image: "/skins/badge-3d-06.webp",
  },
  {
    threshold: 21,
    slug: "tableau-pro",
    name: "Tableau pro",
    accent: "#ec4899",
    image: "/skins/badge-3d-07.webp",
  },
  {
    threshold: 24,
    slug: "maitre-artisan",
    name: "Maître artisan",
    accent: "var(--am)",
    image: "/skins/badge-3d-08.webp",
  },
  {
    threshold: 27,
    slug: "couronne-discrete",
    name: "Couronne discrète",
    accent: "#d946ef",
    image: "/skins/badge-3d-09.webp",
  },
  {
    threshold: 30,
    slug: "cercle-or",
    name: "Cercle Or",
    accent: "#f1c40f",
    image: "/skins/badge-3d-ultimate.webp",
  },
];

/**
 * Renvoie le skin élève actuel + le prochain selon le nombre de compétences validées.
 */
export function getEleveSkin(validatedCount = 0) {
  let current = null;
  let next = ELEVE_SKINS[0];
  for (let i = 0; i < ELEVE_SKINS.length; i++) {
    if (validatedCount >= ELEVE_SKINS[i].threshold) {
      current = ELEVE_SKINS[i];
      next = ELEVE_SKINS[i + 1] || null;
    } else break;
  }
  let pct = 100;
  if (next) {
    const prev = current ? current.threshold : 0;
    const span = next.threshold - prev;
    const done = validatedCount - prev;
    pct = Math.max(0, Math.min(100, Math.round((done / span) * 100)));
  }
  return { current, next, pctToNext: pct, isMax: validatedCount >= 31 };
}

/** Tiers enseignant — basé sur # validations totales faites */
export const PRESTIGE_ENSEIGNANT = [
  {
    p: 0,
    threshold: 0,
    name: "Débutant",
    iconName: "edit-3",
    accent: "var(--mu2)",
  },
  {
    p: 1,
    threshold: 10,
    name: "Confirmé",
    iconName: "book",
    accent: "#06b6d4",
  },
  {
    p: 2,
    threshold: 25,
    name: "Expert",
    iconName: "target",
    accent: "var(--bl)",
  },
  {
    p: 3,
    threshold: 50,
    name: "Mentor",
    iconName: "compass",
    accent: "var(--a)",
  },
  { p: 4, threshold: 100, name: "Coach", iconName: "zap", accent: "var(--pu)" },
  {
    p: 5,
    threshold: 200,
    name: "Maître",
    iconName: "award",
    accent: "#ec4899",
  },
  {
    p: 6,
    threshold: 350,
    name: "Légende",
    iconName: "sparkle",
    accent: "var(--am)",
  },
  {
    p: 7,
    threshold: 500,
    name: "Icône",
    iconName: "sparkle",
    accent: "var(--or)",
  },
  {
    p: 8,
    threshold: 750,
    name: "Mythique",
    iconName: "flame",
    accent: "var(--rd)",
  },
  {
    p: 9,
    threshold: 1000,
    name: "Sage",
    iconName: "lightbulb",
    accent: "#db2777",
  },
  {
    p: 10,
    threshold: 1500,
    name: "Élite",
    iconName: "gem",
    accent: "var(--puk)",
  },
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
  const tiers = role === "enseignant" ? PRESTIGE_ENSEIGNANT : PRESTIGE_ELEVE;
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
