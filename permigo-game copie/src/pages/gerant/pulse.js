// ═══════════════════════════════════════════════════════════════
// Gérant — Dashboard Pulse (light theme)
// 4 KPI ce mois + équipe + activité récente
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/toast.js';
import { track } from '@/services/analytics.js';

// ─── CSS scoped ──────────────────────────────────────────────
const STYLE = `<style>
.pulse {
  padding: 0 0 100px;
  max-width: 580px;
  margin: 0 auto;
  background: var(--bg);
  font-family: var(--fb);
}

/* Header */
.pulse-hd {
  padding: 24px 20px 16px;
  border-bottom: 1px solid var(--bo);
  background: var(--su);
}
.pulse-title {
  font: 800 22px/1.2 var(--fd);
  color: var(--ink);
  letter-spacing: -0.022em;
}
.pulse-date {
  font: 500 12px/1 var(--fn);
  color: var(--mu);
  margin-top: 5px;
  text-transform: capitalize;
}

/* KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 16px;
}
.kpi-card {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--rl);
  padding: 18px;
  box-shadow: var(--s1);
  position: relative;
  overflow: hidden;
  animation: kpiIn .4s ease both;
}
.kpi-card:nth-child(1) { animation-delay: 0ms; }
.kpi-card:nth-child(2) { animation-delay: 60ms; }
.kpi-card:nth-child(3) { animation-delay: 120ms; }
.kpi-card:nth-child(4) { animation-delay: 180ms; }
@keyframes kpiIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.kpi-card::before {
  content: '';
  position: absolute;
  top: -12px; right: -12px;
  width: 56px; height: 56px;
  background: radial-gradient(circle, var(--kc, var(--a)) 0%, transparent 70%);
  opacity: .12;
}
.kpi-ico  { font-size: 22px; margin-bottom: 10px; display: block; }
.kpi-val  { font: 800 32px/1 var(--fd); color: var(--ink); margin-bottom: 4px; }
.kpi-lbl  { font: 500 11px/1.4 var(--fb); color: var(--mu); }

/* Sections */
.pulse-sec {
  padding: 0 16px;
  margin-top: 20px;
}
.pulse-sec-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.pulse-sec-title {
  font: 700 13px/1 var(--fd);
  color: var(--ink);
  letter-spacing: -0.01em;
}
.pulse-sec-sub {
  font: 600 11px/1 var(--fn);
  color: var(--mu2);
}

/* Team list */
.team-list { display: flex; flex-direction: column; gap: 8px; }
.team-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r);
  box-shadow: var(--s0);
}
.team-av {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 700 15px/1 var(--fd);
  color: #fff;
  flex-shrink: 0;
}
.team-info { flex: 1; min-width: 0; }
.team-name {
  font: 600 14px/1 var(--fb);
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.team-sub {
  font: 500 11px/1 var(--fn);
  color: var(--mu);
  margin-top: 3px;
}
.team-badge {
  font: 700 12px/1 var(--fn);
  color: var(--a);
  background: var(--ap);
  border-radius: 20px;
  padding: 4px 10px;
  white-space: nowrap;
}

/* Activite recente */
.activity-list { display: flex; flex-direction: column; gap: 8px; }
.activity-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
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
  margin-top: 5px;
}
.activity-body { flex: 1; min-width: 0; }
.activity-line {
  font: 500 13px/1.4 var(--fb);
  color: var(--ink);
}
.activity-line strong { font-weight: 700; color: var(--ink); }
.activity-meta {
  font: 500 11px/1 var(--fn);
  color: var(--mu2);
  margin-top: 3px;
}

/* Skeleton */
.skel-block {
  background: linear-gradient(90deg, var(--bo2) 0%, var(--bg2) 50%, var(--bo2) 100%);
  background-size: 200% 100%;
  animation: shimmerP 1.4s ease-in-out infinite;
  border-radius: var(--r);
}
@keyframes shimmerP { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* Empty state */
.pulse-empty {
  padding: 20px;
  text-align: center;
  color: var(--mu2);
  font: 500 13px/1.5 var(--fb);
}
</style>`;

const AVATARS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,#0891b2,#155e75)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
  'linear-gradient(135deg,#0e7c66,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#dc2626,#7f1d1d)',
];

// ─── Entry point ─────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== 'gerant') return;

  track('page_view', { page: 'gerant_pulse', user_role: me.role });

  // Skeleton
  root.innerHTML = `${STYLE}
<div class="pulse anim-slide-up">
  <div class="pulse-hd">
    <div class="pulse-title">Pulse École</div>
    <div class="pulse-date">${todayLabel()}</div>
  </div>
  <div class="kpi-grid">
    ${[80, 90, 80, 90].map(h => `<div class="skel-block" style="height:${h}px;border-radius:var(--rl)"></div>`).join('')}
  </div>
  <div class="pulse-sec">
    <div class="skel-block" style="height:14px;width:100px;margin-bottom:10px"></div>
    ${[1,2,3].map(() => `<div class="skel-block" style="height:56px;margin-bottom:8px"></div>`).join('')}
  </div>
</div>`;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      elevesRes,
      validMoisRes,
      enseignantsRes,
      quizMoisRes,
    ] = await Promise.all([
      // KPI 1 — élèves actifs (tous les élèves)
      sb.from('profiles').select('id').eq('role', 'eleve'),
      // KPI 2 — compétences validées ce mois
      sb.from('validations').select('id').gte('validated_at', startOfMonth),
      // KPI 3 — enseignants actifs
      sb.from('profiles').select('id, prenom, nom').eq('role', 'enseignant'),
      // KPI 4 — quiz réussis ce mois (score >= 60)
      sb.from('quiz_attempts').select('id').gte('score', 60).gte('created_at', startOfMonth),
    ]);

    const elevesTotal = elevesRes.data?.length ?? 0;
    const compValidees = validMoisRes.data?.length ?? 0;
    const enseignants = enseignantsRes.data || [];
    const quizReussis = quizMoisRes.data?.length ?? 0;

    // Stats validations ce mois par enseignant
    let teacherValMap = {};
    let teacherElevesMap = {};
    if (enseignants.length > 0) {
      const { data: tvData, error: tvErr } = await sb
        .from('validations')
        .select('validated_by, eleve_id')
        .gte('validated_at', startOfMonth)
        .not('validated_by', 'is', null);

      if (!tvErr) {
        (tvData || []).forEach(v => {
          if (!v.validated_by) return;
          teacherValMap[v.validated_by] = (teacherValMap[v.validated_by] || 0) + 1;
          if (!teacherElevesMap[v.validated_by]) teacherElevesMap[v.validated_by] = new Set();
          if (v.eleve_id) teacherElevesMap[v.validated_by].add(v.eleve_id);
        });
      }
    }

    // Activite recente : 5 dernieres validations
    const { data: recentVals, error: rvErr } = await sb
      .from('validations')
      .select('id, eleve_id, competence_id, validated_by, validated_at')
      .order('validated_at', { ascending: false })
      .limit(5);

    // Enrichissement : noms eleves + enseignants pour l'activite
    let eleveNames = {};
    let enseignantNames = {};
    if (!rvErr && recentVals?.length > 0) {
      const eleveIds = [...new Set(recentVals.map(v => v.eleve_id).filter(Boolean))];
      const ensIds   = [...new Set(recentVals.map(v => v.validated_by).filter(Boolean))];

      const [eRes, enRes] = await Promise.all([
        eleveIds.length > 0
          ? sb.from('profiles').select('id, prenom, nom').in('id', eleveIds)
          : Promise.resolve({ data: [] }),
        ensIds.length > 0
          ? sb.from('profiles').select('id, prenom, nom').in('id', ensIds)
          : Promise.resolve({ data: [] }),
      ]);
      (eRes.data || []).forEach(p => { eleveNames[p.id] = p.prenom || p.nom || '—'; });
      (enRes.data || []).forEach(p => { enseignantNames[p.id] = p.prenom || p.nom || '—'; });
    }

    root.innerHTML = render({
      elevesTotal, compValidees, enseignants: enseignants.length, quizReussis,
      teachers: enseignants, teacherValMap, teacherElevesMap,
      recentVals: recentVals || [], eleveNames, enseignantNames,
    });

  } catch (e) {
    console.error('[pulse]', e);
    toast('Erreur de chargement', 'error');
    root.innerHTML = `${STYLE}<div class="pulse"><p style="padding:32px;color:var(--rd)">Erreur de chargement du dashboard.</p></div>`;
  }
}

// ─── Render ──────────────────────────────────────────────────
function render({ elevesTotal, compValidees, enseignants, quizReussis, teachers, teacherValMap, teacherElevesMap, recentVals, eleveNames, enseignantNames }) {
  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return `${STYLE}
<div class="pulse anim-slide-up">
  <div class="pulse-hd">
    <div class="pulse-title">Pulse École</div>
    <div class="pulse-date">${todayLabel()}</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card" style="--kc:#6366f1">
      <span class="kpi-ico">👥</span>
      <div class="kpi-val">${elevesTotal}</div>
      <div class="kpi-lbl">Élèves actifs</div>
    </div>
    <div class="kpi-card" style="--kc:#10b981">
      <span class="kpi-ico">✅</span>
      <div class="kpi-val">${compValidees}</div>
      <div class="kpi-lbl">Compétences validées<br>${esc(monthLabel)}</div>
    </div>
    <div class="kpi-card" style="--kc:#8b5cf6">
      <span class="kpi-ico">🏫</span>
      <div class="kpi-val">${enseignants}</div>
      <div class="kpi-lbl">Enseignants actifs</div>
    </div>
    <div class="kpi-card" style="--kc:#f59e0b">
      <span class="kpi-ico">🎯</span>
      <div class="kpi-val">${quizReussis}</div>
      <div class="kpi-lbl">Quiz réussis<br>${esc(monthLabel)}</div>
    </div>
  </div>

  <!-- EQUIPE -->
  <div class="pulse-sec">
    <div class="pulse-sec-hd">
      <span class="pulse-sec-title">Équipe</span>
      <span class="pulse-sec-sub">${teachers.length} enseignant${teachers.length > 1 ? 's' : ''}</span>
    </div>
    <div class="team-list">
      ${teachers.length === 0
        ? `<div class="pulse-empty">Aucun enseignant enregistré</div>`
        : teachers.map((t, i) => {
            const initials = initials2(t.prenom, t.nom);
            const gradient = AVATARS[i % AVATARS.length];
            const valCount = teacherValMap[t.id] || 0;
            const eleveCount = teacherElevesMap[t.id]?.size || 0;
            return `
              <div class="team-row">
                <div class="team-av" style="background:${gradient}">${esc(initials)}</div>
                <div class="team-info">
                  <div class="team-name">${esc(((t.prenom || '') + ' ' + (t.nom || '')).trim() || '—')}</div>
                  <div class="team-sub">${eleveCount} élève${eleveCount > 1 ? 's' : ''} ce mois</div>
                </div>
                <div class="team-badge">${valCount} valid.</div>
              </div>`;
          }).join('')
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
      ${recentVals.length === 0
        ? `<div class="pulse-empty">Aucune validation enregistrée</div>`
        : recentVals.map(v => {
            const eleveName = eleveNames[v.eleve_id] || '—';
            const ensName   = enseignantNames[v.validated_by] || '—';
            const compLabel = v.competence_id ? esc(v.competence_id) : '—';
            const timeStr   = v.validated_at ? relativeTime(v.validated_at) : '—';
            return `
              <div class="activity-row">
                <div class="activity-dot"></div>
                <div class="activity-body">
                  <div class="activity-line">
                    <strong>${esc(eleveName)}</strong> — compétence ${compLabel}
                  </div>
                  <div class="activity-meta">par ${esc(ensName)} · ${esc(timeStr)}</div>
                </div>
              </div>`;
          }).join('')
      }
    </div>
  </div>
</div>`;
}

// ─── Helpers ─────────────────────────────────────────────────
function todayLabel() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function initials2(prenom, nom) {
  const p = (prenom || '').trim()[0] || '';
  const n = (nom || '').trim()[0] || '';
  return (p + n).toUpperCase() || '?';
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}
