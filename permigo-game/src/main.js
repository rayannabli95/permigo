// ═══════════════════════════════════════════════════════════════
// PermiGo Game — entry point
// ═══════════════════════════════════════════════════════════════
import './styles/main.css';
import { restoreSession } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { route } from '@/router.js';
import { track } from '@/services/analytics.js';
import { startNotifListener } from '@/services/notif-listener.js';
import { toast } from '@/components/toast.js';
import { mountHeader } from '@/components/header-top.js';
import { mountBottomNav } from '@/components/nav-bottom.js';

const app = document.getElementById('app');

async function boot() {
  try {
    await restoreSession();
    const me = getCurUser();
    track('app.opened', { role: me?.role || 'guest' });

    if (!me) {
      // Cas spécial : invitation en cours d'activation
      if (location.hash.startsWith('#/signup')) {
        const { mount } = await import('@/pages/public/signup.js');
        return mount(app);
      }
      const { mount } = await import('@/pages/auth/login.js');
      return mount(app);
    }

    await route(app, me);

    // Mount persistent chrome (header + bottom nav)
    await mountHeader();
    mountBottomNav(me.role);
    document.body.classList.add('has-chrome');

    startNotifListener();
  } catch (e) {
    console.error('[boot]', e);
    track('app.crashed', { error: e?.message });
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100dvh;gap:14px;padding:32px;text-align:center">
        <div style="font-size:42px">⚠️</div>
        <div style="font:800 17px/1.3 'Plus Jakarta Sans',sans-serif;color:#0b0d1a;letter-spacing:-.02em">Quelque chose a planté</div>
        <div style="font:500 13px/1.5 'Inter',sans-serif;color:#64748b">Une erreur inattendue est survenue.<br>Recharge la page pour réessayer.</div>
        <button onclick="location.reload()" style="margin-top:6px;padding:13px 28px;background:#6366f1;color:#fff;border:none;border-radius:10px;font:700 14px 'Plus Jakarta Sans',sans-serif;cursor:pointer;letter-spacing:-.01em">
          Recharger l'app
        </button>
      </div>
    `;
  }
}

boot();

// Offline / online feedback
window.addEventListener('offline', () => toast('Pas de connexion internet', 'error', 5000));
window.addEventListener('online',  () => toast('Connexion rétablie ✓', 'success', 2500));

// PWA service worker (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
