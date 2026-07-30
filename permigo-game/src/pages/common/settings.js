// ═══════════════════════════════════════════════════════════════
// Settings — préférences utilisateur (notifs, confidentialité, compte)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { applyTheme, getTheme } from "@/utils/theme.js";
import { getLang, applyLang } from "@/utils/lang.js";
import { ACCENTS, getAccent, setAccent } from "@/utils/accent.js";
import { isSoundEnabled, setSoundEnabled, playBack } from "@/utils/sound.js";
import { optInPush, optOutPush, isPushEnabled } from "@/services/web-push.js";
import { isStandalone, guessPlatform } from "@/utils/pwa.js";
import { openInstallSheet } from "@/components/common/install-nudge.js";
import {
  startCheckout,
  getSubscription,
  isActive,
} from "@/services/billing.js";

// ── i18n de la COQUE Réglages : les libellés se traduisent (EN/AR) pour les
// utilisateurs non-francophones. Les NOMS de langue du sélecteur restent tels
// quels (Français / English / العربية). st(key, fr) = traduit-ou-français, esc
// intégré (sûr en texte ET en attribut). En 'fr' ou clé absente → français.
const SET_I18N = {
  en: {
    back: "Back",
    page_title: "Preferences",
    app_group: "App",
    app_add_home: "Add to home screen",
    app_add_home_aria: "Add PermiGo to home screen",
    app_add_home_sub: "Open PermiGo in one tap, like a real app",
    ens_group: "Your students",
    ens_wheel: "Your rewards wheel",
    ens_wheel_aria: "Set up your rewards wheel",
    ens_wheel_sub: "Choose the prizes for your students, your brand",
    sub_group: "Subscription",
    sub_loading: "Loading…",
    sub_cta: "Subscribe — €9.99/month",
    sub_manage: "Manage my subscription",
    sub_mine: "My subscription",
    partial_load_err: "Some preferences could not be loaded",
    dnd_start_aria: "Do not disturb: start time",
    dnd_end_aria: "Do not disturb: end time",
    notif_group: "Notifications",
    notif_push: "Push notifications",
    notif_push_sub: "Reminders and updates in your browser",
    notif_push_aria: "Enable push notifications",
    notif_email: "Email notifications",
    notif_email_sub: "Weekly summary by email",
    notif_email_aria: "Enable email notifications",
    dnd: "Do not disturb",
    dnd_auto: "Saved automatically",
    dnd_from: "From",
    dnd_to: "to",
    priv_group: "Privacy",
    priv_rank: "National ranking",
    priv_rank_sub: "Appear in your school's rankings",
    priv_rank_aria: "Appear in the ranking",
    account_group: "My account",
    account_firstname: "Display name",
    account_firstname_sub: "Visible to your instructor",
    account_firstname_ph: "Your first name",
    save: "Save",
    account_pwd: "Password",
    account_pwd_sub: "Change via reset email",
    edit_arrow: "Change →",
    appear_group: "Appearance",
    theme: "Theme",
    theme_sub: "App appearance",
    theme_light: "Light",
    theme_dark: "Dark",
    theme_auto: "System",
    theme_aria: "Choose theme",
    lang: "Language",
    lang_sub: "Questions show in your language, with French kept below.",
    lang_aria: "Choose language",
    accent: "Accent colour",
    accent_sub: "Don't like green? Pick your colour.",
    accent_aria: "Choose accent colour",
    sound: "Interface sounds",
    sound_sub: "Sound feedback on actions and rewards",
    sound_aria: "Enable interface sounds",
    help_group: "Help",
    help_tour: "Replay the getting-started guide",
    help_tour_sub: "Restart the step-by-step tour",
    replay_arrow: "Replay →",
    data_group: "My data",
    data_export: "Export my data",
    data_export_sub: "Download a JSON file of all your data",
    export_arrow: "Export →",
    marketing: "Marketing emails",
    marketing_sub: "Tips, news and PermiGo offers",
    marketing_aria: "Receive marketing emails",
    privacy_policy: "Privacy policy",
    read_arrow: "Read →",
    cgu: "Terms of use",
    credits: "Credits & licences",
    danger_group: "Danger zone",
    delete_account: "Delete my account",
    delete_account_sub: "Irreversible — personal data deleted or anonymised",
    delete_modal_transparency:
      "Your personal data is deleted or anonymised: your first name, email and photo are removed, and your statistics become anonymous. Your account cannot be recovered.",
    delete: "Delete",
    load_err_title: "Couldn't load your preferences",
    load_err_sub: "Check your connection, then try again.",
    retry: "Try again",
    prefs_saved: "Preferences saved",
    checkout_success: "Thank you! Your subscription is being activated.",
    checkout_cancel: "Payment cancelled.",
    sub_ends: "{base} — ends on {date}",
    sub_next_charge: "{base} — next payment on {date}",
    sub_monthly_active: "Monthly subscription active",
    sub_active: "Subscription active",
    sub_pro_desc:
      "PermiGo Pro — digital REMC booklet, student tracking, no ads.",
    redirecting: "Redirecting…",
    checkout_failed:
      "Unable to open payment. Try again or contact us: contact@permigo.fr",
    push_install:
      "First install PermiGo on your home screen to enable notifications.",
    push_blocked:
      "Notifications are blocked — allow them in your phone settings.",
    push_enabled: "Notifications enabled ✓",
    save_error: "Save error",
    dnd_saved: "Do not disturb period saved",
    firstname_empty: "The first name cannot be empty",
    firstname_updated: "First name updated: {name}",
    export_failed: "Unable to export",
    download_started: "Download started",
    export_error: "Error while exporting",
    marketing_enabled: "Marketing emails enabled",
    marketing_disabled: "Marketing emails disabled",
    connection_error: "Connection error",
    delete_action: "This action is",
    irreversible: "irreversible",
    delete_confirm_instruction: "To confirm, type exactly:",
    confirmation: "Confirmation",
    cancel: "Cancel",
    delete_auth_note:
      "To erase the authentication account, contact",
    delete_failed: "Unable to delete — contact dpo@permigo.fr",
    delete_error: "Error — contact dpo@permigo.fr",
  },
  ar: {
    back: "رجوع",
    page_title: "الإعدادات",
    app_group: "التطبيق",
    app_add_home: "أضف إلى الشاشة الرئيسية",
    app_add_home_aria: "أضف بيرميغو إلى الشاشة الرئيسية",
    app_add_home_sub: "افتح بيرميغو بلمسة واحدة، مثل تطبيق حقيقي",
    ens_group: "طلابك",
    ens_wheel: "عجلة مكافآتك",
    ens_wheel_aria: "اضبط عجلة مكافآتك",
    ens_wheel_sub: "اختر الجوائز لطلابك، بعلامتك",
    sub_group: "الاشتراك",
    sub_loading: "جارٍ التحميل…",
    sub_cta: "اشترك — 9,99 € / شهر",
    sub_manage: "إدارة اشتراكي",
    sub_mine: "اشتراكي",
    partial_load_err: "تعذّر تحميل بعض الإعدادات",
    dnd_start_aria: "عدم الإزعاج: وقت البدء",
    dnd_end_aria: "عدم الإزعاج: وقت الانتهاء",
    notif_group: "الإشعارات",
    notif_push: "الإشعارات الفورية",
    notif_push_sub: "تذكيرات وتحديثات في المتصفح",
    notif_push_aria: "تفعيل الإشعارات الفورية",
    notif_email: "إشعارات البريد الإلكتروني",
    notif_email_sub: "ملخّص أسبوعي عبر البريد",
    notif_email_aria: "تفعيل إشعارات البريد",
    dnd: "عدم الإزعاج",
    dnd_auto: "يُحفظ تلقائياً",
    dnd_from: "من",
    dnd_to: "إلى",
    priv_group: "الخصوصية",
    priv_rank: "التصنيف الوطني",
    priv_rank_sub: "الظهور في تصنيفات مدرستك",
    priv_rank_aria: "الظهور في التصنيف",
    account_group: "حسابي",
    account_firstname: "الاسم المعروض",
    account_firstname_sub: "مرئي لمدرّبك",
    account_firstname_ph: "اسمك",
    save: "حفظ",
    account_pwd: "كلمة المرور",
    account_pwd_sub: "التغيير عبر بريد إعادة التعيين",
    edit_arrow: "تغيير ←",
    appear_group: "المظهر",
    theme: "السمة",
    theme_sub: "مظهر التطبيق",
    theme_light: "فاتح",
    theme_dark: "داكن",
    theme_auto: "النظام",
    theme_aria: "اختر السمة",
    lang: "اللغة",
    lang_sub: "تظهر الأسئلة بلغتك، مع الاحتفاظ بالفرنسية تحتها.",
    lang_aria: "اختر اللغة",
    accent: "لون التمييز",
    accent_sub: "لا يعجبك الأخضر؟ اختر لونك.",
    accent_aria: "اختر لون التمييز",
    sound: "أصوات الواجهة",
    sound_sub: "أصوات عند الإجراءات والمكافآت",
    sound_aria: "تفعيل أصوات الواجهة",
    help_group: "المساعدة",
    help_tour: "إعادة دليل البدء",
    help_tour_sub: "إعادة الجولة التعريفية خطوة بخطوة",
    replay_arrow: "إعادة ←",
    data_group: "بياناتي",
    data_export: "تصدير بياناتي",
    data_export_sub: "نزّل ملف JSON بكل بياناتك",
    export_arrow: "تصدير ←",
    marketing: "رسائل تسويقية",
    marketing_sub: "نصائح وأخبار وعروض بيرميغو",
    marketing_aria: "استلام الرسائل التسويقية",
    privacy_policy: "سياسة الخصوصية",
    read_arrow: "قراءة ←",
    cgu: "شروط الاستخدام",
    credits: "الحقوق والتراخيص",
    danger_group: "منطقة حسّاسة",
    delete_account: "حذف حسابي",
    delete_account_sub: "لا رجعة فيه — تُحذف بياناتك الشخصية أو تُجعل مجهولة",
    delete_modal_transparency:
      "تُحذف بياناتك الشخصية أو تُجعل مجهولة الهوية: يُمحى اسمك وبريدك الإلكتروني وصورتك، وتصبح إحصاءاتك مجهولة. لا يمكن استرجاع حسابك.",
    delete: "حذف",
    load_err_title: "تعذّر تحميل إعداداتك",
    load_err_sub: "تحقّق من اتصالك ثم أعد المحاولة.",
    retry: "أعد المحاولة",
    prefs_saved: "تم حفظ الإعدادات",
    checkout_success: "شكرًا! جارٍ تفعيل اشتراكك.",
    checkout_cancel: "تم إلغاء الدفع.",
    sub_ends: "{base} — ينتهي في {date}",
    sub_next_charge: "{base} — الدفعة التالية في {date}",
    sub_monthly_active: "الاشتراك الشهري مفعّل",
    sub_active: "الاشتراك مفعّل",
    sub_pro_desc:
      "بيرميغو برو — دفتر REMC رقمي، متابعة الطلاب، بلا إعلانات.",
    redirecting: "جارٍ التحويل…",
    checkout_failed:
      "تعذّر فتح الدفع. أعد المحاولة أو راسلنا: contact@permigo.fr",
    push_install:
      "ثبّت بيرميغو أولًا على شاشتك الرئيسية لتفعيل الإشعارات.",
    push_blocked:
      "الإشعارات محظورة — اسمح بها في إعدادات الهاتف.",
    push_enabled: "تم تفعيل الإشعارات ✓",
    save_error: "خطأ في الحفظ",
    dnd_saved: "تم حفظ فترة عدم الإزعاج",
    firstname_empty: "لا يمكن أن يكون الاسم فارغًا",
    firstname_updated: "تم تحديث الاسم: {name}",
    export_failed: "تعذّر التصدير",
    download_started: "بدأ التنزيل",
    export_error: "خطأ أثناء التصدير",
    marketing_enabled: "تم تفعيل الرسائل التسويقية",
    marketing_disabled: "تم تعطيل الرسائل التسويقية",
    connection_error: "خطأ في الاتصال",
    delete_action: "هذا الإجراء",
    irreversible: "لا رجعة فيه",
    delete_confirm_instruction: "للتأكيد، اكتب العبارة التالية حرفيًا:",
    confirmation: "التأكيد",
    cancel: "إلغاء",
    delete_auth_note: "لمحو حساب المصادقة، تواصل مع",
    delete_failed: "تعذّر الحذف — تواصل مع dpo@permigo.fr",
    delete_error: "خطأ — تواصل مع dpo@permigo.fr",
  },
};
// Traduit-ou-français, avec esc() intégré (sûr en texte et en attribut ""). En
// 'fr' ou si la clé manque → le français passé en 2e argument (jamais de vide).
function stR(key, fr, vars) {
  const l = getLang();
  const v = l !== "fr" ? SET_I18N[l]?.[key] : null;
  let value = v || fr;
  if (vars)
    for (const [name, replacement] of Object.entries(vars))
      value = value.split(`{${name}}`).join(String(replacement));
  return value;
}
function st(key, fr, vars) {
  return esc(stR(key, fr, vars));
}
function stA(key, fr, vars) {
  return escAttr(stR(key, fr, vars));
}
function settingsDir() {
  return getLang() === "ar" ? ' dir="rtl" lang="ar"' : "";
}
function settingsDateLocale() {
  return { fr: "fr-FR", en: "en-GB", ar: "ar" }[getLang()] || "fr-FR";
}

const STYLE = `<style>
.st {
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  min-height: 100dvh;
  padding-bottom: 80px;
  font-family: 'Inter', sans-serif;
}
/* header vitré collé sous le header global */
.st-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  background: color-mix(in srgb, var(--su) 90%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--bo);
  position: sticky;
  top: calc(var(--th, 52px) + env(safe-area-inset-top, 0px));
  z-index: 10;
}
.st-back {
  width: 38px; height: 38px;
  border-radius: var(--r-md);
  border: 1px solid var(--bo);
  background: var(--su);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background .12s;
  color: var(--ink);
  font-family: inherit;
  padding: 0;
  position: relative;
}
.st-back::before { content: ''; position: absolute; inset: -4px; } /* hit-area 44 */
.st-back:hover { background: var(--bg2); }
.st-page-title {
  font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -.02em;
}

/* Squelette de chargement */
.st-skel-block {
  margin: 20px 16px 0;
  border-radius: 16px;
  background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
  background-size: 200% 100%;
  animation: stShimmer 1.4s infinite;
}
@keyframes stShimmer { to { background-position: -200% 0; } }

/* Corps : groupes = libellé AU-DESSUS + carte */
.st-body { padding: 16px 14px 30px; display: flex; flex-direction: column; gap: 18px; }
.st-glabel {
  font: 700 11px/1 'Inter', sans-serif;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--mu); padding: 0 8px 8px;
}
.st-section {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--rl);
  overflow: hidden;
  box-shadow: var(--s1);
}

/* Ligne : tuile d'icône colorée + texte + action (style Réglages iOS) */
.st-row {
  display: flex; align-items: center; gap: 13px;
  padding: 13px 14px;
  border-top: 1px solid var(--bo2);
  min-height: 58px;
}
.st-row:first-child { border-top: 0; }
.st-row.tap { cursor: pointer; transition: background .12s; }
.st-row.tap:active { background: var(--bg2); }
.st-row.col { flex-direction: column; align-items: stretch; gap: 11px; }
.st-rhead { display: flex; align-items: center; gap: 13px; }
.st-expand { padding-left: 45px; }
/* Médaillon 3D : porte sa propre couleur → juste un centrage, pas de fond teinté */
.st-ic {
  width: 32px; height: 32px; flex: none;
  display: grid; place-items: center;
}
.st-ic svg { width: 32px; height: 32px; display: block; }
.st-row-left { flex: 1; min-width: 0; }
.st-row-title { font: 700 14px/1.25 'Plus Jakarta Sans', sans-serif; color: var(--ink); }
.st-row-sub { font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu); margin-top: 2px; }
.st-row-action { flex-shrink: 0; display: flex; align-items: center; }
.st-chev { color: var(--mu); width: 18px; height: 18px; flex: none; }

/* Toggle switch (biblio : off = token, on = accent) */
.st-tgl { position: relative; display: inline-block; width: 46px; height: 28px; cursor: pointer; flex: none; }
.st-tgl input { display: none; }
.st-tgl-t { position: absolute; inset: 0; background: var(--bo4); border-radius: 999px; transition: background .2s; }
.st-tgl-t::after { content: ''; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: var(--s1); }
.st-tgl input:checked + .st-tgl-t { background: var(--a); }
.st-tgl input:checked + .st-tgl-t::after { transform: translateX(18px); }

/* Text button */
.st-btn-txt {
  font: 700 13px/1 'Inter', sans-serif;
  color: var(--a-txt);
  background: none; border: none; cursor: pointer;
  padding: 10px 6px; margin: -6px -6px;
  font-family: inherit;
}
.st-btn-txt.danger { color: var(--rd-txt); }

/* Input */
.st-inp {
  width: 100%;
  height: 44px;
  padding: 0 13px;
  font: 600 14px/1 'Inter', sans-serif;
  color: var(--ink);
  background: var(--bg);
  border: 1.5px solid var(--bo4);
  border-radius: var(--r-md);
  transition: border-color .15s, box-shadow .15s;
  font-family: inherit;
}
.st-inp:focus { outline: none; border-color: var(--a); box-shadow: 0 0 0 4px var(--ap); }
.st-inp.time { height: 40px; text-align: center; }
.st-inp-line { display: flex; gap: 9px; align-items: center; }
.st-save-btn {
  height: 44px; padding: 0 18px;
  background: var(--a); color: var(--a-ink);
  border: none; border-radius: var(--r-md);
  font: 800 13.5px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; transition: background .15s;
  font-family: inherit; flex: none;
}
.st-save-btn:hover { background: var(--adk); }
.st-save-btn:disabled { opacity: .5; cursor: default; }

/* Ne pas déranger */
.st-dnd { display: flex; align-items: center; gap: 9px; }
.st-dnd label { font: 600 12px/1 'Inter', sans-serif; color: var(--mu); flex-shrink: 0; }

/* Danger zone */
.st-danger { border-color: color-mix(in srgb, var(--rd) 26%, var(--bo)); }

/* Theme segmented control */
.st-theme-seg { display: flex; gap: 3px; background: var(--bg2); border: 1px solid var(--bo); border-radius: var(--r-md); padding: 3px; width: 100%; }
.st-theme-btn {
  flex: 1; padding: 9px 4px; border: none; border-radius: var(--r-sm);
  background: transparent; font: 700 12.5px/1 'Inter', sans-serif; color: var(--mu);
  cursor: pointer; transition: background .15s cubic-bezier(.23,1,.32,1), color .15s, box-shadow .15s;
  white-space: nowrap; min-height: 44px; font-family: inherit;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
}
.st-theme-btn svg { width: 15px; height: 15px; }
.st-theme-btn.active { background: var(--su); color: var(--a-txt); box-shadow: var(--s1); }

/* Accent color swatches */
.st-accent-row { display: flex; gap: 12px; flex-wrap: wrap; }
.st-accent-sw {
  width: 44px; height: 44px; border-radius: 50%;
  border: 0; cursor: pointer; padding: 0;
  background: var(--sw);
  box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--sw) 55%, transparent), inset 0 1.5px 0 rgba(255,255,255,.3);
  position: relative;
  transition: transform .12s cubic-bezier(.34,1.56,.64,1);
  -webkit-tap-highlight-color: transparent;
}
.st-accent-sw:active { transform: scale(.9); }
.st-accent-sw[aria-pressed="true"] { box-shadow: 0 0 0 3px var(--su), 0 0 0 5px var(--sw); }
.st-accent-sw[aria-pressed="true"]::after {
  content: ''; position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: center/16px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E");
}

/* Delete modal overlay */
.st-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  backdrop-filter: blur(4px);
  z-index: 900;
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom);
}
.st-modal-box {
  width: 100%;
  max-width: 480px;
  background: var(--su);
  border-radius: 24px 24px 0 0;
  padding: 24px 20px 32px;
}
.st-modal-handle {
  width: 36px; height: 4px;
  background: var(--bo4);
  border-radius: 2px;
  margin: 0 auto 20px;
}
.st-modal-title {
  font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 8px;
}
.st-modal-body {
  font: 400 14px/1.6 'Inter', sans-serif;
  color: var(--mu);
  margin-bottom: 16px;
}
.st-modal-body strong { color: var(--ink); }
.st-modal-label {
  font: 600 12px/1 'Inter', sans-serif;
  color: var(--mu);
  margin-bottom: 6px;
}
.st-modal-inp {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg);
  border: 1.5px solid var(--bo4);
  border-radius: 10px;
  font: 500 14px/1 'IBM Plex Mono', monospace;
  color: var(--ink);
  letter-spacing: .04em;
  transition: border-color .15s;
  box-sizing: border-box;
}
.st-modal-inp:focus { outline: none; border-color: var(--rd); }
.st-modal-actions { display: flex; gap: 10px; margin-top: 16px; }
.st-modal-cancel {
  flex: 1; padding: 14px;
  background: var(--bg); border: 1.5px solid var(--bo); border-radius: 12px;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif; color: var(--mu3);
  cursor: pointer; min-height: 48px; font-family: inherit;
  transition: background .12s;
}
.st-modal-cancel:active { background: var(--bg2); }
.st-modal-confirm {
  flex: 1; padding: 14px;
  background: var(--rd); border: none; border-radius: 12px;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif; color: #fff;
  cursor: pointer; min-height: 48px; font-family: inherit;
  transition: background .12s, opacity .12s;
}
.st-modal-confirm:disabled { opacity: .4; cursor: not-allowed; }
.st-modal-confirm:not(:disabled):active { background: var(--rdk); }
.st-dpo-note {
  font: 400 12px/1.5 'Inter', sans-serif;
  color: var(--mu2);
  text-align: center;
  margin-top: 12px;
}
.st-dpo-note a { color: var(--a-txt); }
</style>`;

// Tours relançables depuis les Réglages : flag localStorage à effacer + page
// hôte où le tour se redéclenche au mount. Pas d'entrée pour le gérant (pas
// de tour). [[guided-tour]]
const TOUR_CFG = {
  eleve: { key: "pg-tour-eleve-v1", route: "/" },
  enseignant: { key: "pg-tour-moniteur-v1", route: "/" },
};

export async function mount(root, param) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "settings", role: me.role });

  // Squelette immédiat : l'écran ne reste plus figé sur la page précédente
  // le temps du réseau
  root.innerHTML = `${STYLE}
<div class="st"${settingsDir()}>
  ${renderHeader()}
  <div class="st-skel-block" style="height:120px"></div>
  <div class="st-skel-block" style="height:180px"></div>
  <div class="st-skel-block" style="height:140px"></div>
</div>`;

  // Load current profile prefs + RGPD preferences in parallel
  const [profileRes, prefsRes] = await Promise.allSettled([
    sb
      .from("profiles")
      .select(
        "prenom, notif_push, notif_email, show_in_ranking, dnd_start, dnd_end",
      )
      .eq("id", me.id)
      .maybeSingle(),
    sb.rpc("get_my_preferences"),
  ]);

  const profileFailed =
    profileRes.status !== "fulfilled" || !!profileRes.value.error;
  const profile =
    profileRes.status === "fulfilled" ? profileRes.value.data : null;
  const prefsFailed = prefsRes.status !== "fulfilled" || !!prefsRes.value.error;
  const myPrefs = prefsRes.status === "fulfilled" ? prefsRes.value.data : null;

  // Lecture du profil en échec : état d'erreur + retry, plutôt que des
  // toggles pré-remplis de défauts trompeurs (risque d'écraser les vraies prefs)
  if (profileFailed) {
    root.innerHTML = `${STYLE}
<div class="st"${settingsDir()}>
  ${renderHeader()}
  <div class="st-section" style="margin-top:20px;padding:28px 20px;text-align:center">
    <div style="margin-bottom:10px;color:var(--mu3)">${icon("alert-circle", { size: 30 })}</div>
    <div style="font:700 15px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:6px">${st("load_err_title", "Impossible de charger tes préférences")}</div>
    <div style="font:500 13px/1.5 'Inter',sans-serif;color:var(--mu3);margin-bottom:16px">${st("load_err_sub", "Vérifie ta connexion, puis réessaie.")}</div>
    <button class="st-save-btn" id="st-retry" style="margin:0 auto;width:auto;padding:10px 20px">${st("retry", "Réessayer")}</button>
  </div>
</div>`;
    root
      .querySelector("#st-back")
      ?.addEventListener("click", () => navigate("/profil"));
    root
      .querySelector("#st-retry")
      ?.addEventListener("click", () => mount(root));
    return;
  }
  if (prefsFailed) {
    toast(
      stR(
        "partial_load_err",
        "Certaines préférences n'ont pas pu être chargées",
      ),
      "error",
      2500,
    );
  }

  const prefs = {
    notifPush: profile?.notif_push ?? true,
    notifEmail: profile?.notif_email ?? true,
    showInRanking: profile?.show_in_ranking ?? false,
    dndStart: (profile?.dnd_start ?? "22:00:00").slice(0, 5),
    dndEnd: (profile?.dnd_end ?? "07:00:00").slice(0, 5),
    prenom: profile?.prenom ?? "",
    marketingOptin: myPrefs?.marketing_optin ?? false,
    theme:
      myPrefs?.theme === "light" ||
      myPrefs?.theme === "dark" ||
      myPrefs?.theme === "auto"
        ? myPrefs.theme
        : getTheme(),
    language:
      myPrefs?.language === "fr" ||
      myPrefs?.language === "en" ||
      myPrefs?.language === "ar"
        ? myPrefs.language
        : getLang(),
  };

  render(root, me, prefs);
  wire(root, me, prefs);

  // Deep-link #/settings/supprimer (feuille « Supprimer mon compte » du
  // profil élève + URL publique /suppression-compte.html) : ouvre
  // directement la modale de suppression — un seul vrai flux dans l'app.
  if (param === "supprimer") _showDeleteModal(root, me);
}

function renderHeader() {
  return `
  <div class="st-header">
    <button class="st-back" id="st-back" aria-label="${stA("back", "Retour")}">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="st-page-title">${st("page_title", "Préférences")}</div>
  </div>`;
}

// Chevron « aller à » réutilisé
const _CHEV = `<svg class="st-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`;

function render(root, me, prefs) {
  root.innerHTML = `${STYLE}
<div class="st anim-slide-up"${settingsDir()}>
  ${renderHeader()}
  <div class="st-body">
${
  isStandalone() || guessPlatform() === "other"
    ? ""
    : `
  <!-- APPLICATION : install écran d'accueil (masqué si déjà installée / desktop) -->
  <div>
    <div class="st-glabel">${st("app_group", "Application")}</div>
    <div class="st-section">
      <div class="st-row tap" id="st-install-row" role="button" tabindex="0" aria-label="${stA("app_add_home_aria", "Ajouter PermiGo à l'écran d'accueil")}">
        <span class="st-ic" aria-hidden="true">${medallion("fusee", "cyan", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("app_add_home", "Ajouter à l'écran d'accueil")}</div>
          <div class="st-row-sub">${st("app_add_home_sub", "Ouvre PermiGo d'un geste, comme une vraie app")}</div>
        </div>
        <div class="st-row-action">${_CHEV}</div>
      </div>
    </div>
  </div>`
}
${
  me.role === "enseignant"
    ? `
  <!-- RÉCOMPENSES ÉLÈVES -->
  <div>
    <div class="st-glabel">${st("ens_group", "Tes élèves")}</div>
    <div class="st-section">
      <div class="st-row tap" id="st-recompenses-row" role="button" tabindex="0" aria-label="${stA("ens_wheel_aria", "Régler ta roue de récompenses")}">
        <span class="st-ic" aria-hidden="true">${medallion("cadeau", "orange", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("ens_wheel", "Ta roue de récompenses")}</div>
          <div class="st-row-sub">${st("ens_wheel_sub", "Choisis les lots offerts à tes élèves, à ta marque")}</div>
        </div>
        <div class="st-row-action">${_CHEV}</div>
      </div>
    </div>
  </div>`
    : ""
}
${
  me.role === "enseignant" || me.role === "eleve"
    ? `
  <!-- ABONNEMENT — moniteur (toujours visible) ou élève avec abo mensuel actif
       (masqué par défaut, révélé dans wire() : un élève sans abo ne voit rien). -->
  <div id="st-sub-group"${me.role === "eleve" ? ' style="display:none"' : ""}>
    <div class="st-glabel">${st("sub_group", "Abonnement")}</div>
    <div class="st-section">
      <div class="st-row col">
        <div class="st-rhead">
          <span class="st-ic" aria-hidden="true">${medallion("etoile", "gold", { size: 32, shape: "tile" })}</span>
          <div class="st-row-left">
            <div class="st-row-title">${me.role === "enseignant" ? "PermiGo Pro" : st("sub_mine", "Mon abonnement")}</div>
            <div class="st-row-sub" id="st-sub-status">${st("sub_loading", "Chargement…")}</div>
          </div>
        </div>
        <button class="st-save-btn" id="st-subscribe" style="display:none;align-self:stretch;text-align:center">${st("sub_cta", "S'abonner — 9,99 €/mois")}</button>
        <button class="st-save-btn" id="st-manage-sub" style="display:none;align-self:stretch;text-align:center;background:var(--su);color:var(--a-txt);border:1.5px solid var(--bo4)">${st("sub_manage", "Gérer mon abonnement")}</button>
      </div>
    </div>
  </div>`
    : ""
}

  <!-- NOTIFICATIONS -->
  <div>
    <div class="st-glabel">${st("notif_group", "Notifications")}</div>
    <div class="st-section">
      <div class="st-row">
        <span class="st-ic" aria-hidden="true">${medallion("cloche", "violet", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("notif_push", "Notifications push")}</div>
          <div class="st-row-sub">${st("notif_push_sub", "Rappels et mises à jour dans le navigateur")}</div>
        </div>
        <div class="st-row-action">
          <label class="st-tgl" aria-label="${stA("notif_push_aria", "Activer notifications push")}">
            <input type="checkbox" id="tgl-push" ${prefs.notifPush ? "checked" : ""}>
            <span class="st-tgl-t"></span>
          </label>
        </div>
      </div>
      <div class="st-row">
        <span class="st-ic" aria-hidden="true">${medallion("message", "blue", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("notif_email", "Notifications email")}</div>
          <div class="st-row-sub">${st("notif_email_sub", "Résumé hebdomadaire par email")}</div>
        </div>
        <div class="st-row-action">
          <label class="st-tgl" aria-label="${stA("notif_email_aria", "Activer notifications email")}">
            <input type="checkbox" id="tgl-email" ${prefs.notifEmail ? "checked" : ""}>
            <span class="st-tgl-t"></span>
          </label>
        </div>
      </div>
      <div class="st-row col">
        <div class="st-rhead">
          <span class="st-ic" aria-hidden="true">${medallion("lune", "violet", { size: 32, shape: "tile" })}</span>
          <div class="st-row-left">
            <div class="st-row-title">${st("dnd", "Ne pas déranger")}</div>
            <div class="st-row-sub">${st("dnd_auto", "Enregistré automatiquement")}</div>
          </div>
        </div>
        <div class="st-dnd st-expand">
          <label for="inp-dnd-start">${st("dnd_from", "De")}</label>
          <input class="st-inp time" id="inp-dnd-start" type="time" step="60" value="${prefs.dndStart}" aria-label="${stA("dnd_start_aria", "Ne pas déranger : heure de début")}" style="flex:1">
          <label for="inp-dnd-end">${st("dnd_to", "à")}</label>
          <input class="st-inp time" id="inp-dnd-end" type="time" step="60" value="${prefs.dndEnd}" aria-label="${stA("dnd_end_aria", "Ne pas déranger : heure de fin")}" style="flex:1">
        </div>
      </div>
    </div>
  </div>

  <!-- CONFIDENTIALITÉ -->
  <div>
    <div class="st-glabel">${st("priv_group", "Confidentialité")}</div>
    <div class="st-section">
      <div class="st-row">
        <span class="st-ic" aria-hidden="true">${medallion("trophee", "orange", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("priv_rank", "Classement national")}</div>
          <div class="st-row-sub">${st("priv_rank_sub", "Apparaître dans les classements de ton école")}</div>
        </div>
        <div class="st-row-action">
          <label class="st-tgl" aria-label="${stA("priv_rank_aria", "Apparaître dans le classement")}">
            <input type="checkbox" id="tgl-ranking" ${prefs.showInRanking ? "checked" : ""}>
            <span class="st-tgl-t"></span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- MON COMPTE -->
  <div>
    <div class="st-glabel">${st("account_group", "Mon compte")}</div>
    <div class="st-section">
      <div class="st-row col">
        <div class="st-rhead">
          <span class="st-ic" aria-hidden="true">${medallion("profil", "violet", { size: 32, shape: "tile" })}</span>
          <div class="st-row-left">
            <div class="st-row-title">${st("account_firstname", "Prénom affiché")}</div>
            <div class="st-row-sub">${st("account_firstname_sub", "Visible par ton moniteur")}</div>
          </div>
        </div>
        <div class="st-inp-line st-expand">
          <input class="st-inp" id="inp-prenom" type="text" value="${escAttr(prefs.prenom)}" maxlength="30" placeholder="${stA("account_firstname_ph", "Ton prénom")}" autocomplete="given-name" style="flex:1">
          <button class="st-save-btn" id="btn-save-prenom">${st("save", "Enregistrer")}</button>
        </div>
      </div>
      <div class="st-row">
        <span class="st-ic" aria-hidden="true">${medallion("cle", "slate", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("account_pwd", "Mot de passe")}</div>
          <div class="st-row-sub">${st("account_pwd_sub", "Modifier via email de réinitialisation")}</div>
        </div>
        <div class="st-row-action">
          <button class="st-btn-txt" id="btn-reset-pwd">${st("edit_arrow", "Modifier →")}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- APPARENCE -->
  <div>
    <div class="st-glabel">${st("appear_group", "Apparence")}</div>
    <div class="st-section">
      <div class="st-row col">
        <div class="st-rhead">
          <span class="st-ic" aria-hidden="true">${medallion("lune", "indigo", { size: 32, shape: "tile" })}</span>
          <div class="st-row-left">
            <div class="st-row-title">${st("theme", "Thème")}</div>
            <div class="st-row-sub">${st("theme_sub", "Apparence de l'application")}</div>
          </div>
        </div>
        <div class="st-theme-seg st-expand" id="theme-seg" role="group" aria-label="${stA("theme_aria", "Choisir le thème")}">
          <button class="st-theme-btn ${prefs.theme === "light" ? "active" : ""}" data-set-theme="light" aria-pressed="${prefs.theme === "light"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg> ${st("theme_light", "Clair")}</button>
          <button class="st-theme-btn ${prefs.theme === "dark" ? "active" : ""}" data-set-theme="dark" aria-pressed="${prefs.theme === "dark"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg> ${st("theme_dark", "Sombre")}</button>
          <button class="st-theme-btn ${prefs.theme === "auto" ? "active" : ""}" data-set-theme="auto" aria-pressed="${prefs.theme === "auto"}">${st("theme_auto", "Système")}</button>
        </div>
      </div>
      <div class="st-row col">
        <div class="st-rhead">
          <span class="st-ic" aria-hidden="true" style="font-size:26px;line-height:1;display:flex;align-items:center;justify-content:center">🌍</span>
          <div class="st-row-left">
            <div class="st-row-title">${st("lang", "Langue")}</div>
            <div class="st-row-sub">${st("lang_sub", "Les questions s'affichent dans ta langue, le français gardé dessous.")}</div>
          </div>
        </div>
        <div class="st-theme-seg st-expand" id="lang-seg" role="group" aria-label="${stA("lang_aria", "Choisir la langue")}">
          <button class="st-theme-btn ${prefs.language === "fr" ? "active" : ""}" data-set-lang="fr" aria-pressed="${prefs.language === "fr"}">Français</button>
          <button class="st-theme-btn ${prefs.language === "en" ? "active" : ""}" data-set-lang="en" aria-pressed="${prefs.language === "en"}">English</button>
          <button class="st-theme-btn ${prefs.language === "ar" ? "active" : ""}" data-set-lang="ar" aria-pressed="${prefs.language === "ar"}" lang="ar">العربية</button>
        </div>
      </div>
      <div class="st-row col">
        <div class="st-rhead">
          <span class="st-ic" aria-hidden="true">${medallion("crayon", "pink", { size: 32, shape: "tile" })}</span>
          <div class="st-row-left">
            <div class="st-row-title">${st("accent", "Couleur d'accent")}</div>
            <div class="st-row-sub">${st("accent_sub", "Le vert ne te plaît pas ? Choisis ta couleur.")}</div>
          </div>
        </div>
        <div class="st-accent-row st-expand" id="accent-row" role="group" aria-label="${stA("accent_aria", "Choisir la couleur d'accent")}">
          ${ACCENTS.map((p) => `<button class="st-accent-sw" type="button" data-accent="${p.id}" aria-pressed="${getAccent() === p.id}" aria-label="${escAttr(p.name)}" title="${escAttr(p.name)}" style="--sw:${p.a}"></button>`).join("")}
        </div>
      </div>
      <div class="st-row">
        <span class="st-ic" aria-hidden="true">${medallion("casque", "green", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("sound", "Sons d'interface")}</div>
          <div class="st-row-sub">${st("sound_sub", "Retours sonores sur les actions et récompenses")}</div>
        </div>
        <div class="st-row-action">
          <label class="st-tgl" aria-label="${stA("sound_aria", "Activer les sons d'interface")}">
            <input type="checkbox" id="tgl-sound" ${isSoundEnabled() ? "checked" : ""}>
            <span class="st-tgl-t"></span>
          </label>
        </div>
      </div>
    </div>
  </div>

  ${
    TOUR_CFG[me.role]
      ? `<!-- AIDE -->
  <div>
    <div class="st-glabel">${st("help_group", "Aide")}</div>
    <div class="st-section">
      <div class="st-row">
        <span class="st-ic" aria-hidden="true">${medallion("ampoule", "cyan", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("help_tour", "Revoir le guide de démarrage")}</div>
          <div class="st-row-sub">${st("help_tour_sub", "Relance la visite guidée pas à pas")}</div>
        </div>
        <div class="st-row-action">
          <button class="st-btn-txt" id="btn-replay-tour">${st("replay_arrow", "Relancer →")}</button>
        </div>
      </div>
    </div>
  </div>`
      : ""
  }

  <!-- MES DONNÉES (RGPD) -->
  <div>
    <div class="st-glabel">${st("data_group", "Mes données")}</div>
    <div class="st-section">
      <div class="st-row">
        <span class="st-ic" aria-hidden="true">${medallion("fiches", "green", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("data_export", "Exporter mes données")}</div>
          <div class="st-row-sub">${st("data_export_sub", "Télécharge un fichier JSON de toutes tes données")}</div>
        </div>
        <div class="st-row-action">
          <button class="st-btn-txt" id="btn-export-data">${st("export_arrow", "Exporter →")}</button>
        </div>
      </div>
      <div class="st-row">
        <span class="st-ic" aria-hidden="true">${medallion("megaphone", "orange", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("marketing", "Emails marketing")}</div>
          <div class="st-row-sub">${st("marketing_sub", "Conseils, nouveautés et offres PermiGo")}</div>
        </div>
        <div class="st-row-action">
          <label class="st-tgl" aria-label="${stA("marketing_aria", "Recevoir les emails marketing")}">
            <input type="checkbox" id="tgl-marketing" ${prefs.marketingOptin ? "checked" : ""}>
            <span class="st-tgl-t"></span>
          </label>
        </div>
      </div>
      <div class="st-row tap">
        <span class="st-ic" aria-hidden="true">${medallion("bouclier", "slate", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("privacy_policy", "Politique de confidentialité")}</div>
        </div>
        <div class="st-row-action">
          <button class="st-btn-txt" id="btn-privacy">${st("read_arrow", "Lire →")}</button>
        </div>
      </div>
      <div class="st-row tap">
        <span class="st-ic" aria-hidden="true">${medallion("livret", "slate", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("cgu", "Conditions générales d'utilisation")}</div>
        </div>
        <div class="st-row-action">
          <button class="st-btn-txt" id="btn-cgu">${st("read_arrow", "Lire →")}</button>
        </div>
      </div>
      <div class="st-row tap">
        <span class="st-ic" aria-hidden="true">${medallion("coeur", "pink", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title">${st("credits", "Crédits & licences")}</div>
        </div>
        <div class="st-row-action">
          <button class="st-btn-txt" id="btn-credits">${st("read_arrow", "Lire →")}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ZONE DANGER -->
  <div>
    <div class="st-glabel" style="color:var(--rd-txt)">${st("danger_group", "Zone critique")}</div>
    <div class="st-section st-danger">
      <div class="st-row">
        <span class="st-ic" aria-hidden="true">${medallion("faute", "red", { size: 32, shape: "tile" })}</span>
        <div class="st-row-left">
          <div class="st-row-title" style="color:var(--rd-txt)">${st("delete_account", "Supprimer mon compte")}</div>
          <div class="st-row-sub">${st("delete_account_sub", "Irréversible — données personnelles supprimées ou anonymisées")}</div>
        </div>
        <div class="st-row-action">
          <button class="st-btn-txt danger" id="btn-delete-account">${st("delete", "Supprimer")}</button>
        </div>
      </div>
    </div>
  </div>

  </div>
</div>`;
}

function wire(root, me, prefs) {
  root.querySelector("#st-back")?.addEventListener("click", () => {
    playBack();
    navigate("/");
  });

  // Entrée moniteur → réglage de la roue de récompenses
  root
    .querySelector("#st-recompenses-row")
    ?.addEventListener("click", () => navigate("/recompenses"));

  // Entrée permanente « Ajouter à l'écran d'accueil »
  const installRow = root.querySelector("#st-install-row");
  if (installRow) {
    const openInstall = () => {
      track("a2hs.from_settings", { role: me?.role });
      openInstallSheet(me);
    };
    installRow.addEventListener("click", openInstall);
    installRow.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openInstall();
      }
    });
  }

  // ── Abonnement (moniteur : bêta indé ; élève : abo mensuel Pass Permis) ──
  const subBtn = root.querySelector("#st-subscribe");
  const manageBtn = root.querySelector("#st-manage-sub");
  const subStatus = root.querySelector("#st-sub-status");
  const subGroup = root.querySelector("#st-sub-group");
  if (subStatus) {
    // Retour de Stripe Checkout (#/settings?checkout=success|cancel)
    const checkout = (location.hash.split("?")[1] || "")
      .split("&")
      .find((p) => p.startsWith("checkout="))
      ?.split("=")[1];
    if (checkout === "success")
      toast(
        stR(
          "checkout_success",
          "Merci ! Ton abonnement est en cours d'activation.",
        ),
        "success",
      );
    else if (checkout === "cancel")
      toast(stR("checkout_cancel", "Paiement annulé."), "info");

    // « Gérer mon abonnement » → étape de rétention DANS l'app (questionnaire),
    // qui débouche sur la résiliation en ligne via le portail Stripe.
    manageBtn?.addEventListener("click", () => {
      track("billing.manage_opened", { role: me?.role });
      navigate("#/avis-depart?from=settings");
    });

    // Libellé « abonnement actif » enrichi de la période Stripe (si connue).
    const activeLabel = (sub, base) => {
      const until = sub?.current_period_end
        ? new Date(sub.current_period_end).toLocaleDateString(
            settingsDateLocale(),
          )
        : null;
      return sub?.cancel_at_period_end
        ? stR("sub_ends", "{base} — se termine le {date}", {
            base,
            date: until,
          })
        : until
          ? stR("sub_next_charge", "{base} — prochain prélèvement le {date}", {
              base,
              date: until,
            })
          : base;
    };

    if (me.role === "eleve") {
      // Un élève ne voit ce bloc QUE s'il a un abonnement MENSUEL récurrent :
      // les Pass 3/6 mois sont des achats uniques (rien à résilier, ils expirent).
      (async () => {
        let hasMonthly = false;
        try {
          const { data } = await sb.rpc("get_my_pass_status");
          hasMonthly = !!data?.has_pass && data.plan === "mensuel";
        } catch (e) {
          console.error("[settings] pass status", e);
        }
        if (!hasMonthly) return; // rien de neuf pour un élève sans abo mensuel
        const sub = await getSubscription();
        subStatus.textContent = activeLabel(
          sub,
          stR("sub_monthly_active", "Abonnement mensuel actif"),
        );
        if (manageBtn) manageBtn.style.display = "";
        if (subGroup) subGroup.style.display = "";
      })();
    } else {
      // Moniteur : bloc toujours visible. Abonné → gérer ; sinon → s'abonner.
      getSubscription().then((sub) => {
        if (isActive(sub)) {
          subStatus.textContent = activeLabel(
            sub,
            stR("sub_active", "Abonnement actif"),
          );
          if (subBtn) subBtn.style.display = "none";
          if (manageBtn) manageBtn.style.display = "";
        } else {
          subStatus.textContent = stR(
            "sub_pro_desc",
            "PermiGo Pro — livret REMC numérique, suivi élèves, sans pub.",
          );
          if (subBtn) subBtn.style.display = "";
          if (manageBtn) manageBtn.style.display = "none";
        }
      });

      subBtn?.addEventListener("click", async () => {
        subBtn.disabled = true;
        subBtn.textContent = stR("redirecting", "Redirection…");
        track("billing.checkout_start", { role: me?.role });
        try {
          await startCheckout(); // redirige vers Stripe si OK
        } catch (e) {
          console.error("[settings] checkout", e);
          toast(
            stR(
              "checkout_failed",
              "Impossible d'ouvrir le paiement. Réessaie ou écris-nous : contact@permigo.fr",
            ),
            "error",
            6000,
          );
          subBtn.disabled = false;
          subBtn.textContent = stR(
            "sub_cta",
            "S'abonner — 9,99 €/mois",
          );
        }
      });
    }
  }

  // Toggle changes — save debounced
  const savePrefs = _debounce(async () => {
    const push = root.querySelector("#tgl-push")?.checked ?? prefs.notifPush;
    const email = root.querySelector("#tgl-email")?.checked ?? prefs.notifEmail;
    const ranking =
      root.querySelector("#tgl-ranking")?.checked ?? prefs.showInRanking;
    const { error } = await sb
      .from("profiles")
      .update({
        notif_push: push,
        notif_email: email,
        show_in_ranking: ranking,
      })
      .eq("id", me.id);
    if (!error) {
      track("settings.prefs_saved", {});
      const _l = getLang();
      toast(
        (_l !== "fr" && SET_I18N[_l]?.prefs_saved) ||
          "Préférences enregistrées",
        "success",
        2000,
      );
    }
  }, 800);

  // ── Notifications push : déclenche la VRAIE demande d'autorisation +
  //    l'abonnement (avant ce fix, le toggle ne faisait que sauver un flag,
  //    donc aucun ding ne pouvait arriver — surtout sur iPhone). ──
  const pushTgl = root.querySelector("#tgl-push");
  if (pushTgl) {
    // Reflète l'état RÉEL d'abonnement (pas juste la préférence DB).
    if ("Notification" in window) pushTgl.checked = isPushEnabled();
    pushTgl.addEventListener("change", async () => {
      if (pushTgl.checked) {
        if (!("Notification" in window)) {
          // iOS hors PWA : pas d'API notif tant que l'app n'est pas installée.
          pushTgl.checked = false;
          toast(
            stR(
              "push_install",
              "Installe d'abord PermiGo sur ton écran d'accueil pour activer les notifications.",
            ),
            "info",
            4500,
          );
          return;
        }
        // optInPush() appelle Notification.requestPermission() de façon
        // synchrone dans ce gestionnaire de clic → iOS accepte la demande.
        const granted = await optInPush();
        if (!granted) {
          pushTgl.checked = false;
          if (Notification.permission === "denied")
            toast(
              stR(
                "push_blocked",
                "Notifications bloquées — autorise-les dans les réglages du téléphone.",
              ),
              "error",
              4500,
            );
          return;
        }
        toast(
          stR("push_enabled", "Notifications activées ✓"),
          "success",
          2000,
        );
      } else {
        await optOutPush();
      }
      savePrefs();
    });
  }
  root.querySelector("#tgl-email")?.addEventListener("change", savePrefs);
  root.querySelector("#tgl-ranking")?.addEventListener("change", savePrefs);

  // DND : sauvegarde automatique au changement (plus de bouton OK criard)
  const saveDnd = async () => {
    const start = root.querySelector("#inp-dnd-start")?.value;
    const end = root.querySelector("#inp-dnd-end")?.value;
    if (!start || !end) return;
    const { error } = await sb
      .from("profiles")
      .update({ dnd_start: start, dnd_end: end })
      .eq("id", me.id);
    if (error) {
      toast(stR("save_error", "Erreur de sauvegarde"), "error", 2000);
    } else {
      toast(
        stR("dnd_saved", "Plage Ne pas déranger enregistrée"),
        "success",
        2000,
      );
      track("settings.dnd_saved", {});
    }
  };
  root.querySelector("#inp-dnd-start")?.addEventListener("change", saveDnd);
  root.querySelector("#inp-dnd-end")?.addEventListener("change", saveDnd);

  // Save prénom
  root
    .querySelector("#btn-save-prenom")
    ?.addEventListener("click", async () => {
      const val = root.querySelector("#inp-prenom")?.value?.trim();
      if (!val) {
        toast(
          stR("firstname_empty", "Le prénom ne peut pas être vide"),
          "error",
        );
        return;
      }
      const btn = root.querySelector("#btn-save-prenom");
      btn.disabled = true;
      btn.textContent = "…";
      const { error } = await sb
        .from("profiles")
        .update({ prenom: val })
        .eq("id", me.id);
      btn.disabled = false;
      btn.textContent = stR("save", "Enregistrer");
      if (error) {
        toast(stR("save_error", "Erreur de sauvegarde"), "error");
        return;
      }
      toast(
        stR("firstname_updated", "Prénom mis à jour : {name}", {
          name: esc(val),
        }),
        "success",
      );
      track("settings.prenom_updated", {});
    });

  // Modifier le mot de passe → écran dédié "Nouveau mot de passe".
  // L'utilisateur est déjà connecté → updateUser fonctionne directement,
  // sans aller-retour email (l'ancien flux resetPasswordForEmail bouclait
  // sur Réglages sans jamais proposer de champ mot de passe).
  root.querySelector("#btn-reset-pwd")?.addEventListener("click", () => {
    track("settings.pwd_change_opened", {});
    location.hash = "#/nouveau-mdp";
  });

  // Theme segmented control
  root.querySelector("#theme-seg")?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".st-theme-btn");
    if (!btn) return;
    const mode = btn.dataset.setTheme;
    root.querySelectorAll("#theme-seg .st-theme-btn").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    applyTheme(mode);
    track("settings.theme_changed", { theme: mode });
    try {
      await sb.rpc("set_my_preferences", { p_data: { theme: mode } });
    } catch (e) {
      console.error("[settings] theme save", e);
    }
  });

  // Langue (fr / en / ar) — même chemin que le thème (applyLang + RPC), mais
  // contrairement au thème le TEXTE de la page vient de st()/SET_I18N évalués
  // au render initial → il ne bascule pas tout seul. On re-rend donc toute la
  // page (render+wire sur le DOM existant, pas de fuite : innerHTML remplace
  // les anciens nœuds/listeners). La nav du bas se reconstruit de son côté en
  // écoutant l'event permigo:lang-changed émis par applyLang().
  root.querySelector("#lang-seg")?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".st-theme-btn");
    if (!btn) return;
    const lang = btn.dataset.setLang;
    if (lang === prefs.language) return;
    applyLang(lang);
    track("settings.language_changed", { language: lang });
    prefs.language = lang;
    render(root, me, prefs);
    wire(root, me, prefs);
    try {
      await sb.rpc("set_my_preferences", { p_data: { language: lang } });
    } catch (err) {
      console.error("[settings] language save", err);
    }
  });

  // Couleur d'accent (localStorage + application live)
  root.querySelector("#accent-row")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".st-accent-sw");
    if (!btn) return;
    const id = btn.dataset.accent;
    root.querySelectorAll(".st-accent-sw").forEach((b) => {
      b.setAttribute("aria-pressed", String(b === btn));
    });
    setAccent(id);
    track("settings.accent_changed", { accent: id });
  });

  // Sound toggle (localStorage only, no DB write)
  root.querySelector("#tgl-sound")?.addEventListener("change", (e) => {
    setSoundEnabled(e.target.checked);
    track("settings.sound_toggled", { enabled: e.target.checked });
  });

  // Export mes données
  root
    .querySelector("#btn-export-data")
    ?.addEventListener("click", async () => {
      const btn = root.querySelector("#btn-export-data");
      btn.textContent = "…";
      btn.style.pointerEvents = "none";
      try {
        const { data, error } = await sb.rpc("export_my_data");
        if (error || data?.error) {
          toast(
            data?.error || stR("export_failed", "Export impossible"),
            "error",
          );
          return;
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `permigo-export-${date}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast(
          stR("download_started", "Téléchargement lancé"),
          "success",
          3000,
        );
        track("rgpd.data_exported", {});
      } catch (e) {
        console.error("[settings] export", e);
        toast(stR("export_error", "Erreur lors de l'export"), "error");
      } finally {
        btn.textContent = stR("export_arrow", "Exporter →");
        btn.style.pointerEvents = "";
      }
    });

  // Marketing toggle
  root
    .querySelector("#tgl-marketing")
    ?.addEventListener("change", async (e) => {
      const val = e.target.checked;
      try {
        const { error } = await sb.rpc("set_my_preferences", {
          p_data: { marketing_optin: val },
        });
        if (error) {
          toast(stR("save_error", "Erreur de sauvegarde"), "error");
          return;
        }
        toast(
          val
            ? stR("marketing_enabled", "Emails marketing activés")
            : stR("marketing_disabled", "Emails marketing désactivés"),
          "success",
          2000,
        );
        track("rgpd.marketing_optin_changed", { value: val });
      } catch {
        toast(stR("connection_error", "Erreur de connexion"), "error");
      }
    });

  // Legal links
  root
    .querySelector("#btn-privacy")
    ?.addEventListener("click", () => navigate("#/legal/privacy"));
  root
    .querySelector("#btn-cgu")
    ?.addEventListener("click", () => navigate("#/legal/cgu"));
  root
    .querySelector("#btn-credits")
    ?.addEventListener("click", () => navigate("#/legal/credits"));

  // Revoir le guide : on efface le flag puis on rejoint la page hôte —
  // le tour se redéclenche tout seul au mount.
  root.querySelector("#btn-replay-tour")?.addEventListener("click", () => {
    const cfg = TOUR_CFG[me.role];
    if (!cfg) return;
    try {
      localStorage.removeItem(cfg.key);
    } catch {
      /* stockage indispo */
    }
    track("settings.replay_tour", { role: me.role });
    navigate(cfg.route);
  });

  // Delete account — modal avec saisie de confirmation
  root.querySelector("#btn-delete-account")?.addEventListener("click", () => {
    _showDeleteModal(root, me);
  });
}

const CONFIRM_TEXT = "SUPPRIMER MON COMPTE";

function _showDeleteModal(root, me) {
  const overlay = document.createElement("div");
  overlay.className = "st-modal-overlay";
  overlay.dir = getLang() === "ar" ? "rtl" : "ltr";
  if (getLang() === "ar") overlay.lang = "ar";
  overlay.innerHTML = `
<div class="st-modal-box" role="dialog" aria-modal="true" aria-labelledby="del-modal-title">
  <div class="st-modal-handle"></div>
  <div class="st-modal-title" id="del-modal-title">${st("delete_account", "Supprimer mon compte")}</div>
  <div class="st-modal-body">
    ${st("delete_action", "Cette action est")} <strong>${st("irreversible", "irréversible")}</strong>.
    ${st("delete_modal_transparency", "Tes données personnelles sont supprimées ou anonymisées : ton prénom, ton email et ta photo disparaissent, tes statistiques deviennent anonymes. Ton compte ne pourra pas être récupéré.")}
    <br><br>${st("delete_confirm_instruction", "Pour confirmer, tape exactement :")}<br><strong>${CONFIRM_TEXT}</strong>
  </div>
  <div class="st-modal-label">${st("confirmation", "Confirmation")}</div>
  <input class="st-modal-inp" id="del-confirm-inp" type="text" placeholder="${escAttr(CONFIRM_TEXT)}" autocomplete="off" spellcheck="false">
  <div class="st-modal-actions">
    <button class="st-modal-cancel" id="del-cancel">${st("cancel", "Annuler")}</button>
    <button class="st-modal-confirm" id="del-confirm" disabled>${st("delete", "Supprimer")}</button>
  </div>
  <p class="st-dpo-note">${st("delete_auth_note", "Pour l'effacement côté authentification, contacte")} <a href="mailto:dpo@permigo.fr">dpo@permigo.fr</a></p>
</div>`;

  document.body.appendChild(overlay);

  const inp = overlay.querySelector("#del-confirm-inp");
  const confirm = overlay.querySelector("#del-confirm");
  const cancel = overlay.querySelector("#del-cancel");

  inp.focus();
  inp.addEventListener("input", () => {
    confirm.disabled = inp.value !== CONFIRM_TEXT;
  });

  cancel.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  enableSheetSwipe(
    overlay.querySelector(".st-modal-box"),
    () => overlay.remove(),
    { overlay },
  );

  confirm.addEventListener("click", async () => {
    if (inp.value !== CONFIRM_TEXT) return;
    confirm.disabled = true;
    confirm.textContent = "…";
    track("account.delete_confirmed", {});
    try {
      const { data, error } = await sb.rpc("delete_my_account", {
        p_confirm_text: CONFIRM_TEXT,
      });
      if (error || data?.error) {
        toast(
          data?.error ||
            stR(
              "delete_failed",
              "Suppression impossible — contacte dpo@permigo.fr",
            ),
          "error",
          6000,
        );
        overlay.remove();
        return;
      }
      overlay.remove();
      await sb.auth.signOut();
      location.hash = "#/";
      location.reload();
    } catch (e) {
      console.error("[settings] delete_account", e);
      toast(
        stR("delete_error", "Erreur — contacte dpo@permigo.fr"),
        "error",
        6000,
      );
      overlay.remove();
    }
  });
}

function _debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
