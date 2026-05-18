// ═══════════════════════════════════════════════════════════════
// Theme — gestion light / dark / auto
// Usage :
//   import { applyTheme, syncFromPrefs } from '@/utils/theme.js';
//   await syncFromPrefs();      // à l'init, après login
//   applyTheme('dark');         // depuis les Settings
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'permigo_theme';

// ─── Apply ────────────────────────────────────────────────────
export function applyTheme(mode) {
  const html = document.documentElement;
  html.removeAttribute('data-theme');

  if (mode === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else if (mode === 'light') {
    html.setAttribute('data-theme', 'light');
  }
  // 'auto' : on retire l'attribut → la @media prefers-color-scheme prend le relais

  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* private mode */ }
}

// ─── Current ──────────────────────────────────────────────────
export function getTheme() {
  try { return localStorage.getItem(STORAGE_KEY) || 'auto'; } catch { return 'auto'; }
}

// ─── System listener (pour 'auto') ────────────────────────────
let _mql = null;
let _mqlListener = null;

export function listenSystem() {
  if (!window.matchMedia) return;

  _mql = window.matchMedia('(prefers-color-scheme: dark)');
  _mqlListener = () => {
    if (getTheme() === 'auto') applyTheme('auto');
  };
  _mql.addEventListener('change', _mqlListener);
}

export function unlistenSystem() {
  if (_mql && _mqlListener) {
    _mql.removeEventListener('change', _mqlListener);
    _mql = null;
    _mqlListener = null;
  }
}

// ─── Sync depuis les préférences backend ───────────────────────
export async function syncFromPrefs(sb) {
  try {
    const { data } = await sb.rpc('get_my_preferences');
    const mode = data?.theme;
    if (mode === 'light' || mode === 'dark' || mode === 'auto') {
      applyTheme(mode);
    } else {
      // Fallback sur localStorage
      applyTheme(getTheme());
    }
  } catch {
    applyTheme(getTheme());
  }
}

// ─── Init rapide (avant auth — lit localStorage) ─────────────
export function initThemeEarly() {
  applyTheme(getTheme());
  listenSystem();
}
