// ═══════════════════════════════════════════════════════════════
// Page publique — Création de compte SELF-SERVE (moniteur indépendant)
// URL : #/creer-compte
//
// C'est le flow commercial #1 : un moniteur indépendant crée son compte
// + son auto-école sans invitation, puis entre dans l'app.
//
// Flow :
//   1. Formulaire : email, mot de passe (≥8), prénom, nom, nom de l'activité
//   2. sb.auth.signUp() → le trigger handle_new_user_signup crée un profil "nu"
//      (auth_id, role='enseignant', prenom) SANS auto_ecole_id ni email
//   3. RPC create_independent_moniteur(p_ecole_nom, p_nom) crée l'auto-école
//      et rattache le profil (role, auto_ecole_id, nom, email) — SECURITY DEFINER
//   4. Add-to-home (comme le flow invitation moniteur) puis entrée dans l'app
//
// ⚠️ La RPC create_independent_moniteur n'est PAS encore appliquée en prod
//    (migration 20260620160000_create_independent_moniteur.sql à relire +
//    appliquer manuellement). Tant que ce n'est pas fait, le flow échoue à
//    l'étape 3 (la RPC renvoie une erreur "function does not exist").
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";

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
    color: var(--a-ink);
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
    margin: 0 0 18px;
  }
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
  .sg-input.error { border-color: var(--rd); }
  .sg-help {
    font: 500 11px/1.4 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 2px;
  }
  .sg-help.error { color: var(--rd-txt); }
  .sg-italic {
    font: italic 500 12px/1.45 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 4px;
  }
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
  .sg-trust { display: flex; flex-wrap: wrap; gap: 8px 12px; justify-content: center; margin-top: 14px; }
  .sg-trust span {
    font: 600 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    display: inline-flex; align-items: center; gap: 4px;
  }
</style>`;

export async function mount(root) {
  track("signup.viewed", { from: "self_serve" });

  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-card">
        <div class="sg-logo">P</div>
        <h1 class="sg-title">Crée ton compte moniteur</h1>
        <p class="sg-sub">Ton app de révision à ta marque, prête en 30 secondes.</p>
        <div style="text-align:center"><span class="sg-role-badge">Moniteur indépendant</span></div>

        <div class="sg-row">
          <label class="sg-label" for="sg-prenom">Prénom</label>
          <input class="sg-input" id="sg-prenom" type="text" autocomplete="given-name" placeholder="Ton prénom" />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-nom">Nom</label>
          <input class="sg-input" id="sg-nom" type="text" autocomplete="family-name" placeholder="Ton nom" />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-ecole">Nom de ton activité / auto-école</label>
          <input class="sg-input" id="sg-ecole" type="text" autocomplete="organization" placeholder="Ex : Auto-école Permigo, Léa Conduite…" />
          <div class="sg-italic">C'est le nom que tes élèves verront. Tu pourras le changer plus tard.</div>
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-email">Email</label>
          <input class="sg-input" id="sg-email" type="email" autocomplete="email" autocapitalize="off" placeholder="toi@exemple.fr" />
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
        <div class="sg-trust">
          <span>${icon("check", { size: 13, strokeWidth: 2.5 })} Sans engagement</span>
          <span>${icon("check", { size: 13, strokeWidth: 2.5 })} Élèves illimités</span>
        </div>
        <div class="sg-sep"></div>
        <div class="sg-login-row">Déjà un compte&nbsp;? <a href="/#/login">Se connecter</a></div>
      </div>
    </div>
  `;

  const prenomEl = root.querySelector("#sg-prenom");
  const nomEl = root.querySelector("#sg-nom");
  const ecoleEl = root.querySelector("#sg-ecole");
  const emailEl = root.querySelector("#sg-email");
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

  const emailValid = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim());
  let accountCreated = false; // permet de retenter la RPC sans recréer le compte

  const validate = () => {
    const prenomOk = prenomEl.value.trim().length >= 2;
    const nomOk = nomEl.value.trim().length >= 1;
    const ecoleOk = ecoleEl.value.trim().length >= 2;
    const emailOk = emailValid(emailEl.value);
    const pwdOk = pwdEl.value.length >= 8;
    submitBtn.disabled = !(prenomOk && nomOk && ecoleOk && emailOk && pwdOk);

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

  [prenomEl, nomEl, ecoleEl, emailEl, pwdEl].forEach((el) =>
    el.addEventListener("input", validate),
  );

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "Création…";
    const { toast } = await import("@/components/common/toast.js");

    const email = emailEl.value.trim();
    const prenom = prenomEl.value.trim();
    const nom = nomEl.value.trim();
    const ecole = ecoleEl.value.trim();

    try {
      if (!accountCreated) {
        // 1. Sign up — le trigger handle_new_user_signup crée un profil "nu"
        //    (auth_id, role='enseignant', prenom) sans auto_ecole_id ni email.
        const { error: authErr } = await sb.auth.signUp({
          email,
          password: pwdEl.value,
          options: { data: { prenom, role: "enseignant" } },
        });
        if (authErr) throw authErr;
        accountCreated = true;
      }

      // 2. Crée l'auto-école + rattache le profil (role, auto_ecole_id, nom, email).
      //    SECURITY DEFINER : seul moyen de poser auto_ecole_id côté client.
      const { error: rpcErr } = await sb.rpc("create_independent_moniteur", {
        p_ecole_nom: ecole,
        p_nom: nom,
      });
      if (rpcErr) throw rpcErr;

      track("signup.completed", { role: "enseignant", from: "self_serve" });

      // 3. Succès → add-to-home (comme le flow invitation moniteur) puis entrée app.
      const goToApp = () => {
        window.location.href = "/#";
        window.location.reload();
      };
      const { renderAddToHome } =
        await import("@/components/common/add-to-home.js");
      renderAddToHome(root, { onDone: goToApp });
    } catch (e) {
      console.error("[creer-compte] failed", e);
      let msg;
      if (
        /already.*registered|already.*exists|user.*exists/i.test(
          e?.message || "",
        )
      ) {
        msg = "Un compte existe déjà avec cet email. Connecte-toi directement.";
      } else if (/already_has_school|already.*ecole/i.test(e?.message || "")) {
        msg = "Ton compte est déjà rattaché à une auto-école. Connecte-toi.";
      } else {
        msg = e?.message || "Erreur lors de la création du compte";
      }
      toast(msg, "error", 4500);
      submitBtn.disabled = false;
      submitBtn.textContent = "Créer mon compte";
    }
  });

  setTimeout(() => prenomEl.focus(), 100);
}
