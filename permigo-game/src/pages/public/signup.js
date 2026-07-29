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
    margin: 0 0 24px;
  }
  .sg-sub strong { color: var(--gold); }
  .sg-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .sg-label {
    font: 700 13px/1 'Baloo 2', var(--fb), sans-serif;
    color: var(--ink-soft);
    letter-spacing: .04em;
    text-transform: uppercase;
    margin-left: 4px;
  }
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
  .sg-input[readonly] {
    color: var(--ink-mu); cursor: default;
    box-shadow: inset 0 2px 5px rgba(0,0,0,.5), inset 0 0 0 1.5px rgba(98,87,168,.5);
    opacity: .85;
  }
  .sg-input.error { box-shadow: inset 0 2px 5px rgba(0,0,0,.5), inset 0 0 0 2px #ff8d8d; }
  /* Date picker lisible sur fond sombre */
  .sg-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.85); cursor: pointer; }
  .sg-help {
    font: 600 11.5px/1.4 'Baloo 2', var(--fb), sans-serif;
    color: var(--ink-mu);
    margin-top: 2px;
    margin-left: 4px;
  }
  .sg-help.error { color: #ffb3b3; }
  .sg-help.ok { color: #8fe85a; }
  .sg-italic {
    font: italic 500 12px/1.45 'Baloo 2', var(--fb), sans-serif;
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
    font: 800 18px/1 'Baloo 2', var(--fb), sans-serif;
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

  /* Champ mot de passe + œil */
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

  /* Séparateur fin avant le footer */
  .sg-sep { height: 2px; border-radius: 2px; margin: 22px 0 0;
    background: linear-gradient(90deg, transparent, rgba(124,111,224,.4), transparent); }

  /* Lien se connecter */
  .sg-login-row { text-align: center; margin-top: 16px; font: 600 13.5px/1.4 'Baloo 2', var(--fb), sans-serif; color: var(--ink-soft); }
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
    font: 800 11px/1 'Baloo 2', var(--fb), sans-serif;
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
    font: 800 19px/1.2 'Baloo 2', var(--fb), sans-serif;
    color: var(--sg-ink);
    margin: 0 0 8px;
    text-shadow: 0 2px 0 rgba(0,0,0,.3);
  }
  .sg-error-msg {
    font: 600 13.5px/1.5 'Baloo 2', var(--fb), sans-serif;
    color: var(--ink-soft);
    margin: 0 0 18px;
  }
  /* Lien-bouton secondaire (retour / J'ai compris) — plaque sombre */
  .sg-link {
    color: var(--sg-ink);
    font: 800 14px/1 'Baloo 2', var(--fb), sans-serif;
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
    .sg-input { border: 1px solid CanvasText; box-shadow: none; }
    .sg-btn, .sg-link { border: 2px solid ButtonText; box-shadow: none; }
    .sg :focus-visible { outline: 2px solid Highlight !important; }
    .sg-logo img { filter: none; }
  }
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
        <h1 class="sg-title">Active ton compte</h1>
        <p class="sg-sub">
          ${ecoleName ? `Tu rejoins <strong>${esc(ecoleName)}</strong>` : "Bienvenue dans PermiGo"}
        </p>
        <div style="text-align:center"><span class="sg-role-badge">${esc(roleLabel)}</span></div>

        <div class="sg-row">
          <label class="sg-label" for="sg-email">Email</label>
          <input class="sg-input" id="sg-email" type="email" value="${escAttr(invitation.email)}" readonly />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-prenom">Prénom</label>
          <input class="sg-input" id="sg-prenom" type="text" autocomplete="given-name" placeholder="Ton prénom" />
        </div>

        ${eleveFields}

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
        <div style="margin-bottom:10px;color:var(--gold);display:flex;justify-content:center">${icon("users", { size: 42 })}</div>
        <h1 class="sg-title">Presque&nbsp;! On attend l'accord de ton parent</h1>
        <p class="sg-sub">Comme tu as moins de 15 ans, un parent ou tuteur doit donner son accord avant que tu puisses utiliser PermiGo. Envoie-lui ce lien&nbsp;:</p>
        <div class="sg-row">
          <input class="sg-input" id="sg-consent-link" type="text" readonly value="${escAttr(link)}" />
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
