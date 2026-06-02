// ═══════════════════════════════════════════════════════════════
// Classement élève — opt-in pseudo, scope école / national, anonymisé.
// Aucun nom complet d'élève n'est jamais exposé : pseudo ou « Apprenti #XXXX ».
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { playPop, playClick } from '@/utils/sound.js';
import { haptic } from '@/utils/haptic.js';

const LIMIT = 50;
const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const STYLE = `<style>
.clt {
  padding: 0 0 calc(72px + env(safe-area-inset-bottom, 0px));
  max-width: 480px; margin: 0 auto;
  color: var(--ink); font-family: 'Inter', sans-serif; background: var(--bg);
}
.clt-hd {
  position: sticky; top: 0; z-index: 10;
  background: var(--bg);
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 16px 12px;
  border-bottom: 1px solid var(--bo2);
}
.clt-title { font: 800 22px/1.1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.022em; margin: 0 0 10px; }
.clt-mepill {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.25);
  color: #6366f1; border-radius: 99px; padding: 7px 14px;
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
}
.clt-mepill-ico { font-size: 15px; }
/* Onglets */
.clt-tabs { display: flex; gap: 8px; margin-top: 12px; }
.clt-tab {
  flex: 1; min-height: 40px; padding: 10px;
  background: var(--su); border: 1px solid var(--bo); border-radius: 12px;
  color: var(--mu2); font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; transition: background .15s, color .15s, border-color .15s;
}
.clt-tab.on { background: #6366f1; border-color: #6366f1; color: #fff; }
.clt-tab:active { transform: scale(.98); }
/* Liste */
.clt-list { padding: 12px 16px 0; display: flex; flex-direction: column; gap: 8px; }
.clt-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--su); border: 1px solid var(--bo); border-radius: 16px;
  padding: 12px 14px;
}
.clt-row.me { border: 2px solid #6366f1; background: rgba(99,102,241,.06); }
.clt-rank {
  flex-shrink: 0; min-width: 32px; text-align: center;
  font: 800 16px/1 'IBM Plex Mono', monospace; color: var(--mu2);
}
.clt-rank.medal { font-size: 22px; }
.clt-name {
  flex: 1; min-width: 0; font: 700 15px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.clt-me-tag {
  flex-shrink: 0; font: 700 10px/1 'Inter', sans-serif; letter-spacing: .04em;
  background: #6366f1; color: #fff; border-radius: 99px; padding: 4px 8px; text-transform: uppercase;
}
.clt-score {
  flex-shrink: 0; font: 700 14px/1 'IBM Plex Mono', monospace; color: var(--a);
  display: flex; align-items: baseline; gap: 2px;
}
.clt-score-sub { font-size: 11px; color: var(--mu2); }
.clt-sep { text-align: center; color: var(--mu2); font: 600 12px/1 'Inter', sans-serif; padding: 6px 0 2px; }
/* Empty */
.clt-empty { text-align: center; padding: 48px 24px; color: var(--mu2); }
.clt-empty-ico { font-size: 40px; opacity: .35; margin-bottom: 12px; }
.clt-empty-txt { font: 500 14px/1.5 'Inter', sans-serif; max-width: 280px; margin: 0 auto; }
/* CTA pseudo */
.clt-pseudo {
  margin: 16px 16px 0; padding: 14px 16px;
  background: var(--su); border: 1px solid var(--bo); border-radius: 16px;
  display: flex; align-items: center; gap: 12px;
  text-decoration: none; color: var(--ink);
}
.clt-pseudo:active { transform: scale(.99); }
.clt-pseudo-ico { font-size: 20px; }
.clt-pseudo-body { flex: 1; }
.clt-pseudo-ttl { font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif; }
.clt-pseudo-sub { font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 2px; }
.clt-pseudo-chev { color: var(--mu2); font-size: 18px; }
@media (prefers-reduced-motion: reduce) { .clt-tab, .clt-row, .clt-pseudo { transition: none; } }
</style>`;

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page_view', { page: 'classement', user_role: me.role });

  root.innerHTML = `${STYLE}<div class="clt"><div class="clt-hd"><h1 class="clt-title">Classement</h1></div>
    <div class="clt-list">${Array.from({ length: 6 }).map(() => `<div class="skel skel-card" style="height:56px"></div>`).join('')}</div></div>`;

  // Fetch les deux scopes en parallèle
  const [ecoleRes, nationalRes] = await Promise.all([
    sb.rpc('get_eleve_leaderboard', { p_scope: 'ecole', p_limit: LIMIT }),
    sb.rpc('get_eleve_leaderboard', { p_scope: 'national', p_limit: LIMIT }),
  ]);

  if (ecoleRes.error && nationalRes.error) {
    console.error('[classement]', ecoleRes.error || nationalRes.error);
    root.innerHTML = `${STYLE}<div class="clt"><div class="clt-hd"><h1 class="clt-title">Classement</h1></div>
      <div class="clt-empty"><div class="clt-empty-ico">😕</div>
      <div class="clt-empty-txt">Le classement n'a pas pu se charger. Réessaie plus tard.</div></div></div>`;
    return;
  }

  const data = {
    ecole: ecoleRes.data || [],
    national: nationalRes.data || [],
  };

  let scope = 'ecole';
  root.innerHTML = `${STYLE}${render(scope, data)}`;
  wire(root, data, (s) => { scope = s; });
}

// ── Helpers ───────────────────────────────────────────────────────
function myRow(rows) { return rows.find(r => r.is_me === true) || null; }

// Total fiable seulement si rien ne dépasse la limite (sinon on connaît pas N).
function totalKnown(rows) {
  return !rows.some(r => r.rang > LIMIT) ? rows.length : null;
}

function render(scope, data) {
  const rows = data[scope];
  const mine = myRow(rows);
  const total = totalKnown(rows);

  const pill = mine
    ? `<div class="clt-mepill"><span class="clt-mepill-ico">🏆</span>Tu es #${mine.rang}${total ? ` sur ${total}` : ''}</div>`
    : `<div class="clt-mepill"><span class="clt-mepill-ico">🏁</span>Valide une compétence pour entrer au classement</div>`;

  return `
<div class="clt">
  <div class="clt-hd">
    <h1 class="clt-title">Classement</h1>
    ${pill}
    <div class="clt-tabs">
      <button class="clt-tab ${scope === 'ecole' ? 'on' : ''}" data-scope="ecole">Mon auto-école</button>
      <button class="clt-tab ${scope === 'national' ? 'on' : ''}" data-scope="national">National</button>
    </div>
  </div>
  <div id="clt-body">${renderBody(rows)}</div>
  <a class="clt-pseudo" href="#/profil">
    <span class="clt-pseudo-ico" aria-hidden="true">🎭</span>
    <div class="clt-pseudo-body">
      <div class="clt-pseudo-ttl">Choisis ton pseudo public</div>
      <div class="clt-pseudo-sub">Sinon tu apparais en « Apprenti #XXXX »</div>
    </div>
    <span class="clt-pseudo-chev" aria-hidden="true">›</span>
  </a>
</div>`;
}

function renderBody(rows) {
  // Assez d'élèves pour un classement vivant ? (au moins 2 avec un score > 0)
  const active = rows.filter(r => r.score > 0).length;
  if (active < 2) {
    return `<div class="clt-empty">
      <div class="clt-empty-ico">🏁</div>
      <div class="clt-empty-txt">Le classement s'anime quand 2+ élèves ont validé des compétences.</div>
    </div>`;
  }

  const top = rows.filter(r => r.rang <= LIMIT).sort((a, b) => a.rang - b.rang);
  const mine = myRow(rows);
  const meOutside = mine && mine.rang > LIMIT;

  let html = `<div class="clt-list">${top.map(rowHtml).join('')}</div>`;
  if (meOutside) {
    html += `<div class="clt-sep">· · ·</div><div class="clt-list">${rowHtml(mine)}</div>`;
  }
  return html;
}

function rowHtml(r) {
  const medal = MEDALS[r.rang];
  const rankCell = medal
    ? `<div class="clt-rank medal" aria-label="Rang ${r.rang}">${medal}</div>`
    : `<div class="clt-rank">${r.rang}</div>`;
  return `
  <div class="clt-row ${r.is_me ? 'me' : ''}">
    ${rankCell}
    <div class="clt-name">${esc(r.display_name)}</div>
    ${r.is_me ? '<span class="clt-me-tag">Toi</span>' : ''}
    <div class="clt-score">${r.score}<span class="clt-score-sub">/31</span></div>
  </div>`;
}

function wire(root, data, setScope) {
  const tabs = root.querySelectorAll('.clt-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const next = tab.dataset.scope;
      if (tab.classList.contains('on')) return;
      setScope(next);
      haptic('select');
      playClick();
      // Onglets
      tabs.forEach(t => t.classList.toggle('on', t.dataset.scope === next));
      // Pill perso
      const rows = data[next];
      const mine = myRow(rows);
      const total = totalKnown(rows);
      const pill = root.querySelector('.clt-mepill');
      if (pill) {
        pill.innerHTML = mine
          ? `<span class="clt-mepill-ico">🏆</span>Tu es #${mine.rang}${total ? ` sur ${total}` : ''}`
          : `<span class="clt-mepill-ico">🏁</span>Valide une compétence pour entrer au classement`;
      }
      // Corps
      const body = root.querySelector('#clt-body');
      if (body) { body.innerHTML = renderBody(rows); playPop(); }
      track('classement.scope_changed', { scope: next });
    });
  });
}
