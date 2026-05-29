// ═══════════════════════════════════════════════════════════════
// Avatar — helper canonique de rendu (un seul système).
//   - Photo uploadée OU avatar réaliste choisi via avatar-picker.js
//     → <img> recadrée en cercle (object-fit: cover).
//   - Sinon : initiales sur fond dégradé.
//
// Remplace l'ancien renderUserAvatar d'avatar-modal.js (presets SVG
// "orange" payants en gemmes) — supprimé (antipattern vision V3).
// ═══════════════════════════════════════════════════════════════
import { esc } from '@/utils/escape.js';

/**
 * Rend l'avatar d'un utilisateur. Rendu unique partagé (header, carte profil…).
 * @param {{ avatar_url?: string, prenom?: string, nom?: string }} user
 * @param {number} size - diamètre en px
 * @returns {string} HTML
 */
export function renderUserAvatar({ avatar_url, prenom, nom } = {}, size = 40) {
  const name = `${prenom || ''} ${nom || ''}`.trim();
  if (avatar_url) {
    return `<img src="${esc(avatar_url)}" alt="${esc(name)}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;object-position:center;display:block" referrerpolicy="no-referrer">`;
  }
  const init = (name || nom || '?')
    .split(/\s+/).slice(0, 2).map(s => s[0] || '').join('').toUpperCase() || '?';
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg, var(--a), var(--adk));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${Math.floor(size * 0.4)}px;font-family:var(--fd,system-ui)">${esc(init)}</div>`;
}
