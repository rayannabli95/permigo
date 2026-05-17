// ═══════════════════════════════════════════════════════════════
// Animated Border — bordure gradient conique rotative
// Adapté de BorderRotate React → vanilla JS + CSS scoped
// Usage : wrapAnimatedBorder(htmlContent, opts) → string HTML
// ═══════════════════════════════════════════════════════════════

const STYLE_ID = 'animated-border-style';

const STYLE = `
  .ab-wrap {
    position: relative;
    display: inline-block;
    border: var(--ab-border-width, 2px) solid transparent;
    border-radius: var(--ab-radius, 20px);
    background-image:
      linear-gradient(var(--ab-bg, #fff), var(--ab-bg, #fff)),
      conic-gradient(
        from var(--gradient-angle, 0deg),
        var(--ab-primary, #6366f1) 0%,
        var(--ab-secondary, #8b5cf6) 37%,
        var(--ab-accent, #f9de90) 30%,
        var(--ab-secondary, #8b5cf6) 33%,
        var(--ab-primary, #6366f1) 40%,
        var(--ab-primary, #6366f1) 50%,
        var(--ab-secondary, #8b5cf6) 77%,
        var(--ab-accent, #f9de90) 80%,
        var(--ab-secondary, #8b5cf6) 83%,
        var(--ab-primary, #6366f1) 90%
      );
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
  }

  /* Modes d'animation */
  .ab-wrap.ab-auto-rotate {
    animation: ab-spin var(--ab-speed, 5s) linear infinite;
  }
  .ab-wrap.ab-rotate-on-hover:hover {
    animation: ab-spin var(--ab-speed, 5s) linear infinite;
  }
  .ab-wrap.ab-stop-rotate-on-hover {
    animation: ab-spin var(--ab-speed, 5s) linear infinite;
  }
  .ab-wrap.ab-stop-rotate-on-hover:hover {
    animation-play-state: paused;
  }

  @keyframes ab-spin {
    from { --gradient-angle: 0deg; }
    to   { --gradient-angle: 360deg; }
  }

  @property --gradient-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  @media (prefers-reduced-motion: reduce) {
    .ab-wrap { animation: none !important; }
  }
`;

function ensureStyle() {
  if (typeof document === 'undefined') return;
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = STYLE;
  document.head.appendChild(el);
}

/**
 * Wrap du contenu HTML dans une bordure animée gradient conique.
 *
 * @param {string} innerHTML  contenu à wrapper
 * @param {Object} opts
 * @param {'auto-rotate'|'rotate-on-hover'|'stop-rotate-on-hover'} [opts.mode='auto-rotate']
 * @param {number} [opts.speed=5]  vitesse en secondes (1 tour)
 * @param {string} [opts.primary='#6366f1']
 * @param {string} [opts.secondary='#8b5cf6']
 * @param {string} [opts.accent='#f9de90']
 * @param {string} [opts.bg='#fff']  couleur intérieur card
 * @param {number} [opts.borderWidth=2]
 * @param {number} [opts.radius=20]
 * @param {string} [opts.className]
 * @returns {string} HTML
 */
export function wrapAnimatedBorder(innerHTML, opts = {}) {
  ensureStyle();
  const {
    mode = 'auto-rotate',
    speed = 5,
    primary = '#6366f1',
    secondary = '#8b5cf6',
    accent = '#f9de90',
    bg = '#fff',
    borderWidth = 2,
    radius = 20,
    className = '',
  } = opts;

  const modeClass = {
    'auto-rotate':            'ab-auto-rotate',
    'rotate-on-hover':        'ab-rotate-on-hover',
    'stop-rotate-on-hover':   'ab-stop-rotate-on-hover',
  }[mode] || 'ab-auto-rotate';

  const style = `
    --ab-primary:${primary};
    --ab-secondary:${secondary};
    --ab-accent:${accent};
    --ab-bg:${bg};
    --ab-border-width:${borderWidth}px;
    --ab-radius:${radius}px;
    --ab-speed:${speed}s;
  `.replace(/\s+/g, '');

  return `<div class="ab-wrap ${modeClass} ${className}" style="${style}">${innerHTML}</div>`;
}

/**
 * Variantes pré-configurées pour PermiGo
 */
export const BORDER_PRESETS = {
  // Or premium (pour Cercle Or / badges max)
  gold: { primary: '#584827', secondary: '#c7a03c', accent: '#f9de90', speed: 6 },
  // Indigo (par défaut profil)
  indigo: { primary: '#4338ca', secondary: '#6366f1', accent: '#a5b4fc', speed: 5 },
  // Cyan moniteur
  cyan:   { primary: '#0e7490', secondary: '#06b6d4', accent: '#67e8f9', speed: 5 },
  // Émeraude (acquis)
  emerald:{ primary: '#047857', secondary: '#10b981', accent: '#6ee7b7', speed: 5 },
  // Violet élève (gamifié)
  violet: { primary: '#6d28d9', secondary: '#8b5cf6', accent: '#c4b5fd', speed: 4 },
};
