// ═══════════════════════════════════════════════════════════════
// Header Top — logo PermiGo (gauche) + volants/réglages/avatar (droite)
// Cloche notifs retirée (2026-06) : les notifs se gèrent depuis le profil.
// Usage : await mountHeader() depuis main.js après route()
// ═══════════════════════════════════════════════════════════════

import { getCurUser } from "@/auth/cur-user.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import {
  getEquippedAsset,
  getGemmes,
  refreshGemmes,
} from "@/utils/game-state.js";
import { icon } from "@/utils/icons.js";
import { volantImg } from "@/utils/volant.js";

const STYLE = `
  #header-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: calc(52px + env(safe-area-inset-top, 0px));
    padding-top: env(safe-area-inset-top, 0px);
    /* theme-aware : --su suit le thème, y compris en mode "auto" sur OS sombre
       (où [data-theme="dark"] est absent). Clair=#fff, sombre=#181b30 → rendu identique. */
    background: color-mix(in srgb, var(--su) 92%, transparent);
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
    border-radius: var(--r-sm);
    transition: background .12s;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .pg-logo-btn:active { background: color-mix(in srgb, var(--a) 8%, transparent); }
  .pg-logo-img { width: 36px; height: 36px; display: block; object-fit: contain; }
  #ht-right { display: flex; align-items: center; gap: 6px; }
  /* Pastille « volants » (monnaie) — élève seulement. Compteur persistant +
     cible permanente pour l'animation des jetons gagnés. */
  .ht-volant {
    display: flex; align-items: center; gap: 5px;
    height: 32px; padding: 0 11px 0 7px;
    border-radius: 999px; cursor: pointer;
    border: 1px solid color-mix(in srgb, #f5b50a 38%, var(--bo));
    background: linear-gradient(180deg, color-mix(in srgb, #ffd87a 24%, var(--su)), var(--su));
    color: var(--ink);
    font: 800 13.5px/1 'Plus Jakarta Sans', system-ui, sans-serif;
    font-variant-numeric: tabular-nums;
    -webkit-tap-highlight-color: transparent;
    transition: transform .12s;
    flex-shrink: 0;
  }
  .ht-volant:active { transform: scale(.94); }
  .ht-volant .ht-volant-v { display: inline-block; min-width: 8px; }
  .ht-icon-btn {
    width: 44px; height: 44px;
    border-radius: 8px;
    border: 1px solid var(--bo);
    background: var(--su, #fff);
    color: var(--ink);
    cursor: pointer;
    padding: 0;
    display: flex; align-items: center; justify-content: center;
    transition: transform .12s, background .12s, color .12s;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }
  .ht-icon-btn:active { transform: scale(.92); background: var(--bg2, color-mix(in srgb, var(--a) 8%, transparent)); }
  /* Réglages ouverts → l'icône prend la couleur du thème */
  .ht-icon-btn.active {
    color: var(--a);
    border-color: color-mix(in srgb, var(--a) 40%, transparent);
    background: color-mix(in srgb, var(--a) 10%, transparent);
  }
  .ht-avatar-btn {
    width: 44px; height: 44px;
    padding: 0;
    border: 0;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform .12s;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
    position: relative;
  }
  .ht-avatar-btn:active { transform: scale(.92); }
  .ht-avatar-btn > * { pointer-events: none; }
`;

export async function mountHeader() {
  if (!document.head.querySelector("#ht-style")) {
    const s = document.createElement("style");
    s.id = "ht-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  document.querySelector("#header-bar")?.remove();

  const bar = document.createElement("header");
  bar.id = "header-bar";
  bar.setAttribute("role", "banner");
  const me = getCurUser();
  bar.innerHTML = `
    <button class="pg-logo-btn" id="ht-logo" aria-label="Accueil PermiGo">
      <img class="pg-logo-img" src="/skins/avatars/permigo-badge-icon.png" alt="PermiGo" width="36" height="36" />
    </button>
    <div id="ht-right">
      ${
        me?.role === "eleve"
          ? `<button class="ht-volant" id="ht-volant-btn" type="button" data-volant-balance aria-label="Tes volants — ouvrir la boutique" title="Tes volants">
               ${volantImg(18, { drop: true })}
               <span class="ht-volant-v" data-volant-count>${getGemmes()}</span>
             </button>`
          : ""
      }
      ${me ? `<button class="ht-icon-btn" id="ht-settings" aria-label="Réglages" title="Réglages">${icon("settings", { size: 19 })}</button>` : ""}
      ${me ? `<button class="ht-avatar-btn" id="ht-avatar" aria-label="Mon profil" title="Mon profil">${renderUserAvatar({ ...me, avatar_url: getEquippedAsset("avatar") || me.avatar_url }, 36)}</button>` : ""}
    </div>
  `;

  const appEl = document.getElementById("app");
  document.body.insertBefore(bar, appEl);

  bar.querySelector("#ht-logo")?.addEventListener("click", () => {
    location.hash = "#/";
  });

  bar.querySelector("#ht-avatar")?.addEventListener("click", () => {
    location.hash = "#/profil";
  });

  // Pastille volants → boutique (élève).
  bar.querySelector("#ht-volant-btn")?.addEventListener("click", () => {
    location.hash = "#/boutique";
  });
  // Solde sûr : on resynchronise depuis profiles.gemmes (le cache localStorage
  // peut être vide si initGameState a raté la fenêtre auth au boot).
  // Le solde résolu est écrit DIRECTEMENT dans la pastille : l'event
  // pg-gemmes-changed peut partir avant que ce header soit dans le DOM
  // (1re session après inscription → pastille figée à 0 sinon).
  if (me?.role === "eleve") {
    refreshGemmes(me.id)
      .then((bal) => {
        const v = bar.querySelector("[data-volant-count]");
        if (v && typeof bal === "number") v.textContent = String(bal);
      })
      .catch(() => {});
  }
  // Compteur de volants en live (crédit/débit) + rebond. Listener window
  // enregistré une seule fois ; bouton requêté à chaque event (header recréé).
  if (!window.__pgHeaderVolantListener) {
    window.__pgHeaderVolantListener = true;
    window.addEventListener("pg-gemmes-changed", (e) => {
      const bal = e?.detail?.balance;
      const btn = document.querySelector("#ht-volant-btn");
      if (!btn || typeof bal !== "number") return;
      const v = btn.querySelector("[data-volant-count]");
      // Ne rebondit QUE sur un vrai changement de solde (pas sur la simple
      // resynchro à chaque navigation), sinon la pastille saute sans raison.
      const changed = v && v.textContent !== String(bal);
      if (v) v.textContent = String(bal);
      if (changed) {
        import("@/components/eleve/volant-reward.js")
          .then(({ bumpVolantPill }) => bumpVolantPill(btn))
          .catch(() => {});
      }
    });
  }

  // Réglages : accès direct + état actif à la couleur du thème.
  // Le header est recréé à chaque route → listener window enregistré 1 seule
  // fois (même pattern que le listener cosmétique), bouton requêté en live.
  bar.querySelector("#ht-settings")?.addEventListener("click", () => {
    location.hash = "#/settings";
  });
  const syncSettingsActive = () => {
    document
      .querySelector("#ht-settings")
      ?.classList.toggle(
        "active",
        (location.hash || "").startsWith("#/settings"),
      );
  };
  syncSettingsActive();
  if (!window.__pgHeaderSettingsListener) {
    window.__pgHeaderSettingsListener = true;
    window.addEventListener("hashchange", syncSettingsActive);
  }

  // Rafraîchit l'avatar de l'en-tête dès qu'un cosmétique est équipé (sans reload).
  // Listener enregistré une seule fois au niveau window.
  if (!window.__pgHeaderCosmeticListener) {
    window.__pgHeaderCosmeticListener = true;
    window.addEventListener("pg:cosmetics-changed", () => {
      const cur = getCurUser();
      const avBtn = document.querySelector("#ht-avatar");
      if (cur && avBtn) {
        avBtn.innerHTML = renderUserAvatar(
          { ...cur, avatar_url: getEquippedAsset("avatar") || cur.avatar_url },
          36,
        );
      }
    });
  }
}

export function unmountHeader() {
  document.querySelector("#header-bar")?.remove();
}
