// ═══════════════════════════════════════════════════════════════
// Emotional Banner — bannière in-app émotionnelle
//
// Apparaît en haut de l'accueil si une notif émotionnelle non-lue
// est disponible. Styles par tone, auto-dismiss après 12s.
//
// Usage :
//   import { emotionalBanner } from '@/components/emotional-banner.js';
//   await emotionalBanner.checkAndRender(root);
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';

// ─── Styles ──────────────────────────────────────────────────────
const STYLES = `
/* ── Banner container ── */
.eb-banner {
  position: relative;
  border-radius: 18px;
  padding: 14px 44px 14px 16px;
  margin-bottom: 12px;
  overflow: hidden;
  animation: ebSlideDown 320ms cubic-bezier(.32,.72,0,1) both;
}
@keyframes ebSlideDown {
  from { opacity:0; transform: translateY(-12px); }
  to   { opacity:1; transform: translateY(0); }
}
@media (prefers-reduced-motion:reduce) {
  .eb-banner { animation: none; opacity: 1; }
}

/* ── Tone variants ── */
.eb-warm {
  background: linear-gradient(135deg,#fff7ed,#ffedd5);
  border: 1.5px solid #fed7aa;
}
.eb-urgent {
  background: linear-gradient(135deg,#fef2f2,#fee2e2);
  border: 1.5px solid #fca5a5;
  animation: ebSlideDown 320ms cubic-bezier(.32,.72,0,1) both,
             ebPulse 2.4s ease-in-out 500ms infinite;
}
@keyframes ebPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,.18); }
  50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
}
.eb-celebrate {
  background: linear-gradient(135deg,#faf5ff,#f0abfc22);
  border: 1.5px solid #e9d5ff;
}
.eb-gentle {
  background: linear-gradient(135deg,#eff6ff,#dbeafe);
  border: 1.5px solid #bfdbfe;
}

/* ── Content ── */
.eb-title {
  font: 700 15px/1.3 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  margin-bottom: 3px;
}
.eb-body {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: #374151;
  margin-bottom: 10px;
}
.eb-cta {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 10px;
  font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
  border: 0;
  cursor: pointer;
  min-height: 36px;
  text-decoration: none;
  transition: transform 140ms cubic-bezier(.23,1,.32,1), opacity 140ms;
}
.eb-cta:active { transform: scale(.97); opacity: .9; }
@media (hover:hover) and (pointer:fine) { .eb-cta:hover { opacity: .88; } }

/* CTA color per tone */
.eb-warm     .eb-cta { background: #f97316; color: #fff; }
.eb-urgent   .eb-cta { background: #ef4444; color: #fff; }
.eb-celebrate .eb-cta { background: #7c3aed; color: #fff; }
.eb-gentle   .eb-cta { background: #3b82f6; color: #fff; }

/* ── Close button ── */
.eb-close {
  position: absolute;
  top: 10px; right: 10px;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,.06);
  border: 0;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #64748b;
  font-size: 14px;
  line-height: 1;
  transition: background .14s;
}
.eb-close:hover { background: rgba(0,0,0,.12); }

/* ── Progress bar (auto-dismiss countdown) ── */
.eb-progress {
  position: absolute;
  bottom: 0; left: 0;
  height: 2px;
  background: rgba(0,0,0,.12);
  border-radius: 0 0 18px 18px;
  animation: ebProgress 12s linear forwards;
}
@keyframes ebProgress {
  from { width: 100%; }
  to   { width: 0%; }
}
@media (prefers-reduced-motion:reduce) { .eb-progress { display: none; } }
`;

let _stylesInjected = false;
function ensureBannerStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const el = document.createElement('style');
  el.textContent = STYLES;
  document.head.appendChild(el);
}

async function markRead(notifId) {
  await sb.rpc('mark_notif_read', { p_notif_id: notifId }).catch(() => {});
}

function renderBanner(notif, content) {
  const tone = content.tone || 'gentle';
  return `
<div class="eb-banner eb-${esc(tone)}" role="alert" aria-live="polite" data-notif-id="${esc(notif.id)}">
  <div class="eb-title">${esc(content.title)}</div>
  <div class="eb-body">${esc(content.body)}</div>
  ${content.cta ? `<a class="eb-cta" href="${esc(content.route || '#')}" data-cta="1">${esc(content.cta)}</a>` : ''}
  <button class="eb-close" aria-label="Fermer" data-close="1">✕</button>
  <div class="eb-progress" aria-hidden="true"></div>
</div>`;
}

export const emotionalBanner = {
  async checkAndRender(root) {
    const me = getCurUser();
    if (!me) return;

    try {
      const { data, error } = await sb
        .from('notifications')
        .select('id, data')
        .eq('user_id', me.id)
        .eq('type', 'emotional_nudge')
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data?.length) return;
      const notif = data[0];

      // data est déjà pré-hydraté côté backend : { template_id, tone, title, body, cta, route }
      const content = notif.data;
      if (!content?.title || !content?.tone) return;

      ensureBannerStyles();

      // Inject au début du container .acc (ou dans root si .acc absent)
      const container = root.querySelector('.acc') || root;
      const div = document.createElement('div');
      div.innerHTML = renderBanner(notif, content);
      const el = div.firstElementChild;
      container.insertBefore(el, container.firstChild);

      track('emotional_banner.shown', { template_id: content.template_id, tone: content.tone });

      // Fermer + mark read
      const close = async () => {
        el.style.transition = 'opacity 200ms, transform 200ms';
        el.style.opacity = '0';
        el.style.transform = 'translateY(-8px)';
        setTimeout(() => el.remove(), 220);
        await markRead(notif.id);
      };

      // CTA click
      el.querySelector('[data-cta="1"]')?.addEventListener('click', () => {
        track('emotional_banner.cta_clicked', { template_id: content.template_id });
        close();
      });

      // Close button
      el.querySelector('[data-close="1"]')?.addEventListener('click', () => {
        track('emotional_banner.dismissed', { template_id: content.template_id });
        close();
      });

      // Auto-dismiss après 12s
      const autoDismiss = setTimeout(() => close(), 12_000);
      el.addEventListener('click', () => clearTimeout(autoDismiss), { once: true });

    } catch (e) {
      console.warn('[emotional-banner] checkAndRender failed', e?.message);
    }
  },
};
