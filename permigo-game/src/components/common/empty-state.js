// ═══════════════════════════════════════════════════════════════
// Empty State — composant réutilisable
// Variants : full (illustration + titre + sous-titre + CTA)
//           compact (illustration 60px + titre court)
// Animation : scale(0.96→1) cubic-bezier(.34,1.56,.64,1) 350ms
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";

const SHARED_STYLES = `
.es-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 20px;
}
.es-wrap.es-compact {
  padding: 16px 12px;
  flex-direction: row;
  gap: 14px;
  text-align: left;
  justify-content: flex-start;
}

/* ── Illustration ── */
.es-img {
  display: block;
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 16px;
  animation: esBounceIn 350ms cubic-bezier(.34,1.56,.64,1) both;
}
.es-compact .es-img {
  width: 60px;
  height: 60px;
  margin-bottom: 0;
  flex-shrink: 0;
}

/* ── Text ── */
.es-title {
  font: 700 17px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 6px;
}
.es-compact .es-title { font-size: 14px; margin-bottom: 4px; }

.es-sub {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--mu3);
  margin-bottom: 18px;
  max-width: 280px;
}
.es-compact .es-sub { font-size: 12px; margin-bottom: 0; max-width: none; }

/* ── CTA ── */
.es-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 22px;
  background: var(--a);
  color: var(--a-ink);
  border: 0;
  border-radius: 14px;
  font: 600 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  text-decoration: none;
  min-height: 44px;
  transition: transform 160ms cubic-bezier(.23,1,.32,1), background 160ms;
  animation: esBounceIn 380ms cubic-bezier(.34,1.56,.64,1) 80ms both;
}
@media (hover:hover) and (pointer:fine) {
  .es-cta:hover { background: var(--adk); }
}
.es-cta:active { transform: scale(.97); }

/* ── Entry animation ── */
@keyframes esBounceIn {
  from { opacity: 0; transform: scale(.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@media (prefers-reduced-motion:reduce) {
  .es-img, .es-cta { animation: none; opacity: 1; }
}
`;

let _stylesInjected = false;
function ensureStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const style = document.createElement("style");
  style.textContent = SHARED_STYLES;
  document.head.appendChild(style);
}

/**
 * API allégée (compatible brief Sprint 5).
 * emptyState({ image, title, body, cta? })
 * — image : URL absolue (toujours /skins/...)
 * — title : string (texte pur)
 * — body  : string (texte pur)
 * — cta   : HTML string optionnel (bouton pré-formaté)
 * @returns {string} HTML
 */
export function emptyState({ image, title, body, cta }) {
  // Mascotte par défaut quand l'appelant ne fournit pas d'illustration
  const img = image || "/skins/mascot-wait.png";
  return `
    <div style="text-align:center;padding:48px 24px;display:flex;flex-direction:column;align-items:center;gap:16px">
      <img src="${img}" alt="" loading="lazy"
           style="width:140px;height:140px;object-fit:contain;opacity:.92"
           onerror="this.style.display='none'">
      <div style="font:700 18px/1.2 'Plus Jakarta Sans',sans-serif;color:var(--ink)">${esc(title)}</div>
      <div style="font:500 14px/1.5 'Inter',sans-serif;color:var(--mu);max-width:280px">${esc(body)}</div>
      ${cta ?? ""}
    </div>
  `;
}

/**
 * Retourne le HTML d'un empty state (API complète).
 *
 * @param {object} opts
 * @param {string}  opts.illustration  — URL de l'image (ex: '/skins/empty-parcours.png')
 * @param {string}  opts.title         — Titre principal
 * @param {string} [opts.subtitle]     — Sous-titre (non affiché en mode compact)
 * @param {string} [opts.ctaLabel]     — Texte du bouton CTA (omis si absent)
 * @param {string} [opts.ctaHref]      — href du CTA (ex: '#/parcours')
 * @param {boolean}[opts.compact]      — Mode compact : illustration 60px, layout horizontal
 * @returns {string} HTML
 */
export function renderEmptyState({
  illustration,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  compact = false,
}) {
  ensureStyles();

  const ill = illustration || "/skins/mascot-wait.png";
  const img = `<img class="es-img" src="${esc(ill)}" alt="" role="presentation" loading="lazy" />`;

  const sub =
    !compact && subtitle
      ? `<div class="es-sub">${esc(subtitle)}</div>`
      : compact && subtitle
        ? `<div class="es-sub">${esc(subtitle)}</div>`
        : "";

  const cta = ctaLabel
    ? `<a class="es-cta" href="${esc(ctaHref || "#")}" role="button">${esc(ctaLabel)}</a>`
    : "";

  const wrapClass = `es-wrap${compact ? " es-compact" : ""}`;

  if (compact) {
    return `<div class="${wrapClass}">
  ${img}
  <div>
    <div class="es-title">${esc(title)}</div>
    ${sub}
    ${cta}
  </div>
</div>`;
  }

  return `<div class="${wrapClass}">
  ${img}
  <div class="es-title">${esc(title)}</div>
  ${sub}
  ${cta}
</div>`;
}
