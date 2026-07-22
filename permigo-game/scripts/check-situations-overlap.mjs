// Garde-fou : détecte les véhicules qui se chevauchent au premier rendu dans
// chaque scène de situations-conduite.js (SAT sur boîtes orientées).
// Formules copiées de vehiclePose()/rectCorners() de situation-scene.js —
// à garder synchronisées si le moteur change.
// Usage : node scripts/check-situations-overlap.mjs (code de sortie 1 si chevauchement)
import { SITUATIONS } from "../src/data/situations-conduite.js";

const LANE = 0.39;
const RING_LANE = 1.4;
const RAMP = { cx: 2.6, cy: -1.0, r: 1.9 };
const BRANCH_IN = { S: [0, 1], N: [0, -1], E: [-1, 0], W: [1, 0] };

function vehiclePose(v) {
  if (typeof v.bretelle === "number") {
    const a = ((270 - v.bretelle * 90) * Math.PI) / 180;
    return {
      x: RAMP.cx + RAMP.r * Math.cos(a),
      y: RAMP.cy + RAMP.r * Math.sin(a),
      ux: Math.sin(a),
      uy: -Math.cos(a),
    };
  }
  if (typeof v.angle === "number") {
    const a = (v.angle * Math.PI) / 180;
    return {
      x: RING_LANE * Math.cos(a),
      y: RING_LANE * Math.sin(a),
      ux: -Math.sin(a),
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

function dims(v) {
  const isMoto = v.type === "moto";
  const isVelo = v.type === "velo";
  const isBus = v.type === "bus";
  const isCamion = v.type === "camion";
  const L = isVelo ? 0.24 : isMoto ? 0.3 : isBus ? 0.95 : isCamion ? 0.85 : 0.5;
  const W = isVelo ? 0.05 : isMoto ? 0.075 : isBus || isCamion ? 0.3 : 0.27;
  return { L, W };
}

/** Coins (monde) d'un rectangle orienté — copie de rectCorners() du moteur. */
function rectCorners(cx, cy, ux, uy, hl, hw) {
  const sx = uy,
    sy = -ux;
  return [
    [cx + ux * hl + sx * hw, cy + uy * hl + sy * hw],
    [cx + ux * hl - sx * hw, cy + uy * hl - sy * hw],
    [cx - ux * hl - sx * hw, cy - uy * hl - sy * hw],
    [cx - ux * hl + sx * hw, cy - uy * hl + sy * hw],
  ];
}

/** SAT : overlap (en unités monde, >0 = chevauchement) entre 2 polygones convexes. */
function satOverlap(polyA, polyB) {
  const polys = [polyA, polyB];
  let minOverlap = Infinity;
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];
      // normale à l'arête
      const nx = -(y2 - y1);
      const ny = x2 - x1;
      const len = Math.hypot(nx, ny) || 1;
      const ax = nx / len,
        ay = ny / len;
      const proj = (p) => p[0] * ax + p[1] * ay;
      const a = polyA.map(proj);
      const b = polyB.map(proj);
      const aMin = Math.min(...a),
        aMax = Math.max(...a);
      const bMin = Math.min(...b),
        bMax = Math.max(...b);
      const overlap = Math.min(aMax, bMax) - Math.max(aMin, bMin);
      if (overlap <= 0) return 0; // axe séparateur trouvé → pas de collision
      minOverlap = Math.min(minOverlap, overlap);
    }
  }
  return minOverlap; // >0 = profondeur de chevauchement (unités monde/tuile)
}

const results = [];

for (const s of SITUATIONS) {
  const vehs = s.scene?.vehicules || [];
  if (vehs.length < 2) continue;
  const poses = vehs.map((v) => {
    const p = vehiclePose(v);
    const { L, W } = dims(v);
    const corners = rectCorners(p.x, p.y, p.ux, p.uy, L, W);
    return { v, ...p, L, W, corners };
  });
  for (let i = 0; i < poses.length; i++) {
    for (let j = i + 1; j < poses.length; j++) {
      const A = poses[i],
        B = poses[j];
      const ov = satOverlap(A.corners, B.corners);
      if (ov > 0.001) {
        results.push({
          id: s.id,
          theme: s.theme,
          kind: s.scene.kind,
          vehA: A.v.id,
          vehB: B.v.id,
          overlap: Math.round(ov * 1000) / 1000,
          A: { at: A.v.at, d: A.v.d, lane: A.v.lane, angle: A.v.angle, bretelle: A.v.bretelle, type: A.v.type },
          B: { at: B.v.at, d: B.v.d, lane: B.v.lane, angle: B.v.angle, bretelle: B.v.bretelle, type: B.v.type },
        });
      }
    }
  }
}

results.sort((a, b) => b.overlap - a.overlap);

console.log(`Total scènes : ${SITUATIONS.length}`);
console.log(
  `Scènes avec >=2 véhicules : ${SITUATIONS.filter((s) => (s.scene?.vehicules || []).length >= 2).length}`,
);
console.log(`Chevauchements RÉELS (OBB-OBB, SAT) : ${results.length}\n`);

for (const r of results) {
  console.log(
    `${r.id}  [${r.theme}/${r.kind}]  ${r.vehA} × ${r.vehB}  overlap=${r.overlap} tuile`,
  );
  console.log(`   A(${r.vehA}): ${JSON.stringify(r.A)}`);
  console.log(`   B(${r.vehB}): ${JSON.stringify(r.B)}`);
}

process.exit(results.length ? 1 : 0);
