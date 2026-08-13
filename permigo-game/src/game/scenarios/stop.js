// Scénario — stop. De la donnée, pas du code de jeu.
//
// La leçon : au stop, on s'ARRÊTE. Pas « on ralentit beaucoup ». Les roues
// cessent de tourner, puis on regarde, puis on repart. C'est la faute la
// plus sanctionnée à l'examen parce que c'est la plus facile à constater.
//
// ⚠️ Le trafic vient de GAUCHE ici, volontairement : au stop on ne se
// demande pas qui a la priorité, on n'en a aucune, quel que soit le côté.

export default {
  id: "stop-1",
  theme: "stop",
  tags: ["signalisation", "priorite"],
  environnement: "carrefour",

  titre: "Le stop",
  consigne: "Marque l'arrêt, regarde, puis repars.",
  regle:
    "Au stop, l'arrêt est obligatoire même si la route est vide. On repart seulement après avoir regardé des deux côtés.",

  decor: {
    passages: ["S"],
    panneaux: [{ branche: "S", type: "stop" }],
    batiments: true,
    arbres: true,
  },

  joueur: { branche: "S", recul: 58, vitesse: 9 },
  croisiere: 8,

  acteurs: [
    {
      id: "bleu",
      type: "voiture",
      couleur: "gris",
      de: "W", // arrive de la gauche
      vers: "E",
      recul: 52,
      vitesse: 11,
      evite: false,
    },
  ],

  attendu: "arret",
  observation: "gauche",
  vitesseSure: 9.5,
  duree: 80,

  retours: {
    reussi: "Arrêt net, coup d'œil, et tu repars. C'est exactement le stop.",
    pas_arrete:
      "Tu as ralenti mais tu ne t'es pas arrêté. Au stop, les roues doivent cesser de tourner.",
  },
};
