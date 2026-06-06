// ═══════════════════════════════════════════════════════════════
// Bottom Nav — barre de navigation rôle-based persistante
// Usage : mountBottomNav(role) depuis main.js après route()
// ═══════════════════════════════════════════════════════════════

import { haptic } from "@/utils/haptic.js";

const ICO = {
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
  map: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  trophy: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
  user: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  check: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  users: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  book: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  bag: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  activity: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  chart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  gift: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 21 12 13 4 21"/><polyline points="4 3 12 11 20 3"/><line x1="12" y1="11" x2="12" y2="21"/><line x1="4" y1="3" x2="20" y2="3"/><line x1="4" y1="3" x2="4" y2="13"/><line x1="20" y1="3" x2="20" y2="13"/></svg>`,
};

const TABS = {
  eleve: [
    { id: "default", label: "Accueil", icon: ICO.home },
    { id: "parcours", label: "Parcours", icon: ICO.map },
    { id: "boutique", label: "Boutique", icon: ICO.bag },
    { id: "trophees", label: "Trophées", icon: ICO.trophy },
    { id: "profil", label: "Profil", icon: ICO.user },
  ],
  enseignant: [
    { id: "default", label: "Aujourd'hui", icon: ICO.activity },
    { id: "eleves", label: "Mes élèves", icon: ICO.users },
    { id: "parcours", label: "Parcours", icon: ICO.map },
    { id: "insights", label: "Stats", icon: ICO.chart },
    { id: "recompenses", label: "Récompenses", icon: ICO.gift },
  ],
  gerant: [
    { id: "default", label: "Pulse", icon: ICO.activity },
    { id: "equipe", label: "Équipe", icon: ICO.users },
    { id: "eleves", label: "Élèves", icon: ICO.users },
    { id: "profil", label: "Profil", icon: ICO.user },
  ],
};

const STYLE = `
  #bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: calc(60px + env(safe-area-inset-bottom, 0px));
    background: var(--su);
    border-top: 1px solid var(--bo);
    display: flex;
    align-items: stretch;
    z-index: 300;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  #bottom-nav[hidden] { display: none !important; } /* #11 — masquée pendant les épreuves */
  .bn-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 4px 8px;
    cursor: pointer;
    color: var(--mu2);
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
    background: var(--a);
    border-radius: 0 0 3px 3px;
    transition: transform .2s cubic-bezier(.34,1.56,.64,1);
  }
  .bn-tab.active {
    color: var(--a);
  }
  .bn-tab.active::after {
    transform: translateX(-50%) scaleX(1);
  }
  .bn-tab svg { display: block; flex-shrink: 0; }
  /* Label : visible sous l'onglet actif uniquement. Positionné en absolu
     pour que le picto reste centré — aucun reflow au changement d'onglet. */
  .bn-label {
    position: absolute;
    left: 0; right: 0;
    bottom: 5px;
    text-align: center;
    font: 700 10px/1 'Inter', sans-serif;
    letter-spacing: .01em;
    white-space: nowrap;
    opacity: 0;
    transform: translateY(3px);
    pointer-events: none;
    transition: opacity .18s ease, transform .2s cubic-bezier(.34,1.56,.64,1);
  }
  .bn-tab.active .bn-label {
    opacity: 1;
    transform: translateY(0);
  }
  @media (prefers-reduced-motion: reduce) {
    .bn-label { transition: opacity .12s ease; transform: none; }
  }
  .bn-tab:active { transform: scale(.93); transition: transform .12s; }

  /* ── FAB flottant "Séance" (enseignant seulement) ── */
  @keyframes bnFabIn {
    from { opacity: 0; transform: scale(.85) translateY(6px); }
    to   { opacity: 1; transform: scale(1)   translateY(0);   }
  }
  #bn-seance-fab {
    position: fixed;
    right: 20px;
    bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    z-index: 310;
    width: 56px; height: 56px;
    border-radius: 50%;
    background: var(--ink, #0a0d1a);
    color: #fff;
    border: none; padding: 0;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    -webkit-tap-highlight-color: transparent;
    box-shadow:
      0 8px 20px -6px rgba(10,13,26,.55),
      0 3px 8px -2px rgba(10,13,26,.2),
      inset 0 0 0 1px rgba(255,255,255,.08);
    animation: bnFabIn .3s cubic-bezier(.34,1.56,.64,1) both;
    transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease;
  }
  #bn-seance-fab:active {
    transform: scale(.9);
    box-shadow: 0 4px 12px -4px rgba(10,13,26,.5), inset 0 0 0 1px rgba(255,255,255,.12);
  }
  @media (hover: hover) and (pointer: fine) {
    #bn-seance-fab:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -8px rgba(10,13,26,.6), inset 0 0 0 1px rgba(255,255,255,.12);
    }
  }
  #bn-seance-fab:focus-visible {
    outline: 2px solid var(--a);
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    #bn-seance-fab { animation: none !important; transition: none !important; }
  }

  /* FAB haut = 76+56=132px du bas — on pousse #app pour que rien ne se cache dessous */
  body.has-enseignant-fab #app {
    padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px));
  }
`;

export function mountBottomNav(role) {
  if (!document.head.querySelector("#bn-style")) {
    const s = document.createElement("style");
    s.id = "bn-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  document.querySelector("#bottom-nav")?.remove();

  const tabs = TABS[role] || TABS.eleve;
  const nav = document.createElement("nav");
  nav.id = "bottom-nav";
  nav.setAttribute("aria-label", "Navigation principale");
  nav.innerHTML = tabs
    .map(
      (t) => `
      <button class="bn-tab" data-id="${t.id}" aria-label="${t.label}">
        ${t.icon}
        <span class="bn-label">${t.label}</span>
      </button>
    `,
    )
    .join("");

  document.body.appendChild(nav);
  _updateActive();

  nav.querySelectorAll("[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      haptic("tap");
      const id = btn.dataset.id;
      location.hash = id === "default" ? "#/" : `#/${id}`;
    });
  });

  // FAB flottant "Séance" — monté uniquement pour les enseignants
  if (role === "enseignant") {
    const fab = document.createElement("button");
    fab.id = "bn-seance-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Enregistrer une séance");
    fab.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    fab.addEventListener("click", () => {
      haptic("select");
      location.hash = "#/log-session";
    });
    document.body.appendChild(fab);
    document.body.classList.add("has-enseignant-fab");
  }

  window.addEventListener("hashchange", _updateActive);
}

export function unmountBottomNav() {
  document.querySelector("#bottom-nav")?.remove();
  document.getElementById("bn-seance-fab")?.remove();
  document.body.classList.remove("has-enseignant-fab");
  window.removeEventListener("hashchange", _updateActive);
}

function _updateActive() {
  const nav = document.querySelector("#bottom-nav");
  if (!nav) return;
  const section =
    (location.hash || "").replace(/^#\/?/, "").split("/")[0] || "default";
  nav.querySelectorAll("[data-id]").forEach((btn) => {
    const active = btn.dataset.id === section;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-current", active ? "page" : "false");
  });
}
