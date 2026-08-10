// LES PERSONNAGES DE PERMIGO — des quilles qui savent regarder.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §6 (personnages) et §8 (mouvement).
//
// ⭐ LA CONTRAINTE QUI DÉCIDE DE TOUT : notre gameplay n'est pas « repérer un
// piéton », c'est « lire une INTENTION ». Or une intention se lit dans une
// orientation de tête et un transfert de poids. Un personnage PermiGo est donc
// conçu à l'envers d'un personnage de jeu classique : on ne cherche ni le
// visage, ni les doigts, ni les plis de vêtement — on grossit l'organe que le
// joueur doit lire, et on jette tout le reste.
//
// D'où trois partis pris :
//   · la TÊTE est énorme (20 % de la taille chez l'adulte, 26 % chez l'enfant,
//     contre 13 % dans la réalité) ;
//   · elle porte une CHEVELURE qui couvre l'arrière du crâne, parce qu'une
//     sphère nue n'a aucune orientation lisible à trente mètres — c'est ce
//     contraste peau/cheveux qui dit « il regarde par là » ;
//   · le torse porte un DEVANT plus clair, pour la même raison.
//
// Aucune animation squelettale, aucun fichier : des groupes qu'on tourne, et
// des fonctions pures du temps. Le rembobinage reste gratuit.

import { PEAU, VETEMENTS, jitter, lisere, assombrir, NUIT } from "./palette.js";

const CORPS = {
  adulte: {
    taille: 1.72,
    tete: 0.17, // rayon
    torse: { r: 0.185, h: 0.44, y: 1.06 },
    jambe: { r: 0.078, h: 0.4, y: 0.44, ecart: 0.095 },
    bras: { r: 0.058, h: 0.38, y: 1.22, ecart: 0.215 },
  },
  // ⚠️ 1,28 m et pas 1,15 : la loi de lisibilité (bible §2) veut 24 px pour un
  // indice statique, soit une distance maximale de 26 × la taille. À 1,15 m la
  // scène de l'enfant n'était lisible qu'à 30 m alors qu'elle commence à 34.
  // On vieillit l'enfant de deux ans plutôt que de rendre la scène injouable.
  enfant: {
    taille: 1.28,
    tete: 0.167,
    torse: { r: 0.15, h: 0.29, y: 0.8 },
    jambe: { r: 0.067, h: 0.335, y: 0.355, ecart: 0.078 },
    bras: { r: 0.05, h: 0.29, y: 0.93, ecart: 0.166 },
  },
};

const cache = new Map();
function geoDe(THREE, cle, fabrique) {
  if (!cache.has(cle)) cache.set(cle, fabrique());
  return cache.get(cle);
}

const materiau = (THREE, couleur, rug = 0.82) =>
  new THREE.MeshStandardMaterial({
    color: couleur,
    roughness: rug,
    metalness: 0,
    envMapIntensity: 0.4,
  });

/**
 * Un passant.
 *
 * @param enfant  true = 1,15 m et vêtements très saturés
 * @param alea    générateur reproductible (peau, vêtements, cadence)
 * @param couleur force la couleur du haut (les acteurs de scène s'en servent)
 */
export function personnage(
  THREE,
  { enfant = false, alea = null, couleur = null } = {},
) {
  const C = enfant ? CORPS.enfant : CORPS.adulte;
  const tire = alea || (() => 0.5);
  const g = new THREE.Group();

  const peau = PEAU[Math.floor(tire() * PEAU.length) % PEAU.length];
  // ⭐ Les enfants sont les êtres les plus saturés de la rue. Ce n'est pas une
  // coquetterie : c'est ce qui leur donne le contraste nécessaire pour être
  // lus à trente mètres, là où la scène de l'enfant se joue.
  const hauts = enfant ? VETEMENTS.enfant : VETEMENTS.adulte;
  const haut =
    couleur ??
    jitter(hauts[Math.floor(tire() * hauts.length) % hauts.length], tire);
  const bas = enfant ? assombrir(haut, 0.28) : VETEMENTS.adulteBas;
  const cheveux = [0x2c2233, 0x4a3226, 0x6b4a2f, 0x1f1a26][
    Math.floor(tire() * 4) % 4
  ];

  const matPeau = materiau(THREE, peau, 0.78);
  const matHaut = materiau(THREE, haut);
  const matBas = materiau(THREE, bas);

  // ── Le buste : tout ce qui tourne quand on regarde ailleurs ───────────
  const buste = new THREE.Group();
  buste.position.y = C.torse.y;
  g.add(buste);

  const torse = new THREE.Mesh(
    geoDe(
      THREE,
      `t${enfant}`,
      () => new THREE.CapsuleGeometry(C.torse.r, C.torse.h, 4, 10),
    ),
    matHaut,
  );
  torse.castShadow = true;
  buste.add(torse);

  // Le devant du torse, plus clair. Une plaque de trois centimètres, et une
  // silhouette de dos cesse d'être identique à une silhouette de face.
  const devant = new THREE.Mesh(
    geoDe(
      THREE,
      `d${enfant}`,
      () => new THREE.BoxGeometry(C.torse.r * 1.25, C.torse.h * 0.9, 0.03),
    ),
    materiau(THREE, lisere(haut, 0.13)),
  );
  devant.position.set(0, 0, -C.torse.r * 0.92);
  buste.add(devant);

  const geoBras = geoDe(
    THREE,
    `b${enfant}`,
    () => new THREE.CapsuleGeometry(C.bras.r, C.bras.h, 3, 8),
  );
  const bras = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * C.bras.ecart, C.bras.y - C.torse.y, 0);
    const m = new THREE.Mesh(geoBras, matHaut);
    m.position.y = -C.bras.h / 2;
    m.castShadow = true;
    pivot.add(m);
    buste.add(pivot);
    bras.push(pivot);
  }

  // ── La tête, et sa chevelure qui donne le cap ─────────────────────────
  const col = new THREE.Group();
  col.position.y = C.torse.h / 2 + C.tete * 0.55;
  buste.add(col);

  const tete = new THREE.Mesh(
    geoDe(THREE, `h${enfant}`, () => new THREE.SphereGeometry(C.tete, 14, 10)),
    matPeau,
  );
  tete.castShadow = true;
  col.add(tete);

  // 🔴 SANS ELLE, LE JEU NE MARCHE PAS. Une sphère nue tourne sans qu'on le
  // voie : « le cycliste a regardé derrière lui » deviendrait invisible. La
  // chevelure couvre l'arrière et le dessus du crâne ; c'est la frontière
  // peau/cheveux qui trahit l'orientation, et elle se lit à trente mètres.
  const chev = new THREE.Mesh(
    geoDe(
      THREE,
      `c${enfant}`,
      () =>
        new THREE.SphereGeometry(
          C.tete * 1.06,
          14,
          10,
          0,
          Math.PI * 2,
          0,
          1.15,
        ),
    ),
    materiau(THREE, cheveux, 0.9),
  );
  chev.position.z = C.tete * 0.16; // basculée vers l'arrière : le front se dégage
  chev.rotation.x = -0.28;
  col.add(chev);

  // ── Les jambes ────────────────────────────────────────────────────────
  const geoJambe = geoDe(
    THREE,
    `j${enfant}`,
    () => new THREE.CapsuleGeometry(C.jambe.r, C.jambe.h, 3, 8),
  );
  const jambes = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * C.jambe.ecart, C.jambe.y + C.jambe.h / 2, 0);
    const m = new THREE.Mesh(geoJambe, matBas);
    m.position.y = -C.jambe.h / 2;
    m.castShadow = true;
    pivot.add(m);
    g.add(pivot);
    jambes.push(pivot);
  }

  // ── Le mouvement ──────────────────────────────────────────────────────
  //
  // 📖 Bible §8 : rien n'est linéaire, tout a du poids, et la tête TRAÎNE
  // derrière les épaules. C'est ce retard de huit centièmes qui sépare un
  // personnage vivant d'un pion qu'on fait glisser.
  const cadence = 2.4 + tire() * 0.5;
  let capVoulu = 0;
  let capTete = 0;

  // `intensite` vaut 0 à l'arrêt et 1 en marche : le moteur la calcule à
  // partir du DÉPLACEMENT RÉEL de l'acteur, donc l'animation ne peut jamais
  // désynchroniser d'avec la position. Un piéton qui glisse est impossible.
  function pas(t, intensite = 1) {
    const k = Math.max(0, Math.min(1, intensite));
    const phase = t * cadence * (0.6 + 0.4 * k);
    const balancier = Math.sin(phase) * k;
    jambes[0].rotation.x = balancier * 0.62;
    jambes[1].rotation.x = -balancier * 0.62;
    bras[0].rotation.x = -balancier * 0.45;
    bras[1].rotation.x = balancier * 0.45;
    // Le rebond du pas : trois centimètres, à deux fois la cadence.
    g.position.y = (g.userData.sol || 0) + Math.abs(Math.sin(phase)) * 0.03 * k;
    // Le repos n'est jamais immobile : une respiration de six millimètres.
    if (k < 0.05) buste.position.y = C.torse.y + Math.sin(t * 1.6) * 0.006;
  }

  // Regarder quelque part. Les épaules suivent à 40 %, et la tête arrive
  // avant elles : c'est l'ordre naturel, et c'est lui qui rend le geste lisible.
  function regarder(cap, dt = 0.016) {
    capVoulu = cap;
    capTete += (capVoulu - capTete) * Math.min(1, dt * 14);
    col.rotation.y = capTete;
    buste.rotation.y = capTete * 0.4;
  }

  g.userData.buste = buste;
  g.userData.tete = col;
  g.userData.pas = pas;
  g.userData.regarder = regarder;
  g.userData.sol = 0;
  g.userData.taille = C.taille;
  return g;
}

// ── LE CYCLISTE ────────────────────────────────────────────────────────
//
// 🔴 LA SCÈNE LA PLUS IMPORTANTE DU JEU EN DÉPEND. « Un cycliste qui regarde
// derrière lui va changer de trajectoire » est notre meilleure leçon, et elle
// était portée par un modèle importé qu'on ne pouvait tourner qu'en entier.
// Ici le buste du cycliste est un groupe à part : il peut regarder par-dessus
// son épaule pendant que le vélo continue tout droit, ce qui est exactement
// ce qu'on veut faire lire.
export function cycliste(THREE, { couleur = null, alea = null } = {}) {
  const g = new THREE.Group();
  const tire = alea || (() => 0.5);

  const cadre = materiau(THREE, 0x2f3644, 0.5);
  const gomme = materiau(THREE, NUIT, 0.92);

  const geoRoue = geoDe(
    THREE,
    "vroue",
    () => new THREE.TorusGeometry(0.34, 0.028, 6, 20),
  );
  // La roue arrière est solidaire du cadre.
  {
    const r = new THREE.Mesh(geoRoue, gomme);
    r.position.set(0, 0.34, 0.52);
    r.rotation.y = Math.PI / 2;
    r.castShadow = true;
    g.add(r);
  }
  // ⭐ LA DIRECTION EST UN GROUPE À PART. Sans elle, un vélo ne peut que
  // pivoter en bloc, et c'est exactement ce que Rayan a vu : « on dirait
  // qu'il pivote sur lui-même ». Un vrai vélo braque d'abord sa roue avant,
  // puis le reste suit. Ce décalage-là ne se simule pas, il se modélise.
  const direction = new THREE.Group();
  direction.position.set(0, 0, -0.52);
  g.add(direction);
  {
    const r = new THREE.Mesh(geoRoue, gomme);
    r.position.set(0, 0.34, 0);
    r.rotation.y = Math.PI / 2;
    r.castShadow = true;
    direction.add(r);
  }
  // Le cadre : quelques tubes. La silhouette d'un vélo tient dans son triangle.
  const tube = (parent, l, x, y, z, rx, rz) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, l, 6),
      cadre,
    );
    m.position.set(x, y, z);
    m.rotation.set(rx || 0, 0, rz || 0);
    parent.add(m);
  };
  tube(g, 1.0, 0, 0.62, 0, Math.PI / 2.6, 0);
  tube(g, 0.5, 0, 0.5, 0.18, 0, 0);
  // La fourche et la potence tournent avec la roue avant.
  tube(direction, 0.72, 0, 0.66, 0.06, -0.2, 0);
  const guidon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.44, 6),
    cadre,
  );
  guidon.position.set(0, 0.98, 0.02);
  guidon.rotation.z = Math.PI / 2;
  direction.add(guidon);

  // Le cycliste lui-même, penché sur son guidon.
  const homme = personnage(THREE, {
    alea: tire,
    couleur: couleur ?? VETEMENTS.enfant[0],
  });
  homme.position.set(0, 0.5, 0.06);
  homme.userData.buste.rotation.x = 0.34; // penché vers l'avant
  // Les jambes pédalent : on les fige à l'horizontale et c'est `pas` qui les
  // fait tourner. Un cycliste aux jambes droites a l'air d'être porté.
  g.add(homme);

  const pasHomme = homme.userData.pas;
  g.userData.buste = homme.userData.buste;
  g.userData.tete = homme.userData.tete;
  g.userData.regarder = homme.userData.regarder;
  g.userData.pas = (t, k) => pasHomme(t, Math.max(0.35, k));
  // ⚠️ Le braquage est amplifié : à quinze mètres, la roue avant d'un vélo
  // fait quelques pixels. On exagère le geste de trois, sinon il n'existe pas.
  g.userData.braquer = (angle) => {
    direction.rotation.y = angle * 3;
  };
  return g;
}
