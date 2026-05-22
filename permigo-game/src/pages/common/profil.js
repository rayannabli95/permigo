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
import { isPushEnabled, requestPushPermission, optOutPush, optInPush } from '@/services/web-push.js';
import { mountMoniteurRanking } from '@/components/moniteur-ranking.js';

// ─── CSS (cohérent avec design system permigo-game) ─────────────
const STYLE = `<style>
.prf {
  padding: 20px 16px calc(60px + env(safe-area-inset-bottom, 0px) + 24px); /* #15 — clearance bottom nav */
  max-width: 480px;
  margin: 0 auto;
  color: var(--ink);
  font-family: 'Inter', sans-serif;
  background: var(--bg);
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
  color: var(--ink);
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

/* #19 — tuiles d'accès galerie + wrapped (élève only) */
.prf-nav-tiles { display: flex; gap: 10px; margin: 16px 0; }
.prf-nav-tile {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 12px;
  background: var(--su); border: 1px solid var(--bo); border-radius: 16px;
  color: var(--tx, #0b0d1a); text-decoration: none;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  box-shadow: 0 1px 3px rgba(10,13,26,.06);
  transition: transform .12s, box-shadow .2s;
}
.prf-nav-tile:active { transform: scale(.98); }
.prf-nav-ico { font-size: 18px; line-height: 1; }

/* Info section */
.prf-section {
  background: var(--su);
  border: 1px solid var(--bo);
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
  border-bottom: 1px solid var(--bo2);
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
  transition: background .2s, transform .15s;
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
  color: var(--mu2);
  font: 500 13px/1 'Inter', sans-serif;
  cursor: pointer;
  text-decoration: underline;
}

/* Mon Année — enseignant only */
.prf-annee {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-annee-ttl {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mu2);
  margin: 0 0 16px;
}
.prf-annee-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.prf-kpi {
  background: var(--bg);
  border: 1px solid var(--bo);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
}
.prf-kpi-n {
  font: 700 28px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  display: block;
  margin-bottom: 6px;
  letter-spacing: -0.025em;
}
.prf-kpi-lbl {
  font: 500 11px/1.3 'Inter', sans-serif;
  color: var(--mu2);
}
.prf-streak {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-streak-ico { font-size: 24px; line-height: 1; }
.prf-streak-body { flex: 1; }
.prf-streak-n {
  font: 700 20px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -0.022em;
}
.prf-streak-lbl {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: var(--mu2);
  margin-top: 4px;
}

/* Version */
.prf-version {
  text-align: center;
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  padding: 20px 0 0;
}

/* ── Notification toggle ── */
.prf-notif-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bo2);
  cursor: pointer;
  transition: background .15s;
  min-height: 60px;
}
.prf-notif-row:active { background: var(--bg); transform: scale(.99); }
@media(hover:hover)and(pointer:fine){.prf-notif-row:hover{background:#f8f9fc}}
.prf-notif-ico { font-size: 18px; line-height: 1; flex-shrink: 0; }
.prf-notif-body { flex: 1; min-width: 0; }
.prf-notif-lbl { font: 600 14px/1.3 'Inter', sans-serif; color: #0a0d1a; }
.prf-notif-sub { font: 500 12px/1.3 'Inter', sans-serif; color: #94a3b8; margin-top: 2px; }
/* iOS-style toggle pill */
.prf-toggle {
  flex-shrink: 0;
  position: relative;
  width: 44px; height: 26px;
  background: #d1d8ee;
  border-radius: 13px;
  transition: background .2s cubic-bezier(.23,1,.32,1);
  pointer-events: none; /* le click est géré par la row */
}
.prf-toggle.on { background: #6366f1; }
.prf-toggle::after {
  content: '';
  position: absolute;
  top: 3px; left: 3px;
  width: 20px; height: 20px;
  background: var(--su);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
  transition: transform .2s cubic-bezier(.23,1,.32,1);
}
.prf-toggle.on::after { transform: translateX(18px); }
/* État "bloqué par le navigateur" */
.prf-notif-denied { font: 500 12px/1.3 'Inter', sans-serif; color: #f97316; margin-top: 2px; }
@media(prefers-reduced-motion:reduce){.prf-toggle,.prf-toggle::after{transition:none}}

/* ── Parrainage (élève) ── */
.prf-ref {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-ref-ttl {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mu2);
  margin: 0 0 14px;
}
.prf-ref-code-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.prf-ref-code {
  flex: 1;
  font: 700 18px/1 'IBM Plex Mono', monospace;
  color: #6366f1;
  letter-spacing: .1em;
}
.prf-ref-copy-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background .12s;
}
.prf-ref-copy-btn:active { background: rgba(99,102,241,.1); }
.prf-ref-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.prf-ref-stat {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--bo);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}
.prf-ref-stat-n {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  display: block;
  margin-bottom: 4px;
}
.prf-ref-stat-lbl {
  font: 500 10px/1.3 'Inter', sans-serif;
  color: var(--mu2);
}
.prf-ref-share-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 12px;
  color: #fff;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: transform 120ms cubic-bezier(.23,1,.32,1), opacity 120ms;
  min-height: 46px;
}
.prf-ref-share-btn:active { transform: scale(.97); }
.prf-ref-gen-btn {
  width: 100%;
  padding: 13px;
  background: rgba(99,102,241,.08);
  border: 1.5px solid rgba(99,102,241,.2);
  border-radius: 12px;
  color: #6366f1;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: background .15s;
  min-height: 46px;
}
.prf-ref-gen-btn:active { background: rgba(99,102,241,.15); }
.prf-ref-apply {
  margin-top: 14px;
  display: flex;
  gap: 8px;
}
.prf-ref-apply-input {
  flex: 1;
  padding: 12px 14px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  font: 600 14px/1 'IBM Plex Mono', monospace;
  color: var(--ink);
  letter-spacing: .08em;
  text-transform: uppercase;
  outline: none;
  transition: border-color .14s;
  min-height: 44px;
}
.prf-ref-apply-input:focus { border-color: #6366f1; }
.prf-ref-apply-btn {
  padding: 0 16px;
  background: #0a0d1a;
  border: none;
  border-radius: 12px;
  color: #fff;
  font: 700 13px/1 'Inter', sans-serif;
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;
  transition: background .12s;
}
.prf-ref-apply-btn:active { background: #1e2235; }
.prf-ref-apply-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>`;

const ROLE_LABELS = { eleve: 'Élève', enseignant: 'Enseignant', gerant: 'Gérant' };

function renderAccountActions(me) {
  return `
    <button class="prf-btn-logout" id="btn-logout">Se déconnecter</button>
    ${me.role === 'eleve' ? '<button class="prf-btn-delete" id="btn-delete">Supprimer mon compte</button>' : ''}
  `;
}

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
    .select('email, prenom, nom, xp, streak_pro_days, created_at, avatar_url, avatar_preset, banner_url')
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

  // Pour élève : parrainage
  let referralStats = null;
  if (me.role === 'eleve') {
    const { data: rStats } = await sb.rpc('get_my_referral_stats');
    referralStats = (rStats && !rStats.error) ? rStats : null;
  }

  // Pour enseignant : stats "Mon Année"
  let anneeStats = null;
  if (me.role === 'enseignant') {
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: valData }, { data: streakProfile }, { data: elevesData }] = await Promise.all([
      sb.from('validations')
        .select('competence_id, eleve_id, validated_at')
        .eq('validated_by', me.id)
        .gte('validated_at', yearStart),
      sb.from('profiles')
        .select('streak_pro_days')
        .eq('id', me.id)
        .single(),
      sb.from('profiles')
        .select('id')
        .eq('role', 'eleve')
        .eq('enseignant_id', me.id)
        .is('deleted_at', null),
    ]);

    const vals = valData || [];
    const totalValidations = vals.length;
    // Union: élèves assignés + élèves ayant au moins une validation (pour rétrocompatibilité)
    const elevesIds = new Set((elevesData || []).map(e => e.id));
    for (const v of vals) elevesIds.add(v.eleve_id);
    const elevesCount = elevesIds.size;
    const c3Count = vals.filter(v => v.competence_id?.startsWith('C3')).length;
    // streak_pro_days est mis à jour par trigger DB mais peut avoir 1 jour de délai
    // si une validation existe aujourd'hui on garantit au moins 1
    const hasValidationToday = vals.some(v => v.validated_at?.startsWith(today));
    const streakDays = Math.max(streakProfile?.streak_pro_days ?? 0, hasValidationToday ? 1 : 0);

    anneeStats = { totalValidations, elevesCount, c3Count, streakDays };
  }

  const displayName = me.nom || profile?.email || me.email || '?';
  const initials = displayName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

  // ─── Données pour la ProfileCard sociale (élève + enseignant) ──────
  let profileCardData = null;
  if (me.role === 'eleve' && permisData) {
    profileCardData = {
      me: { ...me, prenom: profile?.prenom || '', nom: profile?.nom || '' },
      avatarUrl: profile?.avatar_url || null,
      avatarPreset: profile?.avatar_preset || null,
      bannerUrl: profile?.banner_url || null,
      count: permisData.validated, // pour calcul prestige (max 31)
      bio: `Apprenti permis B · ${permisData.validated}/${REMC_TOTAL} compétences`,
      stats: [
        { label: 'Compétences', value: permisData.validated },
        { label: 'Streak',      value: profile?.streak_days ?? profile?.streak_pro_days ?? 0 },
        { label: 'XP',          value: profile?.xp || 0 },
      ],
      shareUrl: window.location.origin,
      shareText: `Je suis à ${permisData.validated}/${REMC_TOTAL} compétences validées sur PermiGo 🚗`,
    };
  } else if (me.role === 'enseignant' && anneeStats) {
    profileCardData = {
      me: { ...me, prenom: profile?.prenom || '', nom: profile?.nom || '' },
      avatarUrl: profile?.avatar_url || null,
      avatarPreset: profile?.avatar_preset || null,
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

  ${me.role === 'eleve' ? `
  <div class="prf-nav-tiles">
    <a class="prf-nav-tile" href="#/galerie" aria-label="Ouvrir ta galerie">
      <span class="prf-nav-ico" aria-hidden="true">🖼️</span><span>Ta galerie</span>
    </a>
    <a class="prf-nav-tile" href="#/wrapped" aria-label="Ouvrir ton Wrapped">
      <span class="prf-nav-ico" aria-hidden="true">🎁</span><span>Ton Wrapped</span>
    </a>
  </div>` : ''}

  ${referralStats !== null ? `<div id="prf-ref-section">${_renderReferral(referralStats)}</div>` : ''}

  ${anneeStats ? `<div id="prf-ranking-host"></div>` : ''}

  ${anneeStats ? `
  <div class="prf-streak">
    <span class="prf-streak-ico" style="color:#f97316;display:flex;align-items:center" aria-hidden="true">${icon('flame', { size: 28, strokeWidth: 2.2 })}</span>

    <div class="prf-streak-body">
      <div class="prf-streak-n">${anneeStats.streakDays} jour${anneeStats.streakDays !== 1 ? 's' : ''}</div>
      <div class="prf-streak-lbl">d'affilée cette semaine</div>
    </div>
  </div>

  <div class="prf-annee">
    <h2 class="prf-annee-ttl">Ma chasse en ${new Date().getFullYear()}</h2>
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

  ${_renderNotifToggle()}

  ${renderAccountActions(me)}

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

  // Mount ranking moniteur (enseignant uniquement)
  if (me.role === 'enseignant') {
    const rankingHost = root.querySelector('#prf-ranking-host');
    if (rankingHost) mountMoniteurRanking(rankingHost, { myId: me.id }).catch(() => {});
  }

  // Wire referral (élève)
  if (me.role === 'eleve') _wireReferral(root, me);

  root.querySelector('#btn-logout')?.addEventListener('click', async () => {
    track('auth.logout', { user_role: me.role });
    try {
      await logout();
    } catch (e) {
      console.error('[profil] logout failed', e);
      const { toast } = await import('@/components/toast.js');
      toast('Déconnexion impossible — réessaie', 'error');
    }
  });

  root.querySelector('#btn-delete')?.addEventListener('click', () => {
    alert('La suppression de compte est gérée par l\'administrateur de ton auto-école. Contacte-le directement.');
  });

  _wireNotifToggle(root);
}

// ─── Referral (élève) ─────────────────────────────────────────────

function _renderReferral(stats) {
  const code     = stats?.code;
  const nRefs    = stats?.n_referrals ?? 0;
  const xpEarned = stats?.xp_earned ?? 0;

  return `
<div class="prf-ref">
  <h2 class="prf-ref-ttl">Parrainage · +200 XP par filleul</h2>

  ${code ? `
  <div class="prf-ref-code-wrap">
    <span class="prf-ref-code" id="prf-ref-code">${esc(code)}</span>
    <button class="prf-ref-copy-btn" id="prf-ref-copy" title="Copier le code">📋</button>
  </div>
  <div class="prf-ref-stats">
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${nRefs}</span>
      <div class="prf-ref-stat-lbl">filleul${nRefs !== 1 ? 's' : ''}</div>
    </div>
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${xpEarned}</span>
      <div class="prf-ref-stat-lbl">XP gagnés</div>
    </div>
  </div>
  <button class="prf-ref-share-btn" id="prf-ref-share">Partager mon code 🔗</button>
  ` : `
  <button class="prf-ref-gen-btn" id="prf-ref-gen">Générer mon code de parrainage</button>
  `}

  <div class="prf-ref-apply">
    <input class="prf-ref-apply-input" id="prf-ref-input" type="text"
           placeholder="Code d'un ami…" maxlength="12" autocomplete="off">
    <button class="prf-ref-apply-btn" id="prf-ref-apply-btn">Appliquer</button>
  </div>
</div>`;
}

function _wireReferral(root, me) {
  const section = root.querySelector('#prf-ref-section');
  if (!section) return;

  // Copy code
  section.querySelector('#prf-ref-copy')?.addEventListener('click', async () => {
    const code = section.querySelector('#prf-ref-code')?.textContent?.trim();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      const btn = section.querySelector('#prf-ref-copy');
      if (btn) { btn.textContent = '✓'; setTimeout(() => { btn.textContent = '📋'; }, 1500); }
      track('referral.code_copied', {});
    } catch { /* clipboard unavailable */ }
  });

  // Share code
  section.querySelector('#prf-ref-share')?.addEventListener('click', async () => {
    const code = section.querySelector('#prf-ref-code')?.textContent?.trim();
    if (!code) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins PermiGo !',
          text: `Utilise mon code ${code} sur PermiGo et gagne 200 XP 🚗`,
          url: window.location.origin,
        });
        track('referral.shared', { code });
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(`Mon code PermiGo : ${code} — ${window.location.origin}`);
        const { toast: _toast } = await import('@/components/toast.js');
        _toast('Lien copié 📋', 'success');
      } catch { /* unavailable */ }
    }
  });

  // Generate code
  section.querySelector('#prf-ref-gen')?.addEventListener('click', async () => {
    const btn = section.querySelector('#prf-ref-gen');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = 'Génération…';
    try {
      const { data, error } = await sb.rpc('generate_referral_code');
      if (error || data?.error) {
        const { toast: _toast } = await import('@/components/toast.js');
        _toast(data?.error || 'Impossible de générer le code', 'error');
        btn.disabled = false;
        btn.textContent = 'Générer mon code de parrainage';
        return;
      }
      track('referral.code_generated', {});
      const { data: rStats } = await sb.rpc('get_my_referral_stats');
      if (rStats && !rStats.error) {
        section.innerHTML = _renderReferral(rStats);
        _wireReferral(root, me);
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'Générer mon code de parrainage';
    }
  });

  // Apply referral code
  const applyBtn = section.querySelector('#prf-ref-apply-btn');
  const applyInput = section.querySelector('#prf-ref-input');
  applyBtn?.addEventListener('click', async () => {
    const code = applyInput?.value?.trim().toUpperCase();
    if (!code || code.length < 4) return;
    applyBtn.disabled = true;
    applyBtn.textContent = '…';
    try {
      const { data, error } = await sb.rpc('apply_referral', { code });
      const { toast: _toast } = await import('@/components/toast.js');
      if (error || data?.error) {
        _toast(data?.error || 'Code invalide ou déjà utilisé', 'error');
      } else {
        _toast('Code appliqué ! +200 XP et +50 💎', 'success', 4000);
        track('referral.applied', { code });
        if (applyInput) applyInput.value = '';
      }
    } catch {
      const { toast: _toast } = await import('@/components/toast.js');
      _toast('Erreur de connexion', 'error');
    } finally {
      applyBtn.disabled = false;
      applyBtn.textContent = 'Appliquer';
    }
  });
}

// ─── Notifications toggle ─────────────────────────────────────────

function _renderNotifToggle() {
  if (!('Notification' in window)) return ''; // API absente (iOS < 16.4 en dehors de PWA)

  const denied  = Notification.permission === 'denied';
  const enabled = isPushEnabled();

  return `
  <div class="prf-section">
    <div class="prf-notif-row" id="prf-notif-row" role="button" tabindex="0"
         aria-pressed="${enabled}" aria-label="Notifications ${enabled ? 'activées' : 'désactivées'}">
      <span class="prf-notif-ico">${icon('bell', { size: 18 })}</span>
      <div class="prf-notif-body">
        <div class="prf-notif-lbl">Notifications</div>
        ${denied
          ? `<div class="prf-notif-denied">Bloquées par le navigateur — autorise-les dans les réglages</div>`
          : `<div class="prf-notif-sub">${enabled ? 'Quiz et streak actifs' : 'Désactivées'}</div>`
        }
      </div>
      ${!denied ? `<div class="prf-toggle ${enabled ? 'on' : ''}" aria-hidden="true"></div>` : ''}
    </div>
  </div>`;
}

function _wireNotifToggle(root) {
  const row = root.querySelector('#prf-notif-row');
  if (!row || Notification.permission === 'denied') return;

  const toggle = row.querySelector('.prf-toggle');
  const sub    = row.querySelector('.prf-notif-sub');

  async function flip() {
    const nowEnabled = isPushEnabled();
    row.setAttribute('aria-pressed', String(!nowEnabled));
    if (nowEnabled) {
      await optOutPush();
      toggle?.classList.remove('on');
      if (sub) sub.textContent = 'Désactivées';
    } else {
      const granted = await optInPush();
      if (granted) {
        toggle?.classList.add('on');
        if (sub) sub.textContent = 'Quiz et streak actifs';
      } else if (Notification.permission === 'denied') {
        // L'utilisateur a refusé → met à jour le texte
        if (sub) sub.outerHTML = `<div class="prf-notif-denied">Bloquées par le navigateur — autorise-les dans les réglages</div>`;
        toggle?.remove();
      }
    }
  }

  row.addEventListener('click', flip);
  row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
}
