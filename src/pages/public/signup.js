/**
 * Page Inscription publique — création de compte élève libre service.
 *
 * Flow :
 *  1. Step 1 : email + password (validation forte)
 *  2. Step 2 : nom complet + téléphone (optionnel)
 *  3. Step 3 : confirmation, lien email envoyé
 *
 * Création via `supabase.auth.signUp()` avec metadata { nom, tel, role: 'eleve' }.
 * Un trigger SQL côté serveur auto-crée le profil dans `profiles` après signup.
 */

import { sb } from '@/auth/auth.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { checkRateLimit, recordAttempt, resetRateLimit, formatWaitTime } from '@/utils/rate-limit.js';
import { getTurnstileToken, isTurnstileEnabled } from '@/utils/turnstile.js';
import { renderHoneypot, checkHoneypot } from '@/utils/honeypot.js';

let _root;
let _step = 1;
let _data = { email: '', password: '', nom: '', tel: '', forfait: 20 };

export function mount(root) {
  _root = root;
  _step = 1;
  _data = { email: '', password: '', nom: '', tel: '', forfait: 20 };
  render();
}

function render() {
  _root.innerHTML = `
    <style>
      .su-bg{position:fixed;inset:0;z-index:0;background:#0b0d1a;overflow:hidden;pointer-events:none}
      .su-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 30% 20%,#6366f1 0%,transparent 40%),radial-gradient(ellipse at 70% 60%,#8b5cf6 0%,transparent 40%);filter:blur(60px);opacity:.45;animation:su-float 18s ease-in-out infinite alternate}
      @keyframes su-float{0%{transform:translate(0,0) scale(1)}100%{transform:translate(30px,-20px) scale(1.08)}}

      .su-wrap{position:relative;z-index:2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 14px;padding-top:calc(24px + env(safe-area-inset-top))}
      .su-card{background:rgba(255,255,255,.98);backdrop-filter:blur(20px);width:100%;max-width:440px;border-radius:22px;padding:28px 26px;box-shadow:0 30px 80px -16px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.5) inset;animation:su-pop .45s cubic-bezier(.5,1.6,.4,1)}
      @keyframes su-pop{from{transform:translateY(20px) scale(.92);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}

      .su-logo{display:flex;align-items:center;justify-content:center;margin-bottom:8px}
      .su-logo img{height:32px;width:auto;filter:drop-shadow(0 4px 12px rgba(99,102,241,.35))}
      .su-logo-fb{font-family:var(--fd);font-weight:900;font-size:24px;letter-spacing:-.03em;background:linear-gradient(90deg,#6366f1,#8b5cf6,#0ea5e9);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}

      .su-stepper{display:flex;gap:6px;justify-content:center;margin-bottom:20px}
      .su-stp{width:32px;height:3px;border-radius:99px;background:var(--bo2);transition:background .25s}
      .su-stp.done{background:var(--gr)}
      .su-stp.cur{background:linear-gradient(90deg,var(--a),var(--pu));animation:su-stp-pulse 1.8s ease-in-out infinite}
      @keyframes su-stp-pulse{0%,100%{opacity:.85}50%{opacity:1}}

      .su-title{font-family:var(--fd);font-weight:900;font-size:22px;letter-spacing:-.02em;text-align:center;margin:0 0 6px;color:var(--ink)}
      .su-sub{font-size:13px;color:var(--mu);text-align:center;margin:0 0 22px}

      .su-row{margin-bottom:14px}
      .su-row label{display:block;font-size:10.5px;font-weight:800;color:var(--mu);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
      .su-row input{width:100%;height:44px;padding:0 14px;border:1px solid var(--bo);border-radius:11px;font-family:inherit;font-size:14px;color:var(--ink);background:var(--su);box-sizing:border-box;transition:all .15s}
      .su-row input:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 4px var(--ap)}
      .su-row .hint{font-size:11px;color:var(--mu);margin-top:5px;line-height:1.4}

      .su-pw-strength{display:flex;gap:3px;margin-top:6px}
      .su-pw-bar{flex:1;height:3px;border-radius:99px;background:var(--bo2);transition:background .2s}
      .su-pw-bar.fill1{background:#ef4444}
      .su-pw-bar.fill2{background:#f59e0b}
      .su-pw-bar.fill3{background:#10b981}
      .su-pw-bar.fill4{background:#10b981}
      .su-pw-lbl{font-size:10.5px;font-weight:700;margin-top:5px;letter-spacing:.3px}
      .su-pw-lbl.weak{color:#ef4444}
      .su-pw-lbl.medium{color:#f59e0b}
      .su-pw-lbl.strong{color:#10b981}

      .su-cta{display:flex;gap:8px;margin-top:18px}
      .su-cta button{flex:1;height:48px;border-radius:12px;font-family:var(--fd);font-size:14px;font-weight:800;cursor:pointer;border:0;letter-spacing:.3px;transition:transform .12s,box-shadow .2s}
      .su-cta button:hover{transform:translateY(-2px)}
      .su-cta button:active{transform:translateY(0)}
      .su-cta .back{flex:0 0 80px;background:var(--bg2);color:var(--ink);border:1px solid var(--bo)}
      .su-cta .next{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 10px 24px -6px rgba(99,102,241,.5)}
      .su-cta .next:disabled{opacity:.5;cursor:not-allowed;transform:none}

      .su-foot{text-align:center;font-size:12.5px;color:var(--mu);margin-top:20px}
      .su-foot a{color:var(--a);font-weight:700;text-decoration:none}
      .su-foot a:hover{text-decoration:underline}

      .su-success{text-align:center;padding:14px 0}
      .su-success-em{font-size:54px;line-height:1;margin-bottom:14px;animation:su-bounce 1.4s ease-in-out infinite}
      @keyframes su-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      .su-success h2{font-family:var(--fd);font-size:22px;font-weight:900;letter-spacing:-.02em;margin:0 0 8px;color:var(--ink)}
      .su-success p{color:var(--mu);font-size:13.5px;line-height:1.5;margin:0 0 18px}
      .su-success b{color:var(--ink)}
    </style>

    <div class="su-bg"></div>
    <div class="su-wrap">
      <div class="su-card">
        <div class="su-logo">
          <img src="permigo-logo.png" alt="PermiGo" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'">
          <span class="su-logo-fb" style="display:none">PermiGo</span>
        </div>

        ${_step < 4 ? `
          <div class="su-stepper" aria-label="Étape ${_step} sur 3">
            <span class="su-stp ${_step > 1 ? 'done' : _step === 1 ? 'cur' : ''}"></span>
            <span class="su-stp ${_step > 2 ? 'done' : _step === 2 ? 'cur' : ''}"></span>
            <span class="su-stp ${_step === 3 ? 'cur' : ''}"></span>
          </div>
        ` : ''}

        ${renderHoneypot()}
        ${renderStep()}

        ${_step < 3 ? `
          <div class="su-foot">
            Déjà un compte ? <a href="#/login">Se connecter</a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  wire();
}

function renderStep() {
  if (_step === 1) {
    return `
      <h1 class="su-title">Crée ton compte</h1>
      <p class="su-sub">Démarre ton parcours en 30 secondes</p>
      <div class="su-row">
        <label for="su-email">Email</label>
        <input id="su-email" type="email" autocomplete="email" placeholder="toi@email.com" value="${esc(_data.email)}" autofocus>
      </div>
      <div class="su-row">
        <label for="su-pwd">Mot de passe</label>
        <input id="su-pwd" type="password" autocomplete="new-password" placeholder="8 caractères minimum" value="${esc(_data.password)}">
        <div class="su-pw-strength" id="su-pw-bars">
          <span class="su-pw-bar"></span><span class="su-pw-bar"></span><span class="su-pw-bar"></span><span class="su-pw-bar"></span>
        </div>
        <div class="su-pw-lbl" id="su-pw-lbl"></div>
      </div>
      <div class="su-cta">
        <button class="next" id="su-next" type="button" disabled>Continuer →</button>
      </div>
    `;
  }
  if (_step === 2) {
    return `
      <h1 class="su-title">Faisons connaissance</h1>
      <p class="su-sub">Comment t'appelles-tu ?</p>
      <div class="su-row">
        <label for="su-nom">Nom complet</label>
        <input id="su-nom" type="text" autocomplete="name" placeholder="Prénom Nom" value="${esc(_data.nom)}" maxlength="80" autofocus>
      </div>
      <div class="su-row">
        <label for="su-tel">Téléphone (optionnel)</label>
        <input id="su-tel" type="tel" autocomplete="tel" placeholder="06 12 34 56 78" value="${esc(_data.tel)}" maxlength="20">
        <div class="hint">Utile pour que ton moniteur te joigne. Ne sera jamais partagé.</div>
      </div>
      <div class="su-row">
        <label>Ton forfait de conduite</label>
        <style>
          .su-forfaits{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}
          .su-frf{padding:14px 10px;border-radius:11px;border:2px solid var(--bo);background:var(--su);cursor:pointer;text-align:center;font-family:inherit;transition:all .15s}
          .su-frf:hover{border-color:var(--a)}
          .su-frf.sel{border-color:var(--a);background:var(--ap)}
          .su-frf .v{font-family:var(--fd);font-size:22px;font-weight:900;color:var(--ink);line-height:1;letter-spacing:-.02em}
          .su-frf .v small{font-size:12px;color:var(--mu);font-weight:700;margin-left:1px}
          .su-frf .l{font-size:10.5px;color:var(--mu);font-weight:700;margin-top:4px;letter-spacing:.2px}
          .su-frf.sel .v{color:var(--a)}
        </style>
        <div class="su-forfaits" role="radiogroup" aria-label="Choisis ton forfait">
          ${[10, 13, 20, 30].map(h => `
            <button class="su-frf ${_data.forfait === h ? 'sel' : ''}" data-forfait="${h}" type="button" role="radio" aria-checked="${_data.forfait === h}">
              <div class="v">${h}<small>h</small></div>
              <div class="l">${h === 10 ? 'Découverte' : h === 13 ? 'Standard' : h === 20 ? 'Recommandé' : 'Confort'}</div>
            </button>
          `).join('')}
        </div>
        <div class="hint">Tu pourras le modifier plus tard avec ton moniteur.</div>
      </div>
      <div class="su-cta">
        <button class="back" id="su-back" type="button">‹ Retour</button>
        <button class="next" id="su-next" type="button" disabled>Créer mon compte 🚀</button>
      </div>
    `;
  }
  if (_step === 3) {
    return `
      <div class="su-success">
        <div class="su-success-em">📬</div>
        <h2>Vérifie tes emails</h2>
        <p>Un lien de confirmation a été envoyé à <b>${esc(_data.email)}</b>.<br>Clique dessus pour activer ton compte, puis connecte-toi.</p>
        <div class="su-cta">
          <a href="#/login" class="next" style="text-decoration:none;display:flex;align-items:center;justify-content:center">Aller à la connexion →</a>
        </div>
        <div class="su-foot" style="margin-top:14px">Pas reçu ? Vérifie ton dossier spam.</div>
      </div>
    `;
  }
  return '';
}

function wire() {
  if (_step === 1) {
    const emailEl = _root.querySelector('#su-email');
    const pwdEl = _root.querySelector('#su-pwd');
    const nextBtn = _root.querySelector('#su-next');
    const bars = _root.querySelectorAll('.su-pw-bar');
    const lbl = _root.querySelector('#su-pw-lbl');

    const updateStrength = () => {
      const v = pwdEl.value;
      const score = passwordScore(v);
      bars.forEach((b, i) => {
        b.className = 'su-pw-bar' + (i < score ? ` fill${score}` : '');
      });
      lbl.className = 'su-pw-lbl ' + (score >= 3 ? 'strong' : score === 2 ? 'medium' : score === 1 ? 'weak' : '');
      lbl.textContent = score >= 3 ? 'Mot de passe solide ✓' : score === 2 ? 'Mot de passe correct' : score === 1 ? 'Mot de passe trop faible' : '';
    };

    const updateNext = () => {
      const emailOK = /^\S+@\S+\.\S+$/.test(emailEl.value.trim());
      const pwdOK = pwdEl.value.length >= 8;
      nextBtn.disabled = !(emailOK && pwdOK);
    };

    emailEl.addEventListener('input', updateNext);
    pwdEl.addEventListener('input', () => { updateStrength(); updateNext(); });
    updateStrength(); updateNext();

    emailEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') pwdEl.focus(); });
    pwdEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !nextBtn.disabled) nextBtn.click(); });

    nextBtn.addEventListener('click', () => {
      _data.email = emailEl.value.trim().toLowerCase();
      _data.password = pwdEl.value;
      _step = 2;
      render();
    });
  } else if (_step === 2) {
    const nomEl = _root.querySelector('#su-nom');
    const telEl = _root.querySelector('#su-tel');
    const nextBtn = _root.querySelector('#su-next');

    const updateNext = () => {
      nextBtn.disabled = nomEl.value.trim().length < 2;
    };
    nomEl.addEventListener('input', updateNext);
    updateNext();

    _root.querySelector('#su-back')?.addEventListener('click', () => { _step = 1; render(); });

    // Wire les boutons forfait
    _root.querySelectorAll('[data-forfait]').forEach(b => {
      b.addEventListener('click', () => {
        _root.querySelectorAll('[data-forfait]').forEach(o => {
          o.classList.remove('sel');
          o.setAttribute('aria-checked', 'false');
        });
        b.classList.add('sel');
        b.setAttribute('aria-checked', 'true');
        _data.forfait = parseInt(b.dataset.forfait, 10);
      });
    });

    nextBtn.addEventListener('click', async () => {
      _data.nom = nomEl.value.trim();
      _data.tel = telEl.value.trim();

      // 1) Honeypot
      const formRoot = nextBtn.closest('form') || _root;
      if (!checkHoneypot(formRoot)) {
        console.warn('[signup] honeypot triggered');
        return;
      }

      // 2) Rate limit (3 tentatives par 10 min — création de compte = action coûteuse)
      const rl = checkRateLimit('signup', _data.email, 3, 10 * 60_000);
      if (!rl.allowed) {
        toast(`Trop d'essais — réessaye dans ${formatWaitTime(rl.wait)}`, 'error');
        return;
      }
      recordAttempt('signup', _data.email);

      nextBtn.disabled = true;
      nextBtn.textContent = 'Création…';

      try {
        // 3) Captcha Turnstile (si activé)
        const captchaToken = isTurnstileEnabled() ? await getTurnstileToken('signup') : null;
        if (isTurnstileEnabled() && !captchaToken) {
          toast('Vérification anti-bot échouée — réessaye', 'error');
          nextBtn.disabled = false;
          nextBtn.textContent = 'Créer mon compte 🚀';
          return;
        }

        const options = {
          data: { nom: _data.nom, tel: _data.tel || null, role: 'eleve', forfait_h: _data.forfait },
        };
        if (captchaToken) options.captchaToken = captchaToken;

        const { data, error } = await sb.auth.signUp({
          email: _data.email,
          password: _data.password,
          options,
        });
        if (error) {
          toast(error.message || 'Erreur création', 'error');
          nextBtn.disabled = false;
          nextBtn.textContent = 'Créer mon compte 🚀';
          return;
        }
        resetRateLimit('signup', _data.email);
        _step = 3;
        render();
      } catch (err) {
        console.warn('[signup] err', err);
        toast('Erreur réseau', 'error');
        nextBtn.disabled = false;
        nextBtn.textContent = 'Créer mon compte 🚀';
      }
    });
  }
}

/** 0=empty, 1=weak, 2=medium, 3=strong, 4=very strong */
function passwordScore(pwd) {
  if (!pwd || pwd.length === 0) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score++;
  return Math.min(4, score);
}
