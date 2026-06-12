// ═══════════════════════════════════════════════════════════════
// Gérant — Pulse École (light theme)
// 4 KPI ce mois + équipe + activité récente
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { labelComp } from "@/utils/remc-label.js";
import { icon } from "@/utils/icons.js";

// ─── CSS scoped (Tesla × Bloomberg × Airbnb — cockpit gérant) ─────
const STYLE = `<style>
.pulse {
  padding: 0 0 100px;
  max-width: 580px;
  margin: 0 auto;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--ink);
}

/* Header */
.pulse-hd {
  padding: 24px 20px 16px;
  border-bottom: 1px solid var(--bo);
  background: var(--su);
}
.pulse-title {
  font: 700 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -0.022em;
}
.pulse-date {
  font: 500 13px/1 'Inter', sans-serif;
  color: var(--mu2);
  margin-top: 6px;
  text-transform: capitalize;
}

/* KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}
.kpi-card {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-xl);
  padding: 20px;
  box-shadow: var(--s0);
  position: relative;
  overflow: hidden;
  animation: kpiIn .4s ease both;
}
.kpi-card:nth-child(1) { animation-delay: 0ms; }
.kpi-card:nth-child(2) { animation-delay: 60ms; }
.kpi-card:nth-child(3) { animation-delay: 120ms; }
.kpi-card:nth-child(4) { animation-delay: 180ms; }
@keyframes kpiIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.kpi-card::before {
  content: '';
  position: absolute;
  top: -16px; right: -16px;
  width: 64px; height: 64px;
  background: radial-gradient(circle, var(--kc, var(--a)) 0%, transparent 70%);
  opacity: .08;
  pointer-events: none;
}
.kpi-ico {
  font-size: 18px;
  margin-bottom: 12px;
  display: block;
  opacity: .9;
}
.kpi-val {
  font: 700 32px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 6px;
  letter-spacing: -0.025em;
}
.kpi-lbl {
  font: 500 12px/1.4 'Inter', sans-serif;
  color: var(--mu2);
}

/* Sections */
.pulse-sec {
  padding: 0 16px;
  margin-top: 24px;
}
.pulse-sec-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.pulse-sec-title {
  font: 600 11px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--mu2);
}
.pulse-sec-sub {
  font: 500 12px/1 'Inter', sans-serif;
  color: var(--mu2);
}

/* Delta KPI (cockpit) */
.kpi-delta {
  margin-top: 8px;
  font: 700 10px/1 'Inter', sans-serif;
  letter-spacing: .04em;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: 6px;
}
.kpi-delta.up   { color: var(--grdk); background: rgba(16,185,129,.12); }
.kpi-delta.down { color: var(--rdx); background: rgba(239,68,68,.12); }

/* Sparkline activité 7j (Tesla cockpit feel) */
.spark-wrap {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 16px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-lg);
  height: 96px;
  box-shadow: var(--s0);
}
.spark-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: 100%;
}
.spark-bar {
  width: 100%;
  max-width: 28px;
  background: linear-gradient(180deg, var(--a), var(--adk));
  border-radius: 6px 6px 0 0;
  transition: height .6s var(--ease-out);
  box-shadow: 0 -2px 6px color-mix(in srgb, var(--a) 18%, transparent);
}
.spark-bar.today {
  background: linear-gradient(180deg, var(--am), var(--or));
  box-shadow: 0 -2px 8px rgba(245,158,11,.35);
}
.spark-lbl {
  font: 700 10px/1 'Inter', sans-serif;
  color: var(--mu2);
  letter-spacing: .04em;
}

/* Proches examen */
.exam-list { display: flex; flex-direction: column; gap: 8px; }
.exam-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r);
  cursor: pointer;
  transition: border-color .15s, transform .12s;
}
.exam-row:hover { border-color: var(--am); }
.exam-row:active { transform: scale(.98); }
.exam-name {
  font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.exam-prog {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.exam-prog-bar {
  width: 70px;
  height: 6px;
  background: var(--bg2);
  border-radius: var(--r-full);
  overflow: hidden;
}
.exam-prog-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--am), var(--aml2));
  border-radius: var(--r-full);
  transition: width .6s var(--ease-out);
}
.exam-prog-val {
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: var(--amx);
  min-width: 38px;
  text-align: right;
}

/* Team list */
.team-list { display: flex; flex-direction: column; gap: 8px; }
.team-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r);
  box-shadow: var(--s0);
  transition: border-color .15s ease;
}
.team-row:hover { border-color: var(--a); }
.team-av {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 600 14px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  flex-shrink: 0;
  background: var(--a);
}
.team-info { flex: 1; min-width: 0; }
.team-name {
  font: 600 14px/1.3 'Inter', sans-serif;
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.team-sub {
  font: 500 12px/1 'Inter', sans-serif;
  color: var(--mu2);
  margin-top: 4px;
}
.team-badge {
  font: 600 12px/1 'Inter', sans-serif;
  color: var(--a);
  background: color-mix(in srgb, var(--a) 10%, transparent);
  border-radius: var(--r-full);
  padding: 6px 12px;
  white-space: nowrap;
}

/* Activite recente */
.activity-list { display: flex; flex-direction: column; gap: 8px; }
.activity-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r);
  box-shadow: var(--s0);
}
.activity-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--gr);
  flex-shrink: 0;
  margin-top: 6px;
}
.activity-body { flex: 1; min-width: 0; }
.activity-line {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--ink);
}
.activity-line strong { font-weight: 600; color: var(--ink); }
.activity-meta {
  font: 500 12px/1 'Inter', sans-serif;
  color: var(--mu2);
  margin-top: 4px;
}

/* Skeleton */
.skel-block {
  background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
  background-size: 200% 100%;
  animation: shimmerP 1.4s ease-in-out infinite;
  border-radius: var(--r);
}
@keyframes shimmerP { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* Empty state */
.pulse-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--mu2);
  font: 500 13px/1.5 'Inter', sans-serif;
  background: var(--su);
  border: 1px dashed var(--bo);
  border-radius: var(--r);
}

/* ─── Tendance 30j (Bloomberg style multi-séries) ─── */
.trend-card {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-lg);
  padding: 16px 16px 12px;
  box-shadow: var(--s0);
}
.trend-legend {
  display: flex; gap: 14px; flex-wrap: wrap;
  margin-bottom: 14px;
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .02em;
}
.trend-lg-item { display: inline-flex; align-items: center; gap: 6px; color: var(--mu4); }
.trend-lg-dot {
  width: 8px; height: 8px; border-radius: 50%;
  display: inline-block;
}
.trend-svg-wrap { position: relative; width: 100%; height: 120px; }
.trend-svg { display: block; width: 100%; height: 100%; }
.trend-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.trend-line.validations  { stroke: var(--a); }
.trend-line.quiz         { stroke: var(--pu); }
.trend-line.sessions     { stroke: var(--am); }
.trend-area              { opacity: .08; }
.trend-area.validations  { fill: var(--a); }
.trend-area.quiz         { fill: var(--pu); }
.trend-area.sessions     { fill: var(--am); }
.trend-axis-y {
  font: 500 9px/1 'IBM Plex Mono', 'Menlo', monospace;
  fill: var(--mu2);
}
.trend-axis-x {
  font: 500 9px/1 'Inter', sans-serif;
  fill: var(--mu2);
}
.trend-grid {
  stroke: var(--bo);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}
.trend-empty {
  text-align: center; padding: 28px 12px;
  font: 500 12px/1.5 "Inter", sans-serif;
  color: var(--mu2);
}

/* ─── Heatmap activité annuelle (GitHub-style) ─── */
.heat-card {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-lg);
  padding: 14px 16px 10px;
  box-shadow: var(--s0);
  overflow: hidden;
}
.heat-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
}
.heat-scroll::-webkit-scrollbar { display: none; }
.heat-svg { display: block; }
.heat-month {
  font: 600 9px/1 "Inter", sans-serif;
  fill: var(--mu2);
}
.heat-day {
  font: 600 9px/1 "Inter", sans-serif;
  fill: var(--mu2);
}
.heat-legend {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 8px;
  justify-content: flex-end;
}
.heat-leg-lbl {
  font: 500 10px/1 "Inter", sans-serif;
  color: var(--mu2);
  margin: 0 2px;
}
.heat-leg-dot {
  width: 10px; height: 10px;
  border-radius: 2px;
  display: inline-block;
  flex-shrink: 0;
}
</style>`;

const AVATARS = [
  "linear-gradient(135deg,#5b5bd6,#3a3a8e)",
  "linear-gradient(135deg,var(--blk),#155e75)",
  "linear-gradient(135deg,var(--puk),#4c1d95)",
  "linear-gradient(135deg,#0e7c66,#064e3b)",
  "linear-gradient(135deg,#9333ea,#6b21a8)",
  "linear-gradient(135deg,var(--rdk),#7f1d1d)",
];

// ─── Entry point ─────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== "gerant") return;

  track("page_view", { page: "gerant_pulse", user_role: me.role });

  // Skeleton
  root.innerHTML = `${STYLE}
<div class="pulse anim-slide-up">
  <div class="pulse-hd">
    <div class="pulse-title">Pulse École</div>
    <div class="pulse-date">${todayLabel()}</div>
  </div>
  <div class="kpi-grid">
    ${[80, 90, 80, 90].map((h) => `<div class="skel-block" style="height:${h}px;border-radius:var(--rl)"></div>`).join("")}
  </div>
  <div class="pulse-sec">
    <div class="skel-block" style="height:14px;width:100px;margin-bottom:10px"></div>
    ${[1, 2, 3].map(() => `<div class="skel-block" style="height:56px;margin-bottom:8px"></div>`).join("")}
  </div>
</div>`;

  try {
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const startOfPrevMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    ).toISOString();

    // Seuil "actif" = activité dans les 30 derniers jours
    const sinceActif = new Date(Date.now() - 30 * 86400000).toISOString();
    // Seuil "à risque" = pas d'activité depuis 14j
    const sinceRisque = new Date(Date.now() - 14 * 86400000).toISOString();
    // Sparkline activité 7 jours
    const since7d = new Date(Date.now() - 7 * 86400000).toISOString();

    const [
      elevesRes,
      validMoisRes,
      validPrevMoisRes,
      validations7dRes,
      enseignantsRes,
      quizMoisRes,
      quizPrevMoisRes,
      validationsAcquisRes,
    ] = await Promise.all([
      // KPI 1 — élèves (on récupère aussi last_active_at pour calculer le taux réel)
      sb
        .from("profiles")
        .select("id, prenom, nom, last_active_at")
        .eq("role", "eleve"),
      // KPI 2 — compétences validées ce mois
      sb
        .from("validations")
        .select("id, eleve_id")
        .gte("validated_at", startOfMonth),
      // KPI 2 bis — compétences validées mois précédent (pour delta)
      sb
        .from("validations")
        .select("id")
        .gte("validated_at", startOfPrevMonth)
        .lt("validated_at", startOfMonth),
      // Sparkline — validations 7 derniers jours
      sb
        .from("validations")
        .select("validated_at")
        .gte("validated_at", since7d),
      // KPI 3 — enseignants actifs
      sb.from("profiles").select("id, prenom, nom").eq("role", "enseignant"),
      // KPI 4 — quiz réussis ce mois (score >= 60)
      sb
        .from("quiz_attempts")
        .select("id")
        .gte("score", 60)
        .gte("completed_at", startOfMonth),
      // KPI 4 bis — quiz mois précédent (pour delta)
      sb
        .from("quiz_attempts")
        .select("id")
        .gte("score", 60)
        .gte("completed_at", startOfPrevMonth)
        .lt("completed_at", startOfMonth),
      // Élèves proches de l'examen — toutes validations acquises agrégées
      sb.from("validations").select("eleve_id").eq("statut", "acquis"),
    ]);

    const elevesAll = elevesRes.data || [];
    const elevesTotal = elevesAll.length;
    // Élèves actifs = activité dans les 30j OU validation ce mois
    const idsValidsCeMois = new Set(
      (validMoisRes.data || []).map((v) => v.eleve_id).filter(Boolean),
    );
    const elevesActifs = elevesAll.filter(
      (e) =>
        (e.last_active_at && e.last_active_at >= sinceActif) ||
        idsValidsCeMois.has(e.id),
    ).length;
    // Élèves à risque (inactifs > 14j)
    const elevesARisque = elevesAll.filter(
      (e) =>
        !e.last_active_at ||
        (e.last_active_at < sinceRisque && !idsValidsCeMois.has(e.id)),
    ).length;

    const compValidees = validMoisRes.data?.length ?? 0;
    const compValideesPrev = validPrevMoisRes.data?.length ?? 0;
    const enseignants = enseignantsRes.data || [];
    const quizReussis = quizMoisRes.data?.length ?? 0;
    const quizReussisPrev = quizPrevMoisRes.data?.length ?? 0;

    // ─── Sparkline 7 derniers jours ─────────────────────────────────
    const spark7d = build7dSparkline(validations7dRes.data || []);

    // ─── Tendance 30 jours (depuis school_daily_snapshot) ───────────
    let trend30d = [];
    try {
      const { data: trendData } = await sb.rpc("get_school_trend", {
        p_days: 30,
      });
      trend30d = Array.isArray(trendData) ? trendData : [];
    } catch (e) {
      console.warn("[pulse] trend30d unavailable", e);
    }

    // ─── Heatmap activité annuelle ───────────────────────────────────
    let heatmapData = null;
    try {
      const since1y = new Date(Date.now() - 365 * 86400000).toISOString();
      const { data: yearVals } = await sb
        .from("validations")
        .select("validated_at")
        .gte("validated_at", since1y);
      heatmapData = buildYearHeatmap(yearVals || []);
    } catch (e) {
      console.warn("[pulse] heatmap unavailable", e);
    }

    // ─── Élèves proches de l'examen (≥ 28 compétences acquises sur 31) ──
    const compsByEleve = {};
    (validationsAcquisRes.data || []).forEach((v) => {
      if (!v.eleve_id) return;
      compsByEleve[v.eleve_id] = (compsByEleve[v.eleve_id] || 0) + 1;
    });
    const elevesProchesExam = elevesAll
      .map((e) => ({ ...e, acquis: compsByEleve[e.id] || 0 }))
      .filter((e) => e.acquis >= 28)
      .sort((a, b) => b.acquis - a.acquis)
      .slice(0, 5);

    // Stats validations ce mois par enseignant
    let teacherValMap = {};
    let teacherElevesMap = {};
    if (enseignants.length > 0) {
      const { data: tvData, error: tvErr } = await sb
        .from("validations")
        .select("validated_by, eleve_id")
        .gte("validated_at", startOfMonth)
        .not("validated_by", "is", null);

      if (!tvErr) {
        (tvData || []).forEach((v) => {
          if (!v.validated_by) return;
          teacherValMap[v.validated_by] =
            (teacherValMap[v.validated_by] || 0) + 1;
          if (!teacherElevesMap[v.validated_by])
            teacherElevesMap[v.validated_by] = new Set();
          if (v.eleve_id) teacherElevesMap[v.validated_by].add(v.eleve_id);
        });
      }
    }

    // Activite recente : 5 dernieres validations
    const { data: recentVals, error: rvErr } = await sb
      .from("validations")
      .select("id, eleve_id, competence_id, validated_by, validated_at")
      .order("validated_at", { ascending: false })
      .limit(5);

    // Enrichissement : noms eleves + enseignants pour l'activite
    let eleveNames = {};
    let enseignantNames = {};
    if (!rvErr && recentVals?.length > 0) {
      const eleveIds = [
        ...new Set(recentVals.map((v) => v.eleve_id).filter(Boolean)),
      ];
      const ensIds = [
        ...new Set(recentVals.map((v) => v.validated_by).filter(Boolean)),
      ];

      const [eRes, enRes] = await Promise.all([
        eleveIds.length > 0
          ? sb.from("profiles").select("id, prenom, nom").in("id", eleveIds)
          : Promise.resolve({ data: [] }),
        ensIds.length > 0
          ? sb.from("profiles").select("id, prenom, nom").in("id", ensIds)
          : Promise.resolve({ data: [] }),
      ]);
      (eRes.data || []).forEach((p) => {
        eleveNames[p.id] = p.prenom || p.nom || "—";
      });
      (enRes.data || []).forEach((p) => {
        enseignantNames[p.id] = p.prenom || p.nom || "—";
      });
    }

    root.innerHTML = render({
      elevesTotal,
      elevesActifs,
      elevesARisque,
      compValidees,
      compValideesPrev,
      enseignants: enseignants.length,
      quizReussis,
      quizReussisPrev,
      spark7d,
      trend30d,
      heatmapData,
      elevesProchesExam,
      teachers: enseignants,
      teacherValMap,
      teacherElevesMap,
      recentVals: recentVals || [],
      eleveNames,
      enseignantNames,
    });

    // Wire — proches examen → livret REMC
    root.querySelectorAll(".exam-row[data-eleve-id]").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.dataset.eleveId;
        if (id) {
          track("pulse.exam_row_click", { eleve_id: id });
          location.hash = `#/livret/${id}`;
        }
      });
    });
  } catch (e) {
    console.error("[pulse]", e);
    toast("Erreur de chargement", "error");
    root.innerHTML = `${STYLE}<div class="pulse"><p style="padding:32px;color:var(--rd)">Erreur de chargement du dashboard.</p></div>`;
  }
}

// ─── Render ──────────────────────────────────────────────────
function render({
  elevesTotal,
  elevesActifs = 0,
  elevesARisque = 0,
  compValidees,
  compValideesPrev = 0,
  enseignants,
  quizReussis,
  quizReussisPrev = 0,
  spark7d = { values: [], total: 0, max: 1 },
  trend30d = [],
  heatmapData = null,
  elevesProchesExam = [],
  teachers,
  teacherValMap,
  teacherElevesMap,
  recentVals,
  eleveNames,
  enseignantNames,
}) {
  const monthLabel = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const compDelta = deltaPct(compValidees, compValideesPrev);
  const quizDelta = deltaPct(quizReussis, quizReussisPrev);

  return `${STYLE}
<div class="pulse anim-slide-up">
  <div class="pulse-hd">
    <div class="pulse-title">Pulse École</div>
    <div class="pulse-date">${todayLabel()}</div>
  </div>

  ${
    elevesARisque > 0
      ? `
    <div style="margin:12px 16px 0;padding:14px 16px;background:linear-gradient(135deg,#fef9e7,#fffbeb);border:1px solid var(--aml);border-radius:var(--r-md);display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--am);color:#fff;display:grid;place-items:center;flex-shrink:0">${icon("alert-circle", { size: 18 }) || "⚠️"}</div>
      <div style="flex:1">
        <div style="font:800 13px/1.2 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:2px">${elevesARisque} élève${elevesARisque > 1 ? "s" : ""} à relancer</div>
        <div style="font:500 12px/1.4 'Inter',sans-serif;color:var(--mu3)">Pas d'activité depuis 14 jours ou plus.</div>
      </div>
      <a href="#/eleves" style="font:700 11px/1 'Inter',sans-serif;color:var(--amx);text-decoration:none;padding:17px 12px;margin:-9px 0;background:rgba(245,158,11,.15);border-radius:var(--r-sm);white-space:nowrap">Voir</a>
    </div>
  `
      : ""
  }

  <div class="kpi-grid">
    <div class="kpi-card" style="--kc:var(--a)">
      <span class="kpi-ico" style="color:var(--a)">${icon("users", { size: 22 })}</span>
      <div class="kpi-val">${elevesActifs}<span style="font-size:.5em;color:var(--mu2);font-weight:600">/${elevesTotal}</span></div>
      <div class="kpi-lbl">Élèves actifs<br><span style="font-size:.7em;color:var(--mu2)">(30 derniers jours)</span></div>
    </div>
    <div class="kpi-card" style="--kc:var(--gr)">
      <span class="kpi-ico" style="color:var(--gr)">${icon("check-circle", { size: 22 })}</span>
      <div class="kpi-val">${compValidees}</div>
      <div class="kpi-lbl">Compétences validées<br>${esc(monthLabel)}</div>
      ${
        compValideesPrev > 0 || compValidees > 0
          ? `
        <div class="kpi-delta ${compDelta >= 0 ? "up" : "down"}">
          ${compDelta >= 0 ? "▲" : "▼"} ${Math.abs(compDelta)}% vs mois -1
        </div>
      `
          : ""
      }
    </div>
    <div class="kpi-card" style="--kc:var(--pu)">
      <span class="kpi-ico" style="color:var(--pu)">${icon("book", { size: 22 })}</span>
      <div class="kpi-val">${enseignants}</div>
      <div class="kpi-lbl">Enseignants actifs</div>
    </div>
    <div class="kpi-card" style="--kc:var(--am)">
      <span class="kpi-ico" style="color:var(--am)">${icon("target", { size: 22 })}</span>
      <div class="kpi-val">${quizReussis}</div>
      <div class="kpi-lbl">Quiz réussis<br>${esc(monthLabel)}</div>
      ${
        quizReussisPrev > 0 || quizReussis > 0
          ? `
        <div class="kpi-delta ${quizDelta >= 0 ? "up" : "down"}">
          ${quizDelta >= 0 ? "▲" : "▼"} ${Math.abs(quizDelta)}% vs mois -1
        </div>
      `
          : ""
      }
    </div>
  </div>

  <!-- SPARKLINE 7 derniers jours -->
  <div class="pulse-sec">
    <div class="pulse-sec-hd">
      <span class="pulse-sec-title">Activité 7 jours</span>
      <span class="pulse-sec-sub">${spark7d.total} validation${spark7d.total > 1 ? "s" : ""}</span>
    </div>
    <div class="spark-wrap">
      ${spark7d.values
        .map((v, i) => {
          const h = Math.max(4, Math.round((v / spark7d.max) * 56));
          const isToday = i === spark7d.values.length - 1;
          const dayLabel = ["L", "M", "M", "J", "V", "S", "D"];
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const idx = (d.getDay() + 6) % 7;
          return `
          <div class="spark-col" title="${v} validation${v > 1 ? "s" : ""} le ${d.toLocaleDateString("fr-FR")}">
            <div class="spark-bar ${isToday ? "today" : ""}" style="height:${h}px"></div>
            <div class="spark-lbl">${dayLabel[idx]}</div>
          </div>`;
        })
        .join("")}
    </div>
  </div>

  ${heatmapData ? renderHeatmap(heatmapData) : ""}

  ${renderTrend30d(trend30d)}

  ${
    elevesProchesExam.length > 0
      ? `
    <!-- PROCHES EXAMEN -->
    <div class="pulse-sec">
      <div class="pulse-sec-hd">
        <span class="pulse-sec-title">Proches de l'examen</span>
        <span class="pulse-sec-sub">${elevesProchesExam.length} élève${elevesProchesExam.length > 1 ? "s" : ""}</span>
      </div>
      <div class="exam-list">
        ${elevesProchesExam
          .map((e) => {
            const fullName = esc(e.prenom || e.nom || "—");
            const pct = Math.round((e.acquis / 31) * 100);
            return `
          <div class="exam-row" data-eleve-id="${esc(e.id)}">
            <div class="exam-name">${fullName}</div>
            <div class="exam-prog">
              <div class="exam-prog-bar"><div class="exam-prog-fill" style="width:${pct}%"></div></div>
              <span class="exam-prog-val">${e.acquis}/31</span>
            </div>
          </div>`;
          })
          .join("")}
      </div>
    </div>
  `
      : ""
  }

  <!-- EQUIPE -->
  <div class="pulse-sec">
    <div class="pulse-sec-hd">
      <span class="pulse-sec-title">Équipe</span>
      <span class="pulse-sec-sub">${teachers.length} enseignant${teachers.length > 1 ? "s" : ""}</span>
    </div>
    <div class="team-list">
      ${
        teachers.length === 0
          ? `<div class="pulse-empty">Aucun enseignant enregistré</div>`
          : teachers
              .map((t, i) => {
                const initials = initials2(t.prenom, t.nom);
                const gradient = AVATARS[i % AVATARS.length];
                const valCount = teacherValMap[t.id] || 0;
                const eleveCount = teacherElevesMap[t.id]?.size || 0;
                return `
              <div class="team-row">
                <div class="team-av" style="background:${gradient}">${esc(initials)}</div>
                <div class="team-info">
                  <div class="team-name">${esc(t.nom || t.prenom || "—")}</div>
                  <div class="team-sub">${eleveCount} élève${eleveCount > 1 ? "s" : ""} ce mois</div>
                </div>
                <div class="team-badge">${valCount} valid.</div>
              </div>`;
              })
              .join("")
      }
    </div>
  </div>

  <!-- ACTIVITE RECENTE -->
  <div class="pulse-sec" style="margin-bottom:0">
    <div class="pulse-sec-hd">
      <span class="pulse-sec-title">Activité récente</span>
      <span class="pulse-sec-sub">5 dernières validations</span>
    </div>
    <div class="activity-list">
      ${
        recentVals.length === 0
          ? `<div class="pulse-empty">Aucune validation enregistrée</div>`
          : recentVals
              .map((v) => {
                const eleveName = eleveNames[v.eleve_id] || "—";
                const ensName = enseignantNames[v.validated_by] || "—";
                const compNom = v.competence_id
                  ? labelComp(v.competence_id)
                  : "—";
                const compId = v.competence_id || "";
                const timeStr = v.validated_at
                  ? relativeTime(v.validated_at)
                  : "—";
                return `
              <div class="activity-row">
                <div class="activity-dot"></div>
                <div class="activity-body">
                  <div class="activity-line">
                    <strong>${esc(eleveName)}</strong> · ${esc(compNom)}
                  </div>
                  <div class="activity-meta">${esc(compId)} · par ${esc(ensName)} · ${esc(timeStr)}</div>
                </div>
              </div>`;
              })
              .join("")
      }
    </div>
  </div>
</div>`;
}

// ─── Tendance 30 jours (Bloomberg multi-series line chart) ───
/**
 * Rendu d'un mini line-chart SVG avec 3 séries : validations, quiz, sessions_h.
 * Trend = SETOF school_daily_snapshot (asc by snapshot_date).
 */
function renderTrend30d(trend) {
  if (!Array.isArray(trend) || trend.length < 2) {
    return `
      <div class="pulse-sec">
        <div class="pulse-sec-hd">
          <span class="pulse-sec-title">Tendance 30 jours</span>
          <span class="pulse-sec-sub">en construction</span>
        </div>
        <div class="trend-card">
          <div class="trend-empty">Les données se construisent automatiquement chaque nuit.<br/>Reviens dans quelques jours.</div>
        </div>
      </div>`;
  }

  const W = 320; // viewBox width
  const H = 120; // viewBox height
  const PAD_L = 28;
  const PAD_R = 8;
  const PAD_T = 8;
  const PAD_B = 18;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  // Extract series
  const valsValidations = trend.map((t) => Number(t.validations_24h) || 0);
  const valsQuiz = trend.map((t) => Number(t.quiz_24h) || 0);
  const valsSessions = trend.map((t) => Number(t.sessions_h_24h) || 0);

  // Scale Y commun : on prend le max global (validations + quiz comparables, sessions_h plus petit)
  // On scale les sessions × 5 pour les rendre visibles à la même échelle (heuristique)
  const sessionScale = 5;
  const allMax = Math.max(
    1,
    ...valsValidations,
    ...valsQuiz,
    ...valsSessions.map((v) => v * sessionScale),
  );

  const n = trend.length;
  const xAt = (i) => PAD_L + (innerW * i) / (n - 1);
  const yAt = (v) => PAD_T + innerH - innerH * (v / allMax);

  const buildPath = (values, scale = 1) => {
    return values
      .map((v, i) => {
        const x = xAt(i);
        const y = yAt(v * scale);
        return (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      })
      .join(" ");
  };

  const buildArea = (values, scale = 1) => {
    const top = values
      .map((v, i) => {
        const x = xAt(i);
        const y = yAt(v * scale);
        return (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      })
      .join(" ");
    const bottomY = PAD_T + innerH;
    return `${top} L${xAt(n - 1).toFixed(1)} ${bottomY} L${xAt(0).toFixed(1)} ${bottomY} Z`;
  };

  // Gridlines : 4 horizontal
  const gridY = [0.25, 0.5, 0.75, 1].map((r) => PAD_T + innerH * (1 - r));

  // X labels : 4 dates espacées
  const xLabels = [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1].map(
    (i) => {
      const d = new Date(trend[i].snapshot_date);
      return {
        x: xAt(i),
        label: d.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
      };
    },
  );

  // Totaux pour la légende
  const totalVal = valsValidations.reduce((s, v) => s + v, 0);
  const totalQuiz = valsQuiz.reduce((s, v) => s + v, 0);
  const totalSessions =
    Math.round(valsSessions.reduce((s, v) => s + v, 0) * 10) / 10;

  return `
  <div class="pulse-sec">
    <div class="pulse-sec-hd">
      <span class="pulse-sec-title">Tendance 30 jours</span>
      <span class="pulse-sec-sub">${n} jour${n > 1 ? "s" : ""}</span>
    </div>
    <div class="trend-card">
      <div class="trend-legend">
        <span class="trend-lg-item"><span class="trend-lg-dot" style="background:var(--a)"></span>${totalVal} validations</span>
        <span class="trend-lg-item"><span class="trend-lg-dot" style="background:var(--pu)"></span>${totalQuiz} quiz</span>
        <span class="trend-lg-item"><span class="trend-lg-dot" style="background:var(--am)"></span>${totalSessions}h sessions</span>
      </div>
      <div class="trend-svg-wrap">
        <svg class="trend-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Tendance 30 jours">
          <!-- gridlines -->
          ${gridY.map((y) => `<line class="trend-grid" x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}"/>`).join("")}

          <!-- areas (fill légères) -->
          <path class="trend-area validations" d="${buildArea(valsValidations)}"/>
          <path class="trend-area quiz"        d="${buildArea(valsQuiz)}"/>
          <path class="trend-area sessions"    d="${buildArea(valsSessions, sessionScale)}"/>

          <!-- lines -->
          <path class="trend-line sessions"    d="${buildPath(valsSessions, sessionScale)}"/>
          <path class="trend-line quiz"        d="${buildPath(valsQuiz)}"/>
          <path class="trend-line validations" d="${buildPath(valsValidations)}"/>

          <!-- Y axis label (max) -->
          <text class="trend-axis-y" x="${PAD_L - 4}" y="${PAD_T + 4}" text-anchor="end">${Math.round(allMax)}</text>
          <text class="trend-axis-y" x="${PAD_L - 4}" y="${PAD_T + innerH}" text-anchor="end">0</text>

          <!-- X labels -->
          ${xLabels.map((l) => `<text class="trend-axis-x" x="${l.x}" y="${H - 4}" text-anchor="middle">${esc(l.label)}</text>`).join("")}
        </svg>
      </div>
    </div>
  </div>`;
}

// ─── Sparkline 7 derniers jours ──────────────────────────────
/**
 * Compte les validations par jour sur les 7 derniers jours et renvoie
 * { values: [n6, n5, ..., n0], total, max }.
 * `n0` = aujourd'hui, `n6` = il y a 6 jours.
 */
function build7dSparkline(validationRows) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return { ts: d.getTime(), count: 0 };
  });

  validationRows.forEach((v) => {
    if (!v.validated_at) return;
    const d = new Date(v.validated_at);
    d.setHours(0, 0, 0, 0);
    const ts = d.getTime();
    const day = days.find((x) => x.ts === ts);
    if (day) day.count++;
  });

  const values = days.map((d) => d.count);
  const total = values.reduce((s, v) => s + v, 0);
  const max = Math.max(1, ...values);
  return { values, total, max };
}

/** Calcule un delta % entre une valeur courante et une référence. */
function deltaPct(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Helpers ─────────────────────────────────────────────────
function todayLabel() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function initials2(prenom, nom) {
  const p = (prenom || "").trim()[0] || "";
  const parts = (nom || "")
    .trim()
    .replace(/\./g, "")
    .split(/\s+/)
    .filter(Boolean);
  const n = parts.length
    ? parts[parts.length - 1][0] || ""
    : (prenom || "").trim()[1] || "";
  return (p + n).toUpperCase() || "?";
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

// ─── Heatmap activité annuelle ────────────────────────────────
function buildYearHeatmap(rows) {
  const countByDay = {};
  rows.forEach((v) => {
    if (!v.validated_at) return;
    const key = v.validated_at.slice(0, 10);
    countByDay[key] = (countByDay[key] || 0) + 1;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Début = 52 semaines en arrière, aligné sur lundi
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  const dow = (start.getDay() + 6) % 7; // 0=lundi
  start.setDate(start.getDate() - dow);

  const days = [];
  const d = new Date(start);
  while (d <= today) {
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: countByDay[key] || 0 });
    d.setDate(d.getDate() + 1);
  }
  // Compléter à semaine entière
  while (days.length % 7 !== 0) days.push({ date: null, count: 0 });

  const total = rows.length;
  const max = Math.max(1, ...Object.values(countByDay));
  return { days, total, max };
}

function renderHeatmap({ days, total }) {
  const CELL = 10;
  const GAP = 2;
  const STEP = CELL + GAP;
  const DAY_LBL_W = 20;
  const MONTH_H = 16;
  const MONTHS_FR = [
    "jan",
    "fév",
    "mar",
    "avr",
    "mai",
    "juin",
    "juil",
    "août",
    "sep",
    "oct",
    "nov",
    "déc",
  ];
  const COLOR = [
    "var(--bg2)",
    "color-mix(in srgb, var(--a) 28%, transparent)",
    "color-mix(in srgb, var(--a) 52%, transparent)",
    "color-mix(in srgb, var(--a) 76%, transparent)",
    "var(--a)",
  ];

  function cellColor(n) {
    if (n === 0) return COLOR[0];
    if (n <= 2) return COLOR[1];
    if (n <= 5) return COLOR[2];
    if (n <= 9) return COLOR[3];
    return COLOR[4];
  }

  const weeks = Math.ceil(days.length / 7);
  const svgW = DAY_LBL_W + weeks * STEP - GAP;
  const svgH = MONTH_H + 7 * STEP - GAP;

  let cells = "";
  for (let w = 0; w < weeks; w++) {
    for (let dow = 0; dow < 7; dow++) {
      const idx = w * 7 + dow;
      if (idx >= days.length) continue;
      const { date, count } = days[idx];
      if (!date) continue;
      const x = DAY_LBL_W + w * STEP;
      const y = MONTH_H + dow * STEP;
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${cellColor(count)}"><title>${esc(date)}: ${count} validation${count !== 1 ? "s" : ""}</title></rect>`;
    }
  }

  let monthLabels = "";
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const day = days[w * 7];
    if (!day?.date) continue;
    const month = parseInt(day.date.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      lastMonth = month;
      const x = DAY_LBL_W + w * STEP;
      monthLabels += `<text x="${x}" y="${MONTH_H - 4}" class="heat-month">${MONTHS_FR[month]}</text>`;
    }
  }

  // Étiquettes jours : L, M, V (lignes 0, 2, 4 = lundi, mercredi, vendredi)
  const dayLabels = [
    [0, "L"],
    [2, "M"],
    [4, "V"],
  ]
    .map(([dow, lbl]) => {
      const y = MONTH_H + dow * STEP + CELL - 1;
      return `<text x="${DAY_LBL_W - 3}" y="${y}" class="heat-day" text-anchor="end">${lbl}</text>`;
    })
    .join("");

  return `
  <div class="pulse-sec">
    <div class="pulse-sec-hd">
      <span class="pulse-sec-title">Activité annuelle</span>
      <span class="pulse-sec-sub">${total} validation${total !== 1 ? "s" : ""} sur 52 semaines</span>
    </div>
    <div class="heat-card">
      <div class="heat-scroll">
        <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" aria-label="Heatmap activité annuelle" role="img">
          ${dayLabels}
          ${monthLabels}
          ${cells}
        </svg>
      </div>
      <div class="heat-legend">
        <span class="heat-leg-lbl">Moins</span>
        ${COLOR.map((c) => `<span class="heat-leg-dot" style="background:${c}"></span>`).join("")}
        <span class="heat-leg-lbl">Plus</span>
      </div>
    </div>
  </div>`;
}
