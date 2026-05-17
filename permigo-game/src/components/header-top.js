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
    <div class="pg-logo-txt sm">PermiGo</div>
    <div id="ht-bell"></div>
  `;

  const appEl = document.getElementById('app');
  document.body.insertBefore(bar, appEl);

  await mountNotifBell(bar.querySelector('#ht-bell'));
}

export function unmountHeader() {
  document.querySelector('#header-bar')?.remove();
}
