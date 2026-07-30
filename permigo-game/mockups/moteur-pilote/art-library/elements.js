/**
 * Bibliothèque graphique Mode Pilote — lot 1 « Pieds et boîte ».
 *
 * Contrat public :
 *   renderDrivingElement(type, options) -> chaîne HTML autonome
 *   mountDrivingElement(target, type, options) -> HTMLElement
 *
 * Les SVG ne contiennent aucun texte. Les libellés traduisibles sont des
 * éléments HTML superposés et peuvent être remplacés via options.labels.
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

export const LOT_ONE_ELEMENTS = Object.freeze([
  Object.freeze({
    type: "manual-pedals",
    number: 1,
    title: "Pédalier manuel",
    shortTitle: "3 pédales",
    ariaLabel: "Pédalier manuel à trois pédales vu depuis le siège",
  }),
  Object.freeze({
    type: "clutch-foot",
    number: 2,
    title: "Embrayage enfoncé",
    shortTitle: "Pied gauche",
    ariaLabel: "Pied gauche enfonçant complètement la pédale d’embrayage",
  }),
  Object.freeze({
    type: "automatic-pedals",
    number: 3,
    title: "Pédalier automatique",
    shortTitle: "2 pédales",
    ariaLabel: "Pédalier automatique avec frein, accélérateur et repose-pied",
  }),
  Object.freeze({
    type: "brake-foot",
    number: 4,
    title: "Frein enfoncé",
    shortTitle: "Pied droit",
    ariaLabel: "Pied droit enfonçant complètement la pédale de frein",
  }),
  Object.freeze({
    type: "automatic-selector",
    number: 5,
    title: "Sélecteur automatique",
    shortTitle: "P R N D",
    ariaLabel: "Sélecteur automatique avec position éclairée",
  }),
  Object.freeze({
    type: "manual-shifter",
    number: 6,
    title: "Levier manuel",
    shortTitle: "6 rapports",
    ariaLabel: "Levier manuel et sa grille avec rapport éclairé",
  }),
]);

const ELEMENT_TYPES = new Set(LOT_ONE_ELEMENTS.map((element) => element.type));
const SELECTOR_POSITIONS = Object.freeze(["P", "R", "N", "D"]);
const GEAR_POSITIONS = Object.freeze(["1", "2", "3", "4", "5", "6", "R", "N"]);

const DEFAULT_LABELS = Object.freeze({
  clutch: "Embrayage",
  brake: "Frein",
  accelerator: "Accélérateur",
  footrest: "Repose-pied",
  selector: Object.freeze({ P: "P", R: "R", N: "N", D: "D" }),
  gears: Object.freeze({
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    R: "R",
    N: "N",
  }),
});

let elementSequence = 0;

function safeState(value) {
  return ELEMENT_STATES.includes(value) ? value : "idle";
}

function safeSelectorPosition(value) {
  return SELECTOR_POSITIONS.includes(value) ? value : "D";
}

function safeGear(value) {
  return GEAR_POSITIONS.includes(value) ? value : "1";
}

function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createId(type) {
  elementSequence += 1;
  return `pg-${type}-${elementSequence}`;
}

function materialDefs(id) {
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

function svgShell(id, body, className = "") {
  return `
    <svg
      class="pg-drawing ${className}"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      ${materialDefs(id)}
      ${body}
      <path
        class="pg-glass-sweep"
        d="M18 22 65 10 82 18 35 30Z"
        fill="url(#${id}-glass)"
      />
    </svg>`;
}

function pedalPad(id, x, y, width, height, kind, pressed = false) {
  const padY = pressed ? y + 8 : y;
  const armBottom = pressed ? padY + 2 : padY;
  const radius = kind === "accelerator" ? 4 : 7;
  return `
    <path
      class="pg-pedal-arm"
      d="M${x + width / 2} 19 C${x + width / 2} 29 ${x + width / 2 - 2} ${armBottom - 5} ${x + width / 2} ${armBottom + 3}"
      fill="none"
      stroke="url(#${id}-metal)"
      stroke-width="5"
      stroke-linecap="round"
    />
    <rect
      class="pg-pedal-pad pg-pedal-${kind}"
      x="${x}"
      y="${padY}"
      width="${width}"
      height="${height}"
      rx="${radius}"
      fill="url(#${id}-gloss)"
    />
    <path
      class="pg-pedal-grip"
      d="M${x + 4} ${padY + 8}H${x + width - 4}M${x + 4} ${padY + height / 2}H${x + width - 4}M${x + 4} ${padY + height - 8}H${x + width - 4}"
      fill="none"
      stroke="${ART_PALETTE.accent}"
      stroke-opacity=".58"
      stroke-width="2"
      stroke-linecap="round"
    />`;
}

function footShape(id, side) {
  const isLeft = side === "left";
  const legPath = isLeft
    ? "M31 94 C28 83 27 73 30 62 L42 59 C47 70 49 83 48 94Z"
    : "M55 94 C51 83 51 73 54 61 L66 59 C71 71 73 84 72 94Z";
  const shoePath = isLeft
    ? "M31 65 C25 65 14 62 12 57 C10 51 14 45 20 43 C28 42 38 48 43 57 L42 64Z"
    : "M55 65 C50 64 43 61 41 56 C39 50 44 44 50 42 C58 42 67 48 68 57 L66 63Z";
  const highlightPath = isLeft
    ? "M18 49 C26 47 35 52 39 58"
    : "M47 48 C55 46 63 51 65 57";
  return `
    <ellipse
      class="pg-contact-shadow"
      cx="${isLeft ? 36 : 61}"
      cy="89"
      rx="20"
      ry="6"
      fill="url(#${id}-contact)"
    />
    <path
      class="pg-foot pg-foot-${side}"
      d="${legPath}"
      fill="url(#${id}-matte)"
    />
    <path
      class="pg-shoe pg-shoe-${side}"
      d="${shoePath}"
      fill="url(#${id}-gloss)"
    />
    <path
      class="pg-foot-highlight"
      d="${highlightPath}"
      fill="none"
      stroke="${ART_PALETTE.accent}"
      stroke-opacity=".64"
      stroke-width="3"
      stroke-linecap="round"
    />`;
}

function pedalLabels(kind, labels) {
  const positions = kind === "manual"
    ? [
        ["clutch", "20%", "86%"],
        ["brake", "50%", "86%"],
        ["accelerator", "79%", "86%"],
      ]
    : [
        ["footrest", "17%", "86%"],
        ["brake", "55%", "86%"],
        ["accelerator", "82%", "86%"],
      ];

  return positions.map(([key, x, y]) => `
    <span
      class="pg-object-label pg-object-label-${key}"
      data-label-key="${key}"
      dir="auto"
      style="--label-x:${x};--label-y:${y}"
    >${escapeText(labels[key])}</span>`).join("");
}

function manualPedals(id, labels) {
  const drawing = svgShell(id, `
    <path class="pg-footwell-floor" d="M7 10H93L88 94H12Z" fill="url(#${id}-matte)"/>
    <path class="pg-key-edge" d="M10 12H90" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".5" stroke-width="2"/>
    <ellipse class="pg-contact-shadow" cx="50" cy="84" rx="38" ry="7" fill="url(#${id}-contact)"/>
    ${pedalPad(id, 13, 43, 21, 31, "clutch")}
    ${pedalPad(id, 40, 41, 22, 34, "brake")}
    ${pedalPad(id, 72, 35, 14, 43, "accelerator")}
  `, "pg-drawing-pedals");
  return { drawing, labels: pedalLabels("manual", labels) };
}

function clutchFoot(id, labels) {
  const drawing = svgShell(id, `
    <path class="pg-footwell-floor" d="M7 10H93L88 94H12Z" fill="url(#${id}-matte)"/>
    <path class="pg-key-edge" d="M10 12H90" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".5" stroke-width="2"/>
    ${pedalPad(id, 13, 43, 21, 31, "clutch", true)}
    ${pedalPad(id, 40, 41, 22, 34, "brake")}
    ${pedalPad(id, 72, 35, 14, 43, "accelerator")}
    ${footShape(id, "left")}
  `, "pg-drawing-pedals pg-drawing-foot");
  return { drawing, labels: pedalLabels("manual", labels) };
}

function footrest(id) {
  return `
    <path
      class="pg-footrest"
      d="M11 38 30 34 34 77 8 78Z"
      fill="url(#${id}-matte)"
    />
    <path
      class="pg-footrest-ribs"
      d="M13 45 29 42M12 54 30 51M11 63 31 60M10 72 32 69"
      fill="none"
      stroke="${ART_PALETTE.accent}"
      stroke-opacity=".46"
      stroke-width="2"
      stroke-linecap="round"
    />`;
}

function automaticPedals(id, labels) {
  const drawing = svgShell(id, `
    <path class="pg-footwell-floor" d="M7 10H93L88 94H12Z" fill="url(#${id}-matte)"/>
    <path class="pg-key-edge" d="M10 12H90" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".5" stroke-width="2"/>
    <ellipse class="pg-contact-shadow" cx="53" cy="84" rx="39" ry="7" fill="url(#${id}-contact)"/>
    ${footrest(id)}
    ${pedalPad(id, 43, 40, 24, 36, "brake")}
    ${pedalPad(id, 76, 34, 13, 44, "accelerator")}
  `, "pg-drawing-pedals");
  return { drawing, labels: pedalLabels("automatic", labels) };
}

function brakeFoot(id, labels) {
  const drawing = svgShell(id, `
    <path class="pg-footwell-floor" d="M7 10H93L88 94H12Z" fill="url(#${id}-matte)"/>
    <path class="pg-key-edge" d="M10 12H90" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".5" stroke-width="2"/>
    ${footrest(id)}
    ${pedalPad(id, 43, 40, 24, 36, "brake", true)}
    ${pedalPad(id, 76, 34, 13, 44, "accelerator")}
    ${footShape(id, "right")}
  `, "pg-drawing-pedals pg-drawing-foot");
  return { drawing, labels: pedalLabels("automatic", labels) };
}

function selectorLabels(position, lit, labels) {
  const yPositions = { P: "24%", R: "40%", N: "56%", D: "72%" };
  return SELECTOR_POSITIONS.map((value) => `
    <span
      class="pg-object-label pg-selector-label ${lit && value === position ? "is-lit" : ""}"
      data-selector-label="${value}"
      dir="auto"
      style="--label-x:76%;--label-y:${yPositions[value]}"
    >${escapeText(labels.selector[value])}</span>`).join("");
}

function automaticSelector(id, options, labels) {
  const position = safeSelectorPosition(options.position);
  const lit = options.lit !== false;
  const yPositions = { P: 25, R: 41, N: 57, D: 73 };
  const handleY = yPositions[position];

  const drawing = svgShell(id, `
    <ellipse class="pg-contact-shadow" cx="49" cy="88" rx="31" ry="7" fill="url(#${id}-contact)"/>
    <path class="pg-selector-console" d="M20 10H80L87 90H13Z" fill="url(#${id}-matte)"/>
    <path class="pg-key-edge" d="M23 13H77" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".6" stroke-width="2"/>
    <rect class="pg-selector-glass" x="61" y="17" width="24" height="64" rx="11" fill="url(#${id}-glass)"/>
    <rect class="pg-selector-rail" x="28" y="19" width="18" height="61" rx="9" fill="${ART_PALETTE.night}"/>
    <path
      class="pg-selector-track"
      d="M37 26V73"
      fill="none"
      stroke="${ART_PALETTE.n3}"
      stroke-width="5"
      stroke-linecap="round"
    />
    <path
      class="pg-selector-stem"
      d="M37 ${handleY} 48 ${handleY - 4}"
      fill="none"
      stroke="url(#${id}-metal)"
      stroke-width="6"
      stroke-linecap="round"
    />
    <rect
      class="pg-selector-handle"
      x="43"
      y="${handleY - 14}"
      width="22"
      height="25"
      rx="9"
      fill="url(#${id}-gloss)"
    />
    <path
      class="pg-selector-handle-light"
      d="M48 ${handleY - 9}H59"
      fill="none"
      stroke="${lit ? ART_PALETTE.gold : ART_PALETTE.accent}"
      stroke-opacity="${lit ? "1" : ".45"}"
      stroke-width="3"
      stroke-linecap="round"
    />
  `, "pg-drawing-selector");

  return {
    drawing,
    labels: selectorLabels(position, lit, labels),
  };
}

function gearLabels(gear, lit, labels) {
  const positions = {
    "1": ["25%", "21%"],
    "2": ["25%", "72%"],
    "3": ["50%", "21%"],
    "4": ["50%", "72%"],
    "5": ["75%", "21%"],
    "6": ["75%", "72%"],
    R: ["88%", "72%"],
    N: ["50%", "48%"],
  };

  return GEAR_POSITIONS.map((value) => {
    const [x, y] = positions[value];
    return `
      <span
        class="pg-object-label pg-gear-label ${lit && value === gear ? "is-lit" : ""}"
        data-gear-label="${value}"
        dir="auto"
        style="--label-x:${x};--label-y:${y}"
      >${escapeText(labels.gears[value])}</span>`;
  }).join("");
}

function manualShifter(id, options, labels) {
  const gear = safeGear(options.gear);
  const lit = options.lit !== false;
  const positions = {
    "1": [28, 31],
    "2": [28, 69],
    "3": [50, 31],
    "4": [50, 69],
    "5": [72, 31],
    "6": [72, 69],
    R: [84, 69],
    N: [50, 50],
  };
  const [knobX, knobY] = positions[gear];

  const drawing = svgShell(id, `
    <ellipse class="pg-contact-shadow" cx="50" cy="88" rx="36" ry="8" fill="url(#${id}-contact)"/>
    <path class="pg-shifter-console" d="M11 11H89L94 91H6Z" fill="url(#${id}-matte)"/>
    <path class="pg-key-edge" d="M15 14H85" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".6" stroke-width="2"/>
    <ellipse class="pg-shifter-boot" cx="50" cy="66" rx="27" ry="21" fill="url(#${id}-gloss)"/>
    <path
      class="pg-shifter-grid"
      d="M28 31V69M50 31V69M72 31V69M28 50H72M72 50H84V69"
      fill="none"
      stroke="${ART_PALETTE.n3}"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      class="pg-shifter-stem"
      d="M50 69 50 54 ${knobX} ${knobY}"
      fill="none"
      stroke="url(#${id}-metal)"
      stroke-width="6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle
      class="pg-shifter-knob"
      cx="${knobX}"
      cy="${knobY}"
      r="12"
      fill="url(#${id}-gloss)"
    />
    <path
      class="pg-shifter-knob-light"
      d="M${knobX - 5} ${knobY - 4}Q${knobX} ${knobY - 8} ${knobX + 5} ${knobY - 4}"
      fill="none"
      stroke="${lit ? ART_PALETTE.gold : ART_PALETTE.accent}"
      stroke-opacity="${lit ? "1" : ".45"}"
      stroke-width="3"
      stroke-linecap="round"
    />
  `, "pg-drawing-shifter");

  return {
    drawing,
    labels: gearLabels(gear, lit, labels),
  };
}

function renderByType(type, id, options, labels) {
  if (type === "manual-pedals") return manualPedals(id, labels);
  if (type === "clutch-foot") return clutchFoot(id, labels);
  if (type === "automatic-pedals") return automaticPedals(id, labels);
  if (type === "brake-foot") return brakeFoot(id, labels);
  if (type === "automatic-selector") {
    return automaticSelector(id, options, labels);
  }
  return manualShifter(id, options, labels);
}

function mergeLabels(labels = {}) {
  return {
    ...DEFAULT_LABELS,
    ...labels,
    selector: { ...DEFAULT_LABELS.selector, ...(labels.selector || {}) },
    gears: { ...DEFAULT_LABELS.gears, ...(labels.gears || {}) },
  };
}

/**
 * Produit le HTML d'un élément du lot 1.
 *
 * @param {string} type - Une valeur de LOT_ONE_ELEMENTS[].type.
 * @param {object} options
 * @param {"idle"|"active"|"found"|"error"} [options.state="idle"]
 * @param {"P"|"R"|"N"|"D"} [options.position="D"] - Sélecteur automatique.
 * @param {"1"|"2"|"3"|"4"|"5"|"6"|"R"|"N"} [options.gear="1"] - Levier manuel.
 * @param {boolean} [options.lit=true] - Éclairage de la position active.
 * @param {boolean} [options.silhouette=false] - Test de lecture à 40.
 * @param {object} [options.labels] - Libellés HTML traduisibles.
 * @returns {string}
 */
export function renderDrivingElement(type, options = {}) {
  if (!ELEMENT_TYPES.has(type)) {
    throw new TypeError(`Élément Mode Pilote inconnu : ${type}`);
  }

  const meta = LOT_ONE_ELEMENTS.find((element) => element.type === type);
  const state = safeState(options.state);
  const id = createId(type);
  const labels = mergeLabels(options.labels);
  const rendered = renderByType(type, id, options, labels);
  const classes = [
    "pg-element",
    `pg-element-${type}`,
    `is-${state}`,
    options.silhouette ? "is-silhouette" : "",
  ].filter(Boolean).join(" ");

  return `
    <div
      class="${classes}"
      data-driving-element="${type}"
      data-state="${state}"
      role="img"
      aria-label="${meta.ariaLabel}"
    >
      <span class="pg-light pg-light-key" aria-hidden="true"></span>
      <span class="pg-light pg-light-warm" aria-hidden="true"></span>
      ${rendered.drawing}
      <span class="pg-label-layer" aria-hidden="true">
        ${rendered.labels}
      </span>
      <span class="pg-state-marker" aria-hidden="true"><i></i></span>
    </div>`;
}

/**
 * Monte un élément et retourne son nœud racine.
 */
export function mountDrivingElement(target, type, options = {}) {
  if (!(target instanceof Element)) {
    throw new TypeError("mountDrivingElement attend un élément DOM cible.");
  }
  target.innerHTML = renderDrivingElement(type, options);
  return target.firstElementChild;
}
