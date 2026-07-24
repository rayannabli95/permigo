// Données statiques — mini-jeu « En situation » (mises en situation de conduite).
// Pas de Supabase → modifiable sans migration. Ajouter un scénario = ajouter un
// objet au tableau SITUATIONS (la scène est déclarative, rendue par
// src/components/eleve/situation-scene.js).
//
// Chaque entrée :
// {
//   id          : slug unique
//   theme       : 'giratoire'|'priorite-droite'|'stop'|'cede'|'feu'|'pieton'|'croisement'
//   difficulte  : 1..3
//   alt         : description de la scène pour lecteur d'écran
//   scene       : description déclarative (voir situation-scene.js)
//     kind      : 'croisement' | 'giratoire' | 'route' | 'autoroute' | 'insertion'
//                 ('insertion' = autoroute + bretelle d'insertion : un véhicule
//                 se place sur la bretelle via { bretelle: t }, t ∈ [0,1],
//                 1 = jonction avec la voie d'accélération)
//     signal    : { type:'stop'|'cede'|'prio'|'giratoire'|'feu', etat?:'orange', branch }
//     passage   : branche du passage piéton ('N'|'S'|'E'|'W') ou null
//     pieton    : { engage:boolean } ou null — dessiné sur le passage
//                 (engage=true → déjà sur la chaussée)
//     lanes2    : branche à 2 files d'entrée (giratoire) ou null
//     arbres    : liste de positions monde [x,y] (masques de visibilité / déco)
//     vehicules : [{ id, at:branche, d:distance, lane?, couleur, type?, clign?, tourne?, label? }]
//                 ou { id, angle:degrés } si le véhicule est sur l'anneau
//                 (lane? = décalage latéral de voie, ex. entrée à 2 files)
//                 (label? accepte aussi un emoji, ex. « 🚒 Pompiers » pour un
//                 véhicule prioritaire — même mécanique que le badge « Toi »)
//     ligne     : 'continue' sur une scène 'route' → ligne d'axe continue
//                 (au lieu des pointillés), pour les scénarios dépassement
//   question    : question courte au tutoiement
//   mode        : 'cartes' (2-4 cartes-réponses) | 'cible' (taper le véhicule)
//   reponses    : [{ id, label, ico?, veh? }] — veh = id du véhicule (mode cible)
//   bonne       : id de la bonne réponse
//   explication : la règle, 1-2 phrases simples au tutoiement
//   focus       : { veh } — qui surligner quand c'est faux (le prioritaire)
//   okAnim      : ordre de départ des véhicules après une bonne réponse
//                 [{ veh, delai?, clign?, avance? }] — sinon le joueur avance
//                 seul ; [] = personne ne bouge (ex. arrêt au feu) ;
//                 clign:'warning' = feux de détresse ; avance:0 = clignote
//                 sans bouger
// }

export const THEME_LABELS = {
  giratoire: "Giratoire",
  "priorite-droite": "Priorité à droite",
  stop: "Stop",
  cede: "Cédez le passage",
  feu: "Feux",
  pieton: "Piétons",
  croisement: "Croisements",
  distance: "Distances de sécurité",
  depassement: "Dépassement",
  prioritaire: "Véhicules prioritaires",
  autoroute: "Autoroute",
  cycliste: "Cyclistes",
  partage: "Partage de la route",
};

// Thème du jeu → thèmes « Mes fautes » (TAG_LABELS de utils/weak-points.js).
// Nourrit la révision ciblée du hub Réviser après chaque réponse.
export const THEME_WEAK_TAGS = {
  giratoire: ["rond_point", "priorite"],
  "priorite-droite": ["priorite"],
  stop: ["signalisation", "priorite"],
  cede: ["signalisation", "priorite"],
  feu: ["signalisation"],
  pieton: ["pieton"],
  croisement: ["priorite"],
  distance: ["vitesse"],
  depassement: ["signalisation"],
  prioritaire: ["priorite"],
  autoroute: ["vitesse", "signalisation"],
  cycliste: ["cycliste"],
  partage: ["courtoisie", "priorite"],
};

export const SITUATIONS = [
  // ─────────────────────────────────────────────────────────────
  // CE QUE LE MOTEUR DE SCÈNE SAIT DESSINER (renderSituationScene)
  // ⚠️ N'écris JAMAIS dans une question un élément que le moteur ne dessine pas.
  //
  // scene.kind : "route" | "croisement" | "autoroute" | "insertion" | "giratoire"
  // véhicule   : { id, at, d, lane?, type?, couleur?, label? }
  //   at      : "S" | "N" | "E" | "W"  (d'où il entre)
  //   d       : distance au centre (plus grand = plus loin en arrière)
  //   lane    : position latérale 0→1
  //   type    : voiture (défaut) | "moto" | "velo" | "bus" | "camion"
  //   couleur : "joueur" | "bleu" | "rouge" | "jaune" | "gris"
  // piéton     : scene.pieton = { engage: true|false }
  // panneau/feu: scene.signal = { type, branch, etat? }
  //   type    : "stop" | "cede" | "prio" | "giratoire" | "feu"
  //   feu     : + etat "rouge"|"orange"|"vert"
  //
  // ❌ LE MOTEUR NE SAIT PAS (interdit d'y faire référence dans une question) :
  //   panneau de vitesse (30/50/70) · sens interdit · la NUIT · la PLUIE/brouillard/neige
  // → Ajouter une de ces capacités = chantier moteur (Claude), pas une scène.
  // ─────────────────────────────────────────────────────────────
  // ── Giratoire ────────────────────────────────────────────────
  {
    id: "giratoire-entree",
    theme: "giratoire",
    difficulte: 1,
    alt: "Tu arrives à un giratoire. Une voiture rouge circule déjà sur l'anneau et arrive par ta gauche.",
    scene: {
      kind: "giratoire",
      signal: { type: "giratoire", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.6, couleur: "joueur", label: "Toi" },
        { id: "v1", angle: 195, couleur: "rouge" },
      ],
    },
    question: "Tu arrives au giratoire. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "cede", label: "Je cède le passage", ico: "✋" },
      { id: "engage", label: "Je m'engage direct" },
      { id: "accel", label: "J'accélère pour passer avant", ico: "⚡" },
    ],
    bonne: "cede",
    explication:
      "Ceux qui roulent déjà sur l'anneau ont la priorité — c'est le sens du panneau « cédez le passage » à l'entrée. Tu t'engages quand c'est libre.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 900 }],
  },
  {
    id: "giratoire-clignotant",
    theme: "giratoire",
    difficulte: 1,
    alt: "Tu roules sur l'anneau du giratoire et tu vas prendre la sortie juste devant toi.",
    scene: {
      kind: "giratoire",
      vehicules: [{ id: "moi", angle: 205, couleur: "joueur", label: "Toi" }],
    },
    question: "Tu prends la prochaine sortie. Quel clignotant ?",
    mode: "cartes",
    reponses: [
      { id: "droit", label: "Clignotant à droite" },
      { id: "gauche", label: "Clignotant à gauche" },
      { id: "aucun", label: "Aucun, je sors direct" },
    ],
    bonne: "droit",
    explication:
      "Pour sortir d'un giratoire, tu mets le clignotant à droite avant ta sortie : ceux qui attendent pour entrer savent qu'ils peuvent y aller.",
    okAnim: [{ veh: "moi", clign: "droit" }],
  },
  {
    id: "giratoire-file",
    theme: "giratoire",
    difficulte: 2,
    alt: "Tu arrives à un giratoire par une entrée à deux files. Tu vas prendre la troisième sortie, sur ta gauche.",
    scene: {
      kind: "giratoire",
      signal: { type: "giratoire", branch: "S" },
      lanes2: "S",
      vehicules: [
        {
          id: "moi",
          at: "S",
          d: 3.15,
          lane: 0.58,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question: "Tu vas prendre la 3e sortie, sur ta gauche. Tu te places où ?",
    mode: "cartes",
    reponses: [
      { id: "gauche", label: "File de gauche" },
      { id: "droite", label: "File de droite" },
    ],
    bonne: "gauche",
    explication:
      "Pour aller à gauche ou faire demi-tour, tu entres par la file de gauche. La file de droite sert à sortir tôt (1re ou 2e sortie).",
    okAnim: [{ veh: "moi", clign: "gauche" }],
  },

  // ── Priorité à droite ────────────────────────────────────────
  {
    id: "prio-droite-cible",
    theme: "priorite-droite",
    difficulte: 1,
    alt: "Croisement sans panneau ni feu. Une voiture bleue arrive par ta droite.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 1.75, couleur: "bleu" },
      ],
    },
    question: "Qui passe en premier ?",
    mode: "cible",
    reponses: [
      { id: "v1", veh: "v1", label: "La voiture bleue" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "v1",
    explication:
      "Pas de panneau, pas de feu : priorité à droite. La voiture bleue vient de ta droite, elle passe d'abord.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 950 }],
  },
  {
    id: "prio-droite-gauche",
    theme: "priorite-droite",
    difficulte: 2,
    alt: "Croisement sans signalisation. Une voiture rouge arrive par ta gauche.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "W", d: 1.75, couleur: "rouge" },
      ],
    },
    question: "Une voiture arrive par ta gauche. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "passe", label: "Je passe : je suis prioritaire" },
      { id: "laisse", label: "Je la laisse passer", ico: "✋" },
      { id: "stop", label: "Je m'arrête complètement", ico: "🛑" },
    ],
    bonne: "passe",
    explication:
      "Elle vient de ta gauche : c'est toi qui as la priorité à droite. Tu passes — en gardant un œil sur elle, au cas où.",
    focus: { veh: "moi" },
    okAnim: [{ veh: "moi" }, { veh: "v1", delai: 950 }],
  },

  // ── Stop ─────────────────────────────────────────────────────
  {
    id: "stop-desert",
    theme: "stop",
    difficulte: 1,
    alt: "Un panneau stop à ton intersection. Aucune voiture en vue, la route est dégagée.",
    scene: {
      kind: "croisement",
      signal: { type: "stop", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.7, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "La route est dégagée. Que fais-tu au stop ?",
    mode: "cartes",
    reponses: [
      { id: "arret", label: "Arrêt complet, puis je repars", ico: "🛑" },
      { id: "ralentis", label: "Je ralentis fort et je passe", ico: "🐢" },
      { id: "passe", label: "Je passe, c'est dégagé" },
    ],
    bonne: "arret",
    explication:
      "Au stop, l'arrêt complet est obligatoire, même si c'est désert : roues arrêtées à la ligne, tu contrôles, tu repars.",
    okAnim: [{ veh: "moi", delai: 700 }],
  },

  // ── Cédez le passage ─────────────────────────────────────────
  {
    id: "cede-moto",
    theme: "cede",
    difficulte: 1,
    alt: "Un panneau cédez-le-passage à ton intersection. Une moto arrive sur la route prioritaire, par ta droite.",
    scene: {
      kind: "croisement",
      signal: { type: "cede", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.8, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 2.1, couleur: "moto", type: "moto" },
      ],
    },
    question: "Une moto arrive. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "cede", label: "Je ralentis et je la laisse passer", ico: "✋" },
      { id: "arret", label: "Je m'arrête, c'est obligatoire", ico: "🛑" },
      { id: "passe", label: "Je passe avant elle", ico: "⚡" },
    ],
    bonne: "cede",
    explication:
      "Cédez le passage = tu laisses passer sans être obligé de t'arrêter. Tu t'arrêtes seulement si ça ne passe pas.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 850 }],
  },

  // ── Feux ─────────────────────────────────────────────────────
  {
    id: "feu-orange",
    theme: "feu",
    difficulte: 1,
    alt: "Le feu de ton intersection vient de passer à l'orange. Tu es encore assez loin pour freiner tranquillement.",
    scene: {
      kind: "croisement",
      signal: { type: "feu", etat: "orange", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.6, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Le feu passe à l'orange. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "arret", label: "Je m'arrête avant la ligne", ico: "🛑" },
      { id: "accel", label: "J'accélère pour passer", ico: "⚡" },
      { id: "continue", label: "Je continue normalement" },
    ],
    bonne: "arret",
    explication:
      "L'orange annonce le rouge : tu t'arrêtes, sauf si tu es trop engagé pour freiner sans danger. Là, tu as largement la place.",
    okAnim: [], // personne ne bouge : on reste à l'arrêt devant le feu
  },

  // ── Piétons ──────────────────────────────────────────────────
  {
    id: "pieton-engage",
    theme: "pieton",
    difficulte: 1,
    alt: "Ligne droite en ville. Un piéton est déjà engagé sur le passage piéton devant toi.",
    scene: {
      kind: "route",
      passage: "N",
      pieton: { engage: true },
      vehicules: [
        { id: "moi", at: "S", d: 2.2, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Un piéton traverse. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "arret",
        label: "Je m'arrête et je le laisse traverser",
        ico: "🛑",
      },
      { id: "contourne", label: "Je le contourne doucement" },
      { id: "klaxonne", label: "Je klaxonne pour prévenir", ico: "📢" },
    ],
    bonne: "arret",
    explication:
      "Un piéton engagé a toujours la priorité. Tu t'arrêtes le temps qu'il finisse de traverser.",
    focus: { pieton: true },
    okAnim: [{ veh: "pieton" }, { veh: "moi", delai: 1400 }],
  },
  {
    id: "pieton-bord",
    theme: "pieton",
    difficulte: 2,
    alt: "Un piéton attend au bord du passage piéton et regarde dans ta direction, prêt à traverser.",
    scene: {
      kind: "route",
      passage: "N",
      pieton: { engage: false },
      vehicules: [
        { id: "moi", at: "S", d: 2.2, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Il n'est pas encore engagé. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "ralentis",
        label: "Je ralentis et je le laisse traverser",
        ico: "🐢",
      },
      { id: "continue", label: "Je continue, il n'est pas engagé" },
      { id: "accel", label: "J'accélère avant qu'il traverse", ico: "⚡" },
    ],
    bonne: "ralentis",
    explication:
      "Un piéton qui montre qu'il veut traverser, tu dois le laisser passer. Tu ralentis et tu te tiens prêt à t'arrêter.",
    focus: { pieton: true },
    okAnim: [{ veh: "pieton" }, { veh: "moi", delai: 1400 }],
  },

  // ── Croisements ──────────────────────────────────────────────
  {
    id: "croisement-tourne-gauche",
    theme: "croisement",
    difficulte: 3,
    alt: "Croisement sans signalisation. Une voiture arrive en face de toi, clignotant mis : elle tourne à sa gauche. Toi, tu vas tout droit.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        {
          id: "v1",
          at: "N",
          d: 1.75,
          couleur: "gris",
          tourne: "gauche",
          clign: "gauche",
        },
      ],
    },
    question:
      "Elle tourne à sa gauche, toi tu vas tout droit. Qui passe en premier ?",
    mode: "cible",
    reponses: [
      { id: "moi", veh: "moi", label: "Toi" },
      { id: "v1", veh: "v1", label: "La voiture grise" },
    ],
    bonne: "moi",
    explication:
      "Celui qui tourne à gauche coupe la route d'en face : il cède le passage. Toi qui vas tout droit, tu passes d'abord.",
    focus: { veh: "moi" },
    okAnim: [{ veh: "moi" }, { veh: "v1", delai: 950 }],
  },
  {
    id: "croisement-visibilite",
    theme: "croisement",
    difficulte: 2,
    alt: "Tu approches d'un croisement masqué par des arbres sur ta droite. Aucune signalisation, aucune voiture en vue.",
    scene: {
      kind: "croisement",
      arbres: [
        [1.55, -1.5],
        [2.3, -1.65],
        [1.7, -2.35],
      ],
      vehicules: [
        { id: "moi", at: "S", d: 2.3, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Croisement sans visibilité. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "ralentis",
        label: "Je ralentis et je contrôle à droite",
        ico: "👀",
      },
      { id: "continue", label: "Je garde ma vitesse, personne en vue" },
      { id: "klaxonne", label: "Je klaxonne et je passe", ico: "📢" },
    ],
    bonne: "ralentis",
    explication:
      "Sans visibilité, une voiture peut surgir de ta droite — et elle serait prioritaire. Tu ralentis et tu contrôles avant de passer.",
  },

  // ── Priorité à droite (suite) ────────────────────────────────
  {
    id: "prio-droite-moto",
    theme: "priorite-droite",
    difficulte: 2,
    alt: "Croisement sans panneau ni feu. Un motard arrive par ta droite.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 1.85, couleur: "moto", type: "moto" },
      ],
    },
    question: "Un motard arrive par ta droite. Qui passe en premier ?",
    mode: "cible",
    reponses: [
      { id: "v1", veh: "v1", label: "Le motard" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "v1",
    explication:
      "La priorité à droite s'applique de la même façon à tous les véhicules. Le motard vient de ta droite : il passe en premier, comme le ferait une voiture.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 950 }],
  },

  // ── Cédez le passage (suite) ─────────────────────────────────
  {
    id: "cede-route-degagee",
    theme: "cede",
    difficulte: 1,
    alt: "Un panneau cédez-le-passage à ton intersection. La route est dégagée, aucune voiture en vue.",
    scene: {
      kind: "croisement",
      signal: { type: "cede", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.8, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "La route est dégagée au cédez-le-passage. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "ralentis",
        label: "Je ralentis, j'observe, puis je passe",
        ico: "🐢",
      },
      {
        id: "arret",
        label: "Je m'arrête complètement, comme au stop",
        ico: "🛑",
      },
      { id: "vitesse", label: "Je garde ma vitesse, c'est dégagé" },
    ],
    bonne: "ralentis",
    explication:
      "Cédez le passage n'oblige pas à un arrêt complet, contrairement au stop : tu ralentis, tu regardes, et tu t'engages si la voie est libre.",
    okAnim: [{ veh: "moi", delai: 600 }],
  },

  // ── Stop (suite) ─────────────────────────────────────────────
  {
    id: "stop-voiture-croise",
    theme: "stop",
    difficulte: 2,
    alt: "Panneau stop à ton intersection. Une voiture arrive sur la route prioritaire, par ta droite.",
    scene: {
      kind: "croisement",
      signal: { type: "stop", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.7, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 1.9, couleur: "bleu" },
      ],
    },
    question:
      "Tu es au stop. Une voiture arrive sur la route prioritaire. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "arret_laisse",
        label: "Arrêt complet, puis je la laisse passer",
        ico: "🛑",
      },
      { id: "arret_passe", label: "Arrêt complet, puis je passe avant elle" },
      { id: "ralentis", label: "Je ralentis fort sans m'arrêter", ico: "🐢" },
    ],
    bonne: "arret_laisse",
    explication:
      "Au stop, tu marques toujours un arrêt complet — et la route que tu croises reste prioritaire : tu laisses passer les véhicules qui y roulent avant de t'engager.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 900 }],
  },

  // ── Giratoire (suite) ────────────────────────────────────────
  {
    id: "giratoire-sortie-incertaine",
    theme: "giratoire",
    difficulte: 2,
    alt: "Une voiture roule sur l'anneau du giratoire, clignotant droit allumé, mais elle n'est pas encore sortie.",
    scene: {
      kind: "giratoire",
      signal: { type: "giratoire", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.6, couleur: "joueur", label: "Toi" },
        { id: "v1", angle: 195, couleur: "rouge", clign: "droit" },
      ],
    },
    question:
      "Elle a mis son clignotant droit mais elle est toujours sur l'anneau. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "cede",
        label: "Je continue de céder, elle n'est pas encore sortie",
        ico: "✋",
      },
      { id: "engage", label: "Je m'engage, elle va sortir devant moi" },
      { id: "accel", label: "J'accélère pour passer avant elle", ico: "⚡" },
    ],
    bonne: "cede",
    explication:
      "Un clignotant ne garantit rien : tant qu'elle roule sur l'anneau, elle est prioritaire. Tu attends qu'elle soit vraiment sortie pour t'engager.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 900 }],
  },
  {
    id: "giratoire-file-cede",
    theme: "giratoire",
    difficulte: 3,
    alt: "Entrée de giratoire à deux files. Tu es dans la file de droite pour sortir tout de suite. Une voiture roule déjà sur l'anneau, à ta gauche.",
    scene: {
      kind: "giratoire",
      signal: { type: "giratoire", branch: "S" },
      lanes2: "S",
      vehicules: [
        {
          id: "moi",
          at: "S",
          d: 3.15,
          lane: 0.87,
          couleur: "joueur",
          label: "Toi",
        },
        { id: "v1", angle: 195, couleur: "jaune" },
      ],
    },
    question:
      "Tu es en file de droite pour sortir tout de suite. Une voiture roule sur l'anneau. Qui passe ?",
    mode: "cible",
    reponses: [
      { id: "v1", veh: "v1", label: "La voiture jaune" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "v1",
    explication:
      "Peu importe ta file d'entrée : tout véhicule déjà engagé sur l'anneau reste prioritaire. Tu cèdes avant de t'engager, même pour sortir tout de suite.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 900 }],
  },

  // ── Feux (suite) ─────────────────────────────────────────────
  {
    id: "feu-vert-pieton-attarde",
    theme: "feu",
    difficulte: 2,
    alt: "Le feu passe au vert mais un piéton n'a pas fini de traverser le passage devant toi.",
    scene: {
      kind: "route",
      passage: "N",
      pieton: { engage: true },
      signal: { type: "feu", etat: "vert", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.4, couleur: "joueur", label: "Toi" },
      ],
    },
    question:
      "Le feu passe au vert, mais un piéton termine de traverser. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "attends", label: "Je m'arrête, il n'a pas terminé", ico: "🛑" },
      { id: "demarre", label: "Je démarre, j'ai le feu vert" },
      {
        id: "klaxonne",
        label: "Je klaxonne pour le faire accélérer",
        ico: "📢",
      },
    ],
    bonne: "attends",
    explication:
      "Le feu vert ne t'autorise pas à rouler si un piéton est encore engagé sur le passage. Tu attends qu'il ait fini de traverser.",
    focus: { pieton: true },
    okAnim: [],
  },

  // ── Croisements (suite) ──────────────────────────────────────
  {
    id: "croisement-tourne-gauche-toi",
    theme: "croisement",
    difficulte: 3,
    alt: "Croisement sans signalisation. Tu veux tourner à gauche ; une voiture arrive en face et continue tout droit.",
    scene: {
      kind: "croisement",
      vehicules: [
        {
          id: "moi",
          at: "S",
          d: 1.9,
          couleur: "joueur",
          label: "Toi",
          clign: "gauche",
        },
        { id: "v1", at: "N", d: 1.75, couleur: "bleu" },
      ],
    },
    question:
      "Tu veux tourner à gauche, une voiture arrive en face tout droit. Qui passe en premier ?",
    mode: "cible",
    reponses: [
      { id: "v1", veh: "v1", label: "La voiture bleue" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "v1",
    explication:
      "Quand tu tournes à gauche, tu coupes la trajectoire de la voiture qui vient en face : c'est toi qui cèdes. Elle passe d'abord.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 950 }],
  },

  // ── Distances de sécurité ────────────────────────────────────
  {
    id: "distance-securite-2s",
    theme: "distance",
    difficulte: 2,
    alt: "Ligne droite. Tu roules juste derrière une voiture grise, très proche d'elle.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "lead", at: "S", d: 1.35, couleur: "gris" },
        { id: "moi", at: "S", d: 2.55, couleur: "joueur", label: "Toi" },
      ],
    },
    question:
      "Tu roules collé à la voiture qui te précède. Que dois-tu faire ?",
    mode: "cartes",
    reponses: [
      {
        id: "ecart",
        label: "Je laisse au moins 2 secondes d'écart",
        ico: "🐢",
      },
      { id: "colle", label: "Je reste collé pour garder ma place" },
      { id: "double", label: "Je double dès que je peux", ico: "⚡" },
    ],
    bonne: "ecart",
    explication:
      "La règle des 2 secondes : compte le temps entre son passage et le tien à un repère fixe. En dessous, tu es trop près pour freiner à temps.",
    okAnim: [{ veh: "lead" }, { veh: "moi", delai: 200 }],
  },

  // ── Dépassement ──────────────────────────────────────────────
  {
    id: "depassement-ligne-continue",
    theme: "depassement",
    difficulte: 2,
    alt: "Ligne continue au sol. Une voiture grise roule lentement devant toi, une autre arrive en face.",
    scene: {
      kind: "route",
      ligne: "continue",
      vehicules: [
        { id: "lead", at: "S", d: 1.35, couleur: "gris" },
        { id: "moi", at: "S", d: 2.55, couleur: "joueur", label: "Toi" },
        { id: "face", at: "N", d: 2.6, couleur: "rouge" },
      ],
    },
    question:
      "Ligne continue, une voiture roule lentement devant toi. Peux-tu la dépasser ?",
    mode: "cartes",
    reponses: [
      { id: "non", label: "Non, la ligne continue interdit de doubler" },
      { id: "oui_rapide", label: "Oui, si je double vite", ico: "⚡" },
      { id: "oui_personne", label: "Oui, personne n'arrive de près" },
    ],
    bonne: "non",
    explication:
      "Une ligne continue interdit tout dépassement, même si la voie semble libre. Tu patientes jusqu'à une ligne discontinue.",
    okAnim: [{ veh: "lead" }, { veh: "moi", delai: 200 }],
  },

  // ── Véhicules prioritaires ───────────────────────────────────
  {
    id: "vehicule-prioritaire-pompiers",
    theme: "prioritaire",
    difficulte: 2,
    alt: "Croisement sans signalisation. Un camion de pompiers arrive par ta gauche, gyrophares et sirène allumés.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "W", d: 1.9, couleur: "rouge", label: "🚒 Pompiers" },
      ],
    },
    question:
      "Un véhicule de secours arrive, gyrophares et sirène allumés. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "cede", label: "Je m'arrête et je le laisse passer", ico: "✋" },
      {
        id: "passe",
        label: "Je passe, il vient de ma gauche, je suis prioritaire",
      },
      { id: "accel", label: "J'accélère pour passer avant lui", ico: "⚡" },
    ],
    bonne: "cede",
    explication:
      "Un véhicule prioritaire en intervention (pompiers, SAMU, police) passe avant tout le monde, même si la règle normale te donnerait la priorité. Tu le laisses passer.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 1000 }],
  },

  // ── Feux (lot 3) ─────────────────────────────────────────────
  {
    id: "feu-rouge-desert",
    theme: "feu",
    difficulte: 1,
    alt: "Le feu de ton intersection est rouge. Aucune voiture ni piéton en vue.",
    scene: {
      kind: "croisement",
      signal: { type: "feu", etat: "rouge", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.2, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Feu rouge, personne en vue. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "arret", label: "Je m'arrête et j'attends le vert", ico: "🛑" },
      { id: "passe", label: "Je passe, il n'y a personne" },
      { id: "pas", label: "Je passe au pas, prudemment", ico: "🐢" },
    ],
    bonne: "arret",
    explication:
      "Le feu rouge impose l'arrêt complet, même si tout est désert. Tu attends le vert derrière la ligne, sans exception.",
    okAnim: [], // on reste à l'arrêt devant le feu
  },
  {
    id: "feu-orange-engage",
    theme: "feu",
    difficulte: 3,
    alt: "Le feu passe à l'orange alors que tu es presque à sa hauteur, trop près pour freiner en douceur.",
    scene: {
      kind: "croisement",
      signal: { type: "feu", etat: "orange", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.45, couleur: "joueur", label: "Toi" },
      ],
    },
    question:
      "Le feu passe à l'orange au dernier moment, tu es presque dessus. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "passe", label: "Je passe : freiner ici serait dangereux" },
      { id: "pile", label: "Je freine à fond pour m'arrêter", ico: "🛑" },
      { id: "milieu", label: "Je m'arrête au milieu du carrefour" },
    ],
    bonne: "passe",
    explication:
      "L'orange impose l'arrêt SAUF si tu ne peux plus freiner sans danger. Trop engagé, tu passes — sans accélérer. C'est la nuance avec un orange vu de loin.",
    okAnim: [{ veh: "moi" }],
  },

  // ── Priorité à droite (lot 3) ────────────────────────────────
  {
    id: "feu-eteint-prio-droite",
    theme: "priorite-droite",
    difficulte: 3,
    alt: "Le feu de l'intersection est éteint, en panne. Une voiture bleue arrive par ta droite.",
    scene: {
      kind: "croisement",
      signal: { type: "feu", etat: "panne", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 1.75, couleur: "bleu" },
      ],
    },
    question: "Le feu est en panne, éteint. Qui passe en premier ?",
    mode: "cible",
    reponses: [
      { id: "v1", veh: "v1", label: "La voiture bleue" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "v1",
    explication:
      "Un feu éteint ou en panne ne compte plus : le croisement redevient une intersection sans signalisation. Priorité à droite — la voiture bleue passe d'abord.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 950 }],
  },
  {
    id: "prio-panneau-croix",
    theme: "priorite-droite",
    difficulte: 2,
    alt: "Un panneau triangulaire avec une croix noire annonce ton intersection. Une voiture jaune arrive par ta droite.",
    scene: {
      kind: "croisement",
      signal: { type: "prio", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 1.85, couleur: "jaune" },
      ],
    },
    question:
      "Ce panneau annonce l'intersection. Une voiture arrive à droite. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "laisse", label: "Je la laisse passer", ico: "✋" },
      { id: "passe", label: "Je passe : le panneau me rend prioritaire" },
      { id: "arret", label: "Je m'arrête, c'est comme un stop", ico: "🛑" },
    ],
    bonne: "laisse",
    explication:
      "La croix de Saint-André annonce une intersection SANS priorité particulière : c'est la priorité à droite qui s'applique. Elle vient de ta droite, elle passe.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 950 }],
  },
  {
    id: "camion-prio-droite",
    theme: "priorite-droite",
    difficulte: 1,
    alt: "Croisement sans panneau ni feu. Un camion arrive par ta droite.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 2.0, type: "camion" },
      ],
    },
    question: "Un camion arrive par ta droite. Qui passe en premier ?",
    mode: "cible",
    reponses: [
      { id: "v1", veh: "v1", label: "Le camion" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "v1",
    explication:
      "Gros ou petit, la règle ne change pas : il vient de ta droite, il passe en premier. Avec un camion, garde encore plus de marge — il démarre lentement.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 1100 }],
  },

  // ── Giratoire (lot 3) ────────────────────────────────────────
  {
    id: "giratoire-anneau-vide",
    theme: "giratoire",
    difficulte: 1,
    alt: "Tu arrives à un giratoire. L'anneau est complètement vide.",
    scene: {
      kind: "giratoire",
      signal: { type: "giratoire", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.6, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "L'anneau est vide. Dois-tu t'arrêter avant d'entrer ?",
    mode: "cartes",
    reponses: [
      {
        id: "ralentis",
        label: "Non : je ralentis, je contrôle et je m'engage",
        ico: "🐢",
      },
      {
        id: "arret",
        label: "Oui : arrêt obligatoire, comme au stop",
        ico: "🛑",
      },
      { id: "accel", label: "J'accélère pour entrer vite", ico: "⚡" },
    ],
    bonne: "ralentis",
    explication:
      "L'entrée d'un giratoire est un « cédez le passage », pas un stop : anneau libre, tu t'engages sans arrêt complet. Tu t'arrêtes seulement si quelqu'un arrive.",
    okAnim: [{ veh: "moi", delai: 400 }],
  },

  // ── Autoroute ────────────────────────────────────────────────
  {
    id: "autoroute-voie-droite",
    theme: "autoroute",
    difficulte: 1,
    alt: "Autoroute à deux voies. Tu roules sur la voie de gauche alors que la voie de droite est libre.",
    scene: {
      kind: "autoroute",
      vehicules: [
        {
          id: "moi",
          at: "S",
          d: 2.2,
          lane: -0.62,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question:
      "Tu roules à gauche et la voie de droite est libre. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "rabats", label: "Je me rabats sur la voie de droite" },
      { id: "reste", label: "Je reste à gauche, c'est plus fluide" },
      { id: "accel", label: "J'accélère pour rester devant", ico: "⚡" },
    ],
    bonne: "rabats",
    explication:
      "Sur autoroute, tu circules sur la voie la plus à droite. La voie de gauche sert uniquement à dépasser — rester dessus sans raison est une infraction.",
    okAnim: [{ veh: "moi", clign: "droit" }],
  },
  {
    id: "autoroute-bau-bouchon",
    theme: "autoroute",
    difficulte: 2,
    alt: "Bouchon sur l'autoroute : les deux voies sont à l'arrêt. La bande d'arrêt d'urgence, à droite, est libre.",
    scene: {
      kind: "autoroute",
      vehicules: [
        { id: "v1", at: "S", d: 1.2, lane: 0.05, couleur: "gris" },
        { id: "v2", at: "S", d: 0.5, lane: -0.62, couleur: "rouge" },
        {
          id: "moi",
          at: "S",
          d: 2.3,
          lane: 0.05,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question:
      "Ça bouchonne et la bande d'arrêt d'urgence est libre. Tu la prends ?",
    mode: "cartes",
    reponses: [
      { id: "non", label: "Non : elle est réservée aux urgences" },
      { id: "sortie", label: "Oui, juste pour rejoindre la sortie" },
      { id: "pas", label: "Oui, si je roule au pas", ico: "🐢" },
    ],
    bonne: "non",
    explication:
      "La bande d'arrêt d'urgence sert aux véhicules en panne et aux secours. Y rouler est interdit et dangereux, bouchon ou pas — tu patientes dans ta file.",
    okAnim: [
      { veh: "v1" },
      { veh: "v2", delai: 200 },
      { veh: "moi", delai: 500 },
    ],
  },
  {
    id: "autoroute-rabattement-camion",
    theme: "autoroute",
    difficulte: 2,
    alt: "Autoroute. Tu es sur la voie de gauche, tu viens de dépasser un camion qui roule sur la voie de droite, derrière toi.",
    scene: {
      kind: "autoroute",
      vehicules: [
        { id: "camion", at: "S", d: 1.4, lane: 0.05, type: "camion" },
        {
          id: "moi",
          at: "S",
          d: 2.6,
          lane: -0.62,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question:
      "Tu dépasses ce camion par la gauche. Quand te rabats-tu à droite ?",
    mode: "cartes",
    reponses: [
      {
        id: "retro",
        label: "Quand je le vois en entier dans mon rétro intérieur",
        ico: "👀",
      },
      { id: "ras", label: "Tout de suite, au ras de sa calandre", ico: "⚡" },
      { id: "reste", label: "Je reste à gauche jusqu'à ma sortie" },
    ],
    bonne: "retro",
    explication:
      "Tu te rabats sans couper la route du dépassé : quand tout le camion apparaît dans ton rétro intérieur, tu as la marge pour revenir à droite en sécurité.",
    okAnim: [{ veh: "moi", clign: "droit" }],
  },

  // ── Cyclistes ────────────────────────────────────────────────
  {
    id: "cycliste-depassement",
    theme: "cycliste",
    difficulte: 2,
    alt: "Route en ville. Un cycliste roule devant toi, sur le bord droit de ta voie.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "velo", at: "S", d: 0.9, lane: 0.62, type: "velo" },
        { id: "moi", at: "S", d: 2.1, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Tu veux dépasser ce cycliste. Quel écart dois-tu laisser ?",
    mode: "cartes",
    reponses: [
      { id: "metre", label: "Au moins 1 m en ville, 1,50 m hors agglo" },
      { id: "frole", label: "50 cm suffisent si je ralentis", ico: "🐢" },
      { id: "klaxonne", label: "Je klaxonne pour qu'il se serre", ico: "📢" },
    ],
    bonne: "metre",
    explication:
      "Pour doubler un cycliste, l'écart est obligatoire : 1 m en agglomération, 1,50 m hors agglomération. Pas la place ? Tu restes derrière lui.",
    focus: { veh: "velo" },
    okAnim: [{ veh: "velo" }, { veh: "moi", delai: 300 }],
  },

  // ── Distances (lot 3) ────────────────────────────────────────
  {
    id: "distance-camion-ecran",
    theme: "distance",
    difficulte: 2,
    alt: "Route. Tu roules derrière un camion qui bouche complètement ta vue vers l'avant.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "lead", at: "S", d: 1.25, type: "camion" },
        { id: "moi", at: "S", d: 2.75, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Ce camion te cache tout ce qui se passe devant. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "ecart", label: "J'augmente encore ma distance", ico: "🐢" },
      { id: "colle", label: "Je me colle pour me préparer à doubler" },
      { id: "klaxonne", label: "Je klaxonne pour qu'il accélère", ico: "📢" },
    ],
    bonne: "ecart",
    explication:
      "Plus le véhicule devant est gros, moins tu vois loin : tu allonges ta distance pour retrouver de la visibilité et du temps de réaction.",
    okAnim: [{ veh: "lead" }, { veh: "moi", delai: 250 }],
  },

  // ── Piétons (lot 3) ──────────────────────────────────────────
  {
    id: "pieton-hors-passage",
    theme: "pieton",
    difficulte: 2,
    alt: "Rue sans passage piéton à cet endroit. Un piéton traverse quand même la chaussée devant toi.",
    scene: {
      kind: "route",
      pieton: { engage: true },
      vehicules: [
        { id: "moi", at: "S", d: 2.2, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Il traverse en dehors de tout passage piéton. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "ralentis", label: "Je ralentis et je le laisse finir", ico: "🐢" },
      {
        id: "klaxonne",
        label: "Je klaxonne : il n'a rien à faire là",
        ico: "📢",
      },
      {
        id: "maintiens",
        label: "Je maintiens ma vitesse, je suis prioritaire",
      },
    ],
    bonne: "ralentis",
    explication:
      "Même en tort, un piéton reste fragile : tu ne forces jamais le passage. Tu ralentis, prêt à t'arrêter — un choc resterait dramatique, peu importe la règle.",
    focus: { pieton: true },
    okAnim: [{ veh: "pieton" }, { veh: "moi", delai: 1400 }],
  },

  // ── Véhicules prioritaires (lot 3) ───────────────────────────
  {
    id: "prioritaire-samu-derriere",
    theme: "prioritaire",
    difficulte: 2,
    alt: "Route en ville. Une ambulance arrive derrière toi, gyrophares et sirène allumés, en train de remonter par ta gauche.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "moi", at: "S", d: 1.7, couleur: "joueur", label: "Toi" },
        {
          id: "samu",
          at: "S",
          d: 3.0,
          lane: -0.39,
          couleur: "gris",
          label: "🚑 SAMU",
        },
      ],
    },
    question:
      "Une ambulance arrive derrière toi, sirène hurlante. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "serre", label: "Je serre à droite et je ralentis", ico: "✋" },
      { id: "accel", label: "J'accélère pour ne pas la gêner", ico: "⚡" },
      { id: "pile", label: "Je pile sur place", ico: "🛑" },
    ],
    bonne: "serre",
    explication:
      "Tu facilites toujours le passage d'un véhicule d'urgence : tu serres à droite et tu ralentis — sans piler ni t'arrêter n'importe où.",
    focus: { veh: "samu" },
    okAnim: [{ veh: "samu" }],
  },

  // ── Partage de la route ──────────────────────────────────────
  {
    id: "partage-bus-arret",
    theme: "partage",
    difficulte: 2,
    alt: "Rue en ville. Un bus à l'arrêt sur le bord droit met son clignotant gauche pour repartir.",
    scene: {
      kind: "route",
      vehicules: [
        {
          id: "bus",
          at: "S",
          d: 1.0,
          lane: 0.72,
          type: "bus",
          clign: "gauche",
        },
        {
          id: "moi",
          at: "S",
          d: 2.7,
          lane: 0.1,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question:
      "En ville, ce bus met son clignotant pour quitter son arrêt. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "laisse",
        label: "Je ralentis et je le laisse repartir",
        ico: "✋",
      },
      { id: "accel", label: "J'accélère pour passer avant lui", ico: "⚡" },
      {
        id: "klaxonne",
        label: "Je klaxonne pour garder le passage",
        ico: "📢",
      },
    ],
    bonne: "laisse",
    explication:
      "En agglomération, tu dois faciliter le départ d'un bus qui quitte son arrêt : tu ralentis et tu le laisses s'insérer devant toi.",
    focus: { veh: "bus" },
    okAnim: [
      { veh: "bus", clign: "gauche" },
      { veh: "moi", delai: 1100 },
    ],
  },

  // ── Cédez le passage (lot 4) ─────────────────────────────────
  {
    id: "cede-camion-gauche",
    theme: "cede",
    difficulte: 2,
    alt: "Panneau cédez-le-passage à ton intersection. Un camion arrive sur la route prioritaire, par ta gauche.",
    scene: {
      kind: "croisement",
      signal: { type: "cede", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.8, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "W", d: 2.1, type: "camion" },
      ],
    },
    question:
      "Le camion vient de ta gauche, mais toi tu as un cédez-le-passage. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "cede", label: "Je le laisse passer", ico: "✋" },
      { id: "passe", label: "Je passe : il vient de ma gauche" },
      { id: "arret", label: "Je m'arrête, c'est obligatoire", ico: "🛑" },
    ],
    bonne: "cede",
    explication:
      "Le panneau prime sur la règle de la droite : tu es sur la voie NON prioritaire, tu cèdes aux véhicules des deux côtés — même à ceux qui viennent de gauche.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 1200 }],
  },
  {
    id: "cede-deux-sens",
    theme: "cede",
    difficulte: 2,
    alt: "Cédez-le-passage à ton intersection. Deux voitures arrivent sur la route prioritaire, une de chaque côté.",
    scene: {
      kind: "croisement",
      signal: { type: "cede", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.8, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 2.0, couleur: "bleu" },
        { id: "v2", at: "W", d: 2.2, couleur: "jaune" },
      ],
    },
    question: "Au cédez-le-passage, ça vient des deux côtés. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "deux",
        label: "Je laisse passer les deux avant de m'engager",
        ico: "✋",
      },
      { id: "droite", label: "Je ne cède qu'à celle qui vient de droite" },
      { id: "arret", label: "Arrêt obligatoire dans tous les cas", ico: "🛑" },
    ],
    bonne: "deux",
    explication:
      "Au cédez-le-passage, tu cèdes aux véhicules des DEUX sens de la route prioritaire. L'arrêt complet n'est obligatoire que si ça ne passe pas.",
    focus: { veh: "v1" },
    okAnim: [
      { veh: "v1" },
      { veh: "v2", delai: 300 },
      { veh: "moi", delai: 1400 },
    ],
  },

  // ── Stop (lot 4) ─────────────────────────────────────────────
  {
    id: "stop-moto-gauche",
    theme: "stop",
    difficulte: 2,
    alt: "Panneau stop à ton intersection. Une moto arrive sur la route prioritaire, par ta gauche.",
    scene: {
      kind: "croisement",
      signal: { type: "stop", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 1.7, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "W", d: 2.0, couleur: "moto", type: "moto" },
      ],
    },
    question: "Au stop, la moto arrive par ta gauche. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "arret_laisse",
        label: "Arrêt complet, puis je la laisse passer",
        ico: "🛑",
      },
      {
        id: "arret_passe",
        label: "Arrêt complet, puis je passe : elle vient de gauche",
      },
      { id: "passe", label: "Je passe avant elle", ico: "⚡" },
    ],
    bonne: "arret_laisse",
    explication:
      "Le stop te place sur la voie non prioritaire : après l'arrêt complet, tu cèdes aux DEUX sens — y compris à ce qui vient de gauche.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 1000 }],
  },

  // ── Priorité à droite (lot 4) ────────────────────────────────
  {
    id: "prio-droite-double",
    theme: "priorite-droite",
    difficulte: 3,
    alt: "Croisement sans signalisation. Une voiture bleue arrive par ta droite, une rouge par ta gauche.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 1.75, couleur: "bleu" },
        { id: "v2", at: "W", d: 1.9, couleur: "rouge" },
      ],
    },
    question: "Une à droite, une à gauche. Qui passe en PREMIER ?",
    mode: "cible",
    reponses: [
      { id: "v1", veh: "v1", label: "La bleue (à ta droite)" },
      { id: "moi", veh: "moi", label: "Toi" },
      { id: "v2", veh: "v2", label: "La rouge (à ta gauche)" },
    ],
    bonne: "v1",
    explication:
      "Chacun cède à sa droite : la bleue n'a personne à sa droite, elle part. Puis toi (la rouge est à ta gauche), et la rouge en dernier.",
    focus: { veh: "v1" },
    okAnim: [
      { veh: "v1" },
      { veh: "moi", delai: 1000 },
      { veh: "v2", delai: 1900 },
    ],
  },
  {
    id: "prio-droite-pas-garantie",
    theme: "priorite-droite",
    difficulte: 3,
    alt: "Croisement sans signalisation. Une voiture arrive vite par ta gauche et ne semble pas ralentir.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "W", d: 1.5, couleur: "rouge" },
      ],
    },
    question:
      "Tu es prioritaire, mais elle arrive vite sans ralentir. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "prudence",
        label: "Je ralentis et je la laisse passer",
        ico: "✋",
      },
      { id: "force", label: "Je passe : je suis dans mon droit" },
      { id: "klaxonne", label: "Je klaxonne et je passe", ico: "📢" },
    ],
    bonne: "prudence",
    explication:
      "La priorité, tu la prends seulement quand l'autre la respecte. Un accident « dans ton droit » reste un accident : tu lèves le pied et tu laisses passer.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 1100 }],
  },

  // ── Giratoire (lot 4) ────────────────────────────────────────
  {
    id: "giratoire-deux-voitures",
    theme: "giratoire",
    difficulte: 2,
    alt: "Tu arrives à un giratoire. Deux voitures se suivent sur l'anneau et vont passer devant ton entrée.",
    scene: {
      kind: "giratoire",
      signal: { type: "giratoire", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.6, couleur: "joueur", label: "Toi" },
        { id: "v1", angle: 265, couleur: "rouge" },
        { id: "v2", angle: 180, couleur: "jaune" },
      ],
    },
    question: "Deux voitures se suivent sur l'anneau. Tu t'engages quand ?",
    mode: "cartes",
    reponses: [
      {
        id: "apres",
        label: "Quand les deux sont passées",
        ico: "✋",
      },
      { id: "entre", label: "Je me glisse entre les deux", ico: "⚡" },
      { id: "avant", label: "Juste avant la première" },
    ],
    bonne: "apres",
    explication:
      "Tout ce qui roule sur l'anneau est prioritaire. Un créneau trop court entre deux voitures, c'est un freinage d'urgence pour la seconde — tu attends que ce soit franc.",
    focus: { veh: "v1" },
    okAnim: [
      { veh: "v1" },
      { veh: "v2", delai: 500 },
      { veh: "moi", delai: 1600 },
    ],
  },

  // ── Feux (lot 4) ─────────────────────────────────────────────
  {
    id: "feu-vert-libre",
    theme: "feu",
    difficulte: 1,
    alt: "Le feu de ton intersection est vert, le carrefour est complètement dégagé.",
    scene: {
      kind: "croisement",
      signal: { type: "feu", etat: "vert", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.3, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Feu vert, carrefour dégagé. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "passe", label: "Je passe, en restant attentif" },
      { id: "arret", label: "Je marque un arrêt de sécurité", ico: "🛑" },
      {
        id: "fort",
        label: "Je ralentis fortement, on ne sait jamais",
        ico: "🐢",
      },
    ],
    bonne: "passe",
    explication:
      "Feu vert + carrefour dégagé : tu passes à allure normale, un coup d'œil de chaque côté. T'arrêter au vert surprend ceux qui te suivent — c'est ça, le danger.",
    okAnim: [{ veh: "moi" }],
  },

  // ── Dépassement (lot 4) ──────────────────────────────────────
  {
    id: "depassement-discontinue",
    theme: "depassement",
    difficulte: 1,
    alt: "Route à double sens avec ligne discontinue. Une voiture lente devant toi, personne en face.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "lead", at: "S", d: 1.35, couleur: "gris" },
        { id: "moi", at: "S", d: 2.55, couleur: "joueur", label: "Toi" },
      ],
    },
    question:
      "Ligne discontinue, personne en face. Peux-tu doubler cette voiture lente ?",
    mode: "cartes",
    reponses: [
      {
        id: "oui",
        label: "Oui : rétros, clignotant, et je double",
        ico: "👀",
      },
      { id: "non", label: "Non, doubler est interdit en ville" },
      { id: "klaxonne", label: "Je klaxonne pour qu'elle accélère", ico: "📢" },
    ],
    bonne: "oui",
    explication:
      "La ligne discontinue autorise le dépassement si la voie est libre et la visibilité bonne. D'abord les contrôles : rétros, angle mort, clignotant.",
    okAnim: [{ veh: "lead" }, { veh: "moi", delai: 150, clign: "gauche" }],
  },
  {
    id: "depassement-face",
    theme: "depassement",
    difficulte: 2,
    alt: "Ligne discontinue. Une voiture lente devant toi, mais une autre arrive en face, assez proche.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "lead", at: "S", d: 1.35, couleur: "gris" },
        { id: "moi", at: "S", d: 2.55, couleur: "joueur", label: "Toi" },
        { id: "face", at: "N", d: 1.9, couleur: "rouge" },
      ],
    },
    question:
      "La ligne est discontinue, mais une voiture arrive en face. Tu doubles ?",
    mode: "cartes",
    reponses: [
      {
        id: "non",
        label: "Non : je reste derrière, ça ne passe pas",
        ico: "✋",
      },
      { id: "vite", label: "Oui, en accélérant fort", ico: "⚡" },
      { id: "phares", label: "Un appel de phares et j'y vais" },
    ],
    bonne: "non",
    explication:
      "La discontinue AUTORISE, elle n'oblige à rien : tu ne doubles que si la voie d'en face est libre sur toute la manœuvre. Là, elle ne l'est pas.",
    focus: { veh: "face" },
    okAnim: [
      { veh: "lead" },
      { veh: "face", delai: 100 },
      { veh: "moi", delai: 300 },
    ],
  },

  // ── Cyclistes (lot 4) ────────────────────────────────────────
  {
    id: "cycliste-croisement-droite",
    theme: "cycliste",
    difficulte: 2,
    alt: "Croisement sans signalisation. Un cycliste arrive par ta droite.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "velo", at: "E", d: 1.6, type: "velo" },
      ],
    },
    question: "Un cycliste arrive par ta droite. Qui passe en premier ?",
    mode: "cible",
    reponses: [
      { id: "velo", veh: "velo", label: "Le cycliste" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "velo",
    explication:
      "La priorité à droite vaut pour TOUS les véhicules, vélo compris. Il passe en premier — et lui couper la route le met en danger, pas toi.",
    focus: { veh: "velo" },
    okAnim: [{ veh: "velo" }, { veh: "moi", delai: 1100 }],
  },
  {
    id: "giratoire-velo-anneau",
    theme: "cycliste",
    difficulte: 2,
    alt: "Tu arrives à un giratoire. Un cycliste circule déjà sur l'anneau.",
    scene: {
      kind: "giratoire",
      signal: { type: "giratoire", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.6, couleur: "joueur", label: "Toi" },
        { id: "velo", angle: 250, type: "velo" },
      ],
    },
    question: "Un cycliste tourne sur l'anneau. Qui passe ?",
    mode: "cible",
    reponses: [
      { id: "velo", veh: "velo", label: "Le cycliste" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "velo",
    explication:
      "Sur l'anneau, le cycliste est prioritaire comme n'importe quel véhicule. Tu attends qu'il ait passé ta branche avant de t'engager.",
    focus: { veh: "velo" },
    okAnim: [{ veh: "velo" }, { veh: "moi", delai: 1200 }],
  },

  // ── Piétons (lot 4) ──────────────────────────────────────────
  {
    id: "pieton-masque-bus",
    theme: "pieton",
    difficulte: 3,
    alt: "Un bus est arrêté sur le côté droit, juste avant un passage piéton. Un piéton traverse, à moitié caché par le bus. Tu t'apprêtes à doubler le bus.",
    scene: {
      kind: "route",
      passage: "N",
      pieton: { engage: true },
      vehicules: [
        { id: "bus", at: "S", d: 1.0, lane: 0.72, type: "bus" },
        {
          id: "moi",
          at: "S",
          d: 2.7,
          lane: 0.1,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question: "Tu doubles ce bus à l'arrêt. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "pas",
        label: "Je passe au pas : un piéton peut surgir devant le bus",
        ico: "🐢",
      },
      { id: "vite", label: "Je passe vite pour ne pas gêner", ico: "⚡" },
      { id: "klaxonne", label: "Je klaxonne en passant", ico: "📢" },
    ],
    bonne: "pas",
    explication:
      "Un bus à l'arrêt, c'est un écran : il cache le passage piéton et ceux qui s'y engagent. Tu doubles au pas, prêt à t'arrêter net.",
    focus: { pieton: true },
    okAnim: [{ veh: "pieton" }, { veh: "moi", delai: 1500 }],
  },

  // ── Véhicules prioritaires (lot 4) ───────────────────────────
  {
    id: "prioritaire-feu-vert",
    theme: "prioritaire",
    difficulte: 3,
    alt: "Ton feu est vert, mais une voiture de police en intervention, gyrophares et sirène, arrive par ta gauche.",
    scene: {
      kind: "croisement",
      signal: { type: "feu", etat: "vert", branch: "S" },
      vehicules: [
        { id: "moi", at: "S", d: 2.3, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "W", d: 1.9, couleur: "gris", label: "🚓 Police" },
      ],
    },
    question:
      "Ton feu est vert, mais la police déboule en intervention. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      { id: "cede", label: "Je la laisse passer malgré mon vert", ico: "✋" },
      { id: "passe", label: "Je passe : j'ai le feu vert" },
      { id: "accel", label: "J'accélère pour dégager le carrefour", ico: "⚡" },
    ],
    bonne: "cede",
    explication:
      "Gyrophares + sirène = le véhicule d'urgence passe avant tout le monde, même quand ton feu est vert. Tu restes derrière ta ligne.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 1200 }],
  },

  // ── Autoroute (lot 4) ────────────────────────────────────────
  {
    id: "autoroute-distance-traits",
    theme: "autoroute",
    difficulte: 1,
    alt: "Autoroute, tu suis une voiture sur la voie de droite. La bande d'arrêt d'urgence est marquée de traits réguliers.",
    scene: {
      kind: "autoroute",
      vehicules: [
        { id: "lead", at: "S", d: 1.2, lane: 0.05, couleur: "gris" },
        {
          id: "moi",
          at: "S",
          d: 2.4,
          lane: 0.05,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question: "À 130 km/h, quelle distance avec celui de devant ?",
    mode: "cartes",
    reponses: [
      {
        id: "traits",
        label: "Au moins 2 traits de la bande d'arrêt d'urgence",
      },
      { id: "longueur", label: "Une longueur de voiture suffit" },
      {
        id: "colle",
        label: "Le plus près possible, pour l'aspiration",
        ico: "⚡",
      },
    ],
    bonne: "traits",
    explication:
      "Le repère officiel : un trait de rive + un intervalle ≈ 45 m. Deux traits ≈ 90 m — c'est tes 2 secondes de sécurité à 130 km/h.",
    okAnim: [{ veh: "lead" }, { veh: "moi", delai: 250 }],
  },
  {
    id: "autoroute-panne-corridor",
    theme: "autoroute",
    difficulte: 2,
    alt: "Autoroute. Une voiture est arrêtée sur la bande d'arrêt d'urgence, feux de détresse allumés. Tu arrives sur la voie de droite.",
    scene: {
      kind: "autoroute",
      vehicules: [
        {
          id: "panne",
          at: "S",
          d: 1.2,
          lane: 0.7,
          couleur: "rouge",
          clign: "warning",
        },
        {
          id: "moi",
          at: "S",
          d: 2.5,
          lane: 0.05,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question:
      "Une voiture est en panne sur la bande d'arrêt d'urgence. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "ecarte",
        label: "Je me déporte à gauche si possible, sinon je ralentis",
        ico: "✋",
      },
      { id: "rien", label: "Rien : elle n'est pas sur ma voie" },
      { id: "klaxonne", label: "Je klaxonne en passant", ico: "📢" },
    ],
    bonne: "ecarte",
    explication:
      "C'est le « corridor de sécurité » : face à un véhicule arrêté sur la BAU, tu changes de voie ou tu ralentis fortement. Des gens sont peut-être debout à côté.",
    focus: { veh: "panne" },
    okAnim: [{ veh: "moi", clign: "gauche" }],
  },

  // ── Distances (lot 4) ────────────────────────────────────────
  {
    id: "distance-moto",
    theme: "distance",
    difficulte: 2,
    alt: "Route. Tu roules derrière une moto.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "lead", at: "S", d: 1.4, couleur: "moto", type: "moto" },
        { id: "moi", at: "S", d: 2.3, couleur: "joueur", label: "Toi" },
      ],
    },
    question: "Tu suis une moto. Ta distance de sécurité ?",
    mode: "cartes",
    reponses: [
      { id: "plus", label: "Encore plus grande qu'avec une voiture" },
      { id: "meme", label: "La même que d'habitude" },
      { id: "moins", label: "Plus petite : elle est fine, je vois devant" },
    ],
    bonne: "plus",
    explication:
      "Une moto freine plus court qu'une voiture et son pilote est à découvert. Tu allonges ta distance — s'il chute, il te faut la place de l'éviter.",
    okAnim: [{ veh: "lead" }, { veh: "moi", delai: 250 }],
  },

  // ── Partage de la route (lot 4) ──────────────────────────────
  {
    id: "partage-warnings-bouchon",
    theme: "partage",
    difficulte: 2,
    alt: "Tu arrives sur une file de voitures à l'arrêt, un bouchon net devant toi.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "lead", at: "S", d: 1.2, couleur: "gris" },
        { id: "moi", at: "S", d: 2.4, couleur: "joueur", label: "Toi" },
      ],
    },
    question:
      "Bouchon net devant toi. Comment prévenir ceux qui arrivent derrière ?",
    mode: "cartes",
    reponses: [
      { id: "warnings", label: "J'allume mes feux de détresse" },
      { id: "klaxonne", label: "Je klaxonne plusieurs fois", ico: "📢" },
      { id: "rien", label: "Rien : ils verront bien" },
    ],
    bonne: "warnings",
    explication:
      "Tes feux de détresse préviennent ceux qui arrivent lancés derrière toi qu'il se passe quelque chose. C'est LE réflexe en arrivant sur un bouchon.",
    okAnim: [{ veh: "moi", clign: "warning", avance: 0 }],
  },

  // ── Croisements (lot 4) ──────────────────────────────────────
  {
    id: "croisement-stop-en-face",
    theme: "croisement",
    difficulte: 2,
    alt: "La voiture d'en face a un panneau stop et tourne à sa gauche, clignotant allumé. Toi, tu n'as aucun panneau et tu vas tout droit.",
    scene: {
      kind: "croisement",
      signal: { type: "stop", branch: "N" },
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        {
          id: "v1",
          at: "N",
          d: 1.75,
          couleur: "gris",
          tourne: "gauche",
          clign: "gauche",
        },
      ],
    },
    question:
      "Elle a un stop et tourne à sa gauche. Toi, aucun panneau. Qui passe ?",
    mode: "cible",
    reponses: [
      { id: "moi", veh: "moi", label: "Toi" },
      { id: "v1", veh: "v1", label: "La voiture grise" },
    ],
    bonne: "moi",
    explication:
      "Le stop est pour ELLE : tu es sur la route prioritaire, tu passes. Garde quand même un œil — un stop grillé ne se voit qu'au dernier moment.",
    focus: { veh: "moi" },
    okAnim: [{ veh: "moi" }, { veh: "v1", delai: 1100 }],
  },

  // ── Autoroute : bretelle d'insertion (lot 5) ─────────────────
  {
    id: "bretelle-priorite",
    theme: "autoroute",
    difficulte: 2,
    alt: "Tu arrives sur l'autoroute par la bretelle d'insertion. Une voiture roule déjà sur la voie de droite de l'autoroute.",
    scene: {
      kind: "insertion",
      vehicules: [
        {
          id: "moi",
          bretelle: 0.55,
          couleur: "joueur",
          label: "Toi",
        },
        { id: "v1", at: "S", d: 2.2, lane: 0.05, couleur: "bleu" },
      ],
    },
    question: "Tu arrives par la bretelle. Qui est prioritaire ?",
    mode: "cible",
    reponses: [
      { id: "v1", veh: "v1", label: "La voiture sur l'autoroute" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "v1",
    explication:
      "Ceux qui roulent déjà sur l'autoroute sont prioritaires. Toi, tu règles TA vitesse sur la voie d'accélération pour t'insérer sans les gêner.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 900, clign: "gauche" }],
  },
  {
    id: "bretelle-vitesse",
    theme: "autoroute",
    difficulte: 1,
    alt: "Tu es sur la voie d'accélération de l'autoroute. Une voiture roule au loin sur la voie de gauche.",
    scene: {
      kind: "insertion",
      vehicules: [
        { id: "v1", at: "S", d: 2.8, lane: -0.62, couleur: "gris" },
        {
          id: "moi",
          at: "S",
          d: 0.2,
          lane: 0.7,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question: "Tu es sur la voie d'accélération. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "accelere",
        label: "J'accélère pour prendre la vitesse du trafic",
        ico: "⚡",
      },
      { id: "ralentis", label: "Je ralentis pour bien regarder", ico: "🐢" },
      { id: "arret", label: "Je m'arrête et j'attends un trou", ico: "🛑" },
    ],
    bonne: "accelere",
    explication:
      "La voie d'accélération sert à atteindre la vitesse du flux AVANT de t'insérer. T'y traîner ou t'y arrêter oblige à repartir de zéro face à des voitures à 130.",
    okAnim: [{ veh: "moi", clign: "gauche" }],
  },
  {
    id: "bretelle-clignotant",
    theme: "autoroute",
    difficulte: 1,
    alt: "Tu es sur la bretelle d'insertion, proche de la jonction avec l'autoroute.",
    scene: {
      kind: "insertion",
      vehicules: [
        {
          id: "moi",
          bretelle: 0.75,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question: "Pour t'insérer sur l'autoroute, quel clignotant ?",
    mode: "cartes",
    reponses: [
      { id: "gauche", label: "Clignotant à gauche" },
      { id: "droit", label: "Clignotant à droite" },
      { id: "aucun", label: "Aucun : la voie m'y emmène toute seule" },
    ],
    bonne: "gauche",
    explication:
      "Clignotant à GAUCHE pendant toute l'insertion : tu préviens ceux qui arrivent que tu vas rejoindre leur voie.",
    okAnim: [{ veh: "moi", clign: "gauche" }],
  },
  {
    id: "bretelle-faciliter",
    theme: "autoroute",
    difficulte: 2,
    alt: "Tu roules sur la voie de droite de l'autoroute. Une voiture s'insère depuis la bretelle, et ta voie de gauche est libre.",
    scene: {
      kind: "insertion",
      vehicules: [
        { id: "v1", bretelle: 0.5, couleur: "rouge", clign: "gauche" },
        {
          id: "moi",
          at: "S",
          d: 2.3,
          lane: 0.05,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question: "Elle s'insère et ta voie de gauche est libre. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "deporte",
        label: "Je me déporte à gauche pour lui faire de la place",
        ico: "✋",
      },
      { id: "maintiens", label: "Je maintiens : je suis prioritaire" },
      { id: "accelere", label: "J'accélère pour passer avant elle", ico: "⚡" },
    ],
    bonne: "deporte",
    explication:
      "Tu es prioritaire, mais faciliter l'insertion est le bon réflexe : voie de gauche libre → tu te déportes. Sinon, tu ajustes ta vitesse.",
    focus: { veh: "v1" },
    okAnim: [
      { veh: "moi", clign: "gauche" },
      { veh: "v1", delai: 700 },
    ],
  },
  {
    id: "bretelle-fin-voie",
    theme: "autoroute",
    difficulte: 3,
    alt: "La voie d'accélération se termine devant toi. Des voitures se suivent sur la voie de droite de l'autoroute et personne ne te laisse entrer.",
    scene: {
      kind: "insertion",
      vehicules: [
        { id: "v1", at: "S", d: -0.3, lane: 0.05, couleur: "gris" },
        { id: "v2", at: "S", d: 1.3, lane: 0.05, couleur: "bleu" },
        {
          id: "moi",
          at: "S",
          d: -0.9,
          lane: 0.7,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question:
      "La voie d'accélération se termine et personne ne te laisse entrer. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "ralentis",
        label: "Je ralentis, quitte à m'arrêter en bout de voie",
        ico: "🐢",
      },
      { id: "force", label: "Je force le passage : ils doivent me laisser" },
      {
        id: "bau",
        label: "Je continue sur la bande d'arrêt d'urgence",
        ico: "⚡",
      },
    ],
    bonne: "ralentis",
    explication:
      "Ni forcer, ni rouler sur la BAU : en dernier recours tu ralentis, voire tu t'arrêtes en bout de voie, clignotant à gauche, et tu repars dès qu'un créneau s'ouvre.",
    focus: { veh: "v1" },
    okAnim: [
      { veh: "v1" },
      { veh: "v2", delai: 250 },
      { veh: "moi", delai: 1100, clign: "gauche" },
    ],
  },

  // ── Vitesse (nouveau lot 1) ──────────────────────────────────
  {
    id: "vitesse-ville-panneau-30",
    theme: "vitesse",
    difficulte: 1,
    alt: "Rue droite. Un bus roule devant ta voiture.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "bus", at: "S", d: 1.0, lane: 0.72, type: "bus" },
        {
          id: "moi",
          at: "S",
          d: 2.7,
          lane: 0.1,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question:
      "Dans cette rue en ville, la vitesse est limitée à 30 km/h. Quelle vitesse maximale ?",
    mode: "cartes",
    reponses: [
      { id: "trente", label: "30 km/h" },
      { id: "cinquante", label: "50 km/h, comme partout en ville" },
      { id: "quarante", label: "40 km/h si la rue est dégagée" },
    ],
    bonne: "trente",
    explication:
      "La limite de 30 km/h s'applique dans toute la rue : c'est un maximum, même si la rue est dégagée. Tu ralentis encore si les conditions l'exigent.",
    okAnim: [{ veh: "bus" }, { veh: "moi", delai: 300 }],
  },
  {
    id: "vitesse-campagne-panneau-70",
    theme: "vitesse",
    difficulte: 1,
    alt: "Route droite bordée d'arbres. Ta voiture circule seule.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "moi", at: "S", d: 2.2, couleur: "joueur", label: "Toi" },
      ],
    },
    question:
      "Sur cette route de campagne, la vitesse est limitée à 70 km/h. Jusqu'à quelle vitesse peux-tu rouler ?",
    mode: "cartes",
    reponses: [
      { id: "soixante-dix", label: "70 km/h maximum" },
      { id: "quatre-vingts", label: "80 km/h, la limite habituelle" },
      { id: "quatre-vingt-dix", label: "90 km/h si la route est vide" },
    ],
    bonne: "soixante-dix",
    explication:
      "La limitation de 70 km/h prime sur la limite générale : ici, tu ne dépasses pas 70 km/h. C'est un plafond, pas une vitesse à atteindre.",
    okAnim: [{ veh: "moi" }],
  },

  // ── Intersections en T et priorité (nouveau lot 2) ───────────
  {
    id: "intersection-t-prio-droite",
    theme: "priorite-droite",
    difficulte: 1,
    alt: "Croisement sans panneau ni feu. Une voiture bleue arrive par ta droite.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 1.75, couleur: "bleu" },
      ],
    },
    question:
      "Tu arrives au bout d'une route, à un carrefour en T sans panneau. Une voiture vient de droite. Qui passe ?",
    mode: "cible",
    reponses: [
      { id: "v1", veh: "v1", label: "La voiture bleue" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "v1",
    explication:
      "La forme en T ne crée aucune priorité. Sans panneau ni feu, la priorité à droite s'applique : la voiture bleue passe d'abord.",
    focus: { veh: "v1" },
    okAnim: [{ veh: "v1" }, { veh: "moi", delai: 950 }],
  },
  {
    id: "intersection-t-vehicule-gauche",
    theme: "priorite-droite",
    difficulte: 2,
    alt: "Croisement sans panneau ni feu. Une voiture rouge arrive par ta gauche.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "W", d: 1.75, couleur: "rouge" },
      ],
    },
    question:
      "À une intersection en T sans panneau, une voiture vient de ta gauche. Qui passe ?",
    mode: "cible",
    reponses: [
      { id: "moi", veh: "moi", label: "Toi" },
      { id: "v1", veh: "v1", label: "La voiture rouge" },
    ],
    bonne: "moi",
    explication:
      "Une route qui continue tout droit n'est pas prioritaire par sa forme. La voiture vient de ta gauche : tu es à sa droite, donc tu passes d'abord.",
    focus: { veh: "moi" },
    okAnim: [{ veh: "moi" }, { veh: "v1", delai: 950 }],
  },
  {
    id: "intersection-t-cycliste-droite",
    theme: "priorite-droite",
    difficulte: 2,
    alt: "Croisement sans panneau ni feu. Un cycliste arrive par ta droite.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "velo", at: "E", d: 1.6, type: "velo" },
      ],
    },
    question:
      "À une intersection en T sans signalisation, un cycliste vient de ta droite. Qui passe ?",
    mode: "cible",
    reponses: [
      { id: "velo", veh: "velo", label: "Le cycliste" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "velo",
    explication:
      "La priorité à droite vaut aussi dans une intersection en T et pour un vélo. Le cycliste arrive de ta droite : tu le laisses passer.",
    focus: { veh: "velo" },
    okAnim: [{ veh: "velo" }, { veh: "moi", delai: 1100 }],
  },
  {
    id: "prio-droite-pluie-camion",
    theme: "priorite-droite",
    difficulte: 2,
    alt: "Croisement sans panneau ni feu. Un camion arrive par ta droite.",
    scene: {
      kind: "croisement",
      vehicules: [
        { id: "moi", at: "S", d: 2.2, couleur: "joueur", label: "Toi" },
        { id: "camion", at: "E", d: 2.0, type: "camion" },
      ],
    },
    question:
      "Ce camion arrive à ta droite au croisement sans panneau. Qui passe ?",
    mode: "cible",
    reponses: [
      { id: "camion", veh: "camion", label: "Le camion" },
      { id: "moi", veh: "moi", label: "Toi" },
    ],
    bonne: "camion",
    explication:
      "Le camion vient de ta droite : il passe d'abord. Tu ralentis tôt pour lui céder le passage.",
    focus: { veh: "camion" },
    okAnim: [{ veh: "camion" }, { veh: "moi", delai: 1200 }],
  },

  // ── Distance et cycliste (nouveau lot 3) ─────────────────────
  {
    id: "pluie-ville-distance-bus",
    theme: "distance",
    difficulte: 2,
    alt: "Rue droite. Ta voiture suit un bus de près.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "bus", at: "S", d: 1.0, lane: 0.72, type: "bus" },
        {
          id: "moi",
          at: "S",
          d: 2.7,
          lane: 0.1,
          couleur: "joueur",
          label: "Toi",
        },
      ],
    },
    question: "En ville, tu suis ce bus de trop près. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "marge",
        label: "Je ralentis et j'augmente ma distance",
        ico: "🐢",
      },
      {
        id: "cinquante",
        label: "Je reste à 50 km/h sans changer l'écart",
      },
      { id: "colle", label: "Je me rapproche pour mieux voir devant" },
    ],
    bonne: "marge",
    explication:
      "Tu ralentis et tu gardes plus de marge pour pouvoir t'arrêter si le bus freine. Une limitation reste un maximum, jamais une allure imposée.",
    focus: { veh: "bus" },
    okAnim: [{ veh: "bus" }, { veh: "moi", delai: 350 }],
  },
  {
    id: "nuit-ville-cycliste",
    theme: "cycliste",
    difficulte: 2,
    alt: "Rue droite. Un cycliste roule devant ta voiture, sur le bord droit de la voie.",
    scene: {
      kind: "route",
      vehicules: [
        { id: "velo", at: "S", d: 0.9, lane: 0.62, type: "velo" },
        { id: "moi", at: "S", d: 2.1, couleur: "joueur", label: "Toi" },
      ],
    },
    question:
      "En ville, tu rattrapes ce cycliste mais tu n'as pas 1 m pour le dépasser. Que fais-tu ?",
    mode: "cartes",
    reponses: [
      {
        id: "attends",
        label: "Je reste derrière et j'attends d'avoir la place",
        ico: "🐢",
      },
      { id: "frole", label: "Je passe doucement à 50 cm" },
      { id: "phares", label: "Je mets les feux de route et je double" },
    ],
    bonne: "attends",
    explication:
      "En ville, tu laisses au moins 1 m pour dépasser un cycliste. Si tu ne l'as pas, tu restes derrière et tu ne le frôles jamais.",
    focus: { veh: "velo" },
    okAnim: [{ veh: "velo" }, { veh: "moi", delai: 350 }],
  },
];

/**
 * Scène du jour — la même pour tout le monde, elle change chaque jour
 * (minuit local). Alimente la carte de l'accueil et la manche `jour`.
 */
export function situationDuJour(now = new Date()) {
  const local = now.getTime() - now.getTimezoneOffset() * 60000;
  const day = Math.floor(local / 86400000);
  return SITUATIONS[day % SITUATIONS.length];
}

/** Mélange (copie) — Fisher-Yates. */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tire une manche de n situations en variant les thèmes :
 * d'abord un scénario par thème (ordre aléatoire), puis on complète.
 * `vues` (ids déjà joués) : les scènes jamais vues passent devant,
 * pour que la collection avance à chaque manche.
 */
export function pickSession(n = 6, vues = new Set()) {
  const pool = shuffle(SITUATIONS);
  const ordered = pool
    .filter((s) => !vues.has(s.id))
    .concat(pool.filter((s) => vues.has(s.id)));
  const themes = new Set();
  const first = [];
  const rest = [];
  for (const s of ordered) {
    if (themes.has(s.theme)) rest.push(s);
    else {
      themes.add(s.theme);
      first.push(s);
    }
  }
  return first.concat(rest).slice(0, Math.min(n, ordered.length));
}
