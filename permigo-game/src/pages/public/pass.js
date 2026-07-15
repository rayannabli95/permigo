// ═══════════════════════════════════════════════════════════════
// Page publique — Pré-vente « Pass Permis » (payeur = ÉLÈVE)
// URL : #/pass  (partageable en DM : permigo.vercel.app/#/pass)
//
// DA « Ticket d'Or » (choix Rayan 15/07, maquette C + scène téléphone de B) :
// la place fondatrice est un billet doré numéroté X/20, les 3 paliers sont
// trois billets. Messages clés : c'est l'app de la CONDUITE (pas une énième
// app de code), zéro jargon technique (le mot « REMC » est banni), et le
// mini-jeu « En situation » est montré en vrai.
//
// 3 paliers : mensuel 9,99 € · Pass 3 mois 24,99 € (cible) · Pass 6 mois
// 39,99 €. Pré-commande 100 % remboursable. Marche connecté (achat rattaché
// au compte) comme invité (Stripe collecte l'email).
//
// Jauge de places : compteur RÉEL via la RPC publique pass_founder_count()
// (count des achats payés — pas de faux chiffre).
//
// Retour Checkout : #/pass?checkout=success&plan=xxx | #/pass?checkout=cancel
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { track } from "@/services/analytics.js";
import { startPassCheckout } from "@/services/billing.js";
import { getCurUser } from "@/auth/cur-user.js";

const PLAN_LABELS = {
  mensuel: "Billet Mensuel — 9,99 €/mois",
  pass3: "Billet Or · 3 mois — 24,99 €",
  pass6: "Billet Platine · 6 mois — 39,99 €",
};

const TOTAL_PLACES = 20;

const STYLE = `<style>
  .pv {
    position: relative;
    min-height: 100dvh;
    font-family: 'Baloo 2', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    --in:#6c63ff;--in-lt:#8e87ff;--in-dp:#4a3fc9;--in-dk:#372fa3;
    --gold:#ffce4d;--gold-dp:#e8a317;--go:#58cc02;
    --pv-ink:#f4f1ff;--ink-soft:#cdc8ec;--ink-mu:#aaa2d8;--ink-dim:#8b7fc4;
    --tik-ink:#3a2a05;--tik-mu:#6b520f;--tik-lbl:#8a6a17;
    color: var(--pv-ink);
    background:
      radial-gradient(100% 46% at 50% -4%, rgba(255,206,77,.16), transparent 58%),
      linear-gradient(180deg, #1b1240 0%, #241a4d 50%, #170f38 100%);
    background-color:#1b1240;
    padding-bottom: calc(88px + env(safe-area-inset-bottom));
    overflow-x: clip;
  }
  .pv * { box-sizing: border-box; }
  .pv-wrap { max-width: 560px; margin: 0 auto; padding: 0 18px; }

  /* ── Barre haute ── */
  .pv-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(14px + env(safe-area-inset-top)) 18px 4px;
    max-width: 560px; margin: 0 auto;
  }
  .pv-brand { display: flex; align-items: center; gap: 8px; font: 800 20px/1 'Baloo 2', sans-serif; color: var(--pv-ink); text-decoration: none; }
  .pv-brand img { width: 28px; height: 28px; }
  .pv-brand .g { color: var(--go); }
  .pv-login { font: 700 14px/1 'Baloo 2', sans-serif; color: var(--ink-soft); background: none; border: 0; padding: 10px 12px; cursor: pointer; border-radius: 12px; }
  .pv-login:active { background: rgba(255,255,255,.08); }

  /* ── Hero ── */
  .pv-hero { text-align: center; padding-top: 22px; }
  .pv-kicker { font: 700 12px/1 Inter, sans-serif; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-mu); }
  .pv-h1 { font: 800 clamp(36px, 10vw, 44px)/1.05 'Baloo 2', sans-serif; margin: 12px 0 10px; text-shadow: 0 3px 0 rgba(12,7,32,.8); }
  .pv-h1 em { font-style: normal; color: var(--gold); }
  .pv-lead { font: 600 15.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); max-width: 340px; margin: 0 auto; }
  .pv-lead strong { color: var(--gold); }

  /* ── LE billet d'or ── */
  .pv-ticket-scene { position: relative; margin: 28px auto 0; max-width: 400px; filter: drop-shadow(0 30px 40px rgba(0,0,0,.55)); }
  .pv-ticket {
    position: relative; transform: rotate(-2.5deg);
    background:
      radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,.35), transparent 40%),
      linear-gradient(115deg, #f6d267 0%, #ffe9a8 22%, #eab63a 48%, #ffdf8a 70%, #d99c1e 100%);
    border-radius: 20px; color: var(--tik-ink); overflow: hidden;
  }
  .pv-ticket::before {
    content: ""; position: absolute; top: 0; bottom: 0; left: calc(100% - 96px); width: 0;
    border-left: 2.5px dashed rgba(58,42,5,.4);
  }
  .pv-t-inner { display: flex; }
  .pv-t-main { flex: 1; padding: 18px 14px 16px 18px; }
  .pv-t-stub { width: 96px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px 6px; text-align: center; }
  .pv-t-brand { display: flex; align-items: center; gap: 7px; font: 800 14px/1 'Baloo 2', sans-serif; letter-spacing: .02em; }
  .pv-t-brand img { width: 20px; height: 20px; }
  .pv-t-title { font: 800 23px/1.05 'Baloo 2', sans-serif; margin: 9px 0 3px; letter-spacing: -.01em; }
  .pv-t-sub { font: 600 11.5px/1.4 Inter, sans-serif; color: var(--tik-mu); }
  .pv-t-meta { display: flex; gap: 14px; margin-top: 12px; }
  .pv-t-meta div b { display: block; font: 700 10px/1 Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--tik-lbl); margin-bottom: 2px; }
  .pv-t-meta div span { font: 600 13px/1 'IBM Plex Mono', monospace; }
  .pv-t-stub .n { font: 600 11px/1 Inter, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: var(--tik-lbl); }
  .pv-t-place { font: 800 26px/1 'Baloo 2', sans-serif; }
  .pv-t-place small { font-size: 14px; }
  .pv-t-barcode {
    width: 64px; height: 34px; border-radius: 3px; opacity: .85;
    background: repeating-linear-gradient(90deg, #3a2a05 0 2px, transparent 2px 5px, #3a2a05 5px 6px, transparent 6px 10px);
  }
  .pv-t-shine { position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.5) 44%, transparent 56%);
    mix-blend-mode: soft-light;
  }

  /* compteur de places (chiffre réel) */
  .pv-counter { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 22px; min-height: 20px; }
  .pv-pips { display: flex; gap: 4px; }
  .pv-pip { width: 11px; height: 16px; border-radius: 3px; background: rgba(255,255,255,.12); }
  .pv-pip.on { background: linear-gradient(180deg, #ffe08a, var(--gold-dp)); box-shadow: 0 0 8px rgba(255,206,77,.5); }
  .pv-counter b { font: 700 13px/1.2 'Baloo 2', sans-serif; color: var(--gold); }

  /* CTA principal */
  .pv-cta-hero {
    display: block; width: 100%; max-width: 340px; margin: 22px auto 0;
    border: 0; cursor: pointer; border-radius: 18px; padding: 17px;
    font: 800 17px/1 'Baloo 2', sans-serif; color: #4a3300; text-shadow: 0 1px 0 rgba(255,255,255,.35);
    background: linear-gradient(180deg, #ffe08a, var(--gold) 55%, var(--gold-dp));
    box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 6px 0 #a86e00, 0 12px 26px rgba(0,0,0,.4);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pv-cta-hero:active { transform: translateY(4px); box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 2px 0 #a86e00, 0 4px 8px rgba(0,0,0,.3); }
  .pv-cta-hero[disabled] { opacity: .65; cursor: wait; }
  .pv-cta-note { text-align: center; font: 600 12.5px/1.5 Inter, sans-serif; color: var(--ink-dim); margin: 12px 0 0; }
  .pv-cta-note b { color: var(--ink-soft); }

  /* ── Scène téléphone + mascotte (Arène) ── */
  .pv-stage { position: relative; height: 470px; max-width: 400px; margin: 44px auto 0; }
  .pv-phone {
    position: absolute; left: 50%; transform: translateX(-26%) rotate(4deg); top: 0; width: 196px;
    border-radius: 30px; overflow: hidden; border: 6px solid #160f38;
    box-shadow: 0 24px 50px rgba(0,0,0,.55), 0 0 0 2px rgba(142,135,255,.5);
  }
  .pv-phone img { display: block; width: 100%; height: auto; }
  .pv-mascot { position: absolute; left: -8px; bottom: 0; width: 180px; z-index: 3; filter: drop-shadow(0 18px 30px rgba(0,0,0,.5)); }
  .pv-coin { position: absolute; z-index: 3; right: 4px; top: -6px; width: 72px; transform: rotate(12deg); filter: drop-shadow(0 10px 18px rgba(0,0,0,.45)); }
  .pv-bulle {
    position: absolute; z-index: 3; right: 0; bottom: 116px;
    background: #fff; color: #231603; border-radius: 16px 16px 4px 16px; padding: 10px 14px;
    font: 700 13px/1.3 'Baloo 2', sans-serif; box-shadow: 0 8px 20px rgba(0,0,0,.4);
  }
  .pv-bulle small { display: block; color: #8a7a52; font-weight: 600; font-size: 11px; }

  /* ── Sections ── */
  .pv-sec-title { text-align: center; font: 800 clamp(24px, 7vw, 28px)/1.15 'Baloo 2', sans-serif; margin: 52px 0 0; text-shadow: 0 3px 0 rgba(12,7,32,.8); }
  .pv-sec-title em { font-style: normal; color: var(--gold); }
  .pv-sec-sub { text-align: center; font: 600 13.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-mu); margin: 8px auto 22px; max-width: 340px; }

  /* ── « Pas une app de code » ── */
  .pv-conduite { display: flex; flex-direction: column; gap: 12px; }
  .pv-situ {
    display: flex; gap: 14px; align-items: center;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
    border-radius: 20px; padding: 14px;
  }
  .pv-situ-shot {
    flex: none; width: 138px; border-radius: 16px; overflow: hidden;
    border: 4px solid #160f38; box-shadow: 0 10px 24px rgba(0,0,0,.45), 0 0 0 1.5px rgba(142,135,255,.45);
  }
  .pv-situ-shot img { display: block; width: 100%; height: auto; }
  .pv-situ-txt b { display: block; font: 800 16px/1.25 'Baloo 2', sans-serif; margin-bottom: 5px; }
  .pv-situ-txt span { font: 600 12.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-mu); }
  .pv-feat {
    display: flex; gap: 12px; align-items: flex-start;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); border-radius: 16px; padding: 13px 14px;
  }
  .pv-feat-ico {
    flex: none; width: 38px; height: 38px; display: grid; place-items: center; font-size: 17px;
    background: linear-gradient(180deg, var(--in-lt), var(--in-dp));
    border-radius: 12px; box-shadow: inset 0 2px 0 rgba(255,255,255,.3), 0 3px 0 var(--in-dk);
  }
  .pv-feat b { display: block; font: 700 15px/1.3 'Baloo 2', sans-serif; }
  .pv-feat span { font: 600 13px/1.45 'Baloo 2', sans-serif; color: var(--ink-mu); }

  /* ── L'addition (ancrage) ── */
  .pv-maths { margin-top: 22px; border-radius: 20px; padding: 8px 18px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); }
  .pv-maths-row { display: flex; justify-content: space-between; align-items: baseline; padding: 13px 0; font: 500 14px Inter, sans-serif; color: var(--ink-soft); }
  .pv-maths-row + .pv-maths-row { border-top: 1px dashed rgba(255,255,255,.1); }
  .pv-maths-row b { font: 700 16px 'Baloo 2', sans-serif; color: #fff; }
  .pv-maths-row.hot { color: var(--gold); }
  .pv-maths-row.hot b { color: var(--gold); font-size: 18px; }
  .pv-maths-note { text-align: center; font: 600 12.5px/1.6 'Baloo 2', sans-serif; color: var(--ink-dim); margin: 12px 0 0; }

  /* ── Les 3 billets ── */
  .pv-pass { position: relative; display: flex; border-radius: 18px; margin-bottom: 14px; box-shadow: 0 14px 28px rgba(0,0,0,.4); }
  .pv-pass-main { flex: 1; padding: 16px 14px 15px 18px; border-radius: 18px 0 0 18px; }
  .pv-pass-cut {
    width: 116px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 8px; border-left: 2px dashed rgba(255,255,255,.25); border-radius: 0 18px 18px 0;
  }
  .pv-pass-std { background: linear-gradient(180deg, #352a6e, #2b2160); }
  .pv-pass-std .pv-pass-cut { border-left-color: rgba(255,255,255,.18); background: rgba(0,0,0,.18); }
  .pv-pass-name { font: 800 17px/1.2 'Baloo 2', sans-serif; }
  .pv-pass-desc { font: 600 12.5px/1.45 'Baloo 2', sans-serif; color: var(--ink-mu); margin-top: 3px; }
  .pv-pass-price { font: 800 24px/1 'Baloo 2', sans-serif; }
  .pv-pass-price small { font-size: 12px; color: var(--ink-mu); }
  .pv-pass-strike { font: 600 12px Inter, sans-serif; color: var(--ink-dim); text-decoration: line-through; }
  .pv-pass-btn {
    border: 0; cursor: pointer; border-radius: 12px; padding: 11px 14px; width: 100%;
    font: 800 13.5px 'Baloo 2', sans-serif; color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.25);
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 4px 0 var(--in-dk);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pv-pass-btn:active { transform: translateY(3px); box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 1px 0 var(--in-dk); }
  .pv-pass-btn[disabled] { opacity: .65; cursor: wait; }

  .pv-pass-gold {
    transform: scale(1.04); margin: 24px 0;
    background:
      radial-gradient(120% 90% at 15% 0%, rgba(255,255,255,.4), transparent 40%),
      linear-gradient(115deg, #f6d267 0%, #ffe9a8 25%, #eab63a 55%, #d99c1e 100%);
    color: var(--tik-ink);
    box-shadow: 0 20px 40px rgba(0,0,0,.5), 0 0 60px rgba(255,206,77,.25);
  }
  .pv-pass-gold .pv-pass-desc { color: var(--tik-mu); }
  .pv-pass-gold .pv-pass-cut { border-left-color: rgba(58,42,5,.4); background: rgba(255,255,255,.14); }
  .pv-pass-gold .pv-pass-strike { color: var(--tik-lbl); }
  .pv-pass-gold .pv-pass-btn {
    background: linear-gradient(180deg, var(--in-dp), var(--in-dk));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.3), 0 4px 0 #241c6e;
  }
  .pv-pass-permo { font: 700 12px/1.3 'Baloo 2', sans-serif; color: var(--tik-mu); margin-top: 4px; }
  .pv-pass-tag {
    position: absolute; top: -11px; left: 16px; z-index: 1;
    font: 800 10.5px/1 Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #fff;
    background: #e2513f; padding: 7px 12px; border-radius: 99px; box-shadow: 0 4px 10px rgba(0,0,0,.35);
  }
  .pv-err { font: 700 13px/1.4 'Baloo 2', sans-serif; color: #ffb4a8; text-align: center; margin: 4px 0 0; display: none; }
  .pv-err.on { display: block; }

  /* ── Garantie (zone tamponnée) ── */
  .pv-stamp-zone { position: relative; margin-top: 26px; padding: 20px 18px; border-radius: 20px; border: 2px dashed rgba(88,204,2,.5); text-align: center; }
  .pv-stamp-zone b { display: block; font: 800 16.5px/1.3 'Baloo 2', sans-serif; margin-bottom: 4px; }
  .pv-stamp-zone span { font: 600 13px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); }
  .pv-stamp {
    position: absolute; top: -16px; right: 10px; transform: rotate(9deg);
    font: 800 11px/1 Inter, sans-serif; letter-spacing: .1em; text-transform: uppercase;
    color: #7ee838; border: 2.5px solid var(--go); border-radius: 8px; padding: 7px 10px;
    background: rgba(20,40,4,.6);
  }

  /* ── Preuve ── */
  .pv-proof { margin-top: 20px; }
  .pv-bar-lbl { display: flex; justify-content: space-between; font: 600 13px Inter, sans-serif; margin-bottom: 6px; color: var(--ink-soft); }
  .pv-bar { height: 12px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; margin-bottom: 14px; }
  .pv-bar span { display: block; height: 100%; border-radius: 99px; }
  .pv-bar-go span { width: 75%; background: linear-gradient(90deg, var(--go), #8aec3c); }
  .pv-bar-mu span { width: 58%; background: #5c519f; }
  .pv-src { text-align: center; font: 500 11px Inter, sans-serif; color: #655a97; margin: 0; }

  /* ── FAQ ── */
  .pv-faq details { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 15px; padding: 0 15px; margin-bottom: 9px; }
  .pv-faq summary {
    font: 700 14.5px/1.4 'Baloo 2', sans-serif; padding: 14px 0; cursor: pointer; list-style: none;
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
  }
  .pv-faq summary::-webkit-details-marker { display: none; }
  .pv-faq summary::after { content: "+"; font: 800 19px/1 'Baloo 2', sans-serif; color: var(--gold); flex: none; }
  .pv-faq details[open] summary::after { content: "–"; }
  .pv-faq p { font: 600 13.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); margin: 0 0 14px; }

  .pv-foot { text-align: center; padding: 36px 0 10px; font: 600 12px/1.7 'Baloo 2', sans-serif; color: var(--ink-dim); }
  .pv-foot a { color: var(--ink-soft); }

  /* ── Barre CTA collante (mobile) ── */
  .pv-sticky {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    background: rgba(18,11,44,.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border-top: 1.5px solid rgba(255,206,77,.25);
    display: flex; align-items: center; gap: 12px;
  }
  .pv-sticky-txt { font: 700 12.5px/1.25 'Baloo 2', sans-serif; color: var(--ink-soft); white-space: nowrap; }
  .pv-sticky-txt b { display: block; color: var(--gold); font-size: 14.5px; }
  .pv-sticky-btn {
    flex: 1; border: 0; cursor: pointer; border-radius: 14px; padding: 13px 14px;
    font: 800 15px/1 'Baloo 2', sans-serif; color: #4a3300; text-shadow: 0 1px 0 rgba(255,255,255,.35);
    background: linear-gradient(180deg, #ffe08a, var(--gold) 55%, var(--gold-dp));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.55), 0 4px 0 #a86e00;
  }
  .pv-sticky-btn[disabled] { opacity: .65; cursor: wait; }
  @media (min-width: 700px) { .pv-sticky { display: none; } .pv { padding-bottom: 40px; } }

  /* ── Retour checkout ── */
  .pv-result { max-width: 400px; margin: 26px auto 0; filter: drop-shadow(0 30px 40px rgba(0,0,0,.55)); }
  .pv-result-note { text-align: center; font: 600 14px/1.6 'Baloo 2', sans-serif; color: var(--ink-soft); max-width: 340px; margin: 24px auto 0; }
  .pv-result-note strong { color: var(--gold); }
  .pv-cancel-note {
    max-width: 524px; margin: 14px auto 0; padding: 12px 16px;
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

/** Le billet d'or (hero + écran de succès). stamped = billet validé (succès). */
function renderTicket({ stamped = false } = {}) {
  return `
    <div class="pv-ticket-scene">
      <div class="pv-ticket">
        <div class="pv-t-inner">
          <div class="pv-t-main">
            <div class="pv-t-brand"><img src="/permigo-logo.png" alt="" width="20" height="20">PERMIGO</div>
            <div class="pv-t-title">OBJECTIF PERMIS<br>EN 90 JOURS</div>
            <div class="pv-t-sub">Conduite · mini-jeux · examens blancs · suivi de progression</div>
            <div class="pv-t-meta">
              <div><b>Embarquement</b><span>JUIL. 2026</span></div>
              <div><b>Tarif fondateur</b><span>24,99 €</span></div>
            </div>
          </div>
          <div class="pv-t-stub">
            <span class="n">Place</span>
            <span class="pv-t-place">${stamped ? "✔" : `N° <span id="pv-place-no">—</span><small>/${TOTAL_PLACES}</small>`}</span>
            <div class="pv-t-barcode"></div>
          </div>
        </div>
        <div class="pv-t-shine"></div>
      </div>
    </div>`;
}

function renderSuccess(plan) {
  const label = PLAN_LABELS[plan] || "Ton Pass Permis";
  return `
    <div class="pv-result">${renderTicket({ stamped: true })}</div>
    <div class="pv-result-note">
      <strong>Billet validé — bienvenue dans la promo fondatrice ! 🎉</strong><br>
      ${label}. Ton reçu Stripe arrive par email.<br><br>
      Sous 24 h, tu reçois ton accès sur ce même email — et on t'installe l'app ensemble si tu veux.
      Une question, envie d'être remboursé ? Un message suffit.
    </div>`;
}

export async function mount(root) {
  const me = getCurUser();
  const q = hashQuery();
  const checkout = q.get("checkout");
  const planParam = q.get("plan");

  track("pass.view", { logged: !!me, checkout_return: checkout || "none" });

  // ── Retour succès : billet tamponné, pas de re-vente ──
  if (checkout === "success") {
    track("pass.checkout_success", { plan: planParam || "?" });
    root.innerHTML = `${STYLE}
      <div class="pv">
        <header class="pv-nav">
          <a class="pv-brand" href="#/pass"><img src="/permigo-logo.png" alt="">Permi<span class="g">Go</span></a>
        </header>
        <div class="pv-wrap">${renderSuccess(planParam)}</div>
        <footer class="pv-foot">Paiement sécurisé par Stripe · <a href="#/legal">Mentions légales</a></footer>
      </div>`;
    return;
  }

  root.innerHTML = `${STYLE}
  <div class="pv">

    <header class="pv-nav">
      <a class="pv-brand" href="#/"><img src="/permigo-logo.png" alt="">Permi<span class="g">Go</span></a>
      ${me ? "" : `<button class="pv-login" id="pv-login" type="button">Se connecter</button>`}
    </header>

    ${
      checkout === "cancel"
        ? `<div class="pv-cancel-note">Paiement annulé — rien n'a été débité. Ton billet t'attend juste en dessous. 👇</div>`
        : ""
    }

    <div class="pv-wrap">

      <!-- ── Hero ── -->
      <section class="pv-hero">
        <div class="pv-kicker">Promo fondatrice — ${TOTAL_PLACES} places</div>
        <h1 class="pv-h1">Réserve ta place.<br><em>Passe en 90 jours.</em></h1>
        <p class="pv-lead">La seule app qui t'entraîne à la <strong>conduite</strong> entre tes leçons — pas une énième app de code. 10 minutes par jour, et tu montes en voiture déjà prêt.</p>
      </section>

      ${renderTicket()}

      <div class="pv-counter" id="pv-counter" hidden>
        <div class="pv-pips" id="pv-pips"></div>
        <b id="pv-count-txt"></b>
      </div>

      <button class="pv-cta-hero" data-plan="pass3" type="button">Réserver ma place — 24,99 €</button>
      <p class="pv-cta-note">Paiement sécurisé Stripe · <b>100 % remboursable</b> sur simple message · prix bloqué à vie</p>

      <!-- ── Scène Arène : l'app que tu reçois ── -->
      <div class="pv-stage" aria-hidden="true">
        <div class="pv-phone"><img src="/showcase/eleve-parcours.png" alt="" width="390" height="844" loading="lazy" decoding="async"></div>
        <img class="pv-coin" src="/skins/volant-coin.webp" alt="" loading="lazy" decoding="async">
        <img class="pv-mascot" src="/skins/mascot-celebrate.png" alt="" loading="lazy" decoding="async">
        <div class="pv-bulle">3 compétences validées !<small>cette semaine</small></div>
      </div>

      <!-- ── Pas une app de code ── -->
      <h2 class="pv-sec-title">Le code, tout le monde le fait.<br>Nous, on bosse ta <em>conduite</em>.</h2>
      <p class="pv-sec-sub">Ce qui fait rater le permis, c'est la conduite. PermiGo est la seule app qui t'entraîne dessus entre les leçons :</p>

      <div class="pv-conduite">
        <div class="pv-situ">
          <div class="pv-situ-shot"><img src="/showcase/eleve-en-situation.png" alt="Mini-jeu En situation : une scène de croisement, à toi de décider qui passe en premier" loading="lazy" decoding="async"></div>
          <div class="pv-situ-txt">
            <b>Mini-jeux « En situation »</b>
            <span>Une scène animée, une décision : qui passe en premier ? Tu appliques les priorités, les distances, les insertions — comme au volant, sans le stress.</span>
          </div>
        </div>
        <div class="pv-feat">
          <span class="pv-feat-ico" aria-hidden="true">🚗</span>
          <div><b>Chaque leçon préparée à l'avance</b>
          <span>Créneau, autoroute, giratoire… une fiche claire avant de monter en voiture. Tu ne découvres plus rien sur place.</span></div>
        </div>
        <div class="pv-feat">
          <span class="pv-feat-ico" aria-hidden="true">🎓</span>
          <div><b>Examens blancs de conduite</b>
          <span>Tu t'entraînes sur les compétences officielles de l'examen — les mêmes que le moniteur valide le jour J.</span></div>
        </div>
        <div class="pv-feat">
          <span class="pv-feat-ico" aria-hidden="true">🔥</span>
          <div><b>Et ça donne envie de revenir</b>
          <span>Série quotidienne, ligue avec d'autres candidats, récompenses. Réviser devient un réflexe, pas une corvée. (Oui, le code y est aussi.)</span></div>
        </div>
      </div>

      <!-- ── L'addition ── -->
      <div class="pv-maths">
        <div class="pv-maths-row"><span>1 heure de conduite</span><b>55 €</b></div>
        <div class="pv-maths-row"><span>Budget permis moyen en France</span><b>1 804 €</b></div>
        <div class="pv-maths-row hot"><span>PermiGo, par mois</span><b>9,99 €</b></div>
      </div>
      <p class="pv-maths-note">Chaque leçon mal préparée, c'est 55 € de perdus.<br>PermiGo te fait monter en voiture déjà prêt.</p>

      <!-- ── Les 3 billets ── -->
      <h2 class="pv-sec-title" id="pv-pricing">Trois billets, un objectif</h2>
      <p class="pv-sec-sub">Tout est inclus dans chacun. Choisis ton horizon.</p>

      <article class="pv-pass pv-pass-std">
        <div class="pv-pass-main">
          <div class="pv-pass-name">Billet Mensuel</div>
          <div class="pv-pass-desc">Sans engagement — stop en un clic.</div>
        </div>
        <div class="pv-pass-cut">
          <div class="pv-pass-price">9,99 €<small>/mois</small></div>
          <button class="pv-pass-btn" data-plan="mensuel" type="button">Commencer</button>
        </div>
      </article>

      <article class="pv-pass pv-pass-gold">
        <span class="pv-pass-tag">Le plus choisi</span>
        <div class="pv-pass-main">
          <div class="pv-pass-name">Billet Or · 3 mois</div>
          <div class="pv-pass-desc">« Objectif Permis en 90 jours » — le temps de préparer et de passer ton exam.</div>
          <div class="pv-pass-permo">≈ 8,33 €/mois, payé une fois.</div>
        </div>
        <div class="pv-pass-cut">
          <div class="pv-pass-strike">29,97 €</div>
          <div class="pv-pass-price">24,99 €</div>
          <button class="pv-pass-btn" data-plan="pass3" type="button">Réserver</button>
        </div>
      </article>

      <article class="pv-pass pv-pass-std">
        <div class="pv-pass-main">
          <div class="pv-pass-name">Billet Platine · 6 mois</div>
          <div class="pv-pass-desc">Conduite accompagnée, zéro pression. + bonus fondateur.</div>
        </div>
        <div class="pv-pass-cut">
          <div class="pv-pass-strike">59,94 €</div>
          <div class="pv-pass-price">39,99 €</div>
          <button class="pv-pass-btn" data-plan="pass6" type="button">Réserver</button>
        </div>
      </article>

      <p class="pv-err" id="pv-err">Le paiement n'a pas pu démarrer. Réessaie dans quelques secondes.</p>

      <div class="pv-stamp-zone">
        <span class="pv-stamp">Garanti</span>
        <b>Remboursable sur simple message</b>
        <span>Pré-vente : tu changes d'avis, on te rembourse. Sans question, sans délai. Le risque est pour nous, pas pour toi.</span>
      </div>

      <!-- ── Preuve ── -->
      <h2 class="pv-sec-title">S'entraîner régulièrement, ça paie</h2>
      <p class="pv-sec-sub">Les candidats qui pratiquent dans la durée réussissent bien plus souvent :</p>
      <div class="pv-proof">
        <div class="pv-bar-lbl"><span>Avec entraînement régulier (accompagné)</span><span>75 %</span></div>
        <div class="pv-bar pv-bar-go"><span></span></div>
        <div class="pv-bar-lbl"><span>Filière classique</span><span>58 %</span></div>
        <div class="pv-bar pv-bar-mu"><span></span></div>
        <p class="pv-src">Taux de réussite au permis B — Sécurité routière.</p>
      </div>

      <!-- ── FAQ ── -->
      <section class="pv-faq">
        <h2 class="pv-sec-title">Questions fréquentes</h2>
        <div style="margin-top:16px">
          <details>
            <summary>C'est encore une app de code de la route ?</summary>
            <p>Non — et c'est le point. Le code y est (quiz, examens blancs), mais ce qu'aucune autre app ne fait, c'est t'entraîner à la <strong>conduite</strong> : mini-jeux de situations, fiches pour préparer chaque leçon, examens blancs de conduite, et ta progression sur les compétences officielles de l'examen.</p>
          </details>
          <details>
            <summary>Et si je change d'avis ?</summary>
            <p>Un message, et on te rembourse intégralement. Sans question, sans formulaire, sans délai. C'est une pré-vente : c'est toi qui ne prends aucun risque.</p>
          </details>
          <details>
            <summary>Ça marche avec mon auto-école ?</summary>
            <p>Oui. Tu gardes ton auto-école et tes leçons — PermiGo t'aide à progresser entre les leçons. Si ton moniteur utilise PermiGo, ta progression se synchronise même avec lui.</p>
          </details>
          <details>
            <summary>Comment je paye ?</summary>
            <p>Par carte, Apple Pay ou Google Pay, via Stripe (le même système de paiement que des millions de sites). PermiGo ne voit jamais ta carte.</p>
          </details>
          <details>
            <summary>Le mensuel est-il engageant ?</summary>
            <p>Non. Tu peux arrêter à tout moment, en un clic. Les Billets Or et Platine sont des paiements uniques : pas de renouvellement automatique, pas de surprise.</p>
          </details>
        </div>
      </section>

      <footer class="pv-foot">
        Paiement sécurisé par Stripe · Pré-vente remboursable sur simple demande<br>
        <a href="#/legal">Mentions légales</a>
      </footer>
    </div>

    <!-- ── CTA collant (mobile) ── -->
    <div class="pv-sticky">
      <div class="pv-sticky-txt">Billet Or · 3 mois<b>24,99 € · remboursable</b></div>
      <button class="pv-sticky-btn" data-plan="pass3" type="button">Réserver ma place</button>
    </div>

  </div>`;

  wire(root, me);
  loadFounderCount(root);
}

/** Jauge de places : chiffre RÉEL (RPC publique pass_founder_count). En cas
 *  d'échec, la jauge reste cachée et le billet garde « N° — » (pas de faux chiffre). */
async function loadFounderCount(root) {
  try {
    const { data, error } = await sb.rpc("pass_founder_count");
    if (error) throw error;
    const taken = Math.max(0, Math.min(TOTAL_PLACES, Number(data) || 0));
    // Numéro du billet = prochaine place libre.
    const no = root.querySelector("#pv-place-no");
    if (no)
      no.textContent = String(Math.min(taken + 1, TOTAL_PLACES)).padStart(
        2,
        "0",
      );
    // Jauge 10 crans pour 20 places (1 cran = 2 places).
    const pips = root.querySelector("#pv-pips");
    const txt = root.querySelector("#pv-count-txt");
    const counter = root.querySelector("#pv-counter");
    if (pips && txt && counter) {
      const lit = Math.round((taken / TOTAL_PLACES) * 10);
      pips.innerHTML = Array.from(
        { length: 10 },
        (_, i) => `<i class="pv-pip${i < lit ? " on" : ""}"></i>`,
      ).join("");
      txt.textContent =
        taken > 0
          ? `${taken} place${taken > 1 ? "s" : ""} prise${taken > 1 ? "s" : ""} sur ${TOTAL_PLACES}`
          : `${TOTAL_PLACES} places fondatrices — prix bloqué à vie`;
      counter.hidden = false;
    }
  } catch (e) {
    console.warn("[pass] founder count", e);
  }
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
        err?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  });
}
