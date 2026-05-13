/**
 * Page Réservation Élève — UX "2 taps clairs".
 *
 *   TAP 1 : click sur un créneau dispo (events.t='dispo', 14 prochains jours)
 *   TAP 2 : bouton "Confirmer" dans la bottom sheet de récap
 *
 * Effets confirmation :
 *  - INSERT events { t:'pend', eleve_id, moniteur_id, h, d, dur, lieu, date_event, mon_nom }
 *  - SOFT DELETE de la dispo source (is_deleted=true) pour éviter qu'un autre élève la prenne
 *  - INSERT notifications { user_id: moniteur_id, type:'lecon_demande', title, body }
 *
 * Garde-fous :
 *  - Re-lit la dispo avant l'INSERT pour détecter conflit (créneau pris entre temps)
 *  - Si forfait épuisé : message bloquant avec lien vers /profil
 *  - Skeleton au load, success toast + redirect /accueil, error toast si erreur
 *
 * Branchée sur Supabase :
 *  - LIT : events (t='dispo'), profiles (moniteurs), events (mes leçons → heures restantes)
 *  - ÉCRIT : events (t='pend'), notifications (lecon_demande)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { WEEK_DAYS_FULL, MONTHS_FR_SHORT, addDays, isoDate, jsDayToWeekIdx } from '@/utils/format-date.js';
import { renderStackedCards, wireStackedCards, STACKED_CARDS_CSS } from '@/components/stacked-cards.js';
import { mountDateTimePicker } from '@/components/date-time-picker.js';

let _root, _me;
let _dispos = [];
let _moniteurs = [];
let _filterMonId = null;
let _heuresRestantes = 0;
let _forfait = 20;
let _busy = false; // évite double-tap pendant confirmation

// ─── Mount ───

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) { root.innerHTML = '<p>Non connecté</p>'; return; }

  _filterMonId = null;
  _busy = false;

  root.innerHTML = renderSkeleton();
  await load();
  render();
}

// ─── Data ───

async function load() {
  const today = isoDate(new Date());
  const max = isoDate(addDays(new Date(), 14));

  const [dispoRes, monRes, myEvRes] = await Promise.allSettled([
    sb.from('events')
      .select('id, h, d, dur, lieu, comment, moniteur_id, mon_nom, date_event')
      .eq('t', 'dispo')
      .eq('is_deleted', false)
      .gte('date_event', today)
      .lte('date_event', max)
      .order('date_event')
      .order('h'),
    sb.from('profiles')
      .select('id, nom')
      .eq('role', 'moniteur')
      .order('nom'),
    sb.from('events')
      .select('dur, t')
      .eq('eleve_id', _me.id)
      .eq('is_deleted', false),
  ]);

  if (dispoRes.status === 'rejected') {
    console.warn('[reservation] dispo err', dispoRes.reason);
    toast('Erreur de chargement des créneaux', 'error');
  }

  _dispos = (dispoRes.value?.data) || [];
  _moniteurs = (monRes.value?.data) || [];

  // Heures restantes (même formule que /accueil) : forfait - SUM(dur where t ∈ {conf,lecon,pend})
  // On inclut 'pend' pour empêcher la sur-réservation pendant l'attente moniteur.
  _forfait = _me.forfait_h || 20;
  const myEv = (myEvRes.value?.data) || [];
  const isLec = (t) => { const s = (t || '').toLowerCase(); return s === 'conf' || s === 'lecon' || s === 'leçon' || s === 'pend'; };
  const consumed = myEv.filter(e => isLec(e.t)).reduce((s, e) => s + (parseFloat(e.dur) || 1), 0);
  _heuresRestantes = Math.max(0, _forfait - consumed);
}

// ─── Helpers ───

function monNomFor(d) {
  return _moniteurs.find(m => m.id === d.moniteur_id)?.nom || d.mon_nom || 'Enseignant';
}

function monInitials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function monColor(monId) {
  const colors = ['#5b5bd6', '#0891b2', '#7c3aed', '#0e7c66', '#9333ea', '#dc2626'];
  if (!monId) return colors[0];
  let hash = 0;
  for (let i = 0; i < monId.length; i++) hash = (hash * 31 + monId.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

function dayLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  const dow = jsDayToWeekIdx(d.getDay()); // 0=lundi
  return `${WEEK_DAYS_FULL[dow]} ${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]}`;
}

function dayShortLabel(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(iso + 'T00:00:00');
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  return dayLabel(iso);
}

function groupByDay(list) {
  const map = new Map();
  for (const d of list) {
    if (!map.has(d.date_event)) map.set(d.date_event, []);
    map.get(d.date_event).push(d);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function filteredDispos() {
  if (!_filterMonId || _filterMonId === 'all') return _dispos;
  return _dispos.filter(d => d.moniteur_id === _filterMonId);
}

// ─── Renders ───

function renderSkeleton() {
  return `
    <style>
      .rv-skel{max-width:560px;margin:0 auto;padding:18px}
      .rv-skel .sk-bar{height:14px;border-radius:6px;background:linear-gradient(90deg,var(--bo2) 25%,var(--su) 50%,var(--bo2) 75%);background-size:200% 100%;animation:rvShimmer 1.2s linear infinite;margin-bottom:14px}
      .rv-skel .sk-card{height:64px;border-radius:12px;background:linear-gradient(90deg,var(--bo2) 25%,var(--su) 50%,var(--bo2) 75%);background-size:200% 100%;animation:rvShimmer 1.2s linear infinite;margin-bottom:10px}
      @keyframes rvShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    </style>
    <div class="rv-skel">
      <div class="sk-bar" style="width:60%;height:24px"></div>
      <div class="sk-bar" style="width:40%;height:12px;margin-bottom:24px"></div>
      <div class="sk-bar" style="width:30%;height:13px"></div>
      <div class="sk-card"></div>
      <div class="sk-card"></div>
      <div class="sk-card"></div>
    </div>
  `;
}

function render() {
  const monsWithDispos = [...new Set(_dispos.map(d => d.moniteur_id).filter(Boolean))];
  const groups = groupByDay(filteredDispos());
  const noHours = _heuresRestantes <= 0;

  _root.innerHTML = `
    <style>
      .rv-wrap{max-width:560px;margin:0 auto;padding:14px;padding-bottom:80px}
      .rv-top{display:flex;align-items:center;gap:10px;padding:6px 4px 14px}
      .rv-back{width:36px;height:36px;border-radius:10px;border:1px solid var(--bo);background:var(--su);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s}
      .rv-back:hover{background:var(--bg2)}
      .rv-top .ttl{font-family:var(--fd);font-weight:800;font-size:20px;letter-spacing:-.02em;line-height:1.15}
      .rv-top .sub{font-size:11.5px;color:var(--mu);margin-top:2px}

      /* Pastille heures restantes */
      .rv-hours{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;background:var(--bg2);border:1px solid var(--bo);font-size:11px;font-weight:700;color:var(--mu);margin-top:6px}
      .rv-hours.warn{background:#fffbeb;border-color:#fde68a;color:#92400e}
      .rv-hours.err{background:#fef2f2;border-color:#fecaca;color:#b91c1c}
      .rv-hours b{color:var(--ink);font-weight:800}
      .rv-hours.warn b,.rv-hours.err b{color:inherit}

      /* Bloc bloquant si forfait épuisé */
      .rv-block{background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1px solid #fca5a5;border-radius:14px;padding:22px 18px;text-align:center;margin:14px 0}
      .rv-block .em{font-size:42px;line-height:1;margin-bottom:8px}
      .rv-block .ti{font-family:var(--fd);font-weight:800;font-size:16px;color:#991b1b;margin-bottom:6px}
      .rv-block .body{font-size:13px;color:#7f1d1d;line-height:1.5;margin-bottom:14px}
      .rv-block .cta{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
      .rv-block .cta button{height:38px;padding:0 16px;border-radius:9px;font-size:13px;font-weight:700;border:1px solid #b91c1c;background:#fff;color:#b91c1c;cursor:pointer;font-family:inherit}
      .rv-block .cta button.primary{background:#b91c1c;color:#fff}

      .rv-chips{display:flex;gap:6px;overflow-x:auto;padding:4px 4px 14px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
      .rv-chips::-webkit-scrollbar{display:none}
      .rv-chip{padding:7px 13px;border-radius:99px;border:1px solid var(--bo);background:var(--su);font-size:12px;font-weight:700;color:var(--mu);white-space:nowrap;cursor:pointer;transition:all .12s;font-family:inherit;flex-shrink:0}
      .rv-chip:hover{border-color:var(--mu2);color:var(--ink)}
      .rv-chip.on{background:var(--a);border-color:var(--a);color:#fff}

      .rv-day{margin-bottom:18px}
      .rv-day-h{font-family:var(--fd);font-size:12px;font-weight:800;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;padding:0 4px 8px;display:flex;align-items:center;gap:8px}
      .rv-day-h .dot{width:5px;height:5px;border-radius:50%;background:var(--a)}
      .rv-day-h.today .dot{background:var(--gr)}
      .rv-day-h.today{color:var(--gr)}

      .rv-cards{display:flex;flex-direction:column;gap:8px}
      .rv-card{background:var(--su);border:1px solid var(--bo);border-radius:12px;padding:13px 14px;display:flex;align-items:center;gap:12px;box-shadow:var(--s0);transition:transform .12s,border-color .12s,box-shadow .12s;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;text-align:left;width:100%;font-family:inherit;font-size:inherit;color:inherit}
      .rv-card:hover{border-color:var(--ap);box-shadow:var(--s1)}
      .rv-card:active{transform:scale(.98)}
      .rv-card[disabled]{opacity:.5;cursor:not-allowed}
      .rv-card[disabled]:active{transform:none}

      .rv-time{font-family:var(--fn);font-weight:800;color:var(--a);min-width:54px;font-size:15px;text-align:center;line-height:1.1}
      .rv-time .dur{display:block;font-size:10px;color:var(--mu);font-weight:700;margin-top:3px;letter-spacing:.04em}
      .rv-mid{flex:1;min-width:0;display:flex;align-items:center;gap:10px}
      .rv-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--fd);font-weight:800;font-size:13px;flex-shrink:0}
      .rv-info{flex:1;min-width:0}
      .rv-mon-nm{font-family:var(--fd);font-weight:700;font-size:13.5px;letter-spacing:-.005em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .rv-lieu{font-size:11.5px;color:var(--mu);margin-top:2px;display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .rv-chev{flex-shrink:0;color:var(--mu);font-size:18px;font-weight:300;margin-right:2px}

      .rv-empty{text-align:center;padding:60px 20px;color:var(--mu);font-size:13.5px;line-height:1.6}
      .rv-empty .em{font-size:42px;margin-bottom:8px;display:block}

      /* Bottom sheet de confirmation */
      .rv-sheet-bg{position:fixed;inset:0;background:rgba(11,13,26,.55);backdrop-filter:blur(4px);display:none;z-index:90;animation:rvFade .2s ease}
      .rv-sheet-bg.show{display:block}
      @keyframes rvFade{from{opacity:0}to{opacity:1}}

      .rv-sheet{position:fixed;left:0;right:0;bottom:0;z-index:91;background:var(--bg);border-radius:20px 20px 0 0;box-shadow:0 -10px 40px rgba(11,13,26,.25);max-height:88vh;overflow:auto;transform:translateY(100%);transition:transform .28s cubic-bezier(.2,.7,.3,1)}
      .rv-sheet.show{transform:translateY(0)}
      @media (min-width:560px){
        .rv-sheet{left:50%;right:auto;transform:translate(-50%,100%);width:480px;max-width:calc(100vw - 28px);border-radius:20px;bottom:14px}
        .rv-sheet.show{transform:translate(-50%,0)}
      }
      .rv-sheet .grip{width:40px;height:4px;border-radius:99px;background:var(--bo);margin:10px auto 4px}
      .rv-sheet-h{padding:14px 20px 8px;text-align:center}
      .rv-sheet-h .em{font-size:36px;line-height:1;margin-bottom:6px}
      .rv-sheet-h .ti{font-family:var(--fd);font-weight:800;font-size:18px;letter-spacing:-.01em}
      .rv-sheet-h .sub{font-size:12.5px;color:var(--mu);margin-top:4px}

      .rv-recap{margin:14px 20px;background:var(--bg2);border:1px solid var(--bo2);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:11px}
      .rv-recap-row{display:flex;align-items:center;gap:11px;font-size:13.5px;color:var(--ink)}
      .rv-recap-row .ic{width:28px;height:28px;border-radius:8px;background:var(--su);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
      .rv-recap-row .lb{font-size:11px;color:var(--mu);font-weight:600;text-transform:uppercase;letter-spacing:.05em;line-height:1.1}
      .rv-recap-row .vl{font-weight:600;line-height:1.2;font-size:13.5px;margin-top:2px;color:var(--ink)}
      .rv-recap-row .col{flex:1;min-width:0}

      .rv-sheet-note{font-size:11.5px;color:var(--mu);text-align:center;margin:0 20px 12px;line-height:1.5}
      .rv-sheet-note b{color:var(--ink)}

      .rv-sheet-cta{display:grid;grid-template-columns:1fr 1.6fr;gap:8px;padding:6px 20px 22px;padding-bottom:max(22px,calc(env(safe-area-inset-bottom) + 14px))}
      .rv-sheet-cta button{height:44px;border-radius:11px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .12s;border:1px solid var(--bo);background:var(--su);color:var(--ink)}
      .rv-sheet-cta button:hover{background:var(--bg2)}
      .rv-sheet-cta .btn-confirm{background:var(--a);border-color:var(--a);color:#fff;display:flex;align-items:center;justify-content:center;gap:6px}
      .rv-sheet-cta .btn-confirm:hover{filter:brightness(1.05)}
      .rv-sheet-cta .btn-confirm[disabled]{opacity:.7;cursor:wait}
      .rv-sheet-cta .btn-confirm .spinner{display:none;width:14px;height:14px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:rvSpin .7s linear infinite}
      .rv-sheet-cta .btn-confirm[disabled] .spinner{display:inline-block}
      @keyframes rvSpin{to{transform:rotate(360deg)}}

      /* ─── Picker enseignant (stacked cards) ─── */
      ${STACKED_CARDS_CSS}
      .rv-picker{padding:30px 18px 26px;text-align:center}
      .rv-picker-h{margin-bottom:30px}
      .rv-picker-eyebrow{font-family:var(--fn);font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--a);margin-bottom:10px;opacity:.85}
      .rv-picker-ti{font-family:var(--fd);font-weight:900;font-size:24px;letter-spacing:-.02em;color:var(--ink);margin:0 0 6px;line-height:1.15}
      .rv-picker-sub{font-size:13px;color:var(--mu);margin:0;line-height:1.5}
      .rv-link{background:none;border:0;color:var(--a);font-weight:700;font-family:inherit;font-size:12.5px;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}
      .rv-link:hover{opacity:.7}

      /* ─── État "enseignant sélectionné" ─── */
      .rv-selected-mon{display:flex;align-items:center;gap:12px;padding:14px 18px;margin:0 14px 16px;background:var(--bg2);border:1px solid var(--bo);border-radius:14px}
      .rv-back-pick{background:none;border:0;color:var(--a);font-weight:700;font-family:inherit;font-size:13px;cursor:pointer;padding:6px 10px;border-radius:8px;transition:background .15s;white-space:nowrap}
      .rv-back-pick:hover{background:var(--ap)}
      .rv-selected-info{display:flex;align-items:center;gap:11px;flex:1;min-width:0}
      .rv-selected-av{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:800;color:#fff;font-size:13.5px;letter-spacing:-.01em;flex-shrink:0}
      .rv-selected-nm{font-family:var(--fd);font-weight:800;font-size:14px;color:var(--ink);letter-spacing:-.01em;line-height:1.2}
      .rv-selected-meta{font-size:11.5px;color:var(--mu);margin-top:2px}

      /* ── Picker step (calendar + time slots) ── */
      .rv-picker-step{padding:0 14px 22px}
      .rv-step-h{margin-bottom:14px;text-align:center}
      .rv-step-eyebrow{font-family:var(--fn);font-size:10.5px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--a);margin-bottom:6px;opacity:.85}
      .rv-step-ti{font-family:var(--fd);font-weight:900;font-size:20px;letter-spacing:-.02em;color:var(--ink);margin:0;line-height:1.15}
    </style>

    <div class="rv-wrap anim-slide-up">
      <div class="rv-top">
        <button class="rv-back" id="rv-back" aria-label="Retour">‹</button>
        <div style="flex:1;min-width:0">
          <div class="ttl">Réserver une leçon</div>
          <div class="sub">${_dispos.length} créneau${_dispos.length > 1 ? 'x' : ''} dispo${_dispos.length > 1 ? 's' : ''} · 14 prochains jours</div>
        </div>
        <div class="rv-hours ${noHours ? 'err' : (_heuresRestantes <= 2 ? 'warn' : '')}" title="Heures restantes de ton forfait">
          ⏱ <b>${_heuresRestantes}</b>h restantes
        </div>
      </div>

      ${noHours ? renderBlocked() : ''}

      ${!noHours && monsWithDispos.length > 1 && !_filterMonId ? `
        <div class="rv-picker">
          <div class="rv-picker-h">
            <div class="rv-picker-eyebrow">Étape 1</div>
            <h2 class="rv-picker-ti">Choisis ton enseignant</h2>
            <p class="rv-picker-sub">Survole la carte pour voir les autres enseignants disponibles.</p>
          </div>
          ${renderStackedCards(monsWithDispos.slice(0, 3).map(id => {
            const m = _moniteurs.find(x => x.id === id);
            const nom = m?.nom || 'Enseignant';
            const nbDispos = _dispos.filter(d => d.moniteur_id === id).length;
            return {
              id,
              title: nom,
              sub: `${nbDispos} créneau${nbDispos > 1 ? 'x' : ''} disponible${nbDispos > 1 ? 's' : ''} sur 14 jours`,
              meta: `${nbDispos} dispo${nbDispos > 1 ? 's' : ''}`,
            };
          }))}
          ${monsWithDispos.length > 3 ? `
            <div style="text-align:center;margin-top:20px;font-size:12.5px;color:var(--mu)">
              ${monsWithDispos.length - 3} autre${monsWithDispos.length - 3 > 1 ? 's' : ''} enseignant${monsWithDispos.length - 3 > 1 ? 's' : ''} disponible${monsWithDispos.length - 3 > 1 ? 's' : ''} —
              <button class="rv-link" id="rv-show-all" type="button">voir tous les créneaux</button>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${!noHours && monsWithDispos.length > 1 && _filterMonId && _filterMonId !== 'all' ? `
        <div class="rv-selected-mon">
          <button class="rv-back-pick" id="rv-back-pick" type="button">‹ Changer d'enseignant</button>
          <div class="rv-selected-info">
            <div class="rv-selected-av" style="background:${monColor(_filterMonId)}">${esc(monInitials(_moniteurs.find(m => m.id === _filterMonId)?.nom || ''))}</div>
            <div>
              <div class="rv-selected-nm">${esc(_moniteurs.find(m => m.id === _filterMonId)?.nom || 'Enseignant')}</div>
              <div class="rv-selected-meta">${groups.length} jour${groups.length > 1 ? 's' : ''} avec créneaux</div>
            </div>
          </div>
        </div>
      ` : ''}

      ${!noHours && monsWithDispos.length > 3 && _filterMonId === 'all' ? `
        <div class="rv-selected-mon" style="justify-content:center">
          <button class="rv-back-pick" id="rv-back-pick" type="button">‹ Choisir un enseignant</button>
          <span style="font-size:12.5px;color:var(--mu);font-weight:600">Tous les créneaux</span>
        </div>
      ` : ''}

      ${!noHours && (monsWithDispos.length <= 1 || _filterMonId === 'all' || _filterMonId) ? (groups.length === 0 ? `
        <div class="rv-empty">
          <span class="em">🌴</span>
          <div>Aucun créneau dispo${_filterMonId && _filterMonId !== 'all' ? ' pour cet enseignant' : ''}.</div>
          <div style="margin-top:4px;font-size:12px">${_filterMonId && _filterMonId !== 'all' ? 'Choisis un autre enseignant ou ' : ''}Reviens plus tard !</div>
        </div>
      ` : `
        <div class="rv-picker-step">
          <div class="rv-step-h">
            <div class="rv-step-eyebrow">Étape ${monsWithDispos.length > 1 ? '2' : '1'}</div>
            <h2 class="rv-step-ti">Choisis ton créneau</h2>
          </div>
          <div id="rv-dtp-mount"></div>
        </div>
      `) : ''}
    </div>

    <div class="rv-sheet-bg" id="rv-sheet-bg" aria-hidden="true"></div>
    <div class="rv-sheet" id="rv-sheet" role="dialog" aria-modal="true" aria-labelledby="rv-sheet-ti"></div>
  `;

  wire();
}

function renderBlocked() {
  return `
    <div class="rv-block" role="alert">
      <div class="em">⛽</div>
      <div class="ti">Forfait épuisé</div>
      <div class="body">Tu as utilisé toutes les heures de ton forfait (${_forfait}h).<br>Contacte ton auto-école pour ajouter des heures avant de réserver.</div>
      <div class="cta">
        <button class="primary" id="rv-go-profil">Voir mon profil</button>
        <button id="rv-go-accueil">Retour accueil</button>
      </div>
    </div>
  `;
}

function renderCard(d) {
  const monNom = monNomFor(d);
  const dur = parseFloat(d.dur) || 1;
  const tooLong = dur > _heuresRestantes && _heuresRestantes > 0;
  return `
    <button class="rv-card" data-id="${esc(d.id)}" ${tooLong ? 'disabled title="Durée supérieure à tes heures restantes"' : ''}>
      <div class="rv-time">
        ${esc(d.h)}
        <span class="dur">${dur}h</span>
      </div>
      <div class="rv-mid">
        <div class="rv-av" style="background:${monColor(d.moniteur_id)}">${esc(monInitials(monNom))}</div>
        <div class="rv-info">
          <div class="rv-mon-nm">${esc(monNom)}</div>
          <div class="rv-lieu">${d.lieu ? `📍 ${esc(d.lieu)}` : 'Lieu à confirmer'}</div>
        </div>
      </div>
      <span class="rv-chev" aria-hidden="true">›</span>
    </button>
  `;
}

// ─── Wiring ───

function wire() {
  _root.querySelector('#rv-back')?.addEventListener('click', goAccueil);
  _root.querySelector('#rv-go-accueil')?.addEventListener('click', goAccueil);
  _root.querySelector('#rv-go-profil')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/profil');
  });

  _root.querySelectorAll('.rv-chip').forEach(c => {
    c.addEventListener('click', () => {
      _filterMonId = c.dataset.mon || null;
      render();
    });
  });

  // Stacked cards picker — click sur une carte = sélectionne enseignant
  wireStackedCards(_root, (id) => {
    _filterMonId = id;
    render();
  });

  // "Voir tous les créneaux" (si > 3 enseignants)
  _root.querySelector('#rv-show-all')?.addEventListener('click', () => {
    _filterMonId = 'all';
    render();
  });

  // "‹ Changer d'enseignant" → retour au picker
  _root.querySelector('#rv-back-pick')?.addEventListener('click', () => {
    _filterMonId = null;
    render();
  });

  // Mount du DateTimePicker (calendar + time slots) pour la sélection finale
  const dtpMount = _root.querySelector('#rv-dtp-mount');
  if (dtpMount) {
    const dispos = filteredDispos();
    // Map: date → [times], et lookup date+time → event id
    const timesByDate = {};
    const eventByDateTime = {};
    for (const d of dispos) {
      if (!d.date_event || !d.h) continue;
      const t = d.h.length === 5 ? d.h : d.h.slice(0, 5);
      if (!timesByDate[d.date_event]) timesByDate[d.date_event] = [];
      timesByDate[d.date_event].push(t);
      eventByDateTime[`${d.date_event}|${t}`] = d.id;
    }
    const availableDates = Object.keys(timesByDate).sort();
    const allTimes = [...new Set(Object.values(timesByDate).flat())].sort();

    mountDateTimePicker(dtpMount, {
      mode: 'single',
      timeSlots: allTimes.length > 0 ? allTimes : undefined,
      availableDates,
      availableTimesPerDate: timesByDate,
      minDate: isoDate(new Date()),
      onChange: ({ date, time }) => {
        if (!date || !time) return;
        const evId = eventByDateTime[`${date}|${time}`];
        if (evId) openSheet(evId);
      },
    });
  }

  _root.querySelectorAll('.rv-card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      if (card.hasAttribute('disabled')) return;
      openSheet(card.dataset.id);
    });
  });

  // Tap dehors / Echap → ferme la sheet
  _root.querySelector('#rv-sheet-bg')?.addEventListener('click', closeSheet);
  document.addEventListener('keydown', escClose);
}

async function goAccueil() {
  document.removeEventListener('keydown', escClose);
  const { navigate } = await import('@/router.js');
  navigate('/accueil');
}

function escClose(e) {
  if (e.key === 'Escape') closeSheet();
}

// ─── Bottom sheet (TAP 2) ───

function openSheet(eventId) {
  const ev = _dispos.find(x => x.id === eventId);
  if (!ev) return;

  const monNom = monNomFor(ev);
  const dur = parseFloat(ev.dur) || 1;

  const sheet = _root.querySelector('#rv-sheet');
  const bg = _root.querySelector('#rv-sheet-bg');

  sheet.innerHTML = `
    <div class="grip" aria-hidden="true"></div>
    <div class="rv-sheet-h">
      <div class="em">📅</div>
      <div class="ti" id="rv-sheet-ti">Confirmer la réservation</div>
      <div class="sub">L'enseignant recevra ta demande à valider</div>
    </div>

    <div class="rv-recap">
      <div class="rv-recap-row">
        <div class="ic">📆</div>
        <div class="col">
          <div class="lb">Jour</div>
          <div class="vl">${esc(dayLabel(ev.date_event))}</div>
        </div>
      </div>
      <div class="rv-recap-row">
        <div class="ic">🕐</div>
        <div class="col">
          <div class="lb">Heure · Durée</div>
          <div class="vl">${esc(ev.h)} · ${dur}h</div>
        </div>
      </div>
      <div class="rv-recap-row">
        <div class="ic">📍</div>
        <div class="col">
          <div class="lb">Lieu</div>
          <div class="vl">${ev.lieu ? esc(ev.lieu) : "À confirmer avec l'enseignant"}</div>
        </div>
      </div>
      <div class="rv-recap-row">
        <div class="ic" style="background:${monColor(ev.moniteur_id)};color:#fff;font-family:var(--fd);font-weight:800;font-size:11px">${esc(monInitials(monNom))}</div>
        <div class="col">
          <div class="lb">Enseignant</div>
          <div class="vl">${esc(monNom)}</div>
        </div>
      </div>
    </div>

    <div class="rv-sheet-note">
      Après confirmation, tu recevras une notification dès que <b>${esc(monNom.split(' ')[0])}</b> aura validé.
    </div>

    <div class="rv-sheet-cta">
      <button id="rv-cancel" type="button">Annuler</button>
      <button class="btn-confirm" id="rv-confirm" type="button">
        <span class="spinner" aria-hidden="true"></span>
        <span class="lbl">Confirmer</span>
      </button>
    </div>
  `;

  bg.classList.add('show');
  bg.setAttribute('aria-hidden', 'false');
  // RAF pour laisser le browser appliquer display avant la transition transform
  requestAnimationFrame(() => sheet.classList.add('show'));

  sheet.querySelector('#rv-cancel').onclick = closeSheet;
  sheet.querySelector('#rv-confirm').onclick = () => doConfirm(ev);
}

function closeSheet() {
  if (_busy) return; // pas de fermeture pendant l'INSERT
  const sheet = _root.querySelector('#rv-sheet');
  const bg = _root.querySelector('#rv-sheet-bg');
  sheet?.classList.remove('show');
  bg?.classList.remove('show');
  bg?.setAttribute('aria-hidden', 'true');
}

// ─── INSERT events.t='pend' + notif moniteur ───

async function doConfirm(ev) {
  if (_busy) return;
  _busy = true;

  const confirmBtn = _root.querySelector('#rv-confirm');
  const cancelBtn = _root.querySelector('#rv-cancel');
  const lbl = confirmBtn?.querySelector('.lbl');
  confirmBtn?.setAttribute('disabled', 'true');
  cancelBtn?.setAttribute('disabled', 'true');
  if (lbl) lbl.textContent = 'Envoi…';

  try {
    // 1. Garde-fou : re-lire la dispo source pour détecter un conflit (créneau pris entre temps)
    const { data: still, error: readErr } = await sb.from('events')
      .select('id, t, is_deleted, h, d, dur, lieu, moniteur_id, mon_nom, date_event')
      .eq('id', ev.id)
      .maybeSingle();

    if (readErr) {
      console.warn('[reservation] read err', readErr);
      toast('Erreur réseau, réessaie', 'error');
      return resetBtn(confirmBtn, cancelBtn, lbl);
    }
    if (!still || still.is_deleted || still.t !== 'dispo') {
      toast('Ce créneau vient d\'être pris 😕', 'error');
      // Retire la dispo localement et re-render
      _dispos = _dispos.filter(d => d.id !== ev.id);
      closeSheetForce();
      render();
      return;
    }

    const monNom = monNomFor(still);

    // 2. INSERT events.t='pend' (copie h/d/dur/lieu du dispo, eleve_id=me, moniteur_id du dispo)
    const { data: inserted, error: insErr } = await sb.from('events').insert({
      eleve_id: _me.id,
      n: _me.nom,
      moniteur_id: still.moniteur_id,
      mon_nom: still.mon_nom || monNom,
      h: still.h,
      d: still.d,
      dur: still.dur,
      lieu: still.lieu,
      date_event: still.date_event,
      t: 'pend',
      is_deleted: false,
    }).select().maybeSingle();

    if (insErr) {
      console.warn('[reservation] insert pend err', insErr);
      toast('Erreur réservation, réessaie', 'error');
      return resetBtn(confirmBtn, cancelBtn, lbl);
    }

    // 3. Soft-delete de la dispo source (pour éviter qu'un autre élève la prenne)
    //    Si ça échoue, on log mais on ne bloque pas (la demande est partie côté moniteur).
    sb.from('events').update({ is_deleted: true })
      .eq('id', still.id)
      .eq('t', 'dispo')
      .then(({ error }) => { if (error) console.warn('[reservation] soft-delete dispo err', error); });

    // 4. INSERT notification au moniteur (lecon_demande)
    if (still.moniteur_id) {
      sb.from('notifications').insert({
        user_id: still.moniteur_id,
        type: 'lecon_demande',
        title: 'Nouvelle demande de leçon',
        body: `${_me.nom} souhaite réserver le ${dayLabel(still.date_event)} à ${still.h}`,
      }).then(({ error }) => { if (error) console.warn('[reservation] notif err', error); });
    }

    // 5. Success → toast + redirect /accueil
    closeSheetForce();
    toast('Demande envoyée ✓ — en attente de validation', 'success', 3500);
    setTimeout(async () => {
      document.removeEventListener('keydown', escClose);
      const { navigate } = await import('@/router.js');
      navigate('/accueil');
    }, 700);
  } catch (err) {
    console.warn('[reservation] confirm exception', err);
    toast('Erreur inattendue', 'error');
    resetBtn(confirmBtn, cancelBtn, lbl);
  }
}

function resetBtn(confirmBtn, cancelBtn, lbl) {
  _busy = false;
  confirmBtn?.removeAttribute('disabled');
  cancelBtn?.removeAttribute('disabled');
  if (lbl) lbl.textContent = 'Confirmer';
}

function closeSheetForce() {
  _busy = false;
  const sheet = _root.querySelector('#rv-sheet');
  const bg = _root.querySelector('#rv-sheet-bg');
  sheet?.classList.remove('show');
  bg?.classList.remove('show');
  bg?.setAttribute('aria-hidden', 'true');
}
