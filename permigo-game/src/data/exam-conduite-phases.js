// ═══════════════════════════════════════════════════════════════
// Examen blanc de CONDUITE — structure officielle de l'ECE (permis B).
// 8 phases dans l'ordre réel, scoré « façon /31 », fautes éliminatoires.
//
// Source : docs/fiches-conduite/EXAMEN-BLANC-structure.md (croisé officiel
// service-public.fr / sécurité-routière.gouv.fr / guide IPCSR + débriefs de
// vrais moniteurs). 100% reformulé, tutoiement.
//
// ⚠️ Garde-fou : c'est une SIMULATION d'entraînement, PAS la vraie note (seul
// l'inspecteur la donne le jour J). On le dit dans l'UI.
// ⚠️ Faute éliminatoire (`elim`) : UNIQUEMENT la liste confirmée par l'officiel
// (§3 du doc). On n'invente jamais d'éliminatoire.
// ═══════════════════════════════════════════════════════════════

import { getLang } from "@/utils/lang.js";

// Traductions EN/AR des familles, phases et mises en situation. La structure
// française ci-dessous reste la source et le repli exact.
const I18N = {
  en: {
    family_commandes: "Vehicle control",
    family_info: "Information gathering",
    family_partage: "Sharing the road",
    family_autonomie: "Independence & risk",
    bonus_courtoisie: "Courtesy",
    bonus_eco: "Eco-driving",
    phase_accueil: {
      titre: "Welcome & identity",
      sous: "Before driving. The examiner checks that it really is you.",
    },
    phase_installation: {
      titre: "Set-up & safety on board",
      sous: "Adjustments + everyone safe. 2 easy points.",
    },
    phase_consignes: {
      titre: "The instructions",
      sous: "The examiner explains how the test works. Listen carefully.",
    },
    phase_conduite: {
      titre: "Driving in traffic",
      sous: "The heart of the test (≥ 25 min). This is where it all happens.",
    },
    phase_autonomie: {
      titre: "Independent driving",
      sous: "“Follow signs for [town]”. About 5 min without guidance.",
    },
    phase_manoeuvre: {
      titre: "The manoeuvre",
      sous: "Precision braking + reversing (parallel bay, parking bay, U-turn).",
    },
    phase_questions: {
      titre: "The questions",
      sous: "Technical check + road safety + first aid. 3 easy points.",
    },
    phase_bilan: {
      titre: "Return & secure the vehicle",
      sous: "The test is not over until the engine is off. Stay focused.",
    },
    "p1-impression": {
      q: "The windscreen is covered in raindrops as you settle in. The examiner is already watching. What do you do?",
      opts: [
        "Turn on the windscreen wipers before moving off",
        "Move off; you will see well enough while driving",
        "Wait for it to dry on its own",
      ],
      why: "First impressions matter. Moving off without seeing or checking anything immediately shows you are not focused. Gather the information BEFORE moving.",
    },
    "p2-ordre": {
      q: "You adjust your driving position. What is the most logical order?",
      opts: [
        "Seat → steering wheel → mirrors",
        "Mirrors → steering wheel → seat",
        "Steering wheel → seat → mirrors",
      ],
      why: "Seat first (your reference position), then the steering wheel, then the mirrors. Adjusted once you are seated properly. The examiner is not fixated on the exact order, but on you being set up correctly.",
    },
    "p2-securite": {
      q: "You are settled in. Before moving off, the safety reflex is to…",
      opts: [
        "Check everyone is buckled up, doors are closed and no red warning light is on",
        "Move off as soon as the examiner sits down",
        "Adjust the air conditioning and radio",
      ],
      why: "Safety on board = 1 easy point: seat belts, doors (locking makes you check them), and no red warning light on the dashboard.",
    },
    "p3-silence": {
      q: "“I will give you directions. If I say nothing…”. What do you do?",
      opts: [
        "Continue straight ahead",
        "Stop to ask",
        "Turn at the next junction",
      ],
      why: "“If I say nothing, continue straight ahead.” This is the rule announced by every examiner.",
    },
    "p4-prio-droite": {
      q: "At an unsigned junction, a car approaches from your right. What do you do?",
      opts: [
        "Give way. Priority from the right",
        "Go through because you arrived first",
        "Accelerate to pass in front",
      ],
      why: "Priority from the right: give way. Forcing your way through = failure to give way = eliminatory fault.",
    },
    "p4-ligne": {
      q: "A slow cyclist is ahead and there is a solid white line on the road. You want to overtake.",
      opts: [
        "Wait behind until the line becomes broken",
        "Cross the solid line to overtake",
        "Honk so the cyclist moves aside",
      ],
      why: "Crossing a solid line = eliminatory fault. Stay behind and overtake when it is permitted and safe.",
    },
    "p4-giratoire": {
      q: "On a roundabout, you realise you are in the wrong lane for your exit. What is best?",
      opts: [
        "Go around again safely",
        "Steer sharply to take the exit anyway",
        "Stop on the roundabout",
      ],
      why: "Another lap is better than a dangerous swerve. Instructors greatly value a mistake corrected without panic.",
    },
    "p4-angle-mort": {
      q: "You are moving out around a parked car. Another road user may be on your left.",
      opts: [
        "Mirror + blind-spot check, then move out",
        "Move out immediately; it is quick",
        "Honk and move out",
      ],
      why: "Changing direction without checking the blind spot while another road user is there = eliminatory fault. The check is what keeps you safe.",
    },
    "p4-distance": {
      q: "You are following a car on an 80 km/h road. What is the right safety distance?",
      opts: [
        "About 2 seconds behind it",
        "As close as possible so nobody overtakes you",
        "Half a car length",
      ],
      why: "About 2 seconds: choose a fixed marker, let the car pass it, then count “one thousand and one, one thousand and two”. That is your safety cushion.",
    },
    "p4-allure": {
      q: "On a clear straight road with a 50 limit, you drive at 30 “to be safe”. The examiner…",
      opts: [
        "Penalises a lack of progress: build up speed when it is allowed",
        "Loves it; the slower you go, the safer it is",
        "Does not care about speed",
      ],
      why: "Driving too slowly is penalised. Adapt: neither too fast nor too slow. Drive positively when the situation allows it.",
    },
    "p4-feu": {
      q: "The traffic light ahead turns red and you can still brake safely.",
      opts: [
        "Stop before the line",
        "Go through because you were almost committed",
        "Accelerate to get through on amber",
      ],
      why: "Running a red light = eliminatory fault. If you can stop safely, stop.",
    },
    "p4-courtoisie": {
      q: "A car wants to join from a car park. Traffic is heavy, but you can let it in without causing disruption.",
      opts: [
        "Gesture for it to go",
        "Keep moving; everyone for themselves",
        "Stop suddenly in the middle of a junction to let it in",
      ],
      why: "Courtesy bonus: help when you can, without danger. But stopping anywhere (in a junction) = dangerous unjustified stop = eliminatory fault. Courtesy never comes at the expense of safety.",
    },
    "p5-tromper": {
      q: "During independent driving, you realise you are heading in the wrong direction. What do you do?",
      opts: [
        "Continue safely and correct your route when possible",
        "Change lanes at the last moment to recover",
        "Brake hard and make a U-turn",
      ],
      why: "Taking the wrong direction is NOT eliminatory (1 independence point is at stake). But changing lanes at the last moment without checking to recover is dangerous. Correct your route calmly.",
    },
    "p6-clignotant": {
      q: "You are about to stop for a parallel park. When do you signal?",
      opts: [
        "BEFORE stopping",
        "Once stopped",
        "No need because you are stopping",
      ],
      why: "Signal BEFORE stopping; otherwise, you have already surprised the car behind. Warn first, then manoeuvre.",
    },
    "p6-espace": {
      q: "For your parallel park, the examiner has left you a LARGE space. What classic mistake should you avoid?",
      opts: [
        "Steering too early and risking scraping the car",
        "Using all the available space",
        "Checking all around while reversing",
      ],
      why: "You are deliberately given space, so use it. Steering too early = a collision prevented by the examiner = failed test. Check all around, not just one mirror.",
    },
    "p7-detresse": {
      q: "Interior check: “Switch on the hazard lights and name 3 situations when they are used.”",
      opts: [
        "Breakdown/accident, sudden motorway slowdown, obstructing slow vehicle",
        "At night in town to see better",
        "To thank a car that lets you through",
      ],
      why: "Hazard lights signal danger: breakdown/accident, sudden traffic jam on a fast road, convoy/very slow vehicle. Learn it by heart and do not give away these 3 points.",
    },
    "p7-secours": {
      q: "First aid: how far away do you place the warning triangle?",
      opts: [
        "About 30 metres before the hazard (and visible)",
        "Immediately behind your car",
        "You do not put out a triangle",
      ],
      why: "About 30 m before the hazard, where others can see you in time. And get yourself to safety first (high-visibility vest, off the road).",
    },
    "p8-immo": {
      q: "You return to the centre. To secure the vehicle properly:",
      opts: [
        "Neutral, handbrake on, wipers off, engine off",
        "Turn off the engine while leaving a gear engaged on level ground",
        "Get out and let the examiner handle the rest",
      ],
      why: "Neutral + handbrake + wipers off + engine off. Some learners fail by switching off in the final minutes. Stay fully focused to the end.",
    },
    "p8-eco": {
      q: "Throughout the route, for eco-driving you have…",
      opts: [
        "Changed up early enough and driven smoothly",
        "Pushed every gear to maximum revs",
        "Driven constantly at very low revs around 1,000 rpm",
      ],
      why: "Eco-driving bonus: change up early, anticipate to avoid sharp braking, and keep the drive smooth.",
    },
  },
  ar: {
    family_commandes: "التحكم في المركبة",
    family_info: "جمع المعلومات",
    family_partage: "تقاسم الطريق",
    family_autonomie: "الاستقلالية والمخاطر",
    bonus_courtoisie: "حسن التعامل",
    bonus_eco: "القيادة الاقتصادية",
    phase_accueil: {
      titre: "الاستقبال والهوية",
      sous: "قبل القيادة. يتحقّق المفتش من أنك الشخص المعني.",
    },
    phase_installation: {
      titre: "الجلوس والسلامة داخل المركبة",
      sous: "الضبط + سلامة الجميع. نقطتان سهلتان.",
    },
    phase_consignes: {
      titre: "التعليمات",
      sous: "يشرح المفتش سير الامتحان. استمع جيدًا.",
    },
    phase_conduite: {
      titre: "القيادة وسط حركة المرور",
      sous: "جوهر الامتحان (25 دقيقة على الأقل). هنا يتحدد كل شيء.",
    },
    phase_autonomie: {
      titre: "القيادة المستقلة",
      sous: "«اتبع اتجاه [المدينة]». نحو 5 دقائق دون توجيه.",
    },
    phase_manoeuvre: {
      titre: "المناورة",
      sous: "توقف دقيق + رجوع إلى الخلف (ركن موازٍ، ركن عمودي، دوران).",
    },
    phase_questions: {
      titre: "الأسئلة",
      sous: "فحص تقني + سلامة الطرق + إسعافات أولية. 3 نقاط سهلة.",
    },
    phase_bilan: {
      titre: "العودة وتثبيت المركبة",
      sous: "لا ينتهي الامتحان حتى تطفئ المحرك. ابقَ مركّزًا.",
    },
    "p1-impression": {
      q: "الزجاج الأمامي مغطى بقطرات المطر وأنت تجلس. المفتش يراقبك بالفعل. ماذا تفعل؟",
      opts: [
        "تشغّل ماسحات الزجاج قبل الانطلاق",
        "تنطلق وسترى جيدًا أثناء القيادة",
        "تنتظر حتى يجف وحده",
      ],
      why: "الانطباع الأول مهم. الانطلاق دون رؤية أو فحص يوحي فورًا بأنك غير مركّز. اجمع المعلومات قبل التحرك.",
    },
    "p2-ordre": {
      q: "تضبط وضعية قيادتك. ما الترتيب الأكثر منطقية؟",
      opts: [
        "المقعد ← المقود ← المرايا",
        "المرايا ← المقود ← المقعد",
        "المقود ← المقعد ← المرايا",
      ],
      why: "المقعد أولًا لأنه وضعيتك المرجعية، ثم المقود، ثم المرايا بعد أن تجلس بشكل صحيح. لا يدقق المفتش في الترتيب نفسه بقدر ما يهتم بأن تكون وضعيتك سليمة.",
    },
    "p2-securite": {
      q: "جلست في مكانك. قبل الانطلاق، تصرف السلامة هو…",
      opts: [
        "تتأكد من ربط الجميع للأحزمة وإغلاق الأبواب وعدم وجود ضوء تحذير أحمر",
        "تنطلق بمجرد جلوس المفتش",
        "تضبط المكيّف والراديو",
      ],
      why: "السلامة داخل المركبة = نقطة سهلة: الأحزمة، والأبواب، وعدم وجود ضوء تحذير أحمر على لوحة القيادة.",
    },
    "p3-silence": {
      q: "«سأعطيك الاتجاهات. إذا لم أقل شيئًا…». ماذا تفعل؟",
      opts: [
        "تواصل السير إلى الأمام",
        "تتوقف لتسأل",
        "تنعطف عند التقاطع القادم",
      ],
      why: "«إذا لم أقل شيئًا، فواصل إلى الأمام.» هذه هي القاعدة التي يعلنها جميع المفتشين.",
    },
    "p4-prio-droite": {
      q: "عند تقاطع بلا لافتة، تقترب سيارة من يمينك. ماذا تفعل؟",
      opts: [
        "تفسح الطريق. الأولوية لليمين",
        "تمر لأنك وصلت أولًا",
        "تسرّع للمرور أمامها",
      ],
      why: "الأولوية لليمين: أفسح الطريق. فرض المرور = عدم احترام الأولوية = خطأ إقصائي.",
    },
    "p4-ligne": {
      q: "أمامك درّاج بطيء وخط أبيض متصل على الطريق. تريد تجاوزه.",
      opts: [
        "تنتظر خلفه حتى يصبح الخط متقطعًا",
        "تعبر الخط المتصل لتتجاوزه",
        "تطلق البوق كي يبتعد",
      ],
      why: "عبور خط متصل = خطأ إقصائي. ابقَ خلفه وتجاوزه عندما يكون ذلك مسموحًا وآمنًا.",
    },
    "p4-giratoire": {
      q: "في دوّار، تدرك أنك في المسار الخطأ لمخرجك. ما الأفضل؟",
      opts: [
        "تدور دورة أخرى بأمان",
        "تنحرف فجأة لتخرج رغم ذلك",
        "تتوقف داخل الدوّار",
      ],
      why: "دورة إضافية أفضل من انحراف خطير. يقدّر المدرّبون كثيرًا تصحيح الخطأ دون ذعر.",
    },
    "p4-angle-mort": {
      q: "ستغيّر مسارك لتجاوز سيارة متوقفة. قد يكون مستخدم طريق على يسارك.",
      opts: [
        "المرآة + فحص النقطة العمياء، ثم تغيّر مسارك",
        "تغيّر مسارك فورًا، فالأمر سريع",
        "تطلق البوق وتغيّر مسارك",
      ],
      why: "تغيير المسار دون فحص النقطة العمياء مع وجود مستخدم طريق = خطأ إقصائي. الفحص هو ما يحميك.",
    },
    "p4-distance": {
      q: "تتبع سيارة على طريق سرعته 80 كم/س. ما مسافة الأمان الصحيحة؟",
      opts: [
        "نحو ثانيتين خلفها",
        "أقرب ما يمكن حتى لا يتجاوزك أحد",
        "نصف طول سيارة",
      ],
      why: "نحو ثانيتين: اختر علامة ثابتة، دع السيارة تمر بها، ثم عدّ «ألف وواحد، ألف واثنان». هذه مساحة أمانك.",
    },
    "p4-allure": {
      q: "طريق مستقيم وخالٍ، الحد 50 وأنت تسير بسرعة 30 «للأمان». المفتش…",
      opts: [
        "يعاقب نقص الحيوية: زد السرعة عندما يكون ذلك مسموحًا",
        "يعجبه ذلك، فكلما أبطأت كنت أكثر أمانًا",
        "لا يهتم بالسرعة",
      ],
      why: "البطء الزائد يُعاقب. تكيّف: لا سريعًا جدًا ولا بطيئًا جدًا. قُد بحيوية عندما يسمح الموقف.",
    },
    "p4-feu": {
      q: "تتحول الإشارة أمامك إلى الأحمر وما زال بإمكانك الفرملة بأمان.",
      opts: [
        "تتوقف قبل الخط",
        "تمر لأنك كنت على وشك الدخول",
        "تسرّع للمرور عند البرتقالي",
      ],
      why: "تجاوز إشارة حمراء = خطأ إقصائي. إذا كان بإمكانك التوقف بأمان فتوقف.",
    },
    "p4-courtoisie": {
      q: "تريد سيارة الاندماج من موقف سيارات. المرور كثيف لكن يمكنك السماح لها دون إزعاج.",
      opts: [
        "تشير لها بالمرور",
        "تواصل السير، كلٌّ لنفسه",
        "تتوقف فجأة وسط تقاطع لتسمح لها",
      ],
      why: "نقطة حسن التعامل: سهّل المرور عندما تستطيع دون خطر. لكن التوقف في أي مكان، كوسط تقاطع، هو توقف خطير بلا مبرر وخطأ إقصائي. حسن التعامل لا يكون أبدًا على حساب السلامة.",
    },
    "p5-tromper": {
      q: "أثناء القيادة المستقلة، تدرك أنك تسير في الاتجاه الخطأ. ماذا تفعل؟",
      opts: [
        "تواصل بأمان وتصحّح مسارك عندما تستطيع",
        "تغيّر المسار في آخر لحظة لتلحق بالاتجاه",
        "تفرمل بقوة وتدور عائدًا",
      ],
      why: "الخطأ في الاتجاه ليس إقصائيًا، فالمطلوب نقطة استقلالية واحدة. لكن تغيير المسار في آخر لحظة دون فحص أمر خطير. صحّح مسارك بهدوء.",
    },
    "p6-clignotant": {
      q: "ستتوقف للركن الموازي. متى تستخدم الغماز؟",
      opts: [
        "قبل التوقف",
        "بعد التوقف",
        "لا حاجة لأنك ستتوقف",
      ],
      why: "شغّل الغماز قبل التوقف، وإلا تكون قد فاجأت السيارة خلفك. نبّه أولًا ثم نفّذ المناورة.",
    },
    "p6-espace": {
      q: "ترك لك المفتش مساحة كبيرة للركن الموازي. ما الخطأ الشائع الذي يجب تجنبه؟",
      opts: [
        "لف المقود مبكرًا والمخاطرة بالاحتكاك بالسيارة",
        "استخدام كل المساحة المتاحة",
        "مراقبة كل الجهات أثناء الرجوع",
      ],
      why: "تُترك لك مساحة عمدًا، فاستخدمها. لف المقود مبكرًا = اصطدام يمنعه المفتش = رسوب. راقب كل الجهات، لا مرآة واحدة فقط.",
    },
    "p7-detresse": {
      q: "فحص داخلي: «شغّل أضواء الخطر واذكر 3 حالات لاستخدامها.»",
      opts: [
        "عطل/حادث، تباطؤ مفاجئ على الطريق السريع، مركبة بطيئة تعيق المرور",
        "ليلًا في المدينة لرؤية أفضل",
        "لشكر سيارة سمحت لك بالمرور",
      ],
      why: "أضواء الخطر تشير إلى خطر: عطل/حادث، ازدحام مفاجئ على طريق سريع، موكب/مركبة بطيئة جدًا. احفظها ولا تضيّع هذه النقاط الثلاث.",
    },
    "p7-secours": {
      q: "الإسعافات الأولية: على أي مسافة تضع مثلث التحذير؟",
      opts: [
        "نحو 30 مترًا قبل الخطر وفي مكان ظاهر",
        "خلف سيارتك مباشرة",
        "لا نضع مثلثًا",
      ],
      why: "نحو 30 مترًا قبل الخطر حيث يراك الآخرون في الوقت المناسب. واحمِ نفسك أولًا بارتداء السترة والابتعاد عن الطريق.",
    },
    "p8-immo": {
      q: "تعود إلى المركز. لتثبيت المركبة بشكل صحيح:",
      opts: [
        "وضع الحياد، فرامل اليد، إيقاف الماسحات، إطفاء المحرك",
        "تطفئ المحرك مع إبقاء ناقل الحركة على سرعة في طريق مستوٍ",
        "تخرج وتترك الباقي للمفتش",
      ],
      why: "وضع الحياد + فرامل اليد + إيقاف الماسحات + إطفاء المحرك. يرسب بعض المتعلمين بسبب التراخي في الدقائق الأخيرة. ابقَ مركّزًا حتى النهاية.",
    },
    "p8-eco": {
      q: "طوال المسار، من أجل القيادة الاقتصادية كنت…",
      opts: [
        "تنقل السرعات مبكرًا وتقود بسلاسة وانسيابية",
        "ترفع دورات المحرك إلى أقصاها في كل سرعة",
        "تقود باستمرار على دورات منخفضة جدًا عند 1000 دورة/دقيقة",
      ],
      why: "نقطة القيادة الاقتصادية: انقل السرعات مبكرًا، وتوقّع لتجنب الفرملة القوية، وحافظ على قيادة سلسة.",
    },
  },
};
function t(key, fr) {
  const lang = getLang();
  if (lang === "fr") return fr;
  const [group, field, index] = key.split(".");
  let value = I18N[lang]?.[group];
  if (field != null) value = value?.[field];
  if (index != null) value = value?.[Number(index)];
  return value ?? fr;
}

// Familles de compétences (grille officielle, sous-totaux indicatifs = /29) +
// 2 bonus à +1 → total 31. Barème PARAMÉTRABLE (pas figé ligne à ligne).
const FAMILLES_FR = {
  commandes: { label: "Maîtrise du véhicule", max: 8 },
  info: { label: "Prise d'information", max: 9 },
  partage: { label: "Partage de la chaussée", max: 9 },
  autonomie: { label: "Autonomie & risque", max: 3 },
};
const BONUS_FR = {
  courtoisie: { label: "Courtoisie", max: 1 },
  eco: { label: "Éco-conduite", max: 1 },
};
export const FAMILLES = Object.fromEntries(
  Object.entries(FAMILLES_FR).map(([key, family]) => [
    key,
    { ...family, label: t(`family_${key}`, family.label) },
  ]),
);
export const BONUS = Object.fromEntries(
  Object.entries(BONUS_FR).map(([key, bonus]) => [
    key,
    { ...bonus, label: t(`bonus_${key}`, bonus.label) },
  ]),
);
export const TOTAL = 31;
export const SEUIL = 20; // reçu si ≥ 20 ET 0 faute éliminatoire (officiel)

// q   = la mise en situation
// opts= réponses ; correct = index de la bonne ; elim = index d'une réponse
//       qui est une FAUTE ÉLIMINATOIRE (optionnel, liste officielle uniquement)
// fam = famille notée ; why = correction courte (tutoiement)
// bonus = 'courtoisie' | 'eco' (l'item rapporte le point bonus si correct)
// tags = thèmes « Mes fautes » (TAG_LABELS de utils/weak-points.js) — nourrit
//        la révision ciblée du hub Réviser ; omis si aucun thème honnête
const PHASES_FR = [
  {
    n: 1,
    key: "accueil",
    emoji: "🪪",
    titre: "Accueil & identité",
    sous: "Avant de rouler. L'inspecteur vérifie que c'est bien toi.",
    items: [
      {
        id: "p1-impression",
        fam: "info",
        tags: ["verification_interieure"],
        q: "Pare-brise plein de gouttes, tu t'installes. L'inspecteur t'observe déjà. Tu fais quoi ?",
        opts: [
          "Tu mets les essuie-glaces avant de démarrer",
          "Tu démarres, tu verras bien en roulant",
          "Tu attends que ça sèche tout seul",
        ],
        correct: 0,
        why: "La première impression compte. Démarrer sans rien voir ni vérifier dit tout de suite « pas dedans ». Tu prends l'info AVANT de bouger.",
      },
    ],
  },
  {
    n: 2,
    key: "installation",
    emoji: "🪑",
    titre: "Installation & sécurité à bord",
    sous: "Réglages + tout le monde en sécurité. 2 points « cadeau ».",
    items: [
      {
        id: "p2-ordre",
        fam: "commandes",
        tags: ["verification_interieure"],
        q: "Tu règles ton poste. Le plus logique, c'est dans quel ordre ?",
        opts: [
          "Siège → volant → rétroviseurs",
          "Rétroviseurs → volant → siège",
          "Volant → siège → rétroviseurs",
        ],
        correct: 0,
        why: "Siège d'abord (ta position de référence), puis volant, puis les rétros. Réglés une fois que tu es bien assis. L'inspecteur n'est pas au taquet sur l'ordre exact, mais que tu sois bien installé.",
      },
      {
        id: "p2-securite",
        fam: "commandes",
        tags: ["verification_interieure"],
        q: "Tu es installé. Avant de partir, le réflexe sécurité c'est…",
        opts: [
          "Vérifier que tout le monde est attaché + portières fermées, aucun voyant rouge",
          "Démarrer dès que l'inspecteur s'assoit",
          "Régler la clim et la radio",
        ],
        correct: 0,
        why: "Sécurité à bord = 1 point facile : ceintures, portières (verrouiller force à vérifier), tableau de bord sans voyant rouge.",
      },
    ],
  },
  {
    n: 3,
    key: "consignes",
    emoji: "🗣️",
    titre: "Les consignes",
    sous: "L'inspecteur explique le déroulé. Écoute vraiment.",
    items: [
      {
        id: "p3-silence",
        fam: "autonomie",
        q: "« Les directions, je te les donne. Si je ne dis rien… ». Tu fais quoi ?",
        opts: [
          "Tu continues tout droit",
          "Tu t'arrêtes pour demander",
          "Tu tournes au prochain croisement",
        ],
        correct: 0,
        why: "« Si je ne dis rien, c'est tout droit. » C'est la règle annoncée par tous les inspecteurs.",
      },
    ],
  },
  {
    n: 4,
    key: "conduite",
    emoji: "🚗",
    titre: "Conduite en circulation",
    sous: "Le cœur de l'épreuve (≥ 25 min). C'est ici que tout se joue.",
    items: [
      {
        id: "p4-prio-droite",
        fam: "partage",
        tags: ["priorite"],
        q: "Intersection sans panneau, une voiture arrive à ta droite. Tu fais quoi ?",
        opts: [
          "Tu cèdes. Priorité à droite",
          "Tu passes, tu étais là avant",
          "Tu accélères pour passer devant",
        ],
        correct: 0,
        elim: 1, // refus de priorité = éliminatoire (officiel)
        why: "Priorité à droite : tu cèdes. Forcer le passage = refus de priorité = faute éliminatoire.",
      },
      {
        id: "p4-ligne",
        fam: "partage",
        tags: ["signalisation", "cycliste"],
        q: "Un cycliste lent devant toi, ligne blanche continue au sol. Tu veux le doubler.",
        opts: [
          "Tu patientes derrière jusqu'à la ligne discontinue",
          "Tu franchis la ligne continue pour le doubler",
          "Tu klaxonnes pour qu'il se pousse",
        ],
        correct: 0,
        elim: 1, // franchir ligne continue = éliminatoire (officiel)
        why: "Franchir une ligne continue = faute éliminatoire. Tu restes derrière, tu doubles quand c'est permis et sûr.",
      },
      {
        id: "p4-giratoire",
        fam: "info",
        tags: ["rond_point", "manoeuvre"],
        q: "Sur un giratoire, tu réalises que tu es mal placé pour ta sortie. Le mieux ?",
        opts: [
          "Tu refais un tour proprement",
          "Tu donnes un coup de volant pour sortir quand même",
          "Tu t'arrêtes sur le giratoire",
        ],
        correct: 0,
        why: "Refaire un tour > un coup de volant dangereux. Les moniteurs valorisent énormément l'erreur rattrapée sans panique.",
      },
      {
        id: "p4-angle-mort",
        fam: "info",
        tags: ["manoeuvre"],
        q: "Tu vas te déporter pour une voiture en stationnement. Un usager peut être à gauche.",
        opts: [
          "Rétro + coup d'œil angle mort, puis tu te déportes",
          "Tu te déportes direct, c'est rapide",
          "Tu klaxonnes et tu te déportes",
        ],
        correct: 0,
        elim: 1, // changement de voie/déport sans contrôle, usager présent = éliminatoire
        why: "Changer de trajectoire sans contrôler l'angle mort alors qu'un usager est là = faute éliminatoire. Le contrôle, c'est ce qui te sauve.",
      },
      {
        id: "p4-distance",
        fam: "info",
        tags: ["vitesse"],
        q: "Tu suis une voiture sur une route à 80. La bonne distance de sécurité ?",
        opts: [
          "Environ 2 secondes derrière elle",
          "Le plus près possible pour ne pas te faire doubler",
          "Une demi-voiture",
        ],
        correct: 0,
        why: "~2 secondes : tu choisis un repère fixe, la voiture le passe, tu comptes « mille-un, mille-deux ». Ton coussin de sécurité.",
      },
      {
        id: "p4-allure",
        fam: "commandes",
        tags: ["vitesse"],
        q: "Ligne droite dégagée, limite à 50, tu roules à 30 « pour être sûr ». L'inspecteur…",
        opts: [
          "Le manque de dynamisme est pénalisé : mets de l'allure quand c'est permis",
          "Adore, plus c'est lent plus c'est sûr",
          "S'en fiche de la vitesse",
        ],
        correct: 0,
        why: "Trop mou = pénalisé. Tu adaptes : ni trop vite, ni trop lent. Une conduite dynamique quand la situation le permet.",
      },
      {
        id: "p4-feu",
        fam: "partage",
        tags: ["signalisation"],
        q: "Feu qui passe au rouge devant toi, tu peux encore freiner sans danger.",
        opts: [
          "Tu t'arrêtes avant la ligne",
          "Tu passes, t'étais presque engagé",
          "Tu accélères pour passer à l'orange",
        ],
        correct: 0,
        elim: 1, // non-respect d'un signal d'arrêt = éliminatoire
        why: "Griller un feu rouge = faute éliminatoire. Si tu peux t'arrêter en sécurité, tu t'arrêtes.",
      },
      {
        id: "p4-courtoisie",
        fam: "partage",
        bonus: "courtoisie",
        tags: ["courtoisie"],
        q: "Une voiture veut s'insérer depuis un parking, le trafic est dense mais tu peux la laisser sans gêner.",
        opts: [
          "Tu la laisses passer d'un geste",
          "Tu avances, chacun pour soi",
          "Tu t'arrêtes net en plein milieu d'un carrefour pour elle",
        ],
        correct: 0,
        elim: 2, // arrêt injustifié/dangereux = éliminatoire
        why: "Bonus courtoisie : tu facilites quand tu peux, sans danger. Mais t'arrêter n'importe où (carrefour) = arrêt injustifié dangereux = éliminatoire. La courtoisie n'est jamais au prix de la sécurité.",
      },
    ],
  },
  {
    n: 5,
    key: "autonomie",
    emoji: "🧭",
    titre: "Conduite autonome",
    sous: "« Suis la direction de [ville] ». ~5 min sans guidage.",
    items: [
      {
        id: "p5-tromper",
        fam: "autonomie",
        tags: ["manoeuvre"],
        q: "En autonomie, tu réalises que tu pars dans la mauvaise direction. Tu fais quoi ?",
        opts: [
          "Tu continues proprement, tu te recales dès que possible",
          "Tu changes de voie au dernier moment pour rattraper",
          "Tu freines fort et tu fais demi-tour",
        ],
        correct: 0,
        elim: 1, // changement de voie au dernier moment sans contrôle = danger
        why: "Te tromper de direction n'est PAS éliminatoire (1 point d'autonomie en jeu). Mais déboîter au dernier moment sans contrôle pour rattraper = dangereux. Tu te recales calmement.",
      },
    ],
  },
  {
    n: 6,
    key: "manoeuvre",
    emoji: "↩️",
    titre: "La manœuvre",
    sous: "Freinage de précision + marche arrière (créneau, bataille, demi-tour).",
    items: [
      {
        id: "p6-clignotant",
        fam: "partage",
        tags: ["manoeuvre"],
        q: "Tu vas t'arrêter pour faire ton créneau. Le clignotant, c'est…",
        opts: [
          "AVANT de t'arrêter",
          "Une fois arrêté",
          "Pas besoin, tu es à l'arrêt",
        ],
        correct: 0,
        why: "Clignotant AVANT de t'arrêter : sinon tu as déjà surpris la voiture derrière toi. Tu préviens, puis tu manœuvres.",
      },
      {
        id: "p6-espace",
        fam: "commandes",
        tags: ["manoeuvre"],
        q: "Pour ton créneau, l'inspecteur t'a laissé une GRANDE place. Erreur classique à éviter ?",
        opts: [
          "Braquer trop tôt et risquer de frotter la voiture",
          "Utiliser tout l'espace disponible",
          "Contrôler tout autour pendant le recul",
        ],
        correct: 0,
        why: "On te laisse de la place exprès : sers-t'en. Braquer trop tôt = collision évitée par l'inspecteur = échec. Et tu contrôles tout autour, pas juste un rétro.",
      },
    ],
  },
  {
    n: 7,
    key: "questions",
    emoji: "❓",
    titre: "Les questions",
    sous: "Vérif technique + sécurité routière + premiers secours. 3 points faciles.",
    items: [
      {
        id: "p7-detresse",
        fam: "commandes",
        tags: ["verification_interieure"],
        q: "Vérif intérieure : « Allume les feux de détresse et cite 3 cas où on les utilise. »",
        opts: [
          "Panne/accident, ralentissement brutal sur autoroute, véhicule lent gênant",
          "La nuit en ville pour mieux voir",
          "Pour remercier une voiture qui te laisse passer",
        ],
        correct: 0,
        why: "Warnings = signaler un danger : panne/accident, bouchon soudain sur voie rapide, convoi/véhicule très lent. C'est du par-cœur, ne lâche pas ces 3 points.",
      },
      {
        id: "p7-secours",
        fam: "autonomie",
        tags: ["premiers_secours"],
        q: "Premiers secours : à quelle distance places-tu le triangle de pré-signalisation ?",
        opts: [
          "Environ 30 mètres avant le danger (et visible)",
          "Juste derrière ta voiture",
          "On ne pose pas de triangle",
        ],
        correct: 0,
        why: "~30 m avant le danger, là où les autres te voient à temps. Et tu te mets en sécurité (gilet, hors chaussée) avant.",
      },
    ],
  },
  {
    n: 8,
    key: "bilan",
    emoji: "🏁",
    titre: "Retour & immobilisation",
    sous: "L'examen n'est fini que moteur coupé. Reste concentré.",
    items: [
      {
        id: "p8-immo",
        fam: "commandes",
        tags: ["manoeuvre"],
        q: "Tu rentres au centre. Pour immobiliser proprement :",
        opts: [
          "Point mort, frein à main, essuie-glaces coupés, moteur éteint",
          "Tu coupes le moteur en laissant une vitesse engagée sur le plat",
          "Tu sors, l'inspecteur s'occupe du reste",
        ],
        correct: 0,
        why: "Point mort + frein à main + essuie-glaces coupés + moteur éteint. Des élèves se font éliminer en relâchant dans les dernières minutes. Reste à fond jusqu'au bout.",
      },
      {
        id: "p8-eco",
        fam: "commandes",
        bonus: "eco",
        tags: ["eco_conduite"],
        q: "Tout au long du parcours, pour la conduite économique tu as…",
        opts: [
          "Passé les rapports assez tôt, conduite souple et fluide",
          "Poussé chaque vitesse au maximum dans les tours",
          "Roulé constamment en sous-régime à 1000 tr/min",
        ],
        correct: 0,
        why: "Bonus éco-conduite : monter les rapports tôt, anticiper pour éviter les coups de frein, rester fluide.",
      },
    ],
  },
];

export const PHASES = PHASES_FR.map((phase) => ({
  ...phase,
  titre: t(`phase_${phase.key}.titre`, phase.titre),
  sous: t(`phase_${phase.key}.sous`, phase.sous),
  items: phase.items.map((item) => ({
    ...item,
    q: t(`${item.id}.q`, item.q),
    opts: item.opts.map((option, index) =>
      t(`${item.id}.opts.${index}`, option),
    ),
    why: t(`${item.id}.why`, item.why),
  })),
}));

// Score « façon /31 » : par famille, (bonnes / total) × max famille ; + bonus.
// Une faute éliminatoire rencontrée → échec quel que soit le total (officiel).
export function scoreExam(answers) {
  // answers : [{ item, picked, correct, fam, bonusKey, isElim }]
  const elim = answers.find((a) => a.isElim) || null;
  const famScore = {};
  for (const key of Object.keys(FAMILLES)) {
    const list = answers.filter((a) => a.fam === key);
    const good = list.filter((a) => a.correct).length;
    famScore[key] = list.length
      ? Math.round((good / list.length) * FAMILLES[key].max)
      : 0;
  }
  let bonus = 0;
  const bonusGot = {};
  for (const key of Object.keys(BONUS)) {
    const it = answers.find((a) => a.bonusKey === key);
    bonusGot[key] = !!(it && it.correct);
    if (bonusGot[key]) bonus += BONUS[key].max;
  }
  const base = Object.values(famScore).reduce((s, v) => s + v, 0);
  const note = Math.min(TOTAL, base + bonus);
  // Point faible = la famille la plus loin de son max — SEULEMENT si elle a
  // réellement perdu des points (ratio < 1). Score parfait → weak = null.
  let weak = null;
  let worst = 1;
  for (const key of Object.keys(FAMILLES)) {
    const ratio = famScore[key] / FAMILLES[key].max;
    if (ratio < worst) {
      worst = ratio;
      weak = key;
    }
  }
  return {
    note,
    famScore,
    bonusGot,
    elim,
    weak,
    passed: !elim && note >= SEUIL,
  };
}
