// LES VÉHICULES DE PERMIGO — des jouets en métal peint.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §6 (silhouettes) et §5 (matières).
//
// ⭐ LA DÉCISION TECHNIQUE DE CE FICHIER : une voiture est un PROFIL EXTRUDÉ,
// pas un empilement de boîtes. On dessine sa silhouette vue de côté (capot,
// pare-brise incliné, pavillon, custode) et on l'étire sur la largeur, avec un
// biseau. Trois conséquences, toutes décisives :
//
//   · le biseau de l'extrusion donne GRATUITEMENT les arêtes cassées qui
//     attrapent le soleil : c'est ce qui sépare une carrosserie d'un cube ;
//   · une silhouette est un tableau de points, donc une citadine, un SUV et un
//     utilitaire sont le MÊME code avec six nombres différents. C'est ce qui
//     rend la flotte extensible par un agent, sans modélisation ;
//   · on reconnaît un type de véhicule à son profil bien avant ses détails,
//     et c'est exactement ce que demande un jeu d'observation sur téléphone.
//
// 🔴 Aucun fichier à télécharger : plus un seul GLB dans le monde de jour. Les
// modèles importés sont texturés pour la DA de NUIT et rendent tous le même
// bleu marine en plein jour (piège tombé deux fois, 09 et 10/08).

import { jitter, lisere, assombrir, NUIT } from "./palette.js";
import { CUBE } from "./instances.js";

// Chaque gabarit tient en quelques cotes. `profil` est la silhouette vue de
// côté, en mètres, avec y = 0 au sol et x = 0 au milieu du véhicule.
// L'avant est vers les x POSITIFS ici ; l'extrusion le renvoie vers -Z, qui
// est l'avant du moteur.
export const GABARITS = {
  citadine: {
    l: 3.7,
    larg: 1.75,
    h: 1.52,
    essieu: 1.22,
    roue: 0.33,
    profil: [
      [-1.85, 0.3],
      [1.85, 0.3],
      [1.85, 0.78],
      [1.56, 0.96],
      [0.78, 0.99],
      [0.16, 1.5],
      [-0.98, 1.52],
      [-1.6, 1.02],
      [-1.85, 0.94],
    ],
    vitrage: [
      [0.8, 1.0],
      [0.2, 1.46],
      [-0.95, 1.47],
      [-1.55, 1.03],
    ],
  },
  berline: {
    l: 4.5,
    larg: 1.82,
    h: 1.42,
    essieu: 1.5,
    roue: 0.32,
    profil: [
      [-2.25, 0.28],
      [2.25, 0.28],
      [2.25, 0.7],
      [1.85, 0.86],
      [0.72, 0.9],
      [0.02, 1.4],
      [-1.05, 1.42],
      [-1.92, 0.94],
      [-2.25, 0.86],
    ],
    vitrage: [
      [0.74, 0.92],
      [0.07, 1.36],
      [-1.02, 1.38],
      [-1.85, 0.95],
    ],
  },
  suv: {
    l: 4.4,
    larg: 1.9,
    h: 1.72,
    essieu: 1.44,
    roue: 0.38,
    profil: [
      [-2.2, 0.42],
      [2.2, 0.42],
      [2.2, 0.95],
      [1.88, 1.12],
      [0.86, 1.16],
      [0.3, 1.7],
      [-1.5, 1.72],
      [-2.05, 1.3],
      [-2.2, 1.08],
    ],
    vitrage: [
      [0.88, 1.17],
      [0.34, 1.66],
      [-1.46, 1.67],
      [-2.0, 1.28],
    ],
  },
  utilitaire: {
    l: 5.2,
    larg: 2.0,
    h: 2.5,
    essieu: 1.7,
    roue: 0.38,
    // ⚠️ Pas de vitrage arrière : c'est CE trou dans la ligne de vitres qui
    // fait reconnaître un utilitaire à soixante mètres, avant sa hauteur.
    profil: [
      [-2.6, 0.42],
      [2.6, 0.42],
      [2.6, 1.0],
      [2.3, 1.25],
      [1.55, 1.32],
      [1.15, 2.42],
      [-2.35, 2.5],
      [-2.6, 2.3],
    ],
    vitrage: [
      [1.58, 1.34],
      [1.22, 2.3],
      [0.62, 2.32],
      [0.6, 1.36],
    ],
  },
  bus: {
    l: 10.5,
    larg: 2.5,
    h: 3.0,
    essieu: 3.4,
    roue: 0.46,
    profil: [
      [-5.25, 0.5],
      [5.25, 0.5],
      [5.25, 2.75],
      [4.95, 2.98],
      [-4.95, 3.0],
      [-5.25, 2.78],
    ],
    vitrage: [
      [4.9, 1.35],
      [4.9, 2.55],
      [-4.85, 2.56],
      [-4.85, 1.36],
    ],
  },
};

// Le profil se referme tout seul ; on ne trace que les points utiles.
function forme(THREE, points) {
  const f = new THREE.Shape();
  f.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) f.lineTo(points[i][0], points[i][1]);
  f.closePath();
  return f;
}

// ⭐ L'extrusion biseautée. `bevelSize` est ce qui casse les arêtes : c'est le
// réglage le plus important du fichier, et c'est lui qui fait « métal peint »
// plutôt que « boîte ».
function extruder(THREE, points, largeur, biseau) {
  const geo = new THREE.ExtrudeGeometry(forme(THREE, points), {
    depth: Math.max(0.02, largeur - biseau * 2),
    bevelEnabled: biseau > 0,
    bevelThickness: biseau,
    bevelSize: biseau,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 4,
  });
  // Le profil est dessiné dans le plan XY et s'étire vers +Z. Un quart de tour
  // envoie sa longueur sur -Z (l'avant du moteur) et son épaisseur sur X.
  geo.rotateY(Math.PI / 2);
  geo.translate(-(largeur - biseau * 2) / 2 - biseau, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

// Un cache de géométries : cinq gabarits, et une rue en contient soixante.
// Sans lui on reconstruirait la même extrusion soixante fois au chargement.
const cache = new Map();
function geoDe(THREE, cle, fabrique) {
  if (!cache.has(cle)) cache.set(cle, fabrique());
  return cache.get(cle);
}

/**
 * Un véhicule-jouet.
 *
 * @param type    citadine · berline · suv · utilitaire · bus
 * @param teinte  hexadécimal, tiré de `palette.js`
 * @param laque   true = porteur de scène (reflet fort), false = figurant
 * @param alea    générateur reproductible, pour le jitter de peinture
 */
export function vehicule(
  THREE,
  type = "citadine",
  teinte = 0xb8b3a8,
  { laque = false, alea = null, feux = true } = {},
) {
  const G = GABARITS[type] || GABARITS.citadine;
  const g = new THREE.Group();
  const couleur = alea ? jitter(teinte, alea) : teinte;

  // La peinture. ⭐ C'est le REFLET qui fait la qualité perçue, pas le détail :
  // une carrosserie lisse qui renvoie le ciel a l'air d'un objet fini et cher.
  // La carte d'environnement est déjà cuite depuis le dégradé de ciel, donc
  // ce niveau de finition ne coûte rien de plus qu'un aplat.
  const peinture = new THREE.MeshStandardMaterial({
    color: couleur,
    // ⚠️ Un figurant est MAT (0,55) et ne reflète presque pas : c'est ce qui
    // le distingue d'un porteur de scène sans lui mettre de contour, et ça
    // l'empêche de brûler au soleil de seize heures.
    roughness: laque ? 0.18 : 0.55,
    metalness: 0,
    envMapIntensity: laque ? 1.3 : 0.5,
  });

  const corps = new THREE.Mesh(
    geoDe(THREE, `c${type}`, () => extruder(THREE, G.profil, G.larg, 0.055)),
    peinture,
  );
  corps.castShadow = true;
  corps.receiveShadow = true;
  g.add(corps);

  // La visière : un seul bandeau sombre qui ceinture l'habitacle. Un vitrage
  // découpé en fenêtres séparées fait maquette ; d'un seul tenant, il fait
  // jouet premium.
  //
  // 🔴 LE BUG DU 10/08, ET IL DATAIT DE LA CRÉATION DU FICHIER : le vitrage
  // était extrudé sur `larg - 0,1`, c'est-à-dire cinq centimètres PLUS ÉTROIT
  // que la carrosserie de chaque côté. Il était donc entièrement enfermé dans
  // le volume plein du corps, et parfaitement invisible. Toutes les voitures
  // du jeu étaient des savonnettes sans vitres depuis le premier jour, et
  // aucune relecture ne pouvait le voir : le code disait exactement ce qu'on
  // voulait, c'est la géométrie qui ne le permettait pas.
  //
  // Il déborde maintenant d'un centimètre : la visière ceinture l'habitacle,
  // et le toit reste peint parce que le profil du vitrage s'arrête quatre
  // centimètres sous la ligne de pavillon.
  if (G.vitrage) {
    const vitres = new THREE.Mesh(
      geoDe(THREE, `v${type}`, () =>
        extruder(THREE, G.vitrage, G.larg + 0.012, 0.02),
      ),
      new THREE.MeshStandardMaterial({
        color: 0x232d3f,
        roughness: 0.08,
        metalness: 0.6,
        envMapIntensity: 1.5,
      }),
    );
    g.add(vitres);
  }

  // Les roues, et surtout les ARCHES. Une roue posée contre un flanc plat a
  // l'air collée ; l'arche sombre creuse la carrosserie et c'est elle qui fait
  // croire à un passage de roue.
  const geoRoue = geoDe(THREE, `r${type}`, () =>
    new THREE.CylinderGeometry(G.roue, G.roue, 0.2, 14).rotateZ(Math.PI / 2),
  );
  const geoJante = geoDe(THREE, `j${type}`, () =>
    new THREE.CylinderGeometry(G.roue * 0.55, G.roue * 0.55, 0.21, 12).rotateZ(
      Math.PI / 2,
    ),
  );
  const geoArche = geoDe(THREE, `a${type}`, () =>
    new THREE.CylinderGeometry(G.roue * 1.2, G.roue * 1.2, 0.06, 14).rotateZ(
      Math.PI / 2,
    ),
  );
  const gomme = new THREE.MeshStandardMaterial({
    color: NUIT,
    roughness: 0.92,
    metalness: 0,
  });
  const jante = new THREE.MeshStandardMaterial({
    color: 0xd8d4c8,
    roughness: 0.35,
    metalness: 0.35,
    envMapIntensity: 1.1,
  });
  const creux = new THREE.MeshStandardMaterial({
    color: assombrir(couleur, 0.42),
    roughness: 0.95,
  });

  const essieux =
    type === "bus" ? [G.essieu, -G.essieu * 0.72] : [G.essieu, -G.essieu];
  for (const dz of essieux)
    for (const sx of [-1, 1]) {
      const x = (sx * G.larg) / 2 - sx * 0.03;
      const roue = new THREE.Mesh(geoRoue, gomme);
      roue.position.set(x, G.roue, -dz);
      roue.castShadow = true;
      g.add(roue);
      const j = new THREE.Mesh(geoJante, jante);
      j.position.set(x + sx * 0.015, G.roue, -dz);
      g.add(j);
      const a = new THREE.Mesh(geoArche, creux);
      a.position.set((sx * G.larg) / 2 - sx * 0.06, G.roue, -dz);
      g.add(a);
    }

  // La signature lumineuse : un BANDEAU, jamais deux petits cubes. C'est elle
  // qui dit d'un seul coup d'œil si un véhicule vient vers moi ou s'en va.
  let matStop = null;
  if (feux && type !== "bus") {
    const av = G.profil.reduce((m, p) => Math.max(m, p[0]), 0);
    const ar = G.profil.reduce((m, p) => Math.min(m, p[0]), 0);
    const hFeu = type === "utilitaire" ? 1.05 : G.h * 0.55;

    const phare = new THREE.Mesh(
      new THREE.BoxGeometry(G.larg * 0.82, 0.13, 0.07),
      new THREE.MeshBasicMaterial({ color: 0xfff2d6 }),
    );
    phare.position.set(0, hFeu, -av - 0.01);
    g.add(phare);

    matStop = new THREE.MeshBasicMaterial({ color: 0x8f3630 });
    const stop = new THREE.Mesh(
      new THREE.BoxGeometry(G.larg * 0.84, 0.14, 0.07),
      matStop,
    );
    stop.position.set(0, hFeu, -ar + 0.01);
    g.add(stop);
  }

  // Le liseré de bas de caisse : une fine bande claire qui court sous les
  // portes. Deux triangles, et la voiture a une ligne.
  const bas = new THREE.Mesh(
    new THREE.BoxGeometry(G.larg + 0.02, 0.05, G.l * 0.62),
    new THREE.MeshStandardMaterial({
      color: lisere(couleur, 0.12),
      roughness: 0.5,
    }),
  );
  bas.position.set(0, G.profil[0][1] + 0.02, 0);
  g.add(bas);

  // ⚠️ Même contrat que l'ancien kit : le moteur appelle `freiner()` pour
  // allumer les stops d'une voiture qui hésite. Ne pas casser cette API.
  g.userData.freiner = (on) => {
    if (matStop) matStop.color.setHex(on ? 0xff5a4a : 0x8f3630);
  };
  g.userData.gabarit = G;
  return g;
}

// ── LA VERSION INSTANCIÉE, POUR LES SOIXANTE VOITURES GARÉES ───────────
//
// 🔴 C'ÉTAIT LA MOITIÉ DU PROBLÈME DE PERFORMANCE. Une voiture garée compte
// quatorze pièces ; soixante voitures faisaient donc plus de huit cents
// ordres de dessin, pour des objets qui ne bougent JAMAIS. Ici on pose les
// mêmes pièces dans le banc : la flotte entière tombe à une dizaine d'ordres,
// et chaque voiture garde sa teinte grâce à la couleur par copie.
//
// ⚠️ Réservé au DÉCOR. Les véhicules d'une scène restent des objets normaux :
// ils bougent, ils freinent, ils s'ouvrent.

let MATV = null;
function materiauxV(THREE) {
  if (MATV) return MATV;
  MATV = {
    // Blanc : la teinte arrive par copie. Mat (0,55) et peu réfléchissant,
    // parce qu'une voiture garée fait la MASSE, jamais l'événement.
    peinture: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0,
      envMapIntensity: 0.5,
    }),
    verre: new THREE.MeshStandardMaterial({
      color: 0x232d3f,
      roughness: 0.08,
      metalness: 0.6,
      envMapIntensity: 1.5,
    }),
    gomme: new THREE.MeshStandardMaterial({
      color: NUIT,
      roughness: 0.92,
      metalness: 0,
    }),
    jante: new THREE.MeshStandardMaterial({
      color: 0xd8d4c8,
      roughness: 0.35,
      metalness: 0.35,
      envMapIntensity: 1.1,
    }),
    creux: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0,
    }),
    feu: new THREE.MeshBasicMaterial({ color: 0xfff2d6 }),
    stop: new THREE.MeshBasicMaterial({ color: 0x8f3630 }),
  };
  return MATV;
}

/** Une voiture de décor, posée dans le banc à (x, z), cap en radians. */
export function vehiculeAuBanc(
  THREE,
  banc,
  type,
  teinte,
  { x = 0, z = 0, cap = 0, alea = null } = {},
) {
  const G = GABARITS[type] || GABARITS.citadine;
  const M = materiauxV(THREE);
  const couleur = alea ? jitter(teinte, alea) : teinte;
  const seg = { segmente: true };
  const repere = new THREE.Matrix4().makeRotationY(cap).setPosition(x, 0, z);

  banc.sousRepere(repere, () => {
    banc.neuf();
    banc.poser(
      `corps${type}`,
      geoDe(THREE, `c${type}`, () => extruder(THREE, G.profil, G.larg, 0.055)),
      M.peinture,
      couleur,
      seg,
    );
    if (G.vitrage) {
      banc.neuf();
      banc.poser(
        `vitres${type}`,
        geoDe(THREE, `v${type}`, () =>
          extruder(THREE, G.vitrage, G.larg + 0.012, 0.02),
        ),
        M.verre,
        null,
        { segmente: true, ombre: false },
      );
    }
    const geoRoue = geoDe(THREE, `r${type}`, () =>
      new THREE.CylinderGeometry(G.roue, G.roue, 0.2, 14).rotateZ(Math.PI / 2),
    );
    const geoJante = geoDe(THREE, `j${type}`, () =>
      new THREE.CylinderGeometry(
        G.roue * 0.55,
        G.roue * 0.55,
        0.21,
        12,
      ).rotateZ(Math.PI / 2),
    );
    const geoArche = geoDe(THREE, `a${type}`, () =>
      new THREE.CylinderGeometry(G.roue * 1.2, G.roue * 1.2, 0.06, 14).rotateZ(
        Math.PI / 2,
      ),
    );
    const essieux =
      type === "bus" ? [G.essieu, -G.essieu * 0.72] : [G.essieu, -G.essieu];
    for (const dz of essieux)
      for (const sx of [-1, 1]) {
        const bx = (sx * G.larg) / 2 - sx * 0.03;
        banc.neuf().position.set(bx, G.roue, -dz);
        banc.poser(`roue${type}`, geoRoue, M.gomme, null, seg);
        banc.neuf().position.set(bx + sx * 0.015, G.roue, -dz);
        banc.poser(`jante${type}`, geoJante, M.jante, null, {
          segmente: true,
          ombre: false,
        });
        banc.neuf().position.set((sx * G.larg) / 2 - sx * 0.06, G.roue, -dz);
        banc.poser(
          `arche${type}`,
          geoArche,
          M.creux,
          assombrir(couleur, 0.42),
          {
            segmente: true,
            ombre: false,
          },
        );
      }
    // Le liseré de bas de caisse : une fine bande claire sous les portes.
    const p = banc.neuf();
    p.position.set(0, G.profil[0][1] + 0.02, 0);
    p.scale.set(G.larg + 0.02, 0.05, G.l * 0.62);
    banc.poser("basdecaisse", CUBE(THREE), M.peinture, lisere(couleur, 0.12), {
      segmente: true,
      ombre: false,
    });
    // La signature lumineuse : un BANDEAU, jamais deux petits cubes.
    if (type !== "bus") {
      const av = G.profil.reduce((m, q) => Math.max(m, q[0]), 0);
      const ar = G.profil.reduce((m, q) => Math.min(m, q[0]), 0);
      const hFeu = type === "utilitaire" ? 1.05 : G.h * 0.55;
      const f = banc.neuf();
      f.position.set(0, hFeu, -av - 0.01);
      f.scale.set(G.larg * 0.82, 0.13, 0.07);
      banc.poser("phare", CUBE(THREE), M.feu, null, { ombre: false });
      const s = banc.neuf();
      s.position.set(0, hFeu, -ar + 0.01);
      s.scale.set(G.larg * 0.84, 0.14, 0.07);
      banc.poser("stop", CUBE(THREE), M.stop, null, { ombre: false });
    }
  });
  return G;
}

// La flotte des figurants : des silhouettes VARIÉES, sinon une file de
// stationnement redevient un mur. Pondérée comme une vraie rue de ville.
export const FLOTTE = [
  "citadine",
  "citadine",
  "citadine",
  "berline",
  "berline",
  "suv",
  "utilitaire",
];
