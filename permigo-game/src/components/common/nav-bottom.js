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

// Variantes PLEINES (état actif) — remplies à la couleur du thème (--a).
// currentColor : la couleur vient du .bn-tab.active.
const ICO_FILL = {
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6 2.5 10.5V21a1 1 0 0 0 1 1H9.5v-6.5h5V22h6a1 1 0 0 0 1-1V10.5L12 2.6z"/></svg>`,
  map: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="1 6 7.5 2.3 7.5 18.3 1 22"/><polygon points="9 2.5 15 5.5 15 21.5 9 18.5"/><polygon points="16.5 6 23 2.3 23 18.3 16.5 22"/></svg>`,
  trophy: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6v2H2.5a.5.5 0 0 0-.5.5V6a4.5 4.5 0 0 0 4.36 4.5A6 6 0 0 0 11 14.92V18H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-3v-3.08a6 6 0 0 0 4.64-4.42A4.5 4.5 0 0 0 22 6V4.5a.5.5 0 0 0-.5-.5H18V2zM4 6v-.5h2v2.9A2.5 2.5 0 0 1 4 6zm16 0a2.5 2.5 0 0 1-2 2.4V5.5h2V6z"/></svg>`,
  user: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2c0-2.76-3.58-5-8-5z"/></svg>`,
  users: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.87 0-7 1.92-7 4.3V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.7c0-2.38-3.13-4.3-7-4.3zm7-2.1a4 4 0 0 0 0-7.75 5.96 5.96 0 0 1 0 7.75zM17.5 13.4c1.99.96 3.5 2.5 3.5 4.9V21h2a1 1 0 0 0 1-1v-2.7c0-2-2.21-3.66-5.1-4.18-.45-.08-.93.07-1.4.28z"/></svg>`,
  bag: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zm.9 2h10.2l1.5 2H5.4l1.5-2zM12 13a4 4 0 0 1-4-4h2a2 2 0 1 0 4 0h2a4 4 0 0 1-4 4z"/></svg>`,
  chart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="16" y="9" width="4" height="11" rx="1"/><rect x="10" y="3" width="4" height="17" rx="1"/><rect x="4" y="13" width="4" height="7" rx="1"/></svg>`,
  // Tracé non remplissable : version épaissie (le passage à la couleur thème suffit)
  activity: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
};

const TABS = {
  eleve: [
    { id: "default", label: "Accueil", ico: "home" },
    { id: "parcours", label: "Parcours", ico: "map" },
    { id: "boutique", label: "Boutique", ico: "bag" },
    { id: "trophees", label: "Trophées", ico: "trophy" },
    { id: "profil", label: "Profil", ico: "user" },
  ],
  enseignant: [
    { id: "default", label: "Aujourd'hui", ico: "activity" },
    { id: "eleves", label: "Mes élèves", ico: "users" },
    // « Progression » regroupe Parcours + Trophées + Ligue (décision figée).
    // L'onglet « Récompenses » (gemmes) a été retiré : monnaie = validations.
    {
      id: "parcours",
      label: "Progression",
      ico: "trophy",
      match: ["parcours-complet", "trophees-moniteur", "ligue-semaine"],
    },
    { id: "insights", label: "Stats", ico: "chart" },
  ],
  gerant: [
    { id: "default", label: "Pulse", ico: "activity" },
    { id: "equipe", label: "Équipe", ico: "users" },
    { id: "eleves", label: "Élèves", ico: "users" },
    { id: "profil", label: "Profil", ico: "user" },
  ],
  // Owner (plateforme) — V1 : vue d'ensemble agrégée + profil.
  owner: [
    { id: "default", label: "Plateforme", ico: "chart" },
    { id: "profil", label: "Profil", ico: "user" },
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
    transition: color .15s var(--ease);
  }
  /* Actif = icône PLEINE à la couleur du thème + label + halo « limelight »
     (défini plus bas) qui se pose sur l'onglet et glisse de l'un à l'autre. */
  .bn-tab.active {
    color: var(--a);
  }
  .bn-tab svg { display: block; flex-shrink: 0; }
  .bn-ico-fill { display: none; }
  .bn-tab.active .bn-ico-line { display: none; }
  .bn-tab.active .bn-ico-fill { display: block; }
  .bn-ico-line, .bn-ico-fill { line-height: 0; }
  .bn-tab.active .bn-ico-fill svg { animation: bnFillPop .25s var(--ease-spring); }
  @keyframes bnFillPop { from { transform: scale(.82); } to { transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { .bn-tab.active .bn-ico-fill svg { animation: none; } }

  /* ── Limelight : halo « projecteur » posé sur l'onglet actif, qui GLISSE
     quand on change de page (le repère « tu es ici »). Décoratif (aria-hidden) :
     l'état actif reste porté par aria-current + icône pleine + label, donc on
     ne dépend jamais de la couleur seule. Position pilotée en translateX
     (transform only → pas de reflow), glissé spring léger. */
  .bn-limelight {
    position: absolute;
    top: 0;
    left: 0;
    width: 38px;
    height: 4px;
    border-radius: 0 0 99px 99px;
    background: var(--a);
    box-shadow: 0 0 12px 1px color-mix(in srgb, var(--a) 60%, transparent);
    transform: translateX(-999px);
    pointer-events: none;
    transition: transform .38s var(--ease-spring);
  }
  /* Le faisceau conique qui descend sous la barre (projecteur de scène) */
  .bn-limelight::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 4px;
    width: 58px;
    height: 56px;
    transform: translateX(-50%);
    background: linear-gradient(to bottom,
      color-mix(in srgb, var(--a) 26%, transparent),
      transparent 80%);
    clip-path: polygon(24% 0, 76% 0, 96% 100%, 4% 100%);
    pointer-events: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .bn-limelight { transition: none; }
  }
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
    transition: opacity .18s ease, transform .2s var(--ease-spring);
  }
  .bn-tab.active .bn-label {
    opacity: 1;
    transform: translateY(0);
    /* Label 10px : l'accent pur ne tient pas le 4.5:1 — on l'ancre vers l'encre */
    color: color-mix(in srgb, var(--adk) 55%, var(--ink));
  }
  @media (prefers-reduced-motion: reduce) {
    .bn-label { transition: opacity .12s ease; transform: none; }
  }
  .bn-tab:active { transform: scale(.93); transition: transform .12s; }
  @keyframes bnTabIntro {
    0%   { transform: translateY(14px) scale(.7); opacity: 0; }
    60%  { transform: translateY(-4px) scale(1.12); opacity: 1; }
    100% { transform: translateY(0) scale(1); }
  }
  /* Pastille rouge « il y a du nouveau ici » */
  .bn-dot {
    position: absolute; top: 6px; right: calc(50% - 16px);
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--rd); border: 2px solid var(--su);
    animation: bnDotPulse 1.6s ease-in-out infinite;
  }
  @keyframes bnDotPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.25); } }
  @media (prefers-reduced-motion: reduce) { .bn-dot { animation: none; } }

  /* ── FAB flottant "Séance" (enseignant seulement) ── */
  @keyframes bnFabIn {
    from { opacity: 0; transform: scale(.85) translateY(6px); }
    to   { opacity: 1; transform: scale(1)   translateY(0);   }
  }
  /* Masqué sur la page validation : on y EST déjà (le FAB recouvrait le
     bouton « Enregistrer la séance »). Idem quand un footer CTA est présent. */
  body:has(.vs) #bn-seance-fab { display: none; }
  /* Quand le FAB est visible, le contenu doit pouvoir défiler AU-DESSUS de
     lui (sinon il recouvre la dernière carte des listes — mes-élèves, radar). */
  body.has-chrome:has(#bn-seance-fab) #app {
    padding-bottom: calc(148px + env(safe-area-inset-bottom, 0px));
  }
  #bn-seance-fab {
    position: fixed;
    right: 20px;
    bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    z-index: 310;
    width: 56px; height: 56px;
    border-radius: 50%;
    /* Vert plastique : visible en clair ET en nuit (var(--ink) s'inversait en
       blanc en dark → « + » blanc invisible sur cercle blanc). */
    background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
    color: var(--a-ink);
    border: none; padding: 0;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    -webkit-tap-highlight-color: transparent;
    box-shadow:
      0 8px 20px -6px color-mix(in srgb, var(--adk) 50%, transparent),
      0 3px 8px -2px rgba(10,13,26,.2),
      inset 0 1.5px 0 0 rgba(255,255,255,.28);
    animation: bnFabIn .3s var(--ease-spring) both;
    transition: transform .15s var(--ease-spring), box-shadow .15s ease;
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

  // Idempotent : main.js appelle mountBottomNav() à CHAQUE navigation.
  // Reconstruire à chaque fois (a) détruirait le limelight → plus de glissé
  // entre onglets, (b) relancerait des RPC inutiles (pastille trophées). Si la
  // nav du même rôle est déjà là, on rafraîchit juste l'onglet actif (le
  // limelight glisse via _updateActive) et on s'arrête.
  const existing = document.querySelector("#bottom-nav");
  if (existing && existing.dataset.role === role) {
    _updateActive();
    return;
  }
  existing?.remove();
  document.getElementById("bn-seance-fab")?.remove();
  document.body.classList.remove("has-enseignant-fab");

  const tabs = TABS[role] || TABS.eleve;
  const nav = document.createElement("nav");
  nav.id = "bottom-nav";
  nav.dataset.role = role;
  nav.setAttribute("aria-label", "Navigation principale");
  const tabsHtml = tabs
    .map(
      (t) => `
      <button class="bn-tab" data-id="${t.id}"${t.match ? ` data-match="${t.match.join(",")}"` : ""} aria-label="${t.label}">
        <span class="bn-ico-line">${ICO[t.ico]}</span>
        <span class="bn-ico-fill">${ICO_FILL[t.ico] || ICO[t.ico]}</span>
        <span class="bn-label">${t.label}</span>
      </button>
    `,
    )
    .join("");
  // Limelight en 1er dans le DOM → les onglets (plus tard) passent au-dessus.
  nav.innerHTML =
    `<span class="bn-limelight" aria-hidden="true"></span>` + tabsHtml;

  document.body.appendChild(nav);
  _updateActive();

  // Pastille rouge sur « Trophées » (élève) si un trophée débloqué n'a pas
  // encore été vu sur la page trophées (set localStorage pg-troph-seen).
  if (role === "eleve") _checkTropheesDot(nav);
  window.addEventListener("pg-trophees-seen", () => {
    nav.querySelector('.bn-tab[data-id="trophees"] .bn-dot')?.remove();
  });

  // Intro : petit rebond en cascade des onglets, UNE fois par session —
  // fait comprendre qu'il y a plusieurs interfaces (découvrabilité).
  try {
    if (!sessionStorage.getItem("pg-nav-intro-done")) {
      sessionStorage.setItem("pg-nav-intro-done", "1");
      const reduced = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      )?.matches;
      if (!reduced) {
        nav.querySelectorAll(".bn-tab").forEach((t, i) => {
          t.style.animation = `bnTabIntro .55s ${200 + i * 110}ms var(--ease-spring) both`;
        });
      }
    }
  } catch {
    /* sessionStorage indispo → pas d'intro */
  }

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
  window.addEventListener("resize", _onResize);
}

export function unmountBottomNav() {
  document.querySelector("#bottom-nav")?.remove();
  document.getElementById("bn-seance-fab")?.remove();
  document.body.classList.remove("has-enseignant-fab");
  window.removeEventListener("hashchange", _updateActive);
  window.removeEventListener("resize", _onResize);
}

// Vérifie s'il existe des trophées débloqués jamais vus → pastille rouge.
// Import dynamique du client (nav = composant léger, pas de dépendance dure).
async function _checkTropheesDot(nav) {
  try {
    const seen = new Set(
      JSON.parse(localStorage.getItem("pg-troph-seen") || "[]"),
    );
    const { sb } = await import("@/auth/auth.js");
    const { data } = await sb.rpc("get_my_achievements");
    const hasNew = (data || []).some((a) => !seen.has(a.achievement_key));
    if (!hasNew) return;
    const tab = nav.querySelector('.bn-tab[data-id="trophees"]');
    if (tab && !tab.querySelector(".bn-dot")) {
      const dot = document.createElement("span");
      dot.className = "bn-dot";
      dot.setAttribute("aria-label", "Nouveau trophée débloqué");
      tab.appendChild(dot);
    }
  } catch {
    /* best-effort : pas de pastille si l'appel échoue */
  }
}

function _updateActive() {
  const nav = document.querySelector("#bottom-nav");
  if (!nav) return;
  const section =
    (location.hash || "").replace(/^#\/?/, "").split("/")[0] || "default";
  nav.querySelectorAll("[data-id]").forEach((btn) => {
    const matches = (btn.dataset.match || "").split(",").filter(Boolean);
    const active = btn.dataset.id === section || matches.includes(section);
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-current", active ? "page" : "false");
  });
  // Glisse le limelight sur l'onglet actif : snap au 1er rendu, glissé ensuite.
  const firstPaint = !nav.dataset.limeReady;
  nav.dataset.limeReady = "1";
  _moveLimelight(nav, !firstPaint);
}

// Positionne le halo « limelight » sous l'onglet actif.
// animate=false → pose sans transition (montage / resize) ;
// animate=true  → glissé spring d'un onglet à l'autre.
function _moveLimelight(nav, animate) {
  const lime = nav.querySelector(".bn-limelight");
  const active = nav.querySelector(".bn-tab.active");
  if (!lime || !active) return;
  const x = Math.round(
    active.offsetLeft + active.offsetWidth / 2 - lime.offsetWidth / 2,
  );
  if (animate) {
    lime.style.transform = `translateX(${x}px)`;
  } else {
    lime.style.transition = "none";
    lime.style.transform = `translateX(${x}px)`;
    void lime.offsetWidth; // reflow → fige la position avant de rendre le glissé
    lime.style.transition = "";
  }
}

// Recalage du limelight au resize / rotation (sans glissé). rAF anti-thrash.
let _resizeRaf = 0;
function _onResize() {
  if (_resizeRaf) return;
  _resizeRaf = requestAnimationFrame(() => {
    _resizeRaf = 0;
    const nav = document.querySelector("#bottom-nav");
    if (nav) _moveLimelight(nav, false);
  });
}
