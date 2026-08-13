// Les zones invisibles. C'est elles qui remplacent « l'élève a cliqué sur la
// mauvaise réponse » par « l'élève est entré dans le carrefour à 12 km/h sans
// avoir regardé à droite ».
//
// Une zone est une boîte au sol, alignée sur les axes du monde (les routes le
// sont aussi, donc une boîte tournée n'a jamais servi jusqu'ici). Elle retient
// ce qui s'est passé DEDANS : à quelle vitesse on y est entré, la plus basse
// atteinte, le temps passé, combien de fois on y est venu. Un scénario n'a
// plus qu'à lire ces chiffres.

export function creerZone({ id, x = 0, z = 0, l = 8, p = 8, role = "" }) {
  return {
    id,
    role,
    x,
    z,
    l,
    p,
    x0: x - l / 2,
    x1: x + l / 2,
    z0: z - p / 2,
    z1: p ? z + p / 2 : z,
    dedans: false,
    vu: false, // y est-on entré au moins une fois ?
    entrees: 0,
    duree: 0,
    vitesseEntree: null,
    vitesseMin: Infinity,
    vitesseMax: 0,
    regardDroiteMax: 0,
    regardGaucheMax: 0,

    contient(px, pz) {
      return px >= this.x0 && px <= this.x1 && pz >= this.z0 && pz <= this.z1;
    },

    // Renvoie 'entree' | 'sortie' | null, pour que le scénario réagisse.
    maj(dt, v, rig) {
      const dans = this.contient(v.x, v.z);
      let evt = null;
      if (dans && !this.dedans) {
        evt = "entree";
        this.entrees++;
        this.vu = true;
        this.vitesseEntree = v.vitesse;
      } else if (!dans && this.dedans) {
        evt = "sortie";
      }
      this.dedans = dans;
      if (dans) {
        this.duree += dt;
        if (v.vitesse < this.vitesseMin) this.vitesseMin = v.vitesse;
        if (v.vitesse > this.vitesseMax) this.vitesseMax = v.vitesse;
        if (rig) {
          this.regardDroiteMax = Math.max(
            this.regardDroiteMax,
            rig.regardDroite,
          );
          this.regardGaucheMax = Math.max(
            this.regardGaucheMax,
            rig.regardGauche,
          );
        }
      }
      return evt;
    },
  };
}

export function creerZones(specs = []) {
  const liste = specs.map(creerZone);
  const parId = new Map(liste.map((z) => [z.id, z]));
  return {
    liste,
    get: (id) => parId.get(id),
    // Renvoie les évènements de l'image, à passer au scénario.
    maj(dt, v, rig) {
      const evts = [];
      for (const z of liste) {
        const e = z.maj(dt, v, rig);
        if (e) evts.push({ zone: z, type: e });
      }
      return evts;
    },
    // Un acteur (NPC) est-il dans la zone ? Sert au « il était déjà engagé ».
    occupee(id, acteurs) {
      const z = parId.get(id);
      return !!z && acteurs.some((a) => z.contient(a.x, a.z));
    },
  };
}
