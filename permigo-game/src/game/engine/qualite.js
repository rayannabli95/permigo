// Le gouverneur de qualité. UN seul endroit décide de tout ce qui se négocie
// entre la beauté et la vitesse : densité de pixels, anticrénelage, ombres,
// halo, effets d'objectif.
//
// Pourquoi un seul : deux régulateurs qui se surveillent finissent par se
// battre. La chaîne d'effets baissait déjà toute seule, le monde décidait de
// son côté des ombres et de la densité, et personne ne savait plus quel
// réglage était actif. Ici c'est une ÉCHELLE ordonnée, on monte ou on descend
// d'un cran, et on peut toujours dire où l'on est.
//
// ⭐⭐⭐ Ce module existe à cause de la mesure la plus importante de l'audit :
// on dessinait en 645 px de large sur un écran de 1290. Une image à moitié
// résolution, étirée et sans anticrénelage, ne peut PAS avoir l'air d'un jeu,
// quel que soit le soin mis à l'éclairage.

// De la plus belle à la plus rapide. On descend quand ça rame, on remonte
// quand la marge revient — mais jamais au-delà du cran de départ + 1, pour
// éviter les allers-retours visibles.
const CRANS = [
  {
    nom: "ultra",
    densite: 3,
    msaa: 4,
    ombres: true,
    halo: true,
    objectif: 1,
  },
  {
    nom: "cinema",
    densite: 2.5,
    msaa: 4,
    ombres: true,
    halo: true,
    objectif: 1,
  },
  {
    nom: "haute",
    densite: 2,
    msaa: 4,
    ombres: true,
    halo: true,
    objectif: 1,
  },
  {
    nom: "moyenne",
    densite: 2,
    msaa: 2,
    ombres: true,
    halo: false,
    objectif: 1,
  },
  {
    nom: "basse",
    densite: 1.75,
    msaa: 0,
    ombres: true,
    halo: false,
    objectif: 0.5,
  },
  {
    nom: "minimale",
    densite: 1.5,
    msaa: 0,
    ombres: false,
    halo: false,
    objectif: 0,
  },
];

// ⚠️ Les deux premières secondes ne se mesurent JAMAIS : elles contiennent la
// compilation des shaders, le premier remplissage des textures et la première
// image d'ombres. Mesurées, elles font croire à n'importe quelle machine
// qu'elle est trop lente.
const ECHAUFFEMENT = 2;

// 🔴 Le seuil de descente ne peut pas être 45 images/s. Beaucoup d'écrans sont
// bloqués à 30 Hz (économie de batterie, écran externe) : à 45, on dégradait
// des machines qui tournaient parfaitement. Ce qu'on chasse, c'est ce qui
// tombe SOUS le pas d'un écran 30 Hz.
const DESCENDRE_SOUS = 26;
// On ne remonte que si l'on tient vraiment 60 : sur un écran 30 Hz on reste
// donc au cran de départ, ce qui est le bon comportement.
const MONTER_AU_DESSUS = 57;

export function creerQualite(monde, { qualite = "auto" } = {}) {
  const dpr = window.devicePixelRatio || 1;

  // Le point de départ. Un téléphone commence en « cinéma » : 2,5 fois la
  // densité CSS, soit environ 1080 px de large sur un écran de 430 points.
  // C'est le minimum pour que l'image soit nette. Une machine de bureau part
  // en « haute » : son écran est bien plus large, donc bien plus cher.
  const petit = monde.petit;
  let i = CRANS.findIndex((c) => c.nom === qualite);
  if (i < 0) i = petit ? 1 : 2;
  const plafond = Math.max(0, i - 1); // on ne monte que d'un cran au-dessus

  let echauffe = 0;
  let fenetre = 0;
  let images = 0;
  let mauvaises = 0;
  let bonnes = 0;
  let post = null;

  appliquer();

  function appliquer() {
    const c = CRANS[i];
    monde.reglerDensite(Math.min(dpr, c.densite));
    monde.reglerOmbres(c.ombres);
    post?.regler(c);
  }

  return {
    get cran() {
      return CRANS[i].nom;
    },
    get reglage() {
      return { ...CRANS[i], densiteReelle: monde.densite };
    },

    // La chaîne d'effets s'annonce quand elle est prête : elle n'existe pas
    // encore au moment où le gouverneur se crée.
    brancherPost(p) {
      post = p;
      post.regler(CRANS[i]);
    },

    forcer(nom) {
      const k = CRANS.findIndex((c) => c.nom === nom);
      if (k < 0) return CRANS[i].nom;
      i = k;
      echauffe = 0;
      mauvaises = bonnes = 0;
      appliquer();
      return CRANS[i].nom;
    },

    // Appelé une fois par image, avec le pas de temps RÉEL (pas ralenti).
    maj(dt) {
      if (echauffe < ECHAUFFEMENT) {
        echauffe += dt;
        return;
      }
      fenetre += dt;
      images++;
      if (fenetre < 1) return;
      const fps = images / fenetre;
      fenetre = 0;
      images = 0;

      if (fps < DESCENDRE_SOUS) {
        bonnes = 0;
        // Deux fenêtres de suite : un ramasse-miettes isolé ne compte pas.
        if (++mauvaises >= 2 && i < CRANS.length - 1) {
          mauvaises = 0;
          i++;
          appliquer();
        }
        return;
      }
      mauvaises = 0;
      if (fps > MONTER_AU_DESSUS) {
        // Trois fenêtres confortables avant de remonter : on préfère laisser
        // de la marge que faire clignoter la qualité.
        if (++bonnes >= 3 && i > plafond) {
          bonnes = 0;
          i--;
          appliquer();
        }
      } else bonnes = 0;
    },
  };
}
