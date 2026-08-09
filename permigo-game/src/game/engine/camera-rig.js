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
  const cible = new THREE.Vector3();
  const viseCam = new THREE.Vector3();
  let amorce = true;

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
      amorce = true;
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
        // Caméra de poursuite : elle vise la place idéale mais s'y rend
        // MOLLEMENT. Collée au véhicule, elle tourne à la même vitesse que
        // lui et on ne voit plus la voiture pivoter — c'est ce ressort qui
        // donne le poids d'un jeu de course.
        const recul = 7.4 + Math.min(3.2, v.vitesse * 0.2);
        cible.set(v.x - ax * recul, 3.2, v.z - az * recul);
        // ⚠️ Au premier passage on se pose d'un coup : sinon la caméra part
        // de la place du conducteur et traverse la voiture en glissant.
        if (amorce) {
          camera.position.copy(cible);
          viseCam.set(v.x + ax * 7, 1.15, v.z + az * 7);
          amorce = false;
        }
        camera.position.lerp(cible, Math.min(1, dt * 3.4));
        viseCam.lerp(
          { x: v.x + ax * 7, y: 1.15, z: v.z + az * 7 },
          Math.min(1, dt * 6),
        );
        camera.lookAt(viseCam);
        return;
      }

      // Place du conducteur : 0,36 m à gauche de l'axe, un peu en arrière du
      // milieu de la voiture.
      // ⚠️ 1,24 m : la hauteur d'œil d'un conducteur, et elle se règle avec
      // ce qu'on met devant. Une première version montait à 1,45 m pour
      // qu'un capot dessiné à la main cesse d'avaler l'écran — mais de là on
      // regarde le DESSUS de la planche de bord, qui est une surface plate
      // sans rien à voir. Sans capot, l'œil redescend et on retrouve la
      // planche, le combiné et le volant, comme dans une vraie voiture.
      camera.position.set(
        v.x - dx * 0.36 - ax * 0.15,
        1.24,
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
