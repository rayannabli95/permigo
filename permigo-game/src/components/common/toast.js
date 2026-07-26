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
 *   import { toast } from '@/components/common/toast.js';
 *   toast('Leçon créée ✅');
 *   toast('Erreur réseau', 'error');
 */

import { esc } from '@/utils/escape.js';

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

  let removed = false;
  const remove = () => { if (!removed) { removed = true; el.remove(); } };
  const dismiss = () => {
    el.classList.remove('on');
    el.addEventListener('transitionend', remove, { once: true });
    // Fallback : si transitionend ne se déclenche jamais (reduced-motion,
    // élément déjà hors transition), on force la suppression.
    setTimeout(remove, 400);
  };

  el.querySelector('.toast-close')?.addEventListener('click', dismiss);

  // Force layout puis trigger anim
  requestAnimationFrame(() => el.classList.add('on'));

  setTimeout(dismiss, duration);
}

/**
 * Toast riche avec avatar (initiales) — pour validations enseignant.
 * @param {{title: string, sub?: string, initials?: string, color?: string, type?: 'success'|'info'|'error', duration?: number}} opts
 */
export function toastAvatar({ title, sub = '', initials = '?', color = 'var(--a)', type = 'success', duration = 3500 }) {
  const root = ensureRoot();
  const el = document.createElement('div');
  el.className = `toast toast-${type} toast-rich`;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');

  el.innerHTML = `
    <style>
      .toast-rich {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px !important;
        background: var(--su) !important;
        border: 1px solid var(--bo) !important;
        box-shadow: 0 12px 32px -8px rgba(10,13,26,.18) !important;
        min-width: 260px;
        max-width: 90vw;
      }
      .toast-rich .ta-av {
        width: 36px; height: 36px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
        color: #fff;
        flex-shrink: 0;
      }
      .toast-rich .ta-body { flex: 1; min-width: 0; }
      .toast-rich .ta-title {
        font: 600 13.5px/1.3 'Inter', sans-serif;
        color: var(--ink);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .toast-rich .ta-sub {
        font: 500 11.5px/1.2 'Inter', sans-serif;
        color: var(--mu2);
        margin-top: 2px;
      }
      .toast-rich .ta-check {
        width: 22px; height: 22px;
        border-radius: 50%;
        background: var(--grdk);
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        font: 700 14px/1 'Inter', sans-serif;
        flex-shrink: 0;
      }
    </style>
    <div class="ta-av" style="background:${esc(color)}">${esc(initials)}</div>
    <div class="ta-body">
      <div class="ta-title">${esc(title)}</div>
      ${sub ? `<div class="ta-sub">${esc(sub)}</div>` : ''}
    </div>
    ${type === 'success' ? `<div class="ta-check">✓</div>` : ''}
  `;
  root.appendChild(el);

  let removed = false;
  const remove = () => { if (!removed) { removed = true; el.remove(); } };
  const dismiss = () => {
    el.classList.remove('on');
    el.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 400);
  };

  el.addEventListener('click', dismiss);

  requestAnimationFrame(() => el.classList.add('on'));
  setTimeout(dismiss, duration);
}
