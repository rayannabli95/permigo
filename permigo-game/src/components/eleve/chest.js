/**
 * Chest — coffre premium style Clash Royale avec illustration SVG riche et
 * séquence d'ouverture cinématique (shake → crack → light burst → reveal).
 *
 * Multi-tier : bronze / argent / or / légendaire selon le worldNum.
 *
 * Usage :
 *   import { renderChest, openChestModal, ensureChestStyles } from '@/components/eleve/chest.js';
 *   ensureChestStyles();
 *   `<div>${renderChest({ worldNum: 1, worldName: '...', opened: false })}</div>`
 */

import { esc } from '@/utils/escape.js';
import { icon } from '@/utils/icons.js';
import { markChestOpened } from '@/utils/game-state.js';
import { burstConfetti } from '@/components/common/confetti.js';
import { playWhoosh, playUnlock, playGold, playCoin } from '@/utils/sound.js';
import { lootToast } from '@/components/eleve/loot-toast.js';

// 4 mondes = 4 tiers de coffres avec leur identité visuelle
const TIERS = {
  1: { name: 'COFFRE DE BRONZE',  primary: 'var(--amk)', secondary: '#7c2d12', accent: 'var(--aml)', gem: 'var(--gr2)', xp: 200, gemmes: 50 },
  2: { name: 'COFFRE D\'ARGENT',  primary: 'var(--mu2)', secondary: 'var(--mu4)', accent: 'var(--bg4)', gem: '#a78bfa', xp: 400, gemmes: 100 },
  3: { name: 'COFFRE D\'OR',      primary: '#facc15', secondary: '#a16207', accent: '#fef9c3', gem: 'var(--or)', xp: 700, gemmes: 175 },
  4: { name: 'COFFRE LÉGENDAIRE', primary: 'var(--pul)', secondary: '#581c87', accent: '#f3e8ff', gem: '#ec4899', xp: 1200, gemmes: 300 },
};

/** Image PNG premium du coffre par monde (fournie par Rayan). */
function chestImage(worldNum) {
  return `/skins/chests/chest_world_${worldNum}.png`;
}

/** Rendu inline d'un coffre fermé / ouvert. */
export function renderChest({ worldNum, worldName, opened = false }) {
  const tier = TIERS[worldNum] || TIERS[1];
  return `
    <div class="chest-card ${opened ? 'opened' : 'unlocked'}"
         data-chest-world="${worldNum}" role="button" tabindex="0"
         aria-label="${opened ? `${tier.name} déjà ouvert` : `Ouvrir le ${tier.name}`}"
         style="--ch-1:${tier.primary};--ch-2:${tier.secondary};--ch-3:${tier.accent};--ch-gem:${tier.gem}">
      ${!opened ? '<div class="chest-rays" aria-hidden="true"></div>' : ''}
      <div class="chest-halo" aria-hidden="true"></div>
      <div class="chest-icon" aria-hidden="true">
        <img class="chest-icon-img" src="${chestImage(worldNum)}" alt="" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span class="chest-icon-emoji" style="display:none">🎁</span>
      </div>
      <div class="chest-label">
        <div class="chest-tier">${opened ? '✓ OUVERT' : tier.name}</div>
        <div class="chest-name">${esc(worldName)}</div>
        ${!opened ? `<div class="chest-cta">${icon('zap',{size:18})} +${tier.xp} XP &nbsp;·&nbsp; ${icon('gem',{size:13})} +${tier.gemmes}</div>` : ''}
      </div>
    </div>
  `;
}

/** Modal cinématique d'ouverture. onClaim() est appelé quand l'user clique "Réclamer". */
export function openChestModal({ worldNum, worldName, onClaim }) {
  if (document.querySelector('.chest-modal')) return;
  const tier = TIERS[worldNum] || TIERS[1];

  // Haptique mobile
  try { navigator.vibrate?.([60, 40, 80]); } catch (_) {}

  const modal = document.createElement('div');
  modal.className = 'chest-modal';
  modal.style.setProperty('--ch-1', tier.primary);
  modal.style.setProperty('--ch-2', tier.secondary);
  modal.style.setProperty('--ch-3', tier.accent);
  modal.style.setProperty('--ch-gem', tier.gem);
  modal.innerHTML = `
    <div class="chest-modal-bg" aria-hidden="true"></div>
    <div class="chest-modal-rays" aria-hidden="true"></div>
    <div class="chest-modal-panel" role="dialog" aria-modal="true" aria-labelledby="chest-modal-title">
      <div class="chest-modal-stage">
        <div class="chest-modal-glow"></div>
        <div class="chest-modal-spotlight"></div>
        <div class="chest-modal-burst" aria-hidden="true"></div>
        <div class="chest-modal-img-wrap">
          <img class="chest-modal-img" src="${chestImage(worldNum)}" alt="${esc(tier.name)}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
          <span class="chest-modal-emoji" style="display:none">🎁</span>
        </div>
      </div>
      <h2 class="chest-modal-title" id="chest-modal-title">${tier.name}</h2>
      <div class="chest-modal-sub">Monde ${worldNum} · ${esc(worldName)}</div>
      <div class="chest-rewards" id="chest-rewards"></div>
      <button class="chest-modal-close" id="chest-modal-close" type="button">RÉCLAMER LES RÉCOMPENSES</button>
    </div>
  `;
  document.body.appendChild(modal);

  const stage = modal.querySelector('.chest-modal-stage');
  const imgEl = modal.querySelector('.chest-modal-img');
  const burstEl = modal.querySelector('.chest-modal-burst');
  const rewards = modal.querySelector('#chest-rewards');
  const closeBtn = modal.querySelector('#chest-modal-close');
  closeBtn.style.opacity = '0';
  closeBtn.style.pointerEvents = 'none';

  // ─── SÉQUENCE D'OUVERTURE CINÉMATIQUE ───

  // NB : le crédit des gemmes est fait CÔTÉ SERVEUR par open_chest (migration
  // 0010), déclenché via onClaim → game-state.openChest(). On ne crédite plus
  // côté client (l'ancien addGemmes était bloqué par protect_profile_fields).
  // L'animation ci-dessous n'affiche que les récompenses (barème = serveur).

  // Phase 1 : 3 vibrations (0-900ms)
  stage.classList.add('cm-shaking');
  playWhoosh();
  try { navigator.vibrate?.([50, 80, 50, 80, 50]); } catch (_) {}

  setTimeout(() => {
    stage.classList.remove('cm-shaking');

    // Phase 2 : pop du coffre + flash + burst de lumière (900ms)
    playUnlock();
    if (imgEl) imgEl.classList.add('cm-img-pop');
    if (burstEl) burstEl.classList.add('go');
    document.body.classList.add('cm-flash');
    setTimeout(() => document.body.classList.remove('cm-flash'), 240);

    // Phase 3 : light burst massif + confettis (1100ms)
    setTimeout(() => {
      try { navigator.vibrate?.(120); } catch (_) {}

      // Burst confetti depuis le centre (couleurs du tier)
      playGold();
      burstConfetti({ x: 0.5, y: 0.4, count: 180, power: 22, spread: Math.PI });

      // Phase 4 : Cascade de récompenses (1300ms+)
      const list = [
        { icon: icon('zap',{size:20}), label: `+${tier.xp} XP`, delay: 150 },
        { icon: icon('gem',{size:20}), label: `+${tier.gemmes} Gemmes`, delay: 450 },
        { icon: icon('trophy',{size:20}), label: `Titre "Maître ${worldName}"`, delay: 800 },
      ];
      list.forEach((r) => {
        setTimeout(() => {
          const d = document.createElement('div');
          d.className = 'chest-reward';
          d.innerHTML = `<span class="ic">${r.icon}</span><span class="lb">${esc(r.label)}</span><span class="shine"></span>`;
          rewards.appendChild(d);
          playCoin();
          lootToast({ icon: r.icon, label: r.label, subLabel: tier.name, kind: 'gold' });
          try { navigator.vibrate?.(30); } catch (_) {}
        }, r.delay);
      });

      // Phase 5 : Bouton "Réclamer" apparaît (≈1150ms après lid)
      setTimeout(() => {
        closeBtn.style.transition = 'opacity .4s ease,transform .4s cubic-bezier(.5,1.6,.4,1)';
        closeBtn.style.opacity = '1';
        closeBtn.style.pointerEvents = '';
      }, 1150);
    }, 240);
  }, 900);

  let claimed = false;
  const dismiss = (viaClaim = false) => {
    markChestOpened(worldNum);
    // Persistance DB + UI uniquement si l'user a réclamé (clic bouton), pas si fermeture via bg
    if (viaClaim && !claimed) {
      claimed = true;
      try { onClaim?.(); } catch (e) { console.warn('[chest] onClaim error', e); }
    }
    modal.classList.add('cm-closing');
    setTimeout(() => modal.remove(), 280);
  };
  closeBtn.addEventListener('click', () => dismiss(true));
  modal.querySelector('.chest-modal-bg').addEventListener('click', () => dismiss(true));
}

/** SVG illustré du coffre — multi-layered avec reflets et détails. */
function chestSVG({ id, primary, secondary, accent, gem, opened = false, big = false }) {
  const size = big ? 260 : 100;
  return `
    <svg viewBox="0 0 100 110" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="${big ? 'max-width:' + size + 'px;' : ''}">
      <defs>
        <!-- Gradient body : sombre en bas, clair en haut -->
        <linearGradient id="${id}-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${primary}"/>
          <stop offset="60%" stop-color="${primary}"/>
          <stop offset="100%" stop-color="${secondary}"/>
        </linearGradient>
        <!-- Gradient lid : reflet métallique -->
        <linearGradient id="${id}-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${accent}"/>
          <stop offset="30%" stop-color="${primary}"/>
          <stop offset="100%" stop-color="${secondary}"/>
        </linearGradient>
        <!-- Reflet bright sur le couvercle -->
        <linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0"/>
          <stop offset="50%" stop-color="${accent}" stop-opacity=".6"/>
          <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
        </linearGradient>
        <!-- Glow filter -->
        <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Ombre sous le coffre -->
      <ellipse cx="50" cy="102" rx="38" ry="3" fill="rgba(0,0,0,.4)" filter="url(#${id}-glow)"/>

      <!-- BODY (corps principal) -->
      <path d="M 16 50 L 16 92 Q 16 96 20 96 L 80 96 Q 84 96 84 92 L 84 50 Z" fill="url(#${id}-body)" stroke="#1a1208" stroke-width="2.5"/>

      <!-- Garniture bois ou métal sur le body (bandes) -->
      <rect x="14" y="64" width="72" height="4" fill="#1a1208" opacity=".85"/>
      <rect x="14" y="80" width="72" height="3" fill="#1a1208" opacity=".7"/>

      <!-- Rivets sur les coins -->
      <circle cx="22" cy="58" r="2.2" fill="${secondary}" stroke="#1a1208" stroke-width=".8"/>
      <circle cx="78" cy="58" r="2.2" fill="${secondary}" stroke="#1a1208" stroke-width=".8"/>
      <circle cx="22" cy="88" r="2.2" fill="${secondary}" stroke="#1a1208" stroke-width=".8"/>
      <circle cx="78" cy="88" r="2.2" fill="${secondary}" stroke="#1a1208" stroke-width=".8"/>

      <!-- Highlight body droit (reflet) -->
      <rect x="76" y="52" width="6" height="42" fill="${accent}" opacity=".22" rx="2"/>

      <!-- LID (couvercle) -->
      <g class="cm-lid" style="transform-origin:50% 50%">
        <path d="M 14 50 L 14 36 Q 14 24 26 22 L 74 22 Q 86 24 86 36 L 86 50 Q 86 52 84 52 L 16 52 Q 14 52 14 50 Z" fill="url(#${id}-lid)" stroke="#1a1208" stroke-width="2.5"/>
        <!-- Reflet brillant horizontal -->
        <rect x="16" y="28" width="68" height="3" fill="url(#${id}-shine)" rx="1.5"/>
        <!-- Rivet centrale sur le lid -->
        <circle cx="50" cy="32" r="3" fill="${secondary}" stroke="#1a1208" stroke-width="1"/>
        <circle cx="50" cy="32" r="1.2" fill="${accent}"/>
        <!-- Gemmes décoratives sur le lid (style Clash Royale) -->
        <circle cx="30" cy="34" r="2.5" fill="${gem}" stroke="#1a1208" stroke-width=".8" filter="url(#${id}-glow)"/>
        <circle cx="30" cy="34" r="1" fill="#fff" opacity=".7"/>
        <circle cx="70" cy="34" r="2.5" fill="${gem}" stroke="#1a1208" stroke-width=".8" filter="url(#${id}-glow)"/>
        <circle cx="70" cy="34" r="1" fill="#fff" opacity=".7"/>
      </g>

      <!-- LOCK (cadenas) — au centre, entre lid et body -->
      ${!opened ? `
        <g class="cm-lock" style="transform-origin:50% 50%">
          <rect x="42" y="48" width="16" height="20" rx="3" fill="#1a1208" stroke="${accent}" stroke-width="1"/>
          <path d="M 46 48 L 46 44 Q 46 40 50 40 Q 54 40 54 44 L 54 48" fill="none" stroke="${accent}" stroke-width="1.8"/>
          <circle cx="50" cy="58" r="2.5" fill="${gem}" filter="url(#${id}-glow)"/>
        </g>
      ` : ''}

      <!-- Particules sparkle pour les coffres fermés -->
      ${!opened ? `
        <g class="chest-sparks">
          <circle class="csp s1" cx="20" cy="30" r="1.8" fill="${accent}"/>
          <circle class="csp s2" cx="80" cy="26" r="1.5" fill="${accent}"/>
          <circle class="csp s3" cx="55" cy="18" r="1.2" fill="${accent}"/>
          <circle class="csp s4" cx="32" cy="14" r="1.5" fill="${accent}"/>
          <circle class="csp s5" cx="68" cy="40" r="1" fill="${accent}"/>
        </g>
      ` : ''}
    </svg>
  `;
}

// ─── Styles (1× par session) ───
let _chestCssInjected = false;
export function ensureChestStyles() {
  if (_chestCssInjected) return;
  _chestCssInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    /* ╔══ COFFRE INLINE ══════════════════════════════════════════╗ */
    .chest-card{
      position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;
      padding:22px 22px 22px;margin:22px auto 12px;max-width:300px;
      background:radial-gradient(ellipse at 50% 0%,var(--ch-3) 0%,#fef9c3 25%,#fff 60%);
      border:2px solid var(--ch-1);
      border-radius:22px;
      box-shadow:
        0 22px 50px -12px var(--ch-1),
        0 0 0 6px rgba(255,255,255,.5),
        inset 0 -4px 0 rgba(0,0,0,.06),
        inset 0 2px 0 rgba(255,255,255,.8);
      cursor:pointer;
      transition:transform .25s cubic-bezier(.2,.7,.3,1),box-shadow .3s;
      outline:none;overflow:hidden;
    }
    .chest-card:hover{transform:translateY(-5px) scale(1.03);box-shadow:0 30px 60px -10px var(--ch-1),0 0 0 6px rgba(255,255,255,.6),inset 0 -4px 0 rgba(0,0,0,.06),inset 0 2px 0 rgba(255,255,255,.8)}
    .chest-card:focus-visible{box-shadow:0 22px 50px -12px var(--ch-1),0 0 0 6px color-mix(in srgb, var(--a) 50%, transparent),inset 0 -4px 0 rgba(0,0,0,.06),inset 0 2px 0 rgba(255,255,255,.8)}
    .chest-card.opened{opacity:.5;cursor:default;filter:saturate(.4)}
    .chest-card.opened:hover{transform:none}

    /* Rayons rotatifs derrière le coffre */
    .chest-rays{
      position:absolute;inset:-50%;
      background:
        repeating-conic-gradient(from 0deg at 50% 50%,
          var(--ch-3) 0deg,var(--ch-3) 12deg,
          transparent 12deg,transparent 30deg);
      opacity:.4;
      animation:chest-rays-spin 14s linear infinite;
      pointer-events:none;z-index:-1;
      mask-image:radial-gradient(circle,#000 30%,transparent 70%);
    }
    @keyframes chest-rays-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

    /* Halo doré qui pulse */
    .chest-halo{
      position:absolute;inset:-30px;
      background:radial-gradient(ellipse at center,var(--ch-1) 0%,transparent 60%);
      opacity:.45;filter:blur(28px);z-index:-1;
      animation:chest-halo-pulse 2.6s ease-in-out infinite;
    }
    @keyframes chest-halo-pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.6;transform:scale(1.1)}}

    /* Jiggle subtil sur coffre fermé */
    .chest-card.unlocked{animation:chest-jiggle 3.5s ease-in-out infinite}
    @keyframes chest-jiggle{
      0%,86%,100%{transform:rotate(0deg) translateY(0)}
      88%{transform:rotate(-4deg) translateY(-2px)}
      91%{transform:rotate(4deg) translateY(-2px)}
      94%{transform:rotate(-2deg) translateY(0)}
      97%{transform:rotate(2deg) translateY(0)}
    }

    .chest-icon{width:120px;height:130px;position:relative;z-index:2}

    /* Sparkles SVG sur le lid */
    .chest-sparks .csp{animation:chest-spark 1.6s ease-in-out infinite}
    .chest-sparks .csp.s2{animation-delay:.3s}
    .chest-sparks .csp.s3{animation-delay:.6s}
    .chest-sparks .csp.s4{animation-delay:.9s}
    .chest-sparks .csp.s5{animation-delay:1.2s}
    @keyframes chest-spark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.6)}}

    .chest-label{text-align:center;z-index:2;position:relative}
    .chest-tier{
      font-family:var(--fd);font-size:10px;font-weight:900;
      color:var(--ch-2);letter-spacing:.22em;text-transform:uppercase;
      text-shadow:0 1px 0 rgba(255,255,255,.6);
    }
    .chest-name{font-family:var(--fd);font-size:18px;font-weight:900;color:#1a1208;letter-spacing:-.01em;margin-top:4px}
    .chest-cta{
      font-family:var(--fn);font-size:11px;font-weight:900;
      color:var(--ch-2);margin-top:8px;letter-spacing:.06em;
      padding:6px 14px;background:rgba(255,255,255,.7);
      border-radius:99px;display:inline-block;
      border:1px solid var(--ch-1);
    }

    /* ╔══ MODAL D'OUVERTURE ══════════════════════════════════════╗ */
    .chest-modal{
      position:fixed;inset:0;z-index:300;
      display:flex;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top, 0px) + 14px) 14px calc(env(safe-area-inset-bottom, 0px) + 14px);
    }
    .chest-modal-bg{
      position:absolute;inset:0;
      background:
        radial-gradient(ellipse at center,var(--ch-2) 0%,var(--ink) 60%,#000 100%);
      backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
      animation:fadeIn .3s;
    }
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}

    /* Rayons divins en arrière-plan */
    .chest-modal-rays{
      position:absolute;inset:-50%;
      background:repeating-conic-gradient(from 0deg at 50% 50%,
        var(--ch-3) 0deg,var(--ch-3) 4deg,
        transparent 4deg,transparent 18deg);
      opacity:.18;
      animation:chest-rays-spin 18s linear infinite;
      pointer-events:none;
      mask-image:radial-gradient(circle,#000 40%,transparent 70%);
    }

    .chest-modal-panel{
      position:relative;
      background:linear-gradient(160deg,#1a1208 0%,#2d1810 30%,var(--ink) 100%);
      width:100%;max-width:480px;border-radius:32px;
      padding:36px 24px 24px;
      color:#fff;text-align:center;
      box-shadow:
        0 40px 100px -20px rgba(0,0,0,.8),
        0 0 0 1px rgba(251,191,36,.3) inset,
        0 0 50px var(--ch-1);
      border:2px solid var(--ch-1);
      animation:cm-pop .45s cubic-bezier(.5,1.7,.4,1);
    }
    @keyframes cm-pop{from{transform:scale(.65);opacity:0}to{transform:scale(1);opacity:1}}

    .chest-modal-stage{
      position:relative;display:flex;align-items:center;justify-content:center;
      margin-bottom:20px;height:240px;
    }
    .chest-modal-img-wrap{position:relative;z-index:2;width:240px;height:240px;display:flex;align-items:center;justify-content:center}
    .chest-modal-img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 14px 30px rgba(0,0,0,.55))}
    .chest-modal-emoji{font-size:150px;line-height:1}
    /* Burst de lumière à l'ouverture */
    .chest-modal-burst{position:absolute;inset:-12%;border-radius:50%;z-index:1;pointer-events:none;opacity:0;
      background:radial-gradient(circle,#fff 0%,var(--ch-3) 24%,var(--ch-1) 42%,transparent 62%)}
    .chest-modal-burst.go{animation:cm-burst .85s ease-out forwards}
    @keyframes cm-burst{0%{opacity:0;transform:scale(.4)}28%{opacity:.95;transform:scale(1.1)}100%{opacity:0;transform:scale(1.8)}}
    /* Pop rebond du coffre */
    .chest-modal-img.cm-img-pop{animation:cm-img-pop .7s cubic-bezier(.34,1.56,.64,1)}
    @keyframes cm-img-pop{0%{transform:scale(1)}28%{transform:scale(.88) rotate(-3deg)}60%{transform:scale(1.2) rotate(2deg)}100%{transform:scale(1.06)}}
    /* Coffre inline (parcours) */
    .chest-icon-img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,.3))}
    .chest-icon-emoji{font-size:96px;line-height:1}

    /* Glow massif derrière le coffre */
    .chest-modal-glow{
      position:absolute;inset:-30px;
      background:radial-gradient(ellipse at center,var(--ch-1) 0%,var(--ch-3) 30%,transparent 65%);
      opacity:.6;filter:blur(30px);
      animation:cm-glow 2s ease-in-out infinite alternate;
    }
    @keyframes cm-glow{0%{opacity:.4;transform:scale(.95)}100%{opacity:.85;transform:scale(1.18)}}

    /* Spotlight depuis le bas */
    .chest-modal-spotlight{
      position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);
      width:300px;height:50px;
      background:radial-gradient(ellipse,var(--ch-1) 0%,transparent 70%);
      opacity:.7;filter:blur(8px);
    }

    /* Shake intense */
    .cm-shaking{animation:cm-shake .1s ease-in-out 8}
    @keyframes cm-shake{
      0%,100%{transform:translate(0,0) rotate(0)}
      25%{transform:translate(-8px,2px) rotate(-3deg)}
      75%{transform:translate(8px,-2px) rotate(3deg)}
    }

    /* Crack du cadenas */
    .cm-lock-crack{animation:cm-lock-burst .35s cubic-bezier(.5,1.6,.4,1) forwards}
    @keyframes cm-lock-burst{
      0%{transform:scale(1);opacity:1}
      40%{transform:scale(1.4);opacity:1}
      100%{transform:scale(2.5);opacity:0;filter:blur(8px)}
    }

    /* Lid s'envole avec rotation */
    .cm-lid{transition:none}
    .cm-lid-fly{animation:cm-lid-explode 1.2s cubic-bezier(.34,1.56,.64,1) forwards}
    @keyframes cm-lid-explode{
      0%{transform:translateY(0) rotate(0) scale(1)}
      30%{transform:translateY(-30px) rotate(-12deg) scale(1.08)}
      70%{transform:translateY(-140px) rotate(-35deg) scale(.95);opacity:1}
      100%{transform:translateY(-260px) rotate(-55deg) scale(.7);opacity:0}
    }

    /* Flash white sur tout l'écran à l'ouverture */
    body.cm-flash::after{
      content:'';position:fixed;inset:0;
      background:radial-gradient(ellipse at center,rgba(255,255,255,.85) 0%,transparent 50%);
      z-index:9999;pointer-events:none;
      animation:cm-flash-fade .24s ease-out forwards;
    }
    @keyframes cm-flash-fade{from{opacity:1}to{opacity:0}}

    .chest-modal-title{
      font-family:var(--fd);font-size:28px;font-weight:900;
      letter-spacing:.04em;margin:0;text-transform:uppercase;
      background:linear-gradient(180deg,#fff 0%,var(--ch-3) 100%);
      -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
      text-shadow:0 4px 20px var(--ch-1);
      filter:drop-shadow(0 0 12px var(--ch-1));
    }
    .chest-modal-sub{font-size:13px;color:rgba(255,255,255,.6);font-weight:700;margin-top:6px;letter-spacing:.5px}

    .chest-rewards{
      display:flex;flex-direction:column;gap:10px;
      margin:22px 0;min-height:150px;
      justify-content:center;align-items:center;
    }
    .chest-reward{
      display:inline-flex;align-items:center;gap:12px;
      padding:12px 22px;
      background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.04));
      backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
      border:1px solid rgba(251,191,36,.4);
      border-radius:99px;
      font-family:var(--fd);font-weight:900;font-size:16px;
      color:var(--aml);
      animation:cm-reward-in .55s cubic-bezier(.5,1.7,.4,1) both;
      letter-spacing:-.005em;
      position:relative;overflow:hidden;
      box-shadow:0 8px 24px -4px var(--ch-1);
    }
    @keyframes cm-reward-in{
      0%{opacity:0;transform:translateY(40px) scale(.5) rotate(-8deg);filter:blur(8px)}
      60%{opacity:1;transform:translateY(-4px) scale(1.08) rotate(2deg);filter:blur(0)}
      100%{opacity:1;transform:translateY(0) scale(1) rotate(0)}
    }
    .chest-reward .ic{font-size:24px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))}
    .chest-reward .shine{
      position:absolute;top:0;left:-100%;width:60%;height:100%;
      background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.5) 50%,transparent 70%);
      animation:cm-reward-shine 2.2s ease-in-out infinite;
    }
    @keyframes cm-reward-shine{0%{left:-100%}50%,100%{left:200%}}

    .chest-modal-close{
      padding:16px 28px;border-radius:99px;
      background:linear-gradient(180deg,#fef3c7 0%,var(--aml2) 100%);
      color:#451a03;border:0;
      font-family:var(--fd);font-size:14px;font-weight:900;
      cursor:pointer;letter-spacing:.6px;width:100%;
      box-shadow:
        0 10px 24px -4px rgba(251,191,36,.6),
        inset 0 -3px 0 rgba(0,0,0,.15),
        inset 0 2px 0 rgba(255,255,255,.6);
      transition:transform .15s,box-shadow .2s;
      text-transform:uppercase;
    }
    .chest-modal-close:hover{transform:translateY(-2px);box-shadow:0 14px 30px -4px rgba(251,191,36,.7),inset 0 -3px 0 rgba(0,0,0,.15),inset 0 2px 0 rgba(255,255,255,.6)}
    .chest-modal-close:active{transform:translateY(0)}
    .chest-modal.cm-closing .chest-modal-panel{animation:cm-out .28s ease-in forwards}
    @keyframes cm-out{to{transform:scale(.85);opacity:0;filter:blur(4px)}}

    @media (prefers-reduced-motion:reduce){
      .chest-card.unlocked,.chest-halo,.chest-rays,.csp,.chest-modal-rays,
      .cm-shaking,.cm-img-pop,.chest-modal-burst.go{animation:none}
    }
  `;
  document.head.appendChild(style);
}
