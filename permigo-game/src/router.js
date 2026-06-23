// ═══════════════════════════════════════════════════════════════
// Router minimal — route selon role + hash
// ═══════════════════════════════════════════════════════════════
import { phPageview } from "@/services/posthog.js";

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

const ROUTES = {
  eleve: {
    default: () => import("@/pages/eleve/accueil.js"),
    ecole: () => import("@/pages/public/ecole.js"),
    parcours: () => import("@/pages/eleve/parcours.js"),
    sessions: () => import("@/pages/eleve/session-confirmation.js"),
    quiz: () => import("@/pages/eleve/quiz.js"),
    "flash-quiz": () => import("@/pages/eleve/flash-quiz.js"),
    trophees: () => import("@/pages/eleve/trophees.js"),
    classement: () => import("@/pages/eleve/classement.js"),
    galerie: () => import("@/pages/eleve/galerie.js"),
    examen: () => import("@/pages/eleve/examen.js"),
    "centre-examen": () => import("@/pages/eleve/centre-examen.js"),
    feedback: () => import("@/pages/eleve/feedback.js"),
    boutique: () => import("@/pages/eleve/boutique.js"),
    "exam-blanc": () => import("@/pages/eleve/exam-blanc.js"),
    "revision-conduite": () => import("@/pages/eleve/revision-conduite.js"),
    "exam-conduite": () => import("@/pages/eleve/exam-conduite.js"),
    "jeu-faute": () => import("@/pages/eleve/jeu-faute.js"),
    "mes-coffres": () => import("@/pages/eleve/mes-coffres.js"),
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
    aujourdhui: () => import("@/pages/enseignant/aujourdhui.js"),
    parcours: () => import("@/pages/enseignant/parcours-pro.js"),
    "parcours-complet": () =>
      import("@/pages/enseignant/parcours-pro-complet.js"),
    // Refonte : "Valider" n'est plus un moteur séparé — la Séance est l'unique
    // point de saisie. On garde la route en alias vers log-session (?eleveId=).
    validation: () => import("@/pages/enseignant/log-session.js"),
    eleves: () => import("@/pages/enseignant/mes-eleves.js"),
    "classement-eleves": () =>
      import("@/pages/enseignant/classement-eleves.js"),
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
};

// Libellés de titre de page (a11y lecteur d'écran, onglet, historique, SEO).
// On préfère le <h1> réel rendu par la page ; ce map sert de repli.
const ROUTE_TITLES = {
  default: "Accueil",
  ecole: "École",
  aujourdhui: "Aujourd'hui",
  parcours: "Parcours",
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
  examen: "Examen",
  "exam-blanc": "Examen blanc du code",
  "revision-conduite": "Révision conduite",
  "exam-conduite": "Examen blanc de conduite",
  "jeu-faute": "Trouve la faute",
  feedback: "Feedback",
  boutique: "Boutique",
  "mes-coffres": "Mes coffres",
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

function _setPageTitle(root, routeName) {
  const h1 = root.querySelector("h1");
  const fromH1 = (h1?.textContent || "").trim().split("\n")[0].slice(0, 60);
  const label = fromH1 || ROUTE_TITLES[routeName] || "";
  document.title = label ? `${label} · PermiGo` : "PermiGo";
}

export async function route(root, me) {
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
    // Transition d'entrée unifiée : fade léger sur #app à chaque route.
    // Les animations propres aux pages (slide-up, staggers) s'y superposent.
    root.classList.remove("route-enter");
    // Pour les pages qui attendent (root, eleveId) on passe param en 2e arg
    // Les autres pages ignorent les args supplémentaires
    await mod.mount(root, param);
    void root.offsetWidth; // reflow → l'animation rejoue à chaque navigation
    root.classList.toggle(
      "route-back",
      _navDir(location.hash || "#/") === "back",
    );
    root.classList.add("route-enter");
    const heading = root.querySelector("h1") || root;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: false });
    _setPageTitle(root, routeName);
  } catch (e) {
    console.error("[router]", e);
    // Stale chunk après deploy : le hash JS a changé, l'index.html cached
    // référence un module qui n'existe plus → on force le reload
    const isStaleChunk =
      /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError/i.test(
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
  if (hash.startsWith("#/parental-consent")) {
    const m = await import("@/pages/public/parental-consent.js");
    return m.mount?.(app);
  }
  if (hash.startsWith("#/creer-compte")) {
    const m = await import("@/pages/public/creer-compte.js");
    return m.mount?.(app);
  }
  if (hash.startsWith("#/signup")) {
    const m = await import("@/pages/public/signup.js");
    return m.mount?.(app);
  }
  if (hash.startsWith("#/rejoindre")) {
    const m = await import("@/pages/public/rejoindre.js");
    return m.mount?.(app);
  }
  if (hash.startsWith("#/ecole/")) {
    const slug = hash.replace("#/ecole/", "").split("?")[0];
    const m = await import("@/pages/public/ecole.js");
    return m.mount?.(app, slug);
  }
  if (hash.startsWith("#/legal")) {
    const m = await import("@/pages/common/legal.js");
    return m.mount?.(app);
  }
  if (hash.startsWith("#/login")) {
    const m = await import("@/pages/auth/login.js");
    return m.mount?.(app);
  }
  // Défaut visiteur = landing / page de vente
  const m = await import("@/pages/public/landing.js");
  return m.mount?.(app);
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
