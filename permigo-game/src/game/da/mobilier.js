// LE MOBILIER URBAIN DE PERMIGO.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §5 (liseré), §3 (palette), §12 (budget).
//
// ⭐ POURQUOI CE FICHIER EXISTE : un trottoir vide n'est pas neutre, il est
// FAUX. Le cerveau sait qu'une rue de ville porte des lampadaires, des bancs,
// des potelets et des poubelles ; quand il ne les voit pas, il conclut « décor
// de démo » avant même d'avoir regardé les immeubles. Ces objets ne coûtent
// que quelques primitives chacun et ils font une part démesurée de la
// crédibilité.
//
// ⚠️ MAIS ILS NE DOIVENT JAMAIS SE TROUVER DANS UNE SCÈNE. Un potelet devant
// l'enfant, un abribus devant la voiture qui hésite, et une leçon devient
// injouable. Le placement respecte les mêmes trous que le stationnement.

import {
  MOBILIER,
  SOL,
  VEGETATION,
  lisere,
  assombrir,
  NUIT,
} from "./palette.js";

const cache = new Map();
const geoDe = (cle, f) => {
  if (!cache.has(cle)) cache.set(cle, f());
  return cache.get(cle);
};

// Même cache que pour les immeubles : le mobilier n'a qu'une poignée de
// matières, il ne doit pas en fabriquer une par objet posé.
const MATS = new Map();
const mat = (THREE, c, rug = 0.8, met = 0) => {
  const cle = `${c}|${rug}|${met}`;
  if (!MATS.has(cle))
    MATS.set(
      cle,
      new THREE.MeshStandardMaterial({
        color: c,
        roughness: rug,
        metalness: met,
        envMapIntensity: 0.45,
      }),
    );
  return MATS.get(cle);
};

// Un lampadaire : un mât, une crosse, une lanterne. Sa VALEUR pour nous n'est
// pas d'éclairer (on est en plein jour) mais de donner une verticale régulière
// qui rythme la fuite de la rue.
export function lampadaire(THREE, versRue = 1) {
  const g = new THREE.Group();
  const metal = mat(THREE, MOBILIER.metal, 0.55, 0.3);
  const mat0 = new THREE.Mesh(
    geoDe("lmat", () => new THREE.CylinderGeometry(0.07, 0.1, 4.6, 8)),
    metal,
  );
  mat0.position.y = 2.3;
  mat0.castShadow = true;
  g.add(mat0);
  const crosse = new THREE.Mesh(
    geoDe("lcrosse", () => new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6)),
    metal,
  );
  crosse.position.set(versRue * 0.5, 4.55, 0);
  crosse.rotation.z = Math.PI / 2 - versRue * 0.22;
  g.add(crosse);
  const lampe = new THREE.Mesh(
    geoDe("llampe", () => new THREE.BoxGeometry(0.5, 0.14, 0.28)),
    mat(THREE, lisere(MOBILIER.metal, 0.22), 0.4, 0.2),
  );
  lampe.position.set(versRue * 1.0, 4.44, 0);
  lampe.castShadow = true;
  g.add(lampe);
  return g;
}

// Un banc : deux piètements et deux planches. Le bois est la seule matière
// chaude du mobilier, et il tranche avec le métal.
export function banc(THREE) {
  const g = new THREE.Group();
  const bois = mat(THREE, MOBILIER.bois, 0.88);
  const metal = mat(THREE, MOBILIER.metal, 0.6, 0.3);
  for (const dz of [-0.72, 0.72]) {
    const p = new THREE.Mesh(
      geoDe("bpied", () => new THREE.BoxGeometry(0.5, 0.42, 0.08)),
      metal,
    );
    p.position.set(0, 0.21, dz);
    p.castShadow = true;
    g.add(p);
  }
  const assise = new THREE.Mesh(
    geoDe("bassise", () => new THREE.BoxGeometry(0.46, 0.07, 1.7)),
    bois,
  );
  assise.position.y = 0.45;
  assise.castShadow = true;
  g.add(assise);
  const dossier = new THREE.Mesh(
    geoDe("bdos", () => new THREE.BoxGeometry(0.07, 0.4, 1.7)),
    bois,
  );
  dossier.position.set(0.2, 0.68, 0);
  dossier.rotation.z = 0.12;
  dossier.castShadow = true;
  g.add(dossier);
  return g;
}

// Un potelet. Le plus petit objet du jeu, et celui qui dit le plus fort
// « ceci est un vrai trottoir ».
export function potelet(THREE) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    geoDe("pot", () => new THREE.CylinderGeometry(0.055, 0.07, 0.95, 8)),
    mat(THREE, MOBILIER.metal, 0.5, 0.35),
  );
  m.position.y = 0.48;
  m.castShadow = true;
  g.add(m);
  const tete = new THREE.Mesh(
    geoDe("pott", () => new THREE.SphereGeometry(0.06, 8, 6)),
    mat(THREE, lisere(MOBILIER.metal, 0.25), 0.4, 0.35),
  );
  tete.position.y = 0.96;
  g.add(tete);
  return g;
}

export function corbeille(THREE) {
  const g = new THREE.Group();
  const c = new THREE.Mesh(
    geoDe("corb", () => new THREE.CylinderGeometry(0.24, 0.2, 0.78, 10)),
    mat(THREE, assombrir(MOBILIER.metal, 0.12), 0.75, 0.2),
  );
  c.position.y = 0.55;
  c.castShadow = true;
  g.add(c);
  const anneau = new THREE.Mesh(
    geoDe("corba", () => new THREE.TorusGeometry(0.24, 0.02, 5, 12)),
    mat(THREE, lisere(MOBILIER.metal, 0.2), 0.5, 0.35),
  );
  anneau.position.y = 0.94;
  anneau.rotation.x = Math.PI / 2;
  g.add(anneau);
  return g;
}

// Un abribus : deux poteaux, un toit, un panneau vitré. Il sert aussi de
// masque, donc il ne se pose JAMAIS près d'une scène.
export function abribus(THREE, versRue = 1) {
  const g = new THREE.Group();
  const metal = mat(THREE, MOBILIER.metal, 0.5, 0.35);
  for (const dz of [-1.5, 1.5])
    for (const dx of [-0.55, 0.55]) {
      const p = new THREE.Mesh(
        geoDe("apot", () => new THREE.BoxGeometry(0.09, 2.5, 0.09)),
        metal,
      );
      p.position.set(dx, 1.25, dz);
      p.castShadow = true;
      g.add(p);
    }
  const toit = new THREE.Mesh(
    geoDe("atoit", () => new THREE.BoxGeometry(1.5, 0.1, 3.4)),
    mat(THREE, lisere(MOBILIER.metal, 0.18), 0.45, 0.3),
  );
  toit.position.y = 2.55;
  toit.castShadow = true;
  g.add(toit);
  const vitre = new THREE.Mesh(
    geoDe("avitre", () => new THREE.BoxGeometry(0.06, 1.9, 3.2)),
    new THREE.MeshStandardMaterial({
      color: 0x2a3a4c,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.55,
      envMapIntensity: 1.4,
    }),
  );
  vitre.position.set(-versRue * 0.55, 1.35, 0);
  g.add(vitre);
  const assis = banc(THREE);
  assis.position.set(0.2, 0, 0);
  g.add(assis);
  return g;
}

// ⭐ L'ARBRE ET SA CALOTTE. Signature secondaire de la bible : la lumière
// n'est pas seulement calculée, elle est PEINTE. Une seconde masse de
// feuillage, plus claire, décalée du côté du soleil.
export function arbre(THREE, soleil, echelle = 1) {
  const g = new THREE.Group();
  const masse = new THREE.Mesh(
    geoDe("amasse", () => new THREE.IcosahedronGeometry(1, 1)),
    mat(THREE, VEGETATION.ombre, 0.85),
  );
  masse.scale.set(1.5, 1.25, 1.5);
  masse.position.y = 3.5;
  masse.castShadow = true;
  g.add(masse);
  const calotte = new THREE.Mesh(
    geoDe("acal", () => new THREE.IcosahedronGeometry(1, 1)),
    mat(THREE, VEGETATION.calotte, 0.8),
  );
  calotte.scale.set(1.12, 0.95, 1.12);
  calotte.position.set(soleil.x * 0.55, 3.5 + soleil.y * 0.5, soleil.z * 0.55);
  g.add(calotte);
  const tronc = new THREE.Mesh(
    geoDe("atronc", () => new THREE.CylinderGeometry(0.16, 0.24, 2.6, 7)),
    mat(THREE, VEGETATION.tronc, 0.92),
  );
  tronc.position.y = 1.3;
  tronc.castShadow = true;
  g.add(tronc);
  // La grille d'arbre : un carré sombre au pied. Deux triangles, et l'arbre
  // cesse d'être planté dans du béton.
  const grille = new THREE.Mesh(
    geoDe("agrille", () => new THREE.PlaneGeometry(1.2, 1.2)),
    mat(THREE, assombrir(SOL.trottoir, 0.3), 0.95),
  );
  grille.rotation.x = -Math.PI / 2;
  grille.position.y = 0.005;
  g.add(grille);
  g.scale.multiplyScalar(echelle);
  return g;
}
