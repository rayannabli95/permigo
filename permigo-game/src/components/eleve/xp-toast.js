// ═══════════════════════════════════════════════════════════════
// XP Toast — notification slide-in-right après validation
// Usage : showXpToast({ xp: 25, eleveName: 'Léa', trophy: 'Maîtrise du véhicule' })
// ═══════════════════════════════════════════════════════════════

const STYLE = `
  .xpt-wrap {
    position: fixed;
    top: 24px;
    right: -320px;
    z-index: 9998;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: right .35s cubic-bezier(.2,.7,.3,1);
    pointer-events: none;
    max-width: 300px;
  }
  .xpt-wrap.xpt-visible { right: 16px; }

  .xpt-card {
    background: #fff;
    border: 1px solid rgba(99,102,241,.2);
    border-radius: 16px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: all;
    box-shadow: 0 4px 16px rgba(11,13,26,.08), 0 1px 4px rgba(11,13,26,.04);
  }
  .xpt-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .xpt-text { flex: 1; min-width: 0; }
  .xpt-label {
    font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #0a0d1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .xpt-sub {
    font: 500 11px/1.3 'Inter', sans-serif;
    color: #64748b;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .xpt-xp {
    font: 800 15px/1 'IBM Plex Mono', monospace;
    color: #6366f1;
    flex-shrink: 0;
  }
`;

let _wrap = null;
let _hideTimer = null;

function ensureWrap() {
  if (_wrap) return _wrap;

  if (!document.head.querySelector('#xpt-style')) {
    const s = document.createElement('style');
    s.id = 'xpt-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  _wrap = document.createElement('div');
  _wrap.className = 'xpt-wrap';
  document.body.appendChild(_wrap);
  return _wrap;
}

/**
 * @param {Object} opts
 * @param {number}  opts.xp         - XP gagné (ex: 25 ou 125)
 * @param {string}  opts.eleveName  - Prénom de l'élève (ex: "Léa")
 * @param {string}  [opts.trophy]   - Trophée débloqué (optionnel)
 * @param {number}  [opts.duration] - Durée d'affichage en ms (défaut 4000)
 */
export function showXpToast({ xp, eleveName, trophy = null, duration = 4000 }) {
  const wrap = ensureWrap();

  // Carte XP principale
  const card = document.createElement('div');
  card.className = 'xpt-card anim-slide-up';
  card.innerHTML = `
    <div class="xpt-icon">⚡</div>
    <div class="xpt-text">
      <div class="xpt-label">+${xp} XP</div>
      <div class="xpt-sub">${eleveName} progresse avec toi 🎯</div>
    </div>
    <div class="xpt-xp">+${xp}</div>
  `;
  wrap.appendChild(card);

  // Carte trophée (si présente)
  if (trophy) {
    const tCard = document.createElement('div');
    tCard.className = 'xpt-card';
    tCard.style.borderColor = 'rgba(251,191,36,.35)';
    tCard.innerHTML = `
      <div class="xpt-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)">🏆</div>
      <div class="xpt-text">
        <div class="xpt-label">${eleveName} a débloqué</div>
        <div class="xpt-sub">${trophy}</div>
      </div>
    `;
    wrap.appendChild(tCard);
  }

  // Slide in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { wrap.classList.add('xpt-visible'); });
  });

  // Auto-hide
  clearTimeout(_hideTimer);
  _hideTimer = setTimeout(() => {
    wrap.classList.remove('xpt-visible');
    setTimeout(() => {
      wrap.innerHTML = '';
    }, 400);
  }, duration);
}
