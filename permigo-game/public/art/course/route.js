// ═══════════════════════════════════════════════════════════════
// La route, en tranches.
//
// C'est la technique des jeux de course en vue arrière (OutRun, Horizon
// Chase, et le principe est le même derrière une Forza) : la route est une
// suite de TRANCHES de 4 m, chacune avec sa courbure. On les projette de la
// plus lointaine à la plus proche et on peint un quadrilatère entre chaque
// paire. Une route qui tourne n'est pas un trapèze, elle ne peut donc pas se
// peindre d'un seul tenant.
//
// 🔴🔴 POURQUOI PAS DU CSS 3D. La toute première version posait une image de
// bitume sur un plan basculé en rotateX. Le navigateur rasterise un tel calque
// à la résolution de sa partie la plus PROCHE, donc de dizaines de millions de
// pixels : une image sur deux perdue, l'écran clignote. Aucun réglage de
// taille ne rattrape ça.
//
//   z = mètres devant la voiture      x = mètres à droite de l'axe de la voie
//   yE = HORIZON + F * HAUTEUR / z
//   xE = milieu + F * (x + décalage_de_courbe(z) - caméra) / z
//
// Le décor, les bords de route ET les véhicules passent tous par `xDe`/`yDe` :
// ils suivent donc la courbe sans une ligne de code en plus.
// ═══════════════════════════════════════════════════════════════

export const HAUTEUR = 4.1; // hauteur de la caméra, en mètres
export const F = 750; // « focale » en pixels, pour une vue de 380 px de large
export const HORIZON = 0.4; // ligne d'horizon, en part de la hauteur

const BORD_D = 1.9;
const BORD_G = -5.4;
const AXE = -1.75;
const LIGNE = 0.14;
const DASH = 3;
const TROU = 4.5;

const PAS = 4; // longueur d'une tranche, en mètres
const VUE = 42; // tranches dessinées, soit 168 m
const BOUCLE = 420; // tranches avant que le circuit se répète

const PAS_LAMPE = 24;
const PAS_ARBRE = 19;
const X_LAMPE = 3.4;
const X_ARBRE = 9.5;
const TAILLE = { lampe: 2.6, arbre: 5.4 };

// Les deux bouts du dégradé du bitume, en composantes : chaque tranche prend
// sa teinte selon sa distance. Un aplat unique fait perdre toute profondeur.
const PRES = [43, 35, 80];
const LOIN = [26, 20, 58];
const BORD_PRES = [23, 16, 52];
const BORD_LOIN = [18, 13, 42];
const melange = (a, b, t, gain) => {
  const g = gain || 1;
  return `rgb(${Math.round((a[0] + (b[0] - a[0]) * t) * g)},${Math.round(
    (a[1] + (b[1] - a[1]) * t) * g,
  )},${Math.round((a[2] + (b[2] - a[2]) * t) * g)})`;
};

const COUL = {
  marquage: "#cdc0e8",
  halo: "rgba(232, 164, 98, 0.34)",
  phares: "rgba(255, 226, 190, 0.2)",
};

// Le tracé. Des lignes droites, des courbes douces et deux virages francs :
// une route qui tourne toujours donne le mal de mer, une route droite ne
// ressemble à rien.
function tracer() {
  const s = new Array(BOUCLE).fill(0);
  const mettre = (debut, longueur, force) => {
    for (let i = 0; i < longueur; i++) {
      // Entrée et sortie adoucies : un virage qui commence d'un coup fait
      // sauter tout le décor sur le côté.
      const t = i / longueur;
      const doux = t < 0.25 ? t / 0.25 : t > 0.75 ? (1 - t) / 0.25 : 1;
      s[(debut + i) % BOUCLE] = force * doux;
    }
  };
  // ⚠️ Il faut que la route tourne la PLUPART du temps, sinon la voiture
  // passe son temps sur des lignes droites et ne ressent jamais rien.
  mettre(10, 34, 0.006);
  mettre(48, 26, -0.009);
  mettre(80, 40, 0.004);
  mettre(124, 24, -0.013);
  mettre(154, 44, 0.0035);
  mettre(204, 28, 0.011);
  mettre(238, 34, -0.005);
  mettre(278, 24, -0.014);
  mettre(308, 40, 0.0045);
  mettre(352, 30, -0.008);
  mettre(388, 26, 0.01);
  return s;
}
const COURBE = tracer();

export function creerRoute(canvas, { largeur, hauteur, images = {} } = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 0,
    H = 0,
    hy = 0,
    f = 0,
    xCam = 0;

  // Le décalage latéral accumulé, tranche par tranche. Recalculé à chaque
  // image, lu par tout le monde.
  const dec = new Float64Array(VUE + 2);
  let zBase = 0;

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
    f = F * (W / 380);
  }
  taille(largeur, hauteur);

  // Le décalage de la route à la distance z, en mètres, interpolé entre deux
  // tranches. C'est LA fonction qui fait tourner la route pour tout le monde.
  function decalage(z) {
    const t = (z - zBase) / PAS;
    if (t <= 0) return dec[0];
    const i = Math.min(VUE, Math.floor(t));
    return dec[i] + (dec[i + 1] - dec[i]) * (t - i);
  }

  const yDe = (z) => hy + (f * HAUTEUR) / z;
  const xDe = (x, z) => W / 2 + (f * (x + decalage(z) - xCam)) / z;
  const parMetre = (z) => f / z;
  const zProche = () => (f * HAUTEUR) / (H - hy);

  // La courbure ressentie ici et maintenant : elle sert à pousser la voiture
  // vers l'extérieur et à faire glisser le décor lointain.
  let courbeIci = 0;

  function majTracé(avance) {
    const base = Math.floor(avance / PAS);
    zBase = base * PAS - avance;
    let x = 0,
      dx = 0;
    for (let i = 0; i <= VUE + 1; i++) {
      dec[i] = x;
      dx += COURBE[(base + i) % BOUCLE] * PAS;
      x += dx;
    }
    // La courbure ressentie est celle qu'on ABORDE, sur une vingtaine de
    // mètres : une voiture réagit à ce qui arrive, pas à ce qu'elle quitte.
    let c = 0;
    for (let i = 0; i < 5; i++) c += COURBE[(base + i) % BOUCLE];
    courbeIci = c / 5;
  }

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
      ctx.moveTo(xDe(c - 0.5, z0) - decalage(z0) * parMetre(z0), y0);
      ctx.lineTo(xDe(c + 0.5, z0) - decalage(z0) * parMetre(z0), y0);
      ctx.lineTo(xDe(c + 1.5, 26) - decalage(26) * parMetre(26), y1);
      ctx.lineTo(xDe(c - 1.5, 26) - decalage(26) * parMetre(26), y1);
      ctx.closePath();
      ctx.fill();
    }
  }

  function flaque(x, z) {
    // ⚠️ En dessous de 15 m, un halo de 4 m couvre la moitié de l'écran.
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
    ctx.scale(1, 0.42);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.restore();
    ctx.fill();
  }

  function poserObjet(img, x, z, metres) {
    if (!img || !img.naturalWidth) return;
    const l = parMetre(z) * metres;
    if (l < 2) return;
    const h = (l * img.naturalHeight) / img.naturalWidth;
    ctx.globalAlpha = Math.max(0, Math.min(1, (160 - z) / 45));
    ctx.drawImage(img, xDe(x, z) - l / 2, yDe(z) - h, l, h);
    ctx.globalAlpha = 1;
  }

  // Du plus LOIN au plus près : sinon un arbre lointain se dessine par-dessus
  // un arbre proche.
  function file(img, pas, xg, xd, metres, avance, alterne) {
    if (!img) return;
    const debut = Math.floor(avance / pas) * pas;
    const liste = [];
    for (let i = 0; i < 14; i++) {
      const zm = debut + i * pas;
      const z = zm - avance + 3;
      // ⚠️ En dessous de 7 m, un lampadaire n'a plus de pied à l'écran : il
      // ne reste qu'une tête qui flotte dans le ciel.
      if (z < 7 || z > 160) continue;
      const n = Math.round(zm / pas);
      if (alterne) liste.push([n % 2 ? xd : xg, z]);
      else liste.push([xd, z], [xg, z]);
    }
    liste.sort((a, b) => b[1] - a[1]);
    for (const [x, z] of liste) poserObjet(img, x, z, metres);
  }

  let semis = null;
  function etoiles(glisse) {
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
      let px = (a * W - glisse * 0.35) % W;
      if (px < 0) px += W;
      ctx.fillStyle = `rgba(226,214,255,${(o * (1 - b)).toFixed(3)})`;
      ctx.fillRect(px, b * hy, 1.4, 1.4);
    }
    let lx = (W * 0.17 - glisse * 0.35) % W;
    if (lx < 0) lx += W;
    const ly = hy * 0.3,
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
  function dessiner(avance, { decor = true, camera = 0 } = {}) {
    xCam = camera;
    majTracé(avance);

    const zMin = Math.max(zProche(), 0.5);
    const glisse = decalage(90) * parMetre(90);

    const ciel = ctx.createLinearGradient(0, 0, 0, H);
    ciel.addColorStop(0, "#080517");
    ciel.addColorStop(HORIZON * 0.7, "#170f33");
    ciel.addColorStop(HORIZON, "#3a2450");
    ciel.addColorStop(HORIZON + 0.001, melange(BORD_LOIN, BORD_LOIN, 0));
    ciel.addColorStop(1, "#100a26");
    ctx.fillStyle = ciel;
    ctx.fillRect(0, 0, W, H);
    if (decor) etoiles(glisse);

    // ── La chaussée, tranche par tranche, de la plus loin à la plus près.
    for (let i = VUE; i >= 0; i--) {
      const z1 = Math.max(zBase + i * PAS, zMin);
      const z2 = Math.max(zBase + (i + 1) * PAS, zMin);
      if (z2 <= zMin) continue;
      const pair = (Math.floor(avance / PAS) + i) % 2 === 0;
      // Une tranche sur deux est imperceptiblement plus claire : c'est ce
      // battement qui donne la vitesse dans tous les jeux du genre.
      const t = Math.min(1, i / VUE);
      const gain = pair ? 1 : 1.07;
      ctx.fillStyle = melange(BORD_PRES, BORD_LOIN, t, gain);
      quad(BORD_G - 30, BORD_D + 30, z1, z2);
      ctx.fillStyle = melange(PRES, LOIN, t, gain);
      quad(BORD_G, BORD_D, z1, z2);
    }

    if (decor) {
      const debut = Math.floor(avance / PAS_LAMPE) * PAS_LAMPE;
      for (let i = 0; i < 9; i++) {
        const zm = debut + i * PAS_LAMPE;
        const n = Math.round(zm / PAS_LAMPE);
        flaque(n % 2 ? X_LAMPE : -X_LAMPE - 1.4, zm - avance + 3);
      }
      phares();
    }

    // ── Les marquages, eux aussi tranche par tranche.
    ctx.fillStyle = COUL.marquage;
    for (let i = VUE; i >= 0; i--) {
      const z1 = Math.max(zBase + i * PAS, zMin);
      const z2 = Math.max(zBase + (i + 1) * PAS, zMin);
      if (z2 <= zMin) continue;
      quad(BORD_G, BORD_G + LIGNE, z1, z2);
      quad(BORD_D - LIGNE, BORD_D, z1, z2);
    }
    // L'axe discontinu, calé sur la distance parcourue : le motif ne glisse
    // jamais sous la voiture.
    const cycle = DASH + TROU;
    const dep = Math.floor((avance + zMin) / cycle) * cycle - avance;
    for (let i = 0; i < 30; i++) {
      const z1 = dep + i * cycle;
      const z2 = z1 + DASH;
      if (z2 < zMin) continue;
      if (z1 > zBase + VUE * PAS) break;
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

    const brume = ctx.createLinearGradient(0, hy - 2, 0, hy + H * 0.2);
    brume.addColorStop(0, "#3a2450");
    brume.addColorStop(0.35, "rgba(52,32,72,.72)");
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
    decalage,
    get courbe() {
      return courbeIci;
    },
    get camera() {
      return xCam;
    },
    get hy() {
      return hy;
    },
  };
}
