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
//
// 🔴 TOUT PASSE PAR LE BANC D'INSTANCES. Ces objets ne bougent jamais : les
// laisser en objets séparés coûtait un ordre de dessin par pièce, pour rien.

import { MOBILIER, SOL, VEGETATION, lisere, assombrir } from "./palette.js";
import { CUBE } from "./instances.js";

const cache = new Map();
const geoDe = (cle, f) => {
  if (!cache.has(cle)) cache.set(cle, f());
  return cache.get(cle);
};

let MATS = null;
function materiaux(THREE) {
  if (MATS) return MATS;
  const std = (o) =>
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0,
      envMapIntensity: 0.45,
      ...o,
    });
  MATS = {
    metal: std({ roughness: 0.5, metalness: 0.35 }),
    mat: std({ roughness: 0.85 }),
    verre: new THREE.MeshStandardMaterial({
      color: 0x2a3a4c,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.5,
      envMapIntensity: 1.4,
    }),
  };
  return MATS;
}

/**
 * Poser une pièce de mobilier dans le banc.
 *
 * @param genre    lampadaire · banc · potelet · corbeille · abribus · arbre
 * @param versRue  +1 ou -1 : le côté vers lequel la pièce se tourne
 */
export function poserMobilier(
  THREE,
  banc,
  genre,
  { x = 0, z = 0, versRue = 1, echelle = 1, soleil = null } = {},
) {
  const M = materiaux(THREE);
  const cube = CUBE(THREE);
  const repere = new THREE.Matrix4().setPosition(x, 0, z);

  // Une boîte posée par son centre, dans le repère local de la pièce.
  const bloc = (cle, c, lx, ly, lz, px, py, pz, rz = 0) => {
    const p = banc.neuf();
    p.position.set(px, py, pz);
    p.rotation.z = rz;
    p.scale.set(lx, ly, lz);
    banc.poser(cle, cube, M.mat, c, { ombre: ly > 0.2 });
  };
  const cyl = (cle, geo, mat, c, px, py, pz, rz = 0, ombre = true) => {
    const p = banc.neuf();
    p.position.set(px, py, pz);
    p.rotation.z = rz;
    banc.poser(cle, geo, mat, c, { ombre });
  };

  banc.sousRepere(repere, () => {
    if (genre === "lampadaire") {
      // Sa valeur n'est pas d'éclairer (on est en plein jour) mais de donner
      // une verticale régulière qui rythme la fuite de la rue.
      cyl(
        "lmat",
        geoDe("lmat", () => new THREE.CylinderGeometry(0.07, 0.11, 4.6, 8)),
        M.metal,
        MOBILIER.metal,
        0,
        2.3,
        0,
      );
      cyl(
        "lcrosse",
        geoDe("lcrosse", () => new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6)),
        M.metal,
        MOBILIER.metal,
        versRue * 0.5,
        4.55,
        0,
        Math.PI / 2 - versRue * 0.22,
      );
      bloc(
        "llampe",
        lisere(MOBILIER.metal, 0.22),
        0.5,
        0.14,
        0.3,
        versRue * 1.0,
        4.44,
        0,
      );
      // L'embase : un tronc de cône au pied du mât. Sans elle, un lampadaire
      // a l'air planté dans le trottoir comme une aiguille.
      cyl(
        "lpied",
        geoDe("lpied", () => new THREE.CylinderGeometry(0.13, 0.17, 0.4, 8)),
        M.mat,
        assombrir(MOBILIER.metal, 0.2),
        0,
        0.2,
        0,
      );
    } else if (genre === "banc" || genre === "assise") {
      for (const dz of [-0.72, 0.72])
        bloc("bpied", MOBILIER.metal, 0.5, 0.42, 0.08, 0, 0.21, dz);
      bloc("bassise", MOBILIER.bois, 0.46, 0.07, 1.7, 0, 0.45, 0);
      bloc("bdos", MOBILIER.bois, 0.07, 0.4, 1.7, 0.2, 0.68, 0, 0.12);
    } else if (genre === "potelet") {
      cyl(
        "pot",
        geoDe("pot", () => new THREE.CylinderGeometry(0.055, 0.07, 0.95, 8)),
        M.metal,
        MOBILIER.metal,
        0,
        0.48,
        0,
      );
      cyl(
        "pott",
        geoDe("pott", () => new THREE.SphereGeometry(0.06, 8, 6)),
        M.metal,
        lisere(MOBILIER.metal, 0.25),
        0,
        0.96,
        0,
        0,
        false,
      );
    } else if (genre === "corbeille") {
      cyl(
        "corb",
        geoDe("corb", () => new THREE.CylinderGeometry(0.24, 0.2, 0.78, 10)),
        M.mat,
        assombrir(MOBILIER.metal, 0.12),
        0,
        0.55,
        0,
      );
      cyl(
        "corba",
        geoDe("corba", () => new THREE.TorusGeometry(0.24, 0.02, 5, 12)),
        M.metal,
        lisere(MOBILIER.metal, 0.2),
        0,
        0.94,
        0,
        Math.PI / 2,
        false,
      );
    } else if (genre === "abribus") {
      for (const dz of [-1.5, 1.5])
        for (const dx of [-0.55, 0.55])
          bloc("apot", MOBILIER.metal, 0.09, 2.5, 0.09, dx, 1.25, dz);
      bloc("atoit", lisere(MOBILIER.metal, 0.18), 1.5, 0.1, 3.4, 0, 2.55, 0);
      const p = banc.neuf();
      p.position.set(-versRue * 0.55, 1.35, 0);
      p.scale.set(0.06, 1.9, 3.2);
      banc.poser("avitre", cube, M.verre, null, { ombre: false });
      for (const dz of [-0.72, 0.72])
        bloc("bpied", MOBILIER.metal, 0.5, 0.42, 0.08, 0.2, 0.21, dz);
      bloc("bassise", MOBILIER.bois, 0.46, 0.07, 1.7, 0.2, 0.45, 0);
    } else if (genre === "arbre") {
      // ⭐ TROIS MASSES, PAS UNE. Une seule boule fait un sucre d'orge ; trois
      // volumes décalés donnent une silhouette qu'on ne peut pas confondre
      // avec une primitive, et le ciel passe entre eux.
      const geoMasse = geoDe(
        "amasse",
        () => new THREE.IcosahedronGeometry(1, 1),
      );
      const S = soleil || { x: -0.6, y: 0.7, z: 0.35 };
      const grappe = [
        [0, 3.5, 0, 1.5, 1.28, 1.5],
        [0.62 * echelle, 3.0, -0.5 * echelle, 0.95, 0.85, 0.95],
        [-0.55 * echelle, 3.9, 0.45 * echelle, 0.85, 0.78, 0.85],
      ];
      for (const [px, py, pz, sx, sy, sz] of grappe) {
        const p = banc.neuf();
        p.position.set(px, py * echelle, pz);
        p.scale.set(sx * echelle, sy * echelle, sz * echelle);
        banc.poser("feuille", geoMasse, M.mat, VEGETATION.ombre, {
          ombre: true,
          recoit: true,
        });
      }
      // La calotte : la lumière n'est pas seulement calculée, elle est PEINTE.
      // Une seconde masse plus claire, décalée du côté du soleil.
      {
        const p = banc.neuf();
        p.position.set(
          S.x * 0.6 * echelle,
          (3.5 + S.y * 0.55) * echelle,
          S.z * 0.6 * echelle,
        );
        p.scale.set(1.12 * echelle, 0.95 * echelle, 1.12 * echelle);
        banc.poser("calotte", geoMasse, M.mat, VEGETATION.calotte, {
          ombre: false,
          recoit: false,
        });
      }
      const p = banc.neuf();
      p.position.set(0, 1.3 * echelle, 0);
      p.scale.set(echelle, echelle, echelle);
      banc.poser(
        "tronc",
        geoDe("atronc", () => new THREE.CylinderGeometry(0.16, 0.26, 2.6, 7)),
        M.mat,
        VEGETATION.tronc,
        { ombre: true },
      );
      // La grille d'arbre : un carré sombre au pied, et l'arbre cesse d'être
      // planté dans du béton.
      bloc(
        "grille",
        assombrir(SOL.trottoir, 0.34),
        1.3,
        0.03,
        1.3,
        0,
        0.015,
        0,
      );
    }
  });
}
