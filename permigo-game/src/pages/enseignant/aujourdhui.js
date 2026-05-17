// ═══════════════════════════════════════════════════════════════
// Enseignant — Aujourd'hui
// KPI du jour + activité récente + mes élèves actifs
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { REMC_TOTAL } from '@/data/remc.js';
import { labelComp } from '@/utils/remc-label.js';

// ─── Gradients avatar ─────────────────────────────────────────────
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

// ─── Statuts labels ───────────────────────────────────────────────
const STATUT_LABEL = {
  acquis:         { label: 'Acquis',         color: '#059669',  bg: 'rgba(16,185,129,.1)' },
  en_cours:       { label: 'En cours',       color: '#d97706',  bg: 'rgba(245,158,11,.1)' },
  a_retravailler: { label: 'À retravailler', color: '#dc2626',  bg: 'rgba(239,68,68,.1)' },
};

// ─── CSS ──────────────────────────────────────────────────────────
const STYLE = `<style>
  .aj-page {
    padding: 20px 16px 100px;
    max-width: 600px;
    margin: 0 auto;
    background: #f8f9fc;
    font-family: 'Inter', sans-serif;
    color: #0a0d1a;
  }

  /* Header */
  .aj-hd { margin-bottom: 24px; }
  .aj-h1 {
    font: 700 26px/1.15 'Plus Jakarta Sans', sans-serif;
    color: #0a0d1a;
    margin: 0 0 4px;
    letter-spacing: -0.025em;
  }
  .aj-date {
    font: 500 13px/1 'Inter', sans-serif;
    color: #94a3b8;
    margin: 0;
    text-transform: capitalize;
  }

  /* KPI grid */
  .aj-kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 24px;
  }
  .aj-kpi {
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  }
  .aj-kpi-val {
    font: 700 28px/1 'Plus Jakarta Sans', sans-serif;
    color: #6366f1;
    display: block;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
  }
  .aj-kpi-lbl {
    font: 500 11px/1.3 'Inter', sans-serif;
    color: #94a3b8;
  }
  .aj-kpi.kpi-acquis .aj-kpi-val { color: #10b981; }
  .aj-kpi.kpi-eleves .aj-kpi-val { color: #0a0d1a; }

  /* Section title */
  .aj-section-title {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #94a3b8;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .aj-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e6f2;
  }

  /* Section block */
  .aj-section { margin-bottom: 24px; }

  /* Activité récente */
  .aj-activity-list {
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  }
  .aj-act-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f2f8;
  }
  .aj-act-row:last-child { border-bottom: none; }

  .aj-act-av {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .aj-act-info { flex: 1; min-width: 0; }
  .aj-act-name {
    font: 600 13px/1.2 'Inter', sans-serif;
    color: #0a0d1a;
    margin: 0 0 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-act-comp { min-width: 0; }
  .aj-act-comp-label {
    display: block;
    font: 600 13px/1.3 'Inter', sans-serif;
    color: #0a0d1a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-act-comp-code {
    display: block;
    font: 500 11px/1 'Inter', sans-serif;
    color: #94a3b8;
    margin-top: 2px;
  }
  .aj-act-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
  }
  .aj-act-badge {
    font: 600 11px/1 'Inter', sans-serif;
    padding: 3px 8px;
    border-radius: 12px;
  }
  .aj-act-time {
    font: 500 11px/1 'Inter', sans-serif;
    color: #94a3b8;
  }

  /* Élèves compacts */
  .aj-eleves-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .aj-eleve-row {
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
    cursor: pointer;
    transition: border-color .15s, transform .15s;
    min-height: 44px;
  }
  .aj-eleve-row:hover { border-color: #6366f1; }
  .aj-eleve-row:active { transform: scale(.985); }

  .aj-eleve-av {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .aj-eleve-nom {
    font: 500 13px/1.2 'Inter', sans-serif;
    color: #0a0d1a;
    flex: 1;
    min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-eleve-prog {
    font: 600 12px/1 'Inter', sans-serif;
    color: #6366f1;
    flex-shrink: 0;
  }
  .aj-eleve-chev { color: #94a3b8; font-size: 14px; flex-shrink: 0; }

  /* CTA */
  .aj-cta {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 50;
    padding: 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
    background: rgba(248,249,252,.95);
    border-top: 1px solid #e2e6f2;
    backdrop-filter: blur(10px);
  }
  .aj-cta-btn {
    width: 100%;
    max-width: 600px;
    display: block;
    margin: 0 auto;
    padding: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 12px;
    color: #fff;
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    transition: transform .15s, opacity .15s;
    min-height: 48px;
  }
  .aj-cta-btn:active { transform: scale(.98); opacity: .9; }

  /* Empty */
  .aj-empty {
    padding: 24px 20px;
    text-align: center;
    color: #94a3b8;
    font: 500 13px/1.5 'Inter', sans-serif;
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
  }

  /* Skeleton */
  .aj-skel { display: flex; flex-direction: column; gap: 16px; padding: 20px 16px; }
  .aj-skel-kpi { height: 90px; background: #fff; border: 1.5px solid #e2e6f2; border-radius: 20px; animation: aj-pulse 1.4s ease-in-out infinite; }
  .aj-skel-bloc { height: 160px; background: #fff; border: 1.5px solid #e2e6f2; border-radius: 20px; animation: aj-pulse 1.4s ease-in-out infinite; animation-delay: .1s; }
  @keyframes aj-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
</style>`;

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatHeure(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function initials(prenom, nom) {
  const p = (prenom || '')[0] || '';
  const parts = (nom || '').trim().split(/\s+/);
  const n = parts.length > 1
    ? (parts[parts.length - 1].replace(/\./g, '')[0] || p)
    : (parts[0]?.[1] || p);
  return (p + n).toUpperCase() || '?';
}

// ─── Entry point ──────────────────────────────────────────────────
export async function mount(root) {
  const _root = root;
  const _me = getCurUser();
  if (!_me) return;

  track('page.view', { page: 'aujourdhui', role: _me.role });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="aj-page">
      <div class="aj-skel">
        <div class="aj-skel-kpi"></div>
        <div class="aj-skel-bloc"></div>
        <div class="aj-skel-bloc"></div>
      </div>
    </div>
  `;

  // ─── Fetch en parallèle ────────────────────────────────────────
  const today = todayISO();

  const [valsToday, valsAll, elevesAll] = await Promise.all([
    // Validations d'aujourd'hui (faites par moi)
    sb
      .from('validations')
      .select('id, competence_id, statut, eleve_id, validated_at')
      .eq('validated_by', _me.id)
      .gte('validated_at', today + 'T00:00:00.000Z')
      .lte('validated_at', today + 'T23:59:59.999Z')
      .order('validated_at', { ascending: false }),

    // 5 dernières validations (activité récente)
    sb
      .from('validations')
      .select('id, competence_id, statut, eleve_id, validated_at')
      .eq('validated_by', _me.id)
      .order('validated_at', { ascending: false })
      .limit(5),

    // Tous les élèves
    sb
      .from('profiles')
      .select('id, prenom, nom')
      .eq('role', 'eleve'),
  ]);

  if (valsToday.error || valsAll.error) {
    toast('Impossible de charger les données', 'error');
  }

  const todayVals = valsToday.data || [];
  const recentVals = valsAll.data || [];
  const elevesMap = {};
  (elevesAll.data || []).forEach((e, i) => { elevesMap[e.id] = { ...e, idx: i }; });

  // KPI
  const validationsAujourdhui = todayVals.length;
  const acquisAujourdhui = todayVals.filter(v => v.statut === 'acquis').length;

  // Élèves que j'ai validé au moins une fois (tous statuts)
  const { data: elevesValides } = await sb
    .from('validations')
    .select('eleve_id, competence_id, statut')
    .eq('validated_by', _me.id);

  const tousByEleve = {};
  (elevesValides || []).forEach(v => {
    if (!tousByEleve[v.eleve_id]) tousByEleve[v.eleve_id] = { acquis: 0 };
    if (v.statut === 'acquis') tousByEleve[v.eleve_id].acquis++;
  });

  const mesElevesActifs = Object.entries(tousByEleve).map(([id, stats]) => ({
    id,
    ...(elevesMap[id] || { prenom: 'Élève', nom: '', idx: 0 }),
    acquis: stats.acquis,
  }));

  const nbElevesActifs = mesElevesActifs.length;

  // ─── Render ───────────────────────────────────────────────────
  root.innerHTML = `
    ${STYLE}
    <div class="aj-page anim-slide-up">

      <header class="aj-hd">
        <h1 class="aj-h1">Aujourd'hui</h1>
        <p class="aj-date">${formatDate(new Date())}</p>
      </header>

      <!-- KPI -->
      <div class="aj-kpi-grid">
        <div class="aj-kpi">
          <span class="aj-kpi-val">${validationsAujourdhui}</span>
          <span class="aj-kpi-lbl">Validations<br>aujourd'hui</span>
        </div>
        <div class="aj-kpi kpi-acquis">
          <span class="aj-kpi-val">${acquisAujourdhui}</span>
          <span class="aj-kpi-lbl">Compétences<br>acquises</span>
        </div>
        <div class="aj-kpi kpi-eleves">
          <span class="aj-kpi-val">${nbElevesActifs}</span>
          <span class="aj-kpi-lbl">Élèves<br>suivis</span>
        </div>
      </div>

      <!-- Activité récente -->
      <div class="aj-section">
        <div class="aj-section-title">Activité récente</div>
        ${recentVals.length === 0
          ? `<div class="aj-empty">Aucune validation encore enregistrée.</div>`
          : `<div class="aj-activity-list">
              ${recentVals.map(v => renderActRow(v, elevesMap)).join('')}
            </div>`
        }
      </div>

      <!-- Mes élèves -->
      <div class="aj-section">
        <div class="aj-section-title">Mes élèves</div>
        ${mesElevesActifs.length === 0
          ? `<div class="aj-empty">Validez une première compétence pour voir vos élèves ici.</div>`
          : `<div class="aj-eleves-list">
              ${mesElevesActifs.map(e => renderEleveRow(e)).join('')}
            </div>`
        }
      </div>

    </div>

    <!-- CTA fixe -->
    <div class="aj-cta">
      <button class="aj-cta-btn" id="aj-btn-valider">
        + Valider une compétence
      </button>
    </div>
  `;

  // Wire listeners
  root.querySelector('#aj-btn-valider')?.addEventListener('click', () => {
    track('cta.valider_competence', { from: 'aujourdhui' });
    navigate('#/validation');
  });

  root.querySelectorAll('.aj-eleve-row[data-eleve-id]').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.eleveId;
      track('eleve.livret.open', { eleve_id: id, from: 'aujourdhui' });
      navigate(`#/livret/${id}`);
    });
  });
}

// ─── Sub-renders ──────────────────────────────────────────────────
function renderActRow(val, elevesMap) {
  const eleve = elevesMap[val.eleve_id] || { prenom: 'Élève', nom: '', idx: 0 };
  const grad = AVATARS[eleve.idx % AVATARS.length];
  const ini = initials(eleve.prenom, eleve.nom);
  const fullNom = esc(eleve.nom || eleve.prenom || '—');
  const cfg = STATUT_LABEL[val.statut] || { label: val.statut || '—', color: 'var(--mu)', bg: 'var(--bg2)' };

  return `
    <div class="aj-act-row">
      <div class="aj-act-av" style="background:${grad}">${esc(ini)}</div>
      <div class="aj-act-info">
        <div class="aj-act-name">${fullNom || '—'}</div>
        <div class="aj-act-comp">
          <span class="aj-act-comp-label">${esc(labelComp(val.competence_id))}</span>
          <span class="aj-act-comp-code">${esc(val.competence_id || '—')}</span>
        </div>
      </div>
      <div class="aj-act-right">
        <span class="aj-act-badge" style="color:${cfg.color}; background:${cfg.bg}">
          ${cfg.label}
        </span>
        <span class="aj-act-time">${formatHeure(val.validated_at)}</span>
      </div>
    </div>
  `;
}

function renderEleveRow(eleve) {
  const grad = AVATARS[eleve.idx % AVATARS.length];
  const ini = initials(eleve.prenom, eleve.nom);
  const fullNom = esc(eleve.nom || eleve.prenom || '—');
  const pct = REMC_TOTAL > 0 ? Math.round((eleve.acquis / REMC_TOTAL) * 100) : 0;

  return `
    <div class="aj-eleve-row" data-eleve-id="${esc(eleve.id)}"
         role="button" tabindex="0" aria-label="Livret de ${fullNom}">
      <div class="aj-eleve-av" style="background:${grad}">${esc(ini)}</div>
      <span class="aj-eleve-nom">${fullNom || '—'}</span>
      <span class="aj-eleve-prog">${eleve.acquis}/${REMC_TOTAL}</span>
      <span class="aj-eleve-chev" aria-hidden="true">›</span>
    </div>
  `;
}
