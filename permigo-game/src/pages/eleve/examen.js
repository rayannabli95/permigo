// ═══════════════════════════════════════════════════════════════
// Élève — Mon examen B
// Countdown · Checklist "Suis-je prêt ?" · Conseils
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { icon } from '@/utils/icons.js';

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout ── */
.exam {
  padding: 20px 16px 100px;
  max-width: 480px;
  margin: 0 auto;
  background: #f8f9fc;
  color: #0a0d1a;
  font-family: 'Inter', sans-serif;
}
@keyframes examSlideUp {
  from { opacity:0; transform:translateY(14px); }
  to   { opacity:1; transform:translateY(0); }
}
.exam-card {
  animation: examSlideUp .35s cubic-bezier(.23,1,.32,1) both;
}
.exam-card:nth-child(2) { animation-delay:.06s; }
.exam-card:nth-child(3) { animation-delay:.12s; }
.exam-card:nth-child(4) { animation-delay:.18s; }

/* ── Skeleton ── */
.exam-skel {
  padding: 20px 16px 100px;
  max-width: 480px;
  margin: 0 auto;
}
.exam-skel-block {
  background: linear-gradient(90deg,#f0f2f8 0%,#e4e8f4 50%,#f0f2f8 100%);
  background-size: 200% 100%;
  animation: examShimmer 1.4s infinite;
  border-radius: 16px;
  margin-bottom: 12px;
}
@keyframes examShimmer { to { background-position:-200% 0; } }

/* ── Header ── */
.exam-hd {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-top: 4px;
}
.exam-hd-ico {
  width: 40px; height: 40px;
  background: linear-gradient(135deg,#6366f1,#8b5cf6);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.exam-hd-title { font: 700 22px/1.2 'Plus Jakarta Sans',sans-serif; color: #0a0d1a; }
.exam-hd-sub { font: 500 13px/1.4 'Inter',sans-serif; color: #64748b; margin-top: 2px; }

/* ── Shared card ── */
.exam-card {
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.exam-card-title {
  font: 700 13px/1 'Plus Jakarta Sans',sans-serif;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: #94a3b8;
  margin-bottom: 16px;
}

/* ── Countdown ── */
.exam-countdown-tiles {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 16px;
}
.exam-tile {
  flex: 1;
  background: linear-gradient(145deg,#f8f9fc,#f0f2f8);
  border: 1.5px solid #e2e6f2;
  border-radius: 16px;
  padding: 14px 8px 10px;
  text-align: center;
}
.exam-tile-num {
  font: 800 30px/1 'IBM Plex Mono',monospace;
  color: #0a0d1a;
  display: block;
}
.exam-tile-lbl {
  font: 500 10px/1 'Inter',sans-serif;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .06em;
  display: block;
  margin-top: 6px;
}
.exam-tile.urgent { border-color: #fca5a5; background: linear-gradient(145deg,#fff5f5,#fee2e2); }
.exam-tile.urgent .exam-tile-num { color: #ef4444; }
.exam-tile.done { border-color: #bbf7d0; background: linear-gradient(145deg,#f0fdf4,#dcfce7); }
.exam-tile.done .exam-tile-num { color: #16a34a; }

.exam-date-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.exam-date-input {
  flex: 1;
  border: 1.5px solid #e2e6f2;
  border-radius: 12px;
  padding: 10px 14px;
  font: 500 14px/1 'Inter',sans-serif;
  color: #0a0d1a;
  background: #f8f9fc;
  outline: none;
  transition: border-color .18s ease;
  min-height: 44px;
}
.exam-date-input:focus { border-color: #6366f1; background: #fff; }
.exam-date-save {
  padding: 10px 18px;
  background: #6366f1;
  color: #fff;
  border: 0;
  border-radius: 12px;
  font: 600 14px/1 'Plus Jakarta Sans',sans-serif;
  cursor: pointer;
  min-height: 44px;
  transition: transform .16s cubic-bezier(.23,1,.32,1), background .16s;
  flex-shrink: 0;
}
.exam-date-save:hover { background: #4f46e5; }
@media (hover:hover) and (pointer:fine) {
  .exam-date-save:hover { background: #4f46e5; }
}
.exam-date-save:active { transform: scale(.97); }

.exam-no-date {
  text-align: center;
  padding: 8px 0 4px;
}
.exam-no-date-emoji { font-size: 36px; display: block; margin-bottom: 8px; }
.exam-no-date-txt { font: 500 14px/1.4 'Inter',sans-serif; color: #64748b; margin-bottom: 16px; }
.exam-choose-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #6366f1;
  color: #fff;
  border: 0;
  border-radius: 14px;
  font: 600 14px/1 'Plus Jakarta Sans',sans-serif;
  cursor: pointer;
  min-height: 44px;
  transition: transform .16s cubic-bezier(.23,1,.32,1);
}
.exam-choose-btn:active { transform: scale(.97); }
@media (hover:hover) and (pointer:fine) {
  .exam-choose-btn:hover { background: #4f46e5; }
}
.exam-date-input-wrap { display: none; margin-top: 12px; }
.exam-date-input-wrap.open { display: flex; align-items: center; gap: 10px; }

/* ── Checklist ── */
.exam-checklist { display: flex; flex-direction: column; gap: 10px; }
.exam-check-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8f9fc;
  border: 1.5px solid #e2e6f2;
  transition: border-color .18s ease, background .18s ease;
}
.exam-check-row.pass {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.exam-check-row.fail {
  background: #fff7ed;
  border-color: #fed7aa;
}
.exam-check-ico {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.exam-check-row.pass .exam-check-ico { background: #dcfce7; }
.exam-check-row.fail .exam-check-ico { background: #ffedd5; }
.exam-check-row.neutral .exam-check-ico { background: #f1f5f9; }
.exam-check-body { flex: 1; min-width: 0; }
.exam-check-label { font: 600 14px/1.3 'Plus Jakarta Sans',sans-serif; color: #0a0d1a; }
.exam-check-sub { font: 500 12px/1.3 'Inter',sans-serif; color: #64748b; margin-top: 2px; }
.exam-check-badge {
  font: 700 12px/1 'IBM Plex Mono',monospace;
  padding: 4px 8px;
  border-radius: 8px;
  flex-shrink: 0;
}
.exam-check-row.pass .exam-check-badge { background: #dcfce7; color: #15803d; }
.exam-check-row.fail .exam-check-badge { background: #ffedd5; color: #c2410c; }
.exam-check-row.neutral .exam-check-badge { background: #f1f5f9; color: #64748b; }

/* ── Score pill ── */
.exam-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg,rgba(99,102,241,.07),rgba(139,92,246,.07));
  border: 1.5px solid rgba(99,102,241,.18);
  border-radius: 16px;
  margin-top: -2px;
  margin-bottom: 4px;
}
.exam-score-lbl { font: 600 14px/1 'Plus Jakarta Sans',sans-serif; color: #4f46e5; }
.exam-score-val { font: 800 18px/1 'IBM Plex Mono',monospace; color: #4f46e5; }

/* ── Tips ── */
.exam-tips { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.exam-tip {
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
  animation: examSlideUp .38s cubic-bezier(.23,1,.32,1) both;
}
.exam-tip:nth-child(1) { animation-delay:.22s; }
.exam-tip:nth-child(2) { animation-delay:.26s; }
.exam-tip:nth-child(3) { animation-delay:.30s; }
.exam-tip:nth-child(4) { animation-delay:.34s; }
.exam-tip-ico { font-size: 24px; margin-bottom: 8px; display: block; }
.exam-tip-txt { font: 500 13px/1.4 'Inter',sans-serif; color: #374151; }

/* ── Readiness pill ── */
.exam-readiness {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  margin-top: -2px;
  margin-bottom: 16px;
  font: 600 13px/1.3 'Plus Jakarta Sans',sans-serif;
}
.exam-readiness.high { background: #dcfce7; color: #15803d; }
.exam-readiness.mid  { background: #fef9c3; color: #a16207; }
.exam-readiness.low  { background: #fee2e2; color: #b91c1c; }

@media (prefers-reduced-motion:reduce) {
  .exam-card, .exam-tip { animation: none; opacity: 1; }
}
</style>`;

// ─── Constants ───────────────────────────────────────────────────
const LS_KEY_DATE    = 'permigo:exam_date';
const LS_KEY_REVISED = 'permigo:has_revised';
const COMPS_TARGET   = 16; // > 50% of 31
const QUIZ_TARGET    = 70;

const TIPS = [
  { ico: '😴', txt: 'Dors 8h la veille — le cerveau consolide la mémoire pendant le sommeil.' },
  { ico: '🥗', txt: 'Mange léger le matin. Évite le sucre rapide avant l\'examen.' },
  { ico: '⏰', txt: 'Arrive 15 min en avance pour te détendre et vérifier le matériel.' },
  { ico: '🧘', txt: 'Respire par le ventre avant de démarrer. 4 sec inspiré, 4 sec expiré.' },
];

// ─── Helpers ─────────────────────────────────────────────────────
function parseSavedDate() {
  try {
    const v = localStorage.getItem(LS_KEY_DATE);
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

function saveExamDate(iso) {
  try { localStorage.setItem(LS_KEY_DATE, iso); } catch {}
}

function countdown(examDate) {
  const now = Date.now();
  const diff = examDate.getTime() - now;
  if (diff < 0) return { days: 0, hours: 0, minutes: 0, passed: true };
  const totalSec  = Math.floor(diff / 1000);
  const days      = Math.floor(totalSec / 86400);
  const hours     = Math.floor((totalSec % 86400) / 3600);
  const minutes   = Math.floor((totalSec % 3600) / 60);
  return { days, hours, minutes, passed: false };
}

function fmtDate(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isRevised() {
  try { return !!localStorage.getItem(LS_KEY_REVISED); } catch { return false; }
}

// ─── Data ────────────────────────────────────────────────────────
async function loadData(meId) {
  const [validRes, streakRes, quizRes] = await Promise.allSettled([
    sb.from('validations')
      .select('competence_id', { count: 'exact' })
      .eq('eleve_id', meId)
      .eq('statut', 'acquis'),

    sb.from('streaks')
      .select('current_streak')
      .eq('user_id', meId)
      .maybeSingle(),

    sb.from('quiz_attempts')
      .select('score')
      .eq('user_id', meId)
      .not('score', 'is', null),
  ]);

  const compsCount = validRes.value?.count  ?? 0;
  const streak     = streakRes.value?.data?.current_streak ?? 0;
  const scores     = quizRes.value?.data    ?? [];
  const avgScore   = scores.length
    ? Math.round(scores.reduce((s, r) => s + (r.score ?? 0), 0) / scores.length)
    : null;

  return { compsCount, streak, avgScore };
}

// ─── Render helpers ───────────────────────────────────────────────
function renderCountdown(examDate) {
  if (!examDate) {
    return `
<div class="exam-no-date">
  <span class="exam-no-date-emoji">📅</span>
  <div class="exam-no-date-txt">Renseigne ta date d'examen pour voir le compte à rebours.</div>
  <button class="exam-choose-btn" id="exam-btn-choose">
    ${icon('calendar', { size: 16 })} Choisir ma date
  </button>
  <div class="exam-date-input-wrap" id="exam-date-wrap">
    <input type="date" class="exam-date-input" id="exam-date-input" />
    <button class="exam-date-save" id="exam-date-save">Enregistrer</button>
  </div>
</div>`;
  }

  const cd = countdown(examDate);
  const urgent = !cd.passed && cd.days < 7;
  const tileClass = cd.passed ? 'done' : urgent ? 'urgent' : '';

  if (cd.passed) {
    return `
<div style="text-align:center;padding:8px 0">
  <div style="font-size:36px;margin-bottom:8px">🎉</div>
  <div style="font:700 16px/1.3 'Plus Jakarta Sans',sans-serif;color:#0a0d1a;margin-bottom:4px">Ton examen est passé !</div>
  <div style="font:500 13px/1.4 'Inter',sans-serif;color:#64748b;margin-bottom:16px">Bonne chance pour les résultats.</div>
  <button class="exam-choose-btn" id="exam-btn-choose" style="background:#10b981">
    ${icon('calendar', { size: 16 })} Changer la date
  </button>
  <div class="exam-date-input-wrap" id="exam-date-wrap">
    <input type="date" class="exam-date-input" id="exam-date-input" />
    <button class="exam-date-save" id="exam-date-save">Enregistrer</button>
  </div>
</div>`;
  }

  return `
<div class="exam-countdown-tiles">
  <div class="exam-tile ${tileClass}">
    <span class="exam-tile-num">${String(cd.days).padStart(2,'0')}</span>
    <span class="exam-tile-lbl">Jours</span>
  </div>
  <div class="exam-tile ${tileClass}">
    <span class="exam-tile-num">${String(cd.hours).padStart(2,'0')}</span>
    <span class="exam-tile-lbl">Heures</span>
  </div>
  <div class="exam-tile ${tileClass}">
    <span class="exam-tile-num">${String(cd.minutes).padStart(2,'0')}</span>
    <span class="exam-tile-lbl">Minutes</span>
  </div>
</div>
<div style="text-align:center;font:500 12px/1.4 'Inter',sans-serif;color:#64748b;margin-bottom:14px">
  ${urgent ? '⚡ ' : ''}${esc(fmtDate(examDate))}
</div>
<div class="exam-date-row">
  <input type="date" class="exam-date-input" id="exam-date-input" value="${examDate.toISOString().slice(0,10)}" />
  <button class="exam-date-save" id="exam-date-save">Modifier</button>
</div>`;
}

function renderChecklist({ compsCount, streak, avgScore }) {
  const revised = isRevised();

  const criteria = [
    {
      label:  'Parcours REMC > 50%',
      sub:    `${compsCount} compétences validées sur 31`,
      pass:   compsCount >= COMPS_TARGET,
      badge:  `${Math.round((compsCount / 31) * 100)}%`,
      ico:    '🗺️',
    },
    {
      label:  'Streak actif',
      sub:    streak > 0 ? `${streak} jours d'affilée` : 'Reprends l\'application aujourd\'hui',
      pass:   streak > 0,
      badge:  streak > 0 ? `${streak}j` : '0j',
      ico:    '🔥',
    },
    {
      label:  'Score quiz > 70%',
      sub:    avgScore !== null ? `Moyenne : ${avgScore}%` : 'Aucun quiz enregistré',
      pass:   avgScore !== null && avgScore >= QUIZ_TARGET,
      neutral: avgScore === null,
      badge:  avgScore !== null ? `${avgScore}%` : '—',
      ico:    '🧠',
    },
    {
      label:  'Révision complète',
      sub:    revised ? 'Fiches de révision consultées' : 'Consulte les fiches résumé',
      pass:   revised,
      badge:  revised ? '✓' : '—',
      ico:    '📖',
    },
  ];

  const passCount = criteria.filter(c => c.pass).length;
  let readinessClass, readinessTxt;
  if (passCount >= 3) { readinessClass = 'high'; readinessTxt = `${icon('check-circle', { size: 14 })} Tu es bien préparé${passCount === 4 ? ' · Excellent !' : ' · Encore un effort !'}`; }
  else if (passCount >= 2) { readinessClass = 'mid';  readinessTxt = `${icon('alert-triangle', { size: 14 })} Progression correcte · Continue !`; }
  else                    { readinessClass = 'low';  readinessTxt = `${icon('alert-circle', { size: 14 })} Encore du travail · Ne lâche pas !`; }

  const rows = criteria.map(c => {
    const cls = c.neutral ? 'neutral' : c.pass ? 'pass' : 'fail';
    return `<div class="exam-check-row ${cls}" role="listitem">
  <div class="exam-check-ico" aria-hidden="true">${esc(c.ico)}</div>
  <div class="exam-check-body">
    <div class="exam-check-label">${esc(c.label)}</div>
    <div class="exam-check-sub">${esc(c.sub)}</div>
  </div>
  <span class="exam-check-badge">${esc(c.badge)}</span>
</div>`;
  }).join('');

  return `
<div class="exam-readiness ${readinessClass}" role="status">${readinessTxt}</div>
<div class="exam-checklist" role="list">${rows}</div>`;
}

function renderTips() {
  return TIPS.map(t => `
<div class="exam-tip">
  <span class="exam-tip-ico" aria-hidden="true">${t.ico}</span>
  <div class="exam-tip-txt">${esc(t.txt)}</div>
</div>`).join('');
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root) {
  // "Choisir ma date" button → reveal input
  root.querySelector('#exam-btn-choose')?.addEventListener('click', () => {
    const wrap = root.querySelector('#exam-date-wrap');
    wrap?.classList.add('open');
    root.querySelector('#exam-date-input')?.focus();
  });

  // Save / Modifier date
  root.querySelector('#exam-date-save')?.addEventListener('click', () => {
    const input = root.querySelector('#exam-date-input');
    const val   = input?.value;
    if (!val) return;
    saveExamDate(val);
    track('exam.date_set', { date: val });
    // Re-render countdown section only
    const countdownEl = root.querySelector('#exam-countdown-body');
    if (countdownEl) {
      const d = new Date(val);
      countdownEl.innerHTML = renderCountdown(d);
      wire(root);
    }
  });
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page.view', { page: 'eleve_examen' });

  root.innerHTML = `
<div class="exam-skel">
  <div class="exam-skel-block" style="height:60px;margin-bottom:20px"></div>
  <div class="exam-skel-block" style="height:160px"></div>
  <div class="exam-skel-block" style="height:240px"></div>
  <div class="exam-skel-block" style="height:160px"></div>
</div>`;

  const data     = await loadData(me.id);
  const examDate = parseSavedDate();

  root.innerHTML = `${STYLE}
<div class="exam">

  <!-- 1. HEADER -->
  <div class="exam-hd exam-card" style="background:transparent;border:0;box-shadow:none;padding:0;margin-bottom:16px">
    <div class="exam-hd-ico" aria-hidden="true">🎓</div>
    <div>
      <div class="exam-hd-title">Mon examen B</div>
      <div class="exam-hd-sub">Prépare-toi sereinement pour le grand jour.</div>
    </div>
  </div>

  <!-- 2. COUNTDOWN -->
  <div class="exam-card" id="exam-countdown-card">
    <div class="exam-card-title">Compte à rebours</div>
    <div id="exam-countdown-body">
      ${renderCountdown(examDate)}
    </div>
  </div>

  <!-- 3. CHECKLIST -->
  <div class="exam-card">
    <div class="exam-card-title">Suis-je prêt ?</div>
    ${renderChecklist(data)}
  </div>

  <!-- 4. TIPS -->
  <div class="exam-card">
    <div class="exam-card-title">Conseils dernière ligne droite</div>
    <div class="exam-tips">
      ${renderTips()}
    </div>
  </div>

</div>`;

  wire(root);
}
