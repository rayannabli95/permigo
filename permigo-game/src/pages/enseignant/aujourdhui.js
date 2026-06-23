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
import { icon } from "@/utils/icons.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { fmtName } from "@/utils/fmt-name.js";
import { openInviteEleveModal } from "@/services/invite-eleve.js";
import { getMoniteurState } from "@/data/moniteur-levels.js";
import { getLeague } from "@/utils/league-shared.js";
import { startTour } from "@/components/common/guided-tour.js";
import { panneauxLayer } from "@/components/enseignant/panneaux-bg.js";
import { haptic } from "@/utils/haptic.js";
import { onPopupsSettled } from "@/utils/intro-overlays.js";

// Tour guidé enseignant — affiché 1× à la première connexion
const TOUR_KEY = "pg-tour-moniteur-v1";
const MONITEUR_TOUR_STEPS = [
  {
    title: "Bienvenue sur PermiGo",
    text: "Ton livret passe en numérique. Tes élèves voient leur progression en temps réel — toi tu sais où en est chacun en un coup d'œil.",
  },
  {
    sel: "#aj-act-invite",
    title: "Commence ici",
    text: "Invite un élève : il reçoit un lien, crée son compte et t'est rattaché automatiquement. C'est le point de départ.",
  },
  {
    sel: "#bn-seance-fab",
    title: "Valide après chaque leçon",
    text: "Coche les compétences réussies. Le livret de ton élève se met à jour aussitôt — fini le papier.",
  },
  {
    sel: '.bn-tab[data-id="eleves"]',
    title: "Suis tes élèves",
    text: "Retrouve chaque élève, son livret et sa progression. Les élèves à relancer remontent automatiquement.",
  },
  {
    sel: '.bn-tab[data-id="insights"]',
    title: "Mesure l'engagement",
    text: "Qui révise cette semaine, qui stagne. Les chiffres sont là pour t'aider à prioriser.",
  },
];

function maybeStartMoniteurTour() {
  try {
    if (localStorage.getItem(TOUR_KEY)) return;
  } catch {
    return;
  }
  // Le tuto attend que le popup d'engagement (A2HS / rappels) soit fermé :
  // sinon il s'affiche dessous et le spotlight se mesure au mauvais endroit.
  onPopupsSettled(() => {
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
  });
}

// ─── Statuts labels : mapping centralisé @/utils/statut-label.js ──

// ─── CSS ──────────────────────────────────────────────────────────
const STYLE = `<style>
  .aj-page {
    padding: 24px 16px calc(100px + env(safe-area-inset-bottom, 0px));
    max-width: 600px;
    margin: 0 auto;
    background: var(--bg);
    font-family: var(--ens-body, 'Inter'), sans-serif;
    color: var(--ink);
  }


  /* ── HERO visuel (parité accueil élève, ton sobre/pro) ── */
  .aj-hero2 {
    position: relative; overflow: hidden;
    /* Full-bleed jusqu'en haut : on remonte derrière le header fixe
       (var(--th)=52px + safe-area, posé par body.has-chrome #app) ET on annule
       le padding-top 24px de .aj-page → fini la bande sombre au-dessus de l'image. */
    margin: calc(-1 * (var(--th) + env(safe-area-inset-top, 0px)) - 24px) -16px 22px;
    padding: calc(env(safe-area-inset-top, 0px) + var(--th) + 24px) 24px 30px;
    color: #fff;
    /* DA arcade routière : panneaux semés en fond (via .ens-panneaux), sur dégradé vert profond */
    background: radial-gradient(130% 150% at 0% 0%, #14391f 0%, #0c2614 44%, #0b0d1a 100%);
    animation: ajIn .5s var(--ease) both;
    isolation: isolate;
  }
  /* marquage au sol (liseré pointillé ambre) en pied de hero */
  .aj-hero2::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 5px; z-index: 1;
    background: repeating-linear-gradient(90deg, #f59e0b 0 18px, transparent 18px 34px); opacity: .85;
  }
  /* panneaux plus lisibles sur le fond sombre du hero */
  .aj-hero2 .ens-panneaux__sign { opacity: var(--o, .18); filter: saturate(1.1) brightness(1.08); }
  .aj-hero2-content { position: relative; z-index: 2; }
  .aj-hero2-date {
    font: 700 11px/1 var(--ens-body, 'Inter'), sans-serif; color: rgba(255,255,255,.7);
    text-transform: uppercase; letter-spacing: .12em; margin: 0 0 8px;
  }
  .aj-hero2-name {
    font: 700 clamp(27px, 8.5vw, 34px)/1.04 var(--ens-display, 'Fredoka'), sans-serif;
    color: #fff; letter-spacing: -.02em; margin: 0;
    text-shadow: 0 2px 14px rgba(11,13,26,.45);
  }
  .aj-hero2-value {
    font: 600 13.5px/1.5 'Inter', sans-serif; color: rgba(255,255,255,.9);
    margin: 12px 0 0; max-width: 40ch;
  }
  .aj-hero2-value b { color: #fff; font-weight: 800; }
  .aj-hero2-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
  .aj-hero2-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: var(--r-full);
    background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22);
    font: 700 12px/1 'Inter', sans-serif; color: #fff;
  }

  /* ── Widget DOMINANT : valider une compétence ── */
  .aj-validate {
    background: var(--su); border: 1px solid var(--bo); border-radius: var(--rl);
    padding: 18px 16px; margin-bottom: 26px; box-shadow: var(--s2);
    animation: ajIn .5s .06s var(--ease) both;
  }
  .aj-validate-hd { display: flex; align-items: center; gap: 8px; }
  .aj-validate-ttl { font: 700 18px/1.2 var(--ens-display, 'Fredoka'), sans-serif; color: var(--ink); letter-spacing: -.02em; }
  .aj-validate-sub { font: 500 13px/1.45 var(--ens-body, 'Inter'), sans-serif; color: var(--mu); margin: 5px 0 14px; }
  .aj-validate-list { display: flex; flex-direction: column; }
  .aj-validate-row {
    display: flex; align-items: center; gap: 12px; width: 100%;
    padding: 11px 6px; background: none; border: 0; border-radius: var(--r);
    cursor: pointer; text-align: left; font-family: inherit; min-height: 44px;
    -webkit-tap-highlight-color: transparent; transition: background .12s;
  }
  .aj-validate-row + .aj-validate-row { border-top: 1px solid var(--bo2); }
  .aj-validate-row:active { background: var(--bg2); }
  .aj-validate-av { width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0; display: flex; }
  .aj-validate-nom { flex: 1; min-width: 0; font: 600 14.5px/1.25 var(--ens-body, 'Inter'), sans-serif; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .aj-validate-prog { font: 700 13.5px/1 var(--ens-display, 'Fredoka'), sans-serif; color: var(--mu2); font-variant-numeric: tabular-nums; letter-spacing: -.01em; flex-shrink: 0; }
  .aj-validate-chev { color: var(--mu2); flex-shrink: 0; display: flex; }
  .aj-validate-other {
    width: 100%; margin-top: 12px; padding: 12px; min-height: 44px;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    background: none; border: 1.5px solid var(--bo); border-radius: var(--r-md);
    color: var(--ink); font: 700 13.5px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; font-family: inherit; -webkit-tap-highlight-color: transparent;
    transition: border-color .15s, transform .2s cubic-bezier(.23,1,.32,1);
  }
  .aj-validate-other:active { transform: scale(.97); border-color: var(--bo4); }
  .aj-validate-cta {
    width: 100%; padding: 14px; min-height: 50px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    background: var(--a); color: var(--a-ink); border: 0; border-radius: var(--r-md);
    font: 800 14px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
    font-family: inherit; -webkit-tap-highlight-color: transparent;
    box-shadow: 0 4px 0 0 var(--adk);
    transition: transform .2s cubic-bezier(.23,1,.32,1), box-shadow .2s cubic-bezier(.23,1,.32,1);
  }
  .aj-validate-cta:active { transform: translateY(3px) scale(.97); box-shadow: 0 1px 0 0 var(--adk); }
  @media (prefers-reduced-motion: reduce) { .aj-hero2, .aj-validate { animation: none !important; transition: none !important; } }

  @keyframes ajIn {
    from { opacity: 0; transform: translateY(12px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }


  /* ── Stats compactes ── */
  .aj-quickstats { display: flex; gap: 10px; margin-bottom: 14px; }
  .aj-quickstat {
    flex: 1;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--r-md);
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
    border-radius: var(--r-full); margin-top: 8px; overflow: hidden;
  }
  .aj-quickstat-bar > div {
    height: 100%; border-radius: var(--r-full); background: var(--a);
    transition: width .5s var(--ease-out);
  }

  /* ── Actions rapides ── */
  .aj-actions { display: flex; gap: 10px; margin-bottom: 26px; }
  .aj-action {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    padding: 13px 8px;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--r-md);
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
  .aj-action:active { transform: scale(.97); transition: transform .18s cubic-bezier(.23,1,.32,1), border-color .15s; }
  .aj-action:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
  .aj-action-ico {
    width: 34px; height: 34px; border-radius: var(--r);
    background: var(--ap); color: var(--adk);
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Carte Classements (repliable) ── */
  a.aj-prog, a.aj-prog:visited { text-decoration: none; }
  .aj-ranks {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--r-md);
    box-shadow: var(--s0);
    overflow: hidden;
  }
  .aj-ranks[open] { border-color: var(--bo4); }
  .aj-ranks-sum {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; cursor: pointer; list-style: none;
    -webkit-tap-highlight-color: transparent;
    min-height: 44px;
  }
  .aj-ranks-sum::-webkit-details-marker { display: none; }
  .aj-ranks-sum:focus-visible { outline: 3px solid var(--a); outline-offset: -3px; }
  .aj-ranks-ico {
    width: 34px; height: 34px; border-radius: var(--r);
    background: var(--ap); color: var(--adk); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .aj-ranks-hd { flex: 1; min-width: 0; }
  .aj-ranks-ttl {
    font: 800 14px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); letter-spacing: -.01em;
  }
  .aj-ranks-meta {
    display: flex; align-items: center; gap: 6px; margin-top: 3px;
    font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu2);
  }
  .aj-ranks-chev {
    color: var(--mu2); flex-shrink: 0; display: flex;
    transition: transform .2s var(--ease);
  }
  .aj-ranks[open] .aj-ranks-chev { transform: rotate(180deg); }
  .aj-ranks-body { border-top: 1px solid var(--bo2); }
  .aj-rank-row {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 16px; text-decoration: none; color: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: background .12s; min-height: 44px;
  }
  .aj-rank-row + .aj-rank-row { border-top: 1px solid var(--bo2); }
  .aj-rank-row:active { background: var(--bg2); }
  .aj-rank-row:focus-visible { outline: 3px solid var(--a); outline-offset: -3px; }
  .aj-rank-row-ico {
    width: 30px; height: 30px; border-radius: var(--r-sm);
    background: var(--bg2); color: var(--mu); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .aj-rank-row-body { flex: 1; min-width: 0; }
  .aj-rank-row-main {
    font: 700 13.5px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); letter-spacing: -.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-rank-row-sub {
    font: 500 11px/1.35 'Inter', sans-serif; color: var(--mu2);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-rank-row-chev { color: var(--mu2); flex-shrink: 0; display: flex; }

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
    border-radius: var(--r-md);
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
    border-radius: var(--r);
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
    border-radius: var(--r-full); margin-top: 8px; overflow: hidden;
  }
  .aj-prog-bar {
    height: 100%; border-radius: var(--r-full);
    background: linear-gradient(90deg, var(--a), var(--a-lt));
    transition: width .5s var(--ease-out);
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
    border-radius: var(--r-lg);
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
    border-radius: var(--r);
    font: 600 12.5px/1 'Inter', sans-serif; color: var(--mu);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform .14s var(--ease-snap);
  }
  .aj-activity-all:hover { border-color: var(--bo4); color: var(--ink5); }
  .aj-activity-all:active { transform: scale(.98); }

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
    font: 600 11px/1.3 var(--ens-body, 'Inter'), sans-serif;
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
    border-radius: var(--r-sm);
  }
  .aj-act-time {
    font: 500 12px/1 var(--ens-body, 'Inter'), sans-serif;
    color: var(--ink3); font-variant-numeric: tabular-nums;
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
    border-radius: var(--r);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--s0);
    cursor: pointer;
    transition: border-color .15s var(--ease), transform .15s var(--ease), box-shadow .15s var(--ease);
    min-height: 44px;
  }
  .aj-eleve-row:hover {
    border-color: var(--bo4);
    transform: translateY(-1px);
    box-shadow: var(--s1);
  }
  .aj-eleve-row:active { transform: scale(.985); }
  .aj-eleve-row:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; border-radius: var(--r); }

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
    font: 700 13px/1 var(--ens-display, 'Fredoka'), sans-serif;
    color: var(--adk); font-variant-numeric: tabular-nums; letter-spacing: -.01em;
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
    border-radius: var(--r-lg);
  }

  /* Skeleton — shimmer */
  .aj-skel { display: flex; flex-direction: column; gap: 16px; padding: 24px 16px; }
  .aj-skel-kpi {
    height: 90px;
    background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
    background-size: 200% 100%;
    border-radius: var(--r-lg);
    animation: aj-shimmer 1.4s ease-in-out infinite;
  }
  .aj-skel-bloc {
    height: 160px;
    background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
    background-size: 200% 100%;
    border-radius: var(--r-lg);
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
    border-radius: var(--r-lg);
    padding: 18px;
    margin-bottom: 22px;
    cursor: pointer;
    box-shadow: var(--s0);
    transition: border-color .15s var(--ease), transform .15s var(--ease);
    animation: ajIn .5s var(--ease) both;
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
    border-radius: var(--r-sm);
    font: 500 12px/1 'Inter', sans-serif;
    color: var(--ink);
  }
  .aj-recap-row-name { flex: 1; }
  .aj-recap-row-dur  { font: 700 12px/1 var(--ens-body, 'Inter'), sans-serif; color: var(--adk); font-variant-numeric: tabular-nums; flex-shrink: 0; }
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
    .aj-hero, .aj-hero2, .aj-recap, .aj-validate, .aj-skel-kpi, .aj-skel-bloc, .aj-prog-bar,
    .aj-validate-cta, .aj-validate-other, .aj-action, .aj-eleve-row, .aj-prog, .aj-recap {
      animation: none !important;
      transition: none !important;
    }
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
  const [
    valsAll,
    elevesAll,
    todaySessionsRes,
    profileRes,
    totalValsRes,
    leagueRes,
  ] = await Promise.all([
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

  if (valsAll.error) {
    toast("Impossible de charger les données", "error");
  }

  const recentVals = valsAll.data || [];
  const elevesMap = {};
  (elevesAll.data || []).forEach((e, i) => {
    elevesMap[e.id] = { ...e, idx: i };
  });

  const prenom = profileRes?.data?.prenom || "";
  const streakPro = profileRes?.data?.streak_pro_days ?? 0;
  const totalValsCount = totalValsRes?.count ?? 0;
  const moniteurState = getMoniteurState(totalValsCount);

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
  // « À relancer » n'est plus en vedette sur l'accueil : ça vit dans le filtre
  // Relance de la page Élèves (cf. décision refonte). On ne le calcule plus ici.

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

  // ─── Widget DOMINANT : Valider une compétence ──────────────────
  // L'élément reine de l'accueil = le geste qui crée la valeur (pas « à
  // relancer », qui vit dans le filtre Relance des élèves). Liste d'élèves à
  // faire avancer (vus récemment d'abord, non terminés) → tap → leur livret.
  const toValidate = mesElevesActifs
    .filter((e) => (e.acquis || 0) < REMC_TOTAL)
    .sort((a, b) =>
      (elevesMap[b.id]?.last_active_at || "").localeCompare(
        elevesMap[a.id]?.last_active_at || "",
      ),
    )
    .slice(0, 4);

  const validateWidget =
    nbElevesActifs === 0
      ? `
    <div class="aj-validate" id="aj-validate">
      <div class="aj-validate-hd"><span class="aj-validate-ttl">Par où commencer</span></div>
      <p class="aj-validate-sub">Invite ton premier élève. Il reçoit un lien, crée son compte en 1 minute, et son livret de compétences s'ouvre automatiquement.</p>
      <button class="aj-validate-cta" id="aj-validate-invite" type="button">${icon("user-plus", { size: 16, strokeWidth: 2.2 })} Inviter un élève</button>
    </div>`
      : `
    <div class="aj-validate" id="aj-validate">
      <div class="aj-validate-hd"><span class="aj-validate-ttl">Valider une compétence</span></div>
      <p class="aj-validate-sub">Sélectionne un élève pour ouvrir son livret et enregistrer ce qu'il a réussi.</p>
      <div class="aj-validate-list">
        ${toValidate
          .map((e) => {
            const nom = esc(
              fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "—",
            );
            return `<button class="aj-validate-row" data-eleve-id="${esc(e.id)}" type="button" aria-label="Ouvrir le livret de ${nom}">
            <span class="aj-validate-av">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 38)}</span>
            <span class="aj-validate-nom">${nom}</span>
            <span class="aj-validate-prog">${e.acquis}/${REMC_TOTAL}</span>
            <span class="aj-validate-chev">${icon("chevron-right", { size: 18, strokeWidth: 2 })}</span>
          </button>`;
          })
          .join("")}
      </div>
      <button class="aj-validate-other" id="aj-validate-other" type="button">Un autre élève ${icon("arrow-right", { size: 15, strokeWidth: 2.5 })}</button>
    </div>`;

  // ─── Widget récap soir ────────────────────────────────────────
  const isEvening = new Date().getHours() >= 18;
  const todaySessions = todaySessionsRes?.data || [];

  const recapWidget =
    isEvening && todaySessions.length > 0
      ? `
    <div class="aj-recap" id="aj-recap-soir" role="button" tabindex="0" aria-label="Ouvrir la validation de séance">
      <div class="aj-recap-head">
        <span class="aj-recap-title">Séances du jour</span>
        <span class="aj-recap-kpi">${todaySessions.length}</span>
      </div>
      <div class="aj-recap-sub">${todaySessions.length} séance${todaySessions.length > 1 ? "s" : ""} enregistrée${todaySessions.length > 1 ? "s" : ""} — Pense à valider les compétences.</div>
      <div class="aj-recap-rows">
        ${todaySessions
          .map(
            (s) => `
          <div class="aj-recap-row">
            <span class="aj-recap-row-name">${esc(fmtName(s.eleve_prenom) || "Élève")}</span>
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

      <!-- HERO arcade routière : panneaux semés en fond (cf. panneaux-bg.js) -->
      <div class="aj-hero2">
        ${panneauxLayer({ variant: "hero" })}
        <div class="aj-hero2-content">
          <p class="aj-hero2-date">${formatDate(new Date())}</p>
          <h1 class="aj-hero2-name" tabindex="-1">${prenom ? `Bonjour, ${esc(fmtName(prenom))}` : "Aujourd'hui"}</h1>
          ${
            nbElevesActifs > 0
              ? `<p class="aj-hero2-value"><b>${nbElevesActifs} élève${nbElevesActifs > 1 ? "s" : ""}</b> en cours. Valide leurs compétences pour faire avancer leur livret.</p>`
              : `<p class="aj-hero2-value">Commence par inviter un élève. Il rejoint en un clic, et son livret de compétences se remplit à chaque leçon.</p>`
          }
          ${
            streakPro >= 2
              ? `<div class="aj-hero2-chips">
            <span class="aj-hero2-chip">${icon("flame", { size: 12, strokeWidth: 2 })} ${streakPro} jours actifs</span>
          </div>`
              : ""
          }
        </div>
      </div>

      ${recapWidget}

      <!-- Widget dominant : valider une compétence -->
      ${validateWidget}

      <!-- KPI cadrés en valeur : mes élèves / engagement 7 j / progression -->
      <div class="aj-section-title">Tableau de bord</div>
      <div class="aj-quickstats">
        <div class="aj-quickstat" title="${nbElevesEcole} élèves dans l'école">
          <div class="aj-quickstat-val">${nbElevesActifs}</div>
          <div class="aj-quickstat-lbl">Mes élèves</div>
        </div>
        <div class="aj-quickstat"${nbElevesActifs > 0 ? ` title="${actifs7j} élèves sur ${nbElevesActifs}"` : ""}>
          <div class="aj-quickstat-val">${nbElevesActifs > 0 ? `${engagementPct}<small> %</small>` : "—"}</div>
          <div class="aj-quickstat-lbl">Actifs 7 derniers jours</div>
          <div class="aj-quickstat-bar"><div style="width:${engagementPct}%"></div></div>
        </div>
        <div class="aj-quickstat">
          <div class="aj-quickstat-val">${nbElevesActifs > 0 ? `${livretPct}<small> %</small>` : "—"}</div>
          <div class="aj-quickstat-lbl">Progression moyenne</div>
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

      <!-- Accès classements (1 carte repliable : ma ligue + ligues élèves) -->
      <div class="aj-section">
        <div class="aj-section-title">Classements</div>
        <details class="aj-ranks" id="aj-ranks">
          <summary class="aj-ranks-sum">
            <span class="aj-ranks-ico">${icon("award", { size: 17, strokeWidth: 2 })}</span>
            <span class="aj-ranks-hd">
              <div class="aj-ranks-ttl">Classements</div>
              <div class="aj-ranks-meta">
                ${myLeague ? `<span style="width:7px;height:7px;border-radius:50%;background:${myLeague.color};display:inline-block;flex-shrink:0" aria-hidden="true"></span>` : ""}
                <span>${
                  myLeague
                    ? `Ma ligue ${esc(myLeague.name)}${myLeagueRow?.rank_pos ? ` · ${myLeagueRow.rank_pos}ᵉ` : ""}`
                    : "Pas encore classé"
                }</span>
              </div>
            </span>
            <span class="aj-ranks-chev">${icon("chevron-down", { size: 18, strokeWidth: 2 })}</span>
          </summary>
          <div class="aj-ranks-body">
            <a class="aj-rank-row" href="#/ligue-semaine" id="aj-ligue-moi">
              <span class="aj-rank-row-ico">${myLeague ? `<span style="width:9px;height:9px;border-radius:50%;background:${myLeague.color};display:inline-block" aria-hidden="true"></span>` : icon("flame", { size: 14, strokeWidth: 2 })}</span>
              <span class="aj-rank-row-body">
                <span class="aj-rank-row-main">${
                  myLeague
                    ? `Ma ligue · ${esc(myLeague.name)}${myLeagueRow?.rank_pos ? ` · ${myLeagueRow.rank_pos}ᵉ` : ""}`
                    : "Ma ligue"
                }</span>
                <span class="aj-rank-row-sub">${
                  myWeeklyPts > 0
                    ? `${myWeeklyPts} validation${myWeeklyPts > 1 ? "s" : ""} cette semaine`
                    : "1 validation = 1 point"
                }</span>
              </span>
              <span class="aj-rank-row-chev">${icon("chevron-right", { size: 16, strokeWidth: 2 })}</span>
            </a>
            <a class="aj-rank-row" href="#/classement-eleves/theorie" id="aj-ligue-theorie">
              <span class="aj-rank-row-ico">${icon("book-open", { size: 14, strokeWidth: 2 })}</span>
              <span class="aj-rank-row-body">
                <span class="aj-rank-row-main">Ligue Révision · mes élèves</span>
                <span class="aj-rank-row-sub">Qui révise en autonomie ?</span>
              </span>
              <span class="aj-rank-row-chev">${icon("chevron-right", { size: 16, strokeWidth: 2 })}</span>
            </a>
            <a class="aj-rank-row" href="#/classement-eleves/pratique" id="aj-ligue-pratique">
              <span class="aj-rank-row-ico">${icon("check-circle", { size: 14, strokeWidth: 2 })}</span>
              <span class="aj-rank-row-body">
                <span class="aj-rank-row-main">Ligue Pratique · mes élèves</span>
                <span class="aj-rank-row-sub">Progression livret de compétences</span>
              </span>
              <span class="aj-rank-row-chev">${icon("chevron-right", { size: 16, strokeWidth: 2 })}</span>
            </a>
          </div>
        </details>
      </div>

      <!-- Activité récente -->
      <div class="aj-section">
        <div class="aj-section-title">Activité récente</div>
        ${
          recentVals.length === 0
            ? `<div class="aj-empty" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px 20px;">
               <span style="opacity:.5;color:var(--mu)" aria-hidden="true">${icon("clipboard", { size: 34 })}</span>
               <strong style="font:600 14px/1.2 'Inter',sans-serif;color:var(--ink)">Aucune validation pour l'instant</strong>
               <span style="font:500 12px/1.5 'Inter',sans-serif;color:var(--mu2);text-align:center">Enregistre une séance après ta prochaine leçon.<br>L'activité apparaît ici en temps réel.</span>
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

  // Wire listeners — widget dominant « valider une compétence »
  root.querySelectorAll(".aj-validate-row[data-eleve-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const id = row.dataset.eleveId;
      haptic("impact"); // « clac » net : on ouvre une action métier
      track("validate_widget.eleve_tapped", { eleve_id: id });
      navigate(`#/log-session?eleveId=${id}`);
    });
  });
  root.querySelector("#aj-validate-other")?.addEventListener("click", () => {
    haptic("impact");
    track("validate_widget.other_tapped");
    navigate("#/eleves");
  });
  root.querySelector("#aj-validate-invite")?.addEventListener("click", () => {
    haptic("impact");
    track("validate_widget.invite_tapped");
    openInviteEleveModal(_me);
  });

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
  root.querySelector("#aj-ligue-theorie")?.addEventListener("click", () => {
    track("ligue.open", { from: "aujourdhui", which: "eleves_theorie" });
  });
  root.querySelector("#aj-ligue-pratique")?.addEventListener("click", () => {
    track("ligue.open", { from: "aujourdhui", which: "eleves_pratique" });
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
    fmtName([eleve.prenom, eleve.nom].filter(Boolean).join(" ")) || "—",
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
    fmtName([eleve.prenom, eleve.nom].filter(Boolean).join(" ")) || "—",
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
