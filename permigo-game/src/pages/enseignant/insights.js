// ═══════════════════════════════════════════════════════════════
// Enseignant — Insights
// KPI perso + heatmap + top élèves + difficulté comps + reco IA
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC } from "@/data/remc.js";
import { labelComp } from "@/utils/remc-label.js";
import { icon } from "@/utils/icons.js";
import { renderUserAvatar } from "@/components/common/avatar.js";

// ─── Constantes ───────────────────────────────────────────────
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
  .ins-page {
    padding: 20px 16px 100px;
    max-width: 600px;
    margin: 0 auto;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--ink);
  }

  /* Header */
  .ins-hd { margin-bottom: 24px; }
  .ins-h1 {
    /* Titre de page moniteur unifié : 24px / 700 / -.02em (cf. mes-eleves, bilan) */
    font: 700 24px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -.02em;
  }
  .ins-sub {
    font: 500 13px/1 'Inter', sans-serif;
    color: var(--mu2);
    margin: 0;
  }

  /* Section title */
  .ins-section-title {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--mu2);
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ins-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--bo);
  }
  .ins-section { margin-bottom: 28px; }

  /* KPI widgets 2×2 */
  .ins-widgets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 28px;
  }
  .ins-widget {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--rx);
    padding: 18px;
    box-shadow: var(--s1);
    animation: insWidgetIn .45s var(--ease-snap) both;
  }
  .ins-widget:nth-child(1) { animation-delay: .04s; }
  .ins-widget:nth-child(2) { animation-delay: .10s; }
  .ins-widget:nth-child(3) { animation-delay: .16s; }
  .ins-widget:nth-child(4) { animation-delay: .22s; }
  @keyframes insWidgetIn {
    from { opacity: 0; transform: translateY(8px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ins-widget { animation: none; }
  }
  .ins-widget-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .ins-widget-lbl {
    font: 600 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    text-transform: uppercase;
    letter-spacing: .07em;
  }
  .ins-widget-val {
    font: 700 30px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -.025em;
    margin: 0;
  }
  .ins-widget-sub {
    font: 500 11px/1.3 'Inter', sans-serif;
    color: var(--mu);
    margin-top: 4px;
  }
  /* Carte quiz sans donnée : nudge actionnable au lieu d'un « — » mort */
  .ins-widget-empty { background: color-mix(in srgb, var(--pu) 5%, var(--su)); }
  .ins-widget-nudge {
    font: 500 12px/1.4 'Inter', sans-serif;
    color: var(--mu);
    margin: 8px 0 0;
  }
  .ins-widget-delta {
    font: 700 12px/1 'IBM Plex Mono', monospace;
    margin-top: 5px;
  }
  .ins-widget-delta.up   { color: var(--gr-txt); }
  .ins-widget-delta.down { color: var(--rd-txt); }
  .ins-widget-delta.flat { color: var(--mu2); }

  /* ── Métrique vedette (star) + 3 secondaires ── */
  .ins-star {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--rx);
    padding: 20px;
    box-shadow: var(--s1);
    margin-bottom: 10px;
    animation: insWidgetIn .45s var(--ease-snap) both;
  }
  .ins-star-top { display: flex; align-items: flex-start; gap: 16px; }
  .ins-star-num {
    font: 800 clamp(40px, 13vw, 52px)/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); letter-spacing: -.04em; flex-shrink: 0;
  }
  .ins-star-meta { padding-top: 4px; min-width: 0; }
  .ins-star-lbl {
    font: 700 13px/1.2 'Inter', sans-serif; color: var(--ink);
    text-transform: uppercase; letter-spacing: .06em;
  }
  .ins-star-sub { font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }
  .ins-star-spark { height: 44px; margin-top: 14px; }
  .ins-spark-svg { width: 100%; height: 100%; display: block; overflow: visible; }

  .ins-sec {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
    margin-bottom: 28px;
  }
  .ins-sec-card {
    background: var(--su); border: 1px solid var(--bo);
    border-radius: var(--rx); padding: 14px;
    box-shadow: var(--s0);
    animation: insWidgetIn .45s var(--ease-snap) both;
  }
  .ins-sec-card:nth-child(1) { animation-delay: .06s; }
  .ins-sec-card:nth-child(2) { animation-delay: .12s; }
  .ins-sec-card:nth-child(3) { animation-delay: .18s; }
  .ins-sec-val {
    font: 800 24px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink);
    letter-spacing: -.03em; display: flex; align-items: center; gap: 5px;
  }
  .ins-sec-val svg { flex-shrink: 0; }
  .ins-sec-lbl {
    font: 600 10.5px/1.2 'Inter', sans-serif; color: var(--mu2);
    text-transform: uppercase; letter-spacing: .05em; margin-top: 6px;
  }

  /* Bar chart activité par jour */
  .ins-chart-wrap {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--r-xl);
    padding: 16px 14px 14px;
    box-shadow: var(--s0);
  }
  .ins-chart-bars {
    display: flex;
    align-items: stretch;
    gap: 6px;
    height: 88px;
  }
  .ins-chart-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
  }
  .ins-chart-val {
    font: 600 10px/1 'IBM Plex Mono', monospace;
    color: var(--mu2);
    min-height: 12px;
    text-align: center;
  }
  .ins-chart-bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    background: color-mix(in srgb, var(--a) 22%, transparent);
  }
  .ins-chart-col--peak .ins-chart-bar {
    background: var(--a);
    box-shadow: 0 4px 10px -2px color-mix(in srgb, var(--a) 35%, transparent);
  }
  .ins-chart-col--peak .ins-chart-val { color: var(--adk); font-weight: 700; }
  .ins-chart-lbl {
    font: 500 10px/1 'Inter', sans-serif;
    color: var(--mu2);
    text-align: center;
  }
  .ins-chart-col--peak .ins-chart-lbl { color: var(--ink); font-weight: 600; }
  .ins-chart-divider { height: 1px; background: var(--bo2); margin: 0 0 8px; }
  .ins-chart-peak-note {
    font: 500 11px/1.3 'Inter', sans-serif;
    color: var(--mu2);
    text-align: center;
    margin: 0;
  }
  .ins-chart-empty {
    padding: 24px 0;
    text-align: center;
    font: 500 13px/1.5 'Inter', sans-serif;
    color: var(--mu2);
  }

  /* Top élèves rows */
  .ins-eleve-row {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--r-lg);
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    min-height: 44px;
    transition: border-color .15s var(--ease-snap),
                transform .15s var(--ease-snap);
    margin-bottom: 6px;
  }
  @media (hover: hover) and (pointer: fine) {
    .ins-eleve-row:hover { border-color: var(--a); }
  }
  .ins-eleve-row:active { transform: scale(.97); }
  .ins-eleve-av {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .ins-eleve-info { flex: 1; min-width: 0; }
  .ins-eleve-name {
    font: 600 13px/1.2 'Inter', sans-serif;
    color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 3px;
  }
  .ins-eleve-meta {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu2);
  }
  .ins-badge {
    font: 600 11px/1 'Inter', sans-serif;
    padding: 3px 9px;
    border-radius: var(--r);
    flex-shrink: 0;
  }
  .ins-badge-green  { color: var(--grd); background: rgba(16,185,129,.1); }
  .ins-badge-orange { color: var(--amk); background: rgba(245,158,11,.1); }
  .ins-badge-red    { color: var(--rdk); background: rgba(239,68,68,.1); }

  /* Tabs progressent/stagnent */
  .ins-tabs {
    display: flex;
    gap: 4px;
    background: var(--bg2);
    padding: 4px;
    border-radius: var(--r);
    margin-bottom: 12px;
  }
  .ins-tab {
    flex: 1;
    padding: 8px 6px;
    min-height: 44px;
    border: none;
    background: transparent;
    border-radius: var(--r-sm);
    font: 600 12px/1 'Inter', sans-serif;
    color: var(--mu2);
    cursor: pointer;
    transition: background .15s, color .15s;
  }
  .ins-tab.active {
    background: var(--su);
    color: var(--a-txt);
    box-shadow: var(--s0);
  }


  /* Recommandations */
  .ins-reco-list { display: flex; flex-direction: column; gap: 8px; }
  .ins-reco-card {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--r-lg);
    padding: 14px 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .ins-reco-icon {
    font-size: 20px; line-height: 1;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .ins-reco-body { flex: 1; min-width: 0; }
  .ins-reco-ttl {
    font: 600 13px/1.3 'Inter', sans-serif;
    color: var(--ink);
    margin-bottom: 3px;
  }
  .ins-reco-txt {
    font: 400 12px/1.5 'Inter', sans-serif;
    color: var(--mu);
  }

  /* Skeleton */
  .ins-skel { display: flex; flex-direction: column; gap: 16px; padding: 20px 16px; }
  .ins-skel-kpi {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }
  .ins-skel-block {
    height: 80px;
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--r-xl);
    animation: insSkelPulse 1.4s ease-in-out infinite;
  }
  .ins-skel-block.tall { height: 160px; }
  @keyframes insSkelPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }

  /* Empty */
  .ins-empty {
    padding: 20px;
    text-align: center;
    color: var(--mu2);
    font: 500 13px/1.5 'Inter', sans-serif;
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--r-lg);
  }
</style>`;

// ─── Helpers ──────────────────────────────────────────────────
function monthBounds(offset = 0) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + offset;
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function daysAgoISO(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

// ─── Module state ─────────────────────────────────────────────
let _tab = "progressent"; // 'progressent' | 'stagnent'

// ─── Entry ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page.view", { page: "insights", role: me.role });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="ins-page">
      <header class="ins-hd">
        <h1 class="ins-h1">Analyses</h1>
        <p class="ins-sub">Chargement…</p>
      </header>
      <div class="ins-skel">
        <div class="ins-skel-kpi">
          <div class="ins-skel-block"></div>
          <div class="ins-skel-block"></div>
          <div class="ins-skel-block"></div>
          <div class="ins-skel-block"></div>
        </div>
        <div class="ins-skel-block tall"></div>
        <div class="ins-skel-block tall"></div>
      </div>
    </div>
  `;

  const data = await loadData(me);
  renderAll(root, me, data);
  wireAll(root, me, data);
}

// ─── Data loading ─────────────────────────────────────────────
async function loadData(me) {
  const thisMonth = monthBounds(0);
  const prevMonth = monthBounds(-1);
  const ago60 = daysAgoISO(60);
  const ago14 = daysAgoISO(14);

  const [
    valsCeMois,
    valsMoisPrev,
    vals60j,
    mesEleves,
    myProfile,
    valsARetravailler,
  ] = await Promise.all([
    // Validations ce mois
    sb
      .from("validations")
      .select("eleve_id, competence_id, statut, validated_at")
      .eq("validated_by", me.id)
      .gte("validated_at", thisMonth.start)
      .lte("validated_at", thisMonth.end),

    // Validations mois précédent (pour delta)
    sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", me.id)
      .gte("validated_at", prevMonth.start)
      .lte("validated_at", prevMonth.end),

    // Validations 60 derniers jours (graphe activité par jour)
    sb
      .from("validations")
      .select("validated_at")
      .eq("validated_by", me.id)
      .gte("validated_at", ago60),

    // Mes élèves attitrés
    sb
      .from("profiles")
      .select("id, prenom, nom, last_active_at, avatar_url")
      .eq("enseignant_id", me.id)
      .eq("role", "eleve"),

    // Mon profil (streak_pro_days si la colonne existe)
    sb.from("profiles").select("streak_pro_days, xp").eq("id", me.id).single(),

    // Validations "à retravailler" par moi (difficulté)
    sb
      .from("validations")
      .select("competence_id, eleve_id")
      .eq("validated_by", me.id)
      .eq("statut", "a_retravailler"),
  ]);

  const elevesData = mesEleves.data || [];
  const eleveIds = elevesData.map((e) => e.id);
  const valsThisMonth = valsCeMois.data || [];
  const vals60Data = vals60j.data || [];

  // Quiz attempts réels pour mes élèves
  let quizData = [];
  if (eleveIds.length > 0) {
    // NB : la colonne s'appelle completed_at (pas created_at) — l'ancien
    // nom renvoyait un 400, d'où une carte « Taux quiz » toujours vide.
    const { data: qa, error: qaErr } = await sb
      .from("quiz_attempts")
      .select("user_id, score, completed_at")
      .in("user_id", eleveIds)
      .gte("completed_at", daysAgoISO(30));
    if (qaErr) console.error("[insights] quiz_attempts query error", qaErr);
    quizData = qa || [];
  }

  // Validations ce mois par élève (pour top progressent)
  const compsCeMoisByEleve = {};
  valsThisMonth.forEach((v) => {
    if (!compsCeMoisByEleve[v.eleve_id]) compsCeMoisByEleve[v.eleve_id] = 0;
    if (v.statut === "acquis") compsCeMoisByEleve[v.eleve_id]++;
  });

  // Fetch last validation per élève pour stagnation
  let lastValMap = {};
  if (eleveIds.length > 0) {
    const { data: lastVals } = await sb
      .from("validations")
      .select("eleve_id, validated_at")
      .eq("validated_by", me.id)
      .in("eleve_id", eleveIds)
      .order("validated_at", { ascending: false });

    (lastVals || []).forEach((v) => {
      if (!lastValMap[v.eleve_id]) lastValMap[v.eleve_id] = v.validated_at;
    });
  }

  // ── KPI calculs ──────────────────────────────────────────────
  const valsCeMoisCount = valsThisMonth.filter(
    (v) => v.statut === "acquis",
  ).length;
  const valsPrevCount = valsMoisPrev.count ?? 0;
  const delta =
    valsPrevCount > 0
      ? Math.round(((valsCeMoisCount - valsPrevCount) / valsPrevCount) * 100)
      : null;

  const nbElevesAccompagnes = eleveIds.length;

  const quizTotal = quizData.length;
  const quizSuccess = quizData.filter((q) => (q.score ?? 0) >= 60).length;
  const tauxQuiz =
    quizTotal > 0 ? Math.round((quizSuccess / quizTotal) * 100) : null;

  const streakPro = myProfile.data?.streak_pro_days ?? null;

  // ── Activité par jour [jour 0-6][heure 0-23] ─────────────────
  // Réutilisé dans renderActivityChartSection : on somme par jour
  const heatmap = Array.from({ length: 7 }, () => new Array(24).fill(0));
  vals60Data.forEach((v) => {
    const d = new Date(v.validated_at);
    const jour = (d.getDay() + 6) % 7; // Lun=0 ... Dim=6
    heatmap[jour][d.getHours()]++;
  });

  // Série quotidienne (30 j) → sparkline de la métrique vedette
  const SPARK_DAYS = 30;
  const spark = new Array(SPARK_DAYS).fill(0);
  const sparkStart = Date.now() - (SPARK_DAYS - 1) * 864e5;
  vals60Data.forEach((v) => {
    const idx = Math.floor(
      (new Date(v.validated_at).getTime() - sparkStart) / 864e5,
    );
    if (idx >= 0 && idx < SPARK_DAYS) spark[idx]++;
  });

  // ── Top élèves ────────────────────────────────────────────────
  const elevesAvecPrenom = elevesData.map((e, i) => ({ ...e, idx: i }));

  const topProgressent = elevesAvecPrenom
    .filter((e) => (compsCeMoisByEleve[e.id] || 0) >= 2)
    .sort(
      (a, b) =>
        (compsCeMoisByEleve[b.id] || 0) - (compsCeMoisByEleve[a.id] || 0),
    )
    .slice(0, 3)
    .map((e) => ({ ...e, compsThisMonth: compsCeMoisByEleve[e.id] || 0 }));

  const topStagnent = elevesAvecPrenom
    .filter((e) => {
      const lastVal = lastValMap[e.id];
      const hasActivity = lastVal != null || e.last_active_at != null;
      const inactive14j = !lastVal || lastVal < ago14;
      return (
        hasActivity && inactive14j && (compsCeMoisByEleve[e.id] || 0) === 0
      );
    })
    .slice(0, 3)
    .map((e) => {
      const lastVal = lastValMap[e.id];
      const daysAgo = lastVal
        ? Math.floor((Date.now() - new Date(lastVal).getTime()) / 86400000)
        : null;
      return { ...e, daysAgo };
    });

  // ── Carte difficulté ──────────────────────────────────────────
  const diffByComp = {};
  (valsARetravailler.data || []).forEach((v) => {
    if (!diffByComp[v.competence_id]) diffByComp[v.competence_id] = new Set();
    diffByComp[v.competence_id].add(v.eleve_id);
  });
  const topDiff = Object.entries(diffByComp)
    .map(([compId, elevesSet]) => ({ compId, count: elevesSet.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── À faire cette semaine — règles métier simples (PAS de l'IA) :
  //    relancer son streak / un élève en pause / débrief sur une compétence
  //    qui bloque plusieurs élèves. Chaque carte est actionnable (route).
  const recos = [];
  if (streakPro !== null && streakPro < 3) {
    recos.push({
      icon: icon("target", { size: 18, strokeWidth: 2, color: "var(--a)" }),
      ttl: "Lance ta semaine",
      txt: "Valide une compétence avec un élève actif pour alimenter ton streak.",
      route: "#/log-session",
    });
  }
  if (topStagnent.length > 0) {
    const e = topStagnent[0];
    const nm = esc(`${e.prenom || ""} ${e.nom || ""}`.trim());
    const since = e.daysAgo ? `depuis ${e.daysAgo}j` : "depuis un moment";
    recos.push({
      icon: icon("alert-triangle", {
        size: 18,
        strokeWidth: 2,
        color: "var(--amk)",
      }),
      ttl: `Relance ${nm}`,
      txt: `${nm} n'a plus validé ${since}. Un point en leçon peut débloquer la progression.`,
      route: `#/livret/${e.id}`,
    });
  }
  if (topDiff.length > 0) {
    const d = topDiff[0];
    const nm = esc(labelComp(d.compId));
    recos.push({
      icon: icon("search", { size: 18, strokeWidth: 2, color: "var(--blk)" }),
      ttl: `Point pédagogique : ${nm}`,
      txt: `${d.count} élève${d.count > 1 ? "s" : ""} bloqué${d.count > 1 ? "s" : ""} sur cette compétence. Prévois un temps dédié en leçon.`,
      route: `#/eleves?bloque_sur=${encodeURIComponent(d.compId)}`,
    });
  }
  if (recos.length === 0) {
    recos.push({
      icon: icon("check-circle", {
        size: 18,
        strokeWidth: 2,
        color: "var(--grd)",
      }),
      ttl: "Tout roule",
      txt: "Tes élèves progressent bien ce mois. Rien d'urgent à ce stade.",
      route: null,
    });
  }

  return {
    valsCeMoisCount,
    valsPrevCount,
    delta,
    nbElevesAccompagnes,
    tauxQuiz,
    streakPro,
    heatmap,
    spark,
    topProgressent,
    topStagnent,
    topDiff,
    recos,
    eleveIds,
    elevesAvecPrenom,
  };
}

// ─── Render principal ─────────────────────────────────────────
function renderAll(root, me, data) {
  root.innerHTML = `
    ${STYLE}
    <div class="ins-page anim-slide-up">
      <header class="ins-hd">
        <h1 class="ins-h1">Analyses</h1>
        <p class="ins-sub">${
          data.valsCeMoisCount > 0
            ? `Ce mois, tu as fait valider <b style="color:var(--adk);font-weight:800">${data.valsCeMoisCount} compétence${data.valsCeMoisCount > 1 ? "s" : ""}</b> à tes ${data.nbElevesAccompagnes} élève${data.nbElevesAccompagnes > 1 ? "s" : ""}.`
            : "Vue d'ensemble de ton activité · 60 derniers jours"
        }</p>
      </header>

      ${renderKpis(data)}
      ${renderActivityChartSection(data)}
      ${renderTopElevesSection(data)}
      ${renderRecoSection(data)}
    </div>
  `;
}

// ── Métrique vedette (star) + 3 secondaires ───────────────────
function renderKpis({
  valsCeMoisCount,
  delta,
  nbElevesAccompagnes,
  tauxQuiz,
  streakPro,
  spark,
}) {
  const deltaHtml =
    delta === null
      ? `<p class="ins-widget-delta flat">Premier mois</p>`
      : delta > 0
        ? `<p class="ins-widget-delta up">▲ ${delta}% vs mois précédent</p>`
        : delta < 0
          ? `<p class="ins-widget-delta down">▼ ${Math.abs(delta)}% vs mois précédent</p>`
          : `<p class="ins-widget-delta flat">= Stable vs mois précédent</p>`;

  const streakVal = streakPro !== null ? streakPro : "—";
  const tauxVal = tauxQuiz === null ? "—" : `${tauxQuiz}%`;
  const hasSpark = Array.isArray(spark) && spark.some((n) => n > 0);

  return `
    <div class="ins-star">
      <div class="ins-star-top">
        <div class="ins-star-num">${valsCeMoisCount}</div>
        <div class="ins-star-meta">
          <div class="ins-star-lbl">Compétences validées</div>
          <div class="ins-star-sub">Ce mois</div>
          ${deltaHtml}
        </div>
      </div>
      ${hasSpark ? `<div class="ins-star-spark">${sparkline(spark)}</div>` : ""}
    </div>

    <div class="ins-sec">
      <div class="ins-sec-card">
        <div class="ins-sec-val">${nbElevesAccompagnes}</div>
        <div class="ins-sec-lbl">Élèves</div>
      </div>
      <div class="ins-sec-card">
        <div class="ins-sec-val">${tauxVal}</div>
        <div class="ins-sec-lbl">Réussite Révision</div>
      </div>
      <div class="ins-sec-card">
        <div class="ins-sec-val">${streakVal}${streakPro ? ` ${icon("flame", { size: 15, strokeWidth: 2, color: "var(--amk)" })}` : ""}</div>
        <div class="ins-sec-lbl">Streak pro</div>
      </div>
    </div>
  `;
}

// Sparkline SVG étirée à la largeur du conteneur (preserveAspectRatio=none).
function sparkline(values, { w = 300, h = 44 } = {}) {
  const max = Math.max(1, ...values);
  const n = values.length;
  const step = n > 1 ? w / (n - 1) : 0;
  const y = (v) => h - 3 - (v / max) * (h - 6);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const lastX = ((n - 1) * step).toFixed(1);
  const lastY = y(values[n - 1]).toFixed(1);
  return `<svg class="ins-spark-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="var(--a)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${lastX}" cy="${lastY}" r="3.5" fill="var(--a)"/>
  </svg>`;
}

// ── Graphe activité par jour ──────────────────────────────────
function renderActivityChartSection({ heatmap }) {
  const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const BAR_MAX_H = 60; // px — hauteur max dans le container de 88px

  const totals = heatmap.map((row) => row.reduce((s, n) => s + n, 0));
  const maxTotal = Math.max(...totals);

  if (maxTotal === 0) {
    return `
      <div class="ins-section">
        <div class="ins-section-title">Tes jours d'activité · 60 derniers jours</div>
        <div class="ins-chart-wrap">
          <div class="ins-chart-empty">Aucune validation sur les 60 derniers jours.<br>Enregistre ta première séance pour voir quels jours tu es le plus actif.</div>
        </div>
      </div>
    `;
  }

  const peakIdx = totals.indexOf(maxTotal);

  const bars = totals
    .map((n, j) => {
      const isPeak = j === peakIdx;
      const h = n > 0 ? Math.max(4, Math.round((n / maxTotal) * BAR_MAX_H)) : 3;
      return `
      <div class="ins-chart-col${isPeak ? " ins-chart-col--peak" : ""}">
        <span class="ins-chart-val">${n > 0 ? n : ""}</span>
        <div class="ins-chart-bar" style="height:${h}px"></div>
        <span class="ins-chart-lbl">${JOURS_COURT[j]}</span>
      </div>`;
    })
    .join("");

  return `
    <div class="ins-section">
      <div class="ins-section-title">Tes jours d'activité · 60 derniers jours</div>
      <div class="ins-chart-wrap">
        <div class="ins-chart-bars">${bars}</div>
        <div class="ins-chart-divider"></div>
        <p class="ins-chart-peak-note">Jour le plus actif : <strong>${esc(JOURS_COURT[peakIdx])}</strong> — ${maxTotal} validation${maxTotal > 1 ? "s" : ""}</p>
      </div>
    </div>
  `;
}

// ── Top élèves ────────────────────────────────────────────────
function renderTopElevesSection({ topProgressent, topStagnent }) {
  return `
    <div class="ins-section" id="ins-top-section">
      <div class="ins-section-title">Tes élèves ce mois</div>
      <div class="ins-tabs" role="tablist">
        <button class="ins-tab active" data-tab="progressent" role="tab"
                style="display:flex;align-items:center;gap:5px;">
          ${icon("trending-up", { size: 14, strokeWidth: 2.2 })} Avancent (${topProgressent.length})
        </button>
        <button class="ins-tab" data-tab="stagnent" role="tab"
                style="display:flex;align-items:center;gap:5px;">
          ${icon("alert-triangle", { size: 14, strokeWidth: 2.2 })} En pause (${topStagnent.length})
        </button>
      </div>
      <div id="ins-eleves-list">
        ${renderElevesList("progressent", topProgressent, topStagnent)}
      </div>
    </div>
  `;
}

function renderElevesList(tab, topProgressent, topStagnent) {
  const list = tab === "progressent" ? topProgressent : topStagnent;
  if (list.length === 0) {
    const empty =
      tab === "progressent"
        ? "Aucun élève avec plusieurs compétences validées ce mois."
        : "Personne en pause — tout le monde avance !";
    return `<div class="ins-empty">${empty}</div>`;
  }
  return list
    .map((e, i) => {
      const nom = esc(`${e.prenom || ""} ${e.nom || ""}`.trim() || "Élève");
      const badge =
        tab === "progressent"
          ? `<span class="ins-badge ins-badge-green">+${e.compsThisMonth} ce mois</span>`
          : `<span class="ins-badge ins-badge-orange">${e.daysAgo ? `${e.daysAgo}j sans validation` : "En pause"}</span>`;
      const meta =
        tab === "progressent"
          ? `${e.compsThisMonth} compétence${e.compsThisMonth > 1 ? "s" : ""} acquise${e.compsThisMonth > 1 ? "s" : ""} ce mois`
          : `Aucune validation depuis ${e.daysAgo ? `${e.daysAgo} jours` : "longtemps"}`;
      return `
      <div class="ins-eleve-row" data-eleve-id="${esc(e.id)}" data-tab="${tab}"
           role="button" tabindex="0" aria-label="Livret de ${nom}"
           style="animation: insWidgetIn .3s cubic-bezier(.23,1,.32,1) ${i * 50}ms both">
        <div class="ins-eleve-av" style="flex-shrink:0">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 36)}</div>
        <div class="ins-eleve-info">
          <div class="ins-eleve-name">${nom}</div>
          <div class="ins-eleve-meta">${meta}</div>
        </div>
        ${badge}
        <span aria-hidden="true" style="color:var(--mu2);font-size:14px">›</span>
      </div>
    `;
    })
    .join("");
}

// ── Difficulté comps ──────────────────────────────────────────
// ── À faire cette semaine ─────────────────────────────────────
function renderRecoSection({ recos }) {
  const cards = recos
    .map(
      (r) => `
    <div class="ins-reco-card${r.route ? " ins-reco-card--link" : ""}"
         ${r.route ? `data-route="${esc(r.route)}" role="button" tabindex="0" style="cursor:pointer;"` : ""}>
      <span class="ins-reco-icon">${r.icon}</span>
      <div class="ins-reco-body">
        <div class="ins-reco-ttl">${esc(r.ttl)}</div>
        <div class="ins-reco-txt">${r.txt}</div>
      </div>
    </div>
  `,
    )
    .join("");

  return `
    <div class="ins-section">
      <div class="ins-section-title">À faire cette semaine</div>
      <div class="ins-reco-list">${cards}</div>
    </div>
  `;
}

// ─── Wire ─────────────────────────────────────────────────────
function wireAll(root, me, data) {
  // Tabs progressent/stagnent
  root.querySelectorAll(".ins-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      _tab = btn.dataset.tab;
      root
        .querySelectorAll(".ins-tab")
        .forEach((b) => b.classList.toggle("active", b === btn));
      const listEl = root.querySelector("#ins-eleves-list");
      if (listEl) {
        listEl.innerHTML = renderElevesList(
          _tab,
          data.topProgressent,
          data.topStagnent,
        );
        wireEleveRows(listEl);
      }
      track("insights.tab.click", { tab: _tab });
    });
  });

  // Élèves rows initials
  wireEleveRows(root);

  // Reco cards → navigate to route
  root.querySelectorAll(".ins-reco-card--link[data-route]").forEach((card) => {
    const handler = () => {
      track("insights.reco.click", { route: card.dataset.route });
      navigate(card.dataset.route);
    };
    card.addEventListener("click", handler);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    });
  });
}

function wireEleveRows(container) {
  container.querySelectorAll(".ins-eleve-row[data-eleve-id]").forEach((row) => {
    const handler = () => {
      track("insights.eleve.open", {
        eleve_id: row.dataset.eleveId,
        tab: _tab,
      });
      navigate(`#/livret/${row.dataset.eleveId}`);
    };
    row.addEventListener("click", handler);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    });
  });
}
