// ═══════════════════════════════════════════════════════════════
// Page publique — Inscription élève SELF-SERVE via CODE moniteur
// URL : #/rejoindre  (ou #/rejoindre?code=PERMIS75 pour pré-remplir)
//
// Chemin BIS au lien d'invitation : l'élève crée son compte avec SON propre
// email et tape le code de son moniteur (ex : "PERMIS75"). Le moniteur ne
// manipule jamais l'email de l'élève (cf. règle non-négociable #1).
//
// Flow :
//   1. Code (pré-rempli depuis l'URL) → get_join_code_info aperçoit l'école.
//   2. DEUX CHAMPS et c'est tout : email perso + mot de passe. Le pseudo est
//      AUTO-GÉNÉRÉ depuis l'email (genUsername).
//   3. Submit : sb.auth.signUp() → join_moniteur_by_code(code)
//      → set_eleve_signup_minimal(pseudo).
//   4. Redirige vers l'accueil élève.
//
// ⚠️ Ce qu'on ne demande PLUS ici, et où ça se demande maintenant :
//   · date de naissance → carte dans l'accueil (birthdate-card.js). Obligation
//     légale (accord d'un parent sous 15 ans), mais elle ne vaut pas de faire
//     fuir quelqu'un avant qu'il ait vu le produit.
//   · prénom → à la première visite d'un classement (identity-prompt.js).
//     En attendant, le déclencheur pose la partie de l'email avant le @.
//
// ⚠️ Dépend de la migration 20260621120000_join_code.sql (RPC à appliquer).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { icon } from "@/utils/icons.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { clearLocalGameState } from "@/utils/game-state.js";
import { getLang, applyLang } from "@/utils/lang.js";
import { fbTrack } from "@/services/meta-pixel.js";

const STYLE = `<style>
  /* DA « Arène 3D » (nuit-violet + plastique 3D) — cohérence avec le login */
  .sg {
    position: relative;
    min-height: 100dvh;
    padding: 32px 18px max(60px, calc(24px + env(safe-area-inset-bottom)));
    font-family: 'Archivo', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
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
    position: relative; box-sizing: border-box;
    width: 100%; max-width: 430px;
    background: linear-gradient(180deg, #322764 0%, var(--ncard) 60%, #261d56 100%);
    border-radius: 26px; padding: 30px 26px 26px;
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
  @keyframes sgIn { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  /* Emblème vert PermiGo (image) — halo pulsant comme le login */
  .sg-logo {
    display: block; position: relative; z-index: 1;
    width: 88px; height: 88px; margin: 0 auto 16px;
    object-fit: contain;
    filter: drop-shadow(0 5px 8px rgba(0,0,0,.5)) drop-shadow(0 0 16px rgba(88,204,2,.6));
  }
  .sg-title { font: 800 24px/1.15 'Archivo', var(--fb), sans-serif; color: var(--sg-ink); text-align: center; margin: 6px 0 4px; text-shadow: 0 2px 0 rgba(0,0,0,.35); }
  .sg-sub { font: 600 14.5px/1.5 'Archivo', var(--fb), sans-serif; color: var(--ink-soft); text-align: center; margin: 0 0 22px; }
  /* Badge rôle = pastille dorée plastique */
  .sg-role-badge {
    display: inline-block; margin: 0 0 18px; padding: 6px 14px;
    background: linear-gradient(180deg, var(--gold), var(--gold-dp)); color: #3a2600;
    border-radius: 99px; font: 800 11px/1 'Archivo', var(--fb), sans-serif; text-transform: uppercase; letter-spacing: .08em;
    box-shadow: inset 0 1px 1px rgba(255,255,255,.6), 0 3px 8px rgba(0,0,0,.35);
  }
  .sg-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .sg-label { font: 700 13px/1 'Archivo', var(--fb), sans-serif; color: var(--ink-soft); letter-spacing: .04em; text-transform: uppercase; margin-left: 4px; }
  .sg-input {
    padding: 0 16px; height: 52px; border: 0; border-radius: 15px;
    font: 600 16px/1.3 'Archivo', var(--fb), sans-serif; color: var(--sg-ink); background: var(--field);
    box-shadow: inset 0 2px 5px rgba(0,0,0,.5), inset 0 0 0 1.5px var(--field-line);
    transition: box-shadow .15s ease; font-family: inherit;
  }
  .sg-input::placeholder { color: #9b93cf; font-weight: 500; }
  .sg-input:focus { outline: 0; box-shadow: inset 0 2px 5px rgba(0,0,0,.4), inset 0 0 0 2px var(--focus), 0 0 0 4px rgba(255,216,77,.35); }
  .sg-input.error { box-shadow: inset 0 2px 5px rgba(0,0,0,.5), inset 0 0 0 2px #ff8d8d; }
  .sg-input[readonly] { color: var(--ink-mu); cursor: default; opacity: .85; }
  .sg-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.85); cursor: pointer; }
  .sg-help { font: 600 11.5px/1.4 'Archivo', var(--fb), sans-serif; color: var(--ink-mu); margin-top: 2px; margin-left: 4px; }
  .sg-help.error { color: #ffb3b3; }
  .sg-help.ok { color: #8fe85a; }
  .sg-italic { font: italic 500 12px/1.45 'Archivo', var(--fb), sans-serif; color: var(--ink-mu); margin-top: 4px; margin-left: 4px; }

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

  /* Champ code — gros, majuscules, espacé, monospace doré */
  .sg-code-input {
    text-align: center; letter-spacing: .22em; text-transform: uppercase;
    font: 800 21px/1.2 'IBM Plex Mono', var(--fn, monospace) !important;
    color: var(--gold) !important;
    box-shadow: inset 0 2px 5px rgba(0,0,0,.55), inset 0 0 0 1.5px rgba(255,206,77,.4) !important;
  }
  .sg-code-input::placeholder { color: rgba(255,206,77,.4); letter-spacing: .22em; }
  .sg-code-input:focus { box-shadow: inset 0 2px 5px rgba(0,0,0,.45), inset 0 0 0 2px var(--focus), 0 0 0 4px rgba(255,216,77,.35) !important; }
  /* Bandeau aperçu "tu rejoins …" */
  .sg-join {
    display: none; align-items: center; gap: 10px;
    margin: 0 0 20px; padding: 12px 14px; border-radius: 14px;
    background: rgba(88,204,2,.14);
    box-shadow: inset 0 0 0 1.5px rgba(88,204,2,.4);
    animation: sgIn .3s cubic-bezier(.34,1.56,.64,1);
  }
  .sg-join.show { display: flex; }
  .sg-join.err { background: rgba(255,141,141,.12); box-shadow: inset 0 0 0 1.5px rgba(255,141,141,.4); }
  .sg-join-ico { flex-shrink: 0; color: #8fe85a; display: flex; }
  .sg-join.err .sg-join-ico { color: #ffb3b3; }
  .sg-join-txt { font: 700 13px/1.4 'Archivo', var(--fb), sans-serif; color: var(--sg-ink); }
  .sg-join-txt strong { color: var(--gold); }
  .sg-join.err .sg-join-txt { color: #ffb3b3; }

  /* CTA plastique 3D indigo (comme .lg-cta) */
  .sg-btn {
    width: 100%; margin-top: 18px; height: 58px; padding: 0; color: #fff; border: 0; border-radius: 17px;
    font: 800 18px/1 'Archivo', var(--fb), sans-serif; letter-spacing: .2px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    background: linear-gradient(180deg, var(--in-lt) 0%, var(--in) 55%, var(--in-dp) 100%);
    box-shadow:
      inset 0 2px 0 rgba(255,255,255,.55), inset 0 -4px 8px rgba(0,0,0,.28),
      0 7px 0 var(--in-dk), 0 12px 20px rgba(74,63,201,.5);
    text-shadow: 0 2px 1px rgba(0,0,0,.3); transform: translateY(0);
    transition: transform .08s cubic-bezier(.34,1.56,.64,1), box-shadow .08s ease, filter .15s; font-family: inherit;
  }
  .sg-btn:hover:not(:disabled) { filter: brightness(1.04); }
  .sg-btn:active:not(:disabled) {
    transform: translateY(5px);
    box-shadow: inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 6px rgba(0,0,0,.3),
      0 2px 0 var(--in-dk), 0 5px 10px rgba(74,63,201,.45);
  }
  .sg-btn:disabled { opacity: .55; cursor: default; filter: grayscale(.1); }

  .sg-pwd-wrap { position: relative; }
  .sg-pwd-wrap .sg-input { width: 100%; box-sizing: border-box; padding-right: 50px; }
  .sg-pwd-toggle {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    width: 44px; height: 44px; border: 0; background: none; cursor: pointer;
    color: #b7afe8; display: flex; align-items: center; justify-content: center;
    border-radius: 10px; -webkit-tap-highlight-color: transparent;
  }
  .sg-pwd-toggle:hover { color: var(--sg-ink); }
  .sg-pwd-toggle:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }
  .sg-sep { height: 2px; border-radius: 2px; margin: 22px 0 0;
    background: linear-gradient(90deg, transparent, rgba(124,111,224,.4), transparent); }
  .sg-login-row { text-align: center; margin-top: 16px; font: 600 13.5px/1.4 'Archivo', var(--fb), sans-serif; color: var(--ink-soft); }
  .sg-login-row a { color: var(--gold); font-weight: 800; text-decoration: underline; text-underline-offset: 2px; }
  .sg-login-row a:hover { color: #ffe39a; }
  .sg-login-row a:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 6px; }

  /* Lien-bouton secondaire (J'ai compris, post-consentement) */
  .sg-link {
    color: var(--sg-ink); font: 800 14px/1 'Archivo', var(--fb), sans-serif; text-decoration: none;
    padding: 13px 24px; border: 0; border-radius: 14px;
    background: linear-gradient(180deg, #3a2f72 0%, #2c2360 100%);
    box-shadow: inset 0 2px 0 rgba(255,255,255,.16), 0 4px 0 #1b143f, 0 7px 12px rgba(0,0,0,.35);
    transition: transform .08s ease, filter .15s;
  }
  .sg-link:hover { filter: brightness(1.08); }
  .sg-link:active { transform: translateY(3px); }
  .sg-link:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }

  /* A11y : mouvement réduit / contrastes forcés */
  @media (prefers-reduced-motion: reduce) {
    .sg-card { animation: none; }
  }
  @media (forced-colors: active) {
    .sg-card { border: 1px solid CanvasText; }
    .sg-input { border: 1px solid CanvasText; box-shadow: none; }
    .sg-btn, .sg-link { border: 2px solid ButtonText; box-shadow: none; }
    .sg :focus-visible { outline: 2px solid Highlight !important; }
    .sg-logo { filter: none; }
  }
</style>`;

// ─── i18n (coque du formulaire) — traduction seule, repli FR. « moniteur » =
// instructor / مدرّب, marque = PermiGo (بيرميغو en prose arabe). Le sélecteur
// de langue pilote un re-rendu COMPLET (renderForm) : tout bascule aussitôt. ───
const SG_I18N = {
  en: {
    title_solo: "Your free account",
    title_join: "Join your instructor",
    sub_solo:
      "3 lessons yours for good · 3 questions and 1 scene every day. No card needed. If you bought a Pass, use the same email as your payment.",
    sub_join:
      "Enter the code your instructor gave you, then create your account.",
    role_badge: "Student",
    already_connected: "You're already signed in as {name}.",
    already_switch: "Sign out to create an account",
    lang_help: "Questions show in your language. French stays below.",
    code_label: "Instructor code",
    code_help_default: "Ask your instructor for it.",
    code_checking: "Checking…",
    code_notfound_help: "✗ Code not found. Double-check with your instructor.",
    code_notfound_join: "No instructor matches this code.",
    code_valid: "✓ Valid code",
    code_check_failed: "Check failed. Try again.",
    join_school: "You're joining {school}{with}.",
    join_with: " with {name}",
    email_label: "Your email",
    pwd_label: "Password",
    pwd_ph: "8 characters minimum",
    pwd_hide_aria: "Hide password",
    pwd_show_aria: "Show password",
    pwd_help: "Minimum 8 characters.",
    pwd_too_short: "Too short (minimum 8 characters).",
    submit: "Create my account",
    submitting: "Creating…",
    have_account: "Already have an account? ",
    login_link: "Log in",
    toast_code_invalid: "Invalid instructor code. Check it again.",
    code_notfound_short: "✗ Code not found.",
    toast_already_school:
      "This account is already linked to an instructor. Please log in.",
    toast_exists: "An account already exists with this email. Log in directly.",
    toast_generic: "Error while creating the account",
  },
  ar: {
    title_solo: "حسابك المجاني",
    title_join: "انضمّ إلى مدرّبك",
    sub_solo:
      "3 دروس لك إلى الأبد · 3 أسئلة وسيناريو واحد كل يوم. بدون بطاقة بنكية. إن اشتريت باقة، استعمل البريد نفسه الذي دفعت به.",
    sub_join: "أدخِل رمز مدرّبك ثم أنشئ حسابك.",
    role_badge: "طالب",
    already_connected: "أنت مسجّل الدخول بالفعل باسم {name}.",
    already_switch: "سجّل الخروج لإنشاء حساب",
    lang_help: "تظهر الأسئلة بلغتك. وتبقى الفرنسية تحتها.",
    code_label: "رمز المدرّب",
    code_help_default: "اطلبه من مدرّبك.",
    code_checking: "جارٍ التحقّق…",
    code_notfound_help: "✗ الرمز غير موجود. تحقّق مجدّداً مع مدرّبك.",
    code_notfound_join: "لا يوجد مدرّب يطابق هذا الرمز.",
    code_valid: "✓ رمز صالح",
    code_check_failed: "تعذّر التحقّق. أعد المحاولة.",
    join_school: "أنت تنضمّ إلى {school}{with}.",
    join_with: " مع {name}",
    email_label: "بريدك الإلكتروني",
    pwd_label: "كلمة المرور",
    pwd_ph: "8 أحرف على الأقل",
    pwd_hide_aria: "إخفاء كلمة المرور",
    pwd_show_aria: "إظهار كلمة المرور",
    pwd_help: "8 أحرف على الأقل.",
    pwd_too_short: "قصيرة جداً (8 أحرف على الأقل).",
    submit: "إنشاء حسابي",
    submitting: "جارٍ الإنشاء…",
    have_account: "لديك حساب بالفعل؟ ",
    login_link: "تسجيل الدخول",
    toast_code_invalid: "رمز المدرّب غير صالح. تحقّق منه مجدّداً.",
    code_notfound_short: "✗ الرمز غير موجود.",
    toast_already_school: "هذا الحساب مرتبط بمدرّب بالفعل. سجّل الدخول.",
    toast_exists: "يوجد حساب بالفعل بهذا البريد. سجّل الدخول مباشرة.",
    toast_generic: "خطأ أثناء إنشاء الحساب",
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
  // Pré-remplissage éventuel du code : #/rejoindre?code=PERMIS75
  // Mode SOLO (#/rejoindre?solo=1) : élève sans moniteur (acheteurs du Pass
  // Permis) — le code devient inutile, on le cache et on saute le rattachement.
  const hash = location.hash;
  const qIdx = hash.indexOf("?");
  const params = new URLSearchParams(qIdx >= 0 ? hash.slice(qIdx + 1) : "");
  const prefillCode = (params.get("code") || "").trim();
  const solo = params.get("solo") === "1";
  // Posé par #/pass juste avant la redirection vers ici (audit landing
  // 03/08/2026) : un invité qui vient de payer le Pass devait retaper de
  // mémoire l'email exact de son paiement pour débloquer son accès. Lu UNE
  // fois puis retiré : une session Stripe ne doit pas se ré-appliquer à une
  // inscription qui n'a rien à voir (nouvel onglet, nouveau visiteur…).
  const prefillEmail = sessionStorage.getItem("pg_pass_email") || "";
  if (prefillEmail) sessionStorage.removeItem("pg_pass_email");

  track("signup.viewed", { from: solo ? "pass_solo" : "join_code" });

  // Session déjà active (compte test resté connecté, tél partagé…) : on
  // prévient au lieu de laisser croire que le circuit est cassé — créer un
  // compte par-dessus une session existante sème la confusion.
  const connected = getCurUser();

  // État persistant à travers les re-rendus déclenchés par le changement de
  // langue (le compte n'est créé qu'une fois ; la langue choisie tient).
  let chosenLang = getLang();
  let accountCreated = false; // permet de retenter sans recréer le compte

  // Construit (ou RECONSTRUIT) tout le formulaire dans la langue courante et
  // rebranche les handlers. Appelé à l'init puis à chaque changement de langue
  // (re-rendu complet : innerHTML remplace nœuds/listeners → pas de fuite). La
  // saisie déjà tapée est préservée via `preserve` (recette page Réglages).
  function renderForm(preserve) {
    const connectedBanner = connected
      ? `<div class="sg-join show" id="sg-connected" style="margin-bottom:18px">
        <span class="sg-join-ico">${icon("alert-circle", { size: 20, strokeWidth: 2 })}</span>
        <span class="sg-join-txt">${sgtR("already_connected", "Tu es déjà connecté en tant que {name}.").replace("{name}", `<strong>${esc(connected.prenom || connected.username || connected.email || "quelqu'un")}</strong>`)}
          <a href="#" id="sg-switch" style="color:var(--gold);font-weight:800">${sgt("already_switch", "Se déconnecter pour créer un compte")}</a></span>
      </div>`
      : "";

    root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-card">
        <img class="sg-logo" src="/skins/avatars/permigo-badge-icon.png" alt="PermiGo" width="88" height="88" />
        <h1 class="sg-title">${solo ? sgt("title_solo", "Ton compte gratuit") : sgt("title_join", "Rejoins ton moniteur")}</h1>
        <p class="sg-sub">${solo ? sgt("sub_solo", "3 leçons à toi pour toujours · 3 questions et 1 scène chaque jour. Sans carte bancaire. Si tu as pris un Pass, utilise le même email que ton paiement.") : sgt("sub_join", "Entre le code de ton moniteur puis crée ton compte.")}</p>
        <div style="text-align:center"><span class="sg-role-badge">${sgt("role_badge", "Élève")}</span></div>
        ${connectedBanner}

        <style>
          .sg-lang{display:flex;gap:6px;margin-top:2px}
          .sg-lang-b{flex:1;padding:11px 4px;border-radius:12px;border:1.5px solid var(--bo);background:var(--su);color:var(--mu);font:700 14px/1.1 inherit;cursor:pointer;transition:border-color .15s,color .15s,box-shadow .15s}
          .sg-lang-b.active{border-color:var(--a);color:var(--a);box-shadow:inset 0 0 0 1px var(--a)}
        </style>
        <div class="sg-row">
          <label class="sg-label">Langue · Language · <span lang="ar" dir="rtl">اللغة</span></label>
          <div class="sg-lang" id="sg-lang" role="group" aria-label="Choisir ta langue / Choose your language">
            <button type="button" class="sg-lang-b${chosenLang === "fr" ? " active" : ""}" data-lang="fr">Français</button>
            <button type="button" class="sg-lang-b${chosenLang === "en" ? " active" : ""}" data-lang="en">English</button>
            <button type="button" class="sg-lang-b${chosenLang === "ar" ? " active" : ""}" data-lang="ar" lang="ar">العربية</button>
          </div>
          <div class="sg-help">${sgt("lang_help", "Les questions du quiz s'affichent dans ta langue, le français gardé dessous.")}</div>
        </div>

        <div class="sg-row" ${solo ? 'style="display:none"' : ""}>
          <label class="sg-label" for="sg-code">${sgt("code_label", "Code moniteur")}</label>
          <input class="sg-input sg-code-input" id="sg-code" type="text" autocomplete="off"
            autocorrect="off" autocapitalize="characters" spellcheck="false"
            maxlength="16" placeholder="PERMIS75" value="${escAttr(prefillCode)}" />
          <div class="sg-help" id="sg-code-help">${sgt("code_help_default", "Demande-le à ton moniteur.")}</div>
        </div>

        <div class="sg-join" id="sg-join">
          <span class="sg-join-ico" id="sg-join-ico">${icon("check-circle", { size: 20, strokeWidth: 2 })}</span>
          <span class="sg-join-txt" id="sg-join-txt"></span>
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-email">${sgt("email_label", "Ton email")}</label>
          <input class="sg-input" id="sg-email" type="email" autocomplete="email" autocapitalize="off" placeholder="toi@exemple.fr" />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-password">${sgt("pwd_label", "Mot de passe")}</label>
          <div class="sg-pwd-wrap">
            <!-- Visible par défaut (type=text) : sur iPhone, un champ
                 type=password + new-password remplace le clavier par la
                 suggestion « mot de passe fort » → impossible de taper le sien.
                 L'œil permet de le masquer. -->
            <input class="sg-input" id="sg-password" type="text" autocomplete="new-password" minlength="8" placeholder="${sgt("pwd_ph", "8 caractères minimum")}" />
            <button class="sg-pwd-toggle" id="sg-pwd-toggle" type="button" aria-label="${sgt("pwd_hide_aria", "Masquer le mot de passe")}" aria-pressed="true">${icon("eye-off", { size: 18, strokeWidth: 2 })}</button>
          </div>
          <div class="sg-help" id="sg-pwd-help">${sgt("pwd_help", "Minimum 8 caractères.")}</div>
        </div>

        <button class="sg-btn" id="sg-submit" disabled>${sgt("submit", "Créer mon compte")}</button>
        <div class="sg-sep"></div>
        <div class="sg-login-row">${sgtR("have_account", "Déjà un compte&nbsp;? ")}<a href="/#/login">${sgt("login_link", "Se connecter")}</a></div>
      </div>
    </div>
  `;

    const codeEl = root.querySelector("#sg-code");
    const codeHelp = root.querySelector("#sg-code-help");
    const joinBox = root.querySelector("#sg-join");
    const joinIco = root.querySelector("#sg-join-ico");
    const joinTxt = root.querySelector("#sg-join-txt");
    const emailEl = root.querySelector("#sg-email");
    const pwdEl = root.querySelector("#sg-password");
    const pwdHelp = root.querySelector("#sg-pwd-help");
    const submitBtn = root.querySelector("#sg-submit");

    // Restaure la saisie déjà tapée après un re-rendu (changement de langue).
    // Sans `preserve` (tout premier rendu), l'email du paiement Stripe
    // (prefillEmail) prend sa place s'il y en a un.
    if (preserve) {
      if (codeEl && preserve.code) codeEl.value = preserve.code;
      emailEl.value = preserve.email || "";
      pwdEl.value = preserve.pwd || "";
    } else if (prefillEmail) {
      emailEl.value = prefillEmail;
    }
    const collectValues = () => ({
      code: codeEl?.value || "",
      email: emailEl.value,
      pwd: pwdEl.value,
    });

    // Déconnexion express depuis le bandeau « déjà connecté » : on reste sur
    // la page (reload avec le même hash) pour reprendre l'inscription à zéro.
    root.querySelector("#sg-switch")?.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await sb.auth.signOut();
      } catch {
        /* session déjà morte : on recharge quand même */
      }
      window.location.reload();
    });

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

    const emailValid = (v) =>
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim());
    const normCode = (v) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Pseudo auto-généré : le formulaire ne demande plus que l'email et le mot
    // de passe, donc la base vient de l'email (avant le @), sans accents, + 4
    // chiffres. L'élève le change quand il veut dans l'app, et son prénom lui
    // est demandé le jour où il entre dans un classement.
    // ⚠️ 12 caractères MAXIMUM avant les 4 chiffres : la colonne username porte
    // une contrainte ^[A-Za-z0-9_]{3,16}$. Une adresse un peu longue faisait
    // échouer l'inscription entière sur un 400 illisible (vu le 01/08).
    const genUsername = (email) => {
      const base =
        String(email || "")
          .split("@")[0]
          .toLowerCase()
          .normalize("NFD")
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 12) || "eleve";
      const safe = base.length >= 2 ? base : "eleve";
      return safe + String(Math.floor(1000 + Math.random() * 9000));
    };

    let codeValid = false; // résolu par get_join_code_info
    let codeChecking = false;
    let codeTimer = null;

    const validate = () => {
      const codeOk = solo || (codeValid && !codeChecking);
      const emailOk = emailValid(emailEl.value);
      const pwdOk = pwdEl.value.length >= 8;
      submitBtn.disabled = !(codeOk && emailOk && pwdOk);

      if (pwdEl.value && !pwdOk) {
        pwdEl.classList.add("error");
        pwdHelp.classList.add("error");
        pwdHelp.textContent = sgtR(
          "pwd_too_short",
          "Trop court (minimum 8 caractères).",
        );
      } else {
        pwdEl.classList.remove("error");
        pwdHelp.classList.remove("error");
        pwdHelp.textContent = sgtR("pwd_help", "Minimum 8 caractères.");
      }
    };

    // Aperçu du code (debounce 400ms) — get_join_code_info
    const checkCode = () => {
      const v = normCode(codeEl.value);
      codeValid = false;
      joinBox.classList.remove("show", "err");
      if (v.length < 3) {
        codeChecking = false;
        codeHelp.className = "sg-help";
        codeHelp.textContent = sgtR(
          "code_help_default",
          "Demande-le à ton moniteur.",
        );
        validate();
        return;
      }
      codeChecking = true;
      codeHelp.className = "sg-help";
      codeHelp.textContent = sgtR("code_checking", "Vérification…");
      validate();
      clearTimeout(codeTimer);
      codeTimer = setTimeout(async () => {
        if (normCode(codeEl.value) !== v) return;
        try {
          const { data, error } = await sb.rpc("get_join_code_info", {
            p_code: v,
          });
          if (normCode(codeEl.value) !== v) return;
          codeChecking = false;
          const info = Array.isArray(data) ? data[0] : data;
          if (error || !info) {
            codeValid = false;
            codeHelp.className = "sg-help error";
            codeHelp.textContent = sgtR(
              "code_notfound_help",
              "✗ Code introuvable. Revérifie auprès de ton moniteur.",
            );
            joinBox.classList.add("show", "err");
            joinIco.innerHTML = icon("alert-circle", {
              size: 20,
              strokeWidth: 2,
            });
            joinTxt.textContent = sgtR(
              "code_notfound_join",
              "Aucun moniteur ne correspond à ce code.",
            );
          } else {
            codeValid = true;
            codeHelp.className = "sg-help ok";
            codeHelp.textContent = sgtR("code_valid", "✓ Code valide");
            joinBox.classList.add("show");
            joinBox.classList.remove("err");
            joinIco.innerHTML = icon("check-circle", {
              size: 20,
              strokeWidth: 2,
            });
            const ecole = info.ecole_nom || "ton auto-école";
            // Si le nom de l'école contient déjà le prénom du moniteur
            // (« Auto École de Rayan »), on ne rajoute pas « avec Rayan » :
            // la répétition faisait phrase de robot.
            const dejaDansEcole =
              info.moniteur_prenom &&
              ecole.toLowerCase().includes(info.moniteur_prenom.toLowerCase());
            const withPart =
              info.moniteur_prenom && !dejaDansEcole
                ? sgtR("join_with", " avec {name}").replace(
                    "{name}",
                    esc(info.moniteur_prenom),
                  )
                : "";
            joinTxt.innerHTML = sgtR(
              "join_school",
              "Tu rejoins {school}{with}.",
            )
              .replace("{school}", `<strong>${esc(ecole)}</strong>`)
              .replace("{with}", withPart);
          }
        } catch {
          codeChecking = false;
          codeValid = false;
          codeHelp.className = "sg-help error";
          codeHelp.textContent = sgtR(
            "code_check_failed",
            "Vérification impossible, réessaie.",
          );
        }
        validate();
      }, 400);
    };

    codeEl.addEventListener("input", checkCode);
    emailEl.addEventListener("input", validate);
    pwdEl.addEventListener("input", validate);

    // Code pré-rempli (URL) ou restauré après changement de langue → vérifier.
    if (codeEl && normCode(codeEl.value)) checkCode();
    else validate();

    // Sélecteur de langue — pilote un RE-RENDU COMPLET du formulaire : tout le
    // texte bascule aussitôt (recette de la page Réglages). applyLang pose le
    // miroir localStorage + émet permigo:lang-changed (nav, etc.). La saisie déjà
    // tapée est préservée. La préférence est persistée en base au submit.
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
      submitBtn.textContent = sgtR("submitting", "Création…");
      const { toast } = await import("@/components/common/toast.js");
      const email = emailEl.value.trim().toLowerCase();
      const code = normCode(codeEl.value);

      try {
        if (!accountCreated) {
          // 1. Sign up — le trigger handle_new_user_signup crée un profil "nu" élève
          // Aucun prénom transmis : le déclencheur handle_new_user_signup pose
          // la partie de l'email avant le @ comme prénom provisoire. L'élève
          // donnera le vrai le jour où il entre dans un classement.
          clearLocalGameState(); // sinon un cache d'un ancien compte pollue le nouveau
          const { error: authErr } = await sb.auth.signUp({
            email,
            password: pwdEl.value,
            options: { data: { role: "eleve" } },
          });
          if (authErr) throw authErr;

          // 2. Rattache au moniteur via son code (sauf inscription solo)
          const { error: joinErr } = solo
            ? { error: null }
            : await sb.rpc("join_moniteur_by_code", { p_code: code });
          if (joinErr) {
            if (/invalid_code/i.test(joinErr.message || "")) {
              toast(
                sgtR(
                  "toast_code_invalid",
                  "Code moniteur invalide. Revérifie-le.",
                ),
                "error",
                4000,
              );
              codeValid = false;
              codeHelp.className = "sg-help error";
              codeHelp.textContent = sgtR(
                "code_notfound_short",
                "✗ Code introuvable.",
              );
              submitBtn.textContent = sgtR("submit", "Créer mon compte");
              validate();
              return;
            }
            if (/already_has_school/i.test(joinErr.message || "")) {
              toast(
                sgtR(
                  "toast_already_school",
                  "Ce compte est déjà rattaché à un moniteur. Connecte-toi.",
                ),
                "error",
                4500,
              );
              submitBtn.textContent = sgtR("submit", "Créer mon compte");
              return;
            }
            throw joinErr;
          }
          accountCreated = true;
        }

        // 3. Pose le pseudo. C'est la SEULE chose écrite sur le profil ici :
        //    la date de naissance est demandée dans l'accueil, le prénom au
        //    premier classement. On retente avec un autre pseudo en cas de
        //    collision (quasi impossible, mais défensif).
        let profErr = null;
        for (let attempt = 0; attempt < 6; attempt++) {
          const res = await sb.rpc("set_eleve_signup_minimal", {
            p_username: genUsername(email),
          });
          profErr = res.error;
          if (!profErr || !/username_taken/i.test(profErr.message || "")) break;
        }
        if (profErr) throw profErr;

        track("signup.completed", {
          role: "eleve",
          from: solo ? "pass_solo" : "join_code",
        });
        // Compte créé = LA conversion mesurable de la campagne pub. Avec 200 €
        // on n'aura jamais assez d'achats pour qu'un algorithme apprenne ; les
        // inscriptions, si.
        fbTrack("CompleteRegistration", {
          content_name: solo ? "compte_gratuit" : "code_moniteur",
          status: true,
        });

        // Persiste la langue choisie sur le profil (le miroir localStorage est
        // déjà posé au clic, donc la préférence tient même si l'RPC échoue).
        if (chosenLang !== "fr") {
          try {
            await sb.rpc("set_my_preferences", {
              p_data: { language: chosenLang },
            });
          } catch (_) {
            /* localStorage tient déjà la préférence */
          }
        }

        // Mesure « solo sans achat » : cet email a-t-il acheté le Pass ?
        // (get_my_pass_status, migration solo_hardening). Aucun blocage —
        // juste la donnée pour décider plus tard d'un éventuel verrou.
        if (solo) {
          try {
            const { data: pass } = await sb.rpc("get_my_pass_status");
            track("signup.solo_pass_check", { has_pass: !!pass?.has_pass });
          } catch (_) {
            /* best-effort */
          }
        }

        // 4. Succès → entrée dans l'app (l'onboarding élève gère l'add-to-home)
        window.location.href = "/#";
        window.location.reload();
      } catch (e) {
        console.error("[rejoindre] failed", e);
        const msg = /already.*registered|already.*exists/i.test(
          e?.message || "",
        )
          ? sgtR(
              "toast_exists",
              "Un compte existe déjà avec cet email. Connecte-toi directement.",
            )
          : e?.message ||
            sgtR("toast_generic", "Erreur lors de la création du compte");
        toast(msg, "error", 4500);
        submitBtn.disabled = false;
        submitBtn.textContent = sgtR("submit", "Créer mon compte");
      }
    });

    // Focus initial seulement au 1er rendu (pas à chaque changement de langue).
    // Email déjà rempli (paiement Stripe) → directement le mot de passe.
    if (!preserve) {
      const first = prefillEmail
        ? pwdEl
        : solo || prefillCode
          ? emailEl
          : codeEl;
      setTimeout(() => first.focus(), 100);
    }
  }

  renderForm();
}
