// ═══════════════════════════════════════════════════════════════
// Quiz Visuals — banque de visuels pédagogiques ANIMÉS pour les
// questions de quiz (Arène). SVG dessinés main dans le style des
// scènes « En situation » (situation-scene.js), animés en CSS
// keyframes (transform/opacity uniquement), zéro lib externe.
//
// Principe : des BRIQUES paramétrables (cockpit, pédales, levier,
// feu tricolore, panneau vedette, scène routière iso, distance)
// + un résolveur `quizVisualHTML(texte)` qui mappe un énoncé vers
// une brique via des règles regex. Toute question non mappée →
// chaîne vide → l'affichage texte actuel reste inchangé.
//
// Anti-fuite : le visuel illustre la SITUATION (ce que l'énoncé
// dit déjà), jamais la bonne réponse. Des règles-bloqueurs (vis:
// null) coupent les cas où un visuel générique contredirait
// l'énoncé (« stop peint au sol sans panneau », cyclistes…).
//
// Intégration : quiz-ui.js (questionHTML) + exam-blanc.js. Le CSS
// est exporté via QUIZ_VISUAL_STYLE (à inclure une fois par surface).
// ═══════════════════════════════════════════════════════════════

import {
  renderSituationScene,
  buildFocusFX,
} from "@/components/eleve/situation-scene.js";

// ── Palette (alignée sur situation-scene + DA Arène) ────────────
const C = {
  dash: "#20243a", // masse du tableau de bord
  dashHi: "#2e3452",
  dark: "#171a2c", // fond cluster / pneus
  metal: "#3a4152", // tiges, contours
  steel: "#8b93a8", // texte discret / mâts
  line: "#f3f4f8", // blanc marquage
  gold: "#ffcb3d",
  red: "#ff5252",
  redSign: "#e02b2b",
  blue: "#1e74d6",
  green: "#4caf50",
  amber: "#ffb300",
  night1: "#2b2564", // ciel nuit-violet (pare-brise)
  night2: "#141039",
  road: "#4b4e66",
};

// ═══════════════════════════════════════════════════════════════
// Briques
// ═══════════════════════════════════════════════════════════════

function wrap(kind, inner, { fx = "" } = {}) {
  const fxHtml = fx ? `<div class="qzv-fx qzv-fx-${fx}"></div>` : "";
  return `<div class="qzv qzv-${kind}" aria-hidden="true">${inner}${fxHtml}</div>`;
}

/** Halo doré pulsé derrière un élément à mettre en avant. */
function halo(cx, cy, rx = 26, ry = 16) {
  return `<ellipse class="qzv-halo" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(255,203,61,.14)" stroke="${C.gold}" stroke-width="2.5"/>`;
}

// ── Brique 1 : cockpit (poste de conduite vu du conducteur) ─────
// opts: { hl: ["comodoG","comodoD","retro","volant"], clign:"gauche"|"droit",
//         voyants: [["batterie","rouge","blink"?], …], wheelDots, pluie }
const VOYANT_GLYPHS = {
  batterie: `<rect x="-6" y="-3.6" width="12" height="8" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M -4 -3.6 v -2 M 4 -3.6 v -2" stroke="currentColor" stroke-width="1.7"/><path d="M -3.6 0 h 3 M 1 0 h 3 M 2.5 -1.5 v 3" stroke="currentColor" stroke-width="1.2"/>`,
  huile: `<path d="M -5.5 1.5 q 0 -4.5 5 -4.5 l 2 -2 h 2.5 M -0.5 -3 l 5 2.5 2.5 -1.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M -5.5 1.5 h 10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  moteur: `<path d="M -5.5 -1 h 2 v -2.5 h 4 l 1.5 2 h 3.5 v 5 h -2 l -1.5 1.5 h -5 l -1.5 -2 h -1 z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  esp: `<text x="0" y="2.6" text-anchor="middle" font-family="'Archivo',sans-serif" font-size="7.5" font-weight="800" fill="currentColor">ESP</text>`,
  abs: `<text x="0" y="2.6" text-anchor="middle" font-family="'Archivo',sans-serif" font-size="7.5" font-weight="800" fill="currentColor">ABS</text>`,
  pneu: `<path d="M -4.5 -4 q -2.5 4 0 8 M 4.5 -4 q 2.5 4 0 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M 0 -3 v 3.6 M 0 3 v .01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  frein: `<circle cx="0" cy="0" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M 0 -2.2 v 2.8 M 0 2 v .01 M -6.5 -3.5 q -2 3.5 0 7 M 6.5 -3.5 q 2 3.5 0 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
};

function cockpitSVG(opts = {}) {
  const hl = opts.hl || [];
  const has = (k) => hl.includes(k);

  // pare-brise : nuit-violet + route qui file vers l'horizon
  const windshield = `
    <defs>
      <linearGradient id="qzvSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.night1}"/><stop offset="1" stop-color="${C.night2}"/>
      </linearGradient>
      <clipPath id="qzvWs"><rect x="0" y="0" width="360" height="128"/></clipPath>
    </defs>
    <rect x="0" y="0" width="360" height="128" fill="url(#qzvSky)"/>
    <g clip-path="url(#qzvWs)">
      <circle cx="60" cy="30" r="1.4" fill="rgba(255,255,255,.5)"/>
      <circle cx="300" cy="24" r="1.2" fill="rgba(255,220,140,.55)"/>
      <circle cx="255" cy="44" r="1.1" fill="rgba(255,255,255,.35)"/>
      <circle cx="105" cy="52" r="1.2" fill="rgba(190,170,255,.45)"/>
      <rect x="0" y="72" width="360" height="56" fill="#2c3050"/>
      <polygon points="140,126 220,126 191,74 169,74" fill="${C.road}"/>
      <g class="qzv-roll">
        <rect x="178" y="80" width="4" height="9" rx="2" fill="${C.line}" opacity=".8"/>
        <rect x="177.4" y="98" width="5.2" height="11" rx="2.4" fill="${C.line}" opacity=".85"/>
        <rect x="176.6" y="118" width="6.8" height="13" rx="3" fill="${C.line}" opacity=".9"/>
      </g>
      ${
        opts.wipers
          ? [96, 208]
              .map(
                (px, i) =>
                  `<g transform="translate(${px},124)"><g class="qzv-wipe" style="animation-delay:${i * 0.12}s"><rect x="-2" y="-52" width="4" height="52" rx="2" fill="#12152b"/></g></g>`,
              )
              .join("")
          : ""
      }
      ${opts.pluie ? `<g class="qzv-ws-rain">${[26, 68, 112, 152, 198, 244, 288, 322].map((x, i) => `<line x1="${x}" y1="${14 + (i % 3) * 8}" x2="${x - 7}" y2="${34 + (i % 3) * 8}" stroke="rgba(170,200,255,.55)" stroke-width="2" stroke-linecap="round"/>`).join("")}</g>` : ""}
    </g>
    <!-- Pas de liseré ici : le cadre du quiz, c'est le hublot, et lui seul. -->`;

  // rétroviseur intérieur
  const retro = `
    ${has("retro") ? halo(180, 24, 34, 15) : ""}
    <rect x="152" y="16" width="56" height="17" rx="6" fill="${C.dark}" stroke="${has("retro") ? C.gold : C.dashHi}" stroke-width="${has("retro") ? 2.5 : 1.6}"/>
    <rect x="156" y="19.5" width="48" height="10" rx="3.5" fill="#55648e"/>`;

  // tableau de bord (masse) + casquette du combiné
  const dashboard = `
    <path d="M 0 210 L 0 138 Q 60 118 180 118 Q 300 118 360 138 L 360 210 Z" fill="${C.dash}"/>
    <path d="M 0 138 Q 60 118 180 118 Q 300 118 360 138" fill="none" stroke="${C.dashHi}" stroke-width="2"/>`;

  // combiné d'instruments : 2 cadrans + zone voyants + flèches clignotant
  const voyants = (opts.voyants || [])
    .map(([g, col, blink], i) => {
      const x = 168 + i * 24 - ((opts.voyants.length - 1) * 24) / 2;
      const color = col === "rouge" ? C.red : C.amber;
      return `<g transform="translate(${x},148)" class="qzv-lamp${blink ? " qzv-blink" : ""}" style="color:${color}">
        <circle cx="0" cy="0" r="9.5" fill="rgba(0,0,0,.35)" stroke="currentColor" stroke-width="1.2" opacity=".9"/>
        ${VOYANT_GLYPHS[g] || VOYANT_GLYPHS.moteur}
      </g>`;
    })
    .join("");
  const arrow = (side) => {
    const on =
      opts.clign === "warning" ||
      (side === "g" ? opts.clign === "gauche" : opts.clign === "droit");
    const x = side === "g" ? 128 : 232;
    const d = side === "g" ? "M 6 -6 L -6 0 L 6 6 Z" : "M -6 -6 L 6 0 L -6 6 Z";
    return `<path transform="translate(${x},148)" d="${d}" fill="${C.green}" opacity="${on ? 1 : 0.16}" class="${on ? "qzv-blink" : ""}"/>`;
  };
  const dial = (cx) => `
    <circle cx="${cx}" cy="148" r="12.5" fill="${C.dark}" stroke="${C.dashHi}" stroke-width="1.5"/>
    <line x1="${cx}" y1="148" x2="${cx - 6}" y2="141" stroke="${C.steel}" stroke-width="2" stroke-linecap="round"/>`;
  const cluster = `
    <rect x="98" y="128" width="164" height="40" rx="14" fill="#101327" stroke="${C.dashHi}" stroke-width="2"/>
    ${dial(115)}${dial(245)}
    ${arrow("g")}${arrow("d")}
    ${voyants}`;

  // volant (le bas sort du cadre, comme en vrai)
  const DOT_ANSWER = [
    [126, 208],
    [234, 208],
  ];
  const dots = opts.wheelDots
    ? (opts.wheelDots === "915"
        ? DOT_ANSWER
        : [
            [180, 154],
            [234, 208],
            [126, 208],
            [141, 172],
            [219, 172],
          ]
      )
        .map(
          ([x, y], i) =>
            `<circle class="qzv-dot" style="animation-delay:${i * 0.22}s" cx="${x}" cy="${y}" r="5.5" fill="${C.gold}" stroke="#3a1d00" stroke-width="1.4"/>`,
        )
        .join("")
    : "";
  const wheel = `
    ${has("volant") ? halo(180, 190, 74, 46) : ""}
    <circle cx="180" cy="208" r="56" fill="none" stroke="#12152b" stroke-width="14"/>
    <circle cx="180" cy="208" r="56" fill="none" stroke="#262b44" stroke-width="4" opacity=".8"/>
    <path d="M 128 194 Q 180 210 232 194 M 180 214 V 250" stroke="#1a1d2e" stroke-width="11" fill="none" stroke-linecap="round"/>
    <circle cx="180" cy="206" r="17" fill="#1a1d2e" stroke="#2e3452" stroke-width="2"/>
    ${dots}`;

  // comodos gauche / droit (tiges derrière le volant)
  const comodo = (side) => {
    const isG = side === "g";
    const on = has(isG ? "comodoG" : "comodoD");
    const x = isG ? 116 : 244;
    const rot = isG ? 16 : -16;
    return `
      ${on ? halo(isG ? 94 : 266, 186, 30, 14) : ""}
      <g transform="translate(${x},178) rotate(${rot})" class="${on ? "qzv-pulse" : ""}">
        <rect x="${isG ? -44 : 4}" y="-4.5" width="40" height="9" rx="4.5" fill="${C.metal}" stroke="${on ? C.gold : "#2a3040"}" stroke-width="${on ? 2.2 : 1.2}"/>
        <circle cx="${isG ? -46 : 46}" cy="0" r="6" fill="${on ? C.gold : "#4a5266"}"/>
      </g>`;
  };

  return `<svg class="qzv-svg" viewBox="0 0 360 232" preserveAspectRatio="xMidYMid slice" focusable="false">
    ${windshield}${retro}${dashboard}${comodo("g")}${comodo("d")}${cluster}${wheel}
  </svg>`;
}

/**
 * La boîte de l'élève, pour ne pas lui dessiner une voiture qu'il ne conduit
 * pas : trois pédales et une grille en H à quelqu'un qui roule en automatique
 * (audit 01/08). null = inconnue, on dessine comme avant.
 */
let _boite = null;

/** @param {'manuelle'|'auto'|null} v */
export function setBoiteVisuels(v) {
  _boite = v === "manuelle" || v === "auto" ? v : null;
}

// ── Brique 2 : pédalier (gros plan embrayage / frein / accél.) ──
// opts: { hl:"embrayage"|"frein"|"accel", press:"frein"|…, vibr:bool }
// En boîte automatique : deux pédales, et le frein passe à gauche.
function pedalesSVG(opts = {}) {
  const auto = _boite === "auto";
  const pedal = (key, x, w, h) => {
    const isHl = opts.hl === key;
    const isPress = opts.press === key;
    const cls = [
      isPress ? "qzv-press" : "",
      isPress && opts.vibr ? "qzv-vibr" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const pads = Array.from(
      { length: 4 },
      (_, i) =>
        `<rect x="${x - w / 2 + 6}" y="${118 - h + 12 + i * ((h - 20) / 4)}" width="${w - 12}" height="3.5" rx="1.75" fill="#262b40"/>`,
    ).join("");
    return `
      ${isHl ? halo(x, 118 - h / 2, w / 2 + 18, h / 2 + 10) : ""}
      <g class="${cls}">
        <rect x="${x - 3.5}" y="${118 - h - 26}" width="7" height="30" rx="3.5" fill="#2a2f45"/>
        <rect x="${x - w / 2}" y="${118 - h}" width="${w}" height="${h}" rx="9" fill="${C.metal}" stroke="${isHl || isPress ? C.gold : "#232838"}" stroke-width="${isHl || isPress ? 2.5 : 1.5}"/>
        ${pads}
      </g>`;
  };
  // Le plancher : une ombre douce sous les pédales, pas un caisson. Le cadre,
  // c'est le hublot.
  return `<svg class="qzv-svg" viewBox="0 0 360 160" focusable="false">
    <ellipse cx="180" cy="128" rx="150" ry="26" fill="rgba(6,4,20,.55)"/>
    <path d="M 14 100 Q 180 82 346 100 L 346 152 L 14 152 Z" fill="#1b1638" opacity=".85"/>
    ${
      auto
        ? `${pedal("frein", 140, 58, 62)}
    ${pedal("accel", 232, 40, 76)}`
        : `${pedal("embrayage", 94, 48, 62)}
    ${pedal("frein", 180, 58, 62)}
    ${pedal("accel", 264, 40, 76)}`
    }
  </svg>`;
}

// ── Brique 3 : levier de vitesses (grille en H) ─────────────────
// opts: { knobAt:"2", from:"4", to:"3" }
function levierSVG(opts = {}) {
  const POS = {
    1: [120, 52],
    2: [120, 116],
    3: [180, 52],
    4: [180, 116],
    5: [240, 52],
    R: [240, 116],
  };
  const gears = Object.entries(POS)
    .map(([g, [x, y]]) => {
      const hot = g === opts.knobAt || g === opts.to;
      const dy = y < 84 ? -16 : 24;
      return `<text x="${x}" y="${y + dy}" text-anchor="middle" font-family="'Archivo',sans-serif" font-size="16" font-weight="800" fill="${hot ? C.gold : C.steel}">${g}</text>`;
    })
    .join("");
  const grid = `
    <path d="M 120 52 V 116 M 180 52 V 116 M 240 52 V 116 M 120 84 H 240"
      stroke="#101327" stroke-width="13" stroke-linecap="round" fill="none"/>
    <path d="M 120 52 V 116 M 180 52 V 116 M 240 52 V 116 M 120 84 H 240"
      stroke="#2a2f4a" stroke-width="2" stroke-linecap="round" fill="none" opacity=".6"/>`;
  const knobPos = POS[opts.knobAt] ||
    (opts.from && POS[opts.from]) || [180, 84];
  let arrow = "";
  if (opts.from && opts.to && POS[opts.from] && POS[opts.to]) {
    const [x1, y1] = POS[opts.from];
    const [x2, y2] = POS[opts.to];
    const midY = 84;
    arrow = `<path class="qzv-trace" d="M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}"
      fill="none" stroke="${C.gold}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 9"/>
      <path d="M ${x2 - 7} ${y2 - 9} L ${x2} ${y2 + 1} L ${x2 + 7} ${y2 - 9}" fill="none" stroke="${C.gold}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const knob = `
    <g transform="translate(${knobPos[0]},${knobPos[1]})"><g class="qzv-knob">
      <ellipse cx="0" cy="8" rx="14" ry="5" fill="rgba(0,0,0,.4)"/>
      <rect x="-4" y="-26" width="8" height="30" rx="4" fill="${C.metal}"/>
      <circle cx="0" cy="-32" r="15" fill="#1a1d2e" stroke="#2e3452" stroke-width="2"/>
      <circle cx="-5" cy="-37" r="4" fill="rgba(255,255,255,.18)"/>
    </g></g>`;
  return `<svg class="qzv-svg" viewBox="0 0 360 170" focusable="false">
    <ellipse cx="180" cy="150" rx="118" ry="16" fill="rgba(6,4,20,.5)"/>
    ${grid}${gears}${arrow}${knob}
  </svg>`;
}

// ── Brique 4 : feu tricolore vedette ────────────────────────────
// etat: rouge | orange | vert | orange-clign | rouge-clign
function feuSVG(etat = "orange") {
  const blink = etat.endsWith("-clign");
  const base = etat.replace("-clign", "");
  const lamp = (cy, key, col, dim) => {
    const on = base === key;
    return `<circle cx="0" cy="${cy}" r="13" fill="${on ? col : dim}" ${
      on
        ? `class="${blink ? "qzv-blink" : "qzv-glow"}" style="--qzv-c:${col}"`
        : ""
    }/>`;
  };
  return `<svg class="qzv-svg" viewBox="0 0 360 190" focusable="false">
    <ellipse cx="180" cy="170" rx="118" ry="22" fill="rgba(212,151,109,.13)"/>
    <ellipse cx="180" cy="172" rx="42" ry="10" fill="rgba(6,4,20,.6)"/>
    <rect x="174" y="118" width="12" height="54" rx="5" fill="#5b6270"/>
    <rect x="150" y="10" width="60" height="112" rx="16" fill="#262b38" stroke="#3a4152" stroke-width="2.5"/>
    <g transform="translate(180,0)">
      ${lamp(32, "rouge", C.red, "#57262a")}
      ${lamp(66, "orange", C.amber, "#5c4a22")}
      ${lamp(100, "vert", C.green, "#25402a")}
    </g>
  </svg>`;
}

// ── Brique 5 : panneau vedette (billboard centré) ───────────────
// type: triangle | cede | stop | rond-rouge | sens-interdit | rond-bleu
//       | fin | parking | zone30 | agglo | agglo-fin | autoroute
const SIGN_HEADS = {
  triangle: `<polygon points="-42,26 42,26 0,-46" fill="#fff" stroke="${C.redSign}" stroke-width="11" stroke-linejoin="round"/>`,
  cede: `<polygon points="-42,-38 42,-38 0,30" fill="#fff" stroke="${C.redSign}" stroke-width="11" stroke-linejoin="round"/>`,
  stop: (() => {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2;
      pts.push(
        `${Math.round(Math.cos(a) * 42)},${Math.round(Math.sin(a) * 42)}`,
      );
    }
    return `<polygon points="${pts.join(" ")}" fill="${C.redSign}" stroke="#fff" stroke-width="5"/>
      <text x="0" y="7" text-anchor="middle" font-family="'Archivo',sans-serif" font-size="21" font-weight="800" fill="#fff">STOP</text>`;
  })(),
  "rond-rouge": `<circle cx="0" cy="-6" r="40" fill="#fff" stroke="${C.redSign}" stroke-width="12"/>`,
  "sens-interdit": `<circle cx="0" cy="-6" r="42" fill="${C.redSign}" stroke="#fff" stroke-width="4"/><rect x="-26" y="-11" width="52" height="10" rx="4" fill="#fff"/>`,
  "rond-bleu": `<circle cx="0" cy="-6" r="42" fill="${C.blue}" stroke="#fff" stroke-width="4"/>`,
  fin: `<circle cx="0" cy="-6" r="42" fill="#f2f3f5" stroke="#9aa3ad" stroke-width="3"/>
    <g stroke="#3d4450" stroke-width="4.5" stroke-linecap="round">
      <line x1="-24" y1="20" x2="26" y2="-32"/><line x1="-13" y1="24" x2="30" y2="-21"/>
      <line x1="-30" y1="13" x2="15" y2="-34"/>
    </g>`,
  parking: `<rect x="-40" y="-46" width="80" height="80" rx="14" fill="${C.blue}" stroke="#fff" stroke-width="4"/>
    <text x="0" y="16" text-anchor="middle" font-family="'Archivo',sans-serif" font-size="52" font-weight="800" fill="#fff">P</text>`,
  zone30: `<rect x="-44" y="-50" width="88" height="88" rx="10" fill="#fff" stroke="#3d4450" stroke-width="3"/>
    <text x="0" y="-28" text-anchor="middle" font-family="'Archivo',sans-serif" font-size="14" font-weight="800" fill="#3d4450">ZONE</text>
    <circle cx="0" cy="6" r="26" fill="#fff" stroke="${C.redSign}" stroke-width="7"/>
    <text x="0" y="14" text-anchor="middle" font-family="'Archivo',sans-serif" font-size="24" font-weight="800" fill="#1a1d2e">30</text>`,
  agglo: `<rect x="-62" y="-30" width="124" height="48" rx="7" fill="#fff" stroke="${C.redSign}" stroke-width="5"/>
    <text x="0" y="1" text-anchor="middle" font-family="'Archivo',sans-serif" font-size="17" font-weight="800" fill="#1a1d2e">VILLENEUVE</text>
`,
  "agglo-fin": `<rect x="-62" y="-30" width="124" height="48" rx="7" fill="#fff" stroke="#3d4450" stroke-width="4"/>
    <text x="0" y="1" text-anchor="middle" font-family="'Archivo',sans-serif" font-size="17" font-weight="800" fill="#1a1d2e">VILLENEUVE</text>
    <line x1="-56" y1="14" x2="56" y2="-26" stroke="${C.redSign}" stroke-width="7" stroke-linecap="round"/>`,
  autoroute: `<rect x="-42" y="-48" width="84" height="84" rx="12" fill="${C.blue}" stroke="#fff" stroke-width="4"/>
    <g stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round">
      <path d="M -16 26 Q -9 -6 -6 -34"/><path d="M 16 26 Q 9 -6 6 -34"/>
    </g>
    <rect x="-26" y="-14" width="52" height="9" rx="4" fill="#fff"/>`,
};

function panneauSVG(type) {
  const head = SIGN_HEADS[type] || SIGN_HEADS.triangle;
  const flat = type === "agglo" || type === "agglo-fin";
  return `<svg class="qzv-svg" viewBox="0 0 360 190" focusable="false">
    <ellipse cx="180" cy="172" rx="46" ry="9" fill="rgba(0,0,0,.35)"/>
    <rect x="176" y="${flat ? 96 : 112}" width="9" height="${flat ? 76 : 60}" rx="4" fill="#8b93a8"/>
    <g transform="translate(180,${flat ? 72 : 64})"><g class="qzv-float">${head}</g></g>
  </svg>`;
}

// ── Brique 6 : mini-scène routière iso (réutilise le moteur) ────
// projection monde→écran locale (mêmes constantes que situation-scene.js)
const PP = (x, y) =>
  `${((x + y) * 46).toFixed(1)},${((x - y) * 24).toFixed(1)}`;

// trajectoires de manœuvre (pointillés dorés + pointe de flèche)
const TRAJ = {
  // demi-tour : départ voie de droite vers le nord, retour voie de gauche
  demiTour: () => ({
    d: `M ${PP(0.39, -1.7)} L ${PP(0.39, -0.4)} Q ${PP(0.39, 0.75)} ${PP(0, 0.75)} Q ${PP(-0.39, 0.75)} ${PP(-0.39, -0.4)} L ${PP(-0.39, -1.5)}`,
    tip: `M ${PP(-0.55, -1.15)} L ${PP(-0.39, -1.6)} L ${PP(-0.23, -1.15)}`,
  }),
  // marche arrière : la voiture recule (flèche vers le sud, derrière elle)
  recul: () => ({
    d: `M ${PP(0.39, -2.0)} L ${PP(0.39, -3.1)}`,
    tip: `M ${PP(0.24, -2.75)} L ${PP(0.39, -3.2)} L ${PP(0.54, -2.75)}`,
  }),
};

function sceneHTML(scene, { fx = "", gap = false, traj = "" } = {}) {
  let svg = renderSituationScene(scene, { alt: "" });
  let fxSvg = "";
  if (gap) {
    // chevrons dorés de « distance de sécurité » devant le joueur
    fxSvg += buildFocusFX(scene, { veh: "moi" }).replace(
      /<ellipse class="sit-halo[^/]*\/>/,
      "",
    );
  }
  if (traj && TRAJ[traj]) {
    const { d, tip } = TRAJ[traj]();
    fxSvg += `<path class="qzv-trace" d="${d}" fill="none" stroke="#ffcb3d" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="9 10"/>
      <path d="${tip}" fill="none" stroke="#ffcb3d" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (fxSvg) {
    svg = svg.replace(
      '<g class="sit-fx"></g>',
      `<g class="sit-fx">${fxSvg}</g>`,
    );
  }
  return wrap("scene", svg, { fx });
}

// Scènes déclaratives réutilisables (format situations-conduite.js)
const MOI = { id: "moi", at: "S", d: 2.4, couleur: "joueur", label: "Toi" };
const SCENES = {
  prioriteDroite: {
    kind: "croisement",
    vehicules: [MOI, { id: "v1", at: "E", d: 1.9, couleur: "rouge" }],
  },
  stop: {
    kind: "croisement",
    signal: { type: "stop", branch: "S" },
    vehicules: [MOI, { id: "v1", at: "W", d: 2.2, couleur: "bleu" }],
  },
  cede: {
    kind: "croisement",
    signal: { type: "cede", branch: "S" },
    vehicules: [MOI, { id: "v1", at: "W", d: 2.0, couleur: "bleu" }],
  },
  cedeSeul: {
    kind: "croisement",
    signal: { type: "cede", branch: "S" },
    vehicules: [MOI],
  },
  giratoire: {
    kind: "giratoire",
    signal: { type: "giratoire", branch: "S" },
    vehicules: [
      { ...MOI, d: 2.6 },
      { id: "v1", angle: 160, couleur: "rouge" },
    ],
  },
  giratoireClign: {
    kind: "giratoire",
    signal: { type: "giratoire", branch: "S" },
    vehicules: [
      { ...MOI, d: 2.6 },
      { id: "v1", angle: 195, couleur: "rouge", clign: "droit" },
    ],
  },
  giratoireNu: {
    kind: "giratoire",
    vehicules: [
      { ...MOI, d: 2.6 },
      { id: "v1", angle: 160, couleur: "jaune" },
    ],
  },
  pietonPassage: {
    kind: "route",
    passage: true,
    pieton: { engage: false },
    vehicules: [{ ...MOI, d: 2.6 }],
  },
  pietonHors: {
    kind: "route",
    pieton: { engage: true },
    vehicules: [{ ...MOI, d: 2.6 }],
  },
  pietonBord: {
    kind: "route",
    pieton: { engage: false },
    vehicules: [{ ...MOI, d: 2.6 }],
  },
  feuVertPieton: {
    kind: "route",
    passage: true,
    pieton: { engage: true },
    signal: { type: "feu", etat: "vert", branch: "S" },
    vehicules: [{ ...MOI, d: 2.6 }],
  },
  depassement: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.8, clign: "gauche" },
      { id: "v1", at: "S", d: 0.9, couleur: "gris" },
    ],
  },
  // je suis devant, sur la voie de gauche, clignotant droit : le rabattement
  rabattement: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 1.0, lane: -0.39, clign: "droit" },
      { id: "v1", at: "S", d: 2.6, couleur: "gris" },
    ],
  },
  // on me dépasse : l'autre arrive sur la voie de gauche
  depasse: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.2 },
      { id: "v1", at: "S", d: 3.1, lane: -0.39, couleur: "gris" },
    ],
  },
  ligneContinue: {
    kind: "route",
    ligne: "continue",
    vehicules: [
      { ...MOI, d: 2.6 },
      { id: "v1", at: "S", d: 0.7, couleur: "gris" },
    ],
  },
  ligneDiscontinue: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.6 },
      { id: "v1", at: "S", d: 0.6, couleur: "gris" },
    ],
  },
  distance: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 3.1 },
      { id: "v1", at: "S", d: 0.7, couleur: "gris" },
    ],
  },
  route: {
    kind: "route",
    vehicules: [{ ...MOI, d: 2.4 }],
  },
  croisementNuit: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.6 },
      { id: "v1", at: "N", d: 1.6, couleur: "gris" },
    ],
  },
  // ── acteurs vulnérables & gros gabarits (lot 2) ──
  cyclisteDevant: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.7 },
      { id: "v1", type: "velo", at: "S", d: 1.0, lane: 0.56 },
    ],
  },
  cyclisteCroise: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.5 },
      { id: "v1", type: "velo", at: "N", d: 1.4, lane: 0.56 },
    ],
  },
  cyclisteFace: {
    kind: "croisement",
    vehicules: [
      { ...MOI, d: 2.2, clign: "gauche" },
      { id: "v1", type: "velo", at: "N", d: 1.9 },
    ],
  },
  cyclisteGiratoire: {
    kind: "giratoire",
    signal: { type: "giratoire", branch: "S" },
    vehicules: [
      { ...MOI, d: 2.6 },
      { id: "v1", type: "velo", angle: 200 },
    ],
  },
  motoDevant: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.7, clign: "gauche" },
      { id: "v1", type: "moto", at: "S", d: 1.1, lane: 0.5 },
    ],
  },
  busArrete: {
    kind: "route",
    passage: true,
    pieton: { engage: true },
    vehicules: [
      { ...MOI, d: 2.8 },
      { id: "v1", type: "bus", at: "S", d: 1.35, lane: 0.52 },
    ],
  },
  busRepart: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.9 },
      { id: "v1", type: "bus", at: "S", d: 1.3, lane: 0.52, clign: "gauche" },
    ],
  },
  busWarnings: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.9 },
      { id: "v1", type: "bus", at: "S", d: 1.3, lane: 0.52, clign: "warning" },
    ],
  },
  rabattementCamion: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 1.1, lane: -0.39, clign: "droit" },
      { id: "v1", type: "camion", at: "S", d: 2.9 },
    ],
  },
  camionDevant: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.9 },
      { id: "v1", type: "camion", at: "S", d: 1.1 },
    ],
  },
  camionCroise: {
    kind: "route",
    vehicules: [
      { ...MOI, d: 2.5 },
      { id: "v1", type: "camion", at: "N", d: 1.5 },
    ],
  },
  // ── manœuvres & stationnement (lot 3) ──
  // créneau : deux voitures garées le long de la rive, une place entre
  // les deux, moi à hauteur de la place (le PROBLÈME, jamais la méthode)
  creneau: {
    kind: "route",
    vehicules: [
      { id: "p1", at: "S", d: 0.4, lane: 0.63, couleur: "gris" },
      { id: "p2", at: "S", d: 2.5, lane: 0.63, couleur: "jaune" },
      { ...MOI, d: 1.45, lane: 0.16 },
    ],
  },
  stationnementRue: {
    kind: "route",
    vehicules: [
      { id: "p1", at: "S", d: 0.3, lane: 0.63, couleur: "gris" },
      { id: "p2", at: "S", d: 1.55, lane: 0.63, couleur: "rouge" },
      { id: "p3", at: "S", d: 2.8, lane: 0.63, couleur: "jaune" },
      { ...MOI, d: 2.2, lane: 0.16 },
    ],
  },
  demiTour: {
    kind: "route",
    vehicules: [{ ...MOI, d: 1.7 }],
  },
  marcheArriere: {
    kind: "route",
    vehicules: [{ ...MOI, d: 2.0 }],
  },
  // ── autoroute (lot 4) : voies gauche −0.62 / droite 0.05 / BAU 0.7 ──
  autorouteRoule: {
    kind: "autoroute",
    vehicules: [
      { ...MOI, d: 2.6, lane: 0.05 },
      { id: "v1", at: "S", d: 1.2, lane: -0.62, couleur: "gris" },
    ],
  },
  autorouteInsertion: {
    kind: "autoroute",
    vehicules: [
      { ...MOI, d: 2.0, lane: 0.7, clign: "gauche" },
      { id: "v1", at: "S", d: 3.0, lane: 0.05, couleur: "gris" },
    ],
  },
  autorouteInsertionAutre: {
    kind: "autoroute",
    vehicules: [
      { ...MOI, d: 2.6, lane: 0.05 },
      {
        id: "v1",
        at: "S",
        d: 1.4,
        lane: 0.7,
        couleur: "gris",
        clign: "gauche",
      },
    ],
  },
  autorouteBAU: {
    kind: "autoroute",
    vehicules: [
      { ...MOI, d: 2.8, lane: 0.05 },
      {
        id: "v1",
        at: "S",
        d: 1.2,
        lane: 0.7,
        couleur: "gris",
        clign: "warning",
      },
    ],
  },
  autorouteVoieGauche: {
    kind: "autoroute",
    vehicules: [
      { ...MOI, d: 2.4, lane: -0.62 },
      { id: "v1", at: "S", d: 1.2, lane: 0.05, couleur: "gris" },
    ],
  },
  autorouteSortie: {
    kind: "autoroute",
    vehicules: [
      { ...MOI, d: 2.2, lane: 0.05, clign: "droit" },
      { id: "v1", at: "S", d: 1.0, lane: -0.62, couleur: "gris" },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// Règles de mapping énoncé → visuel (1re qui matche gagne)
// vis: null = bloqueur (le visuel générique contredirait l'énoncé)
// ═══════════════════════════════════════════════════════════════

// ── Registre « la vue » : les images du briefing ────────────────
// Les mêmes fichiers que les fiches de révision (public/art/fiches/br-*).
// Une seule nuit, une seule voiture : la question se passe exactement là où
// la fiche l'a enseignée. Elles sont en 2:3 et le hublot est en 16:10, donc
// chaque usage choisit SON point de mire — c'est aussi l'anti-fuite : sur la
// question « quel commodo ? » on cadre haut, la rue, jamais la manette.
const photo = (nom, pos = "50% 45%") =>
  `<div class="qzv qzv-photo" aria-hidden="true"><img src="/art/fiches/br-${nom}.webp" alt="" loading="lazy" decoding="async" style="object-position:${pos}"></div>`;

// Les six écarts qu'aucune image fixe ne dit : la ligne se dessine.
const vue = (nom) =>
  `<div class="qzv qzv-photo qzv-vue" aria-hidden="true"><video class="fond" src="/art/fiches/br-${nom}.mp4" autoplay loop muted playsinline preload="metadata"></video><video class="net" src="/art/fiches/br-${nom}.mp4" autoplay loop muted playsinline preload="metadata"></video></div>`;

// La photo QUI MONTRE. Le décor vient de l'image, le doigt vient du tracé :
// c'est la même recette que les vues du ciel des fiches (un fond réel, une
// ligne dessinée par-dessus). Ça évite le grand écart entre des vignettes
// photo somptueuses et des schémas gris à côté.
// Repères relevés sur la photo cadrée en 16:10, en % du hublot.
const PEDALE_XY = {
  manuelle: {
    photo: "pedales",
    embrayage: { x: 27, y: 40, rx: 15, ry: 22 },
    frein: { x: 53, y: 30, rx: 13, ry: 20 },
    accel: { x: 76, y: 33, rx: 10, ry: 27 },
  },
  auto: {
    photo: "pedales-auto",
    frein: { x: 41, y: 38, rx: 15, ry: 20 },
    accel: { x: 67, y: 35, rx: 9, ry: 28 },
  },
};

const photoPointe = (nom, pos, cibles) =>
  `<div class="qzv qzv-photo" aria-hidden="true"><img src="/art/fiches/br-${nom}.webp" alt="" loading="lazy" decoding="async" style="object-position:${pos}"><svg class="qzv-pointe" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">${cibles
    .map(
      (c) =>
        `<ellipse class="qzv-halo" cx="${c.x}" cy="${c.y}" rx="${c.rx}" ry="${c.ry}" fill="rgba(246,200,95,.1)" stroke="#f6c85f" stroke-width="2" vector-effect="non-scaling-stroke"/>`,
    )
    .join("")}</svg></div>`;

/** Une pédale montrée sur la vraie photo, dans la bonne boîte de vitesses. */
const pedalePhoto = (cible) => {
  const k = PEDALE_XY[_boite === "auto" ? "auto" : "manuelle"];
  const c = k[cible];
  // L'embrayage n'existe pas en automatique : sans cible, la photo seule.
  return c ? photoPointe(k.photo, "50% 45%", [c]) : photo(k.photo, "50% 45%");
};

// L'objet n'est plus dessiné : ce sont dix images générées, chacune EN
// SITUATION dans la même voiture et la même rue. Un objet posé sur un socle
// redevient une planche technique, et c'est exactement ce qu'on fuit.
// (Décision Rayan, 08/08 : « ça c'est pas design, on fait tout avec Higgsfield ».)
const OBJET_POS = {
  pneu: "50% 55%",
  horloge: "50% 45%",
  disqueA: "50% 45%",
  carte: "50% 50%",
  secours: "50% 55%",
  ethylo: "50% 52%",
  gps: "50% 45%",
  jauge: "50% 48%",
  compteur: "50% 52%",
  permis: "50% 50%",
};
const objet = (k) => photo(`obj-${k}`, OBJET_POS[k] || "50% 50%");

const sc = (k, o) => sceneHTML(SCENES[k], o);
const cockpit = (o) => wrap("cockpit", cockpitSVG(o));
const pedales = (o) => wrap("pedales", pedalesSVG(o));
// La grille en H n'existe pas en boîte automatique : mieux vaut pas de dessin
// qu'un dessin faux, le texte de la question suffit.
const levier = (o) => (_boite === "auto" ? "" : wrap("levier", levierSVG(o)));
const feu = (e) => wrap("feu", feuSVG(e));
const panneau = (t) => wrap("panneau", panneauSVG(t));

const RULES = [
  // ═══════════════════════════════════════════════════════════════
  // LE BRIEFING — passe AVANT tout le reste, bloqueurs compris.
  //
  // Ces règles-là ne sont pas génériques : chacune vise une question et
  // choisit sa vue et son cadrage. C'est le travail de direction, pas du
  // remplissage : une photo qui montrerait la manette répondrait à
  // « quel commodo ? », donc sur celle-là on cadre la rue et rien d'autre.
  // Elles couvrent les énoncés qu'aucune brique dessinée ne savait servir.
  // ═══════════════════════════════════════════════════════════════

  // — Deux questions d'une même fiche, deux images différentes.
  //   Une session de certification ne pose que 3 questions, toutes tirées de
  //   la MÊME fiche. Deux fois la même vignette d'affilée et tout le système
  //   passe pour du remplissage : ces règles-là n'existent que pour ça, et
  //   elles passent avant les règles génériques qui les confondaient.
  {
    re: /changes de vitesse\. tu regardes/,
    vis: () => photo("regard-loin", "50% 40%"),
  },
  { re: /tour de voiture, c'est quoi/, vis: () => photo("phares", "50% 62%") },
  {
    re: /voiture à abs\. ton premier geste/,
    vis: () => photo("pedales", "50% 55%"),
  },
  {
    re: /route trop étroite pour laisser 1 m/,
    vis: () => sc("cyclisteCroise"),
  },
  { re: /règle d'or de toute manœuvre/, vis: () => sc("creneau") },
  { re: /bataille arrière/, vis: () => photo("marche-arriere", "50% 50%") },
  { re: /rates le début d'un créneau/, vis: () => sc("creneau") },
  { re: /créneau à gauche/, vis: () => sc("stationnementRue") },
  { re: /photographier la scène/, vis: () => photo("retro-gauche", "50% 45%") },
  { re: /une balle traverse/, vis: () => sc("pietonBord") },
  {
    re: /trop étroite pour ta voiture|appuyer sur le trottoir/,
    vis: () => photo("retro-gauche", "50% 55%"),
  },
  {
    re: /ré-accélères-tu dans un virage|freinage avant un virage/,
    vis: () => photo("pedales", "50% 45%"),
  },
  { re: /hésites à dépasser/, vis: () => sc("ligneContinue") },
  {
    re: /avant de déboîter pour dépasser|clignotant pour changer de voie/,
    vis: () => photo("angle-mort", "50% 45%"),
  },
  { re: /venant de ta droite ralentit/, vis: () => sc("croisementNuit") },
  {
    re: /voiture à abs|peux-tu diriger la voiture/,
    vis: () => photo("volant", "50% 45%"),
  },
  { re: /dans le tunnel, tu repères/, vis: () => photo("phares", "50% 28%") },
  { re: /le gps, tu le règles/, vis: () => photo("contact", "50% 45%") },
  { re: /long trajet inconnu/, vis: () => objet("carte") },
  { re: /route trop étroite pour laisser/, vis: () => sc("cyclisteDevant") },
  { re: /3 questions de l'examen/, vis: () => objet("pneu") },

  // — Le poste de conduite
  {
    re: /tout premier réflexe|tour de voiture, c'est quoi|sur un pneu/,
    vis: () => objet("pneu"),
  },
  {
    re: /jambe gauche un peu pliée|talon décollé|semelle qui glisse/,
    vis: () => photo("pedales", "50% 45%"),
  },
  { re: /ceinture doit passer/, vis: () => photo("ceinture", "50% 35%") },
  { re: /hauteur de siège est bonne/, vis: () => photo("cligno", "50% 18%") },
  {
    re: /vérifier ses feux avant|lueur de phares|avant l'entrée.*tunnel|tunnel en plein jour/,
    vis: () => photo("phares", "50% 40%"),
  },
  {
    re: /tunnel, ta voiture tombe en panne|dans le tunnel, tu repères/,
    vis: () => objet("secours"),
  },
  { re: /pont exposé|jour de vent/, vis: () => photo("volant", "50% 45%") },

  // — Le regard
  {
    re: /où poses-tu ton regard|photographier la scène|où porte ton regard/,
    vis: () => photo("regard-loin", "50% 42%"),
  },
  {
    re: /fréquence reviens-tu au rétro|te colle et klaxonne/,
    vis: () => photo("retro-interieur", "50% 45%"),
  },
  {
    re: /en plus du rétro gauche|premier geste de sécurité/,
    vis: () => photo("angle-mort", "50% 50%"),
  },

  // — Les écarts : la ligne se dessine, une image fixe ne les dit pas
  {
    re: /trop étroite pour ta voiture|où te places-tu sur ta voie/,
    vis: () => vue("position"),
  },
  {
    re: /dans le virage, où regardes-tu|ré-accélères-tu dans un virage/,
    vis: () => vue("virage"),
  },
  { re: /tourner à droite en ville/, vis: () => vue("cycliste") },
  { re: /plusieurs voies pour ta sortie/, vis: () => vue("insertion") },
  { re: /manœuvre est vraiment acquise/, vis: () => vue("creneau") },

  // — Préparer et conduire seul
  {
    re: /long trajet inconnu|route est annoncée coupée|gps, tu le règles/,
    vis: () => objet("gps"),
  },
  { re: /4 heures de route|tes pauses/, vis: () => objet("horloge") },
  { re: /économise combien de carburant/, vis: () => objet("jauge") },
  { re: /totaliseur|3 questions de l'examen/, vis: () => objet("compteur") },
  { re: /ligne droite dégagée/, vis: () => photo("levier", "50% 45%") },
  {
    re: /trajet seul en ville, que fais-tu/,
    vis: () => photo("ceinture", "50% 40%"),
  },

  // — Les derniers énoncés, un par un. Deux questions d'une MÊME fiche ne
  //   reçoivent jamais la même vue : une session ne montre que 3 questions,
  //   deux fois la même image et la série a l'air d'un remplissage.
  {
    re: /part doucement de travers|manœuvre demandée à l'examen/,
    vis: () => vue("creneau"),
  },
  { re: /rouler en accordéon/, vis: () => vue("distance") },
  {
    re: /appuyer sur le trottoir/,
    vis: () => photo("marche-arriere", "50% 45%"),
  },
  { re: /es-tu prioritaire sur les autres/, vis: () => vue("creneau") },
  {
    re: /une balle traverse|approches d'une école/,
    vis: () => photo("regard-loin", "50% 52%"),
  },
  { re: /descends une pente/, vis: () => photo("levier", "50% 40%") },
  { re: /klaxonnes pour montrer/, vis: () => photo("volant", "50% 50%") },
  { re: /maîtrises la conduite en ville/, vis: () => vue("position") },
  { re: /feuilles mortes mouillées/, vis: () => vue("virage") },
  { re: /plaque luisante/, vis: () => photo("phares", "50% 55%") },
  { re: /disque a à l'arrière/, vis: () => objet("disqueA") },
  { re: /permis probatoire avec combien/, vis: () => objet("permis") },
  { re: /taux d'alcool max/, vis: () => objet("ethylo") },

  // ── Bloqueurs : pas d'acteur/décor fidèle → repli texte ────────
  { re: /cyclable|trottinette|interfile|trottoir/, vis: null },
  { re: /sens unique|contresens/, vis: null },
  {
    re: /tramway|tram\b|tracteur|convoi|ambulance|chevaux|animal|cerf/,
    vis: null,
  },
  {
    re: /stop (peint )?au sol|stop sans panneau|sol mais pas de panneau/,
    vis: null,
  },
  { re: /dissuasion/, vis: null },
  {
    re: /sas vélo|zone de rencontre|dos d'âne|zébra|hachurée|bateau/,
    vis: null,
  },
  { re: /tunnel|péage|pont/, vis: null },
  { re: /zone scolaire|d'une école|école,/, vis: null },
  // « feux stop » = feux de freinage (pas le panneau) ; « dépasser la
  // limite » = vitesse (pas un dépassement) ; warnings d'un AUTRE véhicule
  // et ligne jaune de trottoir : rien de fidèle à montrer en v1.
  { re: /feux stop/, vis: null },
  { re: /dépasser la (limite|vitesse)/, vis: null },
  { re: /double file/, vis: null },
  { re: /ligne jaune/, vis: null },

  // ── Panneaux à sens précis (avant les scènes génériques) ────────
  { re: /fin d'interdiction|gris barré/, vis: () => panneau("fin") },

  // ── Acteurs : cyclistes, bus, poids lourds, scooters ────────────
  // (avant giratoire/piéton/dépassement génériques : l'acteur prime)
  {
    re: /cycliste.*(giratoire|anneau)|(giratoire|anneau).*cycliste/,
    vis: () => sc("cyclisteGiratoire"),
  },
  {
    re: /cycliste arrive en face|tournes à gauche.*cycliste/,
    vis: () => sc("cyclisteFace"),
  },
  { re: /croises un cycliste/, vis: () => sc("cyclisteCroise") },
  {
    re: /cycliste|vélo|usagers vulnérables/,
    vis: () => sc("cyclisteDevant"),
  },
  { re: /scooter|deux[- ]roues/, vis: () => sc("motoDevant") },
  {
    re: /bus (redémarre|met son clignotant|quitte)|bus.*clignotant/,
    vis: () => sc("busRepart"),
  },
  { re: /bus scolaire|warnings allumés/, vis: () => sc("busWarnings") },
  { re: /\bbus\b/, vis: () => sc("busArrete") },
  {
    re: /croises un poids lourd|croisement poids lourd/,
    vis: () => sc("camionCroise"),
  },
  {
    re: /viens de doubler un (camion|poids lourd)/,
    vis: () => sc("rabattementCamion"),
  },
  {
    re: /camion|poids lourd|camionnette/,
    vis: () => sc("camionDevant"),
  },

  // ── Manœuvres & stationnement ───────────────────────────────────
  // pente/bateau/disque/PMR : rien de fidèle à dessiner en v1
  {
    re: /pente|en haut d'une côte|bateau|zone bleue|pmr|réservée|sortie de garage/,
    vis: null,
  },
  // « pas de créneau » en insertion = un trou dans le trafic, pas un
  // stationnement → on laisse la règle autoroute s'en charger plus bas
  {
    re: /créneau|bataille/,
    and: /^(?!.*(bretelle|insertion|autoroute))/,
    vis: () => sc("creneau"),
  },
  { re: /demi-tour/, vis: () => sc("demiTour", { traj: "demiTour" }) },
  {
    re: /marche arrière/,
    vis: () => sc("marcheArriere", { traj: "recul" }),
  },

  // ── Scènes : giratoire / intersections / priorités ─────────────
  {
    re: /giratoire.*(pas|sans).*(panneau|cédez)|sans panneau visible/,
    vis: () => sc("giratoireNu"),
  },
  // clignotant animé seulement quand la question porte sur le « quand »
  // (le montrer sur « quel clignotant ? » donnerait la réponse)
  {
    re: /(quand|quel moment).*clignotant|clignotant.*(quand|quel moment)/,
    and: /giratoire|rond[- ]point/,
    vis: () => sc("giratoireClign"),
  },
  {
    re: /clignotant/,
    and: /giratoire|rond[- ]point/,
    vis: () => sc("giratoire"),
    rev: () => sc("giratoireClign"),
  },
  { re: /giratoire|rond[- ]point/, vis: () => sc("giratoire") },
  { re: /\bstop\b/, vis: () => sc("stop") },
  {
    re: /céde(z|r)?[- ]le[- ]passage.*aucun véhicule/,
    vis: () => sc("cedeSeul"),
  },
  {
    re: /céde(z|r)?([- ]le)?[- ]passage|cède le passage/,
    vis: () => sc("cede"),
  },
  {
    re: /carrefour sans|intersection sans|pas de panneau, pas de feu|priorité à droite|aucun panneau ni feu|sans (aucune )?signalisation|venant de ta droite/,
    vis: () => sc("prioriteDroite"),
  },

  // ── Scènes : piétons ────────────────────────────────────────────
  {
    re: /piéton.*hors (du |d'un )?passage|hors d('un|es) passage|surgit/,
    vis: () => sc("pietonHors"),
  },
  { re: /au bord de la chaussée/, vis: () => sc("pietonBord") },
  {
    re: /feu (est )?vert.*piéton|piéton.*feu (est )?rouge/,
    vis: () => sc("feuVertPieton"),
  },
  {
    re: /piéton|passage protégé|poussette|canne blanche|personne âgée/,
    vis: () => sc("pietonPassage"),
  },
  {
    re: /stationn|te gares|se garer|me garer|veux te garer|garé en|es garé/,
    vis: () => sc("stationnementRue"),
  },

  // ── Scènes : dépassement / lignes / distance ────────────────────
  {
    re: /(dépass|doubl).*(ligne|continue)|ligne continue.*(dépass|doubl|franchir|exception)/,
    vis: () => sc("ligneContinue"),
  },
  { re: /ligne (blanche |jaune )?continue/, vis: () => sc("ligneContinue") },
  {
    re: /ligne (centrale )?(blanche )?discontinue/,
    vis: () => sc("ligneDiscontinue"),
  },
  { re: /rabat/, vis: () => sc("rabattement") },
  { re: /es dépassé|te faire dépasser|te dépasse/, vis: () => sc("depasse") },
  {
    re: /dépass|doubler|double une|viens de doubler/,
    vis: (t) =>
      choix(t, [
        () => sc("depassement"),
        () => sc("depasse"),
        () => sc("rabattement"),
        () => photo("angle-mort", "50% 46%"),
        () => photo("retro-gauche", "50% 44%"),
      ]),
  },
  {
    re: /distance de sécurité|distances? de sécurité|distance.*(gardes|laisses|devant|min(imum)?)|(gardes|laisses).*distance|règle des (2|deux) secondes|deux secondes|intervalle de sécurité/,
    vis: (t) =>
      sc("distance", {
        gap: true,
        fx: /verglas|neige/.test(t)
          ? "neige"
          : /pluie|pleut/.test(t)
            ? "pluie"
            : "",
      }),
  },
  {
    re: /distance de freinage|t'arrêtes en combien|freinage à \d+|freinage \d+/,
    vis: () => sc("distance", { gap: true }),
  },

  // ── Autoroute / voie express (chaussée dédiée + météo) ──────────
  // « voie par défaut » / « tu doubles par où » : la position du joueur
  // donnerait la réponse → panneau vedette neutre
  {
    re: /voie (utilisée )?par défaut|doubles par où/,
    vis: () => panneau("autoroute"),
    rev: (t) =>
      /doubles par où/.test(t)
        ? sc("autorouteVoieGauche")
        : sc("autorouteRoule"),
  },
  {
    re: /sortie d'autoroute approche|quitter (la voie rapide|l'autoroute)|bretelle de décélération|sortir autoroute|tu sors de l'autoroute/,
    vis: () => sc("autorouteSortie"),
  },
  {
    re: /quelqu'un veut s'insérer|voiture sur la bretelle/,
    vis: () => sc("autorouteInsertionAutre"),
  },
  {
    re: /insertion|bretelle|t'insères|s'insérer|voie d'accélération/,
    vis: (t) =>
      choix(t, [
        () => sc("autorouteInsertion"),
        () => vue("insertion"),
        () => photo("angle-mort", "50% 42%"),
        () => photo("levier", "50% 38%"),
      ]),
  },
  {
    re: /\bbau\b|bande d'arrêt|crevaison.*autoroute|malaise.*autoroute|panne.*autoroute|triangle.*autoroute/,
    vis: () => sc("autorouteBAU"),
  },
  { re: /voie de gauche/, vis: () => sc("autorouteVoieGauche") },
  {
    re: /autoroute|voie express/,
    vis: (t) =>
      sc("autorouteRoule", {
        fx: /pleu|pluie/.test(t) ? "pluie" : /nuit/.test(t) ? "nuit" : "",
      }),
  },

  // ── Météo / nuit (ambiance sur scène route) ─────────────────────
  // « feux de brouillard » = question de commande (l'ambiance brouillard
  // sur « il pleut, feu de brouillard arrière ? » contredirait l'énoncé)
  {
    re: /brouillard (épais|surgit)|moins de 50 m|visi <50m/,
    vis: () => sc("route", { fx: "brouillard" }),
  },
  {
    re: /feux? de brouillard/,
    vis: () => cockpit({ hl: ["comodoG", "comodoD"] }),
  },
  { re: /brouillard/, vis: () => sc("route", { fx: "brouillard" }) },
  {
    re: /aquaplaning|flaque|pluie battante|pleut fort/,
    vis: () => sc("route", { fx: "pluie" }),
  },
  {
    re: /neige|verglas|chaînes|glissante|enneigée/,
    vis: () => sc("route", { fx: "neige" }),
  },
  // voiture en face SEULEMENT si l'énoncé la pose (éblouissement, appel
  // de phares…) — pas sur « pleins phares quand ? » (réponse divulguée)
  {
    re: /éblouit|appel de phares|phares.*(en |d')?face|face.*phares|croises une voiture/,
    vis: () => sc("croisementNuit", { fx: "nuit" }),
  },
  {
    re: /pleins phares|feux de route|la nuit|de nuit|conduite de nuit/,
    vis: (t) =>
      choix(t, [
        () => sc("route", { fx: "nuit" }),
        () => photo("phares", "50% 40%"),
        () => photo("regard-loin", "50% 34%"),
        () => photo("essuie-glaces", "50% 26%"),
        () => photo("cligno", "50% 14%"),
      ]),
  },
  {
    re: /il pleut|sous la pluie|temps de pluie|pluie/,
    vis: () => sc("route", { fx: "pluie" }),
  },

  // ── Feu tricolore ───────────────────────────────────────────────
  {
    re: /feu orange clignotant|orange clignotant/,
    vis: () => feu("orange-clign"),
  },
  {
    re: /feu rouge clignotant|passage à niveau/,
    vis: () => feu("rouge-clign"),
  },
  {
    re: /feu (passe )?(à l'|au )?orange|feu.*orange/,
    vis: () => feu("orange"),
  },
  { re: /feu rouge|feu (passe )?au rouge/, vis: () => feu("rouge") },
  { re: /feu passe au vert|feu (est )?vert/, vis: () => feu("vert") },

  // ── Panneaux vedettes ───────────────────────────────────────────
  { re: /sens interdit|accès interdit/, vis: () => panneau("sens-interdit") },
  { re: /pointe (vers le |en )?bas/, vis: () => panneau("cede") },
  { re: /triangulaire|triangle/, vis: () => panneau("triangle") },
  {
    re: /rond à bord rouge|rond.*bord rouge/,
    vis: () => panneau("rond-rouge"),
  },
  {
    re: /rond entièrement bleu|panneau obligation|rond bleu/,
    vis: () => panneau("rond-bleu"),
  },
  { re: /gris barré|fin d'interdiction/, vis: () => panneau("fin") },
  { re: /grand « ?p ?»|carré bleu avec/, vis: () => panneau("parking") },
  { re: /zone 30/, vis: () => panneau("zone30") },
  {
    re: /agglo(mération)? barré|sortie d'agglo/,
    vis: () => panneau("agglo-fin"),
  },
  {
    re: /entrée d'agglo|panneau d'entrée|limite agglo|agglomération en france|vitesse max en ville|en ville, sans panneau/,
    vis: () => panneau("agglo"),
  },

  // ── Cockpit ─────────────────────────────────────────────────────
  {
    re: /commodo|comodo/,
    vis: () => cockpit({ hl: ["comodoG", "comodoD"] }),
    rev: () => cockpit({ hl: ["comodoG"], clign: "gauche" }),
  },
  {
    re: /essuie|essuyer le pare-brise/,
    vis: () => cockpit({ hl: ["comodoG", "comodoD"], pluie: true }),
    rev: () => cockpit({ hl: ["comodoD"], wipers: true, pluie: true }),
  },
  {
    re: /commande des feux|montrez.*feux de croisement/,
    vis: () => cockpit({ hl: ["comodoG", "comodoD"] }),
    rev: () => cockpit({ hl: ["comodoG"] }),
  },
  { re: /rétroviseur intérieur/, vis: () => cockpit({ hl: ["retro"] }) },
  {
    re: /mains sur le volant|places-tu tes mains/,
    vis: () => cockpit({ wheelDots: true }),
    rev: () => cockpit({ wheelDots: "915" }),
  },
  { re: /warnings|feux de détresse/, vis: () => cockpit({ clign: "warning" }) },
  {
    re: /quand mets-tu (ton |le )?clignotant|mis ton clignotant|clignotant.*obligatoire/,
    vis: () => cockpit({ clign: "gauche" }),
  },
  {
    re: /voyant.*batterie|batterie s'allume/,
    vis: () => cockpit({ voyants: [["batterie", "rouge"]] }),
  },
  {
    re: /voyant moteur.*clignotant/i,
    vis: () => cockpit({ voyants: [["moteur", "orange", 1]] }),
  },
  {
    re: /voyant moteur/,
    vis: () => cockpit({ voyants: [["moteur", "orange"]] }),
  },
  {
    re: /voyant rouge.*huile|pression (d')?huile/,
    vis: () => cockpit({ voyants: [["huile", "rouge"]] }),
  },
  { re: /\besp\b/, vis: () => cockpit({ voyants: [["esp", "orange", 1]] }) },
  {
    re: /voyant de pression des pneus|pneus s'allume/,
    vis: () => cockpit({ voyants: [["pneu", "orange"]] }),
  },
  {
    re: /un témoin reste allumé/,
    vis: () => cockpit({ voyants: [["moteur", "orange"]] }),
  },
  {
    re: /tableau de bord/,
    vis: () =>
      cockpit({
        voyants: [
          ["batterie", "rouge"],
          ["moteur", "orange"],
          ["frein", "rouge"],
        ],
      }),
  },
  {
    re: /volant dans un virage|tiens-tu le volant|rends le volant|braquer|remets droit/,
    vis: () => cockpit({ hl: ["volant"] }),
  },

  // ── Pédales / levier ────────────────────────────────────────────
  {
    re: /\babs\b|pédale vibre|vibration sous/,
    vis: () => pedales({ press: "frein", vibr: true }),
  },
  {
    re: /freinage dégressif|freinage normal|freinage d'urgence|freinage fort|freines-tu|comment freiner|freines\b/,
    vis: () => pedalePhoto("frein"),
  },
  { re: /embrayage|débraye|patinage/, vis: () => pedalePhoto("embrayage") },
  {
    re: /filet d'accélérateur|dosage de l'accélérateur|accélérateur/,
    vis: () => pedalePhoto("accel"),
  },
  {
    re: /démarr.*(côte|montée)|montée sans frein à main|côte sans frein à main/,
    vis: () => pedalePhoto("frein"),
  },
  { re: /\bcales?\b|caler/, vis: () => pedalePhoto("embrayage") },
  { re: /voiture-école/, vis: () => sc("distance") },
  {
    re: /rétrograd.*5|5.*rétrograd/,
    vis: () => levier({ from: "5", to: "3" }),
  },
  { re: /rétrograd/, vis: () => levier({ from: "4", to: "3" }) },
  { re: /frein moteur/, vis: () => levier({}) },
  {
    re: /passes? en (deuxième|2ème)|vitesse pour passer|passes tes rapports|levier de vitesses|changes de vitesse|en quelle vitesse/,
    vis: () => levier({ knobAt: "2" }),
  },
];

// ═══════════════════════════════════════════════════════════════
// Résolveur public
// ═══════════════════════════════════════════════════════════════

/**
 * Retourne le visuel animé (HTML) pour un énoncé de question, ou ""
 * si aucune brique ne colle (repli = affichage texte actuel).
 * @param {string} text énoncé brut (les ** de gras sont ignorés)
 */
// ═══════════════════════════════════════════════════════════════
// LES FAMILLES — la deuxième passe.
//
// La banque de certification compte 415 questions et elle bouge : un
// tableau écrit question par question serait faux au premier ajout. Les
// règles ci-dessus visent les énoncés qui méritent un cadrage choisi ;
// celles-ci rattrapent TOUT le reste par sujet.
//
// Elles ne servent QUE de la vue et de l'objet, jamais un plan : un plan
// dessiné affirme une géométrie précise, et sur un énoncé qu'on n'a pas lu
// un par un, il aurait une chance de dire le contraire de la question.
// Une vue du poste de conduite, elle, est toujours vraie : c'est là que
// l'élève est assis quoi qu'on lui demande.
// ═══════════════════════════════════════════════════════════════
// Tirage STABLE dans le jeu d'une famille : la même question donne toujours
// la même vue, mais deux questions voisines n'ont pas la même. Sans ça, une
// compétence de 14 questions sur le virage servait 9 fois la même photo, et
// une session de 3 questions montrait deux fois la même image.
// 🔴 Le hash doit BRASSER. Une somme classique (h*31 + code) laisse les bits
// de poids faible dépendre des derniers caractères : toutes les questions
// finissent par « ? », donc six énoncés sur le virage tombaient sur la même
// vue. On mélange (xorshift + multiplication) et on lit les bits de poids
// FORT, qui eux dépendent de la phrase entière.
const choix = (t, jeu) => {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return jeu[(h >>> 0) % jeu.length]();
};

const FAMILLES = [
  // — Ce que l'élève REGARDE
  {
    re: /rétro (intérieur|central)|lunette arrière|derrière toi|te suit|te colle|klaxonne/,
    vis: (t) => choix(t, [
      () => photo("retro-interieur", "50% 45%"),
      () => photo("retro-gauche", "50% 45%"),
      () => photo("angle-mort", "50% 50%"),
    ]),
  },
  {
    re: /rétros? extérieur|carrosserie doit occuper|angle mort|déboît|changement de voie|changer de voie|dépass|doubl/,
    vis: (t) => choix(t, [
      () => photo("angle-mort", "50% 48%"),
      () => photo("angle-mort", "50% 26%"),
      () => photo("retro-gauche", "50% 50%"),
      () => photo("retro-gauche", "50% 30%"),
      () => vue("position"),
      () => photo("retro-interieur", "50% 40%"),
      () => photo("cligno", "50% 24%"),
      () => photo("regard-loin", "50% 38%"),
    ]),
  },
  {
    re: /regard|regardes|fixes|yeux|voir loin|au loin|monotone|paupières|fatigue|somnol|balaye|panneaux?\b|annonce|à voix haute|questions? tournent/,
    vis: (t) => choix(t, [
      () => photo("regard-loin", "50% 42%"),
      () => photo("regard-loin", "50% 60%"),
      () => photo("regard-loin", "50% 26%"),
      () => photo("cligno", "50% 16%"),
      () => photo("marche-arriere", "50% 38%"),
      () => photo("phares", "50% 34%"),
      () => photo("volant", "50% 34%"),
      () => photo("retro-interieur", "50% 52%"),
    ]),
  },

  // — Ce qu'il TOUCHE
  {
    re: /clignotant|cligno|appel de phare|commodo|annonces? comment|avance donnes-tu/,
    vis: (t) => choix(t, [
      () => photo("cligno", "50% 18%"),
      () => photo("cligno", "50% 34%"),
      () => photo("volant", "50% 40%"),
    ]),
  },
  { re: /essuie-glace|lave-glace|balais|pare-brise (sale|couvert|poussière)/, vis: () => photo("essuie-glaces", "50% 38%") },
  {
    re: /feux|phare|optiques|éclairage|croisement|veilleuse|brouillard|tunnel|nuit\b/,
    vis: (t) => choix(t, [
      () => photo("phares", "50% 42%"),
      () => photo("phares", "50% 28%"),
      () => photo("phares", "50% 62%"),
      () => objet("secours"),
      () => photo("essuie-glaces", "50% 30%"),
      () => photo("cligno", "50% 12%"),
      () => photo("regard-loin", "50% 36%"),
      () => photo("marche-arriere", "50% 30%"),
    ]),
  },
  { re: /frein à main|serrer le frein/, vis: () => photo("frein-main", "50% 50%") },
  {
    re: /contact|démarr|témoin|voyant|clé\b/,
    vis: (t) => choix(t, [
      () => photo("contact", "50% 45%"),
      () => photo("frein-main", "50% 48%"),
      () => photo("levier", "50% 45%"),
    ]),
  },
  { re: /ceinture|boucl/, vis: () => photo("ceinture", "50% 38%") },
  {
    re: /siège|dossier|assise|appuie-tête|poste de conduite|installé au poste/,
    vis: (t) => choix(t, [
      () => photo("pedales", "50% 45%"),
      () => photo("ceinture", "50% 30%"),
      () => photo("retro-interieur", "50% 42%"),
      () => photo("cligno", "50% 22%"),
      () => photo("volant", "50% 55%"),
    ]),
  },
  {
    re: /volant|braqu|tenir|mains|trajectoire|virage|courbe|montant du pare-brise|extérieur-intérieur/,
    vis: (t) => choix(t, [
      () => photo("volant", "50% 45%"),
      () => photo("volant", "50% 28%"),
      () => vue("virage"),
      () => photo("regard-loin", "50% 48%"),
      () => pedalePhoto("frein"),
      () => photo("cligno", "50% 30%"),
      () => photo("levier", "50% 40%"),
      () => photo("retro-gauche", "50% 42%"),
    ]),
  },
  {
    re: /pédale|frein|accélérat|embray|débray|pied lourd|tr\/min|régime|pil[ée]|freinage|ralentisseur/,
    vis: (t) => choix(t, [
      () => pedalePhoto("frein"),
      () => pedalePhoto("accel"),
      () => pedalePhoto("embrayage"),
      () => photo("regard-loin", "50% 55%"),
      () => vue("distance"),
      () => photo("pedales", "50% 22%"),
      () => photo("volant", "50% 58%"),
      () => photo("levier", "50% 55%"),
    ]),
  },
  {
    re: /vitesse|rapport|levier|boîte|rétrograd|consomm|carburant|éco/,
    vis: (t) => choix(t, [
      () => photo("levier", "50% 45%"),
      () => objet("jauge"),
      () => pedalePhoto("accel"),
      () => photo("levier", "50% 25%"),
      () => photo("contact", "50% 30%"),
      () => photo("regard-loin", "50% 50%"),
    ]),
  },
  { re: /marche arrière|reculer|te retourn/, vis: () => photo("marche-arriere", "50% 45%") },

  // — Les écarts : la ligne se dessine
  {
    re: /centré|bien placé|bordure|te places|ta voie|voie normale|rouler bien droit|serrer à droite/,
    vis: (t) => choix(t, [
      () => vue("position"),
      () => photo("retro-gauche", "50% 52%"),
      () => photo("regard-loin", "50% 46%"),
      () => photo("volant", "50% 36%"),
      () => photo("cligno", "50% 26%"),
    ]),
  },
  { re: /distance|accordéon|deux secondes|intervalle/, vis: () => vue("distance") },
  {
    re: /créneau|manœuvre|trottoir|ranger|garer|stationner/,
    vis: (t) => choix(t, [
      () => vue("creneau"),
      () => photo("marche-arriere", "50% 50%"),
      () => photo("marche-arriere", "50% 24%"),
      () => photo("retro-gauche", "50% 58%"),
      () => photo("frein-main", "50% 45%"),
      () => photo("levier", "50% 50%"),
      () => photo("volant", "50% 62%"),
    ]),
  },
  { re: /cycliste|vélo|deux-roues|piéton|fragile/, vis: () => vue("cycliste") },
  {
    re: /insér|insertion|voie rapide|autoroute|échangeur|bretelle|sortie\b/,
    vis: (t) => choix(t, [
      () => vue("insertion"),
      () => photo("angle-mort", "50% 45%"),
      () => photo("retro-gauche", "50% 45%"),
      () => photo("levier", "50% 35%"),
      () => photo("regard-loin", "50% 44%"),
      () => photo("cligno", "50% 28%"),
    ]),
  },

  // — Les règles et les chiffres
  {
    re: /gps|itinéraire|trajet|travaux|barrée|coupée|détour|la veille/,
    vis: (t) => choix(t, [() => objet("gps"), () => objet("carte")]),
  },
  { re: /pause|heures? de route|repos|horaire/, vis: () => objet("horloge") },
  {
    re: /pneu|tour de voiture|vérification|niveau|boue/,
    vis: (t) =>
      choix(t, [
        () => objet("pneu"),
        () => photo("phares", "50% 66%"),
        () => objet("compteur"),
        () => photo("contact", "50% 38%"),
      ]),
  },
  { re: /alcool|verre|boire|stupéfiant|cannabis/, vis: () => objet("ethylo") },
  { re: /disque a|probatoire|jeune (conducteur|permis)/, vis: () => objet("disqueA") },
  { re: /point|permis en poche|permis depuis|infraction|retrait/, vis: () => objet("permis") },
  { re: /panne|triangle|gilet|secours|urgence|accident/, vis: () => objet("secours") },
  { re: /inspecteur|examen|jour j|totaliseur|consigne/, vis: () => objet("compteur") },

  // — Le dernier recours. Ce n'est pas un bouche-trou : quelle que soit la
  //   question, l'élève est assis là, la route devant lui. C'est vrai pour
  //   les 415, et c'est la seule image dont on puisse le dire.
  {
    re: /./,
    vis: (t) => choix(t, [
      () => photo("regard-loin", "50% 50%"),
      () => photo("cligno", "50% 20%"),
      () => photo("marche-arriere", "50% 40%"),
      () => photo("volant", "50% 50%"),
    ]),
  },
];

export function quizVisualHTML(text) {
  if (!text) return "";
  const t = String(text).replace(/\*\*/g, "").toLowerCase();
  let bloque = false;
  for (const rule of RULES) {
    if (rule.and && !rule.and.test(t)) continue;
    if (rule.re.test(t)) {
      // Un bloqueur ne dit pas « pas d'image » : il dit « pas de PLAN ».
      // La question a quand même droit à une vue, et les familles la lui
      // donnent juste en dessous.
      if (!rule.vis) {
        bloque = true;
        break;
      }
      try {
        // Une brique peut refuser de dessiner : la grille en H n'existe pas
        // en boîte automatique. Refus = on passe aux familles, pas au vide.
        const html = rule.vis(t);
        if (html) return html;
        bloque = true;
        break;
      } catch {
        bloque = true; // un visuel qui casse ne doit jamais casser le quiz
        break;
      }
    }
  }
  void bloque;
  for (const f of FAMILLES) {
    if (f.re.test(t)) {
      try {
        return f.vis(t);
      } catch {
        return "";
      }
    }
  }
  return "";
}

/**
 * Visuel de RÉVÉLATION : le geste juste, montré après la réponse
 * (jamais pendant la question — il donnerait la solution). "" si la
 * règle qui matche n'a pas de variante de révélation.
 */
export function quizVisualRevealHTML(text) {
  if (!text) return "";
  const t = String(text).replace(/\*\*/g, "").toLowerCase();
  for (const rule of RULES) {
    if (rule.and && !rule.and.test(t)) continue;
    if (rule.re.test(t)) {
      if (!rule.vis || !rule.rev) return "";
      try {
        return rule.rev(t);
      } catch {
        return "";
      }
    }
  }
  return "";
}

// Export pour l'outillage (script de couverture) — pas utilisé en prod.
export const _RULES = RULES;

// ═══════════════════════════════════════════════════════════════
// Styles (à inclure une fois par surface, avec le style du quiz)
// ═══════════════════════════════════════════════════════════════

export const QUIZ_VISUAL_CSS = `
  /* ── LE HUBLOT ────────────────────────────────────────────────
     Le seul cadre du quiz. Quel que soit le registre (une photo du
     poste, un plan vu du ciel, une commande, un objet), l'image
     arrive TOUJOURS dans la même fenêtre, au même format, sous la
     même lumière : une source chaude en haut à droite, un liseré
     violet en haut, une vignette qui referme les bords.
     C'est ce cadre unique qui fait que 124 écrans sont un produit
     et pas une collection. Aucune brique ne porte plus son propre
     fond : elles se posent dans celui-ci. */
  .qzv{position:relative;width:100%;margin:-2px 0 18px;border-radius:20px;overflow:hidden;
    aspect-ratio:16/10;display:grid;place-items:center;
    background:
      radial-gradient(74% 92% at 78% 12%, rgba(212,151,109,.22), transparent 62%),
      linear-gradient(180deg,#241c4a 0%,#1a1436 54%,#120d28 100%);
    border:1px solid rgba(148,132,255,.17);
    box-shadow:inset 0 1px 0 rgba(196,182,255,.24),
      inset 0 -30px 46px -28px rgba(0,0,0,.8),
      0 10px 26px -16px rgba(0,0,0,.75);
    animation:qzvIn .5s cubic-bezier(.34,1.56,.64,1) both}
  .qzv::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;
    background:radial-gradient(122% 122% at 50% 44%,transparent 50%,rgba(8,6,22,.55) 100%)}
  .qzv-svg,.qzv-scene .sit-svg{display:block;width:100%;height:100%;margin:0}
  /* ⚠️ C'est l'IMAGE qu'on cale sur le hublot, jamais le conteneur : .qzv-photo
     EST le .qzv, le passer en absolute le sort du flux et il recouvre la page. */
  .qzv-photo img,.qzv-photo video{position:absolute;inset:0;display:block;
    width:100%;height:100%;object-fit:cover}
  .qzv-pointe{position:absolute;inset:0;width:100%;height:100%}
  /* Une vue du ciel est un plan VERTICAL : on la montre en entier et on
     remplit les côtés avec elle-même, floutée. La couper en paysage
     supprimait les deux voitures et ne laissait qu'une barre abstraite. */
  .qzv-vue .fond{filter:blur(22px) saturate(1.25) brightness(.62);transform:scale(1.15)}
  .qzv-vue .net{object-fit:contain}
  @keyframes qzvIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

  /* animations des briques (transform/opacity uniquement) */
  .qzv-blink{animation:qzvBlink .72s steps(2,jump-none) infinite}
  @keyframes qzvBlink{0%,100%{opacity:1}50%{opacity:.12}}
  .qzv-glow{animation:qzvGlow 1.3s ease-in-out infinite}
  @keyframes qzvGlow{0%,100%{opacity:1}50%{opacity:.55}}
  .qzv-halo{animation:qzvHalo 1.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  @keyframes qzvHalo{0%,100%{opacity:.9;transform:scale(1)}50%{opacity:.35;transform:scale(1.06)}}
  .qzv-pulse{animation:qzvGlow 1.2s ease-in-out infinite}
  .qzv-dot{animation:qzvDot 1.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  @keyframes qzvDot{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}
  .qzv-press{animation:qzvPress 1.7s ease-in-out infinite}
  @keyframes qzvPress{0%,20%,80%,100%{transform:translateY(0)}40%,60%{transform:translateY(6px)}}
  .qzv-vibr{animation:qzvVibr .16s steps(2,jump-none) infinite}
  @keyframes qzvVibr{0%,100%{transform:translateY(4px)}50%{transform:translateY(7px)}}
  .qzv-knob{animation:qzvKnob 2.2s ease-in-out infinite}
  @keyframes qzvKnob{0%,100%{transform:translate(var(--tx,0),0)}50%{transform:translate(var(--tx,0),-2.5px)}}
  .qzv-trace{stroke-dashoffset:0;animation:qzvTrace 1.6s ease-in-out infinite}
  @keyframes qzvTrace{0%,100%{opacity:.35}50%{opacity:1}}
  .qzv-float{animation:qzvFloat 2.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  @keyframes qzvFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  .qzv-roll{animation:qzvRoll 1.1s linear infinite}
  @keyframes qzvRoll{from{transform:translateY(-14px)}to{transform:translateY(8px)}}
  .qzv-ws-rain{animation:qzvGlow .9s ease-in-out infinite}
  .qzv-wipe{transform-origin:0 0;animation:qzvWipe 1.5s ease-in-out infinite}
  @keyframes qzvWipe{0%,100%{transform:rotate(14deg)}50%{transform:rotate(-58deg)}}
  .qzv-lamp{transform-box:fill-box;transform-origin:center}

  /* scène iso : mêmes animations que « En situation » */
  .qzv-scene .sit-clign{opacity:0}
  .qzv-scene .sit-veh.clign-droit .sit-clign-droit,
  .qzv-scene .sit-veh.clign-gauche .sit-clign-gauche{opacity:1;animation:qzvBlink .72s steps(2,jump-none) infinite}
  .qzv-scene .sit-pieton-bob{animation:qzvBob 1.6s ease-in-out infinite}
  @keyframes qzvBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
  .qzv-scene .sit-feu-on{animation:qzvGlow 1.05s ease-in-out infinite}
  .qzv-scene .sit-chev{opacity:0;animation:qzvChev 1.4s ease-in-out infinite}
  @keyframes qzvChev{0%,70%,100%{opacity:0}25%,45%{opacity:1}}

  /* surcouches météo (transform/opacity only) */
  .qzv-fx{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit}
  .qzv-fx-pluie::before,.qzv-fx-pluie::after{content:"";position:absolute;inset:-70% -30%;
    background-image:repeating-linear-gradient(112deg,rgba(165,195,255,.34) 0 2px,transparent 2px 30px);
    animation:qzvRain .55s linear infinite}
  .qzv-fx-pluie::after{background-image:repeating-linear-gradient(108deg,rgba(165,195,255,.18) 0 1.5px,transparent 1.5px 44px);animation-duration:.8s}
  @keyframes qzvRain{to{transform:translate3d(-36px,74px,0)}}
  .qzv-fx-brouillard{background:linear-gradient(180deg,rgba(214,222,238,.12),rgba(210,220,238,.52) 52%,rgba(208,218,236,.7))}
  .qzv-fx-brouillard::before{content:"";position:absolute;inset:-20%;
    background:radial-gradient(48% 34% at 34% 58%,rgba(228,234,246,.5),transparent 70%),radial-gradient(52% 36% at 72% 44%,rgba(228,234,246,.42),transparent 70%);
    animation:qzvFog 6s ease-in-out infinite alternate}
  @keyframes qzvFog{from{transform:translateX(-3%)}to{transform:translateX(3%)}}
  .qzv-fx-nuit{background:linear-gradient(180deg,rgba(7,9,34,.62),rgba(7,9,34,.3) 55%,rgba(7,9,34,.5))}
  .qzv-fx-neige{background:linear-gradient(180deg,rgba(225,235,250,.1),rgba(225,235,250,.22))}
  .qzv-fx-neige::before,.qzv-fx-neige::after{content:"";position:absolute;inset:-80% -20%;
    background-image:radial-gradient(2.2px 2.2px at 12% 18%,rgba(255,255,255,.85),transparent),radial-gradient(1.8px 1.8px at 34% 62%,rgba(255,255,255,.7),transparent),radial-gradient(2.4px 2.4px at 58% 34%,rgba(255,255,255,.8),transparent),radial-gradient(1.6px 1.6px at 78% 74%,rgba(255,255,255,.65),transparent),radial-gradient(2px 2px at 92% 26%,rgba(255,255,255,.75),transparent);
    background-size:220px 220px;animation:qzvSnow 5.5s linear infinite}
  .qzv-fx-neige::after{animation-duration:8s;opacity:.6}
  @keyframes qzvSnow{to{transform:translate3d(-24px,220px,0)}}

  /* reduced motion : état final figé, lampes allumées en continu */
  @media (prefers-reduced-motion: reduce){
    .qzv,.qzv *,.qzv::before,.qzv::after,
    .qzv-fx::before,.qzv-fx::after{animation:none!important}
    .qzv-scene .sit-chev,.qzv-dot{opacity:1}
  }
`;

export const QUIZ_VISUAL_STYLE = `<style>${QUIZ_VISUAL_CSS}</style>`;
