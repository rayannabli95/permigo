// ═══════════════════════════════════════════════════════════════
// Élève — Boutique (refonte "skins voiture" néon)
// RPCs : get_items_catalog() · purchase_item(p_item_id)
// Onglets : Skins (avatars = voitures) · Autres (thèmes + fonds permis)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { icon } from '@/utils/icons.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { toast } from '@/components/common/toast.js';
import { haptic } from '@/utils/haptic.js';
import { equipItem, unequipItem, setEquippedAsset, getEquipped, getEquippedAsset } from '@/utils/game-state.js';
import { enableSheetSwipe } from '@/utils/sheet-swipe.js';

const TABS = [
  { key: 'skins', label: 'Skins',  emoji: '🚗' },
  { key: 'autres', label: 'Autres', emoji: '🎁' },
];

// Types regroupés sous chaque onglet
const TAB_TYPES = {
  skins:  ['avatar'],
  autres: ['theme', 'permis_bg'],
};

// Néon par rareté — couleurs explicites (indépendantes du thème)
const RARITY_META = {
  commun:     { label: 'Commun',     c: '#3b82f6', order: 0 },
  rare:       { label: 'Rare',       c: '#8b5cf6', order: 1 },
  epique:     { label: 'Épique',     c: '#f97316', order: 2 },
  legendaire: { label: 'Légendaire', c: '#fbbf24', order: 3 },
};
function rm(rarity) { return RARITY_META[rarity] ?? RARITY_META.commun; }

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
.bo2 {
  max-width: 480px; margin: 0 auto; padding: 0 0 100px;
  background: var(--bg); min-height: 100dvh; font-family: 'Inter', sans-serif;
}

/* ── Skeleton ── */
.bo2-skel {
  background: linear-gradient(90deg, var(--bg2) 0%, var(--bo) 50%, var(--bg2) 100%);
  background-size: 200% 100%; animation: bo2Shim 1.4s ease-in-out infinite; border-radius: 18px;
}
@keyframes bo2Shim { from{background-position:200% 0} to{background-position:-200% 0} }

/* ── Sticky header ── */
.bo2-hd {
  position: sticky; top: calc(52px + env(safe-area-inset-top, 0px)); z-index: 20;
  background: linear-gradient(160deg, #1e1b4b 0%, #312e81 60%, var(--adk) 100%);
  padding: 14px 20px 0; overflow: hidden;
}
.bo2-hd::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 70% at 90% 20%, rgba(167,139,250,.3) 0%, transparent 55%);
  pointer-events: none;
}
.bo2-hd-row {
  position: relative; z-index: 1; display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 14px;
}
.bo2-hd-title { font: 800 22px/1.1 'Plus Jakarta Sans', sans-serif; color: #fff; letter-spacing: -.03em; }
.bo2-gems {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
  border-radius: 99px; padding: 7px 14px; position: relative; overflow: hidden;
}
.bo2-gems-ico { font-size: 16px; line-height: 1; }
.bo2-gems-val { font: 800 15px/1 'IBM Plex Mono', monospace; color: #fff; letter-spacing: -.02em; }
.bo2-gems-float {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  font: 700 13px/1 'IBM Plex Mono', monospace; color: var(--aml); pointer-events: none;
  opacity: 0; animation: bo2Float .8s ease-out both;
}
@keyframes bo2Float { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-20px)} }

/* ── Tabs ── */
.bo2-tabs { position: relative; z-index: 1; display: flex; gap: 8px; padding-bottom: 14px; }
.bo2-tab {
  flex: 1; padding: 9px 8px; border-radius: 12px;
  background: rgba(255,255,255,.06); border: 1px solid transparent;
  font: 700 13px/1 'Inter', sans-serif; color: rgba(255,255,255,.6);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: color .15s, background .15s, border-color .15s; font-family: inherit; white-space: nowrap;
}
.bo2-tab.active { color: #1e1b4b; background: #fff; border-color: #fff; }

/* ── Section heading ── */
.bo2-sec {
  padding: 18px 20px 4px;
}
.bo2-sec-title { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.02em; }
.bo2-sec-sub { font: 500 12.5px/1.4 'Inter', sans-serif; color: var(--mu2); margin-top: 2px; }

/* ── Skin list (voitures) ── */
.bo2-list { display: flex; flex-direction: column; gap: 12px; padding: 12px 16px 0; }
.bo2-skin {
  display: flex; align-items: center; gap: 14px; padding: 13px 14px;
  border-radius: 20px; background: var(--su); position: relative;
  cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none;
  transition: transform .14s cubic-bezier(.34,1.56,.64,1);
}
.bo2-skin:active { transform: scale(.98); }
.bo2-skin-thumb {
  width: 66px; height: 66px; border-radius: 16px; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center; position: relative;
}
.bo2-skin-thumb img { width: 100%; height: 100%; object-fit: cover; }
.bo2-skin-thumb .bo2-fallback { font-size: 30px; }
.bo2-skin-mid { flex: 1; min-width: 0; }
.bo2-skin-name { font: 800 16px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.02em; }
.bo2-pill {
  display: inline-block; margin-top: 6px;
  font: 800 9.5px/1 'IBM Plex Mono', monospace; letter-spacing: .06em; text-transform: uppercase;
  padding: 4px 8px; border-radius: 99px; color: #fff;
}
.bo2-skin-sub { font: 500 11px/1.3 'Inter', sans-serif; color: var(--gr); margin-top: 5px; }
/* CTA (droite) */
.bo2-cta { flex-shrink: 0; display: flex; align-items: center; }
.bo2-buy {
  display: flex; align-items: center; gap: 5px; padding: 9px 13px; border: none; border-radius: 12px;
  color: #fff; font: 800 13px/1 'IBM Plex Mono', monospace; cursor: pointer; min-height: 44px;
  white-space: nowrap; -webkit-tap-highlight-color: transparent; transition: transform .12s, opacity .12s;
}
.bo2-buy:active { transform: scale(.94); opacity: .9; }
.bo2-lock {
  width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font-size: 17px; color: #fff; flex-shrink: 0;
}
.bo2-check {
  width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: #fff; flex-shrink: 0;
}
.bo2-equip-btn {
  padding: 9px 13px; border: 1.5px solid var(--bo); border-radius: 12px; background: var(--bg2);
  color: var(--ink); font: 700 12px/1 'Inter', sans-serif; cursor: pointer; min-height: 44px;
  white-space: nowrap; -webkit-tap-highlight-color: transparent; transition: transform .12s;
}
.bo2-equip-btn:active { transform: scale(.94); }

/* ── Rarity scale footer ── */
.bo2-scale {
  margin: 22px 16px 0; padding: 16px; border-radius: 20px; background: var(--su);
}
.bo2-scale-title { font: 700 13px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-bottom: 14px; text-align: center; }
.bo2-scale-row { display: flex; justify-content: space-around; gap: 8px; }
.bo2-scale-item { display: flex; flex-direction: column; align-items: center; gap: 7px; flex: 1; }
.bo2-scale-dot {
  width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 17px;
}
.bo2-scale-lbl { font: 700 9.5px/1 'IBM Plex Mono', monospace; text-transform: uppercase; letter-spacing: .03em; }
.bo2-scale-price { font: 600 10px/1 'IBM Plex Mono', monospace; color: var(--mu2); }

/* ── Grid (onglet Autres) ── */
.bo2-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px 16px 0; }
.bo2-card {
  background: var(--su); border-radius: 20px; overflow: hidden; cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: transform .14s cubic-bezier(.34,1.56,.64,1);
  user-select: none; position: relative;
}
.bo2-card:active { transform: scale(.95); }
.bo2-card-preview {
  height: 100px; display: flex; align-items: center; justify-content: center; background: var(--bg); overflow: hidden;
}
.bo2-card-preview img { width: 70px; height: 70px; object-fit: contain; }
.bo2-card-preview-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; }
.bo2-card-owned-badge {
  position: absolute; top: 8px; right: 8px; background: rgba(16,185,129,.9); border-radius: 99px;
  padding: 3px 8px; font: 700 9px/1 'IBM Plex Mono', monospace; color: #fff; letter-spacing: .04em; text-transform: uppercase;
}
.bo2-card-info { padding: 10px 12px 12px; }
.bo2-card-name { font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-bottom: 8px; }
.bo2-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.bo2-price-btn {
  display: flex; align-items: center; gap: 5px; padding: 7px 12px; border: none; border-radius: 10px;
  color: #fff; font: 700 12px/1 'IBM Plex Mono', monospace; cursor: pointer; min-height: 44px;
  white-space: nowrap; flex-shrink: 0; transition: transform .12s, opacity .12s; -webkit-tap-highlight-color: transparent;
}
.bo2-price-btn:active { transform: scale(.95); opacity: .9; }
.bo2-price-btn:disabled { opacity: .5; cursor: default; }
.bo2-price-btn.cant-afford { background: var(--bg2); color: var(--mu2); }
.bo2-owned-txt { font: 700 11px/1 'IBM Plex Mono', monospace; color: var(--gr); padding: 7px 0; }

/* ── Detail modal (skins) ── */
.bo2-modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 500; display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0); animation: bo2FadeBg .2s ease both;
}
@keyframes bo2FadeBg { from{opacity:0} to{opacity:1} }
.bo2-modal {
  width: 100%; max-width: 480px; border-radius: 28px 28px 0 0; padding: 0 0 24px;
  background: linear-gradient(180deg, #1e1b4b 0%, #15122e 100%);
  animation: bo2ModalUp .3s cubic-bezier(.32,.72,0,1) both;
}
@keyframes bo2ModalUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
.bo2-modal-handle { width: 36px; height: 4px; background: rgba(255,255,255,.3); border-radius: 2px; margin: 14px auto 8px; }
.bo2-halo {
  height: 248px; display: flex; align-items: center; justify-content: center; position: relative; padding-top: 10px;
}
.bo2-halo-ring {
  width: 216px; height: 216px; border-radius: 28px; overflow: hidden; display: flex; align-items: center; justify-content: center;
  position: relative;
}
.bo2-halo-ring img { width: 100%; height: 100%; object-fit: cover; position: relative; z-index: 2; }
.bo2-halo-ring .bo2-fallback { font-size: 76px; position: relative; z-index: 2; }
.bo2-modal-body { padding: 4px 24px 0; text-align: center; }
.bo2-modal-pill {
  display: inline-block; font: 800 10px/1 'IBM Plex Mono', monospace; letter-spacing: .08em; text-transform: uppercase;
  padding: 5px 12px; border-radius: 99px; color: #fff; margin-bottom: 10px;
}
.bo2-modal-name { font: 800 26px/1.1 'Plus Jakarta Sans', sans-serif; color: #fff; letter-spacing: -.03em; margin-bottom: 8px; }
.bo2-modal-desc { font: 500 14px/1.5 'Inter', sans-serif; color: rgba(255,255,255,.7); margin-bottom: 18px; max-width: 320px; margin-left: auto; margin-right: auto; }
.bo2-modal-price { margin: 0 24px 18px; padding: 12px 16px; border-radius: 16px; background: rgba(255,255,255,.08); }
.bo2-price-row { display: flex; align-items: center; justify-content: space-between; font: 600 14px/1.3 'Inter', sans-serif; color: #fff; }
.bo2-price-row strong { font: 800 19px/1 'IBM Plex Mono', monospace; }
.bo2-price-row.sub { color: rgba(255,255,255,.6); font-weight: 500; font-size: 13px; margin-top: 8px; }
.bo2-price-row.sub span:last-child { font-family: 'IBM Plex Mono', monospace; }
.bo2-modal-balance { font: 500 12px/1 'Inter', sans-serif; color: rgba(255,255,255,.55); text-align: center; margin: 14px 0 0; }
.bo2-modal-cta {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: calc(100% - 48px); margin: 0 24px; padding: 17px; border: none; border-radius: 99px;
  font: 800 17px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer; min-height: 56px;
  transition: transform .14s cubic-bezier(.34,1.56,.64,1), opacity .12s;
}
.bo2-modal-cta.buy { background: #58cc02; color: #fff; box-shadow: 0 8px 24px -6px rgba(88,204,2,.5); }
.bo2-modal-cta.equip { background: #fff; color: #1e1b4b; }
.bo2-modal-cta.locked { background: rgba(255,255,255,.12); color: rgba(255,255,255,.5); cursor: default; }
.bo2-modal-cta:not(.locked):active { transform: scale(.97); opacity: .9; }
.bo2-modal-cancel {
  display: block; width: calc(100% - 48px); margin: 10px 24px 0; padding: 12px; background: none; border: none;
  color: rgba(255,255,255,.6); font: 600 13px/1 'Inter', sans-serif; cursor: pointer;
}

/* ── Empty / error ── */
.bo2-empty { text-align: center; padding: 56px 24px; color: var(--mu); }
.bo2-empty-ico { font-size: 48px; margin-bottom: 12px; }
.bo2-empty-t { font: 700 16px/1.3 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-bottom: 6px; }
.bo2-empty-d { font: 500 13px/1.5 'Inter', sans-serif; }

@keyframes bo2CardIn { from{opacity:0;transform:translateY(14px) scale(.93)} to{opacity:1;transform:none} }
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important }
}
</style>`;

// Persiste l'avatar équipé dans profiles.avatar_url (slot 'avatar' seulement).
// Sans ça, l'équipement vit en localStorage → invisible du serveur, donc le
// classement affiche toujours l'avatar d'inscription au lieu du skin équipé.
async function syncAvatarUrlToProfile(slot, assetUrl) {
  if (slot !== 'avatar') return;
  const me = getCurUser();
  if (!me) return;
  try {
    await sb.from('profiles').update({ avatar_url: assetUrl || null }).eq('id', me.id);
    me.avatar_url = assetUrl || null;
  } catch (e) { console.warn('[boutique] sync avatar_url failed', e); }
}

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track('page.view', { page: 'boutique' });

  // Réconciliation : un avatar équipé en local mais absent de la base (ancien
  // équipement) → on le pousse dans profiles.avatar_url pour le classement.
  const equippedAv = getEquippedAsset('avatar');
  if (equippedAv && equippedAv !== me.avatar_url) syncAvatarUrlToProfile('avatar', equippedAv);

  root.innerHTML = `${STYLE}
<div class="bo2 anim-slide-up">
  <div class="bo2-hd">
    <div class="bo2-hd-row">
      <h1 class="bo2-hd-title" tabindex="-1">Boutique</h1>
      <div class="bo2-gems" id="bo2-gems-badge">
        <span class="bo2-gems-ico">${icon('gem',{size:13})}</span>
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
    <div class="bo2-list">
      ${[...Array(4)].map(() => `<div class="bo2-skel" style="height:92px"></div>`).join('')}
    </div>
  </div>
</div>`;

  const [profileRes, itemsRes] = await Promise.allSettled([
    sb.from('profiles').select('gemmes').eq('id', me.id).maybeSingle(),
    sb.rpc('get_items_catalog'),
  ]);

  let gemmes = profileRes.value?.data?.gemmes ?? 0;
  const catalogFailed = itemsRes.status === 'rejected' || !!itemsRes.value?.error;
  const allItems = itemsRes.value?.data ?? [];

  const gemsVal = root.querySelector('#bo2-gems-val');
  if (gemsVal) gemsVal.textContent = gemmes;

  let activeTab = TABS[0].key;

  // Source unique du solde après achat.
  function applyPurchase(result, item) {
    if (!result || result.ok === false) return false;
    const fallback = (typeof gemmes === 'number') ? gemmes - item.cost_gemmes : gemmes;
    gemmes = (typeof result.new_balance === 'number') ? result.new_balance : fallback;
    const target = allItems.find(i => i.id === item.id);
    if (target) { target.owned = true; target.acquired_at = new Date().toISOString(); }
    const gv = root.querySelector('#bo2-gems-val');
    if (gv) gv.textContent = gemmes;
    return true;
  }

  function buyFlow(item) {
    showDetailModal(item, gemmes, async () => {
      const result = await doPurchase(item, root, allItems);
      if (applyPurchase(result, item)) {
        showGemsFloat(root, `-${item.cost_gemmes}`);
        renderTab(activeTab);
      }
    });
  }

  function toggleEquip(item) {
    const eq = getEquipped();
    if (eq[item.type] === item.id) {
      unequipItem(item.type);
      setEquippedAsset(item.type, null);
      syncAvatarUrlToProfile(item.type, null);
      toast(`${item.name} retiré`, 'info');
    } else {
      equipItem(item.type, item.id);
      setEquippedAsset(item.type, item.asset_url || null);
      syncAvatarUrlToProfile(item.type, item.asset_url || null);
      toast(`${item.name} équipé ✓`, 'success');
    }
    renderTab(activeTab);
  }

  function renderTab(tabKey) {
    const types = TAB_TYPES[tabKey] || [];
    const items = allItems.filter(i => types.includes(i.type));
    const content = root.querySelector('#bo2-content');
    if (!content) return;

    if (!items.length) {
      content.innerHTML = catalogFailed
        ? `<div class="bo2-empty"><div class="bo2-empty-ico">${icon('alert-circle',{size:30})}</div><div class="bo2-empty-t">Boutique indisponible</div><div class="bo2-empty-d">Vérifie ta connexion et réessaie.</div></div>`
        : `<div class="bo2-empty"><div class="bo2-empty-ico">${icon('shopping-bag',{size:30})}</div><div class="bo2-empty-t">Bientôt disponible</div><div class="bo2-empty-d">Ces items arrivent dans la prochaine mise à jour !</div></div>`;
      return;
    }

    if (tabKey === 'skins') {
      renderSkins(content, items);
    } else {
      renderGrid(content, items);
    }
  }

  // ── Onglet Skins : liste verticale néon ──
  function renderSkins(content, items) {
    const sorted = [...items].sort((a, b) => rm(a.rarity).order - rm(b.rarity).order || a.cost_gemmes - b.cost_gemmes);
    content.innerHTML = `
      <div class="bo2-sec">
        <div class="bo2-sec-title">Skins de profil</div>
        <div class="bo2-sec-sub">Affiche ton style sur PermiGo</div>
      </div>
      <div class="bo2-list">
        ${sorted.map((item, idx) => renderSkinCard(item, gemmes, idx)).join('')}
      </div>
      ${renderRarityScale(sorted)}`;

    content.querySelectorAll('.bo2-skin').forEach(el => {
      el.addEventListener('click', () => {
        haptic('select');
        const item = allItems.find(i => i.id === el.dataset.itemId);
        if (item) buyFlow(item);   // ouvre la fiche détail (achat OU équiper depuis la fiche)
      });
    });
  }

  // ── Onglet Autres : grille (thèmes + fonds) ──
  function renderGrid(content, items) {
    content.innerHTML = `<div class="bo2-grid">
      ${items.map((item, idx) => renderGridCard(item, gemmes, idx)).join('')}
    </div>`;

    content.querySelectorAll('.bo2-card').forEach(el => {
      el.addEventListener('click', () => {
        haptic('select');
        const item = allItems.find(i => i.id === el.dataset.itemId);
        if (!item) return;
        if (item.owned) { toggleEquip(item); return; }
        buyFlow(item);
      });
    });
    content.querySelectorAll('.bo2-price-btn:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        haptic('select');
        const item = allItems.find(i => i.id === btn.closest('.bo2-card')?.dataset.itemId);
        if (item && !item.owned) buyFlow(item);
      });
    });
  }

  renderTab(activeTab);

  root.querySelector('#bo2-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.bo2-tab');
    if (!btn) return;
    haptic('tap');
    activeTab = btn.dataset.tab;
    root.querySelectorAll('.bo2-tab').forEach(b => b.classList.toggle('active', b === btn));
    requestAnimationFrame(() => renderTab(activeTab));
    track('boutique.tab_changed', { tab: activeTab });
  });
}

// ─── Skin card (liste) ────────────────────────────────────────
function renderSkinCard(item, gemmes, idx) {
  const r = rm(item.rarity);
  const canAfford = gemmes >= item.cost_gemmes;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;
  const thumb = thumbHtml(item, r, 56);

  let cta;
  if (isEquipped) {
    cta = `<div class="bo2-check" style="background:${r.c};box-shadow:0 0 14px ${r.c}99">✓</div>`;
  } else if (item.owned) {
    cta = `<button class="bo2-equip-btn">Équiper</button>`;
  } else if (canAfford) {
    cta = `<button class="bo2-buy" style="background:${r.c};box-shadow:0 4px 14px -4px ${r.c}">${icon('gem',{size:13})} ${item.cost_gemmes}</button>`;
  } else {
    cta = `<div class="bo2-lock" style="background:${r.c}55">${icon('lock',{size:14})}</div>
           <span class="bo2-buy" style="background:transparent;color:var(--mu);padding-left:8px">${icon('gem',{size:13})} ${item.cost_gemmes}</span>`;
  }

  return `
    <div class="bo2-skin" data-item-id="${esc(item.id)}"
      style="border:1.5px solid ${r.c}66; box-shadow:0 0 18px ${r.c}26; animation: bo2CardIn .4s ${idx * 60}ms cubic-bezier(.34,1.56,.64,1) both">
      <div class="bo2-skin-thumb" style="background:${r.c}1a; box-shadow:0 0 16px ${r.c}55">
        ${thumb}
      </div>
      <div class="bo2-skin-mid">
        <div class="bo2-skin-name">${esc(item.name)}</div>
        <span class="bo2-pill" style="background:${r.c}">${esc(r.label)}</span>
        ${isEquipped ? `<div class="bo2-skin-sub">✓ Équipé</div>` : (item.owned ? `<div class="bo2-skin-sub" style="color:var(--mu2)">Débloqué</div>` : '')}
      </div>
      <div class="bo2-cta">${cta}</div>
    </div>`;
}

// ─── Rarity scale footer ──────────────────────────────────────
function renderRarityScale(items) {
  // Prix par rareté tirés des items présents (fallback ordre des paliers)
  const order = ['commun', 'rare', 'epique', 'legendaire'];
  const byRarity = {};
  items.forEach(i => { if (!byRarity[i.rarity]) byRarity[i.rarity] = i.cost_gemmes; });
  const icons = { commun: '🚙', rare: '🏎', epique: '🚐', legendaire: '🏆' };
  return `
    <div class="bo2-scale">
      <div class="bo2-scale-title">Les raretés</div>
      <div class="bo2-scale-row">
        ${order.map(k => {
          const r = RARITY_META[k];
          const price = byRarity[k];
          return `<div class="bo2-scale-item">
            <div class="bo2-scale-dot" style="background:${r.c}26;border:2px solid ${r.c};box-shadow:0 0 12px ${r.c}66">${icons[k]}</div>
            <div class="bo2-scale-lbl" style="color:${r.c}">${esc(r.label)}</div>
            ${price != null ? `<div class="bo2-scale-price">${icon('gem',{size:13})} ${price}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ─── Grid card (Autres) ───────────────────────────────────────
function renderGridCard(item, gemmes, idx) {
  const r = rm(item.rarity);
  const canAfford = gemmes >= item.cost_gemmes;
  const color = item.display_color || r.c;
  const imgUrl = item.asset_url ?? null;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;

  const preview = imgUrl
    ? `<img src="${esc(imgUrl)}" alt="${esc(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      + `<div class="bo2-card-preview-circle" style="background:${esc(color)}20;color:${esc(color)};display:none">${typeEmoji(item.type)}</div>`
    : `<div class="bo2-card-preview-circle" style="background:${esc(color)}20;color:${esc(color)}">${typeEmoji(item.type)}</div>`;

  return `
    <div class="bo2-card" data-item-id="${esc(item.id)}"
      style="border:1.5px solid ${r.c}66; box-shadow:0 0 12px ${r.c}1f; animation: bo2CardIn .4s ${idx * 60}ms cubic-bezier(.34,1.56,.64,1) both">
      <div class="bo2-card-preview">
        ${preview}
        ${item.owned ? `<div class="bo2-card-owned-badge">✓ Débloqué</div>` : ''}
      </div>
      <div class="bo2-card-info">
        <div class="bo2-card-name">${esc(item.name)}</div>
        <div class="bo2-card-footer">
          <span class="bo2-pill" style="background:${r.c}">${esc(r.label)}</span>
          ${item.owned
            ? (isEquipped ? `<div class="bo2-owned-txt">✓ Équipé</div>` : `<div class="bo2-owned-txt" style="color:var(--mu2)">Équiper</div>`)
            : `<button class="bo2-price-btn ${canAfford ? '' : 'cant-afford'}" style="${canAfford ? `background:${r.c}` : ''}" ${!canAfford ? 'disabled' : ''}>${icon('gem',{size:13})} ${item.cost_gemmes}</button>`
          }
        </div>
      </div>
    </div>`;
}

// ─── Thumb helper (img + fallback emoji) ──────────────────────
function thumbHtml(item, r, size) {
  const imgUrl = item.asset_url ?? null;
  if (imgUrl) {
    return `<img src="${esc(imgUrl)}" alt="${esc(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
      + `<span class="bo2-fallback" style="display:none">${typeEmoji(item.type)}</span>`;
  }
  return `<span class="bo2-fallback">${typeEmoji(item.type)}</span>`;
}

function typeEmoji(type) {
  if (type === 'avatar')    return '🚗';
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

// ─── Detail modal (fiche skin / item) ─────────────────────────
function showDetailModal(item, gemmes, onConfirm) {
  const r = rm(item.rarity);
  const afterBalance = gemmes - item.cost_gemmes;
  const canAfford = afterBalance >= 0;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;

  const imgUrl = item.asset_url ?? null;
  const halo = imgUrl
    ? `<img src="${esc(imgUrl)}" alt="${esc(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="bo2-fallback" style="display:none">${typeEmoji(item.type)}</span>`
    : `<span class="bo2-fallback">${typeEmoji(item.type)}</span>`;

  let cta, balanceLine = '';
  // Bloc Prix / Solde — visible seulement pour un item pas encore possédé
  const priceBlock = item.owned ? '' : `
      <div class="bo2-modal-price">
        <div class="bo2-price-row"><span>Prix</span><strong>${icon('gem',{size:13})} ${item.cost_gemmes}</strong></div>
        <div class="bo2-price-row sub"><span>Ton solde</span><span>${icon('gem',{size:13})} ${gemmes}</span></div>
      </div>`;
  if (item.owned) {
    cta = `<button class="bo2-modal-cta equip" id="bo2-cta">${isEquipped ? '✓ Équipé — retirer' : 'Équiper'}</button>`;
  } else if (canAfford) {
    cta = `<button class="bo2-modal-cta buy" id="bo2-cta">Acheter — ${item.cost_gemmes} ${icon('gem',{size:13})}</button>`;
    balanceLine = `<div class="bo2-modal-balance">Il te restera <strong>${afterBalance} ${icon('gem',{size:13})}</strong> après l'achat</div>`;
  } else {
    cta = `<button class="bo2-modal-cta locked" disabled>${icon('lock',{size:14})} Pas assez de gemmes</button>`;
    balanceLine = `<div class="bo2-modal-balance" style="color:#f87171">Il te manque ${item.cost_gemmes - gemmes} ${icon('gem',{size:13})}</div>`;
  }

  const overlay = document.createElement('div');
  overlay.className = 'bo2-modal-bg';
  overlay.innerHTML = `
    <div class="bo2-modal">
      <div class="bo2-modal-handle"></div>
      <div class="bo2-halo">
        <div class="bo2-halo-ring" style="background:${r.c}1a; box-shadow:0 0 50px ${r.c}66">
          ${halo}
        </div>
      </div>
      <div class="bo2-modal-body">
        <div class="bo2-modal-pill" style="background:${r.c}">${esc(r.label)}</div>
        <div class="bo2-modal-name">${esc(item.name)}</div>
        <div class="bo2-modal-desc">${esc(item.description || '')}</div>
      </div>
      ${priceBlock}
      ${cta}
      ${balanceLine}
      <button class="bo2-modal-cancel" id="bo2-modal-cancel">Fermer</button>
    </div>`;

  document.body.appendChild(overlay);
  track('boutique.detail_opened', { item_id: item.id });

  const close = () => { haptic('select'); overlay.remove(); };
  enableSheetSwipe(overlay.querySelector('.bo2-modal'), close, { overlay });
  overlay.querySelector('#bo2-modal-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const ctaBtn = overlay.querySelector('#bo2-cta');
  if (ctaBtn && !ctaBtn.disabled) {
    ctaBtn.addEventListener('click', async () => {
      if (item.owned) {
        // équiper / retirer directement
        const eq = getEquipped();
        if (eq[item.type] === item.id) {
          unequipItem(item.type); setEquippedAsset(item.type, null); syncAvatarUrlToProfile(item.type, null); toast(`${item.name} retiré`, 'info');
        } else {
          equipItem(item.type, item.id); setEquippedAsset(item.type, item.asset_url || null); syncAvatarUrlToProfile(item.type, item.asset_url || null); toast(`${item.name} équipé ✓`, 'success');
        }
        overlay.remove();
        // force refresh de la liste sous-jacente
        window.dispatchEvent(new CustomEvent('pg-equipped-changed', { detail: { slot: item.type, itemId: item.id } }));
        return;
      }
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
    if (data?.error === 'insufficient_gemmes') { toast('Pas assez de gemmes gemmes', 'error'); return null; }
    if (data?.error === 'already_owned')       { toast('Déjà dans ton inventaire', 'info'); return null; }
    if (data?.error)                           { toast('Achat impossible', 'error'); return null; }
    haptic('success');

    // Auto-équipement de l'item acheté
    try {
      equipItem(item.type, item.id);
      setEquippedAsset(item.type, item.asset_url || null);
      syncAvatarUrlToProfile(item.type, item.asset_url || null);
      toast(`${item.name} équipé !`, 'success', 3000);
    } catch (eqErr) {
      console.warn('[boutique] auto-equip failed', eqErr);
      toast(`${item.name} débloqué !`, 'success', 3000);
    }

    track('boutique.item_purchased', { item_id: item.id, cost: item.cost_gemmes });
    return data;
  } catch (e) {
    console.error('[boutique] purchase', e);
    toast('Erreur lors de l\'achat', 'error');
    return null;
  }
}
