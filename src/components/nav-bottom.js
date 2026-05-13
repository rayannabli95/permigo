/**
 * Bottom navigation mobile — barre fixe en bas avec 4 onglets selon rôle.
 *
 * Visible uniquement sur viewport < 720px (responsive CSS).
 *
 * Usage :
 *   import { mountBottomNav } from '@/components/nav-bottom.js';
 *   mountBottomNav();   // monte dans body, détecte le rôle automatiquement
 *
 * Le composant gère son propre re-render quand la route change (highlight de l'onglet actif).
 */

import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';

const NAVS = {
  eleve: [
    { path: '/accueil',     emoji: '🏠', label: 'Accueil' },
    { path: '/parcours',    emoji: '🗺️', label: 'Parcours' },
    { path: '/reservation', emoji: '📅', label: 'Réserver' },
    { path: '/profil',      emoji: '👤', label: 'Profil' },
  ],
  moniteur: [
    { path: '/aujourdhui', emoji: '☀️', label: 'Aujourd\'hui' },
    { path: '/planning',   emoji: '📅', label: 'Planning' },
    { path: '/mes-eleves', emoji: '👥', label: 'Élèves' },
    { path: '/avis',       emoji: '⭐', label: 'Avis' },
    { path: '/profil',     emoji: '👤', label: 'Profil' },
  ],
  admin: [
    { path: '/dashboard',  emoji: '📊', label: 'Dashboard' },
    { path: '/calendrier', emoji: '📅', label: 'Calendrier' },
    { path: '/eleves',     emoji: '🎓', label: 'Élèves' },
    { path: '/equipe',     emoji: '👨‍🏫', label: 'Équipe' },
    { path: '/profil',     emoji: '👤', label: 'Profil' },
  ],
};

let _host = null;
let _onHashChange = null;

/** Monte la bottom nav. Appelé une fois après login. */
export function mountBottomNav() {
  const me = getCurUser();
  if (!me) return unmountBottomNav();

  const nav = NAVS[me.role];
  if (!nav || nav.length < 2) return; // pas la peine pour admin avec 1 seule entrée

  if (!_host) {
    _host = document.createElement('div');
    _host.id = 'nav-bottom-host';
    document.body.appendChild(_host);
  }

  render(nav);

  // Re-render quand la route change pour highlight l'onglet actif
  _onHashChange = () => render(nav);
  window.addEventListener('hashchange', _onHashChange);
}

/** Démonte (à appeler au logout). */
export function unmountBottomNav() {
  if (_host) { _host.remove(); _host = null; }
  if (_onHashChange) { window.removeEventListener('hashchange', _onHashChange); _onHashChange = null; }
}

function currentPath() {
  return (location.hash || '#/').replace(/^#/, '').split('?')[0];
}

function render(nav) {
  if (!_host) return;
  const cur = currentPath();
  _host.innerHTML = `
    <style>
      /* Couleur adaptive light/dark via les variables */
      #nav-bottom{position:fixed;bottom:0;left:0;right:0;z-index:50;display:none;background:color-mix(in srgb,var(--su) 92%,transparent);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);border-top:1px solid var(--bo);padding:6px 8px calc(6px + env(safe-area-inset-bottom));box-shadow:0 -4px 24px -8px rgba(11,13,26,.18)}
      @media (max-width:920px){#nav-bottom{display:grid;grid-template-columns:repeat(var(--cols,3),1fr);gap:4px}}

      /* Aussi le contenu de la page doit avoir un padding-bottom pour pas être masqué */
      @media (max-width:920px){#app{padding-bottom:calc(70px + env(safe-area-inset-bottom))}}

      .nb-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 4px;border:0;background:transparent;cursor:pointer;font-family:inherit;color:var(--mu);transition:color .15s,transform .25s cubic-bezier(.5,1.6,.4,1);text-decoration:none;border-radius:8px;min-height:50px;position:relative}
      .nb-item:hover{background:var(--bg2)}
      .nb-item:focus-visible{outline:none;background:var(--ap);box-shadow:0 0 0 2px var(--a)}
      .nb-item:active{transform:scale(.92)}
      .nb-item.on{color:var(--a)}
      .nb-item .em{font-size:20px;line-height:1;transition:transform .25s cubic-bezier(.5,1.6,.4,1)}
      .nb-item.on .em{transform:scale(1.15) translateY(-1px)}
      .nb-item .lb{font-size:10.5px;font-weight:700;letter-spacing:.2px}
      .nb-item.on .lb{font-weight:800}
      .nb-item.on::after{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:18px;height:2px;background:var(--a);border-radius:0 0 99px 99px;animation:nb-pill-in .25s cubic-bezier(.5,1.6,.4,1) both}
      @keyframes nb-pill-in{from{width:0}to{width:18px}}
    </style>
    <nav id="nav-bottom" style="--cols:${nav.length}" aria-label="Navigation principale" role="navigation">
      ${nav.map(item => {
        const active = cur === item.path;
        return `
          <button class="nb-item ${active ? 'on' : ''}" data-path="${esc(item.path)}" type="button"
                  aria-label="${esc(item.label)}"
                  ${active ? 'aria-current="page"' : ''}>
            <span class="em" aria-hidden="true">${item.emoji}</span>
            <span class="lb">${esc(item.label)}</span>
          </button>
        `;
      }).join('')}
    </nav>
  `;

  _host.querySelectorAll('.nb-item').forEach(b => {
    b.addEventListener('click', async () => {
      const path = b.dataset.path;
      const { navigate } = await import('@/router.js');
      navigate(path);
    });
  });
}
