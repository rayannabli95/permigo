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
];

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
