// Scénario — le piéton qui traverse.
//
// La leçon : un piéton engagé sur un passage passe avant tout le monde, sans
// discussion et sans klaxon. Rien d'autre ne se joue ici, pas de panneau, pas
// de trafic : la seule question est de le voir et de s'arrêter.
//
// ⚠️ Le piéton part à 3,2 s pour être au milieu de la chaussée quand l'élève
// arrive sur le passage. Trop tôt il a fini de traverser, trop tard il n'est
// pas encore engagé et il n'y a plus rien à apprendre.

export default {
  id: "pieton-1",
  theme: "pieton",
  tags: ["pieton"],
  environnement: "carrefour",

  titre: "Quelqu'un traverse",
  consigne: "Regarde le passage devant toi.",
  regle:
    "Un piéton engagé sur un passage est prioritaire. On s'arrête, et on ne redémarre qu'une fois qu'il a fini de traverser.",

  decor: { passages: ["S"], batiments: true, arbres: true },

  joueur: { branche: "S", recul: 58, vitesse: 9 },
  croisiere: 8,

  acteurs: [
    {
      id: "marcheur",
      type: "pieton",
      couleur: "bleu",
      // Il part du trottoir de droite et traverse vers la gauche : il entre
      // donc dans la voie du joueur en premier.
      chemin: [
        [7.4, 5.1],
        [-7.4, 5.1],
      ],
      vitesse: 1.3,
      depart: 2.2,
      prioritaire: false, // il ne compte pas comme un conflit de véhicules
    },
  ],

  attendu: "ceder",
  observation: null,
  vitesseSure: 9.5,
  ecartMin: 1.2, // on ne frôle pas un piéton
  duree: 70,

  retours: {
    reussi: "Tu l'as vu et tu t'es arrêté. C'est tout ce qu'il fallait faire.",
    pas_cede_pieton:
      "Le piéton était déjà sur la chaussée. Il passe avant toi, toujours.",
    collision: "Tu as renversé le piéton.",
  },
};
