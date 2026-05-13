/**
 * Count-up animation — anime un nombre de 0 vers sa valeur cible.
 *
 * Usage :
 *   import { countUp } from '@/utils/count-up.js';
 *   countUp(el, 42, { duration: 1200, suffix: 'h' });
 *
 *   // Ou tous les éléments d'un container :
 *   import { countUpAll } from '@/utils/count-up.js';
 *   countUpAll(root.querySelectorAll('[data-count]'));
 *
 * Respect prefers-reduced-motion : affiche directement la valeur finale.
 */

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function countUp(el, target, opts = {}) {
  if (!el) return;
  const duration = opts.duration || 1200;
  const delay = opts.delay || 0;
  const prefix = opts.prefix || '';
  const suffix = opts.suffix || '';
  const decimals = opts.decimals || 0;

  // Respect a11y
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
    return;
  }

  let started = false;
  let startTime = 0;

  function tick(t) {
    if (!started) { startTime = t; started = true; }
    const elapsed = t - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const cur = target * eased;
    el.textContent = `${prefix}${cur.toFixed(decimals)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
  }

  setTimeout(() => requestAnimationFrame(tick), delay);
}

/** Anime tous les `[data-count]` d'un container avec stagger automatique. */
export function countUpAll(elements, opts = {}) {
  const staggerMs = opts.stagger || 100;
  elements.forEach((el, i) => {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals, 10) || 0;
    countUp(el, target, {
      duration: opts.duration || 1100,
      delay: i * staggerMs,
      suffix,
      decimals,
    });
  });
}
