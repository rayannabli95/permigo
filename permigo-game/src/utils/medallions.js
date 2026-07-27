// ═══════════════════════════════════════════════════════════════
// Médaillons 3D — la banque d'icônes premium de PermiGo.
//
// Langage visuel unique (hérité du hub Réviser, enrichi) :
//   disque (ou tuile) en dégradé radial + rim-light haut→bas +
//   biseau intérieur + reflet supérieur + rebond de lumière bas +
//   glyphe blanc avec ombre portée douce.
//
// Usage :
//   import { medallion, MED_RAMPS } from "@/utils/medallions.js";
//   medallion("trophee", "gold")                    → pièce ronde 3D
//   medallion("cloche", "violet", { shape: "tile" }) → tuile arrondie 3D
//   medallion("volant", "gold", { size: 44, glow: true })
//
// Rendu 100 % SVG inline : net à toute densité, zéro fichier binaire,
// thémable. Les IDs de gradients sont uniques par instance (compteur)
// pour cohabiter sans collision sur une même page.
// ═══════════════════════════════════════════════════════════════

import { escAttr } from "@/utils/escape.js";

/** Rampes [hotspot, corps, profond] + teinte d'ombre du glyphe. */
export const MED_RAMPS = {
  gold: ["#fff2c0", "#ffd24a", "#f08a12", "#9a5a05"],
  violet: ["#e4d4ff", "#a855f7", "#6d34d6", "#3d1a80"],
  red: ["#ffc4c4", "#ff6b6b", "#d12b2b", "#7e1414"],
  blue: ["#c6e4ff", "#54a0ff", "#2b6fd6", "#153f85"],
  green: ["#d4f9b0", "#6fe016", "#3f9e00", "#1f5c00"],
  teal: ["#c0f5ec", "#17c9b2", "#0c7d6c", "#064c41"],
  orange: ["#ffdfb8", "#ff9c1c", "#d96f06", "#8a4403"],
  pink: ["#ffd0e6", "#ec4899", "#be185d", "#701038"],
  indigo: ["#d6ddff", "#6366f1", "#4030b8", "#241a6e"],
  slate: ["#eef2f7", "#8a9bb0", "#4d6076", "#283648"],
  cyan: ["#cff4ff", "#22d3ee", "#0e7490", "#083f4f"],
  night: ["#cbb9ff", "#7c4dff", "#4527c0", "#241269"],
  bronze: ["#ffdcb8", "#c97b3d", "#8a4a1d", "#4d2708"],
  argent: ["#ffffff", "#b9c6d6", "#7d8fa5", "#3e4f63"],
};

/* Glyphes blancs, dessinés pour une pièce 64×64 centrée sur (32,31).
   Silhouettes pleines et simples : lisibles dès 32 px. */
const GLYPHS = {
  // ── Entraînement / jeu ──
  examen: `<path d="M32 16 14 23.5l18 7.5 14-5.8V35h3V23.5L32 16z"/><path d="M21.5 30.4V37c0 2.4 4.8 4.3 10.5 4.3S42.5 39.4 42.5 37v-6.6L32 34.8l-10.5-4.4z"/>`,
  fiches: `<path d="M22 15h14.5L43 21.5V46a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 21 46V17.5A2.5 2.5 0 0 1 23.5 15z" fill-opacity=".45"/><path d="M25 12h14.5L46 18.5V43a2.5 2.5 0 0 1-2.5 2.5h-16A2.5 2.5 0 0 1 25 43V14.5z"/><g class="med-glyph-ink"><rect x="29.5" y="24" width="12" height="2.6" rx="1.3"/><rect x="29.5" y="30" width="12" height="2.6" rx="1.3"/><rect x="29.5" y="36" width="8" height="2.6" rx="1.3"/></g>`,
  faute: `<rect x="29" y="16.5" width="6" height="17.5" rx="3"/><circle cx="32" cy="41.5" r="3.6"/>`,
  route: `<path d="M19 46.5 27.8 16h8.4L45 46.5z"/><g class="med-glyph-ink"><rect x="30" y="39.2" width="4" height="4.4" rx="1.2"/><rect x="30.6" y="30.6" width="2.8" height="3.6" rx="1"/><rect x="31.1" y="23.4" width="1.8" height="2.8" rx=".9"/></g>`,
  ampoule: `<path d="M32 14.5a11.5 11.5 0 0 0-6.8 20.8c1 .8 1.7 2 1.8 3.2h10c.1-1.2.8-2.4 1.8-3.2A11.5 11.5 0 0 0 32 14.5z"/><rect x="27" y="41" width="10" height="3.2" rx="1.6"/><rect x="28.6" y="45.8" width="6.8" height="3.2" rx="1.6"/>`,
  quiz: `<path d="M32 14c-6.4 0-11 4.1-11 10h6.2c0-2.7 2-4.4 4.8-4.4 2.7 0 4.6 1.6 4.6 3.9 0 4.6-8 4.3-8 10.9V36h6v-1c0-3.9 8.2-4.2 8.2-11.5C42.8 18 38.3 14 32 14z"/><circle cx="31.8" cy="43.5" r="3.6"/>`,

  // ── Récompense / statut ──
  trophee: `<path d="M20 15h24v3.5h5.5c0 6.8-3.6 10.9-8 12-1.5 3.3-4 5.5-6.5 6.2V42h5.5c1.6 0 3 1.3 3 3v2.5h-21V45c0-1.7 1.4-3 3-3H31v-5.3c-2.5-.7-5-2.9-6.5-6.2-4.4-1.1-8-5.2-8-12H22z M17.8 21.5c.3 3 1.6 5.2 3.4 6.4-.7-1.9-1.1-4-1.2-6.4zm28.4 0h-2.2c-.1 2.4-.5 4.5-1.2 6.4 1.8-1.2 3.1-3.4 3.4-6.4z"/>`,
  medaille: `<path d="M24 13h6l3 8-5.5 2z" fill-opacity=".55"/><path d="M40 13h-6l-3 8 5.5 2z"/><circle cx="32" cy="35" r="12"/><path class="med-glyph-ink" d="m32 28 2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7z"/>`,
  couronne: `<path d="M15 22.5 23 30l9-11.5L41 30l8-7.5-3.2 19H18.2z M18.7 45h26.6v3.8H18.7z"/>`,
  etoile: `<path d="m32 13 5.4 11.5 12.1 1.6-8.9 8.6 2.3 12L32 40.8l-10.9 5.9 2.3-12-8.9-8.6 12.1-1.6z"/>`,
  flamme: `<path d="M33.5 12s2 5.4-1.8 10.4c-2.3 3-4.4 4.7-4.2 8 .1 1.8 1 3.3 2.4 4.4-2.4-6 3.1-8.9 3.1-8.9-.4 4.6 6.7 5 6.7 11.4 0 2.5-1.2 4.7-3.1 6 6.1-1.6 10.4-6.9 10.4-13.4 0-9.4-9-11.8-13.5-17.9z M25 44.6c-4.2-4.9-1.6-9.9-1.6-9.9-6 7.3-2.9 13.6 1.1 15.3a8.9 8.9 0 0 0 4.5 1c-1.8-1.7-3-4-4-6.4z"/>`,
  coffre: `<path d="M19 20h26a5 5 0 0 1 5 5v5H14v-5a5 5 0 0 1 5-5z"/><path d="M14 33h14v3.5a4 4 0 0 0 8 0V33h14v13a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3z"/><rect class="med-glyph-ink" x="30" y="31" width="4" height="7" rx="2"/>`,
  cadeau: `<path d="M15 24h34v7H15z"/><path d="M17.5 33.5h12.5V49H20.5a3 3 0 0 1-3-3z"/><path d="M34 33.5h12.5V46a3 3 0 0 1-3 3H34z"/><path d="M23.2 13.5c3.4 0 6.6 3.5 8.8 7.7 2.2-4.2 5.4-7.7 8.8-7.7 5.9 0 6.4 8.3.6 8.3H22.6c-5.8 0-5.3-8.3.6-8.3zm.9 3.2c-1.7 0-1.9 2 0 2h5.2c-1.5-1.4-3.4-2-5.2-2zm15.8 0c-1.8 0-3.7.6-5.2 2h5.2c1.9 0 1.7-2 0-2z"/>`,
  diamant: `<path d="M22 15h20l7 10-17 22-17-22z M27.8 26 32 40.2 36.2 26z" fill-rule="evenodd"/>`,
  roue: `<circle cx="32" cy="31" r="17" fill="none" stroke="#fff" stroke-width="4.5"/><path d="M32 14v34M15 31h34M20 19l24 24M44 19 20 43" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="31" r="5.2"/><path d="m32 6.5 4 6h-8z"/>`,

  // ── Conduite ──
  volant: `<path d="M32 13a18 18 0 0 0-18 18h10.5a7.5 7.5 0 0 1 15 0H50A18 18 0 0 0 32 13z M14.4 35a18 18 0 0 0 13.1 13.6c.3-4.6-1.3-9.3-4.5-11.7-2.4-1.9-5.5-2.5-8.6-1.9z M49.6 35c-3.1-.6-6.2 0-8.6 1.9-3.2 2.4-4.8 7.1-4.5 11.7A18 18 0 0 0 49.6 35z"/><circle cx="32" cy="31" r="3.8"/>`,
  voiture: `<path d="M18.5 28.5 21.7 20a4 4 0 0 1 3.7-2.6h13.2a4 4 0 0 1 3.7 2.6l3.2 8.5c2.6.7 4.5 3 4.5 5.8v8.2a2.5 2.5 0 0 1-2.5 2.5h-2a2.5 2.5 0 0 1-2.5-2.5V41H21v1.5A2.5 2.5 0 0 1 18.5 45h-2a2.5 2.5 0 0 1-2.5-2.5v-8.2c0-2.8 1.9-5.1 4.5-5.8z M24.9 21.4l-2.4 6.6h19l-2.4-6.6z"/><circle class="med-glyph-ink" cx="21.5" cy="35" r="2.4"/><circle class="med-glyph-ink" cx="42.5" cy="35" r="2.4"/>`,
  feu: `<rect x="24" y="12.5" width="16" height="37" rx="5"/><circle class="med-glyph-ink" cx="32" cy="20.5" r="3.4"/><circle class="med-glyph-ink" cx="32" cy="31" r="3.4"/><circle cx="32" cy="41.5" r="4.6" fill="#b9ff7e"/>`,
  cone: `<path d="M28.5 14h7L44 44H20z M26.7 24.5h10.6l1.6 6H25.1z" fill-rule="evenodd"/><rect x="16" y="44" width="32" height="4.5" rx="2.2"/>`,
  panneau: `<path d="M32 12 51 45H13z M32 19.8 19.6 41.4h24.8z" fill-rule="evenodd"/><rect x="30" y="26" width="4" height="9" rx="2"/><circle cx="32" cy="39" r="2.3"/>`,
  cle: `<circle cx="21.5" cy="31" r="7.5" fill="none" stroke="#fff" stroke-width="5"/><rect x="28" y="28.6" width="21" height="4.8" rx="2.4"/><rect x="39.5" y="31" width="4.5" height="8.5" rx="2"/><rect x="45.8" y="31" width="4.5" height="10.5" rx="2"/>`,
  carte: `<path d="M32 12c-8 0-14 6-14 13.8C18 36.2 32 50 32 50s14-13.8 14-24.2C46 18 40 12 32 12z"/><circle class="med-glyph-ink" cx="32" cy="26" r="5.5"/>`,
  drapeau: `<path d="M19 12h4v40h-4z"/><path d="M25 14h22l-5 8 5 8H25z"/><g class="med-glyph-ink"><rect x="29" y="17" width="5" height="5"/><rect x="39" y="17" width="5" height="5"/><rect x="34" y="22" width="5" height="5"/></g>`,

  // ── Social / suivi ──
  eleves: `<circle cx="25" cy="24" r="7"/><path d="M25 33.5c-7 0-12 4-12 9.5v3h24v-3c0-5.5-5-9.5-12-9.5z"/><circle cx="42" cy="26" r="5.5" fill-opacity=".7"/><path d="M42 33.5c-1.6 0-3.1.3-4.4.8 2.7 2.1 4.4 5 4.4 8.7v3H51v-2.5c0-5-3.8-10-9-10z" fill-opacity=".7"/>`,
  profil: `<circle cx="32" cy="23.5" r="8.5"/><path d="M32 35c-8.5 0-15 5-15 12v2h30v-2c0-7-6.5-12-15-12z"/>`,
  cloche: `<path d="M32 12.5c-7 0-11.5 5.4-11.5 12.5 0 8.5-3 11.5-4.5 13h32c-1.5-1.5-4.5-4.5-4.5-13 0-7.1-4.5-12.5-11.5-12.5z"/><path d="M27.5 41a4.5 4.5 0 0 0 9 0z"/><circle cx="41.5" cy="15.5" r="5" fill="#ff6b6b" stroke="#fff" stroke-width="1.6"/>`,
  message: `<path d="M32 14c-10.5 0-19 6.9-19 15.4 0 4.9 2.8 9.2 7.2 12L18 49.5l8.6-4.3c1.7.4 3.5.6 5.4.6 10.5 0 19-6.9 19-15.4S42.5 14 32 14z"/><g class="med-glyph-ink"><circle cx="24.5" cy="29.5" r="2.4"/><circle cx="32" cy="29.5" r="2.4"/><circle cx="39.5" cy="29.5" r="2.4"/></g>`,
  calendrier: `<path d="M18 17h28a3 3 0 0 1 3 3v5H15v-5a3 3 0 0 1 3-3z"/><rect x="21.5" y="12.5" width="4.4" height="8.5" rx="2.2"/><rect x="38.1" y="12.5" width="4.4" height="8.5" rx="2.2"/><path d="M15 28h34v17a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3z M21 33.5h6v5.5h-6z M29 33.5h6v5.5h-6z M37 33.5h6v5.5h-6z M21 41.5h6v3.5h-6z" fill-rule="evenodd"/>`,
  horloge: `<circle cx="32" cy="31" r="17.5"/><path class="med-glyph-ink" d="M32 20.5v11.7l8.2 5-1.9 3-9.8-6V20.5z" fill-rule="nonzero"/>`,
  stats: `<rect x="15" y="34" width="7.5" height="14" rx="2.2"/><rect x="28.2" y="25" width="7.5" height="23" rx="2.2"/><rect x="41.5" y="15" width="7.5" height="33" rx="2.2"/>`,
  cible: `<circle cx="32" cy="31" r="17.5" fill="none" stroke="#fff" stroke-width="4.2"/><circle cx="32" cy="31" r="9" fill="none" stroke="#fff" stroke-width="3.6"/><circle cx="32" cy="31" r="2.8"/>`,
  eclair: `<path d="M36.5 11 18 34.5h10.5L27 51.5 46 27H35z"/>`,
  fusee: `<path d="M32 11c7 4.5 9.5 12.6 9.5 19.3 0 2.3-.3 4.5-.8 6.4H23.3a26 26 0 0 1-.8-6.4C22.5 23.6 25 15.5 32 11z"/><circle class="med-glyph-ink" cx="32" cy="26" r="3.7"/><path d="M22.8 32.5 16 42l7.6-1.9c-.5-2.4-.8-5-.8-7.6z M41.2 32.5c0 2.6-.3 5.2-.8 7.6L48 42z"/><path d="M28.5 40.5h7L32 51z" fill="#ffd24a"/>`,
  bouclier: `<path d="M32 12 15.5 18v13.5C15.5 42 22.5 49 32 52c9.5-3 16.5-10 16.5-20.5V18z"/><path class="med-glyph-ink" d="m24.5 31 5 5.2L40 25.5l3 3.1-13.5 13.9-8-8.4z" fill-rule="nonzero"/>`,
  coeur: `<path d="M32 49S13.5 38.5 13.5 25.3C13.5 18.5 18.6 14 24 14c3.3 0 6.3 1.7 8 4.4C33.7 15.7 36.7 14 40 14c5.4 0 10.5 4.5 10.5 11.3C50.5 38.5 32 49 32 49z"/>`,
  cadenas: `<path d="M32 12a10 10 0 0 0-10 10v5h-2a3 3 0 0 0-3 3v16a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3V30a3 3 0 0 0-3-3h-2v-5a10 10 0 0 0-10-10zm0 5.5a5.5 5.5 0 0 1 5.5 5.5v4h-11v-4A5.5 5.5 0 0 1 32 17.5z"/><circle class="med-glyph-ink" cx="32" cy="37" r="3.2"/><rect class="med-glyph-ink" x="30.4" y="38.5" width="3.2" height="5.5" rx="1.6"/>`,
  euro: `<path d="M36.8 44.5c-4.3 0-7.9-2.5-9.7-6.5H37l1.4-3.7H26c-.1-.7-.1-1.5-.1-2.3l.1-2.3h12.8l1.4-3.7H27.1c1.8-4 5.4-6.5 9.7-6.5 2.4 0 4.6.7 6.4 2l2.2-4.3a17 17 0 0 0-8.6-2.2c-7.3 0-13.3 4.4-15.6 11h-4.4L15.4 30h3.9l-.1 2.3.1 2.3h-2.5L15.4 38h4.8c2.3 6.6 8.3 11 15.6 11 3.2 0 6.1-.8 8.6-2.2l-2.2-4.3a11 11 0 0 1-5.4 2z"/>`,
  reglages: `<path d="M28.8 12h6.4l1 5.4c1.3.4 2.5 1 3.6 1.7l5.2-2 3.2 5.5-4.2 3.5c.1.7.2 1.4.2 2.2s-.1 1.5-.2 2.2l4.2 3.5-3.2 5.5-5.2-2c-1.1.7-2.3 1.3-3.6 1.7l-1 5.4h-6.4l-1-5.4a15 15 0 0 1-3.6-1.7l-5.2 2-3.2-5.5 4.2-3.5a13 13 0 0 1 0-4.4l-4.2-3.5 3.2-5.5 5.2 2c1.1-.7 2.3-1.3 3.6-1.7z" transform="translate(0 2.7)"/><circle class="med-glyph-ink" cx="32" cy="31" r="5.8"/>`,
  crayon: `<path d="m39.5 13.5 7 7L26 41l-9.5 2.5L19 34z M17 47h30v4H17z"/>`,
  megaphone: `<path d="M43 13v30l-13-6.5H19a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4h11z"/><path d="M46.5 21.5a7 7 0 0 1 0 13z"/><path d="M22 45.5v-9h6.5v9a3.3 3.3 0 0 1-6.5 0z" transform="translate(0 2)"/>`,
  soleil: `<circle cx="32" cy="31" r="9.5"/><path d="M32 11.5v6M32 44.5v6M12.5 31h6M45.5 31h6M18 17l4.2 4.2M41.8 40.8 46 45M46 17l-4.2 4.2M22.2 40.8 18 45" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  lune: `<path d="M38 12a17.5 17.5 0 1 0 12.7 24.4A15 15 0 0 1 38 12z"/>`,
  check: `<path d="m17 32.5 5-5.2 7.5 7.4L42 20l5 5-17.5 17.7z"/>`,
  livret: `<path d="M32 18.5c-3.6-3-8.6-4.2-15-4.2a3 3 0 0 0-3 3v26.5a3 3 0 0 0 3 3c6.4 0 11.4.9 15 3.7 3.6-2.8 8.6-3.7 15-3.7a3 3 0 0 0 3-3V17.3a3 3 0 0 0-3-3c-6.4 0-11.4 1.2-15 4.2z M29.8 22.3v22c-3.2-1.6-7-2.3-11.3-2.4v-22c4.5.1 8.3 1 11.3 2.4z" fill-rule="evenodd"/>`,

  // ── Lots / boutique ──
  boutique: `<path d="M25.5 28.5v-7a6.5 6.5 0 0 1 13 0v7" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M19.5 24.5h25L47 46.6a3.5 3.5 0 0 1-3.5 3.9h-23a3.5 3.5 0 0 1-3.5-3.9z"/><circle class="med-glyph-ink" cx="26" cy="31.5" r="2.1"/><circle class="med-glyph-ink" cx="38" cy="31.5" r="2.1"/>`,
  cafe: `<path d="M16.5 24h25v13.5a9 9 0 0 1-9 9h-7a9 9 0 0 1-9-9z"/><path d="M44.5 26.5h2.6a5.7 5.7 0 0 1 0 11.4h-2.6v-4h2.2a1.7 1.7 0 0 0 0-3.4h-2.2z"/><path d="M24 13.5c-1.6 2.3-1.6 4.2 0 6.5M31.5 13.5c-1.6 2.3-1.6 4.2 0 6.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  repas: `<path d="M17 27c0-8 7-13 15-13s15 5 15 13z"/><rect x="16" y="30" width="32" height="5.5" rx="2.7"/><path d="M17 39h30v3a7 7 0 0 1-7 7H24a7 7 0 0 1-7-7z"/>`,
  ticket: `<path d="M15 21h34a3 3 0 0 1 3 3v5.2a6.3 6.3 0 0 0 0 12.6V47a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3v-5.2a6.3 6.3 0 0 0 0-12.6V24a3 3 0 0 1 3-3z"/><path class="med-glyph-ink" d="M38 25h3.5v4H38z M38 33.5h3.5v4H38z M38 42h3.5v4H38z"/>`,
  casque: `<path d="M32 13a16 16 0 0 0-16 16v11a4 4 0 0 0 4 4h1V31.5h-2.4V29a13.4 13.4 0 0 1 26.8 0v2.5H43V44h1a4 4 0 0 0 4-4V29A16 16 0 0 0 32 13z"/><rect x="20" y="31" width="7.5" height="14" rx="3.2"/><rect x="36.5" y="31" width="7.5" height="14" rx="3.2"/>`,
};

let _uid = 0;

/**
 * Génère un médaillon 3D premium.
 * @param {keyof typeof GLYPHS|string} name  glyphe du catalogue interne
 * @param {keyof typeof MED_RAMPS} ramp  rampe de couleur
 * @param {{ size?: number, shape?: "coin"|"tile", glow?: boolean, cls?: string }} opts
 */
export function medallion(name, ramp = "violet", opts = {}) {
  const requestedSize = Number(opts.size);
  const size = Number.isFinite(requestedSize)
    ? Math.min(256, Math.max(12, Math.round(requestedSize)))
    : 44;
  const shape = opts.shape === "tile" ? "tile" : "coin";
  const glow = opts.glow === true;
  const cls = String(opts.cls ?? "")
    .split(/\s+/)
    .filter((part) => /^[a-z][a-z0-9_-]*$/i.test(part))
    .join(" ");
  const [hot, mid, deep, ink] = MED_RAMPS[ramp] || MED_RAMPS.violet;
  const id = `pgm${++_uid}`;
  const glyph = GLYPHS[name] || GLYPHS.etoile;

  const body =
    shape === "tile"
      ? `<rect x="6" y="5" width="52" height="52" rx="15" fill="url(#${id}b)"/>
         <rect x="6" y="5" width="52" height="52" rx="15" fill="none" stroke="url(#${id}r)" stroke-width="1.8"/>
         <rect x="9" y="8" width="46" height="46" rx="12.4" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="1.8"/>
         <path d="M10 18c0-6 4-9.8 10-9.8h24c6 0 10 3.8 10 9.8v2.5c-8-4.6-15.5-6.9-22-6.9s-14 2.3-22 6.9z" fill="url(#${id}g)"/>
         <path d="M12 50.5c6.2 2.6 13 4 20 4s13.8-1.4 20-4v.5c0 3.4-3 6-6.6 6H18.6c-3.6 0-6.6-2.6-6.6-6z" fill="#fff" opacity=".14"/>`
      : `<circle cx="32" cy="31" r="27" fill="url(#${id}b)"/>
         <circle cx="32" cy="31" r="27" fill="none" stroke="url(#${id}r)" stroke-width="1.8"/>
         <circle cx="32" cy="31" r="23.4" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="2"/>
         <path d="M11.5 23.5a21 12.5 0 0 1 41 0 25 16.5 0 0 0-41 0z" fill="url(#${id}g)"/>
         <path d="M13 40a20.5 11 0 0 0 38 0 24 14.5 0 0 1-38 0z" fill="#fff" opacity=".13"/>`;

  return `<svg class="pg-med${cls ? ` ${escAttr(cls)}` : ""}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs>
    <radialGradient id="${id}b" cx="36%" cy="27%" r="80%"><stop offset="0" stop-color="${hot}"/><stop offset=".48" stop-color="${mid}"/><stop offset="1" stop-color="${deep}"/></radialGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".55" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="${id}s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1" flood-color="${ink}" flood-opacity=".5"/></filter>
  </defs>
  ${glow ? `<circle cx="32" cy="31" r="30.5" fill="${mid}" opacity=".28"/>` : ""}
  ${body}
  <g fill="#fff" filter="url(#${id}s)" style="--med-ink:${ink}">${glyph.replaceAll('class="med-glyph-ink"', `fill="${ink}" fill-opacity=".82"`)}</g>
</svg>`;
}

/** Liste des glyphes dispo (pour la galerie / debug). */
export const MED_GLYPH_NAMES = Object.keys(GLYPHS);

// ── Statuts standard (livret, compte-rendu, log-session, parcours…) ──
// UNE seule grammaire visuelle pour « acquis / en cours / à retravailler /
// verrouillé » dans toute l'app, quel que soit le rôle.
const STATUS_DEF = {
  acquis: ["check", "green"],
  encours: ["horloge", "blue"],
  retravailler: ["faute", "orange"],
  verrouille: ["cadenas", "slate"],
};

/**
 * Pastille de statut 3D.
 * @param {"acquis"|"encours"|"retravailler"|"verrouille"} status
 */
export function medStatus(status, opts = {}) {
  const [glyph, ramp] = STATUS_DEF[status] || STATUS_DEF.encours;
  return medallion(glyph, ramp, { size: 26, ...opts });
}

// ── Lots de la roue (config moniteur → affichage élève) ──
// Les lots sont stockés avec un emoji (icon picker #419). On ne touche pas
// aux données : on TRADUIT l'emoji en médaillon au rendu. Emoji inconnu →
// médaillon cadeau générique (jamais d'emoji nu).
const EMOJI_MED = {
  "🎁": ["cadeau", "pink"],
  "🚗": ["voiture", "blue"],
  "🧰": ["reglages", "slate"],
  "☕": ["cafe", "orange"],
  "🎟️": ["ticket", "violet"],
  "🎫": ["ticket", "violet"],
  "🛒": ["boutique", "teal"],
  "⛽": ["voiture", "green"],
  "🍔": ["repas", "red"],
  "🎧": ["casque", "indigo"],
  "🧢": ["couronne", "cyan"],
  "🅰️": ["examen", "red"],
  "🏆": ["trophee", "gold"],
  "💎": ["diamant", "cyan"],
  "⭐": ["etoile", "gold"],
  "🔑": ["cle", "gold"],
};

/** Médaillon d'un lot de roue à partir de son emoji stocké. */
export function medLot(emoji, opts = {}) {
  const [glyph, ramp] = EMOJI_MED[(emoji || "").trim()] || ["cadeau", "pink"];
  return medallion(glyph, ramp, opts);
}
