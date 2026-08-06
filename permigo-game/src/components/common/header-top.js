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
import { esc } from "@/utils/escape.js";

const STYLE = `
  #header-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: calc(52px + env(safe-area-inset-top, 0px));
    padding-top: env(safe-area-inset-top, 0px);
    /* theme-aware : --su suit le thème, y compris en mode "auto" sur OS sombre
       (où [data-theme="dark"] est absent). Clair=#fff, sombre=#181b30 → rendu identique.
       --chrome-top : posé par les pages nuit (cf. utils/chrome-night.js) pour
       que le bandeau prenne LEUR teinte au lieu de trancher en blanc. */
    background: color-mix(in srgb, var(--chrome-top, var(--su)) 92%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--chrome-bo, var(--bo));
    transition: background .2s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: calc(16px + env(safe-area-inset-left, 0px));
    padding-right: calc(12px + env(safe-area-inset-right, 0px));
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
  /* Élève : le logo ne reste QUE sur Accueil et Boutique (cf. syncLogoVisibility).
     visibility:hidden (pas display:none) : le bouton garde sa place dans le flex
     space-between, sinon le bloc de droite (volants/réglages/avatar) saute à
     gauche sur les pages où le logo disparaît. */
  .pg-logo-btn.ht-logo-hide { visibility: hidden; pointer-events: none; }
  #ht-right { display: flex; align-items: center; gap: 6px; }
  /* Pastille « volants » (monnaie) — élève seulement. Compteur persistant +
     cible permanente pour l'animation des jetons gagnés. */
  .ht-volant {
    display: flex; align-items: center; gap: 5px;
    height: 32px; padding: 0 11px 0 7px;
    border-radius: 999px; cursor: pointer;
    border: 1px solid color-mix(in srgb, #f5b50a 38%, var(--chrome-bo, var(--bo)));
    background: linear-gradient(180deg,
      color-mix(in srgb, #ffd87a 24%, var(--chrome-btn, var(--su))),
      var(--chrome-btn, var(--su)));
    color: var(--chrome-ink, var(--ink));
    font: 800 13.5px/1 'Archivo', system-ui, sans-serif;
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
    border: 1px solid var(--chrome-bo, var(--bo));
    background: var(--chrome-btn, var(--su, #fff));
    color: var(--chrome-ink, var(--ink));
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
    color: var(--chrome-a, var(--a-txt));
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
  /* Aperçu volants : petite carte ancrée sous la pastille, avant redirection
     boutique. Positionnée en JS (position: fixed, top/left calculés depuis le
     bouton) → pas de dépendance à un parent positionné. */
  .ht-volant-pop {
    position: fixed;
    z-index: 320;
    width: 232px;
    max-width: calc(100vw - 24px);
    padding: 16px;
    border-radius: 16px;
    background: var(--su, #fff);
    border: 1px solid var(--bo);
    box-shadow: 0 14px 32px rgba(0,0,0,.22), 0 2px 10px rgba(0,0,0,.12);
    color: var(--ink);
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px;
  }
  .ht-vp-top { display: flex; align-items: center; gap: 8px; }
  .ht-vp-bal {
    font: 800 22px/1 'Archivo', system-ui, sans-serif;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  .ht-vp-txt { margin: 0; font: 600 12.5px/1.4 'Archivo', sans-serif; color: var(--mu); }
  .ht-vp-cta {
    margin-top: 2px; width: 100%; min-height: 40px; border: 0; border-radius: 12px; cursor: pointer;
    background: var(--a, #6366f1); color: var(--a-txt, #fff);
    font: 800 13.5px/1 'Archivo', sans-serif;
    transition: transform .1s ease;
  }
  .ht-vp-cta:active { transform: scale(.96); }
`;

// Nom de route courant, calqué sur router.js (segment 0 du hash, sans query).
function _routeNameFromHash(hash) {
  return (
    (hash || "").replace(/^#\/?/, "").split("?")[0].split("/")[0] || "default"
  );
}

// Le logo ne reste que sur Accueil (#/) et Boutique (#/boutique) — décision
// Rayan (audit visuel). Élève seulement : le header est aussi monté pour
// moniteur/gérant/owner, dont le comportement n'a pas été demandé et ne doit
// pas changer.
function syncLogoVisibility() {
  const btn = document.querySelector("#ht-logo");
  if (!btn) return;
  const me = getCurUser();
  if (me?.role !== "eleve") {
    btn.classList.remove("ht-logo-hide");
    return;
  }
  const routeName = _routeNameFromHash(location.hash);
  const visible = routeName === "default" || routeName === "boutique";
  btn.classList.toggle("ht-logo-hide", !visible);
}

// ── Aperçu volants (bulle avant redirection boutique) ──────────────────────
let _volantPop = null;
function _onDocClickVolantPop(e) {
  if (!_volantPop) return;
  if (_volantPop.contains(e.target)) return;
  if (e.target.closest?.("#ht-volant-btn")) return;
  closeVolantPop();
}
function closeVolantPop() {
  if (!_volantPop) return;
  _volantPop.remove();
  _volantPop = null;
  document
    .querySelector("#ht-volant-btn")
    ?.setAttribute("aria-expanded", "false");
  document.removeEventListener("click", _onDocClickVolantPop, true);
}
function openVolantPop(btn) {
  closeVolantPop();
  const bal = btn.querySelector("[data-volant-count]")?.textContent || "0";
  const pop = document.createElement("div");
  pop.className = "ht-volant-pop anim-slide-up";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "Tes volants");
  pop.innerHTML = `
    <div class="ht-vp-top">
      ${volantImg(26, { drop: true })}
      <span class="ht-vp-bal">${esc(bal)}</span>
    </div>
    <p class="ht-vp-txt">Monnaie utilisable dans le jeu</p>
    <button class="ht-vp-cta" type="button" id="ht-vp-go">Voir la boutique</button>
  `;
  document.body.appendChild(pop);
  _volantPop = pop;

  const r = btn.getBoundingClientRect();
  const left = Math.min(
    Math.max(8, r.right - pop.offsetWidth),
    window.innerWidth - pop.offsetWidth - 8,
  );
  pop.style.top = `${r.bottom + 8}px`;
  pop.style.left = `${left}px`;

  btn.setAttribute("aria-expanded", "true");
  pop.querySelector("#ht-vp-go")?.addEventListener("click", () => {
    closeVolantPop();
    location.hash = "#/boutique";
  });
  // Différé au tick suivant : sinon le clic qui vient d'ouvrir la bulle
  // (même event, phase bubble) la refermerait aussitôt.
  setTimeout(() => {
    document.addEventListener("click", _onDocClickVolantPop, true);
  }, 0);
  window.addEventListener("hashchange", closeVolantPop, { once: true });
}

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
          ? `<button class="ht-volant" id="ht-volant-btn" type="button" data-volant-balance aria-haspopup="dialog" aria-expanded="false" aria-label="Tes volants. Voir le détail" title="Tes volants">
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
  syncLogoVisibility();
  if (!window.__pgHeaderLogoListener) {
    window.__pgHeaderLogoListener = true;
    window.addEventListener("hashchange", syncLogoVisibility);
  }

  bar.querySelector("#ht-avatar")?.addEventListener("click", () => {
    location.hash = "#/profil";
  });

  // Pastille volants → petit aperçu (solde + « Voir la boutique ») avant la
  // redirection. Un clic à côté ferme l'aperçu (cf. openVolantPop/closeVolantPop).
  bar.querySelector("#ht-volant-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    if (_volantPop) closeVolantPop();
    else openVolantPop(btn);
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
  closeVolantPop();
  document.querySelector("#header-bar")?.remove();
}
