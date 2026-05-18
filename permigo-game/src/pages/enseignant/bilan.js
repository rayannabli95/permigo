// ═══════════════════════════════════════════════════════════════
// Enseignant — Bilan trimestriel élève
// Route : #/bilan/:eleveId
// RPC   : get_bilan_data(p_eleve_id, p_trimestre_start?)
// Print-friendly · @media print
// ═══════════════════════════════════════════════════════════════
import { sb }         from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast }      from '@/components/toast.js';
import { esc }        from '@/utils/escape.js';
import { track }      from '@/services/analytics.js';
import { icon }       from '@/utils/icons.js';

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout ── */
.bl {
  padding: 20px 16px 80px;
  max-width: 640px;
  margin: 0 auto;
  background: #f8f9fc;
  color: #0a0d1a;
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
  color: #94a3b8;
  margin-bottom: 8px;
}
.bl-title {
  font: 800 24px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  letter-spacing: -.02em;
}
.bl-subtitle {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: #64748b;
  margin-top: 4px;
}
.bl-print-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 12px;
  font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
  color: #374151;
  cursor: pointer;
  min-height: 44px;
  flex-shrink: 0;
  transition: border-color .16s, transform .16s cubic-bezier(.23,1,.32,1);
}
.bl-print-btn:active { transform: scale(.97); }
@media (hover:hover) and (pointer:fine) {
  .bl-print-btn:hover { border-color: #a5b4fc; color: #4f46e5; }
}

/* ── Trimestre badge ── */
.bl-trimestre {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(99,102,241,.08);
  border: 1px solid rgba(99,102,241,.2);
  border-radius: 20px;
  font: 600 12px/1 'Plus Jakarta Sans', sans-serif;
  color: #4f46e5;
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
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.bl-kpi-val {
  font: 800 28px/1 'IBM Plex Mono', monospace;
  color: #0a0d1a;
  margin-bottom: 4px;
}
.bl-kpi-val .bl-kpi-unit { font-size: .55em; color: #94a3b8; }
.bl-kpi-label { font: 500 11px/1.4 'Inter', sans-serif; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
.bl-kpi-delta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font: 600 11px/1 'Plus Jakarta Sans', sans-serif;
  padding: 3px 7px;
  border-radius: 8px;
  margin-top: 6px;
}
.bl-kpi-delta.up   { background: #dcfce7; color: #16a34a; }
.bl-kpi-delta.down { background: #fee2e2; color: #dc2626; }
.bl-kpi-delta.flat { background: #f1f5f9; color: #64748b; }

/* ── Auto comment ── */
.bl-comment {
  background: linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.06));
  border: 1.5px solid rgba(99,102,241,.18);
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
  color: rgba(99,102,241,.15);
  line-height: 1;
}
.bl-comment-label {
  font: 700 11px/1 'Plus Jakarta Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #6366f1;
  margin-bottom: 8px;
}
.bl-comment-txt {
  font: 500 14px/1.6 'Inter', sans-serif;
  color: #374151;
  padding-left: 4px;
}

/* ── Section card ── */
.bl-section {
  background: #fff;
  border: 1.5px solid #e2e6f2;
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
  color: #0a0d1a;
  display: flex;
  align-items: center;
  gap: 8px;
}
.bl-section-badge {
  font: 700 11px/1 'IBM Plex Mono', monospace;
  padding: 3px 8px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
}

/* ── Comp list ── */
.bl-comp-list { display: flex; flex-direction: column; gap: 6px; }
.bl-comp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f8f9fc;
}
.bl-comp-check {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #dcfce7;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: #16a34a;
  font-size: 11px;
}
.bl-comp-name { font: 500 13px/1.3 'Inter', sans-serif; color: #374151; flex: 1; min-width: 0; }
.bl-comp-date { font: 500 11px/1 'IBM Plex Mono', monospace; color: #94a3b8; flex-shrink: 0; }
.bl-comp-none { font: 500 13px/1.4 'Inter',sans-serif; color: #94a3b8; text-align: center; padding: 12px 0; }

/* ── Evolution chart ── */
.bl-chart { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
.bl-bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
.bl-bar {
  width: 100%;
  background: linear-gradient(180deg,#6366f1,#8b5cf6);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height .3s cubic-bezier(.23,1,.32,1);
}
.bl-bar-lbl { font: 500 9px/1 'Inter', sans-serif; color: #94a3b8; text-align: center; white-space: nowrap; }
.bl-bar-val { font: 600 10px/1 'IBM Plex Mono', monospace; color: #64748b; }

/* ── No data ── */
.bl-no-data {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
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
  C1: { name: 'Contrôle & Sécurité', color: '#22c55e', ico: '🟢', short: 'C1' },
  C2: { name: 'Manœuvres',           color: '#3b82f6', ico: '🔵', short: 'C2' },
  C3: { name: 'Circulation',         color: '#eab308', ico: '🟡', short: 'C3' },
  C4: { name: 'Situations complexes', color: '#a855f7', ico: '🟣', short: 'C4' },
};

// ─── Helpers ─────────────────────────────────────────────────────
function fmtDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function fmtTrimestre(start, end) {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const monthFmt = d => d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return `${monthFmt(d1)} → ${monthFmt(d2)}`;
}

function deltaClass(pct) {
  if (pct == null || pct === 0) return 'flat';
  return pct > 0 ? 'up' : 'down';
}

function deltaLabel(pct) {
  if (pct == null || pct === 0) return '= Stable';
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

// ─── Render helpers ───────────────────────────────────────────────
function renderKPI(kpi) {
  const delta = kpi.delta_pct != null ? `<span class="bl-kpi-delta ${deltaClass(kpi.delta_pct)}">${esc(deltaLabel(kpi.delta_pct))}</span>` : '';
  const scoreColor = kpi.score_moyen >= 70 ? '#16a34a' : kpi.score_moyen >= 50 ? '#a16207' : '#dc2626';

  return `
<div class="bl-kpi-grid">
  <div class="bl-kpi">
    <div class="bl-kpi-val">${kpi.acquises_now ?? '—'}<span class="bl-kpi-unit">/31</span></div>
    <div class="bl-kpi-label">Compétences acquises</div>
    ${delta}
  </div>
  <div class="bl-kpi">
    <div class="bl-kpi-val" style="color:${esc(scoreColor)}">${kpi.score_moyen != null ? kpi.score_moyen + '%' : '—'}</div>
    <div class="bl-kpi-label">Score moyen quiz</div>
    <span class="bl-kpi-delta ${kpi.score_moyen >= 70 ? 'up' : 'flat'}">${kpi.quiz_reussis ?? 0}/${kpi.quiz_total ?? 0} réussis</span>
  </div>
  <div class="bl-kpi">
    <div class="bl-kpi-val">${kpi.jours_actifs ?? '—'}</div>
    <div class="bl-kpi-label">Jours actifs</div>
    <span class="bl-kpi-delta flat">sur ${kpi.jours_total ?? 90} jours</span>
  </div>
  <div class="bl-kpi">
    <div class="bl-kpi-val">${kpi.acquises_prev ?? '—'}</div>
    <div class="bl-kpi-label">Trimestre précédent</div>
    <span class="bl-kpi-delta flat">Compétences</span>
  </div>
</div>`;
}

function renderByMonde(byMonde) {
  return Object.entries(MONDES).map(([key, m]) => {
    const comps = byMonde[key] ?? [];
    const rows = comps.length > 0
      ? comps.map(c => `<div class="bl-comp-row">
  <div class="bl-comp-check" aria-hidden="true">✓</div>
  <div class="bl-comp-name">${esc(c.competence_id)}</div>
  <div class="bl-comp-date">${esc(fmtDateShort(c.validated_at))}</div>
</div>`).join('')
      : `<div class="bl-comp-none">Aucune compétence acquise ce trimestre</div>`;

    return `
<div class="bl-section">
  <div class="bl-section-hd">
    <div class="bl-section-title">
      <span aria-hidden="true">${m.ico}</span> ${esc(m.name)}
    </div>
    <span class="bl-section-badge">${comps.length} acquise${comps.length > 1 ? 's' : ''}</span>
  </div>
  <div class="bl-comp-list" role="list">${rows}</div>
</div>`;
  }).join('');
}

function renderEvolution(evolution) {
  if (!evolution || evolution.length === 0) {
    return `<div class="bl-section">
  <div class="bl-section-hd">
    <div class="bl-section-title">${icon('trending-up', { size: 16 })} Évolution mensuelle</div>
  </div>
  <div class="bl-comp-none">Aucune donnée d'évolution disponible</div>
</div>`;
  }

  const max = Math.max(1, ...evolution.map(e => e.count));

  const bars = evolution.map(e => {
    const h = Math.max(4, Math.round((e.count / max) * 68));
    return `<div class="bl-bar-col">
  <div class="bl-bar-val">${e.count}</div>
  <div class="bl-bar" style="height:${h}px" role="presentation"></div>
  <div class="bl-bar-lbl">${esc(e.month)}</div>
</div>`;
  }).join('');

  return `
<div class="bl-section">
  <div class="bl-section-hd">
    <div class="bl-section-title">${icon('trending-up', { size: 16 })} Évolution mensuelle</div>
  </div>
  <div class="bl-chart" role="img" aria-label="Graphique d'évolution mensuelle">${bars}</div>
</div>`;
}

function renderComment(comment) {
  if (!comment) return '';
  return `
<div class="bl-comment">
  <div class="bl-comment-label">${icon('message-circle', { size: 12 })} Commentaire pédagogique auto-généré</div>
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

  track('page.view', { page: 'enseignant_bilan', eleve_id: eleveId });

  root.innerHTML = `${STYLE}
<div class="bl">
  <div style="display:flex;flex-direction:column;gap:10px;padding:40px 0">
    ${[160,80,120,120,120].map(h => `<div style="height:${h}px;background:linear-gradient(90deg,#f0f2f8 0%,#e4e8f4 50%,#f0f2f8 100%);background-size:200% 100%;animation:blShimmer 1.4s infinite;border-radius:16px"></div>`).join('')}
  </div>
  <style>@keyframes blShimmer{to{background-position:-200% 0}}</style>
</div>`;

  const { data, error } = await sb.rpc('get_bilan_data', { p_eleve_id: eleveId });

  if (error || !data) {
    toast('Impossible de charger le bilan', 'error');
    root.innerHTML = `${STYLE}<div class="bl"><div class="bl-no-data">
      <div style="font-size:32px;margin-bottom:12px">📋</div>
      Bilan indisponible. Vérifie que cet élève est bien rattaché à ton compte.
    </div></div>`;
    return;
  }

  const { eleve, trimestre_start, trimestre_end, kpi, by_monde, evolution, comment } = data;
  const prenom = eleve?.prenom ?? '';
  const nom    = eleve?.nom    ?? '';

  root.innerHTML = `${STYLE}
<div class="bl">

  <!-- HEADER -->
  <div class="bl-hd">
    <div class="bl-hd-left">
      <div class="bl-school-logo">PermiGo Autopilot</div>
      <div class="bl-title">Bilan de ${esc(prenom)} ${esc(nom)}</div>
      <div class="bl-subtitle">Rapport trimestriel · Permis B</div>
    </div>
    <button class="bl-print-btn" id="bl-btn-print" aria-label="Imprimer le bilan">
      ${icon('printer', { size: 15 })} Imprimer
    </button>
  </div>

  <!-- TRIMESTRE BADGE -->
  <div class="bl-trimestre">
    ${icon('calendar', { size: 12 })}
    ${esc(fmtTrimestre(trimestre_start, trimestre_end))}
  </div>

  <!-- KPI 2×2 -->
  ${renderKPI(kpi)}

  <!-- COMMENTAIRE AUTO -->
  ${renderComment(comment)}

  <!-- EVOLUTION -->
  ${renderEvolution(evolution)}

  <!-- PAR MONDE -->
  ${renderByMonde(by_monde ?? {})}

</div>`;

  root.querySelector('#bl-btn-print')?.addEventListener('click', () => {
    track('bilan.print', { eleve_id: eleveId });
    window.print();
  });
}
