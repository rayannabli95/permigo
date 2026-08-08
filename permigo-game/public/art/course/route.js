// ═══════════════════════════════════════════════════════════════
// La route, dessinée au trait.
//
// 🔴🔴 POURQUOI PAS DU CSS 3D. La première version posait une image de
// bitume sur un plan basculé en rotateX. Ça marche à l'arrêt, mais le
// navigateur rasterise un tel calque à la résolution de sa partie la PLUS
// PROCHE, donc de plusieurs dizaines de millions de pixels. Résultat : une
// image sur deux perdue et un écran qui clignote en continu. Aucun réglage de
// taille ne rattrape ça, c'est le principe qui est mauvais.
//
// Ici, une projection à la main dans un canvas. La chaussée est un simple
// trapèze : en perspective, une droite du sol reste une droite à l'écran.
//
//   z  = mètres devant la voiture     x = mètres à droite de l'axe
//   yE = HORIZON + F * HAUTEUR / z    xE = milieu + F * x / z
//
// La même projection sert au décor, aux bords de route ET aux véhicules :
// ils ne peuvent donc pas se désaccorder.
// ═══════════════════════════════════════════════════════════════

export const HAUTEUR = 4.1; // hauteur de la caméra, en mètres
export const F = 750; // « focale » en pixels, pour une vue de 380 px de large
export const HORIZON = 0.4; // ligne d'horizon, en part de la hauteur

// La chaussée : l'élève roule au milieu de la voie de droite, donc x = 0.
const BORD_D = 1.9;
const BORD_G = -5.4;
const AXE = -1.75;
const LIGNE = 0.14; // largeur d'un marquage, en mètres
const DASH = 3;
const TROU = 4.5;

// Le mobilier de bord de route. C'est lui qui donne la VITESSE : sans repère
// qui défile sur les côtés, une route vide ne bouge pas, elle glisse.
const PAS_LAMPE = 24; // un lampadaire tous les 24 m, en alternance
const PAS_ARBRE = 19;
const X_LAMPE = 3.4;
const X_ARBRE = 9.5;
const TAILLE = { lampe: 2.6, arbre: 5.4 }; // encombrement réel, en mètres

const COUL = {
  bitume0: "#2b2350",
  bitume1: "#1d1740",
  marquage: "#cdc0e8",
  bord: "#171034",
  halo: "rgba(232, 164, 98, 0.34)",
  phares: "rgba(255, 226, 190, 0.2)",
};

export function creerRoute(canvas, { largeur, hauteur, images = {} } = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 0,
    H = 0,
    hy = 0,
    f = 0;

  function taille(l, h) {
    // On plafonne à 2 : au-delà on paie des pixels que personne ne voit.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
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

  // Les deux cônes de phares, à plat sur le bitume devant la voiture.
  function phares() {
    const z0 = zProche();
    const y0 = yDe(z0),
      y1 = yDe(26);
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, COUL.phares);
    g.addColorStop(1, "rgba(255,226,190,0)");
    ctx.fillStyle = g;
    for (const c of [-0.75, 0.75]) {
      ctx.beginPath();
      ctx.moveTo(xDe(c - 0.5, z0), y0);
      ctx.lineTo(xDe(c + 0.5, z0), y0);
      ctx.lineTo(xDe(c + 1.5, 26), y1);
      ctx.lineTo(xDe(c - 1.5, 26), y1);
      ctx.closePath();
      ctx.fill();
    }
  }

  // La flaque de sodium au sol, sous un lampadaire.
  function flaque(x, z) {
    // ⚠️ On saute les flaques trop proches : à 8 m, un halo de 4 m couvre
    // la moitié de l'écran. C'est géométriquement juste et illisible.
    if (z < 15) return;
    const cx = xDe(x, z),
      cy = yDe(z),
      r = parMetre(z) * 4;
    if (r < 1) return;
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

  // Un objet posé au sol, calé sur son point de contact.
  function poserObjet(img, x, z, metres) {
    if (!img || !img.naturalWidth) return;
    const l = parMetre(z) * metres;
    if (l < 2) return;
    const h = (l * img.naturalHeight) / img.naturalWidth;
    ctx.globalAlpha = Math.max(0, Math.min(1, (150 - z) / 45));
    ctx.drawImage(img, xDe(x, z) - l / 2, yDe(z) - h, l, h);
    ctx.globalAlpha = 1;
  }

  // Une file d'objets, dessinée du plus LOIN au plus près : sinon un arbre
  // lointain se dessine par-dessus un arbre proche.
  function file(img, pas, xg, xd, metres, avance, alterne) {
    if (!img) return;
    const debut = Math.floor(avance / pas) * pas;
    const liste = [];
    for (let i = 0; i < 14; i++) {
      const zm = debut + i * pas;
      const z = zm - avance + 3;
      // ⚠️ En dessous de 7 m, un lampadaire n'a plus de pied à l'écran : il
      // ne reste qu'une tête qui flotte dans le ciel.
      if (z < 7 || z > 150) continue;
      const n = Math.round(zm / pas);
      if (alterne) liste.push([n % 2 ? xd : xg, z]);
      else liste.push([xd, z], [xg, z]);
    }
    liste.sort((a, b) => b[1] - a[1]);
    for (const [x, z] of liste) poserObjet(img, x, z, metres);
  }

  // Un ciel vide fait « écran de veille ». Les étoiles sont tirées une fois
  // pour toutes et ne bougent jamais : c'est le décor le plus lointain.
  let semis = null;
  function etoiles() {
    if (!semis) {
      semis = [];
      let g = 20260808; // suite fixe : le ciel est le même à chaque partie
      const suivant = () => {
        g = (g * 1103515245 + 12345) & 0x7fffffff;
        return (g % 1000) / 1000;
      };
      for (let i = 0; i < 46; i++)
        semis.push([suivant(), suivant() * 0.78, 0.25 + suivant() * 0.55]);
    }
    for (const [a, b, o] of semis) {
      ctx.fillStyle = `rgba(226,214,255,${(o * (1 - b)).toFixed(3)})`;
      ctx.fillRect(a * W, b * hy, 1.4, 1.4);
    }
    // La lune, froide, à l'opposé de la lumière chaude de la ville.
    const lx = W * 0.17,
      ly = hy * 0.3,
      r = hy * 0.42;
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
    g.addColorStop(0, "rgba(206,196,255,.3)");
    g.addColorStop(1, "rgba(206,196,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lx, ly, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(232,226,255,.72)";
    ctx.beginPath();
    ctx.arc(lx, ly, Math.max(3, hy * 0.032), 0, Math.PI * 2);
    ctx.fill();
  }

  // `avance` = mètres parcourus depuis le début. C'est le seul état.
  function dessiner(avance, { decor = true } = {}) {
    const zMin = zProche();
    const zMax = 160;

    const ciel = ctx.createLinearGradient(0, 0, 0, H);
    ciel.addColorStop(0, "#080517");
    ciel.addColorStop(HORIZON * 0.7, "#170f33");
    ciel.addColorStop(HORIZON, "#3a2450");
    ciel.addColorStop(HORIZON + 0.001, COUL.bord);
    ciel.addColorStop(1, "#100a26");
    ctx.fillStyle = ciel;
    ctx.fillRect(0, 0, W, H);
    if (decor) etoiles();

    const bit = ctx.createLinearGradient(0, hy, 0, H);
    bit.addColorStop(0, COUL.bitume1);
    bit.addColorStop(1, COUL.bitume0);
    ctx.fillStyle = bit;
    quad(BORD_G, BORD_D, zMin, zMax);

    // La lumière se pose sur le bitume AVANT les marquages, sinon elle les
    // efface.
    if (decor) {
      const debut = Math.floor(avance / PAS_LAMPE) * PAS_LAMPE;
      for (let i = 0; i < 9; i++) {
        const zm = debut + i * PAS_LAMPE;
        const n = Math.round(zm / PAS_LAMPE);
        flaque(n % 2 ? X_LAMPE : -X_LAMPE - 1.4, zm - avance + 3);
      }
      phares();
    }

    ctx.fillStyle = COUL.marquage;
    quad(BORD_G, BORD_G + LIGNE, zMin, zMax);
    quad(BORD_D - LIGNE, BORD_D, zMin, zMax);

    // L'axe discontinu. Le motif défile avec nous, il ne glisse jamais.
    const cycle = DASH + TROU;
    const dep = Math.floor((avance + zMin) / cycle) * cycle;
    for (let i = 0; i < 40; i++) {
      const z1 = dep + i * cycle - avance;
      const z2 = z1 + DASH;
      if (z2 < zMin) continue;
      if (z1 > zMax) break;
      quad(AXE - LIGNE / 2, AXE + LIGNE / 2, Math.max(z1, zMin), z2);
    }

    if (decor) {
      file(
        images.arbre,
        PAS_ARBRE,
        -X_ARBRE - 2,
        X_ARBRE,
        TAILLE.arbre,
        avance,
        false,
      );
      file(
        images.lampe,
        PAS_LAMPE,
        -X_LAMPE - 1.4,
        X_LAMPE,
        TAILLE.lampe,
        avance,
        true,
      );
    }

    // Le voile qui mange le fond : sans lui l'œil voit la ligne de coupe.
    const brume = ctx.createLinearGradient(0, hy - 2, 0, hy + H * 0.2);
    brume.addColorStop(0, "#3a2450");
    brume.addColorStop(0.35, "rgba(52,32,72,.7)");
    brume.addColorStop(1, "rgba(52,32,72,0)");
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
