// ═══════════════════════════════════════════════════════════════
// Enseignant — Parcours Pro (route sinueuse à badges)
// Moteur visuel de la route élève (src/pages/eleve/parcours.js) porté
// au moniteur : path SVG 4 couches, portion parcourue en vert, nodes
// animés, états done/next/todo/locked, badge « PROCHAIN OUTIL », fiche
// palier en bottom-sheet au clic.
//
// Jalons = UNIQUEMENT le nombre de validations cumulées (décision figée).
// Source de données = MONITEUR_TIERS / getMoniteurState (moniteur-levels.js).
// Chaque node = un outil utile débloqué. ZÉRO gemme / monnaie virtuelle.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { getMoniteurState, MONITEUR_TIERS } from "@/data/moniteur-levels.js";
import { animateCounter } from "@/utils/gestures.js";
import { icon } from "@/utils/icons.js";
import { openPalierSheet } from "@/components/common/palier-sheet.js";

// ─── Géométrie de la route (viewBox 396 × 1240) ──────────────────
// x maintenu dans ~[100,290] pour que les étiquettes centrées (≤150px)
// ne débordent pas du cadre à 375–420px (correction n°3 du brief).
const VBW = 396;
const VBH = 1240;
const PTS = [
  { x: 198, y: 80 },
  { x: 290, y: 200 },
  { x: 250, y: 330 },
  { x: 120, y: 450 },
  { x: 100, y: 580 },
  { x: 180, y: 710 },
  { x: 290, y: 830 },
  { x: 280, y: 960 },
  { x: 150, y: 1080 },
  { x: 110, y: 1190 },
];

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.ppr {
  max-width: 480px; margin: 0 auto;
  padding: 0 0 calc(100px + env(safe-area-inset-bottom, 0px));
  background: var(--bg); color: var(--ink);
  font-family: 'Inter', sans-serif;
}

/* ── Segmented « Progression » (Parcours · Trophées · Ligue) ── */
.ppr-tabs { display: flex; gap: 4px; padding: 10px 14px 0; background: var(--su); border-bottom: 1px solid var(--bo); }
.ppr-tab {
  flex: 1; text-align: center; padding: 11px 4px 12px; min-height: 44px;
  font: 800 13px/1 'Plus Jakarta Sans', sans-serif; color: var(--mu2);
  background: none; border: 0; border-bottom: 2.5px solid transparent; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ppr-tab.on { color: var(--ink); border-bottom-color: var(--a); }
.ppr-tab:focus-visible { outline: 3px solid var(--a); outline-offset: -3px; border-radius: 8px; }

/* ── Hero : compteur de validations + palier + prochain outil ── */
.ppr-hero {
  position: relative; overflow: hidden; padding: 18px 18px 20px;
  background:
    linear-gradient(160deg, rgba(11,13,26,.78) 0%, rgba(11,13,26,.58) 50%, rgba(11,13,26,.84) 100%),
    url('/skins/fond-parcours-enseignant.png') center 18% / cover no-repeat,
    linear-gradient(160deg, var(--ink2) 0%, var(--ink3) 60%, var(--ink) 100%);
}
.ppr-hero::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 75% 70% at 14% 25%, color-mix(in srgb, var(--a) 30%, transparent) 0%, transparent 55%),
    radial-gradient(ellipse 50% 55% at 88% 80%, color-mix(in srgb, var(--am) 14%, transparent) 0%, transparent 55%);
}
.ppr-hero-in { position: relative; z-index: 1; }
.ppr-hero-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
.ppr-hero-title { font: 800 20px/1.1 'Plus Jakarta Sans', sans-serif; color: #fff; letter-spacing: -.03em; }
.ppr-hero-sub { font: 600 12px/1.3 'Inter', sans-serif; color: rgba(255,255,255,.62); margin-top: 5px; }
.ppr-hero-count { text-align: right; flex-shrink: 0; }
.ppr-hero-count .v { font: 800 30px/1 'Plus Jakarta Sans', sans-serif; color: #fff; }
.ppr-hero-count .l { font: 600 10px/1 'Inter', sans-serif; color: rgba(255,255,255,.55); text-transform: uppercase; letter-spacing: .1em; margin-top: 4px; }
.ppr-next { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); border-radius: 14px; padding: 12px 13px; }
.ppr-next-lbl { font: 800 9.5px/1 'Inter', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: var(--a); margin-bottom: 7px; display: flex; align-items: center; gap: 6px; }
.ppr-next-tool { font: 800 13.5px/1.3 'Plus Jakarta Sans', sans-serif; color: #fff; margin-bottom: 9px; }
.ppr-next-bar { height: 7px; background: rgba(255,255,255,.16); border-radius: 99px; overflow: hidden; }
.ppr-next-fill { height: 100%; width: 0; border-radius: 99px; background: linear-gradient(90deg, var(--a), var(--a-lt)); box-shadow: 0 0 8px color-mix(in srgb, var(--a) 60%, transparent); transition: width 1s cubic-bezier(.2,.7,.3,1); }
.ppr-next-meta { font: 600 10.5px/1 'Inter', sans-serif; color: rgba(255,255,255,.66); margin-top: 7px; }
.ppr-next.done { display: flex; align-items: center; gap: 10px; }
.ppr-next.done .ppr-next-tool { margin: 0; }

/* ── Légende ── */
.ppr-legend { display: flex; gap: 14px; flex-wrap: wrap; padding: 10px 18px 2px; font: 600 10.5px/1.4 'Inter', sans-serif; color: var(--mu3); }
.ppr-legend span { display: inline-flex; align-items: center; gap: 5px; }
.ppr-legend i { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

/* ── Route ── */
.ppr-route {
  position: relative; margin: 10px 10px 0; padding: 18px 8px 30px;
  border-radius: 20px; overflow: hidden;
  background:
    linear-gradient(to bottom, rgba(11,13,26,.58) 0%, rgba(11,13,26,.74) 60%, rgba(11,13,26,.86) 100%),
    url('/skins/fond-parcours-enseignant.png') center top / cover no-repeat;
  box-shadow: var(--s1);
}
.ppr-route svg.path { display: block; width: 100%; height: auto; overflow: visible; }
.p-shadow { stroke: rgba(11,13,26,.10); stroke-width: 30; fill: none; stroke-linecap: round; }
.p-edge { stroke: var(--bo4); stroke-width: 27; fill: none; stroke-linecap: round; }
.p-surface { stroke: var(--mu2); stroke-width: 20; fill: none; stroke-linecap: round; }
.p-dash { stroke: #fff; stroke-width: 2.5; stroke-dasharray: 6 12; stroke-linecap: round; fill: none; opacity: .85; }
.p-done { stroke: var(--a); stroke-width: 20; fill: none; stroke-linecap: round; }
.p-done-dash { stroke: #fff; stroke-width: 2.5; stroke-dasharray: 6 12; stroke-linecap: round; fill: none; opacity: .9; }

.ppr-nodes { position: absolute; inset: 0; }
.ppr-node {
  position: absolute; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center;
  border: 0; background: none; font-family: inherit; padding: 0; cursor: pointer;
  opacity: 0; animation: ndPop .5s cubic-bezier(.34,1.56,.64,1) both;
  -webkit-tap-highlight-color: transparent;
}
@keyframes ndPop {
  0% { opacity: 0; transform: translate(-50%,-50%) scale(.3); }
  65% { opacity: 1; transform: translate(-50%,-50%) scale(1.08); }
  100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
}
.ppr-node:focus-visible { outline: none; }
.ppr-node:focus-visible .nd-circle { outline: 3px solid var(--a); outline-offset: 4px; }
.nd-circle {
  width: 62px; height: 62px; border-radius: 50%; border: 4px solid #fff;
  display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0;
  box-shadow: 0 5px 14px rgba(11,13,26,.12); transition: transform .15s;
}
@media (max-width: 380px) { .nd-circle { width: 54px; height: 54px; border-width: 3px; } }
.ppr-node:active .nd-circle { transform: scale(.94); }
.nd-circle svg { width: 28px; height: 28px; }

/* done */
.ppr-node.done .nd-circle { background: var(--a); color: #fff; box-shadow: 0 5px 14px color-mix(in srgb, var(--a) 40%, transparent); }
.nd-check { position: absolute; bottom: -3px; right: -3px; width: 24px; height: 24px; border-radius: 50%; background: var(--gr); border: 3px solid var(--su); color: #fff; display: flex; align-items: center; justify-content: center; }
.nd-check svg { width: 12px; height: 12px; }

/* next */
.ppr-node.next .nd-circle { background: var(--a); color: #fff; box-shadow: 0 6px 20px color-mix(in srgb, var(--a) 50%, transparent); animation: ndHalo 2s ease-in-out infinite; }
@keyframes ndHalo {
  0%,100% { box-shadow: 0 6px 20px color-mix(in srgb, var(--a) 45%, transparent); }
  50% { box-shadow: 0 6px 26px color-mix(in srgb, var(--a) 75%, transparent), 0 0 0 6px color-mix(in srgb, var(--a) 18%, transparent); }
}
.ppr-node.next .nd-circle::after { content: ''; position: absolute; inset: -14px; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--a) 30%, transparent); animation: ndRing 1.9s ease-out infinite; }
@keyframes ndRing { 0% { transform: scale(.85); opacity: .7; } 100% { transform: scale(1.4); opacity: 0; } }

/* todo / locked */
.ppr-node.todo .nd-circle { background: var(--su); border-color: var(--bo); border-style: dashed; color: var(--mu2); box-shadow: 0 2px 8px rgba(11,13,26,.06); }
.ppr-node.locked .nd-circle { background: var(--bg2); border-color: var(--bg3); color: var(--mu5); box-shadow: none; }

/* labels */
.nd-lbl { margin-top: 11px; background: var(--su); border: 1px solid var(--bo); border-radius: 13px; padding: 6px 11px 7px; width: max-content; max-width: 150px; text-align: center; box-shadow: 0 5px 14px rgba(11,13,26,.09); }
@media (max-width: 380px) { .nd-lbl { max-width: 132px; } }
.nd-name { display: block; font: 800 12px/1.25 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.01em; }
.nd-thr { display: block; font: 700 9.5px/1 'IBM Plex Mono', monospace; color: var(--mu3); margin-top: 3px; }
.ppr-node.todo .nd-name, .ppr-node.locked .nd-name { color: var(--mu3); }
.ppr-node.done .nd-lbl { border-color: color-mix(in srgb, var(--a) 28%, transparent); }
.ppr-node.next .nd-lbl { border-color: color-mix(in srgb, var(--a) 40%, transparent); box-shadow: 0 8px 22px color-mix(in srgb, var(--a) 18%, transparent), 0 0 0 2px color-mix(in srgb, var(--a) 20%, transparent); position: relative; }
.nd-stt { display: inline-block; margin-top: 7px; padding: 6px 13px; background: var(--a); color: #fff; font: 800 11px/1 'Inter', sans-serif; border-radius: 99px; box-shadow: 0 3px 0 var(--adk); }
.ppr-node.next .nd-lbl::before {
  content: 'PROCHAIN OUTIL'; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: var(--a); color: #fff; font: 800 8px/1 'Inter', sans-serif; padding: 4px 10px; border-radius: 99px;
  letter-spacing: .14em; white-space: nowrap; box-shadow: 0 3px 10px color-mix(in srgb, var(--a) 40%, transparent);
  animation: ndBob 1.6s ease-in-out infinite;
}
@keyframes ndBob { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-3px); } }

/* ── Final ── */
.ppr-final { margin: 8px 14px 0; padding: 22px 18px; background: var(--su); border: 1.5px solid var(--bo); border-radius: 20px; text-align: center; box-shadow: var(--s1); position: relative; overflow: hidden; }
.ppr-final::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 30% 20%, rgba(167,139,250,.10), transparent 55%), radial-gradient(ellipse at 80% 90%, color-mix(in srgb, var(--a) 7%, transparent), transparent 55%); }
.ppr-final .crown { width: 48px; height: 48px; border-radius: 14px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: #fff; position: relative; background: linear-gradient(145deg,#5b21b6,#c4b5fd); box-shadow: 0 6px 18px -4px rgba(167,139,250,.6); }
.ppr-final h3 { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; margin: 0 0 5px; color: var(--ink); position: relative; }
.ppr-final p { font: 500 12.5px/1.45 'Inter', sans-serif; color: var(--mu3); margin: 0; position: relative; }

/* ── Skeleton ── */
.ppr-skel { background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%); background-size: 200% 100%; animation: pprShim 1.4s ease-in-out infinite; }
@keyframes pprShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .ppr-node, .ppr-node.next .nd-circle, .ppr-node.next .nd-circle::after, .ppr-node.next .nd-lbl::before,
  .ppr-next-fill, .ppr-skel { animation: none !important; transition: none !important; opacity: 1 !important; }
}
</style>`;

// ─── State ───────────────────────────────────────────────────────
let _root = null;

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  const me = getCurUser();
  if (!me || me.role !== "enseignant") {
    root.innerHTML = `<p style="padding:32px;text-align:center;color:var(--mu)">Accès enseignant requis</p>`;
    return;
  }

  track("page.view", { page: "parcours_pro" });

  root.innerHTML = `${STYLE}
    <div class="ppr">
      ${_tabsHtml()}
      <div class="ppr-skel" style="height:200px"></div>
      <div class="ppr-skel" style="height:480px;margin-top:10px"></div>
    </div>`;
  _wireTabs(root);

  // Source de vérité = compte réel de validations (validated_by).
  const { count, error } = await sb
    .from("validations")
    .select("id", { count: "exact", head: true })
    .eq("validated_by", me.id);

  if (error) {
    root.innerHTML = `${STYLE}<div class="ppr">${_tabsHtml()}
      <div style="padding:48px 24px;text-align:center;color:var(--mu3)">
        <div style="margin-bottom:12px">${icon("alert-circle", { size: 30 })}</div>
        <p style="font:600 15px/1.4 'Inter',sans-serif">Ton parcours n'a pas pu se charger.</p>
        <button id="ppr-retry" style="margin-top:14px;padding:12px 24px;min-height:44px;border:0;background:var(--a);color:#fff;border-radius:12px;cursor:pointer;font:800 14px/1 'Plus Jakarta Sans',sans-serif">Réessayer</button>
      </div></div>`;
    _wireTabs(root);
    root
      .querySelector("#ppr-retry")
      ?.addEventListener("click", () => mount(root));
    return;
  }

  const totalVals = count ?? 0;
  _render(root, totalVals, getMoniteurState(totalVals));
}

// ─── Render ──────────────────────────────────────────────────────
function _render(root, totalVals, state) {
  const tiers = MONITEUR_TIERS;
  const palierNum = state.tier?.tier ?? 0;
  const title = state.tier?.title ?? "Premiers pas";

  // États par node
  const nextIdx = tiers.findIndex((t) => totalVals < t.threshold);
  const items = tiers.map((t, i) => {
    let st;
    if (totalVals >= t.threshold) st = "done";
    else if (i === nextIdx) st = "next";
    else if (nextIdx !== -1 && i <= nextIdx + 2) st = "todo";
    else st = "locked";
    return { tier: t, state: st };
  });

  const doneCount = items.filter((it) => it.state === "done").length;

  root.innerHTML = `${STYLE}
    <div class="ppr">
      ${_tabsHtml()}

      <div class="ppr-hero">
        <div class="ppr-hero-in">
          <div class="ppr-hero-top">
            <div>
              <div class="ppr-hero-title">Mon parcours pro</div>
              <div class="ppr-hero-sub">${esc(title)} · palier ${palierNum}/${tiers.length}</div>
            </div>
            <div class="ppr-hero-count">
              <div class="v" data-counter="${totalVals}">0</div>
              <div class="l">validations</div>
            </div>
          </div>
          ${_nextHtml(state)}
        </div>
      </div>

      <div class="ppr-legend">
        <span><i style="background:var(--a)"></i>Atteint</span>
        <span><i style="background:var(--a);box-shadow:0 0 0 3px color-mix(in srgb,var(--a) 25%,transparent)"></i>Prochain</span>
        <span><i style="background:var(--su);border:1.5px dashed var(--bo4)"></i>À venir</span>
        <span><i style="background:var(--bg2);border:1px solid var(--bo)"></i>Verrouillé</span>
      </div>

      <div class="ppr-route">
        <svg class="path" viewBox="0 0 ${VBW} ${VBH}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" id="ppr-svg"></svg>
        <div class="ppr-nodes" id="ppr-nodes"></div>
      </div>

      <div class="ppr-final">
        <div class="crown">${icon("crown", { size: 26, strokeWidth: 2 })}</div>
        <h3>${esc(tiers[tiers.length - 1].title)}</h3>
        <p>${tiers[tiers.length - 1].threshold} validations — le palier ultime. Chaque séance t'en rapproche.</p>
      </div>
    </div>`;

  _wireTabs(root);
  _renderPath(root, doneCount);
  _renderNodes(root, items, totalVals);

  // Animations différées
  requestAnimationFrame(() => {
    const fill = root.querySelector("#ppr-next-fill");
    if (fill)
      fill.style.width = `${Math.min(100, state.pctToNextReward ?? 0)}%`;
  });
  setTimeout(() => {
    const el = root.querySelector("[data-counter]");
    if (el) animateCounter(el, 0, parseInt(el.dataset.counter, 10) || 0, 800);
  }, 100);
}

// ─── Hero : bloc prochain outil ──────────────────────────────────
function _nextHtml(state) {
  if (!state.nextReward) {
    return `<div class="ppr-next done">
      <span style="color:var(--a)">${icon("check-circle", { size: 22, strokeWidth: 2 })}</span>
      <div class="ppr-next-tool">Palier maximum atteint — Expert REMC certifié.</div>
    </div>`;
  }
  const t = state.nextReward.data;
  const missing = state.nextReward.missing ?? 0;
  return `<div class="ppr-next">
    <div class="ppr-next-lbl">${icon("trending-up", { size: 12, strokeWidth: 2 })} Prochain palier</div>
    <div class="ppr-next-tool">${esc(t.title)} · ${t.threshold} validations</div>
    <div class="ppr-next-bar"><div class="ppr-next-fill" id="ppr-next-fill"></div></div>
    <div class="ppr-next-meta">Plus que ${missing} validation${missing > 1 ? "s" : ""}</div>
  </div>`;
}

// ─── SVG path (Catmull-Rom → Bézier) ─────────────────────────────
function _smooth(pts) {
  if (pts.length < 2) return pts.length ? `M ${pts[0].x} ${pts[0].y}` : "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6,
      c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6,
      c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function _renderPath(root, doneCount) {
  const full = _smooth(PTS);
  // Portion parcourue : jusqu'au node « next » inclus (doneCount + 1 points)
  const donePath = _smooth(PTS.slice(0, Math.min(PTS.length, doneCount + 1)));
  const svg = root.querySelector("#ppr-svg");
  if (svg) {
    svg.innerHTML = `
      <path class="p-shadow" d="${full}" transform="translate(0,4)"/>
      <path class="p-edge" d="${full}"/>
      <path class="p-surface" d="${full}"/>
      <path class="p-dash" d="${full}"/>
      <path class="p-done" d="${donePath}"/>
      <path class="p-done-dash" d="${donePath}"/>`;
  }
}

// ─── Nodes ───────────────────────────────────────────────────────
function _renderNodes(root, items, totalVals) {
  const nodesEl = root.querySelector("#ppr-nodes");
  if (!nodesEl) return;

  nodesEl.innerHTML = items
    .map((it, i) => {
      const p = PTS[i];
      const left = ((p.x / VBW) * 100).toFixed(2);
      const top = ((p.y / VBH) * 100).toFixed(2);
      const inner =
        it.state === "locked"
          ? icon("lock", { size: 26, strokeWidth: 2 })
          : icon("award", { size: 28, strokeWidth: 2 });
      const check =
        it.state === "done"
          ? `<div class="nd-check">${icon("check", { size: 12, strokeWidth: 3 })}</div>`
          : "";
      const cta =
        it.state === "next"
          ? `<span class="nd-stt">Voir le palier →</span>`
          : "";
      return `<button class="ppr-node ${it.state}" style="left:${left}%;top:${top}%;animation-delay:${i * 70}ms" data-i="${i}" aria-label="Palier ${i + 1} sur ${items.length} : ${esc(it.tier.title)} — ${it.state === "done" ? "atteint" : it.state === "next" ? "prochain palier" : "à atteindre à " + it.tier.threshold + " validations"}">
        <div class="nd-circle">${inner}${check}</div>
        <div class="nd-lbl">
          <span class="nd-name">${it.tier.threshold} validations</span>
          <span class="nd-thr">${esc(it.tier.title)}</span>
          ${cta}
        </div>
      </button>`;
    })
    .join("");

  nodesEl.querySelectorAll(".ppr-node").forEach((el) => {
    el.addEventListener("click", () => {
      const i = parseInt(el.dataset.i, 10);
      const it = items[i];
      if (!it) return;
      track("parcours_pro.tier_detail", { tier: it.tier.tier });
      openPalierSheet(it.tier, totalVals);
    });
  });
}

// ─── Onglet Progression (Parcours · Trophées · Ligue) ────────────
function _tabsHtml() {
  return `
  <div class="ppr-tabs" role="tablist" aria-label="Progression">
    <button class="ppr-tab on" role="tab" aria-selected="true">Parcours</button>
    <button class="ppr-tab" role="tab" aria-selected="false" data-go="#/trophees-moniteur">Trophées</button>
    <button class="ppr-tab" role="tab" aria-selected="false" data-go="#/ligue-semaine">Ligue</button>
  </div>`;
}

function _wireTabs(root) {
  root.querySelectorAll(".ppr-tab[data-go]").forEach((el) => {
    el.addEventListener("click", () => navigate(el.dataset.go));
  });
}
