// Scénario — le feu.
//
// La leçon porte sur l'ORANGE, pas sur le rouge. Tout le monde sait qu'un
// rouge se respecte ; l'orange, lui, se franchit « parce que j'étais lancé ».
// Le cycle est réglé pour que l'élève arrive pendant l'orange, avec la place
// de s'arrêter : c'est exactement le cas où il faut s'arrêter.
//
// ⚠️ Le cycle démarre en même temps que la manche. Le vert au départ laisse
// l'élève rouler tranquillement, l'orange tombe pendant l'approche.

export default {
  id: "feu-1",
  theme: "feu",
  tags: ["signalisation"],
  environnement: "carrefour",

  titre: "Le feu passe à l'orange",
  consigne: "Le feu est à toi. Regarde ce qu'il fait.",
  regle:
    "Le feu orange veut dire stop, sauf si l'arrêt est impossible sans danger. Lancé de loin, tu peux t'arrêter, donc tu t'arrêtes.",

  decor: {
    passages: ["S"],
    feux: [
      {
        branche: "S",
        etat: "vert",
        cycle: [
          ["vert", 4],
          ["orange", 3],
          ["rouge", 9],
        ],
      },
      {
        branche: "E",
        etat: "rouge",
        cycle: [
          ["rouge", 7],
          ["vert", 9],
        ],
      },
    ],
    batiments: true,
    arbres: true,
  },

  joueur: { branche: "S", recul: 58, vitesse: 9 },
  croisiere: 8,

  // Personne ne coupe la route : la seule chose qui compte est le feu.
  acteurs: [],

  attendu: "feu",
  observation: null,
  vitesseSure: 9.5,
  duree: 80,

  retours: {
    reussi:
      "Tu t'es arrêté à l'orange alors que tu pouvais le faire. C'est ça, la règle.",
    feu_rouge:
      "Tu es passé alors que le feu n'était plus vert. Tu avais la place de t'arrêter.",
  },
};
