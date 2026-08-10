// L'ARCHITECTURE DE PERMIGO — une grammaire, pas des modèles.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §6 (bâtiments) et §5 (matières).
//
// ⭐ ON NE CONSTRUIT PAS « UN IMMEUBLE », ON ÉCRIT UNE LANGUE :
//
//     SOCLE + ÉTAGES × n + COURONNE
//
// Chaque terme a deux ou trois variantes, et la variété vient de la
// COMBINAISON. Trois variantes de socle, deux de couronne et six familles de
// couleur font déjà trente-six immeubles différents sans qu'on en dessine un
// seul. C'est exactement le genre de système qu'un agent peut étendre, et
// qu'un humain n'aurait pas la patience de maintenir à la main.
//
// 🔴 CE QUI FAIT LA RUE N'EST PAS L'IMMEUBLE, C'EST SON VOISIN. Deux voisins
// ne partagent jamais ni famille de couleur ni hauteur, et un « accident »
// (immeuble étroit, plus haut, en retrait) tombe tous les cinq à sept modules.
// Sans cette règle on obtient un ruban régulier, et un ruban ne ressemble à
// aucune ville.

import { FACADES, COMMERCES, jitter, lisere, assombrir } from "./palette.js";
import { facade } from "./textures.js";

const ETAGE = 3.1;
const SOCLE = 3.2;

// Les textures sont partagées par toute la rue : six familles de façade et
// trois devantures, soit neuf images pour quatre cents mètres de ville.
let TEX = null;
function textures(THREE) {
  if (!TEX)
    TEX = {
      mur: FACADES.map((c, i) => facade(THREE, c, 20260901 + i * 17)),
      commerce: COMMERCES.map((c, i) =>
        facade(THREE, c, 20260950 + i * 23, { commerce: true }),
      ),
    };
  return TEX;
}

/**
 * Un immeuble.
 *
 * @param cote    +1 = trottoir de droite, -1 = celui de gauche. Sert à savoir
 *                quelle face regarde la rue : c'est la SEULE qu'on habille.
 * @param largeur la façade sur rue, en mètres (parcelle de 6, 9 ou 12)
 * @param etages  2 à 4
 * @param famille index dans `FACADES`
 */
export function batiment(
  THREE,
  { cote = 1, largeur = 10, etages = 3, famille = 0, alea, commerce = false },
) {
  const T = textures(THREE);
  const g = new THREE.Group();
  const couleur = jitter(FACADES[famille], alea);
  const prof = 11;
  const hCorps = SOCLE + ETAGE * etages;
  const boite = new THREE.BoxGeometry(1, 1, 1);
  const mat = (c, rug = 0.9) =>
    new THREE.MeshStandardMaterial({
      color: c,
      roughness: rug,
      metalness: 0,
      envMapIntensity: 0.35,
    });
  const bloc = (l, h, p, c, x, y, z, rug) => {
    const m = new THREE.Mesh(boite, mat(c, rug));
    m.scale.set(l, h, p);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // Le volume. Sa face rue est habillée ; les trois autres restent des aplats,
  // et c'est voulu : on ne les voit jamais depuis le siège du conducteur.
  bloc(prof, hCorps, largeur, assombrir(couleur, 0.06), 0, 0, 0, 0.9);

  const versRue = -cote * (prof / 2 + 0.03);
  const rotRue = cote > 0 ? -Math.PI / 2 : Math.PI / 2;

  // ── LES ÉTAGES ────────────────────────────────────────────────────────
  const travees = Math.max(2, Math.round(largeur / 3));
  const carte = T.mur[famille].clone();
  carte.needsUpdate = true;
  carte.repeat.set(travees, etages);
  const mur = new THREE.Mesh(
    new THREE.PlaneGeometry(largeur, ETAGE * etages),
    new THREE.MeshStandardMaterial({
      map: carte,
      roughness: 0.86,
      metalness: 0,
      envMapIntensity: 0.3,
    }),
  );
  mur.position.set(versRue, SOCLE + (ETAGE * etages) / 2, 0);
  mur.rotation.y = rotRue;
  g.add(mur);

  // ── LE SOCLE ──────────────────────────────────────────────────────────
  let matSocle;
  if (commerce) {
    const c = T.commerce[Math.floor(alea() * T.commerce.length) % 3].clone();
    c.needsUpdate = true;
    c.repeat.set(travees, 1);
    matSocle = new THREE.MeshStandardMaterial({
      map: c,
      roughness: 0.7,
      metalness: 0,
      envMapIntensity: 0.5,
    });
  } else {
    matSocle = mat(assombrir(couleur, 0.12), 0.88);
  }
  const socle = new THREE.Mesh(
    new THREE.PlaneGeometry(largeur, SOCLE),
    matSocle,
  );
  socle.position.set(versRue, SOCLE / 2, 0);
  socle.rotation.y = rotRue;
  g.add(socle);

  // L'auvent d'un commerce : une casquette de quatre-vingts centimètres qui
  // porte une VRAIE ombre sur la devanture. C'est cette ombre, plus que la
  // couleur, qui fait qu'un rez-de-chaussée existe.
  if (commerce && alea() < 0.65) {
    const a = bloc(
      0.9,
      0.12,
      largeur * 0.86,
      lisere(couleur, 0.16),
      -cote * (prof / 2 + 0.45),
      SOCLE - 0.5,
      0,
      0.8,
    );
    a.castShadow = true;
  }

  // ── LES BALCONS ───────────────────────────────────────────────────────
  // Seulement sur les deux premiers niveaux, les seuls que la caméra regarde
  // vraiment depuis 1,22 m. Au-delà, ce serait des triangles pour personne.
  if (alea() < 0.45) {
    for (let e = 1; e <= Math.min(2, etages - 1); e++) {
      if (alea() < 0.35) continue;
      const y = SOCLE + ETAGE * e - 0.1;
      bloc(
        0.55,
        0.08,
        largeur * 0.78,
        lisere(couleur, 0.2),
        -cote * (prof / 2 + 0.24),
        y,
        0,
        0.85,
      );
      // La rambarde : un bandeau sombre ajouré, suggéré par une simple barre.
      bloc(
        0.06,
        0.42,
        largeur * 0.78,
        0x4b5568,
        -cote * (prof / 2 + 0.48),
        y + 0.08,
        0,
        0.55,
      );
    }
  }

  // ── LA COURONNE ───────────────────────────────────────────────────────
  // ⭐ C'est la silhouette contre le ciel qu'on voit le plus longtemps en
  // roulant, et c'était la partie la plus plate de la rue : tous les
  // immeubles se terminaient par la même arête nette.
  const corniche = bloc(
    prof + 0.5,
    0.26,
    largeur + 0.5,
    lisere(couleur, 0.2),
    0,
    hCorps,
    0,
    0.85,
  );
  corniche.castShadow = true;

  const hToit = hCorps + 0.26;
  if (alea() < 0.5) {
    // Toit en pente, débordant. Deux plans inclinés suffisent.
    const pente = 0.52; // ≈ 30°
    const demi = prof / 2 + 0.3;
    const haut = demi * Math.tan(pente);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(
        new THREE.PlaneGeometry(demi / Math.cos(pente), largeur + 0.6),
        mat(0x7a5f5a, 0.92),
      );
      p.rotation.set(-Math.PI / 2, 0, 0);
      p.rotation.order = "ZYX";
      p.rotation.z = s * pente;
      p.position.set((s * demi) / 2, hToit + haut / 2, 0);
      p.castShadow = true;
      p.receiveShadow = true;
      g.add(p);
    }
    // La cheminée : trente centimètres qui cassent la ligne du toit.
    if (alea() < 0.7)
      bloc(
        0.5,
        0.9,
        0.5,
        assombrir(couleur, 0.2),
        (alea() - 0.5) * prof * 0.5,
        hToit + haut * 0.3,
        (alea() - 0.5) * largeur * 0.5,
        0.95,
      );
  } else {
    // Toit-terrasse : un parapet, et parfois une cage d'escalier.
    for (const s of [-1, 1]) {
      bloc(
        0.2,
        0.55,
        largeur + 0.4,
        lisere(couleur, 0.1),
        (s * prof) / 2,
        hToit,
        0,
        0.9,
      );
      bloc(
        prof + 0.4,
        0.55,
        0.2,
        lisere(couleur, 0.1),
        0,
        hToit,
        (s * largeur) / 2,
        0.9,
      );
    }
    if (alea() < 0.55)
      bloc(
        2.2,
        1.6,
        2.4,
        assombrir(couleur, 0.16),
        (alea() - 0.5) * 3,
        hToit,
        (alea() - 0.5) * largeur * 0.4,
        0.92,
      );
  }

  g.userData.hauteur = hToit;
  return g;
}

/**
 * Une rangée d'immeubles le long d'un trottoir.
 * Retourne la liste des groupes, déjà positionnés en Z.
 */
export function rangee(
  THREE,
  { cote, zDebut, zFin, alea, x, accidents = true },
) {
  const sortie = [];
  let familleAvant = -1;
  let etagesAvant = -1;
  let depuisAccident = 0;

  for (let z = zDebut; z > zFin;) {
    // Une parcelle de 6, 9 ou 12 mètres. Trois largeurs suffisent à casser la
    // régularité, et elles se prêtent à un nombre entier de travées.
    let largeur = [6, 9, 12][Math.floor(alea() * 3) % 3];
    let etages = 2 + Math.floor(alea() * 3);
    let retrait = 0;

    depuisAccident++;
    if (accidents && depuisAccident >= 5 + Math.floor(alea() * 3)) {
      // ⭐ L'ACCIDENT. Une ville régulière n'existe pas : tous les cinq à sept
      // immeubles, il y en a un beaucoup plus étroit, beaucoup plus haut, ou
      // en retrait de la rue. C'est ce qui donne un rythme à une rangée.
      depuisAccident = 0;
      const genre = Math.floor(alea() * 3);
      if (genre === 0) largeur = 5;
      else if (genre === 1) etages = 5 + Math.floor(alea() * 2);
      else retrait = 1.6;
    }

    let famille = Math.floor(alea() * FACADES.length);
    if (famille === familleAvant) famille = (famille + 1) % FACADES.length;
    familleAvant = famille;
    if (etages === etagesAvant) etages = 2 + ((etages - 1) % 4);
    etagesAvant = etages;

    const b = batiment(THREE, {
      cote,
      largeur,
      etages,
      famille,
      alea,
      commerce: alea() < 0.3,
    });
    b.position.set(x + cote * retrait, 0, z - largeur / 2);
    sortie.push(b);
    z -= largeur + 0.4; // un joint de quarante centimètres entre parcelles
  }
  return sortie;
}
