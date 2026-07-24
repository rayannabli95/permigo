// ═══════════════════════════════════════════════════════════════
// Arène — skin de classement premium partagé (élève + moniteur)
// Esprit Supercell / Clash Royale : nuit-violet, glow contenu, podium
// 3D, ligne « Toi » épinglée, rail de paliers. Un SEUL accent pilote
// toute la teinte via les variables CSS --acc / --acc-lt / --acc-dk —
// côté élève = violet (Conduite) ou bleu (Révision) ; côté moniteur =
// indigo. Aucune logique métier ici : juste le rendu + le style.
//
// Usage :
//   root.innerHTML = `${ARENE_CSS}<div class="arn" style="${areneAccent('violet')}"> … </div>`;
//   arenePodium(top3, { fmtScore }) · areneRow({...}) · areneMeRow({...})
//   arenePaliers({ items, doneCount, targetIdx, title, goal })
// ═══════════════════════════════════════════════════════════════
import { esc, escAttr } from "@/utils/escape.js";
import { getLang } from "@/utils/lang.js";
// i18n coque (EN/AR), repli FR.
function arYou() { const l = getLang(); return l === "en" ? "You" : l === "ar" ? "أنت" : "Toi"; }
function arRank(n) { const l = getLang(); return l === "en" ? `Rank ${n}` : l === "ar" ? `المرتبة ${n}` : `Rang ${n}`; }
function arMyRank(n) { const l = getLang(); return l === "en" ? `Your rank: ${n}` : l === "ar" ? `مركزك: ${n}` : `Ta place : ${n}`; }
import { renderUserAvatar } from "@/components/common/avatar.js";

// Presets d'accent (couleur, clair, foncé). On peut aussi passer un objet
// { acc, lt, dk } à areneAccent() pour un accent sur-mesure.
export const ARENE_ACCENTS = {
  violet: { acc: "#6d4dff", lt: "#a78bff", dk: "#4a2fc4" }, // Conduite (élève)
  bleu: { acc: "#2563eb", lt: "#60a5fa", dk: "#1d4ed8" }, // Révision (élève)
  indigo: { acc: "#4f46e5", lt: "#8b8bff", dk: "#3730c4" }, // Moniteur
};

/** Renvoie la chaîne `style` qui fixe l'accent actif de l'arène. */
export function areneAccent(preset) {
  const p = typeof preset === "string" ? ARENE_ACCENTS[preset] : preset || null;
  const a = p || ARENE_ACCENTS.violet;
  return `--acc:${a.acc};--acc-lt:${a.lt};--acc-dk:${a.dk}`;
}

// Petit raccourci médaille → libellé/classe métal pour le top-3.
const METAL = { 1: "gold", 2: "silver", 3: "bronze" };

// ─── CSS ─────────────────────────────────────────────────────────
export const ARENE_CSS = `<style>
.arn{
  --acc:#6d4dff; --acc-lt:#a78bff; --acc-dk:#4a2fc4;
  --n0:#0a0820; --n1:#13102f;
  --gold:#f7b32b; --gold-dk:#e08e0b; --silver:#b9c2d0; --silver-dk:#8d97a8;
  --bronze:#cd8b5b; --bronze-dk:#a96a3c;
  --aink:#f4f2ff; --asoft:#c7c2e8; --amute:#9a93c8; --aup:#3ddc84;
  position:relative; isolation:isolate;
  min-height:100vh; max-width:520px;
  /* Remonte de la hauteur déjà comptée par #app : le fond nuit glisse sous le
     header verre (pattern livret), le contenu reste sous le header. */
  margin:calc(-1 * (var(--th,52px) + env(safe-area-inset-top,0px))) auto 0;
  padding:calc(var(--th,52px) + env(safe-area-inset-top,0px)) 0 calc(86px + env(safe-area-inset-bottom,0px));
  color:var(--aink); font-family:'Inter',system-ui,sans-serif;
  background:
    radial-gradient(115% 55% at 50% 4%, color-mix(in srgb,var(--acc) 26%, transparent), transparent 60%),
    radial-gradient(140% 80% at 50% 120%, rgba(0,0,0,.55), transparent 55%),
    linear-gradient(168deg, var(--acc-dk) 0%, var(--n1) 40%, var(--n0) 100%);
  transition:background .45s ease;
}
.arn::before{ /* étoiles discrètes */
  content:""; position:absolute; inset:0; pointer-events:none; opacity:.5; z-index:0;
  background-image:
    radial-gradient(1.4px 1.4px at 18% 6%, rgba(255,255,255,.7), transparent),
    radial-gradient(1.2px 1.2px at 78% 4%, rgba(255,255,255,.55), transparent),
    radial-gradient(1.1px 1.1px at 62% 12%, rgba(255,255,255,.5), transparent),
    radial-gradient(1.3px 1.3px at 32% 16%, rgba(255,255,255,.45), transparent),
    radial-gradient(1px 1px at 88% 18%, rgba(255,255,255,.4), transparent);
}
.arn > *{ position:relative; z-index:2; }

/* ── En-tête ── */
.arn-hd{ padding:14px 20px 0; text-align:center; }
.arn-hd h1{ font:800 22px/1.1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.02em; margin:0; }
.arn-hd .arn-sub{ font:600 12.5px/1.4 'Inter',sans-serif; color:var(--amute); margin:5px 0 0; }

/* ── Segmented control (ligues) ── */
.arn-seg{
  margin:14px 20px 4px; display:flex; gap:4px; padding:4px;
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
  border-radius:16px; -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
}
.arn-seg button{
  flex:1; border:0; cursor:pointer; padding:10px 6px; border-radius:12px;
  font:700 14px/1.15 'Plus Jakarta Sans',sans-serif; letter-spacing:-.2px;
  color:var(--asoft); background:transparent;
  display:flex; flex-direction:column; align-items:center; gap:1px;
  transition:color .2s, background .2s; -webkit-tap-highlight-color:transparent;
}
.arn-seg button .sub{ font:600 10px/1.2 'Inter',sans-serif; opacity:.72; letter-spacing:0; }
.arn-seg button[aria-selected="true"]{
  color:#fff; background:linear-gradient(180deg, var(--acc-lt), var(--acc));
  box-shadow:0 4px 14px color-mix(in srgb,var(--acc) 55%, transparent), inset 0 1px 0 rgba(255,255,255,.35);
}
.arn-seg button:active{ transform:scale(.98); }

/* ── Portée (Mon école / National) + effectif ── */
.arn-scopebar{ margin:12px 20px 4px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
.arn-scope{ display:inline-flex; padding:3px; gap:2px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.09); border-radius:11px; }
.arn-scope button{ border:0; cursor:pointer; background:transparent; color:var(--amute); font:700 12px/1 'Inter',sans-serif; padding:7px 12px; border-radius:9px; transition:.18s; -webkit-tap-highlight-color:transparent; }
.arn-scope button.on{ background:rgba(255,255,255,.14); color:#fff; }
.arn-scope button:active{ transform:scale(.97); }
.arn-effectif{ font:600 11.5px/1 'Inter',sans-serif; color:var(--amute); font-variant-numeric:tabular-nums; flex-shrink:0; }

/* ── PODIUM ── */
.arn-podium-wrap{ margin:4px 0 0; padding:0 14px; position:relative; }
.arn-podium-glow{ position:absolute; left:50%; top:16px; width:230px; height:230px; transform:translateX(-50%); background:radial-gradient(circle, color-mix(in srgb,var(--acc) 36%, transparent), transparent 62%); filter:blur(8px); pointer-events:none; z-index:0; }
.arn-podium{ position:relative; display:grid; grid-template-columns:1fr 1.18fr 1fr; align-items:end; gap:8px; padding-top:16px; }
.arn-pcol{ display:flex; flex-direction:column; align-items:center; min-width:0; }
.arn-pcol.clickable{ cursor:pointer; -webkit-tap-highlight-color:transparent; transition:transform .12s; }
.arn-pcol.clickable:active{ transform:scale(.96); }
.arn-pcol:focus-visible{ outline:2px solid var(--acc-lt); outline-offset:3px; border-radius:12px; }
.arn-crown{ width:30px; height:22px; margin-bottom:-2px; filter:drop-shadow(0 3px 5px rgba(247,179,43,.55)); animation:arnBob 2.8s ease-in-out infinite; }
@keyframes arnBob{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
.arn-pav{ position:relative; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; }
.arn-pav::after{ content:""; position:absolute; inset:-4px; border-radius:50%; padding:3px; pointer-events:none;
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; }
.arn-pav.m-gold{ box-shadow:0 0 22px rgba(247,179,43,.5); } .arn-pav.m-gold::after{ background:linear-gradient(160deg,#ffe08a,var(--gold),var(--gold-dk)); }
.arn-pav.m-silver{ box-shadow:0 0 16px rgba(185,194,208,.4); } .arn-pav.m-silver::after{ background:linear-gradient(160deg,#eef1f6,var(--silver),var(--silver-dk)); }
.arn-pav.m-bronze{ box-shadow:0 0 16px rgba(205,139,91,.4); } .arn-pav.m-bronze::after{ background:linear-gradient(160deg,#f0cba6,var(--bronze),var(--bronze-dk)); }
.arn-pav.is-me{ box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 75%, transparent), 0 0 26px color-mix(in srgb,var(--acc) 60%, transparent); }
.arn-medal{ position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); width:22px; height:22px; border-radius:50%;
  display:flex; align-items:center; justify-content:center; font:800 11px/1 'Plus Jakarta Sans',sans-serif; color:#3a2a00; border:2px solid var(--n0); }
.arn-medal.gold{ background:linear-gradient(160deg,#ffe08a,var(--gold)); }
.arn-medal.silver{ background:linear-gradient(160deg,#eef1f6,var(--silver)); color:#2c3140; }
.arn-medal.bronze{ background:linear-gradient(160deg,#f0cba6,var(--bronze)); color:#3a230f; }
.arn-pname{ margin-top:11px; font:700 13px/1.2 'Plus Jakarta Sans',sans-serif; max-width:100%; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.arn-pname.me{ color:#fff; }
.arn-youtag{ display:inline-block; font:800 9px/1 'Inter',sans-serif; letter-spacing:.4px; background:linear-gradient(180deg,var(--acc-lt),var(--acc)); color:#fff; padding:1px 6px; border-radius:6px; margin-left:2px; vertical-align:1px; }
.arn-pscore{ font:800 15px/1 'Plus Jakarta Sans',sans-serif; margin-top:3px; font-variant-numeric:tabular-nums; letter-spacing:-.3px; }
.arn-pscore .of{ font:700 11px/1 'Inter',sans-serif; color:var(--amute); }
.arn-pscore.me{ color:var(--acc-lt); }
.arn-ped{ width:100%; margin-top:11px; border-radius:14px 14px 0 0; display:flex; align-items:flex-start; justify-content:center; padding-top:8px;
  font:800 22px/1 'Plus Jakarta Sans',sans-serif; background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.03));
  border:1px solid rgba(255,255,255,.12); border-bottom:0; box-shadow:inset 0 1px 0 rgba(255,255,255,.22); }
.arn-ped.p1{ height:80px; color:var(--gold); } .arn-ped.p2{ height:58px; color:var(--silver); } .arn-ped.p3{ height:46px; color:var(--bronze); }
.arn-ped.p1.me-ped{ background:linear-gradient(180deg, color-mix(in srgb,var(--acc) 32%,transparent), color-mix(in srgb,var(--acc) 8%,transparent)); border-color:color-mix(in srgb,var(--acc) 45%, transparent); }

/* ── Nudge perso ── */
.arn-nudge{ margin:6px 20px 0; font:600 12px/1.4 'Inter',sans-serif; color:var(--asoft); text-align:center; }
.arn-nudge b{ color:var(--acc-lt); font-weight:800; }

/* ── Liste dense ── */
.arn-list-head{ display:flex; align-items:center; margin:16px 20px 8px; }
.arn-list-head .lbl{ font:700 12px/1 'Inter',sans-serif; color:var(--amute); letter-spacing:.3px; text-transform:uppercase; white-space:nowrap; }
.arn-list-head .rule{ flex:1; height:1px; margin-left:12px; background:linear-gradient(90deg,rgba(255,255,255,.14),transparent); }
.arn-list{ padding:0 14px; display:flex; flex-direction:column; gap:6px; }
.arn-row{ display:flex; align-items:center; gap:11px; padding:9px 12px; border-radius:14px;
  background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.07);
  -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); min-height:48px;
  transition:background .18s, transform .12s; }
.arn-row.clickable{ cursor:pointer; }
.arn-row.clickable:hover{ background:rgba(255,255,255,.09); }
.arn-row.clickable:active{ transform:scale(.985); }
.arn-row:focus-visible{ outline:2px solid var(--acc-lt); outline-offset:2px; }
.arn-rk{ flex-shrink:0; width:24px; text-align:center; font:800 14px/1 'Plus Jakarta Sans',sans-serif; color:var(--amute); font-variant-numeric:tabular-nums; }
.arn-av{ flex-shrink:0; width:38px; height:38px; }
.arn-av-lg{ width:74px; height:74px; } .arn-av-md{ width:56px; height:56px; }
.arn-nm{ flex:1; min-width:0; font:700 14px/1.25 'Plus Jakarta Sans',sans-serif; letter-spacing:-.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.arn-sc{ flex-shrink:0; font:800 15px/1 'Plus Jakarta Sans',sans-serif; font-variant-numeric:tabular-nums; letter-spacing:-.3px; text-align:right; }
.arn-sc .of{ font:700 11px/1 'Inter',sans-serif; color:var(--amute); }
.arn-chip{ flex-shrink:0; display:inline-flex; align-items:center; gap:3px; font:700 11px/1 'Inter',sans-serif; padding:4px 8px; border-radius:999px; }
.arn-chip.flame{ color:#fff; background:color-mix(in srgb,#f59e0b 88%, var(--acc)); }
.arn-chip.flame.off{ color:var(--amute); background:rgba(255,255,255,.07); }

/* ── Ligne « Toi » épinglée ── */
.arn-merow{ position:sticky; bottom:calc(8px + env(safe-area-inset-bottom,0px)); margin:10px 14px 2px;
  display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:16px;
  background:linear-gradient(180deg, color-mix(in srgb,var(--acc) 30%, rgba(20,16,48,.92)), color-mix(in srgb,var(--acc-dk) 60%, rgba(12,9,32,.94)));
  border:1px solid color-mix(in srgb,var(--acc-lt) 55%, transparent); border-left:4px solid var(--acc-lt);
  box-shadow:0 10px 28px color-mix(in srgb,var(--acc) 45%, transparent), 0 0 0 1px rgba(255,255,255,.06) inset; }
.arn-merow .arn-rk{ width:34px; color:#fff; font-size:16px; }
.arn-merow .arn-av{ width:42px; height:42px; box-shadow:0 0 0 2px rgba(255,255,255,.25); border-radius:50%; }
.arn-merow .arn-nm{ font:800 14.5px/1.2 'Plus Jakarta Sans',sans-serif; color:#fff; }
.arn-merow .arn-nm .pal{ display:block; font:600 11px/1.2 'Inter',sans-serif; color:rgba(255,255,255,.82); margin-top:2px; }
.arn-merow .arn-sc{ font-size:18px; color:#fff; } .arn-merow .arn-sc .of{ color:rgba(255,255,255,.75); }

/* ── Rail des paliers ── */
.arn-paliers{ margin:18px 14px 4px; padding:13px 12px 12px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.08); border-radius:18px; }
.arn-palhd{ display:flex; align-items:center; justify-content:space-between; margin-bottom:11px; }
.arn-palhd .arn-palt{ font:800 12px/1 'Plus Jakarta Sans',sans-serif; color:var(--aink); letter-spacing:.2px; }
.arn-palhd .arn-palgoal{ font:700 11px/1 'Inter',sans-serif; color:var(--acc-lt); }
.arn-rail{ display:flex; align-items:flex-end; gap:6px; }
.arn-badge{ flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; text-align:center; opacity:.42; transition:opacity .3s, transform .3s; }
.arn-badge.done{ opacity:1; } .arn-badge.target{ opacity:1; transform:translateY(-3px); }
.arn-shield{ width:40px; height:44px; position:relative; display:flex; align-items:center; justify-content:center;
  font:800 14px/1 'Plus Jakarta Sans',sans-serif; color:#fff; clip-path:polygon(50% 0,100% 16%,100% 64%,50% 100%,0 64%,0 16%);
  filter:drop-shadow(0 3px 4px rgba(0,0,0,.4)); }
.arn-shield::before{ content:""; position:absolute; top:3px; left:6px; right:6px; height:38%; border-radius:50%; background:linear-gradient(180deg,rgba(255,255,255,.45),transparent); }
.arn-badge.target .arn-shield{ animation:arnPulse 2s ease-in-out infinite; }
@keyframes arnPulse{ 0%,100%{filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))} 50%{filter:drop-shadow(0 3px 10px color-mix(in srgb,var(--acc) 75%,transparent))} }
.arn-badge .bn{ font:700 9.5px/1.1 'Inter',sans-serif; color:var(--asoft); max-width:62px; }
.arn-badge.done .bn{ color:var(--aink); } .arn-badge.target .bn{ color:var(--acc-lt); font-weight:800; }

/* ── Bouton verre (CTA quiz) ── */
.arn-glass{ position:relative; overflow:hidden; width:calc(100% - 28px); margin:14px 14px 0; min-height:52px;
  display:flex; align-items:center; justify-content:center; gap:9px; padding:14px 20px; border-radius:16px; box-sizing:border-box;
  border:1px solid color-mix(in srgb,#fff 26%, var(--acc)); color:#fff; cursor:pointer; -webkit-tap-highlight-color:transparent;
  background:linear-gradient(135deg, color-mix(in srgb,var(--acc) 82%, transparent), color-mix(in srgb,var(--acc-dk) 92%, transparent));
  font:800 15px/1 'Plus Jakarta Sans',sans-serif;
  box-shadow:0 8px 24px -6px color-mix(in srgb,var(--acc-dk) 60%, transparent), inset 0 1px 0 rgba(255,255,255,.4), inset 0 -1px 0 rgba(0,0,0,.12);
  transition:transform .14s; }
.arn-glass:active{ transform:scale(.98); }
.arn-glass-sheen{ position:absolute; top:0; left:-60%; width:45%; height:100%; transform:skewX(-18deg); pointer-events:none;
  background:linear-gradient(100deg, transparent, rgba(255,255,255,.5), transparent); animation:arnSheen 3.6s ease-in-out infinite; }
@keyframes arnSheen{ 0%{left:-60%} 35%{left:130%} 100%{left:130%} }

/* ── Aide « ? » (revoir le tuto) ── */
.arn-help{ flex-shrink:0; width:30px; height:30px; border-radius:50%; border:1px solid rgba(255,255,255,.18);
  background:rgba(255,255,255,.08); color:var(--asoft); font:800 14px/1 'Plus Jakarta Sans',sans-serif; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.arn-help:active{ transform:scale(.95); }

/* ── Hall of Fame (lauréats permis) ── */
.arn-hof-title{ display:flex; align-items:center; gap:8px; margin:24px 18px 4px; font:700 11px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:.1em; color:var(--amute); }
.arn-hof-title::after{ content:''; flex:1; height:1px; background:rgba(255,255,255,.14); }
.arn-hof-row{ display:flex; align-items:center; gap:12px; margin:8px 14px 0; padding:11px 13px; border-radius:14px;
  background:rgba(255,255,255,.05); border:1px solid color-mix(in srgb,var(--acc-lt) 22%, rgba(255,255,255,.08)); }
.arn-hof-row.clickable{ cursor:pointer; } .arn-hof-row.clickable:active{ transform:scale(.985); }
.arn-hof-badge{ flex-shrink:0; display:inline-flex; align-items:center; gap:4px; font:700 11px/1 'Inter',sans-serif; color:#fff;
  background:linear-gradient(180deg,var(--acc-lt),var(--acc)); padding:4px 9px; border-radius:999px; }

/* ── Lien discret (pseudo, retour…) ── */
.arn-link{ display:flex; align-items:center; gap:11px; margin:16px 14px 0; padding:12px 14px; border-radius:14px; text-decoration:none;
  background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.08); color:var(--aink); }
.arn-link:active{ transform:scale(.99); }
.arn-link-body{ flex:1; min-width:0; }
.arn-link-t{ font:700 13px/1.2 'Plus Jakarta Sans',sans-serif; }
.arn-link-s{ font:500 11px/1.3 'Inter',sans-serif; color:var(--amute); margin-top:2px; }

/* ── Vide ── */
.arn-empty{ text-align:center; padding:46px 24px; color:var(--asoft); }
.arn-empty-ico{ opacity:.5; margin-bottom:12px; display:inline-flex; }
.arn-empty-txt{ font:600 13.5px/1.55 'Inter',sans-serif; max-width:300px; margin:0 auto; }

/* ── Entrée en cascade ── */
@keyframes arnRowIn{ from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none} }
.arn-row, .arn-hof-row{ animation:arnRowIn .4s cubic-bezier(.2,.7,.3,1) both; animation-delay:calc(var(--i,0) * 36ms); }
@media (prefers-reduced-motion: reduce){
  .arn-crown, .arn-badge.target .arn-shield, .arn-glass-sheen{ animation:none; }
  .arn-glass-sheen{ opacity:0; }
  .arn-row, .arn-hof-row{ animation:none; }
  .arn{ transition:none; }
}
</style>`;

// ─── Helpers de rendu ────────────────────────────────────────────

const CROWN_SVG = `<svg class="arn-crown" viewBox="0 0 30 22" fill="none" aria-hidden="true">
  <path d="M2 20h26l-2-13-6 5-5-9-5 9-6-5-2 13z" fill="url(#arnCg)" stroke="#e08e0b" stroke-width="1"/>
  <circle cx="4" cy="6" r="2" fill="#ffe08a"/><circle cx="15" cy="2.5" r="2.2" fill="#ffe08a"/><circle cx="26" cy="6" r="2" fill="#ffe08a"/>
  <defs><linearGradient id="arnCg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffe08a"/><stop offset="1" stop-color="#f7b32b"/></linearGradient></defs>
</svg>`;

/**
 * Podium top-3. Ordre visuel 2 · 1 · 3, couronne sur le 1er.
 * @param {Array<{rang:number, display_name:string, avatar?:string, is_me?:boolean}>} top3
 * @param {{ fmtScore:(r)=>string, meLabel?:string, attrsOf?:(r)=>string }} opts
 *   attrsOf → attributs bruts par colonne (role/tabindex/data-…) pour la
 *   rendre cliquable (ex. moniteur : tap → livret de l'élève).
 */
export function arenePodium(
  top3,
  { fmtScore, meLabel = arYou(), attrsOf = null } = {},
) {
  const by = {};
  top3.forEach((r) => (by[r.rang] = r));
  const order = [by[2], by[1], by[3]]; // gauche · centre · droite
  return `<div class="arn-podium-wrap"><div class="arn-podium-glow" aria-hidden="true"></div><div class="arn-podium">${order
    .map((r) => {
      if (!r) return `<div class="arn-pcol" aria-hidden="true"></div>`;
      const isFirst = r.rang === 1;
      const metal = METAL[r.rang];
      const avSize = isFirst ? 74 : 56;
      const av = renderUserAvatar(
        { avatar_url: r.avatar, prenom: r.display_name },
        avSize,
      );
      const nameHtml = r.is_me
        ? `${meLabel} <span class="arn-youtag">${esc(r.display_name)}</span>`
        : esc(r.display_name);
      const extra = attrsOf ? attrsOf(r) : "";
      return `<div class="arn-pcol${extra ? " clickable" : ""}" ${extra}>
        ${isFirst ? CROWN_SVG : ""}
        <div class="arn-pav m-${metal}${r.is_me ? " is-me" : ""}">
          ${av}
          <span class="arn-medal ${metal}" aria-label="${arRank(r.rang)}">${r.rang}</span>
        </div>
        <div class="arn-pname${r.is_me ? " me" : ""}">${nameHtml}</div>
        <div class="arn-pscore${r.is_me ? " me" : ""}">${fmtScore(r)}</div>
        <div class="arn-ped p${r.rang}${isFirst && r.is_me ? " me-ped" : ""}">${r.rang}</div>
      </div>`;
    })
    .join("")}</div></div>`;
}

/**
 * Ligne dense de classement (4e →). `rightHtml` = contenu optionnel avant
 * le score (ex. chip de série côté moniteur). `attrs` = attributs bruts
 * (role/tabindex/data-…) pour rendre la ligne cliquable.
 * @param {{ rang:number, display_name:string, avatar?:string, is_me?:boolean }} r
 */
export function areneRow(
  r,
  { fmtScore, idx = 0, rightHtml = "", attrs = "", clickable = false } = {},
) {
  return `<div class="arn-row${clickable ? " clickable" : ""}" style="--i:${idx}" ${attrs}>
    <span class="arn-rk" aria-label="${arRank(r.rang)}">${r.rang}</span>
    <span class="arn-av">${renderUserAvatar({ avatar_url: r.avatar, prenom: r.display_name }, 38)}</span>
    <span class="arn-nm">${esc(r.display_name)}</span>
    ${rightHtml}
    <span class="arn-sc">${fmtScore(r)}</span>
  </div>`;
}

/**
 * Ligne « Toi » épinglée en bas (élève uniquement).
 * @param {{ rang:number, display_name:string, avatar?:string }} mine
 */
export function areneMeRow(
  mine,
  { fmtScore, palier = "", meLabel = arYou() } = {},
) {
  return `<div class="arn-merow" aria-label="${escAttr(arMyRank(String(mine.rang)))}">
    <span class="arn-rk">#${mine.rang}</span>
    <span class="arn-av">${renderUserAvatar({ avatar_url: mine.avatar, prenom: mine.display_name }, 42)}</span>
    <span class="arn-nm">${meLabel} · ${esc(mine.display_name)}${palier ? `<span class="pal">${esc(palier)}</span>` : ""}</span>
    <span class="arn-sc">${fmtScore(mine)}</span>
  </div>`;
}

/**
 * Rail des paliers (badges écusson). `items` = [{ short, name }].
 * doneCount = nb de paliers atteints ; targetIdx = index 1-based du palier-cible
 * (la « carotte » qui pulse). `colorOf(i, done)` → fond de l'écusson.
 */
export function arenePaliers({
  items,
  doneCount = 0,
  targetIdx = 0,
  title = "Paliers",
  goal = "",
  colorOf,
}) {
  const rail = items
    .map((p, i) => {
      const idx = i + 1;
      const done = idx <= doneCount;
      const target = idx === targetIdx;
      const bg = colorOf
        ? colorOf(i, done)
        : done
          ? "linear-gradient(160deg,var(--acc-lt),var(--acc))"
          : "linear-gradient(160deg,#3a3568,#262249)";
      return `<div class="arn-badge${done ? " done" : ""}${target ? " target" : ""}">
        <span class="arn-shield" style="background:${bg}">${esc(p.short)}</span>
        <span class="bn">${esc(p.name)}</span>
      </div>`;
    })
    .join("");
  return `<div class="arn-paliers">
    <div class="arn-palhd"><span class="arn-palt">${esc(title)}</span>${goal ? `<span class="arn-palgoal">${esc(goal)}</span>` : ""}</div>
    <div class="arn-rail">${rail}</div>
  </div>`;
}
