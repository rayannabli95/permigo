// ═══════════════════════════════════════════════════════════════
// Profil — commun à tous les rôles
// ═══════════════════════════════════════════════════════════════
import { sb, logout } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { mountPermisCard } from '@/components/permis-card.js';
import { mountProfileCard } from '@/components/profile-card.js';
import { REMC_TOTAL } from '@/data/remc.js';
import { icon } from '@/utils/icons.js';

// ─── CSS (cohérent avec design system permigo-game) ─────────────
const STYLE = `<style>
.prf {
  padding: 20px 16px 100px;
  max-width: 480px;
  margin: 0 auto;
  color: #0a0d1a;
  font-family: 'Inter', sans-serif;
  background: #f8f9fc;
}
.prf-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
}
.prf-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font: 700 32px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  box-shadow: 0 8px 24px rgba(99,102,241,.25);
}
.prf-name {
  font: 700 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  text-align: center;
  letter-spacing: -0.022em;
}
.prf-role-badge {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #6366f1;
  background: rgba(99,102,241,.1);
  border-radius: 99px;
  padding: 6px 12px;
}

/* Info section */
.prf-section {
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 20px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f8;
}
.prf-row:last-child { border-bottom: none; }
.prf-row-ico { font-size: 18px; line-height: 1; flex-shrink: 0; }
.prf-row-body { flex: 1; min-width: 0; }
.prf-row-lbl { font: 500 11px/1 'Inter', sans-serif; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .04em; }
.prf-row-val { font: 600 14px/1.3 'Inter', sans-serif; color: #0a0d1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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
  color: #94a3b8;
  font: 500 13px/1 'Inter', sans-serif;
  cursor: pointer;
  text-decoration: underline;
}

/* Mon Année — enseignant only */
.prf-annee {
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-annee-ttl {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 0 0 16px;
}
.prf-annee-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.prf-kpi {
  background: #f8f9fc;
  border: 1px solid #e2e6f2;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
}
.prf-kpi-n {
  font: 700 28px/1 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  display: block;
  margin-bottom: 6px;
  letter-spacing: -0.025em;
}
.prf-kpi-lbl {
  font: 500 11px/1.3 'Inter', sans-serif;
  color: #94a3b8;
}
.prf-streak {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-streak-ico { font-size: 24px; line-height: 1; }
.prf-streak-body { flex: 1; }
.prf-streak-n {
  font: 700 20px/1 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  letter-spacing: -0.022em;
}
.prf-streak-lbl {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: #94a3b8;
  margin-top: 4px;
}

/* Version */
.prf-version {
  text-align: center;
  font: 500 11px/1 'Inter', sans-serif;
  color: #94a3b8;
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

  // Fetch profil complet (xp, streak_pro_days, prenom, created_at, avatar, banner)
  const { data: profile } = await sb
    .from('profiles')
    .select('email, prenom, nom, xp, streak_pro_days, created_at, avatar_url, banner_url')
    .eq('id', me.id)
    .single();

  // Pour élève : compte des compétences validées (pour la carte permis)
  let permisData = null;
  if (me.role === 'eleve') {
    const { data: valData } = await sb
      .from('validations')
      .select('competence_id')
      .eq('eleve_id', me.id)
      .eq('statut', 'acquis');
    permisData = {
      prenom: profile?.prenom || '',
      nom: profile?.nom || '',
      created_at: profile?.created_at || null,
      validated: (valData || []).length,
      total: REMC_TOTAL,
    };
  }

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

  // ─── Données pour la ProfileCard sociale (élève + enseignant) ──────
  let profileCardData = null;
  if (me.role === 'eleve' && permisData) {
    profileCardData = {
      me: { ...me, prenom: profile?.prenom || '', nom: profile?.nom || '' },
      avatarUrl: profile?.avatar_url || null,
      bannerUrl: profile?.banner_url || null,
      count: permisData.validated, // pour calcul prestige (max 31)
      bio: `Apprenti permis B · ${permisData.validated}/${REMC_TOTAL} compétences`,
      stats: [
        { label: 'Compétences', value: permisData.validated },
        { label: 'Streak',      value: profile?.streak_pro_days || 0 },
        { label: 'XP',          value: profile?.xp || 0 },
      ],
      shareUrl: window.location.origin,
      shareText: `Je suis à ${permisData.validated}/${REMC_TOTAL} compétences validées sur PermiGo 🚗`,
    };
  } else if (me.role === 'enseignant' && anneeStats) {
    profileCardData = {
      me: { ...me, prenom: profile?.prenom || '', nom: profile?.nom || '' },
      avatarUrl: profile?.avatar_url || null,
      bannerUrl: profile?.banner_url || null,
      count: anneeStats.totalValidations, // pour calcul prestige (carrière)
      bio: `Moniteur · ${anneeStats.elevesCount} élève${anneeStats.elevesCount > 1 ? 's' : ''} accompagné${anneeStats.elevesCount > 1 ? 's' : ''}`,
      stats: [
        { label: 'Validations', value: anneeStats.totalValidations },
        { label: 'Élèves',      value: anneeStats.elevesCount },
        { label: 'Streak',      value: anneeStats.streakDays },
      ],
      shareUrl: window.location.origin,
      shareText: `${anneeStats.totalValidations} validations REMC sur PermiGo cette année 🎯`,
    };
  }

  root.innerHTML = `${STYLE}
<div class="prf anim-slide-up">
  ${profileCardData
    ? `<div id="prf-social-card"></div>`
    : `<div class="prf-avatar-wrap">
        <div class="prf-avatar">${esc(initials)}</div>
        <div class="prf-name">${esc(displayName)}</div>
        <span class="prf-role-badge">${esc(ROLE_LABELS[me.role] || me.role)}</span>
      </div>`
  }

  ${permisData ? `<div id="prf-permis-card" style="margin-top:16px"></div>` : ''}

  ${anneeStats ? `
  <div class="prf-streak">
    <img class="prf-streak-ico" src="/skins/permigo-streak-flame-v1.png" alt="" aria-hidden="true" style="width:32px;height:32px;object-fit:contain;" onerror="this.outerHTML='<span class=&quot;prf-streak-ico&quot; style=&quot;color:#f97316&quot;>${icon('flame', { size: 22, strokeWidth: 2.4 })}</span>'">

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
      <span class="prf-row-ico">${icon('mail', { size: 18 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Email</div>
        <div class="prf-row-val">${esc(profile?.email || me.email || '—')}</div>
      </div>
    </div>
    <div class="prf-row">
      <span class="prf-row-ico">${icon('user', { size: 18 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Rôle</div>
        <div class="prf-row-val">${esc(ROLE_LABELS[me.role] || me.role)}</div>
      </div>
    </div>
    ${profile?.xp != null ? `
    <div class="prf-row">
      <span class="prf-row-ico">${icon('zap', { size: 18 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">XP total</div>
        <div class="prf-row-val" style="color:#6366f1">${esc(String(profile.xp))} XP</div>
      </div>
    </div>` : ''}
    <div class="prf-row">
      <span class="prf-row-ico">${icon('key', { size: 18 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">ID profil</div>
        <div class="prf-row-val" style="font-size:11px;color:#94a3b8">${esc(me.id)}</div>
      </div>
    </div>
  </div>

  <button class="prf-btn-logout" id="btn-logout">Se déconnecter</button>
  <button class="prf-btn-delete" id="btn-delete">Supprimer mon compte</button>

  <div class="prf-version">PermiGo v7 · Sprint 2</div>
</div>`;

  // Mount ProfileCard sociale (élève + enseignant) — avatar/banner modifiables + partage
  if (profileCardData) {
    const socialHost = root.querySelector('#prf-social-card');
    if (socialHost) mountProfileCard(socialHost, profileCardData);
  }

  // Mount carte permis pour les élèves (avec tilt 3D au touch)
  if (permisData) {
    const cardHost = root.querySelector('#prf-permis-card');
    if (cardHost) mountPermisCard(cardHost, permisData);
  }

  root.querySelector('#btn-logout').addEventListener('click', async () => {
    track('auth.logout', { user_role: me.role });
    await logout();
  });

  root.querySelector('#btn-delete').addEventListener('click', () => {
    alert('La suppression de compte est gérée par l\'administrateur de ton auto-école. Contacte-le directement.');
  });
}
