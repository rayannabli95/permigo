/**
 * Rate Limiter client-side (localStorage).
 *
 * Note : c'est une protection front PURE (anti-brute force user). La vraie
 * protection est côté Supabase (Auth → Rate Limits + Turnstile en preflight).
 * Ici on évite juste de bombarder l'API si l'user est trop agressif.
 *
 * Usage :
 *   import { checkRateLimit, recordAttempt } from '@/utils/rate-limit.js';
 *   const rl = checkRateLimit('login', email, 5, 5 * 60_000);
 *   if (!rl.allowed) return toast(`Trop d'essais — réessaye dans ${rl.wait}s`);
 *   recordAttempt('login', email);
 *   // ... appel auth ...
 *   if (success) resetRateLimit('login', email);
 */

const PREFIX = 'permigo-rl';

function load(action, key) {
  try {
    return JSON.parse(localStorage.getItem(`${PREFIX}-${action}-${key}`) || '[]');
  } catch {
    return [];
  }
}

function save(action, key, attempts) {
  try {
    localStorage.setItem(`${PREFIX}-${action}-${key}`, JSON.stringify(attempts));
  } catch {}
}

/**
 * Vérifie si une action est autorisée pour une clé donnée.
 * @param {string} action - nom de l'action (ex: 'login', 'signup', 'otp')
 * @param {string} key    - identifiant (email, ip, ...)
 * @param {number} max    - max tentatives dans la fenêtre
 * @param {number} windowMs - fenêtre en ms
 * @returns {{allowed:boolean, remaining:number, wait?:number}}
 */
export function checkRateLimit(action, key, max = 5, windowMs = 5 * 60 * 1000) {
  if (!key) return { allowed: true, remaining: max };
  const now = Date.now();
  const attempts = load(action, key.toLowerCase()).filter(t => now - t < windowMs);
  save(action, key.toLowerCase(), attempts);
  if (attempts.length >= max) {
    const oldest = Math.min(...attempts);
    const wait = Math.ceil((windowMs - (now - oldest)) / 1000);
    return { allowed: false, remaining: 0, wait };
  }
  return { allowed: true, remaining: max - attempts.length };
}

/** Enregistre une tentative. */
export function recordAttempt(action, key, windowMs = 5 * 60 * 1000) {
  if (!key) return;
  const now = Date.now();
  const attempts = load(action, key.toLowerCase()).filter(t => now - t < windowMs);
  attempts.push(now);
  save(action, key.toLowerCase(), attempts);
}

/** Reset le compteur (après succès). */
export function resetRateLimit(action, key) {
  if (!key) return;
  try {
    localStorage.removeItem(`${PREFIX}-${action}-${key.toLowerCase()}`);
  } catch {}
}

/** Format humain pour le temps restant. */
export function formatWaitTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}
