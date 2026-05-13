/**
 * Page Aujourd'hui (moniteur) — vue centrée sur le jour en cours.
 *
 * Sections :
 *  - Hero : date + résumé (X leçons, Yh, livrets à remplir)
 *  - Card "EN COURS" (si leçon active)
 *  - Cards "ICI" : timeline des leçons du jour (passées + à venir)
 *  - Section "Livrets en retard" si présents
 *  - Section "Demain" preview (3 leçons)
 *  - FAB "+ Nouvelle dispo" en bas
 *
 * Branchée Supabase events + profiles + lesson_reviews.
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { mountNotifBell } from '@/components/notif-bell.js';
import { addDays, isoDate, WEEK_DAYS_FULL, MONTHS_FR_SHORT, jsDayToWeekIdx } from '@/utils/format-date.js';
import { countUpAll } from '@/utils/count-up.js';
import { startLecon, endLecon, isActive } from '@/services/geo-tracking.js';
import { renderUserListCard, wireUserListCard, USER_LIST_CARD_CSS } from '@/components/user-list-card.js';
import { showAlertCardModal } from '@/components/alert-card.js';

let _root, _me;
let _eventsToday = [];
let _eventsTomorrow = [];
let _eleves = [];
let _mesEleves = []; // élèves uniques avec stats (dernière leçon, nb leçons)
let _refreshTimer = null;

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = isoDate(today);
  const tomorrowIso = isoDate(addDays(today, 1));

  // Fetch leçons passées des 90 derniers jours pour calcul statut élèves
  const past90 = isoDate(addDays(today, -90));

  const [evtTRes, evtTomRes, profRes, evtPastRes] = await Promise.allSettled([
    sb.from('events')
      .select('id, h, d, t, dur, lieu, comment, eleve_id, mon_nom, n, date_event, livret_rempli, numero_heure_eleve, started_at, ended_at, distance_km, duree_reelle_min')
      .eq('moniteur_id', _me.id)
      .eq('is_deleted', false)
      .eq('date_event', todayIso)
      .order('h'),
    sb.from('events')
      .select('id, h, t, dur, lieu, eleve_id, n, date_event, numero_heure_eleve')
      .eq('moniteur_id', _me.id)
      .eq('is_deleted', false)
      .eq('date_event', tomorrowIso)
      .order('h')
      .limit(3),
    sb.from('profiles').select('id, nom, avatar_url').eq('role', 'eleve'),
    sb.from('events')
      .select('eleve_id, date_event, t, dur')
      .eq('moniteur_id', _me.id)
      .eq('is_deleted', false)
      .gte('date_event', past90)
      .lt('date_event', todayIso),
  ]);

  _eventsToday = evtTRes.value?.data || [];
  _eventsTomorrow = evtTomRes.value?.data || [];
  _eleves = profRes.value?.data || [];

  // Calcul "Mes élèves" : groupement par eleve_id + dernière leçon + nb leçons
  const pastEv = (evtPastRes.value?.data || []).filter(e => e.eleve_id && isLecon(e.t));
  const byEleve = new Map();
  for (const e of pastEv) {
    const cur = byEleve.get(e.eleve_id) || { count: 0, lastDate: null, hours: 0 };
    cur.count++;
    cur.hours += parseFloat(e.dur) || 0;
    if (!cur.lastDate || e.date_event > cur.lastDate) cur.lastDate = e.date_event;
    byEleve.set(e.eleve_id, cur);
  }
  _mesEleves = Array.from(byEleve.entries())
    .map(([id, st]) => {
      const prof = _eleves.find(p => p.id === id);
      return { id, nom: prof?.nom || '?', avatar_url: prof?.avatar_url, ...st };
    })
    .sort((a, b) => (b.lastDate || '').localeCompare(a.lastDate || ''))
    .slice(0, 10);

  render();
  startAutoRefresh();
  checkLivretsObligatoires();
}

/** Affiche une alert OBLIGATOIRE au mount si des livrets sont en retard.
 *  L'enseignant doit cliquer "Remplir maintenant" → renvoie vers planning sur la 1ère leçon. */
function checkLivretsObligatoires() {
  const lecons = _eventsToday.filter(e => isLecon(e.t));
  const livretsRetard = lecons.filter(e => {
    const { endMin } = eventTimeRange(e);
    return (e.t || '').toLowerCase() === 'conf' && endMin < nowMin() && !e.livret_rempli;
  });

  // Skip si aucune en retard OU si déjà acquittée pour aujourd'hui (sessionStorage)
  if (livretsRetard.length === 0) return;
  const ackKey = `livret-ack-${_me.id}-${isoDate(new Date())}`;
  if (sessionStorage.getItem(ackKey)) return;

  const firstId = livretsRetard[0].id;
  const eleveNom = eleveNomFor(livretsRetard[0]);
  showAlertCardModal({
    variant: 'danger',
    icon: 'book',
    title: livretsRetard.length === 1
      ? 'Livret à remplir'
      : `${livretsRetard.length} livrets à remplir`,
    description: livretsRetard.length === 1
      ? `La leçon avec ${eleveNom} est terminée. Remplissez son livret avant de quitter — c'est une étape obligatoire.`
      : `Plusieurs leçons sont terminées sans livret rempli. Commencez par celle de ${eleveNom}.`,
    buttonText: 'Remplir maintenant',
    dismissible: false,
    onAction: async () => {
      sessionStorage.setItem(ackKey, '1');
      const { navigate } = await import('@/router.js');
      navigate('/planning', { openLivret: firstId });
    },
  });
}

export function unmount() {
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
}

function startAutoRefresh() {
  if (_refreshTimer) clearInterval(_refreshTimer);
  // Toutes les 60s : re-render pour mettre à jour current/upcoming/past + timer décompte
  _refreshTimer = setInterval(() => {
    if (!_root || !document.body.contains(_root)) {
      clearInterval(_refreshTimer); _refreshTimer = null;
      return;
    }
    render();
  }, 60 * 1000);
}

// ─── Helpers ───
function isLecon(t) {
  const s = (t || '').toLowerCase();
  return s === 'conf' || s === 'lecon' || s === 'leçon' || s === 'pend';
}

function eleveNomFor(e) {
  if (e.eleve_id) {
    const p = _eleves.find(x => x.id === e.eleve_id);
    return p?.nom || e.n || '—';
  }
  return e.n || '';
}

function avatarHtml(e) {
  const p = _eleves.find(x => x.id === e.eleve_id);
  const nom = p?.nom || e.n || '?';
  const init = nom.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  if (p?.avatar_url) {
    return `<img src="${esc(p.avatar_url)}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="aujr-av-fb" style="display:none">${esc(init)}</span>`;
  }
  return `<span class="aujr-av-fb">${esc(init)}</span>`;
}

function nowMin() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function eventTimeRange(e) {
  const [hh, mm] = String(e.h || '00:00').split(':').map(Number);
  const startMin = hh * 60 + (mm || 0);
  const endMin = startMin + Math.round((parseFloat(e.dur) || 1) * 60);
  return { startMin, endMin };
}

function categorize(e) {
  const { startMin, endMin } = eventTimeRange(e);
  const m = nowMin();
  if (startMin <= m && endMin > m && isLecon(e.t)) return 'current';
  if (startMin > m) return 'upcoming';
  return 'past';
}

function daysSince(iso) {
  if (!iso) return 999;
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today - d) / 86400000));
}

function todayLabel() {
  const d = new Date();
  return `${WEEK_DAYS_FULL[jsDayToWeekIdx(d.getDay())]} ${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]}`;
}

// ─── Render ───
function render() {
  const lecons = _eventsToday.filter(e => isLecon(e.t));
  const heures = lecons.reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const livretsRetard = lecons.filter(e => {
    const { endMin } = eventTimeRange(e);
    return (e.t || '').toLowerCase() === 'conf' && endMin < nowMin() && !e.livret_rempli;
  });

  const current = _eventsToday.find(e => categorize(e) === 'current');
  const upcoming = _eventsToday.filter(e => categorize(e) === 'upcoming');
  const past = _eventsToday.filter(e => categorize(e) === 'past');

  _root.innerHTML = `
    <style>
      .aujr-wrap{max-width:580px;margin:0 auto;padding:14px;padding-bottom:90px}
      .aujr-top{display:flex;align-items:center;gap:12px;padding:8px 4px 16px}
      .aujr-back{width:36px;height:36px;border-radius:10px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer;color:var(--ink)}
      .aujr-top h1{font-family:var(--fd);font-size:22px;font-weight:900;letter-spacing:-.02em;margin:0}
      .aujr-top .sub{font-size:12px;color:var(--mu);margin-top:2px;text-transform:capitalize}
      .aujr-top-r{margin-left:auto;display:flex;align-items:center;gap:6px}

      /* Hero summary */
      .aujr-hero{background:linear-gradient(135deg,#6366f1 0%,#4338ca 50%,#1e1b4b 100%);color:#fff;border-radius:18px;padding:18px 20px;margin-bottom:16px;box-shadow:0 14px 32px -10px rgba(99,102,241,.5);position:relative;overflow:hidden}
      .aujr-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 100% 0%,rgba(167,139,250,.3),transparent 50%);pointer-events:none}
      .aujr-hero-lbl{font-family:var(--fn);font-size:10px;font-weight:800;color:rgba(255,255,255,.7);letter-spacing:.3em;text-transform:uppercase;margin-bottom:4px;position:relative;z-index:1}
      .aujr-hero h2{font-family:var(--fd);font-size:24px;font-weight:900;letter-spacing:-.02em;margin:0;line-height:1.1;position:relative;z-index:1}
      .aujr-hero-stats{display:flex;gap:18px;margin-top:14px;position:relative;z-index:1}
      .aujr-hs{flex:1}
      .aujr-hs .v{font-family:var(--fd);font-size:22px;font-weight:900;line-height:1}
      .aujr-hs .v small{font-size:13px;opacity:.7;font-weight:700;margin-left:1px}
      .aujr-hs .l{font-size:10.5px;color:rgba(255,255,255,.7);font-weight:700;letter-spacing:.2px;margin-top:3px}

      /* Card "Prochaine leçon" avec compte à rebours */
      .aujr-next{background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 60%,#0c1e4f 100%);color:#fff;border-radius:16px;padding:16px;margin-bottom:18px;box-shadow:0 14px 32px -8px rgba(30,64,175,.4);position:relative;overflow:hidden}
      .aujr-next::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 100% 0%,rgba(96,165,250,.25),transparent 60%);pointer-events:none}
      .aujr-next.soon{background:linear-gradient(135deg,#9a3412 0%,#c2410c 50%,#7c2d12 100%);box-shadow:0 14px 32px -8px rgba(234,88,12,.55);animation:aujr-next-pulse 2s ease-in-out infinite}
      @keyframes aujr-next-pulse{0%,100%{box-shadow:0 14px 32px -8px rgba(234,88,12,.55)}50%{box-shadow:0 16px 40px -8px rgba(234,88,12,.8)}}
      .aujr-next-tag{font-family:var(--fn);font-size:10px;font-weight:900;color:rgba(255,255,255,.75);letter-spacing:.3em;text-transform:uppercase;margin-bottom:10px;position:relative;z-index:1}
      .aujr-next.soon .aujr-next-tag{color:#fed7aa}
      .aujr-next-row{display:flex;align-items:center;gap:12px;position:relative;z-index:1}
      .aujr-next-av{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);overflow:hidden;flex-shrink:0;border:2px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:900;font-size:14px}
      .aujr-next-av img{width:100%;height:100%;object-fit:cover}
      .aujr-next-body{flex:1;min-width:0}
      .aujr-next-nm{font-family:var(--fd);font-size:17px;font-weight:800;letter-spacing:-.01em;line-height:1.1}
      .aujr-next-meta{font-size:12px;color:rgba(255,255,255,.78);margin-top:3px;letter-spacing:-.005em}
      .aujr-next-cd{display:flex;align-items:baseline;gap:3px;font-family:var(--fd);color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.4)}
      .aujr-next-big{font-size:36px;font-weight:900;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
      .aujr-next-unit{font-size:13px;font-weight:800;opacity:.7;letter-spacing:.05em}
      .aujr-next-actions{margin-top:14px;position:relative;z-index:1}
      .aujr-next .aujr-btn-primary{width:100%;background:rgba(255,255,255,.95);color:#1e3a8a}
      .aujr-next.soon .aujr-btn-primary{color:#9a3412}

      /* Section headers */
      .aujr-sec-h{font-family:var(--fn);font-size:10.5px;font-weight:900;color:var(--mu);letter-spacing:.2em;text-transform:uppercase;margin:18px 4px 10px;display:flex;align-items:center;gap:8px}
      .aujr-sec-h .count{font-family:var(--fd);font-size:11px;font-weight:800;color:var(--a);background:var(--ap);padding:2px 7px;border-radius:99px}

      /* Card en cours (LIVE) */
      .aujr-current{background:linear-gradient(135deg,#065f46 0%,#047857 50%,#022c22 100%);color:#fff;border-radius:16px;padding:16px;margin-bottom:18px;box-shadow:0 14px 32px -8px rgba(16,185,129,.5);position:relative;overflow:hidden;border:1px solid rgba(52,211,153,.4)}
      .aujr-current::before{content:'';position:absolute;top:0;left:0;bottom:0;width:5px;background:linear-gradient(180deg,#34d399,#10b981);animation:aujr-pulse 2s ease-in-out infinite}
      @keyframes aujr-pulse{0%,100%{opacity:.6}50%{opacity:1}}
      .aujr-current-row{display:flex;align-items:center;gap:12px}
      .aujr-current-av{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.18);overflow:hidden;flex-shrink:0;border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:900;font-size:15px}
      .aujr-current-av img{width:100%;height:100%;object-fit:cover}
      .aujr-current-body{flex:1;min-width:0}
      .aujr-current-tag{font-family:var(--fn);font-size:9.5px;font-weight:900;color:#34d399;letter-spacing:.3em;text-transform:uppercase;display:flex;align-items:center;gap:6px;margin-bottom:3px}
      .aujr-current-dot{width:8px;height:8px;border-radius:50%;background:#34d399;animation:aujr-pulse 1.4s ease-in-out infinite;box-shadow:0 0 10px rgba(52,211,153,.8)}
      .aujr-current-nm{font-family:var(--fd);font-size:18px;font-weight:900;letter-spacing:-.01em;line-height:1.1}
      .aujr-current-meta{font-size:12px;color:rgba(255,255,255,.78);margin-top:3px}
      .aujr-current-progress{height:5px;background:rgba(255,255,255,.16);border-radius:99px;overflow:hidden;margin-top:10px;position:relative}
      .aujr-current-progress i{display:block;height:100%;background:linear-gradient(90deg,#34d399,#10b981);border-radius:99px;transition:width 60s linear;box-shadow:0 0 8px rgba(52,211,153,.5),inset 0 1px 0 rgba(255,255,255,.4);position:relative}
      .aujr-current-progress i::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.4) 50%,transparent 70%);background-size:200% 100%;animation:aujr-shimmer 2.4s linear infinite}
      @keyframes aujr-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      .aujr-current-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
      .aujr-btn{padding:11px 14px;border-radius:10px;border:0;font-family:var(--fd);font-size:12.5px;font-weight:800;cursor:pointer;letter-spacing:.2px;transition:transform .12s}
      .aujr-btn:hover{transform:translateY(-1px)}
      .aujr-btn-primary{background:#fff;color:#065f46}
      .aujr-btn-secondary{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.22)}
      .aujr-btn-start{background:linear-gradient(135deg,#fde68a,#fbbf24);color:#451a03;box-shadow:0 6px 16px -4px rgba(251,191,36,.5)}
      .aujr-btn-start:hover{transform:translateY(-2px);box-shadow:0 10px 22px -4px rgba(251,191,36,.6)}
      .aujr-btn-stop{background:linear-gradient(135deg,#fb7185,#ef4444);color:#fff;animation:aujr-stop-pulse 1.6s ease-in-out infinite}
      @keyframes aujr-stop-pulse{0%,100%{box-shadow:0 6px 16px -4px rgba(239,68,68,.6),0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 6px 16px -4px rgba(239,68,68,.6),0 0 0 10px rgba(239,68,68,0)}}
      .aujr-current.is-tracking::before{background:linear-gradient(180deg,#fbbf24,#dc2626);animation:aujr-pulse 1s ease-in-out infinite}

      /* Card timeline (passées + à venir) */
      .aujr-card{background:var(--su);border:1px solid var(--bo);border-radius:14px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .2s;position:relative;overflow:hidden}
      .aujr-card:hover{transform:translateY(-2px);border-color:var(--a);box-shadow:0 10px 24px -8px rgba(11,13,26,.15)}
      .aujr-card.past{opacity:.7}
      .aujr-card.pend{border-color:rgba(245,158,11,.4);background:linear-gradient(135deg,rgba(245,158,11,.04),var(--su))}
      .aujr-time{font-family:var(--fn);font-size:14px;font-weight:900;color:var(--ink);text-align:center;flex-shrink:0;min-width:50px}
      .aujr-time small{display:block;font-size:9px;color:var(--mu);font-weight:800;letter-spacing:.5px;margin-top:1px}
      .aujr-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--fd);font-weight:800;font-size:13px}
      .aujr-av img{width:100%;height:100%;object-fit:cover}
      .aujr-av-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
      .aujr-card-body{flex:1;min-width:0}
      .aujr-card-nm{font-family:var(--fd);font-weight:800;font-size:14.5px;color:var(--ink);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .aujr-card-meta{font-size:12px;color:var(--mu);margin-top:2px}
      .aujr-card-status{flex-shrink:0;font-size:18px}
      .aujr-card-status.livret{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#451a03;padding:5px 8px;border-radius:7px;font-family:var(--fn);font-size:9.5px;font-weight:900;letter-spacing:.3px}

      /* Section livrets retard */
      .aujr-livrets-warn{background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #f59e0b;color:#92400e;padding:14px 16px;border-radius:12px;margin-bottom:18px}
      .aujr-livrets-warn h3{font-family:var(--fd);font-weight:900;font-size:13.5px;margin:0 0 4px;letter-spacing:-.005em}
      .aujr-livrets-warn p{margin:0;font-size:12px;line-height:1.4}

      /* Empty state */
      .aujr-empty{text-align:center;padding:36px 20px;color:var(--mu);font-size:13.5px;background:var(--bg2);border-radius:12px}
      .aujr-empty .em{font-size:36px;line-height:1;margin-bottom:8px}

      ${USER_LIST_CARD_CSS}

      /* FAB nouvelle leçon */
      .aujr-fab{position:fixed;bottom:calc(80px + env(safe-area-inset-bottom));right:18px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:0;font-size:26px;cursor:pointer;box-shadow:0 10px 28px -6px rgba(99,102,241,.7);z-index:30;transition:transform .15s;display:flex;align-items:center;justify-content:center;font-weight:300}
      .aujr-fab:hover{transform:translateY(-3px) scale(1.06)}
      .aujr-fab:active{transform:scale(.92)}
      @media (min-width:920px){.aujr-fab{bottom:24px}}
    </style>

    <div class="aujr-wrap anim-slide-up">
      <div class="aujr-top">
        <button class="aujr-back" id="aujr-back" aria-label="Retour planning">‹</button>
        <span class="pg-logo-txt">PermiGo</span>
        <div>
          <h1>Aujourd'hui</h1>
          <div class="sub">${esc(todayLabel())}</div>
        </div>
        <div class="aujr-top-r"><span id="aujr-bell"></span></div>
      </div>

      <!-- Hero summary -->
      <div class="aujr-hero">
        <div class="aujr-hero-lbl">JOURNÉE EN UN COUP D'ŒIL</div>
        <h2>${lecons.length} leçon${lecons.length > 1 ? 's' : ''}${heures > 0 ? ` · ${heures.toFixed(1)}h au volant` : ''}</h2>
        <div class="aujr-hero-stats">
          <div class="aujr-hs"><div class="v"><span data-count="${lecons.length}">0</span></div><div class="l">Leçons</div></div>
          <div class="aujr-hs"><div class="v"><span data-count="${heures.toFixed(1)}" data-decimals="1">0</span><small>h</small></div><div class="l">Total</div></div>
          <div class="aujr-hs"><div class="v"><span data-count="${past.length}">0</span></div><div class="l">Terminées</div></div>
          <div class="aujr-hs"><div class="v"><span data-count="${upcoming.length}">0</span></div><div class="l">À venir</div></div>
        </div>
      </div>

      ${livretsRetard.length > 0 ? `
        <div class="aujr-livrets-warn">
          <h3>📝 ${livretsRetard.length} livret${livretsRetard.length > 1 ? 's' : ''} à remplir</h3>
          <p>${livretsRetard.map(e => esc(eleveNomFor(e) + ' (' + e.h + ')')).join(', ')}</p>
        </div>
      ` : ''}

      ${!current && upcoming.length > 0 ? (() => {
        const next = upcoming[0];
        const { startMin } = eventTimeRange(next);
        const minToGo = startMin - nowMin();
        const countdownLabel = minToGo < 60
          ? `<span class="aujr-next-big">${minToGo}</span><span class="aujr-next-unit">min</span>`
          : `<span class="aujr-next-big">${Math.floor(minToGo / 60)}</span><span class="aujr-next-unit">h${(minToGo % 60).toString().padStart(2,'0')}</span>`;
        const isSoon = minToGo <= 15;
        return `
        <div class="aujr-next ${isSoon ? 'soon' : ''}">
          <div class="aujr-next-tag">${isSoon ? '⚡ Bientôt' : '⏱ Prochaine leçon'}</div>
          <div class="aujr-next-row">
            <div class="aujr-next-av">${avatarHtml(next)}</div>
            <div class="aujr-next-body">
              <div class="aujr-next-nm">${esc(eleveNomFor(next))}</div>
              <div class="aujr-next-meta">${esc(next.h || '')}${next.lieu ? ' · 📍 ' + esc(next.lieu) : ''}</div>
            </div>
            <div class="aujr-next-cd" aria-label="Temps restant">${countdownLabel}</div>
          </div>
          <div class="aujr-next-actions">
            <button class="aujr-btn aujr-btn-primary" data-act="fiche" data-eleve="${esc(next.eleve_id || '')}">👤 Préparer · voir fiche</button>
          </div>
        </div>
        `;
      })() : ''}

      ${current ? (() => {
        const { startMin, endMin } = eventTimeRange(current);
        const remaining = endMin - nowMin();
        const totalDur = endMin - startMin;
        const elapsedPct = Math.min(100, Math.max(0, ((nowMin() - startMin) / totalDur) * 100));
        const tracking = isActive(current);
        const trackingDone = !!current.ended_at;
        return `
        <div class="aujr-current ${tracking ? 'is-tracking' : ''}">
          <div class="aujr-current-row">
            <div class="aujr-current-av">${avatarHtml(current)}</div>
            <div class="aujr-current-body">
              <div class="aujr-current-tag"><span class="aujr-current-dot"></span> En cours · ${remaining} min restantes${tracking ? ` · ⏱ ${trackingMin(current)} min trackés` : ''}</div>
              <div class="aujr-current-nm">${esc(eleveNomFor(current))}${current.numero_heure_eleve ? ` <small style="font-family:var(--fn);font-size:12px;font-weight:700;opacity:.7">· ${current.numero_heure_eleve}ème h</small>` : ''}</div>
              <div class="aujr-current-meta">${current.lieu ? '📍 ' + esc(current.lieu) : 'Lieu non défini'} · jusqu'à ${formatEnd(current)}</div>
              <div class="aujr-current-progress" aria-hidden="true"><i style="width:${elapsedPct.toFixed(1)}%"></i></div>
            </div>
          </div>
          <div class="aujr-current-actions">
            ${trackingDone ? `
              <button class="aujr-btn aujr-btn-primary" data-act="eval" data-id="${esc(current.id)}">📝 Évaluer</button>
              <button class="aujr-btn aujr-btn-secondary" data-act="fiche" data-eleve="${esc(current.eleve_id || '')}">Voir fiche</button>
            ` : tracking ? `
              <button class="aujr-btn aujr-btn-stop" data-act="end" data-id="${esc(current.id)}">⏹ Terminer la leçon</button>
              <button class="aujr-btn aujr-btn-secondary" data-act="fiche" data-eleve="${esc(current.eleve_id || '')}">Voir fiche</button>
            ` : `
              <button class="aujr-btn aujr-btn-start" data-act="start" data-id="${esc(current.id)}">▶ Démarrer la leçon</button>
              <button class="aujr-btn aujr-btn-secondary" data-act="fiche" data-eleve="${esc(current.eleve_id || '')}">Voir fiche</button>
            `}
          </div>
        </div>
        `;
      })() : ''}

      ${upcoming.length > 0 ? `
        <div class="aujr-sec-h">À venir <span class="count">${upcoming.length}</span></div>
        ${upcoming.map(renderCard).join('')}
      ` : ''}

      ${past.length > 0 ? `
        <div class="aujr-sec-h">Déjà fait <span class="count">${past.length}</span></div>
        ${past.map(renderCard).join('')}
      ` : ''}

      ${lecons.length === 0 ? `
        <div class="aujr-empty">
          <div class="em">🌴</div>
          <div>Aucune leçon aujourd'hui</div>
          <div style="font-size:12px;margin-top:4px;color:var(--mu2)">Profite de ta journée libre</div>
        </div>
      ` : ''}

      ${_mesEleves.length > 0 ? `
        <div class="aujr-sec-h">Mes élèves</div>
        ${renderUserListCard({
          title: 'Mes élèves récents',
          subtitle: 'Triés par leçon la plus récente',
          items: _mesEleves.map(e => {
            const daysAgo = e.lastDate ? daysSince(e.lastDate) : 999;
            let badge;
            if (daysAgo <= 14) badge = { label: 'Actif', variant: 'success' };
            else if (daysAgo <= 30) badge = { label: `${daysAgo}j`, variant: 'neutral' };
            else if (daysAgo <= 60) badge = { label: 'À relancer', variant: 'warning' };
            else badge = { label: 'Inactif', variant: 'danger' };
            return {
              id: e.id,
              nom: e.nom,
              sub: `${e.count} leçon${e.count > 1 ? 's' : ''} · ${e.hours.toFixed(0)}h · dernière ${daysAgo === 0 ? "aujourd'hui" : `il y a ${daysAgo}j`}`,
              avatarUrl: e.avatar_url,
              badge,
            };
          }),
          footer: { label: 'Voir tous mes élèves', action: 'seeAll' },
        })}
      ` : ''}

      ${_eventsTomorrow.length > 0 ? `
        <div class="aujr-sec-h">Demain <span class="count">${_eventsTomorrow.length}</span></div>
        ${_eventsTomorrow.map(renderCard).join('')}
      ` : ''}
    </div>

    <button class="aujr-fab" id="aujr-fab" type="button" aria-label="Nouvelle dispo / leçon">+</button>
  `;

  wire();
}

function renderCard(e) {
  const kind = categorize(e);
  const today = new Date().toISOString().slice(0, 10);
  const isPend = (e.t || '').toLowerCase() === 'pend';
  const livretReclame = (e.t || '').toLowerCase() === 'conf' && e.date_event === today && eventTimeRange(e).endMin < nowMin() && !e.livret_rempli;

  return `
    <div class="aujr-card ${kind} ${isPend ? 'pend' : ''}" data-id="${esc(e.id)}">
      <div class="aujr-time">${esc(e.h || '—')}<small>${(parseFloat(e.dur) || 1)}h</small></div>
      <div class="aujr-av">${avatarHtml(e)}</div>
      <div class="aujr-card-body">
        <div class="aujr-card-nm">${esc(eleveNomFor(e))}${e.numero_heure_eleve ? ` <small style="font-family:var(--fn);font-size:11px;font-weight:700;color:var(--mu)">· ${e.numero_heure_eleve}ème h</small>` : ''}</div>
        <div class="aujr-card-meta">${e.lieu ? '📍 ' + esc(e.lieu) : 'Lieu à définir'}${isPend ? ' · ⏳ En attente' : ''}</div>
      </div>
      ${livretReclame ? `<div class="aujr-card-status livret">📝 LIVRET</div>` : `<div class="aujr-card-status">›</div>`}
    </div>
  `;
}

function formatEnd(e) {
  const { endMin } = eventTimeRange(e);
  return `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
}

function trackingMin(ev) {
  if (!ev?.started_at) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(ev.started_at).getTime()) / 60000));
}

function wire() {
  const bellHost = _root.querySelector('#aujr-bell');
  if (bellHost) mountNotifBell(bellHost);

  // Count-up animation sur les 4 KPIs hero
  setTimeout(() => {
    countUpAll(_root.querySelectorAll('.aujr-hero-stats [data-count]'), { stagger: 100, duration: 900 });
  }, 200);

  _root.querySelector('#aujr-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/planning');
  });

  // FAB → planning (où on peut créer)
  _root.querySelector('#aujr-fab')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/planning');
  });

  // Widget "Mes élèves" — click sur un élève = fiche, click "Voir tous" = mes-eleves
  wireUserListCard(_root, {
    onItemClick: async (id) => {
      const { navigate } = await import('@/router.js');
      navigate('/fiche-eleve', { id });
    },
    onAction: async () => {
      const { navigate } = await import('@/router.js');
      navigate('/mes-eleves');
    },
  });

  // Actions sur card en cours
  _root.querySelectorAll('[data-act]').forEach(b => {
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
      const act = b.dataset.act;
      const id = b.dataset.id;

      if (act === 'start') {
        b.disabled = true; b.textContent = 'Localisation…';
        const result = await startLecon({ eventId: id });
        if (!result.ok) {
          toast(result.error || 'Erreur démarrage', 'error');
          b.disabled = false; b.textContent = '▶ Démarrer la leçon';
          return;
        }
        toast(`Leçon démarrée ${result.lat ? '📍 ' + result.lat.toFixed(4) + ', ' + result.lng.toFixed(4) : '(sans géoloc)'}`, 'success');
        try { navigator.vibrate?.([50, 30, 80]); } catch (_) {}
        await mount(_root);
        return;
      }

      if (act === 'end') {
        if (!confirm('Terminer la leçon maintenant ? La géoloc sera enregistrée.')) return;
        b.disabled = true; b.textContent = 'Localisation…';
        const result = await endLecon({ eventId: id });
        if (!result.ok) {
          toast(result.error || 'Erreur fin leçon', 'error');
          b.disabled = false; b.textContent = '⏹ Terminer la leçon';
          return;
        }
        const msg = `Leçon terminée · ${result.dureeReelleMin} min${result.distanceKm ? ' · ~' + result.distanceKm + ' km' : ''}`;
        toast(msg, 'success');
        try { navigator.vibrate?.([80, 50, 80, 50, 200]); } catch (_) {}
        await mount(_root);
        return;
      }

      const { navigate } = await import('@/router.js');
      if (act === 'eval') {
        navigate('/planning');
      } else if (act === 'fiche') {
        navigate('/fiche-eleve', { id: b.dataset.eleve });
      }
    });
  });

  // Click sur une card → ouvre la fiche élève si possible, sinon planning
  _root.querySelectorAll('.aujr-card').forEach(c => {
    c.addEventListener('click', async () => {
      const id = c.dataset.id;
      const evt = [..._eventsToday, ..._eventsTomorrow].find(x => x.id === id);
      const { navigate } = await import('@/router.js');
      if (evt?.eleve_id) {
        navigate('/fiche-eleve', { id: evt.eleve_id });
      } else {
        navigate('/planning');
      }
    });
  });
}
