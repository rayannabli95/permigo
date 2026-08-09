// Le trafic. Pas d'IA : des acteurs qui suivent un chemin de points de
// passage, avec le MÊME modèle de véhicule que le joueur. Ils se déplacent
// donc réellement dans la scène, ils ne sont pas animés le long d'une courbe.
//
// La direction est une poursuite pure : on vise un point situé un peu plus
// loin sur le chemin, et on braque vers lui. C'est ce que font les jeux de
// course pour leurs concurrents, et ça donne des virages ronds au lieu des
// cassures qu'on obtient en visant le point suivant.
//
// Un acteur est déterministe : même scénario, même trajectoire, à la seconde
// près. Sans ça, une situation pédagogique n'est pas reproductible.

import { creerVehicule } from "./vehicle.js";
import { AVANT } from "./world.js";

const GABARITS = {
  voiture: { longueur: 4.2, largeur: 1.85, vitesseMax: 16 },
  camion: { longueur: 8.6, largeur: 2.45, vitesseMax: 13 },
  bus: { longueur: 10.5, largeur: 2.5, vitesseMax: 12 },
  moto: { longueur: 2.1, largeur: 0.8, vitesseMax: 18 },
  velo: { longueur: 1.7, largeur: 0.62, vitesseMax: 6 },
  pieton: { longueur: 0.5, largeur: 0.5, vitesseMax: 1.5 },
};

export function creerActeur({
  id,
  type = "voiture",
  couleur = "gris",
  chemin = [],
  vitesse = 9,
  depart = 0, // secondes d'attente avant de partir
  evite = false, // freine-t-il si le joueur lui coupe la route ?
  boucle = false,
  // ⚠️ À déclarer ici, sinon il se perd. Un piéton n'est pas un « conflit de
  // véhicules » : sans ce champ, le moteur reprochait un refus de priorité à
  // l'élève au lieu de lui dire qu'il n'avait pas laissé passer le piéton.
  prioritaire = true,
}) {
  const g = GABARITS[type] || GABARITS.voiture;
  const [p0, p1] = [chemin[0] || [0, 0], chemin[1] || chemin[0] || [0, 1]];
  const v = creerVehicule({
    x: p0[0],
    z: p0[1],
    cap: Math.atan2(-(p1[0] - p0[0]), -(p1[1] - p0[1])),
    vitesse: 0,
    ...g,
  });

  return {
    id,
    type,
    couleur,
    chemin,
    evite,
    boucle,
    prioritaire,
    v,
    cible: 1, // index du point visé
    attente: depart,
    vitesseVoulue: Math.min(vitesse, g.vitesseMax),
    fini: false,
    arrete: false,

    // `bloque` : le moteur dit à l'acteur qu'il doit s'arrêter (autre véhicule
    // devant, feu rouge, joueur en travers). C'est le scénario qui décide.
    maj(dt, { bloque = false } = {}) {
      if (this.fini) return;
      if (this.attente > 0) {
        this.attente -= dt;
        return;
      }
      const p = this.chemin[this.cible];
      if (!p) {
        if (this.boucle) this.cible = 0;
        else {
          this.fini = true;
          return;
        }
      }
      const [cx, cz] = this.chemin[this.cible];
      const dx = cx - this.v.x,
        dz = cz - this.v.z;
      if (dx * dx + dz * dz < 9) {
        this.cible++;
        if (this.cible >= this.chemin.length) {
          if (this.boucle) this.cible = 0;
          else {
            this.fini = true;
            return;
          }
        }
      }

      // Poursuite pure : angle entre l'avant et le point visé.
      const [ax, az] = AVANT(this.v.cap);
      const n = Math.hypot(dx, dz) || 1;
      const ux = dx / n,
        uz = dz / n;
      // Produit vectoriel 2D : positif = la cible est à gauche.
      const cote = ax * uz - az * ux;
      const devant = ax * ux + az * uz;
      const volant = Math.max(-1, Math.min(1, Math.atan2(-cote, devant) * 1.4));

      const stop = bloque || (this.evite && this.arrete);
      const vise = stop ? 0 : this.vitesseVoulue;
      const gaz = this.v.vitesse < vise - 0.2 ? 1 : 0;
      const freinage = this.v.vitesse > vise + 0.2 ? 1 : 0;
      this.v.avancer(dt, { gaz, freinage, volant });
    },

    get x() {
      return this.v.x;
    },
    get z() {
      return this.v.z;
    },
    get cap() {
      return this.v.cap;
    },
  };
}
