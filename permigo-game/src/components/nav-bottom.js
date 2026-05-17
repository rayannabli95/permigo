// ═══════════════════════════════════════════════════════════════
// Bottom Nav — barre de navigation rôle-based persistante
// Usage : mountBottomNav(role) depuis main.js après route()
// ═══════════════════════════════════════════════════════════════

const ICO = {
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
  map:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  trophy: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
  user: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  check: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  users: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  book: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  activity: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
};

const TABS = {
  eleve: [
    { id: 'default',  label: 'Accueil',  icon: ICO.home },
    { id: 'parcours', label: 'Parcours', icon: ICO.map },
    { id: 'trophees', label: 'Trophées', icon: ICO.trophy },
    { id: 'profil',   label: 'Profil',   icon: ICO.user },
  ],
  enseignant: [
    { id: 'parcours',   label: 'Parcours', icon: ICO.map },
    { id: 'default',    label: "Auj.",     icon: ICO.activity },
    { id: 'validation', label: 'Valider',  icon: ICO.check },
    { id: 'eleves',     label: 'Élèves',   icon: ICO.users },
    { id: 'profil',     label: 'Profil',   icon: ICO.user },
  ],
  gerant: [
    { id: 'default', label: 'Pulse',  icon: ICO.activity },
    { id: 'equipe',  label: 'Équipe', icon: ICO.users },
    { id: 'eleves',  label: 'Élèves', icon: ICO.users },
    { id: 'profil',  label: 'Profil', icon: ICO.user },
  ],
};

const STYLE = `
  #bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: calc(60px + env(safe-area-inset-bottom, 0px));
    background: #fff;
    border-top: 1px solid #e2e6f2;
    display: flex;
    align-items: stretch;
    z-index: 300;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .bn-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 6px 4px 8px;
    cursor: pointer;
    color: #94a3b8;
    background: none;
    border: none;
    font-family: inherit;
    position: relative;
    -webkit-tap-highlight-color: transparent;
    min-height: 44px;
    transition: color .15s cubic-bezier(.4,0,.2,1);
  }
  .bn-tab::after {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 32px; height: 2.5px;
    background: #6366f1;
    border-radius: 0 0 3px 3px;
    transition: transform .2s cubic-bezier(.34,1.56,.64,1);
  }
  .bn-tab.active {
    color: #6366f1;
  }
  .bn-tab.active::after {
    transform: translateX(-50%) scaleX(1);
  }
  .bn-tab svg { display: block; flex-shrink: 0; }
  .bn-label {
    font: 700 10px/1 'Inter', sans-serif;
    letter-spacing: .01em;
    white-space: nowrap;
  }
  .bn-tab:active { transform: scale(.93); transition: transform .12s; }
`;

export function mountBottomNav(role) {
  if (!document.head.querySelector('#bn-style')) {
    const s = document.createElement('style');
    s.id = 'bn-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  document.querySelector('#bottom-nav')?.remove();

  const tabs = TABS[role] || TABS.eleve;
  const nav = document.createElement('nav');
  nav.id = 'bottom-nav';
  nav.setAttribute('aria-label', 'Navigation principale');
  nav.innerHTML = tabs.map(t => `
    <button class="bn-tab" data-id="${t.id}" aria-label="${t.label}">
      ${t.icon}
      <span class="bn-label">${t.label}</span>
    </button>
  `).join('');

  document.body.appendChild(nav);
  _updateActive();

  nav.querySelectorAll('.bn-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      location.hash = id === 'default' ? '#/' : `#/${id}`;
    });
  });

  window.addEventListener('hashchange', _updateActive);
}

export function unmountBottomNav() {
  document.querySelector('#bottom-nav')?.remove();
  window.removeEventListener('hashchange', _updateActive);
}

function _updateActive() {
  const nav = document.querySelector('#bottom-nav');
  if (!nav) return;
  const section = (location.hash || '').replace(/^#\/?/, '').split('/')[0] || 'default';
  nav.querySelectorAll('.bn-tab').forEach(btn => {
    const active = btn.dataset.id === section;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });
}
