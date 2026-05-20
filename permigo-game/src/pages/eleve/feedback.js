// ═══════════════════════════════════════════════════════════════
// Élève — Fil des retours (page complète)
// Route : #/feedback
// Affiche tout le feed get_eleve_feedback_feed, pagination 30/30
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { icon } from '@/utils/icons.js';

const STYLE = `<style>
.fb-page {
  padding: 20px 16px 100px;
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', sans-serif;
}
.fb-hd {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 20px;
}
.fb-back {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--bo);
  background: var(--su);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #0a0d1a;
  font-size: 18px; line-height: 1;
  transition: border-color .12s, transform .12s;
  flex-shrink: 0;
}
.fb-back:active { transform: scale(.93); }
.fb-h1 {
  font: 700 22px/1.15 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -.02em;
  margin: 0;
  flex: 1;
}

/* Cards */
.fb-list { display: flex; flex-direction: column; gap: 6px; }
.fb-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 18px;
  padding: 14px;
  cursor: pointer;
  transition: border-color .12s, transform .12s;
  animation: fbCardIn .3s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes fbCardIn {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0); }
}
.fb-card:nth-child(n+6) { animation: none; }
@media (hover:hover) and (pointer:fine) { .fb-card:hover { border-color: rgba(99,102,241,.3); } }
.fb-card:active { transform: scale(.985); }

.fb-card-top { display: flex; align-items: center; gap: 10px; }
.fb-av {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff; flex-shrink: 0;
}
.fb-meta { flex: 1; min-width: 0; }
.fb-author { font: 600 13px/1.2 'Inter', sans-serif; color: #0a0d1a; }
.fb-time   { font: 500 11px/1 'Inter', sans-serif; color: #94a3b8; margin-top: 2px; }
.fb-badge  {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.fb-badge-session    { background: rgba(99,102,241,.1); color: #6366f1; }
.fb-badge-validation { background: rgba(16,185,129,.1); color: #059669; }

.fb-body { margin-top: 8px; }
.fb-event {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: #374151;
}
.fb-event strong { color: #0a0d1a; }
.fb-comment {
  font: italic 12px/1.5 'Inter', sans-serif;
  color: var(--mu);
  margin-top: 5px;
  padding-left: 8px;
  border-left: 2px solid #e2e6f2;
}

/* Expand */
.fb-card-extra {
  max-height: 0; overflow: hidden;
  transition: max-height .25s cubic-bezier(.23,1,.32,1);
}
.fb-card.fb-expanded .fb-card-extra { max-height: 160px; }
.fb-extra {
  padding-top: 8px; margin-top: 8px;
  border-top: 1px solid #f0f2f8;
  font: 500 12px/1.5 'Inter', sans-serif;
  color: var(--mu);
  display: flex; flex-direction: column; gap: 4px;
}
.fb-extra-row { display: flex; gap: 6px; align-items: center; }

/* Load more */
.fb-load-more {
  width: 100%; margin-top: 16px;
  padding: 14px;
  border: 1.5px solid var(--bo);
  border-radius: 14px;
  background: var(--su);
  font: 600 14px/1 'Plus Jakarta Sans', sans-serif;
  color: #6366f1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: border-color .12s, transform .12s;
}
.fb-load-more:active { transform: scale(.98); }
.fb-load-more:disabled { opacity: .5; cursor: not-allowed; }

/* Empty */
.fb-empty {
  text-align: center; padding: 40px 0;
  color: var(--mu2);
  font: 500 14px/1.6 'Inter', sans-serif;
}
.fb-empty-ico { font-size: 36px; margin-bottom: 12px; }

/* Skel */
.fb-skel-card {
  height: 80px; background: #fff;
  border: 1.5px solid var(--bo); border-radius: 18px;
  animation: fbPulse 1.4s ease-in-out infinite;
}
.fb-skel-card:nth-child(2) { animation-delay: .1s; }
.fb-skel-card:nth-child(3) { animation-delay: .2s; }
@keyframes fbPulse { 0%,100%{opacity:1} 50%{opacity:.5} }

@media (prefers-reduced-motion: reduce) {
  .fb-card, .fb-skel-card { animation: none; }
  .fb-card-extra { transition: none; }
}
</style>`;

// ─── Helpers ─────────────────────────────────────────────────
const GRADS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,#0891b2,#155e75)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
  'linear-gradient(135deg,#059669,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#dc2626,#7f1d1d)',
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
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtMin(m) {
  if (!m) return '';
  const h = Math.floor(m / 60), r = m % 60;
  return h === 0 ? `${r}min` : r === 0 ? `${h}h` : `${h}h${r}`;
}

function renderCard(evt) {
  const isSession = evt.kind === 'session';
  const nameKey   = `${evt.moniteur_prenom || ''}${evt.moniteur_nom || ''}`;
  const inits     = ((evt.moniteur_prenom || '')[0] || '') + ((evt.moniteur_nom || '')[0] || '');
  const badgeCls  = isSession ? 'fb-badge-session' : 'fb-badge-validation';
  const badgeIco  = isSession
    ? icon('clock',         { size: 14, strokeWidth: 2.2 })
    : icon('check-circle',  { size: 14, strokeWidth: 2.2 });
  const desc = isSession
    ? `<strong>${fmtMin(evt.duration_minutes)}</strong> de conduite avec toi`
    : `Compétence validée : <strong>${esc(evt.competence_id || '—')}</strong>`;

  const statusLine = isSession && evt.confirmation_status ? `
    <div class="fb-extra-row" style="color:${evt.confirmation_status === 'confirmed' ? '#059669' : '#94a3b8'}">
      ${evt.confirmation_status === 'confirmed' ? '✓ Confirmée' : evt.confirmation_status === 'refused' ? '✗ Refusée' : '⏳ En attente'}
    </div>` : '';

  return `
  <div class="fb-card" role="button" tabindex="0" aria-expanded="false">
    <div class="fb-card-top">
      <div class="fb-av" style="background:${gradFor(nameKey)}">${esc(inits.toUpperCase() || '?')}</div>
      <div class="fb-meta">
        <div class="fb-author">${esc(evt.moniteur_prenom || '')} ${esc(evt.moniteur_nom || '')}</div>
        <div class="fb-time">${relTime(evt.ts)}</div>
      </div>
      <div class="fb-badge ${badgeCls}">${badgeIco}</div>
    </div>
    <div class="fb-body">
      <div class="fb-event">${desc}</div>
      ${evt.comment ? `<div class="fb-comment">"${esc(evt.comment)}"</div>` : ''}
    </div>
    <div class="fb-card-extra">
      <div class="fb-extra">
        <div class="fb-extra-row">${icon('calendar', { size: 12, color: '#94a3b8', strokeWidth: 2 })} ${new Date(evt.ts).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        ${isSession ? `<div class="fb-extra-row">${icon('clock', { size: 12, color: '#94a3b8', strokeWidth: 2 })} ${fmtMin(evt.duration_minutes)}</div>` : ''}
        ${statusLine}
      </div>
    </div>
  </div>`;
}

const PAGE_SIZE = 30;

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page.view', { page: 'feedback', role: me.role });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="fb-page anim-slide-up">
      <div class="fb-hd">
        <button class="fb-back" aria-label="Retour" id="fb-back">←</button>
        <h1 class="fb-h1">Retours de tes moniteurs</h1>
      </div>
      <div class="fb-list">
        <div class="fb-skel-card"></div>
        <div class="fb-skel-card"></div>
        <div class="fb-skel-card"></div>
      </div>
    </div>
  `;

  root.querySelector('#fb-back')?.addEventListener('click', () => navigate('#/'));

  let offset = 0;
  let allEvents = [];

  async function loadMore() {
    const btn = root.querySelector('#fb-load-btn');
    if (btn) btn.disabled = true;

    try {
      const { data } = await sb.rpc('get_eleve_feedback_feed', {
        p_eleve_id: me.id,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      });
      const batch = data || [];
      allEvents = [...allEvents, ...batch];
      offset += batch.length;
      renderList(batch.length < PAGE_SIZE);
    } catch (e) {
      console.error('[feedback] load error', e);
      const lb = root.querySelector('#fb-load-btn');
      if (lb) { lb.disabled = false; return; }            // pagination : on garde l'existant
      const list = root.querySelector('.fb-list');         // 1er chargement : on tue le skeleton
      if (list) {
        list.innerHTML = `<div class="fb-empty"><div class="fb-empty-ico">📡</div>
          Impossible de charger tes retours.<br>
          <button class="fb-load-more" id="fb-retry" style="margin-top:12px">Réessayer</button></div>`;
        root.querySelector('#fb-retry')?.addEventListener('click', () => { offset = 0; allEvents = []; loadMore(); });
      }
    }
  }

  function renderList(noMore) {
    const page = root.querySelector('.fb-page');
    if (!page) return;

    if (allEvents.length === 0) {
      page.querySelector('.fb-list')?.remove();
      page.querySelector('#fb-load-btn')?.remove();
      if (!page.querySelector('.fb-empty')) {
        page.insertAdjacentHTML('beforeend', `
          <div class="fb-empty">
            <div class="fb-empty-ico">💬</div>
            Aucun retour encore — continue tes leçons !
          </div>
        `);
      }
      return;
    }

    let list = page.querySelector('.fb-list');
    if (!list) {
      list = document.createElement('div');
      list.className = 'fb-list';
      page.appendChild(list);
    }
    list.innerHTML = allEvents.map(renderCard).join('');

    // Remove old button
    page.querySelector('#fb-load-btn')?.remove();

    if (!noMore) {
      page.insertAdjacentHTML('beforeend', `
        <button class="fb-load-more" id="fb-load-btn">
          ${icon('refresh', { size: 15, strokeWidth: 2.2 })} Charger plus
        </button>
      `);
      page.querySelector('#fb-load-btn')?.addEventListener('click', loadMore);
    }

    // Wire expand
    list.querySelectorAll('.fb-card').forEach(card => {
      card.addEventListener('click', () => {
        const expanded = card.classList.toggle('fb-expanded');
        card.setAttribute('aria-expanded', expanded);
      });
    });
  }

  await loadMore();
}
