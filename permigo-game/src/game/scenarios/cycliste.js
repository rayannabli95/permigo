// Scénario — le cycliste.
//
// La leçon : on ne double pas un vélo en le frôlant. Un mètre en ville, un
// mètre cinquante hors agglomération. Et si la place manque, on reste
// derrière — rester derrière n'est pas un échec ici, c'est une bonne réponse.
//
// C'est la seule situation où le moteur mesure un ÉCART et pas un instant :
// il retient la distance la plus courte au moment où l'élève arrive à sa
// hauteur, et rien avant.

export default {
  id: "cycliste-1",
  theme: "cycliste",
  tags: ["partage", "depassement"],
  environnement: "carrefour",

  titre: "Un vélo devant toi",
  consigne: "Il roule moins vite que toi. À toi de voir.",
  regle:
    "Pour dépasser un cycliste il faut un mètre d'écart en ville. Si la place manque, on reste derrière et on attend.",

  decor: { passages: ["S"], batiments: true, arbres: true },

  joueur: { branche: "S", recul: 62, vitesse: 9 },
  croisiere: 8,

  acteurs: [
    {
      id: "velo",
      type: "velo",
      couleur: "jaune",
      // Il roule dans la voie du joueur, bien à droite, et continue tout
      // droit à travers le carrefour.
      chemin: [
        [2.6, 42],
        [2.6, -60],
      ],
      vitesse: 4.6,
      prioritaire: false,
    },
  ],

  attendu: "ceder",
  observation: null,
  vitesseSure: 12, // ici la vitesse d'entrée n'est pas le sujet
  ecartMin: 1,
  duree: 70,

  retours: {
    reussi:
      "Tu lui as laissé la place. C'est exactement l'écart qu'on demande.",
    trop_pres:
      "Tu l'as frôlé. Un mètre d'écart en ville, et s'il n'y a pas la place, tu restes derrière.",
    collision: "Tu as percuté le cycliste.",
    trop_long: "Tu es resté derrière sans jamais repartir.",
  },
};
