// ═══════════════════════════════════════════════════════════════
// Illustrations flat « arcade routière » — enseignant.
//
// SVG originaux (aucun souci de licence), style flat comme côté élève :
// formes rondes, aplats, palette signalisation. Remplacent les SVG
// monochromes basiques (véhicule, picto vide, etc.).
//
//   illus('car', { size: 96 })   → <svg> flat
//   ILLUS.car                      → la clé brute si besoin
//
// Couleurs reprises de enseignant-arcade.css :
//   go #18a558 · blue #1d4ed8 · amber #f59e0b · stop #e11d48
// ═══════════════════════════════════════════════════════════════

const wrap = (inner, size, cls) =>
  `<svg class="ens-illus ${cls || ""}" viewBox="0 0 120 120" width="${size}" height="${size}" fill="none" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

// — Voiture flat 3/4 (remplace le « véhicule en SVG » basique) —
const car = `
  <ellipse cx="60" cy="98" rx="44" ry="8" fill="#0b0d1a" opacity=".08"/>
  <rect x="20" y="58" width="80" height="30" rx="13" fill="#18a558"/>
  <path d="M32 60c3-13 9-20 16-20h24c7 0 13 7 16 20" fill="#34d27b"/>
  <path d="M40 44c1-3 3-5 6-5h28c3 0 5 2 6 5l4 14H36z" fill="#dff7e8"/>
  <rect x="44" y="46" width="14" height="11" rx="3" fill="#3b82f6"/>
  <rect x="62" y="46" width="14" height="11" rx="3" fill="#3b82f6"/>
  <circle cx="40" cy="88" r="11" fill="#0b0d1a"/><circle cx="40" cy="88" r="4.5" fill="#cbd5e1"/>
  <circle cx="80" cy="88" r="11" fill="#0b0d1a"/><circle cx="80" cy="88" r="4.5" fill="#cbd5e1"/>
  <rect x="22" y="68" width="8" height="7" rx="3" fill="#f59e0b"/>
  <rect x="90" y="68" width="8" height="7" rx="3" fill="#e11d48"/>`;

// — Volant —
const wheel = `
  <circle cx="60" cy="60" r="42" fill="#0b0d1a"/>
  <circle cx="60" cy="60" r="42" stroke="#34d27b" stroke-width="5"/>
  <circle cx="60" cy="60" r="15" fill="#18a558"/>
  <rect x="56" y="60" width="8" height="32" rx="4" fill="#18a558"/>
  <rect x="28" y="56" width="30" height="8" rx="4" fill="#18a558"/>
  <rect x="62" y="56" width="30" height="8" rx="4" fill="#18a558"/>`;

// — Podium (classement, sans gamin) —
const podium = `
  <rect x="46" y="48" width="28" height="58" rx="5" fill="#f59e0b"/>
  <rect x="14" y="66" width="28" height="40" rx="5" fill="#94a3b8"/>
  <rect x="78" y="74" width="28" height="32" rx="5" fill="#b45309"/>
  <path d="M60 18l5.5 11 12 1.7-8.7 8.4 2.1 12L60 56l-10.9 6.1 2.1-12-8.7-8.4 12-1.7z" fill="#34d27b"/>
  <text x="60" y="86" font-family="Fredoka,sans-serif" font-size="20" font-weight="700" fill="#07150c" text-anchor="middle">1</text>`;

// — Trophée —
const trophy = `
  <rect x="48" y="80" width="24" height="10" rx="3" fill="#b45309"/>
  <rect x="40" y="90" width="40" height="9" rx="4" fill="#92400e"/>
  <path d="M38 30h44v14c0 14-10 24-22 24S38 58 38 44z" fill="#f59e0b"/>
  <path d="M38 34H28c0 12 7 18 14 18" stroke="#f59e0b" stroke-width="6" stroke-linecap="round"/>
  <path d="M82 34h10c0 12-7 18-14 18" stroke="#f59e0b" stroke-width="6" stroke-linecap="round"/>
  <path d="M60 40l3 6 6.5.9-4.7 4.6 1.1 6.5L60 61.9 54.1 65l1.1-6.5L50.4 53.9 57 53z" fill="#fff" opacity=".85"/>`;

// — Route sinueuse (empty-state / décor) —
const route = `
  <rect x="0" y="0" width="120" height="120" rx="16" fill="#eef2f7"/>
  <path d="M30 116c0-30 60-30 60-58S30 30 30 4" stroke="#cbd5e1" stroke-width="26" fill="none" stroke-linecap="round"/>
  <path d="M30 116c0-30 60-30 60-58S30 30 30 4" stroke="#fff" stroke-width="3" stroke-dasharray="7 12" fill="none" stroke-linecap="round"/>
  <circle cx="90" cy="58" r="8" fill="#18a558"/>`;

// — Cône de chantier (empty / en attente) —
const cone = `
  <ellipse cx="60" cy="98" rx="34" ry="8" fill="#0b0d1a" opacity=".08"/>
  <rect x="26" y="92" width="68" height="12" rx="5" fill="#e11d48"/>
  <path d="M60 22l24 68H36z" fill="#f97316"/>
  <rect x="44" y="58" width="32" height="11" rx="3" fill="#fff"/>
  <rect x="49" y="42" width="22" height="9" rx="3" fill="#fff"/>`;

// — Presse-papier coché (validation compétence REMC) —
const clipboard = `
  <rect x="26" y="20" width="68" height="84" rx="12" fill="#fff" stroke="#e2e8f0" stroke-width="3"/>
  <rect x="46" y="14" width="28" height="14" rx="6" fill="#94a3b8"/>
  <rect x="38" y="40" width="44" height="7" rx="3.5" fill="#e2e8f0"/>
  <rect x="38" y="56" width="34" height="7" rx="3.5" fill="#e2e8f0"/>
  <circle cx="84" cy="86" r="20" fill="#18a558"/>
  <path d="M75 86l6 6 12-13" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;

// — Panneau « école/auto-école » stylisé (vide élèves) —
const school = `
  <ellipse cx="60" cy="100" rx="30" ry="7" fill="#0b0d1a" opacity=".08"/>
  <rect x="54" y="60" width="6" height="40" fill="#94a3b8"/>
  <path d="M30 20h54l-6 14 6 14H30z" fill="#1d4ed8"/>
  <circle cx="46" cy="34" r="6" fill="#fff"/>
  <rect x="56" y="30" width="20" height="8" rx="4" fill="#fff"/>`;

export const ILLUS = {
  car,
  wheel,
  podium,
  trophy,
  route,
  cone,
  clipboard,
  school,
};

/**
 * Illustration flat arcade en SVG inline.
 * @param {keyof typeof ILLUS} name
 * @param {{ size?: number, cls?: string }} [opts]
 * @returns {string}
 */
export function illus(name, { size = 96, cls = "" } = {}) {
  const inner = ILLUS[name];
  if (!inner) return "";
  return wrap(inner, size, cls);
}
