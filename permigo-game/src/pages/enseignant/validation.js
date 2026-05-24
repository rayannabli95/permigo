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
import { badge, Badges } from '@/components/badge.js';
import { icon } from '@/utils/icons.js';
import { navigate } from '@/router.js';

// Liste plate des compétences REMC dans l'ordre (C1a → C4g)
const ORDERED_COMPS = REMC.flatMap(c => c.subs.map(s => s.c));

/**
 * Retourne la prochaine compétence à valider dans l'ordre REMC,
 * compte tenu de celles déjà acquises. Le moniteur ne peut valider QUE celle-ci.
 * @param {Set<string>} validatedIds
 * @returns {string|null}
 */
function getNextUnlockable(validatedIds, aValiderIds = new Set()) {
  return ORDERED_COMPS.find(c => !validatedIds.has(c) && !aValiderIds.has(c)) || null;
}

// ─── CSS ────────────────────────────────────────────────────────
const STYLE = `<style>
  .vp {
    padding: 20px 16px 120px;
    max-width: 580px;
    margin: 0 auto;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--ink);
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
    color: var(--ink);
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
    background: var(--su);
    border: 1.5px solid var(--bo);
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

  /* Catégories */
  .comp-sections { display: flex; flex-direction: column; gap: 12px; }
  .cat-section {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  }
  .cat-section.cat-done { border-color: rgba(16,185,129,.35); }
  .cat-hd { display: flex; align-items: center; gap: 10px; padding: 16px; border-bottom: 1px solid var(--bo2); }
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
    border-bottom: 1px solid var(--bo2);
    transition: background .15s;
  }
  .comp-row:last-child { border-bottom: none; }
  .comp-row:not(.comp-done):hover { background: rgba(99,102,241,.04); }
  .comp-row:active { transform: scale(.99); }
  .comp-row.comp-done { opacity: .5; cursor: default; }
  .comp-row.comp-sel { background: rgba(99,102,241,.06); }
  .comp-row.comp-next { background: rgba(99,102,241,.04); border-left: 3px solid #6366f1; }
  .comp-row.comp-next:hover { background: rgba(99,102,241,.08); }
  .comp-row.comp-locked { opacity: .5; cursor: not-allowed; background: var(--bg); }
  .comp-row.comp-locked .comp-code,
  .comp-row.comp-locked .comp-nom { color: #94a3b8; }
  .comp-row.comp-locked:hover { background: var(--bg); }
  .comp-row.comp-a-valider { background: rgba(245,158,11,.04); cursor: not-allowed; border-left: 3px solid #f59e0b; }
  .comp-row.comp-a-valider:hover { background: rgba(245,158,11,.06); }
  .comp-row.comp-a-valider .comp-code { color: #d97706; background: rgba(245,158,11,.12); }
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
    border-top: 1px solid var(--bo);
    animation: ctaUp .25s ease;
  }
  @keyframes ctaUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .cta-strip { display: flex; align-items: center; gap: 16px; max-width: 580px; margin: 0 auto; }
  .cta-info { flex: 1; min-width: 0; }
  .cta-comp-nm {
    font: 600 14px/1.3 'Inter', sans-serif;
    color: var(--ink);
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
  .btn-cancel-cta {
    width: 40px; height: 40px;
    border: 1.5px solid var(--bo);
    border-radius: 10px;
    background: var(--su);
    color: var(--ink);
    font-size: 16px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: background .12s, color .12s;
    font-family: inherit;
  }
  .btn-cancel-cta:active { background: var(--bg2); }

  .empty { padding: 40px 20px; text-align: center; color: #94a3b8; font: 500 14px/1.5 'Inter', sans-serif; }
  .v-loading { padding: 20px; display: flex; flex-direction: column; gap: 12px; }

</style>`;

// Module-level state (reset à chaque mount)
let _root, _me;
let _eleves = [];
let _eleve = null;
let _validatedIds = new Set();
let _aValiderIds  = new Set();
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
  _aValiderIds  = new Set();

  root.innerHTML = `<div class="v-loading"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  const { data, error } = await sb
    .from('profiles')
    .select('id, prenom, nom_initial')
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
  if (_eleve?.id === eleve.id) {
    // Re-tap on selected → deselect and go back to step 1
    _eleve = null;
    _selectedComp = null;
    render();
    wire();
    return;
  }
  _eleve = eleve;
  _selectedComp = null;

  // Charger les validations existantes de cet élève (avec garde-fou réseau)
  try {
    const { data, error } = await sb
      .from('validations')
      .select('competence_id, statut')
      .eq('eleve_id', eleve.id);

    if (error) throw error;
    _validatedIds = new Set((data || []).filter(v => v.statut === 'acquis').map(v => v.competence_id));
    _aValiderIds  = new Set((data || []).filter(v => v.statut === 'a_valider').map(v => v.competence_id));
  } catch (e) {
    console.error('[selectEleve] fetch validations failed', e);
    toast('Impossible de charger les compétences de l\'élève', 'error');
    _validatedIds = new Set();
    _aValiderIds  = new Set();
  }

  render();
  wire();
  // Amener step 2 en vue
  requestAnimationFrame(() =>
    _root.querySelector('.step-2')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  );
}

function selectComp(compId, compNom) {
  if (_validatedIds.has(compId) || _aValiderIds.has(compId)) return;

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

  // Moniteur = source de vérité : la compétence est VALIDÉE immédiatement (acquis).
  // Le quiz élève est désormais un rappel optionnel, il ne conditionne plus rien.
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
    if (btn) { btn.disabled = false; btn.textContent = 'Valider ✓'; }
    return;
  }

  // Invite l'élève à un quiz-récap OPTIONNEL (notif). La compétence est déjà acquise ;
  // faire le quiz ne change pas son statut (already_acquired) — c'est juste un rappel.
  // Via RPC SECURITY DEFINER : la policy notifications_insert interdit d'insérer
  // une notif pour autrui, donc le moniteur ne peut pas notifier l'élève en direct.
  const { error: errNotif } = await sb.rpc('send_quiz_notification', {
    p_eleve_id: _eleve.id,
    p_competence_id: _selectedComp.c,
    p_comp_nom: _selectedComp.n,
  });
  if (errNotif) {
    // La validation est OK, mais l'élève ne recevra pas l'invitation quiz-récap
    console.error('[validation] send_quiz_notification failed', errNotif);
    toast('Validé, mais invitation quiz non envoyée', 'warning');
  }

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
    title: `${prenom} ${nom}`.trim() + ' — compétence validée',
    sub: `${_selectedComp.c} · ${_selectedComp.n}`,
    initials: ini,
    color: '#6366f1',
    type: 'success',
    duration: 4000,
  });

  // XP moniteur crédité immédiatement par le trigger credit_xp_moniteur_on_validation
  // (INSERT/UPDATE statut='acquis'). Le quiz élève ne crédite plus la validation.

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
        <p class="vp-sub">Tu valides la compétence — l'élève reçoit une invitation à un quiz-récap optionnel.</p>
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
    <div class="eleve-card${selected ? ' selected' : ''}" data-eleve-id="${esc(eleve.id)}"
         role="button" tabindex="0"
         aria-label="${esc(eleve.prenom || '—')} ${esc(eleve.nom_initial || '')}"
         aria-pressed="${selected}">
      <div class="eleve-av" aria-hidden="true">${esc(initials || '?')}</div>
      <div class="eleve-prenom">${esc(eleve.prenom || '—')}</div>
    </div>
  `;
}

function renderCategory(cat) {
  const doneCount = cat.subs.filter(s => _validatedIds.has(s.c)).length;
  const allDone = doneCount === cat.subs.length;
  const nextUnlock = getNextUnlockable(_validatedIds, _aValiderIds);
  return `
    <div class="cat-section${allDone ? ' cat-done' : ''}">
      <div class="cat-hd">
        <span class="cat-ico">${cat.ico}</span>
        <span class="cat-nm">${esc(cat.name)}</span>
        <span class="cat-cnt">${doneCount}/${cat.subs.length}</span>
      </div>
      <div class="comp-list">
        ${cat.subs.map(sub => {
          const done    = _validatedIds.has(sub.c);
          const pending = _aValiderIds.has(sub.c);
          const isNext  = !done && !pending && sub.c === nextUnlock;
          const sel     = _selectedComp?.c === sub.c;
          const cls = [
            done    && 'comp-done',
            pending && 'comp-a-valider',
            isNext  && 'comp-next',
            sel     && 'comp-sel',
          ].filter(Boolean).join(' ');
          let badgeHtml = '';
          if (done)         badgeHtml = Badges.acquis();
          else if (pending) badgeHtml = Badges.acquis();
          else if (sel)     badgeHtml = badge('Sélectionné', { variant: 'primary', appearance: 'light', size: 'sm', shape: 'circle', dot: true });
          else if (isNext)  badgeHtml = Badges.toValidate();
          else              badgeHtml = badge('À valider', { variant: 'secondary', appearance: 'light', size: 'sm', shape: 'circle' });
          const isBlocked = done || pending;
          return `
            <div class="comp-row ${cls}"
              data-comp-id="${esc(sub.c)}" data-comp-nom="${esc(sub.n)}"
              ${isBlocked ? `aria-disabled="true" aria-label="${esc(sub.n)}"` : `role="button" tabindex="0" aria-label="${esc(sub.n)}" aria-pressed="${sel}"`}>
              <span class="comp-code">${esc(sub.c)}</span>
              <span class="comp-nom">${esc(sub.n)}</span>
              <span class="comp-status">${badgeHtml}</span>
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
      <button class="btn-cancel-cta" type="button" id="btn-cancel-cta" aria-label="Annuler">✕</button>
      <div class="cta-info">
        <div class="cta-comp-nm">${esc(labelComp(_selectedComp.c))}</div>
        <div class="cta-for">pour <strong>${esc(_eleve?.prenom || '')}</strong></div>
      </div>
      <button class="btn-validate" type="button">Valider ✓</button>
    </div>
  `;
  slot.querySelector('.btn-validate').addEventListener('click', doValidate);
  slot.querySelector('#btn-cancel-cta').addEventListener('click', () => {
    _selectedComp = null;
    renderCta();
  });
}

// ─── Event wiring ────────────────────────────────────────────────
// Cleanup avant ré-attache pour éviter les listeners cumulés à chaque render
function wire() {
  // Clone-replace pour réinitialiser les listeners sur chaque élément
  _root.querySelectorAll('[data-eleve-id]').forEach(el => {
    const fresh = el.cloneNode(true);
    el.parentNode?.replaceChild(fresh, el);
    const act = () => {
      const eleve = _eleves.find(e => e.id === fresh.dataset.eleveId);
      if (eleve) selectEleve(eleve);
    };
    fresh.addEventListener('click', act);
    fresh.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
    });
  });

  _root.querySelectorAll('[data-comp-id]').forEach(el => {
    const fresh = el.cloneNode(true);
    el.parentNode?.replaceChild(fresh, el);
    if (fresh.getAttribute('aria-disabled') === 'true') return;
    const act = () => selectComp(fresh.dataset.compId, fresh.dataset.compNom);
    fresh.addEventListener('click', act);
    fresh.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
    });
  });
}


