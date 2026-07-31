/**
 * C1a — Inspection 360.
 *
 * Donnée pure : aucun dessin, aucun `if`, aucune classe CSS. Les objets sont
 * désignés par leur famille et leur type dans la bibliothèque, leurs états par
 * les options des composants.
 *
 * Le tour de contrôle est identique en boîte manuelle et automatique : on
 * regarde la voiture, on ne la conduit pas. La mission ne porte donc aucune
 * surcharge de boîte, et c'est volontaire.
 */

export const C1A_INSPECTION_360 = {
  id: "c1a-inspection-360",
  competence: "C1a",
  phase: "preparation",
  certification: false,
  transmissions: ["manual", "automatic"],
  estimatedMinutes: 3,

  title: "Inspection 360",
  hook: "La voiture t'attend. Quatre détails décident si elle peut partir.",
  cta: "Commencer le contrôle",
  objective:
    "Décider si la voiture peut partir, après quatre contrôles de sécurité.",

  beats: [
    {
      id: "dashboard-alert",
      mode: "diagnostic",
      scene: "cockpit",
      assets: [
        {
          family: "dashboard",
          type: "instrument-cluster",
          anchor: { x: 50, y: 50, scale: 1 },
          options: {
            warning: "oil",
            lit: true,
            speed: 0,
            rpm: 0,
            state: "active",
          },
        },
      ],
      prompt: "Ce voyant rouge reste allumé après le contact. Que fais-tu ?",
      answers: {
        kind: "choice",
        options: [
          { id: "drive", label: "Je pars doucement et je surveille" },
          { id: "hide", label: "Je coupe l'affichage" },
          { id: "stop", label: "Je ne pars pas et je le signale" },
        ],
      },
      solution: "stop",
      hint: "Un voyant qui s'éteint après quelques secondes est un contrôle. Celui-ci reste.",
      retry:
        "Le voyant reste une alerte même si la voiture semble rouler normalement.",
      success: "Tu ne pars pas, et tu le dis.",
      why: "Une alerte d'huile persistante peut annoncer un défaut qui abîme le moteur et coupe le trajet.",
    },

    {
      id: "headlight-check",
      mode: "spot",
      scene: "exterieur-avant",
      assets: [
        {
          family: "photo",
          type: "voiture-avant",
          options: {
            alt: "L'avant d'une voiture, feux de croisement allumés du côté gauche seulement",
            glows: [{ x: 23, y: 54 }],
          },
        },
      ],
      prompt: "Tu allumes tes feux de croisement. Lequel ne s'allume pas ?",
      answers: {
        kind: "hotspot",
        options: [
          { id: "phare-gauche", label: "Le phare de gauche", at: { x: 23, y: 54 } },
          { id: "phare-droit", label: "Le phare de droite", at: { x: 45, y: 54 } },
          { id: "retroviseur", label: "Le rétroviseur", at: { x: 62, y: 42 } },
          { id: "roue", label: "La roue arrière", at: { x: 79, y: 63 } },
        ],
      },
      solution: "phare-droit",
      hint: "Un seul des deux éclaire vraiment le sol devant la voiture.",
      retry: "Compare les deux blocs à l'avant : un seul projette de la lumière.",
      success: "Celui de droite reste éteint.",
      why: "Un feu grillé, tu ne le vois jamais en roulant. Ça se contrôle à l'arrêt, avant de partir.",
    },

    {
      id: "tyre-check",
      mode: "spot",
      scene: "exterieur-roue",
      assets: [
        {
          family: "photo",
          type: "pneu",
          options: { alt: "Gros plan sur une roue et son pneu, vus de côté" },
        },
      ],
      prompt: "Où se lit l'usure d'un pneu ?",
      answers: {
        kind: "hotspot",
        options: [
          { id: "rainures", label: "Les rainures de la bande de roulement", at: { x: 52, y: 15 } },
          { id: "jante", label: "La jante", at: { x: 50, y: 53 } },
          { id: "flanc", label: "Le flanc du pneu", at: { x: 31, y: 57 } },
          { id: "carrosserie", label: "La carrosserie", at: { x: 14, y: 26 } },
        ],
      },
      solution: "rainures",
      hint: "Ce n'est pas la propreté du pneu qui compte, c'est ce qu'il reste de gomme.",
      retry: "Ni la jante ni le flanc ne disent l'usure. Regarde là où le pneu touche la route.",
      success: "Dans les rainures.",
      why: "Un témoin est logé au fond de chaque rainure. Quand la gomme arrive à son niveau, le pneu n'évacue plus l'eau et il faut le changer.",
    },

    {
      id: "hood-check",
      mode: "spot",
      scene: "capot-ouvert",
      assets: [
        {
          family: "photo",
          type: "moteur",
          options: {
            alt: "Compartiment moteur capot ouvert, avec la jauge et les bocaux de liquides",
          },
        },
      ],
      prompt: "Où lis-tu le niveau d'huile ?",
      answers: {
        kind: "hotspot",
        options: [
          { id: "jauge", label: "La jauge à huile", at: { x: 40, y: 70 } },
          { id: "refroidissement", label: "Le liquide de refroidissement", at: { x: 17, y: 62 } },
          { id: "frein", label: "Le liquide de frein", at: { x: 66, y: 46 } },
        ],
      },
      solution: "jauge",
      hint: "Un bouchon sert à remplir. Un seul repère sert à mesurer.",
      retry:
        "Celui-là est un autre liquide. Le bouchon rond sur le moteur sert à remplir, pas à mesurer : cherche une petite poignée qu'on tire, souvent jaune.",
      success: "La jauge.",
      why: "On la lit moteur froid et sur terrain plat, sinon l'huile est encore remontée et le niveau ment.",
    },
  ],

  outcome: {
    claim: "ready-to-practice",
    title: "Ton contrôle a du sens",
    recap: [
      "Le voyant qui reste allumé",
      "Le feu qui ne s'allume pas",
      "Où se lit l'usure d'un pneu",
      "Où se lit le niveau d'huile",
    ],
    body: "Tu sais quoi regarder avant de monter. Fais-le en vrai à ta prochaine leçon.",
    transfer:
      "À l'arrêt, montre ces quatre contrôles à ton enseignant et explique ce qui te ferait ne pas partir.",
  },
};

export default C1A_INSPECTION_360;
