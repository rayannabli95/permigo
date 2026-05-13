/**
 * Page Inscription auto-école — capture lead B2B.
 *
 * Flow :
 *   1. Form (école, ville, nb moniteurs, email, tel, message)
 *   2. Insert dans table `leads` (RLS anon insert OK)
 *   3. Confirmation "On te recontacte sous 24h"
 *
 * Branchée depuis tous les CTAs "Inscrire mon auto-école" de la landing.
 */

import { sb } from '@/auth/auth.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';

let _root;
let _state = 'form'; // 'form' | 'success'
let _data = { ecole_nom: '', ville: '', nb_moniteurs: 5, email: '', telephone: '', message: '' };

export function mount(root) {
  _root = root;
  _state = 'form';
  _data = { ecole_nom: '', ville: '', nb_moniteurs: 5, email: '', telephone: '', message: '' };
  render();
}

function render() {
  _root.innerHTML = `
    <style>
      .ie-bg{position:fixed;inset:0;z-index:0;background:#0b0d1a;overflow:hidden;pointer-events:none}
      .ie-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 25% 25%,#6366f1 0%,transparent 45%),radial-gradient(ellipse at 75% 70%,#8b5cf6 0%,transparent 45%);filter:blur(70px);opacity:.5;animation:ie-float 22s ease-in-out infinite alternate}
      @keyframes ie-float{0%{transform:translate(0,0) scale(1)}100%{transform:translate(40px,-30px) scale(1.1)}}

      .ie-wrap{position:relative;z-index:2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 14px;padding-top:calc(24px + env(safe-area-inset-top))}
      .ie-card{background:rgba(255,255,255,.98);backdrop-filter:blur(20px);width:100%;max-width:480px;border-radius:24px;padding:30px 26px;box-shadow:0 30px 80px -16px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.5) inset;animation:ie-pop .5s cubic-bezier(.5,1.6,.4,1)}
      @keyframes ie-pop{from{transform:translateY(20px) scale(.92);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}

      .ie-back{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--mu);font-weight:700;text-decoration:none;margin-bottom:14px;transition:color .15s}
      .ie-back:hover{color:var(--ink)}

      .ie-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;background:linear-gradient(90deg,#6366f120,#8b5cf620);border:1px solid #8b5cf640;font-size:11px;font-weight:800;color:#6366f1;letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px}

      .ie-title{font-family:var(--fd);font-weight:900;font-size:26px;letter-spacing:-.02em;margin:0 0 8px;color:var(--ink);line-height:1.15}
      .ie-sub{font-size:14px;color:var(--mu);margin:0 0 22px;line-height:1.5}

      .ie-row{margin-bottom:14px}
      .ie-row.two{display:grid;grid-template-columns:1fr 110px;gap:10px}
      .ie-row label{display:block;font-size:10.5px;font-weight:800;color:var(--mu);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
      .ie-row input,.ie-row textarea{width:100%;padding:0 14px;border:1px solid var(--bo);border-radius:11px;font-family:inherit;font-size:14px;color:var(--ink);background:var(--su);box-sizing:border-box;transition:all .15s}
      .ie-row input{height:44px}
      .ie-row textarea{padding:12px 14px;min-height:80px;resize:vertical;line-height:1.5}
      .ie-row input:focus,.ie-row textarea:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 4px var(--ap)}

      .ie-cta{height:50px;width:100%;border-radius:13px;font-family:var(--fd);font-size:14.5px;font-weight:800;cursor:pointer;border:0;letter-spacing:.3px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 12px 28px -6px rgba(99,102,241,.55);transition:transform .12s,box-shadow .2s;margin-top:6px}
      .ie-cta:hover{transform:translateY(-2px);box-shadow:0 16px 36px -6px rgba(99,102,241,.7)}
      .ie-cta:active{transform:translateY(0)}
      .ie-cta:disabled{opacity:.5;cursor:not-allowed;transform:none}

      .ie-foot{text-align:center;font-size:12px;color:var(--mu);margin-top:16px;line-height:1.6}
      .ie-foot a{color:var(--a);font-weight:700;text-decoration:none}

      .ie-trust{display:flex;gap:18px;justify-content:center;margin-top:18px;flex-wrap:wrap}
      .ie-trust span{font-size:11.5px;color:var(--mu);font-weight:600;display:inline-flex;align-items:center;gap:5px}
      .ie-trust b{color:var(--ink);font-weight:800}

      .ie-success{text-align:center;padding:10px 0}
      .ie-success-em{font-size:64px;line-height:1;margin-bottom:16px;animation:ie-bounce 1.4s ease-in-out infinite}
      @keyframes ie-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      .ie-success h2{font-family:var(--fd);font-size:24px;font-weight:900;letter-spacing:-.02em;margin:0 0 10px;color:var(--ink)}
      .ie-success p{color:var(--mu);font-size:14px;line-height:1.55;margin:0 0 22px}
      .ie-success b{color:var(--ink)}
    </style>

    <div class="ie-bg"></div>
    <div class="ie-wrap anim-slide-up">
      <div class="ie-card">
        ${_state === 'form' ? renderForm() : renderSuccess()}
      </div>
    </div>
  `;
  wire();
}

function renderForm() {
  return `
    <a href="#/landing" class="ie-back" id="ie-back">‹ Retour à l'accueil</a>
    <div class="ie-badge">🚀 Essai gratuit 14 jours</div>
    <h1 class="ie-title">Inscris ton auto-école</h1>
    <p class="ie-sub">Remplis ce formulaire — on te rappelle sous <b style="color:var(--ink)">24h</b> pour configurer ton compte gérant.</p>

    <div class="ie-row">
      <label for="ie-ecole">Nom de l'auto-école *</label>
      <input id="ie-ecole" type="text" placeholder="Ex: Auto-École du Centre" value="${esc(_data.ecole_nom)}" autofocus required>
    </div>

    <div class="ie-row two">
      <div>
        <label for="ie-ville">Ville *</label>
        <input id="ie-ville" type="text" placeholder="Paris" value="${esc(_data.ville)}" required>
      </div>
      <div>
        <label for="ie-nb">Nb enseignants</label>
        <input id="ie-nb" type="number" min="1" max="99" placeholder="5" value="${_data.nb_moniteurs}">
      </div>
    </div>

    <div class="ie-row">
      <label for="ie-email">Email pro *</label>
      <input id="ie-email" type="email" placeholder="contact@ecole.fr" value="${esc(_data.email)}" required>
    </div>

    <div class="ie-row">
      <label for="ie-tel">Téléphone</label>
      <input id="ie-tel" type="tel" placeholder="06 12 34 56 78" value="${esc(_data.telephone)}">
    </div>

    <div class="ie-row">
      <label for="ie-msg">Un mot (optionnel)</label>
      <textarea id="ie-msg" placeholder="Ex: On cherche à remplacer notre planning papier...">${esc(_data.message)}</textarea>
    </div>

    <button class="ie-cta" id="ie-submit" type="button" disabled>Demander mon essai gratuit →</button>

    <div class="ie-trust">
      <span>✅ <b>Sans engagement</b></span>
      <span>💳 <b>Sans CB</b></span>
      <span>⚡ <b>Setup en 5 min</b></span>
    </div>

    <div class="ie-foot">
      Tu es un élève ? <a href="#/signup">Crée ton compte ici</a><br>
      Déjà client ? <a href="#/login">Se connecter</a>
    </div>
  `;
}

function renderSuccess() {
  return `
    <div class="ie-success">
      <div class="ie-success-em">🎉</div>
      <h2>C'est noté !</h2>
      <p>Merci <b>${esc(_data.ecole_nom)}</b>. On t'envoie un email de confirmation à <b>${esc(_data.email)}</b> et on te rappelle sous <b>24h</b> pour activer ton compte gérant.</p>
      <button class="ie-cta" id="ie-home" type="button">Retour à l'accueil</button>
      <div class="ie-foot" style="margin-top:18px">
        Pendant ce temps, tu peux <a href="#/login">explorer la démo</a> avec un compte test.
      </div>
    </div>
  `;
}

function wire() {
  if (_state === 'form') {
    const $ = (sel) => _root.querySelector(sel);
    const ecoleEl = $('#ie-ecole');
    const villeEl = $('#ie-ville');
    const nbEl = $('#ie-nb');
    const emailEl = $('#ie-email');
    const telEl = $('#ie-tel');
    const msgEl = $('#ie-msg');
    const submitBtn = $('#ie-submit');

    const update = () => {
      _data.ecole_nom = ecoleEl.value.trim();
      _data.ville = villeEl.value.trim();
      _data.nb_moniteurs = parseInt(nbEl.value, 10) || null;
      _data.email = emailEl.value.trim().toLowerCase();
      _data.telephone = telEl.value.trim();
      _data.message = msgEl.value.trim();

      const ok = _data.ecole_nom.length >= 2
        && _data.ville.length >= 2
        && /^\S+@\S+\.\S+$/.test(_data.email);
      submitBtn.disabled = !ok;
    };

    [ecoleEl, villeEl, nbEl, emailEl, telEl, msgEl].forEach(el => {
      el.addEventListener('input', update);
    });
    update();

    submitBtn.addEventListener('click', async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi…';

      try {
        const { error } = await sb.from('leads').insert({
          ecole_nom: _data.ecole_nom,
          ville: _data.ville,
          nb_moniteurs: _data.nb_moniteurs,
          email: _data.email,
          telephone: _data.telephone || null,
          message: _data.message || null,
          source: 'landing',
        });

        if (error) {
          console.warn('[inscription-ecole] insert error', error);
          toast(error.message || 'Erreur, réessaye dans un instant', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Demander mon essai gratuit →';
          return;
        }

        _state = 'success';
        render();
      } catch (err) {
        console.warn('[inscription-ecole] err', err);
        toast('Erreur réseau', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Demander mon essai gratuit →';
      }
    });

    _root.querySelector('#ie-back')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const { navigate } = await import('@/router.js');
      navigate('/landing');
    });
  } else {
    _root.querySelector('#ie-home')?.addEventListener('click', async () => {
      const { navigate } = await import('@/router.js');
      navigate('/landing');
    });
  }
}
