/**
 * Theme toggle — bouton soleil/lune pour switch light/dark.
 *
 * Usage :
 *   import { initTheme, mountThemeToggle } from '@/components/common/theme-toggle.js';
 *   initTheme();                            // appelé au boot (avant le 1er render)
 *   mountThemeToggle(parentEl);             // monte le bouton dans un parent
 *
 * Comportement :
 *  - Default : suit `prefers-color-scheme` du système
 *  - Override : préférence sauvée dans localStorage
 *  - 3 états cyclés : auto → light → dark → auto
 *  - Transition smooth via la CSS variable --t-slow sur body
 */

const STORAGE_KEY = 'pg-theme';
const ICONS = {
  auto: '🌓', // moitié lune (suit le système)
  light: '☀️',
  dark: '🌙',
};
const LABELS = {
  auto: 'Thème automatique',
  light: 'Thème clair',
  dark: 'Thème sombre',
};

export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'auto';
}

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }
  // Update meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const effective = mode === 'auto'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    meta.setAttribute('content', effective === 'dark' ? 'var(--ink)' : 'var(--a)');
  }
}

/** À appeler une fois au boot, AVANT le 1er render. */
export function initTheme() {
  const saved = getTheme();
  applyTheme(saved);
  // Re-applique si l'user change sa préférence système et qu'on est en mode 'auto'
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'auto') applyTheme('auto');
  });
}

export function mountThemeToggle(parent, opts = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pg-theme-toggle';
  btn.setAttribute('aria-label', LABELS[getTheme()]);
  if (opts.compact) btn.classList.add('compact');

  const updateBtn = () => {
    const t = getTheme();
    btn.textContent = ICONS[t];
    btn.setAttribute('aria-label', LABELS[t]);
    btn.title = LABELS[t];
  };

  btn.addEventListener('click', () => {
    const order = ['auto', 'light', 'dark'];
    const cur = getTheme();
    const next = order[(order.indexOf(cur) + 1) % order.length];
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    updateBtn();
    // Petit feedback haptique-like
    btn.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(.85)' }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'cubic-bezier(.5,1.6,.4,1)' }
    );
  });

  updateBtn();
  parent.appendChild(btn);

  // Inject styles une seule fois
  if (!document.querySelector('#pg-theme-toggle-styles')) {
    const style = document.createElement('style');
    style.id = 'pg-theme-toggle-styles';
    style.textContent = `
      .pg-theme-toggle{
        width:36px;height:36px;border-radius:10px;
        background:var(--bg2);border:1px solid var(--bo);
        color:var(--ink);font-size:16px;
        cursor:pointer;font-family:inherit;
        display:inline-flex;align-items:center;justify-content:center;
        transition:background .15s,border-color .15s,transform .15s;
        padding:0;line-height:1;flex-shrink:0;
      }
      .pg-theme-toggle:hover{background:var(--ap);border-color:var(--a);transform:translateY(-1px)}
      .pg-theme-toggle:active{transform:translateY(0) scale(.95)}
      .pg-theme-toggle:focus-visible{outline:none;box-shadow:0 0 0 3px var(--ap),0 0 0 1px var(--a)}
      .pg-theme-toggle.compact{width:30px;height:30px;font-size:14px;border-radius:8px}
    `;
    document.head.appendChild(style);
  }

  return {
    el: btn,
    destroy: () => btn.remove(),
  };
}
