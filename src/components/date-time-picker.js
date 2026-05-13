/**
 * Date + Time Picker — calendrier mini-month + time slots latéral.
 *
 * 3 cas d'usage métier :
 *  1. Élève réserve un créneau : mode 'single', highlightDates = dates avec dispos
 *  2. Enseignant crée une leçon : mode 'single', toutes dates futures
 *  3. Enseignant ouvre une dispo : mode 'range' (heure début + heure fin)
 *
 * Usage :
 *   import { mountDateTimePicker } from '@/components/date-time-picker.js';
 *
 *   const picker = mountDateTimePicker(container, {
 *     mode: 'single',                    // 'single' | 'range'
 *     timeSlots: ['06:00', '06:15', ...],
 *     availableDates: ['2026-05-14', ...],  // dates ouvertes (string ISO)
 *     availableTimesPerDate: { '2026-05-14': ['09:00', '10:00'] }, // si défini, filtre slots
 *     selectedDate: '2026-05-14',
 *     selectedTime: '10:00',
 *     onChange: ({ date, time, timeStart, timeEnd }) => { ... },
 *   });
 *
 *   picker.destroy();
 */

import { esc } from '@/utils/escape.js';

const WEEKDAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d) {
  const r = new Date(d);
  const day = r.getDay() === 0 ? 6 : r.getDay() - 1; // Lundi = 0
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function mountDateTimePicker(container, opts = {}) {
  const {
    mode = 'single',
    timeSlots = defaultTimeSlots(6, 22, 15),
    availableDates = null,            // null = toutes dispo
    availableTimesPerDate = null,     // null = tous slots dispos par date
    minDate = null,
    maxDate = null,
    onChange,
  } = opts;

  const state = {
    viewMonth: opts.selectedDate ? new Date(opts.selectedDate) : new Date(),
    selectedDate: opts.selectedDate || null,
    selectedTime: opts.selectedTime || null,
    rangeStart: opts.timeStart || null,
    rangeEnd: opts.timeEnd || null,
  };
  state.viewMonth.setDate(1);
  state.viewMonth.setHours(0, 0, 0, 0);

  const availableDatesSet = availableDates ? new Set(availableDates) : null;

  function render() {
    const cells = computeMonthCells(state.viewMonth);
    const monthLabel = `${MONTHS_FR[state.viewMonth.getMonth()]} ${state.viewMonth.getFullYear()}`;

    const slots = filteredTimeSlots();

    container.innerHTML = `
      <div class="dtp-root">
        <div class="dtp-cal">
          <header class="dtp-cal-h">
            <button class="dtp-nav" data-nav="-1" type="button" aria-label="Mois précédent">‹</button>
            <div class="dtp-cal-ti">${monthLabel}</div>
            <button class="dtp-nav" data-nav="1" type="button" aria-label="Mois suivant">›</button>
          </header>

          <div class="dtp-wk">
            ${WEEKDAYS_FR.map(d => `<div class="dtp-wk-d">${d}</div>`).join('')}
          </div>

          <div class="dtp-grid">
            ${cells.map(cell => renderCell(cell)).join('')}
          </div>
        </div>

        <div class="dtp-times">
          <div class="dtp-times-h">
            ${state.selectedDate
              ? (mode === 'range'
                  ? (state.rangeStart && !state.rangeEnd
                      ? 'Choisis l\'heure de fin'
                      : (state.rangeStart && state.rangeEnd
                          ? `${state.rangeStart} → ${state.rangeEnd}`
                          : 'Choisis l\'heure de début'))
                  : 'Horaires disponibles')
              : 'Choisis une date'}
          </div>
          <div class="dtp-times-list" role="listbox">
            ${slots.length === 0 && state.selectedDate
              ? `<div class="dtp-empty">Aucun créneau ce jour</div>`
              : slots.map(t => renderTimeSlot(t)).join('')
            }
          </div>
        </div>
      </div>
    `;

    wire();
  }

  function renderCell(cell) {
    if (cell.empty) return `<div class="dtp-cell dtp-empty-cell"></div>`;
    const iso = cell.iso;
    const isAvail = availableDatesSet ? availableDatesSet.has(iso) : true;
    const isDisabled = !isAvail
      || (minDate && iso < minDate)
      || (maxDate && iso > maxDate);
    const isSelected = iso === state.selectedDate;
    const isToday = iso === isoDate(new Date());

    const cls = [
      'dtp-cell',
      isDisabled ? 'dtp-disabled' : '',
      isSelected ? 'dtp-selected' : '',
      isToday ? 'dtp-today' : '',
      isAvail && !isDisabled ? 'dtp-available' : '',
    ].filter(Boolean).join(' ');

    return `
      <button class="${cls}" data-day="${iso}" ${isDisabled ? 'disabled' : ''} type="button"
        aria-label="${cell.label}" aria-selected="${isSelected}">
        ${cell.dayNum}
        ${isAvail && !isDisabled && !isSelected ? '<span class="dtp-dot"></span>' : ''}
      </button>
    `;
  }

  function renderTimeSlot(t) {
    if (mode === 'single') {
      const sel = t === state.selectedTime;
      return `<button class="dtp-slot ${sel ? 'on' : ''}" data-time="${t}" type="button" aria-selected="${sel}">${t}</button>`;
    }
    // Mode range : start ou end choisi → highlight les slots dans la plage
    const inRange = state.rangeStart && state.rangeEnd
      && t >= state.rangeStart && t <= state.rangeEnd;
    const isStart = t === state.rangeStart;
    const isEnd = t === state.rangeEnd;
    const cls = ['dtp-slot'];
    if (isStart) cls.push('on dtp-range-start');
    if (isEnd) cls.push('on dtp-range-end');
    if (inRange && !isStart && !isEnd) cls.push('dtp-range-mid');
    return `<button class="${cls.join(' ')}" data-time="${t}" type="button">${t}</button>`;
  }

  function filteredTimeSlots() {
    if (!state.selectedDate) return timeSlots;
    // 1) callback dynamique (utilisé pour calcul des créneaux LIBRES côté enseignant)
    if (typeof opts.computeAvailableTimes === 'function') {
      const dyn = opts.computeAvailableTimes(state.selectedDate);
      if (Array.isArray(dyn)) return dyn;
    }
    // 2) map statique
    if (availableTimesPerDate) {
      const avail = availableTimesPerDate[state.selectedDate];
      if (!avail) return [];
      return timeSlots.filter(t => avail.includes(t));
    }
    return timeSlots;
  }

  function wire() {
    container.querySelectorAll('[data-nav]').forEach(b => {
      b.addEventListener('click', () => {
        const delta = parseInt(b.dataset.nav, 10);
        state.viewMonth.setMonth(state.viewMonth.getMonth() + delta);
        render();
      });
    });
    container.querySelectorAll('[data-day]').forEach(b => {
      b.addEventListener('click', () => {
        if (b.disabled) return;
        state.selectedDate = b.dataset.day;
        if (mode === 'range') { state.rangeStart = null; state.rangeEnd = null; }
        else { state.selectedTime = null; }
        render();
        emit();
      });
    });
    container.querySelectorAll('[data-time]').forEach(b => {
      b.addEventListener('click', () => {
        const t = b.dataset.time;
        if (mode === 'single') {
          state.selectedTime = t;
        } else {
          // Range
          if (!state.rangeStart || (state.rangeStart && state.rangeEnd)) {
            state.rangeStart = t;
            state.rangeEnd = null;
          } else {
            if (t < state.rangeStart) {
              state.rangeEnd = state.rangeStart;
              state.rangeStart = t;
            } else if (t > state.rangeStart) {
              state.rangeEnd = t;
            } else {
              // même slot → reset
              state.rangeStart = t;
              state.rangeEnd = null;
            }
          }
        }
        render();
        emit();
      });
    });
  }

  function emit() {
    if (typeof onChange !== 'function') return;
    if (mode === 'single') {
      onChange({ date: state.selectedDate, time: state.selectedTime });
    } else {
      onChange({ date: state.selectedDate, timeStart: state.rangeStart, timeEnd: state.rangeEnd });
    }
  }

  ensureStyles();
  render();

  return {
    destroy: () => { container.innerHTML = ''; },
    getValue: () => ({ ...state }),
  };
}

function computeMonthCells(viewMonth) {
  const first = new Date(viewMonth);
  first.setDate(1);
  const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const startWeek = startOfWeek(first);

  const cells = [];
  // 6 semaines de 7 jours = 42 cells
  for (let i = 0; i < 42; i++) {
    const d = new Date(startWeek);
    d.setDate(startWeek.getDate() + i);
    if (d.getMonth() !== viewMonth.getMonth()) {
      cells.push({ empty: true });
    } else {
      cells.push({
        empty: false,
        iso: isoDate(d),
        dayNum: d.getDate(),
        label: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      });
    }
    // Stop si fin du mois ET fin de semaine atteints
    if (d > last && (i + 1) % 7 === 0) break;
  }
  return cells;
}

function defaultTimeSlots(hStart = 6, hEnd = 22, step = 15) {
  const slots = [];
  for (let m = hStart * 60; m < hEnd * 60; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

let _stylesInjected = false;
function ensureStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const s = document.createElement('style');
  s.id = 'date-time-picker-styles';
  s.textContent = `
    .dtp-root{display:grid;grid-template-columns:1fr 200px;gap:18px;background:var(--su,#fff);border:1px solid var(--bo,#e2e8f0);border-radius:14px;overflow:hidden}
    @media (max-width:640px){.dtp-root{grid-template-columns:1fr;gap:0}}

    /* ── Calendar ── */
    .dtp-cal{padding:16px}
    .dtp-cal-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .dtp-cal-ti{font-family:var(--fd,system-ui);font-weight:800;font-size:14px;color:var(--ink,#0f172a);letter-spacing:-.01em;text-transform:capitalize}
    .dtp-nav{width:30px;height:30px;border-radius:8px;background:var(--bg2,#f8fafc);border:1px solid var(--bo,#e2e8f0);font-size:16px;color:var(--mu,#64748b);cursor:pointer;font-family:inherit;transition:all .15s}
    .dtp-nav:hover{background:var(--bg3,#f1f5f9);color:var(--ink,#0f172a)}

    .dtp-wk{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:6px}
    .dtp-wk-d{text-align:center;font-family:var(--fn,system-ui);font-size:10.5px;font-weight:800;color:var(--mu,#64748b);letter-spacing:.5px;text-transform:uppercase;padding:6px 0}

    .dtp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
    .dtp-cell{position:relative;aspect-ratio:1;background:transparent;border:0;border-radius:9px;font-family:var(--fd,system-ui);font-size:13.5px;font-weight:600;color:var(--ink,#0f172a);cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center}
    .dtp-cell:not(.dtp-disabled):not(.dtp-selected):hover{background:var(--bg2,#f8fafc)}
    .dtp-empty-cell{cursor:default}
    .dtp-disabled{color:var(--mu2,#94a3b8);text-decoration:line-through;cursor:not-allowed;opacity:.5}
    .dtp-today{font-weight:900;color:var(--a,#6366f1)}
    .dtp-today::after{content:'';position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:var(--a,#6366f1)}
    .dtp-available .dtp-dot{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:#10b981}
    .dtp-selected{background:var(--a,#6366f1);color:#fff;box-shadow:0 4px 12px -2px rgba(99,102,241,.4)}
    .dtp-selected .dtp-dot{display:none}
    .dtp-selected.dtp-today::after{background:#fff}

    /* ── Time slots ── */
    .dtp-times{padding:16px;border-left:1px solid var(--bo,#e2e8f0);background:var(--bg2,#f8fafc);display:flex;flex-direction:column;max-height:380px}
    @media (max-width:640px){.dtp-times{border-left:0;border-top:1px solid var(--bo,#e2e8f0);max-height:280px}}
    .dtp-times-h{font-family:var(--fn,system-ui);font-size:11px;font-weight:800;color:var(--mu,#64748b);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;flex-shrink:0}
    .dtp-times-list{display:grid;gap:6px;overflow-y:auto;flex:1;padding-right:4px;scrollbar-width:thin}
    .dtp-times-list::-webkit-scrollbar{width:5px}
    .dtp-times-list::-webkit-scrollbar-thumb{background:rgba(100,116,139,.3);border-radius:99px}

    .dtp-slot{padding:9px 12px;border-radius:9px;border:1px solid var(--bo,#e2e8f0);background:var(--su,#fff);font-family:var(--fn,system-ui);font-weight:700;font-size:13px;color:var(--ink,#0f172a);cursor:pointer;transition:all .15s;text-align:center}
    .dtp-slot:hover{border-color:var(--a,#6366f1);color:var(--a,#6366f1)}
    .dtp-slot.on{background:var(--a,#6366f1);border-color:var(--a,#6366f1);color:#fff;box-shadow:0 4px 10px -2px rgba(99,102,241,.4)}
    .dtp-slot.dtp-range-start{border-radius:9px 0 0 9px}
    .dtp-slot.dtp-range-end{border-radius:0 9px 9px 0}
    .dtp-slot.dtp-range-mid{background:rgba(99,102,241,.18);border-color:rgba(99,102,241,.3);color:var(--a,#6366f1);font-weight:800}

    .dtp-empty{padding:24px 12px;text-align:center;font-size:12.5px;color:var(--mu,#64748b);font-style:italic}
  `;
  document.head.appendChild(s);
}
