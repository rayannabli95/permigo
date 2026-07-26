// ═══════════════════════════════════════════════════════════════
// Permis Card — pass Apple Wallet évolutif (carte qui se débloque)
// État : formation (0-30%) → pret (30-70%) → validé (70-100%)
// Couleurs + sceau changent selon le % de compétences validées
// Pas de NEPH, pas de mention "République" (règle PermiGo)
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { getPermisBg } from "@/utils/assets.js";
import { getEquippedAsset } from "@/utils/game-state.js";

const STYLE = `<style>
.pc-wrap {
  perspective: 1200px;
  padding: 16px 0;
  display: flex;
  justify-content: center;
}
.pc {
  position: relative;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 1 / 1.58;
  border-radius: 24px;
  padding: 24px 20px 20px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform .4s cubic-bezier(.2,.7,.3,1), box-shadow .4s ease;
  isolation: isolate;
  user-select: none;
  -webkit-user-select: none;
}

/* Shine effect au touch / hover (skill emil-design-eng : ease-out custom, < 200ms entrée) */
.pc::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,.28) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform .65s cubic-bezier(0.23, 1, 0.32, 1);
  pointer-events: none;
  z-index: 1;
}
/* hover seulement sur device avec vrai pointer (évite faux trigger sur touch) */
@media (hover: hover) and (pointer: fine) {
  .pc:hover::before { transform: translateX(100%); }
}
.pc:active::before { transform: translateX(100%); }
.pc:active { transform: scale(0.985); transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); }

/* Background image premium (mesh / route / holographic selon palier) */
.pc-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  opacity: .55;
  mix-blend-mode: overlay;
  pointer-events: none;
  animation: pcBgIn .6s cubic-bezier(.23,1,.32,1) both;
  transition: opacity .4s ease;
}
@keyframes pcBgIn {
  from { opacity: 0; transform: scale(1.08); }
  to   { opacity: .55; transform: scale(1); }
}
/* État "Prêt" (palier route) : opacité un poil + + très subtle shift */
.pc.s-pret .pc-bg { opacity: .62; }
/* État "Validé" (palier holographique) : opacité max + screen blend + shift animé */
.pc.s-valide .pc-bg {
  opacity: .78;
  mix-blend-mode: screen;
  animation: pcBgIn .6s cubic-bezier(.23,1,.32,1) both, pcHoloShift 9s ease-in-out infinite alternate;
}
@keyframes pcHoloShift {
  0%   { background-position: 0%   50%; filter: hue-rotate(0deg) saturate(1.05); }
  50%  { background-position: 100% 50%; filter: hue-rotate(15deg) saturate(1.15); }
  100% { background-position: 0%   50%; filter: hue-rotate(-10deg) saturate(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .pc-bg { animation: none !important; }
  .pc.s-valide .pc-bg { animation: none !important; filter: none !important; }
}

/* Grain texture pour effet matière (au-dessus du PNG) */
.pc::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255,255,255,.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,.04) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}

/* ─── États visuels ─── */
.pc.s-formation {
  background:
    linear-gradient(135deg, var(--mu3) 0%, var(--mu2) 50%, var(--bo4) 100%);
  box-shadow:
    0 10px 30px -10px rgba(100,116,139,.5),
    0 4px 12px rgba(10,13,26,.08);
}
.pc.s-pret {
  background:
    linear-gradient(135deg, var(--adk) 0%, var(--a) 45%, color-mix(in srgb, var(--a) 38%, #000) 100%);
  box-shadow:
    0 16px 40px -12px color-mix(in srgb, var(--a) 55%, transparent),
    0 4px 12px rgba(10,13,26,.1);
}
.pc.s-valide {
  background:
    linear-gradient(135deg, var(--amk) 0%, var(--am) 40%, var(--aml) 100%);
  box-shadow:
    0 20px 50px -10px rgba(245,158,11,.6),
    0 0 0 1px rgba(254,243,199,.4),
    0 4px 12px rgba(10,13,26,.1);
  animation: pcGlow 3s ease-in-out infinite;
}
@keyframes pcGlow {
  0%, 100% {
    box-shadow:
      0 20px 50px -10px rgba(245,158,11,.5),
      0 0 0 1px rgba(254,243,199,.4),
      0 4px 12px rgba(10,13,26,.1);
  }
  50% {
    box-shadow:
      0 24px 60px -8px rgba(245,158,11,.75),
      0 0 0 1px rgba(254,243,199,.6),
      0 4px 12px rgba(10,13,26,.1);
  }
}

/* ─── Sections ─── */
.pc-inner { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; }

.pc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: auto;
}
.pc-flag {
  width: 28px; height: 20px;
  border-radius: 4px;
  background: linear-gradient(90deg, #002395 33.33%, #fff 33.33% 66.66%, #ED2939 66.66%);
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,.15);
}
.pc-brand {
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .04em;
  background: rgba(255,255,255,.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 99px;
  border: 1px solid rgba(255,255,255,.22);
}

.pc-label {
  font: 600 9.5px/1 'Inter', sans-serif;
  letter-spacing: .18em;
  text-transform: uppercase;
  opacity: .82;
  margin: 16px 0 4px;
}
.pc-title {
  font: 700 19px/1.15 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.01em;
  margin: 0 0 2px;
}
.pc-subtitle {
  font: 500 11px/1 'Inter', sans-serif;
  opacity: .75;
  margin: 0 0 18px;
}

/* Avatar + nom inline */
.pc-id {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.pc-av {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(255,255,255,.16);
  border: 1.5px solid rgba(255,255,255,.3);
  display: flex; align-items: center; justify-content: center;
  font: 700 18px/1 'Plus Jakarta Sans', sans-serif;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.pc-id-info { min-width: 0; }
.pc-nom {
  font: 700 16px/1.2 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-prenom {
  font: 500 12px/1 'Inter', sans-serif;
  opacity: .82;
  margin-top: 3px;
}

/* Meta rows */
.pc-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.pc-meta-item {
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 10px;
  padding: 8px 10px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.pc-meta-lbl {
  font: 600 9px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: .72;
  margin-bottom: 4px;
}
.pc-meta-val {
  font: 600 12px/1.2 'Inter', sans-serif;
}

/* Footer : progression + sceau */
.pc-foot { margin-top: auto; display: flex; align-items: flex-end; gap: 12px; }
.pc-prog { flex: 1; min-width: 0; }
.pc-prog-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.pc-prog-lbl {
  font: 600 9.5px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: .78;
}
.pc-prog-pct {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.02em;
}
.pc-prog-bar {
  height: 5px;
  background: rgba(0,0,0,.18);
  border-radius: 99px;
  overflow: hidden;
}
.pc-prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,.85) 100%);
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}

/* Sceau / cachet */
.pc-sceau {
  flex-shrink: 0;
  width: 70px; height: 70px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2px solid currentColor;
  font: 800 8px/1.05 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .04em;
  text-transform: uppercase;
  transform: rotate(-8deg);
  padding: 4px;
  background: rgba(255,255,255,.96);
}
.pc.s-formation .pc-sceau { color: var(--rdx); }
.pc.s-pret      .pc-sceau { color: var(--amx); }
.pc.s-valide    .pc-sceau {
  color: var(--grdk);
  animation: pcSceauPulse 2.4s ease-in-out infinite;
}
.pc-sceau-ico { font-size: 14px; line-height: 1; margin-bottom: 2px; }
@keyframes pcSceauPulse {
  0%, 100% { transform: rotate(-8deg) scale(1); }
  50%      { transform: rotate(-8deg) scale(1.06); }
}

/* Hint sous la carte */
.pc-hint {
  text-align: center;
  font: 500 11px/1.4 'Inter', sans-serif;
  color: var(--mu2);
  margin-top: 12px;
  padding: 0 24px;
}

@media (prefers-reduced-motion: reduce) {
  .pc, .pc::before, .pc.s-valide, .pc.s-valide .pc-sceau { animation: none !important; transition: none !important; }
}
</style>`;

/**
 * Détermine l'état visuel selon le % de complétion
 */
function getState(pct) {
  if (pct >= 70) return { key: "valide", label: "Validé", ico: "✓" };
  if (pct >= 30) return { key: "pret", label: "Prêt à l'examen", ico: "◐" };
  return { key: "formation", label: "En formation", ico: "◯" };
}

/**
 * Génère les initiales depuis prenom+nom
 */
function initials(prenom, nom) {
  const p = (prenom || "").trim()[0] || "";
  const n = (nom || "").trim()[0] || "";
  return (p + n).toUpperCase() || "?";
}

/**
 * Formate date YYYY-MM-DD → DD/MM/YYYY
 */
function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Render la carte permis.
 * @param {Object} opts
 * @param {string} opts.prenom
 * @param {string} opts.nom
 * @param {string} opts.created_at - date début formation (ISO)
 * @param {number} opts.validated  - nb compétences validées
 * @param {number} opts.total      - total compétences REMC (31)
 */
function renderPermisCard({
  prenom = "",
  nom = "",
  created_at = null,
  validated = 0,
  total = 31,
}) {
  const pct = Math.min(100, Math.round((validated / total) * 100));
  const state = getState(pct);
  const ini = initials(prenom, nom);
  const bgUrl =
    getEquippedAsset("permis_bg") || getPermisBg(validated, "eleve");

  return `${STYLE}
<div class="pc-wrap">
  <div class="pc s-${state.key}" role="img" aria-label="Carte permis - ${esc(state.label)}">
    <div class="pc-bg" style="background-image:url('${esc(bgUrl)}')"></div>
    <div class="pc-inner">

      <div class="pc-top">
        <div class="pc-flag" aria-hidden="true"></div>
        <div class="pc-brand">PermiGo</div>
      </div>

      <div class="pc-label">Permis de conduire</div>
      <div class="pc-title">Catégorie B</div>
      <div class="pc-subtitle">Véhicules légers · Apprentissage</div>

      <div class="pc-id">
        <div class="pc-av">${esc(ini)}</div>
        <div class="pc-id-info">
          <div class="pc-nom">${esc(nom || prenom || "—")}</div>
          <div class="pc-prenom">${esc(prenom || "")}</div>
        </div>
      </div>

      <div class="pc-meta">
        <div class="pc-meta-item">
          <div class="pc-meta-lbl">Début formation</div>
          <div class="pc-meta-val">${esc(formatDate(created_at))}</div>
        </div>
        <div class="pc-meta-item">
          <div class="pc-meta-lbl">Compétences</div>
          <div class="pc-meta-val">${validated} / ${total}</div>
        </div>
      </div>

      <div class="pc-foot">
        <div class="pc-prog">
          <div class="pc-prog-row">
            <span class="pc-prog-lbl">Prêt examen</span>
            <span class="pc-prog-pct">${pct}%</span>
          </div>
          <div class="pc-prog-bar">
            <div class="pc-prog-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="pc-sceau" aria-hidden="true">
          <div class="pc-sceau-ico">${state.ico}</div>
          <div>${esc(state.label)}</div>
        </div>
      </div>

    </div>
  </div>
</div>
<div class="pc-hint">Ta carte évolue à chaque compétence validée. Vise les 100% pour la passer en or.</div>`;
}

/**
 * Détecte si l'élève a franchi un palier de fond (mesh→route à 10, route→holo à 20).
 * Stocke en localStorage le dernier palier vu pour ne notifier qu'une fois.
 */
function detectBgMilestone(validated) {
  if (typeof localStorage === "undefined") return null;
  const KEY = "permigo:permis_bg_milestone_seen";
  let tier = 0;
  if (validated >= 20)
    tier = 2; // Holographic
  else if (validated >= 10) tier = 1; // Route
  // tier 0 = Mesh (défaut)
  const seen = parseInt(localStorage.getItem(KEY) || "0", 10);
  if (tier > seen) {
    localStorage.setItem(KEY, String(tier));
    return tier; // 1 = Route, 2 = Holographic
  }
  return null;
}

/**
 * Affiche un toast léger "Nouveau fond débloqué" en haut de la card.
 */
function showBgMilestoneToast(card, tier) {
  const labels = {
    1: {
      title: "Fond Route débloqué",
      sub: "Tu progresses bien — déjà 10 compétences acquises.",
    },
    2: {
      title: "Fond Holographic débloqué",
      sub: "20 compétences acquises. Plus que la ligne d'arrivée !",
    },
  };
  const conf = labels[tier];
  if (!conf) return;
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: absolute; left: 50%; top: -8px; transform: translate(-50%, -100%);
    background: rgba(15, 23, 42, .94); color: #fff; padding: 12px 16px; border-radius: 14px;
    font: 600 12px/1.3 'Inter', sans-serif; box-shadow: 0 12px 28px rgba(10,13,26,.32);
    z-index: 10; min-width: 220px; text-align: center; pointer-events: none;
    opacity: 0; transition: opacity .35s ease, transform .35s cubic-bezier(.23,1,.32,1);
    backdrop-filter: blur(8px);
  `;
  toast.innerHTML = `
    <div style="font:800 13px/1.2 'Plus Jakarta Sans',sans-serif;margin-bottom:3px;color:var(--aml)">🎴 ${conf.title}</div>
    <div style="font:500 11px/1.4 'Inter',sans-serif;color:var(--bo4)">${conf.sub}</div>
  `;
  card.style.position = card.style.position || "relative";
  card.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, -110%)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, -100%)";
    setTimeout(() => toast.remove(), 380);
  }, 4500);
}

// ─── Variante MINI (paysage, format carte bancaire) ──────────────
// Pensée pour l'accueil : l'élève voit en 1 coup d'œil où il en est,
// depuis quand il est inscrit, et sa progression globale.
const MINI_STYLE = `<style>
.pcm {
  position: relative;
  border-radius: 20px;
  padding: 16px 18px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 18px 40px -14px rgba(10,13,26,.5), 0 4px 12px rgba(10,13,26,.12);
  transition: transform .15s var(--ease-spring, ease);
}
.pcm:active { transform: scale(.98); }
.pcm.s-formation { background: linear-gradient(135deg, #3e4961 0%, #262f47 100%); }
.pcm.s-pret      { background: linear-gradient(135deg, var(--adk) 0%, var(--a) 100%); }
.pcm.s-valide    { background: linear-gradient(135deg, var(--amk, #b45309) 0%, var(--am, #f59e0b) 100%); }
.pcm-bg {
  position: absolute; inset: 0;
  background-position: center; background-size: cover;
  opacity: .45; mix-blend-mode: overlay; pointer-events: none;
}
.pcm-top { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; position: relative; }
.pcm-flag {
  width: 22px; height: 15px; border-radius: 3px; flex-shrink: 0;
  background: linear-gradient(90deg, #002395 33.33%, #fff 33.33% 66.66%, #ED2939 66.66%);
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.pcm-label {
  flex: 1; font: 700 10px/1 'Inter', sans-serif;
  letter-spacing: .14em; text-transform: uppercase;
  color: rgba(255,255,255,.85);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pcm-state {
  font: 800 9.5px/1 'Inter', sans-serif; letter-spacing: .06em;
  text-transform: uppercase; padding: 5px 9px; border-radius: 99px;
  background: rgba(255,255,255,.94); flex-shrink: 0;
}
.pcm.s-formation .pcm-state { color: #334155; }
.pcm.s-pret      .pcm-state { color: var(--adk); }
.pcm.s-valide    .pcm-state { color: #92400e; }
.pcm-name {
  font: 800 19px/1.15 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.02em; text-transform: uppercase; position: relative;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pcm-since { font: 500 12.5px/1 'Inter', sans-serif; color: rgba(255,255,255,.78); margin-top: 5px; position: relative; }
.pcm-foot { margin-top: 18px; position: relative; }
.pcm-prog-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 7px; }
.pcm-count { font: 600 13px/1 'Inter', sans-serif; color: rgba(255,255,255,.92); }
.pcm-count b { font: 800 16px/1 'Plus Jakarta Sans', sans-serif; }
.pcm-pct { font: 800 24px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.02em; }
.pcm-bar { height: 6px; background: rgba(0,0,0,.25); border-radius: 99px; overflow: hidden; }
.pcm-fill {
  height: 100%; background: #fff; border-radius: 99px;
  transition: width 1s .25s cubic-bezier(.2,.7,.3,1);
}
@media (prefers-reduced-motion: reduce) { .pcm, .pcm-fill { transition: none !important; } }
</style>`;

/**
 * Render la carte permis compacte (paysage) pour l'accueil.
 * Le remplissage de la barre est animé par le parent via [data-target].
 */
export function renderPermisMini({
  prenom = "",
  nom = "",
  created_at = null,
  validated = 0,
  total = 31,
}) {
  const pct = Math.min(100, Math.round((validated / total) * 100));
  const state = getState(pct);
  const bgUrl =
    getEquippedAsset("permis_bg") || getPermisBg(validated, "eleve");
  const fullName = [prenom, nom].filter(Boolean).join(" ") || "—";

  return `${MINI_STYLE}
<div class="pcm s-${state.key}" role="button" tabindex="0"
     aria-label="Mon permis virtuel — ${esc(state.label)}, ${pct}% de progression. Voir mon parcours.">
  <div class="pcm-bg" style="background-image:url('${esc(bgUrl)}')"></div>
  <div class="pcm-top">
    <div class="pcm-flag" aria-hidden="true"></div>
    <div class="pcm-label">Permis de conduire · B</div>
    <div class="pcm-state">${esc(state.label)}</div>
  </div>
  <div class="pcm-name">${esc(fullName)}</div>
  ${created_at ? `<div class="pcm-since">Inscrit·e le ${esc(formatDate(created_at))}</div>` : ""}
  <div class="pcm-foot">
    <div class="pcm-prog-row">
      <span class="pcm-count"><b>${validated}</b> / ${total} compétences</span>
      <span class="pcm-pct">${pct}%</span>
    </div>
    <div class="pcm-bar"><div class="pcm-fill" style="width:0%" data-target="${pct}"></div></div>
  </div>
</div>`;
}

/**
 * Mount + branche le tilt 3D sur touch/mouse
 */
export function mountPermisCard(container, opts) {
  container.innerHTML = renderPermisCard(opts);
  const card = container.querySelector(".pc");
  if (!card) return;

  // Toast palier au mount (max une fois par franchissement)
  const milestone = detectBgMilestone(opts?.validated ?? 0);
  if (milestone) {
    setTimeout(
      () => showBgMilestoneToast(card.parentElement || card, milestone),
      700,
    );
  }

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let raf = null;
  function onMove(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    const rx = (y / rect.height - 0.5) * -8;
    const ry = (x / rect.width - 0.5) * 8;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  }
  function onLeave() {
    cancelAnimationFrame(raf);
    card.style.transform = "";
  }
  card.addEventListener("mousemove", onMove);
  card.addEventListener("mouseleave", onLeave);
  card.addEventListener("touchmove", onMove, { passive: true });
  card.addEventListener("touchend", onLeave);
}
