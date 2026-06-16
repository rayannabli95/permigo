// ═══════════════════════════════════════════════════════════════
// Élève — Mon examen B
// Countdown · Checklist "Suis-je prêt ?" · Conseils
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout ── */
.exam {
  padding: 20px 16px 100px;
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  color: var(--ink);
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
  background: linear-gradient(90deg,var(--bg3) 0%,var(--bg5) 50%,var(--bg3) 100%);
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
  background: var(--a);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.exam-hd-title { font: 700 22px/1.2 'Plus Jakarta Sans',sans-serif; color: var(--ink); }
.exam-hd-sub { font: 500 13px/1.4 'Inter',sans-serif; color: var(--mu3); margin-top: 2px; }

/* ── Shared card ── */
.exam-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.exam-card-title {
  font: 700 13px/1 'Plus Jakarta Sans',sans-serif;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--mu2);
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
  background: linear-gradient(145deg,var(--su2),var(--bg3));
  border: 1.5px solid var(--bo);
  border-radius: 16px;
  padding: 14px 8px 10px;
  text-align: center;
}
.exam-tile-num {
  font: 800 30px/1 'IBM Plex Mono',monospace;
  color: var(--ink);
  display: block;
}
.exam-tile-lbl {
  font: 500 10px/1 'Inter',sans-serif;
  color: var(--mu2);
  text-transform: uppercase;
  letter-spacing: .06em;
  display: block;
  margin-top: 6px;
}
.exam-tile.urgent { border-color: #fca5a5; background: linear-gradient(145deg,#fff5f5,var(--rdp2)); }
.exam-tile.urgent .exam-tile-num { color: var(--rd-txt); }
.exam-tile.done { border-color: #bbf7d0; background: linear-gradient(145deg,#f0fdf4,var(--grp2)); }
.exam-tile.done .exam-tile-num { color: var(--grk); }

.exam-date-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.exam-date-input {
  flex: 1;
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  padding: 10px 14px;
  font: 500 14px/1 'Inter',sans-serif;
  color: var(--ink);
  background: var(--bg);
  outline: none;
  transition: border-color .18s ease;
  min-height: 44px;
}
.exam-date-input:focus { border-color: var(--a); background: var(--su); }
.exam-date-save {
  padding: 10px 18px;
  background: var(--a);
  color: var(--a-ink);
  border: 0;
  border-radius: 12px;
  font: 600 14px/1 'Plus Jakarta Sans',sans-serif;
  cursor: pointer;
  min-height: 44px;
  transition: transform .16s cubic-bezier(.23,1,.32,1), background .16s;
  flex-shrink: 0;
}
.exam-date-save:hover { background: var(--adk); }
@media (hover:hover) and (pointer:fine) {
  .exam-date-save:hover { background: var(--adk); }
}
.exam-date-save:active { transform: scale(.97); }

.exam-no-date {
  text-align: center;
  padding: 8px 0 4px;
}
.exam-no-date-emoji { font-size: 36px; display: block; margin-bottom: 8px; }
.exam-no-date-txt { font: 500 14px/1.4 'Inter',sans-serif; color: var(--mu3); margin-bottom: 16px; }
.exam-choose-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
  box-shadow: 0 2px 10px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
  color: var(--a-ink);
  border: 0;
  border-radius: 14px;
  font: 600 14px/1 'Plus Jakarta Sans',sans-serif;
  cursor: pointer;
  min-height: 44px;
  transition: transform .16s cubic-bezier(.23,1,.32,1), filter .16s;
}
.exam-choose-btn:active { transform: scale(.97); }
@media (hover:hover) and (pointer:fine) {
  .exam-choose-btn:hover { filter: brightness(1.05); }
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
  background: var(--bg);
  border: 1.5px solid var(--bo);
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
.exam-check-row.pass .exam-check-ico { background: var(--grp2); }
.exam-check-row.fail .exam-check-ico { background: #ffedd5; }
.exam-check-row.neutral .exam-check-ico { background: var(--bg4); }
.exam-check-body { flex: 1; min-width: 0; }
.exam-check-label { font: 600 14px/1.3 'Plus Jakarta Sans',sans-serif; color: var(--ink); }
.exam-check-sub { font: 500 12px/1.3 'Inter',sans-serif; color: var(--mu3); margin-top: 2px; }
.exam-check-badge {
  font: 700 12px/1 'IBM Plex Mono',monospace;
  padding: 4px 8px;
  border-radius: 8px;
  flex-shrink: 0;
}
.exam-check-row.pass .exam-check-badge { background: var(--grp2); color: var(--grk2); }
.exam-check-row.fail .exam-check-badge { background: #ffedd5; color: #c2410c; }
.exam-check-row.neutral .exam-check-badge { background: var(--bg4); color: var(--mu3); }

/* ── Score pill ── */
.exam-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg,color-mix(in srgb, var(--a) 7%, transparent),color-mix(in srgb, var(--a) 5%, transparent));
  border: 1.5px solid color-mix(in srgb, var(--a) 18%, transparent);
  border-radius: 16px;
  margin-top: -2px;
  margin-bottom: 4px;
}
.exam-score-lbl { font: 600 14px/1 'Plus Jakarta Sans',sans-serif; color: var(--adk); }
.exam-score-val { font: 800 18px/1 'IBM Plex Mono',monospace; color: var(--adk); }

/* ── Tips ── */
.exam-tips { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.exam-tip {
  background: var(--su);
  border: 1.5px solid var(--bo);
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
.exam-tip-txt { font: 500 13px/1.4 'Inter',sans-serif; color: var(--ink5); }

/* ── Predict card ── */
.exam-predict {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.exam-predict-ico {
  width: 40px; height: 40px; flex-shrink: 0;
  background: linear-gradient(135deg,color-mix(in srgb, var(--a) 10%, transparent),color-mix(in srgb, var(--a) 7%, transparent));
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.exam-predict-body { flex: 1; min-width: 0; }
.exam-predict-title { font: 700 14px/1.2 'Plus Jakarta Sans',sans-serif; color: var(--ink); }
.exam-predict-sub { font: 500 12px/1.4 'Inter',sans-serif; color: var(--mu3); margin-top: 3px; }
.exam-predict-track {
  height: 6px; background: var(--bo);
  border-radius: 3px; overflow: hidden; margin: 10px 0 5px;
}
.exam-predict-fill { height: 100%; border-radius: 3px; background: var(--a); transition: width .5s ease; }
.exam-predict-labels {
  display: flex; justify-content: space-between;
  font: 500 10px/1 'Inter',sans-serif; color: var(--mu2);
}
.exam-predict-ready {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 0;
}
.exam-predict-ready .exam-predict-title { color: var(--grk2); }

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
.exam-readiness.high { background: var(--grp2); color: var(--grk2); }
.exam-readiness.mid  { background: #fef9c3; color: #a16207; }
.exam-readiness.low  { background: var(--rdp2); color: var(--rdx); }

@media (prefers-reduced-motion:reduce) {
  .exam-card, .exam-tip { animation: none; opacity: 1; }
}
</style>`;

// ─── Constants ───────────────────────────────────────────────────
const LS_KEY_DATE = "permigo:exam_date";
const LS_KEY_REVISED = "permigo:has_revised";
const COMPS_TARGET = 16; // > 50% of 31
const QUIZ_TARGET = 70;

const TIPS = [
  {
    ico: icon("moon", { size: 20, strokeWidth: 1.5 }),
    txt: "Dors 8h la veille — le cerveau consolide la mémoire pendant le sommeil.",
  },
  {
    ico: icon("zap", { size: 20, strokeWidth: 1.5 }),
    txt: "Mange léger le matin. Évite le sucre rapide avant l'examen.",
  },
  {
    ico: icon("clock", { size: 20, strokeWidth: 1.5 }),
    txt: "Arrive 15 min en avance pour te détendre et vérifier le matériel.",
  },
  {
    ico: icon("activity", { size: 20, strokeWidth: 1.5 }),
    txt: "Respire par le ventre avant de démarrer. 4 sec inspiré, 4 sec expiré.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────
function parseSavedDate() {
  try {
    const v = localStorage.getItem(LS_KEY_DATE);
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function saveExamDate(iso) {
  try {
    localStorage.setItem(LS_KEY_DATE, iso);
  } catch {}
}

function countdown(examDate) {
  const now = Date.now();
  const diff = examDate.getTime() - now;
  if (diff < 0) return { days: 0, hours: 0, minutes: 0, passed: true };
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  return { days, hours, minutes, passed: false };
}

function fmtDate(d) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isRevised() {
  try {
    return !!localStorage.getItem(LS_KEY_REVISED);
  } catch {
    return false;
  }
}

// ─── Data ────────────────────────────────────────────────────────
async function loadData(meId) {
  const [validRes, streakRes, quizRes, predictRes] = await Promise.allSettled([
    sb
      .from("validations")
      .select("competence_id", { count: "exact" })
      .eq("eleve_id", meId)
      .eq("statut", "acquis"),

    sb
      .from("streaks")
      .select("current_streak")
      .eq("user_id", meId)
      .maybeSingle(),

    sb
      .from("quiz_attempts")
      .select("score")
      .eq("user_id", meId)
      .not("score", "is", null),

    sb.rpc("predict_exam_ready_date"),
  ]);

  // Compétences acquises (distinctes). On dérive les BASES C1-C3 (24)
  // pour aligner la readiness élève sur la règle moniteur (« prêt » =
  // 100% des bases validées par le moniteur).
  const validRows = validRes.value?.data ?? [];
  const acquisSet = new Set(
    validRows.map((v) => v.competence_id).filter(Boolean),
  );
  const compsCount = acquisSet.size;
  const baseAcquis = [...acquisSet].filter((c) => /^C[123]/.test(c)).length;

  const streak = streakRes.value?.data?.current_streak ?? 0;
  const scores = quizRes.value?.data ?? [];
  const avgScore = scores.length
    ? Math.round(scores.reduce((s, r) => s + (r.score ?? 0), 0) / scores.length)
    : null;

  const predictRaw = predictRes.value?.data;
  const predict = predictRaw?.error ? null : predictRaw || null;

  return { compsCount, baseAcquis, streak, avgScore, predict };
}

// ─── Render helpers ───────────────────────────────────────────────
function renderCountdown(examDate) {
  if (!examDate) {
    return `
<div class="exam-no-date">
  <span class="exam-no-date-emoji">${icon("calendar", { size: 26 })}</span>
  <div class="exam-no-date-txt">Renseigne ta date d'examen pour voir le compte à rebours.</div>
  <button class="exam-choose-btn" id="exam-btn-choose">
    ${icon("calendar", { size: 16 })} Choisir ma date
  </button>
  <div class="exam-date-input-wrap" id="exam-date-wrap">
    <input type="date" class="exam-date-input" id="exam-date-input" />
    <button class="exam-date-save" id="exam-date-save">Enregistrer</button>
  </div>
</div>`;
  }

  const cd = countdown(examDate);
  const urgent = !cd.passed && cd.days < 7;
  const tileClass = cd.passed ? "done" : urgent ? "urgent" : "";

  if (cd.passed) {
    return `
<div style="text-align:center;padding:8px 0">
  <div style="margin-bottom:8px;color:var(--gr)">${icon("check-circle", { size: 34 })}</div>
  <div style="font:700 16px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:4px">Ton examen est passé !</div>
  <div style="font:500 13px/1.4 'Inter',sans-serif;color:var(--mu3);margin-bottom:16px">Bonne chance pour les résultats.</div>
  <button class="exam-choose-btn" id="exam-btn-choose" style="background:var(--gr)">
    ${icon("calendar", { size: 16 })} Changer la date
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
    <span class="exam-tile-num">${String(cd.days).padStart(2, "0")}</span>
    <span class="exam-tile-lbl">Jours</span>
  </div>
  <div class="exam-tile ${tileClass}">
    <span class="exam-tile-num">${String(cd.hours).padStart(2, "0")}</span>
    <span class="exam-tile-lbl">Heures</span>
  </div>
  <div class="exam-tile ${tileClass}">
    <span class="exam-tile-num">${String(cd.minutes).padStart(2, "0")}</span>
    <span class="exam-tile-lbl">Minutes</span>
  </div>
</div>
<div style="text-align:center;font:500 12px/1.4 'Inter',sans-serif;color:var(--mu3);margin-bottom:14px">
  ${urgent ? "" : ""}${esc(fmtDate(examDate))}
</div>
<div class="exam-date-row">
  <input type="date" class="exam-date-input" id="exam-date-input" value="${examDate.toISOString().slice(0, 10)}" />
  <button class="exam-date-save" id="exam-date-save">Modifier</button>
</div>`;
}

const PREDICT_TARGET = 28;

function renderPredict({ compsCount, predict }) {
  const pct = Math.min(100, Math.round((compsCount / PREDICT_TARGET) * 100));

  if (compsCount >= PREDICT_TARGET) {
    return `
<div class="exam-predict-ready">
  <span aria-hidden="true" style="color:var(--gr)">${icon("check-circle", { size: 26 })}</span>
  <div>
    <div class="exam-predict-title">Tu es prêt pour l'examen !</div>
    <div class="exam-predict-sub">${compsCount}/31 compétences validées — objectif atteint</div>
  </div>
</div>`;
  }

  const dateStr = predict?.predicted_date
    ? new Date(predict.predicted_date + "T12:00:00").toLocaleDateString(
        "fr-FR",
        { day: "numeric", month: "long", year: "numeric" },
      )
    : null;
  const advice =
    predict?.advice ||
    `Encore ${PREDICT_TARGET - compsCount} compétences à valider`;

  return `
<div class="exam-predict">
  <div class="exam-predict-ico">${icon("calendar", { size: 18, color: "var(--a)" })}</div>
  <div class="exam-predict-body">
    <div class="exam-predict-title">${dateStr ? `Prêt vers le ${esc(dateStr)}` : "Estimation en cours…"}</div>
    <div class="exam-predict-sub">${esc(advice)}</div>
  </div>
</div>
<div class="exam-predict-track">
  <div class="exam-predict-fill" style="width:${pct}%"></div>
</div>
<div class="exam-predict-labels">
  <span>${compsCount} validées</span>
  <span>${pct}% · objectif ${PREDICT_TARGET}</span>
  <span>${PREDICT_TARGET} cible</span>
</div>`;
}

const BASE_TOTAL = 24; // C1+C2+C3 (mêmes bases que la readiness moniteur)

function renderChecklist({ compsCount, baseAcquis = 0, streak, avgScore }) {
  const revised = isRevised();
  const baseRestantes = Math.max(0, BASE_TOTAL - baseAcquis);

  const criteria = [
    {
      label: "Parcours > 50%",
      sub: `${compsCount} compétences validées sur 31`,
      pass: compsCount >= COMPS_TARGET,
      badge: `${Math.round((compsCount / 31) * 100)}%`,
      ico: icon("map", { size: 20 }),
    },
    {
      label: "Streak actif",
      sub:
        streak > 0
          ? `${streak} jours d'affilée`
          : "Reprends l'application aujourd'hui",
      pass: streak > 0,
      badge: streak > 0 ? `${streak}j` : "0j",
      ico: icon("flame", { size: 20 }),
    },
    {
      label: "Score quiz > 70%",
      sub:
        avgScore !== null ? `Moyenne : ${avgScore}%` : "Aucun quiz enregistré",
      pass: avgScore !== null && avgScore >= QUIZ_TARGET,
      neutral: avgScore === null,
      badge: avgScore !== null ? `${avgScore}%` : "—",
      ico: icon("lightbulb", { size: 20 }),
    },
    {
      label: "Révision complète",
      sub: revised
        ? "Fiches de révision consultées"
        : "Consulte les fiches résumé",
      pass: revised,
      badge: revised ? "✓" : "—",
      ico: icon("book", { size: 20 }),
    },
  ];

  // Verdict ALIGNÉ sur le moniteur : « prêt » = 100% des bases C1-C3
  // validées par le moniteur (source de vérité). Les critères ci-dessous
  // (quiz, streak, révision) restent des conseils de préparation perso.
  let readinessClass, readinessTxt;
  if (baseAcquis >= BASE_TOTAL) {
    readinessClass = "high";
    readinessTxt = `${icon("check-circle", { size: 14 })} Prêt pour l'examen — ton moniteur a validé tes ${BASE_TOTAL} compétences de base`;
  } else if (baseAcquis >= 18) {
    readinessClass = "mid";
    readinessTxt = `${icon("alert-triangle", { size: 14 })} Bientôt prêt — ${baseRestantes} compétence${baseRestantes > 1 ? "s" : ""} de base à faire valider par ton moniteur`;
  } else {
    readinessClass = "low";
    readinessTxt = `${icon("alert-circle", { size: 14 })} En préparation — tes compétences se valident en leçon avec ton moniteur`;
  }

  const rows = criteria
    .map((c) => {
      const cls = c.neutral ? "neutral" : c.pass ? "pass" : "fail";
      return `<div class="exam-check-row ${cls}" role="listitem">
  <div class="exam-check-ico" aria-hidden="true">${c.ico}</div>
  <div class="exam-check-body">
    <div class="exam-check-label">${esc(c.label)}</div>
    <div class="exam-check-sub">${esc(c.sub)}</div>
  </div>
  <span class="exam-check-badge">${esc(c.badge)}</span>
</div>`;
    })
    .join("");

  return `
<div class="exam-readiness ${readinessClass}" role="status">${readinessTxt}</div>
<div class="exam-checklist" role="list">${rows}</div>`;
}

function renderTips() {
  return TIPS.map(
    (t) => `
<div class="exam-tip">
  <span class="exam-tip-ico" aria-hidden="true">${t.ico}</span>
  <div class="exam-tip-txt">${esc(t.txt)}</div>
</div>`,
  ).join("");
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root) {
  // "Choisir ma date" button → reveal input
  root.querySelector("#exam-btn-choose")?.addEventListener("click", () => {
    const wrap = root.querySelector("#exam-date-wrap");
    wrap?.classList.add("open");
    root.querySelector("#exam-date-input")?.focus();
  });

  // Save / Modifier date
  root.querySelector("#exam-date-save")?.addEventListener("click", () => {
    const input = root.querySelector("#exam-date-input");
    const val = input?.value;
    if (!val) return;
    saveExamDate(val);
    track("exam.date_set", { date: val });
    // Re-render countdown section only
    const countdownEl = root.querySelector("#exam-countdown-body");
    if (countdownEl) {
      const d = new Date(val);
      countdownEl.innerHTML = renderCountdown(d);
      wire(root);
    }
  });

  // Entrée vers la fiche centre d'examen
  root.querySelector("#exam-centre-link")?.addEventListener("click", () => {
    track("exam.centre_open", {});
  });
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  // #11 — plein écran d'épreuve : masque la bottom nav (anti-triche, anti-distraction)
  document.getElementById("bottom-nav")?.setAttribute("hidden", "");
  const _restoreNav = () => {
    document.getElementById("bottom-nav")?.removeAttribute("hidden");
    window.removeEventListener("hashchange", _restoreNav);
  };
  window.addEventListener("hashchange", _restoreNav);

  track("page.view", { page: "eleve_examen" });

  root.innerHTML = `
<div class="exam-skel">
  <div class="exam-skel-block" style="height:60px;margin-bottom:20px"></div>
  <div class="exam-skel-block" style="height:160px"></div>
  <div class="exam-skel-block" style="height:240px"></div>
  <div class="exam-skel-block" style="height:160px"></div>
</div>`;

  const data = await loadData(me.id);
  const examDate = parseSavedDate();

  root.innerHTML = `${STYLE}
<div class="exam">

  <!-- 1. HEADER -->
  <div class="exam-hd exam-card" style="background:transparent;border:0;box-shadow:none;padding:0;margin-bottom:16px">
    <div class="exam-hd-ico" aria-hidden="true">${icon("graduation-cap", { size: 34 })}</div>
    <div>
      <h1 class="exam-hd-title">Ton examen blanc</h1>
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

  <!-- 3. PREDICT -->
  <div class="exam-card">
    <div class="exam-card-title">Prévision de préparation</div>
    ${renderPredict(data)}
  </div>

  <!-- 4. CHECKLIST -->
  <div class="exam-card">
    <div class="exam-card-title">Suis-je prêt ?</div>
    ${renderChecklist(data)}
  </div>

  <!-- 5. TIPS -->
  <div class="exam-card">
    <div class="exam-card-title">Conseils dernière ligne droite</div>
    <div class="exam-tips">
      ${renderTips()}
    </div>
  </div>

  <!-- 6. CENTRE D'EXAMEN -->
  <a href="#/centre-examen" class="exam-card exam-centre" id="exam-centre-link"
     style="display:flex;align-items:center;gap:14px;text-decoration:none;color:inherit;cursor:pointer">
    <div style="width:44px;height:44px;border-radius:12px;background:var(--a);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
      ${icon("map", { size: 22 })}
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-size:15px;font-weight:800">Connais ton centre d'examen</div>
      <div style="font-size:13px;color:var(--mu2);margin-top:2px">Difficulté, pièges du parcours, conseils sur place.</div>
    </div>
    ${icon("chevron-right", { size: 20, color: "var(--mu3)" })}
  </a>

</div>`;

  wire(root);
}
