// ═══════════════════════════════════════════════════════════════
// Enseignant — Stats (design premium indigo raccord dashboard)
// Hero validations + bento KPI + activite 7j + qui progresse
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
import { haptic } from "@/utils/haptic.js";

// ─── Constantes ───────────────────────────────────────────────
const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
  /* ── Layout global ── */
  .ins-page {
    padding: 0 0 calc(96px + env(safe-area-inset-bottom, 0px));
    max-width: 600px;
    margin: 0 auto;
    background: #eef1fb;
    font-family: 'Inter', sans-serif;
    color: #1a1c2e;
  }

  /* ── En-tête « Stats » + segment Semaine / Mois ── */
  .ins-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(env(safe-area-inset-top, 0px) + var(--th, 52px) + 14px) 18px 0;
  }
  .ins-title {
    font: 800 23px/1.15 'Manrope', 'Inter', sans-serif;
    color: #1a1c2e;
    letter-spacing: -.02em;
  }
  .ins-seg {
    display: flex;
    background: #fff;
    border: 1px solid #e6e9f7;
    border-radius: 999px;
    padding: 3px;
  }
  .ins-seg-btn {
    border: none;
    background: transparent;
    font: 700 11px/1 'Inter', sans-serif;
    color: #6b7095;
    padding: 5px 11px;
    border-radius: 999px;
    cursor: pointer;
    min-height: 30px;
    -webkit-tap-highlight-color: transparent;
    transition: background .15s, color .15s;
  }
  .ins-seg-btn.active {
    background: #4f46e5;
    color: #fff;
  }

  /* ── Corps scrollable ── */
  .ins-body {
    padding: 14px 16px 0;
  }

  /* ── Hero indigo ── */
  .ins-hero {
    position: relative;
    background: linear-gradient(150deg, #4f46e5, #6d6bff 65%);
    border-radius: 24px;
    padding: 18px 18px 16px;
    color: #fff;
    overflow: hidden;
    box-shadow: 0 14px 32px -14px rgba(79, 70, 229, .55);
    animation: insHeroIn .4s cubic-bezier(.22,.68,0,1.2) both;
  }
  .ins-hero::after {
    content: "";
    position: absolute;
    right: -32px;
    top: -32px;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.18), transparent 70%);
    pointer-events: none;
  }
  @keyframes insHeroIn {
    from { opacity: 0; transform: translateY(8px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ins-hero { animation: none !important; }
  }

  .ins-hero-label {
    font: 700 10.5px/1 'Inter', sans-serif;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #cdc9ff;
    margin-bottom: 6px;
  }
  .ins-hero-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }
  .ins-hero-big {
    font: 700 56px/1 'Fredoka', 'Fredoka One', sans-serif;
    letter-spacing: -.01em;
    line-height: 1;
  }
  .ins-hero-delta {
    font: 800 12px/1 'Inter', sans-serif;
    padding: 5px 11px;
    border-radius: 999px;
    margin-bottom: 8px;
    align-self: flex-end;
  }
  .ins-hero-delta.up   { background: rgba(255,255,255,.18); color: #c7f9d8; }
  .ins-hero-delta.down { background: rgba(255,255,255,.14); color: #fecaca; }
  .ins-hero-delta.flat { background: rgba(255,255,255,.12); color: rgba(255,255,255,.8); }

  /* Sparkline 7 barres dans le hero */
  .ins-hero-spark {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 32px;
    margin-top: 12px;
  }
  .ins-hero-spark-bar {
    flex: 1;
    border-radius: 3px 3px 2px 2px;
    background: rgba(255, 255, 255, .45);
    min-height: 4px;
    transition: height .3s ease;
  }
  .ins-hero-spark-bar.peak {
    background: #fff;
  }

  /* ── Bento 3 tuiles ── */
  .ins-bento {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
    margin-top: 11px;
  }
  .ins-bt {
    background: #fff;
    border: 1px solid #e6e9f7;
    border-radius: 16px;
    padding: 13px 11px 11px;
    box-shadow: 0 6px 16px -12px rgba(60, 50, 130, .3);
    animation: insBtIn .4s cubic-bezier(.22,.68,0,1.2) both;
  }
  .ins-bt:nth-child(1) { animation-delay: .06s; }
  .ins-bt:nth-child(2) { animation-delay: .11s; }
  .ins-bt:nth-child(3) { animation-delay: .16s; }
  @keyframes insBtIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ins-bt { animation: none !important; }
  }
  .ins-bt-val {
    font: 800 24px/1 'Manrope', 'Inter', sans-serif;
    letter-spacing: -.02em;
  }
  .ins-bt-val.green { color: #16a34a; }
  .ins-bt-val.amber { color: #d97706; }
  .ins-bt-val.red   { color: #dc2626; }
  .ins-bt-lbl {
    font: 600 10px/1.2 'Inter', sans-serif;
    color: #a3a9c4;
    margin-top: 4px;
  }

  /* ── Section titre ── */
  .ins-sec-lbl {
    font: 800 12px/1 'Manrope', 'Inter', sans-serif;
    color: #3a3f63;
    margin: 18px 0 9px 2px;
  }

  /* ── Carte blanche générique ── */
  .ins-card {
    background: #fff;
    border: 1px solid #e6e9f7;
    border-radius: 18px;
    padding: 14px;
    box-shadow: 0 8px 22px -14px rgba(60, 50, 130, .25);
  }

  /* ── Graphe barres activite 7 jours ── */
  .ins-bars {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 6px;
    height: 88px;
  }
  .ins-bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
    height: 100%;
  }
  .ins-bar-inner {
    width: 100%;
    border-radius: 6px 6px 3px 3px;
    background: #e3e1fb;
    min-height: 4px;
  }
  .ins-bar-inner.peak {
    background: linear-gradient(180deg, #6d6bff, #4f46e5);
  }
  .ins-bar-day {
    font: 700 9.5px/1 'Inter', sans-serif;
    color: #a3a9c4;
    text-align: center;
  }
  .ins-bar-day.peak { color: #4f46e5; }

  /* ── Lignes « Qui progresse » ── */
  .ins-prog-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ins-prog-row {
    display: flex;
    align-items: center;
    gap: 11px;
    background: #fff;
    border: 1px solid #e6e9f7;
    border-radius: 14px;
    padding: 10px 12px;
    cursor: pointer;
    min-height: 52px;
    -webkit-tap-highlight-color: transparent;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .ins-prog-row:active {
    transform: scale(.975);
    box-shadow: 0 2px 8px -4px rgba(60, 50, 130, .2);
  }
  .ins-prog-row:focus-visible {
    outline: 3px solid #4f46e5;
    outline-offset: 2px;
  }
  .ins-prog-av {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: #fff;
    font: 800 12px/1 'Manrope', sans-serif;
    flex-shrink: 0;
  }
  .ins-prog-nom {
    flex: 1;
    min-width: 0;
    font: 700 13px/1.2 'Inter', sans-serif;
    color: #1a1c2e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ins-prog-delta {
    font: 800 13px/1 'Manrope', sans-serif;
    color: #16a34a;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .ins-prog-delta small {
    font: 600 10px/1 'Inter', sans-serif;
    color: #a3a9c4;
  }

  /* ── Tabs eleves progressent / en pause ── */
  .ins-tabs {
    display: flex;
    gap: 4px;
    background: #f0f2fb;
    padding: 4px;
    border-radius: 12px;
    margin-bottom: 10px;
  }
  .ins-tab {
    flex: 1;
    padding: 8px 6px;
    min-height: 40px;
    border: none;
    background: transparent;
    border-radius: 9px;
    font: 600 12px/1 'Inter', sans-serif;
    color: #6b7095;
    cursor: pointer;
    transition: background .15s, color .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .ins-tab.active {
    background: #fff;
    color: #4f46e5;
    font-weight: 700;
    box-shadow: 0 1px 4px rgba(0, 0, 0, .1);
  }

  /* ── Recos ── */
  .ins-reco-list { display: flex; flex-direction: column; gap: 8px; }
  .ins-reco-card {
    background: #fff;
    border: 1px solid #e6e9f7;
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    transition: transform .12s ease;
  }
  .ins-reco-card[role="button"] { cursor: pointer; }
  .ins-reco-card[role="button"]:active { transform: scale(.98); }
  .ins-reco-icon { flex-shrink: 0; margin-top: 1px; }
  .ins-reco-body { flex: 1; min-width: 0; }
  .ins-reco-ttl {
    font: 700 13px/1.3 'Inter', sans-serif;
    color: #1a1c2e;
    margin-bottom: 3px;
  }
  .ins-reco-txt {
    font: 400 12px/1.5 'Inter', sans-serif;
    color: #6b7095;
  }

  /* ── Empty states ── */
  .ins-empty {
    padding: 28px 16px;
    text-align: center;
    color: #6b7095;
    font: 500 13px/1.5 'Inter', sans-serif;
    background: #fff;
    border: 1px solid #e6e9f7;
    border-radius: 16px;
  }

  /* ── Skeleton ── */
  .ins-skel {
    padding: calc(env(safe-area-inset-top, 0px) + var(--th, 52px) + 20px) 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .ins-skel-block {
    border-radius: 20px;
    background: linear-gradient(90deg, #dde0f5 0%, #eceef8 50%, #dde0f5 100%);
    background-size: 200% 100%;
    animation: ins-shimmer 1.4s ease-in-out infinite;
  }
  @keyframes ins-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
</style>`;

// ─── Couleurs avatar deterministes ────────────────────────────
const AV_COLORS = [
  "#4f46e5",
  "#0891b2",
  "#15803d",
  "#b45309",
  "#7c3aed",
  "#c026d3",
];
function avatarColor(id) {
  if (!id) return AV_COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}
function initiales(prenom, nom) {
  const p = (prenom || "").trim()[0] || "";
  const n = (nom || "").trim()[0] || "";
  return (p + n).toUpperCase() || "?";
}

// ─── Helpers dates ────────────────────────────────────────────
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
let _period = "semaine"; // 'semaine' | 'mois'
let _tab = "progressent"; // 'progressent' | 'pause'

// ─── Entry ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page.view", { page: "insights", role: me.role });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="ins-page">
      <div class="ins-skel">
        <div class="ins-skel-block" style="height:36px"></div>
        <div class="ins-skel-block" style="height:148px"></div>
        <div class="ins-skel-block" style="height:80px"></div>
        <div class="ins-skel-block" style="height:120px"></div>
        <div class="ins-skel-block" style="height:180px"></div>
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
  const ago7 = daysAgoISO(7);

  const [
    valsCeMois,
    valsMoisPrev,
    vals60j,
    mesEleves,
    myProfile,
    valsARetravailler,
    valsSemaine,
    valsSemainePrev,
  ] = await Promise.all([
    // Validations ce mois
    sb
      .from("validations")
      .select("eleve_id, competence_id, statut, validated_at")
      .eq("validated_by", me.id)
      .gte("validated_at", thisMonth.start)
      .lte("validated_at", thisMonth.end),

    // Validations mois precedent (pour delta mois)
    sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", me.id)
      .gte("validated_at", prevMonth.start)
      .lte("validated_at", prevMonth.end),

    // Validations 60 derniers jours (graphe activite + sparkline)
    sb
      .from("validations")
      .select("validated_at")
      .eq("validated_by", me.id)
      .gte("validated_at", ago60),

    // Mes eleves attitres
    sb
      .from("profiles")
      .select("id, prenom, nom, last_active_at, avatar_url")
      .eq("enseignant_id", me.id)
      .eq("role", "eleve"),

    // Mon profil
    sb.from("profiles").select("streak_pro_days, xp").eq("id", me.id).single(),

    // Validations a retravailler
    sb
      .from("validations")
      .select("competence_id, eleve_id")
      .eq("validated_by", me.id)
      .eq("statut", "a_retravailler"),

    // Validations cette semaine (7 derniers jours)
    sb
      .from("validations")
      .select("eleve_id, competence_id, statut, validated_at")
      .eq("validated_by", me.id)
      .gte("validated_at", ago7),

    // Validations semaine precedente (7-14 jours)
    sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", me.id)
      .gte("validated_at", daysAgoISO(14))
      .lt("validated_at", ago7),
  ]);

  const elevesData = mesEleves.data || [];
  const eleveIds = elevesData.map((e) => e.id);
  const valsThisMonth = valsCeMois.data || [];
  const vals60Data = vals60j.data || [];
  const valsSemaineData = valsSemaine.data || [];

  // Quiz attempts reels pour mes eleves
  let quizData = [];
  if (eleveIds.length > 0) {
    const { data: qa, error: qaErr } = await sb
      .from("quiz_attempts")
      .select("user_id, score, completed_at")
      .in("user_id", eleveIds)
      .gte("completed_at", daysAgoISO(30));
    if (qaErr) console.error("[insights] quiz_attempts query error", qaErr);
    quizData = qa || [];
  }

  // Validations ce mois par eleve (pour top progressent)
  const compsCeMoisByEleve = {};
  valsThisMonth.forEach((v) => {
    if (!compsCeMoisByEleve[v.eleve_id]) compsCeMoisByEleve[v.eleve_id] = 0;
    if (v.statut === "acquis") compsCeMoisByEleve[v.eleve_id]++;
  });

  // Validations cette semaine par eleve
  const compsSemaineByEleve = {};
  valsSemaineData.forEach((v) => {
    if (!compsSemaineByEleve[v.eleve_id]) compsSemaineByEleve[v.eleve_id] = 0;
    if (v.statut === "acquis") compsSemaineByEleve[v.eleve_id]++;
  });

  // Derniere validation par eleve
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

  // ── KPI semaine ──────────────────────────────────────────────
  const valsSemaineCount = valsSemaineData.filter(
    (v) => v.statut === "acquis",
  ).length;
  const valsSemainePrevCount = valsSemainePrev.count ?? 0;
  const deltaSemaine =
    valsSemainePrevCount > 0 ? valsSemaineCount - valsSemainePrevCount : null;

  // ── KPI mois ─────────────────────────────────────────────────
  const valsCeMoisCount = valsThisMonth.filter(
    (v) => v.statut === "acquis",
  ).length;
  const valsPrevCount = valsMoisPrev.count ?? 0;
  const deltaMois =
    valsPrevCount > 0
      ? Math.round(((valsCeMoisCount - valsPrevCount) / valsPrevCount) * 100)
      : null;

  const nbElevesAccompagnes = eleveIds.length;

  const quizTotal = quizData.length;
  const quizSuccess = quizData.filter((q) => (q.score ?? 0) >= 60).length;
  const tauxQuiz =
    quizTotal > 0 ? Math.round((quizSuccess / quizTotal) * 100) : null;

  const streakPro = myProfile.data?.streak_pro_days ?? null;

  // ── Activite par jour (60j) pour graphe semaine summe par jour ──
  // Aggregation des 7 derniers jours (Lun=0 ... Dim=6)
  const heatmapDay = new Array(7).fill(0);
  // Granularite fine : on veut les 7 derniers jours calendaires absolus
  const spark7 = new Array(7).fill(0);
  const now7 = Date.now();
  vals60Data.forEach((v) => {
    const d = new Date(v.validated_at);
    // Jours depuis maintenant (0 = aujourd'hui, 1 = hier, …)
    const diffDays = Math.floor((now7 - d.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays < 7) {
      spark7[6 - diffDays]++;
    }
    // Heatmap par jour de la semaine (pour le graphe)
    const jour = (d.getDay() + 6) % 7; // Lun=0 ... Dim=6
    heatmapDay[jour]++;
  });

  // Sparkline 30 jours (pour periode mois)
  const SPARK_DAYS = 30;
  const spark30 = new Array(SPARK_DAYS).fill(0);
  const sparkStart = Date.now() - (SPARK_DAYS - 1) * 864e5;
  vals60Data.forEach((v) => {
    const idx = Math.floor(
      (new Date(v.validated_at).getTime() - sparkStart) / 864e5,
    );
    if (idx >= 0 && idx < SPARK_DAYS) spark30[idx]++;
  });

  const elevesAvecPrenom = elevesData.map((e, i) => ({ ...e, idx: i }));

  // ── Bento KPI : actifs, en approche, a relancer ───────────────
  // Actif = au moins 1 validation ce mois
  const activeThisMonth = new Set(
    valsThisMonth.filter((v) => v.statut === "acquis").map((v) => v.eleve_id),
  );
  const nbActifs = eleveIds.filter((id) => activeThisMonth.has(id)).length;

  // A relancer = inactif depuis > 14j (aucune validation depuis 14j)
  const nbRelancer = eleveIds.filter((id) => {
    const last = lastValMap[id];
    return !last || last < ago14;
  }).length;

  // En approche = actif mais pas de compétence acquise ce mois (entre les deux)
  const nbEnApproche = Math.max(0, nbElevesAccompagnes - nbActifs - nbRelancer);

  // ── Top progressent (semaine) ─────────────────────────────────
  const topProgressent = elevesAvecPrenom
    .filter((e) => (compsSemaineByEleve[e.id] || 0) >= 1)
    .sort(
      (a, b) =>
        (compsSemaineByEleve[b.id] || 0) - (compsSemaineByEleve[a.id] || 0),
    )
    .slice(0, 3)
    .map((e) => ({ ...e, valsWeek: compsSemaineByEleve[e.id] || 0 }));

  // Top progressent (mois)
  const topProgressentMois = elevesAvecPrenom
    .filter((e) => (compsCeMoisByEleve[e.id] || 0) >= 2)
    .sort(
      (a, b) =>
        (compsCeMoisByEleve[b.id] || 0) - (compsCeMoisByEleve[a.id] || 0),
    )
    .slice(0, 3)
    .map((e) => ({ ...e, valsMonth: compsCeMoisByEleve[e.id] || 0 }));

  // Top stagnent
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

  // ── Difficulte comps ──────────────────────────────────────────
  const diffByComp = {};
  (valsARetravailler.data || []).forEach((v) => {
    if (!diffByComp[v.competence_id]) diffByComp[v.competence_id] = new Set();
    diffByComp[v.competence_id].add(v.eleve_id);
  });
  const topDiff = Object.entries(diffByComp)
    .map(([compId, elevesSet]) => ({ compId, count: elevesSet.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Recommandations ───────────────────────────────────────────
  const recos = [];
  if (streakPro !== null && streakPro < 3) {
    recos.push({
      icon: icon("target", { size: 18, strokeWidth: 2, color: "#4f46e5" }),
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
        color: "#d97706",
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
      icon: icon("search", { size: 18, strokeWidth: 2, color: "#6b7095" }),
      ttl: `Point pedagogique : ${nm}`,
      txt: `${d.count} élève${d.count > 1 ? "s" : ""} bloqué${d.count > 1 ? "s" : ""} sur cette compétence. Prévois un temps dédié en leçon.`,
      route: `#/eleves?bloque_sur=${encodeURIComponent(d.compId)}`,
    });
  }
  if (recos.length === 0) {
    recos.push({
      icon: icon("check-circle", {
        size: 18,
        strokeWidth: 2,
        color: "#16a34a",
      }),
      ttl: "Tout roule",
      txt: "Tes élèves progressent bien ce moment. Rien d'urgent.",
      route: null,
    });
  }

  return {
    // Semaine
    valsSemaineCount,
    deltaSemaine,
    spark7,
    topProgressent,
    // Mois
    valsCeMoisCount,
    deltaMois,
    spark30,
    topProgressentMois,
    // Partage
    nbElevesAccompagnes,
    nbActifs,
    nbEnApproche,
    nbRelancer,
    tauxQuiz,
    streakPro,
    heatmapDay,
    topStagnent,
    topDiff,
    recos,
    eleveIds,
    elevesAvecPrenom,
    // Pour recalcul bento
    compsCeMoisByEleve,
    compsSemaineByEleve,
    lastValMap,
    ago14,
  };
}

// ─── Render principal ─────────────────────────────────────────
function renderAll(root, me, data) {
  root.innerHTML = `
    ${STYLE}
    <div class="ins-page anim-slide-up">

      <!-- En-tete + segment -->
      <div class="ins-topbar">
        <h1 class="ins-title">Stats</h1>
        <div class="ins-seg" role="group" aria-label="Periode">
          <button class="ins-seg-btn${_period === "semaine" ? " active" : ""}"
                  data-period="semaine" type="button">Semaine</button>
          <button class="ins-seg-btn${_period === "mois" ? " active" : ""}"
                  data-period="mois" type="button">Mois</button>
        </div>
      </div>

      <div class="ins-body">
        ${renderPeriodContent(data)}
      </div>
    </div>
  `;
}

// ─── Contenu dependant de la periode ─────────────────────────
function renderPeriodContent(data) {
  const isSemaine = _period === "semaine";

  const count = isSemaine ? data.valsSemaineCount : data.valsCeMoisCount;
  const delta = isSemaine ? data.deltaSemaine : null; // pour mois on affiche % mais simplifions en nombre
  const deltaMois = data.deltaMois;
  const spark = isSemaine ? data.spark7 : data.spark30.slice(-14); // 14 derniers jours du mois
  const topList = isSemaine ? data.topProgressent : data.topProgressentMois;

  // Hero delta HTML
  let deltaHtml = "";
  if (isSemaine) {
    if (delta === null) {
      deltaHtml = `<span class="ins-hero-delta flat">Premiere semaine</span>`;
    } else if (delta > 0) {
      deltaHtml = `<span class="ins-hero-delta up">&#9650; +${delta} vs S-1</span>`;
    } else if (delta < 0) {
      deltaHtml = `<span class="ins-hero-delta down">&#9660; ${delta} vs S-1</span>`;
    } else {
      deltaHtml = `<span class="ins-hero-delta flat">Stable vs S-1</span>`;
    }
  } else {
    if (deltaMois === null) {
      deltaHtml = `<span class="ins-hero-delta flat">Premier mois</span>`;
    } else if (deltaMois > 0) {
      deltaHtml = `<span class="ins-hero-delta up">&#9650; +${deltaMois}% vs M-1</span>`;
    } else if (deltaMois < 0) {
      deltaHtml = `<span class="ins-hero-delta down">&#9660; ${Math.abs(deltaMois)}% vs M-1</span>`;
    } else {
      deltaHtml = `<span class="ins-hero-delta flat">Stable vs M-1</span>`;
    }
  }

  // Sparkline barres CSS
  const sparkMax = Math.max(1, ...spark);
  const sparkBars = spark
    .map((v, i) => {
      const pct = Math.max(8, Math.round((v / sparkMax) * 100));
      const isPeak = v === sparkMax && v > 0;
      return `<div class="ins-hero-spark-bar${isPeak ? " peak" : ""}"
                   style="height:${pct}%;flex:1"></div>`;
    })
    .join("");

  // Label hero
  const heroLabel = isSemaine
    ? "Validations cette semaine"
    : "Validations ce mois";

  // Top qui progresse
  const topListHtml = renderTopProgresse(topList, isSemaine);

  return `
    <!-- Hero indigo -->
    <div class="ins-hero">
      <div class="ins-hero-label">${heroLabel}</div>
      <div class="ins-hero-row">
        <div class="ins-hero-big">${count}</div>
        ${deltaHtml}
      </div>
      <div class="ins-hero-spark" aria-hidden="true">
        ${sparkBars}
      </div>
    </div>

    <!-- Bento 3 tuiles -->
    <div class="ins-bento">
      <div class="ins-bt">
        <div class="ins-bt-val green">${data.nbActifs}</div>
        <div class="ins-bt-lbl">&#233;l&#232;ves actifs</div>
      </div>
      <div class="ins-bt">
        <div class="ins-bt-val amber">${data.nbEnApproche}</div>
        <div class="ins-bt-lbl">En approche</div>
      </div>
      <div class="ins-bt">
        <div class="ins-bt-val red">${data.nbRelancer}</div>
        <div class="ins-bt-lbl">&#192; relancer</div>
      </div>
    </div>

    <!-- Activite 7 derniers jours -->
    <div class="ins-sec-lbl">Activit&#233; &middot; 7 derniers jours</div>
    ${renderActivityChart(data)}

    <!-- Qui progresse le plus -->
    <div class="ins-sec-lbl">Qui progresse le plus</div>
    ${topListHtml}

    <!-- Tabs avancent / en pause -->
    <div class="ins-sec-lbl">Tes &#233;l&#232;ves ce mois</div>
    <div class="ins-tabs" role="tablist" id="ins-tabs">
      <button class="ins-tab${_tab === "progressent" ? " active" : ""}"
              data-tab="progressent" role="tab" type="button">
        Avancent (${data.topProgressent.length})
      </button>
      <button class="ins-tab${_tab === "pause" ? " active" : ""}"
              data-tab="pause" role="tab" type="button">
        En pause (${data.topStagnent.length})
      </button>
    </div>
    <div id="ins-eleves-list">
      ${renderElevesList(_tab, data)}
    </div>

    <!-- Recommandations -->
    <div class="ins-sec-lbl">&#192; faire cette semaine</div>
    ${renderRecoSection(data)}
  `;
}

// ─── Graphe activite 7 jours ──────────────────────────────────
function renderActivityChart({ heatmapDay, spark7 }) {
  // On utilise spark7 pour les 7 derniers jours absolus avec labels generiques
  const today = new Date();
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    labels.push(JOURS_COURT[(d.getDay() + 6) % 7]);
  }

  const totals = spark7;
  const maxTotal = Math.max(...totals);

  if (maxTotal === 0) {
    return `<div class="ins-card ins-empty">
      Aucune validation sur les 7 derniers jours.
    </div>`;
  }

  const peakIdx = totals.indexOf(maxTotal);
  const bars = totals
    .map((n, j) => {
      const isPeak = j === peakIdx;
      const pct = n > 0 ? Math.max(8, Math.round((n / maxTotal) * 100)) : 6;
      return `
      <div class="ins-bar-col">
        <div class="ins-bar-inner${isPeak ? " peak" : ""}"
             style="height:${pct}%;width:100%"></div>
        <span class="ins-bar-day${isPeak ? " peak" : ""}">${esc(labels[j])}</span>
      </div>`;
    })
    .join("");

  return `<div class="ins-card">
    <div class="ins-bars">${bars}</div>
  </div>`;
}

// ─── Top qui progresse ────────────────────────────────────────
function renderTopProgresse(list, isSemaine) {
  if (list.length === 0) {
    return `<div class="ins-empty">
      Aucun élève avec des validations ${isSemaine ? "cette semaine" : "ce mois"}.
    </div>`;
  }
  return `<div class="ins-prog-list">
    ${list
      .map((e, i) => {
        const nom = esc(`${e.prenom || ""} ${e.nom || ""}`.trim() || "Élève");
        const valsCount = isSemaine ? e.valsWeek || 0 : e.valsMonth || 0;
        const color = avatarColor(e.id);
        const inits = esc(initiales(e.prenom, e.nom));
        let avHtml;
        if (e.avatar_url) {
          avHtml = `<img src="${esc(e.avatar_url)}" alt="" width="32" height="32"
                        style="border-radius:50%;object-fit:cover;" loading="lazy">`;
        } else {
          avHtml = `<span class="ins-prog-av" style="background:${color}">${inits}</span>`;
        }
        return `<div class="ins-prog-row" data-eleve-id="${esc(e.id)}"
                     role="button" tabindex="0" aria-label="Livret de ${nom}"
                     style="animation:insBtIn .3s ease ${i * 50}ms both">
          ${avHtml}
          <span class="ins-prog-nom">${nom}</span>
          <span class="ins-prog-delta">+${valsCount}<small> validations</small></span>
        </div>`;
      })
      .join("")}
  </div>`;
}

// ─── Liste eleves avancent / en pause ─────────────────────────
function renderElevesList(tab, data) {
  const list = tab === "progressent" ? data.topProgressent : data.topStagnent;
  if (list.length === 0) {
    const txt =
      tab === "progressent"
        ? "Aucun élève avec des validations cette semaine."
        : "Personne en pause — tout le monde avance !";
    return `<div class="ins-empty">${txt}</div>`;
  }
  return `<div class="ins-prog-list">
    ${list
      .map((e, i) => {
        const nom = esc(`${e.prenom || ""} ${e.nom || ""}`.trim() || "Élève");
        const color = avatarColor(e.id);
        const inits = esc(initiales(e.prenom, e.nom));
        let avHtml;
        if (e.avatar_url) {
          avHtml = `<img src="${esc(e.avatar_url)}" alt="" width="32" height="32"
                        style="border-radius:50%;object-fit:cover;" loading="lazy">`;
        } else {
          avHtml = `<span class="ins-prog-av" style="background:${color}">${inits}</span>`;
        }
        const meta =
          tab === "progressent"
            ? `+${e.valsWeek || 0} validations cette semaine`
            : `Aucune validation depuis ${e.daysAgo ? `${e.daysAgo} jours` : "longtemps"}`;
        return `<div class="ins-prog-row" data-eleve-id="${esc(e.id)}"
                     role="button" tabindex="0" aria-label="Livret de ${nom}"
                     style="animation:insBtIn .3s ease ${i * 50}ms both">
          ${avHtml}
          <div style="flex:1;min-width:0">
            <div class="ins-prog-nom">${nom}</div>
            <div style="font:500 11px/1 'Inter',sans-serif;color:#a3a9c4;margin-top:3px">${esc(meta)}</div>
          </div>
        </div>`;
      })
      .join("")}
  </div>`;
}

// ─── Recommandations ──────────────────────────────────────────
function renderRecoSection({ recos }) {
  const cards = recos
    .map(
      (r) => `
    <div class="ins-reco-card${r.route ? " ins-reco-card--link" : ""}"
         ${r.route ? `data-route="${esc(r.route)}" role="button" tabindex="0"` : ""}>
      <span class="ins-reco-icon">${r.icon}</span>
      <div class="ins-reco-body">
        <div class="ins-reco-ttl">${esc(r.ttl)}</div>
        <div class="ins-reco-txt">${r.txt}</div>
      </div>
    </div>
  `,
    )
    .join("");

  return `<div class="ins-reco-list">${cards}</div>`;
}

// ─── Wire ─────────────────────────────────────────────────────
function wireAll(root, me, data) {
  // Segment periode
  root.querySelectorAll(".ins-seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      haptic("select");
      _period = btn.dataset.period;
      root
        .querySelectorAll(".ins-seg-btn")
        .forEach((b) => b.classList.toggle("active", b === btn));
      // Re-render le contenu du body
      const bodyEl = root.querySelector(".ins-body");
      if (bodyEl) {
        bodyEl.innerHTML = renderPeriodContent(data);
        wireBodyEvents(root, me, data);
      }
      track("insights.period.click", { period: _period });
    });
  });

  wireBodyEvents(root, me, data);
}

function wireBodyEvents(root, me, data) {
  // Tabs avancent / en pause
  root.querySelectorAll(".ins-tab[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      haptic("select");
      _tab = btn.dataset.tab;
      root
        .querySelectorAll(".ins-tab")
        .forEach((b) => b.classList.toggle("active", b === btn));
      const listEl = root.querySelector("#ins-eleves-list");
      if (listEl) {
        listEl.innerHTML = renderElevesList(_tab, data);
        wireEleveRows(listEl);
      }
      track("insights.tab.click", { tab: _tab });
    });
  });

  // Lignes eleves (top progresse + liste tabs)
  wireEleveRows(root);

  // Reco cards
  root.querySelectorAll(".ins-reco-card--link[data-route]").forEach((card) => {
    const handler = () => {
      haptic("impact");
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
  container.querySelectorAll(".ins-prog-row[data-eleve-id]").forEach((row) => {
    const handler = () => {
      haptic("impact");
      track("insights.eleve.open", { eleve_id: row.dataset.eleveId });
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
