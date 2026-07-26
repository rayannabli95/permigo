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

export const LANGS = ["fr", "en", "ar"];
export const LANG_LABELS = { fr: "Français", en: "English", ar: "العربية" };

function isLang(v) {
  return v === "fr" || v === "en" || v === "ar";
}

export function isRTL(lang) {
  return (lang || getLang()) === "ar";
}

// ─── Apply (miroir localStorage + attribut lang pour l'a11y) ───
export function applyLang(lang) {
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
  const local = getLang(); // choix mémorisé côté client (ou 'fr')
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
    if (local === "en" || local === "ar") {
      applyLang(local);
      try {
        await sb2.rpc("set_my_preferences", { p_data: { language: local } });
      } catch {
        /* le miroir localStorage tient déjà la préférence */
      }
      return;
    }
  } catch {
    /* fallback ci-dessous */
  }
  applyLang(local);
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

// ─── Init rapide (avant auth — lit localStorage) ───────────────
export function initLangEarly() {
  applyLang(getLang());
}
