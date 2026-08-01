// ═══════════════════════════════════════════════════════════════
// Les mots de moniteur, expliqués.
//
// Audit du 01/08/2026 : « commodo », « patinage », « rétrograder » arrivent
// dans les fiches et dans les quiz de certification sans jamais être définis.
// Un élève arrivé en France il y a huit mois lit ça comme du chinois, et il
// le lit dans un écran qui va le certifier.
//
// Le mot est souligné dans la fiche, un tap ouvre la définition. Trois
// langues, comme le reste des fiches.
//
// Règle d'écriture : on dit CE QUE C'EST avec les mains, pas la définition
// du manuel. « Le point où l'embrayage commence à mordre » plutôt que
// « phase de transmission partielle du couple ».
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {{ mot: string, variantes?: string[], boite?: 'manuelle'|'auto',
 *   fr: string, en: {mot: string, def: string}, ar: {mot: string, def: string} }} Terme
 */

/** @type {Terme[]} */
export const GLOSSAIRE = [
  {
    id: "commodo",
    mot: "commodo",
    variantes: ["commodos"],
    fr: "Les deux manettes derrière le volant. Celle de gauche commande les clignotants et les phares, celle de droite les essuie-glaces.",
    en: {
      mot: "stalk",
      def: "The two levers behind the steering wheel. The left one works the indicators and the lights, the right one the wipers.",
    },
    ar: {
      mot: "العتلة",
      def: "العتلتان خلف المقود. اليسرى للغمّازات والأضواء، واليمنى للماسحات.",
    },
  },
  {
    id: "patinage",
    mot: "patinage",
    variantes: ["point de patinage", "zone de patinage"],
    boite: "manuelle",
    fr: "Le moment où l'embrayage commence à mordre et où la voiture veut avancer. Tu le sens : le moteur baisse un peu et la voiture frémit.",
    en: {
      mot: "biting point",
      def: "The moment the clutch starts to grip and the car wants to move. You feel it: the engine dips slightly and the car quivers.",
    },
    ar: {
      mot: "نقطة الالتقام",
      def: "اللحظة التي يبدأ فيها القابض بالإمساك وتريد السيارة التحرّك. تشعر بها: ينخفض صوت المحرك قليلًا وترتجّ السيارة.",
    },
  },
  {
    id: "retrograder",
    mot: "rétrograder",
    variantes: ["rétrogradage", "rétrograde", "rétrogrades"],
    boite: "manuelle",
    fr: "Descendre d'un rapport, passer de la 4e à la 3e par exemple. On le fait parce qu'on a déjà ralenti, pas pour ralentir.",
    en: {
      mot: "downshift",
      def: "Going down a gear, from 4th to 3rd for example. You do it because you have already slowed down, not in order to slow down.",
    },
    ar: {
      mot: "خفض السرعة",
      def: "النزول سرعة واحدة، من الرابعة إلى الثالثة مثلًا. تفعل ذلك لأنك أبطأت مسبقًا، لا لكي تبطئ.",
    },
  },
  {
    id: "frein-moteur",
    mot: "frein moteur",
    fr: "La voiture qui ralentit toute seule quand tu lèves le pied, sans toucher au frein. Gratuit, silencieux, et ça use moins les freins.",
    en: {
      mot: "engine braking",
      def: "The car slowing down on its own when you lift off, without touching the brake. Free, quiet, and easier on the brakes.",
    },
    ar: {
      mot: "فرملة المحرك",
      def: "تباطؤ السيارة وحدها عند رفع قدمك، دون لمس الفرامل. مجاني وهادئ ويُقلّل تآكل الفرامل.",
    },
  },
  {
    id: "point-mort",
    mot: "point mort",
    fr: "La position où le moteur tourne sans entraîner les roues. Le levier au milieu en boîte manuelle, la lettre N en automatique.",
    en: {
      mot: "neutral",
      def: "The position where the engine runs without driving the wheels. Lever in the middle on a manual, letter N on an automatic.",
    },
    ar: {
      mot: "الوضع المحايد",
      def: "الوضع الذي يدور فيه المحرك دون أن يدير العجلات. العصا في المنتصف في اليدوية، والحرف N في الأوتوماتيكية.",
    },
  },
  {
    id: "angle-mort",
    mot: "angle mort",
    variantes: ["angles morts"],
    fr: "La zone que tes rétroviseurs ne montrent pas, sur le côté et un peu en arrière. Une voiture entière peut y tenir. On la vérifie en tournant la tête.",
    en: {
      mot: "blind spot",
      def: "The area your mirrors don't show, to the side and slightly behind. A whole car fits in it. You check it by turning your head.",
    },
    ar: {
      mot: "النقطة العمياء",
      def: "المنطقة التي لا تُظهرها المرايا، إلى الجانب وقليلًا إلى الخلف. تتّسع لسيارة كاملة. تتحقّق منها بإدارة رأسك.",
    },
  },
  {
    id: "debrayer",
    mot: "débrayer",
    variantes: ["débraye", "débrayage", "débrayé"],
    boite: "manuelle",
    fr: "Enfoncer la pédale d'embrayage, celle de gauche. Ça coupe le lien entre le moteur et les roues.",
    en: {
      mot: "declutch",
      def: "Pressing the clutch pedal, the left one. It cuts the link between the engine and the wheels.",
    },
    ar: {
      mot: "فصل القابض",
      def: "الضغط على دواسة القابض، الدواسة اليسرى. هذا يفصل الاتصال بين المحرك والعجلات.",
    },
  },
  {
    id: "sous-regime",
    mot: "sous-régime",
    fr: "Un moteur qui tourne trop bas pour le rapport engagé. Il broute, il tousse, il n'a plus de force. Il faut descendre d'un rapport.",
    en: {
      mot: "labouring",
      def: "An engine turning too slowly for the gear you're in. It judders, it coughs, it has no pull left. Drop a gear.",
    },
    ar: {
      mot: "انخفاض الدوران",
      def: "محرك يدور ببطء شديد بالنسبة للسرعة المستعملة. يرتجّ ويسعل ولا تبقى له قوة. انزل سرعة واحدة.",
    },
  },
  {
    id: "fluage",
    mot: "fluage",
    boite: "auto",
    fr: "La voiture qui avance toute seule, au ralenti, quand tu lâches le frein sur D. Ça suffit souvent pour manœuvrer.",
    en: {
      mot: "creep",
      def: "The car moving forward on its own, at idle, when you release the brake in D. That's often enough to manoeuvre.",
    },
    ar: {
      mot: "الزحف",
      def: "تحرّك السيارة وحدها ببطء عند رفع قدمك عن الفرامل في وضع D. وغالبًا ما يكفي ذلك للمناورة.",
    },
  },
  {
    id: "kick-down",
    mot: "kick-down",
    boite: "auto",
    fr: "Pied à fond sur l'accélérateur : la boîte automatique descend d'un rapport toute seule pour te donner de la reprise.",
    en: {
      mot: "kick-down",
      def: "Flooring the accelerator: the automatic gearbox drops a gear by itself to give you pull.",
    },
    ar: {
      mot: "kick-down",
      def: "ضغط دواسة الوقود حتى النهاية: تنزل العلبة الأوتوماتيكية سرعة واحدة وحدها لتمنحك قوة دفع.",
    },
  },
  {
    id: "gabarit",
    mot: "gabarit",
    fr: "La place que prend ta voiture : sa largeur, sa longueur, et où sont ses quatre roues quand tu ne les vois pas.",
    en: {
      mot: "vehicle footprint",
      def: "The room your car takes up: its width, its length, and where its four wheels are when you can't see them.",
    },
    ar: {
      mot: "حجم السيارة",
      def: "المساحة التي تشغلها سيارتك: عرضها وطولها، وأين توجد عجلاتها الأربع حين لا تراها.",
    },
  },
  {
    id: "cedez-le-passage",
    mot: "céder le passage",
    variantes: ["cède le passage", "cédez le passage"],
    fr: "Laisser passer l'autre avant toi. Tu ralentis, et tu ne t'arrêtes que si c'est nécessaire. Ce n'est pas un stop.",
    en: {
      mot: "give way",
      def: "Letting the other driver go first. You slow down, and you only stop if you need to. It isn't a stop sign.",
    },
    ar: {
      mot: "إفساح الطريق",
      def: "ترك الآخر يمرّ قبلك. تبطئ، ولا تتوقّف إلا عند الحاجة. وهذه ليست علامة قف.",
    },
  },
];

/** Index par identifiant. */
const PAR_ID = new Map(GLOSSAIRE.map((t) => [t.id, t]));

/** @param {string} id */
export function terme(id) {
  return PAR_ID.get(id) || null;
}

/**
 * Les termes à repérer dans un texte, du plus long au plus court : sinon
 * « patinage » mangerait « point de patinage » et la définition tomberait
 * sur le mauvais mot.
 *
 * @param {'manuelle'|'auto'|null} boite on ne souligne pas « débrayer » à
 *   quelqu'un qui roule en automatique : le mot ne le concerne pas.
 */
export function termesAReperer(boite) {
  const sortie = [];
  for (const t of GLOSSAIRE) {
    if (t.boite && boite && t.boite !== boite) continue;
    for (const forme of [t.mot, ...(t.variantes || [])])
      sortie.push({ forme, t });
  }
  return sortie.sort((a, b) => b.forme.length - a.forme.length);
}
