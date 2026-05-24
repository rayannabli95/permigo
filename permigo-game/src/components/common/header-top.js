// ═══════════════════════════════════════════════════════════════
// Header Top — logo PermiGo (gauche) + cloche notifications (droite)
// Usage : await mountHeader() depuis main.js après route()
// ═══════════════════════════════════════════════════════════════

import { mountNotifBell } from '@/components/common/notif-bell.js';
import { icon } from '@/utils/icons.js';
import { getCurUser } from '@/auth/cur-user.js';
import { renderUserAvatar } from '@/components/common/avatar.js';

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
    width: 36px; height: 36px;
    padding: 0;
    border: 0;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform .12s;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
  }
  .ht-avatar-btn:active { transform: scale(.92); }
  .ht-avatar-btn > * { pointer-events: none; }
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
  bar.innerHTML = `
    <button class="pg-logo-btn" id="ht-logo" aria-label="Accueil PermiGo">
      <span class="pg-logo-txt sm">PermiGo</span>
    </button>
    <div id="ht-right">
      ${isEleve ? `<button class="ht-icon-btn" id="ht-shop" aria-label="Boutique" title="Boutique">${icon('shopping-bag', { size: 20 })}</button>` : ''}
      <div id="ht-bell"></div>
      ${me ? `<button class="ht-avatar-btn" id="ht-avatar" aria-label="Mon profil" title="Mon profil">${renderUserAvatar(me, 36)}</button>` : ''}
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

  bar.querySelector('#ht-avatar')?.addEventListener('click', () => {
    location.hash = '#/profil';
  });

  await mountNotifBell(bar.querySelector('#ht-bell'));
}

export function unmountHeader() {
  document.querySelector('#header-bar')?.remove();
}
