/**
 * Bible graphique partagée par tous les lots du Mode Pilote.
 * Les recettes vivent ici une seule fois : aucun lot ne redéfinit sa lumière,
 * ses matières, ses états ou son étalon de taille.
 */

export const ART_PALETTE = Object.freeze({
  night: "#100922",
  n2: "#1a1038",
  n3: "#281957",
  accent: "#8b6dff",
  gold: "#f4c75e",
  green: "#38d994",
  red: "#ff766e",
});

export const ART_MATERIALS = Object.freeze({
  matte: Object.freeze({
    base: ART_PALETTE.night,
    middle: ART_PALETTE.n2,
    light: ART_PALETTE.accent,
  }),
  gloss: Object.freeze({
    base: ART_PALETTE.night,
    middle: ART_PALETTE.n3,
    light: ART_PALETTE.accent,
  }),
  glass: Object.freeze({
    base: ART_PALETTE.night,
    middle: ART_PALETTE.n2,
    light: ART_PALETTE.accent,
  }),
  metal: Object.freeze({
    base: ART_PALETTE.night,
    middle: ART_PALETTE.n3,
    light: ART_PALETTE.accent,
  }),
});

export const ART_SCALE = Object.freeze({
  wheel: 1,
  counter: 1 / 3,
  control: 1 / 10,
});

export const ELEMENT_STATES = Object.freeze([
  "idle",
  "active",
  "found",
  "error",
]);

let elementSequence = 0;

export function safeState(value) {
  return ELEMENT_STATES.includes(value) ? value : "idle";
}

export function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function createArtId(type) {
  elementSequence += 1;
  return `pg-${type}-${elementSequence}`;
}

export function materialDefs(id) {
  return `
    <defs>
      <linearGradient id="${id}-matte" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${ART_MATERIALS.matte.light}"/>
        <stop offset=".12" stop-color="${ART_MATERIALS.matte.middle}"/>
        <stop offset="1" stop-color="${ART_MATERIALS.matte.base}"/>
      </linearGradient>
      <linearGradient id="${id}-gloss" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${ART_MATERIALS.gloss.light}"/>
        <stop offset=".08" stop-color="${ART_MATERIALS.gloss.middle}"/>
        <stop offset=".22" stop-color="${ART_MATERIALS.gloss.base}"/>
        <stop offset="1" stop-color="${ART_MATERIALS.gloss.middle}"/>
      </linearGradient>
      <linearGradient id="${id}-glass" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${ART_MATERIALS.glass.base}" stop-opacity=".88"/>
        <stop offset=".46" stop-color="${ART_MATERIALS.glass.middle}" stop-opacity=".58"/>
        <stop offset=".54" stop-color="${ART_MATERIALS.glass.light}" stop-opacity=".28"/>
        <stop offset="1" stop-color="${ART_MATERIALS.glass.base}" stop-opacity=".82"/>
      </linearGradient>
      <linearGradient id="${id}-metal" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="${ART_MATERIALS.metal.base}"/>
        <stop offset=".34" stop-color="${ART_MATERIALS.metal.light}"/>
        <stop offset=".5" stop-color="${ART_MATERIALS.metal.middle}"/>
        <stop offset=".66" stop-color="${ART_MATERIALS.metal.light}"/>
        <stop offset="1" stop-color="${ART_MATERIALS.metal.base}"/>
      </linearGradient>
      <radialGradient id="${id}-contact" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="${ART_PALETTE.night}" stop-opacity=".72"/>
        <stop offset="1" stop-color="${ART_PALETTE.night}" stop-opacity="0"/>
      </radialGradient>
    </defs>`;
}

export function svgShell(id, body, className = "", options = {}) {
  const sweep = options.sweep === false
    ? ""
    : `
      <path
        class="pg-glass-sweep"
        d="M18 22 65 10 82 18 35 30Z"
        fill="url(#${id}-glass)"
      />`;

  return `
    <svg
      class="pg-drawing ${className}"
      viewBox="${options.viewBox || "0 0 100 100"}"
      preserveAspectRatio="${options.preserveAspectRatio || "xMidYMid meet"}"
      aria-hidden="true"
      focusable="false"
    >
      ${materialDefs(id)}
      ${body}
      ${sweep}
    </svg>`;
}

export function renderElementFrame({
  type,
  state,
  ariaLabel,
  drawing,
  labels = "",
  silhouette = false,
  extraClasses = "",
  extraAttributes = "",
}) {
  const classes = [
    "pg-element",
    `pg-element-${type}`,
    `is-${state}`,
    silhouette ? "is-silhouette" : "",
    extraClasses,
  ].filter(Boolean).join(" ");

  return `
    <div
      class="${classes}"
      data-driving-element="${type}"
      data-state="${state}"
      role="img"
      aria-label="${escapeText(ariaLabel)}"
      ${extraAttributes}
    >
      <span class="pg-light pg-light-key" aria-hidden="true"></span>
      <span class="pg-light pg-light-warm" aria-hidden="true"></span>
      ${drawing}
      <span class="pg-label-layer" aria-hidden="true">
        ${labels}
      </span>
      <span class="pg-state-marker" aria-hidden="true"><i></i></span>
    </div>`;
}
