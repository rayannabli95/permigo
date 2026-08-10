// LES MATIÈRES DE PERMIGO — des textures dessinées dans le navigateur.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §5.
//
// 🔴 AUCUN FICHIER À TÉLÉCHARGER. Tout est peint au démarrage sur un canvas de
// 256 ou 512 px. Trois raisons, et elles sont toutes structurelles :
//   · zéro requête réseau, donc zéro problème de CSP (le bug qui a rendu toute
//     la 3D grise en prod le 09/08 était une histoire de `blob:` manquant) ;
//   · le chargement est instantané, sur n'importe quelle connexion ;
//   · une texture PARAMÉTRIQUE se décline à l'infini, une image non.
//
// ⚠️ Une texture par FAMILLE de surface, jamais une par objet. Le budget est
// de douze textures pour tout le jeu (bible §12).

import { SOL, jitter, lisere, assombrir, enCss } from "./palette.js";

// Un générateur reproductible, comme dans `rue.js` : deux parties doivent
// donner exactement la même rue.
function des(graine) {
  let x = graine >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

function toile(taille) {
  const c = document.createElement("canvas");
  c.width = c.height = taille;
  return [c, c.getContext("2d")];
}

function finir(THREE, canvas, repete) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (repete) t.repeat.set(repete[0], repete[1]);
  return t;
}

// Le grain de base : un bruit fin, toujours le même recette. C'est lui qui
// enlève l'aplat « couleur CSS » de toutes nos surfaces.
function grain(g, taille, alea, force, pas = 2) {
  for (let y = 0; y < taille; y += pas)
    for (let x = 0; x < taille; x += pas) {
      const v = (alea() - 0.5) * force;
      g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 250 : 0},${v > 0 ? 235 : 10},${Math.abs(v)})`;
      g.fillRect(x, y, pas, pas);
    }
}

// ── LE BITUME ──────────────────────────────────────────────────────────
// Une dalle de 8 m sur 8 m. Grain fin, quelques réparations plus claires,
// et rien d'autre : les traces de roulement sont de la GÉOMÉTRIE (elles
// suivent les voies, elles ne peuvent pas se répéter avec la texture).
export function bitume(THREE) {
  const T = 512;
  const [c, g] = toile(T);
  const alea = des(20260810);
  g.fillStyle = enCss(SOL.bitume);
  g.fillRect(0, 0, T, T);

  // Les réparations : des rectangles à peine plus clairs ou plus sombres, aux
  // bords irréguliers. C'est le détail qui dit « cette route a servi ».
  for (let i = 0; i < 5; i++) {
    const l = 60 + alea() * 150;
    const h = 40 + alea() * 110;
    const x = alea() * T;
    const y = alea() * T;
    g.fillStyle = enCss(jitter(SOL.bitume, alea));
    g.globalAlpha = 0.5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + l, y + (alea() - 0.5) * 12);
    g.lineTo(x + l + (alea() - 0.5) * 12, y + h);
    g.lineTo(x, y + h + (alea() - 0.5) * 12);
    g.closePath();
    g.fill();
    g.globalAlpha = 1;
  }

  // Les fissures : quelques traits sombres et cassés.
  g.strokeStyle = `rgba(60,54,44,0.35)`;
  g.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    let x = alea() * T;
    let y = alea() * T;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += (alea() - 0.5) * 70;
      y += (alea() - 0.5) * 70;
      g.lineTo(x, y);
    }
    g.stroke();
  }

  grain(g, T, alea, 0.16, 2);
  return finir(THREE, c);
}

// ── LE TROTTOIR ────────────────────────────────────────────────────────
// Une dalle de 1,2 m : les joints tombent donc tous les 1,2 m, et chaque
// dalle prend un jitter. C'est ce qui empêche le trottoir d'être un ruban.
export function trottoir(THREE) {
  const T = 256;
  const [c, g] = toile(T);
  const alea = des(20260811);
  g.fillStyle = enCss(SOL.trottoir);
  g.fillRect(0, 0, T, T);

  // Quatre dalles par tuile, chacune avec sa nuance.
  const n = 2;
  const p = T / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      g.fillStyle = enCss(jitter(SOL.trottoir, alea));
      g.fillRect(i * p, j * p, p, p);
    }
  // Les joints : sombre au fond, clair sur la lèvre du haut. Deux traits, et
  // les dalles ont une épaisseur.
  g.strokeStyle = `rgba(120,102,84,0.55)`;
  g.lineWidth = 3;
  for (let i = 0; i <= n; i++) {
    g.beginPath();
    g.moveTo(i * p, 0);
    g.lineTo(i * p, T);
    g.moveTo(0, i * p);
    g.lineTo(T, i * p);
    g.stroke();
  }
  g.strokeStyle = enCss(lisere(SOL.trottoir, 0.1));
  g.lineWidth = 1.5;
  for (let i = 0; i <= n; i++) {
    g.beginPath();
    g.moveTo(i * p + 2.5, 0);
    g.lineTo(i * p + 2.5, T);
    g.moveTo(0, i * p + 2.5);
    g.lineTo(T, i * p + 2.5);
    g.stroke();
  }
  grain(g, T, alea, 0.13, 2);
  return finir(THREE, c);
}

// ── LA FAÇADE ──────────────────────────────────────────────────────────
// ⭐ LA TEXTURE CLÉ DE TOUTE LA DIRECTION ARTISTIQUE.
//
// Les fenêtres sont PEINTES ICI, elles ne sont pas de la géométrie. La rue
// actuelle dessine des centaines de plans-fenêtres : coût énorme et rendu
// d'autocollant. Une façade = UN mesh + UNE texture, où tout est dessiné :
// l'encadrement, la vitre et son reflet, l'appui clair, le bas de mur assombri
// (l'occlusion de contact, peinte au lieu d'être calculée).
//
// La tuile couvre UN étage sur UNE travée. On la répète.
export function facade(THREE, couleur, graine, { commerce = false } = {}) {
  const T = 256;
  const [c, g] = toile(T);
  const alea = des(graine);

  g.fillStyle = enCss(couleur);
  g.fillRect(0, 0, T, T);

  // Le dégradé vertical : un mur est toujours plus sombre en bas. Gratuit, et
  // c'est ce qui donne de la hauteur à un immeuble.
  const dg = g.createLinearGradient(0, 0, 0, T);
  dg.addColorStop(0, "rgba(255,248,235,0.10)");
  dg.addColorStop(0.6, "rgba(0,0,0,0)");
  dg.addColorStop(1, "rgba(40,28,45,0.16)");
  g.fillStyle = dg;
  g.fillRect(0, 0, T, T);

  if (commerce) {
    // Une devanture : grande vitrine sombre, bandeau d'enseigne, socle.
    g.fillStyle = enCss(assombrir(couleur, 0.3));
    g.fillRect(0, 0, T, 46); // le bandeau
    g.fillStyle = "rgba(20,26,38,0.9)";
    g.fillRect(18, 60, T - 36, T - 96);
    // le reflet du ciel dans la vitrine, en biais
    const rg = g.createLinearGradient(18, 60, T - 18, T - 36);
    rg.addColorStop(0, "rgba(200,224,246,0.42)");
    rg.addColorStop(0.45, "rgba(200,224,246,0.05)");
    rg.addColorStop(1, "rgba(255,244,220,0.22)");
    g.fillStyle = rg;
    g.fillRect(18, 60, T - 36, T - 96);
    g.fillStyle = enCss(lisere(couleur, 0.14));
    g.fillRect(0, T - 30, T, 30); // le socle
  } else {
    // Une fenêtre, centrée dans la travée.
    const l = 96;
    const h = 128;
    const x = (T - l) / 2;
    const y = 52;
    // L'encadrement crème, plus large que la fenêtre.
    g.fillStyle = enCss(lisere(couleur, 0.16));
    g.fillRect(x - 9, y - 9, l + 18, h + 18);
    // La vitre : bleu-ardoise, avec un reflet de ciel en diagonale.
    g.fillStyle = "rgba(38,52,72,0.95)";
    g.fillRect(x, y, l, h);
    const rg = g.createLinearGradient(x, y, x + l, y + h);
    rg.addColorStop(0, "rgba(190,216,242,0.5)");
    rg.addColorStop(0.42, "rgba(150,180,212,0.10)");
    rg.addColorStop(0.7, "rgba(40,54,74,0.0)");
    rg.addColorStop(1, "rgba(255,240,216,0.16)");
    g.fillStyle = rg;
    g.fillRect(x, y, l, h);
    // Les meneaux.
    g.fillStyle = "rgba(232,224,204,0.85)";
    g.fillRect(x + l / 2 - 2, y, 4, h);
    g.fillRect(x, y + h * 0.42, l, 3);
    // L'appui : la ligne claire qui attrape le soleil, et son ombre portée.
    g.fillStyle = "rgba(30,22,40,0.28)";
    g.fillRect(x - 14, y + h + 9, l + 28, 7);
    g.fillStyle = enCss(lisere(couleur, 0.24));
    g.fillRect(x - 14, y + h + 9, l + 28, 5);
  }

  grain(g, T, alea, 0.1, 2);
  return finir(THREE, c);
}

// ── LE CAPOT DE LA CUPRA (signature X) ─────────────────────────────────
// Une seule image, utilisée par le CSS du poste de conduite. Elle vit ici
// pour que la laque violette soit décidée au même endroit que le reste.
export function laqueViolette() {
  const [c, g] = toile(256);
  const dg = g.createLinearGradient(0, 0, 0, 256);
  dg.addColorStop(0, "#b9a4f2");
  dg.addColorStop(0.14, "#8c6fe0");
  dg.addColorStop(0.5, "#6a4bc4");
  dg.addColorStop(1, "#3b2a72");
  g.fillStyle = dg;
  g.fillRect(0, 0, 256, 256);
  return c.toDataURL("image/png");
}
