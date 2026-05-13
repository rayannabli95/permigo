/**
 * Composant Logo PermiGo — réutilisable partout.
 *
 * Usage :
 *   import { logoHTML } from '@/components/logo.js';
 *   <div>${logoHTML({ size: 36 })}</div>
 *
 * Options :
 *  - size       : hauteur en px (défaut 40)
 *  - mode       : 'auto' (défaut, image avec fallback texte) | 'image' | 'text'
 *  - withGlow   : ajoute un glow violet (pour fonds sombres)
 *  - inline     : ajoute display:inline-block au wrapper
 *  - className  : classe CSS supplémentaire
 *  - alt        : texte alt (défaut 'PermiGo')
 *
 * Le fichier image attendu : /public/permigo-logo.png
 * Si l'image n'existe pas, fallback automatique sur texte stylisé.
 */

export function logoHTML(opts = {}) {
  const size = opts.size || 40;
  const mode = opts.mode || 'auto';
  const glow = opts.withGlow ? 'pg-logo--glow' : '';
  const inline = opts.inline ? 'pg-logo--inline' : '';
  const extra = opts.className || '';
  const alt = opts.alt || 'PermiGo';

  // Style scoped + responsive
  const scopedStyles = `
    <style>
      .pg-logo{display:flex;align-items:center;gap:6px}
      .pg-logo--inline{display:inline-flex}
      .pg-logo img{height:var(--pg-h,40px);width:auto;display:block;max-width:100%;object-fit:contain}
      .pg-logo--glow img{filter:drop-shadow(0 6px 18px rgba(139,92,246,.35)) drop-shadow(0 0 12px rgba(99,102,241,.25))}
      .pg-logo-fb{font-family:'Archivo',ui-sans-serif,sans-serif;font-weight:900;letter-spacing:-.03em;line-height:1;font-size:calc(var(--pg-h,40px) * .65);background:linear-gradient(90deg,#6366f1 0%,#a78bfa 50%,#0ea5e9 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
      .pg-logo--glow .pg-logo-fb{filter:drop-shadow(0 4px 12px rgba(139,92,246,.35))}
    </style>
  `;

  if (mode === 'text') {
    return `${scopedStyles}<span class="pg-logo ${glow} ${inline} ${extra}" style="--pg-h:${size}px" role="img" aria-label="${alt}"><span class="pg-logo-fb">PermiGo</span></span>`;
  }

  // mode auto = image + fallback texte si onerror
  return `
    ${scopedStyles}
    <span class="pg-logo ${glow} ${inline} ${extra}" style="--pg-h:${size}px" role="img" aria-label="${alt}">
      <span class="pg-logo-txt">PermiGo</span>
      <span class="pg-logo-fb" style="display:none">PermiGo</span>
    </span>
  `;
}
