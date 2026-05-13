/**
 * Page Accueil Élève — dashboard principal après login.
 *
 * Affiche :
 *  - Prochaine leçon (ou message si aucune)
 *  - 3 KPIs : conduites / restantes / % compétences
 *  - Boutons rapides : Réserver, Trophées, Coach IA
 *  - Barre progression REMC globale
 *
 * Lit Supabase : events, remc_entries (filtrés sur CUR_USER.id via RLS).
 */

import { sb, logout } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { mountNotifBell } from '@/components/notif-bell.js';
import { WEEK_DAYS_FULL, MONTHS_FR_SHORT, jsDayToWeekIdx } from '@/utils/format-date.js';
import { REMC_TOTAL } from '@/data/remc.js';
import { countUpAll } from '@/utils/count-up.js';
import { burstConfetti } from '@/components/confetti.js';
import { renderHeatmap, ensureHeatmapStyles } from '@/components/activity-heatmap.js';
import { maybePlayWeeklyReplay, forcePlayReplay } from '@/components/weekly-replay.js';

export async function mount(root) {
  const me = getCurUser();
  if (!me) { root.innerHTML = '<p>Non connecté</p>'; return; }

  // Rendu initial avec skeleton
  root.innerHTML = template(me, null, { h: 0, total: me.forfait_h || 20, pct: 0 }, []);

  // Charge data depuis Supabase
  const [evtsRes, remcRes, reviewRes, notatRes, selfEvalRes] = await Promise.allSettled([
    sb.from('events')
      .select('*')
      .eq('eleve_id', me.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true }),
    sb.from('remc_entries')
      .select('comp_id, lv')
      .eq('eleve_id', me.id),
    sb.from('lesson_reviews')
      .select('id, event_id, note, commentaire, comp_ids, created_at')
      .eq('eleve_id', me.id)
      .order('created_at', { ascending: false })
      .limit(1),
    sb.from('notations').select('moniteur_id').eq('eleve_id', me.id),
    sb.from('lesson_self_evals').select('event_id').eq('eleve_id', me.id),
  ]);

  const events = (evtsRes.status === 'fulfilled' && evtsRes.value.data) || [];
  const remc = (remcRes.status === 'fulfilled' && remcRes.value.data) || [];
  const lastReview = (reviewRes.status === 'fulfilled' && reviewRes.value.data?.[0]) || null;
  const myNotatedMonIds = new Set((notatRes.value?.data || []).map(n => n.moniteur_id));
  const mySelfEvaledEventIds = new Set((selfEvalRes.value?.data || []).map(s => s.event_id));

  // Calculs
  const isLessonType = (t) => { const s = (t||'').toLowerCase(); return s==='conf' || s==='lecon' || s==='leçon'; };
  // On ne compte que les events avec une vraie date_event (les events legacy sans date = "semaine type" exclus)
  const lessons = events.filter(e => e.date_event && (isLessonType(e.t) || e.t === 'pend'));
  const conduiteH = lessons
    .filter(e => isLessonType(e.t))
    .reduce((s, e) => s + (parseFloat(e.dur) || 1), 0);
  const forfait = me.forfait_h || 20;
  const restantes = Math.max(0, forfait - conduiteH);
  const acquises = remc.filter(r => r.lv === 'v').length;
  const pctComp = Math.round((acquises / REMC_TOTAL) * 100);
  const nextLesson = lessons.find(e => e.t === 'conf' || e.t === 'pend');

  // Trouve la dernière leçon passée non-notée (on récupère id + nom du moniteur directement depuis l'event)
  const today = new Date().toISOString().slice(0, 10);
  const pastLessons = lessons.filter(e => isLessonType(e.t) && e.moniteur_id && e.date_event && e.date_event < today);
  let monToRateInfo = null;
  const seenMon = new Set();
  for (const l of pastLessons) {
    if (myNotatedMonIds.has(l.moniteur_id)) continue;
    if (seenMon.has(l.moniteur_id)) continue;
    seenMon.add(l.moniteur_id);
    monToRateInfo = { id: l.moniteur_id, nom: l.mon_nom || 'votre moniteur' };
    break;
  }

  // Auto-éval : trouve la dernière leçon passée non auto-évaluée
  let selfEvalLesson = null;
  for (const l of pastLessons) {
    if (mySelfEvaledEventIds.has(l.id)) continue;
    selfEvalLesson = l;
    break;
  }

  // Re-render avec data réelle
  root.innerHTML = template(me, nextLesson, { h: conduiteH, total: forfait, restantes, pct: pctComp, acquises }, lessons, lastReview, monToRateInfo, selfEvalLesson);

  // Cloche notifs
  const bellHost = root.querySelector('#el-bell');
  if (bellHost) mountNotifBell(bellHost);

  // ─── Animations d'entrée ───
  // Count-up animation sur les KPIs (3 chiffres défilent de 0 à leur valeur)
  setTimeout(() => {
    countUpAll(root.querySelectorAll('.kpi-val [data-count]'), { stagger: 120, duration: 1100 });
  }, 200);

  // ─── Heatmap activité : agrège les jours actifs (events + validations REMC) ───
  ensureHeatmapStyles();
  const activeDates = new Set();
  const activityLevels = {};
  // Events conduits → jours avec leçon = activité forte
  events.forEach(e => {
    if (e.date_event && (isLessonType(e.t) || e.t === 'pend')) {
      activeDates.add(e.date_event);
      activityLevels[e.date_event] = Math.min(4, (activityLevels[e.date_event] || 0) + 2);
    }
  });
  // Validations REMC → jours avec comp validée = activité moyenne
  remc.forEach(r => {
    if (r.lv === 'v' && r.validated_at) {
      const d = String(r.validated_at).slice(0, 10);
      activeDates.add(d);
      activityLevels[d] = Math.min(4, (activityLevels[d] || 0) + 1);
    }
  });
  const hmapHost = root.querySelector('#el-heatmap-host');
  if (hmapHost) {
    hmapHost.innerHTML = renderHeatmap({
      activeDates: Array.from(activeDates),
      activityLevels,
      weeks: 14,
      title: '14 dernières semaines',
    });
  }

  // ─── Weekly Replay (Spotify Wrapped style) — auto le dim soir/lundi ───
  const replayStats = computeWeeklyReplayStats({ events, remc, lastReview });
  // Auto-play si dans la fenêtre temporelle ET pas déjà vu cette semaine
  setTimeout(() => maybePlayWeeklyReplay(replayStats), 1200);

  // Bouton manuel "Voir mon récap" toujours dispo
  root.querySelector('#btn-replay')?.addEventListener('click', () => forcePlayReplay(replayStats));

  // Confetti si l'élève a une nouvelle évaluation 5★ (célébration)
  if (lastReview && lastReview.note === 5 && !sessionStorage.getItem(`confetti-${lastReview.id}`)) {
    setTimeout(() => burstConfetti({ count: 100, y: 0.3, power: 18 }), 800);
    sessionStorage.setItem(`confetti-${lastReview.id}`, '1');
  }
  // Confetti si l'élève vient de franchir un palier de % (50%, 75%, 100%)
  const lastPctSeen = parseInt(localStorage.getItem(`lastPct-${me.id}`) || '0', 10);
  if (pctComp >= 50 && lastPctSeen < 50) setTimeout(() => burstConfetti({ count: 80, y: 0.3 }), 1200);
  if (pctComp >= 75 && lastPctSeen < 75) setTimeout(() => burstConfetti({ count: 100, y: 0.3, power: 18 }), 1400);
  if (pctComp >= 100 && lastPctSeen < 100) setTimeout(() => burstConfetti({ count: 160, y: 0.3, power: 22, spread: Math.PI }), 1500);
  localStorage.setItem(`lastPct-${me.id}`, String(pctComp));

  // Listeners
  root.querySelector('#btn-logout')?.addEventListener('click', async () => {
    await logout();
    const { navigate } = await import('@/router.js');
    navigate('/');
  });
  root.querySelector('#btn-profil')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/profil');
  });
  root.querySelector('#btn-reserver')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/reservation');
  });
  root.querySelector('#btn-trophees')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/trophees');
  });
  root.querySelector('#btn-parcours')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/parcours');
  });

  // Bouton "Noter mon moniteur" (cas où l'auto-trigger a été manqué)
  root.querySelector('#btn-rate-mon')?.addEventListener('click', () => openRateMonModal(root, me, true));

  // Bouton "Auto-évaluer" la dernière leçon
  root.querySelector('#btn-self-eval')?.addEventListener('click', (e) => {
    const b = e.currentTarget;
    openSelfEvalModal(root, me, { id: b.dataset.event, h: b.dataset.h, date: b.dataset.date });
  });

  // ⚠️ OBLIGATOIRE : si une leçon passée n'a pas été notée, on force la modal
  const rateBtn = root.querySelector('#btn-rate-mon');
  if (rateBtn) {
    setTimeout(() => openRateMonModal(root, me, true), 400);
  }
}

/** Calcule les stats des 7 derniers jours pour le Weekly Replay. */
function computeWeeklyReplayStats({ events = [], remc = [], lastReview = null } = {}) {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const ws = new Date(today);
  const dayIdx = (ws.getDay() + 6) % 7;
  ws.setDate(ws.getDate() - dayIdx);
  const weekStart = ws.toISOString().slice(0, 10);
  const prevWs = new Date(ws); prevWs.setDate(prevWs.getDate() - 7);
  const prevWeekStart = prevWs.toISOString().slice(0, 10);
  const prevWeekEnd = new Date(prevWs); prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
  const prevWeekEndIso = prevWeekEnd.toISOString().slice(0, 10);

  const isLec = (t) => { const s = (t || '').toLowerCase(); return s === 'conf' || s === 'lecon' || s === 'leçon'; };
  const thisWeek = events.filter(e => e.date_event && e.date_event >= weekStart && isLec(e.t));
  const lastWeek = events.filter(e => e.date_event && e.date_event >= prevWeekStart && e.date_event <= prevWeekEndIso && isLec(e.t));
  const hoursThisWeek = thisWeek.reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const hoursLastWeek = lastWeek.reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const compsValidated = remc.filter(r => r.lv === 'v' && r.validated_at && r.validated_at.slice(0, 10) >= weekStart).length;
  const topLesson = thisWeek.sort((a, b) => (b.date_event || '').localeCompare(a.date_event || ''))[0];
  const streak = parseInt(localStorage.getItem('pg-streak-count') || '0', 10);

  return {
    hoursThisWeek,
    hoursLastWeek,
    compsValidated,
    monsReview: lastReview?.note || null,
    topLessonHour: topLesson?.h || null,
    topLessonLieu: topLesson?.lieu || null,
    streak: streak || 1,
  };
}

// ─── Modal "Noter mon moniteur" (anonyme, OBLIGATOIRE en fin de leçon) ───
function openRateMonModal(root, me, mandatory = false) {
  // évite double-ouverture
  if (document.querySelector('.rm-bg')) return;
  const monId = root.querySelector('#btn-rate-mon')?.dataset.mon;
  const monNom = root.querySelector('#btn-rate-mon')?.dataset.monNom || 'votre moniteur';
  if (!monId) return;

  const html = `
    <style>
      .rm-bg{position:fixed;inset:0;background:rgba(11,13,26,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:90;padding:16px;animation:rmIn .2s ease}
      @keyframes rmIn{from{opacity:0}to{opacity:1}}
      .rm-panel{background:var(--bg);width:100%;max-width:420px;border-radius:var(--rx);overflow:hidden;box-shadow:var(--s3);animation:rmSlide .25s cubic-bezier(.2,.7,.3,1)}
      @keyframes rmSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      .rm-h{padding:18px 18px 12px;text-align:center}
      .rm-h .em{font-size:36px;line-height:1;margin-bottom:6px}
      .rm-h .ti{font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:-.01em}
      .rm-h .sub{font-size:12.5px;color:var(--mu);margin-top:4px}
      .rm-b{padding:8px 18px 18px}
      .rm-stars{display:flex;gap:8px;justify-content:center;margin:12px 0 4px}
      .rm-stars button{width:44px;height:44px;border:0;background:transparent;font-size:30px;cursor:pointer;line-height:1;padding:0;color:#cbd5e1;transition:transform .12s,color .12s}
      .rm-stars button:hover{transform:scale(1.12)}
      .rm-stars button.sel{color:#f59e0b}
      .rm-lbl{text-align:center;font-size:12px;color:var(--mu);font-weight:600;margin-bottom:14px;min-height:18px}
      .rm-b textarea{width:100%;min-height:80px;padding:10px 12px;border:1px solid var(--bo);border-radius:8px;font-family:var(--fb);font-size:13px;color:var(--ink);resize:vertical;background:var(--su2);box-sizing:border-box}
      .rm-b textarea:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 3px var(--ap)}
      .rm-note{font-size:11px;color:var(--mu);margin:8px 0 14px;text-align:center;line-height:1.4}
      .rm-note b{color:var(--ink)}
      .rm-cta{display:grid;grid-template-columns:1fr 2fr;gap:8px}
    </style>
    <div class="rm-bg" id="rm-bg">
      <div class="rm-panel">
        <div class="rm-h">
          <div class="em">🎯</div>
          <div class="ti">${mandatory ? 'Note ta dernière leçon' : 'Évalue ' + esc(monNom.split(' ')[0])}</div>
          <div class="sub">${mandatory ? `Avec <b>${esc(monNom.split(' ')[0])}</b> — une étape obligatoire pour continuer.` : 'Ton avis aide ton moniteur à progresser.'}</div>
        </div>
        <div class="rm-b">
          <div class="rm-stars" id="rm-stars">
            ${[1,2,3,4,5].map(n => `<button type="button" data-n="${n}">★</button>`).join('')}
          </div>
          <div class="rm-lbl" id="rm-lbl">Choisis une note de 1 à 5</div>
          <textarea id="rm-comment" maxlength="240" placeholder="Commentaire (optionnel)…"></textarea>
          <div class="rm-note">🔒 <b>Ton avis est anonyme</b> — ton moniteur ne saura pas que c'est toi.</div>
          <div class="rm-cta" style="${mandatory ? 'grid-template-columns:1fr' : ''}">
            ${mandatory ? '' : '<button class="btn" id="rm-cancel">Annuler</button>'}
            <button class="btn btn-p" id="rm-send" disabled>Envoyer mon avis</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);

  const close = () => host.remove();
  let pickedNote = 0;

  const stars = host.querySelectorAll('.rm-stars button');
  const labelEl = host.querySelector('#rm-lbl');
  const sendBtn = host.querySelector('#rm-send');

  const labels = ['', '😕 Difficile', '😐 Moyen', '🙂 Bien', '😄 Très bien', '🤩 Excellent'];
  stars.forEach(b => b.addEventListener('click', () => {
    pickedNote = +b.dataset.n;
    stars.forEach((s, i) => s.classList.toggle('sel', i < pickedNote));
    labelEl.textContent = labels[pickedNote];
    sendBtn.disabled = false;
  }));

  // Mandatory : pas de bouton Annuler, pas de close au backdrop
  if (!mandatory) {
    host.querySelector('#rm-cancel')?.addEventListener('click', close);
    host.querySelector('#rm-bg').addEventListener('click', (e) => { if (e.target.id === 'rm-bg') close(); });
  }

  sendBtn.onclick = async () => {
    sendBtn.disabled = true;
    sendBtn.textContent = '…';
    const commentaire = host.querySelector('#rm-comment').value.trim() || null;
    const { error } = await sb.from('notations').insert({
      eleve_id: me.id,
      moniteur_id: monId,
      note: pickedNote,
      comment: commentaire,
    });
    if (error) {
      console.warn('[rate-mon]', error);
      toast('Erreur envoi avis', 'error');
      sendBtn.disabled = false;
      sendBtn.textContent = 'Envoyer';
      return;
    }
    close();
    toast('Avis envoyé 🙌 — merci !', 'success');
    // Recharge la page pour refresh tout
    setTimeout(() => mount(root), 600);
  };
}

/**
 * Format date "humain" pour la liste des prochains cours.
 *   "2026-05-12" → { label: "Aujourd'hui", highlight: true }
 *   "2026-05-13" → { label: "Demain",      highlight: true }
 *   "2026-05-15" → { label: "Ven. 15 mai", highlight: false }
 *
 * IMPORTANT : utilise new Date(y, m-1, d) (constructeur local) au lieu de
 * new Date(iso) qui parse en UTC et peut décaler d'un jour selon le fuseau.
 */
function formatLessonDate(iso) {
  if (!iso || typeof iso !== 'string') return { label: '—', highlight: false };
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return { label: '—', highlight: false };

  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return { label: "Aujourd'hui", highlight: true };
  if (diffDays === 1) return { label: 'Demain', highlight: true };
  if (diffDays === -1) return { label: 'Hier', highlight: false };
  if (diffDays > 1 && diffDays < 7) {
    // "Ven. 15 mai"
    return { label: `${WEEK_DAYS_FULL[jsDayToWeekIdx(d.getDay())].slice(0, 3)}. ${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]}`, highlight: false };
  }
  // Au-delà : "15 mai" ou "15 mai 2027" si année différente
  const sameYear = d.getFullYear() === today.getFullYear();
  return { label: sameYear ? `${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]}` : `${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]} ${d.getFullYear()}`, highlight: false };
}

function template(me, nextLesson, kpis, lessons, lastReview, monToRate, selfEvalLesson) {
  const firstName = (me.nom || '').split(' ')[0] || 'élève';
  return `
    <div class="page anim-slide-up" style="max-width:720px;margin:0 auto;padding:18px">

      <!-- ── Header ── -->
      <style>
        .ac-logo{height:30px;width:auto;display:inline-block;vertical-align:middle;filter:drop-shadow(0 4px 12px rgba(99,102,241,.18))}
        .ac-logo-fb{font-family:var(--fd);font-weight:900;font-size:18px;letter-spacing:-.02em;background:linear-gradient(90deg,#6366f1,#8b5cf6,#0ea5e9);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
      </style>
      <div class="fx jb aic" style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
        <img class="ac-logo" src="permigo-logo.png" alt="PermiGo"
             onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'">
        <span class="ac-logo-fb" style="display:none">PermiGo</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span id="el-bell"></span>
          <button class="btn btn-sm" id="btn-profil" title="Mon profil" aria-label="Mon profil" style="display:inline-flex;align-items:center;justify-content:center;padding:0;width:36px;height:36px;overflow:hidden;border-radius:50%">
            ${me.avatar_url
              ? `<img src="${esc(me.avatar_url)}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover">`
              : `<span style="font-family:var(--fd);font-weight:900;font-size:13px;color:var(--a)">${esc((me.nom || '?').split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase())}</span>`}
          </button>
          <button class="btn btn-sm" id="btn-logout" title="Se déconnecter" aria-label="Se déconnecter">⏻</button>
        </div>
      </div>
      <div style="margin-bottom:18px">
        <div style="font-size:11px;letter-spacing:.08em;color:var(--mu);text-transform:uppercase;font-weight:700">Bonjour</div>
        <div style="font-family:var(--fd);font-size:28px;font-weight:900;letter-spacing:-.02em">${esc(firstName)} 👋</div>
      </div>

      <!-- ── Prochaine leçon (avec pulse glow si confirmée) ── -->
      <style>
        .next-card{position:relative;margin-bottom:14px;overflow:hidden;transition:transform .25s cubic-bezier(.2,.7,.3,1)}
        .next-card.confirmed::before{content:'';position:absolute;inset:-2px;border-radius:inherit;background:linear-gradient(135deg,rgba(16,185,129,.25),transparent 50%,rgba(99,102,241,.18));z-index:0;animation:next-glow 3s ease-in-out infinite}
        @keyframes next-glow{0%,100%{opacity:.5}50%{opacity:1}}
        .next-card.pending::before{content:'';position:absolute;inset:-2px;border-radius:inherit;background:linear-gradient(135deg,rgba(245,158,11,.28),transparent 50%,rgba(245,158,11,.15));z-index:0;animation:next-glow-am 2.5s ease-in-out infinite}
        @keyframes next-glow-am{0%,100%{opacity:.5}50%{opacity:.9}}
        .next-card .card-b{position:relative;z-index:1}
        .next-time{font-family:var(--fd);font-size:34px;font-weight:900;color:var(--ink);letter-spacing:-.025em;display:inline-block;animation:next-pop .8s cubic-bezier(.5,1.6,.4,1) both}
        @keyframes next-pop{0%{opacity:0;transform:scale(.7) translateY(8px);filter:blur(4px)}60%{opacity:1;transform:scale(1.05) translateY(0);filter:blur(0)}100%{transform:scale(1)}}
        .next-empty{font-family:var(--fd);font-size:22px;font-weight:800;color:var(--ink);animation:fadeInUp .6s cubic-bezier(.2,.7,.3,1) both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      </style>
      <div class="card next-card ${nextLesson ? (nextLesson.t === 'pend' ? 'pending' : 'confirmed') : ''}">
        <div class="card-b" style="text-align:center;padding:26px 16px">
          ${nextLesson ? (() => {
            const di = formatLessonDate(nextLesson.date_event);
            return `
              <div style="font-size:11px;letter-spacing:.08em;color:var(--mu);text-transform:uppercase;font-weight:700;margin-bottom:8px">Prochaine leçon</div>
              <div style="font-family:var(--fn);font-size:11.5px;font-weight:800;color:${di.highlight ? 'var(--a)' : 'var(--mu)'};letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">${esc(di.label)}</div>
              <div class="next-time">${esc(nextLesson.h || '—')}</div>
              <div style="color:var(--mu);font-size:13px;margin-top:4px">${esc(nextLesson.dur || 1)}h${nextLesson.lieu ? ' · ' + esc(nextLesson.lieu) : ''}</div>
              <span class="bd ${nextLesson.t === 'pend' ? 'bam' : 'bg'}" style="margin-top:12px;display:inline-block">${nextLesson.t === 'pend' ? '⏳ En attente' : '✅ Confirmée'}</span>
            `;
          })() : `
            <div style="font-size:11px;letter-spacing:.08em;color:var(--mu);text-transform:uppercase;font-weight:700;margin-bottom:6px">Prochaine leçon</div>
            <div class="next-empty">Aucune leçon programmée 🌴</div>
            <div style="color:var(--mu);font-size:13px;margin-top:6px">Choisis un créneau pour démarrer ta semaine</div>
            <button class="btn btn-p btn-sm" id="btn-reserver" style="margin-top:14px">Réserver une leçon</button>
          `}
        </div>
      </div>

      <!-- ── 3 KPIs avec count-up animation ── -->
      <style>
        .kpi-card{padding:14px 12px;text-align:center;position:relative;overflow:hidden;cursor:default;transition:transform .25s cubic-bezier(.2,.7,.3,1),box-shadow .25s,border-color .15s}
        .kpi-card:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 14px 28px -10px rgba(11,13,26,.18)}
        .kpi-card::before{content:'';position:absolute;inset:-2px;border-radius:inherit;background:linear-gradient(135deg,transparent 30%,var(--kpi-glow,rgba(99,102,241,.18)) 70%,transparent);opacity:0;transition:opacity .3s;pointer-events:none}
        .kpi-card:hover::before{opacity:1}
        .kpi-val{font-family:var(--fd);font-size:24px;font-weight:900;line-height:1.1;letter-spacing:-.02em;display:inline-flex;align-items:baseline;gap:1px}
        .kpi-val small{font-size:11px;color:var(--mu);font-weight:700;margin-left:1px}
        .kpi-lbl{font-size:10px;letter-spacing:.08em;color:var(--mu);text-transform:uppercase;font-weight:700;margin-top:4px}
      </style>
      <div class="stagger" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
        <div class="card card-b kpi-card" style="--kpi-glow:rgba(16,185,129,.2)">
          <div class="kpi-val" style="color:var(--gr)"><span data-count="${kpis.h}" data-suffix="">0</span><small>h</small></div>
          <div class="kpi-lbl">Conduites</div>
        </div>
        <div class="card card-b kpi-card" style="--kpi-glow:rgba(99,102,241,.2)">
          <div class="kpi-val" style="color:var(--a)"><span data-count="${kpis.restantes ?? kpis.total}" data-suffix="">0</span><small>h</small></div>
          <div class="kpi-lbl">Restantes</div>
        </div>
        <div class="card card-b kpi-card" style="--kpi-glow:rgba(245,158,11,.2)">
          <div class="kpi-val" style="color:var(--am)"><span data-count="${kpis.pct}" data-suffix="">0</span><small>%</small></div>
          <div class="kpi-lbl">Compétences</div>
        </div>
      </div>

      <!-- ── Actions rapides (avec hover lift + icône bounce) ── -->
      <style>
        .qa-btn{flex-direction:column;padding:14px 10px;height:auto;min-height:68px;gap:5px;transition:transform .2s cubic-bezier(.2,.7,.3,1),box-shadow .25s;position:relative;overflow:hidden}
        .qa-btn:hover{transform:translateY(-3px)}
        .qa-btn:active{transform:translateY(-1px) scale(.98)}
        .qa-btn .em{font-size:20px;line-height:1;display:block;transition:transform .25s cubic-bezier(.5,1.6,.4,1)}
        .qa-btn:hover .em{transform:scale(1.18) translateY(-2px)}
        .qa-btn .lb{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;display:block}
        /* Shine effect au hover */
        .qa-btn::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%);transition:left .55s}
        .qa-btn:hover::before{left:100%}
      </style>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">
        <button class="btn btn-p qa-btn" id="btn-reserver">
          <span class="em" aria-hidden="true">📅</span>
          <span class="lb">Réserver</span>
        </button>
        <button class="btn qa-btn" id="btn-parcours">
          <span class="em" aria-hidden="true">🗺️</span>
          <span class="lb">Parcours</span>
        </button>
        <button class="btn qa-btn" id="btn-trophees">
          <span class="em" aria-hidden="true">🏆</span>
          <span class="lb">Trophées</span>
        </button>
      </div>

      <!-- ── Prochains cours ── -->
      <div style="font-size:11px;letter-spacing:.08em;color:var(--mu);text-transform:uppercase;font-weight:700;margin-bottom:8px">Prochains cours</div>
      <div class="card" style="margin-bottom:18px">
        ${lessons.length === 0 ? `
          <div class="card-b" style="text-align:center;color:var(--mu);font-size:13px;padding:24px 16px">Aucun cours à venir 🌴</div>
        ` : lessons.slice(0, 5).map(e => {
          const dateInfo = formatLessonDate(e.date_event);
          return `
            <div style="padding:12px 14px;border-bottom:1px solid var(--bo2);display:flex;align-items:center;gap:12px">
              <div style="min-width:62px;display:flex;flex-direction:column;align-items:flex-start">
                <div style="font-family:var(--fn);font-size:9.5px;font-weight:800;color:${dateInfo.highlight ? 'var(--a)' : 'var(--mu)'};letter-spacing:.4px;text-transform:uppercase;line-height:1">${esc(dateInfo.label)}</div>
                <div style="font-family:var(--fd);font-weight:800;color:var(--a);font-size:14px;margin-top:3px">${esc(e.h || '—')}</div>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13px">${esc(e.lieu || 'Lieu à définir')}</div>
                <div style="color:var(--mu);font-size:11px;margin-top:2px">${esc(e.dur || 1)}h · ${e.t === 'pend' ? 'En attente' : 'Confirmée'}</div>
              </div>
              <span class="bd ${e.t === 'pend' ? 'bam' : 'bg'}" style="font-size:10px">${e.t === 'pend' ? '⏳' : '✅'}</span>
            </div>
          `;
        }).join('')}
      </div>

      ${monToRate ? `
        <!-- ── Évaluation moniteur (anonyme) ── -->
        <div class="card" style="margin-bottom:14px;border:1px solid #fbbf24;background:linear-gradient(135deg,#fffbeb,#fef3c7);padding:14px 16px;display:flex;align-items:center;gap:14px">
          <div style="font-size:30px;line-height:1">🎯</div>
          <div style="flex:1;min-width:0">
            <div style="font-family:var(--fd);font-weight:800;font-size:14px;color:#92400e">Note ton moniteur</div>
            <div style="font-size:11.5px;color:#92400e;opacity:.85;margin-top:2px">🔒 100% anonyme — ${esc(monToRate.nom.split(' ')[0])} ne saura pas que c'est toi.</div>
          </div>
          <button class="btn btn-p btn-sm" id="btn-rate-mon" data-mon="${esc(monToRate.id)}" data-mon-nom="${esc(monToRate.nom)}">Noter ★</button>
        </div>
      ` : ''}

      ${selfEvalLesson ? `
        <!-- ── Auto-évaluation de ma dernière leçon ── -->
        <div class="card" style="margin-bottom:14px;border:1px solid #a5b4fc;background:linear-gradient(135deg,#eef2ff,#e0e7ff);padding:14px 16px;display:flex;align-items:center;gap:14px">
          <div style="font-size:30px;line-height:1">🪞</div>
          <div style="flex:1;min-width:0">
            <div style="font-family:var(--fd);font-weight:800;font-size:14px;color:#3730a3">Auto-évalue-toi</div>
            <div style="font-size:11.5px;color:#3730a3;opacity:.85;margin-top:2px">Comment t'es-tu senti(e) lors de ta dernière leçon ?</div>
          </div>
          <button class="btn btn-p btn-sm" id="btn-self-eval" data-event="${esc(selfEvalLesson.id)}" data-h="${esc(selfEvalLesson.h)}" data-date="${esc(selfEvalLesson.date_event)}">Auto-évaluer</button>
        </div>
      ` : ''}

      <!-- ── Heatmap activité (14 dernières semaines) ── -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px">
        <div style="font-size:11px;letter-spacing:.08em;color:var(--mu);text-transform:uppercase;font-weight:700">🔥 Mon activité</div>
        <button id="btn-replay" type="button" style="padding:5px 11px;border-radius:99px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:0;font-family:inherit;font-size:10.5px;font-weight:800;cursor:pointer;letter-spacing:.3px;box-shadow:0 4px 12px -2px rgba(99,102,241,.5);transition:transform .12s">🎬 Mon récap</button>
      </div>
      <div style="margin-bottom:18px" id="el-heatmap-host"></div>

      ${lastReview ? `
        <!-- ── Dernier feedback moniteur ── -->
        <div style="font-size:11px;letter-spacing:.08em;color:var(--mu);text-transform:uppercase;font-weight:700;margin-bottom:8px">📝 Dernier feedback</div>
        <div class="card card-b" style="margin-bottom:18px;border-left:3px solid #f59e0b">
          <div class="fx jb aic" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div style="font-family:var(--fd);font-size:20px;color:#f59e0b;letter-spacing:2px;font-weight:800">${'★'.repeat(lastReview.note)}${'☆'.repeat(5-lastReview.note)}</div>
            <div style="font-size:11px;color:var(--mu);font-weight:600">${new Date(lastReview.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
          ${lastReview.commentaire ? `<div style="font-size:13px;color:var(--ink);line-height:1.5;font-style:italic;margin-bottom:6px">« ${esc(lastReview.commentaire)} »</div>` : ''}
          ${lastReview.comp_ids?.length ? `<div style="font-size:11px;color:var(--mu);margin-top:4px"><b style="color:var(--gr)">+${lastReview.comp_ids.length}</b> compétence${lastReview.comp_ids.length > 1 ? 's' : ''} validée${lastReview.comp_ids.length > 1 ? 's' : ''} ${lastReview.comp_ids.slice(0, 6).map(c => `<span class="bd bg" style="font-size:9.5px;margin-right:3px">${esc(c)}</span>`).join('')}${lastReview.comp_ids.length > 6 ? ` +${lastReview.comp_ids.length - 6}` : ''}</div>` : ''}
        </div>
      ` : ''}

      <!-- ── Progression REMC ── -->
      <div style="font-size:11px;letter-spacing:.08em;color:var(--mu);text-transform:uppercase;font-weight:700;margin-bottom:8px;margin-top:14px">Progression · ${kpis.acquises || 0}/${REMC_TOTAL}</div>
      <div class="card card-b">
        <div class="fx jb aic" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-family:var(--fd);font-size:18px;font-weight:800">${kpis.pct} %</div>
          <div style="font-size:11px;color:var(--mu)">En route 🚦</div>
        </div>
        <div class="pt"><div class="pf" style="width:${kpis.pct}%"></div></div>
        <div style="font-size:11px;color:var(--mu);margin-top:8px">${kpis.acquises || 0} compétences validées · ${REMC_TOTAL - (kpis.acquises || 0)} à débloquer</div>
      </div>

    </div>
  `;
}

// ─── Modal Auto-évaluation de la dernière leçon ───
function openSelfEvalModal(root, me, lesson) {
  if (document.querySelector('.se-bg')) return;

  const html = `
    <style>
      .se-bg{position:fixed;inset:0;background:rgba(11,13,26,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:90;padding:16px;animation:seFade .2s ease}
      @keyframes seFade{from{opacity:0}to{opacity:1}}
      .se-panel{background:var(--bg);width:100%;max-width:420px;border-radius:var(--rx);overflow:hidden;box-shadow:var(--s3);animation:seSlide .25s cubic-bezier(.2,.7,.3,1)}
      @keyframes seSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      .se-h{padding:18px 18px 12px;text-align:center;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-bottom:1px solid var(--bo2)}
      .se-h .em{font-size:38px;line-height:1;margin-bottom:6px}
      .se-h .ti{font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:-.01em;color:#3730a3}
      .se-h .sub{font-size:12.5px;color:#4f46e5;margin-top:4px}
      .se-b{padding:18px}
      .se-q{font-family:var(--fd);font-weight:700;font-size:14px;text-align:center;margin-bottom:8px}
      .se-faces{display:flex;gap:8px;justify-content:center;margin:14px 0 4px}
      .se-face{width:50px;height:50px;border-radius:50%;border:2px solid var(--bo);background:var(--su);font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;font-family:inherit;padding:0}
      .se-face:hover{transform:scale(1.08);border-color:var(--mu2)}
      .se-face.sel{background:#a5b4fc;border-color:#6366f1;transform:scale(1.1)}
      .se-lbl{text-align:center;font-size:12.5px;color:var(--mu);font-weight:600;margin-bottom:14px;min-height:18px}
      .se-b textarea{width:100%;min-height:70px;padding:10px 12px;border:1px solid var(--bo);border-radius:8px;font-family:var(--fb);font-size:13px;color:var(--ink);resize:vertical;background:var(--su2);box-sizing:border-box}
      .se-b textarea:focus{outline:0;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.18)}
      .se-info{font-size:11px;color:var(--mu);text-align:center;margin:12px 0;line-height:1.5}
      .se-info b{color:#4f46e5}
      .se-cta{display:grid;grid-template-columns:1fr 2fr;gap:8px}
    </style>
    <div class="se-bg" id="se-bg">
      <div class="se-panel">
        <div class="se-h">
          <div class="em">🪞</div>
          <div class="ti">Auto-évalue ta leçon</div>
          <div class="sub">${esc(lesson.date)} · ${esc(lesson.h)}</div>
        </div>
        <div class="se-b">
          <div class="se-q">Comment t'es-tu senti(e) ?</div>
          <div class="se-faces" id="se-faces">
            <button class="se-face" data-n="1" title="Difficile">😖</button>
            <button class="se-face" data-n="2" title="Moyen">😕</button>
            <button class="se-face" data-n="3" title="Bien">🙂</button>
            <button class="se-face" data-n="4" title="Très bien">😄</button>
            <button class="se-face" data-n="5" title="Excellent">🤩</button>
          </div>
          <div class="se-lbl" id="se-lbl">Choisis ton ressenti</div>
          <textarea id="se-comment" maxlength="240" placeholder="Une difficulté en particulier ? Un point fort ? (optionnel)"></textarea>
          <div class="se-info">💡 <b>Ton moniteur</b> verra ton auto-éval — utile pour aligner vos perceptions.</div>
          <div class="se-cta">
            <button class="btn" id="se-cancel">Plus tard</button>
            <button class="btn btn-p" id="se-send" disabled>Envoyer</button>
          </div>
        </div>
      </div>
    </div>
  `;
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);

  const close = () => host.remove();
  let pickedNote = 0;
  const faces = host.querySelectorAll('.se-face');
  const labelEl = host.querySelector('#se-lbl');
  const sendBtn = host.querySelector('#se-send');
  const labels = ['', '😖 Difficile', '😕 Moyen', '🙂 Bien', '😄 Très bien', '🤩 Excellent'];

  faces.forEach(b => b.addEventListener('click', () => {
    pickedNote = +b.dataset.n;
    faces.forEach((f, i) => f.classList.toggle('sel', i === pickedNote - 1));
    labelEl.textContent = labels[pickedNote];
    sendBtn.disabled = false;
  }));

  host.querySelector('#se-cancel').onclick = close;
  host.querySelector('#se-bg').addEventListener('click', (e) => { if (e.target.id === 'se-bg') close(); });

  sendBtn.onclick = async () => {
    sendBtn.disabled = true; sendBtn.textContent = '…';
    const commentaire = host.querySelector('#se-comment').value.trim() || null;
    const { error } = await sb.from('lesson_self_evals').insert({
      event_id: lesson.id,
      eleve_id: me.id,
      note: pickedNote,
      commentaire,
    });
    if (error) {
      console.warn('[self-eval]', error);
      toast('Erreur envoi', 'error');
      sendBtn.disabled = false; sendBtn.textContent = 'Envoyer';
      return;
    }
    close();
    toast('Auto-évaluation enregistrée 🙌', 'success');
    setTimeout(() => mount(root), 600);
  };
}
