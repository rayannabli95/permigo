// La rue. Une droite de trois cent soixante mètres, et un carrefour.
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
// ⭐ CRITÈRE : une portion de rue VIDE doit déjà être belle. Si la capture
// d'une rue sans acteurs est ennuyeuse, la route est ratée.
//
// 🔴 TOUT LE DÉCOR PASSE PAR LE BANC D'INSTANCES (`da/instances.js`). Il ne
// bouge jamais, donc il n'a aucune raison de coûter un ordre de dessin par
// pièce. C'est ce qui a libéré le budget de détail des façades.
//
// Repère : X = est, Z = sud, on roule vers -Z. La voie du joueur est x = +1,7.

import { SOL, VEHICULES_NEUTRES, assombrir, piocher } from "../da/palette.js";
import { bitume, trottoir } from "../da/textures.js";
import { vehiculeAuBanc, FLOTTE, GABARITS } from "../da/vehicules.js";
import { personnage } from "../da/personnages.js";
import { rangee } from "../da/batiments.js";
import { poserMobilier } from "../da/mobilier.js";
import { creerBanc, CUBE, PLAN } from "../da/instances.js";

export const VOIE = 3.4;
export const X_JOUEUR = 1.7;
export const X_OPPOSE = -1.7;
export const X_STATIONNE = 4.6; // le centre d'une place de stationnement
export const BORD = 5.7; // le bord de la chaussée
export const TROTTOIR = 2.8;
export const Z_DEBUT = 60;
export const Z_FIN = -293;

// ⭐ LE FOND DE RUE. Ajouté le 10/08 : « à la fin il y a un écran blanc après
// les piétons ». La rue s'arrêtait dans le vide, et comme la brume ne
// commence qu'à 165 m elle ne le cachait pas : on voyait la chaussée mourir
// sur un aplat de ciel. Une rue de ville ne finit JAMAIS en pointe, elle
// tombe sur une autre rue.
//
// On ferme donc la perspective par un T : une transversale et un mur
// d'immeubles en face, à trente mètres après la dernière scène. Ça coûte une
// matrice, ça se cadre tout seul, et ça donne enfin une fin à la partie.
export const FOND = { z: -298, largeur: 11 };

// ⭐ LE CARREFOUR. Ajouté le 10/08 pour une raison de crédibilité, pas de
// décor : la voiture qui hésite (scène 4) SORTAIT D'UN IMMEUBLE. Elle
// démarrait à x = 6,9, c'est-à-dire en plein sur le trottoir, devant une
// façade pleine. Le joueur voyait bien qu'elle allait le gêner, mais il ne
// pouvait pas comprendre D'OÙ elle venait, et une leçon qu'on ne peut pas
// expliquer ne s'apprend pas.
//
// Ici la rue transversale est construite pour de vrai : chaussée, bordures,
// trottoirs, immeubles en enfilade et voitures garées. Elle est dessinée
// DROITE dans son propre repère puis pivotée d'un quart de tour à la pose
// (cf. `banc.sousRepere`) : le même code sert les deux rues.
export const CARREFOURS = [{ z: -214.5, cote: 1, largeur: 8, longueur: 40 }];
// La coupure que le carrefour impose au trottoir et au bâti de la rue
// principale. Le bâti recule de la largeur des trottoirs transversaux.
const coupureTrottoir = (c) => [c.z + c.largeur / 2, c.z - c.largeur / 2];
const coupureBati = (c) => [
  c.z + c.largeur / 2 + TROTTOIR + 0.4,
  c.z - c.largeur / 2 - TROTTOIR - 0.4,
];

// Un générateur reproductible. 🔴 Jamais Math.random ici : une rue qui change
// à chaque partie rend impossible de comparer deux essais.
function des(graine) {
  let x = graine;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

// Découper [zA, zB] par une liste de coupures, et rendre les morceaux.
function morceaux(zA, zB, coupures) {
  let bouts = [[zA, zB]];
  for (const [ca, cb] of coupures) {
    const suivant = [];
    for (const [a, b] of bouts) {
      if (ca <= b || cb >= a) {
        suivant.push([a, b]);
        continue;
      }
      if (a > ca) suivant.push([a, ca]);
      if (b < cb) suivant.push([cb, b]);
    }
    bouts = suivant;
  }
  return bouts.filter(([a, b]) => a - b > 0.5);
}

export function construireRue(THREE, kit, { trous = [] } = {}) {
  const r = des(20260810);
  // ⚠️ 150 m et non 90. Segmenter permet au hors-champ de se couper, mais
  // chaque segment MULTIPLIE le nombre d'ordres de dessin : à 90 m la rue en
  // comptait cinq, donc cinq fois chaque famille de pièce. Les triangles sont
  // à 18 000 pour un budget de 180 000, on a donc tout intérêt à dessiner un
  // peu plus de géométrie invisible pour donner beaucoup moins d'ordres.
  const banc = creerBanc(THREE, { segment: 150 });
  const bancVehicules = creerBanc(THREE, { segment: 150 });
  const cube = CUBE(THREE);
  const plan = PLAN(THREE);

  const uni = (o) =>
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.94,
      metalness: 0,
      ...o,
    });
  // ⚠️ Les répétitions sont cuites dans les UV de chaque nappe, PAS dans le
  // matériau : une même matière habille des surfaces de tailles très
  // différentes, et `map.repeat` est partagé par tout ce qui l'utilise.
  const M = {
    route: uni({ map: bitume(THREE), roughness: 0.95 }),
    dalle: uni({ map: trottoir(THREE), roughness: 0.9 }),
    beton: uni({ roughness: 0.92 }),
  };
  const TUILE_ROUTE = 8; // la dalle de bitume fait 8 m
  const TUILE_DALLE = 2.4; // deux dalles de trottoir de 1,2 m
  // Les bandes au sol se superposent au bitume : sans décalage de profondeur
  // elles clignotent avec lui dès qu'on s'en éloigne.
  const matPlat = (opacite = 1) =>
    uni({
      roughness: 1,
      transparent: opacite < 1,
      opacity: opacite,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  M.marquage = matPlat(1);
  M.trace = matPlat(0.2);
  M.caniveau = matPlat(0.55);

  // ── Les primitives de pose ───────────────────────────────────────────
  const bloc = (cle, mat, c, lx, ly, lz, x, yBas, z, opts) => {
    const p = banc.neuf();
    p.position.set(x, yBas + ly / 2, z);
    p.scale.set(lx, ly, lz);
    banc.poser(cle, cube, mat, c, { ombre: ly > 0.3, ...opts });
  };
  // Une bande posée à plat : marquage, trace de roulement, caniveau.
  const bande = (cle, mat, c, larg, longueur, x, z, y = 0.012) => {
    const p = banc.neuf();
    p.position.set(x, y, z);
    p.rotation.x = -Math.PI / 2;
    p.scale.set(larg, longueur, 1);
    banc.poser(cle, plan, mat, c, { ombre: false });
  };
  // Une nappe texturée dont la répétition dépend de sa taille : on ne peut pas
  // l'obtenir par copie, donc chaque nappe garde sa propre géométrie avec ses
  // UV cuites. Elles sont peu nombreuses (une par tronçon de chaussée).
  const nappes = new THREE.Group();
  let courant = nappes;
  const nappe = (mat, larg, longueur, x, y, z, tuile) => {
    const g = new THREE.PlaneGeometry(larg, longueur);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) * larg) / tuile, (uv.getY(i) * longueur) / tuile);
    uv.needsUpdate = true;
    const m = new THREE.Mesh(g, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    courant.add(m);
    return m;
  };

  // ⭐ Le repère partagé. `banc.sousRepere` ne connaît que les copies ; les
  // nappes, elles, sont des objets normaux. Cette fonction fait pivoter les
  // deux en même temps, et c'est ce qui permet de construire la rue
  // transversale avec exactement le même code que la rue principale.
  const sousRepere = (m, f) => {
    const g = new THREE.Group();
    g.applyMatrix4(m);
    nappes.add(g);
    const avant = courant;
    courant = g;
    banc.sousRepere(m, f);
    courant = avant;
  };

  // ── UNE RUE, DANS SON PROPRE REPÈRE ──────────────────────────────────
  //
  // ⭐ Cette fonction dessine une rue droite qui part de z = zA vers z = zB,
  // centrée sur x = 0. La rue principale l'appelle telle quelle ; la rue
  // transversale l'appelle sous un repère pivoté d'un quart de tour. C'est ce
  // qui rend un carrefour crédible pour le prix d'une matrice.
  function poserChaussee(
    zA,
    zB,
    demi,
    { coupures = [], axe = true, y = 0 } = {},
  ) {
    const long = zA - zB;
    const milieu = (zA + zB) / 2;
    nappe(M.route, demi * 2, long, 0, y, milieu, TUILE_ROUTE);

    // Les traces de roulement, là où passent les pneus. C'est de la
    // GÉOMÉTRIE et pas de la texture : elles suivent les voies, une texture
    // répétée les ferait serpenter.
    if (axe)
      for (const voie of [-1.7, 1.7])
        for (const dx of [-0.75, 0.75])
          bande(
            "trace",
            M.trace,
            SOL.roulement,
            0.5,
            long,
            voie + dx,
            milieu,
            0.008,
          );

    for (const s of [-1, 1]) {
      bande(
        "caniveau",
        M.caniveau,
        SOL.caniveau,
        0.3,
        long,
        s * (demi - 0.15),
        milieu,
        0.009,
      );
      // Trottoirs et bordures, coupés aux carrefours.
      for (const [a, b] of morceaux(zA, zB, coupures)) {
        const l = a - b;
        const m = (a + b) / 2;
        nappe(
          M.dalle,
          TROTTOIR,
          l,
          s * (demi + TROTTOIR / 2),
          0.163,
          m,
          TUILE_DALLE,
        );
        // Le chant du trottoir, pour qu'il ait une épaisseur vue de côté.
        bloc(
          "chant",
          M.beton,
          SOL.trottoir,
          TROTTOIR,
          0.16,
          l,
          s * (demi + TROTTOIR / 2),
          0,
          m,
          { ombre: false },
        );
        // La bordure et surtout son LISERÉ clair : la fine face qui attrape
        // le soleil et qui dit qu'un humain a dessiné le volume. Sans elle,
        // un trottoir est une marche ; avec elle, c'est un trottoir.
        bloc(
          "bordure",
          M.beton,
          SOL.bordure,
          0.22,
          0.18,
          l,
          s * (demi + 0.11),
          0,
          m,
          {
            ombre: false,
          },
        );
        bande(
          "bordureHaut",
          M.marquage,
          SOL.bordureHaut,
          0.24,
          l,
          s * (demi + 0.11),
          m,
          0.181,
        );
      }
      // Le bateau : au droit d'un carrefour, la bordure s'abaisse au lieu de
      // s'arrêter net sur une arête.
      for (const [ca, cb] of coupures)
        bloc(
          "bateau",
          M.beton,
          SOL.bordure,
          0.22,
          0.05,
          ca - cb,
          s * (demi + 0.11),
          0,
          (ca + cb) / 2,
          { ombre: false },
        );
    }

    // L'axe et les rives. Blanc CASSÉ et chaud, jamais #fff (bible §2).
    if (axe) {
      for (let z = zA; z > zB; z -= 6) {
        if (coupures.some(([a, b]) => z < a + 2 && z > b - 2)) continue;
        bande("marquage", M.marquage, SOL.marquage, 0.15, 3, 0, z, 0.014);
      }
      for (const s of [-1, 1])
        bande(
          "marquage",
          M.marquage,
          SOL.marquage,
          0.12,
          long,
          s * (demi - 2.35),
          milieu,
          0.014,
        );
    }
  }

  // ── LA RUE PRINCIPALE ────────────────────────────────────────────────
  const long = Z_DEBUT - Z_FIN;
  const milieu = (Z_DEBUT + Z_FIN) / 2;
  const coupuresDroite = CARREFOURS.filter((c) => c.cote > 0).map(
    coupureTrottoir,
  );
  const coupuresGauche = CARREFOURS.filter((c) => c.cote < 0).map(
    coupureTrottoir,
  );

  nappe(M.route, BORD * 2, long, 0, 0, milieu, TUILE_ROUTE);
  for (const voie of [-1.7, 1.7])
    for (const dx of [-0.75, 0.75])
      bande(
        "trace",
        M.trace,
        SOL.roulement,
        0.5,
        long,
        voie + dx,
        milieu,
        0.008,
      );

  for (const s of [-1, 1]) {
    const coupures = s > 0 ? coupuresDroite : coupuresGauche;
    bande(
      "caniveau",
      M.caniveau,
      SOL.caniveau,
      0.3,
      long,
      s * (BORD - 0.15),
      milieu,
      0.009,
    );
    for (const [a, b] of morceaux(Z_DEBUT, Z_FIN, coupures)) {
      const l = a - b;
      const m = (a + b) / 2;
      nappe(
        M.dalle,
        TROTTOIR,
        l,
        s * (BORD + TROTTOIR / 2),
        0.163,
        m,
        TUILE_DALLE,
      );
      bloc(
        "chant",
        M.beton,
        SOL.trottoir,
        TROTTOIR,
        0.16,
        l,
        s * (BORD + TROTTOIR / 2),
        0,
        m,
        {
          ombre: false,
        },
      );
      bloc(
        "bordure",
        M.beton,
        SOL.bordure,
        0.22,
        0.18,
        l,
        s * (BORD + 0.11),
        0,
        m,
        {
          ombre: false,
        },
      );
      bande(
        "bordureHaut",
        M.marquage,
        SOL.bordureHaut,
        0.24,
        l,
        s * (BORD + 0.11),
        m,
        0.181,
      );
    }
    for (const [ca, cb] of coupures)
      bloc(
        "bateau",
        M.beton,
        SOL.bordure,
        0.22,
        0.05,
        ca - cb,
        s * (BORD + 0.11),
        0,
        (ca + cb) / 2,
        {
          ombre: false,
        },
      );
    // La terre derrière les trottoirs, pour que l'horizon ne soit pas un vide.
    bloc("terre", M.beton, SOL.terre, 60, 0.02, long, s * 37, 0, milieu, {
      ombre: false,
    });
  }

  for (let z = Z_DEBUT; z > Z_FIN; z -= 6)
    bande("marquage", M.marquage, SOL.marquage, 0.15, 3, 0, z, 0.014);
  for (const s of [-1, 1])
    bande(
      "marquage",
      M.marquage,
      SOL.marquage,
      0.12,
      long,
      s * 3.35,
      milieu,
      0.014,
    );

  // Les passages piétons : un par zone d'événement piéton. Ils ANNONCENT la
  // possibilité d'un piéton, donc c'est de la pédagogie déguisée en décor.
  for (const [a, b] of trous.slice(2, 5)) {
    const z0 = (a + b) / 2 - 16;
    for (let i = -4; i <= 4; i++)
      bande("passage", M.marquage, SOL.marquage, 0.5, 3.6, i * 0.95, z0, 0.014);
  }

  // Les plaques d'égout, tous les vingt-cinq mètres environ.
  for (let z = Z_DEBUT - 12; z > Z_FIN; z -= 25 + r() * 14) {
    const s = r() < 0.5 ? -1 : 1;
    const p = banc.neuf();
    p.position.set(s * (BORD - 0.9), 0.013, z);
    p.rotation.x = -Math.PI / 2;
    p.scale.set(0.66, 0.66, 1);
    banc.poser(
      "egout",
      new THREE.CircleGeometry(0.5, 14),
      M.caniveau,
      assombrir(SOL.bitume, 0.16),
      { ombre: false },
    );
  }

  // ── LE BÂTI ──────────────────────────────────────────────────────────
  const X_FACADE = BORD + TROTTOIR;
  for (const s of [-1, 1])
    rangee(THREE, banc, {
      cote: s,
      zDebut: Z_DEBUT,
      zFin: Z_FIN,
      alea: r,
      xFacade: s * X_FACADE,
      vides: CARREFOURS.filter((c) => c.cote === s).map(coupureBati),
    });

  // ── LA RUE TRANSVERSALE ──────────────────────────────────────────────
  for (const c of CARREFOURS) {
    const repere = new THREE.Matrix4()
      .makeRotationY(c.cote > 0 ? -Math.PI / 2 : Math.PI / 2)
      .setPosition(c.cote * BORD, 0, c.z);
    sousRepere(repere, () => {
      const demi = c.largeur / 2;
      poserChaussee(0, -c.longueur, demi, { axe: false });
      // Une ligne d'effet de « cédez le passage » à la bouche : c'est elle
      // qui dit que la voiture qui hésite DOIT attendre, et qui rend son
      // hésitation lisible comme une intention plutôt qu'un bug.
      bande(
        "marquage",
        M.marquage,
        SOL.marquage,
        demi * 2,
        0.3,
        0,
        -1.2,
        0.015,
      );
      const xf = demi + TROTTOIR;
      for (const s of [-1, 1])
        rangee(THREE, banc, {
          cote: s,
          zDebut: -1.5,
          zFin: -c.longueur,
          alea: r,
          xFacade: s * xf,
          vides: [],
        });
      // Quelques voitures garées dans la transversale : c'est ce qui empêche
      // de la lire comme une allée de décor.
      for (let z = -8; z > -c.longueur + 6; z -= 6.5 + r() * 3) {
        if (r() < 0.35) continue;
        const s = r() < 0.5 ? -1 : 1;
        vehiculeAuBanc(
          THREE,
          bancVehicules,
          piocher(FLOTTE, r),
          piocher(VEHICULES_NEUTRES, r),
          {
            x: s * (demi - 1.1),
            z,
            cap: s > 0 ? Math.PI / 2 : -Math.PI / 2,
            alea: r,
          },
        );
      }
      poserMobilier(THREE, banc, "lampadaire", {
        x: demi + 0.8,
        z: -12,
        versRue: -1,
      });
      poserMobilier(THREE, banc, "lampadaire", {
        x: -demi - 0.8,
        z: -26,
        versRue: 1,
      });
      for (const z of [-9, -22, -33])
        poserMobilier(THREE, banc, "arbre", {
          x: -demi - 1.5,
          z,
          echelle: 0.9,
          soleil: { x: -0.6, y: 0.7, z: 0.35 },
        });
    });
  }

  // ── LE FOND DE RUE ───────────────────────────────────────────────────
  // ⚠️ La chaussée transversale est posée QUATRE MILLIMÈTRES sous la
  // principale : elles se chevauchent d'un demi-mètre, et deux plans
  // exactement coplanaires clignotent. Personne ne verra la marche.
  {
    const repere = new THREE.Matrix4()
      .makeRotationY(-Math.PI / 2)
      .setPosition(0, 0, FOND.z);
    const demi = FOND.largeur / 2;
    sousRepere(repere, () => {
      poserChaussee(30, -30, demi, { axe: false, y: -0.004 });
      // Le mur d'en face : une rangée entière, façades tournées vers le
      // joueur. C'est elle qui remplace le vide.
      rangee(THREE, banc, {
        cote: -1,
        zDebut: 30,
        zFin: -30,
        alea: r,
        xFacade: -(demi + TROTTOIR),
        vides: [],
      });
      for (const z of [16, -14])
        poserMobilier(THREE, banc, "arbre", {
          x: -demi - 1.5,
          z,
          echelle: 0.9,
          soleil: { x: -0.6, y: 0.7, z: 0.35 },
        });
    });
  }

  // ── ARBRES ET MOBILIER ───────────────────────────────────────────────
  // ⚠️ Rien de tout ceci ne se pose près d'une scène : un potelet devant
  // l'enfant ou un abribus devant la voiture qui hésite rend une leçon
  // injouable. Même règle de trous que le stationnement, marge de 12 m.
  const SOLEIL = new THREE.Vector3(-28, 34, 16).normalize();
  // 🔴 LA MARGE NE VAUT QUE DU CÔTÉ OÙ SE JOUE LA SCÈNE. Toutes nos scènes
  // sauf une vivent sur le trottoir de DROITE ; appliquer les trous aux deux
  // côtés vidait cinquante mètres de trottoir gauche pour protéger une
  // voiture située à droite, et la rue devenait un désert au moment précis où
  // le joueur doit regarder loin.
  const CONCERNE_LA_GAUCHE = trous.length - 1;
  const horsCarrefour = (z) =>
    CARREFOURS.every((c) => {
      const [a, b] = coupureBati(c);
      return z > a + 1 || z < b - 1;
    });
  const loinDeToutEvenement = (z, cote) =>
    horsCarrefour(z) &&
    trous.every(([a, b], i) => {
      if (cote < 0 && i !== CONCERNE_LA_GAUCHE) return true;
      return z > b + 12 || z < a - 12;
    });

  for (let z = Z_DEBUT - 8; z > Z_FIN; z -= 19) {
    for (const s of [-1, 1]) {
      if (r() < 0.2) continue;
      const zz = z + s * 4;
      if (!loinDeToutEvenement(zz, s)) continue;
      poserMobilier(THREE, banc, "arbre", {
        x: s * (BORD + 1.5),
        z: zz,
        echelle: 0.85 + r() * 0.35,
        soleil: SOLEIL,
      });
    }
  }

  for (let z = Z_DEBUT - 16; z > Z_FIN; z -= 26 + r() * 8) {
    const s = r() < 0.5 ? -1 : 1;
    if (!loinDeToutEvenement(z, s)) continue;
    poserMobilier(THREE, banc, "lampadaire", {
      x: s * (BORD + 0.75),
      z,
      versRue: -s,
    });
  }

  for (let z = Z_DEBUT - 22; z > Z_FIN; z -= 15 + r() * 16) {
    const s = r() < 0.5 ? -1 : 1;
    if (!loinDeToutEvenement(z, s)) continue;
    const d = r();
    if (d < 0.3)
      poserMobilier(THREE, banc, "banc", {
        x: s * (BORD + 1.9),
        z,
        versRue: -s,
      });
    else if (d < 0.55)
      poserMobilier(THREE, banc, "corbeille", { x: s * (BORD + 0.9), z });
    else if (d < 0.68)
      poserMobilier(THREE, banc, "abribus", {
        x: s * (BORD + 2.0),
        z,
        versRue: -s,
      });
    else
      for (let k = 0; k < 4; k++)
        poserMobilier(THREE, banc, "potelet", {
          x: s * (BORD + 0.62),
          z: z + k * 1.6,
        });
  }

  // ── LES VOITURES EN STATIONNEMENT ────────────────────────────────────
  // Elles sont l'essentiel de l'occlusion et du bruit visuel, donc leur
  // densité est le vrai réglage de difficulté.
  // ⚠️ `trous` : les mètres réservés aux événements. Sans eux, une voiture
  // décorative se garerait exactement là où un enfant doit surgir. Et un trou
  // protège un CÔNE de vue, pas une ligne (leçon du 10/08, cf. scenario.js).
  const libre = (z) =>
    horsCarrefour(z) && trous.every(([a, b]) => z > b + 3 || z < a - 3);
  const taches = new THREE.Group();
  for (const s of [1, -1]) {
    let z = Z_DEBUT - 6;
    while (z > Z_FIN + 10) {
      const type = piocher(FLOTTE, r);
      const G = GABARITS[type];
      // 🔴 L'ESPACEMENT SE CALCULE SUR LA LONGUEUR RÉELLE, pas sur un pas
      // fixe. Un pas de 6,4 m laissait 1,2 m derrière un utilitaire de 5,2 m
      // et 2,7 m derrière une citadine : la file était irrégulière sans
      // raison, et par endroits les voitures se touchaient presque. C'est ça
      // que Rayan a vu comme « garées bizarrement » sur le trottoir de
      // gauche, là où la densité est la plus forte.
      const creneau = G.l + 1.5 + r() * 1.6;
      // 🔴 LES DEUX BOUTS, PAS SEULEMENT LE DÉBUT DE LA PLACE. On ne
      // vérifiait que `z`, alors que la voiture occupe `z` à `z − longueur` :
      // un utilitaire de 5,2 m dont la place commençait juste en dehors d'un
      // trou débordait de deux mètres DEDANS, et venait se planter en plein
      // dans la ligne de vue de la portière. Sur l'image, un pavé sombre
      // occupait le tiers du cadre au moment exact où le jeu dit « regarde la
      // voiture garée sur ta droite ».
      if (r() > (s > 0 ? 0.18 : 0.42) && libre(z) && libre(z - G.l)) {
        // ⭐ Chaque voiture se range à VINGT-CINQ CENTIMÈTRES DE LA BORDURE,
        // et pas toutes sur le même axe : un utilitaire de deux mètres de
        // large et une citadine d'1,75 m centrés au même endroit ne
        // s'alignent ni côté trottoir ni côté route. C'est le flanc côté
        // chaussée qui doit s'aligner, c'est le seul que l'on voie.
        const x = s * (BORD - 0.25 - G.larg / 2);
        vehiculeAuBanc(
          THREE,
          bancVehicules,
          type,
          piocher(VEHICULES_NEUTRES, r),
          { x, z: z - G.l / 2, cap: s > 0 ? 0 : Math.PI, alea: r },
        );
        // 🔴 PLUS DE TACHE DE CONTACT SOUS LES VOITURES GARÉES. Elles
        // dataient d'avant les instances, quand la flotte ne portait pas
        // d'ombre portée : c'était une ombre PEINTE, un mesh par voiture,
        // cinquante ordres de dessin pour un effet que le soleil calcule
        // maintenant tout seul. Les véhicules de scène, eux, la gardent : ils
        // bougent et leur ombre douce aide à les poser.
      }
      z -= creneau;
    }
  }

  // ⭐ Les passants d'ambiance. Ils ne sont JAMAIS un danger, et c'est leur
  // rôle : sans eux, la seule chose qui bouge est l'événement, on le trouve
  // par élimination et il n'y a plus de jeu.
  const passants = [];
  const mobiles = new THREE.Group();
  // ⚠️ 26 m de marge : un passant fait des allers-retours de sept mètres, donc
  // la marge doit couvrir sa PROMENADE, pas sa position de départ.
  const loinDesScenes = (z) =>
    trous.every(([a, b]) => z > b + 26 || z < a - 26);
  for (let i = 0; i < 9; i++) {
    const s = r() < 0.62 ? 1 : -1;
    let z = 0;
    for (let essai = 0; essai < 40; essai++) {
      z = Z_DEBUT - 25 - r() * (long - 45);
      if (loinDesScenes(z) && horsCarrefour(z)) break;
    }
    if (!loinDesScenes(z)) continue;
    const p = personnage(THREE, { alea: r });
    const grp = new THREE.Group();
    grp.add(p);
    grp.position.y = 0.16;
    p.userData.sol = 0;
    mobiles.add(grp);
    passants.push({
      objet: grp,
      x: s * (BORD + 0.9 + r() * 1.7),
      z,
      sens: r() < 0.5 ? 1 : -1,
      vitesse: 0.9 + r() * 0.6,
      corps: p,
    });
  }

  const groupe = new THREE.Group();
  const decor = banc.finir();
  const parc = bancVehicules.finir();
  groupe.add(nappes, decor, parc, taches, mobiles);

  // Une fonction pure du temps : les passants avancent, font demi-tour tous
  // les sept mètres, et rien de plus. Aucune IA, aucun coût.
  function animer(t) {
    for (const p of passants) {
      const va = Math.sin((t * p.vitesse) / 9 + p.z) > 0 ? 1 : -1;
      const dz = Math.sin((t * p.vitesse) / 9 + p.z) * 7;
      p.objet.position.set(p.x, 0.16, p.z + dz);
      p.objet.rotation.y = va * p.sens > 0 ? Math.PI : 0;
      p.corps.userData.pas(t * p.vitesse, 1);
    }
  }

  // Ce qu'on a le droit de toucher sans que ce soit le ciel : les voitures
  // garées et les passants. Sans eux, « ce qui répond au doigt » trahirait où
  // sont les événements et le jeu se résoudrait en tapant partout.
  const cibles = [...parc.children, ...mobiles.children];

  return { groupe, cibles, animer };
}
