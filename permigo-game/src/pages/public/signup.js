// ═══════════════════════════════════════════════════════════════
// Page publique — Signup via token d'invitation
// URL : #/signup?token=xxx
// Flow :
//   1. Récupère le token depuis l'URL
//   2. Vérifie l'invitation (existe, pas expirée, pas déjà acceptée)
//   3. Affiche le formulaire (email pré-rempli + mot de passe + nom)
//   4. À la soumission : sb.auth.signUp() → insère profile → marque invitation acceptée
//   5. Redirige vers l'accueil de son rôle
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { playLaunch } from '@/utils/sound.js';

const STYLE = `<style>
  .sg {
    min-height: 100dvh;
    background: linear-gradient(180deg, #f8f9fc 0%, #fff 100%);
    padding: 32px 20px max(60px, env(safe-area-inset-bottom));
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .sg-card {
    width: 100%;
    max-width: 420px;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 24px;
    padding: 28px 24px;
    box-shadow: 0 4px 24px rgba(10,13,26,.06);
    animation: sgIn .35s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes sgIn {
    from { opacity: 0; transform: translateY(12px) scale(.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .sg-logo {
    width: 56px; height: 56px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 16px;
    margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font: 800 22px/1 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.02em;
    box-shadow: 0 8px 24px rgba(99,102,241,.3);
  }
  .sg-title {
    font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    text-align: center;
    margin: 0 0 6px;
    letter-spacing: -.022em;
  }
  .sg-sub {
    font: 500 14px/1.5 'Inter', sans-serif;
    color: var(--mu);
    text-align: center;
    margin: 0 0 24px;
  }
  .sg-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .sg-label {
    font: 600 11px/1 'Inter', sans-serif;
    color: var(--mu);
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .sg-input {
    padding: 14px 16px;
    border: 1.5px solid var(--bo);
    border-radius: 14px;
    font: 500 15px/1.3 'Inter', sans-serif;
    color: var(--ink);
    background: var(--su);
    transition: border-color .15s ease, box-shadow .15s ease;
    font-family: inherit;
  }
  .sg-input:focus {
    outline: 0;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99,102,241,.12);
  }
  .sg-input[readonly] { background: var(--bg); color: #64748b; cursor: default; }
  .sg-input.error { border-color: #ef4444; }
  .sg-help {
    font: 500 11px/1.4 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 2px;
  }
  .sg-help.error { color: #ef4444; }
  .sg-btn {
    width: 100%;
    margin-top: 18px;
    padding: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border: 0;
    border-radius: 14px;
    font: 800 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(99,102,241,.35);
    transition: transform .12s, box-shadow .15s;
    font-family: inherit;
  }
  .sg-btn:active { transform: scale(.97); }
  .sg-btn:disabled { opacity: .4; cursor: default; box-shadow: none; }
  .sg-role-badge {
    display: inline-block;
    margin: 0 0 18px;
    padding: 5px 12px;
    background: rgba(99,102,241,.12);
    color: #4f46e5;
    border-radius: 99px;
    font: 700 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .sg-error-card {
    width: 100%;
    max-width: 420px;
    background: var(--su);
    border: 1px solid #fecaca;
    border-radius: 20px;
    padding: 28px;
    text-align: center;
  }
  .sg-error-ico { font-size: 38px; margin-bottom: 12px; }
  .sg-error-title {
    font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 8px;
    letter-spacing: -.022em;
  }
  .sg-error-msg {
    font: 500 13px/1.5 'Inter', sans-serif;
    color: var(--mu);
    margin: 0 0 18px;
  }
  .sg-link {
    color: #6366f1;
    font: 600 14px/1 'Inter', sans-serif;
    text-decoration: none;
    padding: 12px 24px;
    border: 1.5px solid var(--bo);
    border-radius: 12px;
    display: inline-block;
    transition: border-color .15s, background .15s;
  }
  .sg-link:hover { border-color: #6366f1; background: var(--bg2); }

  /* Skeleton */
  .sg-skel {
    width: 100%; max-width: 420px;
    height: 320px;
    background: linear-gradient(90deg, #f0f2f8 0%, #e4e8f4 50%, #f0f2f8 100%);
    background-size: 200% 100%;
    animation: sgSkel 1.4s infinite;
    border-radius: 24px;
  }
  @keyframes sgSkel { to { background-position: -200% 0; } }
</style>`;

export async function mount(root) {
  track('signup.viewed', { from: 'invitation_link' });

  // Skeleton initial
  root.innerHTML = `${STYLE}<div class="sg"><div class="sg-skel"></div></div>`;

  // Extract token from hash : #/signup?token=xxx
  const hash = location.hash; // e.g. #/signup?token=abc-123
  const queryIdx = hash.indexOf('?');
  const search = queryIdx >= 0 ? hash.slice(queryIdx + 1) : '';
  const params = new URLSearchParams(search);
  const token = params.get('token');

  if (!token) {
    renderError(root, 'Lien invalide', 'Ce lien d\'invitation ne contient pas de token. Vérifie l\'URL ou contacte ton auto-école.');
    return;
  }

  // Vérifie l'invitation via RPC sécurisée (lecture seule, sans exposer la table)
  let invitation;
  try {
    const { data, error } = await sb.rpc('get_invitation_by_token', { p_token: token });
    if (error) throw error;
    invitation = Array.isArray(data) ? data[0] : data;
    // Normalise pour matcher le shape attendu par renderForm
    if (invitation) {
      invitation.auto_ecoles = { nom: invitation.auto_ecole_nom };
    }
  } catch (e) {
    console.error('[signup] fetch invitation failed', e);
    renderError(root, 'Erreur de connexion', 'Impossible de vérifier ton invitation. Réessaie dans quelques secondes.');
    return;
  }

  if (!invitation) {
    renderError(root, 'Invitation introuvable', 'Ce lien n\'existe pas ou a été supprimé.');
    return;
  }
  if (invitation.accepted_at) {
    renderError(root, 'Déjà activé', 'Cette invitation a déjà été utilisée. Va directement te connecter.');
    return;
  }
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    renderError(root, 'Lien expiré', 'Ce lien a dépassé sa durée de validité (7 jours). Demande à ton auto-école d\'en envoyer un nouveau.');
    return;
  }

  renderForm(root, invitation, token);
}

function renderForm(root, invitation, token) {
  const ecoleName = invitation?.auto_ecoles?.nom || '';
  const roleLabel = invitation.role === 'enseignant' ? 'Enseignant' : 'Élève';

  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-card">
        <div class="sg-logo">P</div>
        <h1 class="sg-title">Active ton compte</h1>
        <p class="sg-sub">
          ${ecoleName ? `Tu rejoins <strong>${esc(ecoleName)}</strong>` : 'Bienvenue dans PermiGo'}
        </p>
        <div style="text-align:center"><span class="sg-role-badge">${esc(roleLabel)}</span></div>

        <div class="sg-row">
          <label class="sg-label" for="sg-email">Email</label>
          <input class="sg-input" id="sg-email" type="email" value="${esc(invitation.email)}" readonly />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-prenom">Prénom</label>
          <input class="sg-input" id="sg-prenom" type="text" autocomplete="given-name" placeholder="Ton prénom" />
        </div>

        <div class="sg-row">
          <label class="sg-label" for="sg-password">Mot de passe</label>
          <input class="sg-input" id="sg-password" type="password" autocomplete="new-password" minlength="8" placeholder="8 caractères minimum" />
          <div class="sg-help" id="sg-pwd-help">Minimum 8 caractères.</div>
        </div>

        <button class="sg-btn" id="sg-submit" disabled>Activer mon compte</button>
      </div>
    </div>
  `;

  const emailEl = root.querySelector('#sg-email');
  const prenomEl = root.querySelector('#sg-prenom');
  const pwdEl = root.querySelector('#sg-password');
  const pwdHelp = root.querySelector('#sg-pwd-help');
  const submitBtn = root.querySelector('#sg-submit');

  const validate = () => {
    const pwdOk = pwdEl.value.length >= 8;
    const prenomOk = prenomEl.value.trim().length >= 2;
    submitBtn.disabled = !(pwdOk && prenomOk);
    if (pwdEl.value && !pwdOk) {
      pwdEl.classList.add('error');
      pwdHelp.classList.add('error');
      pwdHelp.textContent = 'Trop court (minimum 8 caractères).';
    } else {
      pwdEl.classList.remove('error');
      pwdHelp.classList.remove('error');
      pwdHelp.textContent = 'Minimum 8 caractères.';
    }
  };
  prenomEl.addEventListener('input', validate);
  pwdEl.addEventListener('input', validate);

  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Activation…';

    try {
      // 1. Sign up — le trigger handle_new_user_signup crée le profil "nu"
      //    avec prenom + role depuis les metadata.
      const { error: authErr } = await sb.auth.signUp({
        email: invitation.email,
        password: pwdEl.value,
        options: { data: { prenom: prenomEl.value.trim(), role: invitation.role } },
      });
      if (authErr) throw authErr;

      // 2. accept_invitation rattache le profil (role, auto_ecole_id, enseignant_id)
      //    et vérifie que l'email du compte correspond à l'invitation.
      const { data: accepted, error: acceptErr } = await sb.rpc('accept_invitation', { p_token: token });
      if (acceptErr) throw acceptErr;
      if (accepted === false) throw new Error('Lien invalide ou email ne correspond pas');

      track('signup.completed', { role: invitation.role, from: 'invitation' });
      playLaunch();

      // 4. Affichage succès + redirection
      root.innerHTML = `${STYLE}
        <div class="sg">
          <div class="sg-card" style="text-align:center">
            <div style="font-size:48px;margin-bottom:12px">🎉</div>
            <h1 class="sg-title">Bienvenue dans PermiGo !</h1>
            <p class="sg-sub">Ton compte est activé. On te redirige…</p>
          </div>
        </div>`;

      setTimeout(() => { window.location.href = '/#'; window.location.reload(); }, 1500);

    } catch (e) {
      console.error('[signup] failed', e);
      const { toast } = await import('@/components/common/toast.js');
      const msg = /already.*registered|already.*exists/i.test(e?.message || '')
        ? 'Un compte existe déjà avec cet email. Connecte-toi directement.'
        : (e?.message || 'Erreur lors de l\'activation');
      toast(msg, 'error', 4500);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Activer mon compte';
    }
  });

  // Focus auto sur le prénom
  setTimeout(() => prenomEl.focus(), 100);
}

function renderError(root, title, message) {
  track('signup.error', { title });
  root.innerHTML = `${STYLE}
    <div class="sg">
      <div class="sg-error-card">
        <div class="sg-error-ico">⚠️</div>
        <h1 class="sg-error-title">${esc(title)}</h1>
        <p class="sg-error-msg">${esc(message)}</p>
        <a class="sg-link" href="/#">Retour à l'accueil</a>
      </div>
    </div>`;
}
