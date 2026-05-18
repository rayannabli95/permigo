// ═══════════════════════════════════════════════════════════════
// Élève — Trophées (light theme)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { TROPHEES, RARITY_LABEL, RARITY_COLOR } from '@/data/trophees.js';
import { renderEmptyState } from '@/components/empty-state.js';

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
.trp-sub   { font: 600 12px/1 'Inter', sans-serif; color: #64748b; }

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
  border-color: color-mix(in srgb, var(--tc) 45%, transparent);
  background: color-mix(in srgb, var(--tc) 8%, #fff);
  box-shadow:
    0 1px 4px rgba(11,13,26,.05),
    0 0 0 0 color-mix(in srgb, var(--tc) 50%, transparent);
  animation: trpHaloPulse 2.6s ease-in-out infinite;
}
@keyframes trpHaloPulse {
  0%, 100% {
    box-shadow:
      0 1px 4px rgba(11,13,26,.05),
      0 0 0 0 color-mix(in srgb, var(--tc) 35%, transparent);
  }
  50% {
    box-shadow:
      0 4px 16px color-mix(in srgb, var(--tc) 22%, transparent),
      0 0 0 4px color-mix(in srgb, var(--tc) 12%, transparent);
  }
}
.trp-card.unlocked::after {
  content: '';
  position: absolute;
  top: -60%; left: -60%;
  width: 220%; height: 220%;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.75) 50%, transparent 65%);
  animation: shimTrophy 2.8s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}
@keyframes shimTrophy {
  0%   { transform: translateX(-100%) rotate(15deg); }
  60%, 100% { transform: translateX(100%) rotate(15deg); }
}
/* Icône qui flotte subtilement sur unlocked */
.trp-card.unlocked .trp-ico-wrap {
  animation: trpIcoFloat 3.2s ease-in-out infinite;
  box-shadow: 0 0 18px color-mix(in srgb, var(--tc) 30%, transparent);
}
@keyframes trpIcoFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}
/* Légendaire — bordure or animée + sparkles */
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
.trp-card.legendary .trp-ico-wrap {
  box-shadow:
    0 0 24px rgba(245,158,11,.55),
    inset 0 0 12px rgba(254,243,199,.4);
  animation: trpIcoFloat 3.2s ease-in-out infinite, trpGoldGlow 2s ease-in-out infinite alternate;
}
@keyframes trpGoldGlow {
  from { filter: brightness(1) drop-shadow(0 0 4px rgba(245,158,11,.5)); }
  to   { filter: brightness(1.15) drop-shadow(0 0 10px rgba(245,158,11,.8)); }
}
@keyframes goldSpin {
  to { --angle: 360deg; }
}
@property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .trp-card.unlocked,
  .trp-card.unlocked::after,
  .trp-card.unlocked .trp-ico-wrap,
  .trp-card.legendary::before,
  .trp-card.legendary .trp-ico-wrap {
    animation: none !important;
  }
}

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
  width: 64px; height: 64px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--tc,#94a3b8) 14%, #fff);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 10px;
  font-size: 30px;
  line-height: 1;
  position: relative;
  z-index: 1;
  overflow: hidden;
}
.trp-ico-wrap img {
  width: 100%; height: 100%;
  object-fit: contain;
  display: block;
}
.trp-nom {
  font: 700 11px/1.3 'Plus Jakarta Sans', sans-serif;
  color: #0b0d1a;
  margin-bottom: 6px;
}
.trp-rarity {
  font: 700 9px/1 'Inter', sans-serif;
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
  font: 700 13px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #64748b;
}
.trp-section-count {
  font: 700 12px/1 'Inter', sans-serif;
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
  font: 700 11px/1 'Inter', sans-serif;
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
    // Trophée "Pilote de Nuit" : au moins une validation après 21h locale
    const hasNightValidation = validData.some(v => {
      if (!v.validated_at) return false;
      const h = new Date(v.validated_at).getHours();
      return h >= 21 || h < 6;
    });

    const ctx = {
      validatedCount: validated.length,
      longestStreak: streak.longest_streak || 0,
      hasPerfectQuiz,
      c1ValidatedCount,
      hasNightValidation,
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
  ` : renderEmptyState({
    illustration: '/skins/empty-trophies.png',
    title: 'Aucun trophée encore',
    subtitle: 'Valide toutes les compétences d\'un monde pour débloquer ton premier trophée.',
    ctaLabel: 'Valide ta première compétence',
    ctaHref: '#/parcours',
  })}

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
  // Visuel : image PNG premium si dispo, sinon emoji fallback
  const visual = t.image
    ? `<img src="${t.image}" alt="${esc(t.nom)}" loading="lazy" />`
    : t.ico;
  return `
<div class="trp-card ${unlocked ? 'unlocked' : 'trp-card-locked'} ${isLegendary ? 'legendary' : ''}"
     style="--tc:${t.color}"
     data-trp="${esc(t.id)}">
  <div class="trp-ico-wrap" style="background:color-mix(in srgb,${t.color} 14%,#fff)">
    ${visual}
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
      const sheetVisual = t.image
        ? `<img src="${t.image}" alt="${esc(t.nom)}" style="width:100%;height:100%;object-fit:contain" />`
        : `<span style="font-size:38px">${t.ico}</span>`;
      body.innerHTML = `
        <div class="trp-sheet-ico-wrap" style="background:color-mix(in srgb,${t.color} 14%,#fff);overflow:hidden">
          ${sheetVisual}
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
