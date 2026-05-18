// ═══════════════════════════════════════════════════════════════
// Log Session FAB — bouton flottant moniteur (style Apple sobre)
// ADN : Apple + Uber Driver — discret mais toujours accessible.
// Usage : mountLogSessionFab()  /  unmountLogSessionFab()
// Appelé dans router.js après chaque page enseignant/gerant.
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
  /* ── Apparition douce ── */
  @keyframes lsfabIn {
    from { opacity: 0; transform: translateY(20px) scale(.9); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }

  /* ── Réactivité tactile sur l'icône ── */
  @keyframes lsfabIconTilt {
    0%, 100% { transform: rotate(0); }
    25%      { transform: rotate(-90deg); }
  }

  #log-session-fab {
    position: fixed;
    right: 20px;
    bottom: calc(86px + env(safe-area-inset-bottom, 0px));
    z-index: 250;

    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 0;
    padding: 0;

    /* Style Apple sobre : noir profond + ring subtil indigo */
    background: #0a0d1a;
    color: #fff;

    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    /* Ombre douce (Apple Health-like) */
    box-shadow:
      0 10px 24px -8px rgba(10, 13, 26, .45),
      0 4px 8px -2px rgba(10, 13, 26, .2),
      inset 0 0 0 1px rgba(255, 255, 255, .08);

    animation: lsfabIn .35s cubic-bezier(.34, 1.56, .64, 1);
    transition:
      transform .18s cubic-bezier(.34, 1.56, .64, 1),
      box-shadow .2s ease,
      background .2s ease;
  }

  /* Icône SVG */
  #log-session-fab svg {
    width: 22px;
    height: 22px;
    transition: transform .25s cubic-bezier(.34, 1.56, .64, 1);
  }

  /* Hover (desktop uniquement) */
  @media (hover: hover) and (pointer: fine) {
    #log-session-fab:hover {
      transform: translateY(-2px);
      box-shadow:
        0 14px 28px -8px rgba(10, 13, 26, .55),
        0 4px 12px -2px rgba(10, 13, 26, .25),
        inset 0 0 0 1px rgba(255, 255, 255, .12);
    }
    #log-session-fab:hover svg {
      transform: rotate(90deg);
    }
  }

  /* Active (tap mobile) */
  #log-session-fab:active {
    transform: scale(.92);
    box-shadow:
      0 6px 16px -6px rgba(10, 13, 26, .5),
      inset 0 0 0 1px rgba(255, 255, 255, .15);
  }

  /* Focus accessibilité */
  #log-session-fab:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 3px;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    #log-session-fab,
    #log-session-fab svg { animation: none !important; transition: none !important; }
  }
  `;
  document.head.appendChild(s);
}

function _plusIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
                aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5"  y1="12" x2="19" y2="12"/>
  </svg>`;
}

/**
 * Monte le FAB "+ Session" sur document.body.
 * Idempotent : retire l'ancien si présent.
 */
export function mountLogSessionFab() {
  ensureStyle();
  unmountLogSessionFab();

  const btn = document.createElement('button');
  btn.id = FAB_ID;
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Enregistrer une session de conduite');
  btn.setAttribute('title', 'Enregistrer une session');
  btn.innerHTML = _plusIcon();
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
