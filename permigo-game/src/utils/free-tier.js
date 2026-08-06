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

import { getLang } from "@/utils/lang.js";

const LS_KEY = "pg_freetier_v1";

// Quotas quotidiens par « jour Paris » (cf. todayKey, même approche que roue.js).
// quiz = nombre de QUESTIONS ; scène = nombre de contenus distincts.
const FREE_QUOTAS = { quiz: 3, scene: 1 };

// Jetons À VIE (pas quotidiens) : une seule fois, jamais renouvelés.
// L'examen blanc de conduite est le meilleur argument de vente du produit — une
// note honnête sur les critères de l'inspecteur crée le besoin bien mieux qu'un
// argumentaire. Il était entièrement derrière le mur : on en offre UN.
const FREE_ONCE = { "exam-conduite": 1 };

// ⚠️ Les FICHES ne sont PLUS un quota quotidien (décision Rayan 30/07/2026,
// campagne pub internationale). Avant : « 1 fiche par jour, n'importe laquelle »
// — quelqu'un qui découvrait l'app le soir lisait UNE fiche et s'entendait dire
// « reviens demain ». Maintenant : les 3 PREMIÈRES sous-compétences sont
// ouvertes en grand, autant de fois qu'il veut, et le mur tombe sur C1d
// « Démarrer et s'arrêter ». Il traverse le début du cours d'une traite et il
// bute pile là où l'envie est la plus forte.
//
// Pourquoi 3 et pas toute la compétence C1 : C1 fait 9 sous-compétences sur 31,
// « en vrai c'est la moitié de l'app » (Rayan).
export const FREE_SUBS = ["C1a", "C1b", "C1c"];

// Le SEUL centre d'examen ouvert au compte gratuit. C'est le premier de
// `CENTRES_EXAMEN` (data/centres-examen.js), donc aussi celui que la page
// affiche par défaut quand l'URL n'a pas de slug : les deux restent alignés
// tant qu'on ne réordonne pas la liste. Si tu changes l'ordre là-bas, change
// cette valeur ici.
export const FREE_CENTRE = "cergy";

/** Ce centre d'examen est-il ouvert au compte gratuit ? */
export function isFreeCentre(slug) {
  return !slug || slug === FREE_CENTRE;
}

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
  "exam-conduite", // examen blanc de conduite : UNE fois à vie (jeton FREE_ONCE)
  // Certification : ouverte SEULEMENT sur les 3 sous-compétences gratuites.
  // Le filtrage par code se fait dans isDiscoveryAllowedRoute(), la présence
  // ici ne suffit pas. Cf. le commentaire de FREE_SUBS_ROUTES juste dessous.
  "valider-seul",
  // Centre d'examen : la tuile est VISIBLE dans Réviser, donc le compte
  // gratuit la voyait et se prenait le paywall en pleine face — la seule
  // tuile du hub à faire ça. On en ouvre UN en entier (décision Rayan,
  // 05/08/2026) : il lit une vraie fiche, il comprend ce qu'il rate sur les
  // autres. Le filtrage par slug se fait dans isDiscoveryAllowedRoute().
  "centre-examen",
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
  // « Défie tes amis » : un lien de partie tombe dans une boucle WhatsApp et
  // peut atterrir sur un compte gratuit. Le murer viderait la feature de son
  // intérêt — c'est justement ce qui fait venir des gens de l'extérieur.
  "duel",
]);

/**
 * Cette sous-compétence est-elle ouverte au compte gratuit ?
 * @param {string} code Ex. "C1a", "C2f"
 */
export function isFreeSub(code) {
  return FREE_SUBS.includes(code);
}

/** L'élève est-il en mode découverte (solo non payé) ? Faux pour tous les autres. */
export function isFreeTierUser(me) {
  return !!(
    me &&
    me.role === "eleve" &&
    me.eleveAccess &&
    me.eleveAccess.gated
  );
}

// Routes ouvertes en découverte, mais SEULEMENT sur les sous-compétences
// gratuites. Le nom de la route ne suffit pas : c'est son paramètre qui décide.
//
// Sans ce filtre, ouvrir la certification en découverte l'ouvrirait sur les 31
// compétences, et le mur du produit tomberait entièrement.
const FREE_SUBS_ROUTES = new Set(["valider-seul"]);

// Même idée, mais le paramètre est un slug de centre d'examen : `#/centre-examen`
// sans slug (la page choisit alors le centre par défaut) et le centre gratuit
// passent, les 30 autres fiches sont murées.
const FREE_CENTRE_ROUTES = new Set(["centre-examen"]);

/**
 * Cette route est-elle jouable en mode découverte, ou murée vers le paywall ?
 *
 * @param {string} routeName ex. "reviser", "valider-seul"
 * @param {string|null} param le segment qui suit, ex. le code d'une compétence
 */
export function isDiscoveryAllowedRoute(routeName, param = null) {
  const nom = routeName || "default";
  if (!DISCOVERY_ROUTES.has(nom)) return false;
  if (FREE_SUBS_ROUTES.has(nom)) return isFreeSub(param);
  if (FREE_CENTRE_ROUTES.has(nom)) return isFreeCentre(param);
  return true;
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
  return { day: todayKey(), used: {}, ref: {}, once: {} };
}

// Charge l'état du jour, en réinitialisant automatiquement au passage à un
// nouveau jour. `used[kind]` = compteur ; `ref[kind]` = dernier contenu
// « goûté » (fiche/scène) pour autoriser une relecture du même contenu.
function loadState() {
  const s = safeRead();
  if (!s || s.day !== todayKey()) {
    const fresh = freshState();
    // ⚠️ Les jetons À VIE survivent au changement de jour : sans ça, « une fois »
    // deviendrait « une fois par jour » à la première nuit.
    if (s && s.once && typeof s.once === "object") fresh.once = s.once;
    safeWrite(fresh);
    return fresh;
  }
  if (!s.used || typeof s.used !== "object") s.used = {};
  if (!s.ref || typeof s.ref !== "object") s.ref = {};
  if (!s.once || typeof s.once !== "object") s.once = {};
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

/**
 * Ce jeton à vie est-il encore disponible ?
 * @param {'exam-conduite'} kind
 */
export function freeOnceAvailable(kind) {
  const max = FREE_ONCE[kind] ?? 0;
  const s = loadState();
  return (s.once[kind] || 0) < max;
}

/** Consomme le jeton à vie. Renvoie true s'il était encore disponible. */
export function consumeFreeOnce(kind) {
  if (!freeOnceAvailable(kind)) return false;
  const s = loadState();
  s.once[kind] = (s.once[kind] || 0) + 1;
  safeWrite(s);
  return true;
}

// ─── i18n des compteurs ──────────────────────────────────────────
// Le compte gratuit est la porte d'entrée de la campagne internationale : un
// arabophone qui arrive par la pub voit ces compteurs TOUS LES JOURS. Ils
// doivent parler sa langue, sinon la promesse de la pub tombe dès l'écran 1.
// « Pass » = باقة, « mise en situation » = سيناريو الطريق (et surtout pas
// « موقف », qui veut aussi dire « parking »).
const FT_I18N = {
  en: {
    lessons: (n) => `Free account: the first ${n} lessons`,
    quiz: (used, max) => `Discovery: ${used}/${max} questions today`,
    scene_left: "Discovery: 1 scenario today",
    scene_done: "Discovery: today's scenario played",
    mode: "Discovery mode",
  },
  ar: {
    lessons: (n) => `حساب مجاني: أول ${n} دروس`,
    quiz: (used, max) => `الاكتشاف: ${used}/${max} أسئلة اليوم`,
    scene_left: "الاكتشاف: سيناريو واحد اليوم",
    scene_done: "الاكتشاف: لعبت سيناريو اليوم",
    mode: "وضع الاكتشاف",
  },
};

/** Libellé de compteur discret, ex. « Découverte : 2/3 questions aujourd'hui ». */
export function discoveryCounterLabel(kind) {
  const d = FT_I18N[getLang()] || null;
  if (kind === "fiche")
    return d
      ? d.lessons(FREE_SUBS.length)
      : `Compte gratuit : les ${FREE_SUBS.length} premières leçons`;
  const q = freeQuota(kind);
  if (kind === "quiz")
    return d
      ? d.quiz(q.used, q.max)
      : `Découverte : ${q.used}/${q.max} questions aujourd'hui`;
  if (kind === "scene") {
    if (q.remaining > 0)
      return d ? d.scene_left : "Découverte : 1 scène aujourd'hui";
    return d ? d.scene_done : "Découverte : scène du jour jouée";
  }
  return d ? d.mode : "Mode découverte";
}
