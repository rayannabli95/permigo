// ═══════════════════════════════════════════════════════════════
// Owner — Cockpit PLATEFORME (Rayan : voit toutes les écoles)
// Au-dessus du gérant (qui ne voit que SON école). Agrégats par défaut
// (vie privée des moniteurs respectée). DA command-center dark, raccord
// avec gerant/cockpit.js.
// RPC : get_owner_overview() · get_owner_school_breakdown()
//        (migration 20260624030000_owner_role_and_cockpit.sql)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";

// ─── Design tokens (raccord cockpit gérant) ──────────────────────
const BG = "var(--ink)";
const SURF2 = "#1a2236";
const BORD = "var(--ink4)";
const TEXT = "var(--bg4)";
const MUTED = "color-mix(in srgb, var(--bg4) 65%, var(--ink))";
const ACC = "var(--a)";

const KPI_DEFS = [
  { key: "nb_ecoles", label: "Écoles", color: ACC, unit: null },
  { key: "nb_eleves", label: "Élèves", color: "var(--pu)", unit: null },
  { key: "nb_moniteurs", label: "Moniteurs", color: "var(--gr)", unit: null },
  { key: "nb_actifs_7j", label: "Actifs 7j", color: "var(--a)", unit: null },
  {
    key: "taux_reussite",
    label: "Réussite examen",
    color: "var(--gr)",
    unit: "%",
  },
  {
    key: "nb_validations",
    label: "Validations",
    color: "var(--am)",
    unit: null,
  },
];

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.ow {
  max-width: 580px; margin: 0 auto; padding: 0 0 110px;
  background: ${BG}; color: ${TEXT};
  font-family: 'Inter', sans-serif; min-height: 100dvh;
}
.ow-skel {
  background: linear-gradient(90deg, ${BG} 0%, ${SURF2} 50%, ${BG} 100%);
  background-size: 200% 100%; animation: owShim 1.6s ease-in-out infinite;
  border-radius: var(--r-lg);
}
@keyframes owShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .ow-skel { animation: none; } }

/* Header sticky */
.ow-hd {
  position: sticky; top: calc(52px + env(safe-area-inset-top, 0px)); z-index: 20;
  background: ${BG}; border-bottom: 1px solid ${BORD};
  padding: 14px 20px; display: flex; align-items: center; gap: 12px;
}
.ow-hd-logo { font: 800 16px/1 'Plus Jakarta Sans', sans-serif; color: ${TEXT}; letter-spacing: -.02em; }
.ow-hd-tag {
  font: 800 9.5px/1 'Inter', sans-serif; letter-spacing: .14em; text-transform: uppercase;
  color: var(--a-ink); background: ${ACC}; padding: 4px 8px; border-radius: 6px;
}
.ow-hd-spacer { flex: 1; }
.ow-refresh-btn {
  width: 38px; height: 38px; border-radius: 11px; border: 1px solid ${BORD};
  background: ${SURF2}; color: ${MUTED}; display: flex; align-items: center; justify-content: center;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: transform .14s var(--ease-spring), color .14s;
}
.ow-refresh-btn:active { transform: scale(.9) rotate(40deg); color: ${TEXT}; }
.ow-refresh-btn:focus-visible { outline: 2px solid ${ACC}; outline-offset: 2px; }

/* Sections */
.ow-section { padding: 20px 16px 0; }
.ow-section-hd { display: flex; align-items: baseline; gap: 8px; margin: 0 4px 12px; }
.ow-section-title { font: 800 12px/1 'Inter', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: ${MUTED}; }

/* KPI grid */
.ow-kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ow-kpi {
  background: ${SURF2}; border: 1px solid ${BORD}; border-radius: 16px;
  padding: 14px 14px 13px; position: relative; overflow: hidden;
  animation: owKpiIn .42s var(--ease-spring) both;
}
.ow-kpi::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--kpi-color, ${ACC});
}
@keyframes owKpiIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .ow-kpi { animation: none; } }
.ow-kpi-label { font: 700 11px/1.2 'Inter', sans-serif; color: ${MUTED}; margin-bottom: 7px; }
.ow-kpi-val {
  font: 800 27px/1 'Plus Jakarta Sans', sans-serif; color: ${TEXT};
  font-variant-numeric: tabular-nums; letter-spacing: -.02em;
}
.ow-kpi-unit { font-size: 15px; color: ${MUTED}; margin-left: 2px; }

/* School breakdown */
.ow-school {
  display: flex; align-items: center; gap: 12px;
  background: ${SURF2}; border: 1px solid ${BORD}; border-radius: 14px;
  padding: 13px 14px; margin-bottom: 9px; width: 100%; text-align: left;
  cursor: default; -webkit-tap-highlight-color: transparent;
  animation: owKpiIn .4s var(--ease-spring) both;
}
.ow-school-rank {
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 8px;
  background: color-mix(in srgb, ${ACC} 18%, transparent); color: ${ACC};
  font: 800 12px/1 'IBM Plex Mono', monospace;
  display: flex; align-items: center; justify-content: center;
}
.ow-school-main { flex: 1; min-width: 0; }
.ow-school-name {
  font: 800 14px/1.2 'Plus Jakarta Sans', sans-serif; color: ${TEXT};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -.01em;
}
.ow-school-meta { font: 600 11.5px/1.3 'Inter', sans-serif; color: ${MUTED}; margin-top: 3px; }
.ow-school-stat { flex-shrink: 0; text-align: right; }
.ow-school-stat-val { font: 800 16px/1 'Plus Jakarta Sans', sans-serif; color: ${TEXT}; font-variant-numeric: tabular-nums; }
.ow-school-stat-lbl { font: 600 10px/1 'Inter', sans-serif; color: ${MUTED}; margin-top: 3px; }

/* États vides / erreur */
.ow-empty {
  margin: 16px; padding: 28px 22px; text-align: center;
  background: ${SURF2}; border: 1px solid ${BORD}; border-radius: 18px;
}
.ow-empty-ico { color: var(--am); margin-bottom: 12px; }
.ow-empty-t { font: 800 16px/1.3 'Plus Jakarta Sans', sans-serif; color: ${TEXT}; margin-bottom: 8px; }
.ow-empty-s { font: 500 13px/1.6 'Inter', sans-serif; color: ${MUTED}; }
.ow-empty-s code { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: ${TEXT}; }
</style>`;

// ─── Mount ────────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track("page.view", { page: "owner_cockpit", role: me.role });

  root.innerHTML = `${STYLE}
<div class="ow anim-slide-up">
  <div class="ow-hd">
    <span class="ow-hd-logo">PermiGo</span>
    <span class="ow-hd-tag">Plateforme</span>
    <span class="ow-hd-spacer"></span>
    <button class="ow-refresh-btn" id="ow-refresh" type="button" aria-label="Actualiser">
      ${icon("refresh-cw", { size: 16, strokeWidth: 2.2 })}
    </button>
  </div>
  <div class="ow-section">
    <div class="ow-section-hd"><span class="ow-section-title">Vue d'ensemble</span></div>
    <div class="ow-kpi-grid" id="ow-kpis">
      ${[...Array(6)].map(() => `<div class="ow-skel" style="height:78px"></div>`).join("")}
    </div>
  </div>
  <div class="ow-section">
    <div class="ow-section-hd"><span class="ow-section-title">Écoles</span></div>
    <div id="ow-schools">
      ${[...Array(3)].map(() => `<div class="ow-skel" style="height:62px;margin-bottom:9px"></div>`).join("")}
    </div>
  </div>
</div>`;

  root.querySelector("#ow-refresh")?.addEventListener("click", () => {
    haptic("tap");
    mount(root);
  });

  await load(root);
}

// ─── Data + render ────────────────────────────────────────────────
async function load(root) {
  const [overviewRes, schoolsRes] = await Promise.allSettled([
    sb.rpc("get_owner_overview"),
    sb.rpc("get_owner_school_breakdown"),
  ]);

  // La RPC peut ne pas encore exister en prod (migration owner non appliquée)
  // ou être refusée (compte non promu 'owner') → état vide explicite, pas un
  // écran blanc.
  const overviewErr = overviewRes.value?.error || overviewRes.reason;
  const overview =
    overviewRes.value?.data?.[0] || overviewRes.value?.data || null;

  if (overviewErr || !overview) {
    renderUnavailable(root, overviewErr);
    return;
  }

  renderKpis(root, overview);
  renderSchools(root, schoolsRes.value?.data || []);
}

function renderKpis(root, ov) {
  const grid = root.querySelector("#ow-kpis");
  if (!grid) return;
  grid.innerHTML = KPI_DEFS.map((def, i) => {
    const raw = Number(ov[def.key] ?? 0);
    return `
      <div class="ow-kpi" style="--kpi-color:${def.color};animation-delay:${i * 45}ms">
        <div class="ow-kpi-label">${esc(def.label)}</div>
        <div class="ow-kpi-val" data-target="${raw}">0${def.unit ? `<span class="ow-kpi-unit">${def.unit}</span>` : ""}</div>
      </div>`;
  }).join("");
  countUp(grid);
}

function renderSchools(root, schools) {
  const box = root.querySelector("#ow-schools");
  if (!box) return;
  if (!schools.length) {
    box.innerHTML = `<div class="ow-empty">
      <div class="ow-empty-ico">${icon("home", { size: 30, strokeWidth: 2 })}</div>
      <div class="ow-empty-t">Aucune école pour l'instant</div>
      <div class="ow-empty-s">Les écoles apparaîtront ici dès le premier client.</div>
    </div>`;
    return;
  }
  box.innerHTML = schools
    .map((s, i) => {
      const nbMon = Number(s.nb_moniteurs ?? 0);
      const nbEl = Number(s.nb_eleves ?? 0);
      const nbRecus = Number(s.nb_recus ?? 0);
      const actifs = Number(s.nb_actifs_7j ?? 0);
      return `
      <div class="ow-school" style="animation-delay:${i * 40}ms">
        <span class="ow-school-rank">${i + 1}</span>
        <div class="ow-school-main">
          <div class="ow-school-name">${esc(s.ecole_nom || "École")}${s.ville ? ` · ${esc(s.ville)}` : ""}</div>
          <div class="ow-school-meta">${nbMon} moniteur${nbMon > 1 ? "s" : ""} · ${nbEl} élève${nbEl > 1 ? "s" : ""} · ${actifs} actifs 7j${nbRecus > 0 ? ` · ${nbRecus} reçu${nbRecus > 1 ? "s" : ""}` : ""}</div>
        </div>
        <div class="ow-school-stat">
          <div class="ow-school-stat-val">${Number(s.nb_validations ?? 0)}</div>
          <div class="ow-school-stat-lbl">validations</div>
        </div>
      </div>`;
    })
    .join("");
}

function renderUnavailable(root, err) {
  const msg = String(err?.message || err || "");
  const forbidden = /forbidden|owner only|permission/i.test(msg);
  root.querySelector("#ow-kpis")?.replaceChildren();
  root.querySelector("#ow-schools")?.replaceChildren();
  const kpis = root.querySelector("#ow-kpis");
  if (kpis) {
    kpis.outerHTML = `<div class="ow-empty">
      <div class="ow-empty-ico">${icon("alert-triangle", { size: 30, strokeWidth: 2 })}</div>
      <div class="ow-empty-t">${forbidden ? "Accès plateforme non activé" : "Cockpit plateforme indisponible"}</div>
      <div class="ow-empty-s">${
        forbidden
          ? "Ton compte n'a pas encore le rôle <code>owner</code>. Applique la migration puis promeus le compte."
          : "Les fonctions <code>get_owner_overview</code> ne sont pas encore en base. Applique <code>20260624030000_owner_role_and_cockpit.sql</code>."
      }</div>
    </div>`;
  }
}

// ─── Count-up (texte ; respecte reduced-motion) ───────────────────
function countUp(scope) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scope.querySelectorAll("[data-target]").forEach((el) => {
    const target = Number(el.dataset.target) || 0;
    const unit = el.querySelector(".ow-kpi-unit")?.outerHTML || "";
    if (reduce || target === 0) {
      el.innerHTML = `${target}${unit}`;
      return;
    }
    const dur = 700;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = `${Math.round(target * eased)}${unit}`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
