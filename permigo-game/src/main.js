// ═══════════════════════════════════════════════════════════════
// PermiGo Game — entry point
// ═══════════════════════════════════════════════════════════════
import "./styles/main.css";
import { restoreSession, sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { route } from "@/router.js";
import { track } from "@/services/analytics.js";
import { startNotifListener } from "@/services/notif-listener.js";
import { toast } from "@/components/common/toast.js";
import { mountHeader } from "@/components/common/header-top.js";
import { mountBottomNav } from "@/components/common/nav-bottom.js";
import { initThemeEarly, syncFromPrefs } from "@/utils/theme.js";
import { initAccentEarly } from "@/utils/accent.js";
import { initGameState, initEquippedTheme } from "@/utils/game-state.js";
import { mountCookieBanner } from "@/components/common/cookie-banner.js";
import { showLaunchSplash } from "@/components/common/launch-splash.js";
import { initPosthog } from "@/services/posthog.js";
import { initVercelAnalytics } from "@/services/vercel-analytics.js";
import "@/utils/pwa.js"; // capte beforeinstallprompt très tôt

// Apply saved/system theme before any rendering (reads localStorage, synchronous)
initThemeEarly();
initAccentEarly();

// Écran d'accueil global au lancement (overlay, 1×/session)
showLaunchSplash();

const app = document.getElementById("app");

async function boot() {
  try {
    await restoreSession();
    const me = getCurUser();
    track("app.opened", { role: me?.role || "guest" });

    // Sync theme preference from backend (non-blocking — fallback already applied by initThemeEarly)
    if (me) syncFromPrefs(sb).catch(() => {});

    // Init game state: loads user_preferences.custom into localStorage (DB wins)
    if (me) {
      initEquippedTheme();
      initGameState(me.id).catch(() => {});
    }

    // Consentement parental : page publique par token, accessible connecté ou non
    if (location.hash.startsWith("#/parental-consent")) {
      const { mount } = await import("@/pages/public/parental-consent.js");
      return mount(app);
    }

    if (!me) {
      // Pages publiques accessibles sans authentification
      if (location.hash.startsWith("#/signup")) {
        const { mount } = await import("@/pages/public/signup.js");
        return mount(app);
      }
      if (location.hash.startsWith("#/ecole/")) {
        const slug = location.hash.replace("#/ecole/", "").split("?")[0];
        const { mount } = await import("@/pages/public/ecole.js");
        return mount(app, slug);
      }
      if (location.hash.startsWith("#/legal")) {
        const { mount } = await import("@/pages/common/legal.js");
        return mount(app);
      }
      // Connexion explicite (depuis la landing)
      if (location.hash.startsWith("#/login")) {
        const { mount } = await import("@/pages/auth/login.js");
        return mount(app);
      }
      // Défaut visiteur = landing / page de vente
      const { mount } = await import("@/pages/public/landing.js");
      return mount(app);
    }

    // RGPD : élève mineur (<15 ans) en attente du consentement parental → bloqué
    if (
      me.role === "eleve" &&
      me.parental_consent_required &&
      !me.parental_consent_given_at
    ) {
      const { mountConsentBlocked } =
        await import("@/pages/eleve/consent-blocked.js");
      mountConsentBlocked(app, me);
      return; // pas de chrome, aucun accès tant que pas consenti
    }

    // Onboarding magique — élèves jamais passés par le flow d'accueil
    if (
      me.role === "eleve" &&
      !me.first_value_action_at &&
      !localStorage.getItem("permigo_eleve_onboarding_done")
    ) {
      const { mount } = await import("@/pages/onboarding/index.js");
      await mount(app);
      return; // pas de chrome pendant l'onboarding
    }

    await route(app, me);

    // Mount persistent chrome (header + bottom nav)
    await mountHeader();
    mountBottomNav(me.role);
    document.body.classList.add("has-chrome");

    startNotifListener();

    // Nudge "Installe PermiGo" — auto-détection iOS/Android, install natif
    // en 1 tap si dispo, snooze 3 jours. No-op si déjà installée / desktop.
    import("@/components/common/install-nudge.js")
      .then((m) => m.maybeShowInstallNudge(me))
      .catch(() => {});
  } catch (e) {
    console.error("[boot]", e);
    track("app.crashed", { error: e?.message });
    app.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100dvh;gap:14px;padding:32px;text-align:center;background:var(--bg);color:var(--ink)">
        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="var(--am)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        <div style="font:800 17px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);letter-spacing:-.02em">Quelque chose a planté</div>
        <div style="font:500 13px/1.5 'Inter',sans-serif;color:var(--mu)">Une erreur inattendue est survenue.<br>Recharge la page pour réessayer.</div>
        <button onclick="location.reload()" style="margin-top:6px;padding:13px 28px;min-height:44px;background:var(--a);color:var(--a-ink);border:none;border-radius:12px;font:700 14px 'Plus Jakarta Sans',sans-serif;cursor:pointer;letter-spacing:-.01em">
          Recharger l'app
        </button>
      </div>
    `;
  }
}

boot();

// Bandeau cookies (RGPD) — affiché tant qu'aucun choix n'est mémorisé,
// indépendamment de l'état d'authentification.
mountCookieBanner();

// PostHog : init immédiat si déjà consenti (visite précédente), ou attend le bandeau.
initPosthog();
initVercelAnalytics();
window.addEventListener("permigo:consent", (e) => {
  if (e.detail === "all") {
    initPosthog();
    initVercelAnalytics();
  }
});

// Offline / online feedback
window.addEventListener("offline", () =>
  toast("Pas de connexion internet", "error", 5000),
);
window.addEventListener("online", () =>
  toast("Connexion rétablie ✓", "success", 2500),
);

// PWA service worker (production only)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
