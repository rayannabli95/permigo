// ═══════════════════════════════════════════════════════════════
// Enseignant — Livret REMC d'un élève
// mount(root, eleveId)
// Affiche les 31 sous-compétences avec leur état, permet de valider
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";
import { icon } from "@/utils/icons.js";
import { STATUT_CFG } from "@/utils/statut-label.js";
import { theoryLeague, computeTheoryScore } from "@/utils/theory-league.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import { mountCiblerRevision } from "@/components/enseignant/cibler-revision.js";
import { mountFlashQuizSend } from "@/components/enseignant/flash-quiz-send.js";
import { illus } from "@/components/enseignant/illus.js";
import { haptic } from "@/utils/haptic.js";
import { medallion, medStatus } from "@/utils/medallions.js";

// Médaillon d'identité par catégorie REMC (en-tête de groupe C1→C4).
const MONDE_MED = {
  C1: ["volant", "indigo"],
  C2: ["route", "blue"],
  C3: ["lune", "orange"],
  C4: ["drapeau", "green"],
};

// Statut technique REMC → clé de pastille standard medStatus (grammaire
// partagée élève ↔ moniteur). « a_valider » et null restent sans médaillon
// (pas d'équivalent dans la grammaire à 4 états).
const STATUT_MED = {
  acquis: "acquis",
  en_cours: "encours",
  a_retravailler: "retravailler",
};

// ─── Couleurs par monde ───────────────────────────────────────────
const MONDE_COLORS = {
  C1: {
    accent: "var(--a)",
    bg: "color-mix(in srgb, var(--a) 7%, transparent)",
    border: "color-mix(in srgb, var(--a) 20%, transparent)",
  },
  C2: {
    accent: "var(--blk)",
    bg: "rgba(8,145,178,.07)",
    border: "rgba(8,145,178,.2)",
  },
  C3: {
    accent: "var(--am)",
    bg: "rgba(245,158,11,.07)",
    border: "rgba(245,158,11,.2)",
  },
  C4: {
    accent: "var(--gr)",
    bg: "rgba(16,185,129,.07)",
    border: "rgba(16,185,129,.2)",
  },
};

// Mapping centralisé : @/utils/statut-label.js (STATUT_CFG importé)

// ─── CSS (DA arcade routière — cohérent avec aujourdhui/mes-eleves/validation) ──
const STYLE = `<style>
  .lr-page {
    padding: 0 0 120px;
    max-width: 600px;
    margin: 0 auto;
    font-family: var(--ens-body, 'Inter'), sans-serif;
    color: var(--ink);
    background: var(--bg);
  }

  /* ── Hero compact arcade (en-tête livret) ── */
  .lr-hero {
    position: relative; overflow: hidden;
    margin: calc(-1 * (var(--th) + env(safe-area-inset-top, 0px))) -0px 0;
    padding: calc(env(safe-area-inset-top, 0px) + var(--th) + 18px) 20px 20px;
    background: linear-gradient(150deg, #4f46e5, #6d6bff 60%, #8b5cf6);
    color: #fff;
    isolation: isolate;
  }
  .lr-hero::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 4px; z-index: 1;
    background: repeating-linear-gradient(90deg, #f59e0b 0 14px, transparent 14px 28px); opacity: .8;
  }
  .lr-hero .ens-panneaux__sign { opacity: var(--o, .14); filter: saturate(1.1) brightness(1.05); }
  .lr-hero-in { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; }
  .lr-back {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,.22);
    background: rgba(255,255,255,.1);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 18px;
    color: #fff;
    flex-shrink: 0;
    transition: background .15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .lr-back:hover { background: rgba(255,255,255,.2); }
  .lr-back:active { transform: scale(.95); transition: transform .1s cubic-bezier(.23,1,.32,1); }
  @media (prefers-reduced-motion: reduce) { .lr-back:active { transform: none; } }
  .lr-hd-info { flex: 1; min-width: 0; }
  .lr-title {
    font: 700 clamp(16px,5vw,20px)/1.15 var(--ens-display, 'Fredoka'), sans-serif;
    color: #fff;
    margin: 0 0 3px;
    letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .lr-subtitle { font: 500 12px/1 var(--ens-body, 'Inter'), sans-serif; color: rgba(255,255,255,.7); margin: 0; }

  /* KPI global — barre de chaleur + .ens-stat */
  .lr-kpi {
    margin: 16px;
    padding: 20px;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--r-xl);
    box-shadow: var(--ens-shadow, var(--s1));
  }
  .lr-kpi-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 8px;
  }
  .lr-kpi-label {
    font: 600 11px/1 var(--ens-body, 'Inter'), sans-serif;
    color: var(--mu2);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .lr-kpi-val {
    font: 700 22px/1 var(--ens-display, 'Fredoka'), sans-serif;
    color: var(--ens-go, var(--a));
    letter-spacing: -0.022em;
  }
  .lr-kpi-pct {
    font: 500 13px/1 var(--ens-body, 'Inter'), sans-serif;
    color: var(--mu2);
  }
  .lr-global-bar {
    height: 7px;
    background: var(--bo3);
    border-radius: var(--r-full);
    overflow: hidden;
  }
  .lr-global-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--ens-go, var(--a)), color-mix(in srgb, var(--ens-go, var(--a)) 70%, #fff));
    border-radius: var(--r-full);
    transition: width .8s var(--ease-out);
    box-shadow: 0 0 8px color-mix(in srgb, var(--ens-go, var(--a)) 50%, transparent);
  }

  /* Carte « profil en un coup d'œil » (analyse heuristique locale) */
  .lr-profil {
    display: flex; align-items: flex-start; gap: 10px;
    margin: 0 16px 12px; padding: 13px 14px;
    border-radius: var(--ens-r, 14px); border: 1.5px solid var(--bo);
    background: var(--su); box-shadow: var(--ens-shadow, 0 1px 0 rgba(15,23,42,.04));
    border-left: 4px solid var(--ens-go, #18a558);
  }
  .lr-profil--cold { border-left-color: var(--ens-amber, #f59e0b); }
  .lr-profil--new  { border-left-color: var(--ens-blue, #1d4ed8); }
  .lr-profil-ico {
    flex-shrink: 0; margin-top: 1px; color: var(--ens-go, #18a558);
    display: inline-flex;
  }
  .lr-profil--cold .lr-profil-ico { color: var(--am-txt, #935e06); }
  .lr-profil--new  .lr-profil-ico { color: var(--ens-blue-lt, #3b82f6); }
  .lr-profil-txt {
    margin: 0; font: 600 13.5px/1.45 var(--ens-body, 'Inter'), sans-serif;
    color: var(--ink);
  }

  /* Corps */
  .lr-body { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }

  /* Section monde */
  .lr-monde {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--r-xl);
    overflow: hidden;
    box-shadow: var(--s0);
  }
  .lr-monde-hd {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--bo2);
  }
  .lr-monde-med { flex-shrink: 0; display: inline-flex; }
  .lr-monde-nm {
    font: 700 15px/1.25 var(--ens-display, 'Fredoka'), sans-serif;
    color: var(--ink);
    text-align: center;
    padding: 0 44px 0 0;
    letter-spacing: -0.01em;
  }
  .lr-monde-prog {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    font: 600 12px/1 var(--ens-body, 'Inter'), sans-serif;
    color: var(--mu2);
  }
  .lr-monde-bar-wrap {
    height: 4px;
    background: var(--bo3);
  }
  .lr-monde-bar-fill {
    height: 100%;
    transition: width .6s var(--ease-out);
  }

  /* Ligne sous-compétence */
  .lr-comp {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--bo2);
    cursor: pointer;
    transition: background .12s ease;
    min-height: 62px;
  }
  .lr-comp:last-child { border-bottom: none; }
  .lr-comp:hover { background: var(--bg); }
  .lr-comp:active { background: var(--bg2); }

  .lr-comp-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  /* pastille statut standard (medStatus) — même gabarit que le dot dans la ligne */
  .lr-comp-med { flex-shrink: 0; display: inline-flex; }
  .lr-comp-nom {
    font: 600 15.5px/1.35 var(--ens-body, 'Inter'), sans-serif;
    color: var(--ink);
    flex: 1;
    min-width: 0;
    letter-spacing: -0.01em;
  }
  /* Pastilles de statut → sémantique .ens-chip */
  .lr-comp-badge {
    font: 700 12px/1 var(--ens-body, 'Inter'), sans-serif;
    padding: 6px 11px;
    border-radius: var(--ens-r-pill, var(--r-full));
    white-space: nowrap;
    flex-shrink: 0;
  }
  .lr-comp-chev { color: var(--bo4); font-size: 14px; flex-shrink: 0; }
  /* Auto-validée (élève arrivé en solo, quiz ≥80 % avant rattachement) —
     badge INFO uniquement : ne compte dans aucune stat moniteur. */
  .lr-comp-auto {
    background: rgba(139, 92, 246, 0.12);
    color: #7c3aed;
    border: 1px solid rgba(139, 92, 246, 0.35);
  }

  /* Bouton bilan trimestriel */
  .lr-bilan-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 12px; min-height: 44px; border-radius: var(--ens-r, var(--r));
    background: rgba(255,255,255,.12); border: 1.5px solid rgba(255,255,255,.22);
    color: #fff; font: 700 12px/1 var(--ens-body, 'Inter'), sans-serif;
    cursor: pointer; flex-shrink: 0; white-space: nowrap;
    transition: background .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .lr-bilan-btn:hover { background: rgba(255,255,255,.2); }
  .lr-bilan-btn:active { transform: scale(.97); }
  .lr-bilan-btn:focus-visible { outline: 2px solid #f59e0b; outline-offset: 2px; }

  /* ─── Bottom sheet overlay ────────────────────────────────── */
  /* z-index 350 : au-dessus du FAB enseignant (#bn-seance-fab, 310) et de
     la bottom-nav (300), sinon le « + » flottant recouvre « Enregistrer ». */
  .lr-overlay {
    position: fixed;
    inset: 0;
    z-index: 350;
    background: rgba(10,13,26,.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
    animation: lr-overlay-in .2s ease;
  }
  @keyframes lr-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  /* Sheet ouverte → on masque le FAB « + » (même parti pris que body:has(.vs)
     sur log-session) : il flottait par-dessus le bouton « Enregistrer ». */
  body:has(.lr-overlay) #bn-seance-fab { display: none !important; }
  .lr-sheet {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: var(--su);
    border-radius: 24px 24px 0 0;
    padding: 0 0 max(24px, env(safe-area-inset-bottom));
    box-shadow: 0 -10px 40px rgba(10,13,26,.15);
    animation: lr-sheet-in .28s cubic-bezier(.33,1,.68,1) forwards;
    max-height: 92dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    transform: translateY(100%);
  }
  @keyframes lr-sheet-in {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .lr-sheet-hd {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--bo2);
    position: sticky;
    top: 0;
    background: var(--su);
    z-index: 2;
  }
  .lr-sheet-title {
    font: 700 17px/1.3 var(--ens-display, 'Fredoka'), sans-serif;
    color: var(--ink);
    margin: 0;
    flex: 1;
    letter-spacing: -0.022em;
  }
  .lr-sheet-close {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1px solid var(--bo);
    background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    color: var(--mu);
    flex-shrink: 0;
    transition: border-color .15s ease, color .15s ease;
  }
  .lr-sheet-close:hover { border-color: var(--a); color: var(--a-txt); }

  .lr-sheet-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }

  /* Boutons statut */
  .lr-statut-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .lr-statut-btn {
    padding: 14px 8px;
    border-radius: var(--r);
    border: 1.5px solid var(--bo);
    background: var(--bg);
    cursor: pointer;
    text-align: center;
    transition: border-color .15s ease, background .15s ease, color .15s ease, transform .15s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .lr-statut-btn:hover { border-color: var(--a); background: var(--su); }
  .lr-statut-btn:active { transform: scale(.98); }
  .lr-statut-btn.selected-acquis {
    border-color: var(--gr);
    background: rgba(16,185,129,.08);
  }
  .lr-statut-btn.selected-en_cours {
    border-color: var(--am);
    background: rgba(245,158,11,.08);
  }
  .lr-statut-btn.selected-a_retravailler {
    border-color: var(--rd);
    background: rgba(239,68,68,.08);
  }
  .lr-statut-btn-ico { font-size: 20px; line-height: 1; }
  .lr-statut-btn-lbl {
    font: 600 12px/1.3 var(--ens-body, 'Inter'), sans-serif;
    color: var(--ink);
  }

  /* Note */
  .lr-note-label {
    font: 700 11px/1 var(--ens-body, 'Inter'), sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--mu2);
    margin: 0 0 8px;
    display: block;
  }
  .lr-note {
    width: 100%;
    padding: 14px;
    background: var(--bg);
    border: 1px solid var(--bo);
    border-radius: var(--ens-r, var(--r));
    font: 500 14px/1.5 var(--ens-body, 'Inter'), sans-serif;
    color: var(--ink);
    resize: vertical;
    min-height: 80px;
    max-height: 200px;
    outline: none;
    transition: border-color .15s ease, background .15s ease;
    box-sizing: border-box;
  }
  .lr-note::placeholder { color: var(--mu2); }
  .lr-note:focus {
    border-color: var(--ens-go, var(--a));
    background: var(--su);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ens-go, var(--a)) 12%, transparent);
  }
  .lr-note-count {
    font: 500 11px/1 var(--ens-body, 'Inter'), sans-serif;
    color: var(--mu2);
    text-align: right;
    margin-top: 4px;
  }

  /* Bouton valider — arcade: fond ens-go + effet 3D */
  .lr-btn-save {
    width: 100%;
    padding: 16px;
    background: var(--ens-go, var(--a));
    border: none;
    border-radius: var(--ens-r, var(--r));
    color: #fff;
    font: 800 15px/1 var(--ens-display, 'Fredoka'), sans-serif;
    cursor: pointer;
    transition: transform .12s cubic-bezier(.23,1,.32,1), box-shadow .12s cubic-bezier(.23,1,.32,1);
    min-height: 52px;
    letter-spacing: -0.01em;
    box-shadow: 0 4px 0 0 color-mix(in srgb, var(--ens-go, var(--a)) 60%, #000);
  }
  .lr-btn-save:disabled {
    opacity: .45;
    cursor: not-allowed;
    box-shadow: none;
  }
  .lr-btn-save:not(:disabled):hover { opacity: .92; }
  .lr-btn-save:not(:disabled):active {
    transform: translateY(3px) scale(.98);
    box-shadow: 0 1px 0 0 color-mix(in srgb, var(--ens-go, var(--a)) 60%, #000);
  }
  @media (prefers-reduced-motion: reduce) { .lr-btn-save:not(:disabled):active { transform: none; } }

  /* Skeleton */
  .lr-skel { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
  .lr-skel-hd { height: 100px; background: linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%); background-size: 200% 100%; border-radius: var(--r-xl); animation: lr-pulse 1.4s ease-in-out infinite; }
  .lr-skel-bloc { height: 220px; background: linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%); background-size: 200% 100%; border-radius: var(--r-xl); animation: lr-pulse 1.4s ease-in-out infinite; animation-delay: .1s; }
  @keyframes lr-pulse { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  /* Message erreur */
  .lr-err {
    padding: 60px 20px;
    text-align: center;
    color: var(--mu2);
    font: 500 14px/1.6 var(--ens-body, 'Inter'), sans-serif;
  }
  .lr-err-ico { display: flex; justify-content: center; margin-bottom: 16px; }

  /* État succès après validation acquise — referme la boucle de valeur.
     Sobre (pas de confetti) : on PROUVE que l'élève vient d'avancer. */
  .lr-success {
    padding: 28px 24px calc(24px + env(safe-area-inset-bottom, 0px));
    text-align: center;
    display: flex; flex-direction: column; align-items: center;
  }
  .lr-success-check {
    width: 60px; height: 60px; border-radius: 50%;
    background: var(--grp);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
    animation: lr-pop .42s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes lr-pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .lr-success-comp {
    font: 600 13px/1.3 var(--ens-body, 'Inter'), sans-serif; color: var(--mu);
    margin-bottom: 6px;
  }
  .lr-success-title {
    font: 800 20px/1.2 var(--ens-display, 'Fredoka'), sans-serif; color: var(--ink);
    letter-spacing: -.01em; margin-bottom: 18px;
  }
  .lr-success-bar {
    width: 100%; height: 8px; background: var(--bo);
    border-radius: 99px; overflow: hidden; margin-bottom: 10px;
  }
  .lr-success-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, var(--ens-go, var(--a)), color-mix(in srgb, var(--ens-go, var(--a)) 70%, #fff));
    box-shadow: 0 0 10px color-mix(in srgb, var(--ens-go, var(--a)) 55%, transparent);
    transition: width .8s .1s cubic-bezier(.2,.7,.3,1);
  }
  .lr-success-meta {
    font: 600 13px/1 var(--ens-body, 'Inter'), sans-serif; color: var(--ink); margin-bottom: 6px;
  }
  .lr-success-meta b { font-weight: 800; color: var(--ens-go, var(--adk)); }
  .lr-success-note {
    font: 500 13px/1.45 var(--ens-body, 'Inter'), sans-serif; color: var(--mu2); margin-bottom: 22px;
  }
  @media (prefers-reduced-motion: reduce) {
    .lr-success-check { animation: none; }
    .lr-success-fill { transition: none; }
  }

  /* ── Bloc « Engagement » (vue vautour : régularité, quiz, fiches lues) ── */
  .lr-eng {
    margin: 0 16px 12px; padding: 15px 15px 13px;
    background: var(--su); border: 1px solid var(--bo);
    border-radius: var(--r-xl); box-shadow: var(--ens-shadow, var(--s1));
  }
  .lr-eng-hd {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; margin-bottom: 12px;
  }
  .lr-eng-ti {
    font: 600 11px/1 var(--ens-body, 'Inter'), sans-serif; color: var(--mu2);
    text-transform: uppercase; letter-spacing: .08em;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .lr-eng-ti svg { color: var(--a); }
  /* Étiquette de niveau d'engagement (grammaire partagée avec la liste) */
  .lr-tier {
    display: inline-flex; align-items: center; gap: 6px;
    font: 800 11px/1 var(--ens-body, 'Inter'), sans-serif;
    padding: 6px 11px 6px 9px; border-radius: var(--r-full); white-space: nowrap;
  }
  .lr-tier-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .lr-tier--determine { color: #4f46e5; background: rgba(79,70,229,.10);  border: 1px solid rgba(79,70,229,.28); }
  .lr-tier--regulier  { color: #0e7490; background: rgba(8,145,178,.10);  border: 1px solid rgba(8,145,178,.26); }
  .lr-tier--decroche  { color: #b45309; background: rgba(245,158,11,.13); border: 1px solid rgba(245,158,11,.32); }
  .lr-tier--nouveau   { color: var(--mu2); background: var(--bo3); border: 1px solid var(--bo); }
  .lr-eng-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; }
  .lr-eng-cell {
    background: var(--bg); border: 1px solid var(--bo2); border-radius: 12px;
    padding: 11px 12px; min-width: 0;
  }
  .lr-eng-k {
    font: 600 10px/1 var(--ens-body, 'Inter'), sans-serif; color: var(--mu2);
    text-transform: uppercase; letter-spacing: .04em; margin-bottom: 7px;
    display: flex; align-items: center; gap: 5px;
  }
  .lr-eng-k svg { flex-shrink: 0; opacity: .8; }
  .lr-eng-v {
    font: 800 18px/1.05 var(--ens-display, 'Fredoka'), sans-serif; color: var(--ink);
    letter-spacing: -.02em; display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap;
  }
  .lr-eng-u { font: 600 11px/1 var(--ens-body, 'Inter'), sans-serif; color: var(--mu2); }
  .lr-eng-cell--cold .lr-eng-v { color: #b45309; }
  .lr-eng-trend { font: 800 12px/1 var(--ens-body, 'Inter'), sans-serif; }
  .lr-eng-trend--up   { color: #15803d; }
  .lr-eng-trend--down { color: #b91c1c; }
  .lr-eng-foot {
    margin-top: 11px; padding-top: 10px; border-top: 1px solid var(--bo2);
    font: 600 12px/1.4 var(--ens-body, 'Inter'), sans-serif; color: var(--mu2);
    display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  }
  .lr-eng-foot svg { color: #f59e0b; vertical-align: -2px; }
  .lr-eng-sep { color: var(--bo4); }
</style>`;

// ─── State ────────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleveId = null;
let _eleveProfil = null; // { prenom, nom }
let _validationsMap = {}; // competence_id → { statut, note }
let _selfValsMap = {}; // competence_id → auto-validation solo (info seule)
let _valsRaw = []; // validations brutes (avec validated_at) — pour l'analyse profil
let _quizAttempts = []; // quiz_attempts (avec completed_at) — pour l'analyse profil
let _streakEff = 0; // streak RÉEL (vivant seulement si actif aujourd'hui/hier)
let _theory = null; // { score, nComp, nExams } — ligue Révision (autonomie élève)
let _engagement = null; // vue « vautour » : activité/régularité/fiches lues (RPC serveur)
let _sheetComp = null; // { c, n } la comp ouverte dans le sheet
let _sheetStatut = null;
let _sheetNote = "";

// ─── Entry point ──────────────────────────────────────────────────
export async function mount(root, eleveId) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  _eleveId = eleveId || null;

  if (!_eleveId) {
    root.innerHTML = `
      ${STYLE}
      <div class="lr-page">
        <div class="lr-err">
          <div class="lr-err-ico">${illus("clipboard", { size: 64 })}</div>
          Aucun élève sélectionné. Retourne à la liste.
        </div>
      </div>
    `;
    return;
  }

  track("page.view", {
    page: "livret_remc",
    role: _me.role,
    eleve_id: _eleveId,
  });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="lr-page">
      <div class="lr-skel">
        <div class="lr-skel-hd"></div>
        <div class="lr-skel-bloc"></div>
        <div class="lr-skel-bloc"></div>
      </div>
    </div>
  `;

  await loadData();
  render();
}

// ─── Data ─────────────────────────────────────────────────────────
async function loadData() {
  // Profil élève
  const { data: profil } = await sb
    .from("profiles")
    .select("id, prenom, nom")
    .eq("id", _eleveId)
    .single();

  _eleveProfil = profil || { prenom: "Élève", nom: "" };

  // Toutes les validations de cet élève (tous enseignants — pour voir l'état complet)
  const { data: vals } = await sb
    .from("validations")
    .select("competence_id, statut, note_enseignant, validated_at")
    .eq("eleve_id", _eleveId);

  _valsRaw = vals || [];
  _validationsMap = {};
  _valsRaw.forEach((v) => {
    _validationsMap[v.competence_id] = {
      statut: v.statut,
      note: v.note_enseignant || "",
    };
  });

  // Auto-validations (élève arrivé en SOLO avant rattachement) — lecture
  // seule, badge info dans la liste. N'entre dans AUCUNE stat moniteur ;
  // la validation moniteur reste la source de vérité et prime à l'écran.
  _selfValsMap = {};
  try {
    const { data: sv, error: svErr } = await sb
      .from("self_validations")
      .select("competence_id, score, validated_at")
      .eq("eleve_id", _eleveId);
    if (!svErr) {
      (sv || []).forEach((s) => {
        _selfValsMap[s.competence_id] = s;
      });
    }
  } catch (_) {
    /* best-effort — le badge disparaît simplement en cas d'erreur */
  }

  // Ligue Révision (autonomie élève) — lecture seule, RLS : enseignant
  // voit les tentatives des élèves de son école.
  try {
    const { data: qa, error } = await sb
      .from("quiz_attempts")
      .select("competence_id, type, score, ref_id, passed, completed_at")
      .eq("user_id", _eleveId);
    _quizAttempts = error ? [] : qa || [];
    _theory = error ? null : computeTheoryScore(qa);
  } catch (e) {
    _quizAttempts = [];
    _theory = null;
  }

  // Streak RÉEL (vivant seulement si actif aujourd'hui ou hier)
  try {
    const { data: st } = await sb
      .from("streaks")
      .select("current_streak, last_activity_date")
      .eq("user_id", _eleveId)
      .maybeSingle();
    _streakEff = effectiveStreak(st);
  } catch (e) {
    _streakEff = 0;
  }

  // Engagement « vautour » : activité in-app, régularité, fiches de conduite
  // lues (events_analytics), heure préférée — agrégé serveur (RPC SECURITY
  // DEFINER, RLS = mes élèves). Best-effort : si la RPC n'est pas encore
  // déployée ou renvoie null, le bloc ne s'affiche simplement pas.
  try {
    const { data: eng } = await sb.rpc("get_eleve_engagement", {
      p_eleve_id: _eleveId,
      p_days: 30,
    });
    _engagement = eng || null;
  } catch (e) {
    _engagement = null;
  }
}

// Streak réellement vivant : la valeur stockée ne se reset qu'au prochain login
// de l'élève → on l'annule si la dernière activité date de > hier.
function effectiveStreak(st) {
  if (!st || !st.last_activity_date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  const la = new Date(st.last_activity_date + "T00:00:00");
  return la.getTime() >= y.getTime() ? st.current_streak || 0 : 0;
}

// ─── Analyse profil élève (heuristique locale, ZÉRO token / LLM) ──────
// Déduit un profil en une phrase à partir des cadences (compétences/sem,
// quiz/sem, streak, inactivité). Genre-safe (pas de pronom ni d'adjectif accordé).
function computeEleveProfil() {
  const now = Date.now();
  const DAY = 86400000;
  const within = (iso, d) => iso && now - new Date(iso).getTime() <= d * DAY;

  const acquis = _valsRaw.filter((v) => v.statut === "acquis");
  const acquisCount = acquis.length;
  const comp4w = acquis.filter((v) => within(v.validated_at, 28)).length;
  const quiz4w = _quizAttempts.filter((q) => within(q.completed_at, 28)).length;
  const compPerWeek = Math.round((comp4w / 4) * 10) / 10;
  const quizPerWeek = Math.round((quiz4w / 4) * 10) / 10;

  const lastTs = Math.max(
    0,
    ..._quizAttempts.map((q) =>
      q.completed_at ? new Date(q.completed_at).getTime() : 0,
    ),
    ...acquis.map((v) =>
      v.validated_at ? new Date(v.validated_at).getTime() : 0,
    ),
  );
  const daysSince = lastTs ? Math.floor((now - lastTs) / DAY) : null;
  const prenom = esc(_eleveProfil?.prenom || "Cet élève");

  // Tout début de parcours
  if (acquisCount === 0 && _quizAttempts.length === 0) {
    return {
      tone: "new",
      text: `${prenom} démarre tout juste. Encore trop peu d’activité pour cerner son profil.`,
    };
  }
  // En retrait (rien depuis 2 semaines)
  if (daysSince !== null && daysSince >= 14 && quiz4w === 0) {
    return {
      tone: "cold",
      text: `${prenom} est en retrait : aucune activité depuis ${daysSince} jours. Une relance l’aiderait à reprendre.`,
    };
  }
  // Label d'assiduité (phrase nominale, sans genre)
  let label;
  if (quizPerWeek >= 5 || _streakEff >= 5) label = "régularité exemplaire";
  else if (quizPerWeek >= 2 || _streakEff >= 2) label = "bon rythme";
  else label = "activité modérée";

  const bits = [];
  if (compPerWeek > 0)
    bits.push(`~${compPerWeek} compétence${compPerWeek >= 2 ? "s" : ""}/sem`);
  if (quizPerWeek > 0) bits.push(`~${quizPerWeek} quiz/sem`);
  const streakBit = _streakEff >= 2 ? ` Série en cours : ${_streakEff} j.` : "";
  const facts = bits.length ? ` : ${bits.join(", ")}.` : ".";
  return { tone: "warm", text: `${prenom} — ${label}${facts}${streakBit}` };
}

// Carte « profil en un coup d'œil » — texte déjà échappé par computeEleveProfil.
function _renderProfilCard() {
  const p = computeEleveProfil();
  const ico =
    p.tone === "cold" ? "clock" : p.tone === "new" ? "star" : "activity";
  return `<div class="lr-profil lr-profil--${p.tone}">
    <span class="lr-profil-ico">${icon(ico, { size: 16, strokeWidth: 2.2 })}</span>
    <p class="lr-profil-txt">${p.text}</p>
  </div>`;
}

// ─── Ligne « Révision (autonomie) » (KPI, lecture seule, ton factuel) ──
// Donne au moniteur une vision rapide de l'engagement élève entre les leçons.
function _renderTheoryRow() {
  if (!_theory) return "";
  const info = theoryLeague(_theory.score);
  const label = info.league
    ? `Ligue ${info.league.n} — ${esc(info.league.name)} · ${_theory.score} pts`
    : "Pas encore commencé";
  const detail = info.league
    ? `${_theory.nComp} quiz de compétence réussi${_theory.nComp > 1 ? "s" : ""} · ${_theory.nExams} examen${_theory.nExams > 1 ? "s" : ""} blanc${_theory.nExams > 1 ? "s" : ""} réussi${_theory.nExams > 1 ? "s" : ""}`
    : "Pas encore de quiz réussi en autonomie";
  const dotColor = info.league ? info.league.color : "var(--mu2)";
  return `
    <div class="lr-kpi-row" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bo2)">
      <span class="lr-kpi-label">Révision (autonomie)</span>
      <span style="display:inline-flex;align-items:center;gap:6px">
        <span style="width:8px;height:8px;border-radius:50%;background:${dotColor};display:inline-block" aria-hidden="true"></span>
        <span class="lr-kpi-pct">${label}</span>
      </span>
    </div>
    <div style="font:500 11px/1.4 var(--ens-body,'Inter'),sans-serif;color:var(--mu2);margin-top:4px">${detail}</div>`;
}

// ─── Carte « Engagement » (vue vautour) ──────────────────────────
// Agrégé serveur (get_eleve_engagement) : régularité, quiz + tendance, fiches
// de conduite lues, heure préférée, niveau d'engagement. Best-effort : rien à
// afficher si la RPC n'a pas répondu (bloc masqué, pas d'erreur à l'écran).
const _TIER_LABEL = {
  determine: { lbl: "Déterminé·e", cls: "determine" },
  regulier: { lbl: "Régulier·e", cls: "regulier" },
  decroche: { lbl: "Décroche", cls: "decroche" },
  nouveau: { lbl: "Pas encore actif·ve", cls: "nouveau" },
};

function _renderEngagementCard() {
  const e = _engagement;
  if (!e) return "";
  const t = _TIER_LABEL[e.tier] || _TIER_LABEL.nouveau;

  // Dernière activité (relatif, ton factuel)
  const ds = e.days_since;
  let lastTxt;
  if (ds == null) lastTxt = "aucune";
  else if (ds <= 0) lastTxt = "aujourd’hui";
  else if (ds === 1) lastTxt = "hier";
  else if (ds < 7) lastTxt = `il y a ${ds} j`;
  else if (ds < 30) lastTxt = `il y a ${Math.round(ds / 7)} sem`;
  else lastTxt = `il y a ${Math.floor(ds / 30)} mois`;
  const cold = ds != null && ds >= 10;

  // Tendance quiz : 7 derniers jours vs 7 précédents
  const q7 = Number(e.quiz_7d) || 0;
  const qp = Number(e.quiz_prev_7d) || 0;
  const delta = q7 - qp;
  const trend =
    delta > 0
      ? `<span class="lr-eng-trend lr-eng-trend--up">↑ ${delta}</span>`
      : delta < 0
        ? `<span class="lr-eng-trend lr-eng-trend--down">↓ ${Math.abs(delta)}</span>`
        : "";

  const activeDays = Number(e.active_days) || 0;
  const fiches = Number(e.fiches_read) || 0;
  const streak = Number(e.streak) || 0;
  const hour = Number.isInteger(e.optimal_hour) ? e.optimal_hour : null;

  const foot = [];
  if (streak >= 2)
    foot.push(
      `${icon("flame", { size: 13, strokeWidth: 2.3 })} Série de ${streak} jours`,
    );
  if (hour != null) foot.push(`Plutôt actif·ve vers ${hour} h`);
  const footHtml = foot.length
    ? `<div class="lr-eng-foot">${foot.join(' <span class="lr-eng-sep">·</span> ')}</div>`
    : "";

  return `
    <div class="lr-eng">
      <div class="lr-eng-hd">
        <span class="lr-eng-ti">${icon("activity", { size: 13, strokeWidth: 2.3 })} Engagement</span>
        <span class="lr-tier lr-tier--${t.cls}"><span class="lr-tier-dot"></span>${t.lbl}</span>
      </div>
      <div class="lr-eng-grid">
        <div class="lr-eng-cell${cold ? " lr-eng-cell--cold" : ""}">
          <div class="lr-eng-k">${icon("clock", { size: 12, strokeWidth: 2.2 })} Dernière activité</div>
          <div class="lr-eng-v">${esc(lastTxt)}</div>
        </div>
        <div class="lr-eng-cell">
          <div class="lr-eng-k">${icon("calendar", { size: 12, strokeWidth: 2.2 })} Jours actifs</div>
          <div class="lr-eng-v">${activeDays}<span class="lr-eng-u">/ 30 j</span></div>
        </div>
        <div class="lr-eng-cell">
          <div class="lr-eng-k">${icon("zap", { size: 12, strokeWidth: 2.2 })} Quiz (7 j)</div>
          <div class="lr-eng-v">${q7} ${trend}</div>
        </div>
        <div class="lr-eng-cell">
          <div class="lr-eng-k">${icon("book-open", { size: 12, strokeWidth: 2.2 })} Fiches lues</div>
          <div class="lr-eng-v">${fiches}</div>
        </div>
      </div>
      ${footHtml}
    </div>`;
}

// ─── Render principal ─────────────────────────────────────────────
function render() {
  const acquis = Object.values(_validationsMap).filter(
    (v) => v.statut === "acquis",
  ).length;
  const pct = REMC_TOTAL > 0 ? Math.round((acquis / REMC_TOTAL) * 100) : 0;
  const prenomNom = [
    esc(_eleveProfil?.prenom || ""),
    esc(_eleveProfil?.nom || ""),
  ]
    .filter(Boolean)
    .join(" ");

  _root.innerHTML = `
    ${STYLE}
    <div class="lr-page anim-slide-up">

      <header class="lr-hero">
        <div class="lr-hero-in">
          <button class="lr-back" aria-label="Retour liste élèves">${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}</button>
          <div class="lr-hd-info">
            <h1 class="lr-title" tabindex="-1">Livret — ${prenomNom || "Élève"}</h1>
            <p class="lr-subtitle">${acquis}/${REMC_TOTAL} compétences validées</p>
          </div>
          <button class="lr-bilan-btn" id="lr-bilan-btn" aria-label="Voir le bilan trimestriel">
            ${icon("file-text", { size: 14, strokeWidth: 2 })} Bilan
          </button>
        </div>
      </header>

      <div class="lr-kpi">
        <div class="lr-kpi-row">
          <span class="lr-kpi-label">Compétences validées</span>
          <span>
            <span class="lr-kpi-val">${acquis}</span>
            <span class="lr-kpi-pct"> / ${REMC_TOTAL} · ${pct}%</span>
          </span>
        </div>
        <div class="lr-global-bar">
          <div class="lr-global-fill" style="width:${pct}%"></div>
        </div>
        ${_renderTheoryRow()}
      </div>

      ${_renderEngagementCard()}

      ${_renderProfilCard()}

      <div class="lr-body">
        ${REMC.map(renderMonde).join("")}
      </div>

      <!-- Fil des moniteurs — injecté dynamiquement -->
      <div id="lr-feed-section" style="padding:0 16px 100px"></div>

    </div>
  `;

  wireMain();
  _loadFeedSection();
  // Couche 2 : bloc « cibler une révision conduite » — ré-injecté à chaque
  // render (idempotent) pour qu'il survive aux re-renders post-validation.
  mountCiblerRevision(_root, _eleveId);
  // Quiz éclair : défi 3 questions / 5 min envoyé à l'élève (même règle
  // d'idempotence que ci-dessus).
  mountFlashQuizSend(_root, _eleveId);
}

async function _loadFeedSection() {
  const host = document.getElementById("lr-feed-section");
  if (!host || !_eleveId) return;

  host.innerHTML = `<div style="padding:8px 0;color:var(--mu2);font:500 12px/1 'Inter',sans-serif">Chargement du fil…</div>`;

  let events = [];
  try {
    const { data } = await sb.rpc("get_eleve_feedback_feed", {
      p_eleve_id: _eleveId,
      p_limit: 30,
    });
    events = data || [];
  } catch (e) {
    host.innerHTML = "";
    return;
  }

  if (events.length === 0) {
    host.innerHTML = "";
    return;
  }

  function _relTime(ts) {
    if (!ts) return "";
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
    if (d === 0) return "aujourd’hui";
    if (d === 1) return "hier";
    if (d < 7) return `il y a ${d}j`;
    return new Date(ts).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }

  // Groupé par jour × moniteur : 20 cartes « a validé X » à la suite = mur
  // de texte. Un groupe = « 8 compétences validées ✓ », dépliable.
  const groups = [];
  const byKey = new Map();
  for (const evt of events) {
    const day = evt.ts ? new Date(evt.ts).toDateString() : "";
    const moniteur =
      `${evt.moniteur_prenom || ""} ${evt.moniteur_nom || ""}`.trim();
    const key = `${day}|${moniteur}`;
    let g = byKey.get(key);
    if (!g) {
      g = { ts: evt.ts, moniteur, items: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    g.items.push(evt);
  }

  const MAX_GROUPS = 5;

  function _renderGroup(g) {
    const nValid = g.items.filter((e) => e.kind !== "session").length;
    const nSession = g.items.length - nValid;
    const summary = [
      nValid
        ? `${nValid} compétence${nValid > 1 ? "s" : ""} validée${nValid > 1 ? "s" : ""}`
        : "",
      nSession ? `${nSession} séance${nSession > 1 ? "s" : ""}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const detail = g.items
      .map((evt) => {
        const isSession = evt.kind === "session";
        return `<div class="lr-feed-item">
          <div class="lr-feed-dot ${isSession ? "k-session" : "k-validation"}">${isSession ? icon("car", { size: 12, strokeWidth: 2 }) : icon("check", { size: 12, strokeWidth: 2.5 })}</div>
          <div class="lr-feed-content">
            <div class="lr-feed-desc">${isSession ? "Séance" : `${esc(evt.competence_id || "—")} validée`}</div>
            ${evt.comment ? `<div class="lr-feed-comment">"${esc(evt.comment)}"</div>` : ""}
          </div>
        </div>`;
      })
      .join("");
    return `
      <details class="lr-feed-grp">
        <summary>
          <span class="lr-feed-dot k-validation">${icon("check", { size: 12, strokeWidth: 2.5 })}</span>
          <span class="lr-feed-grp-txt">
            <span class="lr-feed-grp-ttl">${esc(_relTime(g.ts))} — ${esc(summary || "activité")}</span>
            <span class="lr-feed-grp-sub">${esc(g.moniteur)}</span>
          </span>
          <span class="lr-feed-grp-chev">${icon("chevron-down", { size: 14, strokeWidth: 2.2 })}</span>
        </summary>
        <div class="lr-feed-grp-body">${detail}</div>
      </details>`;
  }

  host.innerHTML = `
    <style>
      /* ── Conteneur dépliable (chip) ── */
      .lr-feed-wrap {
        border: 1px solid var(--bo);
        border-radius: var(--r);
        background: var(--su);
        overflow: hidden;
      }
      .lr-feed-wrap > summary {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px;
        min-height: 44px; box-sizing: border-box;
        cursor: pointer; list-style: none;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      .lr-feed-wrap > summary::-webkit-details-marker { display: none; }
      .lr-feed-wrap > summary:hover { background: color-mix(in srgb, var(--bo) 40%, transparent); }
      .lr-feed-wrap-icon { color: var(--a-txt); display: inline-flex; flex-shrink: 0; }
      .lr-feed-wrap-lbl {
        flex: 1; min-width: 0;
        font: 600 13px/1.2 var(--ens-body, 'Inter'), sans-serif;
        color: var(--ink);
      }
      .lr-feed-wrap-chev { color: var(--mu2); display: inline-flex; flex-shrink: 0; transition: transform .2s; }
      .lr-feed-wrap[open] > summary .lr-feed-wrap-chev { transform: rotate(180deg); }
      .lr-feed-wrap-body {
        padding: 0 14px 12px;
        border-top: 1px solid var(--bo);
      }

      /* ── Contenu interne ── */
      .lr-feed { margin-bottom: 0; }
      .lr-feed-list { display: flex; flex-direction: column; gap: 1px; }
      .lr-feed-item {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--bo2);
      }
      .lr-feed-item:last-child { border-bottom: none; }
      .lr-feed-dot {
        width: 28px; height: 28px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 2px;
        display: flex; align-items: center; justify-content: center;
      }
      .lr-feed-dot.k-session { background: color-mix(in srgb, var(--a) 10%, transparent); color: var(--a-txt); }
      .lr-feed-dot.k-validation { background: rgba(16,185,129,.1); color: var(--gr-txt); }
      .lr-feed-content { flex: 1; min-width: 0; }
      .lr-feed-author {
        font: 600 12px/1.2 'Inter', sans-serif;
        color: var(--ink);
        margin-bottom: 2px;
      }
      .lr-feed-desc {
        font: 500 12px/1.4 'Inter', sans-serif;
        color: var(--mu);
      }
      .lr-feed-comment {
        font: italic 11px/1.4 'Inter', sans-serif;
        color: var(--mu2);
        margin-top: 4px;
        padding-left: 6px;
        border-left: 2px solid var(--bo);
      }
      .lr-feed-ts {
        font: 500 10px/1 'Inter', sans-serif;
        color: var(--mu5);
        flex-shrink: 0;
        margin-top: 4px;
      }
      .lr-feed-grp { border-bottom: 1px solid var(--bo2); }
      .lr-feed-grp:last-child { border-bottom: none; }
      .lr-feed-grp > summary {
        display: flex; align-items: center; gap: 12px;
        padding: 11px 0;
        min-height: 44px; box-sizing: border-box;
        cursor: pointer; list-style: none;
        -webkit-tap-highlight-color: transparent;
      }
      .lr-feed-grp > summary::-webkit-details-marker { display: none; }
      .lr-feed-grp-txt { flex: 1; min-width: 0; }
      .lr-feed-grp-ttl { display: block; font: 600 12.5px/1.3 'Inter', sans-serif; color: var(--ink); }
      .lr-feed-grp-sub { display: block; font: 500 11px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 1px; }
      .lr-feed-grp-chev { color: var(--mu2); display: inline-flex; flex-shrink: 0; transition: transform .2s; }
      .lr-feed-grp[open] > summary .lr-feed-grp-chev { transform: rotate(180deg); }
      .lr-feed-grp-body { padding: 0 0 8px 40px; }
      .lr-feed-grp-body .lr-feed-item { padding: 6px 0; border-bottom: none; }
      .lr-feed-all {
        width: 100%; margin-top: 8px; padding: 11px;
        min-height: 44px;
        background: none; border: 1.5px dashed var(--bo);
        border-radius: var(--r);
        font: 600 12.5px/1 'Inter', sans-serif; color: var(--mu);
        cursor: pointer;
        transition: transform .14s var(--ease-snap);
      }
      .lr-feed-all:hover { border-color: var(--bo4); color: var(--ink5); }
      .lr-feed-all:active { transform: scale(.98); }
    </style>
    <details class="lr-feed-wrap">
      <summary>
        <span class="lr-feed-wrap-icon">${icon("clock", { size: 14, strokeWidth: 2.2 })}</span>
        <span class="lr-feed-wrap-lbl">Fil des moniteurs (${groups.length})</span>
        <span class="lr-feed-wrap-chev">${icon("chevron-down", { size: 14, strokeWidth: 2.2 })}</span>
      </summary>
      <div class="lr-feed-wrap-body">
        <div class="lr-feed">
          <div class="lr-feed-list">
            ${groups.slice(0, MAX_GROUPS).map(_renderGroup).join("")}
          </div>
          ${
            groups.length > MAX_GROUPS
              ? `<div class="lr-feed-list" id="lr-feed-more" hidden>${groups.slice(MAX_GROUPS).map(_renderGroup).join("")}</div>
                 <button class="lr-feed-all" id="lr-feed-all" type="button">Voir tout (${groups.length})</button>`
              : ""
          }
        </div>
      </div>
    </details>
  `;

  const moreBtn = host.querySelector("#lr-feed-all");
  moreBtn?.addEventListener("click", () => {
    host.querySelector("#lr-feed-more")?.removeAttribute("hidden");
    moreBtn.remove();
  });
}

function renderMonde(cat) {
  const col = MONDE_COLORS[cat.id] || MONDE_COLORS.C1;
  const acquis = cat.subs.filter(
    (s) => _validationsMap[s.c]?.statut === "acquis",
  ).length;
  const pct =
    cat.subs.length > 0 ? Math.round((acquis / cat.subs.length) * 100) : 0;

  return `
    <div class="lr-monde" role="group" aria-label="${escAttr(cat.name)} — ${acquis}/${cat.subs.length} acquises">
      <div class="lr-monde-hd" style="background:${col.bg}; border-color:${col.border};">
        <span class="lr-monde-med">${medallion(...(MONDE_MED[cat.id] || MONDE_MED.C1), { size: 30 })}</span>
        <span class="lr-monde-nm">${esc(cat.name)}</span>
        <span class="lr-monde-prog">${acquis}/${cat.subs.length}</span>
      </div>
      <div class="lr-monde-bar-wrap">
        <div class="lr-monde-bar-fill" style="width:${pct}%; background:${col.accent};"></div>
      </div>
      ${cat.subs.map((sub) => renderComp(sub)).join("")}
    </div>
  `;
}

// Mapping statut → classe .ens-chip modificatrice
const CHIP_CLASS = {
  acquis: "ens-chip--go",
  en_cours: "ens-chip--blue",
  a_valider: "ens-chip--amber",
  a_retravailler: "ens-chip--stop",
  null: "",
};

function renderComp(sub) {
  const val = _validationsMap[sub.c];
  const statut = val?.statut || null;
  const cfg = STATUT_CFG[statut] || STATUT_CFG.null;
  const chipMod = CHIP_CLASS[statut] || "";

  // Auto-validée en solo et pas encore évaluée par le moniteur : badge info
  // à la place du statut vide — le moniteur sait que l'élève a déjà bossé
  // ce geste seul (quiz ≥80 %), et peut confirmer en séance.
  const selfVal = !statut ? _selfValsMap[sub.c] : null;
  const badge = selfVal
    ? `<span class="lr-comp-badge ens-chip lr-comp-auto" title="Validée en autonomie (quiz ${Math.round(selfVal.score)}%) avant rattachement — à confirmer en séance">Auto-validée</span>`
    : `<span class="lr-comp-badge ens-chip ${chipMod}">${cfg.label}</span>`;

  const medKey = STATUT_MED[statut];
  return `
    <div class="lr-comp" data-comp-id="${escAttr(sub.c)}" data-comp-nom="${escAttr(sub.n)}"
         role="button" tabindex="0" aria-label="${escAttr(sub.n)} — ${selfVal ? "Auto-validée par l'élève, à confirmer" : cfg.label}. Appuyer pour évaluer cette compétence">
      ${medKey ? `<span class="lr-comp-med">${medStatus(medKey, { size: 24 })}</span>` : `<span class="lr-comp-dot" style="background:${cfg.dot}"></span>`}
      <span class="lr-comp-nom">${esc(sub.n)}</span>
      ${badge}
      <span class="lr-comp-chev" aria-hidden="true">›</span>
    </div>
  `;
}

// ─── Wire principal ───────────────────────────────────────────────
function wireMain() {
  // Retour
  _root
    .querySelector(".lr-back")
    ?.addEventListener("click", () => navigate("#/eleves"));

  // Bilan trimestriel
  _root.querySelector("#lr-bilan-btn")?.addEventListener("click", () => {
    track("livret.bilan.open", { eleve_id: _eleveId });
    navigate(`#/bilan/${_eleveId}`);
  });

  // Clic sur sous-compétence → ouvrir sheet
  _root.querySelectorAll(".lr-comp[data-comp-id]").forEach((el) => {
    const handler = () => openSheet(el.dataset.compId, el.dataset.compNom);
    el.addEventListener("click", handler);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") handler();
    });
  });
}

// ─── Bottom sheet ─────────────────────────────────────────────────
function openSheet(compId, compNom) {
  haptic("impact");
  _sheetComp = { c: compId, n: compNom };
  const existing = _validationsMap[compId];
  _sheetStatut = existing?.statut || null;
  _sheetNote = existing?.note || "";

  const overlay = document.createElement("div");
  overlay.className = "lr-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", `Évaluer ${compNom}`);

  overlay.innerHTML = `
    <div class="lr-sheet">
      <div class="lr-sheet-hd">
        <h2 class="lr-sheet-title">${esc(compNom)}</h2>
        <button class="lr-sheet-close" aria-label="Fermer">${icon("x", { size: 16, strokeWidth: 2.4 })}</button>
      </div>
      <div class="lr-sheet-body">
        <div>
          <label class="lr-note-label">Évaluer cette compétence</label>
          <div class="lr-statut-grid">
            ${renderStatutBtn("acquis", icon("check-circle", { size: 16, strokeWidth: 2.2, color: "var(--grd)" }), "Acquis")}
            ${renderStatutBtn("en_cours", icon("refresh-cw", { size: 16, strokeWidth: 2.2, color: "var(--amk)" }), "En cours")}
            ${renderStatutBtn("a_retravailler", icon("alert-triangle", { size: 16, strokeWidth: 2.2, color: "var(--rdk)" }), "À retravailler")}
          </div>
        </div>
        <div>
          <label class="lr-note-label" for="lr-note-ta">Observations (optionnel)</label>
          <textarea
            id="lr-note-ta"
            class="lr-note"
            maxlength="280"
            placeholder="Ce que tu as constaté en séance…"
            rows="3"
          >${esc(_sheetNote)}</textarea>
          <div class="lr-note-count">${_sheetNote.length}/280</div>
        </div>
        <button class="lr-btn-save" ${_sheetStatut ? "" : "disabled"}>
          ${_sheetStatut ? "Enregistrer" : "Choisis un statut pour valider"}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Fermer en cliquant l'overlay
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSheet(overlay);
  });
  overlay
    .querySelector(".lr-sheet-close")
    .addEventListener("click", () => closeSheet(overlay));
  enableSheetSwipe(
    overlay.querySelector(".lr-sheet"),
    () => closeSheet(overlay),
    { overlay },
  );

  // Boutons statut
  overlay.querySelectorAll(".lr-statut-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      _sheetStatut = btn.dataset.statut;
      overlay
        .querySelectorAll(".lr-statut-btn")
        .forEach(
          (b) =>
            (b.className = `lr-statut-btn${b.dataset.statut === _sheetStatut ? " selected-" + _sheetStatut : ""}`),
        );
      const saveBtn = overlay.querySelector(".lr-btn-save");
      saveBtn.disabled = false;
      saveBtn.textContent = "Enregistrer";
    });
  });

  // Note textarea
  const ta = overlay.querySelector(".lr-note");
  const counter = overlay.querySelector(".lr-note-count");
  if (!ta || !counter) return;
  ta.addEventListener("input", () => {
    _sheetNote = ta.value.slice(0, 280);
    ta.value = _sheetNote;
    counter.textContent = `${_sheetNote.length}/280`;
  });

  // Valider
  overlay
    .querySelector(".lr-btn-save")
    .addEventListener("click", () => doSave(overlay));

  // Focus trap initial
  requestAnimationFrame(() => ta.focus());
}

function renderStatutBtn(statut, ico, lbl) {
  const selected = _sheetStatut === statut;
  return `
    <button class="lr-statut-btn${selected ? " selected-" + statut : ""}" data-statut="${escAttr(statut)}">
      <span class="lr-statut-btn-ico">${ico}</span>
      <span class="lr-statut-btn-lbl">${lbl}</span>
    </button>
  `;
}

function closeSheet(overlay) {
  overlay.style.animation = "lr-overlay-in .18s ease reverse";
  setTimeout(() => overlay.remove(), 180);
}

async function doSave(overlay) {
  if (!_sheetComp || !_sheetStatut) return;

  const btn = overlay.querySelector(".lr-btn-save");
  btn.disabled = true;
  btn.textContent = "Enregistrement…";

  const note = _sheetNote.trim() || null;
  let saveError = null;

  if (_sheetStatut === "acquis") {
    // « Acquis » passe par validate_session (SECURITY DEFINER) : il écrit la
    // validation ET notifie l'élève côté serveur (comp_acquise). L'INSERT
    // notif direct du client était bloqué par la RLS notifications_insert
    // (WITH CHECK user_id = get_my_id() → un moniteur ne peut pas notifier
    // un autre user). Aucun effet de bord : validate_session n'écrit pas
    // dans sessions_moniteur.
    const { data, error } = await sb.rpc("validate_session", {
      p_eleve_id: _eleveId,
      p_session_date: new Date().toISOString().slice(0, 10),
      p_note: note,
      p_acquis: [_sheetComp.c],
    });
    saveError = error || (data?.error ? new Error(data.error) : null);
  } else {
    // « En cours » / « à retravailler » : via set_competence_status
    // (SECURITY DEFINER). Il autorise la RÉTROGRADATION d'un acquis (correction,
    // ce que validate_session interdit) ET, pour « à retravailler », crée
    // automatiquement un devoir + notifie l'élève (compte-rendu d'1 compétence).
    let crText = null;
    if (_sheetStatut === "a_retravailler") {
      const prenom = _eleveProfil?.prenom || "Ton élève";
      crText =
        `Compte-rendu — ${prenom}\n\nÀ retravailler : ${_sheetComp.n}` +
        (note ? `\n\nNote du moniteur : ${note}` : "");
    }
    const { data, error } = await sb.rpc("set_competence_status", {
      p_eleve_id: _eleveId,
      p_competence_id: _sheetComp.c,
      p_statut: _sheetStatut,
      p_note: note,
      p_compte_rendu: crText,
    });
    saveError = error || (data?.error ? new Error(data.error) : null);
  }

  if (saveError) {
    console.error("[livret-remc] save failed", saveError);
    toast("Enregistrement impossible. Réessaie.", "error");
    btn.disabled = false;
    btn.textContent = "Enregistrer";
    return;
  }

  track("competence.evaluated", {
    competence_id: _sheetComp.c,
    eleve_id: _eleveId,
    statut: _sheetStatut,
    auto_ecole_id: _me.auto_ecole_id,
  });

  // Mettre à jour le state local
  _validationsMap[_sheetComp.c] = { statut: _sheetStatut, note: _sheetNote }; // note = note_enseignant mapped locally

  // Acquis = moment de valeur : on PROUVE l'avancée de l'élève dans le sheet.
  // Autres statuts (en cours / à retravailler) = pas de célébration, toast neutre.
  if (_sheetStatut === "acquis") {
    haptic("validate");
    showSuccessState(overlay);
  } else {
    haptic("confirm");
    toast("Évaluation enregistrée.", "success");
    closeSheet(overlay);
    render();
  }
}

// État succès : referme la boucle « je valide → l'élève avance → il le voit ».
function showSuccessState(overlay) {
  const acquisCount = Object.values(_validationsMap).filter(
    (v) => v.statut === "acquis",
  ).length;
  const pct = REMC_TOTAL > 0 ? Math.round((acquisCount / REMC_TOTAL) * 100) : 0;
  const prenom = esc(_eleveProfil?.prenom || "Ton élève");
  const complete = acquisCount >= REMC_TOTAL;

  const sheet = overlay.querySelector(".lr-sheet");
  if (!sheet) {
    closeSheet(overlay);
    render();
    return;
  }

  sheet.innerHTML = `
    <div class="lr-success">
      <div class="lr-success-check">${icon("check", { size: 32, strokeWidth: 3, color: "var(--grd)" })}</div>
      <div class="lr-success-comp">${esc(_sheetComp.n)} — validée</div>
      <div class="lr-success-title">${complete ? `${prenom} a tout validé` : `${prenom} a progressé`}</div>
      <div class="lr-success-bar"><div class="lr-success-fill" style="width:0%"></div></div>
      <div class="lr-success-meta"><b>${acquisCount}/${REMC_TOTAL}</b> compétences validées · ${pct}%</div>
      <div class="lr-success-note">${complete ? `Les 31 compétences sont validées.` : `${prenom} voit sa progression dans son appli.`}</div>
      <button class="lr-btn-save" id="lr-success-continue" type="button">Continuer</button>
    </div>
  `;

  // Anime la barre vers la progression réelle (l'avancée se voit)
  const fill = sheet.querySelector(".lr-success-fill");
  requestAnimationFrame(() => {
    if (fill) fill.style.width = pct + "%";
  });

  sheet.querySelector("#lr-success-continue")?.addEventListener("click", () => {
    closeSheet(overlay);
    render();
  });
}
