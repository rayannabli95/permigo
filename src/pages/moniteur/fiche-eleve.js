/**
 * Page Fiche Élève (moniteur).
 *
 * Affiche pour un élève donné :
 *  - Header retour + nom + statut
 *  - 3 KPIs : heures faites/restantes, REMC validées, présence
 *  - Liste dernières leçons
 *  - Notes privées (textarea + save Supabase)
 *  - Boutons : Voir parcours REMC, Ajouter leçon, Évaluer
 *
 * Branchée sur Supabase :
 *  - profiles (élève cible)
 *  - events (filtrés sur eleve_id)
 *  - remc_entries (count par lv)
 *  - notes_priv (read + upsert)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { WEEK_DAYS, MONTHS_FR_SHORT, jsDayToWeekIdx } from '@/utils/format-date.js';
import { REMC_TOTAL } from '@/data/remc.js';
import { diagnostiqueFaiblesses, suggestionsComp, statutForfait } from '@/utils/diagnostic.js';

let _root, _eleve, _me;

/**
 * @param {HTMLElement} root
 * @param {string} eleveId — id du profil élève à afficher
 */
export async function mount(root, eleveId) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:20px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  // Fetch toutes les data en parallèle
  const [eleveRes, evtsRes, remcRes, notesRes] = await Promise.allSettled([
    sb.from('profiles').select('id, nom, email, tel, statut, code_statut, forfait_h, neph, dob, avatar_url').eq('id', eleveId).maybeSingle(),
    sb.from('events').select('*').eq('eleve_id', eleveId).eq('is_deleted', false).order('created_at', { ascending: false }),
    sb.from('remc_entries').select('lv').eq('eleve_id', eleveId),
    sb.from('notes_priv').select('contenu').eq('moniteur_id', _me.id).eq('eleve_id', eleveId).maybeSingle(),
  ]);

  _eleve = eleveRes.value?.data;
  if (!_eleve) { root.innerHTML = '<div style="padding:20px;color:#b91c1c">Élève introuvable</div>'; return; }

  const events = (evtsRes.value?.data) || [];
  const remc = (remcRes.value?.data) || [];
  const notesContenu = notesRes.value?.data?.contenu || '';

  const lecons = events.filter(e => e.t === 'conf' || e.t === 'lecon');
  const heuresDone = lecons.reduce((s, e) => s + (e.dur || 1), 0);
  const forfait = _eleve.forfait_h || 20;
  const restantes = Math.max(0, forfait - heuresDone);
  const acquises = remc.filter(r => r.lv === 'v').length;
  const pct = Math.round((acquises / REMC_TOTAL) * 100);
  const pendings = events.filter(e => e.t === 'pend').length;
  const presence = lecons.length > 0 ? Math.round((heuresDone / forfait) * 100) : 0;

  // ─── Diagnostic pédagogique + statut forfait ───
  const diag = diagnostiqueFaiblesses(remc);
  const suggestions = suggestionsComp(remc, 4);
  const forfaitStatus = statutForfait({ heuresFaites: heuresDone, forfaitH: forfait });

  root.innerHTML = render({
    eleve: _eleve, heuresDone, restantes, forfait, acquises, pct, presence,
    notesContenu, events: events.slice(0, 5), pendings,
    diag, suggestions, forfaitStatus,
  });

  wire();
}

function render({ eleve, heuresDone, restantes, forfait, acquises, pct, presence, notesContenu, events, pendings, diag, suggestions, forfaitStatus }) {
  return `
    <style>
      .fe-wrap{max-width:560px;margin:0 auto;padding:14px}
      .fe-top{display:flex;align-items:center;gap:10px;padding:6px 4px 16px}
      .fe-back{width:34px;height:34px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer}
      .fe-header{background:var(--su);border:1px solid var(--bo);border-radius:var(--rl);padding:18px 16px;margin-bottom:14px;box-shadow:var(--s1);display:flex;align-items:center;gap:14px}
      .fe-av{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:800;font-size:20px;flex-shrink:0;overflow:hidden;position:relative;box-shadow:0 4px 12px -2px rgba(99,102,241,.4)}
      .fe-av img{width:100%;height:100%;object-fit:cover;display:block}
      .fe-av-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
      .fe-h-body{flex:1;min-width:0}
      .fe-h-nm{font-family:var(--fd);font-size:20px;font-weight:800;letter-spacing:-.02em;line-height:1.1}
      .fe-h-meta{font-size:11px;color:var(--mu);margin-top:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .fe-h-meta .dot{width:3px;height:3px;border-radius:50%;background:var(--mu2)}
      .fe-h-stt{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:6px;background:var(--grp);color:var(--gr);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
      .fe-h-stt.ko{background:var(--rdp);color:var(--rd)}
      .fe-kpis{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px}
      .fe-kpi{background:var(--su);border:1px solid var(--bo);border-radius:10px;padding:12px;text-align:center;box-shadow:var(--s0)}
      .fe-kpi .v{font-family:var(--fd);font-size:22px;font-weight:800;letter-spacing:-.01em;line-height:1}
      .fe-kpi.h .v{color:var(--gr)} .fe-kpi.r .v{color:var(--a)} .fe-kpi.p .v{color:var(--am)}
      .fe-kpi .v small{font-size:11px;color:var(--mu);font-weight:700;margin-left:1px}
      .fe-kpi .k{font-size:9.5px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-top:5px}
      .fe-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
      .fe-section{background:var(--su);border:1px solid var(--bo);border-radius:var(--rl);overflow:hidden;margin-bottom:14px;box-shadow:var(--s0)}
      .fe-section-h{padding:13px 14px;border-bottom:1px solid var(--bo2);display:flex;align-items:center;justify-content:space-between}
      .fe-section-h .t{font-family:var(--fd);font-weight:700;font-size:13px}
      .fe-section-h .s{font-size:10.5px;color:var(--mu);font-weight:600}
      .fe-events{padding:4px 0}
      .fe-ev{padding:11px 14px;display:flex;align-items:center;gap:11px;border-bottom:1px solid var(--bo2)}
      .fe-ev:last-child{border-bottom:0}
      .fe-ev-h{font-family:var(--fn);font-size:11.5px;color:var(--a);font-weight:700;min-width:48px}
      .fe-ev-body{flex:1;min-width:0}
      .fe-ev-ti{font-weight:600;font-size:12.5px;letter-spacing:-.005em}
      .fe-ev-meta{font-size:10.5px;color:var(--mu);margin-top:2px}
      .fe-ev-stt{font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:5px}
      .fe-ev-stt.conf{background:var(--grp);color:var(--gr)} .fe-ev-stt.pend{background:var(--amp);color:var(--am)}
      .fe-empty{padding:24px 16px;text-align:center;color:var(--mu);font-size:12.5px}
      .fe-notes{padding:12px 14px}
      .fe-notes-templates{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
      .fe-tpl{padding:6px 11px;border-radius:99px;border:1px solid var(--bo);background:var(--bg2);font-family:inherit;font-size:11.5px;font-weight:600;color:var(--ink);cursor:pointer;transition:all .15s;letter-spacing:-.005em;white-space:nowrap}
      .fe-tpl:hover{background:var(--ap);border-color:var(--a);color:var(--a);transform:translateY(-1px)}
      .fe-tpl:active{transform:translateY(0)}
      .fe-notes textarea{width:100%;min-height:80px;padding:10px 12px;border:1px solid var(--bo);border-radius:8px;font-family:var(--fb);font-size:13px;color:var(--ink);resize:vertical;background:var(--su2)}
      .fe-notes textarea:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 3px var(--ap)}
      .fe-notes-foot{display:flex;align-items:center;justify-content:space-between;margin-top:8px;font-size:10.5px;color:var(--mu)}
    </style>

    <div class="fe-wrap anim-slide-up">

      <div class="fe-top">
        <button class="fe-back" id="fe-back" type="button" aria-label="Retour à la liste des élèves">‹</button>
        <div style="flex:1">
          <h1 style="font-family:var(--fd);font-size:18px;font-weight:800;margin:0">Fiche élève</h1>
          <div style="font-size:11px;color:var(--mu);margin-top:2px">${esc(eleve.code_statut || 'En cours')}</div>
        </div>
      </div>

      <div class="fe-header">
        <div class="fe-av">
          ${eleve.avatar_url
            ? `<img src="${esc(eleve.avatar_url)}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="fe-av-fb" style="display:none">${esc(initials(eleve.nom))}</span>`
            : `<span class="fe-av-fb">${esc(initials(eleve.nom))}</span>`}
        </div>
        <div class="fe-h-body">
          <div class="fe-h-nm">${esc(eleve.nom)}</div>
          <div class="fe-h-meta">
            <span class="fe-h-stt ${(eleve.statut || 'Actif') === 'Actif' ? '' : 'ko'}">${esc(eleve.statut || 'Actif')}</span>
            ${eleve.email ? `<span class="dot"></span><span>${esc(eleve.email)}</span>` : ''}
            ${eleve.tel ? `<span class="dot"></span><span>${esc(eleve.tel)}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="fe-kpis" role="list" aria-label="Indicateurs de progression">
        <div class="fe-kpi h" role="listitem" aria-label="${heuresDone} heures de conduite effectuées">
          <div class="v">${heuresDone}<small>h</small></div><div class="k">Faites</div>
        </div>
        <div class="fe-kpi r" role="listitem" aria-label="${restantes} heures restantes sur le forfait de ${forfait}">
          <div class="v">${restantes}<small>h</small></div><div class="k">Restantes</div>
        </div>
        <div class="fe-kpi p" role="listitem" aria-label="${pct} pour cent des compétences REMC acquises">
          <div class="v">${pct}<small>%</small></div><div class="k">REMC</div>
        </div>
      </div>

      <div class="fe-actions" role="group" aria-label="Actions sur la fiche élève">
        <button class="btn btn-p" id="fe-parcours" type="button">🗺️ Voir parcours</button>
        <button class="btn" id="fe-eval" type="button">📝 Évaluer</button>
      </div>

      <style>
        .fe-forfait-warn{background:linear-gradient(135deg,#fef3c7,#fde68a);border-left:4px solid #f59e0b;border-radius:10px;padding:12px 14px;margin-bottom:12px;display:flex;align-items:center;gap:12px;color:#92400e}
        .fe-forfait-warn.critical{background:linear-gradient(135deg,#fee2e2,#fecaca);border-left-color:#dc2626;color:#991b1b}
        .fe-forfait-warn .em{font-size:24px;line-height:1}
        .fe-forfait-warn .body{flex:1}
        .fe-forfait-warn .ti{font-family:var(--fd);font-weight:900;font-size:13.5px;letter-spacing:-.005em}
        .fe-forfait-warn .sub{font-size:11.5px;margin-top:2px;opacity:.85}
        .fe-diag{background:linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.04));border:1px solid var(--a);border-radius:14px;padding:14px 16px;margin-bottom:14px}
        .fe-diag-h{font-family:var(--fn);font-size:10.5px;font-weight:900;color:var(--a);letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:7px}
        .fe-diag-h .em{font-size:16px;line-height:1}
        .fe-diag-chips{display:flex;flex-wrap:wrap;gap:6px}
        .fe-diag-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;background:var(--su);border:1px solid var(--bo);border-radius:99px;font-size:11.5px;font-weight:700;color:var(--ink);max-width:100%}
        .fe-diag-chip .num{font-family:var(--fn);font-size:9.5px;font-weight:900;color:var(--a);padding-right:5px;border-right:1px solid var(--bo2);margin-right:1px}
        .fe-diag-chip .reason{font-family:var(--fn);font-size:9px;font-weight:800;color:var(--am);background:var(--amp);padding:2px 6px;border-radius:99px;margin-left:4px;letter-spacing:.3px;text-transform:uppercase}
        .fe-diag-chip .reason.review{color:var(--rd);background:var(--rdp)}
        .fe-diag-chip .reason.next{color:var(--gr);background:var(--grp)}
        .fe-diag-empty{font-size:12px;color:var(--mu);font-style:italic;padding:6px 0}
      </style>

      ${forfaitStatus.status !== 'ok' ? `
        <div class="fe-forfait-warn ${forfaitStatus.status === 'critical' ? 'critical' : ''}">
          <div class="em">${forfaitStatus.status === 'critical' ? '🚨' : '⚠️'}</div>
          <div class="body">
            <div class="ti">${forfaitStatus.status === 'critical' ? 'Forfait presque épuisé' : 'Forfait à surveiller'}</div>
            <div class="sub">${forfaitStatus.used}h utilisées sur ${forfaitStatus.total}h (${forfaitStatus.pct}%) · plus que ${forfaitStatus.restantes}h restantes${forfaitStatus.status === 'critical' ? ' — proposer un renouvellement' : ''}</div>
          </div>
        </div>
      ` : ''}

      <div class="fe-diag" aria-labelledby="fe-diag-title">
        <div class="fe-diag-h" id="fe-diag-title"><span class="em">🎯</span> À TRAVAILLER PROCHAINEMENT</div>
        ${suggestions.length === 0 ? `
          <div class="fe-diag-empty">Aucune suggestion — tout est à jour ou rien encore évalué.</div>
        ` : `
          <div class="fe-diag-chips">
            ${suggestions.map(s => {
              const cls = s.reason === 'À retravailler' ? 'review'
                : s.reason === 'Prochaine étape' ? 'next' : '';
              return `
                <span class="fe-diag-chip" title="${esc(s.n)}">
                  <span class="num">${esc(s.c)}</span>
                  ${esc(s.n.length > 28 ? s.n.slice(0, 26) + '…' : s.n)}
                  <span class="reason ${cls}">${esc(s.reason)}</span>
                </span>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <section class="fe-section" aria-labelledby="fe-events-title">
        <div class="fe-section-h">
          <div class="t" id="fe-events-title">Dernières leçons</div>
          <div class="s">${events.length}${pendings ? ` · ${pendings} en attente` : ''}</div>
        </div>
        <div class="fe-events" role="list">
          ${events.length === 0 ? `<div class="fe-empty" role="status">Aucune leçon enregistrée pour ${esc(eleve.nom.split(' ')[0])}</div>` :
            events.map(e => {
              const status = e.t === 'pend' ? 'En attente' : 'Confirmée';
              const aria = `${esc(e.h || 'horaire inconnu')} · ${esc(e.dur || 1)} heure${(e.dur||1) > 1 ? 's' : ''} · ${esc(e.lieu || 'lieu à définir')} · ${status}`;
              // Stats réelles geo-tracking si présentes
              const hasGeo = e.duree_reelle_min || e.distance_km;
              const geoBadge = hasGeo ? `<div style="margin-top:4px;display:inline-flex;align-items:center;gap:5px;padding:2px 7px;background:var(--ap);color:var(--a);border-radius:99px;font-family:var(--fn);font-size:9.5px;font-weight:800;letter-spacing:.3px">📍 ${e.duree_reelle_min || '?'}min${e.distance_km ? ' · ~' + e.distance_km + 'km' : ''}</div>` : '';
              return `
                <div class="fe-ev" role="listitem" aria-label="${aria}">
                  <div class="fe-ev-h" aria-hidden="true">${esc(e.h || '—')}</div>
                  <div class="fe-ev-body">
                    <div class="fe-ev-ti">${esc(e.lieu || 'Lieu à définir')}</div>
                    <div class="fe-ev-meta">${esc(e.dur || 1)}h · ${esc(e.comment || status)}</div>
                    ${geoBadge}
                  </div>
                  <span class="fe-ev-stt ${e.t === 'pend' ? 'pend' : 'conf'}" aria-hidden="true">${e.t === 'pend' ? '⏳' : '✅'}</span>
                </div>
              `;
            }).join('')
          }
        </div>
      </section>

      <section class="fe-section" aria-labelledby="fe-notes-title">
        <div class="fe-section-h">
          <div class="t" id="fe-notes-title">🔒 Notes privées</div>
          <div class="s">Non visible par l'élève</div>
        </div>
        <div class="fe-notes">
          <div class="fe-notes-templates" role="toolbar" aria-label="Insérer un commentaire rapide">
            <button type="button" class="fe-tpl" data-tpl="✓ Bonne séance, élève à l'écoute et progressant bien.">✓ Bonne séance</button>
            <button type="button" class="fe-tpl" data-tpl="⚠️ À retravailler : ">⚠️ À retravailler…</button>
            <button type="button" class="fe-tpl" data-tpl="❌ Problème de ponctualité aujourd'hui. À surveiller.">❌ Ponctualité</button>
            <button type="button" class="fe-tpl" data-tpl="🎯 Quasi prêt(e) pour l'examen — encore quelques séances.">🎯 Prêt examen</button>
            <button type="button" class="fe-tpl" data-tpl="🚧 Difficulté sur : ">🚧 Difficulté…</button>
            <button type="button" class="fe-tpl" data-tpl="💪 Très bonne maîtrise de : ">💪 Maîtrise…</button>
          </div>
          <label for="fe-notes-txt" class="sr-only">Notes privées sur ${esc(eleve.nom)} (max 500 caractères)</label>
          <textarea id="fe-notes-txt" maxlength="500" aria-describedby="fe-notes-count-wrap"
                    placeholder="Notes privées sur cet élève (forces, points à travailler, etc.)…">${esc(notesContenu)}</textarea>
          <div class="fe-notes-foot">
            <span id="fe-notes-count-wrap" aria-live="polite"><span id="fe-notes-count">${(notesContenu || '').length}</span>/500 caractères</span>
            <button class="btn btn-g btn-sm" id="fe-notes-save" type="button">Sauvegarder</button>
          </div>
        </div>
      </section>

    </div>
  `;
}

function initials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function wire() {
  _root.querySelector('#fe-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/mes-eleves');
  });

  _root.querySelector('#fe-parcours')?.addEventListener('click', async () => {
    // Réutilise la page parcours élève mais en mode "view" pour ce moniteur
    toast('Vue parcours élève (read-only) à venir 🚧');
  });

  _root.querySelector('#fe-eval')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/livret-remc', { id: _eleve.id });
  });

  const ta = _root.querySelector('#fe-notes-txt');
  const count = _root.querySelector('#fe-notes-count');
  ta?.addEventListener('input', () => { count.textContent = ta.value.length; });

  // Templates : insère le texte à la fin (avec retour à la ligne si déjà du contenu) + focus
  _root.querySelectorAll('.fe-tpl').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ta) return;
      const tpl = btn.dataset.tpl || '';
      const cur = ta.value.trim();
      const sep = cur ? '\n' : '';
      const next = (cur + sep + tpl).slice(0, 500);
      ta.value = next;
      count.textContent = next.length;
      ta.focus();
      // Place le curseur à la fin (utile si template avec "... : " à compléter)
      ta.setSelectionRange(next.length, next.length);
    });
  });

  _root.querySelector('#fe-notes-save')?.addEventListener('click', async () => {
    const contenu = ta.value;
    const { error } = await sb.from('notes_priv').upsert({
      moniteur_id: _me.id,
      eleve_id: _eleve.id,
      contenu,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'moniteur_id,eleve_id' });
    if (error) { console.warn('[notes]', error); toast('Erreur sauvegarde', 'error'); return; }
    toast('Notes sauvegardées 💾', 'success');
  });
}
