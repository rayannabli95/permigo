/**
 * Page Mes Élèves (moniteur) — design inspiré du screen 1 du handoff (moniteur-v4).
 *
 * - Liste verticale des élèves
 * - Avatar avec initiales gradient
 * - Progression REMC (barre + n/31)
 * - Volume heures (X/Yh)
 * - Tab segmenté Tous / Actifs / Inactifs
 * - Recherche par nom
 *
 * Branché sur Supabase :
 *  - profiles (role=eleve)
 *  - remc_entries (pour calculer la progression de chaque élève)
 *  - events (pour les heures effectuées)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { REMC_TOTAL } from '@/data/remc.js';
import { mountNotifBell } from '@/components/notif-bell.js';

const AVATARS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,#0891b2,#155e75)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
  'linear-gradient(135deg,#0e7c66,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#a16207,#713f12)',
  'linear-gradient(135deg,#dc2626,#7f1d1d)',
  'linear-gradient(135deg,#059669,#064e3b)',
];

let ELEVES = []; // cache
let FILTER = 'all'; // all|active|inactive
let SEARCH = '';

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  root.innerHTML = renderShell();

  // Fetch
  const { data: profiles, error } = await sb.from('profiles')
    .select('id, nom, email, statut, code_statut, forfait_h, avatar_url')
    .eq('role', 'eleve');

  if (error) { console.warn('[mes-eleves]', error); toast('Erreur DB', 'error'); }
  ELEVES = profiles || [];

  // Enrichir avec REMC + heures (parallel)
  await Promise.all(ELEVES.map(async (e) => {
    const [remcRes, evtsRes] = await Promise.allSettled([
      sb.from('remc_entries').select('lv').eq('eleve_id', e.id),
      sb.from('events').select('dur, t').eq('eleve_id', e.id).eq('is_deleted', false),
    ]);
    const remc = (remcRes.value?.data) || [];
    const evts = (evtsRes.value?.data) || [];
    e._validated = remc.filter(r => r.lv === 'v').length;
    e._heures = evts.filter(x => x.t === 'conf' || x.t === 'lecon').reduce((s, x) => s + (x.dur || 1), 0);
    e._pct = Math.round((e._validated / REMC_TOTAL) * 100);
  }));

  renderList(root);
  wire(root);
}

function renderShell() {
  return `
    <style>
      .me-wrap{max-width:560px;margin:0 auto;padding:14px}
      .me-top{display:flex;align-items:center;gap:10px;padding:6px 4px 14px}
      .me-back{width:34px;height:34px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer}
      .me-top .ttl{font-family:var(--fd);font-weight:800;font-size:20px;letter-spacing:-.02em}
      .me-top .sub{font-size:11px;color:var(--mu);margin-top:2px}
      .me-search{margin:0 0 10px;padding:10px 12px;background:var(--su);border:1px solid var(--bo);border-radius:10px;display:flex;align-items:center;gap:8px;color:var(--mu);font-size:13px;box-shadow:var(--s0)}
      .me-search input{flex:1;border:0;outline:0;background:transparent;color:var(--ink);font-size:13px;font-family:var(--fb)}
      .me-tabs{margin:0 0 12px;padding:3px;background:var(--bg2);border-radius:9px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px}
      .me-tab{padding:7px 0;text-align:center;font-size:12px;font-weight:600;color:var(--mu);border-radius:7px;cursor:pointer;transition:.15s;border:0;background:transparent;font-family:inherit;outline:none}
      .me-tab:focus-visible{box-shadow:0 0 0 2px var(--a);color:var(--ink)}
      .me-tab.on{background:var(--su);color:var(--ink);font-weight:700;box-shadow:var(--s0)}
      .me-list{display:flex;flex-direction:column;gap:8px}
      .me-row{background:var(--su);border:1px solid var(--bo);border-radius:12px;padding:11px 13px;display:flex;align-items:center;gap:11px;box-shadow:var(--s0);transition:transform .2s cubic-bezier(.2,.7,.3,1),border-color .15s,box-shadow .25s;cursor:pointer;will-change:transform;outline:none;width:100%;text-align:left;font-family:inherit;color:inherit}
      .me-row:hover,.me-row:focus-visible{border-color:var(--ap);box-shadow:0 12px 28px -10px rgba(11,13,26,.2);transform:translateY(-2px)}
      .me-row:focus-visible{box-shadow:0 0 0 3px var(--ap),0 12px 28px -10px rgba(11,13,26,.2)}
      .me-av{width:42px;height:42px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;font-family:var(--fd);flex-shrink:0;overflow:hidden;position:relative}
      .me-av img{width:100%;height:100%;object-fit:cover;display:block}
      .me-av .me-av-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
      .me-body{flex:1;min-width:0}
      .me-nm{font-family:var(--fd);font-weight:700;font-size:14px;letter-spacing:-.005em;line-height:1.2;display:flex;align-items:center;gap:6px}
      .me-stt{font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px}
      .me-stt.actif{background:var(--grp);color:var(--gr)}
      .me-stt.inactif{background:var(--rdp);color:var(--rd)}
      .me-fft-badge{display:inline-flex;align-items:center;gap:3px;font-family:var(--fn);font-size:9.5px;font-weight:900;padding:2px 6px;border-radius:99px;letter-spacing:.2px;margin-left:3px}
      .me-fft-badge.warn{background:var(--amp);color:var(--am)}
      .me-fft-badge.crit{background:var(--rdp);color:var(--rd);animation:me-fft-blink 1.5s ease-in-out infinite}
      @keyframes me-fft-blink{0%,100%{opacity:1}50%{opacity:.6}}
      .me-meta{font-size:11px;color:var(--mu);margin-top:2px}
      .me-pr{display:flex;align-items:center;gap:8px;margin-top:6px}
      .me-pr .b{flex:1;height:5px;background:var(--bo2);border-radius:99px;overflow:hidden;position:relative}
      .me-pr .b i{display:block;height:100%;border-radius:99px;transition:width .9s cubic-bezier(.2,.7,.3,1)}
      .me-pr.low .b i{background:linear-gradient(90deg,#ef4444,#f97316)}
      .me-pr.mid .b i{background:linear-gradient(90deg,#f59e0b,#facc15)}
      .me-pr.high .b i{background:linear-gradient(90deg,#10b981,#22c55e)}
      .me-pr .v{font-family:var(--fn);font-size:10.5px;color:var(--mu);font-weight:700;min-width:40px;text-align:right}
      .me-empty{text-align:center;padding:40px 20px;color:var(--mu);font-size:13px}
    </style>
    <div class="me-wrap anim-slide-up">
      <div class="me-top">
        <span class="pg-logo-txt">PermiGo</span>
        <div style="flex:1">
          <div class="ttl">Mes élèves</div>
          <div class="sub" id="me-counts">…</div>
        </div>
        <span id="me-bell"></span>
        <button class="btn btn-sm" id="me-avis" title="Mes avis" style="height:34px">⭐ Avis</button>
        <button class="btn btn-sm" id="me-planning" title="Planning" style="height:34px">📅 Planning</button>
        <button class="btn btn-sm" id="me-logout" title="Déconnexion" style="height:34px">⏻</button>
      </div>
      <label class="me-search" for="me-q">
        <span aria-hidden="true">🔍</span>
        <input id="me-q" type="search" placeholder="Rechercher un élève…" aria-label="Rechercher un élève par nom" />
      </label>
      <div class="me-tabs" role="tablist" aria-label="Filtrer les élèves">
        <button class="me-tab on" data-f="all" role="tab" aria-selected="true" type="button">Tous</button>
        <button class="me-tab" data-f="active" role="tab" aria-selected="false" type="button">Actifs</button>
        <button class="me-tab" data-f="inactive" role="tab" aria-selected="false" type="button">Inactifs</button>
      </div>
      <div id="me-list" class="me-list stagger" role="list"></div>
    </div>
  `;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function renderList(root) {
  const list = root.querySelector('#me-list');
  const counts = root.querySelector('#me-counts');
  let filtered = ELEVES.slice();
  if (FILTER === 'active') filtered = filtered.filter(e => (e.statut || 'Actif') === 'Actif');
  if (FILTER === 'inactive') filtered = filtered.filter(e => (e.statut || 'Actif') !== 'Actif');
  if (SEARCH) {
    const q = SEARCH.toLowerCase();
    filtered = filtered.filter(e => (e.nom || '').toLowerCase().includes(q));
  }

  const actifs = ELEVES.filter(e => (e.statut || 'Actif') === 'Actif').length;
  const inactifs = ELEVES.length - actifs;
  counts.textContent = `${actifs} actifs · ${inactifs} inactifs`;

  if (!filtered.length) {
    list.innerHTML = `<div class="me-empty">${ELEVES.length === 0 ? 'Aucun élève dans la base' : 'Aucun résultat'}</div>`;
    return;
  }

  list.innerHTML = filtered.map((e, idx) => {
    const av = AVATARS[idx % AVATARS.length];
    const forfait = e.forfait_h || 20;
    const isActif = (e.statut || 'Actif') === 'Actif';
    const prClass = e._pct >= 60 ? 'high' : e._pct >= 30 ? 'mid' : 'low';
    // Statut forfait (badge alerte)
    const heures = e._heures || 0;
    const forfaitPct = Math.min(100, Math.round((heures / forfait) * 100));
    const forfaitBadge = forfaitPct >= 90
      ? `<span class="me-fft-badge crit">🚨 ${forfaitPct}%</span>`
      : forfaitPct >= 75
      ? `<span class="me-fft-badge warn">⚠️ ${forfaitPct}%</span>`
      : '';
    const aria = `${e.nom} — ${heures} sur ${forfait} heures · ${e._validated} sur ${REMC_TOTAL} compétences acquises · ${isActif ? 'actif' : 'inactif'}`;
    return `
      <button class="me-row" data-id="${esc(e.id)}" type="button" aria-label="${esc(aria)}" role="listitem">
        <div class="me-av" style="background:${av}" aria-hidden="true">
          ${e.avatar_url
            ? `<img src="${esc(e.avatar_url)}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="me-av-fb" style="display:none">${esc(initials(e.nom || '??'))}</span>`
            : `<span class="me-av-fb">${esc(initials(e.nom || '??'))}</span>`}
        </div>
        <div class="me-body">
          <div class="me-nm">${esc(e.nom)} ${!isActif ? `<span class="me-stt inactif">Inactif</span>` : ''} ${forfaitBadge}</div>
          <div class="me-meta">${heures}/${forfait}h conduite · ${esc(e.code_statut || 'En cours')}</div>
          <div class="me-pr ${prClass}">
            <div class="b"><i style="width:0%" data-pct="${e._pct}"></i></div>
            <div class="v">${e._validated}/${REMC_TOTAL}</div>
          </div>
        </div>
      </button>
    `;
  }).join('');

  // Anim bars
  requestAnimationFrame(() => {
    list.querySelectorAll('.me-pr .b i').forEach(b => { b.style.width = (b.dataset.pct || 0) + '%'; });
  });

  // Click → ouvre fiche élève
  list.querySelectorAll('.me-row').forEach(r => {
    r.addEventListener('click', async () => {
      const { navigate } = await import('@/router.js');
      navigate('/fiche-eleve', { id: r.dataset.id });
    });
  });
}

function wire(root) {
  // Cloche notifs
  const bellHost = root.querySelector('#me-bell');
  if (bellHost) mountNotifBell(bellHost);

  root.querySelector('#me-logout')?.addEventListener('click', async () => {
    const { logout } = await import('@/auth/auth.js');
    await logout();
    const { navigate } = await import('@/router.js');
    navigate('/login');
  });
  root.querySelector('#me-planning')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/planning');
  });
  root.querySelector('#me-avis')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/avis');
  });
  root.querySelector('#me-q')?.addEventListener('input', (e) => {
    SEARCH = e.target.value;
    renderList(root);
  });
  root.querySelectorAll('.me-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      root.querySelectorAll('.me-tab').forEach(t => {
        t.classList.remove('on');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('on');
      tab.setAttribute('aria-selected', 'true');
      FILTER = tab.dataset.f;
      renderList(root);
    });
  });
}
