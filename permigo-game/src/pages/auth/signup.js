/**
 * Page Signup — création de compte simple
 * Email + Password + Confirm + École
 */

import { sb } from "@/auth/auth.js";
import { toast } from "@/components/common/toast.js";
import { esc, escAttr } from "@/utils/escape.js";
import { getLang } from "@/utils/lang.js";

const I18N = {
  fr: {
    title: "Créer un compte",
    email: "Email",
    email_ph: "vous@exemple.fr",
    password: "Mot de passe",
    confirm: "Confirmer le mot de passe",
    school: "École (optionnel)",
    school_ph: "Nom de votre auto-école",
    submit: "S'inscrire",
    already: "Déjà inscrit ?",
    login: "Se connecter",
    err_email: "Email requis",
    err_password: "Mot de passe requis",
    err_password_short:
      "Le mot de passe doit contenir au moins 6 caractères",
    err_mismatch: "Les mots de passe ne correspondent pas",
    err_signup: "Erreur lors de l'inscription",
    err_generic: "Erreur inscription",
    success: "Inscription réussie. Vérifie ta boîte mail",
    auth_registered: "Un compte existe déjà pour cet email.",
    auth_invalid_email: "Adresse email invalide.",
    auth_password_short:
      "Le mot de passe doit contenir au moins 6 caractères.",
    auth_rate_limit:
      "Trop de tentatives. Réessaie dans quelques minutes.",
  },
  en: {
    title: "Create an account",
    email: "Email",
    email_ph: "you@example.com",
    password: "Password",
    confirm: "Confirm password",
    school: "Driving school (optional)",
    school_ph: "Name of your driving school",
    submit: "Sign up",
    already: "Already registered?",
    login: "Log in",
    err_email: "Email required",
    err_password: "Password required",
    err_password_short: "Password must be at least 6 characters",
    err_mismatch: "Passwords don't match",
    err_signup: "Sign-up failed",
    err_generic: "Sign-up error",
    success: "Account created. Check your inbox",
    auth_registered: "An account already exists for this email.",
    auth_invalid_email: "Invalid email address.",
    auth_password_short: "Password must be at least 6 characters.",
    auth_rate_limit: "Too many attempts. Try again in a few minutes.",
  },
  ar: {
    title: "إنشاء حساب",
    email: "البريد الإلكتروني",
    email_ph: "you@example.com",
    password: "كلمة المرور",
    confirm: "تأكيد كلمة المرور",
    school: "مدرسة تعليم القيادة (اختياري)",
    school_ph: "اسم مدرسة تعليم القيادة",
    submit: "إنشاء الحساب",
    already: "لديك حساب بالفعل؟",
    login: "تسجيل الدخول",
    err_email: "البريد الإلكتروني مطلوب",
    err_password: "كلمة المرور مطلوبة",
    err_password_short: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل",
    err_mismatch: "كلمتا المرور غير متطابقتين",
    err_signup: "تعذّر إنشاء الحساب",
    err_generic: "حدث خطأ أثناء إنشاء الحساب",
    success: "تم إنشاء الحساب. تحقق من صندوق بريدك",
    auth_registered: "يوجد حساب مسجّل بهذا البريد الإلكتروني.",
    auth_invalid_email: "عنوان البريد الإلكتروني غير صالح.",
    auth_password_short: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
    auth_rate_limit: "محاولات كثيرة. حاول مجددًا بعد دقائق.",
  },
};

function t(key, frFallback) {
  const lang = getLang();
  return I18N[lang]?.[key] ?? I18N.fr[key] ?? frFallback;
}

function text(key, frFallback) {
  const value = esc(t(key, frFallback));
  return getLang() === "ar" ? `<span dir="rtl">${value}</span>` : value;
}

function attr(key, frFallback) {
  return escAttr(t(key, frFallback));
}

const AUTH_ERROR_KEYS = {
  "User already registered": "auth_registered",
  "Unable to validate email address: invalid format": "auth_invalid_email",
  "Password should be at least": "auth_password_short",
  "Email rate limit exceeded": "auth_rate_limit",
};

function translateAuthError(message) {
  if (!message) return null;
  for (const [source, key] of Object.entries(AUTH_ERROR_KEYS)) {
    if (message.includes(source)) return t(key, I18N.fr[key]);
  }
  return message;
}

export function mount(root) {
  root.innerHTML = template();
  wire(root);
}

function template() {
  return `
    <style>
      .su-root{position:fixed;inset:0;overflow:auto;background:var(--ink);display:flex;align-items:center;justify-content:center;padding:calc(24px + env(safe-area-inset-top,0px)) calc(16px + env(safe-area-inset-right,0px)) calc(24px + env(safe-area-inset-bottom,0px)) calc(16px + env(safe-area-inset-left,0px));font-family:var(--fb)}
      .su-bg{position:absolute;inset:0;z-index:0;pointer-events:none}
      .su-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,var(--a) 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,var(--pu) 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,var(--blk) 0%,transparent 40%);filter:blur(60px);opacity:.5}
      .su-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,transparent 0%,rgba(11,13,26,.6) 100%)}
      .su-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;z-index:1;pointer-events:none}
      .su-content{position:relative;z-index:2;width:100%;max-width:400px;display:flex;flex-direction:column;align-items:center;margin:auto}
      .su-card{width:100%;background:rgba(255,255,255,.06);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:28px 26px;box-shadow:0 30px 80px -20px rgba(0,0,0,.65);display:flex;flex-direction:column;gap:16px;color:#fff}
      .su-card h2{font-family:var(--fd);font-weight:900;font-size:22px;letter-spacing:-.02em;margin:0;text-align:center}
      .su-field{display:flex;flex-direction:column;gap:6px}
      .su-field label{font-size:10.5px;font-weight:800;color:rgba(255,255,255,.78);letter-spacing:1.2px;text-transform:uppercase}
      .su-input-wrap{display:flex;align-items:center;gap:10px;height:44px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);transition:border-color .15s,background .15s,box-shadow .15s}
      .su-input-wrap:focus-within{border-color:var(--al3);background:rgba(255,255,255,.08);box-shadow:0 0 0 3px color-mix(in srgb, var(--a) 18%, transparent)}
      .su-input-wrap input{flex:1;align-self:stretch;background:transparent;border:0;outline:0;color:#fff;font-size:16px;font-family:inherit;min-width:0}
      .su-input-wrap input::placeholder{color:rgba(255,255,255,.35)}
      .su-cta{width:100%;height:48px;border-radius:12px;border:0;background:var(--a);color:var(--a-ink);font-family:var(--fd);font-weight:800;font-size:15px;cursor:pointer;transition:transform .12s,box-shadow .12s;box-shadow:0 12px 32px -10px color-mix(in srgb, var(--a) 65%, transparent)}
      .su-cta:hover{transform:translateY(-1px);box-shadow:0 16px 40px -10px color-mix(in srgb, var(--a) 80%, transparent)}
      .su-cta:disabled{opacity:.6;cursor:wait}
      .su-err{color:#fda4af;font-size:12px;margin:0;min-height:16px;text-align:center;font-weight:600}
      .su-foot{text-align:center;font-size:12.5px;color:rgba(255,255,255,.65)}
      .su-foot a{color:var(--al3);font-weight:700;text-decoration:none}
      .su-foot a:hover{text-decoration:underline}
    </style>

    <div class="su-root">
      <div class="su-bg"></div>
      <div class="su-grid"></div>

      <div class="su-content">
        <div class="su-card">
          <h2>${text("title", "Créer un compte")}</h2>

          <form id="signup-form" novalidate>
            <div class="su-field">
              <label for="su-email">${text("email", "Email")}</label>
              <div class="su-input-wrap">
                <input id="su-email" type="email" name="email" required autocomplete="email" placeholder="${attr("email_ph", "vous@exemple.fr")}">
              </div>
            </div>

            <div class="su-field">
              <label for="su-password">${text("password", "Mot de passe")}</label>
              <div class="su-input-wrap">
                <input id="su-password" type="password" name="password" required autocomplete="new-password" placeholder="••••••••">
              </div>
            </div>

            <div class="su-field">
              <label for="su-confirm">${text("confirm", "Confirmer le mot de passe")}</label>
              <div class="su-input-wrap">
                <input id="su-confirm" type="password" name="confirm" required autocomplete="new-password" placeholder="••••••••">
              </div>
            </div>

            <div class="su-field">
              <label for="su-school">${text("school", "École (optionnel)")}</label>
              <div class="su-input-wrap">
                <input id="su-school" type="text" name="school" autocomplete="off" placeholder="${attr("school_ph", "Nom de votre auto-école")}">
              </div>
            </div>

            <button type="submit" class="su-cta" id="su-submit">${text("submit", "S'inscrire")}</button>
            <p class="su-err" id="su-err"></p>
          </form>

          <div class="su-foot">
            ${text("already", "Déjà inscrit ?")} <a href="#/login">${text("login", "Se connecter")}</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function wire(root) {
  const form = root.querySelector("#signup-form");
  const emailIn = root.querySelector("#su-email");
  const pwdIn = root.querySelector("#su-password");
  const confirmIn = root.querySelector("#su-confirm");
  const schoolIn = root.querySelector("#su-school");
  const submitBtn = root.querySelector("#su-submit");
  const errEl = root.querySelector("#su-err");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.textContent = "";

    const email = emailIn.value.trim();
    const password = pwdIn.value;
    const confirm = confirmIn.value;
    const school = schoolIn.value.trim();

    if (!email) {
      errEl.textContent = t("err_email", "Email requis");
      return;
    }
    if (!password) {
      errEl.textContent = t("err_password", "Mot de passe requis");
      return;
    }
    if (password.length < 6) {
      errEl.textContent = t(
        "err_password_short",
        "Le mot de passe doit contenir au moins 6 caractères",
      );
      return;
    }
    if (password !== confirm) {
      errEl.textContent = t(
        "err_mismatch",
        "Les mots de passe ne correspondent pas",
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "…";

    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
      });

      if (error) {
        errEl.textContent = esc(
          translateAuthError(error.message) ||
            t("err_signup", "Erreur lors de l'inscription"),
        );
        submitBtn.disabled = false;
        submitBtn.textContent = t("submit", "S'inscrire");
        return;
      }

      toast(
        t("success", "Inscription réussie. Vérifie ta boîte mail"),
        "success",
      );
      setTimeout(() => {
        window.location.hash = "#/login";
      }, 1000);
    } catch (err) {
      errEl.textContent = esc(
        translateAuthError(err.message) ||
          t("err_generic", "Erreur inscription"),
      );
      submitBtn.disabled = false;
      submitBtn.textContent = t("submit", "S'inscrire");
    }
  });
}
