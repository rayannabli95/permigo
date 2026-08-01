// ═══════════════════════════════════════════════════════════════
// Enseignant — Mes élèves
// Liste filtrée + progression livret par élève
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";
// (empty-state.js non utilisé — remplacé par illus() arcade)
import { renderUserAvatar } from "@/components/common/avatar.js";
import { fmtName } from "@/utils/fmt-name.js";
import { triggerEleveRecovery } from "@/services/eleve-recovery.js";
import { icon } from "@/utils/icons.js";
import { openInviteEleveModal } from "@/services/invite-eleve.js";
// coach-hint retiré : pipeline segmenté n'a pas de bandeau relancer séparé
import { illus } from "@/components/enseignant/illus.js";
import { haptic } from "@/utils/haptic.js";
import { medallion } from "@/utils/medallions.js";
import {
  provenanceBadge,
  fetchProvenanceMap,
  openProvenanceEditor,
} from "@/utils/provenance.js";
// Hub à onglets (chantier nav simplifiée) : Relances et Classement montent
// la logique des pages existantes dans un panneau interne — zéro duplication
// des requêtes/règles métier (seuil de refroidissement, calcul du classement).
import {
  STYLE as RL_STYLE,
  computeCooling,
  renderRelanceCard,
  wireRelanceCards,
} from "./relances.js";
import { fetchRanking } from "./classement-eleves.js";

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
  .me-page {
    padding: 0 0 100px;
    max-width: 600px;
    margin: 0 auto;
    background: #f6f7f9;
    font-family: 'Archivo', var(--ens-body, 'Archivo'), sans-serif;
    color: #1a1f2b;
  }

  /* ── En-tête clair (raccord dashboard indigo, plus d'arcade) ── */
  .me-hero {
    position: relative;
    margin: 0;
    /* #app (has-chrome) compense déjà le header fixe — pas de var(--th) ici */
    padding: 16px 18px 2px;
    background: transparent;
    color: #1a1c2e;
    animation: meHeroIn .45s var(--ease, ease) both;
  }
  .me-hero-content { position: relative; z-index: 2; }
  .me-hero-kicker {
    font: 700 11px/1 'Archivo', sans-serif;
    color: #646a8c; text-transform: uppercase; letter-spacing: .12em;
    margin: 0 0 6px;
  }
  .me-hero-title {
    font: 800 clamp(23px, 7vw, 28px)/1.1 'Archivo', sans-serif;
    color: #1a1c2e; margin: 0; letter-spacing: -.01em;
  }
  .me-hero-sub {
    font: 600 13px/1.5 'Archivo', sans-serif;
    color: #5a6188; margin: 5px 0 0; max-width: 38ch;
  }
  .me-hero-actions {
    display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;
  }
  @keyframes meHeroIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) { .me-hero { animation: none; } }

  /* Zone corps sous le hero */
  .me-body {
    padding: 16px 16px 0;
  }

  /* Header (legacy, conservé pour drill) */
  .me-hd { margin-bottom: 24px; }
  .me-h1 {
    font: 700 24px/1.2 var(--ens-display, 'Archivo'), sans-serif;
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -0.02em;
  }
  .me-sub {
    font: 500 13px/1.4 'Archivo', sans-serif;
    color: var(--mu2);
    margin: 0;
  }

  /* Search */
  .me-search-wrap {
    position: relative;
    margin-bottom: 16px;
  }
  .me-search-ico {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0a6b4;
    font-size: 15px;
    pointer-events: none;
  }
  .me-search {
    width: 100%;
    padding: 12px 12px 12px 40px;
    background: #fff;
    border: 1px solid #e6e9ef;
    border-radius: 13px;
    font: 600 16px/1 'Archivo', sans-serif; /* 16px min : sinon iOS zoome au focus */
    color: #1a1f2b;
    outline: none;
    transition: border-color .15s ease, box-shadow .15s ease;
    box-sizing: border-box;
  }
  .me-search::placeholder { color: #a0a6b4; }
  .me-search:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.12); }
  .me-search::-webkit-search-cancel-button { -webkit-appearance: none; appearance: none; }
  .me-search-clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px; height: 22px;
    border: none;
    background: #e6e9ef;
    border-radius: 50%;
    color: #6b7280;
    font-size: 12px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-family: inherit;
    flex-shrink: 0;
  }
  .me-search-clear::before { content: ''; position: absolute; inset: -11px; }
  .me-search-clear.visible { display: flex; }

  /* ── Pipeline : groupes par statut ── */
  .me-pipeline {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* En-tête de groupe */
  .me-grp-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 2px 6px;
    font: 800 11px/1 'Archivo', sans-serif;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .me-grp-head .me-grp-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .me-grp-head .me-grp-count {
    margin-left: auto;
    font: 800 11px/1 'Archivo', sans-serif;
    letter-spacing: 0;
    color: #5f6788;
  }

  /* Couleurs par groupe */
  .me-grp-head--prevu  { color: #1d4ed8; }
  .me-grp-head--pret   { color: #15803d; }
  .me-grp-head--appr   { color: #b45309; }
  .me-grp-head--rel    { color: #b91c1c; }
  .me-grp-head--cours  { color: #6b7280; }
  .me-grp-head--repass { color: #c2410c; }
  /* Reçus = OR (DA moniteur unifiée : un permis obtenu est SON trophée) */
  .me-grp-head--recu   { color: #a16207; }

  /* Bande blanche contenant les lignes */
  .me-band {
    background: #fff;
    border: 1px solid #e6e9ef;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px -4px rgba(26,31,43,.1);
  }
  /* Liseré gauche coloré selon le groupe */
  .me-band--prevu { box-shadow: inset 3px 0 0 #2563eb, 0 2px 8px -4px rgba(26,31,43,.08); }
  .me-band--pret  { box-shadow: inset 3px 0 0 #16a34a, 0 2px 8px -4px rgba(26,31,43,.08); }
  .me-band--appr  { box-shadow: inset 3px 0 0 #f59e0b, 0 2px 8px -4px rgba(26,31,43,.08); }
  .me-band--rel   { box-shadow: inset 3px 0 0 #ef4444, 0 2px 8px -4px rgba(26,31,43,.08); }
  .me-band--cours { box-shadow: inset 3px 0 0 #d1d5db, 0 2px 8px -4px rgba(26,31,43,.08); }
  .me-band--repass{ box-shadow: inset 3px 0 0 #ea580c, 0 2px 8px -4px rgba(26,31,43,.08); }
  .me-band--recu  { box-shadow: inset 3px 0 0 #eab308, 0 2px 8px -4px rgba(26,31,43,.08); }

  /* Ligne élève dans la bande */
  .me-row {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 13px 14px 13px 16px;
    cursor: pointer;
    transition: background .12s ease;
    min-height: 56px;
    -webkit-tap-highlight-color: transparent;
  }
  .me-row + .me-row {
    border-top: 1px solid #f0f1f5;
  }
  @media (hover: hover) and (pointer: fine) {
    .me-row:hover { background: #fafbff; }
  }
  .me-row:active { background: #f3f4f8; transition: background 80ms ease; }
  @media (prefers-reduced-motion: reduce) { .me-row:active { background: #f3f4f8; } }
  .me-row:focus { outline: none; }
  .me-row:focus-visible { outline: 3px solid #4f46e5; outline-offset: -3px; }

  /* Avatar */
  .me-av {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font: 800 13px/1 'Archivo', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }

  /* Nom */
  .me-nom {
    flex: 0 1 auto;
    min-width: 0;
    font: 700 14px/1.2 'Archivo', sans-serif;
    color: #1a1f2b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Espace élastique : le nom (+ pastille provenance) hugge à gauche,
     la pastille d'état / valeur droite / ⋮ restent à droite. */
  .me-prov-sp { flex: 1 1 auto; min-width: 6px; }

  /* Valeur droite : progression ou jours inactif */
  .me-pr {
    font: 700 12px/1 'Archivo', sans-serif;
    color: #5f6788;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
  .me-pr--warn { color: #c2410c; }

  /* Bouton actions rapides */
  .me-more {
    flex-shrink: 0;
    align-self: center;
    width: 44px; height: 44px;
    margin-right: -4px;
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; border-radius: 8px;
    color: #a0a6b4; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background .12s, color .12s;
  }
  .me-more:hover { background: #f0f1f5; color: #1a1f2b; }
  .me-more:active { transform: scale(.9); }
  .me-more:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }

  /* Empty state */
  .me-empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--mu2);
    font: 500 14px/1.6 'Archivo', sans-serif;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .me-empty-ico {
    margin-bottom: 4px;
    display: block;
    opacity: .75;
  }

  /* Skeleton */
  .me-skel-list { display: flex; flex-direction: column; gap: 8px; }
  .me-skel-row {
    height: 72px;
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 16px;
    animation: skel-pulse 1.4s ease-in-out infinite;
  }
  @keyframes skel-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }

  /* Boutons header — ghost arcade (léger, ne concurrence pas le FAB) */
  .me-invite-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; min-height: 44px; border-radius: 999px;
    background: #fff; border: 1.5px solid #e6e9f7;
    color: #4f46e5; font: 700 12px/1 'Archivo', sans-serif;
    cursor: pointer; flex-shrink: 0;
    box-shadow: 0 3px 10px -6px rgba(60,50,130,.3);
    transition: background .12s, border-color .12s, transform .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .me-invite-btn:hover { background: #f3f1fc; }
  .me-invite-btn:active { background: #eae8ff; transform: scale(.96); }
  .me-invite-btn--go {
    background: #4f46e5; border-color: #4f46e5; color: #fff;
    box-shadow: 0 4px 0 0 #3a32c4;
  }
  .me-invite-btn--go:hover { background: #4338ca; }
  .me-invite-btn--go:active { box-shadow: 0 1px 0 0 #3a32c4; transform: translateY(2px) scale(.97); }

  /* Badges statut (conservés pour compatibilité openQuickMenu) */
  .me-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font: 700 11px/1 'Archivo', sans-serif;
    padding: 4px 9px; border-radius: 999px;
    flex-shrink: 0;
  }
  .me-badge.actif, .me-badge.pret { color: #fff; background: #16a34a; }
  .me-badge.inactif { color: var(--mu2); background: var(--bg2); }
  .me-badge.approche { color: #fff; background: #1d4ed8; }
  .me-badge.recu { color: #07150c; background: #16a34a; }
  .me-badge.planifie { color: #fff; background: #f59e0b; }
  .me-badge-relancer {
    font: 700 10px/1 'Archivo', sans-serif;
    padding: 4px 9px; border-radius: 999px;
    color: #fff; background: #f59e0b; flex-shrink: 0;
    display: inline-flex; align-items: center; gap: 3px;
  }

  /* ── En-tête « Pupitre » : recherche + 3 compteurs vivants (remplace le
     hero « à traiter en priorité » — chaque compteur est une porte) ── */
  .me-counters { display: flex; gap: 9px; margin: 0 0 16px; }
  .me-cnt {
    flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
    padding: 11px 12px 10px; border: 0; cursor: pointer; text-align: left;
    background: #fff; border-radius: 16px; font-family: 'Archivo', sans-serif;
    box-shadow: 0 6px 14px -8px rgba(60,50,160,.16), inset 0 0 0 1px #eceaf6;
    -webkit-tap-highlight-color: transparent; transition: transform .1s;
  }
  .me-cnt:active { transform: scale(.97); }
  .me-cnt .pg-med { margin: -2px 0 -1px; }
  .me-cnt-val { font: 800 19px/1 'Archivo', sans-serif; color: #1a1f2b; letter-spacing: -.01em; }
  .me-cnt-lbl { font: 800 9.5px/1.25 'Archivo', sans-serif; color: #9a99bb; text-transform: uppercase; letter-spacing: .06em; }
  .me-cnt--rel { box-shadow: 0 6px 14px -8px rgba(185,28,28,.2), inset 0 0 0 1.5px #f6d5d5; }
  .me-cnt--rel .me-cnt-val { color: #b91c1c; }
  .me-cnt--pret { box-shadow: 0 6px 14px -8px rgba(21,128,61,.2), inset 0 0 0 1.5px #cdebd6; }
  .me-cnt--pret .me-cnt-val { color: #15803d; }

  /* ── Onglets internes : Liste · Relances · Classement (1 porte, 3 salles) ── */
  .me-tabs {
    display: flex; gap: 5px; margin: 0 0 16px; padding: 5px;
    background: #e9eaf5; border-radius: 15px; position: sticky; top: 0; z-index: 40;
  }
  .me-tab {
    flex: 1; position: relative; border: 0; border-radius: 11px; padding: 10px 2px;
    min-height: 44px; cursor: pointer; text-align: center;
    font: 700 12.5px/1 'Archivo', sans-serif; letter-spacing: .1px;
    color: #6f6e92; background: transparent; transition: background .16s, color .16s;
    -webkit-tap-highlight-color: transparent;
  }
  .me-tab.on { background: #fff; color: #4f46e5; box-shadow: 0 2px 8px -3px rgba(60,50,160,.35); }
  .me-tab-bub {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 16px; height: 16px; margin-left: 5px; padding: 0 4px; border-radius: 999px;
    font: 800 9.5px/1 'Archivo', sans-serif; color: #fff;
    background: linear-gradient(180deg, #f87171, #dc2626);
    vertical-align: 2px;
  }
  .me-panel { display: none; }
  .me-panel.on { display: block; animation: mePanelIn .22s ease; }
  @keyframes mePanelIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .me-panel.on { animation: none; } }

  /* Bouton cloche sur une ligne « à relancer » (grouped view) → onglet Relances */
  .me-bell {
    width: 44px; height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    border-radius: 11px; margin-right: -4px; border: 0; cursor: pointer;
    color: #b45309; background: #fef3c7; box-shadow: inset 0 0 0 1px rgba(217,119,6,.25);
    -webkit-tap-highlight-color: transparent; transition: transform .1s;
  }
  .me-bell:active { transform: scale(.9); }

  /* ── Panneau Relances (embarque relances.js : cartes .rl-card) ── */
  .me-rl-intro {
    display: flex; align-items: center; gap: 11px; margin: 0 0 14px; padding: 12px 14px; border-radius: 16px;
    background: linear-gradient(155deg,#fff8ec,#fff3da); box-shadow: inset 0 0 0 1.5px rgba(217,119,6,.22);
  }
  .me-rl-intro .pg-med { flex-shrink: 0; }
  .me-rl-intro-t { font: 700 14px/1.2 'Archivo', sans-serif; color: #1a1c2e; }
  .me-rl-intro-s { font: 600 11px/1.4 'Archivo', sans-serif; color: #5a6188; margin-top: 2px; }
  .me-rl-panel .rl-card + .rl-card { margin-top: 12px; }
  .me-rl-empty { text-align: center; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .me-rl-empty-t { font: 800 16px/1.2 'Archivo', sans-serif; color: #1a1c2e; }
  .me-rl-empty-d { font: 500 13px/1.6 'Archivo', sans-serif; color: #5a6188; max-width: 30ch; }

  /* ── Panneau Classement (léger, raccord Pupitre — pas le skin Arène nuit) ── */
  .me-cl-seg { display: flex; gap: 4px; margin: 0 0 14px; padding: 4px; background: #eef0f6; border-radius: 13px; }
  .me-cl-seg button {
    flex: 1; min-height: 44px; padding: 8px 4px; border: 0; border-radius: 10px; background: transparent;
    color: #5a6188; font: 700 12px/1 'Archivo', sans-serif; cursor: pointer; -webkit-tap-highlight-color: transparent;
  }
  .me-cl-seg button.on { background: #fff; color: #4f46e5; box-shadow: 0 2px 6px -2px rgba(60,50,130,.25); }
  .me-cl-pod {
    display: flex; align-items: flex-end; justify-content: center; gap: 10px; margin: 0 0 18px;
    padding: 16px 12px 14px; border-radius: 20px;
    background: radial-gradient(110% 90% at 50% -14%, rgba(255,210,122,.28), transparent 58%), linear-gradient(165deg,#fffdf4,#fff 68%);
    box-shadow: 0 8px 18px -8px rgba(60,50,160,.14), inset 0 0 0 1.5px rgba(231,178,60,.35);
  }
  .me-cl-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .me-cl-col:active { transform: scale(.97); }
  .me-cl-crest {
    border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;
    box-shadow: inset 0 2px 5px rgba(0,0,0,.2);
  }
  .me-cl-col.first .me-cl-crest { box-shadow: inset 0 2px 5px rgba(0,0,0,.2), 0 0 0 2.5px rgba(255,210,122,.8), 0 6px 16px -6px rgba(232,163,23,.6); }
  .me-cl-nom { font: 700 11.5px/1.15 'Archivo', sans-serif; color: #1a1f2b; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .me-cl-score { font: 800 13px/1 'Archivo', sans-serif; color: #b5610a; }
  .me-cl-score small { font: 700 9.5px/1 'Archivo', sans-serif; color: #9a99bb; }
  .me-cl-rank { font: 800 11px/1 'Archivo', sans-serif; color: #fff; width: 22px; height: 22px; border-radius: 999px; display: flex; align-items: center; justify-content: center; margin-top: 2px; }
  .me-cl-rank.r1 { background: linear-gradient(180deg,#ffd27a,#e8a317); color: #5a3a08; }
  .me-cl-rank.r2 { background: linear-gradient(180deg,#e8edf5,#aab6c9); color: #3e4f63; }
  .me-cl-rank.r3 { background: linear-gradient(180deg,#ffd9ac,#c97b3d); color: #4d2708; }
  .me-cl-head { display: flex; align-items: center; gap: 9px; margin: 4px 0 8px; font: 800 10px/1 'Archivo', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #9a99bb; }
  .me-cl-head .rule { flex: 1; height: 1px; background: #e3e1f2; }
  .me-cl-band { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 18px -8px rgba(60,50,160,.14), inset 0 0 0 1px #eceaf6; }
  .me-cl-row { display: flex; align-items: center; gap: 11px; padding: 11px 14px; min-height: 52px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .me-cl-row + .me-cl-row { border-top: 1px solid #f2f1fa; }
  .me-cl-row:active { background: #fafbff; }
  .me-cl-pos { font: 800 13px/1 'Archivo', sans-serif; color: #9a99bb; width: 20px; text-align: center; flex-shrink: 0; }
  .me-cl-rnom { flex: 1; min-width: 0; font: 700 13.5px/1.2 'Archivo', sans-serif; color: #1a1f2b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .me-cl-flame { display: inline-flex; align-items: center; gap: 4px; font: 800 10.5px/1 'Archivo', sans-serif; color: #b45309; flex-shrink: 0; }
  .me-cl-flame.off { color: #9a99bb; }
  .me-cl-rscore { font: 800 13.5px/1 'Archivo', sans-serif; color: #5f6788; flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .me-cl-rscore small { font: 700 9.5px/1 'Archivo', sans-serif; color: #9a99bb; }
  .me-cl-hof {
    display: flex; align-items: center; gap: 10px; margin-top: 14px; padding: 12px 14px; border-radius: 16px;
    background: linear-gradient(160deg,#fffdf4,#fff6e2); box-shadow: inset 0 0 0 1.5px rgba(231,178,60,.4);
    cursor: pointer; -webkit-tap-highlight-color: transparent;
  }
  .me-cl-hof-t { flex: 1; min-width: 0; font: 700 13px/1.2 'Archivo', sans-serif; color: #1a1f2b; }
  .me-cl-hof-s { display: inline-flex; align-items: center; gap: 5px; font: 800 10.5px/1 'Archivo', sans-serif; color: #b5610a; flex-shrink: 0; }

  /* ── Tri segmenté (Par état / Nom / Progrès / Compétences / Engagement) ── */
  /* flex:1 0 auto → remplit si large, scrolle horizontalement si trop étroit (5 items). */
  .me-seg { display: flex; gap: 4px; padding: 4px; margin: 0 0 14px; background: #eef0f6; border-radius: 13px; overflow-x: auto; scrollbar-width: none; }
  .me-seg::-webkit-scrollbar { display: none; }
  .me-seg-btn { flex: 1 0 auto; min-height: 44px; padding: 8px 12px; border: 0; border-radius: 10px; background: transparent; color: #5a6188; font: 700 12px/1 'Archivo', sans-serif; cursor: pointer; transition: background .15s, color .15s, box-shadow .15s, transform .1s; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
  .me-seg-btn.on { background: #fff; color: #4f46e5; box-shadow: 0 2px 6px -2px rgba(60,50,130,.25); }
  .me-seg-btn:active { transform: scale(.96); }
  .me-seg-btn:focus-visible { outline: 2px solid #4f46e5; outline-offset: 1px; }

  /* ── Pastille d'état sur une ligne (vue triée à plat) ── */
  .me-pill { display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; font: 700 10.5px/1 'Archivo', sans-serif; padding: 4px 9px; border-radius: 999px; }
  .me-pill .pg-med { margin: -2px 0 -2px -2px; flex-shrink: 0; }
  .me-pill--pret  { color: #15803d; background: #dcfce7; }
  .me-pill--appr  { color: #b45309; background: #fef3c7; }
  .me-pill--rel   { color: #b91c1c; background: #fee2e2; }
  .me-pill--cours { color: #4b5563; background: #eef0f6; }
  .me-pill--prevu { color: #1d4ed8; background: #dbeafe; }
  .me-pill--repass{ color: #c2410c; background: #ffedd5; }
  .me-pill--recu  { color: #a16207; background: #fef9c3; }

  /* ── Engagement « vautour » : pastille couleur (coup d'œil) + étiquette texte ── */
  .me-engdot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-left: 1px; box-shadow: 0 0 0 2px #fff; }
  .me-eng { display: inline-flex; align-items: center; flex-shrink: 0; font: 800 10.5px/1 'Archivo', sans-serif; padding: 4px 9px; border-radius: 999px; white-space: nowrap; }
  .me-eng--det { color: #4338ca; background: #e0e7ff; }
  .me-eng--reg { color: #0e7490; background: #cffafe; }
  .me-eng--dec { color: #b45309; background: #fef3c7; }
  .me-eng--new { color: #64748b; background: #eef0f6; }
</style>`;

const INACTIF_SEUIL_MS = 14 * 86400000; // 14 jours

// « Prêt » pour l'examen = 100% des compétences de BASE (C1+C2+C3, 24
// sous-compétences). C4 (conduite autonome) ne conditionne pas la
// présentation au permis. Règle métier validée avec le moniteur.
const BASE_CATS = ["C1", "C2", "C3"];
const BASE_COMPS = REMC.filter((c) => BASE_CATS.includes(c.id)).flatMap((c) =>
  c.subs.map((s) => s.c),
);
const APPROCHE_SEUIL = 18; // < bases complètes mais bien avancé → en approche

/** Sous-compétences de base (C1-C3) non encore acquises. */
function baseManquantes(acquisSet) {
  return BASE_COMPS.filter((c) => !acquisSet.has(c));
}

/**
 * État de readiness d'un élève vis-à-vis de l'examen.
 *
 * TOUT examen enregistré est un état TERMINAL qui sort l'élève de la
 * formation active : reçu (obtenu), raté (à représenter), planifié (date
 * connue → on l'affiche, plus besoin de le dire « prêt »). Sans ça un élève
 * qui a déjà passé/planifié son examen restait classé « Prêts » (bug Imed).
 *
 * @param {Set<string>} acquisSet  compétences acquises (école)
 * @param {?string} examStatut     dernier examen : 'recu'|'rate'|'planifie'|null
 * @returns {'recu'|'rate'|'planifie'|'pret'|'en_approche'|'en_cours'}
 */
function computeReadiness(acquisSet, examStatut) {
  if (examStatut === "recu") return "recu";
  if (examStatut === "rate") return "rate";
  if (examStatut === "planifie") return "planifie";
  if (baseManquantes(acquisSet).length === 0) return "pret";
  if (acquisSet.size >= APPROCHE_SEUIL) return "en_approche";
  return "en_cours";
}

/** Liste des sous-compétences non encore acquises pour un élève. */
function missingComps(acquisSet) {
  const out = [];
  for (const cat of REMC) {
    for (const s of cat.subs) {
      if (!acquisSet.has(s.c)) out.push(s);
    }
  }
  return out;
}

/** Date du jour au format ISO court (YYYY-MM-DD). */
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Format court FR d'une date ISO d'examen (ex: "15 juin"). */
function fmtExamDate(iso) {
  if (!iso) return "planifié";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "planifié";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── State ───────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleves = []; // { id, prenom, nom, acquis, total, actif }
let _query = "";
let _sort = "etat"; // 'etat' (pipeline) | 'nom' | 'progres' | 'comp'
let _drillComp = null; // competence_id si mode drill bloque_sur

// ─── Hub à onglets (Liste · Relances · Classement) ────────────────
let _tab = "liste"; // 'liste' | 'relances' | 'classement'
let _clMode = "pratique"; // 'pratique' | 'theorie' (sous-mode Classement)
let _rankingCache = {}; // { pratique: {...}|null, theorie: {...}|null }

// ─── Entry point ─────────────────────────────────────────────────
export async function unmount() {
  document.querySelector(".me-qm")?.remove();
  document.querySelector(".me-miss")?.remove();
  document.querySelector(".me-confirm")?.remove();
  document.querySelector(".me-undo")?.remove();
}

/**
 * Détermine l'onglet actif + sous-mode Classement à partir du hash RÉEL —
 * pas seulement du `param` passé par le router (segments[1]). Les anciennes
 * routes top-level `#/relances` et `#/classement-eleves[/theorie]` restent
 * valides (notifs, liens existants — aujourdhui.js, profil.js…) et pointent
 * maintenant vers ce même module (router.js, alias) : elles n'ont pas de
 * segments[1] "relatif à /eleves", d'où la lecture directe du hash ici.
 */
function _parseHubRoute() {
  const raw = (window.location.hash || "").replace(/^#\/?/, "").split("?")[0];
  const segs = raw.split("/").filter(Boolean);
  const r0 = segs[0] || "eleves";
  if (r0 === "relances") return { tab: "relances", clMode: "pratique" };
  if (r0 === "classement-eleves") {
    return {
      tab: "classement",
      clMode: segs[1] === "theorie" ? "theorie" : "pratique",
    };
  }
  // r0 === "eleves" (route canonique du hub) — sous-chemin optionnel
  if (segs[1] === "relances") return { tab: "relances", clMode: "pratique" };
  if (segs[1] === "classement") {
    return {
      tab: "classement",
      clMode: segs[2] === "theorie" ? "theorie" : "pratique",
    };
  }
  return { tab: "liste", clMode: "pratique" };
}

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  _query = "";
  _sort = "etat";
  _drillComp = null;
  _rankingCache = {};

  // Lire le param bloque_sur depuis le hash URL (#/eleves?bloque_sur=C2a)
  const hash = window.location.hash;
  const qmark = hash.indexOf("?");
  if (qmark >= 0) {
    const params = new URLSearchParams(hash.slice(qmark + 1));
    _drillComp = params.get("bloque_sur") || null;
  }

  const parsed = _drillComp
    ? { tab: "liste", clMode: "pratique" }
    : _parseHubRoute();
  _tab = parsed.tab;
  _clMode = parsed.clMode;

  track("page.view", {
    page: "mes_eleves",
    role: _me.role,
    tab: _drillComp ? undefined : _tab,
    drill: _drillComp || undefined,
  });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="me-page anim-slide-up">
      <div class="me-hero">
        <div class="me-hero-content">
          <p class="me-hero-kicker">Chargement…</p>
          <h1 class="me-hero-title">${_drillComp ? `Bloqués sur ${esc(_drillComp)}` : "Mes élèves"}</h1>
        </div>
      </div>
      <div class="me-body">
        <div class="me-skel-list">
          ${[1, 2, 3, 4].map(() => `<div class="me-skel-row"></div>`).join("")}
        </div>
      </div>
    </div>
  `;

  if (_drillComp) {
    await loadDrillData(_drillComp);
    renderDrill();
    return;
  }

  const loaded = await loadData();
  if (!loaded) {
    root.innerHTML = `
      ${STYLE}
      <div class="me-page anim-slide-up">
        <div class="me-hero">
          <div class="me-hero-content">
            <p class="me-hero-kicker">Suivi des élèves</p>
            <h1 class="me-hero-title">« Mes élèves » indisponible</h1>
            <p class="me-hero-sub">Vérifie ta connexion puis réessaie.</p>
            <div class="me-hero-actions">
              <button id="me-retry" type="button">Réessayer</button>
            </div>
          </div>
        </div>
      </div>`;
    root
      .querySelector("#me-retry")
      ?.addEventListener("click", () => mount(root));
    return;
  }
  // Onglet Classement en entrée (deep-link/legacy) → charge AVANT le 1er
  // rendu pour éviter un flash « chargement » supplémentaire.
  if (_tab === "classement") await ensureRanking(_clMode);
  render();
  wire();
}

// PostgREST tronque en silence à 1000 lignes. À l'échelle école (validations,
// examens), on pagine par .range() jusqu'à épuisement — sinon compteurs et
// readiness faux dès ~33 livrets remplis. Renvoie la même forme {data, error}.
async function fetchAllRows(buildQuery) {
  const PAGE = 1000;
  let from = 0;
  const data = [];
  for (;;) {
    const { data: page, error } = await buildQuery().range(
      from,
      from + PAGE - 1,
    );
    if (error) return { data, error };
    data.push(...(page || []));
    if (!page || page.length < PAGE) return { data, error: null };
    from += PAGE;
  }
}

// ─── Data ────────────────────────────────────────────────────────
async function loadData() {
  // 1. Tous les élèves de mon auto-école (RLS multi-moniteurs : on voit tout le monde)
  //    Côté frontend on marquera ensuite les "attitrés" (enseignant_id = me.id)
  // Les 3 requêtes (élèves / validations / examens) sont indépendantes →
  // en parallèle (Promise.all) : le chargement = la plus lente, pas la somme.
  const [elevesRes, valsRes, examsRes, provMap, engRows, certifsRes] =
    await Promise.all([
      sb
        .from("profiles")
        .select("id, prenom, nom, enseignant_id, last_active_at, avatar_url")
        .eq("role", "eleve")
        .order("prenom"),
      fetchAllRows(() =>
        sb
          .from("validations")
          .select("eleve_id, competence_id, validated_at")
          .eq("statut", "acquis"),
      ),
      fetchAllRows(() =>
        sb
          .from("examens")
          .select("eleve_id, statut, date_examen, created_at")
          .order("created_at", { ascending: false }),
      ),
      // Provenance CRM (RLS = mes élèves) → Map(eleve_id → {label,color}).
      fetchProvenanceMap(),
      // Engagement « vautour » de tous mes élèves (RPC SECURITY DEFINER agrégée).
      // Best-effort : si la RPC n'est pas déployée, la liste marche sans étiquette.
      sb
        .rpc("get_eleves_engagement")
        .then((r) => {
          if (r.error) {
            console.error("[mes-eleves] engagement", r.error);
            return [];
          }
          return r.data || [];
        })
        .catch((error) => {
          console.error("[mes-eleves] engagement", error);
          return [];
        }),
      // Certifications faites par les élèves eux-mêmes. Depuis le pivot du
      // 17/07 c'est la voie NORMALE, plus un reliquat du mode solo. Elles
      // étaient absentes de cet écran : un élève qui certifiait vingt
      // compétences restait affiché à zéro chez son moniteur (audit 01/08).
      // Best-effort : si la lecture échoue, l'écran marche comme avant.
      fetchAllRows(() =>
        sb
          .from("self_validations")
          .select("eleve_id, competence_id, validated_at"),
      ).catch((error) => {
        console.error("[mes-eleves] certifications élèves", error);
        return { data: [], error: null };
      }),
    ]);
  const engMap = new Map();
  (engRows || []).forEach((r) => engMap.set(r.eleve_id, r));
  const { data: elevesRaw, error: e1 } = elevesRes;

  if (e1) {
    console.error("[mes-eleves] query error", e1);
    toast("Vérifie ta connexion puis réessaie.", "error");
    _eleves = [];
    return false;
  }

  if (!elevesRaw || elevesRaw.length === 0) {
    const {
      data: { session },
    } = await sb.auth.getSession();
    console.warn(
      "[mes-eleves] 0 élèves retournés. Session active:",
      !!session,
      "| CUR_USER:",
      _me?.id,
      "| auto_ecole_id:",
      _me?.auto_ecole_id,
    );
  }

  // Tag "attitré" sur chaque élève — affichage UI peut prioriser.
  // + provenance CRM (pastille nom/couleur) attachée ici → survit au spread.
  const rawList = (elevesRaw || []).map((e) => ({
    ...e,
    isMine: e.enseignant_id === _me.id,
    provenance: provMap.get(e.id) || null,
  }));

  // 2. Progression REMC réelle de chaque élève = TOTAL des compétences acquises
  //    (peu importe le moniteur validateur — auto-école multi-moniteurs).
  //    La barre "X/31" doit refléter l'avancement permis de l'élève, pas la
  //    seule contribution du moniteur courant (sinon 0/31 trompeur pour un
  //    élève suivi par un collègue). RLS partage déjà les validations école.
  const { data: valsRaw, error: e2 } = valsRes;
  const { data: examsRaw, error: e3 } = examsRes;
  if (e2 || e3) {
    console.error("[mes-eleves] données de progression", {
      validations: e2 || null,
      examens: e3 || null,
    });
    toast("Progression des élèves indisponible. Réessaie.", "error");
    _eleves = [];
    return false;
  }

  // Map : eleve_id → Set des competence_id acquis (total école).
  // Le Set alimente à la fois le count et la liste des compétences manquantes.
  // recentByEleve = nb de validations sur les 21 derniers jours → alimente le
  // tri « Progrès récent » (réel : des validations datées, pas l'activité app).
  const RECENT_MS = 21 * 86400000;
  const nowRecent = Date.now();
  const acquisSetByEleve = {};
  const recentByEleve = {};
  // Les deux sources comptent. La validation du moniteur reste la sienne, la
  // certification de l'élève est marquée à part pour qu'il sache d'où elle vient.
  const certifSetByEleve = {};
  const ajouter = (v, parEleve) => {
    if (!v.competence_id) return;
    const set = (acquisSetByEleve[v.eleve_id] ||= new Set());
    const nouvelle = !set.has(v.competence_id);
    set.add(v.competence_id);
    if (parEleve)
      (certifSetByEleve[v.eleve_id] ||= new Set()).add(v.competence_id);
    if (
      nouvelle &&
      v.validated_at &&
      nowRecent - new Date(v.validated_at).getTime() <= RECENT_MS
    ) {
      recentByEleve[v.eleve_id] = (recentByEleve[v.eleve_id] || 0) + 1;
    }
  };
  (valsRaw || []).forEach((v) => ajouter(v, false));
  (certifsRes?.data || []).forEach((v) => ajouter(v, true));

  // 3. Dernier examen par élève (le plus récent fait foi).
  const lastExamByEleve = {};
  (examsRaw || []).forEach((ex) => {
    // ordonné desc → la première ligne vue par élève est la plus récente
    if (!lastExamByEleve[ex.eleve_id]) lastExamByEleve[ex.eleve_id] = ex;
  });

  // Set des élèves ayant au moins 1 compétence acquise
  const touchedEleves = new Set(Object.keys(acquisSetByEleve));

  const now = Date.now();
  _eleves = rawList
    .map((e, i) => {
      const acquisSet = acquisSetByEleve[e.id] || new Set();
      const acquis = acquisSet.size;
      const actif = touchedEleves.has(e.id) || !!e.last_active_at;
      const lastActive = e.last_active_at
        ? new Date(e.last_active_at).getTime()
        : null;
      const aRelancer =
        actif && (!lastActive || now - lastActive >= INACTIF_SEUIL_MS);
      const joursInactif = lastActive
        ? Math.floor((now - lastActive) / 86400000)
        : null;
      const lastExam = lastExamByEleve[e.id] || null;
      const examStatut = lastExam ? lastExam.statut : null;
      const examDate = lastExam ? lastExam.date_examen : null;
      return {
        ...e,
        acquis,
        acquisSet,
        // Celles que l'élève a certifiées lui-même, pour l'afficher comme tel.
        certifSet: certifSetByEleve[e.id] || new Set(),
        recentAcquis: recentByEleve[e.id] || 0,
        total: REMC_TOTAL,
        actif,
        idx: i,
        aRelancer,
        joursInactif,
        examStatut,
        examDate,
        readiness: computeReadiness(acquisSet, examStatut),
        engagement: engMap.get(e.id) || null,
      };
    })
    // Mes élèves attitrés en haut, puis ceux que j'ai déjà validé, puis le reste
    .sort((a, b) => {
      if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
      if (touchedEleves.has(a.id) !== touchedEleves.has(b.id))
        return touchedEleves.has(a.id) ? -1 : 1;
      return (a.prenom || "").localeCompare(b.prenom || "");
    });
  return true;
}

// ─── Drill mode : élèves bloqués sur une compétence ──────────────
let _drillEleves = [];

async function loadDrillData(compId) {
  try {
    const { data, error } = await sb.rpc("get_eleves_bloque_sur_competence", {
      p_competence_id: compId,
      p_window_days: 30,
    });
    if (error) throw error;
    _drillEleves = data || [];
  } catch (e) {
    console.error("[mes-eleves] drill load error", e);
    _drillEleves = [];
    toast("Vérifie ta connexion puis réessaie.", "error");
  }
}

function renderDrill() {
  const page = _root.querySelector(".me-page");
  if (!page) return;

  const count = _drillEleves.length;
  page.innerHTML = `
    <div class="me-body">
    <header class="me-hd" style="margin-bottom:4px;">
      <div>
        <h1 class="me-h1" style="display:flex;align-items:center;gap:8px;font-size:17px;">
          ${icon("search", { size: 16, strokeWidth: 2.2, color: "var(--a)" })}
          Bloqués. Compétence ${esc(_drillComp)}
        </h1>
        <p class="me-sub">${count} élève${count !== 1 ? "s" : ""} en difficulté · 30 derniers jours</p>
      </div>
    </header>
    <button class="me-drill-back" id="me-drill-back"
            style="display:flex;align-items:center;gap:6px;margin-bottom:16px;padding:8px 12px;background:var(--su);border:1.5px solid var(--bo);border-radius:var(--ens-r,10px);font:600 13px/1 var(--ens-body,'Archivo'),sans-serif;color:var(--a-txt);cursor:pointer;min-height:44px;">
      ${icon("arrow-left", { size: 14, strokeWidth: 2.5 })} Tous mes élèves
    </button>
    <div class="me-list">
      ${
        count === 0
          ? `<div class="me-empty">
               ${illus("route", { size: 72 })}
               Aucun élève bloqué sur cette compétence ces 30 derniers jours.
             </div>`
          : _drillEleves
              .map((e) => {
                // La RPC get_eleves_bloque_sur_competence renvoie eleve_id /
                // eleve_prenom / eleve_nom / n_fails (PAS id/prenom/nom/jours_bloque).
                const nm = esc(
                  fmtName(
                    `${e.eleve_prenom || ""} ${e.eleve_nom || ""}`.trim(),
                  ),
                );
                // Mêmes classes que renderBandRow (.me-av/.me-nom/.me-pr) —
                // sinon nom et méta non stylés (les classes .me-ava/.me-info/
                // .me-name/.me-meta/.me-eleve-chev n'existent pas dans le CSS).
                return `
              <div class="me-row" data-eleve-id="${escAttr(e.eleve_id)}" role="button" tabindex="0">
                <div class="me-av" style="flex-shrink:0">${renderUserAvatar({ prenom: e.eleve_prenom, nom: e.eleve_nom }, 36)}</div>
                <span class="me-nom">${nm}</span>
                <span class="me-prov-sp"></span>
                ${e.n_fails ? `<span class="me-pr me-pr--warn">${e.n_fails} échec${e.n_fails > 1 ? "s" : ""} récent${e.n_fails > 1 ? "s" : ""}</span>` : ""}
              </div>
            `;
              })
              .join("")
      }
    </div>
    </div><!-- /.me-body -->
  `;

  // Back button
  _root.querySelector("#me-drill-back")?.addEventListener("click", () => {
    navigate("#/eleves");
  });

  // Row click → livret
  _root.querySelectorAll(".me-row[data-eleve-id]").forEach((row) => {
    row.addEventListener("click", () => {
      haptic("impact");
      track("drill.eleve.open", {
        eleve_id: row.dataset.eleveId,
        comp: _drillComp,
      });
      navigate(`#/livret/${row.dataset.eleveId}`);
    });
  });
}

// ─── Render (hub) ────────────────────────────────────────────────
function render() {
  const roster = _eleves.filter((e) => e.readiness !== "recu");
  const total = roster.length;

  _root.innerHTML = `
    ${STYLE}${RL_STYLE}
    <div class="me-page anim-slide-up">

      <div class="me-control-col">
      <!-- Hero « Pupitre » -->
      <div class="me-hero">
        <div class="me-hero-content">
          <p class="me-hero-kicker">Mes élèves</p>
          <h1 class="me-hero-title">${total === 0 ? "Aucun élève" : `${total} élève${total > 1 ? "s" : ""}`}</h1>
          <div class="me-hero-actions">
            <button id="me-invite-btn" class="me-invite-btn me-invite-btn--go" type="button"
                    aria-label="Inviter un élève">
              ${icon("user-plus", { size: 14, strokeWidth: 2.2 })} Inviter
            </button>
          </div>
        </div>
      </div>

      <div class="me-body">

      <div class="me-control">
      <div class="me-search-wrap">
        <span class="me-search-ico">${icon("search", { size: 15, strokeWidth: 2, color: "#a0a6b4" })}</span>
        <input
          class="me-search"
          type="search"
          placeholder="Chercher un élève…"
          value="${escAttr(_query)}"
          autocomplete="off"
          aria-label="Chercher un élève par nom ou prénom"
        />
        <button class="me-search-clear${_query ? " visible" : ""}" id="me-search-clear" type="button" aria-label="Effacer la recherche">x</button>
      </div>

      ${renderCounters(roster)}

      <div class="me-tabs" role="tablist" aria-label="Sections Mes élèves">
        ${renderTabButtons()}
      </div>

      <div class="me-seg" id="me-seg" role="group" aria-label="Trier les élèves"${_tab === "liste" ? "" : " hidden"}>
        <button class="me-seg-btn ${_sort === "etat" ? "on" : ""}" data-sort="etat" type="button" aria-pressed="${_sort === "etat"}">Par état</button>
        <button class="me-seg-btn ${_sort === "nom" ? "on" : ""}" data-sort="nom" type="button" aria-pressed="${_sort === "nom"}">Nom</button>
        <button class="me-seg-btn ${_sort === "progres" ? "on" : ""}" data-sort="progres" type="button" aria-pressed="${_sort === "progres"}">Progrès</button>
        <button class="me-seg-btn ${_sort === "comp" ? "on" : ""}" data-sort="comp" type="button" aria-pressed="${_sort === "comp"}">Compétences</button>
        <button class="me-seg-btn ${_sort === "engagement" ? "on" : ""}" data-sort="engagement" type="button" aria-pressed="${_sort === "engagement"}">Engagement</button>
      </div>
      </div><!-- /.me-control -->
      </div><!-- /.me-body -->
      </div><!-- /.me-control-col -->

      <div class="me-body me-list-body">
      <div class="me-list-col">
      <div class="me-panel${_tab === "liste" ? " on" : ""}" data-panel="liste" id="me-panel-liste">
        <div class="me-pipeline" id="me-pipeline">
          ${renderContent()}
        </div>
      </div>

      <div class="me-panel${_tab === "relances" ? " on" : ""}" data-panel="relances" id="me-panel-relances">
        ${_tab === "relances" ? relancesPanelHtml() : ""}
      </div>

      <div class="me-panel${_tab === "classement" ? " on" : ""}" data-panel="classement" id="me-panel-classement">
        ${_tab === "classement" ? classementBodyHtml(_rankingCache[_clMode]) : ""}
      </div>
      </div><!-- /.me-list-col -->

      </div><!-- /.me-body -->
    </div><!-- /.me-page -->

  `;
}

// ─── Compteurs vivants (remplacent le hero « à traiter en priorité ») ────
// Chaque compteur est une porte : « à relancer » → onglet Relances,
// « prêts exam » → Liste triée par état, scrollée sur la bande Prêts.
function renderCounters(roster) {
  const total = roster.length;
  const relancer = getCooling().length;
  const prets = roster.filter(
    (e) => e.readiness === "pret" && !e.aRelancer,
  ).length;
  return `
    <div class="me-counters">
      <button class="me-cnt" type="button" data-goto="liste">
        ${medallion("eleves", "indigo", { size: 24 })}
        <span class="me-cnt-val">${total}</span>
        <span class="me-cnt-lbl">élève${total > 1 ? "s" : ""} en formation</span>
      </button>
      <button class="me-cnt me-cnt--rel" type="button" data-goto="relances">
        ${medallion("cloche", "orange", { size: 24 })}
        <span class="me-cnt-val">${relancer}</span>
        <span class="me-cnt-lbl">à relancer</span>
      </button>
      <button class="me-cnt me-cnt--pret" type="button" data-goto="pret">
        ${medallion("check", "green", { size: 24 })}
        <span class="me-cnt-val">${prets}</span>
        <span class="me-cnt-lbl">prêt${prets > 1 ? "s" : ""} exam</span>
      </button>
    </div>`;
}

function renderTabButtons() {
  const relCount = getCooling().length;
  const tabs = [
    { id: "liste", label: "Liste" },
    { id: "relances", label: "Relances" },
    { id: "classement", label: "Classement" },
  ];
  return tabs
    .map(
      (t) => `
    <button class="me-tab${_tab === t.id ? " on" : ""}" data-tab="${t.id}" role="tab" aria-selected="${_tab === t.id}">
      ${esc(t.label)}${t.id === "relances" && relCount > 0 ? `<span class="me-tab-bub">${relCount}</span>` : ""}
    </button>`,
    )
    .join("");
}

// ─── État → pastille (vue triée à plat) ──────────────────────────
const READINESS_PILL = {
  pret: { cls: "pret", label: "Prêt" },
  en_approche: { cls: "appr", label: "En approche" },
  planifie: { cls: "prevu", label: "Examen prévu" },
  rate: { cls: "repass", label: "À repasser" },
  recu: { cls: "recu", label: "Reçu" },
  en_cours: { cls: "cours", label: "En cours" },
};
function pillFor(e) {
  // « à relancer » prime sur l'état de progression (sauf examen terminal)
  if (
    e.aRelancer &&
    e.readiness !== "recu" &&
    e.readiness !== "rate" &&
    e.readiness !== "planifie"
  ) {
    return {
      cls: "rel",
      label:
        e.joursInactif != null ? `Inactif ${e.joursInactif} j` : "À relancer",
    };
  }
  return READINESS_PILL[e.readiness] || READINESS_PILL.en_cours;
}

// Mini-médaillon 20px pour les 3 états clés (prêt / en approche / refroidi).
// On ne médaillonne que ceux-là : les autres restent des chips texte sobres.
const PILL_MED = {
  pret: ["check", "green"],
  appr: ["horloge", "blue"],
  rel: ["lune", "slate"],
};
function pillMed(cls) {
  const m = PILL_MED[cls];
  return m ? medallion(m[0], m[1], { size: 20 }) : "";
}

// ─── Engagement « vautour » : niveau + pastille (déterminé/régulier/décroche) ──
// Alimenté par get_eleves_engagement (RPC). rank = ordre de tri (motivés en tête).
const ENG_TIER = {
  determine: { cls: "det", label: "Déterminé", dot: "#4f46e5", rank: 0 },
  regulier: { cls: "reg", label: "Régulier", dot: "#0e7490", rank: 1 },
  decroche: { cls: "dec", label: "Décroche", dot: "#d97706", rank: 2 },
  nouveau: { cls: "new", label: "Nouveau", dot: "#9aa3b2", rank: 3 },
};
function engMeta(e) {
  return (e.engagement && ENG_TIER[e.engagement.tier]) || null;
}
// Petite pastille couleur (coup d'œil) — masquée pour « nouveau » (aucune donnée).
function engDot(e) {
  const m = engMeta(e);
  if (!m || e.engagement.tier === "nouveau") return "";
  return `<span class="me-engdot" style="background:${m.dot}" title="${escAttr(m.label)}" aria-label="Engagement : ${escAttr(m.label)}"></span>`;
}
// Étiquette texte complète (vue triée « Engagement »).
function engPill(e) {
  const m = engMeta(e);
  if (!m) return "";
  return `<span class="me-eng me-eng--${m.cls}">${esc(m.label)}</span>`;
}

// ─── Contenu : pipeline (par état) ou liste triée à plat ─────────
function renderContent() {
  return _sort === "etat" ? renderPipeline() : renderRosterFlat();
}

// Liste à plat triée (Nom / Progrès récent / % compétences) — réutilise les
// lignes du pipeline (wireRows reste valable), avec une pastille d'état.
function renderRosterFlat() {
  const q = _query.toLowerCase().trim();
  const match = (e) =>
    !q ||
    (e.prenom || "").toLowerCase().includes(q) ||
    (e.nom || "").toLowerCase().includes(q);
  let list = _eleves.filter(match);

  if (list.length === 0 && _eleves.length === 0) {
    return `<div class="me-empty">
      <span class="me-empty-ico">${illus("school", { size: 80 })}</span>
      <strong style="font:800 16px/1.2 'Archivo',sans-serif;color:#1a1f2b">Aucun élève pour l’instant</strong>
      <button id="me-invite-empty-btn" class="ens-btn ens-btn--go" type="button" style="margin-top:4px;min-height:48px;padding:0 24px;font-size:14px;">
        ${icon("user-plus", { size: 15, strokeWidth: 2.2 })} Inviter mon premier élève
      </button>
    </div>`;
  }
  if (list.length === 0 && q) {
    return `<div class="me-empty"><span class="me-empty-ico">${illus("route", { size: 64 })}</span>Aucun résultat pour <strong>« ${esc(_query)} »</strong>.</div>`;
  }

  if (_sort === "nom") {
    list = [...list].sort((a, b) =>
      (a.prenom || "").localeCompare(b.prenom || "", "fr"),
    );
  } else if (_sort === "comp") {
    list = [...list].sort((a, b) => b.acquis - a.acquis);
  } else if (_sort === "engagement") {
    // Motivés en tête (déterminé → régulier → décroche → nouveau), puis le plus
    // régulier (jours actifs 14 j), puis le plus récemment actif.
    const rank = (e) => (engMeta(e) ? ENG_TIER[e.engagement.tier].rank : 3);
    const ad = (e) => (e.engagement ? e.engagement.active_days_14 || 0 : 0);
    const ds = (e) =>
      e.engagement && e.engagement.days_since != null
        ? e.engagement.days_since
        : 9999;
    list = [...list].sort(
      (a, b) => rank(a) - rank(b) || ad(b) - ad(a) || ds(a) - ds(b),
    );
  } else {
    // progrès récent (validations 21 j), avancement global en départage
    list = [...list].sort(
      (a, b) =>
        (b.recentAcquis || 0) - (a.recentAcquis || 0) || b.acquis - a.acquis,
    );
  }
  return `<div class="me-band" role="list">${list.map((e) => renderBandRow(e, { withPill: true })).join("")}</div>`;
}

// ─── Pipeline segmenté ───────────────────────────────────────────
/**
 * Construit le HTML des sections pipeline à partir de la liste filtrée
 * par la recherche (le filtre de recherche s'applique à tous les groupes).
 */
function renderPipeline() {
  const q = _query.toLowerCase().trim();
  const matchQuery = (e) =>
    !q ||
    (e.prenom || "").toLowerCase().includes(q) ||
    (e.nom || "").toLowerCase().includes(q);

  const allVisible = _eleves.filter(matchQuery);

  if (allVisible.length === 0 && _eleves.length === 0) {
    return `<div class="me-empty">
      <span class="me-empty-ico">${illus("school", { size: 80 })}</span>
      <strong style="font:800 16px/1.2 'Archivo',sans-serif;color:#1a1f2b">Aucun élève pour l’instant</strong>
      <span style="font:500 13px/1.5 'Archivo',sans-serif;color:#5f6788;max-width:30ch;text-align:center">Envoie un lien par SMS ou WhatsApp. Ton élève crée son compte en 30 secondes.</span>
      <button id="me-invite-empty-btn" class="ens-btn ens-btn--go" type="button" style="margin-top:4px;min-height:48px;padding:0 24px;font-size:14px;">
        ${icon("user-plus", { size: 15, strokeWidth: 2.2 })} Inviter mon premier élève
      </button>
    </div>`;
  }

  if (allVisible.length === 0 && q) {
    return `<div class="me-empty">
      <span class="me-empty-ico">${illus("route", { size: 64 })}</span>
      Aucun résultat pour <strong>« ${esc(_query)} »</strong>.
    </div>`;
  }

  // États d'examen terminaux (prévu / raté / reçu) : on les teste à part pour
  // qu'un élève n'apparaisse JAMAIS dans deux bandes (les filtres sont exclusifs).
  const examTermine = (e) =>
    e.readiness === "recu" ||
    e.readiness === "rate" ||
    e.readiness === "planifie";

  const groups = [
    {
      key: "prevu",
      mod: "prevu",
      color: "#2563eb",
      label: "Examen prévu",
      filter: (e) => e.readiness === "planifie",
    },
    {
      key: "pret",
      mod: "pret",
      color: "#16a34a",
      label: "Prêts",
      filter: (e) => e.readiness === "pret" && !e.aRelancer,
    },
    {
      key: "appr",
      mod: "appr",
      color: "#f59e0b",
      label: "En approche",
      filter: (e) => e.readiness === "en_approche" && !e.aRelancer,
    },
    {
      key: "rel",
      mod: "rel",
      color: "#ef4444",
      label: "À relancer",
      filter: (e) => e.aRelancer && !examTermine(e),
      // La cloche (au lieu du ⋮) saute directement vers l'onglet Relances.
      bell: true,
    },
    {
      key: "cours",
      mod: "cours",
      color: "#d1d5db",
      label: "En cours",
      filter: (e) => e.readiness === "en_cours" && !e.aRelancer,
    },
    {
      key: "repass",
      mod: "repass",
      color: "#ea580c",
      label: "À repasser",
      filter: (e) => e.readiness === "rate",
    },
    {
      key: "recu",
      mod: "recu",
      color: "#eab308",
      label: "Reçus",
      filter: (e) => e.readiness === "recu",
    },
  ];

  return groups
    .map(({ key, mod, color, label, filter, bell }) => {
      const list = allVisible.filter(filter);
      if (list.length === 0) return "";
      return `
        <div class="me-grp" data-grp="${key}">
          <div class="me-grp-head me-grp-head--${mod}" aria-label="${escAttr(label)} (${list.length})">
            <span class="me-grp-dot" style="background:${color}"></span>
            ${esc(label)}
            <span class="me-grp-count">${list.length}</span>
          </div>
          <div class="me-band me-band--${mod}" role="list">
            ${list.map((e) => renderBandRow(e, { bell })).join("")}
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * Ligne d'un élève dans une bande du pipeline.
 * @param {object} eleve
 * @param {{withPill?:boolean, bell?:boolean}} opts
 *   `bell` : remplace le ⋮ par une cloche qui saute vers l'onglet Relances
 *   (bande « À relancer » du pipeline uniquement — maquette Pupitre).
 */
function renderBandRow(eleve, opts = {}) {
  const { withPill = false, bell = false } = opts;
  // escAttr : `fullNom` est aussi injecté dans aria-label (esc n'encode pas les
  // guillemets → injection d'attribut via nom d'élève). Correct aussi en texte.
  const fullNom = escAttr(
    fmtName([eleve.prenom, eleve.nom].filter(Boolean).join(" ")) || "—",
  );

  // Valeur droite : état d'examen prioritaire (prévu/raté), puis inactivité,
  // sinon l'avancement X/31. Les états d'examen priment pour que l'info la plus
  // forte (« il a déjà passé / une date est posée ») ne soit jamais masquée.
  let rightLabel = "";
  let rightClass = "me-pr";
  if (eleve.readiness === "planifie") {
    rightLabel = eleve.examDate ? fmtExamDate(eleve.examDate) : "prévu";
  } else if (eleve.readiness === "rate") {
    rightLabel = "à repasser";
    rightClass = "me-pr me-pr--warn";
  } else if (eleve.aRelancer && eleve.readiness !== "recu") {
    const j = eleve.joursInactif;
    rightLabel = j != null ? `inactif ${j} j` : "inactif";
    rightClass = "me-pr me-pr--warn";
  } else {
    rightLabel = `${eleve.acquis}/${eleve.total}`;
  }

  // Vue triée à plat : pastille d'état (ou d'engagement dans le tri « Engagement »)
  // + valeur droite = avancement X/31.
  let pillHtml = "";
  if (withPill) {
    if (_sort === "engagement" && engMeta(eleve)) {
      pillHtml = engPill(eleve);
    } else {
      const p = pillFor(eleve);
      pillHtml = `<span class="me-pill me-pill--${p.cls}">${pillMed(p.cls)}${esc(p.label)}</span>`;
    }
    rightLabel = `${eleve.acquis}/${eleve.total}`;
    rightClass = "me-pr";
  }

  return `
    <div class="me-row" data-eleve-id="${escAttr(eleve.id)}" role="listitem" tabindex="0"
         aria-label="Ouvrir le livret de ${fullNom}. ${eleve.acquis}/${eleve.total} competences acquises${eleve.readiness === "recu" ? ", examen reussi" : eleve.readiness === "rate" ? ", examen a repasser" : eleve.readiness === "planifie" ? ", examen prevu" : eleve.readiness === "pret" ? ", pret pour l'examen" : eleve.aRelancer ? ", a relancer" : ""}">
      <div class="me-av" style="flex-shrink:0">${renderUserAvatar({ avatar_url: eleve.avatar_url, prenom: eleve.prenom, nom: eleve.nom }, 36)}</div>
      <span class="me-nom">${fullNom}</span>
      ${engDot(eleve)}
      ${provenanceBadge(eleve.provenance)}
      <span class="me-prov-sp"></span>
      ${pillHtml}
      <span class="${rightClass}">${esc(rightLabel)}</span>
      ${
        bell && !withPill
          ? `<button class="me-bell" data-bell type="button"
              aria-label="Relancer ${fullNom}">${icon("bell", { size: 16, strokeWidth: 2.2 })}</button>`
          : `<button class="me-more" data-more type="button"
              aria-label="Actions rapides pour ${fullNom}">${icon("more-vertical", { size: 16, strokeWidth: 2 })}</button>`
      }
    </div>
  `;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire() {
  _root
    .querySelector("#me-invite-btn")
    ?.addEventListener("click", () => openInviteEleveModal(_me));

  // Onglets internes (Liste · Relances · Classement)
  _root.querySelectorAll(".me-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      if (tab === _tab) return;
      switchTab(tab);
    });
  });

  // Compteurs vivants — chacun est une porte vers un onglet
  _root.querySelectorAll(".me-cnt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const goto = btn.dataset.goto;
      track("mes_eleves.counter.click", { goto });
      if (goto === "relances") {
        switchTab("relances");
      } else if (goto === "pret") {
        if (_sort !== "etat") {
          _sort = "etat";
          _root.querySelectorAll("#me-seg .me-seg-btn").forEach((b) => {
            const on = b.dataset.sort === "etat";
            b.classList.toggle("on", on);
            b.setAttribute("aria-pressed", String(on));
          });
          renderList();
        }
        switchTab("liste", { scrollToGrp: "pret" });
      } else {
        switchTab("liste");
      }
    });
  });

  // Tri segmenté (Par état / Nom / Progrès / Compétences)
  _root.querySelectorAll("#me-seg .me-seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = btn.dataset.sort;
      if (s === _sort) return;
      _sort = s;
      haptic("tap");
      track("mes_eleves.sort", { sort: s });
      _root.querySelectorAll("#me-seg .me-seg-btn").forEach((b) => {
        const on = b.dataset.sort === s;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderList();
    });
  });

  // Bouton CTA dans l'état vide (0 élève)
  _root.querySelector("#me-invite-empty-btn")?.addEventListener("click", () => {
    track("invite.empty.header.clicked");
    openInviteEleveModal(_me);
  });

  // Recherche — filtre transversal tous les groupes du pipeline (onglet Liste)
  const searchEl = _root.querySelector(".me-search");
  const clearBtn = _root.querySelector("#me-search-clear");
  searchEl?.addEventListener("input", (e) => {
    _query = e.target.value;
    clearBtn?.classList.toggle("visible", _query.length > 0);
    renderList();
  });
  clearBtn?.addEventListener("click", () => {
    _query = "";
    if (searchEl) searchEl.value = "";
    clearBtn.classList.remove("visible");
    searchEl?.focus();
    renderList();
  });

  // Cards
  wireRows();

  // Panneau initialement actif (Relances/Classement rendus inline dans
  // render() quand ils sont l'onglet d'entrée) — on les câble ici une fois.
  if (_tab === "relances") {
    wireRelanceCards(_root.querySelector("#me-panel-relances"));
  } else if (_tab === "classement") {
    const panel = _root.querySelector("#me-panel-classement");
    if (panel) wireClassementPanel(panel);
  }
}

// ─── Bascule d'onglet (Liste · Relances · Classement) ────────────
// Ne recharge que l'onglet actif (les 2 autres au premier accès) et
// synchronise le hash (#/eleves[/relances|/classement[/theorie]]) SANS
// remonter la page (history.replaceState — pas de hashchange déclenché).
function switchTab(tab, opts = {}) {
  const changed = tab !== _tab;
  if (changed) {
    _tab = tab;
    haptic("select");
    track("mes_eleves.tab", { tab });
  }
  _syncHash();

  _root.querySelectorAll(".me-tab").forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", String(on));
  });
  _root.querySelectorAll(".me-panel").forEach((p) => {
    p.classList.toggle("on", p.dataset.panel === tab);
  });
  const seg = _root.querySelector("#me-seg");
  if (seg) seg.hidden = tab !== "liste";

  if (tab === "relances") renderRelancesPanel();
  else if (tab === "classement") renderClassementPanel();

  if (opts.scrollToGrp) {
    requestAnimationFrame(() => {
      _root
        .querySelector(`[data-grp="${opts.scrollToGrp}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function _syncHash() {
  let h = "#/eleves";
  if (_tab === "relances") h += "/relances";
  else if (_tab === "classement")
    h += "/classement" + (_clMode === "theorie" ? "/theorie" : "");
  if (window.location.hash !== h) history.replaceState(null, "", h);
}

// ─── Onglet Relances : réutilise relances.js (computeCooling / carte / envoi) ──
// Aucune requête supplémentaire : mes-eleves.js a déjà last_active_at en
// mémoire (loadData()) — le calcul est synchrone, zéro coût réseau.
function getCooling() {
  return computeCooling(_eleves);
}

function relancesPanelHtml() {
  const cooling = getCooling();
  const n = cooling.length;
  if (n === 0) {
    return `<div class="me-rl-empty">
      ${medallion("trophee", "gold", { size: 56 })}
      <div class="me-rl-empty-t">Rien à faire 🎉</div>
      <div class="me-rl-empty-d">Aucun élève ne décroche en ce moment.</div>
    </div>`;
  }
  return `
    <div class="me-rl-intro">
      ${medallion("cloche", "orange", { size: 40, glow: true })}
      <div>
        <div class="me-rl-intro-t">${n} élève${n > 1 ? "s" : ""} à relancer</div>
        <div class="me-rl-intro-s">Le message part de toi, pas d’un robot. Modifie-le, puis envoie.</div>
      </div>
    </div>
    <div class="me-rl-panel">${cooling.map(renderRelanceCard).join("")}</div>`;
}

function renderRelancesPanel() {
  const panel = _root.querySelector("#me-panel-relances");
  if (!panel) return;
  panel.innerHTML = relancesPanelHtml();
  wireRelanceCards(panel);
}

// ─── Onglet Classement : réutilise fetchRanking() de classement-eleves.js,
// re-skinné en léger (raccord « Pupitre ») plutôt que le skin Arène nuit —
// cohérence visuelle avec Liste/Relances (maquette validée). Chargé à la
// demande (1er accès à l'onglet) puis mis en cache par mode. ────────────
async function ensureRanking(mode) {
  if (_rankingCache[mode]) return _rankingCache[mode];
  const data = await fetchRanking(_me, { isTheorie: mode === "theorie" });
  _rankingCache[mode] = data;
  return data;
}

async function renderClassementPanel() {
  const panel = _root.querySelector("#me-panel-classement");
  if (!panel) return;
  if (!_rankingCache[_clMode]) {
    panel.innerHTML = `<div class="me-skel-list">${[1, 2, 3].map(() => `<div class="me-skel-row"></div>`).join("")}</div>`;
    await ensureRanking(_clMode);
    // L'utilisateur a pu changer d'onglet pendant l'attente réseau.
    if (_tab !== "classement") return;
  }
  panel.innerHTML = classementBodyHtml(_rankingCache[_clMode]);
  wireClassementPanel(panel);
}

function classementBodyHtml(data) {
  if (!data || data.error) {
    return `<div class="me-empty">Classement indisponible. Vérifie ta connexion puis réessaie.</div>`;
  }
  const { ranked, hof, isTheorie } = data;
  const fmtScore = (e) =>
    isTheorie
      ? `${e.quizCount}<small>quiz</small>`
      : `${e.acquis}<small>/${REMC_TOTAL}</small>`;
  const seg = `
    <div class="me-cl-seg" role="tablist" aria-label="Ligue">
      <button class="${!isTheorie ? "on" : ""}" data-mode="pratique" role="tab" aria-selected="${!isTheorie}">Pratique · en voiture</button>
      <button class="${isTheorie ? "on" : ""}" data-mode="theorie" role="tab" aria-selected="${isTheorie}">Révision · quiz 30 j</button>
    </div>`;

  if (ranked.length === 0 && hof.length === 0) {
    return `${seg}<div class="me-empty">
      ${isTheorie ? medallion("eclair", "indigo", { size: 48 }) : medallion("trophee", "gold", { size: 48 })}
      <br>${isTheorie ? "Aucune révision ces 30 derniers jours." : "Aucun élève à classer pour l’instant."}
    </div>`;
  }

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const hasPodium = top3.length >= 3;

  const podium = hasPodium ? renderClPodium(top3, fmtScore) : "";
  const listRows = hasPodium ? rest : ranked;
  const list = listRows.length
    ? `<div class="me-cl-head">${hasPodium ? "À partir du 4ᵉ" : "Classement"}<span class="rule"></span></div>
       <div class="me-cl-band">${listRows.map((e, i) => renderClRow(e, i + (hasPodium ? 4 : 1), fmtScore)).join("")}</div>`
    : "";
  const hofHtml = hof
    .map((e) => {
      const nom = esc(
        fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "Élève",
      );
      return `<div class="me-cl-hof" data-eleve-id="${escAttr(e.id)}" role="button" tabindex="0">
        ${medallion("medaille", "gold", { size: 34 })}
        <span class="me-cl-hof-t">${nom}</span>
        <span class="me-cl-hof-s">${medallion("couronne", "gold", { size: 16 })} Permis obtenu</span>
      </div>`;
    })
    .join("");

  return `${seg}${podium}${list}${hofHtml}`;
}

function renderClPodium(top3, fmtScore) {
  const withRank = top3.map((e, i) => ({ e, rang: i + 1 }));
  const order = [withRank[1], withRank[0], withRank[2]]; // gauche·centre·droite
  return `<div class="me-cl-pod">${order
    .map((item) => {
      if (!item) return `<div class="me-cl-col" aria-hidden="true"></div>`;
      const { e, rang } = item;
      const isFirst = rang === 1;
      const nom = esc(
        fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "Élève",
      );
      const size = isFirst ? 46 : 42;
      return `
      <div class="me-cl-col${isFirst ? " first" : ""}" data-eleve-id="${escAttr(e.id)}" role="button" tabindex="0">
        ${isFirst ? medallion("couronne", "gold", { size: 24 }) : ""}
        <span class="me-cl-crest" style="width:${size}px;height:${size}px">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, size)}</span>
        <span class="me-cl-nom">${nom}</span>
        <span class="me-cl-score">${fmtScore(e)}</span>
        <span class="me-cl-rank r${rang}">${rang}</span>
      </div>`;
    })
    .join("")}</div>`;
}

function renderClRow(e, pos, fmtScore) {
  const nom = esc(
    fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "Élève",
  );
  const s = e.streak || 0;
  return `
    <div class="me-cl-row" data-eleve-id="${escAttr(e.id)}" role="button" tabindex="0">
      <span class="me-cl-pos">${pos}</span>
      <span class="me-cl-crest" style="width:34px;height:34px">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 34)}</span>
      <span class="me-cl-rnom">${nom}</span>
      <span class="me-cl-flame${s > 0 ? "" : " off"}">${medallion("flamme", s > 0 ? "orange" : "slate", { size: 15 })}${s}j</span>
      <span class="me-cl-rscore">${fmtScore(e)}</span>
    </div>`;
}

function wireClassementPanel(panel) {
  panel.querySelectorAll(".me-cl-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      const mode = b.dataset.mode;
      if (mode === _clMode) return;
      haptic("select");
      _clMode = mode;
      track("mes_eleves.classement.mode", { mode });
      _syncHash();
      renderClassementPanel();
    });
  });
  panel.querySelectorAll("[data-eleve-id]").forEach((el) => {
    const open = () => {
      haptic("impact");
      navigate(`#/livret/${el.dataset.eleveId}`);
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}

async function wireRows() {
  const { attachLongPress } = await import("@/utils/gestures.js");

  _root.querySelectorAll(".me-row[data-eleve-id]").forEach((row) => {
    const id = row.dataset.eleveId;

    // ── Click standard → livret ──
    const handler = () => {
      haptic("impact"); // clac net : ouverture fiche élève
      track("eleve.fiche.open", { eleve_id: id });
      navigate(`#/livret/${id}`);
    };
    row.addEventListener("click", handler);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") handler();
    });

    // ── Bouton « ⋯ » visible → menu rapide (n'ouvre PAS le livret) ──
    const moreBtn = row.querySelector("[data-more]");
    moreBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      haptic("tap");
      track("eleve.more_menu", { eleve_id: id });
      openQuickMenu(id, row);
    });

    // ── Cloche (bande « À relancer ») → saute vers l'onglet Relances,
    // directement sur LA carte de cet élève (sinon, avec 40 cartes, on
    // atterrit en haut de la pile et la cloche perd son intérêt) ──
    const bellBtn = row.querySelector("[data-bell]");
    bellBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      haptic("tap");
      track("eleve.bell_relance", { eleve_id: id });
      switchTab("relances");
      requestAnimationFrame(() => {
        _root
          ?.querySelector(`.rl-card[data-eleve-id="${CSS.escape(id)}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    // ── Long press → menu rapide (raccourci, en plus du bouton) ──
    attachLongPress(row, {
      holdMs: 480,
      onLongPress: () => {
        track("eleve.longpress_menu", { eleve_id: id });
        openQuickMenu(id, row);
      },
    });
  });
}

/**
 * Met à jour la pastille provenance d'un élève en place (sans re-render global).
 * @param {string} eleveId
 * @param {{label:string,color:string}|null} prov
 */
function updateRowProvenance(eleveId, prov) {
  const e = _eleves.find((x) => x.id === eleveId);
  if (e) e.provenance = prov;
  _root
    .querySelectorAll(`.me-row[data-eleve-id="${eleveId}"]`)
    .forEach((row) => {
      row.querySelector(".pv-badge")?.remove();
      const nom = row.querySelector(".me-nom");
      if (nom && prov)
        nom.insertAdjacentHTML("afterend", provenanceBadge(prov));
    });
}

/**
 * Mini menu contextuel apparaît sous la ligne au long-press
 */
function openQuickMenu(eleveId, anchorRow) {
  // Retire menu existant
  document.querySelector(".me-qm")?.remove();

  const eleve = _eleves.find((e) => e.id === eleveId) || null;
  const nMissing = eleve ? eleve.total - eleve.acquis : 0;
  // Toujours proposer « ce qu'il manque » tant qu'il reste des compétences —
  // y compris pour un élève « prêt » : c'est PILE lui qui réclame une date.
  const showManque = eleve && eleve.readiness !== "recu" && nMissing > 0;

  const rect = anchorRow.getBoundingClientRect();
  const menu = document.createElement("div");
  menu.className = "me-qm";
  menu.innerHTML = `
    <style>
      .me-qm-bg {
        position: fixed; inset: 0; z-index: 400;
        background: rgba(10,13,26,.18);
        backdrop-filter: blur(2px);
        animation: meqmIn .15s ease;
      }
      @keyframes meqmIn { from { opacity: 0; } to { opacity: 1; } }
      .me-qm-panel {
        position: fixed; z-index: 401;
        background: var(--su);
        border: 1px solid var(--bo);
        border-radius: var(--r-lg);
        box-shadow: 0 12px 32px -8px rgba(10,13,26,.2);
        padding: 6px;
        min-width: 220px;
        font-family: 'Archivo', sans-serif;
        animation: meqmPanel .2s var(--ease-spring);
      }
      @keyframes meqmPanel { from { opacity: 0; transform: translateY(-4px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @media (prefers-reduced-motion: reduce) { .me-qm-bg, .me-qm-panel { animation: none; } }
      .me-qm-item {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px;
        border-radius: var(--r);
        cursor: pointer;
        font: 500 14px/1.2 'Archivo', sans-serif;
        color: var(--ink);
        background: transparent;
        border: 0;
        width: 100%;
        text-align: left;
      }
      .me-qm-item:hover { background: var(--bg); }
      .me-qm-item:active { background: var(--bg2); }
      .me-qm-ico { font-size: 16px; line-height: 1; display: inline-flex; }
      .me-qm-item.danger { color: var(--rd-txt); }
      .me-qm-item.ok { color: var(--grd); }
      .me-qm-sep { height: 1px; background: var(--bo); margin: 6px 8px; }
      .me-qm-label {
        font: 700 10px/1 'Archivo', sans-serif;
        letter-spacing: .05em;
        text-transform: uppercase;
        color: var(--mu2);
        padding: 8px 14px 4px;
      }
    </style>
    <div class="me-qm-bg" data-close="1"></div>
    <div class="me-qm-panel">
      ${
        showManque
          ? `<button class="me-qm-item" data-action="manque">
               <span class="me-qm-ico">${icon("clipboard", { size: 14, strokeWidth: 2.5 })}</span> Compétences restantes (${nMissing})
             </button>`
          : ""
      }
      <button class="me-qm-item" data-action="livret">
        <span class="me-qm-ico">${icon("arrow-right", { size: 14, strokeWidth: 2.5 })}</span> Ouvrir le livret de compétences
      </button>
      <button class="me-qm-item" data-action="provenance">
        <span class="me-qm-ico">${icon("map-pin", { size: 14, strokeWidth: 2.5 })}</span> ${eleve?.provenance ? "Modifier la provenance" : "Définir la provenance"}
      </button>
      <div class="me-qm-sep"></div>
      <div class="me-qm-label">Examen</div>
      <button class="me-qm-item" data-action="exam-planifie">
        <span class="me-qm-ico">${icon("calendar", { size: 14, strokeWidth: 2.5 })}</span> Examen planifié
      </button>
      <button class="me-qm-item ok" data-action="exam-recu">
        <span class="me-qm-ico">${icon("award", { size: 14, strokeWidth: 2.5 })}</span> Permis obtenu
      </button>
      <button class="me-qm-item danger" data-action="exam-rate">
        <span class="me-qm-ico">${icon("x", { size: 14, strokeWidth: 2.5 })}</span> Examen raté
      </button>
      <div class="me-qm-sep"></div>
      <div class="me-qm-label">Compte</div>
      <button class="me-qm-item" data-action="reset-access">
        <span class="me-qm-ico">${icon("refresh-cw", { size: 14, strokeWidth: 2.5 })}</span> Réinitialiser l’accès
      </button>
      <button class="me-qm-item danger" data-action="delete-eleve">
        <span class="me-qm-ico">${icon("trash", { size: 14, strokeWidth: 2.5 })}</span> Supprimer cet élève
      </button>
    </div>
  `;
  document.body.appendChild(menu);

  // Position du panel sous la row (clamp pour rester dans le viewport)
  const panel = menu.querySelector(".me-qm-panel");
  panel.style.maxHeight = "min(70vh, 440px)";
  panel.style.overflowY = "auto";
  const top = Math.min(rect.bottom + 8, window.innerHeight - 360);
  const left = Math.min(rect.left + 16, window.innerWidth - 240);
  panel.style.top = `${Math.max(8, top)}px`;
  panel.style.left = `${left}px`;

  const close = () => menu.remove();

  menu.querySelector("[data-close]").addEventListener("click", close);
  menu.querySelectorAll(".me-qm-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      close();
      if (action === "livret") navigate(`#/livret/${eleveId}`);
      else if (action === "provenance" && eleve)
        openProvenanceEditor({
          eleveId,
          prenom: eleve.prenom ? fmtName(eleve.prenom) : "",
          current: eleve.provenance || null,
          onSaved: (prov) => updateRowProvenance(eleveId, prov),
        });
      else if (action === "manque" && eleve) openMissingPanel(eleve);
      else if (action === "exam-planifie") openPlanifieDialog(eleveId);
      else if (action === "exam-recu") confirmRecu(eleveId);
      else if (action === "exam-rate") recordExam(eleveId, "rate", todayIso());
      else if (action === "reset-access") confirmResetAccess(eleveId);
      else if (action === "delete-eleve") confirmDeleteEleve(eleveId);
    });
  });
}

// Réinitialiser l'accès d'un élève : le moniteur déclenche l'envoi d'un email de
// récupération À L'ÉLÈVE (il ne voit jamais le lien). Edge function `eleve-recovery`
// (service role) vérifie que l'élève est bien de son école.
function confirmResetAccess(eleveId) {
  const el = _eleves.find((e) => e.id === eleveId);
  const prenom = esc(el && el.prenom ? fmtName(el.prenom) : "cet élève");
  document.querySelector(".me-confirm")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "me-confirm";
  wrap.innerHTML = `${DIALOG_STYLE}
    <div class="me-cf-bg" data-close="1"></div>
    <div class="me-cf-card" role="dialog" aria-modal="true" aria-label="Réinitialiser l’accès">
      <div class="me-cf-title">Réinitialiser l’accès de ${prenom} ?</div>
      <div class="me-cf-body">Un email de connexion sera envoyé à ${prenom}. Tu ne vois jamais le lien. C’est lui qui reprend la main sur son compte.</div>
      <div class="me-cf-actions">
        <button class="me-cf-btn" data-close="1" type="button">Annuler</button>
        <button class="me-cf-btn confirm" id="me-reset-ok" type="button">Envoyer l’email</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  wrap
    .querySelectorAll("[data-close]")
    .forEach((b) => b.addEventListener("click", () => wrap.remove()));

  wrap.querySelector("#me-reset-ok").addEventListener("click", async () => {
    const btn = wrap.querySelector("#me-reset-ok");
    btn.disabled = true;
    btn.textContent = "Envoi…";
    track("eleve.reset_access", { eleve_id: eleveId });
    const ok = await triggerEleveRecovery(eleveId);
    wrap.remove();
    toast(
      ok
        ? `Email de connexion envoyé à ${prenom}.`
        : "Envoi impossible. Réessaie.",
      ok ? "success" : "error",
    );
  });
}

// ─── Suppression DÉFINITIVE d'un élève ───────────────────────────
// Bouton rouge du menu kebab. RPC delete_eleve (SECURITY DEFINER) : supprime le
// profil → cascade toutes ses données + purge best-effort la ligne auth.users.
// Garde-fou serveur : seulement un élève de la propre auto-école de l'appelant.
function confirmDeleteEleve(eleveId) {
  const el = _eleves.find((e) => e.id === eleveId);
  const prenom = esc(el && el.prenom ? fmtName(el.prenom) : "cet élève");
  document.querySelector(".me-confirm")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "me-confirm";
  wrap.innerHTML = `${DIALOG_STYLE}
    <div class="me-cf-bg" data-close="1"></div>
    <div class="me-cf-card" role="dialog" aria-modal="true" aria-label="Supprimer l’élève">
      <div class="me-cf-title">Supprimer ${prenom} ?</div>
      <div class="me-cf-body">Cette action est <strong>définitive</strong>. ${prenom} perd son compte et toute sa progression : révisions, validations, examens. Impossible à annuler.</div>
      <div class="me-cf-actions">
        <button class="me-cf-btn" data-close="1" type="button">Annuler</button>
        <button class="me-cf-btn danger" id="me-del-ok" type="button">Supprimer définitivement</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  wrap
    .querySelectorAll("[data-close]")
    .forEach((b) => b.addEventListener("click", () => wrap.remove()));

  wrap.querySelector("#me-del-ok")?.addEventListener("click", async () => {
    const btn = wrap.querySelector("#me-del-ok");
    btn.disabled = true;
    btn.textContent = "Suppression…";
    track("eleve.delete", { eleve_id: eleveId });
    try {
      const { error } = await sb.rpc("delete_eleve", { p_eleve_id: eleveId });
      if (error) throw error;
      _eleves = _eleves.filter((e) => e.id !== eleveId);
      wrap.remove();
      await _refreshAndRender();
      toast(`${prenom} a été supprimé.`, "success");
    } catch (e) {
      console.error("[mes-eleves] delete_eleve error", e);
      wrap.remove();
      toast("Suppression impossible. Réessaie.", "error");
    }
  });
}

// ─── Enregistrement d'un résultat d'examen ───────────────────────
// dateExamen : ISO court. Planifié = date choisie ; reçu/raté = aujourd'hui.
async function recordExam(eleveId, statut, dateExamen) {
  const el = _eleves.find((e) => e.id === eleveId);
  const prevStatut = el ? el.examStatut : null;
  const prevDate = el ? el.examDate : null;

  const { data, error } = await sb
    .from("examens")
    .insert({
      eleve_id: eleveId,
      statut,
      date_examen: dateExamen || todayIso(),
      created_by: _me.id,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[mes-eleves] examen insert error", error);
    toast("Enregistrement impossible. Réessaie.", "error");
    return;
  }
  const newId = data ? data.id : null;

  // MAJ locale → recalcul readiness sans refetch
  if (el) {
    el.examStatut = statut;
    el.examDate = dateExamen || todayIso();
    el.readiness = computeReadiness(el.acquisSet, statut);
  }
  track("examen.record", { eleve_id: eleveId, statut });

  // Re-render complet : badges + compteurs d'onglets + classement (si actif)
  await _refreshAndRender();

  // Snackbar avec undo (supprime la ligne créée, restaure l'état précédent)
  const msg = {
    planifie: "Examen planifié",
    recu: "Permis obtenu · archivé dans « Reçus »",
    rate: "Résultat d’examen enregistré",
  };
  showUndoSnackbar(msg[statut] || "Enregistré", async () => {
    if (newId) {
      const { error: delErr } = await sb
        .from("examens")
        .delete()
        .eq("id", newId);
      if (delErr) {
        console.error("[mes-eleves] examen undo error", delErr);
        toast("Annulation impossible. Réessaie.", "error");
        return;
      }
    }
    if (el) {
      el.examStatut = prevStatut;
      el.examDate = prevDate;
      el.readiness = computeReadiness(el.acquisSet, prevStatut);
    }
    track("examen.undo", { eleve_id: eleveId, statut });
    await _refreshAndRender();
  });
}

// Re-render complet de la page (badges, compteurs, onglet actif) après une
// mutation locale de `_eleves` (examen enregistré/annulé, élève supprimé).
// Invalide le cache Classement (le tri/hof peuvent avoir changé) et le
// recharge tout de suite s'il est l'onglet actif — sinon rechargé au tap.
async function _refreshAndRender() {
  _rankingCache = {};
  if (_tab === "classement") await ensureRanking(_clMode);
  render();
  wire();
}

// ─── Styles partagés des dialogs (confirm + date) ────────────────
const DIALOG_STYLE = `
  <style>
    .me-cf-bg {
      position: fixed; inset: 0; z-index: 600;
      background: rgba(10,13,26,.4);
      backdrop-filter: blur(3px);
      animation: meqmIn .15s ease;
    }
    .me-cf-card {
      position: fixed; z-index: 601;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: calc(100% - 40px); max-width: 360px;
      background: var(--su);
      border: 1px solid var(--bo);
      border-radius: var(--rl);
      box-shadow: 0 16px 40px -8px rgba(10,13,26,.28);
      padding: 22px 20px 18px;
      font-family: 'Archivo', sans-serif;
      animation: meqmPanel .2s var(--ease-spring);
    }
    @media (prefers-reduced-motion: reduce) { .me-cf-bg, .me-cf-card { animation: none; } }
    .me-cf-title { font: 700 17px/1.25 'Archivo', sans-serif; color: var(--ink); margin: 0 0 6px; }
    .me-cf-body { font: 500 13.5px/1.5 'Archivo', sans-serif; color: var(--mu2); margin: 0 0 18px; }
    .me-cf-date {
      width: 100%; box-sizing: border-box; margin: 0 0 18px;
      padding: 12px 14px; border: 1px solid var(--bo); border-radius: var(--r);
      background: var(--bg); color: var(--ink);
      font: 500 15px/1 'Archivo', sans-serif; outline: none;
    }
    .me-cf-date:focus { border-color: var(--a); box-shadow: 0 0 0 3px var(--ap); }
    .me-cf-actions { display: flex; gap: 8px; }
    .me-cf-btn {
      flex: 1; min-height: 46px; border-radius: var(--r); cursor: pointer;
      font: 700 14px/1 'Archivo', sans-serif; border: 1px solid var(--bo);
      background: var(--bg); color: var(--ink); -webkit-tap-highlight-color: transparent;
    }
    .me-cf-btn:active { transform: scale(.98); }
    .me-cf-btn.confirm { border: 0; color: var(--a-ink); background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%); box-shadow: 0 2px 10px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset; }
    .me-cf-btn.danger { border: 0; color: #fff; background: linear-gradient(to bottom, var(--rd) 0%, var(--rd-txt, #dc2626) 100%); box-shadow: 0 2px 10px 0 rgba(220,38,38,.35), 0 1.5px 0 0 rgba(255,255,255,.22) inset; }
    .me-cf-btn.danger:disabled { opacity: .6; cursor: wait; }
  </style>`;

/** Confirmation avant d'archiver un élève en « reçu ». */
function confirmRecu(eleveId) {
  const el = _eleves.find((e) => e.id === eleveId);
  const prenom = esc(el && el.prenom ? fmtName(el.prenom) : "cet élève");
  document.querySelector(".me-confirm")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "me-confirm";
  wrap.innerHTML = `
    ${DIALOG_STYLE}
    <div class="me-cf-bg" data-close="1"></div>
    <div class="me-cf-card" role="dialog" aria-modal="true" aria-label="Confirmer la réussite">
      <div class="me-cf-title">${prenom} a obtenu le permis ?</div>
      <div class="me-cf-body">Il quitte ta liste active et rejoint l’onglet « Reçus ». Tu pourras annuler juste après.</div>
      <div class="me-cf-actions">
        <button class="me-cf-btn" data-close="1" type="button">Annuler</button>
        <button class="me-cf-btn confirm" id="me-cf-ok" type="button">Permis obtenu</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const close = () => wrap.remove();
  wrap
    .querySelectorAll("[data-close]")
    .forEach((x) => x.addEventListener("click", close));
  wrap.querySelector("#me-cf-ok")?.addEventListener("click", () => {
    close();
    recordExam(eleveId, "recu", todayIso());
  });
}

/** Saisie de la date d'un examen planifié. */
function openPlanifieDialog(eleveId) {
  const el = _eleves.find((e) => e.id === eleveId);
  const prenom = esc(el && el.prenom ? fmtName(el.prenom) : "l’élève");
  const today = todayIso();
  document.querySelector(".me-confirm")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "me-confirm";
  wrap.innerHTML = `
    ${DIALOG_STYLE}
    <div class="me-cf-bg" data-close="1"></div>
    <div class="me-cf-card" role="dialog" aria-modal="true" aria-label="Date de l’examen">
      <div class="me-cf-title">Examen de ${prenom}</div>
      <div class="me-cf-body">Choisis la date prévue de l’examen.</div>
      <input class="me-cf-date" id="me-cf-date" type="date" value="${today}" min="${today}" aria-label="Date de l’examen" />
      <div class="me-cf-actions">
        <button class="me-cf-btn" data-close="1" type="button">Annuler</button>
        <button class="me-cf-btn confirm" id="me-cf-ok" type="button">Planifier</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const input = wrap.querySelector("#me-cf-date");
  const close = () => wrap.remove();
  wrap
    .querySelectorAll("[data-close]")
    .forEach((x) => x.addEventListener("click", close));
  wrap.querySelector("#me-cf-ok")?.addEventListener("click", () => {
    const date = (input && input.value) || today;
    close();
    recordExam(eleveId, "planifie", date);
  });
}

/** Snackbar bas d'écran avec action « Annuler » (auto-dismiss 6 s). */
function showUndoSnackbar(msg, onUndo, duration = 6000) {
  document.querySelector(".me-undo")?.remove();

  const bar = document.createElement("div");
  bar.className = "me-undo";
  bar.setAttribute("role", "status");
  bar.innerHTML = `
    <style>
      .me-undo {
        position: fixed; z-index: 550;
        left: 50%; transform: translate(-50%, 16px);
        bottom: calc(72px + env(safe-area-inset-bottom, 0px) + 80px);
        display: flex; align-items: center; gap: 14px;
        max-width: min(90vw, 380px);
        padding: 12px 12px 12px 16px;
        background: var(--ink); color: var(--bg);
        border-radius: var(--r-md);
        box-shadow: 0 12px 32px -8px rgba(10,13,26,.4);
        font: 500 13.5px/1.3 'Archivo', sans-serif;
        opacity: 0;
        transition: opacity .22s ease, transform .22s var(--ease-spring);
      }
      .me-undo.on { opacity: 1; transform: translate(-50%, 0); }
      .me-undo-msg { flex: 1; min-width: 0; }
      .me-undo-btn {
        flex-shrink: 0; border: 0; cursor: pointer;
        padding: 8px 14px; min-height: 44px; border-radius: var(--r);
        background: rgba(255,255,255,.16); color: #fff;
        font: 700 13px/1 'Archivo', sans-serif;
        -webkit-tap-highlight-color: transparent;
      }
      .me-undo-btn:active { background: rgba(255,255,255,.28); }
      @media (prefers-reduced-motion: reduce) { .me-undo { transition: none; } }
    </style>
    <span class="me-undo-msg">${esc(msg)}</span>
    <button class="me-undo-btn" type="button">Annuler</button>
  `;
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar.classList.add("on"));

  let done = false;
  const remove = () => {
    if (done) return;
    done = true;
    bar.classList.remove("on");
    setTimeout(() => bar.remove(), 250);
  };
  const timer = setTimeout(remove, duration);
  bar.querySelector(".me-undo-btn")?.addEventListener("click", () => {
    clearTimeout(timer);
    remove();
    onUndo();
  });
}

// ─── Panneau « ce qu'il manque » (écran à montrer à l'élève) ─────
function openMissingPanel(eleve) {
  document.querySelector(".me-miss")?.remove();

  const missing = missingComps(eleve.acquisSet);
  // escAttr : `nom` sert dans l'aria-label du dialog (esc n'encode pas les
  // guillemets → injection d'attribut). Correct aussi en contenu texte.
  const nom = escAttr(
    fmtName([eleve.prenom, eleve.nom].filter(Boolean).join(" ")) || "—",
  );
  const baseRestantes = baseManquantes(eleve.acquisSet).length;

  const wrap = document.createElement("div");
  wrap.className = "me-miss";
  wrap.innerHTML = `
    <style>
      .me-miss-bg {
        position: fixed; inset: 0; z-index: 500;
        background: rgba(10,13,26,.4);
        backdrop-filter: blur(3px);
        animation: meqmIn .15s ease;
      }
      .me-miss-card {
        position: fixed; z-index: 501;
        left: 50%; bottom: 0;
        transform: translateX(-50%);
        width: 100%; max-width: 480px;
        max-height: 82vh;
        display: flex; flex-direction: column;
        background: var(--su);
        border: 1px solid var(--bo);
        border-radius: 20px 20px 0 0;
        box-shadow: 0 -8px 32px -8px rgba(10,13,26,.25);
        padding: 20px 18px calc(20px + env(safe-area-inset-bottom, 0px));
        font-family: 'Archivo', sans-serif;
        animation: meMissUp .24s cubic-bezier(.34,1.4,.64,1);
      }
      @keyframes meMissUp { from { transform: translate(-50%, 100%); } to { transform: translate(-50%, 0); } }
      @media (prefers-reduced-motion: reduce) { .me-miss-bg, .me-miss-card { animation: none; } }
      .me-miss-title { font: 700 18px/1.2 'Archivo', sans-serif; color: var(--ink); margin: 0 0 4px; }
      .me-miss-sub { font: 500 13px/1.5 'Archivo', sans-serif; color: var(--mu2); margin: 0 0 16px; }
      .me-miss-list { overflow-y: auto; flex: 1; margin: 0 -4px; padding: 0 4px; }
      .me-miss-cat { font: 700 11px/1 'Archivo', sans-serif; letter-spacing: .04em; text-transform: uppercase; color: var(--a-txt); margin: 14px 0 8px; }
      .me-miss-cat:first-child { margin-top: 0; }
      .me-miss-item { display: flex; align-items: baseline; gap: 8px; padding: 7px 0; font: 500 14px/1.3 'Archivo', sans-serif; color: var(--ink); border-bottom: 1px solid var(--bg2); }
      .me-miss-code { font: 700 11px/1 'IBM Plex Mono', monospace; color: var(--mu); background: var(--bg2); padding: 3px 6px; border-radius: 6px; flex-shrink: 0; }
      .me-miss-empty { text-align: center; padding: 32px 16px; color: var(--grd); font: 600 14px/1.5 'Archivo', sans-serif; }
      .me-miss-cta { margin-top: 16px; width: 100%; min-height: 48px; border: 0; border-radius: var(--r); color: var(--a-ink); font: 700 14px/1 'Archivo', sans-serif; cursor: pointer; background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%); box-shadow: 0 2px 10px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset; }
      .me-miss-cta:active { transform: scale(.98); }
    </style>
    <div class="me-miss-bg" data-close="1"></div>
    <div class="me-miss-card" role="dialog" aria-modal="true" aria-label="Compétences manquantes de ${nom}">
      <div class="me-miss-title">Il manque à ${nom}</div>
      <div class="me-miss-sub">${eleve.acquis}/${eleve.total} compétences acquises · ${baseRestantes > 0 ? `${baseRestantes} compétence${baseRestantes > 1 ? "s" : ""} essentielle${baseRestantes > 1 ? "s" : ""} avant l’examen` : "toutes les compétences essentielles acquises · prêt pour l’examen"}</div>
      <div class="me-miss-list">
        ${
          missing.length === 0
            ? `<div class="me-miss-empty">${icon("check-circle", { size: 28, strokeWidth: 2 })}<br>Toutes les compétences sont acquises.</div>`
            : REMC.map((cat) => {
                const subs = cat.subs.filter((s) => !eleve.acquisSet.has(s.c));
                if (!subs.length) return "";
                return (
                  `<div class="me-miss-cat">${esc(cat.name)}</div>` +
                  subs
                    .map(
                      (s) =>
                        `<div class="me-miss-item"><span class="me-miss-code">${esc(s.c)}</span> ${esc(s.n)}</div>`,
                    )
                    .join("")
                );
              }).join("")
        }
      </div>
      <button class="me-miss-cta" data-livret="1">Ouvrir le livret de compétences</button>
    </div>
  `;
  document.body.appendChild(wrap);

  const close = () => wrap.remove();
  wrap.querySelector("[data-close]")?.addEventListener("click", close);
  wrap.querySelector("[data-livret]")?.addEventListener("click", () => {
    close();
    navigate(`#/livret/${eleve.id}`);
  });
}

// ─── Partial re-render pipeline uniquement (sans recréer toute la page) ──
function renderList() {
  const pipelineEl = _root?.querySelector("#me-pipeline");
  if (!pipelineEl) return;

  pipelineEl.innerHTML = renderContent();
  wireRows();

  // Si l'empty state avec bouton invite vient d'être rendu
  pipelineEl
    .querySelector("#me-invite-empty-btn")
    ?.addEventListener("click", () => {
      track("invite.empty.list.clicked");
      openInviteEleveModal(_me);
    });
}
