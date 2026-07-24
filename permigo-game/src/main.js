// ═══════════════════════════════════════════════════════════════
// PermiGo Game — entry point
// ═══════════════════════════════════════════════════════════════
import "./styles/main.css";
import { restoreSession, sb } from "@/auth/auth.js";
import { setupAuthListener } from "@/auth/auth-listener.js";
import { getCurUser } from "@/auth/cur-user.js";
import {
  route,
  reloadOnceOnChunkError,
  clearChunkReloadGuard,
} from "@/router.js";
import { accessGateFor } from "@/auth/route-guards.js";
import { track } from "@/services/analytics.js";
import { startNotifListener } from "@/services/notif-listener.js";
import { toast } from "@/components/common/toast.js";
import { mountHeader } from "@/components/common/header-top.js";
import { mountBottomNav } from "@/components/common/nav-bottom.js";
import { armPopupPhase, notifyPopupSettled } from "@/utils/intro-overlays.js";
import { initThemeEarly, syncFromPrefs, applyTheme } from "@/utils/theme.js";
import { initLangEarly, syncLangFromPrefs } from "@/utils/lang.js";
import { initAccentEarly, applyAccent } from "@/utils/accent.js";
import { initGameState, initEquippedTheme } from "@/utils/game-state.js";
import { mountCookieBanner } from "@/components/common/cookie-banner.js";
import { initPosthog } from "@/services/posthog.js";
import { initVercelAnalytics } from "@/services/vercel-analytics.js";
import { tapHaptic } from "@/utils/haptic.js";
import "@/utils/pwa.js"; // capte beforeinstallprompt très tôt

// Apply saved/system theme before any rendering (reads localStorage, synchronous)
initThemeEarly();
initAccentEarly();
initLangEarly(); // pose <html lang> depuis le miroir localStorage (sync)

const app = document.getElementById("app");

async function boot() {
  try {
    await restoreSession();
    const me = getCurUser();
    track("app.opened", { role: me?.role || "guest" });

    // Défaut de marque côté élève : violet (= l'accent de l'accueil refondu),
    // pour que le chrome (header/nav, qui suit --a) soit cohérent avec l'accueil.
    // On n'applique QUE si l'élève n'a pas explicitement choisi d'accent
    // (un choix dans Réglages/onboarding gagne) et avant l'éventuel thème équipé.
    if (me?.role === "eleve") {
      try {
        if (!localStorage.getItem("permigo-accent")) applyAccent("violet");
        // Défaut CLAIR pour l'élève (DA « clair premium », décision Rayan
        // 16/07). On ne force QUE le tout premier affichage (aucune préférence
        // encore posée) — dès qu'il choisit sombre dans Réglages, ça prime.
        // Persiste 'light' sinon syncFromPrefs repasserait en 'auto' → système.
        if (!localStorage.getItem("permigo_theme")) applyTheme("light");
      } catch {
        /* localStorage indispo → tant pis, on garde le défaut global */
      }
    }

    // Sync theme preference from backend (non-blocking — fallback already applied by initThemeEarly)
    if (me) syncFromPrefs(sb).catch(() => {});
    // Idem pour la langue élève (miroir déjà posé par initLangEarly)
    if (me) syncLangFromPrefs(sb).catch(() => {});

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
      // Création de compte self-serve (moniteur indépendant — flow commercial #1)
      if (location.hash.startsWith("#/creer-compte")) {
        const { mount } = await import("@/pages/public/creer-compte.js");
        return mount(app);
      }
      // Activation de compte via invitation (token requis)
      if (location.hash.startsWith("#/signup")) {
        const { mount } = await import("@/pages/public/signup.js");
        return mount(app);
      }
      // Inscription élève self-serve via code moniteur (chemin bis à l'invitation)
      if (location.hash.startsWith("#/rejoindre")) {
        const { mount } = await import("@/pages/public/rejoindre.js");
        return mount(app);
      }
      if (location.hash.startsWith("#/ecole/")) {
        const slug = location.hash.replace("#/ecole/", "").split("?")[0];
        const { mount } = await import("@/pages/public/ecole.js");
        return mount(app, slug);
      }
      // Pré-vente Pass Permis élève (lien partageable : /#/pass)
      if (location.hash.startsWith("#/pass")) {
        const { mount } = await import("@/pages/public/pass.js");
        return mount(app);
      }
      // Landing B2B auto-écoles + demande de devis (lien partageable : /#/pro)
      if (
        location.hash === "#/pro" ||
        location.hash.startsWith("#/pro?") ||
        location.hash.startsWith("#/pro/") ||
        location.hash.startsWith("#/devis") ||
        location.hash.startsWith("#/auto-ecole")
      ) {
        const { mount } = await import("@/pages/public/pro.js");
        return mount(app);
      }
      // Questionnaire de départ (résiliation / remboursement)
      if (location.hash.startsWith("#/avis-depart")) {
        const { mount } = await import("@/pages/public/avis-depart.js");
        return mount(app);
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
      // Défaut visiteur = page de vente Pass Permis (ancienne landing
      // moniteur supprimée — décision Rayan 16/07/2026).
      const { mount } = await import("@/pages/public/pass.js");
      return mount(app);
    }

    // Définition du mot de passe (lien de récupération reçu par email) →
    // priorité absolue, AVANT tout gating (consentement, onboarding). La
    // session est déjà établie par detectSessionInUrl ; on monte l'écran
    // focalisé sans chrome. Sinon un élève tout neuf tomberait sur l'onboarding.
    if (location.hash.startsWith("#/nouveau-mdp")) {
      const { mount } = await import("@/pages/auth/nouveau-mdp.js");
      await mount(app);
      return;
    }

    // Verrou moniteur (essai gratuit 14 j → abonnement). Statut calculé UNE
    // fois au boot (RPC serveur) et attaché à `me` : accessGateFor le rejoue à
    // chaque navigation sans re-fetch. Fail-open (ne bloque pas sur erreur).
    if (me.role === "enseignant") {
      const { getMoniteurAccess } = await import("@/services/billing.js");
      me.moniteurAccess = await getMoniteurAccess();
    } else if (me.role === "eleve" && !me.enseignant_id) {
      // Élève SOLO (pas de moniteur) : vérifie le verrou Pass. Les élèves
      // rattachés à un moniteur (enseignant_id présent) sont gratuits → on saute
      // le RPC pour eux.
      const { getEleveAccess } = await import("@/services/billing.js");
      me.eleveAccess = await getEleveAccess();
    }

    // Murs d'accès (consentement parental mineur, onboarding élève neuf).
    // Source unique partagée avec le router (accessGateFor) → les deux chemins
    // — boot ET navigation par hash — appliquent EXACTEMENT les mêmes règles.
    const gate = accessGateFor(me);
    if (gate) {
      await gate(app, me);
      return; // pas de chrome tant que le mur n'est pas levé
    }

    // Coordination overlays 1er lancement : on arme la phase popup AVANT le
    // rendu de la page, pour que le tuto guidé (lancé pendant route()) attende
    // que le popup d'engagement soit résolu avant de démarrer.
    armPopupPhase();

    await route(app, me);

    // Mount persistent chrome (header + bottom nav)
    await mountHeader();
    mountBottomNav(me.role);
    document.body.classList.add("has-chrome");
    // Marqueur de rôle → permet de scoper un thème par rôle (ex: arcade enseignant)
    document.body.dataset.role = me.role || "";

    if (me.role === "eleve") startNotifListener();

    // Boucle d'engagement notifs :
    //  - app installée (standalone) → primer « active tes rappels » (sur iOS,
    //    l'API Notification n'existe QUE là, et le storage est neuf → c'est
    //    l'UNIQUE moment où on peut obtenir la permission)
    //  - navigateur mobile → PLUS de nudge d'install à froid (l'élève le ferme
    //    par réflexe). L'install est proposée à un moment de valeur : 1er quiz
    //    réussi (roue offerte), séance validée… cf. promptInstallAtValueMoment.
    import("@/utils/pwa.js")
      .then(({ isStandalone }) => {
        if (isStandalone())
          import("@/components/common/push-prime.js").then((m) =>
            m.maybeShowPushPrime(me),
          );
        else notifyPopupSettled(); // aucun popup à froid → libère le tuto guidé
      })
      .catch(() => notifyPopupSettled());

    // Prefetch idle des routes chaudes (navigation instantanée au tap).
    // requestIdleCallback → jamais en concurrence avec le rendu initial.
    const HOT = {
      eleve: [
        () => import("@/pages/eleve/parcours.js"),
        () => import("@/pages/eleve/quiz.js"),
        () => import("@/pages/eleve/classement.js"),
      ],
      enseignant: [
        () => import("@/pages/enseignant/mes-eleves.js"),
        () => import("@/pages/enseignant/log-session.js"),
      ],
      gerant: [() => import("@/pages/gerant/pulse.js")],
      owner: [() => import("@/pages/gerant/owner.js")],
    };
    const prefetch = () =>
      (HOT[me.role] || []).forEach((load) => load().catch(() => {}));
    if ("requestIdleCallback" in window)
      requestIdleCallback(prefetch, { timeout: 4000 });
    else setTimeout(prefetch, 2500);
  } catch (e) {
    console.error("[boot]", e);
    if (reloadOnceOnChunkError(e)) throw e;
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
    throw e;
  }
}

// Le listener auth est branché APRÈS le boot (évite le deadlock sur getSession
// au démarrage) : il resynchronise l'app quand la session change pendant qu'elle
// est ouverte (login/logout dans un autre onglet, changement de compte).
boot()
  .then(() => clearChunkReloadGuard())
  .catch(() => {})
  .finally(() => setupAuthListener(sb));

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

// Immersion : retour haptique léger sur chaque tap d'élément interactif.
// (Android : vibration · iPhone : hack switch · desktop : no-op · silencieux.)
document.addEventListener(
  "click",
  (e) => {
    const t = e.target?.closest?.(
      'button, a[href], [role="button"], .tappable, label, .bn-tab, [data-haptic]',
    );
    if (!t || t.closest("[data-no-haptic]")) return;
    tapHaptic();
  },
  { capture: true, passive: true },
);

// ⛔ Tick haptique au DÉFILEMENT : RETIRÉ (décision Rayan, 2026-07-16).
// Le scroll automatique d'ouverture du clavier le déclenchait en rafale
// (« l'écran vibre, on ne peut pas taper ») — gadget à ne PAS rebrancher.

// PWA service worker (production only)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
