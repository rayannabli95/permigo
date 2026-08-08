// Un véhicule : une position dans le monde, un cap, une vitesse.
//
// Modèle « bicyclette » cinématique — le même que celui des jeux de conduite
// arcade. Deux lignes de physique, aucun moteur externe :
//
//   position += avant(cap) * v * dt
//   cap      += (v / empattement) * tan(braquage) * dt
//
// ⚠️ Le cap ne change QUE si la voiture avance. C'est ça qui fait qu'on ne
// pivote pas sur place comme une tourelle, et c'est exactement le comportement
// qu'un élève reconnaît. Pas de dérive, pas de survirage : PermiGo n'est pas
// un simulateur, la trajectoire doit rester lisible du premier coup.

import { AVANT } from "./world.js";

const BRAQUAGE_MAX = 0.62; // rad aux roues, ~35° — braquage de parking
const EMPATTEMENT = 2.6; // m, une berline

// 🔴 Le braquage se ferme avec la vitesse. Sans ça, volant à fond à 50 km/h
// fait une toupie complète en trois secondes : la voiture obéit, mais plus
// personne ne reconnaît une voiture. Les jeux de course font tous ça.
// À l'arrêt on a le braquage de parking, à 50 km/h il en reste un cinquième.
const braquageMax = (v) => BRAQUAGE_MAX * (3.7 / (3.7 + v));

export function creerVehicule({
  x = 0,
  z = 0,
  cap = 0,
  vitesse = 0,
  vitesseMax = 16, // 16 m/s ≈ 58 km/h
  accel = 4.2,
  frein = 9,
  longueur = 4.2,
  largeur = 1.85,
} = {}) {
  return {
    x,
    z,
    cap,
    vitesse,
    vitesseMax,
    accel,
    frein,
    longueur,
    largeur,
    braquage: 0, // état réel des roues, lissé
    distance: 0, // mètres parcourus depuis le départ
    freine: false,

    // gaz ∈ [0,1], freinage ∈ [0,1], volant ∈ [-1,1] (positif = gauche)
    avancer(dt, { gaz = 0, freinage = 0, volant = 0 } = {}) {
      // Les roues tournent en un cinquième de seconde, pas instantanément.
      const vise = volant * braquageMax(this.vitesse);
      this.braquage += (vise - this.braquage) * Math.min(1, dt * 6);

      if (freinage > 0) {
        this.vitesse = Math.max(0, this.vitesse - this.frein * freinage * dt);
      } else if (gaz > 0) {
        this.vitesse = Math.min(
          this.vitesseMax,
          this.vitesse + this.accel * gaz * dt,
        );
      } else {
        // Frein moteur : lâcher les gaz ralentit, sinon on roule sans fin.
        this.vitesse = Math.max(0, this.vitesse - 2.4 * dt);
      }
      this.freine = freinage > 0.05;

      const [ax, az] = AVANT(this.cap);
      const d = this.vitesse * dt;
      this.x += ax * d;
      this.z += az * d;
      this.distance += d;
      this.cap += (this.vitesse / EMPATTEMENT) * Math.tan(this.braquage) * dt;
      return this;
    },

    get kmh() {
      return this.vitesse * 3.6;
    },

    // Boîte du véhicule aux 4 coins, pour les tests de recouvrement.
    coins() {
      const [ax, az] = AVANT(this.cap);
      const dx = -az,
        dz = ax; // droite = avant tourné de -90°
      const L = this.longueur / 2,
        W = this.largeur / 2;
      return [
        [this.x + ax * L + dx * W, this.z + az * L + dz * W],
        [this.x + ax * L - dx * W, this.z + az * L - dz * W],
        [this.x - ax * L + dx * W, this.z - az * L + dz * W],
        [this.x - ax * L - dx * W, this.z - az * L - dz * W],
      ];
    },
  };
}

// Recouvrement de deux véhicules — cercles englobants d'abord (c'est gratuit),
// puis axes séparateurs sur les 4 normales des deux boîtes.
export function seTouchent(a, b) {
  const dx = a.x - b.x,
    dz = a.z - b.z;
  const ra = Math.hypot(a.longueur, a.largeur) / 2;
  const rb = Math.hypot(b.longueur, b.largeur) / 2;
  if (dx * dx + dz * dz > (ra + rb) * (ra + rb)) return false;

  const A = a.coins(),
    B = b.coins();
  const axes = [];
  for (const [ax, az] of [AVANT(a.cap), AVANT(b.cap)]) {
    axes.push([ax, az], [-az, ax]);
  }
  for (const [nx, nz] of axes) {
    let aMin = Infinity,
      aMax = -Infinity,
      bMin = Infinity,
      bMax = -Infinity;
    for (const [px, pz] of A) {
      const p = px * nx + pz * nz;
      if (p < aMin) aMin = p;
      if (p > aMax) aMax = p;
    }
    for (const [px, pz] of B) {
      const p = px * nx + pz * nz;
      if (p < bMin) bMin = p;
      if (p > bMax) bMax = p;
    }
    if (aMax < bMin || bMax < aMin) return false; // un axe sépare → pas de choc
  }
  return true;
}
