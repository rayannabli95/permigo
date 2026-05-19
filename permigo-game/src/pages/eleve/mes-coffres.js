// ═══════════════════════════════════════════════════════════════
// Élève — Mes Coffres
// Route : #/mes-coffres
// Liste tous les coffres DB (get_my_chests) :
//   - À ouvrir (unlocked, opened_at IS NULL)
//   - Déjà ouverts
//   - Prochains jalons (streak / mondes)
// ═══════════════════════════════════════════════════════════════
import { getCurUser }  from '@/auth/cur-user.js';
import { esc }         from '@/utils/escape.js';
import { track }       from '@/services/analytics.js';
import { navigate }    from '@/router.js';
import { icon }        from '@/utils/icons.js';
import { getMyChests, unlockChest, openChest } from '@/utils/game-state.js';
import { openChestModal, ensureChestStyles }   from '@/components/chest.js';

// ─── Metadata par type de coffre ─────────────────────────────────
const CHEST_META = {
  world_1:   { label: 'Monde 1 — Sécurité',      emoji: '🛡️',  tier: 'bronze',     xp: 200,  gemmes: 50  },
  world_2:   { label: 'Monde 2 — Manœuvres',     emoji: '🔧',  tier: 'argent',     xp: 400,  gemmes: 100 },
  world_3:   { label: 'Monde 3 — Conduite',       emoji: '🚗',  tier: 'or',         xp: 700,  gemmes: 175 },
  world_4:   { label: 'Monde 4 — Maîtrise',       emoji: '🏆',  tier: 'legendaire', xp: 1200, gemmes: 300 },
  streak_7:  { label: 'Streak 7 jours',           emoji: '🔥',  tier: 'argent',     xp: 150,  gemmes: 30  },
  streak_14: { label: 'Streak 14 jours',          emoji: '⚡',  tier: 'or',         xp: 350,  gemmes: 80  },
  streak_30: { label: 'Streak 30 jours',          emoji: '👑',  tier: 'legendaire', xp: 800,  gemmes: 200 },
};

const TIER_GRADIENT = {
  bronze:     'linear-gradient(135deg,#d97706,#7c2d12)',
  argent:     'linear-gradient(135deg,#94a3b8,#475569)',
  or:         'linear-gradient(135deg,#facc15,#a16207)',
  legendaire: 'linear-gradient(135deg,#a855f7,#581c87)',
};

const STYLE = `<style>
.mc-page {
  max-width: 480px; margin: 0 auto;
  padding: 20px 16px 110px;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', sans-serif;
}
.mc-hd {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 24px;
}
.mc-back {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1.5px solid var(--bo);
  background: var(--su);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink);
  font-size: 18px; line-height: 1;
  transition: transform .12s;
  flex-shrink: 0;
}
.mc-back:active { transform: scale(.93); }
.mc-h1 {
  font: 700 22px/1.15 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); letter-spacing: -.02em; margin: 0; flex: 1;
}

/* ── Section headers ── */
.mc-section {
  font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--mu2);
  letter-spacing: .08em;
  text-transform: uppercase;
  margin: 24px 0 12px;
}
.mc-section:first-of-type { margin-top: 0; }

/* ── Chest card ── */
.mc-list { display: flex; flex-direction: column; gap: 10px; }
.mc-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  padding: 16px;
  display: flex; align-items: center; gap: 14px;
  transition: border-color .14s, transform .14s;
  cursor: default;
  animation: mcCardIn .35s cubic-bezier(.34,1.56,.64,1) both;
}
.mc-card:nth-child(n+5) { animation: none; }
@keyframes mcCardIn {
  from { opacity:0; transform:translateY(10px) scale(.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.mc-card.mc-can-open {
  cursor: pointer;
  border-color: transparent;
  background: var(--su);
  box-shadow: 0 0 0 1.5px rgba(99,102,241,.3),
              0 8px 24px -8px rgba(99,102,241,.2);
}
@media (hover:hover) and (pointer:fine) {
  .mc-card.mc-can-open:hover {
    border-color: transparent;
    box-shadow: 0 0 0 2px rgba(99,102,241,.55),
                0 12px 32px -8px rgba(99,102,241,.3);
    transform: translateY(-2px);
  }
}
.mc-card.mc-can-open:active { transform: scale(.98); }
.mc-card.mc-opened { opacity: .52; filter: saturate(.45); cursor: default; }

.mc-icon {
  width: 52px; height: 52px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; flex-shrink: 0;
  position: relative;
}
.mc-icon-glow {
  position: absolute; inset: -4px;
  border-radius: 20px;
  opacity: .35; filter: blur(10px);
  z-index: -1;
}

.mc-info { flex: 1; min-width: 0; }
.mc-label {
  font: 600 14px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mc-sub {
  font: 500 12px/1.4 'Inter', sans-serif;
  color: var(--mu);
  margin-top: 3px;
}
.mc-rewards {
  display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;
}
.mc-rew-chip {
  font: 700 11px/1 'Inter', sans-serif;
  padding: 3px 8px; border-radius: 99px;
  background: rgba(99,102,241,.08);
  color: #6366f1;
}

.mc-badge {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.mc-badge-open    { background: rgba(99,102,241,.12); color: #6366f1; }
.mc-badge-opened  { background: rgba(16,185,129,.1);  color: #059669; }

/* ── CTA open button on card ── */
.mc-open-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 10px;
  border: 0;
  font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
  background: #6366f1;
  color: #fff;
  cursor: pointer;
  transition: transform .12s, opacity .12s;
  min-height: 36px;
  white-space: nowrap;
}
.mc-open-btn:active { transform: scale(.96); opacity: .88; }

/* ── Empty ── */
.mc-empty {
  text-align: center; padding: 40px 0;
  font: 500 14px/1.6 'Inter', sans-serif;
  color: var(--mu2);
}
.mc-empty-ico { font-size: 36px; margin-bottom: 12px; }

/* ── Skeleton ── */
.mc-skel {
  height: 76px; background: var(--su);
  border: 1.5px solid var(--bo); border-radius: 20px;
  animation: mcPulse 1.4s ease-in-out infinite;
}
.mc-skel:nth-child(2) { animation-delay: .1s; }
.mc-skel:nth-child(3) { animation-delay: .2s; }
@keyframes mcPulse { 0%,100%{opacity:1} 50%{opacity:.5} }

@media (prefers-reduced-motion:reduce) {
  .mc-card { animation: none; }
  .mc-skel { animation: none; }
}
</style>`;

function relTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'aujourd\'hui';
  if (d === 1) return 'hier';
  if (d < 7) return `il y a ${d}j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function renderCard(chest) {
  const meta = CHEST_META[chest.chest_type] || { label: chest.chest_type, emoji: '📦', tier: 'bronze', xp: 0, gemmes: 0 };
  const grad = TIER_GRADIENT[meta.tier] || TIER_GRADIENT.bronze;
  const canOpen = !chest.opened_at;
  const rew = chest.rewards || {};
  const xp = rew.xp || meta.xp;
  const gemmes = rew.gemmes || meta.gemmes;

  return `
  <div class="mc-card${canOpen ? ' mc-can-open' : ' mc-opened'}"
       data-chest-type="${esc(chest.chest_type)}"
       data-chest-id="${esc(chest.id)}"
       role="${canOpen ? 'button' : 'article'}"
       tabindex="${canOpen ? '0' : '-1'}"
       aria-label="${canOpen ? `Ouvrir : ${esc(meta.label)}` : `Déjà ouvert : ${esc(meta.label)}`}">
    <div class="mc-icon" style="background:${grad}">
      <span aria-hidden="true">${meta.emoji}</span>
      <div class="mc-icon-glow" style="background:${grad}"></div>
    </div>
    <div class="mc-info">
      <div class="mc-label">${esc(meta.label)}</div>
      <div class="mc-sub">${canOpen ? 'Débloqué ' + relTime(chest.unlocked_at) : 'Ouvert ' + relTime(chest.opened_at)}</div>
      ${canOpen ? `<div class="mc-rewards">
        <span class="mc-rew-chip">⚡ +${xp} XP</span>
        <span class="mc-rew-chip">💎 +${gemmes}</span>
      </div>` : ''}
    </div>
    ${canOpen
      ? `<button class="mc-open-btn" aria-label="Ouvrir le coffre">Ouvrir</button>`
      : `<div class="mc-badge mc-badge-opened" aria-hidden="true">${icon('check', { size: 14, strokeWidth: 2.5 })}</div>`
    }
  </div>`;
}

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page.view', { page: 'mes_coffres', role: me.role });

  root.innerHTML = `
    ${STYLE}
    <div class="mc-page anim-slide-up">
      <div class="mc-hd">
        <button class="mc-back" aria-label="Retour" id="mc-back">←</button>
        <h1 class="mc-h1">Mes coffres</h1>
      </div>
      <div class="mc-list">
        <div class="mc-skel"></div>
        <div class="mc-skel"></div>
        <div class="mc-skel"></div>
      </div>
    </div>
  `;

  root.querySelector('#mc-back')?.addEventListener('click', () => navigate('#/'));

  ensureChestStyles();

  let chests = [];
  try {
    chests = await getMyChests();
  } catch (e) {
    console.error('[mes-coffres] load failed', e);
  }

  const toOpen   = chests.filter(c => !c.opened_at);
  const opened   = chests.filter(c =>  c.opened_at);

  const page = root.querySelector('.mc-page');
  if (!page) return;

  let html = '';

  if (toOpen.length > 0) {
    html += `<div class="mc-section">À ouvrir (${toOpen.length})</div>`;
    html += `<div class="mc-list">${toOpen.map(renderCard).join('')}</div>`;
  }

  if (opened.length > 0) {
    html += `<div class="mc-section">Déjà ouverts</div>`;
    html += `<div class="mc-list">${opened.map(renderCard).join('')}</div>`;
  }

  if (chests.length === 0) {
    html = `
      <div class="mc-empty">
        <div class="mc-empty-ico">🎁</div>
        Aucun coffre encore — complète des mondes<br>et construis ton streak !
      </div>
    `;
  }

  // Replace skeleton with real content
  page.querySelector('.mc-list')?.remove();
  page.insertAdjacentHTML('beforeend', html);

  // Wire click on "can open" cards
  page.querySelectorAll('.mc-card.mc-can-open').forEach(card => {
    const chestType = card.dataset.chestType;
    const meta = CHEST_META[chestType] || { label: chestType };

    const triggerOpen = () => {
      // Parse world number for the cinematic modal (falls back to generic)
      const worldMatch = chestType.match(/^world_(\d+)$/);
      if (worldMatch) {
        const worldNum = parseInt(worldMatch[1], 10);
        const WORLD_NAMES = ['', 'Sécurité', 'Manœuvres', 'Conduite', 'Maîtrise'];
        openChestModal({ worldNum, worldName: WORLD_NAMES[worldNum] || `Monde ${worldNum}` });
      } else {
        // Streak / other chest: mark via RPC and show a simple open
        openChest(chestType)
          .then(() => {
            // Refresh the card to "opened" state
            card.classList.remove('mc-can-open');
            card.classList.add('mc-opened');
            card.tabIndex = -1;
            card.querySelector('.mc-open-btn')?.replaceWith(
              Object.assign(document.createElement('div'), {
                className: 'mc-badge mc-badge-opened',
                innerHTML: icon('check', { size: 14, strokeWidth: 2.5 }),
              })
            );
            const sub = card.querySelector('.mc-sub');
            if (sub) sub.textContent = 'Ouvert aujourd\'hui';
            card.querySelector('.mc-rewards')?.remove();
          })
          .catch(() => {});
      }
      track('chest.opened_from_page', { chest_type: chestType });
    };

    card.addEventListener('click', triggerOpen);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerOpen(); } });
    card.querySelector('.mc-open-btn')?.addEventListener('click', e => { e.stopPropagation(); triggerOpen(); });
  });
}
