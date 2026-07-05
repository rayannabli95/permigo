// ═══════════════════════════════════════════════════════════════
// Enseignant — Valider une séance (REFONTE sans heures) — DA Arcade Routière v2
// Un seul écran : élève → compétences REMC (multi-statut) → note → valider.
// Moniteur = source de vérité. Zéro durée, zéro métrique de classement.
// RPC : validate_session(p_eleve_id, p_session_date, p_note,
//                        p_acquis[], p_en_cours[], p_a_retravailler[])
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { promptInstallAtValueMoment } from "@/components/common/install-nudge.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { fmtName } from "@/utils/fmt-name.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";
import { getFiche } from "@/data/fiches-conduite.js";
import { labelComp } from "@/utils/remc-label.js";
import { shouldShowHint, markHintSeen } from "@/utils/coach-hint.js";
import { startTour } from "@/components/common/guided-tour.js";
import { medallion } from "@/utils/medallions.js";

// Tour guidé validation — 1× à la première séance, quand l'UI complète existe
const TOUR_KEY = "pg-tour-validation-v1";
const VALIDATION_TOUR_STEPS = [
  {
    sel: ".vsc-cat-head",
    title: "Le programme officiel",
    text: "Les 31 compétences sont regroupées en 4 catégories, comme dans le livret.",
  },
  {
    sel: ".vsc-row:not(.locked) .vsc-box",
    title: "Coche où en est l'élève",
    text: "Sur chaque ligne, coche Acquis, En cours ou À revoir. Rappuie sur une case pour la corriger.",
  },
  {
    sel: "#vs-submit",
    title: "Enregistre la séance",
    text: "Le livret de l'élève se met à jour immédiatement. Il voit sa progression dès sa prochaine connexion.",
  },
];

function maybeStartValidationTour() {
  try {
    if (localStorage.getItem(TOUR_KEY)) return;
    localStorage.setItem(TOUR_KEY, "1");
  } catch {
    return;
  }
  setTimeout(() => {
    if (!document.querySelector("#vs-submit")) return;
    track("validation.tour.start");
    startTour(VALIDATION_TOUR_STEPS, {
      onDone: () => track("validation.tour.done"),
    });
  }, 500);
}

const MAX_NOTE = 300;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ─── State ───────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleves = [];
let _eleve = null; // id
let _acquisSet = new Set(); // compétences déjà acquises (verrouillées)
let _picked = new Map(); // competence_id → statut choisi cette séance
let _note = "";
let _query = "";
let _submitting = false;
let _eleveDDOpen = false; // dropdown élève ouvert
let _showSub = false; // coach-hint mode d'emploi (1re visite seulement)

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
  /* ── Wrapper global ── */
  .vs {
    padding: 0 16px calc(152px + env(safe-area-inset-bottom,0px));
    max-width: 600px; margin: 0 auto;
    background: var(--bg); color: var(--ink);
    font-family: var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  }

  /* ── Header arcade : mini hero presse-papier ── */
  .vs-hd {
    position: relative; overflow: hidden;
    margin: 0 -16px 18px;
    padding: 18px 16px 24px;
    background: linear-gradient(150deg, #4f46e5, #6d6bff 60%, #8b5cf6);
    color: #fff;
    isolation: isolate;
  }
  /* liseré marquage au sol */
  .vs-hd::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 5px; z-index: 1;
    background: none;
    opacity: .75;
  }
  .vs-hd-inner { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; }
  .vs-back {
    width: 40px; height: 40px; flex-shrink: 0;
    border: 1.5px solid rgba(255,255,255,.22); background: rgba(255,255,255,.1);
    border-radius: var(--ens-r, 16px); color: #fff;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background .15s;
  }
  .vs-back:active { background: rgba(255,255,255,.2); transform: scale(.97); }
  .vs-back:focus-visible { outline: 3px solid rgba(255,255,255,.6); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .vs-back { transition: none; } }
  .vs-hd-text { flex: 1; min-width: 0; }
  .vs-h1 {
    font: 700 19px/1.15 var(--ens-display, 'Fredoka'), sans-serif;
    color: #fff; margin: 0; letter-spacing: -.015em;
  }
  .vs-sub {
    font: 500 12px/1.3 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: rgba(255,255,255,.72); margin: 3px 0 0;
  }
  .vs-hd-illus { flex-shrink: 0; opacity: .9; }

  /* ── Carte générique (wrapper section) ── */
  .vs-card {
    background: var(--su); border: 1.5px solid var(--bo);
    border-radius: var(--ens-r, 16px); padding: 14px; margin-bottom: 12px;
    box-shadow: var(--ens-shadow, var(--s0));
  }
  .vs-card-ttl {
    font: 700 12px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    letter-spacing: .04em; text-transform: uppercase;
    color: var(--mu2); margin: 0 0 12px;
    display: flex; align-items: center; gap: 6px;
  }

  /* ── Dropdown élève ── */
  .vs-search-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--mu2); pointer-events: none; }
  .vs-search {
    width: 100%; box-sizing: border-box; min-height: 44px;
    padding: 10px 12px 10px 36px;
    background: var(--bg); border: 1.5px solid var(--bo);
    border-radius: var(--ens-r, 16px);
    font: 500 16px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: var(--ink); outline: none;
  }
  .vs-search:focus { border-color: var(--ens-go, var(--a)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ens-go, var(--a)) 18%, transparent); }

  .vs-dd { position: relative; margin-bottom: 16px; z-index: 30; }
  .vs-dd-backdrop { position: fixed; inset: 0; z-index: 20; }
  .vs-dd-trigger {
    position: relative; z-index: 31; width: 100%; box-sizing: border-box;
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    min-height: 60px; background: var(--su);
    border: 1.5px solid var(--bo); border-radius: var(--ens-r, 16px);
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: border-color .15s, box-shadow .15s, transform .14s;
  }
  .vs-dd-trigger:active { transform: scale(.98); }
  .vs-dd.open .vs-dd-trigger {
    border-color: var(--ens-go, var(--a));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ens-go, var(--a)) 18%, transparent);
  }
  .vs-dd-cur { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
  .vs-dd-av { flex-shrink: 0; display: inline-flex; }
  .vs-dd-txt { display: flex; flex-direction: column; min-width: 0; text-align: left; }
  .vs-dd-name { font: 700 14.5px/1.2 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vs-dd-ph { color: var(--mu2); font-weight: 600; }
  .vs-dd-sub { font: 600 11.5px/1 'IBM Plex Mono', monospace; color: var(--mu2); margin-top: 3px; }
  .vs-dd-chev { flex-shrink: 0; color: var(--mu2); display: inline-flex; transition: transform .25s; }
  .vs-dd.open .vs-dd-chev { transform: rotate(180deg); }
  .vs-dd-panel {
    position: absolute; z-index: 31; top: calc(100% + 6px); left: 0; right: 0;
    background: var(--su); border: 1.5px solid var(--bo);
    border-radius: var(--ens-r, 16px);
    box-shadow: 0 16px 40px -10px rgba(10,13,26,.22);
    padding: 6px; max-height: 0; overflow: hidden; overscroll-behavior: contain;
    opacity: 0; transform: translateY(-6px); pointer-events: none;
    transition: max-height .25s, opacity .18s, transform .2s;
  }
  .vs-dd.open .vs-dd-panel { max-height: min(62vh, 420px); overflow-y: auto; opacity: 1; transform: translateY(0); pointer-events: auto; }
  .vs-dd-search { position: relative; margin: 4px 4px 8px; }
  .vs-dd-list { display: flex; flex-direction: column; gap: 2px; }
  .vs-dd-opt {
    display: flex; align-items: center; gap: 10px; width: 100%;
    box-sizing: border-box; padding: 9px 10px; min-height: 44px;
    border: 0; background: transparent; border-radius: var(--ens-r, 16px);
    cursor: pointer; text-align: left; color: var(--ink);
    -webkit-tap-highlight-color: transparent;
    opacity: 0; animation: vsDdIn .22s ease forwards;
  }
  .vs-dd-opt:hover { background: var(--bg); }
  .vs-dd-opt.sel { background: color-mix(in srgb, var(--ens-go, var(--a)) 8%, transparent); }
  .vs-dd-opt .vs-dd-name { font: 600 14px/1.2 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; flex: 1; }
  .vs-dd-check { flex-shrink: 0; color: var(--ens-go, var(--a)); display: inline-flex; }
  @keyframes vsDdIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
  @media (prefers-reduced-motion: reduce) { .vs-dd-opt { animation: none; opacity: 1; } .vs-dd-chev, .vs-dd-panel { transition: none; } }

  /* ══ CARNET D'ÉVALUATION (DA A2 — document + indigo, theme-aware) ══ */
  .vsc {
    border: 1.5px solid var(--bo); border-radius: var(--ens-r, 16px);
    background: var(--su); overflow: hidden; margin-bottom: 14px;
    box-shadow: var(--ens-shadow, var(--s0));
  }
  /* — En-tête document — */
  .vsc-head { padding: 12px 14px 11px; border-bottom: 2px solid var(--ink); position: relative; }
  .vsc-head::after { content: ""; position: absolute; left: 14px; right: 14px; bottom: -5px; height: 1px; background: var(--bo3); }
  .vsc-head-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .vsc-doc-title { font: 800 9px/1 var(--ens-body, 'Inter'), sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--mu2); }
  .vsc-doc-date { font: 800 13px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--ink); font-variant-numeric: tabular-nums; }
  .vsc-head-meta { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 9px; }
  .vsc-meta { display: flex; align-items: center; gap: 7px; min-width: 0; }
  .vsc-meta i { font: 700 8px/1 var(--ens-body, 'Inter'), sans-serif; letter-spacing: .12em; text-transform: uppercase; color: var(--mu2); font-style: normal; }
  .vsc-meta b { font: 700 13px/1.1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vsc-av { flex-shrink: 0; display: inline-flex; }

  /* — Bande de catégorie (indigo) — */
  .vsc-cat-head { display: flex; align-items: center; gap: 9px; padding: 8px 14px; background: var(--a); color: #fff; }
  .vsc-cno { font: 800 12px/1 'IBM Plex Mono', monospace; color: #d3d0ff; flex: 0 0 auto; }
  .vsc-cname { font: 700 13px/1 var(--ens-display, 'Fredoka'), sans-serif; letter-spacing: .2px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vsc-cbar { flex: 0 0 40px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.24); overflow: hidden; }
  .vsc-cbar i { display: block; height: 100%; border-radius: 3px; background: #fff; transition: width .3s ease; }
  .vsc-ccount { font: 700 10px/1 'IBM Plex Mono', monospace; color: rgba(255,255,255,.82); flex: 0 0 auto; font-variant-numeric: tabular-nums; }
  .vsc-ccount b { color: #fff; }

  /* — En-tête des 3 colonnes — */
  .vsc-colhead { display: grid; grid-template-columns: 1fr 46px 46px 46px; align-items: end; padding: 6px 12px 5px 14px; background: var(--su2); border-bottom: 1.5px solid var(--bo3); }
  .vsc-ch { position: relative; text-align: center; padding-top: 9px; font: 800 7.5px/1 var(--ens-body, 'Inter'), sans-serif; letter-spacing: .02em; text-transform: uppercase; white-space: nowrap; }
  .vsc-ch::before { content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 15px; height: 3px; border-radius: 2px; background: currentColor; }
  .vsc-ch.acq { color: var(--ens-go, #18a558); } .vsc-ch.enc { color: #2563eb; } .vsc-ch.rev { color: var(--ens-amber, #d97706); }

  /* — Ligne = sous-compétence — */
  .vsc-row { display: grid; grid-template-columns: 1fr 46px 46px 46px; align-items: center; padding: 0 12px 0 14px; min-height: 46px; border-bottom: 1px solid var(--bo3); position: relative; }
  .vsc-row:last-of-type { border-bottom: 0; }
  .vsc-row.done::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
  .vsc-row.s-acq::before { background: var(--ens-go, #18a558); } .vsc-row.s-enc::before { background: #2563eb; } .vsc-row.s-rev::before { background: var(--ens-amber, #f59e0b); }
  .vsc-label { display: flex; align-items: baseline; gap: 8px; padding: 8px 8px 8px 0; min-width: 0; }
  .vsc-code { flex: 0 0 auto; width: 26px; font: 700 10.5px/1 'IBM Plex Mono', monospace; color: var(--a); }
  .vsc-lbl { font: 500 12.5px/1.25 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--ink); min-width: 0; }
  .vsc-row.locked { opacity: .62; }
  .vsc-row.locked .vsc-lbl { color: var(--mu2); }

  /* — Case à cocher (hit-area = toute la cellule ≥44px) — */
  .vsc-box { -webkit-tap-highlight-color: transparent; appearance: none; border: 0; background: none; padding: 0; margin: 0; width: 100%; min-height: 46px; display: grid; place-items: center; cursor: pointer; }
  .vsc-box:disabled { cursor: default; }
  .vsc-box .bx { width: 28px; height: 28px; border-radius: 7px; border: 1.5px solid var(--bo3); background: var(--su); display: grid; place-items: center; transition: transform .1s ease, border-color .12s, background .12s; }
  .vsc-box:not(:disabled):active .bx { transform: scale(.88); }
  .vsc-box.c-acq .bx { background: color-mix(in srgb, var(--ens-go, #18a558) 5%, var(--su)); }
  .vsc-box.c-enc .bx { background: color-mix(in srgb, #2563eb 5%, var(--su)); }
  .vsc-box.c-rev .bx { background: color-mix(in srgb, var(--ens-amber, #f59e0b) 6%, var(--su)); }
  .vsc-box .mk { display: none; }
  .vsc-box.on.c-acq .bx { border-color: var(--ens-go, #18a558); background: color-mix(in srgb, var(--ens-go, #18a558) 16%, var(--su)); }
  .vsc-box.on.c-acq .mk { display: block; color: var(--ens-go, #18a558); }
  .vsc-box.on.c-enc .bx { border-color: #2563eb; background: color-mix(in srgb, #2563eb 16%, var(--su)); }
  .vsc-box.on.c-enc .mk { display: block; color: #2563eb; }
  .vsc-box.on.c-rev .bx { border-color: var(--ens-amber, #d97706); background: color-mix(in srgb, var(--ens-amber, #f59e0b) 18%, var(--su)); }
  .vsc-box.on.c-rev .mk { display: block; color: var(--ens-amber, #b45309); }
  .vsc-box:focus-visible .bx { outline: 2px solid var(--a); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .vsc-box .bx { transition: none; } }

  /* — Pied de tableau : synthèse de la séance (live) — */
  .vsc-foot { display: flex; align-items: stretch; border-top: 2px solid var(--ink); background: var(--su2); }
  .vsc-foot .m { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 8px 4px; border-right: 1px solid var(--bo3); }
  .vsc-foot .m:last-child { border-right: 0; }
  .vsc-foot .m .n { font: 800 16px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; font-variant-numeric: tabular-nums; }
  .vsc-foot .m .k { font: 700 7.5px/1 var(--ens-body, 'Inter'), sans-serif; letter-spacing: .07em; text-transform: uppercase; color: var(--mu2); margin-top: 2px; }
  .vsc-foot .m.acq .n { color: var(--ens-go, #18a558); } .vsc-foot .m.enc .n { color: #2563eb; } .vsc-foot .m.rev .n { color: var(--ens-amber, #b45309); }
  .vsc-foot .m.tot { background: color-mix(in srgb, var(--a) 8%, var(--su)); }
  .vsc-foot .m.tot .n { color: var(--ink); }

  /* ── Note moniteur ── */
  .vs-note {
    width: 100%; box-sizing: border-box; min-height: 72px; resize: vertical; padding: 12px;
    background: var(--bg); border: 1.5px solid var(--bo);
    border-radius: var(--ens-r, 16px);
    font: 500 14px/1.5 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: var(--ink); outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .vs-note:focus {
    border-color: var(--ens-go, var(--a));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ens-go, var(--a)) 18%, transparent);
  }
  .vs-note-count { font: 500 11px/1 'IBM Plex Mono', monospace; color: var(--mu2); text-align: right; margin-top: 6px; }

  /* ── Footer sticky ── */
  .vs-footer {
    position: fixed; bottom: calc(60px + env(safe-area-inset-bottom,0px)); left: 0; right: 0; z-index: 45;
    padding: 10px 16px;
    background: color-mix(in srgb, var(--bg) 90%, transparent);
    backdrop-filter: blur(12px); border-top: 1px solid var(--bo);
  }
  .vs-submit {
    width: 100%; max-width: 600px; margin: 0 auto; min-height: 52px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    border: 0; border-radius: var(--ens-r, 16px);
    background: linear-gradient(180deg, var(--ens-go-lt, #34d27b), var(--ens-go, #18a558));
    color: var(--ens-ink-go, #07150c);
    font: 700 15px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; cursor: pointer;
    box-shadow: 0 4px 0 color-mix(in srgb, var(--ens-go, #18a558) 60%, #000), var(--ens-shadow, var(--s0));
    transition: transform .1s ease, box-shadow .1s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .vs-submit:active { transform: translateY(3px); box-shadow: 0 1px 0 color-mix(in srgb, var(--ens-go, #18a558) 60%, #000); }
  .vs-submit:focus-visible { outline: 3px solid var(--ens-go, var(--a)); outline-offset: 2px; }
  .vs-submit:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; }
  @media (prefers-reduced-motion: reduce) { .vs-submit { transition: none; } }

  /* ── Squelettes chargement ── */
  .vs-empty { padding: 32px 16px; text-align: center; color: var(--mu2); font: 500 14px/1.5 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; }
  .vs-skel {
    height: 64px; border-radius: var(--ens-r, 16px); background: var(--su);
    border: 1.5px solid var(--bo); animation: vsPulse 1.4s ease-in-out infinite; margin-bottom: 8px;
  }
  @keyframes vsPulse { 0%,100%{opacity:1} 50%{opacity:.5} }

  /* ── Écran succès après séance ── */
  .vs-success {
    max-width: 480px; margin: 0 auto; padding: 44px 24px;
    text-align: center; display: flex; flex-direction: column; align-items: center;
  }
  /* Médaillon trophée doré — moment de valeur (séance validée) + halo */
  .vs-success-check {
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    animation: vs-pop .42s cubic-bezier(.34,1.56,.64,1) both;
  }
  .vs-success-check .pg-med {
    filter: drop-shadow(0 6px 16px rgba(240,138,18,.4)) drop-shadow(0 2px 4px rgba(154,90,5,.35));
  }
  @keyframes vs-pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .vs-success-comp {
    font: 600 13px/1.3 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: var(--mu); margin-bottom: 6px;
    display: inline-flex; align-items: center; gap: 6px;
  }
  /* Chip "Séance enregistrée" arcade */
  .vs-success-badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
    border-radius: var(--ens-r-pill, 999px);
    background: color-mix(in srgb, var(--ens-go, #18a558) 14%, var(--su));
    border: 1.5px solid color-mix(in srgb, var(--ens-go, #18a558) 28%, transparent);
    color: var(--ens-go, #18a558);
    font: 700 12px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    margin-bottom: 14px;
  }
  .vs-success-title {
    font: 700 24px/1.2 var(--ens-display, 'Fredoka'), sans-serif;
    color: var(--ink); letter-spacing: -.02em; margin-bottom: 6px;
  }
  .vs-success-count {
    font: 700 14px/1.3 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: var(--ens-go, var(--grd)); margin-bottom: 22px;
  }
  .vs-success-bar {
    width: 100%; max-width: 320px; height: 8px; background: var(--bo);
    border-radius: 99px; overflow: hidden; margin-bottom: 10px;
  }
  .vs-success-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, var(--ens-go, #18a558), var(--ens-go-lt, #34d27b));
    box-shadow: 0 0 10px color-mix(in srgb, var(--ens-go, #18a558) 45%, transparent);
    transition: width .8s .1s cubic-bezier(.2,.7,.3,1);
  }
  .vs-success-meta {
    font: 600 13px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: var(--ink); margin-bottom: 6px;
  }
  .vs-success-meta b { font-weight: 800; color: var(--ens-go, var(--adk)); }
  .vs-success-note {
    font: 500 13px/1.45 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: var(--mu2); margin-bottom: 28px;
  }
  /* CTA retour arcade */
  .vs-success-done {
    width: 100%; max-width: 320px; min-height: 52px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    border: 0; border-radius: var(--ens-r, 16px);
    background: linear-gradient(180deg, var(--ens-go-lt, #34d27b), var(--ens-go, #18a558));
    color: var(--ens-ink-go, #07150c);
    font: 700 15px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; cursor: pointer;
    box-shadow: 0 4px 0 color-mix(in srgb, var(--ens-go, #18a558) 60%, #000);
    transition: transform .1s ease, box-shadow .1s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .vs-success-done:active { transform: translateY(3px); box-shadow: 0 1px 0 color-mix(in srgb, var(--ens-go, #18a558) 60%, #000); }
  .vs-success-done:focus-visible { outline: 3px solid var(--ens-go, var(--a)); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    .vs-success-check { animation: none; }
    .vs-success-fill { transition: none; }
    .vs-success-done { transition: none; }
  }

  /* ── Carte « Envoie une révision ciblée » (sur l'écran de succès) ── */
  .vs-revsugg {
    width: 100%; max-width: 360px; margin: 4px 0 18px;
    text-align: left;
    background: var(--su); border: 1.5px solid var(--bo);
    border-radius: var(--ens-r, 16px); padding: 16px 16px 14px;
    box-shadow: var(--ens-shadow, 0 8px 22px -12px rgba(15,23,42,.22));
  }
  .vs-revsugg-h {
    font: 700 15px/1.2 var(--ens-display, 'Fredoka'), sans-serif;
    color: var(--ink); letter-spacing: -.01em; margin: 0;
  }
  .vs-revsugg-sub {
    font: 500 12px/1.4 var(--ens-body, 'Inter'), sans-serif;
    color: var(--mu); margin: 3px 0 12px;
  }
  .vs-revsugg-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .vs-revsugg-chip {
    display: flex; align-items: center; gap: 11px; width: 100%;
    padding: 11px 12px; min-height: 52px;
    background: var(--bg, #f4f6fb); border: 1.5px solid var(--bo);
    border-radius: 13px; cursor: pointer; text-align: left;
    font-family: inherit; -webkit-tap-highlight-color: transparent;
    transition: border-color .12s, background .12s;
  }
  .vs-revsugg-chip[aria-pressed="true"] {
    border-color: var(--ens-go, #18a558);
    background: color-mix(in srgb, var(--ens-go, #18a558) 8%, var(--su));
  }
  .vs-revsugg-check {
    width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0;
    border: 2px solid var(--bo4, #cbd5e1); background: var(--su);
    display: flex; align-items: center; justify-content: center; color: #fff;
    transition: background .12s, border-color .12s;
  }
  .vs-revsugg-chip[aria-pressed="true"] .vs-revsugg-check {
    background: var(--ens-go, #18a558); border-color: var(--ens-go, #18a558);
  }
  .vs-revsugg-check svg { opacity: 0; transition: opacity .12s; }
  .vs-revsugg-chip[aria-pressed="true"] .vs-revsugg-check svg { opacity: 1; }
  .vs-revsugg-txt { flex: 1; min-width: 0; }
  .vs-revsugg-nom {
    display: block; font: 600 13.5px/1.25 var(--ens-body, 'Inter'), sans-serif;
    color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vs-revsugg-tag {
    display: inline-block; margin-top: 3px;
    font: 700 10px/1 var(--ens-body, 'Inter'), sans-serif;
    text-transform: uppercase; letter-spacing: .04em;
  }
  .vs-revsugg-tag.t-now  { color: var(--ens-go, #18a558); }
  .vs-revsugg-tag.t-back { color: var(--ens-blue-lt, #3b82f6); }
  .vs-revsugg-tag.t-next { color: var(--am-txt, #935e06); }
  .vs-revsugg-send {
    width: 100%; min-height: 48px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    border: 0; border-radius: var(--ens-r, 14px);
    background: linear-gradient(180deg, var(--ens-go-lt, #34d27b), var(--ens-go, #18a558));
    color: var(--ens-ink-go, #07150c);
    font: 700 14.5px/1 var(--ens-body, 'Inter'), sans-serif; cursor: pointer;
    box-shadow: 0 4px 0 color-mix(in srgb, var(--ens-go, #18a558) 60%, #000);
    transition: transform .1s ease, box-shadow .1s ease, opacity .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .vs-revsugg-send:active { transform: translateY(3px); box-shadow: 0 1px 0 color-mix(in srgb, var(--ens-go, #18a558) 60%, #000); }
  .vs-revsugg-send:disabled { opacity: .5; cursor: default; box-shadow: none; transform: none; }
  .vs-revsugg-skip {
    display: block; width: 100%; margin-top: 9px; padding: 6px;
    background: none; border: 0; cursor: pointer;
    font: 600 12.5px/1 var(--ens-body, 'Inter'), sans-serif; color: var(--mu);
  }
  .vs-revsugg.is-sent { text-align: center; }
  .vs-revsugg-sent-msg {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    font: 600 13.5px/1.4 var(--ens-body, 'Inter'), sans-serif; color: var(--ens-go, #18a558);
  }
  .vs-revsugg-sent-msg .pg-med { filter: drop-shadow(0 3px 8px rgba(63,158,0,.3)); }
  @media (prefers-reduced-motion: reduce) { .vs-revsugg-send { transition: none; } }
</style>`;

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  _eleve = null;
  _acquisSet = new Set();
  _picked = new Map();
  _note = "";
  _query = "";
  _submitting = false;
  _eleveDDOpen = false;
  // Figé au mount : render() re-tourne à chaque interaction, le hint ne doit
  // pas disparaître au premier tap.
  _showSub = shouldShowHint("validation-sub");
  if (_showSub) markHintSeen("validation-sub");

  track("page_view", { page: "valider_seance", user_role: _me.role });

  root.innerHTML = `${STYLE}
    <div class="vs anim-slide-up">
      <div class="vs-hd">
        <div class="vs-hd-inner">
          <button class="vs-back" id="vs-back" aria-label="Retour">${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}</button>
          <div class="vs-hd-text">
            <h1 class="vs-h1">Valider une séance</h1>
            <p class="vs-sub">Chargement…</p>
          </div>
          <div class="vs-hd-illus">${medallion("crayon", "indigo", { size: 48, glow: true })}</div>
        </div>
      </div>
      <div class="vs-skel"></div><div class="vs-skel"></div><div class="vs-skel"></div>
    </div>`;
  root.querySelector("#vs-back")?.addEventListener("click", goBack);

  // Élèves attitrés du moniteur
  const { data, error } = await sb
    .from("profiles")
    .select("id, prenom, nom, avatar_url")
    .eq("role", "eleve")
    .eq("enseignant_id", _me.id)
    .order("prenom", { ascending: true });

  if (error) {
    toast("Impossible de charger tes élèves", "error");
    _eleves = [];
  } else {
    _eleves = data || [];
  }

  // Pré-sélection via #/log-session?eleveId=...
  const hash = window.location.hash;
  const qi = hash.indexOf("?");
  const preId =
    qi >= 0 ? new URLSearchParams(hash.slice(qi + 1)).get("eleveId") : null;
  if (preId && _eleves.find((e) => e.id === preId)) {
    await selectEleve(preId, false);
  }

  render();
}

function goBack() {
  navigate("#/eleves");
}

// ─── Sélection élève ─────────────────────────────────────────────
async function selectEleve(id, doRender = true) {
  _eleve = id;
  _picked = new Map();
  _acquisSet = new Set();
  try {
    const { data, error } = await sb
      .from("validations")
      .select("competence_id, statut")
      .eq("eleve_id", id)
      .eq("statut", "acquis");
    if (error) throw error;
    _acquisSet = new Set((data || []).map((v) => v.competence_id));
  } catch (e) {
    console.error("[valider-seance] fetch validations", e);
  }
  _eleveDDOpen = false;
  if (doRender) {
    render();
    // L'UI complète (mondes, chips, footer) vient d'apparaître : bon moment
    // pour le tour de première séance.
    maybeStartValidationTour();
  }
}

// ─── Render ──────────────────────────────────────────────────────
function eleveById(id) {
  return _eleves.find((e) => e.id === id) || null;
}

function render() {
  const el = eleveById(_eleve);
  _root.innerHTML = `${STYLE}
    <div class="vs anim-slide-up">
      <div class="vs-hd">
        <div class="vs-hd-inner">
          <button class="vs-back" id="vs-back" aria-label="Retour">${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}</button>
          <div class="vs-hd-text">
            <h1 class="vs-h1">Valider une séance</h1>
            ${_showSub ? `<p class="vs-sub">Choisis l'élève, puis coche Acquis / En cours / À revoir pour chaque compétence travaillée.</p>` : ""}
          </div>
          <div class="vs-hd-illus">${medallion("crayon", "indigo", { size: 48, glow: true })}</div>
        </div>
      </div>
      ${renderEleveDropdown()}
      ${el ? renderComps() + renderNote() : ""}
    </div>
    ${el ? renderFooter() : ""}`;
  wire();
}

function renderEleveDropdown() {
  const el = eleveById(_eleve);
  const open = _eleveDDOpen || !el;
  const list = _query
    ? _eleves.filter((e) =>
        `${e.prenom || ""} ${e.nom || ""}`
          .toLowerCase()
          .includes(_query.toLowerCase()),
      )
    : _eleves;

  const trigger = el
    ? `<span class="vs-dd-av">${renderUserAvatar({ avatar_url: el.avatar_url, prenom: el.prenom, nom: el.nom }, 34)}</span>
       <span class="vs-dd-txt"><span class="vs-dd-name">${esc(fmtName(`${el.prenom || ""} ${el.nom || ""}`))}</span><span class="vs-dd-sub">${_acquisSet.size}/${REMC_TOTAL} acquises</span></span>`
    : `<span class="vs-dd-txt"><span class="vs-dd-name vs-dd-ph">Choisir un élève…</span></span>`;

  const search =
    _eleves.length > 6
      ? `<div class="vs-dd-search"><span class="vs-search-ico">${icon("search", { size: 14, strokeWidth: 2.2 })}</span>
         <input class="vs-search" id="vs-dd-search" type="search" placeholder="Chercher…" value="${esc(_query)}" autocomplete="off" aria-label="Chercher un élève"></div>`
      : "";

  const opts =
    list.length === 0
      ? `<div class="vs-empty">${_eleves.length === 0 ? "Aucun élève attitré pour l'instant." : "Aucun résultat pour cette recherche."}</div>`
      : list
          .map((e, i) => {
            const sel = e.id === _eleve;
            return `<button class="vs-dd-opt${sel ? " sel" : ""}" type="button" role="option" aria-selected="${sel}" data-eleve="${esc(e.id)}" style="animation-delay:${Math.min(i, 8) * 28}ms">
              <span class="vs-dd-av">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 32)}</span>
              <span class="vs-dd-name">${esc(fmtName(`${e.prenom || ""} ${e.nom || ""}`))}</span>
              ${sel ? `<span class="vs-dd-check">${icon("check", { size: 15, strokeWidth: 2.8 })}</span>` : ""}
            </button>`;
          })
          .join("");

  return `
    ${open ? `<div class="vs-dd-backdrop" id="vs-dd-backdrop"></div>` : ""}
    <div class="vs-dd${open ? " open" : ""}">
      <button class="vs-dd-trigger" id="vs-dd-trigger" type="button" aria-expanded="${open}" aria-haspopup="listbox">
        <span class="vs-dd-cur">${trigger}</span>
        <span class="vs-dd-chev">${icon("chevron-down", { size: 18, strokeWidth: 2.4 })}</span>
      </button>
      <div class="vs-dd-panel">${search}<div class="vs-dd-list"${list.length ? ' role="listbox" aria-label="Choisir un élève"' : ""}>${opts}</div></div>
    </div>`;
}

// Marques manuscrites par statut (coche / tiret / croix)
const VSC_MK = {
  acquis: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  en_cours: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`,
  a_retravailler: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
};
// Les 3 colonnes de la grille (ordre = Acquis, En cours, À revoir)
const VSC_COLS = [
  { st: "acquis", cls: "c-acq", lbl: "Acquis" },
  { st: "en_cours", cls: "c-enc", lbl: "En cours" },
  { st: "a_retravailler", cls: "c-rev", lbl: "À revoir" },
];

// Progression d'une catégorie dans le livret (acquises + posées cette séance)
function catProgress(cat) {
  const acquis = cat.subs.filter((s) => _acquisSet.has(s.c)).length;
  const picked = cat.subs.filter((s) => _picked.has(s.c) && !_acquisSet.has(s.c)).length;
  const evald = acquis + picked;
  return { evald, total: cat.subs.length, pct: Math.round((evald / cat.subs.length) * 100) };
}

// Synthèse de CETTE séance (uniquement ce que le moniteur pose maintenant)
function sessionCounts() {
  let acquis = 0, en_cours = 0, a_retravailler = 0;
  for (const st of _picked.values()) {
    if (st === "acquis") acquis++;
    else if (st === "en_cours") en_cours++;
    else if (st === "a_retravailler") a_retravailler++;
  }
  return { acquis, en_cours, a_retravailler, total: acquis + en_cours + a_retravailler };
}

function renderBox(compId, col, current, locked) {
  const on = current === col.st;
  return `<button class="vsc-box ${col.cls}${on ? " on" : ""}" type="button"${locked ? " disabled aria-disabled=\"true\"" : ""}
    data-comp="${esc(compId)}" data-st="${col.st}" aria-label="${esc(compId)} — ${esc(col.lbl)}" aria-pressed="${on}">
    <span class="bx"><span class="mk">${VSC_MK[col.st]}</span></span></button>`;
}

function renderComps() {
  const el = eleveById(_eleve);
  const dateFr = new Date()
    .toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, ".");
  const moniteurNom =
    fmtName(`${_me.prenom || ""} ${_me.nom || ""}`.trim()) || "Moniteur";
  const eleveNom = el ? fmtName(`${el.prenom || ""} ${el.nom || ""}`.trim()) : "";

  const cats = REMC.map((cat) => {
    const p = catProgress(cat);
    const rows = cat.subs
      .map((s) => {
        const locked = _acquisSet.has(s.c);
        const current = locked ? "acquis" : _picked.get(s.c) || null;
        const done = !!current;
        const sCls =
          current === "acquis" ? " s-acq"
          : current === "en_cours" ? " s-enc"
          : current === "a_retravailler" ? " s-rev" : "";
        const boxes = VSC_COLS.map((col) => renderBox(s.c, col, current, locked)).join("");
        return `<div class="vsc-row${done ? " done" : ""}${sCls}${locked ? " locked" : ""}" data-comp="${esc(s.c)}">
          <div class="vsc-label"><span class="vsc-code">${esc(s.c)}</span><span class="vsc-lbl">${esc(s.n)}</span></div>
          ${boxes}
        </div>`;
      })
      .join("");
    return `
      <div class="vsc-cat-head" data-cat="${esc(cat.id)}">
        <span class="vsc-cno">${esc(cat.id)}</span>
        <span class="vsc-cname">${esc(cat.name)}</span>
        <span class="vsc-cbar"><i style="width:${p.pct}%"></i></span>
        <span class="vsc-ccount"><b>${p.evald}</b>/${p.total}</span>
      </div>
      <div class="vsc-colhead"><div></div><div class="vsc-ch acq">Acquis</div><div class="vsc-ch enc">En cours</div><div class="vsc-ch rev">À revoir</div></div>
      ${rows}`;
  }).join("");

  const c = sessionCounts();
  return `
    <div class="vsc">
      <div class="vsc-head">
        <div class="vsc-head-row"><span class="vsc-doc-title">Fiche de séance</span><span class="vsc-doc-date">${esc(dateFr)}</span></div>
        <div class="vsc-head-meta">
          ${el ? `<span class="vsc-meta"><span class="vsc-av">${renderUserAvatar({ avatar_url: el.avatar_url, prenom: el.prenom, nom: el.nom }, 24)}</span><b>${esc(eleveNom)}</b></span>` : ""}
          <span class="vsc-meta"><i>Moniteur</i> <b>${esc(moniteurNom)}</b></span>
        </div>
      </div>
      ${cats}
      <div class="vsc-foot" id="vsc-foot">
        <div class="m acq"><span class="n" data-k="acq">${c.acquis}</span><span class="k">Acquis</span></div>
        <div class="m enc"><span class="n" data-k="enc">${c.en_cours}</span><span class="k">En cours</span></div>
        <div class="m rev"><span class="n" data-k="rev">${c.a_retravailler}</span><span class="k">À revoir</span></div>
        <div class="m tot"><span class="n" data-k="tot">${c.total}</span><span class="k">Évaluées</span></div>
      </div>
    </div>`;
}

function renderNote() {
  return `
    <div class="vs-card">
      <div class="vs-card-ttl">${icon("edit-3", { size: 13, strokeWidth: 2.4 })} Observations (optionnel)</div>
      <textarea class="vs-note" id="vs-note" maxlength="${MAX_NOTE}" placeholder="Ce que tu as observé, les points à retravailler…" aria-label="Observations de séance">${esc(_note)}</textarea>
      <div class="vs-note-count" id="vs-note-count">${_note.length}/${MAX_NOTE}</div>
    </div>`;
}

function pickedCounts() {
  let acquis = 0,
    other = 0;
  for (const s of _picked.values()) s === "acquis" ? acquis++ : other++;
  return { acquis, other, total: acquis + other };
}

function renderFooter() {
  const { acquis, total } = pickedCounts();
  const lbl =
    acquis > 0
      ? `Valider · ${acquis} compétence${acquis > 1 ? "s" : ""}`
      : `Enregistrer la séance`;
  return `<div class="vs-footer">
    <button class="vs-submit" id="vs-submit" type="button">${icon("check", { size: 18, strokeWidth: 2.6 })} <span id="vs-submit-lbl">${esc(lbl)}</span></button>
  </div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function updateCounts() {
  // Bandes de catégorie (barre + compteur)
  REMC.forEach((cat) => {
    const head = _root.querySelector(`.vsc-cat-head[data-cat="${cat.id}"]`);
    if (!head) return;
    const p = catProgress(cat);
    const b = head.querySelector(".vsc-ccount b");
    if (b) b.textContent = p.evald;
    const bar = head.querySelector(".vsc-cbar i");
    if (bar) bar.style.width = `${p.pct}%`;
  });
  // Pied de tableau : synthèse de la séance
  const foot = _root.querySelector("#vsc-foot");
  if (foot) {
    const c = sessionCounts();
    const set = (k, v) => {
      const n = foot.querySelector(`[data-k="${k}"]`);
      if (n) n.textContent = v;
    };
    set("acq", c.acquis);
    set("enc", c.en_cours);
    set("rev", c.a_retravailler);
    set("tot", c.total);
  }
  // Bouton de validation
  const lbl = _root.querySelector("#vs-submit-lbl");
  if (lbl) {
    const { acquis } = pickedCounts();
    lbl.textContent =
      acquis > 0
        ? `Valider · ${acquis} compétence${acquis > 1 ? "s" : ""}`
        : "Enregistrer la séance";
  }
}

function wire() {
  _root.querySelector("#vs-back")?.addEventListener("click", goBack);

  // ── Dropdown élève ──
  _root.querySelector("#vs-dd-trigger")?.addEventListener("click", () => {
    _eleveDDOpen = !_eleveDDOpen;
    render();
  });
  _root.querySelector("#vs-dd-backdrop")?.addEventListener("click", () => {
    if (_eleve) {
      _eleveDDOpen = false;
      render();
    }
  });
  _root.querySelector("#vs-dd-search")?.addEventListener("input", (e) => {
    _query = e.target.value;
    render();
    const s = _root.querySelector("#vs-dd-search");
    if (s) {
      s.focus();
      s.setSelectionRange(s.value.length, s.value.length);
    }
  });
  _root.querySelectorAll(".vs-dd-opt[data-eleve]").forEach((opt) => {
    opt.addEventListener("click", () => {
      _query = "";
      haptic("select");
      selectEleve(opt.dataset.eleve); // remet _eleveDDOpen=false + render
    });
  });

  // ── Cases carnet : une case cochée par ligne (radio de statut) ──
  _root.querySelector(".vsc")?.addEventListener("click", (e) => {
    const box = e.target.closest(".vsc-box[data-comp]");
    if (!box || box.disabled) return;
    const id = box.dataset.comp;
    const st = box.dataset.st;
    const cur = _picked.get(id) || null;
    const next = cur === st ? null : st; // re-clic sur la case active = décoche
    if (next === null) _picked.delete(id);
    else _picked.set(id, next);
    // haptic métier : validate pour acquis, select pour autre, tap pour reset
    haptic(next === "acquis" ? "validate" : next ? "select" : "tap");
    // Maj en place de la ligne (pas de full re-render)
    const row = box.closest(".vsc-row");
    row.querySelectorAll(".vsc-box").forEach((b) => {
      const on = _picked.get(id) === b.dataset.st;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    row.classList.remove("done", "s-acq", "s-enc", "s-rev");
    if (next)
      row.classList.add(
        "done",
        next === "acquis" ? "s-acq" : next === "en_cours" ? "s-enc" : "s-rev",
      );
    updateCounts();
  });

  // ── Note ──
  const ta = _root.querySelector("#vs-note");
  ta?.addEventListener("input", () => {
    _note = ta.value;
    const c = _root.querySelector("#vs-note-count");
    if (c) c.textContent = `${_note.length}/${MAX_NOTE}`;
  });

  // ── Submit ──
  _root.querySelector("#vs-submit")?.addEventListener("click", submit);
}

// ─── Submit ──────────────────────────────────────────────────────
async function submit() {
  if (!_eleve || _submitting) return;
  _submitting = true;
  const btn = _root.querySelector("#vs-submit");
  if (btn) {
    btn.disabled = true;
    btn.querySelector("#vs-submit-lbl").textContent = "Enregistrement…";
  }

  const acquis = [],
    enCours = [],
    aRetravailler = [];
  for (const [id, st] of _picked) {
    if (st === "acquis") acquis.push(id);
    else if (st === "en_cours") enCours.push(id);
    else if (st === "a_retravailler") aRetravailler.push(id);
  }

  // ── Compte-rendu construit AVANT la RPC : il part AUTOMATIQUEMENT dans
  // l'appli de l'élève (validate_session le stocke + le notifie côté serveur).
  // Plus de bouton « Envoyer » manuel — la preuve arrive toute seule.
  const _el = _eleves.find((e) => e.id === _eleve);
  const _prenom = _el?.prenom ? fmtName(_el.prenom) : "Ton élève";
  const _me = getCurUser();
  // nNew côté client = mêmes acquis que le serveur (statut ≠ 'acquis' avant).
  const _newAcquis = acquis.filter((c) => !_acquisSet.has(c)).length;
  const _totalAcquis = _acquisSet.size + _newAcquis;
  const _pct =
    REMC_TOTAL > 0 ? Math.round((_totalAcquis / REMC_TOTAL) * 100) : 0;
  const _acquisNames = acquis.map((c) => labelComp(c)).filter(Boolean);
  const _suggestions = buildRevisionSuggestions(acquis);
  const _crPoint =
    (_suggestions.find((s) => !_acquisNames.includes(s.nom)) || {}).nom || null;
  const crText = buildCompteRenduText(
    _prenom,
    _acquisNames,
    _totalAcquis,
    _pct,
    _crPoint,
    _me?.nom,
  );

  try {
    const { data, error } = await sb.rpc("validate_session", {
      p_eleve_id: _eleve,
      p_session_date: todayIso(),
      p_note: _note.trim() || null,
      p_acquis: acquis.length ? acquis : null,
      p_en_cours: enCours.length ? enCours : null,
      p_a_retravailler: aRetravailler.length ? aRetravailler : null,
      p_compte_rendu: crText,
    });
    if (error || data?.error) {
      console.error("[valider-seance] rpc error", error || data?.error);
      toast("Erreur lors de l'enregistrement", "error");
      _submitting = false;
      if (btn) {
        btn.disabled = false;
        btn.querySelector("#vs-submit-lbl").textContent = "Réessayer";
      }
      return;
    }

    track("session.validated", {
      eleve_id: _eleve,
      n_acquis: acquis.length,
      n_en_cours: enCours.length,
      n_a_retravailler: aRetravailler.length,
      has_note: !!_note.trim(),
    });

    // haptic confirm : leçon enregistrée/confirmée (pattern double-appui satisfaisant)
    haptic("confirm");
    const nNew = data?.n_acquis_new ?? acquis.length;
    // Acquis = moment de valeur : on PROUVE l'avancée avant de quitter.
    if (nNew > 0) {
      const totalAcquis = _acquisSet.size + nNew;
      showSessionSuccess(_prenom, nNew, totalAcquis, acquis, crText);
      // Palier moniteur (parcours-pro) + install nudge (différé après l'écran
      // palier s'il s'affiche, pour ne pas empiler deux overlays).
      _maybeCelebrateMoniteurTier();
    } else {
      // Séance sans nouvel acquis (ex. seulement « à retravailler ») : le
      // compte-rendu est tout de même parti dans l'appli de l'élève.
      toast(`Compte-rendu envoyé à ${_prenom}`, "success");
      navigate("#/eleves");
    }
  } catch (e) {
    console.error("[valider-seance] submit crash", e);
    toast("Erreur réseau", "error");
    _submitting = false;
    if (btn) {
      btn.disabled = false;
      btn.querySelector("#vs-submit-lbl").textContent = "Réessayer";
    }
  }
}

// Palier moniteur : si les validations cumulées franchissent un seuil, écran
// plein écran « Palier atteint » (parcours-pro). Idempotent (ledger localStorage).
async function _maybeCelebrateMoniteurTier() {
  const me = getCurUser();
  if (!me?.id) return;
  try {
    const { count } = await sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", me.id);
    if (typeof count === "number") {
      const { maybeCelebrateTier } =
        await import("@/services/moniteur-tier-celebration.js");
      await maybeCelebrateTier(count, { onCta: () => navigate("#/parcours") });
    }
  } catch (e) {
    console.warn("[valider-seance] tier celebrate failed", e);
  }
  promptInstallAtValueMoment(me, "moniteur_session_validee");
}

// ── Suggestion de révision après validation (ferme la boucle du wedge) ──
// Liste plate ORDONNÉE des compétences REMC → permet « précédentes / suivante ».
const ALL_SUBS = REMC.flatMap((c) => c.subs); // [{ c, n }]
const REVSUGG_TAG = {
  now: "Validé aujourd'hui",
  back: "À renforcer",
  next: "À préparer",
};

// À partir des compétences passées « acquis » cette séance, propose un petit set
// à faire réviser : celles du jour (cochées), 1-2 d'avant (renfort), la suivante.
// Ne garde que les compétences ayant une fiche de révision.
function buildRevisionSuggestions(validatedCodes) {
  const idxOf = (code) => ALL_SUBS.findIndex((s) => s.c === code);
  const valid = (validatedCodes || []).filter((c) => idxOf(c) >= 0);
  if (!valid.length) return [];
  const anchorIdx = Math.max(...valid.map(idxOf)); // la plus avancée
  const picked = new Map(); // idx → { tag, checked }
  // 1) validées aujourd'hui → cochées par défaut (consolidation à chaud)
  for (const c of valid) picked.set(idxOf(c), { tag: "now", checked: true });
  // 2) les 2 compétences juste avant l'ancre, déjà acquises → renfort
  for (let i = anchorIdx - 1; i >= 0 && i >= anchorIdx - 2; i--) {
    if (!picked.has(i) && _acquisSet.has(ALL_SUBS[i].c))
      picked.set(i, { tag: "back", checked: false });
  }
  // 3) la 1re compétence suivante non encore acquise → préparer la prochaine leçon
  for (let i = anchorIdx + 1; i < ALL_SUBS.length; i++) {
    if (!_acquisSet.has(ALL_SUBS[i].c) && !valid.includes(ALL_SUBS[i].c)) {
      picked.set(i, { tag: "next", checked: false });
      break;
    }
  }
  return [...picked.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([idx, m]) => ({ code: ALL_SUBS[idx].c, nom: ALL_SUBS[idx].n, ...m }))
    .filter((s) => getFiche(s.code));
}

// Insère les révisions ciblées (l'élève les voit dans #/revision-conduite).
async function sendTargetedRevisions(codes) {
  const me = getCurUser();
  if (!me?.id || !_eleve || !codes.length) return false;
  try {
    const { error } = await sb.from("revision_focus").insert(
      codes.map((code) => ({
        eleve_id: _eleve,
        moniteur_id: me.id,
        competence_code: code,
        note: null,
      })),
    );
    if (error) throw error;
    track("revision_focus_from_validation", { n: codes.length, codes });
    return true;
  } catch (e) {
    console.error("[revsugg] insert", e);
    return false;
  }
}

// ── Compte-rendu de leçon (⭐) : texte partageable, preuve à la marque du
// moniteur, reçue par l'élève (et lue par ses parents). Cadré « validation »
// (jamais de date de prochaine leçon — charte : pas de planning).
function buildCompteRenduText(
  prenom,
  acquisNames,
  totalAcquis,
  pct,
  point,
  monNom,
) {
  const lines = [`Compte-rendu de la leçon — ${prenom}`, ""];
  if (acquisNames.length) {
    lines.push("Validé aujourd'hui :");
    acquisNames.forEach((n) => lines.push("• " + n));
    lines.push("");
  }
  lines.push(
    `Progression : ${totalAcquis}/${REMC_TOTAL} compétences (${pct}%)`,
  );
  if (point) lines.push(`À revoir avant la prochaine validation : ${point}`);
  lines.push("");
  lines.push(
    `Bravo, continue comme ça ! — ${fmtName(monNom || "ton moniteur")}`,
  );
  return lines.join("\n");
}

async function sendCompteRendu(text) {
  track("compte_rendu.send");
  if (navigator.share) {
    try {
      await navigator.share({ title: "Compte-rendu PermiGo", text });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return; // annulé par le moniteur
    }
  }
  // Fallback (desktop / pas de Web Share) : WhatsApp en mode composition.
  // Aucun numéro d'élève n'est stocké (charte) → le moniteur choisit le contact.
  try {
    await navigator.clipboard.writeText(text);
    toast("Compte-rendu copié — colle-le à ton élève", "info");
  } catch {
    /* clipboard indispo */
  }
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
}

// Écran succès arcade : referme la boucle « je valide → l'élève avance → il le voit ».
function showSessionSuccess(prenom, nNew, totalAcquis, validatedCodes, crText) {
  // Ferme un tour guidé 1re-visite qui aurait pu s'afficher pendant la RPC
  document.querySelector(".gt-root")?.remove();

  const pct = REMC_TOTAL > 0 ? Math.round((totalAcquis / REMC_TOTAL) * 100) : 0;
  const complete = totalAcquis >= REMC_TOTAL;
  const suggestions = buildRevisionSuggestions(validatedCodes);

  // ── Compte-rendu de leçon (⭐) : la preuve à envoyer à l'élève / parent.
  const me = getCurUser();
  const acquisNames = (validatedCodes || [])
    .map((c) => labelComp(c))
    .filter(Boolean);
  // Point à bosser = une compétence suggérée NON validée aujourd'hui (sinon on
  // afficherait « à revoir » sur ce qu'on vient juste de valider — redondant).
  const crPoint =
    (suggestions.find((s) => !acquisNames.includes(s.nom)) || {}).nom || null;
  // Le texte est déjà construit dans submit() et envoyé à l'élève via la RPC.
  // On le réutilise ici pour le partage WhatsApp/SMS optionnel (fallback : on
  // le reconstruit si jamais l'appelant ne l'a pas passé).
  crText =
    crText ||
    buildCompteRenduText(
      prenom,
      acquisNames,
      totalAcquis,
      pct,
      crPoint,
      me?.nom,
    );
  const crCard = `
    <style>
      .vs-cr { margin: 14px 0 0; text-align: left; background: #fff; border: 1px solid #e6e9ef; border-radius: 16px; padding: 14px 15px; box-shadow: 0 8px 22px -12px rgba(60,50,130,.35); }
      .vs-cr-head { display: flex; align-items: center; gap: 11px; margin-bottom: 12px; }
      .vs-cr-ico { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: flex; align-items: center; justify-content: center; color: #fff; background: linear-gradient(135deg, #4f46e5, #7c4dff); box-shadow: 0 6px 14px -6px rgba(79,70,229,.6); }
      .vs-cr-title { font: 800 15px/1.15 'Manrope', 'Plus Jakarta Sans', sans-serif; color: #1a1c2e; }
      .vs-cr-sub { font: 600 11.5px/1.3 'Inter', sans-serif; color: #5a6188; margin-top: 2px; }
      .vs-cr-body { display: flex; flex-direction: column; gap: 6px; padding: 11px 12px; background: #f7f8fc; border-radius: 12px; margin-bottom: 12px; }
      .vs-cr-line { display: flex; align-items: center; gap: 8px; font: 600 13px/1.3 'Inter', sans-serif; color: #2d3050; }
      .vs-cr-line > svg { flex-shrink: 0; }
      .vs-cr-line.ok > svg { color: #16a34a; }
      .vs-cr-line.work { color: #b45309; }
      .vs-cr-line.work > svg { color: #b45309; }
      .vs-cr-prog { margin-top: 3px; font: 600 12px/1.3 'Inter', sans-serif; color: #5a6188; }
      .vs-cr-prog b { color: #4f46e5; font-weight: 800; }
      .vs-cr-sent { width: 100%; min-height: 46px; border-radius: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; color: #15803d; background: #ecfdf3; border: 1px solid #bbf7d0; font: 800 13.5px/1.2 'Inter', sans-serif; text-align: center; }
      .vs-cr-share { width: 100%; margin-top: 8px; min-height: 42px; border: 1px solid #e6e9ef; border-radius: 12px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 7px; color: #4f46e5; font: 700 12.5px/1 'Inter', sans-serif; background: #fff; transition: background .12s; }
      .vs-cr-share:active { background: #f7f8fc; }
    </style>
    <section class="vs-cr">
      <div class="vs-cr-head">
        <div class="vs-cr-ico">${icon("file-text", { size: 18, strokeWidth: 2.2 })}</div>
        <div>
          <div class="vs-cr-title">Compte-rendu envoyé</div>
          <div class="vs-cr-sub">Reçu par ${esc(prenom)} dans son appli — il le voit tout de suite</div>
        </div>
      </div>
      <div class="vs-cr-body">
        ${
          acquisNames.length
            ? acquisNames
                .slice(0, 4)
                .map(
                  (n) =>
                    `<div class="vs-cr-line ok">${icon("check", { size: 14, strokeWidth: 3 })}<span>${esc(n)}</span></div>`,
                )
                .join("")
            : `<div class="vs-cr-line"><span>Progression mise à jour</span></div>`
        }
        ${crPoint ? `<div class="vs-cr-line work">${icon("target", { size: 13, strokeWidth: 2.4 })}<span>À revoir : ${esc(crPoint)}</span></div>` : ""}
        <div class="vs-cr-prog">Progression : <b>${totalAcquis}/${REMC_TOTAL}</b> · ${pct}%</div>
      </div>
      <div class="vs-cr-sent">${icon("check-circle", { size: 15, strokeWidth: 2.4 })} Envoyé automatiquement à ${esc(prenom)}</div>
      <button class="vs-cr-share" id="vs-cr-share" type="button">${icon("share", { size: 14, strokeWidth: 2.2 })} Partager aussi (WhatsApp, parents…)</button>
    </section>`;

  const revCard = suggestions.length
    ? `<section class="vs-revsugg" id="vs-revsugg">
        <div class="vs-revsugg-h">Envoie une révision à ${esc(prenom)}</div>
        <div class="vs-revsugg-sub">3 questions ciblées, à réviser entre deux leçons.</div>
        <div class="vs-revsugg-list">
          ${suggestions
            .map(
              (
                s,
              ) => `<button type="button" class="vs-revsugg-chip" data-code="${esc(s.code)}" aria-pressed="${s.checked}">
            <span class="vs-revsugg-check">${icon("check", { size: 14, strokeWidth: 3, color: "currentColor" })}</span>
            <span class="vs-revsugg-txt">
              <span class="vs-revsugg-nom">${esc(s.nom)}</span>
              <span class="vs-revsugg-tag t-${s.tag}">${REVSUGG_TAG[s.tag]}</span>
            </span>
          </button>`,
            )
            .join("")}
        </div>
        <button type="button" class="vs-revsugg-send" id="vs-revsugg-send">${icon("send", { size: 15, strokeWidth: 2.2 })} <span id="vs-revsugg-send-lbl">Envoyer la révision</span></button>
        <button type="button" class="vs-revsugg-skip" id="vs-revsugg-skip">Plus tard</button>
      </section>`
    : "";

  _root.innerHTML = `${STYLE}
    <div class="vs anim-slide-up">
      <div class="vs-success">
        <div class="vs-success-check">${medallion("trophee", "gold", { size: 64, glow: true })}</div>
        <span class="vs-success-badge">${icon("check-circle", { size: 14, strokeWidth: 2.2 })} Séance enregistrée</span>
        <div class="vs-success-title">${complete ? `${esc(prenom)} a tout validé` : `${esc(prenom)} a progressé`}</div>
        <div class="vs-success-count">${nNew} compétence${nNew > 1 ? "s" : ""} validée${nNew > 1 ? "s" : ""} aujourd'hui</div>
        <div class="vs-success-bar"><div class="vs-success-fill" style="width:0%"></div></div>
        <div class="vs-success-meta"><b>${totalAcquis}/${REMC_TOTAL}</b> compétences validées · ${pct}%</div>
        <div class="vs-success-note">${complete ? `${esc(prenom)} est prêt·e pour l'examen.` : `${esc(prenom)} voit sa progression dans son appli.`}</div>
        ${crCard}
        ${revCard}
        <button class="vs-success-done" id="vs-success-done" type="button">${icon("users", { size: 16, strokeWidth: 2.2 })} Voir mes élèves</button>
      </div>
    </div>`;

  const fill = _root.querySelector(".vs-success-fill");
  requestAnimationFrame(() => {
    if (fill) fill.style.width = pct + "%";
  });

  _root
    .querySelector("#vs-success-done")
    ?.addEventListener("click", () => navigate("#/eleves"));

  // Partage optionnel (WhatsApp/SMS) : l'envoi in-app est déjà parti tout
  // seul, ceci sert juste à doubler pour les parents si le moniteur le veut.
  _root.querySelector("#vs-cr-share")?.addEventListener("click", () => {
    haptic("tap");
    sendCompteRendu(crText);
  });

  wireRevisionCard();
}

// Câblage de la carte « Envoie une révision » (chips toggle + envoi).
function wireRevisionCard() {
  const card = _root.querySelector("#vs-revsugg");
  if (!card) return;
  const sendBtn = card.querySelector("#vs-revsugg-send");
  const sendLbl = card.querySelector("#vs-revsugg-send-lbl");

  const selectedCodes = () =>
    [...card.querySelectorAll('.vs-revsugg-chip[aria-pressed="true"]')].map(
      (b) => b.dataset.code,
    );
  const refresh = () => {
    const n = selectedCodes().length;
    sendBtn.disabled = n === 0;
    sendLbl.textContent =
      n > 1 ? `Envoyer ${n} révisions` : "Envoyer la révision";
  };

  card.querySelectorAll(".vs-revsugg-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const on = chip.getAttribute("aria-pressed") === "true";
      chip.setAttribute("aria-pressed", on ? "false" : "true");
      haptic("select");
      refresh();
    });
  });

  sendBtn.addEventListener("click", async () => {
    const codes = selectedCodes();
    if (!codes.length) return;
    sendBtn.disabled = true;
    sendLbl.textContent = "Envoi…";
    const ok = await sendTargetedRevisions(codes);
    if (ok) {
      haptic("confirm");
      card.classList.add("is-sent");
      card.innerHTML = `<div class="vs-revsugg-sent-msg">${medallion("check", "green", { size: 40 })}<span>Révision${codes.length > 1 ? "s" : ""} envoyée${codes.length > 1 ? "s" : ""}</span></div>`;
    } else {
      haptic("error");
      toast("Envoi impossible. Réessaie.", "error");
      sendBtn.disabled = false;
      refresh();
    }
  });

  card.querySelector("#vs-revsugg-skip")?.addEventListener("click", () => {
    card.remove();
  });

  refresh();
}
