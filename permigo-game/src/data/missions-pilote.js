// ═══════════════════════════════════════════════════════════════
// Les missions du Mode Pilote.
//
// Une mission = une scène de conduite où l'élève AGIT : il touche une
// commande, il remet des gestes dans l'ordre, il trace une trajectoire, il
// décide, il diagnostique. C'est ce qui remplace le quiz au bout de la fiche.
//
// Décisions de Rayan (31/07/2026, confirmées le 01/08) :
//  · pas de hub, pas de mondes, pas de niveau. Le parcours de « Mon permis »
//    est le SEUL parcours. Une mission s'ouvre par un code de compétence.
//  · pas de XP ici. L'économie du jeu, ce sont les volants, ailleurs.
//  · le code REMC (C1a…) sert de CLÉ, il ne s'affiche jamais à l'élève.
//
// `transfer` est la ligne la plus importante de chaque mission : le devoir à
// faire dans la vraie voiture. Toucher un écran n'apprend pas un geste au
// corps ; c'est ce petit devoir qui fait le pont.
// ═══════════════════════════════════════════════════════════════

const commun = {
  estimated: "1 min",
  phase: "Préparation",
  attemptsBeforeHint: 2,
};

export const MISSIONS = [
  {
    ...commun,
    id: "c1a-commodos",
    competence: "C1a",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "spot",
    modeLabel: "Trouver",
    title: "Le signal fantôme",
    objective: "Retrouver le clignotant sans chercher la commande des yeux.",
    prompt:
      "Tu vas tourner à gauche. Touche la commande que ta main doit trouver.",
    visual: "cockpit",
    hotspots: [
      { id: "left-stalk", label: "Commodo gauche", x: 18, y: 57, w: 22, h: 17 },
      { id: "dashboard", label: "Tableau de bord", x: 40, y: 31, w: 20, h: 18 },
      { id: "right-stalk", label: "Commodo droit", x: 61, y: 57, w: 22, h: 17 },
      { id: "wheel", label: "Volant", x: 34, y: 48, w: 32, h: 40 },
    ],
    solution: "left-stalk",
    hint: "Le clignotant est placé du côté gauche du volant.",
    retry:
      "Cette zone ne commande pas le clignotant. Regarde de l’autre côté du volant.",
    success: "Commodo gauche trouvé.",
    why: "Ce repère doit devenir automatique pour garder les yeux sur la route.",
    transfer:
      "En voiture à l’arrêt, actionne trois fois le clignotant sans baisser les yeux.",
  },
  {
    ...commun,
    id: "c1d-depart-manual",
    competence: "C1d",
    order: 2,
    boites: ["manuelle"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Le départ parfait",
    objective: "Construire la chaîne d’un démarrage en boîte manuelle.",
    prompt: "Remets les gestes dans l’ordre. Touche le premier, puis continue.",
    visual: "pedales-manuelle",
    steps: [
      { id: "clutch", label: "Embrayage à fond" },
      { id: "gear", label: "Passer la 1re" },
      { id: "bite", label: "Trouver le patinage" },
      { id: "gas", label: "Ajouter un filet de gaz" },
      { id: "handbrake", label: "Desserrer le frein à main" },
    ],
    sequence: ["clutch", "gear", "bite", "gas", "handbrake"],
    hint: "Avant de passer la première, ton pied gauche est déjà enfoncé à fond.",
    retry:
      "Pas encore. Repars du moment où la voiture est immobile et sécurisée.",
    success: "Chaîne de départ reconstruite.",
    why: "Le patinage est la zone à ralentir : tout lâcher d’un coup provoque un à-coup ou un calage.",
    transfer:
      "Pendant la prochaine leçon, annonce mentalement les cinq gestes avant de démarrer.",
  },
  {
    ...commun,
    id: "c1d-depart-automatic",
    competence: "C1d",
    order: 2,
    boites: ["auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Le départ parfait",
    objective: "Construire la chaîne d’un démarrage en boîte automatique.",
    prompt: "Remets les gestes dans l’ordre. Touche le premier, puis continue.",
    visual: "pedales-auto",
    steps: [
      { id: "brake", label: "Pied droit sur le frein" },
      { id: "drive", label: "Sélecteur sur D" },
      { id: "observe", label: "Contrôler autour" },
      { id: "release", label: "Relâcher doucement le frein" },
      { id: "gas", label: "Accélérer progressivement" },
    ],
    sequence: ["brake", "drive", "observe", "release", "gas"],
    hint: "Le sélecteur ne passe sur D qu’avec ton pied droit posé sur le frein.",
    retry:
      "Pas encore. Commence par immobiliser la voiture avec ton pied droit.",
    success: "Chaîne de départ reconstruite.",
    why: "En D, la voiture avance au ralenti dès que tu relâches le frein : ton pied droit contrôle le départ.",
    transfer:
      "En voiture à l’arrêt, montre au moniteur la chaîne complète avant de partir.",
  },
  {
    ...commun,
    id: "c1a-temoin",
    competence: "C1a",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "diagnostic",
    modeLabel: "Diagnostiquer",
    title: "Alerte au tableau",
    objective: "Interpréter un témoin rouge qui reste allumé après le contact.",
    prompt: "Le témoin reste allumé. Quelle décision répare la situation ?",
    visual: "voyant-moteur",
    symptom:
      "Un témoin rouge reste visible après le contrôle du tableau de bord.",
    choices: [
      { id: "wait", label: "Partir doucement et surveiller plus tard" },
      {
        id: "signal",
        label: "Ne pas partir du tout et le signaler tout de suite",
      },
      { id: "wipe", label: "Actionner les essuie-glaces" },
    ],
    solution: "signal",
    hint: "Un voyant persistant est une information à traiter avant le départ.",
    retry: "Cette action ne traite pas l’alerte affichée.",
    success: "Bonne décision : tu sécurises avant de partir.",
    why: "Un témoin rouge persistant peut signaler un défaut d’huile, de batterie ou de frein.",
    transfer:
      "Au prochain démarrage, observe le tableau jusqu’à l’extinction des témoins.",
  },
  {
    ...commun,
    id: "c2f-indices",
    competence: "C2f",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "spot",
    modeLabel: "Trouver",
    title: "La rue cachée",
    objective: "Détecter une intersection avant d’arriver dessus.",
    prompt: "Un véhicule peut déboucher. Touche l’indice qui révèle la rue.",
    visual: "intersection",
    hotspots: [
      {
        id: "side-street",
        label: "Ouverture entre les bâtiments",
        x: 66,
        y: 35,
        w: 25,
        h: 42,
      },
      { id: "parked-car", label: "Voiture garée", x: 7, y: 54, w: 22, h: 24 },
      { id: "sky", label: "Ciel", x: 35, y: 4, w: 27, h: 21 },
      { id: "lane", label: "Ta voie", x: 33, y: 62, w: 32, h: 34 },
    ],
    solution: "side-street",
    hint: "Cherche une ouverture entre les bâtiments et l’arrondi du trottoir.",
    retry:
      "Ce détail ne révèle pas l’intersection. Cherche l’endroit où une rue peut déboucher.",
    success: "Intersection détectée avant la priorité.",
    why: "Repérer l’ouverture tôt te laisse le temps de ralentir et d’identifier la règle de priorité.",
    transfer:
      "Pendant la prochaine leçon, annonce chaque intersection avant d’y arriver.",
  },
  {
    ...commun,
    id: "c2f-giratoire",
    competence: "C2f",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La sortie se ferme",
    objective:
      "Préparer une sortie de giratoire sans couper la trajectoire d’un autre usager.",
    prompt: "Ta sortie approche. Quelle action vient en premier ?",
    visual: "roundabout",
    choices: [
      {
        id: "accelerate",
        label: "Accélérer tout de suite pour prendre la sortie",
      },
      {
        id: "check-signal",
        label: "Contrôler puis mettre le clignotant",
      },
      { id: "stop", label: "S’arrêter sur l’anneau pour laisser passer" },
    ],
    solution: "check-signal",
    hint: "Avant de déplacer la voiture, tu prends l’information et tu annonces ton intention.",
    retry: "Cette action crée une surprise pour les autres usagers.",
    success: "Contrôle puis clignotant : la sortie devient lisible.",
    why: "Le contrôle vérifie qu’aucun usager ne coupe ta trajectoire ; le clignotant prévient ceux qui attendent.",
    transfer: "Sur le prochain giratoire, pense « contrôle, signal, sortie ».",
  },
  {
    ...commun,
    id: "c2d-trajectoire",
    competence: "C2d",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "trajectory",
    modeLabel: "Tracer",
    title: "Le virage propre",
    objective: "Choisir une trajectoire qui reste entièrement dans ta voie.",
    prompt:
      "Trois trajectoires apparaissent. Choisis celle qui garde sa voie sans couper.",
    visual: "bend",
    paths: [
      {
        id: "cut",
        label: "couper vers la ligne centrale",
        legend: "Coupe",
        d: "M180 245 C180 178 95 145 119 68",
      },
      {
        id: "safe",
        label: "suivre sa voie et regarder la sortie",
        legend: "Reste dans la voie",
        d: "M205 245 C211 180 166 153 190 61",
      },
      {
        id: "edge",
        label: "longer le bord extérieur",
        legend: "Longe le bord",
        d: "M233 245 C253 184 242 143 272 78",
      },
    ],
    solution: "safe",
    hint: "La route n’est pas un circuit : ta trajectoire reste au centre de ta voie.",
    retry:
      "Cette ligne mord un bord de ta voie. Cherche la trajectoire la plus stable.",
    success: "Trajectoire de sécurité sélectionnée.",
    why: "Tu ralentis avant le virage, puis ton regard guide une trajectoire régulière dans ta voie.",
    transfer:
      "Au prochain virage, cherche la sortie avec les yeux avant de tourner le volant.",
  },
  {
    ...commun,
    id: "c3a-nuit",
    competence: "C3a",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "spot",
    modeLabel: "Trouver",
    title: "L’éblouissement",
    objective:
      "Poser son regard au bon endroit lorsqu’un véhicule arrive de nuit.",
    prompt:
      "Les phares arrivent en face. Touche la zone que ton regard doit suivre.",
    visual: "night",
    hotspots: [
      { id: "headlights", label: "Phares en face", x: 43, y: 28, w: 19, h: 22 },
      {
        id: "right-edge",
        label: "Bord droit de ta voie",
        x: 64,
        y: 58,
        w: 27,
        h: 35,
      },
      { id: "mirror", label: "Rétroviseur", x: 6, y: 15, w: 21, h: 17 },
      { id: "dashboard", label: "Compteur", x: 31, y: 70, w: 28, h: 20 },
    ],
    solution: "right-edge",
    hint: "Ne fixe pas la source lumineuse. Cherche un repère stable sur ta droite.",
    retry: "Cette zone risque de retenir ton regard loin de ta trajectoire.",
    success: "Regard posé sur le bord droit.",
    why: "Suivre le bord droit évite de fixer les phares et conserve un repère de trajectoire.",
    transfer:
      "En conduite de nuit, verbalise ton repère droit dès qu’un véhicule approche.",
  },
  {
    ...commun,
    id: "c3b-pluie",
    competence: "C3b",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La pluie double tout",
    objective:
      "Adapter la distance et la douceur avant que l’adhérence diminue.",
    prompt:
      "La pluie devient forte. Quelle adaptation protège le mieux ta marge ?",
    visual: "rain",
    choices: [
      { id: "same", label: "Garder la même distance si je vois encore bien" },
      { id: "smooth", label: "Allonger la distance et freiner plus tôt" },
      { id: "fog-rear", label: "Allumer le brouillard arrière sous la pluie" },
    ],
    solution: "smooth",
    hint: "Même avec une bonne visibilité, l’adhérence et la distance de freinage changent.",
    retry: "Cette réponse ne recrée pas une marge d’arrêt suffisante.",
    success: "Tu recrées de l’espace et de la douceur.",
    why: "Sous la pluie, la distance de sécurité augmente et les gestes brusques réduisent l’adhérence.",
    transfer:
      "À la première pluie, compte quatre secondes avec le véhicule devant.",
  },
  {
    ...commun,
    id: "c3d-urgence-manual",
    competence: "C3d",
    order: 3,
    boites: ["manuelle"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Freinage d’urgence",
    objective: "Retrouver l’ordre des gestes avec ABS en boîte manuelle.",
    prompt: "Un obstacle surgit. Construis la chaîne sans chercher la vitesse.",
    visual: "emergency",
    steps: [
      { id: "brake", label: "Freiner fort" },
      { id: "hold", label: "Garder le frein enfoncé" },
      { id: "escape", label: "Regarder l’échappatoire" },
      { id: "clutch", label: "Débrayer ensuite" },
    ],
    sequence: ["brake", "hold", "escape", "clutch"],
    hint: "La priorité absolue est de ralentir : frein d’abord, embrayage ensuite.",
    retry:
      "Pas dans cet ordre. Commence par l’action qui réduit immédiatement la vitesse.",
    success: "Ordre d’urgence reconstruit.",
    why: "La vibration de l’ABS est normale : tu gardes le frein enfoncé et la direction disponible.",
    transfer:
      "Demande à ton enseignant quand vous entraînerez ce geste sur une zone adaptée.",
  },
  {
    ...commun,
    id: "c3d-urgence-automatic",
    competence: "C3d",
    order: 3,
    boites: ["auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Freinage d’urgence",
    objective: "Retrouver l’ordre des gestes avec ABS en boîte automatique.",
    prompt: "Un obstacle surgit. Construis la chaîne sans chercher la vitesse.",
    visual: "emergency",
    steps: [
      { id: "brake", label: "Freiner fort du pied droit" },
      { id: "hold", label: "Garder le frein enfoncé" },
      { id: "escape", label: "Regarder l’échappatoire" },
      { id: "steer", label: "Diriger si nécessaire" },
    ],
    sequence: ["brake", "hold", "escape", "steer"],
    hint: "La priorité absolue est de ralentir : ton pied droit enfonce le frein.",
    retry:
      "Pas dans cet ordre. Commence par l’action qui réduit immédiatement la vitesse.",
    success: "Ordre d’urgence reconstruit.",
    why: "La vibration de l’ABS est normale : tu gardes le frein enfoncé et la direction disponible.",
    transfer:
      "Demande à ton enseignant quand vous entraînerez ce geste sur une zone adaptée.",
  },
  {
    ...commun,
    id: "c4b-gps",
    competence: "C4b",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "diagnostic",
    modeLabel: "Diagnostiquer",
    title: "La sortie ratée",
    objective:
      "Réagir en autonomie lorsqu’une instruction GPS arrive trop tard.",
    prompt:
      "Ta sortie vient de passer. Quelle décision répare la situation sans créer de danger ?",
    visual: "gps",
    symptom:
      "Le GPS annonce « Tournez maintenant », mais la bretelle est déjà derrière toi.",
    choices: [
      { id: "reverse", label: "Reculer prudemment jusqu'à la sortie ratée" },
      { id: "stop", label: "M’arrêter sur le bas-côté pour recalculer" },
      { id: "continue", label: "Continuer et laisser le GPS recalculer" },
    ],
    solution: "continue",
    hint: "Une destination ratée se corrige plus tard ; une manœuvre dangereuse ne se rattrape pas.",
    retry:
      "Cette action crée un danger immédiat pour récupérer une simple direction.",
    success: "Tu continues : l’itinéraire s’adapte à ta sécurité.",
    why: "La route et la signalisation restent toujours prioritaires sur l’écran.",
    transfer: "Avant la prochaine leçon, place et règle le GPS à l’arrêt.",
  },
  {
    ...commun,
    id: "c4c-eco",
    competence: "C4c",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Le feu à cent mètres",
    objective: "Anticiper un ralentissement sans conduire en accordéon.",
    prompt: "Le feu passe au rouge loin devant. Quel est ton premier geste ?",
    visual: "city-light",
    choices: [
      { id: "accelerate", label: "Accélérer pour arriver avant les autres" },
      { id: "brake-hard", label: "Freiner fort immédiatement" },
      {
        id: "lift",
        label: "Lever le pied et laisser la voiture ralentir toute seule",
      },
    ],
    solution: "lift",
    hint: "Tu as de la distance : utilise-la avant de solliciter fortement le frein.",
    retry: "Ce geste consomme ta marge au lieu de l’utiliser.",
    success: "Anticipation trouvée : tu lèves le pied tôt.",
    why: "Le frein moteur commence à ralentir la voiture et prépare un freinage progressif.",
    transfer:
      "Pendant la prochaine leçon, repère un ralentissement assez tôt pour lever le pied avant de freiner.",
  },
  {
    ...commun,
    id: "c4c-dose-elan",
    competence: "C4c",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "reglage",
    modeLabel: "Doser",
    title: "Le feu rouge qu'on voit de loin",
    objective: "Utiliser son élan au lieu de le jeter dans les freins.",
    prompt:
      "Le feu est rouge à deux cents mètres. Pousse la pédale d'accélérateur comme tu la tiendrais.",
    visual: "city-light",
    commande: {
      label: "Pédale d'accélérateur",
      article: "l’accélérateur",
      // ⚠️ Départ à FOND, pas au repos. Les autres doseurs partent de zéro
      // parce que zéro y est une réponse fausse. Ici la bonne réponse EST de
      // lever le pied : partir au repos aurait validé la mission d’un simple
      // appui sans bouger. Et c’est l’histoire vraie : tu roules, ton pied est
      // sur l’accélérateur, tu vois le feu rouge, tu lèves.
      depart: 100,
    },
    crans: [
      { id: "lever", label: "Lever le pied maintenant" },
      { id: "tenir", label: "Tenir l'allure" },
      { id: "relancer", label: "Relancer un peu" },
    ],
    solution: "lever",
    hint: "L'énergie que tu mets maintenant, tu la donneras aux freins dans dix secondes.",
    retry:
      "Tu arrives au feu encore vite, et tout part en chaleur dans les plaquettes.",
    success: "Pied levé tôt. La voiture roule sur son élan jusqu'au feu.",
    why: "Chaque goutte de carburant brûlée avant un arrêt est perdue deux fois : à la pompe, puis dans les freins. Lever le pied tôt fait rouler la voiture sur son élan, et souvent le feu repasse au vert avant l'arrêt. C'est le seul geste d'éco-conduite qui se voit aussi sur les plaquettes.",
    transfer:
      "Au prochain feu rouge repéré de loin, lève le pied dès que tu le vois et regarde jusqu'où tu roules sans freiner.",
  },
  {
    ...commun,
    id: "c4f-verification",
    competence: "C4f",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "spot",
    modeLabel: "Trouver",
    title: "Le défaut avant départ",
    objective: "Repérer un problème extérieur lors du tour de la voiture.",
    prompt:
      "Un défaut est visible avant de partir. Touche celui que tu dois signaler.",
    visual: "exterior",
    hotspots: [
      {
        id: "flat-tire",
        label: "Pneu avant affaissé",
        x: 58,
        y: 65,
        w: 20,
        h: 22,
      },
      { id: "mirror", label: "Rétroviseur", x: 23, y: 35, w: 17, h: 16 },
      { id: "door", label: "Portière", x: 38, y: 38, w: 28, h: 28 },
      { id: "plate", label: "Plaque propre", x: 72, y: 50, w: 15, h: 14 },
    ],
    solution: "flat-tire",
    hint: "Cherche un élément qui compromet le contact de la voiture avec la route.",
    retry: "Cet élément n’est pas le défaut visible dans cette scène.",
    success: "Pneu affaissé repéré avant le départ.",
    why: "Le tour de voiture permet de détecter un danger avant qu’il ne devienne une situation de conduite.",
    transfer:
      "Avant la prochaine leçon, fais le tour de la voiture et nomme tes quatre contrôles.",
  },
  // ── Chapitre 1, la suite (01/08/2026) ──────────────────────────────────
  // C1a et C1d avaient leur mission depuis le prototype. Voici les sept
  // autres compétences du premier chapitre, celui que tout le monde traverse.
  //
  // Deux règles tenues partout : la scène pose une SITUATION (« tes passagers
  // piquent du nez à chaque arrêt »), pas une définition ; et `transfer` est
  // un vrai devoir dans la vraie voiture, faisable dès la prochaine leçon.
  {
    ...commun,
    id: "c1b-ordre-reglages",
    competence: "C1b",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Le poste bien réglé",
    objective: "Régler son poste de conduite dans un ordre qui tient.",
    prompt: "Tu montes dans la voiture. Remets les réglages dans l'ordre.",
    visual: "cockpit",
    steps: [
      { id: "siege", label: "Avancer le siège" },
      { id: "dossier", label: "Régler le dossier" },
      { id: "appui", label: "Monter l'appui-tête" },
      { id: "ceinture", label: "Boucler la ceinture" },
      { id: "retros", label: "Régler les rétroviseurs" },
    ],
    sequence: ["siege", "dossier", "appui", "ceinture", "retros"],
    hint: "Chaque réglage déplace ta tête. Les rétroviseurs viennent donc en dernier.",
    retry: "Pas encore. Pense à ce qui bouge quand tu changes ce réglage.",
    success: "Poste réglé dans le bon ordre.",
    why: "Un rétroviseur réglé avant le siège est bon à refaire : dès que tu avances, tu ne vois plus la même chose.",
    transfer:
      "À ta prochaine leçon, règle ton poste dans cet ordre sans que ton enseignant te le rappelle.",
  },
  {
    ...commun,
    id: "c1b-ceinture",
    competence: "C1b",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La sangle qui retient",
    objective: "Placer sa ceinture là où elle protège vraiment.",
    prompt: "Ta ceinture passe où, sur le haut du corps ?",
    visual: "cockpit",
    choices: [
      { id: "epaule", label: "Au milieu de l'épaule" },
      { id: "cou", label: "Contre le cou et le menton" },
      { id: "bras", label: "Sous le bras et le coude" },
    ],
    solution: "epaule",
    hint: "Cherche l'os le plus solide entre ton cou et ton bras.",
    retry:
      "Là, elle blesse au lieu de retenir. Un choc concentre tout son effort sur ce point.",
    success: "Au milieu de l'épaule, à plat sur le bassin.",
    why: "La ceinture ne retient bien que sur de l'os. Sur le cou elle étrangle, sous le bras elle laisse partir le buste.",
    transfer:
      "En montant dans la voiture, vérifie que ta sangle ne touche pas ton cou avant de démarrer.",
  },
  {
    ...commun,
    id: "c1c-siege",
    competence: "C1c",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "placement",
    modeLabel: "Placer",
    title: "À bonne distance",
    objective:
      "Placer le siège assez près des commandes sans bloquer les mouvements.",
    prompt: "Fais glisser le siège jusqu’à la bonne distance des pédales.",
    visual: "seat-profile",
    // Coordonnées calées sur le nouveau décor photo (Art Bible 2.0, 05/08/2026,
    // rail visible entre 68 % et 88 % de hauteur, pédales vers 82-89 % en x).
    piece: {
      label: "Siège avec conducteur",
      largeur: 20,
      hauteur: 42,
      departX: 19,
      departY: 68,
    },
    spots: [
      {
        id: "trop-loin",
        label: "Position gauche",
        x: 6,
        y: 55,
        w: 26,
        h: 35,
      },
      {
        id: "juste",
        label: "Position centrale",
        x: 37,
        y: 55,
        w: 26,
        h: 35,
      },
      {
        id: "trop-pres",
        label: "Position droite",
        x: 67,
        y: 55,
        w: 26,
        h: 35,
      },
    ],
    solution: "juste",
    hint: "Quand tu enfonces une pédale ton genou reste légèrement fléchi.",
    retry:
      "Cette distance oblige à tendre la jambe ou bloque le genou contre les commandes.",
    success: "Le siège est à bonne distance.",
    why: "Une jambe légèrement fléchie permet d’appuyer à fond sans se tendre ni se coller aux commandes.",
    transfer:
      "À ta prochaine leçon, enfonce chaque pédale et vérifie que ton genou reste légèrement fléchi.",
  },
  {
    ...commun,
    id: "c1c-mains",
    competence: "C1c",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Deux mains qui répondent",
    objective: "Tenir le volant d'où l'on peut réagir le plus vite.",
    prompt: "Tu roules en ligne droite. Tes mains sont où sur le volant ?",
    visual: "cockpit",
    choices: [
      { id: "haut", label: "En haut une de chaque côté" },
      { id: "bas", label: "En bas et réunies au milieu" },
      { id: "une", label: "Une seule main posée tout en haut" },
    ],
    solution: "haut",
    hint: "Imagine qu'un obstacle surgit maintenant. D'où peux-tu tourner le plus vite ?",
    retry:
      "De là, il te faut d'abord repositionner tes mains. Ce temps-là, tu ne l'as pas toujours.",
    success: "Les deux mains en haut, de part et d'autre.",
    why: "C'est la seule position d'où tu peux tourner d'un demi-tour de volant sans jamais lâcher.",
    transfer:
      "Pendant dix minutes de ta prochaine leçon, ramène tes mains en haut dès que tu les sens descendre.",
  },
  {
    ...commun,
    id: "c1c-regard-virage",
    competence: "C1c",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "diagnostic",
    modeLabel: "Diagnostiquer",
    title: "La voiture qui serre",
    objective: "Comprendre que la trajectoire suit le regard.",
    prompt: "Tu serres le bord droit à chaque virage. D'où ça vient ?",
    visual: "bend",
    symptom:
      "Dans chaque virage à droite, tu te retrouves collé au bord et tu dois corriger.",
    choices: [
      {
        id: "regard",
        label: "Tu regardes le bord de la route au lieu de la sortie",
      },
      { id: "volant", label: "Ton volant est trop dur à tourner" },
      { id: "vitesse", label: "Tu roules beaucoup trop lentement pour ça" },
    ],
    solution: "regard",
    hint: "Ta voiture va là où tes yeux vont. Où sont-ils en ce moment ?",
    retry:
      "Ce n'est pas la voiture. Ce virage se joue avant lui, dans ton regard.",
    success: "Le regard tirait la voiture vers le bord.",
    why: "Les mains suivent les yeux sans que tu le décides. Fixer le bord droit, c'est aller vers le bord droit. Vise la sortie du virage.",
    transfer:
      "Au prochain virage, force-toi à regarder la sortie et sens la voiture s'écarter du bord toute seule.",
  },
  {
    ...commun,
    id: "c1e-freinage-doux",
    competence: "C1e",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "diagnostic",
    modeLabel: "Diagnostiquer",
    title: "Les têtes qui plongent",
    objective: "Relâcher le frein en fin de freinage.",
    prompt: "Tes passagers piquent du nez à chaque arrêt. Pourquoi ?",
    visual: "city-light",
    symptom:
      "La voiture s'arrête net sur les derniers centimètres, et tout le monde part en avant.",
    choices: [
      { id: "relacher", label: "Tu gardes la même pression jusqu'au bout" },
      { id: "tot", label: "Tu freines beaucoup trop tôt au départ" },
      { id: "freins", label: "Tes freins sont bien trop puissants pour ça" },
    ],
    solution: "relacher",
    hint: "Ce qui secoue, ce n'est pas le freinage. C'est la seconde où il s'arrête.",
    retry:
      "Freiner tôt n'a jamais fait plonger personne. Le problème est à la toute fin.",
    success: "Il manquait le relâché de fin.",
    why: "La voiture s'écrase vers l'avant pendant le freinage. Si tu lâches d'un coup à l'arrêt, elle se redresse d'un coup. On allège la pédale sur les derniers centimètres.",
    transfer:
      "Sur tes trois prochains arrêts, allège le frein juste avant l'immobilisation et regarde la tête de ton enseignant.",
  },
  {
    ...commun,
    id: "c1e-orange",
    competence: "C1e",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Le feu qui change",
    objective: "Décider tôt devant un feu orange.",
    prompt: "Le feu passe à l'orange et tu es encore loin. Tu fais quoi ?",
    visual: "city-light",
    choices: [
      { id: "arret", label: "Tu ralentis et tu t'arrêtes à la ligne" },
      { id: "passe", label: "Tu accélères pour passer avant le rouge" },
      { id: "pile", label: "Tu piles net sur place au dernier moment" },
    ],
    solution: "arret",
    hint: "L'orange n'est pas une fin de vert. C'est un début de rouge.",
    retry:
      "Loin du feu, tu as tout le temps de t'arrêter proprement. C'est même ce qu'on attend de toi.",
    success: "Ralentir et s'arrêter avant la ligne.",
    why: "L'orange impose l'arrêt sauf si s'arrêter est dangereux, par exemple quand tu es déjà engagé. De loin, tu n'es pas dans ce cas.",
    transfer:
      "À ta prochaine leçon, annonce à voix haute « je m'arrête » dès que tu vois un feu passer à l'orange.",
  },
  {
    ...commun,
    id: "c1e-dose-frein",
    competence: "C1e",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "reglage",
    modeLabel: "Doser",
    title: "Le freinage qui ne secoue personne",
    objective:
      "Sentir la différence entre freiner fort et freiner brutalement.",
    prompt:
      "Un feu passe au rouge à cinquante mètres. Pousse la pédale comme tu le ferais.",
    visual: "pedales-manuelle",
    commande: {
      label: "Pédale de frein",
      article: "la pédale de frein",
      depart: 0,
    },
    crans: [
      { id: "effleure", label: "À peine" },
      { id: "franc", label: "Franc puis relâché" },
      { id: "ecrase", label: "Tout d'un coup" },
    ],
    solution: "franc",
    hint: "Le bon freinage commence tôt et finit doucement, jamais l'inverse.",
    retry:
      "Là tu arrives trop vite ou tu jettes tes passagers en avant. Cherche entre les deux.",
    success: "Franc au début, relâché à la fin. Personne n'a bougé.",
    why: "Un freinage se dose à l'envers de ce qu'on croit : on appuie fort au début, quand il reste de la distance, et on relâche en approchant. C'est le relâché final qui évite le coup de tête des passagers, et c'est lui que l'examinateur sent.",
    transfer:
      "À ta prochaine leçon, essaie de relâcher la pédale juste avant l'arrêt et regarde si la voiture se pose au lieu de piquer.",
  },
  {
    ...commun,
    id: "c1f-monter-rapports",
    competence: "C1f",
    order: 1,
    boites: ["manuelle"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Le passage propre",
    objective: "Enchaîner un changement de rapport sans à-coup.",
    prompt:
      "Tu passes de la seconde à la troisième. Remets les gestes dans l'ordre.",
    visual: "levier",
    steps: [
      { id: "lever", label: "Lever le pied du gaz" },
      { id: "debrayer", label: "Débrayer à fond" },
      { id: "passer", label: "Passer le rapport" },
      { id: "relacher", label: "Relâcher l'embrayage" },
      { id: "gaz", label: "Reprendre du gaz" },
    ],
    sequence: ["lever", "debrayer", "passer", "relacher", "gaz"],
    hint: "Le pied droit lâche avant que le pied gauche descende.",
    retry:
      "Dans cet ordre, la voiture donne un coup. Reprends au moment où tu roules encore en seconde.",
    success: "Rapport passé sans secousse.",
    why: "Si tu débrayes en gardant le gaz, le moteur s'emballe dans le vide. Si tu reprends le gaz avant d'avoir relâché, la voiture donne un coup.",
    transfer:
      "Pendant ta prochaine leçon, compte ces cinq temps dans ta tête sur chaque passage de rapport.",
  },
  {
    ...commun,
    id: "c1f-sous-regime",
    competence: "C1f",
    order: 2,
    boites: ["manuelle"],
    mode: "diagnostic",
    modeLabel: "Diagnostiquer",
    title: "Le moteur qui tousse",
    objective: "Reconnaître un sous-régime et en sortir.",
    prompt: "La voiture broute et n'avance plus. Qu'est-ce qui se passe ?",
    visual: "compte-tours-bas",
    symptom:
      "Tu es en quatrième à trente à l'heure. Le moteur vibre et tu n'as plus de reprise.",
    choices: [
      {
        id: "descendre",
        label: "Le rapport est trop grand pour l'allure",
      },
      { id: "monter", label: "Le rapport est trop petit pour l'allure" },
      { id: "panne", label: "Le moteur est en panne et il faut s'arrêter" },
    ],
    solution: "descendre",
    hint: "Trente à l'heure en quatrième, c'est comme monter un escalier avec des skis.",
    retry:
      "Monter encore ferait empirer. Le moteur tourne déjà trop bas pour la vitesse à laquelle tu roules.",
    success: "Sous-régime : on descend d'un rapport.",
    why: "Un moteur qui tourne trop bas pour son rapport n'a plus de force et s'abîme. On rétrograde, et la reprise revient tout de suite.",
    transfer:
      "À ta prochaine leçon, descends d'un rapport dès que tu sens la voiture vibrer, sans attendre qu'on te le dise.",
  },
  {
    ...commun,
    id: "c1f-selecteur",
    competence: "C1f",
    order: 1,
    boites: ["auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "L'attente au feu",
    objective: "Savoir quoi faire du sélecteur à l'arrêt.",
    prompt:
      "Tu attends au feu rouge, en D, le pied sur le frein. Tu fais quoi ?",
    visual: "selecteur",
    choices: [
      { id: "reste", label: "Tu restes en D avec le pied posé sur le frein" },
      { id: "park", label: "Tu passes en P le temps de l'arrêt" },
      { id: "neutre", label: "Tu passes en N puis tu reprends en D" },
    ],
    solution: "reste",
    hint: "Le feu va repasser au vert dans quelques secondes.",
    retry:
      "Ça t'oblige à manipuler le sélecteur deux fois pour rien, et tu repars en retard sur tout le monde.",
    success: "On reste en D, le pied sur le frein.",
    why: "Le P sert quand on quitte la voiture. À un feu, il te fait perdre le départ et il use la boîte pour rien.",
    transfer:
      "Au prochain feu rouge, garde la main loin du sélecteur et sens que tu n'en as pas besoin.",
  },
  {
    ...commun,
    id: "c1f-kickdown",
    competence: "C1f",
    order: 2,
    boites: ["auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La reprise qui manque",
    objective: "Obtenir de la reprise en boîte automatique.",
    prompt: "Tu dois reprendre franchement pour t'insérer. Ton geste ?",
    visual: "pedales-auto",
    choices: [
      { id: "fond", label: "Tu enfonces l'accélérateur jusqu'en bas" },
      { id: "leger", label: "Tu appuies doucement et tu patientes" },
      { id: "manuel", label: "Tu passes le sélecteur sur N pour relancer" },
    ],
    solution: "fond",
    hint: "La boîte t'écoute par la pédale. Il faut lui parler fort.",
    retry:
      "Trop doux, la boîte reste sur son rapport long et la reprise ne vient pas.",
    success: "Pied au plancher : la boîte descend d'un rapport.",
    why: "C'est le kick-down. En allant jusqu'au bout de la course, tu demandes à la boîte de rétrograder et la reprise arrive.",
    transfer:
      "Sur une route dégagée avec ton enseignant, essaie une fois d'aller au bout de la pédale pour sentir la boîte descendre.",
  },
  {
    ...commun,
    id: "c1g-tour",
    competence: "C1g",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Le tour qui compte",
    objective: "Construire un tour de voiture qui ne laisse rien passer.",
    prompt: "Remets les contrôles extérieurs dans l'ordre du tour.",
    visual: "exterior",
    steps: [
      { id: "pneus", label: "Les pneus" },
      { id: "feux", label: "Les feux et clignotants" },
      { id: "vitres", label: "Vitres et rétroviseurs" },
      { id: "dessous", label: "Sous la voiture" },
    ],
    sequence: ["pneus", "feux", "vitres", "dessous"],
    hint: "On part du sol et on remonte. Le dernier regard se jette dessous, avant de monter.",
    retry:
      "Pas dans cet ordre. Pense à un tour qui se fait en marchant, sans revenir sur ses pas.",
    success: "Tour complet, dans l'ordre.",
    why: "Un tour qui suit toujours le même chemin ne laisse rien de côté. C'est aussi ce que l'examinateur observe le jour J.",
    transfer:
      "Avant ta prochaine leçon, fais ce tour en nommant chaque contrôle à voix haute.",
  },
  {
    ...commun,
    id: "c1g-usure",
    competence: "C1g",
    order: 3,
    boites: ["manuelle", "auto"],
    // ⚠️ Le dessin ILLUSTRE, il ne porte pas la réponse. Un pneu seul ne dit
    // pas à un débutant combien de gomme il lui reste : sans un deuxième pneu
    // pour comparer, « lis l'usure » serait une devinette. La question porte
    // donc sur ce que ce pneu change sur la route, ce que l'élève peut
    // raisonner. La lecture de l'usure viendra quand une mécanique saura
    // montrer deux pneus côte à côte.
    mode: "decision",
    modeLabel: "Décider",
    title: "Le pneu lisse",
    objective: "Relier l'état des pneus à ce qui se passe sous la pluie.",
    // ⚠️ La question ne prétend PAS que ce pneu-là est lisse : la photo montre
    // un pneu usé qui a encore ses sillons. Un énoncé qui décrit autre chose
    // que ce qu'on voit à l'écran abîme la confiance dans tout le reste.
    prompt:
      "Regarde les sillons. Quand ils s'effacent et qu'il pleut, que risques-tu ?",
    visual: "photo-pneu",
    choices: [
      { id: "eau", label: "La voiture flotte au lieu d'accrocher" },
      { id: "bruit", label: "Le pneu fait surtout beaucoup plus de bruit" },
      {
        id: "rien",
        label: "Rien de grave tant qu'on roule doucement en ville",
      },
    ],
    solution: "eau",
    hint: "Demande-toi où part l'eau quand les sillons ne peuvent plus l'avaler.",
    retry:
      "Le bruit n'est pas le problème. Pense à ce que les sillons font de l'eau.",
    success: "Sans sillons, l'eau reste sous le pneu et la voiture flotte.",
    why: "Les sillons servent à évacuer l'eau. Quand ils sont usés, un film d'eau s'installe entre la gomme et la route : le volant devient léger, le freinage ne répond plus, et rien ne prévient avant. Le minimum légal est de 1,6 mm et la tenue se dégrade bien avant.",
    transfer:
      "Avant ta prochaine leçon, accroupis-toi devant une roue et regarde la profondeur des sillons du bout du doigt.",
  },
  {
    ...commun,
    id: "c1g-niveaux",
    competence: "C1g",
    order: 4,
    boites: ["manuelle", "auto"],
    // ⚠️ Cette mission demandait « quel bocal ne va pas ? » sur un capot
    // DESSINÉ, où un niveau bas se voyait à sa couleur. Sur une vraie photo un
    // niveau ne se truque pas, et le jour de l'examen la question n'est de
    // toute façon pas « lequel est bas » mais « montrez-moi le liquide de
    // refroidissement ». La mission devient donc ce qu'elle aurait dû être :
    // trouver la pièce dans un vrai compartiment moteur.
    mode: "spot",
    modeLabel: "Trouver",
    title: "Sous le capot",
    objective: "Situer les bocaux dans un vrai compartiment moteur.",
    prompt:
      "Le capot est ouvert. Touche le bocal de liquide de refroidissement.",
    visual: "photo-capot",
    hotspots: [
      { id: "refroid", label: "Vase d'expansion", x: 10, y: 32, w: 16, h: 24 },
      { id: "huile", label: "Jauge d'huile", x: 33, y: 40, w: 11, h: 14 },
      { id: "frein", label: "Liquide de frein", x: 57, y: 29, w: 11, h: 14 },
      { id: "laveglace", label: "Lave-glace", x: 76, y: 66, w: 12, h: 16 },
    ],
    solution: "refroid",
    hint: "Cherche un bocal translucide avec un bouchon, à gauche du moteur.",
    retry:
      "Ce n'est pas celui-là. Le refroidissement se lit à travers son bocal, sans rien ouvrir.",
    success: "C'est le vase d'expansion. Le niveau se lit à travers.",
    why: "Le jour de l'examen on te demande de montrer une pièce et de dire à quoi elle sert. Le vase d'expansion est translucide justement pour qu'on lise le niveau sans rien ouvrir, entre les repères mini et maxi, moteur froid.",
    transfer:
      "Demande à ton enseignant d'ouvrir le capot et de te faire nommer les quatre bocaux à voix haute.",
  },
  {
    ...commun,
    id: "c1g-balayage",
    competence: "C1g",
    order: 5,
    boites: ["manuelle", "auto"],
    mode: "balayage",
    modeLabel: "Balayer",
    title: "Le tour qui ne saute rien",
    objective: "Faire le tour complet avant de désigner ce qui cloche.",
    prompt:
      "Fais le tour de la voiture du doigt, puis touche ce qui t'empêche de partir.",
    visual: "tour-voiture",
    indices: [
      { id: "pneu", label: "Pneu à plat", x: 89, y: 70 },
      { id: "vitre", label: "Vitre baissée", x: 68, y: 35 },
      { id: "plaque", label: "Plaque sale", x: 17, y: 62 },
    ],
    solution: "pneu",
    hint: "Ce qui touche la route passe avant ce qui touche le confort.",
    retry:
      "Ça se répare en dix secondes et ça n'empêche personne de rouler. Cherche plus bas.",
    success: "Pneu à plat. Repéré avant de monter.",
    why: "Le tour de voiture ne sert à rien si le regard s'arrête au premier détail. Il faut le faire en entier, toujours dans le même ordre, pour que les défauts qui comptent ne restent pas derrière soi.",
    transfer:
      "Avant ta prochaine leçon, fais le tour complet en partant de la portière conducteur et en revenant au même point.",
  },
  {
    ...commun,
    id: "c1h-creneau",
    competence: "C1h",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Le créneau posé",
    objective: "Construire un créneau qui tient à chaque fois.",
    prompt: "Tu te gares en créneau. Remets la manœuvre dans l'ordre.",
    visual: "parking",
    steps: [
      {
        id: "longer",
        label: "Se mettre à hauteur de la voiture de devant",
      },
      {
        id: "reculer",
        label: "Reculer tout droit jusqu'au repère",
      },
      { id: "braquer", label: "Braquer vers la place" },
      { id: "contre", label: "Contre-braquer pour redresser" },
      { id: "placer", label: "Se replacer le long du trottoir" },
    ],
    sequence: ["longer", "reculer", "braquer", "contre", "placer"],
    hint: "Tout part de la position de départ. Sans elle, aucun repère ne tombe juste.",
    retry:
      "Dans cet ordre, l'avant de ta voiture va toucher celle de devant. Reprends du début.",
    success: "Créneau reconstruit dans l'ordre.",
    why: "Le créneau n'est pas une question de talent, c'est une suite de repères. Ce sont toujours les mêmes, et ils marchent sur toutes les places.",
    transfer:
      "À ta prochaine leçon, annonce chaque étape à voix haute pendant que tu la fais.",
  },
  {
    ...commun,
    id: "c1h-rate",
    competence: "C1h",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La manœuvre qui part mal",
    objective: "Savoir reprendre une manœuvre au lieu de la forcer.",
    prompt: "Ton créneau part de travers et tu ne rentres pas. Tu fais quoi ?",
    visual: "parking",
    choices: [
      {
        id: "reprendre",
        label: "Tu ressors complètement et tu repars depuis le début",
      },
      { id: "forcer", label: "Tu forces au volant en reculant" },
      {
        id: "abandonner",
        label: "Tu laisses la voiture en travers et tu sors",
      },
    ],
    solution: "reprendre",
    hint: "Une manœuvre ratée ne se rattrape pas en insistant. Elle se recommence.",
    retry:
      "En insistant, tu montes sur le trottoir ou tu touches. Personne ne t'enlève de points pour recommencer.",
    success: "On ressort et on repart proprement.",
    why: "Reprendre une manœuvre n'est pas une faute, ni en leçon ni à l'examen. Toucher un trottoir ou une voiture, si.",
    transfer:
      "À ta prochaine leçon, rate volontairement un créneau et reprends-le. Tu verras que ça ne coûte rien.",
  },
  {
    ...commun,
    id: "c1i-seul",
    competence: "C1i",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Personne ne te guide",
    objective: "Se lancer dans une manœuvre sans attendre le feu vert.",
    prompt:
      "Ton enseignant se tait et attend. La place est libre. Tu fais quoi ?",
    visual: "parking",
    choices: [
      { id: "lance", label: "Tu regardes tout autour de toi et tu te lances" },
      { id: "attend", label: "Tu attends qu'il te dise quoi faire" },
      { id: "passe", label: "Tu passes ton chemin" },
    ],
    solution: "lance",
    hint: "Son silence n'est pas un piège. C'est l'examen qui commence.",
    retry:
      "Le jour J, personne ne parlera. C'est maintenant qu'on s'entraîne à décider seul.",
    success: "Tu contrôles, et tu y vas.",
    why: "Être autonome sur une manœuvre, c'est décider soi-même du moment. Le contrôle autour vient avant, la décision vient de toi.",
    transfer:
      "À ta prochaine leçon, demande à ton enseignant de ne rien dire pendant une manœuvre entière.",
  },

  // ── Chapitre 2 : circuler avec les autres ──────────────────────────────
  // Le chapitre 1 apprenait à faire marcher la voiture. Ici l'élève ne
  // commande plus une machine, il partage une route. Chaque mission part
  // donc d'un autre usager, jamais d'une pédale.
  {
    ...commun,
    id: "c2a-angle-mort",
    competence: "C2a",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "spot",
    modeLabel: "Trouver",
    title: "Le motard que personne ne voit",
    objective: "Aller chercher l'information qu'aucun miroir ne donne.",
    prompt:
      "Tu vas déboîter vers la gauche. Touche l'endroit qui montre ce que les miroirs cachent.",
    visual: "mirror",
    hotspots: [
      {
        id: "inner-mirror",
        label: "Rétroviseur intérieur",
        x: 35,
        y: 4,
        w: 30,
        h: 15,
      },
      {
        id: "blind-spot",
        label: "Vitre latérale gauche",
        x: 5,
        y: 21,
        w: 36,
        h: 46,
      },
      {
        id: "side-mirror",
        label: "Rétroviseur extérieur gauche",
        x: 4,
        y: 70,
        w: 18,
        h: 17,
      },
      { id: "dash", label: "Tableau de bord", x: 46, y: 76, w: 40, h: 22 },
    ],
    solution: "blind-spot",
    hint: "Un deux-roues peut rouler juste à côté de ta portière. Aucun miroir ne le cadre.",
    retry:
      "Ce miroir montre l'arrière, pas le côté. Cherche l'ouverture où ta tête doit tourner.",
    success: "Coup d'œil par la vitre : l'angle mort est levé.",
    why: "Les miroirs laissent une zone aveugle le long de la voiture. Un regard rapide par la vitre est le seul moyen de la couvrir.",
    transfer:
      "Pendant ta prochaine leçon, tourne la tête avant chaque déboîtement et dis à voix haute ce que tu vois.",
  },
  {
    ...commun,
    id: "c2a-regard-loin",
    competence: "C2a",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Le regard qui porte loin",
    objective: "Placer son regard là où l'information arrive en premier.",
    prompt: "Tu roules en ville dans une file. Où poses-tu les yeux ?",
    visual: "city-light",
    choices: [
      { id: "bumper", label: "Sur le pare-chocs de la voiture devant toi" },
      { id: "far", label: "Loin devant par-dessus toute la file" },
      { id: "speedo", label: "Sur le compteur pour tenir la limite" },
    ],
    solution: "far",
    hint: "Ce que tu vois au dernier moment, tu le subis. Ce que tu vois tôt, tu le prépares.",
    retry:
      "Ce point ne te donne aucune avance. Cherche l'endroit qui t'annonce ce qui arrive.",
    success: "Regard porté loin : tu vois venir au lieu de réagir.",
    why: "Le regard lointain te donne quelques secondes d'avance. C'est ce temps qui transforme un freinage d'urgence en simple ralentissement.",
    transfer:
      "Sur ta prochaine leçon en ville, annonce le feu ou le carrefour avant que ton enseignant en parle.",
  },
  {
    ...commun,
    id: "c2a-balayage",
    competence: "C2a",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "balayage",
    modeLabel: "Balayer",
    title: "Ce qui va bouger en premier",
    objective: "Explorer toute la scène avant de choisir ce qui compte.",
    prompt:
      "Balaye la rue du doigt, puis touche ce qui va changer ta conduite.",
    visual: "rue-ballon",
    indices: [
      { id: "ballon", label: "Ballon sur la chaussée", x: 23, y: 78 },
      { id: "feu", label: "Feu encore vert", x: 78, y: 14 },
      { id: "affiche", label: "Panneau publicitaire", x: 19, y: 17 },
    ],
    solution: "ballon",
    hint: "Un objet qui roule tout seul n'est jamais seul très longtemps.",
    retry:
      "Ça se voit, mais ça ne va pas surgir devant toi. Cherche ce qui annonce quelqu'un.",
    success: "Un ballon qui roule. Un enfant arrive derrière.",
    why: "Prendre l'information, ce n'est pas regarder loin devant en ligne droite. C'est balayer, et savoir hiérarchiser : parmi tout ce que tu vois, un seul élément annonce quelqu'un qui va traverser sans regarder.",
    transfer:
      "Pendant ta prochaine leçon, nomme à voix haute un élément que tu vois et dis s'il peut bouger.",
  },
  {
    ...commun,
    id: "c2b-limite",
    competence: "C2b",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La limite n'est pas un objectif",
    objective: "Régler sa vitesse sur ce qu'on voit, pas sur le panneau.",
    prompt:
      "Rue étroite limitée à 30. Une école sort et des enfants longent le trottoir. Tu roules à combien ?",
    visual: "city-light",
    choices: [
      { id: "thirty", label: "À 30 puisque le panneau te l'autorise" },
      {
        id: "under",
        label: "En dessous de 30 tant qu'il y a du monde",
      },
      { id: "keep", label: "À 50 jusqu'à voir le prochain panneau de ville" },
    ],
    solution: "under",
    hint: "Un panneau donne un maximum. Il ne promet jamais que cette vitesse est sûre.",
    retry:
      "Un enfant peut traverser sans regarder. Cette vitesse ne te laisse pas de marge.",
    success: "Vitesse réglée sur la rue, pas sur le panneau.",
    why: "La limite est un plafond légal. La bonne vitesse est celle qui te permet de t'arrêter sur la distance que tu vois libre.",
    transfer:
      "Pendant ta prochaine leçon, choisis toi-même ta vitesse dans une rue chargée et explique ton choix.",
  },
  {
    ...commun,
    id: "c2b-ralentir-manuelle",
    competence: "C2b",
    order: 2,
    boites: ["manuelle"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Ralentir sans surprendre",
    objective:
      "Construire un ralentissement qui reste doux pour tout le monde.",
    prompt:
      "Un rétrécissement approche. Remets les gestes dans l'ordre, du premier au dernier.",
    visual: "pedales-manuelle",
    steps: [
      { id: "mirror", label: "Contrôler le rétroviseur" },
      { id: "lift", label: "Lever le pied de l'accélérateur" },
      { id: "brake", label: "Freiner progressivement" },
      { id: "gear", label: "Passer le rapport adapté" },
      { id: "release", label: "Relâcher le frein en douceur" },
    ],
    sequence: ["mirror", "lift", "brake", "gear", "release"],
    hint: "Avant de ralentir, tu regardes ce qui te suit. Le rapport se choisit une fois la vitesse basse.",
    retry:
      "Pas encore. Un ralentissement commence par une information, pas par une pédale.",
    success: "Ralentissement propre reconstruit.",
    why: "Le contrôle arrière prévient un freinage surprise pour celui qui te suit. Le rapport se change après avoir ralenti, pas pendant.",
    transfer:
      "À ta prochaine leçon, jette un œil au rétroviseur avant chaque freinage prévu.",
  },
  {
    ...commun,
    id: "c2b-ralentir-auto",
    competence: "C2b",
    order: 2,
    boites: ["auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Ralentir sans surprendre",
    objective:
      "Construire un ralentissement qui reste doux pour tout le monde.",
    prompt:
      "Un rétrécissement approche. Remets les gestes dans l'ordre, du premier au dernier.",
    visual: "pedales-auto",
    steps: [
      { id: "mirror", label: "Contrôler le rétroviseur" },
      { id: "lift", label: "Lever le pied de l'accélérateur" },
      { id: "brake", label: "Freiner progressivement" },
      { id: "hold", label: "Garder le frein jusqu'au repère" },
      { id: "release", label: "Relâcher le frein en douceur" },
    ],
    sequence: ["mirror", "lift", "brake", "hold", "release"],
    hint: "Avant de ralentir, tu regardes ce qui te suit. Ton pied droit fait tout le reste.",
    retry:
      "Pas encore. Un ralentissement commence par une information, pas par une pédale.",
    success: "Ralentissement propre reconstruit.",
    why: "Le contrôle arrière prévient un freinage surprise pour celui qui te suit. Relâcher le frein d'un coup en fin de ralentissement relance la voiture toute seule.",
    transfer:
      "À ta prochaine leçon, jette un œil au rétroviseur avant chaque freinage prévu.",
  },
  {
    ...commun,
    id: "c2b-dose-allure",
    competence: "C2b",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "reglage",
    modeLabel: "Doser",
    title: "L'allure que la rue autorise",
    objective: "Régler son allure sur ce qu'on voit, pas sur le panneau.",
    prompt:
      "Rue étroite, voitures garées des deux côtés, école à cent mètres. Pousse l'allure que tu tiendrais.",
    visual: "compte-tours-bas",
    commande: { label: "Allure", article: "l'allure", depart: 0 },
    crans: [
      { id: "pas", label: "Au pas" },
      { id: "posee", label: "Allure posée" },
      { id: "limite", label: "La limite affichée" },
    ],
    solution: "posee",
    hint: "Le panneau donne un maximum. Ce que tu vois donne le reste.",
    retry:
      "Trop lent tu bloques la rue, trop vite tu n'as plus de marge si quelqu'un sort. Cherche entre les deux.",
    success: "Assez lent pour t'arrêter, assez fluide pour ne gêner personne.",
    why: "Une limite de vitesse est un plafond, jamais une consigne. Entre des voitures garées et une école, ce qui fixe l'allure c'est la distance où tu peux t'arrêter si un enfant sort. Rouler à la limite affichée là où on ne voit rien est une faute même sans excès.",
    transfer:
      "Dans la prochaine rue étroite, dis à voix haute à quelle allure tu roules et pourquoi.",
  },
  {
    ...commun,
    id: "c2c-place-dans-voie",
    competence: "C2c",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "spot",
    modeLabel: "Trouver",
    title: "Ta place sur la route",
    objective: "Tenir le milieu de sa voie plutôt qu'un bord.",
    prompt: "La route est libre. Touche l'endroit où roulent tes roues.",
    visual: "overtake-empty",
    hotspots: [
      // Les zones suivent la perspective de la route : plus on monte dans la
      // scène, plus le bitume est étroit. Elles sont volontairement basses.
      {
        id: "center-line",
        label: "Collé à la ligne du milieu",
        x: 43,
        y: 64,
        w: 12,
        h: 26,
      },
      {
        id: "lane-middle",
        label: "Au milieu de ta voie",
        x: 57,
        y: 64,
        w: 14,
        h: 26,
      },
      {
        id: "right-edge",
        label: "Collé au bord droit",
        x: 74,
        y: 70,
        w: 16,
        h: 22,
      },
      {
        id: "other-lane",
        label: "Sur la voie d'en face",
        x: 22,
        y: 68,
        w: 17,
        h: 22,
      },
    ],
    solution: "lane-middle",
    hint: "Ta voie a deux bords. Tu ne colles ni l'un ni l'autre.",
    retry:
      "Ce bord te laisse sans marge d'un côté. Cherche la place qui garde de l'espace des deux côtés.",
    success: "Milieu de voie tenu : de la marge des deux côtés.",
    why: "Rouler au milieu de ta voie te laisse de la place pour t'écarter d'un piéton, d'un nid de poule ou d'une voiture qui déborde.",
    transfer:
      "Pendant ta prochaine leçon, demande à ton enseignant de te dire si tu tires vers un bord sans t'en rendre compte.",
  },
  {
    ...commun,
    id: "c2c-voie-giratoire",
    competence: "C2c",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La bonne voie sur l'anneau",
    objective: "Choisir sa file avant d'entrer sur un giratoire.",
    prompt:
      "Giratoire à deux voies. Tu sors à la première sortie. Tu entres par quelle file ?",
    visual: "roundabout",
    choices: [
      { id: "right", label: "Celle de droite dès l'entrée du giratoire" },
      { id: "left", label: "La file de gauche qui tourne mieux" },
      { id: "late", label: "N'importe laquelle puis tu choisis sur l'anneau" },
    ],
    solution: "right",
    hint: "Tu ressors presque tout de suite. Inutile d'aller chercher l'intérieur de l'anneau.",
    retry:
      "Cette file t'oblige à couper devant quelqu'un pour rejoindre ta sortie.",
    success: "File de droite : ta sortie est déjà sous ta roue.",
    why: "Une sortie proche se prend par la file de droite. Choisir sa file avant d'entrer évite de traverser l'anneau au dernier moment.",
    transfer:
      "Au prochain giratoire, annonce ta file avant d'y arriver, pas une fois dessus.",
  },
  {
    ...commun,
    id: "c2c-marges",
    competence: "C2c",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "placement",
    modeLabel: "Placer",
    title: "Ta place entre les deux",
    objective: "Répartir ses marges au lieu de viser le centre de sa voie.",
    prompt:
      "Des voitures sont garées à droite. Fais glisser ta voiture là où tu roulerais.",
    visual: "voie-garee",
    piece: {
      label: "Ta voiture",
      article: "ta voiture",
      forme: "voiture",
      largeur: 12,
      hauteur: 21,
      departX: 70,
      departY: 88,
    },
    spots: [
      {
        id: "serre",
        label: "Contre les voitures garées",
        x: 62,
        y: 30,
        w: 10,
        h: 30,
      },
      {
        id: "juste",
        label: "Au milieu de la voie",
        x: 51,
        y: 30,
        w: 10,
        h: 30,
      },
      {
        id: "empiete",
        label: "Sur la ligne du milieu",
        x: 38,
        y: 30,
        w: 10,
        h: 30,
      },
    ],
    solution: "juste",
    hint: "Une portière qui s'ouvre fait un mètre. Garde-toi cette largeur.",
    retry:
      "Cette place sacrifie une marge pour en gagner une autre. Il en faut des deux côtés.",
    success: "Une marge à droite, une marge à gauche.",
    why: "Serré à droite, une portière qui s'ouvre est imparable. Trop à gauche, tu prends la place de celui qui vient en face. La bonne position garde les deux échappatoires ouvertes.",
    transfer:
      "À ta prochaine leçon, dis à voix haute où tu places ta voiture quand tu longes des voitures garées.",
  },
  {
    ...commun,
    id: "c2e-cycliste",
    competence: "C2e",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "trajectory",
    modeLabel: "Tracer",
    title: "Un mètre de respect",
    objective: "Dépasser un cycliste avec l'écart que la loi impose.",
    prompt:
      "Vue de dessus. La voie de gauche est libre. Choisis la trajectoire qui dépasse ce cycliste.",
    visual: "overtake-top",
    paths: [
      // Vue de dessus, route verticale : ta voie occupe la moitié droite. Les
      // trois lignes partent de ta voiture et remontent le long du cycliste.
      {
        id: "close",
        label: "frôler le cycliste sans s'écarter",
        legend: "Frôle le cycliste",
        d: "M237 232 C237 192 219 156 219 104 C219 68 231 46 234 22",
      },
      {
        id: "meter",
        label: "s'écarter d'un bon mètre en empiétant sur la voie de gauche",
        legend: "S'écarte d'un mètre",
        d: "M237 232 C237 194 172 158 172 104 C172 62 226 44 234 22",
      },
      {
        id: "wide",
        label: "déborder jusqu'au bord opposé de la chaussée",
        legend: "Déborde jusqu'au bord",
        d: "M237 232 C237 194 90 160 90 104 C90 54 222 46 234 22",
      },
    ],
    solution: "meter",
    hint: "Un mètre en ville, un mètre cinquante en dehors. Ni moins, ni toute la chaussée.",
    retry:
      "Cette ligne serre trop le cycliste ou t'emmène trop loin dans la voie d'en face.",
    success: "Écart tenu : le cycliste garde sa place et toi la tienne.",
    why: "Un cycliste peut se déporter pour éviter un trou ou une grille. L'écart d'un mètre est ce qui absorbe ce mouvement.",
    transfer:
      "Au prochain cycliste, attends d'avoir la place puis dépasse en t'écartant franchement.",
  },
  {
    ...commun,
    id: "c2e-voiture-en-face",
    competence: "C2e",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La voiture arrive en face",
    objective: "Renoncer à un dépassement qui n'a plus la place.",
    prompt:
      "Tu allais dépasser le cycliste. Une voiture arrive en face. Tu fais quoi ?",
    visual: "overtake-oncoming",
    choices: [
      { id: "rush", label: "Tu dépasses vite avant qu'elle arrive sur toi" },
      {
        id: "squeeze",
        label: "Tu passes sans t'écarter de ta voie",
      },
      {
        id: "wait",
        label: "Tu restes derrière à bonne distance et tu attends",
      },
    ],
    solution: "wait",
    hint: "Le mètre d'écart n'est pas négociable. S'il ne rentre pas, le dépassement non plus.",
    retry:
      "Cette solution enlève de la place au cycliste ou à la voiture d'en face. Un dépassement se refuse quand la place manque.",
    success: "Dépassement reporté : tout le monde garde sa place.",
    why: "Un dépassement se prépare et s'annule aussi facilement. Attendre quelques secondes coûte moins qu'un cycliste serré contre le trottoir.",
    transfer:
      "Au prochain cycliste, dis à voix haute si tu as la place de dépasser ou non avant de bouger le volant.",
  },
  {
    ...commun,
    id: "c2e-ecart",
    competence: "C2e",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "placement",
    modeLabel: "Placer",
    title: "L'écart qui protège",
    objective: "Choisir l'espace à laisser en doublant un cycliste.",
    prompt: "Tu doubles ce cycliste. Fais glisser ta voiture où tu passerais.",
    visual: "overtake-top-libre",
    piece: {
      label: "Ta voiture",
      article: "ta voiture",
      forme: "voiture",
      largeur: 12,
      hauteur: 20,
      departX: 66,
      departY: 88,
    },
    spots: [
      { id: "large", label: "Largement à gauche", x: 36, y: 22, w: 12, h: 20 },
      {
        id: "serre",
        label: "Juste à côté du cycliste",
        x: 53,
        y: 22,
        w: 10,
        h: 20,
      },
      {
        id: "attendre",
        label: "Derrière le cycliste",
        x: 60,
        y: 55,
        w: 12,
        h: 20,
      },
    ],
    solution: "large",
    hint: "Un cycliste peut se déporter d'un coup pour éviter un trou. Laisse-lui cette place.",
    retry:
      "La voie d'en face est libre, tu peux te déporter franchement. Ce qui compte est l'écart que tu lui laisses.",
    success: "Un écart large. Le cycliste peut zigzaguer sans que ça touche.",
    why: "Il faut au moins un mètre en ville et un mètre cinquante hors agglomération. Un cycliste n'est jamais parfaitement stable : un nid-de-poule ou une rafale et il se déporte sans prévenir.",
    transfer:
      "Quand ton enseignant double un vélo, regarde l'espace qu'il laisse et compare à ce que tu aurais fait.",
  },
  {
    ...commun,
    id: "c2g-annoncer",
    competence: "C2g",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Annoncer avant d'agir",
    objective: "Prévenir les autres dans l'ordre qui les protège.",
    prompt: "Tu vas changer de voie. Remets la chaîne dans l'ordre.",
    visual: "cockpit",
    steps: [
      { id: "inner", label: "Rétroviseur intérieur" },
      { id: "outer", label: "Rétroviseur extérieur" },
      { id: "signal", label: "Clignotant" },
      { id: "blind", label: "Coup d'œil dans l'angle mort" },
      { id: "move", label: "Déplacer la voiture" },
    ],
    sequence: ["inner", "outer", "signal", "blind", "move"],
    hint: "Tu prends l'information, tu annonces, puis tu vérifies une dernière fois juste avant de bouger.",
    retry:
      "Pas encore. Le clignotant ne vient ni en premier ni en dernier : il annonce une intention déjà réfléchie.",
    success: "Chaîne d'annonce reconstruite.",
    why: "Le clignotant prévient, il ne demande pas la permission. Le dernier coup d'œil vérifie que personne n'est arrivé pendant que tu annonçais.",
    transfer:
      "Pendant ta prochaine leçon, annonce chaque changement de voie à voix haute dans cet ordre.",
  },
  {
    ...commun,
    id: "c2g-pieton",
    competence: "C2g",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Le piéton qui hésite",
    objective: "Se faire comprendre d'un piéton sans lui donner un ordre.",
    prompt:
      "Un piéton attend au bord du passage et te regarde. Comment tu communiques ?",
    visual: "city-light",
    choices: [
      { id: "horn", label: "Un coup de klaxon pour l'inviter à traverser" },
      { id: "flash", label: "Un appel de phares pour l'inviter" },
      {
        id: "eyes",
        label: "Tu t'arrêtes vraiment et tu croises son regard",
      },
    ],
    solution: "eyes",
    hint: "La meilleure façon de dire à un piéton qu'il peut passer, c'est de s'arrêter vraiment.",
    retry:
      "Ce signal peut le lancer devant une voiture que tu ne vois pas. Cherche la réponse qui ne décide pas à sa place.",
    success: "Voiture arrêtée et regard croisé : le message est clair.",
    why: "Un klaxon ou un appel de phares lance le piéton sur ta parole. Une voiture immobile lui laisse le temps de vérifier lui-même l'autre voie.",
    transfer:
      "Au prochain passage piéton, arrête-toi complètement et laisse la personne décider de son départ.",
  },
  {
    ...commun,
    id: "c2h-sortie-tard",
    competence: "C2h",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La sortie annoncée trop tard",
    objective: "Garder le contrôle quand le guidage se trompe de tempo.",
    prompt:
      "Le GPS annonce ta sortie cinquante mètres avant. Tu es sur la voie de gauche. Tu fais quoi ?",
    visual: "gps",
    choices: [
      { id: "cross", label: "Tu traverses les voies tout de suite" },
      {
        id: "continue",
        label: "Tu continues et tu prends la sortie suivante",
      },
      { id: "stop", label: "Tu ralentis fort pour te donner le temps" },
    ],
    solution: "continue",
    hint: "Rater une sortie coûte cinq minutes. Traverser deux voies en urgence coûte bien plus.",
    retry:
      "Cette manœuvre surprend tout le monde autour de toi pour gagner quelques secondes.",
    success: "Sortie ratée, trajet sauvé.",
    why: "Conduire en autonomie, c'est décider soi-même. Un guidage en retard est une information, pas un ordre.",
    transfer:
      "À ta prochaine leçon avec GPS, dis à voix haute quand tu choisis de ne pas suivre une consigne trop tardive.",
  },
  {
    ...commun,
    id: "c2h-sans-panneau",
    competence: "C2h",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "diagnostic",
    modeLabel: "Diagnostiquer",
    title: "Le carrefour sans panneau",
    objective: "Trancher seul quand aucune signalisation ne répond.",
    prompt: "Aucun panneau ne t'annonce la règle. Quelle décision prends-tu ?",
    visual: "intersection",
    symptom:
      "Tu arrives à un carrefour sans panneau, sans marquage au sol et sans feu.",
    choices: [
      { id: "pass", label: "Tu passes puisque rien ne t'oblige à t'arrêter" },
      {
        id: "right",
        label: "Tu cèdes à celui qui vient de ta droite",
      },
      { id: "speed", label: "Tu accélères pour passer avant les autres" },
    ],
    solution: "right",
    hint: "Quand rien n'est écrit, une règle s'applique par défaut. Elle vient toujours du même côté.",
    retry:
      "L'absence de panneau ne te donne aucune priorité. Cherche la règle qui reste quand il n'y a plus de signalisation.",
    success: "Priorité à droite appliquée.",
    why: "Sans signalisation, la priorité à droite s'applique. Un conducteur autonome connaît cette règle par défaut et n'attend pas qu'on la lui rappelle.",
    transfer:
      "Pendant ta prochaine leçon, repère un carrefour sans panneau et annonce la règle avant d'y arriver.",
  },

  // ── Chapitre 3 : quand les conditions se dégradent ─────────────────────
  // Ici la route ne change pas de règles, elle change de marges. Chaque
  // mission part donc d'une marge qui rétrécit : la lumière, l'adhérence,
  // la vitesse des autres, l'espace pour se ranger.
  {
    ...commun,
    id: "c3a-feux-de-route",
    competence: "C3a",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Les pleins phares",
    objective: "Rendre la route aux autres dès qu'ils apparaissent.",
    prompt:
      "Route de campagne sans éclairage, tu roules en pleins phares. Une voiture apparaît en face. Tu fais quoi ?",
    visual: "night",
    choices: [
      {
        id: "switch",
        label: "Tu repasses en feux de croisement tout de suite",
      },
      {
        id: "keep",
        label: "Tu gardes tes pleins phares jusqu'à ce qu'elle passe",
      },
      { id: "flash", label: "Tu fais un appel de phares pour la prévenir" },
    ],
    solution: "switch",
    hint: "Tes pleins phares éclairent bien. Ils éblouissent aussi bien.",
    retry:
      "Cette réaction envoie ta lumière dans les yeux de l'autre conducteur au pire moment.",
    success: "Feux de croisement repassés : personne n'est ébloui.",
    why: "Un conducteur ébloui ne voit plus la route pendant plusieurs secondes. Les pleins phares se coupent dès qu'un véhicule apparaît devant toi ou que tu en suis un.",
    transfer:
      "Sur ta prochaine leçon de nuit hors agglomération, coupe et rallume tes pleins phares sans quitter la route des yeux.",
  },
  {
    ...commun,
    id: "c3b-brouillard",
    competence: "C3b",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Le brouillard tombe",
    objective: "Choisir l'éclairage qui aide au lieu de gêner.",
    prompt: "Tu ne vois plus à cinquante mètres. Tu allumes quoi ?",
    visual: "rain",
    choices: [
      { id: "high", label: "Tes pleins phares pour voir bien plus loin" },
      {
        id: "fog",
        label: "Tes feux de croisement et de brouillard",
      },
      { id: "day", label: "Tes feux de jour suffisent bien assez" },
    ],
    solution: "fog",
    hint: "Dans le brouillard, une lumière trop haute te revient dans les yeux.",
    retry:
      "Cet éclairage t'aveugle toi-même ou ne montre pas ta voiture aux autres.",
    success: "Croisement et brouillard : tu vois et on te voit.",
    why: "Les pleins phares se réfléchissent sur les gouttes et forment un mur blanc. Les feux de croisement passent sous le brouillard, et les feux de brouillard élargissent près du sol.",
    transfer:
      "Repère la commande des feux de brouillard dans la voiture, à l'arrêt, avant d'en avoir besoin.",
  },
  {
    ...commun,
    id: "c3b-distance",
    competence: "C3b",
    order: 4,
    boites: ["manuelle", "auto"],
    mode: "placement",
    modeLabel: "Placer",
    title: "La distance dans le voile",
    objective: "Convertir ce qu'on voit en distance d'arrêt disponible.",
    prompt:
      "Le brouillard tombe. Fais glisser ta voiture à la distance que tu garderais.",
    visual: "brouillard-file",
    piece: {
      label: "Ta voiture",
      article: "ta voiture",
      forme: "voiture",
      largeur: 13,
      hauteur: 18,
      departX: 50,
      departY: 92,
    },
    spots: [
      { id: "colle", label: "Tout près", x: 44, y: 30, w: 13, h: 16 },
      { id: "juste", label: "À bonne distance", x: 44, y: 52, w: 13, h: 16 },
      { id: "loin", label: "Très loin derrière", x: 44, y: 74, w: 13, h: 16 },
    ],
    solution: "juste",
    hint: "Tu dois pouvoir t'arrêter dans la distance que tes yeux couvrent.",
    retry:
      "Trop près tu n'as plus de quoi t'arrêter. Trop loin tu perds les feux qui te guident.",
    success: "Assez d'espace pour t'arrêter, assez près pour garder ses feux.",
    why: "Dans le brouillard la règle change : la distance ne se mesure plus en secondes mais en ce que tu vois. Tu gardes de quoi t'arrêter dans ta portée visuelle, sans perdre les feux de celui qui te précède, parce qu'ils t'annoncent ce qui arrive avant que tu le voies.",
    transfer:
      "Par temps de brouillard, demande à ton enseignant de te montrer jusqu'où porte vraiment ton regard.",
  },
  {
    ...commun,
    id: "c3c-aquaplaning",
    competence: "C3c",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "La voiture se met à flotter",
    objective: "Traverser une perte d'adhérence sans l'aggraver.",
    prompt:
      "Grosse flaque à vitesse soutenue. Le volant devient léger et le bruit des pneus disparaît. Ton geste ?",
    visual: "rain",
    choices: [
      { id: "brake", label: "Tu freines fort pour ralentir tout de suite" },
      {
        id: "lift",
        label: "Tu lèves le pied et tu tiens le volant",
      },
      {
        id: "steer",
        label: "Tu braques pour sortir de la flaque au plus vite",
      },
    ],
    solution: "lift",
    hint: "Tes pneus ne touchent plus la route. Un geste fort ne sera transmis à rien.",
    retry:
      "Ce geste part dans le vide tant que les pneus flottent, puis frappe d'un coup quand ils reprennent.",
    success: "Pied levé, volant droit : la voiture retrouve la route.",
    why: "En aquaplanage les roues glissent sur un film d'eau. Freiner ou braquer ne fait rien pendant la glisse, puis tout d'un coup au moment où l'adhérence revient.",
    transfer:
      "Après la prochaine grosse pluie, demande à ton enseignant à quelle vitesse ce risque commence sur votre route habituelle.",
  },
  {
    ...commun,
    id: "c3c-verglas",
    competence: "C3c",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "diagnostic",
    modeLabel: "Diagnostiquer",
    title: "La route qui brille",
    objective: "Reconnaître une plaque de verglas avant de rouler dessus.",
    prompt: "Ces trois indices vont ensemble. Que décides-tu ?",
    visual: "rain",
    symptom:
      "Le thermomètre affiche 1 °C, la chaussée brille par plaques, et le bruit des pneus s'est adouci.",
    choices: [
      { id: "wet", label: "C'est de la pluie et tu continues normalement" },
      {
        id: "ice",
        label: "Sans doute du verglas et tu ralentis bien avant",
      },
      {
        id: "test",
        label: "Tu freines un coup pour tester l'adhérence au sol",
      },
    ],
    solution: "ice",
    hint: "Trois indices qui vont ensemble valent une certitude. Tu n'as pas besoin d'attendre le quatrième.",
    retry:
      "Cette réaction te fait découvrir l'adhérence au moment où tu ne peux plus rien corriger.",
    success: "Verglas suspecté : tu ralentis avant d'être dessus.",
    why: "Une plaque de verglas ne se voit pas toujours. Le froid, les reflets et le silence des pneus arrivent ensemble, et un ralentissement anticipé est la seule marge qui reste.",
    transfer:
      "Cet hiver, prends l'habitude de regarder la température extérieure avant de partir.",
  },
  {
    ...commun,
    id: "c3c-dose-correction",
    competence: "C3c",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "reglage",
    modeLabel: "Doser",
    title: "L'arrière qui part",
    objective: "Corriger une glissade sans en provoquer une deuxième.",
    prompt:
      "Sur le mouillé, l'arrière commence à partir. Pousse ta correction.",
    visual: "rain",
    commande: {
      label: "Correction au volant",
      article: "la correction",
      depart: 0,
    },
    crans: [
      { id: "rien", label: "Ne rien faire" },
      { id: "douce", label: "Corriger doucement" },
      { id: "brusque", label: "Contre-braquer à fond" },
    ],
    solution: "douce",
    hint: "Tu regardes où tu veux aller, et tes mains suivent sans à-coup.",
    retry:
      "Sans rien faire tu pars. En corrigeant trop fort tu repars de l'autre côté, plus vite encore.",
    success: "Une correction douce et la voiture se remet dans l'axe.",
    why: "Une glissade se rattrape avec des gestes progressifs et un regard porté loin. Un coup de volant trop fort provoque le contre-effet : la voiture repasse de l'autre côté avec plus d'élan qu'avant, et là c'est fini. La règle est la même pour le frein et l'accélérateur sur le verglas.",
    transfer:
      "Demande à ton enseignant de te faire sentir sur une aire mouillée ce que fait une correction trop forte.",
  },
  {
    ...commun,
    id: "c3e-insertion",
    competence: "C3e",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Entrer dans le flot",
    objective: "S'insérer à la vitesse des autres et pas à la sienne.",
    prompt:
      "Vue de dessus. Tu arrives par la voie d'insertion. Remets la chaîne dans l'ordre.",
    visual: "motorway",
    steps: [
      { id: "look", label: "Regarder le trafic qui arrive" },
      { id: "speed", label: "Accélérer à la vitesse du flot" },
      { id: "signal", label: "Clignotant à gauche" },
      { id: "blind", label: "Coup d'œil dans l'angle mort" },
      { id: "merge", label: "S'insérer dans un espace" },
    ],
    sequence: ["look", "speed", "signal", "blind", "merge"],
    hint: "La voie d'insertion sert à prendre de la vitesse, pas à attendre.",
    retry:
      "Pas encore. On regarde avant d'accélérer, et on n'entre jamais plus lentement que ceux qui roulent déjà.",
    success: "Insertion reconstruite.",
    why: "Arriver au bout de la voie d'insertion trop lentement oblige tout le monde à freiner. La vitesse s'attrape sur la bretelle, pas une fois dans le flot.",
    transfer:
      "À ta prochaine entrée sur voie rapide, regarde le compteur en fin de bretelle et compare avec le trafic.",
  },
  {
    ...commun,
    id: "c3e-panne",
    competence: "C3e",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "En panne sur la bande d'arrêt",
    objective: "Se mettre à l'abri avant de s'occuper de la voiture.",
    prompt:
      "Vue de dessus. Ta voiture s'arrête sur la bande d'arrêt d'urgence. Remets les gestes dans l'ordre.",
    visual: "motorway-shoulder",
    steps: [
      { id: "warning", label: "Feux de détresse" },
      { id: "vest", label: "Enfiler le gilet dans la voiture" },
      { id: "exit", label: "Sortir par le côté droit" },
      { id: "rail", label: "Passer derrière la glissière" },
      { id: "call", label: "Appeler les secours" },
    ],
    sequence: ["warning", "vest", "exit", "rail", "call"],
    hint: "Le gilet se met avant d'ouvrir la portière, jamais après.",
    retry:
      "Pas encore. Tant que tu es exposé au trafic, aucun autre geste ne compte.",
    success: "Mise en sécurité reconstruite.",
    why: "Le danger n'est pas la panne, c'est de rester au bord des voies. Le gilet à l'intérieur, la sortie côté droit et la glissière te mettent hors d'atteinte en moins d'une minute.",
    transfer:
      "Vérifie où sont rangés le gilet et le triangle dans la voiture où tu apprends.",
  },
  {
    ...commun,
    id: "c3e-creneau",
    competence: "C3e",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "placement",
    modeLabel: "Placer",
    title: "Le créneau qui s'ouvre",
    objective: "Choisir un espace d'insertion réellement atteignable.",
    prompt:
      "Tu arrives par la bretelle. Fais glisser ta voiture dans l'espace que tu vises.",
    visual: "insertion",
    piece: {
      label: "Ta voiture",
      article: "ta voiture",
      forme: "voiture",
      largeur: 14,
      hauteur: 15,
      departX: 12,
      departY: 78,
    },
    spots: [
      {
        id: "serre",
        label: "Entre les deux premières",
        x: 16,
        y: 30,
        w: 10,
        h: 15,
      },
      {
        id: "large",
        label: "Dans le grand espace",
        x: 48,
        y: 30,
        w: 16,
        h: 15,
      },
      {
        id: "queue",
        label: "Tout au bout, derrière",
        x: 86,
        y: 30,
        w: 13,
        h: 15,
      },
    ],
    solution: "large",
    hint: "Vise l'espace où tu tiens sans forcer personne à freiner.",
    retry:
      "Cet espace se referme avant que tu y sois, ou il oblige quelqu'un à ralentir pour toi.",
    success: "Un espace large, atteignable en accélérant sur la bretelle.",
    why: "S'insérer n'est pas se glisser au premier trou venu. Tu choisis un espace assez grand pour y entrer à la vitesse du flot, et tu accélères sur la bretelle pour y arriver à la bonne allure. Arriver trop lentement oblige les autres à freiner.",
    transfer:
      "À la prochaine entrée d'autoroute, désigne à voix haute l'espace que tu viserais avant d'y arriver.",
  },
  {
    ...commun,
    id: "c3f-tunnel-entree",
    competence: "C3f",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "sequence",
    modeLabel: "Ordonner",
    title: "Le trou noir",
    objective: "Préparer ses yeux avant de perdre la lumière.",
    prompt: "Un tunnel approche. Remets les gestes dans l'ordre.",
    visual: "tunnel",
    steps: [
      { id: "glasses", label: "Enlever les lunettes de soleil" },
      { id: "lights", label: "Allumer les feux de croisement" },
      { id: "radio", label: "Mettre la radio du tunnel" },
      { id: "gap", label: "Allonger la distance devant" },
    ],
    sequence: ["glasses", "lights", "radio", "gap"],
    hint: "Tout se prépare avant l'entrée. À l'intérieur il est trop tard pour chercher un bouton.",
    retry:
      "Pas encore. Commence par ce qui te rend la vue au moment où la lumière tombe.",
    success: "Entrée de tunnel préparée.",
    why: "Tes yeux mettent plusieurs secondes à s'adapter au noir. Pendant ce temps tu roules sans rien voir, et la distance devant toi est la seule marge qui te reste.",
    transfer:
      "Au prochain tunnel, allume tes feux avant l'entrée et pas une fois dedans.",
  },
  {
    ...commun,
    id: "c3f-tunnel-arret",
    competence: "C3f",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Bloqué sous la montagne",
    objective: "Réagir à un arrêt long dans un tunnel.",
    prompt:
      "Le trafic s'arrête dans le tunnel et ne repart pas. Tu fais quoi ?",
    visual: "tunnel",
    choices: [
      { id: "uturn", label: "Tu fais demi-tour pour revenir vers l'entrée" },
      {
        id: "hazard",
        label: "Feux de détresse puis moteur coupé et radio",
      },
      { id: "idle", label: "Tu attends moteur tournant sans rien changer" },
    ],
    solution: "hazard",
    hint: "Dans un tunnel, l'air et la visibilité comptent autant que la circulation.",
    retry:
      "Cette réaction met les autres en danger ou remplit le tunnel de gaz d'échappement.",
    success: "Détresse allumée, moteur coupé, radio branchée.",
    why: "Un demi-tour dans un tunnel envoie une voiture à contresens dans un espace sans échappatoire. Les feux de détresse préviennent ceux qui arrivent, et le moteur coupé garde l'air respirable.",
    transfer:
      "Au prochain tunnel, repère la fréquence radio affichée à l'entrée.",
  },
  {
    ...commun,
    id: "c3g-masque",
    competence: "C3g",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "spot",
    modeLabel: "Trouver",
    title: "Ce que le véhicule cache",
    objective: "Regarder l'endroit d'où un piéton peut surgir.",
    prompt:
      "Un véhicule est arrêté à droite. Touche l'endroit d'où quelqu'un peut sortir sans te voir.",
    visual: "intersection",
    hotspots: [
      {
        id: "front",
        label: "Devant le véhicule arrêté",
        x: 6,
        y: 40,
        w: 24,
        h: 14,
      },
      { id: "sky", label: "Le ciel", x: 35, y: 4, w: 27, h: 18 },
      { id: "lane", label: "Le milieu de ta voie", x: 35, y: 64, w: 28, h: 30 },
      { id: "roof", label: "Le toit du bâtiment", x: 68, y: 8, w: 24, h: 18 },
    ],
    solution: "front",
    hint: "Quelqu'un qui traverse devant un véhicule arrêté ne te voit pas, et toi non plus.",
    retry:
      "Rien ne peut surgir de là. Cherche l'endroit que le véhicule arrêté te cache.",
    success: "Zone masquée repérée avant d'arriver dessus.",
    why: "Un véhicule arrêté est un mur : il cache un piéton jusqu'au dernier instant. Ralentir et décaler son regard devant lui est la seule façon de gagner du temps.",
    transfer:
      "En ville, ralentis à chaque véhicule arrêté et regarde sous sa carrosserie s'il y a des pieds.",
  },
  {
    ...commun,
    id: "c3g-carrefour-bouche",
    competence: "C3g",
    order: 2,
    boites: ["manuelle", "auto"],
    mode: "decision",
    modeLabel: "Décider",
    title: "Vert mais bouché",
    objective: "Ne pas bloquer un carrefour qu'on ne peut pas dégager.",
    prompt:
      "Ton feu passe au vert, mais la file d'en face n'avance pas. Tu t'engages ?",
    visual: "city-light",
    choices: [
      { id: "go", label: "Oui puisque ton feu est passé au vert" },
      {
        id: "wait",
        label: "Non tu attends d'avoir la place de ressortir derrière",
      },
      { id: "half", label: "Tu avances au milieu pour prendre ta place" },
    ],
    solution: "wait",
    hint: "Un feu vert autorise à passer. Il ne promet pas qu'il y a de la place de l'autre côté.",
    retry:
      "Cette manœuvre te laisse en travers du carrefour quand les autres passeront au vert.",
    success: "Carrefour laissé libre.",
    why: "S'engager sans pouvoir dégager bloque tous les autres et te met en travers de leur passage. Le feu vert n'y change rien.",
    transfer:
      "À ton prochain feu vert en ville dense, vérifie la sortie avant d'avancer.",
  },
  {
    ...commun,
    id: "c3g-balayage",
    competence: "C3g",
    order: 3,
    boites: ["manuelle", "auto"],
    mode: "balayage",
    modeLabel: "Balayer",
    title: "La rue qui cache du monde",
    objective: "Trouver la zone masquée d'où quelqu'un peut sortir.",
    prompt: "Balaye la rue, puis touche l'endroit d'où le danger peut sortir.",
    visual: "rue-bus",
    indices: [
      { id: "bus", label: "Bus à l'arrêt", x: 80, y: 45 },
      { id: "terrasse", label: "Terrasse de café", x: 14, y: 50 },
      { id: "velo", label: "Vélo attaché", x: 23, y: 76 },
    ],
    solution: "bus",
    hint: "Cherche ce qui cache quelqu'un debout, pas ce qui l'occupe assis.",
    retry:
      "Ça remplit la rue sans rien masquer de ta trajectoire. Cherche ce qui bouche la vue.",
    success: "Un bus à l'arrêt. On traverse devant, sans regarder.",
    why: "En ville dense, le danger n'est presque jamais visible : il est derrière quelque chose. Un bus à l'arrêt masque les piétons qui le contournent par l'avant, et eux ne te voient pas non plus.",
    transfer:
      "Au prochain bus arrêté que tu croises, ralentis et décale-toi avant d'arriver à sa hauteur.",
  },
];

export const MODE_INFO = {
  spot: {
    label: "Trouver",
    description: "Repère spatial et rappel actif",
  },
  decision: {
    label: "Décider",
    description: "Choix et conséquence immédiate",
  },
  sequence: {
    label: "Ordonner",
    description: "Chaîne de gestes à reconstruire",
  },
  trajectory: {
    label: "Tracer",
    description: "Lecture et choix de trajectoire",
  },
  diagnostic: {
    label: "Diagnostiquer",
    description: "Symptôme, cause et réparation",
  },
  placement: {
    label: "Placer",
    description: "Position spatiale par glissement",
  },
};

/**
 * Les missions d'une compétence, dans l'ordre, filtrées par boîte.
 * @param {string} code ex. "C1a"
 * @param {'manuelle'|'auto'|null} boite null = on ne filtre pas
 */
export function missionsPour(code, boite) {
  if (!code) return [];
  const cle = String(code).trim();
  return MISSIONS.filter(
    (m) => m.competence === cle && (!boite || m.boites.includes(boite)),
  ).sort((a, b) => a.order - b.order);
}

/** Les compétences qui ont au moins une mission. */
export function competencesAvecMission() {
  return [...new Set(MISSIONS.map((m) => m.competence))];
}
