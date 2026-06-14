// ═══════════════════════════════════════════════════════════════
// fmtName — normalise l'AFFICHAGE d'un nom en Title Case.
// NE TOUCHE JAMAIS la donnée en base : c'est purement cosmétique, à
// appliquer au moment du rendu (avant esc()).
//   « CADET BENOÎT Mendy » → « Cadet Benoît Mendy »
//   « amine »              → « Amine »
//   « Jean-pierre »        → « Jean-Pierre »
// ═══════════════════════════════════════════════════════════════

/**
 * @param {string} s nom brut (prénom, nom, ou « prénom nom »)
 * @returns {string} nom en Title Case (gère accents, traits d'union, apostrophes)
 */
export function fmtName(s) {
  return (s || "").toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}
