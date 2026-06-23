// ═══════════════════════════════════════════════════════════════
// Accent color — couleur d'accent choisie par l'utilisateur.
// 4 tokens (--a, --adk, --a-lt, --a-ink) → toute l'UI suit (boutons,
// FAB, badges, ombres en color-mix, etc.). Persisté en localStorage,
// appliqué tôt au boot (comme le thème).
// ═══════════════════════════════════════════════════════════════
const KEY = "permigo-accent";

// ink = couleur du texte/icône POSÉ sur l'accent (contraste).
// Teintes claires (vert/orange/cyan) → ink foncé ; teintes soutenues → blanc.
export const ACCENTS = [
  {
    id: "vert",
    name: "Vert PermiGo",
    a: "#58CC02",
    adk: "#46A302",
    lt: "#6fe016",
    ink: "#1a2800",
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
    id: "violet",
    name: "Violet",
    a: "#6d4dff",
    adk: "#4a2fc4",
    lt: "#a78bff",
    ink: "#ffffff",
  },
  {
    id: "cyan",
    name: "Cyan",
    a: "#06b6d4",
    adk: "#0e7490",
    lt: "#3ddcf0",
    ink: "#042a30",
  },
  {
    id: "orange",
    name: "Orange",
    a: "#f97316",
    adk: "#c2540a",
    lt: "#ffa24d",
    ink: "#2a1400",
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

const DEFAULT = "vert";

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

// Appliqué au tout début du boot (avant le rendu), comme initThemeEarly.
export function initAccentEarly() {
  applyAccent(getAccent());
}
