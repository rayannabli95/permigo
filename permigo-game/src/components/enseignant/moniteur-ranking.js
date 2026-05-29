// ═══════════════════════════════════════════════════════════════
// Moniteur Ranking — section classement mensuel des moniteurs
// Usage : mountMoniteurRanking(root, { myId })
//   → `root` est le nœud où injecter le bloc
//   → `myId` est l'ID du moniteur connecté
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { icon } from '@/utils/icons.js';

const STYLE_ID = 'moniteur-ranking-style';

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  @keyframes mrIn {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .mr-wrap {
    margin-bottom: 24px;
  }
  .mr-sec-title {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--mu2);
    margin: 0 0 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .mr-sec-title::after {
    content: ''; flex: 1;
    height: 1px; background: var(--bo);
  }

  /* Ma position highlight */
  .mr-my-position {
    background: #fff;
    border: 1.5px solid rgba(88,204,2,.3);
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 10px;
    box-shadow: 0 2px 12px -4px rgba(88,204,2,.15);
    animation: mrIn .4s cubic-bezier(.34,1.56,.64,1) both;
  }
  .mr-my-top {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 12px;
  }
  .mr-rank-badge {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    flex-shrink: 0;
  }
  .mr-rank-badge.rank-1 { background: linear-gradient(135deg,var(--am),var(--amk)); color:#fff; }
  .mr-rank-badge.rank-2 { background: linear-gradient(135deg,var(--mu2),var(--mu3)); color:#fff; }
  .mr-rank-badge.rank-3 { background: linear-gradient(135deg,var(--amx),#92400e); color:#fff; }
  .mr-rank-badge.rank-other { background: rgba(88,204,2,.1); color:var(--a); border:1.5px solid rgba(88,204,2,.2); }
  .mr-name {
    font: 700 15px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    flex: 1;
  }
  .mr-score {
    font: 800 18px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--a);
    letter-spacing: -.02em;
    flex-shrink: 0;
  }
  .mr-score-lbl {
    font: 500 10px/1 'Inter', sans-serif;
    color: var(--mu2);
    text-align: right;
    margin-top: 2px;
  }

  .mr-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .mr-metric {
    text-align: center;
    padding: 8px 4px;
    background: var(--su2);
    border-radius: 12px;
  }
  .mr-metric-val {
    font: 700 16px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -.02em;
  }
  .mr-metric-lbl {
    font: 500 10px/1.3 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 3px;
  }

  /* Comparaison vs n+1 */
  .mr-compare {
    font: 500 12px/1.4 'Inter', sans-serif;
    color: var(--a);
    background: rgba(88,204,2,.05);
    border-radius: 10px;
    padding: 8px 12px;
    margin-top: 10px;
    text-align: center;
  }

  /* Top 3 leaderboard */
  .mr-list {
    background: #fff;
    border: 1.5px solid var(--bo);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(10,13,26,.06);
    animation: mrIn .4s cubic-bezier(.34,1.56,.64,1) .1s both;
  }
  .mr-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--bg3);
    transition: background .12s;
  }
  .mr-row:last-child { border-bottom: none; }
  .mr-row.mr-row-me {
    background: rgba(88,204,2,.04);
  }
  .mr-row-rank {
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    width: 24px; text-align: center;
    flex-shrink: 0;
  }
  .mr-row-rank.r1 { color: var(--amk); }
  .mr-row-rank.r2 { color: var(--mu3); }
  .mr-row-rank.r3 { color: var(--amx); }
  .mr-row-rank.rn { color: var(--mu2); }
  .mr-row-info { flex: 1; min-width: 0; }
  .mr-row-name {
    font: 600 13px/1.2 'Inter', sans-serif;
    color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .mr-row-sub {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 2px;
  }
  .mr-row-score {
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--a);
    flex-shrink: 0;
  }
  `;
  document.head.appendChild(s);
}

// ─── Helpers ──────────────────────────────────────────────────
function rankClass(rank) {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-other';
}
function rankRowClass(rank) {
  if (rank === 1) return 'r1';
  if (rank === 2) return 'r2';
  if (rank === 3) return 'r3';
  return 'rn';
}
function rankLabel(rank) {
  // Affichage textuel cohérent (emojis 🥇🥈🥉 abandonnés car rendu inégal sur certains Android)
  return `#${rank}`;
}
function fmtHours(h) {
  if (!h) return '0h';
  const val = parseFloat(h);
  if (val < 1) return `${Math.round(val * 60)}min`;
  return Number.isInteger(val) ? `${val}h` : `${val.toFixed(1)}h`;
}

/**
 * Injecte le bloc ranking dans `root`.
 * @param {HTMLElement} root
 * @param {{ myId: string }} opts
 */
export async function mountMoniteurRanking(root, { myId }) {
  ensureStyle();

  root.innerHTML = `<div style="padding:12px 0;text-align:center;color:var(--mu2);font:500 13px/1 'Inter',sans-serif">Chargement du ranking…</div>`;

  let ranking = [];
  try {
    const month = new Date().toISOString().slice(0, 7) + '-01';
    const { data } = await sb.rpc('get_moniteur_ranking', { p_month: month });
    ranking = data || [];
  } catch (e) {
    console.error('[moniteur-ranking] error', e);
    root.innerHTML = '';
    return;
  }

  if (ranking.length === 0) {
    root.innerHTML = `<div style="text-align:center;color:var(--mu2);font:500 13px/1.5 'Inter',sans-serif;padding:16px">Aucune donnée ce mois-ci encore.</div>`;
    return;
  }

  track('moniteur_ranking.viewed', { user_id: myId });

  const mine     = ranking.find(r => r.moniteur_id === myId);
  const top3     = ranking.slice(0, 3);
  const mineIdx  = mine ? ranking.findIndex(r => r.moniteur_id === myId) : -1;
  const prev     = mineIdx > 0 ? ranking[mineIdx - 1] : null; // personne au-dessus

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const noHours = !mine?.hours_confirmed || parseFloat(mine.hours_confirmed) === 0;

  root.innerHTML = `
  <div class="mr-wrap">
    <div class="mr-sec-title">
      ${icon('award', { size: 12, strokeWidth: 2.4 })}
      Classement · ${esc(monthLabel)}
    </div>

    ${mine ? `
    <div class="mr-my-position">
      <div class="mr-my-top">
        <div class="mr-rank-badge ${rankClass(mine.rank)}">${rankLabel(mine.rank)}</div>
        <div class="mr-name">Ma position</div>
        <div>
          <div class="mr-score">${mine.score_total}</div>
          <div class="mr-score-lbl">pts</div>
        </div>
      </div>
      <div class="mr-metrics">
        ${noHours ? `
        <div class="mr-metric" style="grid-column:span 2">
          <div class="mr-metric-val" style="color:var(--mu2);font-size:13px">${mine.n_validations ?? 0} val. · pas encore de session enregistrée</div>
          <div class="mr-metric-lbl" style="margin-top:4px">Enregistre une session pour débloquer ce compteur</div>
        </div>` : `
        <div class="mr-metric">
          <div class="mr-metric-val">${fmtHours(mine.hours_confirmed)}</div>
          <div class="mr-metric-lbl">confirmées</div>
        </div>
        <div class="mr-metric">
          <div class="mr-metric-val">${mine.n_validations ?? 0}</div>
          <div class="mr-metric-lbl">validations</div>
        </div>`}
        <div class="mr-metric">
          <div class="mr-metric-val">${mine.n_eleves_diff ?? 0}</div>
          <div class="mr-metric-lbl">élèves</div>
        </div>
        <div class="mr-metric">
          <div class="mr-metric-val">${mine.n_jours_actifs ?? 0}j</div>
          <div class="mr-metric-lbl">actifs</div>
        </div>
      </div>
      ${prev ? `
      <div class="mr-compare">
        ${icon('trending-up', { size: 12, strokeWidth: 2.4 })}
        Tu es à <strong>${Math.round((prev.score_total - mine.score_total) * 10) / 10} pts</strong> derrière ${esc(prev.moniteur_prenom)}
      </div>` : (mine.rank === 1 ? `<div class="mr-compare">🏆 Tu es en tête ce mois-ci !</div>` : '')}
    </div>` : ''}

    ${top3.length > 0 ? `
    <div class="mr-list">
      ${top3.map(r => `
        <div class="mr-row${r.moniteur_id === myId ? ' mr-row-me' : ''}">
          <span class="mr-row-rank ${rankRowClass(r.rank)}">${rankLabel(r.rank)}</span>
          <div class="mr-row-info">
            <div class="mr-row-name">${esc(r.moniteur_prenom)}${r.moniteur_id === myId ? ' <span style="font-size:10px;color:var(--a)">(toi)</span>' : ''}</div>
            <div class="mr-row-sub">${fmtHours(r.hours_confirmed)} · ${r.n_validations ?? 0} val. · ${r.n_eleves_diff ?? 0} élèves</div>
          </div>
          <div class="mr-row-score">${r.score_total} pts</div>
        </div>
      `).join('')}
    </div>` : ''}
  </div>`;
}
