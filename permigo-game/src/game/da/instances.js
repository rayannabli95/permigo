// LE BANC D'INSTANCES — la pièce qui débloque la qualité.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §12.
//
// 🔴 LE PROBLÈME QU'IL RÉSOUT, ET POURQUOI IL EST AU CŒUR DE LA DA.
//
// Une carte graphique ne souffre pas des triangles, elle souffre des ORDRES.
// Cent immeubles de huit pièces et soixante voitures de quatorze pièces
// faisaient 1 606 ordres de dessin par image pour un budget de 140, avec
// seulement 53 000 triangles. Autrement dit : on payait le prix fort pour un
// monde presque vide.
//
// Conséquence invisible mais décisive : je refusais d'ajouter du RELIEF
// (fenêtres creusées, bandeaux d'étage, garde-corps, volets) parce que chaque
// détail multipliait ce compteur. Le rendu faisait « blocs » à cause d'un
// budget, pas à cause d'une limite de la machine.
//
// ⭐ Une InstancedMesh dessine N copies d'une même géométrie en UN SEUL ordre,
// chacune avec sa matrice et SA COULEUR. Trois mille fenêtres coûtent donc
// autant qu'une. Le budget de détail devient pratiquement infini, et c'est ce
// qui autorise la modénature de `batiments.js`.
//
// ⚠️ Ce qui entre ici est FIGÉ. On n'instancie que le décor immobile : les
// acteurs d'une scène restent des objets normaux, qu'on bouge à chaque image.

export function creerBanc(THREE, { segment = 90 } = {}) {
  const lots = new Map();
  const pion = new THREE.Object3D();
  const BLANC = new THREE.Color(0xffffff);
  let repere = null;

  // Le pion de pose : on le remet à zéro, on le place, on le dépose. C'est le
  // seul objet temporaire du fichier, et il ne coûte rien.
  function neuf() {
    pion.position.set(0, 0, 0);
    pion.rotation.set(0, 0, 0);
    pion.scale.set(1, 1, 1);
    return pion;
  }

  /**
   * Poser une copie.
   *
   * @param cle      regroupe les copies : même clé = même ordre de dessin
   * @param couleur  hexadécimal, multiplié par le matériau (null = tel quel)
   * @param segmente true = un lot par tronçon de 90 m, pour que le hors-champ
   *                 se coupe. À réserver aux familles NOMBREUSES : segmenter
   *                 vingt lampadaires multiplierait les ordres sans rien gagner.
   */
  function poser(
    cle,
    geo,
    mat,
    couleur = null,
    { segmente = false, ombre = true, recoit = true } = {},
  ) {
    pion.updateMatrix();
    const m = pion.matrix.clone();
    if (repere) m.premultiply(repere);
    const k = segmente ? `${cle}#${Math.floor(m.elements[14] / segment)}` : cle;
    let lot = lots.get(k);
    if (!lot) lots.set(k, (lot = { geo, mat, ombre, recoit, m: [], c: [] }));
    lot.m.push(m);
    lot.c.push(couleur);
    if (couleur !== null) lot.teinte = true;
  }

  // ⭐ Le repère. Tout ce qui est posé pendant qu'il est actif subit d'abord
  // cette transformation. C'est ce qui permet de construire la rue
  // TRANSVERSALE avec exactement le même code que la rue principale : on la
  // dessine droite, dans son propre repère, et on la fait pivoter d'un quart
  // de tour à la pose. Sans ça, il faudrait une seconde version de chaque
  // fonction de construction.
  function sousRepere(m, f) {
    const avant = repere;
    repere = m;
    f();
    repere = avant;
  }

  function finir() {
    const g = new THREE.Group();
    const c = new THREE.Color();
    for (const lot of lots.values()) {
      const im = new THREE.InstancedMesh(lot.geo, lot.mat, lot.m.length);
      im.castShadow = lot.ombre;
      im.receiveShadow = lot.recoit;
      for (let i = 0; i < lot.m.length; i++) im.setMatrixAt(i, lot.m[i]);
      // ⚠️ Si UNE copie du lot est teintée, TOUTES doivent l'être : un tampon
      // de couleurs à moitié rempli sort en noir sur les copies oubliées.
      if (lot.teinte) {
        for (let i = 0; i < lot.m.length; i++)
          im.setColorAt(i, lot.c[i] === null ? BLANC : c.setHex(lot.c[i]));
        im.instanceColor.needsUpdate = true;
      }
      im.instanceMatrix.needsUpdate = true;
      g.add(im);
    }
    lots.clear();
    return g;
  }

  return {
    neuf,
    poser,
    sousRepere,
    finir,
    get ordres() {
      return lots.size;
    },
  };
}

// ── LES GÉOMÉTRIES UNITAIRES ───────────────────────────────────────────
//
// Instancier veut dire PARTAGER la géométrie : on ne dessine donc plus une
// boîte aux bonnes cotes, on dessine LA boîte unitaire et on la met à
// l'échelle dans la matrice. Tout le fichier `batiments.js` en découle.

const unites = new Map();
const uni = (THREE, cle, f) => {
  if (!unites.has(cle)) unites.set(cle, f(THREE));
  return unites.get(cle);
};

export const CUBE = (THREE) =>
  uni(THREE, "cube", (T) => new T.BoxGeometry(1, 1, 1));

export const PLAN = (THREE) =>
  uni(THREE, "plan", (T) => new T.PlaneGeometry(1, 1));

// ⭐ LE CADRE DE FENÊTRE — la géométrie qui change le plus le rendu.
//
// Un rectangle PERCÉ, extrudé sur douze centimètres. Ce n'est pas un détail
// décoratif : c'est la lèvre de ce cadre qui projette une ombre sur la vitre
// au soleil de seize heures, et c'est cette ombre qui fait qu'une façade
// cesse d'être un autocollant. Une fenêtre peinte dans une texture ne peut
// pas la produire, quelle que soit la qualité du dessin.
//
// Unitaire : 1 × 1 hors tout, percé de 0,74 × 0,80. Le vide est décentré vers
// le haut, parce qu'un appui de fenêtre est toujours plus épais qu'un linteau.
export const CADRE = (THREE, vers) =>
  uni(THREE, `cadre${vers}`, (T) => {
    const f = new T.Shape();
    f.moveTo(-0.5, -0.5);
    f.lineTo(0.5, -0.5);
    f.lineTo(0.5, 0.5);
    f.lineTo(-0.5, 0.5);
    f.closePath();
    const trou = new T.Path();
    trou.moveTo(-0.37, -0.36);
    trou.lineTo(0.37, -0.36);
    trou.lineTo(0.37, 0.44);
    trou.lineTo(-0.37, 0.44);
    trou.closePath();
    f.holes.push(trou);
    const g = new T.ExtrudeGeometry(f, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 1,
      curveSegments: 1,
    });
    // Le cadre est dessiné dans le plan XY et s'épaissit vers +Z. Un quart de
    // tour l'envoie sur la façade, saillie tournée vers la rue.
    g.rotateY(vers > 0 ? Math.PI / 2 : -Math.PI / 2);
    g.computeVertexNormals();
    return g;
  });

// Un barreau de garde-corps. Douze par balcon, un seul ordre de dessin pour
// toute la rue : c'est exactement le genre de détail qui était impensable
// avant le banc et qui coûte désormais zéro.
export const BARREAU = (THREE) =>
  uni(THREE, "barreau", (T) => new T.CylinderGeometry(0.018, 0.018, 1, 5));

export function viderUnites() {
  unites.clear();
}
