// ═══════════════════════════════════════════════════════════════
// Session Confirmation Banner — bannière accueil élève
// Affiche les sessions en attente de confirmation
// Usage : mountSessionConfirmation(root)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/common/toast.js';
import { track } from '@/services/analytics.js';
import { icon } from '@/utils/icons.js';

const STYLE_ID = 'session-confirm-style';

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  @keyframes scbSlideIn {
    from { opacity:0; transform:translateY(-10px) scale(.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes scbFadeOut {
    from { opacity:1; transform:scale(1); max-height:200px; margin-bottom:12px; }
    to   { opacity:0; transform:scale(.97); max-height:0;   margin-bottom:0; }
  }

  .scb-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  .scb-card {
    background: #fff;
    border: 1.5px solid rgba(99,102,241,.25);
    border-radius: 20px;
    padding: 14px 16px;
    box-shadow: 0 2px 12px -4px rgba(99,102,241,.2), 0 1px 3px rgba(10,13,26,.06);
    animation: scbSlideIn .3s cubic-bezier(.34,1.56,.64,1) both;
    overflow: hidden;
  }
  .scb-card:nth-child(2) { animation-delay: .06s; }
  .scb-card:nth-child(3) { animation-delay: .12s; }
  .scb-card.scb-removing {
    animation: scbFadeOut .22s cubic-bezier(.23,1,.32,1) forwards;
    pointer-events: none;
  }
  .scb-top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
  }
  .scb-icon-wrap {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(99,102,241,.1);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #6366f1;
  }
  .scb-info { flex: 1; }
  .scb-title {
    font: 600 14px/1.3 'Inter', sans-serif;
    color: #0a0d1a;
    margin: 0 0 3px;
  }
  .scb-meta {
    font: 500 12px/1 'Inter', sans-serif;
    color: #64748b;
  }
  .scb-btns {
    display: flex;
    gap: 8px;
  }
  .scb-btn {
    flex: 1;
    padding: 10px 12px;
    border-radius: 12px;
    border: none;
    font: 600 13px/1 'Inter', sans-serif;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    min-height: 44px;
    transition: opacity .12s, transform .12s;
  }
  .scb-btn:active { transform: scale(.97); opacity: .85; }
  .scb-btn-yes {
    background: rgba(16,185,129,.1);
    color: #059669;
    border: 1px solid rgba(16,185,129,.2);
  }
  .scb-btn-no {
    background: rgba(239,68,68,.07);
    color: #dc2626;
    border: 1px solid rgba(239,68,68,.15);
  }
  .scb-btn:disabled { opacity:.5; cursor:not-allowed; }

  @media (prefers-reduced-motion: reduce) {
    .scb-card { animation: none; }
  }
  `;
  document.head.appendChild(s);
}

// ─── Format date lisible ──────────────────────────────────────
function readableSessionDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T12:00:00');
  const today = new Date();
  const diff = Math.floor((today.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  if (diff === 2) return 'avant-hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Format durée ─────────────────────────────────────────────
function readableDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

/**
 * Charge les sessions en attente et injecte les cartes de confirmation
 * avant `anchorEl` dans `root`. Si aucune session, ne fait rien.
 */
export async function mountSessionConfirmation(root, anchorEl) {
  ensureStyle();

  let sessions = [];
  try {
    const { data } = await sb.rpc('get_my_pending_sessions');
    sessions = data || [];
  } catch (e) {
    console.error('[session-confirm] fetch error', e);
    return;
  }

  if (sessions.length === 0) return;

  track('session_confirmation.shown', { count: sessions.length });

  const wrap = document.createElement('div');
  wrap.className = 'scb-wrap';
  wrap.id = 'scb-wrap';

  wrap.innerHTML = sessions.map(s => `
    <div class="scb-card" data-session-id="${esc(s.id)}">
      <div class="scb-top">
        <div class="scb-icon-wrap">
          ${icon('car', { size: 18, strokeWidth: 2 })}
        </div>
        <div class="scb-info">
          <p class="scb-title">${esc(s.moniteur_prenom)} a déclaré <strong>${esc(readableDuration(s.duration_minutes))}</strong> de conduite avec toi</p>
          <p class="scb-meta">${esc(readableSessionDate(s.session_date))}</p>
        </div>
      </div>
      <div class="scb-btns">
        <button class="scb-btn scb-btn-yes" data-action="confirmed" data-session-id="${esc(s.id)}" aria-label="Confirmer cette session">
          ${icon('check', { size: 14, strokeWidth: 2.8 })} Oui, c'est juste
        </button>
        <button class="scb-btn scb-btn-no" data-action="refused" data-session-id="${esc(s.id)}" aria-label="Refuser cette session">
          ${icon('x', { size: 14, strokeWidth: 2.8 })} Non
        </button>
      </div>
    </div>
  `).join('');

  // Injecter avant l'ancre (ou en tête du root si pas d'ancre)
  if (anchorEl && anchorEl.parentNode === root) {
    root.insertBefore(wrap, anchorEl);
  } else {
    root.prepend(wrap);
  }

  // Wire boutons
  wrap.querySelectorAll('.scb-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sessionId = btn.dataset.sessionId;
      const action    = btn.dataset.action; // 'confirmed' | 'refused'
      const card      = wrap.querySelector(`.scb-card[data-session-id="${sessionId}"]`);

      // Désactive les 2 boutons de cette carte
      card?.querySelectorAll('.scb-btn').forEach(b => { b.disabled = true; });

      try {
        const { data: cfData, error: cfErr } = await sb.rpc('confirm_session', { p_session_id: sessionId, p_status: action });
        if (cfErr || cfData?.error) throw (cfErr || new Error(cfData.error));
        track('session_confirmation.responded', { action });

        if (action === 'confirmed') {
          toast('Session confirmée ✓', 'success');
        } else {
          toast('Session signalée', 'info');
        }

        // Retire la carte avec animation
        card?.classList.add('scb-removing');
        card?.addEventListener('animationend', () => {
          card.remove();
          if (wrap.children.length === 0) wrap.remove();
        }, { once: true });

      } catch (e) {
        console.error('[session-confirm] confirm error', e);
        toast('Erreur — réessaie', 'error');
        card?.querySelectorAll('.scb-btn').forEach(b => { b.disabled = false; });
      }
    });
  });
}
