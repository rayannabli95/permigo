// ═══════════════════════════════════════════════════
// Traductions des FICHES DE RÉVISION DE CONDUITE (en / ar). Source FR = fiches-conduite.js.
// Recette identique à situations-i18n.js : on affiche la traduction AVEC le français
// gardé dessous (l'examen du code reste en français). L'arabe est RTL par span,
// l'app reste LTR. Généré par workflow (translate → verify bilingue), validé en dur
// (longueurs de tableaux, structure des sections, cohérence bva). NE PAS éditer à la main.
// ═══════════════════════════════════════════════════
import { getLang } from "@/utils/lang.js";

const FICHE_UI = {
 "en": {
  "sub": "Tick your steps, then unlock the test.",
  "deck": "Your deck",
  "geste": "step",
  "gestes": "steps",
  "cta": "Test yourself",
  "order": "Put them in order",
  "coach": "Coach cards",
  "methode": "The method",
  "next": "your turn",
  "back": "Back",
  "err_h": "The mistake to avoid",
  "why_h": "Why it matters",
  "bva_h": "Automatic gearbox",
  "source": "Seen with real instructors:",
  "monde": "World"
 },
 "ar": {
  "sub": "علّم على خطواتك، ثمّ افتح الاختبار.",
  "deck": "مجموعتك",
  "geste": "خطوة",
  "gestes": "خطوات",
  "cta": "اختبر نفسك",
  "order": "رتّبها بالترتيب",
  "coach": "بطاقات المدرّب",
  "methode": "الطريقة",
  "next": "دورك",
  "back": "رجوع",
  "err_h": "الخطأ الذي يجب تجنّبه",
  "why_h": "لماذا يهمّ",
  "bva_h": "علبة السرعة الأوتوماتيكية",
  "source": "مأخوذ من مدرّبين حقيقيين:",
  "monde": "عالم"
 }
};

// clé = code de fiche → { en:{titre,competence,methode[],pourquoi,erreur,bva,quiz[]}, ar:{...} }
const FICHE_I18N = {
 "C1a": {
  "en": {
   "titre": "Getting to grips with the driver's seat",
   "competence": "Handling",
   "pourquoi": "You need to be able to work a turn signal or a windshield wiper without taking your eyes off the road. If you go looking for a control while driving, you stop looking ahead.",
   "erreur": "Mixing up the two stalks and switching on the wipers instead of the turn signal. Simple reminder: turn signals on the left, wipers on the right.",
   "bva": "No clutch pedal: at your feet there is only the brake (left) and the accelerator (right), both for the right foot. In place of the gear lever, you find the P / R / N / D selector. The stalks (turn signals on the left, wipers on the right) do not change.",
   "methode": [
    "Do a quick walk-around of the car: nothing under the wheels, tires not flat, lights and license plates clean.",
    "Get in, close the door, and check that it is properly shut.",
    "Locate the dashboard controls without starting: speedometer, fuel gauge, warning lights.",
    "Locate the two stalks behind the steering wheel: the LEFT stalk = the turn signals (and the low/high beam headlights, the headlight flash); the RIGHT stalk = the windshield wipers (and the washer).",
    "Locate the foot controls: on the left the clutch, in the middle the brake, on the right the accelerator.",
    "Turn on the ignition (without starting) and watch the warning lights: they come on and then go off. If one stays lit (oil, battery, brake), you report it."
   ],
   "quiz": [
    {
     "q": "You want to use the turn signal. Which stalk?",
     "options": [
      "The one on the right",
      "The one on the left",
      "The button in the center"
     ],
     "explication": "A pro's reminder: turn signals on the left, wipers on the right. You will never get it wrong again."
    },
    {
     "q": "You want to wipe the windshield. What do you use?",
     "options": [
      "The right stalk",
      "The left stalk",
      "The headlight flash"
     ],
     "explication": "Right = windshield wipers and washer. The left one is for your turn signals."
    },
    {
     "q": "With the ignition on, a warning light stays lit after the test. What do you do?",
     "options": [
      "You wait and you report it",
      "You set off, it will pass",
      "You turn off the headlights"
     ],
     "explication": "A warning light that stays lit (oil, brake, battery) indicates a real fault."
    },
    {
     "q": "Before getting in, your very first reflex?",
     "options": [
      "Start the engine",
      "Adjust the radio",
      "A quick walk-around of the car"
     ],
     "explication": "Nothing under the wheels, tires, lights and plates clean: ten seconds that save you."
    }
   ]
  },
  "ar": {
   "titre": "التعوّد على مقعد القيادة",
   "competence": "التحكّم",
   "pourquoi": "يجب أن تكون قادراً على تشغيل الغمّاز أو ماسحة الزجاج دون أن ترفع عينيك عن الطريق. إذا بحثت عن أحد المفاتيح أثناء القيادة، فإنك تتوقف عن النظر إلى الأمام.",
   "erreur": "الخلط بين العتلتين وتشغيل ماسحات الزجاج بدلاً من الغمّاز. تذكير بسيط: الغمّاز على اليسار، والماسحات على اليمين.",
   "bva": "لا توجد دواسة قابض: عند قدميك يوجد فقط الفرامل (يسار) ودواسة الوقود (يمين)، وكلاهما للقدم اليمنى. بدلاً من عصا نقل السرعات، تجد مُحدِّد P / R / N / D. أما العتلتان (الغمّاز على اليسار، والماسحات على اليمين) فلا تتغيّران.",
   "methode": [
    "قم بجولة سريعة حول السيارة: لا شيء تحت العجلات، والإطارات ليست فارغة من الهواء، والأضواء واللوحات نظيفة.",
    "اجلس، أغلق الباب، وتأكّد من أنه مغلق جيداً.",
    "تعرّف على مفاتيح لوحة القيادة دون تشغيل المحرّك: عدّاد السرعة، مؤشّر الوقود، الأضواء التحذيرية.",
    "تعرّف على العتلتين خلف المِقود: العتلة اليسرى = الغمّازات (والأضواء المنخفضة / العالية، وومضة الأضواء)؛ العتلة اليمنى = ماسحات الزجاج (وغسّالة الزجاج).",
    "تعرّف على المفاتيح عند القدمين: على اليسار القابض، في الوسط الفرامل، على اليمين دواسة الوقود.",
    "أدر مفتاح التشغيل (دون تشغيل المحرّك) وراقب الأضواء التحذيرية: تُضيء ثم تنطفئ. إن بقي أحدها مُضاءً (الزيت، البطارية، الفرامل)، فأبلِغ عنه."
   ],
   "quiz": [
    {
     "q": "تريد تشغيل الغمّاز. أي عتلة؟",
     "options": [
      "التي على اليمين",
      "التي على اليسار",
      "الزرّ في الوسط"
     ],
     "explication": "تذكير المحترفين: الغمّاز على اليسار، والماسحات على اليمين. لن تخطئ بعد الآن."
    },
    {
     "q": "تريد مسح الزجاج الأمامي. ماذا تُشغّل؟",
     "options": [
      "العتلة اليمنى",
      "العتلة اليسرى",
      "ومضة الأضواء"
     ],
     "explication": "اليمين = ماسحات الزجاج وغسّالة الزجاج. أما اليسار فهو للغمّازات."
    },
    {
     "q": "مفتاح التشغيل مُدار، وبقي ضوء تحذيري مُضاءً بعد الاختبار. ماذا تفعل؟",
     "options": [
      "تنتظر وتُبلِغ عنه",
      "تنطلق، سيزول الأمر",
      "تُطفئ الأضواء"
     ],
     "explication": "الضوء التحذيري الذي يبقى مُضاءً (الزيت، الفرامل، البطارية) يشير إلى عطل حقيقي."
    },
    {
     "q": "قبل الركوب، ما هو أول ردّ فعل لديك؟",
     "options": [
      "تشغيل المحرّك",
      "ضبط المذياع",
      "جولة سريعة حول السيارة"
     ],
     "explication": "لا شيء تحت العجلات، والإطارات والأضواء واللوحات نظيفة: عشر ثوانٍ تُنقذك."
    }
   ]
  }
 },
 "C1b": {
  "en": {
   "titre": "Set up your driving position",
   "competence": "Handling",
   "pourquoi": "A badly adjusted seat = you can't press the clutch all the way down (risk of stalling) and you tire quickly. Thirty seconds of adjusting = a whole lesson that's more comfortable and safer.",
   "erreur": "Setting the seat too far back to \"have room\": your left leg is stretched out and no longer presses the clutch all the way down → you stall without understanding why.",
   "bva": "Since there is no clutch, the cue \"left leg slightly bent on the clutch\" doesn't apply. You adjust the distance so your right foot reaches the brake and accelerator without stretching your leg, and you settle your left foot at rest (on the footrest to the left). Height, backrest, steering wheel, mirrors, seatbelt: the same.",
   "methode": [
    "Seat — distance (depth): move the seat forward/back so your left foot can press the clutch all the way down with your leg still slightly bent (never fully straight). Many learners sit too far back \"to have room\": if you have to stretch your leg, move closer.",
    "Seat — height: adjust it so you can see the road without craning your neck. A concrete cue from the instructor: lower the sun visor — if you can see the road below it, your eye height is correct; if the sun visor hides the road from you, you're too low.",
    "Backrest: adjust it in relation to how you hold the steering wheel — when your hands are on the wheel, your arms should stay slightly bent (neither too close nor too far).",
    "Headrest: the top of the headrest level with the top of your head.",
    "Steering wheel: adjust it if needed (handle under the wheel) so it doesn't bother your knees and you can clearly see the dashboard over the top.",
    "Mirrors: the interior one first, with your right hand, without lifting your shoulders off the seat — you should see the whole rear window at a single glance, without moving your head. Then the exterior ones: you only glimpse a small edge of your car at the bottom, the rest on the road (aim for about 90% road, your bodywork just serving as a reference).",
    "Seatbelt: it goes over the shoulder (not the neck) and over the hips (not the belly), lying flat, not twisted."
   ],
   "quiz": [
    {
     "q": "Why keep your left leg slightly bent when adjusting the seat?",
     "options": [
      "For knee comfort",
      "To press the clutch all the way down",
      "To see the road better"
     ],
     "explication": "A straight leg = the clutch isn't pressed all the way down, and you stall without understanding."
    },
    {
     "q": "You're adjusting the interior mirror. Do you lean over?",
     "options": [
      "Yes, to see better",
      "You tilt your head",
      "No, back and shoulders pressed against the seat"
     ],
     "explication": "It should show the whole rear window without you moving from your place."
    },
    {
     "q": "Where should the seatbelt go across your chest?",
     "options": [
      "Over the shoulder, never over the neck",
      "As close to the neck as possible",
      "Under the arm"
     ],
     "explication": "Over the shoulder and over the hips, lying flat, never twisted. Otherwise it protects you poorly."
    },
    {
     "q": "How do you quickly check that your seat height is right?",
     "options": [
      "You lower the sun visor",
      "You touch the ceiling",
      "You look at the hood"
     ],
     "explication": "If you can see the road below the lowered sun visor, your eye height is right."
    }
   ]
  },
  "ar": {
   "titre": "اضبط وضعية القيادة الخاصة بك",
   "competence": "التحكم",
   "pourquoi": "مقعد سيّئ الضبط = لا تستطيع الضغط على دواسة القابض (الكلتش) حتى النهاية (خطر توقّف المحرّك) وتتعب بسرعة. ثلاثون ثانية من الضبط = حصّة كاملة أكثر راحة وأماناً.",
   "erreur": "ضبط المقعد بعيداً جداً إلى الخلف «لتوفير مساحة»: تكون ساقك اليسرى ممدودة ولا تعود تضغط على القابض حتى النهاية ← يتوقّف المحرّك دون أن تفهم السبب.",
   "bva": "بما أنه لا يوجد قابض، فإن العلامة «الساق اليسرى مثنية قليلاً على القابض» لا تنطبق. تضبط المسافة بحيث تصل قدمك اليمنى إلى الفرامل ودواسة الوقود دون مدّ الساق، وتضع قدمك اليسرى في وضع الراحة (على مسند القدم إلى اليسار). الارتفاع والمسند والمقود والمرايا وحزام الأمان: كما هي.",
   "methode": [
    "المقعد — المسافة (العمق): حرّك المقعد إلى الأمام/الخلف بحيث تستطيع قدمك اليسرى الضغط على القابض حتى النهاية والساق لا تزال مثنية قليلاً (لا تكن مستقيمة تماماً أبداً). كثير من المتعلّمين يجلسون بعيداً جداً «لتوفير مساحة»: إذا اضطررت إلى مدّ ساقك، فاقترب أكثر.",
    "المقعد — الارتفاع: اضبطه بحيث ترى الطريق دون أن تُجهد رقبتك. علامة عملية من المدرّب: أنزِل واقية الشمس — إذا رأيت الطريق من تحتها فإن ارتفاع نظرك سليم؛ وإذا حجبت عنك واقية الشمس الطريق فأنت منخفض جداً.",
    "المسند (ظهر المقعد): يُضبط بالنسبة إلى مسك المقود — عندما تكون يداك على المقود يجب أن يبقى ذراعاك مثنيين قليلاً (لا قريبين جداً ولا بعيدين جداً).",
    "مسند الرأس: يكون أعلى مسند الرأس بمستوى أعلى الرأس.",
    "المقود: اضبطه إذا لزم الأمر (المقبض أسفل المقود) بحيث لا يزعج ركبتيك وترى لوحة العدادات جيداً من فوقه.",
    "المرايا: الداخلية أولاً، باليد اليمنى، دون رفع كتفيك عن المقعد — يجب أن ترى الزجاج الخلفي كاملاً بنظرة واحدة، دون تحريك رأسك. ثم الجانبيتان: لا ترى سوى جزء صغير من سيارتك في الأسفل، والباقي على الطريق (الهدف حوالي 90% من الطريق، وهيكل سيارتك مجرّد علامة مرجعية).",
    "حزام الأمان: يمرّ على الكتف (لا على الرقبة) وعلى الحوض (لا على البطن)، مستوياً وغير ملتوٍ."
   ],
   "quiz": [
    {
     "q": "لماذا نبقي الساق اليسرى مثنية قليلاً عند ضبط المقعد؟",
     "options": [
      "لراحة الركبة",
      "للضغط على القابض حتى النهاية",
      "لرؤية الطريق بشكل أفضل"
     ],
     "explication": "الساق الممدودة = القابض غير مضغوط حتى النهاية، فيتوقّف المحرّك دون أن تفهم."
    },
    {
     "q": "أنت تضبط المرآة الداخلية. هل تنحني؟",
     "options": [
      "نعم، لرؤية أفضل",
      "تُميل رأسك",
      "لا، الظهر والكتفان ملتصقان بالمقعد"
     ],
     "explication": "يجب أن تُظهر الزجاج الخلفي كاملاً دون أن تتحرّك من مكانك."
    },
    {
     "q": "أين يجب أن يمرّ حزام الأمان على الصدر؟",
     "options": [
      "على الكتف، وليس على الرقبة أبداً",
      "أقرب ما يكون إلى الرقبة",
      "تحت الذراع"
     ],
     "explication": "على الكتف وعلى الحوض، مستوياً، وغير ملتوٍ أبداً. وإلا فإنه يحمي بشكل سيّئ."
    },
    {
     "q": "كيف تتحقّق بسرعة من أن ارتفاع مقعدك سليم؟",
     "options": [
      "تُنزِل واقية الشمس",
      "تلمس السقف",
      "تنظر إلى غطاء المحرّك"
     ],
     "explication": "إذا رأيت الطريق تحت واقية الشمس المنزَّلة، فإن ارتفاع نظرك سليم."
    }
   ]
  }
 },
 "C1c": {
  "en": {
   "titre": "Holding the steering wheel and keeping your line",
   "competence": "Handling",
   "pourquoi": "Your eyes guide your hands. If you stare at the hood or an obstacle, you drive straight into it. If you look far ahead to where you want to go, your line naturally becomes straight.",
   "erreur": "Driving with your arms constantly crossed, or holding the wheel with a single hand resting at the top: you lose precision and strength to react quickly. Another common trap during maneuvers: the moment the car drifts a little off line, jerking the wheel in every direction to \"catch\" it — you get completely lost. The right reflex: move slowly, watch where the car is going, then correct gently.",
   "bva": "",
   "methode": [
    "Place your hands like on a clock: quarter to three (9 and 3), thumbs resting on the rim, not wrapped underneath.",
    "Look far ahead, not at the hood: your gaze \"pulls\" the car toward where you want to go.",
    "Turn by pull-pushing the wheel without crossing your hands: one hand pulls, the other pushes/guides.",
    "Only cross your hands for slow maneuvers (parallel parking, U-turn), never at normal speed.",
    "Let the wheel come back while holding it after a turn — don't let go and let it spin on its own.",
    "Learn \"how many turns does the wheel make?\": a wheel turns about one and a half turns each way (one full turn plus a half turn to reach full lock). To know whether your wheels are straight after full lock, do exactly the reverse.",
    "Learn \"turn the wheel toward the side you want to go\": rather than getting confused between right and left (especially in reverse), turn the wheel toward the side you want the car to move closer to, both going forward and in reverse."
   ],
   "quiz": [
    {
     "q": "Where do you place your hands on the wheel?",
     "options": [
      "At the top, at twelve o'clock",
      "At quarter to three (9 and 3)",
      "One hand is enough"
     ],
     "explication": "Thumbs resting on the rim: you keep precision and strength to react quickly."
    },
    {
     "q": "You've just turned full lock to the right. How do you straighten up?",
     "options": [
      "By feel",
      "The exact reverse: one and a half turns to the left",
      "You let go of the wheel"
     ],
     "explication": "A wheel turns about one and a half turns each way. You do the reverse."
    },
    {
     "q": "In reverse, you no longer know which way to turn. What's the cue?",
     "options": [
      "You turn toward where you want the car to go",
      "You turn the opposite way",
      "You look ahead"
     ],
     "explication": "Same logic going forward and in reverse: it keeps you from mixing up right and left."
    },
    {
     "q": "The car slowly drifts off line during a maneuver. What do you do?",
     "options": [
      "Lots of wheel jerks",
      "You speed up to catch it",
      "You slow down, watch, correct gently"
     ],
     "explication": "Repeated wheel jerks get you lost. Slow down first, correct afterward."
    }
   ]
  },
  "ar": {
   "titre": "إمساك المِقود والحفاظ على مسارك",
   "competence": "التحكّم",
   "pourquoi": "نظرك يوجّه يديك. إذا حدّقت في غطاء المحرّك أو في عائق، فسوف تتّجه نحوه. أمّا إذا نظرت بعيداً إلى حيث تريد الذهاب، فسيصبح مسارك مستقيماً بشكل طبيعي.",
   "erreur": "القيادة بذراعين متقاطعتين باستمرار، أو إمساك المقود بيد واحدة موضوعة في الأعلى: تفقد الدقّة والقوة اللازمتين للتفاعل بسرعة. فخّ شائع آخر أثناء المناورة: بمجرّد أن تنحرف السيارة قليلاً عن مسارها، تحرّك المقود في كل الاتجاهات لكي \"تتدارك\" الوضع ← فتضيع تماماً. ردّ الفعل الصحيح: تقدّم ببطء، راقب إلى أين تتّجه السيارة، ثم صحّح المسار بلطف.",
   "bva": "",
   "methode": [
    "ضع يديك كما على عقارب الساعة: التاسعة والربع (الثالثة إلا ربع)، مع وضع الإبهامين على حافة المقود، لا لفّهما من تحتها.",
    "انظر بعيداً إلى الأمام، لا إلى غطاء المحرّك: نظرك \"يسحب\" السيارة نحو حيث تريد الذهاب.",
    "أدِر المقود بالسحب والدفع دون تقاطع اليدين: يد تسحب والأخرى تدفع/تُرافق.",
    "لا تقاطع يديك إلّا في المناورات البطيئة (الركن الجانبي، الدوران الكامل)، ولا تفعل ذلك أبداً بالسرعة العادية.",
    "دَع المقود يعود ممسكاً به بعد المنعطف — لا تتركه ليدور من تلقاء نفسه.",
    "تعرّف على \"كم دورة يدور المقود؟\": يدور المقود نحو دورة ونصف في كل اتجاه (دورة كاملة زائد نصف دورة للوصول إلى أقصى انعطاف). ولمعرفة ما إذا كانت عجلاتك مستقيمة بعد انعطاف كامل، أعِد العكس تماماً.",
    "تعرّف على \"أدِر مقودك نحو الجهة التي تريد الذهاب إليها\": بدلاً من أن تختلط عليك اليمين واليسار (خاصّة عند الرجوع للخلف)، أدِر المقود نحو الجهة التي تريد أن تقترب السيارة منها، سواء في السير للأمام أو للخلف."
   ],
   "quiz": [
    {
     "q": "أين تضع يديك على المقود؟",
     "options": [
      "في الأعلى، عند الثانية عشرة",
      "عند التاسعة والربع (الثالثة إلا ربع)",
      "يد واحدة تكفي"
     ],
     "explication": "الإبهامان على حافة المقود: تحافظ على الدقّة والقوة للتفاعل بسرعة."
    },
    {
     "q": "لقد انعطفت للتوّ إلى أقصى اليمين. كيف تعيد المقود إلى الوضع المستقيم؟",
     "options": [
      "حسب الإحساس",
      "العكس تماماً: دورة ونصف إلى اليسار",
      "تترك المقود"
     ],
     "explication": "يدور المقود نحو دورة ونصف في كل اتجاه. تُعيد العكس."
    },
    {
     "q": "عند الرجوع للخلف، لم تعد تعرف إلى أيّ جهة تدير المقود. ما العلامة المرشِدة؟",
     "options": [
      "تدير المقود نحو حيث تريد أن تذهب السيارة",
      "تدير المقود إلى الجهة المعاكسة",
      "تنظر إلى الأمام"
     ],
     "explication": "المنطق نفسه في السير للأمام وللخلف: هذا يمنعك من الخلط بين اليمين واليسار."
    },
    {
     "q": "تنحرف السيارة ببطء عن مسارها أثناء المناورة. ماذا تفعل؟",
     "options": [
      "الكثير من الحركات العنيفة للمقود",
      "تُسرِع لتتدارك الوضع",
      "تُبطئ، تراقب، وتصحّح بلطف"
     ],
     "explication": "الحركات العنيفة المتكرّرة للمقود تُضيّعك. أبطئ أولاً، ثم صحّح بعد ذلك."
    }
   ]
  }
 },
 "C1d": {
  "en": {
   "titre": "Start and stop smoothly",
   "competence": "Handling",
   "pourquoi": "The biting point (or rather the biting zone) is the moment when the clutch starts to transfer the engine's power to the wheels. Releasing it too fast at that moment = the car jolts or stalls. Releasing it smoothly = a clean start.",
   "erreur": "Releasing the clutch all at once at the biting point → it stalls or lurches. And declutching too late when braking → it stalls just before you stop.",
   "bva": "No biting point, no clutch, no 1st gear to engage. To start: foot on the brake, selector on D, release the brake and the car moves on its own (at idle), then accelerate gently. To stop: brake gradually with your right foot until you stop — no risk of stalling. For a long stop, shift to P and set the handbrake.",
   "methode": [
    "Before you drive — Before starting: handbrake on, gear lever in neutral, clutch pressed all the way down, ignition on.",
    "Before you drive — Engage 1st gear.",
    "The biting point — Find the biting zone: let the clutch up and move quickly through the \"dead zone\" (between the pedal fully pressed and the start of the biting point), then slow the movement as soon as the engine responds.",
    "The biting point — At the biting point, give a touch of accelerator and let your left foot slide up gradually (the car \"wants\" to move, the engine sound changes a little).",
    "The biting point — Release the handbrake, the car moves forward.",
    "Stopping and foot position — To stop: ease off the accelerator early, brake gradually, and press the clutch just before coming to a full stop so you don't stall.",
    "Stopping and foot position — At a stop: keep the brake held, then neutral + handbrake if you stay stationary.",
    "Stopping and foot position — Foot position: press with the ball of your foot, heel anchored on the floor, and slide your heel along the floor to let the clutch up. If you lift your heel or your sole slips, you lose precision and can no longer find the biting point in the same spot."
   ],
   "quiz": [
    {
     "q": "You're setting off. What's the pace with the clutch?",
     "options": [
      "Let it all go at once",
      "Declutch, find the biting point, ease up gently",
      "Floor the accelerator first"
     ],
     "explication": "What makes it stall is letting the clutch up all at once at the biting point."
    },
    {
     "q": "Why a touch of accelerator when setting off?",
     "options": [
      "To make noise",
      "To give the engine some power",
      "It's not useful"
     ],
     "explication": "The car weighs a ton: without a little gas when setting off, you stall."
    },
    {
     "q": "You're braking to a complete stop. When do you press the clutch?",
     "options": [
      "Just before stopping",
      "Right away",
      "After stopping"
     ],
     "explication": "Too early = coasting, too late = you stall right before you stop."
    },
    {
     "q": "Heel lifted, sole slipping on the pedal: what's the risk?",
     "options": [
      "None, it's the same",
      "You lose the biting point",
      "You brake harder"
     ],
     "explication": "With your heel anchored on the floor and sliding, you find the biting point in the same spot every time."
    }
   ]
  },
  "ar": {
   "titre": "الانطلاق والتوقّف بسلاسة",
   "competence": "التحكّم في السيارة",
   "pourquoi": "نقطة التلامس (أو بالأحرى منطقة التلامس) هي اللحظة التي يبدأ فيها القابض (الدبرياج) بنقل قوة المحرّك إلى العجلات. إطلاقه بسرعة كبيرة في تلك اللحظة = تنتفض السيارة أو يتوقّف المحرّك. إطلاقه بسلاسة = انطلاقة نظيفة.",
   "erreur": "إطلاق القابض دفعة واحدة عند نقطة التلامس ← يتوقّف المحرّك أو تنطلق السيارة بتشنّج. وضغط القابض متأخّرًا أثناء الفرملة ← يتوقّف المحرّك قبيل التوقّف مباشرة.",
   "bva": "لا نقطة تلامس، ولا قابض، ولا سرعة أولى يجب إدخالها. للانطلاق: القدم على الفرامل، الذراع على الوضع D، تُفلت الفرامل فتتحرّك السيارة وحدها (على السرعة الخاملة)، ثم تُسرّع بهدوء. للتوقّف: تفرمل تدريجيًّا بالقدم اليمنى حتى التوقّف — دون أي خطر لتوقّف المحرّك. عند التوقّف الطويل، تنتقل إلى الوضع P وتشدّ فرملة اليد.",
   "methode": [
    "قبل السير — قبل الانطلاق: فرملة اليد مشدودة، الذراع على الوضع المحايد، القابض مضغوط حتى النهاية، تشغيل الإشعال.",
    "قبل السير — أدخِل السرعة الأولى.",
    "نقطة التلامس — جِد منطقة التلامس: أفلِت القابض وتجاوز بسرعة «المنطقة الميتة» (بين ضغط الدواسة كاملًا وبداية التلامس)، ثم أبطئ الحركة فور استجابة المحرّك.",
    "نقطة التلامس — عند التلامس، امنح لمسة خفيفة من دواسة الوقود ودع قدمك اليسرى تنزلق صعودًا تدريجيًّا (السيارة «تريد» التقدّم، ويتغيّر صوت المحرّك قليلًا).",
    "نقطة التلامس — أفلِت فرملة اليد فتتقدّم السيارة.",
    "التوقّف ووضع القدم — للتوقّف: ارفع قدمك عن دواسة الوقود مبكرًا، افرمل تدريجيًّا، واضغط القابض قبيل التوقّف التامّ مباشرة كي لا يتوقّف المحرّك.",
    "التوقّف ووضع القدم — عند التوقّف: أبقِ الفرامل مضغوطة، ثم الوضع المحايد + فرملة اليد إن بقيت ثابتًا.",
    "التوقّف ووضع القدم — وضع القدم: اضغط بمقدّمة القدم مع تثبيت الكعب على الأرض، وأنزلق بالكعب على الأرض لرفع القابض. إن رفعت كعبك أو انزلق نعلك، فقدت الدقّة ولم تعد تجد نقطة التلامس في المكان نفسه."
   ],
   "quiz": [
    {
     "q": "أنت تنطلق. ما إيقاع القابض؟",
     "options": [
      "إطلاقه كلّه دفعة واحدة",
      "اضغط القابض، جِد نقطة التلامس، ثم أفلِته بهدوء",
      "الضغط على دواسة الوقود بالكامل أولًا"
     ],
     "explication": "ما يوقف المحرّك هو إطلاق القابض دفعة واحدة عند نقطة التلامس."
    },
    {
     "q": "لماذا لمسة خفيفة من دواسة الوقود عند الانطلاق؟",
     "options": [
      "لإحداث ضجيج",
      "لمنح المحرّك قوّة",
      "ليست مفيدة"
     ],
     "explication": "السيارة تزن طنًّا: دون قليل من الوقود عند الانطلاق، يتوقّف المحرّك."
    },
    {
     "q": "أنت تفرمل حتى التوقّف التامّ. متى تضغط القابض؟",
     "options": [
      "قبيل التوقّف مباشرة",
      "فورًا",
      "بعد التوقّف"
     ],
     "explication": "مبكّرًا جدًّا = سير حرّ، متأخّرًا جدًّا = يتوقّف المحرّك قبيل التوقّف تمامًا."
    },
    {
     "q": "الكعب مرفوع والنعل ينزلق على الدواسة: ما الخطر؟",
     "options": [
      "لا خطر، الأمر سِيّان",
      "تفقد نقطة التلامس",
      "تفرمل بقوّة أكبر"
     ],
     "explication": "مع تثبيت الكعب على الأرض وانزلاقه، تجد نقطة التلامس في المكان نفسه في كلّ مرّة."
    }
   ]
  }
 },
 "C1e": {
  "en": {
   "titre": "Managing the accelerator and the brake",
   "competence": "Handling",
   "pourquoi": "Smooth driving is all about anticipation: if you look far ahead, you never have to brake hard. Bonus: comfortable passengers, less fuel used, and a better mark at the test.",
   "erreur": "Driving like an accordion: accelerating hard then braking hard, over and over, because you look too close in front of you. You wear everyone out and you wear out the car.",
   "bva": "Because the same right foot works both the brake and the accelerator, the dosing happens with a single foot: you lift off the gas and press the brake, never using both at the same time. In D, the car keeps creeping forward on its own at idle as soon as you release the brake — remember to hold the brake to stay still on a slope.",
   "methode": [
    "Accelerate gradually, with the ball of your foot: your right foot pushes down gently, never in a jerk.",
    "Practise holding the engine at different speeds (e.g. ~1000, ~1500, ~2500 rpm): the more you press, the higher the engine revs; if you go past the target rpm, ease off a little without letting go completely, then re-adjust. This step-by-step dosing can even be practised while stopped.",
    "Look far ahead so you see slow-downs coming in advance.",
    "To slow down, first lift off the accelerator (engine braking already does part of the work).",
    "Then brake in two stages (progressive braking): a first firmer press to slow down, then a lighter press to hold the car back, which you release just before stopping. You play with the brake pedal (a bit more, a bit less).",
    "Keep your right foot light: a heavy foot means jerks, extra fuel use, and shaken passengers."
   ],
   "quiz": [
    {
     "q": "A traffic light turns red 100 m ahead. First thing to do?",
     "options": [
      "Brake hard at the last moment",
      "Lift off the accelerator, then brake gently",
      "Keep on the gas"
     ],
     "explication": "Engine braking already does part of the work. You anticipate, you don't slam the brakes."
    },
    {
     "q": "What is two-stage progressive braking?",
     "options": [
      "Braking hard all the way to the end",
      "Pumping the pedal",
      "Firm to slow down, light to hold back"
     ],
     "explication": "You release just before stopping: no jerk, passengers not shaken."
    },
    {
     "q": "Driving like an accordion (accelerate hard, brake hard, over and over) — why is it bad?",
     "options": [
      "It's faster",
      "You look too close and wear everyone out",
      "It's safer"
     ],
     "explication": "Look far ahead: you see the slow-downs coming and you smooth out your driving."
    },
    {
     "q": "How do you practise dosing the accelerator?",
     "options": [
      "Hold the engine at different speeds",
      "By pressing all the way down",
      "Only while driving fast"
     ],
     "explication": "You aim for an rpm, and if you overshoot you ease off a little without letting go. Even while stopped."
    }
   ]
  },
  "ar": {
   "titre": "التحكم في دواسة السرعة ودواسة الفرامل",
   "competence": "التحكم في السيارة",
   "pourquoi": "القيادة السلسة أساسها الاستباق: إذا نظرت بعيداً إلى الأمام، فلن تضطر أبداً إلى الفرملة بعنف. وميزة إضافية: راحة الركاب، واستهلاك أقل للوقود، ونتيجة أفضل في الامتحان.",
   "erreur": "القيادة على شكل «أكورديون»: التسارع بقوة ثم الفرملة بقوة، بشكل متكرر، لأنك تنظر قريباً جداً أمامك. فتُتعب الجميع وتُتلف السيارة.",
   "bva": "بما أن القدم اليمنى نفسها تستخدم للفرامل ودواسة السرعة، فإن التحكم يتم بقدم واحدة: ترفع قدمك عن دواسة السرعة وتضعها على الفرامل، دون استخدام الاثنتين في الوقت نفسه أبداً. في وضع D، تواصل السيارة التقدم من تلقاء نفسها عند السرعة البطيئة بمجرد أن ترفع قدمك عن الفرامل — تذكّر أن تبقي قدمك على الفرامل لتظل ثابتاً في المنحدر.",
   "methode": [
    "سارِع تدريجياً بمقدمة القدم: تدفع القدم اليمنى برفق، دون أي حركة مفاجئة أبداً.",
    "تدرّب على تثبيت المحرك على سرعات دوران مختلفة (مثلاً ~1000 و~1500 و~2500 دورة في الدقيقة): كلما ضغطت أكثر، ارتفعت دورات المحرك؛ وإذا تجاوزت السرعة المستهدفة، خفّف الضغط قليلاً دون أن ترفع قدمك تماماً، ثم أعد الضبط. هذا التحكم «بالمراحل» يمكن التدرب عليه حتى والسيارة متوقفة.",
    "انظر بعيداً لترى التباطؤات قادمة مسبقاً.",
    "للتباطؤ، ارفع قدمك أولاً عن دواسة السرعة (فرملة المحرك تقوم بجزء من العمل بالفعل).",
    "ثم افرمل على مرحلتين (فرملة تنازلية): ضغطة أولى أقوى للتباطؤ، ثم ضغطة أخف لكبح السيارة، تُخفّفها قبل التوقف مباشرة. أنت تتحكم في دواسة الفرامل (أكثر قليلاً، أقل قليلاً).",
    "أبقِ قدمك اليمنى خفيفة: القدم الثقيلة تعني حركات مفاجئة واستهلاكاً زائداً للوقود واهتزاز الركاب."
   ],
   "quiz": [
    {
     "q": "إشارة ضوئية تتحول إلى الأحمر على بعد 100 متر أمامك. ما أول تصرف؟",
     "options": [
      "الفرملة بقوة في اللحظة الأخيرة",
      "رفع القدم عن دواسة السرعة، ثم الفرملة برفق",
      "إبقاء الضغط على دواسة السرعة"
     ],
     "explication": "فرملة المحرك تقوم بجزء من العمل بالفعل. أنت تستبق ولا تفرمل فجأة."
    },
    {
     "q": "ما هي الفرملة التنازلية على مرحلتين؟",
     "options": [
      "الفرملة بقوة حتى النهاية",
      "الضغط المتكرر على الدواسة",
      "قوية للتباطؤ، خفيفة للكبح"
     ],
     "explication": "تُخفّف الضغط قبل التوقف مباشرة: دون حركة مفاجئة، ودون اهتزاز الركاب."
    },
    {
     "q": "القيادة على شكل أكورديون (تسارع بقوة، فرملة بقوة، بشكل متكرر) — لماذا هي سيئة؟",
     "options": [
      "إنها أسرع",
      "تنظر قريباً جداً وتُتعب الجميع",
      "إنها أكثر أماناً"
     ],
     "explication": "انظر بعيداً: ترى التباطؤات قادمة فتجعل قيادتك سلسة."
    },
    {
     "q": "كيف تتدرب على التحكم في دواسة السرعة؟",
     "options": [
      "تثبيت المحرك على سرعات دوران مختلفة",
      "بالضغط حتى النهاية",
      "فقط أثناء القيادة بسرعة"
     ],
     "explication": "تستهدف سرعة دوران معينة، وإذا تجاوزتها تُخفّف الضغط قليلاً دون أن ترفع قدمك. حتى والسيارة متوقفة."
    }
   ]
  }
 },
 "C1f": {
  "en": {
   "titre": "Change gear at the right moment",
   "competence": "Handling",
   "pourquoi": "The right gear is the one that keeps the engine comfortable: neither straining nor over-revving. Downshifting before the bend leaves you power to accelerate cleanly on the way out.",
   "erreur": "Looking at the gear lever while changing gear (you're no longer watching the road) and stalling on a downshift because you release the clutch too fast at low revs. Also picking the wrong gear from a poor grip on the lever (aiming for 4th, engaging 2nd): a gearbox mistake is often an automatic fail on the test.",
   "bva": "There is no gear change to make: the gearbox does it for you. No clutch, no gear lever: you stay in D and manage everything with the accelerator. This card (manual upshifting/downshifting) does not concern a learner in an automatic — and the risk of a fail-worthy gearbox error does not exist. Good to know: some automatics offer a manual mode (+/-), but it isn't required at the start of learning.",
   "methode": [
    "Listen to / watch the engine revs. The sound cue first (\"the engine is climbing\"); rough figures: ~2000 rpm on a diesel, ~2500 on a petrol.",
    "To change up a gear: lift off the accelerator, press the clutch fully, move the lever, release the clutch gently (in two stages), get back on the accelerator.",
    "Hold the lever properly: with the palm of your hand resting around the knob, never with your fingertips or gripping hard. No force needed: it's the position of your hand that matters.",
    "Use the return spring: the lever always comes back to neutral (between 3rd and 4th) on its own. Place your hand on the right-hand side of neutral for the right-hand gears (5/6 + reverse depending on the model) and in front of/behind for 1/2/3/4 to counter this spring.",
    "Keep your eyes on the road, not on the lever: you feel the gears by hand.",
    "Downshift BEFORE a bend or braking, never during — and you downshift because you have already slowed down, not to slow down. You pick the right gear so you have pulling power on the way out.",
    "Match the gear to your speed: too high at low speed = the engine \"splutters\"; too low at high speed = the engine \"screams\". You stop in 2nd, not in 1st (then you go back to 1st to set off again)."
   ],
   "quiz": [
    {
     "q": "You're changing gear. Where do you look?",
     "options": [
      "At the gear lever",
      "At the road, always",
      "At the speedometer"
     ],
     "explication": "You feel the gears by hand, palm on the knob, without leaving the road."
    },
    {
     "q": "How do you hold the gear lever?",
     "options": [
      "With your fingertips",
      "Gripped very hard",
      "Palm resting on the knob, without forcing"
     ],
     "explication": "It's the position of your hand that matters, not the force. A gearbox mistake is an automatic fail."
    },
    {
     "q": "Tight bend ahead. Do you downshift before or during?",
     "options": [
      "During the bend",
      "Before, once you've slowed down",
      "After the bend"
     ],
     "explication": "You downshift because you've already slowed down, to have pulling power on the way out."
    },
    {
     "q": "You stop at a STOP sign. In which gear?",
     "options": [
      "In 1st",
      "In 2nd",
      "In neutral"
     ],
     "explication": "You stop in 2nd, then go back to 1st to set off again. Smoother."
    }
   ]
  },
  "ar": {
   "titre": "تغيير السرعة في الوقت المناسب",
   "competence": "التحكم في المركبة",
   "pourquoi": "السرعة المناسبة هي التي تُبقي المحرك مرتاحاً: لا يجهد ولا يرتفع دورانه أكثر من اللازم. خفض السرعة قبل المنعطف يترك لك قوة كافية للتسارع بسلاسة عند الخروج منه.",
   "erreur": "النظر إلى عصا ناقل الحركة أثناء تغيير السرعة (فلا تعود تنظر إلى الطريق)، وإطفاء المحرك عند خفض السرعة لأنك ترفع قدمك عن دواسة القابض بسرعة كبيرة مع انخفاض دوران المحرك. وكذلك اختيار السرعة الخاطئة بسبب مسك سيّئ للعصا (تقصد الرابعة فتُدخل الثانية): الخطأ في ناقل الحركة كثيراً ما يكون سبباً للرسوب المباشر في الاختبار.",
   "bva": "لا يوجد أي تغيير للسرعة تقوم به: ناقل الحركة يفعل ذلك عنك. لا قابض ولا عصا سرعات: تبقى على وضع D وتدير كل شيء بدواسة التسارع. هذه البطاقة (رفع وخفض السرعة يدوياً) لا تخص المتعلّم على ناقل حركة أوتوماتيكي — وخطر الرسوب المباشر بسبب خطأ في ناقل الحركة غير موجود. من المفيد أن تعرف: بعض النواقل الأوتوماتيكية توفّر وضعاً يدوياً (+/-)، لكن ذلك غير مطلوب في بداية التعلّم.",
   "methode": [
    "استمع إلى دوران المحرك وراقبه. الإشارة الصوتية أولاً (« المحرك يرتفع صوته ») ؛ أرقام تقريبية: نحو 2000 دورة/دقيقة في الديزل، ونحو 2500 في البنزين.",
    "لرفع سرعة أعلى: ارفع قدمك عن دواسة التسارع، اضغط القابض حتى النهاية، حرّك العصا، ثم اترك القابض بلطف (على مرحلتين)، وعُد إلى دواسة التسارع.",
    "امسك العصا جيداً: براحة يدك موضوعة حول المقبض، لا بأطراف الأصابع ولا بضغط قوي. لا حاجة إلى القوة: المهم هو وضعية اليد.",
    "استعن بزنبرك الإرجاع: العصا تعود دائماً إلى الوضع المحايد (بين الثالثة والرابعة) من تلقاء نفسها. ضع يدك على الجانب الأيمن من الوضع المحايد لسرعات اليمين (5/6 + الرجوع للخلف حسب الطُرز) وأمام/خلف لسرعات 1/2/3/4 لمقاومة هذا الزنبرك.",
    "أبقِ عينيك على الطريق، لا على العصا: أنت تشعر بالسرعات بيدك.",
    "اخفض السرعة قبل المنعطف أو قبل الفرملة، لا أثناءهما — وتخفض السرعة لأنك قد أبطأت فعلاً، لا لكي تبطئ. تختار السرعة المناسبة لتحصل على قوة سحب عند الخروج.",
    "لائم السرعة مع السير: سرعة عالية جداً مع بطء = المحرك « يتلعثم » ؛ سرعة منخفضة جداً مع سير سريع = المحرك « يصرخ ». تتوقّف على الثانية، لا على الأولى (ثم تعود إلى الأولى للانطلاق من جديد)."
   ],
   "quiz": [
    {
     "q": "أنت تغيّر السرعة. إلى أين تنظر؟",
     "options": [
      "إلى العصا",
      "إلى الطريق، دائماً",
      "إلى عدّاد السرعة"
     ],
     "explication": "تشعر بالسرعات بيدك، راحة اليد على المقبض، دون أن تفارق الطريق."
    },
    {
     "q": "كيف تمسك عصا السرعات؟",
     "options": [
      "بأطراف الأصابع",
      "بضغط قوي جداً",
      "راحة اليد موضوعة على المقبض، دون قوة"
     ],
     "explication": "المهم هو وضعية اليد، لا القوة. الخطأ في ناقل الحركة يؤدي إلى الرسوب المباشر."
    },
    {
     "q": "منعطف حاد أمامك. هل تخفض السرعة قبله أم أثناءه؟",
     "options": [
      "أثناء المنعطف",
      "قبله، بعد أن تكون قد أبطأت",
      "بعد المنعطف"
     ],
     "explication": "تخفض السرعة لأنك قد أبطأت فعلاً، لتحصل على قوة سحب عند الخروج."
    },
    {
     "q": "تتوقّف عند إشارة STOP. على أي سرعة؟",
     "options": [
      "على الأولى",
      "على الثانية",
      "على الوضع المحايد"
     ],
     "explication": "تتوقّف على الثانية، ثم تعود إلى الأولى للانطلاق من جديد. أكثر سلاسة."
    }
   ]
  }
 },
 "C1g": {
  "en": {
   "titre": "Checks before driving (walk-around inspection)",
   "competence": "Vehicle handling",
   "pourquoi": "A poorly checked car is a moving danger: a bald tyre brakes badly, a dead light means you are not seen. The walk-around is ten seconds that prevent an accident.",
   "erreur": "Reciting a list by heart without showing anything. On the test and in real life, you are expected to point to the item (\"the oil cap is here\") and make the gesture.",
   "bva": "",
   "methode": [
    "Tyres — not visibly flat, no cuts, tread not too worn (wear indicator).",
    "Lights — switch them on and have someone check headlights (dipped/main beam), indicators, brake lights, reversing lights.",
    "Windows, mirrors, plates, lenses — clean, nothing broken, good visibility.",
    "Fluid levels (if asked) — you can show where the engine oil, windscreen washer and coolant are.",
    "On the test — the examiner asks you for a check (inside or outside) plus a road-safety question plus a first-aid point. You show and explain calmly."
   ],
   "quiz": [
    {
     "q": "On a tyre, what do you check by eye before setting off?",
     "options": [
      "Flat, cut, worn tread",
      "The colour of the rim",
      "The tyre brand"
     ],
     "explication": "A bald or damaged tyre brakes badly and can blow out. Look at the wear indicator."
    },
    {
     "q": "The examiner: show me the dipped-beam control. What do you do?",
     "options": [
      "You recite it by heart",
      "You point to it and operate it",
      "You explain without touching"
     ],
     "explication": "You show, you don't recite: point to the left steering stalk and operate it."
    },
    {
     "q": "Why check your lights before driving?",
     "options": [
      "For decoration",
      "A dead light means you are not seen",
      "It uses less fuel"
     ],
     "explication": "A broken indicator or brake light: others can no longer read your intentions. A direct danger."
    },
    {
     "q": "On the test, what exactly is the walk-around?",
     "options": [
      "Reciting a long list",
      "Just looking at the tyres",
      "A check + safety + first aid"
     ],
     "explication": "You point to the item (the oil cap is here) and make the gesture, calmly."
    }
   ]
  },
  "ar": {
   "titre": "الفحوصات قبل الانطلاق (الدوران حول السيارة)",
   "competence": "التحكم في السيارة",
   "pourquoi": "السيارة غير المفحوصة جيدًا خطرٌ متحرك: الإطار الأملس يفرمل بشكل سيئ، والضوء المعطّل يعني أنك غير مرئي. الدوران حول السيارة عشر ثوانٍ تمنع وقوع حادث.",
   "erreur": "سرد قائمة عن ظهر قلب دون إظهار أي شيء. في الامتحان وفي الواقع، يُنتظر منك أن تشير إلى العنصر (\"سدادة الزيت هنا\") وأن تؤدّي الحركة.",
   "bva": "",
   "methode": [
    "الإطارات — غير مُفرَّغة الهواء بالنظر، دون شقوق، والمطاط ليس مهترئًا كثيرًا (مؤشّر التآكل).",
    "الأضواء — أشعلها واطلب من أحدهم فحص المصابيح (الضوء المنخفض/العالي)، الغمّازات، أضواء الفرملة، أضواء الرجوع للخلف.",
    "الزجاج والمرايا واللوحات والعواكس — نظيفة، لا شيء مكسور، رؤية جيدة.",
    "المستويات (إن طُلب) — تعرف أن تُظهر مكان زيت المحرك وسائل غسل الزجاج وسائل التبريد.",
    "في الامتحان — يطلب منك المفتّش فحصًا (داخليًا أو خارجيًا) + سؤالًا عن السلامة المرورية + مسألة إسعافات أولية. تُظهر وتشرح بهدوء."
   ],
   "quiz": [
    {
     "q": "على الإطار، ماذا تفحص بالعين قبل الانطلاق؟",
     "options": [
      "مُفرَّغ الهواء، شقّ، مطاط مهترئ",
      "لون الجنط",
      "علامة الإطار التجارية"
     ],
     "explication": "الإطار الأملس أو التالف يفرمل بشكل سيئ وقد ينفجر. انظر إلى مؤشّر التآكل."
    },
    {
     "q": "المفتّش: أظهر لي مِفتاح الضوء المنخفض. ماذا تفعل؟",
     "options": [
      "تسرد عن ظهر قلب",
      "تشير إليه وتُشغّله",
      "تشرح دون أن تلمس"
     ],
     "explication": "تُظهر ولا تسرد: أشِر إلى ذراع القيادة الأيسر وشغّله."
    },
    {
     "q": "لماذا تفحص أضواءك قبل الانطلاق؟",
     "options": [
      "للزينة",
      "الضوء المعطّل يعني أنك غير مرئي",
      "يستهلك وقودًا أقل"
     ],
     "explication": "غمّازة أو ضوء فرملة معطّل: لم يعد الآخرون يفهمون نيّاتك. خطر مباشر."
    },
    {
     "q": "في الامتحان، ما هو الدوران حول السيارة تحديدًا؟",
     "options": [
      "سرد قائمة طويلة",
      "مجرد النظر إلى الإطارات",
      "فحص + سلامة + إسعافات أولية"
     ],
     "explication": "تشير إلى العنصر (سدادة الزيت هنا) وتؤدّي الحركة، بهدوء."
    }
   ]
  }
 },
 "C1h": {
  "en": {
   "titre": "Passing the test manoeuvres (parallel parking, U-turn, reverse bay parking)",
   "competence": "Vehicle handling",
   "pourquoi": "The key to a manoeuvre isn't force, it's slowness. The slower you go, the more time you have to turn the wheel and correct. Slow speed + a firm turn of the wheel.",
   "erreur": "Going too fast and turning the wheel too late. The result: you climb onto the kerb or hit a car. You should do the opposite: slow right down, turn the wheel early and firmly. Another trap: staring at your spot by turning around too soon instead of counting your bays and staying straight, which makes you set off crooked.",
   "bva": "To reverse, you put the selector on R. There's no clutch to feather: the car reverses by itself at idle as soon as you release the brake, so you control your slowness with the brake (brake a little to slow down, ease off to move). You keep your right foot on the brake/accelerator and can turn the wheel calmly. It's often easier than with a manual gearbox (no risk of stalling in the middle of a manoeuvre).",
   "methode": [
    "The 6 families (the examiner sets ONE): reversing in a straight line, reversing on a curve, angle (echelon) parking, U-turn (in 3, 5 or 7 moves), reverse bay parking, parallel parking.",
    "The real key to ALL manoeuvres: knowing how to move your car in reverse (to the right, to the left). And you never have priority during a manoeuvre: you make it safe first and let every road user who comes along pass.",
    "Common rules — Make it safe: indicator before you stop, 360° checks (mirrors + looking directly), you let others pass.",
    "Common rules — The slowest pace possible: you are not being timed.",
    "Common rules — Manage your spacing: don't brush against the cars beside you.",
    "Common rules — You may LEAN against the kerb, never MOUNT it (hitting/mounting the kerb = fail).",
    "Common rules — 360° checks during the manoeuvre, regularly.",
    "Common rules — At the end: neutral + handbrake, car properly stopped.",
    "Parallel parking — Pull up level with the car in front of the space (mirror to mirror), right indicator, at a good sideways distance.",
    "Parallel parking — Engage reverse, check, let others pass if needed.",
    "Parallel parking — Give a small quarter-turn of the wheel to the right and go and \"find\" the space by reversing very slowly (if there are 2-3 free spaces behind, use the whole space).",
    "Parallel parking — Reverse while easing gently towards the kerb, without hitting it. Tip: you can fold in the right-hand mirror to see the kerb better — remember to put it back before setting off.",
    "Parallel parking — Engage 1st gear, turn the wheel right and move forward gently to line up parallel, then straighten the wheels quickly as soon as you're straight.",
    "Reverse bay / angle parking — Count the spaces from your target (\"count 3-4 bays\") and stop level with it, also looking ahead of you between each bay.",
    "Reverse bay / angle parking — Reverse, turn the wheel fully towards the space, check 360°.",
    "Reverse bay / angle parking — General reference point: when you turn around, it's the FIRST light / the first edge of the neighbouring car that should appear (near the start, at the latest the middle of your rear window). If you aim for the 2nd light, you're moving too far out.",
    "Reverse bay / angle parking — Reverse slowly, wait until you're straight BEFORE straightening the wheels (a half-turn plus one full turn).",
    "Reverse bay / angle parking — Don't rely on the neighbouring spaces to line up: imagine your bay's line extending outwards and follow along it."
   ],
   "quiz": [
    {
     "q": "The golden rule for any slow manoeuvre like parallel parking?",
     "options": [
      "Go very slowly",
      "Go fast to finish",
      "Turn the wheel as late as possible"
     ],
     "explication": "You are not being timed: going slow gives you time to turn the wheel and correct."
    },
    {
     "q": "You may lean against the kerb during a manoeuvre. And mount it?",
     "options": [
      "Yes, if it's gentle",
      "No, hitting or mounting it = fail",
      "Only with the rear wheel"
     ],
     "explication": "Leaning gently, yes. Mounting or hitting the kerb means an instant fail."
    },
    {
     "q": "Reverse bay parking: which reference point do you aim for as you turn around?",
     "options": [
      "The 2nd light of the neighbouring car",
      "The first light, near the start of the rear window",
      "The front bumper"
     ],
     "explication": "If you aim for the 2nd light, you move too far out. First light = correct path."
    },
    {
     "q": "During a manoeuvre, do you have priority over other road users?",
     "options": [
      "Yes, you're manoeuvring",
      "No, never: you let them pass",
      "Only at night"
     ],
     "explication": "You make it safe first, do 360° checks, and let everyone pass."
    }
   ]
  },
  "ar": {
   "titre": "النجاح في مناورات الامتحان (الركن الموازي، الدوران بزاوية 180 درجة، الركن للخلف في الخانة)",
   "competence": "التحكم في السيارة",
   "pourquoi": "مفتاح المناورة ليس القوة، بل البطء. كلما سرتَ ببطء أكثر، كان لديك وقت أطول لإدارة المقود والتصحيح. سرعة بطيئة + إدارة حازمة للمقود.",
   "erreur": "السير بسرعة كبيرة وإدارة المقود متأخرًا جدًا. النتيجة: تصعد على الرصيف أو تصطدم بسيارة. عليك أن تفعل العكس: أبطئ تمامًا، وأدِر المقود مبكرًا وبحزم. فخّ آخر: تثبيت النظر على مكانك بالالتفات للخلف مبكرًا جدًا بدلًا من عدّ الخانات والبقاء مستقيمًا، فتنطلق بشكل مائل.",
   "bva": "للرجوع إلى الخلف، تضع ناقل السرعة على وضع R. لا يوجد دبرياج (قابض) لتتحكم فيه: السيارة ترجع للخلف وحدها عند السرعة الخاملة بمجرد أن ترفع قدمك عن الفرامل، لذا تتحكم في بطئك بالفرامل (تضغط قليلًا لتبطئ، وترفع قدمك لتتقدم). تبقي قدمك اليمنى على الفرامل/دواسة الوقود ويمكنك إدارة المقود بهدوء. غالبًا ما يكون هذا أسهل من ناقل الحركة اليدوي (لا خطر من توقف المحرك في منتصف المناورة).",
   "methode": [
    "العائلات الست (يفرض عليك الممتحن واحدة منها): الرجوع للخلف في خط مستقيم، الرجوع للخلف في منحنى، الركن المائل (بزاوية)، الدوران بزاوية 180 درجة (في 3 أو 5 أو 7 حركات)، الركن للخلف في الخانة، الركن الموازي.",
    "المفتاح الحقيقي لكل المناورات: أن تعرف كيف تحرّك سيارتك للخلف (إلى اليمين، إلى اليسار). ولست أبدًا صاحب الأولوية أثناء المناورة: تؤمّن أولًا وتترك كل مستخدم للطريق يقترب يمرّ.",
    "قواعد مشتركة — أمّن: إشارة الانعطاف قبل أن تتوقف، مراقبة بزاوية 360 درجة (المرايا + النظر المباشر)، وتترك الآخرين يمرّون.",
    "قواعد مشتركة — أبطأ وتيرة ممكنة: لست مؤقّتًا بزمن.",
    "قواعد مشتركة — تحكّم في المسافات: لا تلامس السيارات المجاورة.",
    "قواعد مشتركة — يمكنك أن تستند على الرصيف، لكن لا تصعد عليه أبدًا (لمس الرصيف أو الصعود عليه = رسوب).",
    "قواعد مشتركة — مراقبة بزاوية 360 درجة أثناء المناورة، بانتظام.",
    "قواعد مشتركة — في النهاية: الوضع المحايد + فرامل اليد، والسيارة متوقفة تمامًا.",
    "الركن الموازي — قف بمحاذاة السيارة التي أمام المكان (مرآة أمام مرآة)، إشارة انعطاف إلى اليمين، على مسافة جانبية مناسبة.",
    "الركن الموازي — أدخِل غيار الرجوع للخلف، راقب، واترك الآخرين يمرّون إذا لزم الأمر.",
    "الركن الموازي — أدِر المقود ربع دورة صغيرة إلى اليمين واذهب لـ«البحث» عن المكان بالرجوع ببطء شديد (إذا كان هناك مكانان أو ثلاثة أماكن فارغة خلفك، استفد من كامل المساحة).",
    "الركن الموازي — ارجع للخلف مستندًا برفق نحو الرصيف، دون أن تلمسه. نصيحة: يمكنك طيّ المرآة اليمنى لترى الرصيف بشكل أفضل — تذكّر أن تعيدها قبل أن تنطلق.",
    "الركن الموازي — أدخِل الغيار الأول، أدِر المقود إلى اليمين وتقدّم برفق لتصطفّ موازيًا، ثم قوّم العجلات بسرعة بمجرد أن تصبح مستقيمًا.",
    "الركن للخلف في الخانة / بزاوية — عُدّ الأماكن ابتداءً من هدفك («عُدّ 3-4 خانات») وتوقّف بمحاذاته، مع النظر أيضًا أمامك بين كل خانة وأخرى.",
    "الركن للخلف في الخانة / بزاوية — ارجع للخلف، أدِر المقود بالكامل نحو جهة المكان، وراقب بزاوية 360 درجة.",
    "الركن للخلف في الخانة / بزاوية — علامة مرجعية عامة: عندما تلتفت للخلف، فإن أول ضوء / أول حافة للسيارة المجاورة هي التي يجب أن تظهر (قرب البداية، وفي أقصى الحالات منتصف الزجاج الخلفي). إذا استهدفت الضوء الثاني، فأنت تبتعد كثيرًا.",
    "الركن للخلف في الخانة / بزاوية — ارجع للخلف ببطء، وانتظر حتى تصبح مستقيمًا قبل أن تقوّم العجلات (نصف دورة + دورة كاملة).",
    "الركن للخلف في الخانة / بزاوية — لا تعتمد على الأماكن المجاورة لتصطفّ: تخيّل أن خط خانتك يمتد نحو الخارج وسِر بمحاذاته."
   ],
   "quiz": [
    {
     "q": "القاعدة الذهبية لأي مناورة بطيئة مثل الركن الموازي؟",
     "options": [
      "السير ببطء شديد",
      "السير بسرعة لإنهائها",
      "إدارة المقود في أقصى وقت متأخر ممكن"
     ],
     "explication": "لست مؤقّتًا بزمن: البطء يمنحك الوقت لإدارة المقود والتصحيح."
    },
    {
     "q": "يمكنك الاستناد على الرصيف أثناء المناورة. وماذا عن الصعود عليه؟",
     "options": [
      "نعم، إذا كان برفق",
      "لا، لمسه أو الصعود عليه = رسوب",
      "فقط بالعجلة الخلفية"
     ],
     "explication": "الاستناد برفق، نعم. أما الصعود على الرصيف أو لمسه فيعني الرسوب فورًا."
    },
    {
     "q": "الركن للخلف في الخانة: أي علامة مرجعية تستهدف وأنت تلتفت للخلف؟",
     "options": [
      "الضوء الثاني للسيارة المجاورة",
      "أول ضوء، قرب بداية الزجاج الخلفي",
      "المصدّ الأمامي"
     ],
     "explication": "إذا استهدفت الضوء الثاني، تبتعد كثيرًا. أول ضوء = المسار الصحيح."
    },
    {
     "q": "أثناء المناورة، هل تكون صاحب الأولوية على مستخدمي الطريق الآخرين؟",
     "options": [
      "نعم، أنت تناور",
      "لا، أبدًا: تتركهم يمرّون",
      "فقط في الليل"
     ],
     "explication": "تؤمّن أولًا، وتراقب بزاوية 360 درجة، وتترك الجميع يمرّون."
    }
   ]
  }
 },
 "C1i": {
  "en": {
   "titre": "String together maneuvers on your own",
   "competence": "Vehicle handling",
   "pourquoi": "On the test, the examiner won't guide you. This skill proves that you decide and correct yourself on your own — that's what being ready for World 2 means.",
   "erreur": "Waiting for the instructor's \"go\" for every move. As long as you depend on guidance, the maneuver isn't mastered. The other trap: panicking as soon as the maneuver isn't perfect on the first try instead of calmly repositioning.",
   "bva": "Same maneuvers, same expected autonomy. You handle direction with the selector (D to go forward, R to reverse) and control your slowness with the brake rather than the clutch. Not being able to stall helps you stay calm when you correct yourself.",
   "methode": [
    "Analyze the situation: which maneuver does the spot call for (parallel parking, bay parking, angle parking, U-turn)?",
    "Choose the right maneuver and the right side yourself (reminder: parallel/bay parking on the left only on a one-way street, otherwise you end up facing oncoming traffic).",
    "Signal and make it safe: turn signal before stopping, mirror checks + blind spot + direct vision; you don't have priority, you let others pass.",
    "Do it slowly, managing YOUR reference points (the ones your instructor taught you) — and keeping the same procedure every time so you can correct yourself.",
    "If it goes wrong, correct without panicking: straighten up (wheel straight, wheels straight), spot which side has room, and bring the car toward that side. A clean correction beats forcing it."
   ],
   "quiz": [
    {
     "q": "You mess up the start of a parallel park. Good reflex?",
     "options": [
      "Force your way in anyway",
      "Straighten up, find the space, correct",
      "Start all over in a panic"
     ],
     "explication": "Wheel straight, wheels straight, you bring the car toward the side where you have room."
    },
    {
     "q": "How do you know a maneuver is truly mastered?",
     "options": [
      "When the instructor guides you well",
      "When you do it fast",
      "When you do it alone, without guidance"
     ],
     "explication": "If you wait for the instructor's cue for every move, it isn't mastered yet."
    },
    {
     "q": "Before starting an independent maneuver, first safety move?",
     "options": [
      "Speed up",
      "Turn signal + checks (mirrors, blind spot)",
      "Honk the horn"
     ],
     "explication": "You make it safe before moving, and you never have priority during a maneuver."
    },
    {
     "q": "Parallel parking on the left: when is it allowed?",
     "options": [
      "Always, whatever the street",
      "Only on a one-way street",
      "Never"
     ],
     "explication": "On the left on a two-way street, you end up facing oncoming traffic. Choose the right side."
    }
   ]
  },
  "ar": {
   "titre": "ربط المناورات بشكل مستقل",
   "competence": "التحكم في السيارة",
   "pourquoi": "في الامتحان، لن يوجّهك المُفتّش. هذه المهارة تُثبت أنك تقرّر بنفسك وتصحّح أخطاءك بنفسك — هذا هو معنى أن تكون جاهزًا للعالم الثاني.",
   "erreur": "انتظار إشارة \"ابدأ\" من المدرّب عند كل حركة. ما دمت تعتمد على التوجيه، فالمناورة لم تُتقَن بعد. الفخّ الآخر: الذعر بمجرد أن تكون المناورة غير مثالية من المحاولة الأولى بدلاً من إعادة التموضع بهدوء.",
   "bva": "نفس المناورات، ونفس الاستقلالية المطلوبة. تتحكم في الاتجاه بواسطة ناقل الحركة (D للتقدم، R للرجوع) وتتحكم في بطء السيارة بالفرامل بدلاً من القابض. عدم إمكانية إطفاء المحرك يساعدك على البقاء هادئًا عندما تصحّح.",
   "methode": [
    "حلّل الوضع: أي مناورة يتطلبها المكان (ركن موازٍ، ركن عمودي، ركن مائل، دوران بزاوية 180 درجة)؟",
    "اختر بنفسك المناورة المناسبة والجهة المناسبة (تذكير: الركن الموازي/العمودي على اليسار فقط في الطريق ذي الاتجاه الواحد، وإلا تصبح في الاتجاه المعاكس).",
    "أعلن وأمّن: إشارة الانعطاف قبل التوقف، فحص المرايا + الزاوية الميتة + الرؤية المباشرة؛ لست صاحب الأولوية، فأنت تفسح المجال للآخرين.",
    "نفّذ ببطء، مع إدارة معالمك المرجعية (تلك التي علّمك إياها مدرّبك) — والحفاظ على نفس الإجراء في كل مرة كي تتمكن من التصحيح.",
    "إذا فشلت، صحّح دون ذعر: عدّل وضعك (المقود مستقيم، العجلات مستقيمة)، حدّد الجهة التي لديك فيها مساحة، وأعد السيارة نحو تلك الجهة. التصحيح النظيف أفضل من التصرف بالقوة."
   ],
   "quiz": [
    {
     "q": "أخطأت في بداية ركن موازٍ. ما ردّ الفعل الصحيح؟",
     "options": [
      "الضغط للدخول رغم ذلك",
      "تعديل الوضع، تحديد المساحة، التصحيح",
      "إعادة كل شيء من البداية في ذعر"
     ],
     "explication": "المقود مستقيم، العجلات مستقيمة، تعيد السيارة نحو الجهة التي لديك فيها مساحة."
    },
    {
     "q": "كيف تعرف أن مناورة قد أُتقنت فعلاً؟",
     "options": [
      "عندما يوجّهك المدرّب جيدًا",
      "عندما تنفّذها بسرعة",
      "عندما تنفّذها بمفردك، دون توجيه"
     ],
     "explication": "إذا كنت تنتظر إشارة المدرّب عند كل حركة، فهي لم تُتقَن بعد."
    },
    {
     "q": "قبل أن تبدأ مناورة مستقلة، ما أول إجراء أمان؟",
     "options": [
      "التسريع",
      "إشارة الانعطاف + الفحوصات (المرايا، الزاوية الميتة)",
      "استخدام بوق السيارة"
     ],
     "explication": "نؤمّن قبل التحرك، ولسنا أبدًا أصحاب الأولوية أثناء المناورة."
    },
    {
     "q": "الركن الموازي على اليسار: متى يُسمح به؟",
     "options": [
      "دائمًا، مهما كان الشارع",
      "فقط في الطريق ذي الاتجاه الواحد",
      "أبدًا"
     ],
     "explication": "على اليسار في طريق ذي اتجاهين، تصبح في الاتجاه المعاكس. اختر الجهة الصحيحة."
    }
   ]
  }
 },
 "C2a": {
  "en": {
   "titre": "Read the road with your eyes",
   "competence": "Traffic",
   "pourquoi": "You drive with your eyes before you drive with your hands. One instructor sums it up well: your gaze is about 80% of driving. If your eyes are in the wrong place, your path will be wrong no matter what you do with your hands. And the more you place your eyes on different spots, the more your brain rebuilds a complete and accurate picture of the scene (distances, shapes, hazards).",
   "erreur": "Staring at the hood, at the car right in front of you, or at a single spot for too long. The result: you discover everything at the last moment and brake in a panic. The instructors' trick is commented driving: you say out loud what you see (\"pedestrian crossing, curb, 50 sign\"). It forces your eyes to go looking for the clues and to anticipate.",
   "bva": "",
   "methode": [
    "Set your gaze at mid-height on the windshield: it forces you to aim far ahead and to see things coming instead of being caught off guard.",
    "Keep your eyes moving: your gaze should land somewhere new about every second. A point you stare at too long means a lot of information your brain misses.",
    "Move your head, not just your eyes: to really \"photograph\" your surroundings, actually turn your head (sidewalks, driveway entrances, intersections, parked vehicles).",
    "Check your mirrors regularly: a glance at the interior mirror about every 5 to 7 seconds.",
    "Bring your gaze back far ahead. Keep asking yourself two questions on a loop: \"where am I now?\" and \"where do I want to go?\"."
   ],
   "quiz": [
    {
     "q": "You're driving in town on a straight stretch. Where do you place your gaze?",
     "options": [
      "Far ahead, at mid-height on the windshield",
      "On the hood of your car",
      "On the car right in front of you"
     ],
     "explication": "Looking far ahead gives you time to anticipate instead of being caught off guard."
    },
    {
     "q": "How often do you check the interior mirror?",
     "options": [
      "Once when you set off, that's enough",
      "Only before braking",
      "About every 5 to 7 seconds"
     ],
     "explication": "Knowing who's behind you gets you ready to brake or change lanes without surprises."
    },
    {
     "q": "A ball rolls across the road 50 m ahead of you. Your reaction?",
     "options": [
      "Honk to warn others",
      "Ease off the gas and scan the sidewalks with your eyes",
      "Keep going, it's already gone by"
     ],
     "explication": "Behind a ball there's often a child running after it."
    },
    {
     "q": "To properly photograph the scene, what do you move?",
     "options": [
      "Only your eyes",
      "Your head, not just your eyes",
      "Nothing, you stare straight ahead"
     ],
     "explication": "Turning your head lets you see driveway entrances and side streets opening onto the road."
    }
   ]
  },
  "ar": {
   "titre": "اقرأ الطريق بعينيك",
   "competence": "السير",
   "pourquoi": "أنت تقود بعينيك قبل أن تقود بيديك. يلخّص أحد المدرّبين الأمر جيداً: النظر يمثّل نحو 80٪ من القيادة. إذا كان نظرك في المكان الخطأ، فسيكون مسارك سيّئاً مهما فعلت بيديك. وكلما وجّهت نظرك إلى أماكن مختلفة، أعاد دماغك بناء صورة كاملة ودقيقة للمشهد (المسافات والأشكال والمخاطر).",
   "erreur": "التحديق في غطاء المحرّك، أو في السيارة التي أمامك مباشرة، أو في نقطة واحدة لوقت طويل. النتيجة: تكتشف كل شيء في اللحظة الأخيرة وتكبح بشكل مفاجئ. حيلة المدرّبين هي القيادة المعلَّقة: تقول بصوت عالٍ ما تراه (\"ممرّ مشاة، حافة رصيف، لوحة 50\"). هذا يُجبر العين على البحث عن المؤشرات وعلى التوقّع المسبق.",
   "bva": "",
   "methode": [
    "ضع نظرك في منتصف ارتفاع الزجاج الأمامي: هذا يُجبرك على النظر بعيداً ورؤية الأمور قادمة بدلاً من مواجهتها فجأة.",
    "أبقِ عينك متحركة: يجب أن يستقرّ نظرك على مكان جديد كل ثانية تقريباً. النقطة التي تحدّق فيها طويلاً تعني كمّاً كبيراً من المعلومات يفوته دماغك.",
    "حرّك رأسك، لا عينيك فقط: لكي \"تصوّر\" محيطك جيداً، أدِر رأسك فعلاً (الأرصفة، مداخل المرائب، التقاطعات، المركبات المتوقفة).",
    "عُد بانتظام إلى مرايتك: نظرة إلى المرآة الداخلية كل 5 إلى 7 ثوانٍ تقريباً.",
    "أعد نظرك بعيداً. اطرح على نفسك سؤالين بشكل متكرّر: \"أين أنا الآن؟\" و\"إلى أين أريد أن أذهب؟\"."
   ],
   "quiz": [
    {
     "q": "أنت تقود في المدينة على مسار مستقيم. أين تضع نظرك؟",
     "options": [
      "بعيداً إلى الأمام، في منتصف ارتفاع الزجاج الأمامي",
      "على غطاء محرّك سيارتك",
      "على السيارة التي أمامك مباشرة"
     ],
     "explication": "النظر بعيداً يمنحك الوقت للتوقّع بدلاً من مواجهة الأمور فجأة."
    },
    {
     "q": "كم مرة تعود إلى المرآة الداخلية؟",
     "options": [
      "مرة واحدة عند الانطلاق، هذا يكفي",
      "فقط قبل الكبح",
      "كل 5 إلى 7 ثوانٍ تقريباً"
     ],
     "explication": "معرفة من يسير خلفك يجهّزك للكبح أو تغيير المسار دون مفاجآت."
    },
    {
     "q": "كرة تعبر الطريق على بعد 50 م أمامك. ما ردّة فعلك؟",
     "options": [
      "إطلاق البوق للتنبيه",
      "رفع القدم عن الوقود ومسح الأرصفة بعينيك",
      "المتابعة، فقد عبرت بالفعل"
     ],
     "explication": "خلف الكرة غالباً ما يوجد طفل يركض وراءها."
    },
    {
     "q": "لكي تصوّر المشهد جيداً، ماذا تحرّك؟",
     "options": [
      "العينين فقط",
      "الرأس، لا العينين فقط",
      "لا شيء، تحدّق مباشرة إلى الأمام"
     ],
     "explication": "إدارة رأسك تجعلك ترى مداخل المرائب والشوارع الجانبية التي تصبّ في الطريق."
    }
   ]
  }
 },
 "C2b": {
  "en": {
   "titre": "Adjust your speed to the environment",
   "competence": "Traffic",
   "pourquoi": "The right speed is not \"the legal limit\", it's the speed that lets you stop in time if something appears. Instructors stress both directions: driving too slowly is not safer, it disrupts the flow and stops you from learning to handle information at real speed. On a downhill, you ease off the accelerator so you don't speed up on your own; on an uphill, you anticipate a little throttle so you don't lose momentum. Speed is controlled as much with the accelerator as with the terrain.",
   "erreur": "Keeping the same speed everywhere \"because we're within the limit\". A school zone at 50 is still dangerous at 50 if children are crossing. Conversely, crawling well below the limit on a clear road is no guarantee of safety: you adapt, you don't freeze.",
   "bva": "",
   "methode": [
    "Look for signs as far ahead as possible: speed limit, school, market, bend, roadworks zone, vehicles pulling out. Even when it's quiet, you keep reading the signs — it's your warm-up before the busy areas.",
    "Ease off the accelerator BEFORE the zone, not once you're in it. Often it's enough to release the accelerator and let the car slow down on its own, without harsh braking.",
    "Measure your distance from the car ahead: the 2-second rule (as the back of their car passes a fixed marker, you should reach that same marker at least 2 seconds later).",
    "Double this distance in rain or at night (at least 4 seconds).",
    "Keep adapting constantly, both ways: when it's clear and allowed, you drive at a smooth pace, slightly below the maximum rather than right at the limit; when a hazard appears, you slow down without waiting."
   ],
   "quiz": [
    {
     "q": "You're approaching a school, children on the pavement, and you're under the limit. What do you do?",
     "options": [
      "You ease off the accelerator anyway",
      "You keep your speed, you're within the limit",
      "You speed up to get past quickly"
     ],
     "explication": "The limit is a maximum, not an obligation: the right speed depends on the real risk."
    },
    {
     "q": "How do you check your distance from the car ahead?",
     "options": [
      "By eye, one car length",
      "As long as you can see its lights, you're fine",
      "The 2-second rule against a fixed marker"
     ],
     "explication": "Two seconds is your margin to brake if it stops dead."
    },
    {
     "q": "It's raining. What distance do you leave from the car ahead?",
     "options": [
      "The same as in the dry",
      "You double it: at least 4 seconds",
      "You reduce it to see it better"
     ],
     "explication": "On a wet surface, your braking distance rockets: double the margin."
    },
    {
     "q": "You're going down a fairly steep slope. How do you manage your speed?",
     "options": [
      "You release the accelerator and let the slope slow you down",
      "You keep accelerating to stay smooth",
      "You brake hard continuously"
     ],
     "explication": "Accelerating downhill means gaining speed for nothing and braking harder afterwards."
    }
   ]
  },
  "ar": {
   "titre": "اضبط سرعتك حسب البيئة المحيطة",
   "competence": "السير",
   "pourquoi": "السرعة الصحيحة ليست «الحد المسموح به قانونياً»، بل هي السرعة التي تتيح لك التوقّف في الوقت المناسب إذا ظهر شيء ما فجأة. يشدّد المدرّبون على الاتجاهين: القيادة ببطء شديد ليست أكثر أماناً، فهي تعرقل انسياب السير وتمنعك من تعلّم إدارة المعلومات بالسرعة الحقيقية. عند النزول في منحدر، ترفع قدمك عن دوّاسة الوقود كي لا تتسارع من تلقاء نفسك؛ وعند الصعود، تتوقّع قليلاً من الوقود كي لا تفقد اندفاعك. تُدار السرعة بدوّاسة الوقود بقدر ما تُدار بتضاريس الطريق.",
   "erreur": "الحفاظ على السرعة نفسها في كل مكان «لأننا ضمن الحد المسموح». المنطقة المدرسية عند 50 تبقى خطيرة عند 50 إذا كان الأطفال يعبرون. وفي المقابل، الزحف بسرعة أقل بكثير من الحد على طريق خالٍ ليس ضماناً للسلامة: نتكيّف ولا نتجمّد.",
   "bva": "",
   "methode": [
    "ابحث عن الإشارات في أبعد نقطة ممكنة: تحديد السرعة، مدرسة، سوق، منعطف، منطقة أشغال، مخارج المركبات. حتى عندما يكون الطريق هادئاً، استمر في قراءة اللافتات — فهذا إحماؤك قبل المناطق المزدحمة.",
    "ارفع قدمك عن دوّاسة الوقود قبل المنطقة، لا بعد دخولك فيها. غالباً يكفي أن ترفع قدمك عن دوّاسة الوقود وتترك السيارة تُبطئ من تلقاء نفسها، دون فرملة مفاجئة.",
    "قِس مسافتك عن السيارة التي أمامك: قاعدة الثانيتين (عند مرور مؤخرة سيارته بعلامة ثابتة، يجب أن تمرّ أنت بالعلامة نفسها بعد ثانيتين على الأقل).",
    "ضاعِف هذه المسافة عند المطر أو في الليل (4 ثوانٍ على الأقل).",
    "تكيّف باستمرار في الاتجاهين: عندما يكون الطريق خالياً ومسموحاً، سِر بوتيرة مرنة، أقل قليلاً من الحد الأقصى بدلاً من ملامسته تماماً؛ وعندما يظهر خطر، أبطئ دون انتظار."
   ],
   "quiz": [
    {
     "q": "تقترب من مدرسة، وأطفال على الرصيف، وأنت أقل من الحد المسموح. ماذا تفعل؟",
     "options": [
      "ترفع قدمك عن دوّاسة الوقود رغم ذلك",
      "تحافظ على سرعتك، فأنت ضمن الحد المسموح",
      "تُسرِع لتمرّ بسرعة"
     ],
     "explication": "الحد المسموح هو حد أقصى وليس إلزاماً: السرعة الصحيحة تتوقف على الخطر الحقيقي."
    },
    {
     "q": "كيف تتحقق من مسافتك عن السيارة التي أمامك؟",
     "options": [
      "بالعين، طول سيارة واحدة",
      "ما دمت ترى أضواءها، فالأمر جيد",
      "قاعدة الثانيتين عند علامة ثابتة"
     ],
     "explication": "الثانيتان هما هامشك للفرملة إذا توقّفت فجأة."
    },
    {
     "q": "إنها تمطر. ما المسافة التي تتركها عن السيارة التي أمامك؟",
     "options": [
      "نفسها كما في الطقس الجاف",
      "تضاعفها: 4 ثوانٍ على الأقل",
      "تقلّلها لتراها بشكل أفضل"
     ],
     "explication": "على أرض مبللة، تتضخم مسافة الفرملة كثيراً: ضاعِف الهامش."
    },
    {
     "q": "تنزل منحدراً شديداً نوعاً ما. كيف تدير سرعتك؟",
     "options": [
      "ترفع قدمك عن دوّاسة الوقود وتدع المنحدر يُبطئك",
      "تستمر في التسارع لتبقى مرناً",
      "تفرمل بقوة باستمرار"
     ],
     "explication": "التسارع في النزول يعني اكتساب سرعة بلا فائدة والفرملة بقوة أكبر لاحقاً."
    }
   ]
  }
 },
 "C2c": {
  "en": {
   "titre": "Position yourself correctly on the road",
   "competence": "Traffic",
   "pourquoi": "A well-positioned car is easy to read: others understand where you're going. And above all, a beginner almost always feels that their car is too wide, that \"it won't fit\": this is an optical illusion. A car is about 1.80 m wide (≈ 2 m including mirrors); a lane is at least 3 m wide. Even when passing a bus on a narrow road, the space is there. Trust your reference points, not your feeling.",
   "erreur": "Hugging the right \"to be safe\" and grazing parked cars, the curb, or cyclists. Too far right is just as dangerous as too far in the middle. Another trap: staring at the mirror in a bend to steer by it — it lies (the rear of your car is farther from the curb than the front), you correct wrongly and hit the sidewalk.",
   "bva": "",
   "methode": [
    "Drive in the middle of your lane, neither hugging the right nor creeping over the center.",
    "Use concrete reference points: with your mirrors, check the gap on the left (center line) and on the right (edge); and take a quick glance down to place the right-hand edge — a common reference point: it \"lands\" roughly in the middle of your windshield.",
    "Keep a side clearance of at least one car door from parked cars (risk of a door opening or a pedestrian stepping out).",
    "On a narrow road or with cyclists, move slightly to the left, after checking it's clear, to leave a safety gap when you meet or overtake.",
    "Stay centered and steady in a queue or a marked lane: no weaving."
   ],
   "quiz": [
    {
     "q": "You're driving alongside cars parked on the right. What distance?",
     "options": [
      "At least one door's width",
      "As close as possible to stay to the right",
      "You hug them, it forces you to slow down"
     ],
     "explication": "A door can open or a pedestrian can step out between two cars."
    },
    {
     "q": "The street seems too narrow for your car. What do you do?",
     "options": [
      "You squeeze all the way to the right",
      "You stop, it won't fit",
      "You trust your reference points: the lane is wider than it looks"
     ],
     "explication": "A lane is at least 3 m wide, your car 1.80 m: it's an optical illusion."
    },
    {
     "q": "Where do you position yourself in your lane in normal driving?",
     "options": [
      "Hugging the right-hand edge",
      "In the middle of your lane",
      "Straddling the center line"
     ],
     "explication": "Well centered, your car is easy to read and you keep margin on both sides."
    },
    {
     "q": "You meet a cyclist on a narrow road. How do you position yourself?",
     "options": [
      "You squeeze right to avoid them",
      "You pass as close as possible, they have their lane",
      "You move a bit to the left, after checking it's clear"
     ],
     "explication": "You move toward the left when it's safe, you never graze the bike."
    }
   ]
  },
  "ar": {
   "titre": "ضع سيارتك في المكان الصحيح على الطريق",
   "competence": "السير",
   "pourquoi": "السيارة الموضوعة جيدًا يسهل فهم مسارها: يفهم الآخرون إلى أين تتجه. والأهم أن المبتدئ يشعر دائمًا تقريبًا بأن سيارته عريضة جدًا وأنها «لن تمر»: هذا وهم بصري. عرض السيارة نحو 1.80 م (≈ 2 م مع المرايا)؛ وعرض المسار لا يقل عن 3 م. حتى عند تقاطعك مع حافلة على طريق ضيق، المساحة موجودة. اعتمد على علاماتك المرجعية لا على إحساسك.",
   "erreur": "الالتصاق باليمين «حرصًا على الحذر» وملامسة السيارات المتوقفة أو الحافة أو الدراجين. الابتعاد كثيرًا إلى اليمين خطير مثل الابتعاد كثيرًا نحو الوسط. فخ آخر: تثبيت النظر على المرآة في المنعطف للاسترشاد بها — فهي تخدعك (مؤخرة سيارتك أبعد عن الحافة من مقدمتها)، فتصحح خطأً وتصطدم بالرصيف.",
   "bva": "",
   "methode": [
    "سِر في منتصف مسارك، لا ملتصقًا باليمين ولا متجاوزًا نحو الوسط.",
    "استعمل علامات مرجعية ملموسة: بمراياك، تحقق من المسافة على اليسار (الخط الأوسط) وعلى اليمين (الحافة)؛ وألقِ نظرة سريعة إلى الأسفل لتحديد الحافة اليمنى — علامة مرجعية شائعة: تظهر تقريبًا في منتصف زجاجك الأمامي.",
    "احتفظ بمسافة جانبية لا تقل عن عرض باب عن السيارات المتوقفة (خطر فتح باب أو ظهور مفاجئ لأحد المشاة).",
    "على طريق ضيق أو مع وجود دراجين، انزح قليلًا إلى اليسار بعد التأكد من خلوه، لترك مسافة أمان عند التقاطع أو التجاوز.",
    "ابقَ في المنتصف وثابتًا داخل الصف أو المسار المخطط: بلا تعرّج."
   ],
   "quiz": [
    {
     "q": "أنت تسير بمحاذاة سيارات متوقفة على اليمين. ما المسافة؟",
     "options": [
      "عرض باب على الأقل",
      "الأقرب ما يمكن للبقاء على اليمين",
      "تلتصق بها، فهذا يجبرك على الإبطاء"
     ],
     "explication": "قد يُفتح باب أو يظهر أحد المشاة فجأة بين سيارتين."
    },
    {
     "q": "يبدو لك الشارع ضيقًا جدًا على سيارتك. ماذا تفعل؟",
     "options": [
      "تضغط إلى أقصى اليمين",
      "تتوقف، فهي لن تمر",
      "تعتمد على علاماتك المرجعية: المسار أعرض مما يبدو"
     ],
     "explication": "عرض المسار لا يقل عن 3 م وسيارتك 1.80 م: إنه وهم بصري."
    },
    {
     "q": "أين تضع نفسك داخل مسارك في القيادة العادية؟",
     "options": [
      "ملتصقًا بالحافة اليمنى",
      "في منتصف مسارك",
      "فوق الخط الأوسط"
     ],
     "explication": "عندما تكون في المنتصف تمامًا، يسهل فهم مسار سيارتك وتحتفظ بهامش من الجانبين."
    },
    {
     "q": "تلتقي بدرّاج على طريق ضيق. كيف تضع نفسك؟",
     "options": [
      "تضغط إلى اليمين لتفاديه",
      "تمر في أقرب مسافة، فله ممرّه",
      "تنزح قليلًا إلى اليسار بعد التأكد من خلو الطريق"
     ],
     "explication": "تنزح نحو اليسار عندما يكون ذلك آمنًا، ولا تلامس الدراجة أبدًا."
    }
   ]
  }
 },
 "C2d": {
  "en": {
   "titre": "Taking a bend",
   "competence": "Traffic",
   "pourquoi": "You brake in a straight line, where the car is stable. Braking in the middle of a bend unbalances it and makes it lose grip. Speed is set BEFORE, the steering is handled DURING. And the line follows your eyes: an instructor puts it bluntly — \"my head goes to the left and my hand follows at the same time.\" If you look at the edge, you go toward the edge.",
   "erreur": "Entering too fast and braking in the middle of the bend. It's a sign you anticipated poorly: next time, slow down earlier. Another common mistake: taking the bend with the engine under-revving (gear too high). The car struggles, judders, and you risk stalling right in the curve. Downshift BEFORE so you have power.",
   "bva": "",
   "methode": [
    "Prepare your eyes early: as soon as you see the bend, your eyes go toward the exit (where the road opens back up). Lean forward a little, turn your head if the windscreen pillars get in the way.",
    "Brake and slow down BEFORE entering, on the section that's still straight. If needed, downshift to be in the right gear.",
    "Stay firmly in your lane: don't cross the centre line and don't cut the bend.",
    "Pull the steering wheel with one hand: right hand for a right bend, left hand for a left bend — without forcing with both hands (you'd compromise your line), your eyes always fixed far ahead.",
    "Accelerate gently once the exit is in sight.",
    "Safe line — you stay in your lane (without cutting or crossing the line). The \"outside → inside → outside\" line is a racing line, irrelevant for the driving test."
   ],
   "quiz": [
    {
     "q": "You're approaching a tight bend. When do you brake?",
     "options": [
      "Before, on the section that's still straight",
      "Right in the middle of the bend",
      "At the exit of the bend"
     ],
     "explication": "The car brakes well in a straight line; braking in the curve unbalances it."
    },
    {
     "q": "In the bend, where do you look?",
     "options": [
      "At the edge of the road, so you don't cross the line",
      "Far ahead, toward the exit of the bend",
      "At the bonnet, to follow the line"
     ],
     "explication": "Your eyes pull the line: if you look at the edge, you go toward the edge."
    },
    {
     "q": "How do you hold the steering wheel in a left bend?",
     "options": [
      "You force hard with both hands",
      "You let go and let it come back on its own",
      "You pull with one hand, the left one"
     ],
     "explication": "Pulling with one hand keeps the movement smooth; forcing with both hands tenses you up and pushes you off line."
    },
    {
     "q": "When do you accelerate again in a bend?",
     "options": [
      "Right at the entry, to stay dynamic",
      "At the tightest point",
      "At the exit, when the road opens back up, gently"
     ],
     "explication": "Accelerating too early opens up your line and pushes you toward the outside."
    }
   ]
  },
  "ar": {
   "titre": "اجتياز المنعطف",
   "competence": "السير",
   "pourquoi": "تفرمل في خط مستقيم، حيث تكون السيارة مستقرة. الفرملة في وسط المنعطف تُفقدها توازنها وتُفقدها التماسك مع الطريق. السرعة تُضبط قبل المنعطف، والمقود يُدار أثناءه. والمسار يتبع النظر: يقولها أحد المدربين بصراحة — «رأسي تتجه يساراً ويدي تتبعها في الوقت نفسه». إذا نظرت إلى الحافة، اتجهت نحو الحافة.",
   "erreur": "الدخول بسرعة زائدة والفرملة في وسط المنعطف. هذا دليل على أنك لم تتوقّع جيداً: في المرة القادمة أبطئ مبكراً. خطأ شائع آخر: مقاربة المنعطف بعدد دورات منخفض (سرعة تروس عالية جداً). تتعب السيارة وتتقطّع، وقد تنطفئ في وسط المنعطف. خفّض السرعة قبل المنعطف لتحصل على القوة اللازمة.",
   "bva": "",
   "methode": [
    "هيّئ نظرك مبكراً: بمجرد أن ترى المنعطف، توجّه عينيك نحو المخرج (حيث ينفتح الطريق من جديد). مِل قليلاً إلى الأمام، وأدِر رأسك إن كانت قوائم الزجاج الأمامي تحجب الرؤية.",
    "افرمل وأبطئ قبل الدخول، على الجزء الذي لا يزال مستقيماً. عند الحاجة، خفّض السرعة لتكون في التروس المناسب.",
    "ابقَ ضمن مسارك تماماً: لا تتجاوز الخط الأوسط ولا تقطع المنعطف.",
    "اسحب المقود بيد واحدة: اليد اليمنى للمنعطف نحو اليمين، واليد اليسرى للمنعطف نحو اليسار — دون شدّ باليدين معاً (فذلك يُفسد مسارك)، مع إبقاء النظر بعيداً دائماً.",
    "تسارع بلطف بمجرد أن يظهر المخرج.",
    "مسار آمن — تبقى ضمن مسارك (دون قطع أو تجاوز الخط). المسار «الخارج ← الداخل ← الخارج» هو خط سباق، ولا علاقة له باختبار الرخصة."
   ],
   "quiz": [
    {
     "q": "أنت تقترب من منعطف حاد. متى تفرمل؟",
     "options": [
      "قبله، على الجزء الذي لا يزال مستقيماً",
      "في وسط المنعطف تماماً",
      "عند مخرج المنعطف"
     ],
     "explication": "تفرمل السيارة جيداً في الخط المستقيم؛ أما الفرملة في المنعطف فتُفقدها توازنها."
    },
    {
     "q": "في المنعطف، إلى أين تنظر؟",
     "options": [
      "إلى حافة الطريق، كي لا تتجاوز الخط",
      "بعيداً، نحو مخرج المنعطف",
      "إلى غطاء المحرك، لتتبع الخط"
     ],
     "explication": "النظر يقود المسار: إذا نظرت إلى الحافة، اتجهت نحو الحافة."
    },
    {
     "q": "كيف تمسك المقود في منعطف نحو اليسار؟",
     "options": [
      "تشدّ بكلتا يديك بأقصى قوة",
      "تترك المقود وتدعه يعود من تلقاء نفسه",
      "تسحب بيد واحدة، وهي اليسرى"
     ],
     "explication": "السحب بيد واحدة يبقي الحركة مرنة؛ أما الشدّ باليدين فيسبّب التوتر ويُبعدك عن مسارك."
    },
    {
     "q": "في أي لحظة تعاود التسارع في المنعطف؟",
     "options": [
      "منذ الدخول، للبقاء نشطاً",
      "عند أضيق نقطة",
      "عند المخرج، حين ينفتح الطريق من جديد، بلطف"
     ],
     "explication": "التسارع مبكراً جداً يفتح مسارك ويُبعدك نحو الخارج."
    }
   ]
  }
 },
 "C2e": {
  "en": {
   "titre": "Passing and Meeting Oncoming Traffic",
   "competence": "Traffic",
   "pourquoi": "An overtake is a moment when you're driving in the opposite lane: everything must be safe BEFORE, because once you've committed you can't back out. One instructor stresses the value of signalling even when passing a cyclist: it warns those behind you AND shows the examiner that you've analysed the situation. And the decision must be clear-cut: you firmly choose either to pass or to hold back — you don't sit there hesitating in the middle.",
   "erreur": "Overtaking \"because it'll be fine\" without full visibility (a bend, a hill), or giving in to pressure from a car tailgating you. The right reflex when doubt sets in: ease off the accelerator, downshift, hold back — and if the examiner asks why you slowed down, you justify it (\"I had a doubt about how the cyclist would behave, I couldn't see far enough ahead\").",
   "bva": "",
   "methode": [
    "To OVERTAKE — Check it's allowed: no solid line, no bend, no crest of a hill, no reduced visibility.",
    "Make sure you have visibility: you must see far and clear ahead of the vehicle you're about to pass.",
    "Chain your checks: interior mirror → left exterior mirror → left turn signal → blind-spot check → action. Make sure no one is already overtaking you.",
    "Pull out and overtake decisively, leaving lateral clearance (at least 1 m in town, 1.50 m outside built-up areas for a cyclist or two-wheeler).",
    "Right turn signal, and pull back in when you can see the whole overtaken vehicle in your interior mirror (never by \"cutting\" in front of it).",
    "To MEET oncoming traffic on a narrow road: slow down, keep well to the right (without scraping the verge), then move back to your position once you've passed."
   ],
   "quiz": [
    {
     "q": "You're hesitating about overtaking: visibility isn't perfect. What do you do?",
     "options": [
      "You go for it, it'll be fine",
      "You don't overtake: you ease off the accelerator and hold back",
      "You move over to see better"
     ],
     "explication": "Doubt alone is enough to cancel the overtake: you only pass when you can see far and clear."
    },
    {
     "q": "Before pulling out to overtake, what's the correct sequence of checks?",
     "options": [
      "Signal, then pull out",
      "A quick glance in the mirror and off you go",
      "Interior mirror, left mirror, signal, blind spot, action"
     ],
     "explication": "This sequence guarantees that no one is already in the process of overtaking you."
    },
    {
     "q": "You're overtaking a cyclist outside a built-up area. What lateral clearance?",
     "options": [
      "At least 1.50 m",
      "50 cm is enough",
      "You stay close to pass quickly"
     ],
     "explication": "1.50 m outside town, 1 m in town: a cyclist can swerve at any moment."
    },
    {
     "q": "You've just passed a car. When do you pull back in front of it?",
     "options": [
      "As soon as your front end clears it",
      "When you see it whole in your interior mirror, right turn signal on",
      "When the driver behind you demands it"
     ],
     "explication": "Pulling back in too soon forces it to brake: you cut it off."
    }
   ]
  },
  "ar": {
   "titre": "التجاوز ومقابلة المركبات القادمة",
   "competence": "السير",
   "pourquoi": "التجاوز لحظة تسير فيها في المسار المقابل: يجب أن يكون كل شيء آمناً قبل الشروع، لأنك بمجرد أن تنطلق لا يمكنك التراجع. يشدد أحد المدربين على أهمية استخدام الإشارة الضوئية حتى عند تجاوز راكب دراجة: فهي تنبّه من خلفك وتُظهر للممتحن أنك حللت الموقف. ويجب أن يكون القرار حاسماً: تختار بوضوح إما أن تتجاوز أو أن تتراجع، فلا تبقى متردداً في المنتصف.",
   "erreur": "التجاوز «لأن الأمر سيمر» دون رؤية كاملة (منعطف، مرتفع)، أو الرضوخ لضغط سيارة تلتصق بك من الخلف. رد الفعل الصحيح عند دخول الشك: ترفع قدمك عن دواسة الوقود، وتخفض السرعة، وتتراجع — وإذا سألك الممتحن عن سبب تخفيفك السرعة، تبرر ذلك («كان لدي شك في تصرف راكب الدراجة، ولم أكن أرى بعيداً بما يكفي»).",
   "bva": "",
   "methode": [
    "للتجاوز — تحقق من أنه مسموح: لا خط متصل، لا منعطف، لا قمة مرتفع، لا رؤية محدودة.",
    "تأكد من توفر الرؤية: يجب أن ترى بعيداً وخالياً أمام المركبة التي ستتجاوزها.",
    "تابع الفحوصات بالتتابع: المرآة الداخلية ← المرآة الخارجية اليسرى ← الإشارة الضوئية لليسار ← فحص النقطة العمياء ← التنفيذ. تأكد من أن لا أحد يتجاوزك بالفعل.",
    "انحرف وتجاوز بحزم مع ترك مسافة جانبية (متر واحد على الأقل داخل المدينة، 1,50 م خارج العمران لراكب دراجة أو مركبة ذات عجلتين).",
    "الإشارة الضوئية لليمين، وعُد إلى مسارك عندما ترى المركبة المتجاوَزة كاملة في مرآتك الداخلية (لا تنعطف أمامها فجأة أبداً).",
    "لمقابلة مركبة قادمة على طريق ضيق: خفّف السرعة، والتصق باليمين (دون ملامسة حافة الطريق)، ثم استعد مكانك بعد المرور."
   ],
   "quiz": [
    {
     "q": "أنت متردد في التجاوز: الرؤية ليست مثالية. ماذا تفعل؟",
     "options": [
      "تنطلق، الأمر سيمر",
      "لا تتجاوز: ترفع قدمك عن الوقود وتتراجع",
      "تنحرف لترى بشكل أفضل"
     ],
     "explication": "الشك وحده كافٍ لإلغاء التجاوز: لا تتجاوز إلا عندما ترى بعيداً وخالياً."
    },
    {
     "q": "قبل الانحراف للتجاوز، ما هو التسلسل الصحيح للفحوصات؟",
     "options": [
      "الإشارة الضوئية ثم الانحراف",
      "نظرة سريعة في المرآة وننطلق",
      "المرآة الداخلية، المرآة اليسرى، الإشارة الضوئية، النقطة العمياء، التنفيذ"
     ],
     "explication": "يضمن هذا التسلسل أن لا أحد يتجاوزك بالفعل."
    },
    {
     "q": "أنت تتجاوز راكب دراجة خارج العمران. ما المسافة الجانبية؟",
     "options": [
      "1,50 م على الأقل",
      "50 سم تكفي",
      "تلتصق به لتمر بسرعة"
     ],
     "explication": "1,50 م خارج المدينة، متر واحد داخلها: قد ينحرف راكب الدراجة في أي لحظة."
    },
    {
     "q": "لقد تجاوزت سيارة للتو. متى تعود إلى مسارك أمامها؟",
     "options": [
      "بمجرد أن يتجاوزها مقدّم سيارتك",
      "عندما تراها كاملة في مرآتك الداخلية، مع الإشارة الضوئية لليمين",
      "عندما يطلب منك من خلفك ذلك"
     ],
     "explication": "العودة إلى المسار مبكراً جداً تجبرها على الفرملة: فأنت تقطع طريقها."
    }
   ]
  }
 },
 "C2f": {
  "en": {
   "titre": "Intersections and Roundabouts",
   "competence": "Traffic",
   "pourquoi": "An intersection is where paths cross: 99% of the work is knowing WHO GOES FIRST before you get there. The right turn signal when leaving a roundabout tells others you are exiting the ring, which frees up those waiting to enter.",
   "erreur": "Two big classics: forgetting the right turn signal before leaving the roundabout (people waiting stay stuck or pull out thinking you are continuing); and failing to spot the intersection in time, leading to a failure to give way on the right because you \"thought you had time to get across.\"",
   "bva": "",
   "methode": [
    "At intersections — Spot an intersection before dealing with priority: look for the clues — a pedestrian crossing, the curve of a curb in the distance (a street opens up), a gap between parked cars or between buildings, direction signs.",
    "At intersections — At an intersection, identify the type AS YOU ARRIVE: traffic light, STOP, give way, or nothing.",
    "At intersections — If there is no sign at all, priority is to the right: anything coming out from your right goes before you.",
    "At intersections — Adjust your speed to visibility: a glance in the interior mirror, then drop back to 2nd; if you cannot see anything on the right, drop even to 1st to have time to look properly. The examiner will never hold it against you for slowing down to observe well.",
    "At intersections — Never stop suddenly at an intersection (risk of being rear-ended): slow down early and smoothly.",
    "At intersections — Only pull out if you can clear the junction: never get stuck in the middle of a crossroads.",
    "Priority to the right — Failure to give way on the right: if the car coming from the right is forced to slow down or stop to let you pass, that is already a failure to give way — even without a collision. It is never up to it to brake for you.",
    "Priority to the right — False positives: a parking lot exit, a private residence (\"private\" sign), a raised curb = not a priority on the right. Those coming out of them do not have priority (but you stay careful).",
    "At the roundabout — At a roundabout (\"Give way\" sign): as you approach, check behind, slow down and shift down (often 2nd). Choose your lane: right lane by default on a small roundabout / to exit early; lane matching your exit on a large roundabout.",
    "At the roundabout — Give way: those already on the ring have priority. Take your time — do not rush until you have properly judged both the distance AND the speed of those going around. When in doubt, wait; you can even go around again.",
    "At the roundabout — Pull into a big enough gap, without a left turn signal to enter (unless you are turning sharply left / going all the way around).",
    "At the roundabout — Approaching your exit: RIGHT turn signal just before it. Since it sometimes cancels between two exits, do not hesitate to switch it back on.",
    "At the roundabout — Before exiting: check the left blind spot (in case someone cuts across you), a glance to the right for bikes / the cycle lane, then exit and turn off the signal. Watch for the pedestrian crossing at the exit: do not accelerate until you have checked.",
    "At the roundabout — A \"traffic circle\" is not the same as a \"roundabout\": the difference is read at the entrance. Roundabout = \"Give way\" at the entrance → the one entering does NOT have priority, they let those already on the ring pass. Traffic circle (rare, no sign at the entrance) → priority to the right → the one entering has priority over those already inside."
   ],
   "quiz": [
    {
     "q": "A crossroads with no sign or light at all. Who goes first?",
     "options": [
      "The one arriving fastest",
      "You, you keep going straight",
      "Whatever comes out from your right"
     ],
     "explication": "With no sign, it is priority to the right: you give way to whatever comes from your right."
    },
    {
     "q": "How do you tell a roundabout from a traffic circle?",
     "options": [
      "By its size",
      "At the entrance: Give way = roundabout, no sign = traffic circle",
      "By the color of the markings"
     ],
     "explication": "Roundabout: you give way to those on the ring. Traffic circle: priority to the right, the one entering has priority."
    },
    {
     "q": "On a roundabout, when do you put on your right turn signal?",
     "options": [
      "As soon as you enter the ring",
      "Never, it is pointless",
      "Just before your exit"
     ],
     "explication": "Too early, the signal makes people think you are exiting sooner and blocks others."
    },
    {
     "q": "A car coming from your right slows down to let you pass, with no sign. Do you go?",
     "options": [
      "Yes, it waved you on",
      "No: it has priority, you let it pass",
      "You speed up so as not to get in its way"
     ],
     "explication": "If it brakes for you, that is already a failure to give way on your part."
    }
   ]
  },
  "ar": {
   "titre": "التقاطعات والدوّارات",
   "competence": "السير",
   "pourquoi": "التقاطع هو المكان الذي تتقاطع فيه المسارات: 99٪ من العمل هو معرفة مَنْ يمرّ أولاً قبل الوصول إليه. إشارة الانعطاف اليمنى عند الخروج من الدوّار تُنبّه الآخرين إلى أنك تغادر الحلقة، وهذا يفسح المجال لمن ينتظرون الدخول.",
   "erreur": "خطآن كلاسيكيان كبيران: نسيان إشارة الانعطاف اليمنى قبل الخروج من الدوّار (فيبقى المنتظرون عالقين أو يندفعون ظنّاً منهم أنك ستواصل)؛ وعدم اكتشاف التقاطع في الوقت المناسب، ممّا يؤدي إلى عدم منح الأولوية لليمين لأنك «ظننت أن لديك وقتاً للمرور».",
   "bva": "",
   "methode": [
    "عند التقاطعات — اكتشف التقاطع قبل مسألة الأولوية: ابحث عن المؤشرات — ممرّ مشاة، انحناء الرصيف في البعيد (شارع يتفرّع)، فُرجة بين السيارات المركونة أو بين المباني، لوحات إرشادية.",
    "عند التقاطعات — عند التقاطع، حدّد نوعه وأنت تصل: إشارة ضوئية، أو لوحة قِف STOP، أو أفسح الطريق، أو لا شيء.",
    "عند التقاطعات — إذا لم تكن هناك أي لوحة، فالأولوية لليمين: كل ما يتفرّع من يمينك يمرّ قبلك.",
    "عند التقاطعات — كيّف سرعتك مع مدى الرؤية: نظرة سريعة إلى المرآة الداخلية، ثم عُد إلى الغيار الثاني؛ وإن لم تكن ترى شيئاً على اليمين، فعُد حتى إلى الغيار الأول لتملك وقتاً للنظر جيداً. لن يلومك المراقب أبداً على التباطؤ من أجل المراقبة الجيدة.",
    "عند التقاطعات — لا تتوقّف أبداً بشكل مفاجئ عند التقاطع (خطر أن تُصدَم من الخلف): تباطأ مبكراً وبلطف.",
    "عند التقاطعات — لا تندفع إلا إذا كان بإمكانك إخلاء التقاطع: لا نبقى عالقين أبداً في منتصف المفترق.",
    "الأولوية لليمين — عدم منح الأولوية لليمين: إذا اضطُرّت السيارة القادمة من اليمين إلى التباطؤ أو التوقّف لتترك لك المرور، فهذا يُعدّ أصلاً عدم منح للأولوية — حتى دون اصطدام. ليس عليها أبداً أن تكبح من أجلك.",
    "الأولوية لليمين — الحالات المضلّلة: مخرج موقف سيارات، أو مجمّع سكني خاص (لوحة «خاص»)، أو رصيف مرتفع = ليست أولوية لليمين. الخارجون منها ليست لهم الأولوية (لكن ابقَ حذراً).",
    "عند الدوّار — عند الدوّار (لوحة «أفسح الطريق»): عند الاقتراب، راقب الخلف، تباطأ وخفّض الغيار (غالباً الثاني). اختر مسربك: المسرب الأيمن افتراضياً في دوّار صغير / للخروج مبكراً؛ والمسرب المناسب لمخرجك في دوّار كبير.",
    "عند الدوّار — أفسح الطريق: من هم على الحلقة أصلاً لهم الأولوية. خذ وقتك — لا تتسرّع حتى تقدّر جيداً المسافة والسرعة معاً لمن يدورون. عند الشك، انتظر؛ ويمكنك حتى أن تدور دورة أخرى.",
    "عند الدوّار — اندفع في فُرجة كافية، دون إشارة انعطاف يسرى للدخول (إلا إذا كنت تنعطف يساراً بشكل واضح / تدور دورة كاملة).",
    "عند الدوّار — عند الاقتراب من مخرجك: إشارة انعطاف يمنى قبله مباشرة. ولأنها تنطفئ أحياناً بين مخرجين، لا تتردّد في إعادة تشغيلها.",
    "عند الدوّار — قبل الخروج: راقب النقطة العمياء اليسرى (تحسّباً لمن قد يقطع طريقك)، ونظرة إلى اليمين للدراجات / المسار المخصص للدراجات، ثم اخرج وأطفئ الإشارة. انتبه لممرّ المشاة عند المخرج: لا تُسرّع حتى تتحقّق.",
    "عند الدوّار — «الدوّار الصغير» ليس كـ«الدوّار ذي أفسح الطريق»: يُقرأ الفرق عند المدخل. الدوّار ذو «أفسح الطريق» عند المدخل → الداخل ليست له الأولوية، يترك المرور لمن هم على الحلقة أصلاً. أما الدوّار الصغير (نادر، دون لوحة عند المدخل) → الأولوية لليمين → الداخل له الأولوية على من هم في الداخل أصلاً."
   ],
   "quiz": [
    {
     "q": "مفترق بلا أي لوحة أو إشارة ضوئية. مَنْ يمرّ أولاً؟",
     "options": [
      "مَنْ يصل بأسرع ما يمكن",
      "أنت، تواصل مستقيماً",
      "ما يتفرّع من يمينك"
     ],
     "explication": "دون أي لوحة، الأولوية لليمين: تُفسح الطريق لما يأتي من يمينك."
    },
    {
     "q": "كيف تميّز الدوّار ذا أفسح الطريق عن الدوّار الصغير؟",
     "options": [
      "بحجمه",
      "عند المدخل: أفسح الطريق = دوّار ذو أولوية، لا لوحة = دوّار صغير",
      "بلون الخطوط الأرضية"
     ],
     "explication": "الدوّار ذو الأولوية: تُفسح الطريق لمن على الحلقة. الدوّار الصغير: الأولوية لليمين، والداخل له الأولوية."
    },
    {
     "q": "في الدوّار، متى تُشغّل إشارة الانعطاف اليمنى؟",
     "options": [
      "فور الدخول إلى الحلقة",
      "أبداً، فهي بلا فائدة",
      "قبل مخرجك مباشرة"
     ],
     "explication": "إن شغّلتها مبكراً جداً، توهم الإشارةُ الآخرين أنك ستخرج قبل ذلك فتعرقلهم."
    },
    {
     "q": "سيارة قادمة من يمينك تتباطأ لتترك لك المرور، بلا أي لوحة. هل تمرّ؟",
     "options": [
      "نعم، لقد أشارت لك بالمرور",
      "لا: لها الأولوية، تتركها تمرّ",
      "تُسرّع كي لا تعرقلها"
     ],
     "explication": "إن كبحت من أجلك، فهذا يُعدّ أصلاً عدم منح للأولوية من جانبك."
    }
   ]
  }
 },
 "C2g": {
  "en": {
   "titre": "Communicate with other road users",
   "competence": "Traffic",
   "pourquoi": "The road is a dialogue. Others can't guess your intentions: if you signal early and clearly, everyone adjusts smoothly. An instructor shows it well: a turn signal from another driver switched on too late creates doubt (\"what are they doing? a U-turn?\"). On the other hand, a clearly visible turn signal while you're waiting to pull out reassures others and moves the situation forward. Signalling too late is no longer any use.",
   "erreur": "Switching on the turn signal at the same time as you turn (or not at all) — it must warn others BEFORE, not go along with the movement. And its cousin: signalling your intention and then moving over far too late, which surprises the drivers behind you.",
   "bva": "",
   "methode": [
    "Anticipate your action (turning, changing lane, stopping) BEFORE you do it.",
    "Switch on your turn signal early enough, before changing direction — far enough in advance to give others time to understand (aim for about 3 s).",
    "Move over as soon as it's safe once you've signalled your intention: you don't signal and then wait 50 m to move across.",
    "Seek eye contact at pedestrian crossings and junctions: an exchanged glance is worth more than a gamble.",
    "Switch off your turn signal once the manoeuvre is finished (if it doesn't cancel by itself — on a roundabout it often cancels too early, so turn it back on).",
    "Keep the horn for warning of a danger, never for anger."
   ],
   "quiz": [
    {
     "q": "You're turning left in 50 m. When do you switch on the turn signal?",
     "options": [
      "Early enough, before you turn",
      "Exactly as you turn",
      "Once you're in the street"
     ],
     "explication": "A turn signal switched on during the turn hasn't warned anyone."
    },
    {
     "q": "A pedestrian is waiting at the edge of a crossing. What do you do?",
     "options": [
      "Make eye contact and slow down to let them cross",
      "Honk so they make up their mind",
      "Drive through quickly before them"
     ],
     "explication": "Eye contact removes the doubt; you never force your way through."
    },
    {
     "q": "Someone is tailgating you and annoying you. Do you honk to show your anger?",
     "options": [
      "Yes, they'll get the message",
      "You brake hard to calm them down",
      "No, the horn is for warning of a danger"
     ],
     "explication": "In town, the use of the horn is in fact strictly limited."
    },
    {
     "q": "You've switched on your turn signal to change lane. What do you do next?",
     "options": [
      "You wait 50 m before moving over",
      "You move over as soon as it's safe",
      "You switch off the signal and stay put"
     ],
     "explication": "Signalling without moving over keeps the drivers behind you in doubt."
    }
   ]
  },
  "ar": {
   "titre": "التواصل مع مستخدمي الطريق الآخرين",
   "competence": "السير",
   "pourquoi": "الطريق حوار. لا يستطيع الآخرون تخمين نواياك: إذا أنذرت مبكرًا وبوضوح، تكيّف الجميع دون ارتجاج. يوضّح المدرّب ذلك جيدًا: إشارة انعطاف من سائق آخر تُشغّل متأخرًا تخلق الشك («ماذا يفعل؟ التفافة كاملة؟»). وفي المقابل، إشارة انعطاف واضحة وأنت تنتظر للاندماج تطمئن الآخرين وتدفع الموقف للأمام. الإنذار المتأخر جدًا لم يعد مفيدًا.",
   "erreur": "تشغيل إشارة الانعطاف في نفس لحظة الانعطاف (أو عدم تشغيلها إطلاقًا) — يجب أن تُنذر قبل الحركة لا أن ترافقها. وقرينها: أن تُشير إلى نيتك ثم تنحرف متأخرًا جدًا، مما يفاجئ من خلفك.",
   "bva": "",
   "methode": [
    "توقّع حركتك (الانعطاف، تغيير المسار، التوقّف) قبل أن تقوم بها.",
    "شغّل إشارة الانعطاف مبكرًا بما يكفي، قبل تغيير الاتجاه — قبله بما يكفي لإعطاء الآخرين وقتًا للفهم (استهدف نحو 3 ثوانٍ).",
    "انحرف بمجرد أن يكون ذلك آمنًا بعد أن تُشير إلى نيتك: لا تُشير ثم تنتظر 50 مترًا قبل الانحراف.",
    "ابحث عن التواصل بالنظر عند ممرات المشاة والتقاطعات: نظرة متبادلة خير من مجازفة.",
    "أطفئ إشارة الانعطاف بعد انتهاء المناورة (إذا لم تنطفئ وحدها — ففي الدوّار غالبًا ما تنطفئ مبكرًا جدًا، فأعد تشغيلها).",
    "احفظ المنبّه (الزمّور) للتحذير من خطر، ولا تستخدمه أبدًا للغضب."
   ],
   "quiz": [
    {
     "q": "ستنعطف يسارًا بعد 50 مترًا. متى تُشغّل إشارة الانعطاف؟",
     "options": [
      "مبكرًا بما يكفي، قبل الانعطاف",
      "تمامًا لحظة الانعطاف",
      "بعد أن تدخل الشارع"
     ],
     "explication": "إشارة الانعطاف التي تُشغّل أثناء الانعطاف لم تُنذر أحدًا."
    },
    {
     "q": "مارّ ينتظر عند حافة ممر مشاة. ماذا تفعل؟",
     "options": [
      "تبادل النظر معه وأبطئ لتدعه يعبر",
      "تطلق المنبّه ليحسم أمره",
      "تمرّ بسرعة قبله"
     ],
     "explication": "التواصل بالنظر يزيل الشك؛ ولا تفرض المرور أبدًا."
    },
    {
     "q": "أحدهم يلتصق بك من الخلف ويزعجك. هل تُطلق المنبّه لتُظهر غضبك؟",
     "options": [
      "نعم، سيفهم",
      "تفرمل بقوة لتهدئه",
      "لا، المنبّه للتحذير من خطر"
     ],
     "explication": "في المدينة، استخدام المنبّه مقيّد بصرامة أصلًا."
    },
    {
     "q": "شغّلت إشارة الانعطاف لتغيير المسار. ماذا تفعل بعد ذلك؟",
     "options": [
      "تنتظر 50 مترًا قبل الانحراف",
      "تنحرف بمجرد أن يكون ذلك آمنًا",
      "تطفئ الإشارة وتبقى مكانك"
     ],
     "explication": "الإشارة دون انحراف تُبقي من خلفك في شكّ."
    }
   ]
  }
 },
 "C2h": {
  "en": {
   "titre": "Driving alone in the city (summary)",
   "competence": "Traffic",
   "pourquoi": "World 2 is validated when every action becomes automatic and your mind is free to make decisions, no longer to operate the car. A telling sign: good learners check their mirrors \"without even noticing it,\" out of habit. You handle a long sequence with no help from the instructor — including in tricky areas (shopping streets, crowded car parks) where you don't let others rush you.",
   "erreur": "Panicking over something unexpected (a closed street, the wrong lane on a roundabout, a wrong turn) and making a dangerous move to \"fix it\" (a sudden U-turn, reversing, forcing a lane change). Stay calm, keep going in the lane you're in, and get back on track safely afterwards.",
   "bva": "",
   "methode": [
    "Before setting off, picture your route: the streets, the turns, the difficult spots.",
    "Put the reflexes of World 2 on a loop: look far and keep your eyes moving (C2a), suitable speed (C2b), correct positioning (C2c).",
    "Structure every maneuver, don't rush it: \"take the time to do it well\" — performing the actions in order (check → indicator → blind spot → action) is exactly what makes driving smooth and safe.",
    "Signal your intentions early (indicators, C2g) and handle right of way (C2f) without hesitating.",
    "Stay calm when something unexpected happens: if you take the wrong lane or the wrong street, keep going — even if it means going around the roundabout again — and get back on track further on. Never make a dangerous maneuver to \"make up for it.\""
   ],
   "quiz": [
    {
     "q": "You realize too late that you're in the wrong lane on the roundabout. Your reaction?",
     "options": [
      "You force your way into another lane right away",
      "You stay in your lane and go around again if needed",
      "You brake hard in the middle"
     ],
     "explication": "You never force your way into another lane in traffic to make up for a mistake."
    },
    {
     "q": "A delivery van is blocking your lane. What do you do?",
     "options": [
      "You pull out quickly before anyone comes",
      "You honk so it moves",
      "You stop, check behind and your blind spot, then go around if it's clear"
     ],
     "explication": "Treat the obstacle like a mini-overtake, safely."
    },
    {
     "q": "How do you know you've mastered driving in the city?",
     "options": [
      "When you handle a long sequence with no help from the instructor",
      "When you drive fast without stalling",
      "When you know every street"
     ],
     "explication": "Your checks have become automatic: your mind is free to anticipate."
    },
    {
     "q": "Before starting a trip alone in the city, what do you do?",
     "options": [
      "You set off and improvise",
      "You picture your route and the difficult spots",
      "You wait until you have a talking GPS"
     ],
     "explication": "Picturing the route frees your mind to make decisions instead of searching for your way."
    }
   ]
  },
  "ar": {
   "titre": "القيادة بمفردك في المدينة (خلاصة)",
   "competence": "السير",
   "pourquoi": "يُعتبر العالم الثاني مُنجَزًا عندما تصبح كل الحركات تلقائية ويتحرر ذهنك لاتخاذ القرارات بدلًا من الانشغال بقيادة السيارة. علامة معبّرة: التلاميذ المتمكنون يتفقدون مراياهم «دون أن ينتبهوا لذلك»، بحكم العادة. تُنجز تسلسلًا طويلًا دون تدخل المدرّب — بما في ذلك في المناطق الصعبة (الشوارع التجارية، مواقف السيارات المزدحمة) حيث لا تدع الآخرين يستعجلونك.",
   "erreur": "الذعر أمام أمر غير متوقع (شارع مغلق، مسار خاطئ في الدوّار، خطأ في الطريق) والقيام بحركة خطيرة من أجل «التصحيح» (استدارة مفاجئة، رجوع إلى الخلف، تغيير المسار بالقوة). ابقَ هادئًا، تابع السير في المسار الذي أنت فيه، ثم عُد إلى طريقك بأمان بعد ذلك.",
   "bva": "",
   "methode": [
    "قبل الانطلاق، تخيّل مسارك: الشوارع، تغييرات الاتجاه، المناطق الصعبة.",
    "كرّر ردود الفعل الخاصة بالعالم الثاني: النظر بعيدًا وتحريك العينين (C2a)، السرعة المناسبة (C2b)، الوضعية الصحيحة (C2c).",
    "نظّم كل مناورة ولا تُنجزها على عجل: «نأخذ الوقت لإتقانها» — تنفيذ الحركات بالترتيب (المراقبة ← إشارة الانعطاف ← النقطة العمياء ← الفعل) هو بالضبط ما يجعل القيادة سلسة وآمنة.",
    "أعلن نواياك مبكرًا (إشارات الانعطاف، C2g) وتعامل مع الأولويات (C2f) دون تردد.",
    "ابقَ هادئًا أمام المفاجآت: إذا أخطأت المسار أو الشارع، تابع السير — حتى لو اضطررت إلى الدوران حول الدوّار من جديد — ثم عُد إلى طريقك لاحقًا. لا تقم أبدًا بمناورة خطيرة من أجل «التدارك»."
   ],
   "quiz": [
    {
     "q": "تدرك متأخرًا أنك في المسار الخاطئ في الدوّار. ما رد فعلك؟",
     "options": [
      "تغيّر المسار بالقوة على الفور",
      "تبقى في مسارك وتدور من جديد إن لزم الأمر",
      "تفرمل بشدة في المنتصف"
     ],
     "explication": "لا تغيّر المسار بالقوة أبدًا في حركة السير لتدارك خطأ."
    },
    {
     "q": "شاحنة توصيل صغيرة تسدّ مسارك. ماذا تفعل؟",
     "options": [
      "تنحرف بسرعة قبل أن يصل أحد",
      "تُطلق البوق كي تتحرك",
      "تتوقف، تراقب الخلف والنقطة العمياء، ثم تتجاوزها إن كان الطريق خاليًا"
     ],
     "explication": "تعامل مع العائق كأنه تجاوز صغير، بأمان."
    },
    {
     "q": "كيف تعرف أنك أتقنت القيادة في المدينة؟",
     "options": [
      "عندما تُنجز تسلسلًا طويلًا دون تدخل المدرّب",
      "عندما تقود بسرعة دون أن يتوقف المحرك",
      "عندما تعرف كل الشوارع"
     ],
     "explication": "أصبحت مراقباتك تلقائية: ذهنك متحرر للتوقّع والاستباق."
    },
    {
     "q": "قبل بدء رحلة بمفردك في المدينة، ماذا تفعل؟",
     "options": [
      "تنطلق وترتجل",
      "تتخيّل مسارك والمناطق الصعبة",
      "تنتظر حتى يكون لديك نظام تحديد مواقع ناطق"
     ],
     "explication": "تخيّل المسار يحرّر ذهنك لاتخاذ القرار بدلًا من البحث عن طريقك."
    }
   ]
  }
 },
 "C3a": {
  "en": {
   "titre": "Seeing well and being seen at night",
   "competence": "Difficult conditions",
   "pourquoi": "At night, you see much less far and your eyes tire quickly. The whole challenge is to see as far as possible without dazzling others, and not to let yourself be hypnotized by oncoming headlights. An instructor sums it up well: at night, \"the eyes work enormously\" — they are constantly searching for cues, whereas during the day they rest.",
   "erreur": "Staying on high beam facing an oncoming car (you dazzle it, it dazzles you back) — or staring at the oncoming headlights. If you stop watching the road for even a fraction of a second, it can be dramatic: you completely lose the right edge of the road.",
   "bva": "",
   "methode": [
    "Before you drive — Before setting off: check that your windows and headlights are clean. A dirty window doubles the glare at night.",
    "Before you drive — As soon as you're moving: switch on your dipped beams (low beams). At night they are mandatory, even in a lit town.",
    "Playing with the headlights — On an unlit road with no one coming: switch to high beams (full beams) to see farther. Outside built-up areas, the signs and marker posts become reflective: you see much farther and feel more confident.",
    "Playing with the headlights — You see a vehicle coming toward you (or the faintest glow of headlights in the distance): switch back to dipped beams BEFORE it bothers you, so you don't dazzle it. At the slightest doubt (a glow behind a wall, a bend), stay on dipped beams.",
    "Playing with the headlights — While a car is passing you: NEVER stare at the oncoming headlights. Rest your gaze on the right edge of your lane (line or kerb) and follow it. You can even use the reflection of the oncoming headlights on the right-hand kerb to place yourself.",
    "Alertness at night — Your gaze becomes shorter than in broad daylight. That's normal: you see less far, so you act \"with a lag\" — you brake a little earlier and accelerate again a little later.",
    "Alertness at night — Beware of dark-clothed pedestrians and animals. A pedestrian in dark clothes and a hood shows up very late at night. Outside built-up areas, an animal may suddenly appear. Simple rule: certainty = I go, doubt = I don't accelerate.",
    "Alertness at night — You feel heavy and your eyelids are drooping: you stop. Take a break every 2 hours — AND at the very first sign of tiredness, without waiting for the 2 hours."
   ],
   "quiz": [
    {
     "q": "Headlights are coming toward you at night. Where do you look?",
     "options": [
      "The oncoming headlights",
      "The right edge of your lane",
      "The center of the road"
     ],
     "explication": "Staring at the headlights dazzles you; the right edge keeps you on your path."
    },
    {
     "q": "Empty road, a glow of headlights appears in the distance. What do you do?",
     "options": [
      "Switch back to dipped beams",
      "Stay on high beams",
      "Flash your headlights"
     ],
     "explication": "You lower your beams as soon as you notice someone, even just a glow, so as not to dazzle them."
    },
    {
     "q": "At night, a doubt about a dark pedestrian ahead of you. What do you do?",
     "options": [
      "You accelerate to get past",
      "You honk and go for it",
      "You ease off and check"
     ],
     "explication": "Certainty = action, doubt = no speed: a dark-clothed pedestrian shows up very late."
    },
    {
     "q": "You feel your eyelids drooping at the wheel at night. The right reaction?",
     "options": [
      "You hold on until the 2-hour mark",
      "You stop at the first sign",
      "You open the window and keep going"
     ],
     "explication": "Take a break every 2 hours, but above all at the very first sign of tiredness, without waiting."
    }
   ]
  },
  "ar": {
   "titre": "الرؤية الجيدة وأن تكون مرئيًا جيدًا في الليل",
   "competence": "الظروف الصعبة",
   "pourquoi": "في الليل، ترى مسافة أقصر بكثير وتتعب عيناك بسرعة. التحدي كله هو أن ترى أبعد مسافة ممكنة دون أن تُبهر الآخرين، وألا تدع نفسك تنجذب إلى أضواء المركبات القادمة في الاتجاه المعاكس. يلخّص أحد المدربين الأمر جيدًا: في الليل «تعمل العينان كثيرًا جدًا» — فهما تبحثان باستمرار عن مؤشرات، بينما تستريحان في النهار.",
   "erreur": "البقاء على الأضواء العالية أمام سيارة قادمة في الاتجاه المعاكس (فتُبهرها وتُبهرك بالمقابل) — أو تثبيت النظر على أضواء المركبة المقابلة. إذا توقفت عن مراقبة الطريق ولو لجزء من الثانية، فقد يكون ذلك كارثيًا: تفقد تمامًا الحافة اليمنى للطريق.",
   "bva": "",
   "methode": [
    "قبل القيادة — قبل الانطلاق: تأكد من أن زجاج نوافذك ومصابيحك نظيفة. الزجاج المتّسخ يضاعف الانعكاسات في الليل.",
    "قبل القيادة — بمجرد أن تبدأ القيادة: أشعل الأضواء المنخفضة (أضواء التلاقي). في الليل تكون إلزامية، حتى في المدينة المضاءة.",
    "اللعب بالأضواء — على طريق غير مضاء ولا أحد قادم في الاتجاه المعاكس: انتقل إلى الأضواء العالية (الأضواء الكاملة) لترى أبعد. خارج المناطق العمرانية، تصبح اللافتات والعلامات عاكسة: ترى أبعد بكثير وتشعر بثقة أكبر.",
    "اللعب بالأضواء — ترى مركبة قادمة في الاتجاه المعاكس (أو أدنى وميض لأضواء بعيدة): عُد إلى الأضواء المنخفضة قبل أن تزعجها، حتى لا تُبهرها. عند أدنى شك (وميض خلف جدار، أو منعطف)، ابقَ على الأضواء المنخفضة.",
    "اللعب بالأضواء — أثناء تجاوز مركبة لك: لا تثبّت نظرك أبدًا على أضواء المركبة المقابلة. ثبّت نظرك على الحافة اليمنى لمسارك (الخط أو الرصيف) واتبعها. يمكنك حتى الاستعانة بانعكاس أضواء المركبة المقابلة على الحافة اليمنى لتحديد موقعك.",
    "اليقظة في الليل — يصبح مدى نظرك أقصر مما هو عليه في وضح النهار. هذا طبيعي: ترى مسافة أقل، لذا تتصرف «بتأخير» — تفرمل أبكر بقليل وتعاود التسارع متأخرًا بقليل.",
    "اليقظة في الليل — احذر المشاة ذوي الملابس الداكنة والحيوانات. المشاة بملابس داكنة وقلنسوة يظهرون متأخرًا جدًا في الليل. خارج المناطق العمرانية، قد يظهر حيوان فجأة. قاعدة بسيطة: اليقين = أتقدّم، الشك = لا أتسارع.",
    "اليقظة في الليل — تشعر بالثقل وتتدلى جفونك: توقّف. خذ استراحة كل ساعتين — وعند أول علامة تعب مهما كانت بسيطة، دون انتظار الساعتين."
   ],
   "quiz": [
    {
     "q": "أضواء قادمة نحوك في الليل. أين تنظر؟",
     "options": [
      "أضواء المركبة المقابلة",
      "الحافة اليمنى لمسارك",
      "وسط الطريق"
     ],
     "explication": "تثبيت النظر على الأضواء يُبهرك؛ أما الحافة اليمنى فتُبقيك في مسارك."
    },
    {
     "q": "طريق مقفر، ويظهر وميض أضواء في البعيد. ما تصرّفك؟",
     "options": [
      "العودة إلى الأضواء المنخفضة",
      "البقاء على الأضواء العالية",
      "إجراء ومضة تنبيه بالأضواء"
     ],
     "explication": "نخفّض الأضواء بمجرد أن نلمح شخصًا، ولو مجرد وميض، حتى لا نُبهره."
    },
    {
     "q": "في الليل، لديك شك بشأن مشاة داكن اللباس أمامك. ماذا تفعل؟",
     "options": [
      "تتسارع لتتجاوزه",
      "تُطلق البوق وتندفع",
      "ترفع قدمك عن الدواسة وتتحقق"
     ],
     "explication": "اليقين = تصرّف، الشك = لا سرعة: المشاة داكن اللباس يظهر متأخرًا جدًا."
    },
    {
     "q": "تشعر بجفونك تتدلى وأنت خلف المقود في الليل. ما التصرف الصحيح؟",
     "options": [
      "تصمد حتى تكمل ساعتي القيادة",
      "تتوقف عند أول علامة",
      "تفتح النافذة وتُكمل"
     ],
     "explication": "خذ استراحة كل ساعتين، لكن قبل كل شيء عند أول علامة تعب، دون انتظار."
    }
   ]
  }
 },
 "C3b": {
  "en": {
   "titre": "Adapt your driving to rain, snow and fog",
   "competence": "Difficult conditions",
   "pourquoi": "Water, snow and ice reduce your tyres' grip: the car slides and takes longer to stop. More distance and more gentleness make up for that lack of grip. And visibility is the other half of the problem: wipers and demisting first, otherwise you're driving \"blind\".",
   "erreur": "Keeping the same distance as in dry weather \"because you can still see fine\". Visibility has nothing to do with grip: even if you can see, you brake half as well. Another common mistake: switching on the rear fog light in the rain (forbidden, and you dazzle the driver behind you).",
   "bva": "",
   "methode": [
    "Prepare, slow down — Prepare the car from the very first drops. Front wipers (set the speed to match how hard it's raining), rear wiper if needed, and above all demisting: air conditioning + warm air on the windscreen to clear the fog quickly. A misted-up window means less visibility, just like the rain.",
    "Prepare, slow down — Ease off the accelerator and respect the \"rain\" limits. On the motorway: 130 → 110, 110 → 100. And on a bend signposted at 50, in the rain you do NOT take it at 50: it can slide.",
    "On slippery ground — Increase your distance from the car in front. In the rain: ×2 (4 seconds instead of 2). On snow: even more (up to ×3).",
    "On slippery ground — Brake gently and early. On wet ground, braking takes twice the distance: start braking much earlier, with small presses, never a sudden jolt.",
    "On slippery ground — Avoid big puddles. A large puddle can make you lose grip all at once (aquaplaning) and hide a hole. If you can't avoid it: slow down BEFORE, then cross at a steady speed, without turning the steering wheel.",
    "See and be seen — Switch on the right lights depending on visibility: rain / grey daylight → dipped headlights to be seen and see better; fog or snow, visibility under 50 m → front AND rear fog lights allowed; ⚠️ in the RAIN: rear fog lights FORBIDDEN — they badly dazzle the driver behind (up to 2.5× a brake light), front only if the rain is heavy; turn off the fog lights as soon as visibility returns.",
    "See and be seen — No full beam in heavy rain. The light reflects off the drops and creates a wall of glare: you see even less well. Stay on dipped beam.",
    "See and be seen — If the fog is thick: apply the rule of three 50s — 50 m visibility → 50 km/h speed → 50 m gap."
   ],
   "quiz": [
    {
     "q": "In the rain, by how much do you multiply your safety distance?",
     "options": [
      "By 2",
      "You keep the same",
      "By 1.5"
     ],
     "explication": "Wet ground = doubled braking: you go from a 2-second to a 4-second gap."
    },
    {
     "q": "It's raining hard. Can you switch on your rear fog light?",
     "options": [
      "Yes, always in the rain",
      "No, forbidden in the rain",
      "Only at night"
     ],
     "explication": "The rear one dazzles the car behind: it's reserved for fog or snow."
    },
    {
     "q": "A big puddle blocks your lane and you can't avoid it. What do you do?",
     "options": [
      "Charge into it at normal speed",
      "Brake hard in the puddle",
      "Slow down before, cross with a steady wheel"
     ],
     "explication": "Charging in = aquaplaning: slow down before, never in the puddle, without turning the wheel."
    },
    {
     "q": "On a motorway limited to 130, it starts to rain. Your max speed?",
     "options": [
      "130 km/h",
      "110 km/h",
      "120 km/h"
     ],
     "explication": "In the rain the 130 drops to 110: less grip, so ease off the accelerator."
    }
   ]
  },
  "ar": {
   "titre": "كيّف قيادتك مع المطر والثلج والضباب",
   "competence": "الظروف الصعبة",
   "pourquoi": "الماء والثلج والجليد يقللون من تشبث إطاراتك بالطريق: تنزلق السيارة وتحتاج وقتاً أطول للتوقف. زيادة المسافة والقيادة بلطف يعوّضان نقص التشبث هذا. والرؤية هي النصف الآخر من المشكلة: المساحات وإزالة الضباب عن الزجاج أولاً، وإلا فأنت تقود \"وأنت أعمى\".",
   "erreur": "الاحتفاظ بنفس المسافة كما في الطقس الجاف \"لأنك ما زلت ترى جيداً\". الرؤية لا علاقة لها بالتشبث بالطريق: حتى لو كنت ترى، فإن قدرتك على الفرملة تصبح نصف ما كانت. خطأ شائع آخر: تشغيل مصباح الضباب الخلفي تحت المطر (ممنوع، وأنت تُبهر من يسير خلفك).",
   "bva": "",
   "methode": [
    "استعدّ، خفّف السرعة — جهّز السيارة منذ أولى القطرات. مساحات أمامية (اضبط سرعتها حسب شدة المطر)، مساحة خلفية عند الحاجة، وقبل كل شيء إزالة الضباب: مكيّف الهواء + هواء ساخن على الزجاج الأمامي لطرد الضباب بسرعة. الزجاج المغطى بالضباب يعني رؤية أقل، تماماً مثل المطر.",
    "استعدّ، خفّف السرعة — ارفع قدمك عن الدواسة واحترم حدود السرعة الخاصة بـ«المطر». على الطريق السيّار: 130 ← 110، 110 ← 100. وفي منعطف مُشار إليه بـ50، تحت المطر لا تأخذه بسرعة 50: قد ينزلق.",
    "على أرض زلقة — زِد المسافة بينك وبين السيارة التي أمامك. تحت المطر: ×2 (4 ثوانٍ بدل 2). على الثلج: أكثر من ذلك (حتى ×3).",
    "على أرض زلقة — افرمل بلطف وباكراً. على أرض مبللة تحتاج الفرملة إلى ضعف المسافة: ابدأ الفرملة أبكر بكثير، بضغطات صغيرة، دون أي حركة مفاجئة.",
    "على أرض زلقة — تجنّب البِرَك الكبيرة. البركة الكبيرة قد تفقدك التشبث بالطريق فجأة (الانزلاق المائي) وتخفي حفرة. إن لم تستطع تجنّبها: خفّف السرعة قبلها، ثم اعبرها بسرعة ثابتة، دون أي حركة على المِقود.",
    "انظر وكن مرئياً — شغّل الأضواء المناسبة حسب الرؤية: مطر / نهار رمادي ← الأضواء المنخفضة (الكود) لتُرى وترى أفضل؛ ضباب أو ثلج، رؤية أقل من 50 م ← مصابيح الضباب الأمامية والخلفية مسموح بها؛ ⚠️ تحت المطر: مصابيح الضباب الخلفية ممنوعة — فهي تُبهر بشدة السائق الذي خلفك (حتى 2.5 ضعف مصباح التوقف)، والأمامية فقط إن كان المطر كثيفاً؛ أطفئ مصابيح الضباب فور عودة الرؤية.",
    "انظر وكن مرئياً — لا تستعمل الأضواء العالية تحت المطر الغزير. ينعكس الضوء على القطرات ويصنع لك جداراً من الوهج: فترى بشكل أسوأ. ابقَ على الأضواء المنخفضة.",
    "انظر وكن مرئياً — إن كان الضباب كثيفاً: طبّق قاعدة الثلاثة 50 — رؤية 50 م ← سرعة 50 كم/س ← مسافة 50 م."
   ],
   "quiz": [
    {
     "q": "تحت المطر، بكم تضرب مسافة الأمان؟",
     "options": [
      "×2",
      "تُبقيها كما هي",
      "×1.5"
     ],
     "explication": "أرض مبللة = فرملة مضاعفة: تنتقل من مسافة ثانيتين إلى 4 ثوانٍ."
    },
    {
     "q": "المطر غزير. هل يمكنك تشغيل مصباح الضباب الخلفي؟",
     "options": [
      "نعم، دائماً تحت المطر",
      "لا، ممنوع تحت المطر",
      "فقط ليلاً"
     ],
     "explication": "المصباح الخلفي يُبهر السيارة التي خلفك: فهو مخصص للضباب أو الثلج."
    },
    {
     "q": "بركة كبيرة تسدّ مسربك ولا يمكن تجنّبها. ما تصرّفك؟",
     "options": [
      "الاندفاع فيها بالسرعة العادية",
      "الفرملة بقوة داخل البركة",
      "خفّف السرعة قبلها، واعبرها والمِقود ثابت"
     ],
     "explication": "الاندفاع = انزلاق مائي: خفّف السرعة قبلها، لا تفرمل أبداً داخل البركة، ودون أي حركة على المِقود."
    },
    {
     "q": "على طريق سيّار محدود بـ130، بدأ المطر ينزل. ما سرعتك القصوى؟",
     "options": [
      "130 كم/س",
      "110 كم/س",
      "120 كم/س"
     ],
     "explication": "تحت المطر ينخفض الـ130 إلى 110: تشبث أقل بالطريق، فارفع قدمك عن الدواسة."
    }
   ]
  }
 },
 "C3c": {
  "en": {
   "titre": "Staying in control when it gets slippery",
   "competence": "Difficult conditions",
   "pourquoi": "On a slippery surface, your tyres have very little grip. It is the sudden movement (a jerk of the wheel, a hard brake, a stab of the accelerator) that overwhelms this grip and makes the car slide. Smoothness, on the other hand, preserves your traction.",
   "erreur": "Braking in the middle of a bend on a slippery surface. Braking and steering at the same time is too much for the tyres: the car keeps going straight or the rear breaks away.",
   "bva": "",
   "methode": [
    "Spot the danger with your eyes: shaded patches under trees, a shiny slick, dead leaves, loose gravel, a wet tunnel exit. You anticipate BEFORE you reach it.",
    "Ease off the accelerator gently well before the slippery zone, never on it.",
    "On the zone: everything smoothly. Light accelerator, gradual steering, no sharp moves. On a wet surface, one abrupt acceleration is enough to make the wheels spin.",
    "Slow down BEFORE the bend, on the straight — not in it. In a slippery curve, look as far ahead as possible to anticipate your line, and turn with your foot off the accelerator. Use the reflective signs and the kerbs to aim for your exit.",
    "If the rear starts to slide: ease off the accelerator (without braking hard) and look where you want to go — your hands follow your eyes."
   ],
   "quiz": [
    {
     "q": "You come onto wet dead leaves at the exit of a bend. What do you do?",
     "options": [
      "A jerk of the wheel to get past quickly",
      "Ease off the accelerator, keep the wheel steady",
      "Brake hard on them"
     ],
     "explication": "Wet leaves are as slippery as soap: any sudden move makes the car slide away."
    },
    {
     "q": "On a slippery road, when do you brake before a bend?",
     "options": [
      "On the straight, before the bend",
      "Right in the middle of the bend",
      "At the exit of the bend"
     ],
     "explication": "Braking and turning together needs too much grip: brake in a straight line, then turn with your foot off the accelerator."
    },
    {
     "q": "The rear of your car slides slightly on black ice. First thing to do?",
     "options": [
      "A sharp stab of the brake",
      "Steer hard the other way",
      "Ease off the accelerator and aim where you want to go"
     ],
     "explication": "The car follows your eyes; a sharp brake makes the skid worse."
    },
    {
     "q": "You spot a shiny slick in the shade under the trees. What do you do?",
     "options": [
      "You slow down gently before you reach it",
      "You brake once you are on it",
      "You accelerate to get past quickly"
     ],
     "explication": "You anticipate: ease off the accelerator before the slippery zone, never on it."
    }
   ]
  },
  "ar": {
   "titre": "الحفاظ على التحكم عندما تصبح الطريق زلقة",
   "competence": "الظروف الصعبة",
   "pourquoi": "على السطح الزلق، تكون قدرة إطاراتك على التماسك ضعيفة جدًا. إن الحركة المفاجئة (لفّة عنيفة للمقود، كبح قوي، ضغطة حادة على دواسة السرعة) هي التي تتجاوز هذا التماسك وتجعل السيارة تنزلق. أما السلاسة فتحافظ على التصاق الإطارات بالطريق.",
   "erreur": "الكبح في وسط المنعطف على سطح زلق. الكبح والانعطاف في الوقت نفسه أكثر مما تحتمله الإطارات: تستمر السيارة في السير مستقيمة أو ينزلق مؤخّرها.",
   "bva": "",
   "methode": [
    "اكتشف الخطر بعينك: المناطق المظللة تحت الأشجار، بقعة لامعة، أوراق شجر ميتة، حصى صغير، مخرج نفق مبلل. أنت تتوقّع قبل أن تصل إلى المكان.",
    "ارفع قدمك عن دواسة السرعة برفق قبل المنطقة الزلقة بوقت كافٍ، لا فوقها أبدًا.",
    "في المنطقة الزلقة: كل شيء بسلاسة. دواسة سرعة خفيفة، مقود تدريجي، دون أي حركة حادة. على أرض مبللة، تكفي ضغطة مفاجئة على دواسة السرعة لجعل العجلات تدور في مكانها.",
    "خفّف السرعة قبل المنعطف، على الخط المستقيم — لا داخله. في منعطف زلق، انظر إلى أبعد مسافة ممكنة لتتوقّع مسارك، وانعطف مع رفع قدمك عن دواسة السرعة. استعن باللافتات العاكسة وحواف الطريق لتحديد مخرجك.",
    "إذا بدأ مؤخّر السيارة بالانزلاق: ارفع قدمك عن دواسة السرعة (دون كبح مفاجئ) وانظر إلى حيث تريد الذهاب — تتبع يداك نظرك."
   ],
   "quiz": [
    {
     "q": "تصل إلى أوراق شجر ميتة مبللة عند مخرج منعطف. ماذا تفعل؟",
     "options": [
      "لفّة عنيفة للمقود لتجتاز بسرعة",
      "ارفع قدمك عن دواسة السرعة، مع إبقاء المقود ثابتًا",
      "اكبح بقوة فوقها"
     ],
     "explication": "الأوراق المبللة تنزلق كالصابون: أي حركة مفاجئة تجعل السيارة تنزلق."
    },
    {
     "q": "على طريق زلق، متى تقوم بالكبح قبل المنعطف؟",
     "options": [
      "على الخط المستقيم، قبل المنعطف",
      "في منتصف المنعطف تمامًا",
      "عند مخرج المنعطف"
     ],
     "explication": "الكبح والانعطاف معًا يتطلبان تماسكًا كبيرًا جدًا: نكبح على خط مستقيم، ثم ننعطف مع رفع القدم عن دواسة السرعة."
    },
    {
     "q": "ينزلق مؤخّر سيارتك قليلًا على الجليد الأسود. ما أول ما تفعله؟",
     "options": [
      "كبح حاد ومفاجئ",
      "لفّ المقود بقوة في الاتجاه الآخر",
      "ارفع قدمك عن دواسة السرعة وحدّد وجهتك"
     ],
     "explication": "تتبع السيارة نظرك؛ أما الكبح الحاد فيزيد الانزلاق سوءًا."
    },
    {
     "q": "تلاحظ بقعة لامعة في الظل تحت الأشجار. ماذا تفعل؟",
     "options": [
      "تخفّف السرعة برفق قبل أن تصل إليها",
      "تكبح مرة واحدة فوقها",
      "تسرّع لتجتازها بسرعة"
     ],
     "explication": "نحن نتوقّع: ارفع القدم عن دواسة السرعة قبل المنطقة الزلقة، لا فوقها أبدًا."
    }
   ]
  }
 },
 "C3d": {
  "en": {
   "titre": "Emergency braking & grip (ABS)",
   "competence": "Difficult conditions",
   "pourquoi": "In an emergency, the shortest way to stop is to brake as hard as possible. ABS lets you brake fully without locking the wheels, so you don't slide straight ahead: you keep the ability to steer to avoid the obstacle. You declutch afterward, not before, so you don't lose engine braking at the very start of braking.",
   "erreur": "Braking in jerky bursts or letting off the pedal as soon as it vibrates, out of fear. The vibration IS the sign that the ABS is working: releasing lengthens the stopping distance and makes you lose the benefit of the system. Another mistake: declutching BEFORE braking — the order is brake first, clutch second.",
   "bva": "",
   "methode": [
    "An obstacle appears. First action: you brake HARD, all the way, in one go. The brake first — it's the absolute priority.",
    "You keep your foot pressed down, without releasing. On a car with ABS (all modern driving-school cars), it's the ABS that keeps the wheels from locking — you'll feel the pedal vibrate or \"tap-tap\" under your foot: that's normal, don't let off.",
    "You can steer at the same time. With ABS, you keep steering: you can brake fully AND steer the car toward your escape route.",
    "Look at your escape route, not the obstacle. Where your eyes go, the car goes.",
    "Then you declutch — just before the engine stalls. The order matters: brake first, clutch second. You press the clutch so you don't stall and keep control, but only once braking is under way.",
    "Once the danger has passed: you release gradually and go back to normal driving."
   ],
   "quiz": [
    {
     "q": "Emergency braking in a car with ABS. Your first action?",
     "options": [
      "Declutch first",
      "Brake fully in one go",
      "Brake in small jerky bursts"
     ],
     "explication": "The brake first, all the way: the clutch comes only afterward, just before stalling."
    },
    {
     "q": "During emergency braking, the pedal vibrates hard under your foot. What do you do?",
     "options": [
      "Let off a little",
      "Pump the pedal",
      "Keep pressing hard"
     ],
     "explication": "The vibration is the ABS working: releasing lengthens the stopping distance."
    },
    {
     "q": "An obstacle is right in front of you during emergency braking. Where do you look?",
     "options": [
      "The obstacle",
      "Your clear escape route",
      "Your mirrors"
     ],
     "explication": "The car follows your gaze: aiming at the clear space takes you there, staring at the obstacle sends you into it."
    },
    {
     "q": "With ABS, during emergency braking, can you steer the car?",
     "options": [
      "No, the wheels are locked",
      "Yes, you brake fully AND steer",
      "Only after releasing"
     ],
     "explication": "ABS prevents locking: you keep steering to avoid the obstacle."
    }
   ]
  },
  "ar": {
   "titre": "الفرملة الطارئة والتماسك (نظام ABS)",
   "competence": "الظروف الصعبة",
   "pourquoi": "في حالة الطوارئ، أقصر طريق للتوقف هو الفرملة بأقصى قوة. يتيح لك نظام ABS الفرملة الكاملة دون أن تُقفَل العجلات، فلا تنزلق السيارة إلى الأمام مباشرة: تحتفظ بإمكانية التوجيه لتجنب العائق. تفصل القابض (الدبرياج) بعد ذلك وليس قبله، حتى لا تفقد فرملة المحرك في بداية الفرملة تماماً.",
   "erreur": "الفرملة على شكل نقرات متقطعة أو رفع القدم عن الدواسة بمجرد أن تهتز، بدافع الخوف. الاهتزاز هو نفسه علامة على أن نظام ABS يعمل: الرفع يطيل مسافة التوقف ويفقدك فائدة النظام. خطأ آخر: فصل القابض قبل الفرملة — الترتيب هو الفرملة أولاً ثم القابض.",
   "bva": "",
   "methode": [
    "يظهر عائق فجأة. أول حركة: تفرمل بقوة، إلى النهاية، دفعة واحدة. الفرملة أولاً — إنها الأولوية المطلقة.",
    "تُبقي قدمك ضاغطة دون أن ترفع. في سيارة مزودة بنظام ABS (جميع سيارات مدارس القيادة الحديثة)، فإن نظام ABS هو الذي يمنع العجلات من الإقفال — ستشعر بالدواسة تهتز أو تنبض «تكة تكة» تحت قدمك: هذا طبيعي، لا ترفع قدمك.",
    "يمكنك التوجيه في الوقت نفسه. مع نظام ABS تحتفظ بالتوجيه: يمكنك الفرملة بأقصى قوة وتوجيه السيارة نحو مخرج النجاة في آن واحد.",
    "انظر إلى مخرج النجاة، لا إلى العائق. حيث تتجه عيناك تتجه السيارة.",
    "ثم تفصل القابض (الدبرياج) — قبل أن يتوقف المحرك مباشرة. الترتيب مهم: الفرملة أولاً ثم القابض. تضغط على القابض حتى لا يتوقف المحرك وتحافظ على السيطرة، ولكن فقط بعد بدء الفرملة.",
    "بعد زوال الخطر: ترفع قدمك تدريجياً وتعود إلى القيادة العادية."
   ],
   "quiz": [
    {
     "q": "فرملة طارئة في سيارة مزودة بنظام ABS. ما أول حركة تقوم بها؟",
     "options": [
      "فصل القابض أولاً",
      "الفرملة بأقصى قوة دفعة واحدة",
      "الفرملة على شكل نقرات صغيرة متقطعة"
     ],
     "explication": "الفرملة أولاً إلى النهاية: القابض يأتي فقط بعد ذلك، قبل توقف المحرك مباشرة."
    },
    {
     "q": "أثناء الفرملة الطارئة، تهتز الدواسة بقوة تحت قدمك. ماذا تفعل؟",
     "options": [
      "ترفع قدمك قليلاً",
      "تضخّ الدواسة (تضغط وترفع بالتناوب)",
      "تستمر في الضغط بقوة"
     ],
     "explication": "الاهتزاز هو نظام ABS وهو يعمل: الرفع يطيل مسافة التوقف."
    },
    {
     "q": "هناك عائق أمامك تماماً أثناء الفرملة الطارئة. إلى أين تنظر؟",
     "options": [
      "إلى العائق",
      "إلى مخرج النجاة الخالي",
      "إلى المرايا"
     ],
     "explication": "السيارة تتبع النظر: استهداف المساحة الخالية يأخذك إليها، وتثبيت النظر على العائق يرسلك نحوه."
    },
    {
     "q": "مع نظام ABS، أثناء الفرملة الطارئة، هل يمكنك توجيه السيارة؟",
     "options": [
      "لا، العجلات مقفلة",
      "نعم، تفرمل بأقصى قوة وتوجّه في آن واحد",
      "فقط بعد رفع القدم عن الدواسة"
     ],
     "explication": "يمنع نظام ABS الإقفال: تحتفظ بالتوجيه لتجنب العائق."
    }
   ]
  }
 },
 "C3e": {
  "en": {
   "titre": "Expressways & motorways: entering, driving, exiting",
   "competence": "Difficult conditions",
   "pourquoi": "The motorway works as a fast, steady flow. The goal is to blend into it without breaking that flow: reach the right speed to merge in, and slow down off to the side (the deceleration lane) to exit, without surprising anyone. That's also why you check the blind spot thoroughly: even when well positioned, someone can slip through (a motorcyclist, a car forcing its way in).",
   "erreur": "Merging too slowly (or even stopping at the end of the acceleration lane): you force cars to brake for you and you create a hazard. A successful merge means reaching THEIR speed. Another mistake: braking in the driving lane instead of waiting for the deceleration lane.",
   "bva": "",
   "methode": [
    "Entering — Spot the merge: the combo of a \"Give way\" sign plus a no-left-turn sign signals an acceleration lane 9 times out of 10. As soon as you see it, get ready.",
    "Entering — Merging in: put on your left turn signal.",
    "Entering — Accelerate along the whole acceleration lane to reach a speed close to that of the traffic (in practice, at least 70-80). Short lane → stay in 3rd (more pickup); long lane → you can shift to 4th. NEVER stop at the end of the lane.",
    "Entering — Check the left exterior mirror plus a glance over your shoulder (blind spot) and pick the car you're going to slot in ahead of.",
    "Entering — When the gap is clear, merge in smoothly and turn off the signal. You don't slow down to merge: you hold your speed or accelerate.",
    "Driving — Cruising: stay in the right lane by default, even when the road widens to 3 lanes.",
    "Driving — To overtake: check (interior mirror → exterior mirror → blind spot), left signal, pull out, don't slow down during the overtake, then move back to the right once you're past (right signal, another check).",
    "Driving — Never stay alongside a heavy truck: overtake it decisively.",
    "Exiting — Getting off: right signal about 200 m before your exit, after checking.",
    "Exiting — You do NOT brake on the motorway: wait until you're on the deceleration lane, once you've exited, to slow down and change down calmly."
   ],
   "quiz": [
    {
     "q": "You're on the motorway acceleration lane. What's your target speed?",
     "options": [
      "Slow down to merge in",
      "Reach traffic speed (70-80 min)",
      "Stop at the end of the lane"
     ],
     "explication": "You merge into a gap at their pace; arriving slowly forces everyone to brake."
    },
    {
     "q": "You've just overtaken a truck on the motorway. What do you do?",
     "options": [
      "You stay in the left lane",
      "You move back to the right",
      "You slow down alongside it"
     ],
     "explication": "The left lane is for overtaking: clear it as soon as you're past."
    },
    {
     "q": "Your motorway exit is coming up. When do you slow down?",
     "options": [
      "In the driving lane",
      "As soon as you see the sign",
      "Once you're on the deceleration lane"
     ],
     "explication": "You never brake on the motorway: signal early, then slow down on the exit ramp."
    },
    {
     "q": "Before merging in, besides the left mirror, what do you check?",
     "options": [
      "Nothing else",
      "The blind spot over your shoulder",
      "Just the interior mirror"
     ],
     "explication": "A motorcyclist or a car can slip into the blind spot, invisible in the mirror."
    }
   ]
  },
  "ar": {
   "titre": "الطرق السريعة والطرق السيارة: الدخول، السير، الخروج",
   "competence": "الظروف الصعبة",
   "pourquoi": "تعمل الطريق السيارة بتدفق سريع ومنتظم. الهدف هو الاندماج فيه دون كسر هذا التدفق: الوصول إلى السرعة المناسبة للاندماج، والتباطؤ على الجانب (مسار التباطؤ) للخروج، دون مفاجأة أحد. لهذا السبب أيضاً نتحقق من النقطة العمياء جيداً: حتى مع التمركز الجيد، قد يتسلل أحدهم (دراج ناري، أو سيارة تفرض المرور).",
   "erreur": "الاندماج ببطء شديد (أو حتى التوقف في نهاية مسار التسارع): تجبر السيارات على الفرملة من أجلك وتخلق خطراً. الاندماج الناجح هو الوصول إلى سرعتهم. خطأ آخر: الفرملة في مسار السير بدلاً من انتظار مسار التباطؤ.",
   "bva": "",
   "methode": [
    "الدخول — رصد الاندماج: مزيج علامة «أعطِ الأولوية» مع منع الانعطاف يساراً يُنذر بوجود مسار تسارع في 9 حالات من 10. بمجرد أن تراه، استعد.",
    "الدخول — الاندماج: شغّل إشارة الانعطاف اليسرى.",
    "الدخول — سرّع على طول مسار التسارع كله للوصول إلى سرعة قريبة من سرعة التدفق (عملياً 70-80 على الأقل). مسار قصير ← ابقَ في السرعة الثالثة (استجابة أكبر)؛ مسار طويل ← يمكنك الانتقال إلى الرابعة. لا تتوقف أبداً في نهاية المسار.",
    "الدخول — تحقق من المرآة الخارجية اليسرى مع نظرة فوق الكتف (النقطة العمياء) واختر السيارة التي ستندمج أمامها.",
    "الدخول — عندما تكون المساحة خالية، اندمج بسلاسة وأطفئ الإشارة. لا تتباطأ للاندماج: تحافظ على سرعتك أو تسرّع.",
    "السير — القيادة: ابقَ في المسار الأيمن افتراضياً، حتى عندما تتسع الطريق إلى ثلاثة مسارات.",
    "السير — للتجاوز: تحقق (المرآة الداخلية ← الخارجية ← النقطة العمياء)، إشارة يسرى، تجاوز، لا تتباطأ أثناء التجاوز، ثم عُد إلى اليمين بعد التجاوز (إشارة يمنى، تحقق جديد).",
    "السير — لا تبقَ أبداً بجانب شاحنة ثقيلة: تجاوزها بحزم.",
    "الخروج — الخروج: إشارة يمنى حوالي 200 م قبل مخرجك، بعد التحقق.",
    "الخروج — لا تفرمل على الطريق السيارة: انتظر حتى تكون على مسار التباطؤ، بعد الخروج، لتتباطأ وتخفّض السرعة بهدوء."
   ],
   "quiz": [
    {
     "q": "أنت على مسار التسارع في الطريق السيارة. ما هي سرعتك المستهدفة؟",
     "options": [
      "التباطؤ للاندماج",
      "الوصول إلى سرعة التدفق (70-80 كحد أدنى)",
      "التوقف في نهاية المسار"
     ],
     "explication": "نندمج في فجوة بسرعتهم؛ الوصول ببطء يجبر الجميع على الفرملة."
    },
    {
     "q": "لقد تجاوزت للتو شاحنة على الطريق السيارة. ماذا تفعل؟",
     "options": [
      "تبقى في المسار الأيسر",
      "تعود إلى اليمين",
      "تتباطأ بجانبها"
     ],
     "explication": "المسار الأيسر مخصص للتجاوز: أخلِه بمجرد أن تتجاوز."
    },
    {
     "q": "مخرجك من الطريق السيارة يقترب. متى تتباطأ؟",
     "options": [
      "في مسار السير",
      "بمجرد أن ترى اللافتة",
      "بمجرد أن تكون على مسار التباطؤ"
     ],
     "explication": "لا تفرمل أبداً على الطريق السيارة: أشر مبكراً، ثم تباطأ على منحدر الخروج."
    },
    {
     "q": "قبل الاندماج، إضافة إلى المرآة اليسرى، ماذا تتحقق؟",
     "options": [
      "لا شيء آخر",
      "النقطة العمياء فوق الكتف",
      "فقط المرآة الداخلية"
     ],
     "explication": "قد يتسلل دراج ناري أو سيارة إلى النقطة العمياء، غير مرئي في المرآة."
    }
   ]
  }
 },
 "C3f": {
  "en": {
   "titre": "Tunnels, bridges & special zones",
   "competence": "Difficult conditions",
   "pourquoi": "A tunnel is an enclosed space: you make yourself visible (lights) and always keep an exit in mind. A bridge is a very exposed space: the wind can push you suddenly, which is why you hold the steering wheel firmly.",
   "erreur": "Entering a tunnel without turning on your lights (you can \"still see\" at the entrance but you become invisible deeper inside) — or letting go of the steering wheel as you leave a bridge, just as the gust hits.",
   "bva": "",
   "methode": [
    "Tunnel: before entering, turn on your dipped headlights (never full-beam headlights in a tunnel).",
    "As soon as you enter: mentally note the nearest emergency exit and keep your distance.",
    "In the tunnel: no U-turns, no reversing, keep your speed and your gap.",
    "In case of a forced stop / traffic jam: switch off the engine, and if there's a problem, walk toward the emergency exit you spotted.",
    "Bridge / viaduct: as you approach an exposed bridge, hold your steering wheel firmly, anticipate a gust of side wind that can push you off course.",
    "Leaving the bridge: watch out, the road surface may be more slippery (frost, damp) than elsewhere."
   ],
   "quiz": [
    {
     "q": "You are entering a tunnel in broad daylight. What do you do before the entrance?",
     "options": [
      "Turn on full-beam headlights",
      "Turn on dipped headlights",
      "Turn nothing on"
     ],
     "explication": "Dipped headlights make you visible without dazzling anyone; never use full-beam headlights in a tunnel."
    },
    {
     "q": "As soon as you are in the tunnel, what do you look for first?",
     "options": [
      "The nearest emergency exit",
      "The radio station",
      "The speed of the others"
     ],
     "explication": "In an enclosed space, knowing where to escape makes all the difference if there's a problem."
    },
    {
     "q": "You are crossing a long exposed bridge on a windy day. How do you hold the steering wheel?",
     "options": [
      "One hand, relaxed",
      "You let go as you leave the bridge",
      "Firmly with both hands"
     ],
     "explication": "Side wind pushes the car suddenly: a loose grip on the wheel means swerving."
    },
    {
     "q": "Your car breaks down in a tunnel. What is forbidden?",
     "options": [
      "Switching off the engine",
      "Making a U-turn or reversing",
      "Walking to the emergency exit"
     ],
     "explication": "No U-turns or reversing in a tunnel: switch off the engine and reach the exit on foot."
    }
   ]
  },
  "ar": {
   "titre": "الأنفاق والجسور والمناطق الخاصة",
   "competence": "الظروف الصعبة",
   "pourquoi": "النفق مكان مغلق: تجعل نفسك مرئيًا (بالأضواء) وتبقي دائمًا مخرجًا في ذهنك. أما الجسر فهو مكان شديد التعرّض: يمكن للرياح أن تدفعك فجأة، ولذلك تمسك المقود بإحكام.",
   "erreur": "الدخول إلى النفق دون إشعال أضوائك (فأنت «لا تزال ترى» عند المدخل لكنك تصبح غير مرئي في العمق) — أو ترك المقود عند الخروج من الجسر تمامًا في اللحظة التي تضربك فيها هبّة الريح.",
   "bva": "",
   "methode": [
    "النفق: قبل الدخول، أشعل الأضواء المنخفضة (لا تستخدم أبدًا الأضواء العالية داخل النفق).",
    "بمجرد الدخول: حدّد ذهنيًا أقرب مخرج طوارئ وحافظ على مسافتك.",
    "داخل النفق: ممنوع الالتفاف، ممنوع الرجوع للخلف، حافظ على سرعتك وعلى المسافة بينك وبين الآخرين.",
    "في حال التوقف الاضطراري / الازدحام: أطفئ المحرك، وعند حدوث مشكلة توجّه سيرًا على الأقدام نحو مخرج الطوارئ الذي حدّدته.",
    "الجسر / الجسر العلوي: عند الاقتراب من جسر مكشوف، أمسك المقود بإحكام وتوقّع هبّة رياح جانبية قد تنحرف بك عن مسارك.",
    "عند الخروج من الجسر: انتبه، فقد يكون سطح الطريق أكثر انزلاقًا (جليد، رطوبة) من غيره."
   ],
   "quiz": [
    {
     "q": "أنت داخل إلى نفق في وضح النهار. ماذا تفعل قبل المدخل؟",
     "options": [
      "إشعال الأضواء العالية",
      "إشعال الأضواء المنخفضة",
      "عدم إشعال أي شيء"
     ],
     "explication": "الأضواء المنخفضة تجعلك مرئيًا دون أن تُبهر أحدًا؛ لا تستخدم أبدًا الأضواء العالية في النفق."
    },
    {
     "q": "بمجرد وجودك داخل النفق، ما الذي تبحث عنه أولًا؟",
     "options": [
      "أقرب مخرج طوارئ",
      "محطة الراديو",
      "سرعة الآخرين"
     ],
     "explication": "في مكان مغلق، معرفة مكان الهروب تغيّر كل شيء عند حدوث مشكلة."
    },
    {
     "q": "أنت تعبر جسرًا طويلًا مكشوفًا في يوم عاصف. كيف تمسك المقود؟",
     "options": [
      "بيد واحدة، مسترخيًا",
      "تترك المقود عند الخروج من الجسر",
      "بإحكام بكلتا اليدين"
     ],
     "explication": "الرياح الجانبية تدفع السيارة فجأة: المقود المرتخي يعني الانحراف."
    },
    {
     "q": "تعطّلت سيارتك داخل نفق. ما الممنوع؟",
     "options": [
      "إطفاء المحرك",
      "الالتفاف أو الرجوع للخلف",
      "التوجّه إلى مخرج الطوارئ سيرًا على الأقدام"
     ],
     "explication": "ممنوع الالتفاف أو الرجوع للخلف في النفق: تطفئ المحرك وتصل إلى المخرج سيرًا على الأقدام."
    }
   ]
  }
 },
 "C3g": {
  "en": {
   "titre": "Dense city: sharing the road with pedestrians, cyclists and buses",
   "competence": "Difficult conditions",
   "pourquoi": "In a dense city, danger doesn't come from speed but from the unexpected: a pedestrian between two cars, a bike in your blind spot, a door opening, a pedestrian hidden behind a bus. Driving slowly and looking everywhere is what gives you time to stop in time. An instructor puts it another way: your driving \"draws in\" whatever your decisions cause — one hesitation too many and you find yourself stuck behind a cyclist you can no longer overtake.",
   "erreur": "Forgetting to check the blind spot over your shoulder before turning right: a cyclist coming up on your right is invisible in the mirror, and this is the classic \"car turning / bike going straight\" accident. Another trap: pulling out in front of a stopped bus without picturing the pedestrian crossing hidden behind it.",
   "bva": "",
   "methode": [
    "Ease off the gas. In a dense city, a reduced speed is your number-one safety margin: it gives you time to react to whatever appears. Take speed bumps in 2nd gear, gently.",
    "Look far AND wide. Scan the sidewalks, between parked cars, in front of stopped buses — a pedestrian can appear anywhere, especially behind a bus that blocks your view (the classic trap: they step right onto the crossing, hidden by the bus).",
    "Before every maneuver (turning, pulling back in, parking): check your blind spot over your shoulder. A bike or scooter slipping between you and the curb hides there easily. Even simply pulling away at a light deserves a glance.",
    "When you overtake a bike: leave at least 1 meter of space (1.5 m outside built-up areas) and slow down. If you're already too close when you spot it, don't overtake: ease off the gas and wait.",
    "At a pedestrian crossing: slow down and always give way to the pedestrian, even one who has taken a single step. Until you're certain there's no one, don't accelerate.",
    "Bus lane: don't drive in it (unless allowed by road markings); watch for a bus pulling away from its stop — it has priority, so ease off the gas and let it go."
   ],
   "quiz": [
    {
     "q": "You're about to turn right in the city. Besides the mirror, what do you check?",
     "options": [
      "Nothing else",
      "Your right blind spot, over your shoulder",
      "The left mirror only"
     ],
     "explication": "A cyclist coming up on your right is invisible in the mirror: the shoulder glance prevents the accident."
    },
    {
     "q": "A bus stopped on the right blocks your view of the pedestrian crossing in front of it. What do you do?",
     "options": [
      "You drive through normally",
      "You honk and overtake",
      "You slow down and only move once you're sure"
     ],
     "explication": "The bus is hiding a pedestrian who could appear: until you're certain, don't accelerate."
    },
    {
     "q": "You're overtaking a cyclist on an urban boulevard. What minimum gap?",
     "options": [
      "At least 1 meter",
      "50 cm is enough",
      "You can brush past if you slow down"
     ],
     "explication": "1 m in the city (1.5 m outside built-up areas) absorbs the unexpected from a bike that swerves."
    },
    {
     "q": "A bus is pulling away from its stop right in front of you. What do you do?",
     "options": [
      "You speed up to get past before it",
      "You ease off the gas and let it go",
      "You honk so it waits"
     ],
     "explication": "A bus leaving its stop has priority: you make room for it."
    }
   ]
  },
  "ar": {
   "titre": "المدينة المزدحمة: مشاركة الطريق مع المشاة والدراجات والحافلات",
   "competence": "الظروف الصعبة",
   "pourquoi": "في المدينة المزدحمة، لا يأتي الخطر من السرعة بل من المفاجآت: مشاة بين سيارتين، دراجة في نقطتك العمياء، باب يُفتح، مشاة مختبئون خلف حافلة. القيادة ببطء والنظر في كل الاتجاهات هو ما يمنحك الوقت للتوقف في الوقت المناسب. يقولها المدرب بطريقة أخرى: قيادتك «تجتذب» ما تسببه قراراتك — تردد زائد واحد وتجد نفسك عالقاً خلف راكب دراجة لم يعد بإمكانك تجاوزه.",
   "erreur": "نسيان التحقق من النقطة العمياء فوق الكتف قبل الانعطاف يميناً: راكب دراجة يتقدم على يمينك غير مرئي في المرآة، وهذا هو الحادث الكلاسيكي «سيارة تنعطف / دراجة تسير مستقيمة». فخ آخر: التقدم أمام حافلة متوقفة دون تخيّل المشاة الذين يعبرون مختبئين خلفها.",
   "bva": "",
   "methode": [
    "ارفع قدمك عن الوقود. في المدينة المزدحمة، السرعة المنخفضة هي هامش أمانك الأول: تمنحك الوقت للتفاعل مع كل ما يظهر فجأة. المطبات، خذها بالسرعة الثانية وبلطف.",
    "انظر بعيداً وواسعاً. امسح بنظرك الأرصفة، وبين السيارات المتوقفة، وأمام الحافلات المتوقفة — يمكن للمشاة أن يظهروا في أي مكان، خاصة خلف حافلة تحجب الرؤية (الفخ الكلاسيكي: يخرج تماماً على ممر العبور، مختبئاً خلف الحافلة).",
    "قبل كل مناورة (الانعطاف، العودة إلى المسار، الركن): تحقق من نقطتك العمياء فوق الكتف. دراجة أو سكوتر يتسلل بينك وبين الرصيف يختبئ هناك بسهولة. حتى مجرد الانطلاق عند إشارة يستحق نظرة.",
    "عند تجاوز دراجة: اترك مسافة متر واحد على الأقل (1,50 م خارج المناطق المبنية) وأبطئ. إذا كنت قريباً جداً بالفعل عندما تكتشفها، فلا تتجاوز: ارفع قدمك وانتظر.",
    "أمام ممر المشاة: أبطئ وأفسح الطريق دائماً للمشاة، حتى لو خطا خطوة واحدة. ما دمت غير متأكد من خلو الطريق، لا تُسرِع.",
    "مسار الحافلات: لا تسر فيه (إلا بترخيص مرسوم على الأرض)؛ انتبه للحافلة التي تنطلق من موقفها، فلها الأولوية — ارفع قدمك ودعها تنطلق."
   ],
   "quiz": [
    {
     "q": "ستنعطف يميناً في المدينة. بالإضافة إلى المرآة، ماذا تتحقق منه؟",
     "options": [
      "لا شيء آخر",
      "نقطتك العمياء اليمنى، فوق الكتف",
      "المرآة اليسرى فقط"
     ],
     "explication": "راكب دراجة يتقدم على يمينك غير مرئي في المرآة: نظرة الكتف تتجنب الحادث."
    },
    {
     "q": "حافلة متوقفة على اليمين تحجب عنك ممر المشاة أمامها. ماذا تفعل؟",
     "options": [
      "تمر بشكل طبيعي",
      "تُطلق البوق وتتجاوز",
      "تُبطئ ولا تتقدم إلا بعد التأكد"
     ],
     "explication": "الحافلة تخفي مشاة قد يظهرون فجأة: ما دمت غير متأكد، لا تُسرِع."
    },
    {
     "q": "تتجاوز راكب دراجة في شارع حضري. ما الحد الأدنى للمسافة؟",
     "options": [
      "متر واحد على الأقل",
      "50 سم تكفي",
      "يمكنك الاقتراب جداً إذا أبطأت"
     ],
     "explication": "متر واحد في المدينة (1,50 م خارج المناطق المبنية) يستوعب مفاجأة الدراجة التي تتمايل."
    },
    {
     "q": "حافلة تنطلق من موقفها أمامك تماماً. ماذا تفعل؟",
     "options": [
      "تُسرِع لتمر قبلها",
      "ترفع قدمك وتدعها تنطلق",
      "تُطلق البوق لتنتظر"
     ],
     "explication": "الحافلة التي تغادر موقفها لها الأولوية: نفسح لها المكان."
    }
   ]
  }
 },
 "C4a": {
  "en": {
   "titre": "Plan your trip before you turn the key",
   "competence": "Autonomous",
   "pourquoi": "A planned trip means a free mind for the road. Instructors tell this to those who are afraid of driving alone: if you've spotted your landmarks and you know you have a backup GPS and you can always pull over, you realize you actually have plenty of solutions at hand. You won't be searching for your exit in a panic at the last moment.",
   "erreur": "Setting off \"on a whim\" and programming the GPS once you're already moving. You take your eyes off the road at the worst moment, and you discover the difficulties at full speed.",
   "bva": "",
   "methode": [
    "Look at your whole route on the GPS, not just the start and the destination.",
    "Spot 2-3 visual landmarks along the way: \"after the McDonald's I turn\", \"the big petrol station, that's where I get off\". It reassures you if the GPS glitches.",
    "Plan a backup route in case a road is closed or blocked.",
    "Check the conditions: weather, live traffic, announced roadworks.",
    "Spot the tricky areas in advance: big interchanges, tolls, city entrances, closely spaced exits.",
    "Plan your breaks if the trip is long: a break of about 15 min every 2 hours.",
    "Set everything up BEFORE you start: GPS programmed, phone secured, seat and mirrors ok."
   ],
   "quiz": [
    {
     "q": "Before a long, unfamiliar trip, what do you do?",
     "options": [
      "You set off on a whim, you'll see",
      "You look at the whole route and spot 2-3 landmarks",
      "You program the GPS while driving"
     ],
     "explication": "Whatever you prepare while stopped frees up your attention for the road."
    },
    {
     "q": "When do you set the GPS?",
     "options": [
      "Car stopped, before you start driving",
      "At the first red light",
      "As soon as you're driving"
     ],
     "explication": "2 seconds with your eyes down at 90 km/h is 50 m driven blind."
    },
    {
     "q": "4 hours of driving. Your breaks?",
     "options": [
      "None if you feel fine",
      "Just one halfway",
      "About 15 min every 2 hours"
     ],
     "explication": "Fatigue comes without warning: a regular break is a matter of safety."
    },
    {
     "q": "A road is announced as closed. The right reflex?",
     "options": [
      "Having planned a backup route",
      "Forcing your way through",
      "Improvising on the spot"
     ],
     "explication": "A prepared plan B saves you from searching for your exit in a panic."
    }
   ]
  },
  "ar": {
   "titre": "خطّط لرحلتك قبل أن تدير المفتاح",
   "competence": "مستقل",
   "pourquoi": "الرحلة المُخطّطة تعني عقلاً متفرّغاً للطريق. يقول المدرّبون هذا لمن يخافون القيادة بمفردهم: إذا حدّدت علاماتك المرجعية وعرفت أنّ لديك نظام تحديد مواقع احتياطياً وأنّه يمكنك دائماً التوقّف، فستدرك أنّ لديك في الواقع الكثير من الحلول في متناول يدك. لن تبحث عن مخرجك في حالة ذعر في اللحظة الأخيرة.",
   "erreur": "الانطلاق «حسب الإحساس» وبرمجة نظام تحديد المواقع بعد أن تكون قد بدأت الحركة. ترفع عينيك عن الطريق في أسوأ لحظة، وتكتشف الصعوبات في أثناء السرعة الكاملة.",
   "bva": "",
   "methode": [
    "انظر إلى مسارك كاملاً على نظام تحديد المواقع، وليس فقط نقطة الانطلاق والوصول.",
    "حدّد نقطتين أو ثلاث علامات مرجعية بصرية على طول المسار: «بعد مطعم ماكدونالدز أنعطف»، «المحطة الكبيرة، هناك أخرج». هذا يطمئنك إذا تعطّل نظام تحديد المواقع.",
    "خطّط لمسار احتياطي في حال كان أحد الطرق مقطوعاً أو مزدحماً.",
    "تحقّق من الظروف: الطقس، حركة المرور المباشرة، الأشغال المُعلن عنها.",
    "حدّد مسبقاً المناطق الصعبة: التقاطعات الكبيرة، محطات الرسوم، مداخل المدن، المخارج المتقاربة.",
    "خطّط لاستراحاتك إذا كان المسار طويلاً: استراحة نحو 15 دقيقة كل ساعتين.",
    "اضبط كلّ شيء قبل الانطلاق: نظام تحديد المواقع مبرمَج، الهاتف مثبَّت، المقعد والمرايا جاهزة."
   ],
   "quiz": [
    {
     "q": "قبل رحلة طويلة غير معروفة، ماذا تفعل؟",
     "options": [
      "تنطلق حسب الإحساس، وسترى",
      "تنظر إلى المسار كاملاً وتحدّد نقطتين أو ثلاث علامات",
      "تبرمج نظام تحديد المواقع أثناء القيادة"
     ],
     "explication": "ما تُحضّره في أثناء التوقّف يحرّر انتباهك للطريق."
    },
    {
     "q": "متى تضبط نظام تحديد المواقع؟",
     "options": [
      "والسيارة متوقّفة، قبل الانطلاق",
      "عند أول إشارة حمراء",
      "بمجرّد أن تبدأ القيادة"
     ],
     "explication": "ثانيتان بعينين منخفضتين عند سرعة 90 كم/س تعني 50 متراً تُقطع دون رؤية."
    },
    {
     "q": "4 ساعات على الطريق. استراحاتك؟",
     "options": [
      "لا شيء إذا شعرت أنّك بخير",
      "واحدة فقط في منتصف الطريق",
      "نحو 15 دقيقة كل ساعتين"
     ],
     "explication": "التعب يأتي دون سابق إنذار: الاستراحة المنتظمة أمان."
    },
    {
     "q": "أُعلن أنّ طريقاً مقطوع. ما ردّ الفعل الصحيح؟",
     "options": [
      "أن تكون قد خطّطت لمسار احتياطي",
      "أن تفرض المرور عنوة",
      "أن ترتجل في المكان"
     ],
     "explication": "خطة بديلة مُعدّة مسبقاً تجنّبك البحث عن مخرجك في حالة ذعر."
    }
   ]
  }
 },
 "C4b": {
  "en": {
   "titre": "Follow a route without taking your eyes off the road",
   "competence": "Autonomous",
   "pourquoi": "The GPS is an aid, not a driver. You are the one driving. Your eyes stay outside, on the road and the signs. Reading a sign early gives you time to position yourself without rushing onto your exit.",
   "erreur": "Missing your exit and trying to \"make up for it\": braking sharply, reversing, or forcing your way back into a lane. On a motorway or expressway, you NEVER reverse and you never stop for that.",
   "bva": "",
   "methode": [
    "Program and set your GPS while stopped (audible volume, screen well placed).",
    "Listen to the voice rather than staring at the screen: let the GPS talk to you.",
    "Read direction signs from far away. A tip instructors keep repeating: the LOWER a town's name is on the sign, the CLOSER its exit is. You prepare your exit well in advance.",
    "Anticipate the exit or the lane change: take the information early (interior mirror, exterior mirror, indicator), and move over smoothly. If you have to change several lanes, start as early as possible.",
    "Don't lose your speed when changing lanes: glide into the next lane without braking for no reason.",
    "The road stays more important than the screen. If in doubt between what the GPS says and the reality of the road, you follow the road and the signs."
   ],
   "quiz": [
    {
     "q": "The GPS says left, but the sign says no entry. Which do you follow?",
     "options": [
      "The GPS, it knows the road",
      "The road signs, always",
      "You stop to think it over"
     ],
     "explication": "The GPS may be out of date: what you see on the road always wins."
    },
    {
     "q": "You miss your motorway exit. What do you do?",
     "options": [
      "You brake to pull back in",
      "You reverse a short distance",
      "You keep going to the next exit"
     ],
     "explication": "A missed exit costs 10 minutes, not your life: never reverse on a motorway."
    },
    {
     "q": "Your town is right at the bottom of the motorway sign. What does that mean?",
     "options": [
      "Your exit is the next one",
      "Your exit is still far away",
      "You've gone the wrong way"
     ],
     "explication": "The lower the name, the closer the exit: move to the right early."
    },
    {
     "q": "You have to change several lanes for your exit. When should you do it?",
     "options": [
      "At the last moment, all at once",
      "As early as possible, smoothly",
      "By forcing your way over"
     ],
     "explication": "You take the information early (mirrors, indicator) and glide over without losing speed."
    }
   ]
  },
  "ar": {
   "titre": "اتبع المسار دون أن ترفع عينيك عن الطريق",
   "competence": "مستقل",
   "pourquoi": "نظام تحديد المواقع (GPS) وسيلة مساعدة، وليس سائقًا. أنت من يقود. تبقى عيناك في الخارج، على الطريق وعلى اللافتات. قراءة اللافتة مبكرًا تمنحك الوقت لتضع سيارتك في مكانها دون أن تندفع نحو مخرجك.",
   "erreur": "أن تفوّت مخرجك وتحاول «تدارك الأمر»: بأن تفرمل فجأة، أو ترجع إلى الوراء، أو تنعطف بقوة لتعود إلى المسار. على الطريق السريع أو المسار السريع، لا ترجع إلى الوراء أبدًا ولا تتوقف من أجل ذلك.",
   "bva": "",
   "methode": [
    "برمج نظام تحديد المواقع واضبطه وأنت متوقف (صوت مسموع، شاشة في مكان مناسب).",
    "استمع إلى الصوت بدلًا من التحديق في الشاشة: دع نظام تحديد المواقع يتحدث إليك.",
    "اقرأ لافتات الاتجاهات من بعيد. نصيحة يكررها المدرّبون: كلما كان اسم المدينة أسفل على اللافتة، كان مخرجها أقرب. جهّز مخرجك قبل الوصول بوقت كافٍ.",
    "توقّع المخرج أو تغيير المسار: خذ المعلومة مبكرًا (المرآة الداخلية، المرآة الخارجية، الغمّاز)، ثم انتقل بهدوء. إذا كان عليك تغيير عدة مسارات، فابدأ في أبكر وقت ممكن.",
    "لا تفقد سرعتك عند تغيير المسار: انزلق إلى المسار المجاور دون أن تفرمل بلا داعٍ.",
    "يبقى الطريق أهم من الشاشة. عند الشك بين ما يقوله نظام تحديد المواقع وواقع الطريق، اتبع الطريق واللافتات."
   ],
   "quiz": [
    {
     "q": "نظام تحديد المواقع يقول انعطف يسارًا، لكن اللافتة تشير إلى ممنوع الدخول. ماذا تتبع؟",
     "options": [
      "نظام تحديد المواقع، فهو يعرف الطريق",
      "اللافتات دائمًا",
      "تتوقف لتفكر"
     ],
     "explication": "قد يكون نظام تحديد المواقع قديمًا: ما تراه على الطريق يفوز دائمًا."
    },
    {
     "q": "فاتك مخرج الطريق السريع. ماذا تفعل؟",
     "options": [
      "تفرمل لتعود إلى المسار",
      "ترجع مسافة قصيرة إلى الوراء",
      "تتابع حتى المخرج التالي"
     ],
     "explication": "المخرج الفائت يكلّفك 10 دقائق، لا حياتك: لا رجوع إلى الوراء أبدًا على الطريق السريع."
    },
    {
     "q": "مدينتك مكتوبة في أسفل لافتة الطريق السريع تمامًا. ماذا يعني ذلك؟",
     "options": [
      "مخرجك هو التالي",
      "مخرجك ما زال بعيدًا",
      "لقد أخطأت الاتجاه"
     ],
     "explication": "كلما كان الاسم أسفل، كان المخرج أقرب: انتقل إلى اليمين مبكرًا."
    },
    {
     "q": "عليك تغيير عدة مسارات لأجل مخرجك. متى تبدأ بذلك؟",
     "options": [
      "في آخر لحظة، دفعة واحدة",
      "في أبكر وقت ممكن، بهدوء",
      "بالانعطاف بقوة"
     ],
     "explication": "تأخذ المعلومة مبكرًا (المرايا، الغمّاز) وتنزلق دون أن تفقد السرعة."
    }
   ]
  }
 },
 "C4c": {
  "en": {
   "titre": "Drive smoothly to burn less fuel (eco-driving)",
   "competence": "Independent",
   "pourquoi": "Smooth driving means up to about 20% fuel saved, a car that wears out less, and passengers who aren't jolted around. Bonus: on the test, eco-driving (shifting gears at the right moment, anticipating, not stalling, controlling the brake) is one of the graded skills.",
   "erreur": "\"Unanticipated\" braking: you arrive fast at a light or a roundabout, you haven't eased off the accelerator, and you brake hard at the last second. It's bad for fuel use, bad for your passengers, and unsafe for those behind you. Smoothness beats jerkiness.",
   "bva": "",
   "methode": [
    "Pull away gently: no burst of throttle when you set off.",
    "Shift up early to drive at low revs. Sound cue first: change gear when you feel \"the engine climbing,\" without revving it hard. Rough number guide: around 2000 rpm in a diesel, 2500 rpm in a petrol car. On a nice clear straight, don't hesitate to go up to 5th/6th: it's more economical.",
    "Drive at low revs: an engine turning calmly uses less fuel.",
    "Use engine braking: when you see you're going to slow down (a light, a roundabout, a 70 zone), ease off the accelerator early and let the car slow down on its own. You brake less.",
    "If you have to stop, brake \"progressively decreasing\": a bit harder at the start, then release gently at the end of braking. You stop right on the mark, smoothly, without jolting your passengers — instead of arriving fast and braking hard at the last second.",
    "Keep a steady speed: bursts of accelerator and brake are wasted fuel.",
    "Switch off the engine if you're stopped for a long time (except in traffic, where the car's stop & start handles it)."
   ],
   "quiz": [
    {
     "q": "In eco-driving, do you shift gears early or late?",
     "options": [
      "Late, to have power",
      "Early, to drive at low revs",
      "Always in 2nd in town"
     ],
     "explication": "An engine at low revs uses less fuel, makes less noise and wears out less."
    },
    {
     "q": "A red light 100 m ahead. The most eco-friendly move?",
     "options": [
      "Keep your speed then brake hard",
      "Speed up to get through",
      "Ease off the accelerator early and let it slow down"
     ],
     "explication": "Engine braking avoids wasting the fuel you've just burned."
    },
    {
     "q": "How much fuel does smooth driving save?",
     "options": [
      "A few drops, negligible",
      "Up to about 20%",
      "More than half"
     ],
     "explication": "Smoothness is the number 1 lever of eco-driving, even before the car itself."
    },
    {
     "q": "A nice clear straight. In eco-driving, what do you do?",
     "options": [
      "Shift up into 5th or 6th",
      "Stay in 3rd for acceleration",
      "Accelerate in jerks"
     ],
     "explication": "A high gear at low revs is what uses the least fuel."
    }
   ]
  },
  "ar": {
   "titre": "القيادة بسلاسة لاستهلاك وقود أقل (القيادة الاقتصادية)",
   "competence": "مستقل",
   "pourquoi": "القيادة السلسة تعني توفير ما يصل إلى نحو 20% من الوقود، وسيارة تتآكل أقل، وركابًا لا يتعرّضون للاهتزاز. وميزة إضافية: في الامتحان، تُعدّ القيادة الاقتصادية (تبديل السرعات في الوقت المناسب، والتوقّع، وعدم إطفاء المحرّك، والتحكّم في الفرملة) من المهارات التي تُقيَّم.",
   "erreur": "الفرملة «غير المتوقّعة»: تصل بسرعة إلى إشارة ضوئية أو دوّار، ولم ترفع قدمك عن دواسة الوقود، فتفرمل بقوة في اللحظة الأخيرة. هذا سيّئ للاستهلاك، وسيّئ لركّابك، وغير آمن لمن خلفك. السلاسة تتفوّق على العصبية.",
   "bva": "",
   "methode": [
    "انطلق بلطف: لا تضغط دواسة الوقود بقوة عند الانطلاق.",
    "بدّل إلى سرعة أعلى مبكرًا للقيادة على دورات منخفضة. اعتمد على السمع أولًا: بدّل السرعة حين تشعر بأن «المحرّك يرتفع»، دون أن تجهده. مؤشّر رقمي تقريبي: نحو 2000 دورة/دقيقة في الديزل، و2500 دورة/دقيقة في البنزين. على طريق مستقيم جميل وخالٍ، لا تتردّد في الصعود إلى السرعة الخامسة/السادسة: فهذا أكثر اقتصادًا.",
    "قُد على دورات منخفضة: المحرّك الذي يدور بهدوء يستهلك أقل.",
    "استعمل فرملة المحرّك: عندما ترى أنك ستبطئ (إشارة ضوئية، دوّار، منطقة 70)، ارفع قدمك عن دواسة الوقود مبكرًا واترك السيارة تبطئ من تلقاء نفسها. فتفرمل أقل.",
    "إذا اضطررت إلى التوقّف، افرمل «بشكل تنازلي»: أقوى قليلًا في البداية، ثم أرخِ الدواسة برفق في نهاية الفرملة. تتوقّف عند النقطة المطلوبة تمامًا، بسلاسة، دون هزّ ركّابك — بدلًا من الوصول بسرعة والفرملة بعنف في اللحظة الأخيرة.",
    "حافظ على سرعة ثابتة: ضغطات دواسة الوقود والفرامل المتكرّرة هي وقود مهدور.",
    "أطفئ المحرّك إذا توقّفت لفترة طويلة (إلا في زحمة السير، حيث يتكفّل نظام «التوقّف والتشغيل» في السيارة بذلك)."
   ],
   "quiz": [
    {
     "q": "في القيادة الاقتصادية، هل تبدّل السرعات مبكرًا أم متأخرًا؟",
     "options": [
      "متأخرًا، للحصول على القوة",
      "مبكرًا، للقيادة على دورات منخفضة",
      "دائمًا على السرعة الثانية في المدينة"
     ],
     "explication": "المحرّك على دورات منخفضة يستهلك أقل، ويُصدر ضجيجًا أقل، ويتآكل أقل."
    },
    {
     "q": "إشارة ضوئية حمراء على بُعد 100 م. ما التصرّف الأكثر اقتصادًا؟",
     "options": [
      "الحفاظ على السرعة ثم الفرملة بعنف",
      "التسارع للمرور",
      "رفع القدم عن دواسة الوقود مبكرًا وترك السيارة تبطئ"
     ],
     "explication": "فرملة المحرّك تجنّبك إهدار الوقود الذي احترقته للتوّ."
    },
    {
     "q": "كم من الوقود توفّر القيادة السلسة؟",
     "options": [
      "بضع قطرات، لا يُذكر",
      "ما يصل إلى نحو 20%",
      "أكثر من النصف"
     ],
     "explication": "السلاسة هي العامل رقم 1 في القيادة الاقتصادية، حتى قبل السيارة نفسها."
    },
    {
     "q": "طريق مستقيم جميل وخالٍ. ماذا تفعل في القيادة الاقتصادية؟",
     "options": [
      "تصعد إلى السرعة الخامسة أو السادسة",
      "تبقى على السرعة الثالثة من أجل التسارع",
      "تتسارع بشكل متقطّع"
     ],
     "explication": "السرعة العالية على دورات منخفضة هي ما يستهلك أقل قدر من الوقود."
    }
   ]
  }
 },
 "C4d": {
  "en": {
   "titre": "Anticipate danger and stay calm at the wheel",
   "competence": "Independent",
   "pourquoi": "A driver who anticipates rarely has to brake in an emergency. Seeing far and early means you have time to decide calmly instead of reacting in panic. Instructors say hazard awareness \"can be felt\": that's exactly what the examiner wants to see — a driver who senses the risk and adjusts their speed instead of charging ahead.",
   "erreur": "Staring at the car right in front of you (short gaze) and getting caught out by everything happening further ahead. Or letting anger take over and driving \"to get back at\" another driver.",
   "bva": "",
   "methode": [
    "Look far ahead: your gaze should reach 15-20 seconds ahead, not at the hood.",
    "Scan continuously: mirrors, ahead, sides, ahead. You take in the information before it becomes a problem.",
    "Keep your safe following distance: the 2-second rule with the car in front (4 seconds in the rain).",
    "Imagine the reasonable worst case: a pedestrian who steps out, a door that opens, a car that brakes. You're ready before it happens.",
    "Have \"hazard awareness\": at a blind intersection (hidden by buildings or parked cars), you actively try to see by moving forward slowly, foot ready to brake. You don't tell yourself \"well, I didn't see anything, off I go\".",
    "Breathe and stay composed: if someone stresses you out or tailgates you, don't respond to the aggression. Let them pass."
   ],
   "quiz": [
    {
     "q": "To anticipate hazards, where should your gaze be?",
     "options": [
      "On the hood, right in front",
      "Far ahead, scanning mirrors and sides",
      "Fixed on the car in front"
     ],
     "explication": "The farther you see, the more time you have to decide without panicking."
    },
    {
     "q": "A car is tailgating you and honking. What do you do?",
     "options": [
      "You brake to punish them",
      "You speed up over the limit",
      "You stay calm and let them overtake"
     ],
     "explication": "Responding to aggression creates the risk; staying composed defuses it."
    },
    {
     "q": "A blind intersection, hidden by parked cars. What do you do?",
     "options": [
      "You move forward slowly, foot ready to brake",
      "You go through, having seen nothing",
      "You speed up to get through quickly"
     ],
     "explication": "Hazard awareness means sensing the risk BEFORE you see it."
    },
    {
     "q": "The safe following distance in dry weather is the rule of?",
     "options": [
      "2 seconds (4 in the rain)",
      "A fixed 1 metre",
      "10 seconds always"
     ],
     "explication": "2 s with the car in front, doubled to 4 s when the road is wet."
    }
   ]
  },
  "ar": {
   "titre": "توقّع الخطر وابقَ هادئاً خلف المقود",
   "competence": "مستقل",
   "pourquoi": "السائق الذي يتوقّع نادراً ما يضطر إلى الفرملة الطارئة. النظر بعيداً وباكراً يعني أن لديك وقتاً لاتخاذ القرار بهدوء بدلاً من ردّ الفعل في حالة ذعر. يقول المدرّبون إن الوعي بالخطر \"يُحَسّ\": وهذا بالضبط ما يريد الفاحص رؤيته، سائق يستشعر الخطر ويعدّل سرعته بدلاً من الاندفاع.",
   "erreur": "تثبيت النظر على السيارة التي أمامك مباشرة (نظرة قصيرة) والمفاجأة بكل ما يحدث أبعد. أو الاستسلام للغضب والقيادة \"للردّ\" على سائق آخر.",
   "bva": "",
   "methode": [
    "انظر بعيداً إلى الأمام: يجب أن يصل نظرك إلى مسافة 15-20 ثانية أمامك، لا إلى غطاء المحرّك.",
    "امسح باستمرار: المرايا، الأمام، الجانبان، الأمام. تلتقط المعلومة قبل أن تصبح مشكلة.",
    "حافظ على مسافة الأمان: قاعدة الثانيتين مع السيارة التي أمامك (4 ثوانٍ تحت المطر).",
    "تخيّل أسوأ احتمال معقول: أحد المشاة يظهر فجأة، باب يُفتح، سيارة تفرمل. تكون جاهزاً قبل أن يحدث ذلك.",
    "تحلَّ بـ\"الوعي بالخطر\": عند تقاطع بلا رؤية (محجوب بمبانٍ أو سيارات متوقّفة)، تسعى بنشاط إلى الرؤية بالتقدّم ببطء والقدم مستعدة للفرملة. لا تقل لنفسك \"حسناً، لم أرَ شيئاً، سأمرّ\".",
    "تنفّس وابقَ متّزناً: إذا سبّب لك أحدهم توتراً أو لاصق سيارتك من الخلف، لا تردّ على العدوانية. دعه يمرّ."
   ],
   "quiz": [
    {
     "q": "لتوقّع الأخطار، أين يجب أن يكون نظرك؟",
     "options": [
      "على غطاء المحرّك، أمامك مباشرة",
      "بعيداً إلى الأمام، مع مسح المرايا والجانبين",
      "مثبّتاً على السيارة التي أمامك"
     ],
     "explication": "كلّما رأيت أبعد، كان لديك وقت أكثر لاتخاذ القرار دون ذعر."
    },
    {
     "q": "سيارة تلاصقك من الخلف وتُبوّق. ماذا تفعل؟",
     "options": [
      "تفرمل لمعاقبتها",
      "تسرّع فوق الحدّ المسموح",
      "تبقى هادئاً وتدعها تتجاوز"
     ],
     "explication": "الردّ على العدوانية يخلق الخطر؛ البقاء متّزناً ينزع فتيله."
    },
    {
     "q": "تقاطع بلا رؤية، محجوب بسيارات متوقّفة. ماذا تفعل؟",
     "options": [
      "تتقدّم ببطء، والقدم مستعدة للفرملة",
      "تمرّ دون أن ترى شيئاً",
      "تسرّع لتمرّ بسرعة"
     ],
     "explication": "الوعي بالخطر هو استشعار الخطر قبل أن تراه."
    },
    {
     "q": "مسافة الأمان في الطقس الجاف هي قاعدة كم؟",
     "options": [
      "ثانيتان (4 تحت المطر)",
      "متر واحد ثابت",
      "10 ثوانٍ دائماً"
     ],
     "explication": "ثانيتان مع السيارة التي أمامك، تُضاعَف إلى 4 ثوانٍ عندما تكون الطريق مبتلّة."
    }
   ]
  }
 },
 "C4e": {
  "en": {
   "titre": "Sharing the road with the most vulnerable",
   "competence": "Autonome",
   "pourquoi": "The more vulnerable the road user, the more an error costs them. You anticipate THEIR mistakes, because you are the one with the metal body around you. On the test, letting a pedestrian with right of way cross isn't even 'courtesy': it's an obligation. Failing to do it is an automatic fail.",
   "erreur": "Overtaking a cyclist 'right up close' without changing your line, or pulling away sharply at a crosswalk the moment the light turns green without checking that no one is left. Watch out for the opposite too: stopping to 'let through' someone who does NOT have right of way (your light is green, theirs is red) is an unjustified and dangerous stop — so it's a fault.",
   "bva": "",
   "methode": [
    "Spot vulnerable road users early: pedestrians, cyclists, scooters, motorcycles.",
    "To overtake a cyclist, leave a gap: 1 m in town, 1.5 m outside built-up areas. If you can't, you wait.",
    "Slow down and anticipate in 30 km/h zones, near schools and bus stops. The pedestrian has priority.",
    "A pedestrian waiting to cross already has priority: you don't wait until they've set a foot on the road. If they're at a crosswalk and want to cross, you let them go.",
    "Check your blind spots before every maneuver: a bike or a scooter hides in them quickly.",
    "Stay courteous: a glance, a wave of the hand, you give way without forcing it. Speed comes after safety."
   ],
   "quiz": [
    {
     "q": "You're overtaking a cyclist in town. What gap?",
     "options": [
      "At least 1 meter",
      "Right up close, it fits",
      "30 centimeters"
     ],
     "explication": "1 m in town, 1.5 m outside built-up areas: the margin in case they swerve suddenly."
    },
    {
     "q": "A pedestrian is waiting at the edge of a crosswalk. What do you do?",
     "options": [
      "You go through as long as they haven't stepped onto it",
      "You stop, they already have priority",
      "You honk so they wait"
     ],
     "explication": "Driving past a pedestrian who wants to cross, on test day, is an automatic fail."
    },
    {
     "q": "Road too narrow to leave 1 m for the cyclist. What do you do?",
     "options": [
      "You overtake tight anyway",
      "You honk so they move over",
      "You wait behind until you can overtake"
     ],
     "explication": "Overtaking tight out of impatience is the most common bicycle accident."
    },
    {
     "q": "Your light is green, the pedestrian's is red. Do you stop to let them through?",
     "options": [
      "No, that's an unjustified and dangerous stop",
      "Yes, out of politeness",
      "You honk and go through"
     ],
     "explication": "Stopping for someone who does NOT have priority is a fault: you follow your right of way."
    }
   ]
  },
  "ar": {
   "titre": "مشاركة الطريق مع مستخدميه الأكثر هشاشة",
   "competence": "مستقل",
   "pourquoi": "كلما كان مستخدم الطريق أكثر هشاشة، كلّفه الخطأ ثمناً أغلى. أنت تتوقّع أخطاءه هو، لأنك أنت من يحيط به هيكل معدني. في الامتحان، ترك الراجل صاحب الأولوية يعبر ليس مجرّد «لباقة»: إنه واجب. عدم القيام به يعني الرسوب المباشر.",
   "erreur": "تجاوز راكب الدراجة «بمحاذاته» دون تغيير مسارك، أو الانطلاق بحدّة عند ممرّ المشاة بمجرّد أن يصير الضوء أخضر دون التأكّد من أنه لم يبقَ أحد. انتبه للعكس أيضاً: التوقّف من أجل «إفساح المجال» لشخص ليست له الأولوية (ضوؤك أخضر وضوؤه أحمر) هو توقّف غير مبرّر وخطير — أي أنه خطأ.",
   "bva": "",
   "methode": [
    "تعرّف مبكّراً على مستخدمي الطريق الهشّين: المشاة، راكبو الدراجات، الدرّاجات الكهربائية، ذوو العجلتين.",
    "لتجاوز راكب دراجة، اترك مسافة: متر واحد داخل المدينة، ومتر ونصف خارج المناطق العمرانية. إن لم تستطع، فانتظر.",
    "خفّف سرعتك وتوقّع في المناطق المحدّدة بـ30 كم/س، قرب المدارس ومحطّات الحافلات. للراجل الأولوية.",
    "الراجل الذي ينتظر ليعبر تكون له الأولوية سلفاً: لا تنتظر أن يضع قدمه على الطريق. إن كان أمام ممرّ مشاة ويريد العبور، فدعه يمرّ.",
    "راقب نقاطك العمياء قبل كل مناورة: تختبئ فيها بسرعة دراجة أو درّاجة كهربائية.",
    "ابقَ لبقاً: نظرة، إشارة باليد، تُفسح المجال دون إكراه. السرعة تأتي بعد السلامة."
   ],
   "quiz": [
    {
     "q": "تتجاوز راكب دراجة داخل المدينة. ما المسافة؟",
     "options": [
      "متر واحد على الأقل",
      "بمحاذاته، يكفي المكان",
      "30 سنتيمتراً"
     ],
     "explication": "متر واحد داخل المدينة، ومتر ونصف خارج المناطق العمرانية: الهامش في حال انحرف فجأة."
    },
    {
     "q": "راجل ينتظر عند حافة ممرّ مشاة. ماذا تفعل؟",
     "options": [
      "تمرّ ما دام لم يضع قدمه عليه",
      "تتوقّف، فله الأولوية سلفاً",
      "تُطلق البوق كي ينتظر"
     ],
     "explication": "المرور أمام راجل يريد العبور، يوم الامتحان، يعني الرسوب المباشر."
    },
    {
     "q": "الطريق ضيّق جداً بحيث لا يمكن ترك متر لراكب الدراجة. ماذا تفعل؟",
     "options": [
      "تتجاوزه بضيق رغم ذلك",
      "تُطلق البوق كي ينزوي جانباً",
      "تنتظر خلفه حتى تتمكّن من التجاوز"
     ],
     "explication": "التجاوز الضيّق بدافع نفاد الصبر هو أكثر حوادث الدراجات شيوعاً."
    },
    {
     "q": "ضوؤك أخضر وضوء الراجل أحمر. هل تتوقّف لتدعه يمرّ؟",
     "options": [
      "لا، فذلك توقّف غير مبرّر وخطير",
      "نعم، من باب التأدّب",
      "تُطلق البوق وتمرّ"
     ],
     "explication": "التوقّف لمن ليست له الأولوية خطأ: اتبع أولويتك أنت."
    }
   ]
  }
 },
 "C4f": {
  "en": {
   "titre": "Approaching the practical exam without panicking",
   "competence": "Independent",
   "pourquoi": "The examiner assesses your safety and your independence, not perfection. They want to see a driver who can manage on their own without putting anyone in danger. Many learners \"stop hearing\" the examiner because they are so stressed, and they give up feeling like losers even though they had it in the bag. Remarks during the exam are often meant kindly, to help your driving mature — and some \"mistakes\" you think are serious are not mistakes to them.",
   "erreur": "Freezing or giving up after a small mistake (\"that's it, I'm done, I'm too stressed\"), when the exam is actually going very well. Or driving in an unusual way (too slow, too tense) to \"look good\", which is exactly what creates errors.",
   "bva": "",
   "methode": [
    "Set up your driving position like in practice: seat (height, distance, backrest, headrest), steering wheel, mirrors, seatbelt. There's no required order for the mirrors. If you readjust your seat, readjust your mirrors afterwards.",
    "Make sure everyone on board is safe: check that everyone is buckled up, that the doors are closed (no warning light), and that there are no red warning lights on the dashboard. This is an easy point.",
    "The checks are 3 free points. The examiner asks you for the last two digits of the odometer, then asks you 3 questions linked to that number: 1 vehicle-check question (interior OR exterior, drawn at random); 1 road-safety question; 1 first-aid question (general, not necessarily related to driving). Each correct answer = 1 point. It is not disqualifying, but don't let them slip away: you can fail your test by just 1 point.",
    "Listen carefully to the examiner's instructions and drive as usual. You can ask them to repeat if you didn't understand.",
    "Drive your own drive, not the examiner's: keep your checks, your indicators, your distances, your speed.",
    "Also listen to their remarks along the way: they are there to help you, not to put you down. You correct and you carry on.",
    "If you make a small mistake, carry on calmly. A minor fault doesn't ruin everything.",
    "Requested manoeuvre: take your time, low speed, look everywhere (direct vision, not only the mirrors). Don't forget the indicator BEFORE stopping for the manoeuvre, not after."
   ],
   "quiz": [
    {
     "q": "The examiner asks for the last two digits of the odometer. Why?",
     "options": [
      "To check your mileage",
      "To draw the number of your 3 questions",
      "To note the date"
     ],
     "explication": "It selects 3 free-point questions: vehicle check, road safety, first aid."
    },
    {
     "q": "You stall when pulling away during the exam. Is it over?",
     "options": [
      "Yes, it's disqualifying",
      "No, you restart calmly",
      "You give up the exam"
     ],
     "explication": "A small mistake doesn't make you fail: the examiner looks at your ability to correct yourself."
    },
    {
     "q": "What do the 3 exam questions cover?",
     "options": [
      "Vehicle check, road safety, first aid",
      "Highway code, road signs, mechanics",
      "Route, weather, GPS"
     ],
     "explication": "Each correct answer is worth 1 point: you can fail the test by just 1 point."
    },
    {
     "q": "A manoeuvre is requested in the exam. The right reflex?",
     "options": [
      "Quickly, to show you've mastered it",
      "Slowly, look everywhere, indicator first",
      "Without an indicator, it's just a manoeuvre"
     ],
     "explication": "You put the indicator on BEFORE stopping for the manoeuvre, not after."
    }
   ]
  },
  "ar": {
   "titre": "مواجهة الامتحان العملي دون ذعر",
   "competence": "مستقل",
   "pourquoi": "يقيّم المُفتّش سلامتك واستقلاليتك، لا الكمال. فهو يريد أن يرى سائقًا يتدبّر أموره بنفسه دون أن يعرّض أحدًا للخطر. كثير من المتعلّمين \"لا يعودون يسمعون\" المُفتّش لشدّة توترهم، فيستسلمون وهم يشعرون بالخسارة رغم أنهم كانوا ناجحين. الملاحظات أثناء الامتحان غالبًا ما تكون بدافع اللطف لمساعدة قيادتك على النضج — وبعض \"الأخطاء\" التي تظنّها خطيرة ليست أخطاءً في نظره.",
   "erreur": "التجمّد أو الاستسلام بعد خطأ صغير (\"انتهى الأمر، أنا متوتّر جدًا\")، بينما الامتحان يسير على ما يرام. أو القيادة بطريقة غير معتادة (بطيء جدًا، متشنّج جدًا) من أجل \"إظهار الإتقان\"، وهو ما يخلق الأخطاء بالضبط.",
   "bva": "",
   "methode": [
    "اضبط مقعد قيادتك كما في التدريب: المقعد (الارتفاع، البُعد، مسند الظهر، مسند الرأس)، المِقود، المرايا، حزام الأمان. لا يوجد ترتيب إلزامي للمرايا. إذا أعدت ضبط مقعدك، فأعِد ضبط مراياك بعده.",
    "تأكّد من السلامة داخل السيارة: تحقّق من أن الجميع يضعون أحزمة الأمان، وأن الأبواب مغلقة (لا ضوء تحذيري)، وأنه لا يوجد ضوء تحذيري أحمر على لوحة القيادة. هذه نقطة سهلة.",
    "الفحوصات هي 3 نقاط مجانية. يطلب منك المُفتّش الرقمين الأخيرين من عدّاد المسافة، ثم يطرح عليك 3 أسئلة مرتبطة بهذا الرقم: سؤال فحص واحد (داخلي أو خارجي يُسحب عشوائيًا)؛ وسؤال واحد في السلامة المرورية؛ وسؤال واحد في الإسعافات الأولية (عام، وليس بالضرورة مرتبطًا بالقيادة). كل إجابة صحيحة = نقطة واحدة. ليست سببًا للرسوب، لكن لا تدعها تفلت: يمكن أن ترسب في امتحانك بفارق نقطة واحدة.",
    "أنصت جيّدًا إلى تعليمات المُفتّش وقُد كالمعتاد. يمكنك أن تطلب منه التكرار إن لم تفهم.",
    "قُد قيادتك أنت، لا قيادة المُفتّش: حافظ على مراقباتك، وإشاراتك الضوئية، ومسافاتك، وسرعتك.",
    "أنصت أيضًا إلى ملاحظاته أثناء الطريق: فهي موجودة لمساعدتك، لا لإحباطك. تُصحّح وتُتابع.",
    "إذا ارتكبت خطأً صغيرًا، فتابع بهدوء. خطأ بسيط لا يُفسد كل شيء.",
    "المناورة المطلوبة: خُذ وقتك، سرعة بطيئة، انظر في كل مكان (رؤية مباشرة، وليس المرايا فقط). لا تنسَ الإشارة الضوئية قبل التوقّف للمناورة، لا بعده."
   ],
   "quiz": [
    {
     "q": "يطلب المُفتّش الرقمين الأخيرين من عدّاد المسافة. لماذا؟",
     "options": [
      "للتحقّق من عدد الكيلومترات",
      "لسحب رقم أسئلتك الثلاثة",
      "لتسجيل التاريخ"
     ],
     "explication": "إنه يحدّد 3 أسئلة بنقاط مجانية: فحص، سلامة مرورية، إسعافات أولية."
    },
    {
     "q": "توقّف محرّكك عند الانطلاق أثناء الامتحان. هل انتهى الأمر؟",
     "options": [
      "نعم، إنه سبب للرسوب",
      "لا، تُعيد التشغيل بهدوء",
      "تنسحب من الامتحان"
     ],
     "explication": "خطأ صغير لا يُرسبك: ينظر المُفتّش إلى قدرتك على تصحيح نفسك."
    },
    {
     "q": "عن ماذا تدور أسئلة الامتحان الثلاثة؟",
     "options": [
      "فحص، سلامة مرورية، إسعافات أولية",
      "قانون السير، إشارات المرور، الميكانيكا",
      "المسار، الطقس، نظام تحديد المواقع"
     ],
     "explication": "كل إجابة صحيحة تساوي نقطة واحدة: يمكن أن ترسب في الامتحان بفارق نقطة واحدة."
    },
    {
     "q": "طُلبت منك مناورة في الامتحان. ما هو ردّ الفعل الصحيح؟",
     "options": [
      "بسرعة، لإظهار أنك متقن",
      "ببطء، انظر في كل مكان، الإشارة أولًا",
      "دون إشارة، إنها مجرد مناورة"
     ],
     "explication": "تُشغّل الإشارة الضوئية قبل التوقّف للمناورة، لا بعده."
    }
   ]
  }
 },
 "C4g": {
  "en": {
   "titre": "Getting off to a good start as a new driver (probationary period)",
   "competence": "Autonomous",
   "pourquoi": "The first years driving alone are the most dangerous: you no longer have the instructor beside you. The \"A\" disc and the reduced speed limits give you a safety margin while experience builds up. Instructors reassure those who are afraid to drive alone: the licence is a right, not an obligation to head into the city centre on a Friday night the day after you pass. You go at your own pace.",
   "erreur": "Feeling \"free\" as soon as you have the licence and dropping the good habits (speed, phone, following distances). A single serious offence can cost you your brand-new licence.",
   "bva": "",
   "methode": [
    "Stick your \"A\" disc on the back: for 3 years on the standard track, 2 years if you did accompanied driving (AAC).",
    "Respect the reduced new-driver speed limits: 110 km/h on the motorway, 100 km/h on expressways (dual carriageways), 80 km/h on roads outside built-up areas.",
    "Zero alcohol, or almost: 0.2 g/l of blood maximum as a new driver (in practice, you don't drink if you're driving).",
    "Take care of your points balance: you start with 6 points, which rise to 12 if you lose none during the period.",
    "Keep driving sensibly, even after passing. The licence lets you drive, it doesn't force you to rush: if you're not comfortable, make short, easy trips at first, plan your routes, and keep the good reflexes from your lessons (anticipation, distances, no phone). The first months alone are the riskiest."
   ],
   "quiz": [
    {
     "q": "Standard licence in hand. Maximum speed on the motorway?",
     "options": [
      "130 km/h like everyone else",
      "110 km/h",
      "90 km/h"
     ],
     "explication": "During the probationary period: 110 on the motorway, 100 on expressways, 80 on roads, for the first three years."
    },
    {
     "q": "How long do you keep the \"A\" disc on the back?",
     "options": [
      "3 years (2 years with accompanied driving)",
      "6 months",
      "For life"
     ],
     "explication": "It warns others that you're a beginner, so they leave you some room."
    },
    {
     "q": "How many points do you start your probationary licence with?",
     "options": [
      "12 points automatically",
      "6 points that rise to 12",
      "0 points at the start"
     ],
     "explication": "6 points at the start: one serious offence can wipe it all out."
    },
    {
     "q": "What is the maximum blood alcohol level for a new driver?",
     "options": [
      "0.5 g/l like everyone else",
      "0.2 g/l (in practice, zero)",
      "No limit"
     ],
     "explication": "0.2 g/l, so in plain terms you don't drink if you're driving."
    }
   ]
  },
  "ar": {
   "titre": "انطلاقة جيدة كسائق جديد (فترة الاختبار)",
   "competence": "مستقل",
   "pourquoi": "السنوات الأولى من القيادة بمفردك هي الأخطر: لم يعد المدرّب بجانبك. قرص الحرف \"A\" وحدود السرعة المخفّضة يمنحانك هامش أمان ريثما تكتسب الخبرة. يطمئن المدرّبون من يخافون القيادة بمفردهم: الرخصة حق وليست إلزاماً بالذهاب إلى وسط المدينة مساء الجمعة في اليوم التالي لنجاحك. تسير وفق وتيرتك الخاصة.",
   "erreur": "الشعور بأنك «تحرّرت» بمجرد الحصول على الرخصة والتخلّي عن العادات الجيدة (السرعة، الهاتف، مسافات الأمان). مخالفة خطيرة واحدة قد تُفقدك رخصتك الجديدة تماماً.",
   "bva": "",
   "methode": [
    "ألصق قرص الحرف \"A\" في الخلف: لمدة 3 سنوات في المسار العادي، وسنتين إن اتّبعت القيادة المرافَقة (AAC).",
    "احترم حدود السرعة المخفّضة للسائق الجديد: 110 كم/س على الطريق السريع، 100 كم/س على الطرق السريعة (ذات المسارين المنفصلين)، 80 كم/س على الطرق خارج المناطق العمرانية.",
    "لا كحول إطلاقاً، أو ما يقاربه: 0,2 غ/ل من الدم كحدّ أقصى للسائق الجديد (عملياً، لا تشرب إذا كنت ستقود).",
    "اعتنِ برصيد نقاطك: تبدأ بـ 6 نقاط، ترتفع إلى 12 إن لم تفقد أي نقطة خلال الفترة.",
    "استمر في القيادة بذكاء، حتى بعد الحصول على الرخصة. الرخصة تخوّلك القيادة، لكنها لا تُلزمك بالتهوّر: إن لم تكن مرتاحاً، قم برحلات قصيرة وهادئة في البداية، وحضّر مساراتك، وحافظ على ردود الفعل الجيدة التي تعلّمتها في الدروس (الاستباق، المسافات، لا هاتف). الأشهر الأولى بمفردك هي الأكثر خطورة."
   ],
   "quiz": [
    {
     "q": "الرخصة العادية بحوزتك. ما هي السرعة القصوى على الطريق السريع؟",
     "options": [
      "130 كم/س مثل الجميع",
      "110 كم/س",
      "90 كم/س"
     ],
     "explication": "خلال فترة الاختبار: 110 على الطريق السريع، 100 على الطرق السريعة، 80 على الطرق، خلال السنوات الثلاث الأولى."
    },
    {
     "q": "كم من الوقت تحتفظ بقرص الحرف \"A\" في الخلف؟",
     "options": [
      "3 سنوات (سنتان مع القيادة المرافَقة)",
      "6 أشهر",
      "مدى الحياة"
     ],
     "explication": "ينبّه الآخرين إلى أنك مبتدئ، كي يتركوا لك بعض الهامش."
    },
    {
     "q": "بكم نقطة تبدأ رخصتك الاختبارية؟",
     "options": [
      "12 نقطة تلقائياً",
      "6 نقاط ترتفع إلى 12",
      "0 نقطة في البداية"
     ],
     "explication": "6 نقاط في البداية: مخالفة خطيرة واحدة قد تُفقدك كل شيء."
    },
    {
     "q": "ما هو الحدّ الأقصى لنسبة الكحول في الدم للسائق الجديد؟",
     "options": [
      "0,5 غ/ل مثل الآخرين",
      "0,2 غ/ل (عملياً، صفر)",
      "لا حدّ"
     ],
     "explication": "0,2 غ/ل، أي بوضوح لا تشرب إذا كنت ستقود."
    }
   ]
  }
 }
};

// Traduction d'une fiche pour la langue courante (null en fr ou si absente).
export function ficheTr(code, lang = getLang()) {
  if (lang === "fr") return null;
  return (FICHE_I18N[code] && FICHE_I18N[code][lang]) || null;
}

// Chaîne d'UI (chrome) traduite ; repli sur le français fourni.
export function uiFiche(lang, key, fr) {
  if (lang === "fr") return fr;
  const v = FICHE_UI[lang] && FICHE_UI[lang][key];
  return v != null ? v : fr;
}
