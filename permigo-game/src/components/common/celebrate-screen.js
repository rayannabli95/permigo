// ═══════════════════════════════════════════════════════════════
// Celebrate Screen — Succès fullscreen avec confettis premium
//
// Usage simple :
//   import { showCelebrate, CELEBRATE_PRESETS } from '@/components/common/celebrate-screen.js';
//   showCelebrate(CELEBRATE_PRESETS.firstValidation);
//   showCelebrate({ illustration: '/path.png', title: 'Bravo !', subtitle: '...', ctaLabel: 'Suivant' });
//
// Pré-conçu pour les 4 succès majeurs (illustrations ChatGPT 1080×1920) :
//  - firstValidation (1ère compétence validée)
//  - tenComps        (10 comps acquises)
//  - readyExam       (28+/31 → prêt pour l'examen blanc)
//  - permisEarned    (31/31 → permis virtuel complet)
//
// Anim premium :
//  - Background fade in 300ms ease-out
//  - Illustration scale 0.85→1 + opacity, bounce subtil (cubic-bezier .34, 1.56, .64, 1)
//  - Title slide up 12px + fade, 100ms après l'illustration
//  - Subtitle slide up 8px + fade, 200ms après
//  - 24 confettis qui tombent en stagger (50ms entre chacun)
//  - CTA pulse subtil après 600ms
//  - Sortie : fade + scale 0.95 200ms
// ═══════════════════════════════════════════════════════════════
import { esc } from '@/utils/escape.js';
import { ASSETS } from '@/utils/assets.js';
import { haptic } from '@/utils/haptic.js';
import { track } from '@/services/analytics.js';

const STYLE_ID = 'celebrate-screen-style';
const STYLE = `
.cs-overlay {
  position: fixed; inset: 0;
  z-index: 10000;
  background: linear-gradient(135deg, rgba(15,23,42,.94) 0%, rgba(46,16,101,.96) 60%, rgba(67,20,7,.94) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  padding: 32px 24px max(48px, env(safe-area-inset-bottom));
  opacity: 0;
  transition: opacity .3s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
}
.cs-overlay.cs-show { opacity: 1; }
.cs-overlay.cs-closing { opacity: 0; }

.cs-card {
  position: relative;
  width: 100%; max-width: 420px;
  text-align: center;
  color: #fff;
  z-index: 2;
  transform: translateY(8px) scale(0.96);
  opacity: 0;
  transition: transform .45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity .45s cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: 80ms;
}
.cs-overlay.cs-show .cs-card { transform: translateY(0) scale(1); opacity: 1; }

.cs-illo {
  width: 100%; max-width: 280px; height: auto;
  margin: 0 auto 24px;
  display: block;
  filter: drop-shadow(0 12px 36px rgba(0,0,0,.4));
  opacity: 0;
  transform: scale(0.85);
  transition: transform .55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity .35s ease-out;
  transition-delay: 150ms;
}
.cs-overlay.cs-show .cs-illo { opacity: 1; transform: scale(1); }

.cs-fallback-emoji {
  font-size: 96px;
  line-height: 1;
  margin: 24px 0 32px;
  animation: csEmojiPop .7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: 200ms;
  display: inline-block;
}
@keyframes csEmojiPop {
  0%   { transform: scale(.3) rotate(-15deg); opacity: 0; }
  60%  { transform: scale(1.1) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}

.cs-title {
  font: 800 32px/1.1 'Plus Jakarta Sans', sans-serif;
  margin: 0 0 12px;
  letter-spacing: -.03em;
  background: linear-gradient(135deg, #fff 0%, #fde68a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity .4s ease-out, transform .4s cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: 240ms;
}
.cs-overlay.cs-show .cs-title { opacity: 1; transform: translateY(0); }

.cs-subtitle {
  font: 500 16px/1.5 'Inter', sans-serif;
  color: rgba(255,255,255,.8);
  margin: 0 0 36px;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity .4s ease-out, transform .4s cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: 340ms;
}
.cs-overlay.cs-show .cs-subtitle { opacity: 1; transform: translateY(0); }

.cs-cta {
  padding: 18px 40px;
  background: linear-gradient(135deg, #fde68a 0%, #f59e0b 60%, #d97706 100%);
  color: #0a0d1a;
  border: 0;
  border-radius: 16px;
  font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(245,158,11,.4), inset 0 -3px 0 rgba(0,0,0,.12), inset 0 2px 0 rgba(255,255,255,.5);
  transition: transform .15s cubic-bezier(0.23, 1, 0.32, 1), box-shadow .15s ease;
  opacity: 0;
  transform: translateY(8px);
  transition-property: opacity, transform, box-shadow;
  transition-duration: .4s, .4s, .15s;
  transition-delay: 440ms, 440ms, 0ms;
  font-family: inherit;
  min-height: 56px;
  letter-spacing: -.01em;
}
.cs-overlay.cs-show .cs-cta { opacity: 1; transform: translateY(0); }
.cs-cta:active { transform: scale(0.97); box-shadow: 0 6px 18px rgba(245,158,11,.35); }
.cs-cta:hover { box-shadow: 0 14px 36px rgba(245,158,11,.5), inset 0 -3px 0 rgba(0,0,0,.12), inset 0 2px 0 rgba(255,255,255,.5); }

/* ─── Confettis ─── */
.cs-confetti {
  position: absolute;
  top: -30px;
  width: 14px; height: 18px;
  background: var(--cs-c, #fde68a);
  pointer-events: none;
  opacity: 0;
  z-index: 1;
  border-radius: 2px;
  animation: csFall var(--cs-d, 3.8s) cubic-bezier(0.32, 0.42, 0.45, 1) forwards;
  animation-delay: var(--cs-delay, 0s);
}
.cs-confetti.cs-square  { border-radius: 2px; }
.cs-confetti.cs-circle  { border-radius: 50%; width: 12px; height: 12px; }
.cs-confetti.cs-ribbon  { width: 8px; height: 22px; border-radius: 4px; }
@keyframes csFall {
  0%   { transform: translate(var(--cs-x-from, 0), -40px) rotate(0deg); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translate(var(--cs-x-to, 0), 105vh) rotate(var(--cs-rot, 720deg)); opacity: .85; }
}

/* Close button discret en haut à droite */
.cs-close {
  position: absolute;
  top: max(20px, env(safe-area-inset-top, 0px));
  right: 20px;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,.12);
  color: #fff;
  border: 0;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: flex; align-items: center; justify-content: center;
  z-index: 3;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  opacity: 0;
  transition: opacity .3s ease-out, background .15s ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: 600ms;
  font-family: inherit;
}
.cs-overlay.cs-show .cs-close { opacity: 1; }
.cs-close:hover  { background: rgba(255,255,255,.22); }
.cs-close:active { transform: scale(0.92); }

@media (prefers-reduced-motion: reduce) {
  .cs-overlay, .cs-card, .cs-illo, .cs-title, .cs-subtitle, .cs-cta, .cs-close { transition: none !important; }
  .cs-confetti, .cs-fallback-emoji { animation: none !important; opacity: 1 !important; }
}
`;

/**
 * Pré-réglages pour les 4 succès majeurs.
 * Les illustrations doivent exister dans /public/skins/success-*.png (1080×1920).
 * En l'absence d'image, fallback emoji.
 */
export const CELEBRATE_PRESETS = {
  firstValidation: {
    illustration: '/skins/success-first-validation.png',
    fallbackEmoji: '🎉',
    title: 'Première compétence !',
    subtitle: 'Ton aventure a officiellement commencé. La route est longue mais belle.',
    ctaLabel: 'Continue le parcours',
    trackKey: 'celebrate.first_validation',
  },
  tenComps: {
    illustration: '/skins/success-10-comps.png',
    fallbackEmoji: '🏔️',
    title: 'Tiers du chemin',
    subtitle: '10 compétences validées sur 31. Tu prends de l\'avance, garde le rythme.',
    ctaLabel: 'En avant',
    trackKey: 'celebrate.ten_comps',
  },
  readyExam: {
    illustration: '/skins/success-ready-exam.png',
    fallbackEmoji: '🎯',
    title: 'Prêt pour l\'examen',
    subtitle: '28 compétences acquises. Tu peux passer ton examen quand tu veux.',
    ctaLabel: 'Voir ma carte',
    trackKey: 'celebrate.ready_exam',
  },
  permisEarned: {
    illustration: '/skins/success-permis-earned.png',
    fallbackEmoji: '👑',
    title: 'Permis virtuel obtenu',
    subtitle: 'Les 31 compétences REMC validées. Bravo, tu maîtrises la route.',
    ctaLabel: 'Partager ma victoire',
    trackKey: 'celebrate.permis_earned',
  },
};

const CONFETTI_COLORS = ['#fde68a', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#a855f7', '#ec4899', '#fff'];
const CONFETTI_SHAPES = ['cs-square', 'cs-circle', 'cs-ribbon'];

function ensureStyle() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = STYLE;
  document.head.appendChild(tag);
}

function renderConfetti(overlay, count = 24) {
  const W = window.innerWidth || 380;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('span');
    const xFrom = Math.random() * W;
    const drift = (Math.random() - 0.5) * 240; // dérive horizontale
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const shape = CONFETTI_SHAPES[i % CONFETTI_SHAPES.length];
    const dur = 3.4 + Math.random() * 1.6;
    const delay = (i * 50 + Math.random() * 120) / 1000;
    const rot = 360 + Math.random() * 720;
    c.className = `cs-confetti ${shape}`;
    c.style.left = '0';
    c.style.setProperty('--cs-c', color);
    c.style.setProperty('--cs-x-from', `${xFrom}px`);
    c.style.setProperty('--cs-x-to', `${xFrom + drift}px`);
    c.style.setProperty('--cs-d', `${dur}s`);
    c.style.setProperty('--cs-delay', `${delay}s`);
    c.style.setProperty('--cs-rot', `${rot}deg`);
    overlay.appendChild(c);
  }
}

/**
 * Affiche un écran de célébration fullscreen.
 *
 * @param {Object} opts
 * @param {string} [opts.illustration]   chemin PNG illustration premium (1080×1920 conseillé)
 * @param {string} [opts.fallbackEmoji]  fallback si l'image ne charge pas
 * @param {string} opts.title            titre (en haut, gradient or)
 * @param {string} opts.subtitle         sous-titre (paragraphe)
 * @param {string} [opts.ctaLabel='Continuer'] label du bouton principal
 * @param {Function} [opts.onCta]        callback quand on tape sur le CTA (sinon ferme)
 * @param {Function} [opts.onClose]      callback à la fermeture
 * @param {string} [opts.trackKey]       event analytics à logger à l'ouverture
 * @returns {Promise<void>} résout à la fermeture
 */
export function showCelebrate(opts = {}) {
  ensureStyle();

  const {
    illustration,
    fallbackEmoji = '🎉',
    title = 'Bravo !',
    subtitle = '',
    ctaLabel = 'Continuer',
    onCta,
    onClose,
    trackKey,
  } = opts;

  if (trackKey) {
    try { track(trackKey); } catch { /* analytics best-effort */ }
  }

  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'cs-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'cs-title-el');

    const illoHtml = illustration
      ? `<img class="cs-illo" src="${esc(illustration)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'" />
         <div class="cs-fallback-emoji" style="display:none">${esc(fallbackEmoji)}</div>`
      : `<div class="cs-fallback-emoji">${esc(fallbackEmoji)}</div>`;

    overlay.innerHTML = `
      <button class="cs-close" type="button" aria-label="Fermer">×</button>
      <div class="cs-card">
        ${illoHtml}
        <h1 class="cs-title" id="cs-title-el">${esc(title)}</h1>
        ${subtitle ? `<p class="cs-subtitle">${esc(subtitle)}</p>` : ''}
        <button class="cs-cta" type="button">${esc(ctaLabel)}</button>
      </div>
    `;

    // Confettis premium (24 particules par défaut)
    renderConfetti(overlay, 24);
    document.body.appendChild(overlay);

    // Haptic à l'ouverture
    try { haptic('success'); } catch {}

    // Force reflow puis classe show pour déclencher les transitions
    void overlay.offsetWidth;
    overlay.classList.add('cs-show');

    const close = (sourceCta = false) => {
      overlay.classList.remove('cs-show');
      overlay.classList.add('cs-closing');
      try { onClose?.(); } catch {}
      setTimeout(() => {
        overlay.remove();
        resolve(sourceCta ? 'cta' : 'close');
      }, 240);
    };

    overlay.querySelector('.cs-cta').addEventListener('click', () => {
      try { haptic('tap'); } catch {}
      try { onCta?.(); } catch {}
      close(true);
    });
    overlay.querySelector('.cs-close').addEventListener('click', () => close(false));

    // ESC pour fermer
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        close(false);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

/**
 * Helper : trigger automatique de célébration en fonction du # de compétences acquises.
 * À appeler après chaque validation côté élève. Anti-dupliqué via localStorage.
 *
 * @param {number} validatedCount  nombre total de comp acquises
 * @returns {boolean} true si une célébration a été déclenchée
 */
export function maybeCelebrateMilestone(validatedCount) {
  if (typeof localStorage === 'undefined' || typeof window === 'undefined') return false;
  const KEY = 'permigo:celebrate_seen';
  const seen = JSON.parse(localStorage.getItem(KEY) || '{}');

  let preset = null;
  let milestoneKey = null;
  if (validatedCount >= 31 && !seen.permisEarned)   { preset = CELEBRATE_PRESETS.permisEarned;    milestoneKey = 'permisEarned'; }
  else if (validatedCount >= 28 && !seen.readyExam) { preset = CELEBRATE_PRESETS.readyExam;       milestoneKey = 'readyExam'; }
  else if (validatedCount >= 10 && !seen.tenComps)  { preset = CELEBRATE_PRESETS.tenComps;        milestoneKey = 'tenComps'; }
  else if (validatedCount >= 1  && !seen.firstValidation) { preset = CELEBRATE_PRESETS.firstValidation; milestoneKey = 'firstValidation'; }

  if (!preset || !milestoneKey) return false;

  seen[milestoneKey] = Date.now();
  localStorage.setItem(KEY, JSON.stringify(seen));
  showCelebrate(preset);
  return true;
}
