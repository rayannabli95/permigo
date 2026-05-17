// ═══════════════════════════════════════════════════════════════
// Profil — commun à tous les rôles
// ═══════════════════════════════════════════════════════════════
import { sb, logout } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.prf {
  padding: 20px 16px 100px;
  max-width: 480px;
  margin: 0 auto;
  color: var(--ink);
  font-family: var(--fb);
  background: var(--bg);
}
.prf-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 32px 0 28px;
}
.prf-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font: 800 32px/1 var(--fd);
  color: #fff;
  box-shadow: 0 8px 32px rgba(99,102,241,.3);
}
.prf-name {
  font: 800 22px/1.1 var(--fd);
  color: var(--ink);
  text-align: center;
}
.prf-role-badge {
  font: 700 11px/1 var(--fn);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--a);
  background: var(--ap);
  border: 1px solid rgba(99,102,241,.3);
  border-radius: 20px;
  padding: 4px 12px;
}

/* Info section */
.prf-section {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 18px;
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: var(--s1);
}
.prf-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 18px;
  border-bottom: 1px solid var(--bo);
}
.prf-row:last-child { border-bottom: none; }
.prf-row-ico { font-size: 18px; line-height: 1; flex-shrink: 0; }
.prf-row-body { flex: 1; min-width: 0; }
.prf-row-lbl { font: 500 11px/1 var(--fn); color: var(--mu); margin-bottom: 3px; }
.prf-row-val { font: 600 14px/1.3 var(--fb); color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Buttons */
.prf-btn-logout {
  width: 100%;
  padding: 16px;
  background: rgba(239,68,68,.08);
  border: 1.5px solid rgba(239,68,68,.25);
  border-radius: 16px;
  color: #ef4444;
  font: 700 15px/1 var(--fd);
  cursor: pointer;
  transition: all .2s;
  margin-bottom: 10px;
  min-height: 52px;
}
.prf-btn-logout:hover { background: rgba(239,68,68,.14); }
.prf-btn-logout:active { transform: scale(.98); }

.prf-btn-delete {
  width: 100%;
  padding: 14px;
  background: none;
  border: 0;
  color: var(--mu);
  font: 500 13px/1 var(--fb);
  cursor: pointer;
  text-decoration: underline;
}

/* Mon Année — enseignant only */
.prf-annee {
  background: var(--su);
  border: 1px solid rgba(99,102,241,.2);
  border-radius: 18px;
  padding: 20px 18px;
  margin-bottom: 14px;
  box-shadow: var(--s1);
}
.prf-annee-ttl {
  font: 700 11px/1 var(--fn);
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--a);
  margin: 0 0 16px;
}
.prf-annee-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.prf-kpi {
  background: var(--bg2);
  border: 1px solid var(--bo2);
  border-radius: 14px;
  padding: 14px 12px;
  text-align: center;
}
.prf-kpi-n {
  font: 800 28px/1 var(--fn);
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: block;
  margin-bottom: 6px;
}
.prf-kpi-lbl {
  font: 500 11px/1.3 var(--fb);
  color: var(--mu);
}
.prf-streak {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--su);
  border: 1px solid rgba(251,191,36,.3);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 14px;
  box-shadow: var(--s1);
}
.prf-streak-ico { font-size: 24px; line-height: 1; }
.prf-streak-body { flex: 1; }
.prf-streak-n {
  font: 800 20px/1 var(--fn);
  color: #d97706;
}
.prf-streak-lbl {
  font: 500 12px/1.3 var(--fb);
  color: var(--mu);
  margin-top: 3px;
}

/* Version */
.prf-version {
  text-align: center;
  font: 500 11px/1 var(--fn);
  color: var(--mu2);
  padding: 20px 0 0;
}
</style>`;

const ROLE_LABELS = { eleve: 'Élève', enseignant: 'Enseignant', gerant: 'Gérant' };

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page_view', { page: 'profil', user_role: me.role });

  // Skeleton
  root.innerHTML = `${STYLE}<div class="prf"><div class="skel skel-card" style="height:180px;margin-bottom:14px"></div><div class="skel skel-card"></div></div>`;

  // Fetch profil complet (xp, streak_pro_days)
  const { data: profile } = await sb
    .from('profiles')
    .select('email, nom, xp, streak_pro_days')
    .eq('id', me.id)
    .single();

  // Pour enseignant : stats "Mon Année"
  let anneeStats = null;
  if (me.role === 'enseignant') {
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const [{ data: valData }, { data: streakProfile }] = await Promise.all([
      sb.from('validations')
        .select('competence_id, eleve_id')
        .eq('validated_by', me.id)
        .gte('validated_at', yearStart),
      sb.from('profiles')
        .select('streak_pro_days')
        .eq('id', me.id)
        .single(),
    ]);

    const vals = valData || [];
    const totalValidations = vals.length;
    const elevesSet = new Set(vals.map(v => v.eleve_id));
    const c3Count = vals.filter(v => v.competence_id?.startsWith('C3')).length;
    const streakDays = streakProfile?.streak_pro_days ?? 0;

    anneeStats = { totalValidations, elevesCount: elevesSet.size, c3Count, streakDays };
  }

  const displayName = me.nom || profile?.email || me.email || '?';
  const initials = displayName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

  root.innerHTML = `${STYLE}
<div class="prf anim-slide-up">
  <div class="prf-avatar-wrap">
    <div class="prf-avatar">${esc(initials)}</div>
    <div class="prf-name">${esc(displayName)}</div>
    <span class="prf-role-badge">${esc(ROLE_LABELS[me.role] || me.role)}</span>
  </div>

  ${anneeStats ? `
  <div class="prf-streak">
    <span class="prf-streak-ico">🔥</span>
    <div class="prf-streak-body">
      <div class="prf-streak-n">${anneeStats.streakDays} jour${anneeStats.streakDays !== 1 ? 's' : ''}</div>
      <div class="prf-streak-lbl">d'affilée cette semaine</div>
    </div>
  </div>

  <div class="prf-annee">
    <div class="prf-annee-ttl">Ma chasse en ${new Date().getFullYear()}</div>
    <div class="prf-annee-grid">
      <div class="prf-kpi">
        <span class="prf-kpi-n">${anneeStats.totalValidations}</span>
        <div class="prf-kpi-lbl">compétences validées</div>
      </div>
      <div class="prf-kpi">
        <span class="prf-kpi-n">${anneeStats.elevesCount}</span>
        <div class="prf-kpi-lbl">élèves accompagnés</div>
      </div>
      <div class="prf-kpi">
        <span class="prf-kpi-n">${anneeStats.c3Count}</span>
        <div class="prf-kpi-lbl">C3 Maîtrise atteints</div>
      </div>
      <div class="prf-kpi">
        <span class="prf-kpi-n">—</span>
        <div class="prf-kpi-lbl">réussites permis (bientôt)</div>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="prf-section">
    <div class="prf-row">
      <span class="prf-row-ico">✉️</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Email</div>
        <div class="prf-row-val">${esc(profile?.email || me.email || '—')}</div>
      </div>
    </div>
    <div class="prf-row">
      <span class="prf-row-ico">🎭</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Rôle</div>
        <div class="prf-row-val">${esc(ROLE_LABELS[me.role] || me.role)}</div>
      </div>
    </div>
    ${profile?.xp != null ? `
    <div class="prf-row">
      <span class="prf-row-ico">⚡</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">XP total</div>
        <div class="prf-row-val" style="font-family:var(--fn);color:var(--a)">${esc(String(profile.xp))} XP</div>
      </div>
    </div>` : ''}
    <div class="prf-row">
      <span class="prf-row-ico">🔑</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">ID profil</div>
        <div class="prf-row-val" style="font-family:var(--fn);font-size:11px;color:var(--mu2)">${esc(me.id)}</div>
      </div>
    </div>
  </div>

  <button class="prf-btn-logout" id="btn-logout">Se déconnecter</button>
  <button class="prf-btn-delete" id="btn-delete">Supprimer mon compte</button>

  <div class="prf-version">PermiGo v7 · Sprint 2</div>
</div>`;

  root.querySelector('#btn-logout').addEventListener('click', async () => {
    track('auth.logout', { user_role: me.role });
    await logout();
  });

  root.querySelector('#btn-delete').addEventListener('click', () => {
    alert('La suppression de compte est gérée par l\'administrateur de ton auto-école. Contacte-le directement.');
  });
}
