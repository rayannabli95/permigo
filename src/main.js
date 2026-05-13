/**
 * Point d'entrée de l'app — bootstrap.
 *
 * Ordre :
 *  1. Charge les styles
 *  2. Restore session Supabase si présente
 *  3. Monte le router
 *  4. Cache le splash
 */

import './styles/main.css';
import { restoreSession, sb } from './auth/auth.js';
import { setupAuthListener } from './auth/auth-listener.js';
import { getCurUser, onUserChange } from './auth/cur-user.js';
import { toast } from './components/toast.js';
import { initRouter } from './router.js';
import { mountBottomNav, unmountBottomNav } from './components/nav-bottom.js';
import { showRocketLoader, hideRocketLoader } from './components/rocket-loader.js';
import { initTheme } from './components/theme-toggle.js';
import { initEquippedTheme } from './utils/game-state.js';
import { mountCommandPalette, unmountCommandPalette } from './components/command-palette.js';

async function boot() {
  console.log('[boot] PermiGo v7 démarrage…');
  console.log('[boot] sb client :', sb ? 'OK' : 'NULL — vérifie .env');

  // Init theme (light/dark/auto) AVANT le 1er render pour éviter le flash
  initTheme();
  // Ré-applique la couleur d'accent équipée (si l'user a acheté un theme)
  initEquippedTheme();

  // Affiche le rocket loader plein écran pendant le boot (logo + fusée)
  showRocketLoader({ label: 'PermiGo · En route' });

  // Splash minimum 3 secondes — le boot continue en parallèle.
  const splashMinDelay = new Promise(r => setTimeout(r, 3000));

  // 1. Restore session si l'utilisateur était déjà connecté
  let profile = null;
  try {
    profile = await Promise.race([
      restoreSession(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('restoreSession timeout 5s')), 5000)),
    ]);
    if (profile) console.log('[boot] session restaurée :', profile.nom, '(', profile.role, ')');
    else console.log('[boot] pas de session active');
  } catch (e) {
    console.error('[boot] restoreSession ERREUR :', e);
  }

  // 2. Auth listener Supabase — détecte SIGNED_OUT/SIGNED_IN cross-tab + token expired
  if (sb) setupAuthListener(sb);

  // 3. Hash router : gère / login / accueil / parcours / planning / etc.
  const appEl = document.getElementById('app');
  initRouter(appEl);

  // 4. Bottom nav + Command palette (visible si auth)
  if (profile) {
    mountBottomNav();
    mountCommandPalette();
  }

  // 5. Hook signout / logout → démonte tout + redirige
  const onSignedOut = () => {
    unmountBottomNav();
    unmountCommandPalette();
    if (location.hash !== '#/login') {
      toast('Session terminée', 'info');
      setTimeout(() => { location.hash = '#/login'; }, 300);
    }
  };
  window.addEventListener('auth:signedout', onSignedOut);
  window.addEventListener('auth:loggedout', onSignedOut);

  // 6. Auto-mount au login (events dispatchés par auth.js ET auth-listener.js)
  const onSignedIn = () => { mountBottomNav(); mountCommandPalette(); };
  window.addEventListener('auth:signedin', onSignedIn);
  window.addEventListener('auth:loggedin', onSignedIn);

  // Attendre le délai mini AVANT de cacher le splash (pour l'effet premium 3s)
  await splashMinDelay;
  hideSplash();
}

function hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.style.transition = 'opacity .3s';
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 300);
  }
  // Rocket loader (overlay au-dessus du splash) — fadeout smooth
  hideRocketLoader();
}

boot().catch(err => {
  console.error('[boot] FATAL', err);
  document.body.innerHTML = `<pre style="padding:20px;color:#b91c1c">Erreur de boot:\n${err.message}</pre>`;
});

// ─── PWA : Service Worker (install on iPhone / Android) ───
// Désactivé en dev (Vite HMR cause des conflits)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swPath = (import.meta.env.BASE_URL || '/') + 'sw.js';
    navigator.serviceWorker.register(swPath).catch(err => console.warn('[sw] register err', err));
  });
}
