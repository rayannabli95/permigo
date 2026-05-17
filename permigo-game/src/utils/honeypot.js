/**
 * Honeypot anti-bot.
 *
 * Principe : on cache un champ d'input que les bots automatisés remplissent
 * souvent par défaut (ex: `name`, `website`, `phone_number`). Un humain ne le
 * voit pas (display:none + tabindex=-1 + aria-hidden). Si le champ est rempli
 * à la soumission → c'est un bot, on rejette.
 *
 * Usage dans une page :
 *   import { renderHoneypot, checkHoneypot } from '@/utils/honeypot.js';
 *
 *   // Dans le template HTML :
 *   ${renderHoneypot()}
 *
 *   // Dans le handler submit :
 *   if (!checkHoneypot(form)) return; // bot détecté, on bloque silencieusement
 */

const FIELD_NAMES = ['website_url', 'fax_number'];

/** Renvoie le HTML d'un honeypot (à injecter dans un <form>). */
export function renderHoneypot() {
  return `
    <div aria-hidden="true" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none">
      <label>Laisser vide
        <input type="text" name="${FIELD_NAMES[0]}" tabindex="-1" autocomplete="off" data-hp="1">
      </label>
      <label>Laisser vide
        <input type="text" name="${FIELD_NAMES[1]}" tabindex="-1" autocomplete="off" data-hp="1">
      </label>
    </div>
  `;
}

/**
 * Vérifie qu'aucun champ honeypot n'est rempli.
 * @param {HTMLFormElement|HTMLElement} root - form ou container parent
 * @returns {boolean} true = humain (OK), false = bot (bloquer)
 */
export function checkHoneypot(root) {
  const fields = root.querySelectorAll('input[data-hp="1"]');
  for (const f of fields) {
    if (f.value && f.value.trim().length > 0) {
      console.warn('[honeypot] bot détecté — soumission bloquée');
      return false;
    }
  }
  return true;
}
