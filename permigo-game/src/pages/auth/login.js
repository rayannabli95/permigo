/**
 * Page Login — DA « Arène 3D » (nuit-violet + plastique 3D), badge vert PermiGo
 * comme seule marque (« feu vert / GO »). Accessibilité poussée (WCAG AA/AAA).
 *
 * Stack sécurité actif (INCHANGÉ) :
 *  - Honeypot (champs invisibles website_url/fax_number)
 *  - Rate limit client (5 login/5min, 3 OTP/5min)
 *  - Cloudflare Turnstile captcha (si VITE_TURNSTILE_SITEKEY défini)
 *  - Magic link / OTP par email (bouton "Code par email")
 *  - OAuth Google / Apple (si activé dans Supabase)
 *  - PKCE flow Supabase
 */

import { sb, login, loginWithOtp, verifyOtp } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { toast } from "@/components/common/toast.js";
import { esc, escAttr } from "@/utils/escape.js";
import { applyLang, getLang } from "@/utils/lang.js";

// ── i18n de la COQUE (page vue AVANT le login → pas de préférence profil) ──
// Langue affichée : 1) « en »/« ar » en localStorage (permigo_lang — posé par
// Réglages, l'inscription ou le sélecteur ci-dessous) ; 2) « fr » stocké
// UNIQUEMENT s'il vient d'un choix explicite (marqueur ci-dessous) — car
// initLangEarly() au boot écrit déjà « fr » par défaut pour TOUT visiteur ;
// 3) sinon la langue du NAVIGATEUR (affichage seul, rien n'est persisté tant
// que le visiteur ne tape pas le sélecteur). Textes REMPLACÉS (pas de FR
// gardé dessous — réservé au contenu pédagogique).
const LANG_EXPLICIT_KEY = "permigo_lang_explicit";
function activeLang(stored = getLang()) {
  if (stored === "en" || stored === "ar") return stored;
  try {
    if (localStorage.getItem(LANG_EXPLICIT_KEY)) return "fr";
  } catch {
    /* mode privé */
  }
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("ar")) return "ar";
  if (nav.startsWith("en")) return "en";
  return "fr";
}
const I18N = {
  fr: {
    title: "Content de te revoir",
    subtitle: "Retrouve ton espace",
    email: "Email",
    email_ph: "toi@exemple.fr",
    pwd: "Mot de passe",
    pwd_show: "Afficher le mot de passe",
    pwd_hide: "Masquer le mot de passe",
    otp_label: "Code reçu par email",
    otp_resend: "Renvoyer le code",
    remember: "Se souvenir de moi",
    forgot: "Mot de passe oublié ?",
    submit: "Se connecter",
    or: "ou",
    google: "Continuer avec Google",
    mode_otp: "Recevoir un code par email",
    mode_pwd: "← Utiliser mon mot de passe",
    send_code: "Envoyer le code",
    verify_code: "Vérifier le code",
    foot1: "Pas encore de compte ?",
    foot1_link: "Crée ton compte moniteur",
    foot2: "Élève avec un code moniteur ?",
    foot2_link: "Rejoins ton moniteur",
    err_email: "Email requis",
    err_pwd: "Mot de passe requis",
    err_attempts: "Trop d'essais. Réessaye dans {t}",
    err_requests: "Trop de demandes. Réessaye dans {t}",
    err_bot: "Vérification anti-bot échouée. Réessaye",
    err_creds: "Identifiants invalides",
    err_send: "Erreur envoi",
    err_code: "Code invalide",
    err_code6: "Code à 6 chiffres requis",
    email_first: "Saisis ton email d'abord",
    code_resent: "Nouveau code envoyé",
    code_sent: "Code envoyé. Vérifie ta boîte mail",
    hello: "Bonjour",
    g_fail: "Connexion Google impossible",
    g_err: "Erreur de connexion Google",
    g_off:
      "Connexion Google pas encore activée. Utilise ton email en attendant.",
    auth_off: "Auth non configurée",
    lang_group: "Langue",
    demo_accounts: "Comptes démo",
    demo: "Démo",
    role_student: "Élève",
    role_instructor: "Enseignant",
    role_manager: "Gérant",
    auth_invalid_credentials: "Identifiants invalides.",
    auth_email_unconfirmed: "Email non confirmé. Vérifie ta boîte mail.",
    auth_user_not_found: "Aucun compte trouvé pour cet email.",
    auth_invalid_otp: "Code invalide ou expiré.",
    auth_expired_token: "Le lien a expiré. Demande un nouveau code.",
    auth_password_required: "Mot de passe requis.",
    auth_password_short:
      "Le mot de passe doit contenir au moins 6 caractères.",
    auth_user_registered: "Un compte existe déjà pour cet email.",
    auth_email_rate:
      "Trop de tentatives. Réessaie dans quelques minutes.",
    auth_code_rate: "Trop de codes envoyés. Réessaie dans 60 secondes.",
    auth_wait_code: "Attends 60 secondes avant de renvoyer un code.",
    auth_otp_signup:
      "Cette adresse email n'est pas enregistrée. Vérifie l'adresse saisie.",
    auth_invalid_email: "Adresse email invalide.",
  },
  en: {
    title: "Welcome back",
    subtitle: "Back to your space",
    email: "Email",
    email_ph: "you@example.com",
    pwd: "Password",
    pwd_show: "Show password",
    pwd_hide: "Hide password",
    otp_label: "Code received by email",
    otp_resend: "Resend the code",
    remember: "Remember me",
    forgot: "Forgot password?",
    submit: "Log in",
    or: "or",
    google: "Continue with Google",
    mode_otp: "Get a code by email",
    mode_pwd: "← Use my password",
    send_code: "Send the code",
    verify_code: "Verify the code",
    foot1: "No account yet?",
    foot1_link: "Create your instructor account",
    foot2: "Student with an instructor code?",
    foot2_link: "Join your instructor",
    err_email: "Email required",
    err_pwd: "Password required",
    err_attempts: "Too many attempts. Try again in {t}",
    err_requests: "Too many requests. Try again in {t}",
    err_bot: "Anti-bot check failed. Try again",
    err_creds: "Invalid credentials",
    err_send: "Couldn't send the code",
    err_code: "Invalid code",
    err_code6: "6-digit code required",
    email_first: "Enter your email first",
    code_resent: "New code sent",
    code_sent: "Code sent. Check your inbox",
    hello: "Hello",
    g_fail: "Google sign-in failed",
    g_err: "Google sign-in error",
    g_off: "Google sign-in isn't enabled yet. Use your email for now.",
    auth_off: "Auth not configured",
    lang_group: "Language",
    demo_accounts: "Demo accounts",
    demo: "Demo",
    role_student: "Student",
    role_instructor: "Instructor",
    role_manager: "Manager",
    auth_invalid_credentials: "Invalid email or password.",
    auth_email_unconfirmed: "Email not confirmed. Check your inbox.",
    auth_user_not_found: "No account found for this email.",
    auth_invalid_otp: "Invalid or expired code.",
    auth_expired_token: "The link expired. Request a new code.",
    auth_password_required: "Password required.",
    auth_password_short: "Password must be at least 6 characters.",
    auth_user_registered: "An account already exists for this email.",
    auth_email_rate: "Too many attempts. Try again in a few minutes.",
    auth_code_rate: "Too many codes sent. Try again in 60 seconds.",
    auth_wait_code: "Wait 60 seconds before requesting a new code.",
    auth_otp_signup:
      "This email address is not registered. Check the address you typed.",
    auth_invalid_email: "Invalid email address.",
  },
  ar: {
    title: "أهلًا بعودتك",
    subtitle: "عد إلى مساحتك",
    email: "البريد الإلكتروني",
    email_ph: "you@example.com",
    pwd: "كلمة المرور",
    pwd_show: "إظهار كلمة المرور",
    pwd_hide: "إخفاء كلمة المرور",
    otp_label: "الرمز المستلم عبر البريد",
    otp_resend: "إعادة إرسال الرمز",
    remember: "تذكّرني",
    forgot: "نسيت كلمة المرور؟",
    submit: "تسجيل الدخول",
    or: "أو",
    google: "المتابعة عبر Google",
    mode_otp: "استلام رمز عبر البريد",
    mode_pwd: "استخدم كلمة مرورك",
    send_code: "إرسال الرمز",
    verify_code: "التحقق من الرمز",
    foot1: "ليس لديك حساب بعد؟",
    foot1_link: "أنشئ حساب مدرّب",
    foot2: "طالب لديه رمز مدرّب؟",
    foot2_link: "انضم إلى مدرّبك",
    err_email: "البريد الإلكتروني مطلوب",
    err_pwd: "كلمة المرور مطلوبة",
    err_attempts: "محاولات كثيرة. حاول مجددًا بعد {t}",
    err_requests: "طلبات كثيرة. حاول مجددًا بعد {t}",
    err_bot: "فشل التحقق من أنك لست روبوتًا. حاول مجددًا",
    err_creds: "بيانات الدخول غير صحيحة",
    err_send: "تعذّر إرسال الرمز",
    err_code: "رمز غير صالح",
    err_code6: "مطلوب رمز من 6 أرقام",
    email_first: "أدخل بريدك الإلكتروني أولًا",
    code_resent: "تم إرسال رمز جديد",
    code_sent: "تم إرسال الرمز. تحقق من بريدك",
    hello: "مرحبًا",
    g_fail: "تعذّر تسجيل الدخول عبر Google",
    g_err: "خطأ في تسجيل الدخول عبر Google",
    g_off: "تسجيل الدخول عبر Google غير مفعّل بعد. استخدم بريدك حاليًا.",
    auth_off: "المصادقة غير مهيأة",
    lang_group: "اللغة",
    demo_accounts: "حسابات تجريبية",
    demo: "حساب تجريبي",
    role_student: "طالب",
    role_instructor: "مدرّب",
    role_manager: "مدير",
    auth_invalid_credentials:
      "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    auth_email_unconfirmed: "البريد غير مؤكّد. تحقق من صندوق بريدك.",
    auth_user_not_found: "لا يوجد حساب لهذا البريد الإلكتروني.",
    auth_invalid_otp: "الرمز غير صالح أو منتهي الصلاحية.",
    auth_expired_token: "انتهت صلاحية الرابط. اطلب رمزًا جديدًا.",
    auth_password_required: "كلمة المرور مطلوبة.",
    auth_password_short: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
    auth_user_registered: "يوجد حساب مسجّل بهذا البريد الإلكتروني.",
    auth_email_rate: "محاولات كثيرة. حاول مجددًا بعد دقائق.",
    auth_code_rate: "أُرسلت رموز كثيرة. حاول مجددًا بعد 60 ثانية.",
    auth_wait_code: "انتظر 60 ثانية قبل طلب رمز جديد.",
    auth_otp_signup:
      "هذا البريد الإلكتروني غير مسجّل. تحقق من العنوان الذي أدخلته.",
    auth_invalid_email: "عنوان البريد الإلكتروني غير صالح.",
  },
};
function t(key, frFallback) {
  const lang = activeLang(getLang());
  return I18N[lang]?.[key] ?? I18N.fr[key] ?? frFallback;
}
function text(key, frFallback) {
  const value = esc(t(key, frFallback));
  return activeLang() === "ar" ? `<span dir="rtl">${value}</span>` : value;
}
function attr(key, frFallback) {
  return escAttr(t(key, frFallback));
}
// RTL par ATTRIBUT sur les blocs de texte (jamais <html dir> — règle lang.js).
function rtlAttr() {
  return activeLang() === "ar" ? ' dir="rtl" lang="ar"' : "";
}

const AUTH_ERROR_KEYS = {
  "Invalid login credentials": "auth_invalid_credentials",
  "Email not confirmed": "auth_email_unconfirmed",
  "User not found": "auth_user_not_found",
  "Invalid OTP": "auth_invalid_otp",
  "Token has expired or is invalid": "auth_expired_token",
  "Signup requires a valid password": "auth_password_required",
  "Password should be at least 6 characters": "auth_password_short",
  "User already registered": "auth_user_registered",
  "Email rate limit exceeded": "auth_email_rate",
  over_email_send_rate_limit: "auth_code_rate",
  "For security purposes, you can only request this once every 60 seconds":
    "auth_wait_code",
  "Signups not allowed for otp": "auth_otp_signup",
  "Unable to validate email address: invalid format": "auth_invalid_email",
};
function translateAuthError(msg) {
  if (!msg) return null;
  for (const [source, key] of Object.entries(AUTH_ERROR_KEYS)) {
    if (msg.includes(source)) return t(key, I18N.fr[key]);
  }
  return msg; // fallback : message brut Supabase
}
import {
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  formatWaitTime,
} from "@/utils/rate-limit.js";
import { getTurnstileToken, isTurnstileEnabled } from "@/utils/turnstile.js";
import { renderHoneypot, checkHoneypot } from "@/utils/honeypot.js";

const DEMO_ACCOUNTS = [
  {
    roleKey: "role_student",
    roleFr: "Élève",
    email: "eleve@test.fr",
    ico: "school",
    gold: false,
  },
  {
    roleKey: "role_instructor",
    roleFr: "Enseignant",
    email: "enseignant@test.fr",
    ico: "car",
    gold: false,
  },
  {
    roleKey: "role_manager",
    roleFr: "Gérant",
    email: "gerant@test.fr",
    ico: "crown",
    gold: true,
  },
];

// État des effets visuels (étincelles) — nettoyés à l'unmount.
let _fxRaf = 0;
let _fxResize = null;

export function mount(root) {
  root.innerHTML = template();
  wire(root);
  restoreRememberedEmail(root);
  startFx(root); // étincelles + tilt (coupés si prefers-reduced-motion)
}

export function unmount() {
  // Stoppe la boucle d'animation et le listener resize (évite une fuite rAF)
  if (_fxRaf) (cancelAnimationFrame(_fxRaf), (_fxRaf = 0));
  if (_fxResize) (removeEventListener("resize", _fxResize), (_fxResize = null));
}

// ─── Template ───
// DA « Arène 3D » : fond nuit-violet, carte plaque plastique 3D, badge vert PermiGo
// (le « feu vert / GO ») comme seule marque. A11y : focus visibles, contrastes AA,
// fix autofill, cibles ≥44px, support reduced-motion / forced-colors / prefers-contrast.
function template() {
  return `
    <style>
      .lg-root{
        position:fixed;inset:0;overflow:auto;overscroll-behavior:contain;
        display:flex;align-items:center;justify-content:center;
        padding:24px 18px calc(24px + env(safe-area-inset-bottom));
        font-family:'Archivo',var(--fb);-webkit-font-smoothing:antialiased;
        /* Jetons DA (scopés) */
        --in:#6c63ff;--in-lt:#8e87ff;--in-dp:#4a3fc9;--in-dk:#372fa3;
        --gold:#ffce4d;--gold-dp:#e8a317;--go:#58cc02;--go-dp:#3a8a01;
        --ncard:#2b2160;--ink:#f4f1ff;--ink-soft:#cdc8ec;--ink-mu:#aaa2d8;
        --field:#221a4f;--field-line:#6257a8;--focus:#ffd84d;--rad:26px;--tap:46px;
        color:var(--ink);
        background:
          radial-gradient(120% 90% at 50% -10%,rgba(255,206,77,.16),transparent 55%),
          radial-gradient(130% 120% at 50% 110%,rgba(0,0,0,.55),transparent 60%),
          linear-gradient(160deg,#241a4d 0%,#3a2a7a 100%);
      }

      /* Étincelles dorées (canvas, décor) */
      .lg-sparks{position:fixed;inset:0;z-index:0;width:100%;height:100%;pointer-events:none}

      /* Scène (perspective pour le tilt) */
      .lg-scene{position:relative;z-index:1;width:100%;max-width:430px;margin:auto;perspective:1100px}

      /* Carte = plaque plastique 3D */
      .lg-card{
        position:relative;
        background:linear-gradient(180deg,#322764 0%,var(--ncard) 60%,#261d56 100%);
        border-radius:var(--rad);padding:30px 26px 26px;
        box-shadow:
          inset 0 3px 0 rgba(255,255,255,.18),
          inset 0 2px 14px rgba(255,255,255,.06),
          inset 0 -10px 22px rgba(0,0,0,.45),
          0 10px 0 #160f38,
          0 22px 38px rgba(0,0,0,.5),
          0 0 0 2px rgba(124,111,224,.35);
        transition:transform .12s ease-out;transform-style:preserve-3d;will-change:transform;
        display:flex;flex-direction:column;
      }
      /* Liseré doré subtil */
      .lg-card::before{
        content:"";position:absolute;inset:0;border-radius:var(--rad);padding:1.5px;
        background:linear-gradient(180deg,rgba(255,206,77,.55),rgba(255,206,77,0) 45%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}

      /* En-tête : badge vert = seule marque */
      .lg-head{text-align:center}
      .lg-emblem{position:relative;display:grid;place-items:center;width:88px;height:88px;margin:0 auto 16px}
      .lg-emblem img{width:88px;height:88px;object-fit:contain;position:relative;z-index:1;
        filter:drop-shadow(0 5px 8px rgba(0,0,0,.5)) drop-shadow(0 0 16px rgba(88,204,2,.6))}
      .lg-emblem::before{content:"";position:absolute;inset:-14px;border-radius:50%;z-index:0;
        background:radial-gradient(circle,rgba(88,204,2,.45),rgba(88,204,2,0) 68%);
        animation:lg-pulse 2.8s ease-in-out infinite}
      @keyframes lg-pulse{0%,100%{transform:scale(.92);opacity:.55}50%{transform:scale(1.12);opacity:.9}}
      .lg-emblem-fb{display:none;width:80px;height:80px;place-items:center;position:relative;z-index:1;
        background:linear-gradient(180deg,#7ee838,var(--go) 55%,var(--go-dp) 100%);
        clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);
        box-shadow:inset 0 2px 3px rgba(255,255,255,.5),0 4px 8px rgba(0,0,0,.4)}
      .lg-emblem-fb b{color:#fff;font-size:42px;font-weight:800;text-shadow:0 2px 2px rgba(0,0,0,.35)}

      .lg-title{margin:6px 0 4px;font-size:26px;font-weight:800;line-height:1.1;text-shadow:0 2px 0 rgba(0,0,0,.35)}
      .lg-subtitle{margin:0 0 22px;font-size:14.5px;color:var(--ink-soft);font-weight:600}

      /* Champs */
      .lg-field{margin-bottom:14px}
      .lg-field label{display:block;font-size:13px;font-weight:700;color:var(--ink-soft);margin:0 0 6px 4px}
      .lg-shell{position:relative;display:flex;align-items:center;background:var(--field);border-radius:15px;
        box-shadow:inset 0 2px 5px rgba(0,0,0,.5),inset 0 0 0 1.5px var(--field-line);transition:box-shadow .15s ease}
      .lg-shell:focus-within{box-shadow:inset 0 2px 5px rgba(0,0,0,.4),inset 0 0 0 2px var(--focus),0 0 0 4px rgba(255,216,77,.35)}
      .lg-ico{flex:0 0 auto;display:grid;place-items:center;width:46px;height:var(--tap);color:#b7afe8}
      .lg-ico svg{width:20px;height:20px}
      .lg-shell input{flex:1 1 auto;min-width:0;height:var(--tap);background:transparent;border:0;outline:0;
        color:var(--ink);font-family:inherit;font-size:16px;font-weight:600;padding:0 6px 0 0}
      .lg-shell input::placeholder{color:#9b93cf;font-weight:500}
      .lg-otp-input{letter-spacing:.4em;font-family:var(--fn,monospace);font-size:17px;text-align:center}

      /* FIX autofill : garde le champ sombre (plus de rectangle blanc) */
      .lg-root input:-webkit-autofill,
      .lg-root input:-webkit-autofill:hover,
      .lg-root input:-webkit-autofill:focus,
      .lg-root input:-webkit-autofill:active{
        -webkit-text-fill-color:var(--ink) !important;
        -webkit-box-shadow:0 0 0 1000px var(--field) inset !important;
        box-shadow:0 0 0 1000px var(--field) inset !important;
        caret-color:var(--ink);transition:background-color 9999s ease-out 0s}

      /* Bouton œil */
      .lg-eye{flex:0 0 auto;width:var(--tap);height:var(--tap);display:grid;place-items:center;
        background:transparent;border:0;cursor:pointer;color:#b7afe8;border-radius:12px}
      .lg-eye:hover{color:var(--ink)}
      .lg-eye:focus-visible{outline:3px solid var(--focus);outline-offset:-3px}

      /* Ligne se souvenir / oublié */
      .lg-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:6px 2px 20px}
      .lg-remember{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:13.5px;
        color:var(--ink-soft);font-weight:600;user-select:none;min-height:var(--tap);padding:4px 4px 4px 0}
      .lg-remember input{position:absolute;opacity:0;width:0;height:0}
      .lg-box{width:24px;height:24px;border-radius:7px;flex:0 0 auto;background:var(--field);display:grid;place-items:center;
        box-shadow:inset 0 2px 4px rgba(0,0,0,.5),inset 0 0 0 1.5px var(--field-line);transition:all .15s ease}
      .lg-box svg{width:14px;height:14px;opacity:0;transform:scale(.5);color:#1a1340;
        transition:all .15s cubic-bezier(.34,1.56,.64,1)}
      .lg-remember input:checked + .lg-box{background:linear-gradient(180deg,var(--gold),var(--gold-dp));
        box-shadow:inset 0 1px 2px rgba(255,255,255,.6),0 2px 5px rgba(0,0,0,.35)}
      .lg-remember input:checked + .lg-box svg{opacity:1;transform:scale(1)}
      .lg-remember input:focus-visible + .lg-box{outline:3px solid var(--focus);outline-offset:3px}

      .lg-link{background:transparent;border:0;cursor:pointer;font-family:inherit;color:#bdb6ff;
        text-decoration:underline;text-underline-offset:2px;font-weight:700;font-size:13.5px;
        display:inline-flex;align-items:center;min-height:var(--tap);padding:4px 2px;border-radius:8px}
      .lg-link:hover{color:#d8d4ff}
      .lg-link:focus-visible{outline:3px solid var(--focus);outline-offset:2px}

      /* CTA plastique 3D */
      .lg-cta{width:100%;height:58px;border:0;cursor:pointer;border-radius:17px;font-family:inherit;
        font-size:18px;font-weight:800;letter-spacing:.2px;color:#fff;
        background:linear-gradient(180deg,var(--in-lt) 0%,var(--in) 55%,var(--in-dp) 100%);
        box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -4px 8px rgba(0,0,0,.28),
          0 7px 0 var(--in-dk),0 12px 20px rgba(74,63,201,.5);
        text-shadow:0 2px 1px rgba(0,0,0,.3);transform:translateY(0);
        transition:transform .08s cubic-bezier(.34,1.56,.64,1),box-shadow .08s ease}
      .lg-cta:hover{filter:brightness(1.04)}
      .lg-cta:active{transform:translateY(5px);box-shadow:inset 0 2px 0 rgba(255,255,255,.45),
        inset 0 -2px 6px rgba(0,0,0,.3),0 2px 0 var(--in-dk),0 5px 10px rgba(74,63,201,.45)}
      .lg-cta:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
      .lg-cta:disabled{opacity:.65;cursor:wait;transform:none;filter:none}

      .lg-err{color:#ffb3b3;font-size:13px;margin:10px 0 0;min-height:18px;text-align:center;font-weight:700}

      /* Lien code par email (bascule de mode) */
      .lg-code-link{display:flex;align-items:center;justify-content:center;gap:5px;text-align:center;
        margin:10px auto 4px;background:transparent;border:0;cursor:pointer;font-family:inherit;
        color:#bdb6ff;font-size:13.5px;font-weight:700;text-decoration:underline;text-underline-offset:2px;
        padding:8px;min-height:var(--tap);border-radius:10px}
      .lg-code-link:hover{color:#fff}
      .lg-code-link:focus-visible{outline:3px solid var(--focus);outline-offset:2px}

      /* Bouton « Continuer avec Google » — blanc officiel, lisible sur la nuit */
      .lg-oauth{width:100%;min-height:52px;margin:2px 0 0;padding:0 16px;border:0;border-radius:15px;
        display:inline-flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;
        background:#fff;color:#1f1f1f;font:700 15px/1 'Archivo',var(--fb),sans-serif;font-family:inherit;
        box-shadow:inset 0 -2px 0 rgba(0,0,0,.08),0 4px 0 rgba(0,0,0,.35),0 8px 16px rgba(0,0,0,.3);
        transition:transform .08s ease,filter .15s}
      .lg-oauth:hover:not(:disabled){filter:brightness(.97)}
      .lg-oauth:active:not(:disabled){transform:translateY(3px);box-shadow:inset 0 -1px 0 rgba(0,0,0,.08),0 1px 0 rgba(0,0,0,.35),0 4px 8px rgba(0,0,0,.25)}
      .lg-oauth:disabled{opacity:.6;cursor:default}
      .lg-oauth:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
      .lg-oauth svg{flex-shrink:0}
      /* Conteneur du bouton Google officiel (GIS) — centré, coins arrondis */
      .lg-gsi{display:flex;justify-content:center;min-height:0}
      .lg-gsi:not(:empty){margin:2px 0 0}
      .lg-gsi>div{border-radius:15px;overflow:hidden}

      /* Séparateur démo */
      .lg-sep{display:flex;align-items:center;gap:12px;margin:14px 0 16px;color:var(--ink-mu);
        font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
      .lg-sep::before,.lg-sep::after{content:"";flex:1;height:2px;border-radius:2px;
        background:linear-gradient(90deg,transparent,rgba(124,111,224,.4),transparent)}

      /* 3 mini-cartes démo */
      .lg-demos{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .lg-demo{display:flex;flex-direction:column;align-items:center;gap:7px;padding:13px 6px 11px;
        min-height:var(--tap);border:0;cursor:pointer;border-radius:16px;color:var(--ink);
        background:linear-gradient(180deg,#3a2f72 0%,#2c2360 100%);font-family:inherit;font-size:12.5px;font-weight:700;
        box-shadow:inset 0 2px 0 rgba(255,255,255,.16),0 4px 0 #1b143f,0 7px 12px rgba(0,0,0,.35);
        transition:transform .08s ease,box-shadow .08s ease}
      .lg-demo:hover{filter:brightness(1.06)}
      .lg-demo:active{transform:translateY(3px);box-shadow:inset 0 2px 0 rgba(255,255,255,.14),0 1px 0 #1b143f,0 3px 7px rgba(0,0,0,.3)}
      .lg-demo:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
      .lg-demo .lg-badge{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:#fff;
        background:linear-gradient(180deg,var(--in-lt),var(--in-dp));
        box-shadow:inset 0 2px 2px rgba(255,255,255,.4),0 2px 4px rgba(0,0,0,.3)}
      .lg-demo.is-gold .lg-badge{background:linear-gradient(180deg,var(--gold),var(--gold-dp));color:#3a2600}

      /* Footer */
      .lg-foot{margin-top:18px;text-align:center;font-size:13.5px;color:var(--ink-soft);font-weight:600}
      .lg-foot a{color:var(--gold);font-weight:700;text-decoration:underline;text-underline-offset:2px;
        display:inline-flex;min-height:var(--tap);align-items:center;padding:2px 4px;border-radius:8px}
      .lg-foot a:hover{color:#ffe39a}
      .lg-foot a:focus-visible{outline:3px solid var(--focus);outline-offset:2px}

      .lg-version{position:fixed;right:14px;bottom:12px;z-index:2;font-size:11px;font-weight:700;
        color:var(--ink-mu);letter-spacing:.3px}

      /* Préférence de mouvement */
      @media (prefers-reduced-motion: reduce){
        .lg-sparks{display:none}
        .lg-card{transform:none !important}
        .lg-root *,.lg-root *::before,.lg-root *::after{animation:none !important;transition:none !important}
        .lg-emblem::before{transform:scale(1);opacity:.7}
      }
      /* Contraste renforcé */
      @media (prefers-contrast: more){
        .lg-root{--ink-soft:#e4e1f7;--ink-mu:#cfcaee;--field-line:#8a7ed0}
        .lg-shell{box-shadow:inset 0 0 0 2px var(--field-line)}
        .lg-demo,.lg-cta{outline:1px solid rgba(255,255,255,.4)}
        .lg-link,.lg-code-link,.lg-foot a{text-decoration-thickness:2px}
      }
      /* Contrastes forcés (Windows High Contrast) */
      @media (forced-colors: active){
        .lg-card{border:1px solid CanvasText}
        .lg-shell{border:1px solid CanvasText;box-shadow:none}
        .lg-cta,.lg-demo{border:2px solid ButtonText;box-shadow:none}
        .lg-box{border:1px solid CanvasText}
        .lg-remember input:checked + .lg-box{background:Highlight}
        .lg-root :focus-visible{outline:2px solid Highlight !important}
        .lg-emblem img{filter:none}
      }
      /* Petits écrans */
      @media (max-width:360px){
        .lg-card{padding:26px 20px 22px}
        .lg-title{font-size:23px}
        .lg-demo{font-size:11.5px}
      }

      /* Sélecteur de langue — discret, coin haut droit de la carte */
      .lg-langs{position:absolute;top:12px;right:14px;display:flex;gap:2px;z-index:2}
      .lg-lang{background:transparent;border:0;cursor:pointer;font-family:inherit;
        font-size:12px;font-weight:800;letter-spacing:.4px;color:var(--ink-mu);
        padding:6px 7px;min-width:30px;min-height:32px;border-radius:9px;
        transition:color .15s ease,background .15s ease}
      .lg-lang:hover{color:var(--ink-soft)}
      .lg-lang.on{color:var(--gold);background:rgba(255,206,77,.12)}
      .lg-lang:focus-visible{outline:3px solid var(--focus);outline-offset:1px}
    </style>

    <div class="lg-root">
      <canvas class="lg-sparks" id="lg-sparks" aria-hidden="true"></canvas>

      <main class="lg-scene">
        <form class="lg-card" id="login-form" autocomplete="on" novalidate>
          ${renderHoneypot()}

          <div class="lg-langs" role="group" aria-label="${attr("lang_group", "Langue")}">
            ${["fr", "en", "ar"]
              .map(
                (l) =>
                  `<button type="button" class="lg-lang${activeLang() === l ? " on" : ""}" data-lang="${l}" aria-pressed="${activeLang() === l}">${l === "ar" ? "ع" : l.toUpperCase()}</button>`,
              )
              .join("")}
          </div>

          <div class="lg-head">
            <div class="lg-emblem">
              <img src="/skins/avatars/permigo-badge-icon.png" alt="PermiGo" loading="eager" draggable="false"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
              <span class="lg-emblem-fb" aria-hidden="true"><b>P</b></span>
            </div>
            <h1 class="lg-title"${rtlAttr()}>${text("title", "Content de te revoir")}</h1>
            <p class="lg-subtitle"${rtlAttr()}>${text("subtitle", "Retrouve ton espace")}</p>
          </div>

          <div class="lg-field" id="lg-email-field">
            <label for="lg-email"${rtlAttr()}>${text("email", "Email")}</label>
            <div class="lg-shell">
              <span class="lg-ico" aria-hidden="true">${ICON_MAIL}</span>
              <input id="lg-email" type="email" name="email" inputmode="email" required autocomplete="email" placeholder="${attr("email_ph", "toi@exemple.fr")}">
            </div>
          </div>

          <div class="lg-field" id="lg-pwd-field">
            <label for="lg-pwd"${rtlAttr()}>${text("pwd", "Mot de passe")}</label>
            <div class="lg-shell">
              <span class="lg-ico" aria-hidden="true">${ICON_LOCK}</span>
              <input id="lg-pwd" type="password" name="password" autocomplete="current-password" placeholder="••••••••">
              <button type="button" class="lg-eye" id="lg-pw-toggle" aria-label="${attr("pwd_show", "Afficher le mot de passe")}" aria-pressed="false">${icon("eye", { size: 20 })}</button>
            </div>
          </div>

          <div class="lg-field" id="lg-otp-field" style="display:none">
            <label for="lg-otp"${rtlAttr()}>${text("otp_label", "Code reçu par email")}</label>
            <div class="lg-shell">
              <span class="lg-ico" aria-hidden="true">${ICON_KEY}</span>
              <input id="lg-otp" class="lg-otp-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="123456">
            </div>
            <button type="button" id="lg-otp-resend" class="lg-link" style="margin:6px auto 0"${rtlAttr()}>${text("otp_resend", "Renvoyer le code")}</button>
          </div>

          <div class="lg-row" id="lg-row-remember">
            <label class="lg-remember">
              <input type="checkbox" id="lg-remember">
              <span class="lg-box" aria-hidden="true">${ICON_CHECK}</span>
              <span${rtlAttr()}>${text("remember", "Se souvenir de moi")}</span>
            </label>
            <button type="button" class="lg-link" id="lg-forgot"${rtlAttr()}>${text("forgot", "Mot de passe oublié ?")}</button>
          </div>

          <button type="submit" class="lg-cta" id="lg-submit"${rtlAttr()}>${text("submit", "Se connecter")}</button>
          <p class="lg-err" id="lg-err" role="alert" aria-live="assertive"${rtlAttr()}></p>

          <div class="lg-sep">${text("or", "ou")}</div>
          <!-- Bouton Google OFFICIEL (GIS) : la fenêtre affiche « PermiGo »
               (marque de l'écran de consentement) au lieu de l'URL technique
               Supabase qu'impose le flux par redirection. Rendu en JS ;
               le bouton maison ci-dessous sert de REPLI (script bloqué…). -->
          <div class="lg-gsi" id="lg-gsi"></div>
          <button type="button" class="lg-oauth" data-oauth="google" aria-label="${attr("google", "Continuer avec Google")}">
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            ${text("google", "Continuer avec Google")}
          </button>

          <button type="button" class="lg-code-link" id="lg-mode-toggle"${rtlAttr()}>${text("mode_otp", "Recevoir un code par email")}</button>

          ${
            import.meta.env.DEV
              ? `<div class="lg-sep">${text("demo_accounts", "Comptes démo")}</div>
          <div class="lg-demos">
            ${DEMO_ACCOUNTS.map(
              (a) => `
              <button class="lg-demo${a.gold ? " is-gold" : ""}" type="button" data-email="${escAttr(a.email)}" aria-label="${escAttr(`${t("demo", "Démo")} ${t(a.roleKey, a.roleFr)}`)}">
                <span class="lg-badge" aria-hidden="true">${icon(a.ico, { size: 20 })}</span>
                ${text(a.roleKey, a.roleFr)}
              </button>
            `,
            ).join("")}
          </div>`
              : ""
          }

          <p class="lg-foot"${rtlAttr()}>
            ${text("foot1", "Pas encore de compte ?")} <a href="/#/creer-compte">${text("foot1_link", "Crée ton compte moniteur")}</a>
          </p>
          <p class="lg-foot"${rtlAttr()}>
            ${text("foot2", "Élève avec un code moniteur ?")} <a href="/#/rejoindre">${text("foot2_link", "Rejoins ton moniteur")}</a>
          </p>
        </form>
      </main>

      <span class="lg-version">PermiGo · v7</span>
    </div>
  `;
}

// ─── Icônes SVG inline (lucide-style) ───
const ICON_MAIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/></svg>`;
const ICON_LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;
const ICON_KEY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 8.5-8.5M16 6l3 3M14 8l3 3"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

// ─── Effets visuels (étincelles dorées + tilt 3D) — enhancement, sans état métier ───
function startFx(root) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  // Tilt 3D subtil de la carte (pointeur fin uniquement)
  if (matchMedia("(pointer:fine)").matches) {
    const card = root.querySelector("#login-form");
    if (card) {
      const MAX = 5;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${px * MAX}deg) rotateX(${-py * MAX}deg) translateZ(0)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    }
  }

  // Étincelles dorées (canvas)
  const cv = root.querySelector("#lg-sparks");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const GOLD = ["#ffce4d", "#ffe39a", "#ffd76b"];
  let dots = [];

  _fxResize = function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + "px";
    cv.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((innerWidth * innerHeight) / 42000);
    dots = Array.from({ length: Math.max(16, Math.min(n, 40)) }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.6 + 0.5,
      vy: Math.random() * 0.25 + 0.06,
      a: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.03 + 0.012,
      c: GOLD[(Math.random() * GOLD.length) | 0],
    }));
  };
  _fxResize();
  addEventListener("resize", _fxResize);

  (function tick() {
    // Auto-stop : si le canvas n'est plus dans le DOM (page quittée), on
    // arrête la boucle — sinon elle tournait pour toujours après connexion.
    if (!document.body.contains(cv)) {
      _fxRaf = 0;
      return;
    }
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const d of dots) {
      d.y -= d.vy;
      d.a += d.sp;
      if (d.y < -5) {
        d.y = innerHeight + 5;
        d.x = Math.random() * innerWidth;
      }
      const glow = (Math.sin(d.a) + 1) / 2;
      ctx.globalAlpha = 0.15 + glow * 0.5;
      ctx.fillStyle = d.c;
      ctx.shadowBlur = 8;
      ctx.shadowColor = d.c;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    _fxRaf = requestAnimationFrame(tick);
  })();
}

// ─── Wire ───
function wire(root) {
  const form = root.querySelector("#login-form");
  const errEl = root.querySelector("#lg-err");
  const submitBtn = root.querySelector("#lg-submit");
  const emailIn = root.querySelector("#lg-email");
  const pwdIn = root.querySelector("#lg-pwd");
  const pwdField = root.querySelector("#lg-pwd-field");
  const otpField = root.querySelector("#lg-otp-field");
  const otpIn = root.querySelector("#lg-otp");
  const rowRemember = root.querySelector("#lg-row-remember");
  const pwToggle = root.querySelector("#lg-pw-toggle");
  const modeToggle = root.querySelector("#lg-mode-toggle");
  const remember = root.querySelector("#lg-remember");

  let mode = "password"; // 'password' | 'otp-request' | 'otp-verify'

  function setMode(newMode) {
    mode = newMode;
    errEl.textContent = "";
    if (mode === "password") {
      pwdField.style.display = "";
      otpField.style.display = "none";
      rowRemember.style.display = "";
      submitBtn.textContent = t("submit", "Se connecter");
      modeToggle.textContent = t("mode_otp", "Recevoir un code par email");
    } else if (mode === "otp-request") {
      pwdField.style.display = "none";
      otpField.style.display = "none";
      rowRemember.style.display = "none";
      submitBtn.textContent = t("send_code", "Envoyer le code");
      modeToggle.textContent = t("mode_pwd", "← Utiliser mon mot de passe");
    } else if (mode === "otp-verify") {
      pwdField.style.display = "none";
      otpField.style.display = "";
      rowRemember.style.display = "none";
      submitBtn.textContent = t("verify_code", "Vérifier le code");
      modeToggle.textContent = t("mode_pwd", "← Utiliser mon mot de passe");
      setTimeout(() => otpIn.focus(), 100);
    }
  }
  modeToggle.addEventListener("click", () =>
    setMode(mode === "password" ? "otp-request" : "password"),
  );

  // Show/hide password (+ a11y : aria-pressed / aria-label)
  pwToggle.addEventListener("click", () => {
    const show = pwdIn.type === "password";
    pwdIn.type = show ? "text" : "password";
    pwToggle.innerHTML = show
      ? icon("eye-off", { size: 20 })
      : icon("eye", { size: 20 });
    pwToggle.setAttribute("aria-pressed", String(show));
    pwToggle.setAttribute(
      "aria-label",
      show
        ? t("pwd_hide", "Masquer le mot de passe")
        : t("pwd_show", "Afficher le mot de passe"),
    );
  });

  // Sélecteur de langue (coque avant-login) : choix EXPLICITE → applyLang
  // (persiste permigo_lang + event) puis re-rendu de la page, saisie conservée.
  root.querySelectorAll(".lg-lang").forEach((b) => {
    b.addEventListener("click", () => {
      const l = b.dataset.lang;
      if (!l || l === activeLang()) return;
      const keep = {
        email: emailIn.value,
        pwd: pwdIn.value,
        remember: remember.checked,
      };
      try {
        localStorage.setItem(LANG_EXPLICIT_KEY, "1");
      } catch {
        /* mode privé */
      }
      applyLang(l);
      unmount();
      mount(root);
      const em = root.querySelector("#lg-email");
      const pw = root.querySelector("#lg-pwd");
      const rm = root.querySelector("#lg-remember");
      if (em && keep.email) em.value = keep.email;
      if (pw && keep.pwd) pw.value = keep.pwd;
      if (rm) rm.checked = keep.remember;
    });
  });

  // Forgot password = bascule en mode OTP
  root.querySelector("#lg-forgot").addEventListener("click", () => {
    if (!emailIn.value.trim())
      toast(t("email_first", "Saisis ton email d'abord"), "info");
    setMode("otp-request");
  });

  // Resend OTP
  root.querySelector("#lg-otp-resend").addEventListener("click", async () => {
    const email = emailIn.value.trim();
    if (!email) {
      setMode("otp-request");
      return;
    }
    const rl = checkRateLimit("otp", email, 3, 5 * 60_000);
    if (!rl.allowed) {
      errEl.textContent = t(
        "err_requests",
        `Trop de demandes. Réessaye dans ${formatWaitTime(rl.wait)}`,
      ).replace("{t}", formatWaitTime(rl.wait));
      return;
    }
    recordAttempt("otp", email);
    const captchaToken = isTurnstileEnabled()
      ? await getTurnstileToken("otp")
      : null;
    const r = await loginWithOtp(email, { captchaToken });
    if (r.ok) toast(t("code_resent", "Nouveau code envoyé"), "success");
    else
      errEl.textContent = esc(
        translateAuthError(r.error) || t("err_send", "Erreur envoi"),
      );
  });

  // ── Bouton Google OFFICIEL (Google Identity Services) ──
  // Flux « jeton d'identité » : la fenêtre Google affiche la MARQUE du client
  // OAuth (« Continuer vers PermiGo ») au lieu de l'URL Supabase du flux par
  // redirection. Le jeton est échangé via sb.auth.signInWithIdToken.
  // L'ID client est PUBLIC par nature (il est aussi dans la fenêtre Google).
  const GOOGLE_CLIENT_ID =
    "178846205146-oi10lhl4rbifbc3r4nj6v485qk24gnfq.apps.googleusercontent.com";
  const gsiBox = root.querySelector("#lg-gsi");
  const gsiFallbackBtn = root.querySelector('[data-oauth="google"]');
  (async () => {
    if (!sb || !gsiBox || !window.isSecureContext || !crypto?.subtle) return;
    try {
      // Nonce anti-rejeu : le HASH va à Google, le BRUT à Supabase, qui
      // recalcule sha256(brut) en HEXADÉCIMAL pour le comparer au jeton
      // (doc Supabase « Login with Google ») — base64 ⇒ « nonce mismatch ».
      const rawNonce = crypto.randomUUID() + crypto.randomUUID();
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(rawNonce),
      );
      const hashedNonce = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      await new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve();
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
        setTimeout(() => reject(new Error("gsi_timeout")), 6000);
      });
      if (!window.google?.accounts?.id) throw new Error("gsi_unavailable");

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        callback: async (resp) => {
          try {
            const { error } = await sb.auth.signInWithIdToken({
              provider: "google",
              token: resp.credential,
              nonce: rawNonce,
            });
            if (error) throw error;
            window.location.href = "/#";
            window.location.reload();
          } catch (e) {
            console.error("[login] google id-token", e);
            toast(
              translateAuthError(e?.message) ||
                t("g_fail", "Connexion Google impossible"),
              "error",
              4000,
            );
          }
        },
      });
      window.google.accounts.id.renderButton(gsiBox, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        locale: activeLang(),
        width: Math.min(gsiBox.clientWidth || 320, 380),
      });
      // Rendu OK (origine autorisée, script chargé) → le repli disparaît.
      if (gsiBox.childElementCount > 0 && gsiFallbackBtn)
        gsiFallbackBtn.style.display = "none";
    } catch {
      /* script bloqué / origine non autorisée (dev local) → repli redirection */
    }
  })();

  // OAuth buttons
  root.querySelectorAll("[data-oauth]").forEach((b) => {
    b.addEventListener("click", async () => {
      if (!sb) return toast(t("auth_off", "Auth non configurée"), "error");
      const provider = b.dataset.oauth; // 'google' | 'apple'
      b.disabled = true;
      // skipBrowserRedirect : on récupère l'URL sans quitter la page, pour
      // vérifier D'ABORD que le fournisseur est activé côté Supabase — sinon
      // l'utilisateur atterrissait sur une page d'erreur JSON brute.
      const { data, error } = await sb.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          skipBrowserRedirect: true,
          queryParams:
            provider === "google" ? { prompt: "select_account" } : undefined,
        },
      });
      const softFail = (m) => {
        toast(m, "error", 4000);
        b.disabled = false;
      };
      if (error || !data?.url) {
        return softFail(
          translateAuthError(error?.message) ||
            t("g_err", "Erreur de connexion Google"),
        );
      }
      try {
        // Fournisseur activé → 302 (opaqueredirect) ; désactivé → 400 JSON.
        const probe = await fetch(data.url, { redirect: "manual" });
        if (probe.status === 400 || probe.status === 404) {
          return softFail(
            t(
              "g_off",
              "Connexion Google pas encore activée. Utilise ton email en attendant.",
            ),
          );
        }
      } catch {
        /* réseau capricieux : on tente la redirection quand même */
      }
      window.location.href = data.url;
    });
  });

  // Demo buttons → pré-remplit (DEV uniquement — exclu du bundle prod par Vite,
  // sinon on exposerait des comptes de test + un mot de passe en clair)
  if (import.meta.env.DEV) {
    root.querySelectorAll(".lg-demo").forEach((b) => {
      b.addEventListener("click", () => {
        emailIn.value = b.dataset.email;
        pwdIn.value = "Autopilot2025!";
        errEl.textContent = ""; // Clear error message when demo filled
        pwdIn.focus();
      });
    });
  }

  // ─── Submit ───
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.textContent = "";

    if (!checkHoneypot(form)) {
      console.warn("[login] honeypot triggered");
      return; // bot silencieux
    }

    const email = emailIn.value.trim();
    if (!email) {
      errEl.textContent = t("err_email", "Email requis");
      shake();
      return;
    }

    const rlAction =
      mode === "otp-verify"
        ? "otp-verify"
        : mode === "otp-request"
          ? "otp"
          : "login";
    const rl = checkRateLimit(rlAction, email, 5, 5 * 60_000);
    if (!rl.allowed) {
      errEl.textContent = t(
        "err_attempts",
        `Trop d'essais. Réessaye dans ${formatWaitTime(rl.wait)}`,
      ).replace("{t}", formatWaitTime(rl.wait));
      shake();
      return;
    }
    recordAttempt(rlAction, email);

    submitBtn.disabled = true;
    submitBtn.textContent = "…";

    try {
      const captchaToken = isTurnstileEnabled()
        ? await getTurnstileToken(rlAction)
        : null;
      if (isTurnstileEnabled() && !captchaToken) {
        errEl.textContent = t(
          "err_bot",
          "Vérification anti-bot échouée. Réessaye",
        );
        shake();
        return;
      }

      if (mode === "password") {
        const pwd = pwdIn.value;
        if (!pwd) {
          errEl.textContent = t("err_pwd", "Mot de passe requis");
          shake();
          return;
        }
        const { ok, profile, error } = await login(email, pwd, {
          captchaToken,
        });
        if (!ok) {
          errEl.textContent = esc(
            translateAuthError(error) ||
              t("err_creds", "Identifiants invalides"),
          );
          shake();
          return;
        }
        resetRateLimit("login", email);
        if (remember.checked) saveRememberedEmail(email);
        else clearRememberedEmail();
        // Prénom pour le bonjour — garde anti-null : un profil sans `nom`
        // (ex. compte owner) faisait planter `null.split()` → le login réussissait
        // mais afterLogin() n'était jamais appelé (« rien ne se passe »).
        const greetName = (profile.prenom || profile.nom || "").split(" ")[0];
        toast(`${t("hello", "Bonjour")} ${esc(greetName)}`.trim(), "success");
        afterLogin();
      } else if (mode === "otp-request") {
        const r = await loginWithOtp(email, { captchaToken });
        if (!r.ok) {
          errEl.textContent = esc(
            translateAuthError(r.error) || t("err_send", "Erreur envoi"),
          );
          shake();
          return;
        }
        toast(
          t("code_sent", "Code envoyé. Vérifie ta boîte mail"),
          "success",
        );
        setMode("otp-verify");
      } else if (mode === "otp-verify") {
        const token = otpIn.value.trim();
        if (!/^\d{6}$/.test(token)) {
          errEl.textContent = t("err_code6", "Code à 6 chiffres requis");
          shake();
          return;
        }
        const r = await verifyOtp(email, token);
        if (!r.ok) {
          errEl.textContent = esc(
            translateAuthError(r.error) || t("err_code", "Code invalide"),
          );
          shake();
          return;
        }
        resetRateLimit("otp", email);
        resetRateLimit("otp-verify", email);
        toast(
          `${t("hello", "Bonjour")} ${esc((r.profile.prenom || r.profile.nom || "").split(" ")[0])}`,
          "success",
        );
        afterLogin();
      }
    } finally {
      submitBtn.disabled = false;
      if (mode === "password")
        submitBtn.textContent = t("submit", "Se connecter");
      else if (mode === "otp-request")
        submitBtn.textContent = t("send_code", "Envoyer le code");
      else submitBtn.textContent = t("verify_code", "Vérifier le code");
    }
  });

  function shake() {
    form.classList.add("anim-shake");
    setTimeout(() => form.classList.remove("anim-shake"), 400);
  }
  async function afterLogin() {
    // Nettoyage explicite des FX login (rAF + resize) avant de quitter la page.
    unmount();
    // Rechargement complet plutôt qu'un montage manuel : le montage partiel
    // (route + header + nav) SAUTAIT la moitié de boot() → `data-role` jamais
    // posé (DA arcade moniteur absente), startNotifListener() jamais lancé
    // (quiz post-validation + célébrations morts), initGameState/accent/onboarding
    // sautés, et double-montage de la home (hashchange + route() direct). boot()
    // rejoue toute la séquence proprement sur la home.
    setTimeout(() => {
      if (location.hash !== "#/") location.hash = "#/";
      location.reload();
    }, 600);
  }
}

// ─── Remember me ───
const REMEMBER_KEY = "permigo-remember-email";
function saveRememberedEmail(email) {
  try {
    localStorage.setItem(REMEMBER_KEY, email);
  } catch {}
}
function clearRememberedEmail() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
  } catch {}
}
function restoreRememberedEmail(root) {
  try {
    const e = localStorage.getItem(REMEMBER_KEY);
    if (e) {
      root.querySelector("#lg-email").value = e;
      root.querySelector("#lg-remember").checked = true;
    }
  } catch {}
}
