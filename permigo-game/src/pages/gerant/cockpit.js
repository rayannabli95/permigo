// ═══════════════════════════════════════════════════════════════
// Gérant — Cockpit Bloomberg (dark theme)
// RPC : get_gerant_cockpit → { kpis, cohorts, top_moniteurs, alerts }
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/common/toast.js';
import { track } from '@/services/analytics.js';
import { icon } from '@/utils/icons.js';
import { navigate } from '@/router.js';
import { haptic } from '@/utils/haptic.js';

// ─── Design tokens ────────────────────────────────────────────────
const BG   = 'var(--ink)';
const SURF = 'var(--ink)';
const SURF2 = '#1a2236';
const BORD = 'var(--ink4)';
const TEXT = 'var(--bg4)';
const MUTED = 'var(--mu3)';
const ACC  = 'var(--a)';

// KPI definitions — used to normalize RPC object → array
const KPI_DEFS = [
  { key: 'eleves_actifs',    label: 'Élèves actifs',    color: ACC,       unit: null },
  { key: 'moniteurs_actifs', label: 'Moniteurs actifs', color: 'var(--gr)', unit: null },
  { key: 'taux_reussite_90j', label: 'Taux réussite 90j', color: 'var(--gr)', unit: '%'  },
  { key: 'heures_30j',       label: 'Heures 30j',       color: 'var(--am)', unit: 'h'  },
  { key: 'nouveaux_30j',     label: 'Nouveaux 30j',     color: 'var(--pu)', unit: null },
  { key: 'validations_30j',  label: 'Validations 30j',  color: ACC,       unit: null },
];

// Normalize RPC response which can return kpis/cohorts as objects instead of arrays
function normalizeRpcData(data) {
  if (!data) return { kpis: [], cohorts: [], top_moniteurs: [], alerts: [] };

  let kpis = data.kpis;
  if (kpis && !Array.isArray(kpis)) {
    const obj = kpis;
    kpis = KPI_DEFS
      .filter(def => obj[def.key] !== undefined && obj[def.key] !== null)
      .map(def => ({ key: def.key, label: def.label, color: def.color, unit: def.unit, value: obj[def.key], delta: null }));
  }

  let cohorts = data.cohorts;
  if (cohorts && !Array.isArray(cohorts)) {
    cohorts = Object.entries(cohorts)
      .filter(([k]) => COHORT_ORDER.includes(k))
      .map(([k, v]) => ({ cohort: k, key: k, count: typeof v === 'number' ? v : (v?.count ?? 0) }));
  }

  return {
    kpis:          kpis ?? [],
    cohorts:       cohorts ?? [],
    top_moniteurs: Array.isArray(data.top_moniteurs) ? data.top_moniteurs : [],
    alerts:        Array.isArray(data.alerts) ? data.alerts : [],
  };
}

const COHORT_META = {
  champion: { label: 'Champion',  color: 'var(--gr)', icon: 'award' },
  engage:   { label: 'Engagé',    color: 'var(--a)', icon: 'zap' },
  a_risque: { label: 'À risque',  color: 'var(--am)', icon: 'alert-triangle' },
  inactif:  { label: 'Inactif',   color: 'var(--mu3)', icon: 'moon' },
  bloque:   { label: 'Bloqué',    color: 'var(--rd)', icon: 'x-circle' },
};
const COHORT_ORDER = ['champion', 'engage', 'a_risque', 'inactif', 'bloque'];

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.ck {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 0 110px;
  background: ${BG};
  font-family: 'Inter', sans-serif;
  color: ${TEXT};
  min-height: 100dvh;
}

/* ── Skeleton ── */
.ck-skel {
  background: linear-gradient(90deg, ${SURF} 0%, ${SURF2} 50%, ${SURF} 100%);
  background-size: 200% 100%;
  animation: ckShim 1.6s ease-in-out infinite;
  border-radius: 16px;
}
@keyframes ckShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* ── Header ── */
.ck-hd {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 20;
  background: ${BG};
  border-bottom: 1px solid ${BORD};
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.ck-hd-logo {
  font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
  color: ${ACC};
  letter-spacing: -.02em;
  flex-shrink: 0;
}
.ck-hd-school {
  font: 600 13px/1 'Inter', sans-serif;
  color: ${TEXT};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ck-hd-date {
  font: 500 11px/1 'Inter', sans-serif;
  color: ${MUTED};
  white-space: nowrap;
  flex-shrink: 0;
}
.ck-refresh-btn {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid ${BORD};
  background: ${SURF};
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: ${MUTED};
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: color .12s, background .12s;
}
.ck-refresh-btn:active { color: ${ACC}; background: ${SURF2}; }
.ck-refresh-btn.spinning svg { animation: ckSpin .6s linear infinite; }
@keyframes ckSpin { to { transform: rotate(360deg); } }

/* ── Section ── */
.ck-section {
  padding: 20px 16px 0;
}
.ck-section-hd {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 12px;
}
.ck-section-title {
  font: 700 11px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: ${MUTED};
}
.ck-section-action {
  font: 600 11px/1 'Inter', sans-serif;
  color: ${ACC};
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* ═══════════ KPIs ═══════════ */
.ck-kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.ck-kpi {
  background: ${SURF};
  border: 1px solid ${BORD};
  border-radius: 16px;
  padding: 18px 16px;
  position: relative;
  overflow: hidden;
  transition: border-color .12s;
  cursor: default;
}
.ck-kpi::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--kpi-color, ${ACC});
  opacity: .7;
}
.ck-kpi-label {
  font: 500 10.5px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: ${MUTED};
  margin-bottom: 10px;
}
.ck-kpi-val {
  font: 800 28px/1 'IBM Plex Mono', 'Plus Jakarta Sans', monospace;
  font-variant-numeric: tabular-nums;
  color: ${TEXT};
  letter-spacing: -.02em;
  margin-bottom: 6px;
}
.ck-kpi-delta {
  display: inline-flex; align-items: center; gap: 3px;
  font: 600 11px/1 'Inter', sans-serif;
  padding: 3px 7px;
  border-radius: 99px;
}
.ck-kpi-delta.up   { color: var(--gr); background: rgba(16,185,129,.12); }
.ck-kpi-delta.down { color: var(--rd); background: rgba(239,68,68,.12); }
.ck-kpi-delta.flat { color: ${MUTED}; background: ${SURF2}; }

/* ═══════════ COHORTES ═══════════ */
.ck-cohort-wrap {
  background: ${SURF};
  border: 1px solid ${BORD};
  border-radius: 20px;
  padding: 20px;
}
.ck-donut-row {
  display: flex;
  align-items: center;
  gap: 20px;
}
.ck-donut-svg { flex-shrink: 0; }
.ck-donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ck-legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
  -webkit-tap-highlight-color: transparent;
  transition: opacity .12s;
}
.ck-legend-row:active { opacity: .7; }
.ck-legend-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ck-legend-label {
  font: 500 12px/1 'Inter', sans-serif;
  color: ${TEXT};
  flex: 1;
}
.ck-legend-val {
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: ${TEXT};
}
.ck-legend-pct {
  font: 500 10px/1 'Inter', sans-serif;
  color: ${MUTED};
  min-width: 32px;
  text-align: right;
}

/* ═══════════ ALERTES ═══════════ */
.ck-alert {
  background: ${SURF};
  border: 1px solid ${BORD};
  border-left: 3px solid var(--alert-color);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: background .12s;
  -webkit-tap-highlight-color: transparent;
}
.ck-alert:active { background: ${SURF2}; }
.ck-alert-ico {
  width: 32px; height: 32px;
  border-radius: 10px;
  background: rgba(var(--alert-rgb), .12);
  display: flex; align-items: center; justify-content: center;
  color: var(--alert-color);
  flex-shrink: 0;
}
.ck-alert-body { flex: 1; min-width: 0; }
.ck-alert-title {
  font: 600 13px/1.3 'Inter', sans-serif;
  color: ${TEXT};
  margin-bottom: 3px;
}
.ck-alert-sub {
  font: 500 11.5px/1.4 'Inter', sans-serif;
  color: ${MUTED};
}
.ck-alert-arrow { color: ${MUTED}; margin-top: 2px; flex-shrink: 0; }
.ck-alerts-empty {
  font: 500 13px/1 'Inter', sans-serif;
  color: ${MUTED};
  padding: 16px 0;
  text-align: center;
}

/* ═══════════ TOP MONITEURS ═══════════ */
.ck-mon-list {
  background: ${SURF};
  border: 1px solid ${BORD};
  border-radius: 20px;
  overflow: hidden;
}
.ck-mon-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid ${BORD};
  cursor: pointer;
  transition: background .12s;
  -webkit-tap-highlight-color: transparent;
}
.ck-mon-row:last-child { border-bottom: none; }
.ck-mon-row:active { background: ${SURF2}; }
.ck-mon-rank {
  font: 700 11px/1 'IBM Plex Mono', monospace;
  color: ${MUTED};
  width: 20px;
  flex-shrink: 0;
  text-align: center;
}
.ck-mon-av {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(88,204,2,.2);
  border: 1px solid rgba(88,204,2,.3);
  display: flex; align-items: center; justify-content: center;
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  color: ${ACC};
  flex-shrink: 0;
}
.ck-mon-info { flex: 1; min-width: 0; }
.ck-mon-name {
  font: 600 13px/1.2 'Inter', sans-serif;
  color: ${TEXT};
  margin-bottom: 4px;
}
.ck-mon-bar-wrap { display: flex; align-items: center; gap: 8px; }
.ck-mon-bar {
  flex: 1;
  height: 3px;
  background: ${BORD};
  border-radius: 99px;
  overflow: hidden;
}
.ck-mon-bar-fill {
  height: 100%;
  background: ${ACC};
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}
.ck-mon-val {
  font: 600 11px/1 'IBM Plex Mono', monospace;
  color: ${MUTED};
  flex-shrink: 0;
}

/* ── Bottom sheet cohorte ── */
.ck-bs-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0);
  z-index: 490; pointer-events: none;
  transition: background .3s;
  animation: none !important;
}
.ck-bs-bg.open { background: rgba(0,0,0,.6); pointer-events: auto; backdrop-filter: blur(4px); }
.ck-bs {
  position: fixed; bottom: 0; left: 0; right: 0;
  z-index: 495;
  background: ${SURF};
  border-top: 1px solid ${BORD};
  border-radius: 28px 28px 0 0;
  transform: translateY(100%) !important;
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  max-height: 85dvh; overflow-y: auto;
  animation: none !important;
}
.ck-bs.open { transform: translateY(0) !important; }
.ck-bs-handle { width: 36px; height: 4px; background: ${BORD}; border-radius: 2px; margin: 14px auto 0; }
.ck-bs-hd { padding: 16px 20px 14px; border-bottom: 1px solid ${BORD}; }
.ck-bs-title { font: 700 16px/1.2 'Plus Jakarta Sans', sans-serif; color: ${TEXT}; }
.ck-bs-sub { font: 500 12px/1 'Inter', sans-serif; color: ${MUTED}; margin-top: 4px; }
.ck-bs-list { padding: 8px 0; }
.ck-bs-eleve {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid ${BORD};
  cursor: pointer; transition: background .12s;
}
.ck-bs-eleve:last-child { border-bottom: none; }
.ck-bs-eleve:active { background: ${SURF2}; }
.ck-bs-av {
  width: 36px; height: 36px; border-radius: 10px;
  background: ${SURF2}; border: 1px solid ${BORD};
  display: flex; align-items: center; justify-content: center;
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif; color: ${TEXT};
  flex-shrink: 0;
}
.ck-bs-eleve-name { font: 600 13px/1.2 'Inter', sans-serif; color: ${TEXT}; flex: 1; }
.ck-bs-eleve-val { font: 600 12px/1 'IBM Plex Mono', monospace; color: ${MUTED}; }

/* Spin utility */
@keyframes spin { to { transform: rotate(360deg); } }
</style>`;

// ─── Entry point ─────────────────────────────────────────────────
let _cockpitData = null;

export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== 'gerant') return;

  track('page.view', { page: 'gerant_cockpit' });

  root.innerHTML = renderSkeleton();
  await loadAndRender(root, me);
}

async function loadAndRender(root, me) {
  try {
    const { data, error } = await sb.rpc('get_gerant_cockpit');
    if (error) throw error;
    const normalized = normalizeRpcData(data);
    _cockpitData = normalized;
    root.innerHTML = render(normalized, me);
    wire(root, me);
  } catch (err) {
    console.error('[cockpit] load failed', err);
    // Fallback: charge quand même les KPI depuis les tables directes
    await loadFallback(root, me);
  }
}

async function loadFallback(root, me) {
  try {
    const { data: profile } = await sb.from('profiles').select('ecole_id').eq('id', me.id).maybeSingle();
    const ecoleId = profile?.ecole_id;

    const [elevesRes, valsRes] = await Promise.allSettled([
      ecoleId ? sb.from('profiles').select('id', { count: 'exact', head: true }).eq('ecole_id', ecoleId).eq('role', 'eleve') : Promise.resolve({ count: 0 }),
      ecoleId ? sb.from('validations').select('id', { count: 'exact', head: true }).gte('validated_at', new Date(Date.now() - 30 * 86400000).toISOString()) : Promise.resolve({ count: 0 }),
    ]);

    const fallbackData = {
      kpis: [
        { key: 'eleves_actifs',    label: 'Élèves actifs',   value: elevesRes.value?.count ?? '—', delta: null, color: ACC },
        { key: 'taux_reussite',    label: 'Taux réussite',   value: '—',  unit: '%', delta: null, color: 'var(--gr)' },
        { key: 'heures_30j',       label: 'Heures 30j',      value: '—',  delta: null, color: 'var(--am)' },
        { key: 'nouveaux_30j',     label: 'Nouveaux 30j',    value: valsRes.value?.count ?? '—', delta: null, color: 'var(--pu)' },
      ],
      cohorts: [],
      top_moniteurs: [],
      alerts: [],
    };
    _cockpitData = fallbackData;
    root.innerHTML = render(fallbackData, me);
    wire(root, me);
  } catch (e) {
    root.innerHTML = `${STYLE}<div style="padding:60px 24px;text-align:center;color:${MUTED}">
      <div style="font:700 18px/1.3 'Plus Jakarta Sans',sans-serif;color:${TEXT};margin-bottom:8px">Cockpit indisponible</div>
      <p style="font-size:13px;margin:0 0 20px">Vérifie ta connexion.</p>
      <button onclick="location.reload()" style="padding:12px 24px;border:0;background:${ACC};color:#fff;border-radius:12px;font:700 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer">Recharger</button>
    </div>`;
  }
}

// ─── Render ───────────────────────────────────────────────────────
function render(data, me) {
  const kpis         = data?.kpis          ?? [];
  const cohorts      = data?.cohorts        ?? [];
  const topMons      = data?.top_moniteurs  ?? [];
  const alerts       = (data?.alerts ?? []).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const maxMon  = Math.max(1, ...topMons.map(m => (m.n_validations ?? m.validations_count) || (m.heures_30j ?? m.heures) || 1));

  return `${STYLE}
<div class="ck">

  <!-- HEADER -->
  <div class="ck-hd">
    <div class="ck-hd-logo">PermiGo</div>
    <div class="ck-hd-school">${esc(me.school_name ?? me.prenom ?? 'Mon école')}</div>
    <div class="ck-hd-date">${esc(dateStr)}</div>
    <button class="ck-refresh-btn" id="ck-refresh" aria-label="Actualiser">
      ${icon('refresh-cw', { size: 14 })}
    </button>
  </div>

  <!-- BLOC 1 — KPIs -->
  <div class="ck-section">
    <div class="ck-section-hd">
      <span class="ck-section-title">Indicateurs</span>
    </div>
    <div class="ck-kpi-grid">
      ${kpis.map((k, i) => renderKpi(k, i)).join('')}
    </div>
  </div>

  <!-- BLOC 2 — COHORTES -->
  <div class="ck-section">
    <div class="ck-section-hd">
      <span class="ck-section-title">Groupes d'élèves</span>
    </div>
    <div class="ck-cohort-wrap">
      ${cohorts.length > 0 ? renderDonut(cohorts) : `<div style="text-align:center;padding:24px 0;font:500 13px/1 'Inter',sans-serif;color:${MUTED}">Données non disponibles</div>`}
    </div>
  </div>

  <!-- BLOC 3 — ALERTES -->
  <div class="ck-section">
    <div class="ck-section-hd">
      <span class="ck-section-title">Alertes</span>
      ${alerts.length > 0 ? `<span class="ck-kpi-delta down">${alerts.filter(a => a.severity === 'high').length} urgentes</span>` : ''}
    </div>
    ${alerts.length > 0
      ? alerts.slice(0, 5).map(a => renderAlert(a)).join('')
      : `<div class="ck-alerts-empty">${icon('check-circle', { size: 16, strokeWidth: 2 })} Aucune alerte — tout va bien</div>`}
  </div>

  <!-- BLOC 4 — TOP MONITEURS -->
  ${topMons.length > 0 ? `
  <div class="ck-section">
    <div class="ck-section-hd">
      <span class="ck-section-title">Top moniteurs</span>
    </div>
    <div class="ck-mon-list">
      ${topMons.slice(0, 5).map((m, i) => renderMon(m, i, maxMon)).join('')}
    </div>
  </div>` : ''}

</div>

<!-- Bottom sheet cohorte drill -->
<div class="ck-bs-bg" id="ck-bs-bg"></div>
<div class="ck-bs" id="ck-bs" role="dialog">
  <div class="ck-bs-handle"></div>
  <div class="ck-bs-hd">
    <div class="ck-bs-title" id="ck-bs-title">Groupe</div>
    <div class="ck-bs-sub" id="ck-bs-sub">—</div>
  </div>
  <div class="ck-bs-list" id="ck-bs-list">
    <div style="padding:20px;text-align:center;color:${MUTED}">Chargement…</div>
  </div>
</div>`;
}

// ─── KPI renderer ────────────────────────────────────────────────
function renderKpi(kpi, idx) {
  const color = kpi.color ?? ACC;
  const val   = kpi.value !== null && kpi.value !== undefined ? String(kpi.value) : '—';
  const unit  = kpi.unit ? `<span style="font-size:.45em;font-weight:500;color:${MUTED};margin-left:2px">${esc(kpi.unit)}</span>` : '';

  let deltaHtml = '';
  if (kpi.delta !== null && kpi.delta !== undefined) {
    const up  = kpi.delta >= 0;
    const cls = kpi.delta > 0 ? 'up' : kpi.delta < 0 ? 'down' : 'flat';
    deltaHtml = `<div class="ck-kpi-delta ${cls}">
      ${kpi.delta > 0 ? '↑' : kpi.delta < 0 ? '↓' : '→'} ${Math.abs(kpi.delta)}${kpi.delta_unit ?? '%'}
    </div>`;
  }

  return `
    <div class="ck-kpi" style="--kpi-color:${esc(color)}">
      <div class="ck-kpi-label">${esc(kpi.label)}</div>
      <div class="ck-kpi-val">${esc(val)}${unit}</div>
      ${deltaHtml}
    </div>`;
}

// ─── Donut SVG renderer ──────────────────────────────────────────
function renderDonut(cohorts) {
  const R = 60, r = 38, cx = 80, cy = 80;
  const total = cohorts.reduce((s, c) => s + (c.count ?? 0), 0) || 1;
  const circumference = 2 * Math.PI * R;

  let offsetDeg = -90;
  const segments = COHORT_ORDER.map(key => {
    const found  = cohorts.find(c => c.cohort === key || c.key === key);
    const count  = found?.count ?? 0;
    const pct    = total > 0 ? count / total : 0;
    const meta   = COHORT_META[key] ?? { label: key, color: MUTED };
    const start  = offsetDeg;
    offsetDeg   += pct * 360;
    return { key, count, pct, color: meta.color, label: meta.label, startDeg: start };
  }).filter(s => s.count > 0);

  let svgPaths = '';
  let cumulPct = 0;
  for (const seg of segments) {
    const startAngle = (cumulPct * 2 * Math.PI) - Math.PI / 2;
    const endAngle   = ((cumulPct + seg.pct) * 2 * Math.PI) - Math.PI / 2;
    cumulPct += seg.pct;

    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const largeArc = seg.pct > 0.5 ? 1 : 0;

    if (seg.pct >= 0.99) {
      svgPaths += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${seg.color}" stroke-width="18" data-cohort="${esc(seg.key)}"/>`;
    } else {
      svgPaths += `<path d="M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}" fill="none" stroke="${esc(seg.color)}" stroke-width="18" stroke-linecap="butt" data-cohort="${esc(seg.key)}" style="cursor:pointer"/>`;
    }
  }

  const legendRows = COHORT_ORDER.map(key => {
    const found = cohorts.find(c => c.cohort === key || c.key === key);
    const count = found?.count ?? 0;
    if (count === 0) return '';
    const meta  = COHORT_META[key] ?? { label: key, color: MUTED };
    const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div class="ck-legend-row" data-cohort="${esc(key)}">
        <div class="ck-legend-dot" style="background:${esc(meta.color)}"></div>
        <div class="ck-legend-label">${esc(meta.label)}</div>
        <div class="ck-legend-val">${count}</div>
        <div class="ck-legend-pct">${pct}%</div>
      </div>`;
  }).join('');

  return `
    <div class="ck-donut-row">
      <svg class="ck-donut-svg" width="160" height="160" viewBox="0 0 160 160">
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${SURF2}" stroke-width="18"/>
        ${svgPaths}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${SURF}"/>
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="20" font-weight="700" fill="${TEXT}">${total}</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9" fill="${MUTED}">ÉLÈVES</text>
      </svg>
      <div class="ck-donut-legend">${legendRows}</div>
    </div>`;
}

// ─── Alert renderer ──────────────────────────────────────────────
function renderAlert(alert) {
  const colors = {
    high:   { color: 'var(--rd)', rgb: '239,68,68',   icon: 'alert-octagon' },
    medium: { color: 'var(--am)', rgb: '245,158,11',   icon: 'alert-triangle' },
    low:    { color: '#eab308', rgb: '234,179,8',    icon: 'info' },
  };
  const c = colors[alert.severity] ?? colors.low;
  return `
    <div class="ck-alert" data-alert-id="${esc(alert.id ?? '')}" style="--alert-color:${c.color};--alert-rgb:${c.rgb}">
      <div class="ck-alert-ico">${icon(c.icon, { size: 16 })}</div>
      <div class="ck-alert-body">
        <div class="ck-alert-title">${esc(alert.label ?? alert.title ?? alert.message ?? 'Alerte')}</div>
        ${alert.count != null ? `<div class="ck-alert-sub">${alert.count} concerné${alert.count > 1 ? 's' : ''}</div>` : (alert.sub ?? alert.detail ? `<div class="ck-alert-sub">${esc(alert.sub ?? alert.detail)}</div>` : '')}
      </div>
      <div class="ck-alert-arrow">${icon('chevron-right', { size: 14 })}</div>
    </div>`;
}

// ─── Moniteur renderer ───────────────────────────────────────────
function renderMon(mon, idx, maxVal) {
  const prenom   = mon.prenom ?? mon.first_name ?? 'Moniteur';
  const nom      = mon.nom ?? mon.last_name ?? '';
  const initials = ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase() || 'M';
  // RPC renvoie n_validations + heures_30j (anciens noms validations_count/heures gardés en fallback)
  const nVal     = mon.n_validations ?? mon.validations_count ?? 0;
  const hrs      = mon.heures_30j ?? mon.heures ?? 0;
  const val      = nVal > 0 ? nVal : hrs;
  const pct      = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
  const valLabel = nVal > 0 ? `${nVal} valid.` : `${hrs}h`;

  return `
    <div class="ck-mon-row" data-moniteur-id="${esc(mon.id ?? '')}">
      <div class="ck-mon-rank">${idx + 1}</div>
      <div class="ck-mon-av">${esc(initials)}</div>
      <div class="ck-mon-info">
        <div class="ck-mon-name">${esc(prenom)} ${esc(nom)}</div>
        <div class="ck-mon-bar-wrap">
          <div class="ck-mon-bar">
            <div class="ck-mon-bar-fill" style="width:0%" data-target="${pct}"></div>
          </div>
          <div class="ck-mon-val">${esc(valLabel)}</div>
        </div>
      </div>
    </div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, me) {
  // Animate moniteur bars
  root.querySelectorAll('.ck-mon-bar-fill[data-target]').forEach(el => {
    setTimeout(() => { el.style.width = el.dataset.target + '%'; }, 300);
  });

  // Refresh button
  root.querySelector('#ck-refresh')?.addEventListener('click', async () => {
    haptic('select');
    const btn = root.querySelector('#ck-refresh');
    btn?.classList.add('spinning');
    await loadAndRender(root, me);
    btn?.classList.remove('spinning');
  });

  // Bottom sheet logic
  const bsBg   = root.querySelector('#ck-bs-bg');
  const bsSheet = root.querySelector('#ck-bs');
  const openBS  = () => { bsSheet?.classList.add('open'); bsBg?.classList.add('open'); };
  const closeBS = () => { bsSheet?.classList.remove('open'); bsBg?.classList.remove('open'); };
  bsBg?.addEventListener('click', closeBS);

  // Donut segments + legend rows → drill cohorte
  root.querySelectorAll('[data-cohort]').forEach(el => {
    el.addEventListener('click', async () => {
      const cohort = el.dataset.cohort;
      if (!cohort) return;
      haptic('select');
      track('cockpit.cohort.drill', { cohort });
      const meta = COHORT_META[cohort] ?? { label: cohort, color: MUTED };
      const titleEl = root.querySelector('#ck-bs-title');
      const subEl   = root.querySelector('#ck-bs-sub');
      const listEl  = root.querySelector('#ck-bs-list');
      if (titleEl) titleEl.style.color = meta.color;
      if (titleEl) titleEl.textContent = `Groupe : ${meta.label}`;
      if (subEl)   subEl.textContent = 'Chargement…';
      if (listEl)  listEl.innerHTML = `<div style="padding:20px;text-align:center;color:${MUTED}">Chargement…</div>`;
      openBS();
      try {
        const { data, error } = await sb.rpc('get_gerant_cohort_details', { p_cohort: cohort, p_limit: 50 });
        const eleves = data ?? [];
        if (subEl) subEl.textContent = `${eleves.length} élève${eleves.length > 1 ? 's' : ''}`;
        if (listEl) {
          listEl.innerHTML = eleves.length === 0
            ? `<div style="padding:20px;text-align:center;color:${MUTED}">Aucun élève dans ce groupe</div>`
            : eleves.map(e => {
                const p = e.prenom ?? '?'; const n = e.nom ?? '';
                const ini = ((p[0] ?? '') + (n[0] ?? '')).toUpperCase() || '?';
                const val = e.validations_acquis ?? e.competences ?? 0;
                return `<div class="ck-bs-eleve" data-eleve-id="${esc(e.id ?? '')}">
                  <div class="ck-bs-av">${esc(ini)}</div>
                  <div class="ck-bs-eleve-name">${esc(p)} ${esc(n)}</div>
                  <div class="ck-bs-eleve-val">${val}/31</div>
                </div>`;
              }).join('');
          listEl.querySelectorAll('[data-eleve-id]').forEach(row => {
            row.addEventListener('click', () => {
              closeBS();
              navigate(`#/livret/${row.dataset.eleveId}`);
            });
          });
        }
      } catch (err) {
        if (subEl) subEl.textContent = 'Erreur de chargement';
        if (listEl) listEl.innerHTML = `<div style="padding:20px;text-align:center;color:var(--rd)">Impossible de charger les données</div>`;
      }
    });
  });

  // Top moniteurs → livret de l'équipe
  root.querySelectorAll('.ck-mon-row[data-moniteur-id]').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.moniteurId;
      if (id) navigate(`#/equipe`);
    });
  });
}

// ─── Skeleton ────────────────────────────────────────────────────
function renderSkeleton() {
  return `${STYLE}
<div class="ck">
  <div style="height:54px;background:${SURF};border-bottom:1px solid ${BORD}"></div>
  <div class="ck-section">
    <div class="ck-kpi-grid">
      <div class="ck-skel" style="height:96px"></div>
      <div class="ck-skel" style="height:96px"></div>
      <div class="ck-skel" style="height:96px"></div>
      <div class="ck-skel" style="height:96px"></div>
    </div>
  </div>
  <div class="ck-section"><div class="ck-skel" style="height:180px;border-radius:20px"></div></div>
  <div class="ck-section"><div class="ck-skel" style="height:120px;border-radius:20px"></div></div>
</div>`;
}
