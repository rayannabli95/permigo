// ═══════════════════════════════════════════════════════════════
// Legal — Politique de confidentialité + CGU
// Route : #/legal/privacy · #/legal/cgu
// ═══════════════════════════════════════════════════════════════
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { getLang } from "@/utils/lang.js";

const CONTENT = {
  privacy: {
    title: "Politique de confidentialité",
    sections: [
      {
        heading: "Responsable du traitement",
        body: "PermiGo SAS — dpo@permigo.fr",
      },
      {
        heading: "Données collectées",
        body: "Données de progression pédagogique (compétences validées, quiz, streak), profil pseudonymisé (prénom, email), historique d'apprentissage. Aucune donnée bancaire, NEPH ou adresse postale n'est collectée.",
      },
      {
        heading: "Finalité du traitement",
        body: "Suivi pédagogique de l'apprentissage du permis de conduire, personnalisation de l'expérience d'apprentissage, communication pédagogique.",
      },
      {
        heading: "Base légale",
        body: "Exécution du contrat (abonnement auto-école), intérêt légitime (amélioration du service), consentement (emails marketing — révocable à tout moment dans Paramètres).",
      },
      // ⚠️ TEXTE À FAIRE VALIDER PAR UN JURISTE / DPO avant déploiement large.
      {
        heading: "Mineurs de moins de 15 ans",
        body: "Conformément à l'article 8 du RGPD et à la loi Informatique et Libertés, l'inscription d'un élève de moins de 15 ans requiert le consentement du ou des titulaires de l'autorité parentale. Tant que ce consentement n'a pas été recueilli, le compte de l'élève reste bloqué. Le parent ou tuteur peut retirer son consentement à tout moment en écrivant à dpo@permigo.fr ; le compte est alors désactivé, les données privées (email, préférences, messages, notifications) sont supprimées et le profil est anonymisé : le prénom disparaît, les statistiques d'apprentissage deviennent anonymes.",
      },
      {
        heading: "Conservation",
        body: "Données conservées pendant la durée de l'abonnement + 3 ans. Suppression via Paramètres → Supprimer mon compte ou sur demande à dpo@permigo.fr : les données privées (email, préférences, messages, notifications) sont supprimées immédiatement et le profil est anonymisé — le prénom disparaît, les statistiques d'apprentissage sont conservées sous forme anonyme. L'effacement du compte de connexion s'obtient auprès de dpo@permigo.fr (traité sous 30 jours).",
      },
      {
        heading: "Vos droits",
        body: "Accès, rectification, effacement, portabilité, opposition — exercez-les via dpo@permigo.fr. Réclamation possible auprès de la CNIL (cnil.fr).",
      },
      {
        heading: "Cookies",
        body: "Cookies fonctionnels uniquement (session auth). Aucun cookie publicitaire ou de tracking tiers.",
      },
    ],
  },
  cgu: {
    title: "Conditions générales d'utilisation",
    sections: [
      {
        heading: "Objet",
        body: "PermiGo est une plateforme d'accompagnement pédagogique pour l'apprentissage du permis de conduire (catégorie B). L'accès est ouvert aux élèves — rattachés à un moniteur ou en autonomie —, aux moniteurs et aux gérants d'auto-écoles.",
      },
      {
        heading: "Accès au service",
        body: "L'accès s'effectue via l'abonnement d'un moniteur, sur invitation (code moniteur), ou par inscription directe d'un élève en autonomie. Chaque utilisateur dispose d'un compte nominatif non cessible.",
      },
      {
        heading: "Utilisation",
        body: "L'application est strictement réservée à l'apprentissage du permis de conduire. Toute utilisation frauduleuse, partage de compte ou tentative de manipulation des données pédagogiques est interdite.",
      },
      // Transparence classements — les ligues peuvent être complétées par des
      // profils générés (league-bots.js) tant qu'il y a peu de vrais élèves.
      {
        heading: "Classements et profils d'animation",
        body: "Les classements et ligues ont une visée de motivation. Tant qu'ils comptent peu de participants, ils peuvent être complétés par des profils d'animation générés par l'application (pseudonymes fictifs, sans lien avec des personnes réelles). Ces profils n'influencent ni la progression pédagogique, ni les résultats, ni aucun élément payant, et disparaissent à mesure que de vrais élèves rejoignent le classement.",
      },
      {
        heading: "Propriété intellectuelle",
        body: "Le contenu pédagogique (questions, référentiel REMC, design) est la propriété exclusive de PermiGo SAS. La reproduction est interdite sans accord écrit.",
      },
      {
        heading: "Responsabilité",
        body: "PermiGo est un outil d'aide à la préparation du permis de conduire. Les résultats obtenus dans l'application ne préjugent pas des résultats à l'examen officiel.",
      },
      {
        heading: "Abonnements, résiliation et remboursement",
        body: "Les abonnements PermiGo (abonnement mensuel élève et abonnement moniteur, 9,99 €/mois) sont sans engagement et se renouvellent automatiquement chaque mois. Vous pouvez les résilier en ligne à tout moment, en quelques clics, depuis Réglages → Gérer mon abonnement (portail de gestion sécurisé). La résiliation prend effet à la fin de la période déjà payée : aucun nouveau prélèvement n'a lieu ensuite, et l'accès reste ouvert jusqu'à cette échéance. Garantie « satisfait ou remboursé » : le Pass Permis (3 ou 6 mois) est intégralement remboursable sur simple demande dans les 3 jours suivant l'achat, à contact@permigo.fr. Droit de rétractation : conformément aux articles L221-18 et suivants du Code de la consommation, vous disposez d'un délai de rétractation de 14 jours. S'agissant d'un contenu numérique fourni immédiatement, vous demandez expressément l'accès dès le paiement et reconnaissez renoncer à votre droit de rétractation pour la partie du contenu déjà exécutée ; notre garantie de remboursement 3 jours ci-dessus reste, elle, acquise.",
      },
      {
        heading: "Résiliation du compte",
        body: "L'accès peut être résilié par l'auto-école ou sur demande de l'utilisateur. Les données sont supprimées selon la politique de confidentialité.",
      },
      {
        heading: "Contact",
        body: "PermiGo SAS — contact@permigo.fr · dpo@permigo.fr",
      },
    ],
  },
  credits: {
    title: "Crédits & licences",
    sections: [
      {
        heading: "Icônes & emojis",
        body: "Certains pictogrammes (dont l'emoji de validation) proviennent de Twemoji © Twitter, Inc. et contributeurs, sous licence CC-BY 4.0 (creativecommons.org/licenses/by/4.0).",
      },
      {
        heading: "Panneaux de signalisation",
        body: "Les illustrations de panneaux routiers proviennent de Wikimedia Commons (domaine public).",
      },
    ],
  },
};

// Traductions de travail : le contenu juridique EN/AR doit être relu par un
// juriste/DPO avant déploiement, au même titre que le corpus français source.
const LEGAL_I18N = {
  en: {
    back: "Back",
    privacy: {
      title: "Privacy policy",
      sections: [
        {
          heading: "Data controller",
          body: "PermiGo SAS — dpo@permigo.fr",
        },
        {
          heading: "Data collected",
          body: "Learning progress data (validated skills, quizzes, streak), pseudonymised profile (first name, email), and learning history. No banking data, NEPH number or postal address is collected.",
        },
        {
          heading: "Purpose of processing",
          body: "Educational monitoring of driving licence learning, personalisation of the learning experience, and educational communication.",
        },
        {
          heading: "Legal basis",
          body: "Performance of the contract (driving school subscription), legitimate interest (service improvement), and consent (marketing emails — which can be withdrawn at any time in Settings).",
        },
        {
          heading: "Children under 15",
          body: "In accordance with Article 8 of the GDPR and the French Data Protection Act, the registration of a student under 15 requires the consent of the holder or holders of parental responsibility. Until this consent has been obtained, the student's account remains blocked. The parent or guardian may withdraw their consent at any time by writing to dpo@permigo.fr; the account is then deactivated, private data (email, preferences, messages and notifications) is deleted, and the profile is anonymised: the first name is removed and learning statistics become anonymous.",
        },
        {
          heading: "Retention",
          body: "Data is retained for the duration of the subscription plus 3 years. It can be deleted via Settings → Delete my account or by requesting deletion at dpo@permigo.fr: private data (email, preferences, messages and notifications) is deleted immediately and the profile is anonymised — the first name is removed and learning statistics are retained in anonymous form. Deletion of the login account can be requested from dpo@permigo.fr (processed within 30 days).",
        },
        {
          heading: "Your rights",
          body: "Access, rectification, erasure, portability and objection — exercise these rights by contacting dpo@permigo.fr. You may lodge a complaint with the CNIL (cnil.fr).",
        },
        {
          heading: "Cookies",
          body: "Functional cookies only (authentication session). No advertising or third-party tracking cookies.",
        },
      ],
    },
    cgu: {
      title: "Terms of use",
      sections: [
        {
          heading: "Purpose",
          body: "PermiGo is an educational support platform for learning to drive (category B licence). Access is available to students — linked to an instructor or learning independently —, instructors and driving school managers.",
        },
        {
          heading: "Access to the service",
          body: "Access is provided through an instructor's subscription, by invitation (instructor code), or by the direct registration of an independent student. Each user has a personal, non-transferable account.",
        },
        {
          heading: "Use",
          body: "The application is strictly reserved for learning to drive. Any fraudulent use, account sharing or attempt to manipulate educational data is prohibited.",
        },
        {
          heading: "Rankings and activity profiles",
          body: "Rankings and leagues are designed to motivate users. While they have few participants, they may be supplemented with activity profiles generated by the application (fictional pseudonyms with no connection to real people). These profiles do not affect educational progress, results or any paid feature, and disappear as real students join the ranking.",
        },
        {
          heading: "Intellectual property",
          body: "The educational content (questions, REMC framework and design) is the exclusive property of PermiGo SAS. Reproduction is prohibited without written permission.",
        },
        {
          heading: "Liability",
          body: "PermiGo is a tool designed to help users prepare for their driving licence. Results obtained in the application do not predict results in the official examination.",
        },
        {
          heading: "Subscriptions, cancellation and refunds",
          body: "PermiGo subscriptions (monthly student subscription and instructor subscription, €9.99/month) have no minimum term and renew automatically each month. You may cancel them online at any time, in just a few clicks, from Settings → Manage my subscription (secure management portal). Cancellation takes effect at the end of the period already paid for: no further payment is taken and access remains open until that date. “Satisfied or refunded” guarantee: the Driving Licence Pass (3 or 6 months) is fully refundable on request within 3 days of purchase by contacting contact@permigo.fr. Right of withdrawal: in accordance with Articles L221-18 et seq. of the French Consumer Code, you have a 14-day withdrawal period. As digital content is supplied immediately, you expressly request access from the time of payment and acknowledge that you waive your right of withdrawal for the part of the content already supplied; our 3-day refund guarantee above remains unaffected.",
        },
        {
          heading: "Account termination",
          body: "Access may be terminated by the driving school or at the user's request. Data is deleted in accordance with the privacy policy.",
        },
        {
          heading: "Contact",
          body: "PermiGo SAS — contact@permigo.fr · dpo@permigo.fr",
        },
      ],
    },
    credits: {
      title: "Credits & licences",
      sections: [
        {
          heading: "Icons & emojis",
          body: "Some pictograms (including the validation emoji) come from Twemoji © Twitter, Inc. and contributors, under the CC-BY 4.0 licence (creativecommons.org/licenses/by/4.0).",
        },
        {
          heading: "Road signs",
          body: "Road sign illustrations come from Wikimedia Commons (public domain).",
        },
      ],
    },
  },
  ar: {
    back: "رجوع",
    privacy: {
      title: "سياسة الخصوصية",
      sections: [
        {
          heading: "المسؤول عن معالجة البيانات",
          body: "PermiGo SAS — dpo@permigo.fr",
        },
        {
          heading: "البيانات التي نجمعها",
          body: "بيانات التقدم التعليمي (المهارات المعتمدة، الاختبارات، سلسلة النشاط)، والملف الشخصي المستعار (الاسم الأول، البريد الإلكتروني)، وسجل التعلم. لا نجمع أي بيانات مصرفية أو رقم NEPH أو عنوان بريدي.",
        },
        {
          heading: "غرض المعالجة",
          body: "متابعة تعلم رخصة القيادة، وتخصيص تجربة التعلم، والتواصل التعليمي.",
        },
        {
          heading: "الأساس القانوني",
          body: "تنفيذ العقد (اشتراك مدرسة تعليم القيادة)، والمصلحة المشروعة (تحسين الخدمة)، والموافقة (رسائل التسويق الإلكترونية — ويمكن سحبها في أي وقت من الإعدادات).",
        },
        {
          heading: "القاصرون دون 15 عامًا",
          body: "وفقًا للمادة 8 من اللائحة العامة لحماية البيانات والقانون الفرنسي للمعلومات والحريات، يتطلب تسجيل طالب دون 15 عامًا موافقة صاحب السلطة الأبوية أو أصحابها. يبقى حساب الطالب محظورًا إلى أن نحصل على هذه الموافقة. يمكن للوالد أو الوصي سحب موافقته في أي وقت بمراسلة dpo@permigo.fr؛ وعندها يُعطّل الحساب، وتُحذف البيانات الخاصة (البريد الإلكتروني والتفضيلات والرسائل والإشعارات)، ويُخفى الملف الشخصي: يُحذف الاسم الأول وتصبح إحصاءات التعلم مجهولة الهوية.",
        },
        {
          heading: "مدة الاحتفاظ",
          body: "نحتفظ بالبيانات طوال مدة الاشتراك إضافة إلى 3 سنوات. يمكن حذفها عبر الإعدادات ← حذف حسابي أو بطلب يُرسل إلى dpo@permigo.fr: تُحذف البيانات الخاصة (البريد الإلكتروني والتفضيلات والرسائل والإشعارات) فورًا، ويُخفى الملف الشخصي — يُحذف الاسم الأول وتُحفظ إحصاءات التعلم بصورة مجهولة الهوية. يمكن طلب حذف حساب تسجيل الدخول من dpo@permigo.fr (تتم المعالجة خلال 30 يومًا).",
        },
        {
          heading: "حقوقك",
          body: "الوصول والتصحيح والحذف وقابلية النقل والاعتراض — يمكنك ممارسة هذه الحقوق عبر dpo@permigo.fr. ويمكنك تقديم شكوى إلى اللجنة الوطنية للمعلومات والحريات CNIL ‏(cnil.fr).",
        },
        {
          heading: "ملفات تعريف الارتباط",
          body: "نستخدم ملفات تعريف ارتباط وظيفية فقط (جلسة المصادقة). ولا نستخدم ملفات إعلانية أو ملفات تتبع تابعة لجهات خارجية.",
        },
      ],
    },
    cgu: {
      title: "الشروط العامة للاستخدام",
      sections: [
        {
          heading: "الغرض",
          body: "بيرميغو منصة دعم تعليمي لتعلم قيادة السيارة (رخصة الفئة B). وهي متاحة للطلاب — المرتبطين بمدرّب أو الذين يتعلمون باستقلالية — وللمدرّبين ومديري مدارس تعليم القيادة.",
        },
        {
          heading: "الوصول إلى الخدمة",
          body: "يتم الوصول عبر اشتراك مدرّب، أو بدعوة (رمز المدرّب)، أو بتسجيل مباشر لطالب مستقل. ولكل مستخدم حساب شخصي غير قابل للتحويل.",
        },
        {
          heading: "الاستخدام",
          body: "التطبيق مخصص حصريًا لتعلم قيادة السيارة. ويُحظر أي استخدام احتيالي أو مشاركة للحساب أو محاولة للتلاعب بالبيانات التعليمية.",
        },
        {
          heading: "التصنيفات وملفات النشاط",
          body: "تهدف التصنيفات والدوريات إلى التحفيز. وعندما يكون عدد المشاركين قليلًا، قد تُستكمل بملفات نشاط ينشئها التطبيق (أسماء مستعارة خيالية لا ترتبط بأشخاص حقيقيين). لا تؤثر هذه الملفات في التقدم التعليمي أو النتائج أو أي عنصر مدفوع، وتختفي كلما انضم طلاب حقيقيون إلى التصنيف.",
        },
        {
          heading: "الملكية الفكرية",
          body: "المحتوى التعليمي (الأسئلة، ومرجع REMC، والتصميم) ملك حصري لشركة PermiGo SAS. ويُحظر نسخه دون موافقة كتابية.",
        },
        {
          heading: "المسؤولية",
          body: "بيرميغو أداة مساعدة للتحضير لرخصة القيادة. والنتائج المحققة داخل التطبيق لا تضمن نتائج الامتحان الرسمي.",
        },
        {
          heading: "الاشتراكات والإلغاء والاسترداد",
          body: "اشتراكات بيرميغو (الاشتراك الشهري للطالب واشتراك المدرّب بسعر 9.99 يورو شهريًا) بلا التزام زمني وتتجدد تلقائيًا كل شهر. يمكنك إلغاؤها عبر الإنترنت في أي وقت ببضع نقرات من الإعدادات ← إدارة اشتراكي (بوابة إدارة آمنة). يسري الإلغاء في نهاية الفترة المدفوعة: لا يتم أي خصم جديد، ويبقى الوصول متاحًا حتى ذلك التاريخ. ضمان «الرضا أو استرداد المال»: يمكن استرداد قيمة باقة رخصة القيادة (3 أو 6 أشهر) كاملة بطلب بسيط خلال 3 أيام من الشراء عبر contact@permigo.fr. حق العدول: وفقًا للمواد L221-18 وما يليها من قانون المستهلك الفرنسي، لديك مهلة عدول مدتها 14 يومًا. وبما أن المحتوى الرقمي يُقدّم فورًا، فإنك تطلب صراحة الوصول إليه من لحظة الدفع وتقر بالتنازل عن حق العدول بالنسبة إلى الجزء المنفذ من المحتوى؛ ويبقى ضمان الاسترداد خلال 3 أيام المذكور أعلاه ساريًا.",
        },
        {
          heading: "إنهاء الحساب",
          body: "يمكن لمدرسة تعليم القيادة إنهاء الوصول أو يمكن إنهاؤه بطلب المستخدم. وتُحذف البيانات وفقًا لسياسة الخصوصية.",
        },
        {
          heading: "التواصل",
          body: "PermiGo SAS — contact@permigo.fr · dpo@permigo.fr",
        },
      ],
    },
    credits: {
      title: "الشكر والتراخيص",
      sections: [
        {
          heading: "الأيقونات والرموز التعبيرية",
          body: "تأتي بعض الرسوم التوضيحية (ومنها رمز التحقق التعبيري) من Twemoji © Twitter, Inc. والمساهمين، بموجب ترخيص CC-BY 4.0 ‏(creativecommons.org/licenses/by/4.0).",
        },
        {
          heading: "لافتات الطريق",
          body: "تأتي رسومات لافتات الطريق من Wikimedia Commons (الملكية العامة).",
        },
      ],
    },
  },
};

function legalContent(param) {
  const lang = getLang();
  return (
    (lang !== "fr" && LEGAL_I18N[lang]?.[param]) ||
    (lang !== "fr" && LEGAL_I18N[lang]?.privacy) ||
    CONTENT[param] ||
    CONTENT.privacy
  );
}

function legalBack() {
  const lang = getLang();
  return (lang !== "fr" && LEGAL_I18N[lang]?.back) || "Retour";
}

function legalDir() {
  return getLang() === "ar" ? ' dir="rtl" lang="ar"' : "";
}

export async function mount(root, param = "privacy") {
  const page = legalContent(param);
  track("page_view", { page: `legal_${param}` });

  root.innerHTML = `
<style>
.legal {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 80px;
  background: var(--bg);
  min-height: 100svh;
  font-family: 'Archivo', sans-serif;
  color: var(--ink);
}
.legal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
}
.legal-back::before { content: ''; position: absolute; inset: -4px; }
.legal-back {
  position: relative;
  width: 36px; height: 36px;
  border-radius: 8px;
  border: 1px solid var(--bo);
  background: var(--su);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--ink);
  font-size: 16px;
}
.legal-header-title {
  font: 700 16px/1.2 'Archivo', sans-serif;
  color: var(--ink);
}
.legal-body { padding: 20px 16px; display: flex; flex-direction: column; gap: 16px; }
.legal-section {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 16px;
  padding: 16px 18px;
}
.legal-section-title {
  font: 700 14px/1.3 'Archivo', sans-serif;
  color: var(--ink);
  margin-bottom: 6px;
}
.legal-section-body {
  font: 400 13px/1.65 'Archivo', sans-serif;
  color: var(--mu);
}
.legal-footer {
  text-align: center;
  font: 400 11px/1.5 'Archivo', sans-serif;
  color: var(--mu2);
  padding: 16px;
}
</style>
<div class="legal anim-slide-up"${legalDir()}>
  <div class="legal-header">
    <button class="legal-back" id="legal-back" aria-label="${escAttr(legalBack())}">←</button>
    <div class="legal-header-title">${esc(page.title)}</div>
  </div>
  <div class="legal-body">
    ${page.sections
      .map(
        (s) => `
    <div class="legal-section">
      <div class="legal-section-title">${esc(s.heading)}</div>
      <div class="legal-section-body">${esc(s.body)}</div>
    </div>`,
      )
      .join("")}
  </div>
  <div class="legal-footer">PermiGo v7 · ${new Date().getFullYear()}</div>
</div>`;

  root.querySelector("#legal-back")?.addEventListener("click", () => {
    // Page atteignable depuis la landing (visiteur non connecté) ET depuis
    // les réglages : revenir d'où l'on vient, jamais forcer /settings.
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate(getCurUser() ? "/settings" : "/");
  });
}
