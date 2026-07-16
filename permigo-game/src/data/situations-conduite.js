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
//     kind      : 'croisement' | 'giratoire' | 'route'
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
//                 [{ veh, delai?, clign? }] — sinon le joueur avance seul ;
//                 [] = personne ne bouge (ex. arrêt au feu)
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
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
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
        { id: "moi", at: "S", d: 2.0, couleur: "joueur", label: "Toi" },
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
        { id: "moi", at: "S", d: 2.15, couleur: "joueur", label: "Toi" },
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
 */
export function pickSession(n = 6) {
  const pool = shuffle(SITUATIONS);
  const seen = new Set();
  const first = [];
  const rest = [];
  for (const s of pool) {
    if (seen.has(s.theme)) rest.push(s);
    else {
      seen.add(s.theme);
      first.push(s);
    }
  }
  return first.concat(rest).slice(0, Math.min(n, pool.length));
}
