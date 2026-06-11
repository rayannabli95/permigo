// ═══════════════════════════════════════════════════════════════
// Enseignant — Aujourd'hui
// KPI du jour + activité récente + mes élèves actifs
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC_TOTAL } from "@/data/remc.js";
import { labelComp } from "@/utils/remc-label.js";
import { statutCfg } from "@/utils/statut-label.js";
import { icon, iconBadge } from "@/utils/icons.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { openInviteEleveModal } from "@/services/invite-eleve.js";
import { getMoniteurState } from "@/data/moniteur-levels.js";
import { getLeague } from "@/utils/league-shared.js";
import { startTour } from "@/components/common/guided-tour.js";

// Tour guidé enseignant — affiché 1× à la première connexion
const TOUR_KEY = "pg-tour-moniteur-v1";
const MONITEUR_TOUR_STEPS = [
  {
    title: "Bienvenue sur PermiGo 👋",
    text: "30 secondes pour prendre l'app en main. Tu peux passer à tout moment.",
  },
  {
    sel: "#aj-act-invite",
    title: "Invite tes élèves",
    text: "Tout commence ici : ajoute un élève, il reçoit un lien pour créer son compte et te sera rattaché automatiquement.",
  },
  {
    sel: "#bn-seance-fab",
    title: "Enregistre une séance",
    text: "Après chaque leçon, coche les compétences travaillées. C'est ce qui fait avancer le livret REMC de l'élève.",
  },
  {
    sel: '.bn-tab[data-id="eleves"]',
    title: "Tes élèves",
    text: "Retrouve chaque élève, sa progression et sa fiche détaillée. Les élèves à relancer remontent en haut.",
  },
  {
    sel: '.bn-tab[data-id="insights"]',
    title: "Tes stats",
    text: "Suis l'engagement de tes élèves et leur progression moyenne, mois après mois.",
  },
];

function maybeStartMoniteurTour() {
  try {
    if (localStorage.getItem(TOUR_KEY)) return;
  } catch {
    return;
  }
  // Laisse le DOM (FAB, nav) se poser avant de mesurer les ancres
  setTimeout(() => {
    if (!document.querySelector("#aj-act-invite")) return;
    track("moniteur.tour.start");
    startTour(MONITEUR_TOUR_STEPS, {
      onDone: () => {
        try {
          localStorage.setItem(TOUR_KEY, "1");
        } catch {
          /* stockage indispo — le tour pourra réapparaître, sans gravité */
        }
        track("moniteur.tour.done");
      },
    });
  }, 450);
}

// ─── Statuts labels : mapping centralisé @/utils/statut-label.js ──

// ─── CSS ──────────────────────────────────────────────────────────
const STYLE = `<style>
  .aj-page {
    padding: 24px 16px calc(100px + env(safe-area-inset-bottom, 0px));
    max-width: 600px;
    margin: 0 auto;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--ink);
  }

  /* Header */
  .aj-hd { margin-bottom: 22px; }
  .aj-h1 {
    font: 800 28px/1.1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -0.03em;
  }
  .aj-date {
    font: 500 13px/1 'Inter', sans-serif;
    color: var(--mu2);
    margin: 0;
    text-transform: capitalize;
  }
  .aj-xp-strip { display: flex; align-items: center; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
  .aj-xp-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 99px;
    background: var(--ap); border: 1px solid color-mix(in srgb, var(--a) 22%, transparent);
    font: 700 12px/1 'Inter', sans-serif; color: var(--adk);
  }
  .aj-streak-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 99px;
    background: var(--amp); border: 1px solid color-mix(in srgb, var(--am) 25%, transparent);
    font: 700 12px/1 'Inter', sans-serif; color: var(--amk);
  }

  @keyframes ajIn {
    from { opacity: 0; transform: translateY(12px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Hero « prochaine action » — la pièce maîtresse, mise en avant ── */
  .aj-hero {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 18px;
    padding: 20px;
    margin-bottom: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: var(--s2);
    animation: ajIn .5s cubic-bezier(.4,0,.2,1) both;
    transition: border-color .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
    cursor: pointer;
  }
  .aj-hero:hover { border-color: var(--bo4); box-shadow: var(--s3); }
  .aj-hero-top { display: flex; align-items: flex-start; gap: 14px; }
  .aj-hero-ico {
    width: 46px; height: 46px;
    border-radius: 13px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .aj-hero.tone-warn    .aj-hero-ico { background: var(--amp); color: var(--amk); }
  .aj-hero.tone-ok      .aj-hero-ico { background: var(--grp); color: var(--grd); }
  .aj-hero.tone-neutral .aj-hero-ico { background: var(--ap); color: var(--adk); }
  .aj-hero-body { flex: 1; min-width: 0; }
  .aj-hero-kicker {
    font: 700 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--mu2);
    margin-bottom: 6px;
  }
  .aj-hero-title {
    font: 800 17px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -.02em;
    margin: 0 0 4px;
  }
  .aj-hero-sub {
    font: 500 13px/1.45 'Inter', sans-serif;
    color: var(--mu);
    margin: 0;
  }
  .aj-hero-cta {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 13px;
    background: var(--a);
    color: #fff;
    font: 800 14px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform .12s cubic-bezier(.4,0,.2,1), box-shadow .12s;
    min-height: 50px;
    box-shadow: 0 4px 0 0 var(--adk);
  }
  .aj-hero-cta:active { transform: translateY(3px); box-shadow: 0 1px 0 0 var(--adk); }
  .aj-hero-cta:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }

  /* ── Stats compactes ── */
  .aj-quickstats { display: flex; gap: 10px; margin-bottom: 14px; }
  .aj-quickstat {
    flex: 1;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 14px;
    padding: 14px 14px;
    box-shadow: var(--s0);
    min-width: 0;
  }
  .aj-quickstat-val {
    font: 800 22px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -.025em;
    white-space: nowrap;
  }
  .aj-quickstat-val small {
    font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--mu2);
  }
  .aj-quickstat-lbl {
    font: 500 11px/1.3 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 5px;
  }
  .aj-quickstat-bar {
    height: 4px; background: var(--bg2);
    border-radius: 99px; margin-top: 8px; overflow: hidden;
  }
  .aj-quickstat-bar > div {
    height: 100%; border-radius: 99px; background: var(--a);
    transition: width .5s cubic-bezier(.2,.7,.3,1);
  }

  /* ── Actions rapides ── */
  .aj-actions { display: flex; gap: 10px; margin-bottom: 26px; }
  .aj-action {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    padding: 13px 8px;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 14px;
    box-shadow: var(--s0);
    cursor: pointer;
    color: var(--ink);
    font: 600 11.5px/1.2 'Inter', sans-serif;
    text-align: center;
    -webkit-tap-highlight-color: transparent;
    transition: border-color .15s, transform .15s;
    min-height: 44px;
  }
  .aj-action:hover { border-color: var(--bo4); transform: translateY(-1px); }
  .aj-action:active { transform: scale(.97); }
  .aj-action:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
  .aj-action-ico {
    width: 34px; height: 34px; border-radius: 11px;
    background: var(--ap); color: var(--adk);
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Cartes ligues ── */
  .aj-ligues { display: flex; gap: 10px; }
  .aj-ligue {
    flex: 1; min-width: 0;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 14px;
    padding: 14px;
    box-shadow: var(--s0);
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: border-color .15s, transform .15s;
    display: flex; flex-direction: column; gap: 6px;
  }
  a.aj-ligue, a.aj-ligue:visited, a.aj-ligue:hover, a.aj-ligue:active,
  a.aj-prog, a.aj-prog:visited { text-decoration: none; }
  .aj-ligue:hover { border-color: var(--bo4); transform: translateY(-1px); }
  .aj-ligue:active { transform: scale(.98); }
  .aj-ligue:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
  .aj-ligue-kicker {
    font: 700 10px/1 'Inter', sans-serif;
    text-transform: uppercase; letter-spacing: .08em;
    color: var(--mu2);
    display: flex; align-items: center; gap: 5px;
  }
  .aj-ligue-main {
    font: 800 15px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); letter-spacing: -.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-ligue-sub {
    font: 500 11px/1.35 'Inter', sans-serif;
    color: var(--mu2);
  }

  /* Section title */
  .aj-section-title {
    font: 700 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--mu2);
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .aj-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--bo);
  }

  /* Section block */
  .aj-section { margin-bottom: 26px; }

  /* Card progression palier */
  .aj-prog {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: border-color .15s, transform .15s;
    text-decoration: none;
    color: inherit;
    -webkit-tap-highlight-color: transparent;
  }
  .aj-prog:hover { border-color: var(--bo4); transform: translateY(-1px); }
  .aj-prog:active { transform: scale(.99); }
  .aj-prog:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
  .aj-prog-ico {
    width: 36px; height: 36px;
    border-radius: 11px;
    background: var(--ap);
    border: 1px solid color-mix(in srgb, var(--a) 18%, transparent);
    display: flex; align-items: center; justify-content: center;
    color: var(--adk); flex-shrink: 0;
  }
  .aj-prog-body { flex: 1; min-width: 0; }
  .aj-prog-label {
    font: 700 11px/1 'Inter', sans-serif;
    text-transform: uppercase; letter-spacing: .08em;
    color: var(--mu2); margin-bottom: 3px;
  }
  .aj-prog-title {
    font: 800 13px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); letter-spacing: -.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-prog-bar-wrap {
    height: 5px; background: var(--bg2);
    border-radius: 99px; margin-top: 8px; overflow: hidden;
  }
  .aj-prog-bar {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, var(--a), var(--a-lt));
    transition: width .5s cubic-bezier(.2,.7,.3,1);
  }
  .aj-prog-next {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu2); margin-top: 5px;
  }
  .aj-prog-arrow { color: var(--mu2); flex-shrink: 0; }

  /* Activité récente */
  .aj-activity-list {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--s0);
  }
  .aj-act-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 16px;
    border-bottom: 1px solid var(--bo2);
  }
  .aj-act-row:last-child { border-bottom: none; }
  #aj-activity-more { margin-top: 8px; }
  .aj-activity-all {
    width: 100%; margin-top: 8px; padding: 11px;
    min-height: 44px;
    background: none; border: 1.5px dashed var(--bo);
    border-radius: 12px;
    font: 600 12.5px/1 'Inter', sans-serif; color: var(--mu);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .aj-activity-all:hover { border-color: var(--bo4); color: var(--ink5); }

  .aj-act-av {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .aj-act-info { flex: 1; min-width: 0; }
  .aj-act-name {
    font: 600 13px/1.2 'Inter', sans-serif;
    color: var(--ink);
    margin: 0 0 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-act-comp { min-width: 0; }
  .aj-act-comp-label {
    display: block;
    font: 500 12px/1.3 'Inter', sans-serif;
    color: var(--mu);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-act-comp-code {
    display: block;
    font: 600 11px/1 'IBM Plex Mono', monospace;
    color: var(--mu2);
    margin-top: 2px;
  }
  .aj-act-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
    flex-shrink: 0;
  }
  .aj-act-badge {
    font: 600 11px/1 'Inter', sans-serif;
    padding: 3px 8px;
    border-radius: 8px;
  }
  .aj-act-time {
    font: 500 12px/1 'IBM Plex Mono', monospace;
    color: var(--ink3);
  }

  /* Élèves compacts */
  .aj-eleves-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .aj-eleve-row {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--s0);
    cursor: pointer;
    transition: border-color .15s cubic-bezier(.4,0,.2,1), transform .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
    min-height: 44px;
  }
  .aj-eleve-row:hover {
    border-color: var(--bo4);
    transform: translateY(-1px);
    box-shadow: var(--s1);
  }
  .aj-eleve-row:active { transform: scale(.985); }
  .aj-eleve-row:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; border-radius: 12px; }

  .aj-eleve-av {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .aj-eleve-nom {
    font: 500 13px/1.2 'Inter', sans-serif;
    color: var(--ink);
    flex: 1;
    min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-eleve-prog {
    font: 700 12px/1 'IBM Plex Mono', monospace;
    color: var(--adk);
    flex-shrink: 0;
  }
  .aj-eleve-chev { color: var(--mu2); font-size: 14px; flex-shrink: 0; }

  /* Empty */
  .aj-empty {
    padding: 28px 20px;
    text-align: center;
    color: var(--mu2);
    font: 500 13px/1.5 'Inter', sans-serif;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 16px;
  }

  /* Skeleton — shimmer */
  .aj-skel { display: flex; flex-direction: column; gap: 16px; padding: 24px 16px; }
  .aj-skel-kpi {
    height: 90px;
    background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
    background-size: 200% 100%;
    border-radius: 16px;
    animation: aj-shimmer 1.4s ease-in-out infinite;
  }
  .aj-skel-bloc {
    height: 160px;
    background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
    background-size: 200% 100%;
    border-radius: 16px;
    animation: aj-shimmer 1.4s ease-in-out infinite;
    animation-delay: .1s;
  }
  @keyframes aj-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  /* Widget récap soir */
  .aj-recap {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 22px;
    cursor: pointer;
    box-shadow: var(--s0);
    transition: border-color .15s cubic-bezier(.4,0,.2,1), transform .15s cubic-bezier(.4,0,.2,1);
    animation: ajIn .5s cubic-bezier(.4,0,.2,1) both;
  }
  .aj-recap:hover { border-color: var(--bo4); transform: translateY(-1px); }
  .aj-recap:active { transform: scale(.985); }
  .aj-recap:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
  .aj-recap-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 8px;
  }
  .aj-recap-title {
    font: 800 14px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    flex: 1;
  }
  .aj-recap-kpi {
    font: 800 20px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--adk);
    letter-spacing: -.025em;
  }
  .aj-recap-sub {
    font: 500 12px/1.4 'Inter', sans-serif;
    color: var(--mu2);
  }
  .aj-recap-rows { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
  .aj-recap-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px;
    background: var(--bg2);
    border-radius: 8px;
    font: 500 12px/1 'Inter', sans-serif;
    color: var(--ink);
  }
  .aj-recap-row-name { flex: 1; }
  .aj-recap-row-dur  { font: 700 12px/1 'IBM Plex Mono', monospace; color: var(--adk); flex-shrink: 0; }
  .aj-recap-row-status {
    font: 600 10px/1 'Inter', sans-serif;
    padding: 3px 7px;
    border-radius: 6px;
    flex-shrink: 0;
  }
  .aj-recap-row-status.s-confirmed { background: var(--grp); color: var(--grd); }
  .aj-recap-row-status.s-pending   { background: var(--amp); color: var(--amk); }
  .aj-recap-row-status.s-refused   { background: var(--rdp); color: var(--rdk); }
  .aj-recap-row-status.s-auto      { background: var(--bg2); color: var(--mu2); }

  @media (prefers-reduced-motion: reduce) {
    .aj-hero, .aj-recap, .aj-skel-kpi, .aj-skel-bloc, .aj-prog-bar { animation: none !important; transition: none !important; }
  }
</style>`;

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatHeure(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ─── Entry point ──────────────────────────────────────────────────
let _ptrCleanup = null;

export async function unmount() {
  if (_ptrCleanup) {
    _ptrCleanup();
    _ptrCleanup = null;
  }
}

export async function mount(root) {
  const _root = root;
  const _me = getCurUser();
  if (!_me) return;

  track("page.view", { page: "aujourdhui", role: _me.role });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="aj-page">
      <div class="aj-skel">
        <div class="aj-skel-kpi"></div>
        <div class="aj-skel-bloc"></div>
        <div class="aj-skel-bloc"></div>
      </div>
    </div>
  `;

  // ─── Render principal (extrait pour réutilisation au pull-to-refresh) ──
  async function renderAll() {
    await renderInto(root, _me);
  }

  await renderAll();

  // ─── Pull-to-refresh + Live counter ──────────────────────────────────
  const { attachPullToRefresh, animateCounter } =
    await import("@/utils/gestures.js");

  // PTR : refait le fetch + render avec animation du compteur
  _ptrCleanup?.();
  _ptrCleanup = attachPullToRefresh(
    document.scrollingElement || document.body,
    {
      onRefresh: async () => {
        const before = parseInt(
          root.querySelector(".aj-kpi .aj-kpi-val")?.textContent || "0",
          10,
        );
        await renderAll();
        const after = parseInt(
          root.querySelector(".aj-kpi .aj-kpi-val")?.textContent || "0",
          10,
        );
        // Si nouvelles validations détectées, on anime le delta visuellement
        if (after > before) {
          const el = root.querySelector(".aj-kpi .aj-kpi-val");
          if (el) animateCounter(el, before, after, 700);
        }
      },
    },
  );

  return;
}

// ─── Render principal (factorisé pour pull-to-refresh) ─────────────────
async function renderInto(root, _me) {
  // ─── Fetch en parallèle ────────────────────────────────────────
  const today = todayISO();

  const [
    valsToday,
    valsAll,
    elevesAll,
    todaySessionsRes,
    profileRes,
    totalValsRes,
    leagueRes,
  ] = await Promise.all([
    // Validations d'aujourd'hui (faites par moi)
    sb
      .from("validations")
      .select("id, competence_id, statut, eleve_id, validated_at")
      .eq("validated_by", _me.id)
      .gte("validated_at", today + "T00:00:00.000Z")
      .lte("validated_at", today + "T23:59:59.999Z")
      .order("validated_at", { ascending: false }),

    // Dernières validations (activité récente) — 3 visibles + « voir tout »
    sb
      .from("validations")
      .select("id, competence_id, statut, eleve_id, validated_at")
      .eq("validated_by", _me.id)
      .order("validated_at", { ascending: false })
      .limit(8),

    // Tous les élèves de l'école (RLS filtre par école automatiquement)
    sb
      .from("profiles")
      .select("id, prenom, nom, last_active_at, enseignant_id, avatar_url")
      .eq("role", "eleve"),

    // Sessions loggées aujourd'hui (pour le widget récap soir)
    // Note : Supabase rpc ne supporte pas .catch() direct → on wrap dans Promise.resolve
    Promise.resolve(sb.rpc("get_my_today_sessions"))
      .then((r) => r)
      .catch(() => ({ data: null })),

    // Profil : prénom + streak pour le greeting
    sb
      .from("profiles")
      .select("prenom, streak_pro_days")
      .eq("id", _me.id)
      .maybeSingle(),

    // Total validations cumulées (pour la card de progression)
    sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", _me.id),

    // Ligue de la semaine (rang + points) — best-effort, la card dégrade bien
    Promise.resolve(
      sb.rpc("get_league_leaderboard", { p_role: "enseignant", p_limit: 50 }),
    ).catch(() => ({ data: null })),
  ]);

  if (valsToday.error || valsAll.error) {
    toast("Impossible de charger les données", "error");
  }

  const todayVals = valsToday.data || [];
  const recentVals = valsAll.data || [];
  const elevesMap = {};
  (elevesAll.data || []).forEach((e, i) => {
    elevesMap[e.id] = { ...e, idx: i };
  });

  const prenom = profileRes?.data?.prenom || "";
  const streakPro = profileRes?.data?.streak_pro_days ?? 0;
  const totalValsCount = totalValsRes?.count ?? 0;
  const moniteurState = getMoniteurState(totalValsCount);

  // KPI
  const acquisAujourdhui = todayVals.filter(
    (v) => v.statut === "acquis",
  ).length;

  // Élèves que j'ai validé au moins une fois (appartenance « mes élèves »)
  const { data: elevesValides } = await sb
    .from("validations")
    .select("eleve_id")
    .eq("validated_by", _me.id);
  const validatedByMe = new Set((elevesValides || []).map((v) => v.eleve_id));

  // Avancement RÉEL par élève = compétences acquises DISTINCTES, toutes
  // validations école confondues (pas seulement les miennes). Cohérent avec
  // mes-eleves.js — sinon un élève suivi par un collègue paraît en retard.
  const { data: acquisAll } = await sb
    .from("validations")
    .select("eleve_id, competence_id")
    .eq("statut", "acquis");
  const acquisSetByEleve = {};
  (acquisAll || []).forEach((v) => {
    if (!v.competence_id) return;
    (acquisSetByEleve[v.eleve_id] ||= new Set()).add(v.competence_id);
  });

  // Union : élèves directement attitrés (enseignant_id = me) + élèves déjà validés
  // → garantit que les élèves assignés sans validation encore apparaissent quand même
  const mesIds = new Set(
    Object.values(elevesMap)
      .filter((e) => e.enseignant_id === _me.id)
      .map((e) => e.id),
  );
  for (const id of validatedByMe) mesIds.add(id);

  const mesElevesActifs = Array.from(mesIds).map((id) => ({
    id,
    ...(elevesMap[id] || { prenom: "Élève", nom: "", idx: 0 }),
    acquis: acquisSetByEleve[id]?.size || 0,
  }));

  // Total école (cohérent avec mes-eleves qui montre tous les élèves RLS)
  const nbElevesEcole = (elevesAll.data || []).length;
  const nbElevesActifs = mesElevesActifs.length;

  // Élèves à reconnecter : SEUL signal de relance, à 14 j d'inactivité pile.
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const reconnectList = mesElevesActifs.filter((e) => {
    const p = elevesMap[e.id];
    return !p?.last_active_at || p.last_active_at < fourteenDaysAgo;
  });
  const reconnectCount = reconnectList.length;

  // ─── KPI engagement & complétude livret (sur MES élèves) ──────
  // Actif = ouvert l'app dans les 7 derniers jours (last_active_at).
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const actifs7j = mesElevesActifs.filter((e) => {
    const p = elevesMap[e.id];
    return p?.last_active_at && p.last_active_at >= sevenDaysAgo;
  }).length;
  const engagementPct =
    nbElevesActifs > 0 ? Math.round((actifs7j / nbElevesActifs) * 100) : 0;

  // Complétude livret moyenne = moyenne des % d'acquis de mes élèves
  const livretPct =
    nbElevesActifs > 0
      ? Math.round(
          (mesElevesActifs.reduce((s, e) => s + (e.acquis || 0), 0) /
            (nbElevesActifs * REMC_TOTAL)) *
            100,
        )
      : 0;

  // Ma ligue de la semaine (rang réel parmi les enseignants)
  const leagueRows = leagueRes?.data || [];
  const myLeagueRow = leagueRows.find((r) => r.is_me) || null;
  const myWeeklyPts = myLeagueRow?.weekly_pts ?? 0;
  const myLeague = getLeague(myWeeklyPts);

  // ─── Hero « prochaine action » — 1 action utile priorisée ──────
  // Priorité : relancer (14 j, seul signal) → valider une compétence →
  // fallback démarrage. Pas de relance quiz / inactif 7 j sur l'accueil.
  let hero;
  if (reconnectCount > 0) {
    const noms = reconnectList
      .slice(0, 2)
      .map((e) => e.prenom || "Élève")
      .join(", ");
    hero = {
      tone: "warn",
      ico: "users",
      kicker: "À relancer",
      title: `${reconnectCount} élève${reconnectCount > 1 ? "s" : ""} sans activité depuis 14 j`,
      sub: noms ? `Dont ${esc(noms)}${reconnectCount > 2 ? "…" : ""}` : "",
      cta: "Voir qui relancer",
      href: "#/eleves?tab=arelancer",
      ev: "hero.reconnect",
    };
  } else if (nbElevesActifs > 0) {
    // Pas de relance en attente → action positive : valider une compétence
    const next = mesElevesActifs
      .slice()
      .sort((a, b) => (a.acquis || 0) - (b.acquis || 0))[0];
    hero = {
      tone: "ok",
      ico: "check-circle",
      kicker: "Action du jour",
      title: "Valide une compétence",
      sub: next
        ? `Fais avancer ${esc(next.prenom || "un élève")} — ouvre son livret REMC.`
        : "Ouvre un livret et valide ce qui est acquis en séance.",
      cta: next ? "Ouvrir le livret" : "Enregistrer une séance",
      href: next ? `#/livret/${next.id}` : "#/log-session",
      ev: "hero.valider_competence",
    };
  } else {
    hero = {
      tone: "neutral",
      ico: "user-plus",
      kicker: "Démarrage",
      title: "Invite ton premier élève",
      sub: "Envoie un lien d'inscription par SMS ou WhatsApp. Ton élève crée son compte en 30 secondes.",
      cta: "Inviter un élève",
      href: null,
      action: "invite",
      ev: "hero.invite_eleve",
    };
  }

  const heroHtml = `
    <div class="aj-hero tone-${hero.tone}"${hero.href || hero.action ? ` id="aj-hero"` : ""}${hero.href ? ` data-href="${esc(hero.href)}" data-ev="${esc(hero.ev)}"` : ""}>
      <div class="aj-hero-top">
        <div class="aj-hero-ico">${iconBadge(hero.ico, { color: hero.tone === "warn" ? "var(--amk)" : hero.tone === "ok" ? "var(--grd)" : "var(--a)", size: 44 })}</div>
        <div class="aj-hero-body">
          <div class="aj-hero-kicker">${esc(hero.kicker)}</div>
          <h2 class="aj-hero-title">${hero.title}</h2>
          ${hero.sub ? `<p class="aj-hero-sub">${hero.sub}</p>` : ""}
        </div>
      </div>
      ${hero.cta ? `<button class="aj-hero-cta" type="button" id="aj-hero-cta">${esc(hero.cta)} ${icon("chevron-right", { size: 16, strokeWidth: 2.5 })}</button>` : ""}
    </div>`;

  // ─── Widget récap soir ────────────────────────────────────────
  const isEvening = new Date().getHours() >= 18;
  const todaySessions = todaySessionsRes?.data || [];

  const recapWidget =
    isEvening && todaySessions.length > 0
      ? `
    <div class="aj-recap" id="aj-recap-soir" role="button" tabindex="0" aria-label="Ouvrir la validation de séance">
      <div class="aj-recap-head">
        <span class="aj-recap-title">Ta journée</span>
        <span class="aj-recap-kpi">${todaySessions.length}</span>
      </div>
      <div class="aj-recap-sub">${todaySessions.length} séance${todaySessions.length > 1 ? "s" : ""} enregistrée${todaySessions.length > 1 ? "s" : ""}</div>
      <div class="aj-recap-rows">
        ${todaySessions
          .map(
            (s) => `
          <div class="aj-recap-row">
            <span class="aj-recap-row-name">${esc(s.eleve_prenom || "Élève")}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `
      : "";

  // ─── Render ───────────────────────────────────────────────────
  root.innerHTML = `
    ${STYLE}
    <div class="aj-page anim-slide-up">

      <header class="aj-hd">
        <h1 class="aj-h1">${prenom ? `Bonjour, ${esc(prenom)}` : "Aujourd'hui"}</h1>
        <p class="aj-date">${formatDate(new Date())}</p>
        ${
          acquisAujourdhui > 0 || streakPro > 0
            ? `
        <div class="aj-xp-strip">
          ${acquisAujourdhui > 0 ? `<span class="aj-xp-chip">+${acquisAujourdhui * 10} XP aujourd'hui</span>` : ""}
          ${streakPro >= 2 ? `<span class="aj-streak-chip">${icon("flame", { size: 12, strokeWidth: 2 })} ${streakPro} jours actifs</span>` : ""}
        </div>`
            : ""
        }
      </header>

      ${recapWidget}

      <!-- Hero : prochaine action utile -->
      ${heroHtml}

      <!-- KPI : mes élèves / engagement 7 j / complétude livret -->
      <div class="aj-quickstats">
        <div class="aj-quickstat" title="${nbElevesEcole} élèves dans l'école">
          <div class="aj-quickstat-val">${nbElevesActifs}</div>
          <div class="aj-quickstat-lbl">Mes élèves</div>
        </div>
        <div class="aj-quickstat"${nbElevesActifs > 0 ? ` title="${actifs7j} élèves sur ${nbElevesActifs}"` : ""}>
          <div class="aj-quickstat-val">${nbElevesActifs > 0 ? `${engagementPct}<small> %</small>` : "—"}</div>
          <div class="aj-quickstat-lbl">Actifs cette semaine</div>
          <div class="aj-quickstat-bar"><div style="width:${engagementPct}%"></div></div>
        </div>
        <div class="aj-quickstat">
          <div class="aj-quickstat-val">${nbElevesActifs > 0 ? `${livretPct}<small> %</small>` : "—"}</div>
          <div class="aj-quickstat-lbl">Livret moyen</div>
          <div class="aj-quickstat-bar"><div style="width:${livretPct}%"></div></div>
        </div>
      </div>

      <!-- Action rapide : Inviter seulement — « Mes élèves » est dans la nav,
           « Valider une séance » a déjà le FAB + le hero -->
      <div class="aj-actions">
        <button class="aj-action" id="aj-act-invite" type="button">
          <span class="aj-action-ico">${icon("user-plus", { size: 16, strokeWidth: 2 })}</span>
          Inviter un élève
        </button>
      </div>

      <!-- Progression palier — card cliquable vers parcours-pro -->
      ${(() => {
        const s = moniteurState;
        const tierTitle = s.tier?.title ?? "Enseignant — Démarrage";
        const pct = s.isMax ? 100 : s.pctToNextReward;
        const nextLabel = s.isMax
          ? "Palier maximum atteint"
          : s.nextReward
            ? `Prochain : ${esc(s.nextReward.label)}`
            : "";
        return `<a class="aj-prog" href="#/parcours" id="aj-prog-card" aria-label="Progression palier : ${esc(tierTitle)}">
          <div class="aj-prog-ico">${icon("trending-up", { size: 18, strokeWidth: 2 })}</div>
          <div class="aj-prog-body">
            <div class="aj-prog-label">Palier</div>
            <div class="aj-prog-title">${esc(tierTitle)}</div>
            <div class="aj-prog-bar-wrap">
              <div class="aj-prog-bar" style="width:${pct}%"></div>
            </div>
            ${nextLabel ? `<div class="aj-prog-next">${nextLabel}</div>` : ""}
          </div>
          <div class="aj-prog-arrow">${icon("chevron-right", { size: 16, strokeWidth: 2 })}</div>
        </a>`;
      })()}

      <!-- Accès ligues -->
      <div class="aj-section">
        <div class="aj-section-title">Classements</div>
        <div class="aj-ligues">
          <a class="aj-ligue" href="#/ligue-semaine" id="aj-ligue-moi">
            <span class="aj-ligue-kicker">
              ${myLeague ? `<span style="width:7px;height:7px;border-radius:50%;background:${myLeague.color};display:inline-block" aria-hidden="true"></span>` : ""}
              Ma ligue
            </span>
            <span class="aj-ligue-main">${
              myLeague
                ? `${esc(myLeague.name)}${myLeagueRow?.rank_pos ? ` · ${myLeagueRow.rank_pos}ᵉ` : ""}`
                : "Pas encore classé"
            }</span>
            <span class="aj-ligue-sub">${
              myWeeklyPts > 0
                ? `${myWeeklyPts} validation${myWeeklyPts > 1 ? "s" : ""} cette semaine`
                : "1 validation = 1 point"
            }</span>
          </a>
          <a class="aj-ligue" href="#/classement-eleves" id="aj-ligue-eleves">
            <span class="aj-ligue-kicker">${icon("award", { size: 11, strokeWidth: 2 })} Mes élèves</span>
            <span class="aj-ligue-main">Ligue théorie</span>
            <span class="aj-ligue-sub">Qui révise en autonomie ?</span>
          </a>
        </div>
      </div>

      <!-- Activité récente -->
      <div class="aj-section">
        <div class="aj-section-title">Activité récente</div>
        ${
          recentVals.length === 0
            ? `<div class="aj-empty" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px 20px;">
               <span style="opacity:.5;color:var(--mu)" aria-hidden="true">${icon("clipboard", { size: 34 })}</span>
               <strong style="font:600 14px/1.2 'Inter',sans-serif;color:var(--ink)">Pas encore de validation</strong>
               <span style="font:500 12px/1.5 'Inter',sans-serif;color:var(--mu2);text-align:center">Enregistre ta première séance<br>pour voir l'activité ici.</span>
             </div>`
            : `<div class="aj-activity-list">
              ${recentVals
                .slice(0, 3)
                .map((v) => renderActRow(v, elevesMap))
                .join("")}
            </div>
            ${
              recentVals.length > 3
                ? `<div class="aj-activity-list" id="aj-activity-more" hidden>
                     ${recentVals
                       .slice(3)
                       .map((v) => renderActRow(v, elevesMap))
                       .join("")}
                   </div>
                   <button class="aj-activity-all" id="aj-activity-all" type="button">Voir tout</button>`
                : ""
            }`
        }
      </div>

    </div>

  `;

  // Wire listeners
  if (hero.action === "invite") {
    const doInvite = () => {
      track(hero.ev || "hero.invite_eleve");
      openInviteEleveModal(_me);
    };
    root.querySelector("#aj-hero-cta")?.addEventListener("click", doInvite);
    root.querySelector("#aj-hero")?.addEventListener("click", (e) => {
      if (!e.target.closest("#aj-hero-cta")) doInvite();
    });
  } else if (hero.href) {
    const goHero = () => {
      track(hero.ev || "hero.clicked");
      navigate(hero.href);
    };
    root.querySelector("#aj-hero-cta")?.addEventListener("click", goHero);
    root.querySelector("#aj-hero")?.addEventListener("click", (e) => {
      if (!e.target.closest("#aj-hero-cta")) goHero();
    });
  }

  // Bouton "Inviter" dans la section Mes élèves (état vide)
  root.querySelector("#aj-invite-btn")?.addEventListener("click", () => {
    track("invite.empty.aujourdhui.clicked");
    openInviteEleveModal(_me);
  });

  // Actions rapides
  root.querySelector("#aj-act-invite")?.addEventListener("click", () => {
    track("quick_action.invite");
    openInviteEleveModal(_me);
  });
  const activityAllBtn = root.querySelector("#aj-activity-all");
  activityAllBtn?.addEventListener("click", () => {
    root.querySelector("#aj-activity-more")?.removeAttribute("hidden");
    activityAllBtn.remove();
    track("aujourdhui.activity.voir_tout");
  });
  root.querySelector("#aj-ligue-moi")?.addEventListener("click", () => {
    track("ligue.open", { from: "aujourdhui", which: "moniteur" });
  });
  root.querySelector("#aj-ligue-eleves")?.addEventListener("click", () => {
    track("ligue.open", { from: "aujourdhui", which: "eleves" });
  });

  // Recap soir / prompt log → page dédiée plein écran
  const goLogSession = () => {
    track("log_prompt.soir.clicked");
    navigate("#/log-session");
  };
  const recapEl = root.querySelector("#aj-recap-soir");
  if (recapEl) {
    recapEl.addEventListener("click", goLogSession);
    recapEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goLogSession();
      }
    });
  }

  root.querySelectorAll(".aj-eleve-row[data-eleve-id]").forEach((row) => {
    const open = () => {
      const id = row.dataset.eleveId;
      track("eleve.livret.open", { eleve_id: id, from: "aujourdhui" });
      navigate(`#/livret/${id}`);
    };
    row.addEventListener("click", open);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  // Tour guidé à la première connexion (après le wiring, ancres en place)
  maybeStartMoniteurTour();
}

// ─── Sub-renders ──────────────────────────────────────────────────
function renderActRow(val, elevesMap) {
  const eleve = elevesMap[val.eleve_id] || { prenom: "Élève", nom: "", idx: 0 };
  const fullNom = esc(
    [eleve.prenom, eleve.nom].filter(Boolean).join(" ") || "—",
  );
  const cfg = statutCfg(val.statut);

  return `
    <div class="aj-act-row">
      <div class="aj-act-av" style="flex-shrink:0">${renderUserAvatar({ avatar_url: eleve.avatar_url, prenom: eleve.prenom, nom: eleve.nom }, 36)}</div>
      <div class="aj-act-info">
        <div class="aj-act-name">${fullNom || "—"}</div>
        <div class="aj-act-comp">
          <span class="aj-act-comp-label">${esc(labelComp(val.competence_id))}</span>
          <span class="aj-act-comp-code">${esc(val.competence_id || "—")}</span>
        </div>
      </div>
      <div class="aj-act-right">
        <span class="aj-act-badge" style="color:${cfg.color}; background:${cfg.bg}">
          ${esc(cfg.label)}
        </span>
        <span class="aj-act-time">${formatHeure(val.validated_at)}</span>
      </div>
    </div>
  `;
}

function renderEleveRow(eleve) {
  const fullNom = esc(
    [eleve.prenom, eleve.nom].filter(Boolean).join(" ") || "—",
  );
  const pct =
    REMC_TOTAL > 0 ? Math.round((eleve.acquis / REMC_TOTAL) * 100) : 0;

  return `
    <div class="aj-eleve-row" data-eleve-id="${esc(eleve.id)}"
         role="button" tabindex="0" aria-label="Livret de ${fullNom}">
      <div class="aj-eleve-av" style="flex-shrink:0">${renderUserAvatar({ avatar_url: eleve.avatar_url, prenom: eleve.prenom, nom: eleve.nom }, 36)}</div>
      <span class="aj-eleve-nom">${fullNom || "—"}</span>
      <span class="aj-eleve-prog">${eleve.acquis}/${REMC_TOTAL}</span>
      <span class="aj-eleve-chev" aria-hidden="true">›</span>
    </div>
  `;
}
