// ═══════════════════════════════════════════════════════════════
// Daily Quests — quêtes du jour élève
// RPC : get_today_quests() → [{ id, title, category, xp_reward, gem_reward, progress, target, completed }]
// RPC : claim_quest({ p_quest_id }) → { xp_gained, gem_gained }
// Usage : mountDailyQuests(root) — inject avant .streak-pro
// ═══════════════════════════════════════════════════════════════
import { sb }    from '@/auth/auth.js';
import { esc }   from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { icon }  from '@/utils/icons.js';
import { toast } from '@/components/common/toast.js';
import { playStar } from '@/utils/sound.js';

const STYLE_ID = 'daily-quests-style';

const CAT_CFG = {
  quiz:       { ico: 'brain',   color: 'var(--a)' },
  streak:     { ico: 'flame',   color: 'var(--or)' },
  competence: { ico: 'award',   color: 'var(--gr2)' },
  session:    { ico: 'map-pin', color: 'var(--blk)' },
  default:    { ico: 'zap',     color: 'var(--a)' },
};

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  .dq-section { margin-bottom: 12px; }
  .dq-hd {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px; padding: 0 2px;
  }
  .dq-title {
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); letter-spacing: -.01em;
    display: flex; align-items: center; gap: 6px;
  }
  .dq-count {
    font: 700 11px/1 'Inter', sans-serif;
    color: var(--a); background: rgba(88,204,2,.1);
    border-radius: 99px; padding: 2px 8px;
  }
  .dq-scroll {
    display: flex; gap: 10px;
    overflow-x: auto; padding-bottom: 4px;
    scrollbar-width: none; -webkit-overflow-scrolling: touch;
  }
  .dq-scroll::-webkit-scrollbar { display: none; }

  .dq-card {
    flex-shrink: 0; width: 156px;
    background: #fff; border: 1.5px solid var(--bo);
    border-radius: 16px; padding: 14px 14px 12px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform .15s cubic-bezier(.23,1,.32,1), border-color .15s;
    animation: dqCardIn .32s cubic-bezier(.34,1.56,.64,1) both;
    -webkit-tap-highlight-color: transparent;
  }
  .dq-card:nth-child(2) { animation-delay: .05s; }
  .dq-card:nth-child(3) { animation-delay: .10s; }
  @keyframes dqCardIn {
    from { opacity:0; transform:translateY(10px) scale(.96); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
  }
  @media (hover:hover) and (pointer:fine) {
    .dq-card--ready:hover { border-color: rgba(88,204,2,.4); }
  }
  .dq-card:active { transform: scale(.97); }
  .dq-card--ready {
    border-color: rgba(88,204,2,.3);
    background: linear-gradient(145deg, rgba(88,204,2,.06), rgba(88,204,2,.03));
  }
  .dq-card--claimed {
    border-color: rgba(16,185,129,.22);
    background: linear-gradient(145deg, rgba(16,185,129,.05), rgba(5,150,105,.03));
    pointer-events: none; cursor: default;
  }
  .dq-card--pending { cursor: default; }

  .dq-badge {
    position: absolute; top: 10px; right: 10px;
    font: 600 9px/1 'Plus Jakarta Sans', sans-serif;
    padding: 3px 7px; border-radius: 99px; letter-spacing: .03em;
  }
  .dq-badge--claim { background: var(--puk); color: #fff; }
  .dq-badge--done  {
    background: var(--gr); color: #fff;
    display: flex; align-items: center; gap: 3px;
  }

  .dq-ico {
    width: 32px; height: 32px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
  }
  .dq-name {
    font: 600 12px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .dq-track {
    height: 4px; background: var(--bo);
    border-radius: 2px; overflow: hidden; margin: 8px 0 6px;
  }
  .dq-fill { height: 100%; border-radius: 2px; transition: width .4s ease; }
  .dq-foot { display: flex; align-items: center; justify-content: space-between; }
  .dq-prog { font: 500 10px/1 'IBM Plex Mono', monospace; color: var(--mu2); }
  .dq-reward { font: 600 10px/1 'Inter', sans-serif; color: var(--a); }
  .dq-card--ready .dq-reward { color: var(--puk); }

  /* XP popup */
  .dq-xp-pop {
    position: fixed; pointer-events: none; z-index: 9999;
    font: 800 15px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--puk); text-shadow: 0 1px 8px rgba(124,58,237,.35);
    animation: dqXpPop .75s cubic-bezier(.23,1,.32,1) forwards;
    white-space: nowrap; transform: translateX(-50%);
  }
  @keyframes dqXpPop {
    0%   { opacity:0; transform:translateX(-50%) translateY(0)   scale(.85); }
    25%  { opacity:1; transform:translateX(-50%) translateY(-16px) scale(1); }
    80%  { opacity:1; transform:translateX(-50%) translateY(-28px) scale(1); }
    100% { opacity:0; transform:translateX(-50%) translateY(-38px) scale(.9); }
  }
  @media (prefers-reduced-motion: reduce) {
    .dq-card { animation: none; }
    .dq-xp-pop { animation: none; opacity: 0; }
  }
  `;
  document.head.appendChild(s);
}

export async function mountDailyQuests(root) {
  let quests = [];
  try {
    const { data, error } = await sb.rpc('get_today_quests');
    if (error || data?.error) return;
    quests = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[daily-quests] fetch error', e);
    return;
  }

  // Hide section if every quest is already claimed (réclamée, pas juste complétée)
  if (quests.length === 0 || quests.every(q => q.claimed)) return;

  ensureStyle();
  track('daily_quests.shown', { count: quests.length });

  const section = document.createElement('div');
  section.className = 'dq-section';
  section.innerHTML = renderSection(quests);

  // Inject avant .streak-pro
  const streakEl = root.querySelector('.streak-pro') || root.querySelector('#streak-card');
  if (streakEl) streakEl.parentNode.insertBefore(section, streakEl);
  else root.appendChild(section);

  // Wire "ready" cards only
  section.querySelectorAll('.dq-card--ready').forEach(card => {
    const questId = card.dataset.questId;
    const quest   = quests.find(q => q.id === questId);
    if (!quest) return;

    const handler = async () => {
      if (card.dataset.claiming) return;
      card.dataset.claiming = '1';

      try {
        const { data, error } = await sb.rpc('claim_quest', { p_quest_id: questId });
        if (error || data?.error) {
          toast('Quête introuvable', 'error');
          delete card.dataset.claiming;
          return;
        }

        const xpGained  = data?.xp_gained  ?? quest.xp_reward  ?? 0;
        const gemGained = data?.gem_gained ?? quest.gem_reward ?? 0;
        playStar();
        track('daily_quests.claimed', { quest_id: questId, xp: xpGained, gems: gemGained });

        // Popup XP
        const rect = card.getBoundingClientRect();
        const pop  = document.createElement('div');
        pop.className = 'dq-xp-pop';
        pop.textContent = `+${xpGained} XP${gemGained > 0 ? ` · +${gemGained} 💎` : ''}`;
        pop.style.cssText = `left:${rect.left + rect.width / 2}px;top:${rect.top}px`;
        document.body.appendChild(pop);
        setTimeout(() => pop.remove(), 800);

        // Fade out card
        card.style.transition = 'opacity .28s ease, transform .28s ease';
        card.style.opacity    = '0';
        card.style.transform  = 'scale(.92)';
        setTimeout(() => {
          card.remove();
          // Remove section when no more visible cards
          if (!section.querySelector('.dq-card')) section.remove();
        }, 300);

      } catch (e) {
        console.warn('[daily-quests] claim error', e);
        delete card.dataset.claiming;
      }
    };

    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
  });
}

function renderSection(quests) {
  const readyCount = quests.filter(q => q.completed && !q.claimed).length;
  return `
    <div class="dq-hd">
      <div class="dq-title">
        ${icon('zap', { size: 14, strokeWidth: 2.2, color: 'var(--a)' })}
        Quêtes du jour
      </div>
      ${readyCount > 0 ? `<span class="dq-count">${readyCount} à réclamer</span>` : ''}
    </div>
    <div class="dq-scroll">
      ${quests.map(renderCard).join('')}
    </div>
  `;
}

function renderCard(q) {
  const pct   = q.target > 0 ? Math.min(100, Math.round((q.progress / q.target) * 100)) : 0;
  const ready = q.completed && !q.claimed;   // objectif atteint → récompense à réclamer
  const done  = q.claimed;                   // récompense déjà réclamée

  const cat      = CAT_CFG[q.category] || CAT_CFG.default;
  const fillClr  = done ? 'var(--gr)' : ready ? 'var(--puk)' : 'var(--a)';
  const stCls    = done ? 'dq-card--claimed' : ready ? 'dq-card--ready' : 'dq-card--pending';

  const badge = done
    ? `<span class="dq-badge dq-badge--done">${icon('check', { size: 9, strokeWidth: 3 })} Fait</span>`
    : ready
    ? `<span class="dq-badge dq-badge--claim">Réclamer</span>`
    : '';

  const reward = q.xp_reward > 0
    ? `+${q.xp_reward} XP${q.gem_reward > 0 ? ` · +${q.gem_reward} 💎` : ''}`
    : q.gem_reward > 0 ? `+${q.gem_reward} 💎` : '';

  return `
    <div class="dq-card ${stCls}" data-quest-id="${esc(String(q.id))}"
         role="${ready ? 'button' : 'article'}" tabindex="${ready ? '0' : '-1'}"
         aria-label="${esc(q.title)}">
      ${badge}
      <div class="dq-ico" style="background:${cat.color}18">
        ${icon(cat.ico, { size: 16, strokeWidth: 2.2, color: cat.color })}
      </div>
      <div class="dq-name">${esc(q.title)}</div>
      <div class="dq-track">
        <div class="dq-fill" style="width:${pct}%;background:${fillClr}"></div>
      </div>
      <div class="dq-foot">
        <span class="dq-prog">${q.progress}/${q.target}</span>
        <span class="dq-reward">${reward}</span>
      </div>
    </div>
  `;
}
