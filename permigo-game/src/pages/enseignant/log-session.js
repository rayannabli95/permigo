// ═══════════════════════════════════════════════════════════════
// Enseignant — Enregistrer une session (plein écran, ADN Uber Driver)
// Route : #/log-session
// Objectif : 30s max pour logger une séance complète
// ═══════════════════════════════════════════════════════════════
import { sb }         from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast }      from '@/components/common/toast.js';
import { esc }        from '@/utils/escape.js';
import { track }      from '@/services/analytics.js';
import { navigate }   from '@/router.js';
import { icon }       from '@/utils/icons.js';
import { haptic }     from '@/utils/haptic.js';

// ─── Constantes ───────────────────────────────────────────────
const DURATIONS_PRESET = [
  { value: 60,  label: '1h' },
  { value: 90,  label: '1h30' },
  { value: 120, label: '2h' },
];
const DEFAULT_DURATION = 60;
const MAX_COMMENT      = 300;

// Codes Postgres renvoyés par le RPC log_session
// error.code = SQLSTATE (P0001 = RAISE generic, P0002 = no_data_found)
// error.message = texte du RAISE (utilisé comme clé secondaire)
const RPC_ERRORS = {
  // Par code SQLSTATE
  P0001: "Une erreur pédagogique a bloqué l'enregistrement. Vérifie les compétences sélectionnées.",
  // Par message RAISE (plus précis quand le code est P0001 générique)
  no_session:              "Impossible de trouver la session. Rafraîchis et réessaie.",
  cap_daily_exceeded:      "Tu as déjà 10h de sessions enregistrées aujourd'hui.",
  cap_weekly_exceeded:     "Tu as déjà 50h de sessions enregistrées cette semaine.",
  session_too_old:         "Impossible d'enregistrer une session de plus de 48h.",
  invalid_duration:        "Durée invalide.",
};
const DRAFT_KEY        = () => `draft_session_${todayIso()}`;
const MONDE_LABELS     = ['', 'Maîtrise du véhicule', 'Appréhension de la route', 'Circulation', 'En autonomie'];

const GRADS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,var(--blk),#155e75)',
  'linear-gradient(135deg,var(--puk),#4c1d95)',
  'linear-gradient(135deg,var(--grd),#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#a16207,#713f12)',
];

// ─── Helpers ──────────────────────────────────────────────────
function gradFor(id) {
  let h = 0;
  for (let i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}
function initials(p, n) { return ((p || '')[0] || '') + ((n || '')[0] || ''); }
function todayIso() { return new Date().toISOString().slice(0, 10); }
function isoToFr(iso) {
  const d = new Date(iso + 'T12:00:00');
  const isToday = iso === todayIso();
  if (isToday) return `Aujourd'hui · ${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}`;
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
}
function fmtDur(min) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

// ─── State module-level (réinitialisé à chaque mount) ─────────
let _me, _eleves, _allComps, _compCache, _templates;
let _eleve = null, _duration = DEFAULT_DURATION, _date = todayIso();
// _comps : Map<comp_id, 'acquis'|'en_cours'|'a_retravailler'>
// Cycle au clic : (rien) → acquis → en_cours → a_retravailler → (rien)
let _comps = new Map(), _comment = '', _query = '';
let _customDurOpen = false, _customDur = 105;
let _draftTimer = null;

// Cycle des statuts au clic sur un chip compétence
const STATUT_CYCLE = ['acquis', 'en_cours', 'a_retravailler'];
function _nextStatut(current) {
  if (!current) return 'acquis';
  const i = STATUT_CYCLE.indexOf(current);
  return i === STATUT_CYCLE.length - 1 ? null : STATUT_CYCLE[i + 1];
}
function _statutMeta(s) {
  if (s === 'acquis')         return { label: 'Acquis',         icoName: 'check',         color: 'var(--grd)', bg: 'rgba(34,197,94,.14)',  border: 'rgba(34,197,94,.45)' };
  if (s === 'en_cours')       return { label: 'En cours',       icoName: 'refresh-cw',    color: 'var(--amk)', bg: 'rgba(245,158,11,.14)', border: 'rgba(245,158,11,.45)' };
  if (s === 'a_retravailler') return { label: 'À retravailler', icoName: 'alert-triangle',color: 'var(--rdx)', bg: 'rgba(239,68,68,.14)',  border: 'rgba(239,68,68,.45)' };
  return null;
}

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  _me = getCurUser();
  if (!_me) return;

  // Reset state
  _eleve = null; _duration = DEFAULT_DURATION; _date = todayIso();
  _comps = new Map(); _comment = ''; _query = '';
  _customDurOpen = false; _customDur = 105;
  _compCache = {}; _templates = [];

  track('page_view', { page: 'log-session', user_role: _me.role });

  root.innerHTML = `<style>${CSS}</style><div class="ls-page anim-slide-up" id="ls-root">
    <div class="ls-header">
      <button class="ls-back" id="ls-back" aria-label="Retour">${icon('arrow-left', { size: 20, strokeWidth: 2.5 })}</button>
      <h1 class="ls-header-title" tabindex="-1">Enregistrer une session</h1>
    </div>
    <div class="ls-scroll" id="ls-scroll">
      <div class="ls-skel-wrap">
        ${[1,2,3].map(() => `<div class="ls-card"><div class="skel" style="height:80px;border-radius:12px"></div></div>`).join('')}
      </div>
    </div>
  </div>`;

  root.querySelector('#ls-back').addEventListener('click', () => navigate('/'));

  // Restore draft
  const draft = _loadDraft();

  // Fetch data in parallel
  const [elevesRes, compsRes, templatesRes] = await Promise.allSettled([
    sb.from('profiles')
      .select('id, prenom, nom, avatar_url, last_active_at')
      .eq('role', 'eleve')
      .eq('enseignant_id', _me.id)
      .order('last_active_at', { ascending: false }),
    sb.from('competences_remc')
      .select('id, nom, code, monde')
      .order('id', { ascending: true }),
    Promise.resolve(sb.rpc('get_my_message_templates')).catch(() => ({ data: [] })),
  ]);

  _eleves    = elevesRes.status === 'fulfilled' ? (elevesRes.value.data || []) : [];
  _allComps  = compsRes.status  === 'fulfilled' ? (compsRes.value.data  || []) : [];
  _templates = templatesRes.status === 'fulfilled' ? (templatesRes.value?.data || []) : [];

  // Restore draft state
  if (draft) {
    _eleve    = _eleves.find(e => e.id === draft.eleve_id) ? draft.eleve_id : null;
    _duration = draft.duration ?? DEFAULT_DURATION;
    _date     = draft.date ?? todayIso();
    // Compat ancien draft (array d'ids → tous acquis)
    if (Array.isArray(draft.comps)) {
      _comps = new Map(draft.comps.map(id => [id, 'acquis']));
    } else if (draft.comps && typeof draft.comps === 'object') {
      _comps = new Map(Object.entries(draft.comps));
    } else {
      _comps = new Map();
    }
    _comment  = draft.comment ?? '';
  }
  if (!_eleve && _eleves.length > 0) _eleve = _eleves[0].id;

  // Load comps for initial eleve
  if (_eleve) await _fetchCompData(_eleve);

  _render(root);
  _wireAll(root);
}

// ─── Comp data (acquis per élève) ─────────────────────────────
async function _fetchCompData(eleveId) {
  if (!eleveId || _compCache[eleveId]) return;
  try {
    const { data } = await sb
      .from('validations')
      .select('competence_id')
      .eq('eleve_id', eleveId)
      .eq('statut', 'acquis');
    _compCache[eleveId] = new Set((data || []).map(v => v.competence_id));
  } catch {
    _compCache[eleveId] = new Set();
  }
}

function _acquis() { return _compCache[_eleve] ?? new Set(); }

// Résumé compact pour le header de la section comp
function _compsSummary() {
  if (_comps.size === 0) return '';
  const counts = { acquis: 0, en_cours: 0, a_retravailler: 0 };
  for (const s of _comps.values()) counts[s] = (counts[s] || 0) + 1;
  const parts = [];
  if (counts.acquis)         parts.push(`${counts.acquis} acquis`);
  if (counts.en_cours)       parts.push(`${counts.en_cours} en cours`);
  if (counts.a_retravailler) parts.push(`${counts.a_retravailler} à retravailler`);
  return parts.join(' · ');
}

// Rendu d'un chip compétence selon son état (acquis DB, ou statut en cours de saisie)
function _renderCompChip(c, acquisSet) {
  const isAlreadyAcquis = acquisSet.has(c.id);
  const localStatut = _comps.get(c.id) || null;
  // déjà acquis en DB = on bloque la sélection (déjà validé), affiché grisé/check
  if (isAlreadyAcquis) {
    return `<button class="ls-comp-chip ls-comp-acquis"
                    data-comp="${esc(c.id)}"
                    disabled aria-disabled="true"
                    type="button" title="${esc(c.nom)} — déjà acquis">
      <span class="ls-comp-check-ico">${icon('check', { size: 10, strokeWidth: 3, color: 'var(--grd)' })}</span>
      <span class="ls-comp-code">${esc(c.code || '')}</span>
      <span class="ls-comp-lbl">${esc(c.nom)}</span>
    </button>`;
  }
  // En cours de saisie : selon le statut local (null / acquis / en_cours / a_retravailler)
  const cls = localStatut ? `ls-comp-sel ls-comp-${localStatut}` : '';
  const meta = _statutMeta(localStatut);
  const statutIco = meta ? `<span class="ls-comp-statut-ico">${icon(meta.icoName, { size: 10, strokeWidth: 2.8 })}</span>` : '';
  return `<button class="ls-comp-chip ${cls}"
                  data-comp="${esc(c.id)}"
                  data-statut="${esc(localStatut || '')}"
                  aria-label="${esc(c.nom)}${meta ? ' — ' + meta.label : ''}"
                  type="button" title="${esc(c.nom)}${meta ? ' — ' + meta.label : ''}">
    ${statutIco}
    <span class="ls-comp-code">${esc(c.code || '')}</span>
    <span class="ls-comp-lbl">${esc(c.nom)}</span>
  </button>`;
}

// ─── Draft ─────────────────────────────────────────────────────
function _saveDraft() {
  clearTimeout(_draftTimer);
  _draftTimer = setTimeout(() => {
    try {
      localStorage.setItem(DRAFT_KEY(), JSON.stringify({
        eleve_id: _eleve, duration: _duration, date: _date,
        comps: Object.fromEntries(_comps), comment: _comment,
      }));
    } catch { /* storage full */ }
  }, 600);
}
function _loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY()) || 'null'); } catch { return null; }
}
function _clearDraft() {
  clearTimeout(_draftTimer);
  try { localStorage.removeItem(DRAFT_KEY()); } catch { }
}

// ─── Render ────────────────────────────────────────────────────
function _render(root) {
  const scrollEl = root.querySelector('#ls-scroll');
  if (!scrollEl) return;

  const compCount  = _comps.size;
  const eleveObj   = _eleves.find(e => e.id === _eleve);
  const acquis     = _acquis();

  const filtered = _query
    ? _eleves.filter(e => `${e.prenom} ${e.nom}`.toLowerCase().includes(_query.toLowerCase()))
    : _eleves;

  // Group comps by monde
  const byMonde = {};
  for (const c of _allComps) {
    if (!byMonde[c.monde]) byMonde[c.monde] = [];
    byMonde[c.monde].push(c);
  }

  scrollEl.innerHTML = `
    <!-- ── 1. ÉLÈVE ─────────────────────────── -->
    <div class="ls-card ls-card-eleve">
      <div class="ls-sec-title">${icon('users', { size: 13, strokeWidth: 2.4 })} Avec qui ?</div>
      ${_eleves.length > 6 ? `
      <div class="ls-search-wrap">
        <span class="ls-search-ico">${icon('search', { size: 14, strokeWidth: 2.2, color: 'var(--mu2)' })}</span>
        <input class="ls-search" id="ls-search" type="search" placeholder="Chercher un élève…"
               aria-label="Chercher un élève"
               value="${esc(_query)}" autocomplete="off" autocorrect="off" spellcheck="false">
      </div>` : ''}
      <div class="ls-eleve-list" id="ls-eleve-list">
        ${filtered.length === 0
          ? `<div class="ls-empty-hint">Aucun élève trouvé.</div>`
          : filtered.map(e => {
              const ini = initials(e.prenom, e.nom).toUpperCase() || '?';
              const sel = e.id === _eleve;
              return `<div class="ls-eleve-row${sel ? ' ls-sel' : ''}" data-eleve="${esc(e.id)}"
                           role="radio" aria-checked="${sel}">
                <div class="ls-av" style="background:${gradFor(e.id)}">${esc(ini)}</div>
                <div class="ls-eleve-info">
                  <div class="ls-eleve-name">${esc(e.prenom || '')} ${esc(e.nom || '')}</div>
                </div>
                <div class="ls-eleve-check${sel ? ' ls-eleve-check-on' : ''}">
                  ${sel ? icon('check', { size: 12, strokeWidth: 3, color: '#fff' }) : ''}
                </div>
              </div>`;
            }).join('')}
      </div>
    </div>

    <!-- ── 2. DURÉE ──────────────────────────── -->
    <div class="ls-card">
      <div class="ls-sec-title">${icon('clock', { size: 13, strokeWidth: 2.4 })} Durée</div>
      <div class="ls-dur-chips" id="ls-dur-chips">
        ${DURATIONS_PRESET.map(d => `
          <button class="ls-dur-chip${_duration === d.value && !_customDurOpen ? ' ls-sel' : ''}"
                  data-dur="${d.value}" type="button">${d.label}</button>
        `).join('')}
        <button class="ls-dur-chip ls-dur-other${_customDurOpen || !DURATIONS_PRESET.find(d => d.value === _duration) ? ' ls-sel' : ''}"
                id="ls-dur-other" type="button">
          ${_customDurOpen || !DURATIONS_PRESET.find(d => d.value === _duration) ? fmtDur(_duration) : 'Autre'}
        </button>
      </div>
      ${_customDurOpen ? `
      <div class="ls-dur-sheet" id="ls-dur-sheet">
        <div class="ls-stepper">
          <button class="ls-step-btn" id="ls-step-minus" type="button" aria-label="Réduire">−</button>
          <span class="ls-step-val" id="ls-step-val">${fmtDur(_customDur)}</span>
          <button class="ls-step-btn" id="ls-step-plus" type="button" aria-label="Augmenter">+</button>
        </div>
        <button class="ls-step-apply" id="ls-step-apply" type="button">Valider</button>
      </div>` : ''}
    </div>

    <!-- ── 3. DATE ───────────────────────────── -->
    <div class="ls-card">
      <div class="ls-sec-title">${icon('calendar', { size: 13, strokeWidth: 2.4 })} Date</div>
      <div class="ls-date-row" id="ls-date-row">
        <span class="ls-date-txt">${isoToFr(_date)}</span>
        <span class="ls-date-badge">Modifier</span>
        <input type="date" id="ls-date-input" class="ls-date-input"
               aria-label="Date de la séance"
               value="${esc(_date)}" max="${todayIso()}"
               min="${(() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10); })()}">
      </div>
    </div>

    <!-- ── 4. COMPÉTENCES ────────────────────── -->
    <div class="ls-card">
      <div class="ls-sec-header">
        <div class="ls-sec-title">${icon('book-open', { size: 13, strokeWidth: 2.4 })} Compétences travaillées</div>
        ${compCount > 0 ? `<span class="ls-comp-count">${_compsSummary()}</span>` : ''}
      </div>
      <div class="ls-comp-legend" aria-label="Légende des statuts">
        <span>Clique pour cycler :</span>
        <span class="ls-leg-pill ls-leg-acquis">${icon('check', { size: 10, strokeWidth: 3 })} Acquis</span>
        <span class="ls-leg-pill ls-leg-en_cours">${icon('refresh-cw', { size: 10, strokeWidth: 2.4 })} En cours</span>
        <span class="ls-leg-pill ls-leg-a_retravailler">${icon('alert-triangle', { size: 10, strokeWidth: 2.4 })} À retravailler</span>
      </div>
      <div class="ls-comps-list" id="ls-comps-list">
        ${_allComps.length === 0
          ? `<div class="ls-empty-hint">Aucune compétence disponible.</div>`
          : Object.entries(byMonde).sort(([a],[b]) => +a - +b).map(([monde, comps]) => `
            <div class="ls-monde-group">
              <div class="ls-monde-lbl">C${monde} — ${esc(MONDE_LABELS[+monde] || `Monde ${monde}`)}</div>
              <div class="ls-comp-chips">
                ${comps.map(c => _renderCompChip(c, acquis)).join('')}
              </div>
            </div>
          `).join('')}
      </div>
    </div>

    <!-- ── 5. COMMENTAIRE ────────────────────── -->
    <div class="ls-card">
      <div class="ls-sec-title">${icon('message-square', { size: 13, strokeWidth: 2.4 })} Commentaire <span class="ls-optional">optionnel</span></div>
      <div class="ls-visibility-tag">${icon('eye', { size: 11, strokeWidth: 2, color: 'var(--mu2)' })} Visible par l'élève et l'auto-école</div>
      <div class="ls-ta-wrap">
        <textarea class="ls-textarea" id="ls-textarea" maxlength="${MAX_COMMENT}"
                  aria-label="Commentaire de séance"
                  placeholder="Observations, points à travailler, encouragements…"
                  rows="3">${esc(_comment)}</textarea>
        <span class="ls-char-count${_comment.length > MAX_COMMENT * .85 ? ' ls-near' : ''}"
              id="ls-char-count">${_comment.length}/${MAX_COMMENT}</span>
      </div>
      ${_templates.filter(t => t.unlocked !== false).length > 0 ? `
      <div class="ls-tpl-list" id="ls-tpl-list">
        ${_templates.map(t => t.unlocked === false
          ? `<button class="ls-tpl-chip ls-tpl-locked" disabled title="Débloque à ${t.unlock_at ?? '?'} validations">
               ${icon('lock', { size: 10, strokeWidth: 2.5, color: 'var(--mu2)' })}
               ${esc(t.title || t.body || 'Template')}
             </button>`
          : `<button class="ls-tpl-chip" data-body="${esc(t.body || '')}" type="button">
               ${esc(t.title || t.body || 'Template')}
             </button>`
        ).join('')}
      </div>` : ''}
    </div>

    <!-- ── Spacer pour sticky footer ─── -->
    <div style="height:88px"></div>
  `;
}

// ─── Wire ──────────────────────────────────────────────────────
function _wireAll(root) {
  // Back
  root.querySelector('#ls-back')?.addEventListener('click', () => navigate('/'));

  // Search (si présent)
  root.querySelector('#ls-search')?.addEventListener('input', e => {
    _query = e.target.value;
    _renderEleveList(root);
  });

  // Élève
  _wireEleveList(root);

  // Duration chips
  _wireDuration(root);

  // Date
  _wireDate(root);

  // Comps
  _wireComps(root);

  // Textarea
  const ta = root.querySelector('#ls-textarea');
  ta?.addEventListener('input', () => {
    _comment = ta.value;
    const count = root.querySelector('#ls-char-count');
    if (count) {
      count.textContent = `${_comment.length}/${MAX_COMMENT}`;
      count.classList.toggle('ls-near', _comment.length > MAX_COMMENT * .85);
    }
    _saveDraft();
  });

  // Templates
  root.querySelectorAll('.ls-tpl-chip[data-body]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ta) return;
      ta.value = btn.dataset.body;
      _comment = ta.value;
      ta.dispatchEvent(new Event('input'));
      ta.focus();
      track('log_session.template_used', {});
    });
  });

  // Submit (sticky — injecté dans root, pas dans scroll)
  _mountFooter(root);
}

function _wireEleveList(root) {
  root.querySelectorAll('.ls-eleve-row').forEach(row => {
    row.addEventListener('click', async () => {
      const id = row.dataset.eleve;
      if (_eleve === id) return; // déjà sélectionné
      _eleve = id;
      _comps = new Map(); // reset comps quand on change d'élève
      _saveDraft();

      // Update visuel immédiatement
      root.querySelectorAll('.ls-eleve-row').forEach(r => {
        const sel = r.dataset.eleve === id;
        r.classList.toggle('ls-sel', sel);
        r.setAttribute('aria-checked', sel);
        const chk = r.querySelector('.ls-eleve-check');
        if (chk) {
          chk.className = `ls-eleve-check${sel ? ' ls-eleve-check-on' : ''}`;
          chk.innerHTML = sel ? icon('check', { size: 12, strokeWidth: 3, color: '#fff' }) : '';
        }
      });

      // Fetch comp data pour ce nouvel élève
      const compsEl = root.querySelector('#ls-comps-list');
      if (compsEl) compsEl.innerHTML = `<div class="ls-empty-hint" style="color:var(--a)">Chargement des compétences…</div>`;
      await _fetchCompData(id);
      // Re-render juste le bloc comps
      _rerenderComps(root);
      _updateSubmit(root);
    });
  });
}

function _wireDuration(root) {
  root.querySelectorAll('.ls-dur-chip[data-dur]').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = +chip.dataset.dur;
      _duration = val;
      _customDurOpen = false;
      root.querySelectorAll('.ls-dur-chip').forEach(c => c.classList.remove('ls-sel'));
      chip.classList.add('ls-sel');
      const other = root.querySelector('#ls-dur-other');
      if (other) { other.textContent = 'Autre'; other.classList.remove('ls-sel'); }
      _removeSheet(root);
      _saveDraft();
      _updateSubmit(root);
    });
  });

  root.querySelector('#ls-dur-other')?.addEventListener('click', () => {
    _customDurOpen = !_customDurOpen;
    if (_customDurOpen) _customDur = DURATIONS_PRESET.find(d => d.value === _duration) ? 105 : _duration;
    // Rebuild juste la card durée
    _rerenderDuration(root);
    _wireDuration(root);
  });
}

function _wireDate(root) {
  const dateRow   = root.querySelector('#ls-date-row');
  const dateInput = root.querySelector('#ls-date-input');
  if (!dateRow || !dateInput) return;

  dateRow.addEventListener('click', () => {
    // showPicker() est le moyen fiable sur iOS Safari 16+ et Chrome Android.
    // Attention : il renvoie undefined en succès (donc pas de `?? click()`, qui
    // rappellerait click() à tort) et peut throw (hors gesture utilisateur, sécurité).
    try {
      if (typeof dateInput.showPicker === 'function') { dateInput.showPicker(); return; }
    } catch { /* fallback ci-dessous */ }
    // Vieux navigateurs : focus + click pour ouvrir le sélecteur natif.
    dateInput.focus();
    dateInput.click();
  });
  dateInput.addEventListener('change', () => {
    if (!dateInput.value) return;
    _date = dateInput.value;
    const txt = dateRow.querySelector('.ls-date-txt');
    if (txt) txt.textContent = isoToFr(_date);
    _saveDraft();
  });
}

function _wireComps(root) {
  // Event delegation : un seul listener sur le conteneur, pas un par chip.
  // Évite le double-bind quand on rebind après chaque clic.
  root.querySelectorAll('.ls-comps-list').forEach(list => {
    if (list._wired) return;
    list._wired = true;
    list.addEventListener('click', (e) => {
      const chip = e.target.closest('.ls-comp-chip');
      if (!chip || chip.disabled) return;
      const id = chip.dataset.comp;
      if (!id) return;
      const current = _comps.get(id) || null;
      const next = _nextStatut(current);
      if (next === null) _comps.delete(id);
      else               _comps.set(id, next);

      // Retour haptique + son léger selon le nouveau statut (reduced-motion respecté côté util)
      haptic(next === 'acquis' ? 'success' : next === 'a_retravailler' ? 'warning' : next === 'en_cours' ? 'select' : 'tap');

      // Refresh visuel du chip uniquement
      const acquisSet = _acquis();
      const compObj = _allComps.find(c => c.id === id);
      if (compObj) {
        const fresh = document.createElement('div');
        fresh.innerHTML = _renderCompChip(compObj, acquisSet);
        chip.replaceWith(fresh.firstElementChild);
      }
      _saveDraft();
      _updateSubmit(root);
      _refreshCompCountHeader(root);
    });
  });
}

// Met à jour le compteur dans le header de la section comp
function _refreshCompCountHeader(root) {
  const secHeader = root.querySelector('.ls-sec-header');
  if (!secHeader) return;
  const existing = secHeader.querySelector('.ls-comp-count');
  const summary = _compsSummary();
  if (_comps.size === 0) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.textContent = summary;
  } else {
    secHeader.insertAdjacentHTML('beforeend', `<span class="ls-comp-count" style="margin-left:auto">${summary}</span>`);
  }
}

function _removeSheet(root) {
  root.querySelector('#ls-dur-sheet')?.remove();
}

function _rerenderDuration(root) {
  const card = root.querySelector('.ls-card:nth-child(2)');
  if (!card) return;
  card.innerHTML = `
    <div class="ls-sec-title">${icon('clock', { size: 13, strokeWidth: 2.4 })} Durée</div>
    <div class="ls-dur-chips" id="ls-dur-chips">
      ${DURATIONS_PRESET.map(d => `
        <button class="ls-dur-chip${_duration === d.value && !_customDurOpen ? ' ls-sel' : ''}"
                data-dur="${d.value}" type="button">${d.label}</button>
      `).join('')}
      <button class="ls-dur-chip ls-dur-other${_customDurOpen || !DURATIONS_PRESET.find(d => d.value === _duration) ? ' ls-sel' : ''}"
              id="ls-dur-other" type="button">
        ${_customDurOpen || !DURATIONS_PRESET.find(d => d.value === _duration) ? fmtDur(_duration) : 'Autre'}
      </button>
    </div>
    ${_customDurOpen ? `
    <div class="ls-dur-sheet" id="ls-dur-sheet">
      <div class="ls-stepper">
        <button class="ls-step-btn" id="ls-step-minus" type="button" aria-label="Réduire">−</button>
        <span class="ls-step-val" id="ls-step-val">${fmtDur(_customDur)}</span>
        <button class="ls-step-btn" id="ls-step-plus" type="button" aria-label="Augmenter">+</button>
      </div>
      <button class="ls-step-apply" id="ls-step-apply" type="button">Valider</button>
    </div>` : ''}
  `;
  // Wire stepper
  root.querySelector('#ls-step-minus')?.addEventListener('click', () => {
    _customDur = Math.max(15, _customDur - 15);
    const v = root.querySelector('#ls-step-val');
    if (v) v.textContent = fmtDur(_customDur);
  });
  root.querySelector('#ls-step-plus')?.addEventListener('click', () => {
    _customDur = Math.min(480, _customDur + 15);
    const v = root.querySelector('#ls-step-val');
    if (v) v.textContent = fmtDur(_customDur);
  });
  root.querySelector('#ls-step-apply')?.addEventListener('click', () => {
    _duration = _customDur;
    _customDurOpen = false;
    _rerenderDuration(root);
    _wireDuration(root);
    _saveDraft();
    _updateSubmit(root);
  });
}

function _rerenderComps(root) {
  const acquis = _acquis();
  const byMonde = {};
  for (const c of _allComps) {
    if (!byMonde[c.monde]) byMonde[c.monde] = [];
    byMonde[c.monde].push(c);
  }
  const compsEl = root.querySelector('#ls-comps-list');
  if (!compsEl) return;
  compsEl.innerHTML = Object.entries(byMonde).sort(([a],[b]) => +a - +b).map(([monde, comps]) => `
    <div class="ls-monde-group">
      <div class="ls-monde-lbl">C${monde} — ${esc(MONDE_LABELS[+monde] || `Monde ${monde}`)}</div>
      <div class="ls-comp-chips">
        ${comps.map(c => _renderCompChip(c, acquis)).join('')}
      </div>
    </div>
  `).join('');
  _refreshCompCountHeader(root);
  _wireComps(root);
}

function _renderEleveList(root) {
  const filtered = _query
    ? _eleves.filter(e => `${e.prenom} ${e.nom}`.toLowerCase().includes(_query.toLowerCase()))
    : _eleves;
  const listEl = root.querySelector('#ls-eleve-list');
  if (!listEl) return;
  listEl.innerHTML = filtered.length === 0
    ? `<div class="ls-empty-hint">Aucun élève trouvé.</div>`
    : filtered.map(e => {
        const ini = initials(e.prenom, e.nom).toUpperCase() || '?';
        const sel = e.id === _eleve;
        return `<div class="ls-eleve-row${sel ? ' ls-sel' : ''}" data-eleve="${esc(e.id)}"
                     role="radio" aria-checked="${sel}">
          <div class="ls-av" style="background:${gradFor(e.id)}">${esc(ini)}</div>
          <div class="ls-eleve-info">
            <div class="ls-eleve-name">${esc(e.prenom || '')} ${esc(e.nom || '')}</div>
          </div>
          <div class="ls-eleve-check${sel ? ' ls-eleve-check-on' : ''}">
            ${sel ? icon('check', { size: 12, strokeWidth: 3, color: '#fff' }) : ''}
          </div>
        </div>`;
      }).join('');
  _wireEleveList(root);
}

// ─── Footer sticky ─────────────────────────────────────────────
function _mountFooter(root) {
  // Supprimer ancienne instance si présente
  root.querySelector('#ls-footer')?.remove();

  const footer = document.createElement('div');
  footer.id = 'ls-footer';
  footer.className = 'ls-footer';
  footer.innerHTML = `
    <button class="ls-submit-btn" id="ls-submit" type="button" ${!_eleve ? 'disabled' : ''}>
      ${icon('check', { size: 18, strokeWidth: 2.5 })}
      <span id="ls-submit-lbl">Enregistrer la session</span>
    </button>
  `;
  root.querySelector('#ls-root')?.appendChild(footer);

  root.querySelector('#ls-submit')?.addEventListener('click', () => _handleSubmit(root));
}

function _updateSubmit(root) {
  const btn = root.querySelector('#ls-submit');
  if (!btn) return;
  btn.disabled = !_eleve;
  const lbl = root.querySelector('#ls-submit-lbl');
  if (!lbl) return;
  const acquisCount = [..._comps.values()].filter(s => s === 'acquis').length;
  if (acquisCount > 0) {
    lbl.textContent = `Enregistrer · ${acquisCount} compétence${acquisCount > 1 ? 's' : ''} validée${acquisCount > 1 ? 's' : ''}`;
  } else if (_comps.size > 0) {
    lbl.textContent = `Enregistrer la session`;
  } else {
    lbl.textContent = 'Enregistrer la session';
  }
}

// ─── Submit ────────────────────────────────────────────────────
async function _handleSubmit(root) {
  if (!_eleve) return;
  const btn = root.querySelector('#ls-submit');
  if (btn) { btn.disabled = true; btn.classList.add('ls-loading'); }

  navigator.vibrate?.(50);

  // Duplicate check via RPC dédié (lit sessions_moniteur, ignore 'refused')
  try {
    const { data: dup } = await sb.rpc('check_duplicate_session', {
      p_eleve_id:    _eleve,
      p_session_date: _date,
    });
    if (dup?.duplicate) {
      const confirmed = await _showDuplicateModal(root, dup);
      if (!confirmed) {
        if (btn) { btn.disabled = false; btn.classList.remove('ls-loading'); }
        return;
      }
    }
  } catch { /* RPC absent en dev — proceed */ }

  // Split par statut : acquis = via log_session (validation atomique + XP)
  //                   en_cours / a_retravailler = upsert direct dans validations
  const acquisIds         = [..._comps.entries()].filter(([, s]) => s === 'acquis').map(([id]) => id);
  const enCoursIds        = [..._comps.entries()].filter(([, s]) => s === 'en_cours').map(([id]) => id);
  const aRetravaillerIds  = [..._comps.entries()].filter(([, s]) => s === 'a_retravailler').map(([id]) => id);
  const noteVal  = _comment.trim() || null;

  try {
    const { data, error } = await sb.rpc('log_session', {
      p_eleve_id:        _eleve,
      p_duration_minutes: _duration,
      p_session_date:    _date,
      p_notes:           noteVal,
      ...(acquisIds.length > 0 ? { p_competence_ids: acquisIds } : {}),
    });

    if (error || data?.error) {
      const rawCode = error?.code || '';
      const rawMsg  = error?.message || data?.error || '';
      const detail  = error?.details || '';
      const hint    = error?.hint    || '';

      // Trace complète pour débugger côté dev
      console.error('[log-session] RPC log_session error ↓');
      console.error('  code   :', rawCode);
      console.error('  message:', rawMsg);
      console.error('  details:', detail);
      console.error('  hint   :', hint);

      let friendlyMsg;

      friendlyMsg = RPC_ERRORS[rawMsg] ?? RPC_ERRORS[rawCode] ?? rawMsg ?? "Erreur lors de l'enregistrement";

      // Affiche le message Postgres réel si aucun mapping connu
      toast(friendlyMsg, 'error');
      if (btn) { btn.disabled = false; btn.classList.remove('ls-loading'); }
      return;
    }

    const result     = data?.[0] ?? data;
    const validations = result?.validations || [];
    const created    = validations.filter(v => v.created).length;

    // Insère/upsert les statuts "en_cours" et "a_retravailler" séparément
    // (le RPC log_session ne gère que 'acquis'). On utilise upsert avec
    // ON CONFLICT (eleve_id, competence_id) pour ne pas écraser un acquis déjà posé.
    let extraCreated = 0;
    const extraIds = [
      ...enCoursIds.map(id => ({ id, statut: 'en_cours' })),
      ...aRetravaillerIds.map(id => ({ id, statut: 'a_retravailler' })),
    ];
    if (extraIds.length > 0) {
      try {
        const rows = extraIds.map(({ id, statut }) => ({
          eleve_id:        _eleve,
          competence_id:   id,
          validated_by:    _me.id,
          validated_at:    new Date().toISOString(),
          statut,
          note_enseignant: noteVal,
        }));
        const { error: upErr } = await sb
          .from('validations')
          .upsert(rows, { onConflict: 'eleve_id,competence_id', ignoreDuplicates: false });
        if (!upErr) extraCreated = extraIds.length;
        else console.error('[log-session] upsert validations extra error', upErr);
      } catch (e) { console.error('[log-session] upsert extra crashed', e); }
    }

    track('session.logged', {
      duration_minutes: _duration,
      n_acquis:         acquisIds.length,
      n_en_cours:       enCoursIds.length,
      n_a_retravailler: aRetravaillerIds.length,
      has_comment:      !!noteVal,
      user_role:        _me.role,
    });

    _clearDraft();

    const eleveObj = _eleves.find(e => e.id === _eleve);
    const totalChanges = created + extraCreated;
    if (totalChanges > 0) {
      const parts = [];
      if (created > 0)        parts.push(`${created} validée${created > 1 ? 's' : ''}`);
      if (extraCreated > 0)   parts.push(`${extraCreated} suivie${extraCreated > 1 ? 's' : ''}`);
      toast(`Séance enregistrée · ${parts.join(' + ')}`, 'success');
    } else {
      toast(`Séance enregistrée · ${fmtDur(_duration)} avec ${esc(eleveObj?.prenom || "l'élève")}`, 'success');
    }

    // Celebrate léger puis retour
    try {
      const { mountCelebrate } = await import('@/components/common/celebrate-screen.js');
      mountCelebrate?.({ duration: 500 });
    } catch { /* composant optionnel */ }

    setTimeout(() => navigate('/'), 400);

  } catch (e) {
    console.error('[log-session] submit error', e);
    toast('Erreur réseau — réessaie', 'error');
    if (btn) { btn.disabled = false; btn.classList.remove('ls-loading'); }
  }
}

// ─── Modal doublon ─────────────────────────────────────────────
// dup = { duplicate, session_id, duration_minutes, confirmation_status }
function _showDuplicateModal(root, dup) {
  const durLabel    = fmtDur(dup.duration_minutes ?? 0);
  const statusLabel = { pending: 'en attente', confirmed: 'confirmée', refused: 'refusée' }[dup.confirmation_status] ?? dup.confirmation_status ?? '?';

  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'ls-dup-overlay';
    overlay.innerHTML = `
      <div class="ls-dup-sheet">
        <div class="ls-dup-title">Séance déjà enregistrée</div>
        <div class="ls-dup-body">
          Une séance de <strong>${esc(durLabel)}</strong> existe déjà ce jour
          (statut : <strong>${esc(statusLabel)}</strong>).
          Que veux-tu faire ?
        </div>
        <div class="ls-dup-btns ls-dup-btns-col">
          ${dup.session_id
            ? `<button class="ls-dup-view" id="ls-dup-view" type="button">Voir la séance existante</button>`
            : ''}
          <button class="ls-dup-confirm" id="ls-dup-confirm" type="button">Créer quand même</button>
          <button class="ls-dup-cancel" id="ls-dup-cancel" type="button">Annuler</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#ls-dup-view')?.addEventListener('click', () => {
      overlay.remove();
      resolve(false); // ne soumet pas
      navigate(`#/sessions/${esc(dup.session_id)}`);
    });
    overlay.querySelector('#ls-dup-confirm').addEventListener('click', () => { overlay.remove(); resolve(true); });
    overlay.querySelector('#ls-dup-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
  });
}

// ─── CSS ───────────────────────────────────────────────────────
const CSS = `
.ls-page {
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  position: relative;
}

/* Header */
.ls-header {
  position: sticky;
  top: 0; z-index: 100;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  padding-top: max(14px, env(safe-area-inset-top));
}
.ls-back {
  width: 44px; height: 44px;
  border-radius: 10px;
  border: 1.5px solid var(--bo);
  background: var(--su);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink);
  flex-shrink: 0;
  transition: background .12s;
}
.ls-back:active { background: var(--bg2); }
.ls-header-title {
  font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -.02em;
}

/* Scroll area */
.ls-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Card */
.ls-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}

/* Section title */
.ls-sec-title {
  font: 700 11px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .09em;
  color: var(--mu2);
  margin: 0 0 12px;
  display: flex; align-items: center; gap: 6px;
}
.ls-sec-header {
  display: flex; align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}
.ls-sec-header .ls-sec-title { margin: 0; }
.ls-comp-count {
  margin-left: auto;
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--a);
  background: rgba(88,204,2,.08);
  padding: 3px 9px;
  border-radius: 10px;
}
.ls-optional {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: var(--mu5);
}

/* Élèves */
.ls-search-wrap {
  position: relative;
  margin-bottom: 10px;
}
.ls-search-ico {
  position: absolute; left: 10px; top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
.ls-search {
  width: 100%; box-sizing: border-box;
  padding: 9px 12px 9px 34px;
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  font: 500 13px/1 'Inter', sans-serif;
  color: var(--ink);
  background: var(--bg);
  outline: none;
  -webkit-appearance: none;
  transition: border-color .15s;
}
.ls-search:focus { border-color: var(--a); background: #fff; }
.ls-search::-webkit-search-cancel-button { -webkit-appearance: none; }
.ls-eleve-list { display: flex; flex-direction: column; gap: 6px; }
.ls-eleve-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px;
  border: 1.5px solid var(--bo);
  border-radius: 16px;
  cursor: pointer;
  transition: border-color .12s, background .12s, transform .1s;
  background: var(--su);
  min-height: 52px;
  -webkit-tap-highlight-color: transparent;
}
.ls-eleve-row:active { transform: scale(.99); }
.ls-eleve-row.ls-sel { border-color: var(--a); background: rgba(88,204,2,.04); }
.ls-av {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff; flex-shrink: 0;
}
.ls-eleve-info { flex: 1; min-width: 0; }
.ls-eleve-name {
  font: 600 14px/1.2 'Inter', sans-serif;
  color: var(--ink);
}
.ls-eleve-check {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid var(--bo);
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: background .12s, border-color .12s;
}
.ls-eleve-check-on { background: var(--a); border-color: var(--a); }

/* Durée */
.ls-dur-chips {
  display: flex; gap: 8px;
}
.ls-dur-chip {
  flex: 1;
  padding: 14px 8px;
  border: 1.5px solid var(--bo);
  border-radius: 14px;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--mu);
  background: var(--su);
  cursor: pointer;
  text-align: center;
  transition: border-color .12s, background .12s, color .12s, transform .1s;
  min-height: 50px;
}
.ls-dur-chip:active { transform: scale(.96); }
.ls-dur-chip.ls-sel { border-color: var(--a); background: rgba(88,204,2,.07); color: var(--a); }
.ls-dur-other { font-size: 13px; font-weight: 600; }
.ls-dur-sheet {
  margin-top: 12px;
  padding: 14px;
  background: var(--bg);
  border-radius: 14px;
  display: flex; align-items: center; gap: 12px;
}
.ls-stepper {
  display: flex; align-items: center; gap: 12px; flex: 1;
}
.ls-step-btn {
  width: 44px; height: 44px;
  border: 1.5px solid var(--bo);
  border-radius: 10px;
  background: var(--su);
  font: 700 20px/1 'Inter', sans-serif;
  color: var(--ink);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .12s;
}
.ls-step-btn:active { background: var(--bg2); }
.ls-step-val {
  flex: 1; text-align: center;
  font: 800 18px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--a);
}
.ls-step-apply {
  padding: 10px 18px;
  background: var(--a);
  color: #fff;
  border: none;
  border-radius: 10px;
  font: 700 13px/1 'Inter', sans-serif;
  cursor: pointer;
  min-height: 40px;
  transition: opacity .12s;
}
.ls-step-apply:active { opacity: .8; }

/* Date */
.ls-date-row {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  border: 1.5px solid var(--bo);
  border-radius: 14px;
  cursor: pointer;
  background: var(--su);
  position: relative;
  transition: border-color .12s;
}
.ls-date-row:active { border-color: var(--a); }
.ls-date-txt {
  flex: 1;
  font: 600 14px/1 'Inter', sans-serif;
  color: var(--ink);
}
.ls-date-badge {
  font: 600 11px/1 'Inter', sans-serif;
  color: var(--a);
  background: rgba(88,204,2,.08);
  padding: 4px 9px;
  border-radius: 8px;
}
.ls-date-input {
  position: absolute;
  opacity: 0;
  width: 1px; height: 1px;
  top: 0; left: 0;
  pointer-events: none;
}

/* Compétences */
.ls-monde-group { margin-bottom: 12px; }
.ls-monde-lbl {
  font: 600 10px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--mu2);
  margin-bottom: 8px;
}
.ls-comp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ls-comp-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 7px 11px;
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  font: 500 12px/1 'Inter', sans-serif;
  color: #4b5563;
  background: var(--su);
  cursor: pointer;
  transition: border-color .12s, background .12s, color .12s, transform .1s;
  min-height: 34px;
  text-align: left;
}
.ls-comp-chip:active { transform: scale(.96); }
.ls-comp-chip.ls-comp-sel { font-weight: 600; }
/* Statuts en cours de saisie : 3 couleurs distinctes */
.ls-comp-chip.ls-comp-acquis:not([disabled])         { border-color: rgba(34,197,94,.55);  background: rgba(34,197,94,.12);  color: var(--grd); }
.ls-comp-chip.ls-comp-en_cours       { border-color: rgba(245,158,11,.55); background: rgba(245,158,11,.12); color: var(--amk); }
.ls-comp-chip.ls-comp-a_retravailler { border-color: rgba(239,68,68,.55);  background: rgba(239,68,68,.12);  color: var(--rdx); }
/* Déjà acquis en DB (disabled) : grisé succès */
.ls-comp-chip.ls-comp-acquis[disabled] { border-color: #d1fae5; background: #f0fdf4; color: #6ee7b7; cursor: default; opacity: .8; }
.ls-comp-code {
  font: 700 9px/1 'Inter', sans-serif;
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(88,204,2,.1);
  color: var(--a);
  flex-shrink: 0;
}
.ls-comp-sel.ls-comp-acquis:not([disabled])         .ls-comp-code { background: var(--grd); color: #fff; }
.ls-comp-sel.ls-comp-en_cours                       .ls-comp-code { background: var(--amk); color: #fff; }
.ls-comp-sel.ls-comp-a_retravailler                 .ls-comp-code { background: var(--rdx); color: #fff; }
.ls-comp-acquis[disabled] .ls-comp-code { background: #bbf7d0; color: var(--grd); }
.ls-comp-check-ico, .ls-comp-statut-ico { flex-shrink: 0; display: inline-flex; }
.ls-comp-lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }

/* Légende statuts au-dessus de la liste */
.ls-comp-legend {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  font: 500 11px/1.3 'Inter', sans-serif;
  color: var(--mu2);
  margin-bottom: 10px;
}
.ls-leg-pill {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 7px;
  border-radius: 12px;
  font: 600 10px/1 'Inter', sans-serif;
}
.ls-leg-pill.ls-leg-acquis         { background: rgba(34,197,94,.12);  color: var(--grd); }
.ls-leg-pill.ls-leg-en_cours       { background: rgba(245,158,11,.12); color: var(--amk); }
.ls-leg-pill.ls-leg-a_retravailler { background: rgba(239,68,68,.12);  color: var(--rdx); }

/* Commentaire */
.ls-visibility-tag {
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  display: inline-flex; align-items: center; gap: 5px;
  margin-bottom: 10px;
}
.ls-ta-wrap { position: relative; }
.ls-textarea {
  width: 100%; box-sizing: border-box;
  padding: 12px 14px 24px;
  border: 1.5px solid var(--bo);
  border-radius: 14px;
  font: 500 13px/1.5 'Inter', sans-serif;
  color: var(--ink);
  background: var(--su);
  resize: none;
  outline: none;
  -webkit-appearance: none;
  transition: border-color .15s;
}
.ls-textarea:focus { border-color: var(--a); }
.ls-char-count {
  position: absolute; bottom: 8px; right: 10px;
  font: 500 10px/1 'Inter', sans-serif;
  color: var(--mu5);
  pointer-events: none;
}
.ls-char-count.ls-near { color: var(--am); }
.ls-tpl-list {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-top: 10px;
}
.ls-tpl-chip {
  padding: 7px 12px;
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  font: 500 12px/1.4 'Inter', sans-serif;
  color: var(--a);
  background: rgba(88,204,2,.04);
  cursor: pointer;
  transition: background .12s, border-color .12s;
  min-height: 34px;
  white-space: normal;
  max-width: 100%;
  text-align: left;
  word-break: break-word;
}
.ls-tpl-chip:active { background: rgba(88,204,2,.12); border-color: var(--a); }
.ls-tpl-locked { color: var(--mu5); cursor: not-allowed; background: var(--bg); display: inline-flex; align-items: center; gap: 5px; }

/* Empty hint */
.ls-empty-hint {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--mu2);
  padding: 8px 0;
}

/* Footer sticky */
.ls-footer {
  position: sticky;
  bottom: 0;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: var(--su);
  border-top: 1px solid var(--bo);
  z-index: 50;
}
.ls-submit-btn {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 16px;
  background: var(--a);
  color: #fff;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity .15s, transform .15s;
}
.ls-submit-btn:active { transform: scale(.98); }
.ls-submit-btn:disabled { opacity: .45; cursor: not-allowed; }
.ls-submit-btn.ls-loading { opacity: .65; cursor: wait; }

/* Modal doublon */
.ls-dup-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(10,13,26,.5);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.ls-dup-sheet {
  background: var(--su);
  border-radius: 20px;
  padding: 24px;
  width: 100%; max-width: 360px;
  box-shadow: 0 8px 40px rgba(10,13,26,.2);
}
.ls-dup-title {
  font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 10px;
  letter-spacing: -.02em;
}
.ls-dup-body {
  font: 500 14px/1.5 'Inter', sans-serif;
  color: var(--mu);
  margin-bottom: 20px;
}
.ls-dup-btns { display: flex; gap: 10px; }
.ls-dup-btns-col { flex-direction: column; }
.ls-dup-cancel {
  width: 100%; padding: 13px;
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  font: 600 13px/1 'Inter', sans-serif;
  color: var(--mu);
  background: var(--su);
  cursor: pointer;
  min-height: 46px;
  transition: background .12s;
}
.ls-dup-cancel:active { background: var(--bg2); }
.ls-dup-confirm {
  width: 100%; padding: 13px;
  border: none;
  border-radius: 12px;
  font: 700 13px/1 'Inter', sans-serif;
  color: #fff;
  background: var(--a);
  cursor: pointer;
  min-height: 46px;
  transition: opacity .12s;
}
.ls-dup-confirm:active { opacity: .85; }
.ls-dup-view {
  width: 100%; padding: 13px;
  border: 1.5px solid var(--adk);
  border-radius: 12px;
  font: 600 13px/1 'Inter', sans-serif;
  color: var(--adk);
  background: rgba(88,204,2,.05);
  cursor: pointer;
  min-height: 46px;
  transition: background .12s;
}
.ls-dup-view:active { background: rgba(88,204,2,.12); }

@media (prefers-reduced-motion: reduce) {
  .ls-eleve-row, .ls-dur-chip, .ls-comp-chip { transition: none; }
}
`;
