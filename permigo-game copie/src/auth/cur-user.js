/**
 * État global du profil connecté.
 * Tous les modules importent CUR_USER pour savoir qui est connecté.
 *
 * Pattern observer simple — on s'abonne via `onUserChange()`.
 */

/** @type {{id: string, role: string, nom: string, email: string} | null} */
let _curUser = null;
const _listeners = new Set();

export function getCurUser() {
  return _curUser;
}

export function setCurUser(user) {
  _curUser = user;
  // Mirror sur window pour compat avec legacy/inspections devtools
  if (typeof window !== 'undefined') window.CUR_USER = user;
  _listeners.forEach(fn => {
    try { fn(user); } catch (e) { console.error('[cur-user] listener error', e); }
  });
}

/**
 * @param {(user: object | null) => void} fn
 * @returns unsubscribe function
 */
export function onUserChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
