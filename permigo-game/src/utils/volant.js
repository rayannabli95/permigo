// ═══════════════════════════════════════════════════════════════
// Volant = LA monnaie du jeu. Helper unique pour l'AFFICHER partout.
//
//  - L'icône est désormais un vrai médaillon doré (PNG), plus le SVG ligne.
//  - Le wording utilisateur est TOUJOURS « volant(s) » (jamais « gemme »).
//    En interne la donnée reste profiles.gemmes / pg-gemmes / cost_gemmes :
//    on ne renomme PAS la DB, on unifie seulement ce que l'élève voit.
//
// Usage :
//   import { volantImg, volantLabel } from "@/utils/volant.js";
//   `${volantImg(16)} ${n} ${volantLabel(n)}`
// ═══════════════════════════════════════════════════════════════
import { ASSETS } from "@/utils/assets.js";

/**
 * Médaillon « volant » (la monnaie) en <img>, prêt à injecter dans innerHTML.
 * Plein-couleur (doré) → on ne le teinte pas en currentColor comme un SVG.
 * @param {number} size - taille en px (défaut 16)
 * @param {{spin?:boolean, cls?:string, drop?:boolean}} [opts]
 *   spin = légère rotation au survol/anim · cls = classes sup · drop = ombre portée
 */
export function volantImg(size = 16, opts = {}) {
  const { spin = false, cls = "", drop = false } = opts;
  const klass = ["volant-coin", spin ? "volant-coin--spin" : "", cls]
    .filter(Boolean)
    .join(" ");
  const shadow = drop
    ? "filter:drop-shadow(0 2px 3px rgba(120,80,10,.35));"
    : "";
  return `<img src="${ASSETS.volantCoin}" alt="" aria-hidden="true" class="${klass}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;display:inline-block;vertical-align:middle;object-fit:contain;${shadow}" />`;
}

/** Accord singulier/pluriel : 1 volant, 2 volants. */
export function volantLabel(n = 2) {
  return Math.abs(Number(n)) <= 1 ? "volant" : "volants";
}

/** Raccourci « 12 volants » avec icône → `${volantAmount(12)}`. */
export function volantAmount(n, size = 15) {
  const v = Number(n) || 0;
  return `${volantImg(size)} ${v} ${volantLabel(v)}`;
}
