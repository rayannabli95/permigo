// ═══════════════════════════════════════════════════════════════
// Élève — Mon examen B
// Countdown · Checklist "Suis-je prêt ?" · Conseils
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { isSoloEleve } from "@/utils/league-bots.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { hideBottomNav } from "@/utils/nav.js";

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout ── */
.exam {
  /* #app (has-chrome) compense déjà le header fixe — pas de gros vide en tête */
  padding: 8px 16px 100px;
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
  padding: 8px 16px 100px;
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
}
.exam-hd-ico {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.exam-hd-ico .pg-med {
  filter: drop-shadow(0 5px 12px color-mix(in srgb, var(--adk, #f08a12) 30%, transparent));
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
/* fonds theme-aware : un fond clair codé en dur cassait la lisibilité du
   num/label (var(--ink)/var(--mu2)) en mode sombre (a11y) */
.exam-tile.urgent { border-color: color-mix(in srgb, var(--rd) 40%, transparent); background: var(--rdp); }
.exam-tile.urgent .exam-tile-num { color: var(--rd-txt); }
.exam-tile.done { border-color: color-mix(in srgb, var(--gr) 40%, transparent); background: var(--grp); }
.exam-tile.done .exam-tile-num { color: var(--gr-txt); }

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
/* fonds theme-aware (translucides) : en dark le texte var(--ink) devient clair,
   un fond clair codé en dur le rendait illisible (a11y) */
.exam-check-row.pass {
  background: var(--grp);
  border-color: color-mix(in srgb, var(--gr) 32%, transparent);
}
.exam-check-row.fail {
  background: var(--amp);
  border-color: color-mix(in srgb, var(--am) 32%, transparent);
}
.exam-check-ico {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.exam-check-ico .pg-med {
  filter: drop-shadow(0 3px 6px rgba(10,13,26,.18));
}
.exam-check-body { flex: 1; min-width: 0; }
.exam-check-label { font: 600 14px/1.3 'Plus Jakarta Sans',sans-serif; color: var(--ink); }
.exam-check-sub { font: 500 12px/1.5 'Inter',sans-serif; color: var(--mu); margin-top: 2px; }
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
.exam-tip-ico { margin-bottom: 8px; display: flex; }
.exam-tip-ico .pg-med { filter: drop-shadow(0 4px 8px rgba(10,13,26,.16)); }
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
.exam-predict-ready .exam-predict-title { color: var(--gr-txt); }
.exam-predict-almost {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 0;
}

/* ── Readiness pill ── */
.exam-readiness {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  margin-top: -2px;
  margin-bottom: 16px;
  font: 600 13px/1.5 'Plus Jakarta Sans',sans-serif;
}
.exam-readiness.high { background: var(--grp2); color: var(--grk2); }
.exam-readiness.mid  { background: #fef9c3; color: #a16207; }
.exam-readiness.low  { background: var(--rdp2); color: var(--rdx); }

@media (prefers-reduced-motion:reduce) {
  .exam-card, .exam-tip { animation: none; opacity: 1; }
}
</style>`;

// ─── Constants ───────────────────────────────────────────────────
// ⚠️ LS_KEY_DATE/LS_KEY_REVISED, les seuils et la readiness sont réutilisés
// tels quels par le hub « Mon permis » (mon-permis.js, chantier nav
// simplifiée) via les exports ci-dessous — AUCUNE re-déclaration de seuil,
// la readiness reste gelée (même règle moniteur, même vérité) dans les 2 écrans.
const LS_KEY_DATE = "permigo:exam_date";
const LS_KEY_REVISED = "permigo:has_revised";
const COMPS_TARGET = 16; // > 50% of 31
const QUIZ_TARGET = 70;

const TIPS = [
  {
    ico: medallion("lune", "indigo", { size: 34 }),
    txt: "Dors 8 h la veille. Le cerveau consolide la mémoire pendant le sommeil.",
  },
  {
    ico: medallion("eclair", "orange", { size: 34 }),
    txt: "Mange léger le matin. Évite le sucre rapide avant l’examen.",
  },
  {
    ico: medallion("horloge", "blue", { size: 34 }),
    txt: "Arrive 15 min en avance. Le temps de te détendre et de vérifier le matériel.",
  },
  {
    ico: medallion("stats", "teal", { size: 34 }),
    txt: "Respire par le ventre avant de démarrer. 4 s inspiré, 4 s expiré.",
  },
];

// ─── Helpers (exportés : réutilisés tels quels par mon-permis.js — même
// mécanisme localStorage, ne PAS dupliquer la lecture/écriture de la date) ──
export function parseSavedDate() {
  try {
    const v = localStorage.getItem(LS_KEY_DATE);
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function saveExamDate(iso) {
  try {
    localStorage.setItem(LS_KEY_DATE, iso);
  } catch {}
}

export function countdown(examDate) {
  const now = Date.now();
  const diff = examDate.getTime() - now;
  if (diff < 0) return { days: 0, hours: 0, minutes: 0, passed: true };
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  return { days, hours, minutes, passed: false };
}

export function fmtDate(d) {
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

// ─── Data (exportée : mon-permis.js appelle CETTE MÊME fonction pour son
// étape ③ « L'examen » — un seul calcul de readiness dans toute l'app) ────
export async function loadData(meId) {
  const [validRes, streakRes, quizRes, predictRes, selfValRes] =
    await Promise.allSettled([
      sb
        .from("validations")
        .select("competence_id", { count: "exact" })
        .eq("eleve_id", meId)
        .eq("statut", "acquis"),

      sb
        .from("streaks")
        .select("current_streak, last_activity_date")
        .eq("user_id", meId)
        .maybeSingle(),

      sb
        .from("quiz_attempts")
        .select("score")
        .eq("user_id", meId)
        .not("score", "is", null),

      sb.rpc("predict_exam_ready_date"),

      // Validation autonome (élève solo, valider-seul.js) : fusionnée pour
      // que la readiness ne reste pas bloquée à 0/31 pour un compte sans
      // moniteur. Même pattern que mon-permis.js / accueil.js.
      sb.from("self_validations").select("competence_id").eq("eleve_id", meId),
    ]);

  // Compétences acquises (distinctes). On dérive les BASES C1-C3 (24)
  // pour aligner la readiness élève sur la règle moniteur (« prêt » =
  // 100% des bases validées par le moniteur).
  const validRows = validRes.value?.data ?? [];
  const acquisSet = new Set(
    validRows.map((v) => v.competence_id).filter(Boolean),
  );
  for (const s of selfValRes.value?.data ?? [])
    if (s.competence_id) acquisSet.add(s.competence_id);
  const compsCount = acquisSet.size;
  const baseAcquis = [...acquisSet].filter((c) => /^C[123]/.test(c)).length;

  // Série RÉELLE : la valeur stockée ne se reset côté serveur qu'au prochain
  // login. Si la dernière activité est plus vieille qu'hier, la série est morte
  // → 0 (sinon la checklist « Suis-je prêt ? » coche « série active » à tort pour
  // un élève inactif qui ouvre #/examen sans passer par l'accueil).
  const _streakRow = streakRes.value?.data;
  const _yesterdayStr = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);
  const streak =
    _streakRow && _streakRow.last_activity_date >= _yesterdayStr
      ? (_streakRow.current_streak ?? 0)
      : 0;
  const scores = quizRes.value?.data ?? [];
  const avgScore = scores.length
    ? Math.round(scores.reduce((s, r) => s + (r.score ?? 0), 0) / scores.length)
    : null;

  const predictRaw = predictRes.value?.data;
  const predict = predictRaw?.error ? null : predictRaw || null;

  // Fetch critique : si les validations n'ont pas pu être lues, on ne doit
  // pas afficher « 0 compétence » ni une readiness fausse (dégradation silencieuse)
  const loadFailed = validRes.status !== "fulfilled" || !!validRes.value?.error;

  return { compsCount, baseAcquis, streak, avgScore, predict, loadFailed };
}

// ─── Render helpers ───────────────────────────────────────────────
function renderCountdown(examDate) {
  if (!examDate) {
    return `
<div class="exam-no-date">
  <span class="exam-no-date-emoji">${icon("calendar", { size: 26 })}</span>
  <div class="exam-no-date-txt">Ajoute ta date d’examen pour lancer le compte à rebours.</div>
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
  <div style="font:700 16px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:4px">Ton examen est passé</div>
  <div style="font:500 13px/1.5 'Inter',sans-serif;color:var(--mu3);margin-bottom:16px">Bonne chance pour les résultats.</div>
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

function renderPredict(data) {
  const { compsCount, predict } = data;
  const pct = Math.min(100, Math.round((compsCount / PREDICT_TARGET) * 100));

  if (compsCount >= PREDICT_TARGET) {
    // Jamais un « prêt » vert au-dessus d'un critère rouge dans la checklist :
    // si un critère de préparation n'est pas atteint, on nuance le verdict.
    const fails = buildCriteria(data).filter((c) => !c.pass && !c.neutral);
    if (!fails.length) {
      return `
<div class="exam-predict-ready">
  <span aria-hidden="true">${medallion("check", "green", { size: 24 })}</span>
  <div>
    <div class="exam-predict-title">Prêt pour l’examen</div>
    <div class="exam-predict-sub">${compsCount}/31 compétences validées · objectif atteint</div>
  </div>
</div>`;
    }
    return `
<div class="exam-predict-almost">
  <span aria-hidden="true">${medallion("panneau", "orange", { size: 24 })}</span>
  <div>
    <div class="exam-predict-title">Presque prêt · encore ${fails.length} critère${fails.length > 1 ? "s" : ""}</div>
    <div class="exam-predict-sub">${compsCount}/31 validées. Reste : ${esc(fails.map((f) => f.label).join(" · "))}</div>
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
    <div class="exam-predict-title">${dateStr ? `Prêt vers le ${esc(dateStr)}` : "Estimation en cours"}</div>
    <div class="exam-predict-sub">${esc(advice)}</div>
  </div>
</div>
<div class="exam-predict-track">
  <div class="exam-predict-fill" style="width:${pct}%"></div>
</div>
<div class="exam-predict-labels">
  <span>${compsCount} validées</span>
  <span>${pct}% de l’objectif</span>
  <span>cible ${PREDICT_TARGET}</span>
</div>`;
}

// Exportée : mon-permis.js en a besoin pour situer son hero « X/31 » sur les
// mêmes bases que la readiness (aucune re-déclaration).
export const BASE_TOTAL = 24; // C1+C2+C3 (mêmes bases que la readiness moniteur)

// Verdict 3 niveaux — EXTRAIT de renderChecklist (même calcul, zéro
// changement de comportement) pour être réutilisable sans dupliquer les
// seuils. mon-permis.js appelle cette fonction telle quelle pour son
// étape ③ : la readiness reste gelée, jamais recalculée « à la main ».
// Depuis le pivot 17/07, rattaché ou solo : c'est l'élève qui certifie son
// parcours. Le paramètre `solo` reste accepté (appelants inchangés) mais ne
// change plus le texte — « Ton moniteur a validé » était devenu faux.
export function buildVerdict({ baseAcquis = 0, solo = false } = {}) {
  void solo;
  const baseRestantes = Math.max(0, BASE_TOTAL - baseAcquis);
  if (baseAcquis >= BASE_TOTAL) {
    return {
      level: "high",
      text: `Prêt·e pour l’examen. Tes ${BASE_TOTAL} compétences de base sont validées.`,
    };
  }
  if (baseAcquis >= 18) {
    return {
      level: "mid",
      text: `Bientôt prêt·e. ${baseRestantes} compétence${baseRestantes > 1 ? "s" : ""} de base à valider.`,
    };
  }
  return {
    level: "low",
    text: "En préparation. Valide tes compétences au fil de tes leçons et de tes révisions.",
  };
}

export function buildCriteria({ compsCount, streak, avgScore }) {
  const revised = isRevised();
  return [
    {
      label: "Parcours au-dessus de 50 %",
      sub: `${compsCount} compétences validées sur 31`,
      pass: compsCount >= COMPS_TARGET,
      badge: `${Math.round((compsCount / 31) * 100)}%`,
      ico: medallion("carte", "blue", { size: 30 }),
    },
    {
      label: "Série active",
      sub:
        streak > 0
          ? `${streak} jour${streak > 1 ? "s" : ""} d’affilée`
          : "Reviens réviser aujourd’hui",
      pass: streak > 0,
      badge: streak > 0 ? `${streak}j` : "0j",
      ico: medallion("flamme", "orange", { size: 30 }),
    },
    {
      label: "Score quiz au-dessus de 70 %",
      sub:
        avgScore !== null ? `Moyenne : ${avgScore}%` : "Aucun quiz enregistré",
      pass: avgScore !== null && avgScore >= QUIZ_TARGET,
      neutral: avgScore === null,
      badge: avgScore !== null ? `${avgScore}%` : "—",
      ico: medallion("ampoule", "gold", { size: 30 }),
    },
    {
      label: "Révision faite",
      sub: revised
        ? "Fiches de révision consultées"
        : "Consulte tes fiches de révision",
      pass: revised,
      badge: revised ? "✓" : "—",
      ico: medallion("livret", "violet", { size: 30 }),
    },
  ];
}

const READINESS_ICON = {
  high: "check-circle",
  mid: "alert-triangle",
  low: "alert-circle",
};

function renderChecklist(data) {
  const criteria = buildCriteria(data);

  // Verdict ALIGNÉ sur le moniteur : « prêt » = 100% des bases C1-C3
  // validées par le moniteur (source de vérité). Les critères ci-dessous
  // (quiz, streak, révision) restent des conseils de préparation perso.
  // Élève solo : mêmes seuils, libellés sans « ton moniteur ».
  const verdict = buildVerdict({ ...data, solo: isSoloEleve(getCurUser()) });
  const readinessClass = verdict.level;
  const readinessTxt = `${icon(READINESS_ICON[verdict.level], { size: 14 })} ${verdict.text}`;

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
  const _restoreNav = hideBottomNav();

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

  // Panne réseau sur les données critiques : état clair + retry,
  // plutôt que « 0 compétence » et une readiness fausse (anxiogène avant l'examen)
  if (data.loadFailed) {
    root.innerHTML = `${STYLE}
<div class="exam">
  <div class="exam-hd">
    <div class="exam-hd-ico" aria-hidden="true">${medallion("examen", "gold", { size: 48 })}</div>
    <div>
      <h1 class="exam-hd-title">Ton examen</h1>
      <div class="exam-hd-sub">Ton compte à rebours et où tu en es.</div>
    </div>
  </div>
  <div class="exam-card" style="text-align:center;padding:28px 20px">
    <div style="margin-bottom:10px;color:var(--mu3)">${icon("alert-circle", { size: 30 })}</div>
    <div style="font:700 15px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:6px">« Ton examen » indisponible</div>
    <div style="font:500 13px/1.5 'Inter',sans-serif;color:var(--mu3);margin-bottom:16px">Vérifie ta connexion, puis réessaie.</div>
    <button class="exam-choose-btn" id="exam-retry">Réessayer</button>
  </div>
</div>`;
    root
      .querySelector("#exam-retry")
      ?.addEventListener("click", () => mount(root));
    return;
  }

  root.innerHTML = `${STYLE}
<div class="exam">

  <!-- 1. HEADER -->
  <div class="exam-hd exam-card" style="background:transparent;border:0;box-shadow:none;padding:0;margin-bottom:16px">
    <div class="exam-hd-ico" aria-hidden="true">${medallion("examen", "gold", { size: 48 })}</div>
    <div>
      <h1 class="exam-hd-title">Ton examen</h1>
      <div class="exam-hd-sub">Ton compte à rebours et où tu en es.</div>
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
    <div class="exam-card-title">Où tu en es</div>
    ${renderPredict(data)}
  </div>

  <!-- 4. CHECKLIST -->
  <div class="exam-card">
    <div class="exam-card-title">Ta préparation</div>
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
    <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
      ${medallion("carte", "blue", { size: 36 })}
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-size:15px;font-weight:800">Ton centre d’examen</div>
      <div style="font-size:13px;color:var(--mu2);margin-top:2px">Difficulté, pièges du parcours, conseils sur place.</div>
    </div>
    ${icon("chevron-right", { size: 20, color: "var(--mu3)" })}
  </a>

</div>`;

  wire(root);
}
