/**
 * Boutique Gemmes — items cosmétiques achetables.
 *
 * Catalogue actuel :
 *  - Skin carte permis (Or 150, Platine 300)
 *  - Avatar frames (Rainbow 80, Glow Violet 80, Glow Or 80)
 *  - Couleur thème custom (Rose 100, Vert 100, Cyan 100, Rouge 100)
 *
 * Inventaire en localStorage via `game-state.js`.
 */

import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/toast.js';
import { burstConfettiFromElement } from '@/components/confetti.js';
import { lootToast } from '@/components/loot-toast.js';
import {
  getGemmes, ownsItem, purchaseItem, getEquipped, equipItem, unequipItem,
} from '@/utils/game-state.js';

let _root, _me, _tab = 'permit';

// ─── Catalogue ───
const CATALOG = {
  permit: [
    { id: 'permit-or', name: 'Or', desc: 'Bordure dorée, hologramme premium, tampon "OR"', cost: 150, slot: 'permit', preview: 'or' },
    { id: 'permit-platine', name: 'Platine', desc: 'Le top du top — bordure métal & hologramme arc-en-ciel', cost: 300, slot: 'permit', preview: 'platine' },
  ],
  avatar: [
    { id: 'frame-rainbow', name: 'Frame Arc-en-ciel', desc: 'Ring rotatif multicolore', cost: 80, slot: 'avatarFrame', preview: 'rainbow' },
    { id: 'frame-glow-violet', name: 'Frame Glow Violet', desc: 'Halo violet pulse intense', cost: 80, slot: 'avatarFrame', preview: 'glow-violet' },
    { id: 'frame-glow-or', name: 'Frame Glow Or', desc: 'Halo doré champion', cost: 80, slot: 'avatarFrame', preview: 'glow-or' },
  ],
  theme: [
    { id: 'theme-rose', name: 'Rose Néon', desc: 'Accent rose vif', cost: 100, slot: 'theme', preview: 'rose', color: '#ec4899' },
    { id: 'theme-vert', name: 'Vert Émeraude', desc: 'Accent vert nature', cost: 100, slot: 'theme', preview: 'vert', color: '#10b981' },
    { id: 'theme-cyan', name: 'Cyan Glacier', desc: 'Accent cyan glacé', cost: 100, slot: 'theme', preview: 'cyan', color: '#0ea5e9' },
    { id: 'theme-rouge', name: 'Rouge Racing', desc: 'Accent rouge sport', cost: 100, slot: 'theme', preview: 'rouge', color: '#ef4444' },
  ],
};

const TABS = [
  { id: 'permit', label: 'Carte permis', icon: '🪪' },
  { id: 'avatar', label: 'Avatar', icon: '👤' },
  { id: 'theme', label: 'Couleurs', icon: '🎨' },
];

export function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;
  _tab = 'permit';
  render();
}

function render() {
  const gemmes = getGemmes();
  const items = CATALOG[_tab] || [];
  const equipped = getEquipped();

  _root.innerHTML = `
    <style>
      .bq-wrap{max-width:580px;margin:0 auto;padding:14px;padding-bottom:90px}
      .bq-top{display:flex;align-items:center;gap:10px;padding:8px 4px 14px}
      .bq-back{width:36px;height:36px;border-radius:10px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer;color:var(--ink)}
      .bq-top h1{font-family:var(--fd);font-size:22px;font-weight:900;letter-spacing:-.02em;margin:0;flex:1}

      .bq-gemmes{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:99px;background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;font-family:var(--fd);font-size:14px;font-weight:900;box-shadow:0 6px 18px -4px rgba(139,92,246,.5);letter-spacing:.5px}
      .bq-gemmes .em{font-size:16px;line-height:1;filter:drop-shadow(0 0 6px rgba(167,139,250,.8));animation:bq-gem-shine 2.5s ease-in-out infinite}
      @keyframes bq-gem-shine{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg) scale(1.1)}}

      /* ─── Intro "Comment ça marche" ─── */
      .bq-intro{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;border-radius:14px;padding:16px 18px;margin-bottom:16px;display:flex;align-items:center;gap:14px;box-shadow:0 8px 24px -8px rgba(99,102,241,.4)}
      .bq-intro .em{font-size:38px;line-height:1;filter:drop-shadow(0 4px 12px rgba(167,139,250,.5))}
      .bq-intro .body{flex:1}
      .bq-intro .ti{font-family:var(--fd);font-weight:900;font-size:14px;letter-spacing:-.005em;margin-bottom:3px}
      .bq-intro .sub{font-size:11.5px;color:rgba(255,255,255,.78);line-height:1.4}
      .bq-intro .sub b{color:#fde68a;font-weight:800}

      .bq-tabs{display:flex;gap:6px;margin-bottom:16px;background:var(--bg2);padding:4px;border-radius:12px;border:1px solid var(--bo)}
      .bq-tab{flex:1;padding:11px 6px;border:0;background:transparent;border-radius:8px;font-family:inherit;font-size:12px;font-weight:700;color:var(--mu);cursor:pointer;letter-spacing:.2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;transition:all .15s;line-height:1.1}
      .bq-tab:hover{color:var(--ink)}
      .bq-tab.on{background:var(--su);color:var(--ink);box-shadow:var(--s0)}
      .bq-tab .em{font-size:18px;line-height:1}
      .bq-tab .lb{font-size:11px;font-weight:800}

      .bq-section-h{font-family:var(--fn);font-size:10.5px;font-weight:900;color:var(--mu);letter-spacing:.2em;text-transform:uppercase;margin:0 4px 10px}

      /* Cards en 1 colonne — plus grandes, plus claires */
      .bq-grid{display:flex;flex-direction:column;gap:12px}
      .bq-card{background:var(--su);border:2px solid var(--bo);border-radius:16px;padding:14px;display:flex;gap:14px;align-items:center;transition:transform .15s,border-color .15s,box-shadow .2s;position:relative;overflow:hidden}
      .bq-card:hover{transform:translateY(-2px);border-color:var(--a)}
      .bq-card.owned{border-color:var(--gr)}
      .bq-card.equipped{border-color:var(--gr);background:linear-gradient(135deg,var(--grp),var(--su));box-shadow:0 0 0 3px var(--grp),0 14px 28px -10px rgba(16,185,129,.4)}
      .bq-card.equipped::before{content:'✓ ÉQUIPÉ';position:absolute;top:10px;right:12px;font-family:var(--fn);font-size:9.5px;font-weight:900;color:#fff;background:var(--gr);padding:3px 9px;border-radius:99px;letter-spacing:.3px;z-index:2;box-shadow:0 4px 10px -2px rgba(16,185,129,.5)}

      .bq-preview{width:96px;height:96px;border-radius:12px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:linear-gradient(135deg,var(--bg2),var(--bg));flex-shrink:0;border:1px solid var(--bo2)}

      /* Preview skin carte permis */
      .bq-prev-permit{width:80px;height:50px;border-radius:5px;position:relative;overflow:hidden}
      .bq-prev-permit.or{background:linear-gradient(135deg,#fde68a,#fbbf24,#d97706);box-shadow:0 0 0 1.5px #f59e0b,0 6px 14px -4px rgba(251,191,36,.7)}
      .bq-prev-permit.platine{background:linear-gradient(135deg,#f1f5f9,#cbd5e1,#94a3b8);box-shadow:0 0 0 1.5px #64748b,0 6px 14px -4px rgba(148,163,184,.7)}
      .bq-prev-permit::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.6) 50%,transparent 70%);background-size:200% 100%;animation:bq-shimmer 3s ease-in-out infinite}
      @keyframes bq-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

      /* Preview avatar frame */
      .bq-prev-avatar{position:relative;width:60px;height:60px}
      .bq-prev-avatar .av-inner{width:60px;height:60px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#4338ca);display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--fd);font-weight:900;font-size:20px}
      .bq-prev-avatar.rainbow::before{content:'';position:absolute;inset:-4px;border-radius:18px;background:conic-gradient(from 0deg,#ef4444,#fbbf24,#10b981,#0ea5e9,#a855f7,#ef4444);animation:bq-rainbow-spin 3s linear infinite;z-index:-1;filter:blur(2px)}
      @keyframes bq-rainbow-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      .bq-prev-avatar.glow-violet::before{content:'';position:absolute;inset:-6px;border-radius:18px;background:radial-gradient(circle,#a78bfa,transparent 70%);filter:blur(8px);animation:bq-pulse 1.8s ease-in-out infinite;z-index:-1}
      .bq-prev-avatar.glow-or::before{content:'';position:absolute;inset:-6px;border-radius:18px;background:radial-gradient(circle,#fbbf24,transparent 70%);filter:blur(8px);animation:bq-pulse 1.8s ease-in-out infinite;z-index:-1}
      @keyframes bq-pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}

      /* Preview couleur thème */
      .bq-prev-color{width:64px;height:64px;border-radius:50%;box-shadow:0 8px 20px -4px var(--prev-glow),0 0 0 3px rgba(255,255,255,.5);position:relative}
      .bq-prev-color::after{content:'';position:absolute;inset:6px;border-radius:50%;background:linear-gradient(135deg,rgba(255,255,255,.4),transparent 60%)}

      .bq-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
      .bq-name-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .bq-name{font-family:var(--fd);font-weight:800;font-size:15px;color:var(--ink);letter-spacing:-.005em;line-height:1.2}
      .bq-price{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:99px;background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;font-family:var(--fd);font-size:11px;font-weight:900;letter-spacing:.2px}
      .bq-price .em{font-size:11px}
      .bq-desc{font-size:11.5px;color:var(--mu);line-height:1.4}
      .bq-actions{margin-top:8px}

      .bq-cta{padding:10px 16px;border-radius:9px;border:0;font-family:var(--fd);font-size:12.5px;font-weight:900;cursor:pointer;letter-spacing:.3px;transition:transform .12s,box-shadow .15s;width:100%}
      .bq-cta-buy{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;box-shadow:0 6px 14px -4px rgba(139,92,246,.5)}
      .bq-cta-buy:hover{transform:translateY(-2px)}
      .bq-cta-buy:disabled{opacity:.5;cursor:not-allowed;transform:none}
      .bq-cta-equip{background:var(--ap);color:var(--a);border:1px solid var(--a)}
      .bq-cta-equipped{background:var(--grp);color:var(--gr);border:1px solid var(--gr);cursor:default}

      .bq-empty{text-align:center;padding:42px 16px;color:var(--mu);background:var(--bg2);border-radius:14px}
      .bq-empty .em{font-size:38px;margin-bottom:8px}
    </style>

    <div class="bq-wrap anim-slide-up">
      <div class="bq-top">
        <button class="bq-back" id="bq-back" aria-label="Retour">‹</button>
        <span class="pg-logo-txt">PermiGo</span>
        <h1>🛒 Boutique</h1>
        <div class="bq-gemmes"><span class="em">💎</span><span>${gemmes}</span></div>
      </div>

      <div class="bq-intro">
        <div class="em">💎</div>
        <div class="body">
          <div class="ti">Personnalise ton expérience</div>
          <div class="sub">Gagne des <b>gemmes</b> en validant des sous-compétences sur ton parcours REMC, puis échange-les ici contre des skins exclusifs.</div>
        </div>
      </div>

      <div class="bq-tabs" role="tablist">
        ${TABS.map(t => `<button class="bq-tab ${_tab === t.id ? 'on' : ''}" data-tab="${t.id}" type="button"><span class="em">${t.icon}</span><span class="lb">${esc(t.label)}</span></button>`).join('')}
      </div>

      <div class="bq-section-h">${esc(TABS.find(t => t.id === _tab)?.label || '')} · ${items.length} article${items.length > 1 ? 's' : ''}</div>

      <div class="bq-grid">
        ${items.length === 0 ? `<div class="bq-empty"><div class="em">📦</div><div>Aucun article dans cette catégorie</div></div>` : items.map(item => renderCard(item, gemmes, equipped)).join('')}
      </div>
    </div>
  `;
  wire();
}

function renderCard(item, gemmes, equipped) {
  const owned = ownsItem(item.id);
  const isEquipped = equipped[item.slot] === item.id;
  const canAfford = gemmes >= item.cost;

  let preview = '';
  if (item.slot === 'permit') {
    preview = `<div class="bq-prev-permit ${item.preview}"></div>`;
  } else if (item.slot === 'avatarFrame') {
    preview = `<div class="bq-prev-avatar ${item.preview}"><div class="av-inner">${esc((_me?.nom || '?').slice(0,2).toUpperCase())}</div></div>`;
  } else if (item.slot === 'theme') {
    preview = `<div class="bq-prev-color" style="background:${item.color};--prev-glow:${item.color}aa"></div>`;
  }

  let ctaHtml;
  if (isEquipped) {
    ctaHtml = `<button class="bq-cta bq-cta-equipped" type="button" disabled>✓ Équipé</button>`;
  } else if (owned) {
    ctaHtml = `<button class="bq-cta bq-cta-equip" type="button" data-equip="${esc(item.id)}" data-slot="${esc(item.slot)}">Équiper</button>`;
  } else {
    ctaHtml = `<button class="bq-cta bq-cta-buy" type="button" data-buy="${esc(item.id)}" data-cost="${item.cost}" ${canAfford ? '' : 'disabled'}>${canAfford ? 'Acheter' : `${item.cost - gemmes} 💎 manquantes`}</button>`;
  }

  return `
    <div class="bq-card ${owned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}" data-item-id="${esc(item.id)}">
      <div class="bq-preview">${preview}</div>
      <div class="bq-body">
        <div class="bq-name-row">
          <div class="bq-name">${esc(item.name)}</div>
          ${owned ? '' : `<div class="bq-price"><span class="em">💎</span><span>${item.cost}</span></div>`}
        </div>
        <div class="bq-desc">${esc(item.desc)}</div>
        <div class="bq-actions">${ctaHtml}</div>
      </div>
    </div>
  `;
}

function wire() {
  _root.querySelector('#bq-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/parcours');
  });

  _root.querySelectorAll('.bq-tab').forEach(t => {
    t.addEventListener('click', () => {
      _tab = t.dataset.tab;
      render();
    });
  });

  _root.querySelectorAll('[data-buy]').forEach(b => {
    b.addEventListener('click', async (e) => {
      const itemId = b.dataset.buy;
      const cost = parseInt(b.dataset.cost, 10);
      const item = findItem(itemId);
      if (!item) return;
      if (!confirm(`Acheter "${item.name}" pour ${cost} 💎 ?`)) return;

      const result = purchaseItem(itemId, cost);
      if (!result.ok) {
        toast(result.error === 'insufficient-gemmes' ? 'Pas assez de gemmes' : 'Déjà possédé', 'error');
        return;
      }

      // Auto-équipe l'item juste acheté
      equipItem(item.slot, itemId);

      // Confetti + loot toast
      burstConfettiFromElement(b, { count: 50, power: 12 });
      lootToast({ icon: '✨', label: 'Acheté & équipé !', subLabel: item.name, kind: 'levelup' });

      render();
    });
  });

  _root.querySelectorAll('[data-equip]').forEach(b => {
    b.addEventListener('click', () => {
      const itemId = b.dataset.equip;
      const slot = b.dataset.slot;
      equipItem(slot, itemId);
      const item = findItem(itemId);
      lootToast({ icon: '✨', label: 'Équipé', subLabel: item?.name || '', kind: 'success' });
      render();
    });
  });
}

function findItem(itemId) {
  for (const cat of Object.values(CATALOG)) {
    const item = cat.find(i => i.id === itemId);
    if (item) return item;
  }
  return null;
}
