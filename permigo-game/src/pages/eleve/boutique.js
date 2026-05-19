// ═══════════════════════════════════════════════════════════════
// Élève — Boutique (Supercell ADN)
// RPCs : get_items_catalog() · purchase_item(p_item_id)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { toast } from '@/components/toast.js';
import { haptic } from '@/utils/haptic.js';

const TABS = [
  { key: 'avatar',    label: 'Avatars',  emoji: '🧑' },
  { key: 'theme',     label: 'Thèmes',   emoji: '🎨' },
  { key: 'permis_bg', label: 'Fonds',    emoji: '🖼' },
];

const RARITY_META = {
  commun:     { label: 'Commun',     border: '#64748b', glow: 'none',                                                  badge: '#475569' },
  rare:       { label: 'Rare',       border: '#3b82f6', glow: '0 0 12px rgba(59,130,246,.4)',                          badge: '#1d4ed8' },
  epique:     { label: 'Épique',     border: '#8b5cf6', glow: '0 0 16px rgba(139,92,246,.5)',                          badge: '#6d28d9' },
  legendaire: { label: 'Légendaire', border: '#fbbf24', glow: '0 0 20px rgba(251,191,36,.6), 0 0 0 1px rgba(251,191,36,.3)', badge: '#b45309' },
};

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
.bo2 {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 100px;
  background: var(--bg);
  min-height: 100dvh;
  font-family: 'Inter', sans-serif;
}

/* ── Skeleton ── */
.bo2-skel {
  background: linear-gradient(90deg, var(--bg2) 0%, var(--bo) 50%, var(--bg2) 100%);
  background-size: 200% 100%;
  animation: bo2Shim 1.4s ease-in-out infinite;
  border-radius: 16px;
}
@keyframes bo2Shim { from{background-position:200% 0} to{background-position:-200% 0} }

/* ── Sticky header ── */
.bo2-hd {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 20;
  background: linear-gradient(160deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%);
  padding: 14px 20px 0;
  overflow: hidden;
}
.bo2-hd::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 70% at 90% 20%, rgba(167,139,250,.3) 0%, transparent 55%);
  pointer-events: none;
}
.bo2-hd-row {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.bo2-hd-title {
  font: 800 22px/1.1 'Plus Jakarta Sans', sans-serif;
  color: #fff; letter-spacing: -.03em;
}
.bo2-gems {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 99px; padding: 7px 14px;
  position: relative; overflow: hidden;
}
.bo2-gems-ico { font-size: 16px; line-height: 1; }
.bo2-gems-val {
  font: 800 15px/1 'IBM Plex Mono', monospace;
  color: #fff; letter-spacing: -.02em;
  transition: transform .2s;
}
.bo2-gems-float {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  font: 700 13px/1 'IBM Plex Mono', monospace;
  color: #fde68a; pointer-events: none; opacity: 0;
  animation: bo2Float .8s ease-out both;
}
@keyframes bo2Float {
  0%  { opacity: 1; transform: translateY(0); }
  100%{ opacity: 0; transform: translateY(-20px); }
}

/* ── Tabs ── */
.bo2-tabs {
  position: relative; z-index: 1;
  display: flex; gap: 0;
}
.bo2-tab {
  flex: 1; padding: 10px 8px;
  background: none; border: none;
  font: 600 12px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.55);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  border-bottom: 2.5px solid transparent;
  transition: color .15s, border-color .15s;
  font-family: inherit;
  white-space: nowrap;
}
.bo2-tab.active { color: #fff; border-bottom-color: #fff; }

/* ── Grid ── */
.bo2-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px; padding: 16px 12px 0;
}

/* ── Item card ── */
.bo2-card {
  background: var(--su);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: transform .14s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
  user-select: none;
  position: relative;
}
.bo2-card:active { transform: scale(.95); }
.bo2-card.owned { opacity: .8; }

/* Rarity border (applied via JS inline style) */

/* Preview area */
.bo2-card-preview {
  height: 110px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  background: var(--bg);
  transition: transform .3s cubic-bezier(.23,1,.32,1);
}
.bo2-card:active .bo2-card-preview { transform: perspective(400px) rotateY(4deg) scale(.98); }
.bo2-card-preview-circle {
  width: 68px; height: 68px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
}
.bo2-card-preview img {
  width: 72px; height: 72px; object-fit: contain;
  transition: transform .3s cubic-bezier(.34,1.56,.64,1);
}
.bo2-card:active .bo2-card-preview img { transform: scale(1.08) rotate(3deg); }

/* "DÉBLOQUÉ" banner */
.bo2-card-owned-badge {
  position: absolute; top: 8px; right: 8px;
  background: rgba(16,185,129,.9); border-radius: 99px;
  padding: 3px 8px;
  font: 700 9px/1 'IBM Plex Mono', monospace;
  color: #fff; letter-spacing: .04em; text-transform: uppercase;
}

/* Info area */
.bo2-card-info {
  padding: 10px 12px 12px;
}
.bo2-card-name {
  font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); letter-spacing: -.01em;
  margin-bottom: 4px;
}
.bo2-card-desc {
  font: 500 11px/1.4 'Inter', sans-serif;
  color: var(--mu2); margin-bottom: 10px;
}
.bo2-card-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.bo2-rarity-pill {
  font: 700 9px/1 'IBM Plex Mono', monospace;
  letter-spacing: .05em; text-transform: uppercase;
  padding: 3px 7px; border-radius: 99px; color: #fff;
}
.bo2-price-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none; border-radius: 10px;
  color: #fff; font: 700 12px/1 'IBM Plex Mono', monospace;
  cursor: pointer; min-height: 32px;
  transition: transform .12s, opacity .12s;
  -webkit-tap-highlight-color: transparent;
}
.bo2-price-btn:active { transform: scale(.95); opacity: .9; }
.bo2-price-btn:disabled { opacity: .5; cursor: default; }
.bo2-price-btn.can-afford { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.bo2-price-btn.cant-afford { background: var(--bg2); color: var(--mu2); }
.bo2-owned-txt {
  font: 700 11px/1 'IBM Plex Mono', monospace;
  color: #10b981; padding: 7px 0;
}

/* ── Purchase modal ── */
.bo2-modal-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 500; display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
  animation: bo2FadeBg .2s ease both;
}
@keyframes bo2FadeBg { from{opacity:0} to{opacity:1} }
.bo2-modal {
  width: 100%; max-width: 480px; background: var(--su);
  border-radius: 28px 28px 0 0; padding: 0 0 24px;
  animation: bo2ModalUp .28s cubic-bezier(.32,.72,0,1) both;
}
@keyframes bo2ModalUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
.bo2-modal-handle { width: 36px; height: 4px; background: var(--bo); border-radius: 2px; margin: 14px auto 20px; }
.bo2-modal-preview {
  height: 130px; display: flex; align-items: center; justify-content: center;
  margin: 0 20px; border-radius: 20px; background: var(--bg); overflow: hidden;
  margin-bottom: 20px;
}
.bo2-modal-preview-circle {
  width: 80px; height: 80px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px;
}
.bo2-modal-preview img { width: 80px; height: 80px; object-fit: contain; }
.bo2-modal-body { padding: 0 20px; }
.bo2-modal-name {
  font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); letter-spacing: -.025em; margin-bottom: 6px;
}
.bo2-modal-desc { font: 500 14px/1.5 'Inter', sans-serif; color: var(--mu); margin-bottom: 16px; }
.bo2-modal-cost {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; background: var(--bg); border-radius: 16px; margin-bottom: 8px;
}
.bo2-modal-cost-lbl { font: 600 13px/1 'Inter', sans-serif; color: var(--mu); }
.bo2-modal-cost-val { font: 800 18px/1 'IBM Plex Mono', monospace; color: var(--ink); }
.bo2-modal-balance {
  font: 500 12px/1 'Inter', sans-serif;
  color: var(--mu2); text-align: center; margin-bottom: 20px;
}
.bo2-modal-buy {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: calc(100% - 40px); margin: 0 20px;
  padding: 16px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none; border-radius: 16px; color: #fff;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; min-height: 54px; box-shadow: 0 8px 24px -6px rgba(99,102,241,.45);
  transition: transform .14s cubic-bezier(.34,1.56,.64,1), opacity .12s;
}
.bo2-modal-buy:active { transform: scale(.97); opacity: .9; }
.bo2-modal-buy:disabled { opacity: .5; cursor: default; }
.bo2-modal-cancel {
  display: block; width: calc(100% - 40px); margin: 8px 20px 0;
  padding: 13px; background: none; border: none;
  color: var(--mu); font: 600 13px/1 'Inter', sans-serif;
  cursor: pointer;
}
@keyframes bo2CardIn {
  from { opacity: 0; transform: translateY(14px) scale(.93); }
  to   { opacity: 1; transform: none; }
}
</style>`;

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track('page.view', { page: 'boutique' });

  root.innerHTML = `${STYLE}
<div class="bo2 anim-slide-up">
  <div class="bo2-hd">
    <div class="bo2-hd-row">
      <div class="bo2-hd-title">Boutique</div>
      <div class="bo2-gems" id="bo2-gems-badge">
        <span class="bo2-gems-ico">💎</span>
        <span class="bo2-gems-val" id="bo2-gems-val">…</span>
      </div>
    </div>
    <div class="bo2-tabs" id="bo2-tabs">
      ${TABS.map((t, i) => `
        <button class="bo2-tab ${i === 0 ? 'active' : ''}" data-tab="${esc(t.key)}">${t.emoji} ${esc(t.label)}</button>
      `).join('')}
    </div>
  </div>
  <div id="bo2-content">
    <div class="bo2-grid">
      ${[...Array(4)].map(() => `<div class="bo2-skel" style="height:200px"></div>`).join('')}
    </div>
  </div>
</div>`;

  // Fetch profile + all items in parallel
  const [profileRes, itemsRes] = await Promise.allSettled([
    sb.from('profiles').select('gemmes').eq('id', me.id).maybeSingle(),
    sb.rpc('get_items_catalog'),
  ]);

  let gemmes = profileRes.value?.data?.gemmes ?? 0;
  const allItems = itemsRes.value?.data ?? [];

  const gemsVal = root.querySelector('#bo2-gems-val');
  if (gemsVal) gemsVal.textContent = gemmes;

  let activeTab = TABS[0].key;

  function renderTab(tabKey) {
    const items = allItems.filter(i => i.type === tabKey);
    const content = root.querySelector('#bo2-content');
    if (!content) return;

    if (!items.length) {
      content.innerHTML = `
        <div style="text-align:center;padding:56px 24px;color:var(--mu)">
          <div style="font-size:48px;margin-bottom:12px">🛒</div>
          <div style="font:700 16px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:6px">Bientôt disponible</div>
          <div style="font:500 13px/1.5 'Inter',sans-serif">Ces items arrivent dans la prochaine mise à jour !</div>
        </div>`;
      return;
    }

    content.innerHTML = `<div class="bo2-grid">
      ${items.map((item, idx) => renderCard(item, gemmes, idx)).join('')}
    </div>`;

    content.querySelectorAll('.bo2-card').forEach(el => {
      el.addEventListener('click', () => {
        haptic('select');
        const itemId = el.dataset.itemId;
        const item = allItems.find(i => i.id === itemId);
        if (!item) return;
        if (item.owned) {
          toast('Déjà dans ton inventaire 🎒', 'info');
          return;
        }
        showPurchaseModal(item, gemmes, async () => {
          const result = await doPurchase(item, root, allItems);
          if (result?.ok) {
            gemmes = result.new_balance;
            // Update items owned state
            const target = allItems.find(i => i.id === item.id);
            if (target) { target.owned = true; target.acquired_at = new Date().toISOString(); }
            // Refresh gem display + float animation
            const gv = root.querySelector('#bo2-gems-val');
            if (gv) gv.textContent = gemmes;
            showGemsFloat(root, `-${item.cost_gemmes}`);
            renderTab(activeTab);
          }
        });
      });
    });

    // Buy button direct tap (stops propagation to card)
    content.querySelectorAll('.bo2-price-btn:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        haptic('select');
        const card = btn.closest('.bo2-card');
        const itemId = card?.dataset.itemId;
        const item = allItems.find(i => i.id === itemId);
        if (!item || item.owned) return;
        showPurchaseModal(item, gemmes, async () => {
          const result = await doPurchase(item, root, allItems);
          if (result?.ok) {
            gemmes = result.new_balance;
            const target = allItems.find(i => i.id === item.id);
            if (target) { target.owned = true; }
            const gv = root.querySelector('#bo2-gems-val');
            if (gv) gv.textContent = gemmes;
            showGemsFloat(root, `-${item.cost_gemmes}`);
            renderTab(activeTab);
          }
        });
      });
    });
  }

  renderTab(activeTab);

  // Tab switching
  root.querySelector('#bo2-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.bo2-tab');
    if (!btn) return;
    haptic('tap');
    const tabKey = btn.dataset.tab;
    activeTab = tabKey;
    root.querySelectorAll('.bo2-tab').forEach(b => b.classList.toggle('active', b === btn));
    root.querySelector('#bo2-content').innerHTML = `<div class="bo2-grid">${[...Array(4)].map(() => `<div class="bo2-skel" style="height:200px"></div>`).join('')}</div>`;
    requestAnimationFrame(() => renderTab(tabKey));
    track('boutique.tab_changed', { tab: tabKey });
  });
}

// ─── Card renderer ────────────────────────────────────────────
function renderCard(item, gemmes, idx) {
  const rm = RARITY_META[item.rarity] ?? RARITY_META.commun;
  const canAfford = gemmes >= item.cost_gemmes;
  const borderStyle = `border: 1.5px solid ${rm.border}; box-shadow: ${rm.glow};`;
  const color = item.display_color || '#6366f1';
  const imgUrl = item.asset_url || item.image_url || null;

  const preview = imgUrl
    ? `<img src="${esc(imgUrl)}" alt="${esc(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      + `<div class="bo2-card-preview-circle" style="background:${esc(color)}20;color:${esc(color)};display:none;font-size:36px">${typeEmoji(item.type)}</div>`
    : `<div class="bo2-card-preview-circle" style="background:${esc(color)}20;color:${esc(color)}">${typeEmoji(item.type)}</div>`;

  return `
    <div class="bo2-card ${item.owned ? 'owned' : ''}"
      data-item-id="${esc(item.id)}"
      style="${borderStyle} animation: bo2CardIn .4s ${idx * 60}ms cubic-bezier(.34,1.56,.64,1) both">
      <div class="bo2-card-preview">
        ${preview}
        ${item.owned ? `<div class="bo2-card-owned-badge">✓ Débloqué</div>` : ''}
      </div>
      <div class="bo2-card-info">
        <div class="bo2-card-name">${esc(item.name)}</div>
        <div class="bo2-card-desc">${esc(item.description)}</div>
        <div class="bo2-card-footer">
          <div class="bo2-rarity-pill" style="background:${rm.badge}">${esc(rm.label)}</div>
          ${item.owned
            ? `<div class="bo2-owned-txt">✓ Obtenu</div>`
            : `<button class="bo2-price-btn ${canAfford ? 'can-afford' : 'cant-afford'}" ${!canAfford ? 'disabled' : ''}>
                Acheter · ${item.cost_gemmes} 💎
               </button>`
          }
        </div>
      </div>
    </div>`;
}

function typeEmoji(type) {
  if (type === 'avatar')    return '🧑';
  if (type === 'theme')     return '🎨';
  if (type === 'permis_bg') return '🖼';
  return '🎁';
}

// ─── Gem float animation ──────────────────────────────────────
function showGemsFloat(root, text) {
  const badge = root.querySelector('#bo2-gems-badge');
  if (!badge) return;
  const el = document.createElement('div');
  el.className = 'bo2-gems-float';
  el.textContent = text;
  badge.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ─── Purchase modal ───────────────────────────────────────────
function showPurchaseModal(item, gemmes, onConfirm) {
  const rm = RARITY_META[item.rarity] ?? RARITY_META.commun;
  const afterBalance = gemmes - item.cost_gemmes;
  const canAfford = afterBalance >= 0;
  const color = item.display_color || '#6366f1';
  const imgUrl = item.asset_url || item.image_url || null;

  const preview = imgUrl
    ? `<img src="${esc(imgUrl)}" alt="${esc(item.name)}" loading="lazy">`
    : `<div class="bo2-modal-preview-circle" style="background:${esc(color)}20;color:${esc(color)}">${typeEmoji(item.type)}</div>`;

  const overlay = document.createElement('div');
  overlay.className = 'bo2-modal-bg';
  overlay.innerHTML = `
    <div class="bo2-modal">
      <div class="bo2-modal-handle"></div>
      <div class="bo2-modal-preview" style="border: 1.5px solid ${rm.border}">
        ${preview}
      </div>
      <div class="bo2-modal-body">
        <div class="bo2-modal-name">${esc(item.name)}</div>
        <div class="bo2-modal-desc">${esc(item.description)}</div>
        <div class="bo2-modal-cost">
          <div class="bo2-modal-cost-lbl">Prix</div>
          <div class="bo2-modal-cost-val">💎 ${item.cost_gemmes}</div>
        </div>
        ${canAfford
          ? `<div class="bo2-modal-balance">Il te restera <strong>${afterBalance} 💎</strong> après l'achat</div>`
          : `<div class="bo2-modal-balance" style="color:#ef4444">Pas assez de gemmes — il t'en faut ${item.cost_gemmes - gemmes} de plus</div>`
        }
      </div>
      <button class="bo2-modal-buy" id="bo2-buy-confirm" ${!canAfford ? 'disabled' : ''}>
        ${canAfford ? `Acheter pour ${item.cost_gemmes} 💎` : 'Pas assez de gemmes'}
      </button>
      <button class="bo2-modal-cancel" id="bo2-buy-cancel">Annuler</button>
    </div>`;

  document.body.appendChild(overlay);
  track('boutique.purchase_modal_opened', { item_id: item.id });

  overlay.querySelector('#bo2-buy-cancel')?.addEventListener('click', () => { haptic('select'); overlay.remove(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) { haptic('select'); overlay.remove(); } });

  if (canAfford) {
    overlay.querySelector('#bo2-buy-confirm')?.addEventListener('click', async () => {
      overlay.remove();
      await onConfirm();
    });
  }
}

// ─── Execute purchase ─────────────────────────────────────────
async function doPurchase(item, root, allItems) {
  try {
    const { data, error } = await sb.rpc('purchase_item', { p_item_id: item.id });
    if (error) { toast('Erreur lors de l\'achat', 'error'); return null; }
    if (data?.error === 'insufficient_gemmes') { toast('Pas assez de gemmes 💎', 'error'); return null; }
    if (data?.error === 'already_owned')       { toast('Déjà dans ton inventaire', 'info'); return null; }
    if (data?.error)                           { toast('Achat impossible', 'error'); return null; }
    haptic('success');
    toast(`🎁 ${item.name} débloqué !`, 'success', 3000);
    track('boutique.item_purchased', { item_id: item.id, cost: item.cost_gemmes });
    return data;
  } catch (e) {
    console.error('[boutique] purchase', e);
    toast('Erreur lors de l\'achat', 'error');
    return null;
  }
}
