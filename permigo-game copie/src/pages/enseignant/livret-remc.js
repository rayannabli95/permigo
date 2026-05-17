// ═══════════════════════════════════════════════════════════════
// Enseignant — Livret REMC d'un élève
// mount(root, eleveId)
// Affiche les 31 sous-compétences avec leur état, permet de valider
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { REMC, REMC_TOTAL } from '@/data/remc.js';

// ─── Couleurs par monde ───────────────────────────────────────────
const MONDE_COLORS = {
  C1: { accent: '#6366f1', bg: 'rgba(99,102,241,.07)', border: 'rgba(99,102,241,.2)' },
  C2: { accent: '#0891b2', bg: 'rgba(8,145,178,.07)',  border: 'rgba(8,145,178,.2)' },
  C3: { accent: '#f59e0b', bg: 'rgba(245,158,11,.07)', border: 'rgba(245,158,11,.2)' },
  C4: { accent: '#10b981', bg: 'rgba(16,185,129,.07)', border: 'rgba(16,185,129,.2)' },
};

// ─── Statuts ──────────────────────────────────────────────────────
const STATUT_CFG = {
  acquis:         { label: 'Acquis',          color: 'var(--gr)',  bg: 'var(--grp)', dot: '#10b981' },
  en_cours:       { label: 'En cours',        color: 'var(--am)',  bg: 'var(--amp)', dot: '#f59e0b' },
  a_retravailler: { label: 'À retravailler',  color: 'var(--rd)',  bg: 'var(--rdp)', dot: '#ef4444' },
  null:           { label: 'Non évalué',      color: 'var(--mu)',  bg: 'var(--bg2)', dot: '#94a3b8' },
};

// ─── CSS ──────────────────────────────────────────────────────────
const STYLE = `<style>
  .lr-page {
    padding: 0 0 120px;
    max-width: 600px;
    margin: 0 auto;
    font-family: var(--fb);
  }

  /* Header */
  .lr-hd {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--bg);
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--bo);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .lr-back {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1.5px solid var(--bo);
    background: var(--su);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    color: var(--ink);
    flex-shrink: 0;
    transition: border-color var(--t), box-shadow var(--t);
    min-width: 36px;
  }
  .lr-back:hover { border-color: var(--a); box-shadow: 0 0 0 3px var(--ap); }
  .lr-hd-info { flex: 1; min-width: 0; }
  .lr-title {
    font: 700 16px/1.2 var(--fd);
    color: var(--ink);
    margin: 0 0 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .lr-subtitle { font: 500 12px/1 var(--fb); color: var(--mu); margin: 0; }

  /* KPI global */
  .lr-kpi {
    margin: 16px 16px 0;
    padding: 16px;
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--rl);
    box-shadow: var(--s0);
  }
  .lr-kpi-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .lr-kpi-label { font: 600 13px/1 var(--fd); color: var(--ink); }
  .lr-kpi-val { font: 700 20px/1 var(--fn); color: var(--a); }
  .lr-kpi-pct { font: 500 12px/1 var(--fb); color: var(--mu); }
  .lr-global-bar {
    height: 8px;
    background: var(--bo);
    border-radius: 99px;
    overflow: hidden;
  }
  .lr-global-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--a), #8b5cf6);
    border-radius: 99px;
    transition: width .6s ease;
  }

  /* Corps */
  .lr-body { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

  /* Section monde */
  .lr-monde {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--rl);
    overflow: hidden;
    box-shadow: var(--s0);
  }
  .lr-monde-hd {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 16px;
    border-bottom: 1px solid var(--bo);
  }
  .lr-monde-ico { font-size: 20px; line-height: 1; }
  .lr-monde-nm {
    font: 700 14px/1.2 var(--fd);
    color: var(--ink);
    flex: 1;
    min-width: 0;
  }
  .lr-monde-prog {
    font: 700 12px/1 var(--fn);
    color: var(--mu);
    flex-shrink: 0;
  }
  .lr-monde-bar-wrap {
    height: 3px;
    background: var(--bo);
    border-radius: 0;
  }
  .lr-monde-bar-fill {
    height: 100%;
    border-radius: 0;
    transition: width .5s ease;
  }

  /* Ligne sous-compétence */
  .lr-comp {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 13px 16px;
    border-bottom: 1px solid var(--bo2);
    cursor: pointer;
    transition: background var(--t);
    min-height: 44px;
  }
  .lr-comp:last-child { border-bottom: none; }
  .lr-comp:hover { background: var(--ap); }
  .lr-comp:active { background: var(--ag); }

  .lr-comp-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .lr-comp-code {
    font: 700 11px/1 var(--fn);
    color: var(--a);
    background: var(--ap);
    border-radius: 6px;
    padding: 3px 7px;
    flex-shrink: 0;
  }
  .lr-comp-nom {
    font: 500 13px/1.4 var(--fb);
    color: var(--ink);
    flex: 1;
    min-width: 0;
  }
  .lr-comp-badge {
    font: 600 11px/1 var(--fn);
    padding: 3px 8px;
    border-radius: 20px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .lr-comp-chev { color: var(--mu2); font-size: 14px; flex-shrink: 0; }

  /* ─── Bottom sheet overlay ────────────────────────────────── */
  .lr-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(11,13,26,.55);
    backdrop-filter: blur(4px);
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
    border-radius: var(--rx) var(--rx) 0 0;
    padding: 0 0 max(24px, env(safe-area-inset-bottom));
    box-shadow: var(--s4);
    animation: lr-sheet-in .28s cubic-bezier(.32,0,.67,0) reverse, lr-sheet-in .28s cubic-bezier(.33,1,.68,1) forwards;
    max-height: 92dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
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
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--bo);
    position: sticky;
    top: 0;
    background: var(--su);
    z-index: 2;
  }
  .lr-sheet-title {
    font: 700 16px/1.3 var(--fd);
    color: var(--ink);
    margin: 0;
    flex: 1;
  }
  .lr-sheet-close {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 1.5px solid var(--bo);
    background: var(--bg2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    color: var(--mu);
    flex-shrink: 0;
    transition: border-color var(--t);
  }
  .lr-sheet-close:hover { border-color: var(--a); }

  .lr-sheet-body { padding: 20px; display: flex; flex-direction: column; gap: 20px; }

  /* Boutons statut */
  .lr-statut-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .lr-statut-btn {
    padding: 12px 6px;
    border-radius: var(--r);
    border: 2px solid var(--bo);
    background: var(--bg2);
    cursor: pointer;
    text-align: center;
    transition: all .15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .lr-statut-btn:hover { border-color: var(--a); background: var(--ap); }
  .lr-statut-btn.selected-acquis {
    border-color: var(--gr);
    background: var(--grp);
  }
  .lr-statut-btn.selected-en_cours {
    border-color: var(--am);
    background: var(--amp);
  }
  .lr-statut-btn.selected-a_retravailler {
    border-color: var(--rd);
    background: var(--rdp);
  }
  .lr-statut-btn-ico { font-size: 20px; line-height: 1; }
  .lr-statut-btn-lbl {
    font: 600 12px/1.2 var(--fb);
    color: var(--ink);
  }

  /* Note */
  .lr-note-label {
    font: 600 12px/1 var(--fn);
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--mu);
    margin: 0 0 8px;
    display: block;
  }
  .lr-note {
    width: 100%;
    padding: 12px;
    background: var(--bg);
    border: 1.5px solid var(--bo);
    border-radius: var(--r);
    font: 500 14px/1.5 var(--fb);
    color: var(--ink);
    resize: vertical;
    min-height: 80px;
    max-height: 200px;
    outline: none;
    transition: border-color var(--t), box-shadow var(--t);
    box-sizing: border-box;
  }
  .lr-note::placeholder { color: var(--mu2); }
  .lr-note:focus { border-color: var(--a); box-shadow: 0 0 0 3px var(--ap); }
  .lr-note-count {
    font: 500 11px/1 var(--fn);
    color: var(--mu2);
    text-align: right;
    margin-top: 4px;
  }

  /* Bouton valider */
  .lr-btn-save {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, var(--a), #8b5cf6);
    border: none;
    border-radius: var(--r);
    color: #fff;
    font: 700 15px/1 var(--fd);
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(99,102,241,.35);
    transition: all .2s;
    min-height: 50px;
  }
  .lr-btn-save:disabled {
    opacity: .45;
    cursor: not-allowed;
    box-shadow: none;
  }
  .lr-btn-save:not(:disabled):hover { box-shadow: 0 6px 22px rgba(99,102,241,.45); }
  .lr-btn-save:not(:disabled):active { transform: scale(.98); }

  /* Skeleton */
  .lr-skel { display: flex; flex-direction: column; gap: 16px; padding: 16px; }
  .lr-skel-hd { height: 80px; background: var(--su); border-radius: var(--rl); animation: lr-pulse 1.4s ease-in-out infinite; }
  .lr-skel-bloc { height: 200px; background: var(--su); border-radius: var(--rl); animation: lr-pulse 1.4s ease-in-out infinite; animation-delay: .1s; }
  @keyframes lr-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }

  /* Message erreur */
  .lr-err {
    padding: 60px 20px;
    text-align: center;
    color: var(--mu);
    font: 500 14px/1.6 var(--fb);
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
          <p class="lr-title">Livret REMC — ${prenomNom || 'Élève'}</p>
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
    </div>
  `;

  wireMain();
}

function renderMonde(cat) {
  const col = MONDE_COLORS[cat.id] || MONDE_COLORS.C1;
  const acquis = cat.subs.filter(s => (_validationsMap[s.c]?.statut) === 'acquis').length;
  const pct = cat.subs.length > 0 ? Math.round((acquis / cat.subs.length) * 100) : 0;

  return `
    <div class="lr-monde">
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
         role="button" tabindex="0" aria-label="Évaluer ${esc(sub.n)}">
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
            ${renderStatutBtn('acquis',         '✅', 'Acquis')}
            ${renderStatutBtn('en_cours',       '🔄', 'En cours')}
            ${renderStatutBtn('a_retravailler', '⚠️', 'À retravailler')}
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
    await sb.from('notifications').insert({
      user_id: _eleveId,
      type: 'post_validation_quiz',
      title: 'Compétence validée ! 🎯',
      body: `${_sheetComp.n} — Fais le quiz en 30 sec`,
      data: { competence_id: _sheetComp.c },
      read: false,
    });
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
