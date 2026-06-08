// ═══════════════════════════════════════════════════════════════
// Badge — composant vanilla avec variants
// Adapté de Badge (shadcn/Radix) → vanilla JS + CSS scoped
// Usage : badge('Unlock', { variant: 'success', appearance: 'light' })
// Variants : primary | secondary | success | warning | info | destructive | outline
// Appearances : default | light | outline | ghost
// Sizes : xs | sm | md | lg
// Shapes : default | circle
// ═══════════════════════════════════════════════════════════════
import { esc } from '@/utils/escape.js';

const STYLE_ID = 'badge-style';

const STYLE = `
  /* Base */
  .bdg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 1px solid transparent;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    white-space: nowrap;
    line-height: 1;
  }
  .bdg .bdg-dot {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
    opacity: .75;
    flex-shrink: 0;
  }

  /* Sizes */
  .bdg.bdg-xs { padding: 0 4px; height: 16px; min-width: 16px; border-radius: 4px; font-size: 10px; gap: 3px; }
  .bdg.bdg-sm { padding: 0 5px; height: 20px; min-width: 20px; border-radius: 4px; font-size: 11px; gap: 4px; }
  .bdg.bdg-md { padding: 0 7px; height: 24px; min-width: 24px; border-radius: 6px; font-size: 12px; gap: 5px; }
  .bdg.bdg-lg { padding: 0 8px; height: 28px; min-width: 28px; border-radius: 6px; font-size: 12px; font-weight: 600; gap: 6px; }
  .bdg.bdg-circle { border-radius: 999px; }

  /* Variants DEFAULT (solide) */
  .bdg.v-primary       { background: var(--a); color: #fff; }
  .bdg.v-secondary     { background: var(--bg3); color: var(--ink); }
  .bdg.v-success       { background: var(--gr); color: #fff; }
  .bdg.v-warning       { background: var(--am); color: #fff; }
  .bdg.v-info          { background: var(--pu); color: #fff; }
  .bdg.v-destructive   { background: var(--rd); color: #fff; }
  .bdg.v-outline       { background: transparent; border-color: var(--bo); color: var(--mu3); }

  /* Appearance LIGHT (pastel doux) */
  .bdg.v-primary.a-light     { background: color-mix(in srgb, var(--a) 12%, transparent);  color: var(--adx); border-color: transparent; }
  .bdg.v-secondary.a-light   { background: var(--su2);               color: var(--mu4); border-color: transparent; }
  .bdg.v-success.a-light     { background: rgba(16,185,129,.12);  color: var(--grdk); border-color: transparent; }
  .bdg.v-warning.a-light     { background: rgba(245,158,11,.12);  color: var(--amx); border-color: transparent; }
  .bdg.v-info.a-light        { background: rgba(139,92,246,.12);  color: #6d28d9; border-color: transparent; }
  .bdg.v-destructive.a-light { background: rgba(239,68,68,.12);   color: var(--rdx); border-color: transparent; }

  /* Appearance OUTLINE (bordure colorée) */
  .bdg.v-primary.a-outline     { background: color-mix(in srgb, var(--a) 6%, transparent);  color: var(--adx); border-color: color-mix(in srgb, var(--a) 30%, transparent); }
  .bdg.v-success.a-outline     { background: rgba(16,185,129,.06);  color: var(--grdk); border-color: rgba(16,185,129,.3); }
  .bdg.v-warning.a-outline     { background: rgba(245,158,11,.06);  color: var(--amx); border-color: rgba(245,158,11,.3); }
  .bdg.v-info.a-outline        { background: rgba(139,92,246,.06);  color: #6d28d9; border-color: rgba(139,92,246,.3); }
  .bdg.v-destructive.a-outline { background: rgba(239,68,68,.06);   color: var(--rdx); border-color: rgba(239,68,68,.3); }

  /* Appearance GHOST (texte seul) */
  .bdg.a-ghost { background: transparent !important; border-color: transparent; padding: 0 !important; }
  .bdg.v-primary.a-ghost       { color: var(--a); }
  .bdg.v-secondary.a-ghost     { color: var(--mu4); }
  .bdg.v-success.a-ghost       { color: var(--gr); }
  .bdg.v-warning.a-ghost       { color: var(--am); }
  .bdg.v-info.a-ghost          { color: var(--pu); }
  .bdg.v-destructive.a-ghost   { color: var(--rd); }

  .bdg[aria-disabled="true"] { opacity: .5; pointer-events: none; }

  /* Petit halo pulse pour les badges "fraîchement débloqués" */
  .bdg.bdg-fresh {
    animation: bdg-pulse 1.6s ease-in-out 3;
  }
  @keyframes bdg-pulse {
    0%, 100% { box-shadow: 0 0 0 0 currentColor; }
    50%      { box-shadow: 0 0 0 4px rgba(0,0,0,.04); transform: scale(1.03); }
  }
  @media (prefers-reduced-motion: reduce) {
    .bdg.bdg-fresh { animation: none; }
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
 * Render un badge.
 * @param {string} text - texte du badge (échappé automatiquement)
 * @param {Object} opts
 * @param {'primary'|'secondary'|'success'|'warning'|'info'|'destructive'|'outline'} [opts.variant='primary']
 * @param {'default'|'light'|'outline'|'ghost'} [opts.appearance='default']
 * @param {'xs'|'sm'|'md'|'lg'} [opts.size='md']
 * @param {'default'|'circle'} [opts.shape='default']
 * @param {boolean} [opts.dot=false]  affiche un point coloré devant
 * @param {string} [opts.iconHtml]  HTML d'une icône SVG à mettre devant
 * @param {boolean} [opts.fresh=false]  ajoute un pulse animation
 * @param {boolean} [opts.disabled=false]
 * @returns {string} HTML
 */
export function badge(text, opts = {}) {
  ensureStyle();
  const {
    variant = 'primary',
    appearance = 'default',
    size = 'md',
    shape = 'default',
    dot = false,
    iconHtml = '',
    fresh = false,
    disabled = false,
  } = opts;

  const classes = [
    'bdg',
    `bdg-${size}`,
    shape === 'circle' ? 'bdg-circle' : '',
    `v-${variant}`,
    `a-${appearance}`,
    fresh ? 'bdg-fresh' : '',
  ].filter(Boolean).join(' ');

  const dotHtml = dot ? '<span class="bdg-dot" aria-hidden="true"></span>' : '';
  const iconWrap = iconHtml ? `<span aria-hidden="true">${iconHtml}</span>` : '';
  const attrs = disabled ? 'aria-disabled="true"' : '';

  return `<span class="${classes}" ${attrs}>${dotHtml}${iconWrap}${esc(text)}</span>`;
}

/**
 * Helpers de raccourci pour usages courants PermiGo
 */
export const Badges = {
  unlock:    (text = 'Débloqué')   => badge(text, { variant: 'success',     appearance: 'light',   size: 'sm', dot: true }),
  locked:    (text = 'Verrouillé') => badge(text, { variant: 'secondary',   appearance: 'light',   size: 'sm' }),
  inProgress:(text = 'En cours')   => badge(text, { variant: 'warning',     appearance: 'light',   size: 'sm', dot: true }),
  acquis:    (text = 'Acquis')     => badge(text, { variant: 'success',     appearance: 'light',   size: 'sm', shape: 'circle' }),
  toValidate:(text = 'À valider')  => badge(text, { variant: 'primary',     appearance: 'light',   size: 'sm', shape: 'circle' }),
  premium:   (text = 'Premium')    => badge(text, { variant: 'info',        appearance: 'light',   size: 'sm', shape: 'circle' }),
  fresh:     (text)                => badge(text, { variant: 'success',     appearance: 'default', size: 'sm', shape: 'circle', fresh: true }),
};
