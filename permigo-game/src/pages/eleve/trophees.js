// ═══════════════════════════════════════════════════════════════
// Élève — Trophées (light theme)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { TROPHEES, RARITY_LABEL, RARITY_COLOR } from '@/data/trophees.js';

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.trp {
  padding: 0 0 100px;
  max-width: 480px;
  margin: 0 auto;
  background: #f8f9fc;
  font-family: 'Inter', sans-serif;
}
.trp-hd {
  padding: 20px 20px 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  background: #f8f9fc;
}
.trp-title { font: 800 24px/1.1 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; letter-spacing: -.025em; }
.trp-sub   { font: 600 12px/1 'IBM Plex Mono', monospace; color: #64748b; }

/* Grille */
.trp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 16px;
}
@media (max-width: 360px) {
  .trp-grid { grid-template-columns: 1fr 1fr; }
}

.trp-card {
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 18px;
  padding: 16px 10px;
  text-align: center;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(11,13,26,.05);
}
.trp-card.unlocked {
  border-color: color-mix(in srgb, var(--tc) 35%, transparent);
  background: color-mix(in srgb, var(--tc) 6%, #fff);
}
.trp-card.unlocked::after {
  content: '';
  position: absolute;
  top: -60%; left: -60%;
  width: 220%; height: 220%;
  background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,.5) 50%, transparent 62%);
  animation: shimTrophy 3.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes shimTrophy {
  0%   { transform: translateX(-100%) rotate(15deg); }
  100% { transform: translateX(100%) rotate(15deg); }
}
/* Légendaire — bordure or animée */
.trp-card.legendary {
  border: 1.5px solid transparent;
  background-clip: padding-box;
  position: relative;
}
.trp-card.legendary::before {
  content: '';
  position: absolute;
  inset: -1.5px;
  border-radius: 19px;
  background: conic-gradient(from var(--angle,0deg), #f59e0b, #fde68a, #f59e0b, #d97706, #f59e0b);
  animation: goldSpin 3s linear infinite;
  z-index: -1;
}
@keyframes goldSpin {
  to { --angle: 360deg; }
}
@property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

.trp-card:not(.trp-card-locked):hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(11,13,26,.1); }
.trp-card:not(.trp-card-locked):active { transform: scale(.96); }
.trp-card-locked {
  opacity: .55;
  cursor: default;
  pointer-events: none;
}
.trp-card-locked .trp-ico-wrap {
  filter: grayscale(1);
  opacity: .6;
}

.trp-ico-wrap {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--tc,#94a3b8) 14%, #fff);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 10px;
  font-size: 26px;
  line-height: 1;
  position: relative;
  z-index: 1;
}
.trp-nom {
  font: 700 11px/1.3 'Plus Jakarta Sans', sans-serif;
  color: #0b0d1a;
  margin-bottom: 6px;
}
.trp-rarity {
  font: 700 9px/1 'IBM Plex Mono', monospace;
  letter-spacing: .06em;
  text-transform: uppercase;
  border-radius: 20px;
  padding: 3px 8px;
  display: inline-block;
}
.trp-locked-lbl {
  font: 500 10px/1.3 'Inter', sans-serif;
  color: #94a3b8;
  margin-top: 6px;
}

/* Section header */
.trp-section-hd {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 10px;
}
.trp-section-title {
  font: 700 13px/1 'IBM Plex Mono', monospace;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #64748b;
}
.trp-section-count {
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: #6366f1;
  background: rgba(99,102,241,.1);
  border-radius: 20px;
  padding: 3px 8px;
}

/* Bottom sheet */
.trp-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0);
  z-index: 490;
  pointer-events: none;
  transition: background .3s;
}
.trp-bg.open {
  background: rgba(0,0,0,.45);
  pointer-events: auto;
  backdrop-filter: blur(4px);
}
.trp-sheet {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 495;
  background: #fff;
  border-radius: 28px 28px 0 0;
  border-top: 1px solid #e2e6f2;
  transform: translateY(100%);
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}
.trp-sheet.open { transform: translateY(0); }
.trp-sheet-handle {
  width: 36px; height: 4px;
  background: #e2e6f2;
  border-radius: 2px;
  margin: 14px auto 0;
}
.trp-sheet-body { padding: 20px 24px 8px; }
.trp-sheet-ico-wrap {
  width: 72px; height: 72px;
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  font-size: 38px;
  line-height: 1;
  margin: 0 auto 14px;
}
.trp-sheet-nom { font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; margin-bottom: 6px; letter-spacing: -.025em; }
.trp-sheet-desc { font: 500 14px/1.5 'Inter', sans-serif; color: #64748b; margin-bottom: 16px; }
.trp-sheet-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.trp-sheet-tag {
  font: 700 11px/1 'IBM Plex Mono', monospace;
  letter-spacing: .06em;
  text-transform: uppercase;
  border-radius: 20px;
  padding: 5px 12px;
}
.trp-sheet-actions { display: flex; gap: 10px; }
.trp-sheet-btn {
  flex: 1;
  height: 48px;
  border-radius: 14px;
  border: 1.5px solid #e2e6f2;
  background: #f8f9fc;
  color: #0b0d1a;
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: background .12s, border-color .12s;
  font-family: inherit;
}
.trp-sheet-btn:hover { background: #f0f2f8; border-color: #d1d8ee; }
.trp-sheet-btn.primary { background: #6366f1; border-color: #6366f1; color: #fff; }
.trp-sheet-btn.primary:hover { background: #4f46e5; border-color: #4f46e5; }
.trp-sheet-btn:disabled { opacity: .4; cursor: default; }

/* Skeleton */
.skel-line {
  display: block;
  background: linear-gradient(90deg, #f0f2f8 0%, #e4e8f4 50%, #f0f2f8 100%);
  background-size: 200% 100%;
  animation: sklAnim 1.4s infinite;
  border-radius: 8px;
}
@keyframes sklAnim { to { background-position: -200% 0; } }
</style>`;

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page_view', { page: 'trophees', user_role: me.role });

  root.innerHTML = `${STYLE}<div class="trp"><div style="padding:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${
    Array(5).fill(0).map(() => `<div class="skel-line" style="height:110px;border-radius:18px"></div>`).join('')
  }</div></div>`;

  try {
    const [streakRes, validRes, quizRes] = await Promise.allSettled([
      sb.from('streaks').select('current_streak, longest_streak').eq('user_id', me.id).maybeSingle(),
      sb.from('validations').select('competence_id, validated_at').eq('eleve_id', me.id).eq('statut', 'acquis'),
      sb.from('quiz_attempts').select('score, completed_at').eq('user_id', me.id).eq('type', 'post_validation').gte('score', 100),
    ]);

    const streak = streakRes.value?.data || { current_streak: 0, longest_streak: 0 };
    const validData = validRes.value?.data || [];
    const validated = validData.map(v => v.competence_id);
    const hasPerfectQuiz = (quizRes.value?.data?.length ?? 0) > 0;
    const c1ValidatedCount = validated.filter(c => c.startsWith('C1')).length;

    const ctx = {
      validatedCount: validated.length,
      longestStreak: streak.longest_streak || 0,
      hasPerfectQuiz,
      c1ValidatedCount,
    };

    const trophees = TROPHEES.map(t => ({ ...t, unlocked: t.check(ctx) }));
    const unlockedCount = trophees.filter(t => t.unlocked).length;

    root.innerHTML = render(trophees, unlockedCount);
    wire(root, trophees);
  } catch {
    root.innerHTML = `${STYLE}<div class="trp"><p style="padding:32px;color:#ef4444">Erreur de chargement des trophées.</p></div>`;
  }
}

// ─── Render ───────────────────────────────────────────────────────
function render(trophees, unlockedCount) {
  const unlocked = trophees.filter(t => t.unlocked);
  const locked = trophees.filter(t => !t.unlocked);

  return `${STYLE}
<div class="trp">
  <div class="trp-hd">
    <div>
      <div class="trp-title">Trophées</div>
    </div>
    <div class="trp-sub">${unlockedCount}/${trophees.length} débloqués</div>
  </div>

  ${unlocked.length > 0 ? `
    <div class="trp-section-hd">
      <span class="trp-section-title">Débloqués</span>
      <span class="trp-section-count">${unlocked.length}</span>
    </div>
    <div class="trp-grid">
      ${unlocked.map(t => renderCard(t, true)).join('')}
    </div>
  ` : ''}

  ${locked.length > 0 ? `
    <div class="trp-section-hd">
      <span class="trp-section-title">À débloquer</span>
    </div>
    <div class="trp-grid">
      ${locked.map(t => renderCard(t, false)).join('')}
    </div>
  ` : ''}

  <div class="trp-bg" id="trp-bg"></div>
  <div class="trp-sheet" id="trp-sheet">
    <div class="trp-sheet-handle"></div>
    <div class="trp-sheet-body" id="trp-sheet-body"></div>
  </div>
</div>`;
}

function renderCard(t, unlocked) {
  const rarityColor = RARITY_COLOR[t.rarity] || '#94a3b8';
  const isLegendary = t.rarity === 'légendaire' && unlocked;
  return `
<div class="trp-card ${unlocked ? 'unlocked' : 'trp-card-locked'} ${isLegendary ? 'legendary' : ''}"
     style="--tc:${t.color}"
     data-trp="${esc(t.id)}">
  <div class="trp-ico-wrap" style="background:color-mix(in srgb,${t.color} 14%,#fff)">
    ${t.ico}
  </div>
  <div class="trp-nom">${esc(t.nom)}</div>
  <span class="trp-rarity" style="color:${rarityColor};background:color-mix(in srgb,${rarityColor} 12%,#fff)">
    ${esc(RARITY_LABEL[t.rarity])}
  </span>
  ${!unlocked ? `<div class="trp-locked-lbl">${esc(t.desc.slice(0, 42))}…</div>` : ''}
</div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, trophees) {
  const bg = root.querySelector('#trp-bg');
  const sheet = root.querySelector('#trp-sheet');
  const body = root.querySelector('#trp-sheet-body');

  const close = () => { sheet.classList.remove('open'); bg.classList.remove('open'); };
  bg.addEventListener('click', close);

  root.querySelectorAll('.trp-card.unlocked').forEach(card => {
    card.addEventListener('click', () => {
      const t = trophees.find(x => x.id === card.dataset.trp);
      if (!t) return;
      track('trophy.tapped', { trophy_id: t.id });

      const rarityColor = RARITY_COLOR[t.rarity] || '#94a3b8';
      const canShare = Boolean(navigator.share);
      body.innerHTML = `
        <div class="trp-sheet-ico-wrap" style="background:color-mix(in srgb,${t.color} 14%,#fff)">
          <span style="font-size:38px">${t.ico}</span>
        </div>
        <div class="trp-sheet-nom">${esc(t.nom)}</div>
        <div class="trp-sheet-desc">${esc(t.desc)}</div>
        <div class="trp-sheet-meta">
          <span class="trp-sheet-tag" style="color:${rarityColor};background:color-mix(in srgb,${rarityColor} 12%,#fff)">
            ${esc(RARITY_LABEL[t.rarity])}
          </span>
          <span class="trp-sheet-tag" style="color:#10b981;background:rgba(16,185,129,.1)">✓ Débloqué</span>
        </div>
        <div class="trp-sheet-actions">
          <button class="trp-sheet-btn" id="trp-close-btn">Fermer</button>
          ${canShare ? `<button class="trp-sheet-btn primary" id="trp-share-btn">Partager 🔗</button>` : ''}
        </div>
      `;
      sheet.classList.add('open');
      bg.classList.add('open');

      body.querySelector('#trp-close-btn')?.addEventListener('click', close);
      body.querySelector('#trp-share-btn')?.addEventListener('click', async () => {
        try {
          await navigator.share({
            title: 'Trophée PermiGo débloqué !',
            text: `${t.ico} ${t.nom} — ${t.desc}`,
            url: location.href,
          });
          track('trophy.shared', { trophy_id: t.id });
        } catch { /* user cancelled */ }
      });
    });
  });
}
