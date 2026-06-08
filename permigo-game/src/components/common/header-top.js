// ═══════════════════════════════════════════════════════════════
// Header Top — logo PermiGo (gauche) + cloche notifications (droite)
// Usage : await mountHeader() depuis main.js après route()
// ═══════════════════════════════════════════════════════════════

import { mountNotifBell } from '@/components/common/notif-bell.js';
import { getCurUser } from '@/auth/cur-user.js';
import { renderUserAvatar } from '@/components/common/avatar.js';
import { getEquippedAsset } from '@/utils/game-state.js';

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
  .pg-logo-btn:active { background: color-mix(in srgb, var(--a) 8%, transparent); }
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
  .ht-icon-btn:active { transform: scale(.92); background: var(--bg2, color-mix(in srgb, var(--a) 8%, transparent)); }
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
  bar.innerHTML = `
    <button class="pg-logo-btn" id="ht-logo" aria-label="Accueil PermiGo">
      <span class="pg-logo-txt sm">PermiGo</span>
    </button>
    <div id="ht-right">
      <div id="ht-bell"></div>
      ${me ? `<button class="ht-avatar-btn" id="ht-avatar" aria-label="Mon profil" title="Mon profil">${renderUserAvatar({ ...me, avatar_url: getEquippedAsset('avatar') || me.avatar_url }, 36)}</button>` : ''}
    </div>
  `;

  const appEl = document.getElementById('app');
  document.body.insertBefore(bar, appEl);

  bar.querySelector('#ht-logo')?.addEventListener('click', () => {
    location.hash = '#/';
  });

  bar.querySelector('#ht-avatar')?.addEventListener('click', () => {
    location.hash = '#/profil';
  });

  // Rafraîchit l'avatar de l'en-tête dès qu'un cosmétique est équipé (sans reload).
  // Listener enregistré une seule fois au niveau window.
  if (!window.__pgHeaderCosmeticListener) {
    window.__pgHeaderCosmeticListener = true;
    window.addEventListener('pg:cosmetics-changed', () => {
      const cur = getCurUser();
      const avBtn = document.querySelector('#ht-avatar');
      if (cur && avBtn) {
        avBtn.innerHTML = renderUserAvatar({ ...cur, avatar_url: getEquippedAsset('avatar') || cur.avatar_url }, 36);
      }
    });
  }

  await mountNotifBell(bar.querySelector('#ht-bell'));
}

export function unmountHeader() {
  document.querySelector('#header-bar')?.remove();
}
