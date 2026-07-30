// ═══════════════════════════════════════════════════════════════
// Bandeau « Récompenses » — 1 porte, 4 salles (nav 5 portes)
// Inséré en tête de boutique / galerie / trophées / ligue pour que
// ces 4 pages se vivent comme UN hub. Theme-aware via tokens, avec
// une variante sombre pour l'Arène (classement).
// ═══════════════════════════════════════════════════════════════
import { navigate } from "@/router.js";
import { getLang } from "@/utils/lang.js";

const ROOMS = [
  { id: "boutique", label: "Boutique", route: "/boutique" },
  { id: "galerie", label: "Collection", route: "/galerie" },
  { id: "trophees", label: "Trophées", route: "/trophees" },
  { id: "classement", label: "Ligue", route: "/classement" },
];

// i18n du bandeau (EN/AR) — composant 100 % élève (les 4 salles sont des
// routes élève), pas de scope rôle nécessaire. Évalué à chaque appel de
// recompensesTabs() (les pages re-montent à chaque navigation → toujours à
// jour ; pas besoin d'écouter permigo:lang-changed ici).
const RCT_I18N = {
  en: {
    boutique: "Shop",
    galerie: "Collection",
    trophees: "Trophies",
    classement: "League",
    aria: "Rewards rooms",
  },
  ar: {
    boutique: "المتجر",
    galerie: "المجموعة",
    trophees: "الكؤوس",
    classement: "الدوري",
    aria: "غرف المكافآت",
  },
};

// Câblage par délégation (une seule fois) : les 4 pages n'ont qu'à insérer
// le HTML, aucun wire à ajouter chez elles.
let _wired = false;
function ensureWired() {
  if (_wired) return;
  _wired = true;
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-rct]");
    if (!b) return;
    const route = b.getAttribute("data-rct");
    if (location.hash !== "#" + route) navigate(route);
  });
}

export function recompensesTabs(active, { dark = false } = {}) {
  ensureWired();
  return `
<style>
.rct {
  display: flex; gap: 6px; padding: 5px; border-radius: 16px;
  margin: 0 0 14px;
  background: color-mix(in srgb, var(--ink) 5%, transparent);
  border: 1px solid var(--bo);
}
.rct-tab {
  flex: 1; border: 0; border-radius: 12px; padding: 8px 4px; min-height: 44px;
  cursor: pointer; text-align: center; background: transparent;
  font: 600 12.5px/1 'Fredoka', sans-serif; color: var(--mu);
  transition: background .16s cubic-bezier(.23,1,.32,1), color .16s;
}
.rct-tab.on {
  background: var(--su); color: var(--a-txt);
  box-shadow: 0 4px 12px -6px rgba(20,16,60,.25);
}
.rct--dark { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.14); }
.rct--dark .rct-tab { color: rgba(255,255,255,.65); }
.rct--dark .rct-tab.on { background: rgba(255,255,255,.16); color: #fff; box-shadow: none; }
</style>
<div class="rct${dark ? " rct--dark" : ""}" role="tablist" aria-label="${(getLang() !== "fr" && RCT_I18N[getLang()]?.aria) || "Salles Récompenses"}">
  ${ROOMS.map(
    (r) =>
      `<button class="rct-tab${r.id === active ? " on" : ""}" role="tab" aria-selected="${r.id === active}" data-rct="${r.route}">${(getLang() !== "fr" && RCT_I18N[getLang()]?.[r.id]) || r.label}</button>`,
  ).join("")}
</div>`;
}
