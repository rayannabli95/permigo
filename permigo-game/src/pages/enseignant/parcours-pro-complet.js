// ═══════════════════════════════════════════════════════════════
// Enseignant — Tous les paliers (timeline complète)
// Accessible depuis parcours-pro.js via "Voir tous les paliers →"
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/toast.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { getMoniteurState, buildTimelineStops } from '@/data/moniteur-levels.js';
import { haptic } from '@/utils/haptic.js';
import { icon } from '@/utils/icons.js';

// ─── CSS ────────────────────────────────────────────────────────
const STYLE = `<style>
.epc-full {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 0 120px;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--ink);
}

/* Header sticky */
.epc-full-hd {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
  background: rgba(248,249,252,.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 12px 20px 10px;
  border-bottom: 1px solid var(--bo);
  display: flex;
  align-items: center;
  gap: 10px;
}
.epc-full-back {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--bg2);
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.epc-full-back:active { background: #e2e6f2; transform: scale(.93); }
.epc-full-hd-info { flex: 1; min-width: 0; }
.epc-full-h1 {
  font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -0.02em;
  margin: 0;
}
.epc-full-sub {
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  margin: 3px 0 0;
}

/* Progress pill */
.epc-full-pill {
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: #6366f1;
  background: rgba(99,102,241,.1);
  padding: 6px 10px;
  border-radius: 99px;
  flex-shrink: 0;
  white-space: nowrap;
}

/* Route card */
.epc-full-route {
  margin: 16px;
  padding: 20px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 24px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 2px 4px rgba(10,13,26,.06);
}

/* ── Stops timeline (mêmes règles que parcours.js) ── */
.epcf-stop {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 0;
  position: relative;
}
.epcf-stop:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 17px;
  top: 38px;
  bottom: -10px;
  width: 2px;
  background: #e2e8f0;
}
.epcf-stop.done:not(:last-child)::before { background: #10b981; }
.epcf-stop-dot {
  width: 36px; height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--su);
  border: 2.5px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  z-index: 1;
  color: var(--mu2);
  margin-top: 2px;
}
.epcf-stop.done .epcf-stop-dot {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
}
.epcf-stop.now .epcf-stop-dot {
  background: var(--su);
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99,102,241,.2);
  width: 44px; height: 44px;
  margin-left: -4px;
  margin-top: -2px;
}
.epcf-stop.locked .epcf-stop-dot { opacity: .5; }
.epcf-stop-body { flex: 1; min-width: 0; padding: 2px 0; }
.epcf-stop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.epcf-stop-lvl {
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  text-transform: uppercase;
  letter-spacing: .06em;
}
.epcf-stop.now .epcf-stop-lvl  { color: #6366f1; }
.epcf-stop.done .epcf-stop-lvl { color: #10b981; }
.epcf-stop-cost {
  font: 600 11px/1 'Inter', sans-serif;
  padding: 4px 8px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}
.epcf-stop-cost.done { color: #059669; background: rgba(16,185,129,.12); }
.epcf-stop-cost.now  { color: #fff; background: #6366f1; }
.epcf-stop-cost.todo { color: #64748b; background: var(--bg2); }
.epcf-stop-title {
  font: 600 14px/1.3 'Inter', sans-serif;
  color: var(--ink);
  margin-bottom: 6px;
}
.epcf-stop.locked .epcf-stop-title { color: #94a3b8; }
.epcf-stop.done  .epcf-stop-title  { color: #64748b; }
.epcf-stop-reward {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(99,102,241,.08);
  border: 1px solid rgba(99,102,241,.2);
  border-radius: 10px;
  color: #6366f1;
  margin-top: 4px;
}
.epcf-stop-reward.unlocked {
  background: rgba(16,185,129,.08);
  border-color: rgba(16,185,129,.2);
  color: #059669;
}
.epcf-stop-reward-ico { display: flex; align-items: center; flex-shrink: 0; }
.epcf-stop-skin-img {
  width: 22px; height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}
.epcf-stop-reward-txt {
  font: 500 12px/1.3 'Inter', sans-serif;
}
.epcf-stop-reward-txt strong { font-weight: 700; }

/* Tier locked (tiers 8-10 non débloqués) */
.epcf-stop.tier-locked .epcf-stop-dot,
.epcf-stop.tier-locked .epcf-stop-reward,
.epcf-stop.tier-locked .epcf-stop-title {
  filter: blur(4px) saturate(.5);
  opacity: .7;
}
.epcf-stop.tier-locked .epcf-stop-body::after {
  content: '🔒 Mystère';
  display: inline-block;
  font: 600 10px/1 'Inter', sans-serif;
  color: var(--mu2);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-top: 6px;
  background: rgba(148,163,184,.12);
  padding: 4px 8px;
  border-radius: 99px;
}

/* Cercle Or halo */
.epcf-stop.cercle-or.done .epcf-stop-dot {
  background: radial-gradient(circle, rgba(245,158,11,.3), transparent 70%);
  animation: epcfGoldHalo 2.4s ease-in-out infinite;
}
@keyframes epcfGoldHalo {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,.5); }
  50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
}

/* Skeleton */
.epcf-skel {
  background: linear-gradient(90deg, #f0f2f8 0%, #e4e8f4 50%, #f0f2f8 100%);
  background-size: 200% 100%;
  animation: epcfShim 1.4s ease-in-out infinite;
  border-radius: 20px;
}
@keyframes epcfShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .epcf-stop.cercle-or.done .epcf-stop-dot { animation: none !important; }
}
</style>`;

// ─── State ──────────────────────────────────────────────────────
let _root = null;

// ─── Entry point ────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  const me = getCurUser();
  if (!me || me.role !== 'enseignant') return;

  track('page.view', { page: 'enseignant_parcours_complet' });

  root.innerHTML = `${STYLE}
    <div class="epc-full">
      <div class="epc-full-hd">
        <button class="epc-full-back" aria-label="Retour au parcours" id="epcf-back">
          ${icon('arrow-left', { size: 18, strokeWidth: 2.5 })}
        </button>
        <div class="epc-full-hd-info">
          <h1 class="epc-full-h1">Tous les paliers</h1>
          <p class="epc-full-sub">Chargement…</p>
        </div>
      </div>
      <div class="epcf-skel" style="height:120px;margin:16px"></div>
      <div class="epcf-skel" style="height:200px;margin:16px"></div>
    </div>`;

  root.querySelector('#epcf-back')?.addEventListener('click', () => {
    haptic('select');
    navigate('#/parcours');
  });

  // ─── Fetch ──────────────────────────────────────────────────
  const { count, error } = await sb
    .from('validations')
    .select('id', { count: 'exact', head: true })
    .eq('validated_by', me.id);

  if (error) {
    toast('Impossible de charger le parcours', 'error');
    return;
  }

  const totalValidations = count ?? 0;
  const state = getMoniteurState(totalValidations);
  const stops = buildTimelineStops();

  const doneCount = stops.filter(s => totalValidations >= s.threshold).length;

  root.innerHTML = `${STYLE}
    <div class="epc-full anim-slide-up">

      <div class="epc-full-hd">
        <button class="epc-full-back" aria-label="Retour au parcours" id="epcf-back">
          ${icon('arrow-left', { size: 18, strokeWidth: 2.5 })}
        </button>
        <div class="epc-full-hd-info">
          <h1 class="epc-full-h1">Tous les paliers</h1>
          <p class="epc-full-sub">${esc(state.saison.name)} · ${totalValidations} validation${totalValidations > 1 ? 's' : ''}</p>
        </div>
        <div class="epc-full-pill">${doneCount}/${stops.length}</div>
      </div>

      <div class="epc-full-route">
        ${stops.map(s => renderStop(s, totalValidations)).join('')}
      </div>

    </div>`;

  // ─── Wire ───────────────────────────────────────────────────
  root.querySelector('#epcf-back')?.addEventListener('click', () => {
    haptic('select');
    navigate('#/parcours');
  });

  // Scroll vers le stop "now" si présent
  const nowStop = root.querySelector('.epcf-stop.now');
  if (nowStop) {
    setTimeout(() => nowStop.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
  }
}

// ─── Render helpers ─────────────────────────────────────────────

function renderStop(stop, totalValidations) {
  const isMajor = stop.kind === 'tier';
  const tierNum = isMajor ? stop.tier.tier : 0;

  let cls = totalValidations >= stop.threshold ? 'done' : 'todo';
  const tierLocked = isMajor && tierNum >= 8 && cls !== 'done';
  const isCercleOr = isMajor && tierNum === 10;

  const iconName = isMajor ? stop.tier.unlock.iconName : 'sparkle';

  // Dot content
  let dotContent;
  if (cls === 'done') {
    dotContent = isMajor
      ? icon('check', { size: 16, strokeWidth: 3 })
      : (stop.skin?.image
          ? `<img class="epcf-stop-skin-img" src="${esc(stop.skin.image)}" alt="" onerror="this.style.display='none'">`
          : icon('check', { size: 16, strokeWidth: 3 }));
  } else if (isMajor) {
    dotContent = icon(iconName, { size: 15, strokeWidth: 2 });
  } else {
    dotContent = `<span style="width:8px;height:8px;border-radius:50%;background:${esc(stop.skin?.accent || '#cbd5e1')}"></span>`;
  }

  // Cost badge
  const diff = stop.threshold - totalValidations;
  const costLine = cls === 'done'
    ? `<span class="epcf-stop-cost done">Atteint · ${stop.threshold} valid.</span>`
    : `<span class="epcf-stop-cost todo">+${diff} validation${diff > 1 ? 's' : ''}</span>`;

  // Reward line
  const rewardLine = isMajor ? `
    <div class="epcf-stop-reward ${cls === 'done' ? 'unlocked' : ''}">
      <span class="epcf-stop-reward-ico">${icon(iconName, { size: 14, strokeWidth: 2.4 })}</span>
      <span class="epcf-stop-reward-txt">
        ${cls === 'done' ? 'Débloqué : ' : 'Débloque : '}
        <strong>${esc(stop.tier.unlock.name)}</strong>
      </span>
    </div>
  ` : (stop.skin ? `
    <div class="epcf-stop-reward${cls === 'done' ? ' unlocked' : ''}" style="border-color:${esc(stop.skin.accent)}44;background:${esc(stop.skin.accent)}10;color:${esc(stop.skin.accent)}">
      ${stop.skin.image ? `<img class="epcf-stop-skin-img" src="${esc(stop.skin.image)}" alt="" onerror="this.style.display='none'">` : ''}
      <span class="epcf-stop-reward-txt">
        ${cls === 'done' ? 'Skin débloqué : ' : 'Skin : '}
        <strong>${esc(stop.skin.name)}</strong>
      </span>
    </div>
  ` : '');

  const classList = [
    'epcf-stop',
    cls,
    isMajor ? 'tier' : 'skin',
    tierLocked ? 'tier-locked' : '',
    isCercleOr ? 'cercle-or' : '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${classList}">
      <div class="epcf-stop-dot">${dotContent}</div>
      <div class="epcf-stop-body">
        <div class="epcf-stop-head">
          <span class="epcf-stop-lvl">${isMajor ? `Palier ${stop.tier.tier}` : `${stop.threshold} valid.`}</span>
          ${costLine}
        </div>
        ${isMajor ? `<div class="epcf-stop-title">${esc(stop.tier.title)}</div>` : ''}
        ${rewardLine}
      </div>
    </div>
  `;
}
