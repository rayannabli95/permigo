// ═══════════════════════════════════════════════════════════════
// Lang — préférence de langue de l'élève (fr / en / ar)
//
// L'app reste FONDAMENTALEMENT en français. En 'en'/'ar', on affiche la
// traduction AVEC le français gardé juste en dessous (l'examen du code se
// passe en français → on prépare le vocabulaire réel).
//
// Miroir de theme.js. Source UNIQUE pour la couche de rendu = getLang()
// (lit un miroir localStorage, synchronisé au boot depuis user_preferences).
//
// ⚠️ On ne bascule PAS <html dir="rtl"> globalement (refonte CSS trop lourde
// et risquée). L'app reste en LTR ; seul le TEXTE arabe reçoit dir="rtl" au
// niveau du span (cf. helper bilingue dans quiz-ui.js).
//
// Usage :
//   import { getLang, saveLang, syncLangFromPrefs } from '@/utils/lang.js';
//   await syncLangFromPrefs(sb);       // à l'init, après login
//   await saveLang(sb, 'ar');          // depuis Réglages / inscription
//   const lang = getLang();            // dans un render()
// ═══════════════════════════════════════════════════════════════

import { sb } from "@/auth/auth.js";

const STORAGE_KEY = "permigo_lang";
// Marqueur de CHOIX HUMAIN (sélecteur, inscription, réglages, lien de campagne).
// ⚠️ Sans lui, on ne distinguait pas « l'élève a choisi le français » de « on a
// écrit le défaut français au démarrage » — et ce défaut écrasait la langue du
// téléphone pour TOUS les visiteurs (page de vente en français sur un téléphone
// arabe, mesuré le 01/08/2026). Le miroir STORAGE_KEY reste la source de rendu ;
// ce marqueur dit seulement si on a le droit de le considérer comme une décision.
const EXPLICIT_KEY = "permigo_lang_explicit";
// Origine du miroir. « auto » = DEVINÉ depuis le téléphone. Sans cette marque,
// une langue devinée devenait un choix au rechargement suivant (la migration
// « un miroir non-fr est forcément un choix » l'adoptait) et l'anglais collait
// à un élève qui n'avait rien demandé.
const SRC_KEY = "permigo_lang_src";

export const LANGS = ["fr", "en", "ar"];
export const LANG_LABELS = { fr: "Français", en: "English", ar: "العربية" };

function isLang(v) {
  return v === "fr" || v === "en" || v === "ar";
}

/** Langue du téléphone, ramenée aux langues que l'app parle vraiment. */
export function browserLang() {
  try {
    const list =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ""];
    for (const raw of list) {
      const l = String(raw).slice(0, 2).toLowerCase();
      if (isLang(l)) return l;
    }
  } catch {
    /* SSR / indispo */
  }
  return null;
}

/**
 * Le choix HUMAIN mémorisé, ou null. Sert à décider si on a le droit d'écrire
 * en base : une langue simplement DEVINÉE ne doit jamais devenir une préférence.
 */
export function explicitLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!isLang(v)) return null;
    if (localStorage.getItem(EXPLICIT_KEY) === "1") return v;
    if (localStorage.getItem(SRC_KEY) === "auto") return null; // deviné par nous
    // Migration des installations d'avant le marqueur : seul « fr » pouvait être
    // écrit automatiquement (c'était le défaut). Un miroir en/ar est donc forcément
    // un vrai choix — on le reconnaît et on pose le marqueur.
    if (v !== "fr") {
      localStorage.setItem(EXPLICIT_KEY, "1");
      return v;
    }
  } catch {
    /* mode privé */
  }
  return null;
}

export function isRTL(lang) {
  return (lang || getLang()) === "ar";
}

// ─── Apply (miroir localStorage + attribut lang pour l'a11y) ───
// `explicit: false` = langue DEVINÉE (téléphone). On pose le miroir pour que
// toute l'app s'affiche dans cette langue, mais on ne la grave pas comme un choix.
export function applyLang(lang, { explicit = true } = {}) {
  const l = isLang(lang) ? lang : "fr";
  try {
    document.documentElement.setAttribute("lang", l);
    // Le skip-link (index.html) est statique, hors du système de modules :
    // on le traduit ici, au boot (initLangEarly) ET à chaque bascule.
    const sl = document.querySelector(".skip-link");
    if (sl)
      sl.textContent =
        l === "en"
          ? "Skip to main content"
          : l === "ar"
            ? "تخطَّ إلى المحتوى الرئيسي"
            : "Aller au contenu principal";
  } catch {
    /* SSR / indispo */
  }
  try {
    localStorage.setItem(STORAGE_KEY, l);
    if (explicit) {
      localStorage.setItem(EXPLICIT_KEY, "1");
      localStorage.removeItem(SRC_KEY);
    } else {
      localStorage.setItem(SRC_KEY, "auto");
    }
  } catch {
    /* mode privé */
  }
  // Signal live pour les écrans/composants déjà montés (ex. Réglages, nav du
  // bas) : leur texte vient de st()/dicts évalués au render initial et ne
  // change pas tout seul quand getLang() change sous eux. Ils s'abonnent à
  // cet event pour se re-rendre immédiatement, sans reload.
  try {
    window.dispatchEvent(
      new CustomEvent("permigo:lang-changed", { detail: { lang: l } }),
    );
  } catch {
    /* SSR / indispo */
  }
}

// ─── Langue portée par l'URL (liens de campagne) ───────────────
// Les pubs pointent sur www.permigo.fr/?lang=ar ou www.permigo.fr/#/pass?lang=ar.
// On accepte les DEUX emplacements : le paramètre peut vivre dans la query
// classique OU dans celle du hash, puisque le routeur est en #/.
// Seules les langues de l'app (fr/en/ar) sont acceptées : afficher un accueil
// dans une langue qu'on ne parle pas ensuite serait une promesse non tenue.
export function langFromUrl() {
  try {
    const h = location.hash || "";
    const hq = h.includes("?") ? h.slice(h.indexOf("?") + 1) : "";
    const raw =
      new URLSearchParams(hq).get("lang") ||
      new URLSearchParams(location.search).get("lang") ||
      "";
    const l = raw.slice(0, 2).toLowerCase();
    return isLang(l) ? l : null;
  } catch {
    return null;
  }
}

// ─── Current (source unique pour le rendu) ─────────────────────
export function getLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (isLang(v)) return v;
  } catch {
    /* mode privé */
  }
  return "fr";
}

// ─── Sync depuis les préférences backend ───────────────────────
export async function syncLangFromPrefs(sb2 = sb) {
  // Un lien de campagne gagne même sur la base : c'est le choix le plus récent
  // et le plus explicite. On répare la base derrière pour les autres appareils.
  const urlLang = langFromUrl();
  if (urlLang) {
    applyLang(urlLang);
    try {
      await sb2.rpc("set_my_preferences", { p_data: { language: urlLang } });
    } catch {
      /* le miroir localStorage tient déjà la préférence */
    }
    return;
  }
  // ⚠️ On raisonne sur le choix HUMAIN, pas sur le miroir : une langue devinée
  // depuis le téléphone ne doit jamais être écrite en base comme une préférence.
  const chosen = explicitLang();
  try {
    const { data } = await sb2.rpc("get_my_preferences");
    const l = data?.language;
    // La base porte un choix EXPLICITE (en/ar) → elle fait foi (multi-appareils).
    if (l === "en" || l === "ar") {
      applyLang(l);
      return;
    }
    // La base est au défaut 'fr'/null MAIS l'élève a un choix explicite en local
    // (ex. posé à l'inscription avant que la persistance n'aboutisse) → on GARDE
    // son choix et on RÉPARE la base. Évite le retour intempestif au français.
    if (chosen === "en" || chosen === "ar") {
      applyLang(chosen);
      try {
        await sb2.rpc("set_my_preferences", { p_data: { language: chosen } });
      } catch {
        /* le miroir localStorage tient déjà la préférence */
      }
      return;
    }
  } catch {
    /* fallback ci-dessous */
  }
  // Aucun choix nulle part → français, comme avant.
  // ⚠️ La détection par le téléphone s'arrête à la porte du compte : elle sert
  // le VISITEUR (page de vente, connexion, inscription), là où il n'a encore
  // rien pu choisir. Un élève connecté, lui, a toujours choisi sa langue à
  // l'inscription. La laisser deviner ici ferait basculer en anglais partiel
  // un élève français dont le téléphone est en anglais, sans qu'il ait rien
  // demandé (l'app n'est traduite qu'à moitié).
  applyLang(chosen || "fr", { explicit: !!chosen });
}

// ─── Écriture (upsert via RPC — même chemin que le thème) ──────
export async function saveLang(sb2, lang) {
  const l = isLang(lang) ? lang : "fr";
  applyLang(l); // miroir immédiat (l'UI réagit tout de suite)
  try {
    await sb2.rpc("set_my_preferences", { p_data: { language: l } });
  } catch {
    /* localStorage a déjà le miroir ; le prochain sync repoussera en DB */
  }
}

// ─── Init rapide (avant auth — lit l'URL puis localStorage) ────
export function initLangEarly() {
  // Ordre unique, le même partout (page de vente, connexion, inscription, app) :
  //   1. le lien de campagne  2. le choix humain mémorisé  3. le téléphone  4. le français
  // ⚠️ Le point 4 ne doit JAMAIS être persisté comme un choix : c'est ce qui
  // rendait le point 3 inatteignable et servait du français à toute la terre.
  const url = langFromUrl();
  if (url) return applyLang(url); // intention explicite et récente
  const chosen = explicitLang();
  if (chosen) return applyLang(chosen);
  applyLang(browserLang() || "fr", { explicit: false });
}
