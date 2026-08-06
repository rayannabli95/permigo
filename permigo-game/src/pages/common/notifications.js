// ═══════════════════════════════════════════════════════════════
// Notifications — groupées par jour, pull-to-refresh, swipe-to-delete
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { haptic } from "@/utils/haptic.js";
import { hideHeader } from "@/utils/nav.js";
import { getLang } from "@/utils/lang.js";

// ── i18n de la COQUE des notifications (EN/AR). Dict LOCAL, repli FR. ──
// Le CONTENU des notifs est généré en FR côté serveur (table notifications).
// On le RE-TRADUIT AU RENDU à partir du TYPE + data structurée (les chiffres,
// codes, prénoms restent interpolés). Les types au texte 100 % LIBRE (relance,
// emotional_nudge, emotional_recap — variantes serveur) ne sont PAS remappables
// → repli FR (le vrai fix serait serveur, hors périmètre). Les types moniteur
// (student_at_risk, session_confirmed…) restent FR aussi (coque = élève).
const NF_I18N = {
  en: {
    title: "Notifications",
    mark_all: "All read",
    back: "Back",
    empty_title: "No notifications",
    empty_body: "You're all caught up",
    empty_cta: "← Back to home",
    load_err_title: "Loading error",
    load_err_sub: "Check your connection and try again",
    load_err_toast: "Couldn't load notifications",
    update_err: "Update error",
    delete: "Delete",
    mark_all_success: "All notifications marked as read",
    deleted: "Notification deleted",
    cancel: "Undo",
    refreshing: "Refreshing…",
    unread_one: "1 unread",
    unread_many: "{n} unread",
    g_today: "Today",
    g_yesterday: "Yesterday",
    g_week: "This week",
    g_older: "Older",
    labels: {
      Récompense: "Reward",
      Trophée: "Trophy",
      "Trophée débloqué": "Trophy unlocked",
      "Compétence validée": "Skill validated",
      "Séance à confirmer": "Session to confirm",
      Séance: "Session",
      "Séance confirmée": "Session confirmed",
      "Ta série": "Your streak",
      Quiz: "Quiz",
      Message: "Message",
      Rappel: "Reminder",
      Encouragement: "Encouragement",
      "Ta progression": "Your progress",
      "Élève à relancer": "Student to nudge",
      "Quiz flash": "Flash quiz",
      "Ta semaine": "Your week",
      "Bilan du mois": "Monthly report",
      "Compte-rendu": "Lesson report",
      Info: "Info",
    },
    consolidation_title: "Consolidation quiz 🧠",
    consolidation_body: "2 quick questions to consolidate",
    flash_title: "⚡ Flash quiz from your instructor",
    flash_body: "3 questions · 5 minutes",
    streak_title: "🔥 Your streak is waiting",
    streak_body: "Don't lose your {n}-day streak. A quick session is enough",
    session_conf_title: "Confirm your session with {name}",
    comp_title: "Skill validated ✅",
    comp_body: "{code} · Validated by your instructor",
    pvq_title: "New skill to validate",
    pvq_suffix: "Quiz in 30 sec",
    cr_title: "Your lesson report 📋",
    cr_body_one: "1 skill validated by your instructor",
    cr_body_many: "{n} skills validated by your instructor",
  },
  ar: {
    title: "الإشعارات",
    mark_all: "تعليم الكل كمقروء",
    back: "رجوع",
    empty_title: "لا إشعارات",
    empty_body: "أنت على اطّلاع",
    empty_cta: "← العودة للرئيسية",
    load_err_title: "خطأ في التحميل",
    load_err_sub: "تحقّق من اتصالك وأعد المحاولة",
    load_err_toast: "تعذّر تحميل الإشعارات",
    update_err: "خطأ في التحديث",
    delete: "حذف",
    mark_all_success: "تم تعليم كل الإشعارات كمقروءة",
    deleted: "تم حذف الإشعار",
    cancel: "تراجع",
    refreshing: "جارٍ التحديث…",
    unread_one: "غير مقروء",
    unread_many: "{n} غير مقروء",
    g_today: "اليوم",
    g_yesterday: "أمس",
    g_week: "هذا الأسبوع",
    g_older: "أقدم",
    labels: {
      Récompense: "مكافأة",
      Trophée: "كأس",
      "Trophée débloqué": "كأس مفتوح",
      "Compétence validée": "مهارة مُثبتة",
      "Séance à confirmer": "حصة للتأكيد",
      Séance: "حصة",
      "Séance confirmée": "حصة مؤكّدة",
      "Ta série": "سلسلتك",
      Quiz: "اختبار",
      Message: "رسالة",
      Rappel: "تذكير",
      Encouragement: "تشجيع",
      "Ta progression": "تقدّمك",
      "Élève à relancer": "طالب للمتابعة",
      "Quiz flash": "اختبار خاطف",
      "Ta semaine": "أسبوعك",
      "Bilan du mois": "حصيلة الشهر",
      "Compte-rendu": "تقرير الدرس",
      Info: "معلومة",
    },
    consolidation_title: "اختبار ترسيخ 🧠",
    consolidation_body: "سؤالان سريعان لترسيخ مهارتك",
    flash_title: "⚡ اختبار خاطف من مدرّبك",
    flash_body: "3 أسئلة · 5 دقائق",
    streak_title: "🔥 سلسلتك تنتظرك",
    streak_body: "لا تفقد سلسلتك ({n} أيام). حصة سريعة تكفي",
    session_conf_title: "أكّد حصتك مع {name}",
    comp_title: "مهارة مُثبتة ✅",
    comp_body: "{code} · أثبتها مدرّبك",
    pvq_title: "مهارة جديدة للتثبيت",
    pvq_suffix: "الاختبار في 30 ثانية",
    cr_title: "تقرير درسك 📋",
    cr_body_one: "مهارة واحدة أثبتها مدرّبك",
    cr_body_many: "{n} مهارات أثبتها مدرّبك",
  },
};
function nt(key, fr) {
  const l = getLang();
  return (l !== "fr" && NF_I18N[l]?.[key]) || fr;
}
function nfLabel(fr) {
  const l = getLang();
  return (l !== "fr" && NF_I18N[l]?.labels?.[fr]) || fr;
}
function nfRtl(html) {
  return getLang() === "ar" ? `<span dir="rtl">${html}</span>` : html;
}
// Re-traduit le title/body d'une notif au rendu (type + data). Repli FR pour
// les langues fr, les types moniteur et les textes 100 % libres.
// ── Notifs émotionnelles (emotional_nudge / emotional_recap) : traduites au
// rendu par template_id + data. Les nombres varient par instance → {0},{1}…
// remplis à partir des nombres du texte FR (dans l'ordre) ; {name} = prénom
// extrait du corps FR (un seul gabarit). Gabarits moniteur/gérant + relance
// (texte 100 % libre) absents ici → repli FR. Traductions relues (adversarial).
const EMO_I18N = {
  en: {
    come_back_7d: {
      title: "💙 Thinking of you",
      body: "A week without you. Come back whenever you like, we're here",
    },
    come_back_3d: {
      title: "👋 Your journey is waiting for you",
      body: "3 days already. 5 minutes is enough to get back into the rhythm",
    },
    palier_1: {
      title: "⚡ Just one skill",
      body: "Just one skill stands between you and level {0} 💪",
    },
    achievement_comp_5: {
      title: "🎯 First roots",
      body: "5 skills validated. Strong start",
    },
    recap_warm_week: {
      title: "🌱 Little by little",
      body: "{0} quizzes this week. The next one is yours",
    },
    week_summary: {
      title: "✨ Great week",
      body: "{0} skills this week. Well done",
    },
    palier_2: {
      title: "🔥 You're almost there",
      body: "Just {0} more skills to reach tier {1}",
    },
    smart_reengagement_near_28: {
      title: "🎓 Only {0} to go before the mock exam",
      body: "You're so close {name}. {0}/{1} secured",
    },
    recap_quiet_week: {
      title: "💫 Your week on PermiGo",
      body: "Pick it back up whenever you like. 5 minutes is enough",
    },
    achievement_quiz_10: {
      title: "🧠 {0} quizzes",
      body: "You're becoming a quiz pro",
    },
    recap_strong_week: {
      title: "🔥 What a week",
      body: "{0} skills · {1} quizzes this week",
    },
    achievement_comp_10: {
      title: "🌱 {0}/{1}",
      body: "A third of the course done. Great momentum",
    },
    achievement_comp_15: {
      title: "⚡ {0} milestone",
      body: "Almost halfway there. Keep going",
    },
    recap_solid_week: {
      title: "✨ Great week",
      body: "{0} skills validated · {1} quizzes · {2} active days",
    },
    achievement_streak_3: {
      title: "🔥 {0} days",
      body: "Your first real streak. Keep it going",
    },
    achievement_quiz_50: { title: "🧠 {0} quizzes", body: "Rock-solid memory" },
    achievement_comp_25: {
      title: "💎 {0}/{1}",
      body: "Almost there. Only {0} skills to go",
    },
    achievement_comp_20: {
      title: "🔥 {0} skills unlocked",
      body: "Two thirds of the way. Your exam is getting closer",
    },
  },
  ar: {
    come_back_7d: {
      title: "💙 نفكّر فيك",
      body: "أسبوع من دونك. عُد متى شئت، نحن هنا",
    },
    come_back_3d: {
      title: "👋 مسارك ينتظرك",
      body: "مرّت 3 أيام. 5 دقائق تكفي لتستعيد إيقاعك",
    },
    palier_1: {
      title: "⚡ مهارة واحدة فقط",
      body: "مهارة واحدة فقط تفصلك عن المستوى {0} 💪",
    },
    achievement_comp_5: {
      title: "🎯 الجذور الأولى",
      body: "أنجزت 5 مهارات. انطلاقة قوية",
    },
    recap_warm_week: {
      title: "🌱 شيئًا فشيئًا",
      body: "{0} اختبار هذا الأسبوع. المرة القادمة لك",
    },
    week_summary: {
      title: "✨ أسبوع رائع",
      body: "أنجزتَ {0} مهارات هذا الأسبوع. أحسنت",
    },
    palier_2: {
      title: "🔥 أوشكت على الوصول",
      body: "لم يتبقَّ سوى {0} مهارات للوصول إلى المستوى {1}",
    },
    smart_reengagement_near_28: {
      title: "🎓 لم يتبقَّ سوى {0} قبل الامتحان التجريبي",
      body: "أنت قريب جدًا يا {name}. أنجزت {0}/{1}",
    },
    recap_quiet_week: {
      title: "💫 أسبوعك على PermiGo",
      body: "عُد متى شئت. 5 دقائق تكفي",
    },
    achievement_quiz_10: {
      title: "🧠 {0} اختبار",
      body: "أنت تصبح محترفًا في الاختبارات",
    },
    recap_strong_week: {
      title: "🔥 يا له من أسبوع",
      body: "{0} مهارات · {1} اختبارات هذا الأسبوع",
    },
    achievement_comp_10: {
      title: "🌱 {0}/{1}",
      body: "أنجزت ثلث المسار. زخم رائع",
    },
    achievement_comp_15: {
      title: "⚡ محطة {0}",
      body: "قطعتَ نصف الطريق تقريبًا. واصِل",
    },
    recap_solid_week: {
      title: "✨ أسبوع رائع",
      body: "{0} كفاءات مُثبَّتة · {1} اختبارات · {2} أيام نشطة",
    },
    achievement_streak_3: {
      title: "🔥 {0} أيام",
      body: "أول سلسلة حقيقية لك. واصِل",
    },
    achievement_quiz_50: { title: "🧠 {0} اختبار", body: "ذاكرة فولاذية" },
    achievement_comp_25: {
      title: "💎 {0}/{1}",
      body: "أوشكت على بلوغ هدفك. لم يتبقَّ سوى {0} مهارات",
    },
    achievement_comp_20: {
      title: "🔥 {0} مهارة مكتسبة",
      body: "قطعتَ ثلثَي الطريق. الامتحان يقترب",
    },
  },
};
// Remplit {0},{1}… avec les nombres du texte FR (dans l'ordre) et {name}.
function emoFill(tpl, frText, name) {
  if (!tpl) return tpl;
  let out = name != null ? tpl.split("{name}").join(name) : tpl;
  const nums = String(frText || "").match(/\d+/g) || [];
  return out.replace(/\{(\d+)\}/g, (_, i) =>
    nums[Number(i)] != null ? nums[Number(i)] : "",
  );
}

function notifContent(n) {
  if (getLang() === "fr") return { title: n.title, body: n.body };
  const d = n.data || {};
  const num = (s) => (String(s ?? "").match(/\d+/) || [])[0];
  switch (n.type) {
    case "consolidation_quiz":
      return {
        title: nt("consolidation_title", n.title),
        body: nt("consolidation_body", n.body),
      };
    case "flash_quiz":
      return {
        title: nt("flash_title", n.title),
        body: nt("flash_body", n.body),
      };
    case "streak_risk":
    case "streak_at_risk": {
      const s = d.current_streak ?? num(n.body);
      return {
        title: nt("streak_title", n.title),
        body: s != null ? nt("streak_body", n.body).replace("{n}", s) : n.body,
      };
    }
    case "session_confirmation": {
      const name = d.moniteur_prenom || "";
      return {
        title: nt("session_conf_title", n.title)
          .replace("{name}", name)
          .replace(/\s+$/, ""),
        body: n.body,
      };
    }
    case "comp_acquise": {
      const code =
        d.competence_id ||
        (String(n.body || "").match(/^C\d[a-z]/) || [])[0] ||
        "";
      return {
        title: nt("comp_title", n.title),
        body: code ? nt("comp_body", n.body).replace("{code}", code) : n.body,
      };
    }
    case "post_validation_quiz": {
      // body serveur = "{nom de compétence}<séparateur>Fais le quiz en 30 sec".
      // Le séparateur est une DONNÉE, pas de la ponctuation : le serveur a
      // longtemps posé un tiret cadratin. Si un jour il pose un point médian
      // (règle d'écriture 2026), le découpage doit continuer à marcher → on
      // accepte les deux, et à défaut on garde le corps entier.
      const name = String(n.body || "")
        .split(/\s*[—–·]\s*|\s+-\s+/)[0]
        .trim();
      return {
        title: nt("pvq_title", n.title),
        body:
          name && name !== String(n.body || "").trim()
            ? `${name} · ${nt("pvq_suffix", "Quiz en 30 sec")}`
            : n.body,
      };
    }
    case "compte_rendu": {
      const c = num(n.body);
      return {
        title: nt("cr_title", n.title),
        body:
          c == null
            ? n.body
            : c === "1"
              ? nt("cr_body_one", n.body)
              : nt("cr_body_many", n.body).replace("{n}", c),
      };
    }
    case "emotional_nudge":
    case "emotional_recap": {
      const tpl = EMO_I18N[getLang()]?.[d.template_id];
      if (!tpl) return { title: n.title, body: n.body }; // gabarit moniteur/inconnu → FR
      const frTitle = d.title || n.title || "";
      const frBody = d.body || n.body || "";
      let name = null;
      if (d.template_id === "smart_reengagement_near_28") {
        const m = String(frBody).match(/proche,\s*([^!]+?)\s*!/);
        name = m ? m[1].trim() : "";
      }
      return {
        title: emoFill(tpl.title, frTitle, name),
        body: emoFill(tpl.body, frBody, name),
      };
    }
    default:
      // relance (texte 100 % personnalisé) / types moniteur → FR
      return { title: n.title, body: n.body };
  }
}
import { emptyState } from "@/components/common/empty-state.js";

// ─── Deep-link resolver ───────────────────────────────────────
function notifRoute(n) {
  const d = n.data || {};
  switch (n.type) {
    // Retrait de la confirmation de séance (30/07/2026) : le moniteur ne peut
    // plus enregistrer de séance, la page #/sessions n'existe plus. Les
    // notifications DÉJÀ reçues restent lisibles — elles renvoient à l'accueil
    // au lieu d'ouvrir un écran d'erreur.
    case "session_confirmation":
    case "session_logged":
      return "#/";
    case "new_message":
      return d.thread_id ? `#/messages/${d.thread_id}` : "#/messages";
    case "achievement_unlocked":
      return "#/trophees";
    case "streak_at_risk":
    case "streak_risk":
    case "post_validation_quiz":
    case "consolidation_quiz":
    case "flash_quiz":
      return "#/parcours";
    case "session_confirmed":
    case "session_refused":
      return "#/";
    case "comp_acquise":
      // Une compétence validée par le moniteur est de la VRAIE progression
      // (table validations) : elle s'allume sur le parcours, qui est l'écran
      // des compétences depuis le retrait du hub condensé (02/08/2026).
      return "#/parcours";
    case "relance":
      return d.link || "#/parcours";
    case "emotional_nudge":
      // La source pose data.route ('#/parcours', '#/'…) ; on l'honore.
      return d.route || "#/parcours";
    case "student_at_risk":
      // Alerte moniteur « untel décroche » → sa liste d'élèves à relancer.
      return "#/eleves";
    case "emotional_recap":
      return d.route || "#/parcours";
    case "moniteur_recap":
      return "#/profil";
    case "compte_rendu":
      // Retrait du moniteur (lot 4 du pivot, 30/07/2026) : la page
      // #/compte-rendu/{id} est supprimée. Les notifications DÉJÀ reçues
      // restent lisibles dans la cloche et retombent sur le parcours, jamais
      // sur un lien mort (le router afficherait « introuvable »).
      return "#/parcours";
    default:
      // Fallback robuste : honorer un lien explicite posé par la source.
      return d.route || d.link || "#/";
  }
}

// ─── Icon map ────────────────────────────────────────────────
// label = étiquette courte affichée au-dessus du titre : l'élève sait en
// 1 mot de quoi il s'agit (valorisant > générique).
const TYPE_META = {
  xp: {
    med: ["eclair", "violet"],
    color: "var(--a)",
    label: "Récompense",
  },
  trophy: {
    med: ["trophee", "gold"],
    color: "var(--am)",
    label: "Trophée",
  },
  achievement_unlocked: {
    med: ["trophee", "gold"],
    color: "var(--am)",
    label: "Trophée débloqué",
  },
  validation: {
    med: ["check", "green"],
    color: "var(--gr)",
    label: "Compétence validée",
  },
  session_confirmation: {
    med: ["calendrier", "indigo"],
    color: "var(--a)",
    label: "Séance à confirmer",
  },
  session_logged: {
    med: ["calendrier", "indigo"],
    color: "var(--a)",
    label: "Séance",
  },
  session_confirmed: {
    med: ["calendrier", "indigo"],
    color: "var(--gr)",
    label: "Séance confirmée",
  },
  session_refused: {
    med: ["faute", "red"],
    color: "var(--rd)",
    label: "Séance",
  },
  streak_at_risk: {
    med: ["flamme", "orange"],
    color: "var(--rd)",
    label: "Ta série",
  },
  streak: {
    med: ["flamme", "orange"],
    color: "var(--rd)",
    label: "Ta série",
  },
  consolidation_quiz: {
    med: ["cible", "violet"],
    color: "var(--pu)",
    label: "Quiz",
  },
  post_validation_quiz: {
    med: ["cible", "violet"],
    color: "var(--pu)",
    label: "Quiz",
  },
  new_message: {
    med: ["message", "blue"],
    color: "var(--bl)",
    label: "Message",
  },
  reminder: {
    med: ["cloche", "slate"],
    color: "var(--bl)",
    label: "Rappel",
  },
  comp_acquise: {
    med: ["check", "green"],
    color: "var(--gr)",
    label: "Compétence validée",
  },
  relance: {
    med: ["message", "blue"],
    color: "var(--a)",
    label: "Encouragement",
  },
  emotional_nudge: {
    med: ["etoile", "violet"],
    color: "var(--a)",
    label: "Ta progression",
  },
  student_at_risk: {
    med: ["cloche", "orange"],
    color: "var(--am)",
    label: "Élève à relancer",
  },
  flash_quiz: {
    med: ["eclair", "violet"],
    color: "var(--pu)",
    label: "Quiz flash",
  },
  streak_risk: {
    med: ["flamme", "red"],
    color: "var(--rd)",
    label: "Ta série",
  },
  emotional_recap: {
    med: ["calendrier", "violet"],
    color: "var(--a)",
    label: "Ta semaine",
  },
  moniteur_recap: {
    med: ["trophee", "gold"],
    color: "var(--am)",
    label: "Bilan du mois",
  },
  compte_rendu: {
    med: ["fiches", "indigo"],
    color: "var(--a)",
    label: "Compte-rendu",
  },
  info: {
    med: ["cloche", "slate"],
    color: "var(--mu3)",
    label: "Info",
  },
};
function typeMeta(t) {
  // Repli champ par champ sur `info` : un type émis par une edge function
  // absente du repo ne doit JAMAIS faire planter la page (med[0] sur undefined).
  return { ...TYPE_META.info, ...(TYPE_META[t] || {}) };
}

// ─── Grouping ─────────────────────────────────────────────────
function groupByDay(notifs) {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;
  const groups = { today: [], yesterday: [], week: [], older: [] };
  for (const n of notifs) {
    const day = new Date(
      new Date(n.created_at).getFullYear(),
      new Date(n.created_at).getMonth(),
      new Date(n.created_at).getDate(),
    ).getTime();
    if (day >= today) groups.today.push(n);
    else if (day >= yesterday) groups.yesterday.push(n);
    else if (day >= weekAgo) groups.week.push(n);
    else groups.older.push(n);
  }
  return groups;
}

function fmtTime(iso) {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const _loc =
    getLang() === "en" ? "en-GB" : getLang() === "ar" ? "ar" : "fr-FR";
  return d.toLocaleDateString(_loc, { day: "numeric", month: "short" });
}

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
.nf2 {
  max-width: 480px; margin: 0 auto;
  background: var(--bg); min-height: 100dvh;
  padding-bottom: 80px; font-family: 'Archivo', sans-serif;
}

/* ── Header ── */
/* Le chrome global est masqué sur cette page (hideHeader) : l'en-tête in-page
   devient LA barre de titre — collée en haut, safe-area incluse. */
.nf2-hd {
  position: sticky; top: 0; z-index: 20;
  background: var(--su); border-bottom: 1px solid var(--bo);
  padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 10px;
  display: flex; align-items: center; gap: 10px;
}
.nf2-back {
  width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--bo);
  background: var(--su); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--ink); padding: 0; font-family: inherit;
  transition: background .12s;
  position: relative;
}
/* Hit-area 44x44 sans grossir le visuel */
.nf2-back::before { content: ''; position: absolute; inset: -4px; }
.nf2-back:active { background: var(--bg); }
.nf2-title { font: 800 16px/1.2 'Archivo', sans-serif; letter-spacing: -.02em; color: var(--ink); flex: 1; }
.nf2-unread-badge {
  font: 700 11px/1 'IBM Plex Mono', monospace;
  color: var(--a-txt); background: color-mix(in srgb, var(--a) 10%, transparent);
  border-radius: 99px; padding: 4px 8px; flex-shrink: 0;
}
.nf2-mark-all {
  font: 700 12px/1 'Archivo', sans-serif; color: var(--a-txt);
  background: none; border: none; cursor: pointer; padding: 8px 4px;
  border-radius: 6px; transition: background .12s; font-family: inherit;
}
.nf2-mark-all:hover { background: color-mix(in srgb, var(--a) 8%, transparent); }
.nf2-mark-all:disabled { color: var(--mu2); cursor: default; }
.nf2-mark-all:disabled:hover { background: none; }

/* ── Pull to refresh indicator ── */
.nf2-ptr {
  height: 0; overflow: hidden; display: flex; align-items: center; justify-content: center;
  transition: height .2s ease;
  font: 600 12px/1 'Archivo', sans-serif; color: var(--mu); gap: 8px;
}
.nf2-ptr.visible { height: 48px; }
.nf2-ptr-ico {
  width: 20px; height: 20px; border: 2px solid var(--bo); border-top-color: var(--a);
  border-radius: 50%; animation: nf2Spin .7s linear infinite;
}
@keyframes nf2Spin { to { transform: rotate(360deg); } }

/* ── Group label ── */
.nf2-group-label {
  padding: 22px 20px 8px;
  font: 700 11.5px/1 'Archivo', sans-serif; letter-spacing: .06em;
  text-transform: uppercase; color: var(--mu2);
}

/* ── List : cartes aérées (plus de liste plate) ── */
.nf2-list {
  display: flex; flex-direction: column; gap: 10px;
  padding: 0 16px;
}

/* ── Item (swipe container = la carte) ── */
.nf2-item-wrap {
  position: relative; overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--bo);
  background: var(--su);
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}

/* Delete reveal — invisible au repos (sinon le rouge bave sous le bord
   arrondi de la carte), révélé pendant le swipe uniquement */
.nf2-delete-bg {
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 72px; background: var(--rd);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font: 600 11px/1 'Archivo', sans-serif; gap: 4px;
  flex-direction: column;
  opacity: 0;
}
.nf2-item-wrap.swiping .nf2-delete-bg { opacity: 1; }

/* Item row */
.nf2-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px; cursor: pointer;
  transition: transform .25s cubic-bezier(.32,.72,0,1), background .1s;
  position: relative; background: var(--su);
  -webkit-tap-highlight-color: transparent;
  user-select: none; touch-action: pan-y;
}
.nf2-item:active { background: var(--bg); }
/* Non lue : liseré accent à gauche, rien d'autre — un seul signal */
.nf2-item.unread::before {
  content: ''; position: absolute; left: 0; top: 10px; bottom: 10px;
  width: 3px; border-radius: 0 3px 3px 0; background: var(--a);
}
.nf2-item-ico {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.nf2-item-body { flex: 1; min-width: 0; }
.nf2-item-eyebrow {
  font: 700 10.5px/1 'Archivo', sans-serif;
  letter-spacing: .06em; text-transform: uppercase;
  display: flex; align-items: baseline; gap: 6px;
  margin-bottom: 4px;
}
.nf2-item-eyebrow .nf2-when {
  font: 600 10.5px/1 'Archivo', sans-serif;
  letter-spacing: 0; text-transform: none; color: var(--mu2);
}
.nf2-item-title {
  font: 700 15px/1.3 'Archivo', sans-serif;
  color: var(--ink); letter-spacing: -.01em;
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.nf2-item.unread .nf2-item-title { color: var(--ink); }
.nf2-item:not(.unread) .nf2-item-title { font-weight: 600; color: color-mix(in srgb, var(--ink) 80%, var(--mu)); }
.nf2-item-desc {
  font: 500 13px/1.45 'Archivo', sans-serif; color: var(--mu); margin-top: 3px;
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.nf2-item-go { flex-shrink: 0; color: var(--mu2); display: flex; }

/* ── Empty ── */
.nf2-empty {
  padding: 56px 24px; text-align: center;
}
.nf2-empty-ico { font-size: 52px; margin-bottom: 14px; }
.nf2-empty-title {
  font: 800 18px/1.3 'Archivo', sans-serif;
  color: var(--ink); letter-spacing: -.02em; margin-bottom: 6px;
}
.nf2-empty-sub { font: 500 13px/1.5 'Archivo', sans-serif; color: var(--mu); margin-bottom: 24px; }
.nf2-empty-cta {
  display: inline-block; padding: 12px 24px;
  background: color-mix(in srgb, var(--a) 8%, transparent); border: 1.5px solid color-mix(in srgb, var(--a) 20%, transparent);
  border-radius: 12px; color: var(--a-txt); font: 600 13px/1 'Archivo', sans-serif;
  cursor: pointer; min-height: 44px; transition: background .12s;
}
.nf2-empty-cta:active { background: color-mix(in srgb, var(--a) 15%, transparent); }
</style>`;

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root, me) {
  if (!me) me = getCurUser();
  if (!me) return;

  track("page.view", { page: "notifications", role: me.role });

  // Un seul niveau de titre : l'en-tête in-page (retour + Notifications +
  // « Tout lu ») remplace le chrome global le temps de la page.
  hideHeader();

  root.innerHTML = `${STYLE}
<div class="nf2 anim-slide-up" id="nf2-root">
  <div class="nf2-hd">
    <button class="nf2-back" id="nf2-back" aria-label="${escAttr(nt("back", "Retour"))}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div class="nf2-title">${nfRtl(esc(nt("title", "Notifications")))}</div>
    <span class="nf2-unread-badge" id="nf2-badge" style="display:none"></span>
    <button class="nf2-mark-all" id="nf2-mark-all" disabled>${esc(nt("mark_all", "Tout lu"))}</button>
  </div>
  <div class="nf2-ptr" id="nf2-ptr"><div class="nf2-ptr-ico"></div> ${esc(nt("refreshing", "Actualisation…"))}</div>
  <div id="nf2-content" style="min-height:200px">
    ${skelRows(5)}
  </div>
</div>`;

  root
    .querySelector("#nf2-back")
    ?.addEventListener("click", () => navigate("/"));

  await loadNotifs(root, me);
  wirePullToRefresh(root, me);
}

// ─── Load & render ────────────────────────────────────────────
async function loadNotifs(root, me) {
  const content = root.querySelector("#nf2-content");
  if (!content) return;

  const { data, error } = await sb
    .from("notifications")
    .select("id, type, title, body, data, read, created_at")
    .eq("user_id", me.id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    toast(
      nt("load_err_toast", "Impossible de charger les notifications"),
      "error",
    );
    content.innerHTML = `<div class="nf2-empty"><div class="nf2-empty-ico">${icon("alert-triangle", { size: 28 })}</div><div class="nf2-empty-title">${esc(nt("load_err_title", "Erreur de chargement"))}</div><div class="nf2-empty-sub">${esc(nt("load_err_sub", "Vérifie ta connexion et réessaie"))}</div></div>`;
    return;
  }

  const notifs = data || [];
  const unreadCount = notifs.filter((n) => !n.read).length;

  // Update badge
  const badge = root.querySelector("#nf2-badge");
  if (badge) {
    badge.style.display = unreadCount > 0 ? "" : "none";
    badge.textContent =
      unreadCount > 0
        ? (unreadCount > 1
            ? nt("unread_many", "{n} non lues")
            : nt("unread_one", "{n} non lue")
          ).replace("{n}", unreadCount)
        : "";
  }

  // Update mark-all
  const markAll = root.querySelector("#nf2-mark-all");
  if (markAll) markAll.disabled = unreadCount === 0;

  if (notifs.length === 0) {
    const cta = `<button class="nf2-empty-cta" id="nf2-back-home">${esc(nt("empty_cta", "← Retour à l'accueil"))}</button>`;
    content.innerHTML = emptyState({
      image: "/skins/empty-states/empty_notifications.png",
      title: nt("empty_title", "Aucune notification"),
      body: nt("empty_body", "Tu es à jour"),
      cta,
    });
    root
      .querySelector("#nf2-back-home")
      ?.addEventListener("click", () => navigate("/"));
    return;
  }

  const groups = groupByDay(notifs);
  const groupDefs = [
    { key: "today", label: "Aujourd'hui" },
    { key: "yesterday", label: "Hier" },
    { key: "week", label: "Cette semaine" },
    { key: "older", label: "Plus ancien" },
  ];

  let html = "";
  for (const { key, label } of groupDefs) {
    if (!groups[key].length) continue;
    html += `<div class="nf2-group-label">${nfRtl(esc(nt("g_" + key, label)))}</div><div class="nf2-list">`;
    for (const n of groups[key]) {
      const m = typeMeta(n.type);
      const c = notifContent(n);
      const route = notifRoute(n);
      const actionable = route && route !== "#/";
      html += `
        <div class="nf2-item-wrap" data-id="${escAttr(n.id)}">
          <div class="nf2-delete-bg" aria-label="${escAttr(nt("delete", "Supprimer"))}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            ${esc(nt("delete", "Suppr."))}
          </div>
          <div class="nf2-item ${n.read ? "" : "unread"}" data-id="${escAttr(n.id)}" data-read="${n.read}" data-route="${escAttr(route)}" role="button" tabindex="0">
            <div class="nf2-item-ico">${medallion(m.med[0], m.med[1], { size: 32 })}</div>
            <div class="nf2-item-body">
              <div class="nf2-item-eyebrow" style="color:color-mix(in srgb, ${m.color} 50%, var(--ink))">${nfRtl(esc(nfLabel(m.label)))} <span class="nf2-when">· ${fmtTime(n.created_at)}</span></div>
              <div class="nf2-item-title">${nfRtl(esc(c.title))}</div>
              ${c.body ? `<div class="nf2-item-desc">${nfRtl(esc(c.body))}</div>` : ""}
            </div>
            ${actionable ? `<div class="nf2-item-go"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>` : ""}
          </div>
        </div>`;
    }
    html += `</div>`;
  }
  content.innerHTML = html;

  wireItems(root, me, unreadCount);
}

// ─── Wire items (read + swipe-to-delete) ─────────────────────
function wireItems(root, me, initialUnread) {
  let unreadCount = initialUnread;

  const updateBadge = () => {
    const badge = root.querySelector("#nf2-badge");
    if (badge) {
      badge.style.display = unreadCount > 0 ? "" : "none";
      badge.textContent =
        unreadCount > 0
          ? (unreadCount > 1
              ? nt("unread_many", "{n} non lues")
              : nt("unread_one", "{n} non lue")
            ).replace("{n}", unreadCount)
          : "";
    }
    const markAll = root.querySelector("#nf2-mark-all");
    if (markAll) markAll.disabled = unreadCount === 0;
  };

  // Mark single as read + navigate (souris ET clavier : nf2-item est role=button)
  root.querySelectorAll(".nf2-item").forEach((el) => {
    const open = async () => {
      haptic("select");
      const id = el.dataset.id;
      const route = el.dataset.route;
      if (el.dataset.read === "false") {
        el.dataset.read = "true";
        el.classList.remove("unread");
        unreadCount = Math.max(0, unreadCount - 1);
        updateBadge();
        Promise.resolve(sb.rpc("mark_notif_read", { p_notif_id: id })).catch(
          () => {},
        );
        track("notification.read", { notif_id: id });
      }
      if (route && route !== "#/") {
        navigate(route);
      }
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  // Mark all
  const markAllBtn = root.querySelector("#nf2-mark-all");
  if (markAllBtn) {
    markAllBtn.addEventListener("click", async () => {
      markAllBtn.disabled = true;
      markAllBtn.textContent = "…";
      const { error } = await sb.rpc("mark_all_notifs_read");
      if (error) {
        toast(nt("update_err", "Erreur de mise à jour"), "error");
        markAllBtn.disabled = false;
        markAllBtn.textContent = nt("mark_all", "Tout lu");
        return;
      }
      root.querySelectorAll(".nf2-item.unread").forEach((el) => {
        el.classList.remove("unread");
        el.dataset.read = "true";
      });
      unreadCount = 0;
      updateBadge();
      markAllBtn.textContent = nt("mark_all", "Tout lu");
      toast(
        nt("mark_all_success", "Toutes les notifications lues"),
        "success",
        2000,
      );
      track("notifications.mark_all_read", {});
    });
  }

  // Swipe to delete
  root.querySelectorAll(".nf2-item-wrap").forEach((wrap) => {
    wireSwipeDelete(wrap, async () => {
      haptic("warning");
      const id = wrap.dataset.id;
      const undoEl = document.createElement("div");
      undoEl.style.cssText =
        "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:12px 20px;border-radius:12px;font:600 13px/1 'Archivo',sans-serif;z-index:999;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,.3)";
      undoEl.dir = getLang() === "ar" ? "rtl" : "ltr";
      if (getLang() === "ar") undoEl.lang = "ar";
      undoEl.innerHTML = `<span>${esc(nt("deleted", "Notification supprimée"))}</span><button style="background:none;border:none;color:var(--a);font:700 12px/1 'Archivo',sans-serif;cursor:pointer;padding:0">${esc(nt("cancel", "Annuler"))}</button>`;
      document.body.appendChild(undoEl);

      let undone = false;
      undoEl.querySelector("button")?.addEventListener("click", () => {
        undone = true;
        undoEl.remove();
        wrap.style.height = "";
        wrap.style.overflow = "";
        wrap.querySelector(".nf2-item").style.transform = "";
        wrap.style.opacity = "";
        track("notification.delete_undone", { notif_id: id });
      });

      setTimeout(async () => {
        undoEl.remove();
        if (undone) return;
        wrap.style.transition = "height .3s ease, opacity .3s ease";
        wrap.style.height = "0";
        wrap.style.opacity = "0";
        wrap.style.overflow = "hidden";
        try {
          const { error } = await sb
            .from("notifications")
            .delete()
            .eq("id", id);
          if (error) throw error;
        } catch (error) {
          console.error("[notifications] suppression", error);
          wrap.style.transition = "";
          wrap.style.height = "";
          wrap.style.opacity = "";
          wrap.style.overflow = "";
          const item = wrap.querySelector(".nf2-item");
          if (item) item.style.transform = "";
          toast("Suppression impossible. Réessaie", "error");
          return;
        }
        setTimeout(() => wrap.remove(), 350);
        if (wrap.querySelector(".nf2-item.unread")) {
          unreadCount = Math.max(0, unreadCount - 1);
          updateBadge();
        }
        track("notification.deleted", { notif_id: id });
      }, 3000);
    });
  });
}

// ─── Swipe-to-delete logic ────────────────────────────────────
function wireSwipeDelete(wrap, onDelete) {
  const item = wrap.querySelector(".nf2-item");
  if (!item) return;
  const THRESHOLD = 64;
  let startX = 0,
    curX = 0,
    swiping = false;

  item.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      curX = 0;
      swiping = true;
    },
    { passive: true },
  );

  item.addEventListener(
    "touchmove",
    (e) => {
      if (!swiping) return;
      const dx = e.touches[0].clientX - startX;
      if (dx > 0) {
        swiping = false;
        wrap.classList.remove("swiping");
        return;
      } // only left swipe
      curX = Math.max(-80, dx);
      if (curX < -4) wrap.classList.add("swiping");
      item.style.transition = "none";
      item.style.transform = `translateX(${curX}px)`;
    },
    { passive: true },
  );

  item.addEventListener(
    "touchend",
    () => {
      if (!swiping) return;
      swiping = false;
      if (curX <= -THRESHOLD) {
        item.style.transition = "transform .25s cubic-bezier(.32,.72,0,1)";
        item.style.transform = "translateX(-80px)";
        // Tap on delete bg
        const deleteBg = wrap.querySelector(".nf2-delete-bg");
        if (deleteBg) {
          deleteBg.addEventListener("click", onDelete, { once: true });
          // Auto-retour après 3s si pas tapé
          setTimeout(() => {
            if (!wrap.parentNode) return;
            item.style.transition = "transform .2s ease";
            item.style.transform = "";
            wrap.classList.remove("swiping");
          }, 3000);
        }
      } else {
        item.style.transition = "transform .2s cubic-bezier(.23,1,.32,1)";
        item.style.transform = "";
        wrap.classList.remove("swiping");
      }
    },
    { passive: true },
  );

  // Tap delete bg directly
  const deleteBg = wrap.querySelector(".nf2-delete-bg");
  if (deleteBg) {
    deleteBg.addEventListener("click", () => {
      if (
        parseFloat(item.style.transform?.replace("translateX(", "") ?? "0") <
        -THRESHOLD
      ) {
        onDelete();
      }
    });
  }
}

// ─── Pull-to-refresh ──────────────────────────────────────────
function wirePullToRefresh(root, me) {
  const scrollEl = root.querySelector(".nf2") || root;
  const ptr = root.querySelector("#nf2-ptr");
  if (!ptr) return;

  let startY = 0,
    pulling = false;
  const THRESHOLD = 60;

  scrollEl.addEventListener(
    "touchstart",
    (e) => {
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    },
    { passive: true },
  );

  scrollEl.addEventListener(
    "touchmove",
    (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 10 && window.scrollY <= 0) {
        ptr.classList.add("visible");
      }
    },
    { passive: true },
  );

  scrollEl.addEventListener(
    "touchend",
    async () => {
      if (!pulling) return;
      pulling = false;
      if (!ptr.classList.contains("visible")) return;

      haptic("select");
      track("notifications.pull_refreshed", {});
      await loadNotifs(root, me);
      wireItems(root, me, root.querySelectorAll(".nf2-item.unread").length);
      ptr.classList.remove("visible");
    },
    { passive: true },
  );
}

// ─── Skeleton helper (inline fallback) ────────────────────────
function skelRows(n) {
  const row = `<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--bo2)">
    <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%);background-size:200% 100%;animation:nfShim 1.4s ease-in-out infinite;flex-shrink:0"></div>
    <div style="flex:1;display:flex;flex-direction:column;gap:6px">
      <div style="height:13px;border-radius:6px;width:60%;background:linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%);background-size:200% 100%;animation:nfShim 1.4s ease-in-out infinite"></div>
      <div style="height:11px;border-radius:6px;width:80%;background:linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%);background-size:200% 100%;animation:nfShim 1.4s ease-in-out infinite"></div>
    </div>
  </div>`;
  return `<style>@keyframes nfShim{from{background-position:200% 0}to{background-position:-200% 0}}</style>
    <div style="background:var(--su);border-top:1px solid var(--bo);border-bottom:1px solid var(--bo)">${row.repeat(n)}</div>`;
}
