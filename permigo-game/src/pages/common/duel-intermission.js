/**
 * La bibliothèque de messages de l'entracte du duel.
 *
 * Cinquante messages, tirés au sort entre deux manches. Chacun tient en un
 * MOT (celui qui remplit l'écran) et une phrase courte (le bénéfice).
 *
 * ⚠️ Ce ne sont PAS des traductions mot à mot. Chaque langue a sa propre
 * formulation : l'anglais parle de « driving test » et de « motorway », pas
 * de la version anglaise du vocabulaire français ; l'arabe est écrit pour
 * être lu à voix haute, pas décalqué. Quand tu ajoutes un message, écris-le
 * dans les trois langues comme si tu l'écrivais pour quelqu'un de là-bas.
 *
 * Règles d'écriture (CLAUDE.md) : zéro tiret, zéro virgule dans ces textes
 * courts. Deux idées = deux phrases. Une énumération prend le point médian.
 */

// Chaque entrée : { mot: {fr,en,ar}, ligne: {fr,en,ar} }
export const MESSAGES = [
  {
    mot: { fr: "Confiance", en: "Confidence", ar: "ثقة" },
    ligne: {
      fr: "Tu montes sans stress.",
      en: "You get in the car calm.",
      ar: "تركب السيارة بهدوء.",
    },
  },
  {
    mot: { fr: "Prêt", en: "Ready", ar: "جاهز" },
    ligne: {
      fr: "Tu sais ce qui t'attend.",
      en: "You know what's coming.",
      ar: "تعرف ما ينتظرك.",
    },
  },
  {
    mot: { fr: "Régularité", en: "Routine", ar: "مواظبة" },
    ligne: {
      fr: "Dix minutes par jour suffisent.",
      en: "Ten minutes a day is enough.",
      ar: "عشر دقائق كل يوم تكفي.",
    },
  },
  {
    mot: { fr: "Anticiper", en: "Anticipate", ar: "استباق" },
    ligne: {
      fr: "Tu vois le danger avant lui.",
      en: "You see the risk coming.",
      ar: "ترى الخطر قبل أن يصل.",
    },
  },
  {
    mot: { fr: "Calme", en: "Calm", ar: "هدوء" },
    ligne: {
      fr: "Le stress descend d'un cran.",
      en: "Your nerves settle.",
      ar: "يهدأ توترك درجة.",
    },
  },
  {
    mot: { fr: "Réflexes", en: "Reflexes", ar: "ردود الفعل" },
    ligne: {
      fr: "Ton pied sait quoi faire.",
      en: "Your foot knows what to do.",
      ar: "قدمك تعرف ما تفعل.",
    },
  },
  {
    mot: { fr: "Progrès", en: "Progress", ar: "تحسّن" },
    ligne: {
      fr: "Chaque leçon compte double.",
      en: "Every lesson counts double.",
      ar: "كل درس يساوي درسين.",
    },
  },
  {
    mot: { fr: "Maîtrise", en: "Mastery", ar: "إتقان" },
    ligne: {
      fr: "La voiture t'obéit enfin.",
      en: "The car finally listens.",
      ar: "السيارة تستجيب لك أخيرًا.",
    },
  },
  {
    mot: { fr: "Clarté", en: "Clarity", ar: "وضوح" },
    ligne: {
      fr: "Plus de doute au volant.",
      en: "No more second guessing.",
      ar: "لا مزيد من التردد خلف المقود.",
    },
  },
  {
    mot: { fr: "Focus", en: "Focus", ar: "تركيز" },
    ligne: {
      fr: "Vingt minutes valent deux heures.",
      en: "Twenty minutes beat two hours.",
      ar: "عشرون دقيقة تعادل ساعتين.",
    },
  },
  {
    mot: { fr: "Mémoire", en: "Memory", ar: "ذاكرة" },
    ligne: {
      fr: "Tu retiens sans réviser.",
      en: "It sticks without cramming.",
      ar: "تحفظ دون مراجعة.",
    },
  },
  {
    mot: { fr: "Habitude", en: "Habit", ar: "عادة" },
    ligne: {
      fr: "Le bon geste devient automatique.",
      en: "The right move becomes automatic.",
      ar: "تصبح الحركة الصحيحة تلقائية.",
    },
  },
  {
    mot: { fr: "Sérénité", en: "Ease", ar: "طمأنينة" },
    ligne: {
      fr: "Tu conduis sans y penser.",
      en: "You drive without thinking.",
      ar: "تقود دون تفكير.",
    },
  },
  {
    mot: { fr: "Précision", en: "Precision", ar: "دقّة" },
    ligne: {
      fr: "Tes trajectoires se resserrent.",
      en: "Your lines get tighter.",
      ar: "تصبح مساراتك أدق.",
    },
  },
  {
    mot: { fr: "Sécurité", en: "Safety", ar: "أمان" },
    ligne: {
      fr: "Tes passagers le sentent.",
      en: "Your passengers feel it.",
      ar: "يشعر بها ركابك.",
    },
  },
  {
    mot: { fr: "Autonomie", en: "Independence", ar: "استقلالية" },
    ligne: {
      fr: "Plus besoin qu'on te dise.",
      en: "Nobody has to tell you.",
      ar: "لا أحد يحتاج أن يخبرك.",
    },
  },
  {
    mot: { fr: "Réussite", en: "Success", ar: "نجاح" },
    ligne: {
      fr: "Le jour J devient une formalité.",
      en: "Test day becomes a formality.",
      ar: "يوم الامتحان يصبح إجراءً عاديًا.",
    },
  },
  {
    mot: { fr: "Constance", en: "Consistency", ar: "ثبات" },
    ligne: {
      fr: "Deux fautes de moins par leçon.",
      en: "Two mistakes fewer each lesson.",
      ar: "خطآن أقل في كل درس.",
    },
  },
  {
    mot: { fr: "Lucidité", en: "Awareness", ar: "إدراك" },
    ligne: {
      fr: "Tu lis la route comme un livre.",
      en: "You read the road like a book.",
      ar: "تقرأ الطريق كأنه كتاب.",
    },
  },
  {
    mot: { fr: "Timing", en: "Timing", ar: "توقيت" },
    ligne: {
      fr: "Tu pars au bon moment.",
      en: "You go at the right moment.",
      ar: "تنطلق في اللحظة المناسبة.",
    },
  },
  {
    mot: { fr: "Angles morts", en: "Blind spots", ar: "النقاط العمياء" },
    ligne: {
      fr: "Ce que tu ne vois pas coûte cher.",
      en: "What you miss costs the most.",
      ar: "ما لا تراه يكلفك كثيرًا.",
    },
  },
  {
    mot: { fr: "Priorités", en: "Right of way", ar: "أولوية المرور" },
    ligne: {
      fr: "Tu ne cèdes plus au hasard.",
      en: "You stop guessing who goes first.",
      ar: "لم تعد تتنازل عشوائيًا.",
    },
  },
  {
    mot: { fr: "Créneau", en: "Parallel park", ar: "الركن الجانبي" },
    ligne: {
      fr: "Trois manœuvres et c'est plié.",
      en: "Three moves and you're in.",
      ar: "ثلاث حركات وينتهي الأمر.",
    },
  },
  {
    mot: { fr: "Giratoire", en: "Roundabout", ar: "الدوّار" },
    ligne: {
      fr: "Tu sors où tu voulais.",
      en: "You leave where you meant to.",
      ar: "تخرج من حيث أردت.",
    },
  },
  {
    mot: { fr: "Rétroviseurs", en: "Mirrors", ar: "المرايا" },
    ligne: {
      fr: "Un coup d'œil change tout.",
      en: "One glance changes everything.",
      ar: "نظرة واحدة تغيّر كل شيء.",
    },
  },
  {
    mot: { fr: "Distance", en: "Distance", ar: "مسافة الأمان" },
    ligne: {
      fr: "Deux secondes te sauvent.",
      en: "Two seconds save you.",
      ar: "ثانيتان تنقذانك.",
    },
  },
  {
    mot: { fr: "Allure", en: "Speed", ar: "السرعة" },
    ligne: {
      fr: "La bonne vitesse au bon endroit.",
      en: "The right pace in the right place.",
      ar: "السرعة المناسبة في المكان المناسب.",
    },
  },
  {
    mot: { fr: "Nuit", en: "Night", ar: "الليل" },
    ligne: {
      fr: "Tu vois plus loin que tes phares.",
      en: "You see past your headlights.",
      ar: "ترى أبعد من أضوائك.",
    },
  },
  {
    mot: { fr: "Pluie", en: "Rain", ar: "المطر" },
    ligne: {
      fr: "La route glisse. Toi non.",
      en: "The road slips. You don't.",
      ar: "الطريق زلق وأنت ثابت.",
    },
  },
  {
    mot: { fr: "Ville", en: "City", ar: "المدينة" },
    ligne: {
      fr: "Le trafic ne te surprend plus.",
      en: "Traffic stops surprising you.",
      ar: "لم تعد الزحمة تفاجئك.",
    },
  },
  {
    mot: { fr: "Autoroute", en: "Motorway", ar: "الطريق السريع" },
    ligne: {
      fr: "Tu t'insères sans hésiter.",
      en: "You merge without hesitating.",
      ar: "تندمج دون تردد.",
    },
  },
  {
    mot: { fr: "Démarrage", en: "Hill start", ar: "الانطلاق" },
    ligne: {
      fr: "Plus jamais de recul en côte.",
      en: "No more rolling back on a hill.",
      ar: "لا تراجع في المرتفع بعد اليوم.",
    },
  },
  {
    mot: { fr: "Freinage", en: "Braking", ar: "الفرملة" },
    ligne: {
      fr: "Tu t'arrêtes pile où il faut.",
      en: "You stop exactly where you meant.",
      ar: "تتوقف تمامًا حيث يجب.",
    },
  },
  {
    mot: { fr: "Observation", en: "Scanning", ar: "الملاحظة" },
    ligne: {
      fr: "Tes yeux bougent avant tes mains.",
      en: "Your eyes move before your hands.",
      ar: "عيناك تسبقان يديك.",
    },
  },
  {
    mot: { fr: "Décision", en: "Decision", ar: "القرار" },
    ligne: {
      fr: "Une seconde suffit pour choisir.",
      en: "One second is enough to choose.",
      ar: "ثانية واحدة تكفي للاختيار.",
    },
  },
  {
    mot: { fr: "Sang froid", en: "Cool head", ar: "رباطة الجأش" },
    ligne: {
      fr: "L'imprévu ne te fait plus peur.",
      en: "The unexpected stops scaring you.",
      ar: "لم يعد المفاجئ يخيفك.",
    },
  },
  {
    mot: { fr: "Jour J", en: "Test day", ar: "يوم الامتحان" },
    ligne: {
      fr: "Tu arrives en terrain connu.",
      en: "You arrive on familiar ground.",
      ar: "تصل إلى أرض تعرفها.",
    },
  },
  {
    mot: { fr: "Examinateur", en: "Examiner", ar: "الفاحص" },
    ligne: {
      fr: "Il voit que tu es préparé.",
      en: "They can tell you prepared.",
      ar: "يرى أنك مستعد.",
    },
  },
  {
    mot: { fr: "Liberté", en: "Freedom", ar: "حرية" },
    ligne: {
      fr: "La route t'appartient enfin.",
      en: "The road is finally yours.",
      ar: "الطريق لك أخيرًا.",
    },
  },
  {
    mot: { fr: "Volant", en: "The wheel", ar: "المقود" },
    ligne: {
      fr: "Tes mains savent où aller.",
      en: "Your hands know where to go.",
      ar: "يداك تعرفان أين تذهبان.",
    },
  },
  {
    mot: { fr: "Erreur", en: "Mistake", ar: "الخطأ" },
    ligne: {
      fr: "Comprise une fois elle ne revient plus.",
      en: "Understood once it never comes back.",
      ar: "إذا فهمته مرة لا يعود.",
    },
  },
  {
    mot: { fr: "Répétition", en: "Repetition", ar: "التكرار" },
    ligne: {
      fr: "Trois fois et c'est acquis.",
      en: "Three times and it sticks.",
      ar: "ثلاث مرات ويثبت.",
    },
  },
  {
    mot: { fr: "Détail", en: "Detail", ar: "التفصيل" },
    ligne: {
      fr: "Le petit geste qui rassure.",
      en: "The small move that reassures.",
      ar: "الحركة الصغيرة التي تطمئن.",
    },
  },
  {
    mot: { fr: "Élan", en: "Momentum", ar: "الاندفاع" },
    ligne: {
      fr: "Tu ne cales plus en chemin.",
      en: "You stop stalling halfway.",
      ar: "لم تعد تتوقف في منتصف الطريق.",
    },
  },
  {
    mot: { fr: "Patience", en: "Patience", ar: "الصبر" },
    ligne: {
      fr: "Attendre est parfois la bonne réponse.",
      en: "Waiting is sometimes the right answer.",
      ar: "الانتظار أحيانًا هو الجواب الصحيح.",
    },
  },
  {
    mot: { fr: "Courtoisie", en: "Courtesy", ar: "اللباقة" },
    ligne: {
      fr: "Un merci coûte zéro seconde.",
      en: "A thank you costs zero seconds.",
      ar: "كلمة شكر لا تكلف ثانية.",
    },
  },
  {
    mot: { fr: "Souplesse", en: "Smoothness", ar: "السلاسة" },
    ligne: {
      fr: "Conduire souple fatigue moins.",
      en: "Smooth driving tires you less.",
      ar: "القيادة السلسة تتعب أقل.",
    },
  },
  {
    mot: { fr: "Partage", en: "Sharing", ar: "المشاركة" },
    ligne: {
      fr: "Cycliste · piéton · bus. Tu vois tout.",
      en: "Cyclists · walkers · buses. You see them.",
      ar: "دراجات · مشاة · حافلات. تراهم جميعًا.",
    },
  },
  {
    mot: { fr: "Débrief", en: "Debrief", ar: "المراجعة" },
    ligne: {
      fr: "Cinq minutes après la leçon.",
      en: "Five minutes after the lesson.",
      ar: "خمس دقائق بعد الدرس.",
    },
  },
  {
    mot: { fr: "Avance", en: "Ahead", ar: "سبق" },
    ligne: {
      fr: "Tu arrives en sachant déjà.",
      en: "You arrive already knowing.",
      ar: "تصل وأنت تعرف مسبقًا.",
    },
  },
];

const LS_VUS = "permigo.duel.entractes";

// Le tirage sans répétition. On garde en mémoire les messages déjà vus et on
// pioche dans le reste : sur une soirée entière, personne ne revoit deux fois
// le même écran. Quand les cinquante sont passés, on repart de zéro en
// excluant le dernier vu, pour ne pas l'enchaîner avec lui-même.
export function prochainMessage(lang = "fr") {
  let vus = [];
  try {
    const brut = localStorage.getItem(LS_VUS);
    if (brut) vus = JSON.parse(brut);
    if (!Array.isArray(vus)) vus = [];
  } catch {
    /* navigation privée : on tire au hasard, sans mémoire */
    vus = [];
  }

  const dernier = vus.length ? vus[vus.length - 1] : -1;
  let dispo = MESSAGES.map((_, i) => i).filter((i) => !vus.includes(i));
  if (!dispo.length) {
    vus = [];
    dispo = MESSAGES.map((_, i) => i).filter((i) => i !== dernier);
  }

  const idx = dispo[Math.floor(Math.random() * dispo.length)];
  vus.push(idx);
  try {
    localStorage.setItem(LS_VUS, JSON.stringify(vus));
  } catch {
    /* rien à mémoriser en navigation privée */
  }

  const m = MESSAGES[idx];
  return {
    index: idx,
    mot: m.mot[lang] || m.mot.fr,
    ligne: m.ligne[lang] || m.ligne.fr,
  };
}
