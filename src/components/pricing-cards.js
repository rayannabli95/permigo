/**
 * Section Pricing — 3 plans avec toggle Mensuel/Annuel.
 *
 * Stratégie business :
 *  - Essentiel (29€) : pénètre le marché des solos/artisans
 *  - Pro (49€) : sweet spot, badge "Recommandé", 80% des conversions
 *  - Réseau (79€) : sales-led, ancre les autres prix vers le haut
 *  - Annuel = -20% → biais cohérence + cashflow + réduit churn
 *
 * Reveal au scroll (IntersectionObserver), pas de framer-motion.
 */

import { esc } from '@/utils/escape.js';

const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    desc: 'Pour les auto-écoles solos ou 1-2 enseignants qui veulent abandonner le papier.',
    price: 29,
    yearMonthly: 23, // 23€/mois facturé annuellement → 276€/an au lieu de 348€
    cta: 'Démarrer 14 jours',
    ctaAction: 'signup',
    features: [
      'Tout l\'essentiel pour commencer :',
      'Planning enseignant illimité',
      'Livret REMC numérique officiel',
      'Réservation autonome des élèves',
      'Suivi forfaits & paiements',
      'Application mobile élève',
      'Support par email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'Pour les écoles de 3 à 10 enseignants. Le choix de la majorité.',
    price: 49,
    yearMonthly: 39,
    cta: 'Démarrer 14 jours',
    ctaAction: 'signup',
    popular: true,
    features: [
      'Tout Essentiel, plus :',
      'Rappels SMS automatiques aux élèves',
      'Taux de réussite par enseignant',
      'Évaluations anonymes des élèves',
      'Statistiques d\'occupation détaillées',
      'Export comptable mensuel',
      'Support prioritaire (réponse en 4h)',
    ],
  },
  {
    id: 'reseau',
    name: 'Réseau',
    desc: 'Pour les franchises et réseaux multi-agences qui veulent tout piloter.',
    price: 79,
    yearMonthly: 63,
    cta: 'Demander un devis',
    ctaAction: 'contact',
    features: [
      'Tout Pro, plus :',
      'Multi-agences avec vue consolidée',
      'API & exports personnalisés',
      'Onboarding sur site inclus',
      'Manager dédié + SLA garanti',
      'Audit pédagogique trimestriel',
      'Tarif négociable au-delà de 20 enseignants',
    ],
  },
];

export function renderPricingSection() {
  return `
    <section class="pc-section" id="ld-pricing">
      <!-- Effets ambient -->
      <div class="pc-grid-bg" aria-hidden="true"></div>
      <div class="pc-ellipse" aria-hidden="true"></div>
      <div class="pc-sparkles" aria-hidden="true">
        ${Array.from({ length: 80 }, (_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 6;
          const dur = 4 + Math.random() * 4;
          const size = 0.6 + Math.random() * 1.2;
          return `<span style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;width:${size}px;height:${size}px"></span>`;
        }).join('')}
      </div>

      <!-- En-tête -->
      <div class="pc-header reveal">
        <div class="pc-eyebrow">Tarif</div>
        <h2 class="pc-title">Un prix juste pour chaque auto-école.</h2>
        <p class="pc-sub">Aucun frais caché. Aucune option à débloquer. Vous payez par enseignant, point.</p>

        <!-- Toggle Mensuel / Annuel -->
        <div class="pc-toggle-wrap">
          <div class="pc-toggle" role="tablist" aria-label="Période de facturation">
            <button class="pc-toggle-btn pc-toggle-on" data-period="m" role="tab" aria-selected="true">
              <span class="pc-pill"></span>
              <span class="pc-toggle-lbl">Mensuel</span>
            </button>
            <button class="pc-toggle-btn" data-period="y" role="tab" aria-selected="false">
              <span class="pc-toggle-lbl">Annuel <span class="pc-save">-20%</span></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Cards -->
      <div class="pc-grid reveal reveal-stagger">
        ${PLANS.map(p => renderPlan(p)).join('')}
      </div>

      <!-- Trust note -->
      <div class="pc-trust reveal">
        <span>14 jours d'essai · sans carte bancaire · sans engagement · données hébergées en Europe</span>
      </div>
    </section>
  `;
}

function renderPlan(p) {
  return `
    <article class="pc-card ${p.popular ? 'pc-pop' : ''}" data-plan="${esc(p.id)}">
      ${p.popular ? `<div class="pc-badge">Recommandé</div>` : ''}
      <header class="pc-card-h">
        <h3 class="pc-name">${esc(p.name)}</h3>
        <div class="pc-price-row">
          <span class="pc-cur">€</span><span class="pc-price" data-price-m="${p.price}" data-price-y="${p.yearMonthly}">${p.price}</span>
          <span class="pc-period">/mois<br><span class="pc-period-sub" data-sub-m="par enseignant" data-sub-y="facturé annuellement">par enseignant</span></span>
        </div>
        <p class="pc-desc">${esc(p.desc)}</p>
      </header>

      <button class="pc-cta ${p.popular ? 'pc-cta-pop' : ''}" data-action="${esc(p.ctaAction)}">
        ${esc(p.cta)}
      </button>

      <div class="pc-feat-h">${esc(p.features[0])}</div>
      <ul class="pc-feat">
        ${p.features.slice(1).map(f => `<li><span class="pc-dot"></span><span>${esc(f)}</span></li>`).join('')}
      </ul>
    </article>
  `;
}

/** Wire le toggle Mensuel/Annuel + les CTAs. */
export function wirePricingSection(root, { onSignup, onContact } = {}) {
  const section = root.querySelector('.pc-section');
  if (!section) return;

  const buttons = section.querySelectorAll('.pc-toggle-btn');
  const updatePrices = (period) => {
    section.querySelectorAll('.pc-price').forEach(el => {
      const newVal = period === 'y' ? el.dataset.priceY : el.dataset.priceM;
      // Anim simple : fade + bump
      el.classList.add('pc-price-flip');
      setTimeout(() => {
        el.textContent = newVal;
        el.classList.remove('pc-price-flip');
      }, 150);
    });
    section.querySelectorAll('.pc-period-sub').forEach(el => {
      el.textContent = period === 'y' ? el.dataset.subY : el.dataset.subM;
    });
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('pc-toggle-on');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('pc-toggle-on');
      btn.setAttribute('aria-selected', 'true');
      updatePrices(btn.dataset.period);
    });
  });

  // CTAs
  section.querySelectorAll('[data-action]').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.action === 'signup' && typeof onSignup === 'function') onSignup();
      if (b.dataset.action === 'contact' && typeof onContact === 'function') onContact();
    });
  });
}

export const PRICING_CSS = `
  .pc-section{position:relative;padding:90px 18px 60px;overflow:hidden;background:transparent}
  @media (max-width:720px){.pc-section{padding:60px 14px 40px}}

  /* Grid pattern background */
  .pc-grid-bg{position:absolute;inset:0;top:0;height:420px;pointer-events:none;background-image:linear-gradient(to right,rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.04) 1px,transparent 1px);background-size:70px 80px;-webkit-mask-image:radial-gradient(ellipse 50% 50% at center top,#000 0%,transparent 75%);mask-image:radial-gradient(ellipse 50% 50% at center top,#000 0%,transparent 75%)}

  /* Ellipse bleue floutée (au-dessus du grid, dessous des cards) */
  .pc-ellipse{position:absolute;left:50%;top:-280px;transform:translateX(-50%);width:1400px;height:1400px;border-radius:50%;background:radial-gradient(circle at center,rgba(49,49,245,.35) 0%,rgba(99,102,241,.15) 30%,transparent 70%);filter:blur(80px);opacity:.55;pointer-events:none;mix-blend-mode:screen}
  @media (max-width:720px){.pc-ellipse{width:900px;height:900px;top:-200px}}

  /* Sparkles ambient (étoiles blanches qui tombent) */
  .pc-sparkles{position:absolute;inset:0;top:0;height:420px;pointer-events:none;overflow:hidden;-webkit-mask-image:radial-gradient(ellipse 60% 50% at center top,#000 0%,transparent 80%);mask-image:radial-gradient(ellipse 60% 50% at center top,#000 0%,transparent 80%)}
  .pc-sparkles span{position:absolute;top:-10px;background:#fff;border-radius:50%;opacity:0;animation:pc-fall linear infinite;box-shadow:0 0 4px rgba(255,255,255,.6)}
  @keyframes pc-fall{
    0%{transform:translateY(0);opacity:0}
    10%{opacity:.9}
    90%{opacity:.9}
    100%{transform:translateY(420px);opacity:0}
  }

  /* Header */
  .pc-header{position:relative;z-index:5;max-width:760px;margin:0 auto 50px;text-align:center}
  .pc-eyebrow{display:inline-block;font-family:var(--fn);font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#a5b4fc;background:rgba(99,102,241,.12);border:1px solid rgba(165,180,252,.25);padding:6px 14px;border-radius:99px;margin-bottom:18px}
  .pc-title{font-family:var(--fd);font-weight:800;font-size:38px;letter-spacing:-.025em;color:#fff;margin:0 0 12px;line-height:1.1}
  @media (max-width:720px){.pc-title{font-size:28px}}
  .pc-sub{color:rgba(255,255,255,.65);font-size:15px;line-height:1.55;margin:0 0 30px}

  /* Toggle Mensuel / Annuel */
  .pc-toggle-wrap{display:flex;justify-content:center}
  .pc-toggle{position:relative;display:inline-flex;padding:5px;background:rgba(15,15,25,.7);border:1px solid rgba(255,255,255,.1);border-radius:999px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 24px -8px rgba(0,0,0,.4)}
  .pc-toggle-btn{position:relative;border:0;background:transparent;color:rgba(255,255,255,.7);font-family:inherit;font-weight:700;font-size:13.5px;padding:9px 22px;border-radius:999px;cursor:pointer;transition:color .25s;z-index:2;letter-spacing:.2px;white-space:nowrap}
  .pc-toggle-btn:hover{color:#fff}
  .pc-toggle-btn.pc-toggle-on{color:#fff}
  .pc-toggle-btn.pc-toggle-on::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,#3b82f6,#1d4ed8);border:2px solid #3b82f6;border-radius:999px;z-index:-1;box-shadow:0 4px 12px -2px rgba(59,130,246,.5)}
  .pc-toggle-lbl{position:relative;z-index:2;display:inline-flex;align-items:center;gap:7px}
  .pc-save{font-size:10px;font-weight:800;padding:2px 7px;background:rgba(255,255,255,.15);color:#fff;border-radius:99px;letter-spacing:.3px}
  .pc-pill{display:none}

  /* Grid 3 cards */
  .pc-grid{position:relative;z-index:5;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:1100px;margin:0 auto}
  @media (max-width:900px){.pc-grid{grid-template-columns:1fr;gap:16px;max-width:440px}}

  /* Card */
  .pc-card{position:relative;background:linear-gradient(135deg,rgba(20,20,32,.95),rgba(28,28,42,.92),rgba(20,20,32,.95));border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:28px 24px 26px;color:#fff;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:transform .25s,border-color .25s,box-shadow .25s}
  .pc-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.15)}
  .pc-pop{background:linear-gradient(135deg,rgba(28,28,42,.96),rgba(38,38,58,.94),rgba(28,28,42,.96));box-shadow:0 -10px 200px -20px rgba(9,0,255,.65),0 12px 40px -12px rgba(0,0,0,.5);border-color:rgba(99,102,241,.3);z-index:2}
  .pc-pop:hover{transform:translateY(-5px)}

  .pc-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;background:linear-gradient(180deg,#3b82f6,#1d4ed8);color:#fff;padding:5px 14px;border-radius:99px;box-shadow:0 4px 14px -2px rgba(59,130,246,.55);white-space:nowrap}

  .pc-card-h{margin-bottom:22px}
  .pc-name{font-family:var(--fd);font-weight:600;font-size:26px;letter-spacing:-.01em;color:#fff;margin:0 0 14px;line-height:1}
  .pc-price-row{display:flex;align-items:flex-start;gap:4px;margin-bottom:10px}
  .pc-cur{font-family:var(--fd);font-size:24px;font-weight:600;color:#fff;margin-top:6px}
  .pc-price{font-family:var(--fd);font-size:44px;font-weight:700;color:#fff;letter-spacing:-.025em;line-height:1;transition:transform .15s,opacity .15s;display:inline-block}
  .pc-price-flip{transform:translateY(-6px);opacity:0}
  .pc-period{font-size:13px;color:rgba(255,255,255,.6);font-weight:600;margin-top:12px;margin-left:4px;line-height:1.3}
  .pc-period-sub{font-size:11px;color:rgba(255,255,255,.4);font-weight:500;letter-spacing:.1px}
  .pc-desc{font-size:13px;color:rgba(255,255,255,.6);line-height:1.55;margin:14px 0 0;min-height:60px}

  .pc-cta{width:100%;padding:14px 18px;font-family:inherit;font-weight:700;font-size:14.5px;letter-spacing:.2px;border-radius:13px;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:linear-gradient(180deg,rgba(40,40,60,.6),rgba(15,15,25,.8));color:#fff;transition:transform .12s,box-shadow .2s,border-color .2s;margin-bottom:22px}
  .pc-cta:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.25)}
  .pc-cta:active{transform:translateY(0)}
  .pc-cta-pop{background:linear-gradient(180deg,#3b82f6,#1d4ed8);border-color:#3b82f6;box-shadow:0 8px 24px -4px rgba(29,78,216,.55)}
  .pc-cta-pop:hover{box-shadow:0 12px 32px -4px rgba(29,78,216,.75)}

  .pc-feat-h{font-family:var(--fd);font-weight:700;font-size:13.5px;color:#fff;padding-top:18px;border-top:1px solid rgba(255,255,255,.08);margin-bottom:14px;letter-spacing:-.005em}
  .pc-feat{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
  .pc-feat li{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:rgba(255,255,255,.72);line-height:1.4}
  .pc-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4);flex-shrink:0;margin-top:8px}
  .pc-pop .pc-dot{background:#60a5fa}

  /* Trust note bottom */
  .pc-trust{position:relative;z-index:5;text-align:center;margin:38px auto 0;max-width:600px;font-size:12px;color:rgba(255,255,255,.4);letter-spacing:.1px}
  .pc-trust span{display:inline-block;padding:8px 18px;border:1px solid rgba(255,255,255,.08);border-radius:99px;background:rgba(255,255,255,.02)}
`;
