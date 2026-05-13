/**
 * Page Livret REMC — Évaluation moniteur.
 *
 * Permet au moniteur de valider/mettre à jour les 31 sous-compétences REMC
 * d'un élève donné.
 *
 * UX :
 *  - Header retour + nom élève + KPI global (X/31 acquises)
 *  - 4 sections (catégories REMC) avec barre de progression
 *  - Liste des sous-compétences avec leur état actuel (chip de couleur)
 *  - Click sur une sous-comp → bottom sheet d'évaluation :
 *      • 3 boutons radio : Acquis / En cours / À retravailler
 *      • textarea note (max 280 char)
 *      • Sauver (upsert remc_entries)
 *
 * Branchée sur Supabase :
 *  - profiles (lecture nom élève)
 *  - remc_entries (read + upsert sur eleve_id+comp_id)
 *
 * Mapping lv : 'v'=acquis, 'p'=en cours, 'r'=à retravailler
 *
 * @param {HTMLElement} root
 * @param {string} eleveId
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { REMC, REMC_TOTAL } from '@/data/remc.js';
import { burstConfettiFromElement } from '@/components/confetti.js';

let _filter = 'all'; // all | todo | wip | done

let _root, _me, _eleve, _entries = [];

export async function mount(root, eleveId) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;
  if (!eleveId) { toast('Élève manquant', 'error'); return; }

  // Skeleton
  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  // Fetch en parallèle
  const [eleveRes, entriesRes] = await Promise.allSettled([
    sb.from('profiles').select('id, nom, code_statut').eq('id', eleveId).maybeSingle(),
    sb.from('remc_entries').select('comp_id, lv, note, validated_at').eq('eleve_id', eleveId),
  ]);

  _eleve = eleveRes.value?.data;
  if (!_eleve) {
    root.innerHTML = '<div style="padding:24px;color:#b91c1c;text-align:center">Élève introuvable</div>';
    return;
  }
  _entries = entriesRes.value?.data || [];

  root.innerHTML = render();
  wire();
}

// ─── Helpers d'état ───
function entryFor(compId) { return _entries.find(e => e.comp_id === compId) || null; }
function lvFor(compId) { return entryFor(compId)?.lv || null; }
function noteFor(compId) { return entryFor(compId)?.note || ''; }

function catProgress(cat) {
  const total = cat.subs.length;
  const done = cat.subs.filter(s => lvFor(s.c) === 'v').length;
  const wip = cat.subs.filter(s => lvFor(s.c) === 'p').length;
  const rev = cat.subs.filter(s => lvFor(s.c) === 'r').length;
  return { total, done, wip, rev, pct: total ? Math.round(done / total * 100) : 0 };
}

function globalProgress() {
  const done = REMC.flatMap(c => c.subs).filter(s => lvFor(s.c) === 'v').length;
  return { total: REMC_TOTAL, done, pct: Math.round(done / REMC_TOTAL * 100) };
}

function chipLabel(lv) {
  return ({ v: 'Acquis', p: 'En cours', r: 'À retravailler' })[lv] || 'Non évalué';
}
function chipCls(lv) {
  return ({ v: 'lv-v', p: 'lv-p', r: 'lv-r' })[lv] || 'lv-x';
}

/** Retrouve le libellé textuel d'une sous-compétence depuis son comp_id. */
function compLabel(compId) {
  for (const c of REMC) {
    const s = c.subs.find(x => x.c === compId);
    if (s) return s.n;
  }
  return compId;
}

/**
 * Émet une notif `comp_acquise` à l'élève — Flux 4 (FLOWS.md).
 * À n'appeler QUE lorsqu'une compétence vient de passer à `lv='v'`
 * (pas si elle était déjà 'v' avant, pas pour 'p'/'r'/null) — idempotence.
 * Best-effort : un échec n'interrompt pas le flux UI.
 */
async function notifyCompAcquise(compId) {
  if (!_eleve?.id) return;
  const monNom = _me?.nom || 'ton enseignant';
  const libelle = compLabel(compId);
  const { error } = await sb.from('notifications').insert({
    user_id: _eleve.id,
    type: 'comp_acquise',
    title: 'Compétence validée 🎉',
    body: `${libelle} validée par ${monNom}`,
  });
  if (error) console.warn('[livret-remc notif comp_acquise]', error);
}

// ─── Rendu ───
function render() {
  const g = globalProgress();

  return `
    <style>
      .lv-wrap{max-width:560px;margin:0 auto;padding:14px}
      .lv-top{display:flex;align-items:center;gap:10px;padding:6px 4px 14px}
      .lv-back{width:34px;height:34px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer}
      .lv-top .ttl{font-family:var(--fd);font-weight:800;font-size:20px;letter-spacing:-.02em}
      .lv-top .sub{font-size:11px;color:var(--mu);margin-top:2px}

      .lv-hero{background:linear-gradient(140deg,var(--a) 0%,var(--adk) 100%);color:#fff;border-radius:var(--rx);padding:18px;margin-bottom:14px;box-shadow:var(--s2)}
      .lv-hero .lbl{font-size:10px;font-weight:800;opacity:.85;letter-spacing:1.5px}
      .lv-hero h2{font-family:var(--fd);font-size:22px;font-weight:800;margin:6px 0 4px;letter-spacing:-.02em}
      .lv-hero .sub{font-size:12px;opacity:.85}
      .lv-hero-row{display:flex;align-items:flex-end;justify-content:space-between;margin-top:8px}
      .lv-hero .pct{font-family:var(--fn);font-size:32px;font-weight:800;line-height:1}
      .lv-hero .bar{height:6px;background:rgba(255,255,255,.22);border-radius:99px;overflow:hidden;margin-top:14px}
      .lv-hero .bar>i{display:block;height:100%;background:#fff;border-radius:99px;transition:width .8s ease}

      .lv-cat{background:var(--su);border:1px solid var(--bo);border-radius:var(--rl);overflow:hidden;margin-bottom:12px;box-shadow:var(--s1)}
      .lv-cat-h{padding:14px;display:flex;align-items:center;gap:12px;cursor:pointer;user-select:none}
      .lv-cat-h .ico{width:42px;height:42px;border-radius:12px;background:var(--ap);color:var(--a);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
      .lv-cat-h .body{flex:1;min-width:0}
      .lv-cat-h .body .lbl{font-size:9.5px;font-weight:800;color:var(--mu);letter-spacing:1px}
      .lv-cat-h .body .nm{font-family:var(--fd);font-weight:700;font-size:14.5px;letter-spacing:-.01em}
      .lv-cat-h .body .pr{display:flex;align-items:center;gap:8px;margin-top:5px}
      .lv-cat-h .body .pr .bar2{flex:1;height:5px;background:var(--bo2);border-radius:99px;overflow:hidden;max-width:180px}
      .lv-cat-h .body .pr .bar2 i{display:block;height:100%;background:var(--gr);border-radius:99px}
      .lv-cat-h .body .pr .pct{font-family:var(--fn);font-size:10.5px;color:var(--mu);font-weight:700}
      .lv-cat-h .arr{color:var(--mu2);transition:transform .2s ease;font-size:14px;font-weight:700}
      .lv-cat.open .lv-cat-h .arr{transform:rotate(90deg)}

      .lv-subs{display:none;border-top:1px solid var(--bo2)}
      .lv-cat.open .lv-subs{display:block}
      .lv-sub{padding:12px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--bo2);transition:background .15s,opacity .25s}
      .lv-sub:last-child{border-bottom:0}
      .lv-sub.recently-updated{background:linear-gradient(90deg,rgba(16,185,129,.08),transparent 70%);animation:lv-flash 1.2s ease-out}
      @keyframes lv-flash{0%{background:rgba(16,185,129,.2)}100%{background:transparent}}
      .lv-sub .id{font-family:var(--fn);font-size:10.5px;color:var(--mu2);font-weight:700;min-width:34px}
      .lv-sub .nm{flex:1;min-width:0;font-size:13px;color:var(--ink);font-weight:500;cursor:pointer;padding:4px 0;line-height:1.3}
      .lv-sub .nm:hover{color:var(--a)}
      /* Boutons d'action rapide (3 niveaux) — tap direct, pas de modal */
      .lv-acts{display:flex;gap:4px;flex-shrink:0}
      .lv-act{width:34px;height:34px;border:1.5px solid var(--bo);background:var(--su);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;font-family:inherit;color:var(--mu);transition:all .15s;padding:0;line-height:1}
      .lv-act:hover{transform:translateY(-1px);box-shadow:0 4px 10px -2px rgba(11,13,26,.15)}
      .lv-act:active{transform:scale(.92)}
      .lv-act.r:hover{border-color:var(--am);color:var(--am);background:var(--amp)}
      .lv-act.p:hover{border-color:var(--a);color:var(--a);background:var(--ap)}
      .lv-act.v:hover{border-color:var(--gr);color:var(--gr);background:var(--grp)}
      .lv-act.r.on{border-color:var(--am);color:#fff;background:var(--am)}
      .lv-act.p.on{border-color:var(--a);color:#fff;background:var(--a)}
      .lv-act.v.on{border-color:var(--gr);color:#fff;background:var(--gr);box-shadow:0 4px 12px -2px rgba(16,185,129,.4)}
      .lv-act .em{display:block;line-height:1}
      /* Bouton "Tout valider" sur l'en-tête de catégorie */
      .lv-cat-all{display:none;align-items:center;gap:5px;padding:6px 11px;background:var(--grp);color:var(--gr);border:1px solid var(--gr);border-radius:99px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;letter-spacing:.2px;flex-shrink:0;transition:all .15s}
      .lv-cat-all:hover{background:var(--gr);color:#fff;transform:translateY(-1px);box-shadow:0 6px 14px -4px rgba(16,185,129,.5)}
      .lv-cat.open .lv-cat-all{display:inline-flex}
      /* Filtre rapide en haut */
      .lv-filter{display:flex;gap:4px;background:var(--bg2);padding:4px;border-radius:10px;margin-bottom:14px;border:1px solid var(--bo)}
      .lv-filter button{flex:1;padding:8px 0;border:0;background:transparent;color:var(--mu);font-size:11.5px;font-weight:700;cursor:pointer;border-radius:7px;font-family:inherit;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:4px}
      .lv-filter button .count{font-family:var(--fn);font-size:10px;font-weight:800;color:var(--mu2);background:var(--su);padding:2px 6px;border-radius:99px;min-width:18px}
      .lv-filter button:hover{color:var(--ink)}
      .lv-filter button.on{background:var(--su);color:var(--ink);box-shadow:var(--s0)}
      .lv-filter button.on .count{color:var(--a);background:var(--ap)}
      .lv-sub.hidden{display:none}

      /* Bottom sheet d'évaluation */
      .lv-sheet{position:fixed;inset:0;background:rgba(11,13,26,.5);backdrop-filter:blur(4px);display:none;align-items:flex-end;justify-content:center;z-index:90}
      .lv-sheet.show{display:flex;animation:lvFade .2s ease}
      @keyframes lvFade{from{opacity:0}to{opacity:1}}
      .lv-sheet .panel{background:var(--bg);width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:var(--rx) var(--rx) 0 0;box-shadow:var(--s3);animation:lvSlide .25s cubic-bezier(.2,.7,.3,1)}
      @media(min-width:640px){.lv-sheet{align-items:center}.lv-sheet .panel{border-radius:var(--rx);max-height:88vh}}
      @keyframes lvSlide{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
      .lv-fh{padding:16px 16px 12px;border-bottom:1px solid var(--bo2);display:flex;align-items:center;justify-content:space-between}
      .lv-fh .ti{font-family:var(--fd);font-weight:800;font-size:15px;letter-spacing:-.01em;line-height:1.2}
      .lv-fh .id{font-family:var(--fn);font-size:10.5px;color:var(--mu);font-weight:700;margin-top:3px}
      .lv-fh .close{width:32px;height:32px;border-radius:50%;background:var(--bg2);color:var(--ink);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;border:0;flex-shrink:0}
      .lv-fb{padding:16px}
      .lv-fb-lbl{font-size:10px;font-weight:800;color:var(--mu);letter-spacing:1px;margin-bottom:8px}
      .lv-opts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px}
      .lv-opt{padding:14px 8px;border-radius:10px;border:2px solid var(--bo);background:var(--su);cursor:pointer;text-align:center;transition:all .15s;font-family:inherit}
      .lv-opt:hover{border-color:var(--mu2)}
      .lv-opt.sel.v{border-color:var(--gr);background:var(--grp)}
      .lv-opt.sel.p{border-color:var(--a);background:var(--ap)}
      .lv-opt.sel.r{border-color:var(--am);background:var(--amp)}
      .lv-opt .em{font-size:22px;line-height:1}
      .lv-opt .lb{font-size:11.5px;font-weight:700;margin-top:5px;color:var(--ink)}
      .lv-fb textarea{width:100%;min-height:80px;padding:10px 12px;border:1px solid var(--bo);border-radius:8px;font-family:var(--fb);font-size:13px;color:var(--ink);resize:vertical;background:var(--su2);margin-bottom:6px}
      .lv-fb textarea:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 3px var(--ap)}
      .lv-count{font-size:10.5px;color:var(--mu);text-align:right;margin-bottom:14px}
      .lv-cta{display:grid;grid-template-columns:1fr 2fr;gap:8px}
    </style>

    <div class="lv-wrap anim-slide-up">
      <div class="lv-top">
        <button class="lv-back" id="lv-back" aria-label="Retour">‹</button>
        <div style="flex:1">
          <div class="ttl">Livret REMC</div>
          <div class="sub">${esc(_eleve.nom)}</div>
        </div>
      </div>

      <div class="lv-hero">
        <div class="lbl">PROGRESSION GLOBALE</div>
        <div class="lv-hero-row">
          <div>
            <h2>${g.done} / ${g.total} acquises</h2>
            <div class="sub">Référentiel officiel · 4 catégories</div>
          </div>
          <div class="pct">${g.pct}%</div>
        </div>
        <div class="bar"><i style="width:0%"></i></div>
      </div>

      <!-- Filtres rapides -->
      <div class="lv-filter" role="tablist">
        <button data-f="all" class="${_filter === 'all' ? 'on' : ''}">Tous <span class="count">${REMC_TOTAL}</span></button>
        <button data-f="todo" class="${_filter === 'todo' ? 'on' : ''}">À évaluer <span class="count">${REMC.flatMap(c => c.subs).filter(s => !lvFor(s.c)).length}</span></button>
        <button data-f="wip" class="${_filter === 'wip' ? 'on' : ''}">En cours <span class="count">${REMC.flatMap(c => c.subs).filter(s => lvFor(s.c) === 'p').length}</span></button>
        <button data-f="done" class="${_filter === 'done' ? 'on' : ''}">Acquises <span class="count">${REMC.flatMap(c => c.subs).filter(s => lvFor(s.c) === 'v').length}</span></button>
      </div>

      ${REMC.map(renderCat).join('')}

      <div style="height:24px"></div>
    </div>

    <div class="lv-sheet" id="lv-sheet"><div class="panel" id="lv-sheet-panel"></div></div>
  `;
}

function renderCat(cat) {
  const p = catProgress(cat);
  const allDone = p.done === p.total;
  return `
    <div class="lv-cat" data-cat="${cat.id}">
      <div class="lv-cat-h">
        <div class="ico" data-toggle>${cat.ico}</div>
        <div class="body" data-toggle>
          <div class="lbl">${cat.id} · ${esc(cat.name).toUpperCase()}</div>
          <div class="nm">${esc(cat.tname)}</div>
          <div class="pr">
            <div class="bar2"><i style="width:${p.pct}%"></i></div>
            <div class="pct">${p.done}/${p.total}</div>
          </div>
        </div>
        ${!allDone ? `<button class="lv-cat-all" data-cat-all="${cat.id}" type="button" aria-label="Marquer toutes les compétences de ${cat.name} comme acquises">✓ Tout acquis</button>` : ''}
        <div class="arr" data-toggle>›</div>
      </div>
      <div class="lv-subs">
        ${cat.subs.map(s => {
          const lv = lvFor(s.c);
          const hideClass = subVisibleByFilter(lv) ? '' : 'hidden';
          return `
            <div class="lv-sub ${hideClass}" data-comp="${esc(s.c)}" data-lv="${lv || ''}">
              <div class="id">${esc(s.c)}</div>
              <div class="nm" data-open-detail title="Ouvrir le détail (ajouter une note)">${esc(s.n)}</div>
              <div class="lv-acts" role="group" aria-label="Définir le niveau">
                <button class="lv-act r ${lv === 'r' ? 'on' : ''}" data-set-lv="r" data-comp="${esc(s.c)}" type="button" aria-label="À retravailler" title="À retravailler"><span class="em">🔁</span></button>
                <button class="lv-act p ${lv === 'p' ? 'on' : ''}" data-set-lv="p" data-comp="${esc(s.c)}" type="button" aria-label="En cours" title="En cours"><span class="em">⌁</span></button>
                <button class="lv-act v ${lv === 'v' ? 'on' : ''}" data-set-lv="v" data-comp="${esc(s.c)}" type="button" aria-label="Acquis" title="Acquis"><span class="em">✓</span></button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function subVisibleByFilter(lv) {
  if (_filter === 'all') return true;
  if (_filter === 'todo') return !lv;
  if (_filter === 'wip') return lv === 'p';
  if (_filter === 'done') return lv === 'v';
  return true;
}

// ─── Wiring ───
function wire() {
  _root.querySelector('#lv-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/fiche-eleve', { id: _eleve.id });
  });

  // Animation bar
  requestAnimationFrame(() => {
    const bar = _root.querySelector('.lv-hero .bar i');
    if (bar) bar.style.width = globalProgress().pct + '%';
  });

  // Toggle accordions — la première catégorie en cours est ouverte par défaut
  const firstWipCat = REMC.find(c => catProgress(c).done < c.subs.length) || REMC[0];
  _root.querySelector(`.lv-cat[data-cat="${firstWipCat.id}"]`)?.classList.add('open');

  // Toggle accordion : seulement sur les éléments data-toggle (ico, body, arr) — pas le bouton "Tout acquis"
  _root.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', () => el.closest('.lv-cat').classList.toggle('open'));
  });

  // ─── Tap RAPIDE sur les 3 boutons d'action (r / p / v) → set direct sans modal ───
  _root.querySelectorAll('[data-set-lv]').forEach(b => {
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
      const compId = b.dataset.comp;
      const newLv = b.dataset.setLv;
      const curLv = lvFor(compId);
      // Si on re-clique sur le statut déjà actif → on toggle (annule l'évaluation)
      const finalLv = curLv === newLv ? null : newLv;
      await setLvQuick(compId, finalLv, b);
    });
  });

  // ─── Click sur le NOM de la sous-comp → ouvre modal détaillé (pour ajouter une note) ───
  _root.querySelectorAll('[data-open-detail]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const sub = el.closest('.lv-sub');
      if (sub) openEval(sub.dataset.comp);
    });
  });

  // ─── Bouton "Tout acquis" par catégorie ───
  _root.querySelectorAll('[data-cat-all]').forEach(b => {
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
      const catId = b.dataset.catAll;
      const cat = REMC.find(c => c.id === catId);
      if (!cat) return;
      const toUpdate = cat.subs.filter(s => lvFor(s.c) !== 'v');
      if (toUpdate.length === 0) return;
      if (!confirm(`Marquer ${toUpdate.length} compétence${toUpdate.length > 1 ? 's' : ''} de "${cat.name}" comme acquise${toUpdate.length > 1 ? 's' : ''} ?`)) return;
      await setLvBatch(toUpdate.map(s => s.c), 'v', b);
    });
  });

  // ─── Filtre rapide ───
  _root.querySelectorAll('.lv-filter button').forEach(b => {
    b.addEventListener('click', () => {
      _filter = b.dataset.f;
      _root.innerHTML = render();
      wire();
    });
  });

  // Close sheet
  const sheet = _root.querySelector('#lv-sheet');
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.classList.remove('show'); });
}

/** Set LV rapide sur une comp — upsert direct sans ouvrir le modal. */
async function setLvQuick(compId, lv, btnEl) {
  // Optimistic UI : on update _entries localement avant la DB
  const existing = _entries.find(e => e.comp_id === compId);
  const prevLv = existing?.lv || null;
  if (lv === null) {
    // Suppression de l'évaluation
    _entries = _entries.filter(e => e.comp_id !== compId);
  } else if (existing) {
    existing.lv = lv;
    existing.validated_at = new Date().toISOString();
  } else {
    _entries.push({ comp_id: compId, lv, note: '', validated_at: new Date().toISOString() });
  }

  // Re-render le row + le hero
  rerenderRow(compId);
  rerenderHero();
  rerenderCatProgress(compId);
  rerenderFilterCounts();

  // Animation feedback
  if (lv === 'v' && btnEl) {
    burstConfettiFromElement(btnEl, { count: 22, power: 8, spread: Math.PI * 0.8 });
  }

  // DB : upsert ou delete
  if (lv === null) {
    const { error } = await sb.from('remc_entries').delete().eq('eleve_id', _eleve.id).eq('comp_id', compId);
    if (error) { console.warn('[remc] delete err', error); toast('Erreur sync', 'error'); }
  } else {
    const payload = {
      eleve_id: _eleve.id,
      moniteur_id: _me.id,
      comp_id: compId,
      lv,
      checked: lv === 'v',
      validated_at: new Date().toISOString(),
    };
    const { error } = await sb.from('remc_entries').upsert(payload, { onConflict: 'eleve_id,comp_id' });
    if (error) { console.warn('[remc] upsert err', error); toast('Erreur sync', 'error'); return; }
    // Flux 4 — notif élève si la comp vient de passer à 'v' (et pas déjà 'v' avant) — idempotent
    if (lv === 'v' && prevLv !== 'v') notifyCompAcquise(compId);
  }
}

/** Set LV en masse (bouton "Tout acquis"). */
async function setLvBatch(compIds, lv, btnEl) {
  // Capture l'état AVANT mutation pour idempotence des notifs (ne pas re-notifier si déjà 'v')
  const toNotify = lv === 'v' ? compIds.filter(c => (_entries.find(e => e.comp_id === c)?.lv) !== 'v') : [];
  for (const compId of compIds) {
    const existing = _entries.find(e => e.comp_id === compId);
    if (existing) {
      existing.lv = lv;
      existing.validated_at = new Date().toISOString();
    } else {
      _entries.push({ comp_id: compId, lv, note: '', validated_at: new Date().toISOString() });
    }
  }
  // Re-render complet (plus simple pour un batch)
  _root.innerHTML = render();
  wire();
  // Anim feedback en fanfare
  if (btnEl) burstConfettiFromElement(btnEl, { count: 60, power: 14 });
  toast(`${compIds.length} compétence${compIds.length > 1 ? 's' : ''} marquée${compIds.length > 1 ? 's' : ''} acquise${compIds.length > 1 ? 's' : ''} ✓`, 'success');

  // DB : upsert batch
  const payload = compIds.map(c => ({
    eleve_id: _eleve.id, moniteur_id: _me.id, comp_id: c, lv,
    checked: lv === 'v', validated_at: new Date().toISOString(),
  }));
  const { error } = await sb.from('remc_entries').upsert(payload, { onConflict: 'eleve_id,comp_id' });
  if (error) { console.warn('[remc] batch err', error); toast('Erreur sync', 'error'); return; }
  // Flux 4 — une notif élève par compétence qui vient de passer à 'v' — idempotent
  for (const c of toNotify) notifyCompAcquise(c);
}

/** Re-render UN row (sous-comp) sans recharger tout le DOM. */
function rerenderRow(compId) {
  const row = _root.querySelector(`.lv-sub[data-comp="${compId}"]`);
  if (!row) return;
  const lv = lvFor(compId);
  row.dataset.lv = lv || '';
  // Update buttons
  row.querySelectorAll('.lv-act').forEach(b => {
    b.classList.toggle('on', b.dataset.setLv === lv);
  });
  // Filter check
  row.classList.toggle('hidden', !subVisibleByFilter(lv));
  // Feedback flash
  row.classList.remove('recently-updated');
  void row.offsetWidth; // reflow
  row.classList.add('recently-updated');
}

function rerenderHero() {
  const g = globalProgress();
  const hero = _root.querySelector('.lv-hero');
  if (!hero) return;
  hero.querySelector('h2').textContent = `${g.done} / ${g.total} acquises`;
  hero.querySelector('.pct').textContent = `${g.pct}%`;
  const bar = hero.querySelector('.bar i');
  if (bar) bar.style.width = g.pct + '%';
}

function rerenderCatProgress(compId) {
  const cat = REMC.find(c => c.subs.some(s => s.c === compId));
  if (!cat) return;
  const p = catProgress(cat);
  const catEl = _root.querySelector(`.lv-cat[data-cat="${cat.id}"]`);
  if (!catEl) return;
  const bar = catEl.querySelector('.bar2 i');
  if (bar) bar.style.width = p.pct + '%';
  const pct = catEl.querySelector('.pct');
  if (pct) pct.textContent = `${p.done}/${p.total}`;
  // Hide "Tout acquis" si plus rien à faire
  const allBtn = catEl.querySelector('.lv-cat-all');
  if (allBtn && p.done === p.total) allBtn.style.display = 'none';
}

function rerenderFilterCounts() {
  const all = REMC_TOTAL;
  const todo = REMC.flatMap(c => c.subs).filter(s => !lvFor(s.c)).length;
  const wip = REMC.flatMap(c => c.subs).filter(s => lvFor(s.c) === 'p').length;
  const done = REMC.flatMap(c => c.subs).filter(s => lvFor(s.c) === 'v').length;
  const counts = { all, todo, wip, done };
  _root.querySelectorAll('.lv-filter button').forEach(b => {
    const c = b.querySelector('.count');
    if (c) c.textContent = counts[b.dataset.f];
  });
}

function openEval(compId) {
  // Trouve la sous-comp + catégorie
  let cat, sub;
  for (const c of REMC) {
    const s = c.subs.find(x => x.c === compId);
    if (s) { cat = c; sub = s; break; }
  }
  if (!sub) return;

  const curLv = lvFor(compId);
  const curNote = noteFor(compId);

  const panel = _root.querySelector('#lv-sheet-panel');
  panel.innerHTML = `
    <div class="lv-fh">
      <div style="flex:1;min-width:0;padding-right:10px">
        <div class="ti">${esc(sub.n)}</div>
        <div class="id">${esc(cat.id)} · ${esc(compId)} · ${esc(cat.name)}</div>
      </div>
      <button class="close" id="lv-fh-close" aria-label="Fermer">×</button>
    </div>
    <div class="lv-fb">
      <div class="lv-fb-lbl">NIVEAU D'ACQUISITION</div>
      <div class="lv-opts">
        <button class="lv-opt r ${curLv === 'r' ? 'sel' : ''}" data-lv="r">
          <div class="em">🔁</div><div class="lb">À retravailler</div>
        </button>
        <button class="lv-opt p ${curLv === 'p' ? 'sel' : ''}" data-lv="p">
          <div class="em">⌁</div><div class="lb">En cours</div>
        </button>
        <button class="lv-opt v ${curLv === 'v' ? 'sel' : ''}" data-lv="v">
          <div class="em">✓</div><div class="lb">Acquis</div>
        </button>
      </div>
      <div class="lv-fb-lbl">NOTE (optionnel)</div>
      <textarea id="lv-note" maxlength="280" placeholder="Observations pour l'élève (visible dans son parcours)…">${esc(curNote)}</textarea>
      <div class="lv-count"><span id="lv-note-c">${(curNote || '').length}</span>/280</div>
      <div class="lv-cta">
        <button class="btn" id="lv-cancel">Annuler</button>
        <button class="btn btn-p" id="lv-save">Sauvegarder</button>
      </div>
    </div>
  `;

  // State local du modal
  let pickedLv = curLv;
  panel.querySelectorAll('.lv-opt').forEach(b => {
    b.addEventListener('click', () => {
      panel.querySelectorAll('.lv-opt').forEach(o => o.classList.remove('sel'));
      // Toggle off si on reclique sur le même
      if (pickedLv === b.dataset.lv) {
        pickedLv = null;
      } else {
        pickedLv = b.dataset.lv;
        b.classList.add('sel');
      }
    });
  });

  // Compteur note
  const ta = panel.querySelector('#lv-note');
  const c = panel.querySelector('#lv-note-c');
  ta.addEventListener('input', () => { c.textContent = ta.value.length; });

  // Close
  const sheet = _root.querySelector('#lv-sheet');
  panel.querySelector('#lv-fh-close').onclick = () => sheet.classList.remove('show');
  panel.querySelector('#lv-cancel').onclick = () => sheet.classList.remove('show');

  // Save
  panel.querySelector('#lv-save').onclick = async () => {
    const btn = panel.querySelector('#lv-save');
    btn.disabled = true;
    btn.textContent = '…';

    const note = ta.value.trim() || null;
    const payload = {
      eleve_id: _eleve.id,
      moniteur_id: _me.id,
      comp_id: compId,
      lv: pickedLv,
      checked: pickedLv === 'v',
      note,
      validated_at: new Date().toISOString(),
    };

    const { error } = await sb.from('remc_entries').upsert(payload, { onConflict: 'eleve_id,comp_id' });
    if (error) {
      console.warn('[livret-remc] upsert err', error);
      toast('Erreur sauvegarde', 'error');
      btn.disabled = false;
      btn.textContent = 'Sauvegarder';
      return;
    }

    // MAJ state local
    const idx = _entries.findIndex(e => e.comp_id === compId);
    const entry = { comp_id: compId, lv: pickedLv, note, validated_at: payload.validated_at };
    if (idx >= 0) _entries[idx] = entry; else _entries.push(entry);

    // Flux 4 — notif élève si la comp vient de passer à 'v' (et pas déjà 'v' avant) — idempotent
    if (pickedLv === 'v' && curLv !== 'v') notifyCompAcquise(compId);

    // Re-render (rafraîchit chips + progressions)
    _root.innerHTML = render();
    wire();
    // Ré-ouvre la catégorie pour le contexte
    _root.querySelector(`.lv-cat[data-cat="${cat.id}"]`)?.classList.add('open');

    toast('Compétence sauvegardée ✓', 'success');
  };

  // Show
  _root.querySelector('#lv-sheet').classList.add('show');
}
