// ═══════════════════════════════════════════════════════════════
// Header Top — logo PermiGo (gauche) + cloche notifications (droite)
// Usage : await mountHeader() depuis main.js après route()
// ═══════════════════════════════════════════════════════════════

import { mountNotifBell } from "@/components/common/notif-bell.js";
import { getCurUser } from "@/auth/cur-user.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { getEquippedAsset } from "@/utils/game-state.js";
import { icon } from "@/utils/icons.js";

const STYLE = `
  #header-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: calc(52px + env(safe-area-inset-top, 0px));
    padding-top: env(safe-area-inset-top, 0px);
    background: rgba(255,255,255,.92);
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
  .ht-icon-btn {
    width: 36px; height: 36px;
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
  /* Hit-area 44x44 sans grossir le visuel */
  .ht-icon-btn::before { content: ''; position: absolute; inset: -4px; }
  .ht-icon-btn:active { transform: scale(.92); background: var(--bg2, color-mix(in srgb, var(--a) 8%, transparent)); }
  /* Réglages ouverts → l'icône prend la couleur du thème */
  .ht-icon-btn.active {
    color: var(--a);
    border-color: color-mix(in srgb, var(--a) 40%, transparent);
    background: color-mix(in srgb, var(--a) 10%, transparent);
  }
  .ht-avatar-btn {
    width: 36px; height: 36px;
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
  /* Hit-area 44x44 sans grossir le visuel */
  .ht-avatar-btn::before { content: ''; position: absolute; inset: -4px; }
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
      <div id="ht-bell"></div>
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

  await mountNotifBell(bar.querySelector("#ht-bell"));
}

export function unmountHeader() {
  document.querySelector("#header-bar")?.remove();
}
