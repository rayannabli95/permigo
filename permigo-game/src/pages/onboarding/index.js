// ═══════════════════════════════════════════════════════════════
// Onboarding élève — tour de bienvenue 5 écrans (carrousel swipe)
// Déclenché par main.js quand profiles.first_value_action_at IS NULL
// Inspiré des meilleurs onboardings mobiles (Duolingo/Notion) :
// 1 idée par écran, copy orientée bénéfice, transitions fluides,
// swipe natif, progression claire, perso (prénom + avatar), skippable.
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { icon } from '@/utils/icons.js';
import { getCurUser, setCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { ASSETS } from '@/utils/assets.js';
import { haptic } from '@/utils/haptic.js';

// ─── Contenu des 4 écrans narratifs (le 5e = avatar) ─────────────
const SLIDES = [
  {
    emoji: '🚗',
    badge: 'PermiGo',
    title: 'Bienvenue, <span class="accent">{prenom}</span> !',
    body: 'Ton permis, une victoire par jour. On avance ensemble : toi, ton moniteur, et un parcours clair.',
    cta: 'Commencer',
  },
  {
    emoji: '🗺️',
    title: '31 compétences, zéro brouillard',
    body: "Le programme officiel du permis transformé en parcours. Tu avances compétence par compétence, et ton moniteur valide ce que tu maîtrises en séance.",
    cta: 'Continuer',
  },
  {
    emoji: '⚡',
    title: 'Ancre ce que tu apprends',
    body: "Après chaque compétence, un quiz éclair de 30 secondes. Une question ratée ? On te la represente quelques jours plus tard, pile au bon moment. C'est la mémoire qui dure.",
    cta: 'Continuer',
  },
  {
    emoji: '🔥',
    title: 'Reviens chaque jour',
    body: "Chaque jour de pratique fait monter ton streak, débloque des trophées et te place dans le classement de ton auto-école. Du jeu, pour de vrais résultats.",
    cta: 'Continuer',
  },
  // 5e écran : choix d'avatar (interactif) + CTA final, géré à part.
];

const TOTAL = SLIDES.length + 1; // +1 pour l'écran avatar

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('onboarding.start', { role: me.role });

  let idx = 0;
  let avatar = (me.avatar_url && ASSETS.avatar?.includes(me.avatar_url)) ? me.avatar_url : (ASSETS.avatar?.[0] || null);
  let finishing = false;

  root.innerHTML = `
    ${STYLE}
    <div class="ob" role="dialog" aria-modal="true" aria-label="Tour de bienvenue">
      <div class="ob-head">
        <div class="ob-dots" id="ob-dots">
          ${Array.from({ length: TOTAL }, (_, i) => `<span class="ob-dot${i === 0 ? ' active' : ''}" data-i="${i}"></span>`).join('')}
        </div>
        <button class="ob-skip" id="ob-skip" type="button">Passer</button>
      </div>

      <div class="ob-viewport" id="ob-viewport">
        <div class="ob-track" id="ob-track" style="width:${TOTAL * 100}%">
          ${SLIDES.map((s, i) => `
            <section class="ob-slide" data-i="${i}">
              <div class="ob-emoji" aria-hidden="true">${s.emoji}</div>
              ${s.badge ? `<div class="ob-badge">Permi<span>Go</span></div>` : ''}
              <h1 class="ob-title">${s.title.replace('{prenom}', esc(me.prenom || me.nom || 'toi'))}</h1>
              <p class="ob-body-txt">${esc(s.body)}</p>
            </section>
          `).join('')}
          <section class="ob-slide ob-slide-avatar" data-i="${SLIDES.length}">
            <div class="ob-emoji" aria-hidden="true">${icon('palette',{size:34})}</div>
            <h1 class="ob-title">Choisis ta tête</h1>
            <p class="ob-body-txt">Tu pourras en changer quand tu veux depuis ton profil.</p>
            <div class="ob-av-grid" id="ob-av-grid" role="radiogroup" aria-label="Choix de l'avatar">
              ${(ASSETS.avatar || []).map((url, i) => `
                <button class="ob-av-card${url === avatar ? ' sel' : ''}" data-url="${esc(url)}" role="radio" aria-checked="${url === avatar}" aria-label="Avatar ${i + 1}" type="button">
                  <img class="ob-av-img" src="${esc(url)}" alt="" loading="lazy" />
                  <span class="ob-av-check" aria-hidden="true">✓</span>
                </button>`).join('')}
            </div>
          </section>
        </div>
      </div>

      <div class="ob-footer">
        <button class="ob-cta" id="ob-cta" type="button">${esc(SLIDES[0].cta)} <span aria-hidden="true">→</span></button>
      </div>
    </div>
  `;

  const track$ = root.querySelector('#ob-track');
  const ctaBtn = root.querySelector('#ob-cta');
  const dotsEl = root.querySelector('#ob-dots');
  const viewport = root.querySelector('#ob-viewport');

  function isAvatarSlide() { return idx === SLIDES.length; }

  function update() {
    track$.style.transform = `translateX(-${(idx * 100) / TOTAL}%)`;
    dotsEl.querySelectorAll('.ob-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
      d.classList.toggle('done', i < idx);
    });
    // Ré-anime l'emoji du slide actif
    root.querySelectorAll('.ob-slide').forEach((s, i) => {
      s.classList.toggle('on', i === idx);
      s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
    });
    if (isAvatarSlide()) {
      ctaBtn.innerHTML = 'Voir mon parcours';
    } else {
      ctaBtn.innerHTML = `${esc(SLIDES[idx].cta)} <span aria-hidden="true">→</span>`;
    }
    track('onboarding.step_viewed', { step: idx + 1 });
  }

  function goTo(i) {
    idx = Math.max(0, Math.min(TOTAL - 1, i));
    haptic?.('tap');
    update();
  }
  function next() { isAvatarSlide() ? finish() : goTo(idx + 1); }
  function prev() { if (idx > 0) goTo(idx - 1); }

  ctaBtn.addEventListener('click', next);

  // Dots cliquables (retour en arrière possible)
  dotsEl.querySelectorAll('.ob-dot').forEach(d => {
    d.addEventListener('click', () => goTo(parseInt(d.dataset.i, 10)));
  });

  // Avatar
  root.querySelectorAll('.ob-av-card').forEach(card => {
    card.addEventListener('click', () => {
      avatar = card.dataset.url;
      haptic?.('select');
      root.querySelectorAll('.ob-av-card').forEach(c => {
        const on = c.dataset.url === avatar;
        c.classList.toggle('sel', on);
        c.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    });
  });

  // Skip → termine direct
  root.querySelector('#ob-skip').addEventListener('click', () => {
    track('onboarding.skipped', { at_step: idx + 1 });
    finish();
  });

  // Swipe horizontal (mobile natif)
  let startX = 0, startY = 0, swiping = false;
  viewport.addEventListener('touchstart', e => {
    const t = e.changedTouches[0]; startX = t.clientX; startY = t.clientY; swiping = true;
  }, { passive: true });
  viewport.addEventListener('touchend', e => {
    if (!swiping) return; swiping = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX, dy = t.clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      dx < 0 ? next() : prev();
    }
  }, { passive: true });

  // Clavier (flèches)
  function onKey(e) {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  }
  document.addEventListener('keydown', onKey);

  async function finish() {
    if (finishing) return;
    finishing = true;
    document.removeEventListener('keydown', onKey);
    track('onboarding.completed', { last_step: idx + 1, avatar_chosen: !!avatar });
    ctaBtn.disabled = true;
    ctaBtn.innerHTML = 'Lancement…';
    try {
      const now = new Date().toISOString();
      const patch = { first_value_action_at: now };
      if (avatar) patch.avatar_url = avatar;
      await sb.from('profiles').update(patch).eq('id', me.id);
      setCurUser({ ...me, ...patch });
    } catch (e) { console.error('[onboarding] finish update failed', e); }
    // Reboot complet → monte le chrome + flow normal, atterrit sur le parcours
    location.hash = '#/parcours';
    location.reload();
  }

  update();
}

const STYLE = `<style>
  .ob {
    position: fixed; inset: 0; z-index: 9999;
    background:
      radial-gradient(ellipse 90% 60% at 50% 0%, rgba(88,204,2,.14) 0%, transparent 55%),
      linear-gradient(180deg, var(--ink) 0%, var(--ink4, #0f1424) 100%);
    display: flex; flex-direction: column;
    font-family: 'Inter', sans-serif;
    color: #fff;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    animation: obFade .3s ease both;
  }
  @keyframes obFade { from { opacity: 0; } to { opacity: 1; } }

  /* Header : dots + skip */
  .ob-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 8px;
    flex-shrink: 0;
  }
  .ob-dots { display: flex; align-items: center; gap: 7px; }
  .ob-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,.22);
    transition: background .3s, width .3s; cursor: pointer;
    border: 0; padding: 0;
  }
  .ob-dot.active { width: 22px; border-radius: 4px; background: var(--a); }
  .ob-dot.done { background: rgba(88,204,2,.45); }
  .ob-skip {
    background: none; border: 0; color: rgba(255,255,255,.55);
    font: 600 13px/1 'Inter', sans-serif; cursor: pointer;
    padding: 10px 6px; min-height: 44px;
  }
  .ob-skip:active { color: #fff; }

  /* Viewport + track (carrousel) */
  .ob-viewport { flex: 1; overflow: hidden; position: relative; }
  .ob-track {
    display: flex; height: 100%;
    transition: transform .42s cubic-bezier(.4,0,.2,1);
  }
  @media (prefers-reduced-motion: reduce) { .ob-track { transition: none; } }
  .ob-slide {
    flex: 1 0 0; min-width: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 16px 28px;
    overflow-y: auto;
  }

  .ob-emoji {
    font-size: 76px; line-height: 1; margin-bottom: 20px;
    filter: drop-shadow(0 12px 28px rgba(0,0,0,.45));
  }
  .ob-slide.on .ob-emoji { animation: obPop .55s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes obPop { 0% { transform: scale(.5) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .ob-slide.on .ob-emoji { animation: none; } }

  .ob-badge {
    font: 800 14px/1 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.01em; color: #fff;
    margin-bottom: 14px; opacity: .9;
  }
  .ob-badge span { color: var(--a); }

  .ob-title {
    font: 800 27px/1.18 'Plus Jakarta Sans', sans-serif;
    color: #fff; letter-spacing: -.025em;
    margin: 0 0 14px; max-width: 18ch;
  }
  .ob-title .accent { color: var(--a); }
  .ob-body-txt {
    font: 500 16px/1.55 'Inter', sans-serif;
    color: rgba(255,255,255,.72);
    margin: 0; max-width: 32ch;
  }

  /* Avatar grid */
  .ob-av-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    margin-top: 24px; width: 100%; max-width: 340px;
  }
  .ob-av-card {
    position: relative; aspect-ratio: 1;
    border-radius: 18px; overflow: hidden; cursor: pointer;
    border: 2.5px solid transparent;
    background: rgba(255,255,255,.06);
    padding: 0; transition: border-color .15s, transform .12s;
  }
  .ob-av-card:active { transform: scale(.95); }
  .ob-av-card.sel { border-color: var(--a); }
  .ob-av-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ob-av-check {
    position: absolute; top: 5px; right: 5px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--a); color: #fff;
    font-size: 13px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: scale(.5); transition: opacity .15s, transform .15s;
  }
  .ob-av-card.sel .ob-av-check { opacity: 1; transform: scale(1); }

  /* Footer CTA */
  .ob-footer {
    flex-shrink: 0;
    padding: 12px 24px calc(env(safe-area-inset-bottom, 0px) + 20px);
  }
  .ob-cta {
    width: 100%; padding: 17px;
    background: linear-gradient(135deg, var(--a), var(--adk, #46a302));
    border: 0; border-radius: 16px; color: #fff;
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; min-height: 56px;
    box-shadow: 0 10px 28px -8px rgba(88,204,2,.55);
    transition: transform .12s, opacity .15s;
  }
  .ob-cta:active { transform: scale(.98); }
  .ob-cta:disabled { opacity: .6; cursor: wait; }
</style>`;
