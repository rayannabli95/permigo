// LES PERSONNAGES DE PERMIGO — des quilles qui savent regarder.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §6 (personnages) et §8 (mouvement).
//
// ⭐ LA CONTRAINTE QUI DÉCIDE DE TOUT : notre gameplay n'est pas « repérer un
// piéton », c'est « lire une INTENTION ». Or une intention se lit dans une
// orientation de tête et un transfert de poids. Un personnage PermiGo est donc
// conçu à l'envers d'un personnage de jeu classique : on ne cherche ni les
// doigts ni les plis de vêtement, on grossit l'organe que le joueur doit lire
// et on jette tout le reste.
//
// 🔴 CE QUI A CHANGÉ LE 10/08 — « on dirait des persos de Roblox ».
//
// Verdict juste, et la cause tenait en trois manques. Un personnage était un
// assemblage de primitives qui s'ARRÊTAIENT en l'air : pas de mains au bout
// des bras, pas de pieds au bout des jambes, pas de regard sur la tête. L'œil
// humain cherche d'abord un visage, ensuite les extrémités ; quand il ne
// trouve ni l'un ni les autres, il conclut « mannequin », et aucune finesse
// ailleurs ne rattrape ça.
//
// D'où quatre pièces ajoutées, toutes minuscules et toutes décisives :
//   · le REGARD — une calotte sombre à l'avant du crâne, à hauteur des yeux.
//     Elle sert aussi le jeu : notre mécanique entière repose sur « où
//     regarde cette personne », et un bandeau se lit à trente mètres là où la
//     seule frontière peau/cheveux demandait d'être à quinze ;
//   · les MAINS, deux boules de peau ;
//   · les CHAUSSURES, dont la hauteur EST l'écart au sol (calculé, pas
//     deviné) : les jambes flottaient à quinze centimètres du trottoir ;
//   · les ÉPAULES, un yoke un peu plus large qui donne une carrure.
//
// ⭐ ET ÇA NE COÛTE RIEN, PARCE QU'ON FOND. Ces quatre pièces faisaient passer
// un personnage de dix à quatorze objets, soit 163 ordres de dessin pour un
// budget de 140. On fusionne donc chaque MEMBRE en une seule géométrie, les
// couleurs passant par sommet : un personnage tient désormais en six objets,
// moins qu'avant, avec deux fois plus de détail. La règle est simple — ce qui
// ne bouge PAS l'un par rapport à l'autre n'a aucune raison d'être dessiné
// séparément.
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
  // 🔴 REMONTÉ DE 1,28 À 1,42 LE 10/08 — « l'enfant on le voit à peine ».
  // La loi de lisibilité (bible §2) veut 24 px pour un indice statique, soit
  // une distance maximale de 26 × la taille. À 1,28 m la scène n'était lisible
  // qu'à 33 m alors qu'elle commence à 36, et elle se joue en bord de cadre,
  // là où le regard passe le moins. On préfère vieillir l'enfant de deux ans
  // plutôt que garder une scène que personne ne peut jouer. Sa tête grossit
  // avec : c'est elle qu'on lit, pas son corps.
  enfant: {
    taille: 1.42,
    tete: 0.192,
    torse: { r: 0.166, h: 0.32, y: 0.89 },
    jambe: { r: 0.074, h: 0.37, y: 0.395, ecart: 0.086 },
    bras: { r: 0.055, h: 0.32, y: 1.03, ecart: 0.184 },
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

// Un seul matériau pour toute la population : la couleur voyage dans les
// sommets. Deux cents personnages partagent donc le même programme de rendu.
let PEAUX = null;
const matFondu = (THREE) =>
  (PEAUX ||= new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.4,
  }));

/**
 * ⭐ LA FONTE. Plusieurs primitives, chacune avec sa place et sa couleur,
 * ressortent en UNE géométrie coloriée par sommet.
 *
 * ⚠️ On dé-indexe avant de concaténer : deux géométries indexées ne
 * s'additionnent pas sans recalculer les index, et pour des objets de deux
 * cents triangles le gain d'un index ne vaut pas le risque.
 */
function fondre(THREE, pieces) {
  const pion = new THREE.Object3D();
  const pos = [];
  const nor = [];
  const col = [];
  const c = new THREE.Color();
  for (const p of pieces) {
    pion.position.set(...(p.p || [0, 0, 0]));
    pion.rotation.set(...(p.r || [0, 0, 0]));
    pion.scale.set(...(p.s || [1, 1, 1]));
    pion.updateMatrix();
    const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo.clone()).applyMatrix4(
      pion.matrix,
    );
    const P = g.attributes.position.array;
    const N = g.attributes.normal.array;
    c.setHex(p.c);
    for (let i = 0; i < P.length; i += 3) {
      pos.push(P[i], P[i + 1], P[i + 2]);
      nor.push(N[i], N[i + 1], N[i + 2]);
      col.push(c.r, c.g, c.b);
    }
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return out;
}

/**
 * Un passant.
 *
 * @param enfant  true = 1,42 m et vêtements très saturés
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
  const M = matFondu(THREE);

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

  const k = enfant ? "E" : "A";
  const geoCapsule = (cle, r, h, seg = 8) =>
    geoDe(THREE, `${cle}${k}`, () => new THREE.CapsuleGeometry(r, h, 3, seg));

  // ── Le buste : tout ce qui tourne quand on regarde ailleurs ───────────
  const buste = new THREE.Group();
  buste.position.y = C.torse.y;
  g.add(buste);

  const torse = new THREE.Mesh(
    fondre(THREE, [
      // ⚠️ Un humain est plus LARGE que profond. Une capsule de révolution
      // donne un tronc parfaitement cylindrique, et c'est une des raisons du
      // « on dirait Roblox » : personne n'a un torse rond.
      {
        geo: geoCapsule("t", C.torse.r, C.torse.h, 10),
        c: haut,
        s: [1.06, 1, 0.74],
      },
      // Le devant du torse, plus clair. Trois centimètres, et une silhouette
      // de dos cesse d'être identique à une silhouette de face.
      {
        geo: geoDe(
          THREE,
          `d${k}`,
          () => new THREE.BoxGeometry(C.torse.r * 1.25, C.torse.h * 0.9, 0.03),
        ),
        c: lisere(haut, 0.13),
        p: [0, 0, -C.torse.r * 0.92],
      },
      // ⭐ Les épaules. Sans elles, une capsule reste une quille.
      {
        geo: geoCapsule("e", C.torse.r * 0.62, C.torse.r * 2.1),
        c: assombrir(haut, 0.07),
        r: [0, 0, Math.PI / 2],
        s: [1, 1, 0.8],
        p: [0, C.torse.h / 2 - C.torse.r * 0.1, 0],
      },
    ]),
    M,
  );
  torse.castShadow = true;
  buste.add(torse);

  // ── Les bras, main comprise ───────────────────────────────────────────
  const bras = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * C.bras.ecart, C.bras.y - C.torse.y, 0);
    const m = new THREE.Mesh(
      fondre(THREE, [
        {
          geo: geoCapsule("b", C.bras.r, C.bras.h),
          c: haut,
          p: [0, -C.bras.h / 2, 0],
        },
        // ⭐ Une main. Un bras qui se termine par une section de cylindre
        // coupée net est le signal « mannequin » le plus fort après le visage.
        {
          geo: geoDe(
            THREE,
            `m${k}`,
            () => new THREE.SphereGeometry(C.bras.r * 1.32, 8, 6),
          ),
          c: peau,
          p: [0, -(C.bras.h + C.bras.r * 0.75), 0],
          s: [1, 1.12, 0.85],
        },
      ]),
      M,
    );
    m.castShadow = true;
    pivot.add(m);
    buste.add(pivot);
    bras.push(pivot);
  }

  // ── La tête : chevelure et regard ─────────────────────────────────────
  const col = new THREE.Group();
  col.position.y = C.torse.h / 2 + C.tete * 0.55;
  buste.add(col);

  const tete = new THREE.Mesh(
    fondre(THREE, [
      {
        geo: geoDe(
          THREE,
          `h${k}`,
          () => new THREE.SphereGeometry(C.tete, 14, 10),
        ),
        c: peau,
      },
      // 🔴 SANS LA CHEVELURE, LE JEU NE MARCHE PAS. Une sphère nue tourne sans
      // qu'on le voie : « le cycliste a regardé derrière lui » deviendrait
      // invisible. Elle couvre l'arrière et le dessus du crâne, et c'est la
      // frontière peau/cheveux qui trahit l'orientation.
      {
        geo: geoDe(
          THREE,
          `c${k}`,
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
        c: cheveux,
        p: [0, 0, C.tete * 0.16], // basculée vers l'arrière : le front se dégage
        r: [-0.28, 0, 0],
      },
      // ⭐⭐ LE REGARD. Une calotte sombre plaquée sur l'AVANT du crâne, à
      // hauteur des yeux, épousant exactement la sphère. Ni yeux séparés, ni
      // bouche, ni nez : ça tomberait dans le dessin animé. Une seule bande
      // suffit à ce que le cerveau voie quelqu'un plutôt qu'un mannequin.
      {
        geo: geoDe(
          THREE,
          `y${k}`,
          () =>
            new THREE.SphereGeometry(
              C.tete * 1.035,
              14,
              6,
              -Math.PI / 2 - 0.86, // centrée sur -Z, c'est-à-dire devant
              1.72,
              1.24, // juste au-dessus de l'équateur
              0.36,
            ),
        ),
        c: 0x2b2438,
      },
    ]),
    M,
  );
  tete.castShadow = true;
  col.add(tete);

  // ── Les jambes, chaussure comprise ────────────────────────────────────
  // ⚠️ La hauteur de la chaussure EST l'écart entre le bas de la jambe et le
  // sol. Elle se calcule, elle ne se devine pas : avant, les jambes
  // s'arrêtaient à quinze centimètres du trottoir, en l'air.
  const hPied = C.jambe.y - C.jambe.h / 2 - C.jambe.r;
  const jambes = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * C.jambe.ecart, C.jambe.y + C.jambe.h / 2, 0);
    const m = new THREE.Mesh(
      fondre(THREE, [
        {
          geo: geoCapsule("j", C.jambe.r, C.jambe.h),
          c: bas,
          p: [0, -C.jambe.h / 2, 0],
        },
        {
          geo: geoDe(
            THREE,
            `p${k}`,
            () =>
              new THREE.BoxGeometry(C.jambe.r * 1.9, hPied, C.jambe.r * 3.5),
          ),
          // ⚠️ Une valeur FIXE et sombre, pas une nuance du pantalon : une
          // chaussure claire sous un pantalon clair fait deux taches pâles au
          // ras du sol, et le personnage a l'air de flotter quand même.
          c: 0x2a2434,
          p: [0, -(C.jambe.h + C.jambe.r) - hPied / 2, -C.jambe.r * 0.75],
        },
      ]),
      M,
    );
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
    const q = Math.max(0, Math.min(1, intensite));
    const phase = t * cadence * (0.6 + 0.4 * q);
    const balancier = Math.sin(phase) * q;
    jambes[0].rotation.x = balancier * 0.62;
    jambes[1].rotation.x = -balancier * 0.62;
    bras[0].rotation.x = -balancier * 0.45;
    bras[1].rotation.x = balancier * 0.45;
    // Le rebond du pas : trois centimètres, à deux fois la cadence.
    g.position.y = (g.userData.sol || 0) + Math.abs(Math.sin(phase)) * 0.03 * q;
    // Le repos n'est jamais immobile : une respiration de six millimètres.
    if (q < 0.05) buste.position.y = C.torse.y + Math.sin(t * 1.6) * 0.006;
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
  g.userData.jambes = jambes;
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
  g.add(homme);

  // 🔴 IL MARCHAIT AU LIEU DE PÉDALER (10/08). On réutilisait l'animation de
  // marche : les jambes balançaient d'avant en arrière autour de la hanche,
  // ce qui, sur un vélo, donne quelqu'un qui court assis. Un pédalage n'est
  // pas un balancement, c'est un CERCLE — les deux cuisses tournent en
  // opposition de phase autour du pédalier, et les pieds ne repassent jamais
  // derrière l'axe du corps.
  const jambes = homme.userData.jambes;
  g.userData.buste = homme.userData.buste;
  g.userData.tete = homme.userData.tete;
  g.userData.regarder = homme.userData.regarder;
  g.userData.pas = (t) => {
    // Le pédalier tourne à peu près une fois et demie par seconde en ville.
    const phase = t * 5.2;
    for (let i = 0; i < 2; i++) {
      const a = phase + i * Math.PI;
      // 0,62 rad d'ouverture moyenne : la cuisse reste toujours en avant du
      // bassin, elle ne repart jamais vers l'arrière comme à la marche.
      jambes[i].rotation.x = 0.62 + Math.sin(a) * 0.46;
    }
    // Le buste monte de deux centimètres à chaque coup de pédale.
    homme.position.y = 0.5 + Math.abs(Math.sin(phase)) * 0.02;
  };
  // ⚠️ Le braquage est amplifié : à quinze mètres, la roue avant d'un vélo
  // fait quelques pixels. On exagère le geste de trois, sinon il n'existe pas.
  g.userData.braquer = (angle) => {
    direction.rotation.y = angle * 3;
  };
  return g;
}
