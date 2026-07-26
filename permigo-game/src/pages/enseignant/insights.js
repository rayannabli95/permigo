// ═══════════════════════════════════════════════════════════════
// Enseignant — Stats refondues : 6 blocs, chacun répond à une
// question métier du moniteur indépendant.
// 1. À faire maintenant   4. Révisions de tes élèves (7 j)
// 2. Prêts pour l'examen  5. Ta réussite à l'examen (12 mois)
// 3. Silencieux (14 j)    6. Où en est ton portefeuille
// Règles : chaque bloc porte SA période dans son titre, jamais une
// barre sans son chiffre, jamais un ratio sans son dénominateur.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";
import { labelComp } from "@/utils/remc-label.js";
import { medallion } from "@/utils/medallions.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { haptic } from "@/utils/haptic.js";
import { fmtName } from "@/utils/fmt-name.js";

// ─── Constantes ───────────────────────────────────────────────
const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const ALL_COMPS = REMC.flatMap((c) => c.subs.map((s) => s.c));
const SILENCE_JOURS = 14; // seuil décrochage
const EXAM_FENETRE_J = 30; // examen "proche" = dans les 30 j
const PRET_SEUIL = 28; // en-dessous, un examen proche mérite une alerte

// ─── Module state (réinitialisé à chaque mount) ───────────────
let _showAllSilencieux = false;

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
  .st-page {
    padding: 0 16px calc(110px + env(safe-area-inset-bottom, 0px));
    max-width: 600px;
    margin: 0 auto;
    font-family: var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
  }
  .st-h1 {
    font: 700 24px/1.15 var(--ens-display, 'Fredoka', sans-serif);
    letter-spacing: -.01em;
    margin: 14px 2px 0;
  }

  /* ── Titre de section (porte sa période) ── */
  .st-sec {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 6px;
    margin: 22px 2px 10px;
  }
  .st-sec-lbl {
    font: 600 13px/1 var(--ens-display, 'Fredoka', sans-serif);
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .st-sec-per {
    font: 600 11px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--mu);
    white-space: nowrap;
  }

  /* ── Carte générique ── */
  .st-card {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--ens-r, 16px);
    padding: 14px;
    box-shadow: 0 8px 22px -16px color-mix(in srgb, var(--adk) 40%, transparent);
  }

  /* ── Bloc 1 : cartes-action ── */
  .st-act-list { display: flex; flex-direction: column; gap: 8px; }
  .st-act {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--ens-r, 16px);
    padding: 13px 14px;
    min-height: 52px;
    -webkit-tap-highlight-color: transparent;
    transition: transform .12s ease;
  }
  .st-act[role="button"] { cursor: pointer; }
  .st-act[role="button"]:active { transform: scale(.98); }
  .st-act[role="button"]:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
  .st-act-med { flex-shrink: 0; margin-top: 2px; }
  .st-act-body { flex: 1; min-width: 0; }
  .st-act-kick {
    font: 700 9.5px/1 var(--ens-body, 'Inter', sans-serif);
    letter-spacing: .09em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  /* Accent utilisé COMME texte → tokens -txt (contraste clair ET sombre) */
  .st-act-kick.amber  { color: var(--am-txt, #935e06); }
  .st-act-kick.red    { color: var(--rd-txt, #9b2c2c); }
  .st-act-kick.indigo { color: var(--a-txt, var(--a)); }
  .st-act-ttl {
    font: 700 13.5px/1.3 var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
  }
  .st-act-txt {
    font: 400 12px/1.5 var(--ens-body, 'Inter', sans-serif);
    color: var(--mu);
    margin-top: 2px;
  }
  .st-chev {
    flex-shrink: 0;
    align-self: center;
    color: var(--mu);
    opacity: .7;
  }

  /* ── Lignes élève (blocs 2, 3, 4) ── */
  .st-rows { display: flex; flex-direction: column; }
  .st-row {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 11px 2px;
    min-height: 52px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .st-row + .st-row { border-top: 1px solid var(--bo); }
  .st-row:active { opacity: .7; }
  .st-row:focus-visible { outline: 3px solid var(--a); outline-offset: -2px; border-radius: 10px; }
  .st-row-body { flex: 1; min-width: 0; }
  .st-row-nom {
    font: 700 13.5px/1.2 var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .st-row-meta {
    font: 500 11.5px/1.3 var(--ens-body, 'Inter', sans-serif);
    color: var(--mu);
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .st-row-val {
    flex-shrink: 0;
    font: 700 12.5px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
    white-space: nowrap;
  }
  .st-row-val small { font-weight: 600; color: var(--mu); font-size: 10.5px; }

  /* ── Bloc 2 : jauge X/31 ── */
  .st-gauge {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .st-gauge-track {
    flex: 1;
    height: 7px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--a) 13%, transparent);
    overflow: hidden;
  }
  .st-gauge-fill {
    display: block;
    height: 100%;
    border-radius: 6px;
    background: linear-gradient(90deg, var(--a-lt, #625ee8), var(--a));
  }
  .st-gauge-n {
    flex-shrink: 0;
    font: 800 12.5px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
  }
  .st-gauge-n small { font-weight: 600; color: var(--mu); }

  /* ── Bloc 3 : compteur silencieux ── */
  .st-sil-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 4px;
  }
  .st-sil-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--ens-stop, #dc2626);
    flex-shrink: 0;
  }
  .st-sil-n {
    font: 800 15px/1.2 var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
  }
  .st-more {
    display: block;
    width: 100%;
    margin-top: 10px;
    padding: 11px;
    min-height: 44px;
    border: 1.5px solid var(--bo);
    border-radius: 12px;
    background: transparent;
    font: 700 13px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--a-txt, var(--a));
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .st-more:active { opacity: .7; }

  /* ── Bloc 4 : graphe révisions ── */
  .st-rev-big {
    font: 700 34px/1 var(--ens-display, 'Fredoka', sans-serif);
    color: var(--ink);
  }
  .st-rev-big small {
    font: 600 15px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--mu);
  }
  .st-rev-sub {
    font: 600 12.5px/1.4 var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
    margin-top: 2px;
  }
  .st-rev-hint {
    font: 400 11px/1.4 var(--ens-body, 'Inter', sans-serif);
    color: var(--mu);
    margin-top: 2px;
  }
  .st-chart {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-top: 14px;
    padding-bottom: 2px;
  }
  .st-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .st-col-n {
    font: 700 11px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
  }
  .st-col-n.zero { color: var(--mu); opacity: .8; }
  .st-col-barzone {
    width: 100%;
    height: 74px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .st-col-bar {
    width: 22px;
    border-radius: 4px 4px 0 0;
    background: linear-gradient(180deg, var(--a-lt, #625ee8), var(--a));
  }
  .st-col-base {
    width: 22px;
    height: 2px;
    border-radius: 2px;
    background: var(--bo);
  }
  .st-col-day {
    font: 600 10px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--mu);
    padding-top: 5px;
    border-top: 1px solid var(--bo);
    width: 100%;
    text-align: center;
  }
  .st-col-day.auj { color: var(--a-txt, var(--a)); font-weight: 800; }
  .st-felic-lbl {
    font: 700 10.5px/1 var(--ens-body, 'Inter', sans-serif);
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--mu);
    margin: 16px 0 2px;
  }

  /* ── Bloc 5 : carte réussite (seul bloc accent) ── */
  .st-proof {
    position: relative;
    background: linear-gradient(150deg, var(--a), var(--a-lt, #625ee8) 130%);
    border-radius: 20px;
    padding: 18px 18px 16px;
    color: var(--a-ink, #fff);
    overflow: hidden;
    box-shadow: 0 14px 32px -14px color-mix(in srgb, var(--a) 55%, transparent);
  }
  .st-proof::after {
    content: "";
    position: absolute;
    right: -36px; top: -36px;
    width: 150px; height: 150px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.16), transparent 70%);
    pointer-events: none;
  }
  .st-proof-lbl {
    font: 700 10.5px/1 var(--ens-body, 'Inter', sans-serif);
    letter-spacing: .1em;
    text-transform: uppercase;
    opacity: .78;
    margin-bottom: 8px;
  }
  .st-proof-big {
    font: 700 52px/1 var(--ens-display, 'Fredoka', sans-serif);
  }
  .st-proof-big small { font-size: 26px; }
  .st-proof-sub {
    font: 600 12.5px/1.4 var(--ens-body, 'Inter', sans-serif);
    opacity: .92;
    margin-top: 6px;
  }
  .st-proof-chips { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .st-proof-chip {
    font: 700 11.5px/1 var(--ens-body, 'Inter', sans-serif);
    background: rgba(255,255,255,.16);
    border: 1px solid rgba(255,255,255,.22);
    padding: 8px 12px;
    border-radius: 999px;
    white-space: nowrap;
  }

  /* ── Bloc 6 : portefeuille ── */
  .st-pf-intro {
    font: 500 12px/1.4 var(--ens-body, 'Inter', sans-serif);
    color: var(--mu);
    margin-bottom: 12px;
  }
  .st-pf-intro b { color: var(--ink); }
  .st-pf-line { margin-top: 11px; }
  .st-pf-line:first-of-type { margin-top: 0; }
  .st-pf-lbl {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 5px;
  }
  .st-pf-name {
    font: 700 12px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
  }
  .st-pf-range {
    font: 500 10.5px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--mu);
  }
  .st-pf-barline { display: flex; align-items: center; gap: 8px; }
  .st-pf-track { flex: 1; height: 14px; border-radius: 7px; display: flex; align-items: center; }
  .st-pf-bar {
    height: 14px;
    border-radius: 7px;
    background: color-mix(in srgb, var(--a) 22%, var(--su));
    min-width: 3px;
  }
  .st-pf-bar.full { background: linear-gradient(90deg, var(--a-lt, #625ee8), var(--a)); }
  .st-pf-n {
    flex-shrink: 0;
    font: 800 12px/1 var(--ens-body, 'Inter', sans-serif);
    color: var(--ink);
  }
  .st-pf-n small { font-weight: 600; color: var(--mu); font-size: 10px; }

  /* ── États vides / pied de page ── */
  .st-empty {
    padding: 22px 16px;
    text-align: center;
    color: var(--mu);
    font: 500 12.5px/1.5 var(--ens-body, 'Inter', sans-serif);
  }
  .st-foot {
    margin-top: 26px;
    text-align: center;
    font: 500 11.5px/1.5 var(--ens-body, 'Inter', sans-serif);
    color: var(--mu);
  }

  /* ── Skeleton ── */
  .st-skel { padding: 20px 0 24px; display: flex; flex-direction: column; gap: 14px; }
  .st-skel-block {
    border-radius: 18px;
    background: linear-gradient(90deg, var(--bg2) 0%, var(--bg3) 50%, var(--bg2) 100%);
    background-size: 200% 100%;
    animation: st-shimmer 1.4s ease-in-out infinite;
  }
  @keyframes st-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .st-skel-block { animation: none !important; }
  }
</style>`;

// ─── Helpers dates ────────────────────────────────────────────
function daysAgoISO(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}
// date_examen est un DATE ("YYYY-MM-DD") : parse en local, pas en UTC
function parseDateOnly(s) {
  if (!s) return null;
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function localMidnight(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

// ─── Entry ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  _showAllSilencieux = false;

  track("page.view", { page: "insights", role: me.role });

  root.innerHTML = `
    ${STYLE}
    <div class="st-page">
      <div class="st-skel">
        <div class="st-skel-block" style="height:34px;width:40%"></div>
        <div class="st-skel-block" style="height:150px"></div>
        <div class="st-skel-block" style="height:170px"></div>
        <div class="st-skel-block" style="height:120px"></div>
        <div class="st-skel-block" style="height:200px"></div>
      </div>
    </div>
  `;

  let data;
  try {
    data = await loadData(me);
  } catch (e) {
    console.error("[insights] loadData", e);
    toast("Impossible de charger les stats", "error");
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:64px 24px;text-align:center;color:var(--mu)">
        <p style="margin:0;font:600 15px/1.4 var(--ens-body,'Inter',sans-serif)">Impossible de charger les stats.</p>
        <button id="st-retry" type="button" style="border:0;border-radius:999px;padding:12px 22px;min-height:44px;background:var(--a);color:#fff;font:700 14px/1 var(--ens-body,'Inter',sans-serif);cursor:pointer">Réessayer</button>
      </div>`;
    root
      .querySelector("#st-retry")
      ?.addEventListener("click", () => mount(root));
    return;
  }

  renderAll(root, data);
  if (data.vide) return; // le chemin vide câble déjà son bouton
  wireAll(root, data);
}

// ─── Data loading ─────────────────────────────────────────────
// PostgREST tronque à 1000 lignes EN SILENCE : on pagine (validations
// dépasse 1000 dès ~33 élèves à livret rempli, quiz_attempts bien avant).
async function fetchAllRows(buildQuery) {
  const PAGE = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await buildQuery().range(from, from + PAGE - 1);
    if (error) return { rows, error };
    rows.push(...(data || []));
    if (!data || data.length < PAGE) return { rows, error: null };
    from += PAGE;
  }
}

async function loadData(me) {
  const { data: elevesRaw, error: e1 } = await sb
    .from("profiles")
    .select("id, prenom, nom, last_active_at, avatar_url")
    .eq("enseignant_id", me.id)
    .eq("role", "eleve");
  if (e1) throw e1;

  const eleves = elevesRaw || [];
  const eleveIds = eleves.map((e) => e.id);

  if (eleveIds.length === 0) {
    return { vide: true };
  }

  const [valsRes, examsRes, quizRes] = await Promise.all([
    // Une ligne par (élève, compétence) — statut courant (table en upsert)
    fetchAllRows(() =>
      sb
        .from("validations")
        .select("eleve_id, competence_id, statut, validated_at")
        .in("eleve_id", eleveIds)
        .order("id"),
    ),
    // Historique conservé : 1ère ligne vue (tri desc) = examen le plus récent
    sb
      .from("examens")
      .select("eleve_id, statut, date_examen, created_at")
      .order("created_at", { ascending: false }),
    fetchAllRows(() =>
      sb
        .from("quiz_attempts")
        .select("user_id, completed_at")
        .in("user_id", eleveIds)
        .gte("completed_at", daysAgoISO(30))
        .order("id"),
    ),
  ]);
  if (valsRes.error) throw valsRes.error;
  if (examsRes.error) throw examsRes.error;
  // Quiz en échec ≠ page morte : on dégrade le bloc 4 explicitement
  const quizKo = !!quizRes.error;
  if (quizKo) console.error("[insights] quiz_attempts", quizRes.error);

  const idSet = new Set(eleveIds);
  const vals = valsRes.rows;
  const exams = (examsRes.data || []).filter((x) => idSet.has(x.eleve_id));
  const quiz = quizRes.rows;

  // ── Dernier examen par élève (1ère ligne vue, tri desc) = la vérité ──
  // La table est en historique pur (replanifier = nouvelle ligne) : seules
  // les dernières lignes comptent, pour « reçu » COMME pour « planifié ».
  const lastExamByEleve = new Map();
  exams.forEach((x) => {
    if (!lastExamByEleve.has(x.eleve_id)) lastExamByEleve.set(x.eleve_id, x);
  });
  const recuSet = new Set(
    [...lastExamByEleve.values()]
      .filter((x) => x.statut === "recu")
      .map((x) => x.eleve_id),
  );
  const actifs = eleves.filter((e) => !recuSet.has(e.id));
  const nbActifs = actifs.length;
  const actifSet = new Set(actifs.map((e) => e.id));

  // ── Acquis par élève (statut courant par couple) ──
  const acquisByEleve = new Map(); // id → Set(competence_id)
  const lastValByEleve = new Map(); // id → timestamp (tout statut)
  vals.forEach((v) => {
    if (v.statut === "acquis") {
      if (!acquisByEleve.has(v.eleve_id))
        acquisByEleve.set(v.eleve_id, new Set());
      acquisByEleve.get(v.eleve_id).add(v.competence_id);
    }
    const t = new Date(v.validated_at).getTime();
    if (!lastValByEleve.has(v.eleve_id) || t > lastValByEleve.get(v.eleve_id)) {
      lastValByEleve.set(v.eleve_id, t);
    }
  });
  const nbAcquis = (id) => acquisByEleve.get(id)?.size || 0;

  // ── Quiz : dernière activité + fenêtre 7 jours calendaires ──
  const lastQuizByEleve = new Map();
  quiz.forEach((q) => {
    const t = new Date(q.completed_at).getTime();
    if (!lastQuizByEleve.has(q.user_id) || t > lastQuizByEleve.get(q.user_id)) {
      lastQuizByEleve.set(q.user_id, t);
    }
  });

  const dayStarts = []; // 7 jours calendaires, du plus ancien à aujourd'hui
  for (let i = 6; i >= 0; i--) dayStarts.push(localMidnight(-i));
  const revDays = dayStarts.map((start, i) => {
    const end = i < 6 ? dayStarts[i + 1] : new Date(Date.now() + 86400000);
    return {
      label: JOURS_COURT[(start.getDay() + 6) % 7],
      isToday: i === 6,
      users: new Set(),
      start: start.getTime(),
      end: end.getTime(),
    };
  });
  const attempts7ByEleve = new Map();
  const distinct7 = new Set();
  quiz.forEach((q) => {
    // Les élèves « sortis » (reçus) ne comptent pas : le dénominateur
    // affiché est nbActifs, le numérateur doit vivre dans le même monde.
    if (!actifSet.has(q.user_id)) return;
    const t = new Date(q.completed_at).getTime();
    if (t < revDays[0].start) return;
    for (const d of revDays) {
      if (t >= d.start && t < d.end) {
        d.users.add(q.user_id);
        break;
      }
    }
    distinct7.add(q.user_id);
    attempts7ByEleve.set(q.user_id, (attempts7ByEleve.get(q.user_id) || 0) + 1);
  });
  const eleveById = new Map(eleves.map((e) => [e.id, e]));
  const topReviseurs = [...attempts7ByEleve.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, n]) => ({ ...(eleveById.get(id) || {}), nQuiz: n }))
    .filter((e) => e.id);

  // ── Silencieux : aucun des 3 signaux depuis 14 j ──
  const ago14 = Date.now() - SILENCE_JOURS * 86400000;
  const silencieux = actifs
    .map((e) => {
      const signaux = [
        e.last_active_at ? new Date(e.last_active_at).getTime() : null,
        lastValByEleve.get(e.id) ?? null,
        lastQuizByEleve.get(e.id) ?? null,
      ].filter((t) => t != null);
      const lastSeen = signaux.length ? Math.max(...signaux) : null;
      return { ...e, lastSeen };
    })
    .filter((e) => e.lastSeen == null || e.lastSeen < ago14)
    .map((e) => ({
      ...e,
      daysAgo: e.lastSeen
        ? Math.floor((Date.now() - e.lastSeen) / 86400000)
        : null,
    }))
    // Les plus anciennement vus d'abord (jamais vus tout en haut)
    .sort((a, b) => (a.lastSeen ?? 0) - (b.lastSeen ?? 0));

  // ── Prêts pour l'examen : top 3 des plus proches du livret complet ──
  const prets = actifs
    .map((e) => ({ ...e, acquis: nbAcquis(e.id) }))
    .filter((e) => e.acquis >= 1)
    .sort((a, b) => b.acquis - a.acquis)
    .slice(0, 3)
    .map((e) => {
      const set = acquisByEleve.get(e.id) || new Set();
      const manque = ALL_COMPS.filter((c) => !set.has(c))
        .slice(0, 3)
        .map((c) => labelComp(c));
      return { ...e, manque };
    });

  // ── Examens : proche (bloc 1), taux 12 mois + à venir (bloc 5) ──
  // Uniquement le DERNIER examen de chaque élève : une vieille ligne
  // « planifie » remplacée par une replanification (ou suivie d'un
  // résultat) ne doit plus exister aux yeux de la page.
  const today0 = localMidnight(0).getTime();
  const planifies = [...lastExamByEleve.values()]
    .filter((x) => x.statut === "planifie" && parseDateOnly(x.date_examen))
    .map((x) => ({ ...x, ts: parseDateOnly(x.date_examen).getTime() }))
    .filter((x) => x.ts >= today0 && actifSet.has(x.eleve_id))
    .sort((a, b) => a.ts - b.ts);
  const nbExamsAVenir = planifies.length; // 1 ligne max par élève

  // Borne sur un minuit local (pas today0 + 30×24h : l'heure d'été/hiver
  // décale la fenêtre d'une heure et exclut le 30e jour).
  const finFenetre = localMidnight(EXAM_FENETRE_J + 1).getTime();
  const examProche = planifies.find(
    (x) =>
      x.ts < finFenetre &&
      nbAcquis(x.eleve_id) < PRET_SEUIL &&
      eleveById.has(x.eleve_id),
  );
  let carteExam = null;
  if (examProche) {
    const e = eleveById.get(examProche.eleve_id);
    const dJours = Math.round((examProche.ts - today0) / 86400000);
    const quand =
      dJours === 0
        ? "aujourd'hui"
        : dJours === 1
          ? "demain"
          : `dans ${dJours} jours`;
    carteExam = { eleve: e, quand, acquis: nbAcquis(e.id) };
  }

  // Un « reçu » se compte par ÉLÈVE (une double saisie ne gonfle pas le
  // taux) ; les « raté » se comptent par ligne (plusieurs échecs possibles).
  const ago12mois = Date.now() - 365 * 86400000;
  const recusEleves12m = new Set();
  let nbRates12m = 0;
  const anneeCourante = new Date().getFullYear();
  const permisAnneeSet = new Set();
  exams.forEach((x) => {
    if (x.statut !== "recu" && x.statut !== "rate") return;
    const ref = parseDateOnly(x.date_examen) ?? new Date(x.created_at);
    if (x.statut === "recu" && ref.getFullYear() === anneeCourante) {
      permisAnneeSet.add(x.eleve_id);
    }
    if (ref.getTime() < ago12mois) return;
    if (x.statut === "recu") recusEleves12m.add(x.eleve_id);
    else nbRates12m++;
  });
  const nbRecus12m = recusEleves12m.size;
  const nbResultats12m = nbRecus12m + nbRates12m;
  const permisAnnee = permisAnneeSet.size;

  // ── Point pédago : compétences « à retravailler » (60 j) ──
  const ago60 = Date.now() - 60 * 86400000;
  const diffByComp = new Map();
  vals.forEach((v) => {
    if (v.statut !== "a_retravailler") return;
    if (!actifSet.has(v.eleve_id)) return;
    if (new Date(v.validated_at).getTime() < ago60) return;
    if (!diffByComp.has(v.competence_id))
      diffByComp.set(v.competence_id, new Set());
    diffByComp.get(v.competence_id).add(v.eleve_id);
  });
  const topDiff =
    [...diffByComp.entries()]
      .map(([compId, set]) => ({ compId, count: set.size }))
      .sort((a, b) => b.count - a.count)[0] || null;

  // ── Portefeuille : 4 tranches d'avancement ──
  const tranches = [
    { nom: "Démarrage", range: "0–25 %", count: 0 },
    { nom: "En construction", range: "25–50 %", count: 0 },
    { nom: "Bien avancés", range: "50–75 %", count: 0 },
    { nom: "Bientôt sortis", range: "75 % +", count: 0, full: true },
  ];
  actifs.forEach((e) => {
    const pct = (nbAcquis(e.id) / REMC_TOTAL) * 100;
    const idx = pct >= 75 ? 3 : pct >= 50 ? 2 : pct >= 25 ? 1 : 0;
    tranches[idx].count++;
  });

  // ── Pied de page : hygiène de saisie ──
  const ago7 = Date.now() - 7 * 86400000;
  const saisies7j = vals.filter(
    (v) => new Date(v.validated_at).getTime() >= ago7,
  ).length;

  return {
    vide: false,
    nbActifs,
    carteExam,
    silencieux,
    topDiff,
    prets,
    revDays: revDays.map((d) => ({
      label: d.label,
      isToday: d.isToday,
      n: d.users.size,
    })),
    nbReviseurs7j: distinct7.size,
    topReviseurs,
    quizKo,
    nbRecus12m,
    nbResultats12m,
    permisAnnee,
    nbExamsAVenir,
    tranches,
    saisies7j,
  };
}

// ─── Render ───────────────────────────────────────────────────
function nomCourt(e) {
  return esc(fmtName(`${e.prenom || ""} ${e.nom || ""}`.trim()) || "Élève");
}
// Pour les ATTRIBUTS (aria-label…) : esc() n'encode pas les guillemets
function nomAttr(e) {
  return escAttr(fmtName(`${e.prenom || ""} ${e.nom || ""}`.trim()) || "Élève");
}
function secTitle(lbl, per) {
  return `<div class="st-sec">
    <span class="st-sec-lbl">${lbl}</span>
    <span class="st-sec-per">· ${per}</span>
  </div>`;
}
const CHEV = `<span class="st-chev" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></span>`;

function renderAll(root, data) {
  if (data.vide) {
    root.innerHTML = `
      ${STYLE}
      <div class="st-page anim-slide-up">
        <h1 class="st-h1">Stats</h1>
        <div class="st-card" style="margin-top:16px">
          <div class="st-empty">
            Ajoute tes élèves pour voir tes stats : qui est proche de l'examen,
            qui décroche, qui révise entre les leçons.
          </div>
          <button class="st-more" data-route="#/eleves" type="button">Voir mes élèves</button>
        </div>
      </div>`;
    wireRoutes(root);
    return;
  }

  root.innerHTML = `
    ${STYLE}
    <div class="st-page anim-slide-up">
      <h1 class="st-h1">Stats</h1>

      <div class="st-actions">
      ${secTitle("À faire maintenant", "aujourd'hui")}
      ${renderActions(data)}

      ${secTitle("Les plus proches de l'examen", "à ce jour")}
      ${renderPrets(data)}

      ${secTitle(`Silencieux depuis ${SILENCE_JOURS} jours`, "app, quiz, leçons")}
      ${renderSilencieux(data)}
      </div><!-- /.st-actions -->

      <div class="st-progress">
      ${secTitle("Révisions de tes élèves", "7 derniers jours")}
      ${renderRevisions(data)}

      ${secTitle("Ta réussite à l'examen", "12 derniers mois")}
      ${renderReussite(data)}

      ${secTitle("Où en est ton portefeuille", "à ce jour")}
      ${renderPortefeuille(data)}
      </div><!-- /.st-progress -->

      <p class="st-foot">${
        data.saisies7j > 0
          ? `Tu as mis à jour ${data.saisies7j} compétence${data.saisies7j > 1 ? "s" : ""} chez tes élèves ces 7 derniers jours.`
          : "Aucune validation saisie depuis 7 jours — pense à saisir tes séances pour garder une photo fidèle."
      }</p>
    </div>
  `;
}

// ── Bloc 1 : cartes-action ──
function renderActions({ carteExam, silencieux, topDiff }) {
  const cards = [];

  if (carteExam) {
    const nm = nomCourt(carteExam.eleve);
    cards.push(`
      <div class="st-act" role="button" tabindex="0" data-route="#/livret/${esc(carteExam.eleve.id)}"
           aria-label="Livret de ${nomAttr(carteExam.eleve)}">
        <span class="st-act-med">${medallion("examen", "indigo", { size: 38 })}</span>
        <div class="st-act-body">
          <div class="st-act-kick amber">Examen proche</div>
          <div class="st-act-ttl">${nm} passe ${esc(carteExam.quand)}</div>
          <div class="st-act-txt">${carteExam.acquis}/${REMC_TOTAL} acquis — prépare son passage.</div>
        </div>
        ${CHEV}
      </div>`);
  }

  if (silencieux.length > 0) {
    const e = silencieux[0];
    const nm = nomCourt(e);
    const depuis =
      e.daysAgo != null
        ? `Silencieux depuis ${e.daysAgo} jours`
        : "Jamais vu sur l'app";
    const autres =
      silencieux.length > 1
        ? ` · et ${silencieux.length - 1} autre${silencieux.length > 2 ? "s" : ""}`
        : "";
    cards.push(`
      <div class="st-act" role="button" tabindex="0" data-route="#/livret/${esc(e.id)}"
           aria-label="Livret de ${nomAttr(e)}">
        <span class="st-act-med">${medallion("panneau", "red", { size: 38 })}</span>
        <div class="st-act-body">
          <div class="st-act-kick red">Relance</div>
          <div class="st-act-ttl">Relance ${nm}</div>
          <div class="st-act-txt">${esc(depuis)}${esc(autres)}.</div>
        </div>
        ${CHEV}
      </div>`);
  }

  if (topDiff) {
    const lbl = esc(labelComp(topDiff.compId));
    cards.push(`
      <div class="st-act" role="button" tabindex="0"
           data-route="#/eleves?bloque_sur=${encodeURIComponent(topDiff.compId)}"
           aria-label="Élèves bloqués sur ${escAttr(labelComp(topDiff.compId))}">
        <span class="st-act-med">${medallion("ampoule", "indigo", { size: 38 })}</span>
        <div class="st-act-body">
          <div class="st-act-kick indigo">Point pédago</div>
          <div class="st-act-ttl">${lbl}</div>
          <div class="st-act-txt">${topDiff.count} élève${topDiff.count > 1 ? "s" : ""} noté${topDiff.count > 1 ? "s" : ""} « à revoir » dessus ces 60 derniers jours — prévois un temps dédié en leçon.</div>
        </div>
        ${CHEV}
      </div>`);
  }

  if (cards.length === 0) {
    cards.push(`
      <div class="st-act">
        <span class="st-act-med">${medallion("trophee", "gold", { size: 38 })}</span>
        <div class="st-act-body">
          <div class="st-act-kick indigo">Rien d'urgent</div>
          <div class="st-act-ttl">Tout roule</div>
          <div class="st-act-txt">Pas d'examen imminent, personne en silence, aucun blocage répété.</div>
        </div>
      </div>`);
  }

  return `<div class="st-act-list">${cards.slice(0, 3).join("")}</div>`;
}

// ── Bloc 2 : prêts pour l'examen ──
function renderPrets({ prets }) {
  if (prets.length === 0) {
    return `<div class="st-card"><div class="st-empty">
      Aucune compétence validée pour l'instant — les jauges de tes élèves apparaîtront ici.
    </div></div>`;
  }
  const rows = prets
    .map((e) => {
      const nm = nomCourt(e);
      const pct = Math.round((e.acquis / REMC_TOTAL) * 100);
      const nbManque = REMC_TOTAL - e.acquis;
      const manque = e.manque.length
        ? `manque : ${esc(e.manque.join(", "))}${nbManque > 3 ? ` + ${nbManque - 3} autres` : ""}`
        : "livret complet";
      return `
      <div class="st-row" role="button" tabindex="0" data-eleve-id="${escAttr(e.id)}"
           aria-label="Livret de ${nomAttr(e)} — ${e.acquis} compétence${e.acquis > 1 ? "s" : ""} acquise${e.acquis > 1 ? "s" : ""} sur ${REMC_TOTAL}">
        <div style="flex-shrink:0">${renderUserAvatar(e, 36)}</div>
        <div class="st-row-body">
          <div class="st-row-nom">${nm}</div>
          <div class="st-gauge">
            <span class="st-gauge-track"><span class="st-gauge-fill" style="width:${pct}%"></span></span>
            <span class="st-gauge-n">${e.acquis}<small>/${REMC_TOTAL}</small></span>
          </div>
          <div class="st-row-meta">${manque}</div>
        </div>
        ${CHEV}
      </div>`;
    })
    .join("");
  return `<div class="st-card"><div class="st-rows">${rows}</div></div>`;
}

// ── Bloc 3 : silencieux ──
function renderSilencieux({ silencieux }) {
  const n = silencieux.length;
  if (n === 0) {
    return `<div class="st-card" id="st-sil-card"><div class="st-empty">
      Personne en silence — tous tes élèves ont donné signe de vie ces ${SILENCE_JOURS} derniers jours.
    </div></div>`;
  }
  const visibles = _showAllSilencieux ? silencieux : silencieux.slice(0, 3);
  const rows = visibles
    .map((e) => {
      const nm = nomCourt(e);
      const depuis =
        e.daysAgo != null ? `depuis ${e.daysAgo} j` : "jamais vu sur l'app";
      return `
      <div class="st-row" role="button" tabindex="0" data-eleve-id="${escAttr(e.id)}"
           aria-label="Livret de ${nomAttr(e)} — silencieux ${escAttr(depuis)}">
        <div style="flex-shrink:0">${renderUserAvatar(e, 36)}</div>
        <div class="st-row-body"><div class="st-row-nom">${nm}</div></div>
        <span class="st-row-val">${esc(depuis)}</span>
        ${CHEV}
      </div>`;
    })
    .join("");
  const moreBtn =
    n > 3 && !_showAllSilencieux
      ? `<button class="st-more" id="st-more-sil" type="button">Voir les ${n}</button>`
      : "";
  return `<div class="st-card" id="st-sil-card">
    <div class="st-sil-head">
      <span class="st-sil-dot" aria-hidden="true"></span>
      <span class="st-sil-n">${n} élève${n > 1 ? "s" : ""} silencieux</span>
    </div>
    <div class="st-rows">${rows}</div>
    ${moreBtn}
  </div>`;
}

// ── Bloc 4 : révisions élèves ──
function renderRevisions({
  revDays,
  nbReviseurs7j,
  nbActifs,
  topReviseurs,
  quizKo,
}) {
  if (quizKo) {
    return `<div class="st-card"><div class="st-empty">
      Données de révision indisponibles pour le moment — réessaie un peu plus tard.
    </div></div>`;
  }
  if (nbReviseurs7j === 0) {
    return `<div class="st-card"><div class="st-empty">
      Aucun élève n'a révisé ces 7 derniers jours. Un mot en leçon (« t'as vu ta fiche ? ») relance souvent la machine.
    </div></div>`;
  }
  const maxN = Math.max(...revDays.map((d) => d.n), 1);
  const cols = revDays
    .map((d) => {
      const h = d.n > 0 ? Math.max(14, Math.round((d.n / maxN) * 100)) : 0;
      return `
      <div class="st-col">
        <span class="st-col-n${d.n === 0 ? " zero" : ""}">${d.n}</span>
        <div class="st-col-barzone">
          ${d.n > 0 ? `<div class="st-col-bar" style="height:${h}%"></div>` : `<div class="st-col-base"></div>`}
        </div>
        <span class="st-col-day${d.isToday ? " auj" : ""}">${d.isToday ? "auj." : esc(d.label)}</span>
      </div>`;
    })
    .join("");

  const felic = topReviseurs
    .map((e) => {
      const nm = nomCourt(e);
      return `
      <div class="st-row" role="button" tabindex="0" data-eleve-id="${escAttr(e.id)}"
           aria-label="Livret de ${nomAttr(e)} — ${e.nQuiz} quiz ces 7 derniers jours">
        <div style="flex-shrink:0">${renderUserAvatar(e, 36)}</div>
        <div class="st-row-body"><div class="st-row-nom">${nm}</div></div>
        <span class="st-row-val">${e.nQuiz} <small>quiz</small></span>
        ${CHEV}
      </div>`;
    })
    .join("");

  return `<div class="st-card">
    <div class="st-rev-big">${nbReviseurs7j} <small>sur ${nbActifs}</small></div>
    <div class="st-rev-sub">élève${nbReviseurs7j > 1 ? "s ont" : " a"} révisé ces 7 derniers jours</div>
    <div class="st-rev-hint">Chaque barre compte les élèves différents qui ont révisé ce jour-là.</div>
    <div class="st-chart" role="img"
         aria-label="Élèves ayant révisé par jour sur 7 jours : ${revDays.map((d) => `${d.isToday ? "aujourd'hui" : d.label} ${d.n}`).join(", ")}">
      ${cols}
    </div>
    ${felic ? `<div class="st-felic-lbl">À féliciter</div><div class="st-rows">${felic}</div>` : ""}
  </div>`;
}

// ── Bloc 5 : réussite examen ──
function renderReussite({
  nbRecus12m,
  nbResultats12m,
  permisAnnee,
  nbExamsAVenir,
}) {
  if (nbResultats12m < 3) {
    return `
      <div class="st-act" role="button" tabindex="0" data-route="#/eleves"
           aria-label="Voir mes élèves">
        <span class="st-act-med">${medallion("medaille", "gold", { size: 38 })}</span>
        <div class="st-act-body">
          <div class="st-act-ttl">Construis ton taux de réussite</div>
          <div class="st-act-txt">Saisis les résultats d'examen de tes élèves (reçu ou raté) depuis leur fiche : ton taux s'affichera ici, à ton nom.${
            nbResultats12m > 0
              ? ` Déjà ${nbResultats12m} résultat${nbResultats12m > 1 ? "s" : ""} saisi${nbResultats12m > 1 ? "s" : ""}.`
              : ""
          }</div>
        </div>
        ${CHEV}
      </div>`;
  }
  const taux = Math.round((nbRecus12m / nbResultats12m) * 100);
  const annee = new Date().getFullYear();
  const chips = [];
  if (permisAnnee > 0) chips.push(`${permisAnnee} permis en ${annee}`);
  if (nbExamsAVenir > 0)
    chips.push(
      `${nbExamsAVenir} examen${nbExamsAVenir > 1 ? "s" : ""} à venir`,
    );
  return `<div class="st-proof">
    <div class="st-proof-lbl">Taux de réussite</div>
    <div class="st-proof-big">${taux}<small> %</small></div>
    <div class="st-proof-sub">${nbRecus12m} reçu${nbRecus12m > 1 ? "s" : ""} sur ${nbResultats12m} · 12 derniers mois</div>
    ${chips.length ? `<div class="st-proof-chips">${chips.map((c) => `<span class="st-proof-chip">${esc(c)}</span>`).join("")}</div>` : ""}
  </div>`;
}

// ── Bloc 6 : portefeuille ──
function renderPortefeuille({ tranches, nbActifs }) {
  const maxCount = Math.max(...tranches.map((t) => t.count), 1);
  const lines = tranches
    .map((t) => {
      const w =
        t.count > 0 ? Math.max(6, Math.round((t.count / maxCount) * 100)) : 0;
      return `
      <div class="st-pf-line">
        <div class="st-pf-lbl">
          <span class="st-pf-name">${esc(t.nom)}</span>
          <span class="st-pf-range">${esc(t.range)} du livret</span>
        </div>
        <div class="st-pf-barline">
          <span class="st-pf-track">${t.count > 0 ? `<span class="st-pf-bar${t.full ? " full" : ""}" style="width:${w}%"></span>` : ""}</span>
          <span class="st-pf-n">${t.count} <small>élève${t.count > 1 ? "s" : ""}</small></span>
        </div>
      </div>`;
    })
    .join("");
  return `<div class="st-card">
    <div class="st-pf-intro">Répartition de tes <b>${nbActifs} élève${nbActifs > 1 ? "s" : ""}</b> selon l'avancement du livret (${REMC_TOTAL} compétences).</div>
    ${lines}
  </div>`;
}

// ─── Wire ─────────────────────────────────────────────────────
function wireAll(root, data) {
  wireRoutes(root);
  wireEleveRows(root);
  wireSilMore(root, data);
}

function wireSilMore(root, data) {
  root.querySelector("#st-more-sil")?.addEventListener("click", () => {
    haptic("select");
    _showAllSilencieux = true;
    track("insights.silencieux.expand", { count: data.silencieux.length });
    const card = root.querySelector("#st-sil-card");
    if (!card) return;
    card.outerHTML = renderSilencieux(data);
    const fresh = root.querySelector("#st-sil-card");
    if (fresh) wireEleveRows(fresh);
  });
}

function activate(el, handler) {
  el.addEventListener("click", handler);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  });
}

function wireRoutes(root) {
  root.querySelectorAll("[data-route]").forEach((el) => {
    activate(el, () => {
      haptic("impact");
      track("insights.action.click", { route: el.dataset.route });
      navigate(el.dataset.route);
    });
  });
}

function wireEleveRows(container) {
  container.querySelectorAll(".st-row[data-eleve-id]").forEach((row) => {
    activate(row, () => {
      haptic("impact");
      track("insights.eleve.open", { eleve_id: row.dataset.eleveId });
      navigate(`#/livret/${row.dataset.eleveId}`);
    });
  });
}
