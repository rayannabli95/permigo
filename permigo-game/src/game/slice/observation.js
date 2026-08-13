// La preuve d'observation. C'est ici que « il a balayé » devient « il a vu »,
// et c'est ici qu'on refuse de confondre les deux.
//
// Cinq niveaux, du plus faux au plus vrai :
//   1 BALAYÉ     la tête est passée dessus            🔴 se triche en deux secondes
//   2 VU         c'est resté dans le champ assez longtemps, sans obstacle
//   3 DÉSIGNÉ    il l'a touché du doigt
//   4 INTERPRÉTÉ sa décision n'a de sens que s'il a compris   (→ verdict.js)
//   5 ANTICIPÉ   son geste est parti avant que ça devienne évident (→ moteur)
//
// Ce module tient les niveaux 1 à 3. Les deux derniers ne se mesurent pas
// dans le regard, et c'est exactement pour ça qu'ils ne se trichent pas.
//
// ⚠️ Aucune de ces valeurs n'est une vérité. Ce sont les seuils du banc
// d'essai, tous dans reglages.js, tous discutables, et le terrain est là pour
// nous dire si 250 ms sur un téléphone représentent quoi que ce soit.

import { AVANT } from "../engine/world.js";

// À moins de six mètres, ce n'est plus de l'observation, c'est de la tôle.
const CRITIQUE = 6;

// Le champ horizontal RÉEL d'un téléphone en portrait. Ce n'est pas un
// réglage de confort : c'est ce qui rend le balayage coûteux, donc ce qui
// empêche de le tricher. Regarder à droite, c'est ne plus voir devant.
// 55° verticaux × un cadre de 9/19,5 donnent une trentaine de degrés.
function demiChamp(camera) {
  const vFov = (camera.fov * Math.PI) / 180;
  const h = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  return { h: h / 2, v: vFov / 2 };
}

export function creerObservation(THREE, monde, R) {
  const rayon = new THREE.Raycaster();
  const dir = new THREE.Vector3();
  const oeil = new THREE.Vector3();
  const but = new THREE.Vector3();
  let masques = [];
  let zones = [];
  // ⚠️ L'amplitude n'est PAS globale : la scène de l'angle mort demande un
  // contrôle par-dessus l'épaule. Sans ce réglage par scène, « il aurait pu
  // le voir » se calculait avec la mauvaise limite et datait faux.
  let amplitude = R.angleRegardMax;
  let sterile = 0;
  let regardTotal = 0;

  // Résout la position d'une cible à cet instant. Une cible peut être un
  // point fixe, ou s'accrocher à un acteur — l'avant d'une voiture (là où
  // ses phares posent leur lueur), son arrière (là où sont ses feux stop).
  function position(cible, acteurs, out) {
    if (cible.point)
      return out.set(cible.point[0], cible.point[1], cible.point[2]);
    const a = acteurs.get(cible.acteur);
    if (!a) return null;
    const [ax, az] = AVANT(a.cap);
    const d = (cible.avant || 0) - (cible.arriere || 0);
    return out.set(a.x + ax * d, cible.hauteur ?? 1, a.z + az * d);
  }

  // Vue depuis l'œil du conducteur, dans une direction donnée.
  // `capRegard` est le cap de la TÊTE : le cap du véhicule pour savoir ce
  // qu'on voit sans bouger, le cap plus le regard pour ce qu'on voit vraiment.
  function dansLeChamp(point, capRegard, camera) {
    const dx = point.x - oeil.x;
    const dz = point.z - oeil.z;
    const dy = point.y - oeil.y;
    const plat = Math.hypot(dx, dz);
    if (plat < 0.4) return { vu: false, distance: plat };
    const [fx, fz] = AVANT(capRegard);
    // Produit scalaire et produit vectoriel : l'angle signé avec l'avant.
    const devant = (dx * fx + dz * fz) / plat;
    const cote = (fx * dz - fz * dx) / plat;
    const gisement = Math.atan2(cote, devant);
    const site = Math.atan2(dy, plat);
    const c = demiChamp(camera);
    // ⚠️ Le regard plonge de 0,075 rad (camera-rig) : sans ce décalage, on
    // croit voir le ciel et on rate ce qui est au sol, c'est-à-dire l'indice
    // le plus important des scènes de priorité masquée.
    const dedans =
      Math.abs(gisement) <= c.h * R.champUtile &&
      Math.abs(site + 0.075) <= c.v * R.champUtile;
    return { vu: dedans, distance: Math.hypot(plat, dy) };
  }

  // Aurait-il PU le voir en tournant la tête à fond ? Sert à dater le moment
  // où l'information devient disponible, indépendamment de ce qu'il regardait.
  function atteignable(point, cap, camera) {
    const dx = point.x - oeil.x;
    const dz = point.z - oeil.z;
    const plat = Math.hypot(dx, dz);
    if (plat < 0.4) return false;
    const [fx, fz] = AVANT(cap);
    const gisement = Math.atan2(
      (fx * dz - fz * dx) / plat,
      (dx * fx + dz * fz) / plat,
    );
    return Math.abs(gisement) <= amplitude + demiChamp(camera).h;
  }

  // 🔴 Sans ce test, on ne mesure pas un regard, on mesure un cap. Un élève
  // qui fixe la camionnette « voit » la voiture qui est derrière elle, et
  // toute la mécanique s'effondre en silence.
  function masque(point, distance) {
    if (!R.testerOcclusion || !masques.length) return false;
    dir.subVectors(point, oeil).normalize();
    rayon.set(oeil, dir);
    rayon.far = Math.max(0.1, distance - 0.35);
    return rayon.intersectObjects(masques, true).length > 0;
  }

  return {
    // Les objets qui peuvent cacher quelque chose. Volontairement une petite
    // liste (la camionnette, le camion qu'on suit) et pas la scène entière :
    // un rayon lancé contre un décor complet coûte plus cher que tout le
    // reste de l'image réunis, pour un résultat identique.
    poserMasques(liste) {
      masques = liste.filter(Boolean);
    },

    reglerAmplitude(a) {
      amplitude = a || R.angleRegardMax;
    },

    poser(interets) {
      zones = (interets || []).map((i) => ({
        id: i.id,
        role: i.role || "indice",
        nature: i.nature || "objet",
        // Comment cette information se PROUVE. « regard » : il a fallu
        // tourner la tête avant que ça devienne évident. « reaction » : la
        // chose était droit devant, aucune direction ne prouve rien, seul le
        // délai de réaction parle.
        preuve: i.preuve || "regard",
        texte: i.texte || "",
        apparait: i.apparait ?? 0,
        cible: i.cible,
        seuil: R.seuilObservationInitial[i.nature || "objet"] ?? 0.25,
        // Ce qu'on mesure
        premierRegard: null, // s, depuis le début de la scène
        dureeCumulee: 0,
        distanceAuPremierRegard: null,
        niveau: 0,
        designe: false,
        // L'instant où ça devient visible SANS tourner la tête. Mesuré, pas
        // écrit : c'est la référence de la marge d'anticipation, et une
        // valeur écrite à la main serait fausse dès qu'on bouge une voiture.
        evident: null,
        // L'instant où c'est physiquement visible en tournant la tête, donc
        // le premier moment où l'on POUVAIT savoir.
        connaissable: null,
        // L'instant où c'est arrivé à portée de tôle. Sert de repère quand
        // rien ne devient jamais évident (l'angle mort).
        critique: null,
        _distance: null,
        _point: new THREE.Vector3(),
      }));
      sterile = 0;
      regardTotal = 0;
      return zones;
    },

    maj(dt, t, { v, regard, acteurs, camera }) {
      oeil.copy(camera.position);
      let uneVisible = false;

      for (const z of zones) {
        if (t < z.apparait) continue;
        const p = position(z.cible, acteurs, z._point);
        if (!p) continue;

        // Ce qu'il voit vraiment, tête tournée comprise.
        const reel = dansLeChamp(p, v.cap + regard, camera);
        const libre = reel.vu && !masque(p, reel.distance);
        if (libre) {
          uneVisible = true;
          if (z.premierRegard === null) {
            z.premierRegard = t;
            z.distanceAuPremierRegard = Math.hypot(p.x - v.x, p.z - v.z);
            z.niveau = Math.max(z.niveau, 1);
          }
          z.dureeCumulee += dt;
          // ⭐ Le seul saut qui compte. Un balayage métronomique passe environ
          // 100 ms par zone : il déclenche le niveau 1 et jamais le 2. Aucune
          // règle n'a été écrite contre lui, c'est le temps qui le trie.
          if (z.dureeCumulee >= z.seuil) z.niveau = Math.max(z.niveau, 2);
        }

        // Le premier moment où c'était physiquement CONNAISSABLE : non pas
        // « il regardait par là », mais « en tournant la tête au maximum, il
        // aurait pu le voir ». C'est la borne de l'honnêteté du jeu : avant
        // cet instant, aucun reproche n'est recevable.
        if (z.connaissable === null && atteignable(p, v.cap, camera)) {
          const d = Math.hypot(p.x - oeil.x, p.z - oeil.z, p.y - oeil.y);
          if (!masque(p, d)) z.connaissable = t;
        }

        // Et le moment où ça crève les yeux : dans l'axe de la voiture, sans
        // avoir rien fait.
        if (z.evident === null) {
          const droit = dansLeChamp(p, v.cap, camera);
          if (droit.vu && !masque(p, droit.distance)) z.evident = t;
        }

        // 🔴 Certains dangers ne deviennent JAMAIS évidents, et c'est le
        // sujet : un angle mort reste un angle mort jusqu'au choc. Sans ce
        // second repère, la scène du vélo ne produirait aucune marge
        // d'anticipation, c'est-à-dire aucune mesure.
        // ⚠️ Et seulement si ça SE RAPPROCHE. Le vélo commence six mètres
        // derrière : sans ce test, l'instant critique tombait à t = 0,05 s
        // et la marge d'anticipation de toute la scène partait à la poubelle.
        // Un objet qui s'éloigne n'a jamais été un danger.
        if (z.critique === null) {
          const d = Math.hypot(p.x - v.x, p.z - v.z);
          if (d < CRITIQUE && z._distance !== null && d < z._distance)
            z.critique = t;
          z._distance = d;
        }
      }

      // Le balayage stérile : du regard dépensé là où il n'y avait rien.
      // On ne le punit pas, on le NOTE. C'est lui qui dira si un joueur a
      // trouvé le métronome, et donc si la version testée se triche.
      if (Math.abs(regard) > R.regardMinimum) {
        regardTotal += dt;
        if (!uneVisible) sterile += dt;
      }
    },

    // Une désignation : on cherche la zone la plus proche du rayon du doigt.
    designer(tape, camera, hote) {
      const r = hote.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((tape.x - r.left) / r.width) * 2 - 1,
        -((tape.y - r.top) / r.height) * 2 + 1,
      );
      rayon.setFromCamera(ndc, camera);
      rayon.far = 220;
      let meilleure = null;
      let mieux = 3.2; // mètres de tolérance autour de la cible
      for (const z of zones) {
        but.copy(z._point);
        const d = rayon.ray.distanceToPoint(but);
        if (d < mieux) {
          mieux = d;
          meilleure = z;
        }
      }
      if (meilleure) {
        meilleure.designe = true;
        meilleure.niveau = Math.max(meilleure.niveau, 3);
      }
      return meilleure;
    },

    get zones() {
      return zones;
    },
    zone(id) {
      return zones.find((z) => z.id === id) || null;
    },
    get danger() {
      return zones.find((z) => z.role === "danger") || null;
    },
    get indice() {
      return zones.find((z) => z.role === "indice") || null;
    },
    get sterile() {
      return regardTotal > 0.05 ? sterile / regardTotal : 0;
    },
    get regardTotal() {
      return regardTotal;
    },
  };
}
