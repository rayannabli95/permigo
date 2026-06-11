// ═══════════════════════════════════════════════════════════════
// Enseignant — Bilan trimestriel élève
// Route : #/bilan/:eleveId
// RPC   : get_bilan_data(p_eleve_id, p_trimestre_start?)
// Print-friendly · @media print
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";
import { navigate } from "@/router.js";

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout ── */
.bl {
  padding: 20px 16px 80px;
  max-width: 640px;
  margin: 0 auto;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', sans-serif;
}

/* ── Header ── */
.bl-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}
.bl-hd-left {}
.bl-school-logo {
  font: 700 11px/1 'Plus Jakarta Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--mu2);
  margin-bottom: 8px;
}
.bl-title {
  font: 800 24px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -.02em;
}
.bl-subtitle {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--mu);
  margin-top: 4px;
}
.bl-print-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink5);
  cursor: pointer;
  min-height: 44px;
  flex-shrink: 0;
  transition: border-color .16s, transform .16s cubic-bezier(.23,1,.32,1);
}
.bl-print-btn:active { transform: scale(.97); }
@media (hover:hover) and (pointer:fine) {
  .bl-print-btn:hover { border-color: var(--al3); color: var(--adk); }
}

/* ── Trimestre badge ── */
.bl-trimestre {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: color-mix(in srgb, var(--a) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--a) 20%, transparent);
  border-radius: 20px;
  font: 600 12px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--adk);
  margin-bottom: 20px;
}

/* ── KPI grid ── */
.bl-kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.bl-kpi {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.bl-kpi-val {
  font: 800 28px/1 'IBM Plex Mono', monospace;
  color: var(--ink);
  margin-bottom: 4px;
}
.bl-kpi-val .bl-kpi-unit { font-size: .55em; color: var(--mu2); }
.bl-kpi-streak { grid-column: 1 / -1; }
.bl-kpi-streak .bl-kpi-val { display: inline-flex; align-items: center; gap: 8px; }
.bl-kpi-label { font: 500 11px/1.4 'Inter', sans-serif; color: var(--mu3); text-transform: uppercase; letter-spacing: .04em; }
.bl-kpi-delta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font: 600 11px/1 'Plus Jakarta Sans', sans-serif;
  padding: 3px 7px;
  border-radius: 8px;
  margin-top: 6px;
}
.bl-kpi-delta.up   { background: var(--grp2); color: var(--grk); }
.bl-kpi-delta.down { background: var(--rdp2); color: var(--rdk); }
.bl-kpi-delta.flat { background: var(--bg4); color: var(--mu3); }

/* ── Auto comment ── */
.bl-comment {
  background: linear-gradient(135deg,color-mix(in srgb, var(--a) 6%, transparent),rgba(139,92,246,.06));
  border: 1.5px solid color-mix(in srgb, var(--a) 18%, transparent);
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 16px;
  position: relative;
}
.bl-comment::before {
  content: '"';
  position: absolute;
  top: 10px; left: 18px;
  font: 700 48px/1 Georgia,serif;
  color: color-mix(in srgb, var(--a) 15%, transparent);
  line-height: 1;
}
.bl-comment-label {
  font: 700 11px/1 'Plus Jakarta Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--a);
  margin-bottom: 8px;
}
.bl-comment-txt {
  font: 500 14px/1.6 'Inter', sans-serif;
  color: var(--ink5);
  padding-left: 4px;
}

/* ── Section card ── */
.bl-section {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  padding: 18px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.bl-section-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.bl-section-title {
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 8px;
}
.bl-section-badge {
  font: 700 11px/1 'IBM Plex Mono', monospace;
  padding: 3px 8px;
  border-radius: 8px;
  background: var(--bg4);
  color: var(--mu4);
}

/* ── Comp list ── */
.bl-comp-list { display: flex; flex-direction: column; gap: 6px; }
.bl-comp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--bg);
}
.bl-comp-check {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--grp2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--grk);
  font-size: 11px;
}
.bl-comp-name { font: 500 13px/1.3 'Inter', sans-serif; color: var(--ink5); flex: 1; min-width: 0; }
.bl-comp-date { font: 500 11px/1 'IBM Plex Mono', monospace; color: var(--mu2); flex-shrink: 0; }
.bl-comp-none { font: 500 13px/1.4 'Inter',sans-serif; color: var(--mu2); text-align: center; padding: 12px 0; }

/* ── Evolution chart ── */
.bl-chart { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
.bl-bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
.bl-bar {
  width: 100%;
  background: linear-gradient(180deg, var(--a), var(--adk));
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height .3s cubic-bezier(.23,1,.32,1);
}
.bl-bar-lbl { font: 500 9px/1 'Inter', sans-serif; color: var(--mu2); text-align: center; white-space: nowrap; }
.bl-bar-val { font: 600 10px/1 'IBM Plex Mono', monospace; color: var(--mu3); }

/* ── No data ── */
.bl-no-data {
  text-align: center;
  padding: 40px 20px;
  color: var(--mu2);
  font: 500 14px/1.5 'Inter', sans-serif;
}

/* ────────────────────────────── PRINT ──────────────────────────── */
@media print {
  body { background: #fff !important; }

  /* Hide non-content elements */
  .bl-print-btn,
  nav, [role="navigation"],
  .fab, .toast-container,
  .acc, .vp, .me-page { display: none !important; }

  .bl {
    padding: 0 !important;
    max-width: 100% !important;
    background: #fff !important;
  }

  .bl-kpi { box-shadow: none; border-color: #ccc; }
  .bl-section { box-shadow: none; border-color: #ccc; break-inside: avoid; }
  .bl-comment { border-color: #ccc; }

  /* KPI 2×2 dans la même ligne */
  .bl-kpi-grid { grid-template-columns: repeat(4,1fr) !important; }

  /* Ensure all comp rows show in print */
  .bl-comp-list { display: block !important; }
  .bl-comp-row { page-break-inside: avoid; }
}
</style>`;

// ─── Monde metadata ──────────────────────────────────────────────
const MONDES = {
  C1: {
    name: "Contrôle & Sécurité",
    color: "var(--gr2)",
    ico: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--gr2);vertical-align:middle"></span>',
    short: "C1",
  },
  C2: {
    name: "Manœuvres",
    color: "var(--bl2)",
    ico: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--bl2);vertical-align:middle"></span>',
    short: "C2",
  },
  C3: {
    name: "Circulation",
    color: "#eab308",
    ico: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#eab308;vertical-align:middle"></span>',
    short: "C3",
  },
  C4: {
    name: "Situations complexes",
    color: "var(--pul)",
    ico: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--pul);vertical-align:middle"></span>',
    short: "C4",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────
function fmtDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── Render helpers ───────────────────────────────────────────────
function renderKPI(kpi) {
  // Donnée vide ≠ échec : aucun quiz fait → état neutre, pas un 0 % rouge
  // (le bilan est montrable aux parents).
  const noQuiz = !kpi.quiz_total;
  const scoreColor = noQuiz
    ? "var(--mu2)"
    : kpi.score_moyen >= 70
      ? "var(--grk)"
      : kpi.score_moyen >= 50
        ? "#a16207"
        : "var(--rdk)";

  return `
<div class="bl-kpi-grid">
  <div class="bl-kpi">
    <div class="bl-kpi-val">${kpi.acquises_now ?? "—"}<span class="bl-kpi-unit">/31</span></div>
    <div class="bl-kpi-label">Compétences acquises</div>
    <span class="bl-kpi-delta flat">Total acquis</span>
  </div>
  <div class="bl-kpi">
    <div class="bl-kpi-val" style="color:${esc(scoreColor)}">${noQuiz ? "—" : kpi.score_moyen != null ? kpi.score_moyen + "%" : "—"}</div>
    <div class="bl-kpi-label">Score moyen quiz</div>
    <span class="bl-kpi-delta ${!noQuiz && kpi.score_moyen >= 70 ? "up" : "flat"}">${noQuiz ? "Pas encore de quiz" : `${kpi.quiz_reussis ?? 0}/${kpi.quiz_total} réussis`}</span>
  </div>
  <div class="bl-kpi bl-kpi-streak">
    <div class="bl-kpi-val" style="color:var(--or)">${icon("flame", { size: 22, strokeWidth: 2.2, color: "var(--or)" })} ${kpi.jours_actifs ?? "—"}</div>
    <div class="bl-kpi-label">Jours actifs</div>
  </div>
</div>`;
}

function renderByMonde(byMonde) {
  return Object.entries(MONDES)
    .map(([key, m]) => {
      const comps = byMonde[key] ?? [];
      const rows =
        comps.length > 0
          ? comps
              .map(
                (c) => `<div class="bl-comp-row">
  <div class="bl-comp-check" aria-hidden="true">✓</div>
  <div class="bl-comp-name">${esc(c.competence_id)}</div>
  <div class="bl-comp-date">${esc(fmtDateShort(c.validated_at))}</div>
</div>`,
              )
              .join("")
          : `<div class="bl-comp-none">Aucune compétence acquise</div>`;

      return `
<div class="bl-section">
  <div class="bl-section-hd">
    <div class="bl-section-title">
      ${icon(m.ico, { size: 16, strokeWidth: 1.5 })} ${esc(m.name)}
    </div>
    <span class="bl-section-badge">${comps.length} acquise${comps.length > 1 ? "s" : ""}</span>
  </div>
  <div class="bl-comp-list" role="list">${rows}</div>
</div>`;
    })
    .join("");
}

function renderEvolution(evolution) {
  if (!evolution || evolution.length === 0) {
    return `<div class="bl-section">
  <div class="bl-section-hd">
    <div class="bl-section-title">${icon("trending-up", { size: 16 })} Évolution mensuelle</div>
  </div>
  <div class="bl-comp-none">Aucune donnée d'évolution disponible</div>
</div>`;
  }

  const max = Math.max(1, ...evolution.map((e) => e.count));

  const bars = evolution
    .map((e) => {
      const h = Math.max(4, Math.round((e.count / max) * 68));
      return `<div class="bl-bar-col">
  <div class="bl-bar-val">${e.count}</div>
  <div class="bl-bar" style="height:${h}px" role="presentation"></div>
  <div class="bl-bar-lbl">${esc(e.month)}</div>
</div>`;
    })
    .join("");

  return `
<div class="bl-section">
  <div class="bl-section-hd">
    <div class="bl-section-title">${icon("trending-up", { size: 16 })} Évolution mensuelle</div>
  </div>
  <div class="bl-chart" role="img" aria-label="Graphique d'évolution mensuelle">${bars}</div>
</div>`;
}

function renderComment(comment) {
  if (!comment) return "";
  return `
<div class="bl-comment">
  <div class="bl-comment-label">${icon("message-circle", { size: 12 })} Commentaire pédagogique auto-généré</div>
  <div class="bl-comment-txt">${esc(comment)}</div>
</div>`;
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root, eleveId) {
  const me = getCurUser();
  if (!me) return;

  if (!eleveId) {
    root.innerHTML = `<div class="bl"><div class="bl-no-data">Identifiant élève manquant.</div></div>`;
    return;
  }

  track("page.view", { page: "enseignant_bilan", eleve_id: eleveId });

  root.innerHTML = `${STYLE}
<div class="bl">
  <div style="display:flex;flex-direction:column;gap:10px;padding:40px 0">
    ${[160, 80, 120, 120, 120].map((h) => `<div style="height:${h}px;background:linear-gradient(90deg,var(--bg3) 0%,var(--bg5) 50%,var(--bg3) 100%);background-size:200% 100%;animation:blShimmer 1.4s infinite;border-radius:16px"></div>`).join("")}
  </div>
  <style>@keyframes blShimmer{to{background-position:-200% 0}}</style>
</div>`;

  // Document montrable aux parents → en-tête au nom de l'auto-école, pas du produit
  const [bilanRes, ecoleRes] = await Promise.allSettled([
    sb.rpc("get_bilan_data", { p_eleve_id: eleveId }),
    me.auto_ecole_id
      ? sb
          .from("auto_ecoles")
          .select("nom")
          .eq("id", me.auto_ecole_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const { data, error } =
    bilanRes.status === "fulfilled"
      ? bilanRes.value
      : { data: null, error: bilanRes.reason };
  const ecoleNom =
    (ecoleRes.status === "fulfilled" && ecoleRes.value?.data?.nom) || "PermiGo";

  if (error || !data) {
    toast("Impossible de charger le bilan", "error");
    root.innerHTML = `${STYLE}<div class="bl"><div class="bl-no-data">
      <div style="margin-bottom:12px;color:var(--mu)">${icon("clipboard", { size: 30 })}</div>
      Bilan indisponible. Vérifie que cet élève est bien rattaché à ton compte.
    </div></div>`;
    return;
  }

  const { eleve, kpi, by_monde, evolution, comment } = data;
  const prenom = eleve?.prenom ?? "";
  const nom = eleve?.nom ?? "";

  root.innerHTML = `${STYLE}
<div class="bl">

  <!-- HEADER -->
  <div class="bl-hd">
    <div class="bl-hd-left">
      <button class="bl-print-btn" id="bl-btn-back" aria-label="Retour" style="margin-bottom:10px">
        ${icon("arrow-left", { size: 15 })} Retour
      </button>
      <div class="bl-school-logo">${esc(ecoleNom)}</div>
      <h1 class="bl-title" tabindex="-1">Bilan de ${esc(prenom)} ${esc(nom)}</h1>
      <div class="bl-subtitle">Suivi de progression · Permis B</div>
    </div>
    <button class="bl-print-btn" id="bl-btn-print" aria-label="Imprimer le bilan">
      ${icon("printer", { size: 15 })} Imprimer
    </button>
  </div>

  <!-- KPI -->
  ${renderKPI(kpi)}

  <!-- COMMENTAIRE AUTO -->
  ${renderComment(comment)}

  <!-- EVOLUTION -->
  ${renderEvolution(evolution)}

  <!-- PAR MONDE -->
  ${renderByMonde(by_monde ?? {})}

</div>`;

  root.querySelector("#bl-btn-back")?.addEventListener("click", () => {
    navigate(`#/livret/${eleveId}`);
  });

  root.querySelector("#bl-btn-print")?.addEventListener("click", () => {
    track("bilan.print", { eleve_id: eleveId });
    window.print();
  });
}
