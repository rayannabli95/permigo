// ═══════════════════════════════════════════════════════════════
// Router minimal — route selon role + hash
// ═══════════════════════════════════════════════════════════════
import { phPageview } from "@/services/posthog.js";
import { fbPageview } from "@/services/meta-pixel.js";
import { accessGateFor } from "@/auth/route-guards.js";
import { isFreeTierUser, isDiscoveryAllowedRoute } from "@/utils/free-tier.js";
import { getCurUser } from "@/auth/cur-user.js";

const CHUNK_RELOAD_KEY = "pg-chunk-reloaded";
const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError|Importing a module script failed|error loading dynamically imported module/i;
let _chunkReloadPending = false;

export function reloadOnceOnChunkError(error) {
  const message = error?.message || String(error || "");
  if (!CHUNK_ERROR_RE.test(message)) return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    // Sans sessionStorage, impossible de garantir l'absence de boucle.
    return false;
  }

  _chunkReloadPending = true;
  window.location.reload();
  return true;
}

export function clearChunkReloadGuard() {
  // Une navigation concurrente peut finir entre reload() et le changement de
  // document : elle ne doit pas désarmer le garde-fou pendant cette fenêtre.
  if (_chunkReloadPending) return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // sessionStorage peut être indisponible en navigation privée stricte.
  }
}

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

// Circuits d'inscription — accessibles MÊME connecté. Sans ça, un utilisateur
// avec une session active (ex : compte test resté connecté sur un téléphone)
// qui ouvre #/rejoindre ou #/creer-compte retombait SILENCIEUSEMENT sur
// l'accueil de son rôle : le circuit d'inscription paraissait « mort ».
// Les pages elles-mêmes affichent un bandeau « déjà connecté » dans ce cas.
const SIGNUP_ROUTES = {
  rejoindre: () => import("@/pages/public/rejoindre.js"),
  "creer-compte": () => import("@/pages/public/creer-compte.js"),
  // Lien d'invitation par email (#/signup?token=…) : même piège — un élève
  // dont le téléphone a déjà une session ne doit pas atterrir sur l'accueil.
  signup: () => import("@/pages/public/signup.js"),
  // « Défie tes amis » : le lien d'une partie (#/duel/K7X2) circule dans une
  // boucle WhatsApp. Il tombe autant sur un visiteur que sur un moniteur
  // déjà connecté, donc la route vit dans TOUS les rôles et dans la branche
  // publique (routePublic). #/duel sans code = l'écran de création.
  duel: () => import("@/pages/common/duel.js"),
};

const ROUTES = {
  eleve: {
    default: () => import("@/pages/eleve/accueil.js"),
    ecole: () => import("@/pages/public/ecole.js"),
    // Pré-vente Pass Permis élève — page publique, accessible aussi connecté
    // (l'achat est alors rattaché au compte via le JWT).
    pass: () => import("@/pages/public/pass.js"),
    "avis-depart": () => import("@/pages/public/avis-depart.js"),
    ...SIGNUP_ROUTES,
    reviser: () => import("@/pages/eleve/reviser.js"),
    parcours: () => import("@/pages/eleve/parcours.js"),
    quiz: () => import("@/pages/eleve/quiz.js"),
    // Collection de cartes « Monument Valley » : une carte par compétence,
    // débloquée à la certification. Le profil élève est devenu la maison du
    // paquet (refonte « Le paquet », décision Rayan 06/08/2026, cf. FLOWS.md)
    // : cette route ne vit plus DANS la nav générale, elle ne sert plus que
    // de lien de révélation direct posé par valider-seul.js après une
    // certification (#/cartes/{compId} → collection.js#mount redirige vers
    // #/profil si aucun id valide n'est fourni, cf. commentaire du fichier).
    cartes: () => import("@/pages/eleve/collection.js"),
    classement: () => import("@/pages/eleve/classement.js"),
    recompenses: () => import("@/pages/eleve/recompenses.js"),
    // ⛔ Deux pages supprimées le 02/08/2026 (décision Rayan) : le hub
    // condensé « mon-permis » (il redisait les compétences que `parcours`
    // dessine déjà) et « examen » (date, compte à rebours, checklist et
    // conseils « dors 8 h la veille » — ça ne préparait aucune leçon).
    // Ne pas les recréer. Le « centre-examen » ci-dessous reste : il parle
    // du VRAI centre de l'élève (difficulté, pièges du parcours) et il
    // alimente les pages SEO.
    // Certification d'une compétence par l'élève (TOUS les élèves depuis
    // le pivot 17/07) : CTA depuis la fiche compétence de `parcours.js`
    // (openFiche), route #/valider-seul/{compId}.
    "valider-seul": () => import("@/pages/eleve/valider-seul.js"),
    "centre-examen": () => import("@/pages/eleve/centre-examen.js"),
    boutique: () => import("@/pages/eleve/boutique.js"),
    "exam-blanc": () => import("@/pages/eleve/exam-blanc.js"),
    "revision-conduite": () => import("@/pages/eleve/revision-conduite.js"),
    "exam-conduite": () => import("@/pages/eleve/exam-conduite.js"),
    "jeu-faute": () => import("@/pages/eleve/jeu-faute.js"),
    "en-situation": () => import("@/pages/eleve/en-situation.js"),
    roue: () => import("@/pages/eleve/roue.js"),
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
    // Pré-vente Pass Permis élève — page publique, accessible aussi connecté
    // (l'achat est alors rattaché au compte via le JWT).
    pass: () => import("@/pages/public/pass.js"),
    "avis-depart": () => import("@/pages/public/avis-depart.js"),
    ...SIGNUP_ROUTES,
    aujourdhui: () => import("@/pages/enseignant/aujourdhui.js"),
    // Chantier nav simplifiée : « Mon blason » fusionne l'ancien hub Progression
    // (parcours-pro.js, retiré) + un aperçu Trophées + un aperçu Ligue de la
    // semaine. L'ancienne route top-level `#/parcours` reste valide (liens/
    // notifs/tuiles existants) et atterrit sur ce même hub — même mécanique que
    // `relances`/`classement-eleves` → mes-eleves.js ci-dessous.
    // Retrait du moniteur (lot 4 du pivot, 30/07/2026, décision Rayan) :
    //   · la page de SAISIE de séance (log-session, routes `validation` et
    //     `log-session`) est supprimée — le moniteur n'écrit plus rien qui
    //     atterrisse chez l'élève, il observe ;
    //   · sa GAMIFICATION est supprimée aussi (mon-blason, parcours-complet,
    //     trophees-moniteur, ligue-semaine) : ligue, trophées et paliers
    //     comptaient tous ses validations → ils mesuraient une action devenue
    //     impossible (0 point à vie, paliers inatteignables).
    // Il garde Aujourd'hui · Mes élèves · Stats : de l'observation, qui reste vraie.
    eleves: () => import("@/pages/enseignant/mes-eleves.js"),
    // Chantier nav simplifiée : « Mes élèves » est désormais un hub à onglets
    // (Liste · Relances · Classement). Les anciennes routes top-level restent
    // valides (liens/notifs existants) mais atterrissent sur le hub avec le
    // bon onglet actif — mes-eleves.js lit location.hash pour le déterminer
    relances: () => import("@/pages/enseignant/mes-eleves.js"),
    recompenses: () => import("@/pages/enseignant/recompenses.js"),
    "classement-eleves": () => import("@/pages/enseignant/mes-eleves.js"),
    livret: () => import("@/pages/enseignant/livret-remc.js"),
    insights: () => import("@/pages/enseignant/insights.js"),
    bilan: () => import("@/pages/enseignant/bilan.js"),
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
    ...SIGNUP_ROUTES,
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
    ...SIGNUP_ROUTES,
    messages: () => import("@/pages/common/messages.js"),
    legal: () => import("@/pages/common/legal.js"),
    dbg: () => import("@/pages/admin/debug.js"),
    profil: () => import("@/pages/common/profil.js"),
    notifications: () => import("@/pages/common/notifications.js"),
    settings: () => import("@/pages/common/settings.js"),
    "nouveau-mdp": () => import("@/pages/auth/nouveau-mdp.js"),
  },
};

// Routes SUPPRIMÉES et leur remplaçante. Une page qui disparaît laisse des
// URL derrière elle (raccourci sur l'écran d'accueil, historique de la PWA,
// lien dans une vieille notification) : on redirige au lieu d'afficher
// « introuvable ». Vaut pour tous les rôles.
const ROUTES_RETIREES = {
  // Hub condensé « Mon permis » retiré le 02/08/2026 : le parcours montre
  // déjà les compétences.
  "mon-permis": "#/parcours",
  // Page « examen » retirée le 02/08/2026 : compte à rebours, checklist de
  // préparation et conseils de la veille. Rien là-dedans n'aidait à monter
  // dans la voiture le lendemain, et le score quiz parlait du code alors
  // qu'on prépare la conduite.
  examen: "#/parcours",
  // #/trophees retirée le 06/08/2026, puis les trophées eux-mêmes le
  // 07/08/2026 (décision Rayan : « salle des trophées inutile »). Les 31
  // cartes du profil racontent déjà la progression. Le renvoi reste pour les
  // vieilles notifications « trophée débloqué » déjà reçues.
  trophees: "#/profil",
  // #/galerie (« Ma collection ») retirée le 07/08/2026 : ses 2 onglets
  // avaient perdu leur raison d'être. « Trophées » a disparu avec les
  // trophées, et « Fonds carte permis » n'a jamais eu de bouton pour
  // ÉQUIPER un fond (juste un état verrouillé/acquis) : le fond de la carte
  // permis est choisi automatiquement selon la progression (getPermisBg).
  // Rien à migrer, donc renvoi vers le profil (là où vit la carte permis).
  galerie: "#/profil",
};

// Libellés de titre de page (a11y lecteur d'écran, onglet, historique, SEO).
// On préfère le <h1> réel rendu par la page ; ce map sert de repli.
const ROUTE_TITLES = {
  default: "Accueil",
  ecole: "École",
  pass: "Pass Permis",
  "avis-depart": "Ton avis",
  rejoindre: "Rejoins ton moniteur",
  "creer-compte": "Crée ton compte moniteur",
  aujourdhui: "Aujourd'hui",
  parcours: "Parcours",
  eleves: "Mes élèves",
  "classement-eleves": "Classement des élèves",
  livret: "Livret REMC",
  insights: "Insights",
  bilan: "Bilan",
  quiz: "Quiz",
  cartes: "Cartes",
  classement: "Classement",
  recompenses: "Récompenses",
  roue: "La Roue",
  "valider-seul": "Certifier une compétence",
  "exam-blanc": "Examen blanc du code",
  "revision-conduite": "Révision conduite",
  "exam-conduite": "Examen blanc de conduite",
  "jeu-faute": "Trouve la faute",
  "en-situation": "En situation",
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
    clearChunkReloadGuard();
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

  // Une route SUPPRIMÉE n'est pas une route inconnue : quelqu'un a pu poser un
  // raccourci sur son écran d'accueil, ou l'avoir dans l'historique de la PWA.
  // On l'emmène chez la remplaçante au lieu de lui servir « introuvable ».
  // `replace` : le retour arrière ne doit pas reboucler sur l'ancienne URL.
  const remplacante = ROUTES_RETIREES[routeName];
  if (remplacante) {
    location.replace(`${location.pathname}${location.search}${remplacante}`);
    return;
  }

  // Mode découverte (élève solo non payé) : les surfaces premium (récompenses,
  // parcours-jeu, examen blanc, certification, classement…) sont murées vers le
  // mur découverte chaleureux — mais on garde le chrome (le mur est monté APRÈS
  // ce return par le boot, ou persiste en navigation), donc l'élève peut
  // revenir explorer l'accueil / Réviser via la nav du bas. Les surfaces de
  // découverte (accueil, Réviser, quiz, fiches, en-situation) passent ici et
  // appliquent elles-mêmes leurs quotas du jour.
  if (isFreeTierUser(me) && !isDiscoveryAllowedRoute(routeName, param)) {
    await _unmountCurrent();
    const dir = _navDir(location.hash || "#/");
    const { mountFreeTierWall } =
      await import("@/components/eleve/free-tier-wall.js");
    await mountFreeTierWall(root, { me, reason: "route", routeName });
    _currentMod = null; // le mur se gère seul (pas d'unmount router)
    _playEnter(root, dir);
    _setPageTitle(root, routeName);
    clearChunkReloadGuard();
    return;
  }

  // Route inconnue (#/route-bidon) → vraie page « introuvable » plutôt que
  // l'accueil du rôle rendu sans un mot (déroutant : on croit à un bug).
  // NB : routeName vaut "default" quand le hash est vide → map.default matche
  // en direct, le fallback 404 ne concerne QUE les routes inconnues.
  const loader =
    map[routeName] || (() => import("@/pages/common/introuvable.js"));

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
    clearChunkReloadGuard();
  } catch (e) {
    console.error("[router]", e);
    if (reloadOnceOnChunkError(e)) return;
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
  } else if (hash.startsWith("#/duel")) {
    // Un ami arrive de WhatsApp : il n'a pas de compte et n'en aura pas
    // besoin. Sans cette branche il retombait sur la page de vente.
    arg = hash.replace(/^#\/duel\/?/, "").split("?")[0];
    m = await import("@/pages/common/duel.js");
  } else if (hash.startsWith("#/ecole/")) {
    arg = hash.replace("#/ecole/", "").split("?")[0];
    m = await import("@/pages/public/ecole.js");
  } else if (hash.startsWith("#/avis-depart")) {
    m = await import("@/pages/public/avis-depart.js");
  } else if (hash.startsWith("#/simple")) {
    m = await import("@/pages/public/pass-simple.js");
  } else if (hash.startsWith("#/pass")) {
    // ⚠️ #/pass N'EST PLUS la page de vente par défaut (Rayan a tranché pour
    // la version épurée, 07/08/2026), mais elle reste routée et elle DOIT le
    // rester : Stripe renvoie l'acheteur sur #/pass?checkout=success, écrit
    // en dur dans l'edge function pass-checkout, côté serveur et déjà
    // déployée. Supprimer cette branche = l'écran de retour de paiement
    // disparaît et l'acheteur atterrit nulle part.
    m = await import("@/pages/public/pass.js");
  } else if (
    hash === "#/pro" ||
    hash.startsWith("#/pro?") ||
    hash.startsWith("#/pro/") ||
    hash.startsWith("#/devis") ||
    hash.startsWith("#/auto-ecole")
  ) {
    m = await import("@/pages/public/pro.js");
  } else if (hash.startsWith("#/legal")) {
    m = await import("@/pages/common/legal.js");
  } else if (hash.startsWith("#/login")) {
    m = await import("@/pages/auth/login.js");
  } else if (hash.replace(/^#\/+/, "").split("?")[0] && hash.startsWith("#/")) {
    // Route inconnue (#/route-bidon) → vraie page « introuvable » plutôt que
    // la landing rendue sans un mot. Les hashes sans chemin ("", "#/",
    // "#/?utm=…", fragments d'auth "#access_token=…") restent sur la landing.
    m = await import("@/pages/common/introuvable.js");
  } else {
    // Défaut visiteur = la page de vente épurée (décision Rayan 07/08/2026,
    // après comparaison des deux en vrai). L'ancienne, #/pass, reste
    // joignable par son adresse et sert l'écran de retour de paiement.
    m = await import("@/pages/public/pass-simple.js");
  }
  // Démonte la page précédente (ex: rAF d'animation du fond de login) avant de
  // monter la nouvelle page publique.
  await _unmountCurrent();
  await m.mount?.(app, arg);
  _currentMod = m;
  clearChunkReloadGuard();
}

window.addEventListener("hashchange", () => {
  const me = getCurUser();
  if (me) {
    route(document.getElementById("app"), me).catch((e) => {
      console.error("[router:hashchange]", e);
      reloadOnceOnChunkError(e);
    });
    phPageview(); // hash-router SPA : PostHog ne détecte pas les hashchanges seul
    fbPageview(); // idem pour le pixel Meta (inerte si non configuré)
  } else {
    // Visiteur déconnecté → route vers la page publique correspondant au hash
    routePublic(document.getElementById("app")).catch((e) => {
      console.error("[router:public]", e);
      reloadOnceOnChunkError(e);
    });
  }
});

export function navigate(path) {
  location.hash = path.startsWith("#") ? path : `#${path}`;
}
