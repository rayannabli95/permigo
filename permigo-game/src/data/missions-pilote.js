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
    visual: "start-manual",
    steps: [
      { id: "clutch", label: "Embrayage à fond", symbol: "1" },
      { id: "gear", label: "Passer la 1re", symbol: "H" },
      { id: "bite", label: "Trouver le patinage", symbol: "≈" },
      { id: "gas", label: "Ajouter un filet de gaz", symbol: "+" },
      { id: "handbrake", label: "Desserrer le frein à main", symbol: "P" },
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
    visual: "start-automatic",
    steps: [
      { id: "brake", label: "Pied droit sur le frein", symbol: "●" },
      { id: "drive", label: "Sélecteur sur D", symbol: "D" },
      { id: "observe", label: "Contrôler autour", symbol: "◉" },
      { id: "release", label: "Relâcher doucement le frein", symbol: "↗" },
      { id: "gas", label: "Accélérer progressivement", symbol: "+" },
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
    visual: "warning",
    symptom:
      "Un témoin rouge reste visible après le contrôle du tableau de bord.",
    choices: [
      { id: "wait", label: "Partir doucement et surveiller plus tard" },
      { id: "signal", label: "Ne pas partir et le signaler" },
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
      { id: "accelerate", label: "Accélérer immédiatement vers la sortie" },
      {
        id: "check-signal",
        label: "Contrôler, puis mettre le clignotant droit",
      },
      { id: "stop", label: "S’arrêter sur l’anneau" },
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
        label: "Couper vers la ligne centrale",
        className: "path-cut",
      },
      {
        id: "safe",
        label: "Suivre sa voie et regarder la sortie",
        className: "path-safe",
      },
      { id: "edge", label: "Longer le bord extérieur", className: "path-edge" },
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
      { id: "brake", label: "Freiner fort", symbol: "!" },
      { id: "hold", label: "Garder le frein enfoncé", symbol: "●" },
      { id: "escape", label: "Regarder l’échappatoire", symbol: "◉" },
      { id: "clutch", label: "Débrayer ensuite", symbol: "1" },
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
      { id: "brake", label: "Freiner fort du pied droit", symbol: "!" },
      { id: "hold", label: "Garder le frein enfoncé", symbol: "●" },
      { id: "escape", label: "Regarder l’échappatoire", symbol: "◉" },
      { id: "steer", label: "Diriger si nécessaire", symbol: "↗" },
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
      { id: "reverse", label: "Reculer prudemment vers la sortie" },
      { id: "stop", label: "M’arrêter pour recalculer" },
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
      { id: "lift", label: "Lever le pied et laisser ralentir" },
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
];

export const MODE_INFO = {
  spot: {
    label: "Trouver",
    description: "Repère spatial et rappel actif",
    symbol: "◎",
  },
  decision: {
    label: "Décider",
    description: "Choix et conséquence immédiate",
    symbol: "◇",
  },
  sequence: {
    label: "Ordonner",
    description: "Chaîne de gestes à reconstruire",
    symbol: "≡",
  },
  trajectory: {
    label: "Tracer",
    description: "Lecture et choix de trajectoire",
    symbol: "↝",
  },
  diagnostic: {
    label: "Diagnostiquer",
    description: "Symptôme, cause et réparation",
    symbol: "△",
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
