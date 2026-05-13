/**
 * Page Lieux RDV — carnet d'adresses du moniteur.
 *
 * CRUD simple : nom + adresse + notes + actif.
 * Utilisable depuis le modal de création de leçon (autocompletion).
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { mountNotifBell } from '@/components/notif-bell.js';

let _root, _me, _lieux = [];

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div></div>`;
  await load();
  render();
}

async function load() {
  const { data } = await sb.from('lieux')
    .select('id, nom, adresse, notes, actif, created_at')
    .eq('moniteur_id', _me.id)
    .order('created_at', { ascending: false });
  _lieux = data || [];
}

function render() {
  _root.innerHTML = `
    <style>
      .lx-wrap{max-width:560px;margin:0 auto;padding:14px;padding-bottom:90px}
      .lx-top{display:flex;align-items:center;gap:10px;padding:6px 4px 16px}
      .lx-back{width:36px;height:36px;border-radius:10px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer;color:var(--ink)}
      .lx-top h1{font-family:var(--fd);font-size:22px;font-weight:900;letter-spacing:-.02em;margin:0;flex:1}
      .lx-top .sub{font-size:12px;color:var(--mu);margin-top:2px}

      .lx-add{background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:0;padding:13px 16px;border-radius:12px;font-family:var(--fd);font-size:13px;font-weight:800;cursor:pointer;width:100%;margin-bottom:14px;box-shadow:0 6px 18px -4px rgba(16,185,129,.5);letter-spacing:.2px;transition:transform .15s}
      .lx-add:hover{transform:translateY(-2px)}

      .lx-card{background:var(--su);border:1px solid var(--bo);border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:flex-start;gap:12px;transition:transform .15s,border-color .15s}
      .lx-card:hover{transform:translateY(-2px);border-color:var(--a)}
      .lx-card.inactive{opacity:.6;background:var(--bg2)}
      .lx-icon{width:40px;height:40px;border-radius:10px;background:var(--ap);color:var(--a);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
      .lx-body{flex:1;min-width:0}
      .lx-nm{font-family:var(--fd);font-weight:800;font-size:15px;color:var(--ink);line-height:1.2;letter-spacing:-.005em}
      .lx-addr{font-size:12px;color:var(--mu);margin-top:3px;line-height:1.4}
      .lx-notes{font-size:11.5px;color:var(--mu2);margin-top:4px;font-style:italic;line-height:1.3}
      .lx-actions{display:flex;gap:5px;flex-shrink:0}
      .lx-act-btn{width:32px;height:32px;border-radius:8px;border:1px solid var(--bo);background:var(--bg2);font-size:13px;cursor:pointer;color:var(--ink);display:flex;align-items:center;justify-content:center;transition:background .12s}
      .lx-act-btn:hover{background:var(--ap);border-color:var(--a);color:var(--a)}
      .lx-act-btn.del:hover{background:var(--rdp);color:var(--rd);border-color:var(--rd)}

      .lx-empty{text-align:center;padding:48px 20px;color:var(--mu);background:var(--bg2);border-radius:14px;font-size:13.5px}
      .lx-empty .em{font-size:42px;line-height:1;margin-bottom:10px}

      /* Modal édition */
      .lx-modal{position:fixed;inset:0;background:rgba(11,13,26,.6);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;z-index:90;padding:14px}
      .lx-modal.show{display:flex;animation:fadeIn .2s}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      .lx-modal-panel{background:var(--bg);width:100%;max-width:440px;border-radius:18px;padding:22px;box-shadow:var(--s3);animation:popIn .25s cubic-bezier(.2,.7,.3,1)}
      @keyframes popIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
      .lx-modal-panel h2{font-family:var(--fd);font-weight:900;font-size:18px;margin:0 0 16px;letter-spacing:-.02em}
      .lx-modal-panel label{display:block;font-size:10.5px;font-weight:800;color:var(--mu);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;margin-top:12px}
      .lx-modal-panel input,.lx-modal-panel textarea{width:100%;padding:10px 12px;border:1px solid var(--bo);border-radius:8px;font-family:var(--fb);font-size:13.5px;color:var(--ink);background:var(--su)}
      .lx-modal-panel input:focus,.lx-modal-panel textarea:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 3px var(--ap)}
      .lx-modal-panel textarea{min-height:60px;resize:vertical}
      .lx-modal-cta{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-top:20px}
    </style>

    <div class="lx-wrap anim-slide-up">
      <div class="lx-top">
        <button class="lx-back" id="lx-back" aria-label="Retour">‹</button>
        <div>
          <h1>Lieux favoris</h1>
          <div class="sub">${_lieux.length} lieu${_lieux.length > 1 ? 'x' : ''} enregistré${_lieux.length > 1 ? 's' : ''}</div>
        </div>
        <span id="lx-bell"></span>
      </div>

      <button class="lx-add" id="lx-add" type="button">+ Ajouter un lieu</button>

      ${_lieux.length === 0 ? `
        <div class="lx-empty">
          <div class="em">📍</div>
          <div>Aucun lieu enregistré</div>
          <div style="font-size:12px;margin-top:4px">Crée tes points de RDV favoris pour les retrouver vite en créant tes leçons</div>
        </div>
      ` : _lieux.map(renderLieuCard).join('')}
    </div>

    <div class="lx-modal" id="lx-modal" role="dialog" aria-modal="true">
      <div class="lx-modal-panel" id="lx-modal-panel"></div>
    </div>
  `;
  wire();
}

function renderLieuCard(l) {
  return `
    <div class="lx-card ${l.actif ? '' : 'inactive'}" data-id="${esc(l.id)}">
      <div class="lx-icon">📍</div>
      <div class="lx-body">
        <div class="lx-nm">${esc(l.nom)}</div>
        ${l.adresse ? `<div class="lx-addr">${esc(l.adresse)}</div>` : ''}
        ${l.notes ? `<div class="lx-notes">${esc(l.notes)}</div>` : ''}
      </div>
      <div class="lx-actions">
        <button class="lx-act-btn" data-edit="${esc(l.id)}" type="button" aria-label="Modifier">✏️</button>
        <button class="lx-act-btn del" data-del="${esc(l.id)}" type="button" aria-label="Supprimer">🗑</button>
      </div>
    </div>
  `;
}

function wire() {
  const bellHost = _root.querySelector('#lx-bell');
  if (bellHost) mountNotifBell(bellHost);

  _root.querySelector('#lx-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/planning');
  });

  _root.querySelector('#lx-add')?.addEventListener('click', () => openModal(null));

  _root.querySelectorAll('[data-edit]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const l = _lieux.find(x => x.id === b.dataset.edit);
      if (l) openModal(l);
    });
  });

  _root.querySelectorAll('[data-del]').forEach(b => {
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Supprimer ce lieu ?')) return;
      const { error } = await sb.from('lieux').delete().eq('id', b.dataset.del);
      if (error) { toast('Erreur', 'error'); return; }
      toast('Lieu supprimé', 'success');
      await load(); render();
    });
  });

  _root.querySelector('#lx-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'lx-modal') closeModal();
  });
}

function openModal(lieu) {
  const isEdit = !!lieu;
  const panel = _root.querySelector('#lx-modal-panel');
  panel.innerHTML = `
    <h2>${isEdit ? 'Modifier le lieu' : 'Nouveau lieu favori'}</h2>
    <label>Nom *</label>
    <input id="lx-f-nom" type="text" placeholder="Ex. Mairie de Nanterre" value="${esc(lieu?.nom || '')}" maxlength="80">
    <label>Adresse</label>
    <input id="lx-f-addr" type="text" placeholder="92000 Nanterre · Place de la Boule" value="${esc(lieu?.adresse || '')}" maxlength="200">
    <label>Notes (optionnel)</label>
    <textarea id="lx-f-notes" placeholder="Stationnement difficile, RDV côté nord…" maxlength="300">${esc(lieu?.notes || '')}</textarea>
    <div class="lx-modal-cta">
      <button class="btn" id="lx-cancel" type="button">Annuler</button>
      <button class="btn btn-p" id="lx-save" type="button">${isEdit ? 'Mettre à jour' : 'Créer'}</button>
    </div>
  `;

  panel.querySelector('#lx-cancel').onclick = closeModal;
  panel.querySelector('#lx-save').onclick = async () => {
    const nom = panel.querySelector('#lx-f-nom').value.trim();
    const adresse = panel.querySelector('#lx-f-addr').value.trim() || null;
    const notes = panel.querySelector('#lx-f-notes').value.trim() || null;
    if (!nom) { toast('Le nom est obligatoire', 'error'); return; }

    if (isEdit) {
      const { error } = await sb.from('lieux').update({ nom, adresse, notes }).eq('id', lieu.id);
      if (error) { toast('Erreur', 'error'); return; }
      toast('Lieu mis à jour ✓', 'success');
    } else {
      const { error } = await sb.from('lieux').insert({ moniteur_id: _me.id, nom, adresse, notes, actif: true });
      if (error) { toast('Erreur création', 'error'); return; }
      toast('Lieu ajouté ✓', 'success');
    }
    closeModal();
    await load(); render();
  };

  _root.querySelector('#lx-modal').classList.add('show');
}

function closeModal() {
  _root.querySelector('#lx-modal')?.classList.remove('show');
}
