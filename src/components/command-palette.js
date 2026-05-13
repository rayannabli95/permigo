/**
 * Command Palette (Cmd+K) — recherche globale style Linear / Notion.
 *
 * Pour le moniteur (et admin) : ouvre une modal avec un input + résultats live.
 * - Élèves (filtré sur ses élèves uniques pour le moniteur, tous pour l'admin)
 * - Pages de navigation (Planning, Mes élèves, Avis...)
 * - Actions rapides (Nouvelle leçon, Évaluer la dernière leçon...)
 *
 * Raccourcis :
 *   Cmd+K / Ctrl+K / `/`  → ouvrir
 *   ↑ ↓                    → naviguer
 *   ↵                      → activer
 *   Esc                    → fermer
 *
 * Usage :
 *   import { mountCommandPalette, openCommandPalette } from '@/components/command-palette.js';
 *   mountCommandPalette();  // appelé une fois après login (depuis main.js)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';

let _host = null;
let _query = '';
let _selectedIdx = 0;
let _results = [];
let _eleves = [];
let _navItems = [];
let _onKeyDown = null;

const ROLE_PAGES = {
  eleve: [
    { icon: '🏠', label: 'Accueil', path: '/accueil' },
    { icon: '🗺️', label: 'Mon parcours', path: '/parcours' },
    { icon: '📅', label: 'Réserver une leçon', path: '/reservation' },
    { icon: '🏆', label: 'Mes trophées', path: '/trophees' },
    { icon: '👤', label: 'Mon profil', path: '/profil' },
  ],
  moniteur: [
    { icon: '📅', label: 'Mon planning', path: '/planning' },
    { icon: '👥', label: 'Mes élèves', path: '/mes-eleves' },
    { icon: '⭐', label: 'Mes avis', path: '/avis' },
    { icon: '👤', label: 'Mon profil', path: '/profil' },
  ],
  admin: [
    { icon: '📊', label: 'Tableau de bord', path: '/dashboard' },
    { icon: '📅', label: 'Calendrier global', path: '/calendrier' },
    { icon: '🎓', label: 'Gérer les élèves', path: '/eleves' },
    { icon: '👨‍🏫', label: 'Gérer l\'équipe', path: '/equipe' },
    { icon: '👤', label: 'Mon profil', path: '/profil' },
  ],
};

let _fab = null;

export function mountCommandPalette() {
  // 1 seul handler global
  if (_onKeyDown) return;
  _onKeyDown = (e) => {
    const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    const isSlash = e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    if (isCmdK || isSlash) {
      e.preventDefault();
      openCommandPalette();
    }
  };
  document.addEventListener('keydown', _onKeyDown);

  // ─── FAB flottant pour mobile (et desktop, par redondance) ───
  if (!_fab) {
    _fab = document.createElement('button');
    _fab.type = 'button';
    _fab.id = 'cmd-fab';
    _fab.setAttribute('aria-label', 'Recherche rapide');
    _fab.setAttribute('title', 'Recherche (⌘K)');
    _fab.innerHTML = '🔍';
    _fab.addEventListener('click', () => openCommandPalette());
    document.body.appendChild(_fab);

    const style = document.createElement('style');
    style.id = 'cmd-fab-styles';
    style.textContent = `
      #cmd-fab{
        position:fixed;
        right:18px;
        bottom:calc(78px + env(safe-area-inset-bottom));
        width:52px;height:52px;
        border-radius:50%;
        background:linear-gradient(135deg,#6366f1,#8b5cf6);
        color:#fff;border:0;
        font-size:22px;cursor:pointer;
        box-shadow:0 8px 24px -6px rgba(99,102,241,.55),0 0 0 1px rgba(255,255,255,.1);
        display:flex;align-items:center;justify-content:center;
        z-index:60;
        font-family:inherit;
        transition:transform .18s cubic-bezier(.5,1.6,.4,1),box-shadow .2s;
        animation:cmd-fab-in .35s cubic-bezier(.5,1.6,.4,1) both;
      }
      @keyframes cmd-fab-in{from{opacity:0;transform:scale(.4) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
      #cmd-fab:hover{transform:translateY(-3px) scale(1.06);box-shadow:0 14px 32px -6px rgba(99,102,241,.7)}
      #cmd-fab:active{transform:scale(.92)}
      #cmd-fab:focus-visible{outline:none;box-shadow:0 8px 24px -6px rgba(99,102,241,.55),0 0 0 3px rgba(99,102,241,.4)}
      /* Au-dessus de la nav bottom sur mobile, position fixe sur desktop */
      @media (min-width:920px){#cmd-fab{bottom:24px}}
    `;
    document.head.appendChild(style);
  }
}

export function unmountCommandPalette() {
  if (_onKeyDown) {
    document.removeEventListener('keydown', _onKeyDown);
    _onKeyDown = null;
  }
  if (_host) { _host.remove(); _host = null; }
  if (_fab) { _fab.remove(); _fab = null; }
}

export async function openCommandPalette() {
  if (_host) return; // déjà ouvert
  const me = getCurUser();
  if (!me) return;

  // Cache le FAB pendant que la palette est ouverte
  if (_fab) _fab.style.display = 'none';

  _query = '';
  _selectedIdx = 0;
  _navItems = ROLE_PAGES[me.role] || [];

  // Précharger les élèves accessibles (admin = tous, moniteur = ses élèves uniques, élève = lui seul)
  if (me.role === 'admin') {
    const { data } = await sb.from('profiles').select('id, nom, email').eq('role', 'eleve').order('nom');
    _eleves = data || [];
  } else if (me.role === 'moniteur') {
    // Élèves uniques que le moniteur a eu en leçon
    const { data: evts } = await sb.from('events').select('eleve_id').eq('moniteur_id', me.id).eq('is_deleted', false);
    const ids = [...new Set((evts || []).map(e => e.eleve_id).filter(Boolean))];
    if (ids.length) {
      const { data } = await sb.from('profiles').select('id, nom, email').in('id', ids).order('nom');
      _eleves = data || [];
    } else _eleves = [];
  } else {
    _eleves = [];
  }

  _host = document.createElement('div');
  _host.className = 'cmd-bg';
  _host.innerHTML = `
    <style>
      .cmd-bg{position:fixed;inset:0;background:rgba(11,13,26,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:14vh 14px 14px;z-index:200;animation:cmdFade .15s ease}
      @keyframes cmdFade{from{opacity:0}to{opacity:1}}
      .cmd-panel{background:var(--su);width:100%;max-width:540px;border-radius:14px;box-shadow:0 24px 60px -16px rgba(0,0,0,.5);overflow:hidden;border:1px solid var(--bo);animation:cmdSlide .2s cubic-bezier(.2,.7,.3,1)}
      @keyframes cmdSlide{from{transform:translateY(-12px);opacity:0}to{transform:translateY(0);opacity:1}}
      .cmd-input-wrap{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--bo2)}
      .cmd-input-wrap .ic{color:var(--mu);font-size:16px;flex-shrink:0}
      .cmd-input{flex:1;border:0;background:transparent;font-size:15px;color:var(--ink);font-family:inherit;outline:none;font-weight:500}
      .cmd-input::placeholder{color:var(--mu)}
      .cmd-kbd{font-family:var(--fn);font-size:10px;font-weight:800;color:var(--mu);background:var(--bg2);border:1px solid var(--bo);padding:3px 6px;border-radius:5px;letter-spacing:.3px}
      .cmd-list{max-height:50vh;overflow:auto;padding:6px}
      .cmd-section{font-family:var(--fn);font-size:10px;font-weight:800;color:var(--mu2);letter-spacing:1.5px;padding:10px 12px 6px;text-transform:uppercase}
      .cmd-item{display:flex;align-items:center;gap:12px;padding:12px;border-radius:8px;cursor:pointer;transition:background .1s;min-height:48px}
      .cmd-item:hover,.cmd-item.sel{background:var(--ap)}
      .cmd-item .em{width:28px;height:28px;border-radius:7px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
      .cmd-item.sel .em{background:var(--a);color:#fff}
      .cmd-item .body{flex:1;min-width:0}
      .cmd-item .nm{font-size:13.5px;font-weight:600;color:var(--ink);line-height:1.2}
      .cmd-item .meta{font-size:11px;color:var(--mu);margin-top:1px}
      .cmd-item .arr{color:var(--mu2);font-size:14px;font-weight:700}
      .cmd-item.sel .arr{color:var(--a)}
      .cmd-empty{padding:32px 16px;text-align:center;color:var(--mu);font-size:13px}
      .cmd-footer{display:flex;align-items:center;gap:12px;padding:9px 14px;border-top:1px solid var(--bo2);background:var(--bg2);font-size:10.5px;color:var(--mu);font-weight:600}
      .cmd-footer .sp{flex:1}
    </style>
    <div class="cmd-panel" role="dialog" aria-modal="true" aria-label="Recherche rapide">
      <div class="cmd-input-wrap">
        <span class="ic" aria-hidden="true">🔍</span>
        <input class="cmd-input" id="cmd-input" type="text" placeholder="Rechercher un élève, une page, une action…" autocomplete="off" autofocus>
        <span class="cmd-kbd">ESC</span>
      </div>
      <div class="cmd-list" id="cmd-list" role="listbox"></div>
      <div class="cmd-footer">
        <span><span class="cmd-kbd">↑↓</span> naviguer</span>
        <span><span class="cmd-kbd">↵</span> ouvrir</span>
        <span class="sp"></span>
        <span><span class="cmd-kbd">⌘K</span> /  <span class="cmd-kbd">/</span></span>
      </div>
    </div>
  `;
  document.body.appendChild(_host);

  const input = _host.querySelector('#cmd-input');
  const list = _host.querySelector('#cmd-list');

  renderResults();
  input.focus();

  input.addEventListener('input', () => {
    _query = input.value;
    _selectedIdx = 0;
    renderResults();
  });

  _host.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _selectedIdx = Math.min(_selectedIdx + 1, _results.length - 1);
      repaintSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _selectedIdx = Math.max(_selectedIdx - 1, 0);
      repaintSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(_results[_selectedIdx]);
    }
  });

  _host.addEventListener('click', (e) => {
    if (e.target === _host) close();
  });
}

function close() {
  if (_host) { _host.remove(); _host = null; }
  // Réaffiche le FAB
  if (_fab) _fab.style.display = '';
}

function renderResults() {
  const q = _query.trim().toLowerCase();
  const list = _host.querySelector('#cmd-list');
  _results = [];

  // 1. Pages
  const pages = _navItems
    .filter(p => !q || p.label.toLowerCase().includes(q))
    .map(p => ({ type: 'page', ...p }));

  // 2. Élèves
  const eleves = _eleves
    .filter(e => !q || (e.nom || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q))
    .slice(0, 8)
    .map(e => ({ type: 'eleve', ...e }));

  // 3. Actions rapides
  const me = getCurUser();
  const actions = [];
  if (me?.role === 'moniteur') {
    actions.push({ type: 'action', id: 'new-dispo', icon: '➕', label: 'Créer une dispo', meta: 'Va dans le planning' });
    actions.push({ type: 'action', id: 'new-lecon', icon: '🚗', label: 'Programmer une leçon', meta: 'Va dans le planning' });
  } else if (me?.role === 'admin') {
    actions.push({ type: 'action', id: 'new-eleve', icon: '🎓', label: 'Ajouter un élève', meta: 'Création de compte' });
    actions.push({ type: 'action', id: 'new-moniteur', icon: '👨‍🏫', label: 'Ajouter un enseignant', meta: 'Création de compte' });
  }
  const filteredActions = actions.filter(a => !q || a.label.toLowerCase().includes(q));

  _results = [...pages, ...eleves, ...filteredActions];
  if (_selectedIdx >= _results.length) _selectedIdx = 0;

  if (_results.length === 0) {
    list.innerHTML = `<div class="cmd-empty">Aucun résultat pour "<b>${esc(q)}</b>"</div>`;
    return;
  }

  let html = '';
  if (pages.length) {
    html += `<div class="cmd-section">Navigation</div>`;
    pages.forEach((p, i) => html += renderItem(p, _results.indexOf(p)));
  }
  if (eleves.length) {
    html += `<div class="cmd-section">Élèves (${eleves.length})</div>`;
    eleves.forEach((e) => html += renderItem(e, _results.indexOf(e)));
  }
  if (filteredActions.length) {
    html += `<div class="cmd-section">Actions rapides</div>`;
    filteredActions.forEach((a) => html += renderItem(a, _results.indexOf(a)));
  }
  list.innerHTML = html;

  // Wire clicks
  list.querySelectorAll('.cmd-item').forEach(it => {
    it.addEventListener('click', () => {
      const idx = parseInt(it.dataset.idx, 10);
      activate(_results[idx]);
    });
    it.addEventListener('mouseenter', () => {
      const idx = parseInt(it.dataset.idx, 10);
      _selectedIdx = idx;
      repaintSelection();
    });
  });
}

function renderItem(r, idx) {
  if (r.type === 'page') {
    return `
      <div class="cmd-item ${idx === _selectedIdx ? 'sel' : ''}" data-idx="${idx}" role="option">
        <div class="em">${r.icon}</div>
        <div class="body"><div class="nm">${esc(r.label)}</div></div>
        <div class="arr">›</div>
      </div>`;
  }
  if (r.type === 'eleve') {
    const init = (r.nom || '?').split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
    return `
      <div class="cmd-item ${idx === _selectedIdx ? 'sel' : ''}" data-idx="${idx}" role="option">
        <div class="em" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-family:var(--fd);font-weight:800;font-size:11px">${esc(init)}</div>
        <div class="body">
          <div class="nm">${esc(r.nom || '—')}</div>
          <div class="meta">${esc(r.email || '')}</div>
        </div>
        <div class="arr">›</div>
      </div>`;
  }
  if (r.type === 'action') {
    return `
      <div class="cmd-item ${idx === _selectedIdx ? 'sel' : ''}" data-idx="${idx}" role="option">
        <div class="em">${r.icon}</div>
        <div class="body">
          <div class="nm">${esc(r.label)}</div>
          <div class="meta">${esc(r.meta)}</div>
        </div>
        <div class="arr">›</div>
      </div>`;
  }
  return '';
}

function repaintSelection() {
  const list = _host?.querySelector('#cmd-list');
  if (!list) return;
  list.querySelectorAll('.cmd-item').forEach((it, i) => {
    const idx = parseInt(it.dataset.idx, 10);
    it.classList.toggle('sel', idx === _selectedIdx);
  });
  // Scroll dans la vue si nécessaire
  const sel = list.querySelector('.cmd-item.sel');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

async function activate(r) {
  if (!r) return;
  close();
  const { navigate } = await import('@/router.js');

  if (r.type === 'page') {
    navigate(r.path);
  } else if (r.type === 'eleve') {
    const me = getCurUser();
    if (me.role === 'moniteur') navigate('/fiche-eleve', { id: r.id });
    else if (me.role === 'admin') navigate('/eleves'); // pour l'instant retourne à la liste
    else navigate('/');
  } else if (r.type === 'action') {
    if (r.id === 'new-dispo' || r.id === 'new-lecon') {
      navigate('/planning');
    } else if (r.id === 'new-eleve' || r.id === 'new-moniteur') {
      navigate(r.id === 'new-moniteur' ? '/equipe' : '/eleves');
    }
  }
}
