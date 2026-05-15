/**
 * Landing publique — première impression d'un prospect (gérant d'auto-école).
 *
 * Sections :
 *  - Hero : PulseBeams avec hub central PermiGo + 3 nodes rôles + tagline + CTA
 *  - Pourquoi PermiGo (3 cards bénéfices)
 *  - Comment ça marche (3 étapes)
 *  - Tarifs (1 plan simple, pricing transparent)
 *  - CTA final : "Inscrire mon auto-école"
 *
 * Pas de DB ici — page 100% marketing/conversion.
 */

import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { mountCosmos } from '@/components/cosmos-bg.js';
import { setupReveals } from '@/utils/reveal-on-scroll.js';
import { mountHeroKeyScrub } from '@/components/hero-key-scrub.js';
import { renderLampSection, wireLampReveal, LAMP_CSS } from '@/components/lamp-section.js';
import { renderPricingSection, wirePricingSection, PRICING_CSS } from '@/components/pricing-cards.js';
import { renderMeshBg, MESH_BG_CSS } from '@/components/mesh-bg.js';

let _cosmos = null;
let _scrollHandler = null;
let _heroScrub = null;

export function mount(root) {
  root.innerHTML = template();
  wire(root);
  startBeams(root);
  // mountStarfield(root); // remplacé par mesh-bg
  setupScrollProgress(root);
  splitTitle(root);
  setupReveals(root);
  wireLampReveal(root);

  // Pricing : toggle mensuel/annuel + CTAs branchés vers form inscription ou login (demo réseau)
  wirePricingSection(root, {
    onSignup: async () => {
      const { navigate } = await import('@/router.js');
      navigate('/inscription-ecole');
    },
    onContact: async () => {
      const { navigate } = await import('@/router.js');
      navigate('/inscription-ecole');
    },
  });

  // Insère le scrub vidéo cinématographique juste après la nav
  const ldRoot = root.querySelector('.ld-root');
  const nav = root.querySelector('.ld-nav');
  if (ldRoot && nav) {
    _heroScrub = mountHeroKeyScrub(ldRoot, { insertAfter: nav });
  }
}

export function unmount() {
  if (_cosmos) { _cosmos.destroy(); _cosmos = null; }
  if (_scrollHandler) { window.removeEventListener('scroll', _scrollHandler); _scrollHandler = null; }
  if (_heroScrub) { _heroScrub.destroy(); _heroScrub = null; }
}

function mountStarfield(root) {
  const bg = root.querySelector('.ld-bg');
  if (bg) _cosmos = mountCosmos(bg);
}

function setupScrollProgress(root) {
  const fill = root.querySelector('#ld-scroll-fill');
  const txt = root.querySelector('#ld-scroll-count');
  if (!fill) return;
  _scrollHandler = () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0;
    fill.style.height = pct + '%';
    if (txt) txt.textContent = String(Math.round(pct)).padStart(2, '0') + ' / 100';
  };
  window.addEventListener('scroll', _scrollHandler, { passive: true });
  _scrollHandler();
}

function splitTitle(root) {
  const h1 = root.querySelector('.ld-h1');
  if (!h1) return;
  // On animera mot par mot (au lieu de char-par-char qui casse les mots à gradient)
  // Le HTML est déjà en place avec des spans .grad — on wrappe juste les mots non-grad
  // Simplement : ajouter classe d'entrée
  h1.classList.add('split-anim');
}

function template() {
  return `
    <style>
      /* ─── Reset & root ─── */
      .ld-root{position:relative;min-height:100vh;background:#0b0d1a;color:#fff;overflow-x:hidden;font-family:var(--fb)}

      /* ─── Background premium : MESH GRADIENT (6 blobs animés) ─── */
      ${MESH_BG_CSS}
      /* Le starfield cosmos est désactivé (le mesh gradient suffit) */
      .ld-bg{display:none}

      /* ─── Scroll progress indicator (right side, vertical) ─── */
      .ld-scroll{position:fixed;top:50%;right:18px;transform:translateY(-50%);z-index:30;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none}
      @media (max-width:720px){.ld-scroll{display:none}}
      .ld-scroll-lbl{writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--fn);font-size:9.5px;font-weight:800;color:rgba(255,255,255,.4);letter-spacing:2.5px;text-transform:uppercase}
      .ld-scroll-track{width:2px;height:140px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden;position:relative}
      .ld-scroll-fill{position:absolute;top:0;left:0;width:100%;background:linear-gradient(180deg,#a5b4fc,#7dd3fc);border-radius:2px;transition:height .15s linear;height:0}
      .ld-scroll-count{font-family:var(--fn);font-size:9.5px;font-weight:800;color:rgba(255,255,255,.5);letter-spacing:1.5px}

      /* ─── Split title animation (lettres qui montent en cascade) ─── */
      .ld-h1.split-anim{display:inline-block;perspective:600px}
      .ld-h1.split-anim > * { display: inline-block; }
      .ld-h1{opacity:0;animation:ld-h1-in .8s cubic-bezier(.2,.7,.3,1) .15s forwards;letter-spacing:-.035em}
      @keyframes ld-h1-in{
        0%{opacity:0;transform:translateY(40px) scale(.95);filter:blur(8px)}
        100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
      }
      .ld-h1 .grad{animation:gradient-shift 6s ease infinite;background-size:200% auto}
      .ld-grid{position:fixed;inset:0;z-index:1;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;pointer-events:none;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}

      /* ─── Nav ─── */
      .ld-nav{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:20px 32px;max-width:1200px;margin:0 auto}
      .ld-logo{font-family:var(--fd);font-weight:900;font-size:20px;letter-spacing:-.02em;color:#fff;display:flex;align-items:center;gap:10px}
      .ld-logo img{height:36px;width:auto;display:block;filter:drop-shadow(0 4px 14px rgba(139,92,246,.45))}
      .ld-logo-fb{background:linear-gradient(90deg,#a5b4fc,#fff,#c4b5fd);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
      .ld-logo .badge{font-size:9.5px;font-weight:800;color:#a5b4fc;background:rgba(99,102,241,.15);padding:3px 7px;border-radius:6px;letter-spacing:1px;border:1px solid rgba(165,180,252,.25)}
      .ld-nav-r{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
      .ld-btn{height:38px;padding:0 16px;border-radius:10px;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;transition:all .15s;border:0;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
      /* Mobile : nav en colonne, boutons full-width */
      @media (max-width:640px){
        .ld-nav{flex-direction:column;align-items:stretch;gap:14px;padding:14px 18px}
        .ld-nav-r{flex-direction:column;width:100%;gap:8px}
        .ld-btn{width:100%;justify-content:center;height:42px;font-size:13.5px}
      }
      .ld-btn-ghost{background:transparent;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12)}
      .ld-btn-ghost:hover{color:#fff;border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.04)}
      .ld-btn-p{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 6px 20px -6px rgba(99,102,241,.6)}
      .ld-btn-p:hover{transform:translateY(-1px);box-shadow:0 10px 28px -6px rgba(99,102,241,.75)}
      .ld-btn-lg{height:50px;padding:0 26px;font-size:14.5px;border-radius:12px}

      /* ─── Hero ─── */
      .ld-hero{position:relative;z-index:5;max-width:1200px;margin:0 auto;padding:40px 20px 60px;text-align:center}
      .ld-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:99px;background:rgba(99,102,241,.12);border:1px solid rgba(165,180,252,.25);color:#a5b4fc;font-size:11.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:20px}
      .ld-eyebrow .dot{width:6px;height:6px;border-radius:50%;background:#a5b4fc;box-shadow:0 0 12px #a5b4fc}
      .ld-h1{font-family:var(--fd);font-weight:900;font-size:62px;line-height:1.05;letter-spacing:-.035em;color:#fff;margin:0 auto 18px;max-width:760px}
      @media (max-width:720px){.ld-h1{font-size:42px}}
      .ld-h1 .grad{background:linear-gradient(135deg,#a5b4fc 0%,#c4b5fd 50%,#7dd3fc 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
      .ld-sub{color:rgba(255,255,255,.7);font-size:17px;line-height:1.55;max-width:580px;margin:0 auto 32px}
      .ld-cta-row{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}

      /* ─── PulseBeams diagram ─── */
      .ld-diagram{position:relative;max-width:780px;margin:60px auto 0;height:440px}
      @media (max-width:720px){.ld-diagram{height:380px;margin-top:32px}}
      .ld-diagram svg{display:block;width:100%;height:100%;overflow:visible}
      .ld-diagram .node{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;z-index:5}
      .ld-diagram .node .pill{padding:12px 16px;border-radius:14px;background:rgba(255,255,255,.06);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.12);min-width:140px;box-shadow:0 12px 36px -12px rgba(0,0,0,.5)}
      .ld-diagram .node .em{font-size:28px;line-height:1}
      .ld-diagram .node .nm{font-family:var(--fd);font-weight:700;font-size:14px;margin-top:6px;color:#fff}
      .ld-diagram .node .sub{font-size:10.5px;color:rgba(255,255,255,.5);margin-top:2px;font-weight:600;letter-spacing:.4px}

      /* Hub central */
      .ld-hub{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:6;width:128px;height:128px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#a5b4fc,#6366f1 50%,#4338ca);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:900;font-size:18px;letter-spacing:-.02em;color:#fff;box-shadow:0 0 60px rgba(99,102,241,.5),0 0 0 1px rgba(255,255,255,.15) inset,0 20px 60px -10px rgba(99,102,241,.6);animation:ld-hub-pulse 3.5s ease-in-out infinite}
      @keyframes ld-hub-pulse{0%,100%{box-shadow:0 0 60px rgba(99,102,241,.5),0 0 0 1px rgba(255,255,255,.15) inset,0 20px 60px -10px rgba(99,102,241,.6)}50%{box-shadow:0 0 100px rgba(99,102,241,.7),0 0 0 1px rgba(255,255,255,.2) inset,0 24px 72px -10px rgba(99,102,241,.8)}}
      .ld-hub::after{content:'';position:absolute;inset:-16px;border-radius:50%;border:1px solid rgba(165,180,252,.2);animation:ld-hub-ring 3.5s ease-out infinite}
      @keyframes ld-hub-ring{0%{transform:scale(.9);opacity:1}100%{transform:scale(1.5);opacity:0}}
      .ld-hub small{font-size:10.5px;font-weight:700;opacity:.7;letter-spacing:1.5px;display:block;margin-top:1px}

      /* Node positions (desktop) */
      .ld-diagram .node.n-eleve{top:18%;left:18%}
      .ld-diagram .node.n-moniteur{top:18%;right:18%;left:auto;transform:translate(50%,-50%)}
      .ld-diagram .node.n-gerant{bottom:8%;left:50%;top:auto;transform:translate(-50%,50%)}

      /* SVG beam paths */
      .ld-beam{fill:none;stroke-linecap:round}
      .ld-beam-base{stroke:rgba(255,255,255,.08);stroke-width:1.5}
      .ld-beam-anim{stroke-width:2.5;stroke-dasharray:120 600;stroke-dashoffset:720;animation:ld-beam-flow 3s linear infinite}
      @keyframes ld-beam-flow{0%{stroke-dashoffset:720}100%{stroke-dashoffset:0}}
      .ld-beam-anim.delay-1{animation-delay:.6s}
      .ld-beam-anim.delay-2{animation-delay:1.2s}
      .ld-beam-anim.delay-3{animation-delay:1.8s}

      /* ─── Sections ─── */
      .ld-section{position:relative;z-index:5;max-width:1100px;margin:0 auto;padding:60px 20px}
      .ld-section-h{text-align:center;margin-bottom:40px}
      .ld-section-h .lbl{display:inline-block;font-size:11px;font-weight:800;color:#a5b4fc;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px}
      .ld-section-h h2{font-family:var(--fd);font-weight:800;font-size:36px;line-height:1.1;letter-spacing:-.025em;color:#fff;margin:0 0 8px}
      @media (max-width:560px){.ld-section-h h2{font-size:26px}}
      .ld-section-h p{color:rgba(255,255,255,.6);font-size:15px;max-width:560px;margin:0 auto;line-height:1.55}

      .ld-features{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
      @media (max-width:900px){.ld-features{grid-template-columns:1fr}}
      .ld-feat{background:rgba(255,255,255,.04);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:24px;transition:transform .2s,border-color .2s}
      .ld-feat:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.22)}
      .ld-feat .em{font-size:32px;display:inline-flex;width:54px;height:54px;border-radius:14px;align-items:center;justify-content:center;background:rgba(99,102,241,.15);border:1px solid rgba(165,180,252,.3);margin-bottom:14px}
      .ld-feat h3{font-family:var(--fd);font-weight:800;font-size:18px;letter-spacing:-.01em;color:#fff;margin:0 0 6px}
      .ld-feat .role{font-size:10px;font-weight:800;color:#a5b4fc;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px}
      .ld-feat p{color:rgba(255,255,255,.65);font-size:13.5px;line-height:1.55;margin:0}
      .ld-feat ul{margin:10px 0 0;padding:0;list-style:none}
      .ld-feat li{font-size:12.5px;color:rgba(255,255,255,.7);padding:5px 0 5px 22px;position:relative;line-height:1.45}
      .ld-feat li::before{content:'✓';position:absolute;left:0;top:5px;color:#34d399;font-weight:800;font-size:13px}

      /* ─── PulseBeams Stage (Aceternity-style) ─── */
      .ld-ecosystem{padding-top:30px;padding-bottom:30px}
      .pb-stage{position:relative;max-width:858px;margin:0 auto;aspect-ratio:858/434;width:100%}
      .pb-svg{display:block;width:100%;height:100%;overflow:visible}

      .pb-center-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;height:120px;border:0;background:transparent;cursor:pointer;padding:0;font-family:inherit;z-index:5;border-radius:9999px}
      @media (max-width:720px){.pb-center-btn{width:240px;height:90px}}
      @media (max-width:480px){.pb-center-btn{width:180px;height:72px}}

      .pb-center-btn .pb-hover-glow{position:absolute;inset:0;border-radius:9999px;overflow:hidden;opacity:0;transition:opacity .5s}
      .pb-center-btn .pb-hover-glow::before{content:'';position:absolute;inset:0;border-radius:9999px;background:radial-gradient(75% 100% at 50% 0%,rgba(56,189,248,.6) 0%,rgba(56,189,248,0) 75%)}
      .pb-center-btn:hover .pb-hover-glow{opacity:1}

      .pb-center-btn .pb-inner{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:9999px;background:#0b0d1a;box-shadow:0 0 0 1px rgba(255,255,255,.1) inset,0 30px 60px -20px rgba(0,0,0,.8);z-index:2}

      .pb-center-btn .pb-text{font-family:var(--fd);font-weight:700;font-size:36px;letter-spacing:-.02em;background:linear-gradient(90deg,#d4d4d8 0%,#71717a 50%,#d4d4d8 100%);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1}
      @media (max-width:720px){.pb-center-btn .pb-text{font-size:26px}}
      @media (max-width:480px){.pb-center-btn .pb-text{font-size:20px}}

      .pb-center-btn:hover .pb-text{background:linear-gradient(90deg,#fff 0%,#a5b4fc 50%,#fff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}

      /* Comment ça marche */
      .ld-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;position:relative}
      @media (max-width:760px){.ld-steps{grid-template-columns:1fr}}
      .ld-step{padding:22px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px}
      .ld-step .n{display:inline-flex;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);align-items:center;justify-content:center;font-family:var(--fd);font-weight:900;color:#fff;font-size:15px;margin-bottom:12px}
      .ld-step h4{font-family:var(--fd);font-weight:700;font-size:16px;color:#fff;margin:0 0 6px}
      .ld-step p{color:rgba(255,255,255,.6);font-size:13px;line-height:1.5;margin:0}

      /* Tarif */
      .ld-pricing{max-width:480px;margin:0 auto;padding:32px;background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(165,180,252,.25);border-radius:20px;text-align:center;box-shadow:0 30px 80px -20px rgba(99,102,241,.4)}
      .ld-pricing .tag{display:inline-block;font-size:10.5px;font-weight:800;color:#34d399;background:rgba(16,185,129,.15);padding:4px 10px;border-radius:99px;letter-spacing:.8px;text-transform:uppercase;margin-bottom:12px;border:1px solid rgba(52,211,153,.3)}
      .ld-pricing .price{font-family:var(--fd);font-weight:900;font-size:54px;letter-spacing:-.03em;color:#fff;line-height:1;margin:0 0 4px}
      .ld-pricing .price small{font-size:18px;color:rgba(255,255,255,.6);font-weight:700;margin-left:4px}
      .ld-pricing .price-sub{color:rgba(255,255,255,.6);font-size:13px;margin-bottom:22px}
      .ld-pricing ul{margin:0 0 24px;padding:0;list-style:none;text-align:left}
      .ld-pricing li{padding:7px 0 7px 26px;position:relative;color:rgba(255,255,255,.85);font-size:13.5px;line-height:1.5}
      .ld-pricing li::before{content:'✓';position:absolute;left:0;color:#34d399;font-weight:800}

      /* Final CTA */
      .ld-final{position:relative;z-index:5;max-width:900px;margin:40px auto 80px;padding:50px 32px;background:linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08));border:1px solid rgba(165,180,252,.2);border-radius:24px;text-align:center;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
      .ld-final h2{font-family:var(--fd);font-weight:800;font-size:32px;letter-spacing:-.02em;color:#fff;margin:0 0 10px}
      @media (max-width:560px){.ld-final h2{font-size:24px}}
      .ld-final p{color:rgba(255,255,255,.7);margin:0 0 24px;font-size:15px}

      /* FAQ — accordion avec icônes colorées */
      .ld-faq{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;transition:border-color .2s,background .2s}
      .ld-faq:hover{border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.055)}
      .ld-faq[open]{border-color:rgba(165,180,252,.3);background:rgba(99,102,241,.06)}
      .ld-faq summary{padding:16px 18px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:14px;font-family:var(--fd);font-weight:700;font-size:15px;color:#fff;letter-spacing:-.005em;line-height:1.35}
      .ld-faq summary::-webkit-details-marker{display:none}
      .ld-faq-q{flex:1;min-width:0}
      .ld-faq-ic{flex-shrink:0;width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;transition:transform .25s}
      .ld-faq-ic svg{width:20px;height:20px}
      .ld-faq[open] .ld-faq-ic{transform:scale(1.08)}
      /* Variants couleur icône */
      .ld-faq-ic-blue{background:rgba(59,130,246,.15);color:#60a5fa;border:1px solid rgba(59,130,246,.25)}
      .ld-faq-ic-amber{background:rgba(245,158,11,.15);color:#fbbf24;border:1px solid rgba(245,158,11,.25)}
      .ld-faq-ic-red{background:rgba(239,68,68,.13);color:#f87171;border:1px solid rgba(239,68,68,.25)}
      .ld-faq-ic-green{background:rgba(16,185,129,.15);color:#34d399;border:1px solid rgba(16,185,129,.25)}
      .ld-faq-ic-violet{background:rgba(139,92,246,.15);color:#a78bfa;border:1px solid rgba(139,92,246,.28)}

      .ld-faq-chev{flex-shrink:0;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.55);transition:transform .3s cubic-bezier(.4,0,.2,1),background .2s,color .2s}
      .ld-faq-chev svg{width:13px;height:13px}
      .ld-faq[open] .ld-faq-chev{transform:rotate(45deg);background:rgba(165,180,252,.18);color:#a5b4fc;border-color:rgba(165,180,252,.35)}

      .ld-faq-body{padding:0 18px 20px 72px;color:rgba(255,255,255,.7);font-size:14.5px;line-height:1.65;letter-spacing:-.003em}
      @media (max-width:560px){.ld-faq-body{padding:0 18px 18px 18px}}

      ${LAMP_CSS}
      ${PRICING_CSS}

      /* ─── Footer "taped" (carte papier + scotch en haut) ─── */
      .ld-foot-wrap{position:relative;z-index:5;max-width:1100px;margin:60px auto 40px;padding:0 18px}
      .ld-foot-card{position:relative;background:#f8f7f3;color:#1c1c1c;border-radius:28px;padding:46px 38px 38px;box-shadow:0 30px 80px -20px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.06) inset;overflow:visible}
      @media (max-width:720px){.ld-foot-card{padding:36px 22px 28px;border-radius:22px}}
      .ld-foot-tape{position:absolute;top:-14px;width:90px;height:38px;display:block;pointer-events:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.18))}
      .ld-foot-tape.l{left:32px;transform:rotate(-6deg)}
      .ld-foot-tape.r{right:32px;transform:rotate(98deg)}
      @media (max-width:720px){.ld-foot-tape{width:64px;height:28px}.ld-foot-tape.l{left:18px}.ld-foot-tape.r{right:18px}}

      .ld-foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:36px;align-items:start}
      @media (max-width:900px){.ld-foot-grid{grid-template-columns:1fr 1fr;gap:28px}}
      @media (max-width:560px){.ld-foot-grid{grid-template-columns:1fr;gap:22px}}

      .ld-foot-brand .nm{font-family:var(--fd);font-weight:900;font-size:24px;letter-spacing:-.02em;color:#1c1c1c;margin:0 0 10px;display:flex;align-items:center;gap:8px}
      .ld-foot-brand .nm::before{content:'';width:8px;height:8px;border-radius:50%;background:#6366f1;display:inline-block}
      .ld-foot-brand p{font-size:14px;line-height:1.55;color:#555;margin:0;max-width:280px}

      .ld-foot-col h4{font-family:var(--fd);font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin:0 0 14px}
      .ld-foot-col ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:9px}
      .ld-foot-col a{color:#333;font-size:13.5px;text-decoration:none;font-weight:500;transition:color .15s}
      .ld-foot-col a:hover{color:#6366f1}
      .ld-foot-col .soon{display:inline-block;margin-left:6px;padding:1px 7px;background:#1c1c1c;color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.5px;border-radius:99px;transform:rotate(-3deg);vertical-align:middle}

      .ld-foot-bottom{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:14px 6px 0;margin-top:8px;font-size:12px;color:rgba(255,255,255,.45);flex-wrap:wrap}
      .ld-foot-bottom a{color:rgba(255,255,255,.7);text-decoration:none;margin:0 6px}
      .ld-foot-bottom .copy{display:flex;gap:18px;flex-wrap:wrap;align-items:center}
      .ld-foot-bottom .socials{display:flex;gap:12px;align-items:center}
      .ld-foot-bottom .socials a{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);margin:0;transition:all .15s}
      .ld-foot-bottom .socials a:hover{background:rgba(255,255,255,.12);color:#fff}

      /* Footer (ancien — fallback) */
      .ld-foot{position:relative;z-index:5;text-align:center;padding:30px 20px;font-size:12px;color:rgba(255,255,255,.4);border-top:1px solid rgba(255,255,255,.05)}
      .ld-foot a{color:rgba(255,255,255,.7);text-decoration:none;margin:0 8px}
    </style>

    <div class="ld-root">
      ${renderMeshBg()}
      <div class="ld-grid"></div>

      <!-- Scroll progress indicator (vertical, droite) -->
      <div class="ld-scroll">
        <div class="ld-scroll-lbl">SCROLL</div>
        <div class="ld-scroll-track"><div class="ld-scroll-fill" id="ld-scroll-fill"></div></div>
        <div class="ld-scroll-count" id="ld-scroll-count">00 / 100</div>
      </div>

      <!-- ─── Nav ─── -->
      <nav class="ld-nav" aria-label="Navigation principale">
        <div class="ld-logo">
          <span class="pg-logo-txt">PermiGo</span>
          <span class="ld-logo-fb" style="display:none">PermiGo</span>
        </div>
        <div class="ld-nav-r">
          <button class="ld-btn ld-btn-ghost" id="ld-login">Se connecter</button>
          <button class="ld-btn ld-btn-ghost" id="ld-signup-eleve">Je suis élève</button>
          <button class="ld-btn ld-btn-p" id="ld-signup-1">Essayer pendant 14 jours</button>
        </div>
      </nav>

      <!-- ─── Hero ─── -->
      <section class="ld-hero">
        <div class="ld-eyebrow"><span class="dot"></span>Disponible en France depuis janvier 2026</div>
        <h1 class="ld-h1">Une auto-école moderne, <span class="grad">sans devenir une usine</span>.</h1>
        <p class="ld-sub">PermiGo réunit le planning, le suivi des élèves, le suivi pédagogique et le livret REMC numérique dans une seule application. Pensée en France, pour les auto-écoles qui veulent gagner du temps sans perdre leur âme.</p>
        <div class="ld-cta-row">
          <button class="ld-btn ld-btn-p ld-btn-lg" id="ld-signup-2">Essayer pendant 14 jours</button>
          <button class="ld-btn ld-btn-ghost ld-btn-lg" id="ld-demo">Voir une démonstration</button>
        </div>
        <p style="font-size:12.5px;color:rgba(255,255,255,.5);margin-top:14px;letter-spacing:.2px">Sans carte bancaire. Sans engagement. Configuration en moins de dix minutes.</p>

        <!-- ─── PulseBeams diagram ─── -->
        <div class="ld-diagram" id="ld-diagram">
          <svg viewBox="0 0 780 440" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="ld-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#18CCFC" stop-opacity="0"/>
                <stop offset="35%" stop-color="#18CCFC" stop-opacity="1"/>
                <stop offset="55%" stop-color="#6344F5" stop-opacity="1"/>
                <stop offset="100%" stop-color="#AE48FF" stop-opacity="0"/>
              </linearGradient>
              <filter id="ld-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
                <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <!-- Path 1 : eleve (140,80) → hub (390,220) -->
            <path class="ld-beam ld-beam-base" d="M 140 80 C 200 80, 240 140, 320 200 L 380 220" />
            <path class="ld-beam ld-beam-anim" stroke="url(#ld-grad)" d="M 140 80 C 200 80, 240 140, 320 200 L 380 220" filter="url(#ld-glow)" />

            <!-- Path 2 : moniteur (640,80) → hub (390,220) -->
            <path class="ld-beam ld-beam-base" d="M 640 80 C 580 80, 540 140, 460 200 L 400 220" />
            <path class="ld-beam ld-beam-anim delay-1" stroke="url(#ld-grad)" d="M 640 80 C 580 80, 540 140, 460 200 L 400 220" filter="url(#ld-glow)" />

            <!-- Path 3 : gerant (390,400) → hub (390,220) -->
            <path class="ld-beam ld-beam-base" d="M 390 400 L 390 240" />
            <path class="ld-beam ld-beam-anim delay-2" stroke="url(#ld-grad)" d="M 390 400 L 390 240" filter="url(#ld-glow)" />

            <!-- Connection dots aux nodes -->
            <circle cx="140" cy="80"  r="5" fill="#18CCFC" filter="url(#ld-glow)" opacity=".8" />
            <circle cx="640" cy="80"  r="5" fill="#6344F5" filter="url(#ld-glow)" opacity=".8" />
            <circle cx="390" cy="400" r="5" fill="#AE48FF" filter="url(#ld-glow)" opacity=".8" />
          </svg>

          <!-- Hub central -->
          <div class="ld-hub">
            PermiGo
            <small>HUB</small>
          </div>

          <!-- Nodes (positions calées sur les coords SVG) -->
          <div class="node n-eleve">
            <div class="pill">
              <div class="em">🎓</div>
              <div class="nm">Élève</div>
              <div class="sub">RÉSERVE · APPREND</div>
            </div>
          </div>
          <div class="node n-moniteur">
            <div class="pill">
              <div class="em">🚗</div>
              <div class="nm">Enseignant</div>
              <div class="sub">ENSEIGNE · ÉVALUE</div>
            </div>
          </div>
          <div class="node n-gerant">
            <div class="pill">
              <div class="em">👑</div>
              <div class="nm">Gérant</div>
              <div class="sub">PILOTE · ANALYSE</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── Section Lampe (transition wow) ─── -->
      ${renderLampSection({
        eyebrow: 'Notre conviction',
        title: 'Un outil construit pour le métier.<br>Pas pour faire joli en démo.',
        sub: 'Chaque écran a été pensé avec des gérants, des enseignants et des candidats. Les détails comptent.'
      })}

      <!-- ─── Pourquoi PermiGo ─── -->
      <section class="ld-section">
        <div class="ld-section-h reveal" style="max-width:780px">
          <div class="lbl">Notre histoire</div>
          <h2>Pourquoi nous avons construit PermiGo.</h2>
        </div>
        <div class="reveal" style="max-width:740px;margin:0 auto;text-align:left;color:rgba(255,255,255,.78);font-size:16px;line-height:1.75;letter-spacing:-.005em">
          <p style="margin:0 0 18px">Les auto-écoles n'ont pas besoin d'un énième logiciel "tout-en-un" pensé par des ingénieurs qui n'y ont jamais mis les pieds.</p>
          <p style="margin:0 0 18px">Elles ont besoin d'un outil qui leur fait gagner les deux heures qu'elles perdent chaque jour à appeler les élèves, retaper le planning, vérifier les paiements, ressortir un livret papier déchiré.</p>
          <p style="margin:0 0 18px">PermiGo a été construit avec des gérants d'auto-écoles, des enseignants et des candidats. Pas dans un open-space à Paris. Sur le terrain, en région, avec des écoles de cinq, dix, quinze enseignants.</p>
          <p style="margin:0">Le résultat est simple : ce qui vous prend une demi-journée par semaine se fait désormais sur un téléphone, en deux minutes.</p>
        </div>
      </section>

      <!-- ─── Ce qui change au quotidien ─── -->
      <section class="ld-section">
        <div class="ld-section-h reveal">
          <div class="lbl">Au quotidien</div>
          <h2>Ce qui change dans votre auto-école.</h2>
          <p>Quatre choses concrètes, du premier appel à la dernière facture.</p>
        </div>
        <div class="ld-features reveal reveal-stagger" style="grid-template-columns:repeat(2,1fr)">
          <div class="ld-feat">
            <div class="em">📞</div>
            <div class="role">Le téléphone</div>
            <h3>Plus de coups de fil pour fixer une heure de conduite.</h3>
            <p>Vos élèves voient les créneaux disponibles de leur enseignant en temps réel et réservent depuis leur téléphone. Vous gardez la main sur tout depuis le planning gérant.</p>
          </div>
          <div class="ld-feat">
            <div class="em">📋</div>
            <div class="role">Le livret</div>
            <h3>Un livret REMC numérique que les élèves consultent vraiment.</h3>
            <p>Le référentiel officiel devient un parcours visuel. Les enseignants valident les compétences en un geste après chaque leçon. Les élèves savent où ils en sont, sans réclamer.</p>
          </div>
          <div class="ld-feat">
            <div class="em">📊</div>
            <div class="role">Les paiements</div>
            <h3>Les forfaits et les heures, sans Excel.</h3>
            <p>Suivez les heures consommées, les forfaits restants et le chiffre d'affaires depuis le tableau de bord. Vos secrétaires ne ressaisissent plus rien.</p>
          </div>
          <div class="ld-feat">
            <div class="em">📈</div>
            <div class="role">Le pilotage</div>
            <h3>Une vision claire de votre activité.</h3>
            <p>Combien d'élèves actifs, quelle progression, quel taux de réussite par enseignant. Les réponses tiennent sur un seul écran. Pas de rapport à générer.</p>
          </div>
        </div>
      </section>

      <!-- ─── PulseBeams — écosystème connecté ─── -->
      <section class="ld-section ld-ecosystem">
        <div class="ld-section-h">
          <div class="lbl">Tout circule</div>
          <h2>Une seule application, trois rôles, zéro double saisie.</h2>
          <p>L'enseignant valide une compétence. L'élève la voit immédiatement. Le gérant retrouve la donnée dans son tableau de bord. Sans Excel, sans email, sans rappel.</p>
        </div>

        <div class="pb-stage">
          <svg class="pb-svg" viewBox="0 0 858 434" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <!-- 5 gradients animés, un par beam -->
              <linearGradient id="pb-g0" gradientUnits="userSpaceOnUse" x1="0%" x2="0%" y1="80%" y2="100%">
                <stop offset="0%" stop-color="#18CCFC" stop-opacity="0"/>
                <stop offset="20%" stop-color="#18CCFC" stop-opacity="1"/>
                <stop offset="50%" stop-color="#6344F5" stop-opacity="1"/>
                <stop offset="100%" stop-color="#AE48FF" stop-opacity="0"/>
                <animate attributeName="x1" values="0%;0%;200%" keyTimes="0;0.5;1" dur="2s" begin="0s;pb-g0.end+2s" />
                <animate attributeName="x2" values="0%;0%;180%" keyTimes="0;0.5;1" dur="2s" begin="0s;pb-g0.end+2s" />
                <animate attributeName="y1" values="80%;0%;0%" keyTimes="0;0.5;1" dur="2s" begin="0s;pb-g0.end+2s" id="pb-g0"/>
                <animate attributeName="y2" values="100%;20%;20%" keyTimes="0;0.5;1" dur="2s" begin="0s;pb-g0.end+2s" />
              </linearGradient>

              <linearGradient id="pb-g1" gradientUnits="userSpaceOnUse" x1="20%" x2="0%" y1="80%" y2="100%">
                <stop offset="0%" stop-color="#18CCFC" stop-opacity="0"/>
                <stop offset="20%" stop-color="#18CCFC" stop-opacity="1"/>
                <stop offset="50%" stop-color="#6344F5" stop-opacity="1"/>
                <stop offset="100%" stop-color="#AE48FF" stop-opacity="0"/>
                <animate attributeName="x1" values="20%;100%;100%" keyTimes="0;0.5;1" dur="2s" begin="0.4s;pb-g1.end+2s" id="pb-g1"/>
                <animate attributeName="x2" values="0%;90%;90%" keyTimes="0;0.5;1" dur="2s" begin="0.4s;pb-g1.end+2s" />
                <animate attributeName="y1" values="80%;80%;-20%" keyTimes="0;0.5;1" dur="2s" begin="0.4s;pb-g1.end+2s" />
                <animate attributeName="y2" values="100%;100%;0%" keyTimes="0;0.5;1" dur="2s" begin="0.4s;pb-g1.end+2s" />
              </linearGradient>

              <linearGradient id="pb-g2" gradientUnits="userSpaceOnUse" x1="20%" x2="0%" y1="80%" y2="100%">
                <stop offset="0%" stop-color="#18CCFC" stop-opacity="0"/>
                <stop offset="20%" stop-color="#18CCFC" stop-opacity="1"/>
                <stop offset="50%" stop-color="#6344F5" stop-opacity="1"/>
                <stop offset="100%" stop-color="#AE48FF" stop-opacity="0"/>
                <animate attributeName="x1" values="20%;100%;100%" keyTimes="0;0.5;1" dur="2s" begin="0.8s;pb-g2.end+2s" id="pb-g2"/>
                <animate attributeName="x2" values="0%;90%;90%" keyTimes="0;0.5;1" dur="2s" begin="0.8s;pb-g2.end+2s" />
                <animate attributeName="y1" values="80%;80%;-20%" keyTimes="0;0.5;1" dur="2s" begin="0.8s;pb-g2.end+2s" />
                <animate attributeName="y2" values="100%;100%;0%" keyTimes="0;0.5;1" dur="2s" begin="0.8s;pb-g2.end+2s" />
              </linearGradient>

              <linearGradient id="pb-g3" gradientUnits="userSpaceOnUse" x1="40%" x2="50%" y1="160%" y2="180%">
                <stop offset="0%" stop-color="#18CCFC" stop-opacity="0"/>
                <stop offset="20%" stop-color="#18CCFC" stop-opacity="1"/>
                <stop offset="50%" stop-color="#6344F5" stop-opacity="1"/>
                <stop offset="100%" stop-color="#AE48FF" stop-opacity="0"/>
                <animate attributeName="x1" values="40%;0%" keyTimes="0;1" dur="2s" begin="1.2s;pb-g3.end+2s" id="pb-g3"/>
                <animate attributeName="x2" values="50%;10%" keyTimes="0;1" dur="2s" begin="1.2s;pb-g3.end+2s" />
                <animate attributeName="y1" values="160%;-40%" keyTimes="0;1" dur="2s" begin="1.2s;pb-g3.end+2s" />
                <animate attributeName="y2" values="180%;-20%" keyTimes="0;1" dur="2s" begin="1.2s;pb-g3.end+2s" />
              </linearGradient>

              <linearGradient id="pb-g4" gradientUnits="userSpaceOnUse" x1="-40%" x2="-10%" y1="0%" y2="20%">
                <stop offset="0%" stop-color="#18CCFC" stop-opacity="0"/>
                <stop offset="20%" stop-color="#18CCFC" stop-opacity="1"/>
                <stop offset="50%" stop-color="#6344F5" stop-opacity="1"/>
                <stop offset="100%" stop-color="#AE48FF" stop-opacity="0"/>
                <animate attributeName="x1" values="40%;0%;0%" keyTimes="0;0.5;1" dur="2s" begin="1.6s;pb-g4.end+2s" id="pb-g4"/>
                <animate attributeName="x2" values="10%;0%;0%" keyTimes="0;0.5;1" dur="2s" begin="1.6s;pb-g4.end+2s" />
                <animate attributeName="y1" values="0%;0%;180%" keyTimes="0;0.5;1" dur="2s" begin="1.6s;pb-g4.end+2s" />
                <animate attributeName="y2" values="20%;20%;200%" keyTimes="0;0.5;1" dur="2s" begin="1.6s;pb-g4.end+2s" />
              </linearGradient>

              <filter id="pb-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/>
                <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <!-- Beam 1 -->
            <path d="M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
            <path d="M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5" stroke="url(#pb-g0)" stroke-width="2" stroke-linecap="round" filter="url(#pb-glow)"/>

            <!-- Beam 2 -->
            <path d="M568 200H841C846.523 200 851 195.523 851 190V40" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
            <path d="M568 200H841C846.523 200 851 195.523 851 190V40" stroke="url(#pb-g1)" stroke-width="2" stroke-linecap="round" filter="url(#pb-glow)"/>

            <!-- Beam 3 -->
            <path d="M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
            <path d="M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5" stroke="url(#pb-g2)" stroke-width="2" stroke-linecap="round" filter="url(#pb-glow)"/>

            <!-- Beam 4 -->
            <path d="M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
            <path d="M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427" stroke="url(#pb-g3)" stroke-width="2" stroke-linecap="round" filter="url(#pb-glow)"/>

            <!-- Beam 5 -->
            <path d="M380 168V17C380 11.4772 384.477 7 390 7H414" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
            <path d="M380 168V17C380 11.4772 384.477 7 390 7H414" stroke="url(#pb-g4)" stroke-width="2" stroke-linecap="round" filter="url(#pb-glow)"/>

            <!-- Connection points (endpoints des beams) -->
            <circle cx="6.5"  cy="398.5" r="6"   fill="#0f172a" stroke="#475569" stroke-width="1"/>
            <circle cx="269"  cy="220.5" r="6"   fill="#0f172a" stroke="#475569" stroke-width="1"/>
            <circle cx="851"  cy="34"    r="6.5" fill="#0f172a" stroke="#475569" stroke-width="1"/>
            <circle cx="568"  cy="200"   r="6"   fill="#0f172a" stroke="#475569" stroke-width="1"/>
            <circle cx="142"  cy="427"   r="6.5" fill="#0f172a" stroke="#475569" stroke-width="1"/>
            <circle cx="425.5" cy="274"  r="6"   fill="#0f172a" stroke="#475569" stroke-width="1"/>
            <circle cx="770"  cy="427"   r="6.5" fill="#0f172a" stroke="#475569" stroke-width="1"/>
            <circle cx="493"  cy="274"   r="6"   fill="#0f172a" stroke="#475569" stroke-width="1"/>
            <circle cx="420.5" cy="6.5"  r="6"   fill="#0f172a" stroke="#475569" stroke-width="1"/>
            <circle cx="380"  cy="168"   r="6"   fill="#0f172a" stroke="#475569" stroke-width="1"/>
          </svg>

          <!-- Bouton central style Aceternity -->
          <button class="pb-center-btn" id="pb-center-btn" type="button">
            <span class="pb-hover-glow"></span>
            <span class="pb-inner">
              <span class="pb-text">Démarrer</span>
            </span>
          </button>
        </div>
      </section>

      <!-- ─── En trois étapes ─── -->
      <section class="ld-section">
        <div class="ld-section-h reveal">
          <div class="lbl">Comment on démarre</div>
          <h2>En trois étapes.</h2>
          <p>Pas de migration complexe. Pas de formation longue. Pas de surprise.</p>
        </div>
        <div class="ld-steps reveal reveal-stagger">
          <div class="ld-step">
            <div class="n">1</div>
            <h4>Nous configurons votre auto-école avec vous.</h4>
            <p>Comptez trente minutes au téléphone. Nous importons vos enseignants, vos élèves, vos forfaits. Vous n'avez rien à faire d'autre que valider.</p>
          </div>
          <div class="ld-step">
            <div class="n">2</div>
            <h4>Vos équipes se forment en se connectant.</h4>
            <p>Pas de formation lourde, pas de manuel. La plupart des enseignants sont opérationnels en moins d'une heure.</p>
          </div>
          <div class="ld-step">
            <div class="n">3</div>
            <h4>Vous gardez le contrôle.</h4>
            <p>Vous voyez ce qui se passe, vous arbitrez quand il faut. Le reste tourne tout seul.</p>
          </div>
        </div>
      </section>

      <!-- ─── Témoignage ─── -->
      <section class="ld-section">
        <div class="reveal" style="max-width:780px;margin:0 auto;padding:36px 32px;border-radius:22px;background:linear-gradient(135deg,rgba(99,102,241,.10),rgba(139,92,246,.06));border:1px solid rgba(165,180,252,.18);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)">
          <div style="font-size:42px;line-height:1;color:#a5b4fc;font-family:Georgia,serif;margin-bottom:8px">"</div>
          <p style="color:rgba(255,255,255,.92);font-size:18px;line-height:1.6;letter-spacing:-.005em;margin:0 0 22px;font-style:italic">On a longtemps fonctionné avec un classeur, un téléphone et trois plannings papier. Avec PermiGo, on a arrêté de courir après les heures et les paiements. Mes secrétaires ont retrouvé du temps pour s'occuper des élèves, et c'est ça qui fait la différence.</p>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:800;color:#fff;font-size:14px">AÉ</div>
            <div>
              <div style="font-family:var(--fd);font-weight:700;color:#fff;font-size:13.5px">Auto-École en cours de pilote</div>
              <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:2px">Les premiers retours arrivent dès juin 2026.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── Tarif (3 plans + toggle mensuel/annuel) ─── -->
      ${renderPricingSection()}

      <!-- ─── FAQ ─── -->
      <section class="ld-section">
        <div class="ld-section-h reveal">
          <div class="lbl">Questions fréquentes</div>
          <h2>Les questions qu'on nous pose.</h2>
        </div>
        <div class="reveal reveal-stagger" style="max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
          ${faqItem({
            icon: 'phone',
            color: 'blue',
            q: "Pas à l'aise avec l'informatique ?",
            a: "Si vous envoyez un SMS, vous savez utiliser PermiGo. Testé avec des enseignants de 25 à 62 ans."
          })}
          ${faqItem({
            icon: 'clock',
            color: 'amber',
            q: "Et ma secrétaire ?",
            a: "Elle gagne deux heures par jour. Le téléphone et la facturation deviennent automatiques. Elle reste au cœur du contact humain."
          })}
          ${faqItem({
            icon: 'exit',
            color: 'red',
            q: "Et si je veux arrêter ?",
            a: "Vos données sont exportables en un clic. Pas de pénalité, pas d'engagement annuel."
          })}
          ${faqItem({
            icon: 'shield',
            color: 'green',
            q: "Où sont mes données ?",
            a: "En France et en Allemagne. Aucune donnée ne quitte l'Europe."
          })}
          ${faqItem({
            icon: 'bolt',
            color: 'violet',
            q: "Combien de temps pour démarrer ?",
            a: "Deux jours. Vous signez le lundi, vos élèves réservent le mercredi."
          })}
        </div>
      </section>

      <!-- ─── Final CTA ─── -->
      <section class="ld-final reveal">
        <h2>Vous voulez voir ce que ça donne sur votre auto-école ?</h2>
        <p>Donnez-nous trente minutes au téléphone. Nous vous montrons PermiGo avec vos vraies données. Si vous n'êtes pas convaincu, vous reprenez votre planning papier.</p>
        <button class="ld-btn ld-btn-p ld-btn-lg" id="ld-signup-4">Demander une démonstration</button>
      </section>

      <!-- ─── Footer "taped" ─── -->
      <div class="ld-foot-wrap">
        <div class="ld-foot-card">
          <svg class="ld-foot-tape l" viewBox="0 0 95 80" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
            <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="#222"/>
            <path d="M69.68 39.99c5.09-3.07 10.6-4.97 15.76-7.95l-1.83 6.83C80.28 32.39 75.7 26.5 72.23 20.08c-2.23-4.1-4.43-8.24-6.61-12.39l7.36 1.97c-2.41 1.26-4.82 2.52-7.24 3.77-6.58 3.4-13.19 6.73-19.83 10.04-6.63 3.3-13.29 6.56-19.96 9.8-4.53 2.2-9.07 4.39-13.61 6.58-1.99.96-3.98 1.92-5.97 2.88-1.49.71-2.97 1.43-4.46 2.15-.21.1-.43.15-.63.13-.2-.02-.35-.1-.42-.23-.08-.13-.07-.3.01-.48.08-.18.24-.35.43-.48 1.38-.93 2.75-1.86 4.13-2.8 1.53-1.03 3.05-2.07 4.58-3.1l64.31 1.83Z" fill="#222"/>
          </svg>
          <svg class="ld-foot-tape r" viewBox="0 0 95 80" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
            <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="#222"/>
            <path d="M69.68 39.99c5.09-3.07 10.6-4.97 15.76-7.95l-1.83 6.83C80.28 32.39 75.7 26.5 72.23 20.08c-2.23-4.1-4.43-8.24-6.61-12.39l7.36 1.97c-2.41 1.26-4.82 2.52-7.24 3.77-6.58 3.4-13.19 6.73-19.83 10.04-6.63 3.3-13.29 6.56-19.96 9.8-4.53 2.2-9.07 4.39-13.61 6.58-1.99.96-3.98 1.92-5.97 2.88-1.49.71-2.97 1.43-4.46 2.15-.21.1-.43.15-.63.13-.2-.02-.35-.1-.42-.23-.08-.13-.07-.3.01-.48.08-.18.24-.35.43-.48 1.38-.93 2.75-1.86 4.13-2.8 1.53-1.03 3.05-2.07 4.58-3.1l64.31 1.83Z" fill="#222"/>
          </svg>

          <div class="ld-foot-grid">
            <div class="ld-foot-brand">
              <div class="nm">PermiGo</div>
              <p>L'application qui réunit le planning, le suivi et les paiements d'une auto-école. Pensée en France, pour des écoles françaises.</p>
            </div>

            <div class="ld-foot-col">
              <h4>Produit</h4>
              <ul>
                <li><a href="#ld-pricing">Tarif</a></li>
                <li><a href="#" id="ld-foot-demo">Démonstration</a></li>
                <li><a href="#" id="ld-foot-essai">Essai gratuit</a></li>
                <li><a href="#" id="ld-foot-login">Se connecter</a></li>
              </ul>
            </div>

            <div class="ld-foot-col">
              <h4>Ressources</h4>
              <ul>
                <li><a href="#">Centre d'aide <span class="soon">bientôt</span></a></li>
                <li><a href="#">Le métier <span class="soon">bientôt</span></a></li>
                <li><a href="#">Changelog <span class="soon">bientôt</span></a></li>
                <li><a href="#">Statut</a></li>
              </ul>
            </div>

            <div class="ld-foot-col">
              <h4>Société</h4>
              <ul>
                <li><a href="mailto:hello@permigo.fr">Nous écrire</a></li>
                <li><a href="#">Mentions légales</a></li>
                <li><a href="#">Confidentialité</a></li>
                <li><a href="#">Conditions</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="ld-foot-bottom">
          <div class="copy">
            <span>© 2026 PermiGo — Tous droits réservés.</span>
            <a href="#">Confidentialité</a>
            <a href="#">Conditions</a>
            <a href="mailto:hello@permigo.fr">Contact</a>
          </div>
          <div class="socials">
            <a href="https://www.linkedin.com" target="_blank" rel="nofollow noopener" aria-label="LinkedIn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a href="https://x.com" target="_blank" rel="nofollow noopener" aria-label="X">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

const FAQ_ICONS = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  exit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
};

function faqItem({ icon = 'shield', color = 'blue', q = '', a = '' } = {}) {
  return `
    <details class="ld-faq">
      <summary>
        <div class="ld-faq-ic ld-faq-ic-${color}">${FAQ_ICONS[icon] || FAQ_ICONS.shield}</div>
        <div class="ld-faq-q">${q}</div>
        <div class="ld-faq-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
      </summary>
      <div class="ld-faq-body">${a}</div>
    </details>
  `;
}

function wire(root) {
  // Tous les boutons "Inscrire mon auto-école" + footer essai → page inscription-ecole
  ['ld-signup-1', 'ld-signup-2', 'ld-signup-3', 'ld-signup-4', 'pb-center-btn', 'ld-foot-essai'].forEach(id => {
    root.querySelector('#' + id)?.addEventListener('click', async (e) => {
      e.preventDefault?.();
      const { navigate } = await import('@/router.js');
      navigate('/inscription-ecole');
    });
  });

  // "Se connecter" et "Voir la démo" et footer espace client → ouvre la page login
  // Signup élève → /signup
  root.querySelector('#ld-signup-eleve')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/signup');
  });

  ['ld-login', 'ld-login-2', 'ld-demo', 'ld-foot-demo', 'ld-foot-login'].forEach(id => {
    root.querySelector('#' + id)?.addEventListener('click', async (e) => {
      e.preventDefault?.();
      const { navigate } = await import('@/router.js');
      navigate('/login');
    });
  });
}

function startBeams(root) {
  // Les beams sont animés en CSS pur (stroke-dashoffset).
  // Cette fonction est gardée pour permettre un cleanup éventuel.
}
