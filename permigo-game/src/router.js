// ═══════════════════════════════════════════════════════════════
// Router minimal — route selon role + hash
// ═══════════════════════════════════════════════════════════════
import { phPageview } from "@/services/posthog.js";
import { accessGateFor } from "@/auth/route-guards.js";

// Direction de navigation → transition d'écran directionnelle (sensation « feed »).
const _navStack = [];
function _navDir(hash) {
  const i = _navStack.lastIndexOf(hash);
  if (i !== -1 && i === _navStack.length - 2) {
    _navStack.pop();
    return "back"; // retour vers l'écran précédent → glisse depuis la gauche
  }
  _navStack.push(hash);
  if (_navStack.length > 40) _navStack.shift();
  return "fwd"; // on avance → glisse depuis la droite
}

// Transition de page : animation directionnelle légère posée sur #app lui-même
// (single-layer). On NE clone PLUS l'écran sortant : un clone de innerHTML perd
// les fonds animés (canvas mesh/cosmos), les états de formulaire et casse les
// `position:fixed`, et l'empilement de calques partait en vrille en navigation
// rapide. Ici on rejoue juste une entrée directionnelle sur la page vivante →
// fluide, robuste, et re-déclenchable proprement même si on tape vite.
let _enterTimer = null;
function _playEnter(root, dir) {
  window.scrollTo(0, 0); // le nouvel écran démarre en haut (parité iOS)
  // Retire les classes puis force un reflow : sans ça, le navigateur ne
  // redémarre pas l'animation quand on enchaîne deux navigations rapides.
  if (_enterTimer) {
    clearTimeout(_enterTimer);
    _enterTimer = null;
  }
  root.classList.remove("route-enter", "route-back");
  void root.offsetWidth; // reflow
  root.classList.toggle("route-back", dir === "back");
  root.classList.add("route-enter");

  // ⚠️ CRUCIAL : retirer `route-enter` une fois l'entrée terminée.
  // `.route-enter` porte `animation: routeIn … both` (transform). Tant que la
  // classe reste, #app garde une animation `transform` « filled » → il devient
  // un bloc conteneur pour ses descendants `position:fixed`. Conséquence : toute
  // feuille/overlay posée DANS #app (sheet streak, modales, quiz…) se positionne
  // par rapport à #app (toute la hauteur de page) au lieu du viewport → la
  // feuille part hors écran et on ne voit que le fond flouté (« appuie sur la
  // flamme = effet flou », « le quiz reste tout en haut »). On nettoie donc dès
  // la fin de l'animation, avec un filet de sécurité par timeout.
  const cleanup = () => {
    if (_enterTimer) {
      clearTimeout(_enterTimer);
      _enterTimer = null;
    }
    root.removeEventListener("animationend", onEnd);
    root.classList.remove("route-enter", "route-back");
  };
  function onEnd(e) {
    if (e.target === root) cleanup();
  }
  root.addEventListener("animationend", onEnd);
  _enterTimer = setTimeout(cleanup, 460); // > durée d'anim (.28s) + marge
}

const ROUTES = {
  eleve: {
    default: () => import("@/pages/eleve/accueil.js"),
    ecole: () => import("@/pages/public/ecole.js"),
    // Pré-vente Pass Permis élève — page publique, accessible aussi connecté
    // (l'achat est alors rattaché au compte via le JWT).
    pass: () => import("@/pages/public/pass.js"),
    "avis-depart": () => import("@/pages/public/avis-depart.js"),
    reviser: () => import("@/pages/eleve/reviser.js"),
    parcours: () => import("@/pages/eleve/parcours.js"),
    sessions: () => import("@/pages/eleve/session-confirmation.js"),
    quiz: () => import("@/pages/eleve/quiz.js"),
    "flash-quiz": () => import("@/pages/eleve/flash-quiz.js"),
    trophees: () => import("@/pages/eleve/trophees.js"),
    classement: () => import("@/pages/eleve/classement.js"),
    galerie: () => import("@/pages/eleve/galerie.js"),
    recompenses: () => import("@/pages/eleve/recompenses.js"),
    // Chantier nav simplifiée (dernier chantier) : « Mon permis » est le
    // nouveau hub crédible (compétences validées par le moniteur + leçons +
    // examen) — le jeu (mondes/boss/coffres) RESTE à `parcours` ci-dessus,
    // séparé volontairement. `mes-lecons` = sous-page (historique des
    // comptes-rendus), ouverte depuis l'étape ② du hub.
    "mon-permis": () => import("@/pages/eleve/mon-permis.js"),
    "mes-lecons": () => import("@/pages/eleve/mes-lecons.js"),
    // Validation autonome (élève SANS moniteur, pré-vente Pass Permis) :
    // CTA depuis la fiche compétence de `parcours.js` (openFiche), route
    // #/valider-seul/{compId}.
    "valider-seul": () => import("@/pages/eleve/valider-seul.js"),
    examen: () => import("@/pages/eleve/examen.js"),
    "centre-examen": () => import("@/pages/eleve/centre-examen.js"),
    feedback: () => import("@/pages/eleve/feedback.js"),
    boutique: () => import("@/pages/eleve/boutique.js"),
    "exam-blanc": () => import("@/pages/eleve/exam-blanc.js"),
    "revision-conduite": () => import("@/pages/eleve/revision-conduite.js"),
    "exam-conduite": () => import("@/pages/eleve/exam-conduite.js"),
    "jeu-faute": () => import("@/pages/eleve/jeu-faute.js"),
    "en-situation": () => import("@/pages/eleve/en-situation.js"),
    roue: () => import("@/pages/eleve/roue.js"),
    "mes-coffres": () => import("@/pages/eleve/mes-coffres.js"),
    "compte-rendu": () => import("@/pages/eleve/compte-rendu.js"),
    messages: () => import("@/pages/common/messages.js"),
    legal: () => import("@/pages/common/legal.js"),
    dbg: () => import("@/pages/admin/debug.js"),
    profil: () => import("@/pages/common/profil.js"),
    notifications: () => import("@/pages/common/notifications.js"),
    settings: () => import("@/pages/common/settings.js"),
    "nouveau-mdp": () => import("@/pages/auth/nouveau-mdp.js"),
  },
  enseignant: {
    default: () => import("@/pages/enseignant/aujourdhui.js"),
    ecole: () => import("@/pages/public/ecole.js"),
    // Pré-vente Pass Permis élève — page publique, accessible aussi connecté
    // (l'achat est alors rattaché au compte via le JWT).
    pass: () => import("@/pages/public/pass.js"),
    "avis-depart": () => import("@/pages/public/avis-depart.js"),
    aujourdhui: () => import("@/pages/enseignant/aujourdhui.js"),
    // Chantier nav simplifiée : « Mon blason » fusionne l'ancien hub Progression
    // (parcours-pro.js, retiré) + un aperçu Trophées + un aperçu Ligue de la
    // semaine. L'ancienne route top-level `#/parcours` reste valide (liens/
    // notifs/tuiles existants) et atterrit sur ce même hub — même mécanique que
    // `relances`/`classement-eleves` → mes-eleves.js ci-dessous.
    // #/trophees-moniteur et #/ligue-semaine restent en revanche de VRAIES
    // sous-pages (grille complète des 12 jalons / classement jusqu'à 50 rangs) :
    // nav-bottom.js les traite déjà comme des satellites du même onglet, pas
    // des routes fusionnées — elles sont les cibles de "Tout voir"/"Classement
    // complet" depuis le blason.
    "mon-blason": () => import("@/pages/enseignant/mon-blason.js"),
    parcours: () => import("@/pages/enseignant/mon-blason.js"),
    "parcours-complet": () =>
      import("@/pages/enseignant/parcours-pro-complet.js"),
    // Refonte : "Valider" n'est plus un moteur séparé — la Séance est l'unique
    // point de saisie. On garde la route en alias vers log-session (?eleveId=).
    validation: () => import("@/pages/enseignant/log-session.js"),
    eleves: () => import("@/pages/enseignant/mes-eleves.js"),
    // Chantier nav simplifiée : « Mes élèves » est désormais un hub à onglets
    // (Liste · Relances · Classement). Les anciennes routes top-level restent
    // valides (liens/notifs existants) mais atterrissent sur le hub avec le
    // bon onglet actif — mes-eleves.js lit location.hash pour le déterminer
    // (même alias que `validation` → log-session.js ci-dessus).
    relances: () => import("@/pages/enseignant/mes-eleves.js"),
    recompenses: () => import("@/pages/enseignant/recompenses.js"),
    "classement-eleves": () => import("@/pages/enseignant/mes-eleves.js"),
    livret: () => import("@/pages/enseignant/livret-remc.js"),
    insights: () => import("@/pages/enseignant/insights.js"),
    bilan: () => import("@/pages/enseignant/bilan.js"),
    "trophees-moniteur": () =>
      import("@/pages/enseignant/trophees-moniteur.js"),
    "ligue-semaine": () => import("@/pages/enseignant/ligue-semaine.js"),
    "log-session": () => import("@/pages/enseignant/log-session.js"),
    messages: () => import("@/pages/common/messages.js"),
    legal: () => import("@/pages/common/legal.js"),
    dbg: () => import("@/pages/admin/debug.js"),
    profil: () => import("@/pages/common/profil.js"),
    notifications: () => import("@/pages/common/notifications.js"),
    settings: () => import("@/pages/common/settings.js"),
    "nouveau-mdp": () => import("@/pages/auth/nouveau-mdp.js"),
  },
  gerant: {
    default: () => import("@/pages/gerant/cockpit.js"),
    ecole: () => import("@/pages/public/ecole.js"),
    // Pré-vente Pass Permis élève — page publique, accessible aussi connecté
    // (l'achat est alors rattaché au compte via le JWT).
    pass: () => import("@/pages/public/pass.js"),
    "avis-depart": () => import("@/pages/public/avis-depart.js"),
    pulse: () => import("@/pages/gerant/pulse.js"),
    equipe: () => import("@/pages/gerant/equipe.js"),
    eleves: () => import("@/pages/gerant/eleves.js"),
    // Réutilise le livret REMC de l'enseignant pour la vue détail élève côté gérant
    livret: () => import("@/pages/enseignant/livret-remc.js"),
    bilan: () => import("@/pages/enseignant/bilan.js"),
    messages: () => import("@/pages/common/messages.js"),
    legal: () => import("@/pages/common/legal.js"),
    dbg: () => import("@/pages/admin/debug.js"),
    profil: () => import("@/pages/common/profil.js"),
    notifications: () => import("@/pages/common/notifications.js"),
    settings: () => import("@/pages/common/settings.js"),
    "nouveau-mdp": () => import("@/pages/auth/nouveau-mdp.js"),
  },
  // Owner (= plateforme, au-dessus du gérant) : cockpit agrégé toutes écoles.
  // NB : pas de route `cockpit` ici — cockpit.js bail-out sans rendu pour un
  // non-gérant (écran figé). Le drill « une école » (cockpit gérant paramétré)
  // sera câblé en V2 avec un cockpit.js owner-aware.
  owner: {
    default: () => import("@/pages/gerant/owner.js"),
    ecoles: () => import("@/pages/gerant/owner.js"),
    ecole: () => import("@/pages/public/ecole.js"),
    // Pré-vente Pass Permis élève — page publique, accessible aussi connecté
    // (l'achat est alors rattaché au compte via le JWT).
    pass: () => import("@/pages/public/pass.js"),
    "avis-depart": () => import("@/pages/public/avis-depart.js"),
    messages: () => import("@/pages/common/messages.js"),
    legal: () => import("@/pages/common/legal.js"),
    dbg: () => import("@/pages/admin/debug.js"),
    profil: () => import("@/pages/common/profil.js"),
    notifications: () => import("@/pages/common/notifications.js"),
    settings: () => import("@/pages/common/settings.js"),
    "nouveau-mdp": () => import("@/pages/auth/nouveau-mdp.js"),
  },
};

// Libellés de titre de page (a11y lecteur d'écran, onglet, historique, SEO).
// On préfère le <h1> réel rendu par la page ; ce map sert de repli.
const ROUTE_TITLES = {
  default: "Accueil",
  ecole: "École",
  pass: "Pass Permis",
  "avis-depart": "Ton avis",
  aujourdhui: "Aujourd'hui",
  parcours: "Parcours",
  "mon-blason": "Mon blason",
  "parcours-complet": "Parcours",
  validation: "Valider",
  eleves: "Mes élèves",
  "classement-eleves": "Classement des élèves",
  livret: "Livret REMC",
  insights: "Insights",
  bilan: "Bilan",
  "log-session": "Séance",
  sessions: "Mes séances",
  quiz: "Quiz",
  "flash-quiz": "Quiz éclair",
  trophees: "Trophées",
  "trophees-moniteur": "Mes trophées",
  "ligue-semaine": "Ligue de la semaine",
  classement: "Classement",
  galerie: "Galerie",
  recompenses: "Récompenses",
  roue: "La Roue",
  "mon-permis": "Mon permis",
  "mes-lecons": "Mes leçons",
  "valider-seul": "Valider en autonomie",
  examen: "Examen",
  "exam-blanc": "Examen blanc du code",
  "revision-conduite": "Révision conduite",
  "exam-conduite": "Examen blanc de conduite",
  "jeu-faute": "Trouve la faute",
  "en-situation": "En situation",
  feedback: "Feedback",
  boutique: "Boutique",
  "mes-coffres": "Mes coffres",
  "compte-rendu": "Compte-rendu",
  messages: "Messages",
  legal: "Mentions légales",
  profil: "Profil",
  notifications: "Notifications",
  settings: "Réglages",
  "nouveau-mdp": "Nouveau mot de passe",
  pulse: "Pulse",
  equipe: "Équipe",
  dbg: "Debug",
};

// Routes dont le <h1> est un CONTENU dynamique, pas un nom de page :
// l'accueil met la quête du jour en h1 (onglet « Réussir 1 quiz · PermiGo »)
// et le h1 de la boutique concatène son sous-titre (« BoutiqueTon style… »).
// Pour elles, le libellé du map gagne.
const ROUTE_TITLES_FORCE = new Set(["default", "boutique"]);

function _setPageTitle(root, routeName) {
  const h1 = root.querySelector("h1");
  const fromH1 = (h1?.textContent || "").trim().split("\n")[0].slice(0, 60);
  const label = ROUTE_TITLES_FORCE.has(routeName)
    ? ROUTE_TITLES[routeName] || fromH1
    : fromH1 || ROUTE_TITLES[routeName] || "";
  document.title = label ? `${label} · PermiGo` : "PermiGo";
}

// Module de la page actuellement montée. On garde la référence pour appeler son
// unmount() (cleanup des listeners/timers/overlays posés par la page) AVANT de
// monter la page suivante. Sans ça, les unmount() exportés par les pages
// n'étaient jamais appelés → fuites (pull-to-refresh sur window, rAF de login,
// timers d'examen, overlays collés au <body>…).
let _currentMod = null;

async function _unmountCurrent() {
  const prev = _currentMod;
  _currentMod = null;
  if (prev && typeof prev.unmount === "function") {
    try {
      await prev.unmount();
    } catch (e) {
      console.error("[router] unmount", e);
    }
  }
}

export async function route(root, me) {
  // Anti-contournement : rejoue les murs d'accès (consentement parental,
  // onboarding) à CHAQUE navigation, pas seulement au boot. Sans ça un mineur
  // bloqué pouvait taper #/quiz dans l'URL pour atteindre l'app.
  const gate = accessGateFor(me);
  if (gate) {
    await _unmountCurrent();
    await gate(root, me);
    _currentMod = null; // la page-mur se gère seule (pas d'unmount router)
    return;
  }

  const role = me.role || "eleve";
  const map = ROUTES[role] || ROUTES.eleve;
  // segments[0] = route name, segments[1] = optional param (ex: eleve UUID pour livret)
  // On retire la query string (?x=y) AVANT le split : sinon routeName vaut
  // "eleves?bloque_sur=C2a" et ne matche aucune route → fallback default.
  // Les pages lisent elles-mêmes leur query depuis location.hash.
  const rawPath = (location.hash || "").replace(/^#\/?/, "").split("?")[0];
  const segments = rawPath.split("/");
  const routeName = segments[0] || "default";
  const param = segments[1] || null; // ex: eleveId pour #/livret/{id}
  const loader = map[routeName] || map.default;

  try {
    const mod = await loader();
    // Démonte la page précédente avant de monter la suivante (cleanup réel).
    await _unmountCurrent();
    // Direction (push/pop) pour orienter la transition d'entrée.
    const dir = _navDir(location.hash || "#/"); // 'fwd' | 'back' (mute la pile 1×)
    root.classList.remove("route-enter", "route-back");
    // Pour les pages qui attendent (root, eleveId) on passe param en 2e arg
    // Les autres pages ignorent les args supplémentaires
    await mod.mount(root, param);
    _currentMod = mod; // mémorise pour le prochain unmount
    _playEnter(root, dir); // entrée directionnelle légère sur la page vivante
    const heading = root.querySelector("h1") || root;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: false });
    _setPageTitle(root, routeName);
  } catch (e) {
    console.error("[router]", e);
    // Stale chunk après deploy : le hash JS a changé, l'index.html cached
    // référence un module qui n'existe plus → on force le reload
    // ⚠️ Chaque navigateur a SON message : Chrome « Failed to fetch dynamically
    // imported module », Safari « Importing a module script failed. », Firefox
    // « error loading dynamically imported module ». Sans les 3, pas d'auto-reload
    // sur iOS (PWA restée ouverte pendant un deploy) → écran mort.
    const isStaleChunk =
      /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError|Importing a module script failed|error loading dynamically imported module/i.test(
        e?.message || "",
      );
    if (isStaleChunk && !sessionStorage.getItem("reloaded_once")) {
      sessionStorage.setItem("reloaded_once", "1");
      window.location.reload();
      return;
    }
    sessionStorage.removeItem("reloaded_once");
    root.innerHTML = `<div class="err" style="padding:32px;text-align:center;color:#64748b">
      <p>Cette page n'a pas pu être chargée.</p>
      <button onclick="location.reload()" style="margin-top:12px;padding:12px 24px;border:0;background:#6366f1;color:#fff;border-radius:12px;cursor:pointer">Recharger</button>
    </div>`;
  }
}

// Routage des pages PUBLIQUES (visiteur non connecté). Miroir de la branche
// `!me` de boot() dans main.js : une navigation par hash (#/rejoindre,
// #/creer-compte, #/ecole/…) doit monter la BONNE page, pas retomber sur login.
async function routePublic(app) {
  const hash = location.hash || "";
  let m;
  let arg;
  if (hash.startsWith("#/parental-consent")) {
    m = await import("@/pages/public/parental-consent.js");
  } else if (hash.startsWith("#/creer-compte")) {
    m = await import("@/pages/public/creer-compte.js");
  } else if (hash.startsWith("#/signup")) {
    m = await import("@/pages/public/signup.js");
  } else if (hash.startsWith("#/rejoindre")) {
    m = await import("@/pages/public/rejoindre.js");
  } else if (hash.startsWith("#/ecole/")) {
    arg = hash.replace("#/ecole/", "").split("?")[0];
    m = await import("@/pages/public/ecole.js");
  } else if (hash.startsWith("#/avis-depart")) {
    m = await import("@/pages/public/avis-depart.js");
  } else if (hash.startsWith("#/pass")) {
    m = await import("@/pages/public/pass.js");
  } else if (hash.startsWith("#/legal")) {
    m = await import("@/pages/common/legal.js");
  } else if (hash.startsWith("#/login")) {
    m = await import("@/pages/auth/login.js");
  } else {
    // Défaut visiteur = landing / page de vente
    m = await import("@/pages/public/landing.js");
  }
  // Démonte la page précédente (ex: rAF d'animation du fond de login) avant de
  // monter la nouvelle page publique.
  await _unmountCurrent();
  await m.mount?.(app, arg);
  _currentMod = m;
}

window.addEventListener("hashchange", () => {
  import("@/auth/cur-user.js").then(({ getCurUser }) => {
    const me = getCurUser();
    if (me) {
      route(document.getElementById("app"), me);
      phPageview(); // hash-router SPA : PostHog ne détecte pas les hashchanges seul
    } else {
      // Visiteur déconnecté → route vers la page publique correspondant au hash
      routePublic(document.getElementById("app"));
    }
  });
});

export function navigate(path) {
  location.hash = path.startsWith("#") ? path : `#${path}`;
}
