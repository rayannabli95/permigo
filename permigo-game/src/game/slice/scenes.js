// Les scènes du banc d'essai. De la DONNÉE, rien d'autre.
//
// Trois familles, trois compétences, trois variantes chacune, plus une scène
// de transfert que le joueur n'a jamais vue.
//
// 🔴 CE QU'UNE SCÈNE NE DÉCLARE PAS, et c'est volontaire :
//   • l'instant où le danger devient évident
//   • l'instant où il est trop tard pour freiner
//   • si le regard du joueur portait sur quelque chose
// Ces trois choses se MESURENT pendant la partie (voir observation.js et
// moteur.js). Déclarées à la main, elles seraient fausses dès qu'on déplace
// une voiture de deux mètres, et tout le reste du banc d'essai en dépend.
// Les valeurs `repere` ci-dessous ne servent qu'à écrire la documentation :
// le moteur ne les lit jamais.
//
// Repère du monde : X = est, Z = sud, l'avant du jeu est -Z.
// Une branche est nommée par le point cardinal d'où l'on ARRIVE.
// Sur la branche S, la voie de droite est x = +1,6 et la droite du conducteur
// est +X.

// ─────────────────────────────────────────────────────────────────────────
// Famille 1 — OBSERVER · la priorité masquée
// ─────────────────────────────────────────────────────────────────────────
//
// ⭐ La propriété qui fait toute la scène, et qui est ÉMERGENTE, pas écrite :
// au tout début, la berline est visible pour qui balaie loin à droite. Puis
// elle disparaît derrière la camionnette. Puis elle ressort, trop tard.
// Regarder TÔT est donc récompensé, et regarder tard ne sert à rien. C'est
// exactement la leçon, et personne n'a eu à l'écrire dans une règle.

const camionnetteBase = {
  famille: "camionnette",
  competence: "observer",
  competences: ["observation.droite", "anticipation.vehiculesMasques"],
  decor: { batiments: true, arbres: true },
  duree: 7,
};

export const SCENES = [
  {
    ...camionnetteBase,
    id: "camionnette-a",
    variante: "α",
    type: "A",
    titre: "La camionnette",
    joueur: { branche: "S", recul: 30, vitesse: 9, croisiere: 9 },
    props: [
      // Deux roues sur le trottoir, comme partout en ville. À x = 4,3 elle
      // laisse 55 cm au joueur : trop peu pour passer vite, assez pour passer.
      {
        id: "camionnette",
        modele: "camion",
        x: 4.3,
        z: 9.5,
        cap: 0,
        masque: true,
      },
    ],
    acteurs: [
      {
        id: "berline",
        type: "voiture",
        couleur: "gris",
        chemin: [
          [27.9, -1.6],
          [-70, -1.6],
        ],
        vitesse: 7.5,
        evite: false,
      },
    ],
    // La lueur des phares au sol sort de derrière la camionnette AVANT la
    // carrosserie : c'est elle, l'indice, et elle demande de regarder bas.
    interets: [
      {
        id: "lueur",
        role: "indice",
        nature: "objet",
        cible: { acteur: "berline", avant: 8, hauteur: 0.06 },
        texte: "la lueur des phares au sol",
      },
      {
        id: "berline",
        role: "danger",
        nature: "objet",
        cible: { acteur: "berline", hauteur: 0.85 },
        texte: "la voiture qui arrive de la droite",
      },
    ],
    conflit: { x: 1.6, z: -1.6 },
    attendu: "ralentir",
    repere: { evident: 3.0, limite: 2.5 },
    phrases: {
      vu_juste: "Tu l'as vue avant qu'elle sorte.",
      vu_faux: "Tu l'avais vue. Tu y es allé quand même.",
      aveugle_juste: "Tu as ralenti. Tu ne savais pas pourquoi.",
      aveugle_faux: "Elle était derrière la camionnette.",
      tard: "Tu as compris. Une seconde trop tard.",
    },
  },

  {
    ...camionnetteBase,
    id: "camionnette-b",
    variante: "β",
    type: "A",
    titre: "Le camion de livraison",
    // ⭐ Autre branche, autre sens, autre silhouette. La compétence est la
    // même, la surface ne rappelle rien. Sans ça, la 2e exposition mesure
    // une mémoire d'image.
    joueur: { branche: "W", recul: 32, vitesse: 9.5, croisiere: 9.5 },
    props: [
      {
        id: "camionnette",
        modele: "camion",
        x: -9.5,
        z: 4.3,
        cap: Math.PI / 2,
        masque: true,
      },
    ],
    acteurs: [
      {
        id: "berline",
        type: "voiture",
        couleur: "voiture",
        chemin: [
          [-1.6, -29],
          [-1.6, 70],
        ],
        vitesse: 8,
        evite: false,
      },
    ],
    interets: [
      {
        id: "lueur",
        role: "indice",
        nature: "objet",
        cible: { acteur: "berline", avant: 8, hauteur: 0.06 },
        texte: "la lueur des phares au sol",
      },
      {
        id: "berline",
        role: "danger",
        nature: "objet",
        cible: { acteur: "berline", hauteur: 0.85 },
        texte: "la voiture qui arrive de la droite",
      },
    ],
    conflit: { x: -1.6, z: 1.6 },
    attendu: "ralentir",
    repere: { evident: 3.4, limite: 2.8 },
    phrases: {
      vu_juste: "Tu l'as vue avant qu'elle sorte.",
      vu_faux: "Tu l'avais vue. Tu y es allé quand même.",
      aveugle_juste: "Tu as ralenti. Tu ne savais pas pourquoi.",
      aveugle_faux: "Elle était derrière le camion.",
      tard: "Tu as compris. Une seconde trop tard.",
    },
  },

  {
    ...camionnetteBase,
    id: "camionnette-c",
    variante: "γ",
    // 🔴 LA variante qui sauve la mesure. Sans elle, « je ralentis toujours »
    // réussit trois fois sur trois et le banc d'essai ne mesure plus rien.
    type: "G",
    titre: "La camionnette, et personne derrière",
    joueur: { branche: "S", recul: 30, vitesse: 9, croisiere: 9 },
    props: [
      {
        id: "camionnette",
        modele: "camion",
        x: 4.3,
        z: 11,
        cap: 0,
        masque: true,
      },
    ],
    acteurs: [],
    interets: [
      {
        id: "carrefour",
        role: "indice",
        nature: "objet",
        cible: { point: [14, 0, -1.6] },
        texte: "la rue de droite, vide",
      },
    ],
    conflit: null,
    // ⭐ Ici rien n'arrive, donc aucun objet ne peut prouver qu'il a cherché.
    // On mesure le GESTE : un vrai coup d'œil à droite avant le carrefour.
    controle: { cote: "droite", angleMin: 0.55, avant: 3.6 },
    attendu: "continuer",
    repere: { evident: null, limite: null },
    phrases: {
      vu_juste: "Tu as regardé. La voie était libre. Tu es passé.",
      vu_faux: "Tu as regardé, et tu t'es arrêté pour rien.",
      aveugle_juste: "Rien ne venait. Tu ne pouvais pas le savoir.",
      aveugle_faux: "Tu as freiné sans regarder.",
      tard: "Tu as regardé après être passé.",
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // Famille 2 — CONTRÔLER · l'angle mort
  // ───────────────────────────────────────────────────────────────────────
  //
  // ⭐⭐ Cette famille demande de regarder BIEN plus loin que les autres :
  // un angle mort est derrière l'épaule, pas au bord du pare-brise. Elle
  // relève donc `angleRegardMax`, et c'est en soi une question de test :
  // un balayage de 110° est-il naturel au pouce ? au gyroscope ? C'est
  // l'argument le plus fort en faveur de la version hybride, et le banc
  // d'essai va nous le dire au lieu qu'on en débatte.
  {
    id: "cycliste-a",
    variante: "α",
    famille: "cycliste",
    competence: "controler",
    competences: ["observation.angleMort", "timing.franchise"],
    type: "E",
    titre: "Le vélo qui remonte",
    decor: { batiments: true, arbres: true },
    duree: 8,
    // 🔴🔴 155°, et ce n'est pas un réglage de confort. La simulation est
    // formelle : un vélo qui remonte le long de la portière reste entre 137°
    // et 165° pendant TOUTE la scène. À 110° il est physiquement invisible,
    // et la scène ne mesurait rien du tout. Un angle mort se contrôle
    // par-dessus l'épaule ou il ne se contrôle pas.
    // ⚠️ Conséquence directe pour le TEST 1 : au pouce, 155° demandent plus
    // d'un écran de glissement ; au gyroscope, il faudrait tourner le
    // téléphone de 65°. Si aucune des trois versions ne rend ce geste
    // naturel, la réponse n'est pas un réglage, c'est un RÉTROVISEUR.
    angleRegardMax: 2.75,
    joueur: {
      branche: "S",
      vitesse: 9,
      // Le joueur tourne à droite. Il ne pilote pas : la voiture suit ce
      // chemin, et le troisième nombre de chaque point est la vitesse visée.
      // C'est ce ralentissement de virage qui laisse le vélo le rattraper.
      chemin: [
        [1.6, 34, 9],
        [1.6, 11, 2.9],
        [3.4, 2.6, 2.3],
        [12, 1.6, 6.5],
        [46, 1.6, 9],
      ],
    },
    props: [],
    acteurs: [
      {
        id: "velo",
        type: "velo",
        couleur: "jaune",
        // ⚠️ z = 40, c'est-à-dire six mètres DERRIÈRE le joueur qui part de
        // z = 34. Deux erreurs corrigées ici, et les deux venaient d'un
        // réglage fait à l'œil :
        //   • la première version le posait DEVANT (z = 27) : le joueur le
        //     doublait et la scène ne se produisait jamais ;
        //   • la deuxième le collait à deux mètres : les deux boîtes se
        //     touchaient dès la première image, choc instantané, scène morte.
        // Réglé par simulation numérique hors navigateur : à z = 40 avec ce
        // profil de vitesse, la distance minimale tombe à 0,8 m à t = 6,2 s.
        // ⚠️ Un vélo plafonne à 6 m/s dans le moteur (gabarit) : monter ce
        // nombre ne change rien, c'est le joueur qu'il faut ralentir.
        chemin: [
          [3.05, 40],
          [3.05, -30],
        ],
        vitesse: 6,
        evite: false,
        prioritaire: false,
      },
    ],
    // L'indice principal est SONORE. C'est la seule scène du banc d'essai
    // dans ce cas, et elle répond à une question qu'on ne saura pas
    // autrement : est-ce que les élèves jouent avec le son ?
    sons: [{ t: 0.4, nom: "clic", repete: 0.55, jusqu: 4.2 }],
    interets: [
      {
        id: "velo",
        role: "danger",
        nature: "objet",
        cible: { acteur: "velo", hauteur: 1.1 },
        texte: "le vélo le long de ta portière",
      },
    ],
    conflit: null,
    croisement: "velo", // on ne lui coupe pas la route
    attendu: "ralentir",
    repere: { evident: 3.2, limite: 4.4 },
    phrases: {
      vu_juste: "Tu as tourné la tête. Tu l'as laissé passer.",
      vu_faux: "Tu l'as vu, et tu as tourné devant lui.",
      aveugle_juste: "Tu as attendu. Tu ne l'avais pas vu.",
      aveugle_faux: "Il remontait le long de ta portière.",
      tard: "Tu l'as vu au moment où tu braquais.",
    },
  },

  {
    id: "cycliste-b",
    variante: "β",
    famille: "cycliste",
    competence: "controler",
    competences: ["observation.angleMort", "timing.franchise"],
    type: "E",
    titre: "Le vélo silencieux",
    decor: { batiments: true, arbres: true },
    duree: 8,
    angleRegardMax: 2.75,
    // ⭐⭐⭐ LA variante, et elle vaut de l'or : celle-ci est SILENCIEUSE.
    // Aucun cliquetis de dérailleur, un vélo à assistance qui ne fait aucun
    // bruit. Comparer α et β répond tout seul à une question qu'aucun
    // questionnaire ne tranchera : est-ce que les élèves jouent avec le son,
    // et est-ce que l'indice sonore sert vraiment à quelque chose ?
    joueur: {
      branche: "S",
      vitesse: 9,
      chemin: [
        [1.6, 34, 9],
        [1.6, 11, 3.1],
        [3.4, 2.6, 2.45],
        [12, 1.6, 7],
        [46, 1.6, 9],
      ],
    },
    props: [],
    acteurs: [
      {
        id: "scooter",
        type: "velo",
        couleur: "violet",
        chemin: [
          [3.05, 39.5],
          [3.05, -30],
        ],
        vitesse: 6,
        evite: false,
        prioritaire: false,
      },
    ],
    sons: [],
    interets: [
      {
        id: "scooter",
        role: "danger",
        nature: "objet",
        cible: { acteur: "scooter", hauteur: 1.1 },
        texte: "le vélo qui remontait sans un bruit",
      },
    ],
    conflit: null,
    croisement: "scooter",
    attendu: "ralentir",
    repere: { evident: 2.6, limite: 3.6 },
    phrases: {
      vu_juste: "Tu as tourné la tête. Tu l'as laissé passer.",
      vu_faux: "Tu l'as vu, et tu as tourné devant lui.",
      aveugle_juste: "Tu as attendu. Tu ne l'avais pas vu.",
      aveugle_faux: "Il remontait le long de ta portière.",
      tard: "Celui-là ne faisait aucun bruit. Il fallait regarder.",
    },
  },

  {
    id: "cycliste-c",
    variante: "γ",
    famille: "cycliste",
    competence: "controler",
    competences: ["observation.angleMort"],
    type: "G",
    titre: "Rien ne remonte",
    decor: { batiments: true, arbres: true },
    duree: 8,
    angleRegardMax: 2.75,
    joueur: {
      branche: "S",
      vitesse: 9,
      chemin: [
        [1.6, 34, 9],
        [1.6, 11, 3.0],
        [3.4, 2.6, 2.4],
        [12, 1.6, 7],
        [46, 1.6, 9],
      ],
    },
    props: [],
    acteurs: [],
    sons: [],
    // ⚠️ Aucun point d'intérêt : un repère fixe posé devant devenait « évident »
    // à la première image, et la scène ne pouvait plus rien distinguer.
    // La preuve, ici, c'est le contrôle par-dessus l'épaule, et rien d'autre.
    interets: [],
    conflit: null,
    controle: { cote: "droite", angleMin: 1.6, avant: 5.2 },
    attendu: "continuer",
    repere: { evident: null, limite: null },
    phrases: {
      vu_juste: "Tu as contrôlé. C'était libre. Tu as tourné.",
      vu_faux: "Tu as contrôlé, et tu t'es arrêté pour rien.",
      aveugle_juste: "Personne ne remontait. Tu ne pouvais pas le savoir.",
      aveugle_faux: "Tu as freiné sans contrôler.",
      tard: "Tu as contrôlé après avoir tourné.",
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // Famille 3 — ANTICIPER · lire deux véhicules plus loin
  // ───────────────────────────────────────────────────────────────────────
  //
  // ⭐⭐⭐ C'est la scène qui produit le chiffre du projet : la marge
  // d'anticipation. Rien n'est caché. Tout est en pleine vue, mais LOIN.
  //
  // ⚠️ Le véhicule lointain est un CAMION, et ce n'est pas décoratif : ses
  // feux stop sont à 2,4 m, donc au-dessus du toit de la berline qu'on suit.
  // Avec une berline à cet endroit, l'indice serait géométriquement invisible
  // et la scène serait injouable. La pédagogie tenait à trente centimètres.
  {
    id: "freinage-a",
    variante: "α",
    famille: "freinage",
    competence: "anticiper",
    competences: [
      "observation.regardLointain",
      "anticipation.variationsVitesse",
      "timing.precocite",
    ],
    type: "D",
    titre: "Le freinage deux voitures plus loin",
    decor: { batiments: true, arbres: true },
    duree: 9,
    joueur: { branche: "S", recul: 82, vitesse: 13, croisiere: 13 },
    props: [],
    acteurs: [
      {
        id: "berline",
        type: "voiture",
        couleur: "gris",
        chemin: [
          [1.6, 64],
          [1.6, -60],
        ],
        vitesse: 13,
        evite: false,
      },
      {
        id: "camion",
        type: "camion",
        couleur: "camion",
        chemin: [
          [1.6, 42],
          [1.6, -60],
        ],
        vitesse: 13,
        evite: false,
      },
    ],
    // Le scénario en trois temps. C'est le seul endroit du banc d'essai où
    // le temps est écrit à la main, parce que c'est le sujet même de la scène.
    evenements: [
      { t: 1.1, acteur: "camion", feuxStop: true, vitesse: 3.5 },
      { t: 3.7, acteur: "berline", feuxStop: true, vitesse: 3.5 },
    ],
    interets: [
      {
        id: "stops",
        role: "indice",
        nature: "feu",
        cible: { acteur: "camion", arriere: 3.9, hauteur: 2.45 },
        texte: "les feux stop du camion, par-dessus la berline",
        // 🔴 Droit devant, donc aucune direction de regard ne prouve rien.
        // Ici la preuve est le délai de réaction, et c'est tout aussi honnête.
        preuve: "reaction",
        // Avant cet instant il n'y a rien à voir : l'indice n'existe pas.
        apparait: 1.1,
      },
      {
        id: "berline",
        role: "danger",
        nature: "objet",
        cible: { acteur: "berline", hauteur: 1 },
        texte: "la berline qui freine",
        apparait: 3.7,
      },
    ],
    conflit: null,
    suivi: "berline", // ne pas la percuter, et garder de la marge
    attendu: "ralentir",
    repere: { indice: 1.1, evident: 3.7, limite: 4.9 },
    phrases: {
      vu_juste: "Tu as levé le pied avant elle.",
      vu_faux: "Tu as vu les feux du camion et tu n'as rien fait.",
      aveugle_juste: "Tu as ralenti. Tu regardais sa malle, pas la route.",
      aveugle_faux: "Le camion freinait depuis trois secondes.",
      tard: "Tu as freiné quand elle a freiné. Un cran trop tard.",
    },
  },

  {
    id: "freinage-b",
    variante: "β",
    famille: "freinage",
    competence: "anticiper",
    competences: [
      "observation.regardLointain",
      "anticipation.variationsVitesse",
      "timing.precocite",
    ],
    type: "D",
    titre: "Le bus deux véhicules plus loin",
    decor: { batiments: true, arbres: true },
    duree: 9,
    // On suit un véhicule plus haut, donc l'indice se lit dans une fente plus
    // étroite, et il arrive plus tôt.
    joueur: { branche: "S", recul: 84, vitesse: 13, croisiere: 13 },
    props: [],
    acteurs: [
      {
        id: "berline",
        type: "camion",
        couleur: "camion",
        chemin: [
          [1.6, 66],
          [1.6, -60],
        ],
        vitesse: 13,
        evite: false,
      },
      {
        id: "bus",
        type: "bus",
        couleur: "camion",
        chemin: [
          [1.6, 40],
          [1.6, -60],
        ],
        vitesse: 12.5,
        evite: false,
      },
    ],
    evenements: [
      { t: 0.7, acteur: "bus", feuxStop: true, vitesse: 2.5 },
      { t: 3.1, acteur: "berline", feuxStop: true, vitesse: 3 },
    ],
    interets: [
      {
        id: "stops",
        role: "indice",
        nature: "feu",
        cible: { acteur: "bus", arriere: 5.4, hauteur: 2.7 },
        texte: "les feux stop du bus",
        preuve: "reaction",
        apparait: 0.7,
      },
      {
        id: "berline",
        role: "danger",
        nature: "objet",
        cible: { acteur: "berline", hauteur: 1.4 },
        texte: "le camion qui freine",
        apparait: 3.1,
      },
    ],
    conflit: null,
    suivi: "berline",
    attendu: "ralentir",
    repere: { indice: 0.7, evident: 3.1, limite: 4.3 },
    phrases: {
      vu_juste: "Tu as levé le pied avant lui.",
      vu_faux: "Tu as vu les feux du bus et tu n'as rien fait.",
      aveugle_juste: "Tu as ralenti. Tu regardais sa malle, pas la route.",
      aveugle_faux: "Le bus freinait depuis trois secondes.",
      tard: "Tu as freiné quand il a freiné. Un cran trop tard.",
    },
  },

  {
    id: "freinage-c",
    variante: "γ",
    famille: "freinage",
    competence: "anticiper",
    competences: ["observation.regardLointain", "decision.allure"],
    type: "G",
    titre: "Les feux s'allument et rien ne ralentit",
    decor: { batiments: true, arbres: true },
    duree: 9,
    joueur: { branche: "S", recul: 82, vitesse: 13, croisiere: 13 },
    props: [],
    acteurs: [
      {
        id: "berline",
        type: "voiture",
        couleur: "gris",
        chemin: [
          [1.6, 64],
          [1.6, -60],
        ],
        vitesse: 13,
        evite: false,
      },
      {
        id: "camion",
        type: "camion",
        couleur: "camion",
        chemin: [
          [1.6, 42],
          [1.6, -60],
        ],
        vitesse: 13,
        evite: false,
      },
    ],
    // Le camion effleure ses freins et repart. Rien ne se passe. Freiner fort
    // ici est un freinage stérile, et c'est exactement ce qu'on veut compter.
    evenements: [
      { t: 1.2, acteur: "camion", feuxStop: true, vitesse: 11 },
      { t: 2.4, acteur: "camion", feuxStop: false, vitesse: 13 },
    ],
    interets: [
      {
        id: "stops",
        role: "indice",
        nature: "feu",
        cible: { acteur: "camion", arriere: 3.9, hauteur: 2.45 },
        texte: "les feux stop du camion",
        preuve: "reaction",
        apparait: 1.2,
      },
    ],
    conflit: null,
    suivi: "berline",
    attendu: "continuer",
    repere: { indice: 1.2, evident: null, limite: null },
    phrases: {
      vu_juste: "Tu as vu ses feux. Tu as gardé ta marge sans freiner.",
      vu_faux: "Tu as pilé. Il ralentissait à peine.",
      aveugle_juste: "Rien n'est arrivé. Tu ne regardais pas si loin.",
      aveugle_faux: "Tu as freiné sans savoir pourquoi.",
      tard: "Tu as réagi après coup.",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────
// La scène de TRANSFERT
// ─────────────────────────────────────────────────────────────────────────
//
// ⭐⭐⭐ C'est la mesure la plus importante du banc d'essai, et la seule qui
// sépare vraiment deux choses qu'on confond tout le temps :
//
//   MÉMOIRE       « la dernière fois il y avait une voiture derrière la
//                   camionnette blanche »
//   APPRENTISSAGE « quand je ne vois pas, je cherche avant de m'engager »
//
// Elle tombe SANS PRÉVENIR après quelques manches. Tout change : la branche
// d'arrivée, la silhouette du masque, la nature du véhicule qui débouche, la
// distance, la vitesse. Ne reste que le problème.
export const TRANSFERT = {
  id: "transfert-bus",
  variante: "transfert",
  famille: "transfert",
  competence: "observer",
  competences: ["observation.droite", "anticipation.vehiculesMasques"],
  type: "A",
  transfert: true,
  titre: "Une rue qu'il n'a jamais vue",
  decor: { batiments: true, arbres: true, passages: ["N"] },
  duree: 7,
  // On arrive du NORD : toute la rue est retournée. Sa droite est l'ouest.
  joueur: { branche: "N", recul: 31, vitesse: 9.5, croisiere: 9.5 },
  props: [
    {
      id: "bus",
      modele: "camion",
      echelle: 1.28, // une masse différente de la camionnette
      x: -4.4,
      z: -10.5,
      cap: Math.PI,
      masque: true,
    },
  ],
  acteurs: [
    {
      id: "utilitaire",
      type: "camion",
      couleur: "camion",
      chemin: [
        [-28.5, 1.6],
        [70, 1.6],
      ],
      vitesse: 7,
      evite: false,
    },
  ],
  interets: [
    {
      id: "lueur",
      role: "indice",
      nature: "objet",
      cible: { acteur: "utilitaire", avant: 9, hauteur: 0.06 },
      texte: "la lueur des phares au sol",
    },
    {
      id: "utilitaire",
      role: "danger",
      nature: "objet",
      cible: { acteur: "utilitaire", hauteur: 1.3 },
      texte: "le véhicule qui arrive de ta droite",
    },
  ],
  conflit: { x: -1.6, z: 1.6 },
  attendu: "ralentir",
  repere: { evident: 3.2, limite: 2.7 },
  phrases: {
    vu_juste: "Rue inconnue, même réflexe. Tu as cherché avant de t'engager.",
    vu_faux: "Tu l'as vu. Tu es passé quand même.",
    aveugle_juste: "Tu as ralenti. Tu ne savais pas ce qu'il y avait.",
    aveugle_faux: "Tu ne voyais rien, et tu ne t'es pas demandé pourquoi.",
    tard: "Tu as cherché une fois engagé.",
  },
};

// Les trois familles, dans l'ordre où on les enchaîne.
export const FAMILLES = ["camionnette", "cycliste", "freinage"];
export const VARIANTES = ["α", "β", "γ"];

export const parId = (id) =>
  id === TRANSFERT.id ? TRANSFERT : SCENES.find((s) => s.id === id);

// Le tirage d'une manche : une scène par famille, dans une variante qu'on
// n'a pas encore vue. Quand les trois sont épuisées, on recommence — mais
// jamais dans le même ordre que la manche précédente.
export function tirerManche(familles, dejaVues = [], manche = 0) {
  return familles.map((f) => {
    const dispo = SCENES.filter((s) => s.famille === f);
    const neuves = dispo.filter((s) => !dejaVues.includes(s.id));
    const pool = neuves.length ? neuves : dispo;
    // Déterministe : même élève, même ordre, donc deux tests comparables.
    return pool[manche % pool.length];
  });
}
