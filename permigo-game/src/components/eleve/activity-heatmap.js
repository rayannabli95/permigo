/**
 * Activity Heatmap — vue GitHub-style des jours actifs sur N semaines.
 *
 * Pour l'élève : visualise sa régularité (jours où il s'est connecté + a validé des comp).
 *
 * Usage :
 *   import { renderHeatmap, ensureHeatmapStyles } from '@/components/eleve/activity-heatmap.js';
 *   ensureHeatmapStyles();
 *   `<div>${renderHeatmap({ activeDates: ['2026-05-10', ...], weeks: 12 })}</div>`
 *
 * activeDates : array de strings "YYYY-MM-DD" (jours actifs)
 * activityLevels : optional map { 'YYYY-MM-DD': 1|2|3|4 } pour intensité (1=light, 4=darkest)
 */

const DAYS_FR = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS_FR = [
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function renderHeatmap({
  activeDates = [],
  activityLevels = null,
  activityDetails = {},
  weeks = 14,
  title = "Mon activité",
} = {}) {
  const active = new Set(activeDates);
  const levels = activityLevels || {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Démarre N semaines avant aujourd'hui, sur un lundi
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - weeks * 7);
  // Aller au lundi suivant (ou rester si on est lundi)
  const dayIdx = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - dayIdx);

  // Génère grille : 7 lignes (Lun→Dim) × N colonnes (semaines)
  const grid = []; // grid[day][week]
  for (let day = 0; day < 7; day++) grid.push([]);

  const monthsLabels = []; // [{ weekIdx, monthName }]
  let lastMonth = -1;

  for (let w = 0; w < weeks; w++) {
    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(cellDate.getDate() + w * 7 + day);
      const key = dateKey(cellDate);
      const inFuture = cellDate > today;
      const isActive = active.has(key);
      const level = levels[key] || (isActive ? 1 : 0);
      const isToday = key === dateKey(today);

      const detail = activityDetails[key] || null;
      grid[day].push({
        key,
        day: cellDate.getDate(),
        month: cellDate.getMonth(),
        isFuture: inFuture,
        isActive,
        level,
        isToday,
        detail,
        dateLabel: cellDate.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
        }),
      });

      // Label du mois quand on change (et seulement sur la 1ère ligne)
      if (day === 0 && cellDate.getMonth() !== lastMonth) {
        monthsLabels.push({
          weekIdx: w,
          monthName: MONTHS_FR[cellDate.getMonth()],
        });
        lastMonth = cellDate.getMonth();
      }
    }
  }

  // Compteurs
  const totalActive = activeDates.length;
  const last7Active = activeDates.filter((d) => {
    const dd = new Date(d + "T00:00:00");
    return (today - dd) / 86400000 < 7;
  }).length;

  return `
    <div class="hmap">
      <div class="hmap-head">
        <div class="hmap-title">${title}</div>
        <div class="hmap-stats">
          <span><b>${totalActive}</b> jours actifs · <b>${last7Active}</b> cette semaine</span>
        </div>
      </div>
      <div class="hmap-scroll">
        <div class="hmap-months">
          ${monthsLabels.map((m) => `<span style="grid-column-start:${m.weekIdx + 2}">${m.monthName}</span>`).join("")}
        </div>
        <div class="hmap-grid" style="grid-template-columns:auto repeat(${weeks},1fr)">
          ${grid
            .map(
              (row, dayIdx) => `
            <div class="hmap-daylbl" style="grid-row:${dayIdx + 1}">${dayIdx % 2 === 1 ? DAYS_FR[dayIdx] : ""}</div>
            ${row
              .map(
                (cell, weekIdx) => `
              <div class="hmap-cell lv-${cell.level} ${cell.isFuture ? "future" : ""} ${cell.isToday ? "today" : ""}"
                   role="img"
                   style="grid-row:${dayIdx + 1};grid-column:${weekIdx + 2}"
                   data-key="${cell.key}"
                   data-label="${cell.dateLabel}"
                   data-detail="${cell.detail ? encodeURIComponent(cell.detail) : ""}"
                   aria-label="${cell.dateLabel}${cell.isActive ? " — actif" : ""}"></div>
            `,
              )
              .join("")}
          `,
            )
            .join("")}
        </div>
      </div>
      <div class="hmap-legend">
        <span>Moins</span>
        <span class="hmap-lcell lv-0"></span>
        <span class="hmap-lcell lv-1"></span>
        <span class="hmap-lcell lv-2"></span>
        <span class="hmap-lcell lv-3"></span>
        <span class="hmap-lcell lv-4"></span>
        <span>Plus</span>
      </div>
    </div>
  `;
}

let _hmapCssInjected = false;
export function ensureHeatmapStyles() {
  if (_hmapCssInjected) return;
  _hmapCssInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .hmap{padding:16px;background:var(--su);border:1px solid var(--bo);border-radius:14px;box-shadow:var(--s0)}
    .hmap-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;flex-wrap:wrap}
    .hmap-title{font-family:var(--fd);font-weight:800;font-size:14px;color:var(--ink);letter-spacing:-.01em}
    .hmap-stats{font-size:11.5px;color:var(--mu);font-weight:600}
    .hmap-stats b{color:var(--ink);font-weight:800;font-family:var(--fn)}
    .hmap-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .hmap-months{display:grid;grid-template-columns:auto repeat(var(--cols,14),1fr);font-family:var(--fn);font-size:10px;font-weight:700;color:var(--mu);letter-spacing:.5px;margin-bottom:4px;min-width:380px}
    .hmap-months span{grid-row:1;white-space:nowrap}
    .hmap-grid{display:grid;grid-template-rows:repeat(7,1fr);gap:3px;min-width:380px}
    .hmap-daylbl{grid-column:1;font-family:var(--fn);font-size:9px;font-weight:700;color:var(--mu2);text-align:center;align-self:center;padding-right:6px}
    .hmap-cell{aspect-ratio:1;border-radius:3px;background:var(--bg2);transition:transform .1s;cursor:default;min-width:14px}
    .hmap-cell:hover{transform:scale(1.4);box-shadow:0 0 0 1px var(--a);z-index:2;position:relative}
    .hmap-cell.lv-0{background:var(--bg4)}
    .hmap-cell.lv-1{background:var(--al2)}
    .hmap-cell.lv-2{background:var(--al)}
    .hmap-cell.lv-3{background:var(--a)}
    .hmap-cell.lv-4{background:var(--adk)}
    .hmap-cell.future{background:transparent;border:1px dashed var(--bo)}
    .hmap-cell.today{box-shadow:0 0 0 2px var(--a);position:relative;z-index:1}
    .hmap-cell.active-tap{transform:scale(1.4);box-shadow:0 0 0 2px var(--a);z-index:3;position:relative}

    .hmap-legend{display:flex;align-items:center;justify-content:flex-end;gap:5px;margin-top:10px;font-size:10px;color:var(--mu2);font-weight:600}
    .hmap-lcell{width:11px;height:11px;border-radius:2.5px}
    .hmap-lcell.lv-0{background:var(--bg4)}
    .hmap-lcell.lv-1{background:var(--al2)}
    .hmap-lcell.lv-2{background:var(--al)}
    .hmap-lcell.lv-3{background:var(--a)}
    .hmap-lcell.lv-4{background:var(--adk)}
    .hmap-tooltip{position:fixed;background:var(--ink);color:#fff;font:600 11px/1.4 'Inter',sans-serif;padding:6px 10px;border-radius:8px;pointer-events:none;z-index:9000;opacity:0;transition:opacity .15s;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.2)}
  `;
  document.head.appendChild(style);
}
