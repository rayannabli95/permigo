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
    enonce: "En zone 30, les piétons sont prioritaires sur la chaussée ?",
    options: [
      "Non, ils doivent rester sur les trottoirs",
      "Oui, sur toute la chaussée",
      "Seulement aux passages piétons",
    ],
    correct: 1,
    explication:
      "Oui, partout sur la chaussée — pas seulement aux passages. La zone 30 est pensée pour eux.",
    tags: ["pieton", "signalisation"],
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
    enonce: "En zone 30, les piétons peuvent traverser hors des passages ?",
    options: [
      "Non, ils doivent utiliser les passages",
      "Oui, mais ils laissent passer les voitures",
      "Oui, et c'est aux conducteurs de les laisser passer",
    ],
    correct: 2,
    explication:
      "En zone 30, les piétons traversent où ils veulent et tu leur cèdes le passage.",
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
];

export const questionsForParcours = (pid) =>
  QUESTIONS.filter((q) => q.parcours_id === pid);
