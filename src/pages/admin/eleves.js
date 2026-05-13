/**
 * Page Admin Élèves — gestion complète du portefeuille élèves.
 *
 * Fonctionnalités :
 *  - Liste de tous les élèves avec recherche live (nom/email) + filtre statut
 *  - Stats par élève : heures conduites, nb leçons, dernière leçon
 *  - Modal édition : nom, tel, neph, dob, forfait, code_statut, statut (Actif/Inactif)
 *  - Toggle Actif/Inactif rapide (soft delete)
 *
 * Note : la CRÉATION d'un élève passe par l'inscription Supabase (page /login).
 * L'admin ne peut pas créer un user auth depuis le frontend (sécurité Supabase).
 * Une fois l'élève inscrit, son profil est éditable ici.
 *
 * Branchée sur Supabase :
 *  - profiles (filtré role='eleve')
 *  - events (pour les stats)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { mountNotifBell } from '@/components/notif-bell.js';

let _root, _me;
let _eleves = [];
let _events = [];
let _query = '';
let _filter = 'all'; // 'all' | 'actif' | 'inactif'

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;
  if (_me.role !== 'admin') { root.innerHTML = '<p>Accès admin requis</p>'; return; }

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  await load();
  render();
}

async function load() {
  const [eleveRes, eventRes] = await Promise.allSettled([
    sb.from('profiles')
      .select('id, nom, email, tel, neph, dob, forfait_h, statut, code_statut, created_at')
      .eq('role', 'eleve')
      .order('nom'),
    sb.from('events')
      .select('id, eleve_id, dur, t, date_event')
      .eq('is_deleted', false),
  ]);
  _eleves = eleveRes.value?.data || [];
  _events = eventRes.value?.data || [];
}

// ─── Helpers ───

function statsForEleve(id) {
  const evts = _events.filter(e => e.eleve_id === id);
  const lecons = evts.filter(e => {
    const s = (e.t || '').toLowerCase();
    return s === 'conf' || s === 'lecon' || s === 'leçon';
  });
  const heures = lecons.reduce((s, e) => s + (parseFloat(e.dur) || 1), 0);
  const today = new Date().toISOString().slice(0, 10);
  const lastLecon = lecons
    .filter(e => e.date_event && e.date_event <= today)
    .sort((a, b) => b.date_event.localeCompare(a.date_event))[0];
  return { heures, count: lecons.length, lastDate: lastLecon?.date_event || null };
}

function filtered() {
  const q = _query.trim().toLowerCase();
  return _eleves
    .filter(e => {
      if (_filter === 'all') return true;
      const s = (e.statut || 'Actif').toLowerCase();
      return s === _filter;
    })
    .filter(e => !q || (e.nom || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q));
}

function initials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function counts() {
  const a = _eleves.filter(e => (e.statut || 'Actif') === 'Actif').length;
  return { all: _eleves.length, actif: a, inactif: _eleves.length - a };
}

// ─── Rendu ───

function render() {
  const c = counts();
  const list = filtered();
  _root.innerHTML = `
    <style>
      /* Background premium dark (cohérent avec dashboard admin) */
      .ad-bg{position:fixed;inset:0;z-index:0;background:#0b0d1a;overflow:hidden;pointer-events:none}
      .ad-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,#6366f1 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,#8b5cf6 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,#0891b2 0%,transparent 40%);filter:blur(60px);opacity:.5;animation:ae-float 22s ease-in-out infinite alternate}
      @keyframes ae-float{0%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(40px,-30px) rotate(180deg) scale(1.08)}100%{transform:translate(-30px,40px) rotate(360deg) scale(.96)}}
      .ad-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,transparent 0%,rgba(11,13,26,.5) 100%)}
      .ad-grid{position:fixed;inset:0;z-index:1;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;pointer-events:none;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}

      .ae-wrap{max-width:980px;margin:0 auto;padding:14px;position:relative;z-index:2;min-height:100vh}
      .ae-top{display:flex;align-items:center;gap:10px;padding:14px 4px 18px}
      .ae-back{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:18px;cursor:pointer}
      .ae-back:hover{background:rgba(255,255,255,.14)}
      .ae-top .ttl{font-family:var(--fd);font-weight:800;font-size:22px;letter-spacing:-.02em;color:#fff}
      .ae-top .sub{font-size:11.5px;color:rgba(255,255,255,.55);margin-top:3px}
      .ae-top-r{margin-left:auto;display:flex;align-items:center;gap:8px}

      /* Toolbar */
      .ae-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:0 4px 16px}
      .ae-search{flex:1;min-width:220px;height:40px;padding:0 14px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:inherit;font-size:13px;outline:none;transition:border-color .15s,background .15s}
      .ae-search:focus{border-color:rgba(99,102,241,.6);background:rgba(255,255,255,.08)}
      .ae-search::placeholder{color:rgba(255,255,255,.4)}
      .ae-filter{display:flex;gap:4px;background:rgba(255,255,255,.05);padding:4px;border-radius:10px;border:1px solid rgba(255,255,255,.1)}
      .ae-filter button{padding:7px 14px;border:0;background:transparent;color:rgba(255,255,255,.65);font-size:12px;font-weight:700;cursor:pointer;border-radius:7px;font-family:inherit;transition:all .15s}
      .ae-filter button:hover{color:#fff}
      .ae-filter button.on{background:rgba(255,255,255,.14);color:#fff}
      .ae-new{height:40px;padding:0 16px;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:1px solid rgba(16,185,129,.5);font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 6px 18px -4px rgba(16,185,129,.5);transition:transform .12s,box-shadow .15s;display:inline-flex;align-items:center;gap:6px;letter-spacing:.2px}
      .ae-new:hover{transform:translateY(-1px);box-shadow:0 10px 24px -6px rgba(16,185,129,.6)}
      .ae-new:active{transform:translateY(0)}

      /* Liste */
      .ae-list{display:flex;flex-direction:column;gap:8px}
      .ae-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(255,255,255,.05);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1);border-radius:var(--rl);cursor:pointer;transition:transform .15s,border-color .15s,background .15s}
      .ae-row:hover{transform:translateY(-2px);border-color:rgba(99,102,241,.4);background:rgba(255,255,255,.08)}
      .ae-av{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:800;font-size:14px;flex-shrink:0;box-shadow:0 4px 12px -2px rgba(99,102,241,.5)}
      .ae-body{flex:1;min-width:0}
      .ae-nm{font-family:var(--fd);font-weight:700;font-size:14px;color:#fff;display:flex;align-items:center;gap:8px;flex-wrap:wrap;letter-spacing:-.005em}
      .ae-tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-family:var(--fn);font-size:9.5px;font-weight:800;letter-spacing:.5px;text-transform:uppercase}
      .ae-tag.a{background:rgba(16,185,129,.18);color:#34d399;border:1px solid rgba(16,185,129,.3)}
      .ae-tag.i{background:rgba(148,163,184,.15);color:#94a3b8;border:1px solid rgba(148,163,184,.25)}
      .ae-tag.code{background:rgba(99,102,241,.15);color:#a5b4fc;border:1px solid rgba(99,102,241,.3)}
      .ae-meta{font-size:11.5px;color:rgba(255,255,255,.5);margin-top:3px}
      .ae-stats{display:flex;gap:14px;margin-top:6px;font-size:11px;color:rgba(255,255,255,.5)}
      .ae-stats b{font-family:var(--fn);font-weight:800;color:#fff;font-size:12px}
      .ae-edit{padding:7px 12px;border-radius:8px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.1);font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;transition:all .12s}
      .ae-row:hover .ae-edit{background:rgba(99,102,241,.25);color:#fff;border-color:rgba(99,102,241,.4)}
      .ae-empty{padding:48px 16px;text-align:center;color:rgba(255,255,255,.45);font-size:13px;background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.1);border-radius:var(--rl)}

      /* Modal */
      .ae-modal{position:fixed;inset:0;background:rgba(11,13,26,.7);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;z-index:90;padding:14px}
      .ae-modal.show{display:flex;animation:aeFade .2s ease}
      @keyframes aeFade{from{opacity:0}to{opacity:1}}
      .ae-panel{background:var(--bg);width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:var(--rx);box-shadow:0 24px 60px -20px rgba(0,0,0,.6);animation:aeSlide .25s cubic-bezier(.2,.7,.3,1)}
      @keyframes aeSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      .ae-mh{padding:16px;border-bottom:1px solid var(--bo2);display:flex;align-items:center;justify-content:space-between}
      .ae-mh .ti{font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:-.01em}
      .ae-mh .id{font-family:var(--fn);font-size:11px;color:var(--mu);margin-top:2px;font-weight:700}
      .ae-mh button{width:32px;height:32px;border-radius:50%;background:var(--bg2);color:var(--ink);font-size:18px;border:0;cursor:pointer}
      .ae-mb{padding:16px}
      .ae-mb .r{margin-bottom:14px}
      .ae-mb .r2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
      .ae-mb .r2 .r{margin-bottom:0}
      .ae-mb label{display:block;font-size:10.5px;font-weight:800;color:var(--mu);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase}
      .ae-mb input,.ae-mb select{width:100%;height:40px;padding:0 12px;border:1px solid var(--bo);border-radius:8px;font-family:var(--fb);font-size:13.5px;color:var(--ink);background:var(--su)}
      .ae-mb input:focus,.ae-mb select:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 3px var(--ap)}
      .ae-mb input:disabled{background:var(--bg2);color:var(--mu);cursor:not-allowed}
      .ae-mb .hint{font-size:10.5px;color:var(--mu);margin-top:5px;font-style:italic}
      .ae-toggle{display:flex;gap:6px}
      .ae-toggle .t-btn{flex:1;height:42px;border-radius:8px;border:1.5px solid var(--bo);background:var(--su);font-family:inherit;font-size:13px;font-weight:700;color:var(--mu);cursor:pointer;transition:all .12s}
      .ae-toggle .t-btn:hover{border-color:var(--mu2)}
      .ae-toggle .t-btn.on[data-s="Actif"]{background:#dcfce7;border-color:#10b981;color:#15803d}
      .ae-toggle .t-btn.on[data-s="Inactif"]{background:#fee2e2;border-color:#ef4444;color:#991b1b}
      .ae-cta{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-top:18px}

      .ae-note{margin-top:18px;padding:12px 14px;background:rgba(99,102,241,.06);border-left:3px solid var(--a);border-radius:8px;font-size:12px;color:var(--mu);line-height:1.5}
      .ae-note b{color:var(--a)}
    </style>

    <div class="ad-bg"></div>
    <div class="ad-grid"></div>

    <div class="ae-wrap anim-slide-up">
      <div class="ae-top">
        <button class="ae-back" id="ae-back" aria-label="Retour">‹</button>
        <span class="pg-logo-txt">PermiGo</span>
        <div>
          <div class="ttl">Élèves</div>
          <div class="sub">${_eleves.length} dans le portefeuille · ${c.actif} actif${c.actif > 1 ? 's' : ''}</div>
        </div>
        <div class="ae-top-r">
          <span id="ae-bell"></span>
        </div>
      </div>

      <div class="ae-toolbar">
        <input class="ae-search" id="ae-search" type="text" placeholder="🔍 Rechercher un nom ou un email…" value="${esc(_query)}">
        <div class="ae-filter">
          <button data-f="all" class="${_filter === 'all' ? 'on' : ''}">Tous · ${c.all}</button>
          <button data-f="actif" class="${_filter === 'actif' ? 'on' : ''}">Actifs · ${c.actif}</button>
          <button data-f="inactif" class="${_filter === 'inactif' ? 'on' : ''}">Inactifs · ${c.inactif}</button>
        </div>
        <button class="ae-new" id="ae-new" type="button">+ Nouvel élève</button>
      </div>

      <div class="ae-list" id="ae-list">
        ${renderList(list)}
      </div>

      <div style="height:30px"></div>
    </div>

    <div class="ae-modal" id="ae-modal"><div class="ae-panel" id="ae-panel"></div></div>
  `;
  wire();
}

function renderList(list) {
  if (list.length === 0) {
    return `<div class="ae-empty">Aucun élève ne correspond aux filtres</div>`;
  }
  return list.map(renderRow).join('');
}

function renderRow(e) {
  const s = statsForEleve(e.id);
  const isActif = (e.statut || 'Actif') === 'Actif';
  return `
    <div class="ae-row" data-id="${esc(e.id)}">
      <div class="ae-av">${esc(initials(e.nom))}</div>
      <div class="ae-body">
        <div class="ae-nm">
          ${esc(e.nom || '—')}
          <span class="ae-tag ${isActif ? 'a' : 'i'}">${isActif ? 'Actif' : 'Inactif'}</span>
          <span class="ae-tag code">${esc(e.code_statut || 'En cours')}</span>
        </div>
        <div class="ae-meta">${esc(e.email || '—')}${e.tel ? ' · ' + esc(e.tel) : ''}</div>
        <div class="ae-stats">
          <span><b>${s.heures}</b> h conduites</span>
          <span><b>${s.count}</b> leçons</span>
          <span>${s.lastDate ? 'Dernière : ' + s.lastDate : 'Pas encore de leçon'}</span>
        </div>
      </div>
      <button class="ae-edit" type="button">Éditer ›</button>
    </div>
  `;
}

// ─── Wire ───

function wire() {
  // Cloche notifs
  const bellHost = _root.querySelector('#ae-bell');
  if (bellHost) mountNotifBell(bellHost);

  _root.querySelector('#ae-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/dashboard');
  });

  // Recherche live (re-render seulement la liste, pas tout)
  const search = _root.querySelector('#ae-search');
  search?.addEventListener('input', (ev) => {
    _query = ev.target.value;
    const listHost = _root.querySelector('#ae-list');
    listHost.innerHTML = renderList(filtered());
    wireRows();
  });

  // Filtres
  _root.querySelectorAll('.ae-filter button').forEach(b => {
    b.addEventListener('click', () => {
      _filter = b.dataset.f;
      render(); // re-render complet (les compteurs et l'état actif des boutons changent)
    });
  });

  // Bouton "+ Nouvel élève"
  _root.querySelector('#ae-new')?.addEventListener('click', openCreate);

  wireRows();

  // Close modal
  const modal = _root.querySelector('#ae-modal');
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

function wireRows() {
  _root.querySelectorAll('.ae-row').forEach(r => {
    r.addEventListener('click', () => openEdit(r.dataset.id));
  });
}

// ─── Modal Création (appelle l'edge function create-user) ───

function openCreate() {
  const panel = _root.querySelector('#ae-panel');
  panel.innerHTML = `
    <div class="ae-mh">
      <div>
        <div class="ti">+ Nouvel élève</div>
        <div class="id">Création depuis l'admin</div>
      </div>
      <button id="ae-close" aria-label="Fermer">×</button>
    </div>
    <div class="ae-mb">
      <div class="r">
        <label>Rôle</label>
        <div class="ae-toggle">
          <button class="t-btn on" data-r="eleve" type="button">🎓 Élève</button>
          <button class="t-btn" data-r="moniteur" type="button">👨‍🏫 Enseignant</button>
        </div>
      </div>
      <div class="r">
        <label>Nom complet *</label>
        <input id="f-new-nom" type="text" placeholder="Prénom Nom" maxlength="80" autofocus>
      </div>
      <div class="r">
        <label>Email *</label>
        <input id="f-new-email" type="email" placeholder="prenom.nom@email.com" maxlength="120">
        <div class="hint">Un email de bienvenue avec un lien pour définir son mot de passe sera envoyé.</div>
      </div>
      <div class="r2">
        <div class="r">
          <label>Téléphone</label>
          <input id="f-new-tel" type="tel" placeholder="06 12 34 56 78" maxlength="20">
        </div>
        <div class="r" id="f-new-forfait-row">
          <label>Forfait (h)</label>
          <input id="f-new-forfait" type="number" value="20" min="0" max="200">
        </div>
      </div>

      <div class="ae-note">
        Une fois créé, le profil apparaît dans la liste avec le statut <b>Actif</b>.
        Tu pourras compléter les autres infos (NEPH, date de naissance…) en éditant.
      </div>

      <div class="ae-cta">
        <button class="btn" id="ae-cancel">Annuler</button>
        <button class="btn btn-p" id="ae-create" style="background:linear-gradient(135deg,#10b981,#059669);border-color:#059669">Créer le compte</button>
      </div>
    </div>
  `;

  // Toggle rôle
  let pickedRole = 'eleve';
  const forfaitRow = panel.querySelector('#f-new-forfait-row');
  panel.querySelectorAll('.t-btn').forEach(b => {
    b.addEventListener('click', () => {
      panel.querySelectorAll('.t-btn').forEach(o => o.classList.remove('on'));
      b.classList.add('on');
      pickedRole = b.dataset.r;
      // Forfait n'a de sens que pour les élèves
      forfaitRow.style.visibility = pickedRole === 'eleve' ? 'visible' : 'hidden';
    });
  });

  panel.querySelector('#ae-close').onclick = closeModal;
  panel.querySelector('#ae-cancel').onclick = closeModal;

  panel.querySelector('#ae-create').onclick = async () => {
    const nom = panel.querySelector('#f-new-nom').value.trim();
    const email = panel.querySelector('#f-new-email').value.trim().toLowerCase();
    const tel = panel.querySelector('#f-new-tel').value.trim();
    const forfait_h = parseInt(panel.querySelector('#f-new-forfait').value, 10) || 20;

    if (!nom) { toast('Le nom est obligatoire', 'error'); return; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast('Email invalide', 'error');
      return;
    }

    const btn = panel.querySelector('#ae-create');
    btn.disabled = true;
    btn.textContent = '…';

    try {
      const { data, error } = await sb.functions.invoke('create-user', {
        body: { nom, email, tel: tel || null, forfait_h, role: pickedRole },
      });

      // L'edge function renvoie { error: '...' } avec status 4xx → data peut contenir l'erreur
      if (error) {
        // Tente de récupérer le message depuis le body de la réponse
        let msg = error.message || 'Erreur création';
        if (error.context?.body) {
          try {
            const parsed = typeof error.context.body === 'string'
              ? JSON.parse(error.context.body)
              : error.context.body;
            if (parsed?.error) msg = parsed.error;
          } catch (_) {}
        }
        console.warn('[create-user] err', error);
        toast(msg, 'error');
        btn.disabled = false;
        btn.textContent = 'Créer le compte';
        return;
      }

      if (data?.error) {
        toast(data.error, 'error');
        btn.disabled = false;
        btn.textContent = 'Créer le compte';
        return;
      }

      // Audit log — création élève/moniteur (action métier réussie)
      await sb.from('audit_log').insert({
        user_id: _me.id,
        user_nom: _me.nom,
        user_role: 'admin',
        action: pickedRole === 'eleve' ? 'create_eleve' : 'create_moniteur',
        table_name: 'profiles',
        record_id: data?.profileId || data?.userId || null,
        details: JSON.stringify({
          nom: esc(nom),
          email: esc(email),
          tel: tel ? esc(tel) : null,
          role: pickedRole,
          forfait_h: pickedRole === 'eleve' ? forfait_h : null,
        }),
      });

      closeModal();
      toast(`✓ ${pickedRole === 'eleve' ? 'Élève' : 'Enseignant'} créé — email de bienvenue envoyé`, 'success');
      await refresh();
    } catch (err) {
      console.warn('[create-user] catch', err);
      toast('Erreur réseau — edge function déployée ?', 'error');
      btn.disabled = false;
      btn.textContent = 'Créer le compte';
    }
  };

  _root.querySelector('#ae-modal').classList.add('show');
}

// ─── Modal Édition ───

function openEdit(eleveId) {
  const e = _eleves.find(x => x.id === eleveId);
  if (!e) return;

  const isActif = (e.statut || 'Actif') === 'Actif';
  const s = statsForEleve(eleveId);
  const codeOptions = ['En cours', 'Code obtenu', 'Permis obtenu', 'Échec', 'Suspension'];

  const panel = _root.querySelector('#ae-panel');
  panel.innerHTML = `
    <div class="ae-mh">
      <div>
        <div class="ti">Éditer l'élève</div>
        <div class="id">${esc(e.email || e.id)}</div>
      </div>
      <button id="ae-close" aria-label="Fermer">×</button>
    </div>
    <div class="ae-mb">
      <div class="r">
        <label>Nom complet *</label>
        <input id="f-nom" type="text" value="${esc(e.nom || '')}" maxlength="80">
      </div>
      <div class="r">
        <label>Email</label>
        <input id="f-email" type="email" value="${esc(e.email || '')}" disabled>
        <div class="hint">L'email se modifie depuis le profil de l'élève (auth).</div>
      </div>
      <div class="r">
        <label>Téléphone</label>
        <input id="f-tel" type="tel" value="${esc(e.tel || '')}" placeholder="06 12 34 56 78" maxlength="20">
      </div>
      <div class="r2">
        <div class="r">
          <label>NEPH</label>
          <input id="f-neph" type="text" value="${esc(e.neph || '')}" placeholder="12 chiffres" maxlength="20">
        </div>
        <div class="r">
          <label>Date de naissance</label>
          <input id="f-dob" type="date" value="${esc(e.dob || '')}">
        </div>
      </div>
      <div class="r2">
        <div class="r">
          <label>Forfait (h)</label>
          <input id="f-forfait" type="number" value="${e.forfait_h || 20}" min="0" max="200">
        </div>
        <div class="r">
          <label>Code statut</label>
          <select id="f-code">
            ${codeOptions.map(c => `<option value="${c}" ${(e.code_statut || 'En cours') === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="r">
        <label>Statut compte</label>
        <div class="ae-toggle">
          <button class="t-btn ${isActif ? 'on' : ''}" data-s="Actif" type="button">✓ Actif</button>
          <button class="t-btn ${!isActif ? 'on' : ''}" data-s="Inactif" type="button">⊘ Inactif</button>
        </div>
      </div>

      <div class="ae-note">
        <b>📊 Progression</b> · ${s.heures}h conduites sur ${e.forfait_h || 20}h du forfait
        ${s.count ? ` · ${s.count} leçon${s.count > 1 ? 's' : ''} effectuée${s.count > 1 ? 's' : ''}` : ''}
        ${s.lastDate ? ` · dernière le ${s.lastDate}` : ''}
      </div>

      <div class="ae-cta">
        <button class="btn" id="ae-cancel">Annuler</button>
        <button class="btn btn-p" id="ae-save">Enregistrer</button>
      </div>
    </div>
  `;

  let pickedStatut = e.statut || 'Actif';
  panel.querySelectorAll('.t-btn').forEach(b => {
    b.addEventListener('click', () => {
      panel.querySelectorAll('.t-btn').forEach(o => o.classList.remove('on'));
      b.classList.add('on');
      pickedStatut = b.dataset.s;
    });
  });

  panel.querySelector('#ae-close').onclick = closeModal;
  panel.querySelector('#ae-cancel').onclick = closeModal;

  panel.querySelector('#ae-save').onclick = async () => {
    const nom = panel.querySelector('#f-nom').value.trim();
    if (!nom) { toast('Le nom est obligatoire', 'error'); return; }

    const forfait = parseInt(panel.querySelector('#f-forfait').value, 10);

    const updates = {
      nom,
      tel: panel.querySelector('#f-tel').value.trim() || null,
      neph: panel.querySelector('#f-neph').value.trim() || null,
      dob: panel.querySelector('#f-dob').value || null,
      forfait_h: Number.isFinite(forfait) ? forfait : 20,
      code_statut: panel.querySelector('#f-code').value,
      statut: pickedStatut,
    };

    const btn = panel.querySelector('#ae-save');
    btn.disabled = true;
    btn.textContent = '…';

    // Snapshot "before" pour audit/notif
    const before = {
      forfait_h: e.forfait_h || 20,
      statut: e.statut || 'Actif',
      code_statut: e.code_statut || 'En cours',
    };

    const { error } = await sb.from('profiles').update(updates).eq('id', eleveId);
    if (error) {
      console.warn('[admin/eleves] update err', error);
      toast(error.message || 'Erreur sauvegarde', 'error');
      btn.disabled = false;
      btn.textContent = 'Enregistrer';
      return;
    }

    // ── Audit log + notif (Flux 4) ──
    const forfaitChanged = before.forfait_h !== updates.forfait_h;
    const statutChanged = before.statut !== updates.statut || before.code_statut !== updates.code_statut;

    if (forfaitChanged) {
      await sb.from('audit_log').insert({
        user_id: _me.id,
        user_nom: _me.nom,
        user_role: 'admin',
        action: 'update_eleve_forfait',
        table_name: 'profiles',
        record_id: eleveId,
        details: JSON.stringify({
          eleve_nom: esc(updates.nom),
          before: before.forfait_h,
          after: updates.forfait_h,
        }),
      });
    }
    if (statutChanged) {
      await sb.from('audit_log').insert({
        user_id: _me.id,
        user_nom: _me.nom,
        user_role: 'admin',
        action: 'update_eleve_statut',
        table_name: 'profiles',
        record_id: eleveId,
        details: JSON.stringify({
          eleve_nom: esc(updates.nom),
          before: { statut: before.statut, code_statut: before.code_statut },
          after: { statut: updates.statut, code_statut: updates.code_statut },
        }),
      });
    }

    // Notif forfait_maj vers l'élève (Flux 4) si le forfait a changé
    if (forfaitChanged) {
      await sb.from('notifications').insert({
        user_id: eleveId,
        type: 'forfait_maj',
        title: 'Forfait mis à jour',
        body: `Ton forfait est désormais de ${updates.forfait_h} heures.`,
      });
      // TODO retrieve moniteur attitré pour notif côté moniteur
    }

    closeModal();
    toast('Élève mis à jour ✓', 'success');
    await refresh();
  };

  _root.querySelector('#ae-modal').classList.add('show');
}

function closeModal() {
  _root.querySelector('#ae-modal').classList.remove('show');
}

async function refresh() {
  await load();
  render();
}
