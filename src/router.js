/**
 * Hash router minimaliste pour PermiGo v7.
 *
 * Routes définies par rôle. Le router lit `location.hash` au boot
 * + écoute `hashchange` pour rerender la page.
 *
 * Usage depuis une page :
 *   import { navigate } from '@/router.js';
 *   navigate('/parcours');          // → location.hash = '#/parcours'
 *   navigate('/fiche-eleve', { id }); // → '#/fiche-eleve?id=xxx'
 *
 * Bénéfices :
 *  - Reload (F5) ne casse plus la nav
 *  - Bouton "back" du navigateur fonctionne
 *  - URL partageable (utile pour debug)
 */

import { getCurUser } from '@/auth/cur-user.js';

let _appEl = null;

// Map route → { loader, roles autorisés }
// roles = null  → accessible à tous (publique)
// roles = []    → tous les rôles authentifiés
// roles = ['eleve'] etc. → réservé aux rôles listés
const ROUTES = {
  // Public (accessible à tous)
  '/':         { loader: () => publicOrHome(),                       roles: null },
  '/login':    { loader: () => import('./pages/auth/login.js'),      roles: null },
  '/landing':  { loader: () => import('./pages/public/landing.js'),  roles: null },
  '/signup':   { loader: () => import('./pages/public/signup.js'),   roles: null },

  // Élève
  '/accueil':     { loader: () => import('./pages/eleve/accueil.js'),     roles: ['eleve'] },
  '/parcours':    { loader: () => import('./pages/eleve/parcours.js'),    roles: ['eleve'] },
  '/reservation': { loader: () => import('./pages/eleve/reservation.js'), roles: ['eleve'] },
  '/trophees':    { loader: () => import('./pages/eleve/trophees.js'),    roles: ['eleve'] },
  '/boutique':    { loader: () => import('./pages/eleve/boutique.js'),    roles: ['eleve'] },

  // Moniteur
  '/mes-eleves':  { loader: () => import('./pages/moniteur/mes-eleves.js'),  roles: ['moniteur'] },
  '/fiche-eleve': { loader: () => import('./pages/moniteur/fiche-eleve.js'), roles: ['moniteur', 'admin'] },
  '/livret-remc': { loader: () => import('./pages/moniteur/livret-remc.js'), roles: ['moniteur', 'admin'] },
  '/planning':    { loader: () => import('./pages/moniteur/planning.js'),   roles: ['moniteur'] },
  '/avis':        { loader: () => import('./pages/moniteur/avis.js'),       roles: ['moniteur'] },
  '/aujourdhui':  { loader: () => import('./pages/moniteur/aujourdhui.js'), roles: ['moniteur'] },
  '/lieux':       { loader: () => import('./pages/moniteur/lieux.js'),      roles: ['moniteur'] },

  // Admin
  '/dashboard':   { loader: () => import('./pages/admin/dashboard.js'),     roles: ['admin'] },
  '/eleves':      { loader: () => import('./pages/admin/eleves.js'),        roles: ['admin'] },
  '/calendrier':  { loader: () => import('./pages/admin/calendrier.js'),    roles: ['admin'] },
  '/equipe':      { loader: () => import('./pages/admin/equipe.js'),        roles: ['admin'] },

  // Commun à tous les rôles authentifiés
  '/profil':         { loader: () => import('./pages/common/profil.js'),       roles: ['eleve', 'moniteur', 'admin'] },
  '/notifications':  { loader: () => import('./pages/common/notifications.js'),roles: ['eleve', 'moniteur', 'admin'] },
};

/** Renvoie le module home selon le rôle de l'utilisateur (ou landing si non-auth).
 *  Side-effect : si auth, redirige vers la route nommée pour activer le highlight de la bottom nav. */
function publicOrHome() {
  const cur = getCurUser();
  if (!cur) return import('./pages/public/landing.js');
  // Redirige vers la route nommée pour highlight propre
  const redirect = cur.role === 'eleve' ? '/accueil'
    : cur.role === 'moniteur' ? '/aujourdhui'
    : cur.role === 'admin' ? '/dashboard'
    : null;
  if (redirect) {
    // Utilise replace pour pas polluer l'historique
    location.replace('#' + redirect);
    // Retourne un module "vide" puisque handleRoute va se rappeler tout seul après le hashchange
    return Promise.resolve({ mount: () => {} });
  }
  return import('./pages/public/landing.js');
}

/**
 * Parse l'URL hash et renvoie { path, params }.
 * Ex: '#/fiche-eleve?id=abc' → { path:'/fiche-eleve', params:{id:'abc'} }
 */
function parseHash(hash) {
  const clean = (hash || '').replace(/^#/, '');
  const [path, query] = clean.split('?');
  const params = {};
  if (query) {
    for (const kv of query.split('&')) {
      const [k, v] = kv.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  return { path: path || '/', params };
}

/**
 * Navigate vers une route. Met à jour location.hash → trigger hashchange → re-mount.
 * @param {string} path  Ex: '/parcours'
 * @param {Object} params  Ex: { id: 'xxx' }
 */
export function navigate(path, params = {}) {
  let url = '#' + path;
  const keys = Object.keys(params);
  if (keys.length) {
    url += '?' + keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  }
  if (location.hash === url) {
    // Même URL : force un re-mount manuel
    handleRoute();
  } else {
    location.hash = url;
  }
}

/** Mount la page correspondant au hash courant dans `_appEl`. */
async function handleRoute() {
  if (!_appEl) return;
  const { path, params } = parseHash(location.hash);

  // Lookup
  const route = ROUTES[path];
  if (!route) {
    console.warn('[router] route inconnue:', path);
    return navigate('/'); // fallback home
  }

  // 🔒 Vérification authorization
  const cur = getCurUser();
  if (route.roles !== null) {
    // Route protégée — il faut être authentifié
    if (!cur) {
      console.warn('[router] route protégée, redirect login:', path);
      return navigate('/login');
    }
    // Si la route a des rôles spécifiques (array non vide), vérifier qu'on est dedans
    if (Array.isArray(route.roles) && route.roles.length && !route.roles.includes(cur.role)) {
      console.warn('[router] route', path, 'interdite pour rôle', cur.role, '— redirect home');
      return navigate('/');
    }
  }

  try {
    const mod = await route.loader();
    if (typeof mod.mount === 'function') {
      if (path === '/fiche-eleve' || path === '/livret-remc') {
        await mod.mount(_appEl, params.id);
      } else {
        await mod.mount(_appEl);
      }
    } else {
      console.warn('[router] module sans mount():', path);
    }
  } catch (e) {
    console.error('[router] erreur mount route', path, e);
    _appEl.innerHTML = `<pre style="padding:20px;color:#b91c1c">Erreur de navigation: ${e.message}</pre>`;
  }
}

/** Initialise le router (à appeler 1 fois depuis main.js après auth restore). */
export function initRouter(appEl) {
  _appEl = appEl;
  window.addEventListener('hashchange', handleRoute);
  // Si pas de hash, on met '#/' (le publicOrHome décidera selon le rôle)
  if (!location.hash) {
    location.replace('#/');
  } else {
    handleRoute();
  }
}
