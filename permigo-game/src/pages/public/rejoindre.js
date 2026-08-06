// ═══════════════════════════════════════════════════════════════
// Page publique — Inscription élève, direction A validée par Rayan
// (maquette mockups/inscription-3-ecrans/A-mascotte.html).
//
// URL : #/rejoindre                    → chemin BIS au lien d'invitation.
//       L'élève tape le code de son moniteur (ex : PERMIS75). Le moniteur ne
//       manipule jamais l'email de l'élève (cf. règle non-négociable #1).
//   #/rejoindre?code=PERMIS75          → code pré-rempli depuis un lien partagé
//   #/rejoindre?solo=1                 → compte gratuit SANS moniteur
//                                         (acheteurs du Pass Permis, campagne pub)
//
// 4 écrans, une seule composition qui se répète (mascotte en haut dans une
// bulle, la question juste au-dessus d'un champ « ligne ») :
//   0. Prénom seul                      — alimente « Aujourd'hui {prénom} »
//   1. Email + mot de passe (+ code     — le code moniteur vit ici, en second
//      moniteur si pas solo)              plan, comme le mot de passe (mode JOIN)
//   2. Boîte de vitesses — PASSABLE      — décide les questions de certification
//   3. Arrivée                          — un seul bouton, pas de retour
//
// Compte créé à la fin de l'écran 1 (sb.auth.signUp) : la session est active
// immédiatement (pas de confirmation email en prod), donc les écrans 2 et 3
// écrivent directement en base via des RPC déjà existantes :
//   · set_eleve_signup_minimal(pseudo)   — auto-généré depuis l'email
//   · set_my_identity(prénom)            — le vrai prénom, donné à l'écran 0
//   · join_moniteur_by_code(code)        — mode JOIN uniquement
//   · enregistrerBoite (utils/transmission.js) — écran boîte, colonne existante
//
// ⚠️ Ce qu'on ne demande PLUS ici, et où ça se demande maintenant :
//   · date de naissance → carte dans l'accueil (birthdate-card.js). Obligation
//     légale (accord d'un parent sous 15 ans), mais elle ne vaut pas de faire
//     fuir quelqu'un avant qu'il ait vu le produit.
//   · nom de famille → jamais demandé au grand public (pseudo + prénom suffisent
//     pour un classement).
//   · langue → l'app devine déjà la langue du téléphone (browserLang(), utils/
//     lang.js) et la propose dans Réglages. Lui donner un écran dédié ici allait
//     à l'encontre de la maquette validée (4 écrans, pas 5) pour un réglage que
//     la quasi-totalité des visiteurs n'aurait jamais changé de toute façon.
//
// La boîte de vitesses n'est PLUS demandée dans l'onboarding qui suit (elle l'a
// été jusqu'au 06/08/2026, PR #725) : elle vit ici, une fois, jamais deux.
//
// ⚠️ Dépend de la migration 20260621120000_join_code.sql (RPC déjà en prod).
// ═══════════════════════════════════════════════════════════════
import { sb, restoreSession } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { fbTrack } from "@/services/meta-pixel.js";
import { haptic } from "@/utils/haptic.js";
import { chargerBoite, enregistrerBoite } from "@/utils/transmission.js";

const MASCOT = {
  hello: "/art/mascotte/mascot-bonjour-remasterise.webp",
  point: "/art/mascotte/mascot-pointe-du-doigt.webp",
  think: "/art/mascotte/mascot-reflexion-quiz.webp",
  cheer: "/art/mascotte/mascot-celebration.webp",
};

const STYLE = `<style>
  .rj-app{
    position: fixed; inset: 0; z-index: 1; overflow: hidden;
    display: flex; flex-direction: column;
    font-family: 'Archivo', var(--fd), sans-serif;
    -webkit-font-smoothing: antialiased;
    background: var(--bg);
    padding: max(10px, env(safe-area-inset-top)) 20px max(14px, env(safe-area-inset-bottom));
  }
  .rj-bgfx{ position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  .rj-bgfx i{ position: absolute; display: block; border-radius: 50%; filter: blur(56px); opacity: .5; }
  .rj-bgfx i:nth-child(1){ width: 340px; height: 340px; top: -110px; left: -90px;
    background: radial-gradient(circle, var(--a) 0%, transparent 70%); }
  .rj-bgfx i:nth-child(2){ width: 300px; height: 300px; bottom: -120px; right: -100px;
    background: radial-gradient(circle, var(--a-lt) 0%, transparent 70%); opacity: .38; }

  /* Barre du haut : retour + points de progression */
  .rj-top{ flex: none; height: 44px; display: flex; align-items: center; gap: 12px; position: relative; z-index: 2; }
  .rj-back{ width: 44px; height: 44px; margin-left: -10px; border: 0; background: transparent; cursor: pointer;
    display: grid; place-items: center; color: var(--mu); border-radius: 14px; }
  .rj-back svg{ width: 22px; height: 22px; }
  .rj-back[hidden]{ display: none; }
  .rj-back:active{ background: color-mix(in srgb, var(--ink) 7%, transparent); }
  .rj-dots{ display: flex; gap: 7px; margin-inline: auto; }
  .rj-dots b{ width: 7px; height: 7px; border-radius: 50%; background: var(--bo); display: block;
    transition: width .3s cubic-bezier(.22,1,.36,1), background .3s ease; }
  .rj-dots b.on{ width: 22px; background: var(--a); }
  .rj-dots b.done{ background: color-mix(in srgb, var(--a) 45%, transparent); }
  .rj-dots[hidden]{ visibility: hidden; }
  .rj-top .rj-spacer{ width: 44px; flex: none; }

  /* Les écrans se superposent le temps du fondu */
  .rj-stage{ position: relative; flex: 1; min-height: 0; z-index: 2; }
  .rj-scr{ position: absolute; inset: 0; display: flex; flex-direction: column; }
  .rj-scr[hidden]{ display: none; }

  /* Mascotte + bulle */
  .rj-hero{ flex: 1; min-height: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6px; }
  .rj-bubble{ position: relative; max-width: 280px; text-align: center;
    background: var(--su); border: 1.5px solid var(--bo); border-radius: 18px;
    padding: 9px 15px; font: 700 13.5px/1.3 'Archivo', var(--fd), sans-serif; color: var(--ink);
    box-shadow: 0 6px 20px -12px rgba(11,13,26,.4); }
  .rj-bubble::after{ content: ""; position: absolute; left: 50%; bottom: -7px; width: 12px; height: 12px;
    transform: translateX(-50%) rotate(45deg); background: var(--su);
    border-right: 1.5px solid var(--bo); border-bottom: 1.5px solid var(--bo); border-bottom-right-radius: 3px; }
  .rj-mascot{ display: block; width: auto; height: clamp(112px, 28vh, 240px);
    object-fit: contain; filter: drop-shadow(0 18px 26px rgba(76,63,201,.28)); }

  /* Question + champs */
  .rj-body{ flex: none; }
  .rj-h1{ margin: 0 0 14px; font: 900 clamp(22px, 6.2vw, 27px)/1.15 'Archivo', var(--fd), sans-serif;
    color: var(--ink); letter-spacing: -.02em; text-align: center; }
  .rj-sub{ margin: -8px 0 14px; font: 500 13.5px/1.4 'Archivo', var(--fd), sans-serif; color: var(--mu); text-align: center; }

  /* Champ « ligne » façon Typeform : pas de boîte, une règle épaisse */
  .rj-line{ position: relative; }
  .rj-line + .rj-line{ margin-top: 10px; }
  .rj-line input{ width: 100%; height: 52px; padding: 0 2px; border: 0; background: transparent;
    border-bottom: 2px solid var(--bo); color: var(--ink);
    font: 800 19px/1 'Archivo', var(--fd), sans-serif; outline: none; transition: border-color .2s ease;
    box-sizing: border-box; }
  .rj-line input::placeholder{ color: var(--mu); font-weight: 600; opacity: .75; }
  .rj-line input:focus{ border-bottom-color: var(--a); }
  .rj-line input:focus::placeholder{ opacity: .45; }
  .rj-line input.err{ border-bottom-color: #e5484d; }

  /* Champs secondaires (mot de passe, code moniteur) : volontairement en retrait */
  .rj-minor{ margin-top: 14px; padding-top: 13px; border-top: 1px dashed var(--bo); }
  .rj-minor label{ display: block; font: 700 11.5px/1 'Archivo', var(--fd), sans-serif; color: var(--mu);
    text-transform: uppercase; letter-spacing: .06em; margin-bottom: 7px; }
  .rj-minor-wrap{ position: relative; }
  .rj-minor input{ width: 100%; height: 46px; padding: 0 13px; border-radius: 13px; box-sizing: border-box;
    border: 1.5px solid var(--bo); background: var(--su2); color: var(--ink);
    font: 600 15px/1 'Archivo', var(--fd), sans-serif; outline: none; }
  .rj-minor input:focus{ border-color: var(--a); }
  .rj-minor input::placeholder{ color: var(--mu); font-weight: 500; }
  .rj-minor input.err{ border-color: #e5484d; }
  .rj-minor-pwd input{ padding-right: 46px; }
  .rj-minor-toggle{ position: absolute; right: 4px; top: 4px; width: 38px; height: 38px; border: 0;
    background: none; cursor: pointer; color: var(--mu); display: flex; align-items: center; justify-content: center;
    border-radius: 10px; }
  .rj-minor-toggle:hover{ color: var(--ink); }
  .rj-help{ font: 600 11.5px/1.4 'Archivo', var(--fd), sans-serif; color: var(--mu); margin-top: 6px; margin-left: 2px; }
  .rj-help.error{ color: #e5484d; }
  .rj-help.ok{ color: #2f9e44; }
  .rj-code-input{ text-transform: uppercase; letter-spacing: .16em; font-weight: 800 !important; }

  /* Les deux cartes de boîte de vitesses */
  .rj-cards{ display: flex; flex-direction: column; gap: 10px; }
  .rj-card{ display: flex; align-items: center; gap: 13px; width: 100%; min-height: 70px; padding: 13px 15px;
    text-align: left; cursor: pointer; border-radius: 18px; border: 1.5px solid var(--bo);
    background: var(--su); color: var(--ink); font-family: 'Archivo', var(--fd), sans-serif;
    transition: border-color .18s ease, transform .18s cubic-bezier(.22,1,.36,1); }
  .rj-card:active{ transform: scale(.985); }
  .rj-card.sel{ border-color: var(--a); box-shadow: inset 0 0 0 1.5px var(--a); }
  .rj-card i{ flex: none; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center;
    background: color-mix(in srgb, var(--a) 12%, transparent); color: var(--a-txt);
    font: 900 13px/1 'Archivo', var(--fd), sans-serif; font-style: normal; letter-spacing: .02em; }
  .rj-card b{ display: block; font: 800 15px/1.2 'Archivo', var(--fd), sans-serif; }
  .rj-card span{ display: block; font: 500 12.5px/1.35 'Archivo', var(--fd), sans-serif; color: var(--mu); margin-top: 3px; }

  /* Pied : bouton principal */
  .rj-foot{ flex: none; padding-top: 16px; }
  .rj-cta{ width: 100%; min-height: 54px; border: 0; border-radius: 17px; cursor: pointer;
    background: linear-gradient(180deg, var(--a-lt) 0%, var(--a) 52%, var(--adk) 100%);
    color: var(--a-ink); font: 800 16.5px/1 'Archivo', var(--fd), sans-serif;
    box-shadow: 0 8px 18px -8px rgba(76,63,201,.75), inset 0 -3px 0 rgba(0,0,0,.16);
    transition: transform .16s cubic-bezier(.22,1,.36,1), box-shadow .16s ease, opacity .15s; }
  .rj-cta:active:not(:disabled){ transform: translateY(2px); box-shadow: 0 4px 12px -8px rgba(76,63,201,.75), inset 0 -1px 0 rgba(0,0,0,.16); }
  .rj-cta:disabled{ opacity: .5; cursor: default; }
  .rj-skip{ display: block; width: 100%; min-height: 44px; margin-top: 6px; border: 0; background: transparent;
    cursor: pointer; color: var(--mu); font: 700 13.5px/1 'Archivo', var(--fd), sans-serif; text-decoration: underline;
    text-underline-offset: 3px; }
  .rj-login-row{ text-align: center; margin-top: 14px; font: 600 13px/1.4 'Archivo', var(--fd), sans-serif; color: var(--mu); }
  .rj-login-row a{ color: var(--a-txt); font-weight: 800; text-decoration: none; }
  .rj-login-row a:hover{ text-decoration: underline; }

  /* Mouvement */
  @keyframes rjEnt { from{ opacity: 0; transform: translate3d(0,16px,0) scale(.985); } to{ opacity: 1; transform: none; } }
  @keyframes rjEntB{ from{ opacity: 0; transform: translate3d(0,-14px,0) scale(.985); } to{ opacity: 1; transform: none; } }
  @keyframes rjLv  { from{ opacity: 1; transform: none; } to{ opacity: 0; transform: translate3d(0,-14px,0) scale(.985); } }
  @keyframes rjLvB { from{ opacity: 1; transform: none; } to{ opacity: 0; transform: translate3d(0,16px,0) scale(.985); } }
  .rj-scr.ent { animation: rjEnt  .34s cubic-bezier(.22,1,.36,1) both; }
  .rj-scr.entB{ animation: rjEntB .34s cubic-bezier(.22,1,.36,1) both; }
  .rj-scr.lv  { animation: rjLv   .26s cubic-bezier(.4,0,1,1) both; }
  .rj-scr.lvB { animation: rjLvB  .26s cubic-bezier(.4,0,1,1) both; }

  @keyframes rjMIn { from{ opacity: 0; transform: translate3d(0,26px,0) scale(.9); } to{ opacity: 1; transform: none; } }
  @keyframes rjBreathe { 0%,100%{ transform: translateY(0) rotate(-.6deg); } 50%{ transform: translateY(-7px) rotate(.6deg); } }
  .rj-mascot{ animation: rjMIn .5s cubic-bezier(.22,1,.36,1) both, rjBreathe 4.4s ease-in-out 0s infinite; }
  .rj-scr.ent .rj-mascot, .rj-scr.entB .rj-mascot{ animation: rjMIn .5s cubic-bezier(.22,1,.36,1) .06s both, rjBreathe 4.4s ease-in-out .56s infinite; }
  @keyframes rjBIn { from{ opacity: 0; transform: translateY(8px) scale(.94); } to{ opacity: 1; transform: none; } }
  .rj-bubble{ animation: rjBIn .42s cubic-bezier(.22,1,.36,1) .22s both; }

  @media (prefers-reduced-motion: reduce){
    .rj-scr, .rj-mascot, .rj-bubble, .rj-dots b{ animation: none !important; transition: none !important; }
  }

  /* État « déjà connecté » — pas la maquette, un simple message centré */
  .rj-connected{ position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px; text-align: center; padding: 20px; }
  .rj-connected p{ margin: 0; font: 600 14.5px/1.5 'Archivo', var(--fd), sans-serif; color: var(--mu); max-width: 300px; }
  .rj-connected p strong{ color: var(--ink); }
  .rj-connected .rj-cta{ max-width: 300px; }
  .rj-connected-link{ color: var(--a-txt); font: 700 13.5px/1 'Archivo', var(--fd), sans-serif; text-decoration: none; }
  .rj-connected-link:hover{ text-decoration: underline; }
</style>`;

function eyeIcon(open) {
  return open
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.7 18.7 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.7 18.7 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
}
const BACK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';

export async function mount(root) {
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

  // Session déjà active (compte test resté connecté, téléphone partagé…) : on
  // prévient au lieu de laisser croire que le circuit est cassé.
  const connected = getCurUser();
  if (connected) {
    renderConnected(root, connected);
    return;
  }

  renderFlow(root, { solo, prefillCode, prefillEmail });
}

function renderConnected(root, me) {
  const name = esc(me.prenom || me.username || me.email || "quelqu'un");
  root.innerHTML = `${STYLE}
    <div class="rj-bgfx" aria-hidden="true"><i></i><i></i></div>
    <div class="rj-app">
      <div class="rj-connected">
        <img class="rj-mascot" src="${MASCOT.point}" alt="" style="height:140px" />
        <p>Tu es déjà connecté en tant que <strong>${name}</strong>.</p>
        <button class="rj-cta" id="rj-switch" type="button">Se déconnecter pour créer un compte</button>
        <a class="rj-connected-link" href="/#/">Retourner à l'accueil</a>
      </div>
    </div>`;
  root.querySelector("#rj-switch")?.addEventListener("click", async () => {
    try {
      await sb.auth.signOut();
    } catch {
      /* session déjà morte : on recharge quand même */
    }
    window.location.reload();
  });
}

function renderFlow(root, { solo, prefillCode, prefillEmail }) {
  const RM =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ─── État persistant à travers les écrans ──────────────────────
  const state = {
    prenom: "",
    email: prefillEmail || "",
    pwd: "",
    code: prefillCode || "",
  };
  let accountCreated = false;
  let submitting = false;
  let boite = null;

  root.innerHTML = `${STYLE}
    <div class="rj-bgfx" aria-hidden="true"><i></i><i></i></div>
    <div class="rj-app">
      <div class="rj-top">
        <button class="rj-back" id="rj-back" hidden aria-label="Revenir">${BACK_ICON}</button>
        <div class="rj-dots" id="rj-dots" aria-hidden="true"><b></b><b></b><b></b></div>
        <div class="rj-spacer"></div>
      </div>
      <div class="rj-stage" id="rj-stage">

        <section class="rj-scr live" data-i="0">
          <div class="rj-hero">
            <div class="rj-bubble">Salut. Moi c'est PermiGo.</div>
            <img class="rj-mascot" src="${MASCOT.hello}" alt="" />
          </div>
          <div class="rj-body">
            <h1 class="rj-h1">Comment tu t'appelles ?</h1>
            <div class="rj-line"><input id="rj-prenom" type="text" autocomplete="given-name" placeholder="Prénom" enterkeyhint="next" maxlength="40" /></div>
          </div>
          <div class="rj-foot"><button class="rj-cta" id="rj-go0" type="button" disabled>Continuer</button></div>
        </section>

        <section class="rj-scr" data-i="1" hidden>
          <div class="rj-hero">
            <div class="rj-bubble">Ton email et un mot de passe.</div>
            <img class="rj-mascot" src="${MASCOT.point}" alt="" />
          </div>
          <div class="rj-body">
            <h1 class="rj-h1">Où je te retrouve ?</h1>
            <div class="rj-line"><input id="rj-email" type="email" inputmode="email" autocomplete="email" placeholder="ton@email.fr" enterkeyhint="next" /></div>
            ${
              solo
                ? ""
                : `<div class="rj-minor">
              <label for="rj-code">Code moniteur</label>
              <input class="rj-code-input" id="rj-code" type="text" autocomplete="off" autocorrect="off"
                autocapitalize="characters" spellcheck="false" maxlength="16" placeholder="PERMIS75"
                value="${escAttr(prefillCode)}" enterkeyhint="next" />
              <div class="rj-help" id="rj-code-help">Demande-le à ton moniteur.</div>
            </div>`
            }
            <div class="rj-minor">
              <label for="rj-pwd">Mot de passe</label>
              <div class="rj-minor-wrap rj-minor-pwd">
                <input id="rj-pwd" type="password" autocomplete="new-password" placeholder="8 caractères minimum" enterkeyhint="go" />
                <button class="rj-minor-toggle" id="rj-pwd-toggle" type="button" aria-label="Afficher le mot de passe" aria-pressed="false">${eyeIcon(false)}</button>
              </div>
            </div>
          </div>
          <div class="rj-foot">
            <button class="rj-cta" id="rj-go1" type="button" disabled>Continuer</button>
            <div class="rj-login-row">Déjà un compte&nbsp;? <a href="/#/login">Se connecter</a></div>
          </div>
        </section>

        <section class="rj-scr" data-i="2" hidden>
          <div class="rj-hero">
            <div class="rj-bubble">Ça change tes questions.</div>
            <img class="rj-mascot" src="${MASCOT.think}" alt="" />
          </div>
          <div class="rj-body">
            <h1 class="rj-h1">Quelle boîte de vitesses ?</h1>
            <div class="rj-cards" id="rj-boite-cards">
              <button class="rj-card" type="button" data-boite="auto">
                <i aria-hidden="true">PRND</i>
                <span><b>Boîte automatique</b><span>Deux pédales et un sélecteur P R N D</span></span>
              </button>
              <button class="rj-card" type="button" data-boite="manuelle">
                <i aria-hidden="true">1-5</i>
                <span><b>Boîte manuelle</b><span>Trois pédales et un levier de vitesses</span></span>
              </button>
            </div>
          </div>
          <div class="rj-foot"><button class="rj-skip" id="rj-skip-boite" type="button">Je ne sais pas encore</button></div>
        </section>

        <section class="rj-scr" data-i="3" hidden>
          <div class="rj-hero">
            <div class="rj-bubble">Bien joué.</div>
            <img class="rj-mascot" src="${MASCOT.cheer}" alt="" />
          </div>
          <div class="rj-body">
            <h1 class="rj-h1">Bienvenue <span id="rj-nm">toi</span></h1>
            <p class="rj-sub">Ton compte est prêt. La première leçon t'attend.</p>
          </div>
          <div class="rj-foot"><button class="rj-cta" id="rj-enter" type="button">On y va</button></div>
        </section>

      </div>
    </div>`;

  const scrs = Array.from(root.querySelectorAll(".rj-scr"));
  const dots = root.querySelector("#rj-dots");
  const back = root.querySelector("#rj-back");
  const stage = root.querySelector("#rj-stage");
  let cur = 0;
  let busy = false;
  let timer = null;

  function paint() {
    const bs = dots.querySelectorAll("b");
    bs.forEach((b, i) => {
      b.className = i === cur ? "on" : i < cur ? "done" : "";
    });
    dots.hidden = cur >= 3;
    back.hidden = cur === 0 || cur >= 3;
    if (cur === 3) {
      const nmEl = root.querySelector("#rj-nm");
      if (nmEl) {
        const p = state.prenom.trim();
        nmEl.textContent = p ? p.charAt(0).toUpperCase() + p.slice(1) : "toi";
      }
    }
  }

  function focusFirst(sec) {
    const f = sec.querySelector("input");
    if (f) {
      try {
        f.focus({ preventScroll: true });
      } catch {
        f.focus();
      }
    }
  }

  function go(n, isBack) {
    if (busy || n === cur || n < 0 || n >= scrs.length) return;
    busy = true;
    const from = scrs[cur];
    const to = scrs[n];
    to.hidden = false;
    to.className = "rj-scr " + (isBack ? "entB" : "ent");
    from.className = "rj-scr " + (isBack ? "lvB" : "lv");
    cur = n;
    paint();
    clearTimeout(timer);
    timer = setTimeout(
      () => {
        from.hidden = true;
        from.className = "rj-scr";
        to.className = "rj-scr live";
        busy = false;
        focusFirst(to);
      },
      RM ? 0 : 340,
    );
  }

  back.addEventListener("click", () => go(cur - 1, true));

  // ─── Écran 0 · Prénom ───────────────────────────────────────────
  const prenomEl = root.querySelector("#rj-prenom");
  const go0Btn = root.querySelector("#rj-go0");
  prenomEl.addEventListener("input", () => {
    state.prenom = prenomEl.value;
    go0Btn.disabled = prenomEl.value.trim().length < 2;
  });
  go0Btn.addEventListener("click", () => go(1, false));

  // ─── Écran 1 · Email + mot de passe (+ code moniteur) ──────────
  const emailEl = root.querySelector("#rj-email");
  const pwdEl = root.querySelector("#rj-pwd");
  const pwdToggle = root.querySelector("#rj-pwd-toggle");
  const codeEl = root.querySelector("#rj-code");
  const codeHelp = root.querySelector("#rj-code-help");
  const go1Btn = root.querySelector("#rj-go1");

  if (state.email) emailEl.value = state.email;
  if (state.code) codeEl && (codeEl.value = state.code);

  const emailValid = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim());
  const normCode = (v) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  pwdToggle.addEventListener("click", () => {
    const show = pwdEl.type === "password";
    pwdEl.type = show ? "text" : "password";
    pwdToggle.setAttribute("aria-pressed", String(show));
    pwdToggle.setAttribute(
      "aria-label",
      show ? "Masquer le mot de passe" : "Afficher le mot de passe",
    );
    pwdToggle.innerHTML = eyeIcon(show);
  });

  let codeValid = solo; // en solo, pas de code à vérifier
  let codeChecking = false;
  let codeTimer = null;

  function validateScreen1() {
    const emailOk = emailValid(emailEl.value);
    const pwdOk = pwdEl.value.length >= 8;
    const codeOk = solo || (codeValid && !codeChecking);
    go1Btn.disabled = !(emailOk && pwdOk && codeOk);
    emailEl.classList.toggle("err", !!emailEl.value && !emailOk);
    pwdEl.classList.toggle("err", !!pwdEl.value && !pwdOk);
  }

  emailEl.addEventListener("input", () => {
    state.email = emailEl.value;
    validateScreen1();
  });
  pwdEl.addEventListener("input", () => {
    state.pwd = pwdEl.value;
    validateScreen1();
  });

  if (!solo && codeEl) {
    const checkCode = () => {
      const v = normCode(codeEl.value);
      state.code = v;
      codeValid = false;
      if (v.length < 3) {
        codeChecking = false;
        codeHelp.className = "rj-help";
        codeHelp.textContent = "Demande-le à ton moniteur.";
        validateScreen1();
        return;
      }
      codeChecking = true;
      codeHelp.className = "rj-help";
      codeHelp.textContent = "Vérification…";
      validateScreen1();
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
            codeEl.classList.add("err");
            codeHelp.className = "rj-help error";
            codeHelp.textContent =
              "Code introuvable. Revérifie auprès de ton moniteur.";
          } else {
            codeValid = true;
            codeEl.classList.remove("err");
            codeHelp.className = "rj-help ok";
            const ecole = info.ecole_nom || "ton auto-école";
            const dejaDansEcole =
              info.moniteur_prenom &&
              ecole.toLowerCase().includes(info.moniteur_prenom.toLowerCase());
            const withPart =
              info.moniteur_prenom && !dejaDansEcole
                ? ` avec ${info.moniteur_prenom}`
                : "";
            codeHelp.textContent = `Tu rejoins ${ecole}${withPart}.`;
          }
        } catch {
          codeChecking = false;
          codeValid = false;
          codeHelp.className = "rj-help error";
          codeHelp.textContent = "Vérification impossible, réessaie.";
        }
        validateScreen1();
      }, 400);
    };
    codeEl.addEventListener("input", checkCode);
    if (normCode(codeEl.value)) checkCode();
  }
  validateScreen1();

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

  async function submitAccount() {
    if (submitting) return;
    submitting = true;
    go1Btn.disabled = true;
    const label = go1Btn.textContent;
    go1Btn.textContent = "Création…";
    const { toast } = await import("@/components/common/toast.js");

    try {
      if (!accountCreated) {
        const { error: authErr } = await sb.auth.signUp({
          email: state.email.trim().toLowerCase(),
          password: state.pwd,
          options: { data: { role: "eleve" } },
        });
        if (authErr) throw authErr;

        if (!solo) {
          const { error: joinErr } = await sb.rpc("join_moniteur_by_code", {
            p_code: normCode(state.code),
          });
          if (joinErr) {
            if (/invalid_code/i.test(joinErr.message || "")) {
              toast("Code moniteur invalide. Revérifie-le.", "error", 4000);
              codeValid = false;
              codeEl.classList.add("err");
              codeHelp.className = "rj-help error";
              codeHelp.textContent = "Code introuvable.";
              go1Btn.textContent = label;
              submitting = false;
              validateScreen1();
              return;
            }
            if (/already_has_school/i.test(joinErr.message || "")) {
              toast(
                "Ce compte est déjà rattaché à un moniteur. Connecte-toi.",
                "error",
                4500,
              );
              go1Btn.textContent = label;
              submitting = false;
              go1Btn.disabled = false;
              return;
            }
            throw joinErr;
          }
        }
        accountCreated = true;
      }

      // Pseudo auto-généré depuis l'email (retente en cas de collision, rare).
      let profErr = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const res = await sb.rpc("set_eleve_signup_minimal", {
          p_username: genUsername(state.email),
        });
        profErr = res.error;
        if (!profErr || !/username_taken/i.test(profErr.message || "")) break;
      }
      if (profErr) throw profErr;

      // Le vrai prénom, donné à l'écran précédent (best effort : un raté ici
      // ne doit pas bloquer la création du compte, juste garder le prénom
      // provisoire posé par le trigger — identity-prompt le redemandera).
      try {
        await sb.rpc("set_my_identity", {
          p_prenom: state.prenom.trim(),
          p_nom: null,
        });
      } catch (e) {
        console.warn("[rejoindre] set_my_identity a échoué", e);
      }

      // Recharge le profil en mémoire (auth.js) : sans ça getCurUser() reste
      // vide jusqu'au reload final, et l'écran boîte (enregistrerBoite, qui
      // lit getCurUser().id) échouerait en silence.
      try {
        await restoreSession();
      } catch (e) {
        console.warn("[rejoindre] restoreSession a échoué", e);
      }

      track("signup.completed", {
        role: "eleve",
        from: solo ? "pass_solo" : "join_code",
      });
      // Compte créé = LA conversion mesurable de la campagne pub.
      fbTrack("CompleteRegistration", {
        content_name: solo ? "compte_gratuit" : "code_moniteur",
        status: true,
      });

      if (solo) {
        try {
          const { data: pass } = await sb.rpc("get_my_pass_status");
          track("signup.solo_pass_check", { has_pass: !!pass?.has_pass });
        } catch {
          /* best-effort */
        }
      }

      submitting = false;
      go1Btn.disabled = false;
      go1Btn.textContent = label;
      go(2, false);
    } catch (e) {
      console.error("[rejoindre] failed", e);
      const msg = /already.*registered|already.*exists/i.test(e?.message || "")
        ? "Un compte existe déjà avec cet email. Connecte-toi directement."
        : e?.message || "Erreur lors de la création du compte";
      toast(msg, "error", 4500);
      submitting = false;
      go1Btn.disabled = false;
      go1Btn.textContent = label;
    }
  }
  go1Btn.addEventListener("click", submitAccount);

  // ─── Écran 2 · Boîte de vitesses (passable) ────────────────────
  chargerBoite()
    .then((known) => {
      if (known) boite = known;
    })
    .catch(() => {});
  const boiteBtns = Array.from(
    root.querySelectorAll("#rj-boite-cards .rj-card"),
  );
  boiteBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      haptic("select");
      boiteBtns.forEach((b) => b.classList.remove("sel"));
      btn.classList.add("sel");
      boite = btn.dataset.boite;
      track("signup.boite_choisie", { boite });
      enregistrerBoite(boite).catch(() => {});
      setTimeout(() => go(3, false), RM ? 0 : 220);
    });
  });
  root.querySelector("#rj-skip-boite")?.addEventListener("click", () => {
    track("signup.boite_skipped", {});
    go(3, false);
  });

  // ─── Écran 3 · Arrivée ──────────────────────────────────────────
  root.querySelector("#rj-enter")?.addEventListener("click", () => {
    haptic("success");
    window.location.href = "/#";
    window.location.reload();
  });

  // ─── Entrée : passe au champ suivant, ou déclenche l'action ─────
  stage.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const sec = scrs[cur];
    const ins = Array.from(sec.querySelectorAll("input"));
    const i = ins.indexOf(document.activeElement);
    if (i > -1 && i < ins.length - 1) {
      ins[i + 1].focus();
      e.preventDefault();
      return;
    }
    const cta = sec.querySelector(".rj-cta:not(:disabled)");
    if (cta) {
      e.preventDefault();
      cta.click();
    }
  });

  // Le clavier monte tout seul à l'arrivée.
  paint();
  focusFirst(scrs[0]);
}
