/**
 * Toast notifications — affichage éphémère bas d'écran.
 * Remplace `alert()` / `confirm()` (BUG-M-01 du rapport QA).
 *
 * A11y :
 *  - Région ARIA-live (polite pour info/success, assertive pour error)
 *  - role="status" pour info/success, role="alert" pour error
 *  - Bouton fermeture visible accessible au clavier
 *  - Auto-dismiss après `duration` (annulable au focus, idée future)
 *
 * @example
 *   import { toast } from '@/components/toast.js';
 *   toast('Leçon créée ✅');
 *   toast('Erreur réseau', 'error');
 */

import { esc } from '../utils/escape.js';

const ROOT_ID = 'toast-root';

function ensureRoot() {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    // Conteneur transparent — chaque toast a son propre live region
    document.body.appendChild(root);
  }
  return root;
}

export function toast(msg, type = 'info', duration = 3000) {
  const root = ensureRoot();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;

  // Sémantique ARIA selon la gravité
  if (type === 'error') {
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
  } else {
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
  }
  el.setAttribute('aria-atomic', 'true');

  el.innerHTML = `
    <span class="toast-msg">${esc(msg)}</span>
    <button class="toast-close" type="button" aria-label="Fermer la notification">×</button>
  `;
  root.appendChild(el);

  const dismiss = () => {
    el.classList.remove('on');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  };

  el.querySelector('.toast-close')?.addEventListener('click', dismiss);

  // Force layout puis trigger anim
  requestAnimationFrame(() => el.classList.add('on'));

  setTimeout(dismiss, duration);
}
