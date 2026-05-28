// ═══════════════════════════════════════════════════════════════
// Onboarding modal — 3 slides, affiché au 1er login élève (light theme)
// Condition : profiles.first_value_action_at IS NULL
// Appeler : showOnboarding(userId, onDone)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';

const SLIDES = [
  {
    illo: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ob1g" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stop-color="var(--a)"/>
          <stop offset="1" stop-color="var(--pu)"/>
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#ob1g)" opacity="0.1"/>
      <text x="40" y="54" text-anchor="middle" font-size="36">🛣️</text>
    </svg>`,
    title: 'Bienvenue dans PermiGo',
    body: 'L\'app qui transforme l\'apprentissage du permis en habitude quotidienne.',
    accent: 'var(--a)',
  },
  {
    illo: `<div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:4px 0">
      ${['Leçon', 'Quiz', 'Maîtrise'].map((l, i) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
          <div style="width:52px;height:52px;border-radius:14px;background:${['rgba(88,204,2,.12)','rgba(16,185,129,.12)','rgba(245,158,11,.12)'][i]};display:flex;align-items:center;justify-content:center;font-size:22px">${['📖','⚡','🏆'][i]}</div>
          <span style="font:700 10px/1 'Inter',sans-serif;color:var(--mu3);letter-spacing:.04em;text-transform:uppercase">${l}</span>
        </div>
        ${i < 2 ? `<div style="font:700 18px/1 'Plus Jakarta Sans',sans-serif;color:#d1d8ee">→</div>` : ''}
      `).join('')}
    </div>`,
    title: 'Ton enseignant valide,\ntoi tu joues.',
    body: 'Après chaque leçon, ton enseignant valide tes compétences. Tu reçois un quiz express pour ancrer ce que tu viens d\'apprendre.',
    accent: 'var(--gr)',
  },
  {
    illo: `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <svg width="60" height="72" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation:obFlame .7s ease-in-out infinite alternate;transform-origin:bottom center">
        <defs>
          <linearGradient id="ob3fl" x1="22" y1="56" x2="22" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="var(--rdk)"/>
            <stop offset="38%" stop-color="var(--or)"/>
            <stop offset="75%" stop-color="var(--aml2)"/>
            <stop offset="100%" stop-color="var(--aml)"/>
          </linearGradient>
        </defs>
        <path d="M22 2C22 2 32 15 29 24C34 20 37 25 37 31C37 41 30 49 22 52C14 49 7 41 7 31C7 25 10 20 15 24C12 15 22 2 22 2Z" fill="url(#ob3fl)"/>
        <path d="M22 18C22 18 27 26 25 33C24 36 22 37.5 22 37.5C22 37.5 20 36 19 33C17 26 22 18 22 18Z" fill="white" opacity="0.28"/>
      </svg>
      <div style="font:800 36px/1 'Plus Jakarta Sans',sans-serif;background:linear-gradient(135deg, var(--a), var(--adk));-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-.04em">12 jours</div>
      <div style="font:500 13px/1 'Inter',sans-serif;color:var(--mu3)">de série continue</div>
    </div>`,
    title: 'La régularité fait\nla différence.',
    body: 'Plus tu t\'entraînes chaque jour, plus ton cerveau mémorise. Lance ta première série et bats ton record !',
    accent: 'var(--am)',
  },
];

const STYLE = `
  @keyframes obFlame { from { transform: scale(1) rotate(-3deg); } to { transform: scale(1.12) rotate(3deg); } }
  @keyframes obOverlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes obSheetIn { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes obSheetOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(40px); } }
  @keyframes obContentIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }

  .ob-overlay {
    position: fixed; inset: 0; z-index: 9990;
    background: rgba(0,0,0,.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: flex-end; justify-content: center;
    animation: obOverlayIn .2s cubic-bezier(.23,1,.32,1);
  }
  .ob-sheet {
    width: 100%; max-width: 480px;
    background: #fff;
    border-radius: 32px 32px 0 0;
    border-top: 1px solid var(--bo);
    padding: 0 0 max(32px, env(safe-area-inset-bottom));
    overflow: hidden;
    animation: obSheetIn .35s cubic-bezier(.23,1,.32,1);
  }
  .ob-sheet.ob-closing {
    animation: obSheetOut .25s cubic-bezier(.4,0,1,1) forwards;
  }
  .ob-accent-bar {
    height: 4px;
    width: 100%;
    background: var(--ob-accent, var(--a));
    transition: background .4s cubic-bezier(.23,1,.32,1);
  }
  .ob-handle {
    width: 36px; height: 4px;
    background: var(--bo);
    border-radius: 2px;
    margin: 14px auto 24px;
  }
  .ob-slide {
    padding: 0 28px;
    animation: obContentIn .25s cubic-bezier(.23,1,.32,1);
  }
  .ob-illo {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 90px;
    margin-bottom: 24px;
  }
  .ob-title {
    font: 800 24px/1.25 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    text-align: center;
    margin-bottom: 12px;
    letter-spacing: -.025em;
    white-space: pre-line;
  }
  .ob-body {
    font: 500 15px/1.6 'Inter', sans-serif;
    color: var(--mu3);
    text-align: center;
    margin-bottom: 28px;
  }
  .ob-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 20px;
  }
  .ob-dot {
    height: 6px;
    width: 6px;
    border-radius: 3px;
    background: var(--bo);
    transition: width .3s cubic-bezier(.34,1.56,.64,1), background .3s cubic-bezier(.34,1.56,.64,1);
  }
  .ob-dot.active { width: 20px; background: var(--ob-accent, var(--a)); }
  .ob-btn {
    width: calc(100% - 56px);
    margin: 0 28px;
    padding: 17px;
    background: var(--ob-accent, var(--a));
    border: 0;
    border-radius: 18px;
    color: #fff;
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--ob-accent,var(--a)) 40%, transparent);
    transition: background .3s cubic-bezier(.23,1,.32,1), box-shadow .3s cubic-bezier(.23,1,.32,1), transform .12s;
    min-height: 52px;
    font-family: inherit;
  }
  .ob-btn:active { transform: scale(.97); }
  .ob-skip {
    display: block;
    text-align: center;
    margin-top: 10px;
    padding: 8px;
    color: var(--mu2);
    font: 500 13px/1 'Inter', sans-serif;
    background: none;
    border: 0;
    cursor: pointer;
    width: 100%;
    font-family: inherit;
    transition: color .15s;
  }
  .ob-skip:hover { color: var(--mu3); }
  @media (prefers-reduced-motion: reduce) {
    .ob-overlay, .ob-sheet, .ob-slide { animation: none; }
    .ob-dot, .ob-btn, .ob-accent-bar { transition: none; }
  }
`;

export function showOnboarding(userId, onDone) {
  let idx = 0;

  const overlay = document.createElement('div');
  overlay.className = 'ob-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Bienvenue dans PermiGo');

  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  // Stable shell — accent-bar, handle, dots, button separate from animated slide content
  overlay.innerHTML = `
    <div class="ob-sheet" id="ob-sheet" style="--ob-accent:${SLIDES[0].accent}">
      <div class="ob-accent-bar" id="ob-accent-bar"></div>
      <div class="ob-handle"></div>
      <div id="ob-slide-wrap"></div>
      <div class="ob-dots" id="ob-dots">
        ${SLIDES.map((_, i) => `<div class="ob-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}
      </div>
      <button class="ob-btn" id="ob-next">Suivant →</button>
      <button class="ob-skip" id="ob-skip">Passer</button>
    </div>
  `;

  const sheet     = overlay.querySelector('#ob-sheet');
  const slideWrap = overlay.querySelector('#ob-slide-wrap');
  const dotsEl    = overlay.querySelector('#ob-dots');
  const accentBar = overlay.querySelector('#ob-accent-bar');
  const btnNext   = overlay.querySelector('#ob-next');
  const btnSkip   = overlay.querySelector('#ob-skip');

  function updateDots() {
    dotsEl.querySelectorAll('.ob-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
  }

  function renderSlideContent() {
    const slide = SLIDES[idx];
    const isLast = idx === SLIDES.length - 1;

    // Animate in new content (class reset via re-creating the element)
    const div = document.createElement('div');
    div.className = 'ob-slide';
    div.innerHTML = `
      <div class="ob-illo">${slide.illo}</div>
      <div class="ob-title">${esc(slide.title)}</div>
      <div class="ob-body">${esc(slide.body)}</div>
    `;

    slideWrap.innerHTML = '';
    slideWrap.appendChild(div);

    // Sync accent color
    sheet.style.setProperty('--ob-accent', slide.accent);

    // Btn label
    btnNext.textContent = isLast ? 'C\'est parti ! 🚀' : 'Suivant →';

    // Hide skip on last slide
    btnSkip.style.display = isLast ? 'none' : '';

    updateDots();
  }

  btnNext.addEventListener('click', () => {
    track('onboarding.slide_next', { slide: idx });
    const isLast = idx === SLIDES.length - 1;
    if (isLast) finish();
    else { idx++; renderSlideContent(); }
  });

  btnSkip.addEventListener('click', () => {
    track('onboarding.skipped', { at_slide: idx });
    finish();
  });

  async function finish() {
    track('onboarding.completed', { slides_seen: idx + 1 });

    // Slide sheet down, fade overlay
    sheet.classList.add('ob-closing');
    overlay.style.transition = 'opacity .25s';
    setTimeout(() => { overlay.style.opacity = '0'; }, 50);
    setTimeout(() => { overlay.remove(); styleEl.remove(); }, 320);

    if (userId) {
      try {
        const { error } = await sb.from('profiles')
          .update({ first_value_action_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) console.warn('[onboarding] update first_value_action_at failed', error);
      } catch (e) {
        console.warn('[onboarding] finish update failed', e);
      }
    }
    onDone?.();
  }

  renderSlideContent();
  document.body.appendChild(overlay);
}
