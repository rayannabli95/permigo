// ═══════════════════════════════════════════════════════════════
// Élève — Boutique
// RPCs : get_items_catalog() · purchase_item(item_id)
// Sections : Avatars · Thèmes · Fonds permis
// ═══════════════════════════════════════════════════════════════
import { sb }         from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast }      from '@/components/toast.js';
import { esc }        from '@/utils/escape.js';
import { track }      from '@/services/analytics.js';
import { icon }       from '@/utils/icons.js';
import { navigate }   from '@/router.js';

// ─── Config ──────────────────────────────────────────────────────
const RARITY = {
  common:    { label: 'Commun',     color: '#64748b', bg: '#f1f5f9',                 border: '#e2e8f0' },
  rare:      { label: 'Rare',       color: '#2563eb', bg: 'rgba(59,130,246,.07)',     border: 'rgba(59,130,246,.25)' },
  epic:      { label: 'Épique',     color: '#7c3aed', bg: 'rgba(139,92,246,.08)',     border: 'rgba(139,92,246,.3)' },
  legendary: { label: 'Légendaire', color: '#d97706', bg: 'rgba(245,158,11,.09)',     border: 'rgba(245,158,11,.35)' },
};

const SECTIONS = [
  { type: 'avatar',    emoji: '🎨', label: 'Avatars' },
  { type: 'theme',     emoji: '🌈', label: 'Thèmes' },
  { type: 'permis_bg', emoji: '🏆', label: 'Fonds permis' },
];

const TYPE_ICO = { avatar: '👤', theme: '🎨', permis_bg: '🏆' };

const EARN_WAYS = [
  { label: 'Valide une compétence REMC', sub: 'Avec ton moniteur en séance',     reward: '+50 💎', ico: 'award',  route: '#/parcours' },
  { label: 'Réussis un quiz à 100%',     sub: 'Post-validation ou consolidation', reward: '+20 💎', ico: 'target', route: null },
  { label: 'Maintiens ta série du jour', sub: 'Chaque jour d\'affilée',           reward: '+10 💎', ico: 'flame',  route: null },
];

const CONFETTI_COLORS = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Fixed header ── */
.btq-hd-wrap {
  position: fixed;
  top: 0; left: 50%;
  transform: translateX(-50%);
  width: min(100%, 480px);
  z-index: 200;
  background: rgba(248,249,252,.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(226,230,242,.8);
  padding-top: env(safe-area-inset-top, 0);
  animation: none !important;
}
.btq-hd-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 56px; padding: 0 16px;
}
.btq-back {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(10,13,26,.05); border: 0; cursor: pointer;
  color: #0a0d1a; transition: background .12s;
  -webkit-tap-highlight-color: transparent;
}
.btq-back:active { background: rgba(10,13,26,.12); }
.btq-hd-title {
  font: 700 17px/1 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a; letter-spacing: -.01em;
}
.btq-gems-pill {
  display: flex; align-items: center; gap: 5px;
  background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.18);
  border-radius: 20px; padding: 7px 12px; cursor: pointer;
  transition: background .12s; -webkit-tap-highlight-color: transparent;
  min-height: 36px;
}
.btq-gems-pill:active { background: rgba(99,102,241,.18); }
.btq-gems-num {
  font: 700 14px/1 'IBM Plex Mono', monospace;
  color: #6366f1; min-width: 24px;
}

/* ── Main container ── */
.btq {
  padding: calc(56px + env(safe-area-inset-top, 0) + 16px) 16px calc(100px + env(safe-area-inset-bottom, 0));
  max-width: 480px; margin: 0 auto;
  background: linear-gradient(180deg, rgba(99,102,241,.04) 0%, #f8f9fc 80px, #f8f9fc 100%);
  min-height: 100dvh;
  box-sizing: border-box;
}

/* ── Section ── */
.btq-sec { margin-bottom: 28px; }
.btq-sec-hd {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px; padding: 0 2px;
}
.btq-sec-title { font: 700 15px/1 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; letter-spacing: -.01em; }
.btq-sec-count {
  font: 600 11px/1 'Inter', sans-serif; color: #94a3b8;
  background: #f1f5f9; border-radius: 99px; padding: 2px 7px;
}
.btq-scroll {
  display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px;
  scrollbar-width: none; -webkit-overflow-scrolling: touch;
}
.btq-scroll::-webkit-scrollbar { display: none; }

/* ── Card ── */
.btq-card {
  flex-shrink: 0; width: 140px;
  border-radius: 16px; border: 1.5px solid #e2e6f2;
  background: #fff; overflow: hidden; cursor: pointer;
  position: relative;
  transition: transform .18s cubic-bezier(.23,1,.32,1), box-shadow .18s;
  animation: btqCardIn .35s cubic-bezier(.34,1.56,.64,1) both;
  -webkit-tap-highlight-color: transparent;
}
.btq-card:nth-child(2) { animation-delay:.04s; }
.btq-card:nth-child(3) { animation-delay:.08s; }
.btq-card:nth-child(4) { animation-delay:.12s; }
.btq-card:nth-child(5) { animation-delay:.16s; }
@keyframes btqCardIn {
  from { opacity:0; transform:translateY(10px) scale(.96); }
  to   { opacity:1; transform:translateY(0)    scale(1); }
}
@media (hover:hover) and (pointer:fine) {
  .btq-card:not(.btq-card--owned):hover {
    transform: scale(1.03);
    box-shadow: 0 6px 20px rgba(10,13,26,.1);
  }
}
.btq-card:not(.btq-card--owned):active { transform: scale(.97); }
.btq-card--owned { cursor: default; }
.btq-card--owned .btq-card-vis { opacity: .55; }

/* Legendary shimmer */
.btq-card--legendary .btq-card-vis::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(105deg, transparent 35%, rgba(245,158,11,.25) 50%, transparent 65%);
  animation: btqGold 2.2s ease-in-out infinite;
}
@keyframes btqGold { 0% { transform:translateX(-120%); } 100% { transform:translateX(120%); } }

/* Purchase pulse */
@keyframes btqPulse {
  0%   { box-shadow: 0 0 0 0 rgba(16,185,129,.5); }
  60%  { box-shadow: 0 0 0 10px rgba(16,185,129,0); transform: scale(1.02); }
  100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); transform: scale(1); }
}
.btq-card--just-bought { animation: btqPulse 1s ease-out forwards !important; }

/* Card visual */
.btq-card-vis {
  height: 100px; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.btq-card-vis img { width: 100%; height: 100%; object-fit: cover; display: block; }
.btq-card-vis-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 34px;
}
.btq-owned-badge {
  position: absolute; top: 7px; right: 7px;
  background: rgba(16,185,129,.9); color: #fff; backdrop-filter: blur(4px);
  font: 700 9px/1 'Plus Jakarta Sans', sans-serif;
  padding: 3px 7px; border-radius: 99px;
  display: flex; align-items: center; gap: 3px;
}

/* Card body */
.btq-card-bd { padding: 10px 10px 12px; }
.btq-card-name {
  font: 600 12px/1.3 'Plus Jakarta Sans', sans-serif; color: #0a0d1a;
  margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.btq-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.btq-rarity { font: 600 9.5px/1 'Inter', sans-serif; padding: 3px 6px; border-radius: 99px; white-space: nowrap; }
.btq-price  { font: 700 11px/1 'IBM Plex Mono', monospace; color: #4f46e5; flex-shrink: 0; }

/* Empty state */
.btq-empty {
  flex-shrink: 0; width: 200px; padding: 24px;
  background: #f8f9fc; border: 1.5px dashed #d1d8ee;
  border-radius: 16px; text-align: center;
}
.btq-empty-txt { font: 500 12px/1.5 'Inter', sans-serif; color: #94a3b8; }

/* ── Skeletons ── */
.btq-skel-card {
  flex-shrink: 0; width: 140px; height: 170px; border-radius: 16px;
  background: linear-gradient(90deg,#f0f2f8 0%,#e4e8f4 50%,#f0f2f8 100%);
  background-size: 200% 100%;
  animation: btqSkelShimmer 1.4s infinite;
}
@keyframes btqSkelShimmer { to { background-position:-200% 0; } }
.btq-skel-bar {
  height: 14px; border-radius: 8px; margin-bottom: 10px;
  background: linear-gradient(90deg,#f0f2f8 0%,#e4e8f4 50%,#f0f2f8 100%);
  background-size: 200% 100%; animation: btqSkelShimmer 1.4s infinite;
}

/* ── Modals ── */
.btq-modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,0);
  z-index: 490; pointer-events: none; transition: background .3s;
  animation: none !important;
}
.btq-modal-bg.open { background: rgba(0,0,0,.45); pointer-events: auto; backdrop-filter: blur(4px); }
.btq-modal {
  position: fixed; bottom: 0; left: 50%;
  transform: translateX(-50%) translateY(100%);
  width: min(100%, 480px); z-index: 495;
  background: #fff; border-radius: 28px 28px 0 0;
  border-top: 1px solid #e2e6f2;
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  padding: 0 20px max(24px, env(safe-area-inset-bottom, 24px));
  max-height: 90dvh; overflow-y: auto;
  animation: none !important;
}
.btq-modal.open { transform: translateX(-50%) translateY(0); }
.btq-modal-handle {
  width: 36px; height: 4px; background: #e2e6f2; border-radius: 2px; margin: 14px auto 20px;
}
.btq-modal-title { font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; letter-spacing: -.02em; margin-bottom: 4px; }
.btq-modal-sub   { font: 500 13px/1.4 'Inter', sans-serif; color: #64748b; margin-bottom: 20px; }

/* Confirm vis */
.btq-confirm-vis {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; background: #f8f9fc;
  border: 1.5px solid #e2e6f2; border-radius: 16px; margin-bottom: 14px;
}
.btq-confirm-thumb {
  width: 56px; height: 56px; border-radius: 12px;
  overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
}
.btq-confirm-thumb img { width: 100%; height: 100%; object-fit: cover; }
.btq-confirm-name  { font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; }
.btq-confirm-price { font: 600 13px/1 'IBM Plex Mono', monospace; color: #6366f1; margin-top: 6px; }

/* Balance row */
.btq-balance-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px; background: rgba(99,102,241,.05);
  border-radius: 12px; margin-bottom: 8px;
  font: 500 12px/1 'Inter', sans-serif; color: #64748b;
}
.btq-balance-val { font: 700 14px/1 'IBM Plex Mono', monospace; color: #0a0d1a; }
.btq-balance-val.after { color: #6366f1; }
.btq-balance-val.insufficient { color: #ef4444; }

/* Actions */
.btq-modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.btq-modal-cancel {
  flex: 1; padding: 14px; border: 1.5px solid #e2e6f2; border-radius: 14px;
  background: #fff; color: #64748b; cursor: pointer; min-height: 52px;
  font: 600 14px/1 'Plus Jakarta Sans', sans-serif;
  transition: background .12s; -webkit-tap-highlight-color: transparent;
}
.btq-modal-cancel:active { background: #f8f9fc; }
.btq-modal-buy {
  flex: 2; padding: 14px; border: 0; border-radius: 14px; min-height: 52px;
  background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
  transition: opacity .15s, transform .15s cubic-bezier(.23,1,.32,1);
  -webkit-tap-highlight-color: transparent;
}
.btq-modal-buy:active { transform: scale(.98); }
.btq-modal-buy:disabled { opacity: .5; cursor: default; transform: none; }

/* Earn gems rows */
.btq-earn-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; background: #f8f9fc; border: 1.5px solid #e2e6f2;
  border-radius: 14px; margin-bottom: 8px; cursor: pointer;
  transition: border-color .12s; -webkit-tap-highlight-color: transparent;
}
.btq-earn-item[data-route]:hover { border-color: rgba(99,102,241,.3); }
.btq-earn-item:active { background: rgba(99,102,241,.04); }
.btq-earn-ico {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(99,102,241,.1);
}
.btq-earn-label { font: 600 13px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; }
.btq-earn-sub   { font: 500 11px/1.3 'Inter', sans-serif; color: #94a3b8; margin-top: 2px; }
.btq-earn-reward { font: 700 12px/1 'IBM Plex Mono', monospace; color: #6366f1; margin-left: auto; flex-shrink: 0; }

/* Confetti pieces */
.btq-confetti {
  position: fixed; width: 8px; height: 8px; border-radius: 50%;
  pointer-events: none; z-index: 9999;
  transition: transform .7s cubic-bezier(.23,1,.32,1), opacity .7s ease;
}

@media (prefers-reduced-motion: reduce) {
  .btq-card { animation: none; }
  .btq-card--legendary .btq-card-vis::after,
  .btq-skel-card, .btq-skel-bar { animation: none; }
  .btq-modal { transition: none; }
  .btq-confetti { display: none; }
}
</style>`;

// ─── Skeleton ────────────────────────────────────────────────────
const SKELETON = `${STYLE}
<div class="btq-hd-wrap">
  <div class="btq-hd-inner">
    <div style="width:40px;height:40px;border-radius:12px;background:#f0f2f8"></div>
    <div style="width:80px;height:16px;border-radius:8px;background:#f0f2f8"></div>
    <div style="width:70px;height:34px;border-radius:20px;background:#f0f2f8"></div>
  </div>
</div>
<div class="btq">
  ${[0,1,2].map(() => `
    <div class="btq-sec">
      <div class="btq-skel-bar" style="width:100px"></div>
      <div class="btq-scroll">
        ${[0,1,2,3].map(() => `<div class="btq-skel-card"></div>`).join('')}
      </div>
    </div>
  `).join('')}
</div>`;

// ─── Data ─────────────────────────────────────────────────────────
async function loadData(meId) {
  const [profileRes, catalogRes] = await Promise.allSettled([
    sb.from('profiles').select('gemmes').eq('id', meId).maybeSingle(),
    sb.rpc('get_items_catalog'),
  ]);

  const gemmes  = profileRes.value?.data?.gemmes ?? 0;
  const raw     = catalogRes.value?.data;
  const catalog = Array.isArray(raw) && !raw?.error ? raw : [];

  return { gemmes, catalog };
}

// ─── Render ───────────────────────────────────────────────────────
function renderPage(data) {
  const byType = {};
  for (const item of data.catalog) {
    if (!byType[item.type]) byType[item.type] = [];
    byType[item.type].push(item);
  }

  return `${STYLE}
<div class="btq-hd-wrap">
  <div class="btq-hd-inner">
    <button class="btq-back" id="btq-back" aria-label="Retour">
      ${icon('arrow-left', { size: 20 })}
    </button>
    <span class="btq-hd-title">Boutique</span>
    <button class="btq-gems-pill" id="btq-gems-pill" aria-label="Mes gemmes">
      <span aria-hidden="true">💎</span>
      <span class="btq-gems-num" id="btq-gems-num" aria-live="polite">0</span>
    </button>
  </div>
</div>

<div class="btq anim-slide-up">
  ${SECTIONS.map(sec => renderSection(sec, byType[sec.type] || [])).join('')}
</div>

<!-- Overlay achat -->
<div class="btq-modal-bg" id="btq-buy-bg"></div>
<div class="btq-modal" id="btq-buy-modal" role="dialog" aria-label="Confirmation d'achat">
  <div class="btq-modal-handle"></div>
  <div id="btq-buy-body"></div>
</div>

<!-- Overlay gain gemmes -->
<div class="btq-modal-bg" id="btq-earn-bg"></div>
<div class="btq-modal" id="btq-earn-modal" role="dialog" aria-label="Comment gagner des gemmes">
  <div class="btq-modal-handle"></div>
  <div class="btq-modal-title">Gagne des 💎 gemmes</div>
  <div class="btq-modal-sub">Chaque bonne action dans l'app t'en rapporte</div>
  ${EARN_WAYS.map(w => `
    <div class="btq-earn-item" ${w.route ? `data-route="${esc(w.route)}"` : ''} role="${w.route ? 'button' : 'article'}" ${w.route ? 'tabindex="0"' : ''}>
      <div class="btq-earn-ico">${icon(w.ico, { size: 18, color: '#6366f1' })}</div>
      <div>
        <div class="btq-earn-label">${esc(w.label)}</div>
        <div class="btq-earn-sub">${esc(w.sub)}</div>
      </div>
      <div class="btq-earn-reward">${esc(w.reward)}</div>
    </div>
  `).join('')}
  <button class="btq-modal-cancel" id="btq-earn-close" style="width:100%;margin-top:12px">Fermer</button>
</div>`;
}

function renderSection(sec, items) {
  const ownedCount = items.filter(i => i.owned).length;
  return `
<div class="btq-sec">
  <div class="btq-sec-hd">
    <span aria-hidden="true">${sec.emoji}</span>
    <span class="btq-sec-title">${esc(sec.label)}</span>
    ${items.length > 0 ? `<span class="btq-sec-count">${ownedCount}/${items.length}</span>` : ''}
  </div>
  <div class="btq-scroll" role="list">
    ${items.length === 0
      ? `<div class="btq-empty"><div class="btq-empty-txt">Plus d'items bientôt 👀</div></div>`
      : items.map(renderCard).join('')
    }
  </div>
</div>`;
}

function renderCard(item) {
  const r        = RARITY[item.rarity] || RARITY.common;
  const rarCls   = `btq-card--${item.rarity || 'common'}`;
  const ownedCls = item.owned ? 'btq-card--owned' : '';
  const fallbackBg = item.display_color || 'linear-gradient(135deg,#6366f1,#8b5cf6)';

  const visual = item.asset_url
    ? `<img src="${esc(item.asset_url)}" alt="" loading="lazy" width="140" height="100" />`
    : `<div class="btq-card-vis-fallback" style="background:${fallbackBg}">${TYPE_ICO[item.type] || '✨'}</div>`;

  return `
<div class="btq-card ${rarCls} ${ownedCls}"
     data-item-id="${esc(String(item.id))}"
     role="listitem" tabindex="${item.owned ? '-1' : '0'}"
     aria-label="${esc(item.name)}${item.owned ? ' — possédé' : ` — ${item.price_gems} gemmes`}"
     style="border-color:${r.border};background:${r.bg}">
  <div class="btq-card-vis">
    ${visual}
    ${item.owned ? `<div class="btq-owned-badge">${icon('check', { size: 9, strokeWidth: 3 })} Possédé</div>` : ''}
  </div>
  <div class="btq-card-bd">
    <div class="btq-card-name">${esc(item.name)}</div>
    <div class="btq-card-footer">
      <span class="btq-rarity" style="background:${r.bg};color:${r.color};border:1px solid ${r.border}">${esc(r.label)}</span>
      ${!item.owned ? `<span class="btq-price">${item.price_gems}💎</span>` : ''}
    </div>
  </div>
</div>`;
}

// ─── Wire ─────────────────────────────────────────────────────────
function wire(root, me, data) {
  const catalogMap = new Map(data.catalog.map(i => [String(i.id), i]));

  // ── Back
  root.querySelector('#btq-back')?.addEventListener('click', () => {
    track('boutique.back', {});
    history.back();
  });

  // ── Count-up gemmes
  const gemsEl = root.querySelector('#btq-gems-num');
  if (gemsEl) countUp(gemsEl, 0, data.gemmes, 650);

  // ── Earn gems modal
  const earnBg    = root.querySelector('#btq-earn-bg');
  const earnModal = root.querySelector('#btq-earn-modal');
  const openEarn  = () => { earnModal?.classList.add('open'); earnBg?.classList.add('open'); track('boutique.earn_opened', {}); };
  const closeEarn = () => { earnModal?.classList.remove('open'); earnBg?.classList.remove('open'); };

  root.querySelector('#btq-gems-pill')?.addEventListener('click', openEarn);
  earnBg?.addEventListener('click', closeEarn);
  root.querySelector('#btq-earn-close')?.addEventListener('click', closeEarn);
  root.querySelectorAll('.btq-earn-item[data-route]').forEach(el => {
    const go = () => { closeEarn(); navigate(el.dataset.route); };
    el.addEventListener('click', go);
    el.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  });

  // ── Purchase modal
  const buyBg    = root.querySelector('#btq-buy-bg');
  const buyModal = root.querySelector('#btq-buy-modal');
  const buyBody  = root.querySelector('#btq-buy-body');
  let   _item    = null;

  const openBuy = (item) => {
    _item = item;
    const r       = RARITY[item.rarity] || RARITY.common;
    const after   = data.gemmes - item.price_gems;
    const enough  = after >= 0;
    const fallbk  = item.display_color || 'linear-gradient(135deg,#6366f1,#8b5cf6)';
    const thumb   = item.asset_url
      ? `<div class="btq-confirm-thumb"><img src="${esc(item.asset_url)}" alt="" /></div>`
      : `<div class="btq-confirm-thumb" style="background:${fallbk}">${TYPE_ICO[item.type] || '✨'}</div>`;

    buyBody.innerHTML = `
      <div class="btq-modal-title">Acheter cet item ?</div>
      <div class="btq-confirm-vis">
        ${thumb}
        <div>
          <div class="btq-confirm-name">${esc(item.name)}</div>
          <div style="margin-top:6px">
            <span class="btq-rarity" style="background:${r.bg};color:${r.color};border:1px solid ${r.border}">${esc(r.label)}</span>
          </div>
          <div class="btq-confirm-price">${item.price_gems} 💎</div>
        </div>
      </div>
      <div class="btq-balance-row">
        <span>Solde actuel</span>
        <span class="btq-balance-val">💎 ${data.gemmes}</span>
      </div>
      <div class="btq-balance-row">
        <span>Après achat</span>
        <span class="btq-balance-val ${enough ? 'after' : 'insufficient'}">💎 ${Math.max(0, after)}</span>
      </div>
      <div class="btq-modal-actions">
        <button class="btq-modal-cancel" id="btq-buy-cancel">Annuler</button>
        <button class="btq-modal-buy" id="btq-buy-confirm" ${enough ? '' : 'disabled'}>
          ${enough ? `Acheter · ${item.price_gems} 💎` : 'Pas assez de 💎'}
        </button>
      </div>`;

    root.querySelector('#btq-buy-cancel')?.addEventListener('click', closeBuy);
    root.querySelector('#btq-buy-confirm')?.addEventListener('click', () => doPurchase(item));
    buyModal?.classList.add('open');
    buyBg?.classList.add('open');
    track('boutique.confirm_opened', { item_id: item.id, type: item.type });
  };

  const closeBuy = () => {
    buyModal?.classList.remove('open');
    buyBg?.classList.remove('open');
    _item = null;
  };

  buyBg?.addEventListener('click', closeBuy);

  const doPurchase = async (item) => {
    const btn = root.querySelector('#btq-buy-confirm');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Achat en cours…';

    try {
      const { data: res, error } = await sb.rpc('purchase_item', { item_id: item.id });

      if (error || res?.error) {
        const code = res?.error;
        if (code === 'insufficient_gemmes') {
          toast(`Pas assez de gemmes — requis : ${res.required}, tu en as : ${res.current}`, 'error');
        } else {
          toast('Achat impossible pour le moment', 'error');
        }
        btn.disabled = false;
        btn.textContent = `Acheter · ${item.price_gems} 💎`;
        return;
      }

      // Mise à jour état local
      const newBalance = res?.new_balance ?? (data.gemmes - item.price_gems);
      data.gemmes = Math.max(0, newBalance);
      const catalogItem = catalogMap.get(String(item.id));
      if (catalogItem) catalogItem.owned = true;

      // MAJ balance header
      if (gemsEl) countUp(gemsEl, parseInt(gemsEl.textContent) || 0, data.gemmes, 400);

      closeBuy();

      // Confetti + feedback visuel sur la card
      const card = root.querySelector(`.btq-card[data-item-id="${CSS.escape(String(item.id))}"]`);
      if (card) {
        launchConfetti(card);
        card.classList.add('btq-card--owned', 'btq-card--just-bought');
        setTimeout(() => card.classList.remove('btq-card--just-bought'), 1050);
        // Overlay ✓
        const vis = card.querySelector('.btq-card-vis');
        if (vis && !vis.querySelector('.btq-owned-badge')) {
          const badge = document.createElement('div');
          badge.className = 'btq-owned-badge';
          badge.innerHTML = `${icon('check', { size: 9, strokeWidth: 3 })} Possédé`;
          vis.appendChild(badge);
        }
        vis?.style && (vis.style.opacity = '.55');
        card.querySelector('.btq-price')?.remove();
        card.removeAttribute('tabindex');
        // Retirer les handlers de clic
        card.replaceWith(card.cloneNode(true));
      }

      track('boutique.purchased', { item_id: item.id, type: item.type, price: item.price_gems });
      toast(`${esc(item.name)} débloqué ! 🎉`, 'success');

    } catch (e) {
      console.error('[boutique] purchase error', e);
      toast('Erreur lors de l\'achat', 'error');
      btn.disabled = false;
      btn.textContent = `Acheter · ${item.price_gems} 💎`;
    }
  };

  // ── Wire cards
  root.querySelectorAll('.btq-card:not(.btq-card--owned)').forEach(card => {
    const item = catalogMap.get(card.dataset.itemId);
    if (!item) return;
    const handler = () => openBuy(item);
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────
function countUp(el, from, to, duration) {
  if (from === to) { el.textContent = to; return; }
  const start = performance.now();
  const step  = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = Math.round(from + (to - from) * e);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function launchConfetti(anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;

  for (let i = 0; i < 12; i++) {
    const el    = document.createElement('div');
    el.className = 'btq-confetti';
    const angle = (i / 12) * 360;
    const dist  = 55 + Math.random() * 35;
    const dx    = Math.cos(angle * Math.PI / 180) * dist;
    const dy    = Math.sin(angle * Math.PI / 180) * dist;
    el.style.cssText = `
      left:${cx}px; top:${cy}px;
      background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};
      transform: translate(-50%,-50%);
      opacity: 1;
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`;
      el.style.opacity   = '0';
    }));
    setTimeout(() => el.remove(), 750);
  }
}

// ─── Mount ────────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page.view', { page: 'eleve_boutique', user_role: me.role });

  root.innerHTML = SKELETON;

  try {
    const data = await loadData(me.id);
    root.innerHTML = renderPage(data);
    wire(root, me, data);
  } catch (e) {
    console.error('[boutique]', e);
    root.innerHTML = `
<div style="padding:60px 24px;text-align:center;font-family:'Inter',sans-serif;color:#64748b">
  <div style="font-size:40px;margin-bottom:16px">🛍️</div>
  <div style="font:700 18px/1.3 'Plus Jakarta Sans',sans-serif;color:#0a0d1a;margin-bottom:8px">Boutique indisponible</div>
  <div style="margin-bottom:24px">Vérifie ta connexion et réessaie.</div>
  <button onclick="location.reload()" style="padding:12px 24px;border:0;background:#6366f1;color:#fff;border-radius:12px;font:700 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;min-height:44px">Recharger</button>
</div>`;
  }
}
