// Le chargeur de modèles GLB. Il fait UNE chose que personne ne fait à notre
// place : remettre un modèle dans le repère du jeu.
//
// Un modèle fabriqué ailleurs arrive dans une taille, une orientation et un
// centre quelconques. Le moteur, lui, travaille en mètres, avant = -Z, roues
// au sol. `normaliser()` fait la conversion une fois pour toutes, et le reste
// du code n'a plus jamais à s'en soucier.
//
// ⚠️ Si un fichier manque ou refuse de se charger, on RENVOIE null et
// l'appelant retombe sur les primitives du kit. Une situation qui n'ouvre pas
// parce qu'un décor manque serait pire que le décor manquant.

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// `longueur` cale la plus grande dimension AU SOL, `hauteur` cale la hauteur.
// ⚠️ Pour un objet haut et fin (un lampadaire, un arbre), c'est `hauteur`
// qu'il faut : caler un lampadaire sur son emprise au sol le rend gigantesque
// ou minuscule selon la longueur de son bras.
export function normaliser(
  THREE,
  objet,
  { longueur, hauteur, capOffset = 0, poser = true },
) {
  const g = new THREE.Group();
  objet.rotation.y = capOffset;
  g.add(objet);

  const boite = new THREE.Box3().setFromObject(g);
  const taille = boite.getSize(new THREE.Vector3());
  const centre = boite.getCenter(new THREE.Vector3());

  const k0 = hauteur
    ? hauteur / Math.max(taille.y, 0.001)
    : longueur
      ? longueur / Math.max(taille.x, taille.z, 0.001)
      : 0;
  if (k0) {
    const k = k0;
    objet.scale.multiplyScalar(k);
    centre.multiplyScalar(k);
    boite.min.multiplyScalar(k);
  }
  objet.position.x -= centre.x;
  objet.position.z -= centre.z;
  objet.position.y -= poser ? boite.min.y : centre.y;
  return g;
}

// 🔴 Couper la géométrie au-dessus d'une hauteur. Indispensable pour les
// habitacles : la reconstruction d'image BOUCHE le pare-brise avec une
// surface pleine et sombre, et ce panneau noircit tout le haut de l'écran.
// On enlève donc tout ce qui est au-dessus de la planche de bord. On ne
// supprime jamais un sommet (les autres triangles s'en servent), on retire
// les TRIANGLES du tableau d'indices.
function couperAuDessus(THREE, racine, part) {
  const b = new THREE.Box3().setFromObject(racine);
  const seuil = b.min.y + (b.max.y - b.min.y) * part;
  racine.updateWorldMatrix(true, true);
  racine.traverse((o) => {
    if (!o.isMesh) return;
    const geo = o.geometry;
    const pos = geo.attributes.position;
    const idx = geo.index;
    const n = idx ? idx.count : pos.count;
    const p = new THREE.Vector3();
    const hautDe = (i) => {
      p.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      return p.y;
    };
    const gardes = [];
    for (let t = 0; t < n; t += 3) {
      const a = idx ? idx.getX(t) : t;
      const c = idx ? idx.getX(t + 1) : t + 1;
      const d = idx ? idx.getX(t + 2) : t + 2;
      // ⚠️ MAX, pas min : on garde un triangle seulement s'il est ENTIÈREMENT
      // sous le seuil. Avec le min, un seul sommet bas suffisait à sauver un
      // grand triangle, et sur un maillage grossier presque rien ne partait.
      if (Math.max(hautDe(a), hautDe(c), hautDe(d)) < seuil)
        gardes.push(a, c, d);
    }
    geo.setIndex(gardes);
    // 🔴 Sans ça, la boîte englobante reste celle d'AVANT la coupe. Box3
    // réutilise `geometry.boundingBox` quand elle existe : tout ce qui se
    // calcule ensuite (mise à l'échelle, pose au sol) se fait sur la
    // hauteur d'origine, et la pièce se retrouve enterrée ou en l'air.
    geo.boundingBox = null;
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
  });
}

// Un habitacle ne reçoit presque aucune lumière : il est sous un toit, et
// tout ce qu'on y met tombe au noir. On lui donne donc sa propre clarté,
// plutôt que d'ajouter une lampe dans la voiture (qui éclairerait aussi la
// route à travers le pare-brise).
function eclairer(THREE, racine, force) {
  racine.traverse((o) => {
    if (!o.isMesh) return;
    // 🔴 Il faut se souvenir si le matériau ÉTAIT un tableau. Sinon on rend
    // un tableau à un maillage qui n'a pas de groupes, et il ne dessine plus
    // rien du tout — sans la moindre erreur en console.
    const etaitTableau = Array.isArray(o.material);
    const mats = etaitTableau ? o.material : [o.material];
    const neufs = mats.map((m) => {
      if (!m) return m;
      const c = m.clone();
      c.color.multiplyScalar(force);
      if (c.emissive) c.emissive.copy(c.color).multiplyScalar(0.14);
      return c;
    });
    o.material = etaitTableau ? neufs : neufs[0];
    o.castShadow = false;
    o.receiveShadow = false;
  });
}

export async function chargerModeles(THREE, liste, { base = "" } = {}) {
  // ⚠️ Les modèles sont compressés en meshopt. Sans ce décodeur, le
  // chargement échoue en silence et tout retombe sur les primitives. C'est
  // lui qui fait passer les dix fichiers de 40 Mo à 1,7 Mo.
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const sortie = {};
  await Promise.all(
    Object.entries(liste).map(async ([cle, spec]) => {
      try {
        const gltf = await loader.loadAsync(base + spec.fichier);
        const brut = gltf.scene;
        brut.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = true;
          o.receiveShadow = true;
          // Les modèles arrivent souvent en double face : c'est deux fois le
          // travail pour le GPU et ça n'apporte rien sur un objet fermé.
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            if (!m) continue;
            m.side = THREE.FrontSide;
            if (m.map) m.map.anisotropy = 4;
            // 🔴 Un modèle importé arrive souvent métallique. Sans carte
            // d'environnement, un métal ne reçoit RIEN : la voiture devient
            // une silhouette noire. On la repasse en peinture mate.
            if ("metalness" in m) m.metalness = 0;
            if ("roughness" in m) m.roughness = 0.62;
            if ("envMapIntensity" in m) m.envMapIntensity = 1;
          }
        });
        if (spec.couper) couperAuDessus(THREE, brut, spec.couper);
        if (spec.eclairer) eclairer(THREE, brut, spec.eclairer);
        sortie[cle] = normaliser(THREE, brut, spec);
      } catch (e) {
        console.warn(
          `[modeles] ${cle} indisponible, repli sur les primitives`,
          e,
        );
        sortie[cle] = null;
      }
    }),
  );
  return sortie;
}

// Un modèle chargé sert plusieurs fois (le joueur, les autres voitures) :
// on clone, on ne recharge pas.
export function copier(modele) {
  return modele ? modele.clone(true) : null;
}
