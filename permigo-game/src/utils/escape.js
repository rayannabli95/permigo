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

/**
 * Valide une couleur avant de la transmettre à l'API CSS.
 * Le projet n'utilise que des hexadécimaux et des tokens CSS simples :
 * refuser le reste évite qu'une valeur libre puisse ajouter une déclaration.
 */
export function safeCssColor(value, fallback = 'currentColor') {
  const color = String(value ?? '').trim();
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color))
    return color;
  if (/^var\(--[a-z][a-z0-9-]*\)$/i.test(color)) return color;
  if (/^(?:currentColor|transparent)$/i.test(color)) return color;
  return fallback;
}

/**
 * Limite les URL d'assets aux chemins locaux et aux URL HTTPS.
 * Les schémas exécutables (`javascript:`, `data:`…) et les URL protocol-relative
 * sont refusés.
 */
export function safeAssetUrl(value, fallback = '') {
  const url = String(value ?? '').trim();
  if (!url || /[\u0000-\u001f\u007f"'<>\\]/.test(url)) return fallback;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    return new URL(url).protocol === 'https:' ? url : fallback;
  } catch {
    return fallback;
  }
}
