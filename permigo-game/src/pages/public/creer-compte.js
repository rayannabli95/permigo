// ═══════════════════════════════════════════════════════════════
// Page publique — Création de compte SELF-SERVE (moniteur indépendant)
// URL : #/creer-compte
//
// C'est le flow commercial #1 : un moniteur indépendant crée son compte
// + son auto-école sans invitation, puis entre dans l'app.
//
// Flow (vérifié bout en bout en prod le 2026-07-15) :
//   1. Formulaire : email, mot de passe (≥8), prénom, nom, nom de l'activité
//   2. sb.auth.signUp() → le trigger handle_new_user_signup crée un profil "nu"
//      (auth_id, role='eleve', prenom) SANS auto_ecole_id ni email — le rôle
//      client n'est jamais lu (fix escalade de rôle, audit RLS 2026-07)
//   3. RPC create_independent_moniteur(p_ecole_nom, p_nom) — SECURITY DEFINER —
//      crée l'auto-école et promeut le profil (role='enseignant', auto_ecole_id,
//      nom, email)
//   4. Add-to-home (comme le flow invitation moniteur) puis entrée dans l'app
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { icon } from "@/utils/icons.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";

const STYLE = `<style>
  /* DA « Arène 3D » (nuit-violet + plastique 3D) — cohérence avec le login */
  .sg {
    position: relative;
    min-height: 100dvh;
    padding: 32px 18px max(60px, calc(24px + env(safe-area-inset-bottom)));
    font-family: 'Baloo 2', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* Jetons DA (scopés) */
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
    font: 800 24px/1.15 'Baloo 2', var(--fb), sans-serif;
    color: var(--sg-ink);
    text-align: center;
    margin: 6px 0 4px;
    text-shadow: 0 2px 0 rgba(0,0,0,.35);
  }
  .sg-sub {
    font: 600 14.5px/1.5 'Baloo 2', var(--fb), sans-serif;
    color: var(--ink-soft);
    text-align: center;
    margin: 0 0 18px;
  }
  /* Badge rôle = pastille dorée plastique */
  .sg-role-badge {
    display: inline-block;
    margin: 0 0 18px;
    padding: 6px 14px;
    background: linear-gradient(180deg, var(--gold), var(--gold-dp));
    color: #3a2600;
    border-radius: 99px;
    font: 800 11px/1 'Baloo 2', var(--fb), sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    box-shadow: inset 0 1px 1px rgba(255,255,255,.6), 0 3px 8px rgba(0,0,0,.35);
  }
  .sg-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .sg-label {
    font: 700 13px/1 'Baloo 2', var(--fb), sans-serif;
    color: var(--ink-soft);
    letter-spacing: .04em;
    text-transform: uppercase;
    margin-left: 4px;
  }
  /* Champ = coque sombre + ring or au focus (comme .lg-shell) */
  .sg-input {
    padding: 0 16px;
    height: 52px;
    border: 0;
    border-radius: 15px;
    font: 600 16px/1.3 'Baloo 2', var(--fb), sans-serif;
    color: var(--sg-ink);
    background: var(--field);
    box-shadow: inset 0 2px 5px rgba(0,0,0,.5), inset 0 0 0 1.5px var(--field-line);
    transition: box-shadow .15s ease;
    font-family: inherit;
  }
  .sg-input::placeholder { color: #9b93cf; font-weight: 500; }
  .sg-input:focus {
    outline: 0;
    box-shadow: inset 0 2px 5px rgba(0,0,0,.4), inset 0 0 0 2px var(--focus), 0 0 0 4px rgba(255,216,77,.35);
  }
  .sg-input.error { box-shadow: inset 0 2px 5px rgba(0,0,0,.5), inset 0 0 0 2px #ff8d8d; }
  .sg-help {
    font: 600 11.5px/1.4 'Baloo 2', var(--fb), sans-serif;
    color: var(--ink-mu);
    margin-top: 2px;
    margin-left: 4px;
  }
  .sg-help.error { color: #ffb3b3; }
  .sg-italic {
    font: italic 500 12px/1.45 'Baloo 2', var(--fb), sans-serif;
    color: var(--ink-mu);
    margin-top: 4px;
    margin-left: 4px;
  }
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
    font: 800 18px/1 'Baloo 2', var(--fb), sans-serif;
    letter-spacing: .2px;
    cursor: pointer;
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

  /* Champ mot de passe + œil */
  .sg-pwd-wrap { position: relative; }
  .sg-pwd-wrap .sg-input { width: 100%; box-sizing: border-box; padding-right: 50px; }
  .sg-pwd-toggle {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    width: 40px; height: 40px; border: 0; background: none; cursor: pointer;
    color: #b7afe8; display: flex; align-items: center; justify-content: center;
    border-radius: 10px; -webkit-tap-highlight-color: transparent;
  }
  .sg-pwd-toggle:hover { color: var(--sg-ink); }
  .sg-pwd-toggle:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }

  /* Séparateur fin avant le footer */
  .sg-sep { height: 2px; border-radius: 2px; margin: 22px 0 0;
    background: linear-gradient(90deg, transparent, rgba(124,111,224,.4), transparent); }

  /* Lien se connecter */
  .sg-login-row { text-align: center; margin-top: 16px; font: 600 13.5px/1.4 'Baloo 2', var(--fb), sans-serif; color: var(--ink-soft); }
  .sg-login-row a { color: var(--gold); font-weight: 800; text-decoration: underline; text-underline-offset: 2px; }
  .sg-login-row a:hover { color: #ffe39a; }
  .sg-login-row a:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 6px; }
  .sg-trust { display: flex; flex-wrap: wrap; gap: 8px 14px; justify-content: center; margin-top: 14px; }
  .sg-trust span {
    font: 700 11.5px/1 'Baloo 2', var(--fb), sans-serif;
    color: var(--ink-soft);
    display: inline-flex; align-items: center; gap: 5px;
  }
  .sg-trust span svg { color: var(--go); }

  /* A11y : mouvement réduit / contrastes forcés */
  @media (prefers-reduced-motion: reduce) {
    .sg-card { animation: none; }
    .sg-logo::before { animation: none; transform: scale(1); opacity: .7; }
  }
  @media (forced-colors: active) {
    .sg-card { border: 1px solid CanvasText; }
    .sg-input { border: 1px solid CanvasText; box-shadow: none; }
    .sg-btn { border: 2px solid ButtonText; box-shadow: none; }
    .sg :focus-visible { outline: 2px solid Highlight !important; }
    .sg-logo img { filter: none; }
  }
</style>`;

export async function mount(root) {
  track("signup.viewed", { from: "self_serve" });

  // Session déjà active (compte test resté connecté, tél partagé…) : on
  // prévient au lieu de laisser croire que le circuit est cassé.
  const connected = getCurUser();
  const connectedBanner = connected
    ? `<div id="sg-connected" style="display:flex;align-items:center;gap:10px;margin:0 0 18px;padding:12px 14px;border-radius:14px;background:rgba(255,206,77,.12);box-shadow:inset 0 0 0 1.5px rgba(255,206,77,.4)">
        <span style="flex-shrink:0;color:var(--gold);display:flex">${icon("alert-circle", { size: 20, strokeWidth: 2 })}</span>
        <span style="font:700 13px/1.4 'Baloo 2',var(--fb),sans-serif;color:var(--sg-ink)">Tu es déjà connecté en tant que <strong style="color:var(--gold)">${esc(connected.prenom || connected.username || connected.email || "quelqu'un")}</strong>.
          <a href="#" id="sg-switch" style="color:var(--gold);font-weight:800">Se déconnecter pour créer un compte</a></span>
      </div>`
    : "";

  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-card">
        <div class="sg-logo">
          <img src="/skins/avatars/permigo-badge-icon.png" alt="PermiGo" loading="eager" draggable="false"
               onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
          <span class="sg-logo-fb" aria-hidden="true"><b>P</b></span>
        </div>
        <h1 class="sg-title">Crée ton compte moniteur</h1>
        <p class="sg-sub">Ton app de révision à ta marque, prête en 30 secondes.</p>
        <div style="text-align:center"><span class="sg-role-badge">Moniteur indépendant</span></div>
        ${connectedBanner}

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
            <!-- Visible par défaut (type=text) : sur iPhone, un champ
                 type=password + new-password remplace le clavier par la
                 suggestion « mot de passe fort » → impossible de taper le sien.
                 L'œil permet de le masquer. -->
            <input class="sg-input" id="sg-password" type="text" autocomplete="new-password" minlength="8" placeholder="8 caractères minimum" />
            <button class="sg-pwd-toggle" id="sg-pwd-toggle" type="button" aria-label="Masquer le mot de passe" aria-pressed="true">${icon("eye-off", { size: 18, strokeWidth: 2 })}</button>
          </div>
          <div class="sg-help" id="sg-pwd-help">Minimum 8 caractères.</div>
        </div>

        <button class="sg-btn" id="sg-submit" disabled>Créer mon compte</button>
        <div class="sg-trust">
          <span>${icon("check", { size: 13, strokeWidth: 2.5 })} Sans engagement</span>
          <span>${icon("check", { size: 13, strokeWidth: 2.5 })} Jusqu'à 100 élèves — gratuit pour eux</span>
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
        //    (auth_id, role='eleve', prenom) sans auto_ecole_id ni email.
        //    Le rôle est promu 'enseignant' par la RPC de l'étape 2 (jamais
        //    depuis le client — le trigger ignore le metadata role).
        const { error: authErr } = await sb.auth.signUp({
          email,
          password: pwdEl.value,
          options: { data: { prenom } },
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

      // 3. Succès → étape abonnement (9,99 €/mois via Stripe), puis
      //    add-to-home et entrée dans l'app.
      renderPaymentStep(root, prenom);
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

// ─── Étape abonnement post-inscription ──────────────────────────
// Le compte est créé : le paiement (9,99 €/mois, Stripe Checkout hébergé — même
// circuit que le bouton de Réglages) est OBLIGATOIRE — c'est le SEUL chemin vers
// l'app (décision Rayan : plus d'essai/« Plus tard » à l'inscription). Après
// paiement, Stripe renvoie sur /#/settings?checkout=success ; sans paiement, le
// verrou d'accès moniteur bloque l'entrée tant qu'aucun abo n'est actif.
function renderPaymentStep(root, prenom) {
  track("signup.payment_viewed", { role: "enseignant" });
  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-card" style="text-align:center">
        <div style="margin-bottom:10px;color:var(--gold);display:flex;justify-content:center">${icon("award", { size: 42 })}</div>
        <h1 class="sg-title">Ton compte est prêt${prenom ? `, ${esc(prenom)}` : ""} !</h1>
        <p class="sg-sub">Dernière étape : active ton abonnement pour lancer ton espace moniteur.</p>
        <div style="text-align:left;margin:0 0 18px;padding:16px;border-radius:16px;background:rgba(255,206,77,.1);box-shadow:inset 0 0 0 1.5px rgba(255,206,77,.35)">
          <div style="font:800 22px/1.2 'Baloo 2',var(--fb),sans-serif;color:var(--gold);margin-bottom:8px">9,99 €/mois</div>
          <div style="display:flex;flex-direction:column;gap:7px;font:600 13.5px/1.4 'Baloo 2',var(--fb),sans-serif;color:var(--ink-soft)">
            <span style="display:flex;gap:7px;align-items:center">${icon("check", { size: 14, strokeWidth: 2.5 })} Jusqu'à 100 élèves — gratuit pour eux</span>
            <span style="display:flex;gap:7px;align-items:center">${icon("check", { size: 14, strokeWidth: 2.5 })} Sans engagement, résiliable en ligne à tout moment</span>
            <span style="display:flex;gap:7px;align-items:center">${icon("check", { size: 14, strokeWidth: 2.5 })} Ta marque, ton code élève, ton suivi</span>
          </div>
        </div>
        <button class="sg-btn" id="sg-pay" type="button" style="margin-top:0">Activer mon abonnement — 9,99 €/mois</button>
        <p style="margin:14px 0 0;font:600 12px/1.5 'Baloo 2',var(--fb),sans-serif;color:var(--ink-mu)">Paiement sécurisé Stripe. Résiliable en ligne à tout moment, sans frais.</p>
      </div>
    </div>`;

  const payBtn = root.querySelector("#sg-pay");
  payBtn?.addEventListener("click", async () => {
    payBtn.disabled = true;
    payBtn.textContent = "Redirection vers le paiement…";
    track("billing.checkout_start", { role: "enseignant", from: "signup" });
    try {
      const { startCheckout } = await import("@/services/billing.js");
      await startCheckout(); // redirige vers la page Stripe si OK
    } catch (err) {
      console.error("[creer-compte] checkout", err);
      const { toast } = await import("@/components/common/toast.js");
      toast(
        "Paiement indisponible pour le moment. Réessaie dans un instant.",
        "error",
        4500,
      );
      payBtn.disabled = false;
      payBtn.textContent = "Activer mon abonnement — 9,99 €/mois";
    }
  });
}
