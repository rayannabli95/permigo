// La rue. Une seule, droite, longue de 460 mètres, à seize heures.
//
// 📖 Direction artistique : `docs/PERMIGO_GAME_ART_BIBLE.md` §4 (lumière),
// §5 (matières), §7 (cotes de la route). Aucune couleur ne s'écrit ici : tout
// vient de `da/palette.js`.
//
// Ce n'est pas un décor : c'est le terrain de jeu. Sa composition FAIT la
// difficulté, donc elle obéit à des règles et pas au hasard.
//
//   1. Au plus trois choses bougent en même temps. Tout le reste est posé.
//   2. Le danger n'est jamais le seul qui bouge, sinon on le trouve par
//      élimination et il n'y a plus de jeu.
//   3. Tout ce qui compte tient dans le cadre. La difficulté n'est pas de
//      tourner la tête, c'est de REMARQUER.
//   4. Discret avant, énorme après.
//
// ⭐ CRITÈRE DE LA PHASE 1 : une portion de rue VIDE doit déjà être belle. Si
// la capture d'une rue sans acteurs est ennuyeuse, la route est ratée.
//
// Repère : X = est, Z = sud, on roule vers -Z. La voie du joueur est x = +1,7.

import {
  SOL,
  FACADES,
  COMMERCES,
  VEGETATION,
  VEHICULES_NEUTRES,
  jitter,
  lisere,
  assombrir,
  piocher,
} from "../da/palette.js";
import { bitume, trottoir, facade } from "../da/textures.js";
import { vehicule, FLOTTE } from "../da/vehicules.js";
import { personnage } from "../da/personnages.js";
import { rangee } from "../da/batiments.js";
import {
  arbre,
  lampadaire,
  banc,
  corbeille,
  potelet,
  abribus,
} from "../da/mobilier.js";

export const VOIE = 3.4;
export const X_JOUEUR = 1.7;
export const X_OPPOSE = -1.7;
export const X_STATIONNE = 4.6; // le centre d'une place de stationnement
export const BORD = 5.7; // le bord de la chaussée
export const Z_DEBUT = 60;
export const Z_FIN = -400;

// Un générateur reproductible. 🔴 Jamais Math.random ici : une rue qui change
// à chaque partie rend impossible de comparer deux essais, et c'est tout
// l'objet du banc.
function des(graine) {
  let x = graine;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

export function construireRue(THREE, modeles, kit, { trous = [] } = {}) {
  const g = new THREE.Group();
  const r = des(20260810);

  const mat = (c, rug = 0.94) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: rug, metalness: 0 });
  const matTex = (carte, c = 0xffffff, rug = 0.94) =>
    new THREE.MeshStandardMaterial({
      map: carte,
      color: c,
      roughness: rug,
      metalness: 0,
    });

  const CUBE = new THREE.BoxGeometry(1, 1, 1);
  const bloc = (l, h, p, couleur, x, y, z, rug) => {
    const m = new THREE.Mesh(CUBE, mat(couleur, rug));
    m.scale.set(l, h, p);
    m.position.set(x, y + h / 2, z);
    m.receiveShadow = true;
    m.castShadow = h > 0.4;
    g.add(m);
    return m;
  };
  // Une bande posée à plat sur le sol : marquage, trace de roulement,
  // caniveau. Toujours au ras, jamais un cube.
  const bande = (largeur, longueur, couleur, x, z, y = 0.012, opacite = 1) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(largeur, longueur),
      new THREE.MeshStandardMaterial({
        color: couleur,
        roughness: 1,
        metalness: 0,
        transparent: opacite < 1,
        opacity: opacite,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };

  const long = Z_DEBUT - Z_FIN;
  const milieu = (Z_DEBUT + Z_FIN) / 2;

  // ── LA CHAUSSÉE ──────────────────────────────────────────────────────
  // Une seule texture de 8 m répétée. Le grain, les réparations et les
  // fissures sont peints dedans : c'est ce qui remplace l'aplat gris uni.
  const texBitume = bitume(THREE);
  texBitume.repeat.set((BORD * 2) / 8, long / 8);
  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry(BORD * 2, long),
    matTex(texBitume, 0xffffff, 0.95),
  );
  sol.rotation.x = -Math.PI / 2;
  sol.position.set(0, 0, milieu);
  sol.receiveShadow = true;
  g.add(sol);

  // ⭐ Les traces de roulement. Deux bandes légèrement plus sombres par voie,
  // là où passent les pneus. C'est de la GÉOMÉTRIE et pas de la texture,
  // parce qu'elles suivent les voies : une texture répétée les ferait
  // serpenter. Coût : deux plans. Effet : la route a été empruntée.
  for (const voie of [-1.7, 1.7])
    for (const dx of [-0.75, 0.75])
      bande(0.5, long, SOL.roulement, voie + dx, milieu, 0.008, 0.2);

  // Les caniveaux : trente centimètres plus sombres le long des bordures.
  for (const s of [-1, 1])
    bande(0.3, long, SOL.caniveau, s * (BORD - 0.15), milieu, 0.009, 0.55);

  // ── TROTTOIRS ET BORDURES ────────────────────────────────────────────
  const texTrottoir = trottoir(THREE);
  texTrottoir.repeat.set(2.8 / 2.4, long / 2.4); // une dalle = 1,2 m
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.16, long),
      matTex(texTrottoir, 0xffffff, 0.9),
    );
    t.position.set(s * (BORD + 1.4), 0.08, milieu);
    t.receiveShadow = true;
    g.add(t);

    // La bordure : un chant sable, et surtout un LISERÉ clair sur le dessus.
    // ⭐ C'est l'outil 2 de la bible : la fine face qui attrape le soleil et
    // qui dit qu'un humain a dessiné le volume. Sans elle, un trottoir est
    // une marche ; avec elle, c'est un trottoir.
    bloc(0.22, 0.17, long, SOL.bordure, s * (BORD + 0.11), 0, milieu, 0.9);
    bande(0.24, long, SOL.bordureHaut, s * (BORD + 0.11), milieu, 0.172, 1);

    // La terre derrière les trottoirs, pour que l'horizon ne soit pas un vide.
    bloc(60, 0.02, long, SOL.terre, s * 37, 0, milieu, 1);
  }

  // ── LES MARQUAGES ────────────────────────────────────────────────────
  // Blanc CASSÉ et chaud, jamais #fff (bible §2, loi 2).
  for (let z = Z_DEBUT; z > Z_FIN; z -= 6)
    bande(0.15, 3, SOL.marquage, 0, z, 0.014);
  for (const s of [-1, 1])
    bande(0.12, long, SOL.marquage, s * 3.35, milieu, 0.014);

  // Les passages piétons : un par zone d'événement piéton. Ils ANNONCENT la
  // possibilité d'un piéton, donc c'est de la pédagogie déguisée en décor.
  for (const [a, b] of trous.slice(2, 5)) {
    const z0 = (a + b) / 2 - 16;
    for (let i = -4; i <= 4; i++)
      bande(0.5, 3.6, SOL.marquage, i * 0.95, z0, 0.014, 0.92);
  }

  // Les plaques d'égout, tous les vingt-cinq mètres environ.
  for (let z = Z_DEBUT - 12; z > Z_FIN; z -= 25 + r() * 14) {
    const s = r() < 0.5 ? -1 : 1;
    const p = new THREE.Mesh(
      new THREE.CircleGeometry(0.33, 14),
      mat(assombrir(SOL.bitume, 0.14), 0.8),
    );
    p.rotation.x = -Math.PI / 2;
    p.position.set(s * (BORD - 0.9), 0.013, z);
    g.add(p);
  }

  // ── LES FAÇADES ──────────────────────────────────────────────────────
  // 📖 La grammaire vit dans `da/batiments.js` : socle + étages + couronne,
  // avec ses règles de voisinage et ses accidents de rythme. Ici on ne fait
  // que poser deux rangées.
  for (const s of [-1, 1])
    for (const b of rangee(THREE, {
      cote: s,
      zDebut: Z_DEBUT,
      zFin: Z_FIN,
      alea: r,
      x: s * (BORD + 2.8 + 11 / 2 + 0.6),
    }))
      g.add(b);

  // ── LES ARBRES ET LE MOBILIER URBAIN ─────────────────────────────────
  // ⚠️ Rien de tout ceci ne se pose près d'une scène : un potelet devant
  // l'enfant ou un abribus devant la voiture qui hésite rend une leçon
  // injouable. Même règle de trous que le stationnement, marge de 12 m.
  const SOLEIL = new THREE.Vector3(-28, 34, 16).normalize();
  // 🔴 LA MARGE NE VAUT QUE DU CÔTÉ OÙ SE JOUE LA SCÈNE. Toutes nos scènes
  // sauf une vivent sur le trottoir de DROITE ; appliquer les trous aux deux
  // côtés vidait cinquante mètres de trottoir gauche pour protéger une
  // voiture située à droite, et la rue devenait un désert au moment précis où
  // le joueur doit regarder loin. Seule la scène des deux enfants concerne
  // les deux trottoirs, puisque le copain attend en face.
  const CONCERNE_LA_GAUCHE = trous.length - 1;
  const loinDeToutEvenement = (z, cote) =>
    trous.every(([a, b], i) => {
      if (cote < 0 && i !== CONCERNE_LA_GAUCHE) return true;
      return z > b + 12 || z < a - 12;
    });

  for (let z = Z_DEBUT - 8; z > Z_FIN; z -= 19) {
    for (const s of [-1, 1]) {
      if (r() < 0.2) continue;
      const zz = z + s * 4;
      if (!loinDeToutEvenement(zz, s)) continue;
      const a = arbre(THREE, SOLEIL, 0.85 + r() * 0.35);
      a.position.set(s * (BORD + 1.5), 0.16, zz);
      g.add(a);
    }
  }

  // Les lampadaires donnent la verticale qui rythme la fuite de la rue.
  for (let z = Z_DEBUT - 16; z > Z_FIN; z -= 26 + r() * 8) {
    const s = r() < 0.5 ? -1 : 1;
    if (!loinDeToutEvenement(z, s)) continue;
    const l = lampadaire(THREE, -s);
    l.position.set(s * (BORD + 0.75), 0.16, z);
    g.add(l);
  }

  // Bancs, corbeilles, potelets, un abribus de temps en temps.
  for (let z = Z_DEBUT - 22; z > Z_FIN; z -= 15 + r() * 16) {
    const s = r() < 0.5 ? -1 : 1;
    if (!loinDeToutEvenement(z, s)) continue;
    const d = r();
    let piece = null;
    let ecart = BORD + 1.9;
    if (d < 0.3) piece = banc(THREE);
    else if (d < 0.55) piece = corbeille(THREE), (ecart = BORD + 0.9);
    else if (d < 0.68) piece = abribus(THREE, -s), (ecart = BORD + 2.0);
    else {
      // Une file de potelets : le plus petit objet du jeu, et celui qui dit
      // le plus fort « ceci est un vrai trottoir ».
      for (let k = 0; k < 4; k++) {
        const p = potelet(THREE);
        p.position.set(s * (BORD + 0.62), 0.16, z + k * 1.6);
        g.add(p);
      }
    }
    if (piece) {
      piece.position.set(s * ecart, 0.16, z);
      piece.rotation.y = s > 0 ? 0 : Math.PI;
      g.add(piece);
    }
  }

  // ── LES VOITURES EN STATIONNEMENT ────────────────────────────────────
  // Elles sont l'essentiel de l'occlusion et du bruit visuel, donc leur
  // densité est le vrai réglage de difficulté.
  // ⚠️ `trous` : les mètres réservés aux événements. Sans eux, une voiture
  // décorative se garerait exactement là où un enfant doit surgir. Et un trou
  // protège un CÔNE de vue, pas une ligne (leçon du 10/08, cf. scenario.js).
  const gares = [];
  const libre = (z) => trous.every(([a, b]) => z > b + 3 || z < a - 3);
  for (const s of [1, -1]) {
    for (let z = Z_DEBUT - 6; z > Z_FIN + 10; z -= 6.4 + r() * 2.6) {
      if (r() < (s > 0 ? 0.18 : 0.42)) continue; // des places vides
      // 🔴 LES DEUX CÔTÉS, pas seulement celui du joueur. Le copain de
      // l'enfant attend sur le trottoir d'EN FACE : c'est lui le signe de la
      // scène, et il se retrouvait caché derrière la file de stationnement
      // opposée. Un trou protège une scène, pas une voie.
      if (!libre(z)) continue;
      // ⭐ Des SILHOUETTES variées, pas une seule répétée soixante fois :
      // citadines, berlines, un SUV, un utilitaire. Une file de stationnement
      // faite d'un seul gabarit redevient un mur, quelle que soit sa couleur.
      // Et une peinture NEUTRE et mate : une voiture garée fait la masse,
      // jamais l'événement (bible §3).
      const type = piocher(FLOTTE, r);
      const m = vehicule(THREE, type, piocher(VEHICULES_NEUTRES, r), {
        alea: r,
      });
      m.position.set(s * X_STATIONNE, 0, z);
      m.rotation.y = s > 0 ? 0 : Math.PI;
      m.traverse((o) => (o.castShadow = true));
      g.add(m);
      const gab = m.userData.gabarit;
      const t = kit.tache(gab.larg, gab.l, 0.42);
      t.position.set(s * X_STATIONNE, 0.014, z);
      g.add(t);
      gares.push(m);
    }
  }

  // ⭐ Les passants d'ambiance. Ils ne sont JAMAIS un danger, et c'est leur
  // rôle : sans eux, la seule chose qui bouge est l'événement, on le trouve
  // par élimination et il n'y a plus de jeu. Ils marchent sur les trottoirs,
  // font demi-tour au bout, et ne descendent jamais du trottoir.
  //
  // 🔴 NEUF, PLUS SEIZE (10/08). Le bruit visuel doit rendre la rue crédible,
  // pas empêcher de lire la compétence.
  const passants = [];
  const modelePieton = modeles?.pieton;
  // ⚠️ 26 m de marge, et pas 20 : un passant fait des allers-retours de sept
  // mètres (voir `animer`), donc la marge doit couvrir sa PROMENADE, pas sa
  // position de départ. Avec 20, un adulte finissait par marcher sur le
  // trottoir de l'enfant et cassait le « un de chaque côté ».
  const loinDesScenes = (z) =>
    trous.every(([a, b]) => z > b + 26 || z < a - 26);
  for (let i = 0; i < 9; i++) {
    const s = r() < 0.62 ? 1 : -1;
    let z = 0;
    for (let essai = 0; essai < 40; essai++) {
      z = Z_DEBUT - 25 - r() * (long - 45);
      if (loinDesScenes(z)) break;
    }
    if (!loinDesScenes(z)) continue;
    const p = personnage(THREE, { alea: r });
    const grp = new THREE.Group();
    grp.add(p);
    grp.position.y = 0.16;
    p.userData.sol = 0;
    g.add(grp);
    passants.push({
      objet: grp,
      x: s * (BORD + 0.9 + r() * 1.7),
      z,
      sens: r() < 0.5 ? 1 : -1,
      vitesse: 0.9 + r() * 0.6,
      bord: s,
      corps: p,
    });
  }

  // Une fonction pure du temps : les passants avancent, font demi-tour tous
  // les sept mètres, et rien de plus. Aucune IA, aucun coût.
  function animer(t) {
    for (const p of passants) {
      const va = Math.sin((t * p.vitesse) / 9 + p.z) > 0 ? 1 : -1;
      const dz = Math.sin((t * p.vitesse) / 9 + p.z) * 7;
      p.objet.position.set(p.x, 0.16, p.z + dz);
      p.objet.rotation.y = va * p.sens > 0 ? Math.PI : 0;
      // Le balancier des jambes et le rebond du pas vivent dans le
      // personnage : ici on ne fait que dire « il marche ».
      p.corps.userData.pas(t * p.vitesse, 1);
    }
  }

  return { groupe: g, gares, animer };
}
