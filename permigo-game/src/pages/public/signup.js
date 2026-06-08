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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .sg-card {
    width: 100%;
    max-width: 420px;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 24px;
    padding: 28px 24px;
    box-shadow: 0 4px 24px rgba(10,13,26,.06);
    animation: sgIn .35s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes sgIn {
    from { opacity: 0; transform: translateY(12px) scale(.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .sg-logo {
    width: 56px; height: 56px;
    background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
    border-radius: 16px;
    margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font: 800 22px/1 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.02em;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--a) 30%, transparent), 0 1.5px 0 0 rgba(255,255,255,.3) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
  }
  .sg-title {
    font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    text-align: center;
    margin: 0 0 6px;
    letter-spacing: -.022em;
  }
  .sg-sub {
    font: 500 14px/1.5 'Inter', sans-serif;
    color: var(--mu);
    text-align: center;
    margin: 0 0 24px;
  }
  .sg-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .sg-label {
    font: 600 11px/1 'Inter', sans-serif;
    color: var(--mu);
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .sg-input {
    padding: 14px 16px;
    border: 1.5px solid var(--bo);
    border-radius: 14px;
    font: 500 15px/1.3 'Inter', sans-serif;
    color: var(--ink);
    background: var(--su);
    transition: border-color .15s ease, box-shadow .15s ease;
    font-family: inherit;
  }
  .sg-input:hover:not(:focus):not([readonly]) { border-color: var(--bo4); }
  .sg-input:focus {
    outline: 0;
    border-color: var(--a);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--a) 12%, transparent);
  }
  .sg-input[readonly] { background: var(--bg); color: var(--mu3); cursor: default; }
  .sg-input.error { border-color: var(--rd); }
  .sg-help {
    font: 500 11px/1.4 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 2px;
  }
  .sg-help.error { color: var(--rd); }
  .sg-help.ok { color: var(--adk); }
  .sg-italic {
    font: italic 500 12px/1.45 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 4px;
  }
  .sg-avail { display: inline-flex; align-items: center; gap: 5px; }
  .sg-btn {
    width: 100%;
    margin-top: 18px;
    padding: 16px;
    color: var(--a-ink);
    border: 0;
    border-radius: 14px;
    font: 800 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--a) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
    transition: transform .12s, box-shadow .15s, filter .15s;
    font-family: inherit;
  }
  .sg-btn:hover:not(:disabled) { filter: brightness(1.04); }
  .sg-btn:active { transform: scale(.97); }
  .sg-btn:disabled { opacity: .4; cursor: default; box-shadow: none; filter: grayscale(.15); }

  /* Champ mot de passe + œil */
  .sg-pwd-wrap { position: relative; }
  .sg-pwd-wrap .sg-input { width: 100%; box-sizing: border-box; padding-right: 46px; }
  .sg-pwd-toggle {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    width: 36px; height: 36px; border: 0; background: none; cursor: pointer;
    color: var(--mu2); display: flex; align-items: center; justify-content: center;
    border-radius: 8px; -webkit-tap-highlight-color: transparent;
  }
  .sg-pwd-toggle:hover { color: var(--ink); background: var(--bg2); }

  /* Séparateur fin avant le footer */
  .sg-sep { height: 1px; background: var(--bo2); margin: 22px 0 0; }

  /* Lien se connecter */
  .sg-login-row { text-align: center; margin-top: 16px; font: 500 13px/1.4 'Inter', sans-serif; color: var(--mu); }
  .sg-login-row a { color: var(--a); font-weight: 700; text-decoration: none; }
  .sg-login-row a:hover { text-decoration: underline; }
  .sg-role-badge {
    display: inline-block;
    margin: 0 0 18px;
    padding: 5px 12px;
    background: color-mix(in srgb, var(--a) 12%, transparent);
    color: var(--adk);
    border-radius: 99px;
    font: 700 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .sg-error-card {
    width: 100%;
    max-width: 420px;
    background: var(--su);
    border: 1px solid #fecaca;
    border-radius: 20px;
    padding: 28px;
    text-align: center;
  }
  .sg-error-ico { font-size: 38px; margin-bottom: 12px; }
  .sg-error-title {
    font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 8px;
    letter-spacing: -.022em;
  }
  .sg-error-msg {
    font: 500 13px/1.5 'Inter', sans-serif;
    color: var(--mu);
    margin: 0 0 18px;
  }
  .sg-link {
    color: var(--a);
    font: 600 14px/1 'Inter', sans-serif;
    text-decoration: none;
    padding: 12px 24px;
    border: 1.5px solid var(--bo);
    border-radius: 12px;
    display: inline-block;
    transition: border-color .15s, background .15s;
  }
  .sg-link:hover { border-color: var(--a); background: var(--bg2); }

  /* Skeleton */
  .sg-skel {
    width: 100%; max-width: 420px;
    height: 320px;
    background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
    background-size: 200% 100%;
    animation: sgSkel 1.4s infinite;
    border-radius: 24px;
  }
  @keyframes sgSkel { to { background-position: -200% 0; } }
</style>`;

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
      "Lien invalide",
      "Ce lien d'invitation ne contient pas de token. Vérifie l'URL ou contacte ton auto-école.",
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
      "Erreur de connexion",
      "Impossible de vérifier ton invitation. Réessaie dans quelques secondes.",
    );
    return;
  }

  if (!invitation) {
    renderError(
      root,
      "Invitation introuvable",
      "Ce lien n'existe pas ou a été supprimé.",
    );
    return;
  }
  if (invitation.accepted_at) {
    renderError(
      root,
      "Déjà activé",
      "Cette invitation a déjà été utilisée. Va directement te connecter.",
    );
    return;
  }
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    renderError(
      root,
      "Lien expiré",
      "Ce lien a dépassé sa durée de validité (7 jours). Demande à ton auto-école d'en envoyer un nouveau.",
    );
    return;
  }

  renderForm(root, invitation, token);
}

function renderForm(root, invitation, token) {
  const ecoleName = invitation?.auto_ecoles?.nom || "";
  const isEleve = invitation.role === "eleve";
  const roleLabel = invitation.role === "enseignant" ? "Enseignant" : "Élève";

  // Champs supplémentaires demandés à l'élève (stats + classement)
  const eleveFields = isEleve
    ? `
        <div class="sg-row">
          <label class="sg-label" for="sg-nom">Nom</label>
          <input class="sg-input" id="sg-nom" type="text" autocomplete="family-name" placeholder="Ton nom" />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-usertag">Usertag</label>
          <input class="sg-input" id="sg-usertag" type="text" autocomplete="off" autocapitalize="off" placeholder="Ex : maxdu13" />
          <div class="sg-help" id="sg-usertag-help">3 caractères minimum.</div>
          <div class="sg-italic">Ton pseudo pour voir ton niveau par rapport aux autres élèves dans le classement.</div>
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
  `
    : "";

  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-card">
        <div class="sg-logo">P</div>
        <h1 class="sg-title">Active ton compte</h1>
        <p class="sg-sub">
          ${ecoleName ? `Tu rejoins <strong>${esc(ecoleName)}</strong>` : "Bienvenue dans PermiGo"}
        </p>
        <div style="text-align:center"><span class="sg-role-badge">${esc(roleLabel)}</span></div>

        <div class="sg-row">
          <label class="sg-label" for="sg-email">Email</label>
          <input class="sg-input" id="sg-email" type="email" value="${esc(invitation.email)}" readonly />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-prenom">Prénom</label>
          <input class="sg-input" id="sg-prenom" type="text" autocomplete="given-name" placeholder="Ton prénom" />
        </div>

        ${eleveFields}

        <div class="sg-row">
          <label class="sg-label" for="sg-password">Mot de passe</label>
          <div class="sg-pwd-wrap">
            <input class="sg-input" id="sg-password" type="password" autocomplete="new-password" minlength="8" placeholder="8 caractères minimum" />
            <button class="sg-pwd-toggle" id="sg-pwd-toggle" type="button" aria-label="Afficher le mot de passe" aria-pressed="false">${icon("eye", { size: 18, strokeWidth: 2 })}</button>
          </div>
          <div class="sg-help" id="sg-pwd-help">Minimum 8 caractères.</div>
        </div>

        <button class="sg-btn" id="sg-submit" disabled>Activer mon compte</button>
        <div class="sg-sep"></div>
        <div class="sg-login-row">Déjà un compte&nbsp;? <a href="/#/login">Se connecter</a></div>
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

  // Afficher / masquer le mot de passe
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

  const updateMinor = () => {
    if (!parentBlock) return;
    parentBlock.style.display = isMinorDate(naissanceEl.value) ? "" : "none";
  };

  let usertagAvailable = false;
  let usertagChecking = false;
  let checkTimer = null;
  let accountCreated = false; // permet de retenter le claim sans recréer le compte

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
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((parentEmailEl?.value || "").trim());
      ok = ok && nomOk && tagOk && dateOk && parentOk;
    }
    submitBtn.disabled = !ok;
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

  // Vérif live de la disponibilité du usertag (débounce 450ms)
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

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "Activation…";
    const { toast } = await import("@/components/common/toast.js");

    try {
      if (!accountCreated) {
        // 1. Sign up — le trigger handle_new_user_signup crée le profil "nu"
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
            usertagHelp.textContent =
              "✗ Ce usertag vient d'être pris, choisis-en un autre";
            toast(
              "Ce usertag est déjà pris, change-le puis réessaie",
              "error",
              4000,
            );
            submitBtn.textContent = "Activer mon compte";
            validate();
            return;
          }
          if (/parent_email_required/i.test(profErr.message || "")) {
            toast("Renseigne un email de parent valide", "error", 4000);
            submitBtn.disabled = false;
            submitBtn.textContent = "Activer mon compte";
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
      playLaunch();

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
      const msg = /already.*registered|already.*exists/i.test(e?.message || "")
        ? "Un compte existe déjà avec cet email. Connecte-toi directement."
        : e?.message || "Erreur lors de l'activation";
      toast(msg, "error", 4500);
      submitBtn.disabled = false;
      submitBtn.textContent = "Activer mon compte";
    }
  });

  // Focus auto sur le prénom
  setTimeout(() => prenomEl.focus(), 100);
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
        <a class="sg-link" href="/#" style="margin-top:18px">J'ai compris</a>
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

function renderError(root, title, message) {
  track("signup.error", { title });
  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-error-card">
        <div class="sg-error-ico">${icon("alert-triangle", { size: 30 })}</div>
        <h1 class="sg-error-title">${esc(title)}</h1>
        <p class="sg-error-msg">${esc(message)}</p>
        <a class="sg-link" href="/#">Retour à l'accueil</a>
      </div>
    </div>`;
}
