/**
 * Helpers de formatage date.
 * Corrige le BUG-06 (Dim/Lun inversé) du rapport QA v6.9.
 */

export const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const WEEK_DAYS_FULL = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export const MONTHS_FR_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/**
 * Convertit le jour JS (0=dimanche) en index de WEEK_DAYS (0=lundi).
 * FIX BUG-06 : remplace l'ancienne formule `getDay()-1||6` buggée.
 */
export function jsDayToWeekIdx(jsDay) {
  return (jsDay + 6) % 7;
}

export function dayShort(date) {
  return WEEK_DAYS[jsDayToWeekIdx(date.getDay())];
}

export function dayFull(date) {
  return WEEK_DAYS_FULL[jsDayToWeekIdx(date.getDay())];
}

export function formatDate(date) {
  return `${dayShort(date)} ${date.getDate()} ${MONTHS_FR_SHORT[date.getMonth()]}`;
}

export function formatHour(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Retourne une nouvelle Date = `date` + N jours. */
export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Lundi de la semaine contenant `date` (à 00:00 locales). */
export function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const idx = jsDayToWeekIdx(d.getDay()); // 0=lundi
  d.setDate(d.getDate() - idx);
  return d;
}

/** Format ISO "YYYY-MM-DD" (sans fuseau, jour calendaire local). */
export function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
