// ═══════════════════════════════════════════════════════════════
// Feedback Feed — section "Retours de tes moniteurs"
// Usage : mountFeedbackFeed(root, { eleveId, limit, anchorEl })
//   Injecte avant `anchorEl` (ou en dernier dans root si absent)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { icon } from '@/utils/icons.js';
import { navigate } from '@/router.js';
import { findSubComp } from '@/data/remc.js';

// "C2f" → "Intersections, ronds-points" (fallback : code brut)
function compLabel(compId) {
  const sub = findSubComp(compId);
  return sub ? sub.n : (compId || '—');
}

const STYLE_ID = 'feedback-feed-style';

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  @keyframes ffCardIn {
    from { opacity:0; transform:translateY(8px) scale(.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  .ff-section { margin-bottom: 20px; }

  .ff-sec-hd {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .ff-sec-title {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--mu2);
    display: flex; align-items: center; gap: 8px;
  }
  .ff-sec-title::after {
    content: ''; display: inline-block;
    width: 32px; height: 1px;
    background: var(--bo);
    vertical-align: middle;
  }
  .ff-see-all {
    font: 600 12px/1 'Inter', sans-serif;
    color: var(--a);
    background: none; border: none;
    cursor: pointer; padding: 4px 0;
    display: flex; align-items: center; gap: 4px;
    transition: opacity .12s;
    white-space: nowrap;
  }
  .ff-see-all:active { opacity: .7; }

  .ff-list { display: flex; flex-direction: column; gap: 6px; }

  .ff-card {
    background: #fff;
    border: 1.5px solid var(--bo);
    border-radius: 18px;
    padding: 12px 14px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.05);
    cursor: pointer;
    transition: border-color .12s, transform .12s;
    animation: ffCardIn .3s cubic-bezier(.34,1.56,.64,1) both;
    overflow: hidden;
  }
  .ff-card:nth-child(2) { animation-delay:.04s; }
  .ff-card:nth-child(3) { animation-delay:.08s; }
  .ff-card:nth-child(4) { animation-delay:.12s; }
  .ff-card:nth-child(5) { animation-delay:.16s; }
  @media (hover:hover) and (pointer:fine) {
    .ff-card:hover { border-color: rgba(88,204,2,.3); }
  }
  .ff-card:active { transform: scale(.985); }

  .ff-card-top {
    display: flex; align-items: center; gap: 10px;
  }
  .ff-av {
    width: 34px; height: 34px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .ff-meta { flex: 1; min-width: 0; }
  .ff-author {
    font: 600 13px/1.2 'Inter', sans-serif;
    color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ff-time {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 2px;
  }
  .ff-kind-badge {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ff-kind-session  { background: rgba(88,204,2,.1); color: var(--a); }
  .ff-kind-validation { background: rgba(16,185,129,.1); color: var(--grd); }

  .ff-card-body { margin-top: 8px; }
  .ff-event-line {
    font: 500 13px/1.4 'Inter', sans-serif;
    color: var(--ink5);
  }
  .ff-event-line strong { color: var(--ink); }
  .ff-comment {
    font: 400 italic 12px/1.5 'Inter', sans-serif;
    color: var(--mu3);
    margin-top: 5px;
    padding-left: 8px;
    border-left: 2px solid var(--bo);
  }

  /* Expand state */
  .ff-card-extra {
    max-height: 0;
    overflow: hidden;
    transition: max-height .25s cubic-bezier(.23,1,.32,1);
  }
  .ff-card.ff-expanded .ff-card-extra { max-height: 200px; }
  .ff-extra-content {
    padding-top: 8px;
    font: 500 12px/1.5 'Inter', sans-serif;
    color: var(--mu3);
    border-top: 1px solid var(--bg3);
    margin-top: 8px;
  }
  .ff-extra-row { display: flex; gap: 6px; align-items: center; margin-bottom: 3px; }

  @media (prefers-reduced-motion: reduce) {
    .ff-card { animation: none; }
    .ff-card-extra { transition: none; }
  }
  `;
  document.head.appendChild(s);
}

// ─── Helpers ─────────────────────────────────────────────────
const GRADS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,var(--blk),#155e75)',
  'linear-gradient(135deg,var(--puk),#4c1d95)',
  'linear-gradient(135deg,var(--grd),#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,var(--rdk),#7f1d1d)',
];
function gradFor(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}
function relTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `il y a ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'hier';
  if (d < 7) return `il y a ${d}j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function fmtDuration(min) {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

// ─── Render une carte event ───────────────────────────────────
function renderCard(evt, idx) {
  const isSession    = evt.kind === 'session';
  const prenom       = esc(evt.moniteur_prenom || 'Moniteur');
  const nom          = esc(evt.moniteur_nom   || '');
  const nameKey      = `${evt.moniteur_prenom || ''}${evt.moniteur_nom || ''}`;
  const initials     = ((evt.moniteur_prenom || '')[0] || '') + ((evt.moniteur_nom || '')[0] || '');
  const badgeCls     = isSession ? 'ff-kind-session' : 'ff-kind-validation';
  const badgeIcon    = isSession
    ? icon('clock', { size: 14, strokeWidth: 2.2 })
    : icon('check-circle', { size: 14, strokeWidth: 2.2 });

  const eventLine = isSession
    ? `<strong>${fmtDuration(evt.duration_minutes)}</strong> de conduite avec toi`
    : `A validé : <strong>${esc(compLabel(evt.competence_id))}</strong>`;

  const statusBit = isSession && evt.confirmation_status
    ? `<span style="font-size:10px;color:${evt.confirmation_status === 'confirmed' ? 'var(--grd)' : 'var(--mu2)'}">
        ${evt.confirmation_status === 'confirmed' ? '✓ confirmée' : evt.confirmation_status === 'refused' ? '✗ refusée' : 'en attente'}
       </span>`
    : '';

  return `
  <div class="ff-card" data-idx="${idx}" role="button" tabindex="0" aria-expanded="false">
    <div class="ff-card-top">
      <div class="ff-av" style="background:${gradFor(nameKey)}">${esc(initials.toUpperCase() || '?')}</div>
      <div class="ff-meta">
        <div class="ff-author">${prenom} ${nom}</div>
        <div class="ff-time">${relTime(evt.ts)}</div>
      </div>
      <div class="ff-kind-badge ${badgeCls}">${badgeIcon}</div>
    </div>
    <div class="ff-card-body">
      <div class="ff-event-line">${eventLine} ${statusBit}</div>
      ${evt.comment ? `<div class="ff-comment">"${esc(evt.comment)}"</div>` : ''}
    </div>
    <div class="ff-card-extra">
      <div class="ff-extra-content">
        <div class="ff-extra-row">${icon('calendar', { size: 12, color: 'var(--mu2)', strokeWidth: 2 })} ${new Date(evt.ts).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        ${isSession ? `<div class="ff-extra-row">${icon('clock', { size: 12, color: 'var(--mu2)', strokeWidth: 2 })} Durée : ${fmtDuration(evt.duration_minutes)}</div>` : ''}
        ${!isSession && evt.comment ? '' : ''}
      </div>
    </div>
  </div>`;
}

/**
 * Monte le feed "Retours de tes moniteurs" dans root.
 * @param {HTMLElement} root — container parent
 * @param {{ eleveId: string, limit?: number, anchorEl?: Element }} opts
 */
export async function mountFeedbackFeed(root, { eleveId, limit = 5, anchorEl } = {}) {
  ensureStyle();

  let events = [];
  try {
    const { data } = await sb.rpc('get_eleve_feedback_feed', {
      p_eleve_id: eleveId || null,
      p_limit: limit,
    });
    events = data || [];
  } catch (e) {
    console.error('[feedback-feed] fetch error', e);
    return;
  }

  if (events.length === 0) return;

  track('feedback_feed.shown', { count: events.length, eleve_id: eleveId });

  const wrap = document.createElement('div');
  wrap.className = 'ff-section';
  wrap.id = 'ff-section';
  wrap.innerHTML = `
    <div class="ff-sec-hd">
      <div class="ff-sec-title">Retours de tes moniteurs</div>
      <button class="ff-see-all" id="ff-see-all" aria-label="Voir tout le fil">
        Tout voir ${icon('chevron-right', { size: 13, strokeWidth: 2.5 })}
      </button>
    </div>
    <div class="ff-list" id="ff-list">
      ${events.map((e, i) => renderCard(e, i)).join('')}
    </div>
  `;

  // Injecter avant ancre (ou avant le footer dans .acc)
  if (anchorEl && anchorEl.parentNode === root) {
    root.insertBefore(wrap, anchorEl);
  } else {
    const footer = root.querySelector('.acc-footer');
    if (footer) root.insertBefore(wrap, footer);
    else root.appendChild(wrap);
  }

  // Wire expand on tap
  wrap.querySelectorAll('.ff-card').forEach(card => {
    card.addEventListener('click', () => {
      const expanded = card.classList.toggle('ff-expanded');
      card.setAttribute('aria-expanded', expanded);
      track('feedback_feed.card_expanded', { idx: card.dataset.idx });
    });
  });

  // Wire "Voir tout"
  wrap.querySelector('#ff-see-all')?.addEventListener('click', () => {
    track('feedback_feed.see_all_clicked');
    navigate('#/feedback');
  });
}
