/**
 * Page Admin Équipe — gestion des moniteurs.
 *
 * Fonctionnalités :
 *  - Liste moniteurs avec recherche live + filtre statut
 *  - Stats : heures données (semaine + mois), nb élèves uniques, note moyenne (notations)
 *  - Création via edge function create-user (role=moniteur)
 *  - Édition profil moniteur (nom, tel, plaque véhicule, statut)
 *
 * Branchée Supabase (admin RLS) :
 *  - profiles (role='moniteur')
 *  - events (heures données)
 *  - notations (note moyenne anonyme)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { mountNotifBell } from '@/components/notif-bell.js';
import { isoDate, weekStart, addDays } from '@/utils/format-date.js';

let _root, _me;
let _moniteurs = [];
let _eventsMonth = [];
let _eventsWeek = [];
let _notations = [];
let _eleves = [];
let _query = '';
let _filter = 'all';

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  await load();
  render();
}

async function load() {
  const now = new Date();
  const monthStart = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const wStart = isoDate(weekStart(now));
  const wEnd = isoDate(addDays(weekStart(now), 6));

  const [profRes, evtMonthRes, evtWeekRes, notatRes] = await Promise.allSettled([
    sb.from('profiles').select('id, nom, email, tel, plaque, statut, role, created_at').order('nom'),
    sb.from('events').select('id, moniteur_id, eleve_id, t, dur, date_event').eq('is_deleted', false).gte('date_event', monthStart),
    sb.from('events').select('id, moniteur_id, eleve_id, t, dur, date_event').eq('is_deleted', false).gte('date_event', wStart).lte('date_event', wEnd),
    sb.from('notations').select('moniteur_id, note'),
  ]);

  const profs = profRes.value?.data || [];
  _moniteurs = profs.filter(p => p.role === 'moniteur');
  _eleves = profs.filter(p => p.role === 'eleve');
  _eventsMonth = evtMonthRes.value?.data || [];
  _eventsWeek = evtWeekRes.value?.data || [];
  _notations = notatRes.value?.data || [];
}

// ─── Helpers ───

function isLecon(t) {
  const s = (t || '').toLowerCase();
  return s === 'conf' || s === 'lecon' || s === 'leçon';
}

function statsFor(monId) {
  const evtM = _eventsMonth.filter(e => e.moniteur_id === monId);
  const evtW = _eventsWeek.filter(e => e.moniteur_id === monId);
  const heuresM = evtM.filter(e => isLecon(e.t)).reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const heuresW = evtW.filter(e => isLecon(e.t)).reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const elevesUniques = new Set(evtM.filter(e => isLecon(e.t)).map(e => e.eleve_id).filter(Boolean)).size;
  const monNotat = _notations.filter(n => n.moniteur_id === monId);
  const avg = monNotat.length ? monNotat.reduce((s, n) => s + (n.note || 0), 0) / monNotat.length : null;
  return { heuresM: +heuresM.toFixed(1), heuresW: +heuresW.toFixed(1), elevesUniques, avg, count: monNotat.length };
}

function filtered() {
  const q = _query.trim().toLowerCase();
  return _moniteurs
    .filter(m => {
      if (_filter === 'all') return true;
      return (m.statut || 'Actif').toLowerCase() === _filter;
    })
    .filter(m => !q || (m.nom || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q));
}

function initials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function counts() {
  const a = _moniteurs.filter(m => (m.statut || 'Actif') === 'Actif').length;
  return { all: _moniteurs.length, actif: a, inactif: _moniteurs.length - a };
}

// ─── Render ───

function render() {
  const c = counts();
  const list = filtered();
  _root.innerHTML = `
    <style>
      /* Background dark glassmorphism (cohérent admin) */
      .ad-bg{position:fixed;inset:0;z-index:0;background:#0b0d1a;overflow:hidden;pointer-events:none}
      .ad-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,#6366f1 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,#8b5cf6 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,#0891b2 0%,transparent 40%);filter:blur(60px);opacity:.5;animation:eq-float 22s ease-in-out infinite alternate}
      @keyframes eq-float{0%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(40px,-30px) rotate(180deg) scale(1.08)}100%{transform:translate(-30px,40px) rotate(360deg) scale(.96)}}
      .ad-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,transparent 0%,rgba(11,13,26,.5) 100%)}
      .ad-grid{position:fixed;inset:0;z-index:1;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;pointer-events:none;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}

      .eq-wrap{max-width:980px;margin:0 auto;padding:14px;position:relative;z-index:2;min-height:100vh}
      .eq-top{display:flex;align-items:center;gap:10px;padding:14px 4px 18px}
      .eq-back{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:18px;cursor:pointer}
      .eq-back:hover{background:rgba(255,255,255,.14)}
      .eq-top .ttl{font-family:var(--fd);font-weight:800;font-size:22px;letter-spacing:-.02em;color:#fff}
      .eq-top .sub{font-size:11.5px;color:rgba(255,255,255,.55);margin-top:3px}
      .eq-top-r{margin-left:auto;display:flex;align-items:center;gap:8px}

      .eq-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:0 4px 16px}
      .eq-search{flex:1;min-width:220px;height:40px;padding:0 14px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:inherit;font-size:13px;outline:none;transition:border-color .15s,background .15s}
      .eq-search:focus{border-color:rgba(139,92,246,.6);background:rgba(255,255,255,.08)}
      .eq-search::placeholder{color:rgba(255,255,255,.4)}
      .eq-filter{display:flex;gap:4px;background:rgba(255,255,255,.05);padding:4px;border-radius:10px;border:1px solid rgba(255,255,255,.1)}
      .eq-filter button{padding:7px 14px;border:0;background:transparent;color:rgba(255,255,255,.65);font-size:12px;font-weight:700;cursor:pointer;border-radius:7px;font-family:inherit;transition:all .15s}
      .eq-filter button:hover{color:#fff}
      .eq-filter button.on{background:rgba(255,255,255,.14);color:#fff}
      .eq-new{height:40px;padding:0 16px;border-radius:10px;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;border:1px solid rgba(139,92,246,.5);font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 6px 18px -4px rgba(139,92,246,.55);transition:transform .12s,box-shadow .15s;letter-spacing:.2px}
      .eq-new:hover{transform:translateY(-1px);box-shadow:0 10px 24px -6px rgba(139,92,246,.7)}

      .eq-list{display:flex;flex-direction:column;gap:8px}
      .eq-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(255,255,255,.05);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1);border-radius:var(--rl);cursor:pointer;transition:transform .15s,border-color .15s,background .15s}
      .eq-row:hover{transform:translateY(-2px);border-color:rgba(139,92,246,.4);background:rgba(255,255,255,.08)}
      .eq-av{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4338ca);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:800;font-size:14px;flex-shrink:0;box-shadow:0 4px 12px -2px rgba(99,102,241,.5)}
      .eq-body{flex:1;min-width:0}
      .eq-nm{font-family:var(--fd);font-weight:700;font-size:14px;color:#fff;display:flex;align-items:center;gap:8px;flex-wrap:wrap;letter-spacing:-.005em}
      .eq-tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-family:var(--fn);font-size:9.5px;font-weight:800;letter-spacing:.5px;text-transform:uppercase}
      .eq-tag.a{background:rgba(16,185,129,.18);color:#34d399;border:1px solid rgba(16,185,129,.3)}
      .eq-tag.i{background:rgba(148,163,184,.15);color:#94a3b8;border:1px solid rgba(148,163,184,.25)}
      .eq-tag.rate{background:rgba(245,158,11,.18);color:#fbbf24;border:1px solid rgba(245,158,11,.3)}
      .eq-meta{font-size:11.5px;color:rgba(255,255,255,.5);margin-top:3px}
      .eq-stats{display:flex;gap:14px;margin-top:6px;font-size:11px;color:rgba(255,255,255,.5);flex-wrap:wrap}
      .eq-stats b{font-family:var(--fn);font-weight:800;color:#fff;font-size:12px}
      .eq-edit{padding:7px 12px;border-radius:8px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.1);font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0}
      .eq-row:hover .eq-edit{background:rgba(139,92,246,.25);color:#fff;border-color:rgba(139,92,246,.4)}
      .eq-empty{padding:48px 16px;text-align:center;color:rgba(255,255,255,.45);font-size:13px;background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.1);border-radius:var(--rl)}

      .eq-modal{position:fixed;inset:0;background:rgba(11,13,26,.7);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;z-index:90;padding:14px}
      .eq-modal.show{display:flex;animation:eqFade .2s ease}
      @keyframes eqFade{from{opacity:0}to{opacity:1}}
      .eq-panel{background:var(--bg);width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:var(--rx);box-shadow:0 24px 60px -20px rgba(0,0,0,.6);animation:eqSlide .25s cubic-bezier(.2,.7,.3,1)}
      @keyframes eqSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      .eq-mh{padding:16px;border-bottom:1px solid var(--bo2);display:flex;align-items:center;justify-content:space-between}
      .eq-mh .ti{font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:-.01em}
      .eq-mh .id{font-family:var(--fn);font-size:11px;color:var(--mu);margin-top:2px;font-weight:700}
      .eq-mh button{width:32px;height:32px;border-radius:50%;background:var(--bg2);color:var(--ink);font-size:18px;border:0;cursor:pointer}
      .eq-mb{padding:16px}
      .eq-mb .r{margin-bottom:14px}
      .eq-mb .r2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
      .eq-mb .r2 .r{margin-bottom:0}
      .eq-mb label{display:block;font-size:10.5px;font-weight:800;color:var(--mu);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase}
      .eq-mb input,.eq-mb select{width:100%;height:40px;padding:0 12px;border:1px solid var(--bo);border-radius:8px;font-family:var(--fb);font-size:13.5px;color:var(--ink);background:var(--su)}
      .eq-mb input:focus,.eq-mb select:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 3px var(--ap)}
      .eq-mb input:disabled{background:var(--bg2);color:var(--mu);cursor:not-allowed}
      .eq-mb .hint{font-size:10.5px;color:var(--mu);margin-top:5px;font-style:italic}
      .eq-toggle{display:flex;gap:6px}
      .eq-toggle .t-btn{flex:1;height:42px;border-radius:8px;border:1.5px solid var(--bo);background:var(--su);font-family:inherit;font-size:13px;font-weight:700;color:var(--mu);cursor:pointer;transition:all .12s}
      .eq-toggle .t-btn:hover{border-color:var(--mu2)}
      .eq-toggle .t-btn.on[data-s="Actif"]{background:#dcfce7;border-color:#10b981;color:#15803d}
      .eq-toggle .t-btn.on[data-s="Inactif"]{background:#fee2e2;border-color:#ef4444;color:#991b1b}
      .eq-cta{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-top:18px}
      .eq-note{margin-top:18px;padding:12px 14px;background:rgba(139,92,246,.06);border-left:3px solid #8b5cf6;border-radius:8px;font-size:12px;color:var(--mu);line-height:1.5}
      .eq-note b{color:#8b5cf6}
    </style>

    <div class="ad-bg"></div>
    <div class="ad-grid"></div>

    <div class="eq-wrap anim-slide-up">
      <div class="eq-top">
        <button class="eq-back" id="eq-back" aria-label="Retour">‹</button>
        <img src="permigo-logo.png" alt="PermiGo" style="height:28px;width:auto;filter:drop-shadow(0 4px 14px rgba(139,92,246,.45))" onerror="this.style.display='none'">
        <div>
          <div class="ttl">Équipe</div>
          <div class="sub">${_moniteurs.length} moniteur${_moniteurs.length > 1 ? 's' : ''} · ${c.actif} actif${c.actif > 1 ? 's' : ''}</div>
        </div>
        <div class="eq-top-r">
          <span id="eq-bell"></span>
        </div>
      </div>

      <div class="eq-toolbar">
        <input class="eq-search" id="eq-search" type="text" placeholder="🔍 Rechercher un nom ou un email…" value="${esc(_query)}">
        <div class="eq-filter">
          <button data-f="all" class="${_filter === 'all' ? 'on' : ''}">Tous · ${c.all}</button>
          <button data-f="actif" class="${_filter === 'actif' ? 'on' : ''}">Actifs · ${c.actif}</button>
          <button data-f="inactif" class="${_filter === 'inactif' ? 'on' : ''}">Inactifs · ${c.inactif}</button>
        </div>
        <button class="eq-new" id="eq-new" type="button">+ Nouveau moniteur</button>
      </div>

      <div class="eq-list" id="eq-list">${renderList(list)}</div>

      <div style="height:30px"></div>
    </div>

    <div class="eq-modal" id="eq-modal"><div class="eq-panel" id="eq-panel"></div></div>
  `;
  wire();
}

function renderList(list) {
  if (list.length === 0) {
    return `<div class="eq-empty">Aucun moniteur ne correspond aux filtres</div>`;
  }
  return list.map(renderRow).join('');
}

function renderRow(m) {
  const s = statsFor(m.id);
  const isActif = (m.statut || 'Actif') === 'Actif';
  return `
    <div class="eq-row" data-id="${esc(m.id)}">
      <div class="eq-av">${esc(initials(m.nom))}</div>
      <div class="eq-body">
        <div class="eq-nm">
          ${esc(m.nom || '—')}
          <span class="eq-tag ${isActif ? 'a' : 'i'}">${isActif ? 'Actif' : 'Inactif'}</span>
          ${s.avg !== null ? `<span class="eq-tag rate">⭐ ${s.avg.toFixed(1)} · ${s.count} avis</span>` : ''}
        </div>
        <div class="eq-meta">${esc(m.email || '—')}${m.tel ? ' · ' + esc(m.tel) : ''}${m.plaque ? ' · 🚗 ' + esc(m.plaque) : ''}</div>
        <div class="eq-stats">
          <span><b>${s.heuresW}</b> h cette semaine</span>
          <span><b>${s.heuresM}</b> h ce mois</span>
          <span><b>${s.elevesUniques}</b> élève${s.elevesUniques > 1 ? 's' : ''} actif${s.elevesUniques > 1 ? 's' : ''}</span>
        </div>
      </div>
      <button class="eq-edit" type="button">Éditer ›</button>
    </div>
  `;
}

function wire() {
  const bellHost = _root.querySelector('#eq-bell');
  if (bellHost) mountNotifBell(bellHost);

  _root.querySelector('#eq-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/dashboard');
  });

  const search = _root.querySelector('#eq-search');
  search?.addEventListener('input', (ev) => {
    _query = ev.target.value;
    _root.querySelector('#eq-list').innerHTML = renderList(filtered());
    wireRows();
  });

  _root.querySelectorAll('.eq-filter button').forEach(b => {
    b.addEventListener('click', () => {
      _filter = b.dataset.f;
      render();
    });
  });

  _root.querySelector('#eq-new')?.addEventListener('click', openCreate);

  wireRows();

  const modal = _root.querySelector('#eq-modal');
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

function wireRows() {
  _root.querySelectorAll('.eq-row').forEach(r => {
    r.addEventListener('click', () => openEdit(r.dataset.id));
  });
}

// ─── Modal Création moniteur ───

function openCreate() {
  const panel = _root.querySelector('#eq-panel');
  panel.innerHTML = `
    <div class="eq-mh">
      <div>
        <div class="ti">+ Nouveau moniteur</div>
        <div class="id">Création depuis l'admin</div>
      </div>
      <button id="eq-close" aria-label="Fermer">×</button>
    </div>
    <div class="eq-mb">
      <div class="r">
        <label>Nom complet *</label>
        <input id="f-new-nom" type="text" placeholder="Prénom Nom" maxlength="80" autofocus>
      </div>
      <div class="r">
        <label>Email *</label>
        <input id="f-new-email" type="email" placeholder="prenom.nom@autoecole.fr" maxlength="120">
        <div class="hint">Un email de bienvenue avec un lien pour définir son mot de passe sera envoyé.</div>
      </div>
      <div class="r2">
        <div class="r">
          <label>Téléphone</label>
          <input id="f-new-tel" type="tel" placeholder="06 12 34 56 78" maxlength="20">
        </div>
        <div class="r">
          <label>Plaque véhicule</label>
          <input id="f-new-plaque" type="text" placeholder="AA-123-BB" maxlength="20">
        </div>
      </div>

      <div class="eq-note">
        Le moniteur apparaîtra avec le statut <b>Actif</b> et pourra immédiatement gérer son planning.
        Les autres détails (boîte véhicule…) sont éditables ensuite.
      </div>

      <div class="eq-cta">
        <button class="btn" id="eq-cancel">Annuler</button>
        <button class="btn btn-p" id="eq-create" style="background:linear-gradient(135deg,#8b5cf6,#6366f1);border-color:#6366f1">Créer le moniteur</button>
      </div>
    </div>
  `;

  panel.querySelector('#eq-close').onclick = closeModal;
  panel.querySelector('#eq-cancel').onclick = closeModal;

  panel.querySelector('#eq-create').onclick = async () => {
    const nom = panel.querySelector('#f-new-nom').value.trim();
    const email = panel.querySelector('#f-new-email').value.trim().toLowerCase();
    const tel = panel.querySelector('#f-new-tel').value.trim();
    const plaque = panel.querySelector('#f-new-plaque').value.trim();

    if (!nom) { toast('Le nom est obligatoire', 'error'); return; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { toast('Email invalide', 'error'); return; }

    const btn = panel.querySelector('#eq-create');
    btn.disabled = true;
    btn.textContent = '…';

    try {
      const { data, error } = await sb.functions.invoke('create-user', {
        body: { nom, email, tel: tel || null, role: 'moniteur' },
      });

      if (error || data?.error) {
        let msg = data?.error || error?.message || 'Erreur création';
        if (error?.context?.body) {
          try {
            const parsed = typeof error.context.body === 'string' ? JSON.parse(error.context.body) : error.context.body;
            if (parsed?.error) msg = parsed.error;
          } catch (_) {}
        }
        toast(msg, 'error');
        btn.disabled = false;
        btn.textContent = 'Créer le moniteur';
        return;
      }

      // Si plaque fournie, on patch le profil juste après création
      if (plaque && data?.userId) {
        await sb.from('profiles').update({ plaque }).eq('auth_id', data.userId);
      }

      closeModal();
      toast('✓ Moniteur créé — email de bienvenue envoyé', 'success');
      await refresh();
    } catch (err) {
      console.warn('[create-user moniteur] catch', err);
      toast('Erreur réseau — edge function déployée ?', 'error');
      btn.disabled = false;
      btn.textContent = 'Créer le moniteur';
    }
  };

  _root.querySelector('#eq-modal').classList.add('show');
}

// ─── Modal Édition ───

function openEdit(monId) {
  const m = _moniteurs.find(x => x.id === monId);
  if (!m) return;

  const isActif = (m.statut || 'Actif') === 'Actif';
  const s = statsFor(monId);

  const panel = _root.querySelector('#eq-panel');
  panel.innerHTML = `
    <div class="eq-mh">
      <div>
        <div class="ti">Éditer le moniteur</div>
        <div class="id">${esc(m.email || m.id)}</div>
      </div>
      <button id="eq-close" aria-label="Fermer">×</button>
    </div>
    <div class="eq-mb">
      <div class="r">
        <label>Nom complet *</label>
        <input id="f-nom" type="text" value="${esc(m.nom || '')}" maxlength="80">
      </div>
      <div class="r">
        <label>Email</label>
        <input id="f-email" type="email" value="${esc(m.email || '')}" disabled>
        <div class="hint">Modifiable uniquement via le profil moniteur (auth).</div>
      </div>
      <div class="r2">
        <div class="r">
          <label>Téléphone</label>
          <input id="f-tel" type="tel" value="${esc(m.tel || '')}" maxlength="20">
        </div>
        <div class="r">
          <label>Plaque véhicule</label>
          <input id="f-plaque" type="text" value="${esc(m.plaque || '')}" maxlength="20">
        </div>
      </div>
      <div class="r">
        <label>Statut compte</label>
        <div class="eq-toggle">
          <button class="t-btn ${isActif ? 'on' : ''}" data-s="Actif" type="button">✓ Actif</button>
          <button class="t-btn ${!isActif ? 'on' : ''}" data-s="Inactif" type="button">⊘ Inactif</button>
        </div>
      </div>

      <div class="eq-note">
        <b>📊 Activité</b> · ${s.heuresW}h cette semaine · ${s.heuresM}h ce mois
        · ${s.elevesUniques} élève${s.elevesUniques > 1 ? 's' : ''}
        ${s.avg !== null ? ` · ⭐ ${s.avg.toFixed(1)} (${s.count} avis)` : ' · pas d\'avis pour l\'instant'}
      </div>

      <div class="eq-cta">
        <button class="btn" id="eq-cancel">Annuler</button>
        <button class="btn btn-p" id="eq-save">Enregistrer</button>
      </div>
    </div>
  `;

  let pickedStatut = m.statut || 'Actif';
  panel.querySelectorAll('.t-btn').forEach(b => {
    b.addEventListener('click', () => {
      panel.querySelectorAll('.t-btn').forEach(o => o.classList.remove('on'));
      b.classList.add('on');
      pickedStatut = b.dataset.s;
    });
  });

  panel.querySelector('#eq-close').onclick = closeModal;
  panel.querySelector('#eq-cancel').onclick = closeModal;

  panel.querySelector('#eq-save').onclick = async () => {
    const nom = panel.querySelector('#f-nom').value.trim();
    if (!nom) { toast('Le nom est obligatoire', 'error'); return; }

    const updates = {
      nom,
      tel: panel.querySelector('#f-tel').value.trim() || null,
      plaque: panel.querySelector('#f-plaque').value.trim() || null,
      statut: pickedStatut,
    };

    const btn = panel.querySelector('#eq-save');
    btn.disabled = true;
    btn.textContent = '…';

    const { error } = await sb.from('profiles').update(updates).eq('id', monId);
    if (error) {
      toast(error.message || 'Erreur sauvegarde', 'error');
      btn.disabled = false;
      btn.textContent = 'Enregistrer';
      return;
    }

    closeModal();
    toast('Moniteur mis à jour ✓', 'success');
    await refresh();
  };

  _root.querySelector('#eq-modal').classList.add('show');
}

function closeModal() {
  _root.querySelector('#eq-modal').classList.remove('show');
}

async function refresh() {
  await load();
  render();
}
