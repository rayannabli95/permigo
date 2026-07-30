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
          family: "vehicle",
          type: "headlight-front",
          id: "phare-gauche",
          anchor: { x: 27, y: 50, scale: 0.9 },
          options: { lit: true, state: "idle" },
        },
        {
          family: "vehicle",
          type: "headlight-front",
          id: "phare-droit",
          anchor: { x: 73, y: 50, scale: 0.9 },
          options: { lit: false, state: "idle" },
        },
      ],
      prompt: "Les feux sont commandés. Lequel dois-tu signaler ?",
      answers: {
        kind: "target",
        options: [
          { id: "phare-gauche", label: "Celui de gauche" },
          { id: "phare-droit", label: "Celui de droite" },
        ],
      },
      solution: "phare-droit",
      hint: "Compare ce que les deux blocs émettent, pas leur forme.",
      retry: "Regarde la lumière produite, pas le dessin de l'optique.",
      success: "Celui de droite ne s'allume pas.",
      why: "Le contrôle à l'arrêt évite de découvrir trop tard que tu vois moins bien, et que les autres te voient mal.",
    },

    {
      id: "tyre-check",
      mode: "spot",
      scene: "exterieur-roue",
      assets: [
        {
          family: "vehicle",
          type: "tyre-wear",
          id: "pneu-a",
          anchor: { x: 27, y: 50, scale: 0.9 },
          options: { wear: 20, state: "idle" },
        },
        {
          family: "vehicle",
          type: "tyre-wear",
          id: "pneu-b",
          anchor: { x: 73, y: 50, scale: 0.9 },
          options: { wear: 88, state: "idle" },
        },
      ],
      prompt:
        "Lequel de ces deux pneus ne doit pas être considéré comme prêt à rouler ?",
      answers: {
        kind: "target",
        options: [
          { id: "pneu-a", label: "Celui de gauche" },
          { id: "pneu-b", label: "Celui de droite" },
        ],
      },
      solution: "pneu-b",
      hint: "Le témoin d'usure est une petite barre au fond des rainures.",
      retry:
        "Regarde la profondeur des rainures et le témoin, pas la propreté du pneu.",
      success: "Celui de droite est arrivé au témoin.",
      why: "Un pneu usé évacue moins bien l'eau et perd de l'adhérence, surtout au freinage.",
    },

    {
      id: "hood-check",
      mode: "diagnostic",
      scene: "capot-ouvert",
      assets: [
        {
          family: "vehicle",
          type: "hood-levels",
          anchor: { x: 50, y: 50, scale: 1 },
          options: { fluid: "brake", level: 18, state: "active" },
        },
      ],
      prompt:
        "Le liquide de frein est anormalement bas. Quelle décision prends-tu ?",
      answers: {
        kind: "choice",
        options: [
          { id: "top-up-drive", label: "Je complète au hasard et je pars" },
          { id: "ignore", label: "Le freinage ne dépend pas de ce niveau" },
          { id: "signal", label: "Je ne pars pas sans contrôle adapté" },
        ],
      },
      solution: "signal",
      hint: "Demande-toi d'où le liquide est parti avant de te demander comment le remettre.",
      retry: "Un niveau bas est un symptôme à comprendre, pas à masquer.",
      success: "Tu fais contrôler avant de rouler.",
      why: "Le circuit de freinage est un organe de sécurité. Un niveau qui baisse veut dire fuite ou plaquettes usées.",
    },
  ],

  outcome: {
    claim: "ready-to-practice",
    title: "Ton contrôle a du sens",
    recap: [
      "Le voyant qui reste allumé",
      "Le feu qui ne s'allume pas",
      "Le pneu arrivé au témoin",
      "Le niveau anormalement bas",
    ],
    body: "Tu es prêt·e à pratiquer ce tour de contrôle en leçon.",
    transfer:
      "À l'arrêt, montre ces quatre contrôles à ton enseignant et explique ce qui te ferait ne pas partir.",
  },
};

export default C1A_INSPECTION_360;
