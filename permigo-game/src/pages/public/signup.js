// ═══════════════════════════════════════════════════════════════
// Page publique — Signup via token d'invitation
// URL : #/signup?token=xxx
// Flow :
//   1. Récupère le token depuis l'URL
//   2. Vérifie l'invitation (existe, pas expirée, pas déjà acceptée)
//   3. Affiche le formulaire (email pré-rempli + mot de passe + nom)
//   4. À la soumission : sb.auth.signUp() → insère profile → marque invitation acceptée
//   5. Redirige vers l'accueil de son rôle
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { clearLocalGameState } from "@/utils/game-state.js";
import { getLang, applyLang } from "@/utils/lang.js";

const STYLE = `<style>
  /* DA « Arène 3D » (nuit-violet + plastique 3D) — cohérence avec le login */
  .sg {
    position: relative;
    min-height: 100dvh;
    padding: 32px 18px max(60px, calc(24px + env(safe-area-inset-bottom)));
    font-family: 'Archivo', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    --in:#6c63ff;--in-lt:#8e87ff;--in-dp:#4a3fc9;--in-dk:#372fa3;
    --gold:#ffce4d;--gold-dp:#e8a317;--go:#58cc02;--go-dp:#3a8a01;
    --ncard:#2b2160;--sg-ink:#f4f1ff;--ink-soft:#cdc8ec;--ink-mu:#aaa2d8;
    --field:#221a4f;--field-line:#6257a8;--focus:#ffd84d;
    color: var(--sg-ink);
    background:
      radial-gradient(120% 90% at 50% -10%, rgba(255,206,77,.16), transparent 55%),
      radial-gradient(130% 120% at 50% 110%, rgba(0,0,0,.55), transparent 60%),
      linear-gradient(160deg, #241a4d 0%, #3a2a7a 100%);
  }
  .sg-card {
    position: relative;
    width: 100%;
    max-width: 430px;
    background: linear-gradient(180deg, #322764 0%, var(--ncard) 60%, #261d56 100%);
    border-radius: 26px;
    padding: 30px 26px 26px;
    box-shadow:
      inset 0 3px 0 rgba(255,255,255,.18),
      inset 0 2px 14px rgba(255,255,255,.06),
      inset 0 -10px 22px rgba(0,0,0,.45),
      0 10px 0 #160f38,
      0 22px 38px rgba(0,0,0,.5),
      0 0 0 2px rgba(124,111,224,.35);
    animation: sgIn .35s cubic-bezier(.34,1.56,.64,1);
  }
  .sg-card::before {
    content: ""; position: absolute; inset: 0; border-radius: 26px; padding: 1.5px;
    background: linear-gradient(180deg, rgba(255,206,77,.55), rgba(255,206,77,0) 45%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
  }
  @keyframes sgIn {
    from { opacity: 0; transform: translateY(12px) scale(.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  /* Emblème vert PermiGo (seule marque) — halo pulsant comme le login */
  .sg-logo {
    position: relative; display: grid; place-items: center;
    width: 88px; height: 88px; margin: 0 auto 16px;
  }
  .sg-logo img {
    width: 88px; height: 88px; object-fit: contain; position: relative; z-index: 1;
    filter: drop-shadow(0 5px 8px rgba(0,0,0,.5)) drop-shadow(0 0 16px rgba(88,204,2,.6));
  }
  .sg-logo::before {
    content: ""; position: absolute; inset: -14px; border-radius: 50%; z-index: 0;
    background: radial-gradient(circle, rgba(88,204,2,.45), rgba(88,204,2,0) 68%);
    animation: sgPulse 2.8s ease-in-out infinite;
  }
  @keyframes sgPulse { 0%,100%{transform:scale(.92);opacity:.55} 50%{transform:scale(1.12);opacity:.9} }
  .sg-logo-fb { display:none; width:80px; height:80px; place-items:center; position:relative; z-index:1;
    background: linear-gradient(180deg, #7ee838, var(--go) 55%, var(--go-dp) 100%);
    clip-path: polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);
    box-shadow: inset 0 2px 3px rgba(255,255,255,.5), 0 4px 8px rgba(0,0,0,.4); }
  .sg-logo-fb b { color:#fff; font-size:38px; font-weight:800; text-shadow:0 2px 2px rgba(0,0,0,.35); }
  .sg-title {
    font: 800 24px/1.15 'Archivo', var(--fb), sans-serif;
    color: var(--sg-ink);
    text-align: center;
    margin: 6px 0 4px;
    text-shadow: 0 2px 0 rgba(0,0,0,.35);
  }
  .sg-sub {
    font: 600 14.5px/1.5 'Archivo', var(--fb), sans-serif;
    color: var(--ink-soft);
    text-align: center;
    margin: 0 0 24px;
  }
  .sg-sub strong { color: var(--gold); }
  .sg-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .sg-label {
    font: 700 13px/1 'Archivo', var(--fb), sans-serif;
    color: var(--ink-soft);
    letter-spacing: .04em;
    text-transform: uppercase;
    margin-left: 4px;
  }
  /* Champ = coque (icône + input), même famille que .lg-shell du login */
  .sg-shell {
    position: relative;
    display: flex;
    align-items: center;
    height: 52px;
    border-radius: 15px;
    background: var(--field);
    box-shadow: inset 0 2px 5px rgba(0,0,0,.5), inset 0 0 0 1.5px var(--field-line);
    transition: box-shadow .15s ease;
  }
  .sg-shell:focus-within {
    box-shadow: inset 0 2px 5px rgba(0,0,0,.4), inset 0 0 0 2px var(--focus), 0 0 0 4px rgba(255,216,77,.35);
  }
  .sg-shell.error { box-shadow: inset 0 2px 5px rgba(0,0,0,.5), inset 0 0 0 2px #ff8d8d; }
  .sg-ico { flex: 0 0 auto; display: grid; place-items: center; width: 44px; height: 100%; color: #b7afe8; }
  .sg-ico svg { width: 19px; height: 19px; }
  .sg-shell input {
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    padding: 0 16px 0 0;
    border: 0;
    background: transparent;
    font: 600 16px/1.3 'Archivo', var(--fb), sans-serif;
    color: var(--sg-ink);
    outline: 0;
    font-family: inherit;
  }
  .sg-shell input::placeholder { color: #9b93cf; font-weight: 500; }
  .sg-shell input[readonly] { color: var(--ink-mu); cursor: default; }
  .sg-shell:has(input[readonly]) { opacity: .85; }
  /* Date picker lisible sur fond sombre */
  .sg-shell input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.85); cursor: pointer; }
  .sg-help {
    font: 600 11.5px/1.4 'Archivo', var(--fb), sans-serif;
    color: var(--ink-mu);
    margin-top: 2px;
    margin-left: 4px;
  }
  .sg-help.error { color: #ffb3b3; }
  .sg-help.ok { color: #8fe85a; }
  .sg-italic {
    font: italic 500 12px/1.45 'Archivo', var(--fb), sans-serif;
    color: var(--ink-mu);
    margin-top: 4px;
    margin-left: 4px;
  }
  .sg-avail { display: inline-flex; align-items: center; gap: 5px; }
  /* FIX autofill : garde le champ sombre */
  .sg input:-webkit-autofill,
  .sg input:-webkit-autofill:hover,
  .sg input:-webkit-autofill:focus,
  .sg input:-webkit-autofill:active {
    -webkit-text-fill-color: var(--sg-ink) !important;
    -webkit-box-shadow: 0 0 0 1000px var(--field) inset !important;
    box-shadow: 0 0 0 1000px var(--field) inset !important;
    caret-color: var(--sg-ink); transition: background-color 9999s ease-out 0s;
  }
  /* CTA plastique 3D indigo (comme .lg-cta) */
  .sg-btn {
    width: 100%;
    margin-top: 18px;
    height: 58px;
    padding: 0;
    color: #fff;
    border: 0;
    border-radius: 17px;
    font: 800 18px/1 'Archivo', var(--fb), sans-serif;
    letter-spacing: .2px;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    background: linear-gradient(180deg, var(--in-lt) 0%, var(--in) 55%, var(--in-dp) 100%);
    box-shadow:
      inset 0 2px 0 rgba(255,255,255,.55), inset 0 -4px 8px rgba(0,0,0,.28),
      0 7px 0 var(--in-dk), 0 12px 20px rgba(74,63,201,.5);
    text-shadow: 0 2px 1px rgba(0,0,0,.3);
    transform: translateY(0);
    transition: transform .08s cubic-bezier(.34,1.56,.64,1), box-shadow .08s ease, filter .15s;
    font-family: inherit;
  }
  .sg-btn:hover:not(:disabled) { filter: brightness(1.04); }
  .sg-btn:active:not(:disabled) {
    transform: translateY(5px);
    box-shadow: inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 6px rgba(0,0,0,.3),
      0 2px 0 var(--in-dk), 0 5px 10px rgba(74,63,201,.45);
  }
  .sg-btn:disabled { opacity: .55; cursor: default; filter: grayscale(.1); }

  /* Bouton œil du mot de passe, flex dans la coque */
  .sg-pwd-toggle {
    flex: 0 0 auto;
    width: 44px; height: 100%;
    border: 0; background: none; cursor: pointer;
    color: #b7afe8; display: flex; align-items: center; justify-content: center;
    border-radius: 0 14px 14px 0;
    -webkit-tap-highlight-color: transparent;
  }
  .sg-pwd-toggle:hover { color: var(--sg-ink); }
  .sg-pwd-toggle:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }

  /* Sélecteur de langue (coque du formulaire, repli FR) */
  .sg-lang { display: flex; gap: 6px; margin-top: 2px; }
  .sg-lang-b {
    flex: 1; padding: 11px 4px; border-radius: 12px; border: 0;
    background: var(--field); color: var(--ink-mu);
    box-shadow: inset 0 0 0 1.5px var(--field-line);
    font: 700 13px/1.1 'Archivo', var(--fb), sans-serif; cursor: pointer;
    transition: box-shadow .15s ease, color .15s ease;
  }
  .sg-lang-b.active { color: var(--gold); box-shadow: inset 0 0 0 2px var(--gold); }

  /* Séparateur fin avant le footer */
  .sg-sep { height: 2px; border-radius: 2px; margin: 22px 0 0;
    background: linear-gradient(90deg, transparent, rgba(124,111,224,.4), transparent); }

  /* Lien se connecter */
  .sg-login-row { text-align: center; margin-top: 16px; font: 600 13.5px/1.4 'Archivo', var(--fb), sans-serif; color: var(--ink-soft); }
  .sg-login-row a { color: var(--gold); font-weight: 800; text-decoration: underline; text-underline-offset: 2px; }
  .sg-login-row a:hover { color: #ffe39a; }
  .sg-login-row a:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 6px; }
  /* Badge rôle = pastille dorée plastique */
  .sg-role-badge {
    display: inline-block;
    margin: 0 0 18px;
    padding: 6px 14px;
    background: linear-gradient(180deg, var(--gold), var(--gold-dp));
    color: #3a2600;
    border-radius: 99px;
    font: 800 11px/1 'Archivo', var(--fb), sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    box-shadow: inset 0 1px 1px rgba(255,255,255,.6), 0 3px 8px rgba(0,0,0,.35);
  }
  /* Carte d'erreur (token invalide / expiré) — même plaque 3D, liseré rouge */
  .sg-error-card {
    position: relative;
    width: 100%;
    max-width: 430px;
    background: linear-gradient(180deg, #322764 0%, var(--ncard) 60%, #261d56 100%);
    border-radius: 26px;
    padding: 30px 26px;
    text-align: center;
    box-shadow:
      inset 0 3px 0 rgba(255,255,255,.16),
      inset 0 -10px 22px rgba(0,0,0,.45),
      0 10px 0 #160f38,
      0 22px 38px rgba(0,0,0,.5),
      0 0 0 2px rgba(255,141,141,.4);
  }
  .sg-error-ico { color: #ffb3b3; margin-bottom: 12px; display: flex; justify-content: center; }
  .sg-error-title {
    font: 800 19px/1.2 'Archivo', var(--fb), sans-serif;
    color: var(--sg-ink);
    margin: 0 0 8px;
    text-shadow: 0 2px 0 rgba(0,0,0,.3);
  }
  .sg-error-msg {
    font: 600 13.5px/1.5 'Archivo', var(--fb), sans-serif;
    color: var(--ink-soft);
    margin: 0 0 18px;
  }
  /* Lien-bouton secondaire (retour / J'ai compris) — plaque sombre */
  .sg-link {
    color: var(--sg-ink);
    font: 800 14px/1 'Archivo', var(--fb), sans-serif;
    text-decoration: none;
    padding: 13px 24px;
    border: 0;
    border-radius: 14px;
    display: inline-block;
    background: linear-gradient(180deg, #3a2f72 0%, #2c2360 100%);
    box-shadow: inset 0 2px 0 rgba(255,255,255,.16), 0 4px 0 #1b143f, 0 7px 12px rgba(0,0,0,.35);
    transition: transform .08s ease, filter .15s;
  }
  .sg-link:hover { filter: brightness(1.08); }
  .sg-link:active { transform: translateY(3px); }
  .sg-link:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }

  /* Skeleton sur la plaque sombre */
  .sg-skel {
    width: 100%; max-width: 430px;
    height: 360px;
    background: linear-gradient(90deg, #2b2160 0%, #3a2f72 50%, #2b2160 100%);
    background-size: 200% 100%;
    animation: sgSkel 1.4s infinite;
    border-radius: 26px;
    box-shadow: 0 10px 0 #160f38, 0 22px 38px rgba(0,0,0,.5);
  }
  @keyframes sgSkel { to { background-position: -200% 0; } }

  /* A11y : mouvement réduit / contrastes forcés */
  @media (prefers-reduced-motion: reduce) {
    .sg-card, .sg-skel { animation: none; }
    .sg-logo::before { animation: none; transform: scale(1); opacity: .7; }
  }
  @media (forced-colors: active) {
    .sg-card, .sg-error-card { border: 1px solid CanvasText; }
    .sg-shell { border: 1px solid CanvasText; box-shadow: none; }
    .sg-btn, .sg-link { border: 2px solid ButtonText; box-shadow: none; }
    .sg :focus-visible { outline: 2px solid Highlight !important; }
    .sg-logo img { filter: none; }
  }
</style>`;

// ─── i18n (coque du formulaire) — traduction seule, repli FR. Même recette
// que rejoindre.js : SG_I18N + sgt()/sgtR(), un re-rendu complet à chaque
// changement de langue. ───────────────────────────────────────────────
const SG_I18N = {
  en: {
    title: "Activate your account",
    sub_school: "You're joining {school}",
    sub_default: "Welcome to PermiGo",
    role_enseignant: "Instructor",
    role_eleve: "Student",
    lang_help: "Questions show in your language. French stays below.",
    label_email: "Email",
    label_prenom: "First name",
    ph_prenom: "Your first name",
    label_nom: "Last name",
    ph_nom: "Your last name",
    label_usertag: "Username",
    ph_usertag: "e.g. maxdu13",
    help_usertag_default: "3 characters minimum.",
    italic_usertag:
      "Your unique handle. It's what other students see on the leaderboard.",
    help_usertag_checking: "Checking…",
    help_usertag_ok: "✓ Available",
    help_usertag_taken: "✗ Already taken, pick another",
    help_usertag_check_failed: "Check failed, try again.",
    label_naissance: "Date of birth",
    label_parent_email: "A parent's email",
    ph_parent_email: "parent@example.com",
    italic_parent:
      "You're under 15: we need your parent or legal guardian's consent. A validation link will be sent to them.",
    label_password: "Password",
    ph_password: "8 characters minimum",
    pwd_hide_aria: "Hide password",
    pwd_show_aria: "Show password",
    help_pwd_default: "Minimum 8 characters.",
    help_pwd_short: "Too short (minimum 8 characters).",
    submit: "Activate my account",
    submitting: "Activating…",
    have_account: "Already have an account? ",
    login_link: "Log in",
    consent_title: "Almost there! We're waiting for your parent's OK",
    consent_sub:
      "Since you're under 15, a parent or guardian must agree before you can use PermiGo. Send them this link:",
    consent_copy: "Copy the link",
    consent_copied: "✓ Link copied",
    consent_paste:
      "You can paste it in WhatsApp or a text to your parent. As soon as they confirm, your account unlocks.",
    consent_done: "Got it",
    err_link_title: "Invalid link",
    err_link_msg:
      "This invitation link has no token. Check the URL or contact your driving school.",
    err_conn_title: "Connection error",
    err_conn_msg:
      "Couldn't verify your invitation. Try again in a few seconds.",
    err_notfound_title: "Invitation not found",
    err_notfound_msg: "This link doesn't exist or was deleted.",
    err_used_title: "Already activated",
    err_used_msg:
      "This invitation has already been used. Go straight to log in.",
    err_expired_title: "Link expired",
    err_expired_msg:
      "This link is past its validity (7 days). Ask your driving school to send a new one.",
    err_back: "Back to home",
    toast_username_taken:
      "This username was just taken, change it and try again",
    toast_parent_email: "Enter a valid parent email",
    toast_already_registered:
      "An account already exists with this email. Log in directly.",
    toast_generic: "Error while activating the account",
  },
  ar: {
    title: "فعّل حسابك",
    sub_school: "أنت تنضمّ إلى {school}",
    sub_default: "مرحباً بك في PermiGo",
    role_enseignant: "مدرّب",
    role_eleve: "طالب",
    lang_help: "تظهر الأسئلة بلغتك. وتبقى الفرنسية تحتها.",
    label_email: "البريد الإلكتروني",
    label_prenom: "الاسم الأول",
    ph_prenom: "اسمك الأول",
    label_nom: "اسم العائلة",
    ph_nom: "اسم عائلتك",
    label_usertag: "اسم المستخدم",
    ph_usertag: "مثال: maxdu13",
    help_usertag_default: "3 أحرف على الأقل.",
    italic_usertag: "لقبك الفريد. هذا ما يراه الطلاب الآخرون في الترتيب.",
    help_usertag_checking: "جارٍ التحقّق…",
    help_usertag_ok: "✓ متاح",
    help_usertag_taken: "✗ مستخدَم بالفعل، اختر اسماً آخر",
    help_usertag_check_failed: "تعذّر التحقّق، أعد المحاولة.",
    label_naissance: "تاريخ الميلاد",
    label_parent_email: "بريد أحد الوالدين",
    ph_parent_email: "parent@exemple.fr",
    italic_parent:
      "عمرك أقل من 15 سنة: نحتاج موافقة أحد والديك أو الوصي القانوني. سيُرسَل رابط تأكيد إليه.",
    label_password: "كلمة المرور",
    ph_password: "8 أحرف على الأقل",
    pwd_hide_aria: "إخفاء كلمة المرور",
    pwd_show_aria: "إظهار كلمة المرور",
    help_pwd_default: "8 أحرف على الأقل.",
    help_pwd_short: "قصيرة جداً (8 أحرف على الأقل).",
    submit: "تفعيل حسابي",
    submitting: "جارٍ التفعيل…",
    have_account: "لديك حساب بالفعل؟ ",
    login_link: "تسجيل الدخول",
    consent_title: "على وشك الانتهاء! ننتظر موافقة والدك",
    consent_sub:
      "بما أن عمرك أقل من 15 سنة، يجب أن يوافق أحد والديك أو وصيّك قبل أن تتمكّن من استخدام PermiGo. أرسل له هذا الرابط:",
    consent_copy: "نسخ الرابط",
    consent_copied: "✓ تم نسخ الرابط",
    consent_paste:
      "يمكنك لصقه في واتساب أو رسالة نصية لوالدك. بمجرد موافقته، يُفتح حسابك.",
    consent_done: "فهمت",
    err_link_title: "رابط غير صالح",
    err_link_msg:
      "رابط الدعوة هذا لا يحتوي على رمز. تحقّق من الرابط أو تواصل مع مدرسة القيادة.",
    err_conn_title: "خطأ في الاتصال",
    err_conn_msg: "تعذّر التحقّق من دعوتك. أعد المحاولة خلال ثوانٍ.",
    err_notfound_title: "الدعوة غير موجودة",
    err_notfound_msg: "هذا الرابط غير موجود أو تم حذفه.",
    err_used_title: "تم التفعيل بالفعل",
    err_used_msg: "تم استخدام هذه الدعوة من قبل. سجّل الدخول مباشرة.",
    err_expired_title: "انتهت صلاحية الرابط",
    err_expired_msg:
      "تجاوز هذا الرابط مدة صلاحيته (7 أيام). اطلب من مدرسة القيادة إرسال رابط جديد.",
    err_back: "العودة إلى الرئيسية",
    toast_username_taken: "تم أخذ اسم المستخدم هذا للتو، غيّره وأعد المحاولة",
    toast_parent_email: "أدخِل بريد إلكتروني صالح لأحد الوالدين",
    toast_already_registered:
      "يوجد حساب بالفعل بهذا البريد. سجّل الدخول مباشرة.",
    toast_generic: "خطأ أثناء تفعيل الحساب",
  },
};
function sgtR(key, fr) {
  const l = getLang();
  return (l !== "fr" && SG_I18N[l]?.[key]) || fr;
}
function sgt(key, fr) {
  return esc(sgtR(key, fr));
}

export async function mount(root) {
  track("signup.viewed", { from: "invitation_link" });

  // Skeleton initial
  root.innerHTML = `${STYLE}<div class="sg"><div class="sg-skel"></div></div>`;

  // Extract token from hash : #/signup?token=xxx
  const hash = location.hash; // e.g. #/signup?token=abc-123
  const queryIdx = hash.indexOf("?");
  const search = queryIdx >= 0 ? hash.slice(queryIdx + 1) : "";
  const params = new URLSearchParams(search);
  const token = params.get("token");

  if (!token) {
    renderError(
      root,
      sgtR("err_link_title", "Lien invalide"),
      sgtR(
        "err_link_msg",
        "Ce lien d'invitation ne contient pas de token. Vérifie l'URL ou contacte ton auto-école.",
      ),
    );
    return;
  }

  // Vérifie l'invitation via RPC sécurisée (lecture seule, sans exposer la table)
  let invitation;
  try {
    const { data, error } = await sb.rpc("get_invitation_by_token", {
      p_token: token,
    });
    if (error) throw error;
    invitation = Array.isArray(data) ? data[0] : data;
    // Normalise pour matcher le shape attendu par renderForm
    if (invitation) {
      invitation.auto_ecoles = { nom: invitation.auto_ecole_nom };
    }
  } catch (e) {
    console.error("[signup] fetch invitation failed", e);
    renderError(
      root,
      sgtR("err_conn_title", "Erreur de connexion"),
      sgtR(
        "err_conn_msg",
        "Impossible de vérifier ton invitation. Réessaie dans quelques secondes.",
      ),
    );
    return;
  }

  if (!invitation) {
    renderError(
      root,
      sgtR("err_notfound_title", "Invitation introuvable"),
      sgtR("err_notfound_msg", "Ce lien n'existe pas ou a été supprimé."),
    );
    return;
  }
  if (invitation.accepted_at) {
    renderError(
      root,
      sgtR("err_used_title", "Déjà activé"),
      sgtR(
        "err_used_msg",
        "Cette invitation a déjà été utilisée. Va directement te connecter.",
      ),
    );
    return;
  }
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    renderError(
      root,
      sgtR("err_expired_title", "Lien expiré"),
      sgtR(
        "err_expired_msg",
        "Ce lien a dépassé sa durée de validité (7 jours). Demande à ton auto-école d'en envoyer un nouveau.",
      ),
    );
    return;
  }

  mountForm(root, invitation, token);
}

function mountForm(root, invitation, token) {
  const ecoleName = invitation?.auto_ecoles?.nom || "";
  const isEleve = invitation.role === "eleve";

  let chosenLang = getLang();
  let usertagAvailable = false;
  let usertagChecking = false;
  let checkTimer = null;
  let accountCreated = false; // permet de retenter le claim sans recréer le compte

  // Construit (ou RECONSTRUIT) tout le formulaire dans la langue courante et
  // rebranche les handlers. Appelé à l'init puis à chaque changement de langue
  // (re-rendu complet, recette de rejoindre.js/réglages). La saisie déjà tapée
  // est préservée via `preserve`.
  function renderForm(preserve) {
    const roleLabel =
      invitation.role === "enseignant"
        ? sgtR("role_enseignant", "Enseignant")
        : sgtR("role_eleve", "Élève");

    const eleveFields = isEleve
      ? `
        <div class="sg-row">
          <label class="sg-label" for="sg-nom">${sgt("label_nom", "Nom")}</label>
          <div class="sg-shell">
            <span class="sg-ico" aria-hidden="true">${icon("user", { size: 19 })}</span>
            <input id="sg-nom" type="text" autocomplete="family-name" placeholder="${sgt("ph_nom", "Ton nom")}" />
          </div>
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-usertag">${sgt("label_usertag", "Identifiant")}</label>
          <div class="sg-shell">
            <span class="sg-ico" aria-hidden="true">${icon("shield", { size: 19 })}</span>
            <input id="sg-usertag" type="text" autocomplete="off" autocapitalize="off" placeholder="${sgt("ph_usertag", "Ex : maxdu13")}" />
          </div>
          <div class="sg-help" id="sg-usertag-help">${sgt("help_usertag_default", "3 caractères minimum.")}</div>
          <div class="sg-italic">${sgt("italic_usertag", "Ton pseudo unique. C'est ce que les autres élèves voient dans le classement.")}</div>
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-naissance">${sgt("label_naissance", "Date de naissance")}</label>
          <div class="sg-shell">
            <span class="sg-ico" aria-hidden="true">${icon("calendar", { size: 19 })}</span>
            <input id="sg-naissance" type="date" />
          </div>
        </div>

        <div class="sg-row" id="sg-parent-block" style="display:none">
          <label class="sg-label" for="sg-parent-email">${sgt("label_parent_email", "Email d'un parent")}</label>
          <div class="sg-shell">
            <span class="sg-ico" aria-hidden="true">${icon("mail", { size: 19 })}</span>
            <input id="sg-parent-email" type="email" autocomplete="email" placeholder="${sgt("ph_parent_email", "parent@exemple.fr")}" />
          </div>
          <div class="sg-italic">${sgt("italic_parent", "Tu as moins de 15 ans : on doit recueillir l'accord de ton parent ou tuteur légal. Un lien de validation lui sera transmis.")}</div>
        </div>
  `
      : "";

    root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-card">
        <div class="sg-logo">
          <img src="/skins/avatars/permigo-badge-icon.png" alt="PermiGo" loading="eager" draggable="false"
               onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
          <span class="sg-logo-fb" aria-hidden="true"><b>P</b></span>
        </div>
        <h1 class="sg-title">${sgt("title", "Active ton compte")}</h1>
        <p class="sg-sub">
          ${ecoleName ? sgtR("sub_school", "Tu rejoins {school}").replace("{school}", `<strong>${esc(ecoleName)}</strong>`) : sgt("sub_default", "Bienvenue dans PermiGo")}
        </p>
        <div style="text-align:center"><span class="sg-role-badge">${esc(roleLabel)}</span></div>

        <div class="sg-row">
          <label class="sg-label">Langue · Language · <span lang="ar" dir="rtl">اللغة</span></label>
          <div class="sg-lang" id="sg-lang" role="group" aria-label="Choisir ta langue / Choose your language">
            <button type="button" class="sg-lang-b${chosenLang === "fr" ? " active" : ""}" data-lang="fr">Français</button>
            <button type="button" class="sg-lang-b${chosenLang === "en" ? " active" : ""}" data-lang="en">English</button>
            <button type="button" class="sg-lang-b${chosenLang === "ar" ? " active" : ""}" data-lang="ar" lang="ar">العربية</button>
          </div>
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-email">${sgt("label_email", "Email")}</label>
          <div class="sg-shell">
            <span class="sg-ico" aria-hidden="true">${icon("mail", { size: 19 })}</span>
            <input id="sg-email" type="email" value="${escAttr(invitation.email)}" readonly />
          </div>
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-prenom">${sgt("label_prenom", "Prénom")}</label>
          <div class="sg-shell">
            <span class="sg-ico" aria-hidden="true">${icon("user", { size: 19 })}</span>
            <input id="sg-prenom" type="text" autocomplete="given-name" placeholder="${sgt("ph_prenom", "Ton prénom")}" />
          </div>
        </div>

        ${eleveFields}

        <div class="sg-row">
          <label class="sg-label" for="sg-password">${sgt("label_password", "Mot de passe")}</label>
          <div class="sg-shell">
            <span class="sg-ico" aria-hidden="true">${icon("lock", { size: 19 })}</span>
            <!-- Visible par défaut (type=text) : sur iPhone, un champ
                 type=password + new-password remplace le clavier par la
                 suggestion « mot de passe fort » → impossible de taper le sien.
                 L'œil permet de le masquer. -->
            <input id="sg-password" type="text" autocomplete="new-password" minlength="8" placeholder="${sgt("ph_password", "8 caractères minimum")}" />
            <button class="sg-pwd-toggle" id="sg-pwd-toggle" type="button" aria-label="${sgt("pwd_hide_aria", "Masquer le mot de passe")}" aria-pressed="true">${icon("eye-off", { size: 18, strokeWidth: 2 })}</button>
          </div>
          <div class="sg-help" id="sg-pwd-help">${sgt("help_pwd_default", "Minimum 8 caractères.")}</div>
        </div>

        <button class="sg-btn" id="sg-submit" disabled>${sgt("submit", "Activer mon compte")}</button>
        <div class="sg-sep"></div>
        <div class="sg-login-row">${sgtR("have_account", "Déjà un compte&nbsp;? ")}<a href="/#/login">${sgt("login_link", "Se connecter")}</a></div>
      </div>
    </div>
  `;

    const prenomEl = root.querySelector("#sg-prenom");
    const nomEl = root.querySelector("#sg-nom");
    const usertagEl = root.querySelector("#sg-usertag");
    const usertagHelp = root.querySelector("#sg-usertag-help");
    const naissanceEl = root.querySelector("#sg-naissance");
    const parentBlock = root.querySelector("#sg-parent-block");
    const parentEmailEl = root.querySelector("#sg-parent-email");
    const pwdEl = root.querySelector("#sg-password");
    const pwdHelp = root.querySelector("#sg-pwd-help");
    const submitBtn = root.querySelector("#sg-submit");

    // Restaure la saisie déjà tapée après un re-rendu (changement de langue).
    if (preserve) {
      prenomEl.value = preserve.prenom || "";
      if (nomEl) nomEl.value = preserve.nom || "";
      if (usertagEl) usertagEl.value = preserve.usertag || "";
      if (naissanceEl) naissanceEl.value = preserve.naissance || "";
      if (parentEmailEl) parentEmailEl.value = preserve.parentEmail || "";
      pwdEl.value = preserve.pwd || "";
      usertagAvailable = preserve.usertagAvailable || false;
    }
    const collectValues = () => ({
      prenom: prenomEl.value,
      nom: nomEl?.value || "",
      usertag: usertagEl?.value || "",
      naissance: naissanceEl?.value || "",
      parentEmail: parentEmailEl?.value || "",
      pwd: pwdEl.value,
      usertagAvailable,
    });

    // Afficher / masquer le mot de passe
    const pwdToggle = root.querySelector("#sg-pwd-toggle");
    pwdToggle?.addEventListener("click", () => {
      const show = pwdEl.type === "password";
      pwdEl.type = show ? "text" : "password";
      pwdToggle.setAttribute("aria-pressed", String(show));
      pwdToggle.setAttribute(
        "aria-label",
        show
          ? sgtR("pwd_hide_aria", "Masquer le mot de passe")
          : sgtR("pwd_show_aria", "Afficher le mot de passe"),
      );
      pwdToggle.innerHTML = icon(show ? "eye-off" : "eye", {
        size: 18,
        strokeWidth: 2,
      });
      pwdEl.focus();
    });

    const updateMinor = () => {
      if (!parentBlock) return;
      parentBlock.style.display = isMinorDate(naissanceEl.value) ? "" : "none";
    };
    if (preserve && naissanceEl) updateMinor();

    const validate = () => {
      const pwdOk = pwdEl.value.length >= 8;
      const prenomOk = prenomEl.value.trim().length >= 2;
      let ok = pwdOk && prenomOk;
      if (isEleve) {
        const nomOk = nomEl.value.trim().length >= 1;
        const tagOk =
          usertagEl.value.trim().length >= 3 &&
          usertagAvailable &&
          !usertagChecking;
        const dateOk = !!naissanceEl.value;
        const minor = isMinorDate(naissanceEl.value);
        const parentOk =
          !minor ||
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
            (parentEmailEl?.value || "").trim(),
          );
        ok = ok && nomOk && tagOk && dateOk && parentOk;
      }
      submitBtn.disabled = !ok;
      if (pwdEl.value && !pwdOk) {
        pwdEl.closest(".sg-shell")?.classList.add("error");
        pwdHelp.classList.add("error");
        pwdHelp.textContent = sgtR(
          "help_pwd_short",
          "Trop court (minimum 8 caractères).",
        );
      } else {
        pwdEl.closest(".sg-shell")?.classList.remove("error");
        pwdHelp.classList.remove("error");
        pwdHelp.textContent = sgtR("help_pwd_default", "Minimum 8 caractères.");
      }
    };

    // Vérif live de la disponibilité du usertag (débounce 450ms)
    const checkUsertag = () => {
      const v = usertagEl.value.trim();
      usertagAvailable = false;
      if (v.length < 3) {
        usertagChecking = false;
        usertagHelp.className = "sg-help";
        usertagHelp.textContent = sgtR(
          "help_usertag_default",
          "3 caractères minimum.",
        );
        validate();
        return;
      }
      usertagChecking = true;
      usertagHelp.className = "sg-help";
      usertagHelp.textContent = sgtR("help_usertag_checking", "Vérification…");
      validate();
      clearTimeout(checkTimer);
      checkTimer = setTimeout(async () => {
        if (usertagEl.value.trim() !== v) return;
        try {
          const { data, error } = await sb.rpc("is_username_available", {
            p_username: v,
          });
          if (usertagEl.value.trim() !== v) return;
          usertagChecking = false;
          if (error) {
            usertagAvailable = false;
            usertagHelp.className = "sg-help";
            usertagHelp.textContent = sgtR(
              "help_usertag_check_failed",
              "Vérification impossible, réessaie.",
            );
          } else if (data === true) {
            usertagAvailable = true;
            usertagHelp.className = "sg-help ok";
            usertagHelp.textContent = sgtR("help_usertag_ok", "✓ Disponible");
          } else {
            usertagAvailable = false;
            usertagHelp.className = "sg-help error";
            usertagHelp.textContent = sgtR(
              "help_usertag_taken",
              "✗ Déjà pris, choisis-en un autre",
            );
          }
        } catch {
          usertagChecking = false;
          usertagAvailable = false;
        }
        validate();
      }, 450);
    };
    if (preserve?.usertag && preserve.usertag.trim().length >= 3)
      checkUsertag();

    prenomEl.addEventListener("input", validate);
    pwdEl.addEventListener("input", validate);
    if (isEleve) {
      nomEl.addEventListener("input", validate);
      naissanceEl.addEventListener("input", () => {
        updateMinor();
        validate();
      });
      parentEmailEl?.addEventListener("input", validate);
      usertagEl.addEventListener("input", checkUsertag);
    }
    validate();

    // Sélecteur de langue — re-rendu complet, saisie préservée.
    root.querySelector("#sg-lang")?.addEventListener("click", (e) => {
      const b = e.target.closest(".sg-lang-b");
      if (!b || b.dataset.lang === chosenLang) return;
      chosenLang = b.dataset.lang;
      applyLang(chosenLang);
      track("signup.language_picked", { language: chosenLang });
      renderForm(collectValues());
    });

    submitBtn.addEventListener("click", async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = sgtR("submitting", "Activation…");
      const { toast } = await import("@/components/common/toast.js");

      try {
        if (!accountCreated) {
          // 1. Sign up — le trigger handle_new_user_signup crée le profil "nu"
          clearLocalGameState(); // sinon un cache d'un ancien compte pollue le nouveau
          const { error: authErr } = await sb.auth.signUp({
            email: invitation.email,
            password: pwdEl.value,
            options: {
              data: { prenom: prenomEl.value.trim(), role: invitation.role },
            },
          });
          if (authErr) throw authErr;

          // 2. accept_invitation rattache le profil (role, auto_ecole_id, enseignant_id)
          const { data: accepted, error: acceptErr } = await sb.rpc(
            "accept_invitation",
            { p_token: token },
          );
          if (acceptErr) throw acceptErr;
          if (accepted === false)
            throw new Error("Lien invalide ou email ne correspond pas");
          accountCreated = true;
        }

        // 3. Élève : pose usertag / nom / date de naissance (+ email parent si mineur)
        let consentToken = null;
        if (isEleve) {
          const { data: profData, error: profErr } = await sb.rpc(
            "set_eleve_signup_profile",
            {
              p_username: usertagEl.value.trim(),
              p_nom: nomEl.value.trim(),
              p_prenom: prenomEl.value.trim(),
              p_date_naissance: naissanceEl.value,
              p_parent_email: parentEmailEl?.value.trim() || null,
            },
          );
          if (profErr) {
            if (/username_taken/i.test(profErr.message || "")) {
              usertagAvailable = false;
              usertagHelp.className = "sg-help error";
              usertagHelp.textContent = sgtR(
                "help_usertag_taken",
                "✗ Ce usertag vient d'être pris, choisis-en un autre",
              );
              toast(
                sgtR(
                  "toast_username_taken",
                  "Ce usertag est déjà pris, change-le puis réessaie",
                ),
                "error",
                4000,
              );
              submitBtn.textContent = sgtR("submit", "Activer mon compte");
              validate();
              return;
            }
            if (/parent_email_required/i.test(profErr.message || "")) {
              toast(
                sgtR(
                  "toast_parent_email",
                  "Renseigne un email de parent valide",
                ),
                "error",
                4000,
              );
              submitBtn.disabled = false;
              submitBtn.textContent = sgtR("submit", "Activer mon compte");
              updateMinor();
              validate();
              return;
            }
            throw profErr;
          }
          const cr = Array.isArray(profData) ? profData[0] : profData;
          if (cr?.consent_required && cr?.consent_token)
            consentToken = cr.consent_token;
        }

        track("signup.completed", {
          role: invitation.role,
          from: "invitation",
          minor: !!consentToken,
        });

        // 3bis. Élève mineur : compte en attente du consentement parental
        if (consentToken) {
          renderConsentPending(root, consentToken);
          return;
        }

        // 4. Succès → redirection. Le tuto "Ajouter à l'écran d'accueil" est
        //    dans l'onboarding pour l'élève ; pour moniteur/gérant (pas d'onboarding)
        //    on l'affiche ici.
        const goToApp = () => {
          window.location.href = "/#";
          window.location.reload();
        };
        if (isEleve) {
          goToApp();
        } else {
          const { renderAddToHome } =
            await import("@/components/common/add-to-home.js");
          renderAddToHome(root, { onDone: goToApp });
        }
      } catch (e) {
        console.error("[signup] failed", e);
        const msg = /already.*registered|already.*exists/i.test(
          e?.message || "",
        )
          ? sgtR(
              "toast_already_registered",
              "Un compte existe déjà avec cet email. Connecte-toi directement.",
            )
          : e?.message || sgtR("toast_generic", "Erreur lors de l'activation");
        toast(msg, "error", 4500);
        submitBtn.disabled = false;
        submitBtn.textContent = sgtR("submit", "Activer mon compte");
      }
    });

    // Focus auto sur le prénom, seulement au 1er rendu.
    if (!preserve) setTimeout(() => prenomEl.focus(), 100);
  }

  renderForm();
}

// Moins de 15 ans (âge du consentement numérique en France)
function isMinorDate(str) {
  if (!str) return false;
  const b = new Date(str);
  if (isNaN(b.getTime())) return false;
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age < 15;
}

// Écran post-signup pour un élève mineur : lien de consentement à transmettre au parent
function renderConsentPending(root, token) {
  track("signup.consent_pending");
  const link = `${location.origin}/#/parental-consent?token=${encodeURIComponent(token)}`;
  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-card" style="text-align:center">
        <div style="margin-bottom:10px;color:var(--gold);display:flex;justify-content:center">${icon("users", { size: 42 })}</div>
        <h1 class="sg-title">${sgt("consent_title", "Presque&nbsp;! On attend l'accord de ton parent")}</h1>
        <p class="sg-sub">${sgt("consent_sub", "Comme tu as moins de 15 ans, un parent ou tuteur doit donner son accord avant que tu puisses utiliser PermiGo. Envoie-lui ce lien&nbsp;:")}</p>
        <div class="sg-row">
          <div class="sg-shell">
            <input id="sg-consent-link" type="text" readonly value="${escAttr(link)}" />
          </div>
        </div>
        <button class="sg-btn" id="sg-copy-link" type="button">${icon("copy", { size: 16 })} ${sgt("consent_copy", "Copier le lien")}</button>
        <p class="sg-sub" style="margin-top:16px;margin-bottom:0">${sgt("consent_paste", "Tu peux le coller dans WhatsApp ou un SMS à ton parent. Dès qu'il valide, ton compte se débloque.")}</p>
        <a class="sg-link" href="/#" style="margin-top:18px">${sgt("consent_done", "J'ai compris")}</a>
      </div>
    </div>`;
  const linkEl = root.querySelector("#sg-consent-link");
  root.querySelector("#sg-copy-link")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link);
      const btn = root.querySelector("#sg-copy-link");
      btn.textContent = sgtR("consent_copied", "✓ Lien copié");
      setTimeout(() => {
        btn.innerHTML = `${icon("copy", { size: 16 })} ${sgt("consent_copy", "Copier le lien")}`;
      }, 2000);
    } catch {
      linkEl?.select();
      const { toast } = await import("@/components/common/toast.js");
      toast("Sélectionne et copie le lien manuellement", "info", 3500);
    }
  });
}

function renderError(root, title, message) {
  track("signup.error", { title });
  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-error-card">
        <div class="sg-error-ico">${icon("alert-triangle", { size: 30 })}</div>
        <h1 class="sg-error-title">${esc(title)}</h1>
        <p class="sg-error-msg">${esc(message)}</p>
        <a class="sg-link" href="/#">${sgt("err_back", "Retour à l'accueil")}</a>
      </div>
    </div>`;
}
