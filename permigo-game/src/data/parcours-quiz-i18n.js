// ═══════════════════════════════════════════════════
// Traductions de l'EXAM BLANC (en / ar). Source FR = parcours-quiz.js.
// Recette identique à situations-i18n.js / fiches-i18n.js : on affiche la
// traduction AVEC le français gardé dessous (l'examen du code reste en français).
// L'arabe est RTL par span, l'app reste LTR. Généré par workflow (translate →
// verify bilingue), validé en dur (ids + longueurs d'options). NE PAS éditer main.
// ═══════════════════════════════════════════════════
import { getLang } from "@/utils/lang.js";

const EXAM_UI = {
 "en": {
  "qNum": "Question",
  "verdictOk": "Correct answer",
  "answerWas": "The correct answer was",
  "timeout": "Time's up",
  "faute": "In the real exam, this mistake is disqualifying. Better fix it here.",
  "next": "Next question →"
 },
 "ar": {
  "qNum": "سؤال",
  "verdictOk": "إجابة صحيحة",
  "answerWas": "الإجابة الصحيحة كانت",
  "timeout": "انتهى الوقت",
  "faute": "في الامتحان الحقيقي، هذا الخطأ يُقصيك. الأفضل تصحيحه هنا.",
  "next": "→ السؤال التالي"
 }
};

// clé = id de question (ex "p1q1") → { en:{enonce,options[],explication}, ar:{...} }
const EXAM_I18N = {
 "p1q1": {
  "en": {
   "enonce": "You arrive at a roundabout. Who goes first?",
   "options": [
    "Those entering the roundabout",
    "Those already in the roundabout",
    "Whoever comes from the right"
   ],
   "explication": "Those already inside have priority. You, entering, must give way — unless a sign says otherwise."
  },
  "ar": {
   "enonce": "تصل إلى دوّار. مَن يمرّ أولاً؟",
   "options": [
    "الداخلون إلى الدوّار",
    "الموجودون داخل الدوّار بالفعل",
    "القادم من جهة اليمين"
   ],
   "explication": "مَن هم داخل الدوّار بالفعل لهم الأولوية. أنت الداخل تتنازل عن المرور — إلا إذا دلّت لافتة على غير ذلك."
  }
 },
 "p1q2": {
  "en": {
   "enonce": "You're driving in a 30 zone. What's your maximum speed?",
   "options": [
    "20 km/h",
    "30 km/h",
    "50 km/h"
   ],
   "explication": "30 km/h everywhere in the zone, until the exit sign."
  },
  "ar": {
   "enonce": "تقود في منطقة سرعة 30. ما هي سرعتك القصوى؟",
   "options": [
    "20 km/h",
    "30 km/h",
    "50 km/h"
   ],
   "explication": "30 km/h في كل المنطقة، حتى لافتة الخروج."
  }
 },
 "p1q3": {
  "en": {
   "enonce": "You're about to reverse out in a parking lot. What do you do first?",
   "options": [
    "I pull out without looking, pedestrians will watch out",
    "I honk to warn people",
    "I check it's clear in every direction"
   ],
   "explication": "You check all around before moving: mirrors, blind spots, pedestrians, cyclists. Reversing without looking is an automatic fail."
  },
  "ar": {
   "enonce": "أنت على وشك الرجوع إلى الخلف في موقف سيارات. ماذا تفعل أولاً؟",
   "options": [
    "أنطلق دون أن أنظر، المشاة ينتبهون لأنفسهم",
    "أُطلق النفير للتنبيه",
    "أتأكد أن الطريق خالٍ من جميع الجهات"
   ],
   "explication": "تتحقق من كل الجهات قبل التحرك: المرايا، النقاط العمياء، المشاة، الدرّاجات. الرجوع إلى الخلف دون النظر خطأ مُقصٍ من الامتحان."
  }
 },
 "p1q4": {
  "en": {
   "enonce": "Two-way road. A car is parked on YOUR right and you meet an oncoming vehicle. Who gives way?",
   "options": [
    "The other driver, since he's on the parking side",
    "You, since the obstacle is on your side",
    "Both, by slowing down"
   ],
   "explication": "The obstacle is on your side, so you're the one who gives way. Simple rule: whoever has to pull out gives way."
  },
  "ar": {
   "enonce": "طريق باتجاهين. سيارة متوقفة على يمينك أنت وتلتقي بمركبة قادمة. مَن يتنازل عن المرور؟",
   "options": [
    "هو، لأنه في جهة التوقّف",
    "أنت، لأن العائق في جهتك",
    "كلاهما، بالتباطؤ"
   ],
   "explication": "العائق في جهتك، لذلك أنت مَن يفسح الطريق. قاعدة بسيطة: مَن يضطر إلى الانحراف يتنازل عن المرور."
  }
 },
 "p1q5": {
  "en": {
   "enonce": "You're entering a roundabout and see no give-way sign. What do you do?",
   "options": [
    "I enter carefully while speeding up",
    "I give way to those already going round",
    "I honk to signal my presence"
   ],
   "explication": "Even with no sign, you give way to those already in the roundabout. Forcing your way in is an automatic fail."
  },
  "ar": {
   "enonce": "تدخل إلى دوّار ولا ترى لافتة «افسح الطريق». ماذا تفعل؟",
   "options": [
    "أدخل بحذر مع زيادة السرعة",
    "أتنازل عن المرور لمن يسير داخله",
    "أُطلق النفير للإشارة إلى وجودي"
   ],
   "explication": "حتى بدون لافتة، تتنازل عن المرور لمن هم داخل الدوّار بالفعل. فرض المرور خطأ مُقصٍ من الامتحان."
  }
 },
 "p1q6": {
  "en": {
   "enonce": "To turn right, can you drive on a two-way cycle path?",
   "options": [
    "Yes, if it's wide",
    "Yes, just to cross it to turn",
    "No, it's forbidden"
   ],
   "explication": "You may cross it to turn, never drive along it. And you give way to cyclists — in BOTH directions, that's the trap with two-way cycle paths."
  },
  "ar": {
   "enonce": "لكي تنعطف يميناً، هل يمكنك القيادة على مسار درّاجات باتجاهين؟",
   "options": [
    "نعم، إذا كان عريضاً",
    "نعم، فقط لعبوره من أجل الانعطاف",
    "لا، هذا ممنوع"
   ],
   "explication": "يمكنك عبوره من أجل الانعطاف، لا السير عليه أبداً. وتتنازل عن المرور للدرّاجات — في الاتجاهين، وهذا هو فخّ مسارات الدرّاجات ذات الاتجاهين."
  }
 },
 "p1q7": {
  "en": {
   "enonce": "Sign: \"No entry except residents.\" You don't live on the street. What do you do?",
   "options": [
    "I turn around",
    "I go through, there's no one",
    "I go through slowly"
   ],
   "explication": "Not a resident = no right to enter, even empty, even slowly. Turn around."
  },
  "ar": {
   "enonce": "لافتة «ممنوع الدخول إلا للسكان». أنت لا تسكن في هذا الشارع. ماذا تفعل؟",
   "options": [
    "أستدير عائداً",
    "أمرّ، لا يوجد أحد",
    "أمرّ ببطء"
   ],
   "explication": "لست من السكان = لا يحق لك المرور، ولو كان الشارع فارغاً، ولو ببطء. استدر عائداً."
  }
 },
 "p1q8": {
  "en": {
   "enonce": "You're stopped at a red light. It turns green. What do you do?",
   "options": [
    "I set off straight away without looking",
    "I check the intersection is clear before going",
    "I wait 3 seconds to be safe"
   ],
   "explication": "Green = allowed, not guaranteed. A pedestrian finishing crossing or a latecomer may still be there: a quick glance before you go."
  },
  "ar": {
   "enonce": "أنت متوقف عند الإشارة الحمراء. تتحول إلى الأخضر. ماذا تفعل؟",
   "options": [
    "أنطلق مباشرة دون أن أنظر",
    "أتأكد أن التقاطع خالٍ قبل الانطلاق",
    "أنتظر 3 ثوانٍ من باب الأمان"
   ],
   "explication": "الأخضر = مسموح، لا مضمون. قد يكون هناك مشاة يُنهون العبور أو متأخر ما زال في التقاطع: نظرة سريعة قبل الانطلاق."
  }
 },
 "p1q9": {
  "en": {
   "enonce": "You want to park. Minimum distance before a pedestrian crossing?",
   "options": [
    "3 metres",
    "5 metres",
    "10 metres"
   ],
   "explication": "5 metres before it. Otherwise you hide the pedestrians from other drivers."
  },
  "ar": {
   "enonce": "تريد أن تركن سيارتك. ما أدنى مسافة قبل ممر المشاة؟",
   "options": [
    "3 أمتار",
    "5 أمتار",
    "10 أمتار"
   ],
   "explication": "5 أمتار قبله. وإلا فإنك تحجب المشاة عن أنظار السائقين الآخرين."
  }
 },
 "p1q10": {
  "en": {
   "enonce": "You overtake a cyclist in town. How much space do you leave to the side, minimum?",
   "options": [
    "0.5 m",
    "1 m",
    "1.5 m"
   ],
   "explication": "1 metre minimum in town (1.50 m outside town)."
  },
  "ar": {
   "enonce": "تتجاوز درّاجاً في المدينة. كم مسافة تترك على الجانب كحدّ أدنى؟",
   "options": [
    "0,5 م",
    "1 م",
    "1,5 م"
   ],
   "explication": "متر واحد كحدّ أدنى داخل المدينة (1,50 م خارج المدينة)."
  }
 },
 "p1q11": {
  "en": {
   "enonce": "Before setting off, your tyre pressure warning light comes on. What do you do?",
   "options": [
    "I check the pressure before hitting the road",
    "I drive anyway, it's not urgent",
    "I'll inflate at the next station"
   ],
   "explication": "Warning light on = something's wrong. You check BEFORE driving: an underinflated tyre can blow out."
  },
  "ar": {
   "enonce": "قبل الانطلاق، يضيء مؤشّر ضغط الإطارات. ماذا تفعل؟",
   "options": [
    "أتحقق من الضغط قبل الانطلاق على الطريق",
    "أقود على أي حال، الأمر ليس عاجلاً",
    "سأنفخها في المحطة القادمة"
   ],
   "explication": "إضاءة المؤشّر = خلل. تتحقق قبل القيادة: الإطار المنخفض الضغط قد ينفجر."
  }
 },
 "p1q12": {
  "en": {
   "enonce": "In a 30 zone, a pedestrian is about to cross away from a crossing. What do you do?",
   "options": [
    "I keep going, they're not on a crossing",
    "I slow down and let them cross",
    "I honk so they wait"
   ],
   "explication": "At 30 km/h, the pedestrian is vulnerable: you slow down and let them cross, even away from a crossing. Their safety comes first."
  },
  "ar": {
   "enonce": "في منطقة سرعة 30، يهمّ أحد المشاة بالعبور خارج الممر. ماذا تفعل؟",
   "options": [
    "أواصل السير، فهو ليس على ممر مشاة",
    "أتباطأ وأتركه يعبر",
    "أُطلق النفير كي ينتظر"
   ],
   "explication": "عند 30 km/h، يكون المشاة معرّضين للخطر: تتباطأ وتتركه يعبر، ولو خارج الممر. سلامته لها الأولوية."
  }
 },
 "p1q13": {
  "en": {
   "enonce": "You overtake a stopped bus. Pedestrians are crossing in front of the bus. What do you do?",
   "options": [
    "I honk to warn them",
    "I speed up to pass before them",
    "I stop to let them cross"
   ],
   "explication": "You stop. In front of a bus, you can't see who's stepping out — maximum caution."
  },
  "ar": {
   "enonce": "تتجاوز حافلة متوقفة. مشاة يعبرون أمام الحافلة. ماذا تفعل؟",
   "options": [
    "أُطلق النفير لتنبيههم",
    "أزيد سرعتي لأمرّ قبلهم",
    "أتوقف لأتركهم يعبرون"
   ],
   "explication": "تتوقف. أمام الحافلة لا ترى مَن يخرج فجأة — أقصى درجات الحذر."
  }
 },
 "p1q14": {
  "en": {
   "enonce": "You're leaving a roundabout at the 2nd exit. Where do you position yourself when entering?",
   "options": [
    "Right lane only",
    "Any lane, depending on the road markings",
    "Always the left lane"
   ],
   "explication": "You follow the road markings. If there are none: stay to the right for nearby exits."
  },
  "ar": {
   "enonce": "تخرج من دوّار عند المخرج الثاني. أين تضع سيارتك عند الدخول؟",
   "options": [
    "المسار الأيمن فقط",
    "أي مسار، حسب العلامات على الأرض",
    "المسار الأيسر دائماً"
   ],
   "explication": "تتبع العلامات المرسومة على الأرض. إن لم تكن هناك علامات: ابقَ على اليمين للمخارج القريبة."
  }
 },
 "p1q15": {
  "en": {
   "enonce": "Is the right indicator required to leave a roundabout?",
   "options": [
    "No, not in a roundabout",
    "Yes, before the exit I'm taking",
    "Yes, as soon as I enter the roundabout"
   ],
   "explication": "Yes: right indicator just before YOUR exit, to warn the others."
  },
  "ar": {
   "enonce": "هل إشارة الانعطاف اليمنى إلزامية للخروج من الدوّار؟",
   "options": [
    "لا، ليس داخل الدوّار",
    "نعم، قبل المخرج الذي أسلكه",
    "نعم، منذ الدخول إلى الدوّار"
   ],
   "explication": "نعم: إشارة الانعطاف اليمنى قبيل مخرجك مباشرة، لتنبيه الآخرين."
  }
 },
 "p2q1": {
  "en": {
   "enonce": "Road at 50 km/h, the light turns steady amber in front of you. What do you do?",
   "options": [
    "I speed up to get through before it turns red",
    "I stop if I can do it safely",
    "I keep going, no time to brake"
   ],
   "explication": "Amber = stop, if you can brake without danger. You only go through if stopping would be risky."
  },
  "ar": {
   "enonce": "طريق بسرعة 50 كم/س، والإشارة تحوّلت إلى البرتقالي الثابت أمامك. ماذا تفعل؟",
   "options": [
    "أُسرِع لأعبر قبل الأحمر",
    "أتوقف إذا كان بإمكاني ذلك بأمان",
    "أُتابع، لا وقت للفرملة"
   ],
   "explication": "البرتقالي = توقف، إذا كان بإمكانك الفرملة دون خطر. لا تعبر إلا إذا كان التوقف سيُشكّل خطرًا."
  }
 },
 "p2q2": {
  "en": {
   "enonce": "A bike box is marked in front of the stop line. Where do you stop?",
   "options": [
    "In the bike box, it's allowed at rush hour",
    "Behind the stop line, before the bike box",
    "Anywhere before the light"
   ],
   "explication": "The bike box is reserved for cyclists. You stop behind YOUR line, before the box."
  },
  "ar": {
   "enonce": "توجد منطقة انتظار للدراجات مرسومة أمام خط التوقف. أين تتوقف؟",
   "options": [
    "داخل منطقة الدراجات، فهذا مسموح في ساعات الذروة",
    "خلف خط التوقف، قبل منطقة الدراجات",
    "في أي مكان قبل الإشارة"
   ],
   "explication": "منطقة الانتظار مخصّصة للدراجات. أما أنت فتتوقف خلف خطّك، قبل هذه المنطقة."
  }
 },
 "p2q3": {
  "en": {
   "enonce": "A pedestrian crosses away from the crosswalk. What are you required to do?",
   "options": [
    "Nothing, they're crossing wrong, they'll adapt",
    "Slow down, and stop if I have to",
    "Honk to point out their offence"
   ],
   "explication": "Even if they're wrong, their safety comes first: you slow down and stop if necessary."
  },
  "ar": {
   "enonce": "أحد المشاة يعبر خارج ممر المشاة. بماذا أنت مُلزَم؟",
   "options": [
    "بلا شيء، فهو يعبر بشكل خاطئ وعليه أن يتدبّر أمره",
    "بأن أُبطئ، وأتوقف إذا لزم الأمر",
    "بأن أُنبّهه بالبوق على مخالفته"
   ],
   "explication": "حتى لو كان مخطئًا، فسلامته تأتي أولًا: تُبطئ وتتوقف عند الحاجة."
  }
 },
 "p2q4": {
  "en": {
   "enonce": "At 50 km/h in dry weather, in about how many metres do you stop?",
   "options": [
    "15 m",
    "28 m",
    "45 m"
   ],
   "explication": "About 28 m: 14 m of reaction + 14 m of braking. And much more on wet ground."
  },
  "ar": {
   "enonce": "بسرعة 50 كم/س وفي جو جاف، في كم مترًا تقريبًا تتوقف؟",
   "options": [
    "15 م",
    "28 م",
    "45 م"
   ],
   "explication": "نحو 28 م: 14 م لردّ الفعل + 14 م للفرملة. وأكثر بكثير على أرض مبلّلة."
  }
 },
 "p2q5": {
  "en": {
   "enonce": "The light turns amber when you're a few metres from the line. What do you do?",
   "options": [
    "I brake hard no matter what",
    "I go through if I'm too close to brake safely",
    "I speed up to get through before the red"
   ],
   "explication": "Too close to stop safely = you go through. Otherwise, you stop. Never speed up."
  },
  "ar": {
   "enonce": "تحوّلت الإشارة إلى البرتقالي وأنت على بُعد أمتار قليلة من الخط. ماذا تفعل؟",
   "options": [
    "أفرمل فرملة طارئة في كل الأحوال",
    "أعبر إذا كنت قريبًا جدًا بحيث لا أستطيع الفرملة بأمان",
    "أُسرِع لأعبر قبل الأحمر"
   ],
   "explication": "قريب جدًا بحيث لا يمكنك التوقف بأمان = تعبر. وإلا فتتوقف. لا تُسرِع أبدًا."
  }
 },
 "p2q6": {
  "en": {
   "enonce": "Can you park on a bike lane?",
   "options": [
    "Yes, for less than 5 minutes",
    "Yes, with the hazard lights on",
    "No, it's forbidden"
   ],
   "explication": "Forbidden, full stop. No matter the duration or the hazard lights."
  },
  "ar": {
   "enonce": "هل يمكنك الوقوف على مسار الدراجات؟",
   "options": [
    "نعم، أقل من 5 دقائق",
    "نعم، مع تشغيل أضواء التحذير",
    "لا، هذا ممنوع"
   ],
   "explication": "ممنوع، وانتهى الأمر. مهما كانت المدة أو أضواء التحذير."
  }
 },
 "p2q7": {
  "en": {
   "enonce": "You're turning left. A cyclist is coming towards you, going straight, in their lane. Who goes first?",
   "options": [
    "Me, because I'm turning",
    "The cyclist going straight",
    "Nobody, we work it out"
   ],
   "explication": "Whoever goes straight goes before whoever turns. You give way to the cyclist."
  },
  "ar": {
   "enonce": "أنت تنعطف يسارًا. وتأتي دراجة في الاتجاه المقابل، مستقيمةً، على مسارها. من يمر أولًا؟",
   "options": [
    "أنا، لأنني أنعطف",
    "الدراجة التي تسير مستقيمة",
    "لا أحد، نتفاهم"
   ],
   "explication": "من يسير مستقيمًا يمر قبل من ينعطف. أنت تُفسح الطريق للدراجة."
  }
 },
 "p2q8": {
  "en": {
   "enonce": "Accident with an injured person. Your first required action?",
   "options": [
    "Move the injured person to shelter them",
    "Secure the area, then alert the emergency services",
    "Drive off and call on the way"
   ],
   "explication": "P-A-R: Protect, Alert (15, 17, 18 or 112), Rescue. And you never move an injured person unless there's immediate danger."
  },
  "ar": {
   "enonce": "حادث فيه مصاب. ما أول إجراء مُلزَم به؟",
   "options": [
    "نقل المصاب لوضعه في مأمن",
    "تأمين المكان، ثم استدعاء الإسعاف",
    "المغادرة والاتصال في الطريق"
   ],
   "explication": "أ-إ-إ: أمّن المكان، اتصل (15 أو 17 أو 18 أو 112)، أسعِف. ولا يُنقل المصاب أبدًا إلا في حال وجود خطر مباشر."
  }
 },
 "p2q9": {
  "en": {
   "enonce": "At 50 km/h, a child darts out between two parked cars. What do you do?",
   "options": [
    "I brake and honk at the same time",
    "I brake as hard as I can while keeping my line",
    "I dodge them by swerving hard"
   ],
   "explication": "Brake as hard as you can, straight line. Swerving suddenly = loss of control."
  },
  "ar": {
   "enonce": "بسرعة 50 كم/س، يظهر طفل فجأة بين سيارتين متوقفتين. ماذا تفعل؟",
   "options": [
    "أفرمل وأُطلق البوق في آن واحد",
    "أفرمل بأقصى قوة مع الحفاظ على مساري",
    "أتفاداه بالانحراف بقوة"
   ],
   "explication": "فرملة بأقصى قوة، ومسار مستقيم. الانحراف المفاجئ = فقدان السيطرة."
  }
 },
 "p2q10": {
  "en": {
   "enonce": "A tram is stopped, doors open. What do you do?",
   "options": [
    "I go past slowly while honking",
    "I wait until the doors are closed and the passengers have cleared",
    "I go past normally if the way is clear"
   ],
   "explication": "You wait until everyone has got on or off and the doors are closed."
  },
  "ar": {
   "enonce": "ترام متوقف وأبوابه مفتوحة. ماذا تفعل؟",
   "options": [
    "أمرّ ببطء مع إطلاق البوق",
    "أنتظر حتى تُغلق الأبواب ويبتعد الركّاب",
    "أمرّ بشكل عادي إذا كان الطريق خاليًا"
   ],
   "explication": "تنتظر حتى يصعد الجميع أو ينزلوا وتُغلق الأبواب."
  }
 },
 "p2q11": {
  "en": {
   "enonce": "Maximum speed in town, with no specific sign?",
   "options": [
    "30 km/h",
    "50 km/h",
    "70 km/h"
   ],
   "explication": "50 km/h by default in built-up areas. Except in a 30 zone, a shared zone, etc."
  },
  "ar": {
   "enonce": "السرعة القصوى في المدينة، دون لافتة خاصة؟",
   "options": [
    "30 كم/س",
    "50 كم/س",
    "70 كم/س"
   ],
   "explication": "50 كم/س افتراضيًا داخل المدن. باستثناء منطقة 30، ومنطقة الالتقاء، إلخ."
  }
 },
 "p2q12": {
  "en": {
   "enonce": "Your phone rings while you're driving. What do you do?",
   "options": [
    "I answer quickly if it's important",
    "I don't answer — or I pull over to answer",
    "I answer on speaker while holding it"
   ],
   "explication": "Phone in hand at the wheel = forbidden. Earphones and earpieces too. Only a hands-free system built into the vehicle is allowed."
  },
  "ar": {
   "enonce": "يرنّ هاتفك أثناء القيادة. ماذا تفعل؟",
   "options": [
    "أُجيب بسرعة إذا كان الأمر مهمًا",
    "لا أُجيب — أو أتوقف لأُجيب",
    "أُجيب على مكبّر الصوت وأنا أمسكه بيدي"
   ],
   "explication": "الهاتف في اليد أثناء القيادة = ممنوع. وكذلك سمّاعات الأذن. المسموح فقط هو نظام حرّ اليدين المدمج في السيارة."
  }
 },
 "p2q13": {
  "en": {
   "enonce": "A school bus is stopped, hazard lights on, children getting off. What do you do?",
   "options": [
    "I go past slowly",
    "I stop until they're on the pavement",
    "I honk to warn the children"
   ],
   "explication": "You stop and wait. A child can dart out at any moment around a school bus."
  },
  "ar": {
   "enonce": "حافلة مدرسية متوقفة، أضواء التحذير مشغّلة، وأطفال ينزلون. ماذا تفعل؟",
   "options": [
    "أمرّ ببطء",
    "أتوقف حتى يصلوا إلى الرصيف",
    "أُطلق البوق لتنبيه الأطفال"
   ],
   "explication": "تتوقف وتنتظر. قد يظهر طفل فجأة في أي لحظة حول حافلة مدرسية."
  }
 },
 "p2q14": {
  "en": {
   "enonce": "A delivery driver is blocking your spot. Can you stay double-parked?",
   "options": [
    "Yes, briefly if I stay in the car",
    "Yes, with the hazard lights on",
    "No, double-parking is forbidden"
   ],
   "explication": "Double-parking = forbidden. Only a stop of a few seconds, at the wheel, may be tolerated."
  },
  "ar": {
   "enonce": "عامل توصيل يسدّ مكانك. هل يمكنك البقاء في صفّ مزدوج؟",
   "options": [
    "نعم، لفترة قصيرة إذا بقيتُ في السيارة",
    "نعم، مع تشغيل أضواء التحذير",
    "لا، الوقوف في صفّ مزدوج ممنوع"
   ],
   "explication": "الوقوف في صفّ مزدوج = ممنوع. لا يُتسامَح إلا مع توقّف لبضع ثوانٍ، وأنت خلف المقود."
  }
 },
 "p2q15": {
  "en": {
   "enonce": "Boulevard at 50 km/h. What distance do you keep from the car in front?",
   "options": [
    "1 second of distance",
    "2 seconds of distance minimum",
    "A fixed 5 metres"
   ],
   "explication": "The 2-second rule: when the car in front passes a fixed marker, you should reach it 2 seconds later, not before."
  },
  "ar": {
   "enonce": "جادّة بسرعة 50 كم/س. ما المسافة التي تحافظ عليها مع السيارة التي أمامك؟",
   "options": [
    "مسافة ثانية واحدة",
    "مسافة ثانيتين كحدّ أدنى",
    "5 أمتار ثابتة"
   ],
   "explication": "قاعدة الثانيتين: عندما تمرّ السيارة التي أمامك بعلامة ثابتة، يجب أن تصل إليها بعد ثانيتين، لا قبل ذلك."
  }
 },
 "p3q1": {
  "en": {
   "enonce": "Country road, intersection with no sign at all. What's the rule?",
   "options": [
    "The fastest one goes first",
    "I give way to whoever comes from my right",
    "I have priority because my road is bigger"
   ],
   "explication": "No sign means priority to the right. You give way to any vehicle coming from your right."
  },
  "ar": {
   "enonce": "طريق ريفي، تقاطع بدون أي إشارة. ما القاعدة؟",
   "options": [
    "الأسرع يمرّ أولاً",
    "أتنازل عن المرور لمن يأتي من يميني",
    "لي الأولوية لأن طريقي أوسع"
   ],
   "explication": "لا توجد إشارة يعني الأولوية لليمين. تتنازل عن المرور لأي مركبة تأتي من يمينك."
  }
 },
 "p3q2": {
  "en": {
   "enonce": "You want to overtake a tractor going 25 km/h, but the road is on a bend. What do you do?",
   "options": [
    "I overtake quickly if the oncoming lane looks clear",
    "I wait for a straight stretch with good visibility",
    "I overtake while honking to warn others"
   ],
   "explication": "On a bend, overtaking is forbidden: you can't see what's coming. Wait for a clear straight stretch."
  },
  "ar": {
   "enonce": "تريد تجاوز جرّار يسير بسرعة 25 km/h، لكن الطريق في منعطف. ماذا تفعل؟",
   "options": [
    "أتجاوز بسرعة إذا بدا المسار المقابل خالياً",
    "أنتظر مقطعاً مستقيماً برؤية جيدة",
    "أتجاوز مع استعمال المنبّه للتنبيه"
   ],
   "explication": "في المنعطف، التجاوز ممنوع: لا ترى ما هو قادم. انتظر حتى مقطع مستقيم خالٍ."
  }
 },
 "p3q3": {
  "en": {
   "enonce": "STOP sign at the intersection. What's the exact rule?",
   "options": [
    "I slow down and go if no one is coming",
    "Full stop, then I give way",
    "I just slow down a bit"
   ],
   "explication": "STOP means a FULL stop (zero speed), even if the road is empty. A \"rolling stop\" fails you."
  },
  "ar": {
   "enonce": "إشارة STOP عند التقاطع. ما القاعدة بالضبط؟",
   "options": [
    "أبطئ وأمرّ إذا لم يأتِ أحد",
    "توقف تام، ثم أتنازل عن المرور",
    "أكتفي بالإبطاء قليلاً"
   ],
   "explication": "STOP تعني توقفاً تاماً (سرعة صفر)، حتى لو كان الطريق خالياً. «التوقف المتدحرج» سبب للرسوب."
  }
 },
 "p3q4": {
  "en": {
   "enonce": "Open countryside, it's raining. Your top speed?",
   "options": [
    "90 km/h",
    "80 km/h",
    "110 km/h"
   ],
   "explication": "Rain lowers the limit by 10 km/h: 80 instead of 90 outside towns (and 110 instead of 130 on the motorway)."
  },
  "ar": {
   "enonce": "في الريف المفتوح، تمطر السماء. ما سرعتك القصوى؟",
   "options": [
    "90 km/h",
    "80 km/h",
    "110 km/h"
   ],
   "explication": "المطر يخفض الحدّ بـ 10 km/h: 80 بدل 90 خارج المدن (و110 بدل 130 على الطريق السريع)."
  }
 },
 "p3q5": {
  "en": {
   "enonce": "At 80 km/h, a tyre suddenly bursts. What do you do?",
   "options": [
    "I slam on the brakes immediately",
    "I grip the wheel firmly, ease off the accelerator, and brake gently",
    "I steer toward the side that burst"
   ],
   "explication": "Never brake hard or jerk the wheel. Hold your course, slow down, and brake gently."
  },
  "ar": {
   "enonce": "عند سرعة 80 km/h، ينفجر إطار فجأة. ماذا تفعل؟",
   "options": [
    "أضغط على المكابح بقوة فوراً",
    "أمسك المقود بإحكام، أرفع قدمي عن دواسة الوقود، وأكبح برفق",
    "أوجّه المقود نحو جهة الانفجار"
   ],
   "explication": "لا كبح عنيف ولا حركة مفاجئة للمقود. حافظ على مسارك، أبطئ، ثم اكبح برفق."
  }
 },
 "p3q6": {
  "en": {
   "enonce": "At night in the countryside, you meet an oncoming car. Your headlights?",
   "options": [
    "I keep full beam to see better",
    "I switch off all lights",
    "I switch to dipped beam as soon as I might dazzle them"
   ],
   "explication": "You switch to dipped (low) beam as soon as a vehicle comes toward you. Dazzling them means blinding them."
  },
  "ar": {
   "enonce": "ليلاً في الريف، تلتقي بسيارة قادمة في الاتجاه المقابل. أضواؤك الأمامية؟",
   "options": [
    "أبقي الأضواء العالية لأرى أفضل",
    "أطفئ كل الأضواء",
    "أحوّل إلى الأضواء المنخفضة بمجرد أن أخاطر بإبهارها"
   ],
   "explication": "تحوّل إلى الأضواء المنخفضة بمجرد قدوم مركبة في مواجهتك. إبهارها يعني إعماء سائقها."
  }
 },
 "p3q7": {
  "en": {
   "enonce": "An animal crosses the road in front of you. What do you do?",
   "options": [
    "I honk and speed up to scare it away",
    "I brake gradually and stop if I have to",
    "I swerve to avoid it with a sharp turn"
   ],
   "explication": "Gradual braking, steady path. A sudden swerve is often worse than the animal."
  },
  "ar": {
   "enonce": "حيوان يعبر الطريق أمامك. ماذا تفعل؟",
   "options": [
    "أستعمل المنبّه وأسرّع لأطرده",
    "أكبح تدريجياً وأتوقف إذا لزم الأمر",
    "أتفاداه بانحراف مفاجئ"
   ],
   "explication": "كبح تدريجي ومسار ثابت. الانحراف المفاجئ غالباً أسوأ من الحيوان نفسه."
  }
 },
 "p3q8": {
  "en": {
   "enonce": "Broken white centre line. What does it mean?",
   "options": [
    "Overtaking forbidden in both directions",
    "Overtaking allowed if the oncoming lane is clear",
    "Lane reserved for slow vehicles"
   ],
   "explication": "A broken line means you may overtake, as long as you have visibility and the oncoming lane is clear."
  },
  "ar": {
   "enonce": "خط أبيض متقطّع في وسط الطريق. ماذا يعني؟",
   "options": [
    "التجاوز ممنوع في الاتجاهين",
    "التجاوز مسموح إذا كان المسار المقابل خالياً",
    "مسار مخصص للمركبات البطيئة"
   ],
   "explication": "الخط المتقطّع يعني أنه يمكنك التجاوز، بشرط توفر الرؤية وخلوّ المسار المقابل."
  }
 },
 "p3q9": {
  "en": {
   "enonce": "Give way sign, no vehicle in sight. Do you have to stop?",
   "options": [
    "No, a give way sign doesn't require you to stop",
    "Yes, it's mandatory like a STOP",
    "Only if visibility is poor"
   ],
   "explication": "You slow down and give way — but if it's clearly clear, you don't need to stop. That's the difference from a STOP."
  },
  "ar": {
   "enonce": "إشارة «تنازل عن الأولوية»، ولا مركبة في الأفق. هل عليك التوقف؟",
   "options": [
    "لا، إشارة التنازل لا تفرض التوقف",
    "نعم، إنه إجباري مثل STOP",
    "فقط إذا كانت الرؤية سيئة"
   ],
   "explication": "تبطئ وتتنازل عن المرور — لكن إذا كان الطريق خالياً بوضوح، لا حاجة للتوقف. هذا هو الفرق عن STOP."
  }
 },
 "p3q10": {
  "en": {
   "enonce": "Long night drive, you feel drowsiness coming on. What do you do?",
   "options": [
    "I open the window and turn up the music",
    "I stop: a break or a real nap",
    "I speed up to finish sooner"
   ],
   "explication": "The only remedy that works: stop and sleep (at least 20 min). A window and music wake no one up."
  },
  "ar": {
   "enonce": "رحلة ليلية طويلة، وتشعر بالنعاس يقترب. ماذا تفعل؟",
   "options": [
    "أفتح النافذة وأرفع صوت الموسيقى",
    "أتوقف: استراحة أو قيلولة حقيقية",
    "أسرّع لأنهي الطريق أسرع"
   ],
   "explication": "العلاج الوحيد الفعّال: التوقف والنوم (20 دقيقة على الأقل). النافذة والموسيقى لا توقظان أحداً."
  }
 },
 "p3q11": {
  "en": {
   "enonce": "Your car starts aquaplaning on a wet road. What do you do?",
   "options": [
    "I brake hard and steer",
    "I gently ease off the accelerator, without steering",
    "I speed up to get out of the zone"
   ],
   "explication": "You ease off the accelerator gently, wheel straight, and let the tyres regain grip. No braking, no jerking the wheel."
  },
  "ar": {
   "enonce": "سيارتك تنزلق على الماء (aquaplaning) على طريق مبلل. ماذا تفعل؟",
   "options": [
    "أكبح بقوة وأدير المقود",
    "أرفع قدمي عن دواسة الوقود برفق، دون إدارة المقود",
    "أسرّع للخروج من المنطقة"
   ],
   "explication": "ترفع قدمك برفق، والمقود مستقيم، وتترك الإطارات تستعيد التماس. لا كبح ولا حركة مفاجئة للمقود."
  }
 },
 "p3q12": {
  "en": {
   "enonce": "You meet a very wide farm convoy coming the other way. What do you do?",
   "options": [
    "I crawl along, moving over to the right",
    "I wait on the verge if the road is too narrow",
    "I honk so it moves over"
   ],
   "explication": "Road too narrow means you pull over to the side and let it pass. It can't move over, but you can."
  },
  "ar": {
   "enonce": "تلتقي بقافلة زراعية عريضة جداً قادمة في مواجهتك. ماذا تفعل؟",
   "options": [
    "أسير ببطء شديد منزاحاً إلى اليمين",
    "أنتظر على حافة الطريق إذا كان الطريق ضيقاً جداً",
    "أستعمل المنبّه ليبتعد"
   ],
   "explication": "إذا كان الطريق ضيقاً جداً، تتوقف على الجانب وتتركها تمرّ. هي لا تستطيع الانزياح، أما أنت فتستطيع."
  }
 },
 "p3q13": {
  "en": {
   "enonce": "Solid white line on YOUR side of the road. What does it mean?",
   "options": [
    "Slowing down advised",
    "Overtaking forbidden for me",
    "Edge of the roadway"
   ],
   "explication": "Solid on your side means you can't overtake. On the other side, it's the other driver who can't."
  },
  "ar": {
   "enonce": "خط أبيض متصل في جهتك أنت من الطريق. ماذا يعني؟",
   "options": [
    "يُنصح بالإبطاء",
    "التجاوز ممنوع بالنسبة لي",
    "حدّ سطح الطريق"
   ],
   "explication": "المتصل في جهتك يعني منع التجاوز بالنسبة لك. في الجهة الأخرى، الآخر هو الذي لا يستطيع."
  }
 },
 "p3q14": {
  "en": {
   "enonce": "A pedestrian is walking at the edge of the road, facing you. What do you do?",
   "options": [
    "I honk to warn them",
    "I pass carefully, leaving space",
    "I carry on normally, that's their problem"
   ],
   "explication": "You slow down and move over to pass them with a real safety margin."
  },
  "ar": {
   "enonce": "مشاة يسير على حافة الطريق في مواجهتك. ماذا تفعل؟",
   "options": [
    "أستعمل المنبّه لتنبيهه",
    "أتجاوزه بحذر تاركاً مسافة",
    "أواصل بشكل عادي، فهذه مشكلته"
   ],
   "explication": "تبطئ وتنزاح لتتجاوزه بهامش أمان حقيقي."
  }
 },
 "p3q15": {
  "en": {
   "enonce": "At night, how far do your dipped (low) beam headlights light up?",
   "options": [
    "30 metres",
    "60 metres",
    "100 metres"
   ],
   "explication": "About 30 to 60 m of range. Outside lit areas, switch to full beam to see farther."
  },
  "ar": {
   "enonce": "ليلاً، إلى أي مسافة تضيء أضواؤك المنخفضة الطريق؟",
   "options": [
    "30 متراً",
    "60 متراً",
    "100 متر"
   ],
   "explication": "مدى يتراوح بين 30 و60 متراً تقريباً. خارج المناطق المضاءة، حوّل إلى الأضواء العالية لترى أبعد."
  }
 },
 "p4q1": {
  "en": {
   "enonce": "A tram reaches the junction at the same time as you. Who goes first?",
   "options": [
    "The tram, always",
    "Whoever comes from the right",
    "The faster one"
   ],
   "explication": "The tram always has absolute priority. It can neither swerve nor stop quickly."
  },
  "ar": {
   "enonce": "يصل تِرام إلى التقاطع في نفس الوقت الذي تصل فيه أنت. من يمرّ أولاً؟",
   "options": [
    "التِرام دائماً",
    "من يأتي من جهة اليمين",
    "الأسرع"
   ],
   "explication": "للتِرام أولوية مطلقة في كل الأحوال. فهو لا يستطيع الانحراف ولا التوقف بسرعة."
  }
 },
 "p4q2": {
  "en": {
   "enonce": "Can you overtake a cyclist in a 30 km/h zone?",
   "options": [
    "No, overtaking is banned in a 30 km/h zone",
    "Yes, leaving at least 1 m of space to the side",
    "Only if I have enough room"
   ],
   "explication": "A 30 km/h zone does not ban overtaking, but the 1 m side clearance is still required."
  },
  "ar": {
   "enonce": "هل يمكنك تجاوز راكب دراجة في منطقة سرعة 30 كم/س؟",
   "options": [
    "لا، التجاوز ممنوع في منطقة 30 كم/س",
    "نعم، مع ترك مسافة لا تقل عن متر واحد على الجانب",
    "فقط إذا كان لديّ متسع كافٍ"
   ],
   "explication": "منطقة 30 كم/س لا تمنع التجاوز، لكن يبقى ترك متر واحد على الجانب إلزامياً."
  }
 },
 "p4q3": {
  "en": {
   "enonce": "You are turning right and a tram is coming from your right. What do you do?",
   "options": [
    "I turn quickly before it arrives",
    "I wait for it to pass",
    "I honk to warn the driver"
   ],
   "explication": "The tram has priority: wait for it to pass completely before you turn."
  },
  "ar": {
   "enonce": "أنت تنعطف يميناً ويأتي تِرام من جهة يمينك. ماذا تفعل؟",
   "options": [
    "أنعطف بسرعة قبل أن يصل",
    "أنتظر حتى يمرّ",
    "أُطلق البوق لتنبيه السائق"
   ],
   "explication": "للتِرام الأولوية: انتظر حتى يمرّ تماماً قبل أن تنعطف."
  }
 },
 "p4q4": {
  "en": {
   "enonce": "The car on your left signals to move into your lane. What do you do?",
   "options": [
    "I speed up to keep my place",
    "I brake gently to make room, if it's safe",
    "I honk right away"
   ],
   "explication": "You ease their manoeuvre if it's safe. Courtesy is also scored on the test."
  },
  "ar": {
   "enonce": "السيارة التي على يسارك تُشعِل إشارتها للانتقال إلى مسارك. ماذا تفعل؟",
   "options": [
    "أُسرِع للحفاظ على مكاني",
    "أخفّف السرعة قليلاً لأفسح لها المجال، إذا كان ذلك آمناً",
    "أُطلق البوق فوراً"
   ],
   "explication": "تُسهّل مناورتها إذا كان ذلك بلا خطر. اللباقة أيضاً تُحتسَب في الامتحان."
  }
 },
 "p4q5": {
  "en": {
   "enonce": "You have a green light, but a pedestrian with a pushchair is finishing crossing. What do you do?",
   "options": [
    "I move forward carefully, I have the green",
    "I wait until they have fully crossed",
    "I honk so they hurry up"
   ],
   "explication": "Green light or not, a pedestrian already crossing finishes safely. Their safety comes before your priority."
  },
  "ar": {
   "enonce": "الإشارة خضراء أمامك، لكن أحد المشاة مع عربة أطفال ينهي عبوره. ماذا تفعل؟",
   "options": [
    "أتقدّم بحذر، فالإشارة خضراء لي",
    "أنتظر حتى يُكمل العبور بالكامل",
    "أُطلق البوق ليُسرِع"
   ],
   "explication": "خضراء كانت الإشارة أم لا، المشاة الذين بدأوا العبور يُكملونه بأمان. سلامتهم قبل أولويتك."
  }
 },
 "p4q6": {
  "en": {
   "enonce": "In a shared zone, can pedestrians cross away from the crossings?",
   "options": [
    "No, they must use the crossings",
    "Yes, but they let cars pass",
    "Yes, and it's up to drivers to let them pass"
   ],
   "explication": "In a shared zone (20 km/h), pedestrians have priority across the whole road. Careful: in a 30 km/h zone they do NOT have this general priority — that's the classic trap."
  },
  "ar": {
   "enonce": "في منطقة الالتقاء، هل يمكن للمشاة العبور خارج الممرات؟",
   "options": [
    "لا، عليهم استخدام الممرات",
    "نعم، لكن عليهم إفساح الطريق للسيارات",
    "نعم، وعلى السائقين إفساح الطريق لهم"
   ],
   "explication": "في منطقة الالتقاء (20 كم/س) للمشاة الأولوية على كامل الطريق. انتبه: في منطقة 30 كم/س لا تكون لهم هذه الأولوية العامة — وهذا هو الفخ المعتاد."
  }
 },
 "p4q7": {
  "en": {
   "enonce": "Your hybrid car is running in electric mode. What changes towards pedestrians?",
   "options": [
    "Nothing, it's up to pedestrians to be careful",
    "I'm extra alert: they don't hear me coming",
    "Nothing, the law makes no difference"
   ],
   "explication": "In electric mode you're almost silent. Pedestrians and visually impaired people can't hear you — it's up to you to make up for it."
  },
  "ar": {
   "enonce": "سيارتك الهجينة تسير في الوضع الكهربائي. ما الذي يتغيّر تجاه المشاة؟",
   "options": [
    "لا شيء، على المشاة أن ينتبهوا",
    "أُضاعف يقظتي: فهم لا يسمعون اقترابي",
    "لا شيء، القانون لا يُفرّق"
   ],
   "explication": "في الوضع الكهربائي تكون شبه صامت. المشاة وضعاف البصر لا يسمعونك — فعليك أنت التعويض عن ذلك."
  }
 },
 "p4q8": {
  "en": {
   "enonce": "A cargo bike is riding ahead of you in a 30 km/h zone. Can you overtake it?",
   "options": [
    "No, it's too wide",
    "Yes, with enough room and 1 m of clearance",
    "Yes, since it's slower"
   ],
   "explication": "Like any bike: visibility + enough room + at least 1 m of side clearance."
  },
  "ar": {
   "enonce": "دراجة شحن تسير أمامك في منطقة 30 كم/س. هل يمكنك تجاوزها؟",
   "options": [
    "لا، إنها عريضة جداً",
    "نعم، مع متسع كافٍ ومسافة متر واحد",
    "نعم، لأنها أبطأ"
   ],
   "explication": "مثل أي دراجة: رؤية واضحة + متسع كافٍ + متر واحد على الأقل على الجانب."
  }
 },
 "p4q9": {
  "en": {
   "enonce": "Black ice is reported. What safety distance do you keep?",
   "options": [
    "The same as on dry ground",
    "At least double, even triple",
    "5 metres more"
   ],
   "explication": "On black ice, your braking distance is multiplied by 4 to 10. Double or triple your gap, at minimum."
  },
  "ar": {
   "enonce": "هناك تحذير من جليد على الطريق. ما مسافة الأمان التي تعتمدها؟",
   "options": [
    "نفسها كما على أرض جافة",
    "الضِّعف على الأقل، بل الثلاثة أضعاف",
    "5 أمتار إضافية"
   ],
   "explication": "على الجليد تتضاعف مسافة الفرملة من 4 إلى 10 مرات. ضاعِف مسافتك أو ثلّثها كحدّ أدنى."
  }
 },
 "p4q10": {
  "en": {
   "enonce": "Your car skids on a downhill bend. What do you do?",
   "options": [
    "I brake hard",
    "I ease off the accelerator and steer gently the other way",
    "I speed up to get out of the skid"
   ],
   "explication": "Ease your foot off smoothly, a slight counter-steer to regain your line. Harsh braking makes the skid worse."
  },
  "ar": {
   "enonce": "سيارتك تنزلق في منعطف نازل. ماذا تفعل؟",
   "options": [
    "أفرمل بأقصى قوة",
    "أرفع قدمي عن دواسة الوقود وأُدير المقود قليلاً في الاتجاه المعاكس",
    "أُسرِع للخروج من الانزلاق"
   ],
   "explication": "ارفع قدمك بهدوء، وأدِر المقود قليلاً في الاتجاه المعاكس لاستعادة المسار. الفرملة العنيفة تزيد الانزلاق سوءاً."
  }
 },
 "p4q11": {
  "en": {
   "enonce": "In a shared zone (pedestrians + bikes + cars), what's the speed limit?",
   "options": [
    "10 km/h",
    "20 km/h",
    "30 km/h"
   ],
   "explication": "20 km/h. And pedestrians there have priority across the full width of the road."
  },
  "ar": {
   "enonce": "في منطقة الالتقاء (مشاة + دراجات + سيارات)، ما السرعة القصوى؟",
   "options": [
    "10 كم/س",
    "20 كم/س",
    "30 كم/س"
   ],
   "explication": "20 كم/س. وللمشاة فيها الأولوية على كامل عرض الطريق."
  }
 },
 "p4q12": {
  "en": {
   "enonce": "You're parked and want to pull away. What do you do, in order?",
   "options": [
    "Signal and pull out without looking",
    "Mirrors + blind spot, signal, then pull out",
    "A honk, then I go"
   ],
   "explication": "Checks first (mirrors + blind spot), then signal, then a smooth pull-away. In that order."
  },
  "ar": {
   "enonce": "أنت متوقف وتريد الانطلاق. ماذا تفعل، بالترتيب؟",
   "options": [
    "أُشعِل الإشارة وأنطلق دون النظر",
    "المرايا + النقطة العمياء، ثم الإشارة، ثم أنطلق",
    "بوق ثم أنطلق"
   ],
   "explication": "التحقّقات أولاً (المرايا + النقطة العمياء)، ثم الإشارة، ثم الانطلاق التدريجي. بهذا الترتيب."
  }
 },
 "p4q13": {
  "en": {
   "enonce": "Blue zone parking, but you don't have your parking disc. What do you do?",
   "options": [
    "I park anyway for 5 minutes",
    "I look for another space",
    "I photograph the time with my phone"
   ],
   "explication": "No disc, no blue zone parking — not even for 5 minutes. Look elsewhere."
  },
  "ar": {
   "enonce": "منطقة زرقاء، لكنك لا تملك قرص التوقيت. ماذا تفعل؟",
   "options": [
    "أركن رغم ذلك لمدة 5 دقائق",
    "أبحث عن مكان آخر",
    "ألتقط صورة للوقت بهاتفي"
   ],
   "explication": "بلا قرص، لا توقّف في المنطقة الزرقاء — ولا حتى لخمس دقائق. ابحث في مكان آخر."
  }
 },
 "p4q14": {
  "en": {
   "enonce": "A speed bump in a 30 km/h zone. How do you approach it?",
   "options": [
    "At 30 km/h or less, steady in my lane",
    "Braking hard just before it",
    "Accelerating hard just after it"
   ],
   "explication": "Adjust your speed BEFORE the bump, cross it smoothly. No harsh braking, no sharp acceleration."
  },
  "ar": {
   "enonce": "مطبّ لتخفيف السرعة في منطقة 30 كم/س. كيف تقترب منه؟",
   "options": [
    "بسرعة 30 كم/س أو أقل، وثابتاً في مساري",
    "بالفرملة بقوة قبله مباشرة",
    "بالتسارع بقوة بعده مباشرة"
   ],
   "explication": "اضبط سرعتك قبل المطبّ، واعبره بهدوء. لا فرملة عنيفة ولا تسارع مفاجئ."
  }
 },
 "p4q15": {
  "en": {
   "enonce": "A cyclist ahead of you waves a hand downward. What does it mean?",
   "options": [
    "They're thanking me",
    "They're asking me to slow down",
    "They're signalling an obstacle on the road"
   ],
   "explication": "Hand down = \"slow down\". A coded gesture, common in groups of cyclists."
  },
  "ar": {
   "enonce": "راكب دراجة أمامك يُلوّح بيده نحو الأسفل. ماذا يعني ذلك؟",
   "options": [
    "إنه يشكرني",
    "إنه يطلب مني تخفيف السرعة",
    "إنه يُشير إلى عائق على الطريق"
   ],
   "explication": "اليد نحو الأسفل = «خفّف السرعة». إشارة متعارَف عليها، شائعة بين مجموعات راكبي الدراجات."
  }
 },
 "p5q1": {
  "en": {
   "enonce": "You're merging onto the motorway from the slip road. What do you do?",
   "options": [
    "I speed up on the acceleration lane to match the traffic speed, then merge while giving way",
    "I stop at the end of the slip road and wait for a gap",
    "I force my way in, I'm on the right-hand lane"
   ],
   "explication": "That's exactly what the acceleration lane is for: you match the traffic speed, then merge while giving way to those already there."
  },
  "ar": {
   "enonce": "تندمج في السير على الطريق السريع قادماً من طريق الدخول الفرعي. ماذا تفعل؟",
   "options": [
    "أزيد السرعة على مسار التسارع لأبلغ سرعة السير، ثم أندمج مع إفساح الطريق للآخرين",
    "أتوقف في نهاية طريق الدخول الفرعي وأنتظر فرجة",
    "أفرض المرور، فأنا على المسار الأيمن"
   ],
   "explication": "هذا هو الغرض من مسار التسارع تماماً: تبلغ سرعة السير، ثم تندمج مع إفساح الطريق لمن هم موجودون بالفعل."
  }
 },
 "p5q2": {
  "en": {
   "enonce": "Maximum speed on the motorway in dry weather?",
   "options": [
    "110 km/h",
    "130 km/h",
    "150 km/h"
   ],
   "explication": "130 km/h in dry weather. 110 in the rain, and 110 as well while on a probationary licence."
  },
  "ar": {
   "enonce": "السرعة القصوى على الطريق السريع في الطقس الجاف؟",
   "options": [
    "110 km/h",
    "130 km/h",
    "150 km/h"
   ],
   "explication": "130 km/h في الطقس الجاف. و110 تحت المطر، و110 أيضاً في فترة الرخصة التجريبية."
  }
 },
 "p5q3": {
  "en": {
   "enonce": "At 130 km/h, what is the minimum safe following distance?",
   "options": [
    "50 metres",
    "2 seconds (about 72 metres at 130 km/h)",
    "200 metres"
   ],
   "explication": "Always the 2-second rule — at 130 km/h that's about 72 m. A marker: 2 white lines of the hard shoulder."
  },
  "ar": {
   "enonce": "عند سرعة 130 km/h، ما هي مسافة الأمان الدنيا؟",
   "options": [
    "50 متراً",
    "ثانيتان (نحو 72 متراً عند 130 km/h)",
    "200 متر"
   ],
   "explication": "دائماً قاعدة الثانيتين — عند 130 km/h تعادل نحو 72 متراً. علامة مرجعية: خطان أبيضان من شريط التوقف الاضطراري."
  }
 },
 "p5q4": {
  "en": {
   "enonce": "On the motorway, which side do you overtake on?",
   "options": [
    "On the right only",
    "On the left only",
    "On either side, depending on the situation"
   ],
   "explication": "On the left, always. Overtaking on the right is forbidden and dangerous."
  },
  "ar": {
   "enonce": "على الطريق السريع، من أي جهة تتجاوز؟",
   "options": [
    "من اليمين فقط",
    "من اليسار فقط",
    "من الجهتين، حسب الوضع"
   ],
   "explication": "من اليسار، دائماً. التجاوز من اليمين ممنوع وخطير."
  }
 },
 "p5q5": {
  "en": {
   "enonce": "A flat tyre on the motorway. What do you do first?",
   "options": [
    "I stop immediately in the left-hand lane",
    "I slow down gradually with my hazard lights on, and pull onto the hard shoulder",
    "I speed up to reach the next rest area"
   ],
   "explication": "Hazard lights, gradual slowing without hard braking, and pull onto the hard shoulder. Then everyone behind the crash barrier."
  },
  "ar": {
   "enonce": "انفجار إطار على الطريق السريع. ما أول ما تفعله؟",
   "options": [
    "أتوقف فوراً على المسار الأيسر",
    "أخفّض السرعة تدريجياً مع تشغيل أضواء التحذير، وألتحق بشريط التوقف الاضطراري",
    "أزيد السرعة للوصول إلى محطة الاستراحة التالية"
   ],
   "explication": "أضواء التحذير، تخفيض تدريجي للسرعة دون كبح مفاجئ، والتحاق بشريط التوقف الاضطراري. ثم يقف الجميع خلف الحاجز الواقي."
  }
 },
 "p5q6": {
  "en": {
   "enonce": "A wild animal crosses your lane 200 m ahead. What do you do?",
   "options": [
    "I brake hard",
    "I ease off the accelerator gradually and switch on my hazard lights",
    "I swerve into the left-hand lane"
   ],
   "explication": "At high speed, no sudden moves: slow down gently and warn those behind you with your hazard lights."
  },
  "ar": {
   "enonce": "حيوان بري يعبر مسارك على بُعد 200 متر. ماذا تفعل؟",
   "options": [
    "أكبح بشدة",
    "أرفع قدمي عن دواسة الوقود تدريجياً وأشغّل أضواء التحذير",
    "أنحرف إلى المسار الأيسر"
   ],
   "explication": "عند السرعة العالية، لا حركات مفاجئة: تخفّض السرعة بلطف وتنبّه من خلفك بأضواء التحذير."
  }
 },
 "p5q7": {
  "en": {
   "enonce": "What is the hard shoulder for?",
   "options": [
    "For driving when there's a traffic jam",
    "For emergencies only: breakdowns, rescue services, police",
    "For overtaking when the right-hand lane is busy"
   ],
   "explication": "Emergencies only. Driving on it is forbidden — and you block the way for the emergency services."
  },
  "ar": {
   "enonce": "شريط التوقف الاضطراري، ما فائدته؟",
   "options": [
    "للسير عليه عند الازدحام",
    "للطوارئ فقط: الأعطال، الإسعاف، رجال الأمن",
    "للتجاوز إذا كان المسار الأيمن مزدحماً"
   ],
   "explication": "للطوارئ فقط. السير عليه ممنوع — كما أنك تسد الطريق أمام فرق الإنقاذ."
  }
 },
 "p5q8": {
  "en": {
   "enonce": "Motorway in the rain. Maximum speed?",
   "options": [
    "130 km/h",
    "110 km/h",
    "90 km/h"
   ],
   "explication": "110 km/h as soon as it rains, instead of 130."
  },
  "ar": {
   "enonce": "الطريق السريع تحت المطر. السرعة القصوى؟",
   "options": [
    "130 km/h",
    "110 km/h",
    "90 km/h"
   ],
   "explication": "110 km/h بمجرد نزول المطر، بدلاً من 130."
  }
 },
 "p5q9": {
  "en": {
   "enonce": "You've missed your motorway exit. What do you do?",
   "options": [
    "I reverse along the hard shoulder to the exit",
    "I keep going to the next exit",
    "I make a U-turn on the motorway"
   ],
   "explication": "You keep going, full stop. Reversing or making a U-turn on the motorway is forbidden and deadly."
  },
  "ar": {
   "enonce": "فاتك مخرج الطريق السريع. ماذا تفعل؟",
   "options": [
    "أرجع إلى الوراء على شريط التوقف الاضطراري حتى المخرج",
    "أتابع حتى المخرج التالي",
    "أدور دورة كاملة على الطريق السريع"
   ],
   "explication": "تتابع سيرك، وانتهى الأمر. الرجوع إلى الوراء أو الدوران على الطريق السريع ممنوع وقاتل."
  }
 },
 "p5q10": {
  "en": {
   "enonce": "You've been in the left-hand lane for 5 km without overtaking anything. What do you do?",
   "options": [
    "I move back to the right — driving on the left without overtaking is forbidden",
    "I stay on the left, it's faster",
    "I speed up"
   ],
   "explication": "The left-hand lane is for overtaking, not for cruising. As soon as you're done, you move back to the right."
  },
  "ar": {
   "enonce": "أنت على المسار الأيسر منذ 5 كيلومترات دون أن تتجاوز أحداً. ماذا تفعل؟",
   "options": [
    "أعود إلى اليمين — السير على اليسار دون تجاوز ممنوع",
    "أبقى على اليسار، فهو أسرع",
    "أزيد السرعة"
   ],
   "explication": "المسار الأيسر للتجاوز، لا للتنقل. بمجرد انتهاء التجاوز، تعود إلى اليمين."
  }
 },
 "p5q11": {
  "en": {
   "enonce": "You feel unwell at the wheel on the motorway. What's the procedure?",
   "options": [
    "I keep going to the next rest area",
    "Hazard lights, stop on the hard shoulder, engine off, I call for help",
    "I open the window and breathe while carrying on"
   ],
   "explication": "You don't take chances with this: hazard lights, onto the hard shoulder as fast as possible, engine off, and call 15 or 112."
  },
  "ar": {
   "enonce": "تشعر بتوعّك وأنت خلف المقود على الطريق السريع. ما الإجراء؟",
   "options": [
    "أتابع حتى محطة الاستراحة التالية",
    "أضواء التحذير، التوقف على شريط التوقف الاضطراري، إطفاء المحرك، والاتصال بالإسعاف",
    "أفتح النافذة وأتنفس مع متابعة السير"
   ],
   "explication": "لا تتهاون مع هذا الأمر: أضواء التحذير، شريط التوقف الاضطراري بأسرع ما يمكن، إطفاء المحرك، والاتصال بالرقم 15 أو 112."
  }
 },
 "p5q12": {
  "en": {
   "enonce": "At the toll, you're in the wrong lane. What do you do?",
   "options": [
    "I go through anyway and sort it out online",
    "I change lanes as early as possible, carefully",
    "I stop on the hard shoulder before the toll"
   ],
   "explication": "You change lanes early and safely, well before the booths. Never stop on the hard shoulder for this."
  },
  "ar": {
   "enonce": "عند بوابة الرسوم، أنت في الطابور الخاطئ. ماذا تفعل؟",
   "options": [
    "أمر رغم ذلك وأسوّي الأمر عبر الإنترنت",
    "أغيّر الطابور في أقرب وقت ممكن، بحذر",
    "أتوقف على شريط التوقف الاضطراري قبل بوابة الرسوم"
   ],
   "explication": "تغيّر الطابور مبكراً وبأمان، قبل الأعمدة بمسافة كافية. لا توقف أبداً على شريط التوقف الاضطراري لهذا الغرض."
  }
 },
 "p5q13": {
  "en": {
   "enonce": "Is there a legal MINIMUM speed on the motorway (right-hand lane)?",
   "options": [
    "60 km/h",
    "80 km/h",
    "No, there is no legal minimum"
   ],
   "explication": "No legal minimum in France. But driving too slowly creates a real danger — below 60, it's not advised."
  },
  "ar": {
   "enonce": "هل توجد سرعة دنيا قانونية على الطريق السريع (المسار الأيمن)؟",
   "options": [
    "60 km/h",
    "80 km/h",
    "لا، ليس هناك حد أدنى قانوني"
   ],
   "explication": "لا يوجد حد أدنى قانوني في فرنسا. لكن السير ببطء شديد يخلق خطراً حقيقياً — دون 60، الأمر غير محبّذ."
  }
 },
 "p5q14": {
  "en": {
   "enonce": "Variable message signs display 70 km/h. Are you required to obey?",
   "options": [
    "No, it's just for guidance",
    "Yes, they carry the force of law",
    "Only if a traffic jam is signalled"
   ],
   "explication": "Variable message signs count just as much as a fixed sign. 70 displayed = 70 mandatory."
  },
  "ar": {
   "enonce": "لوحات مضيئة متغيّرة تعرض 70 km/h. هل يلزمك الالتزام بها؟",
   "options": [
    "لا، إنها مجرد إشارة إرشادية",
    "نعم، لها قوة القانون",
    "فقط إذا أُشير إلى وجود ازدحام"
   ],
   "explication": "اللوحات ذات الرسائل المتغيّرة لها القيمة نفسها كلوحة ثابتة. 70 معروضة = 70 إلزامية."
  }
 },
 "p5q15": {
  "en": {
   "enonce": "You leave the motorway after 2 hours at 130 km/h. What trap awaits you?",
   "options": [
    "None, nothing in particular",
    "I risk underestimating my speed in town — the tunnel effect",
    "I drive better, I'm warmed up"
   ],
   "explication": "After 2 hours at 130, 50 in town feels ultra slow. Your perception is distorted: trust the speedometer, not your feelings."
  },
  "ar": {
   "enonce": "تخرج من الطريق السريع بعد ساعتين عند 130 km/h. ما الفخّ الذي ينتظرك؟",
   "options": [
    "لا شيء، لا شيء بالذات",
    "قد أقلّل من تقدير سرعتي داخل المدينة — تأثير النفق",
    "أقود بشكل أفضل، فأنا متهيّئ"
   ],
   "explication": "بعد ساعتين عند 130، تبدو الـ50 داخل المدينة بطيئة للغاية. إدراكك مضلّل: ثق بعدّاد السرعة، لا بإحساسك."
  }
 },
 "p6q1": {
  "en": {
   "enonce": "Behind the wheel, what is the maximum blood alcohol level allowed?",
   "options": [
    "0.2 g/L",
    "0.5 g/L",
    "0.8 g/L"
   ],
   "explication": "0.5 g/L of blood (that is 0.25 mg/L of exhaled air). On a probationary licence it's 0.2 g/L — almost zero."
  },
  "ar": {
   "enonce": "أثناء القيادة، ما هي النسبة القصوى المسموح بها للكحول في الدم؟",
   "options": [
    "0.2 غ/ل",
    "0.5 غ/ل",
    "0.8 غ/ل"
   ],
   "explication": "0.5 غ/ل من الدم (أي 0.25 مغ/ل من هواء الزفير). في رخصة القيادة تحت الاختبار تكون 0.2 غ/ل — أي شبه معدومة."
  }
 },
 "p6q2": {
  "en": {
   "enonce": "On a probationary licence, how many points do you start with?",
   "options": [
    "6 points",
    "8 points",
    "12 points"
   ],
   "explication": "6 points at the start. You rise to 12 after 3 years with no offence (2 years with accompanied driving)."
  },
  "ar": {
   "enonce": "في رخصة القيادة تحت الاختبار، كم نقطة تملك في البداية؟",
   "options": [
    "6 نقاط",
    "8 نقاط",
    "12 نقطة"
   ],
   "explication": "6 نقاط في البداية. ترتفع إلى 12 بعد 3 سنوات دون مخالفة (سنتان مع القيادة المرافَقة)."
  }
 },
 "p6q3": {
  "en": {
   "enonce": "Who must wear a seatbelt in a car?",
   "options": [
    "Only in the front",
    "All passengers, front and back",
    "Only the driver"
   ],
   "explication": "Everyone, in every seat. The driver is responsible for unbelted underage passengers."
  },
  "ar": {
   "enonce": "من الذي يجب أن يربط حزام الأمان في السيارة؟",
   "options": [
    "فقط في المقاعد الأمامية",
    "جميع الركاب، في الأمام كما في الخلف",
    "فقط السائق"
   ],
   "explication": "الجميع، في كل المقاعد. السائق مسؤول عن الركاب القاصرين غير المربوطين."
  }
 },
 "p6q4": {
  "en": {
   "enonce": "What is the minimum tread depth of a tyre?",
   "options": [
    "1 mm",
    "1.6 mm",
    "3 mm"
   ],
   "explication": "1.6 mm minimum. Below that, the tyre no longer clears water and the risk of aquaplaning climbs."
  },
  "ar": {
   "enonce": "ما هو العمق الأدنى لأخاديد الإطار؟",
   "options": [
    "1 مم",
    "1.6 مم",
    "3 مم"
   ],
   "explication": "1.6 مم كحد أدنى. تحت ذلك، لا يعود الإطار يصرّف الماء ويرتفع خطر الانزلاق المائي."
  }
 },
 "p6q5": {
  "en": {
   "enonce": "On a long trip, how often should you take a break?",
   "options": [
    "About every 2 hours",
    "Every 5 hours",
    "Only if I feel tired"
   ],
   "explication": "A break of at least 15 minutes every 2 hours, even without feeling tired. Drowsiness comes without warning."
  },
  "ar": {
   "enonce": "في رحلة طويلة، كل كم من الوقت يجب أخذ استراحة؟",
   "options": [
    "كل ساعتين تقريباً",
    "كل 5 ساعات",
    "فقط إذا شعرت بالتعب"
   ],
   "explication": "استراحة لا تقل عن 15 دقيقة كل ساعتين، حتى دون الشعور بالتعب. النعاس يأتي دون سابق إنذار."
  }
 },
 "p6q6": {
  "en": {
   "enonce": "A rear-facing baby seat fitted in the front: what about the airbag?",
   "options": [
    "Leave it turned on",
    "Turn it off first",
    "Doesn't matter after 6 months"
   ],
   "explication": "Never leave the passenger airbag active in front of a rear-facing seat: in a crash it would seriously injure the baby. Turn it off first."
  },
  "ar": {
   "enonce": "مقعد رضيع موجّه عكس اتجاه السير، مركّب في الأمام: وماذا عن الوسادة الهوائية؟",
   "options": [
    "نتركها مفعّلة",
    "نعطّلها أولاً",
    "لا يهم بعد 6 أشهر"
   ],
   "explication": "لا تُترك الوسادة الهوائية للراكب مفعّلة أبداً أمام مقعد موجّه عكس السير: عند الاصطدام تُصيب الرضيع إصابة بالغة. تُعطَّل مسبقاً."
  }
 },
 "p6q7": {
  "en": {
   "enonce": "A triangular sign pointing downwards means?",
   "options": [
    "Stop",
    "Give way",
    "No entry"
   ],
   "explication": "A downward-pointing triangle means give way: you slow down and let others pass, without necessarily stopping (unlike STOP)."
  },
  "ar": {
   "enonce": "علامة مثلثة رأسها نحو الأسفل تعني؟",
   "options": [
    "قف",
    "امنح الأولوية",
    "ممنوع الدخول"
   ],
   "explication": "المثلث الذي رأسه نحو الأسفل = امنح الأولوية: تُبطئ وتترك الآخرين يمرّون، دون أن تتوقف بالضرورة (على عكس علامة قف STOP)."
  }
 },
 "p6q8": {
  "en": {
   "enonce": "In broad daylight, in heavy rain, which lights do you switch on?",
   "options": [
    "None, it's daytime",
    "Dipped headlights",
    "Full-beam headlights"
   ],
   "explication": "Dipped headlights as soon as visibility drops (rain, fog), even in daytime: to see and above all to be seen."
  },
  "ar": {
   "enonce": "في وضح النهار، تحت مطر غزير، أي أضواء تشغّل؟",
   "options": [
    "لا شيء، النهار مضيء",
    "أضواء القيادة المنخفضة",
    "الأضواء العالية"
   ],
   "explication": "أضواء القيادة المنخفضة بمجرد تراجع الرؤية (مطر، ضباب)، حتى في النهار: لترى وقبل كل شيء لتُرى."
  }
 },
 "p6q9": {
  "en": {
   "enonce": "When should you use the rear fog lights?",
   "options": [
    "In heavy rain",
    "Only in thick fog or snow",
    "At night on the motorway"
   ],
   "explication": "Reserved for dense fog or snow. In the rain they dazzle those behind you — it's even forbidden."
  },
  "ar": {
   "enonce": "متى تستعمل أضواء الضباب الخلفية؟",
   "options": [
    "تحت المطر الغزير",
    "في الضباب أو الثلج الكثيف فقط",
    "ليلاً على الطريق السيار"
   ],
   "explication": "مخصصة للضباب أو الثلج الكثيف. تحت المطر تُبهر من يسير خلفك — بل هي ممنوعة."
  }
 },
 "p6q10": {
  "en": {
   "enonce": "To use less fuel, what is the right habit?",
   "options": [
    "Driving at high revs",
    "Anticipating and easing off the accelerator early",
    "Accelerating then braking often"
   ],
   "explication": "Anticipate, ease off the accelerator early and use engine braking: less fuel, less wear, less CO₂."
  },
  "ar": {
   "enonce": "لاستهلاك وقود أقل، ما هو التصرّف الصحيح؟",
   "options": [
    "القيادة بعدد دورات مرتفع",
    "التوقّع ورفع القدم عن الدواسة مبكراً",
    "التسارع ثم الفرملة كثيراً"
   ],
   "explication": "التوقّع، ورفع القدم عن الدواسة مبكراً، واستعمال فرملة المحرك: وقود أقل، تآكل أقل، ثاني أكسيد الكربون أقل."
  }
 },
 "p6q11": {
  "en": {
   "enonce": "In France, which number do you call for the fire brigade?",
   "options": [
    "15",
    "17",
    "18"
   ],
   "explication": "18 = fire brigade. 15 = ambulance service (SAMU), 17 = police, 112 = European emergency number."
  },
  "ar": {
   "enonce": "في فرنسا، أي رقم تتصل به لطلب رجال الإطفاء؟",
   "options": [
    "15",
    "17",
    "18"
   ],
   "explication": "18 = رجال الإطفاء. 15 = الإسعاف (SAMU)، 17 = الشرطة/الدرك، 112 = رقم الطوارئ الأوروبي."
  }
 },
 "p6q12": {
  "en": {
   "enonce": "Driving after using cannabis is?",
   "options": [
    "Tolerated in small amounts",
    "Forbidden, zero tolerance",
    "Allowed after a few hours"
   ],
   "explication": "Zero tolerance for drugs behind the wheel, whatever the amount. The penalties are heavy."
  },
  "ar": {
   "enonce": "القيادة بعد تعاطي القنّب هي؟",
   "options": [
    "مسموحة بكمية قليلة",
    "ممنوعة، لا تسامح إطلاقاً",
    "مسموحة بعد بضع ساعات"
   ],
   "explication": "لا تسامح إطلاقاً مع المخدرات أثناء القيادة، مهما كانت الكمية. العقوبات ثقيلة."
  }
 },
 "p6q13": {
  "en": {
   "enonce": "Emergency stop outside town: what do you do before getting out of the car?",
   "options": [
    "Put on my hi-vis vest",
    "Get out quickly to place the triangle",
    "Wait for help inside"
   ],
   "explication": "Vest BEFORE getting out, then the triangle about 30 m before, and everyone behind the crash barrier. The order matters."
  },
  "ar": {
   "enonce": "توقّف اضطراري خارج المدينة: ماذا تفعل قبل الخروج من السيارة؟",
   "options": [
    "أرتدي سترتي العاكسة",
    "أخرج بسرعة لوضع المثلث",
    "أنتظر النجدة في الداخل"
   ],
   "explication": "السترة قبل الخروج، ثم المثلث على بعد نحو 30 م قبل السيارة، والجميع خلف الحاجز الواقي. الترتيب مهم."
  }
 },
 "p6q14": {
  "en": {
   "enonce": "On a probationary licence, your top speed on the motorway?",
   "options": [
    "110 km/h",
    "120 km/h",
    "130 km/h"
   ],
   "explication": "110 km/h instead of 130 during the probationary period. You must also display the \"A\" disc at the back."
  },
  "ar": {
   "enonce": "في رخصة القيادة تحت الاختبار، ما هي سرعتك القصوى على الطريق السيار؟",
   "options": [
    "110 كم/س",
    "120 كم/س",
    "130 كم/س"
   ],
   "explication": "110 كم/س بدل 130 خلال فترة الاختبار. عليك أيضاً وضع قرص «A» في الخلف."
  }
 },
 "p6q15": {
  "en": {
   "enonce": "Outside town, how much room do you leave when overtaking a cyclist?",
   "options": [
    "0.5 m",
    "1 m",
    "1.5 m"
   ],
   "explication": "1.50 m outside town (1 m in town). The faster you go, the more space you need."
  },
  "ar": {
   "enonce": "خارج المدينة، كم مسافة تترك عند تجاوز دراج؟",
   "options": [
    "0.5 م",
    "1 م",
    "1.5 م"
   ],
   "explication": "1.50 م خارج المدينة (1 م داخلها). كلما زادت سرعتك، زادت المسافة اللازمة."
  }
 },
 "p7q1": {
  "en": {
   "enonce": "Thick fog in broad daylight. Which lights do you turn on?",
   "options": [
    "Full beam headlights to cut through the fog",
    "Dipped headlights (+ front fog lights)",
    "Just the parking lights"
   ],
   "explication": "Dipped headlights plus front fog lights if needed. Above all NOT full beam: fog reflects the light back and dazzles you."
  },
  "ar": {
   "enonce": "ضباب كثيف في وضح النهار. أي أضواء تُشغّل؟",
   "options": [
    "الأضواء العالية لاختراق الضباب",
    "الأضواء المنخفضة (+ أضواء الضباب الأمامية)",
    "أضواء الوقوف فقط"
   ],
   "explication": "الأضواء المنخفضة مع أضواء الضباب الأمامية عند الحاجة. والأهم: لا تستخدم الأضواء العالية أبداً، فالضباب يعكس الضوء ويُبهر عينيك."
  }
 },
 "p7q2": {
  "en": {
   "enonce": "You can see less than 50 m ahead (thick fog). Your maximum speed?",
   "options": [
    "50 km/h everywhere",
    "70 km/h",
    "90 km/h"
   ],
   "explication": "Visibility under 50 m = 50 km/h maximum, even on the motorway. The rule is the same everywhere."
  },
  "ar": {
   "enonce": "ترى أقل من 50 م أمامك (ضباب كثيف). ما سرعتك القصوى؟",
   "options": [
    "50 km/h في كل مكان",
    "70 km/h",
    "90 km/h"
   ],
   "explication": "الرؤية أقل من 50 م = 50 km/h كحد أقصى، حتى على الطريق السريع. القاعدة نفسها في كل مكان."
  }
 },
 "p7q3": {
  "en": {
   "enonce": "When do you use full beam (main beam headlights)?",
   "options": [
    "In a well-lit town",
    "Outside built-up areas, unlit road and no one coming",
    "Always, as soon as it gets dark"
   ],
   "explication": "Full beam = unlit road with no one coming the other way. You switch back to dipped beam as soon as a vehicle approaches or you are following one."
  },
  "ar": {
   "enonce": "متى تستخدم الأضواء العالية (أضواء الطريق)؟",
   "options": [
    "في المدينة جيدة الإضاءة",
    "خارج المناطق العمرانية، طريق غير مضاء ولا أحد قادم أمامك",
    "دائماً، بمجرد أن يحل الليل"
   ],
   "explication": "الأضواء العالية = طريق غير مضاء ولا أحد قادم في الاتجاه المقابل. تعود إلى الأضواء المنخفضة بمجرد اقتراب مركبة أو عند سيرك خلف واحدة."
  }
 },
 "p7q4": {
  "en": {
   "enonce": "At night, an oncoming vehicle dazzles you. What do you do?",
   "options": [
    "I stare at its headlights to follow it",
    "I look at the right edge of my lane and slow down",
    "I put on my full beam too"
   ],
   "explication": "Never stare at the headlights: use the right edge of your lane as a guide and slow down while your sight recovers."
  },
  "ar": {
   "enonce": "في الليل، تُبهرك مركبة قادمة أمامك. ماذا تفعل؟",
   "options": [
    "أُحدّق في أضوائها لأتبعها",
    "أنظر إلى الحافة اليمنى لمساري وأُبطئ",
    "أُشغّل أضوائي العالية أنا أيضاً"
   ],
   "explication": "لا تُحدّق في الأضواء أبداً: اتخذ الحافة اليمنى لمسارك كمرجع وأبطئ حتى تستعيد عينك رؤيتها."
  }
 },
 "p7q5": {
  "en": {
   "enonce": "Snow: which wheels do you fit the chains on?",
   "options": [
    "The driven wheels (front if front-wheel drive)",
    "Any of them",
    "The rear wheels, always"
   ],
   "explication": "Chains go on the driven wheels. The B26 sign (tyre + chain) makes them compulsory."
  },
  "ar": {
   "enonce": "ثلج: على أي عجلات تُركّب السلاسل؟",
   "options": [
    "العجلات المُحرّكة (الأمامية إن كان الدفع أمامياً)",
    "أي عجلات كانت",
    "العجلات الخلفية، دائماً"
   ],
   "explication": "تُركّب السلاسل على العجلات المُحرّكة. علامة B26 (إطار + سلسلة) تجعلها إلزامية."
  }
 },
 "p7q6": {
  "en": {
   "enonce": "In hard frost, where does black ice appear first?",
   "options": [
    "On bridges and shaded areas",
    "In full sun",
    "Only on downhill stretches"
   ],
   "explication": "Bridges, viaducts and shaded areas freeze first (air flows underneath). Stay wary even if the road looks dry."
  },
  "ar": {
   "enonce": "في البرد القارس، أين يظهر الجليد أولاً؟",
   "options": [
    "على الجسور والمناطق المظللة",
    "تحت أشعة الشمس المباشرة",
    "في المنحدرات فقط"
   ],
   "explication": "الجسور والمعابر العلوية والمناطق المظللة تتجمد أولاً (لأن الهواء يمر تحتها). كن حذراً حتى لو بدا الطريق جافاً."
  }
 },
 "p7q7": {
  "en": {
   "enonce": "How do you avoid aquaplaning in the rain?",
   "options": [
    "Drive fast to \"slice\" through the water",
    "Reduce your speed and keep good tyres",
    "Brake in sharp jabs"
   ],
   "explication": "Reduced speed plus tyres with enough tread. Above a certain speed the water can no longer drain away and you start to float."
  },
  "ar": {
   "enonce": "كيف تتجنب الانزلاق المائي تحت المطر؟",
   "options": [
    "القيادة بسرعة لِـ«شق» الماء",
    "تخفيف السرعة والحفاظ على إطارات جيدة",
    "الفرملة بضربات متقطعة"
   ],
   "explication": "سرعة مخففة مع إطارات ذات نقشة كافية. فوق سرعة معينة لا يعود الماء يَنصرف من تحت الإطارات فتطفو المركبة."
  }
 },
 "p7q8": {
  "en": {
   "enonce": "Strong side gust of wind (leaving a tunnel, on a bridge). What do you do?",
   "options": [
    "I speed up to get through fast",
    "I hold the wheel firmly and slow down",
    "I loosen my grip on the wheel a little"
   ],
   "explication": "Hold the wheel firmly, reduce speed. Gusts catch you out especially when leaving a tunnel and on bridges."
  },
  "ar": {
   "enonce": "هبّة رياح جانبية قوية (عند الخروج من نفق أو على جسر). ماذا تفعل؟",
   "options": [
    "أُسرّع لأعبر بسرعة",
    "أُمسك المقود بإحكام وأُبطئ",
    "أُرخي المقود قليلاً"
   ],
   "explication": "أمسك المقود بإحكام وخفّف السرعة. الهبّات تُفاجئك خاصة عند الخروج من الأنفاق وعلى الجسور."
  }
 },
 "p7q9": {
  "en": {
   "enonce": "Which sign warns you that you're falling asleep at the wheel?",
   "options": [
    "Repeated yawning and heavy eyelids",
    "Feeling a bit hungry",
    "Wanting to listen to music"
   ],
   "explication": "Yawning, heavy eyelids, a fixed stare = a microsleep is coming. The only cure: stop and sleep 15-20 min."
  },
  "ar": {
   "enonce": "ما العلامة التي تُنذر بالنعاس أثناء القيادة؟",
   "options": [
    "تثاؤب متكرر وثقل في الجفون",
    "شعور بسيط بالجوع",
    "الرغبة في سماع الموسيقى"
   ],
   "explication": "التثاؤب وثقل الجفون وتجمّد النظر = نوم خاطف وشيك. العلاج الوحيد: التوقف والنوم 15-20 دقيقة."
  }
 },
 "p7q10": {
  "en": {
   "enonce": "Are parking (side) lights enough to drive at night?",
   "options": [
    "Yes, in town",
    "No, never to drive",
    "Yes, outside built-up areas"
   ],
   "explication": "Parking lights are for being seen when stopped, not for lighting the road. To drive at night: dipped headlights at least."
  },
  "ar": {
   "enonce": "هل تكفي أضواء الوقوف للقيادة ليلاً؟",
   "options": [
    "نعم، في المدينة",
    "لا، أبداً للسير",
    "نعم، خارج المناطق العمرانية"
   ],
   "explication": "أضواء الوقوف مخصصة لِتُرى عند التوقف، لا لإضاءة الطريق. للقيادة ليلاً: الأضواء المنخفضة كحد أدنى."
  }
 },
 "p7q11": {
  "en": {
   "enonce": "In the rain, your safety distance?",
   "options": [
    "The same as in the dry",
    "At least doubled",
    "Reduced, because we drive slower"
   ],
   "explication": "Wet ground = longer braking. You double your distance: the 2-second rule becomes about 4 seconds."
  },
  "ar": {
   "enonce": "تحت المطر، ما مسافة الأمان؟",
   "options": [
    "نفسها كما في الجفاف",
    "مُضاعفة على الأقل",
    "مُخفّضة، لأننا نسير أبطأ"
   ],
   "explication": "أرض مبللة = فرملة أطول. تُضاعف مسافتك: قاعدة الثانيتين تصبح نحو أربع ثوانٍ."
  }
 },
 "p7q12": {
  "en": {
   "enonce": "You're about to leave a tunnel in broad daylight. What's the trap?",
   "options": [
    "None, I keep my speed",
    "The glare: I slowed down before and I let my eyes adjust",
    "Putting on sunglasses inside the tunnel"
   ],
   "explication": "Going from shade to light dazzles you: anticipate by slowing down before the exit, giving your eyes time to adjust."
  },
  "ar": {
   "enonce": "أنت على وشك الخروج من نفق في وضح النهار. ما الفخ؟",
   "options": [
    "لا شيء، أُحافظ على سرعتي",
    "الإبهار: خفّفت السرعة قبلها وأترك عينيّ تتكيفان",
    "وضع نظارة شمسية داخل النفق"
   ],
   "explication": "الانتقال من الظل إلى الضوء يُبهر: تحسّب لذلك بتخفيف السرعة قبل المخرج، حتى تتكيف عيناك."
  }
 },
 "p7q13": {
  "en": {
   "enonce": "Forced stop in a tunnel. What do you do?",
   "options": [
    "I stay in the car with the engine running",
    "Hazard lights, pull over, switch off the engine, reach an emergency exit",
    "I make a U-turn"
   ],
   "explication": "In a tunnel: hazard lights, pull over to the right, switch off the engine, reach an emergency exit on foot. Never make a U-turn."
  },
  "ar": {
   "enonce": "توقف اضطراري داخل نفق. ماذا تفعل؟",
   "options": [
    "أبقى في السيارة والمحرك يعمل",
    "أضواء التحذير، أصطف جانباً، أُطفئ المحرك، وأصل إلى مخرج طوارئ",
    "أستدير عائداً من حيث أتيت"
   ],
   "explication": "في النفق: أضواء التحذير، اصطف إلى اليمين، أطفئ المحرك، وصِل إلى مخرج طوارئ سيراً على الأقدام. لا تستدر للعودة أبداً."
  }
 },
 "p7q14": {
  "en": {
   "enonce": "On a snow-covered road, how do you brake?",
   "options": [
    "Sharp braking",
    "I anticipate, I brake gently, I use engine braking",
    "I never brake"
   ],
   "explication": "All gently: anticipate and use engine braking. A sharp brake locks the wheels and makes you skid."
  },
  "ar": {
   "enonce": "على طريق مغطى بالثلج، كيف تفرمل؟",
   "options": [
    "فرملة مفاجئة",
    "أتحسّب، أفرمل برفق، وأستخدم فرملة المحرك",
    "لا أفرمل أبداً"
   ],
   "explication": "كل شيء برفق: تحسّب واستخدم فرملة المحرك. الفرملة المفاجئة تُقفل العجلات وتُسبب الانزلاق."
  }
 },
 "p7q15": {
  "en": {
   "enonce": "At night, at what speed should you drive relative to your visibility?",
   "options": [
    "At the permitted speed, no matter what",
    "So that I can stop within the area lit by my headlights",
    "By feel"
   ],
   "explication": "The golden rule at night: your speed must let you stop within the lit distance. Otherwise you're driving \"faster than your eyes can see\"."
  },
  "ar": {
   "enonce": "في الليل، بأي سرعة تسير مقارنةً بمدى رؤيتك؟",
   "options": [
    "بالسرعة المسموح بها، مهما حدث",
    "بحيث أتمكن من التوقف داخل المنطقة التي تُضيئها أضوائي",
    "حسب الإحساس"
   ],
   "explication": "القاعدة الذهبية ليلاً: يجب أن تسمح لك سرعتك بالتوقف داخل المسافة المُضاءة. وإلا فأنت تسير «أسرع مما تراه عيناك»."
  }
 },
 "p8q1": {
  "en": {
   "enonce": "A round sign with a red border means what?",
   "options": [
    "Danger",
    "Prohibition",
    "Obligation"
   ],
   "explication": "A round sign with a red border = prohibition (no entry, speed limit…). A blue circle = obligation, a triangle = danger."
  },
  "ar": {
   "enonce": "لافتة دائرية بحافة حمراء، ماذا تعني؟",
   "options": [
    "خطر",
    "منع",
    "إلزام"
   ],
   "explication": "دائرة بحافة حمراء = منع (ممنوع الدخول، السرعة القصوى…). الدائرة الزرقاء = إلزام، والمثلث = خطر."
  }
 },
 "p8q2": {
  "en": {
   "enonce": "A round sign that is entirely blue means what?",
   "options": [
    "Prohibition",
    "Obligation",
    "Just information"
   ],
   "explication": "A blue circle = obligation (compulsory direction, compulsory cycle path…)."
  },
  "ar": {
   "enonce": "لافتة دائرية زرقاء بالكامل، ماذا تعني؟",
   "options": [
    "منع",
    "إلزام",
    "مجرد إرشاد"
   ],
   "explication": "دائرة زرقاء = إلزام (اتجاه إجباري، مسار دراجات إجباري…)."
  }
 },
 "p8q3": {
  "en": {
   "enonce": "A triangular sign with a red border warns of what?",
   "options": [
    "A danger",
    "A prohibition",
    "A direction"
   ],
   "explication": "A triangle with a red border = danger: it warns you, so ease off the gas and stay alert."
  },
  "ar": {
   "enonce": "لافتة مثلثة بحافة حمراء، بماذا تُنذر؟",
   "options": [
    "بخطر",
    "بمنع",
    "باتجاه"
   ],
   "explication": "مثلث بحافة حمراء = خطر: إنه يُنذرك، فارفع قدمك عن دواسة الوقود وابقَ منتبهاً."
  }
 },
 "p8q4": {
  "en": {
   "enonce": "At a STOP sign, where exactly do you stop?",
   "options": [
    "Level with the sign",
    "At the white line across the road",
    "In the middle of the junction"
   ],
   "explication": "Come to a full stop at the line on the road. No line? Stop level with the sign, before the junction."
  },
  "ar": {
   "enonce": "عند لافتة STOP، أين تتوقف بالضبط؟",
   "options": [
    "عند مستوى اللافتة",
    "عند الخط الأبيض العرضي على الأرض",
    "في وسط التقاطع"
   ],
   "explication": "توقف تام عند الخط على الأرض. لا يوجد خط؟ تتوقف عند مستوى اللافتة، قبل التقاطع."
  }
 },
 "p8q5": {
  "en": {
   "enonce": "Slanted arrows on the road point to the right. What does that mean?",
   "options": [
    "You can still overtake",
    "Move back in: a solid line is coming",
    "Bus-only lane"
   ],
   "explication": "These merge arrows warn of a solid line ahead: finish your overtake and move back to the right."
  },
  "ar": {
   "enonce": "أسهم مائلة على الأرض تشير إلى اليمين. ماذا يعني ذلك؟",
   "options": [
    "لا يزال بإمكانك التجاوز",
    "عُد إلى اليمين: خط متصل قادم",
    "مسار مخصص للحافلات"
   ],
   "explication": "أسهم العودة هذه تُنذر بخط متصل: أنهِ تجاوزك وعُد إلى اليمين."
  }
 },
 "p8q6": {
  "en": {
   "enonce": "What is the difference between \"Give way\" and \"STOP\"?",
   "options": [
    "None",
    "Give way doesn't require stopping, STOP does",
    "STOP doesn't require stopping"
   ],
   "explication": "STOP = a full stop is mandatory. Give way = you slow down and yield, without stopping if the way is clear."
  },
  "ar": {
   "enonce": "ما الفرق بين «افسح الطريق» و«STOP»؟",
   "options": [
    "لا فرق",
    "افسح الطريق لا يفرض التوقف، أما STOP فيفرضه",
    "STOP لا يفرض التوقف"
   ],
   "explication": "STOP = توقف تام إجباري. افسح الطريق = تبطئ وتفسح، دون توقف إذا كان الطريق خالياً."
  }
 },
 "p8q7": {
  "en": {
   "enonce": "A flashing amber light means what?",
   "options": [
    "Mandatory stop",
    "Caution: go through while respecting priorities",
    "Lane closed"
   ],
   "explication": "Flashing amber = caution junction: you go through while giving way according to the priority rules of the spot."
  },
  "ar": {
   "enonce": "ضوء برتقالي وامض، ماذا يعني؟",
   "options": [
    "توقف إجباري",
    "حذر: تعبر مع احترام أولويات المرور",
    "مسار مغلق"
   ],
   "explication": "برتقالي وامض = تقاطع حَذِر: تعبر مع إفساح الطريق وفق قواعد الأولوية في المكان."
  }
 },
 "p8q8": {
  "en": {
   "enonce": "A flashing red light (level crossing), what do you do?",
   "options": [
    "I go through if I don't see a train",
    "Absolute stop, I don't cross",
    "I only slow down"
   ],
   "explication": "Flashing red = absolute stop, typically at level crossings. You never cross."
  },
  "ar": {
   "enonce": "ضوء أحمر وامض (مزلقان سكة حديد)، ماذا تفعل؟",
   "options": [
    "أعبر إن لم أرَ قطاراً",
    "توقف مطلق، لا أعبر",
    "أبطئ فقط"
   ],
   "explication": "أحمر وامض = توقف مطلق، عادةً عند مزالق السكك الحديدية. لا نعبر أبداً."
  }
 },
 "p8q9": {
  "en": {
   "enonce": "A solid white line, can you cross it?",
   "options": [
    "No, never",
    "Yes, to overtake",
    "Yes, to park"
   ],
   "explication": "A solid line = you neither cross it nor straddle it. Forcing it is a serious offence."
  },
  "ar": {
   "enonce": "خط أبيض متصل، هل يمكنك اجتيازه؟",
   "options": [
    "لا، أبداً",
    "نعم، للتجاوز",
    "نعم، للتوقف"
   ],
   "explication": "خط متصل = لا نجتازه ولا ندوس عليه. تجاوزه مخالفة جسيمة."
  }
 },
 "p8q10": {
  "en": {
   "enonce": "A triangular sign with two children warns of what?",
   "options": [
    "A playground",
    "A place with children around (school)",
    "Children not allowed"
   ],
   "explication": "Danger: an area used by children (school exit). Reduce your speed and stay fully alert."
  },
  "ar": {
   "enonce": "لافتة مثلثة عليها طفلان، بماذا تُنذر؟",
   "options": [
    "بمنطقة ألعاب",
    "بمكان يرتاده الأطفال (مدرسة)",
    "بمنع دخول الأطفال"
   ],
   "explication": "خطر: مكان يرتاده الأطفال (مخرج مدرسة). خفّض السرعة وكن في أقصى درجات الانتباه."
  }
 },
 "p8q11": {
  "en": {
   "enonce": "The town-entrance sign (with the town name) sets what?",
   "options": [
    "50 km/h unless stated otherwise",
    "30 km/h",
    "No limit"
   ],
   "explication": "Entering a built-up area = 50 km/h by default, until the exit sign (the same one, crossed out)."
  },
  "ar": {
   "enonce": "لافتة دخول التجمّع السكاني (اسم المدينة) تفرض ماذا؟",
   "options": [
    "50 km/h ما لم يُذكر خلاف ذلك",
    "30 km/h",
    "لا يوجد حدّ للسرعة"
   ],
   "explication": "الدخول إلى تجمّع سكاني = 50 km/h افتراضياً، حتى لافتة الخروج (نفسها، مشطوبة بخط)."
  }
 },
 "p8q12": {
  "en": {
   "enonce": "A hatched area (chevron markings) on the road, can you drive on it?",
   "options": [
    "Yes, if I'm in a hurry",
    "No, it's a no-go zone",
    "Yes, to overtake"
   ],
   "explication": "Chevron markings mark a no-go zone: you don't drive on it and you don't stop on it."
  },
  "ar": {
   "enonce": "منطقة مخططة (خطوط مائلة) على الأرض، هل يمكنك القيادة عليها؟",
   "options": [
    "نعم، إن كنت مستعجلاً",
    "لا، إنها منطقة ممنوعة على المرور",
    "نعم، للتجاوز"
   ],
   "explication": "الخطوط المائلة تحدّد منطقة ممنوعة: لا نقود عليها ولا نتوقف فوقها."
  }
 },
 "p8q13": {
  "en": {
   "enonce": "A round grey sign with a diagonal line across it means what?",
   "options": [
    "The start of a prohibition",
    "The end of the previous prohibition",
    "Parking allowed"
   ],
   "explication": "A grey circle crossed out = the end of the limit or prohibition that came before (e.g. end of the 70 zone)."
  },
  "ar": {
   "enonce": "لافتة دائرية رمادية مشطوبة بخط قُطري، ماذا تعني؟",
   "options": [
    "بداية منع",
    "نهاية المنع السابق",
    "السماح بالوقوف"
   ],
   "explication": "دائرة رمادية مشطوبة = نهاية الحدّ أو المنع الذي كان سابقاً (مثلاً: نهاية منطقة الـ70)."
  }
 },
 "p8q14": {
  "en": {
   "enonce": "A blue square sign with a large \"P\" means what?",
   "options": [
    "No parking",
    "Parking allowed",
    "Paid parking required"
   ],
   "explication": "A blue square with \"P\" = parking allowed. The conditions (paid, time limit) are shown on a small plate underneath."
  },
  "ar": {
   "enonce": "لافتة مربعة زرقاء عليها حرف «P» كبير، ماذا تعني؟",
   "options": [
    "ممنوع الوقوف",
    "مسموح الوقوف",
    "الوقوف مدفوع إلزامي"
   ],
   "explication": "مربع أزرق «P» = مسموح الوقوف. الشروط (مدفوع، المدة) مبيّنة في لوحة صغيرة أسفلها."
  }
 },
 "p8q15": {
  "en": {
   "enonce": "A cycle lane, what exactly is it?",
   "options": [
    "A path physically separated from the road",
    "A lane on the roadway, just marked on the ground",
    "A path reserved for pedestrians"
   ],
   "explication": "A cycle lane is on the roadway (just a line). A cycle track is separated. Both are reserved for bikes."
  },
  "ar": {
   "enonce": "مسار الدراجات، ما هو بالضبط؟",
   "options": [
    "مسار مفصول مادياً عن الطريق",
    "مسار على سطح الطريق، مجرد علامة على الأرض",
    "ممر مخصص للمشاة"
   ],
   "explication": "شريط الدراجات على سطح الطريق (مجرد خط). أما المسار المستقل فمفصول. كلاهما مخصص للدراجات."
  }
 },
 "p9q1": {
  "en": {
   "enonce": "Long mountain descent: how do you brake safely?",
   "options": [
    "Keep your foot on the brake the whole time",
    "Engine braking (lower gear) + short brake taps",
    "In neutral to save fuel"
   ],
   "explication": "Use a lower gear for engine braking, and brake in short bursts. Constant braking overheats the brakes and they eventually fail."
  },
  "ar": {
   "enonce": "نزول طويل من الجبل: كيف تفرمل بأمان؟",
   "options": [
    "إبقاء قدمك على الفرامل باستمرار",
    "الكبح بالمحرك (سرعة أدنى) + فرملات قصيرة",
    "على الوضع المحايد لتوفير الوقود"
   ],
   "explication": "استخدم سرعة أدنى للكبح بالمحرك، وافرمل بضغطات قصيرة. الفرملة المستمرة تسخّن الفرامل حتى تتعطّل."
  }
 },
 "p9q2": {
  "en": {
   "enonce": "What is dangerous when going downhill?",
   "options": [
    "Driving in neutral or with the engine off",
    "Keeping a gear engaged",
    "Anticipating the bends"
   ],
   "explication": "Neutral or engine off = loss of engine braking (and sometimes power steering). Forbidden and dangerous."
  },
  "ar": {
   "enonce": "ما الخطر أثناء النزول؟",
   "options": [
    "السير على الوضع المحايد أو مع إطفاء المحرك",
    "إبقاء سرعة مُعشّقة",
    "توقّع المنعطفات"
   ],
   "explication": "الوضع المحايد أو إطفاء المحرك = فقدان الكبح بالمحرك (وأحياناً توجيه المقود المساعد). ممنوع وخطير."
  }
 },
 "p9q3": {
  "en": {
   "enonce": "Difficult passing on a narrow mountain road. Who pulls over?",
   "options": [
    "The one going down",
    "The one going up",
    "The bigger vehicle"
   ],
   "explication": "Priority goes to the one going up (harder to start again on a slope). The one going down pulls over or reverses."
  },
  "ar": {
   "enonce": "تجاوز صعب على طريق جبلي ضيّق. من يتنحّى؟",
   "options": [
    "من ينزل",
    "من يصعد",
    "المركبة الأكبر"
   ],
   "explication": "الأولوية لمن يصعد (أصعب أن ينطلق من جديد على المنحدر). من ينزل يتنحّى أو يرجع للخلف."
  }
 },
 "p9q4": {
  "en": {
   "enonce": "Blind bend: where do you position yourself?",
   "options": [
    "I cut the bend to go faster",
    "I stay well to the right, firmly in my lane",
    "I drive in the middle"
   ],
   "explication": "Stay tucked to the right in your lane: a vehicle could appear coming the other way. Cutting a bend is a serious mistake."
  },
  "ar": {
   "enonce": "منعطف بلا رؤية: أين تضع سيارتك؟",
   "options": [
    "أقطع المنعطف لأسير أسرع",
    "ألتزم اليمين جيداً ضمن مساري",
    "أسير في المنتصف"
   ],
   "explication": "ابقَ ملتصقاً باليمين ضمن مسارك: قد تظهر مركبة قادمة من الأمام. قطع المنعطف خطأ جسيم."
  }
 },
 "p9q5": {
  "en": {
   "enonce": "A sign shows \"10%\" on a descent. What does it mean?",
   "options": [
    "The distance remaining",
    "The steepness of the slope",
    "The recommended speed"
   ],
   "explication": "The percentage shows how steep the slope is. The higher it is, the sooner you use engine braking."
  },
  "ar": {
   "enonce": "لافتة تشير إلى «10 %» في النزول. ماذا تعني؟",
   "options": [
    "المسافة المتبقية",
    "درجة انحدار المنحدر",
    "السرعة المنصوح بها"
   ],
   "explication": "النسبة المئوية تشير إلى درجة انحدار المنحدر. كلما ارتفعت، بادرت أبكر إلى الكبح بالمحرك."
  }
 },
 "p9q6": {
  "en": {
   "enonce": "\"Slippery road\" sign (skidding car). What do you do?",
   "options": [
    "I speed up",
    "I slow down and avoid sudden moves",
    "I brake hard to be safe"
   ],
   "explication": "Risk of skidding: reduce speed, keep a smooth line, no sudden braking or steering."
  },
  "ar": {
   "enonce": "لافتة «طريق زلق» (سيارة تنزلق). ماذا تفعل؟",
   "options": [
    "أزيد السرعة",
    "أخفّف السرعة وأتجنّب الحركات المفاجئة",
    "أفرمل بقوة احتياطاً"
   ],
   "explication": "خطر الانزلاق: خفّف السرعة، حافظ على مسار سلس، بلا فرملة أو انعطاف مفاجئ."
  }
 },
 "p9q7": {
  "en": {
   "enonce": "Behind a slow truck going uphill, when do you overtake?",
   "options": [
    "As soon as possible, even on a bend",
    "On a straight stretch with good visibility",
    "By tailgating it to push it along"
   ],
   "explication": "You only overtake with clear visibility and a free lane. In the mountains, bends hide oncoming vehicles."
  },
  "ar": {
   "enonce": "خلف شاحنة بطيئة في الصعود، متى تتجاوز؟",
   "options": [
    "في أقرب فرصة، ولو في منعطف",
    "على مقطع مستقيم برؤية جيّدة",
    "بالالتصاق بها لدفعها للإسراع"
   ],
   "explication": "لا تتجاوز إلا برؤية واضحة ومسار خالٍ. في الجبل، تُخفي المنعطفات المركبات القادمة من الأمام."
  }
 },
 "p9q8": {
  "en": {
   "enonce": "You enter a mountain tunnel in broad daylight. What do you turn on?",
   "options": [
    "The low-beam headlights",
    "The high beams",
    "Nothing, it's daytime"
   ],
   "explication": "Low-beam headlights are required in a tunnel, even in daytime: to see and be seen."
  },
  "ar": {
   "enonce": "تدخل نفقاً جبلياً في وضح النهار. ماذا تُشعل؟",
   "options": [
    "الأنوار المنخفضة",
    "الأنوار العالية",
    "لا شيء، فالنهار مضيء"
   ],
   "explication": "الأنوار المنخفضة إلزامية في النفق، حتى نهاراً: لترى وتُرى."
  }
 },
 "p9q9": {
  "en": {
   "enonce": "A smell of burning brakes appears on a descent. What do you do?",
   "options": [
    "Nothing, it's normal",
    "Use more engine braking, and stop if needed to let them cool down",
    "I speed up to finish the descent"
   ],
   "explication": "The smell means the brakes are overheating: use engine braking more, and if needed stop safely to let them cool down."
  },
  "ar": {
   "enonce": "تظهر رائحة فرامل محترقة أثناء النزول. ماذا تفعل؟",
   "options": [
    "لا شيء، هذا طبيعي",
    "أستخدم الكبح بالمحرك أكثر، وأتوقّف عند الحاجة لتبرد",
    "أزيد السرعة لإنهاء النزول"
   ],
   "explication": "الرائحة تعني أن الفرامل تفرط في السخونة: استخدم الكبح بالمحرك أكثر، وعند الحاجة توقّف بأمان لتتركها تبرد."
  }
 },
 "p9q10": {
  "en": {
   "enonce": "Sign warning of animal crossings (deer). When should you be extra alert?",
   "options": [
    "At dawn and dusk",
    "At high noon",
    "Never, it's rare"
   ],
   "explication": "Animals cross mostly at dawn and dusk. Slow down and scan the roadsides."
  },
  "ar": {
   "enonce": "لافتة تنبّه لعبور الحيوانات (أيّل). متى تضاعف الانتباه؟",
   "options": [
    "عند الفجر والغسق",
    "في منتصف النهار",
    "أبداً، فهذا نادر"
   ],
   "explication": "تعبر الحيوانات غالباً عند الفجر والغسق. خفّف السرعة وراقب جوانب الطريق."
  }
 },
 "p9q11": {
  "en": {
   "enonce": "A coach is maneuvering in a tight hairpin bend. What do you do?",
   "options": [
    "I force my way through",
    "I wait until it has finished its maneuver",
    "I honk to hurry it along"
   ],
   "explication": "In a hairpin, a coach needs the full width: wait rather than getting stuck."
  },
  "ar": {
   "enonce": "حافلة تناور في منعطف حاد ضيّق. ماذا تفعل؟",
   "options": [
    "أفرض المرور",
    "أنتظر حتى تُنهي مناورتها",
    "أبوّق لأستعجلها"
   ],
   "explication": "في المنعطف الحاد، تحتاج الحافلة إلى كامل العرض: انتظر بدل أن تحشر نفسك."
  }
 },
 "p9q12": {
  "en": {
   "enonce": "Where is black ice most persistent in the mountains?",
   "options": [
    "In full sunlight at the summit",
    "On bridges and shaded slopes",
    "On clear straight stretches"
   ],
   "explication": "Shade and altitude = persistent black ice, especially on bridges and north-facing slopes. Stay wary even in fine weather."
  },
  "ar": {
   "enonce": "أين يبقى الجليد الأسود أكثر عناداً في الجبل؟",
   "options": [
    "تحت الشمس الساطعة في القمة",
    "على الجسور والمنحدرات المظلّلة",
    "على المقاطع المستقيمة المكشوفة"
   ],
   "explication": "الظل والارتفاع = جليد أسود عنيد، خاصة على الجسور والمنحدرات الشمالية. احذر حتى في الطقس الصافي."
  }
 },
 "p9q13": {
  "en": {
   "enonce": "Starting on a hill: how do you avoid rolling back?",
   "options": [
    "I coordinate brake, clutch and accelerator (or use hill-start assist)",
    "I let everything go at once",
    "I deliberately roll back a bit"
   ],
   "explication": "On a hill, balance brake/clutch/accelerator (or use hill-start assist) so you don't roll back onto the vehicle behind."
  },
  "ar": {
   "enonce": "الانطلاق على منحدر صاعد: كيف تتجنّب التراجع للخلف؟",
   "options": [
    "أنسّق بين الفرامل والقابض ودوّاسة الوقود (أو أستخدم مساعد الانطلاق على المنحدر)",
    "أفلت كل شيء دفعة واحدة",
    "أتراجع قليلاً عمداً"
   ],
   "explication": "على المنحدر، وازن بين الفرامل/القابض/دوّاسة الوقود (أو استخدم مساعد الانطلاق) كي لا تتراجع على المركبة خلفك."
  }
 },
 "p9q14": {
  "en": {
   "enonce": "Thick fog suddenly appears in the mountains. What do you do?",
   "options": [
    "High beams and normal speed",
    "Low beams, I slow down, I increase distances",
    "I stop in the lane"
   ],
   "explication": "Low beams (+ front fog lights), reduced speed, greater distances. Never use high beams or stop on the road."
  },
  "ar": {
   "enonce": "يظهر ضباب كثيف فجأة في الجبل. ماذا تفعل؟",
   "options": [
    "أنوار عالية وسرعة عادية",
    "أنوار منخفضة، أخفّف السرعة، أزيد المسافات",
    "أتوقّف على المسار"
   ],
   "explication": "أنوار منخفضة (+ أنوار الضباب الأمامية)، سرعة مخفّضة، مسافات أكبر. لا أنوار عالية ولا توقّف على الطريق أبداً."
  }
 },
 "p9q15": {
  "en": {
   "enonce": "Outside a built-up area, at a blind bend: can you use your horn?",
   "options": [
    "No, it's forbidden everywhere",
    "Yes, a short beep to signal your presence",
    "Yes, continuously"
   ],
   "explication": "Outside built-up areas, a short beep of the horn is allowed to signal your presence at a blind bend. In town, it is reserved for immediate danger."
  },
  "ar": {
   "enonce": "خارج المنطقة العمرانية، عند منعطف بلا رؤية: هل يمكنك استعمال البوق؟",
   "options": [
    "لا، ممنوع في كل مكان",
    "نعم، بوقة قصيرة للتنبيه إلى وجودك",
    "نعم، بشكل متواصل"
   ],
   "explication": "خارج المناطق العمرانية، يُسمح ببوقة قصيرة للتنبيه إلى وجودك عند منعطف بلا رؤية. في المدينة، يُقتصر استعماله على الخطر المباشر."
  }
 },
 "p10q1": {
  "en": {
   "enonce": "Where are the dangerous blind spots of a heavy truck?",
   "options": [
    "Only far behind",
    "Right up front, on the right, and just behind",
    "Only far out to its left"
   ],
   "explication": "Right up front, on the right and just behind: if you can't see the driver's mirrors, the driver can't see you."
  },
  "ar": {
   "enonce": "أين توجد النقاط العمياء الخطيرة للشاحنة الثقيلة؟",
   "options": [
    "فقط بعيدًا في الخلف",
    "أمامها مباشرة، وعلى اليمين، وخلفها مباشرة",
    "فقط بعيدًا على يسارها"
   ],
   "explication": "أمامها مباشرة، وعلى اليمين، وخلفها مباشرة: إذا لم تكن ترى مراياها، فهي لا تراك."
  }
 },
 "p10q2": {
  "en": {
   "enonce": "In town, a bus signals to pull out of its stop. What do you do?",
   "options": [
    "I quickly go past before it",
    "I let it pull back into traffic",
    "I honk"
   ],
   "explication": "In built-up areas, you must let a bus pull out of its stop when it signals. Ease off the gas."
  },
  "ar": {
   "enonce": "في المدينة، تُشغّل حافلة إشارة الانعطاف لمغادرة موقفها. ماذا تفعل؟",
   "options": [
    "أمرّ بسرعة قبلها",
    "أتركها تعود إلى السير",
    "أضغط على المنبّه"
   ],
   "explication": "داخل المناطق العمرانية، عليك أن تترك الحافلة تنطلق من موقفها عندما تُشير. ارفع قدمك عن الدواسة."
  }
 },
 "p10q3": {
  "en": {
   "enonce": "At a traffic light, what is the bike box for the cyclist?",
   "options": [
    "Nothing in particular",
    "To position in front of the cars and set off safely",
    "To run the red light"
   ],
   "explication": "The bike box (the area before the line) lets cyclists position in front, visible, out of the blind spots when setting off."
  },
  "ar": {
   "enonce": "عند إشارة ضوئية، ما فائدة صندوق الدرّاجات لراكب الدرّاجة؟",
   "options": [
    "لا فائدة خاصة منه",
    "للتموضع أمام السيارات والانطلاق بأمان",
    "لتجاوز الإشارة الحمراء"
   ],
   "explication": "صندوق الدرّاجات (المنطقة قبل الخط) يتيح للدرّاجين التموضع في المقدمة، ظاهرين، بعيدًا عن النقاط العمياء عند الانطلاق."
  }
 },
 "p10q4": {
  "en": {
   "enonce": "In town, where does an electric scooter ride?",
   "options": [
    "On the pavement",
    "On bike lanes or the road, not the pavement",
    "Anywhere"
   ],
   "explication": "Electric scooters: bike lanes or the road (town ≤ 50 km/h), never the pavement. Give them room like a bicycle."
  },
  "ar": {
   "enonce": "في المدينة، أين تسير الدرّاجة الكهربائية (السكوتر)؟",
   "options": [
    "على الرصيف",
    "على مسارات الدرّاجات أو الطريق، لا على الرصيف",
    "في أي مكان"
   ],
   "explication": "الدرّاجات الكهربائية: مسارات الدرّاجات أو الطريق (المدينة ≤ 50 km/h)، لا على الرصيف أبدًا. اترك لها مساحة كما تفعل مع درّاجة."
  }
 },
 "p10q5": {
  "en": {
   "enonce": "You overtake a scooter (a powered two-wheeler). How much clearance?",
   "options": [
    "Like a car, I can pass close",
    "1 m in town, 1.5 m outside built-up areas, like a bicycle",
    "No clearance needed"
   ],
   "explication": "Same clearance as a bicycle: 1 m in town, 1.5 m outside built-up areas. A two-wheeler is destabilised by air turbulence."
  },
  "ar": {
   "enonce": "تتجاوز درّاجة نارية (مركبة ذات عجلتين). ما هامش الأمان؟",
   "options": [
    "مثل السيارة، يمكنني الاقتراب منها",
    "1 م في المدينة، 1.5 م خارج المناطق العمرانية، مثل الدرّاجة",
    "لا حاجة إلى أي هامش"
   ],
   "explication": "نفس هوامش الدرّاجة: 1 م في المدينة، 1.5 م خارج المناطق العمرانية. المركبة ذات العجلتين تفقد توازنها بسبب تيارات الهواء."
  }
 },
 "p10q6": {
  "en": {
   "enonce": "Motorbikes are filtering up the line of stopped traffic. Before changing lanes, you?",
   "options": [
    "I change lane to block them",
    "I check my mirrors and blind spots, I stay predictable",
    "I open my door"
   ],
   "explication": "Stay predictable and check mirrors and blind spots before any move. A door opened without looking can kill a motorcyclist."
  },
  "ar": {
   "enonce": "درّاجات نارية تتقدّم بين صفوف السيارات المتوقفة. قبل تغيير المسار، أنت؟",
   "options": [
    "أغيّر المسار لأعرقلها",
    "أتحقق من مراياي ونقاطي العمياء، وأبقى متوقّعًا",
    "أفتح بابي"
   ],
   "explication": "ابقَ متوقّعًا وتحقّق من المرايا والنقاط العمياء قبل أي حركة. باب يُفتح دون نظر قد يقتل سائق درّاجة نارية."
  }
 },
 "p10q7": {
  "en": {
   "enonce": "A pedestrian with a white cane wants to cross. What do you do?",
   "options": [
    "I honk to warn them",
    "I stop and let them cross",
    "I quickly go past"
   ],
   "explication": "A white cane means a visually impaired person, absolute priority. You stop without honking (the noise disorients them)."
  },
  "ar": {
   "enonce": "مشاة يحمل عصا بيضاء يريد العبور. ماذا تفعل؟",
   "options": [
    "أضغط على المنبّه لتنبيهه",
    "أتوقف وأتركه يعبر",
    "أمرّ بسرعة"
   ],
   "explication": "العصا البيضاء تعني شخصًا ضعيف البصر، له الأولوية المطلقة. تتوقف دون استخدام المنبّه (فالضجيج يربكه)."
  }
 },
 "p10q8": {
  "en": {
   "enonce": "An abnormal load with an escort car approaches. What do you do?",
   "options": [
    "I overtake as soon as possible",
    "I follow the escort car's instructions (slow down, pull over)",
    "I ignore it"
   ],
   "explication": "The escort car has authority: you obey its signals. Overtaking an abnormal load is strictly controlled."
  },
  "ar": {
   "enonce": "قافلة حِمل استثنائي مصحوبة بسيارة مرافِقة تقترب. ماذا تفعل؟",
   "options": [
    "أتجاوز في أقرب فرصة",
    "أتّبع تعليمات السيارة المرافِقة (التباطؤ، الاصطفاف جانبًا)",
    "أتجاهلها"
   ],
   "explication": "السيارة المرافِقة لها السلطة: تحترم إشاراتها. تجاوز الحِمل الاستثنائي مقيّد بشدة."
  }
 },
 "p10q9": {
  "en": {
   "enonce": "An ambulance comes up behind you, siren and flashing lights on. What do you do?",
   "options": [
    "I carry on normally",
    "I pull over and give way safely",
    "I run the red light ahead to get out of the way"
   ],
   "explication": "Emergency vehicle: pull over and stop if needed, without any dangerous manoeuvre or blindly running a red light."
  },
  "ar": {
   "enonce": "سيارة إسعاف تأتي خلفك، بصفّارة وأضواء وامضة مُشغّلة. ماذا تفعل؟",
   "options": [
    "أتابع سيري بشكل عادي",
    "أصطف جانبًا وأفسح لها الطريق بأمان",
    "أتجاوز الإشارة الحمراء أمامي لإخلاء الطريق"
   ],
   "explication": "مركبة ذات أولوية: تصطف جانبًا وتتوقف عند الحاجة، دون أي مناورة خطِرة أو تجاوز أعمى لإشارة حمراء."
  }
 },
 "p10q10": {
  "en": {
   "enonce": "You open your door on the road side after parking. The right reflex?",
   "options": [
    "I open quickly",
    "I look behind (bikes, cars) before opening",
    "I fling it wide open at once"
   ],
   "explication": "The \"cross-hand\" reflex: opening with the far hand forces you to look behind. A door opened onto a cyclist means a serious accident."
  },
  "ar": {
   "enonce": "تفتح بابك من جهة الطريق بعد أن ركنت. ما ردّ الفعل الصحيح؟",
   "options": [
    "أفتح بسرعة",
    "أنظر إلى الخلف (درّاجات، سيارات) قبل أن أفتح",
    "أفتحه على مصراعيه دفعة واحدة"
   ],
   "explication": "ردّ فعل «اليد المتقاطعة»: الفتح باليد المقابلة يُجبرك على النظر إلى الخلف. باب يُفتح على درّاج يعني حادثًا خطيرًا."
  }
 },
 "p10q11": {
  "en": {
   "enonce": "A slow farm vehicle is ahead of you outside a built-up area. What do you do?",
   "options": [
    "I tailgate it while honking",
    "I keep my distance and overtake only with real visibility",
    "I overtake on a bend"
   ],
   "explication": "Slow vehicle means patience: keep a safe distance, then overtake only when the view ahead is clear."
  },
  "ar": {
   "enonce": "آلة زراعية بطيئة تسير أمامك خارج المنطقة العمرانية. ماذا تفعل؟",
   "options": [
    "ألتصق بها وأضغط على المنبّه",
    "أحافظ على المسافة وأتجاوز فقط عند رؤية واضحة",
    "أتجاوز في منعطف"
   ],
   "explication": "الآلة البطيئة تعني الصبر: مسافة أمان، ثم التجاوز فقط عند رؤية واضحة أمامك."
  }
 },
 "p10q12": {
  "en": {
   "enonce": "A child under 8 is riding a bike on the pavement. This is?",
   "options": [
    "Forbidden, never allowed",
    "Allowed, at walking pace",
    "Allowed at full speed"
   ],
   "explication": "A child under 8 may ride a bike on the pavement, at walking pace. Be extra careful nearby."
  },
  "ar": {
   "enonce": "طفل دون الثامنة يركب درّاجة على الرصيف. هذا؟",
   "options": [
    "ممنوع، غير مسموح أبدًا",
    "مسموح، بسرعة المشي",
    "مسموح بأقصى سرعة"
   ],
   "explication": "يجوز للطفل دون الثامنة أن يركب درّاجة على الرصيف بسرعة المشي. ضاعِف حذرك عند الاقتراب منه."
  }
 },
 "p10q13": {
  "en": {
   "enonce": "You meet horse riders on the road. What do you do?",
   "options": [
    "I honk and quickly go past",
    "I slow right down and pass wide, quietly",
    "I treat it like a car"
   ],
   "explication": "An animal is unpredictable: slow right down, pass very wide, without honking or accelerating (the noise frightens it)."
  },
  "ar": {
   "enonce": "تصادف خيولًا يمتطيها فرسان على الطريق. ماذا تفعل؟",
   "options": [
    "أضغط على المنبّه وأمرّ بسرعة",
    "أبطئ كثيرًا وأمرّ من بعيد، دون ضجيج",
    "أتعامل معها كما مع سيارة"
   ],
   "explication": "الحيوان لا يمكن التنبؤ به: تبطئ كثيرًا، وتمرّ من بعيد جدًا، دون منبّه أو تسارع (فالضجيج يُخيفه)."
  }
 },
 "p10q14": {
  "en": {
   "enonce": "You approach a stopped school bus (sign + lights). What do you do?",
   "options": [
    "I go past normally",
    "I slow down and stay ready to stop",
    "I speed up to pass before them"
   ],
   "explication": "Near a stopped school bus, slow down, ready to stop: a child may dart out in front or behind."
  },
  "ar": {
   "enonce": "تقترب من حافلة نقل أطفال متوقفة (لوحة + أضواء). ماذا تفعل؟",
   "options": [
    "أمرّ بشكل عادي",
    "أبطئ وأبقى مستعدًا للتوقف",
    "أُسرع لأمرّ قبلهم"
   ],
   "explication": "قرب حافلة أطفال متوقفة، تبطئ مستعدًا للتوقف: قد يظهر طفل فجأة من الأمام أو الخلف."
  }
 },
 "p10q15": {
  "en": {
   "enonce": "An elderly person is crossing slowly in front of you. What do you do?",
   "options": [
    "I honk to hurry them along",
    "I wait until they have finished",
    "I quickly go past behind them"
   ],
   "explication": "Wait calmly until they have finished crossing. Honking or forcing your way endangers a vulnerable pedestrian."
  },
  "ar": {
   "enonce": "شخص مسنّ يعبر ببطء أمامك. ماذا تفعل؟",
   "options": [
    "أضغط على المنبّه لأستعجله",
    "أنتظر حتى ينتهي من العبور",
    "أمرّ بسرعة من خلفه"
   ],
   "explication": "تنتظر بهدوء حتى ينتهي من العبور. الضغط على المنبّه أو فرض المرور يُعرّض مشاة ضعيفًا للخطر."
  }
 },
 "p11q1": {
  "en": {
   "enonce": "What is the difference between stopping and parking?",
   "options": [
    "None, they are the same",
    "Stopping is brief with the driver at the wheel; parking leaves the vehicle immobilized",
    "Parking is shorter than stopping"
   ],
   "explication": "Stopping = short, the driver stays at the wheel ready to move off. Parking = the vehicle is left immobilized, the driver has left or is not available."
  },
  "ar": {
   "enonce": "ما الفرق بين التوقّف والوقوف (الركن)؟",
   "options": [
    "لا فرق، هما الشيء نفسه",
    "التوقّف قصير والسائق خلف المقود؛ أمّا الوقوف فيترك السيارة ثابتة",
    "الوقوف أقصر من التوقّف"
   ],
   "explication": "التوقّف = قصير، يبقى السائق خلف المقود مستعدًّا للانطلاق. الوقوف = السيارة ثابتة، والسائق غادر أو غير موجود."
  }
 },
 "p11q2": {
  "en": {
   "enonce": "Can you park in front of a driveway entrance (a dropped kerb)?",
   "options": [
    "Yes if it's brief",
    "No, it's forbidden, even in front of your own home",
    "Yes at night"
   ],
   "explication": "Parking in front of a dropped kerb / a vehicle entrance is forbidden (obstructive), even in front of your own entrance."
  },
  "ar": {
   "enonce": "هل يمكنك الوقوف أمام مدخل مرآب (رصيف منخفض للمرور)؟",
   "options": [
    "نعم إن كان لفترة قصيرة",
    "لا، هذا ممنوع، حتى أمام منزلك",
    "نعم في الليل"
   ],
   "explication": "الوقوف أمام رصيف منخفض / مدخل تعبره المركبات ممنوع (لأنه معيق)، حتى أمام مدخل منزلك."
  }
 },
 "p11q3": {
  "en": {
   "enonce": "Parking on a pavement is?",
   "options": [
    "Allowed if I leave some space",
    "Forbidden: obstructive parking",
    "Allowed for deliveries"
   ],
   "explication": "On a pavement = obstructive parking: you block pedestrians, prams and wheelchairs. Forbidden."
  },
  "ar": {
   "enonce": "الوقوف على الرصيف هو؟",
   "options": [
    "مسموح إذا تركت مساحة",
    "ممنوع: وقوف معيق",
    "مسموح لعمليات التوصيل"
   ],
   "explication": "على الرصيف = وقوف معيق: أنت تعرقل المشاة وعربات الأطفال والكراسي المتحركة. ممنوع."
  }
 },
 "p11q4": {
  "en": {
   "enonce": "Parking on a pedestrian crossing is?",
   "options": [
    "Tolerated for a few minutes",
    "Forbidden: dangerous parking",
    "OK with the hazard lights on"
   ],
   "explication": "On a pedestrian crossing = dangerous parking: you hide pedestrians from other drivers. Forbidden."
  },
  "ar": {
   "enonce": "الوقوف على ممرّ المشاة هو؟",
   "options": [
    "مسموح به لبضع دقائق",
    "ممنوع: وقوف خطير",
    "لا بأس مع تشغيل أضواء الخطر"
   ],
   "explication": "على ممرّ المشاة = وقوف خطير: أنت تحجب المشاة عن أنظار السائقين الآخرين. ممنوع."
  }
 },
 "p11q5": {
  "en": {
   "enonce": "In a built-up area, which side do you park on by default?",
   "options": [
    "On the right, in the direction of traffic",
    "Any side",
    "On the left, always"
   ],
   "explication": "By default, on the right and in the direction of traffic. (On a one-way street, both sides may be allowed.)"
  },
  "ar": {
   "enonce": "داخل المدينة، على أيّ جانب تركن سيارتك بشكل افتراضي؟",
   "options": [
    "على اليمين، في اتجاه السير",
    "على أيّ جانب",
    "على اليسار دائمًا"
   ],
   "explication": "بشكل افتراضي، على اليمين وفي اتجاه السير. (في شارع باتجاه واحد، قد يكون الجانبان مسموحين.)"
  }
 },
 "p11q6": {
  "en": {
   "enonce": "To succeed at parallel parking, how do you position yourself at the start?",
   "options": [
    "Far ahead of the space, up against the kerb",
    "Level with the car in front of the space, about 1 m away",
    "Straight into the space driving forwards"
   ],
   "explication": "You place yourself parallel to the car in front of the space, about 1 m away, then turn the wheel as you reverse. Watch behind you and check for pedestrians throughout the whole manoeuvre."
  },
  "ar": {
   "enonce": "لكي تنجح في الركن الجانبي (الموازي)، كيف تضع سيارتك في البداية؟",
   "options": [
    "بعيدًا أمام المكان، ملتصقًا بالرصيف",
    "بمحاذاة السيارة الواقفة أمام المكان، على بُعد متر تقريبًا",
    "مباشرة داخل المكان بالسير إلى الأمام"
   ],
   "explication": "تضع سيارتك موازية للسيارة الواقفة أمام المكان، على بُعد متر تقريبًا، ثم تدير المقود وأنت ترجع إلى الخلف. راقب الخلف والمشاة طوال المناورة كلها."
  }
 },
 "p11q7": {
  "en": {
   "enonce": "What do you risk for obstructive parking?",
   "options": [
    "Nothing at all",
    "A fine, and even having the vehicle towed away",
    "Just a verbal warning"
   ],
   "explication": "Obstructive parking = a fine, and the vehicle may be towed to the pound. Dangerous or very obstructive parking = a heavier penalty."
  },
  "ar": {
   "enonce": "ماذا تخاطر به في حال الوقوف المعيق؟",
   "options": [
    "لا شيء إطلاقًا",
    "غرامة، وربما سحب السيارة إلى المحجز",
    "مجرّد تحذير شفهي"
   ],
   "explication": "الوقوف المعيق = غرامة، وقد تُسحب السيارة إلى المحجز. الوقوف الخطير أو المعيق جدًّا = عقوبة أشدّ."
  }
 },
 "p11q8": {
  "en": {
   "enonce": "A solid yellow line along the kerb means?",
   "options": [
    "Parking allowed",
    "Stopping AND parking forbidden",
    "Paid parking"
   ],
   "explication": "Solid yellow = stopping and parking forbidden. Dashed yellow = parking forbidden (a brief stop is tolerated)."
  },
  "ar": {
   "enonce": "خطّ أصفر متّصل على طول الرصيف يعني؟",
   "options": [
    "الوقوف مسموح",
    "التوقّف والوقوف ممنوعان معًا",
    "وقوف مدفوع الأجر"
   ],
   "explication": "أصفر متّصل = ممنوع التوقّف والوقوف. أصفر متقطّع = ممنوع الوقوف (يُسمح بتوقّف قصير)."
  }
 },
 "p11q9": {
  "en": {
   "enonce": "Where is making a U-turn strictly forbidden?",
   "options": [
    "Everywhere in town",
    "On the motorway, over a solid line, and where there is no visibility",
    "Nowhere, it's always allowed"
   ],
   "explication": "A U-turn is forbidden on the motorway, when crossing a solid line, and anywhere it is obstructive or lacks visibility."
  },
  "ar": {
   "enonce": "الدوران للخلف (نصف دورة) أين يُمنع منعًا باتًّا؟",
   "options": [
    "في كلّ مكان داخل المدينة",
    "على الطريق السريع، وفوق خطّ متّصل، وحيث لا رؤية",
    "لا مكان، فهو مسموح دائمًا"
   ],
   "explication": "الدوران للخلف ممنوع على الطريق السريع، وعند عبور خطّ متّصل، وفي كلّ مكان يكون فيه معيقًا أو تنقصه الرؤية."
  }
 },
 "p11q10": {
  "en": {
   "enonce": "How do you use reverse gear?",
   "options": [
    "Over long distances without any problem",
    "Over a short distance, for a manoeuvre only",
    "Including on the motorway if needed"
   ],
   "explication": "Reverse gear is for manoeuvring over a short distance. Reversing for a long way is dangerous — and it is strictly forbidden on the motorway."
  },
  "ar": {
   "enonce": "الرجوع إلى الخلف، كيف تستعمله؟",
   "options": [
    "لمسافات طويلة دون مشكلة",
    "لمسافة قصيرة، من أجل مناورة فقط",
    "بما في ذلك على الطريق السريع عند الحاجة"
   ],
   "explication": "الرجوع إلى الخلف يُستعمل للمناورة على مسافة قصيرة. الرجوع لمسافة طويلة خطير — وهو ممنوع منعًا باتًّا على الطريق السريع."
  }
 },
 "p11q11": {
  "en": {
   "enonce": "You park at the top of a hill (manual gearbox). What do you do?",
   "options": [
    "I leave it in neutral",
    "Handbrake on, a gear engaged, wheels turned towards the kerb",
    "Nothing in particular"
   ],
   "explication": "Handbrake fully on, a gear engaged and wheels turned towards the kerb: if the car moves, it bumps the kerb instead of rolling down."
  },
  "ar": {
   "enonce": "تركن سيارتك أعلى منحدر (ناقل حركة يدوي). ماذا تفعل؟",
   "options": [
    "أتركها على الوضع المحايد",
    "فرملة اليد، مع إدخال سرعة، والعجلات موجّهة نحو الرصيف",
    "لا شيء بالذات"
   ],
   "explication": "فرملة اليد مشدودة، ومع إدخال سرعة، والعجلات موجّهة نحو الرصيف: إذا تحرّكت السيارة، ترتطم بالرصيف بدل أن تنحدر."
  }
 },
 "p11q12": {
  "en": {
   "enonce": "Stopping double-parked to unload is?",
   "options": [
    "OK for a few minutes",
    "Forbidden: obstructive parking",
    "OK with the hazard lights on"
   ],
   "explication": "Double-parking = obstructive and forbidden. Only a very brief stop, with you at the wheel ready to move off, may be tolerated."
  },
  "ar": {
   "enonce": "التوقّف في صفّ ثانٍ (صفّ مزدوج) لتفريغ الحمولة هو؟",
   "options": [
    "لا بأس لبضع دقائق",
    "ممنوع: وقوف معيق",
    "لا بأس مع تشغيل أضواء الخطر"
   ],
   "explication": "الصفّ المزدوج = معيق وممنوع. يُسمح فقط بتوقّف قصير جدًّا، وأنت خلف المقود مستعدّ للانطلاق."
  }
 },
 "p11q13": {
  "en": {
   "enonce": "Parking right on the corner of a junction is?",
   "options": [
    "No problem at all",
    "To be avoided: you block the visibility (obstructive)",
    "Compulsory 1 m from the junction"
   ],
   "explication": "Too close to a junction, you block other road users' visibility: this is obstructive. Leave some room."
  },
  "ar": {
   "enonce": "ركن سيارتك تمامًا عند زاوية تقاطع هو؟",
   "options": [
    "دون أيّ مشكلة",
    "يجب تجنّبه: أنت تحجب الرؤية (معيق)",
    "إجباري على بُعد متر من التقاطع"
   ],
   "explication": "قريبًا جدًّا من التقاطع، تحجب الرؤية عن مستعملي الطريق الآخرين: هذا معيق. اترك مسافة كافية."
  }
 },
 "p11q14": {
  "en": {
   "enonce": "A reserved space (for disabled people) when you don't have a permit. What do you do?",
   "options": [
    "I park for 5 minutes",
    "I never park there: forbidden, heavy fine",
    "I park there if there's no other space"
   ],
   "explication": "A disabled space without an inclusion mobility permit = a strict ban and a heavy fine. Never, not even \"just 5 minutes\"."
  },
  "ar": {
   "enonce": "مكان مخصّص لذوي الإعاقة وأنت لا تملك بطاقة. ماذا تفعل؟",
   "options": [
    "أركن لمدّة 5 دقائق",
    "لا أركن فيه أبدًا: ممنوع، وغرامة كبيرة",
    "أركن فيه إن لم يكن هناك مكان آخر"
   ],
   "explication": "مكان لذوي الإعاقة دون بطاقة التنقّل الشاملة = منع صارم وغرامة كبيرة. أبدًا، ولا حتى «5 دقائق فقط»."
  }
 },
 "p11q15": {
  "en": {
   "enonce": "Vehicle stopped at night, outside a built-up area with no lighting. How do you signal it?",
   "options": [
    "I don't switch anything on",
    "I switch on my sidelights",
    "I leave the full-beam headlights on"
   ],
   "explication": "Outside an unlit built-up area, you signal your stopped vehicle with your sidelights so you can be seen from far away."
  },
  "ar": {
   "enonce": "سيارة متوقّفة ليلًا، خارج المدينة وفي مكان غير مضاء. كيف تشير إليها؟",
   "options": [
    "لا أشغّل أيّ شيء",
    "أشغّل أضواء الموقع (أضواء الوقوف)",
    "أُبقي الأضواء العالية مشغّلة"
   ],
   "explication": "خارج المدينة وفي مكان غير مضاء، تشير إلى سيارتك المتوقّفة بأضواء الموقع لكي تُرى من بعيد."
  }
 },
 "p12q1": {
  "en": {
   "enonce": "At this sign, what must you do?",
   "options": [
    "Slow down and go through if the road is clear",
    "Come to a complete stop, then give way",
    "Sound your horn to signal your presence"
   ],
   "explication": "STOP = a full, mandatory stop at the line, even if everything is clear. You set off again once you have given way."
  },
  "ar": {
   "enonce": "أمام هذه اللافتة، ماذا يجب أن تفعل؟",
   "options": [
    "تبطئ وتمرّ إذا كان الطريق خالياً",
    "تتوقف توقفاً تاماً عند الخط، ثم تفسح الطريق",
    "تُطلق البوق للتنبيه إلى وجودك"
   ],
   "explication": "قف (STOP) = توقف إجباري تام عند الخط، حتى لو كان الطريق خالياً تماماً. تنطلق من جديد بعد أن تفسح الأولوية."
  }
 },
 "p12q2": {
  "en": {
   "enonce": "This sign means…",
   "options": [
    "No parking",
    "No entry for all vehicles",
    "Lane reserved for emergency services"
   ],
   "explication": "Red disc with a white bar: you cannot go in, it is a no-entry sign."
  },
  "ar": {
   "enonce": "هذه اللافتة تعني…",
   "options": [
    "ممنوع الوقوف",
    "ممنوع الدخول لجميع المركبات",
    "مسار محجوز لسيارات الطوارئ"
   ],
   "explication": "قرص أحمر بشريط أبيض: لا يمكنك الدخول، إنه اتجاه ممنوع."
  }
 },
 "p12q3": {
  "en": {
   "enonce": "As you approach this sign, you must…",
   "options": [
    "Always stop at the line",
    "Give way, without necessarily stopping",
    "Go through with priority"
   ],
   "explication": "\"Give way\": you let others go first, but you do not have to stop if the road is clear."
  },
  "ar": {
   "enonce": "عند اقترابك من هذه اللافتة، يجب أن…",
   "options": [
    "تتوقف دائماً عند الخط",
    "تفسح الطريق، دون أن تتوقف بالضرورة",
    "تمرّ بأولوية"
   ],
   "explication": "«افسح الطريق»: تدع الآخرين يمرّون أولاً، لكن دون التزام بالتوقف إذا كان الطريق خالياً."
  }
 },
 "p12q4": {
  "en": {
   "enonce": "This sign warns you of…",
   "options": [
    "A junction where you have priority",
    "A junction where you give way to the right",
    "A pedestrian crossing"
   ],
   "explication": "Saint Andrew's cross: at the next junction, priority to the right — you give way to anyone coming from your right."
  },
  "ar": {
   "enonce": "هذه اللافتة تُنذرك بـ…",
   "options": [
    "تقاطع تكون فيه صاحب الأولوية",
    "تقاطع تفسح فيه الطريق لمن على اليمين",
    "ممر للمشاة"
   ],
   "explication": "صليب القديس أندراوس: عند التقاطع القادم، الأولوية لليمين — تفسح الطريق لمن يأتي من يمينك."
  }
 },
 "p12q5": {
  "en": {
   "enonce": "This sign means that…",
   "options": [
    "The road is closed further ahead",
    "You are on a priority road",
    "It is a one-way street"
   ],
   "explication": "Yellow diamond: you are on a priority road, you keep priority at junctions."
  },
  "ar": {
   "enonce": "هذه اللافتة تدل على أن…",
   "options": [
    "الطريق مغلق فيما بعد",
    "أنت تسير على طريق ذي أولوية",
    "إنه اتجاه واحد"
   ],
   "explication": "مُعيّن أصفر: أنت على طريق ذي أولوية، تحتفظ بالأولوية عند التقاطعات."
  }
 },
 "p12q6": {
  "en": {
   "enonce": "What does this sign mean?",
   "options": [
    "Start of a priority road",
    "End of a priority road",
    "End of all restrictions"
   ],
   "explication": "Yellow diamond with a bar: your priority-road status ends, become alert again at junctions."
  },
  "ar": {
   "enonce": "ماذا تعني هذه اللافتة؟",
   "options": [
    "بداية طريق ذي أولوية",
    "نهاية طريق ذي أولوية",
    "نهاية جميع الممنوعات"
   ],
   "explication": "مُعيّن أصفر مشطوب: تنتهي أولويتك كطريق ذي أولوية، عُد إلى الحذر عند التقاطعات."
  }
 },
 "p12q7": {
  "en": {
   "enonce": "This sign warns of…",
   "options": [
    "A roundabout",
    "A compulsory U-turn",
    "A dangerous bend"
   ],
   "explication": "Triangle with three arrows in a circle: a roundabout is coming. Priority goes to those already on it."
  },
  "ar": {
   "enonce": "هذه اللافتة تُنذر بـ…",
   "options": [
    "دوّار (مفترق دائري)",
    "استدارة إجبارية",
    "منعطف خطير"
   ],
   "explication": "مثلث بثلاثة أسهم في دائرة: دوّار يقترب. الأولوية لمن هم داخله بالفعل."
  }
 },
 "p12q8": {
  "en": {
   "enonce": "This sign means…",
   "options": [
    "No entry only",
    "No vehicles allowed in either direction",
    "No parking"
   ],
   "explication": "Fully red disc: traffic is banned for all vehicles, in both directions."
  },
  "ar": {
   "enonce": "هذه اللافتة تعني…",
   "options": [
    "ممنوع الدخول فقط",
    "ممنوع مرور أي مركبة في كلا الاتجاهين",
    "ممنوع الوقوف"
   ],
   "explication": "قرص أحمر بالكامل: المرور ممنوع لجميع المركبات، في كلا الاتجاهين."
  }
 },
 "p12q9": {
  "en": {
   "enonce": "This sign bans you from…",
   "options": [
    "Parking",
    "Overtaking",
    "Using your horn"
   ],
   "explication": "Two cars, one of them red: overtaking motor vehicles is forbidden."
  },
  "ar": {
   "enonce": "هذه اللافتة تمنعك من…",
   "options": [
    "الوقوف",
    "التجاوز",
    "استعمال البوق"
   ],
   "explication": "سيارتان إحداهما حمراء: ممنوع تجاوز المركبات ذات المحرك."
  }
 },
 "p12q10": {
  "en": {
   "enonce": "This sign bans…",
   "options": [
    "Stopping and parking",
    "Parking (but stopping is still allowed)",
    "Traffic"
   ],
   "explication": "Blue disc with one red bar: no parking. You may stop briefly, but not park."
  },
  "ar": {
   "enonce": "هذه اللافتة تمنع…",
   "options": [
    "التوقف والوقوف",
    "الوقوف (لكن التوقف يبقى مسموحاً)",
    "المرور"
   ],
   "explication": "قرص أزرق بشريط أحمر واحد: ممنوع الوقوف. يمكنك التوقف لبرهة قصيرة، لكن لا الوقوف."
  }
 },
 "p12q11": {
  "en": {
   "enonce": "This sign bans…",
   "options": [
    "Parking only",
    "Stopping AND parking",
    "Traffic only"
   ],
   "explication": "Blue disc with a red cross: no stopping and no parking — you must not come to a halt here."
  },
  "ar": {
   "enonce": "هذه اللافتة تمنع…",
   "options": [
    "الوقوف فقط",
    "التوقف والوقوف معاً",
    "المرور فقط"
   ],
   "explication": "قرص أزرق بصليب أحمر: لا توقف ولا وقوف — يجب ألّا تتوقف هنا."
  }
 },
 "p12q12": {
  "en": {
   "enonce": "This sign indicates…",
   "options": [
    "A compulsory straight-ahead direction",
    "A one-way road",
    "A dead end"
   ],
   "explication": "Blue square with a white arrow: one-way traffic in the direction of the arrow."
  },
  "ar": {
   "enonce": "هذه اللافتة تدل على…",
   "options": [
    "اتجاه إجباري إلى الأمام مباشرة",
    "طريق باتجاه واحد",
    "طريق مسدود"
   ],
   "explication": "مربع أزرق بسهم أبيض: المرور باتجاه واحد في اتجاه السهم."
  }
 },
 "p12q13": {
  "en": {
   "enonce": "This sign warns of…",
   "options": [
    "A school",
    "A pedestrian crossing",
    "An area closed to cars"
   ],
   "explication": "Danger triangle with a pedestrian: a pedestrian crossing is coming. Slow down and stay ready to stop."
  },
  "ar": {
   "enonce": "هذه اللافتة تُنذر بـ…",
   "options": [
    "مدرسة",
    "ممر للمشاة",
    "منطقة ممنوعة على السيارات"
   ],
   "explication": "مثلث خطر بصورة أحد المشاة: ممر للمشاة يقترب. أبطئ وابقَ مستعداً للتوقف."
  }
 },
 "p12q14": {
  "en": {
   "enonce": "This sign warns you of…",
   "options": [
    "A speed camera",
    "Traffic lights",
    "A toll"
   ],
   "explication": "Triangle with a traffic light: traffic lights are ahead, get ready to stop if needed."
  },
  "ar": {
   "enonce": "هذه اللافتة تنبهك إلى…",
   "options": [
    "رادار سرعة",
    "إشارات ضوئية",
    "بوابة رسوم"
   ],
   "explication": "مثلث بإشارة ضوئية: إشارات ضوئية أمامك، استعد لاحتمال التوقف."
  }
 },
 "p12q15": {
  "en": {
   "enonce": "This sign means…",
   "options": [
    "Motorway entrance",
    "End of the priority road",
    "End of all previously signalled restrictions"
   ],
   "explication": "White disc with a diagonal bar: all the restrictions in force (speed, overtaking…) come to an end."
  },
  "ar": {
   "enonce": "هذه اللافتة تعني…",
   "options": [
    "مدخل طريق سريع",
    "نهاية الطريق ذي الأولوية",
    "نهاية جميع الممنوعات المُشار إليها سابقاً"
   ],
   "explication": "قرص أبيض مشطوب قطرياً: جميع الممنوعات السارية (السرعة، التجاوز…) تنتهي."
  }
 }
};

// Traduction d'une question pour la langue courante (null en fr ou si absente).
export function examTr(id, lang = getLang()) {
  if (lang === "fr") return null;
  return (EXAM_I18N[id] && EXAM_I18N[id][lang]) || null;
}

// Chaîne d'UI (chrome) traduite ; repli sur le français fourni.
export function examUi(key, fr, lang = getLang()) {
  if (lang === "fr") return fr;
  const v = EXAM_UI[lang] && EXAM_UI[lang][key];
  return v != null ? v : fr;
}
