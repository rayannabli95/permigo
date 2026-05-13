/**
 * Page Réservation Élève — liste des créneaux dispos sur les 14 prochains jours.
 *
 * UX :
 *  - Header retour + titre "Réserver une leçon"
 *  - Chips filtre par moniteur (auto-générés depuis les data)
 *  - Liste groupée par jour : cards moniteur + heure + dur + lieu + bouton Réserver
 *  - Click "Réserver" → modal confirmation → UPDATE event (t=dispo → t=pend, eleve_id=me.id)
 *  - Notification générée pour le moniteur
 *
 * Branchée sur Supabase :
 *  - events (t='dispo' AND date_event in [today, today+14])
 *  - profiles (lecture nom moniteur)
 *  - notifications (insert)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { WEEK_DAYS_FULL, MONTHS_FR_SHORT, addDays, isoDate, jsDayToWeekIdx } from '@/utils/format-date.js';

let _root, _me, _dispos = [], _moniteurs = [], _filterMonId = null;

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  await load();
  render();
}

async function load() {
  const today = isoDate(new Date());
  const max = isoDate(addDays(new Date(), 14));

  const [dispoRes, monRes] = await Promise.allSettled([
    sb.from('events')
      .select('id, h, dur, lieu, comment, moniteur_id, mon_nom, date_event')
      .eq('t', 'dispo')
      .eq('is_deleted', false)
      .gte('date_event', today)
      .lte('date_event', max)
      .order('date_event')
      .order('h'),
    sb.from('profiles').select('id, nom').eq('role', 'moniteur').order('nom'),
  ]);

  _dispos = (dispoRes.value?.data) || [];
  _moniteurs = (monRes.value?.data) || [];
}

function monNomFor(d) {
  return _moniteurs.find(m => m.id === d.moniteur_id)?.nom || d.mon_nom || 'Moniteur';
}

function monInitials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function monColor(monId) {
  // Couleur stable par moniteur
  const colors = ['#5b5bd6', '#0891b2', '#7c3aed', '#0e7c66', '#9333ea', '#dc2626'];
  if (!monId) return colors[0];
  let hash = 0;
  for (let i = 0; i < monId.length; i++) hash = (hash * 31 + monId.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

function dayLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  const dow = jsDayToWeekIdx(d.getDay()); // 0=lundi
  return `${WEEK_DAYS_FULL[dow]} ${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]}`;
}

function groupByDay(list) {
  const map = new Map();
  for (const d of list) {
    if (!map.has(d.date_event)) map.set(d.date_event, []);
    map.get(d.date_event).push(d);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function filteredDispos() {
  if (!_filterMonId) return _dispos;
  return _dispos.filter(d => d.moniteur_id === _filterMonId);
}

// ─── Rendu ───

function render() {
  const monsWithDispos = [...new Set(_dispos.map(d => d.moniteur_id).filter(Boolean))];
  const groups = groupByDay(filteredDispos());

  _root.innerHTML = `
    <style>
      .rv-wrap{max-width:560px;margin:0 auto;padding:14px}
      .rv-top{display:flex;align-items:center;gap:10px;padding:6px 4px 14px}
      .rv-back{width:34px;height:34px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer}
      .rv-top .ttl{font-family:var(--fd);font-weight:800;font-size:20px;letter-spacing:-.02em}
      .rv-top .sub{font-size:11px;color:var(--mu);margin-top:2px}

      .rv-chips{display:flex;gap:6px;overflow-x:auto;padding:4px 4px 14px;scrollbar-width:none}
      .rv-chips::-webkit-scrollbar{display:none}
      .rv-chip{padding:6px 12px;border-radius:99px;border:1px solid var(--bo);background:var(--su);font-size:12px;font-weight:600;color:var(--mu);white-space:nowrap;cursor:pointer;transition:all .12s;font-family:inherit;flex-shrink:0}
      .rv-chip:hover{border-color:var(--mu2)}
      .rv-chip.on{background:var(--a);border-color:var(--a);color:#fff}

      .rv-day{margin-bottom:18px}
      .rv-day-h{font-family:var(--fd);font-size:13px;font-weight:800;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;padding:0 4px 8px}

      .rv-cards{display:flex;flex-direction:column;gap:8px}
      .rv-card{background:var(--su);border:1px solid var(--bo);border-radius:12px;padding:13px 14px;display:flex;align-items:center;gap:12px;box-shadow:var(--s0);transition:border-color .12s,box-shadow .12s}
      .rv-card:hover{border-color:var(--ap);box-shadow:var(--s1)}
      .rv-time{font-family:var(--fn);font-weight:800;color:var(--a);min-width:54px;font-size:14px;text-align:center;line-height:1.1}
      .rv-time .dur{display:block;font-size:10px;color:var(--mu);font-weight:700;margin-top:2px}
      .rv-mid{flex:1;min-width:0;display:flex;align-items:center;gap:10px}
      .rv-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--fd);font-weight:800;font-size:13px;flex-shrink:0}
      .rv-info{flex:1;min-width:0}
      .rv-mon-nm{font-family:var(--fd);font-weight:700;font-size:13.5px;letter-spacing:-.005em}
      .rv-lieu{font-size:11.5px;color:var(--mu);margin-top:2px;display:flex;align-items:center;gap:4px}
      .rv-cta{flex-shrink:0}
      .rv-cta button{height:36px;padding:0 14px;border-radius:8px;font-size:12.5px;font-weight:700}

      .rv-empty{text-align:center;padding:60px 20px;color:var(--mu);font-size:13.5px}
      .rv-empty .em{font-size:36px;margin-bottom:8px}

      /* Modal */
      .rv-modal{position:fixed;inset:0;background:rgba(11,13,26,.5);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;z-index:90;padding:14px}
      .rv-modal.show{display:flex;animation:rvFade .2s ease}
      @keyframes rvFade{from{opacity:0}to{opacity:1}}
      .rv-modal .rm-panel{background:var(--bg);width:100%;max-width:420px;border-radius:var(--rx);box-shadow:var(--s3);overflow:hidden;animation:rvSlide .25s cubic-bezier(.2,.7,.3,1)}
      @keyframes rvSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      .rm-h{padding:18px 18px 12px;text-align:center}
      .rm-h .em{font-size:42px;line-height:1;margin-bottom:8px}
      .rm-h .ti{font-family:var(--fd);font-weight:800;font-size:18px;letter-spacing:-.01em}
      .rm-h .sub{font-size:13px;color:var(--mu);margin-top:4px}
      .rm-info{padding:14px 18px;background:var(--bg2);font-size:13px;line-height:1.6;color:var(--ink)}
      .rm-info b{color:var(--a)}
      .rm-cta{display:grid;grid-template-columns:1fr 1.5fr;gap:8px;padding:14px}
    </style>

    <div class="rv-wrap anim-slide-up">
      <div class="rv-top">
        <button class="rv-back" id="rv-back" aria-label="Retour">‹</button>
        <div>
          <div class="ttl">Réserver une leçon</div>
          <div class="sub">${_dispos.length} créneaux dispos · 14 prochains jours</div>
        </div>
      </div>

      ${monsWithDispos.length > 1 ? `
        <div class="rv-chips">
          <button class="rv-chip ${!_filterMonId ? 'on' : ''}" data-mon="">Tous</button>
          ${monsWithDispos.map(id => {
            const nom = _moniteurs.find(m => m.id === id)?.nom || 'Moniteur';
            return `<button class="rv-chip ${_filterMonId === id ? 'on' : ''}" data-mon="${esc(id)}">${esc(nom.split(' ')[0])}</button>`;
          }).join('')}
        </div>
      ` : ''}

      ${groups.length === 0 ? `
        <div class="rv-empty">
          <div class="em">🌴</div>
          <div>Aucun créneau dispo pour le moment.<br>Reviens plus tard !</div>
        </div>
      ` : groups.map(([iso, items]) => `
        <div class="rv-day">
          <div class="rv-day-h">${esc(dayLabel(iso))}</div>
          <div class="rv-cards">
            ${items.map(renderCard).join('')}
          </div>
        </div>
      `).join('')}

      <div style="height:24px"></div>
    </div>

    <div class="rv-modal" id="rv-modal"><div class="rm-panel" id="rv-modal-panel"></div></div>
  `;

  wire();
}

function renderCard(d) {
  const monNom = monNomFor(d);
  const dur = parseFloat(d.dur) || 1;
  return `
    <div class="rv-card" data-id="${esc(d.id)}">
      <div class="rv-time">
        ${esc(d.h)}
        <span class="dur">${dur}h</span>
      </div>
      <div class="rv-mid">
        <div class="rv-av" style="background:${monColor(d.moniteur_id)}">${esc(monInitials(monNom))}</div>
        <div class="rv-info">
          <div class="rv-mon-nm">${esc(monNom)}</div>
          <div class="rv-lieu">${d.lieu ? `📍 ${esc(d.lieu)}` : `Lieu à confirmer`}</div>
        </div>
      </div>
      <div class="rv-cta">
        <button class="btn btn-p" data-book="${esc(d.id)}">Réserver</button>
      </div>
    </div>
  `;
}

function wire() {
  _root.querySelector('#rv-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/accueil');
  });

  _root.querySelectorAll('.rv-chip').forEach(c => {
    c.addEventListener('click', () => {
      _filterMonId = c.dataset.mon || null;
      render();
    });
  });

  _root.querySelectorAll('[data-book]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      openConfirm(b.dataset.book);
    });
  });

  const modal = _root.querySelector('#rv-modal');
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
}

// ─── Modal confirmation ───

function openConfirm(eventId) {
  const ev = _dispos.find(x => x.id === eventId);
  if (!ev) return;
  const monNom = monNomFor(ev);
  const dur = parseFloat(ev.dur) || 1;

  const panel = _root.querySelector('#rv-modal-panel');
  panel.innerHTML = `
    <div class="rm-h">
      <div class="em">📅</div>
      <div class="ti">Confirmer la réservation</div>
      <div class="sub">Le moniteur recevra une demande à valider.</div>
    </div>
    <div class="rm-info">
      <b>Moniteur</b> · ${esc(monNom)}<br>
      <b>Date</b> · ${esc(dayLabel(ev.date_event))}<br>
      <b>Heure</b> · ${esc(ev.h)} (${dur}h)<br>
      ${ev.lieu ? `<b>Lieu</b> · ${esc(ev.lieu)}` : '<b>Lieu</b> · à confirmer'}
    </div>
    <div class="rm-cta">
      <button class="btn" id="rm-cancel">Annuler</button>
      <button class="btn btn-p" id="rm-confirm">Réserver</button>
    </div>
  `;

  panel.querySelector('#rm-cancel').onclick = () => _root.querySelector('#rv-modal').classList.remove('show');

  panel.querySelector('#rm-confirm').onclick = async () => {
    const btn = panel.querySelector('#rm-confirm');
    btn.disabled = true; btn.textContent = '…';

    // 1. UPDATE event : dispo → pend + assign eleve
    const { error: upErr } = await sb.from('events').update({
      t: 'pend',
      eleve_id: _me.id,
      n: _me.nom,
    }).eq('id', ev.id).eq('t', 'dispo'); // garde-fou : ne marche que si toujours dispo

    if (upErr) {
      console.warn('[reservation] update err', upErr);
      toast('Erreur réservation', 'error');
      btn.disabled = false; btn.textContent = 'Réserver';
      return;
    }

    // 2. INSERT notification pour le moniteur (silencieusement, on log si erreur)
    if (ev.moniteur_id) {
      await sb.from('notifications').insert({
        user_id: ev.moniteur_id,
        type: 'info',
        title: `Nouvelle réservation de ${_me.nom}`,
        body: `${dayLabel(ev.date_event)} à ${ev.h} (${dur}h)${ev.lieu ? ' · ' + ev.lieu : ''}`,
      }).then(({ error }) => { if (error) console.warn('[reservation] notif err', error); });
    }

    _root.querySelector('#rv-modal').classList.remove('show');
    toast('Réservation envoyée ✓ — en attente de validation', 'success');
    await load();
    render();
  };

  _root.querySelector('#rv-modal').classList.add('show');
}
