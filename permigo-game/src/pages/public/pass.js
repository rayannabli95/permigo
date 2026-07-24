// ═══════════════════════════════════════════════════════════════
// Page publique — Pré-vente « Pass Permis » (payeur = ÉLÈVE)
// URL : #/pass  (partageable en DM : www.permigo.fr/#/pass?lang=en)
//
// DA « Ticket d'Or » — v3 (retours Rayan après SON vrai paiement, 15/07 soir) :
//  - logo = le P vert gloss (/icon-192.png), plus de wordmark illisible
//  - « Offre de lancement* », tarif exceptionnel, prix barré partout,
//    chips d'économie jaunes façon Ornikar (−17 % / −33 %)
//  - PLUS de compteur de places ni de billet numéroté (retiré à sa demande)
//  - garantie repensée : « satisfait ou remboursé — 3 jours d'essai »,
//    puis annulation à tout moment (fini le « remboursé sans question »
//    exploitable) ; questionnaire de départ → #/avis-depart
//  - titre section : « Préparer le permis, c'est bien plus que conduire. »
//  - centres d'examen montrés avec une vraie capture (fiche Cergy)
//  - chiffres sourcés : 74,7 % vs 56,8 % (bilan examens 2022, Sécurité routière)
//  - succès post-paiement : « Bienvenue dans l'aventure », installation de
//    l'app expliquée (rappels/notifs), aide pas à pas, retour à l'accueil
//  - bloc non-francophones VISIBLE UNIQUEMENT en anglais (l'app est en
//    français simple — on le dit honnêtement, jamais de fausse promesse)
//
// BILINGUE FR/EN (bouton + ?lang= + langue du navigateur). 100 % mobile.
// Retour Checkout : #/pass?checkout=success&plan=xxx | #/pass?checkout=cancel
// ═══════════════════════════════════════════════════════════════
import { track } from "@/services/analytics.js";
import { startPassCheckout } from "@/services/billing.js";
import { getCurUser } from "@/auth/cur-user.js";
import { illMask } from "@/utils/illustrations.js";

const LOGO = "/p-badge.png";

// ── Textes FR / EN ─────────────────────────────────────────────
const STR = {
  fr: {
    login: "Se connecter",
    langBtn: "EN",
    kicker: "Offre de lancement*",
    // Phrase-mission (décision Rayan 17/07) : LE but de l'app en une phrase,
    // en gros. « Réserve ta place » vit déjà dans le CTA, « 90 jours » sur le
    // billet — rien ne se perd.
    h1: `Prépare ta leçon <br><em>avant de monter en voiture.</em>`,
    lead: `La seule app qui bosse ta <strong>conduite</strong> entre les leçons — pas une énième app de code.`,
    tTitle: `OBJECTIF PERMIS<br>EN 90 JOURS`,
    tSub: "Conduite · mini-jeux · simulations d'examen",
    tBoardLbl: "Embarquement",
    tBoard: "JUIL. 2026",
    tDureeLbl: "Accès",
    tDuree: "3 MOIS",
    tOffre: "Tarif exceptionnel",
    tStrike: "29,97 €",
    tPrice: "24,99 €",
    cta: `Réserver ma place · <s>29,97 €</s> 24,99 €`,
    ctaNote: `Paiement sécurisé Stripe · <b>Satisfait ou remboursé — 3 jours</b><br><small>*Prix de lancement : il remontera après cette promo.</small>`,
    bulle: "3 compétences validées !",
    bulleSub: "cette semaine",
    secCode: `Préparer le permis, c'est <em>bien plus</em> que conduire.`,
    secCodeSub: "PermiGo t'entraîne sur tout ce qui compte le jour J :",
    situTitle: "Mini-jeux « En situation »",
    situTxt:
      "Une scène, une décision : qui passe en premier ? Priorités, distances, insertions — comme au volant.",
    situAlt:
      "Mini-jeu En situation : un croisement, à toi de décider qui passe",
    centreTitle: "Ton centre d'examen décortiqué",
    centreTxt:
      "Difficulté, accès, réputation des examinateurs et pièges du parcours — centre par centre (Cergy, Argenteuil, Bobigny…).",
    centreAlt:
      "Fiche du centre d'examen de Cergy : difficulté 3/5, accès, pièges du parcours",
    feats: [
      {
        mask: "cahier",
        t: "Chaque leçon préparée",
        d: "Créneau, autoroute, giratoire : une fiche claire avant de monter en voiture.",
      },
      {
        img: "/skins/badge-medaille.png",
        t: "Simulation d'examen de conduite",
        d: "Notée sur les mêmes critères que l'inspecteur. Le jour J, zéro surprise.",
      },
      {
        img: "/skins/volant-coin.webp",
        t: "Et ça donne envie de revenir",
        d: "Série, ligue, récompenses. Le code est inclus aussi.",
      },
    ],
    mathsRows: [
      ["1 heure de conduite", "55 €"],
      ["Budget permis moyen", "1 800 €"],
      ["PermiGo, par mois", "9,99 €"],
    ],
    mathsNote: "Une leçon mal préparée, c'est 55 € de perdus.",
    mathsSrc: "Sources : UFC-Que Choisir (budget permis) · Sécurité routière",
    secPass: "Trois billets, un objectif",
    secPassSub:
      "Le même contenu partout. Plus tu vois loin, moins tu paies : 3 mois au mensuel = 29,97 €.",
    passes: {
      mensuel: {
        name: "Billet Mensuel",
        desc: "Ton exam est le mois prochain ? Parfait. Annulable en un clic.",
        price: "9,99 €",
        per: "/mois",
        btn: "Commencer",
      },
      pass3: {
        tag: "Le plus choisi",
        name: "Billet Or · 3 mois",
        desc: "2 à 4 mois : le vrai temps de préparation d'un permis. Payé une fois, prix bloqué.",
        strike: "29,97 €",
        price: "24,99 €",
        eco: "−17 %",
        btn: "Réserver",
      },
      pass6: {
        name: "Billet Platine · 6 mois",
        desc: "Conduite accompagnée ou longue prépa, zéro pression.",
        strike: "59,94 €",
        price: "39,99 €",
        eco: "−33 %",
        btn: "Réserver",
      },
    },
    err: "Le paiement n'a pas pu démarrer. Réessaie.",
    btnWait: "Ouverture du paiement…",
    stampTag: "Garanti",
    stampT: "Satisfait ou remboursé — 3 jours d'essai",
    stampD:
      "Teste tout pendant 3 jours. Pas convaincu ? Remboursé. Ensuite, le mensuel s'annule à tout moment, en un clic.",
    secProof: "S'entraîner régulièrement, ça paie",
    proofA: "Conduite accompagnée (entraînement régulier)",
    proofAVal: "74,7 %",
    proofAW: 74.7,
    proofB: "Filière classique",
    proofBVal: "56,8 %",
    proofBW: 56.8,
    proofSrc:
      "Bilan des examens du permis de conduire 2022 — Sécurité routière.",
    secFaq: "Questions fréquentes",
    faq: [
      [
        "C'est une app de code ?",
        "Non. Le code est inclus (quiz, examens blancs), mais la vraie différence : on t'entraîne à la <strong>conduite</strong> — mini-jeux, fiches de leçon, simulations d'examen, centres d'examen.",
      ],
      [
        "Qu'attend l'inspecteur le jour de l'examen ?",
        "Une conduite <strong>autonome, responsable et sûre</strong> : connaître le code, maîtriser le véhicule, respecter les règles, anticiper les risques et adapter ta conduite à ce qui t'entoure. Ton attitude compte aussi : rester calme, confiant, décider au bon moment. PermiGo t'entraîne exactement là-dessus — simulation d'examen incluse.",
      ],
      [
        "Ça marche avec mon auto-école ?",
        "Oui. Tu gardes tes leçons — PermiGo bosse entre. Si ton moniteur l'utilise, ta progression se synchronise avec lui.",
      ],
      [
        "Je galère avec le français, ça ira ?",
        "Oui. Phrases courtes, mots simples, mini-jeux visuels — et cette page existe en anglais (bouton EN en haut). Par message, on t'aide pas à pas.",
      ],
      [
        "Je peux annuler ou être remboursé ?",
        `Pendant les 3 premiers jours : <strong>satisfait ou remboursé</strong>. Ensuite, le mensuel s'annule à tout moment en un clic (les billets Or et Platine sont des paiements uniques). Tu pars ? <a href="#/avis-depart">Dis-nous pourquoi ici</a> — ça nous aide à améliorer l'app.`,
      ],
    ],
    foot: `Paiement sécurisé par Stripe · Satisfait ou remboursé — 3 jours<br><a href="#/legal">Mentions légales</a> · Moniteur indépendant ? <a href="#/creer-compte">Crée ton espace</a>`,
    stickyName: "Billet Or · 3 mois",
    stickyPrice: "24,99 € · essai 3 jours",
    stickyBtn: "Réserver ma place",
    cancelNote:
      "Paiement annulé — rien n'a été débité. Ton billet t'attend juste en dessous. 👇",
    successT: "Bienvenue dans l'aventure ! 🚀",
    successIntro: (label) =>
      `${label} réservé. Ton reçu et ta facture arrivent par email.`,
    successSteps: [
      "<b>Crée ton compte maintenant</b> — 2 minutes, avec le même email que ton paiement → accès immédiat.",
      "<b>Installe l'app sur ton téléphone</b> pour recevoir les rappels de révision : iPhone → Safari → Partager → « Sur l'écran d'accueil ». Android → Chrome → menu ⋮ → « Installer l'application ».",
      "<b>Besoin d'aide ?</b> Écris-nous : on t'aide pas à pas.",
    ],
    successGuarantee: "Et bien sûr : satisfait ou remboursé pendant 3 jours.",
    successCta: "Ouvrir PermiGo",
    successCtaSolo: "Créer mon compte — accès immédiat",
  },
  en: {
    login: "Log in",
    langBtn: "FR",
    kicker: "Launch offer*",
    h1: `Prepare every lesson <br><em>before you get in the car.</em>`,
    lead: `The only app that trains your <strong>driving</strong> between lessons — not just another code-test app.`,
    tTitle: `LICENCE GOAL:<br>90 DAYS`,
    tSub: "Driving · mini-games · exam simulations",
    tBoardLbl: "Boarding",
    tBoard: "JUL 2026",
    tDureeLbl: "Access",
    tDuree: "3 MONTHS",
    tOffre: "Special price",
    tStrike: "€29.97",
    tPrice: "€24.99",
    cta: `Book my seat · <s>€29.97</s> €24.99`,
    ctaNote: `Secure Stripe checkout · <b>3-day money-back guarantee</b><br><small>*Launch price — it will go up after this promo.</small>`,
    bulle: "3 skills validated!",
    bulleSub: "this week",
    secCode: `Getting your licence takes <em>more</em> than driving.`,
    secCodeSub: "PermiGo trains you on everything that counts on test day:",
    situTitle: "“On the road” mini-games",
    situTxt:
      "One scene, one decision: who goes first? Right of way, distances, merging — like behind the wheel.",
    situAlt: "On-the-road mini-game: a crossroads, you decide who goes first",
    centreTitle: "Your test centre, decoded",
    centreTxt:
      "Difficulty, access, examiner reputation and the known traps of the route — centre by centre.",
    centreAlt: "Cergy test-centre sheet: difficulty 3/5, access, route traps",
    feats: [
      {
        mask: "cahier",
        t: "Every lesson prepped",
        d: "Parking, motorway, roundabouts: a clear sheet before you get in the car.",
      },
      {
        img: "/skins/badge-medaille.png",
        t: "Driving exam simulation",
        d: "Scored on the examiner's own criteria. No surprises on test day.",
      },
      {
        img: "/skins/volant-coin.webp",
        t: "And you'll want to come back",
        d: "Streaks, leagues, rewards. The code test is included too.",
      },
    ],
    nonFranco: {
      title: "New to French? We've got you.",
      txt: "The exam is in French — so the app trains you in short, simple French: the exact words you'll need on test day. Mini-games are visual first. And we answer your messages in English, step by step.",
    },
    mathsRows: [
      ["1 hour of driving lessons", "€55"],
      ["Average licence budget (France)", "€1,800"],
      ["PermiGo, per month", "€9.99"],
    ],
    mathsNote: "One unprepared lesson = €55 wasted.",
    mathsSrc: "Sources: UFC-Que Choisir (licence budget) · Sécurité routière",
    secPass: "Three tickets, one goal",
    secPassSub:
      "Same content everywhere. The longer you commit, the less you pay: 3 months on monthly = €29.97.",
    passes: {
      mensuel: {
        name: "Monthly Ticket",
        desc: "Exam next month? Perfect. Cancel in one click.",
        price: "€9.99",
        per: "/mo",
        btn: "Start",
      },
      pass3: {
        tag: "Most popular",
        name: "Gold Ticket · 3 months",
        desc: "2–4 months is what a licence really takes. Paid once, price locked.",
        strike: "€29.97",
        price: "€24.99",
        eco: "−17%",
        btn: "Book",
      },
      pass6: {
        name: "Platinum · 6 months",
        desc: "Accompanied driving or a longer prep, zero pressure.",
        strike: "€59.94",
        price: "€39.99",
        eco: "−33%",
        btn: "Book",
      },
    },
    err: "Payment couldn't start. Please try again.",
    btnWait: "Opening checkout…",
    stampTag: "Guaranteed",
    stampT: "3-day money-back guarantee",
    stampD:
      "Try everything for 3 days. Not convinced? Refunded. After that, the monthly plan cancels anytime, in one click.",
    secProof: "Regular practice pays off",
    proofA: "Accompanied driving (regular practice)",
    proofAVal: "74.7%",
    proofAW: 74.7,
    proofB: "Standard route",
    proofBVal: "56.8%",
    proofBW: 56.8,
    proofSrc: "French driving-test results 2022 — Sécurité routière.",
    secFaq: "Frequently asked",
    faq: [
      [
        "Is this a code-test app?",
        "No. The code test is included (quizzes, mock tests), but the real difference: we train your <strong>driving</strong> — mini-games, lesson sheets, exam simulations, test-centre guides.",
      ],
      [
        "Is the app in English?",
        "This page and our support are. The app itself is in <strong>simple French</strong> — on purpose: your exam will be in French, and training in the exact words you'll hear on test day is what gets you through. Mini-games are visual first, so basic French is enough.",
      ],
      [
        "What does the examiner expect on test day?",
        "<strong>Autonomous, responsible, safe driving</strong>: knowing the code, controlling the car, following the rules, anticipating risks and adapting to your environment. Attitude counts too: stay calm, confident, decide at the right moment. That's exactly what PermiGo trains — exam simulation included.",
      ],
      [
        "Does it work with my driving school?",
        "Yes. Keep your lessons — PermiGo works in between. If your instructor uses PermiGo, your progress syncs with them.",
      ],
      [
        "Can I cancel or get a refund?",
        `First 3 days: <strong>money-back guarantee</strong>. After that, the monthly plan cancels anytime in one click (Gold and Platinum are one-time payments). Leaving? <a href="#/avis-depart">Tell us why here</a> — it helps us improve.`,
      ],
    ],
    foot: `Secure payment by Stripe · 3-day money-back guarantee<br><a href="#/legal">Legal notice</a> · Driving instructor? <a href="#/creer-compte">Create your space</a>`,
    stickyName: "Gold Ticket · 3 months",
    stickyPrice: "€24.99 · 3-day trial",
    stickyBtn: "Book my seat",
    cancelNote:
      "Payment cancelled — nothing was charged. Your ticket is waiting below. 👇",
    successT: "Welcome aboard! 🚀",
    successIntro: (label) =>
      `${label} booked. Your receipt and invoice are on their way by email.`,
    successSteps: [
      "<b>Create your account now</b> — 2 minutes, with the same email as your payment → instant access.",
      "<b>Install the app on your phone</b> to get revision reminders: iPhone → Safari → Share → “Add to Home Screen”. Android → Chrome → ⋮ menu → “Install app”.",
      "<b>Need help?</b> Message us — we'll walk you through it, step by step.",
    ],
    successGuarantee: "And of course: 3-day money-back guarantee.",
    successCta: "Open PermiGo",
    successCtaSolo: "Create my account — instant access",
  },
  ar: {
    login: "تسجيل الدخول",
    langBtn: "FR",
    kicker: "عرض الإطلاق*",
    h1: `حضِّر كل درس <br><em>قبل أن تركب السيارة.</em>`,
    lead: `التطبيق الوحيد الذي يدرّبك على <strong>القيادة</strong> بين الدروس — وليس مجرّد تطبيق آخر لاختبار الكود.`,
    tTitle: `الهدف: رخصة القيادة<br>في 90 يوماً`,
    tSub: "قيادة · ألعاب مصغّرة · محاكاة الامتحان",
    tBoardLbl: "الصعود",
    tBoard: "يوليو 2026",
    tDureeLbl: "المدة",
    tDuree: "3 أشهر",
    tOffre: "سعر استثنائي",
    tStrike: "€29.97",
    tPrice: "€24.99",
    cta: `احجز مقعدي · <s>€29.97</s> €24.99`,
    ctaNote: `دفع آمن عبر Stripe · <b>مضمون أو استرداد أموالك — 3 أيام</b><br><small>*سعر الإطلاق — سيرتفع بعد انتهاء هذا العرض.</small>`,
    bulle: "تم التحقق من 3 مهارات!",
    bulleSub: "هذا الأسبوع",
    secCode: `الحصول على الرخصة يتطلّب <em>أكثر</em> من مجرّد القيادة.`,
    secCodeSub: "يدرّبك PermiGo على كل ما يهمّ يوم الامتحان:",
    situTitle: "ألعاب «على الطريق» المصغّرة",
    situTxt:
      "مشهد واحد، قرار واحد: من يمرّ أولاً؟ أولوية المرور، المسافات، الاندماج — كما خلف المقود.",
    situAlt:
      "لعبة مصغّرة على الطريق: مفترق طرق، أنت تقرّر من يمرّ أولاً",
    centreTitle: "مركز امتحانك، مفصّلاً",
    centreTxt:
      "الصعوبة، الوصول، سمعة الممتحنين والفخاخ المعروفة في المسار — مركزاً تلو الآخر.",
    centreAlt: "بطاقة مركز امتحان Cergy: الصعوبة 3/5، الوصول، فخاخ المسار",
    feats: [
      {
        mask: "cahier",
        t: "كل درس مُحضَّر مسبقاً",
        d: "الركن، الطريق السريع، الدوّارات: بطاقة واضحة قبل أن تركب السيارة.",
      },
      {
        img: "/skins/badge-medaille.png",
        t: "محاكاة امتحان القيادة",
        d: "تُقيَّم بنفس معايير الممتحن. يوم الامتحان، لا مفاجآت.",
      },
      {
        img: "/skins/volant-coin.webp",
        t: "وستشعر برغبة في العودة",
        d: "سلاسل أيام، دوريات، مكافآت. واختبار الكود مُضمَّن أيضاً.",
      },
    ],
    nonFranco: {
      title: "لغتك الفرنسية ضعيفة؟ نحن معك.",
      txt: "الامتحان بالفرنسية — لذلك يدرّبك التطبيق بفرنسية قصيرة وبسيطة: الكلمات نفسها التي ستحتاجها يوم الامتحان. الألعاب المصغّرة بصرية أولاً. ونجيب على رسائلك، خطوة بخطوة.",
    },
    mathsRows: [
      ["ساعة قيادة واحدة", "€55"],
      ["متوسط ميزانية الرخصة (فرنسا)", "€1,800"],
      ["PermiGo، شهرياً", "€9.99"],
    ],
    mathsNote: "درس غير مُحضَّر = €55 ضائعة.",
    mathsSrc: "المصادر: UFC-Que Choisir (ميزانية الرخصة) · Sécurité routière",
    secPass: "ثلاث تذاكر، هدف واحد",
    secPassSub:
      "المحتوى نفسه في كل الباقات. كلما التزمت مدةً أطول، دفعت أقل: 3 أشهر بالاشتراك الشهري = €29.97.",
    passes: {
      mensuel: {
        name: "التذكرة الشهرية",
        desc: "امتحانك الشهر المقبل؟ ممتاز. ألغِ بنقرة واحدة.",
        price: "€9.99",
        per: "/شهر",
        btn: "ابدأ",
      },
      pass3: {
        tag: "الأكثر اختياراً",
        name: "التذكرة الذهبية · 3 أشهر",
        desc: "من 2 إلى 4 أشهر هي المدة الحقيقية للتحضير للرخصة. دفعة واحدة، والسعر ثابت.",
        strike: "€29.97",
        price: "€24.99",
        eco: "−17%",
        btn: "احجز",
      },
      pass6: {
        name: "البلاتينية · 6 أشهر",
        desc: "القيادة المرافَقة أو تحضير أطول، دون أي ضغط.",
        strike: "€59.94",
        price: "€39.99",
        eco: "−33%",
        btn: "احجز",
      },
    },
    err: "تعذّر بدء الدفع. يُرجى المحاولة مرة أخرى.",
    btnWait: "جارٍ فتح صفحة الدفع…",
    stampTag: "مضمون",
    stampT: "مضمون أو استرداد أموالك — تجربة 3 أيام",
    stampD:
      "جرّب كل شيء لمدة 3 أيام. غير مقتنع؟ تُستردّ أموالك. بعد ذلك، يُلغى الاشتراك الشهري في أي وقت، بنقرة واحدة.",
    secProof: "التدرّب المنتظم يؤتي ثماره",
    proofA: "القيادة المرافَقة (تدرّب منتظم)",
    proofAVal: "74.7%",
    proofAW: 74.7,
    proofB: "المسار التقليدي",
    proofBVal: "56.8%",
    proofBW: 56.8,
    proofSrc: "حصيلة امتحانات رخصة القيادة الفرنسية 2022 — Sécurité routière.",
    secFaq: "الأسئلة الشائعة",
    faq: [
      [
        "هل هذا تطبيق لاختبار الكود؟",
        "لا. اختبار الكود مُضمَّن (اختبارات قصيرة، امتحانات تجريبية)، لكن الفرق الحقيقي: نحن ندرّبك على <strong>القيادة</strong> — ألعاب مصغّرة، بطاقات الدروس، محاكاة الامتحان، أدلّة مراكز الامتحان.",
      ],
      [
        "هل التطبيق باللغة العربية؟",
        "هذه الصفحة نعم. أمّا التطبيق نفسه فهو <strong>بفرنسية بسيطة</strong> — وذلك عن قصد: امتحانك سيكون بالفرنسية، والتدرّب على الكلمات نفسها التي ستسمعها يوم الامتحان هو ما يساعدك على النجاح. الألعاب المصغّرة بصرية أولاً، لذا تكفي فرنسية أساسية.",
      ],
      [
        "ماذا يتوقّع الممتحن يوم الامتحان؟",
        "<strong>قيادة مستقلّة ومسؤولة وآمنة</strong>: معرفة الكود، التحكّم في السيارة، احترام القواعد، توقّع المخاطر والتكيّف مع محيطك. سلوكك مهمّ أيضاً: ابقَ هادئاً وواثقاً، وقرّر في الوقت المناسب. هذا بالضبط ما يدرّبك عليه PermiGo — مع محاكاة الامتحان.",
      ],
      [
        "هل يعمل مع مدرسة تعليم القيادة التي أتدرّب فيها؟",
        "نعم. احتفظ بدروسك — يعمل PermiGo في ما بينها. وإذا كان مدرّبك يستخدم PermiGo، يتزامن تقدّمك معه.",
      ],
      [
        "هل يمكنني الإلغاء أو استرداد أموالي؟",
        `أول 3 أيام: <strong>مضمون أو استرداد أموالك</strong>. بعد ذلك، يُلغى الاشتراك الشهري في أي وقت بنقرة واحدة (التذكرتان الذهبية والبلاتينية دفعة واحدة فقط). هل ستغادر؟ <a href="#/avis-depart">أخبرنا بالسبب هنا</a> — هذا يساعدنا على التحسّن.`,
      ],
    ],
    foot: `دفع آمن عبر Stripe · مضمون أو استرداد أموالك — 3 أيام<br><a href="#/legal">الإشعارات القانونية</a> · مدرّب قيادة مستقل؟ <a href="#/creer-compte">أنشئ مساحتك</a>`,
    stickyName: "التذكرة الذهبية · 3 أشهر",
    stickyPrice: "€24.99 · تجربة 3 أيام",
    stickyBtn: "احجز مقعدي",
    cancelNote:
      "تمّ إلغاء الدفع — لم يُخصم أي مبلغ. تذكرتك في انتظارك أدناه. 👇",
    successT: "مرحباً بك على متن الرحلة! 🚀",
    successIntro: (label) =>
      `تمّ حجز ${label}. سيصلك إيصالك وفاتورتك عبر البريد الإلكتروني.`,
    successSteps: [
      "<b>أنشئ حسابك الآن</b> — دقيقتان، بنفس البريد الإلكتروني المستخدَم في الدفع ← وصول فوري.",
      "<b>ثبّت التطبيق على هاتفك</b> لتصلك تذكيرات المراجعة: آيفون ← Safari ← مشاركة ← «إضافة إلى الشاشة الرئيسية». أندرويد ← Chrome ← قائمة ⋮ ← «تثبيت التطبيق».",
      "<b>تحتاج مساعدة؟</b> راسلنا — سنرافقك خطوة بخطوة.",
    ],
    successGuarantee: "وبالطبع: مضمون أو استرداد أموالك خلال 3 أيام.",
    successCta: "افتح PermiGo",
    successCtaSolo: "أنشئ حسابي — وصول فوري",
  },
};

const PLAN_LABELS = {
  fr: {
    mensuel: "Billet Mensuel",
    pass3: "Billet Or · 3 mois",
    pass6: "Billet Platine · 6 mois",
  },
  en: {
    mensuel: "Monthly Ticket",
    pass3: "Gold Ticket · 3 months",
    pass6: "Platinum Ticket · 6 months",
  },
  ar: {
    mensuel: "التذكرة الشهرية",
    pass3: "التذكرة الذهبية · 3 أشهر",
    pass6: "التذكرة البلاتينية · 6 أشهر",
  },
};

// Grain très léger posé sur le billet (relief papier doré).
const GRAIN =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.55'/></svg>";

const STYLE = `<style>
  .pv {
    position: relative;
    min-height: 100dvh;
    font-family: 'Baloo 2', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    --in:#6c63ff;--in-lt:#8e87ff;--in-dp:#4a3fc9;--in-dk:#372fa3;
    --gold:#ffce4d;--gold-dp:#e8a317;--go:#58cc02;--eco:#ffe94d;
    --pv-ink:#f4f1ff;--ink-soft:#cdc8ec;--ink-mu:#aaa2d8;--ink-dim:#8b7fc4;
    --tik-ink:#3a2a05;--tik-mu:#6b520f;--tik-lbl:#8a6a17;
    color: var(--pv-ink);
    background:
      radial-gradient(100% 46% at 50% -4%, rgba(255,206,77,.16), transparent 58%),
      linear-gradient(180deg, #1b1240 0%, #241a4d 50%, #170f38 100%);
    background-color:#1b1240;
    padding-bottom: calc(88px + env(safe-area-inset-bottom));
    overflow-x: clip;
  }
  .pv * { box-sizing: border-box; }
  .pv-wrap { max-width: 480px; margin: 0 auto; padding: 0 18px; }

  .pv-rev { opacity: 0; transform: translateY(24px); transition: opacity .55s ease, transform .55s cubic-bezier(.22,1,.36,1); }
  .pv-rev.in { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) { .pv-rev { opacity: 1; transform: none; transition: none; } }

  /* ── Barre haute : le P vert gloss, seul ── */
  .pv-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(14px + env(safe-area-inset-top)) 18px 4px;
    max-width: 480px; margin: 0 auto;
  }
  .pv-logo { display: grid; place-items: center; text-decoration: none; }
  .pv-logo img { width: 46px; height: 46px; filter: drop-shadow(0 4px 8px rgba(0,0,0,.5)); }
  .pv-nav-right { display: flex; align-items: center; gap: 8px; }
  /* Sélecteur de langue : segment FR|EN, la langue ACTIVE est surlignée
     (fini le bouton unique qui affichait la cible → lu comme inversé). */
  .pv-lang-seg {
    display: inline-flex; align-items: center; gap: 2px;
    background: rgba(255,255,255,.08); border: 1.5px solid rgba(255,255,255,.20);
    border-radius: 999px; padding: 3px;
  }
  .pv-lang-opt {
    font: 800 12.5px/1 'Baloo 2', sans-serif; letter-spacing: .04em;
    color: rgba(255,255,255,.62); background: none; border: 0;
    border-radius: 999px; padding: 7px 13px; cursor: pointer;
    transition: background .16s ease, color .16s ease;
  }
  .pv-lang-opt.on { color: #1a1030; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.28); }
  .pv-lang-opt:not(.on):active { background: rgba(255,255,255,.14); }
  .pv-login { font: 700 14px/1 'Baloo 2', sans-serif; color: var(--ink-soft); background: none; border: 0; padding: 10px 8px; cursor: pointer; border-radius: 12px; }

  /* ── Hero ── */
  .pv-hero { text-align: center; padding-top: 20px; }
  .pv-kicker { font: 700 12px/1 Inter, sans-serif; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-mu); }
  .pv-h1 { font: 800 clamp(36px, 10vw, 44px)/1.05 'Baloo 2', sans-serif; color: var(--pv-ink); margin: 12px 0 10px; text-shadow: 0 3px 0 rgba(12,7,32,.8); }
  .pv-h1 em { font-style: normal; color: var(--gold); }
  .pv-lead { font: 600 15.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); max-width: 330px; margin: 0 auto; }
  .pv-lead strong { color: var(--gold); }

  /* ── LE billet d'or ── */
  .pv-ticket-scene { position: relative; margin: 28px auto 0; max-width: 400px; filter: drop-shadow(0 30px 40px rgba(0,0,0,.55)); }
  .pv-ticket-scene.pv-rev { transform: translateY(28px) scale(.96) rotate(-1deg); }
  .pv-ticket-scene.pv-rev.in { transform: none; }
  .pv-ticket {
    position: relative; transform: rotate(-2.5deg);
    background:
      radial-gradient(130% 100% at 18% -6%, rgba(255,255,255,.5), transparent 42%),
      radial-gradient(90% 70% at 85% 110%, rgba(120,78,8,.35), transparent 55%),
      linear-gradient(115deg, #f6d267 0%, #ffe9a8 22%, #eab63a 48%, #ffdf8a 70%, #d99c1e 100%);
    border-radius: 20px; color: var(--tik-ink); overflow: hidden;
    box-shadow:
      inset 0 2.5px 0 rgba(255,255,255,.75),
      inset 0 -4px 8px rgba(122,85,16,.55),
      inset 3px 0 6px rgba(255,255,255,.25),
      inset -3px 0 8px rgba(122,85,16,.3),
      0 3px 0 #a87c14, 0 10px 18px rgba(0,0,0,.35);
  }
  .pv-ticket::before {
    content: ""; position: absolute; top: 0; bottom: 0; left: calc(100% - 104px); width: 0;
    border-left: 2.5px dashed rgba(58,42,5,.4);
  }
  .pv-t-grain { position: absolute; inset: 0; pointer-events: none; background: url("${GRAIN}"); opacity: .12; mix-blend-mode: overlay; }
  .pv-t-shine {
    position: absolute; inset: -20% -35%; pointer-events: none;
    background: linear-gradient(115deg, transparent 38%, rgba(255,255,255,.75) 48%, rgba(255,255,255,.2) 52%, transparent 62%);
    mix-blend-mode: soft-light; transform: translateX(-130%);
  }
  .pv-ticket-scene.in .pv-t-shine { animation: pvSheen 1.5s cubic-bezier(.4,0,.2,1) .35s both; }
  @keyframes pvSheen { to { transform: translateX(130%); } }
  @media (prefers-reduced-motion: reduce) { .pv-ticket-scene.in .pv-t-shine { animation: none; transform: translateX(-130%); } }
  .pv-t-inner { display: flex; position: relative; }
  .pv-t-main { flex: 1; padding: 18px 14px 16px 18px; }
  .pv-t-stub { width: 104px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 12px 6px; text-align: center; }
  .pv-t-brand { display: flex; align-items: center; gap: 7px; font: 800 14px/1 'Baloo 2', sans-serif; text-shadow: 0 1px 0 rgba(255,255,255,.4); }
  .pv-t-brand img { width: 22px; height: 22px; filter: drop-shadow(0 1px 1px rgba(90,60,5,.4)); }
  .pv-t-title { font: 800 23px/1.05 'Baloo 2', sans-serif; margin: 9px 0 3px; letter-spacing: -.01em; text-shadow: 0 1px 0 rgba(255,255,255,.45), 0 -1px 0 rgba(90,60,5,.3); }
  .pv-t-sub { font: 600 11.5px/1.4 Inter, sans-serif; color: var(--tik-mu); }
  .pv-t-meta { display: flex; gap: 14px; margin-top: 12px; }
  .pv-t-meta div b { display: block; font: 700 10px/1 Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--tik-lbl); margin-bottom: 2px; }
  .pv-t-meta div span { font: 600 13px/1 'IBM Plex Mono', monospace; }
  .pv-t-stub .n { font: 700 9.5px/1.25 Inter, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: var(--tik-lbl); }
  .pv-t-strike { font: 700 13px/1 Inter, sans-serif; color: var(--tik-lbl); text-decoration: line-through; }
  .pv-t-price { font: 800 22px/1 'Baloo 2', sans-serif; text-shadow: 0 1px 0 rgba(255,255,255,.45); }
  .pv-t-check { font: 800 30px/1 'Baloo 2', sans-serif; text-shadow: 0 1px 0 rgba(255,255,255,.45); }
  .pv-t-barcode {
    width: 64px; height: 30px; border-radius: 3px; opacity: .85; margin-top: 4px;
    background: repeating-linear-gradient(90deg, #3a2a05 0 2px, transparent 2px 5px, #3a2a05 5px 6px, transparent 6px 10px);
    box-shadow: 0 1px 0 rgba(255,255,255,.35);
  }

  /* CTA principal */
  .pv-cta-hero {
    display: block; width: 100%; max-width: 340px; margin: 26px auto 0;
    border: 0; cursor: pointer; border-radius: 18px; padding: 17px;
    font: 800 17px/1 'Baloo 2', sans-serif; color: #4a3300; text-shadow: 0 1px 0 rgba(255,255,255,.35);
    background: linear-gradient(180deg, #ffe08a, var(--gold) 55%, var(--gold-dp));
    box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 6px 0 #a86e00, 0 12px 26px rgba(0,0,0,.4);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pv-cta-hero s { opacity: .55; font-weight: 700; font-size: 14px; margin-right: 2px; }
  .pv-cta-hero:active { transform: translateY(4px); box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 2px 0 #a86e00, 0 4px 8px rgba(0,0,0,.3); }
  .pv-cta-hero[disabled] { opacity: .65; cursor: wait; }
  .pv-cta-note { text-align: center; font: 600 12.5px/1.6 Inter, sans-serif; color: var(--ink-dim); margin: 12px 0 0; }
  .pv-cta-note b { color: var(--ink-soft); }
  .pv-cta-note small { font-size: 11px; color: #655a97; }

  /* ── Scène téléphone + mascotte ── */
  .pv-stage { position: relative; height: 470px; max-width: 400px; margin: 44px auto 0; }
  .pv-phone {
    position: absolute; left: 50%; transform: translateX(-26%) rotate(4deg); top: 0; width: 196px;
    border-radius: 30px; overflow: hidden; border: 6px solid #160f38;
    box-shadow: 0 24px 50px rgba(0,0,0,.55), 0 0 0 2px rgba(142,135,255,.5);
  }
  .pv-phone::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(155deg, rgba(255,255,255,.2), transparent 32%); }
  .pv-phone img { display: block; width: 100%; height: auto; }
  .pv-mascot { position: absolute; left: -8px; bottom: 0; width: 180px; z-index: 3; filter: drop-shadow(0 18px 30px rgba(0,0,0,.5)); }
  .pv-coin { position: absolute; z-index: 3; right: 4px; top: -6px; width: 72px; transform: rotate(12deg); filter: drop-shadow(0 10px 18px rgba(0,0,0,.45)); }
  .pv-bulle {
    position: absolute; z-index: 3; right: 0; bottom: 116px;
    background: #fff; color: #231603; border-radius: 16px 16px 4px 16px; padding: 10px 14px;
    font: 700 13px/1.3 'Baloo 2', sans-serif; box-shadow: 0 8px 20px rgba(0,0,0,.4);
  }
  .pv-bulle small { display: block; color: #8a7a52; font-weight: 600; font-size: 11px; }

  /* ── Sections ── */
  .pv-sec-title {
    text-align: center; font: 800 clamp(24px, 7vw, 28px)/1.15 'Baloo 2', sans-serif;
    color: var(--pv-ink); margin: 52px 0 0; text-shadow: 0 3px 0 rgba(12,7,32,.8);
  }
  .pv-sec-title em { font-style: normal; color: var(--gold); }
  .pv-sec-sub { text-align: center; font: 600 13.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-mu); margin: 8px auto 22px; max-width: 340px; }

  /* ── Cartes atouts ── */
  .pv-conduite { display: flex; flex-direction: column; gap: 12px; }
  .pv-situ {
    display: flex; gap: 14px; align-items: center;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
    border-radius: 20px; padding: 14px;
  }
  .pv-situ-shot {
    position: relative; flex: none; width: 138px; border-radius: 16px; overflow: hidden;
    border: 4px solid #160f38; box-shadow: 0 10px 24px rgba(0,0,0,.45), 0 0 0 1.5px rgba(142,135,255,.45);
  }
  .pv-situ-shot::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(155deg, rgba(255,255,255,.16), transparent 30%); }
  .pv-situ-shot img { display: block; width: 100%; height: auto; }
  .pv-situ-txt b { display: block; font: 800 16px/1.25 'Baloo 2', sans-serif; margin-bottom: 5px; }
  .pv-situ-txt span { font: 600 12.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-mu); }
  .pv-feat {
    display: flex; gap: 13px; align-items: center;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); border-radius: 16px; padding: 13px 14px;
  }
  .pv-feat-img { flex: none; width: 46px; height: 46px; object-fit: contain; filter: drop-shadow(0 5px 8px rgba(0,0,0,.45)); }
  .pv-feat b { display: block; font: 700 15px/1.3 'Baloo 2', sans-serif; }
  .pv-feat span { font: 600 13px/1.45 'Baloo 2', sans-serif; color: var(--ink-mu); }

  /* Bloc non-francophones (version EN uniquement) */
  .pv-franco {
    margin-top: 12px; padding: 16px; border-radius: 18px; text-align: left;
    background: rgba(108,99,255,.14); border: 1.5px solid rgba(142,135,255,.4);
    display: flex; gap: 12px; align-items: flex-start;
  }
  .pv-franco-flag { font-size: 24px; line-height: 1; margin-top: 2px; }
  .pv-franco b { display: block; font: 800 15.5px/1.3 'Baloo 2', sans-serif; margin-bottom: 4px; }
  .pv-franco span { font: 600 13px/1.5 'Baloo 2', sans-serif; color: var(--ink-soft); }

  /* ── L'addition ── */
  .pv-maths { margin-top: 22px; border-radius: 20px; padding: 8px 18px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); }
  .pv-maths-row { display: flex; justify-content: space-between; align-items: baseline; padding: 13px 0; font: 500 14px Inter, sans-serif; color: var(--ink-soft); }
  .pv-maths-row + .pv-maths-row { border-top: 1px dashed rgba(255,255,255,.1); }
  .pv-maths-row b { font: 700 16px 'Baloo 2', sans-serif; color: #fff; }
  .pv-maths-row.hot { color: var(--gold); }
  .pv-maths-row.hot b { color: var(--gold); font-size: 18px; }
  .pv-maths-note { text-align: center; font: 600 12.5px/1.6 'Baloo 2', sans-serif; color: var(--ink-dim); margin: 12px 0 0; }
  .pv-maths-src { text-align: center; font: 500 10.5px/1.5 Inter, sans-serif; color: #655a97; margin: 6px 0 0; }

  /* ── Les 3 billets ── */
  .pv-pass { position: relative; display: flex; border-radius: 18px; margin-bottom: 14px; box-shadow: 0 14px 28px rgba(0,0,0,.4); }
  .pv-pass-main { flex: 1; padding: 16px 14px 15px 18px; border-radius: 18px 0 0 18px; }
  .pv-pass-cut {
    width: 118px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px;
    padding: 12px 8px; border-left: 2px dashed rgba(255,255,255,.25); border-radius: 0 18px 18px 0;
  }
  .pv-pass-std { background: linear-gradient(180deg, #352a6e, #2b2160); box-shadow: inset 0 2px 0 rgba(255,255,255,.12), 0 14px 28px rgba(0,0,0,.4); }
  .pv-pass-std .pv-pass-cut { border-left-color: rgba(255,255,255,.18); background: rgba(0,0,0,.18); }
  .pv-pass-name { font: 800 17px/1.2 'Baloo 2', sans-serif; }
  .pv-pass-desc { font: 600 12.5px/1.45 'Baloo 2', sans-serif; color: var(--ink-mu); margin-top: 3px; }
  .pv-pass-price { font: 800 24px/1 'Baloo 2', sans-serif; }
  .pv-pass-price small { font-size: 12px; color: var(--ink-mu); }
  .pv-pass-strike { font: 600 12px Inter, sans-serif; color: var(--ink-dim); text-decoration: line-through; }
  /* Chip d'économie jaune fluo (façon Ornikar) */
  .pv-eco {
    font: 800 11.5px/1 Inter, sans-serif; color: #231603; background: var(--eco);
    padding: 4px 8px; border-radius: 6px; letter-spacing: .02em;
    box-shadow: 0 2px 6px rgba(0,0,0,.3);
  }
  .pv-pass-btn {
    border: 0; cursor: pointer; border-radius: 12px; padding: 11px 14px; width: 100%;
    font: 800 13.5px 'Baloo 2', sans-serif; color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.25);
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 4px 0 var(--in-dk);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pv-pass-btn:active { transform: translateY(3px); box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 1px 0 var(--in-dk); }
  .pv-pass-btn[disabled] { opacity: .65; cursor: wait; }

  .pv-pass-gold {
    transform: scale(1.04); margin: 24px 0;
    background:
      radial-gradient(120% 90% at 15% 0%, rgba(255,255,255,.45), transparent 40%),
      linear-gradient(115deg, #f6d267 0%, #ffe9a8 25%, #eab63a 55%, #d99c1e 100%);
    color: var(--tik-ink);
    box-shadow: inset 0 2px 0 rgba(255,255,255,.7), inset 0 -3px 6px rgba(122,85,16,.5), 0 20px 40px rgba(0,0,0,.5), 0 0 60px rgba(255,206,77,.25);
  }
  .pv-pass-gold .pv-pass-name { text-shadow: 0 1px 0 rgba(255,255,255,.4); }
  .pv-pass-gold .pv-pass-desc { color: var(--tik-mu); }
  .pv-pass-gold .pv-pass-cut { border-left-color: rgba(58,42,5,.4); background: rgba(255,255,255,.14); }
  .pv-pass-gold .pv-pass-strike { color: var(--tik-lbl); }
  .pv-pass-gold .pv-pass-btn {
    background: linear-gradient(180deg, var(--in-dp), var(--in-dk));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.3), 0 4px 0 #241c6e;
  }
  .pv-pass-tag {
    position: absolute; top: -11px; left: 16px; z-index: 1;
    font: 800 10.5px/1 Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #fff;
    background: #e2513f; padding: 7px 12px; border-radius: 99px; box-shadow: 0 4px 10px rgba(0,0,0,.35);
  }
  .pv-err { font: 700 13px/1.4 'Baloo 2', sans-serif; color: #ffb4a8; text-align: center; margin: 4px 0 0; display: none; }
  .pv-err.on { display: block; }

  /* ── Garantie ── */
  .pv-stamp-zone { position: relative; margin-top: 26px; padding: 20px 18px; border-radius: 20px; border: 2px dashed rgba(88,204,2,.5); text-align: center; }
  .pv-stamp-zone b { display: block; font: 800 16.5px/1.3 'Baloo 2', sans-serif; margin-bottom: 4px; }
  .pv-stamp-zone span { font: 600 13px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); }
  .pv-stamp {
    position: absolute; top: -16px; right: 10px; transform: rotate(9deg);
    font: 800 11px/1 Inter, sans-serif; letter-spacing: .1em; text-transform: uppercase;
    color: #7ee838; border: 2.5px solid var(--go); border-radius: 8px; padding: 7px 10px;
    background: rgba(20,40,4,.6);
  }

  /* ── Preuve ── */
  .pv-proof { margin-top: 20px; }
  .pv-bar-lbl { display: flex; justify-content: space-between; gap: 12px; font: 600 13px Inter, sans-serif; margin-bottom: 6px; color: var(--ink-soft); }
  .pv-bar { height: 12px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; margin-bottom: 14px; }
  .pv-bar span { display: block; height: 100%; border-radius: 99px; }
  .pv-bar-go span { background: linear-gradient(90deg, var(--go), #8aec3c); }
  .pv-bar-mu span { background: #5c519f; }
  .pv-src { text-align: center; font: 500 11px Inter, sans-serif; color: #655a97; margin: 0; }

  /* ── FAQ ── */
  .pv-faq details { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 15px; padding: 0 15px; margin-bottom: 9px; }
  .pv-faq summary {
    font: 700 14.5px/1.4 'Baloo 2', sans-serif; padding: 14px 0; cursor: pointer; list-style: none;
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
  }
  .pv-faq summary::-webkit-details-marker { display: none; }
  .pv-faq summary::after { content: "+"; font: 800 19px/1 'Baloo 2', sans-serif; color: var(--gold); flex: none; }
  .pv-faq details[open] summary::after { content: "–"; }
  .pv-faq p { font: 600 13.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); margin: 0 0 14px; }
  .pv-faq a { color: var(--gold); }

  .pv-foot { text-align: center; padding: 36px 0 10px; font: 600 12px/1.7 'Baloo 2', sans-serif; color: var(--ink-dim); }
  .pv-foot a { color: var(--ink-soft); }

  /* ── Barre CTA collante ── */
  .pv-sticky {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    background: rgba(18,11,44,.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border-top: 1.5px solid rgba(255,206,77,.25);
  }
  .pv-sticky-inner { display: flex; align-items: center; gap: 12px; width: 100%; max-width: 480px; margin: 0 auto; }
  .pv-sticky-txt { font: 700 12.5px/1.25 'Baloo 2', sans-serif; color: var(--ink-soft); white-space: nowrap; }
  .pv-sticky-txt b { display: block; color: var(--gold); font-size: 14.5px; }
  .pv-sticky-btn {
    flex: 1; border: 0; cursor: pointer; border-radius: 14px; padding: 13px 14px;
    font: 800 15px/1 'Baloo 2', sans-serif; color: #4a3300; text-shadow: 0 1px 0 rgba(255,255,255,.35);
    background: linear-gradient(180deg, #ffe08a, var(--gold) 55%, var(--gold-dp));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.55), 0 4px 0 #a86e00;
  }
  .pv-sticky-btn[disabled] { opacity: .65; cursor: wait; }

  /* ── Retour checkout ── */
  .pv-result { max-width: 400px; margin: 26px auto 0; filter: drop-shadow(0 30px 40px rgba(0,0,0,.55)); }
  .pv-result-title { text-align: center; color: var(--pv-ink); font: 800 26px/1.2 'Baloo 2', sans-serif; margin: 26px 0 6px; text-shadow: 0 3px 0 rgba(12,7,32,.8); }
  .pv-result-intro { text-align: center; font: 600 14px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); max-width: 340px; margin: 0 auto 20px; }
  .pv-steps { display: flex; flex-direction: column; gap: 10px; counter-reset: pvstep; max-width: 440px; margin: 0 auto; }
  .pv-step {
    display: flex; gap: 12px; align-items: flex-start; text-align: left;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); border-radius: 16px; padding: 13px 14px;
    font: 600 13.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-mu);
  }
  .pv-step b { color: var(--pv-ink); }
  .pv-step::before {
    counter-increment: pvstep; content: counter(pvstep);
    flex: none; width: 28px; height: 28px; display: grid; place-items: center;
    font: 800 14px/1 'Baloo 2', sans-serif; color: #4a3300;
    background: linear-gradient(180deg, #ffe08a, var(--gold) 60%, var(--gold-dp));
    border-radius: 50%; box-shadow: inset 0 1.5px 0 rgba(255,255,255,.55), 0 2.5px 0 #a86e00;
  }
  .pv-result-guarantee { text-align: center; font: 600 12.5px/1.5 Inter, sans-serif; color: var(--ink-dim); margin: 16px 0 0; }
  .pv-result-cta {
    display: block; width: 100%; max-width: 320px; margin: 20px auto 0;
    border: 0; cursor: pointer; border-radius: 16px; padding: 15px;
    font: 800 16px/1 'Baloo 2', sans-serif; color: #fff; text-shadow: 0 1.5px 0 rgba(0,0,0,.3);
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2.5px 0 rgba(255,255,255,.35), 0 5px 0 var(--in-dk), 0 9px 16px rgba(0,0,0,.35);
  }
  .pv-cancel-note {
    max-width: 444px; margin: 14px auto 0; padding: 12px 16px;
    background: rgba(255,206,77,.1); border: 1.5px solid rgba(255,206,77,.35); border-radius: 14px;
    font: 700 13.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-soft); text-align: center;
  }
</style>`;

/** Query params du hash (#/pass?checkout=success&plan=pass3&lang=en). */
function hashQuery() {
  const q = (location.hash.split("?")[1] || "").trim();
  return new URLSearchParams(q);
}

/** Langue : choix mémorisé > ?lang= > langue du navigateur. */
function getLang() {
  const stored = localStorage.getItem("pv_lang");
  if (stored === "fr" || stored === "en" || stored === "ar") return stored;
  const appStored = localStorage.getItem("permigo_lang");
  if (appStored === "fr" || appStored === "en" || appStored === "ar")
    return appStored;
  const p = hashQuery().get("lang");
  if (p === "fr" || p === "en" || p === "ar") return p;
  const browserLang = (navigator.language || "fr").toLowerCase();
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("ar")) return "ar";
  return "en";
}

/** Le billet d'or. stamped = billet validé (écran de succès). */
function renderTicket(L, { stamped = false } = {}) {
  return `
    <div class="pv-ticket-scene pv-rev">
      <div class="pv-ticket">
        <div class="pv-t-inner">
          <div class="pv-t-main">
            <div class="pv-t-brand"><img src="${LOGO}" alt="" width="22" height="22">PERMIGO</div>
            <div class="pv-t-title">${L.tTitle}</div>
            <div class="pv-t-sub">${L.tSub}</div>
            <div class="pv-t-meta">
              <div><b>${L.tBoardLbl}</b><span>${L.tBoard}</span></div>
              <div><b>${L.tDureeLbl}</b><span>${L.tDuree}</span></div>
            </div>
          </div>
          <div class="pv-t-stub">
            <span class="n">${L.tOffre}</span>
            ${stamped ? `<span class="pv-t-check">✔</span>` : `<span class="pv-t-strike">${L.tStrike}</span><span class="pv-t-price">${L.tPrice}</span>`}
            <div class="pv-t-barcode"></div>
          </div>
        </div>
        <div class="pv-t-grain"></div>
        <div class="pv-t-shine"></div>
      </div>
    </div>`;
}

export async function mount(root) {
  const me = getCurUser();
  const lang = getLang();
  const L = STR[lang];
  const q = hashQuery();
  const checkout = q.get("checkout");
  const planParam = q.get("plan");

  track("pass.view", {
    logged: !!me,
    lang,
    checkout_return: checkout || "none",
  });

  // ── Retour succès : bienvenue dans l'aventure ──
  if (checkout === "success") {
    track("pass.checkout_success", { plan: planParam || "?" });
    const label = PLAN_LABELS[lang][planParam] || "Pass Permis";
    root.innerHTML = `${STYLE}
      <div class="pv" dir="${lang === "ar" ? "rtl" : "ltr"}">
        <header class="pv-nav">
          <a class="pv-logo" href="#/pass" aria-label="PermiGo"><img src="${LOGO}" alt="PermiGo"></a>
        </header>
        <div class="pv-wrap">
          <div class="pv-result">${renderTicket(L, { stamped: true })}</div>
          <h1 class="pv-result-title">${L.successT}</h1>
          <p class="pv-result-intro">${L.successIntro(label)}</p>
          <div class="pv-steps">
            ${L.successSteps.map((s) => `<div class="pv-step"><div>${s}</div></div>`).join("")}
          </div>
          <p class="pv-result-guarantee">${L.successGuarantee}</p>
          <button class="pv-result-cta" id="pv-home" type="button">${me ? L.successCta : L.successCtaSolo}</button>
        </div>
        <footer class="pv-foot">${L.foot}</footer>
      </div>`;
    root.querySelectorAll(".pv-rev").forEach((el) => el.classList.add("in"));
    root.querySelector("#pv-home")?.addEventListener("click", () => {
      // Invité → inscription élève solo (sans code moniteur) : accès immédiat.
      location.hash = me ? "#/" : "#/rejoindre?solo=1";
    });
    return;
  }

  const P = L.passes;
  root.innerHTML = `${STYLE}
  <div class="pv" dir="${lang === "ar" ? "rtl" : "ltr"}">

    <header class="pv-nav">
      <a class="pv-logo" href="#/" aria-label="PermiGo"><img src="${LOGO}" alt="PermiGo"></a>
      <div class="pv-nav-right">
        <div class="pv-lang-seg" role="group" aria-label="Langue / Language">
          <button class="pv-lang-opt${lang === "fr" ? " on" : ""}" data-lang="fr" type="button" aria-pressed="${lang === "fr"}">FR</button>
          <button class="pv-lang-opt${lang === "en" ? " on" : ""}" data-lang="en" type="button" aria-pressed="${lang === "en"}">EN</button>
          <button class="pv-lang-opt${lang === "ar" ? " on" : ""}" data-lang="ar" type="button" aria-pressed="${lang === "ar"}">AR</button>
        </div>
        ${me ? "" : `<button class="pv-login" id="pv-login" type="button">${L.login}</button>`}
      </div>
    </header>

    ${checkout === "cancel" ? `<div class="pv-cancel-note">${L.cancelNote}</div>` : ""}

    <div class="pv-wrap">

      <section class="pv-hero">
        <div class="pv-kicker">${L.kicker}</div>
        <h1 class="pv-h1">${L.h1}</h1>
        <p class="pv-lead">${L.lead}</p>
      </section>

      ${renderTicket(L)}

      <button class="pv-cta-hero" data-plan="pass3" type="button">${L.cta}</button>
      <p class="pv-cta-note">${L.ctaNote}</p>

      <div class="pv-stage pv-rev" aria-hidden="true">
        <div class="pv-phone"><img src="/showcase/eleve-parcours.png" alt="" width="390" height="844" loading="lazy" decoding="async"></div>
        <img class="pv-coin" src="/skins/volant-coin.webp" alt="" loading="lazy" decoding="async">
        <img class="pv-mascot" src="/skins/mascot-celebrate.png" alt="" loading="lazy" decoding="async">
        <div class="pv-bulle">${L.bulle}<small>${L.bulleSub}</small></div>
      </div>

      <h2 class="pv-sec-title pv-rev">${L.secCode}</h2>
      <p class="pv-sec-sub">${L.secCodeSub}</p>

      <div class="pv-conduite pv-rev">
        <div class="pv-situ">
          <div class="pv-situ-shot"><img src="/showcase/eleve-en-situation.png" alt="${L.situAlt}" loading="lazy" decoding="async"></div>
          <div class="pv-situ-txt">
            <b>${L.situTitle}</b>
            <span>${L.situTxt}</span>
          </div>
        </div>
        <div class="pv-situ">
          <div class="pv-situ-txt">
            <b>${L.centreTitle}</b>
            <span>${L.centreTxt}</span>
          </div>
          <div class="pv-situ-shot"><img src="/showcase/eleve-centre-examen.png" alt="${L.centreAlt}" loading="lazy" decoding="async"></div>
        </div>
        ${L.feats
          .map(
            (f) => `
        <div class="pv-feat">
          ${
            f.mask
              ? `<span class="pv-feat-img" style="display:grid;place-items:center">${illMask(f.mask, { size: 40, color: "var(--gold)" })}</span>`
              : `<img class="pv-feat-img" src="${f.img}" alt="" loading="lazy" decoding="async">`
          }
          <div><b>${f.t}</b><span>${f.d}</span></div>
        </div>`,
          )
          .join("")}
        ${
          L.nonFranco
            ? `
        <div class="pv-franco">
          <span class="pv-franco-flag" aria-hidden="true">🇫🇷</span>
          <div><b>${L.nonFranco.title}</b><span>${L.nonFranco.txt}</span></div>
        </div>`
            : ""
        }
      </div>

      <div class="pv-maths pv-rev">
        ${L.mathsRows
          .map(
            ([lbl, val], i) =>
              `<div class="pv-maths-row${i === 2 ? " hot" : ""}"><span>${lbl}</span><b>${val}</b></div>`,
          )
          .join("")}
      </div>
      <p class="pv-maths-note">${L.mathsNote}</p>
      <p class="pv-maths-src">${L.mathsSrc}</p>

      <h2 class="pv-sec-title pv-rev" id="pv-pricing">${L.secPass}</h2>
      <p class="pv-sec-sub">${L.secPassSub}</p>

      <article class="pv-pass pv-pass-std pv-rev">
        <div class="pv-pass-main">
          <div class="pv-pass-name">${P.mensuel.name}</div>
          <div class="pv-pass-desc">${P.mensuel.desc}</div>
        </div>
        <div class="pv-pass-cut">
          <div class="pv-pass-price">${P.mensuel.price}<small>${P.mensuel.per}</small></div>
          <button class="pv-pass-btn" data-plan="mensuel" type="button">${P.mensuel.btn}</button>
        </div>
      </article>

      <article class="pv-pass pv-pass-gold pv-rev">
        <span class="pv-pass-tag">${P.pass3.tag}</span>
        <div class="pv-pass-main">
          <div class="pv-pass-name">${P.pass3.name}</div>
          <div class="pv-pass-desc">${P.pass3.desc}</div>
        </div>
        <div class="pv-pass-cut">
          <span class="pv-eco">${P.pass3.eco}</span>
          <div class="pv-pass-strike">${P.pass3.strike}</div>
          <div class="pv-pass-price">${P.pass3.price}</div>
          <button class="pv-pass-btn" data-plan="pass3" type="button">${P.pass3.btn}</button>
        </div>
      </article>

      <article class="pv-pass pv-pass-std pv-rev">
        <div class="pv-pass-main">
          <div class="pv-pass-name">${P.pass6.name}</div>
          <div class="pv-pass-desc">${P.pass6.desc}</div>
        </div>
        <div class="pv-pass-cut">
          <span class="pv-eco">${P.pass6.eco}</span>
          <div class="pv-pass-strike">${P.pass6.strike}</div>
          <div class="pv-pass-price">${P.pass6.price}</div>
          <button class="pv-pass-btn" data-plan="pass6" type="button">${P.pass6.btn}</button>
        </div>
      </article>

      <p class="pv-err" id="pv-err">${L.err}</p>

      <div class="pv-stamp-zone pv-rev">
        <span class="pv-stamp">${L.stampTag}</span>
        <b>${L.stampT}</b>
        <span>${L.stampD}</span>
      </div>

      <h2 class="pv-sec-title pv-rev">${L.secProof}</h2>
      <div class="pv-proof pv-rev">
        <div class="pv-bar-lbl"><span>${L.proofA}</span><span>${L.proofAVal}</span></div>
        <div class="pv-bar pv-bar-go"><span style="width:${L.proofAW}%"></span></div>
        <div class="pv-bar-lbl"><span>${L.proofB}</span><span>${L.proofBVal}</span></div>
        <div class="pv-bar pv-bar-mu"><span style="width:${L.proofBW}%"></span></div>
        <p class="pv-src">${L.proofSrc}</p>
      </div>

      <section class="pv-faq pv-rev">
        <h2 class="pv-sec-title">${L.secFaq}</h2>
        <div style="margin-top:16px">
          ${L.faq
            .map(
              ([sq, sa]) => `
          <details>
            <summary>${sq}</summary>
            <p>${sa}</p>
          </details>`,
            )
            .join("")}
        </div>
      </section>

      <footer class="pv-foot">${L.foot}</footer>
    </div>

    <div class="pv-sticky">
      <div class="pv-sticky-inner">
        <div class="pv-sticky-txt">${L.stickyName}<b>${L.stickyPrice}</b></div>
        <button class="pv-sticky-btn" data-plan="pass3" type="button">${L.stickyBtn}</button>
      </div>
    </div>

  </div>`;

  wire(root, me, lang, L);
  wireReveal(root);
}

/** Révélation au scroll : .pv-rev → .in à l'entrée dans le viewport. */
function wireReveal(root) {
  const els = [...root.querySelectorAll(".pv-rev")];
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  if (reduced || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -60px 0px", threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}

function wire(root, me, lang, L) {
  const err = root.querySelector("#pv-err");

  root.querySelector("#pv-login")?.addEventListener("click", () => {
    location.hash = "#/login";
  });

  // Bascule FR/EN : on clique la langue VOULUE (FR ou EN), pas une bascule
  // aveugle. On mémorise puis on re-rend la page entière.
  root.querySelectorAll(".pv-lang-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
      const next = opt.dataset.lang;
      if (next === lang) return;
      localStorage.setItem("pv_lang", next);
      track("pass.lang_switch", { lang: next });
      mount(root);
    });
  });

  // Un clic = une session Checkout. On fige TOUS les boutons le temps de la
  // redirection (double-tap mobile = double session sinon).
  const btns = [...root.querySelectorAll("[data-plan]")];
  btns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const plan = btn.dataset.plan;
      track("pass.checkout_click", { plan, lang, logged: !!me });
      err?.classList.remove("on");
      btns.forEach((b) => (b.disabled = true));
      const prev = btn.innerHTML;
      btn.textContent = L.btnWait;
      try {
        await startPassCheckout(plan);
        // Succès = redirection : on ne repasse jamais ici.
      } catch (e) {
        console.error("[pass] checkout", e);
        track("pass.checkout_error", { plan });
        btns.forEach((b) => (b.disabled = false));
        btn.innerHTML = prev;
        err?.classList.add("on");
        err?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  });
}
