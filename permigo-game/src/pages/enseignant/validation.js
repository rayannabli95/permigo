// ═══════════════════════════════════════════════════════════════
// Enseignant — Valider une compétence REMC pour un élève
// Flow: Choisir élève → Choisir compétence → Confirmer → Notif quiz
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { REMC } from '@/data/remc.js';
import { labelComp } from '@/utils/remc-label.js';
import { showXpToast } from '@/components/xp-toast.js';

// Liste plate des compétences REMC dans l'ordre (C1a → C4g)
const ORDERED_COMPS = REMC.flatMap(c => c.subs.map(s => s.c));

/**
 * Retourne la prochaine compétence à valider dans l'ordre REMC,
 * compte tenu de celles déjà acquises. Le moniteur ne peut valider QUE celle-ci.
 * @param {Set<string>} validatedIds
 * @returns {string|null}
 */
function getNextUnlockable(validatedIds) {
  return ORDERED_COMPS.find(c => !validatedIds.has(c)) || null;
}

// ─── CSS ────────────────────────────────────────────────────────
const STYLE = `<style>
  .vp {
    padding: 20px 16px 120px;
    max-width: 580px;
    margin: 0 auto;
    background: #f8f9fc;
    font-family: 'Inter', sans-serif;
    color: #0a0d1a;
  }
  .vp-hd { margin-bottom: 24px; }
  .vp-h1 { font: 700 26px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; margin: 0 0 6px; }
  .vp-sub { font: 500 14px/1.4 'Inter', sans-serif; color: #94a3b8; margin: 0; }

  .step { margin-bottom: 32px; }
  .step-lbl {
    font: 600 11px/1 'Inter', sans-serif;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 6px;
  }
  .step-ttl {
    font: 700 18px/1.3 'Plus Jakarta Sans', sans-serif;
    color: #0a0d1a;
    margin: 0 0 16px;
    display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
  }
  .step-progress {
    font: 600 12px/1 'Inter', sans-serif;
    color: #10b981;
    background: rgba(16,185,129,.1);
    border-radius: 12px;
    padding: 4px 10px;
  }

  /* Élèves */
  .eleves-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
  .eleve-card {
    padding: 16px 10px;
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
    cursor: pointer;
    text-align: center;
    transition: border-color .15s, transform .15s;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  }
  .eleve-card:hover { border-color: #6366f1; }
  .eleve-card:active { transform: scale(.96); }
  .eleve-card.selected { background: rgba(99,102,241,.06); border-color: #6366f1; }
  .eleve-av {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: #6366f1;
    margin: 0 auto 10px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font: 600 18px/1 'Plus Jakarta Sans', sans-serif;
  }
  .eleve-prenom { font: 600 13px/1.2 'Inter', sans-serif; color: #0a0d1a; margin-bottom: 4px; }
  .eleve-hrs { font: 500 11px/1 'Inter', sans-serif; color: #94a3b8; }

  /* Catégories */
  .comp-sections { display: flex; flex-direction: column; gap: 12px; }
  .cat-section {
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  }
  .cat-section.cat-done { border-color: rgba(16,185,129,.35); }
  .cat-hd { display: flex; align-items: center; gap: 10px; padding: 16px; border-bottom: 1px solid #f0f2f8; }
  .cat-done .cat-hd { background: rgba(16,185,129,.04); }
  .cat-ico { font-size: 18px; line-height: 1; }
  .cat-nm { font: 600 14px/1 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; flex: 1; }
  .cat-cnt { font: 600 12px/1 'Inter', sans-serif; color: #94a3b8; }

  /* Compétences */
  .comp-list { display: flex; flex-direction: column; }
  .comp-row {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f0f2f8;
    transition: background .15s;
  }
  .comp-row:last-child { border-bottom: none; }
  .comp-row:not(.comp-done):hover { background: rgba(99,102,241,.04); }
  .comp-row:active { transform: scale(.99); }
  .comp-row.comp-done { opacity: .5; cursor: default; }
  .comp-row.comp-sel { background: rgba(99,102,241,.06); }
  .comp-row.comp-next { background: rgba(99,102,241,.04); border-left: 3px solid #6366f1; }
  .comp-row.comp-next:hover { background: rgba(99,102,241,.08); }
  .comp-row.comp-locked { opacity: .5; cursor: not-allowed; background: #f8f9fc; }
  .comp-row.comp-locked .comp-code,
  .comp-row.comp-locked .comp-nom { color: #94a3b8; }
  .comp-row.comp-locked:hover { background: #f8f9fc; }
  .badge-next {
    font: 600 11px/1 'Inter', sans-serif;
    color: #6366f1;
    background: rgba(99,102,241,.1);
    padding: 5px 10px;
    border-radius: 99px;
    white-space: nowrap;
  }
  .badge-lock {
    font: 600 12px/1 'Inter', sans-serif;
    color: #cbd5e1;
    padding: 5px 8px;
  }
  .comp-code {
    font: 600 11px/1 'Inter', sans-serif;
    color: #6366f1;
    background: rgba(99,102,241,.1);
    border-radius: 6px;
    padding: 4px 7px;
    flex-shrink: 0;
  }
  .comp-nom { font: 500 13px/1.4 'Inter', sans-serif; color: #0a0d1a; flex: 1; }
  .comp-status { flex-shrink: 0; }
  .badge-ok { font: 600 11px/1 'Inter', sans-serif; color: #059669; background: rgba(16,185,129,.1); border-radius: 12px; padding: 3px 8px; }
  .badge-sel { font: 600 11px/1 'Inter', sans-serif; color: #6366f1; background: rgba(99,102,241,.1); border-radius: 12px; padding: 3px 8px; }

  /* CTA sticky */
  .cta-slot {
    position: fixed; bottom: 0; left: 0; right: 0;
    z-index: 100;
    padding: 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
    background: rgba(248,249,252,.95);
    backdrop-filter: blur(16px);
    border-top: 1px solid #e2e6f2;
    animation: ctaUp .25s ease;
  }
  @keyframes ctaUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .cta-strip { display: flex; align-items: center; gap: 16px; max-width: 580px; margin: 0 auto; }
  .cta-info { flex: 1; min-width: 0; }
  .cta-comp-nm {
    font: 600 14px/1.3 'Inter', sans-serif;
    color: #0a0d1a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cta-for { font: 500 12px/1 'Inter', sans-serif; color: #94a3b8; margin-top: 4px; }
  .btn-validate {
    padding: 14px 22px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: 0;
    border-radius: 12px;
    color: #fff;
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    white-space: nowrap;
    transition: transform .15s, opacity .15s;
    flex-shrink: 0;
    min-height: 44px;
  }
  .btn-validate:disabled { opacity: .5; cursor: not-allowed; }
  .btn-validate:not(:disabled):active { transform: scale(.97); opacity: .9; }

  .empty { padding: 40px 20px; text-align: center; color: #94a3b8; font: 500 14px/1.5 'Inter', sans-serif; }
  .v-loading { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
</style>`;

// Module-level state (reset à chaque mount)
let _root, _me;
let _eleves = [];
let _eleve = null;
let _validatedIds = new Set();
let _selectedComp = null; // { c: string, n: string }

// ─── Entry point ────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  track('page.view', { page: 'enseignant_validation' });

  _eleve = null;
  _selectedComp = null;
  _validatedIds = new Set();

  root.innerHTML = `<div class="v-loading"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  const { data, error } = await sb
    .from('profiles')
    .select('id, prenom, nom_initial, credit_heures')
    .eq('enseignant_id', _me.id)
    .eq('role', 'eleve')
    .order('prenom');

  if (error) { toast('Impossible de charger vos élèves', 'error'); return; }
  _eleves = data || [];

  render();
  wire();
}

// ─── Actions ────────────────────────────────────────────────────
async function selectEleve(eleve) {
  if (_eleve?.id === eleve.id) return;
  _eleve = eleve;
  _selectedComp = null;

  // Charger les validations existantes de cet élève
  const { data } = await sb
    .from('validations')
    .select('competence_id')
    .eq('eleve_id', eleve.id);

  _validatedIds = new Set((data || []).map(v => v.competence_id));

  render();
  wire();
  // Amener step 2 en vue
  requestAnimationFrame(() =>
    _root.querySelector('.step-2')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  );
}

function selectComp(compId, compNom) {
  if (_validatedIds.has(compId)) return;

  // Règle pédagogique : on ne valide que la prochaine comp dans l'ordre REMC
  const nextUnlock = getNextUnlockable(_validatedIds);
  if (compId !== nextUnlock) {
    const idx = ORDERED_COMPS.indexOf(compId);
    const required = ORDERED_COMPS.slice(0, idx).find(c => !_validatedIds.has(c)) || nextUnlock;
    toast(`Valide d'abord ${required} avant ${compId}`, 'info', 3500);
    return;
  }

  const clickedSame = _selectedComp?.c === compId;
  _selectedComp = clickedSame ? null : { c: compId, n: compNom };

  // Partial DOM update — évite un full re-render + perte de scroll
  _root.querySelectorAll('[data-comp-id]').forEach(el => {
    el.classList.toggle('comp-sel', el.dataset.compId === _selectedComp?.c);
  });
  renderCta();
}

async function doValidate() {
  if (!_eleve || !_selectedComp) return;

  const btn = _root.querySelector('.btn-validate');
  if (btn) { btn.disabled = true; btn.textContent = 'En cours…'; }

  const { error } = await sb.from('validations').upsert(
    {
      eleve_id: _eleve.id,
      competence_id: _selectedComp.c,
      validated_by: _me.id,
      statut: 'acquis',
    },
    { onConflict: 'eleve_id,competence_id' }
  );

  if (error) {
    toast('Erreur lors de la validation', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmer ✓'; }
    return;
  }

  // Déclenche le quiz post-validation côté élève
  await sb.from('notifications').insert({
    user_id: _eleve.id,
    type: 'post_validation_quiz',
    title: 'Compétence validée !',
    body: `${_selectedComp.n} — Fais le quiz en 30 sec`,
    data: { competence_id: _selectedComp.c },
  });

  track('competence.validated', {
    competence_id: _selectedComp.c,
    eleve_id: _eleve.id,
    auto_ecole_id: _me.auto_ecole_id,
  });

  // Feedback haptique + toast riche avec avatar élève
  const { haptic } = await import('@/utils/haptic.js');
  const { toastAvatar } = await import('@/components/toast.js');
  haptic('success');

  const prenom = _eleve.prenom || '';
  const nom = _eleve.nom || '';
  const ini = ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '?';
  toastAvatar({
    title: `${prenom} ${nom}`.trim() + ' — validée',
    sub: `${_selectedComp.c} · ${_selectedComp.n}`,
    initials: ini,
    color: '#6366f1',
    type: 'success',
    duration: 4000,
  });

  // Fetch updated XP (after trigger ran) → show XP toast
  const eleveName = _eleve.prenom || 'Élève';
  const compNom = _selectedComp.n;
  const { data: updatedProfile } = await sb
    .from('profiles')
    .select('xp')
    .eq('id', _me.id)
    .single();
  if (updatedProfile) {
    track('xp.gained', { amount: 25, source: 'validation' });
    showXpToast({ xp: 25, eleveName: eleveName });
  }

  _validatedIds.add(_selectedComp.c);
  _selectedComp = null;

  render();
  wire();
}

// ─── Render ─────────────────────────────────────────────────────
function render() {
  _root.innerHTML = `
    ${STYLE}
    <div class="vp anim-slide-up">
      <header class="vp-hd">
        <h1 class="vp-h1">Valider une compétence</h1>
        <p class="vp-sub">L'élève reçoit le quiz instantanément après validation.</p>
      </header>

      <section class="step step-1">
        <div class="step-lbl">Étape 1</div>
        <div class="step-ttl">Choisir un élève</div>
        ${_eleves.length === 0
          ? `<div class="empty">Aucun élève n'est encore assigné à votre compte.</div>`
          : `<div class="eleves-grid">${_eleves.map(renderEleveCard).join('')}</div>`
        }
      </section>

      ${_eleve ? `
        <section class="step step-2">
          <div class="step-lbl">Étape 2</div>
          <div class="step-ttl">
            Compétence travaillée avec
            <strong>${esc(_eleve.prenom)}</strong>
            <span class="step-progress">${_validatedIds.size}/31 acquises</span>
          </div>
          <div class="comp-sections">
            ${REMC.map(renderCategory).join('')}
          </div>
        </section>
      ` : ''}

      <div class="cta-slot"></div>
    </div>
  `;
  renderCta();
}

function renderEleveCard(eleve) {
  const initials = (eleve.prenom?.[0] || '') + (eleve.nom_initial?.replace('.', '') || '');
  const selected = _eleve?.id === eleve.id;
  return `
    <div class="eleve-card${selected ? ' selected' : ''}" data-eleve-id="${esc(eleve.id)}">
      <div class="eleve-av">${esc(initials || '?')}</div>
      <div class="eleve-prenom">${esc(eleve.prenom || '—')}</div>
      ${eleve.credit_heures != null
        ? `<div class="eleve-hrs">${esc(String(eleve.credit_heures))}h restantes</div>`
        : ''}
    </div>
  `;
}

function renderCategory(cat) {
  const doneCount = cat.subs.filter(s => _validatedIds.has(s.c)).length;
  const allDone = doneCount === cat.subs.length;
  const nextUnlock = getNextUnlockable(_validatedIds);
  return `
    <div class="cat-section${allDone ? ' cat-done' : ''}">
      <div class="cat-hd">
        <span class="cat-ico">${cat.ico}</span>
        <span class="cat-nm">${esc(cat.name)}</span>
        <span class="cat-cnt">${doneCount}/${cat.subs.length}</span>
      </div>
      <div class="comp-list">
        ${cat.subs.map(sub => {
          const done = _validatedIds.has(sub.c);
          const isNext = !done && sub.c === nextUnlock;
          const locked = !done && !isNext;
          const sel = _selectedComp?.c === sub.c;
          const cls = [
            done   && 'comp-done',
            locked && 'comp-locked',
            isNext && 'comp-next',
            sel    && 'comp-sel',
          ].filter(Boolean).join(' ');
          let badge = '';
          if (done)        badge = '<span class="badge-ok">✓ Acquis</span>';
          else if (sel)    badge = '<span class="badge-sel">Sélectionné</span>';
          else if (isNext) badge = '<span class="badge-next">À valider</span>';
          else             badge = '<span class="badge-lock">🔒</span>';
          return `
            <div class="comp-row ${cls}"
              data-comp-id="${esc(sub.c)}" data-comp-nom="${esc(sub.n)}"
              ${locked ? 'aria-disabled="true"' : ''}>
              <span class="comp-code">${esc(sub.c)}</span>
              <span class="comp-nom">${esc(sub.n)}</span>
              <span class="comp-status">${badge}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderCta() {
  const slot = _root?.querySelector('.cta-slot');
  if (!slot) return;
  if (!_selectedComp) { slot.innerHTML = ''; return; }
  slot.innerHTML = `
    <div class="cta-strip">
      <div class="cta-info">
        <div class="cta-comp-nm">${esc(labelComp(_selectedComp.c))}</div>
        <div class="cta-for">pour <strong>${esc(_eleve?.prenom || '')}</strong></div>
      </div>
      <button class="btn-validate">Confirmer ✓</button>
    </div>
  `;
  slot.querySelector('.btn-validate').addEventListener('click', doValidate);
}

// ─── Event wiring ────────────────────────────────────────────────
function wire() {
  _root.querySelectorAll('[data-eleve-id]').forEach(el =>
    el.addEventListener('click', () => {
      const eleve = _eleves.find(e => e.id === el.dataset.eleveId);
      if (eleve) selectEleve(eleve);
    })
  );

  _root.querySelectorAll('[data-comp-id]').forEach(el =>
    el.addEventListener('click', () =>
      selectComp(el.dataset.compId, el.dataset.compNom)
    )
  );
}

