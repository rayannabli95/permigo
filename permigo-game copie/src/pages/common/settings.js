// ═══════════════════════════════════════════════════════════════
// Settings — préférences utilisateur (notifs, confidentialité, compte)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/toast.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';

const STYLE = `<style>
.st {
  max-width: 480px;
  margin: 0 auto;
  background: #f8f9fc;
  min-height: 100dvh;
  padding-bottom: 80px;
  font-family: 'Inter', sans-serif;
}
.st-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e2e6f2;
  position: sticky;
  top: 0;
  z-index: 10;
}
.st-back {
  width: 36px; height: 36px;
  border-radius: 8px;
  border: 1px solid #e2e6f2;
  background: #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background .12s;
  color: #0b0d1a;
  font-family: inherit;
  padding: 0;
}
.st-back:hover { background: #f4f5fb; }
.st-page-title {
  font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0b0d1a;
  letter-spacing: -.02em;
}

.st-section {
  margin: 16px 16px 0;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 16px;
  overflow: hidden;
}
.st-section-label {
  padding: 12px 16px 6px;
  font: 700 11px/1 'IBM Plex Mono', monospace;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #94a3b8;
  background: #f8f9fc;
  border-bottom: 1px solid #f0f2f8;
}
.st-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f2f8;
  gap: 12px;
  min-height: 52px;
}
.st-row:last-child { border-bottom: 0; }
.st-row-left { flex: 1; min-width: 0; }
.st-row-title {
  font: 600 14px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0b0d1a;
}
.st-row-sub {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: #64748b;
  margin-top: 2px;
}
.st-row-action {
  flex-shrink: 0;
}

/* Toggle switch */
.st-tgl { position: relative; display: inline-block; width: 44px; height: 26px; cursor: pointer; }
.st-tgl input { display: none; }
.st-tgl-t { position: absolute; inset: 0; background: #d1d8ee; border-radius: 999px; transition: background .2s; }
.st-tgl-t::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
.st-tgl input:checked + .st-tgl-t { background: #6366f1; }
.st-tgl input:checked + .st-tgl-t::after { transform: translateX(18px); }

/* Text button */
.st-btn-txt {
  font: 600 13px/1 'Inter', sans-serif;
  color: #6366f1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 0;
  font-family: inherit;
}
.st-btn-txt.danger { color: #ef4444; }

/* Input inline */
.st-inp {
  width: 100%;
  padding: 10px 12px;
  font: 500 14px/1 'Inter', sans-serif;
  color: #0b0d1a;
  background: #f8f9fc;
  border: 1.5px solid #e2e6f2;
  border-radius: 10px;
  transition: border-color .15s;
  font-family: inherit;
}
.st-inp:focus { outline: none; border-color: #6366f1; }
.st-inp-row { padding: 10px 16px 14px; }
.st-save-btn {
  display: block;
  width: calc(100% - 32px);
  margin: 10px 16px 0;
  padding: 13px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 12px;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: background .15s;
  font-family: inherit;
}
.st-save-btn:hover { background: #4f46e5; }
.st-save-btn:disabled { opacity: .5; cursor: default; }

/* Danger zone */
.st-danger { border-color: rgba(239,68,68,.2); }
.st-danger .st-section-label { color: #ef4444; background: rgba(239,68,68,.04); border-color: rgba(239,68,68,.12); }

/* Appearance chip */
.st-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1.5px solid #6366f1;
  background: rgba(99,102,241,.08);
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: #6366f1;
}
</style>`;

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page_view', { page: 'settings', role: me.role });

  // Load current profile prefs
  const { data: profile } = await sb
    .from('profiles')
    .select('prenom, notif_push, notif_email, show_in_ranking, dnd_start, dnd_end')
    .eq('id', me.id)
    .maybeSingle();

  const prefs = {
    notifPush: profile?.notif_push ?? true,
    notifEmail: profile?.notif_email ?? true,
    showInRanking: profile?.show_in_ranking ?? false,
    dndStart: (profile?.dnd_start ?? '22:00:00').slice(0, 5),
    dndEnd: (profile?.dnd_end ?? '07:00:00').slice(0, 5),
    prenom: profile?.prenom ?? '',
  };

  render(root, me, prefs);
  wire(root, me, prefs);
}

function render(root, me, prefs) {
  root.innerHTML = `${STYLE}
<div class="st anim-slide-up">
  <div class="st-header">
    <button class="st-back" id="st-back" aria-label="Retour">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="st-page-title">Préférences</div>
  </div>

  <!-- NOTIFICATIONS -->
  <div class="st-section" style="margin-top:20px">
    <div class="st-section-label">Notifications</div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Notifications push</div>
        <div class="st-row-sub">Rappels et mises à jour dans le navigateur</div>
      </div>
      <div class="st-row-action">
        <label class="st-tgl" aria-label="Activer notifications push">
          <input type="checkbox" id="tgl-push" ${prefs.notifPush ? 'checked' : ''}>
          <span class="st-tgl-t"></span>
        </label>
      </div>
    </div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Notifications email</div>
        <div class="st-row-sub">Résumé hebdomadaire par email</div>
      </div>
      <div class="st-row-action">
        <label class="st-tgl" aria-label="Activer notifications email">
          <input type="checkbox" id="tgl-email" ${prefs.notifEmail ? 'checked' : ''}>
          <span class="st-tgl-t"></span>
        </label>
      </div>
    </div>
    <div class="st-row" style="flex-direction:column;align-items:flex-start;gap:8px">
      <div class="st-row-title">Ne pas déranger</div>
      <div style="display:flex;align-items:center;gap:8px;width:100%">
        <label style="font:500 12px/1 'Inter',sans-serif;color:#64748b;flex-shrink:0">De</label>
        <input class="st-inp" id="inp-dnd-start" type="time" value="${prefs.dndStart}" style="flex:1;padding:8px 10px">
        <label style="font:500 12px/1 'Inter',sans-serif;color:#64748b;flex-shrink:0">à</label>
        <input class="st-inp" id="inp-dnd-end" type="time" value="${prefs.dndEnd}" style="flex:1;padding:8px 10px">
        <button class="st-save-btn" id="btn-save-dnd" style="margin:0;width:auto;padding:8px 14px;font-size:12px">OK</button>
      </div>
    </div>
  </div>

  <!-- CONFIDENTIALITÉ -->
  <div class="st-section">
    <div class="st-section-label">Confidentialité</div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Classement national</div>
        <div class="st-row-sub">Apparaître dans le classement (disponible V2)</div>
      </div>
      <div class="st-row-action">
        <label class="st-tgl" aria-label="Apparaître dans le classement">
          <input type="checkbox" id="tgl-ranking" ${prefs.showInRanking ? 'checked' : ''}>
          <span class="st-tgl-t"></span>
        </label>
      </div>
    </div>
  </div>

  <!-- COMPTE -->
  <div class="st-section">
    <div class="st-section-label">Mon compte</div>
    <div class="st-row" style="flex-direction:column;align-items:flex-start;gap:8px">
      <div class="st-row-title">Prénom affiché</div>
      <div class="st-inp-row" style="padding:0;width:100%">
        <input class="st-inp" id="inp-prenom" type="text" value="${esc(prefs.prenom)}" maxlength="30" placeholder="Ton prénom" autocomplete="given-name">
      </div>
      <button class="st-save-btn" id="btn-save-prenom" style="margin:4px 0 0">Enregistrer</button>
    </div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Mot de passe</div>
        <div class="st-row-sub">Modifier via email de réinitialisation</div>
      </div>
      <div class="st-row-action">
        <button class="st-btn-txt" id="btn-reset-pwd">Modifier →</button>
      </div>
    </div>
  </div>

  <!-- APPARENCE -->
  <div class="st-section">
    <div class="st-section-label">Apparence</div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title">Thème</div>
        <div class="st-row-sub">Mode sombre disponible dans une prochaine version</div>
      </div>
      <div class="st-row-action">
        <span class="st-chip">☀️ Clair</span>
      </div>
    </div>
  </div>

  <!-- ZONE DANGER -->
  <div class="st-section st-danger">
    <div class="st-section-label">Zone critique</div>
    <div class="st-row">
      <div class="st-row-left">
        <div class="st-row-title" style="color:#ef4444">Supprimer mon compte</div>
        <div class="st-row-sub">Irréversible — toutes tes données seront effacées</div>
      </div>
      <div class="st-row-action">
        <button class="st-btn-txt danger" id="btn-delete-account">Supprimer</button>
      </div>
    </div>
  </div>

</div>`;
}

function wire(root, me, prefs) {
  root.querySelector('#st-back')?.addEventListener('click', () => navigate('/'));

  // Toggle changes — save debounced
  const savePrefs = _debounce(async () => {
    const push    = root.querySelector('#tgl-push')?.checked ?? prefs.notifPush;
    const email   = root.querySelector('#tgl-email')?.checked ?? prefs.notifEmail;
    const ranking = root.querySelector('#tgl-ranking')?.checked ?? prefs.showInRanking;
    const { error } = await sb.from('profiles')
      .update({ notif_push: push, notif_email: email, show_in_ranking: ranking })
      .eq('id', me.id);
    if (!error) {
      track('settings.prefs_saved', {});
      toast('Préférences enregistrées', 'success', 2000);
    }
  }, 800);

  root.querySelector('#tgl-push')?.addEventListener('change', savePrefs);
  root.querySelector('#tgl-email')?.addEventListener('change', savePrefs);
  root.querySelector('#tgl-ranking')?.addEventListener('change', savePrefs);

  // Save DND times
  root.querySelector('#btn-save-dnd')?.addEventListener('click', async () => {
    const start = root.querySelector('#inp-dnd-start')?.value;
    const end   = root.querySelector('#inp-dnd-end')?.value;
    if (!start || !end) return;
    const { error } = await sb.from('profiles')
      .update({ dnd_start: start, dnd_end: end })
      .eq('id', me.id);
    if (!error) {
      toast('Plage Ne pas déranger enregistrée', 'success', 2000);
      track('settings.dnd_saved', {});
    }
  });

  // Save prénom
  root.querySelector('#btn-save-prenom')?.addEventListener('click', async () => {
    const val = root.querySelector('#inp-prenom')?.value?.trim();
    if (!val) { toast('Le prénom ne peut pas être vide', 'error'); return; }
    const btn = root.querySelector('#btn-save-prenom');
    btn.disabled = true; btn.textContent = '…';
    const { error } = await sb.from('profiles').update({ prenom: val }).eq('id', me.id);
    btn.disabled = false; btn.textContent = 'Enregistrer';
    if (error) { toast('Erreur de sauvegarde', 'error'); return; }
    toast(`Prénom mis à jour : ${esc(val)}`, 'success');
    track('settings.prenom_updated', {});
  });

  // Reset password
  root.querySelector('#btn-reset-pwd')?.addEventListener('click', async () => {
    const email = me.email;
    if (!email) { toast('Email non disponible', 'error'); return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/#/settings`,
    });
    if (error) { toast('Erreur d\'envoi de l\'email', 'error'); return; }
    toast('Email de réinitialisation envoyé !', 'success', 5000);
    track('settings.pwd_reset_requested', {});
  });

  // Delete account — double confirmation
  root.querySelector('#btn-delete-account')?.addEventListener('click', () => {
    const confirmed = confirm('⚠️ Cette action est irréversible.\n\nToutes tes données (progression, trophées, streak) seront définitivement effacées.\n\nConfirmer la suppression ?');
    if (!confirmed) return;
    const confirmed2 = confirm('Dernière confirmation : supprimer définitivement ton compte PermiGo ?');
    if (!confirmed2) return;
    _deleteAccount(me);
  });
}

async function _deleteAccount(me) {
  track('account.delete_requested', {});
  toast('Suppression en cours…', 'info', 3000);
  const { error } = await sb.auth.admin?.deleteUser(me.id).catch(() => ({ error: new Error('not_admin') })) ?? { error: null };
  if (error) {
    toast('Contacte le support pour supprimer ton compte.', 'error', 6000);
    return;
  }
  await sb.auth.signOut();
  location.reload();
}

function _debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
