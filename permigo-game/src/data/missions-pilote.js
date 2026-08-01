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
      { id: "clutch", label: "Embrayage à fond", symbol: "↓" },
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
      { id: "clutch", label: "Débrayer ensuite", symbol: "↓" },
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
      { id: "siege", label: "Avancer le siège", symbol: "▭" },
      { id: "dossier", label: "Régler le dossier", symbol: "◺" },
      { id: "appui", label: "Monter l'appui-tête", symbol: "◠" },
      { id: "ceinture", label: "Boucler la ceinture", symbol: "⌇" },
      { id: "retros", label: "Régler les rétroviseurs", symbol: "▱" },
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
      { id: "cou", label: "Contre le cou" },
      { id: "bras", label: "Sous le bras" },
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
      { id: "haut", label: "En haut, une de chaque côté" },
      { id: "bas", label: "En bas, réunies" },
      { id: "une", label: "Une seule main tout en haut" },
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
      { id: "regard", label: "Tu regardes le bord au lieu de la sortie" },
      { id: "volant", label: "Ton volant est trop dur" },
      { id: "vitesse", label: "Tu roules trop lentement" },
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
      { id: "relacher", label: "Tu gardes la même pression jusqu'à l'arrêt" },
      { id: "tot", label: "Tu freines trop tôt" },
      { id: "freins", label: "Tes freins sont trop puissants" },
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
      { id: "arret", label: "Tu ralentis et tu t'arrêtes avant la ligne" },
      { id: "passe", label: "Tu accélères pour passer" },
      { id: "pile", label: "Tu pile sur place" },
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
    visual: "start-manual",
    steps: [
      { id: "lever", label: "Lever le pied du gaz", symbol: "↑" },
      { id: "debrayer", label: "Débrayer à fond", symbol: "↓" },
      { id: "passer", label: "Passer le rapport", symbol: "H" },
      { id: "relacher", label: "Relâcher l'embrayage", symbol: "≈" },
      { id: "gaz", label: "Reprendre du gaz", symbol: "+" },
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
    visual: "warning",
    symptom:
      "Tu es en quatrième à trente à l'heure. Le moteur vibre et tu n'as plus de reprise.",
    choices: [
      {
        id: "descendre",
        label: "Le rapport est trop grand, il faut descendre",
      },
      { id: "monter", label: "Le rapport est trop petit, il faut monter" },
      { id: "panne", label: "Le moteur est en panne" },
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
    visual: "start-automatic",
    choices: [
      { id: "reste", label: "Tu restes en D, le pied sur le frein" },
      { id: "park", label: "Tu passes en P" },
      { id: "neutre", label: "Tu passes en N à chaque arrêt" },
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
    visual: "start-automatic",
    choices: [
      { id: "fond", label: "Tu enfonces l'accélérateur jusqu'au bout" },
      { id: "leger", label: "Tu appuies doucement et tu attends" },
      { id: "manuel", label: "Tu passes le sélecteur sur N" },
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
    id: "c1g-pneu",
    competence: "C1g",
    order: 1,
    boites: ["manuelle", "auto"],
    mode: "diagnostic",
    modeLabel: "Diagnostiquer",
    title: "Avant même de monter",
    objective: "Repérer un défaut au tour de la voiture.",
    prompt: "Tu fais le tour de la voiture. Qu'est-ce qui cloche ?",
    visual: "exterior",
    symptom: "La voiture est garée devant toi, côté conducteur.",
    choices: [
      { id: "pneu", label: "Un pneu est affaissé" },
      { id: "vitre", label: "Une vitre est ouverte" },
      { id: "rien", label: "Rien, tout est normal" },
    ],
    solution: "pneu",
    hint: "Regarde la forme des roues, pas la carrosserie.",
    retry:
      "Regarde plus bas. Ce qui touche la route mérite le premier coup d'œil.",
    success: "Pneu affaissé repéré avant le départ.",
    why: "Un pneu sous-gonflé allonge le freinage et peut éclater. C'est le genre de chose qui se voit en trois secondes et qui ne se rattrape plus à cinquante à l'heure.",
    transfer:
      "Avant ta prochaine leçon, fais le tour de la voiture et regarde les quatre pneus un par un.",
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
      { id: "pneus", label: "Les pneus", symbol: "◍" },
      { id: "feux", label: "Les feux et clignotants", symbol: "☀" },
      { id: "vitres", label: "Vitres et rétroviseurs", symbol: "▭" },
      { id: "dessous", label: "Sous la voiture", symbol: "▽" },
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
        symbol: "▬",
      },
      {
        id: "reculer",
        label: "Reculer tout droit jusqu'au repère",
        symbol: "↓",
      },
      { id: "braquer", label: "Braquer vers la place", symbol: "↺" },
      { id: "contre", label: "Contre-braquer pour redresser", symbol: "↻" },
      { id: "placer", label: "Se replacer le long du trottoir", symbol: "▭" },
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
      { id: "reprendre", label: "Tu ressors et tu repars du début" },
      { id: "forcer", label: "Tu forces au volant en reculant" },
      { id: "abandonner", label: "Tu laisses la voiture en travers" },
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
      { id: "lance", label: "Tu regardes autour et tu te lances" },
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
