/**
 * C1b — S'installer au poste de conduite.
 *
 * La mission qui porte le geste : l'élève EXPLORE d'abord les quatre réglages,
 * chacun lui dit à quoi il sert, puis il les refait dans l'ordre. C'est
 * l'exploration avant le geste qui donne la sensation de toucher — une bonne
 * case à trouver du premier coup n'en donne aucune.
 *
 * L'ordre est celui qu'on apprend en leçon : on se cale, on protège la nuque,
 * on prend le volant, on règle enfin ce qu'on regarde.
 */

export const C1B_POSTE_DE_CONDUITE = {
  id: "c1b-poste-de-conduite",
  competence: "C1b",
  phase: "preparation",
  certification: false,
  transmissions: ["manual", "automatic"],
  estimatedMinutes: 3,

  title: "Le poste de conduite",
  hook: "Quatre réglages avant de tourner la clé. Dans le désordre, ils ne servent à rien.",
  cta: "Prendre le poste",
  objective:
    "Régler son poste de conduite dans l'ordre, et savoir pourquoi cet ordre.",

  beats: [
    {
      id: "reglages",
      mode: "sequence",
      scene: "poste-conduite",
      assets: [
        {
          family: "photo",
          type: "poste-conduite",
          options: {
            alt: "Poste de conduite vu depuis le siège du conducteur",
            ratio: 1,
            // Un habitacle est déjà sombre : la nuit du CSS l'écraserait.
            lumiere: 0.98,
          },
        },
      ],
      prompt: "Règle ton poste de conduite, dans l'ordre.",
      answers: {
        kind: "zones",
        options: [
          {
            id: "siege",
            label: "Le siège",
            at: { x: 12, y: 62 },
            aide: "Recule ou avance jusqu'à enfoncer une pédale à fond sans tendre la jambe.",
          },
          {
            id: "appui-tete",
            label: "L'appui-tête",
            at: { x: 9, y: 22 },
            aide: "Son haut arrive au niveau du haut de ton crâne. Trop bas, il ne retient rien.",
          },
          {
            id: "volant",
            label: "Le volant",
            at: { x: 50, y: 52 },
            aide: "Bras légèrement pliés, poignets qui touchent le haut du volant sans décoller les épaules.",
          },
          {
            id: "retro-interieur",
            label: "Le rétroviseur intérieur",
            at: { x: 78, y: 14 },
            aide: "Toute la lunette arrière dedans, sans bouger la tête. Il se règle une fois installé.",
          },
        ],
      },
      ordre: ["siege", "appui-tete", "volant", "retro-interieur"],
      hint: "On part de ce qui porte le corps et on finit par ce qu'on regarde.",
      retry: "Pas encore. Règle d'abord ce qui te tient, tu verras ensuite.",
      success: "Siège, appui-tête, volant, rétroviseur.",
      why: "Chaque réglage déplace le suivant. Un rétroviseur réglé avant le siège est à refaire dès que tu bouges.",
    },

    {
      id: "pourquoi-ordre",
      mode: "diagnostic",
      scene: "poste-conduite",
      assets: [
        {
          family: "photo",
          type: "poste-conduite",
          options: {
            alt: "Poste de conduite vu depuis le siège du conducteur",
            ratio: 1,
            // Un habitacle est déjà sombre : la nuit du CSS l'écraserait.
            lumiere: 0.98,
          },
        },
      ],
      prompt:
        "Tu avances ton siège après avoir réglé tes rétroviseurs. Que fais-tu ?",
      answers: {
        kind: "choice",
        options: [
          { id: "rien", label: "Rien, les rétroviseurs ne bougent pas" },
          { id: "refaire", label: "Je refais mes rétroviseurs" },
          { id: "tete", label: "Je penche la tête pour retrouver l'angle" },
        ],
      },
      solution: "refaire",
      hint: "Ce n'est pas le miroir qui a bougé, c'est toi.",
      retry:
        "Le miroir n'a pas bougé, mais tes yeux si : ce que tu vois dedans a changé.",
      success: "Tu les refais.",
      why: "Un rétroviseur se règle depuis la position de conduite définitive. Sinon tu passes le trajet à compenser avec la tête, et tu quittes la route des yeux plus longtemps.",
    },
  ],

  outcome: {
    claim: "ready-to-practice",
    title: "Ton poste est à toi",
    recap: [
      "Le siège, jambe jamais tendue",
      "L'appui-tête au niveau du crâne",
      "Le volant, bras légèrement pliés",
      "Le rétroviseur, une fois installé",
    ],
    body: "Refais ces quatre réglages en montant dans la voiture, avant même de démarrer.",
    transfer:
      "À ta prochaine leçon, installe-toi seul et demande à ton enseignant de vérifier ta position.",
  },
};

export default C1B_POSTE_DE_CONDUITE;
