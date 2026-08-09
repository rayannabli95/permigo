// Scénario — cédez le passage.
//
// La leçon, et c'est celle qui se confond toujours avec le stop : ici on n'a
// PAS à s'arrêter. On ralentit, on regarde, et on ne s'engage que si la voie
// est libre. S'arrêter alors que rien ne vient n'est pas une faute grave,
// mais griller le panneau parce que « je n'ai vu personne » en est une.

export default {
  id: "cede-1",
  theme: "cede",
  tags: ["signalisation", "priorite"],
  environnement: "carrefour",

  titre: "Cédez le passage",
  consigne: "Tu n'as pas la priorité. Regarde avant de t'engager.",
  regle:
    "Cédez le passage n'oblige pas à s'arrêter. Il oblige à laisser passer ceux qui arrivent, et donc à ralentir assez pour pouvoir le faire.",

  decor: {
    passages: ["S"],
    panneaux: [{ branche: "S", type: "cede" }],
    batiments: true,
    arbres: true,
  },

  joueur: { branche: "S", recul: 58, vitesse: 9 },
  croisiere: 8,

  acteurs: [
    {
      id: "camion",
      type: "camion",
      couleur: "blanc",
      de: "E",
      vers: "W",
      recul: 50,
      vitesse: 10,
      evite: false,
    },
  ],

  attendu: "ceder",
  observation: "droite",
  vitesseSure: 9.5,
  duree: 80,

  retours: {
    reussi:
      "Tu as ralenti, regardé et laissé passer le camion. Le panneau est respecté.",
    refus_priorite:
      "Tu t'es engagé devant le camion. Cédez le passage veut dire qu'il passe avant toi.",
  },
};
