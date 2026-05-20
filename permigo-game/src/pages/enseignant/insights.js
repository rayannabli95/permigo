// ═══════════════════════════════════════════════════════════════
// Enseignant — Insights
// KPI perso + heatmap + top élèves + difficulté comps + reco IA
// ═══════════════════════════════════════════════════════════════
import { sb }          from '@/auth/auth.js';
import { getCurUser }  from '@/auth/cur-user.js';
import { toast }       from '@/components/toast.js';
import { esc }         from '@/utils/escape.js';
import { track }       from '@/services/analytics.js';
import { navigate }    from '@/router.js';
import { REMC }        from '@/data/remc.js';
import { labelComp }   from '@/utils/remc-label.js';
import { iconBadge, icon } from '@/utils/icons.js';

// ─── Constantes ───────────────────────────────────────────────
const AVATARS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,#0891b2,#155e75)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
  'linear-gradient(135deg,#0e7c66,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#a16207,#713f12)',
  'linear-gradient(135deg,#dc2626,#7f1d1d)',
  'linear-gradient(135deg,#059669,#064e3b)',
];

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

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
    font: 700 26px/1.15 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -.025em;
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
    background: #e2e6f2;
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
    border-radius: 24px;
    padding: 18px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 6px 16px -8px rgba(10,13,26,.08);
    animation: insWidgetIn .45s cubic-bezier(.23,1,.32,1) both;
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
  .ins-widget-delta {
    font: 700 12px/1 'IBM Plex Mono', monospace;
    margin-top: 5px;
  }
  .ins-widget-delta.up   { color: #10b981; }
  .ins-widget-delta.down { color: #ef4444; }
  .ins-widget-delta.flat { color: #94a3b8; }

  /* Heatmap */
  .ins-heatmap-wrap {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04);
    overflow-x: auto;
  }
  .ins-heatmap-grid {
    display: grid;
    grid-template-columns: 28px repeat(24, 11px);
    gap: 2px;
    min-width: 316px;
  }
  .ins-hmap-day-lbl {
    font: 500 10px/11px 'Inter', sans-serif;
    color: var(--mu2);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 4px;
  }
  .ins-hmap-hour-lbl {
    font: 500 9px/1 'Inter', sans-serif;
    color: var(--mu2);
    text-align: center;
  }
  .ins-hmap-cell {
    width: 11px;
    height: 11px;
    border-radius: 2px;
    background: rgba(99,102,241,.07);
    cursor: default;
  }
  .ins-heatmap-legend {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    font: 500 10px/1 'Inter', sans-serif;
    color: var(--mu2);
  }
  .ins-heatmap-legend-scale {
    display: flex;
    gap: 2px;
  }
  .ins-heatmap-legend-cell {
    width: 11px; height: 11px;
    border-radius: 2px;
  }

  /* Top élèves rows */
  .ins-eleve-row {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 16px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    min-height: 44px;
    transition: border-color .15s cubic-bezier(.23,1,.32,1),
                transform .15s cubic-bezier(.23,1,.32,1);
    margin-bottom: 6px;
  }
  @media (hover: hover) and (pointer: fine) {
    .ins-eleve-row:hover { border-color: #6366f1; }
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
    border-radius: 12px;
    flex-shrink: 0;
  }
  .ins-badge-green  { color: #059669; background: rgba(16,185,129,.1); }
  .ins-badge-orange { color: #d97706; background: rgba(245,158,11,.1); }
  .ins-badge-red    { color: #dc2626; background: rgba(239,68,68,.1); }

  /* Tabs progressent/stagnent */
  .ins-tabs {
    display: flex;
    gap: 4px;
    background: var(--bg2);
    padding: 4px;
    border-radius: 12px;
    margin-bottom: 12px;
  }
  .ins-tab {
    flex: 1;
    padding: 8px 6px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font: 600 12px/1 'Inter', sans-serif;
    color: var(--mu2);
    cursor: pointer;
    min-height: 36px;
    transition: background .15s, color .15s;
  }
  .ins-tab.active {
    background: var(--su);
    color: #6366f1;
    box-shadow: 0 1px 2px rgba(10,13,26,.06);
  }

  /* Difficulté comps */
  .ins-diff-row {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 16px;
    padding: 12px 14px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
  }
  .ins-diff-code {
    font: 600 11px/1 'IBM Plex Mono', monospace;
    color: #6366f1;
    background: rgba(99,102,241,.1);
    padding: 4px 7px;
    border-radius: 6px;
    flex-shrink: 0;
  }
  .ins-diff-info { flex: 1; min-width: 0; }
  .ins-diff-name {
    font: 500 13px/1.3 'Inter', sans-serif;
    color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 5px;
  }
  .ins-diff-bar-wrap {
    height: 4px;
    background: var(--bg2);
    border-radius: 2px;
    overflow: hidden;
  }
  .ins-diff-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width .5s cubic-bezier(.23,1,.32,1);
  }
  .ins-diff-count {
    font: 600 12px/1 'Inter', sans-serif;
    color: #dc2626;
    flex-shrink: 0;
  }

  /* Recommandations */
  .ins-reco-list { display: flex; flex-direction: column; gap: 8px; }
  .ins-reco-card {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 16px;
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
    border-radius: 20px;
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
    border-radius: 16px;
  }
</style>`;

// ─── Helpers ──────────────────────────────────────────────────
function initials(prenom, nom) {
  const p = (prenom || '')[0] || '';
  const parts = (nom || '').trim().split(/\s+/);
  const n = parts.length > 1
    ? (parts[parts.length - 1].replace(/\./g, '')[0] || p)
    : (parts[0]?.[1] || p);
  return (p + n).toUpperCase() || '?';
}

function monthBounds(offset = 0) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + offset;
  const start = new Date(y, m, 1);
  const end   = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function daysAgoISO(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

// ─── Module state ─────────────────────────────────────────────
let _tab = 'progressent'; // 'progressent' | 'stagnent'

// ─── Entry ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page.view', { page: 'insights', role: me.role });

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
  const thisMonth  = monthBounds(0);
  const prevMonth  = monthBounds(-1);
  const ago60      = daysAgoISO(60);
  const ago14      = daysAgoISO(14);

  const [
    valsCeMois,
    valsMoisPrev,
    vals60j,
    mesEleves,
    myProfile,
    quizAttempts,
    valsARetravailler,
  ] = await Promise.all([
    // Validations ce mois
    sb.from('validations')
      .select('eleve_id, competence_id, statut, validated_at')
      .eq('validated_by', me.id)
      .gte('validated_at', thisMonth.start)
      .lte('validated_at', thisMonth.end),

    // Validations mois précédent (pour delta)
    sb.from('validations')
      .select('id', { count: 'exact', head: true })
      .eq('validated_by', me.id)
      .gte('validated_at', prevMonth.start)
      .lte('validated_at', prevMonth.end),

    // Validations 60 derniers jours (heatmap)
    sb.from('validations')
      .select('validated_at')
      .eq('validated_by', me.id)
      .gte('validated_at', ago60),

    // Mes élèves attitrés
    sb.from('profiles')
      .select('id, prenom, nom, last_active_at')
      .eq('enseignant_id', me.id)
      .eq('role', 'eleve'),

    // Mon profil (streak_pro_days si la colonne existe)
    sb.from('profiles')
      .select('streak_pro_days, xp')
      .eq('id', me.id)
      .single(),

    // Quiz attempts de mes élèves (taux réussite)
    sb.from('quiz_attempts')
      .select('user_id, score, created_at')
      .in('user_id', [me.id]) // sera remplacé après avoir les IDs élèves
      .limit(1), // placeholder, on refera la query plus bas

    // Validations "à retravailler" par moi (difficulté)
    sb.from('validations')
      .select('competence_id, eleve_id')
      .eq('validated_by', me.id)
      .eq('statut', 'a_retravailler'),
  ]);

  const elevesData    = mesEleves.data || [];
  const eleveIds      = elevesData.map(e => e.id);
  const valsThisMonth = valsCeMois.data || [];
  const vals60Data    = vals60j.data || [];

  // Quiz attempts réels pour mes élèves
  let quizData = [];
  if (eleveIds.length > 0) {
    const { data: qa } = await sb
      .from('quiz_attempts')
      .select('user_id, score, created_at')
      .in('user_id', eleveIds)
      .gte('created_at', daysAgoISO(30));
    quizData = qa || [];
  }

  // Validations ce mois par élève (pour top progressent)
  const compsCeMoisByEleve = {};
  valsThisMonth.forEach(v => {
    if (!compsCeMoisByEleve[v.eleve_id]) compsCeMoisByEleve[v.eleve_id] = 0;
    if (v.statut === 'acquis') compsCeMoisByEleve[v.eleve_id]++;
  });

  // Last validation par élève (pour stagnation)
  const lastValByEleve = {};
  vals60Data.forEach(v => {
    // On a besoin de la date par élève → on fetch séparément
  });

  // Fetch last validation per élève pour stagnation
  let lastValMap = {};
  if (eleveIds.length > 0) {
    const { data: lastVals } = await sb
      .from('validations')
      .select('eleve_id, validated_at')
      .eq('validated_by', me.id)
      .in('eleve_id', eleveIds)
      .order('validated_at', { ascending: false });

    (lastVals || []).forEach(v => {
      if (!lastValMap[v.eleve_id]) lastValMap[v.eleve_id] = v.validated_at;
    });
  }

  // ── KPI calculs ──────────────────────────────────────────────
  const valsCeMoisCount = valsThisMonth.filter(v => v.statut === 'acquis').length;
  const valsPrevCount   = valsMoisPrev.count ?? 0;
  const delta = valsPrevCount > 0
    ? Math.round(((valsCeMoisCount - valsPrevCount) / valsPrevCount) * 100)
    : null;

  const nbElevesAccompagnes = eleveIds.length;

  const quizTotal   = quizData.length;
  const quizSuccess = quizData.filter(q => (q.score ?? 0) >= 60).length;
  const tauxQuiz    = quizTotal > 0 ? Math.round((quizSuccess / quizTotal) * 100) : null;

  const streakPro = myProfile.data?.streak_pro_days ?? null;

  // ── Heatmap [jour 0-6][heure 0-23] ───────────────────────────
  const heatmap = Array.from({ length: 7 }, () => new Array(24).fill(0));
  let heatmapMax = 0;
  vals60Data.forEach(v => {
    const d = new Date(v.validated_at);
    const jour = (d.getDay() + 6) % 7; // Lun=0 ... Dim=6
    const heure = d.getHours();
    heatmap[jour][heure]++;
    if (heatmap[jour][heure] > heatmapMax) heatmapMax = heatmap[jour][heure];
  });

  // ── Top élèves ────────────────────────────────────────────────
  const elevesAvecPrenom = elevesData.map((e, i) => ({ ...e, idx: i }));

  const topProgressent = elevesAvecPrenom
    .filter(e => (compsCeMoisByEleve[e.id] || 0) >= 2)
    .sort((a, b) => (compsCeMoisByEleve[b.id] || 0) - (compsCeMoisByEleve[a.id] || 0))
    .slice(0, 3)
    .map(e => ({ ...e, compsThisMonth: compsCeMoisByEleve[e.id] || 0 }));

  const topStagnent = elevesAvecPrenom
    .filter(e => {
      const lastVal = lastValMap[e.id];
      const hasActivity = lastVal != null || e.last_active_at != null;
      const inactive14j = !lastVal || lastVal < ago14;
      return hasActivity && inactive14j && (compsCeMoisByEleve[e.id] || 0) === 0;
    })
    .slice(0, 3)
    .map(e => {
      const lastVal = lastValMap[e.id];
      const daysAgo = lastVal
        ? Math.floor((Date.now() - new Date(lastVal).getTime()) / 86400000)
        : null;
      return { ...e, daysAgo };
    });

  // ── Carte difficulté ──────────────────────────────────────────
  const diffByComp = {};
  (valsARetravailler.data || []).forEach(v => {
    if (!diffByComp[v.competence_id]) diffByComp[v.competence_id] = new Set();
    diffByComp[v.competence_id].add(v.eleve_id);
  });
  const topDiff = Object.entries(diffByComp)
    .map(([compId, elevesSet]) => ({ compId, count: elevesSet.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxDiff = topDiff[0]?.count || 1;

  // ── Recommandations IA (algo simple) ─────────────────────────
  const recos = [];
  if (streakPro !== null && streakPro < 3) {
    recos.push({
      icon: icon('target', { size: 18, strokeWidth: 2, color: '#6366f1' }),
      ttl: 'Lance ta semaine',
      txt: 'Valide 1 compétence avec un élève actif pour relancer ton streak pro.',
      route: '#/validation',
    });
  }
  if (topStagnent.length > 0) {
    const e = topStagnent[0];
    const nm = esc(`${e.prenom || ''} ${e.nom || ''}`.trim());
    const since = e.daysAgo ? `depuis ${e.daysAgo}j` : 'depuis un moment';
    recos.push({
      icon: icon('alert-triangle', { size: 18, strokeWidth: 2, color: '#d97706' }),
      ttl: `Relance ${nm}`,
      txt: `${nm} n'a plus validé ${since}. Un point en leçon peut débloquer la progression.`,
      route: `#/livret/${e.id}`,
    });
  }
  if (topDiff.length > 0) {
    const d = topDiff[0];
    const nm = esc(labelComp(d.compId));
    recos.push({
      icon: icon('search', { size: 18, strokeWidth: 2, color: '#0891b2' }),
      ttl: `Débrief sur ${d.compId}`,
      txt: `${d.count} élève${d.count > 1 ? 's' : ''} bloqué${d.count > 1 ? 's' : ''} sur "${nm}". Prévois un point pédagogique dédié.`,
      route: `#/eleves?bloque_sur=${encodeURIComponent(d.compId)}`,
    });
  }
  if (recos.length === 0) {
    recos.push({
      icon: icon('check-circle', { size: 18, strokeWidth: 2, color: '#059669' }),
      ttl: 'Tout roule',
      txt: 'Tes élèves progressent bien. Continue sur cette lancée !',
      route: null,
    });
  }

  return {
    valsCeMoisCount, valsPrevCount, delta,
    nbElevesAccompagnes,
    tauxQuiz, streakPro,
    heatmap, heatmapMax,
    topProgressent, topStagnent,
    topDiff, maxDiff,
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
        <p class="ins-sub">Votre activité pédagogique · 60 derniers jours</p>
      </header>

      ${renderKpis(data)}
      ${renderHeatmapSection(data)}
      ${renderTopElevesSection(data)}
      ${renderDiffSection(data)}
      ${renderRecoSection(data)}
    </div>
  `;
}

// ── KPI 2×2 ───────────────────────────────────────────────────
function renderKpis({ valsCeMoisCount, valsPrevCount, delta, nbElevesAccompagnes, tauxQuiz, streakPro }) {
  const deltaHtml = delta === null
    ? `<p class="ins-widget-delta flat">Premier mois</p>`
    : delta > 0
      ? `<p class="ins-widget-delta up">▲ ${delta}% vs mois précédent</p>`
      : delta < 0
        ? `<p class="ins-widget-delta down">▼ ${Math.abs(delta)}% vs mois précédent</p>`
        : `<p class="ins-widget-delta flat">= Stable vs mois précédent</p>`;

  const streakVal  = streakPro !== null ? streakPro : '—';
  const tauxVal    = tauxQuiz !== null  ? `${tauxQuiz}%` : '—';

  return `
    <div class="ins-widgets" id="ins-kpi-grid">
      <div class="ins-widget">
        <div class="ins-widget-head">
          ${iconBadge('check', { color: '#10b981', size: 32 })}
          <span class="ins-widget-lbl">Validées</span>
        </div>
        <p class="ins-widget-val">${valsCeMoisCount}</p>
        <p class="ins-widget-sub">Ce mois</p>
        ${deltaHtml}
      </div>

      <div class="ins-widget">
        <div class="ins-widget-head">
          ${iconBadge('users', { color: '#6366f1', size: 32 })}
          <span class="ins-widget-lbl">Élèves</span>
        </div>
        <p class="ins-widget-val">${nbElevesAccompagnes}</p>
        <p class="ins-widget-sub">Attitrés</p>
      </div>

      <div class="ins-widget">
        <div class="ins-widget-head">
          ${iconBadge('target', { color: '#8b5cf6', size: 32 })}
          <span class="ins-widget-lbl">Taux quiz</span>
        </div>
        <p class="ins-widget-val">${tauxVal}</p>
        <p class="ins-widget-sub">Score ≥ 60% (30j)</p>
      </div>

      <div class="ins-widget">
        <div class="ins-widget-head">
          ${iconBadge('flame', { color: '#f59e0b', size: 32 })}
          <span class="ins-widget-lbl">Streak pro</span>
        </div>
        <p class="ins-widget-val">${streakVal}</p>
        <p class="ins-widget-sub">Jours consécutifs</p>
      </div>
    </div>
  `;
}

// ── Heatmap ───────────────────────────────────────────────────
function renderHeatmapSection({ heatmap, heatmapMax }) {
  // Ligne header heures (toutes les 4h)
  const headerCells = [];
  headerCells.push(`<div></div>`); // espace pour label jour
  for (let h = 0; h < 24; h++) {
    headerCells.push(
      h % 4 === 0
        ? `<div class="ins-hmap-hour-lbl">${h}h</div>`
        : `<div></div>`
    );
  }

  // Rows jours
  const rows = JOURS.map((jour, j) => {
    const cells = heatmap[j].map((count, h) => {
      const intensity = heatmapMax > 0 ? count / heatmapMax : 0;
      const alpha = 0.07 + intensity * 0.88;
      const bg = count === 0
        ? 'rgba(99,102,241,.07)'
        : `rgba(99,102,241,${alpha.toFixed(2)})`;
      const title = count > 0 ? `${jour} ${h}h — ${count} validation${count > 1 ? 's' : ''}` : '';
      return `<div class="ins-hmap-cell" style="background:${bg}" ${title ? `title="${title}"` : ''}></div>`;
    }).join('');
    return `<div class="ins-hmap-day-lbl">${jour}</div>${cells}`;
  }).join('');

  // Légende
  const legendCells = [.07, .25, .45, .65, .90].map(a =>
    `<div class="ins-heatmap-legend-cell" style="background:rgba(99,102,241,${a})"></div>`
  ).join('');

  return `
    <div class="ins-section">
      <div class="ins-section-title">Quand je valide — 60 derniers jours</div>
      <div class="ins-heatmap-wrap">
        <div class="ins-heatmap-grid">
          ${headerCells.join('')}
          ${rows}
        </div>
        <div class="ins-heatmap-legend">
          <span>Moins</span>
          <div class="ins-heatmap-legend-scale">${legendCells}</div>
          <span>Plus</span>
        </div>
      </div>
    </div>
  `;
}

// ── Top élèves ────────────────────────────────────────────────
function renderTopElevesSection({ topProgressent, topStagnent }) {
  return `
    <div class="ins-section" id="ins-top-section">
      <div class="ins-section-title">Élèves</div>
      <div class="ins-tabs" role="tablist">
        <button class="ins-tab active" data-tab="progressent" role="tab"
                style="display:flex;align-items:center;gap:5px;">
          ${icon('trending-up', { size: 14, strokeWidth: 2.2 })} Progressent (${topProgressent.length})
        </button>
        <button class="ins-tab" data-tab="stagnent" role="tab"
                style="display:flex;align-items:center;gap:5px;">
          ${icon('alert-triangle', { size: 14, strokeWidth: 2.2 })} Stagnent (${topStagnent.length})
        </button>
      </div>
      <div id="ins-eleves-list">
        ${renderElevesList('progressent', topProgressent, topStagnent)}
      </div>
    </div>
  `;
}

function renderElevesList(tab, topProgressent, topStagnent) {
  const list = tab === 'progressent' ? topProgressent : topStagnent;
  if (list.length === 0) {
    const empty = tab === 'progressent'
      ? 'Aucun élève avec ≥ 2 compétences ce mois encore.'
      : 'Aucun élève en stagnation — tout le monde progresse !';
    return `<div class="ins-empty">${empty}</div>`;
  }
  return list.map((e, i) => {
    const ini   = initials(e.prenom, e.nom);
    const grad  = AVATARS[e.idx % AVATARS.length];
    const nom   = esc(`${e.prenom || ''} ${e.nom || ''}`.trim() || 'Élève');
    const badge = tab === 'progressent'
      ? `<span class="ins-badge ins-badge-green">+${e.compsThisMonth} ce mois</span>`
      : `<span class="ins-badge ins-badge-orange">${e.daysAgo ? `${e.daysAgo}j inactif` : 'Inactif'}</span>`;
    const meta  = tab === 'progressent'
      ? `${e.compsThisMonth} compétence${e.compsThisMonth > 1 ? 's' : ''} acquise${e.compsThisMonth > 1 ? 's' : ''} ce mois`
      : `Aucune validation depuis ${e.daysAgo ? `${e.daysAgo} jours` : 'longtemps'}`;
    return `
      <div class="ins-eleve-row" data-eleve-id="${esc(e.id)}" data-tab="${tab}"
           role="button" tabindex="0" aria-label="Livret de ${nom}"
           style="animation: insWidgetIn .3s cubic-bezier(.23,1,.32,1) ${i * 50}ms both">
        <div class="ins-eleve-av" style="background:${grad}">${esc(ini)}</div>
        <div class="ins-eleve-info">
          <div class="ins-eleve-name">${nom}</div>
          <div class="ins-eleve-meta">${meta}</div>
        </div>
        ${badge}
        <span aria-hidden="true" style="color:#94a3b8;font-size:14px">›</span>
      </div>
    `;
  }).join('');
}

// ── Difficulté comps ──────────────────────────────────────────
function renderDiffSection({ topDiff, maxDiff }) {
  if (topDiff.length === 0) {
    return `
      <div class="ins-section">
        <div class="ins-section-title">Compétences difficiles</div>
        <div class="ins-empty">Aucune compétence en difficulté détectée.</div>
      </div>
    `;
  }
  const rows = topDiff.map(({ compId, count }) => {
    const pct = Math.round((count / maxDiff) * 100);
    const r = Math.round(239 - (count / maxDiff) * 120);
    const color = `rgb(${r}, 68, 68)`;
    return `
      <div class="ins-diff-row" data-comp-id="${esc(compId)}" role="button" tabindex="0" style="cursor:pointer;">
        <span class="ins-diff-code">${esc(compId)}</span>
        <div class="ins-diff-info">
          <div class="ins-diff-name">${esc(labelComp(compId))}</div>
          <div class="ins-diff-bar-wrap">
            <div class="ins-diff-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
        </div>
        <span class="ins-diff-count">${count} élève${count > 1 ? 's' : ''}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="ins-section">
      <div class="ins-section-title">Compétences difficiles</div>
      ${rows}
    </div>
  `;
}

// ── Recommandations ───────────────────────────────────────────
function renderRecoSection({ recos }) {
  const cards = recos.map(r => `
    <div class="ins-reco-card${r.route ? ' ins-reco-card--link' : ''}"
         ${r.route ? `data-route="${esc(r.route)}" role="button" tabindex="0" style="cursor:pointer;"` : ''}>
      <span class="ins-reco-icon">${r.icon}</span>
      <div class="ins-reco-body">
        <div class="ins-reco-ttl">${esc(r.ttl)}</div>
        <div class="ins-reco-txt">${r.txt}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="ins-section">
      <div class="ins-section-title">Recommandations</div>
      <div class="ins-reco-list">${cards}</div>
    </div>
  `;
}

// ─── Wire ─────────────────────────────────────────────────────
function wireAll(root, me, data) {
  // Tabs progressent/stagnent
  root.querySelectorAll('.ins-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _tab = btn.dataset.tab;
      root.querySelectorAll('.ins-tab').forEach(b => b.classList.toggle('active', b === btn));
      const listEl = root.querySelector('#ins-eleves-list');
      if (listEl) {
        listEl.innerHTML = renderElevesList(_tab, data.topProgressent, data.topStagnent);
        wireEleveRows(listEl);
      }
      track('insights.tab.click', { tab: _tab });
    });
  });

  // Élèves rows initials
  wireEleveRows(root);

  // Reco cards → navigate to route
  root.querySelectorAll('.ins-reco-card--link[data-route]').forEach(card => {
    const handler = () => {
      track('insights.reco.click', { route: card.dataset.route });
      navigate(card.dataset.route);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });

  // Diff rows → filtre élèves bloqués sur cette comp
  root.querySelectorAll('.ins-diff-row[data-comp-id]').forEach(row => {
    const handler = () => {
      track('insights.diff.click', { comp_id: row.dataset.compId });
      navigate(`#/eleves?bloque_sur=${encodeURIComponent(row.dataset.compId)}`);
    };
    row.addEventListener('click', handler);
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
}

function wireEleveRows(container) {
  container.querySelectorAll('.ins-eleve-row[data-eleve-id]').forEach(row => {
    const handler = () => {
      track('insights.eleve.open', { eleve_id: row.dataset.eleveId, tab: _tab });
      navigate(`#/livret/${row.dataset.eleveId}`);
    };
    row.addEventListener('click', handler);
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
}
