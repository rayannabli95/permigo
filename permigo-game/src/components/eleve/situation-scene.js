// Rendu isométrique 2.5D « jouet » d'une scène routière — SVG pur, zéro WebGL.
// Consomme la description déclarative `scene` de src/data/situations-conduite.js
// et retourne une chaîne SVG. Les animations (clignotants, halo, départ des
// véhicules) sont pilotées par la page via des classes CSS :
//   .sit-veh            groupe véhicule (transition transform posée par la page)
//   .clign-droit/.clign-gauche  sur le groupe → allume les clignotants du côté
//   .sit-halo.show      halo de priorité (injecté via buildFocusFX)
//
// Géométrie : monde en « tuiles » (x = ouest→est, y = sud→nord).
// Projection 2:1 : Est = bas-droite, Nord = haut-droite.

import { esc, escAttr } from "@/utils/escape.js";

const TW = 46; // demi-largeur écran d'une tuile
const TH = 24; // demi-hauteur écran d'une tuile
const ZH = 30; // échelle verticale (z tuiles → px)

const R = 3.55; // demi-taille du plateau (diamant de sol)
const HW = 0.78; // demi-largeur de route (2 voies)
const LANE = 0.39; // décalage du centre de voie
const RING_OUT = 1.85; // giratoire : rayon extérieur de l'anneau
const RING_ISLE = 0.92; // giratoire : rayon de l'îlot central
const RING_LANE = 1.4; // giratoire : rayon de circulation

// cap d'approche (vers le centre) par branche
const BRANCH_IN = { S: [0, 1], N: [0, -1], E: [-1, 0], W: [1, 0] };

const CAR_COLORS = {
  joueur: { hi: "#b39dff", mid: "#7c5cff", lo: "#5236c9" },
  rouge: { hi: "#ff8a7e", mid: "#ef5350", lo: "#b03530" },
  bleu: { hi: "#8fd0ff", mid: "#42a5f5", lo: "#1e6cb8" },
  jaune: { hi: "#ffe082", mid: "#ffca28", lo: "#cf9500" },
  gris: { hi: "#cfd8dc", mid: "#9aa7b0", lo: "#66737c" },
  moto: { hi: "#8c9aa8", mid: "#546e7a", lo: "#33454f" },
};
// vitres : verre foncé commun (les tons clairs faisaient « gâteau à étages »)
const GLASS = { mid: "#55648e", lo: "#3f4c70" };

const GROUND = { top: "#79c453", edge: "#4a8a31", edge2: "#3c7027" };
const ROAD = { fill: "#4b4e66", line: "#f3f4f8", edge: "#3b3e52" };

// ── projection & helpers géométrie ─────────────────────────────

function P(x, y, z = 0) {
  return { x: (x + y) * TW, y: (x - y) * TH - z * ZH };
}
const f1 = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${f1(p.x)},${f1(p.y)}`;
const pts = (arr) => arr.map(pt).join(" ");

function poly(points, fill, extra = "") {
  return `<polygon points="${pts(points)}" fill="${fill}" ${extra}/>`;
}

/** Coins (monde) d'un rectangle orienté : centre c, cap u, demi-long hl, demi-larg hw. */
function rectCorners(cx, cy, ux, uy, hl, hw) {
  const sx = uy,
    sy = -ux; // droite du cap
  return [
    [cx + ux * hl + sx * hw, cy + uy * hl + sy * hw], // avant-droit
    [cx + ux * hl - sx * hw, cy + uy * hl - sy * hw], // avant-gauche
    [cx - ux * hl - sx * hw, cy - uy * hl - sy * hw], // arrière-gauche
    [cx - ux * hl + sx * hw, cy - uy * hl + sy * hw], // arrière-droit
  ];
}

function flatRect(cx, cy, ux, uy, hl, hw, fill, extra = "") {
  const c = rectCorners(cx, cy, ux, uy, hl, hw).map(([x, y]) => P(x, y));
  return poly(c, fill, extra);
}

/**
 * Boîte iso : footprint orienté + z0..z1. Faces verticales visibles
 * (normale n : visible ssi n.x − n.y > 0), puis face du dessus.
 * shade(faceNormal) → couleur.
 */
function isoBox(cx, cy, ux, uy, hl, hw, z0, z1, colors) {
  const corners = rectCorners(cx, cy, ux, uy, hl, hw);
  const sx = uy,
    sy = -ux;
  // normales sortantes des 4 faces (avant, droite, arrière, gauche)
  const faces = [
    { edge: [corners[1], corners[0]], n: [ux, uy] },
    { edge: [corners[0], corners[3]], n: [sx, sy] },
    { edge: [corners[3], corners[2]], n: [-ux, -uy] },
    { edge: [corners[2], corners[1]], n: [-sx, -sy] },
  ];
  let out = "";
  for (const f of faces) {
    if (f.n[0] - f.n[1] <= 0.001) continue; // face cachée
    const [a, b] = f.edge;
    const quad = [
      P(a[0], a[1], z0),
      P(b[0], b[1], z0),
      P(b[0], b[1], z1),
      P(a[0], a[1], z1),
    ];
    // face plutôt « sud » (n.y<0) = teinte moyenne, plutôt « est » = foncée
    const fill = f.n[1] < f.n[0] ? colors.lo : colors.mid;
    out += poly(quad, fill);
  }
  out += poly(
    corners.map(([x, y]) => P(x, y, z1)),
    colors.hi,
  );
  return out;
}

/** Cercle monde projeté (ellipse) en path SVG. */
function circlePath(cx, cy, r, samples = 40) {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const a = (i / samples) * Math.PI * 2;
    const p = P(cx + r * Math.cos(a), cy + r * Math.sin(a));
    d += (i === 0 ? "M" : "L") + pt(p);
  }
  return d + "Z";
}

/** Pose d'un véhicule : position monde + cap unitaire. */
function vehiclePose(v) {
  if (typeof v.angle === "number") {
    const a = (v.angle * Math.PI) / 180;
    return {
      x: RING_LANE * Math.cos(a),
      y: RING_LANE * Math.sin(a),
      ux: -Math.sin(a), // sens anti-horaire (France)
      uy: Math.cos(a),
    };
  }
  const [ux, uy] = BRANCH_IN[v.at] || BRANCH_IN.S;
  const sx = uy,
    sy = -ux;
  const lane = v.lane ?? LANE;
  const d = v.d ?? 2;
  return { x: -ux * d + sx * lane, y: -uy * d + sy * lane, ux, uy };
}

/** Décalage écran (px) pour avancer un acteur de `tiles` tuiles. */
export function actorScreenDelta(scene, actorId, tiles = 3.4) {
  if (actorId === "pieton") {
    // le piéton traverse vers l'est
    return { dx: TW * tiles * 0.5, dy: TH * tiles * 0.5 };
  }
  const v = (scene.vehicules || []).find((x) => x.id === actorId);
  if (!v) return { dx: 0, dy: 0 };
  const { ux, uy } = vehiclePose(v);
  return { dx: (ux + uy) * TW * tiles, dy: (ux - uy) * TH * tiles };
}

// ── éléments de décor ──────────────────────────────────────────

function groundMarkup() {
  const cs = [P(R, R), P(R, -R), P(-R, -R), P(-R, R)];
  const e = 16; // épaisseur du plateau
  const lift = (p) => ({ x: p.x, y: p.y + e });
  // faces basses visibles : SE (entre (R,-R) et (R,R)) et SW (entre (-R,-R) et (R,-R))
  const se = [cs[1], cs[0], lift(cs[0]), lift(cs[1])];
  const sw = [cs[2], cs[1], lift(cs[1]), lift(cs[2])];
  return poly(se, GROUND.edge) + poly(sw, GROUND.edge2) + poly(cs, GROUND.top);
}

function roadAlongY(halfW = HW) {
  const c = [
    P(halfW, R + 0.4),
    P(halfW, -R - 0.4),
    P(-halfW, -R - 0.4),
    P(-halfW, R + 0.4),
  ];
  return poly(c, ROAD.fill);
}
function roadAlongX(halfW = HW) {
  const c = [
    P(R + 0.4, halfW),
    P(R + 0.4, -halfW),
    P(-R - 0.4, -halfW),
    P(-R - 0.4, halfW),
  ];
  return poly(c, ROAD.fill);
}
/** Tronçon de route d'une branche (giratoire), du rayon d0 au bord. */
function branchRoad(branch, d0, halfW = HW) {
  const [ux, uy] = BRANCH_IN[branch];
  const mid = (d0 + R + 0.4) / 2;
  return flatRect(
    -ux * mid,
    -uy * mid,
    ux,
    uy,
    (R + 0.4 - d0) / 2,
    halfW,
    ROAD.fill,
  );
}

/** Ligne d'axe continue (interdiction de dépasser), sur toute la route. */
function centerLine() {
  return flatRect(0, 0, 0, 1, R + 0.4, 0.035, ROAD.line, 'opacity=".9"');
}

/** Pointillés d'axe le long d'une branche, de d0 à d1. */
function dashes(branch, d0, d1, off = 0) {
  const [ux, uy] = BRANCH_IN[branch];
  const sx = uy,
    sy = -ux;
  let out = "";
  for (let d = d0; d < d1; d += 0.56) {
    out += flatRect(
      -ux * (d + 0.14) + sx * off,
      -uy * (d + 0.14) + sy * off,
      ux,
      uy,
      0.14,
      0.035,
      ROAD.line,
      'opacity=".85"',
    );
  }
  return out;
}

/** Ligne stop / cédez sur la voie d'arrivée d'une branche. */
function stopLine(branch, dashed = false) {
  const [ux, uy] = BRANCH_IN[branch];
  const sx = uy,
    sy = -ux;
  const d = 1.08;
  if (!dashed) {
    return flatRect(
      -ux * d + sx * 0.41,
      -uy * d + sy * 0.41,
      ux,
      uy,
      0.075,
      0.34,
      ROAD.line,
    );
  }
  let out = "";
  for (const o of [0.15, 0.41, 0.67]) {
    out += flatRect(
      -ux * d + sx * o,
      -uy * d + sy * o,
      ux,
      uy,
      0.075,
      0.1,
      ROAD.line,
    );
  }
  return out;
}

/** Passage piéton : bandes blanches en travers de la route. */
function crosswalk(cy) {
  let out = "";
  for (let x = -0.62; x <= 0.62; x += 0.31) {
    out += flatRect(x, cy, 0, 1, 0.17, 0.11, ROAD.line, 'opacity=".92"');
  }
  return out;
}

function tree(x, y, big = false) {
  const b = P(x, y);
  const s = big ? 1.25 : 1;
  return `<g transform="translate(${f1(b.x)},${f1(b.y)})">
    <ellipse cx="0" cy="2" rx="${13 * s}" ry="${6 * s}" fill="rgba(20,30,15,.28)"/>
    <rect x="${-2.4 * s}" y="${-14 * s}" width="${4.8 * s}" height="${15 * s}" rx="2" fill="#7a5236"/>
    <circle cx="0" cy="${-24 * s}" r="${13.5 * s}" fill="#3e9e4f"/>
    <circle cx="${-7 * s}" cy="${-17 * s}" r="${9 * s}" fill="#4cb85e"/>
    <circle cx="${7.5 * s}" cy="${-18 * s}" r="${8.5 * s}" fill="#369147"/>
  </g>`;
}

// ── panneaux, feux, piéton (billboards) ────────────────────────

function signAt(branch, type, d = 1.35) {
  const [ux, uy] = BRANCH_IN[branch];
  const sx = uy,
    sy = -ux;
  const base = P(-ux * d + sx * (HW + 0.45), -uy * d + sy * (HW + 0.45));
  let head = "";
  if (type === "stop") {
    const o = [];
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2;
      o.push(`${f1(Math.cos(a) * 12)},${f1(-37 + Math.sin(a) * 12)}`);
    }
    head = `<polygon points="${o.join(" ")}" fill="#e02b2b" stroke="#fff" stroke-width="1.6"/>
      <text x="0" y="-34.4" text-anchor="middle" font-family="Inter,sans-serif" font-size="6.6" font-weight="800" fill="#fff">STOP</text>`;
  } else if (type === "cede") {
    head = `<polygon points="-12,-46 12,-46 0,-27" fill="#fff" stroke="#e02b2b" stroke-width="4" stroke-linejoin="round"/>`;
  } else if (type === "prio") {
    head = `<polygon points="-13,-27 13,-27 0,-48" fill="#fff" stroke="#e02b2b" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="M -4 -40 L 4 -32 M 4 -40 L -4 -32" stroke="#1a1d2e" stroke-width="2" stroke-linecap="round"/>`;
  } else if (type === "giratoire") {
    head = `<circle cx="0" cy="-37" r="12.5" fill="#1e74d6" stroke="#fff" stroke-width="1.6"/>
      <circle cx="0" cy="-37" r="6" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="7.5 2.6"/>
      <polygon points="-1.5,-45.5 3.5,-43.4 -0.6,-40.6" fill="#fff"/>
      <polygon points="6.2,-32.4 3.2,-28 1.6,-33.2 " fill="#fff"/>
      <polygon points="-5.5,-31.6 -7.3,-36.6 -2.6,-34.4" fill="#fff"/>`;
  }
  return {
    sy: base.y,
    svg: `<g transform="translate(${f1(base.x)},${f1(base.y)})">
    <ellipse cx="0" cy="1.5" rx="7" ry="3.4" fill="rgba(20,30,15,.3)"/>
    <rect x="-1.5" y="-28" width="3" height="29" rx="1.5" fill="#8b93a8"/>
    ${head}
  </g>`,
  };
}

function feuAt(branch, etat = "orange") {
  const [ux, uy] = BRANCH_IN[branch];
  const sx = uy,
    sy = -ux;
  const base = P(-ux * 1.25 + sx * (HW + 0.45), -uy * 1.25 + sy * (HW + 0.45));
  const lamp = (cy, on, col, dim) =>
    `<circle cx="0" cy="${cy}" r="4.2" fill="${on ? col : dim}" ${on ? `class="sit-feu-on" style="--feu:${col}"` : ""}/>`;
  return {
    sy: base.y,
    svg: `<g transform="translate(${f1(base.x)},${f1(base.y)})">
    <ellipse cx="0" cy="1.5" rx="7" ry="3.4" fill="rgba(20,30,15,.3)"/>
    <rect x="-2" y="-34" width="4" height="35" rx="2" fill="#5b6270"/>
    <rect x="-9" y="-66" width="18" height="36" rx="6" fill="#262b38" stroke="#3a4152" stroke-width="1.4"/>
    ${lamp(-57, etat === "rouge", "#ff5252", "#57262a")}
    ${lamp(-48, etat === "orange", "#ffb300", "#5c4a22")}
    ${lamp(-39, etat === "vert", "#4caf50", "#25402a")}
  </g>`,
  };
}

function pietonMarkup(scene) {
  const engage = !!scene.pieton?.engage;
  const wx = engage ? -0.18 : -1.12;
  const base = P(wx, 0.55);
  return {
    sy: base.y,
    svg: `<g class="sit-pieton" data-actor="pieton" transform="translate(${f1(base.x)},${f1(base.y)})">
    <ellipse cx="0" cy="1.5" rx="9" ry="4" fill="rgba(20,30,15,.3)"/>
    <g class="sit-pieton-bob">
      <rect x="-5.5" y="-24" width="11" height="17" rx="5.5" fill="#ff7043"/>
      <rect x="-3.4" y="-9" width="2.9" height="9" rx="1.4" fill="#37474f"/>
      <rect x="0.6" y="-9" width="2.9" height="9" rx="1.4" fill="#37474f"/>
      <circle cx="0" cy="-30" r="6.4" fill="#ffcc80"/>
    </g>
  </g>`,
  };
}

// ── véhicules ──────────────────────────────────────────────────

function vehicleMarkup(v, opts) {
  const pose = vehiclePose(v);
  const { x, y, ux, uy } = pose;
  const isMoto = v.type === "moto";
  const col = CAR_COLORS[v.couleur] || CAR_COLORS.gris;
  const L = isMoto ? 0.3 : 0.5; // demi-longueur
  const W = isMoto ? 0.075 : 0.27; // demi-largeur
  const sx = uy,
    sy = -ux;

  const shadow = (() => {
    const c = rectCorners(x, y, ux, uy, L * 1.1, W * 1.5).map(([a, b]) =>
      P(a, b),
    );
    return poly(c, "rgba(20,25,45,.32)");
  })();

  // roues : 4 coins rentrés
  let wheels = "";
  if (!isMoto) {
    for (const du of [0.62, -0.62]) {
      for (const ds of [1.02, -1.02]) {
        const wp = P(
          x + ux * L * du + sx * W * ds,
          y + uy * L * du + sy * W * ds,
          0.06,
        );
        wheels += `<ellipse cx="${f1(wp.x)}" cy="${f1(wp.y)}" rx="4" ry="3" fill="#20233a"/>`;
      }
    }
  } else {
    for (const du of [0.95, -0.95]) {
      const wp = P(x + ux * L * du, y + uy * L * du, 0.05);
      wheels += `<ellipse cx="${f1(wp.x)}" cy="${f1(wp.y)}" rx="4.4" ry="4" fill="#20233a"/>`;
    }
  }

  const body = isoBox(x, y, ux, uy, L, W, 0.1, isMoto ? 0.26 : 0.52, col);
  let cabin = "";
  if (!isMoto) {
    cabin = isoBox(
      x - ux * 0.06,
      y - uy * 0.06,
      ux,
      uy,
      L * 0.52,
      W * 0.8,
      0.52,
      0.84,
      {
        hi: col.hi,
        mid: GLASS.mid,
        lo: GLASS.lo,
      },
    );
  } else {
    // pilote : buste penché + casque
    const b = P(x, y, 0.34);
    const h = P(x, y, 0.62);
    cabin = `<ellipse cx="${f1(b.x)}" cy="${f1(b.y)}" rx="5.2" ry="7" fill="#37474f"/>
      <circle cx="${f1(h.x)}" cy="${f1(h.y)}" r="4.8" fill="#e53935"/>
      <circle cx="${f1(h.x - 1.4)}" cy="${f1(h.y - 1.2)}" r="1.6" fill="rgba(255,255,255,.55)"/>`;
  }

  // clignotants (avant + arrière du côté) — activés par classe sur le groupe
  const blink = (side) => {
    const dir = side === "droit" ? 1 : -1;
    let out = `<g class="sit-clign sit-clign-${side}">`;
    for (const du of [0.94, -0.94]) {
      const bp = P(
        x + ux * L * du + sx * W * dir,
        y + uy * L * du + sy * W * dir,
        0.34,
      );
      out += `<circle cx="${f1(bp.x)}" cy="${f1(bp.y)}" r="3.6" fill="#ffb300" stroke="#fff" stroke-width="1.4"/>`;
    }
    return out + "</g>";
  };

  // étiquette « Toi »
  let tag = "";
  if (v.label) {
    const tp = P(x, y, 1.5);
    const w = v.label.length * 7.2 + 18;
    tag = `<g class="sit-tag">
      <path d="M ${f1(tp.x - 5)} ${f1(tp.y + 10)} l 5 6 l 5 -6 Z" fill="#ffcb3d"/>
      <rect x="${f1(tp.x - w / 2)}" y="${f1(tp.y - 9)}" width="${w}" height="20" rx="10" fill="#ffcb3d"/>
      <text x="${f1(tp.x)}" y="${f1(tp.y + 5.2)}" text-anchor="middle" font-family="'Baloo 2','Fredoka',sans-serif" font-size="12.5" font-weight="800" fill="#3a1d00">${esc(v.label)}</text>
    </g>`;
  }

  const hit = opts.tappable.includes(v.id)
    ? `<ellipse class="sit-hit" data-hit="${escAttr(v.id)}" cx="${f1(P(x, y, 0.4).x)}" cy="${f1(P(x, y, 0.4).y)}" rx="60" ry="45" fill="rgba(0,0,0,0)" style="pointer-events:all;cursor:pointer"/>`
    : "";

  const cls = [
    "sit-veh",
    ["droit", "gauche"].includes(v.clign) ? `clign-${v.clign}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const baseP = P(x, y);
  return {
    sy: baseP.y,
    svg: `<g class="${cls}" data-veh="${escAttr(v.id)}">${shadow}${wheels}${body}${cabin}${blink("droit")}${blink("gauche")}${tag}${hit}</g>`,
  };
}

// ── FX de correction (halo + chevrons de trajectoire) ──────────

/**
 * Fragment SVG à injecter dans <g class="sit-fx"> pour montrer QUI est
 * prioritaire : halo doré pulsé sous l'acteur + chevrons dans son sens.
 */
export function buildFocusFX(scene, focus) {
  if (!focus) return "";
  let x, y, ux, uy;
  if (focus.pieton) {
    const engage = !!scene.pieton?.engage;
    x = engage ? -0.18 : -1.12;
    y = 0.55;
    ux = 1;
    uy = 0;
  } else {
    const v = (scene.vehicules || []).find((n) => n.id === focus.veh);
    if (!v) return "";
    ({ x, y, ux, uy } = vehiclePose(v));
  }
  const base = P(x, y);
  let out = `<ellipse class="sit-halo show" cx="${f1(base.x)}" cy="${f1(base.y)}" rx="40" ry="24" fill="rgba(255,203,61,.16)" stroke="#ffcb3d" stroke-width="3"/>`;
  // chevrons dans le sens de circulation
  const d = { x: (ux + uy) * TW, y: (ux - uy) * TH };
  const len = Math.hypot(d.x, d.y) || 1;
  const step = { x: (d.x / len) * 30, y: (d.y / len) * 30 };
  const ang = (Math.atan2(d.y, d.x) * 180) / Math.PI;
  const front = P(x + ux * 0.85, y + uy * 0.85);
  for (let i = 1; i <= 3; i++) {
    out += `<path class="sit-chev" style="animation-delay:${i * 0.18}s"
      d="M -8 -7 L 2 0 L -8 7" fill="none" stroke="#ffcb3d" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"
      transform="translate(${f1(front.x + step.x * i)},${f1(front.y + step.y * i)}) rotate(${f1(ang)})"/>`;
  }
  return out;
}

// ── rendu principal ────────────────────────────────────────────

/**
 * @param {Object} scene  description déclarative (voir situations-conduite.js)
 * @param {Object} [opts]
 * @param {string}  [opts.alt]       description a11y de la scène
 * @param {string[]}[opts.tappable]  ids de véhicules cliquables (mode cible)
 * @returns {string} markup <svg>
 */
export function renderSituationScene(scene, opts = {}) {
  const o = { alt: "", tappable: [], ...opts };
  const kind = scene.kind || "croisement";

  // 1. sol
  let ground = groundMarkup();

  // 2. routes + marquages (dans le clip du plateau)
  let roads = "";
  if (kind === "route") {
    const cw = scene.passage ? 0.55 : null;
    roads += roadAlongY();
    // lignes de rive
    for (const side of [HW - 0.045, -(HW - 0.045)]) {
      roads += flatRect(
        side,
        0,
        0,
        1,
        R + 0.4,
        0.028,
        ROAD.line,
        'opacity=".5"',
      );
    }
    if (scene.ligne === "continue") {
      roads += centerLine();
    } else {
      roads += dashes("S", cw != null ? 1.0 : -R, R + 0.2);
      if (cw != null) roads += dashes("N", 0.2, R + 0.2);
    }
    if (cw != null) roads += crosswalk(cw);
  } else if (kind === "croisement") {
    roads += roadAlongY() + roadAlongX();
    for (const b of ["N", "S", "E", "W"]) roads += dashes(b, 1.0, R + 0.2);
    if (scene.signal?.type === "stop")
      roads += stopLine(scene.signal.branch || "S");
    if (scene.signal?.type === "cede")
      roads += stopLine(scene.signal.branch || "S", true);
    if (scene.signal?.type === "feu")
      roads += crossFeuLine(scene.signal.branch || "S");
  } else if (kind === "giratoire") {
    const wide = scene.lanes2;
    for (const b of ["N", "S", "E", "W"]) {
      roads += branchRoad(b, RING_OUT - 0.35, b === wide ? 1.12 : HW);
    }
    roads += `<path d="${circlePath(0, 0, RING_OUT)}" fill="${ROAD.fill}"/>`;
    roads += `<path d="${circlePath(0, 0, RING_LANE)}" fill="none" stroke="${ROAD.line}" stroke-width="2" stroke-dasharray="9 11" opacity=".45"/>`;
    // îlot central
    roads += `<path d="${circlePath(0, 0, RING_ISLE)}" fill="${GROUND.top}" stroke="#e8e2d0" stroke-width="3"/>`;
    // cédez à chaque entrée (sauf la branche large : les flèches y sont la star)
    for (const b of ["N", "S", "E", "W"]) {
      if (b !== wide) roads += ringYield(b);
    }
    if (wide) {
      // séparateur des 2 files d'entrée
      const [ux, uy] = BRANCH_IN[wide];
      const sx = uy,
        sy = -ux;
      for (let d = 2.15; d < R + 0.2; d += 0.56) {
        roads += flatRect(
          -ux * (d + 0.14) + sx * 0.585,
          -uy * (d + 0.14) + sy * 0.585,
          ux,
          uy,
          0.14,
          0.035,
          ROAD.line,
          'opacity=".85"',
        );
      }
      // flèches au sol : file gauche = tourne-à-gauche, file droite = tout droit/à droite
      roads += laneArrow(wide, 0.3, "gauche") + laneArrow(wide, 0.87, "droite");
    }
  }

  // 3. objets triés par profondeur (sy croissant = du fond vers l'avant)
  const objects = [];

  const treeSpots =
    kind === "route"
      ? [
          [1.75, -2.2],
          [-1.8, -1.0],
          [1.75, 1.6],
          [-1.8, 2.6],
        ]
      : [
          [2.6, 2.35],
          [-2.5, 2.55],
          [-2.55, -2.35],
        ];
  for (const [tx, ty] of treeSpots) {
    objects.push({ sy: P(tx, ty).y, svg: tree(tx, ty) });
  }
  for (const [tx, ty] of scene.arbres || []) {
    objects.push({ sy: P(tx, ty).y, svg: tree(tx, ty, true) });
  }
  if (kind === "giratoire") {
    objects.push({ sy: P(0, 0).y, svg: tree(0, 0.05, true) });
  }

  if (scene.signal?.type === "feu") {
    objects.push(
      feuAt(scene.signal.branch || "S", scene.signal.etat || "orange"),
    );
  } else if (scene.signal?.type) {
    objects.push(
      signAt(
        scene.signal.branch || "S",
        scene.signal.type,
        kind === "giratoire" ? 2.3 : 1.35,
      ),
    );
  }

  if (scene.pieton) objects.push(pietonMarkup(scene));
  for (const v of scene.vehicules || []) objects.push(vehicleMarkup(v, o));

  objects.sort((a, b) => a.sy - b.sy);

  return `<svg class="sit-svg" viewBox="-352 -248 704 452" role="img" aria-label="${escAttr(o.alt)}" focusable="false">
    <defs><clipPath id="sit-ground-clip"><polygon points="${pts([P(R, R), P(R, -R), P(-R, -R), P(-R, R)])}"/></clipPath></defs>
    ${ground}
    <g clip-path="url(#sit-ground-clip)">${roads}</g>
    ${objects.map((x) => x.svg).join("")}
    <g class="sit-fx"></g>
  </svg>`;
}

/** Ligne d'effet de feu : simple ligne d'arrêt pleine. */
function crossFeuLine(branch) {
  return stopLine(branch);
}

/** Cédez (pointillés) à l'entrée d'un giratoire. */
function ringYield(branch, wide = false) {
  const [ux, uy] = BRANCH_IN[branch];
  const sx = uy,
    sy = -ux;
  let out = "";
  const offs = wide ? [0.16, 0.42, 0.68, 0.94] : [0.16, 0.42, 0.68];
  for (const off of offs) {
    out += flatRect(
      -ux * 2.0 + sx * off,
      -uy * 2.0 + sy * off,
      ux,
      uy,
      0.07,
      0.1,
      ROAD.line,
    );
  }
  return out;
}

/** Flèche peinte au sol sur une file d'entrée (tourne à gauche / à droite). */
function laneArrow(branch, off, sens) {
  const [ux, uy] = BRANCH_IN[branch];
  const sx = uy,
    sy = -ux;
  const cx = -ux * 2.3 + sx * off;
  const cy = -uy * 2.3 + sy * off;
  // tige le long du cap
  let out = flatRect(cx, cy, ux, uy, 0.3, 0.07, ROAD.line, 'opacity=".95"');
  // coude + pointe vers la gauche (−s) ou la droite (+s)
  const dir = sens === "gauche" ? -1 : 1;
  const ex = cx + ux * 0.3 + sx * dir * 0.11;
  const ey = cy + uy * 0.3 + sy * dir * 0.11;
  out += flatRect(
    ex,
    ey,
    sx * dir,
    sy * dir,
    0.16,
    0.07,
    ROAD.line,
    'opacity=".95"',
  );
  const tx = ex + sx * dir * 0.19;
  const ty = ey + sy * dir * 0.19;
  const tip = [
    P(tx + sx * dir * 0.18, ty + sy * dir * 0.18),
    P(tx + ux * 0.14, ty + uy * 0.14),
    P(tx - ux * 0.14, ty - uy * 0.14),
  ];
  out += poly(tip, ROAD.line, 'opacity=".95"');
  return out;
}
