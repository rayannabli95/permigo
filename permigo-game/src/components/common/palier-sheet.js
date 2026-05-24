// ═══════════════════════════════════════════════════════════════
// Palier Sheet — bottom-sheet de détail d'un palier moniteur
// Réutilisé par parcours-pro.js et parcours-pro-complet.js.
// Sobre, mobile-first. Ouvre au clic sur un palier ; ferme via overlay,
// bouton, ou touche Échap. Respecte prefers-reduced-motion.
// ═══════════════════════════════════════════════════════════════
import { esc } from '@/utils/escape.js';
import { icon } from '@/utils/icons.js';

let _injectedStyle = false;
let _activeOverlay = null;
let _onKeydown = null;

const STYLE = `<style id="palier-sheet-style">
.psheet-ov {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15,23,42,.5);
  backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
  display: flex; align-items: flex-end; justify-content: center;
  opacity: 0; transition: opacity .2s ease;
}
.psheet-ov.show { opacity: 1; }
.psheet {
  width: 100%; max-width: 580px;
  background: var(--su, #fff);
  border-radius: 24px 24px 0 0;
  padding: 8px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -8px 32px rgba(10,13,26,.18);
  transform: translateY(100%); transition: transform .26s cubic-bezier(.2,.7,.3,1);
  font-family: 'Inter', sans-serif; color: var(--ink, #0f172a);
}
.psheet-ov.show .psheet { transform: translateY(0); }
.psheet-grab {
  width: 38px; height: 4px; border-radius: 99px;
  background: var(--bo, #e2e6f2);
  margin: 8px auto 16px;
}
.psheet-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.psheet-icon {
  width: 52px; height: 52px; border-radius: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(99,102,241,.1); color: #6366f1;
}
.psheet-icon.done { background: rgba(16,185,129,.1); color: #059669; }
.psheet-head-info { flex: 1; min-width: 0; }
.psheet-tier {
  font: 600 11px/1 'Inter', sans-serif; letter-spacing: .08em;
  text-transform: uppercase; color: var(--mu2, #94a3b8); margin-bottom: 4px;
}
.psheet-title {
  font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink, #0f172a); letter-spacing: -0.02em; margin: 0;
}
.psheet-badge {
  flex-shrink: 0; font: 600 11px/1 'Inter', sans-serif;
  padding: 5px 9px; border-radius: 99px; white-space: nowrap;
}
.psheet-badge.done { color: #059669; background: rgba(16,185,129,.12); }
.psheet-badge.todo { color: #4f46e5; background: rgba(99,102,241,.1); }
.psheet-reward-lbl {
  font: 600 10px/1 'Inter', sans-serif; letter-spacing: .1em;
  text-transform: uppercase; color: var(--mu2, #94a3b8); margin-bottom: 6px;
}
.psheet-reward-name {
  font: 700 16px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink, #0f172a); margin-bottom: 8px;
}
.psheet-reward-desc {
  font: 500 13.5px/1.55 'Inter', sans-serif; color: var(--mu, #64748b);
}
.psheet-meta {
  margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--bo2, #eef1f7);
  font: 500 12.5px/1.4 'Inter', sans-serif; color: var(--mu2, #94a3b8);
}
.psheet-meta strong { color: var(--ink, #0f172a); font-weight: 700; }
.psheet-close {
  width: 100%; margin-top: 18px; padding: 13px;
  background: var(--bg2, #f1f3f9); border: none; border-radius: 14px;
  color: var(--ink, #0f172a); font: 600 14px/1 'Inter', sans-serif;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.psheet-close:active { background: #e2e6f2; }
@media (prefers-reduced-motion: reduce) {
  .psheet-ov, .psheet { transition: none; }
}
</style>`;

/**
 * Ouvre le bottom-sheet de détail d'un palier.
 * @param {{tier:number, threshold:number, title:string, unlock:{iconName,name,desc}}} tier
 * @param {number} totalVals - vrai compte de validations cumulées
 */
export function openPalierSheet(tier, totalVals = 0) {
  if (!tier) return;
  if (!_injectedStyle && !document.getElementById('palier-sheet-style')) {
    document.head.insertAdjacentHTML('beforeend', STYLE);
    _injectedStyle = true;
  }
  closePalierSheet(); // un seul à la fois

  const done = totalVals >= tier.threshold;
  const remaining = Math.max(0, tier.threshold - totalVals);
  const iconName = tier.unlock?.iconName ?? 'star';

  const badge = done
    ? '<span class="psheet-badge done">Atteint</span>'
    : `<span class="psheet-badge todo">+${remaining} validation${remaining > 1 ? 's' : ''}</span>`;

  const meta = done
    ? `Palier débloqué à <strong>${tier.threshold} validation${tier.threshold > 1 ? 's' : ''}</strong>.`
    : `Encore <strong>${remaining} validation${remaining > 1 ? 's' : ''}</strong> pour débloquer ce palier (seuil : ${tier.threshold}).`;

  const ov = document.createElement('div');
  ov.className = 'psheet-ov';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = `
    <div class="psheet" role="document">
      <div class="psheet-grab"></div>
      <div class="psheet-head">
        <div class="psheet-icon ${done ? 'done' : ''}">
          ${icon(iconName, { size: 26, strokeWidth: 2 })}
        </div>
        <div class="psheet-head-info">
          <div class="psheet-tier">Palier ${tier.tier}</div>
          <h2 class="psheet-title">${esc(tier.title)}</h2>
        </div>
        ${badge}
      </div>
      <div class="psheet-reward-lbl">${done ? 'Récompense débloquée' : 'Récompense à débloquer'}</div>
      <div class="psheet-reward-name">${esc(tier.unlock?.name ?? '—')}</div>
      <div class="psheet-reward-desc">${esc(tier.unlock?.desc ?? '')}</div>
      <div class="psheet-meta">${meta}</div>
      <button class="psheet-close" type="button">Fermer</button>
    </div>`;

  document.body.appendChild(ov);
  _activeOverlay = ov;

  // Ferme si clic sur l'overlay (hors du panneau) ou sur le bouton
  ov.addEventListener('click', (e) => {
    if (e.target === ov) closePalierSheet();
  });
  ov.querySelector('.psheet-close')?.addEventListener('click', closePalierSheet);

  _onKeydown = (e) => { if (e.key === 'Escape') closePalierSheet(); };
  document.addEventListener('keydown', _onKeydown);

  // Anime l'entrée
  requestAnimationFrame(() => ov.classList.add('show'));
}

export function closePalierSheet() {
  if (_onKeydown) { document.removeEventListener('keydown', _onKeydown); _onKeydown = null; }
  const ov = _activeOverlay;
  if (!ov) return;
  _activeOverlay = null;
  ov.classList.remove('show');
  const remove = () => ov.remove();
  // Laisse l'animation de sortie se jouer, fallback si pas de transition
  ov.addEventListener('transitionend', remove, { once: true });
  setTimeout(remove, 320);
}
