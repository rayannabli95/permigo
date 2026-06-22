// ═══════════════════════════════════════════════════════════════
// A2HS Steps — marche à suivre VISUELLE « ajouter à l'écran d'accueil ».
// Pensée flemmards / seniors : 2 gestes max, gros pictos, 3-4 mots par
// étape. Repère = l'icône bleue Partager (reconnaissable), PAS sa position :
// elle est en bas sur iPhone, mais en haut sur iPad ou si la barre Safari
// est réglée en haut → on ne fige pas le côté (bug remonté : « clique en bas »
// trompait les élèves dont la barre est en haut). Chrome Android : menu en haut.
// Partagé par install-nudge (bottom-sheet) et l'onboarding (dernière slide).
// ═══════════════════════════════════════════════════════════════

// Glyphe Partager iOS — bleu système, comme dans Safari (reconnaissance immédiate)
const SHARE_SVG = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="m8 7 4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>`;
// Glyphe « Sur l'écran d'accueil » iOS (carré arrondi avec +)
const PLUS_SVG = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/></svg>`;
// Menu ⋮ Chrome Android
const DOTS_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;

export const A2HS_STYLE = `
.a2s { display: flex; flex-direction: column; gap: 9px; }
.a2s-step {
  display: flex; align-items: center; gap: 14px;
  background: var(--bg2); border: 1px solid var(--bo2);
  border-radius: 16px; padding: 12px 14px;
}
.a2s-glyph {
  flex: 0 0 52px; width: 52px; height: 52px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
}
/* Codes visuels iOS : Partager = bleu système sur fond clair, + = neutre */
.a2s-glyph.share { background: #eaf2ff; color: #0a84ff; }
.a2s-glyph.plus  { background: var(--su); color: var(--ink); border: 1px solid var(--bo); }
.a2s-glyph.dots  { background: var(--su); color: var(--ink); border: 1px solid var(--bo); }
[data-theme="dark"] .a2s-glyph.share { background: rgba(10,132,255,.18); }
.a2s-txt { font: 600 15px/1.35 'Inter', sans-serif; color: var(--ink); min-width: 0; }
.a2s-txt b { font-weight: 800; }
.a2s-num {
  margin-left: auto; flex-shrink: 0;
  font: 800 13px/26px 'Inter', sans-serif; text-align: center;
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--a); color: var(--a-ink);
}
/* Flèche animée vers l'emplacement réel du bouton */
.a2s-point {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font: 700 13.5px/1.2 'Inter', sans-serif; color: var(--a-txt);
  padding: 2px 0 0;
}
.a2s-point svg { display: block; }
.a2s-point.down svg { animation: a2sBounceY 1.1s ease-in-out infinite; }
.a2s-point.up { justify-content: flex-end; padding-right: 6px; }
.a2s-point.up svg { animation: a2sBounceYUp 1.1s ease-in-out infinite; }
@keyframes a2sBounceY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
@keyframes a2sBounceYUp { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@media (prefers-reduced-motion: reduce) { .a2s-point svg { animation: none !important; } }
`;

const ARROW_UP = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V4"/><path d="m6 10 6-6 6 6"/></svg>`;

/**
 * Marche à suivre visuelle.
 * @param {'ios'|'android'} platform
 * @returns {string} HTML (styles via A2HS_STYLE, à injecter une fois)
 */
export function a2hsStepsHTML(platform) {
  if (platform === "ios") {
    return `
    <div class="a2s">
      <div class="a2s-step">
        <div class="a2s-glyph share">${SHARE_SVG}</div>
        <div class="a2s-txt">Touche <b>Partager</b></div>
        <div class="a2s-num">1</div>
      </div>
      <div class="a2s-point">le bouton bleu Partager — en bas, ou en haut de Safari</div>
      <div class="a2s-step">
        <div class="a2s-glyph plus">${PLUS_SVG}</div>
        <div class="a2s-txt"><b>« Sur l'écran d'accueil »</b></div>
        <div class="a2s-num">2</div>
      </div>
    </div>`;
  }
  return `
    <div class="a2s">
      <div class="a2s-point up">le menu, en haut à droite ${ARROW_UP}</div>
      <div class="a2s-step">
        <div class="a2s-glyph dots">${DOTS_SVG}</div>
        <div class="a2s-txt">Touche le <b>menu</b></div>
        <div class="a2s-num">1</div>
      </div>
      <div class="a2s-step">
        <div class="a2s-glyph plus">${PLUS_SVG}</div>
        <div class="a2s-txt"><b>« Ajouter à l'écran d'accueil »</b></div>
        <div class="a2s-num">2</div>
      </div>
    </div>`;
}
