// ═══════════════════════════════════════════════════════════════
// Données statiques — 5 parcours × 15 questions
// Pas de Supabase. Modifiable sans migration.
// Ton : tutoiement simple, une idée par question (anti « trauma
// code de la route ») — réécriture 2026-06-12, sens et réponses
// inchangés (voir docs/PLAN_QUIZ_REDESIGN.md, workstream C).
// ═══════════════════════════════════════════════════════════════

export const PARCOURS = [
  {
    id: 1,
    nom: "Cergy — ronds-points",
    contexte:
      "Sortie de la gare de Cergy-Saint-Christophe, circulation dense, nombreux giratoires et zones 30.",
    difficulte: 3,
  },
  {
    id: 2,
    nom: "Paris — trafic dense",
    contexte:
      "Traversée du centre de Paris, boulevards à 50 km/h, sas vélos, piétons en nombre.",
    difficulte: 5,
  },
  {
    id: 3,
    nom: "Campagne Beauce",
    contexte:
      "Routes de campagne sans marquage au sol, intersections non signalées, tracteurs agricoles.",
    difficulte: 3,
  },
  {
    id: 4,
    nom: "Lyon — zone 30",
    contexte:
      "Quartier résidentiel de Lyon, zone 30, tramway, nombreux cyclistes et piétons.",
    difficulte: 4,
  },
  {
    id: 5,
    nom: "Voie rapide / A86",
    contexte:
      "Insertion sur l'A86, conduite à haute vitesse, voies de dépassement, bande d'arrêt d'urgence.",
    difficulte: 4,
  },
  {
    id: 6,
    nom: "Révisions essentielles",
    contexte:
      "Les bases qui tombent à tous les examens : alcool, vitesse, équipement, secours, signalisation.",
    difficulte: 2,
  },
  {
    id: 7,
    nom: "Nuit & météo difficile",
    contexte:
      "Conduite de nuit, pluie, brouillard, neige et verglas : voir et être vu, adapter sa vitesse.",
    difficulte: 4,
  },
  {
    id: 8,
    nom: "Panneaux & signalisation",
    contexte:
      "Lire vite et juste : interdiction, danger, obligation, marquages au sol et feux.",
    difficulte: 2,
  },
  {
    id: 9,
    nom: "Montagne & routes sinueuses",
    contexte:
      "Descentes, épingles, frein moteur, priorité en montagne et chaussées glissantes.",
    difficulte: 4,
  },
  {
    id: 10,
    nom: "Partage de la route",
    contexte:
      "Vélos, deux-roues, piétons fragiles, bus, poids lourds et angles morts.",
    difficulte: 3,
  },
  {
    id: 11,
    nom: "Stationnement & manœuvres",
    contexte:
      "Arrêt ou stationnement ? Créneau, demi-tour, places interdites et marquages au sol.",
    difficulte: 3,
  },
];

export const QUESTIONS = [
  // ── Parcours 1 : Cergy — ronds-points ─────────────────────────
  {
    id: "p1q1",
    parcours_id: 1,
    enonce: "Tu arrives à un giratoire. Qui passe en premier ?",
    options: [
      "Ceux qui entrent dans le giratoire",
      "Ceux qui sont déjà dans le giratoire",
      "Celui qui arrive à droite",
    ],
    correct: 1,
    explication:
      "Ceux qui sont déjà dedans sont prioritaires. Toi qui entres, tu cèdes — sauf panneau contraire.",
    tags: ["priorite", "rond_point"],
  },
  {
    id: "p1q2",
    parcours_id: 1,
    enonce: "Tu roules en zone 30. Ta vitesse max, c'est combien ?",
    options: ["20 km/h", "30 km/h", "50 km/h"],
    correct: 1,
    explication: "30 km/h partout dans la zone, jusqu'au panneau de sortie.",
    tags: ["vitesse", "signalisation"],
  },
  {
    id: "p1q3",
    parcours_id: 1,
    enonce:
      "Tu démarres en marche arrière sur un parking. Tu fais quoi d'abord ?",
    options: [
      "Je démarre sans regarder, les piétons font attention",
      "Je klaxonne pour prévenir",
      "Je vérifie que c'est libre dans tous les sens",
    ],
    correct: 2,
    explication:
      "Tu contrôles partout avant de bouger : rétros, angles morts, piétons, vélos. La marche arrière sans regarder, c'est éliminatoire.",
    tags: ["manoeuvre", "faute_eliminatoire"],
  },
  {
    id: "p1q4",
    parcours_id: 1,
    enonce:
      "Route à double sens. Une voiture est garée sur TA droite et tu croises un véhicule. Qui cède ?",
    options: [
      "Lui, car il est du côté du stationnement",
      "Toi, car l'obstacle est de ton côté",
      "Les deux, en ralentissant",
    ],
    correct: 1,
    explication:
      "L'obstacle est de ton côté, donc c'est toi qui laisses passer. Règle simple : celui qui doit se déporter cède.",
    tags: ["priorite", "manoeuvre"],
  },
  {
    id: "p1q5",
    parcours_id: 1,
    enonce:
      "Tu entres dans un giratoire et tu ne vois pas de panneau cédez-le-passage. Tu fais quoi ?",
    options: [
      "J'entre prudemment en accélérant",
      "Je cède le passage à ceux qui circulent dedans",
      "Je klaxonne pour signaler ma présence",
    ],
    correct: 1,
    explication:
      "Même sans panneau, tu cèdes à ceux qui sont déjà dans le giratoire. Forcer le passage, c'est éliminatoire.",
    tags: ["priorite", "rond_point", "faute_eliminatoire"],
  },
  {
    id: "p1q6",
    parcours_id: 1,
    enonce:
      "Pour tourner à droite, tu peux rouler sur une piste cyclable bidirectionnelle ?",
    options: [
      "Oui, si elle est large",
      "Oui, juste la franchir pour tourner",
      "Non, c'est interdit",
    ],
    correct: 1,
    explication:
      "Tu peux la franchir pour tourner, jamais y circuler. Et tu cèdes le passage aux vélos — dans les DEUX sens, c'est le piège des pistes bidirectionnelles.",
    tags: ["cycliste", "faute_eliminatoire"],
  },
  {
    id: "p1q7",
    parcours_id: 1,
    enonce:
      "Panneau « Accès interdit sauf riverains ». Tu n'habites pas la rue. Tu fais quoi ?",
    options: [
      "Je fais demi-tour",
      "Je passe, il n'y a personne",
      "Je passe lentement",
    ],
    correct: 0,
    explication:
      "Pas riverain = pas le droit de passer, même à vide, même lentement. Demi-tour.",
    tags: ["signalisation"],
  },
  {
    id: "p1q8",
    parcours_id: 1,
    enonce: "T'es arrêté au feu rouge. Il passe au vert. Tu fais quoi ?",
    options: [
      "Je démarre direct sans regarder",
      "Je vérifie que l'intersection est dégagée avant de partir",
      "J'attends 3 secondes par sécurité",
    ],
    correct: 1,
    explication:
      "Vert = autorisé, pas garanti. Un piéton qui finit de traverser ou un retardataire peut encore être là : un coup d'œil avant de partir.",
    tags: ["priorite", "signalisation"],
  },
  {
    id: "p1q9",
    parcours_id: 1,
    enonce: "Tu veux te garer. Distance minimum avant un passage piéton ?",
    options: ["3 mètres", "5 mètres", "10 mètres"],
    correct: 1,
    explication:
      "5 mètres en amont. Sinon tu masques les piétons aux autres conducteurs.",
    tags: ["pieton", "signalisation"],
  },
  {
    id: "p1q10",
    parcours_id: 1,
    enonce:
      "Tu doubles un cycliste en ville. Tu laisses combien sur le côté, minimum ?",
    options: ["0,5 m", "1 m", "1,5 m"],
    correct: 1,
    explication: "1 mètre minimum en agglomération (1,50 m hors agglo).",
    tags: ["cycliste"],
  },
  {
    id: "p1q11",
    parcours_id: 1,
    enonce:
      "Avant de partir, ton voyant de pression des pneus s'allume. Tu fais quoi ?",
    options: [
      "Je vérifie la pression avant de prendre la route",
      "Je roule quand même, c'est pas urgent",
      "Je gonflerai à la prochaine station",
    ],
    correct: 0,
    explication:
      "Voyant allumé = anomalie. Tu vérifies AVANT de rouler : un pneu sous-gonflé peut éclater.",
    tags: ["verification_exterieure"],
  },
  {
    id: "p1q12",
    parcours_id: 1,
    enonce:
      "En zone 30, un piéton s'apprête à traverser hors d'un passage. Tu fais quoi ?",
    options: [
      "Je continue, il n'est pas sur un passage piéton",
      "Je ralentis et je le laisse traverser",
      "Je klaxonne pour qu'il attende",
    ],
    correct: 1,
    explication:
      "À 30 km/h, le piéton est vulnérable : tu ralentis et tu le laisses traverser, même hors passage. Sa sécurité prime.",
    tags: ["pieton"],
  },
  {
    id: "p1q13",
    parcours_id: 1,
    enonce:
      "Tu doubles un bus à l'arrêt. Des piétons traversent devant le bus. Tu fais quoi ?",
    options: [
      "Je klaxonne pour les avertir",
      "J'accélère pour passer avant eux",
      "Je m'arrête pour les laisser passer",
    ],
    correct: 2,
    explication:
      "Tu t'arrêtes. Devant un bus, tu ne vois pas qui débouche — prudence maximale.",
    tags: ["pieton"],
  },
  {
    id: "p1q14",
    parcours_id: 1,
    enonce:
      "Tu sors d'un giratoire à la 2e sortie. Tu te places où en entrant ?",
    options: [
      "Voie de droite uniquement",
      "N'importe quelle voie, selon le marquage au sol",
      "Toujours la voie de gauche",
    ],
    correct: 1,
    explication:
      "Tu suis le marquage au sol. S'il n'y en a pas : reste à droite pour les sorties proches.",
    tags: ["manoeuvre", "rond_point"],
  },
  {
    id: "p1q15",
    parcours_id: 1,
    enonce: "Le clignotant droit est obligatoire pour sortir d'un giratoire ?",
    options: [
      "Non, pas dans un giratoire",
      "Oui, avant la sortie que je prends",
      "Oui, dès l'entrée dans le giratoire",
    ],
    correct: 1,
    explication:
      "Oui : clignotant droit juste avant TA sortie, pour prévenir les autres.",
    tags: ["manoeuvre", "rond_point"],
  },

  // ── Parcours 2 : Paris — trafic dense ─────────────────────────
  {
    id: "p2q1",
    parcours_id: 2,
    enonce:
      "Voie à 50 km/h, le feu passe à l'orange fixe devant toi. Tu fais quoi ?",
    options: [
      "J'accélère pour passer avant le rouge",
      "Je m'arrête si je peux le faire en sécurité",
      "Je continue, pas le temps de freiner",
    ],
    correct: 1,
    explication:
      "Orange = arrêt, si tu peux freiner sans danger. Tu ne passes que si t'arrêter serait risqué.",
    tags: ["signalisation"],
  },
  {
    id: "p2q2",
    parcours_id: 2,
    enonce: "Un sas vélo est marqué devant la ligne d'arrêt. Tu t'arrêtes où ?",
    options: [
      "Dans le sas, c'est permis aux heures de pointe",
      "Derrière la ligne d'arrêt, avant le sas",
      "N'importe où avant le feu",
    ],
    correct: 1,
    explication:
      "Le sas est réservé aux vélos. Toi, tu t'arrêtes derrière TA ligne, avant le sas.",
    tags: ["cycliste", "signalisation", "faute_eliminatoire"],
  },
  {
    id: "p2q3",
    parcours_id: 2,
    enonce: "Un piéton traverse hors du passage piéton. T'es obligé de quoi ?",
    options: [
      "De rien, il traverse mal, il s'adapte",
      "De ralentir, et de m'arrêter s'il le faut",
      "De klaxonner pour lui signaler son infraction",
    ],
    correct: 1,
    explication:
      "Même s'il a tort, sa sécurité passe d'abord : tu ralentis et tu t'arrêtes si nécessaire.",
    tags: ["pieton", "faute_eliminatoire"],
  },
  {
    id: "p2q4",
    parcours_id: 2,
    enonce:
      "À 50 km/h par temps sec, tu t'arrêtes en combien de mètres environ ?",
    options: ["15 m", "28 m", "45 m"],
    correct: 1,
    explication:
      "Environ 28 m : 14 m de réaction + 14 m de freinage. Et bien plus sur sol mouillé.",
    tags: ["vitesse"],
  },
  {
    id: "p2q5",
    parcours_id: 2,
    enonce:
      "Le feu passe à l'orange alors que t'es à quelques mètres de la ligne. Tu fais quoi ?",
    options: [
      "Je freine d'urgence dans tous les cas",
      "Je passe si je suis trop près pour freiner sans danger",
      "J'accélère pour passer avant le rouge",
    ],
    correct: 1,
    explication:
      "Trop près pour t'arrêter en sécurité = tu passes. Sinon, tu t'arrêtes. Jamais d'accélération.",
    tags: ["signalisation", "faute_eliminatoire"],
  },
  {
    id: "p2q6",
    parcours_id: 2,
    enonce: "Tu peux stationner sur une piste cyclable ?",
    options: [
      "Oui, moins de 5 minutes",
      "Oui, avec les feux de détresse",
      "Non, c'est interdit",
    ],
    correct: 2,
    explication: "Interdit, point. Peu importe la durée ou les warnings.",
    tags: ["cycliste", "faute_eliminatoire"],
  },
  {
    id: "p2q7",
    parcours_id: 2,
    enonce:
      "Tu tournes à gauche. Un cycliste arrive en face, tout droit, sur sa piste. Qui passe ?",
    options: [
      "Moi, car je tourne",
      "Le cycliste qui va tout droit",
      "Personne, on négocie",
    ],
    correct: 1,
    explication:
      "Celui qui va tout droit passe avant celui qui tourne. Tu cèdes au cycliste.",
    tags: ["cycliste", "priorite"],
  },
  {
    id: "p2q8",
    parcours_id: 2,
    enonce: "Accident avec un blessé. Ta première action obligatoire ?",
    options: [
      "Déplacer le blessé pour le mettre à l'abri",
      "Protéger la zone, puis alerter les secours",
      "Repartir et appeler en route",
    ],
    correct: 1,
    explication:
      "PAS : Protéger, Alerter (15, 17, 18 ou 112), Secourir. Et on ne déplace jamais un blessé sauf danger immédiat.",
    tags: ["premiers_secours"],
  },
  {
    id: "p2q9",
    parcours_id: 2,
    enonce:
      "À 50 km/h, un enfant surgit entre deux voitures garées. Tu fais quoi ?",
    options: [
      "Je freine et klaxonne en même temps",
      "Je freine à fond en gardant ma trajectoire",
      "Je l'évite en braquant fort",
    ],
    correct: 1,
    explication:
      "Freinage à fond, trajectoire droite. Braquer brusquement = perte de contrôle.",
    tags: ["pieton", "vitesse"],
  },
  {
    id: "p2q10",
    parcours_id: 2,
    enonce: "Un tramway est à l'arrêt, portes ouvertes. Tu fais quoi ?",
    options: [
      "Je passe lentement en klaxonnant",
      "J'attends portes fermées et voyageurs dégagés",
      "Je passe normalement si la voie est libre",
    ],
    correct: 1,
    explication:
      "Tu attends que tout le monde soit monté ou descendu et que les portes soient fermées.",
    tags: ["pieton"],
  },
  {
    id: "p2q11",
    parcours_id: 2,
    enonce: "Vitesse max en ville, sans panneau particulier ?",
    options: ["30 km/h", "50 km/h", "70 km/h"],
    correct: 1,
    explication:
      "50 km/h par défaut en agglomération. Sauf zone 30, zone de rencontre, etc.",
    tags: ["vitesse", "signalisation"],
  },
  {
    id: "p2q12",
    parcours_id: 2,
    enonce: "Ton téléphone sonne pendant que tu conduis. Tu fais quoi ?",
    options: [
      "Je réponds vite si c'est important",
      "Je ne réponds pas — ou je m'arrête pour répondre",
      "Je réponds avec le haut-parleur en main",
    ],
    correct: 1,
    explication:
      "Téléphone en main au volant = interdit. Écouteurs et oreillettes aussi. Seul le mains-libres intégré au véhicule est autorisé.",
    tags: ["verification_interieure"],
  },
  {
    id: "p2q13",
    parcours_id: 2,
    enonce:
      "Un bus scolaire est à l'arrêt, warnings allumés, des enfants descendent. Tu fais quoi ?",
    options: [
      "Je passe lentement",
      "Je m'arrête jusqu'à ce qu'ils soient sur le trottoir",
      "Je klaxonne pour prévenir les enfants",
    ],
    correct: 1,
    explication:
      "Tu t'arrêtes et tu attends. Un enfant peut surgir n'importe quand autour d'un bus scolaire.",
    tags: ["pieton"],
  },
  {
    id: "p2q14",
    parcours_id: 2,
    enonce: "Un livreur bloque ta place. Tu peux rester en double file ?",
    options: [
      "Oui, brièvement si je reste dans la voiture",
      "Oui, avec les feux de détresse",
      "Non, le stationnement en double file est interdit",
    ],
    correct: 2,
    explication:
      "Stationner en double file = interdit. Seul un arrêt de quelques secondes, au volant, peut être toléré.",
    tags: ["manoeuvre"],
  },
  {
    id: "p2q15",
    parcours_id: 2,
    enonce:
      "Boulevard à 50 km/h. Quelle distance tu gardes avec la voiture de devant ?",
    options: [
      "1 seconde de distance",
      "2 secondes de distance minimum",
      "5 mètres fixes",
    ],
    correct: 1,
    explication:
      "Règle des 2 secondes : quand la voiture de devant passe un repère fixe, tu dois y arriver 2 secondes plus tard, pas avant.",
    tags: ["vitesse"],
  },

  // ── Parcours 3 : Campagne Beauce ──────────────────────────────
  {
    id: "p3q1",
    parcours_id: 3,
    enonce: "Route de campagne, intersection sans aucun panneau. La règle ?",
    options: [
      "Le plus rapide passe en premier",
      "Je cède à celui qui vient de ma droite",
      "Je suis prioritaire car ma route est plus grande",
    ],
    correct: 1,
    explication:
      "Pas de panneau = priorité à droite. Tu cèdes à tout véhicule qui arrive de ta droite.",
    tags: ["priorite"],
  },
  {
    id: "p3q2",
    parcours_id: 3,
    enonce:
      "Tu veux doubler un tracteur à 25 km/h, mais la route est en courbe. Tu fais quoi ?",
    options: [
      "Je double vite si la voie d'en face semble libre",
      "J'attends une ligne droite avec une bonne visibilité",
      "Je double en klaxonnant pour prévenir",
    ],
    correct: 1,
    explication:
      "En courbe, doubler est interdit : tu ne vois pas ce qui arrive. Patiente jusqu'à la ligne droite dégagée.",
    tags: ["manoeuvre", "faute_eliminatoire"],
  },
  {
    id: "p3q3",
    parcours_id: 3,
    enonce: "Panneau STOP à l'intersection. La règle exacte ?",
    options: [
      "Je ralentis et je passe si personne n'arrive",
      "Arrêt complet, puis je cède le passage",
      "Je marque juste un ralentissement",
    ],
    correct: 1,
    explication:
      "STOP = arrêt TOTAL (vitesse zéro), même si la route est vide. Le « stop glissé » est éliminatoire.",
    tags: ["priorite", "signalisation", "faute_eliminatoire"],
  },
  {
    id: "p3q4",
    parcours_id: 3,
    enonce: "Rase campagne, il pleut. Ta vitesse max ?",
    options: ["90 km/h", "80 km/h", "110 km/h"],
    correct: 1,
    explication:
      "La pluie enlève 10 km/h : 80 au lieu de 90 hors agglo (et 110 au lieu de 130 sur autoroute).",
    tags: ["vitesse"],
  },
  {
    id: "p3q5",
    parcours_id: 3,
    enonce: "À 80 km/h, un pneu éclate d'un coup. Tu fais quoi ?",
    options: [
      "Je freine à fond immédiatement",
      "Je tiens fort le volant, je relâche l'accélérateur, je freine en douceur",
      "Je braque du côté de l'éclatement",
    ],
    correct: 1,
    explication:
      "Surtout pas de freinage brutal ni de coup de volant. Tu tiens le cap, tu décélères, tu freines doucement.",
    tags: ["verification_exterieure"],
  },
  {
    id: "p3q6",
    parcours_id: 3,
    enonce: "La nuit en campagne, tu croises une voiture. Tes phares ?",
    options: [
      "Je garde les pleins phares pour mieux voir",
      "J'éteins tous les phares",
      "Je passe en codes dès que je risque d'éblouir",
    ],
    correct: 2,
    explication:
      "Tu passes en feux de croisement (codes) dès qu'un véhicule arrive en face. L'éblouir, c'est l'aveugler.",
    tags: ["verification_interieure"],
  },
  {
    id: "p3q7",
    parcours_id: 3,
    enonce: "Un animal traverse la route devant toi. Tu fais quoi ?",
    options: [
      "Je klaxonne et j'accélère pour le faire fuir",
      "Je freine progressivement, je m'arrête s'il le faut",
      "Je l'évite en braquant d'un coup",
    ],
    correct: 1,
    explication:
      "Freinage progressif, trajectoire stable. Un écart brusque est souvent pire que l'animal.",
    tags: ["vitesse"],
  },
  {
    id: "p3q8",
    parcours_id: 3,
    enonce: "Ligne centrale blanche discontinue. Ça veut dire quoi ?",
    options: [
      "Dépassement interdit dans les deux sens",
      "Dépassement autorisé si la voie d'en face est libre",
      "Voie réservée aux véhicules lents",
    ],
    correct: 1,
    explication:
      "Discontinue = tu peux doubler, à condition d'avoir la visibilité et la voie d'en face libre.",
    tags: ["signalisation", "manoeuvre"],
  },
  {
    id: "p3q9",
    parcours_id: 3,
    enonce:
      "Cédez-le-passage, aucun véhicule en vue. T'es obligé de t'arrêter ?",
    options: [
      "Non, le cédez-le-passage n'impose pas l'arrêt",
      "Oui, c'est obligatoire comme un STOP",
      "Seulement si la visibilité est mauvaise",
    ],
    correct: 0,
    explication:
      "Tu ralentis et tu cèdes — mais si c'est visiblement libre, pas besoin de t'arrêter. C'est la différence avec le STOP.",
    tags: ["priorite", "signalisation"],
  },
  {
    id: "p3q10",
    parcours_id: 3,
    enonce:
      "Long trajet de nuit, tu sens la somnolence arriver. Tu fais quoi ?",
    options: [
      "J'ouvre la fenêtre et je monte la musique",
      "Je m'arrête : pause ou vraie sieste",
      "J'accélère pour finir plus vite",
    ],
    correct: 1,
    explication:
      "Le seul remède qui marche : s'arrêter et dormir (20 min minimum). Fenêtre et musique ne réveillent personne.",
    tags: ["eco_conduite"],
  },
  {
    id: "p3q11",
    parcours_id: 3,
    enonce: "Ta voiture part en aquaplaning sur route mouillée. Tu fais quoi ?",
    options: [
      "Je freine à fond et je braque",
      "Je relâche doucement l'accélérateur, sans braquer",
      "J'accélère pour sortir de la zone",
    ],
    correct: 1,
    explication:
      "Tu lèves le pied en douceur, volant droit, et tu laisses les pneus retrouver le contact. Pas de frein, pas de coup de volant.",
    tags: ["vitesse", "verification_exterieure"],
  },
  {
    id: "p3q12",
    parcours_id: 3,
    enonce: "Tu croises un convoi agricole très large. Tu fais quoi ?",
    options: [
      "Je roule au pas en me déportant à droite",
      "Je l'attends sur le bas-côté si la route est trop étroite",
      "Je klaxonne pour qu'il se rabatte",
    ],
    correct: 1,
    explication:
      "Route trop étroite = tu t'arrêtes sur le côté et tu le laisses passer. Lui ne peut pas se pousser, toi si.",
    tags: ["courtoisie", "manoeuvre"],
  },
  {
    id: "p3q13",
    parcours_id: 3,
    enonce:
      "Ligne blanche continue de TON côté de la route. Ça veut dire quoi ?",
    options: [
      "Ralentissement conseillé",
      "Dépassement interdit pour moi",
      "Limite de la chaussée",
    ],
    correct: 1,
    explication:
      "Continue de ton côté = interdiction de doubler pour toi. De l'autre côté, c'est l'autre qui ne peut pas.",
    tags: ["signalisation", "manoeuvre"],
  },
  {
    id: "p3q14",
    parcours_id: 3,
    enonce:
      "Un piéton marche au bord de la chaussée, face à toi. Tu fais quoi ?",
    options: [
      "Je klaxonne pour le prévenir",
      "Je le dépasse prudemment en laissant de l'espace",
      "Je continue normalement, c'est son problème",
    ],
    correct: 1,
    explication:
      "Tu ralentis et tu t'écartes pour le doubler avec une vraie marge de sécurité.",
    tags: ["pieton", "vitesse"],
  },
  {
    id: "p3q15",
    parcours_id: 3,
    enonce:
      "La nuit, tes feux de croisement (codes) éclairent jusqu'à quelle distance ?",
    options: ["30 mètres", "60 mètres", "100 mètres"],
    correct: 1,
    explication:
      "Environ 30 à 60 m de portée. Hors zones éclairées, passe en pleins phares pour voir plus loin.",
    tags: ["verification_interieure"],
  },

  // ── Parcours 4 : Lyon — zone 30 ───────────────────────────────
  {
    id: "p4q1",
    parcours_id: 4,
    enonce: "Un tramway arrive au carrefour en même temps que toi. Qui passe ?",
    options: [
      "Le tramway, toujours",
      "Celui qui arrive à droite",
      "Le plus rapide",
    ],
    correct: 0,
    explication:
      "Le tram a la priorité absolue, dans tous les cas. Il ne peut ni s'écarter ni s'arrêter vite.",
    tags: ["priorite"],
  },
  {
    id: "p4q2",
    parcours_id: 4,
    enonce: "Tu peux doubler un cycliste en zone 30 ?",
    options: [
      "Non, doubler est interdit en zone 30",
      "Oui, en laissant au moins 1 m sur le côté",
      "Seulement si j'ai assez de place",
    ],
    correct: 1,
    explication:
      "La zone 30 n'interdit pas de doubler — mais le 1 m de marge latérale reste obligatoire.",
    tags: ["cycliste", "vitesse"],
  },
  {
    id: "p4q3",
    parcours_id: 4,
    enonce:
      "Tu tournes à droite et un tramway arrive sur ta droite. Tu fais quoi ?",
    options: [
      "Je tourne vite avant qu'il arrive",
      "J'attends qu'il soit passé",
      "Je klaxonne pour prévenir le conducteur",
    ],
    correct: 1,
    explication:
      "Le tram est prioritaire : tu attends qu'il soit complètement passé avant de tourner.",
    tags: ["priorite", "faute_eliminatoire"],
  },
  {
    id: "p4q4",
    parcours_id: 4,
    enonce:
      "La voiture à ta gauche met son clignotant pour venir sur ta voie. Tu fais quoi ?",
    options: [
      "J'accélère pour garder ma place",
      "Je freine légèrement pour lui faire de la place, si c'est sûr",
      "Je klaxonne immédiatement",
    ],
    correct: 1,
    explication:
      "Tu facilites sa manœuvre si c'est sans risque. La courtoisie, c'est aussi noté à l'examen.",
    tags: ["courtoisie"],
  },
  {
    id: "p4q5",
    parcours_id: 4,
    enonce:
      "T'as le feu vert, mais un piéton avec une poussette finit de traverser. Tu fais quoi ?",
    options: [
      "J'avance prudemment, j'ai le vert",
      "J'attends qu'il ait complètement traversé",
      "Je klaxonne pour qu'il accélère",
    ],
    correct: 1,
    explication:
      "Feu vert ou pas, le piéton engagé finit de traverser en sécurité. Sa sécurité passe avant ta priorité.",
    tags: ["pieton", "faute_eliminatoire"],
  },
  {
    id: "p4q6",
    parcours_id: 4,
    enonce:
      "Dans une zone de rencontre, les piétons peuvent traverser hors des passages ?",
    options: [
      "Non, ils doivent utiliser les passages",
      "Oui, mais ils laissent passer les voitures",
      "Oui, et c'est aux conducteurs de les laisser passer",
    ],
    correct: 2,
    explication:
      "En zone de rencontre (20 km/h), les piétons sont prioritaires sur toute la chaussée. Attention : en zone 30, ils n'ont PAS cette priorité générale — c'est le piège classique.",
    tags: ["pieton", "signalisation"],
  },
  {
    id: "p4q7",
    parcours_id: 4,
    enonce:
      "Ta voiture hybride roule en mode électrique. Tu changes quoi vis-à-vis des piétons ?",
    options: [
      "Rien, c'est aux piétons de faire attention",
      "Je redouble de vigilance : ils ne m'entendent pas arriver",
      "Rien, la loi ne fait pas de différence",
    ],
    correct: 1,
    explication:
      "En mode électrique, t'es quasi silencieux. Piétons et malvoyants ne t'entendent pas — c'est à toi de compenser.",
    tags: ["pieton", "eco_conduite"],
  },
  {
    id: "p4q8",
    parcours_id: 4,
    enonce: "Un vélo cargo roule devant toi en zone 30. Tu peux le doubler ?",
    options: [
      "Non, il est trop large",
      "Oui, avec la place qu'il faut et 1 m de marge",
      "Oui, puisqu'il est plus lent",
    ],
    correct: 1,
    explication:
      "Comme tout vélo : visibilité + place suffisante + 1 m minimum de marge latérale.",
    tags: ["cycliste", "manoeuvre"],
  },
  {
    id: "p4q9",
    parcours_id: 4,
    enonce: "Du verglas est signalé. Tu adoptes quelle distance de sécurité ?",
    options: [
      "La même que sur sol sec",
      "Au moins le double, voire le triple",
      "5 mètres de plus",
    ],
    correct: 1,
    explication:
      "Sur verglas, ta distance de freinage est multipliée par 4 à 10. Double ou triple ta marge, minimum.",
    tags: ["vitesse"],
  },
  {
    id: "p4q10",
    parcours_id: 4,
    enonce: "Ta voiture patine dans un virage en descente. Tu fais quoi ?",
    options: [
      "Je freine à fond",
      "Je relâche l'accélérateur et je contre-braque légèrement",
      "J'accélère pour sortir du patinage",
    ],
    correct: 1,
    explication:
      "Pied levé en douceur, petit contre-braquage pour reprendre la trajectoire. Le freinage brutal aggrave la glissade.",
    tags: ["vitesse", "manoeuvre"],
  },
  {
    id: "p4q11",
    parcours_id: 4,
    enonce:
      "Dans une zone de rencontre (piétons + vélos + voitures), vitesse max ?",
    options: ["10 km/h", "20 km/h", "30 km/h"],
    correct: 1,
    explication:
      "20 km/h. Et les piétons y sont prioritaires sur toute la largeur de la voie.",
    tags: ["vitesse", "signalisation", "pieton"],
  },
  {
    id: "p4q12",
    parcours_id: 4,
    enonce: "T'es garé et tu veux repartir. Tu fais quoi, dans l'ordre ?",
    options: [
      "Clignotant et je pars sans regarder",
      "Rétros + angle mort, clignotant, puis je m'engage",
      "Un coup de klaxon puis je pars",
    ],
    correct: 1,
    explication:
      "Contrôles d'abord (rétros + angle mort), clignotant ensuite, départ progressif. Dans cet ordre.",
    tags: ["manoeuvre", "verification_interieure"],
  },
  {
    id: "p4q13",
    parcours_id: 4,
    enonce:
      "Zone bleue, mais t'as pas ton disque de stationnement. Tu fais quoi ?",
    options: [
      "Je me gare quand même 5 minutes",
      "Je cherche une autre place",
      "Je photographie l'heure avec mon téléphone",
    ],
    correct: 1,
    explication:
      "Sans disque, pas de zone bleue — même pour 5 minutes. Tu cherches ailleurs.",
    tags: ["signalisation"],
  },
  {
    id: "p4q14",
    parcours_id: 4,
    enonce: "Dos d'âne en zone 30. Tu l'abordes comment ?",
    options: [
      "À 30 km/h ou moins, bien stable dans ma voie",
      "En freinant fort juste avant",
      "En réaccélérant fort juste après",
    ],
    correct: 0,
    explication:
      "Vitesse adaptée AVANT le ralentisseur, passage en douceur. Ni freinage brutal ni accélération sèche.",
    tags: ["vitesse", "manoeuvre"],
  },
  {
    id: "p4q15",
    parcours_id: 4,
    enonce:
      "Un cycliste devant toi agite la main vers le bas. Ça veut dire quoi ?",
    options: [
      "Il me remercie",
      "Il me demande de ralentir",
      "Il signale un obstacle sur la route",
    ],
    correct: 1,
    explication:
      "Main vers le bas = « ralentis ». Un geste codifié, courant dans les groupes de cyclistes.",
    tags: ["cycliste", "courtoisie"],
  },

  // ── Parcours 5 : Voie rapide / A86 ────────────────────────────
  {
    id: "p5q1",
    parcours_id: 5,
    enonce: "Tu t'insères sur l'autoroute depuis la bretelle. Tu fais quoi ?",
    options: [
      "J'accélère sur la voie d'accélération pour prendre la vitesse du trafic, et je m'insère en cédant le passage",
      "Je m'arrête en bout de bretelle et j'attends un trou",
      "Je force le passage, je suis sur la voie de droite",
    ],
    correct: 0,
    explication:
      "La voie d'accélération sert à ça : tu prends la vitesse du trafic, puis tu t'insères en cédant à ceux qui y sont déjà.",
    tags: ["manoeuvre", "faute_eliminatoire"],
  },
  {
    id: "p5q2",
    parcours_id: 5,
    enonce: "Vitesse max sur autoroute par temps sec ?",
    options: ["110 km/h", "130 km/h", "150 km/h"],
    correct: 1,
    explication:
      "130 km/h par temps sec. 110 sous la pluie, et 110 aussi en permis probatoire.",
    tags: ["vitesse", "signalisation"],
  },
  {
    id: "p5q3",
    parcours_id: 5,
    enonce: "À 130 km/h, quelle distance de sécurité minimum ?",
    options: [
      "50 mètres",
      "2 secondes (environ 72 mètres à 130 km/h)",
      "200 mètres",
    ],
    correct: 1,
    explication:
      "Toujours la règle des 2 secondes — à 130 km/h ça fait environ 72 m. Repère : 2 bandes blanches de la BAU.",
    tags: ["vitesse"],
  },
  {
    id: "p5q4",
    parcours_id: 5,
    enonce: "Sur autoroute, tu doubles par où ?",
    options: [
      "Par la droite uniquement",
      "Par la gauche uniquement",
      "Des deux côtés, selon la situation",
    ],
    correct: 1,
    explication:
      "Par la gauche, toujours. Doubler par la droite est interdit et dangereux.",
    tags: ["manoeuvre", "signalisation"],
  },
  {
    id: "p5q5",
    parcours_id: 5,
    enonce: "Crevaison sur l'autoroute. Tu fais quoi en priorité ?",
    options: [
      "Je m'arrête tout de suite sur la voie de gauche",
      "Je ralentis progressivement, warnings allumés, et je rejoins la bande d'arrêt d'urgence",
      "J'accélère pour atteindre la prochaine aire",
    ],
    correct: 1,
    explication:
      "Warnings, décélération progressive sans freinage brutal, et tu rejoins la BAU. Puis tout le monde derrière la glissière.",
    tags: ["verification_exterieure", "premiers_secours"],
  },
  {
    id: "p5q6",
    parcours_id: 5,
    enonce: "Un animal sauvage traverse ta voie à 200 m. Tu fais quoi ?",
    options: [
      "Je freine brusquement",
      "Je relâche l'accélérateur progressivement et j'allume mes warnings",
      "Je me déporte sur la voie de gauche",
    ],
    correct: 1,
    explication:
      "À haute vitesse, pas de geste brusque : tu ralentis en douceur et tu préviens ceux qui te suivent avec les warnings.",
    tags: ["vitesse"],
  },
  {
    id: "p5q7",
    parcours_id: 5,
    enonce: "La bande d'arrêt d'urgence (BAU), elle sert à quoi ?",
    options: [
      "À rouler quand ça bouchonne",
      "Aux urgences uniquement : pannes, secours, forces de l'ordre",
      "À doubler si la voie de droite est chargée",
    ],
    correct: 1,
    explication:
      "Urgences uniquement. Y rouler est interdit — et tu bloques le passage des secours.",
    tags: ["signalisation", "faute_eliminatoire"],
  },
  {
    id: "p5q8",
    parcours_id: 5,
    enonce: "Autoroute sous la pluie. Vitesse max ?",
    options: ["130 km/h", "110 km/h", "90 km/h"],
    correct: 1,
    explication: "110 km/h dès qu'il pleut, au lieu de 130.",
    tags: ["vitesse", "signalisation"],
  },
  {
    id: "p5q9",
    parcours_id: 5,
    enonce: "Tu as raté ta sortie d'autoroute. Tu fais quoi ?",
    options: [
      "Je recule sur la BAU jusqu'à la sortie",
      "Je continue jusqu'à la prochaine sortie",
      "Je fais demi-tour sur l'autoroute",
    ],
    correct: 1,
    explication:
      "Tu continues, point. Reculer ou faire demi-tour sur autoroute, c'est interdit et mortel.",
    tags: ["manoeuvre", "signalisation"],
  },
  {
    id: "p5q10",
    parcours_id: 5,
    enonce:
      "T'es sur la voie de gauche depuis 5 km sans rien doubler. Tu fais quoi ?",
    options: [
      "Je reviens à droite — rouler à gauche sans doubler est interdit",
      "Je reste à gauche, c'est plus rapide",
      "J'accélère",
    ],
    correct: 0,
    explication:
      "La voie de gauche sert à doubler, pas à voyager. Dès que c'est fini, tu te rabats à droite.",
    tags: ["manoeuvre", "signalisation"],
  },
  {
    id: "p5q11",
    parcours_id: 5,
    enonce: "Tu sens un malaise au volant sur l'autoroute. La procédure ?",
    options: [
      "Je continue jusqu'à la prochaine aire",
      "Warnings, arrêt sur la BAU, moteur coupé, j'appelle les secours",
      "J'ouvre la fenêtre et je respire en continuant",
    ],
    correct: 1,
    explication:
      "Tu ne joues pas avec ça : warnings, BAU au plus vite, moteur coupé, et tu appelles le 15 ou le 112.",
    tags: ["premiers_secours", "verification_interieure"],
  },
  {
    id: "p5q12",
    parcours_id: 5,
    enonce: "Au péage, t'es dans la mauvaise file. Tu fais quoi ?",
    options: [
      "Je passe quand même et je régularise en ligne",
      "Je change de file le plus tôt possible, avec précaution",
      "Je m'arrête sur la BAU avant le péage",
    ],
    correct: 1,
    explication:
      "Tu changes de file tôt et en sécurité, bien avant les bornes. Jamais d'arrêt sur la BAU pour ça.",
    tags: ["manoeuvre"],
  },
  {
    id: "p5q13",
    parcours_id: 5,
    enonce:
      "Il existe une vitesse MINIMALE légale sur autoroute (voie de droite) ?",
    options: ["60 km/h", "80 km/h", "Non, pas de minimum légal"],
    correct: 2,
    explication:
      "Pas de minimum légal en France. Mais rouler trop lentement crée un vrai danger — en dessous de 60, c'est déconseillé.",
    tags: ["vitesse"],
  },
  {
    id: "p5q14",
    parcours_id: 5,
    enonce:
      "Des panneaux lumineux variables affichent 70 km/h. T'es obligé de respecter ?",
    options: [
      "Non, c'est juste indicatif",
      "Oui, ils ont force de loi",
      "Seulement si un bouchon est signalé",
    ],
    correct: 1,
    explication:
      "Les panneaux à message variable valent autant qu'un panneau fixe. 70 affiché = 70 obligatoire.",
    tags: ["vitesse", "signalisation"],
  },
  {
    id: "p5q15",
    parcours_id: 5,
    enonce:
      "Tu sors de l'autoroute après 2 h à 130 km/h. Quel piège t'attend ?",
    options: [
      "Aucun, rien de particulier",
      "Je risque de sous-estimer ma vitesse en ville — l'effet tunnel",
      "Je conduis mieux, je suis échauffé",
    ],
    correct: 1,
    explication:
      "Après 2 h à 130, le 50 en ville paraît ultra lent. Ta perception est faussée : fie-toi au compteur, pas à tes sensations.",
    tags: ["vitesse", "eco_conduite"],
  },

  // ── Parcours 6 : Révisions essentielles ───────────────────────
  {
    id: "p6q1",
    parcours_id: 6,
    enonce: "Au volant, le taux d'alcool maximum autorisé dans le sang ?",
    options: ["0,2 g/L", "0,5 g/L", "0,8 g/L"],
    correct: 1,
    explication:
      "0,5 g/L de sang (soit 0,25 mg/L d'air expiré). En permis probatoire, c'est 0,2 g/L — quasiment zéro.",
    tags: ["alcool"],
  },
  {
    id: "p6q2",
    parcours_id: 6,
    enonce: "En permis probatoire, combien de points as-tu au départ ?",
    options: ["6 points", "8 points", "12 points"],
    correct: 0,
    explication:
      "6 points au début. Tu montes à 12 après 3 ans sans infraction (2 ans en conduite accompagnée).",
    tags: ["permis"],
  },
  {
    id: "p6q3",
    parcours_id: 6,
    enonce: "Qui doit attacher sa ceinture en voiture ?",
    options: [
      "Seulement à l'avant",
      "Tous les passagers, avant comme arrière",
      "Seulement le conducteur",
    ],
    correct: 1,
    explication:
      "Tout le monde, à toutes les places. Le conducteur est responsable des passagers mineurs non attachés.",
    tags: ["equipement"],
  },
  {
    id: "p6q4",
    parcours_id: 6,
    enonce: "Profondeur minimale des rainures d'un pneu ?",
    options: ["1 mm", "1,6 mm", "3 mm"],
    correct: 1,
    explication:
      "1,6 mm minimum. En dessous, le pneu n'évacue plus l'eau et le risque d'aquaplaning grimpe.",
    tags: ["verification_exterieure"],
  },
  {
    id: "p6q5",
    parcours_id: 6,
    enonce: "Sur un long trajet, à quelle fréquence faire une pause ?",
    options: [
      "Toutes les 2 heures environ",
      "Toutes les 5 heures",
      "Seulement si je me sens fatigué",
    ],
    correct: 0,
    explication:
      "Une pause d'au moins 15 minutes toutes les 2 heures, même sans fatigue ressentie. La somnolence arrive sans prévenir.",
    tags: ["verification_interieure"],
  },
  {
    id: "p6q6",
    parcours_id: 6,
    enonce: "Un siège bébé dos à la route, installé à l'avant : et l'airbag ?",
    options: [
      "On le laisse activé",
      "On le désactive d'abord",
      "Peu importe après 6 mois",
    ],
    correct: 1,
    explication:
      "Jamais d'airbag passager actif face à un siège dos à la route : en cas de choc il blesserait gravement le bébé. On le désactive avant.",
    tags: ["equipement"],
  },
  {
    id: "p6q7",
    parcours_id: 6,
    enonce: "Un panneau triangulaire, pointe vers le bas, signifie ?",
    options: ["Stop", "Cédez le passage", "Sens interdit"],
    correct: 1,
    explication:
      "Triangle pointe en bas = cédez le passage : tu ralentis et tu laisses passer, sans forcément t'arrêter (à la différence du STOP).",
    tags: ["signalisation"],
  },
  {
    id: "p6q8",
    parcours_id: 6,
    enonce: "En plein jour, sous une forte pluie, tu allumes quels feux ?",
    options: [
      "Aucun, il fait jour",
      "Les feux de croisement",
      "Les pleins phares",
    ],
    correct: 1,
    explication:
      "Feux de croisement dès que la visibilité baisse (pluie, brouillard), même de jour : pour voir et surtout être vu.",
    tags: ["verification_interieure"],
  },
  {
    id: "p6q9",
    parcours_id: 6,
    enonce: "Tu utilises les feux de brouillard arrière dans quel cas ?",
    options: [
      "Sous une forte pluie",
      "Par brouillard ou neige épais seulement",
      "La nuit sur autoroute",
    ],
    correct: 1,
    explication:
      "Réservés au brouillard ou à la neige denses. Sous la pluie ils éblouissent ceux qui te suivent — c'est même interdit.",
    tags: ["signalisation", "verification_interieure"],
  },
  {
    id: "p6q10",
    parcours_id: 6,
    enonce: "Pour consommer moins de carburant, le bon réflexe ?",
    options: [
      "Rouler à haut régime",
      "Anticiper et lever le pied tôt",
      "Accélérer puis freiner souvent",
    ],
    correct: 1,
    explication:
      "Anticiper, lever le pied tôt et utiliser le frein moteur : moins de carburant, moins d'usure, moins de CO₂.",
    tags: ["eco_conduite"],
  },
  {
    id: "p6q11",
    parcours_id: 6,
    enonce: "En France, quel numéro pour joindre les pompiers ?",
    options: ["15", "17", "18"],
    correct: 2,
    explication:
      "18 = pompiers. 15 = SAMU, 17 = police/gendarmerie, 112 = numéro d'urgence européen.",
    tags: ["premiers_secours"],
  },
  {
    id: "p6q12",
    parcours_id: 6,
    enonce: "Conduire après avoir consommé du cannabis, c'est ?",
    options: [
      "Toléré en petite quantité",
      "Interdit, tolérance zéro",
      "Autorisé après quelques heures",
    ],
    correct: 1,
    explication:
      "Tolérance zéro pour les stupéfiants au volant, quelle que soit la quantité. Les sanctions sont lourdes.",
    tags: ["stupefiants"],
  },
  {
    id: "p6q13",
    parcours_id: 6,
    enonce:
      "Arrêt d'urgence hors agglo : que fais-tu avant de sortir de la voiture ?",
    options: [
      "J'enfile mon gilet jaune",
      "Je sors vite poser le triangle",
      "J'attends les secours à l'intérieur",
    ],
    correct: 0,
    explication:
      "Gilet AVANT de sortir, puis triangle ~30 m en amont, et tout le monde derrière la glissière. L'ordre compte.",
    tags: ["premiers_secours"],
  },
  {
    id: "p6q14",
    parcours_id: 6,
    enonce: "En permis probatoire, ta vitesse max sur autoroute ?",
    options: ["110 km/h", "120 km/h", "130 km/h"],
    correct: 0,
    explication:
      "110 km/h au lieu de 130 pendant la période probatoire. Tu dois aussi afficher le disque « A » à l'arrière.",
    tags: ["vitesse", "permis"],
  },
  {
    id: "p6q15",
    parcours_id: 6,
    enonce:
      "Hors agglomération, tu doubles un cycliste en laissant quelle marge ?",
    options: ["0,5 m", "1 m", "1,5 m"],
    correct: 2,
    explication:
      "1,50 m hors agglomération (1 m en ville). Plus tu roules vite, plus il faut d'espace.",
    tags: ["cycliste"],
  },

  // ── Parcours 7 : Nuit & météo difficile ───────────────────────
  {
    id: "p7q1",
    parcours_id: 7,
    enonce: "Brouillard épais en plein jour. Quels feux tu allumes ?",
    options: [
      "Les pleins phares pour percer le brouillard",
      "Feux de croisement (+ feux de brouillard avant)",
      "Juste les feux de position",
    ],
    correct: 1,
    explication:
      "Croisement + éventuellement feux de brouillard avant. Surtout PAS les pleins phares : le brouillard renvoie la lumière et t'éblouit.",
    tags: ["verification_interieure"],
  },
  {
    id: "p7q2",
    parcours_id: 7,
    enonce: "Tu vois à moins de 50 m (brouillard épais). Ta vitesse max ?",
    options: ["50 km/h partout", "70 km/h", "90 km/h"],
    correct: 0,
    explication:
      "Visibilité inférieure à 50 m = 50 km/h maximum, même sur autoroute. La règle est la même partout.",
    tags: ["vitesse"],
  },
  {
    id: "p7q3",
    parcours_id: 7,
    enonce: "Quand utilises-tu les pleins phares (feux de route) ?",
    options: [
      "En ville bien éclairée",
      "Hors agglo, route non éclairée et personne en face",
      "Toujours, dès qu'il fait nuit",
    ],
    correct: 1,
    explication:
      "Pleins phares = route non éclairée et personne en face. Tu repasses en codes dès qu'un véhicule arrive ou que tu en suis un.",
    tags: ["verification_interieure"],
  },
  {
    id: "p7q4",
    parcours_id: 7,
    enonce: "La nuit, un véhicule en face t'éblouit. Tu fais quoi ?",
    options: [
      "Je fixe ses phares pour le suivre",
      "Je regarde le bord droit de ma voie et je ralentis",
      "Je mets mes pleins phares aussi",
    ],
    correct: 1,
    explication:
      "Jamais fixer les phares : tu prends le bord droit de ta voie comme repère et tu ralentis le temps de récupérer ta vue.",
    tags: ["verification_interieure"],
  },
  {
    id: "p7q5",
    parcours_id: 7,
    enonce: "Neige : sur quelles roues monter les chaînes ?",
    options: [
      "Les roues motrices (avant si traction avant)",
      "N'importe lesquelles",
      "Les roues arrière, toujours",
    ],
    correct: 0,
    explication:
      "Les chaînes se montent sur les roues motrices. Le panneau B26 (pneu + chaîne) les rend obligatoires.",
    tags: ["verification_exterieure"],
  },
  {
    id: "p7q6",
    parcours_id: 7,
    enonce: "Par grand froid, où le verglas apparaît-il en premier ?",
    options: [
      "Sur les ponts et les zones à l'ombre",
      "En plein soleil",
      "Uniquement dans les descentes",
    ],
    correct: 0,
    explication:
      "Ponts, viaducs et zones ombragées gèlent en premier (l'air circule dessous). Méfiance même si la route semble sèche.",
    tags: ["vitesse"],
  },
  {
    id: "p7q7",
    parcours_id: 7,
    enonce: "Comment éviter l'aquaplaning sous la pluie ?",
    options: [
      "Rouler vite pour « fendre » l'eau",
      "Réduire sa vitesse et garder de bons pneus",
      "Freiner par à-coups",
    ],
    correct: 1,
    explication:
      "Vitesse réduite + pneus avec assez de gomme. Au-delà d'une certaine vitesse, l'eau ne s'évacue plus et tu flottes.",
    tags: ["vitesse", "verification_exterieure"],
  },
  {
    id: "p7q8",
    parcours_id: 7,
    enonce:
      "Forte rafale de vent latéral (sortie de tunnel, pont). Tu fais quoi ?",
    options: [
      "J'accélère pour passer vite",
      "Je tiens le volant fermement et je ralentis",
      "Je relâche un peu le volant",
    ],
    correct: 1,
    explication:
      "Volant tenu ferme, vitesse réduite. Les rafales surprennent surtout en sortie de tunnel et sur les ponts.",
    tags: ["vitesse"],
  },
  {
    id: "p7q9",
    parcours_id: 7,
    enonce: "Quel signe annonce un endormissement au volant ?",
    options: [
      "Bâillements répétés et paupières lourdes",
      "Une petite faim",
      "L'envie d'écouter de la musique",
    ],
    correct: 0,
    explication:
      "Bâillements, paupières lourdes, regard fixe = micro-sommeil imminent. Seul remède : s'arrêter et dormir 15-20 min.",
    tags: ["verification_interieure"],
  },
  {
    id: "p7q10",
    parcours_id: 7,
    enonce:
      "Les feux de position (veilleuses) suffisent-ils pour rouler la nuit ?",
    options: [
      "Oui, en ville",
      "Non, jamais pour circuler",
      "Oui, hors agglomération",
    ],
    correct: 1,
    explication:
      "Les feux de position servent à être vu à l'arrêt, pas à éclairer la route. Pour rouler la nuit : feux de croisement au minimum.",
    tags: ["verification_interieure"],
  },
  {
    id: "p7q11",
    parcours_id: 7,
    enonce: "Sous la pluie, ta distance de sécurité ?",
    options: [
      "La même qu'au sec",
      "Au moins doublée",
      "Réduite, car on roule moins vite",
    ],
    correct: 1,
    explication:
      "Sol mouillé = freinage plus long. Tu doubles ta distance : la règle des 2 secondes passe à environ 4 secondes.",
    tags: ["vitesse"],
  },
  {
    id: "p7q12",
    parcours_id: 7,
    enonce: "Tu vas sortir d'un tunnel en plein jour. Quel piège ?",
    options: [
      "Aucun, je garde ma vitesse",
      "L'éblouissement : j'ai ralenti avant et je laisse mes yeux s'adapter",
      "Mettre des lunettes de soleil dans le tunnel",
    ],
    correct: 1,
    explication:
      "Le passage ombre → lumière éblouit : tu anticipes en ralentissant avant la sortie, le temps que tes yeux s'adaptent.",
    tags: ["vitesse"],
  },
  {
    id: "p7q13",
    parcours_id: 7,
    enonce: "Arrêt forcé dans un tunnel. Que fais-tu ?",
    options: [
      "Je reste dans la voiture, moteur allumé",
      "Warnings, je me range, moteur coupé, je gagne une sortie de secours",
      "Je fais demi-tour",
    ],
    correct: 1,
    explication:
      "En tunnel : warnings, se ranger à droite, couper le moteur, rejoindre une issue de secours à pied. Jamais de demi-tour.",
    tags: ["premiers_secours"],
  },
  {
    id: "p7q14",
    parcours_id: 7,
    enonce: "Sur route enneigée, comment freines-tu ?",
    options: [
      "Freinage brusque",
      "J'anticipe, je freine en douceur, j'utilise le frein moteur",
      "Je ne freine jamais",
    ],
    correct: 1,
    explication:
      "Tout en douceur : on anticipe et on utilise le frein moteur. Un coup de frein brusque bloque les roues et fait glisser.",
    tags: ["vitesse"],
  },
  {
    id: "p7q15",
    parcours_id: 7,
    enonce: "La nuit, à quelle vitesse rouler par rapport à ta visibilité ?",
    options: [
      "À la vitesse autorisée, quoi qu'il arrive",
      "De façon à pouvoir m'arrêter dans la zone éclairée par mes phares",
      "Au feeling",
    ],
    correct: 1,
    explication:
      "Règle d'or de nuit : ta vitesse doit te permettre de t'arrêter dans la distance éclairée. Sinon tu roules « plus vite que ta vue ».",
    tags: ["vitesse"],
  },

  // ── Parcours 8 : Panneaux & signalisation ─────────────────────
  {
    id: "p8q1",
    parcours_id: 8,
    enonce: "Un panneau rond à bord rouge, ça veut dire ?",
    options: ["Danger", "Interdiction", "Obligation"],
    correct: 1,
    explication:
      "Rond à bord rouge = interdiction (sens interdit, vitesse max…). Le rond bleu = obligation, le triangle = danger.",
    tags: ["signalisation"],
  },
  {
    id: "p8q2",
    parcours_id: 8,
    enonce: "Un panneau rond entièrement bleu, ça veut dire ?",
    options: ["Interdiction", "Obligation", "Simple indication"],
    correct: 1,
    explication:
      "Rond bleu = obligation (sens obligatoire, piste cyclable obligatoire…).",
    tags: ["signalisation"],
  },
  {
    id: "p8q3",
    parcours_id: 8,
    enonce: "Un panneau triangulaire à bord rouge, ça annonce ?",
    options: ["Un danger", "Une interdiction", "Une direction"],
    correct: 0,
    explication:
      "Triangle à bord rouge = danger : il annonce, tu lèves le pied et tu restes vigilant.",
    tags: ["signalisation"],
  },
  {
    id: "p8q4",
    parcours_id: 8,
    enonce: "Au STOP, où t'arrêtes-tu exactement ?",
    options: [
      "Au niveau du panneau",
      "À la ligne blanche transversale au sol",
      "Au milieu du carrefour",
    ],
    correct: 1,
    explication:
      "Arrêt complet à la ligne au sol. Pas de ligne ? Tu t'arrêtes à l'aplomb du panneau, avant l'intersection.",
    tags: ["signalisation", "priorite"],
  },
  {
    id: "p8q5",
    parcours_id: 8,
    enonce:
      "Des flèches obliques au sol pointent vers la droite. Ça signifie ?",
    options: [
      "Tu peux encore doubler",
      "Rabats-toi : une ligne continue arrive",
      "Voie réservée aux bus",
    ],
    correct: 1,
    explication:
      "Ces flèches de rabattement annoncent une ligne continue : termine ton dépassement et reviens à droite.",
    tags: ["signalisation", "manoeuvre"],
  },
  {
    id: "p8q6",
    parcours_id: 8,
    enonce: "Différence entre « Cédez le passage » et « STOP » ?",
    options: [
      "Aucune",
      "Le cédez n'impose pas l'arrêt, le STOP si",
      "Le STOP n'impose pas l'arrêt",
    ],
    correct: 1,
    explication:
      "STOP = arrêt total obligatoire. Cédez le passage = tu ralentis et tu cèdes, sans t'arrêter si c'est libre.",
    tags: ["signalisation", "priorite"],
  },
  {
    id: "p8q7",
    parcours_id: 8,
    enonce: "Un feu orange clignotant, ça veut dire ?",
    options: [
      "Arrêt obligatoire",
      "Prudence : tu passes en respectant les priorités",
      "Voie fermée",
    ],
    correct: 1,
    explication:
      "Orange clignotant = carrefour à prudence : tu franchis en cédant le passage selon les règles de priorité du lieu.",
    tags: ["signalisation"],
  },
  {
    id: "p8q8",
    parcours_id: 8,
    enonce: "Un feu rouge clignotant (passage à niveau), tu fais quoi ?",
    options: [
      "Je passe si je ne vois pas de train",
      "Arrêt absolu, je ne franchis pas",
      "Je ralentis seulement",
    ],
    correct: 1,
    explication:
      "Rouge clignotant = arrêt absolu, typiquement aux passages à niveau. On ne franchit jamais.",
    tags: ["signalisation"],
  },
  {
    id: "p8q9",
    parcours_id: 8,
    enonce: "Une ligne blanche continue, tu peux la franchir ?",
    options: ["Non, jamais", "Oui, pour doubler", "Oui, pour se garer"],
    correct: 0,
    explication:
      "Ligne continue = on ne la franchit ni ne la chevauche. La forcer est une faute lourde.",
    tags: ["signalisation", "manoeuvre"],
  },
  {
    id: "p8q10",
    parcours_id: 8,
    enonce: "Un panneau triangle avec deux enfants, ça annonce ?",
    options: [
      "Une aire de jeux",
      "Un endroit fréquenté par des enfants (école)",
      "Une interdiction aux enfants",
    ],
    correct: 1,
    explication:
      "Danger : passage fréquenté par des enfants (sortie d'école). Vitesse réduite et vigilance maximale.",
    tags: ["signalisation", "pieton"],
  },
  {
    id: "p8q11",
    parcours_id: 8,
    enonce: "Le panneau d'entrée d'agglomération (nom de la ville) impose ?",
    options: [
      "50 km/h sauf indication contraire",
      "30 km/h",
      "Aucune limitation",
    ],
    correct: 0,
    explication:
      "Entrer en agglomération = 50 km/h par défaut, jusqu'au panneau de sortie (le même, barré).",
    tags: ["signalisation", "vitesse"],
  },
  {
    id: "p8q12",
    parcours_id: 8,
    enonce: "Une zone hachurée (zébra) au sol, tu peux rouler dessus ?",
    options: [
      "Oui, si je suis pressé",
      "Non, c'est une zone interdite à la circulation",
      "Oui, pour doubler",
    ],
    correct: 1,
    explication:
      "Les zébras délimitent une zone interdite : on n'y roule pas et on ne s'y arrête pas.",
    tags: ["signalisation", "manoeuvre"],
  },
  {
    id: "p8q13",
    parcours_id: 8,
    enonce: "Un panneau rond gris barré d'une diagonale, ça veut dire ?",
    options: [
      "Début d'une interdiction",
      "Fin de l'interdiction précédente",
      "Stationnement autorisé",
    ],
    correct: 1,
    explication:
      "Rond gris barré = fin de la limitation ou interdiction qui précédait (ex : fin de la zone à 70).",
    tags: ["signalisation"],
  },
  {
    id: "p8q14",
    parcours_id: 8,
    enonce: "Un panneau carré bleu avec un grand « P », ça veut dire ?",
    options: [
      "Stationnement interdit",
      "Stationnement autorisé",
      "Parking payant obligatoire",
    ],
    correct: 1,
    explication:
      "Carré bleu « P » = stationnement autorisé. Les conditions (payant, durée) sont précisées par un panonceau en dessous.",
    tags: ["signalisation"],
  },
  {
    id: "p8q15",
    parcours_id: 8,
    enonce: "Une bande cyclable, c'est quoi exactement ?",
    options: [
      "Une voie séparée physiquement de la route",
      "Une voie sur la chaussée, juste marquée au sol",
      "Un chemin réservé aux piétons",
    ],
    correct: 1,
    explication:
      "La bande cyclable est sur la chaussée (une simple ligne). La piste, elle, est séparée. Les deux sont réservées aux vélos.",
    tags: ["signalisation", "cycliste"],
  },

  // ── Parcours 9 : Montagne & routes sinueuses ──────────────────
  {
    id: "p9q1",
    parcours_id: 9,
    enonce: "Longue descente de montagne : comment freiner sans risque ?",
    options: [
      "Le pied sur le frein en continu",
      "Frein moteur (rapport inférieur) + freinages courts",
      "Au point mort pour économiser",
    ],
    correct: 1,
    explication:
      "Rapport inférieur pour le frein moteur, et freinages brefs. Le frein en continu surchauffe et finit par lâcher.",
    tags: ["manoeuvre", "vitesse"],
  },
  {
    id: "p9q2",
    parcours_id: 9,
    enonce: "Qu'est-ce qui est dangereux en descente ?",
    options: [
      "Rouler au point mort ou moteur coupé",
      "Garder un rapport engagé",
      "Anticiper les virages",
    ],
    correct: 0,
    explication:
      "Point mort ou moteur coupé = perte du frein moteur (et parfois de la direction assistée). Interdit et dangereux.",
    tags: ["manoeuvre"],
  },
  {
    id: "p9q3",
    parcours_id: 9,
    enonce:
      "Croisement difficile sur une route de montagne étroite. Qui se range ?",
    options: ["Celui qui descend", "Celui qui monte", "Le plus gros véhicule"],
    correct: 0,
    explication:
      "Priorité à celui qui monte (plus dur de redémarrer en côte). Celui qui descend se range ou recule.",
    tags: ["priorite"],
  },
  {
    id: "p9q4",
    parcours_id: 9,
    enonce: "Virage sans visibilité : où te places-tu ?",
    options: [
      "Je coupe le virage pour aller plus vite",
      "Je serre à droite, bien sur ma voie",
      "Je roule au milieu",
    ],
    correct: 1,
    explication:
      "Tu restes serré à droite sur ta voie : un véhicule peut surgir en face. Couper un virage est une faute grave.",
    tags: ["manoeuvre"],
  },
  {
    id: "p9q5",
    parcours_id: 9,
    enonce: "Un panneau indique « 10 % » en descente. Ça veut dire ?",
    options: [
      "La distance restante",
      "L'inclinaison de la pente",
      "La vitesse conseillée",
    ],
    correct: 1,
    explication:
      "Le pourcentage indique l'inclinaison de la pente. Plus c'est élevé, plus tu anticipes le frein moteur.",
    tags: ["signalisation"],
  },
  {
    id: "p9q6",
    parcours_id: 9,
    enonce:
      "Panneau « chaussée glissante » (voiture qui dérape). Tu fais quoi ?",
    options: [
      "J'accélère",
      "Je ralentis et j'évite les gestes brusques",
      "Je freine fort par sécurité",
    ],
    correct: 1,
    explication:
      "Danger de glissance : vitesse réduite, trajectoire souple, ni freinage ni braquage brusque.",
    tags: ["vitesse"],
  },
  {
    id: "p9q7",
    parcours_id: 9,
    enonce: "Derrière un poids lourd lent en montée, tu doubles quand ?",
    options: [
      "Dès que possible, même en courbe",
      "Sur une ligne droite avec bonne visibilité",
      "En le collant pour le presser",
    ],
    correct: 1,
    explication:
      "On ne double qu'avec visibilité et voie libre. En montagne, les courbes masquent les véhicules en face.",
    tags: ["manoeuvre"],
  },
  {
    id: "p9q8",
    parcours_id: 9,
    enonce: "Tu entres dans un tunnel de montagne en plein jour. Tu allumes ?",
    options: [
      "Les feux de croisement",
      "Les pleins phares",
      "Rien, il fait jour",
    ],
    correct: 0,
    explication:
      "Feux de croisement obligatoires en tunnel, même de jour : pour voir et être vu.",
    tags: ["verification_interieure"],
  },
  {
    id: "p9q9",
    parcours_id: 9,
    enonce: "Une odeur de freins brûlés apparaît en descente. Que fais-tu ?",
    options: [
      "Rien, c'est normal",
      "Frein moteur davantage, et je m'arrête si besoin pour les laisser refroidir",
      "J'accélère pour finir la descente",
    ],
    correct: 1,
    explication:
      "Odeur = freins en surchauffe : tu utilises plus le frein moteur, et si besoin tu t'arrêtes en sécurité pour les laisser refroidir.",
    tags: ["verification_exterieure"],
  },
  {
    id: "p9q10",
    parcours_id: 9,
    enonce:
      "Panneau annonçant des passages d'animaux (cerf). Quand redoubler de vigilance ?",
    options: [
      "À l'aube et au crépuscule",
      "En plein midi",
      "Jamais, c'est rare",
    ],
    correct: 0,
    explication:
      "Les animaux traversent surtout à l'aube et au crépuscule. Tu ralentis et tu scrutes les bas-côtés.",
    tags: ["vitesse"],
  },
  {
    id: "p9q11",
    parcours_id: 9,
    enonce: "Un car manœuvre dans une épingle serrée. Tu fais quoi ?",
    options: [
      "Je force le passage",
      "J'attends qu'il ait terminé sa manœuvre",
      "Je klaxonne pour le presser",
    ],
    correct: 1,
    explication:
      "Dans une épingle, un car a besoin de toute la largeur : tu attends plutôt que de te coincer.",
    tags: ["courtoisie", "manoeuvre"],
  },
  {
    id: "p9q12",
    parcours_id: 9,
    enonce: "Où le verglas est-il le plus tenace en montagne ?",
    options: [
      "En plein soleil au sommet",
      "Sur les ponts et les versants à l'ombre",
      "Sur les lignes droites dégagées",
    ],
    correct: 1,
    explication:
      "Ombre et altitude = verglas tenace, surtout sur les ponts et versants nord. Méfiance même par beau temps.",
    tags: ["vitesse"],
  },
  {
    id: "p9q13",
    parcours_id: 9,
    enonce: "Démarrage en côte : comment éviter de reculer ?",
    options: [
      "Je coordonne frein, embrayage et accélérateur (ou j'utilise l'aide au démarrage)",
      "Je lâche tout d'un coup",
      "Je recule un peu volontairement",
    ],
    correct: 0,
    explication:
      "En côte, tu doses frein/embrayage/accélérateur (ou tu utilises l'aide au démarrage) pour ne pas reculer sur le véhicule de derrière.",
    tags: ["manoeuvre"],
  },
  {
    id: "p9q14",
    parcours_id: 9,
    enonce: "Un brouillard épais surgit en montagne. Tu fais quoi ?",
    options: [
      "Pleins phares et vitesse normale",
      "Feux de croisement, je ralentis, j'augmente les distances",
      "Je m'arrête sur la voie",
    ],
    correct: 1,
    explication:
      "Croisement (+ brouillard avant), vitesse réduite, distances augmentées. Jamais de pleins phares ni d'arrêt sur la chaussée.",
    tags: ["vitesse", "verification_interieure"],
  },
  {
    id: "p9q15",
    parcours_id: 9,
    enonce: "Hors agglo, un virage sans visibilité : peux-tu klaxonner ?",
    options: [
      "Non, c'est interdit partout",
      "Oui, un bref coup pour signaler ta présence",
      "Oui, en continu",
    ],
    correct: 1,
    explication:
      "Hors agglomération, un bref coup d'avertisseur est admis pour signaler ta présence dans un virage sans visibilité. En ville, il est réservé au danger immédiat.",
    tags: ["courtoisie"],
  },

  // ── Parcours 10 : Partage de la route ─────────────────────────
  {
    id: "p10q1",
    parcours_id: 10,
    enonce: "Où se trouvent les angles morts dangereux d'un poids lourd ?",
    options: [
      "Seulement loin derrière",
      "Devant tout près, à droite, et juste derrière",
      "Uniquement sur sa gauche au large",
    ],
    correct: 1,
    explication:
      "Devant tout près, à droite et juste derrière : si tu ne vois pas ses rétros, lui ne te voit pas.",
    tags: ["manoeuvre"],
  },
  {
    id: "p10q2",
    parcours_id: 10,
    enonce:
      "En ville, un bus met son clignotant pour quitter son arrêt. Tu fais quoi ?",
    options: [
      "Je passe vite avant lui",
      "Je le laisse se réinsérer",
      "Je klaxonne",
    ],
    correct: 1,
    explication:
      "En agglomération, tu dois laisser un bus repartir de son arrêt quand il signale. Lève le pied.",
    tags: ["courtoisie", "priorite"],
  },
  {
    id: "p10q3",
    parcours_id: 10,
    enonce: "À un feu, à quoi sert le sas vélo pour le cycliste ?",
    options: [
      "À rien de particulier",
      "À se placer devant les voitures pour démarrer en sécurité",
      "À griller le feu",
    ],
    correct: 1,
    explication:
      "Le sas (zone avant la ligne) laisse les cyclistes se positionner devant, visibles, à l'abri des angles morts au démarrage.",
    tags: ["cycliste"],
  },
  {
    id: "p10q4",
    parcours_id: 10,
    enonce: "En ville, où circule une trottinette électrique ?",
    options: [
      "Sur le trottoir",
      "Sur les pistes cyclables ou la chaussée, pas le trottoir",
      "N'importe où",
    ],
    correct: 1,
    explication:
      "Trottinettes : pistes cyclables ou chaussée (ville ≤ 50 km/h), jamais le trottoir. Tu leur laisses de l'espace comme à un vélo.",
    tags: ["cycliste"],
  },
  {
    id: "p10q5",
    parcours_id: 10,
    enonce: "Tu dépasses un scooter (deux-roues motorisé). Quelle marge ?",
    options: [
      "Comme une voiture, je peux serrer",
      "1 m en ville, 1,5 m hors agglo, comme un vélo",
      "Aucune marge nécessaire",
    ],
    correct: 1,
    explication:
      "Mêmes marges qu'un vélo : 1 m en ville, 1,5 m hors agglo. Un deux-roues est déstabilisé par les remous d'air.",
    tags: ["manoeuvre"],
  },
  {
    id: "p10q6",
    parcours_id: 10,
    enonce:
      "Des motos remontent la file à l'arrêt. Avant de changer de voie, tu ?",
    options: [
      "Je change de file pour les bloquer",
      "Je vérifie mes rétros et angles morts, je reste prévisible",
      "J'ouvre ma portière",
    ],
    correct: 1,
    explication:
      "Tu restes prévisible et tu contrôles rétros/angles morts avant tout mouvement. Une portière ouverte sans regarder peut tuer un motard.",
    tags: ["manoeuvre"],
  },
  {
    id: "p10q7",
    parcours_id: 10,
    enonce: "Un piéton avec une canne blanche veut traverser. Tu fais quoi ?",
    options: [
      "Je klaxonne pour le prévenir",
      "Je m'arrête et je le laisse traverser",
      "Je passe vite",
    ],
    correct: 1,
    explication:
      "Canne blanche = personne malvoyante, priorité absolue. Tu t'arrêtes sans klaxonner (le bruit la désoriente).",
    tags: ["pieton"],
  },
  {
    id: "p10q8",
    parcours_id: 10,
    enonce: "Un convoi exceptionnel avec voiture pilote arrive. Tu fais quoi ?",
    options: [
      "Je double dès que possible",
      "Je suis les consignes de la voiture pilote (ralentir, me ranger)",
      "Je l'ignore",
    ],
    correct: 1,
    explication:
      "La voiture pilote fait autorité : tu respectes ses signaux. Doubler un convoi exceptionnel est très encadré.",
    tags: ["courtoisie", "priorite"],
  },
  {
    id: "p10q9",
    parcours_id: 10,
    enonce:
      "Une ambulance arrive derrière toi, sirène et gyrophare allumés. Tu fais quoi ?",
    options: [
      "Je continue normalement",
      "Je me range et je lui cède le passage en sécurité",
      "Je franchis le feu rouge devant pour dégager",
    ],
    correct: 1,
    explication:
      "Véhicule prioritaire : tu te ranges et tu t'arrêtes si besoin, sans manœuvre dangereuse ni franchissement de feu rouge à l'aveugle.",
    tags: ["priorite"],
  },
  {
    id: "p10q10",
    parcours_id: 10,
    enonce:
      "Tu ouvres ta portière côté rue après t'être garé. Le bon réflexe ?",
    options: [
      "J'ouvre vite",
      "Je regarde derrière (vélos, voitures) avant d'ouvrir",
      "J'ouvre en grand d'un coup",
    ],
    correct: 1,
    explication:
      "Réflexe « main croisée » : ouvrir avec la main opposée t'oblige à regarder derrière. Une portière ouverte sur un cycliste = accident grave.",
    tags: ["manoeuvre", "cycliste"],
  },
  {
    id: "p10q11",
    parcours_id: 10,
    enonce: "Un engin agricole lent te précède hors agglo. Tu fais quoi ?",
    options: [
      "Je le colle en klaxonnant",
      "Je garde mes distances et je double avec une vraie visibilité",
      "Je double en courbe",
    ],
    correct: 1,
    explication:
      "Engin lent = patience : distance de sécurité, puis dépassement uniquement avec une visibilité dégagée.",
    tags: ["manoeuvre"],
  },
  {
    id: "p10q12",
    parcours_id: 10,
    enonce: "Un enfant de moins de 8 ans roule à vélo sur le trottoir. C'est ?",
    options: [
      "Interdit, jamais autorisé",
      "Autorisé, à l'allure du pas",
      "Autorisé à pleine vitesse",
    ],
    correct: 1,
    explication:
      "Un enfant de moins de 8 ans peut circuler à vélo sur le trottoir, à l'allure du pas. Redouble de prudence à proximité.",
    tags: ["cycliste", "pieton"],
  },
  {
    id: "p10q13",
    parcours_id: 10,
    enonce: "Tu croises des chevaux montés sur la route. Tu fais quoi ?",
    options: [
      "Je klaxonne et je passe vite",
      "Je ralentis fortement et je passe au large, sans bruit",
      "Je fais comme avec une voiture",
    ],
    correct: 1,
    explication:
      "Animal imprévisible : tu ralentis beaucoup, tu passes très au large, sans klaxonner ni accélérer (le bruit l'effraie).",
    tags: ["courtoisie"],
  },
  {
    id: "p10q14",
    parcours_id: 10,
    enonce:
      "Tu approches d'un transport d'enfants à l'arrêt (panneau + feux). Tu fais quoi ?",
    options: [
      "Je passe normalement",
      "Je ralentis et je me tiens prêt à m'arrêter",
      "J'accélère pour passer avant eux",
    ],
    correct: 1,
    explication:
      "Près d'un bus d'enfants à l'arrêt, tu ralentis, prêt à stopper : un enfant peut surgir devant ou derrière.",
    tags: ["pieton"],
  },
  {
    id: "p10q15",
    parcours_id: 10,
    enonce: "Une personne âgée traverse lentement devant toi. Tu fais quoi ?",
    options: [
      "Je klaxonne pour la presser",
      "Je patiente jusqu'à ce qu'elle ait fini",
      "Je passe vite derrière elle",
    ],
    correct: 1,
    explication:
      "Tu patientes calmement qu'elle ait fini de traverser. Klaxonner ou forcer met en danger un piéton vulnérable.",
    tags: ["pieton"],
  },

  // ── Parcours 11 : Stationnement & manœuvres ───────────────────
  {
    id: "p11q1",
    parcours_id: 11,
    enonce: "Quelle est la différence entre un arrêt et un stationnement ?",
    options: [
      "Aucune, c'est pareil",
      "L'arrêt est bref, conducteur au volant ; le stationnement immobilise le véhicule",
      "Le stationnement est plus court que l'arrêt",
    ],
    correct: 1,
    explication:
      "Arrêt = court, le conducteur reste au volant prêt à repartir. Stationnement = véhicule immobilisé, conducteur parti ou indisponible.",
    tags: ["manoeuvre"],
  },
  {
    id: "p11q2",
    parcours_id: 11,
    enonce: "Tu peux stationner devant une entrée de garage (un « bateau ») ?",
    options: [
      "Oui si c'est bref",
      "Non, c'est interdit, même devant chez soi",
      "Oui la nuit",
    ],
    correct: 1,
    explication:
      "Stationner devant un bateau / une entrée carrossable est interdit (gênant), même devant ta propre entrée.",
    tags: ["manoeuvre", "signalisation"],
  },
  {
    id: "p11q3",
    parcours_id: 11,
    enonce: "Te garer sur un trottoir, c'est ?",
    options: [
      "Autorisé si je laisse de la place",
      "Interdit : stationnement gênant",
      "Autorisé pour les livraisons",
    ],
    correct: 1,
    explication:
      "Sur un trottoir = stationnement gênant : tu bloques piétons, poussettes et fauteuils. Interdit.",
    tags: ["manoeuvre", "pieton"],
  },
  {
    id: "p11q4",
    parcours_id: 11,
    enonce: "Stationner sur un passage piéton, c'est ?",
    options: [
      "Toléré quelques minutes",
      "Interdit : stationnement dangereux",
      "OK avec les feux de détresse",
    ],
    correct: 1,
    explication:
      "Sur un passage piéton = stationnement dangereux : tu masques les piétons aux autres conducteurs. Interdit.",
    tags: ["manoeuvre", "pieton"],
  },
  {
    id: "p11q5",
    parcours_id: 11,
    enonce: "En agglomération, de quel côté te gares-tu par défaut ?",
    options: [
      "À droite, dans le sens de la circulation",
      "N'importe quel côté",
      "À gauche, toujours",
    ],
    correct: 0,
    explication:
      "Par défaut, à droite et dans le sens de circulation. (Dans une rue à sens unique, les deux côtés peuvent être autorisés.)",
    tags: ["manoeuvre"],
  },
  {
    id: "p11q6",
    parcours_id: 11,
    enonce: "Pour réussir un créneau, comment te places-tu au départ ?",
    options: [
      "Loin devant la place, collé au trottoir",
      "À hauteur de la voiture devant la place, à environ 1 m",
      "Directement dans la place en marche avant",
    ],
    correct: 1,
    explication:
      "Tu te mets parallèle à la voiture située devant la place, à ~1 m, puis tu braques en reculant. Contrôle l'arrière et les piétons pendant toute la manœuvre.",
    tags: ["manoeuvre"],
  },
  {
    id: "p11q7",
    parcours_id: 11,
    enonce: "Que risques-tu pour un stationnement gênant ?",
    options: [
      "Rien du tout",
      "Une amende, voire la mise en fourrière",
      "Juste un avertissement oral",
    ],
    correct: 1,
    explication:
      "Stationnement gênant = amende, et le véhicule peut partir en fourrière. Dangereux ou très gênant = sanction plus lourde.",
    tags: ["manoeuvre"],
  },
  {
    id: "p11q8",
    parcours_id: 11,
    enonce: "Une ligne jaune continue le long du trottoir signifie ?",
    options: [
      "Stationnement autorisé",
      "Arrêt ET stationnement interdits",
      "Stationnement payant",
    ],
    correct: 1,
    explication:
      "Jaune continu = arrêt et stationnement interdits. Jaune discontinu = stationnement interdit (arrêt bref toléré).",
    tags: ["signalisation", "manoeuvre"],
  },
  {
    id: "p11q9",
    parcours_id: 11,
    enonce: "Le demi-tour, où est-il formellement interdit ?",
    options: [
      "Partout en ville",
      "Sur autoroute, sur ligne continue et sans visibilité",
      "Nulle part, c'est toujours permis",
    ],
    correct: 1,
    explication:
      "Demi-tour interdit sur autoroute, en franchissant une ligne continue, et partout où il gêne ou manque de visibilité.",
    tags: ["manoeuvre", "signalisation"],
  },
  {
    id: "p11q10",
    parcours_id: 11,
    enonce: "La marche arrière, tu l'utilises comment ?",
    options: [
      "Sur de longues distances sans souci",
      "Sur une courte distance, pour une manœuvre seulement",
      "Y compris sur autoroute si besoin",
    ],
    correct: 1,
    explication:
      "La marche arrière sert à manœuvrer sur une courte distance. Reculer longtemps est dangereux — et c'est strictement interdit sur autoroute.",
    tags: ["manoeuvre"],
  },
  {
    id: "p11q11",
    parcours_id: 11,
    enonce: "Tu stationnes en haut d'une côte (boîte manuelle). Tu fais quoi ?",
    options: [
      "Je laisse au point mort",
      "Frein à main, une vitesse engagée, roues braquées vers le trottoir",
      "Rien de particulier",
    ],
    correct: 1,
    explication:
      "Frein à main serré, une vitesse engagée et roues braquées vers le trottoir : si la voiture bouge, elle bute au lieu de dévaler.",
    tags: ["manoeuvre"],
  },
  {
    id: "p11q12",
    parcours_id: 11,
    enonce: "T'immobiliser en double file pour décharger, c'est ?",
    options: [
      "OK quelques minutes",
      "Interdit : stationnement gênant",
      "OK avec les feux de détresse",
    ],
    correct: 1,
    explication:
      "La double file = gênant et interdit. Seul un arrêt très bref, toi au volant prêt à repartir, peut être toléré.",
    tags: ["manoeuvre"],
  },
  {
    id: "p11q13",
    parcours_id: 11,
    enonce: "Te garer juste au coin d'une intersection, c'est ?",
    options: [
      "Sans problème",
      "À éviter : tu masques la visibilité (gênant)",
      "Obligatoire à 1 m du carrefour",
    ],
    correct: 1,
    explication:
      "Trop près d'un carrefour, tu masques la visibilité des autres usagers : c'est gênant. Laisse de la marge.",
    tags: ["manoeuvre"],
  },
  {
    id: "p11q14",
    parcours_id: 11,
    enonce:
      "Une place réservée (PMR) alors que tu n'as pas de carte. Tu fais quoi ?",
    options: [
      "Je me gare 5 minutes",
      "Je ne m'y gare jamais : interdit, amende lourde",
      "Je m'y gare s'il n'y a pas d'autre place",
    ],
    correct: 1,
    explication:
      "Place PMR sans carte mobilité inclusion = interdiction stricte et amende lourde. Jamais, même « juste 5 minutes ».",
    tags: ["manoeuvre", "signalisation"],
  },
  {
    id: "p11q15",
    parcours_id: 11,
    enonce:
      "Voiture à l'arrêt la nuit, hors agglo non éclairée. Tu signales comment ?",
    options: [
      "Je n'allume rien",
      "J'allume mes feux de position",
      "Je laisse les pleins phares",
    ],
    correct: 1,
    explication:
      "Hors agglomération non éclairée, tu signales ton véhicule arrêté avec les feux de position pour être vu de loin.",
    tags: ["verification_interieure", "manoeuvre"],
  },
];

export const questionsForParcours = (pid) =>
  QUESTIONS.filter((q) => q.parcours_id === pid);
