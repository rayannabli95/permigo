// ═══════════════════════════════════════════════════════════════
// Mode découverte (free tier) — quotas quotidiens CLIENT pour l'élève SOLO
// non payé (me.eleveAccess.gated). L'idée (décision Rayan) : les non-payeurs
// « goûtent » un peu PermiGo, restent sur leur faim, puis débloquent tout.
//
// ⚠️ C'est un TEASER, pas une frontière de sécurité : 100 % localStorage donc
// contournable — assumé. Le serveur continue de protéger ce qui compte
// (certification ≥ 80 % corrigée serveur, récompenses via RPC). AUCUN effet
// pour les élèves rattachés à un moniteur / payeurs / moniteurs :
// `eleveAccess.gated` n'est jamais vrai pour eux (cf. main.js + PR #541).
// ═══════════════════════════════════════════════════════════════

const LS_KEY = "pg_freetier_v1";

// Quotas quotidiens par « jour Paris » (cf. todayKey, même approche que roue.js).
// quiz = nombre de QUESTIONS ; fiche / scène = nombre de contenus distincts.
export const FREE_QUOTAS = { quiz: 3, fiche: 1, scene: 1 };

// Surfaces que l'élève en mode découverte peut explorer librement (chrome
// affiché ; les quotas sont appliqués DANS la page). Tout le reste est muré
// vers le paywall — fail-closed côté monétisation : une future route « premium »
// non listée est murée par défaut, jamais fuitée.
const DISCOVERY_ROUTES = new Set([
  "default", // accueil
  "reviser", // hub Réviser
  "revision-conduite", // fiches de conduite (quota fiche en page)
  "quiz", // entraînement (quota questions en page)
  "en-situation", // mise en situation (quota scène en page)
  // Comptes / neutres / upsell — jamais murés (l'élève doit pouvoir gérer son
  // compte, lire les mentions légales, ou aller vers l'achat).
  "profil",
  "settings",
  "notifications",
  "legal",
  "messages",
  "feedback",
  "pass",
  "avis-depart",
  "ecole",
  "pro",
  "rejoindre",
  "creer-compte",
  "signup",
  "nouveau-mdp",
]);

/** L'élève est-il en mode découverte (solo non payé) ? Faux pour tous les autres. */
export function isFreeTierUser(me) {
  return !!(
    me &&
    me.role === "eleve" &&
    me.eleveAccess &&
    me.eleveAccess.gated
  );
}

/** Cette route est-elle jouable en mode découverte, ou murée vers le paywall ? */
export function isDiscoveryAllowedRoute(routeName) {
  return DISCOVERY_ROUTES.has(routeName || "default");
}

// Jour « Paris » — même repli local que roue.js todayKey() (l'appareil de
// l'élève est en France dans la quasi-totalité des cas ; le serveur, lui,
// arbitre la vraie date pour tout ce qui compte).
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function safeRead() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && typeof s === "object" ? s : null;
  } catch {
    return null;
  }
}

function safeWrite(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* mode privé strict : quota non persistable — on n'insiste pas (teaser) */
  }
}

function freshState() {
  return { day: todayKey(), used: {}, ref: {} };
}

// Charge l'état du jour, en réinitialisant automatiquement au passage à un
// nouveau jour. `used[kind]` = compteur ; `ref[kind]` = dernier contenu
// « goûté » (fiche/scène) pour autoriser une relecture du même contenu.
function loadState() {
  const s = safeRead();
  if (!s || s.day !== todayKey()) {
    const fresh = freshState();
    safeWrite(fresh);
    return fresh;
  }
  if (!s.used || typeof s.used !== "object") s.used = {};
  if (!s.ref || typeof s.ref !== "object") s.ref = {};
  return s;
}

/** Réinitialise le quota si on a changé de jour. No-op sinon. */
export function resetIfNewDay() {
  return loadState();
}

/**
 * État du quota pour un type donné.
 * @param {'quiz'|'fiche'|'scene'} kind
 * @param {string|null} ref  identifiant du contenu (fiche/scène) : ré-ouvrir le
 *   MÊME contenu déjà « goûté » aujourd'hui reste autorisé (pas de double mur).
 * @returns {{used:number,max:number,remaining:number,allowed:boolean}}
 */
export function freeQuota(kind, ref = null) {
  const max = FREE_QUOTAS[kind] ?? 0;
  const s = loadState();
  const used = s.used[kind] || 0;
  const sameRef = ref != null && s.ref[kind] === ref;
  const remaining = Math.max(0, max - used);
  return { used, max, remaining, allowed: remaining > 0 || sameRef };
}

/**
 * Consomme du quota. Ré-entrer le même `ref` déjà débloqué aujourd'hui = no-op
 * (pas de double décompte). Renvoie le nouvel état du quota.
 * @param {'quiz'|'fiche'|'scene'} kind
 * @param {string|null} ref
 * @param {number} n  nombre d'unités (ex. nombre de questions pour un quiz)
 */
export function consumeFree(kind, ref = null, n = 1) {
  const s = loadState();
  if (ref != null && s.ref[kind] === ref) return freeQuota(kind, ref); // relecture
  const max = FREE_QUOTAS[kind] ?? 0;
  const used = s.used[kind] || 0;
  s.used[kind] = Math.min(max, used + Math.max(1, n | 0));
  if (ref != null) s.ref[kind] = ref;
  safeWrite(s);
  return freeQuota(kind, ref);
}

/** Libellé de compteur discret, ex. « Découverte : 2/3 questions aujourd'hui ». */
export function discoveryCounterLabel(kind) {
  const q = freeQuota(kind);
  if (kind === "quiz")
    return `Découverte : ${q.used}/${q.max} questions aujourd'hui`;
  if (kind === "fiche")
    return q.remaining > 0
      ? "Découverte : 1 fiche aujourd'hui"
      : "Découverte : fiche du jour lue";
  if (kind === "scene")
    return q.remaining > 0
      ? "Découverte : 1 scène aujourd'hui"
      : "Découverte : scène du jour jouée";
  return "Mode découverte";
}
