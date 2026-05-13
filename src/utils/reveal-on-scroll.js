/**
 * Reveal-on-scroll — déclenche l'animation .reveal → .revealed
 * quand un élément entre dans la viewport.
 *
 * Inspiré du composant React `TimelineContent` (uilayouts).
 *
 * Usage :
 *   import { setupReveals } from '@/utils/reveal-on-scroll.js';
 *   // Après avoir rendu le HTML :
 *   setupReveals(root);    // observe tous les .reveal du container
 *
 * Side-effect : ajoute la classe .revealed quand l'élément est visible.
 * Si déjà observé, ne ré-observe pas.
 */

let _observer = null;

function getObserver() {
  if (_observer) return _observer;
  if (typeof IntersectionObserver === 'undefined') {
    // SSR / vieux navigateurs : on révèle tout immédiatement
    return { observe(el) { el.classList.add('revealed'); } };
  }
  _observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          _observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  return _observer;
}

/**
 * Observe tous les éléments `.reveal` (non encore revealed) dans le container.
 * @param {HTMLElement} root
 */
export function setupReveals(root = document) {
  const els = root.querySelectorAll('.reveal:not(.revealed)');
  const obs = getObserver();
  els.forEach(el => obs.observe(el));
}
