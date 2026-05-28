// ═══════════════════════════════════════════════════════════════
// Gestures — swipe, long-press, pull-to-refresh
// Vanilla, mobile-first, propre.
// ═══════════════════════════════════════════════════════════════
import { haptic } from './haptic.js';

/**
 * Attache un détecteur de swipe horizontal à un élément.
 * @param {HTMLElement} el
 * @param {{onSwipeLeft?: ()=>void, onSwipeRight?: ()=>void, threshold?: number, follow?: (dx:number)=>void, onEnd?: ()=>void}} opts
 * @returns {() => void} cleanup
 */
export function attachSwipe(el, { onSwipeLeft, onSwipeRight, threshold = 60, follow, onEnd } = {}) {
  let startX = 0, startY = 0, dx = 0, dy = 0, tracking = false, fired = false;

  function start(e) {
    const t = e.touches?.[0] ?? e;
    startX = t.clientX; startY = t.clientY;
    dx = 0; dy = 0; tracking = true; fired = false;
  }
  function move(e) {
    if (!tracking) return;
    const t = e.touches?.[0] ?? e;
    dx = t.clientX - startX;
    dy = t.clientY - startY;
    // Si scroll vertical > horizontal, on annule (pas un swipe)
    if (Math.abs(dy) > Math.abs(dx) + 6) { tracking = false; follow?.(0); return; }
    if (Math.abs(dx) > 10 && !fired) { haptic('swipe'); fired = true; }
    follow?.(dx);
  }
  function end() {
    if (!tracking) return;
    tracking = false;
    if (dx <= -threshold)      { onSwipeLeft?.(); }
    else if (dx >=  threshold) { onSwipeRight?.(); }
    follow?.(0);
    onEnd?.();
  }

  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchmove',  move,  { passive: true });
  el.addEventListener('touchend',   end);
  el.addEventListener('touchcancel', end);

  return () => {
    el.removeEventListener('touchstart', start);
    el.removeEventListener('touchmove', move);
    el.removeEventListener('touchend', end);
    el.removeEventListener('touchcancel', end);
  };
}

/**
 * Long-press detector — déclenche après `holdMs` si l'user ne bouge pas trop.
 * @param {HTMLElement} el
 * @param {{onLongPress: ()=>void, holdMs?: number, moveTolerance?: number}} opts
 * @returns {() => void} cleanup
 */
export function attachLongPress(el, { onLongPress, holdMs = 500, moveTolerance = 8 } = {}) {
  let timer = null, startX = 0, startY = 0, fired = false;

  function start(e) {
    const t = e.touches?.[0] ?? e;
    startX = t.clientX; startY = t.clientY;
    fired = false;
    timer = setTimeout(() => {
      fired = true;
      haptic('longpress');
      onLongPress?.();
    }, holdMs);
  }
  function move(e) {
    if (!timer) return;
    const t = e.touches?.[0] ?? e;
    if (Math.abs(t.clientX - startX) > moveTolerance || Math.abs(t.clientY - startY) > moveTolerance) {
      clearTimeout(timer); timer = null;
    }
  }
  function end(e) {
    if (timer) { clearTimeout(timer); timer = null; }
    // Si déjà long-press déclenché, on bloque le click qui suit
    if (fired) e.preventDefault?.();
  }

  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchmove',  move,  { passive: true });
  el.addEventListener('touchend',   end);
  el.addEventListener('touchcancel', end);
  // Support desktop pour démo
  el.addEventListener('mousedown',  start);
  el.addEventListener('mousemove',  move);
  el.addEventListener('mouseup',    end);
  el.addEventListener('mouseleave', end);

  return () => {
    el.removeEventListener('touchstart', start);
    el.removeEventListener('touchmove', move);
    el.removeEventListener('touchend', end);
    el.removeEventListener('touchcancel', end);
    el.removeEventListener('mousedown', start);
    el.removeEventListener('mousemove', move);
    el.removeEventListener('mouseup', end);
    el.removeEventListener('mouseleave', end);
  };
}

/**
 * Pull-to-refresh — attache à un container scrollable (ou body).
 * Affiche un indicator pendant le pull, déclenche onRefresh au-delà du seuil.
 * @param {HTMLElement} scrollEl - le container (ou document.scrollingElement)
 * @param {{onRefresh: ()=>Promise<void>|void, threshold?: number, max?: number}} opts
 * @returns {() => void} cleanup
 */
export function attachPullToRefresh(scrollEl, { onRefresh, threshold = 70, max = 110 } = {}) {
  // Indicator DOM
  const ind = document.createElement('div');
  ind.className = 'ptr-ind';
  ind.innerHTML = `
    <style>
      .ptr-ind {
        position: fixed;
        top: calc(52px + env(safe-area-inset-top, 0px));
        left: 50%;
        transform: translate(-50%, -110%);
        z-index: 250;
        width: 44px; height: 44px;
        border-radius: 50%;
        background: #fff;
        border: 1px solid var(--bo);
        box-shadow: 0 4px 16px rgba(10,13,26,.12);
        display: flex; align-items: center; justify-content: center;
        transition: transform .25s cubic-bezier(.2,.7,.3,1);
        pointer-events: none;
      }
      .ptr-ind.show { transition: transform 0s; }
      .ptr-arrow {
        width: 18px; height: 18px;
        border-right: 2.5px solid var(--a);
        border-bottom: 2.5px solid var(--a);
        transform: rotate(45deg) translate(-2px,-2px);
        transition: transform .25s ease, opacity .15s ease;
      }
      .ptr-ind.ready .ptr-arrow { transform: rotate(-135deg) translate(-1px,2px); }
      .ptr-ind.loading .ptr-arrow { display: none; }
      .ptr-spinner {
        display: none;
        width: 22px; height: 22px;
        border: 2.5px solid var(--bo);
        border-top-color: var(--a);
        border-radius: 50%;
        animation: ptrSpin .8s linear infinite;
      }
      .ptr-ind.loading .ptr-spinner { display: block; }
      @keyframes ptrSpin { to { transform: rotate(360deg); } }
    </style>
    <div class="ptr-arrow"></div>
    <div class="ptr-spinner"></div>
  `;
  document.body.appendChild(ind);

  let startY = 0, pulling = false, dy = 0, refreshing = false;

  function getScrollTop() {
    return scrollEl === document.scrollingElement || scrollEl === document.body
      ? (window.scrollY || document.documentElement.scrollTop)
      : scrollEl.scrollTop;
  }

  function start(e) {
    if (refreshing) return;
    if (getScrollTop() > 0) return;
    startY = e.touches[0].clientY;
    pulling = true; dy = 0;
  }
  function move(e) {
    if (!pulling || refreshing) return;
    dy = e.touches[0].clientY - startY;
    if (dy <= 0) { pulling = false; ind.style.transform = ''; ind.classList.remove('show','ready'); return; }
    e.preventDefault?.();
    const clamped = Math.min(max, dy * 0.6); // résistance
    ind.classList.add('show');
    ind.style.transform = `translate(-50%, ${clamped - 60}px)`;
    if (clamped >= threshold) {
      if (!ind.classList.contains('ready')) { ind.classList.add('ready'); haptic('select'); }
    } else {
      ind.classList.remove('ready');
    }
  }
  async function end() {
    if (!pulling || refreshing) return;
    pulling = false;
    if (dy * 0.6 >= threshold) {
      refreshing = true;
      ind.classList.add('loading');
      ind.classList.remove('ready');
      ind.style.transform = `translate(-50%, ${threshold - 60}px)`;
      try { await onRefresh?.(); } catch {}
      haptic('success');
      ind.classList.remove('loading');
      ind.style.transform = '';
      setTimeout(() => ind.classList.remove('show'), 300);
      refreshing = false;
    } else {
      ind.style.transform = '';
      setTimeout(() => ind.classList.remove('show'), 300);
    }
    dy = 0;
  }

  window.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('touchmove',  move,  { passive: false });
  window.addEventListener('touchend',   end);

  return () => {
    window.removeEventListener('touchstart', start);
    window.removeEventListener('touchmove',  move);
    window.removeEventListener('touchend',   end);
    ind.remove();
  };
}

/**
 * Anime un compteur de `from` vers `to` (entier).
 * @param {HTMLElement} el - élément cible (textContent sera modifié)
 * @param {number} from
 * @param {number} to
 * @param {number} durMs
 */
export function animateCounter(el, from, to, durMs = 800) {
  if (!el) return;
  if (matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = String(to);
    return;
  }
  const start = performance.now();
  const delta = to - from;
  function frame(now) {
    const t = Math.min(1, (now - start) / durMs);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(from + delta * eased));
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = String(to);
  }
  requestAnimationFrame(frame);
}
