// ═══════════════════════════════════════════════════════════════
// Header Top — logo PermiGo (gauche) + cloche notifications (droite)
// Usage : await mountHeader() depuis main.js après route()
// ═══════════════════════════════════════════════════════════════

import { mountNotifBell } from '@/components/notif-bell.js';

const STYLE = `
  #header-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: calc(52px + env(safe-area-inset-top, 0px));
    padding-top: env(safe-area-inset-top, 0px);
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid #e2e6f2;
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
  bar.innerHTML = `
    <button class="pg-logo-btn" id="ht-logo" aria-label="Accueil PermiGo">
      <span class="pg-logo-txt sm">PermiGo</span>
    </button>
    <div id="ht-bell"></div>
  `;

  const appEl = document.getElementById('app');
  document.body.insertBefore(bar, appEl);

  bar.querySelector('#ht-logo')?.addEventListener('click', () => {
    location.hash = '#/';
  });

  await mountNotifBell(bar.querySelector('#ht-bell'));
}

export function unmountHeader() {
  document.querySelector('#header-bar')?.remove();
}
