// ═══════════════════════════════════════════════════════════════
// Illustrations UI — PNG transparents premium (éclair, badge, cahier).
// Remplacent certaines icônes SVG monochromes par des visuels illustrés.
//
//   ill('eclair')                 → <img> couleur (éclair jaune)
//   ill('badge')                  → <img> couleur (médaille dorée)
//   illMask('cahier', { color })  → trait mono recoloré via masque CSS
//                                    (lisible thème clair ET sombre, on-brand)
// ═══════════════════════════════════════════════════════════════
import { ASSETS } from "@/utils/assets.js";

/**
 * Illustration couleur en <img> (éclair, badge…).
 * @param {keyof typeof ASSETS.ill} name
 * @param {{ size?: number, cls?: string }} opts
 */
export function ill(name, { size = 24, cls = "" } = {}) {
  const src = ASSETS.ill[name];
  if (!src) return "";
  return `<img src="${src}" alt="" aria-hidden="true" class="pg-ill ${cls}" width="${size}" height="${size}" loading="lazy" style="width:${size}px;height:${size}px;object-fit:contain;display:inline-block;vertical-align:middle" />`;
}

/**
 * Illustration mono (trait noir) rendue via masque CSS → prend `color`.
 * Indispensable pour le cahier : un trait noir serait invisible en thème sombre.
 * @param {keyof typeof ASSETS.ill} name
 * @param {{ size?: number, color?: string, cls?: string }} opts
 */
export function illMask(
  name,
  { size = 24, color = "currentColor", cls = "" } = {},
) {
  const src = ASSETS.ill[name];
  if (!src) return "";
  const mask = `url('${src}') center / contain no-repeat`;
  return `<span class="pg-ill-mask ${cls}" aria-hidden="true" style="display:inline-block;width:${size}px;height:${size}px;vertical-align:middle;background-color:${color};-webkit-mask:${mask};mask:${mask}"></span>`;
}
