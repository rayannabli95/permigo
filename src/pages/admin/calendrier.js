/**
 * Page Calendrier Admin / Gérant — vue jour globale tous moniteurs.
 *
 * Structure : timeline verticale 6h→22h avec 1 colonne par moniteur (swimlanes).
 * Permet au gérant de voir d'un coup d'œil "qui fait quoi maintenant".
 *
 * Fonctionnalités :
 *  - Date picker + navigation jour précédent / aujourd'hui / suivant
 *  - 4 KPIs jour : leçons, heures totales, élèves uniques, moniteurs actifs
 *  - Grille colonne heures (gauche) + 1 colonne par moniteur
 *  - Events placés selon leur heure et durée
 *  - Click event → modal détail read-only
 *  - Filtre par moniteur (chips)
 *
 * Branchée Supabase (admin RLS) :
 *  - events (jour sélectionné, tous moniteurs)
 *  - profiles (élèves + moniteurs)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { addDays, isoDate, MONTHS_FR_SHORT, WEEK_DAYS_FULL, jsDayToWeekIdx } from '@/utils/format-date.js';
import { mountNotifBell } from '@/components/notif-bell.js';

const HOUR_START = 6;
const HOUR_END = 22;
const ROWS = HOUR_END - HOUR_START;
const ROW_H = 50;

let _root, _me;
let _curDate = new Date(); _curDate.setHours(0, 0, 0, 0);
let _events = [];
let _moniteurs = [];
let _eleves = [];
let _hiddenIds = new Set(); // ids des moniteurs masqués

// Palette de couleurs HSL distinctes pour chaque moniteur
const MON_HUES = [200, 260, 30, 150, 320, 100, 0, 220];

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  await load();
  render();
}

async function load() {
  const iso = isoDate(_curDate);
  const [evtRes, profRes] = await Promise.allSettled([
    sb.from('events')
      .select('id, h, dur, t, lieu, comment, eleve_id, moniteur_id, mon_nom, n, date_event, is_deleted, numero_heure_eleve')
      .eq('is_deleted', false)
      .eq('date_event', iso)
      .order('h'),
    sb.from('profiles').select('id, nom, email, role'),
  ]);
  _events = evtRes.value?.data || [];
  const profs = profRes.value?.data || [];
  _moniteurs = profs.filter(p => p.role === 'moniteur').sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
  _eleves = profs.filter(p => p.role === 'eleve');
}

// ─── Helpers ───

function eventKind(t) {
  const s = (t || '').toLowerCase();
  if (s === 'conf' || s === 'leçon' || s === 'lecon') return 'conf';
  if (s === 'pend') return 'pend';
  if (s === 'dispo') return 'dispo';
  if (s === 'perso') return 'perso';
  if (s === 'absence') return 'absence';
  return 'autre';
}

function eleveNomFor(e) {
  if (e.eleve_id) {
    const p = _eleves.find(x => x.id === e.eleve_id);
    return p?.nom || e.n || '—';
  }
  return e.n || '';
}

function moniteurNomFor(monId) {
  const p = _moniteurs.find(x => x.id === monId);
  return p?.nom || '—';
}

function hueFor(monId) {
  const idx = _moniteurs.findIndex(m => m.id === monId);
  return MON_HUES[Math.max(0, idx) % MON_HUES.length];
}

function dayLabel() {
  const d = _curDate;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - today.getTime()) / 86400000;
  let prefix = '';
  if (diff === 0) prefix = "Aujourd'hui · ";
  else if (diff === 1) prefix = 'Demain · ';
  else if (diff === -1) prefix = 'Hier · ';
  return `${prefix}${WEEK_DAYS_FULL[jsDayToWeekIdx(d.getDay())]} ${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function kpis() {
  const lecons = _events.filter(e => eventKind(e.t) === 'conf');
  const heures = lecons.reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const elevesUniques = new Set(lecons.map(e => e.eleve_id).filter(Boolean)).size;
  const moniteursActifs = new Set(_events.filter(e => eventKind(e.t) !== 'absence').map(e => e.moniteur_id)).size;
  return { lecons: lecons.length, heures: +heures.toFixed(1), elevesUniques, moniteursActifs };
}

// ─── Render ───

function render() {
  const k = kpis();
  const visibles = _moniteurs.filter(m => !_hiddenIds.has(m.id));

  _root.innerHTML = `
    <style>
      /* Background dark glassmorphism (cohérent dashboard/eleves admin) */
      .ad-bg{position:fixed;inset:0;z-index:0;background:#0b0d1a;overflow:hidden;pointer-events:none}
      .ad-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,#6366f1 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,#8b5cf6 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,#0891b2 0%,transparent 40%);filter:blur(60px);opacity:.5;animation:cal-float 22s ease-in-out infinite alternate}
      @keyframes cal-float{0%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(40px,-30px) rotate(180deg) scale(1.08)}100%{transform:translate(-30px,40px) rotate(360deg) scale(.96)}}
      .ad-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,transparent 0%,rgba(11,13,26,.55) 100%)}
      .ad-grid{position:fixed;inset:0;z-index:1;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;pointer-events:none;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}

      .cal-wrap{max-width:1200px;margin:0 auto;padding:14px;position:relative;z-index:2;min-height:100vh}
      .cal-top{display:flex;align-items:center;gap:10px;padding:14px 4px 18px;flex-wrap:wrap}
      .cal-back{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:18px;cursor:pointer}
      .cal-back:hover{background:rgba(255,255,255,.14)}
      .cal-top .ttl{font-family:var(--fd);font-weight:800;font-size:22px;letter-spacing:-.02em;color:#fff}
      .cal-top .sub{font-size:11.5px;color:rgba(255,255,255,.55);margin-top:3px}
      .cal-top-r{margin-left:auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
      .cal-top-r button{height:34px;padding:0 12px;border-radius:8px;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.12);font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
      .cal-top-r button:hover{background:rgba(255,255,255,.14)}
      .cal-arrow{width:34px;padding:0 !important;font-size:16px}
      .cal-today{background:linear-gradient(135deg,#6366f1,#8b5cf6) !important;border-color:rgba(139,92,246,.5) !important}
      .cal-date{display:flex;align-items:center;gap:6px;font-family:var(--fn);font-size:12.5px;font-weight:700;color:#fff;background:rgba(255,255,255,.06);padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.1)}
      .cal-picker{height:34px;padding:0 8px;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.12);font-family:inherit;font-size:12px;color-scheme:dark}

      /* KPIs */
      .cal-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
      @media (max-width:720px){.cal-kpis{grid-template-columns:1fr 1fr}}
      .cal-kpi{padding:14px 16px;border-radius:var(--rl);background:rgba(255,255,255,.05);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1);box-shadow:0 8px 32px -8px rgba(0,0,0,.4)}
      .cal-kpi .l{font-size:10px;font-weight:800;color:rgba(255,255,255,.55);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
      .cal-kpi .v{font-family:var(--fd);font-size:24px;font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1}
      .cal-kpi .v small{font-size:13px;color:rgba(255,255,255,.5);font-weight:700;margin-left:2px}

      /* Chips filtres moniteurs */
      .cal-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;padding:0 4px}
      .cal-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .12s;letter-spacing:.2px}
      .cal-chip:hover{background:rgba(255,255,255,.12);transform:translateY(-1px)}
      .cal-chip.off{opacity:.4}
      .cal-chip i{display:inline-block;width:9px;height:9px;border-radius:50%}

      /* Grid swimlanes : 1 col heures + N cols moniteurs */
      .cal-grid{background:rgba(255,255,255,.04);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1);border-radius:var(--rl);overflow:hidden;box-shadow:0 8px 32px -8px rgba(0,0,0,.4)}
      .cal-grid-h{display:grid;grid-template-columns:60px repeat(var(--ncols),1fr);background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.1)}
      .cal-grid-h .c{padding:10px 8px;text-align:center;font-size:11.5px;font-weight:800;color:#fff;border-right:1px solid rgba(255,255,255,.08);position:relative;overflow:hidden;letter-spacing:.2px}
      .cal-grid-h .c:last-child{border-right:0}
      .cal-grid-h .c.h-col{font-family:var(--fn);font-size:10px;color:rgba(255,255,255,.5);background:rgba(255,255,255,.02)}
      .cal-grid-h .c .nm{display:block;line-height:1.2}
      .cal-grid-h .c .sub{display:block;font-size:9.5px;font-weight:700;color:rgba(255,255,255,.55);margin-top:3px;letter-spacing:.5px;text-transform:uppercase}
      .cal-grid-h .c::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--mc)}

      .cal-grid-body{display:grid;grid-template-columns:60px repeat(var(--ncols),1fr);position:relative}
      .cal-hour{background:rgba(255,255,255,.02);border-right:1px solid rgba(255,255,255,.08);border-bottom:1px dashed rgba(255,255,255,.06);height:${ROW_H}px;font-family:var(--fn);font-size:10px;color:rgba(255,255,255,.45);text-align:right;padding:3px 6px;font-weight:700;box-sizing:border-box}
      .cal-mon-col{position:relative;border-right:1px solid rgba(255,255,255,.06);box-sizing:border-box}
      .cal-mon-col:last-child{border-right:0}
      .cal-mon-cell{height:${ROW_H}px;border-bottom:1px dashed rgba(255,255,255,.06);box-sizing:border-box}

      .cal-evt{position:absolute;left:3px;right:3px;border-radius:6px;padding:4px 7px;cursor:pointer;overflow:hidden;font-size:11px;font-weight:600;z-index:2;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:transform .12s,box-shadow .15s;border:1px solid;animation:cal-pop .25s cubic-bezier(.2,.7,.3,1) both}
      @keyframes cal-pop{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      .cal-evt:hover{transform:translateY(-1px);box-shadow:0 8px 18px -6px rgba(0,0,0,.5);z-index:3}
      .cal-evt .h{font-family:var(--fn);font-size:9.5px;font-weight:800;letter-spacing:.3px;opacity:.9}
      .cal-evt .nm{font-size:11.5px;font-weight:700;margin-top:1px;line-height:1.2;color:#fff}
      .cal-evt .lieu{font-size:9.5px;opacity:.75;margin-top:2px}
      .cal-evt.dispo{background:rgba(255,255,255,.04);border-style:dashed}
      .cal-evt.dispo .nm{font-style:italic;opacity:.7}
      .cal-evt.absence{background:repeating-linear-gradient(45deg,rgba(239,68,68,.15),rgba(239,68,68,.15) 6px,transparent 6px,transparent 12px) !important}

      /* Sticky header */
      .cal-grid-h{position:sticky;top:0;z-index:5}

      /* Empty */
      .cal-empty{padding:60px 20px;text-align:center;color:rgba(255,255,255,.45);font-size:13.5px}
      .cal-empty .em{font-size:42px;margin-bottom:14px;opacity:.7}

      /* Modal détail (réutilise le style dark glass) */
      .cal-modal{position:fixed;inset:0;background:rgba(11,13,26,.72);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;z-index:90;padding:14px}
      .cal-modal.show{display:flex;animation:calFade .2s ease}
      @keyframes calFade{from{opacity:0}to{opacity:1}}
      .cal-mpanel{background:var(--bg);width:100%;max-width:480px;max-height:92vh;overflow:auto;border-radius:var(--rx);box-shadow:0 24px 60px -20px rgba(0,0,0,.6);animation:calSlide .25s cubic-bezier(.2,.7,.3,1)}
      @keyframes calSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      .cal-mh{padding:18px 18px 14px;border-bottom:1px solid var(--bo2);display:flex;align-items:center;justify-content:space-between;gap:10px}
      .cal-mh .ti{font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:-.01em}
      .cal-mh .id{font-family:var(--fn);font-size:11px;color:var(--mu);margin-top:2px;font-weight:700}
      .cal-mh button{width:32px;height:32px;border-radius:50%;background:var(--bg2);color:var(--ink);font-size:18px;border:0;cursor:pointer}
      .cal-mb{padding:16px}
      .cal-row{padding:10px 0;border-bottom:1px dashed var(--bo2);display:flex;justify-content:space-between;font-size:13px}
      .cal-row:last-child{border-bottom:0}
      .cal-row .l{color:var(--mu);font-weight:600}
      .cal-row .v{font-family:var(--fn);font-weight:700;color:var(--ink);text-align:right}
    </style>

    <div class="ad-bg"></div>
    <div class="ad-grid"></div>

    <div class="cal-wrap anim-slide-up">
      <div class="cal-top">
        <button class="cal-back" id="cal-back" aria-label="Retour">‹</button>
        <span class="pg-logo-txt">PermiGo</span>
        <div>
          <div class="ttl">Calendrier global</div>
          <div class="sub">${esc(dayLabel())}</div>
        </div>
        <div class="cal-top-r">
          <span id="cal-bell"></span>
          <button class="cal-arrow" id="cal-prev" aria-label="Jour précédent">‹</button>
          <button class="cal-today" id="cal-today">Aujourd'hui</button>
          <button class="cal-arrow" id="cal-next" aria-label="Jour suivant">›</button>
          <input class="cal-picker" id="cal-picker" type="date" value="${esc(isoDate(_curDate))}">
        </div>
      </div>

      <!-- KPIs -->
      <div class="cal-kpis">
        <div class="cal-kpi"><div class="l">📚 Leçons</div><div class="v">${k.lecons}</div></div>
        <div class="cal-kpi"><div class="l">⏱ Heures totales</div><div class="v">${k.heures}<small> h</small></div></div>
        <div class="cal-kpi"><div class="l">🎓 Élèves uniques</div><div class="v">${k.elevesUniques}</div></div>
        <div class="cal-kpi"><div class="l">👨‍🏫 Moniteurs actifs</div><div class="v">${k.moniteursActifs}<small> / ${_moniteurs.length}</small></div></div>
      </div>

      <!-- Chips filtres -->
      ${_moniteurs.length > 1 ? `
        <div class="cal-chips" id="cal-chips">
          ${_moniteurs.map(m => `
            <button class="cal-chip ${_hiddenIds.has(m.id) ? 'off' : ''}" data-mid="${esc(m.id)}">
              <i style="background:hsl(${hueFor(m.id)},75%,60%)"></i>${esc(m.nom)}
            </button>
          `).join('')}
        </div>
      ` : ''}

      ${visibles.length === 0 ? `
        <div class="cal-grid"><div class="cal-empty"><div class="em">👻</div>Aucun moniteur sélectionné ou aucun dans l'équipe</div></div>
      ` : renderGrid(visibles)}

      <div style="height:30px"></div>
    </div>

    <div class="cal-modal" id="cal-modal"><div class="cal-mpanel" id="cal-mpanel"></div></div>
  `;

  wire();
}

function renderGrid(visibles) {
  const ncols = visibles.length;

  // Header colonnes
  const headerCols = visibles.map(m => {
    const evtsMon = _events.filter(e => e.moniteur_id === m.id);
    const heuresLec = evtsMon.filter(e => eventKind(e.t) === 'conf').reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
    return `
      <div class="c" style="--mc:hsl(${hueFor(m.id)},75%,55%)">
        <span class="nm">${esc(m.nom)}</span>
        <span class="sub">${heuresLec || 0}h leçons</span>
      </div>
    `;
  }).join('');

  // Body : pour chaque heure × moniteur, une cellule
  let bodyRows = '';
  for (let r = 0; r < ROWS; r++) {
    const hour = HOUR_START + r;
    bodyRows += `<div class="cal-hour">${String(hour).padStart(2, '0')}:00</div>`;
    for (const m of visibles) {
      bodyRows += `<div class="cal-mon-cell"></div>`;
    }
  }

  // Events absolument positionnés au sein de chaque colonne moniteur
  // → on rend les events APRÈS la grille via overlay positionnel
  const eventsHTML = visibles.map((m, colIdx) => {
    const monEvents = _events.filter(e => e.moniteur_id === m.id);
    return monEvents.map(e => {
      const [hh, mm] = (e.h || '00:00').split(':').map(Number);
      const startMin = (hh - HOUR_START) * 60 + (mm || 0);
      if (startMin < 0 || startMin >= ROWS * 60) return '';
      const top = (startMin / 60) * ROW_H + 1;
      const height = Math.max(22, (parseFloat(e.dur) || 1) * ROW_H - 4);
      const kind = eventKind(e.t);
      const hue = hueFor(m.id);
      const eleveNom = eleveNomFor(e);

      // Couleur dérivée du moniteur, opacité selon kind
      const bg = kind === 'absence' ? `rgba(239,68,68,.18)` :
                 kind === 'perso' ? `rgba(148,163,184,.18)` :
                 kind === 'dispo' ? `hsla(${hue},75%,60%,.12)` :
                 `hsla(${hue},75%,55%,.32)`;
      const bd = kind === 'absence' ? `rgba(239,68,68,.55)` :
                 kind === 'perso' ? `rgba(148,163,184,.55)` :
                 `hsla(${hue},75%,55%,.65)`;

      const colStart = 2 + colIdx; // 1=heures, 2+ = moniteurs
      const label = kind === 'conf' || kind === 'pend'
        ? (eleveNom || '—')
        : kind === 'dispo' ? 'Dispo'
        : kind === 'perso' ? 'Perso'
        : kind === 'absence' ? 'Absence'
        : (e.t || '—');

      return `
        <div class="cal-evt ${kind}" data-id="${esc(e.id)}"
             style="grid-column:${colStart};grid-row:1;top:${top}px;height:${height}px;background:${bg};border-color:${bd};color:#fff;position:absolute;left:calc(60px + (100% - 60px) * ${colIdx} / ${ncols} + 3px);width:calc((100% - 60px) / ${ncols} - 6px)">
          <div class="h">${esc(e.h)} · ${e.dur}h</div>
          <div class="nm">${esc(label)}</div>
          ${e.lieu ? `<div class="lieu">📍 ${esc(e.lieu)}</div>` : ''}
        </div>
      `;
    }).join('');
  }).join('');

  return `
    <div class="cal-grid" style="--ncols:${ncols};position:relative">
      <div class="cal-grid-h">
        <div class="c h-col" style="--mc:transparent">HEURE</div>
        ${headerCols}
      </div>
      <div class="cal-grid-body" style="position:relative">
        ${bodyRows}
        ${eventsHTML}
      </div>
    </div>
  `;
}

// ─── Wire ───

function wire() {
  const bellHost = _root.querySelector('#cal-bell');
  if (bellHost) mountNotifBell(bellHost);

  _root.querySelector('#cal-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/dashboard');
  });

  _root.querySelector('#cal-prev')?.addEventListener('click', () => navigateDay(-1));
  _root.querySelector('#cal-next')?.addEventListener('click', () => navigateDay(1));
  _root.querySelector('#cal-today')?.addEventListener('click', () => {
    _curDate = new Date(); _curDate.setHours(0, 0, 0, 0);
    refresh();
  });
  _root.querySelector('#cal-picker')?.addEventListener('change', (e) => {
    const v = e.target.value;
    if (!v) return;
    const [y, m, d] = v.split('-').map(Number);
    _curDate = new Date(y, m - 1, d, 0, 0, 0, 0);
    refresh();
  });

  // Chips filtres moniteurs
  _root.querySelectorAll('.cal-chip').forEach(c => {
    c.addEventListener('click', () => {
      const id = c.dataset.mid;
      if (_hiddenIds.has(id)) _hiddenIds.delete(id);
      else _hiddenIds.add(id);
      render();
    });
  });

  // Click event → modal
  _root.querySelectorAll('.cal-evt').forEach(ev => {
    ev.addEventListener('click', () => {
      const id = ev.dataset.id;
      const e = _events.find(x => x.id === id);
      if (e) openDetail(e);
    });
  });

  const modal = _root.querySelector('#cal-modal');
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

async function navigateDay(delta) {
  _curDate = addDays(_curDate, delta);
  await refresh();
}

async function refresh() {
  await load();
  render();
}

function openDetail(e) {
  const kind = eventKind(e.t);
  const kindLabel = ({
    conf: '✅ Leçon confirmée',
    pend: '⏳ Réservation en attente',
    dispo: '📅 Créneau disponible',
    perso: '🔒 Créneau perso',
    absence: '🚫 Absence',
  })[kind] || '• Événement';

  const panel = _root.querySelector('#cal-mpanel');
  panel.innerHTML = `
    <div class="cal-mh">
      <div>
        <div class="ti">${kindLabel}</div>
        <div class="id">${esc(e.date_event)} · ${esc(e.h)} · ${e.dur}h</div>
      </div>
      <button id="cal-close" aria-label="Fermer">×</button>
    </div>
    <div class="cal-mb">
      <div class="cal-row"><span class="l">Moniteur</span><span class="v">${esc(moniteurNomFor(e.moniteur_id))}</span></div>
      ${e.eleve_id ? `<div class="cal-row"><span class="l">Élève</span><span class="v">${esc(eleveNomFor(e))}${e.numero_heure_eleve ? ` <small style="opacity:.6">· ${e.numero_heure_eleve}ème heure</small>` : ''}</span></div>` : ''}
      ${e.lieu ? `<div class="cal-row"><span class="l">Lieu</span><span class="v">📍 ${esc(e.lieu)}</span></div>` : ''}
      <div class="cal-row"><span class="l">Type</span><span class="v">${esc(e.t || '—')}</span></div>
      <div class="cal-row"><span class="l">Durée</span><span class="v">${e.dur}h</span></div>
      ${e.comment ? `<div class="cal-row"><span class="l">Note</span><span class="v">${esc(e.comment)}</span></div>` : ''}
    </div>
  `;
  panel.querySelector('#cal-close').onclick = closeModal;
  _root.querySelector('#cal-modal').classList.add('show');
}

function closeModal() {
  _root.querySelector('#cal-modal').classList.remove('show');
}
