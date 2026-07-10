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
  // ⚠️ pas de \b ici : en JS, \b ne connaît que l'ASCII — dans « benoît »,
  // « î » compte comme frontière de mot et les lettres qui l'entourent se
  // font capitaliser (« BenoÎT »). On capitalise donc uniquement la première
  // lettre et toute lettre qui suit un caractère non-lettre (espace, tiret…).
  return (s || "")
    .toLowerCase()
    .replace(/(^|[^\p{L}])(\p{L})/gu, (_, pre, c) => pre + c.toUpperCase());
}
