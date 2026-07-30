// ═══════════════════════════════════════════════════════════════
// Enseignant — Trophées : données partagées + feuille de détail « en place »
//
// Source UNIQUE des 12 jalons moniteur, partagée par :
//   - src/pages/enseignant/mon-blason.js        (rail « Trophées », hub)
//   - src/pages/enseignant/trophees-moniteur.js (page complète)
// Avant, les 12 trophées étaient dupliqués dans les deux fichiers → risque de
// dérive. Ici on centralise (définitions + médailles + badges + calcul d'état).
//
// La feuille de détail s'ouvre VIA openBottomSheet → elle est posée sur <body>
// (hors #app), z-index 600 > nav (300) : elle s'affiche PAR-DESSUS la barre de
// nav SANS redirection ni masquage manuel. Cliquer un trophée du rail ouvre donc
// son détail directement, en place (plus de navigation « page en flou »).
// ═══════════════════════════════════════════════════════════════
import {
  openBottomSheet,
  trustedBottomSheetHtml,
} from "@/components/common/bottom-sheet.js";
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { toast } from "@/components/common/toast.js";
import { navigate } from "@/router.js";
import { track } from "@/services/analytics.js";

// ─── Médailles (raretés) — couleurs de médaille, pas couleurs de marque ──
export const TIERS = {
  bronze: {
    label: "Bronze",
    gradient: "linear-gradient(145deg,#92400e,#d97706)",
    color: "#cd7f32",
    glow: "rgba(205,127,50,.55)",
  },
  argent: {
    label: "Argent",
    gradient: "linear-gradient(145deg,#475569,#cbd5e1)",
    color: "#94a3b8",
    glow: "rgba(148,163,184,.5)",
  },
  or: {
    label: "Or",
    gradient: "linear-gradient(145deg,#b45309,#fbbf24)",
    color: "#d97706",
    glow: "rgba(245,158,11,.6)",
  },
  platine: {
    label: "Platine",
    gradient: "linear-gradient(145deg,#0369a1,#7dd3fc)",
    color: "#0ea5e9",
    glow: "rgba(56,189,248,.55)",
  },
  diamant: {
    label: "Diamant",
    gradient: "linear-gradient(145deg,#5b21b6,#c4b5fd)",
    color: "var(--pu)",
    glow: "rgba(167,139,250,.7)",
  },
};
export const TIER_ORDER = ["bronze", "argent", "or", "platine", "diamant"];

// ─── Les 12 trophées (jalons pédagogiques) ───────────────────────
const TROPHEES = [
  // ─ Bronze
  {
    id: "premiere_seance",
    tier: "bronze",
    iconName: "car",
    name: "Premier pas",
    goal: "1 séance",
    desc: "Première séance enregistrée dans PermiGo.",
    check: (d) => d.totalVals >= 1,
    progress: (d) => ({ v: Math.min(1, d.totalVals), max: 1 }),
  },
  {
    id: "dix_comps",
    tier: "bronze",
    iconName: "check-circle",
    name: "10 validations",
    goal: "10 validations",
    desc: "Un début solide — 10 compétences validées avec tes élèves.",
    check: (d) => d.totalVals >= 10,
    progress: (d) => ({ v: Math.min(10, d.totalVals), max: 10 }),
  },
  {
    id: "premier_eleve",
    tier: "bronze",
    iconName: "user",
    name: "Premier élève mobilisé",
    goal: "1 élève actif",
    desc: "Ton premier élève actif dans l'app ces 30 derniers jours.",
    check: (d) => d.studentsActive >= 1,
    progress: (d) => ({ v: Math.min(1, d.studentsActive), max: 1 }),
  },
  // ─ Argent
  {
    id: "streak_7",
    tier: "argent",
    iconName: "flame",
    name: "Semaine active",
    goal: "7 jours d'affilée",
    desc: "7 jours consécutifs d'activité pédagogique.",
    check: (d) => d.streak >= 7,
    progress: (d) => ({ v: Math.min(7, d.streak), max: 7 }),
  },
  {
    id: "cinquante_comps",
    tier: "argent",
    iconName: "trending-up",
    name: "50 validations",
    goal: "50 validations",
    desc: "La régularité commence à faire une vraie différence.",
    check: (d) => d.totalVals >= 50,
    progress: (d) => ({ v: Math.min(50, d.totalVals), max: 50 }),
  },
  {
    id: "cinq_eleves",
    tier: "argent",
    iconName: "users",
    name: "Classe en formation",
    goal: "5 élèves suivis",
    desc: "5 élèves suivis simultanément dans PermiGo.",
    check: (d) => d.studentsTotal >= 5,
    progress: (d) => ({ v: Math.min(5, d.studentsTotal), max: 5 }),
  },
  // ─ Or
  {
    id: "cent_comps",
    tier: "or",
    iconName: "award",
    name: "100 validations",
    goal: "100 validations",
    desc: "Référent pédagogique — 100 compétences validées, un suivi qui fait la différence.",
    check: (d) => d.totalVals >= 100,
    progress: (d) => ({ v: Math.min(100, d.totalVals), max: 100 }),
  },
  {
    id: "streak_30",
    tier: "or",
    iconName: "zap",
    name: "Mois sans faille",
    goal: "30 jours d'affilée",
    desc: "30 jours consécutifs actifs sans interruption.",
    check: (d) => d.streak >= 30,
    progress: (d) => ({ v: Math.min(30, d.streak), max: 30 }),
  },
  {
    id: "dix_eleves",
    tier: "or",
    iconName: "users",
    name: "Portefeuille solide",
    goal: "10 élèves suivis",
    desc: "10 élèves accompagnés en parallèle.",
    check: (d) => d.studentsTotal >= 10,
    progress: (d) => ({ v: Math.min(10, d.studentsTotal), max: 10 }),
  },
  // ─ Platine
  {
    id: "deux_cent_comps",
    tier: "platine",
    iconName: "shield",
    name: "200 validations",
    goal: "200 validations",
    desc: "Expertise avérée — tu formes des conducteurs solides.",
    check: (d) => d.totalVals >= 200,
    progress: (d) => ({ v: Math.min(200, d.totalVals), max: 200 }),
  },
  {
    id: "classe_complete",
    tier: "platine",
    iconName: "check-circle",
    name: "Classe au complet",
    goal: "Toute la classe active",
    desc: "Tous tes élèves actifs sur les 30 derniers jours.",
    check: (d) => d.studentsTotal >= 3 && d.studentsActive >= d.studentsTotal,
    progress: (d) => ({
      v: d.studentsActive,
      max: Math.max(3, d.studentsTotal),
    }),
  },
  // ─ Diamant
  {
    id: "expert_remc",
    tier: "diamant",
    iconName: "crown",
    name: "Référent certifié",
    goal: "300 validations",
    desc: "300 validations — palier ultime. Tu maîtrises l'accompagnement complet de tes élèves.",
    check: (d) => d.totalVals >= 300,
    progress: (d) => ({ v: Math.min(300, d.totalVals), max: 300 }),
  },
];

// Badge 3D par jalon (assets public/skins/badge-3d-*.webp).
const BADGE_IMG = {
  premiere_seance: "badge-3d-01",
  dix_comps: "badge-3d-02",
  premier_eleve: "badge-3d-03",
  streak_7: "badge-3d-04",
  cinquante_comps: "badge-3d-06",
  cinq_eleves: "badge-3d-08",
  cent_comps: "badge-3d-02",
  streak_30: "badge-3d-04",
  dix_eleves: "badge-3d-06",
  deux_cent_comps: "badge-3d-08",
  classe_complete: "badge-3d-01",
  expert_remc: "badge-3d-ultimate",
};
export const badgeSrc = (id) => `/skins/${BADGE_IMG[id] || "badge-3d-01"}.webp`;

// ─── Calcul d'état des 12 trophées pour un set de données `d` ─────
// d = { totalVals, streak, studentsTotal, studentsActive }
export function computeTrophees(d) {
  return TROPHEES.map((t) => {
    const prog = t.progress(d);
    const unlocked = t.check(d);
    const pct = prog.max > 0 ? Math.round((prog.v / prog.max) * 100) : 0;
    const close = !unlocked && pct >= 25;
    return { ...t, prog, unlocked, pct, close, mystery: !unlocked && !close };
  });
}

// ─── CSS de la feuille (injecté une seule fois dans <head>) ──────
// Posée sur <body> → z-index 600 passe au-dessus de la nav (300) sans bricolage.
const SHEET_STYLE = `
.trsh-bg {
  position: fixed; inset: 0; z-index: 600;
  background: rgba(11,13,26,.6);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
  animation: trshFadeBg .2s ease both;
}
@keyframes trshFadeBg { from { opacity: 0; } to { opacity: 1; } }
.trsh {
  width: 100%; max-width: 480px; background: var(--su);
  border-radius: 26px 26px 0 0; overflow: hidden;
  padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
  animation: trshUp .3s cubic-bezier(.32,.72,0,1) both;
  touch-action: none;
}
@keyframes trshUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.trsh-glow {
  height: 162px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; position: relative;
}
.trsh-handle {
  width: 36px; height: 4px; background: rgba(255,255,255,.5); border-radius: 2px;
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
}
.trsh-ico {
  width: 96px; height: 96px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.2); color: #fff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 8px 24px rgba(0,0,0,.25);
  animation: trshIcoIn .5s .08s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes trshIcoIn { from { transform: scale(.4) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
.trsh-img { width: 92px; height: 92px; object-fit: contain; display: block; filter: drop-shadow(0 5px 12px rgba(0,0,0,.28)); }
.trsh-tier {
  font: 700 11px/1 'IBM Plex Mono', monospace; letter-spacing: .08em; text-transform: uppercase;
  color: #fff; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.32);
  border-radius: var(--ens-r-pill, 999px); padding: 4px 11px;
}
.trsh-body { padding: 20px 20px 8px; }
.trsh-title {
  font: 700 22px/1.2 var(--ens-display, 'Fredoka'), sans-serif;
  color: var(--ink); letter-spacing: -.02em; margin: 0 0 8px;
}
.trsh-desc { font: 500 14px/1.55 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu); margin: 0 0 16px; }
.trsh-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.trsh-chip-val {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
  border-radius: var(--ens-r-pill, 999px);
  font: 700 12px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  background: color-mix(in srgb, #4f46e5 14%, var(--su));
  color: #4f46e5;
  border: 1.5px solid color-mix(in srgb, #4f46e5 28%, transparent);
}
.trsh-chip-prog {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
  border-radius: var(--ens-r-pill, 999px);
  font: 700 12px/1 'IBM Plex Mono', monospace;
  background: var(--bg2); color: var(--mu3);
  border: 1px solid var(--bo);
}
.trsh-social { font: 500 12.5px/1.45 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu2); margin-bottom: 18px; }
.trsh-actions { display: flex; gap: 8px; padding: 0 20px 8px; }
.trsh-share {
  flex: 1; padding: 14px; min-height: 50px; border: 0;
  border-radius: var(--ens-r, 16px);
  background: linear-gradient(180deg, #625ee8, #4f46e5);
  color: #fff;
  font: 700 14px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 0 0 color-mix(in srgb, #4f46e5 60%, #000);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform .1s ease, box-shadow .1s ease;
}
.trsh-share:active { transform: translateY(3px); box-shadow: 0 1px 0 0 color-mix(in srgb, #4f46e5 60%, #000); }
.trsh-share:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
.trsh-close {
  padding: 14px 20px; min-height: 50px;
  border: 1.5px solid var(--bo4); border-radius: var(--ens-r, 16px);
  background: var(--bg); color: var(--mu3);
  font: 700 14px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; cursor: pointer;
  transition: background .15s, border-color .15s;
}
.trsh-close:hover { background: var(--bg2); border-color: var(--bo4); }
.trsh-close:focus-visible { outline: 3px solid #4f46e5; outline-offset: 2px; }
.trsh-glow.locked { background: var(--bg2); border-bottom: 1px solid var(--bo); }
.trsh-glow.locked .trsh-ico { background: var(--su); color: var(--mu2); border: 1px solid var(--bo); box-shadow: none; }
.trsh-glow.locked .trsh-handle { background: var(--bo4); }
.trsh-glow.locked .trsh-tier { background: var(--su); color: var(--mu3); border-color: var(--bo); }
@media (prefers-reduced-motion: reduce) {
  .trsh-bg, .trsh, .trsh-ico { animation: none !important; }
  .trsh-share { transition: none !important; }
}`;

let _styled = false;
function _ensureStyle() {
  if (_styled || document.getElementById("trsh-style")) {
    _styled = true;
    return;
  }
  const s = document.createElement("style");
  s.id = "trsh-style";
  s.textContent = SHEET_STYLE;
  document.head.appendChild(s);
  _styled = true;
}

// ─── Contenu de la feuille ───────────────────────────────────────
function _sheetHtml(t, cfg) {
  if (t.unlocked) {
    return `<div class="trsh">
      <div class="trsh-glow" style="background:${cfg.gradient}">
        <div class="trsh-handle"></div>
        <div class="trsh-ico" style="background:transparent;border:0;box-shadow:none"><img src="${badgeSrc(t.id)}" alt="" class="trsh-img"></div>
        <div class="trsh-tier">${cfg.label}</div>
      </div>
      <div class="trsh-body">
        <h2 class="trsh-title" id="trsh-title">${esc(t.name)}</h2>
        <p class="trsh-desc">${esc(t.desc)}</p>
        <div class="trsh-meta">
          <span class="trsh-chip-val">${icon("check", { size: 13, strokeWidth: 3 })} ${esc(t.goal)}</span>
        </div>
        <div class="trsh-social">Une preuve de plus de ton travail au quotidien.</div>
      </div>
      <div class="trsh-actions">
        <button class="trsh-share" id="trsh-share">${icon("share", { size: 18, strokeWidth: 2 })} Partager</button>
        <button class="trsh-close" id="trsh-close">Fermer</button>
      </div>
    </div>`;
  }
  return `<div class="trsh">
    <div class="trsh-glow locked">
      <div class="trsh-handle"></div>
      <div class="trsh-ico">${icon("lock", { size: 40, strokeWidth: 2 })}</div>
      <div class="trsh-tier">Verrouillé · ${cfg.label}</div>
    </div>
    <div class="trsh-body">
      <h2 class="trsh-title" id="trsh-title">${t.mystery ? "À découvrir" : esc(t.name)}</h2>
      <p class="trsh-desc">${t.mystery ? "Continue à valider des compétences pour révéler ce trophée." : esc(t.desc)}</p>
      <div class="trsh-meta">
        <span class="trsh-chip-val">Objectif : ${esc(t.goal)}</span>
        ${t.close ? `<span class="trsh-chip-prog">${t.prog.v}/${t.prog.max} — ${t.pct}%</span>` : ""}
      </div>
      <div class="trsh-social">Chaque validation te rapproche de ce jalon.</div>
    </div>
    <div class="trsh-actions">
      <button class="trsh-share" id="trsh-goto">Voir mon parcours ${icon("chevron-right", { size: 16, strokeWidth: 2.5 })}</button>
      <button class="trsh-close" id="trsh-close">Fermer</button>
    </div>
  </div>`;
}

async function _shareTrophy(t) {
  const text = `J'ai débloqué le jalon « ${t.name} » sur PermiGo`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Trophée PermiGo", text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toast("Copié dans le presse-papier", "success");
    }
  } catch {
    /* partage annulé par l'utilisateur — silencieux */
  }
}

// ─── Ouvre le détail d'un trophée « en place » (body-level) ──────
// t : un résultat issu de computeTrophees() (avec unlocked/prog/pct/close/mystery).
// opts.triggerEl : élément déclencheur (restauration du focus à la fermeture).
export function openTrophySheet(t, opts = {}) {
  if (!t) return;
  _ensureStyle();
  const cfg = TIERS[t.tier];
  track("trophees_moniteur.detail", { id: t.id, unlocked: t.unlocked });
  haptic(t.unlocked ? "unlock" : "select");

  const { overlay, close } = openBottomSheet({
    bgClass: "trsh-bg",
    sheetSelector: ".trsh",
    html: trustedBottomSheetHtml(_sheetHtml(t, cfg)),
    labelledBy: "trsh-title",
    triggerEl: opts.triggerEl,
  });

  overlay.querySelector("#trsh-close")?.addEventListener("click", close);
  overlay
    .querySelector("#trsh-share")
    ?.addEventListener("click", () => _shareTrophy(t));
  overlay.querySelector("#trsh-goto")?.addEventListener("click", () => {
    close();
    navigate("#/mon-blason");
  });
}
