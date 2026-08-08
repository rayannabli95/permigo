// Scénario — priorité à droite. De la DONNÉE, pas du code de jeu : le runner
// sait déjà installer un carrefour, un trafic et des zones. Une nouvelle
// situation, c'est ce fichier et rien d'autre.
//
// La leçon : au carrefour sans aucun panneau, celui qui vient de la droite
// passe. Donc l'élève doit ralentir, TOURNER LA TÊTE à droite, et laisser
// passer. Le moteur note les trois séparément.
//
// ⚠️ Le bâtiment d'angle masque la voiture : c'est voulu. Sans masque, il n'y
// a rien à observer, et « regarder à droite » n'est plus qu'une formalité.

export default {
  id: "priorite-droite-1",
  theme: "priorite-droite",
  tags: ["priorite"],
  environnement: "carrefour",

  titre: "Traverse le carrefour",
  consigne: "Aucun panneau. À toi de lire la route.",
  regle:
    "Sans panneau, la priorité est à droite. La voiture qui arrive de ta droite passe avant toi.",

  // Aucun panneau : c'est ce qui définit la priorité à droite.
  decor: { passages: ["S"], batiments: true, arbres: true },

  joueur: { branche: "S", recul: 46, vitesse: 11, vitesseMax: 16 },

  acteurs: [
    {
      id: "gris",
      type: "voiture",
      couleur: "gris",
      de: "E", // la droite du joueur
      vers: "W",
      recul: 34,
      vitesse: 9,
      evite: false, // il a la priorité, il ne s'efface pas
    },
  ],

  attendu: "ceder",
  observation: "droite",
  vitesseSure: 8, // 29 km/h à l'entrée du carrefour
  duree: 75,

  // Ce que l'élève lit à la fin, selon ce que le moteur a vu.
  retours: {
    reussi:
      "Tu as ralenti, regardé à droite et laissé passer. C'est exactement ça.",
    collision:
      "Le choc. La voiture venait de ta droite, elle passait avant toi.",
    refus_priorite:
      "Tu es passé devant. Sans panneau, celui qui vient de ta droite passe avant toi.",
    pas_regarde_droite:
      "Tu n'as pas tourné la tête à droite. C'est de là que vient le danger.",
    trop_vite:
      "Tu arrives trop vite. Un carrefour sans visibilité se prend au pas.",
    pas_arrete: "Il fallait t'arrêter.",
    trop_long: "Tu es resté sur place. Une fois la voie libre, tu repars.",
    hors_route: "Tu as quitté la route.",
  },
};
