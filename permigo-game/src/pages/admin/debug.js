// ═══════════════════════════════════════════════════════════════
// Admin Debug Panel — dashboard temps réel du backend PermiGo
// Accessible UNIQUEMENT par rayannabli27@gmail.com (garde-fou côté DB
// via RPC admin_get_dashboard SECURITY DEFINER + email check)
//
// Route : #/admin/debug (uniquement si role admin OU email match)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';

const STYLE = `<style>
.dbg {
  padding: 0 0 80px;
  max-width: 720px;
  margin: 0 auto;
  background: var(--ink);
  color: var(--bo3);
  font-family: 'IBM Plex Mono', 'Menlo', monospace;
  min-height: 100vh;
}
.dbg-hd {
  position: sticky; top: 0; z-index: 10;
  padding: 16px 20px;
  background: linear-gradient(180deg, var(--ink) 0%, rgba(10,13,26,.92) 100%);
  border-bottom: 1px solid color-mix(in srgb, var(--a) 30%, transparent);
  backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: space-between;
}
.dbg-title {
  font: 800 15px/1 'IBM Plex Mono', monospace;
  letter-spacing: .1em;
  color: var(--a);
  text-transform: uppercase;
}
.dbg-pulse {
  width: 8px; height: 8px;
  background: var(--gr);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--gr);
  animation: dbgPulse 1.6s ease-in-out infinite;
}
@keyframes dbgPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: .35; }
}
.dbg-refresh {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--a) 40%, transparent);
  color: var(--a);
  border-radius: 6px;
  padding: 5px 10px;
  font: 700 10px/1 'IBM Plex Mono', monospace;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s;
  font-family: inherit;
}
.dbg-refresh:hover { background: color-mix(in srgb, var(--a) 12%, transparent); }

.dbg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  padding: 0;
  background: color-mix(in srgb, var(--a) 8%, transparent);
}
@media (max-width: 540px) {
  .dbg-grid { grid-template-columns: 1fr; }
}
.dbg-card {
  background: #0f1220;
  padding: 16px 18px;
}
.dbg-card-lbl {
  font: 600 9.5px/1 'IBM Plex Mono', monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--a);
  margin-bottom: 6px;
}
.dbg-card-val {
  font: 800 26px/1 'IBM Plex Mono', monospace;
  color: #fff;
  letter-spacing: -.02em;
}
.dbg-card-sub {
  font: 500 11px/1.3 'IBM Plex Mono', monospace;
  color: var(--mu);
  margin-top: 4px;
}

.dbg-section {
  padding: 16px 20px;
  border-top: 1px solid color-mix(in srgb, var(--a) 18%, transparent);
}
.dbg-section-hd {
  font: 700 10px/1 'IBM Plex Mono', monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--mu);
  margin-bottom: 12px;
}
.dbg-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--a) 10%, transparent);
  font: 500 12px/1.4 'IBM Plex Mono', monospace;
}
.dbg-row:last-of-type { border-bottom: 0; }
.dbg-row .l { color: var(--mu2); }
.dbg-row .v {
  color: #fff;
  font-weight: 700;
}
.dbg-tag {
  font: 700 9px/1 'IBM Plex Mono', monospace;
  letter-spacing: .08em;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}
.dbg-tag.ok    { background: rgba(16,185,129,.18); color: var(--gr); }
.dbg-tag.warn  { background: rgba(245,158,11,.18); color: var(--am); }
.dbg-tag.error { background: rgba(239,68,68,.18); color: var(--rd); }

.dbg-action {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 12px 14px;
  background: linear-gradient(135deg, var(--a), var(--adk));
  color: #fff;
  border: 0;
  border-radius: 8px;
  font: 700 12px/1 'IBM Plex Mono', monospace;
  letter-spacing: .04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity .15s;
  font-family: inherit;
}
.dbg-action:hover { opacity: .85; }
.dbg-action:disabled { opacity: .35; cursor: default; }
.dbg-action-row { display: flex; gap: 8px; }
.dbg-action.secondary {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--a) 40%, transparent);
  color: var(--a);
}

.dbg-err {
  padding: 32px 20px;
  text-align: center;
  font: 600 14px/1.5 'IBM Plex Mono', monospace;
  color: var(--rd);
}
</style>`;

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  // Garde-fou côté UI (la vraie sécu = la RPC qui check email)
  if (me.email !== 'rayannabli27@gmail.com') {
    root.innerHTML = `${STYLE}<div class="dbg"><div class="dbg-err">
      ⛔ Cette page est réservée à l'administrateur.<br>
      <span style="font-size:12px;color:var(--mu2);margin-top:8px;display:block">
        Connecté en tant que : ${esc(me.email || me.id)}
      </span>
    </div></div>`;
    return;
  }

  track('admin.debug_opened');
  render(root, null);
  await refresh(root);
}

async function refresh(root) {
  try {
    const [dashRes, fraudRes] = await Promise.allSettled([
      sb.rpc('admin_get_dashboard'),
      sb.rpc('get_fraud_signals'),
    ]);
    if (dashRes.status !== 'fulfilled' || dashRes.value.error) {
      throw dashRes.status === 'fulfilled' ? dashRes.value.error : new Error('dashboard_failed');
    }
    const fraud = fraudRes.status === 'fulfilled' && !fraudRes.value.error
      ? (fraudRes.value.data || [])
      : [];
    render(root, dashRes.value.data, fraud);
  } catch (e) {
    console.error('[debug] fetch failed', e);
    root.innerHTML = `${STYLE}<div class="dbg"><div class="dbg-err">
      ⚠️ Erreur : ${esc(e?.message || 'unknown')}
    </div></div>`;
  }
}

function render(root, data, fraud = []) {
  if (!data) {
    root.innerHTML = `${STYLE}<div class="dbg">
      <div class="dbg-hd">
        <span class="dbg-title">▶ permigo://admin/debug</span>
        <span class="dbg-pulse"></span>
      </div>
      <div style="padding:32px 20px;color:var(--mu3);font-size:12px">loading…</div>
    </div>`;
    return;
  }

  const c = data.counts || {};
  const a = data.activity_24h || {};
  const crons = data.cron_jobs || [];
  const ts = new Date(data.generated_at).toLocaleTimeString('fr-FR');

  root.innerHTML = `${STYLE}<div class="dbg">
    <div class="dbg-hd">
      <span class="dbg-title">▶ permigo://admin/debug</span>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="dbg-pulse" title="Live"></span>
        <button class="dbg-refresh" id="dbg-refresh">⟳ refresh</button>
      </div>
    </div>

    <!-- ─── COUNTERS ─── -->
    <div class="dbg-grid">
      <div class="dbg-card"><div class="dbg-card-lbl">élèves</div><div class="dbg-card-val">${c.eleves}</div></div>
      <div class="dbg-card"><div class="dbg-card-lbl">enseignants</div><div class="dbg-card-val">${c.enseignants}</div></div>
      <div class="dbg-card"><div class="dbg-card-lbl">gérants</div><div class="dbg-card-val">${c.gerants}</div></div>
      <div class="dbg-card"><div class="dbg-card-lbl">auto-écoles</div><div class="dbg-card-val">${c.auto_ecoles}</div></div>
      <div class="dbg-card"><div class="dbg-card-lbl">validations acquis</div><div class="dbg-card-val">${c.validations}</div></div>
      <div class="dbg-card"><div class="dbg-card-lbl">questions REMC</div><div class="dbg-card-val">${c.questions}</div></div>
      <div class="dbg-card"><div class="dbg-card-lbl">quiz attempts</div><div class="dbg-card-val">${c.quiz_attempts}</div></div>
      <div class="dbg-card"><div class="dbg-card-lbl">notifications</div><div class="dbg-card-val">${c.notifications}</div></div>
      <div class="dbg-card"><div class="dbg-card-lbl">push subs</div><div class="dbg-card-val">${c.push_subs}</div></div>
      <div class="dbg-card"><div class="dbg-card-lbl">invits pending</div><div class="dbg-card-val">${c.invitations_pending}</div></div>
    </div>

    <!-- ─── ACTIVITY 24h ─── -->
    <div class="dbg-section">
      <div class="dbg-section-hd">Activity — 24h</div>
      <div class="dbg-row"><span class="l">validations</span><span class="v">${a.validations || 0}</span></div>
      <div class="dbg-row"><span class="l">quiz attempts</span><span class="v">${a.quiz_attempts || 0}</span></div>
      <div class="dbg-row"><span class="l">new profiles</span><span class="v">${a.new_profiles || 0}</span></div>
      <div class="dbg-row"><span class="l">notifications</span><span class="v">${a.notifications || 0}</span></div>
    </div>

    <!-- ─── CRON JOBS ─── -->
    <div class="dbg-section">
      <div class="dbg-section-hd">pg_cron jobs (${crons.length})</div>
      ${crons.length === 0 ? '<div style="color:var(--mu3);font-size:12px">no jobs</div>' : crons.map(j => `
        <div class="dbg-row">
          <span class="l">${esc(j.name)}</span>
          <div style="display:flex;gap:8px;align-items:center">
            <code style="color:var(--aml);font-size:11px">${esc(j.schedule)}</code>
            <span class="dbg-tag ${j.active ? 'ok' : 'error'}">${j.active ? 'active' : 'paused'}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- ─── FRAUD SIGNALS ─── -->
    <div class="dbg-section">
      <div class="dbg-section-hd">Fraud signals — 30j (${fraud.filter(f => f.flag_count > 0).length} flagged)</div>
      ${fraud.length === 0 ? '<div style="color:var(--mu3);font-size:12px">no signals</div>' : fraud.slice(0, 12).map(f => {
        const cls = f.flag_count >= 2 ? 'error' : f.flag_count === 1 ? 'warn' : 'ok';
        const hh = Math.floor(Number(f.total_minutes || 0) / 60);
        const mm = Number(f.total_minutes || 0) % 60;
        return `
        <div class="dbg-row">
          <span class="l">${esc(f.prenom || '?')} ${esc(f.nom || '')}</span>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
            <code style="color:var(--mu2);font-size:10px">${hh}h${String(mm).padStart(2,'0')} · ${f.total_sessions||0}s · ${f.n_validations||0}v · ${f.n_eleves_diff||0}e</code>
            <span class="dbg-tag ${cls}">${f.flag_count > 0 ? f.flag_count + ' flag' + (f.flag_count > 1 ? 's' : '') : 'clean'}</span>
          </div>
        </div>
        ${f.flag_count > 0 ? `<div style="padding:4px 0 8px;font:500 10px/1.4 'IBM Plex Mono',monospace;color:var(--mu2)">
          ${[f.flag_refused_sessions && '• refusals élève',
             f.flag_high_auto_rate && '• taux auto-valid >50%',
             f.flag_hours_zero_val && '• 150h+ sans validation',
             f.flag_single_eleve_burst && '• un seul élève, 8+ sessions',
             f.flag_high_daily_avg && '• moyenne >8h/jour'
            ].filter(Boolean).join(' ')}
        </div>` : ''}
        `;
      }).join('')}
    </div>

    <!-- ─── QUICK ACTIONS ─── -->
    <div class="dbg-section">
      <div class="dbg-section-hd">Quick actions</div>
      <div class="dbg-action-row">
        <button class="dbg-action" data-action="check-streak">▶ check-streak-risk</button>
        <button class="dbg-action" data-action="check-students">▶ check-students-at-risk</button>
      </div>
      <div class="dbg-action-row" style="margin-top:8px">
        <button class="dbg-action" data-action="refresh-streak-pro">▶ refresh-streak-pro</button>
        <button class="dbg-action secondary" data-action="refresh">⟳ reload data</button>
      </div>
    </div>

    <div class="dbg-section" style="border-top:0">
      <div style="font:500 10px/1.4 'IBM Plex Mono',monospace;color:var(--mu4);text-align:center">
        snapshot at ${esc(ts)}
      </div>
    </div>
  </div>`;

  root.querySelector('#dbg-refresh')?.addEventListener('click', () => refresh(root));

  root.querySelectorAll('.dbg-action[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      if (action === 'refresh') { refresh(root); return; }

      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = '… running';
      try {
        const fnName = action === 'check-streak' ? 'check-streak-risk'
                     : action === 'check-students' ? 'check-students-at-risk'
                     : action === 'refresh-streak-pro' ? 'refresh-streak-pro'
                     : null;
        if (!fnName) throw new Error('unknown action');
        const { data, error } = await sb.functions.invoke(fnName, { body: {} });
        if (error) throw error;
        btn.textContent = '✓ ' + JSON.stringify(data).slice(0, 30);
        setTimeout(() => { btn.textContent = label; btn.disabled = false; }, 2500);
        track('admin.action_run', { action: fnName });
      } catch (e) {
        btn.textContent = '✗ err';
        setTimeout(() => { btn.textContent = label; btn.disabled = false; }, 2500);
      }
    });
  });
}
