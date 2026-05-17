/**
 * Échappement HTML safe — TOUJOURS utiliser pour insérer des données user dans innerHTML.
 *
 * @example
 *   container.innerHTML = `<div>Bonjour ${esc(user.nom)} !</div>`;
 *
 * Corrige le BUG-04 du rapport QA v6.9.
 */
export function esc(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

/**
 * Échappement pour attribut HTML (différent du contenu — quotes doivent être encodées).
 */
export function escAttr(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
