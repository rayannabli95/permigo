// ═══════════════════════════════════════════════════════════════
// Header Top — logo PermiGo (gauche) + cloche notifications (droite)
// Usage : await mountHeader() depuis main.js après route()
// ═══════════════════════════════════════════════════════════════

import { mountNotifBell } from '@/components/notif-bell.js';
import { icon } from '@/utils/icons.js';
import { getCurUser } from '@/auth/cur-user.js';
import { sb } from '@/auth/auth.js';

const STYLE = `
  #header-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: calc(52px + env(safe-area-inset-top, 0px));
    padding-top: env(safe-area-inset-top, 0px);
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--bo);
    transition: background .2s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 16px;
    padding-right: 12px;
    z-index: 300;
  }
  .pg-logo-btn {
    background: none;
    border: none;
    padding: 6px 4px;
    cursor: pointer;
    border-radius: 8px;
    transition: background .12s;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .pg-logo-btn:active { background: rgba(99,102,241,.08); }
  #ht-right { display: flex; align-items: center; gap: 4px; }
  .ht-icon-btn {
    width: 40px; height: 40px;
    border-radius: 10px;
    border: 1px solid var(--bo);
    background: var(--su, #fff);
    color: var(--ink);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform .12s, background .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .ht-icon-btn:active { transform: scale(.92); background: var(--bg2, rgba(99,102,241,.08)); }
  .ht-avatar-btn {
    width: 40px; height: 40px;
    border-radius: 50%;
    border: 1px solid var(--bo);
    background: var(--su, #fff);
    color: #4f46e5;
    font: 700 13px/1 'Inter', sans-serif;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform .12s, background .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .ht-avatar-btn:active { transform: scale(.92); background: rgba(99,102,241,.08); }
  .ht-menu {
    position: fixed;
    top: calc(56px + env(safe-area-inset-top, 0px));
    right: 12px;
    min-width: 200px;
    background: var(--su, #fff);
    border: 1px solid var(--bo);
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(10,13,26,.18);
    padding: 6px;
    z-index: 320;
    display: flex; flex-direction: column;
  }
  .ht-menu[hidden] { display: none; }
  .ht-menu-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 10px 12px;
    border: none; background: none;
    border-radius: 10px;
    font: 600 14px/1.2 'Inter', sans-serif;
    color: var(--ink, #1e2030);
    text-align: left;
    cursor: pointer;
  }
  .ht-menu-item:active { background: rgba(99,102,241,.08); }
  .ht-menu-item.ht-menu-logout { color: #dc2626; }
`;

export async function mountHeader() {
  if (!document.head.querySelector('#ht-style')) {
    const s = document.createElement('style');
    s.id = 'ht-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  document.querySelector('#header-bar')?.remove();

  const bar = document.createElement('header');
  bar.id = 'header-bar';
  bar.setAttribute('role', 'banner');
  const me = getCurUser();
  const isEleve = me?.role === 'eleve';
  const ini = ((me?.prenom?.[0] || '') + (me?.nom?.[0] || '')).toUpperCase() || '?';
  bar.innerHTML = `
    <button class="pg-logo-btn" id="ht-logo" aria-label="Accueil PermiGo">
      <span class="pg-logo-txt sm">PermiGo</span>
    </button>
    <div id="ht-right">
      ${isEleve ? `<button class="ht-icon-btn" id="ht-shop" aria-label="Boutique" title="Boutique">${icon('shopping-bag', { size: 20 })}</button>` : ''}
      <div id="ht-bell"></div>
      ${!isEleve ? `
      <button class="ht-avatar-btn" id="ht-account" aria-haspopup="menu" aria-expanded="false" aria-label="Menu du compte">${ini}</button>
      <div class="ht-menu" id="ht-menu" role="menu" aria-label="Menu du compte" hidden>
        <button class="ht-menu-item" role="menuitem" data-go="#/profil">Profil</button>
        <button class="ht-menu-item" role="menuitem" data-go="#/ecole">Auto-école</button>
        <button class="ht-menu-item ht-menu-logout" role="menuitem" id="ht-logout">Déconnexion</button>
      </div>` : ''}
    </div>
  `;

  const appEl = document.getElementById('app');
  document.body.insertBefore(bar, appEl);

  bar.querySelector('#ht-logo')?.addEventListener('click', () => {
    location.hash = '#/';
  });

  bar.querySelector('#ht-shop')?.addEventListener('click', () => {
    location.hash = '#/boutique';
  });

  // Menu compte (non-élève) : ouverture/fermeture + navigation + déconnexion
  const accBtn = bar.querySelector('#ht-account');
  const menu   = bar.querySelector('#ht-menu');
  if (accBtn && menu) {
    const closeMenu = () => {
      menu.hidden = true;
      accBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKeydown, true);
    };
    const openMenu = () => {
      menu.hidden = false;
      accBtn.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onDocClick, true);
      document.addEventListener('keydown', onKeydown, true);
      menu.querySelector('.ht-menu-item')?.focus();
    };
    function onDocClick(e) {
      if (!menu.contains(e.target) && e.target !== accBtn) closeMenu();
    }
    function onKeydown(e) {
      if (e.key === 'Escape') { closeMenu(); accBtn.focus(); }
    }
    accBtn.addEventListener('click', () => { menu.hidden ? openMenu() : closeMenu(); });
    menu.querySelectorAll('[data-go]').forEach(it => {
      it.addEventListener('click', () => { closeMenu(); location.hash = it.dataset.go; });
    });
    menu.querySelector('#ht-logout')?.addEventListener('click', async () => {
      closeMenu();
      try { await sb.auth.signOut(); } catch (err) { console.error('[header] signOut', err); }
      location.hash = '#/';
    });
  }

  await mountNotifBell(bar.querySelector('#ht-bell'));
}

export function unmountHeader() {
  document.querySelector('#header-bar')?.remove();
}
