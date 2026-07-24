// Tokens de marque PermiGo — copiés 1:1 depuis permigo-game/src/styles/base.css
// (ne pas inventer de couleurs : fidélité DA exacte)

export const C = {
  // Accent violet
  a: "#6c63ff",
  adk: "#4a3fc9",
  aLt: "#8e87ff",
  adx: "#4338ca",
  aInk: "#ffffff",

  // Or / Arène
  gold: "#f59e0b",
  goldDk: "#d97706",
  goldLt: "#fbbf24",
  goldPale: "#fde68a",
  orange: "#f97316",

  // Succès
  green: "#22c55e",
  greenDk: "#16a34a",
  greenDk2: "#15803d",

  // Danger / warning (rare)
  red: "#ef4444",

  // Nuit-violet (Arène / parcours)
  night: "#0f1124",
  night2: "#13162a",
  night3: "#151831",
  surfDark: "#181b30",
  surfDark2: "#1f2238",
  boDark: "#2a2e48",
  boDark4: "#3d4263",

  // Clair premium (accueil)
  bg: "#f4f5fb",
  bg2: "#eceef8",
  su: "#ffffff",
  su2: "#f8f9fd",
  bo: "#e2e6f2",
  bo3: "#e2e8f0",

  // Texte
  ink: "#0b0d1a",
  inkOnDark: "#f3f4f8",
  mu: "#5f6788",
  muOnDark: "#9da3c0",
} as const;

// Dégradés maison (recette "même teinte" de base.css : stop clair dérivé de --a)
export const GRAD = {
  // CTA plastique violet
  cta: `linear-gradient(180deg, color-mix(in srgb, ${C.a} 85%, #fff) 0%, ${C.a} 55%, ${C.adk} 100%)`,
  // Barre de progression or (parcours)
  gold: `linear-gradient(90deg, ${C.gold} 0%, ${C.orange} 100%)`,
  // Fond nuit-violet radial (Arène)
  night: `radial-gradient(120% 90% at 50% 15%, ${C.surfDark} 0%, ${C.night2} 55%, ${C.night} 100%)`,
  // Halo accent
  haloA: `radial-gradient(60% 50% at 50% 40%, color-mix(in srgb, ${C.a} 45%, transparent) 0%, transparent 70%)`,
} as const;

export const FONT = {
  // titres premium élève
  jakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
  // univers jeu / ludique
  fredoka: "'Fredoka', system-ui, sans-serif",
  baloo: "'Baloo 2', system-ui, sans-serif",
  // courant
  inter: "'Inter', system-ui, sans-serif",
  // SF Pro (police système Apple — rendue nativement par Chrome sur macOS)
  sf: '-apple-system, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
} as const;

// Format TikTok
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;
