// ═══════════════════════════════════════════════════════════════
// Page publique — Inscription élève SELF-SERVE via CODE moniteur
// URL : #/rejoindre  (ou #/rejoindre?code=RAYAN1 pour pré-remplir)
//
// Chemin BIS au lien d'invitation : l'élève crée son compte avec SON propre
// email et tape le code de son moniteur (ex : "RAYAN1"). Le moniteur ne
// manipule jamais l'email de l'élève (cf. règle non-négociable #1).
//
// Flow :
//   1. Code (pré-rempli depuis l'URL) → get_join_code_info aperçoit l'école.
//   2. Formulaire élève (email perso + prénom + nom + usertag + naissance + mdp).
//   3. Submit : sb.auth.signUp() → join_moniteur_by_code(code)
//      → set_eleve_signup_profile() → consentement parental si mineur.
//   4. Redirige vers l'accueil élève.
//
// ⚠️ Dépend de la migration 20260621120000_join_code.sql (RPC à appliquer).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { playLaunch } from "@/utils/sound.js";

const STYLE = `<style>
  .sg {
    min-height: 100dvh;
    background: linear-gradient(180deg, var(--su2) 0%, #fff 100%);
    padding: 32px 20px max(60px, env(safe-area-inset-bottom));
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .sg-card {
    width: 100%; max-width: 420px;
    background: var(--su); border: 1px solid var(--bo);
    border-radius: 24px; padding: 28px 24px;
    box-shadow: 0 4px 24px rgba(10,13,26,.06);
    animation: sgIn .35s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes sgIn { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .sg-logo {
    width: 56px; height: 56px;
    background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
    border-radius: 16px; margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    color: var(--a-ink); font: 800 22px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.02em;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--a) 30%, transparent), 0 1.5px 0 0 rgba(255,255,255,.3) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
  }
  .sg-title { font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); text-align: center; margin: 0 0 6px; letter-spacing: -.022em; }
  .sg-sub { font: 500 14px/1.5 'Inter', sans-serif; color: var(--mu); text-align: center; margin: 0 0 22px; }
  .sg-role-badge {
    display: inline-block; margin: 0 0 18px; padding: 5px 12px;
    background: color-mix(in srgb, var(--a) 12%, transparent); color: var(--adk);
    border-radius: 99px; font: 700 11px/1 'Inter', sans-serif; text-transform: uppercase; letter-spacing: .08em;
  }
  .sg-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .sg-label { font: 600 11px/1 'Inter', sans-serif; color: var(--mu); letter-spacing: .08em; text-transform: uppercase; }
  .sg-input {
    padding: 14px 16px; border: 1.5px solid var(--bo); border-radius: 14px;
    font: 500 15px/1.3 'Inter', sans-serif; color: var(--ink); background: var(--su);
    transition: border-color .15s ease, box-shadow .15s ease; font-family: inherit;
  }
  .sg-input:hover:not(:focus):not([readonly]) { border-color: var(--bo4); }
  .sg-input:focus { outline: 0; border-color: var(--a); box-shadow: 0 0 0 4px color-mix(in srgb, var(--a) 12%, transparent); }
  .sg-input.error { border-color: var(--rd); }
  .sg-help { font: 500 11px/1.4 'Inter', sans-serif; color: var(--mu2); margin-top: 2px; }
  .sg-help.error { color: var(--rd-txt); }
  .sg-help.ok { color: var(--adk); }
  .sg-italic { font: italic 500 12px/1.45 'Inter', sans-serif; color: var(--mu2); margin-top: 4px; }

  /* Champ code — gros, majuscules, espacé */
  .sg-code-input {
    text-align: center; letter-spacing: .14em; text-transform: uppercase;
    font: 800 19px/1.2 'IBM Plex Mono', monospace !important;
  }
  /* Bandeau aperçu "tu rejoins …" */
  .sg-join {
    display: none; align-items: center; gap: 10px;
    margin: 0 0 20px; padding: 12px 14px; border-radius: 14px;
    background: color-mix(in srgb, var(--grd) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--grd) 24%, transparent);
    animation: sgIn .3s cubic-bezier(.34,1.56,.64,1);
  }
  .sg-join.show { display: flex; }
  .sg-join.err { background: color-mix(in srgb, var(--rd) 8%, transparent); border-color: color-mix(in srgb, var(--rd) 22%, transparent); }
  .sg-join-ico { flex-shrink: 0; color: var(--grd); display: flex; }
  .sg-join.err .sg-join-ico { color: var(--rd-txt); }
  .sg-join-txt { font: 600 13px/1.4 'Inter', sans-serif; color: var(--ink); }
  .sg-join-txt strong { color: var(--adk); }
  .sg-join.err .sg-join-txt { color: var(--rd-txt); }

  .sg-btn {
    width: 100%; margin-top: 18px; padding: 16px; color: var(--a-ink); border: 0; border-radius: 14px;
    font: 800 15px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
    background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--a) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
    transition: transform .12s, box-shadow .15s, filter .15s; font-family: inherit;
  }
  .sg-btn:hover:not(:disabled) { filter: brightness(1.04); }
  .sg-btn:active { transform: scale(.97); }
  .sg-btn:disabled { opacity: .4; cursor: default; box-shadow: none; filter: grayscale(.15); }

  .sg-pwd-wrap { position: relative; }
  .sg-pwd-wrap .sg-input { width: 100%; box-sizing: border-box; padding-right: 46px; }
  .sg-pwd-toggle {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    width: 36px; height: 36px; border: 0; background: none; cursor: pointer;
    color: var(--mu2); display: flex; align-items: center; justify-content: center;
    border-radius: 8px; -webkit-tap-highlight-color: transparent;
  }
  .sg-pwd-toggle:hover { color: var(--ink); background: var(--bg2); }
  .sg-sep { height: 1px; background: var(--bo2); margin: 22px 0 0; }
  .sg-login-row { text-align: center; margin-top: 16px; font: 500 13px/1.4 'Inter', sans-serif; color: var(--mu); }
  .sg-login-row a { color: var(--a); font-weight: 700; text-decoration: none; }
  .sg-login-row a:hover { text-decoration: underline; }
  .sg-card { box-sizing: border-box; }
</style>`;

export async function mount(root) {
  track("signup.viewed", { from: "join_code" });

  // Pré-remplissage éventuel du code : #/rejoindre?code=RAYAN1
  const hash = location.hash;
  const qIdx = hash.indexOf("?");
  const params = new URLSearchParams(qIdx >= 0 ? hash.slice(qIdx + 1) : "");
  const prefillCode = (params.get("code") || "").trim();

  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-card">
        <div class="sg-logo">P</div>
        <h1 class="sg-title">Rejoins ton moniteur</h1>
        <p class="sg-sub">Entre le code que ton moniteur t'a donné, puis crée ton compte.</p>
        <div style="text-align:center"><span class="sg-role-badge">Élève</span></div>

        <div class="sg-row">
          <label class="sg-label" for="sg-code">Code moniteur</label>
          <input class="sg-input sg-code-input" id="sg-code" type="text" autocomplete="off"
            autocorrect="off" autocapitalize="characters" spellcheck="false"
            maxlength="16" placeholder="RAYAN1" value="${esc(prefillCode)}" />
          <div class="sg-help" id="sg-code-help">Demande-le à ton moniteur.</div>
        </div>

        <div class="sg-join" id="sg-join">
          <span class="sg-join-ico" id="sg-join-ico">${icon("check-circle", { size: 20, strokeWidth: 2 })}</span>
          <span class="sg-join-txt" id="sg-join-txt"></span>
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-email">Ton email</label>
          <input class="sg-input" id="sg-email" type="email" autocomplete="email" autocapitalize="off" placeholder="toi@exemple.fr" />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-prenom">Prénom</label>
          <input class="sg-input" id="sg-prenom" type="text" autocomplete="given-name" placeholder="Ton prénom" />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-nom">Nom</label>
          <input class="sg-input" id="sg-nom" type="text" autocomplete="family-name" placeholder="Ton nom" />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-usertag">Identifiant</label>
          <input class="sg-input" id="sg-usertag" type="text" autocomplete="off" autocapitalize="off" placeholder="Ex : maxdu13" />
          <div class="sg-help" id="sg-usertag-help">3 caractères minimum.</div>
          <div class="sg-italic">Ton pseudo unique. C'est ce que les autres élèves voient dans le classement.</div>
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-naissance">Date de naissance</label>
          <input class="sg-input" id="sg-naissance" type="date" />
        </div>

        <div class="sg-row" id="sg-parent-block" style="display:none">
          <label class="sg-label" for="sg-parent-email">Email d'un parent</label>
          <input class="sg-input" id="sg-parent-email" type="email" autocomplete="email" placeholder="parent@exemple.fr" />
          <div class="sg-italic">Tu as moins de 15 ans : on doit recueillir l'accord de ton parent ou tuteur légal. Un lien de validation lui sera transmis.</div>
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-password">Mot de passe</label>
          <div class="sg-pwd-wrap">
            <input class="sg-input" id="sg-password" type="password" autocomplete="new-password" minlength="8" placeholder="8 caractères minimum" />
            <button class="sg-pwd-toggle" id="sg-pwd-toggle" type="button" aria-label="Afficher le mot de passe" aria-pressed="false">${icon("eye", { size: 18, strokeWidth: 2 })}</button>
          </div>
          <div class="sg-help" id="sg-pwd-help">Minimum 8 caractères.</div>
        </div>

        <button class="sg-btn" id="sg-submit" disabled>Créer mon compte</button>
        <div class="sg-sep"></div>
        <div class="sg-login-row">Déjà un compte&nbsp;? <a href="/#/login">Se connecter</a></div>
      </div>
    </div>
  `;

  const codeEl = root.querySelector("#sg-code");
  const codeHelp = root.querySelector("#sg-code-help");
  const joinBox = root.querySelector("#sg-join");
  const joinIco = root.querySelector("#sg-join-ico");
  const joinTxt = root.querySelector("#sg-join-txt");
  const emailEl = root.querySelector("#sg-email");
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

  const pwdToggle = root.querySelector("#sg-pwd-toggle");
  pwdToggle?.addEventListener("click", () => {
    const show = pwdEl.type === "password";
    pwdEl.type = show ? "text" : "password";
    pwdToggle.setAttribute("aria-pressed", String(show));
    pwdToggle.setAttribute(
      "aria-label",
      show ? "Masquer le mot de passe" : "Afficher le mot de passe",
    );
    pwdToggle.innerHTML = icon(show ? "eye-off" : "eye", {
      size: 18,
      strokeWidth: 2,
    });
    pwdEl.focus();
  });

  const emailValid = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim());
  const normCode = (v) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  let codeValid = false; // résolu par get_join_code_info
  let codeChecking = false;
  let codeTimer = null;
  let usertagAvailable = false;
  let usertagChecking = false;
  let checkTimer = null;
  let accountCreated = false; // permet de retenter sans recréer le compte

  const validate = () => {
    const codeOk = codeValid && !codeChecking;
    const emailOk = emailValid(emailEl.value);
    const prenomOk = prenomEl.value.trim().length >= 2;
    const nomOk = nomEl.value.trim().length >= 1;
    const tagOk =
      usertagEl.value.trim().length >= 3 &&
      usertagAvailable &&
      !usertagChecking;
    const dateOk = !!naissanceEl.value;
    const minor = isMinorDate(naissanceEl.value);
    const parentOk =
      !minor ||
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((parentEmailEl?.value || "").trim());
    const pwdOk = pwdEl.value.length >= 8;
    submitBtn.disabled = !(
      codeOk &&
      emailOk &&
      prenomOk &&
      nomOk &&
      tagOk &&
      dateOk &&
      parentOk &&
      pwdOk
    );

    if (pwdEl.value && !pwdOk) {
      pwdEl.classList.add("error");
      pwdHelp.classList.add("error");
      pwdHelp.textContent = "Trop court (minimum 8 caractères).";
    } else {
      pwdEl.classList.remove("error");
      pwdHelp.classList.remove("error");
      pwdHelp.textContent = "Minimum 8 caractères.";
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
      codeHelp.textContent = "Demande-le à ton moniteur.";
      validate();
      return;
    }
    codeChecking = true;
    codeHelp.className = "sg-help";
    codeHelp.textContent = "Vérification…";
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
          codeHelp.textContent =
            "✗ Code introuvable. Revérifie auprès de ton moniteur.";
          joinBox.classList.add("show", "err");
          joinIco.innerHTML = icon("alert-circle", {
            size: 20,
            strokeWidth: 2,
          });
          joinTxt.textContent = "Aucun moniteur ne correspond à ce code.";
        } else {
          codeValid = true;
          codeHelp.className = "sg-help ok";
          codeHelp.textContent = "✓ Code valide";
          joinBox.classList.add("show");
          joinBox.classList.remove("err");
          joinIco.innerHTML = icon("check-circle", {
            size: 20,
            strokeWidth: 2,
          });
          const ecole = info.ecole_nom || "ton auto-école";
          const prenom = info.moniteur_prenom
            ? ` avec ${esc(info.moniteur_prenom)}`
            : "";
          joinTxt.innerHTML = `Tu rejoins <strong>${esc(ecole)}</strong>${prenom}.`;
        }
      } catch {
        codeChecking = false;
        codeValid = false;
        codeHelp.className = "sg-help error";
        codeHelp.textContent = "Vérification impossible, réessaie.";
      }
      validate();
    }, 400);
  };

  // Disponibilité du usertag (debounce 450ms) — is_username_available
  const checkUsertag = () => {
    const v = usertagEl.value.trim();
    usertagAvailable = false;
    if (v.length < 3) {
      usertagChecking = false;
      usertagHelp.className = "sg-help";
      usertagHelp.textContent = "3 caractères minimum.";
      validate();
      return;
    }
    usertagChecking = true;
    usertagHelp.className = "sg-help";
    usertagHelp.textContent = "Vérification…";
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
          usertagHelp.textContent = "Vérification impossible, réessaie.";
        } else if (data === true) {
          usertagAvailable = true;
          usertagHelp.className = "sg-help ok";
          usertagHelp.textContent = "✓ Disponible";
        } else {
          usertagAvailable = false;
          usertagHelp.className = "sg-help error";
          usertagHelp.textContent = "✗ Déjà pris, choisis-en un autre";
        }
      } catch {
        usertagChecking = false;
        usertagAvailable = false;
      }
      validate();
    }, 450);
  };

  const updateMinor = () => {
    if (!parentBlock) return;
    parentBlock.style.display = isMinorDate(naissanceEl.value) ? "" : "none";
  };

  codeEl.addEventListener("input", checkCode);
  emailEl.addEventListener("input", validate);
  prenomEl.addEventListener("input", validate);
  nomEl.addEventListener("input", validate);
  usertagEl.addEventListener("input", checkUsertag);
  naissanceEl.addEventListener("input", () => {
    updateMinor();
    validate();
  });
  parentEmailEl?.addEventListener("input", validate);
  pwdEl.addEventListener("input", validate);

  // Si un code est pré-rempli via l'URL, on le vérifie immédiatement
  if (prefillCode) checkCode();

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "Création…";
    const { toast } = await import("@/components/common/toast.js");
    const email = emailEl.value.trim().toLowerCase();
    const code = normCode(codeEl.value);

    try {
      if (!accountCreated) {
        // 1. Sign up — le trigger handle_new_user_signup crée un profil "nu" élève
        const { error: authErr } = await sb.auth.signUp({
          email,
          password: pwdEl.value,
          options: { data: { prenom: prenomEl.value.trim(), role: "eleve" } },
        });
        if (authErr) throw authErr;

        // 2. Rattache au moniteur via son code
        const { error: joinErr } = await sb.rpc("join_moniteur_by_code", {
          p_code: code,
        });
        if (joinErr) {
          if (/invalid_code/i.test(joinErr.message || "")) {
            toast("Code moniteur invalide — revérifie-le.", "error", 4000);
            codeValid = false;
            codeHelp.className = "sg-help error";
            codeHelp.textContent = "✗ Code introuvable.";
            submitBtn.textContent = "Créer mon compte";
            validate();
            return;
          }
          if (/already_has_school/i.test(joinErr.message || "")) {
            toast(
              "Ce compte est déjà rattaché à un moniteur. Connecte-toi.",
              "error",
              4500,
            );
            submitBtn.textContent = "Créer mon compte";
            return;
          }
          throw joinErr;
        }
        accountCreated = true;
      }

      // 3. Pose usertag / nom / date de naissance (+ email parent si mineur)
      let consentToken = null;
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
          usertagHelp.textContent =
            "✗ Ce usertag vient d'être pris, choisis-en un autre";
          toast(
            "Ce usertag est déjà pris, change-le puis réessaie",
            "error",
            4000,
          );
          submitBtn.textContent = "Créer mon compte";
          validate();
          return;
        }
        if (/parent_email_required/i.test(profErr.message || "")) {
          toast("Renseigne un email de parent valide", "error", 4000);
          submitBtn.disabled = false;
          submitBtn.textContent = "Créer mon compte";
          updateMinor();
          validate();
          return;
        }
        throw profErr;
      }
      const cr = Array.isArray(profData) ? profData[0] : profData;
      if (cr?.consent_required && cr?.consent_token)
        consentToken = cr.consent_token;

      track("signup.completed", {
        role: "eleve",
        from: "join_code",
        minor: !!consentToken,
      });
      playLaunch();

      // 3bis. Élève mineur : compte en attente du consentement parental
      if (consentToken) {
        renderConsentPending(root, consentToken);
        return;
      }

      // 4. Succès → entrée dans l'app (l'onboarding élève gère l'add-to-home)
      window.location.href = "/#";
      window.location.reload();
    } catch (e) {
      console.error("[rejoindre] failed", e);
      const msg = /already.*registered|already.*exists/i.test(e?.message || "")
        ? "Un compte existe déjà avec cet email. Connecte-toi directement."
        : e?.message || "Erreur lors de la création du compte";
      toast(msg, "error", 4500);
      submitBtn.disabled = false;
      submitBtn.textContent = "Créer mon compte";
    }
  });

  setTimeout(() => (prefillCode ? emailEl : codeEl).focus(), 100);
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
        <div style="margin-bottom:10px;color:var(--mu)">${icon("users", { size: 42 })}</div>
        <h1 class="sg-title">Presque&nbsp;! On attend l'accord de ton parent</h1>
        <p class="sg-sub">Comme tu as moins de 15 ans, un parent ou tuteur doit donner son accord avant que tu puisses utiliser PermiGo. Envoie-lui ce lien&nbsp;:</p>
        <div class="sg-row">
          <input class="sg-input" id="sg-consent-link" type="text" readonly value="${esc(link)}" />
        </div>
        <button class="sg-btn" id="sg-copy-link" type="button">${icon("copy", { size: 16 })} Copier le lien</button>
        <p class="sg-sub" style="margin-top:16px;margin-bottom:0">Tu peux le coller dans WhatsApp ou un SMS à ton parent. Dès qu'il valide, ton compte se débloque.</p>
        <a class="sg-login-row" href="/#" style="display:block;margin-top:18px">J'ai compris</a>
      </div>
    </div>`;
  const linkEl = root.querySelector("#sg-consent-link");
  root.querySelector("#sg-copy-link")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link);
      const btn = root.querySelector("#sg-copy-link");
      btn.textContent = "✓ Lien copié";
      setTimeout(() => {
        btn.innerHTML = `${icon("copy", { size: 16 })} Copier le lien`;
      }, 2000);
    } catch {
      linkEl?.select();
      const { toast } = await import("@/components/common/toast.js");
      toast("Sélectionne et copie le lien manuellement", "info", 3500);
    }
  });
}
