/**
 * Bibliothèque graphique Mode Pilote — lot 2 « Tableau de bord ».
 *
 * Contrat public :
 *   renderDashboardElement(type, options) -> chaîne HTML autonome
 *   renderWarningIcon(warningId, options) -> voyant SVG autonome
 *   mountDashboardElement(target, type, options) -> HTMLElement
 */

import {
  ART_PALETTE,
  createArtId,
  escapeText,
  renderElementFrame,
  safeState,
  svgShell,
} from "./art-core.js";

export const DASHBOARD_WARNINGS = Object.freeze([
  Object.freeze({
    id: "engine",
    label: "Moteur",
    tone: ART_PALETTE.gold,
  }),
  Object.freeze({
    id: "oil",
    label: "Huile",
    tone: ART_PALETTE.red,
  }),
  Object.freeze({
    id: "battery",
    label: "Batterie",
    tone: ART_PALETTE.red,
  }),
  Object.freeze({
    id: "abs",
    label: "Antiblocage",
    shortLabel: "ABS",
    tone: ART_PALETTE.gold,
  }),
  Object.freeze({
    id: "airbag",
    label: "Airbag",
    tone: ART_PALETTE.red,
  }),
  Object.freeze({
    id: "temperature",
    label: "Température",
    tone: ART_PALETTE.red,
  }),
  Object.freeze({
    id: "tyre-pressure",
    label: "Pression pneus",
    shortLabel: "Pneus",
    tone: ART_PALETTE.gold,
  }),
  Object.freeze({
    id: "handbrake",
    label: "Frein à main",
    shortLabel: "Frein",
    tone: ART_PALETTE.red,
  }),
  Object.freeze({
    id: "fuel",
    label: "Réserve",
    tone: ART_PALETTE.gold,
  }),
  Object.freeze({
    id: "esp",
    label: "Stabilité",
    shortLabel: "ESP",
    tone: ART_PALETTE.gold,
  }),
  Object.freeze({
    id: "seatbelt",
    label: "Ceinture",
    tone: ART_PALETTE.red,
  }),
  Object.freeze({
    id: "lights",
    label: "Feux",
    tone: ART_PALETTE.green,
  }),
]);

export const LOT_TWO_ELEMENTS = Object.freeze([
  Object.freeze({
    type: "instrument-cluster",
    number: 7,
    title: "Bloc compteurs",
    shortTitle: "12 voyants pilotables",
    ariaLabel: "Bloc compteurs complet avec voyant sélectionné",
  }),
  Object.freeze({
    type: "warning-lights",
    number: 8,
    title: "Les douze voyants",
    shortTitle: "Chaque voyant isolable",
    ariaLabel: "Collection des douze voyants du tableau de bord",
  }),
  Object.freeze({
    type: "tachometer",
    number: 9,
    title: "Compte-tours",
    shortTitle: "Aiguille pilotable",
    ariaLabel: "Compte-tours avec zone rouge et aiguille pilotable",
  }),
]);

const ELEMENT_TYPES = new Set(LOT_TWO_ELEMENTS.map((element) => element.type));
const WARNING_IDS = new Set(DASHBOARD_WARNINGS.map((warning) => warning.id));

function warningMeta(id) {
  return (
    DASHBOARD_WARNINGS.find((warning) => warning.id === id) ||
    DASHBOARD_WARNINGS[0]
  );
}

function safeWarning(value) {
  return WARNING_IDS.has(value) ? value : "engine";
}

function safeRpm(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(8000, Math.max(0, Math.round(numeric / 100) * 100));
}

function safeSpeed(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(130, Math.max(0, Math.round(numeric)));
}

function warningBody(id) {
  if (id === "engine") {
    return `
      <path d="M14 38H27L36 28H66L73 36H84V63H74L67 72H35L27 64H14Z"/>
      <path d="M40 28V20H57V28M84 45H92V58H84"/>`;
  }
  if (id === "oil") {
    return `
      <path d="M18 45H57L70 58 62 68H28L20 60Z"/>
      <path d="M57 45 70 36 82 45M22 45 29 35H44"/>
      <path class="pg-warning-solid" d="M82 55C76 64 74 68 74 73a8 8 0 0 0 16 0c0-5-2-9-8-18Z"/>`;
  }
  if (id === "battery") {
    return `
      <rect x="17" y="31" width="66" height="43" rx="6"/>
      <path d="M27 31V23H40V31M60 31V23H73V31M28 52H43M35.5 44.5V59.5M59 52H73"/>`;
  }
  if (id === "abs") {
    return `
      <path d="M23 24C10 38 10 62 23 76M77 24c13 14 13 38 0 52"/>
      <circle cx="50" cy="50" r="23"/>
      <circle class="pg-warning-solid" cx="50" cy="50" r="7"/>
      <path d="M50 27V38M50 62V73M27 50H38M62 50H73"/>`;
  }
  if (id === "airbag") {
    return `
      <circle class="pg-warning-solid" cx="28" cy="27" r="8"/>
      <path d="M24 38 35 47 42 68H26L17 52M34 47 51 59"/>
      <circle cx="69" cy="50" r="19"/>
      <path d="M58 62 48 75H22"/>`;
  }
  if (id === "temperature") {
    return `
      <path d="M38 24a10 10 0 0 1 20 0v31a20 20 0 1 1-20 0Z"/>
      <path d="M48 29V65"/>
      <circle class="pg-warning-solid" cx="48" cy="69" r="8"/>
      <path d="M66 66c5-5 10 5 15 0M66 76c5-5 10 5 15 0"/>`;
  }
  if (id === "tyre-pressure") {
    return `
      <path d="M20 31C11 48 13 69 27 82M80 31c9 17 7 38-7 51M27 82C41 73 59 73 73 82"/>
      <path d="M50 34V59"/>
      <circle class="pg-warning-solid" cx="50" cy="70" r="5"/>`;
  }
  if (id === "handbrake") {
    return `
      <path d="M20 23C8 38 8 62 20 77M80 23c12 15 12 39 0 54"/>
      <circle cx="50" cy="50" r="27"/>
      <path d="M50 31V55"/>
      <circle class="pg-warning-solid" cx="50" cy="67" r="5"/>`;
  }
  if (id === "fuel") {
    return `
      <rect x="19" y="22" width="43" height="57" rx="5"/>
      <rect x="28" y="31" width="25" height="16" rx="3"/>
      <path d="M25 79V87M56 79V87M14 87H68M62 34l12 11v27c0 11 14 11 14 0V52l-8-8"/>
      <circle class="pg-warning-solid" cx="84" cy="49" r="4"/>`;
  }
  if (id === "esp") {
    return `
      <path d="M25 41 34 27H66L75 41 84 46V62H16V46Z"/>
      <circle class="pg-warning-solid" cx="31" cy="64" r="7"/>
      <circle class="pg-warning-solid" cx="69" cy="64" r="7"/>
      <path d="M17 76C29 65 39 84 50 73S71 81 84 69"/>`;
  }
  if (id === "seatbelt") {
    return `
      <circle class="pg-warning-solid" cx="31" cy="24" r="9"/>
      <path d="M27 36 39 45 47 70H28L17 52M39 45 63 76M54 41H75V78H55"/>
      <path d="M20 78H82"/>`;
  }
  return `
    <path d="M20 36H51L65 64H20Z"/>
    <path d="M72 31 87 24M75 43H92M72 55l15 8M68 65l12 12"/>
    <path class="pg-warning-solid" d="M26 42H48L56 58H26Z"/>`;
}

function warningSvg(id) {
  return `
    <svg
      class="pg-warning-icon"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g class="pg-warning-glyph">
        ${warningBody(id)}
      </g>
    </svg>`;
}

/**
 * Rend un voyant isolé sans texte dans son SVG.
 */
export function renderWarningIcon(warningId, options = {}) {
  const meta = warningMeta(safeWarning(warningId));
  const lit = options.lit !== false;
  const state = safeState(options.state);
  const classes = [
    "pg-warning-asset",
    lit ? "is-lit" : "is-off",
    `is-${state}`,
    options.silhouette ? "is-silhouette" : "",
  ].filter(Boolean).join(" ");

  return `
    <span
      class="${classes}"
      data-warning-icon="${meta.id}"
      data-lit="${lit}"
      role="img"
      aria-label="${escapeText(meta.label)}"
      style="--warning-tone:${meta.tone}"
    >
      ${warningSvg(meta.id)}
    </span>`;
}

function dialTicks(cx, cy, radius, count = 13) {
  return Array.from({ length: count }, (_, index) => {
    const angle = 140 + (260 * index) / (count - 1);
    const radians = (angle * Math.PI) / 180;
    const outerX = cx + Math.cos(radians) * radius;
    const outerY = cy + Math.sin(radians) * radius;
    const innerRadius = radius - (index % 2 === 0 ? 5 : 3);
    const innerX = cx + Math.cos(radians) * innerRadius;
    const innerY = cy + Math.sin(radians) * innerRadius;
    return `<path d="M${innerX.toFixed(2)} ${innerY.toFixed(2)}L${outerX.toFixed(2)} ${outerY.toFixed(2)}"/>`;
  }).join("");
}

function polarPoint(cx, cy, radius, angle) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * radius,
    y: cy + Math.sin(radians) * radius,
  };
}

function arcPath(cx, cy, radius, startAngle, endAngle) {
  const start = polarPoint(cx, cy, radius, startAngle);
  const end = polarPoint(cx, cy, radius, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M${start.x.toFixed(2)} ${start.y.toFixed(2)}A${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function embeddedWarnings(selectedWarning, lit) {
  const selected = safeWarning(selectedWarning);
  const rows = [
    DASHBOARD_WARNINGS.slice(0, 6),
    DASHBOARD_WARNINGS.slice(6, 12),
  ];

  return rows.map((row, rowIndex) =>
    row.map((warning, columnIndex) => {
      const x = 29 + columnIndex * 20.4;
      const y = 67 + rowIndex * 12;
      const isLit = lit && warning.id === selected;
      return `
        <g
          class="pg-cluster-warning ${isLit ? "is-lit" : "is-off"}"
          data-cluster-warning="${warning.id}"
          style="--warning-tone:${warning.tone}"
          transform="translate(${x} ${y}) scale(.085) translate(-50 -50)"
        >
          ${warningBody(warning.id)}
        </g>`;
    }).join("")
  ).join("");
}

function clusterLabels(speed, rpm, warning, lit, labels = {}) {
  const selected = warningMeta(warning);
  const warningLabel = labels[selected.id] || selected.label;
  return `
    <span
      class="pg-object-label pg-cluster-speed"
      dir="auto"
      style="--label-x:50%;--label-y:43%"
    >${speed}</span>
    <span
      class="pg-object-label pg-cluster-unit"
      dir="auto"
      style="--label-x:50%;--label-y:53%"
    >${escapeText(labels.speedUnit || "km/h")}</span>
    <span
      class="pg-object-label pg-cluster-rpm"
      dir="auto"
      style="--label-x:74%;--label-y:57%"
    >${Math.round(rpm / 100) / 10}</span>
    <span
      class="pg-object-label pg-cluster-warning-name ${lit ? "is-lit" : ""}"
      dir="auto"
      style="--label-x:50%;--label-y:91%"
    >${lit ? escapeText(warningLabel) : escapeText(labels.off || "Voyants éteints")}</span>`;
}

function instrumentCluster(id, options) {
  const speed = safeSpeed(options.speed);
  const rpm = safeRpm(options.rpm);
  const warning = safeWarning(options.warning);
  const lit = options.lit !== false;
  const speedAngle = 140 + (speed / 130) * 260;
  const tachAngle = 140 + (rpm / 8000) * 260;
  const drawing = svgShell(
    id,
    `
      <ellipse class="pg-contact-shadow" cx="80" cy="84" rx="66" ry="6" fill="url(#${id}-contact)"/>
      <path class="pg-cluster-shell" d="M8 21Q16 9 31 8H129Q144 9 152 21L157 82H3Z" fill="url(#${id}-matte)"/>
      <path class="pg-key-edge" d="M15 22Q22 13 34 13H126Q138 13 145 22" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".6" stroke-width="2"/>
      <circle class="pg-dial-face" cx="43" cy="42" r="30" fill="url(#${id}-glass)"/>
      <circle class="pg-dial-face" cx="117" cy="42" r="30" fill="url(#${id}-glass)"/>
      <circle class="pg-dial-rim" cx="43" cy="42" r="28" fill="none" stroke="url(#${id}-metal)" stroke-width="3"/>
      <circle class="pg-dial-rim" cx="117" cy="42" r="28" fill="none" stroke="url(#${id}-metal)" stroke-width="3"/>
      <g class="pg-dial-ticks">${dialTicks(43, 42, 24)}</g>
      <g class="pg-dial-ticks">${dialTicks(117, 42, 24)}</g>
      <path class="pg-red-zone" d="${arcPath(117, 42, 22, 350, 400)}" fill="none" stroke="${ART_PALETTE.red}" stroke-width="4" stroke-linecap="round"/>
      <g class="pg-cluster-needle pg-cluster-speed-needle" transform="rotate(${speedAngle.toFixed(2)} 43 42)">
        <path d="M38 42H67" fill="none" stroke="${ART_PALETTE.gold}" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g class="pg-cluster-needle pg-cluster-rpm-needle" transform="rotate(${tachAngle.toFixed(2)} 117 42)">
        <path d="M112 42H141" fill="none" stroke="${ART_PALETTE.gold}" stroke-width="3" stroke-linecap="round"/>
      </g>
      <circle class="pg-needle-hub" cx="43" cy="42" r="5" fill="url(#${id}-gloss)"/>
      <circle class="pg-needle-hub" cx="117" cy="42" r="5" fill="url(#${id}-gloss)"/>
      <rect class="pg-cluster-screen" x="68" y="30" width="24" height="28" rx="5" fill="url(#${id}-glass)"/>
      ${embeddedWarnings(warning, lit)}
    `,
    "pg-drawing-cluster",
    { viewBox: "0 0 160 90" },
  );
  return {
    drawing,
    labels: clusterLabels(speed, rpm, warning, lit, options.labels),
  };
}

function warningCollection(options) {
  const selected = safeWarning(options.warning);
  const lit = options.lit !== false;
  const labels = options.labels || {};
  const cells = DASHBOARD_WARNINGS.map((warning) => {
    const isLit = lit && selected === warning.id;
    const label = labels[warning.id] || warning.shortLabel || warning.label;
    return `
      <span
        class="pg-warning-cell ${isLit ? "is-lit" : "is-off"}"
        data-warning-cell="${warning.id}"
        style="--warning-tone:${warning.tone}"
      >
        ${renderWarningIcon(warning.id, { lit: isLit, state: options.state })}
        <span class="pg-warning-label" dir="auto">${escapeText(label)}</span>
      </span>`;
  }).join("");

  return {
    drawing: `<span class="pg-warning-board" aria-hidden="true">${cells}</span>`,
    labels: "",
  };
}

function tachometerLabels(rpm, labels = {}) {
  const values = [
    ["0", "18%", "75%"],
    ["2", "22%", "34%"],
    ["4", "50%", "19%"],
    ["6", "78%", "34%"],
    ["8", "82%", "75%"],
  ];
  return `
    ${values.map(([value, x, y]) => `
      <span
        class="pg-object-label pg-tacho-number"
        style="--label-x:${x};--label-y:${y}"
      >${value}</span>`).join("")}
    <span
      class="pg-object-label pg-tacho-readout"
      dir="auto"
      style="--label-x:50%;--label-y:68%"
    >${rpm}</span>
    <span
      class="pg-object-label pg-tacho-unit"
      dir="auto"
      style="--label-x:50%;--label-y:77%"
    >${escapeText(labels.rpmUnit || "tr/min")}</span>`;
}

function tachometer(id, options) {
  const rpm = safeRpm(options.rpm);
  const angle = 140 + (rpm / 8000) * 260;
  const drawing = svgShell(id, `
    <ellipse class="pg-contact-shadow" cx="50" cy="89" rx="36" ry="6" fill="url(#${id}-contact)"/>
    <circle class="pg-tacho-shell" cx="50" cy="50" r="44" fill="url(#${id}-matte)"/>
    <circle class="pg-tacho-face" cx="50" cy="50" r="38" fill="url(#${id}-glass)"/>
    <circle class="pg-dial-rim" cx="50" cy="50" r="40" fill="none" stroke="url(#${id}-metal)" stroke-width="4"/>
    <g class="pg-dial-ticks">${dialTicks(50, 50, 34, 17)}</g>
    <path class="pg-red-zone" d="${arcPath(50, 50, 32, 350, 400)}" fill="none" stroke="${ART_PALETTE.red}" stroke-width="5" stroke-linecap="round"/>
    <g class="pg-tacho-needle" transform="rotate(${angle.toFixed(2)} 50 50)">
      <path d="M41 50H82" fill="none" stroke="${ART_PALETTE.gold}" stroke-width="4" stroke-linecap="round"/>
    </g>
    <circle class="pg-needle-hub" cx="50" cy="50" r="7" fill="url(#${id}-gloss)"/>
    <path class="pg-key-edge" d="M23 19Q50 4 77 19" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".62" stroke-width="2"/>
  `, "pg-drawing-tachometer");
  return {
    drawing,
    labels: tachometerLabels(rpm, options.labels),
  };
}

function renderByType(type, id, options) {
  if (type === "instrument-cluster") return instrumentCluster(id, options);
  if (type === "warning-lights") return warningCollection(options);
  return tachometer(id, options);
}

/**
 * Produit le HTML d'un élément du lot 2.
 *
 * @param {"instrument-cluster"|"warning-lights"|"tachometer"} type
 * @param {object} options
 * @param {"idle"|"active"|"found"|"error"} [options.state="idle"]
 * @param {string} [options.warning="engine"] - Une valeur de DASHBOARD_WARNINGS[].id.
 * @param {boolean} [options.lit=true] - Éclairage du voyant sélectionné.
 * @param {number} [options.speed=0] - Vitesse comprise entre 0 et 130.
 * @param {number} [options.rpm=0] - Valeur comprise entre 0 et 8000.
 * @param {boolean} [options.silhouette=false] - Test de lecture à 40.
 * @param {object} [options.labels] - Libellés HTML traduisibles.
 * @returns {string}
 */
export function renderDashboardElement(type, options = {}) {
  if (!ELEMENT_TYPES.has(type)) {
    throw new TypeError(`Élément tableau de bord inconnu : ${type}`);
  }

  const meta = LOT_TWO_ELEMENTS.find((element) => element.type === type);
  const state = safeState(options.state);
  const id = createArtId(type);
  const rendered = renderByType(type, id, { ...options, state });

  return renderElementFrame({
    type,
    state,
    ariaLabel: meta.ariaLabel,
    drawing: rendered.drawing,
    labels: rendered.labels,
    silhouette: options.silhouette,
    extraClasses: "pg-element-dashboard",
    extraAttributes: `data-warning="${safeWarning(options.warning)}" data-speed="${safeSpeed(options.speed)}" data-rpm="${safeRpm(options.rpm)}"`,
  });
}

export function mountDashboardElement(target, type, options = {}) {
  if (!(target instanceof Element)) {
    throw new TypeError("mountDashboardElement attend un élément DOM cible.");
  }
  target.innerHTML = renderDashboardElement(type, options);
  return target.firstElementChild;
}
