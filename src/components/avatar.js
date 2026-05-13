/**
 * Avatar component — affiche soit la photo de profil de l'user, soit ses initiales
 * en gradient si pas de photo.
 *
 * Usage :
 *   import { avatarHTML } from '@/components/avatar.js';
 *   ${avatarHTML(profile, { size: 44, className: 'me-av' })}
 *
 * Props :
 *  - profile  : { nom, avatar_url } — n'importe quel profil
 *  - size     : px (carré), default 40
 *  - className : classe CSS additionnelle pour le wrapper
 *  - rounded  : '50%' (cercle, default) | '14px' (square rounded) | px
 *  - ring     : booléen, ajoute un ring blanc subtil (default false)
 */

import { esc } from '@/utils/escape.js';

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

const PALETTES = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0891b2,#155e75)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
  'linear-gradient(135deg,#0e7c66,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#a16207,#713f12)',
  'linear-gradient(135deg,#dc2626,#7f1d1d)',
  'linear-gradient(135deg,#059669,#064e3b)',
];

function pickPalette(name) {
  if (!name) return PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % PALETTES.length;
  return PALETTES[hash];
}

export function avatarHTML(profile, opts = {}) {
  const size = opts.size || 40;
  const rounded = opts.rounded || '50%';
  const className = opts.className || '';
  const ring = opts.ring ? 'pg-av--ring' : '';
  const ariaLabel = opts.ariaLabel || `Avatar de ${profile?.nom || 'utilisateur'}`;
  const gradient = pickPalette(profile?.nom);
  const url = profile?.avatar_url;
  const fontSize = Math.round(size * 0.36);

  if (url) {
    return `
      <span class="pg-av ${ring} ${className}" style="width:${size}px;height:${size}px;border-radius:${rounded}" role="img" aria-label="${esc(ariaLabel)}">
        <img src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="pg-av-fb" style="background:${gradient};font-size:${fontSize}px;display:none">${esc(initials(profile?.nom))}</span>
      </span>
    `;
  }

  return `
    <span class="pg-av ${ring} ${className}" style="width:${size}px;height:${size}px;border-radius:${rounded}" role="img" aria-label="${esc(ariaLabel)}">
      <span class="pg-av-fb" style="background:${gradient};font-size:${fontSize}px">${esc(initials(profile?.nom))}</span>
    </span>
  `;
}

/** Inject les styles une fois. */
let _avatarCssInjected = false;
export function ensureAvatarStyles() {
  if (_avatarCssInjected) return;
  _avatarCssInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .pg-av{
      display:inline-flex;align-items:center;justify-content:center;
      overflow:hidden;flex-shrink:0;
      position:relative;
      background:var(--bg2);
    }
    .pg-av--ring{box-shadow:0 0 0 2px rgba(255,255,255,.35),0 4px 12px -2px rgba(11,13,26,.25)}
    .pg-av img{
      width:100%;height:100%;object-fit:cover;
      display:block;
      border-radius:inherit;
    }
    .pg-av-fb{
      width:100%;height:100%;
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-family:var(--fd);font-weight:900;letter-spacing:-.02em;
      text-shadow:0 1px 2px rgba(0,0,0,.3);
      border-radius:inherit;
    }
  `;
  document.head.appendChild(style);
}
