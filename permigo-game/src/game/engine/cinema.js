// Le réalisateur. C'est lui qui décide où est la caméra quand ce n'est pas le
// joueur qui conduit : le plan d'ouverture, le ralenti d'impact, le plan final.
//
// Deux règles tenues ici :
//
// 1. Un plan de cinéma n'est PAS un mouvement de caméra en plus. C'est une
//    intention : on montre d'abord OÙ on est (le carrefour), puis QUI on est
//    (la voiture), puis on entre à la place du conducteur. Trois temps, quatre
//    secondes, et l'élève sait tout avant d'avoir touché une pédale.
// 2. ⚠️ Il doit être INTERRUPTIBLE. Un élève qui refait la même situation pour
//    la cinquième fois ne veut pas revoir le plan : le premier appui coupe.
//    Un plan qu'on ne peut pas sauter devient une punition à la troisième vue.
//
// Le réalisateur ne fait que POSER la caméra. Il ne touche ni au véhicule, ni
// aux zones, ni au verdict : le moteur continue de tourner derrière (les feux
// avancent, le trafic roule) mais le scénario reste gelé tant que le plan
// n'est pas fini.

// ⭐⭐⭐ LA LOI DU CADRE EN PORTRAIT, payée deux fois maintenant.
// Un écran de téléphone est deux fois plus haut que large : le champ
// HORIZONTAL n'y fait qu'une trentaine de degrés. Une caméra haute qui plonge
// sur un carrefour ne cadre donc pas « le carrefour », elle cadre du bitume,
// et la première version de ce plan rendait une image beige illisible.
// En portrait, un plan large se fait BAS et se regarde À L'HORIZONTALE : c'est
// la rue qui fuit, les façades et le ciel qui remplissent le cadre.

import { AVANT } from "./world.js";

// Le côté gauche du conducteur. Avec un cap qui augmente vers la gauche et un
// avant en (-sin, -cos), la gauche est en (-cos, +sin).
const GAUCHE = (cap) => [-Math.cos(cap), Math.sin(cap)];

// Des courbes, pas des rampes. Une caméra qui démarre et s'arrête net donne
// une impression de logiciel ; celle-ci part vite et se pose en douceur.
const sortie = (t) => 1 - Math.pow(1 - t, 3);
const douce = (t) => t * t * (3 - 2 * t);

// Les trois temps du plan d'ouverture, en secondes.
const PLAN = [
  // 1. La rue. Caméra posée bas devant la voiture, tournée vers elle : on voit
  //    la rue fuir, les façades, le ciel, et la voiture au bout. Un travelling
  //    latéral lent fait défiler les premiers plans et donne le volume.
  { duree: 1.5, nom: "rue" },
  // 2. Nous. La caméra tombe et vient s'orbiter autour de la voiture.
  { duree: 1.4, nom: "orbite" },
  // 3. L'entrée. Elle plonge vers la place du conducteur et prend son axe.
  { duree: 1.1, nom: "entree" },
];
const DUREE = PLAN.reduce((s, p) => s + p.duree, 0);

export function creerCinema(THREE, monde, rig) {
  const camera = monde.camera;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const vise = new THREE.Vector3();

  let t = 0;
  let actif = false;
  // 🔴 Pendant le plan, la caméra est DEHORS : il faut donc montrer la
  // carrosserie et cacher le poste de conduite, l'inverse exact de ce que fait
  // la vue « conduite ». Sans ce drapeau, la voiture est invisible dans son
  // propre plan de présentation, et on ne comprend pas ce qu'on regarde.
  let dedans = false;
  let saute = false;
  let post = null;
  let auFini = null;

  // Le ralenti d'impact : un coefficient de temps que le moteur applique.
  let ralenti = 1;
  let ralentiRestant = 0;

  return {
    get actif() {
      return actif;
    },
    get avancement() {
      return Math.min(1, t / DUREE);
    },
    get dedans() {
      return dedans;
    },
    // Le moteur multiplie son pas de temps par ça : 1 = temps réel.
    get tempo() {
      return ralenti;
    },

    brancherPost(p) {
      post = p;
    },

    // Le plan d'ouverture. `fini` est appelé quand la main revient au joueur.
    ouvrir(fini) {
      t = 0;
      actif = true;
      saute = false;
      auFini = fini;
    },

    // Le premier appui coupe le plan. On ne le coupe pas net : on garde une
    // demi-seconde pour rejoindre la place du conducteur, sinon l'image saute.
    sauter() {
      if (!actif || saute) return false;
      saute = true;
      t = Math.max(t, DUREE - 0.5);
      return true;
    },

    // Le choc. Le temps se dilate, la caméra recule, l'image se déchire.
    impact(duree = 1.1) {
      ralentiRestant = duree;
      post?.secouer(1);
    },

    // Appelé chaque image AVANT le rig. Rend `true` s'il a pris la caméra.
    maj(dtReel, v) {
      // Le ralenti vit sa vie, plan d'ouverture ou pas.
      if (ralentiRestant > 0) {
        ralentiRestant -= dtReel;
        // Il plonge d'un coup et remonte doucement : c'est la remontée qui
        // fait l'effet, pas la descente.
        ralenti = ralentiRestant > 0 ? 0.22 + 0.5 * (1 - ralentiRestant) : 1;
        ralenti = Math.min(1, Math.max(0.22, ralenti));
      } else ralenti = 1;

      if (!actif) return false;
      t += dtReel;
      if (t >= DUREE) {
        actif = false;
        dedans = true;
        post?.point(1);
        auFini?.();
        return false;
      }

      const [ax, az] = AVANT(v.cap);
      // Le point regardé : le carrefour au début, la voiture ensuite.
      const centre = vise.set(0, 0.8, 0);
      let reste = t;
      let etape = 0;
      while (etape < PLAN.length - 1 && reste > PLAN[etape].duree) {
        reste -= PLAN[etape].duree;
        etape++;
      }
      const p = Math.min(1, reste / PLAN[etape].duree);

      const [gx, gz] = GAUCHE(v.cap);
      // On bascule dans l'habitacle aux deux tiers du dernier temps, quand la
      // caméra est assez près pour que la carrosserie commence à gêner.
      dedans = etape === 2 && p > 0.66;

      if (etape === 0) {
        // Travelling latéral, à hauteur d'homme, 26 m devant la voiture et
        // tourné vers elle. La caméra glisse d'un trottoir vers l'axe : les
        // arbres et les lampadaires du premier plan défilent, c'est cette
        // parallaxe qui donne la profondeur, pas la 3D elle-même.
        const e = sortie(p);
        a.set(
          v.x + ax * 26 + gx * (7.5 - e * 4.5),
          1.45 + e * 0.25,
          v.z + az * 26 + gz * (7.5 - e * 4.5),
        );
        camera.position.copy(a);
        camera.lookAt(centre.set(v.x + ax * 6, 1.15, v.z + az * 6));
        post?.point(0.45); // net : c'est un plan de situation, on doit lire
      } else if (etape === 1) {
        // Orbite autour de la voiture, presque à hauteur de toit. Le rayon se
        // resserre : ce resserrement est le « crash zoom » du cinéma.
        // ⚠️ Elle reste BASSE. Montée à six mètres, on retombe sur le plan
        // plongeant qui ne cadre que du bitume.
        const e = douce(p);
        const angle = v.cap + Math.PI * (0.62 - e * 0.5);
        const rayon = 12 - e * 6;
        a.set(
          v.x + Math.sin(angle) * rayon,
          2.7 - e * 0.8,
          v.z + Math.cos(angle) * rayon,
        );
        camera.position.copy(a);
        camera.lookAt(centre.set(v.x, 1.15, v.z));
        post?.point(1.5 + e * 0.8); // l'objectif s'ouvre : le fond se referme
      } else {
        // L'entrée. La caméra rejoint la place du conducteur et prend son axe.
        // ⚠️ On interpole la POSITION et l'ORIENTATION séparément : viser un
        // point qui bouge en même temps qu'on avance donne un mouvement qui
        // « colle » et qu'on ne peut pas courber.
        const e = sortie(p);
        const oeil = b.set(
          v.x - -Math.sin(v.cap) * 0.15 - Math.cos(v.cap) * 0.36,
          1.24,
          v.z - -Math.cos(v.cap) * 0.15 + Math.sin(v.cap) * 0.36,
        );
        const depart = a.set(
          v.x + Math.sin(v.cap + Math.PI * 0.1) * 6.8,
          2.3,
          v.z + Math.cos(v.cap + Math.PI * 0.1) * 6.8,
        );
        camera.position.lerpVectors(depart, oeil, e);
        // La visée glisse de la voiture vers la route, devant.
        centre.set(
          v.x + ax * (2 + e * 24),
          1.0 + e * 0.2,
          v.z + az * (2 + e * 24),
        );
        camera.lookAt(centre);
        // Rack focus : l'objectif se referme au moment où l'on prend le volant.
        post?.point(2.4 - e * 1.5);
      }
      return true;
    },

    detruire() {
      actif = false;
      auFini = null;
    },
  };
}

export const DUREE_PLAN = DUREE;
