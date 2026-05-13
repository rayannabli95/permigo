/**
 * Page Mes Avis (moniteur) — affiche les notations reçues, ANONYMEMENT.
 *
 * - Header retour + titre "Mes avis"
 * - Hero KPI : note moyenne (gros), nb avis, barres % par étoile (5★ à 1★)
 * - Liste des avis : juste note + commentaire + date — PAS de nom d'élève
 *
 * Branchée sur Supabase :
 *  - notations (SELECT moniteur_id = me.id) — RLS le permet
 *  - On ignore volontairement le champ eleve_id côté UI (anonymat)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { mountNotifBell } from '@/components/notif-bell.js';

let _root, _me;

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  const { data, error } = await sb.from('notations')
    .select('id, note, comment, created_at')
    .eq('moniteur_id', _me.id)
    .order('created_at', { ascending: false });

  if (error) { console.warn('[avis]', error); toast('Erreur DB', 'error'); }
  const avis = data || [];

  // Stats
  const total = avis.length;
  const sum = avis.reduce((s, a) => s + (a.note || 0), 0);
  const avg = total ? (sum / total) : 0;
  const dist = [0, 0, 0, 0, 0]; // index 0 = 1★, index 4 = 5★
  avis.forEach(a => { if (a.note >= 1 && a.note <= 5) dist[a.note - 1]++; });

  root.innerHTML = render({ me: _me, avg, total, dist, avis });
  wire();
}

function render({ me, avg, total, dist, avis }) {
  const stars = (n, full = true) => '★'.repeat(n) + (full ? '☆'.repeat(5 - n) : '');
  return `
    <style>
      .av-wrap{max-width:560px;margin:0 auto;padding:14px}
      .av-top{display:flex;align-items:center;gap:10px;padding:6px 4px 14px}
      .av-back{width:34px;height:34px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer}
      .av-top .ttl{font-family:var(--fd);font-weight:800;font-size:20px;letter-spacing:-.02em}
      .av-top .sub{font-size:11px;color:var(--mu);margin-top:2px}
      .av-top-r{margin-left:auto;display:flex;align-items:center;gap:8px}

      .av-hero{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-radius:var(--rx);padding:22px;margin-bottom:18px;box-shadow:var(--s2);display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:center}
      .av-avg{font-family:var(--fd);font-size:62px;font-weight:900;line-height:1;letter-spacing:-.04em;text-align:center}
      .av-avg small{font-size:22px;opacity:.7;margin-left:2px;font-weight:700}
      .av-avg-stars{font-size:14px;letter-spacing:2px;margin-top:4px;opacity:.95;text-align:center;font-family:var(--fn)}
      .av-avg-sub{font-size:11px;opacity:.85;text-align:center;margin-top:4px;font-weight:600;letter-spacing:.6px;text-transform:uppercase}
      .av-bars{display:flex;flex-direction:column;gap:6px}
      .av-bar{display:grid;grid-template-columns:24px 1fr 32px;gap:8px;align-items:center;font-size:11px}
      .av-bar .lbl{opacity:.85;font-family:var(--fn);font-weight:700}
      .av-bar .b{height:6px;background:rgba(255,255,255,.18);border-radius:99px;overflow:hidden}
      .av-bar .b i{display:block;height:100%;background:#fff;border-radius:99px;transition:width .8s ease}
      .av-bar .v{text-align:right;font-family:var(--fn);font-weight:700;opacity:.85}

      .av-sec-h{font-family:var(--fd);font-size:13px;font-weight:800;color:var(--mu);text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;padding:0 4px}
      .av-list{display:flex;flex-direction:column;gap:10px}
      .av-item{background:var(--su);border:1px solid var(--bo);border-radius:var(--rl);padding:14px 16px;box-shadow:var(--s0)}
      .av-item .row1{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
      .av-item .stars{font-family:var(--fn);font-size:16px;color:#f59e0b;letter-spacing:2px;font-weight:800}
      .av-item .dt{font-size:10.5px;color:var(--mu);font-family:var(--fn);font-weight:700}
      .av-item .cm{font-size:13px;color:var(--ink);line-height:1.5;font-style:italic;margin-top:4px}
      .av-item .cm::before{content:'«'}.av-item .cm::after{content:'»'}
      .av-item .nocm{font-size:12px;color:var(--mu2);font-style:italic;margin-top:4px}
      .av-empty{text-align:center;padding:50px 20px;color:var(--mu);font-size:13.5px}
      .av-empty .em{font-size:38px;margin-bottom:8px}
      .av-anon{font-size:11px;color:var(--mu);background:var(--bg2);padding:8px 12px;border-radius:8px;margin-bottom:14px;display:flex;align-items:center;gap:8px;border:1px solid var(--bo2)}
    </style>

    <div class="av-wrap anim-slide-up">
      <div class="av-top">
        <button class="av-back" id="av-back" aria-label="Retour">‹</button>
        <div>
          <div class="ttl">⭐ Mes avis</div>
          <div class="sub">${esc(me.nom)}</div>
        </div>
        <div class="av-top-r">
          <span id="av-bell"></span>
        </div>
      </div>

      ${total === 0 ? `
        <div class="av-empty">
          <div class="em">⭐</div>
          <div>Aucun avis pour le moment.<br><span style="font-size:12px">Tes élèves pourront te noter après leurs leçons.</span></div>
        </div>
      ` : `
        <div class="av-hero">
          <div>
            <div class="av-avg">${avg.toFixed(1)}<small>/5</small></div>
            <div class="av-avg-stars">${stars(Math.round(avg))}</div>
            <div class="av-avg-sub">${total} avis</div>
          </div>
          <div class="av-bars">
            ${[5,4,3,2,1].map(n => {
              const c = dist[n - 1];
              const pct = total ? Math.round(c / total * 100) : 0;
              return `
                <div class="av-bar">
                  <span class="lbl">${n}★</span>
                  <div class="b"><i style="width:${pct}%"></i></div>
                  <span class="v">${c}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="av-anon">🔒 Tous les avis sont anonymes. Tu ne peux pas savoir quel élève a écrit quoi.</div>

        <div class="av-sec-h">Les avis (${total})</div>
        <div class="av-list">
          ${avis.map(a => `
            <div class="av-item">
              <div class="row1">
                <div class="stars">${stars(a.note || 0)}</div>
                <div class="dt">${new Date(a.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
              ${a.comment
                ? `<div class="cm">${esc(a.comment)}</div>`
                : `<div class="nocm">(Pas de commentaire — note seule)</div>`}
            </div>
          `).join('')}
        </div>
      `}

      <div style="height:24px"></div>
    </div>
  `;
}

function wire() {
  const bellHost = _root.querySelector('#av-bell');
  if (bellHost) mountNotifBell(bellHost);

  _root.querySelector('#av-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/mes-eleves');
  });
}
