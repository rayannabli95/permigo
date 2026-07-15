// ═══════════════════════════════════════════════════════════════
// Page publique — Pré-vente « Pass Permis » (payeur = ÉLÈVE)
// URL : #/pass  (partageable en DM : permigo.vercel.app/#/pass)
//
// Test de demande (brief prix 15/07/2026) : 3 paliers — mensuel 9,99 €,
// Pass 3 mois 24,99 € (cible), Pass 6 mois 39,99 € (ancre haute).
// Pré-commande 100 % remboursable. Marche connecté (achat rattaché au
// compte) comme invité (Stripe collecte l'email).
//
// Retour Checkout : #/pass?checkout=success&plan=xxx | #/pass?checkout=cancel
// DA : « Arène 3D » élève (nuit-violet + or) — cohérente avec login/signup.
// ═══════════════════════════════════════════════════════════════
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";
import { startPassCheckout } from "@/services/billing.js";
import { getCurUser } from "@/auth/cur-user.js";

const PLAN_LABELS = {
  mensuel: "Abonnement mensuel — 9,99 €/mois",
  pass3: "Pass Permis 3 mois — 24,99 €",
  pass6: "Pass Permis 6 mois + bonus — 39,99 €",
};

const STYLE = `<style>
  .pv {
    position: relative;
    min-height: 100dvh;
    font-family: 'Baloo 2', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    --in:#6c63ff;--in-lt:#8e87ff;--in-dp:#4a3fc9;--in-dk:#372fa3;
    --gold:#ffce4d;--gold-dp:#e8a317;--go:#58cc02;--go-dp:#3a8a01;
    --ncard:#2b2160;--pv-ink:#f4f1ff;--ink-soft:#cdc8ec;--ink-mu:#aaa2d8;
    color: var(--pv-ink);
    background:
      radial-gradient(120% 70% at 50% -8%, rgba(255,206,77,.14), transparent 55%),
      linear-gradient(165deg, #241a4d 0%, #33246b 55%, #241a4d 100%);
    padding-bottom: calc(86px + env(safe-area-inset-bottom));
  }
  .pv * { box-sizing: border-box; }
  .pv-wrap { max-width: 560px; margin: 0 auto; padding: 0 18px; }

  /* ── Barre haute ── */
  .pv-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(14px + env(safe-area-inset-top)) 18px 10px;
    max-width: 560px; margin: 0 auto;
  }
  .pv-brand { display: flex; align-items: center; gap: 8px; font: 800 19px/1 'Baloo 2', sans-serif; color: var(--pv-ink); text-decoration: none; }
  .pv-brand .g { color: var(--go); }
  .pv-login { font: 700 14px/1 'Baloo 2', sans-serif; color: var(--ink-soft); background: none; border: 0; padding: 10px 12px; cursor: pointer; border-radius: 12px; }
  .pv-login:active { background: rgba(255,255,255,.08); }

  /* ── Hero ── */
  .pv-hero { text-align: center; padding: 22px 0 8px; }
  .pv-badge {
    display: inline-flex; align-items: center; gap: 7px;
    font: 700 12.5px/1 'Baloo 2', sans-serif; letter-spacing: .05em; text-transform: uppercase;
    color: var(--gold); background: rgba(255,206,77,.12);
    border: 1.5px solid rgba(255,206,77,.4); border-radius: 999px; padding: 8px 14px;
  }
  .pv-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); animation: pvPulse 2s ease-in-out infinite; }
  @keyframes pvPulse { 0%,100%{opacity:.5;transform:scale(.85)} 50%{opacity:1;transform:scale(1.15)} }
  .pv-h1 {
    font: 800 clamp(30px, 8.5vw, 42px)/1.12 'Baloo 2', sans-serif;
    margin: 16px 0 10px; text-shadow: 0 2px 0 rgba(0,0,0,.35);
  }
  .pv-h1 em { font-style: normal; color: var(--gold); }
  .pv-lead { font: 600 16px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); margin: 0 auto 18px; max-width: 460px; }
  .pv-lead strong { color: var(--pv-ink); }
  .pv-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 14px; }
  .pv-chip {
    display: inline-flex; align-items: center; gap: 6px;
    font: 700 13px/1 'Baloo 2', sans-serif; color: var(--ink-soft);
    background: rgba(255,255,255,.07); border-radius: 999px; padding: 8px 13px;
  }
  .pv-chip svg { color: var(--go); flex: none; }

  /* ── Ancrage prix (le calcul en 3 tuiles) ── */
  .pv-anchor { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 26px 0 6px; }
  .pv-an {
    background: linear-gradient(180deg, #322764, #281f58);
    border-radius: 18px; padding: 14px 10px; text-align: center;
    box-shadow: inset 0 2px 0 rgba(255,255,255,.12), 0 4px 0 #1b1442, 0 8px 16px rgba(0,0,0,.3);
  }
  .pv-an-val { font: 800 21px/1.1 'Baloo 2', sans-serif; }
  .pv-an-lbl { font: 600 12px/1.3 'Baloo 2', sans-serif; color: var(--ink-mu); margin-top: 4px; }
  .pv-an-hot { outline: 2px solid rgba(255,206,77,.5); outline-offset: -2px; }
  .pv-an-hot .pv-an-val { color: var(--gold); }

  /* ── Sections ── */
  .pv-sec { padding: 30px 0 0; }
  .pv-h2 { font: 800 clamp(22px, 6vw, 27px)/1.2 'Baloo 2', sans-serif; text-align: center; margin: 0 0 6px; text-shadow: 0 2px 0 rgba(0,0,0,.3); }
  .pv-sub { font: 600 14.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-mu); text-align: center; margin: 0 0 18px; }

  /* ── Ce que tu débloques ── */
  .pv-feats { display: flex; flex-direction: column; gap: 10px; }
  .pv-feat {
    display: flex; gap: 12px; align-items: flex-start;
    background: rgba(255,255,255,.06); border-radius: 16px; padding: 13px 14px;
  }
  .pv-feat-ico {
    flex: none; width: 38px; height: 38px; display: grid; place-items: center;
    background: linear-gradient(180deg, var(--in-lt), var(--in-dp));
    border-radius: 12px; box-shadow: inset 0 2px 0 rgba(255,255,255,.3), 0 3px 0 var(--in-dk);
    color: #fff;
  }
  .pv-feat b { display: block; font: 700 15px/1.3 'Baloo 2', sans-serif; }
  .pv-feat span { font: 600 13.5px/1.45 'Baloo 2', sans-serif; color: var(--ink-mu); }

  /* ── Pricing ── */
  .pv-cards { display: flex; flex-direction: column; gap: 14px; margin-top: 4px; }
  .pv-card {
    position: relative;
    background: linear-gradient(180deg, #322764 0%, var(--ncard) 60%, #261d56 100%);
    border-radius: 22px; padding: 20px 18px 18px;
    box-shadow:
      inset 0 3px 0 rgba(255,255,255,.15),
      inset 0 -8px 18px rgba(0,0,0,.35),
      0 8px 0 #160f38, 0 16px 28px rgba(0,0,0,.4);
  }
  .pv-card-star {
    box-shadow:
      inset 0 3px 0 rgba(255,255,255,.2),
      inset 0 -8px 18px rgba(0,0,0,.35),
      0 8px 0 #7a5510, 0 16px 32px rgba(0,0,0,.45),
      0 0 0 2.5px var(--gold);
  }
  .pv-pop {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    font: 800 12px/1 'Baloo 2', sans-serif; letter-spacing: .06em; text-transform: uppercase;
    color: #4a3300; background: linear-gradient(180deg, #ffe08a, var(--gold) 60%, var(--gold-dp));
    border-radius: 999px; padding: 8px 16px; white-space: nowrap;
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,.6), 0 3px 0 #a86e00, 0 6px 12px rgba(0,0,0,.35);
  }
  .pv-plan-name { font: 700 15px/1.2 'Baloo 2', sans-serif; color: var(--ink-soft); }
  .pv-price-row { display: flex; align-items: baseline; gap: 9px; margin: 7px 0 2px; flex-wrap: wrap; }
  .pv-price { font: 800 34px/1 'Baloo 2', sans-serif; }
  .pv-price small { font-size: 16px; font-weight: 700; color: var(--ink-soft); }
  .pv-strike { font: 700 15px/1 'Baloo 2', sans-serif; color: var(--ink-mu); text-decoration: line-through; }
  .pv-permonth { font: 700 13.5px/1.3 'Baloo 2', sans-serif; color: var(--gold); margin: 0 0 8px; }
  .pv-plan-desc { font: 600 13.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-mu); margin: 0 0 14px; }
  .pv-cta {
    width: 100%; border: 0; cursor: pointer; border-radius: 16px; padding: 15px 18px;
    font: 800 16.5px/1 'Baloo 2', sans-serif; color: #fff;
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2.5px 0 rgba(255,255,255,.35), 0 5px 0 var(--in-dk), 0 9px 16px rgba(0,0,0,.35);
    transition: transform .1s ease, box-shadow .1s ease;
    text-shadow: 0 1.5px 0 rgba(0,0,0,.3);
  }
  .pv-cta:active { transform: translateY(4px); box-shadow: inset 0 2.5px 0 rgba(255,255,255,.35), 0 1px 0 var(--in-dk), 0 3px 6px rgba(0,0,0,.3); }
  .pv-cta[disabled] { opacity: .65; cursor: wait; }
  .pv-cta-gold {
    color: #4a3300; text-shadow: 0 1px 0 rgba(255,255,255,.35);
    background: linear-gradient(180deg, #ffe08a, var(--gold) 55%, var(--gold-dp));
    box-shadow: inset 0 2.5px 0 rgba(255,255,255,.55), 0 5px 0 #a86e00, 0 9px 16px rgba(0,0,0,.35);
  }
  .pv-cta-gold:active { box-shadow: inset 0 2.5px 0 rgba(255,255,255,.55), 0 1px 0 #a86e00, 0 3px 6px rgba(0,0,0,.3); }
  .pv-err { font: 700 13px/1.4 'Baloo 2', sans-serif; color: #ffb4a8; text-align: center; margin: 10px 0 0; display: none; }
  .pv-err.on { display: block; }

  /* ── Garantie ── */
  .pv-guarantee {
    display: flex; gap: 13px; align-items: flex-start; margin-top: 16px;
    background: rgba(88,204,2,.1); border: 1.5px solid rgba(88,204,2,.35);
    border-radius: 18px; padding: 15px 16px;
  }
  .pv-guarantee svg { flex: none; color: var(--go); margin-top: 2px; }
  .pv-guarantee b { display: block; font: 700 15px/1.3 'Baloo 2', sans-serif; margin-bottom: 3px; }
  .pv-guarantee span { font: 600 13.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-soft); }
  .pv-founder { font: 700 13px/1.5 'Baloo 2', sans-serif; color: var(--gold); text-align: center; margin: 14px 0 0; }

  /* ── Preuve (AAC vs classique) ── */
  .pv-proof { background: rgba(255,255,255,.06); border-radius: 20px; padding: 18px 16px; }
  .pv-bar-row { margin-bottom: 13px; }
  .pv-bar-lbl { display: flex; justify-content: space-between; font: 700 13.5px/1 'Baloo 2', sans-serif; margin-bottom: 6px; }
  .pv-bar-lbl i { font-style: normal; color: var(--ink-mu); font-weight: 600; }
  .pv-bar { height: 14px; border-radius: 999px; background: rgba(0,0,0,.35); overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,.4); }
  .pv-bar > span { display: block; height: 100%; border-radius: 999px; }
  .pv-bar-go > span { width: 75%; background: linear-gradient(180deg, #7ee838, var(--go)); box-shadow: inset 0 2px 0 rgba(255,255,255,.4); }
  .pv-bar-mu > span { width: 58%; background: #6257a8; }
  .pv-proof-src { font: 600 11.5px/1.4 'Baloo 2', sans-serif; color: var(--ink-mu); margin: 4px 0 0; }

  /* ── Étapes ── */
  .pv-steps { display: flex; flex-direction: column; gap: 10px; counter-reset: pvstep; }
  .pv-step { display: flex; gap: 12px; align-items: flex-start; background: rgba(255,255,255,.06); border-radius: 16px; padding: 13px 14px; }
  .pv-step::before {
    counter-increment: pvstep; content: counter(pvstep);
    flex: none; width: 30px; height: 30px; display: grid; place-items: center;
    font: 800 15px/1 'Baloo 2', sans-serif; color: #4a3300;
    background: linear-gradient(180deg, #ffe08a, var(--gold) 60%, var(--gold-dp));
    border-radius: 50%; box-shadow: inset 0 1.5px 0 rgba(255,255,255,.55), 0 2.5px 0 #a86e00;
  }
  .pv-step b { display: block; font: 700 14.5px/1.3 'Baloo 2', sans-serif; }
  .pv-step span { font: 600 13px/1.45 'Baloo 2', sans-serif; color: var(--ink-mu); }

  /* ── FAQ ── */
  .pv-faq details {
    background: rgba(255,255,255,.06); border-radius: 15px; padding: 0 15px; margin-bottom: 9px;
  }
  .pv-faq summary {
    font: 700 14.5px/1.4 'Baloo 2', sans-serif; padding: 14px 0; cursor: pointer; list-style: none;
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
  }
  .pv-faq summary::-webkit-details-marker { display: none; }
  .pv-faq summary::after { content: "+"; font: 800 19px/1 'Baloo 2', sans-serif; color: var(--gold); flex: none; }
  .pv-faq details[open] summary::after { content: "–"; }
  .pv-faq p { font: 600 13.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); margin: 0 0 14px; }

  /* ── Footer ── */
  .pv-foot { text-align: center; padding: 30px 0 10px; font: 600 12.5px/1.6 'Baloo 2', sans-serif; color: var(--ink-mu); }
  .pv-foot a { color: var(--ink-soft); }

  /* ── Barre CTA collante (mobile) ── */
  .pv-sticky {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    background: rgba(22,15,56,.92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border-top: 1.5px solid rgba(255,255,255,.12);
    display: flex; align-items: center; gap: 12px; max-width: 100%;
  }
  .pv-sticky-txt { font: 700 13px/1.25 'Baloo 2', sans-serif; color: var(--ink-soft); }
  .pv-sticky-txt b { display: block; color: var(--pv-ink); font-size: 14.5px; }
  .pv-sticky .pv-cta { width: auto; flex: 1; padding: 13px 14px; font-size: 15px; }
  @media (min-width: 700px) { .pv-sticky { display: none; } .pv { padding-bottom: 40px; } }

  /* ── Retour checkout ── */
  .pv-result {
    max-width: 460px; margin: 26px auto 0; text-align: center;
    background: linear-gradient(180deg, #322764 0%, var(--ncard) 60%, #261d56 100%);
    border-radius: 24px; padding: 28px 22px;
    box-shadow: inset 0 3px 0 rgba(255,255,255,.18), 0 10px 0 #160f38, 0 20px 34px rgba(0,0,0,.5), 0 0 0 2px rgba(124,111,224,.35);
  }
  .pv-result-emo { font-size: 52px; line-height: 1; }
  .pv-result h2 { font: 800 24px/1.2 'Baloo 2', sans-serif; margin: 12px 0 8px; }
  .pv-result p { font: 600 14.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); margin: 0 0 8px; }
  .pv-result .pv-plan-pill {
    display: inline-block; font: 700 13px/1 'Baloo 2', sans-serif; color: var(--gold);
    background: rgba(255,206,77,.12); border: 1.5px solid rgba(255,206,77,.4);
    border-radius: 999px; padding: 8px 14px; margin: 6px 0 12px;
  }
  .pv-cancel-note {
    max-width: 560px; margin: 14px auto 0; padding: 12px 16px;
    background: rgba(255,206,77,.1); border: 1.5px solid rgba(255,206,77,.35); border-radius: 14px;
    font: 700 13.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-soft); text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .pv * { animation: none !important; transition: none !important; }
  }
</style>`;

/** Query params du hash (#/pass?checkout=success&plan=pass3). */
function hashQuery() {
  const q = (location.hash.split("?")[1] || "").trim();
  return new URLSearchParams(q);
}

function renderTiers() {
  return `
    <div class="pv-cards">

      <article class="pv-card">
        <div class="pv-plan-name">Mensuel</div>
        <div class="pv-price-row"><span class="pv-price">9,99 €<small>/mois</small></span></div>
        <p class="pv-plan-desc">La porte d'entrée. Sans engagement, tu arrêtes quand tu veux, en un clic.</p>
        <button class="pv-cta" data-plan="mensuel" type="button">Commencer</button>
      </article>

      <article class="pv-card pv-card-star">
        <div class="pv-pop">⭐ Le plus populaire</div>
        <div class="pv-plan-name">Pass Permis 3 mois</div>
        <div class="pv-price-row">
          <span class="pv-price">24,99 €</span>
          <span class="pv-strike">29,97 €</span>
        </div>
        <p class="pv-permonth">≈ 8,33 €/mois — tu payes une fois, c'est réglé.</p>
        <p class="pv-plan-desc">L'offre « Objectif Permis en 90 jours » : 3 mois d'accès complet, le temps de préparer et passer ton examen.</p>
        <button class="pv-cta pv-cta-gold" data-plan="pass3" type="button">Prendre le Pass 3 mois</button>
      </article>

      <article class="pv-card">
        <div class="pv-plan-name">Pass 6 mois + bonus fondateur</div>
        <div class="pv-price-row">
          <span class="pv-price">39,99 €</span>
          <span class="pv-strike">59,94 €</span>
        </div>
        <p class="pv-permonth">≈ 6,67 €/mois (−33 %) — la meilleure valeur.</p>
        <p class="pv-plan-desc">Pour la conduite accompagnée ou un permis sans pression. Bonus fondateur inclus.</p>
        <button class="pv-cta" data-plan="pass6" type="button">Prendre le Pass 6 mois</button>
      </article>

    </div>
    <p class="pv-err" id="pv-err">Le paiement n'a pas pu démarrer. Réessaie dans quelques secondes.</p>

    <div class="pv-guarantee">
      ${icon("shield", { size: 22 })}
      <div>
        <b>Pré-vente 100 % remboursable</b>
        <span>Tu changes d'avis ? Un simple message et on te rembourse. Sans question, sans délai. Tu ne risques rien.</span>
      </div>
    </div>
    <p class="pv-founder">Prix fondateur : réservé à la première promo — 20 places.</p>
  `;
}

function renderSuccess(plan) {
  const label = PLAN_LABELS[plan] || "Ton Pass Permis";
  return `
    <div class="pv-result">
      <div class="pv-result-emo">🎉</div>
      <h2>C'est validé !</h2>
      <span class="pv-plan-pill">${label}</span>
      <p><strong>Tu fais partie de la promo fondatrice.</strong> Ton reçu Stripe arrive par email.</p>
      <p>Sous 24 h, tu reçois ton accès sur ce même email — et on t'installe l'app ensemble si tu veux (promo fondatrice oblige).</p>
      <p>Une question, un souci, envie d'être remboursé ? Un message suffit.</p>
    </div>
  `;
}

export async function mount(root) {
  const me = getCurUser();
  const q = hashQuery();
  const checkout = q.get("checkout");
  const planParam = q.get("plan");

  track("pass.view", {
    logged: !!me,
    checkout_return: checkout || "none",
  });

  // ── Retour succès : écran de confirmation, pas de re-vente ──
  if (checkout === "success") {
    track("pass.checkout_success", { plan: planParam || "?" });
    root.innerHTML = `${STYLE}
      <div class="pv">
        <header class="pv-nav">
          <a class="pv-brand" href="#/pass">Permi<span class="g">Go</span></a>
        </header>
        <div class="pv-wrap">${renderSuccess(planParam)}</div>
        <footer class="pv-foot">Paiement sécurisé par Stripe · <a href="#/legal">Mentions légales</a></footer>
      </div>`;
    return;
  }

  root.innerHTML = `${STYLE}
  <div class="pv">

    <header class="pv-nav">
      <a class="pv-brand" href="#/">Permi<span class="g">Go</span></a>
      ${me ? "" : `<button class="pv-login" id="pv-login" type="button">Se connecter</button>`}
    </header>

    ${
      checkout === "cancel"
        ? `<div class="pv-cancel-note">Paiement annulé — rien n'a été débité. Ta place fondatrice t'attend juste en dessous. 👇</div>`
        : ""
    }

    <div class="pv-wrap">

      <!-- ── Hero ── -->
      <section class="pv-hero">
        <span class="pv-badge"><span class="pv-badge-dot"></span>Pré-vente · offre de lancement</span>
        <h1 class="pv-h1">Ton permis, <em>plus vite</em> et <em>moins cher</em>.</h1>
        <p class="pv-lead">
          <strong>Objectif Permis en 90 jours</strong> : révise 10 minutes par jour entre tes leçons,
          vois ta progression grimper compétence par compétence — et arrive à l'examen prêt, pas stressé.
        </p>
        <div class="pv-chips">
          <span class="pv-chip">${icon("check-circle", { size: 15 })}Paiement sécurisé Stripe</span>
          <span class="pv-chip">${icon("check-circle", { size: 15 })}100 % remboursable</span>
          <span class="pv-chip">${icon("check-circle", { size: 15 })}Programme officiel (REMC)</span>
        </div>
      </section>

      <!-- ── Ancrage prix ── -->
      <section class="pv-anchor" aria-label="Repères de prix">
        <div class="pv-an"><div class="pv-an-val">55 €</div><div class="pv-an-lbl">1 h de conduite</div></div>
        <div class="pv-an"><div class="pv-an-val">1 804 €</div><div class="pv-an-lbl">budget permis moyen</div></div>
        <div class="pv-an pv-an-hot"><div class="pv-an-val">9,99 €</div><div class="pv-an-lbl">PermiGo / mois</div></div>
      </section>
      <p class="pv-sub" style="margin-top:10px">Chaque heure de conduite ratée par manque de préparation, c'est 55 € de perdus.<br/>PermiGo te fait arriver préparé à chaque leçon.</p>

      <!-- ── Pricing ── -->
      <section class="pv-sec" id="pv-pricing">
        <h2 class="pv-h2">Choisis ton pass</h2>
        <p class="pv-sub">Un seul objectif : ton permis. Pas d'options cachées — tout est inclus, partout.</p>
        ${renderTiers()}
      </section>

      <!-- ── Ce que tu débloques ── -->
      <section class="pv-sec">
        <h2 class="pv-h2">Ce que tu débloques</h2>
        <div class="pv-feats" style="margin-top:16px">
          <div class="pv-feat">
            <span class="pv-feat-ico">${icon("zap", { size: 19 })}</span>
            <div><b>Des révisions qui donnent envie de revenir</b>
            <span>Quiz en arène, série quotidienne, ligue avec d'autres candidats : réviser devient un réflexe, pas une corvée.</span></div>
          </div>
          <div class="pv-feat">
            <span class="pv-feat-ico">${icon("trending-up", { size: 19 })}</span>
            <div><b>Ta progression visible dès la 1re session</b>
            <span>Le programme officiel du permis (REMC), compétence par compétence. Tu sais toujours où tu en es et ce qu'il te reste.</span></div>
          </div>
          <div class="pv-feat">
            <span class="pv-feat-ico">${icon("graduation-cap", { size: 19 })}</span>
            <div><b>Examens blancs code et conduite</b>
            <span>Tu t'entraînes dans les conditions du vrai examen, autant de fois que tu veux.</span></div>
          </div>
          <div class="pv-feat">
            <span class="pv-feat-ico">${icon("book-open", { size: 19 })}</span>
            <div><b>Des fiches de conduite pour préparer chaque leçon</b>
            <span>Créneau, insertion, autoroute… tu arrives en voiture en sachant déjà quoi travailler.</span></div>
          </div>
        </div>
      </section>

      <!-- ── Preuve ── -->
      <section class="pv-sec">
        <h2 class="pv-h2">S'entraîner régulièrement, ça change tout</h2>
        <p class="pv-sub">Les candidats qui pratiquent dans la durée réussissent bien plus souvent :</p>
        <div class="pv-proof">
          <div class="pv-bar-row">
            <div class="pv-bar-lbl"><span>Avec entraînement régulier (conduite accompagnée)</span><i>75 %</i></div>
            <div class="pv-bar pv-bar-go"><span></span></div>
          </div>
          <div class="pv-bar-row" style="margin-bottom:2px">
            <div class="pv-bar-lbl"><span>Filière classique</span><i>58 %</i></div>
            <div class="pv-bar pv-bar-mu"><span></span></div>
          </div>
          <p class="pv-proof-src">Taux de réussite au permis B — Sécurité routière.</p>
        </div>
      </section>

      <!-- ── Comment ça marche ── -->
      <section class="pv-sec">
        <h2 class="pv-h2">Comment ça marche</h2>
        <div class="pv-steps" style="margin-top:16px">
          <div class="pv-step"><div><b>Tu réserves ta place aujourd'hui</b>
            <span>Pré-commande remboursable : tu bloques le prix fondateur, tu ne risques rien.</span></div></div>
          <div class="pv-step"><div><b>Tu reçois ton accès sous 24 h</b>
            <span>Par email — et on t'installe l'app avec toi si tu veux, c'est le privilège de la promo fondatrice.</span></div></div>
          <div class="pv-step"><div><b>10 minutes par jour, et ça grimpe</b>
            <span>Série, ligue, examens blancs : tu suis ta progression jusqu'au jour J.</span></div></div>
        </div>
      </section>

      <!-- ── FAQ ── -->
      <section class="pv-sec pv-faq">
        <h2 class="pv-h2">Questions fréquentes</h2>
        <div style="margin-top:16px">
          <details>
            <summary>Et si je change d'avis ?</summary>
            <p>Un message, et on te rembourse intégralement. Sans question, sans formulaire, sans délai. C'est une pré-vente : c'est toi qui ne prends aucun risque.</p>
          </details>
          <details>
            <summary>Ça marche avec mon auto-école ?</summary>
            <p>Oui. PermiGo est indépendant : tu gardes ton auto-école et tes leçons, l'app t'aide à progresser entre les leçons. Si ton moniteur utilise PermiGo, ta progression se synchronise même avec lui.</p>
          </details>
          <details>
            <summary>Comment je paye ?</summary>
            <p>Par carte, Apple Pay ou Google Pay, via Stripe (le même système de paiement que des millions de sites). PermiGo ne voit jamais ta carte.</p>
          </details>
          <details>
            <summary>Le mensuel est-il engageant ?</summary>
            <p>Non. Tu peux arrêter à tout moment, en un clic. Les Pass 3 et 6 mois sont des paiements uniques : pas de renouvellement automatique, pas de surprise.</p>
          </details>
          <details>
            <summary>J'ai déjà commencé le code ailleurs, c'est grave ?</summary>
            <p>Pas du tout. PermiGo complète ce que tu utilises déjà : l'app est centrée sur ta progression réelle vers l'examen, pas sur des séries de questions à l'infini.</p>
          </details>
        </div>
      </section>

      <footer class="pv-foot">
        Paiement sécurisé par Stripe · Pré-vente remboursable sur simple demande<br/>
        <a href="#/legal">Mentions légales</a>
      </footer>
    </div>

    <!-- ── CTA collant (mobile) ── -->
    <div class="pv-sticky" id="pv-sticky">
      <div class="pv-sticky-txt">Pass 3 mois<b>24,99 € · remboursable</b></div>
      <button class="pv-cta pv-cta-gold" data-plan="pass3" type="button">Réserver ma place</button>
    </div>

  </div>`;

  wire(root, me);
}

function wire(root, me) {
  const err = root.querySelector("#pv-err");

  root.querySelector("#pv-login")?.addEventListener("click", () => {
    location.hash = "#/login";
  });

  // Un clic = une session Checkout. On fige TOUS les boutons le temps de la
  // redirection (double-tap mobile = double session sinon).
  const btns = [...root.querySelectorAll("[data-plan]")];
  btns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const plan = btn.dataset.plan;
      track("pass.checkout_click", { plan, logged: !!me });
      err?.classList.remove("on");
      btns.forEach((b) => (b.disabled = true));
      const prev = btn.textContent;
      btn.textContent = "Ouverture du paiement…";
      try {
        await startPassCheckout(plan);
        // Succès = redirection : on ne repasse jamais ici.
      } catch (e) {
        console.error("[pass] checkout", e);
        track("pass.checkout_error", { plan });
        btns.forEach((b) => (b.disabled = false));
        btn.textContent = prev;
        err?.classList.add("on");
      }
    });
  });
}
