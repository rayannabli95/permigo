// La rue. Une seule, droite, en plein jour, et longue de 400 mètres.
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
// Repère : X = est, Z = sud, on roule vers -Z. La voie du joueur est x = +1,7.

const BITUME = 0x74767c;
const TROTTOIR = 0xa3a09a;
const BORDURE = 0xc4c0b8;
const MARQUAGE = 0xf4f2ec;
const FACADES = [0xc9b79c, 0xb08d78, 0xd4cdbf, 0x9d8f80, 0xc2a98d, 0xa89b8c];

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

  const long = Z_DEBUT - Z_FIN;
  const milieu = (Z_DEBUT + Z_FIN) / 2;

  // La chaussée, les trottoirs, les bordures.
  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry(BORD * 2, long),
    mat(BITUME, 0.98),
  );
  sol.rotation.x = -Math.PI / 2;
  sol.position.set(0, 0, milieu);
  sol.receiveShadow = true;
  g.add(sol);

  for (const s of [-1, 1]) {
    bloc(2.8, 0.15, long, TROTTOIR, s * (BORD + 1.4), 0, milieu, 0.97);
    bloc(0.22, 0.17, long, BORDURE, s * (BORD + 0.11), 0, milieu, 0.9);
    // La terre derrière les trottoirs, pour que l'horizon ne soit pas un vide.
    bloc(60, 0.02, long, 0x8e8b84, s * 37, 0, milieu, 1);
  }

  // L'axe central, en pointillés. Trois mètres de trait, trois de vide.
  for (let z = Z_DEBUT; z > Z_FIN; z -= 6) {
    const t = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 3),
      mat(MARQUAGE, 1),
    );
    t.rotation.x = -Math.PI / 2;
    t.position.set(0, 0.012, z);
    g.add(t);
  }
  // Et les deux lignes de rive, continues : elles donnent la fuite.
  for (const s of [-1, 1]) {
    const l = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, long),
      mat(MARQUAGE, 1),
    );
    l.rotation.x = -Math.PI / 2;
    l.position.set(s * 3.35, 0.012, milieu);
    g.add(l);
  }

  // Les façades. Des volumes simples avec des rangées de fenêtres : en plein
  // jour c'est plus lisible qu'un modèle détaillé, et ça ne coûte rien.
  const vitre = new THREE.MeshStandardMaterial({
    color: 0x6f8aa0,
    roughness: 0.28,
    metalness: 0.1,
  });
  for (const s of [-1, 1]) {
    for (let z = Z_DEBUT; z > Z_FIN; z -= 13 + r() * 5) {
      const larg = 9 + r() * 5;
      const prof = 11;
      const etages = 2 + Math.floor(r() * 3);
      const h = 3.1 * etages;
      const x = s * (BORD + 2.8 + prof / 2 + 0.6);
      bloc(
        prof,
        h,
        larg,
        FACADES[Math.floor(r() * FACADES.length)],
        x,
        0,
        z,
        0.95,
      );
      // Deux rangées de fenêtres sur la face qui donne sur la rue.
      for (let e = 0; e < etages; e++)
        for (let k = -1; k <= 1; k++) {
          const f = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), vitre);
          f.position.set(
            x - s * (prof / 2 + 0.02),
            1.6 + e * 3.1,
            z + k * (larg / 3.4),
          );
          f.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
          g.add(f);
        }
    }
  }

  // Les arbres et les lampadaires, sur les trottoirs.
  const arbre = modeles?.arbre;
  for (let z = Z_DEBUT - 8; z > Z_FIN; z -= 19) {
    for (const s of [-1, 1]) {
      if (r() < 0.35) continue;
      if (arbre) {
        const a = arbre.clone(true);
        a.position.set(s * (BORD + 1.5), 0.15, z + s * 4);
        a.scale.multiplyScalar(0.8 + r() * 0.3);
        a.traverse((o) => (o.castShadow = true));
        g.add(a);
      } else {
        bloc(0.3, 4.4, 0.3, 0x6b5a45, s * (BORD + 1.5), 0.15, z + s * 4);
      }
    }
  }

  // Les voitures en stationnement. Elles sont l'essentiel de l'occlusion et
  // du bruit visuel, donc leur densité est le vrai réglage de difficulté.
  // ⚠️ `trous` : les mètres réservés aux événements. Sans eux, une voiture
  // décorative se garerait exactement là où un enfant doit surgir.
  const gares = [];
  const libre = (z) => trous.every(([a, b]) => z > b + 3 || z < a - 3);
  const teintes = ["gris", "blanc", "bleu", "rouge", "jaune"];
  for (const s of [1, -1]) {
    for (let z = Z_DEBUT - 6; z > Z_FIN + 10; z -= 6.4 + r() * 2.6) {
      if (r() < (s > 0 ? 0.18 : 0.42)) continue; // des places vides
      if (s > 0 && !libre(z)) continue;
      // ⚠️ Les modèles 3D sont texturés pour la DA de NUIT : en plein jour ils
      // rendent tous le même bleu marine, et une file de voitures garées
      // devient un mur sombre illisible. Les primitives du kit, elles,
      // prennent une vraie peinture. Ici la lisibilité passe avant le détail.
      const m = kit.vehicule(
        "voiture",
        teintes[Math.floor(r() * teintes.length)],
      );
      m.position.set(s * X_STATIONNE, 0, z);
      m.rotation.y = s > 0 ? 0 : Math.PI;
      m.traverse((o) => (o.castShadow = true));
      g.add(m);
      const t = kit.tache(1.9, 4.3, 0.42);
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
  // pas empêcher de lire la compétence. Et surtout : aucun passant dans les
  // mètres réservés à un événement, marge de vingt mètres. Un badaud qui
  // marche à côté de l'enfant au moment où l'enfant est le sujet de la scène
  // détruit la scène.
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
    const p =
      (modelePieton && modelePieton.clone(true)) ||
      kit.vehicule("pieton", "bleu");
    p.traverse((o) => (o.castShadow = true));
    const grp = new THREE.Group();
    grp.add(p);
    grp.position.y = 0.15;
    g.add(grp);
    passants.push({
      objet: grp,
      x: s * (BORD + 0.9 + r() * 1.7),
      z,
      sens: r() < 0.5 ? 1 : -1,
      vitesse: 0.9 + r() * 0.6,
      bord: s,
    });
  }

  // Une fonction pure du temps : les passants avancent, font demi-tour tous
  // les vingt mètres, et rien de plus. Aucune IA, aucun coût.
  function animer(t) {
    for (const p of passants) {
      const va = Math.sin((t * p.vitesse) / 9 + p.z) > 0 ? 1 : -1;
      const dz = Math.sin((t * p.vitesse) / 9 + p.z) * 7;
      p.objet.position.set(p.x, 0.15, p.z + dz);
      p.objet.rotation.y = va * p.sens > 0 ? Math.PI : 0;
    }
  }

  return { groupe: g, gares, animer };
}
