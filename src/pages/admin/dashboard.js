/**
 * Page Dashboard Admin / Gérant — vue d'ensemble de l'auto-école.
 *
 * SIMPLE & PRAGMATIQUE — les chiffres qu'un gérant regarde tous les matins.
 *
 * Sections :
 *  - 4 KPIs : CA estimé du mois, Élèves actifs, Leçons cette semaine, Réservations en attente
 *  - Équipe : cards moniteurs avec heures planifiées (semaine) + nb élèves
 *  - Activité récente : 5 dernières actions (réservations + évals)
 *
 * Branchée sur Supabase (admin voit tout via RLS) :
 *  - profiles, events, lesson_reviews, notifications
 */

import { sb, logout } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { addDays, weekStart, isoDate, WEEK_DAYS, MONTHS_FR_SHORT } from '@/utils/format-date.js';
import { mountNotifBell } from '@/components/notif-bell.js';

const PRIX_LECON_H = 50; // €/h — tarif par défaut, à brancher sur réglages plus tard

let _root, _me;

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  // ── Fetch en parallèle ──
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartISO = isoDate(monthStart);
  const weekStartISO = isoDate(weekStart(now));
  const weekEndISO = isoDate(addDays(weekStart(now), 6));

  const [profilesRes, eventsMonthRes, eventsWeekRes, pendRes, reviewsRes, notifsRes, notatRes] = await Promise.allSettled([
    sb.from('profiles').select('id, nom, email, role, statut, code_statut'),
    sb.from('events')
      .select('id, t, dur, date_event, moniteur_id, eleve_id, h, lieu')
      .eq('is_deleted', false)
      .gte('date_event', monthStartISO),
    sb.from('events')
      .select('id, t, dur, date_event, moniteur_id, eleve_id')
      .eq('is_deleted', false)
      .gte('date_event', weekStartISO)
      .lte('date_event', weekEndISO),
    sb.from('events')
      .select('id, h, dur, lieu, date_event, moniteur_id, eleve_id, n, mon_nom')
      .eq('t', 'pend')
      .eq('is_deleted', false),
    sb.from('lesson_reviews')
      .select('id, note, commentaire, comp_ids, created_at, moniteur_id, eleve_id')
      .order('created_at', { ascending: false })
      .limit(10),
    sb.from('notifications').select('id, title, body, created_at').order('created_at', { ascending: false }).limit(10),
    sb.from('notations').select('moniteur_id, note'),
  ]);

  const profiles = profilesRes.value?.data || [];
  const eventsMonth = eventsMonthRes.value?.data || [];
  const eventsWeek = eventsWeekRes.value?.data || [];
  const pendEvents = pendRes.value?.data || [];
  const reviews = reviewsRes.value?.data || [];
  const notations = notatRes.value?.data || [];

  // ── Calculs ──
  const eleves = profiles.filter(p => p.role === 'eleve');
  const moniteurs = profiles.filter(p => p.role === 'moniteur');
  const elevesActifs = eleves.filter(e => (e.statut || 'Actif') === 'Actif').length;

  // CA estimé du mois : on compte les leçons confirmées (conf) + Leçon
  const lessonsMonth = eventsMonth.filter(e => isLesson(e.t));
  const heuresMonth = lessonsMonth.reduce((s, e) => s + (parseFloat(e.dur) || 1), 0);
  const ca = Math.round(heuresMonth * PRIX_LECON_H);

  // Leçons cette semaine
  const lessonsWeek = eventsWeek.filter(e => isLesson(e.t));
  const lessonsWeekCount = lessonsWeek.length;

  // Réservations en attente
  const pendCount = pendEvents.length;

  // Par moniteur — heures de la semaine + nb élèves uniques + assiduité (notations)
  const moniteurStats = moniteurs.map(m => {
    const evs = eventsWeek.filter(e => e.moniteur_id === m.id);
    const lecons = evs.filter(e => isLesson(e.t));
    const dispos = evs.filter(e => (e.t || '').toLowerCase() === 'dispo');
    const heuresLecons = lecons.reduce((s, e) => s + (parseFloat(e.dur) || 1), 0);
    const heuresDispos = dispos.reduce((s, e) => s + (parseFloat(e.dur) || 1), 0);
    const elevesUniques = new Set(lecons.map(e => e.eleve_id).filter(Boolean)).size;
    // Assiduité = note moyenne des avis élèves (table notations)
    const monNotations = notations.filter(n => n.moniteur_id === m.id);
    const totalNotat = monNotations.length;
    const avgNotat = totalNotat ? monNotations.reduce((s, n) => s + (n.note || 0), 0) / totalNotat : null;
    return { ...m, heuresLecons, heuresDispos, elevesUniques, lecons: lecons.length, avgNotat, totalNotat };
  });

  // Activité récente : merge reviews + réservations en attente, sorted by date desc
  const activity = [
    ...reviews.map(r => ({
      type: 'review',
      date: r.created_at,
      moniteurId: r.moniteur_id,
      eleveId: r.eleve_id,
      payload: r,
    })),
    ...pendEvents.map(p => ({
      type: 'pend',
      date: p.date_event + 'T' + (p.h || '00:00'),
      moniteurId: p.moniteur_id,
      eleveId: p.eleve_id,
      payload: p,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const profileNom = (id) => profiles.find(p => p.id === id)?.nom || '—';

  root.innerHTML = render({
    me: _me,
    ca, heuresMonth,
    elevesActifs, elevesTotal: eleves.length,
    lessonsWeekCount,
    pendCount,
    moniteurStats,
    activity,
    profileNom,
    period: monthLabel(monthStart),
  });

  wire();
}

// ─── Helpers ───

function isLesson(t) {
  const s = (t || '').toLowerCase();
  return s === 'conf' || s === 'leçon' || s === 'lecon';
}

function monthLabel(d) {
  return `${MONTHS_FR_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function initials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `il y a ${j}j`;
  return d.toLocaleDateString('fr-FR');
}

// ─── Rendu ───

function render({ me, ca, heuresMonth, elevesActifs, elevesTotal, lessonsWeekCount, pendCount, moniteurStats, activity, profileNom, period }) {
  return `
    <style>
      /* Background premium */
      .ad-bg{position:fixed;inset:0;z-index:0;background:#0b0d1a;overflow:hidden;pointer-events:none}
      .ad-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,#6366f1 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,#8b5cf6 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,#0891b2 0%,transparent 40%);filter:blur(60px);opacity:.5;animation:ad-float 22s ease-in-out infinite alternate}
      @keyframes ad-float{0%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(40px,-30px) rotate(180deg) scale(1.08)}100%{transform:translate(-30px,40px) rotate(360deg) scale(.96)}}
      .ad-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,transparent 0%,rgba(11,13,26,.5) 100%)}
      .ad-grid{position:fixed;inset:0;z-index:1;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;pointer-events:none;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}

      .ad-wrap{max-width:1100px;margin:0 auto;padding:14px;position:relative;z-index:2;min-height:100vh}
      .ad-top{display:flex;align-items:center;gap:10px;padding:14px 4px 22px}
      .ad-top .ttl{font-family:var(--fd);font-weight:800;font-size:26px;letter-spacing:-.02em;color:#fff}
      .ad-top .sub{font-size:12px;color:rgba(255,255,255,.55);margin-top:3px}
      .ad-top-r{margin-left:auto;display:flex;align-items:center;gap:8px}

      /* Glassmorphism cards */
      .ad-glass{background:rgba(255,255,255,.05);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1);box-shadow:0 8px 32px -8px rgba(0,0,0,.4)}

      .ad-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:26px}
      @media (max-width:720px){.ad-kpis{grid-template-columns:1fr 1fr}}
      .ad-kpi{border-radius:var(--rl);padding:16px 18px;position:relative;overflow:hidden;background:rgba(255,255,255,.05);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1);box-shadow:0 8px 32px -8px rgba(0,0,0,.4)}
      .ad-kpi .lbl{font-size:10px;font-weight:800;color:rgba(255,255,255,.55);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px}
      .ad-kpi .v{font-family:var(--fd);font-size:30px;font-weight:900;letter-spacing:-.02em;line-height:1;color:#fff}
      .ad-kpi .v small{font-size:14px;color:rgba(255,255,255,.55);font-weight:700;margin-left:2px}
      .ad-kpi .foot{font-size:11px;color:rgba(255,255,255,.55);margin-top:8px;font-weight:600}
      .ad-kpi.ca{background:linear-gradient(135deg,rgba(16,185,129,.85),rgba(5,150,105,.85));border-color:rgba(16,185,129,.3)}
      .ad-kpi.ca .lbl,.ad-kpi.ca .v,.ad-kpi.ca .v small,.ad-kpi.ca .foot{color:#fff}
      .ad-kpi.pend{background:linear-gradient(135deg,rgba(245,158,11,.85),rgba(217,119,6,.85));border-color:rgba(245,158,11,.3)}
      .ad-kpi.pend .lbl,.ad-kpi.pend .v,.ad-kpi.pend .v small,.ad-kpi.pend .foot{color:#fff}

      .ad-section-h{font-family:var(--fd);font-size:11.5px;font-weight:800;margin:0 0 10px;padding:0 4px;text-transform:uppercase;color:rgba(255,255,255,.5);letter-spacing:1.5px}

      .ad-team{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:26px}
      @media (max-width:900px){.ad-team{grid-template-columns:1fr 1fr}}
      @media (max-width:560px){.ad-team{grid-template-columns:1fr}}
      .ad-mon{border-radius:var(--rl);padding:14px;display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.05);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1);transition:transform .15s,border-color .15s}
      .ad-mon:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.2)}
      .ad-mon-av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4338ca);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:800;font-size:14px;flex-shrink:0;box-shadow:0 4px 12px -2px rgba(99,102,241,.5)}
      .ad-mon-body{flex:1;min-width:0}
      .ad-mon-nm{font-family:var(--fd);font-weight:700;font-size:13.5px;letter-spacing:-.005em;color:#fff;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .ad-mon-assid{display:inline-flex;align-items:center;gap:3px;font-family:var(--fn);font-size:11px;font-weight:800;color:#fbbf24;background:rgba(245,158,11,.15);padding:2px 7px;border-radius:99px;border:1px solid rgba(245,158,11,.3);letter-spacing:.2px}
      .ad-mon-meta{font-size:11px;color:rgba(255,255,255,.45);margin-top:4px}
      .ad-mon-stats{display:flex;gap:10px;margin-top:6px}
      .ad-mon-stat{font-size:11px;color:rgba(255,255,255,.5)}
      .ad-mon-stat b{font-family:var(--fn);font-weight:800;color:#fff;font-size:13px}
      .ad-mon-stat .s{margin-left:2px}

      .ad-activity{border-radius:var(--rl);overflow:hidden;margin-bottom:22px;background:rgba(255,255,255,.05);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1)}
      .ad-act{padding:13px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,.06)}
      .ad-act:last-child{border-bottom:0}
      .ad-act-em{width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
      .ad-act-em.review{background:rgba(245,158,11,.2);border:1px solid rgba(245,158,11,.3)}
      .ad-act-em.pend{background:rgba(99,102,241,.2);border:1px solid rgba(99,102,241,.3)}
      .ad-act-body{flex:1;min-width:0}
      .ad-act-ti{font-size:12.5px;font-weight:600;color:#fff}
      .ad-act-sub{font-size:11px;color:rgba(255,255,255,.5);margin-top:2px}
      .ad-act-dt{font-size:10.5px;color:rgba(255,255,255,.4);font-family:var(--fn);font-weight:700;flex-shrink:0}
      .ad-empty{padding:28px 16px;text-align:center;color:rgba(255,255,255,.45);font-size:12.5px}

      /* Bouton logout adapté au dark */
      #ad-logout{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff}
      #ad-logout:hover{background:rgba(255,255,255,.14)}
    </style>

    <div class="ad-bg"></div>
    <div class="ad-grid"></div>

    <div class="ad-wrap anim-slide-up">

      <div class="ad-top">
        <span class="pg-logo-txt">PermiGo</span>
        <div>
          <div class="ttl">Tableau de bord</div>
          <div class="sub">${esc(me.nom)} · gérant · ${esc(period)}</div>
        </div>
        <div class="ad-top-r">
          <span id="ad-bell"></span>
          <button class="btn btn-sm" id="ad-logout" title="Se déconnecter" style="height:36px">⏻</button>
        </div>
      </div>

      <!-- 4 KPIs -->
      <div class="ad-kpis">
        <div class="ad-kpi ca">
          <div class="lbl">💰 Chiffre d'affaires</div>
          <div class="v">${ca.toLocaleString('fr-FR')}<small> €</small></div>
          <div class="foot">${heuresMonth}h facturables ce mois</div>
        </div>
        <div class="ad-kpi">
          <div class="lbl">👥 Élèves actifs</div>
          <div class="v">${elevesActifs}<small> / ${elevesTotal}</small></div>
          <div class="foot">${elevesActifs ? Math.round(elevesActifs / elevesTotal * 100) : 0}% du portefeuille actif</div>
        </div>
        <div class="ad-kpi">
          <div class="lbl">📅 Leçons cette semaine</div>
          <div class="v">${lessonsWeekCount}</div>
          <div class="foot">tous moniteurs confondus</div>
        </div>
        <div class="ad-kpi pend">
          <div class="lbl">⏳ À valider</div>
          <div class="v">${pendCount}</div>
          <div class="foot">réservation${pendCount > 1 ? 's' : ''} en attente</div>
        </div>
      </div>

      <!-- Équipe -->
      <div class="ad-section-h">Équipe (${moniteurStats.length} moniteur${moniteurStats.length > 1 ? 's' : ''})</div>
      <div class="ad-team">
        ${moniteurStats.length === 0 ? `<div class="ad-empty" style="grid-column:1/-1">Aucun moniteur</div>` :
          moniteurStats.map(m => `
            <div class="ad-mon">
              <div class="ad-mon-av">${esc(initials(m.nom))}</div>
              <div class="ad-mon-body">
                <div class="ad-mon-nm">${esc(m.nom)}${m.avgNotat !== null ? `<span class="ad-mon-assid" title="${m.totalNotat} avis anonymes">⭐ ${m.avgNotat.toFixed(1)} <span style="opacity:.6">· ${m.totalNotat}</span></span>` : ''}</div>
                <div class="ad-mon-meta">${esc(m.email || '')}</div>
                <div class="ad-mon-stats">
                  <div class="ad-mon-stat"><b>${m.heuresLecons}</b><span class="s">h leçons</span></div>
                  <div class="ad-mon-stat"><b>${m.heuresDispos}</b><span class="s">h dispos</span></div>
                  <div class="ad-mon-stat"><b>${m.elevesUniques}</b><span class="s">élève${m.elevesUniques > 1 ? 's' : ''}</span></div>
                </div>
              </div>
            </div>
          `).join('')}
      </div>

      <!-- Activité récente -->
      <div class="ad-section-h">Activité récente</div>
      <div class="ad-activity">
        ${activity.length === 0 ? `<div class="ad-empty">Aucune activité récente</div>` :
          activity.map(a => {
            if (a.type === 'review') {
              const r = a.payload;
              return `
                <div class="ad-act">
                  <div class="ad-act-em review">📝</div>
                  <div class="ad-act-body">
                    <div class="ad-act-ti">Évaluation ${'★'.repeat(r.note)}${'☆'.repeat(5-r.note)}</div>
                    <div class="ad-act-sub">${esc(profileNom(r.moniteur_id))} → ${esc(profileNom(r.eleve_id))} · ${(r.comp_ids||[]).length} comp validée${(r.comp_ids||[]).length > 1 ? 's' : ''}</div>
                  </div>
                  <div class="ad-act-dt">${timeAgo(a.date)}</div>
                </div>
              `;
            } else {
              const p = a.payload;
              return `
                <div class="ad-act">
                  <div class="ad-act-em pend">⏳</div>
                  <div class="ad-act-body">
                    <div class="ad-act-ti">Réservation en attente</div>
                    <div class="ad-act-sub">${esc(profileNom(p.eleve_id) || p.n || '—')} → ${esc(profileNom(p.moniteur_id) || p.mon_nom || '—')} · ${esc(p.date_event)} ${esc(p.h)}</div>
                  </div>
                  <div class="ad-act-dt">${esc(p.date_event)}</div>
                </div>
              `;
            }
          }).join('')}
      </div>

      <div style="height:24px"></div>
    </div>
  `;
}

function wire() {
  // Cloche notifs
  const bellHost = _root.querySelector('#ad-bell');
  if (bellHost) mountNotifBell(bellHost);

  _root.querySelector('#ad-logout')?.addEventListener('click', async () => {
    await logout();
    const { navigate } = await import('@/router.js');
    navigate('/');
  });
}
