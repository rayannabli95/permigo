// ═══════════════════════════════════════════════════════════════
// Enseignant — Livret REMC d'un élève
// mount(root, eleveId)
// Affiche les 31 sous-compétences avec leur état, permet de valider
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/common/toast.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { REMC, REMC_TOTAL } from '@/data/remc.js';
import { icon } from '@/utils/icons.js';
import { STATUT_CFG } from '@/utils/statut-label.js';

// ─── Couleurs par monde ───────────────────────────────────────────
const MONDE_COLORS = {
  C1: { accent: '#6366f1', bg: 'rgba(99,102,241,.07)', border: 'rgba(99,102,241,.2)' },
  C2: { accent: '#0891b2', bg: 'rgba(8,145,178,.07)',  border: 'rgba(8,145,178,.2)' },
  C3: { accent: '#f59e0b', bg: 'rgba(245,158,11,.07)', border: 'rgba(245,158,11,.2)' },
  C4: { accent: '#10b981', bg: 'rgba(16,185,129,.07)', border: 'rgba(16,185,129,.2)' },
};

// Mapping centralisé : @/utils/statut-label.js (STATUT_CFG importé)

// ─── CSS (design clean — cohérent avec aujourdhui/mes-eleves/validation) ──
const STYLE = `<style>
  .lr-page {
    padding: 0 0 120px;
    max-width: 600px;
    margin: 0 auto;
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    background: var(--bg);
  }

  /* Header sticky sous le header global */
  .lr-hd {
    position: sticky;
    top: calc(52px + env(safe-area-inset-top, 0px));
    z-index: 20;
    background: rgba(248,249,252,.96);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--bo);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .lr-back {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1px solid var(--bo);
    background: var(--su);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    color: var(--ink);
    flex-shrink: 0;
    transition: border-color .15s ease;
  }
  .lr-back:hover { border-color: #6366f1; }
  .lr-hd-info { flex: 1; min-width: 0; }
  .lr-title {
    font: 700 17px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 3px;
    letter-spacing: -0.022em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .lr-subtitle { font: 500 12px/1 'Inter', sans-serif; color: #94a3b8; margin: 0; }

  /* KPI global — la "barre de chaleur" du livret */
  .lr-kpi {
    margin: 16px;
    padding: 20px;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 20px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  }
  .lr-kpi-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 8px;
  }
  .lr-kpi-label {
    font: 600 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .lr-kpi-val {
    font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -0.022em;
  }
  .lr-kpi-pct {
    font: 500 13px/1 'Inter', sans-serif;
    color: var(--mu2);
  }
  .lr-global-bar {
    height: 6px;
    background: #e2e8f0;
    border-radius: 99px;
    overflow: hidden;
  }
  .lr-global-fill {
    height: 100%;
    background: #6366f1;
    border-radius: 99px;
    transition: width .8s cubic-bezier(.2,.7,.3,1);
  }

  /* Corps */
  .lr-body { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }

  /* Section monde */
  .lr-monde {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  }
  .lr-monde-hd {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--bo2);
  }
  .lr-monde-ico { font-size: 20px; line-height: 1; }
  .lr-monde-nm {
    font: 600 14px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    flex: 1;
    min-width: 0;
    letter-spacing: -0.01em;
  }
  .lr-monde-prog {
    font: 600 12px/1 'Inter', sans-serif;
    color: var(--mu2);
    flex-shrink: 0;
  }
  .lr-monde-bar-wrap {
    height: 3px;
    background: #e2e8f0;
  }
  .lr-monde-bar-fill {
    height: 100%;
    transition: width .6s cubic-bezier(.2,.7,.3,1);
  }

  /* Ligne sous-compétence */
  .lr-comp {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--bo2);
    cursor: pointer;
    transition: background .12s ease;
    min-height: 56px;
  }
  .lr-comp:last-child { border-bottom: none; }
  .lr-comp:hover { background: var(--bg); }
  .lr-comp:active { background: var(--bg2); }

  .lr-comp-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .lr-comp-code {
    font: 600 11px/1 'Inter', sans-serif;
    color: #6366f1;
    background: rgba(99,102,241,.1);
    border-radius: 6px;
    padding: 4px 8px;
    flex-shrink: 0;
  }
  .lr-comp-nom {
    font: 500 14px/1.4 'Inter', sans-serif;
    color: var(--ink);
    flex: 1;
    min-width: 0;
  }
  .lr-comp-badge {
    font: 600 11px/1 'Inter', sans-serif;
    padding: 5px 10px;
    border-radius: 99px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .lr-comp-chev { color: #cbd5e1; font-size: 14px; flex-shrink: 0; }

  /* ─── Bottom sheet overlay ────────────────────────────────── */
  .lr-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(10,13,26,.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
    animation: lr-overlay-in .2s ease;
  }
  @keyframes lr-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .lr-sheet {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: var(--su);
    border-radius: 24px 24px 0 0;
    padding: 0 0 max(24px, env(safe-area-inset-bottom));
    box-shadow: 0 -10px 40px rgba(10,13,26,.15);
    animation: lr-sheet-in .28s cubic-bezier(.33,1,.68,1) forwards;
    max-height: 92dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    transform: translateY(100%);
  }
  @keyframes lr-sheet-in {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .lr-sheet-hd {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--bo2);
    position: sticky;
    top: 0;
    background: var(--su);
    z-index: 2;
  }
  .lr-sheet-title {
    font: 700 17px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0;
    flex: 1;
    letter-spacing: -0.022em;
  }
  .lr-sheet-close {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1px solid var(--bo);
    background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    color: var(--mu);
    flex-shrink: 0;
    transition: border-color .15s ease, color .15s ease;
  }
  .lr-sheet-close:hover { border-color: #6366f1; color: #6366f1; }

  .lr-sheet-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }

  /* Boutons statut */
  .lr-statut-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .lr-statut-btn {
    padding: 14px 8px;
    border-radius: 12px;
    border: 1.5px solid var(--bo);
    background: var(--bg);
    cursor: pointer;
    text-align: center;
    transition: border-color .15s ease, background .15s ease, color .15s ease, transform .15s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .lr-statut-btn:hover { border-color: #6366f1; background: #fff; }
  .lr-statut-btn.selected-acquis {
    border-color: #10b981;
    background: rgba(16,185,129,.08);
  }
  .lr-statut-btn.selected-en_cours {
    border-color: #f59e0b;
    background: rgba(245,158,11,.08);
  }
  .lr-statut-btn.selected-a_retravailler {
    border-color: #ef4444;
    background: rgba(239,68,68,.08);
  }
  .lr-statut-btn-ico { font-size: 20px; line-height: 1; }
  .lr-statut-btn-lbl {
    font: 600 12px/1.3 'Inter', sans-serif;
    color: var(--ink);
  }

  /* Note */
  .lr-note-label {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--mu2);
    margin: 0 0 8px;
    display: block;
  }
  .lr-note {
    width: 100%;
    padding: 14px;
    background: var(--bg);
    border: 1px solid var(--bo);
    border-radius: 12px;
    font: 500 14px/1.5 'Inter', sans-serif;
    color: var(--ink);
    resize: vertical;
    min-height: 80px;
    max-height: 200px;
    outline: none;
    transition: border-color .15s ease, background .15s ease;
    box-sizing: border-box;
  }
  .lr-note::placeholder { color: #94a3b8; }
  .lr-note:focus {
    border-color: #6366f1;
    background: var(--su);
    box-shadow: 0 0 0 3px rgba(99,102,241,.12);
  }
  .lr-note-count {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    text-align: right;
    margin-top: 4px;
  }

  /* Bouton valider — SEUL gradient de la page */
  .lr-btn-save {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 12px;
    color: #fff;
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    transition: opacity .15s ease, transform .12s ease;
    min-height: 52px;
    letter-spacing: -0.01em;
  }
  .lr-btn-save:disabled {
    opacity: .45;
    cursor: not-allowed;
  }
  .lr-btn-save:not(:disabled):hover { opacity: .92; }
  .lr-btn-save:not(:disabled):active { transform: scale(.98); }

  /* Skeleton */
  .lr-skel { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
  .lr-skel-hd { height: 100px; background: linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%); background-size: 200% 100%; border-radius: 20px; animation: lr-pulse 1.4s ease-in-out infinite; }
  .lr-skel-bloc { height: 220px; background: linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%); background-size: 200% 100%; border-radius: 20px; animation: lr-pulse 1.4s ease-in-out infinite; animation-delay: .1s; }
  @keyframes lr-pulse { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  /* Message erreur */
  .lr-err {
    padding: 60px 20px;
    text-align: center;
    color: var(--mu2);
    font: 500 14px/1.6 'Inter', sans-serif;
  }
  .lr-err-ico { font-size: 40px; display: block; margin-bottom: 12px; }
</style>`;

// ─── State ────────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleveId = null;
let _eleveProfil = null;      // { prenom, nom }
let _validationsMap = {};     // competence_id → { statut, note }
let _sheetComp = null;        // { c, n } la comp ouverte dans le sheet
let _sheetStatut = null;
let _sheetNote = '';

// ─── Entry point ──────────────────────────────────────────────────
export async function mount(root, eleveId) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  _eleveId = eleveId || null;

  if (!_eleveId) {
    root.innerHTML = `
      ${STYLE}
      <div class="lr-page">
        <div class="lr-err">
          <span class="lr-err-ico">❌</span>
          Aucun élève sélectionné. Retournez à la liste.
        </div>
      </div>
    `;
    return;
  }

  track('page.view', { page: 'livret_remc', role: _me.role, eleve_id: _eleveId });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="lr-page">
      <div class="lr-skel">
        <div class="lr-skel-hd"></div>
        <div class="lr-skel-bloc"></div>
        <div class="lr-skel-bloc"></div>
      </div>
    </div>
  `;

  await loadData();
  render();
}

// ─── Data ─────────────────────────────────────────────────────────
async function loadData() {
  // Profil élève
  const { data: profil } = await sb
    .from('profiles')
    .select('id, prenom, nom')
    .eq('id', _eleveId)
    .single();

  _eleveProfil = profil || { prenom: 'Élève', nom: '' };

  // Toutes les validations de cet élève (tous enseignants — pour voir l'état complet)
  const { data: vals } = await sb
    .from('validations')
    .select('competence_id, statut, note_enseignant')
    .eq('eleve_id', _eleveId);

  _validationsMap = {};
  (vals || []).forEach(v => {
    _validationsMap[v.competence_id] = { statut: v.statut, note: v.note_enseignant || '' };
  });
}

// ─── Render principal ─────────────────────────────────────────────
function render() {
  const acquis = Object.values(_validationsMap).filter(v => v.statut === 'acquis').length;
  const pct = REMC_TOTAL > 0 ? Math.round((acquis / REMC_TOTAL) * 100) : 0;
  const prenomNom = [esc(_eleveProfil?.prenom || ''), esc(_eleveProfil?.nom || '')].filter(Boolean).join(' ');

  _root.innerHTML = `
    ${STYLE}
    <div class="lr-page anim-slide-up">

      <header class="lr-hd">
        <button class="lr-back" aria-label="Retour liste élèves">←</button>
        <div class="lr-hd-info">
          <h1 class="lr-title" tabindex="-1">Livret REMC — ${prenomNom || 'Élève'}</h1>
          <p class="lr-subtitle">${acquis}/${REMC_TOTAL} compétences acquises</p>
        </div>
      </header>

      <div class="lr-kpi">
        <div class="lr-kpi-row">
          <span class="lr-kpi-label">Progression globale</span>
          <span>
            <span class="lr-kpi-val">${acquis}</span>
            <span class="lr-kpi-pct"> / ${REMC_TOTAL} · ${pct}%</span>
          </span>
        </div>
        <div class="lr-global-bar">
          <div class="lr-global-fill" style="width:${pct}%"></div>
        </div>
      </div>

      <div class="lr-body">
        ${REMC.map(renderMonde).join('')}
      </div>

      <!-- Fil des moniteurs — injecté dynamiquement -->
      <div id="lr-feed-section" style="padding:0 16px 100px"></div>

    </div>
  `;

  wireMain();
  _loadFeedSection();
}

async function _loadFeedSection() {
  const host = document.getElementById('lr-feed-section');
  if (!host || !_eleveId) return;

  host.innerHTML = `<div style="padding:8px 0;color:#94a3b8;font:500 12px/1 'Inter',sans-serif">Chargement du fil…</div>`;

  let events = [];
  try {
    const { data } = await sb.rpc('get_eleve_feedback_feed', {
      p_eleve_id: _eleveId,
      p_limit: 30,
    });
    events = data || [];
  } catch (e) {
    host.innerHTML = '';
    return;
  }

  if (events.length === 0) {
    host.innerHTML = '';
    return;
  }

  function _relTime(ts) {
    if (!ts) return '';
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
    if (d === 0) return "aujourd'hui";
    if (d === 1) return 'hier';
    if (d < 7) return `il y a ${d}j`;
    return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  function _fmtMin(m) {
    if (!m) return '';
    const h = Math.floor(m / 60), r = m % 60;
    return h === 0 ? `${r}min` : r === 0 ? `${h}h` : `${h}h${r}`;
  }

  host.innerHTML = `
    <style>
      .lr-feed { margin-bottom: 0; }
      .lr-feed-hd {
        font: 600 11px/1 'Inter', sans-serif;
        text-transform: uppercase; letter-spacing: .08em;
        color: var(--mu2); margin: 0 0 12px;
        display: flex; align-items: center; gap: 8px;
      }
      .lr-feed-hd::after { content:''; flex:1; height:1px; background:#e2e6f2; }
      .lr-feed-list { display: flex; flex-direction: column; gap: 1px; }
      .lr-feed-item {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--bo2);
      }
      .lr-feed-item:last-child { border-bottom: none; }
      .lr-feed-dot {
        width: 28px; height: 28px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 2px;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px;
      }
      .lr-feed-dot.k-session { background: rgba(99,102,241,.1); }
      .lr-feed-dot.k-validation { background: rgba(16,185,129,.1); }
      .lr-feed-content { flex: 1; min-width: 0; }
      .lr-feed-author {
        font: 600 12px/1.2 'Inter', sans-serif;
        color: var(--ink);
        margin-bottom: 2px;
      }
      .lr-feed-desc {
        font: 500 12px/1.4 'Inter', sans-serif;
        color: var(--mu);
      }
      .lr-feed-comment {
        font: italic 11px/1.4 'Inter', sans-serif;
        color: var(--mu2);
        margin-top: 4px;
        padding-left: 6px;
        border-left: 2px solid #e2e6f2;
      }
      .lr-feed-ts {
        font: 500 10px/1 'Inter', sans-serif;
        color: #c4ccd8;
        flex-shrink: 0;
        margin-top: 4px;
      }
    </style>
    <div class="lr-feed">
      <div class="lr-feed-hd" style="display:flex;align-items:center;gap:6px;">${icon('clock', { size: 14, strokeWidth: 2.2, color: '#6366f1' })} Fil des moniteurs</div>
      <div class="lr-feed-list">
        ${events.map(evt => {
          const isSession = evt.kind === 'session';
          const dot = isSession ? '🚗' : '✓';
          const dotCls = isSession ? 'k-session' : 'k-validation';
          const desc = isSession
            ? `${_fmtMin(evt.duration_minutes)} de conduite`
            : `${esc(evt.competence_id || '—')} validée`;
          return `
          <div class="lr-feed-item">
            <div class="lr-feed-dot ${dotCls}">${dot}</div>
            <div class="lr-feed-content">
              <div class="lr-feed-author">${esc(evt.moniteur_prenom || '')} ${esc(evt.moniteur_nom || '')}</div>
              <div class="lr-feed-desc">${desc}</div>
              ${evt.comment ? `<div class="lr-feed-comment">"${esc(evt.comment)}"</div>` : ''}
            </div>
            <div class="lr-feed-ts">${_relTime(evt.ts)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderMonde(cat) {
  const col = MONDE_COLORS[cat.id] || MONDE_COLORS.C1;
  const acquis = cat.subs.filter(s => (_validationsMap[s.c]?.statut) === 'acquis').length;
  const pct = cat.subs.length > 0 ? Math.round((acquis / cat.subs.length) * 100) : 0;

  return `
    <div class="lr-monde" role="group" aria-label="${esc(cat.name)} — ${acquis}/${cat.subs.length} acquises">
      <div class="lr-monde-hd" style="background:${col.bg}; border-color:${col.border};">
        <span class="lr-monde-ico">${cat.ico}</span>
        <span class="lr-monde-nm">${esc(cat.name)}</span>
        <span class="lr-monde-prog">${acquis}/${cat.subs.length}</span>
      </div>
      <div class="lr-monde-bar-wrap">
        <div class="lr-monde-bar-fill" style="width:${pct}%; background:${col.accent};"></div>
      </div>
      ${cat.subs.map(sub => renderComp(sub, col)).join('')}
    </div>
  `;
}

function renderComp(sub, col) {
  const val = _validationsMap[sub.c];
  const statut = val?.statut || null;
  const cfg = STATUT_CFG[statut] || STATUT_CFG.null;

  return `
    <div class="lr-comp" data-comp-id="${esc(sub.c)}" data-comp-nom="${esc(sub.n)}"
         role="button" tabindex="0" aria-label="${esc(sub.n)} — ${cfg.label}. Appuyer pour évaluer">
      <span class="lr-comp-dot" style="background:${cfg.dot}"></span>
      <span class="lr-comp-code" style="color:${col.accent}; background:${col.bg}">${esc(sub.c)}</span>
      <span class="lr-comp-nom">${esc(sub.n)}</span>
      <span class="lr-comp-badge" style="color:${cfg.color}; background:${cfg.bg}">${cfg.label}</span>
      <span class="lr-comp-chev" aria-hidden="true">›</span>
    </div>
  `;
}

// ─── Wire principal ───────────────────────────────────────────────
function wireMain() {
  // Retour
  _root.querySelector('.lr-back')?.addEventListener('click', () => navigate('#/eleves'));

  // Clic sur sous-compétence → ouvrir sheet
  _root.querySelectorAll('.lr-comp[data-comp-id]').forEach(el => {
    const handler = () => openSheet(el.dataset.compId, el.dataset.compNom);
    el.addEventListener('click', handler);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}

// ─── Bottom sheet ─────────────────────────────────────────────────
function openSheet(compId, compNom) {
  _sheetComp = { c: compId, n: compNom };
  const existing = _validationsMap[compId];
  _sheetStatut = existing?.statut || null;
  _sheetNote = existing?.note || '';

  const overlay = document.createElement('div');
  overlay.className = 'lr-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `Évaluer ${compNom}`);

  overlay.innerHTML = `
    <div class="lr-sheet">
      <div class="lr-sheet-hd">
        <h2 class="lr-sheet-title">${esc(compNom)}</h2>
        <button class="lr-sheet-close" aria-label="Fermer">✕</button>
      </div>
      <div class="lr-sheet-body">
        <div>
          <label class="lr-note-label">Statut</label>
          <div class="lr-statut-grid">
            ${renderStatutBtn('acquis',         icon('check-circle', { size: 16, strokeWidth: 2.2, color: '#059669' }), 'Acquis')}
            ${renderStatutBtn('en_cours',       icon('refresh-cw',   { size: 16, strokeWidth: 2.2, color: '#d97706' }), 'En cours')}
            ${renderStatutBtn('a_retravailler', icon('alert-triangle',{ size: 16, strokeWidth: 2.2, color: '#dc2626' }), 'À retravailler')}
          </div>
        </div>
        <div>
          <label class="lr-note-label" for="lr-note-ta">Note (optionnel)</label>
          <textarea
            id="lr-note-ta"
            class="lr-note"
            maxlength="280"
            placeholder="Observations sur la séance…"
            rows="3"
          >${esc(_sheetNote)}</textarea>
          <div class="lr-note-count">${_sheetNote.length}/280</div>
        </div>
        <button class="lr-btn-save" ${_sheetStatut ? '' : 'disabled'}>
          Enregistrer
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Fermer en cliquant l'overlay
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeSheet(overlay);
  });
  overlay.querySelector('.lr-sheet-close').addEventListener('click', () => closeSheet(overlay));

  // Boutons statut
  overlay.querySelectorAll('.lr-statut-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _sheetStatut = btn.dataset.statut;
      overlay.querySelectorAll('.lr-statut-btn').forEach(b =>
        b.className = `lr-statut-btn${b.dataset.statut === _sheetStatut ? ' selected-' + _sheetStatut : ''}`
      );
      overlay.querySelector('.lr-btn-save').disabled = false;
    });
  });

  // Note textarea
  const ta = overlay.querySelector('.lr-note');
  const counter = overlay.querySelector('.lr-note-count');
  ta.addEventListener('input', () => {
    _sheetNote = ta.value.slice(0, 280);
    ta.value = _sheetNote;
    counter.textContent = `${_sheetNote.length}/280`;
  });

  // Valider
  overlay.querySelector('.lr-btn-save').addEventListener('click', () => doSave(overlay));

  // Focus trap initial
  requestAnimationFrame(() => ta.focus());
}

function renderStatutBtn(statut, ico, lbl) {
  const selected = _sheetStatut === statut;
  return `
    <button class="lr-statut-btn${selected ? ' selected-' + statut : ''}" data-statut="${esc(statut)}">
      <span class="lr-statut-btn-ico">${ico}</span>
      <span class="lr-statut-btn-lbl">${lbl}</span>
    </button>
  `;
}

function closeSheet(overlay) {
  overlay.style.animation = 'lr-overlay-in .18s ease reverse';
  setTimeout(() => overlay.remove(), 180);
}

async function doSave(overlay) {
  if (!_sheetComp || !_sheetStatut) return;

  const btn = overlay.querySelector('.lr-btn-save');
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';

  const payload = {
    eleve_id: _eleveId,
    competence_id: _sheetComp.c,
    validated_by: _me.id,
    statut: _sheetStatut,
    validated_at: new Date().toISOString(),
  };
  if (_sheetNote.trim()) payload.note_enseignant = _sheetNote.trim();

  const { error } = await sb
    .from('validations')
    .upsert(payload, { onConflict: 'eleve_id,competence_id' });

  if (error) {
    toast('Erreur lors de la sauvegarde', 'error');
    btn.disabled = false;
    btn.textContent = 'Enregistrer';
    return;
  }

  // Notification élève si compétence acquise
  if (_sheetStatut === 'acquis') {
    const { error: errNotif } = await sb.from('notifications').insert({
      user_id: _eleveId,
      type: 'post_validation_quiz',
      title: 'Compétence validée ! 🎯',
      body: `${_sheetComp.n} — Fais le quiz en 30 sec`,
      data: { competence_id: _sheetComp.c },
      read: false,
    });
    if (errNotif) {
      console.error('[livret-remc] notification insert failed', errNotif);
      toast('Validé, mais notification non envoyée', 'warning');
    }
  }

  track('competence.evaluated', {
    competence_id: _sheetComp.c,
    eleve_id: _eleveId,
    statut: _sheetStatut,
    auto_ecole_id: _me.auto_ecole_id,
  });

  // Mettre à jour le state local
  _validationsMap[_sheetComp.c] = { statut: _sheetStatut, note: _sheetNote }; // note = note_enseignant mapped locally

  toast(
    _sheetStatut === 'acquis'
      ? 'Compétence acquise — quiz envoyé !'
      : 'Évaluation enregistrée.',
    'success'
  );

  closeSheet(overlay);

  // Re-render la page pour refléter le changement
  render();
}
