/**
 * Geo-tracking — capture départ/arrivée d'une leçon.
 *
 * Pas de tracking en continu (RGPD-friendly + inutile).
 * 2 captures : "Démarrer leçon" → enregistre lat/lng + heure réelle
 *              "Terminer leçon"  → enregistre lat/lng + heure + calcule distance
 *
 * Distance estimée = haversine × 1.4 (facteur urbain, route ≠ ligne droite).
 *
 * Usage :
 *   import { startLecon, endLecon } from '@/services/geo-tracking.js';
 *   const result = await startLecon({ eventId });
 *   // ... leçon en cours ...
 *   const stats = await endLecon({ eventId });
 *   // → { distanceKm, dureeReelleMin, startedAt, endedAt }
 */

import { sb } from '@/auth/auth.js';

const URBAN_FACTOR = 1.4;

/** Promise wrapper pour navigator.geolocation. */
function getPosition(opts = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000, ...opts }
    );
  });
}

/** Haversine en km entre 2 coordonnées. */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Démarre une leçon : capture lat/lng + timestamp.
 * Si géoloc refusée → enregistre quand même started_at (sans coords).
 * @returns { ok, startedAt, lat?, lng?, error? }
 */
export async function startLecon({ eventId }) {
  if (!eventId) return { ok: false, error: 'eventId manquant' };

  let coords = null;
  try {
    const pos = await getPosition();
    coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch (err) {
    // OK si l'user refuse — on enregistre l'heure quand même
    console.warn('[geo] start sans coords', err.message);
  }

  const startedAt = new Date().toISOString();
  const updates = { started_at: startedAt };
  if (coords) {
    updates.start_lat = coords.lat;
    updates.start_lng = coords.lng;
  }

  const { error } = await sb.from('events').update(updates).eq('id', eventId);
  if (error) return { ok: false, error: error.message };

  return { ok: true, startedAt, ...coords };
}

/**
 * Termine une leçon : capture lat/lng + timestamp + calcule distance/durée.
 * @returns { ok, endedAt, distanceKm, dureeReelleMin, lat?, lng?, error? }
 */
export async function endLecon({ eventId }) {
  if (!eventId) return { ok: false, error: 'eventId manquant' };

  // Récupère start data
  const { data: ev } = await sb.from('events').select('started_at, start_lat, start_lng').eq('id', eventId).maybeSingle();
  if (!ev) return { ok: false, error: 'Leçon introuvable' };
  if (!ev.started_at) return { ok: false, error: 'Leçon pas encore démarrée' };

  let coords = null;
  try {
    const pos = await getPosition();
    coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch (err) {
    console.warn('[geo] end sans coords', err.message);
  }

  const endedAt = new Date().toISOString();
  const dureeReelleMin = Math.max(1, Math.round((new Date(endedAt) - new Date(ev.started_at)) / 60000));

  let distanceKm = null;
  if (coords && ev.start_lat != null && ev.start_lng != null) {
    distanceKm = Math.round(haversineKm(ev.start_lat, ev.start_lng, coords.lat, coords.lng) * URBAN_FACTOR * 10) / 10;
  }

  const updates = { ended_at: endedAt, duree_reelle_min: dureeReelleMin };
  if (coords) {
    updates.end_lat = coords.lat;
    updates.end_lng = coords.lng;
  }
  if (distanceKm !== null) updates.distance_km = distanceKm;

  const { error } = await sb.from('events').update(updates).eq('id', eventId);
  if (error) return { ok: false, error: error.message };

  return { ok: true, endedAt, dureeReelleMin, distanceKm, ...coords };
}

/** Vrai si la leçon a été démarrée et pas encore terminée. */
export function isActive(ev) {
  return !!ev?.started_at && !ev?.ended_at;
}
