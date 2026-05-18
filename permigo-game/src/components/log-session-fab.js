// ═══════════════════════════════════════════════════════════════
// Log Session FAB — bouton flottant "+ Session" pour enseignants
// Usage : mountLogSessionFab(root)  /  unmountLogSessionFab()
// Appelé dans router.js après chaque page enseignant/gerant
// ═══════════════════════════════════════════════════════════════
import { haptic } from '@/utils/haptic.js';
import { openLogSessionModal } from '@/components/log-session-modal.js';

const STYLE_ID = 'log-session-fab-style';
const FAB_ID   = 'log-session-fab';

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  @keyframes lsfabIn {
    from { opacity:0; transform:scale(.55) translateY(24px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes lsfabPulse {
    0%, 100% { box-shadow: 0 12px 32px -8px rgba(99,102,241,.55), 0 4px 12px rgba(10,13,26,.1); }
    50%       { box-shadow: 0 16px 40px -6px rgba(99,102,241,.8), 0 4px 16px rgba(10,13,26,.15); }
  }

  #log-session-fab {
    position: fixed;
    right: 16px;
    bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    z-index: 250;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 20px 0 16px;
    height: 52px;
    border-radius: 26px;
    border: 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    animation: lsfabIn .35s cubic-bezier(.34,1.56,.64,1), lsfabPulse 2.8s ease-in-out 1s infinite;
    transition: transform .15s cubic-bezier(.23,1,.32,1);
    white-space: nowrap;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  #log-session-fab svg { flex-shrink: 0; }
  @media (hover:hover) and (pointer:fine) {
    #log-session-fab:hover { transform: scale(1.04); }
  }
  #log-session-fab:active {
    transform: scale(.93);
    animation-play-state: paused;
  }
  @media (prefers-reduced-motion: reduce) {
    #log-session-fab {
      animation: lsfabIn .2s ease;
    }
  }
  `;
  document.head.appendChild(s);
}

function _plusIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`;
}

/**
 * Monte le FAB "+ Session" sur document.body.
 * Retire automatiquement l'ancien si présent.
 */
export function mountLogSessionFab() {
  ensureStyle();
  unmountLogSessionFab();

  const btn = document.createElement('button');
  btn.id = FAB_ID;
  btn.setAttribute('aria-label', 'Logger une session de conduite');
  btn.innerHTML = `${_plusIcon()}<span>Session</span>`;
  btn.addEventListener('click', () => {
    haptic('select');
    openLogSessionModal();
  });
  document.body.appendChild(btn);
  return btn;
}

export function unmountLogSessionFab() {
  document.getElementById(FAB_ID)?.remove();
}
