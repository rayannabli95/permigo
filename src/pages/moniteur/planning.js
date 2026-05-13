/**
 * Page Planning Enseignant — vue semaine 7×16 (Lun→Dim, 6h→22h).
 *
 * Fonctionnalités :
 *  - Navigation < Semaine du DD/MM > avec bouton "Aujourd'hui"
 *  - Cellules cliquables : vide → modal "Nouveau créneau" ; event → modal détails/édition
 *  - Events colorés par type : conf=vert, pend=orange, dispo=bleu, perso=gris, absence=rouge
 *  - Hauteur d'un event proportionnelle à `dur`
 *  - Soft delete (is_deleted = true)
 *
 * Branchée sur Supabase :
 *  - events (filtré sur moniteur_id = me.id, date_event dans la semaine affichée)
 *  - profiles (liste des élèves pour le select du modal)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { WEEK_DAYS, MONTHS_FR_SHORT, weekStart, addDays, isoDate, jsDayToWeekIdx } from '@/utils/format-date.js';
import { REMC } from '@/data/remc.js';
import { mountNotifBell } from '@/components/notif-bell.js';
import { createDispo, createLecon, cancelLecon, confirmLecon, markLivretFilled, modifyLecon, MOTIFS_ANNULATION } from '@/services/planning.js';
import { mountDateTimePicker } from '@/components/date-time-picker.js';
import { PLANS_LECON } from '@/utils/diagnostic.js';

const HOUR_START = 6;       // 6h
const HOUR_END = 22;        // 22h (16 lignes)
const ROWS = HOUR_END - HOUR_START;
const ROW_H = 56;           // hauteur d'une ligne en px
const HEADER_H = 44;        // hauteur du header colonnes

let _root, _me, _weekRef = weekStart(new Date()), _events = [], _eleves = [], _reviews = [], _selfEvals = [];
let _nowTimer = null;
// Vue : 'day' (1 col), '3days' (3 cols à partir d'aujourd'hui), 'week' (Lun→Dim)
let _viewMode = (typeof localStorage !== 'undefined' && localStorage.getItem('pl-view')) || 'week';

function numDays() { return _viewMode === 'day' ? 1 : _viewMode === '3days' ? 3 : 7; }
function viewStartDate() {
  // En vue 'week', _weekRef = lundi. En 'day'/'3days', _weekRef = jour de départ.
  return _weekRef;
}

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  await load();
  render();
  startNowTimer();

  // Si on arrive depuis une alerte "Remplir livret obligatoire" (hash ?openLivret=<id>)
  const hashParams = new URLSearchParams((location.hash.split('?')[1] || ''));
  const openLivretId = hashParams.get('openLivret');
  if (openLivretId) {
    const ev = _events?.find?.(x => x.id === openLivretId);
    if (ev) {
      setTimeout(() => openDetailsModal(ev), 300);
    }
  }
}

export function unmount() {
  stopNowTimer();
  document.removeEventListener('keydown', _onEscape);
}

function startNowTimer() {
  stopNowTimer();
  // Refresh la ligne "now" + le widget "Maintenant/Suivant" toutes les 60s
  _nowTimer = setInterval(() => {
    if (!_root) return;
    // Ligne now
    const grid = _root.querySelector('.pl-grid');
    if (grid) {
      const old = grid.querySelector('.pl-now');
      if (old) old.remove();
      const html = renderNowIndicator();
      if (html) grid.insertAdjacentHTML('beforeend', html);
    }
    // Widget Maintenant/Suivant — remplace le contenu de .pl-now-card par le nouveau rendu
    const oldCard = _root.querySelector('.pl-now-card');
    if (oldCard) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderNowNextWidget();
      const newCard = wrapper.querySelector('.pl-now-card');
      if (newCard) {
        oldCard.replaceWith(newCard);
        // Re-wire les boutons CTA du nouveau widget
        newCard.querySelectorAll('[data-evt-eval]').forEach(b => {
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            const evt = _events.find(x => x.id === b.dataset.evtEval);
            if (evt) openReviewModal(evt);
          });
        });
        newCard.querySelectorAll('[data-evt-detail]').forEach(b => {
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            const evt = _events.find(x => x.id === b.dataset.evtDetail);
            if (evt) openDetailsModal(evt);
          });
        });
      }
    }
  }, 60 * 1000);
}

function stopNowTimer() {
  if (_nowTimer) { clearInterval(_nowTimer); _nowTimer = null; }
}

async function load() {
  const start = isoDate(_weekRef);
  const end = isoDate(addDays(_weekRef, numDays() - 1));

  const [evtRes, elvRes] = await Promise.allSettled([
    sb.from('events')
      .select('id, h, d, t, dur, lieu, comment, eleve_id, moniteur_id, mon_nom, n, date_event, is_deleted, livret_rempli, numero_heure_eleve')
      .eq('moniteur_id', _me.id)
      .eq('is_deleted', false)
      .gte('date_event', start)
      .lte('date_event', end)
      .order('h'),
    sb.from('profiles').select('id, nom').eq('role', 'eleve').order('nom'),
  ]);

  _events = (evtRes.value?.data) || [];
  _eleves = (elvRes.value?.data) || [];

  // Charge les éventuelles reviews + auto-évals pour les leçons visibles
  const lessonIds = _events.filter(e => eventKind(e.t) === 'conf').map(e => e.id);
  if (lessonIds.length) {
    const [revRes, seRes] = await Promise.allSettled([
      sb.from('lesson_reviews').select('id, event_id, note, commentaire, comp_ids').in('event_id', lessonIds),
      sb.from('lesson_self_evals').select('event_id, note, commentaire').in('event_id', lessonIds),
    ]);
    _reviews = revRes.value?.data || [];
    _selfEvals = seRes.value?.data || [];
  } else {
    _reviews = [];
    _selfEvals = [];
  }
}

function selfEvalFor(eventId) {
  return _selfEvals.find(s => s.event_id === eventId) || null;
}

function reviewFor(eventId) {
  return _reviews.find(r => r.event_id === eventId) || null;
}

// ─── Helpers métier ───

/** Type normalisé d'un event (en minuscules). */
function eventKind(t) {
  const s = (t || '').toLowerCase();
  if (s === 'conf' || s === 'leçon' || s === 'lecon') return 'conf';
  if (s === 'pend') return 'pend';
  if (s === 'dispo') return 'dispo';
  if (s === 'perso') return 'perso';
  if (s === 'absence') return 'absence';
  return 'autre';
}

function eventColor(kind) {
  return ({
    conf:    { bg: 'var(--grp)',  bd: 'var(--gr)',  ink: 'var(--gr)',  emoji: '✅' },
    pend:    { bg: 'var(--amp)',  bd: 'var(--am)',  ink: 'var(--am)',  emoji: '⏳' },
    dispo:   { bg: 'var(--ap)',   bd: 'var(--a)',   ink: 'var(--a)',   emoji: '📅' },
    perso:   { bg: 'var(--bg2)',  bd: 'var(--mu2)', ink: 'var(--mu)',  emoji: '🔒' },
    absence: { bg: 'var(--rdp)',  bd: 'var(--rd)',  ink: 'var(--rd)',  emoji: '🚫' },
    autre:   { bg: 'var(--bg2)',  bd: 'var(--mu2)', ink: 'var(--ink)', emoji: '•' },
  })[kind] || { bg: 'var(--bg2)', bd: 'var(--mu2)', ink: 'var(--ink)', emoji: '•' };
}

function eleveNomFor(e) {
  if (e.eleve_id) {
    const p = _eleves.find(x => x.id === e.eleve_id);
    return p?.nom || e.n || '—';
  }
  return e.n || '';
}

function weekLabel() {
  const a = _weekRef;
  const n = numDays();
  if (n === 1) {
    // Vue 1 jour : "Jeu 14 mai 2026"
    const wd = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][a.getDay()];
    return `${wd} ${a.getDate()} ${MONTHS_FR_SHORT[a.getMonth()]} ${a.getFullYear()}`;
  }
  const b = addDays(a, n - 1);
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} → ${b.getDate()} ${MONTHS_FR_SHORT[a.getMonth()]} ${a.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTHS_FR_SHORT[a.getMonth()]} → ${b.getDate()} ${MONTHS_FR_SHORT[b.getMonth()]} ${b.getFullYear()}`;
}

// ─── Rendu ───

function render() {
  _root.innerHTML = `
    <style>
      .pl-wrap{max-width:1100px;margin:0 auto;padding:14px}
      .pl-top{display:flex;align-items:center;gap:10px;padding:4px 4px 12px;flex-wrap:wrap}
      .pl-back{width:34px;height:34px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer}
      .pl-top .ttl{font-family:var(--fd);font-weight:800;font-size:20px;letter-spacing:-.02em}
      .pl-top .sub{font-size:11px;color:var(--mu);margin-top:2px}
      .pl-nav{margin-left:auto;display:flex;align-items:center;gap:6px}
      .pl-nav button{height:34px;padding:0 12px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;font-family:inherit}
      .pl-nav button:hover{background:var(--bg2)}
      .pl-nav .nav-arrow{width:34px;padding:0;font-size:16px}
      .pl-nav .nav-week{min-width:200px;text-align:center;font-family:var(--fn);font-size:12.5px;color:var(--ink);font-weight:700}
      .pl-nav .nav-today{background:var(--a);color:#fff;border-color:var(--a)}
      .pl-nav .nav-today:hover{background:var(--adk)}

      .pl-viewtoggle{display:inline-flex;gap:4px;background:var(--bg2);padding:4px;border-radius:10px;border:1px solid var(--bo);margin:0 4px 12px}
      .pl-viewtoggle button{padding:7px 14px;border-radius:7px;border:0;background:transparent;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--mu);cursor:pointer;transition:all .15s;letter-spacing:-.005em}
      .pl-viewtoggle button:hover{color:var(--ink)}
      .pl-viewtoggle button.on{background:var(--su);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.08)}

      .pl-legend{display:flex;gap:14px;flex-wrap:wrap;padding:6px 4px 12px;font-size:11px;color:var(--mu)}
      .pl-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:middle}

      /* ─── Widget "Maintenant / Suivant" — sticky en haut, mobile-first ─── */
      .pl-now-card{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px;padding:0 4px}
      @media (max-width:560px){.pl-now-card{grid-template-columns:1fr}}
      .pl-nc{position:relative;background:var(--su);border:1px solid var(--bo);border-radius:14px;padding:14px;box-shadow:var(--s1);overflow:hidden;min-height:90px;display:flex;align-items:center;gap:14px;transition:transform .15s,box-shadow .2s,border-color .15s}
      .pl-nc::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--bo2)}
      .pl-nc.live::before{background:linear-gradient(180deg,#10b981,#059669);animation:nc-pulse 2s ease-in-out infinite}
      .pl-nc.next::before{background:linear-gradient(180deg,#6366f1,#4338ca)}
      .pl-nc.idle::before{background:var(--bo)}
      .pl-nc.done::before{background:linear-gradient(180deg,#fbbf24,#f59e0b)}
      @keyframes nc-pulse{0%,100%{opacity:.6}50%{opacity:1}}

      .pl-nc-lbl{font-family:var(--fn);font-size:9.5px;font-weight:800;color:var(--mu);letter-spacing:1.4px;text-transform:uppercase;margin-bottom:4px;display:flex;align-items:center;gap:6px}
      .pl-nc.live .pl-nc-lbl{color:var(--gr)}
      .pl-nc.next .pl-nc-lbl{color:var(--a)}
      .pl-nc-dot{width:8px;height:8px;border-radius:50%;background:#10b981;animation:nc-pulse 1.5s ease-in-out infinite;box-shadow:0 0 8px rgba(16,185,129,.6)}
      .pl-nc-nm{font-family:var(--fd);font-size:17px;font-weight:800;letter-spacing:-.01em;color:var(--ink);line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .pl-nc-meta{font-size:12px;color:var(--mu);margin-top:4px;font-weight:600}
      .pl-nc-time{font-family:var(--fn);font-size:11px;font-weight:800;color:var(--ink);margin-top:6px;display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:99px;background:var(--bg2)}
      .pl-nc.live .pl-nc-time{background:var(--grp);color:var(--gr)}
      .pl-nc.next .pl-nc-time{background:var(--ap);color:var(--a)}
      .pl-nc-body{flex:1;min-width:0}
      .pl-nc-cta{padding:8px 12px;border-radius:8px;background:var(--ink);color:#fff;border:0;font-family:inherit;font-size:11.5px;font-weight:700;cursor:pointer;flex-shrink:0;letter-spacing:.2px;transition:transform .12s,opacity .15s}
      .pl-nc-cta:hover{transform:translateY(-1px)}
      .pl-nc.live .pl-nc-cta{background:var(--gr)}
      .pl-nc.next .pl-nc-cta{background:var(--a)}
      .pl-nc.empty-state{grid-column:1/-1;justify-content:center;text-align:center;flex-direction:column;align-items:center;gap:6px;padding:18px}
      .pl-nc.empty-state .pl-nc-em{font-size:30px;line-height:1}
      .pl-nc.empty-state .pl-nc-nm{font-size:15px;white-space:normal}

      .pl-grid{background:var(--su);border:1px solid var(--bo);border-radius:var(--rl);overflow:hidden;box-shadow:var(--s1);display:grid;grid-template-columns:64px repeat(${numDays()},1fr)}
      .pl-col-h{background:var(--bg2);border-bottom:1px solid var(--bo2);padding:8px 6px;text-align:center;font-size:11px;color:var(--mu);font-weight:700;border-right:1px solid var(--bo2);height:${HEADER_H}px;box-sizing:border-box}
      .pl-col-h:last-child{border-right:0}
      .pl-col-h.today{background:var(--ap);color:var(--a)}
      .pl-col-h .day-name{display:block;font-size:10px;letter-spacing:1px;text-transform:uppercase}
      .pl-col-h .day-num{display:block;font-family:var(--fd);font-size:15px;color:var(--ink);font-weight:800;margin-top:2px;line-height:1}
      .pl-col-h.today .day-num{color:var(--a)}

      .pl-hour{background:var(--bg2);border-right:1px solid var(--bo2);border-bottom:1px dashed var(--bo2);height:${ROW_H}px;font-family:var(--fn);font-size:10px;color:var(--mu);text-align:right;padding:3px 6px;font-weight:700;box-sizing:border-box}

      .pl-day{position:relative;border-right:1px solid var(--bo2);border-bottom:1px solid var(--bo2);height:${ROW_H}px;cursor:pointer;transition:background .12s;box-sizing:border-box;outline:none}
      .pl-day:hover,.pl-day:focus-visible{background:var(--ap)}
      .pl-day:focus-visible{box-shadow:inset 0 0 0 2px var(--a);z-index:1}
      .pl-day.today{background:rgba(99,102,241,.04)}
      .pl-day.today:hover{background:var(--ap)}
      .pl-day:last-child{border-right:0}
      /* "+" qui apparaît au hover/focus sur cellule vide */
      .pl-day:not(:has(.pl-event))::after{content:'+';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--mu2);font-size:18px;font-weight:300;opacity:0;transition:opacity .15s;pointer-events:none}
      .pl-day:not(:has(.pl-event)):hover::after,.pl-day:not(:has(.pl-event)):focus-visible::after{opacity:.5;color:var(--a)}

      .pl-event{position:absolute;left:3px;right:3px;border-radius:7px;border:1px solid;padding:5px 7px;font-size:11px;font-weight:600;overflow:hidden;cursor:grab;transition:transform .12s,box-shadow .12s,opacity .15s;z-index:2;user-select:none;-webkit-user-select:none;outline:none;animation:pl-evt-in .35s cubic-bezier(.2,.7,.3,1) both;animation-delay:var(--pl-delay,0s)}
      @keyframes pl-evt-in{from{opacity:0;transform:translateY(4px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media (prefers-reduced-motion:reduce){.pl-event{animation:none}}
      .pl-event:hover{transform:translateY(-1px);box-shadow:0 8px 18px -6px rgba(11,13,26,.25);z-index:3}
      .pl-event:focus-visible{box-shadow:0 0 0 3px var(--ap),0 8px 18px -6px rgba(11,13,26,.25);z-index:4}
      .pl-event:active{cursor:grabbing}
      .pl-event.dragging{opacity:.35;transform:scale(.96);cursor:grabbing;box-shadow:var(--s2)}
      .pl-day.drop-target{background:rgba(99,102,241,.18);box-shadow:inset 0 0 0 2px var(--a)}
      .pl-day.drop-invalid{background:rgba(239,68,68,.12);box-shadow:inset 0 0 0 2px var(--rd)}

      /* Badge numéro d'heure élève */
      .pl-event .ev-num{position:absolute;top:4px;right:4px;background:rgba(11,13,26,.18);color:inherit;font-family:var(--fn);font-size:9px;font-weight:800;padding:1px 5px;border-radius:99px;letter-spacing:.3px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}

      /* Indicateur heure courante (ligne rouge horizontale qui traverse) */
      .pl-now{position:absolute;left:60px;right:0;height:2px;background:#ef4444;z-index:6;pointer-events:none;box-shadow:0 0 8px rgba(239,68,68,.5)}
      .pl-now::before{content:'';position:absolute;left:-6px;top:-4px;width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px rgba(239,68,68,.7)}
      .pl-now-lbl{position:absolute;left:8px;top:-9px;font-family:var(--fn);font-size:9.5px;font-weight:800;color:#ef4444;background:#fff;padding:1px 5px;border-radius:4px;border:1px solid rgba(239,68,68,.3);letter-spacing:.3px}
      .pl-event .ev-h{font-family:var(--fn);font-weight:800;font-size:10.5px;display:flex;align-items:center;gap:3px}
      .pl-event .ev-nm{margin-top:1px;font-weight:600;color:var(--ink);line-height:1.2;font-size:11.5px}
      .pl-event .ev-lieu{color:var(--mu);font-size:10px;margin-top:1px}

      /* Modal */
      .pl-modal{position:fixed;inset:0;background:rgba(11,13,26,.5);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;z-index:90;padding:14px}
      .pl-modal.show{display:flex;animation:plFade .2s ease}
      @keyframes plFade{from{opacity:0}to{opacity:1}}
      .pl-modal .pm-panel{background:var(--bg);width:100%;max-width:480px;max-height:92vh;overflow:auto;border-radius:var(--rx);box-shadow:var(--s3);animation:plSlide .25s cubic-bezier(.2,.7,.3,1)}
      @keyframes plSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      .pm-h{padding:16px;border-bottom:1px solid var(--bo2);display:flex;align-items:center;justify-content:space-between}
      .pm-h .ti{font-family:var(--fd);font-weight:800;font-size:16px}
      .pm-h .id{font-family:var(--fn);font-size:11px;color:var(--mu);margin-top:2px;font-weight:700}
      .pm-h .close{width:32px;height:32px;border-radius:50%;background:var(--bg2);color:var(--ink);font-size:18px;border:0;cursor:pointer}
      .pm-b{padding:16px}
      .pm-row{margin-bottom:14px}
      .pm-row label{display:block;font-size:10.5px;font-weight:800;color:var(--mu);letter-spacing:1px;margin-bottom:6px}
      .pm-row input, .pm-row select{width:100%;height:40px;padding:0 12px;border:1px solid var(--bo);border-radius:8px;font-family:var(--fb);font-size:13.5px;color:var(--ink);background:var(--su)}
      .pm-row input:focus, .pm-row select:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 3px var(--ap)}
      .pm-types{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
      .pm-type{padding:10px 4px;text-align:center;border-radius:8px;border:2px solid var(--bo);background:var(--su);cursor:pointer;font-family:inherit;transition:all .12s}
      .pm-type:hover{border-color:var(--mu2)}
      .pm-type.sel{border-color:var(--a);background:var(--ap)}
      .pm-type .em{font-size:18px;line-height:1}
      .pm-type .lb{font-size:10.5px;font-weight:700;margin-top:4px;color:var(--ink)}
      .pm-cta{display:grid;grid-template-columns:1fr 2fr;gap:8px;margin-top:18px}
      .pm-cta.three{grid-template-columns:1fr 1fr 1.5fr}
      .pm-info{padding:12px;background:var(--bg2);border-radius:8px;font-size:12.5px;color:var(--ink);line-height:1.55;margin-bottom:14px}
      .pm-info b{color:var(--a)}
    </style>

    <div class="pl-wrap anim-slide-up">
      <div class="pl-top">
        <button class="pl-back" id="pl-back" aria-label="Retour">‹</button>
        <span class="pg-logo-txt">PermiGo</span>
        <div>
          <div class="ttl">Planning</div>
          <div class="sub">${esc(_me.nom)}</div>
        </div>
        <div class="pl-nav">
          <span id="pl-bell"></span>
          <button class="nav-arrow" id="pl-prev" aria-label="Semaine précédente">‹</button>
          <button class="nav-today" id="pl-today">Aujourd'hui</button>
          <button class="nav-arrow" id="pl-next" aria-label="Semaine suivante">›</button>
          <div class="nav-week">${weekLabel()}</div>
        </div>
      </div>

      ${renderNowNextWidget()}

      <div class="pl-viewtoggle" role="tablist" aria-label="Vue planning">
        <button data-view="day"    class="${_viewMode === 'day' ? 'on' : ''}" type="button">Jour</button>
        <button data-view="3days"  class="${_viewMode === '3days' ? 'on' : ''}" type="button">3 jours</button>
        <button data-view="week"   class="${_viewMode === 'week' ? 'on' : ''}" type="button">Semaine</button>
      </div>

      <div class="pl-legend">
        <span><i style="background:var(--gr)"></i>Confirmée</span>
        <span><i style="background:var(--am)"></i>En attente</span>
        <span><i style="background:var(--a)"></i>Dispo (réservable)</span>
        <span><i style="background:var(--mu2)"></i>Perso</span>
        <span><i style="background:var(--rd)"></i>Absence</span>
      </div>

      <div class="pl-grid" role="grid" aria-label="Planning semaine ${esc(weekLabel())}" style="position:relative">
        ${renderColumnHeaders()}
        ${renderRows()}
        ${renderNowIndicator()}
      </div>

      <div style="height:24px"></div>
    </div>

    <div class="pl-modal" id="pl-modal" role="dialog" aria-modal="true" aria-label="Détails du créneau"><div class="pm-panel" id="pl-modal-panel"></div></div>
  `;

  wire();
}

function renderColumnHeaders() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cells = ['<div class="pl-col-h" style="border-right:1px solid var(--bo2)"></div>'];
  const n = numDays();
  for (let i = 0; i < n; i++) {
    const d = addDays(_weekRef, i);
    const isToday = d.getTime() === today.getTime();
    // Si vue 'week', WEEK_DAYS[i] (Lun..Dim). Sinon, on prend le jour réel.
    const wdLabels = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
    const dayName = _viewMode === 'week' ? WEEK_DAYS[i] : wdLabels[d.getDay()];
    cells.push(`
      <div class="pl-col-h ${isToday ? 'today' : ''}">
        <span class="day-name">${dayName}</span>
        <span class="day-num">${d.getDate()}</span>
      </div>
    `);
  }
  return cells.join('');
}

function renderRows() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const out = [];
  const n = numDays();
  for (let r = 0; r < ROWS; r++) {
    const hour = HOUR_START + r;
    out.push(`<div class="pl-hour" role="rowheader">${String(hour).padStart(2, '0')}:00</div>`);
    for (let c = 0; c < n; c++) {
      const d = addDays(_weekRef, c);
      const isToday = d.getTime() === today.getTime();
      const iso = isoDate(d);
      const evtsInCell = _events.filter(e => e.date_event === iso && cellMatchesHour(e.h, hour));
      const hLabel = `${String(hour).padStart(2, '0')}:00`;
      const dLabel = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'][c];
      out.push(`
        <div class="pl-day ${isToday ? 'today' : ''}" data-iso="${iso}" data-h="${hLabel}"
             role="gridcell" tabindex="0"
             aria-label="${dLabel} ${d.getDate()} à ${hLabel}${evtsInCell.length === 0 ? ' — créneau vide, appuyez pour créer' : ''}">
          ${evtsInCell.map((e, i) => renderEventBlock(e, i)).join('')}
        </div>
      `);
    }
  }
  return out.join('');
}

/**
 * Widget "Maintenant / Suivant" — état contextuel de la journée pour le moniteur.
 * Affiche 1 card (ou 2) selon le contexte temps réel :
 *  - Leçon en cours → "EN COURS" + nom élève + temps restant + CTA "Évaluer"
 *  - Leçon suivante → "SUIVANT" + heure + nom + temps avant
 *  - Pause entre leçons → "PAUSE" + prochaine dans X min
 *  - Plus rien aujourd'hui → "Journée terminée 🎉"
 */
function renderNowNextWidget() {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const nowMin = today.getHours() * 60 + today.getMinutes();

  // Filtre uniquement les leçons du jour (conf + pend), trie par heure
  const todayLessons = _events
    .filter(e => e.date_event === todayIso && isLecon(e.t))
    .map(e => {
      const [hh, mm] = String(e.h || '00:00').split(':').map(Number);
      const startMin = (hh || 0) * 60 + (mm || 0);
      const endMin = startMin + Math.round((parseFloat(e.dur) || 1) * 60);
      return { ...e, startMin, endMin };
    })
    .sort((a, b) => a.startMin - b.startMin);

  const current = todayLessons.find(e => e.startMin <= nowMin && e.endMin > nowMin);
  const next = todayLessons.find(e => e.startMin > nowMin);
  const allPast = todayLessons.length > 0 && !current && !next;

  // Pas de leçon du tout aujourd'hui
  if (todayLessons.length === 0) {
    return `
      <div class="pl-now-card">
        <div class="pl-nc idle empty-state">
          <div class="pl-nc-em">🌴</div>
          <div class="pl-nc-nm">Aucune leçon aujourd'hui</div>
          <div class="pl-nc-meta">Profite de ta journée libre</div>
        </div>
      </div>
    `;
  }

  // Toutes les leçons sont passées
  if (allPast) {
    const last = todayLessons[todayLessons.length - 1];
    const livretsPendants = todayLessons.filter(e => eventKind(e.t) === 'conf' && !e.livret_rempli).length;
    return `
      <div class="pl-now-card">
        <div class="pl-nc done empty-state">
          <div class="pl-nc-em">🎉</div>
          <div class="pl-nc-nm">Journée terminée — bien joué !</div>
          <div class="pl-nc-meta">${todayLessons.length} leçon${todayLessons.length > 1 ? 's' : ''} aujourd'hui${livretsPendants ? ` · ${livretsPendants} livret${livretsPendants > 1 ? 's' : ''} à remplir` : ''}</div>
        </div>
      </div>
    `;
  }

  let html = '<div class="pl-now-card">';

  // Carte EN COURS
  if (current) {
    const remainingMin = current.endMin - nowMin;
    const eleveNom = eleveNomFor(current);
    const hh = String(Math.floor(current.startMin / 60)).padStart(2, '0');
    const mm = String(current.startMin % 60).padStart(2, '0');
    html += `
      <div class="pl-nc live">
        <div class="pl-nc-body">
          <div class="pl-nc-lbl"><span class="pl-nc-dot"></span> En cours</div>
          <div class="pl-nc-nm">${esc(eleveNom)}${current.numero_heure_eleve ? ` <small style="font-family:var(--fn);font-weight:700;color:var(--mu);font-size:11px">· ${current.numero_heure_eleve}ème h</small>` : ''}</div>
          <div class="pl-nc-meta">${current.lieu ? '📍 ' + esc(current.lieu) : 'Lieu non défini'}</div>
          <div class="pl-nc-time">⏱ ${remainingMin}min restantes · démarrée à ${hh}:${mm}</div>
        </div>
        <button class="pl-nc-cta" data-evt-eval="${esc(current.id)}" type="button" aria-label="Évaluer cette leçon">📝 Évaluer</button>
      </div>
    `;
  }

  // Carte SUIVANTE
  if (next) {
    const minBefore = next.startMin - nowMin;
    const hLabel = `${String(Math.floor(next.startMin / 60)).padStart(2, '0')}:${String(next.startMin % 60).padStart(2, '0')}`;
    const eleveNom = eleveNomFor(next);
    const inLabel = minBefore < 60
      ? `dans ${minBefore} min`
      : `dans ${Math.floor(minBefore / 60)}h${String(minBefore % 60).padStart(2, '0')}`;
    html += `
      <div class="pl-nc next">
        <div class="pl-nc-body">
          <div class="pl-nc-lbl">${current ? 'Ensuite' : 'Prochaine leçon'}</div>
          <div class="pl-nc-nm">${esc(eleveNom)}${next.numero_heure_eleve ? ` <small style="font-family:var(--fn);font-weight:700;color:var(--mu);font-size:11px">· ${next.numero_heure_eleve}ème h</small>` : ''}</div>
          <div class="pl-nc-meta">${next.lieu ? '📍 ' + esc(next.lieu) : 'Lieu non défini'} · ${next.dur}h</div>
          <div class="pl-nc-time">🕒 ${hLabel} · ${inLabel}</div>
        </div>
        <button class="pl-nc-cta" data-evt-detail="${esc(next.id)}" type="button" aria-label="Voir les détails de la leçon suivante">Détails ›</button>
      </div>
    `;
  }

  // Si pas de current ET pas de next mais des leçons à venir (gap calculé)
  if (!current && !next && todayLessons.length > 0) {
    html += `
      <div class="pl-nc idle empty-state">
        <div class="pl-nc-em">☕</div>
        <div class="pl-nc-nm">Pause — pas de prochaine leçon</div>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/** Position verticale (px) de la ligne "maintenant" si la semaine en cours contient aujourd'hui. */
function renderNowIndicator() {
  const now = new Date();
  const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
  const dayIdx = ((now.getDay() + 6) % 7); // 0=lundi
  const weekDay = addDays(_weekRef, dayIdx);
  weekDay.setHours(0, 0, 0, 0);
  if (weekDay.getTime() !== today0.getTime()) return ''; // semaine ≠ celle d'aujourd'hui

  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour < HOUR_START || hour >= HOUR_END) return ''; // hors plage 6h-22h

  const topRel = (hour - HOUR_START) * ROW_H + HEADER_H;
  const colW = `calc((100% - 64px) / 7)`;
  const left = `calc(64px + ${dayIdx} * ${colW})`;
  const width = colW;
  const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return `<div class="pl-now" style="top:${topRel}px;left:${left};width:${width}"><span class="pl-now-lbl">${timeLabel}</span></div>`;
}

/** L'event commence dans cette heure (HH:00 ou HH:30) ? */
function cellMatchesHour(eventH, hour) {
  if (!eventH) return false;
  const eHour = parseInt(eventH.split(':')[0], 10);
  return eHour === hour;
}

function renderEventBlock(e, idx = 0) {
  const kind = eventKind(e.t);
  const col = eventColor(kind);
  const dur = parseFloat(e.dur) || 1;
  const startMin = parseInt(e.h.split(':')[1] || '0', 10);
  const top = (startMin / 60) * ROW_H + 1;
  const height = dur * ROW_H - 4;
  const eleveNom = eleveNomFor(e);

  // Badge "Livret à remplir" sur leçon passée non remplie
  const today = new Date().toISOString().slice(0, 10);
  const livretAReclamer = kind === 'conf' && e.date_event && e.date_event < today && !e.livret_rempli;

  // ARIA description complète
  const kindLabel = ({ conf: 'Leçon confirmée', pend: 'Réservation en attente', dispo: 'Créneau disponible', perso: 'Créneau perso', absence: 'Absence' })[kind] || 'Événement';
  const aria = [kindLabel, e.h, `${dur} heure${dur > 1 ? 's' : ''}`, eleveNom, e.lieu, livretAReclamer ? 'livret à remplir' : null]
    .filter(Boolean).join(' · ');

  const delay = Math.min(0.5, idx * 0.04).toFixed(2);

  return `
    <div class="pl-event" data-id="${esc(e.id)}" draggable="true"
         role="button" tabindex="0"
         aria-label="${esc(aria)}"
         style="top:${top}px;height:${height}px;background:${col.bg};border-color:${col.bd};color:${col.ink};--pl-delay:${delay}s">
      <div class="ev-h">${col.emoji} ${esc(e.h)}<span style="opacity:.6;font-weight:600;margin-left:auto">${dur}h</span></div>
      ${eleveNom ? `<div class="ev-nm">${esc(eleveNom)}</div>` : ''}
      ${e.lieu ? `<div class="ev-lieu">📍 ${esc(e.lieu)}</div>` : ''}
      ${e.numero_heure_eleve ? `<span class="ev-num" aria-label="${e.numero_heure_eleve}ème heure de l'élève">#${e.numero_heure_eleve}</span>` : ''}
      ${livretAReclamer ? `<div style="margin-top:4px;font-size:9.5px;font-weight:800;color:#92400e;background:#fde68a;padding:2px 6px;border-radius:4px;display:inline-block">📝 LIVRET</div>` : ''}
    </div>
  `;
}

// ─── Wiring ───

function wire() {
  // Cloche notifs
  const bellHost = _root.querySelector('#pl-bell');
  if (bellHost) mountNotifBell(bellHost);

  // Retour vers Mes Élèves
  _root.querySelector('#pl-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/mes-eleves');
  });

  // Navigation semaines
  const step = numDays();
  _root.querySelector('#pl-prev')?.addEventListener('click', () => navigateWeek(-step));
  _root.querySelector('#pl-next')?.addEventListener('click', () => navigateWeek(step));

  // Toggle vue Jour / 3 jours / Semaine
  _root.querySelectorAll('[data-view]').forEach(b => {
    b.addEventListener('click', async () => {
      const next = b.dataset.view;
      if (next === _viewMode) return;
      _viewMode = next;
      try { localStorage.setItem('pl-view', next); } catch {}
      // Si on passe en vue 'week', recale _weekRef sur le lundi de la semaine courante
      if (next === 'week') _weekRef = weekStart(_weekRef);
      await load();
      render();
    });
  });
  _root.querySelector('#pl-today')?.addEventListener('click', () => {
    // Aujourd'hui : mode 'week' → lundi de la semaine courante ; mode 'day'/'3days' → aujourd'hui
    const today = new Date(); today.setHours(0, 0, 0, 0);
    _weekRef = _viewMode === 'week' ? weekStart(today) : today;
    refresh();
  });

  // Click + clavier cellule vide → nouveau créneau
  _root.querySelectorAll('.pl-day').forEach(cell => {
    const onActivate = (e) => {
      if (e.target.closest('.pl-event')) return;
      openCreateModal(cell.dataset.iso, cell.dataset.h);
    };
    cell.addEventListener('click', onActivate);
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate(e);
      }
    });
  });

  // Click + clavier event → détails
  _root.querySelectorAll('.pl-event').forEach(ev => {
    const open = () => {
      const id = ev.dataset.id;
      const evt = _events.find(x => x.id === id);
      if (evt) openDetailsModal(evt);
    };
    ev.addEventListener('click', (e) => {
      e.stopPropagation();
      open();
    });
    ev.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        open();
      }
    });
  });

  // Boutons du widget "Maintenant / Suivant"
  _root.querySelectorAll('[data-evt-eval]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const evt = _events.find(x => x.id === b.dataset.evtEval);
      if (evt) openReviewModal(evt);
    });
  });
  _root.querySelectorAll('[data-evt-detail]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const evt = _events.find(x => x.id === b.dataset.evtDetail);
      if (evt) openDetailsModal(evt);
    });
  });

  // Close modal au backdrop + Escape
  const modal = _root.querySelector('#pl-modal');
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
  document.addEventListener('keydown', _onEscape);

  // ─── Drag & Drop des events sur les cellules ───
  wireDragDrop();
}

function _onEscape(e) {
  if (e.key !== 'Escape') return;
  const modal = _root?.querySelector('#pl-modal.show');
  if (modal) modal.classList.remove('show');
}

let _dragging = null;
let _lastDropTarget = null;

function wireDragDrop() {
  _root.querySelectorAll('.pl-event').forEach(ev => {
    ev.addEventListener('dragstart', (e) => {
      const id = ev.dataset.id;
      _dragging = _events.find(x => x.id === id) || null;
      if (!_dragging) return;
      ev.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', id); } catch (_) {}
      // Ghost transparent (le navigateur en garde un mais on cache l'original via .dragging)
    });
    ev.addEventListener('dragend', () => {
      ev.classList.remove('dragging');
      if (_lastDropTarget) _lastDropTarget.classList.remove('drop-target', 'drop-invalid');
      _lastDropTarget = null;
      _dragging = null;
    });
  });

  _root.querySelectorAll('.pl-day').forEach(cell => {
    cell.addEventListener('dragover', (e) => {
      if (!_dragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (_lastDropTarget && _lastDropTarget !== cell) {
        _lastDropTarget.classList.remove('drop-target', 'drop-invalid');
      }
      cell.classList.add('drop-target');
      _lastDropTarget = cell;
    });
    cell.addEventListener('dragleave', () => {
      cell.classList.remove('drop-target', 'drop-invalid');
      if (_lastDropTarget === cell) _lastDropTarget = null;
    });
    cell.addEventListener('drop', async (e) => {
      if (!_dragging) return;
      e.preventDefault();
      cell.classList.remove('drop-target', 'drop-invalid');

      const moving = _dragging;
      _dragging = null;

      const newIso = cell.dataset.iso;
      const newH = cell.dataset.h;

      // Pas de changement → no-op (et on laisse le click handler ouvrir le modal si besoin)
      if (newIso === moving.date_event && newH === moving.h) return;

      const kind = eventKind(moving.t);

      if (kind === 'conf' || kind === 'pend') {
        // Passe par le service (validations métier R1/R4/R5)
        const result = await modifyLecon({
          leconId: moving.id,
          changes: { dateIso: newIso, h: newH },
        });
        if (!result.ok) {
          toast(result.errors[0] || 'Déplacement impossible', 'error');
          return;
        }
        if (result.warnings && result.warnings.length) {
          toast('⚠️ ' + result.warnings[0], 'info');
        }
      } else {
        // dispo / perso / absence → update direct (pas de logique métier)
        const dow = jsDayToWeekIdx(new Date(newIso + 'T00:00:00').getDay()) + 1;
        const { error } = await sb.from('events').update({
          date_event: newIso, h: newH, d: dow,
        }).eq('id', moving.id);
        if (error) {
          toast('Erreur déplacement', 'error');
          return;
        }
      }

      toast('Créneau déplacé ✓', 'success');
      await refresh();
    });
  });
}

async function navigateWeek(deltaDays) {
  _weekRef = addDays(_weekRef, deltaDays);
  await refresh();
}

async function refresh() {
  await load();
  render();
}

// ─── Modal CRÉER ───

// ─── Helpers temps (utilisés par le modal create) ───
function addHours(hhmm, h) {
  const [hh, mm] = (hhmm || '09:00').split(':').map(Number);
  const total = hh * 60 + (mm || 0) + h * 60;
  const nh = Math.min(23, Math.floor(total / 60));
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function hoursBetween(start, end) {
  const [sh, sm] = (start || '00:00').split(':').map(Number);
  const [eh, em] = (end || '00:00').split(':').map(Number);
  const min = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
  return Math.round((min / 60) * 100) / 100;
}

function formatDur(h) {
  if (h < 1) return Math.round(h * 60) + 'min';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`;
}

function formatDateFR(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Calcule les créneaux libres (au pas horaire) pour une date donnée — exclut les events occupés. */
function computeFreeSlotsForDate(dateIso, durHours = 1) {
  const slots = [];
  for (let h = 6; h <= 21; h++) slots.push(`${String(h).padStart(2, '0')}:00`);
  const occupied = (_events || []).filter(e => e.date_event === dateIso && !e.is_deleted && (e.t || '').toLowerCase() !== 'absence');
  return slots.filter(slot => {
    const [sh, sm] = slot.split(':').map(Number);
    const slotStart = sh * 60 + (sm || 0);
    const slotEnd = slotStart + durHours * 60;
    for (const ev of occupied) {
      const [eh, em] = (ev.h || '').split(':').map(Number);
      if (Number.isNaN(eh)) continue;
      const evStart = eh * 60 + (em || 0);
      const evEnd = evStart + (parseFloat(ev.dur) || 1) * 60;
      if (slotStart < evEnd && evStart < slotEnd) return false;
    }
    return true;
  });
}

/** Overlay plein écran avec DateTimePicker → calendrier + slots LIBRES uniquement. */
function openFreeSlotsPicker(parentPanel, initialDate, initialTime, onPick) {
  const overlay = document.createElement('div');
  overlay.className = 'pm-dtp-overlay';
  overlay.innerHTML = `
    <style>
      .pm-dtp-overlay{position:fixed;inset:0;z-index:9300;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(8,10,20,.7);backdrop-filter:blur(8px);opacity:0;transition:opacity .25s}
      .pm-dtp-overlay.in{opacity:1}
      .pm-dtp-card{background:var(--su);border-radius:18px;padding:0;width:100%;max-width:680px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px -16px rgba(0,0,0,.5);transform:translateY(20px) scale(.96);transition:transform .35s cubic-bezier(.34,1.56,.64,1)}
      .pm-dtp-overlay.in .pm-dtp-card{transform:translateY(0) scale(1)}
      .pm-dtp-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--bo)}
      .pm-dtp-ti{font-family:var(--fd);font-weight:900;font-size:17px;letter-spacing:-.01em;color:var(--ink);margin:0}
      .pm-dtp-sub{font-size:11.5px;color:var(--mu);margin-top:2px}
      .pm-dtp-close{width:32px;height:32px;border-radius:50%;background:var(--bg2);border:0;cursor:pointer;font-size:14px;color:var(--mu);transition:background .15s}
      .pm-dtp-close:hover{background:var(--bo)}
      .pm-dtp-body{padding:16px;overflow-y:auto;flex:1}
      .pm-dtp-foot{display:flex;gap:10px;padding:14px 20px;border-top:1px solid var(--bo);background:var(--bg2)}
      .pm-dtp-btn{flex:1;padding:11px 14px;border-radius:11px;font-family:var(--fd);font-weight:700;font-size:13.5px;cursor:pointer;border:1px solid var(--bo);background:var(--su);color:var(--ink);transition:background .15s}
      .pm-dtp-btn:hover{background:var(--bg2)}
      .pm-dtp-btn.primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;color:#fff;flex:1.5;box-shadow:0 6px 16px -4px rgba(99,102,241,.5)}
      .pm-dtp-btn.primary[disabled]{opacity:.5;cursor:not-allowed}
    </style>
    <div class="pm-dtp-card">
      <header class="pm-dtp-head">
        <div>
          <h3 class="pm-dtp-ti">Créneaux libres</h3>
          <div class="pm-dtp-sub">Tu vois uniquement les heures sans événement</div>
        </div>
        <button class="pm-dtp-close" type="button" aria-label="Fermer">✕</button>
      </header>
      <div class="pm-dtp-body" id="pm-dtp-mount"></div>
      <footer class="pm-dtp-foot">
        <button class="pm-dtp-btn" id="pm-dtp-cancel" type="button">Annuler</button>
        <button class="pm-dtp-btn primary" id="pm-dtp-ok" type="button" disabled>Choisir ce créneau</button>
      </footer>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('in'));

  let chosen = { date: initialDate, time: initialTime };

  const mount = overlay.querySelector('#pm-dtp-mount');
  mountDateTimePicker(mount, {
    mode: 'single',
    minDate: isoDate(new Date()),
    selectedDate: initialDate,
    selectedTime: initialTime,
    computeAvailableTimes: (date) => computeFreeSlotsForDate(date, 1),
    onChange: ({ date, time }) => {
      chosen = { date, time };
      overlay.querySelector('#pm-dtp-ok').disabled = !(date && time);
    },
  });

  const close = () => {
    overlay.classList.remove('in');
    setTimeout(() => overlay.remove(), 250);
  };
  overlay.querySelector('.pm-dtp-close').onclick = close;
  overlay.querySelector('#pm-dtp-cancel').onclick = close;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#pm-dtp-ok').onclick = () => {
    if (!chosen.date || !chosen.time) return;
    onPick(chosen.date, chosen.time);
    close();
  };
}

function openCreateModal(iso, hour) {
  const panel = _root.querySelector('#pl-modal-panel');
  panel.innerHTML = `
    <div class="pm-h">
      <div>
        <div class="ti">Nouveau créneau</div>
        <div class="id">${esc(iso)} · ${esc(hour)}</div>
      </div>
      <button class="close" id="pm-close">×</button>
    </div>
    <div class="pm-b">
      <div class="pm-row">
        <label>Type</label>
        <div class="pm-types">
          <button class="pm-type sel" data-t="dispo"><div class="em">📅</div><div class="lb">Dispo</div></button>
          <button class="pm-type" data-t="conf"><div class="em">✅</div><div class="lb">Leçon</div></button>
          <button class="pm-type" data-t="perso"><div class="em">🔒</div><div class="lb">Perso</div></button>
          <button class="pm-type" data-t="absence"><div class="em">🚫</div><div class="lb">Absence</div></button>
        </div>
      </div>

      <div class="pm-row" id="pm-eleve-row" style="display:none">
        <label>Élève</label>
        <select id="pm-eleve">
          <option value="">— Choisir un élève —</option>
          ${_eleves.map(e => `<option value="${esc(e.id)}">${esc(e.nom)}</option>`).join('')}
        </select>
      </div>

      <!-- Plage horaire : mode "De → À" pour DISPO, mode "Début + Durée" pour le reste -->
      <div class="pm-row" id="pm-time-range" style="display:none">
        <label>Plage horaire</label>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:end">
          <div>
            <div style="font-size:10.5px;color:var(--mu);font-weight:700;margin-bottom:4px;letter-spacing:.2px">DE</div>
            <input type="time" id="pm-h-start" value="${esc(hour)}" step="1800" style="width:100%">
          </div>
          <div style="font-size:18px;color:var(--mu);font-weight:800;padding-bottom:8px">→</div>
          <div>
            <div style="font-size:10.5px;color:var(--mu);font-weight:700;margin-bottom:4px;letter-spacing:.2px">À</div>
            <input type="time" id="pm-h-end" value="${esc(addHours(hour, 2))}" step="1800" style="width:100%">
          </div>
        </div>
        <div id="pm-range-info" style="font-size:11.5px;color:var(--mu);margin-top:6px;display:flex;align-items:center;gap:6px"><span>⏱</span><span id="pm-range-dur">2h</span> de disponibilité</div>
      </div>

      <div class="pm-row" id="pm-time-single">
        <label style="display:flex;align-items:center;justify-content:space-between">
          <span>Heure de début</span>
          <button type="button" id="pm-open-dtp" style="background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);color:var(--a);font-size:11px;font-weight:700;padding:4px 9px;border-radius:7px;cursor:pointer;font-family:inherit;display:none;align-items:center;gap:4px">📅 Voir créneaux libres</button>
        </label>
        <div id="pm-date-display" style="font-size:11.5px;color:var(--mu);margin-bottom:6px;font-weight:600">📅 ${esc(formatDateFR(iso))}</div>
        <input type="time" id="pm-h" value="${esc(hour)}" step="1800">
      </div>

      <div class="pm-row" id="pm-dur-row">
        <label>Durée (heures)</label>
        <select id="pm-dur">
          <option value="1">1h</option>
          <option value="1.5">1h30</option>
          <option value="2" selected>2h</option>
          <option value="2.5">2h30</option>
          <option value="3">3h</option>
        </select>
      </div>

      <div class="pm-row">
        <label>Lieu (optionnel)</label>
        <input type="text" id="pm-lieu" placeholder="Ex. Nanterre · RDV Mairie" maxlength="80" list="pm-lieux-datalist">
        <datalist id="pm-lieux-datalist"></datalist>
        <div id="pm-lieux-fav" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px"></div>
      </div>

      <!-- Plan de leçon prédéfini (visible uniquement pour leçon) -->
      <div class="pm-row" id="pm-plan-row" style="display:none">
        <label>Thème de la leçon (optionnel)</label>
        <style>
          .pm-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
          .pm-plan{padding:9px 6px;border-radius:8px;border:1.5px solid var(--bo);background:var(--su);cursor:pointer;text-align:center;transition:all .12s;font-family:inherit}
          .pm-plan:hover{border-color:var(--a)}
          .pm-plan.sel{border-color:var(--a);background:var(--ap)}
          .pm-plan .em{font-size:18px;line-height:1}
          .pm-plan .nm{font-size:10.5px;font-weight:800;color:var(--ink);margin-top:3px;line-height:1.1}
        </style>
        <div class="pm-plans" id="pm-plans">
          ${PLANS_LECON.map(p => `<button class="pm-plan" data-plan="${esc(p.id)}" type="button" title="${esc(p.desc)}"><div class="em">${p.ico}</div><div class="nm">${esc(p.name)}</div></button>`).join('')}
        </div>
      </div>

      <!-- Récurrence (visible uniquement pour dispo) -->
      <div class="pm-row" id="pm-recur-row">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="pm-recur" style="width:18px;height:18px;cursor:pointer">
          <span style="font-size:12.5px;color:var(--ink);font-weight:600;letter-spacing:.2px;text-transform:none">🔁 Créer ce créneau chaque semaine pendant</span>
          <input type="number" id="pm-recur-weeks" value="4" min="1" max="20" style="width:50px;text-align:center;padding:4px;border:1px solid var(--bo);border-radius:6px" disabled>
          <span style="font-size:12px;color:var(--mu)">semaines</span>
        </label>
      </div>

      <div class="pm-cta">
        <button class="btn" id="pm-cancel">Annuler</button>
        <button class="btn btn-p" id="pm-save">Créer</button>
      </div>
    </div>
  `;

  // State local
  let pickedType = 'dispo';
  let pickedPlan = null;
  const typeRow = panel.querySelectorAll('.pm-type');
  const eleveRow = panel.querySelector('#pm-eleve-row');
  const planRow = panel.querySelector('#pm-plan-row');
  const recurRow = panel.querySelector('#pm-recur-row');

  // Date courante (modifiable via le DateTimePicker pour LEÇON)
  let pickedDate = iso;

  function updateRowsVisibility() {
    eleveRow.style.display = (pickedType === 'conf') ? 'block' : 'none';
    planRow.style.display = (pickedType === 'conf') ? 'block' : 'none';
    recurRow.style.display = (pickedType === 'dispo') ? 'block' : 'none';
    // DISPO → plage horaire "De → À"  |  autres → heure début + durée
    const isDispo = pickedType === 'dispo';
    panel.querySelector('#pm-time-range').style.display = isDispo ? 'block' : 'none';
    panel.querySelector('#pm-time-single').style.display = isDispo ? 'none' : 'block';
    panel.querySelector('#pm-dur-row').style.display = isDispo ? 'none' : 'block';
    // Bouton "📅 Voir créneaux libres" : uniquement pour LEÇON
    const dtpBtn = panel.querySelector('#pm-open-dtp');
    if (dtpBtn) dtpBtn.style.display = (pickedType === 'conf') ? 'inline-flex' : 'none';
  }

  // Bouton "📅 Voir créneaux libres" → ouvre overlay DateTimePicker
  panel.querySelector('#pm-open-dtp')?.addEventListener('click', () => {
    openFreeSlotsPicker(panel, pickedDate, panel.querySelector('#pm-h').value, (date, time) => {
      pickedDate = date;
      panel.querySelector('#pm-h').value = time;
      panel.querySelector('#pm-date-display').innerHTML = `📅 ${formatDateFR(date)}`;
    });
  });

  // Recalcule la durée affichée en mode plage à chaque changement
  const updateRangeDur = () => {
    const s = panel.querySelector('#pm-h-start')?.value;
    const e = panel.querySelector('#pm-h-end')?.value;
    const info = panel.querySelector('#pm-range-info');
    if (!s || !e || !info) return;
    const dur = hoursBetween(s, e);
    const lbl = panel.querySelector('#pm-range-dur');
    if (dur <= 0) {
      info.style.color = '#dc2626';
      if (lbl) lbl.textContent = 'fin avant le début';
    } else {
      info.style.color = 'var(--mu)';
      if (lbl) lbl.textContent = formatDur(dur);
    }
  };
  panel.querySelector('#pm-h-start')?.addEventListener('change', updateRangeDur);
  panel.querySelector('#pm-h-end')?.addEventListener('change', updateRangeDur);
  updateRangeDur();

  typeRow.forEach(b => {
    b.addEventListener('click', () => {
      typeRow.forEach(o => o.classList.remove('sel'));
      b.classList.add('sel');
      pickedType = b.dataset.t;
      updateRowsVisibility();
    });
  });
  updateRowsVisibility();

  // ─── Plans de leçon ───
  panel.querySelectorAll('[data-plan]').forEach(b => {
    b.addEventListener('click', () => {
      if (pickedPlan === b.dataset.plan) {
        pickedPlan = null;
        b.classList.remove('sel');
      } else {
        panel.querySelectorAll('.pm-plan').forEach(o => o.classList.remove('sel'));
        b.classList.add('sel');
        pickedPlan = b.dataset.plan;
      }
    });
  });

  // ─── Récurrence ───
  const recurCheck = panel.querySelector('#pm-recur');
  const recurWeeks = panel.querySelector('#pm-recur-weeks');
  recurCheck?.addEventListener('change', () => {
    recurWeeks.disabled = !recurCheck.checked;
  });

  // ─── Lieux favoris : chips + datalist ───
  (async () => {
    const { data: lieux } = await sb.from('lieux').select('id, nom, adresse').eq('moniteur_id', _me.id).eq('actif', true).order('created_at', { ascending: false });
    if (!lieux || lieux.length === 0) return;
    const fav = panel.querySelector('#pm-lieux-fav');
    const dl = panel.querySelector('#pm-lieux-datalist');
    if (dl) dl.innerHTML = lieux.map(l => `<option value="${esc(l.nom + (l.adresse ? ' · ' + l.adresse : ''))}">`).join('');
    if (fav) {
      fav.innerHTML = lieux.slice(0, 5).map(l => `
        <button type="button" class="pm-lieu-chip" data-lieu="${esc(l.nom + (l.adresse ? ' · ' + l.adresse : ''))}"
                style="padding:4px 9px;border:1px solid var(--bo);background:var(--bg2);border-radius:99px;font-size:11px;font-weight:700;color:var(--ink);cursor:pointer;font-family:inherit">📍 ${esc(l.nom)}</button>
      `).join('');
      fav.querySelectorAll('[data-lieu]').forEach(c => {
        c.addEventListener('click', () => {
          panel.querySelector('#pm-lieu').value = c.dataset.lieu;
        });
      });
    }
  })();

  panel.querySelector('#pm-close').onclick = () => closeModal();
  panel.querySelector('#pm-cancel').onclick = () => closeModal();

  panel.querySelector('#pm-save').onclick = async () => {
    // En mode DISPO : on lit start+end de la plage → calcule la durée.
    // Sinon : heure début + durée séparée comme avant.
    let h, dur;
    if (pickedType === 'dispo') {
      h = panel.querySelector('#pm-h-start').value;
      const end = panel.querySelector('#pm-h-end').value;
      dur = hoursBetween(h, end);
      if (!h || !end) {
        toast('Choisis une heure de début et de fin', 'error');
        return;
      }
      if (dur <= 0) {
        toast('L\'heure de fin doit être après l\'heure de début', 'error');
        return;
      }
      if (dur > 8) {
        toast('Plage trop longue (8h max)', 'error');
        return;
      }
    } else {
      h = panel.querySelector('#pm-h').value;
      dur = parseFloat(panel.querySelector('#pm-dur').value);
    }
    const lieu = panel.querySelector('#pm-lieu').value.trim() || null;
    const eleveId = pickedType === 'conf' ? panel.querySelector('#pm-eleve').value : null;

    if (pickedType === 'conf' && !eleveId) {
      toast('Choisis un élève pour la leçon', 'error');
      return;
    }

    const btn = panel.querySelector('#pm-save');
    btn.disabled = true; btn.textContent = '…';

    let result;

    if (pickedType === 'conf') {
      // Création d'une leçon — passe par le service avec toutes les validations métier
      // Utilise pickedDate (modifiable via "Voir créneaux libres") au lieu d'iso fixe.
      const eleveNom = _eleves.find(p => p.id === eleveId)?.nom;
      result = await createLecon({
        moniteurId: _me.id, monNom: _me.nom,
        eleveId, eleveNom,
        dateIso: pickedDate, h, dur, lieu,
      });
    } else if (pickedType === 'dispo') {
      // Récurrence : créer N créneaux successifs (chaque semaine)
      const isRecur = recurCheck?.checked;
      const weeks = isRecur ? Math.max(1, Math.min(20, parseInt(recurWeeks.value, 10) || 1)) : 1;
      let nbCreated = 0;
      let lastResult = null;
      for (let w = 0; w < weeks; w++) {
        const d = new Date(iso + 'T00:00:00');
        d.setDate(d.getDate() + w * 7);
        const dIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const r = await createDispo({
          moniteurId: _me.id, monNom: _me.nom,
          dateIso: dIso, h, dur, lieu,
        });
        lastResult = r;
        if (r.ok) nbCreated++;
      }
      result = lastResult || { ok: false, errors: ['Aucun créneau créé'] };
      if (isRecur && nbCreated > 0) {
        result = { ok: true, _multi: true, _count: nbCreated, _total: weeks };
      }
    } else {
      // perso / absence — insert simple sans validation métier
      const dow = jsDayToWeekIdx(new Date(iso + 'T00:00:00').getDay()) + 1;
      const { error } = await sb.from('events').insert({
        moniteur_id: _me.id, mon_nom: _me.nom,
        h, d: dow, t: pickedType, dur, lieu,
        date_event: iso, is_deleted: false,
      });
      result = error ? { ok: false, errors: [error.message] } : { ok: true };
    }

    if (!result.ok) {
      // Affiche la première erreur (le service peut en retourner plusieurs)
      toast(result.errors[0] || 'Erreur création', 'error');
      btn.disabled = false; btn.textContent = 'Créer';
      return;
    }

    // Affiche les warnings s'il y en a (R4 buffer, R5 > 6h)
    if (result.warnings && result.warnings.length) {
      toast('⚠️ ' + result.warnings[0], 'info');
    }

    closeModal();
    const successMsg = result._multi
      ? `${result._count}/${result._total} dispos créées ✓ — récurrence sur ${result._total} semaines`
      : result.numero
      ? `Leçon créée ✓ — ${result.numero}ème heure de l'élève`
      : 'Créneau créé ✓';
    toast(successMsg, 'success');
    await refresh();
  };

  _root.querySelector('#pl-modal').classList.add('show');
}

// ─── Modal DÉTAILS ───

function openDetailsModal(e) {
  const kind = eventKind(e.t);
  const col = eventColor(kind);
  const eleveNom = eleveNomFor(e);
  const review = kind === 'conf' ? reviewFor(e.id) : null;
  const hasReview = !!review;

  // Détection "leçon passée" : date_event < aujourd'hui (compare aux dates locales)
  const today = new Date().toISOString().slice(0, 10);
  const isPassed = kind === 'conf' && e.date_event && e.date_event < today;
  const livretRempli = !!e.livret_rempli;
  const livretAReclamer = isPassed && !livretRempli;

  // CTA grid : 3 cols si pend, 3 cols si conf avec éval, 2 cols sinon
  const ctaCols = (kind === 'pend' || kind === 'conf') ? 'three' : '';

  const panel = _root.querySelector('#pl-modal-panel');
  panel.innerHTML = `
    <div class="pm-h">
      <div>
        <div class="ti">${col.emoji} ${kind === 'conf' ? 'Leçon' : kind === 'dispo' ? 'Créneau dispo' : kind === 'pend' ? 'Réservation en attente' : kind === 'perso' ? 'Perso' : 'Absence'}</div>
        <div class="id">${esc(e.date_event)} · ${esc(e.h)} · ${e.dur}h</div>
      </div>
      <button class="close" id="pm-close">×</button>
    </div>
    <div class="pm-b">
      <div class="pm-info">
        ${eleveNom ? `<b>Élève</b> · ${esc(eleveNom)}${e.numero_heure_eleve ? ` <span style="color:var(--mu);font-weight:600">· ${e.numero_heure_eleve}ème heure</span>` : ''}<br>` : ''}
        ${e.lieu ? `<b>Lieu</b> · ${esc(e.lieu)}<br>` : ''}
        ${e.comment ? `<b>Note</b> · ${esc(e.comment)}<br>` : ''}
        <b>Type</b> · ${esc(e.t)}
        ${hasReview ? `<br><b>Éval</b> · ${'★'.repeat(review.note)}${'☆'.repeat(5-review.note)} · ${(review.comp_ids||[]).length} comp · <i>${esc(review.commentaire||'(pas de commentaire)')}</i>` : ''}
        ${(() => {
          const se = selfEvalFor(e.id);
          if (!se) return '';
          const faces = ['','😖','😕','🙂','😄','🤩'];
          return `<br><b>🪞 Auto-éval élève</b> · ${faces[se.note] || ''} ${se.note}/5${se.commentaire ? ' · <i>"' + esc(se.commentaire) + '"</i>' : ''}`;
        })()}
      </div>
      ${livretAReclamer ? `
        <div style="margin-bottom:14px;padding:12px 14px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-left:3px solid #f59e0b;border-radius:8px;display:flex;align-items:center;gap:12px">
          <div style="font-size:24px">📝</div>
          <div style="flex:1;font-size:12.5px;color:#92400e">
            <div style="font-weight:800;margin-bottom:2px">Livret pédagogique à remplir</div>
            <div style="opacity:.85">Note les compétences travaillées avant de pouvoir facturer / continuer.</div>
          </div>
          <button class="btn btn-sm" id="pm-livret-done" style="background:#f59e0b;color:#fff;border-color:#f59e0b;flex-shrink:0">Marquer fait</button>
        </div>
      ` : livretRempli && isPassed ? `
        <div style="margin-bottom:14px;padding:9px 12px;background:var(--grp);border-radius:8px;font-size:12px;color:var(--gr);display:flex;align-items:center;gap:8px">
          <span style="font-size:14px">✓</span><b>Livret rempli</b>
        </div>
      ` : ''}
      <div class="pm-cta ${ctaCols}">
        <button class="btn" id="pm-cancel">Fermer</button>
        ${kind === 'pend' ? '<button class="btn btn-p" id="pm-accept">Confirmer</button>' : ''}
        ${kind === 'conf' ? `<button class="btn btn-p" id="pm-review">📝 ${hasReview ? "Modifier l'éval" : 'Évaluer'}</button>` : ''}
        <button class="btn" id="pm-del" style="background:var(--rdp);color:var(--rd);border-color:var(--rd)">Supprimer</button>
      </div>
    </div>
  `;

  panel.querySelector('#pm-close').onclick = () => closeModal();
  panel.querySelector('#pm-cancel').onclick = () => closeModal();

  panel.querySelector('#pm-del').onclick = async () => {
    // Si c'est une leçon avec élève → on passe par cancelLecon (motif obligatoire)
    if ((kind === 'conf' || kind === 'pend') && e.eleve_id) {
      openCancelModal(e);
      return;
    }
    // Sinon (dispo, perso, absence) → soft delete simple
    if (!confirm('Supprimer ce créneau ?')) return;
    const btn = panel.querySelector('#pm-del');
    btn.disabled = true; btn.textContent = '…';
    const { error } = await sb.from('events').update({ is_deleted: true }).eq('id', e.id);
    if (error) { toast('Erreur suppression', 'error'); btn.disabled = false; btn.textContent = 'Supprimer'; return; }
    closeModal();
    toast('Créneau supprimé', 'success');
    await refresh();
  };

  // Accepter une réservation en attente → passe en "conf" via le service métier
  panel.querySelector('#pm-accept')?.addEventListener('click', async () => {
    const btn = panel.querySelector('#pm-accept');
    btn.disabled = true; btn.textContent = '…';
    const result = await confirmLecon({ leconId: e.id });
    if (!result.ok) {
      toast(result.errors[0] || 'Erreur confirmation', 'error');
      btn.disabled = false; btn.textContent = 'Confirmer';
      return;
    }
    // Flux 4 — notif élève "lecon_confirmee" (cf. FLOWS.md). Best-effort, n'interrompt pas l'UI.
    if (e.eleve_id) {
      const monNom = _me?.nom || 'ton enseignant';
      const dateLabel = `${e.date_event} à ${e.h}`;
      sb.from('notifications').insert({
        user_id: e.eleve_id,
        type: 'lecon_confirmee',
        title: 'Leçon confirmée',
        body: `${monNom} a confirmé ta leçon du ${dateLabel}.`,
      }).then(({ error }) => { if (error) console.warn('[notif lecon_confirmee]', error); });
    }
    closeModal();
    toast('Leçon confirmée ✓', 'success');
    await refresh();
  });

  // Évaluer la leçon
  panel.querySelector('#pm-review')?.addEventListener('click', () => openReviewModal(e));

  // Marquer le livret comme rempli (W5)
  panel.querySelector('#pm-livret-done')?.addEventListener('click', async () => {
    const btn = panel.querySelector('#pm-livret-done');
    btn.disabled = true; btn.textContent = '…';
    const wasAlreadyFilled = !!e.livret_rempli;
    const result = await markLivretFilled({ leconId: e.id });
    if (!result.ok) {
      toast(result.errors[0] || 'Erreur', 'error');
      btn.disabled = false; btn.textContent = 'Marquer fait';
      return;
    }
    // Flux 4 — notif élève "lecon_terminee" (cf. FLOWS.md).
    // Idempotence : on ne notifie QUE la première fois (si livret_rempli n'était pas déjà true).
    if (!wasAlreadyFilled && e.eleve_id) {
      const monNom = _me?.nom || 'ton enseignant';
      const dateLabel = `${e.date_event} à ${e.h}`;
      sb.from('notifications').insert({
        user_id: e.eleve_id,
        type: 'lecon_terminee',
        title: 'Ta leçon est notée',
        body: `${monNom} a clôturé ta leçon du ${dateLabel}. Découvre les détails dans ton parcours.`,
      }).then(({ error }) => { if (error) console.warn('[notif lecon_terminee]', error); });
    }
    closeModal();
    toast('Livret marqué comme rempli ✓', 'success');
    await refresh();
  });

  _root.querySelector('#pl-modal').classList.add('show');
}

// ─── Modal ÉVALUATION post-leçon ───

function openReviewModal(ev) {
  const eleveNom = eleveNomFor(ev);
  const existing = reviewFor(ev.id);
  let pickedNote = existing?.note || 0;
  let pickedCompIds = new Set(existing?.comp_ids || []);

  const panel = _root.querySelector('#pl-modal-panel');
  panel.innerHTML = `
    <style>
      .rv-stars{display:flex;gap:8px;justify-content:center;margin:10px 0 6px}
      .rv-stars button{width:44px;height:44px;border:0;background:transparent;font-size:30px;cursor:pointer;line-height:1;padding:0;color:#cbd5e1;font-family:inherit;transition:transform .12s,color .12s}
      .rv-stars button:hover{transform:scale(1.12)}
      .rv-stars button.sel{color:#f59e0b}
      .rv-stars-lbl{text-align:center;font-size:12px;color:var(--mu);font-weight:600;margin-bottom:14px}
      .rv-cats{display:flex;flex-direction:column;gap:10px;max-height:280px;overflow-y:auto;padding:2px;border:1px solid var(--bo);border-radius:8px;background:var(--bg2)}
      .rv-cat{padding:10px 12px}
      .rv-cat-h{font-size:10.5px;font-weight:800;color:var(--mu);letter-spacing:1px;margin-bottom:6px}
      .rv-chips{display:flex;gap:5px;flex-wrap:wrap}
      .rv-chip{padding:4px 9px;border-radius:99px;border:1px solid var(--bo);background:var(--su);font-size:11px;font-weight:600;color:var(--ink);cursor:pointer;transition:all .12s;font-family:inherit}
      .rv-chip:hover{border-color:var(--mu2)}
      .rv-chip.sel{background:var(--a);border-color:var(--a);color:#fff}
      .rv-summary{text-align:center;font-size:11.5px;color:var(--mu);margin-top:8px}
      .rv-summary b{color:var(--a)}
    </style>

    <div class="pm-h">
      <div>
        <div class="ti">📝 Évaluer la leçon</div>
        <div class="id">${esc(eleveNom)} · ${esc(ev.date_event)} · ${esc(ev.h)}</div>
      </div>
      <button class="close" id="rv-close">×</button>
    </div>
    <div class="pm-b">
      <div class="pm-row" style="margin-bottom:8px">
        <label>Note globale</label>
        <div class="rv-stars" id="rv-stars">
          ${[1,2,3,4,5].map(n => `<button data-n="${n}">★</button>`).join('')}
        </div>
        <div class="rv-stars-lbl" id="rv-stars-lbl">${pickedNote ? noteLabel(pickedNote) : 'Choisis une note de 1 à 5'}</div>
      </div>

      <div class="pm-row">
        <label style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span>Commentaire (visible par l'élève)</span>
          <button class="rv-mic" id="rv-mic" type="button" title="Dicter le commentaire (Web Speech API)" aria-label="Dicter">🎤 Dicter</button>
        </label>
        <style>
          .rv-mic{padding:4px 10px;border-radius:99px;background:var(--bg2);border:1px solid var(--bo);color:var(--ink);font-family:inherit;font-size:10.5px;font-weight:800;cursor:pointer;letter-spacing:.3px;transition:all .12s;text-transform:none}
          .rv-mic:hover{background:var(--ap);border-color:var(--a);color:var(--a)}
          .rv-mic.recording{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;border-color:#dc2626;animation:rv-mic-pulse 1.2s ease-in-out infinite}
          @keyframes rv-mic-pulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.6)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}}
        </style>
        <input type="text" id="rv-comment" maxlength="200" placeholder="Ex. Bons réflexes en intersection, à retravailler le créneau" value="${esc(existing?.commentaire || '')}">
        <style>
          .rv-templates{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
          .rv-tpl{padding:5px 11px;border:1px solid var(--bo);background:var(--bg2);color:var(--ink);border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .12s;line-height:1.2}
          .rv-tpl:hover{background:var(--ap);border-color:var(--a);color:var(--a);transform:translateY(-1px)}
          .rv-tpl:active{transform:scale(.95)}
          .rv-tpl .pl{color:var(--gr);font-weight:800;margin-right:3px}
          .rv-tpl-h{font-size:10px;font-weight:800;color:var(--mu);letter-spacing:1px;margin-top:10px;text-transform:uppercase}
        </style>
        <div class="rv-tpl-h">💡 Phrases rapides — tap pour ajouter</div>
        <div class="rv-templates">
          <button class="rv-tpl" data-tpl="Bons réflexes" type="button"><span class="pl">+</span>Bons réflexes</button>
          <button class="rv-tpl" data-tpl="Conduite fluide" type="button"><span class="pl">+</span>Conduite fluide</button>
          <button class="rv-tpl" data-tpl="Bonne progression" type="button"><span class="pl">+</span>Bonne progression</button>
          <button class="rv-tpl" data-tpl="Confiance au volant" type="button"><span class="pl">+</span>Confiance OK</button>
          <button class="rv-tpl" data-tpl="À retravailler le créneau" type="button"><span class="pl">+</span>Créneau à revoir</button>
          <button class="rv-tpl" data-tpl="Attention aux intersections" type="button"><span class="pl">+</span>Intersections ⚠</button>
          <button class="rv-tpl" data-tpl="Travailler la prise d'angle" type="button"><span class="pl">+</span>Prise d'angle</button>
          <button class="rv-tpl" data-tpl="Bonne vigilance" type="button"><span class="pl">+</span>Vigilance ✓</button>
          <button class="rv-tpl" data-tpl="Bon contrôle de la vitesse" type="button"><span class="pl">+</span>Vitesse contrôlée</button>
          <button class="rv-tpl" data-tpl="Manœuvres à perfectionner" type="button"><span class="pl">+</span>Manœuvres ⚠</button>
        </div>
      </div>

      <div class="pm-row">
        <label>Sous-compétences REMC travaillées</label>
        <div class="rv-cats">
          ${REMC.map(cat => `
            <div class="rv-cat">
              <div class="rv-cat-h">${cat.ico} ${esc(cat.id)} · ${esc(cat.name).toUpperCase()}</div>
              <div class="rv-chips">
                ${cat.subs.map(s => `
                  <button class="rv-chip ${pickedCompIds.has(s.c) ? 'sel' : ''}" data-comp="${esc(s.c)}" title="${esc(s.n)}">${esc(s.c)}</button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="rv-summary"><b id="rv-count">${pickedCompIds.size}</b> sous-comp sélectionnée(s) — seront marquées "Acquises" dans le livret</div>
      </div>

      <div class="pm-cta">
        <button class="btn" id="rv-cancel">Annuler</button>
        <button class="btn btn-p" id="rv-save">${existing ? 'Mettre à jour' : 'Enregistrer'}</button>
      </div>
    </div>
  `;

  // Wire étoiles
  const stars = panel.querySelectorAll('#rv-stars button');
  const repaintStars = () => {
    stars.forEach((b, i) => b.classList.toggle('sel', i < pickedNote));
    panel.querySelector('#rv-stars-lbl').textContent = pickedNote ? noteLabel(pickedNote) : 'Choisis une note de 1 à 5';
  };
  stars.forEach(b => b.addEventListener('click', () => { pickedNote = +b.dataset.n; repaintStars(); }));
  repaintStars();

  // ─── Wire bouton 🎤 Dicter (Web Speech API) ───
  const micBtn = panel.querySelector('#rv-mic');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;
  if (!SpeechRecognition) {
    if (micBtn) {
      micBtn.disabled = true;
      micBtn.style.opacity = '.4';
      micBtn.title = 'Reconnaissance vocale non supportée par ce navigateur';
    }
  } else {
    micBtn?.addEventListener('click', () => {
      if (isRecording) {
        recognition?.stop();
        return;
      }
      recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.interimResults = true;
      recognition.continuous = true;
      const input = panel.querySelector('#rv-comment');
      const baseText = (input.value || '').trim();
      let finalTranscript = '';

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const sep = baseText ? (baseText.match(/[.!?]$/) ? ' ' : (baseText.match(/[,·]$/) ? ' ' : ' · ')) : '';
        const combined = (baseText + sep + finalTranscript + interim).slice(0, 200);
        input.value = combined.trim();
      };
      recognition.onerror = (e) => {
        console.warn('[mic] err', e.error);
        if (e.error === 'not-allowed') toast('Accès micro refusé', 'error');
        else if (e.error !== 'no-speech') toast('Erreur reconnaissance', 'error');
        stopRecording();
      };
      recognition.onend = () => stopRecording();

      function stopRecording() {
        isRecording = false;
        micBtn.classList.remove('recording');
        micBtn.textContent = '🎤 Dicter';
        try { recognition?.stop(); } catch (_) {}
      }

      try {
        recognition.start();
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.textContent = '⏺ Stop';
        try { navigator.vibrate?.(40); } catch (_) {}
      } catch (err) {
        console.warn('[mic] start err', err);
        toast('Impossible de démarrer le micro', 'error');
      }
    });
  }

  // Wire templates de phrases rapides → append au commentaire
  panel.querySelectorAll('.rv-tpl').forEach(t => {
    t.addEventListener('click', () => {
      const input = panel.querySelector('#rv-comment');
      if (!input) return;
      const cur = input.value.trim();
      const phrase = t.dataset.tpl;
      // Si déjà présent, ne pas dupliquer
      if (cur.toLowerCase().includes(phrase.toLowerCase())) return;
      const sep = cur ? (cur.endsWith('.') || cur.endsWith(',') || cur.endsWith('·') ? ' ' : ' · ') : '';
      const next = (cur + sep + phrase).slice(0, 200);
      input.value = next;
      input.focus();
      // Mini feedback visuel
      t.style.background = 'var(--gr)';
      t.style.color = '#fff';
      t.style.borderColor = 'var(--gr)';
      setTimeout(() => { t.style.background = ''; t.style.color = ''; t.style.borderColor = ''; }, 600);
    });
  });

  // Wire chips sous-comp
  panel.querySelectorAll('.rv-chip').forEach(c => {
    c.addEventListener('click', () => {
      const id = c.dataset.comp;
      if (pickedCompIds.has(id)) { pickedCompIds.delete(id); c.classList.remove('sel'); }
      else { pickedCompIds.add(id); c.classList.add('sel'); }
      panel.querySelector('#rv-count').textContent = pickedCompIds.size;
    });
  });

  panel.querySelector('#rv-close').onclick = () => closeModal();
  panel.querySelector('#rv-cancel').onclick = () => closeModal();

  panel.querySelector('#rv-save').onclick = async () => {
    if (!pickedNote) { toast('Choisis une note de 1 à 5', 'error'); return; }
    const btn = panel.querySelector('#rv-save');
    btn.disabled = true; btn.textContent = '…';

    const commentaire = panel.querySelector('#rv-comment').value.trim() || null;
    const compIds = Array.from(pickedCompIds);

    // 1. Upsert lesson_review
    const reviewPayload = {
      event_id: ev.id,
      moniteur_id: _me.id,
      eleve_id: ev.eleve_id,
      note: pickedNote,
      commentaire,
      comp_ids: compIds,
      updated_at: new Date().toISOString(),
    };
    const { error: rvErr } = await sb.from('lesson_reviews').upsert(reviewPayload, { onConflict: 'event_id' });
    if (rvErr) {
      console.warn('[review] err', rvErr);
      toast('Erreur sauvegarde éval', 'error');
      btn.disabled = false; btn.textContent = existing ? 'Mettre à jour' : 'Enregistrer';
      return;
    }

    // 2. Mark sous-comp REMC comme 'Acquis' (en parallèle)
    if (compIds.length && ev.eleve_id) {
      const rows = compIds.map(c => ({
        eleve_id: ev.eleve_id,
        moniteur_id: _me.id,
        comp_id: c,
        lv: 'v',
        checked: true,
        validated_at: new Date().toISOString(),
      }));
      const { error: remcErr } = await sb.from('remc_entries').upsert(rows, { onConflict: 'eleve_id,comp_id' });
      if (remcErr) console.warn('[review→remc] err', remcErr);
    }

    // 3. Notifs Flux 4 — uniquement à la PREMIÈRE évaluation (pas sur update) pour l'idempotence
    if (ev.eleve_id && !existing) {
      const monNom = _me?.nom || 'ton enseignant';
      // 3a — Notif "lecon_terminee" (review qui clôt la leçon)
      sb.from('notifications').insert({
        user_id: ev.eleve_id,
        type: 'lecon_terminee',
        title: 'Ta leçon est notée',
        body: `${pickedNote}★ — ${compIds.length} compétence(s) validée(s)${commentaire ? ' — « ' + commentaire + ' »' : ''}`,
      }).then(({ error }) => { if (error) console.warn('[review notif lecon_terminee]', error); });
      // 3b — Une notif "comp_acquise" par compétence validée via la review (REMC upsert lv='v' ci-dessus)
      for (const c of compIds) {
        let libelle = c;
        for (const cat of REMC) {
          const sub = cat.subs.find(x => x.c === c);
          if (sub) { libelle = sub.n; break; }
        }
        sb.from('notifications').insert({
          user_id: ev.eleve_id,
          type: 'comp_acquise',
          title: 'Compétence validée 🎉',
          body: `${libelle} validée par ${monNom}`,
        }).then(({ error }) => { if (error) console.warn('[review notif comp_acquise]', error); });
      }
    }

    closeModal();
    toast('Évaluation enregistrée ✓', 'success');
    await refresh();
  };
}

function noteLabel(n) {
  return ['', '😕 Difficile', '😐 Moyen', '🙂 Bien', '😄 Très bien', '🤩 Excellent'][n] || '';
}

function closeModal() {
  _root.querySelector('#pl-modal').classList.remove('show');
}

// ─── Modal ANNULATION leçon (motif obligatoire + garderDispo) ───
function openCancelModal(ev) {
  // Niveau préavis pour adapter le ton
  const [hh, mm] = String(ev.h).split(':').map(Number);
  const dt = new Date(ev.date_event + 'T00:00:00');
  dt.setHours(hh || 0, mm || 0, 0, 0);
  const diffH = (dt.getTime() - Date.now()) / 3600000;
  const niveau = diffH >= 48 ? 'libre' : diffH >= 4 ? 'tardive' : 'jour_j';
  const niveauUI = {
    libre:   { color: '#0891b2', label: 'Annulation libre',  msg: '≥ 48h avant la leçon — pas de pénalité.' },
    tardive: { color: '#f59e0b', label: 'Annulation tardive', msg: 'Moins de 48h — l\'élève sera prévenu, un motif est obligatoire.' },
    jour_j:  { color: '#ef4444', label: 'Annulation jour J', msg: 'Moins de 4h ! Impact fort sur l\'élève — communique avec lui.' },
  }[niveau];

  const eleveNom = eleveNomFor(ev);

  const panel = _root.querySelector('#pl-modal-panel');
  panel.innerHTML = `
    <style>
      .ca-bg{padding:14px 16px;background:${niveauUI.color}15;border-left:3px solid ${niveauUI.color}}
      .ca-bg .lb{font-size:10px;font-weight:800;color:${niveauUI.color};letter-spacing:1px;text-transform:uppercase}
      .ca-bg .ms{font-size:12.5px;color:var(--ink);margin-top:4px;line-height:1.4}
      .ca-radios{display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto;padding:2px;border:1px solid var(--bo);border-radius:8px;background:var(--bg2)}
      .ca-radio{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;cursor:pointer;font-size:13px}
      .ca-radio:hover{background:var(--su)}
      .ca-radio.sel{background:var(--ap);color:var(--a);font-weight:600}
      .ca-toggle{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg2);border:1px solid var(--bo);border-radius:8px;font-size:12.5px;color:var(--ink);cursor:pointer}
      .ca-toggle input{margin:0}
    </style>
    <div class="pm-h">
      <div>
        <div class="ti">🚫 Annuler la leçon</div>
        <div class="id">${esc(eleveNom)} · ${esc(ev.date_event)} · ${esc(ev.h)}</div>
      </div>
      <button class="close" id="ca-close">×</button>
    </div>
    <div class="ca-bg">
      <div class="lb">${niveauUI.label}</div>
      <div class="ms">${niveauUI.msg}</div>
    </div>
    <div class="pm-b">
      <div class="pm-row">
        <label>Motif <span style="color:#ef4444">*</span></label>
        <div class="ca-radios" id="ca-radios">
          ${MOTIFS_ANNULATION.map((m, i) => `
            <div class="ca-radio" data-motif="${esc(m)}">
              <span style="width:16px;height:16px;border-radius:50%;border:2px solid var(--bo);display:inline-block"></span>
              ${esc(m)}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="pm-row" id="ca-msg-row" style="display:none">
        <label>Message à l'élève <span style="color:#ef4444">*</span></label>
        <input type="text" id="ca-msg" placeholder="Explication pour l'élève (obligatoire si motif = Autre)" maxlength="200">
      </div>

      <div class="pm-row">
        <label class="ca-toggle">
          <input type="checkbox" id="ca-garder" checked>
          <span>Je reste disponible sur ce créneau (devient une dispo réservable)</span>
        </label>
      </div>

      <div class="pm-cta">
        <button class="btn" id="ca-cancel">Retour</button>
        <button class="btn btn-p" id="ca-confirm" disabled style="background:#ef4444;border-color:#ef4444">Confirmer l'annulation</button>
      </div>
    </div>
  `;

  let pickedMotif = null;
  const radios = panel.querySelectorAll('.ca-radio');
  const msgRow = panel.querySelector('#ca-msg-row');
  const msgInput = panel.querySelector('#ca-msg');
  const confirmBtn = panel.querySelector('#ca-confirm');

  function updateConfirmEnabled() {
    const motifNeedsMsg = pickedMotif === 'Autre';
    const msgOk = !motifNeedsMsg || (msgInput.value.trim().length > 0);
    confirmBtn.disabled = !pickedMotif || !msgOk;
  }

  radios.forEach(r => r.addEventListener('click', () => {
    radios.forEach(o => o.classList.remove('sel'));
    r.classList.add('sel');
    pickedMotif = r.dataset.motif;
    msgRow.style.display = pickedMotif === 'Autre' ? '' : 'none';
    updateConfirmEnabled();
  }));

  msgInput?.addEventListener('input', updateConfirmEnabled);

  panel.querySelector('#ca-close').onclick = () => closeModal();
  panel.querySelector('#ca-cancel').onclick = () => closeModal();

  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = '…';
    const garder = panel.querySelector('#ca-garder').checked;
    const message = msgInput?.value.trim() || null;

    const result = await cancelLecon({
      leconId: ev.id,
      motif: pickedMotif,
      message,
      garderDispo: garder,
    });

    if (!result.ok) {
      toast(result.errors[0] || 'Erreur annulation', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirmer l'annulation";
      return;
    }

    closeModal();
    toast(garder ? 'Leçon annulée · créneau redevenu dispo' : 'Leçon annulée', 'success');
    await refresh();
  };
}
