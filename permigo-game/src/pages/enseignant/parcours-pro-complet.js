// ═══════════════════════════════════════════════════════════════
// Enseignant — Tous les paliers (timeline complète)
// Accessible depuis parcours-pro.js via "Voir tous les paliers →"
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import {
  getMoniteurState,
  buildTimelineStops,
} from "@/data/moniteur-levels.js";
import { haptic } from "@/utils/haptic.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { openPalierSheet } from "@/components/common/palier-sheet.js";
import { panneauxLayer } from "@/components/enseignant/panneaux-bg.js";

// ─── CSS ────────────────────────────────────────────────────────
const STYLE = `<style>
.epc-full {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 0 120px;
  background: var(--bg);
  font-family: var(--ens-body, 'Inter'), sans-serif;
  color: var(--ink);
}

/* ── Header arcade — même DA que aujourdhui.js ── */
.epc-full-hd {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
  background: color-mix(in srgb, var(--su2) 94%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 12px 20px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--ens-go, var(--a)) 15%, var(--bo));
  display: flex;
  align-items: center;
  gap: 10px;
}
.epc-full-back {
  width: 44px; height: 44px;
  border-radius: var(--ens-r, var(--r));
  background: color-mix(in srgb, var(--ens-go, var(--a)) 10%, var(--bg2));
  border: 1.5px solid color-mix(in srgb, var(--ens-go, var(--a)) 22%, transparent);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--ens-go, var(--a-txt));
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s, transform .18s cubic-bezier(0.23,1,0.32,1);
}
.epc-full-back:active { background: color-mix(in srgb, var(--ens-go, var(--a)) 20%, transparent); transform: scale(.97); }
.epc-full-hd-info { flex: 1; min-width: 0; }
.epc-full-h1 {
  font: 800 18px/1.2 var(--ens-display, 'Fredoka'), sans-serif;
  color: var(--ink);
  letter-spacing: -0.01em;
  margin: 0;
}
.epc-full-sub {
  font: 500 11px/1 var(--ens-body, 'Inter'), sans-serif;
  color: var(--mu2);
  margin: 3px 0 0;
}

/* Progress pill arcade */
.epc-full-pill {
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: var(--a-ink);
  background: var(--ens-go, var(--a));
  padding: 6px 12px;
  border-radius: var(--r-full);
  flex-shrink: 0;
  white-space: nowrap;
  box-shadow: 0 3px 0 0 color-mix(in srgb, var(--ens-go, var(--a)) 55%, #000);
}

/* Route card */
.epc-full-route {
  margin: 16px;
  padding: 20px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-xl);
  box-shadow: var(--ens-shadow, var(--s1));
}

/* ── Stops timeline (mêmes règles que parcours.js) ── */
.epcf-stop {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 0;
  position: relative;
}
.epcf-stop:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 17px;
  top: 38px;
  bottom: -10px;
  width: 2px;
  background: var(--bo3);
}
.epcf-stop.done:not(:last-child)::before { background: var(--gr); }
/* Le glyphe est désormais un médaillon 3D auto-porté : le pastillon ne fait
   plus que le loger (plus de fond/bordure plat qui doublonnait avec la pièce). */
.epcf-stop-dot {
  width: 36px; height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  z-index: 1;
  margin-top: 2px;
}
.epcf-stop-dot .pg-med { display: block; }
/* Palier courant : anneau lumineux conservé comme repère « c'est ici » */
.epcf-stop.now .epcf-stop-dot {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--a) 20%, transparent);
  border-radius: 50%;
}
.epcf-stop.locked .epcf-stop-dot { opacity: .55; }
.epcf-stop-body { flex: 1; min-width: 0; padding: 2px 0; }
.epcf-stop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.epcf-stop-lvl {
  font: 700 11px/1 var(--ens-body, 'Inter'), sans-serif;
  color: var(--mu2);
  text-transform: uppercase;
  letter-spacing: .06em;
}
.epcf-stop.now .epcf-stop-lvl  { color: var(--ens-go, var(--a-txt)); }
.epcf-stop.done .epcf-stop-lvl { color: var(--gr-txt); }
.epcf-stop-cost {
  font: 700 11px/1 var(--ens-body, 'Inter'), sans-serif;
  padding: 4px 10px;
  border-radius: var(--r-full);
  white-space: nowrap;
  flex-shrink: 0;
}
.epcf-stop-cost.done { color: #06310f; background: var(--ens-go, var(--gr)); }
.epcf-stop-cost.now  { color: var(--a-ink); background: var(--ens-blue, var(--a)); }
.epcf-stop-cost.todo { color: var(--mu3); background: var(--bg2); }
.epcf-stop-title {
  font: 700 14px/1.3 var(--ens-display, 'Fredoka'), sans-serif;
  color: var(--ink);
  margin-bottom: 6px;
}
.epcf-stop.locked .epcf-stop-title { color: var(--mu2); }
.epcf-stop.done  .epcf-stop-title  { color: var(--mu3); }
.epcf-stop-reward {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: color-mix(in srgb, var(--ens-blue, var(--a)) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--ens-blue, var(--a)) 20%, transparent);
  border-radius: var(--ens-r, var(--r));
  color: var(--ens-blue, var(--a-txt));
  margin-top: 4px;
}
.epcf-stop-reward.unlocked {
  background: color-mix(in srgb, var(--ens-go, #18a558) 9%, transparent);
  border-color: color-mix(in srgb, var(--ens-go, #18a558) 25%, transparent);
  color: var(--ens-go, var(--gr-txt));
}
.epcf-stop-reward-ico { display: flex; align-items: center; flex-shrink: 0; }
.epcf-stop-skin-img {
  width: 22px; height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}
.epcf-stop-reward-txt {
  font: 500 12px/1.3 var(--ens-body, 'Inter'), sans-serif;
}
.epcf-stop-reward-txt strong { font-weight: 700; }

/* Stop cliquable → ouvre le détail du palier */
.epcf-stop[role="button"] { cursor: pointer; -webkit-tap-highlight-color: transparent; border-radius: var(--r); transition: background .12s; }
.epcf-stop[role="button"]:active { background: color-mix(in srgb, var(--a) 6%, transparent); }
.epcf-stop:focus-visible { outline: 2px solid var(--a); outline-offset: 2px; }

/* Cercle Or halo */
.epcf-stop.cercle-or.done .epcf-stop-dot {
  background: radial-gradient(circle, rgba(245,158,11,.3), transparent 70%);
  animation: epcfGoldHalo 2.4s ease-in-out infinite;
}
@keyframes epcfGoldHalo {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,.5); }
  50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
}

/* Skeleton */
.epcf-skel {
  background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
  background-size: 200% 100%;
  animation: epcfShim 1.4s ease-in-out infinite;
  border-radius: var(--r-xl);
}
@keyframes epcfShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .epcf-stop.cercle-or.done .epcf-stop-dot { animation: none !important; }
  .epc-full-back { transition: none !important; }
}
</style>`;

// ─── State ──────────────────────────────────────────────────────
let _root = null;

// ─── Entry point ────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  const me = getCurUser();
  if (!me || me.role !== "enseignant") return;

  track("page.view", { page: "enseignant_parcours_complet" });

  root.innerHTML = `${STYLE}
    <div class="epc-full">
      <div class="epc-full-hd">
        <button class="epc-full-back" aria-label="Retour au parcours" id="epcf-back">
          ${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}
        </button>
        <div class="epc-full-hd-info">
          <h1 class="epc-full-h1">Tous les paliers</h1>
          <p class="epc-full-sub">Chargement…</p>
        </div>
      </div>
      <div class="epcf-skel" style="height:120px;margin:16px"></div>
      <div class="epcf-skel" style="height:200px;margin:16px"></div>
    </div>`;

  root.querySelector("#epcf-back")?.addEventListener("click", () => {
    haptic("select");
    navigate("#/parcours");
  });

  // ─── Fetch ──────────────────────────────────────────────────
  const { count, error } = await sb
    .from("validations")
    .select("id", { count: "exact", head: true })
    .eq("validated_by", me.id);

  if (error) {
    toast(
      "« Paliers » indisponible. Vérifie ta connexion, puis réessaie.",
      "error",
    );
    return;
  }

  const totalValidations = count ?? 0;
  const state = getMoniteurState(totalValidations);
  const stops = buildTimelineStops();

  const doneCount = stops.filter((s) => totalValidations >= s.threshold).length;

  root.innerHTML = `${STYLE}
    <div class="epc-full anim-slide-up">

      <div class="epc-full-hd">
        <button class="epc-full-back" aria-label="Retour au parcours" id="epcf-back">
          ${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}
        </button>
        <div class="epc-full-hd-info">
          <h1 class="epc-full-h1">Tous les paliers</h1>
          <p class="epc-full-sub">${esc(state.saison.name)} · ${totalValidations} validation${totalValidations > 1 ? "s" : ""}</p>
        </div>
        <div class="epc-full-pill">${doneCount}/${stops.length}</div>
      </div>

      <div class="epc-full-route" style="position:relative;overflow:hidden;">
        ${panneauxLayer({ variant: "section" })}
        <div style="position:relative;z-index:2;">
          ${stops.map((s) => renderStop(s, totalValidations)).join("")}
        </div>
      </div>

    </div>`;

  // ─── Wire ───────────────────────────────────────────────────
  root.querySelector("#epcf-back")?.addEventListener("click", () => {
    haptic("select");
    navigate("#/parcours");
  });

  // Clic / clavier sur un stop → sheet de détail du palier
  const openFromStop = (el) => {
    const tierNum = parseInt(el.dataset.tier, 10);
    const stop = stops.find((s) => s.tier.tier === tierNum);
    if (!stop) return;
    const isDone = totalValidations >= stop.threshold;
    haptic(isDone ? "levelup" : "impact");
    track("parcours_complet.tier_detail", { tier: tierNum });
    openPalierSheet(stop.tier, totalValidations);
  };
  root.querySelectorAll(".epcf-stop[data-tier]").forEach((el) => {
    el.addEventListener("click", () => openFromStop(el));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFromStop(el);
      }
    });
  });

  // Scroll vers le stop "now" si présent
  const nowStop = root.querySelector(".epcf-stop.now");
  if (nowStop) {
    setTimeout(
      () => nowStop.scrollIntoView({ behavior: "smooth", block: "center" }),
      400,
    );
  }
}

// ─── Render helpers ─────────────────────────────────────────────

function renderStop(stop, totalValidations) {
  // Tiers uniquement (plus de skin, plus de blur « Mystère »)
  const tierNum = stop.tier.tier;
  const cls = totalValidations >= stop.threshold ? "done" : "todo";
  const isCercleOr = tierNum === 10;
  const iconName = "award";

  const dotContent =
    isCercleOr && cls === "done"
      ? medallion("couronne", "gold", { size: 34, glow: true })
      : cls === "done"
        ? medallion("check", "green", { size: 30 })
        : medallion("etoile", "argent", { size: 30 });

  // Cost badge
  const diff = stop.threshold - totalValidations;
  const costLine =
    cls === "done"
      ? `<span class="epcf-stop-cost done">Atteint · ${stop.threshold} validations</span>`
      : `<span class="epcf-stop-cost todo">+${diff} validation${diff > 1 ? "s" : ""}</span>`;

  // Ligne statut — palier de progression (plus d'« outil débloqué »)
  const rewardIco =
    cls === "done"
      ? medallion("trophee", "gold", { size: 22 })
      : icon(iconName, { size: 14, strokeWidth: 2.4 });
  const rewardLine = `
    <div class="epcf-stop-reward ${cls === "done" ? "unlocked" : ""}">
      <span class="epcf-stop-reward-ico">${rewardIco}</span>
      <span class="epcf-stop-reward-txt">
        ${cls === "done" ? "Statut atteint : " : "Prochain statut : "}
        <strong>${esc(stop.tier.title)}</strong>
      </span>
    </div>
  `;

  const classList = ["epcf-stop", cls, "tier", isCercleOr ? "cercle-or" : ""]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="${classList}" data-tier="${stop.tier.tier}" role="button" tabindex="0" aria-label="Détail du palier ${stop.tier.tier}">
      <div class="epcf-stop-dot">${dotContent}</div>
      <div class="epcf-stop-body">
        <div class="epcf-stop-head">
          <span class="epcf-stop-lvl">Palier ${stop.tier.tier}</span>
          ${costLine}
        </div>
        <div class="epcf-stop-title">${esc(stop.tier.title)}</div>
        ${rewardLine}
      </div>
    </div>
  `;
}
