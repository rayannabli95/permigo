/**
 * Page "Nouveau mot de passe" — l'utilisateur définit / redéfinit son mot de passe.
 *
 * Atteinte de 2 façons, et dans les DEUX l'utilisateur a une session active
 * (donc `sb.auth.updateUser({ password })` fonctionne directement) :
 *
 *  1. Flux récupération : lien reçu par email (resetPasswordForEmail, déclenché
 *     soit par le moniteur via l'edge function `eleve-recovery`, soit plus tard
 *     par un "mot de passe oublié"). Le `redirectTo` pointe sur `…/#/nouveau-mdp`.
 *     Au retour, `detectSessionInUrl` établit la session (PKCE), puis le routeur
 *     lit le hash `#/nouveau-mdp` et monte cette page.
 *  2. Manuelle : Réglages → Mot de passe → "Modifier" → navigate('#/nouveau-mdp').
 *
 * Aucun mot de passe transite par le moniteur : l'élève le choisit lui-même ici.
 */
import { sb } from "@/auth/auth.js";
import { toast } from "@/components/common/toast.js";
import { icon } from "@/utils/icons.js";
import { esc, escAttr } from "@/utils/escape.js";
import { getLang } from "@/utils/lang.js";

const MIN_LEN = 8;

const ICON_LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;

const I18N = {
  fr: {
    title: "Nouveau mot de passe",
    subtitle:
      "Choisis un mot de passe pour sécuriser ton compte. C'est lui que tu utiliseras pour te connecter.",
    new_password: "Nouveau mot de passe",
    show_password: "Afficher le mot de passe",
    hide_password: "Masquer le mot de passe",
    min_chars: "{n} caractères minimum",
    confirm: "Confirmer",
    save: "Enregistrer",
    later: "Plus tard",
    session_expired: "Lien expiré. Reconnecte-toi",
    err_generic: "Une erreur est survenue. Réessaie.",
    err_min: "Le mot de passe doit contenir au moins {n} caractères.",
    err_mismatch: "Les deux mots de passe ne correspondent pas.",
    success: "Mot de passe mis à jour ✓",
    auth_password_short:
      "Le mot de passe doit contenir au moins 8 caractères.",
    auth_password_same: "Choisis un mot de passe différent de l'ancien.",
    auth_session_missing: "Lien expiré. Reconnecte-toi.",
  },
  en: {
    title: "New password",
    subtitle:
      "Choose a password to secure your account. You'll use it to log in.",
    new_password: "New password",
    show_password: "Show password",
    hide_password: "Hide password",
    min_chars: "{n} characters minimum",
    confirm: "Confirm",
    save: "Save",
    later: "Later",
    session_expired: "Link expired. Log in again",
    err_generic: "Something went wrong. Try again.",
    err_min: "Password must be at least {n} characters.",
    err_mismatch: "The two passwords don't match.",
    success: "Password updated ✓",
    auth_password_short: "Password must be at least 8 characters.",
    auth_password_same: "Choose a password different from your old one.",
    auth_session_missing: "Link expired. Log in again.",
  },
  ar: {
    title: "كلمة مرور جديدة",
    subtitle:
      "اختر كلمة مرور لتأمين حسابك. ستستخدمها لتسجيل الدخول.",
    new_password: "كلمة المرور الجديدة",
    show_password: "إظهار كلمة المرور",
    hide_password: "إخفاء كلمة المرور",
    min_chars: "{n} أحرف على الأقل",
    confirm: "تأكيد",
    save: "حفظ",
    later: "لاحقًا",
    session_expired: "انتهت صلاحية الرابط. سجّل الدخول مجددًا",
    err_generic: "حدث خطأ. حاول مجددًا.",
    err_min: "يجب أن تتكون كلمة المرور من {n} أحرف على الأقل.",
    err_mismatch: "كلمتا المرور غير متطابقتين.",
    success: "تم تحديث كلمة المرور ✓",
    auth_password_short:
      "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    auth_password_same: "اختر كلمة مرور مختلفة عن القديمة.",
    auth_session_missing: "انتهت صلاحية الرابط. سجّل الدخول مجددًا.",
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
  "Password should be at least": "auth_password_short",
  "New password should be different from the old password":
    "auth_password_same",
  "should be different": "auth_password_same",
  "Auth session missing": "auth_session_missing",
};

function translateErr(msg) {
  if (!msg) return t("err_generic", "Une erreur est survenue. Réessaie.");
  for (const [source, key] of Object.entries(AUTH_ERROR_KEYS)) {
    if (msg.includes(source)) return t(key, I18N.fr[key]);
  }
  return msg;
}

export async function mount(root) {
  // Sécurité : il faut une session active pour changer le mot de passe.
  let session = null;
  try {
    const { data } = (await sb?.auth.getSession()) || {};
    session = data?.session || null;
  } catch {
    session = null;
  }
  if (!session) {
    toast(t("session_expired", "Lien expiré. Reconnecte-toi"), "error");
    window.location.href = window.location.origin + "/#/login";
    return;
  }

  root.innerHTML = template();
  wire(root);
}

function template() {
  return `
    <style>
      .np-root{position:fixed;inset:0;overflow:auto;overscroll-behavior:contain;background:var(--ink);display:flex;align-items:center;justify-content:center;padding:calc(24px + env(safe-area-inset-top,0px)) calc(16px + env(safe-area-inset-right,0px)) calc(24px + env(safe-area-inset-bottom,0px)) calc(16px + env(safe-area-inset-left,0px));font-family:var(--fb);z-index:50}
      .np-bg{position:absolute;inset:0;z-index:0;pointer-events:none}
      .np-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,var(--a) 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,var(--pu) 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,var(--blk) 0%,transparent 40%);filter:blur(60px);opacity:.45;animation:np-float 22s ease-in-out infinite alternate}
      @keyframes np-float{0%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(40px,-30px) rotate(180deg) scale(1.08)}100%{transform:translate(-30px,40px) rotate(360deg) scale(.96)}}
      .np-content{position:relative;z-index:2;width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center;margin:auto}
      .np-badge{width:64px;height:64px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,var(--a-lt),var(--a) 55%,var(--adk));box-shadow:0 16px 40px -12px color-mix(in srgb, var(--a) 70%, transparent),0 1.5px 0 rgba(255,255,255,.3) inset;margin-bottom:18px;animation:np-in .6s cubic-bezier(.2,.7,.3,1) .05s both}
      .np-badge svg{width:30px;height:30px;color:var(--a-ink)}
      @keyframes np-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      .np-card{width:100%;background:rgba(255,255,255,.06);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:26px 24px;box-shadow:0 30px 80px -20px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.04) inset;animation:np-in .5s cubic-bezier(.2,.7,.3,1) .12s both;display:flex;flex-direction:column;gap:16px;color:#fff}
      .np-card h2{font-family:var(--fd);font-weight:900;font-size:21px;letter-spacing:-.02em;margin:0;text-align:center}
      .np-sub{font-size:13px;color:rgba(255,255,255,.62);text-align:center;margin:-8px 0 4px;line-height:1.5}
      .np-field{display:flex;flex-direction:column;gap:6px}
      .np-field label{font-size:10.5px;font-weight:800;color:rgba(255,255,255,.78);letter-spacing:1.2px;text-transform:uppercase}
      .np-wrap{display:flex;align-items:center;gap:10px;height:48px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);transition:border-color .15s,background .15s,box-shadow .15s}
      .np-wrap:focus-within{border-color:var(--al3);background:rgba(255,255,255,.08);box-shadow:0 0 0 3px color-mix(in srgb, var(--a) 18%, transparent)}
      .np-wrap svg{width:18px;height:18px;color:rgba(255,255,255,.5);flex-shrink:0}
      .np-wrap input{flex:1;align-self:stretch;background:transparent;border:0;outline:0;color:#fff;font-size:16px;font-family:inherit;min-width:0}
      .np-wrap input::placeholder{color:rgba(255,255,255,.35)}
      .np-eye{background:transparent;border:0;color:rgba(255,255,255,.5);cursor:pointer;padding:13px;margin:-9px;line-height:1;border-radius:6px}
      .np-eye:hover{background:rgba(255,255,255,.06);color:#fff}
      .np-hint{font-size:11.5px;color:rgba(255,255,255,.45);margin:-2px 0 0;font-weight:500}
      .np-cta{width:100%;height:50px;border-radius:12px;border:0;background:linear-gradient(to bottom,var(--a-lt) 0%,var(--a) 48%,var(--adk) 100%);color:var(--a-ink);font-family:var(--fd);font-weight:800;font-size:15px;letter-spacing:.01em;cursor:pointer;transition:transform .12s,box-shadow .12s;box-shadow:0 12px 32px -10px color-mix(in srgb, var(--a) 65%, transparent),0 1.5px 0 0 rgba(255,255,255,.28) inset}
      .np-cta:hover{transform:translateY(-1px)}
      .np-cta:disabled{opacity:.6;cursor:wait;transform:none}
      .np-err{color:#fda4af;font-size:12.5px;margin:0;min-height:18px;text-align:center;font-weight:600}
      .np-later{background:transparent;border:0;color:rgba(255,255,255,.5);font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;text-decoration:underline;text-underline-offset:2px;padding:14px;margin:-6px auto -4px}
      .np-later:hover{color:rgba(255,255,255,.8)}
    </style>

    <div class="np-root">
      <div class="np-bg"></div>
      <div class="np-content">
        <div class="np-badge">${ICON_LOCK}</div>
        <div class="np-card">
          <h2>${text("title", "Nouveau mot de passe")}</h2>
          <p class="np-sub">${text("subtitle", "Choisis un mot de passe pour sécuriser ton compte. C'est lui que tu utiliseras pour te connecter.")}</p>

          <form id="np-form" novalidate>
            <div class="np-field">
              <label for="np-pwd">${text("new_password", "Nouveau mot de passe")}</label>
              <div class="np-wrap">
                ${ICON_LOCK}
                <input id="np-pwd" type="password" autocomplete="new-password" minlength="${MIN_LEN}" placeholder="••••••••">
                <button type="button" class="np-eye" id="np-eye-1" aria-label="${attr("show_password", "Afficher le mot de passe")}">${icon("eye", { size: 18 })}</button>
              </div>
              <p class="np-hint">${text("min_chars", `${MIN_LEN} caractères minimum`).replace("{n}", String(MIN_LEN))}</p>
            </div>

            <div class="np-field" style="margin-top:14px">
              <label for="np-confirm">${text("confirm", "Confirmer")}</label>
              <div class="np-wrap">
                ${ICON_LOCK}
                <input id="np-confirm" type="password" autocomplete="new-password" placeholder="••••••••">
                <button type="button" class="np-eye" id="np-eye-2" aria-label="${attr("show_password", "Afficher le mot de passe")}">${icon("eye", { size: 18 })}</button>
              </div>
            </div>

            <button type="submit" class="np-cta" id="np-submit" style="margin-top:18px">${text("save", "Enregistrer")}</button>
            <p class="np-err" id="np-err"></p>
          </form>

          <button type="button" class="np-later" id="np-later">${text("later", "Plus tard")}</button>
        </div>
      </div>
    </div>
  `;
}

function wire(root) {
  const form = root.querySelector("#np-form");
  const pwd = root.querySelector("#np-pwd");
  const confirm = root.querySelector("#np-confirm");
  const submit = root.querySelector("#np-submit");
  const errEl = root.querySelector("#np-err");

  // Show/hide toggles
  for (const [btnId, input] of [
    ["#np-eye-1", pwd],
    ["#np-eye-2", confirm],
  ]) {
    const btn = root.querySelector(btnId);
    btn?.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      btn.innerHTML =
        input.type === "password"
          ? icon("eye", { size: 18 })
          : icon("eye-off", { size: 18 });
      btn.setAttribute(
        "aria-label",
        input.type === "password"
          ? t("show_password", "Afficher le mot de passe")
          : t("hide_password", "Masquer le mot de passe"),
      );
    });
  }

  root.querySelector("#np-later")?.addEventListener("click", () => {
    window.location.href = window.location.origin + "/";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.textContent = "";

    const p1 = pwd.value;
    const p2 = confirm.value;
    if (p1.length < MIN_LEN) {
      errEl.textContent = t(
        "err_min",
        `Le mot de passe doit contenir au moins ${MIN_LEN} caractères.`,
      ).replace("{n}", String(MIN_LEN));
      pwd.focus();
      return;
    }
    if (p1 !== p2) {
      errEl.textContent = t(
        "err_mismatch",
        "Les deux mots de passe ne correspondent pas.",
      );
      confirm.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = "…";
    try {
      const { error } = await sb.auth.updateUser({ password: p1 });
      if (error) {
        errEl.textContent = translateErr(error.message);
        submit.disabled = false;
        submit.textContent = t("save", "Enregistrer");
        return;
      }
      toast(t("success", "Mot de passe mis à jour ✓"), "success", 3000);
      // Reload propre vers l'accueil : repart sur une session saine, sans le
      // hash/params de récupération (évite tout re-déclenchement au reload).
      setTimeout(() => {
        window.location.href = window.location.origin + "/";
      }, 600);
    } catch (err) {
      errEl.textContent = translateErr(err?.message);
      submit.disabled = false;
      submit.textContent = t("save", "Enregistrer");
    }
  });
}
