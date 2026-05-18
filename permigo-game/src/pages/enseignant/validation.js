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
import { badge, Badges } from '@/components/badge.js';
import { icon } from '@/utils/icons.js';

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
  .btn-cancel-cta {
    width: 40px; height: 40px;
    border: 1.5px solid #e2e6f2;
    border-radius: 10px;
    background: #fff;
    color: #64748b;
    font-size: 16px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: background .12s, color .12s;
    font-family: inherit;
  }
  .btn-cancel-cta:active { background: #f0f2f8; color: #0a0d1a; }

  .empty { padding: 40px 20px; text-align: center; color: #94a3b8; font: 500 14px/1.5 'Inter', sans-serif; }
  .v-loading { padding: 20px; display: flex; flex-direction: column; gap: 12px; }

  /* Bouton mode rapide */
  .btn-mode-rapide {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(99,102,241,.08);
    border: 1.5px solid rgba(99,102,241,.2);
    border-radius: 10px;
    color: #6366f1;
    font: 600 13px/1 'Inter', sans-serif;
    cursor: pointer;
    transition: background .15s cubic-bezier(.23,1,.32,1),
                transform .15s cubic-bezier(.23,1,.32,1);
    min-height: 36px;
    flex-shrink: 0;
  }
  @media (hover: hover) and (pointer: fine) {
    .btn-mode-rapide:hover { background: rgba(99,102,241,.14); }
  }
  .btn-mode-rapide:active { transform: scale(.97); }

  /* Modal mode rapide */
  .mr-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(10,13,26,.45);
    backdrop-filter: blur(4px);
    display: flex; align-items: flex-end;
    animation: mrFadeIn .2s cubic-bezier(.23,1,.32,1);
  }
  @keyframes mrFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .mr-overlay { animation: none; } }

  .mr-sheet {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: #fff;
    border-radius: 24px 24px 0 0;
    padding: 20px 20px max(20px, env(safe-area-inset-bottom));
    max-height: 85dvh;
    overflow-y: auto;
    animation: mrSheetUp .3s cubic-bezier(.32,.72,0,1);
  }
  @keyframes mrSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .mr-sheet { animation: none; } }

  .mr-handle {
    width: 36px; height: 4px;
    background: #e2e6f2;
    border-radius: 2px;
    margin: 0 auto 16px;
  }
  .mr-h2 {
    font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #0a0d1a;
    margin: 0 0 4px;
  }
  .mr-sub {
    font: 500 13px/1.4 'Inter', sans-serif;
    color: #94a3b8;
    margin: 0 0 16px;
  }
  .mr-section-lbl {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: #94a3b8;
    margin: 16px 0 8px;
  }

  /* Checkboxes élèves */
  .mr-eleve-check {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #f8f9fc;
    border: 1.5px solid #e2e6f2;
    border-radius: 12px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: border-color .15s cubic-bezier(.23,1,.32,1);
    min-height: 44px;
  }
  .mr-eleve-check.checked { border-color: #6366f1; background: rgba(99,102,241,.04); }
  @media (hover: hover) and (pointer: fine) {
    .mr-eleve-check:hover { border-color: #6366f1; }
  }
  .mr-cb {
    width: 20px; height: 20px;
    border: 2px solid #cbd5e1;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: background .12s, border-color .12s;
    color: #fff;
    font-size: 12px;
  }
  .mr-eleve-check.checked .mr-cb { background: #6366f1; border-color: #6366f1; }
  .mr-eleve-nm {
    font: 500 14px/1.2 'Inter', sans-serif;
    color: #0a0d1a;
    flex: 1;
  }
  .mr-eleve-next {
    font: 500 11px/1 'Inter', sans-serif;
    color: #94a3b8;
    text-align: right;
  }

  /* Comp grid mode rapide */
  .mr-comp-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid #f0f2f8;
    cursor: pointer;
    transition: background .12s;
    min-height: 44px;
  }
  .mr-comp-row:last-child { border-bottom: none; }
  .mr-comp-row.mr-comp-sel { background: rgba(99,102,241,.06); }
  .mr-comp-row.mr-comp-locked { opacity: .45; cursor: not-allowed; }
  .mr-comp-code {
    font: 600 11px/1 'IBM Plex Mono', monospace;
    color: #6366f1;
    background: rgba(99,102,241,.1);
    padding: 3px 6px;
    border-radius: 5px;
    flex-shrink: 0;
  }
  .mr-comp-nm { font: 500 13px/1.3 'Inter', sans-serif; color: #0a0d1a; flex: 1; }
  .mr-comp-eligible {
    font: 600 11px/1 'Inter', sans-serif;
    color: #10b981;
    background: rgba(16,185,129,.1);
    padding: 2px 7px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  /* CTA batch */
  .mr-cta {
    position: sticky; bottom: 0;
    background: #fff;
    padding: 12px 0 0;
    margin-top: 16px;
    border-top: 1px solid #f0f2f8;
  }
  .mr-btn-validate {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 12px;
    color: #fff;
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    min-height: 48px;
    transition: transform .15s cubic-bezier(.23,1,.32,1), opacity .15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .mr-btn-validate:disabled { opacity: .45; cursor: not-allowed; }
  .mr-btn-validate:not(:disabled):active { transform: scale(.97); opacity: .9; }
  .mr-count-badge {
    background: rgba(255,255,255,.25);
    border-radius: 8px;
    padding: 2px 8px;
    font: 700 14px/1 'IBM Plex Mono', monospace;
  }

  /* Confirmation dialog */
  .mr-confirm-overlay {
    position: fixed; inset: 0; z-index: 600;
    background: rgba(10,13,26,.6);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: mrFadeIn .15s cubic-bezier(.23,1,.32,1);
  }
  .mr-confirm-box {
    background: #fff;
    border-radius: 20px;
    padding: 24px;
    width: 100%;
    max-width: 360px;
    animation: mrConfirmIn .2s cubic-bezier(.23,1,.32,1);
  }
  @keyframes mrConfirmIn {
    from { opacity: 0; transform: scale(.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  .mr-confirm-ttl { font: 700 17px/1.3 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; margin: 0 0 8px; }
  .mr-confirm-txt { font: 400 13px/1.6 'Inter', sans-serif; color: #64748b; margin: 0 0 20px; }
  .mr-confirm-actions { display: flex; gap: 10px; }
  .mr-confirm-cancel {
    flex: 1; padding: 12px; border: 1.5px solid #e2e6f2;
    border-radius: 10px; background: #fff;
    font: 600 14px/1 'Inter', sans-serif; color: #64748b;
    cursor: pointer; min-height: 44px;
    transition: background .12s;
  }
  .mr-confirm-ok {
    flex: 2; padding: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none; border-radius: 10px;
    color: #fff; font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; min-height: 44px;
    transition: transform .15s cubic-bezier(.23,1,.32,1), opacity .15s;
  }
  .mr-confirm-ok:active { transform: scale(.97); opacity: .9; }
</style>`;

// Module-level state (reset à chaque mount)
let _root, _me;
let _eleves = [];
let _eleve = null;
let _validatedIds = new Set();
let _selectedComp = null; // { c: string, n: string }

// Mode rapide state
let _mrSelectedEleves = new Set();  // IDs
let _mrSelectedComp = null;         // { c, n }
let _mrValidatedMap = {};           // eleveId → Set<compId>

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
      .select('competence_id')
      .eq('eleve_id', eleve.id);

    if (error) throw error;
    _validatedIds = new Set((data || []).map(v => v.competence_id));
  } catch (e) {
    console.error('[selectEleve] fetch validations failed', e);
    toast('Impossible de charger les compétences de l\'élève', 'error');
    _validatedIds = new Set(); // continue avec set vide pour pas bloquer l'UI
  }

  render();
  wire();
  // Amener step 2 en vue
  requestAnimationFrame(() =>
    _root.querySelector('.step-2')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  );
}

function selectComp(compId, compNom) {
  if (_validatedIds.has(compId)) return;

  // Règle pédagogique REMC : on ne valide que dans l'ordre
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
  const { error: errNotif } = await sb.from('notifications').insert({
    user_id: _eleve.id,
    type: 'post_validation_quiz',
    title: 'Compétence validée !',
    body: `${_selectedComp.n} — Fais le quiz en 30 sec`,
    data: { competence_id: _selectedComp.c },
  });
  if (errNotif) {
    // La validation est OK, mais l'élève ne recevra pas le déclencheur quiz
    console.error('[validation] notification insert failed', errNotif);
    toast('Validé, mais notification non envoyée', 'warning');
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
      <header class="vp-hd" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div>
          <h1 class="vp-h1">Valider une compétence</h1>
          <p class="vp-sub">L'élève reçoit le quiz instantanément après validation.</p>
        </div>
        <button class="btn-mode-rapide" id="btn-mode-rapide" type="button" aria-label="Mode validation rapide multi-élèves"
                style="display:flex;align-items:center;gap:6px;">
          ${icon('zap', { size: 15, strokeWidth: 2.2 })} Mode rapide
        </button>
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
          // Badges via le composant unifié
          let badgeHtml = '';
          if (done)        badgeHtml = Badges.acquis();
          else if (sel)    badgeHtml = badge('Sélectionné', { variant: 'primary', appearance: 'light', size: 'sm', shape: 'circle', dot: true });
          else if (isNext) badgeHtml = Badges.toValidate();
          else             badgeHtml = Badges.locked('Verrouillé');
          return `
            <div class="comp-row ${cls}"
              data-comp-id="${esc(sub.c)}" data-comp-nom="${esc(sub.n)}"
              ${locked ? 'aria-disabled="true" aria-label="Verrouillée — ' + esc(sub.n) + '"' : `role="button" tabindex="0" aria-label="${esc(sub.n)}" aria-pressed="${sel}"`}>
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
      <button class="btn-validate" type="button">Confirmer ✓</button>
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
  // Mode rapide button
  const mrBtn = _root.querySelector('#btn-mode-rapide');
  if (mrBtn) {
    mrBtn.addEventListener('click', () => openModeRapide());
  }

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

// ─── Mode rapide ─────────────────────────────────────────────────
async function openModeRapide() {
  if (_eleves.length === 0) {
    toast('Aucun élève assigné', 'info');
    return;
  }
  track('mode_rapide.open');

  // Reset state
  _mrSelectedEleves = new Set();
  _mrSelectedComp = null;
  _mrValidatedMap = {};

  // Pré-charger les validations de tous mes élèves
  const eleveIds = _eleves.map(e => e.id);
  const { data: existingVals } = await sb
    .from('validations')
    .select('eleve_id, competence_id')
    .in('eleve_id', eleveIds);

  (existingVals || []).forEach(v => {
    if (!_mrValidatedMap[v.eleve_id]) _mrValidatedMap[v.eleve_id] = new Set();
    _mrValidatedMap[v.eleve_id].add(v.competence_id);
  });

  _renderMrModal();
}

function _renderMrModal() {
  // Retire un modal existant
  document.querySelector('.mr-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'mr-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Mode validation rapide');

  overlay.innerHTML = `
    <div class="mr-sheet" id="mr-sheet">
      <div class="mr-handle" aria-hidden="true"></div>
      <h2 class="mr-h2" style="display:flex;align-items:center;gap:8px;">${icon('zap', { size: 18, strokeWidth: 2.2 })} Mode rapide</h2>
      <p class="mr-sub">Validez une compétence pour plusieurs élèves en une fois.</p>

      <div class="mr-section-lbl">Sélectionner des élèves</div>
      <div id="mr-eleves-list">
        ${_eleves.map(e => {
          const ini = ((e.prenom?.[0] || '') + (e.nom_initial?.replace('.','') || '')).toUpperCase() || '?';
          const nextComp = getNextUnlockable(_mrValidatedMap[e.id] || new Set());
          return `
            <div class="mr-eleve-check" data-eleve-id="${esc(e.id)}" role="checkbox" tabindex="0"
                 aria-checked="false" aria-label="${esc(e.prenom || '')} ${esc(e.nom_initial || '')}">
              <div class="mr-cb" aria-hidden="true"></div>
              <span class="mr-eleve-nm">${esc(e.prenom || '—')} ${esc(e.nom_initial || '')}</span>
              <span class="mr-eleve-next">${nextComp ? esc(nextComp) : 'Terminé'}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div id="mr-comp-section" style="display:none">
        <div class="mr-section-lbl">Compétence à valider</div>
        <div id="mr-comp-list"></div>
      </div>

      <div class="mr-cta">
        <button class="mr-btn-validate" id="mr-btn-confirm" type="button" disabled>
          Valider pour
          <span class="mr-count-badge" id="mr-count">0</span>
          élève(s)
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close on backdrop
  overlay.addEventListener('click', e => {
    if (e.target === overlay) _closeMrModal();
  });

  // Wire checkboxes
  overlay.querySelectorAll('.mr-eleve-check').forEach(row => {
    const toggle = () => {
      const id = row.dataset.eleveId;
      if (_mrSelectedEleves.has(id)) {
        _mrSelectedEleves.delete(id);
        row.classList.remove('checked');
        row.setAttribute('aria-checked', 'false');
      } else {
        _mrSelectedEleves.add(id);
        row.classList.add('checked');
        row.setAttribute('aria-checked', 'true');
      }
      _updateMrCompSection(overlay);
      _updateMrConfirmBtn(overlay);
    };
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  // Wire confirm
  overlay.querySelector('#mr-btn-confirm')?.addEventListener('click', () => _confirmMrValidation(overlay));
}

function _updateMrCompSection(overlay) {
  const section = overlay.querySelector('#mr-comp-section');
  const listEl  = overlay.querySelector('#mr-comp-list');
  if (!section || !listEl) return;

  if (_mrSelectedEleves.size === 0) {
    section.style.display = 'none';
    _mrSelectedComp = null;
    return;
  }
  section.style.display = 'block';

  // Calculer pour chaque comp combien d'élèves sélectionnés peuvent la recevoir
  const selectedIds = [..._mrSelectedEleves];
  const compEligibility = {};

  ORDERED_COMPS.forEach(compId => {
    const eligibleCount = selectedIds.filter(id => {
      const valSet = _mrValidatedMap[id] || new Set();
      return getNextUnlockable(valSet) === compId;
    }).length;
    if (eligibleCount > 0) compEligibility[compId] = eligibleCount;
  });

  // Afficher top 6 comps les plus éligibles
  const topComps = Object.entries(compEligibility)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (topComps.length === 0) {
    listEl.innerHTML = `<div style="padding:12px;font:500 13px/1.5 'Inter',sans-serif;color:#94a3b8">Ces élèves ont des parcours très différents. Sélectionnez un sous-ensemble compatible.</div>`;
    return;
  }

  // Construire la liste dans un container avec border
  listEl.innerHTML = `
    <div style="background:#fff;border:1.5px solid #e2e6f2;border-radius:16px;overflow:hidden">
      ${topComps.map(([compId, count]) => {
        const sel = _mrSelectedComp?.c === compId;
        return `
          <div class="mr-comp-row${sel ? ' mr-comp-sel' : ''}" data-comp-id="${esc(compId)}"
               role="radio" aria-checked="${sel}" tabindex="0" aria-label="${esc(labelComp(compId))}">
            <span class="mr-comp-code">${esc(compId)}</span>
            <span class="mr-comp-nm">${esc(labelComp(compId))}</span>
            <span class="mr-comp-eligible">${count}/${selectedIds.length}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  listEl.querySelectorAll('.mr-comp-row').forEach(row => {
    const toggle = () => {
      const compId = row.dataset.compId;
      _mrSelectedComp = _mrSelectedComp?.c === compId ? null : { c: compId, n: labelComp(compId) };
      listEl.querySelectorAll('.mr-comp-row').forEach(r => {
        const active = r.dataset.compId === _mrSelectedComp?.c;
        r.classList.toggle('mr-comp-sel', active);
        r.setAttribute('aria-checked', String(active));
      });
      _updateMrConfirmBtn(overlay);
    };
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
}

function _updateMrConfirmBtn(overlay) {
  const btn   = overlay.querySelector('#mr-btn-confirm');
  const badge = overlay.querySelector('#mr-count');
  if (!btn || !badge) return;

  if (!_mrSelectedComp || _mrSelectedEleves.size === 0) {
    btn.disabled = true;
    badge.textContent = '0';
    return;
  }

  // Compter les élèves éligibles pour cette comp
  const eligible = [..._mrSelectedEleves].filter(id => {
    const valSet = _mrValidatedMap[id] || new Set();
    return getNextUnlockable(valSet) === _mrSelectedComp.c;
  }).length;

  badge.textContent = String(eligible);
  btn.disabled = eligible === 0;
}

async function _confirmMrValidation(overlay) {
  if (!_mrSelectedComp || _mrSelectedEleves.size === 0) return;

  const eligibleIds = [..._mrSelectedEleves].filter(id => {
    const valSet = _mrValidatedMap[id] || new Set();
    return getNextUnlockable(valSet) === _mrSelectedComp.c;
  });

  if (eligibleIds.length === 0) {
    toast('Aucun élève éligible pour cette compétence', 'info');
    return;
  }

  // Confirmation dialog
  const confirmOverlay = document.createElement('div');
  confirmOverlay.className = 'mr-confirm-overlay';
  const elevesNoms = eligibleIds.map(id => {
    const e = _eleves.find(el => el.id === id);
    return e ? esc(e.prenom || '') : '';
  }).filter(Boolean).join(', ');

  confirmOverlay.innerHTML = `
    <div class="mr-confirm-box" role="dialog" aria-modal="true" aria-label="Confirmer la validation">
      <p class="mr-confirm-ttl">Confirmer ${eligibleIds.length} validation${eligibleIds.length > 1 ? 's' : ''}</p>
      <p class="mr-confirm-txt">
        Compétence <strong>${esc(_mrSelectedComp.c)} — ${esc(_mrSelectedComp.n)}</strong><br>
        Pour : ${elevesNoms}
      </p>
      <div class="mr-confirm-actions">
        <button class="mr-confirm-cancel" type="button">Annuler</button>
        <button class="mr-confirm-ok" type="button" id="mr-confirm-ok">Valider</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmOverlay);

  confirmOverlay.querySelector('.mr-confirm-cancel')?.addEventListener('click', () => confirmOverlay.remove());

  confirmOverlay.querySelector('#mr-confirm-ok')?.addEventListener('click', async () => {
    confirmOverlay.remove();
    await _doBatchValidation(eligibleIds, overlay);
  });
}

async function _doBatchValidation(eligibleIds, overlay) {
  const btn = overlay.querySelector('#mr-btn-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Validation en cours…'; }

  const rows = eligibleIds.map(id => ({
    eleve_id: id,
    competence_id: _mrSelectedComp.c,
    validated_by: _me.id,
    statut: 'acquis',
  }));

  const { error } = await sb.from('validations').upsert(rows, { onConflict: 'eleve_id,competence_id' });

  if (error) {
    toast('Erreur lors de la validation batch', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Réessayer'; }
    return;
  }

  // Notifications quiz pour chaque élève validé
  const notifs = eligibleIds.map(id => ({
    user_id: id,
    type: 'post_validation_quiz',
    title: 'Compétence validée !',
    body: `${_mrSelectedComp.n} — Fais le quiz en 30 sec`,
    data: { competence_id: _mrSelectedComp.c },
  }));
  await sb.from('notifications').insert(notifs).then(({ error: ne }) => {
    if (ne) console.error('[mode_rapide] notif insert failed', ne);
  });

  track('mode_rapide.batch_validated', {
    competence_id: _mrSelectedComp.c,
    count: eligibleIds.length,
  });

  const { haptic } = await import('@/utils/haptic.js');
  haptic('success');

  toast(`✅ ${eligibleIds.length} validation${eligibleIds.length > 1 ? 's' : ''} enregistrée${eligibleIds.length > 1 ? 's' : ''}`, 'success', 4000);

  _closeMrModal();
  // Rafraîchit la page principale
  render();
  wire();
}

function _closeMrModal() {
  document.querySelector('.mr-overlay')?.remove();
  document.querySelector('.mr-confirm-overlay')?.remove();
}

