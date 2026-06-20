// ═══════════════════════════════════════════════════════════════
// Enseignant — Trophées (écran unifié)
// Moteur visuel des trophées élève (tr2-*) porté au moniteur :
// hero accent pro (encre/sombre) + halo vert de marque, grille 3 col
// par médaille (rareté), états verrouillés visibles (ADN Clash Royale),
// bottom-sheet de détail. ZÉRO gemme / monnaie virtuelle (décision figée).
//
// Contenu = 12 jalons pédagogiques. Absorbe badges-moniteur.js et
// recompenses.js (mêmes seuils de validations) → un seul écran.
// Données réelles : validations.validated_by, profiles.streak_pro_days,
// élèves suivis (enseignant_id) + actifs 30j. Tout existe déjà en base.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";

// ─── Médailles (raretés) — couleurs de médaille, pas couleurs de marque ──
const TIERS = {
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
const TIER_ORDER = ["bronze", "argent", "or", "platine", "diamant"];

// ─── Les 12 trophées (jalons pédagogiques) ───────────────────────
// iconName : uniquement des icônes présentes dans utils/icons.js.
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

// Badge 3D par jalon (assets public/skins/badge-3d-*.png). Réutilise les
// badges existants — l'icône lucide reste le repli mystère/erreur.
// Pour changer un visuel : édite juste le nom de fichier ci-dessous.
// N.B. badge-3d-05 / 07 / 09 sont SANS transparence (fond blanc) → exclus.
// On n'utilise que les badges transparents : 01,02,03,04,06,08,ultimate.
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
const badgeSrc = (id) => `/skins/${BADGE_IMG[id] || "badge-3d-01"}.webp`;

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.tr2 {
  max-width: 480px; margin: 0 auto;
  padding: 0 0 calc(100px + env(safe-area-inset-bottom, 0px));
  background: var(--bg); color: var(--ink);
  font-family: 'Inter', sans-serif;
}

/* ── Header simple ── */
.tr2-hd {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; background: var(--su);
  border-bottom: 1px solid var(--bo);
}
.tr2-back {
  width: 44px; height: 44px; border-radius: var(--r); flex-shrink: 0;
  border: 1px solid var(--bo); background: var(--su); color: var(--ink);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background .15s var(--t, var(--ease)), border-color .15s;
  -webkit-tap-highlight-color: transparent;
}
@media (hover:hover) { .tr2-back:hover { background: var(--bg2); border-color: var(--bo4); } }
.tr2-back:active { background: var(--bg2); }
.tr2-back:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
.tr2-hd-info { flex: 1; min-width: 0; }
.tr2-hd-title { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.025em; }
.tr2-hd-sub { font: 500 12px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }

/* ── Hero : accent pro (encre/sombre) + halo vert de marque ── */
.tr2-hero {
  position: relative; overflow: hidden; padding: 20px 20px 22px;
  /* Parité accueil : image route au coucher de soleil + overlay sombre pour
     garder le texte blanc lisible (même asset que le hero « Aujourd'hui »). */
  background:
    linear-gradient(158deg, rgba(11,13,26,.82) 0%, rgba(20,35,5,.58) 46%, rgba(11,13,26,.82) 100%),
    url('/skins/landing/monde4jour.webp') center/cover no-repeat;
}
.tr2-hero::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 80% 70% at 12% 25%, color-mix(in srgb, var(--a) 30%, transparent) 0%, transparent 55%),
    radial-gradient(ellipse 55% 60% at 90% 85%, color-mix(in srgb, var(--am) 16%, transparent) 0%, transparent 55%);
}
.tr2-hero-in { position: relative; z-index: 1; }
.tr2-hero-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.tr2-hero-title { font: 800 22px/1.1 'Plus Jakarta Sans', sans-serif; color: #fff; letter-spacing: -.03em; }
.tr2-hero-count {
  font: 700 12px/1 'IBM Plex Mono', monospace; color: rgba(255,255,255,.82);
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
  border-radius: var(--r-full); padding: 6px 12px; white-space: nowrap;
}
.tr2-prog { display: flex; flex-direction: column; gap: 7px; }
.tr2-prog-bar { height: 7px; background: rgba(255,255,255,.18); border-radius: var(--r-full); overflow: hidden; }
.tr2-prog-fill {
  height: 100%; width: 0; border-radius: var(--r-full);
  background: linear-gradient(90deg, var(--a), var(--a-lt));
  box-shadow: 0 0 8px color-mix(in srgb, var(--a) 60%, transparent);
  transition: width 1s var(--ease-out);
}
.tr2-prog-hint { font: 500 11.5px/1.3 'Inter', sans-serif; color: rgba(255,255,255,.62); }

/* ── CTA premier démarrage ── */
.tr2-cta {
  margin: 16px 16px 0; padding: 14px 16px;
  background: var(--su); border: 1px solid var(--bo); border-radius: var(--r-lg);
  display: flex; align-items: center; gap: 14px; box-shadow: var(--s0);
}
.tr2-cta-txt { flex: 1; font: 500 13px/1.45 'Inter', sans-serif; color: var(--mu); }
.tr2-cta-btn {
  flex-shrink: 0; padding: 12px 16px; min-height: 44px;
  border: 0; border-radius: var(--r); background: var(--a); color: var(--a-ink);
  font: 800 13px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
  box-shadow: 0 4px 0 0 var(--adk); white-space: nowrap;
  transition: transform .18s cubic-bezier(0.23,1,0.32,1), box-shadow .18s cubic-bezier(0.23,1,0.32,1);
}
.tr2-cta-btn:active { transform: scale(.97) translateY(2px); box-shadow: 0 1px 0 0 var(--adk); }
.tr2-cta-btn:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }

/* ── Section label par médaille ── */
.tr2-group {
  padding: 22px 16px 10px; display: flex; align-items: center; gap: 8px;
  font: 800 11px/1 'Inter', sans-serif; letter-spacing: .09em;
  text-transform: uppercase;
}
.tr2-group .gcount {
  margin-left: auto; font: 700 11px/1 'IBM Plex Mono', monospace;
  color: var(--mu2); text-transform: none; letter-spacing: 0;
}

/* ── Grille 3 colonnes ── */
.tr2-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0 12px; }

/* ── Carte trophée ── */
.tr2-card {
  position: relative; border-radius: var(--rl); padding: 14px 8px 12px;
  display: flex; flex-direction: column; align-items: center; gap: 7px;
  min-height: 122px; width: 100%; border: 0; background: none; cursor: pointer;
  text-align: center; font-family: inherit; overflow: hidden;
  -webkit-tap-highlight-color: transparent; user-select: none;
  transition: transform .14s var(--ease-spring);
  animation: tr2In .45s var(--ease-out) both;
}
@keyframes tr2In { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }
.tr2-card:active { transform: scale(.93); }
.tr2-card:focus-visible { outline: 3px solid var(--a); outline-offset: 3px; }
.tr2-card.locked { background: var(--su); border: 1px solid var(--bo); }
.tr2-card.unlocked { color: #fff; }
.tr2-card.bronze  { background: var(--tc-grad); box-shadow: 0 4px 16px -4px var(--tc-glow); }
.tr2-card.argent  { background: var(--tc-grad); box-shadow: 0 4px 16px -4px var(--tc-glow); }
.tr2-card.or      { background: var(--tc-grad); box-shadow: 0 4px 16px -4px var(--tc-glow); }
.tr2-card.platine { background: var(--tc-grad); box-shadow: 0 4px 16px -4px var(--tc-glow); }
.tr2-card.diamant { background: var(--tc-grad); animation: tr2In .45s var(--ease-out) both, diamGlow 2.6s ease-in-out infinite alternate; }
@keyframes diamGlow {
  from { box-shadow: 0 4px 22px -4px rgba(167,139,250,.6); }
  to   { box-shadow: 0 4px 32px -2px rgba(196,181,253,.95), 0 0 0 1px rgba(196,181,253,.4); }
}
.tr2-card-dot {
  position: absolute; top: 8px; right: 8px; width: 6px; height: 6px; border-radius: 50%;
  background: #fff; box-shadow: 0 0 7px rgba(255,255,255,.8);
}
.tr2-card-ico {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; transition: transform .2s;
}
.tr2-card.unlocked .tr2-card-ico { background: rgba(255,255,255,.22); color: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,.4); }
.tr2-card.locked .tr2-card-ico { background: var(--bg2); color: var(--mu2); border: 1px solid var(--bo); }
.tr2-card.unlocked:active .tr2-card-ico { transform: scale(1.12); }
/* Badge 3D image (remplace l'icône lucide) */
.tr2-card.unlocked .tr2-card-ico,
.tr2-card.locked .tr2-card-ico { background: transparent; border: 0; box-shadow: none; }
.tr2-card-img { width: 48px; height: 48px; object-fit: contain; display: block; filter: drop-shadow(0 3px 6px rgba(0,0,0,.2)); }
.tr2-card-img.locked { filter: grayscale(1) opacity(.4); }
.tr2-sheet-img { width: 92px; height: 92px; object-fit: contain; display: block; filter: drop-shadow(0 5px 12px rgba(0,0,0,.28)); }
.tr2-card-name {
  font: 800 10.5px/1.2 'Plus Jakarta Sans', sans-serif; letter-spacing: -.01em;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.tr2-card.unlocked .tr2-card-name { color: rgba(255,255,255,.96); }
.tr2-card.locked .tr2-card-name { color: var(--mu2); }
.tr2-card-prog { font: 700 9.5px/1 'IBM Plex Mono', monospace; color: var(--mu3); background: var(--bg2); padding: 3px 7px; border-radius: var(--r-full); }

@media (prefers-reduced-motion: reduce) {
  .tr2-card, .tr2-prog-fill { animation: none !important; transition: none !important; }
  .tr2-card.diamant { animation: none !important; }
  .tr2-cta-btn, .tr2-sheet-share { transition: none !important; }
}

/* ── Bottom sheet (détail trophée) ── */
.tr2-sheet-bg {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(11,13,26,0); backdrop-filter: blur(0);
  display: flex; align-items: flex-end; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity .22s, background .22s;
}
.tr2-sheet-bg.open { opacity: 1; pointer-events: auto; background: rgba(11,13,26,.6); backdrop-filter: blur(6px); }
.tr2-sheet {
  width: 100%; max-width: 480px; background: var(--su);
  border-radius: 26px 26px 0 0; overflow: hidden;
  transform: translateY(100%); transition: transform .3s cubic-bezier(.32,.72,0,1);
  padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
}
.tr2-sheet-bg.open .tr2-sheet { transform: translateY(0); }
.tr2-sheet-glow {
  height: 162px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; position: relative;
}
.tr2-sheet-handle {
  width: 36px; height: 4px; background: rgba(255,255,255,.5); border-radius: 2px;
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
}
.tr2-sheet-ico {
  width: 96px; height: 96px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.2); color: #fff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 8px 24px rgba(0,0,0,.25);
  animation: tr2IcoIn .5s .08s var(--ease-spring) both;
}
@keyframes tr2IcoIn { from { transform: scale(.4) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
.tr2-sheet-tier {
  font: 800 11px/1 'IBM Plex Mono', monospace; letter-spacing: .08em; text-transform: uppercase;
  color: #fff; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.32);
  border-radius: var(--r-full); padding: 4px 11px;
}
.tr2-sheet-body { padding: 20px 20px 8px; }
.tr2-sheet-title { font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.025em; margin: 0 0 8px; }
.tr2-sheet-desc { font: 500 14px/1.55 'Inter', sans-serif; color: var(--mu); margin: 0 0 16px; }
.tr2-sheet-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.tr2-sheet-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
  border-radius: var(--r-full); font: 700 12px/1 'Inter', sans-serif;
}
.tr2-sheet-chip.val { background: var(--ag); color: var(--adk); }
.tr2-sheet-chip.prog { background: var(--bg2); color: var(--mu3); font-family: 'IBM Plex Mono', monospace; }
.tr2-sheet-social { font: 500 12.5px/1.45 'Inter', sans-serif; color: var(--mu2); margin-bottom: 18px; }
.tr2-sheet-actions { display: flex; gap: 8px; padding: 0 20px 8px; }
.tr2-sheet-share {
  flex: 1; padding: 14px; min-height: 50px; border: 0; border-radius: var(--r-md);
  background: var(--a); color: var(--a-ink); font: 800 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; box-shadow: 0 4px 0 0 var(--adk);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform .18s cubic-bezier(0.23,1,0.32,1), box-shadow .18s cubic-bezier(0.23,1,0.32,1);
}
.tr2-sheet-share:active { transform: scale(.97) translateY(2px); box-shadow: 0 1px 0 0 var(--adk); }
.tr2-sheet-share:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
.tr2-sheet-close {
  padding: 14px 20px; min-height: 50px; border: 1px solid var(--bo); border-radius: var(--r-md);
  background: var(--bg); color: var(--mu3); font: 700 14px/1 'Inter', sans-serif; cursor: pointer;
}
.tr2-sheet-close:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
.tr2-sheet-glow.locked { background: var(--bg2); border-bottom: 1px solid var(--bo); }
.tr2-sheet-glow.locked .tr2-sheet-ico { background: var(--su); color: var(--mu2); border: 1px solid var(--bo); box-shadow: none; }
.tr2-sheet-glow.locked .tr2-sheet-handle { background: var(--bo4); }
.tr2-sheet-glow.locked .tr2-sheet-tier { background: var(--su); color: var(--mu3); border-color: var(--bo); }
@media (prefers-reduced-motion: reduce) {
  .tr2-sheet-bg, .tr2-sheet, .tr2-sheet-ico { transition: none !important; animation: none !important; }
}
</style>`;

// ─── État module (sheet) ─────────────────────────────────────────
let _results = [];
let _onKeydown = null;
let _lastFocus = null;

// ─── Mount ────────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== "enseignant") {
    root.innerHTML = `<p style="padding:32px;text-align:center;color:var(--mu)">Accès enseignant requis</p>`;
    return;
  }

  track("page_view", { page: "trophees_moniteur" });

  root.innerHTML = `${STYLE}
<div class="tr2 anim-slide-up">
  ${_headerHtml("Chargement…")}
  <div class="tr2-hero">
    <div class="tr2-hero-in">
      <div class="tr2-hero-top"><h1 class="tr2-hero-title">Mes trophées</h1><div class="tr2-hero-count">—</div></div>
      <div class="tr2-prog"><div class="tr2-prog-bar"><div class="tr2-prog-fill"></div></div></div>
    </div>
  </div>
</div>`;
  _wireBack(root);

  try {
    const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
    const [profileRes, countRes, studentsRes, activeRes] = await Promise.all([
      sb
        .from("profiles")
        .select("prenom, streak_pro_days")
        .eq("id", me.id)
        .maybeSingle(),
      sb
        .from("validations")
        .select("id", { count: "exact", head: true })
        .eq("validated_by", me.id),
      sb
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("enseignant_id", me.id)
        .eq("role", "eleve"),
      sb
        .from("validations")
        .select("eleve_id")
        .eq("validated_by", me.id)
        .gte("validated_at", since30d),
    ]);

    const d = {
      totalVals: countRes.count ?? 0,
      streak: profileRes.data?.streak_pro_days ?? 0,
      studentsTotal: studentsRes.count ?? 0,
      studentsActive: new Set(
        (activeRes.data || []).map((v) => v.eleve_id).filter(Boolean),
      ).size,
      prenom: profileRes.data?.prenom ?? "",
    };
    _render(root, d);
  } catch (e) {
    console.error("[trophees-moniteur]", e);
    toast("Erreur de chargement", "error");
  }
}

export function unmount() {
  _closeSheet();
}

// ─── Render ──────────────────────────────────────────────────────
function _render(root, d) {
  _results = TROPHEES.map((t) => {
    const prog = t.progress(d);
    const unlocked = t.check(d);
    const pct = prog.max > 0 ? Math.round((prog.v / prog.max) * 100) : 0;
    const close = !unlocked && pct >= 25;
    return { ...t, prog, unlocked, pct, close, mystery: !unlocked && !close };
  });

  const unlockedCount = _results.filter((t) => t.unlocked).length;
  const total = _results.length;
  const pct = Math.round((unlockedCount / total) * 100);
  const remaining = total - unlockedCount;

  let gridHtml = "";
  for (const key of TIER_ORDER) {
    const cfg = TIERS[key];
    const list = _results.filter((t) => t.tier === key);
    if (!list.length) continue;
    const done = list.filter((t) => t.unlocked).length;
    gridHtml += `
      <div class="tr2-group" style="color:${cfg.color}">${cfg.label}<span class="gcount">${done}/${list.length}</span></div>
      <div class="tr2-grid">${list.map((t) => _cardHtml(t)).join("")}</div>`;
  }

  const cta =
    d.totalVals === 0
      ? `<div class="tr2-cta">
          <div class="tr2-cta-txt">Enregistre ta première séance pour débloquer tes premiers trophées.</div>
          <button class="tr2-cta-btn" id="tr2-start">Première séance</button>
        </div>`
      : "";

  root.innerHTML = `${STYLE}
<div class="tr2 anim-slide-up">
  ${_headerHtml(`${unlockedCount} débloqué${unlockedCount > 1 ? "s" : ""} sur ${total}`)}
  <div class="tr2-hero">
    <div class="tr2-hero-in">
      <div class="tr2-hero-top">
        <h1 class="tr2-hero-title">Mes trophées</h1>
        <div class="tr2-hero-count">${unlockedCount} / ${total}</div>
      </div>
      <div class="tr2-prog">
        <div class="tr2-prog-bar"><div class="tr2-prog-fill" id="tr2-fill"></div></div>
        <div class="tr2-prog-hint">${pct}&nbsp;% des jalons atteints${remaining > 0 ? ` — ${remaining} restant${remaining > 1 ? "s" : ""} à débloquer` : " — collection complète"}</div>
      </div>
    </div>
  </div>
  ${cta}
  ${gridHtml}
</div>
<div class="tr2-sheet-bg" id="tr2-sheet-bg" role="dialog" aria-modal="true" aria-label="Détail du trophée">
  <div class="tr2-sheet" id="tr2-sheet"></div>
</div>`;

  _wireBack(root);
  root
    .querySelector("#tr2-start")
    ?.addEventListener("click", () => navigate("#/log-session"));

  root.querySelectorAll(".tr2-card").forEach((el) => {
    el.addEventListener("click", () => {
      haptic("tap");
      _openSheet(root, parseInt(el.dataset.i, 10));
    });
  });

  const bg = root.querySelector("#tr2-sheet-bg");
  bg?.addEventListener("click", (e) => {
    if (e.target === bg) _closeSheet();
  });

  requestAnimationFrame(() => {
    const fill = root.querySelector("#tr2-fill");
    if (fill) fill.style.width = `${pct}%`;
  });
}

// ─── Header ──────────────────────────────────────────────────────
function _headerHtml(sub) {
  return `
  <div class="tr2-hd">
    <button class="tr2-back" id="tr2-back" aria-label="Retour au parcours">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
    <div class="tr2-hd-info">
      <div class="tr2-hd-title" tabindex="-1">Trophées</div>
      <div class="tr2-hd-sub">${esc(sub)}</div>
    </div>
  </div>`;
}

function _wireBack(root) {
  root.querySelector("#tr2-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/parcours");
  });
}

// ─── Carte ───────────────────────────────────────────────────────
function _cardHtml(t) {
  const i = _results.indexOf(t);
  const cfg = TIERS[t.tier];
  const cls = t.unlocked ? `unlocked ${t.tier}` : "locked";
  const icoHtml = t.mystery
    ? icon("lock", { size: 22, strokeWidth: 2 })
    : `<img src="${badgeSrc(t.id)}" alt="" class="tr2-card-img${t.unlocked ? "" : " locked"}" loading="lazy">`;
  const name = t.mystery ? "???" : esc(t.name);
  const sub = t.unlocked
    ? `<div class="tr2-card-dot"></div>`
    : t.close
      ? `<div class="tr2-card-prog">${t.prog.v}/${t.prog.max}</div>`
      : `<div class="tr2-card-prog">${cfg.label}</div>`;
  const styleVars = t.unlocked
    ? `--tc-grad:${cfg.gradient};--tc-glow:${cfg.glow}`
    : "";
  return `<button class="tr2-card ${cls}" style="${styleVars}" data-i="${i}" aria-label="${name}${t.unlocked ? " — débloqué" : " — verrouillé"}">
    <div class="tr2-card-ico">${icoHtml}</div>
    <div class="tr2-card-name">${name}</div>
    ${sub}
  </button>`;
}

// ─── Bottom sheet ────────────────────────────────────────────────
function _openSheet(root, i) {
  const t = _results[i];
  if (!t) return;
  const cfg = TIERS[t.tier];
  const sheet = root.querySelector("#tr2-sheet");
  const bg = root.querySelector("#tr2-sheet-bg");
  if (!sheet || !bg) return;

  track("trophees_moniteur.detail", { id: t.id, unlocked: t.unlocked });

  if (t.unlocked) {
    sheet.innerHTML = `
      <div class="tr2-sheet-glow" style="background:${cfg.gradient}">
        <div class="tr2-sheet-handle"></div>
        <div class="tr2-sheet-ico" style="background:transparent;border:0;box-shadow:none"><img src="${badgeSrc(t.id)}" alt="" class="tr2-sheet-img"></div>
        <div class="tr2-sheet-tier">${cfg.label}</div>
      </div>
      <div class="tr2-sheet-body">
        <h2 class="tr2-sheet-title">${esc(t.name)}</h2>
        <p class="tr2-sheet-desc">${esc(t.desc)}</p>
        <div class="tr2-sheet-meta">
          <div class="tr2-sheet-chip val">${icon("check", { size: 13, strokeWidth: 3 })} ${esc(t.goal)}</div>
        </div>
        <div class="tr2-sheet-social">Une preuve de plus de ton travail au quotidien.</div>
      </div>
      <div class="tr2-sheet-actions">
        <button class="tr2-sheet-share" id="tr2-share">${icon("share", { size: 18, strokeWidth: 2 })} Partager</button>
        <button class="tr2-sheet-close" id="tr2-close">Fermer</button>
      </div>`;
  } else {
    sheet.innerHTML = `
      <div class="tr2-sheet-glow locked">
        <div class="tr2-sheet-handle"></div>
        <div class="tr2-sheet-ico">${icon("lock", { size: 40, strokeWidth: 2 })}</div>
        <div class="tr2-sheet-tier">Verrouillé · ${cfg.label}</div>
      </div>
      <div class="tr2-sheet-body">
        <h2 class="tr2-sheet-title">${t.mystery ? "À découvrir" : esc(t.name)}</h2>
        <p class="tr2-sheet-desc">${t.mystery ? "Continue à valider des compétences pour révéler ce trophée." : esc(t.desc)}</p>
        <div class="tr2-sheet-meta">
          <div class="tr2-sheet-chip val">Objectif : ${esc(t.goal)}</div>
          ${t.close ? `<div class="tr2-sheet-chip prog">${t.prog.v}/${t.prog.max} — ${t.pct}%</div>` : ""}
        </div>
        <div class="tr2-sheet-social">Chaque validation te rapproche de ce jalon.</div>
      </div>
      <div class="tr2-sheet-actions">
        <button class="tr2-sheet-share" id="tr2-goto">Voir mon parcours ${icon("chevron-right", { size: 16, strokeWidth: 2.5 })}</button>
        <button class="tr2-sheet-close" id="tr2-close">Fermer</button>
      </div>`;
  }

  _lastFocus = document.activeElement;
  bg.classList.add("open");

  sheet.querySelector("#tr2-close")?.addEventListener("click", _closeSheet);
  sheet.querySelector("#tr2-goto")?.addEventListener("click", () => {
    _closeSheet();
    navigate("#/parcours");
  });
  sheet
    .querySelector("#tr2-share")
    ?.addEventListener("click", () => _shareTrophy(t));

  enableSheetSwipe(sheet, _closeSheet, { overlay: bg });

  _onKeydown = (e) => {
    if (e.key === "Escape") _closeSheet();
  };
  document.addEventListener("keydown", _onKeydown);

  // focus le premier bouton actionnable pour la nav clavier
  requestAnimationFrame(() => sheet.querySelector("button")?.focus());
}

function _closeSheet() {
  if (_onKeydown) {
    document.removeEventListener("keydown", _onKeydown);
    _onKeydown = null;
  }
  const bg = document.querySelector("#tr2-sheet-bg.open");
  if (bg) bg.classList.remove("open");
  if (_lastFocus && typeof _lastFocus.focus === "function") {
    _lastFocus.focus();
    _lastFocus = null;
  }
}

async function _shareTrophy(t) {
  const text = `J'ai débloqué le trophée « ${t.name} » sur PermiGo 🏆`;
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
