/**
 * Reward Reveal — animation "barcode scan" pour les moments dopamine.
 *
 * Cas d'usage :
 *   - Trophée débloqué (page Trophées élève)
 *   - Compétence validée par l'enseignant
 *   - Niveau up (10h, 20h, etc.)
 *   - Achat boutique
 *
 * Usage simple :
 *   import { showRewardReveal } from '@/components/eleve/reward-reveal.js';
 *   showRewardReveal({ text: 'TROPHÉE DÉBLOQUÉ', sub: 'Conducteur urbain' });
 *
 * Variants : 'gold' | 'platinum' | 'fire' | 'neon' | 'mint'
 */

import { playReward } from '@/utils/sound.js';

let _hostEl = null;

function ensureHost() {
  if (_hostEl && document.body.contains(_hostEl)) return _hostEl;
  _hostEl = document.createElement('div');
  _hostEl.id = 'reward-reveal-host';
  document.body.appendChild(_hostEl);
  injectStyles();
  return _hostEl;
}

function injectStyles() {
  if (document.getElementById('reward-reveal-styles')) return;
  const style = document.createElement('style');
  style.id = 'reward-reveal-styles';
  style.textContent = REWARD_REVEAL_CSS;
  document.head.appendChild(style);
}

/**
 * Affiche une révélation de récompense.
 * @param {object} opts
 * @param {string} opts.text          - Texte principal (ex: "TROPHÉE DÉBLOQUÉ")
 * @param {string} [opts.sub]         - Sous-texte (ex: nom du trophée)
 * @param {string} [opts.emoji]       - Emoji ou icône (ex: '🏆')
 * @param {string} [opts.variant]     - gold / platinum / fire / neon / mint
 * @param {number} [opts.duration]    - durée totale ms (default 3500)
 * @param {function} [opts.onClose]   - callback à la fermeture
 * @param {boolean} [opts.haptic]     - vibration mobile (default true)
 */
export function showRewardReveal({
  text = 'RÉCOMPENSE',
  sub = '',
  emoji = '🏆',
  variant = 'gold',
  duration = 3500,
  onClose,
  haptic = true,
} = {}) {
  const host = ensureHost();

  // Haptic feedback sur mobile
  if (haptic && navigator.vibrate) {
    try { navigator.vibrate([30, 50, 30]); } catch {}
  }
  playReward();

  const node = document.createElement('div');
  node.className = `rr-overlay rr-variant-${variant}`;
  node.innerHTML = `
    <div class="rr-bg" aria-hidden="true"></div>
    <div class="rr-rays" aria-hidden="true">
      <div></div><div></div><div></div><div></div>
      <div></div><div></div><div></div><div></div>
    </div>
    <div class="rr-card" role="dialog" aria-label="Récompense débloquée">
      <div class="rr-emoji">${emoji}</div>
      <div class="rr-scan-wrap">
        <span class="rr-text">${escapeHtml(text)}</span>
        <span class="rr-text rr-text-reveal" aria-hidden="true">${escapeHtml(text)}</span>
        <div class="rr-bar rr-bar-blur"></div>
        <div class="rr-bar rr-bar-line"></div>
      </div>
      ${sub ? `<div class="rr-sub">${escapeHtml(sub)}</div>` : ''}
      <button class="rr-close" type="button" aria-label="Fermer">Continuer</button>
    </div>
  `;
  host.appendChild(node);

  // Trigger anim
  requestAnimationFrame(() => node.classList.add('rr-in'));

  // Confettis simples (CSS particles)
  const particleCount = 24;
  const particles = document.createElement('div');
  particles.className = 'rr-particles';
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('span');
    const angle = (360 / particleCount) * i + (Math.random() * 20 - 10);
    const dist = 200 + Math.random() * 200;
    const delay = Math.random() * 0.4;
    p.style.setProperty('--rr-angle', `${angle}deg`);
    p.style.setProperty('--rr-dist', `${dist}px`);
    p.style.setProperty('--rr-delay', `${delay}s`);
    particles.appendChild(p);
  }
  node.querySelector('.rr-card').appendChild(particles);

  const close = () => {
    node.classList.remove('rr-in');
    node.classList.add('rr-out');
    setTimeout(() => {
      node.remove();
      if (typeof onClose === 'function') onClose();
    }, 280);
  };

  node.querySelector('.rr-close')?.addEventListener('click', close);
  node.querySelector('.rr-bg')?.addEventListener('click', close);

  // Auto-close
  const autoTimer = setTimeout(close, duration);
  node.addEventListener('click', (e) => {
    if (e.target.closest('.rr-close') || e.target.classList.contains('rr-bg')) {
      clearTimeout(autoTimer);
    }
  });

  return { close };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const REWARD_REVEAL_CSS = `
  /* Host fullscreen */
  #reward-reveal-host{position:fixed;inset:0;pointer-events:none;z-index:9999}

  .rr-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:auto;opacity:0;transition:opacity .25s ease}
  .rr-overlay.rr-in{opacity:1}
  .rr-overlay.rr-out{opacity:0}

  .rr-bg{position:absolute;inset:0;background:rgba(8,10,20,.78);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}

  /* Rayons lumineux qui sortent du centre */
  .rr-rays{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
  .rr-rays div{
    position:absolute;
    width:2px;
    height:140vh;
    background:linear-gradient(180deg, transparent 0%, rgba(255,200,80,.18) 30%, rgba(255,200,80,.4) 50%, rgba(255,200,80,.18) 70%, transparent 100%);
    transform-origin:center;
    opacity:0;
    animation:rr-ray-rotate 8s linear infinite;
  }
  .rr-rays div:nth-child(1){transform:rotate(0deg);animation-delay:0s}
  .rr-rays div:nth-child(2){transform:rotate(45deg);animation-delay:.5s}
  .rr-rays div:nth-child(3){transform:rotate(90deg);animation-delay:1s}
  .rr-rays div:nth-child(4){transform:rotate(135deg);animation-delay:1.5s}
  .rr-rays div:nth-child(5){transform:rotate(180deg);animation-delay:2s}
  .rr-rays div:nth-child(6){transform:rotate(225deg);animation-delay:2.5s}
  .rr-rays div:nth-child(7){transform:rotate(270deg);animation-delay:3s}
  .rr-rays div:nth-child(8){transform:rotate(315deg);animation-delay:3.5s}
  .rr-in .rr-rays div{opacity:.8}
  @keyframes rr-ray-rotate{
    0%{transform:rotate(0deg)}
    100%{transform:rotate(360deg)}
  }

  /* Card centrale */
  .rr-card{
    position:relative;
    z-index:2;
    text-align:center;
    padding:36px 30px;
    transform:scale(.6);
    opacity:0;
    transition:transform .55s cubic-bezier(.34,1.56,.64,1), opacity .35s ease;
    max-width:90vw;
  }
  .rr-in .rr-card{transform:scale(1);opacity:1}
  .rr-out .rr-card{transform:scale(.9);opacity:0}

  /* Emoji top */
  .rr-emoji{
    font-size:88px;
    line-height:1;
    margin-bottom:18px;
    text-shadow:0 0 30px rgba(255,200,80,.5);
    animation:rr-bounce 1.6s ease-in-out infinite;
    display:inline-block;
  }
  @keyframes rr-bounce{
    0%,100%{transform:translateY(0) rotate(-3deg)}
    50%{transform:translateY(-10px) rotate(3deg)}
  }

  /* Scan wrap + texte */
  .rr-scan-wrap{
    position:relative;
    display:inline-block;
    line-height:1.1;
  }
  .rr-text{
    font-family:var(--fd, system-ui);
    font-size:48px;
    font-weight:900;
    font-style:italic;
    letter-spacing:.02em;
    text-transform:uppercase;
    color:rgba(255,255,255,.18);
    display:inline-block;
    padding:6px 4px;
    transition:color 1.2s cubic-bezier(.175,.885,.32,1.275);
  }
  /* Texte révélé (au-dessus, masqué initialement par clip-path) */
  .rr-text-reveal{
    position:absolute;
    inset:0;
    color:#FCFFDF;
    text-shadow:0 0 24px rgba(252,255,223,.5);
    clip-path:inset(100% 0 0 0);
    transition:clip-path 1.4s cubic-bezier(.175,.885,.32,1.275) .2s;
  }
  .rr-in .rr-text-reveal{clip-path:inset(0 0 0 0)}

  /* Barres scan */
  .rr-bar{
    position:absolute;
    left:-6px;
    right:-6px;
    height:5px;
    border-radius:8px;
    top:-12px;
    opacity:0;
    transform:translateY(0);
    transition:opacity .15s;
  }
  .rr-bar-blur{height:8px;background:rgba(255,130,130,.55);filter:blur(8px);z-index:0}
  .rr-bar-line{background:#FF8282;box-shadow:0 0 12px rgba(255,130,130,.8);z-index:3}
  .rr-in .rr-bar{opacity:1;animation:rr-scan 1.6s cubic-bezier(.4,0,.2,1) forwards}
  @keyframes rr-scan{
    0%{transform:translateY(0);opacity:0}
    8%{opacity:1}
    50%{transform:translateY(100%)}
    92%{opacity:1}
    100%{transform:translateY(140%);opacity:0}
  }

  /* Sub text */
  .rr-sub{
    font-family:var(--fd, system-ui);
    font-size:18px;
    font-weight:700;
    color:rgba(255,255,255,.85);
    margin-top:22px;
    letter-spacing:-.01em;
    opacity:0;
    transform:translateY(8px);
    transition:opacity .4s ease 1.4s, transform .4s ease 1.4s;
  }
  .rr-in .rr-sub{opacity:1;transform:translateY(0)}

  /* CTA close */
  .rr-close{
    margin-top:30px;
    padding:12px 32px;
    background:linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.08));
    border:1px solid rgba(255,255,255,.25);
    color:#fff;
    font-family:var(--fd, system-ui);
    font-weight:800;
    font-size:13px;
    letter-spacing:1.5px;
    text-transform:uppercase;
    border-radius:99px;
    cursor:pointer;
    backdrop-filter:blur(8px);
    transition:transform .15s, background .2s;
    opacity:0;
    transform:translateY(8px);
    transition:opacity .4s ease 1.6s, transform .4s ease 1.6s, background .2s;
  }
  .rr-in .rr-close{opacity:1;transform:translateY(0)}
  .rr-close:hover{background:linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,.14));transform:translateY(-1px)}

  /* Confettis */
  .rr-particles{position:absolute;inset:0;pointer-events:none}
  .rr-particles span{
    position:absolute;
    top:50%;
    left:50%;
    width:8px;
    height:8px;
    border-radius:50%;
    background:currentColor;
    opacity:0;
    animation:rr-particle 1.4s cubic-bezier(.2,.8,.4,1) var(--rr-delay,0s) forwards;
  }
  .rr-particles span:nth-child(3n){background:#FCFFDF;width:6px;height:6px}
  .rr-particles span:nth-child(3n+1){background:#FF8282;width:4px;height:4px;border-radius:2px}
  .rr-particles span:nth-child(3n+2){background:#FFD700;width:10px;height:10px}
  @keyframes rr-particle{
    0%{transform:translate(-50%,-50%) rotate(var(--rr-angle,0deg)) translateX(0) scale(0);opacity:0}
    10%{opacity:1}
    100%{transform:translate(-50%,-50%) rotate(var(--rr-angle,0deg)) translateX(var(--rr-dist,200px)) scale(1);opacity:0}
  }

  /* Variants */
  .rr-variant-gold{color:#FFD700}
  .rr-variant-gold .rr-text-reveal{color:#FFE873;text-shadow:0 0 32px rgba(255,215,0,.55)}
  .rr-variant-gold .rr-rays div{background:linear-gradient(180deg,transparent,rgba(255,215,0,.45),transparent)}

  .rr-variant-platinum{color:#e2e8f0}
  .rr-variant-platinum .rr-text-reveal{color:#fff;text-shadow:0 0 32px rgba(255,255,255,.55)}
  .rr-variant-platinum .rr-rays div{background:linear-gradient(180deg,transparent,rgba(226,232,240,.45),transparent)}

  .rr-variant-fire{color:#ff6b35}
  .rr-variant-fire .rr-text-reveal{color:#ffb088;text-shadow:0 0 32px rgba(255,107,53,.6)}
  .rr-variant-fire .rr-rays div{background:linear-gradient(180deg,transparent,rgba(255,107,53,.45),transparent)}
  .rr-variant-fire .rr-bar-line{background:#ff6b35;box-shadow:0 0 12px rgba(255,107,53,.8)}

  .rr-variant-neon{color:#a5b4fc}
  .rr-variant-neon .rr-text-reveal{color:#c4b5fd;text-shadow:0 0 32px rgba(165,180,252,.6)}
  .rr-variant-neon .rr-rays div{background:linear-gradient(180deg,transparent,rgba(165,180,252,.45),transparent)}
  .rr-variant-neon .rr-bar-line{background:#a5b4fc;box-shadow:0 0 12px rgba(165,180,252,.8)}

  .rr-variant-mint{color:#34d399}
  .rr-variant-mint .rr-text-reveal{color:#6ee7b7;text-shadow:0 0 32px rgba(52,211,153,.6)}
  .rr-variant-mint .rr-rays div{background:linear-gradient(180deg,transparent,rgba(52,211,153,.45),transparent)}
  .rr-variant-mint .rr-bar-line{background:#34d399;box-shadow:0 0 12px rgba(52,211,153,.8)}

  /* Mobile */
  @media (max-width:560px){
    .rr-card{padding:28px 22px}
    .rr-emoji{font-size:68px}
    .rr-text{font-size:34px}
    .rr-sub{font-size:15px;margin-top:18px}
  }

  /* Respect reduced motion */
  @media (prefers-reduced-motion:reduce){
    .rr-emoji{animation:none}
    .rr-bar{animation:none;opacity:0}
    .rr-rays div{animation:none}
  }
`;
