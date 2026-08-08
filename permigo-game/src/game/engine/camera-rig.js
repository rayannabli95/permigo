// La caméra, et rien qu'elle. Elle existe dans la scène : regarder à droite
// fait PIVOTER la caméra, ça ne charge pas « l'image de droite ».
//
// Trois vues :
//   conduite  — place du conducteur (à gauche, en France)
//   exterieur — derrière la voiture, pour se voir manœuvrer
//   libre     — caméra de développeur, orbite libre autour de la voiture
//
// Le regard gauche/centre/droite est un angle continu, lissé. Le scénario le
// LIT (`rig.regard`) pour savoir si l'élève a vraiment tourné la tête : c'est
// un comportement mesuré, pas un bouton cliqué.

import { AVANT } from "./world.js";

const REGARD = { gauche: 1.08, centre: 0, droite: -1.08 }; // rad, ~62°
export const VUES = ["conduite", "exterieur", "libre"];

export function creerRig(THREE, camera) {
  let vue = "conduite";
  let vise = 0; // angle de tête demandé
  let regard = 0; // angle de tête réel, lissé
  let roulis = 0;
  const libre = { az: 0.6, el: 0.42, dist: 14 };

  return {
    get vue() {
      return vue;
    },
    get regard() {
      return regard;
    },
    // À droite, l'angle est négatif : on le rend positif pour le scénario.
    get regardDroite() {
      return Math.max(0, -regard);
    },
    get regardGauche() {
      return Math.max(0, regard);
    },

    regarder(ou) {
      vise = typeof ou === "number" ? ou : (REGARD[ou] ?? 0);
    },
    changerVue(v) {
      vue = v || VUES[(VUES.indexOf(vue) + 1) % VUES.length];
      return vue;
    },
    orbiter(daz, del, dd = 0) {
      libre.az += daz;
      libre.el = Math.max(0.06, Math.min(1.45, libre.el + del));
      libre.dist = Math.max(4, Math.min(70, libre.dist + dd));
    },

    maj(dt, v) {
      regard += (vise - regard) * Math.min(1, dt * 7);

      if (vue === "libre") {
        const h = Math.cos(libre.el) * libre.dist;
        camera.position.set(
          v.x + Math.sin(libre.az) * h,
          2 + Math.sin(libre.el) * libre.dist,
          v.z + Math.cos(libre.az) * h,
        );
        camera.lookAt(v.x, 1.2, v.z);
        return;
      }

      const [ax, az] = AVANT(v.cap);
      const dx = -az,
        dz = ax; // vecteur « droite » de la voiture

      if (vue === "exterieur") {
        camera.position.set(v.x - ax * 8.5, 3.6, v.z - az * 8.5);
        camera.lookAt(v.x + ax * 6, 1.1, v.z + az * 6);
        return;
      }

      // Place du conducteur : 0,36 m à gauche de l'axe, un peu en arrière du
      // milieu de la voiture.
      // ⚠️ HAUTEUR = 1,45 m, pas les 1,21 m d'une berline. C'est le seul
      // réglage qui règle vraiment le cadrage en portrait : la part d'écran
      // prise par le capot ne dépend que de l'angle entre son bord avant et
      // le bas de l'image. Piquer la caméra ne sert à rien (le capot descend
      // avec l'horizon), rallonger le capot empire. Monter l'œil de 24 cm
      // fait passer le capot de 37 % à 21 % de l'image.
      camera.position.set(
        v.x - dx * 0.36 - ax * 0.15,
        1.45,
        v.z - dz * 0.36 - az * 0.15,
      );
      // Le corps s'incline vers l'extérieur du virage. Discret : trop de
      // roulis et l'élève ne lit plus la route, il a le mal de mer.
      const viseRoulis = -v.braquage * Math.min(1, v.vitesse / 12) * 0.11;
      roulis += (viseRoulis - roulis) * Math.min(1, dt * 4);
      camera.rotation.order = "YXZ";
      // ⚠️ Le regard plonge un peu. En portrait, un écran fait 62° de haut :
      // sans ce piqué, la route tient dans une bande fine et le capot occupe
      // tout le bas. C'est un cadrage, pas un réglage de confort.
      camera.rotation.set(-0.075, v.cap + regard, roulis);
    },
  };
}
