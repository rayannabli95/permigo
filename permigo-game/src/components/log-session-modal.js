// ═══════════════════════════════════════════════════════════════
// Log Session Modal v2 — bottom sheet 5 sections
// A: élève  B: durée  C: jour  D: compétences  E: commentaire
// Usage : openLogSessionModal()
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { icon } from '@/utils/icons.js';

// ─── Constantes durées ────────────────────────────────────────
const DURATIONS = [
  { value: 30,  label: '30min' },
  { value: 45,  label: '45min' },
  { value: 60,  label: '1h' },
  { value: 90,  label: '1h30' },
  { value: 120, label: '2h' },
  { value: 150, label: '2h30' },
  { value: 180, label: '3h' },
];
const DEFAULT_DURATION = 90;
const MAX_COMMENT = 500;

const MONDE_LABELS = ['', 'Monde 1 · Maîtrise du véhicule', 'Monde 2 · Appréhension de la route', 'Monde 3 · Circulation', 'Monde 4 · En autonomie'];

// ─── Helpers date ──────────────────────────────────────────────
function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
function readableDate(daysAgo) {
  if (daysAgo === 0) return "Aujourd'hui";
  if (daysAgo === 1) return 'Hier';
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Error messages ────────────────────────────────────────────
const ERROR_MSG = {
  cap_daily_exceeded:  "Tu as déjà 10h de sessions enregistrées aujourd'hui.",
  cap_weekly_exceeded: 'Tu as déjà 50h de sessions enregistrées cette semaine.',
  session_too_old:     "Impossible d'enregistrer une session de plus de 48h.",
  invalid_duration:    'Durée invalide.',
};

// ─── État interne ─────────────────────────────────────────────
let _overlay = null;

// ─── CSS ──────────────────────────────────────────────────────
const STYLE_ID = 'log-session-modal-style';
function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  @keyframes lsmOverlayIn { from { opacity:0; } to { opacity:1; } }
  @keyframes lsmSheetIn   { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lsmSheetOut  { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(40px); } }

  .lsm-overlay {
    position: fixed; inset: 0; z-index: 9990;
    background: rgba(10,13,26,.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center;
    animation: lsmOverlayIn .22s cubic-bezier(.23,1,.32,1);
    padding: 0 0 env(safe-area-inset-bottom, 0px);
  }
  .lsm-sheet {
    width: 100%; max-width: 520px;
    background: #fff;
    border-radius: 24px 24px 0 0;
    max-height: 88vh;
    display: flex; flex-direction: column;
    animation: lsmSheetIn .3s cubic-bezier(.32,.72,0,1);
    box-shadow: 0 -8px 40px rgba(10,13,26,.18);
  }
  .lsm-sheet.lsm-closing {
    animation: lsmSheetOut .22s cubic-bezier(.23,1,.32,1) forwards;
  }
  .lsm-handle {
    width: 36px; height: 4px;
    background: #e2e6f2;
    border-radius: 2px;
    margin: 12px auto 0;
    flex-shrink: 0;
  }
  .lsm-head {
    display: flex; align-items: center;
    padding: 16px 20px 12px;
    flex-shrink: 0;
  }
  .lsm-title {
    flex: 1;
    font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #0a0d1a;
    letter-spacing: -.02em;
  }
  .lsm-close {
    width: 32px; height: 32px;
    border: none; background: #f1f3f9;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #64748b;
    transition: background .12s;
    flex-shrink: 0;
  }
  .lsm-close:active { background: #e2e6f2; }

  .lsm-body {
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 0 20px 8px;
    flex: 1;
    min-height: 0;
  }

  .lsm-section { margin-bottom: 20px; }
  .lsm-sec-title {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #94a3b8;
    margin: 0 0 10px;
    display: flex; align-items: center; gap: 8px;
  }
  .lsm-sec-title::after {
    content: '';
    flex: 1; height: 1px;
    background: #f0f2f8;
  }
  .lsm-sec-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }
  .lsm-sec-count {
    font: 600 11px/1 'Inter', sans-serif;
    color: #6366f1;
    background: rgba(99,102,241,.08);
    padding: 2px 8px;
    border-radius: 10px;
  }

  /* Elève rows */
  .lsm-eleve-list { display: flex; flex-direction: column; gap: 6px; }
  .lsm-eleve-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px;
    border: 1.5px solid #e2e6f2;
    border-radius: 16px;
    cursor: pointer;
    transition: border-color .12s, background .12s;
    background: #fff;
    min-height: 52px;
  }
  .lsm-eleve-row:active { transform: scale(.99); }
  .lsm-eleve-row.lsm-selected { border-color: #6366f1; background: rgba(99,102,241,.04); }
  .lsm-eleve-av {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff; flex-shrink: 0;
  }
  .lsm-eleve-info { flex: 1; min-width: 0; }
  .lsm-eleve-name {
    font: 600 14px/1.2 'Inter', sans-serif;
    color: #0a0d1a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .lsm-eleve-hint { font: 500 11px/1 'Inter', sans-serif; color: #94a3b8; margin-top: 2px; }
  .lsm-eleve-check {
    width: 20px; height: 20px;
    border-radius: 50%;
    border: 2px solid #e2e6f2;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background .12s, border-color .12s;
  }
  .lsm-selected .lsm-eleve-check { background: #6366f1; border-color: #6366f1; }

  /* Chips durée */
  .lsm-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .lsm-chip {
    padding: 9px 16px;
    border: 1.5px solid #e2e6f2;
    border-radius: 40px;
    font: 600 13px/1 'Inter', sans-serif;
    color: #64748b;
    background: #fff;
    cursor: pointer;
    transition: border-color .12s, background .12s, color .12s, transform .1s;
    min-height: 40px;
    display: flex; align-items: center;
  }
  .lsm-chip:active { transform: scale(.96); }
  .lsm-chip.lsm-selected { border-color: #6366f1; background: rgba(99,102,241,.07); color: #6366f1; }

  /* Chips jours — plus larges */
  .lsm-day-chips { gap: 8px; }
  .lsm-day-chip { flex: 1; justify-content: center; padding: 11px 12px; }

  /* Comp chips groupées par monde */
  .lsm-monde-group { margin-bottom: 12px; }
  .lsm-monde-lbl {
    font: 500 10px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: #94a3b8;
    margin: 0 0 7px;
  }
  .lsm-comp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .lsm-comp-chip {
    padding: 6px 12px;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
    font: 500 12px/1 'Inter', sans-serif;
    color: #4b5563;
    background: #fff;
    cursor: pointer;
    transition: border-color .12s, background .12s, color .12s, transform .1s;
    min-height: 36px;
    display: flex; align-items: center; gap: 5px;
    text-align: left;
  }
  .lsm-comp-chip:active { transform: scale(.97); }
  .lsm-comp-chip.lsm-selected {
    border-color: #10b981;
    background: rgba(16,185,129,.07);
    color: #059669;
    font-weight: 600;
  }
  .lsm-comp-chip .lsm-comp-code {
    font: 700 9px/1 'Inter', sans-serif;
    padding: 1px 5px;
    border-radius: 6px;
    background: rgba(16,185,129,.12);
    color: #059669;
    flex-shrink: 0;
  }
  .lsm-comp-chip.lsm-selected .lsm-comp-code { background: #059669; color: #fff; }
  .lsm-comp-loading {
    color: #94a3b8; font: 500 12px/1.5 'Inter', sans-serif;
    padding: 8px 0;
  }
  .lsm-comp-empty {
    color: #10b981; font: 500 12px/1.4 'Inter', sans-serif;
    padding: 4px 0;
    display: flex; align-items: center; gap: 6px;
  }

  /* Textarea commentaire */
  .lsm-visibility-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font: 500 11px/1 'Inter', sans-serif;
    color: #64748b;
    background: #f1f3f9;
    padding: 4px 8px;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .lsm-textarea-wrap { position: relative; }
  .lsm-textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 14px;
    border: 1.5px solid #e2e6f2;
    border-radius: 14px;
    font: 500 13px/1.5 'Inter', sans-serif;
    color: #0a0d1a;
    background: #fff;
    resize: none;
    min-height: 90px;
    outline: none;
    transition: border-color .15s;
    -webkit-appearance: none;
  }
  .lsm-textarea:focus { border-color: #6366f1; }
  .lsm-char-count {
    position: absolute;
    bottom: 8px; right: 10px;
    font: 500 10px/1 'Inter', sans-serif;
    color: #c4ccd8;
    pointer-events: none;
  }
  .lsm-char-count.lsm-near-limit { color: #f59e0b; }

  /* Footer fixe */
  .lsm-footer {
    padding: 16px 20px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
    border-top: 1px solid #f0f2f8;
    flex-shrink: 0;
    background: #fff;
  }
  .lsm-submit {
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 52px;
    transition: opacity .15s, transform .15s;
  }
  .lsm-submit:active { transform: scale(.98); opacity: .9; }
  .lsm-submit:disabled { opacity: .5; cursor: not-allowed; }
  .lsm-submit.lsm-loading { opacity: .7; cursor: wait; }

  @media (prefers-reduced-motion: reduce) {
    .lsm-overlay, .lsm-sheet { animation: none; }
  }
  `;
  document.head.appendChild(s);
}

// ─── Avatar gradient ──────────────────────────────────────────
const GRADS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,#0891b2,#155e75)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
  'linear-gradient(135deg,#059669,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#a16207,#713f12)',
];
function gradFor(id) {
  let h = 0;
  for (let i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}
function initials(prenom, nom) {
  return ((prenom || '')[0] || '') + ((nom || '')[0] || '');
}

// ─── Fermeture animée ─────────────────────────────────────────
function closeModal() {
  if (!_overlay) return;
  const sheet = _overlay.querySelector('.lsm-sheet');
  if (sheet) {
    sheet.classList.add('lsm-closing');
    sheet.addEventListener('animationend', () => _overlay?.remove(), { once: true });
  } else {
    _overlay.remove();
  }
  _overlay = null;
}

// ─── Open ──────────────────────────────────────────────────────
export async function openLogSessionModal() {
  if (_overlay) return;
  ensureStyle();

  const me = getCurUser();
  if (!me) return;

  const todayDow = new Date().getDay();

  // Skeleton pendant le fetch initial
  _overlay = document.createElement('div');
  _overlay.className = 'lsm-overlay';
  _overlay.innerHTML = `
    <div class="lsm-sheet">
      <div class="lsm-handle"></div>
      <div class="lsm-head">
        <span class="lsm-title">Enregistrer une session</span>
        <button class="lsm-close" aria-label="Fermer">${icon('x', { size: 16, strokeWidth: 2.5 })}</button>
      </div>
      <div class="lsm-body" id="lsm-body-inner">
        <div style="padding:20px 0;text-align:center;color:#94a3b8;font:500 13px/1 'Inter',sans-serif">Chargement…</div>
      </div>
      <div class="lsm-footer">
        <button class="lsm-submit" id="lsm-btn-submit" disabled>
          ${icon('check', { size: 18, strokeWidth: 2.5 })}
          <span id="lsm-submit-label">Enregistrer la session</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(_overlay);

  _overlay.addEventListener('click', e => { if (e.target === _overlay) closeModal(); });
  _overlay.querySelector('.lsm-close').addEventListener('click', closeModal);

  // ─── Fetch données initiales ────────────────────────────────
  let suggestions = [];
  let allEleves = [];
  try {
    const [suggestRes, elevesRes] = await Promise.all([
      sb.rpc('suggest_next_session', { p_day_of_week: todayDow }),
      sb.from('profiles').select('id, prenom, nom').eq('role', 'eleve').order('prenom'),
    ]);
    suggestions = suggestRes.data || [];
    const eleves = elevesRes.data || [];
    const suggestedIds = new Set(suggestions.map(s => s.eleve_id));
    const otherEleves = eleves.filter(e => !suggestedIds.has(e.id));
    allEleves = [
      ...suggestions.map(s => ({ id: s.eleve_id, prenom: s.eleve_prenom, nom: '', _hint: _durationHint(s) })),
      ...otherEleves.map(e => ({ ...e, _hint: null })),
    ];
  } catch (e) {
    console.error('[log-session-modal] fetch error', e);
  }

  // ─── État local ────────────────────────────────────────────
  let selectedEleve   = allEleves[0]?.id || null;
  let selectedDuration = DEFAULT_DURATION;
  let selectedDay     = 0;
  let selectedComps   = new Set();
  let comment         = '';
  let pendingComps    = [];      // [{ competence_id, code, monde, nom }]
  let _compsFetched   = false;  // flag pour savoir si on a déjà fetché pour cet élève
  let _compCache      = {};     // cache par eleveId

  // ─── Fetch comps d'un élève ─────────────────────────────────
  async function fetchComps(eleveId) {
    if (!eleveId) { pendingComps = []; _compsFetched = true; return; }
    if (_compCache[eleveId]) {
      pendingComps = _compCache[eleveId];
      _compsFetched = true;
      return;
    }
    _compsFetched = false;
    try {
      const { data } = await sb.rpc('get_eleve_pending_competences', { p_eleve_id: eleveId });
      pendingComps = data || [];
      _compCache[eleveId] = pendingComps;
    } catch (e) {
      pendingComps = [];
    }
    _compsFetched = true;
  }

  // ─── Render compétences section (section D) ─────────────────
  function renderSectionD() {
    if (!_compsFetched) {
      return `<div class="lsm-comp-loading">Chargement des compétences…</div>`;
    }
    if (pendingComps.length === 0) {
      return `<div class="lsm-comp-empty">${icon('check-circle', { size: 14, color: '#10b981', strokeWidth: 2.5 })} Toutes les compétences sont déjà acquises !</div>`;
    }
    // Grouper par monde
    const byMonde = {};
    pendingComps.forEach(c => {
      if (!byMonde[c.monde]) byMonde[c.monde] = [];
      byMonde[c.monde].push(c);
    });
    return Object.entries(byMonde).sort(([a], [b]) => a - b).map(([monde, comps]) => `
      <div class="lsm-monde-group">
        <div class="lsm-monde-lbl">${esc(MONDE_LABELS[monde] || `Monde ${monde}`)}</div>
        <div class="lsm-comp-chips" data-monde="${monde}">
          ${comps.map(c => `
            <button class="lsm-comp-chip${selectedComps.has(c.competence_id) ? ' lsm-selected' : ''}"
                    data-comp="${esc(c.competence_id)}" title="${esc(c.nom)}">
              <span class="lsm-comp-code">${esc(c.code || c.competence_id)}</span>
              <span>${esc(c.nom)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // ─── Render body complet ────────────────────────────────────
  function renderBody() {
    const bodyEl = document.getElementById('lsm-body-inner');
    if (!bodyEl) return;

    const compCount = selectedComps.size;

    bodyEl.innerHTML = `
      <!-- A: Choix élève -->
      <div class="lsm-section">
        <div class="lsm-sec-title">Avec qui ?</div>
        ${allEleves.length === 0
          ? `<div style="color:#94a3b8;font:500 13px/1.5 'Inter',sans-serif;padding:12px 0">Aucun élève trouvé.</div>`
          : `<div class="lsm-eleve-list" id="lsm-eleve-list">
              ${allEleves.map(e => `
                <div class="lsm-eleve-row${e.id === selectedEleve ? ' lsm-selected' : ''}"
                     data-eleve="${esc(e.id)}" role="radio" aria-checked="${e.id === selectedEleve}">
                  <div class="lsm-eleve-av" style="background:${gradFor(e.id)}">${esc(initials(e.prenom, e.nom).toUpperCase() || '?')}</div>
                  <div class="lsm-eleve-info">
                    <div class="lsm-eleve-name">${esc(e.prenom || '')} ${esc(e.nom || '')}</div>
                    ${e._hint ? `<div class="lsm-eleve-hint">${esc(e._hint)}</div>` : ''}
                  </div>
                  <div class="lsm-eleve-check">
                    ${e.id === selectedEleve ? icon('check', { size: 12, strokeWidth: 3, color: '#fff' }) : ''}
                  </div>
                </div>
              `).join('')}
            </div>`
        }
      </div>

      <!-- B: Durée -->
      <div class="lsm-section">
        <div class="lsm-sec-title">Durée</div>
        <div class="lsm-chips" id="lsm-duration-chips">
          ${DURATIONS.map(d => `
            <button class="lsm-chip${d.value === selectedDuration ? ' lsm-selected' : ''}"
                    data-dur="${d.value}" aria-pressed="${d.value === selectedDuration}">
              ${esc(d.label)}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- C: Jour -->
      <div class="lsm-section">
        <div class="lsm-sec-title">Quand ?</div>
        <div class="lsm-chips lsm-day-chips" id="lsm-day-chips">
          ${[0,1,2].map(d => `
            <button class="lsm-chip lsm-day-chip${d === selectedDay ? ' lsm-selected' : ''}"
                    data-day="${d}" aria-pressed="${d === selectedDay}">
              ${esc(readableDate(d))}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- D: Compétences travaillées (optionnel) -->
      <div class="lsm-section">
        <div class="lsm-sec-header">
          <div class="lsm-sec-title" style="margin:0;flex:1">Compétences travaillées ?</div>
          ${compCount > 0 ? `<span class="lsm-sec-count">${compCount} sélectionnée${compCount > 1 ? 's' : ''}</span>` : ''}
        </div>
        <div id="lsm-comp-section" style="margin-top:8px">${renderSectionD()}</div>
      </div>

      <!-- E: Commentaire (optionnel) -->
      <div class="lsm-section">
        <div class="lsm-sec-title">Commentaire</div>
        <div class="lsm-visibility-badge">
          ${icon('eye', { size: 12, strokeWidth: 2 })}
          Visible élève + autres moniteurs
        </div>
        <div class="lsm-textarea-wrap">
          <textarea class="lsm-textarea" id="lsm-comment"
            maxlength="${MAX_COMMENT}"
            placeholder="${compCount > 0 ? 'Pourquoi validez-vous ces compétences ? (optionnel)' : 'Comment s\'est passée la séance ? (optionnel)'}"
            rows="3">${esc(comment)}</textarea>
          <span class="lsm-char-count${comment.length > MAX_COMMENT * 0.85 ? ' lsm-near-limit' : ''}" id="lsm-char-count">${comment.length}/${MAX_COMMENT}</span>
        </div>
      </div>
    `;

    wireInteractions();
    updateSubmitLabel();
  }

  // ─── Wire toutes les interactions du body ───────────────────
  function wireInteractions() {
    // A — Élève
    document.getElementById('lsm-eleve-list')?.querySelectorAll('.lsm-eleve-row').forEach(row => {
      row.addEventListener('click', async () => {
        const newId = row.dataset.eleve;
        if (newId === selectedEleve) return;
        selectedEleve = newId;
        selectedComps.clear();
        // Fetch comps pour le nouvel élève puis re-render
        renderBody(); // render immédiat avec loading dans section D
        await fetchComps(selectedEleve);
        renderBody();
        updateSubmit();
      });
    });

    // B — Durée (toggle direct, pas de re-render)
    document.getElementById('lsm-duration-chips')?.querySelectorAll('.lsm-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('lsm-duration-chips')?.querySelectorAll('.lsm-chip').forEach(c => {
          c.classList.toggle('lsm-selected', c === chip);
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        selectedDuration = parseInt(chip.dataset.dur, 10);
        updateSubmitLabel();
      });
    });

    // C — Jour (toggle direct)
    document.getElementById('lsm-day-chips')?.querySelectorAll('.lsm-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('lsm-day-chips')?.querySelectorAll('.lsm-chip').forEach(c => {
          c.classList.toggle('lsm-selected', c === chip);
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        selectedDay = parseInt(chip.dataset.day, 10);
      });
    });

    // D — Comp chips (toggle direct, pas de re-render)
    document.getElementById('lsm-comp-section')?.querySelectorAll('.lsm-comp-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const compId = chip.dataset.comp;
        if (selectedComps.has(compId)) {
          selectedComps.delete(compId);
          chip.classList.remove('lsm-selected');
        } else {
          selectedComps.add(compId);
          chip.classList.add('lsm-selected');
        }
        // Update counter badge
        const count = selectedComps.size;
        const secHeader = chip.closest('.lsm-section')?.querySelector('.lsm-sec-header');
        if (secHeader) {
          let badge = secHeader.querySelector('.lsm-sec-count');
          if (count > 0) {
            if (!badge) {
              badge = document.createElement('span');
              badge.className = 'lsm-sec-count';
              secHeader.appendChild(badge);
            }
            badge.textContent = `${count} sélectionnée${count > 1 ? 's' : ''}`;
          } else {
            badge?.remove();
          }
        }
        // Update textarea placeholder
        const ta = document.getElementById('lsm-comment');
        if (ta) {
          ta.placeholder = count > 0
            ? 'Pourquoi validez-vous ces compétences ? (optionnel)'
            : "Comment s'est passée la séance ? (optionnel)";
        }
        updateSubmitLabel();
      });
    });

    // E — Textarea (wire sans re-render)
    const ta = document.getElementById('lsm-comment');
    if (ta) {
      ta.addEventListener('input', () => {
        comment = ta.value;
        const cc = document.getElementById('lsm-char-count');
        if (cc) {
          cc.textContent = `${comment.length}/${MAX_COMMENT}`;
          cc.classList.toggle('lsm-near-limit', comment.length > MAX_COMMENT * 0.85);
        }
      });
    }
  }

  function updateSubmit() {
    const btn = document.getElementById('lsm-btn-submit');
    if (!btn) return;
    btn.disabled = !selectedEleve;
  }

  function updateSubmitLabel() {
    const lbl = document.getElementById('lsm-submit-label');
    if (!lbl) return;
    const compCount = selectedComps.size;
    if (compCount > 0) {
      lbl.textContent = `Enregistrer · ${compCount} compétence${compCount > 1 ? 's' : ''} validée${compCount > 1 ? 's' : ''}`;
    } else {
      lbl.textContent = 'Enregistrer la session';
    }
  }

  // Fetch comps pour l'élève initial + render
  if (selectedEleve) fetchComps(selectedEleve).then(() => renderBody());
  else renderBody();
  updateSubmit();

  // ─── Submit ─────────────────────────────────────────────────
  document.getElementById('lsm-btn-submit')?.addEventListener('click', async () => {
    if (!selectedEleve) return;
    const btn = document.getElementById('lsm-btn-submit');
    if (btn) { btn.disabled = true; btn.classList.add('lsm-loading'); }

    const sessionDate = isoDate(selectedDay);
    const compIds = selectedComps.size > 0 ? [...selectedComps] : undefined;
    const commentVal = comment.trim() || null;

    try {
      const { data, error } = await sb.rpc('log_session_v2', {
        p_eleve_id:         selectedEleve,
        p_duration_minutes: selectedDuration,
        p_session_date:     sessionDate,
        p_competence_ids:   compIds ?? null,
        p_comment:          commentVal,   // visible par l'élève
        p_notes:            null,
      });

      if (error) {
        console.error('[log-session-modal] log_session_v2 error', { code: error.code, message: error.message });
        toast(ERROR_MSG[error.code] || "Enregistrement impossible pour le moment. Veuillez réessayer.", 'error');
        if (btn) { btn.disabled = false; btn.classList.remove('lsm-loading'); }
        return;
      }

      const result = data?.[0] ?? data;
      if (result?.error) {
        toast(ERROR_MSG[result.error] || result.error, 'error');
        if (btn) { btn.disabled = false; btn.classList.remove('lsm-loading'); }
        return;
      }

      const eleveName = allEleves.find(e => e.id === selectedEleve);
      const durLabel  = DURATIONS.find(d => d.value === selectedDuration)?.label || `${selectedDuration}min`;
      const validations = result?.validations || [];
      const created = validations.filter(v => v.created).length;

      track('session.logged', {
        duration_minutes: selectedDuration,
        day_offset: selectedDay,
        n_competences: selectedComps.size,
        has_comment: !!commentVal,
        user_role: me.role,
      });

      if (created > 0) {
        toast(`+10 XP · ${created} compétence${created > 1 ? 's' : ''} validée${created > 1 ? 's' : ''} 🎉`, 'success');
      } else {
        toast(`Session enregistrée · ${durLabel} avec ${esc(eleveName?.prenom || "l'élève")} 📝`, 'success');
      }
      closeModal();

    } catch (e) {
      console.error('[log-session-modal] submit error', e);
      toast('Erreur réseau — réessaie', 'error');
      if (btn) { btn.disabled = false; btn.classList.remove('lsm-loading'); }
    }
  });
}

// ─── Hint durée suggérée ──────────────────────────────────────
function _durationHint(suggestion) {
  if (!suggestion) return null;
  const dur = suggestion.typical_duration;
  const d = DURATIONS.find(d => d.value === dur);
  const lastSeen = suggestion.last_seen_at ? _relativeDate(suggestion.last_seen_at) : null;
  const parts = [];
  if (d) parts.push(`Durée habituelle ${d.label}`);
  if (lastSeen) parts.push(`vu ${lastSeen}`);
  return parts.join(' · ') || null;
}

function _relativeDate(isoStr) {
  if (!isoStr) return null;
  const days = Math.floor((Date.now() - new Date(isoStr).getTime()) / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days}j`;
  return `il y a ${Math.floor(days / 7)} sem.`;
}
