// ═══════════════════════════════════════════════════════════════
// Bottom-sheet « lecture en grand » d'un conseil du coach (demande Rayan
// 22/07 : « je dois pouvoir cliquer dessus pour afficher en plus gros »).
// Partagé : fiche de révision conduite (revision-conduite.js, cartes coach)
// + fiche compétence de « Mon permis » (parcours.js, conseil du coach).
//
// Auto-contenu : CSS injecté une fois, monté sur document.body (au-dessus
// des sheets existants — bsheet de parcours est à z-index 99). Fermeture :
// croix, tap sur le fond, swipe-down (sheet-swipe.js) et Échap. Bilingue :
// traduction affichée + français gardé dessous (arabe RTL par span, l'app
// reste LTR) — même recette que le reste des fiches.
// ═══════════════════════════════════════════════════════════════
import { esc, escAttr } from "@/utils/escape.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";

const STYLE_ID = "coach-sheet-style";

const CSS = `
.chs-ov{ position:fixed; inset:0; z-index:420; background:rgba(10,8,28,.62);
  opacity:0; transition:opacity .22s ease; -webkit-tap-highlight-color:transparent; }
.chs-ov.open{ opacity:1; }
.chs{ position:fixed; left:50%; bottom:0; transform:translate(-50%,104%); z-index:421;
  width:100%; max-width:520px; max-height:92dvh; overflow-y:auto; overscroll-behavior:contain;
  border-radius:26px 26px 0 0; padding:10px 24px calc(34px + env(safe-area-inset-bottom));
  background:
    radial-gradient(120% 50% at 50% -4%, rgba(255,190,70,.10) 0%, transparent 55%),
    linear-gradient(180deg,#1c1548 0%,#12102d 55%,#0c0a20 100%);
  border-top:1px solid rgba(255,255,255,.14); box-shadow:0 -18px 50px rgba(0,0,0,.5);
  color:#f2f0fa; font-family:'Inter',sans-serif; box-sizing:border-box;
  transition:transform .3s cubic-bezier(.32,.72,0,1); touch-action:pan-y; }
.chs.open{ transform:translate(-50%,0); }
.chs *{ box-sizing:border-box; }
.chs-handle{ width:44px; height:5px; border-radius:99px; margin:4px auto 16px; background:rgba(255,255,255,.24); }
.chs-x{ position:absolute; top:16px; right:16px; width:44px; height:44px; cursor:pointer;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); border-radius:14px; color:#e9e2ff;
  display:flex; align-items:center; justify-content:center; }
.chs-x:active{ transform:scale(.94); }
.chs-ic{ width:52px; height:52px; border-radius:16px; display:flex; align-items:center; justify-content:center;
  background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.16); color:#ffd76e; margin:2px 0 14px; }
.chs-ic svg, .chs-ic img{ transform:scale(1.35); }
.chs-h{ margin:0 0 14px; font:800 22px/1.2 'Baloo 2',cursive; padding-right:52px;
  background:linear-gradient(180deg,#ffe9b0,#f5b73d); -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent; color:transparent; }
.chs-h[dir="rtl"]{ direction:rtl; padding-right:0; padding-left:52px; text-align:right; }
.chs-txt{ margin:0; font:600 19.5px/1.62 'Inter',sans-serif; color:#f2f0fa; overflow-wrap:break-word; }
.chs-tr{ display:block; }
.chs-tr[dir="rtl"]{ font-size:21px; line-height:1.75; }
.chs-fr{ display:block; margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,.12);
  font:500 15.5px/1.6 'Inter',sans-serif; color:#b9aee0; }
@media (prefers-reduced-motion: reduce){ .chs, .chs-ov{ transition:none; } }
`;

const X_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;

/**
 * Ouvre le conseil « en grand ». Modal, une seule feuille à la fois.
 * @param {object} opts
 * @param {string} opts.title       Titre de la carte (déjà traduit si besoin)
 * @param {string} opts.fr          Texte français (complet)
 * @param {string|null} [opts.tr]   Traduction (en/ar) — affichée au-dessus du FR
 * @param {boolean} [opts.rtl]      true = la traduction est en arabe (RTL par span)
 * @param {string} [opts.icon]      SVG/HTML d'icône (échappé en amont — jamais de saisie utilisateur)
 * @param {string} [opts.closeLabel] aria-label de la croix
 * @returns {() => void} fonction de fermeture
 */
export function openCoachSheet({
  title,
  fr,
  tr = null,
  rtl = false,
  icon = "",
  closeLabel = "Fermer",
}) {
  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  document.querySelector(".chs-ov")?.remove(); // jamais deux feuilles empilées

  const prevFocus = document.activeElement;
  const ov = document.createElement("div");
  ov.className = "chs-ov";
  ov.innerHTML = `
    <div class="chs" role="dialog" aria-modal="true" aria-label="${escAttr(title)}">
      <div class="chs-handle" aria-hidden="true"></div>
      <button class="chs-x" type="button" aria-label="${escAttr(closeLabel)}">${X_SVG}</button>
      ${icon ? `<div class="chs-ic" aria-hidden="true">${icon}</div>` : ""}
      <h2 class="chs-h"${rtl ? ' dir="rtl" lang="ar"' : ""}>${esc(title)}</h2>
      <p class="chs-txt">${
        tr
          ? `<span class="chs-tr"${rtl ? ' dir="rtl" lang="ar"' : ""}>${esc(tr)}</span>` +
            `<span class="chs-fr" lang="fr" dir="ltr">${esc(fr)}</span>`
          : esc(fr)
      }</p>
    </div>`;
  document.body.appendChild(ov);

  const sheet = ov.querySelector(".chs");
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey);
    ov.classList.remove("open");
    sheet.classList.remove("open");
    document.body.style.overflow = prevOverflow;
    setTimeout(() => ov.remove(), 240);
    if (prevFocus && typeof prevFocus.focus === "function") {
      try {
        prevFocus.focus();
      } catch {
        /* élément disparu entre-temps : non bloquant */
      }
    }
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };

  document.addEventListener("keydown", onKey);
  ov.addEventListener("click", (e) => {
    if (e.target === ov) close(); // tap hors zone
  });
  ov.querySelector(".chs-x").addEventListener("click", close);
  enableSheetSwipe(sheet, close, { overlay: ov, direction: "down" });

  requestAnimationFrame(() => {
    ov.classList.add("open");
    sheet.classList.add("open");
    sheet.querySelector(".chs-x")?.focus();
  });
  return close;
}
