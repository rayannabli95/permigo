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

let _cosmos = null;
let _scrollHandler = null;
let _heroScrub = null;

export function mount(root) {
  root.innerHTML = template();
  wire(root);
  startBeams(root);
  mountStarfield(root);
  setupScrollProgress(root);
  splitTitle(root);
  setupReveals(root);

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

      /* ─── Background premium (gradient + grille + STARFIELD canvas) ─── */
      .ld-bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
      .ld-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,#6366f1 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,#8b5cf6 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,#0891b2 0%,transparent 40%);filter:blur(60px);opacity:.4;animation:ld-float 22s ease-in-out infinite alternate;z-index:0}
      @keyframes ld-float{0%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(40px,-30px) rotate(180deg) scale(1.08)}100%{transform:translate(-30px,40px) rotate(360deg) scale(.96)}}
      .ld-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,transparent 0%,rgba(11,13,26,.6) 100%);z-index:2}
      .ld-bg canvas{z-index:1}

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

      /* Footer */
      .ld-foot{position:relative;z-index:5;text-align:center;padding:30px 20px;font-size:12px;color:rgba(255,255,255,.4);border-top:1px solid rgba(255,255,255,.05)}
      .ld-foot a{color:rgba(255,255,255,.7);text-decoration:none;margin:0 8px}
    </style>

    <div class="ld-root">
      <div class="ld-bg"></div>
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
          <span class="badge">SAAS</span>
        </div>
        <div class="ld-nav-r">
          <button class="ld-btn ld-btn-ghost" id="ld-login">Se connecter</button>
          <button class="ld-btn ld-btn-ghost" id="ld-signup-eleve">Je suis élève</button>
          <button class="ld-btn ld-btn-p" id="ld-signup-1">Inscrire mon auto-école</button>
        </div>
      </nav>

      <!-- ─── Hero ─── -->
      <section class="ld-hero">
        <div class="update-badge" style="margin-bottom:14px"><span class="pill">NOUVEAU</span>✨ Trophées REMC débloquables ➜</div>
        <div class="ld-eyebrow"><span class="dot"></span>Le SaaS auto-école nouvelle génération</div>
        <h1 class="ld-h1">Toute votre auto-école dans <span class="grad">une seule app</span>.</h1>
        <p class="ld-sub">PermiGo connecte élèves, moniteurs et gérants sur une plateforme unique. Planning, livret REMC, réservation, évaluation, statistiques — tout y est.</p>
        <div class="ld-cta-row">
          <button class="ld-btn ld-btn-p ld-btn-lg" id="ld-signup-2">Inscrire mon auto-école →</button>
          <button class="ld-btn ld-btn-ghost ld-btn-lg" id="ld-demo">Voir la démo</button>
        </div>

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
              <div class="nm">Moniteur</div>
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

      <!-- ─── Features ─── -->
      <section class="ld-section">
        <div class="ld-section-h reveal">
          <div class="lbl">Une app pour chaque rôle</div>
          <h2>Pensée pour vous, conçue pour eux.</h2>
          <p>Chaque rôle a son interface dédiée — simple, focalisée sur l'essentiel, sans formation nécessaire.</p>
        </div>
        <div class="ld-features reveal reveal-stagger">
          <div class="ld-feat">
            <div class="em">🎓</div>
            <div class="role">Espace élève</div>
            <h3>Le permis qui motive.</h3>
            <p>Suivi visuel REMC, réservation en 2 clics, feedback après chaque leçon — l'élève voit son progrès et reste engagé.</p>
            <ul>
              <li>Parcours REMC interactif (31 compétences)</li>
              <li>Réservation autonome des créneaux</li>
              <li>Feedback étoilé du moniteur en temps réel</li>
              <li>Trophées et progression gamifiée</li>
            </ul>
          </div>
          <div class="ld-feat">
            <div class="em">🚗</div>
            <div class="role">Espace moniteur</div>
            <h3>Plus d'élèves, moins d'admin.</h3>
            <p>Planning visuel, livret REMC numérique, notes privées par élève — toute la pédagogie centralisée dans un seul outil.</p>
            <ul>
              <li>Planning semaine drag-and-drop</li>
              <li>Validation REMC en bottom sheet</li>
              <li>Évaluation post-leçon en 30s</li>
              <li>Fiches élève complètes + notes privées</li>
            </ul>
          </div>
          <div class="ld-feat">
            <div class="em">👑</div>
            <div class="role">Espace gérant</div>
            <h3>Pilotez en temps réel.</h3>
            <p>Le tableau de bord qu'il vous faut — CA, occupation, élèves actifs — tout en un seul écran, à jour à la seconde.</p>
            <ul>
              <li>KPIs financiers (CA mensuel, factures)</li>
              <li>Taux d'occupation par moniteur</li>
              <li>Pipeline élèves + alertes inactifs</li>
              <li>Export comptable CSV</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ─── PulseBeams — écosystème connecté ─── -->
      <section class="ld-section ld-ecosystem">
        <div class="ld-section-h">
          <div class="lbl">Un écosystème entièrement connecté</div>
          <h2>Tout circule. Tout est lié.</h2>
          <p>Réservation, validation, évaluation, paiement — les actions de chaque rôle déclenchent des mises à jour en temps réel partout dans l'écosystème.</p>
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

      <!-- ─── Comment ça marche ─── -->
      <section class="ld-section">
        <div class="ld-section-h reveal">
          <div class="lbl">Démarrage en 3 étapes</div>
          <h2>Opérationnel en 24h.</h2>
          <p>Pas de migration complexe. Pas de formation longue. Pas de surprise.</p>
        </div>
        <div class="ld-steps reveal reveal-stagger">
          <div class="ld-step">
            <div class="n">1</div>
            <h4>Création du compte gérant</h4>
            <p>Vous nous donnez le nom de votre auto-école. On crée votre espace en 2 min.</p>
          </div>
          <div class="ld-step">
            <div class="n">2</div>
            <h4>Import de vos moniteurs & élèves</h4>
            <p>Téléversez un CSV ou ajoutez-les un par un. Ils reçoivent leur lien d'invitation.</p>
          </div>
          <div class="ld-step">
            <div class="n">3</div>
            <h4>Vos moniteurs ouvrent leurs dispos</h4>
            <p>Les élèves réservent. Vous voyez le CA grimper dans votre dashboard. C'est tout.</p>
          </div>
        </div>
      </section>

      <!-- ─── Tarif ─── -->
      <section class="ld-section" id="ld-pricing">
        <div class="ld-section-h reveal">
          <div class="lbl">Tarif simple</div>
          <h2>Une seule formule. Tout inclus.</h2>
          <p>Pas de palier, pas d'engagement, pas de coût caché.</p>
        </div>
        <div class="ld-pricing reveal scale">
          <div class="tag">⚡ Lancement</div>
          <div class="price">49<small>€ / mois</small></div>
          <div class="price-sub">par moniteur · sans engagement · TVA incluse</div>
          <ul>
            <li>Élèves & moniteurs illimités</li>
            <li>Livret REMC numérique officiel</li>
            <li>Réservation autonome élève</li>
            <li>Notifications temps réel</li>
            <li>Export comptable CSV</li>
            <li>Mises à jour incluses à vie</li>
            <li>Support email J+1</li>
          </ul>
          <button class="ld-btn ld-btn-p ld-btn-lg" style="width:100%" id="ld-signup-3">Démarrer l'essai gratuit 14 jours</button>
        </div>
      </section>

      <!-- ─── Final CTA ─── -->
      <section class="ld-final reveal">
        <h2>Prêt à moderniser votre auto-école ?</h2>
        <p>Rejoignez les auto-écoles qui passent à un outil pensé pour 2026.</p>
        <button class="ld-btn ld-btn-p ld-btn-lg" id="ld-signup-4">Inscrire mon auto-école →</button>
      </section>

      <!-- ─── Footer ─── -->
      <div class="ld-foot">
        PermiGo · v7 · 2026 — <a href="#" id="ld-login-2">Espace client</a> · <a href="#">Conditions</a> · <a href="#">Confidentialité</a> · <a href="#">Contact</a>
      </div>
    </div>
  `;
}

function wire(root) {
  // Tous les boutons "Inscrire" → toast placeholder
  ['ld-signup-1', 'ld-signup-2', 'ld-signup-3', 'ld-signup-4', 'pb-center-btn'].forEach(id => {
    root.querySelector('#' + id)?.addEventListener('click', () => {
      toast('Formulaire d\'inscription à venir 🚧 — contactez-nous à hello@permigo.fr', 'success');
    });
  });

  // "Se connecter" et "Voir la démo" et footer espace client → ouvre la page login
  // Signup élève → /signup
  root.querySelector('#ld-signup-eleve')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/signup');
  });

  ['ld-login', 'ld-login-2', 'ld-demo'].forEach(id => {
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
