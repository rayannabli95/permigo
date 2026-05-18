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
  const prenom       = esc(me.prenom || w.prenom || 'Toi');
  const longestStreak = w.streaks?.longest ?? 0;
  const totalDays    = w.streaks?.total_active_days ?? 0;
  const topCompId    = w.top_competence?.competence_id ?? null;
  const topCompLabel = w.top_competence?.label ?? (topCompId ? esc(topCompId) : 'Aucune');
  const percentile   = w.percentile ?? null;
  const totalValid   = w.total_validations ?? 0;
  const totalQuiz    = w.total_quiz ?? 0;
  const xpGained     = w.xp_gained ?? 0;

  const slides = [
    renderSlide1({ prenom, year: YEAR }),
    renderSlide2({ longestStreak, totalDays }),
    renderSlide3({ topCompLabel, totalValid, totalQuiz }),
    renderSlide4({ percentile, xpGained, prenom }),
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

  wireWrapped(root, me, { longestStreak, percentile, xpGained, totalValid, prenom });
}

function renderSlide1({ prenom, year }) {
  return `
<div class="wrp-slide" data-slide="0">
  <div class="wrp-slide-bg" style="background:linear-gradient(160deg,#6366f1 0%,#7c3aed 50%,#0a0d1a 100%)">
    <img class="wrp-slide-img" src="/skins/wrapped_cover.png" alt="" aria-hidden="true">
  </div>
  <div class="wrp-slide-content">
    <div class="wrp-slide-eyebrow">PermiGo · ${year}</div>
    <div class="wrp-slide-headline">Ta route en<br>${year}</div>
    <div class="wrp-slide-sub">${prenom}, voici le récap de ton apprentissage 🚗</div>
  </div>
</div>`;
}

function renderSlide2({ longestStreak, totalDays }) {
  const emoji = longestStreak >= 30 ? '🔥' : longestStreak >= 14 ? '⚡' : longestStreak >= 7 ? '✨' : '💪';
  return `
<div class="wrp-slide" data-slide="1">
  <div class="wrp-slide-bg" style="background:linear-gradient(160deg,#f97316 0%,#dc2626 50%,#0a0d1a 100%)">
    <img class="wrp-slide-img" src="/skins/wrapped_streak.png" alt="" aria-hidden="true">
  </div>
  <div class="wrp-slide-content">
    <div class="wrp-slide-eyebrow">Ta série record</div>
    <div class="wrp-slide-headline">${emoji}<br><span class="wrp-big-num">${longestStreak}</span><br>jours d'affilée</div>
    <div class="wrp-slide-sub">${totalDays} jour${totalDays !== 1 ? 's' : ''} d'apprentissage actif cette année</div>
  </div>
</div>`;
}

function renderSlide3({ topCompLabel, totalValid, totalQuiz }) {
  return `
<div class="wrp-slide" data-slide="2">
  <div class="wrp-slide-bg" style="background:linear-gradient(160deg,#059669 0%,#0891b2 50%,#0a0d1a 100%)">
    <img class="wrp-slide-img" src="/skins/wrapped_top_comp.png" alt="" aria-hidden="true">
  </div>
  <div class="wrp-slide-content">
    <div class="wrp-slide-eyebrow">Ta compétence phare</div>
    <div class="wrp-slide-headline">🎯<br>${esc(String(topCompLabel))}</div>
    <div class="wrp-slide-stats">
      <div class="wrp-stat-pill">${totalValid} compétences acquises</div>
      <div class="wrp-stat-pill">${totalQuiz} quiz réussis</div>
    </div>
  </div>
</div>`;
}

function renderSlide4({ percentile, xpGained, prenom }) {
  const pctText = percentile !== null
    ? `Top ${100 - percentile}% de ton école`
    : 'Continue comme ça !';
  const badge = percentile !== null && percentile >= 90 ? '🌟 Top de l\'école' : null;

  return `
<div class="wrp-slide" data-slide="3">
  <div class="wrp-slide-bg" style="background:linear-gradient(160deg,#7c3aed 0%,#db2777 50%,#0a0d1a 100%)">
    <img class="wrp-slide-img" src="/skins/wrapped_percentile.png" alt="" aria-hidden="true">
  </div>
  <div class="wrp-slide-content">
    <div class="wrp-slide-eyebrow">Ton classement</div>
    <div class="wrp-slide-headline">
      ${percentile !== null ? `<span class="wrp-big-num">${percentile}</span><br>%ile` : '🚀'}
    </div>
    <div class="wrp-slide-sub">${pctText}</div>
    ${badge ? `<div class="wrp-badge">${badge}</div>` : ''}
    <div class="wrp-slide-sub" style="margin-top:12px">+${xpGained} XP gagnés cette année</div>
  </div>
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
  justify-content: flex-end;
  overflow: hidden;
}
.wrp-slide-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.wrp-slide-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .25;
  mix-blend-mode: luminosity;
}
/* Dark gradient from bottom for text readability */
.wrp-slide::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.2) 60%, transparent 100%);
  z-index: 1;
}
.wrp-slide-content {
  position: relative;
  z-index: 2;
  padding: 24px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wrp-slide-eyebrow {
  font: 700 11px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.6);
}
.wrp-slide-headline {
  font: 800 42px/1.1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -.03em;
  line-height: 1.1;
}
.wrp-big-num {
  font: 800 80px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.05em;
  display: block;
}
.wrp-slide-sub {
  font: 500 15px/1.5 'Inter', sans-serif;
  color: rgba(255,255,255,.75);
}
.wrp-stat-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.wrp-stat-pill, .wrp-stat-pills .wrp-stat-pill {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(255,255,255,.15);
  border-radius: 99px;
  font: 600 12px/1 'Inter', sans-serif;
  color: #fff;
  backdrop-filter: blur(4px);
}
.wrp-stat-pill { display: inline-block; padding: 6px 14px; background: rgba(255,255,255,.15); border-radius: 99px; font: 600 12px/1 'Inter', sans-serif; color: #fff; margin-right: 6px; }
.wrp-badge {
  display: inline-block;
  padding: 8px 16px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  border-radius: 99px;
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  align-self: flex-start;
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
