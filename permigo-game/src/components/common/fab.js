// ═══════════════════════════════════════════════════════════════
// FAB — Floating Action Button contextuel par page
// Mobile-first, sticky bottom-right, gradient = SEUL gradient autorisé sur la page
// ═══════════════════════════════════════════════════════════════
import { haptic } from '@/utils/haptic.js';

const STYLE_ID = 'fab-style';
const STYLE = `
  .fab {
    position: fixed;
    right: 16px;
    bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    z-index: 250;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 0;
    background: var(--a);
    color: var(--a-ink);
    font-size: 26px;
    line-height: 1;
    cursor: pointer;
    box-shadow:
      0 12px 32px -8px color-mix(in srgb, var(--a) 55%, transparent),
      0 4px 12px rgba(10,13,26,.1);
    display: flex; align-items: center; justify-content: center;
    transition: transform .15s ease, box-shadow .15s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
    animation: fabIn .35s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes fabIn {
    from { opacity: 0; transform: scale(.6) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .fab:hover {
    box-shadow:
      0 16px 40px -8px color-mix(in srgb, var(--a) 70%, transparent),
      0 4px 12px rgba(10,13,26,.12);
  }
  .fab:active { transform: scale(.92); }
  .fab svg, .fab span { display: block; }
  @media (max-width: 768px) {
    .fab { right: 14px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fab { animation: none; }
    .fab:active { transform: none; }
  }
`;

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = STYLE;
  document.head.appendChild(s);
}

/**
 * Monte un FAB. Retire l'ancien automatiquement.
 * @param {{icon?: string, label?: string, onClick?: () => void}} opts
 */
export function mountFab({ icon = '+', label = 'Action', onClick } = {}) {
  ensureStyle();
  document.querySelector('.fab')?.remove();
  const btn = document.createElement('button');
  btn.className = 'fab';
  btn.setAttribute('aria-label', label);
  btn.innerHTML = `<span aria-hidden="true">${icon}</span>`;
  btn.addEventListener('click', () => {
    haptic('select');
    onClick?.();
  });
  document.body.appendChild(btn);
  return btn;
}

export function unmountFab() {
  document.querySelector('.fab')?.remove();
}
