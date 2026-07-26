// ═══════════════════════════════════════════════════════════════
// Accent color — couleur d'accent choisie par l'utilisateur.
// 4 tokens (--a, --adk, --a-lt, --a-ink) → toute l'UI suit (boutons,
// FAB, badges, ombres en color-mix, etc.). Persisté en localStorage,
// appliqué tôt au boot (comme le thème).
// ═══════════════════════════════════════════════════════════════
const KEY = "permigo-accent";

// ink = couleur du texte/icône POSÉ sur l'accent (contraste).
// Les accents d'action restent assez profonds pour recevoir une encre blanche :
// même grammaire visuelle sur les CTA, sans libellés presque noirs sur couleur vive.
export const ACCENTS = [
  {
    // Violet « Arène 3D » — DA élève par défaut, raccord avec le login/quiz.
    id: "violet",
    name: "Violet PermiGo",
    a: "#6c63ff",
    adk: "#4a3fc9",
    lt: "#8e87ff",
    ink: "#ffffff",
  },
  {
    id: "vert",
    name: "Vert Duo",
    a: "#2f7d12",
    adk: "#276a0d",
    lt: "#338316",
    ink: "#ffffff",
  },
  {
    id: "bleu",
    name: "Bleu",
    a: "#2f80ed",
    adk: "#1b5fc0",
    lt: "#5aa0ff",
    ink: "#ffffff",
  },
  {
    id: "cyan",
    name: "Cyan",
    a: "#0b7188",
    adk: "#075a6c",
    lt: "#087f9b",
    ink: "#ffffff",
  },
  {
    id: "orange",
    name: "Orange",
    a: "#b8430c",
    adk: "#8f2f0a",
    lt: "#c2410c",
    ink: "#ffffff",
  },
  {
    id: "rose",
    name: "Rose",
    a: "#ec4899",
    adk: "#be185d",
    lt: "#fb7bb8",
    ink: "#ffffff",
  },
];

const DEFAULT = "violet";

export function byId(id) {
  return ACCENTS.find((x) => x.id === id) || ACCENTS[0];
}

export function getAccent() {
  try {
    return localStorage.getItem(KEY) || DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function applyAccent(id) {
  const p = byId(id);
  const r = document.documentElement.style;
  r.setProperty("--a", p.a);
  r.setProperty("--adk", p.adk);
  r.setProperty("--a-lt", p.lt);
  r.setProperty("--a-ink", p.ink);
}

export function setAccent(id) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* localStorage indispo → on applique quand même pour la session */
  }
  applyAccent(id);
}

// Migration one-time (2026-07-05) : le vert n'est plus la marque élève.
// L'ancien défaut « vert » était gravé en localStorage par l'onboarding SANS
// vrai choix de l'utilisateur → on le repasse en violet. Les autres couleurs
// (bleu/orange/rose…) sont des choix explicites (le défaut était vert) → gardées.
const MIGRATED_KEY = "permigo-accent-migrated-violet";
function migrateLegacyGreen() {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return;
    if (localStorage.getItem(KEY) === "vert")
      localStorage.setItem(KEY, "violet");
    localStorage.setItem(MIGRATED_KEY, "1");
  } catch {
    /* localStorage indispo → le défaut violet s'appliquera de toute façon */
  }
}

// Appliqué au tout début du boot (avant le rendu), comme initThemeEarly.
export function initAccentEarly() {
  migrateLegacyGreen();
  applyAccent(getAccent());
}
