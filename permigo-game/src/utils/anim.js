// ═══════════════════════════════════════════════════════════════
// Bibliothèque d'animations réutilisable (CSS + helpers JS).
//
// - ensureAnimStyles() : injecte UNE fois une feuille de styles avec
//   les keyframes et classes utilitaires (.pg-rise, .pg-pop, .pg-shake,
//   .pg-pulse, .pg-float, .pg-stagger, .pg-confetti).
// - Helpers JS : confetti(), confettiFrom(), countUp(), pop(), shake().
//
// Tout respecte prefers-reduced-motion (animations coupées si demandé).
//
// Usage :
//   import { ensureAnimStyles, confettiFrom, countUp, pop } from '@/utils/anim.js';
//   ensureAnimStyles();                       // une fois au mount d'une page
//   el.classList.add('pg-rise');              // animation d'entrée
//   confettiFrom(buttonEl);                   // burst de confettis
//   countUp(spanEl, 31);                      // compteur 0 → 31
// ═══════════════════════════════════════════════════════════════

const STYLE_ID = 'pg-anim-lib';

export function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

/** Injecte la feuille de styles d'animations (idempotent). */
export function ensureAnimStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
@keyframes pgRise  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes pgPop   { 0% { transform: scale(.8); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
@keyframes pgShake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
@keyframes pgPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes pgFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes pgConfFall { 0% { transform: translate(0,0) rotate(0); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; } }

.pg-rise  { animation: pgRise  .5s cubic-bezier(.34,1.56,.64,1) both; }
.pg-pop   { animation: pgPop   .42s cubic-bezier(.34,1.56,.64,1) both; }
.pg-shake { animation: pgShake .42s ease both; }
.pg-pulse { animation: pgPulse 1.4s ease-in-out infinite; }
.pg-float { animation: pgFloat 3s ease-in-out infinite; }

/* Entrée en cascade des enfants directs */
.pg-stagger > * { animation: pgRise .5s cubic-bezier(.34,1.56,.64,1) both; }
.pg-stagger > *:nth-child(2) { animation-delay: .06s; }
.pg-stagger > *:nth-child(3) { animation-delay: .12s; }
.pg-stagger > *:nth-child(4) { animation-delay: .18s; }
.pg-stagger > *:nth-child(5) { animation-delay: .24s; }
.pg-stagger > *:nth-child(6) { animation-delay: .30s; }
.pg-stagger > *:nth-child(7) { animation-delay: .36s; }
.pg-stagger > *:nth-child(8) { animation-delay: .42s; }

/* Confettis */
.pg-confetti { position: fixed; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: 9999; }
.pg-confetti i { position: absolute; width: 8px; height: 12px; border-radius: 2px; will-change: transform, opacity; animation: pgConfFall 1.1s cubic-bezier(.2,.6,.4,1) forwards; }

@media (prefers-reduced-motion: reduce) {
  .pg-rise, .pg-pop, .pg-shake, .pg-pulse, .pg-float, .pg-stagger > * { animation: none !important; }
}`;
  document.head.appendChild(style);
}

const CONFETTI_COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

/** Burst de confettis centré sur un point écran (x, y). */
export function confetti(x, y, opts = {}) {
  if (prefersReducedMotion()) return;
  ensureAnimStyles();
  const { count = 18, colors = CONFETTI_COLORS, spread = 100 } = opts;
  try {
    const wrap = document.createElement('div');
    wrap.className = 'pg-confetti';
    wrap.style.left = x + 'px';
    wrap.style.top = y + 'px';
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.style.background = colors[i % colors.length];
      const ang = Math.random() * Math.PI * 2;
      const dist = spread * 0.5 + Math.random() * spread;
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', (Math.sin(ang) * dist + 40) + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDelay = (Math.random() * 60) + 'ms';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 1300);
  } catch {}
}

/** Burst de confettis depuis le centre d'un élément. */
export function confettiFrom(el, opts) {
  if (!el) return;
  try {
    const r = el.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, opts);
  } catch {}
}

/** Compteur animé 0 → `to` dans l'élément texte (ease-out cubic). */
export function countUp(el, to, opts = {}) {
  if (!el || !Number.isFinite(to)) return;
  const { duration = 900, format = (n) => String(n) } = opts;
  if (prefersReducedMotion()) { el.textContent = format(to); return; }
  const t0 = performance.now();
  function step(t) {
    const p = Math.min(1, (t - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = format(Math.round(to * eased));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/** (Re)joue une animation de classe utilitaire une fois sur un élément. */
function playOnce(el, cls, dur) {
  if (!el || prefersReducedMotion()) return;
  ensureAnimStyles();
  el.classList.remove(cls);
  void el.offsetWidth; // reflow pour relancer l'animation
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), dur);
}

export const pop   = (el) => playOnce(el, 'pg-pop', 440);
export const shake = (el) => playOnce(el, 'pg-shake', 440);
