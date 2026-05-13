/**
 * Page Login — design premium avec Gooey Text Morphing.
 *
 * - Background : gradient animé + blobs flous
 * - Hero : "PermiGo" morphing vers d'autres mots via SVG threshold filter
 * - Tagline + form glassmorphism
 * - 3 boutons démo pour pré-remplir Élève / Moniteur / Gérant
 * - Footer : lien "Inscrire mon auto-école"
 */

import { login } from '@/auth/auth.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';

const DEMO_ACCOUNTS = [
  { role: 'Élève',    email: 'latifa.sahli@autopilot.fr',  emoji: '🎓', tint: '#10b981' },
  { role: 'Moniteur', email: 'rayan.nabli@autopilot.fr',   emoji: '🚗', tint: '#6366f1' },
  { role: 'Gérant',   email: 'rayannabli27@gmail.com',      emoji: '👑', tint: '#f59e0b' },
];

const MORPH_WORDS = ['PermiGo', 'Conduis', 'Apprends', 'Progresse', 'Réussis'];

let _gooeyRaf = null;

export function mount(root) {
  root.innerHTML = template();
  wire(root);
  startGooeyMorph(root);
}

export function unmount() {
  if (_gooeyRaf) cancelAnimationFrame(_gooeyRaf);
  _gooeyRaf = null;
}

// ─── Template ───
function template() {
  return `
    <style>
      .lg-root{position:fixed;inset:0;overflow:hidden;background:#0b0d1a;display:flex;align-items:center;justify-content:center;padding:18px;font-family:var(--fb)}

      /* Animated gradient background */
      .lg-bg{position:absolute;inset:0;z-index:0}
      .lg-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,#6366f1 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,#8b5cf6 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,#0891b2 0%,transparent 40%);filter:blur(60px);opacity:.55;animation:lg-float 18s ease-in-out infinite alternate}
      @keyframes lg-float{0%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(40px,-30px) rotate(180deg) scale(1.1)}100%{transform:translate(-30px,40px) rotate(360deg) scale(0.95)}}
      .lg-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,transparent 0%,rgba(11,13,26,.6) 100%)}

      /* Subtle grid overlay */
      .lg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;z-index:1;pointer-events:none;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}

      /* Hero */
      .lg-content{position:relative;z-index:2;width:100%;max-width:520px;display:flex;flex-direction:column;align-items:center}

      .lg-hero{height:140px;width:100%;display:flex;align-items:center;justify-content:center;margin-bottom:6px;position:relative}
      /* Logo PermiGo (remplace le hero gooey) */
      .lg-logo-host{width:100%;display:flex;align-items:center;justify-content:center;margin:8px 0 14px;opacity:0;animation:lg-logoIn 1s cubic-bezier(.2,.7,.3,1) .1s both}
      .lg-logo-host img{height:clamp(64px,12vw,110px);width:auto;max-width:88%;object-fit:contain;filter:drop-shadow(0 12px 32px rgba(139,92,246,.45)) drop-shadow(0 0 24px rgba(99,102,241,.3))}
      .lg-logo-fb{font-family:'Archivo',ui-sans-serif,sans-serif;font-weight:900;letter-spacing:-.03em;font-size:clamp(36px,7vw,64px);line-height:1;background:linear-gradient(90deg,#a5b4fc 0%,#fff 35%,#fff 65%,#c4b5fd 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 8px 24px rgba(139,92,246,.4))}
      @keyframes lg-logoIn{
        0%{opacity:0;transform:scale(.88) translateY(8px);filter:blur(6px)}
        100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}
      }
      @media (prefers-reduced-motion:reduce){.lg-logo-host{animation:none;opacity:1}}
      .gx-wrap{position:relative;width:100%;display:flex;align-items:center;justify-content:center}
      .gx-stage{filter:url(#gx-threshold);display:flex;align-items:center;justify-content:center;height:120px;width:100%;position:relative}
      .gx-word{position:absolute;font-family:var(--fd);font-weight:900;font-size:64px;letter-spacing:-.03em;color:#fff;line-height:1;text-align:center;will-change:filter,opacity}
      @media (max-width:520px){.gx-word{font-size:48px}}

      .lg-tagline{color:#cbd5e1;font-size:14px;letter-spacing:.02em;text-align:center;margin:0 0 28px;max-width:380px;line-height:1.5;opacity:.85}
      .lg-tagline b{color:#fff;font-weight:700}

      /* Card glassmorphism */
      .lg-card{width:100%;max-width:420px;background:rgba(255,255,255,.06);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:26px 24px;box-shadow:0 20px 60px -20px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04) inset;animation:lg-card-in .6s cubic-bezier(.2,.7,.3,1) .15s both}
      @keyframes lg-card-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

      .lg-card h2{font-family:var(--fd);font-size:18px;font-weight:800;color:#fff;margin:0 0 4px;letter-spacing:-.01em;text-align:center}
      .lg-card .h-sub{font-size:12.5px;color:rgba(255,255,255,.6);text-align:center;margin:0 0 22px}

      .lg-field{margin-bottom:14px}
      .lg-field label{display:block;font-size:10.5px;font-weight:700;color:rgba(255,255,255,.75);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase}
      .lg-field input{width:100%;height:46px;padding:0 14px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:14px;font-family:inherit;transition:all .15s;box-sizing:border-box}
      .lg-field input::placeholder{color:rgba(255,255,255,.35)}
      .lg-field input:focus{outline:0;border-color:#a5b4fc;background:rgba(255,255,255,.08);box-shadow:0 0 0 3px rgba(99,102,241,.18)}
      .lg-pw-wrap{position:relative}
      .lg-pw-toggle{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:36px;height:36px;background:transparent;border:0;color:rgba(255,255,255,.55);cursor:pointer;font-size:14px;border-radius:8px}
      .lg-pw-toggle:hover{background:rgba(255,255,255,.06);color:#fff}

      .lg-cta{width:100%;height:48px;border-radius:12px;border:0;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-family:var(--fd);font-weight:700;font-size:14.5px;letter-spacing:.01em;cursor:pointer;margin-top:6px;transition:transform .12s,box-shadow .12s;box-shadow:0 10px 30px -10px rgba(99,102,241,.6)}
      .lg-cta:hover{transform:translateY(-1px);box-shadow:0 14px 36px -10px rgba(99,102,241,.75)}
      .lg-cta:disabled{opacity:.6;cursor:wait;transform:none}

      .lg-err{color:#fda4af;font-size:12px;margin:10px 0 0;min-height:18px;text-align:center}

      /* Démo accounts */
      .lg-divider{display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.4);font-size:10.5px;font-weight:700;letter-spacing:1.5px;margin:20px 0 12px;text-transform:uppercase}
      .lg-divider::before,.lg-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.1)}

      .lg-demos{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
      .lg-demo{padding:10px 6px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);cursor:pointer;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:inherit;color:#fff}
      .lg-demo:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);transform:translateY(-1px)}
      .lg-demo .em{font-size:18px;line-height:1}
      .lg-demo .nm{font-size:10.5px;font-weight:700;letter-spacing:.04em}

      /* Footer */
      .lg-foot{margin-top:24px;font-size:12px;color:rgba(255,255,255,.5);text-align:center}
      .lg-foot a{color:rgba(255,255,255,.85);font-weight:600;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.2);transition:border-color .12s}
      .lg-foot a:hover{border-color:rgba(255,255,255,.6)}

      .lg-version{position:absolute;bottom:14px;right:14px;font-family:var(--fn);font-size:10.5px;color:rgba(255,255,255,.3);letter-spacing:1.5px;z-index:3}
    </style>

    <div class="lg-root">
      <div class="lg-bg"></div>
      <div class="lg-grid"></div>

      <!-- Gooey SVG filter (caché) -->
      <svg style="position:absolute;width:0;height:0" aria-hidden="true">
        <defs>
          <filter id="gx-threshold">
            <feColorMatrix in="SourceGraphic" type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 255 -140
            "/>
          </filter>
        </defs>
      </svg>

      <div class="lg-content">
        <div class="lg-logo-host" aria-hidden="false">
          <img src="permigo-logo.png" alt="PermiGo"
               onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'">
          <span class="lg-logo-fb" style="display:none">PermiGo</span>
        </div>

        <p class="lg-tagline">L'app <b>tout-en-un</b> qui rend l'apprentissage de la conduite simple, ludique et efficace.</p>

        <div class="lg-card">
          <h2>Connexion</h2>
          <p class="h-sub">Élève, moniteur ou gérant — accède à ton espace.</p>

          <form id="login-form" novalidate>
            <div class="lg-field">
              <label for="lg-email">Email</label>
              <input id="lg-email" type="email" name="email" required autocomplete="email" placeholder="vous@exemple.fr">
            </div>
            <div class="lg-field">
              <label for="lg-pwd">Mot de passe</label>
              <div class="lg-pw-wrap">
                <input id="lg-pwd" type="password" name="password" required autocomplete="current-password" placeholder="••••••••">
                <button type="button" class="lg-pw-toggle" id="lg-pw-toggle" aria-label="Afficher le mot de passe">👁️</button>
              </div>
            </div>
            <button type="submit" class="lg-cta">Se connecter</button>
            <p class="lg-err" id="lg-err"></p>
          </form>

          <div style="text-align:center;font-size:13px;color:rgba(255,255,255,.7);margin-top:14px">
            Pas encore de compte ?
            <a href="#/signup" style="color:#a5b4fc;font-weight:700;text-decoration:none;margin-left:4px">Créer un compte gratuit →</a>
          </div>

          <div class="lg-divider">— Comptes démo —</div>
          <div class="lg-demos">
            ${DEMO_ACCOUNTS.map(a => `
              <button class="lg-demo" type="button" data-email="${esc(a.email)}" style="--tint:${a.tint}">
                <span class="em">${a.emoji}</span>
                <span class="nm">${esc(a.role)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="lg-foot">
          Pas encore de compte ? <a href="#" id="lg-signup">Inscrire mon auto-école →</a>
        </div>
      </div>

      <div class="lg-version">PermiGo · v7</div>
    </div>
  `;
}

// ─── Gooey Text Morphing ───
function startGooeyMorph(root) {
  const w1 = root.querySelector('#gx-w1');
  const w2 = root.querySelector('#gx-w2');
  if (!w1 || !w2) return;

  const texts = MORPH_WORDS;
  const morphTime = 1;       // durée du fondu (s)
  const cooldownTime = 0.9;  // temps stable entre morphs (s)

  let textIndex = texts.length - 1;
  w1.textContent = texts[textIndex % texts.length];
  w2.textContent = texts[(textIndex + 1) % texts.length];

  let time = performance.now();
  let morph = 0;
  let cooldown = cooldownTime;

  function setMorph(fraction) {
    w2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
    w2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
    const f1 = 1 - fraction;
    w1.style.filter = `blur(${Math.min(8 / f1 - 8, 100)}px)`;
    w1.style.opacity = `${Math.pow(f1, 0.4) * 100}%`;
  }

  function doCooldown() {
    morph = 0;
    w2.style.filter = '';
    w2.style.opacity = '100%';
    w1.style.filter = '';
    w1.style.opacity = '0%';
  }

  function doMorph() {
    morph -= cooldown;
    cooldown = 0;
    let fraction = morph / morphTime;
    if (fraction > 1) {
      cooldown = cooldownTime;
      fraction = 1;
    }
    setMorph(fraction);
  }

  function animate(now) {
    _gooeyRaf = requestAnimationFrame(animate);
    const shouldIncrementIndex = cooldown > 0;
    const dt = (now - time) / 1000;
    time = now;
    cooldown -= dt;
    if (cooldown <= 0) {
      if (shouldIncrementIndex) {
        textIndex = (textIndex + 1) % texts.length;
        w1.textContent = texts[textIndex % texts.length];
        w2.textContent = texts[(textIndex + 1) % texts.length];
      }
      morph += dt;
      doMorph();
    } else {
      doCooldown();
    }
  }
  _gooeyRaf = requestAnimationFrame(animate);
}

// ─── Wire form + demos ───
function wire(root) {
  const form = root.querySelector('#login-form');
  const errEl = root.querySelector('#lg-err');
  const submitBtn = form.querySelector('button[type=submit]');
  const emailIn = root.querySelector('#lg-email');
  const pwdIn = root.querySelector('#lg-pwd');
  const pwToggle = root.querySelector('#lg-pw-toggle');

  // Toggle password visibility
  pwToggle.addEventListener('click', () => {
    pwdIn.type = pwdIn.type === 'password' ? 'text' : 'password';
    pwToggle.textContent = pwdIn.type === 'password' ? '👁️' : '🙈';
  });

  // Demo buttons → pré-remplit email + password
  root.querySelectorAll('.lg-demo').forEach(b => {
    b.addEventListener('click', () => {
      emailIn.value = b.dataset.email;
      pwdIn.value = 'Autopilot2025!';
      pwdIn.focus();
    });
  });

  // Signup link (placeholder)
  root.querySelector('#lg-signup')?.addEventListener('click', (e) => {
    e.preventDefault();
    toast('Page d\'inscription — à venir 🚧');
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion…';

    const email = emailIn.value.trim();
    const pwd = pwdIn.value;

    if (!email || !pwd) {
      errEl.textContent = 'Email + mot de passe requis';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter';
      form.classList.add('anim-shake');
      setTimeout(() => form.classList.remove('anim-shake'), 400);
      return;
    }

    const { ok, profile, error } = await login(email, pwd);
    if (!ok) {
      errEl.textContent = esc(error || 'Identifiants invalides');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter';
      form.classList.add('anim-shake');
      setTimeout(() => form.classList.remove('anim-shake'), 400);
      return;
    }

    toast(`Bonjour ${profile.nom.split(' ')[0]} 👋`, 'success');
    setTimeout(async () => {
      const [{ navigate }, { mountBottomNav }] = await Promise.all([
        import('@/router.js'),
        import('@/components/nav-bottom.js'),
      ]);
      mountBottomNav();
      navigate('/');
    }, 600);
  });
}
