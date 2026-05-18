// ═══════════════════════════════════════════════════════════════
// Élève — PermiGo Wrapped (récap annuel Spotify-style)
// RPC : get_my_wrapped(year?)
// ═══════════════════════════════════════════════════════════════
import { sb }         from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc }        from '@/utils/escape.js';
import { track }      from '@/services/analytics.js';
import { navigate }   from '@/router.js';

const YEAR = new Date().getFullYear();

// ─── Mount ───────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track('page_view', { page: 'wrapped', user_role: me.role, year: YEAR });

  root.innerHTML = renderStyles() + `
<div class="wrp" id="wrp-root">
  <div class="wrp-loading">
    <div class="wrp-loading-ico">✨</div>
    <div class="wrp-loading-txt">Génération de ton Wrapped…</div>
  </div>
</div>`;

  try {
    const { data, error } = await sb.rpc('get_my_wrapped', { year: YEAR });
    if (error || data?.error) throw new Error(data?.error || 'Erreur chargement');
    renderWrapped(root, me, data || {});
  } catch (e) {
    console.error('[wrapped]', e);
    root.querySelector('#wrp-root').innerHTML = `
      <div class="wrp-loading">
        <div class="wrp-loading-ico">😕</div>
        <div class="wrp-loading-txt">Données non disponibles — reviens plus tard !</div>
        <button class="wrp-back-btn" id="wrp-err-back">← Retour</button>
      </div>
    `;
    root.querySelector('#wrp-err-back')?.addEventListener('click', () => navigate('/'));
  }
}

// ─── Slides ──────────────────────────────────────────────────
function renderWrapped(root, me, w) {
  const longestStreak = w.streaks?.longest ?? 0;
  const topCompId    = w.top_competence?.competence_id ?? null;
  const topCompLabel = w.top_competence?.label ?? (topCompId ? esc(topCompId) : 'Aucune');
  const percentile   = w.percentile ?? null;
  const xpGained     = w.xp_gained ?? 0;

  // Slide order: 1 cover · 2 percentile · 3 streak · 4 top_comp
  const slides = [
    renderSlide1(),
    renderSlide2({ percentile }),
    renderSlide3({ longestStreak }),
    renderSlide4({ topCompLabel }),
  ];

  const wrpRoot = root.querySelector('#wrp-root');
  wrpRoot.innerHTML = `
    <div class="wrp-slides" id="wrp-slides">
      ${slides.join('')}
    </div>
    <div class="wrp-controls">
      <div class="wrp-dots" id="wrp-dots">
        ${slides.map((_, i) => `<div class="wrp-dot ${i === 0 ? 'wrp-dot--active' : ''}" data-i="${i}"></div>`).join('')}
      </div>
      <button class="wrp-share-btn" id="wrp-share">Partager mon Wrapped 🔗</button>
      <button class="wrp-close-btn" id="wrp-close">← Retour à l'accueil</button>
    </div>
  `;

  wireWrapped(root, me, { longestStreak, percentile, xpGained });
}

// Slide 1 — Cover : image seule, aucun overlay texte
function renderSlide1() {
  return `
<div class="wrp-slide" data-slide="0">
  <div class="wrp-slide-bg">
    <img class="wrp-slide-img" src="/skins/wrapped_cover.png" alt="" aria-hidden="true">
  </div>
</div>`;
}

// Slide 2 — Percentile
function renderSlide2({ percentile }) {
  const text = percentile !== null ? `Top ${100 - percentile}%` : '🚀';
  return `
<div class="wrp-slide" data-slide="1">
  <div class="wrp-slide-bg">
    <img class="wrp-slide-img" src="/skins/wrapped_streak.png" alt="" aria-hidden="true">
  </div>
  <div class="wrp-slide-overlay-dark"></div>
  <div class="wrp-overlay-centered">${text}</div>
</div>`;
}

// Slide 3 — Streak
function renderSlide3({ longestStreak }) {
  return `
<div class="wrp-slide" data-slide="2">
  <div class="wrp-slide-bg">
    <img class="wrp-slide-img" src="/skins/wrapped_streak.png" alt="" aria-hidden="true">
  </div>
  <div class="wrp-slide-overlay-dark"></div>
  <div class="wrp-overlay-centered">${longestStreak} jours 🔥</div>
</div>`;
}

// Slide 4 — Top compétence
function renderSlide4({ topCompLabel }) {
  return `
<div class="wrp-slide" data-slide="3">
  <div class="wrp-slide-bg">
    <img class="wrp-slide-img" src="/skins/wrapped_streak.png" alt="" aria-hidden="true">
  </div>
  <div class="wrp-slide-overlay-dark"></div>
  <div class="wrp-overlay-centered">Top compétence :<br>${esc(String(topCompLabel))}</div>
</div>`;
}

// ─── Wire ────────────────────────────────────────────────────
function wireWrapped(root, me, stats) {
  const slidesEl = root.querySelector('#wrp-slides');
  const dots     = root.querySelectorAll('.wrp-dot');

  // Scroll → update dots
  slidesEl?.addEventListener('scroll', () => {
    const idx = Math.round(slidesEl.scrollLeft / slidesEl.clientWidth);
    dots.forEach((d, i) => d.classList.toggle('wrp-dot--active', i === idx));
    track('wrapped.slide_viewed', { slide: idx });
  }, { passive: true });

  // Dot click → scroll to slide
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const i = parseInt(dot.dataset.i, 10);
      slidesEl?.scrollTo({ left: i * slidesEl.clientWidth, behavior: 'smooth' });
    });
  });

  // Share
  root.querySelector('#wrp-share')?.addEventListener('click', async () => {
    const text = `Mon PermiGo Wrapped ${YEAR} 🚗\n`
      + (stats.longestStreak ? `🔥 ${stats.longestStreak} jours de série record\n` : '')
      + (stats.percentile !== null ? `🏆 Top ${100 - stats.percentile}% de l'école\n` : '')
      + `+${stats.xpGained} XP gagnés !`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Mon Wrapped PermiGo ${YEAR}`, text, url: window.location.origin });
        track('wrapped.shared', {});
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        const { toast } = await import('@/components/toast.js');
        toast('Texte copié 📋', 'success');
      } catch { /* unavailable */ }
    }
  });

  root.querySelector('#wrp-close')?.addEventListener('click', () => navigate('/'));
}

// ─── Styles ──────────────────────────────────────────────────
function renderStyles() {
  return `<style>
/* === Wrapped === */
.wrp {
  min-height: 100svh;
  background: #0a0d1a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  color: #fff;
}

/* Loading */
.wrp-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100svh;
  gap: 16px;
  text-align: center;
  padding: 24px;
}
.wrp-loading-ico { font-size: 48px; }
.wrp-loading-txt {
  font: 500 16px/1.5 'Inter', sans-serif;
  color: #94a3b8;
}
.wrp-back-btn {
  margin-top: 8px;
  padding: 12px 24px;
  background: rgba(255,255,255,.08);
  border: none;
  border-radius: 12px;
  color: #fff;
  font: 600 14px/1 'Inter', sans-serif;
  cursor: pointer;
  min-height: 44px;
}

/* Slide rail */
.wrp-slides {
  display: flex;
  flex: 1;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  height: calc(100svh - 120px);
}
.wrp-slides::-webkit-scrollbar { display: none; }

/* Individual slide */
.wrp-slide {
  flex-shrink: 0;
  width: 100svw;
  height: 100%;
  scroll-snap-align: start;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.wrp-slide-bg {
  position: absolute;
  inset: 0;
  background: #0a0d1a;
  z-index: 0;
}
.wrp-slide-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Semi-transparent dark overlay for text readability (slides 2-4) */
.wrp-slide-overlay-dark {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.35);
  z-index: 1;
}

/* Centered text overlay (slides 2-4) */
.wrp-overlay-centered {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 60px;
  font: 800 clamp(40px,8vw,64px)/1.15 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  text-shadow: 0 4px 20px rgba(0,0,0,.6);
  text-align: center;
  z-index: 2;
  pointer-events: none;
}

/* Controls bar */
.wrp-controls {
  flex-shrink: 0;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: #0a0d1a;
  border-top: 1px solid rgba(255,255,255,.06);
}
.wrp-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}
.wrp-dot {
  width: 6px; height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,.25);
  cursor: pointer;
  transition: width 200ms cubic-bezier(.23,1,.32,1), background 200ms;
}
.wrp-dot--active {
  width: 20px;
  background: #fff;
}
.wrp-share-btn {
  width: 100%;
  max-width: 400px;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 14px;
  color: #fff;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: transform 120ms cubic-bezier(.23,1,.32,1), opacity 120ms;
  min-height: 50px;
}
.wrp-share-btn:active { transform: scale(.97); }
.wrp-close-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,.45);
  font: 500 13px/1 'Inter', sans-serif;
  cursor: pointer;
  padding: 8px;
  min-height: 36px;
  transition: color .15s;
}
.wrp-close-btn:active { color: rgba(255,255,255,.7); }
</style>`;
}
