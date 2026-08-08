// Le kit modulaire : les pièces avec lesquelles on monte un environnement.
// Tout est en primitives, à plat, sans texture ni fichier à charger. La DA
// est celle de PermiGo — crépuscule violet, formes franches, couleurs tenues,
// pas de photoréalisme.
//
// ⚠️ Une pièce ne se dessine JAMAIS à l'œil : une voie fait 3,20 m, un
// trottoir 15 cm de haut, un panneau 2,10 m sous le disque. Les scénarios
// mesurent des distances, elles doivent vouloir dire quelque chose.

export const VOIE = 3.2; // largeur d'une voie, en mètres
export const TROTTOIR = 2.4;
export const HAUT_TROTTOIR = 0.16;

export const COULEURS = {
  bitume: 0x2b2745,
  bitumeUse: 0x322d4f,
  trottoir: 0x4a4468,
  bordure: 0x60578a,
  marquage: 0xf2e6cf,
  sol: 0x1d1938,
  toit: 0x322a55,
  vitre: 0xffcf94,
};

const FACADES = [0x6d5f9e, 0x8a6f97, 0x55639b, 0x9a7b86, 0x5f5288, 0x7d6a99];

export const PEINTURE = {
  violet: 0x7c5cff,
  gris: 0x8d97a0,
  rouge: 0x973a35,
  bleu: 0x36618f,
  blanc: 0xd6d2e8,
  jaune: 0xc9a752,
};

export function creerKit(THREE) {
  const cache = new Map();
  const mat = (couleur, opts = {}) => {
    const cle = couleur + JSON.stringify(opts);
    if (!cache.has(cle))
      cache.set(
        cle,
        new THREE.MeshLambertMaterial({ color: couleur, ...opts }),
      );
    return cache.get(cle);
  };
  const CUBE = new THREE.BoxGeometry(1, 1, 1);
  const PLAN = new THREE.PlaneGeometry(1, 1);

  // Une dalle horizontale. `y` sert à empiler sans que ça clignote
  // (deux plans exactement coplanaires se battent en profondeur).
  function dalle(l, p, couleur, x = 0, z = 0, y = 0.01) {
    const m = new THREE.Mesh(PLAN, mat(couleur));
    m.rotation.x = -Math.PI / 2;
    m.scale.set(l, p, 1);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    return m;
  }

  function bloc(l, h, p, couleur, x = 0, y = 0, z = 0, opts) {
    const m = new THREE.Mesh(CUBE, mat(couleur, opts));
    m.scale.set(l, h, p);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Bande de rive ou ligne d'axe. `pas`/`trou` en mètres : 0 = ligne continue.
  function ligne(
    g,
    {
      x = 0,
      z = 0,
      longueur = 40,
      largeur = 0.14,
      pas = 3,
      trou = 3.5,
      selonZ = true,
    },
  ) {
    if (!pas) {
      g.add(
        dalle(
          selonZ ? largeur : longueur,
          selonZ ? longueur : largeur,
          COULEURS.marquage,
          x,
          z,
          0.02,
        ),
      );
      return;
    }
    const n = Math.floor(longueur / (pas + trou));
    const d0 = -longueur / 2 + pas / 2;
    for (let i = 0; i <= n; i++) {
      const d = d0 + i * (pas + trou);
      g.add(
        selonZ
          ? dalle(largeur, pas, COULEURS.marquage, x, z + d, 0.02)
          : dalle(pas, largeur, COULEURS.marquage, x + d, z, 0.02),
      );
    }
  }

  // Passage piéton : des bandes de 50 cm tous les 50 cm, sur la largeur.
  function passage(g, { x = 0, z = 0, largeur = 2 * VOIE, selonZ = true }) {
    const n = Math.floor(largeur / 1);
    for (let i = 0; i < n; i++) {
      const d = -largeur / 2 + 0.5 + i * 1;
      g.add(
        selonZ
          ? dalle(0.5, 2.6, COULEURS.marquage, x + d, z, 0.02)
          : dalle(2.6, 0.5, COULEURS.marquage, x, z + d, 0.02),
      );
    }
  }

  function trottoir(g, { x, z, l, p }) {
    g.add(bloc(l, HAUT_TROTTOIR, p, COULEURS.trottoir, x, 0, z));
  }

  function lampadaire(x, z, versX = 1) {
    const g = new THREE.Group();
    g.add(bloc(0.16, 6.2, 0.16, COULEURS.bordure, 0, 0, 0));
    g.add(bloc(1.7, 0.14, 0.14, COULEURS.bordure, versX * 0.85, 6.1, 0));
    const tete = new THREE.Mesh(
      CUBE,
      new THREE.MeshBasicMaterial({ color: 0xffd9a0 }),
    );
    tete.scale.set(0.7, 0.12, 0.34);
    tete.position.set(versX * 1.6, 6.05, 0);
    g.add(tete);
    g.position.set(x, 0, z);
    return g;
  }

  function arbre(x, z, echelle = 1) {
    const g = new THREE.Group();
    g.add(bloc(0.34, 2.2, 0.34, 0x3d3160, 0, 0, 0));
    const f = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 0),
      mat(0x3f6a5c, { flatShading: true }),
    );
    f.position.y = 3.3;
    f.castShadow = true;
    g.add(f);
    const f2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05, 0),
      mat(0x4b7a66, { flatShading: true }),
    );
    f2.position.set(0.35, 4.4, -0.2);
    f2.castShadow = true;
    g.add(f2);
    g.scale.setScalar(echelle);
    g.position.set(x, 0, z);
    return g;
  }

  // Un immeuble de banlieue : un corps, un toit plus sombre, des fenêtres
  // allumées. Les fenêtres sont ce qui donne l'échelle, pas la hauteur.
  function batiment(x, z, l = 9, p = 9, etages = 3, teinte = 0) {
    const g = new THREE.Group();
    const h = 2.9 * etages;
    const couleur = FACADES[teinte % FACADES.length];
    g.add(bloc(l, h, p, couleur, 0, 0, 0));
    g.add(bloc(l + 0.5, 0.45, p + 0.5, COULEURS.toit, 0, h, 0));
    const vitre = new THREE.MeshBasicMaterial({ color: COULEURS.vitre });
    for (let e = 0; e < etages; e++) {
      const cols = Math.max(2, Math.floor(l / 2.6));
      for (let c = 0; c < cols; c++) {
        if ((e * 7 + c * 3) % 4 === 0) continue; // toutes ne sont pas allumées
        const fx = -l / 2 + (l / cols) * (c + 0.5);
        for (const [dz, ry] of [
          [p / 2 + 0.03, 0],
          [-p / 2 - 0.03, Math.PI],
        ]) {
          const f = new THREE.Mesh(PLAN, vitre);
          f.scale.set(1.05, 1.25, 1);
          f.position.set(fx, 1.5 + e * 2.9, dz);
          f.rotation.y = ry;
          g.add(f);
        }
      }
    }
    g.position.set(x, 0, z);
    return g;
  }

  // Panneaux français. Le disque et le triangle sont posés à 2,10 m,
  // c'est la hauteur réglementaire en agglomération.
  function panneau(type, x, z, capVers = 0) {
    const g = new THREE.Group();
    g.add(bloc(0.09, 2.4, 0.09, 0x9a94b8, 0, 0, 0));
    const face = new THREE.Group();
    face.position.y = 2.75;
    const plat = (geo, couleur) => {
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ color: couleur, side: THREE.DoubleSide }),
      );
      return m;
    };
    if (type === "stop") {
      const oct = plat(new THREE.CircleGeometry(0.5, 8), 0xc0392b);
      oct.rotation.z = Math.PI / 8;
      face.add(oct);
      const barre = plat(new THREE.PlaneGeometry(0.62, 0.13), 0xffffff);
      barre.position.z = 0.01;
      face.add(barre);
    } else if (type === "cede") {
      const tri = plat(new THREE.CircleGeometry(0.58, 3), 0xffffff);
      tri.rotation.z = Math.PI / 6 + Math.PI; // pointe en bas
      face.add(tri);
      const bord = plat(new THREE.RingGeometry(0.46, 0.58, 3), 0xc0392b);
      bord.rotation.z = Math.PI / 6 + Math.PI;
      bord.position.z = 0.01;
      face.add(bord);
    } else if (type === "prio") {
      const los = plat(new THREE.CircleGeometry(0.42, 4), 0xf1c40f);
      face.add(los);
      const b = plat(new THREE.RingGeometry(0.33, 0.42, 4), 0xffffff);
      b.position.z = 0.01;
      face.add(b);
    } else if (type === "giratoire") {
      const d = plat(new THREE.CircleGeometry(0.45, 24), 0x2c5fa8);
      face.add(d);
    }
    g.add(face);
    g.position.set(x, 0, z);
    g.rotation.y = capVers;
    return g;
  }

  function feu(x, z, capVers = 0) {
    const g = new THREE.Group();
    g.add(bloc(0.14, 3.1, 0.14, 0x35304f, 0, 0, 0));
    g.add(bloc(0.42, 1.15, 0.28, 0x35304f, 0, 2.5, 0));
    const lampes = {};
    ["rouge", "orange", "vert"].forEach((c, i) => {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(0.13, 16),
        new THREE.MeshBasicMaterial({ color: 0x1a1730 }),
      );
      m.position.set(0, 3.32 - i * 0.32, 0.15);
      lampes[c] = m;
      g.add(m);
    });
    g.position.set(x, 0, z);
    g.rotation.y = capVers;
    g.userData.lampes = lampes;
    g.userData.mettre = (etat) => {
      const on = { rouge: 0xe0483c, orange: 0xe8a33a, vert: 0x4bc47a };
      for (const c of ["rouge", "orange", "vert"])
        lampes[c].material = new THREE.MeshBasicMaterial({
          color: c === etat ? on[c] : 0x1a1730,
        });
    };
    return g;
  }

  // ── Véhicules ────────────────────────────────────────────────────────
  // Un corps, un pavillon vitré, quatre roues, des feux. Assez pour lire
  // d'un coup d'œil le sens dans lequel il roule — c'est tout ce qu'on
  // demande à une voiture dans une situation pédagogique.
  function vehicule(type = "voiture", couleur = "gris") {
    const g = new THREE.Group();
    const c = PEINTURE[couleur] ?? PEINTURE.gris;
    if (type === "pieton") {
      g.add(bloc(0.42, 0.9, 0.28, c, 0, 0.72, 0));
      g.add(bloc(0.2, 0.62, 0.2, 0xe8c9a8, 0, 1.6, 0));
      g.add(bloc(0.18, 0.72, 0.18, 0x35304f, -0.1, 0, 0));
      g.add(bloc(0.18, 0.72, 0.18, 0x35304f, 0.1, 0, 0));
      return g;
    }
    if (type === "velo") {
      g.add(bloc(0.1, 0.55, 1.5, 0x35304f, 0, 0.35, 0));
      g.add(bloc(0.34, 0.75, 0.24, c, 0, 0.9, 0.05));
      g.add(bloc(0.18, 0.5, 0.18, 0xe8c9a8, 0, 1.62, 0.05));
      for (const dz of [0.6, -0.6])
        g.add(bloc(0.06, 0.68, 0.68, 0x1d1a30, 0, 0, dz));
      return g;
    }
    const gab =
      type === "camion"
        ? { l: 2.45, h: 1.4, p: 8.6, toit: 2.4 }
        : type === "bus"
          ? { l: 2.5, h: 2.5, p: 10.5, toit: 0 }
          : { l: 1.85, h: 0.78, p: 4.2, toit: 1.25 };

    g.add(bloc(gab.l, gab.h, gab.p, c, 0, 0.34, 0));
    if (gab.toit) {
      const vitres = mat(0x3f4c70);
      const t = new THREE.Mesh(CUBE, vitres);
      const th = gab.toit - gab.h - 0.34;
      t.scale.set(gab.l * 0.88, th, gab.p * (type === "camion" ? 0.3 : 0.52));
      t.position.set(
        0,
        0.34 + gab.h + th / 2,
        type === "camion" ? gab.p * 0.3 : -0.1,
      );
      t.castShadow = true;
      g.add(t);
    }
    // Roues : elles ancrent la voiture au sol, sans elles elle flotte.
    const roue = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12);
    const noir = mat(0x16142a);
    const ez = gab.p / 2 - 0.85;
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const r = new THREE.Mesh(roue, noir);
        r.rotation.z = Math.PI / 2;
        r.position.set((sx * gab.l) / 2, 0.34, sz * ez);
        g.add(r);
      }
    // Avant = -Z (comme tout le reste du moteur) : phares devant, stops
    // derrière. C'est ce qui dit à l'élève « il vient vers moi ».
    const phare = new THREE.MeshBasicMaterial({ color: 0xfff0cf });
    const stop = new THREE.MeshBasicMaterial({ color: 0xd94a3f });
    for (const sx of [-1, 1]) {
      const av = new THREE.Mesh(CUBE, phare);
      av.scale.set(0.34, 0.16, 0.06);
      av.position.set((sx * gab.l) / 2.9, 0.72, -gab.p / 2 - 0.02);
      g.add(av);
      const ar = new THREE.Mesh(CUBE, stop);
      ar.scale.set(0.3, 0.14, 0.06);
      ar.position.set((sx * gab.l) / 2.9, 0.78, gab.p / 2 + 0.02);
      g.add(ar);
    }
    return g;
  }

  // Le poste de conduite, vu de la place du conducteur. En vue cockpit on
  // n'affiche PAS la carrosserie : la caméra est à 1,21 m, elle serait à
  // l'intérieur du bloc et l'écran devient un aplat violet. Tous les jeux de
  // conduite dessinent un intérieur dédié, on fait pareil.
  // ⚠️ Le volant tourne avec le braquage RÉEL du véhicule, ce n'est pas une
  // animation posée par-dessus.
  function poste(couleur = "violet") {
    const g = new THREE.Group();
    const c = PEINTURE[couleur] ?? PEINTURE.violet;
    const sombre = 0x1b1733;

    // ⚠️ Les hauteurs sont celles d'une vraie voiture, et elles ne se règlent
    // pas à l'œil : l'œil du conducteur est à 1,21 m (cf. camera-rig), le
    // capot à 0,89 m, le haut de la planche de bord à 0,78 m. Poser la
    // planche 30 cm trop haut suffit à noircir la moitié de l'écran.
    // Le capot est peint plus SOMBRE que la carrosserie : à plat sous le ciel
    // il reçoit toute la lumière, et un aplat violet vif devient la chose la
    // plus brillante de l'écran. C'est de la carrosserie, pas un projecteur.
    const capot = c === PEINTURE.violet ? 0x2c2166 : c;
    g.add(bloc(1.86, 0.06, 1.7, capot, 0, 0.83, -1.55));
    g.add(bloc(1.9, 0.08, 0.12, 0x141129, 0, 0.85, -2.38)); // arête avant
    // Deux nervures et la grille de pare-brise. Sans elles, le tiers bas de
    // l'écran est un aplat sans échelle, et on ne sent plus qu'on avance.
    for (const sx of [-1, 1])
      g.add(bloc(0.07, 0.025, 1.5, 0x3d2f7d, sx * 0.6, 0.888, -1.6));
    g.add(bloc(1.84, 0.05, 0.22, 0x181432, 0, 0.86, -0.82));

    // Planche de bord et sa casquette.
    g.add(bloc(1.86, 0.26, 0.44, sombre, 0, 0.52, -0.66));
    g.add(bloc(1.86, 0.05, 0.22, 0x2a2448, 0, 0.78, -0.78));

    // Montants de pare-brise : ils cadrent la vue, et ils masquent. C'est
    // exactement ce qu'un élève doit apprendre à contourner du regard.
    for (const sx of [-1, 1]) {
      const m = bloc(0.09, 1.5, 0.11, sombre, sx * 0.9, 0.76, -0.86);
      m.rotation.x = -0.3;
      g.add(m);
    }
    // Pas de traverse de pare-brise ni de rétroviseur intérieur : l'œil est
    // à 1,45 m, ils viendraient couper le haut de l'image.

    const volant = new THREE.Group();
    volant.add(
      new THREE.Mesh(
        new THREE.TorusGeometry(0.19, 0.024, 8, 22),
        mat(0x0f0d20),
      ),
    );
    for (const a of [Math.PI, Math.PI / 3, (2 * Math.PI) / 3]) {
      const r = new THREE.Mesh(CUBE, mat(0x181433));
      r.scale.set(0.17, 0.028, 0.028);
      r.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0);
      r.rotation.z = a;
      volant.add(r);
    }
    volant.position.set(-0.36, 0.72, -0.52);
    volant.rotation.x = -0.42; // incliné comme une vraie colonne de direction
    g.add(volant);
    g.userData.volant = volant;
    return g;
  }

  return {
    poste,
    mat,
    dalle,
    bloc,
    ligne,
    passage,
    trottoir,
    lampadaire,
    arbre,
    batiment,
    panneau,
    feu,
    vehicule,
    poste,
    CUBE,
    PLAN,
  };
}
