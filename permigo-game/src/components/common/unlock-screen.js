// ═══════════════════════════════════════════════════════════════
// Unlock Screen — moteur générique d'écran plein écran de célébration.
//
// ADN : Nike (typo kinétique, speed-lines) × Call of Duty (rank-up
// cinématique, emblème scale + sweep) × Strava (bloc stats, compteur
// qui s'incrémente, barre de progression).
//
// Primitive partagée — NE PAS appeler directement depuis une page.
// Utilise un wrapper de rôle :
//   - élève   : @/components/eleve/competence-unlock.js → showCompetenceUnlock()
// (le wrapper moniteur tier-unlock.js est supprimé depuis le retrait de sa
//  gamification, 30/07/2026 — il n'y a plus de palier à débloquer.)
//
// showUnlockScreen(config) retourne une Promise résolue à la fermeture
// ('cta' | 'close').
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { playReward } from "@/utils/sound.js";

const STYLE_ID = "unlock-screen-style";

const STYLE = `
.cu-overlay {
  position: fixed; inset: 0;
  z-index: 10050;
  --cu-accent: var(--gr);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: max(32px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom));
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(120% 80% at 50% 16%, color-mix(in srgb, var(--cu-accent) 34%, transparent) 0%, transparent 55%),
    radial-gradient(140% 120% at 50% 120%, color-mix(in srgb, var(--cu-accent) 18%, transparent) 0%, transparent 50%),
    linear-gradient(180deg, #05060b 0%, #0a0c16 55%, #05060b 100%);
  box-shadow: inset 0 0 200px 56px rgba(0,0,0,.72);
  opacity: 0;
  transition: opacity .35s cubic-bezier(0.23, 1, 0.32, 1);
}
/* Grain cinématique premium */
.cu-overlay::after {
  content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: .06; mix-blend-mode: overlay;
}
.cu-overlay.cu-show { opacity: 1; }
.cu-overlay.cu-closing { opacity: 0; }

/* ── Speed-lines diagonales (Nike) ── */
.cu-lines { position: absolute; inset: -20% -40%; pointer-events: none; opacity: 0; transition: opacity .6s ease .15s; }
.cu-overlay.cu-show .cu-lines { opacity: .5; }
.cu-lines span {
  position: absolute; top: 0; bottom: 0; width: 2px;
  background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--cu-accent) 55%, transparent), transparent);
  transform: rotate(18deg);
  animation: cuSweep var(--cu-sd, 3.2s) linear infinite;
  animation-delay: var(--cu-sdl, 0s);
}
@keyframes cuSweep {
  0%   { transform: translateX(-30vw) rotate(18deg); opacity: 0; }
  12%  { opacity: 1; }
  88%  { opacity: 1; }
  100% { transform: translateX(60vw) rotate(18deg); opacity: 0; }
}

/* ── Sweep lumineux horizontal (COD rank-up) ── */
.cu-sweep {
  position: absolute; left: -60%; right: -60%; height: 38vh; top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--cu-accent) 28%, transparent) 50%, transparent 100%);
  filter: blur(40px);
  pointer-events: none; opacity: 0;
}
.cu-overlay.cu-show .cu-sweep { animation: cuBigSweep 1.1s cubic-bezier(0.22, 1, 0.36, 1) .15s both; }
@keyframes cuBigSweep {
  0%   { transform: translate(-60%, -50%); opacity: 0; }
  35%  { opacity: 1; }
  100% { transform: translate(60%, -50%); opacity: 0; }
}

.cu-stage {
  position: relative; z-index: 3;
  width: 100%; max-width: 440px;
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
}

/* ── Eyebrow ── */
.cu-kicker {
  display: inline-flex; align-items: center; gap: 8px;
  font: 800 12px/1 var(--fd, system-ui), sans-serif;
  letter-spacing: .28em; text-transform: uppercase;
  color: color-mix(in srgb, var(--cu-accent) 65%, #fff);
  padding: 7px 14px; border-radius: 999px;
  background: color-mix(in srgb, var(--cu-accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--cu-accent) 35%, transparent);
  opacity: 0; transform: translateY(-8px);
  transition: opacity .4s ease .1s, transform .5s cubic-bezier(0.23,1,0.32,1) .1s;
}
.cu-kicker .cu-tick {
  width: 14px; height: 14px; display: inline-flex;
  align-items: center; justify-content: center;
  color: color-mix(in srgb, var(--cu-accent) 80%, #fff);
}
.cu-overlay.cu-show .cu-kicker { opacity: 1; transform: translateY(0); }

/* ── Emblème central (COD) ── */
.cu-emblem {
  position: relative; width: 142px; height: 142px;
  margin: 28px 0 6px;
  display: grid; place-items: center;
  opacity: 0; transform: scale(.4);
  transition: opacity .4s ease, transform .7s cubic-bezier(0.34, 1.7, 0.5, 1);
  transition-delay: .18s;
}
.cu-overlay.cu-show .cu-emblem { opacity: 1; transform: scale(1); }
/* Halo diffus qui respire derrière l'emblème */
.cu-emblem::before {
  content: ''; position: absolute; inset: -22%; border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--cu-accent) 45%, transparent) 0%, transparent 68%);
  filter: blur(8px); opacity: .9;
  animation: cuHalo 3.2s ease-in-out infinite;
}
@keyframes cuHalo { 0%,100% { transform: scale(.92); opacity: .55; } 50% { transform: scale(1.08); opacity: .95; } }
.cu-ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg,
    color-mix(in srgb, var(--cu-accent) 95%, #fff),
    color-mix(in srgb, var(--cu-accent) 30%, transparent),
    color-mix(in srgb, var(--cu-accent) 95%, #fff),
    color-mix(in srgb, var(--cu-accent) 30%, transparent),
    color-mix(in srgb, var(--cu-accent) 95%, #fff));
  -webkit-mask: radial-gradient(closest-side, transparent 72%, #000 74%);
          mask: radial-gradient(closest-side, transparent 72%, #000 74%);
  animation: cuSpin 5.5s linear infinite;
  filter: drop-shadow(0 0 20px color-mix(in srgb, var(--cu-accent) 65%, transparent));
}
/* Anneau intérieur fin, contre-rotation (matière premium) */
.cu-ring2 {
  position: absolute; inset: 13px; border-radius: 50%;
  background: conic-gradient(from 180deg,
    transparent, color-mix(in srgb, var(--cu-accent) 60%, #fff), transparent, color-mix(in srgb, var(--cu-accent) 60%, #fff), transparent);
  -webkit-mask: radial-gradient(closest-side, transparent 80%, #000 82%);
          mask: radial-gradient(closest-side, transparent 80%, #000 82%);
  animation: cuSpin 8s linear infinite reverse;
  opacity: .7;
}
@keyframes cuSpin { to { transform: rotate(360deg); } }
.cu-core {
  position: relative; width: 102px; height: 102px; border-radius: 50%;
  display: grid; place-items: center;
  font-size: 50px; line-height: 1;
  background:
    radial-gradient(circle at 34% 26%, color-mix(in srgb, var(--cu-accent) 46%, #13151f) 0%, #0b0d16 72%);
  border: 1px solid color-mix(in srgb, var(--cu-accent) 50%, transparent);
  box-shadow:
    inset 0 2px 14px rgba(0,0,0,.65),
    inset 0 0 0 1px color-mix(in srgb, var(--cu-accent) 18%, transparent),
    0 0 36px color-mix(in srgb, var(--cu-accent) 40%, transparent);
}
/* Reflet métallique en haut du cœur */
.cu-core::before {
  content: ''; position: absolute; inset: 6px 6px 50% 6px; border-radius: 50% 50% 40% 40%;
  background: linear-gradient(180deg, rgba(255,255,255,.28), transparent 80%);
  pointer-events: none;
}
.cu-core > * { position: relative; filter: drop-shadow(0 2px 6px rgba(0,0,0,.5)); }
.cu-core svg { width: 46px; height: 46px; color: #fff; }
/* étincelles qui jaillissent de l'emblème */
.cu-spark {
  position: absolute; top: 50%; left: 50%; width: 6px; height: 6px;
  border-radius: 50%; background: color-mix(in srgb, var(--cu-accent) 70%, #fff);
  opacity: 0; pointer-events: none;
}
.cu-overlay.cu-show .cu-spark {
  animation: cuSpark .9s cubic-bezier(0.2, 0.8, 0.3, 1) .3s forwards;
  animation-delay: calc(.3s + var(--cu-spd, 0s));
}
@keyframes cuSpark {
  0%   { transform: translate(-50%, -50%) rotate(var(--cu-spa, 0deg)) translateX(0) scale(.4); opacity: 0; }
  18%  { opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(var(--cu-spa, 0deg)) translateX(var(--cu-spr, 90px)) scale(0); opacity: 0; }
}

/* ── Séparateur COD (filet + losange) au-dessus du titre ── */
.cu-rule {
  display: flex; align-items: center; gap: 10px;
  width: 70%; max-width: 240px; margin: 22px 0 2px;
  opacity: 0; transform: translateY(10px) scaleX(.7);
  transition: opacity .45s ease .3s, transform .55s cubic-bezier(0.23,1,0.32,1) .3s;
}
.cu-overlay.cu-show .cu-rule { opacity: 1; transform: translateY(0) scaleX(1); }
.cu-rule::before, .cu-rule::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--cu-accent) 70%, transparent));
}
.cu-rule::after { transform: scaleX(-1); }
.cu-rule i {
  width: 7px; height: 7px; flex: none; transform: rotate(45deg);
  background: var(--cu-accent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--cu-accent) 80%, transparent);
}

/* ── Titre principal ── */
.cu-name {
  font: 900 clamp(25px, 8vw, 38px)/1.02 var(--fd, system-ui), sans-serif;
  font-style: italic;
  letter-spacing: -.02em; text-transform: uppercase;
  margin: 8px 0 0; max-width: 14ch;
  text-wrap: balance; hyphens: none; word-break: keep-all;
  background: linear-gradient(176deg, #fff 0%, #fff 45%, color-mix(in srgb, var(--cu-accent) 32%, #fff) 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 1px 0 rgba(0,0,0,.04);
  opacity: 0; transform: translateY(16px);
  transition: opacity .5s ease .34s, transform .6s cubic-bezier(0.23,1,0.32,1) .34s;
}
.cu-overlay.cu-show .cu-name { opacity: 1; transform: translateY(0); }

.cu-cat {
  font: 700 13px/1.4 var(--fd, system-ui), sans-serif;
  letter-spacing: .14em; text-transform: uppercase;
  color: rgba(255,255,255,.55);
  margin-top: 12px; max-width: 26ch; text-wrap: balance;
  opacity: 0; transform: translateY(8px);
  transition: opacity .4s ease .44s, transform .5s ease .44s;
}
.cu-overlay.cu-show .cu-cat { opacity: 1; transform: translateY(0); }

/* ── Bloc stats (Strava) — panneau glass ── */
.cu-stats {
  position: relative;
  display: flex; align-items: stretch; justify-content: center;
  gap: 0; margin: 26px 0 4px; width: 100%;
  padding: 16px 4px;
  background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
  border: 1px solid rgba(255,255,255,.1); border-radius: 18px;
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
  opacity: 0; transform: translateY(12px);
  transition: opacity .45s ease .52s, transform .55s cubic-bezier(0.23,1,0.32,1) .52s;
}
/* liseré accent en haut du panneau */
.cu-stats::before {
  content: ''; position: absolute; top: -1px; left: 28%; right: 28%; height: 2px; border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--cu-accent), transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--cu-accent) 70%, transparent);
}
.cu-overlay.cu-show .cu-stats { opacity: 1; transform: translateY(0); }
.cu-stat { flex: 1; padding: 0 6px; min-width: 0; }
.cu-stat + .cu-stat { border-left: 1px solid rgba(255,255,255,.12); }
.cu-stat-v {
  font: 800 24px/1 'IBM Plex Mono', ui-monospace, 'SF Mono', monospace;
  color: #fff; letter-spacing: -.01em;
  display: block;
}
.cu-stat-v.sm { font-size: 17px; }
.cu-stat-v small { font-size: 13px; opacity: .55; font-weight: 700; }
.cu-stat-l {
  font: 700 9.5px/1.2 var(--fd, system-ui), sans-serif;
  letter-spacing: .12em; text-transform: uppercase;
  color: rgba(255,255,255,.5); margin-top: 7px; display: block;
}

/* ── Barre de progression globale ── */
.cu-prog { width: 100%; margin: 22px 0 0;
  opacity: 0; transition: opacity .45s ease .62s; }
.cu-overlay.cu-show .cu-prog { opacity: 1; }
.cu-prog-track {
  height: 8px; border-radius: 99px; overflow: hidden;
  background: rgba(255,255,255,.1);
}
.cu-prog-fill {
  height: 100%; width: 0%; border-radius: 99px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--cu-accent) 60%, #000), var(--cu-accent));
  box-shadow: 0 0 12px color-mix(in srgb, var(--cu-accent) 70%, transparent);
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1) .7s;
}
.cu-prog-lbl {
  display: flex; justify-content: space-between;
  font: 700 10px/1 var(--fd, system-ui), sans-serif;
  letter-spacing: .08em; text-transform: uppercase;
  color: rgba(255,255,255,.45); margin-top: 9px;
}

/* ── CTA ── */
.cu-cta {
  position: relative; overflow: hidden;
  margin-top: 32px; width: 100%; max-width: 360px;
  min-height: 56px; padding: 18px 28px;
  border: 0; border-radius: 16px; cursor: pointer;
  font: 800 15px/1 var(--fd, system-ui), sans-serif;
  letter-spacing: .05em; text-transform: uppercase;
  color: #06070d;
  background: linear-gradient(135deg, color-mix(in srgb, var(--cu-accent) 72%, #fff) 0%, var(--cu-accent) 55%, color-mix(in srgb, var(--cu-accent) 80%, #000) 100%);
  box-shadow:
    0 14px 34px color-mix(in srgb, var(--cu-accent) 42%, transparent),
    0 2px 0 color-mix(in srgb, var(--cu-accent) 85%, #000),
    inset 0 2px 0 rgba(255,255,255,.5), inset 0 -3px 0 rgba(0,0,0,.2);
  opacity: 0; transform: translateY(10px);
  transition: opacity .45s ease .72s, transform .55s cubic-bezier(0.23,1,0.32,1) .72s, box-shadow .15s ease, scale .12s ease;
}
/* sheen qui balaie le bouton */
.cu-cta::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: -60%; width: 40%;
  background: linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent);
  transform: skewX(-18deg);
}
.cu-overlay.cu-show .cu-cta::after { animation: cuSheen 2.6s ease-in-out 1.4s infinite; }
@keyframes cuSheen { 0% { left: -60%; } 30%,100% { left: 130%; } }
.cu-overlay.cu-show .cu-cta { opacity: 1; transform: translateY(0); }
.cu-cta:active { scale: .97; }

.cu-close {
  position: absolute; top: max(18px, env(safe-area-inset-top)); right: 18px;
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(255,255,255,.1); color: #fff; border: 0; cursor: pointer;
  font-size: 20px; line-height: 1; display: grid; place-items: center;
  z-index: 5; opacity: 0; transition: opacity .3s ease .8s, background .15s;
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
}
.cu-overlay.cu-show .cu-close { opacity: 1; }
.cu-close:hover { background: rgba(255,255,255,.2); }

@media (prefers-reduced-motion: reduce) {
  .cu-overlay, .cu-kicker, .cu-emblem, .cu-rule, .cu-name, .cu-cat, .cu-stats, .cu-prog, .cu-cta, .cu-close, .cu-prog-fill {
    transition: opacity .2s ease !important; transform: none !important;
  }
  .cu-ring, .cu-ring2, .cu-lines span, .cu-spark, .cu-sweep, .cu-emblem::before, .cu-cta::after { animation: none !important; }
  .cu-lines { opacity: .25 !important; }
}
`;

function ensureStyle() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID))
    return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = STYLE;
  document.head.appendChild(tag);
}

function speedLines(n = 7) {
  let html = "";
  for (let i = 0; i < n; i++) {
    const left = (i / n) * 100 + (Math.random() * 6 - 3);
    const dur = 2.6 + Math.random() * 1.8;
    const delay = Math.random() * dur;
    html += `<span style="left:${left}%;--cu-sd:${dur}s;--cu-sdl:-${delay}s"></span>`;
  }
  return html;
}

function sparks(n = 12) {
  let html = "";
  for (let i = 0; i < n; i++) {
    const ang = (360 / n) * i + (Math.random() * 18 - 9);
    const r = 78 + Math.random() * 44;
    const delay = Math.random() * 0.18;
    html += `<span class="cu-spark" style="--cu-spa:${ang}deg;--cu-spr:${r}px;--cu-spd:${delay}s"></span>`;
  }
  return html;
}

function countUp(el, to, durationMs = 900) {
  if (typeof to !== "number" || to <= 1) {
    el.textContent = String(to ?? "");
    return;
  }
  const from = Math.max(0, to - 1);
  const start = performance.now();
  const reduce = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  if (reduce) {
    el.textContent = String(to);
    return;
  }
  function step(now) {
    const p = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderStat(s) {
  const suffix = s.suffix ? `<small>${esc(String(s.suffix))}</small>` : "";
  const cls = `cu-stat-v${s.small ? " sm" : ""}`;
  const inner =
    typeof s.countTo === "number"
      ? `<span class="cu-num" data-countup="${esc(String(s.countTo))}">0</span>${suffix}`
      : `${esc(String(s.value ?? ""))}${suffix}`;
  return `<div class="cu-stat"><span class="${cls}">${inner}</span><span class="cu-stat-l">${esc(String(s.label ?? ""))}</span></div>`;
}

/**
 * Affiche un écran plein écran de célébration générique.
 *
 * @param {Object}  config
 * @param {string}  [config.accent='var(--gr)']  couleur d'accent CSS
 * @param {string}  [config.emblem]              emoji affiché dans le cœur
 * @param {string}  [config.emblemHtml]          HTML brut (ex: SVG icon) — TRUSTED, prioritaire sur emblem
 * @param {string}  [config.kicker='Compétence acquise']
 * @param {string}  [config.kickerIcon='✓']
 * @param {string}  config.title
 * @param {string}  [config.subtitle]            ligne sous le titre (uppercase tracking)
 * @param {Array}   [config.stats]               [{ value|countTo, suffix, label, small }]
 * @param {Object}  [config.progress]            { pct, leftLabel, rightLabel }
 * @param {string}  [config.ctaLabel='Continuer']
 * @param {string}  [config.ariaLabel]
 * @param {Function}[config.onCta]
 * @param {Function}[config.onClose]
 * @returns {Promise<'cta'|'close'>}
 */
export function showUnlockScreen(config = {}) {
  ensureStyle();

  const {
    accent = "var(--gr)",
    emblem = "🎯",
    emblemHtml = null,
    kicker = "Compétence acquise",
    kickerIcon = "✓",
    title = "Bravo",
    subtitle = "",
    stats = [],
    progress = null,
    ctaLabel = "Continuer",
    ariaLabel,
    onCta,
    onClose,
  } = config;

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "cu-overlay";
    overlay.style.setProperty("--cu-accent", accent);
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", ariaLabel || `${kicker} : ${title}`);

    const coreHtml = emblemHtml || esc(String(emblem));
    const statsHtml = (stats || []).filter(Boolean).map(renderStat).join("");
    const pct =
      progress && typeof progress.pct === "number"
        ? Math.max(0, Math.min(100, Math.round(progress.pct)))
        : null;

    overlay.innerHTML = `
      <div class="cu-lines" aria-hidden="true">${speedLines(7)}</div>
      <div class="cu-sweep" aria-hidden="true"></div>
      <button class="cu-close" type="button" aria-label="Fermer">×</button>
      <div class="cu-stage">
        <span class="cu-kicker"><span class="cu-tick" aria-hidden="true">${esc(kickerIcon)}</span>${esc(kicker)}</span>
        <div class="cu-emblem" aria-hidden="true">
          <span class="cu-ring"></span>
          <span class="cu-ring2"></span>
          <span class="cu-core">${coreHtml}</span>
          ${sparks(12)}
        </div>
        <div class="cu-rule" aria-hidden="true"><i></i></div>
        <h1 class="cu-name">${esc(title)}</h1>
        ${subtitle ? `<div class="cu-cat">${esc(subtitle)}</div>` : ""}
        ${statsHtml ? `<div class="cu-stats">${statsHtml}</div>` : ""}
        ${
          pct != null
            ? `
        <div class="cu-prog" aria-hidden="true">
          <div class="cu-prog-track"><div class="cu-prog-fill" data-pct="${pct}"></div></div>
          <div class="cu-prog-lbl"><span>${esc(String(progress.leftLabel ?? ""))}</span><span>${esc(String(progress.rightLabel ?? `${pct}%`))}</span></div>
        </div>`
            : ""
        }
        <button class="cu-cta" type="button">${esc(ctaLabel)}</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // son + vibration à l'ouverture
    try {
      if (navigator.vibrate) navigator.vibrate([12, 40, 18, 60, 24]);
    } catch {
      /* noop */
    }
    try {
      playReward();
    } catch {
      /* noop */
    }

    void overlay.offsetWidth; // reflow → déclenche les transitions
    overlay.classList.add("cu-show");

    // compteurs + barre de progression (après l'apparition)
    setTimeout(() => {
      overlay.querySelectorAll("[data-countup]").forEach((el) => {
        countUp(el, Number(el.getAttribute("data-countup")), 900);
      });
      const fill = overlay.querySelector(".cu-prog-fill");
      if (fill) fill.style.width = `${fill.getAttribute("data-pct")}%`;
    }, 760);

    let done = false;
    const close = (src) => {
      if (done) return;
      done = true;
      overlay.classList.remove("cu-show");
      overlay.classList.add("cu-closing");
      document.removeEventListener("keydown", escHandler);
      try {
        onClose?.();
      } catch {
        /* noop */
      }
      setTimeout(() => {
        overlay.remove();
        resolve(src);
      }, 280);
    };

    overlay.querySelector(".cu-cta").addEventListener("click", () => {
      try {
        onCta?.();
      } catch {
        /* noop */
      }
      close("cta");
    });
    overlay
      .querySelector(".cu-close")
      .addEventListener("click", () => close("close"));

    const escHandler = (e) => {
      if (e.key === "Escape") close("close");
    };
    document.addEventListener("keydown", escHandler);
  });
}
