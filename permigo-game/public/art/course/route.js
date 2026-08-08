// ═══════════════════════════════════════════════════════════════
// La route, dessinée au trait.
//
// 🔴🔴 POURQUOI PAS DU CSS 3D. La première version posait une image de
// bitume sur un plan basculé en `rotateX`. Ça marche à l'écran mais le
// navigateur rasterise un tel calque à la résolution de sa partie la PLUS
// PROCHE, donc de plusieurs dizaines de millions de pixels. Résultat : une
// image sur deux perdue et un écran qui clignote en continu. Aucun réglage de
// taille ne rattrape ça, c'est le principe qui est mauvais.
//
// Ici, une projection à la main dans un canvas. La chaussée est un simple
// trapèze : en perspective, une droite du sol reste une droite à l'écran.
// Une poignée de tracés par image, net à toutes les résolutions, et zéro
// texture à charger.
//
//   z  = mètres devant la voiture     x = mètres à droite de l'axe
//   yE = HORIZON + F * HAUTEUR / z    xE = milieu + F * x / z
//
// La même projection sert au décor ET aux véhicules : ils ne peuvent donc
// pas se désaccorder.
// ═══════════════════════════════════════════════════════════════

export const HAUTEUR = 4.1; // hauteur de la caméra, en mètres
export const F = 750; // « focale » en pixels, pour une vue de 380 px de large
export const HORIZON = 0.4; // ligne d'horizon, en part de la hauteur de l'écran

// La chaussée : l'élève roule au milieu de la voie de droite, donc x = 0.
const BORD_D = 1.9;
const BORD_G = -5.4;
const AXE = -1.75;
const LIGNE = 0.14; // largeur d'un marquage, en mètres
const DASH = 3; // trait de l'axe
const TROU = 4.5;

const COUL = {
  bitume0: "#2b2350", // près
  bitume1: "#1d1740", // loin
  marquage: "#cdc0e8",
  bord: "#171034",
  halo: "rgba(232, 164, 98, 0.34)",
};

export function creerRoute(canvas, { largeur, hauteur }) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 0,
    H = 0,
    hy = 0,
    f = 0,
    dpr = 1;

  function taille(l, h) {
    // On plafonne à 2 : au-delà on paie des pixels que personne ne voit.
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = l;
    H = h;
    canvas.width = Math.round(l * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = l + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hy = H * HORIZON;
    // La focale suit la largeur, sinon un grand écran voit une route étroite.
    f = F * (W / 380);
  }
  taille(largeur, hauteur);

  const yDe = (z) => hy + (f * HAUTEUR) / z;
  const xDe = (x, z) => W / 2 + (f * x) / z;
  const parMetre = (z) => f / z;
  // La distance visible au bas de l'écran, utile pour ne rien dessiner en trop.
  const zProche = () => (f * HAUTEUR) / (H - hy);

  function quad(x1, x2, z1, z2) {
    const y1 = yDe(z1),
      y2 = yDe(z2);
    ctx.beginPath();
    ctx.moveTo(xDe(x1, z1), y1);
    ctx.lineTo(xDe(x2, z1), y1);
    ctx.lineTo(xDe(x2, z2), y2);
    ctx.lineTo(xDe(x1, z2), y2);
    ctx.closePath();
    ctx.fill();
  }

  // Les flaques de sodium : un lampadaire tous les 22 m, en alternance.
  function lampes(avance) {
    const PAS = 22;
    const debut = Math.floor(avance / PAS) * PAS;
    for (let i = 0; i < 9; i++) {
      const zMonde = debut + i * PAS;
      const z = zMonde - avance + 4;
      // ⚠️ On saute les flaques trop proches : à 8 m, un halo de 4 m couvre
      // la moitié de l'écran. C'est géométriquement juste et illisible.
      if (z < 15 || z > 150) continue;
      const cote = (i % 2 === 0 ? 1 : -1) * 5.2;
      const cx = xDe(cote, z);
      const cy = yDe(z);
      const r = parMetre(z) * 4;
      if (r < 1) continue;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, COUL.halo);
      g.addColorStop(1, "rgba(224,158,96,0)");
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.42); // la flaque est écrasée par la perspective
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.restore();
      ctx.fill();
    }
  }

  // `avance` = mètres parcourus depuis le début. C'est le seul état.
  function dessiner(avance) {
    const zMin = zProche();
    const zMax = 160;

    // Le ciel et les bas-côtés
    const ciel = ctx.createLinearGradient(0, 0, 0, H);
    ciel.addColorStop(0, "#0a0720");
    ciel.addColorStop(HORIZON * 0.86, "#1b1139");
    ciel.addColorStop(HORIZON, "#33204a");
    ciel.addColorStop(HORIZON + 0.001, COUL.bord);
    ciel.addColorStop(1, "#100a26");
    ctx.fillStyle = ciel;
    ctx.fillRect(0, 0, W, H);

    // La chaussée, d'un seul trapèze
    const bit = ctx.createLinearGradient(0, hy, 0, H);
    bit.addColorStop(0, COUL.bitume1);
    bit.addColorStop(1, COUL.bitume0);
    ctx.fillStyle = bit;
    quad(BORD_G, BORD_D, zMin, zMax);

    lampes(avance);

    // Les rives
    ctx.fillStyle = COUL.marquage;
    quad(BORD_G, BORD_G + LIGNE, zMin, zMax);
    quad(BORD_D - LIGNE, BORD_D, zMin, zMax);

    // L'axe discontinu. Le motif défile avec nous, il ne glisse jamais.
    const cycle = DASH + TROU;
    const depart = Math.floor((avance + zMin) / cycle) * cycle;
    for (let i = 0; i < 40; i++) {
      const z1 = depart + i * cycle - avance;
      const z2 = z1 + DASH;
      if (z2 < zMin) continue;
      if (z1 > zMax) break;
      quad(AXE - LIGNE / 2, AXE + LIGNE / 2, Math.max(z1, zMin), z2);
    }

    // Le voile qui mange le fond : sans lui l'œil voit la ligne de coupe.
    const brume = ctx.createLinearGradient(0, hy - 2, 0, hy + H * 0.2);
    brume.addColorStop(0, "#2a1a46");
    brume.addColorStop(0.35, "rgba(42,26,70,.7)");
    brume.addColorStop(1, "rgba(42,26,70,0)");
    ctx.fillStyle = brume;
    ctx.fillRect(0, hy - 2, W, H * 0.22);
  }

  return {
    dessiner,
    taille,
    yDe,
    xDe,
    parMetre,
    get hy() {
      return hy;
    },
  };
}
