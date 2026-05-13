/**
 * Service Planning — règles métier d'un moniteur d'auto-école.
 *
 * Centralise la logique :
 *  - Création d'une dispo / d'une leçon (avec validations)
 *  - Annulation (avec motif, message, alertes < 48h / < 4h)
 *  - Modification d'une leçon
 *  - Confirmation côté élève
 *  - Marquer livret rempli
 *  - Détection chevauchement
 *  - Compat boîte véhicule (auto / manuelle)
 *  - Limite 8h conduites / jour (warning à 6h, blocage à 8h)
 *  - Buffer trajet entre 2 lieux différents
 *  - Numéro de l'heure auto-incrémenté par élève
 *
 * Convention : toutes les fonctions retournent { ok: bool, errors: [], warnings: [], data? }
 * Aucune UI ici — c'est le job des pages qui utilisent ce service.
 */

import { sb } from '@/auth/auth.js';

// ─── Constantes métier ─────────────────────────────────────────────────

export const MOTIFS_ANNULATION = [
  'Priorité autre élève',
  'Problème véhicule',
  'RDV inaccessible',
  'Autre plateforme',
  'Erreur planning',
  'Demande élève',
  'Santé',
  'Urgence perso',
  'Documents expirés',
  'Autre',
];

export const LIMITE_QUOTIDIENNE_H = 8;          // R5 — blocage
export const WARN_QUOTIDIEN_H = 6;              // R5 — warning
export const BUFFER_TRAJET_MIN_DEFAULT = 15;    // R4
export const PREAVIS_LIBRE_H = 48;              // R6 — pas de friction
export const PREAVIS_JOUR_J_H = 4;              // R6 — alerte rouge

// Statuts logiques de l'event (mappés sur `t` de la table)
export const STATUTS = {
  DISPO: 'dispo',                  // créneau ouvert à la réservation
  LECON_PROPOSEE: 'pend',          // élève a réservé, en attente confirmation moniteur (ou inverse)
  LECON_CONFIRMEE: 'conf',         // confirmée des 2 côtés
  LECON_ANNULEE: 'annulee',        // annulée (motif obligatoire)
  PERSO: 'perso',                  // créneau perso bloqué
  ABSENCE: 'absence',              // moniteur indisponible
};

// ─── Helpers internes ──────────────────────────────────────────────────

/** "09:30" → 9.5 (heures décimales) */
function hToDecimal(h) {
  if (!h) return 0;
  const [hh, mm] = String(h).split(':').map(Number);
  return hh + (mm || 0) / 60;
}

/** Compte les heures (dur) cumulées sur une date pour un moniteur, en excluant un event id (utile au modif). */
async function getHeuresJour(moniteurId, dateIso, excludeEventId = null) {
  const { data } = await sb.from('events')
    .select('id, dur, t')
    .eq('moniteur_id', moniteurId)
    .eq('date_event', dateIso)
    .eq('is_deleted', false);
  if (!data) return 0;
  return data
    .filter(e => isLecon(e.t) && e.id !== excludeEventId)
    .reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
}

function isLecon(t) {
  const s = (t || '').toLowerCase();
  return s === 'conf' || s === 'pend' || s === 'leçon' || s === 'lecon';
}

/** Renvoie les events du moniteur sur la date donnée. */
async function getEventsDate(moniteurId, dateIso) {
  const { data } = await sb.from('events')
    .select('id, h, dur, t, lieu, eleve_id')
    .eq('moniteur_id', moniteurId)
    .eq('date_event', dateIso)
    .eq('is_deleted', false)
    .order('h');
  return data || [];
}

/** Renvoie true si [start1, end1[ chevauche [start2, end2[. */
function rangeOverlap(s1, e1, s2, e2) {
  return s1 < e2 && s2 < e1;
}

/** Heures (décimales) restantes entre deux events triés par heure. */
function gapEntre(prev, next) {
  return hToDecimal(next.h) - (hToDecimal(prev.h) + (parseFloat(prev.dur) || 0));
}

// ─── R1 — Chevauchement ────────────────────────────────────────────────
/**
 * @returns { ok, errors[] } — erreur si un autre event du moniteur tombe sur la même plage.
 */
export async function checkChevauchement({ moniteurId, dateIso, h, dur, excludeEventId = null }) {
  const errors = [];
  const events = await getEventsDate(moniteurId, dateIso);
  const start = hToDecimal(h);
  const end = start + parseFloat(dur || 0);
  for (const e of events) {
    if (e.id === excludeEventId) continue;
    const s = hToDecimal(e.h);
    const f = s + (parseFloat(e.dur) || 0);
    if (rangeOverlap(start, end, s, f)) {
      errors.push(`Chevauchement avec un créneau ${e.h} (${e.dur}h)`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ─── R3 — Compat véhicule ──────────────────────────────────────────────
/**
 * Bloque si élève boîte manuelle mais moniteur boîte auto seulement (ou inverse).
 */
export async function checkVehicule({ moniteurId, eleveId }) {
  const errors = [];
  if (!eleveId) return { ok: true, errors };

  const [{ data: mon }, { data: elv }] = await Promise.all([
    sb.from('profiles').select('boite_vehicule').eq('id', moniteurId).maybeSingle(),
    sb.from('profiles').select('boite_apprentissage').eq('id', eleveId).maybeSingle(),
  ]);

  const monBoite = mon?.boite_vehicule || 'manuelle';
  const elvBoite = elv?.boite_apprentissage || 'manuelle';

  if (monBoite === 'both') return { ok: true, errors };
  if (monBoite !== elvBoite) {
    errors.push(`Élève apprend en boîte ${elvBoite} — l'enseignant conduit en ${monBoite}.`);
  }
  return { ok: errors.length === 0, errors };
}

// ─── R4 — Buffer trajet entre 2 lieux différents ──────────────────────
/**
 * Warning si gap < buffer min entre 2 leçons consécutives à des lieux différents.
 * Ne bloque pas — c'est une alerte.
 */
export async function checkBufferTrajet({ moniteurId, dateIso, h, dur, lieu, excludeEventId = null }) {
  const warnings = [];
  if (!lieu) return { ok: true, warnings };

  const events = await getEventsDate(moniteurId, dateIso);
  const lecons = events.filter(e => e.id !== excludeEventId && isLecon(e.t) && e.lieu);
  const myStart = hToDecimal(h);
  const myEnd = myStart + parseFloat(dur || 0);

  // Cherche l'event juste avant et juste après
  let prev = null, next = null;
  for (const e of lecons) {
    const s = hToDecimal(e.h);
    if (s < myStart) prev = e;
    else if (s >= myEnd && !next) next = e;
  }

  const bufferMin = BUFFER_TRAJET_MIN_DEFAULT / 60; // → heures

  if (prev && prev.lieu && prev.lieu !== lieu) {
    const gap = myStart - (hToDecimal(prev.h) + (parseFloat(prev.dur) || 0));
    if (gap < bufferMin) {
      warnings.push(`Buffer trajet faible avec "${prev.lieu}" (${Math.round(gap * 60)} min, min ${BUFFER_TRAJET_MIN_DEFAULT} min).`);
    }
  }
  if (next && next.lieu && next.lieu !== lieu) {
    const gap = hToDecimal(next.h) - myEnd;
    if (gap < bufferMin) {
      warnings.push(`Buffer trajet faible vers "${next.lieu}" (${Math.round(gap * 60)} min, min ${BUFFER_TRAJET_MIN_DEFAULT} min).`);
    }
  }
  return { ok: true, warnings };
}

// ─── R5 — Limite quotidienne ───────────────────────────────────────────
/**
 * Warning à 6h, blocage à 8h (override possible côté UI avec confirmation).
 */
export async function checkLimiteJour({ moniteurId, dateIso, dur, excludeEventId = null }) {
  const errors = [];
  const warnings = [];
  const dejaH = await getHeuresJour(moniteurId, dateIso, excludeEventId);
  const total = dejaH + parseFloat(dur || 0);
  if (total > LIMITE_QUOTIDIENNE_H) {
    errors.push(`Limite quotidienne dépassée : ${total.toFixed(1)}h (max ${LIMITE_QUOTIDIENNE_H}h).`);
  } else if (total > WARN_QUOTIDIEN_H) {
    warnings.push(`Tu approches la limite quotidienne (${total.toFixed(1)}h / ${LIMITE_QUOTIDIENNE_H}h).`);
  }
  return { ok: errors.length === 0, errors, warnings, totalH: total };
}

// ─── R6 — Préavis annulation ───────────────────────────────────────────
/**
 * Renvoie le niveau d'alerte selon le préavis :
 *   'libre'  → ≥ 48h, annulation simple
 *   'tardive' → 4h–48h, motif + message obligatoires si "Autre"
 *   'jour_j' → < 4h, alerte rouge + motif obligatoire
 */
export function checkPreavisAnnulation({ dateEvent, h }) {
  if (!dateEvent || !h) return { niveau: 'libre', heuresRestantes: Infinity };
  const [hh, mm] = String(h).split(':').map(Number);
  const dt = new Date(dateEvent + 'T00:00:00');
  dt.setHours(hh || 0, mm || 0, 0, 0);
  const diffH = (dt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffH >= PREAVIS_LIBRE_H) return { niveau: 'libre', heuresRestantes: diffH };
  if (diffH >= PREAVIS_JOUR_J_H) return { niveau: 'tardive', heuresRestantes: diffH };
  return { niveau: 'jour_j', heuresRestantes: diffH };
}

// ─── R10 — Numéro d'heure élève auto-incrémenté ───────────────────────
/**
 * Compte les leçons confirmées passées d'un élève + 1 = numéro de la prochaine.
 */
export async function getNumeroHeureSuivant(eleveId) {
  if (!eleveId) return null;
  const { count } = await sb.from('events')
    .select('id', { count: 'exact', head: true })
    .eq('eleve_id', eleveId)
    .eq('is_deleted', false)
    .in('t', ['conf', 'Leçon', 'lecon']);
  return (count || 0) + 1;
}

// ─── Validation complète avant création leçon ──────────────────────────
/**
 * Lance toutes les validations bloquantes + warnings.
 * Le code appelant décide d'afficher / bloquer / override.
 */
export async function validateLecon({ moniteurId, eleveId, dateIso, h, dur, lieu }) {
  const errors = [];
  const warnings = [];

  // R1
  const r1 = await checkChevauchement({ moniteurId, dateIso, h, dur });
  errors.push(...r1.errors);

  // R3
  const r3 = await checkVehicule({ moniteurId, eleveId });
  errors.push(...r3.errors);

  // R5
  const r5 = await checkLimiteJour({ moniteurId, dateIso, dur });
  errors.push(...r5.errors);
  warnings.push(...r5.warnings);

  // R4 — warning seulement
  const r4 = await checkBufferTrajet({ moniteurId, dateIso, h, dur, lieu });
  warnings.push(...r4.warnings);

  return { ok: errors.length === 0, errors, warnings };
}

// ─── W1 — Création d'une dispo ─────────────────────────────────────────
export async function createDispo({ moniteurId, monNom, dateIso, h, dur, lieu = null }) {
  // R1 chevauchement
  const r1 = await checkChevauchement({ moniteurId, dateIso, h, dur });
  if (!r1.ok) return { ok: false, errors: r1.errors };

  // Calcul jour de la semaine (1=lun..7=dim)
  const d = new Date(dateIso + 'T00:00:00');
  const dow = ((d.getDay() + 6) % 7) + 1;

  const { data, error } = await sb.from('events').insert({
    moniteur_id: moniteurId,
    mon_nom: monNom,
    h, d: dow, dur, lieu,
    t: STATUTS.DISPO,
    date_event: dateIso,
    is_deleted: false,
  }).select().maybeSingle();

  if (error) return { ok: false, errors: [error.message] };
  return { ok: true, data };
}

// ─── W1 — Création d'une leçon ─────────────────────────────────────────
/**
 * Crée la leçon avec validations. `override = true` permet de passer outre R5 (limite jour).
 */
export async function createLecon({ moniteurId, monNom, eleveId, eleveNom, dateIso, h, dur, lieu, override = false }) {
  const v = await validateLecon({ moniteurId, eleveId, dateIso, h, dur, lieu });

  if (!v.ok && !override) return { ok: false, errors: v.errors, warnings: v.warnings };

  const numero = await getNumeroHeureSuivant(eleveId);
  const d = new Date(dateIso + 'T00:00:00');
  const dow = ((d.getDay() + 6) % 7) + 1;

  const { data, error } = await sb.from('events').insert({
    moniteur_id: moniteurId,
    mon_nom: monNom,
    eleve_id: eleveId,
    n: eleveNom,
    h, d: dow, dur, lieu,
    t: STATUTS.LECON_CONFIRMEE,
    date_event: dateIso,
    numero_heure_eleve: numero,
    is_deleted: false,
    livret_rempli: false,
  }).select().maybeSingle();

  if (error) return { ok: false, errors: [error.message], warnings: v.warnings };
  return { ok: true, data, warnings: v.warnings, numero };
}

// ─── W3 — Annulation d'une leçon ───────────────────────────────────────
/**
 * @param garderDispo : true → le créneau redevient 'dispo' ; false → soft delete
 */
export async function cancelLecon({ leconId, motif, message = null, garderDispo = false }) {
  if (!motif || !MOTIFS_ANNULATION.includes(motif)) {
    return { ok: false, errors: ['Motif d\'annulation obligatoire (enum non valide).'] };
  }
  if (motif === 'Autre' && !message) {
    return { ok: false, errors: ['Message obligatoire quand le motif est "Autre".'] };
  }

  // Récupère la leçon
  const { data: lec } = await sb.from('events').select('*').eq('id', leconId).maybeSingle();
  if (!lec) return { ok: false, errors: ['Leçon introuvable.'] };

  const preavis = checkPreavisAnnulation({ dateEvent: lec.date_event, h: lec.h });

  if (garderDispo) {
    // Le créneau redevient dispo
    const { error } = await sb.from('events').update({
      t: STATUTS.DISPO,
      eleve_id: null,
      n: null,
      motif_annulation: motif,
      message_eleve: message,
      numero_heure_eleve: null,
    }).eq('id', leconId);
    if (error) return { ok: false, errors: [error.message] };
  } else {
    // Soft delete + trace du motif
    const { error } = await sb.from('events').update({
      is_deleted: true,
      motif_annulation: motif,
      message_eleve: message,
    }).eq('id', leconId);
    if (error) return { ok: false, errors: [error.message] };
  }

  return { ok: true, preavis, data: lec };
}

// ─── W2 — Modification d'une leçon ─────────────────────────────────────
export async function modifyLecon({ leconId, changes }) {
  // changes peut contenir : dateIso, h, dur, lieu
  const { data: lec } = await sb.from('events').select('*').eq('id', leconId).maybeSingle();
  if (!lec) return { ok: false, errors: ['Leçon introuvable.'] };

  const nextDate = changes.dateIso || lec.date_event;
  const nextH = changes.h || lec.h;
  const nextDur = changes.dur !== undefined ? changes.dur : lec.dur;
  const nextLieu = changes.lieu !== undefined ? changes.lieu : lec.lieu;

  // Valide (en excluant l'event lui-même du check chevauchement)
  const r1 = await checkChevauchement({
    moniteurId: lec.moniteur_id, dateIso: nextDate, h: nextH, dur: nextDur,
    excludeEventId: leconId,
  });
  if (!r1.ok) return { ok: false, errors: r1.errors };

  const r5 = await checkLimiteJour({
    moniteurId: lec.moniteur_id, dateIso: nextDate, dur: nextDur, excludeEventId: leconId,
  });
  if (!r5.ok) return { ok: false, errors: r5.errors };

  const r4 = await checkBufferTrajet({
    moniteurId: lec.moniteur_id, dateIso: nextDate, h: nextH, dur: nextDur, lieu: nextLieu,
    excludeEventId: leconId,
  });

  const dow = ((new Date(nextDate + 'T00:00:00').getDay() + 6) % 7) + 1;

  const { error } = await sb.from('events').update({
    date_event: nextDate, h: nextH, dur: nextDur, lieu: nextLieu, d: dow,
  }).eq('id', leconId);
  if (error) return { ok: false, errors: [error.message] };

  return { ok: true, warnings: r4.warnings };
}

// ─── W4 — Confirmation côté moniteur (passe pend → conf) ───────────────
export async function confirmLecon({ leconId }) {
  const { error } = await sb.from('events').update({ t: STATUTS.LECON_CONFIRMEE }).eq('id', leconId);
  if (error) return { ok: false, errors: [error.message] };
  return { ok: true };
}

// ─── W5 — Marquer livret rempli ────────────────────────────────────────
export async function markLivretFilled({ leconId, competencesPct = null }) {
  const update = { livret_rempli: true };
  if (competencesPct !== null) update.competences_acquises_pct = competencesPct;
  const { error } = await sb.from('events').update(update).eq('id', leconId);
  if (error) return { ok: false, errors: [error.message] };
  return { ok: true };
}
