// ═══════════════════════════════════════════════════════════════
// LE LABO DE LA CONDUITE — presets (données pures, zéro rendu).
//
// Une compétence = un objet ici. Le moteur (engine.js) sait déjà tout
// afficher : ajouter un exercice, c'est ajouter une entrée dans PRESETS,
// pas écrire du code.
//
// Deux décors possibles (`scene`) :
//
//   "cockpit" — vue depuis le siège conducteur. L'élève repère des zones
//               (rétroviseurs, angle mort, pédales…) puis refait le geste
//               dans le bon ordre.
//     zones[] : { id, label, aide, at:{x,y} }   x/y en % du décor
//     ordre[] : les ids dans l'ordre attendu
//
//   "route"   — vue de dessus isométrique. Le décor est celui du mini-jeu
//               « En situation » : le preset décrit son `plateau` EXACTEMENT
//               comme une scène de src/data/situations-conduite.js, et le
//               moteur de src/components/eleve/situation-scene.js le dessine.
//               Rien à redessiner, et l'élève retrouve un décor qu'il connaît.
//     plateau : { kind, signal?, passage?, pieton?, arbres?, vehicules[] }
//     alt     : description de la scène pour lecteur d'écran
//     reponse : l'id du véhicule qui passe en premier
//     focus   : { veh } — qui recevoir le halo doré une fois trouvé
//     regle   : la règle de circulation rappelée après la réponse
//
// Champs communs : titre, intro, consigne, explication, phraseMoniteur,
// motCle. Tous en { fr, en, ar } — le moteur retombe sur `fr` si une
// langue manque, donc un preset partiellement traduit reste utilisable.
// ═══════════════════════════════════════════════════════════════

export const LANGUES = {
  fr: { code: "fr", label: "FR", nom: "Français", dir: "ltr" },
  en: { code: "en", label: "EN", nom: "English", dir: "ltr" },
  ar: { code: "ar", label: "AR", nom: "العربية", dir: "rtl" },
};

export const PRESETS = [
  // ─── COCKPIT ──────────────────────────────────────────────────
  {
    id: "angle-mort",
    competence: "C1a",
    scene: "cockpit",
    titre: {
      fr: "Contrôler les rétroviseurs et l’angle mort",
      en: "Check the mirrors and blind spot",
      ar: "التحقّق من المرايا والنقطة العمياء",
    },
    intro: {
      fr: "Un geste, puis la route s’ouvre.",
      en: "One gesture, then the road opens.",
      ar: "خطوة واحدة، ثم ينفتح الطريق.",
    },
    consigne: {
      fr: "Touche les zones dans le bon ordre.",
      en: "Tap the areas in the correct order.",
      ar: "اضغط على المناطق بالترتيب الصحيح",
    },
    explication: {
      fr: "Avant de changer de direction, vérifie les rétroviseurs puis regarde brièvement derrière ton épaule.",
      en: "Before changing direction, check the mirrors and then briefly look over your shoulder.",
      ar: "قبل تغيير الاتجاه، تحقّق من المرايا ثم انظر بسرعة خلف كتفك.",
    },
    phraseMoniteur: {
      fr: "Contrôle ton angle mort.",
      en: "Check your blind spot.",
      ar: "تحقّق من النقطة العمياء.",
    },
    motCle: { fr: "angle mort", en: "blind spot", ar: "النقطة العمياء" },
    // Séquence du déboîtement, voiture à conduite à gauche : rétroviseur
    // intérieur, puis rétroviseur extérieur GAUCHE, puis coup d'œil par-dessus
    // l'épaule GAUCHE. Les trois zones sont donc du même côté que le
    // conducteur : c'est ce qu'il fait vraiment.
    ordre: ["retroInterieur", "retroExterieur", "angleMort"],
    zones: [
      {
        id: "retroInterieur",
        at: { x: 50, y: 12 },
        icone: "retro-int",
        label: {
          fr: "Rétroviseur intérieur",
          en: "Interior mirror",
          ar: "المرآة الداخلية",
        },
        aide: {
          fr: "Commence par regarder ce qui se passe derrière toi.",
          en: "Start by checking what is happening behind you.",
          ar: "ابدأ بالنظر إلى ما يحدث خلفك.",
        },
      },
      {
        id: "retroExterieur",
        at: { x: 12, y: 56 },
        icone: "retro-ext",
        label: {
          fr: "Rétroviseur extérieur",
          en: "Exterior mirror",
          ar: "المرآة الخارجية",
        },
        aide: {
          fr: "Puis vérifie le côté de ta voiture.",
          en: "Then check the side of your car.",
          ar: "ثم تحقّق من جانب سيارتك.",
        },
      },
      {
        id: "angleMort",
        at: { x: 13, y: 86 },
        icone: "epaule",
        label: { fr: "Angle mort", en: "Blind spot", ar: "النقطة العمياء" },
        aide: {
          fr: "Termine par un regard bref derrière ton épaule.",
          en: "Finish with a brief look over your shoulder.",
          ar: "اختم بنظرة سريعة خلف كتفك.",
        },
      },
    ],
  },

  // ─── VUE ROUTE ────────────────────────────────────────────────
  {
    id: "priorite-a-droite",
    competence: "C2d",
    scene: "route",
    alt: {
      fr: "Croisement sans panneau ni feu. Une voiture rouge arrive par ta droite.",
      en: "Junction with no sign and no lights. A red car is coming from your right.",
      ar: "تقاطع بلا لافتة ولا إشارة. سيارة حمراء تأتي عن يمينك.",
    },
    titre: {
      fr: "La priorité à droite",
      en: "Priority to the right",
      ar: "أولوية اليمين",
    },
    intro: {
      fr: "Un carrefour sans panneau. Qui passe ?",
      en: "A junction with no sign. Who goes first?",
      ar: "تقاطع بلا لافتة. من يمرّ أولاً؟",
    },
    consigne: {
      fr: "Touche la voiture qui passe en premier.",
      en: "Tap the car that goes first.",
      ar: "اضغط على السيارة التي تمرّ أولاً.",
    },
    explication: {
      fr: "Aucun panneau, aucun marquage : c’est la priorité à droite. Tu laisses passer celui qui arrive sur ta droite.",
      en: "No sign, no marking: priority goes to the right. You let through whoever comes from your right.",
      ar: "لا لافتة ولا علامات: الأولوية لليمين. اترك من يأتي عن يمينك يمرّ.",
    },
    phraseMoniteur: {
      fr: "Tu as une priorité à droite, là.",
      en: "You have a priority to the right here.",
      ar: "لديك أولوية لليمين هنا.",
    },
    motCle: {
      fr: "priorité à droite",
      en: "priority to the right",
      ar: "أولوية اليمين",
    },
    etiquette: { fr: "Toi", en: "You", ar: "أنت" },
    plateau: {
      kind: "croisement",
      arbres: [
        [-2.6, 2.3],
        [2.7, -2.5],
      ],
      vehicules: [
        { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
        { id: "v1", at: "E", d: 1.75, couleur: "rouge" },
      ],
    },
    reponse: "v1",
    focus: { veh: "v1" },
    regle: {
      fr: "La voiture rouge arrive sur ta droite : elle passe avant toi.",
      en: "The red car comes from your right: it goes before you.",
      ar: "السيارة الحمراء تأتي عن يمينك: تمرّ قبلك.",
    },
  },
];

export function getPreset(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}
