// ═══════════════════════════════════════════════════════════════
// Page publique — Pré-vente « Pass Permis » (payeur = ÉLÈVE)
// URL : #/pass  (partageable en DM : www.permigo.fr/#/pass?lang=en)
//
// PRIX — v4 (décision Rayan, 02/08/2026) : UN SEUL prix, 4,99 €/mois.
// Le billet Or à 24,99 € les 3 mois est retiré. Raisons, dans ses mots :
// « on est gourmand à 24,99 alors que c'est le début », « personne ne va payer
// 24,99 en trois mois », « les gens comparent au fond d'écran d'Ornikar », et
// « 4,99 ça parle à tout le monde ». Conséquence : plus de prix barré, plus de
// chips d'économie, plus de grille à arbitrer. Le gratuit passe devant, le
// payant se propose au moment où l'élève est frustré (mur des 3 questions).
//
// DA « Ticket d'Or » (retours Rayan après SON vrai paiement, 15/07 soir) :
//  - logo = le badge de marque (/p-badge.png), plus de wordmark illisible
//  - PLUS de compteur de places ni de billet numéroté (retiré à sa demande)
//  - la garantie « satisfait ou remboursé » ne sert PLUS d'argument de vente
//    (carte retirée par #704, puis les 3 derniers restes le 05/08/2026 : pied
//    de page, réponse FAQ, écran de succès). Elle reste vraie et vit dans les
//    mentions légales, seul endroit qui l'engage. Ici on vend l'annulation en
//    un clic ; questionnaire de départ → #/avis-depart
//  - titre section : « Préparer le permis, c'est bien plus que conduire. »
//  - centres d'examen montrés avec une vraie capture (fiche Cergy)
//  - succès post-paiement : « Bienvenue dans l'aventure », installation de
//    l'app expliquée (rappels/notifs), aide pas à pas, retour à l'accueil
//  - bloc non-francophones VISIBLE UNIQUEMENT en anglais (l'app est en
//    français simple — on le dit honnêtement, jamais de fausse promesse)
//
// BILINGUE FR/EN (bouton + ?lang= + langue du navigateur). 100 % mobile.
// Retour Checkout : #/pass?checkout=success&plan=xxx | #/pass?checkout=cancel
// ═══════════════════════════════════════════════════════════════
import { track } from "@/services/analytics.js";
import { startPassCheckout, getPassSessionEmail } from "@/services/billing.js";
import { getCurUser } from "@/auth/cur-user.js";
import { icon } from "@/utils/icons.js";
import { esc, escAttr } from "@/utils/escape.js";
import { fbTrack } from "@/services/meta-pixel.js";
import { applyLang, browserLang, explicitLang } from "@/utils/lang.js";
// La démonstration jouable voyage AVEC la page, elle n'est plus chargée à part.
// Elle l'était (deux imports différés, ~10 Ko), et le jour où l'un des deux ne
// répondait pas — un déploiement pendant qu'un onglet est resté ouvert suffit,
// les noms de fichiers changent et l'ancien renvoie 404 — le bloc s'effaçait
// tout seul, sans un mot. Le visiteur arrivait sur la page de vente sans la
// seule chose qui lui montre le produit. 10 Ko contre ça, c'est donné.
import { mountDemoSituation } from "@/components/public/demo-situation.js";

const LOGO = "/p-badge.webp"; // 8 Ko au lieu de 64 : le PNG reste pour le reste de l'app

// ── Textes FR / EN ─────────────────────────────────────────────
const STR = {
  fr: {
    login: "Se connecter",
    langBtn: "EN",
    kicker: "Auto-école ou candidat libre",
    // Phrase-mission (décision Rayan 17/07) : LE but de l'app en une phrase,
    // en gros. « Réserve ta place » vit déjà dans le CTA, « 90 jours » sur le
    // billet — rien ne se perd.
    docTitle:
      "PermiGo. Le compagnon qui te prépare avant chaque heure de conduite",
    h1: `Prépare ta leçon <br><em>avant de monter en voiture.</em>`,
    // ⚠️ Pas de « la seule app » : allégation de supériorité invérifiable
    // (pratiques commerciales trompeuses). On dit ce qu'on fait, pas qu'on est seul.
    lead: `L'app qui travaille ta <strong>conduite</strong> entre les leçons.`,
    // Le billet annonçait « OBJECTIF PERMIS EN 90 JOURS ». Personne ne peut
    // tenir un délai qui dépend des places d'examen, du rythme de l'élève et
    // de son auto-école. Une promesse qu'on ne maîtrise pas se retourne : le
    // premier qui dépasse 90 jours se sent floué. Le billet promet maintenant
    // la seule chose que l'app fait vraiment, et qu'elle fait tous les jours.
    tTitle: `PRÊT AVANT<br>CHAQUE LEÇON`,
    tSub: "Conduite · mini-jeux · simulations d'examen",
    tBoardLbl: "Départ",
    tDureeLbl: "Accès",
    // « SANS LIMITE » à côté d'un abonnement mensuel : limite de contenu ou
    // limite de durée ? On répond au lieu de laisser la question ouverte.
    tDuree: "TOUT PERMIGO",
    tOffre: "Prix de lancement",
    tPer: "par mois",
    tPrice: "4,99 €",
    freeCta: "Commencer gratuitement",
    // « 3 leçons offertes » se lit « 3 heures de conduite offertes ». On dit
    // ce que le gratuit donne VRAIMENT (cf. utils/free-tier.js) : les trois
    // premières leçons de l'app en entier, et un examen blanc complet.
    freeNote: "3 leçons + 1 examen blanc offerts · sans carte bancaire",
    bulle: "3 compétences validées !",
    bulleSub: "cette semaine",
    // Un seul prix, une seule offre (v4) : ce titre disait aussi « c'est bien
    // plus que conduire, » — une virgule dans un titre affiché, contraire à la
    // regle maison. Reformule pour rester sans ponctuation.
    secCode: `Le permis exige <em>plus</em> que conduire.`,
    secCodeSub: "Tout ce qui compte le jour J.",
    // v5 (03/08/2026, refonte demandee par Rayan) : les DEUX cartes texte
    // (mini-jeu + centre d'examen) et les 3 cartes « feat » melangeaient deux
    // langages d'icone (trait fin pour le cahier, medaille en 3D pour les deux
    // autres) et redisaient en photo une scene qu'on venait de faire JOUER en
    // haut de la page. Un seul type de carte, une seule famille d'icone
    // (icon(), meme trace que partout ailleurs dans l'app), une ligne par
    // carte. « Ca donne envie de revenir » est retire : le mur des 3 questions
    // et la carte Pass PermiGo le disent deja (« tes recompenses »).
    feats: [
      {
        icon: "zap",
        t: "Mini-jeux en situation",
        d: "Une scène. Une décision. Comme au volant.",
      },
      {
        icon: "map",
        t: "Ton centre d'examen",
        d: "Décortiqué · centre par centre.",
      },
      {
        icon: "book",
        t: "Chaque leçon préparée",
        d: "Une fiche claire avant de monter en voiture.",
      },
      {
        icon: "target",
        t: "Simulation d'examen",
        // « Zéro surprise » promettait ce qu'aucune app ne peut tenir : un
        // examinateur pressé ou un giratoire inconnu suffit à le rendre faux
        // (audit confiance du 03/08/2026). On garde ce qui est vérifiable :
        // la grille de l'examen est publique, et on note dessus.
        d: "Notée sur la grille officielle de l'examen.",
      },
    ],
    mathsRows: [
      ["1 heure de conduite", "55 €"],
      ["Budget permis moyen", "1 800 €"],
      ["PermiGo, par mois", "4,99 €"],
    ],
    // « Une leçon mal préparée = 55 € de perdus » se conteste en une seconde
    // (une leçon mal préparée n'est pas une leçon perdue) et accuse l'élève
    // de gâcher son argent. La ligne dit maintenant un fait que le tableau
    // juste au-dessus démontre tout seul.
    mathsNote: "PermiGo coûte moins qu'un dixième d'heure de conduite.",
    mathsSrc: "Sources : UFC-Que Choisir (budget permis) · Sécurité routière",
    secPass: "Un seul prix. Tout est dedans.",
    secPassSub:
      "Pas de formule à choisir, pas d'engagement. Tu commences gratuitement, et le jour où tu veux la suite, c'est 4,99 € par mois. Moins de 6 minutes de conduite.",
    passes: {
      mensuel: {
        name: "Pass PermiGo",
        desc: "Tout le parcours, l'examen blanc, ta progression et tes récompenses. Annulable en un clic.",
        price: "4,99 €",
        per: "/mois",
        // « Commencer » était le mot du bouton gratuit ET du bouton payant.
        // Deux actions différentes, le même verbe : l'élève ne sait pas
        // laquelle des deux il déclenche.
        btn: "Tout débloquer",
      },
    },
    err: "Le paiement n'a pas pu démarrer. Réessaie.",
    btnWait: "Ouverture du paiement…",
    secAvis: "Ce qu'en disent nos élèves",
    secAvisSub:
      "Dix élèves de l'auto-école. Ils ont relu et validé leur phrase.",
    avisAge: "ans",
    // ⛔ RETIRÉ (03/08/2026) — le graphique « 74,7 % conduite accompagnée
    // contre 56,8 % filière classique, Sécurité routière 2022 ».
    // Les chiffres étaient vrais et sourcés. Le problème est ce qu'ils
    // faisaient là : ils comparent DEUX FILIÈRES DE CONDUITE entre elles,
    // pas les élèves PermiGo aux autres. Placés sous le titre « S'entraîner
    // régulièrement paie », juste après le prix, ils se lisaient comme la
    // preuve que l'app fait gagner 18 points de réussite. On ne l'a jamais
    // écrit, et c'est justement le problème : le lecteur le conclut seul,
    // et celui qui repère le glissement doute de tout le reste de la page.
    // On y remettra un chiffre le jour où ce sera un chiffre à NOUS
    // (échantillon, période, méthode).
    secFaq: "Questions fréquentes",
    faq: [
      [
        "C'est une app de code ?",
        "Non. Le code est inclus (quiz, examens blancs), mais la vraie différence : on t'entraîne à la <strong>conduite</strong>. Mini-jeux, fiches de leçon, simulations d'examen, centres d'examen.",
      ],
      [
        "Qu'attend l'inspecteur le jour de l'examen ?",
        "Une conduite <strong>autonome, responsable et sûre</strong> : connaître le code, maîtriser le véhicule, respecter les règles, anticiper les risques et adapter ta conduite à ce qui t'entoure. Ton attitude compte aussi : rester calme, confiant, décider au bon moment. PermiGo t'entraîne exactement là-dessus. Simulation d'examen incluse.",
      ],
      [
        "Ça marche avec mon auto-école ?",
        "Oui. Tu gardes tes leçons. PermiGo bosse entre. Si ton moniteur l'utilise, ta progression se synchronise avec lui.",
      ],
      [
        "Je galère avec le français, ça ira ?",
        "Oui. Phrases courtes, mots simples, mini-jeux visuels. Et cette page existe en anglais et en arabe (boutons EN et AR en haut). Par message, on t'aide pas à pas.",
      ],
      [
        "Je peux annuler quand je veux ?",
        `Oui. L'abonnement s'annule <strong>à tout moment en un clic</strong>, depuis Réglages. Tu pars ? <a href="#/avis-depart">Dis-nous pourquoi ici</a>. Ça nous aide à améliorer l'app.`,
      ],
    ],
    foot: `Paiement sécurisé par Stripe<br><a href="#/legal">Mentions légales</a> · <a href="#/rejoindre?solo=1">Créer un compte gratuit</a>`,
    pros: `Moniteur indépendant ? <a href="#/creer-compte">Crée ton espace</a> · Auto-école ? <a href="#/pro">Demander un devis</a>`,
    // Barre collante : le gratuit est LE bouton, l'achat passe en second rang.
    // Avant, « Ou commencer gratuitement » était un texte à gauche du bouton
    // doré : personne ne voyait qu'on pouvait cliquer dessus.
    stickyFree: "Commencer gratuitement",
    stickyPaid: "Tout débloquer · 4,99 €/mois",
    cancelNote:
      "Paiement annulé. Rien n'a été débité. Ton billet t'attend juste en dessous. 👇",
    successT: "Bienvenue dans l'aventure ! 🚀",
    successIntro: (label) =>
      `${label} réservé. Ton reçu et ta facture arrivent par email.`,
    successSteps: [
      "<b>Crée ton compte maintenant</b>. 2 minutes, avec le même email que ton paiement → accès immédiat.",
      "<b>Installe l'app sur ton téléphone</b> pour recevoir les rappels de révision : iPhone → Safari → Partager → « Sur l'écran d'accueil ». Android → Chrome → menu ⋮ → « Installer l'application ».",
      "<b>Besoin d'aide ?</b> Écris-nous : on t'aide pas à pas.",
    ],
    successCta: "Ouvrir PermiGo",
    successCtaSolo: "Créer mon compte · accès immédiat",
  },
  en: {
    login: "Log in",
    langBtn: "FR",
    kicker: "Driving school or self-taught",
    docTitle: "PermiGo. Prepare every driving lesson before you get in the car",
    h1: `Prepare every lesson <br><em>before you get in the car.</em>`,
    lead: `The app that trains your <strong>driving</strong> between lessons.`,
    tTitle: `READY BEFORE<br>EVERY LESSON`,
    tSub: "Driving · mini-games · exam simulations",
    tBoardLbl: "Start",
    tDureeLbl: "Access",
    tDuree: "ALL OF PERMIGO",
    tOffre: "Launch price",
    tPer: "per month",
    tPrice: "€4.99",
    freeCta: "Start for free",
    freeNote: "3 lessons + 1 mock test free · no card needed",
    bulle: "3 skills validated!",
    bulleSub: "this week",
    secCode: `Getting your licence takes <em>more</em> than driving.`,
    secCodeSub: "Everything that counts on test day.",
    feats: [
      {
        icon: "zap",
        t: "On-the-road mini-games",
        d: "One scene. One decision. Like behind the wheel.",
      },
      {
        icon: "map",
        t: "Your test centre",
        d: "Decoded · centre by centre.",
      },
      {
        icon: "book",
        t: "Every lesson prepped",
        d: "A clear sheet before you get in the car.",
      },
      {
        icon: "target",
        t: "Exam simulation",
        d: "Scored on the official exam grid.",
      },
    ],
    nonFranco: {
      title: "Learning in French? You keep your language.",
      txt: "The app speaks English: driving lessons, questions, mini-games. And it keeps the French right underneath, word for word. Your exam is in French, so you learn the exact words you'll hear on test day instead of guessing them.",
    },
    mathsRows: [
      ["1 hour of driving lessons", "€55"],
      ["Average licence budget (France)", "€1,800"],
      ["PermiGo, per month", "€4.99"],
    ],
    mathsNote: "PermiGo costs less than a tenth of one driving hour.",
    mathsSrc: "Sources: UFC-Que Choisir (licence budget) · Sécurité routière",
    secPass: "One price. Everything is in it.",
    secPassSub:
      "No plan to pick, no commitment. You start for free, and the day you want the rest, it is €4.99 a month. Less than 6 minutes of driving lessons.",
    passes: {
      mensuel: {
        name: "PermiGo Pass",
        desc: "The full course, the mock exam, your progress and your rewards. Cancel in one click.",
        price: "€4.99",
        per: "/mo",
        btn: "Unlock everything",
      },
    },
    err: "Payment couldn't start. Please try again.",
    btnWait: "Opening checkout…",
    secAvis: "What our students say",
    secAvisSub:
      "Ten students from the driving school. Each one read and approved their own line.",
    avisAge: "years old",
    // ⛔ Section « Regular practice pays off » retirée. Cf. le commentaire de
    // la version française : le graphique comparait deux filières de conduite
    // françaises entre elles, jamais les élèves PermiGo aux autres.
    secFaq: "Frequently asked",
    faq: [
      [
        "Is this a code-test app?",
        "No. The code test is included (quizzes, mock tests), but the real difference: we train your <strong>driving</strong>. Mini-games, lesson sheets, exam simulations, test-centre guides.",
      ],
      [
        "Is the app in English?",
        "Yes. The driving lessons, the questions, the mini-games and the mock exam are all in <strong>English</strong>. The French is kept right underneath, on purpose: your exam will be in French, and hearing the real words is what gets you through. A few corners of the app are still French only, and we're finishing them.",
      ],
      [
        "What does the examiner expect on test day?",
        "<strong>Autonomous, responsible, safe driving</strong>: knowing the code, controlling the car, following the rules, anticipating risks and adapting to your environment. Attitude counts too: stay calm, confident, decide at the right moment. That's exactly what PermiGo trains. Exam simulation included.",
      ],
      [
        "Does it work with my driving school?",
        "Yes. Keep your lessons. PermiGo works in between. If your instructor uses PermiGo, your progress syncs with them.",
      ],
      [
        "Can I cancel whenever I want?",
        `Yes. The subscription cancels <strong>anytime in one click</strong>, from Settings. Leaving? <a href="#/avis-depart">Tell us why here</a>. It helps us improve.`,
      ],
    ],
    foot: `Secure payment by Stripe<br><a href="#/legal">Legal notice</a> · <a href="#/rejoindre?solo=1">Create a free account</a>`,
    pros: `Driving instructor? <a href="#/creer-compte">Create your space</a> · Driving school? <a href="#/pro">Ask for a quote</a>`,
    stickyFree: "Start for free",
    stickyPaid: "Unlock everything · €4.99/month",
    cancelNote:
      "Payment cancelled. Nothing was charged. Your ticket is waiting below. 👇",
    successT: "Welcome aboard! 🚀",
    successIntro: (label) =>
      `${label} booked. Your receipt and invoice are on their way by email.`,
    successSteps: [
      "<b>Create your account now</b>. 2 minutes, with the same email as your payment → instant access.",
      "<b>Install the app on your phone</b> to get revision reminders: iPhone → Safari → Share → “Add to Home Screen”. Android → Chrome → ⋮ menu → “Install app”.",
      "<b>Need help?</b> Message us. We'll walk you through it, step by step.",
    ],
    successCta: "Open PermiGo",
    successCtaSolo: "Create my account · instant access",
  },
  ar: {
    login: "تسجيل الدخول",
    langBtn: "FR",
    kicker: "مدرسة قيادة أو مترشّح حر",
    docTitle: "PermiGo. حضّر كل درس قيادة قبل أن تركب السيارة",
    h1: `حضِّر كل درس <br><em>قبل أن تركب السيارة.</em>`,
    lead: `التطبيق الذي يدرّبك على <strong>القيادة</strong> بين الدروس.`,
    tTitle: `جاهز قبل<br>كل حصة`,
    tSub: "قيادة · ألعاب مصغّرة · محاكاة الامتحان",
    tBoardLbl: "الانطلاق",
    // « المدة » (la durée) devient « الوصول » (l'accès) : l'ambiguïté
    // durée/contenu de « بلا حدود » se levait mal en arabe aussi.
    tDureeLbl: "الوصول",
    tDuree: "كل PermiGo",
    tOffre: "سعر الإطلاق",
    tPer: "شهرياً",
    tPrice: "€4.99",
    freeCta: "ابدأ مجاناً",
    freeNote: "3 دروس + امتحان تجريبي هدية · بدون بطاقة بنكية",
    bulle: "تم التحقق من 3 مهارات!",
    bulleSub: "هذا الأسبوع",
    secCode: `الحصول على الرخصة يتطلّب <em>أكثر</em> من مجرّد القيادة.`,
    secCodeSub: "كل ما يهمّ يوم الامتحان.",
    feats: [
      {
        icon: "zap",
        t: "ألعاب على الطريق",
        d: "مشهد واحد. قرار واحد. كما خلف المقود.",
      },
      {
        icon: "map",
        t: "مركز امتحانك",
        d: "مفصّل · مركزاً بمركز.",
      },
      {
        icon: "book",
        t: "كل درس محضّر",
        d: "بطاقة واضحة قبل أن تركب السيارة.",
      },
      {
        icon: "target",
        t: "محاكاة الامتحان",
        d: "تُقيَّم وفق شبكة الامتحان الرسمية.",
      },
    ],
    nonFranco: {
      title: "تتعلّم القيادة بالفرنسية؟ لغتك تبقى معك.",
      txt: "التطبيق بالعربية: دروس القيادة والأسئلة والألعاب المصغّرة، مع بقاء الفرنسية أسفلها مباشرة، كلمة بكلمة. امتحانك بالفرنسية، فتتعلّم الكلمات نفسها التي ستسمعها يوم الامتحان بدل أن تخمّنها.",
    },
    mathsRows: [
      ["ساعة قيادة واحدة", "€55"],
      ["متوسط ميزانية الرخصة (فرنسا)", "€1,800"],
      ["PermiGo، شهرياً", "€4.99"],
    ],
    mathsNote: "يكلّف PermiGo أقلّ من عُشر ساعة قيادة واحدة.",
    mathsSrc: "المصادر: UFC-Que Choisir (ميزانية الرخصة) · Sécurité routière",
    secPass: "سعر واحد. كل شيء بداخله.",
    secPassSub:
      "لا صيغ تختار بينها ولا التزام. تبدأ مجاناً، وفي اليوم الذي تريد فيه البقية، السعر €4.99 شهرياً. أقل من 6 دقائق قيادة.",
    passes: {
      mensuel: {
        name: "باقة PermiGo",
        desc: "المسار كاملاً، والامتحان التجريبي، وتقدّمك ومكافآتك. ألغِ بنقرة واحدة.",
        price: "€4.99",
        per: "/شهر",
        btn: "افتح كل شيء",
      },
    },
    err: "تعذّر بدء الدفع. يُرجى المحاولة مرة أخرى.",
    btnWait: "جارٍ فتح صفحة الدفع…",
    secAvis: "ماذا يقول طلابنا",
    secAvisSub:
      "عشرة طلاب من مدرسة تعليم القيادة. كلّ واحد قرأ جملته ووافق على نشرها.",
    avisAge: "سنة",
    // ⛔ Section « التدرّب المنتظم يؤتي ثماره » retirée. Cf. le commentaire de
    // la version française.
    secFaq: "الأسئلة الشائعة",
    faq: [
      [
        "هل هذا تطبيق لاختبار الكود؟",
        "لا. اختبار الكود مُضمَّن (اختبارات قصيرة، امتحانات تجريبية)، لكن الفرق الحقيقي: نحن ندرّبك على <strong>القيادة</strong>. ألعاب مصغّرة، بطاقات الدروس، محاكاة الامتحان، أدلّة مراكز الامتحان.",
      ],
      [
        "هل التطبيق باللغة العربية؟",
        "نعم. دروس القيادة والأسئلة والألعاب المصغّرة والامتحان التجريبي كلّها <strong>بالعربية</strong>، مع بقاء الفرنسية أسفلها مباشرة، وذلك عن قصد: امتحانك سيكون بالفرنسية، وسماع الكلمات الحقيقية هو ما يساعدك على النجاح. ما زالت بعض الزوايا في التطبيق بالفرنسية وحدها، ونحن ننهيها.",
      ],
      [
        "ماذا يتوقّع الممتحن يوم الامتحان؟",
        "<strong>قيادة مستقلّة ومسؤولة وآمنة</strong>: معرفة الكود، التحكّم في السيارة، احترام القواعد، توقّع المخاطر والتكيّف مع محيطك. سلوكك مهمّ أيضاً: ابقَ هادئاً وواثقاً، وقرّر في الوقت المناسب. هذا بالضبط ما يدرّبك عليه PermiGo. مع محاكاة الامتحان.",
      ],
      [
        "هل يعمل مع مدرسة تعليم القيادة التي أتدرّب فيها؟",
        "نعم. احتفظ بدروسك. يعمل PermiGo في ما بينها. وإذا كان مدرّبك يستخدم PermiGo، يتزامن تقدّمك معه.",
      ],
      [
        "هل يمكنني الإلغاء متى شئت؟",
        `نعم. يُلغى الاشتراك <strong>في أي وقت بنقرة واحدة</strong> من الإعدادات. هل ستغادر؟ <a href="#/avis-depart">أخبرنا بالسبب هنا</a>. هذا يساعدنا على التحسّن.`,
      ],
    ],
    foot: `دفع آمن عبر Stripe<br><a href="#/legal">الإشعارات القانونية</a> · <a href="#/rejoindre?solo=1">أنشئ حساباً مجانياً</a>`,
    pros: `مدرّب قيادة مستقل؟ <a href="#/creer-compte">أنشئ مساحتك</a> · مدرسة قيادة؟ <a href="#/pro">اطلب عرض سعر</a>`,
    stickyFree: "ابدأ مجاناً",
    stickyPaid: "افتح كل شيء · €4.99/شهر",
    cancelNote:
      "تمّ إلغاء الدفع. لم يُخصم أي مبلغ. تذكرتك في انتظارك أدناه. 👇",
    successT: "مرحباً بك على متن الرحلة! 🚀",
    successIntro: (label) =>
      `تمّ حجز ${label}. سيصلك إيصالك وفاتورتك عبر البريد الإلكتروني.`,
    successSteps: [
      "<b>أنشئ حسابك الآن</b>. دقيقتان، بنفس البريد الإلكتروني المستخدَم في الدفع ← وصول فوري.",
      "<b>ثبّت التطبيق على هاتفك</b> لتصلك تذكيرات المراجعة: آيفون ← Safari ← مشاركة ← «إضافة إلى الشاشة الرئيسية». أندرويد ← Chrome ← قائمة ⋮ ← «تثبيت التطبيق».",
      "<b>تحتاج مساعدة؟</b> راسلنا. سنرافقك خطوة بخطوة.",
    ],
    successCta: "افتح PermiGo",
    successCtaSolo: "أنشئ حسابي · وصول فوري",
  },
};

// ─── Avis d'élèves ────────────────────────────────────────────────
// Dix élèves de l'auto-école, tous validés par eux avant publication le
// 01/08/2026 (procédure et accords écrits : docs/PREUVES-A-COLLECTER).
// Prénom + initiale, jamais le nom entier.
//
// ⚠️ La version française est celle qu'ils ont validée, fautes comprises :
// un avis réel n'est pas relu, et une grappe de témoignages sans une seule
// faute se lit comme un texte écrit par la maison. Les traductions, elles,
// sont propres — on ne fabrique pas les fautes de quelqu'un dans une langue
// qu'il n'a pas écrite.
//
// ORDRE DES TROIS PREMIERS (ce sont eux qui s'affichent sous la démo) :
//  1. Leo raconte EXACTEMENT la promesse de la page (arriver à sa leçon en
//     sachant quoi faire, stresser moins). Il était troisième, donc le seul
//     avis qui prouve le titre passait après deux avis qui parlent d'autre
//     chose. Il passe premier.
//  2. et 3. Salah (56 ans) et Lassaad (43 ans) suivent immédiatement : ils
//     cassent l'idée d'une app pour ados, première objection d'un visiteur de
//     40 ans. Ils restent tous les deux au-dessus du pli, l'objection tombe
//     aussi vite qu'avant.
const AVIS = [
  {
    n: "Leo C.",
    age: 32,
    fr: "Avant j'arrivais à ma leçon sans savoir ce qu'on allait faire. Maintenant je sais et je stresse beaucoup moins.",
    en: "I used to turn up to my lesson with no idea what we'd be doing. Now I know, and I stress far less.",
    ar: "كنتُ أصل إلى الحصة دون أن أعرف ماذا سنفعل. الآن أعرف، وتوتّري أقلّ بكثير.",
  },
  {
    n: "Salah S.",
    age: 56,
    fr: "Je croyais que c'était un truc pour les jeunes. en fait sa m'a remis dedans",
    en: "I thought this was a thing for kids. turns out it got me back into it",
    ar: "ظننتُ أنه شيء للشباب. لكنه في الحقيقة أعادني إلى الأجواء",
  },
  {
    n: "Lassaad S.",
    age: 43,
    fr: "Je révise en arabe et le mot francais est juste en dessous. c'est sa qui m'a débloqué",
    en: "I revise in Arabic and the French word sits right underneath. that's what unlocked it for me",
    ar: "أراجع بالعربية والكلمة الفرنسية تحتها مباشرة. هذا ما فكّ عقدتي",
  },
  {
    n: "Regis T.",
    age: 30,
    fr: "La priorité à droite je la ratais à chaque fois. La façon dont c'est expliqué m'est resté.",
    en: "I got priority to the right wrong every single time. The way it's explained here stuck with me.",
    ar: "كنتُ أخطئ في أولوية اليمين في كل مرة. طريقة الشرح هنا رسخت عندي.",
  },
  {
    n: "Ismael S.",
    age: 21,
    fr: "5 min le soir dans mon lit et le lendemain en voiture je m'en souviens. franchement ça marche",
    en: "5 min in bed at night and the next day in the car I remember it. honestly it works",
    ar: "5 دقائق في السرير مساءً، وفي اليوم التالي داخل السيارة أتذكّرها. صدقاً إنها تنفع",
  },
  {
    n: "Setu P.",
    age: 37,
    fr: "mon probleme c'est le français des questions. ici le mot est expliqué simplement, merci beaucoup",
    en: "my problem is the French in the questions. here the word is explained simply, thank you very much",
    ar: "مشكلتي هي الفرنسية في الأسئلة. هنا تُشرح الكلمة ببساطة، شكراً جزيلاً",
  },
  {
    n: "Benoît M.",
    age: 23,
    fr: "mon moniteur repete moins les memes choses, on conduit au lieu de reexpliquer 👍",
    en: "my instructor repeats himself less, we drive instead of going over it again 👍",
    ar: "مدرّبي صار يكرّر أقل، صرنا نقود بدل إعادة الشرح 👍",
  },
  {
    n: "Aimé A.",
    age: 26,
    fr: "l'examen blanc m'a fait mal 😅 mais au moins j'ai su quoi travailler avant le vrai",
    en: "the mock test hurt 😅 but at least I knew what to work on before the real one",
    ar: "الامتحان التجريبي كان قاسياً 😅 لكنني عرفتُ على الأقل ما عليّ العمل عليه قبل الحقيقي",
  },
  {
    n: "Sumbal K.",
    age: 29,
    fr: "Une heure de conduite ça coute cher. arriver en sachant quoi faire c'est de l'argent que je jette pas",
    en: "An hour behind the wheel is expensive. turning up knowing what to do is money I'm not throwing away",
    ar: "ساعة القيادة مكلفة. أن تصل وأنت تعرف ماذا تفعل يعني مالاً لا ترميه",
  },
  {
    n: "Sherif N.",
    age: 26,
    fr: "Je vois enfin ou j'en suis. avant j'avançais sans savoir si je progressais",
    en: "I can finally see where I stand. before, I was moving along with no idea if I was improving",
    ar: "أخيراً أرى أين وصلت. من قبل كنتُ أتقدّم دون أن أعرف إن كنتُ أتحسّن",
  },
];

// ⚠️ <bdi> autour du nom : dans la page en arabe (conteneur dir="rtl"), le
// point final d'un nom latin saute à gauche et « Regis T. » s'affiche
// « .Regis T ». <bdi> isole la direction du fragment, c'est fait pour ça.

/** Initiales pour la pastille (« Salah S. » → « SS »). */
function avisInitiales(nom) {
  return nom
    .split(/\s+/)
    .map((m) => m[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Rend une tranche d'avis.
 * @param {number} from index de départ
 * @param {number} to   index de fin (exclu)
 */
function renderAvis(lang, L, from, to) {
  const ans = L.avisAge;
  return AVIS.slice(from, to)
    .map(
      (a) => `
      <figure class="pv-avis">
        <blockquote>${esc(a[lang] || a.fr)}</blockquote>
        <figcaption>
          <span class="pv-avis-ini" aria-hidden="true">${esc(avisInitiales(a.n))}</span>
          <span class="pv-avis-qui"><b><bdi>${esc(a.n)}</bdi></b><span>${a.age} ${esc(ans)}</span></span>
        </figcaption>
      </figure>`,
    )
    .join("");
}

// Montants en euros, pour la mesure publicitaire uniquement (Meta apprend « qui
// achète combien »). ⚠️ Ce n'est PAS ce qui est facturé : le vrai prix vit dans
// l'edge function pass-checkout, côté serveur.
// ⚠️ pass3 / pass6 ne sont PLUS vendus (décision Rayan, 02/08/2026 : un seul
// prix à 4,99 €/mois, fini le billet Or). Leurs valeurs restent ici pour les
// anciens acheteurs qui reviennent sur #/pass?checkout=success&plan=pass3.
const PLAN_VALUE = { mensuel: 4.99, pass3: 24.99, pass6: 39.99 };

const PLAN_LABELS = {
  fr: {
    mensuel: "Pass PermiGo",
    pass3: "Billet Or · 3 mois",
    pass6: "Billet Platine · 6 mois",
  },
  en: {
    mensuel: "PermiGo Pass",
    pass3: "Gold Ticket · 3 months",
    pass6: "Platinum Ticket · 6 months",
  },
  ar: {
    mensuel: "باقة PermiGo",
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
    font-family: 'Archivo', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    --in:#6c63ff;--in-lt:#8e87ff;--in-dp:#4a3fc9;--in-dk:#372fa3;
    --gold:#ffce4d;--gold-dp:#e8a317;--go:#58cc02;
    --pv-ink:#f4f1ff;--ink-soft:#cdc8ec;--ink-mu:#aaa2d8;--ink-dim:#8b7fc4;
    --tik-ink:#3a2a05;--tik-mu:#6b520f;--tik-lbl:#8a6a17;
    color: var(--pv-ink);
    background:
      radial-gradient(100% 46% at 50% -4%, rgba(255,206,77,.16), transparent 58%),
      linear-gradient(180deg, #1b1240 0%, #241a4d 50%, #170f38 100%);
    background-color:#1b1240;
    padding-bottom: calc(104px + env(safe-area-inset-bottom));
    overflow-x: clip;
  }
  .pv * { box-sizing: border-box; }
  .pv-wrap { max-width: 480px; margin: 0 auto; padding: 0 18px; }
  .pv-hero-wrap { display: contents; }

  /* ══════════ Desktop : la colonne s'élargit, le hero passe à côté de la
     démo. En dessous de 860px rien ne change, c'est encore le même mobile. ══════════ */
  @media (min-width: 860px) {
    .pv-nav, .pv-wrap { max-width: 640px; }
    .pv-hero-wrap {
      display: flex; align-items: center; gap: 40px;
      text-align: start; padding-top: 18px;
    }
    .pv-hero-wrap .pv-hero { flex: 0 0 42%; text-align: start; padding-top: 0; }
    .pv-hero-wrap .pv-lead { margin: 0; }
    .pv-hero-wrap #pv-demo { flex: 1 1 0; min-width: 0; }
    .pv-avis-lot {
      flex-wrap: wrap; overflow: visible; scroll-snap-type: none;
      margin-inline: 0; padding: 2px 0 6px;
    }
    .pv-avis-lot .pv-avis { flex: 0 0 calc(33.33% - 8px); max-width: none; }
  }
  @media (min-width: 1240px) {
    .pv-nav, .pv-wrap { max-width: 720px; }
  }

  /* ══════════ La mise en scène au défilement ══════════
     Avant : les 14 blocs montaient tous de 24 px de la même façon. Un seul
     geste répété 14 fois ne se remarque pas, la page semblait figée.
     Maintenant chaque famille a son entrée, et ce qui est GROUPÉ arrive
     en cascade au lieu d'apparaître d'un bloc.
     Règle tenue partout : on n'anime que transform et opacity. */
  .pv { --pv-ease: cubic-bezier(.23,1,.32,1); --pv-in: .62s; }

  .pv-rev { opacity: 0; transform: translateY(26px) scale(.988); transition: opacity var(--pv-in) ease, transform var(--pv-in) var(--pv-ease); }
  .pv-rev.in { opacity: 1; transform: none; }

  /* Conteneur en cascade : le parent ne bouge pas, ses enfants entrent un
     par un (délai posé en JS, plafonné pour que la fin reste vive). */
  .pv-rev.pv-stag { opacity: 1; transform: none; transition: none; }
  .pv-stag > * { opacity: 0; transform: translateY(20px); transition: opacity .5s ease, transform .5s var(--pv-ease); }
  .pv-stag.in > * { opacity: 1; transform: none; }

  /* Le PREMIER écran. Il n'avait aucune entrée : les 14 apparitions vivaient
     toutes sous la ligne de flottaison, donc l'écran de chargement laissait
     place à une page déjà posée, d'un bloc. Il se lève maintenant pendant que
     le splash s'efface (signal permigo:splash-out, voir wireReveal). */
  #pv-demo.pv-rev { transition-delay: .14s; }
  .pv-avis-haut.pv-rev { transition-delay: .26s; }

  /* Titres de section : le texte se découvre par le bas, comme tiré
     de dessous une ligne. Plus net qu'un simple fondu. */
  .pv-sec-title.pv-rev { transform: none; transition: opacity .4s ease; overflow: hidden; }
  .pv-sec-title.pv-rev > span { display: inline-block; transform: translateY(105%); transition: transform .72s var(--pv-ease); }
  .pv-sec-title.pv-rev.in > span { transform: none; }


  @media (prefers-reduced-motion: reduce) {
    .pv-rev, .pv-stag > *, .pv-sec-title.pv-rev, .pv-sec-title.pv-rev > span { opacity: 1; transform: none; transition: none; }
  }

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
    font: 800 12.5px/1 'Archivo', sans-serif; letter-spacing: .04em;
    color: rgba(255,255,255,.62); background: none; border: 0;
    border-radius: 999px; padding: 7px 13px; cursor: pointer;
    transition: background .16s ease, color .16s ease;
  }
  .pv-lang-opt.on { color: #1a1030; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.28); }
  .pv-lang-opt:not(.on):active { background: rgba(255,255,255,.14); }
  .pv-login { font: 700 14px/1 'Archivo', sans-serif; color: var(--ink-soft); background: none; border: 0; padding: 10px 8px; cursor: pointer; border-radius: 12px; }

  /* ── Hero ── */
  .pv-hero { text-align: center; padding-top: 10px; }
  .pv-kicker { font: 700 12px/1 'Archivo', sans-serif; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-mu); }
  .pv-h1 { font: 800 clamp(30px, 8.4vw, 40px)/1.06 'Archivo', sans-serif; color: var(--pv-ink); margin: 9px 0 8px; text-shadow: 0 3px 0 rgba(12,7,32,.8); }
  .pv-h1 em { font-style: normal; color: var(--gold); }
  .pv-lead { font: 600 14.5px/1.5 'Archivo', sans-serif; color: var(--ink-soft); max-width: 330px; margin: 0 auto; }
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
  /* Pas de logo sur le billet : le badge de marque est violet foncé, il faisait
     une pastille sombre en plein milieu de l'or (décision Rayan, 01/08/2026).
     Le mot PERMIGO suffit — il était déjà juste à côté. */
  .pv-t-brand { display: flex; align-items: center; letter-spacing: .08em; font: 800 14px/1 'Archivo', sans-serif; text-shadow: 0 1px 0 rgba(255,255,255,.4); }
  .pv-t-title { font: 800 23px/1.05 'Archivo', sans-serif; margin: 9px 0 3px; letter-spacing: -.01em; text-shadow: 0 1px 0 rgba(255,255,255,.45), 0 -1px 0 rgba(90,60,5,.3); }
  .pv-t-sub { font: 600 11.5px/1.4 'Archivo', sans-serif; color: var(--tik-mu); }
  .pv-t-meta { display: flex; gap: 14px; margin-top: 12px; }
  .pv-t-meta div b { display: block; font: 700 10px/1 'Archivo', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--tik-lbl); margin-bottom: 2px; }
  .pv-t-meta div span { font: 600 13px/1 'IBM Plex Mono', monospace; }
  /* L'arabe n'a pas de glyphes dans IBM Plex Mono : le mois se disloquait
     (« أ غسطس »). On repasse sur la police de marque pour le billet en arabe. */
  .pv[dir="rtl"] .pv-t-meta div span { font-family: 'Archivo', sans-serif; }
  .pv-t-stub .n { font: 700 9.5px/1.25 'Archivo', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: var(--tik-lbl); }
  /* Plus de prix barré sur le talon : à 4,99 € il n'y a plus de remise à
     montrer, et un faux « avant » sur un si petit prix ne trompe personne. */
  .pv-t-per { font: 700 10.5px/1 'Archivo', sans-serif; color: var(--tik-lbl); }
  .pv-t-price { font: 800 22px/1 'Archivo', sans-serif; text-shadow: 0 1px 0 rgba(255,255,255,.45); }
  .pv-t-check { font: 800 30px/1 'Archivo', sans-serif; text-shadow: 0 1px 0 rgba(255,255,255,.45); }
  .pv-t-barcode {
    width: 64px; height: 30px; border-radius: 3px; opacity: .85; margin-top: 4px;
    background: repeating-linear-gradient(90deg, #3a2a05 0 2px, transparent 2px 5px, #3a2a05 5px 6px, transparent 6px 10px);
    box-shadow: 0 1px 0 rgba(255,255,255,.35);
  }

  /* LA porte de la page, et la seule sous le billet : elle prend l'or, la
     couleur la plus forte de la page. Elle etait verte, a cote d'un bouton
     d'achat dore qui gagnait le regard a tous les coups. Le bouton d'achat est
     parti, l'or revient a ce qu'on veut vraiment faire cliquer.
     Encre brune et pas du blanc : sur cet or, blanc tombe a 1,6 de contraste. */
  .pv-cta-free {
    display: block; width: 100%; max-width: 340px; margin: 26px auto 0;
    border: 0; cursor: pointer; border-radius: 18px; padding: 17px;
    font: 800 17px/1 'Archivo', sans-serif; color: #4a3300; text-shadow: 0 1px 0 rgba(255,255,255,.35);
    background: linear-gradient(180deg, #ffe08a, var(--gold) 55%, var(--gold-dp));
    box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 6px 0 #a86e00, 0 12px 26px rgba(0,0,0,.4);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pv-cta-free:active { transform: translateY(4px); box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 2px 0 #a86e00, 0 4px 8px rgba(0,0,0,.3); }
  .pv-free-note { text-align: center; font: 600 12.5px/1.6 'Archivo', sans-serif; color: var(--ink-mu); margin: 10px 0 18px; }

  /* ── Scène téléphone + mascotte ── */
  /* MOMENT SIGNATURE 1 — le téléphone se redresse.
     Il entre couché en arrière puis se relève jusqu'à la verticale. C'est
     le seul endroit de la page qui utilise la 3D : ça doit rester un
     événement, pas un tic. La perspective vit sur le parent pour que la
     mascotte et le volant tournent AVEC l'écran, pas chacun de leur côté. */
  .pv-stage { position: relative; height: 470px; max-width: 400px; margin: 44px auto 0; perspective: 1200px; }
  .pv-stage.pv-rev { transform: translateY(46px) scale(.93); transition: opacity .5s ease, transform .9s var(--pv-ease); }
  .pv-stage.pv-rev > * { transform-origin: 50% 100%; transition: transform .95s var(--pv-ease); }
  .pv-stage.pv-rev:not(.in) > * { transform: rotateX(16deg); }
  .pv-stage.pv-rev.in { transform: none; }
  @media (prefers-reduced-motion: reduce) {
    .pv-stage.pv-rev, .pv-stage.pv-rev > * { transform: none; transition: none; }
  }
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
    font: 700 13px/1.3 'Archivo', sans-serif; box-shadow: 0 8px 20px rgba(0,0,0,.4);
  }
  /* #8a7a52 sur blanc ne donnait que 4,21 de contraste, l'AA en demande 4,5
     (mesuré à l'axe le 01/08). Même brun doré, deux crans plus foncé : 5,28. */
  .pv-bulle small { display: block; color: #7a6a45; font-weight: 600; font-size: 11px; }

  /* ── Sections ── */
  .pv-sec-title {
    text-align: center; font: 800 clamp(24px, 7vw, 28px)/1.15 'Archivo', sans-serif;
    color: var(--pv-ink); margin: 64px 0 0; text-shadow: 0 3px 0 rgba(12,7,32,.8);
  }
  .pv-sec-title em { font-style: normal; color: var(--gold); }
  .pv-sec-sub { text-align: center; font: 600 13.5px/1.55 'Archivo', sans-serif; color: var(--ink-mu); margin: 10px auto 26px; max-width: 340px; }

  /* ── Cartes atouts : une seule famille de carte, une seule famille d'icône
     (icon(), le même trait que perk0/1/2 du mur découverte). Avant : une
     capture d'écran qui rejouait en photo la scène qu'on venait de faire
     JOUER plus haut, et deux médailles 3D en photo à côté d'un trait fin —
     deux langages d'icône sur la même page. */
  .pv-feats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .pv-feat {
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
    border-radius: 18px; padding: 16px 14px;
  }
  /* .pv-feat .pv-feat-ico et pas .pv-feat-ico seul : l'icône ET le sous-texte
     sont tous deux des <span> enfants directs de .pv-feat. La règle générique
     .pv-feat span ci-dessous a la même spécificité qu'un simple .pv-feat-ico
     et gagnait au dernier défini — l'icône se peignait en gris terne au lieu
     du doré (constaté à l'écran, couleur réelle vérifiée : rgb(170,162,216),
     celle du texte, pas var(--gold)). */
  .pv-feat .pv-feat-ico {
    display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 12px;
    border-radius: 12px; background: rgba(255,206,77,.14); color: var(--gold);
  }
  .pv-feat b { display: block; font: 800 14.5px/1.25 'Archivo', sans-serif; margin-bottom: 4px; }
  .pv-feat span { display: block; font: 600 12px/1.45 'Archivo', sans-serif; color: var(--ink-mu); }

  /* Bloc non-francophones (version EN uniquement) */
  .pv-franco {
    margin-top: 12px; padding: 16px; border-radius: 18px; text-align: left;
    background: rgba(108,99,255,.14); border: 1.5px solid rgba(142,135,255,.4);
    display: flex; gap: 12px; align-items: flex-start;
  }
  .pv-franco-flag { font-size: 24px; line-height: 1; margin-top: 2px; }
  .pv-franco b { display: block; font: 800 15.5px/1.3 'Archivo', sans-serif; margin-bottom: 4px; }
  .pv-franco span { font: 600 13px/1.5 'Archivo', sans-serif; color: var(--ink-soft); }

  /* ── L'addition ── */
  .pv-maths { margin-top: 22px; border-radius: 20px; padding: 8px 18px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); }
  .pv-maths-row { display: flex; justify-content: space-between; align-items: baseline; padding: 13px 0; font: 500 14px 'Archivo', sans-serif; color: var(--ink-soft); }
  .pv-maths-row + .pv-maths-row { border-top: 1px dashed rgba(255,255,255,.1); }
  /* MOMENT SIGNATURE 2 — les trois prix défilent jusqu'à leur valeur.
     La police à chasse fixe fige la largeur des chiffres, sinon la ligne tremble
     pendant le comptage. */
  .pv-maths-row b { font: 700 16px 'Archivo', sans-serif; color: #fff; font-variant-numeric: tabular-nums; }
  .pv-maths-row.hot { color: var(--gold); }
  .pv-maths-row.hot b { color: var(--gold); font-size: 18px; }
  /* La source était en 10,5px sur #655a97, soit 2,6:1 de contraste sur le
     fond violet quand l'AA en demande 4,5. Citer ses sources et les rendre
     illisibles, c'est se donner l'air de citer ses sources. 12,5px sur
     --ink-mu : 6,7:1. Et la note passe de --ink-dim (4,46:1, juste sous la
     barre) à --ink-soft. */
  .pv-maths-note { text-align: center; font: 600 13.5px/1.6 'Archivo', sans-serif; color: var(--ink-soft); margin: 12px 0 0; }
  .pv-maths-src { text-align: center; font: 500 12.5px/1.5 'Archivo', sans-serif; color: var(--ink-mu); margin: 8px 0 0; }

  /* ── Le billet (il n'y en a plus qu'un) ── */
  .pv-pass { position: relative; display: flex; border-radius: 18px; margin-bottom: 14px; box-shadow: 0 14px 28px rgba(0,0,0,.4); }
  .pv-pass-main { flex: 1; padding: 16px 14px 15px 18px; border-radius: 18px 0 0 18px; }
  .pv-pass-cut {
    width: 118px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px;
    padding: 12px 8px; border-left: 2px dashed rgba(255,255,255,.25); border-radius: 0 18px 18px 0;
  }
  .pv-pass-name { font: 800 17px/1.2 'Archivo', sans-serif; }
  .pv-pass-desc { font: 600 12.5px/1.45 'Archivo', sans-serif; color: var(--ink-mu); margin-top: 3px; }
  /* nowrap obligatoire : l'espace de « 4,99 € » est un point de coupure, et le
     talon ne fait que 118 px — sans ça le « € » tombait sur la ligne du dessous. */
  .pv-pass-price { font: 800 23px/1.15 'Archivo', sans-serif; white-space: nowrap; }
  .pv-pass-price small { font-size: 12px; color: var(--ink-mu); }
  .pv-pass-btn {
    border: 0; cursor: pointer; border-radius: 12px; padding: 11px 14px; width: 100%;
    font: 800 13.5px 'Archivo', sans-serif; color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.25);
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 4px 0 var(--in-dk);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pv-pass-btn:active { transform: translateY(3px); box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 1px 0 var(--in-dk); }
  .pv-pass-btn[disabled] { opacity: .65; cursor: wait; }

  .pv-pass-gold {
    transform: scale(1.04); margin: 24px 0 40px;
    background:
      radial-gradient(120% 90% at 15% 0%, rgba(255,255,255,.45), transparent 40%),
      linear-gradient(115deg, #f6d267 0%, #ffe9a8 25%, #eab63a 55%, #d99c1e 100%);
    color: var(--tik-ink);
    box-shadow: inset 0 2px 0 rgba(255,255,255,.7), inset 0 -3px 6px rgba(122,85,16,.5), 0 20px 40px rgba(0,0,0,.5), 0 0 60px rgba(255,206,77,.25);
  }
  .pv-pass-gold .pv-pass-name { text-shadow: 0 1px 0 rgba(255,255,255,.4); }
  .pv-pass-gold .pv-pass-desc { color: var(--tik-mu); }
  .pv-pass-gold .pv-pass-cut { border-left-color: rgba(58,42,5,.4); background: rgba(255,255,255,.14); }
  .pv-pass-gold .pv-pass-price small { color: var(--tik-mu); }
  .pv-pass-gold .pv-pass-btn {
    background: linear-gradient(180deg, var(--in-dp), var(--in-dk));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.3), 0 4px 0 #241c6e;
  }
  .pv-err { font: 700 13px/1.4 'Archivo', sans-serif; color: #ffb4a8; text-align: center; margin: 4px 0 0; display: none; }
  .pv-err.on { display: block; }

  /* ── Avis d'élèves (validés par eux, cf. docs/PREUVES-A-COLLECTER) ──
     Carrousel horizontal, pas un mur vertical : 10 cartes empilées faisaient
     défiler l'écran sur près de 3000 px pour cette seule section. Le
     « peek » de la carte suivante (78 % de largeur) dit « il y en a
     d'autres » sans un mot ni un point de pagination. */
  .pv-avis-lot {
    display: flex; gap: 12px; margin-top: 20px;
    overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
    margin-inline: -18px; padding: 2px 18px 6px; scrollbar-width: none;
  }
  .pv-avis-lot::-webkit-scrollbar { display: none; }
  .pv-avis {
    flex: 0 0 78%; max-width: 320px; scroll-snap-align: start;
    margin: 0; padding: 15px 16px; border-radius: 18px;
    background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.1);
  }
  .pv-avis blockquote {
    margin: 0 0 12px; font: 500 14.5px/1.55 'Archivo', sans-serif; color: var(--pv-ink);
  }
  /* Guillemets écrits en clair : dans un littéral de gabarit JS, un
     échappement CSS « \\201C » est lu par JS avant CSS et casse le build. */
  .pv-avis blockquote::before { content: "“"; }
  .pv-avis blockquote::after { content: "”"; }
  .pv-avis figcaption { display: flex; align-items: center; gap: 10px; }
  .pv-avis-ini {
    flex: 0 0 34px; width: 34px; height: 34px; border-radius: 50%;
    display: grid; place-items: center;
    background: linear-gradient(180deg, #4a3fc9, #2f2688);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.22);
    font: 800 12px/1 'Archivo', sans-serif; color: #fff; letter-spacing: .04em;
  }
  .pv-avis-qui { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .pv-avis-qui b { font: 800 13px/1.2 'Archivo', sans-serif; color: var(--pv-ink); }
  /* --ink-mu et pas --ink-dim : en 11,5 px sur le fond nuit, --ink-dim tombe
     autour de 3,6 de contraste quand l'AA en demande 4,5. Même leçon que la
     carte de date de naissance le 01/08. */
  .pv-avis-qui span { font: 600 11.5px/1.2 'Archivo', sans-serif; color: var(--ink-mu); }

  /* Le bloc « Preuve » (.pv-proof, .pv-bar*, .pv-src) est retiré avec son
     graphique le 03/08/2026. Rien d'autre ne l'utilisait. */

  /* ── FAQ ── */
  .pv-faq details { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 0 15px; margin-bottom: 9px; }
  .pv-faq summary {
    font: 700 14.5px/1.4 'Archivo', sans-serif; padding: 14px 0; cursor: pointer; list-style: none;
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
  }
  .pv-faq summary::-webkit-details-marker { display: none; }
  .pv-faq summary::after { content: "+"; font: 800 19px/1 'Archivo', sans-serif; color: var(--gold); flex: none; }
  .pv-faq details[open] summary::after { content: "–"; }
  .pv-faq p { font: 600 13.5px/1.55 'Archivo', sans-serif; color: var(--ink-soft); margin: 0 0 14px; }
  .pv-faq a { color: var(--gold); }

  .pv-foot { text-align: center; padding: 36px 0 10px; font: 600 12px/1.7 'Archivo', sans-serif; color: var(--ink-dim); }
  .pv-foot a { color: var(--ink-soft); }
  /* Moniteurs et auto-écoles : deux segments payants qui n'avaient aucune porte
     (la page #/pro n'était liée depuis nulle part). */
  .pv-foot-pros { display: inline-block; margin-top: 10px; color: var(--ink-dim); }

  /* ── Barre CTA collante ── */
  .pv-sticky {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
    transition: bottom .42s cubic-bezier(.22,1,.32,1), transform .34s cubic-bezier(.22,1,.32,1);
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    background: rgba(18,11,44,.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border-top: 1.5px solid rgba(255,206,77,.25);
  }
  /* Elle s'efface UNIQUEMENT pendant que le bouton « Commencer gratuitement »
     du corps de page est à l'écran : les deux disaient EXACTEMENT la même
     chose l'un sous l'autre (mesuré à l'écran le 03/08/2026 — la barre est
     fixed, donc toujours montée, et venait se coller pile sous ce bouton).
     wireStickyReveal() bascule la classe via IntersectionObserver. */
  /* Pas juste 120% : quand le bandeau cookies est ouvert, la propriété bottom
     relève déjà la barre de ~150 px (règle body.ck-open juste en dessous).
     120% de sa propre hauteur ne suffit plus à la faire sortir de l'écran
     dans ce cas précis (mesuré en test : elle restait visible, translatée
     mais toujours dans le cadre). +180px de marge fixe couvre ce cas en plus
     de sa hauteur. */
  .pv-sticky.pv-sticky-hide { transform: translateY(calc(100% + 180px)); }
  /* Le bandeau cookies est en z-index 9000 et se pose en bas : il RECOUVRAIT
     cette barre, donc le bouton du compte gratuit et le bouton d'achat, tant
     que le visiteur n'avait pas répondu (mesuré en prod le 01/08/2026). La
     barre se lève au-dessus de lui le temps qu'il choisisse. --ck-h est
     publiée par cookie-banner.js ; le repli couvre le cas où elle manque. */
  body.ck-open .pv-sticky {
    bottom: calc(var(--ck-h, 96px) + 20px + env(safe-area-inset-bottom, 0px));
  }
  @media (prefers-reduced-motion: reduce) { .pv-sticky, .pv-sticky.pv-sticky-hide { transition: none; transform: none; } }
  /* La barre collante se lit de haut en bas, plus de gauche à droite : le
     gratuit est LE bouton, l'achat est la ligne d'en dessous. Avant, « Ou
     commencer gratuitement » était un simple texte collé à gauche d'un gros
     bouton doré — rien ne disait qu'on pouvait cliquer dessus, et le visiteur
     lisait un prix avant d'avoir essayé quoi que ce soit. */
  .pv-sticky-inner {
    display: flex; flex-direction: column; align-items: stretch; gap: 7px;
    width: 100%; max-width: 400px; margin: 0 auto;
  }
  /* Meme or que la porte gratuite du corps de page : une seule couleur pour
     « commencer », partout, du haut en bas. */
  .pv-sticky-free {
    border: 0; cursor: pointer; border-radius: 14px; padding: 14px;
    font: 800 16px/1 'Archivo', sans-serif; color: #4a3300; text-shadow: 0 1px 0 rgba(255,255,255,.35);
    background: linear-gradient(180deg, #ffe08a, var(--gold) 55%, var(--gold-dp));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.5), 0 4px 0 #a86e00;
    -webkit-tap-highlight-color: transparent;
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pv-sticky-free:active { transform: translateY(3px); box-shadow: inset 0 2px 0 rgba(255,255,255,.5), 0 1px 0 #a86e00; }
  /* Se déclenche à la bonne réponse de la démo (cf. onCorrect, plus bas dans
     ce fichier) : la porte gratuite existe déjà, en permanence, sous le
     pouce. Au lieu d'en fabriquer une seconde à cet instant précis, celle-ci
     réagit. Classe retirée puis reposée en JS pour rejouer l'anim si l'élève
     relance la démo une seconde fois. */
  .pv-sticky-free.pv-pulse { animation: pvStickyPulse 1.7s ease-out; }
  @keyframes pvStickyPulse {
    0%, 100% { box-shadow: inset 0 2px 0 rgba(255,255,255,.5), 0 4px 0 #a86e00; }
    20% { box-shadow: inset 0 2px 0 rgba(255,255,255,.7), 0 4px 0 #a86e00, 0 0 0 8px rgba(255,206,77,.3); }
    45% { box-shadow: inset 0 2px 0 rgba(255,255,255,.5), 0 4px 0 #a86e00, 0 0 0 0 rgba(255,206,77,0); }
  }
  @media (prefers-reduced-motion: reduce) { .pv-sticky-free.pv-pulse { animation: none; } }
  /* L'achat reste accessible en permanence, mais discret. En encre douce et
     plus en or : l'or appartient maintenant au bouton juste au-dessus, et deux
     ors cote a cote, c'est deux appels au meme moment. */
  .pv-sticky-paid {
    border: 0; background: none; cursor: pointer; padding: 2px 6px 1px;
    font: 800 13px/1.3 'Archivo', sans-serif; color: var(--ink-soft);
    text-decoration: underline; text-underline-offset: 3px;
    -webkit-tap-highlight-color: transparent;
  }
  .pv-sticky-paid[disabled] { opacity: .6; cursor: wait; }

  /* ── Retour checkout ── */
  .pv-result { max-width: 400px; margin: 26px auto 0; filter: drop-shadow(0 30px 40px rgba(0,0,0,.55)); }
  .pv-result-title { text-align: center; color: var(--pv-ink); font: 800 26px/1.2 'Archivo', sans-serif; margin: 26px 0 6px; text-shadow: 0 3px 0 rgba(12,7,32,.8); }
  .pv-result-intro { text-align: center; font: 600 14px/1.55 'Archivo', sans-serif; color: var(--ink-soft); max-width: 340px; margin: 0 auto 20px; }
  .pv-steps { display: flex; flex-direction: column; gap: 10px; counter-reset: pvstep; max-width: 440px; margin: 0 auto; }
  .pv-step {
    display: flex; gap: 12px; align-items: flex-start; text-align: left;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); border-radius: 16px; padding: 13px 14px;
    font: 600 13.5px/1.5 'Archivo', sans-serif; color: var(--ink-mu);
  }
  .pv-step b { color: var(--pv-ink); }
  .pv-step::before {
    counter-increment: pvstep; content: counter(pvstep);
    flex: none; width: 28px; height: 28px; display: grid; place-items: center;
    font: 800 14px/1 'Archivo', sans-serif; color: #4a3300;
    background: linear-gradient(180deg, #ffe08a, var(--gold) 60%, var(--gold-dp));
    border-radius: 50%; box-shadow: inset 0 1.5px 0 rgba(255,255,255,.55), 0 2.5px 0 #a86e00;
  }
  .pv-result-cta {
    display: block; width: 100%; max-width: 320px; margin: 20px auto 0;
    border: 0; cursor: pointer; border-radius: 16px; padding: 15px;
    font: 800 16px/1 'Archivo', sans-serif; color: #fff; text-shadow: 0 1.5px 0 rgba(0,0,0,.3);
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2.5px 0 rgba(255,255,255,.35), 0 5px 0 var(--in-dk), 0 9px 16px rgba(0,0,0,.35);
  }
  .pv-cancel-note {
    max-width: 444px; margin: 14px auto 0; padding: 12px 16px;
    background: rgba(255,206,77,.1); border: 1.5px solid rgba(255,206,77,.35); border-radius: 14px;
    font: 700 13.5px/1.5 'Archivo', sans-serif; color: var(--ink-soft); text-align: center;
  }
</style>`;

/** Query params du hash (#/pass?checkout=success&plan=pass3&lang=en). */
function hashQuery() {
  const q = (location.hash.split("?")[1] || "").trim();
  return new URLSearchParams(q);
}

/** Langue : choix mémorisé > ?lang= > langue du navigateur. */
// Le `?lang=` d'un lien de pub n'a le droit de forcer la langue QU'UNE FOIS,
// au chargement de la page. Sinon, cliquer « FR » alors que l'URL dit `lang=ar`
// ne ferait rien (le sélecteur n'écrit que `pv_lang`, il ne touche pas l'URL).
// Un nouveau clic sur la pub = nouveau chargement = module réévalué = la langue
// de la pub reprend la main. C'est exactement ce qu'on veut.
let urlLangApplied = false;

function getLang() {
  const ok = (v) => v === "fr" || v === "en" || v === "ar";

  // ⚠️ La langue du lien passe AVANT le choix mémorisé : sans ça, un visiteur
  // déjà venu une fois en français voyait la pub arabe atterrir en français.
  const p = hashQuery().get("lang");
  if (ok(p) && !urlLangApplied) {
    urlLangApplied = true;
    try {
      localStorage.setItem("pv_lang", p);
    } catch {
      /* navigation privée stricte : tant pis, la langue tiendra le temps de la visite */
    }
    return p;
  }

  // Ordre unique, partagé avec utils/lang.js :
  //   lien de campagne → choix humain (cette page, puis l'app) → téléphone → français.
  // ⚠️ Le miroir `permigo_lang` NE compte plus comme un choix : le boot y écrivait
  // « fr » par défaut, ce qui rendait la ligne du téléphone inatteignable et servait
  // une page française à un visiteur arabophone (mesuré le 01/08/2026).
  const stored = localStorage.getItem("pv_lang");
  if (ok(stored)) return stored;
  if (ok(p)) return p;
  const chosen = explicitLang();
  if (ok(chosen)) return chosen;
  return browserLang() || "fr";
}

/**
 * Langue de la page pour le navigateur et pour les moteurs : `<html lang>` et le
 * titre d'onglet. Sans ça, un lecteur d'écran lisait l'arabe avec une voix
 * française et l'onglet restait en français dans les trois langues.
 */
function applyPageLang(lang, L) {
  try {
    document.documentElement.setAttribute("lang", lang);
    if (L?.docTitle) document.title = L.docTitle;
  } catch {
    /* SSR / indispo */
  }
}

/**
 * Date de départ du billet. ⚠️ Elle était écrite en dur (« JUIL. 2026 ») : au
 * 1er août 2026 le billet annonçait un départ passé, donc une offre expirée.
 * On affiche le mois courant, dans la langue de la page.
 */
function boardLabel(lang) {
  const d = new Date();
  const loc = lang === "ar" ? "ar" : lang === "en" ? "en-GB" : "fr-FR";
  try {
    const s = new Intl.DateTimeFormat(loc, {
      month: "short",
      year: "numeric",
    }).format(d);
    return lang === "ar" ? s : s.toUpperCase();
  } catch {
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}

/** Le billet d'or. stamped = billet validé (écran de succès). */
function renderTicket(L, { stamped = false, lang = "fr" } = {}) {
  return `
    <div class="pv-ticket-scene pv-rev">
      <div class="pv-ticket">
        <div class="pv-t-inner">
          <div class="pv-t-main">
            <div class="pv-t-brand">PERMIGO</div>
            <div class="pv-t-title">${L.tTitle}</div>
            <div class="pv-t-sub">${L.tSub}</div>
            <div class="pv-t-meta">
              <div><b>${L.tBoardLbl}</b><span>${boardLabel(lang)}</span></div>
              <div><b>${L.tDureeLbl}</b><span>${L.tDuree}</span></div>
            </div>
          </div>
          <div class="pv-t-stub">
            <span class="n">${L.tOffre}</span>
            ${stamped ? `<span class="pv-t-check">✔</span>` : `<span class="pv-t-price">${L.tPrice}</span><span class="pv-t-per">${L.tPer}</span>`}
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

  applyPageLang(lang, L);

  track("pass.view", {
    logged: !!me,
    lang,
    checkout_return: checkout || "none",
  });

  // ── Retour succès : bienvenue dans l'aventure ──
  if (checkout === "success") {
    track("pass.checkout_success", { plan: planParam || "?" });
    // Achat côté pub. ⚠️ C'est un retour de navigateur : rechargé ou partagé,
    // il peut se déclencher deux fois. La vérité comptable reste Stripe +
    // `pass_purchases` ; le pixel ne sert qu'à apprendre à Meta qui achète.
    fbTrack("Purchase", {
      content_name: planParam || "pass",
      currency: "EUR",
      value: PLAN_VALUE[planParam] ?? 0,
    });
    // Invité (pas de compte) : va chercher l'email qui vient de payer pour
    // pré-remplir #/rejoindre juste en dessous. eleve_access_status() matche
    // pass_purchases par email confirmé : une lettre de travers au moment de
    // recréer le compte, et l'élève a payé pour rien. Best-effort, en fond,
    // ne bloque jamais l'affichage de l'écran de succès.
    const sessionId = q.get("session_id");
    if (!me && sessionId) {
      getPassSessionEmail(sessionId).then((email) => {
        if (email) sessionStorage.setItem("pg_pass_email", email);
      });
    }

    const label = PLAN_LABELS[lang][planParam] || "Pass Permis";
    root.innerHTML = `${STYLE}
      <div class="pv" dir="${lang === "ar" ? "rtl" : "ltr"}">
        <header class="pv-nav">
          <a class="pv-logo" href="#/pass" aria-label="PermiGo"><img src="${LOGO}" alt="PermiGo"></a>
        </header>
        <div class="pv-wrap">
          <div class="pv-result">${renderTicket(L, { stamped: true, lang })}</div>
          <h1 class="pv-result-title">${L.successT}</h1>
          <p class="pv-result-intro">${L.successIntro(label)}</p>
          <div class="pv-steps">
            ${L.successSteps.map((s) => `<div class="pv-step"><div>${s}</div></div>`).join("")}
          </div>
          <button class="pv-result-cta" id="pv-home" type="button">${me ? L.successCta : L.successCtaSolo}</button>
        </div>
        <footer class="pv-foot">${L.foot}<br><span class="pv-foot-pros">${L.pros}</span></footer>
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

      <!-- À partir de 860px, le texte et la démo passent côte à côte : sous
           ce seuil, une seule colonne mobile inchangée entourée de vide sur
           un écran d'ordinateur (chantier resté ouvert depuis l'audit du
           03/08/2026, mis de côté le temps que #701 refasse la même page). -->
      <div class="pv-hero-wrap">
        <section class="pv-hero pv-rev pv-stag">
          <div class="pv-kicker">${L.kicker}</div>
          <h1 class="pv-h1">${L.h1}</h1>
          <p class="pv-lead">${L.lead}</p>
        </section>

        <!-- La démonstration passe AVANT le billet et avant le prix : on montre,
             puis on demande. Montée à la demande (le moteur de scène n'est pas
             dans le premier chargement) et sans compte ni appel réseau. -->
        <div id="pv-demo" class="pv-rev"></div>
      </div>

      <!-- Trois avis AVANT le billet : la scène montre ce que c'est, les avis
           disent que ça marche, et seulement après on parle d'argent. Le
           premier raconte le titre de la page (arriver à sa leçon en sachant
           quoi faire), les deux suivants ont 56 et 43 ans (la première
           objection d'un visiteur de 40 ans est « c'est pour les jeunes »). -->
      <div class="pv-avis-lot pv-avis-haut pv-rev">${renderAvis(lang, L, 0, 3)}</div>

      ${renderTicket(L, { lang })}

      <!-- La porte gratuite passe DEVANT l'achat : le compte gratuit existe
           depuis le 30/07 et n'avait aucun lien depuis le site (un visiteur sans
           code moniteur ne pouvait tout simplement pas entrer). -->
      <!-- UNE seule porte sous le billet : la gratuite. Le bouton d'achat qui
           la suivait est retiré (decision Rayan 03/08/2026, « le but c'est
           d'epurer »). Le prix a sa propre section plus bas, et la barre
           collante le garde a portee de pouce en permanence. Demander de payer
           a quelqu'un qui vient de lire le titre, c'est demander trop tot. -->
      <button class="pv-cta-free" id="pv-free" type="button">${L.freeCta}</button>
      <p class="pv-free-note">${L.freeNote}</p>

      <div class="pv-stage pv-rev" aria-hidden="true">
        <div class="pv-phone"><img src="/showcase/eleve-parcours.webp" alt="" width="390" height="844" loading="lazy" decoding="async"></div>
        <img class="pv-coin" src="/skins/volant-coin.webp" alt="" loading="lazy" decoding="async">
        <img class="pv-mascot" src="/skins/mascot-celebrate.webp" alt="" loading="lazy" decoding="async">
        <div class="pv-bulle">${L.bulle}<small>${L.bulleSub}</small></div>
      </div>

      <h2 class="pv-sec-title pv-rev"><span>${L.secCode}</span></h2>
      <p class="pv-sec-sub">${L.secCodeSub}</p>

      <!-- v5 (03/08/2026) : UNE seule famille de carte, UNE seule famille
           d'icône (icon(), même trait que le reste de l'app). Avant : une
           capture qui rejouait en photo la démo qu'on venait de faire jouer
           plus haut, et deux médailles 3D à côté d'un trait fin. -->
      <div class="pv-feats pv-rev pv-stag">
        ${L.feats
          .map(
            (f) => `
        <div class="pv-feat">
          <span class="pv-feat-ico" aria-hidden="true">${icon(f.icon, { size: 22, strokeWidth: 2.3 })}</span>
          <b>${f.t}</b>
          <span>${f.d}</span>
        </div>`,
          )
          .join("")}
      </div>
      ${
        L.nonFranco
          ? `
      <div class="pv-franco pv-rev">
        <span class="pv-franco-flag" aria-hidden="true">🇫🇷</span>
        <div><b>${L.nonFranco.title}</b><span>${L.nonFranco.txt}</span></div>
      </div>`
          : ""
      }

      <div class="pv-maths pv-rev pv-stag">
        ${L.mathsRows
          .map(
            ([lbl, val], i) =>
              `<div class="pv-maths-row${i === 2 ? " hot" : ""}"><span>${lbl}</span><b data-count="${escAttr(val)}">${val}</b></div>`,
          )
          .join("")}
      </div>
      <p class="pv-maths-note">${L.mathsNote}</p>
      <p class="pv-maths-src">${L.mathsSrc}</p>

      <h2 class="pv-sec-title pv-rev" id="pv-pricing"><span>${L.secPass}</span></h2>
      <p class="pv-sec-sub">${L.secPassSub}</p>

      <!-- UNE seule offre (décision Rayan 02/08/2026). Trois cartes, puis deux,
           puis une : à 4,99 €/mois il n'y a plus rien à arbitrer, donc plus rien
           à faire hésiter. Les plans pass3 / pass6 restent côté serveur pour les
           anciens acheteurs, ils ne sont simplement plus proposés nulle part. -->
      <article class="pv-pass pv-pass-gold pv-rev">
        <div class="pv-pass-main">
          <div class="pv-pass-name">${P.mensuel.name}</div>
          <div class="pv-pass-desc">${P.mensuel.desc}</div>
        </div>
        <div class="pv-pass-cut">
          <div class="pv-pass-price">${P.mensuel.price}<small>${P.mensuel.per}</small></div>
          <button class="pv-pass-btn" data-plan="mensuel" type="button">${P.mensuel.btn}</button>
        </div>
      </article>

      <p class="pv-err" id="pv-err">${L.err}</p>

      <h2 class="pv-sec-title pv-rev"><span>${L.secAvis}</span></h2>
      <p class="pv-sec-sub">${L.secAvisSub}</p>
      <div class="pv-avis-lot pv-rev pv-stag">${renderAvis(lang, L, 3, AVIS.length)}</div>

      <!-- Le graphique « 74,7 % contre 56,8 % » vivait ici. Retiré le
           03/08/2026 : il comparait la conduite accompagnée à la filière
           classique, donc deux façons d'apprendre à conduire, pas les élèves
           PermiGo aux autres. Posé juste après le prix sous le titre
           « S'entraîner régulièrement paie », il se lisait comme notre taux
           de réussite. La FAQ enchaîne maintenant directement. -->

      <section class="pv-faq pv-rev pv-stag">
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

      <footer class="pv-foot">${L.foot}<br><span class="pv-foot-pros">${L.pros}</span></footer>
    </div>

    <div class="pv-sticky">
      <div class="pv-sticky-inner">
        <button class="pv-sticky-free" id="pv-sticky-free" type="button">${L.stickyFree}</button>
        <button class="pv-sticky-paid" data-plan="mensuel" type="button">${L.stickyPaid}</button>
      </div>
    </div>

  </div>`;

  wire(root, me, lang, L);
  wireReveal(root);
  wireStickyReveal(root);
}

/** La barre collante s'efface tant que le bouton « Commencer gratuitement »
 *  du corps de page est à l'écran (les deux disent la même chose), et
 *  reprend sa place dès qu'il sort du cadre, dans un sens comme dans l'autre.
 *  Sans IntersectionObserver : elle reste montrée, c'est le filet le plus sûr. */
function wireStickyReveal(root) {
  if (!("IntersectionObserver" in window)) return;
  const cta = root.querySelector("#pv-free");
  const sticky = root.querySelector(".pv-sticky");
  if (!cta || !sticky) return;
  const io = new IntersectionObserver(
    ([entry]) =>
      sticky.classList.toggle("pv-sticky-hide", entry.isIntersecting),
    { rootMargin: "0px 0px -10% 0px" },
  );
  io.observe(cta);
}

/** Révélation au scroll : .pv-rev → .in à l'entrée dans le viewport.
 *  Un conteneur .pv-stag fait entrer ses enfants en cascade, et un bloc
 *  qui porte des [data-count] fait défiler ses chiffres. */
function wireReveal(root) {
  const els = [...root.querySelectorAll(".pv-rev")];
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  if (reduced || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    // Mouvement coupé : on pose directement la valeur finale.
    root
      .querySelectorAll("[data-count]")
      .forEach((n) => (n.textContent = n.dataset.count));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        // Cascade : 70 ms entre chaque enfant, plafonné à 6 crans pour
        // qu'une longue liste ne finisse pas une seconde après le reste.
        if (el.classList.contains("pv-stag")) {
          [...el.children].forEach((c, i) => {
            c.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
          });
        }
        el.classList.add("in");
        el.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -60px 0px", threshold: 0.08 },
  );
  const start = () => els.forEach((el) => io.observe(el));

  // L'écran de chargement couvre encore la page : si on observait maintenant,
  // toute la mise en scène du premier écran se jouerait DERRIÈRE lui et le
  // visiteur verrait le noir laisser place à une page déjà posée. On attend le
  // signal envoyé par index.html au début du fondu de sortie : le premier écran
  // se lève pendant que le splash s'efface.
  const sp = document.getElementById("splash");
  if (!sp || sp.classList.contains("is-out")) return start();
  document.addEventListener("permigo:splash-out", start, { once: true });
  // Filet : le splash ne dépasse jamais 3,4 s. S'il a disparu autrement (erreur,
  // onglet en arrière-plan), la page ne doit pas rester invisible.
  setTimeout(() => {
    if (!document.getElementById("splash")) start();
  }, 3800);
}

/** Fait défiler un montant de 0 jusqu'à sa valeur, en gardant EXACTEMENT
 *  l'écriture d'origine : « 1 800 € », « €1,800 », « 9,99 € », « €9.99 ».
 *  On isole le nombre, on l'anime, on le remet dans la phrase. */
function countUp(node) {
  const final = node.dataset.count || "";
  const token = (final.match(/\d[\d\s  .,]*\d|\d/) || [])[0];
  if (!token) return;
  const bare = token.replace(/[\s  ]/g, "");
  const dm = bare.match(/([.,])(\d{1,2})$/);
  const decimals = dm ? dm[2].length : 0;
  const decSep = dm ? dm[1] : "";
  const thouSep = (token.match(/\d([\s  ,.])\d{3}/) || [])[1] || "";
  const target = parseFloat(
    (dm ? bare.slice(0, dm.index) : bare).replace(/[.,]/g, "") +
      (dm ? `.${dm[2]}` : ""),
  );
  if (!isFinite(target)) return;

  const write = (v) => {
    let [ent, dec] = v.toFixed(decimals).split(".");
    if (thouSep) ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, thouSep);
    node.textContent = final.replace(token, dec ? ent + decSep + dec : ent);
  };

  // La page sert déjà le vrai prix : sans JS, ou si l'observateur ne se
  // déclenche jamais, le visiteur lit « 1 800 € », pas « 0 ».
  const DUREE = 900;
  write(0);
  let start = null;
  const step = (t) => {
    if (start === null) start = t;
    const p = Math.min(1, (t - start) / DUREE);
    // Même courbe que les entrées : ça part vite et ça se pose.
    write(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
    else node.textContent = final;
  };
  requestAnimationFrame(step);
}

function wire(root, me, lang, L) {
  const err = root.querySelector("#pv-err");

  root.querySelector("#pv-login")?.addEventListener("click", () => {
    location.hash = "#/login";
  });

  // Porte gratuite (hero, démonstration, barre collante) → inscription élève
  // sans code moniteur. Évènement SÉPARÉ de l'achat : on veut voir laquelle des
  // portes travaille. Déclarée avant mountDemoSituation (function hissée) car
  // la démo a besoin de la fermer sur ce même geste.
  function goFree(from) {
    track("pass.free_click", { from, lang, logged: !!me });
    fbTrack("Lead", { content_name: "compte_gratuit" });
    location.hash = "#/rejoindre?solo=1";
  }

  // Démonstration jouable. Montée avec le reste de la page : elle est là ou la
  // page ne s'affiche pas du tout, plus de disparition silencieuse.
  // ⭐⭐ onCorrect (audit landing 03/08/2026) : juste après la bonne réponse, la
  // motivation est à son maximum. Avant, rien ne la recueillait : le visiteur
  // retombait sur trois avis puis un billet doré. PR #690 avait déjà tranché
  // « une seule porte par écran » : pas de deuxième bouton ici, on met en
  // valeur celle qui existe déjà (la barre collante, à portée de pouce en
  // permanence) au moment précis où l'élève a envie de la prendre.
  const demoHost = root.querySelector("#pv-demo");
  const stickyFreeBtn = root.querySelector("#pv-sticky-free");
  if (demoHost)
    mountDemoSituation(demoHost, lang, {
      onCorrect: () => {
        track("pass.demo_success", { lang });
        if (!stickyFreeBtn) return;
        stickyFreeBtn.classList.remove("pv-pulse");
        // Force le replay si l'élève relance la démo une seconde fois.
        void stickyFreeBtn.offsetWidth;
        stickyFreeBtn.classList.add("pv-pulse");
      },
    });

  root
    .querySelector("#pv-free")
    ?.addEventListener("click", () => goFree("hero"));
  stickyFreeBtn?.addEventListener("click", () => goFree("sticky"));

  // Bascule FR/EN : on clique la langue VOULUE (FR ou EN), pas une bascule
  // aveugle. On mémorise puis on re-rend la page entière.
  root.querySelectorAll(".pv-lang-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
      const next = opt.dataset.lang;
      if (next === lang) return;
      localStorage.setItem("pv_lang", next);
      // Un clic ici est un CHOIX : toute l'app suit (inscription, quiz, réglages).
      // Avant, la page de vente basculait seule et l'élève retombait en français
      // dès qu'il créait son compte.
      applyLang(next);
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
      fbTrack("InitiateCheckout", {
        content_name: plan,
        currency: "EUR",
        value: PLAN_VALUE[plan] ?? 0,
      });
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
