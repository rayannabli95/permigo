// ═══════════════════════════════════════════════════════════════
// Enseignant — Trophées professionnels
// 12 jalons pédagogiques tiérés bronze → diamant
// Design : iOS game + Clash Royale ADN + pédagogie d'engagement
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";

// ─── Tiers visuels (iOS game design) ─────────────────────────
const TIERS = {
  bronze: {
    label: "Bronze",
    iconName: "award",
    color: "#cd7f32",
    glow: "rgba(205,127,50,.45)",
    bg: "rgba(205,127,50,.10)",
    border: "rgba(205,127,50,.30)",
    gradient: "linear-gradient(145deg,#92400e,#d97706)",
    shimmer: "rgba(205,127,50,.15)",
  },
  argent: {
    label: "Argent",
    iconName: "shield",
    color: "#94a3b8",
    glow: "rgba(148,163,184,.45)",
    bg: "rgba(148,163,184,.10)",
    border: "rgba(148,163,184,.30)",
    gradient: "linear-gradient(145deg,#475569,#cbd5e1)",
    shimmer: "rgba(148,163,184,.15)",
  },
  or: {
    label: "Or",
    iconName: "trophy",
    color: "#f59e0b",
    glow: "rgba(245,158,11,.55)",
    bg: "rgba(245,158,11,.10)",
    border: "rgba(245,158,11,.35)",
    gradient: "linear-gradient(145deg,#b45309,#fbbf24)",
    shimmer: "rgba(245,158,11,.20)",
  },
  platine: {
    label: "Platine",
    iconName: "star",
    color: "#38bdf8",
    glow: "rgba(56,189,248,.50)",
    bg: "rgba(56,189,248,.08)",
    border: "rgba(56,189,248,.30)",
    gradient: "linear-gradient(145deg,#0369a1,#7dd3fc)",
    shimmer: "rgba(56,189,248,.15)",
  },
  diamant: {
    label: "Diamant",
    iconName: "gem",
    color: "#a78bfa",
    glow: "rgba(167,139,250,.60)",
    bg: "rgba(167,139,250,.12)",
    border: "rgba(167,139,250,.40)",
    gradient: "linear-gradient(145deg,#5b21b6,#c4b5fd)",
    shimmer: "rgba(167,139,250,.20)",
  },
};

// ─── Les 12 trophées ─────────────────────────────────────────
const TROPHEES = [
  // ─ Bronze
  {
    id: "premiere_seance",
    tier: "bronze",
    iconName: "play",
    name: "Premier pas",
    desc: "Première séance enregistrée dans PermiGo.",
    check: (d) => d.totalVals >= 1,
    progress: (d) => ({ v: Math.min(1, d.totalVals), max: 1 }),
  },
  {
    id: "dix_comps",
    tier: "bronze",
    iconName: "check-circle",
    name: "10 compétences",
    desc: "Un début qui compte — 10 acquisitions validées.",
    check: (d) => d.totalVals >= 10,
    progress: (d) => ({ v: Math.min(10, d.totalVals), max: 10 }),
  },
  {
    id: "premier_eleve",
    tier: "bronze",
    iconName: "user-check",
    name: "Premier élève mobilisé",
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
    desc: "7 jours consécutifs d'activité pédagogique.",
    check: (d) => d.streak >= 7,
    progress: (d) => ({ v: Math.min(7, d.streak), max: 7 }),
  },
  {
    id: "cinquante_comps",
    tier: "argent",
    iconName: "trending-up",
    name: "50 compétences",
    desc: "La régularité commence à faire une vraie différence.",
    check: (d) => d.totalVals >= 50,
    progress: (d) => ({ v: Math.min(50, d.totalVals), max: 50 }),
  },
  {
    id: "cinq_eleves",
    tier: "argent",
    iconName: "users",
    name: "Classe en formation",
    desc: "5 élèves suivis simultanément dans PermiGo.",
    check: (d) => d.studentsTotal >= 5,
    progress: (d) => ({ v: Math.min(5, d.studentsTotal), max: 5 }),
  },
  // ─ Or
  {
    id: "cent_comps",
    tier: "or",
    iconName: "award",
    name: "100 compétences",
    desc: "Référent pédagogique — 100 acquisitions accompagnées.",
    check: (d) => d.totalVals >= 100,
    progress: (d) => ({ v: Math.min(100, d.totalVals), max: 100 }),
  },
  {
    id: "streak_30",
    tier: "or",
    iconName: "zap",
    name: "Mois sans faille",
    desc: "30 jours consécutifs actifs sans interruption.",
    check: (d) => d.streak >= 30,
    progress: (d) => ({ v: Math.min(30, d.streak), max: 30 }),
  },
  {
    id: "dix_eleves",
    tier: "or",
    iconName: "users",
    name: "Portefeuille solide",
    desc: "10 élèves accompagnés en parallèle.",
    check: (d) => d.studentsTotal >= 10,
    progress: (d) => ({ v: Math.min(10, d.studentsTotal), max: 10 }),
  },
  // ─ Platine
  {
    id: "deux_cent_comps",
    tier: "platine",
    iconName: "shield",
    name: "200 compétences",
    desc: "Expertise pédagogique avérée — tu formes des conducteurs solides.",
    check: (d) => d.totalVals >= 200,
    progress: (d) => ({ v: Math.min(200, d.totalVals), max: 200 }),
  },
  {
    id: "classe_complete",
    tier: "platine",
    iconName: "check-circle",
    name: "Classe au complet",
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
    iconName: "star",
    name: "Expert REMC certifié",
    desc: "300 validations — le palier ultime. Statut Expert REMC débloqué.",
    check: (d) => d.totalVals >= 300,
    progress: (d) => ({ v: Math.min(300, d.totalVals), max: 300 }),
  },
];

// ─── CSS ─────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout ── */
.tm {
  max-width: 580px; margin: 0 auto;
  padding-bottom: 110px;
  background: var(--bg); color: var(--ink);
  font-family: 'Inter', sans-serif;
}

/* ── Header ── */
.tm-hd {
  padding: 18px 16px 16px;
  background: var(--su); border-bottom: 1px solid var(--bo);
  display: flex; align-items: center; gap: 12px;
}
.tm-back {
  width: 44px; height: 44px; border-radius: 10px;
  border: 1.5px solid var(--bo); background: var(--su);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--ink); flex-shrink: 0;
  transition: background .12s; -webkit-tap-highlight-color: transparent;
}
.tm-back:active { background: var(--bg2); }
.tm-hd-info { flex: 1; min-width: 0; }
.tm-hd-title {
  font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); letter-spacing: -.02em;
}
.tm-hd-sub { font: 500 12px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 2px; }

/* ── Hero (dark gradient comme trophées élève) ── */
.tm-hero {
  position: relative;
  background: linear-gradient(160deg,#1a0533 0%,#1e1b4b 55%,#0c1a2e 100%);
  padding: 24px 20px 22px;
  overflow: hidden;
}
.tm-hero::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 70% 60% at 15% 20%, rgba(167,139,250,.30) 0%, transparent 55%),
    radial-gradient(ellipse 50% 50% at 85% 80%, rgba(245,158,11,.18) 0%, transparent 55%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(56,189,248,.08) 0%, transparent 60%);
}
.tm-hero-inner { position: relative; z-index: 1; }

.tm-hero-row {
  display: flex; align-items: center; gap: 18px;
  margin-bottom: 16px;
}
/* Ring SVG */
.tm-hero-ring { width: 72px; height: 72px; flex-shrink: 0; position: relative; }
.tm-ring-svg { display: block; }
.tm-ring-track { fill: none; stroke: rgba(255,255,255,.12); stroke-width: 5; }
.tm-ring-fill {
  fill: none; stroke-width: 5; stroke-linecap: round;
  transform: rotate(-90deg); transform-origin: 50% 50%;
  transition: stroke-dasharray .9s cubic-bezier(.2,.7,.3,1) .3s;
}
.tm-ring-count {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.tm-ring-val { font: 800 18px/1 'Plus Jakarta Sans', sans-serif; color: #fff; }
.tm-ring-max { font: 500 10px/1 'Inter', sans-serif; color: rgba(255,255,255,.55); margin-top: 2px; }

.tm-hero-txt { flex: 1; }
.tm-hero-headline {
  font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #fff; letter-spacing: -.02em; margin-bottom: 4px;
}
.tm-hero-caption { font: 500 12px/1 'Inter', sans-serif; color: rgba(255,255,255,.55); }

/* Barre progression globale */
.tm-global-bar {
  height: 5px; background: rgba(255,255,255,.12);
  border-radius: 99px; overflow: hidden; margin-bottom: 14px;
}
.tm-global-fill {
  height: 100%;
  background: linear-gradient(90deg,#a78bfa,#f59e0b);
  border-radius: 99px;
  transition: width .9s cubic-bezier(.2,.7,.3,1) .4s;
}

/* Chips de tier dans le hero */
.tm-tier-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tm-tier-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 99px;
  font: 600 11px/1 'Inter', sans-serif;
  border: 1px solid; backdrop-filter: blur(4px);
}

/* ── Sections par tier ── */
.tm-section { padding: 0 16px; margin-top: 20px; }
.tm-tier-hd {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
}
.tm-tier-hd-ico { display: flex; align-items: center; flex-shrink: 0; }
.tm-tier-lbl {
  font: 700 12px/1 'Inter', sans-serif;
  text-transform: uppercase; letter-spacing: .08em; color: var(--mu2);
}
.tm-tier-count {
  margin-left: auto;
  font: 600 11px/1 'IBM Plex Mono', monospace; color: var(--mu2);
}

/* ── Grid cards ── */
.tm-cards { display: flex; flex-direction: column; gap: 10px; }

/* ── Card base ── */
.tm-card {
  position: relative;
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px;
  border-radius: 18px;
  border: 1.5px solid var(--bo);
  background: var(--su);
  transition: transform .12s cubic-bezier(.34,1.56,.64,1), box-shadow .15s;
  -webkit-tap-highlight-color: transparent;
  animation: tmCardIn .45s cubic-bezier(.2,.7,.3,1) both;
  overflow: hidden;
}
@keyframes tmCardIn {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.tm-card:active { transform: scale(.975); }
@media (prefers-reduced-motion: reduce) { .tm-card { animation: none; } }

/* ── Card unlocked: glow + shimmer ── */
.tm-card.tm-unlocked {
  border-color: var(--tc-border);
  background: var(--tc-bg);
  box-shadow: 0 0 0 0 transparent, 0 2px 12px -4px var(--tc-glow);
}
/* Shimmer diagonal sur card débloquée */
.tm-card.tm-unlocked::after {
  content: '';
  position: absolute;
  top: -50%; left: -60%;
  width: 50%; height: 200%;
  background: linear-gradient(105deg, transparent 40%, var(--tc-shimmer) 50%, transparent 60%);
  transform: skewX(-15deg);
  animation: tmShimmer 3.5s ease-in-out infinite;
}
@keyframes tmShimmer {
  0%,100% { left: -60%; opacity: .7; }
  50% { left: 120%; opacity: 1; }
}
@media (prefers-reduced-motion: reduce) { .tm-card.tm-unlocked::after { animation: none; } }

/* ── Card locked ── */
.tm-card.tm-locked { opacity: .72; }
.tm-card.tm-locked-mystery { opacity: .5; }

/* ── Icône ── */
.tm-card-ico {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  position: relative; overflow: hidden;
}
/* Icône débloquée : gradient du tier */
.tm-card.tm-unlocked .tm-card-ico {
  background: var(--tc-gradient);
  color: #fff;
  box-shadow: 0 4px 14px -4px var(--tc-glow);
}
/* Icône verrouillée */
.tm-card.tm-locked .tm-card-ico,
.tm-card.tm-locked-mystery .tm-card-ico {
  background: var(--bg3, var(--bg2));
  color: var(--mu5, var(--mu2));
  border: 1px solid var(--bo);
}

/* ── Body texte ── */
.tm-card-body { flex: 1; min-width: 0; }
.tm-card-name {
  font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); margin-bottom: 3px;
}
.tm-card.tm-unlocked .tm-card-name { color: var(--tc-color); }
.tm-card.tm-locked .tm-card-name,
.tm-card.tm-locked-mystery .tm-card-name { color: var(--mu2); }
.tm-card-desc {
  font: 500 12px/1.4 'Inter', sans-serif; color: var(--mu2);
}
.tm-card.tm-locked-mystery .tm-card-desc { color: transparent; text-shadow: 0 0 8px var(--mu2); }

/* ── Progress bar ── */
.tm-card-prog {
  margin-top: 9px; display: flex; align-items: center; gap: 8px;
}
.tm-card-prog-bar {
  flex: 1; height: 4px; background: var(--bo2); border-radius: 2px; overflow: hidden;
}
.tm-card-prog-fill {
  height: 100%; border-radius: 2px;
  transition: width .6s cubic-bezier(.2,.7,.3,1) .1s;
}
.tm-card-prog-txt {
  font: 600 10px/1 'IBM Plex Mono', monospace; color: var(--mu2); white-space: nowrap;
}

/* ── Badge check / lock ── */
.tm-card-badge {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; align-self: flex-start; margin-top: 1px;
}
.tm-card-badge.done {
  background: var(--tc-gradient, var(--a));
  color: #fff;
  box-shadow: 0 2px 8px -2px var(--tc-glow, transparent);
}
.tm-card-badge.locked {
  background: var(--bg2); color: var(--mu5, var(--mu2));
}

/* ── Tier label badge sur card débloquée ── */
.tm-card-tier-tag {
  display: inline-flex; align-items: center; gap: 3px;
  font: 700 10px/1 'Inter', sans-serif;
  padding: 3px 7px; border-radius: 99px;
  border: 1px solid var(--tc-border);
  color: var(--tc-color);
  background: var(--tc-bg);
  margin-bottom: 3px;
}
</style>`;

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== "enseignant") return;

  track("page_view", { page: "trophees_moniteur" });

  root.innerHTML = `${STYLE}
<div class="tm anim-slide-up">
  <div class="tm-hd">
    <button class="tm-back" id="tm-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
    <div class="tm-hd-info">
      <div class="tm-hd-title" tabindex="-1">Trophées</div>
      <div class="tm-hd-sub">Jalons pédagogiques</div>
    </div>
  </div>
  <div class="tm-hero">
    <div class="tm-hero-inner">
      <div class="tm-hero-row">
        <div class="tm-hero-ring">
          <svg class="tm-ring-svg" width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
            <circle class="tm-ring-track" cx="36" cy="36" r="28"/>
            <circle class="tm-ring-fill" cx="36" cy="36" r="28" stroke="#a78bfa" stroke-dasharray="0 176"/>
          </svg>
          <div class="tm-ring-count">
            <span class="tm-ring-val">—</span>
            <span class="tm-ring-max">/12</span>
          </div>
        </div>
        <div class="tm-hero-txt">
          <div class="tm-hero-headline">Chargement…</div>
          <div class="tm-hero-caption">trophées professionnels</div>
        </div>
      </div>
      <div class="tm-global-bar"><div class="tm-global-fill" id="tm-gfill" style="width:0%"></div></div>
      <div class="tm-tier-chips" id="tm-chips"></div>
    </div>
  </div>
</div>`;

  root.querySelector("#tm-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("/parcours");
  });

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

// ─── Render ──────────────────────────────────────────────────
function _render(root, d) {
  const results = TROPHEES.map((t) => ({
    ...t,
    unlocked: t.check(d),
    prog: t.progress(d),
  }));

  const unlockedCount = results.filter((t) => t.unlocked).length;
  const total = results.length;
  const pct = Math.round((unlockedCount / total) * 100);

  // Ring : c = 2πr = 2π×28 ≈ 175.9
  const C = 2 * Math.PI * 28;
  const filled = (pct / 100) * C;

  // Group by tier
  const byTier = {};
  for (const key of Object.keys(TIERS)) byTier[key] = [];
  results.forEach((t) => byTier[t.tier]?.push(t));

  // Chips de tier dans le hero (flat icon + label)
  const chipsHtml = Object.entries(TIERS)
    .map(([key, cfg]) => {
      const list = byTier[key] || [];
      const done = list.filter((t) => t.unlocked).length;
      const ico = icon(cfg.iconName, {
        size: 11,
        strokeWidth: 2,
        color: cfg.color,
      });
      return `<span class="tm-tier-chip" style="color:${cfg.color};border-color:${cfg.border};background:${cfg.bg}">
        ${ico} ${done}/${list.length}
      </span>`;
    })
    .join("");

  // Sections
  const sectionsHtml = Object.entries(TIERS)
    .map(([key, cfg]) => {
      const list = byTier[key] || [];
      if (list.length === 0) return "";
      const doneCount = list.filter((t) => t.unlocked).length;
      const tierIco = icon(cfg.iconName, {
        size: 14,
        strokeWidth: 2,
        color: cfg.color,
      });
      return `
      <div class="tm-section">
        <div class="tm-tier-hd">
          <span class="tm-tier-hd-ico">${tierIco}</span>
          <span class="tm-tier-lbl" style="color:${cfg.color}">${cfg.label}</span>
          <span class="tm-tier-count">${doneCount}/${list.length}</span>
        </div>
        <div class="tm-cards">
          ${list.map((t, i) => _renderCard(t, cfg, i)).join("")}
        </div>
      </div>`;
    })
    .join("");

  root.innerHTML = `${STYLE}
<div class="tm anim-slide-up">

<div class="tm-hd">
  <button class="tm-back" id="tm-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
  <div class="tm-hd-info">
    <div class="tm-hd-title" tabindex="-1">Trophées</div>
    <div class="tm-hd-sub">${unlockedCount} débloqué${unlockedCount > 1 ? "s" : ""} sur ${total}</div>
  </div>
</div>

<div class="tm-hero">
  <div class="tm-hero-inner">
    <div class="tm-hero-row">
      <div class="tm-hero-ring">
        <svg class="tm-ring-svg" width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
          <circle class="tm-ring-track" cx="36" cy="36" r="28"/>
          <circle class="tm-ring-fill" id="tm-ring" cx="36" cy="36" r="28"
            stroke="url(#tmGrad)"
            stroke-dasharray="0 ${C.toFixed(1)}"/>
          <defs>
            <linearGradient id="tmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#a78bfa"/>
              <stop offset="100%" stop-color="#f59e0b"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="tm-ring-count">
          <span class="tm-ring-val">${unlockedCount}</span>
          <span class="tm-ring-max">/${total}</span>
        </div>
      </div>
      <div class="tm-hero-txt">
        <div class="tm-hero-headline">${_headline(unlockedCount, total, d)}</div>
        <div class="tm-hero-caption">${pct}% des jalons atteints</div>
      </div>
    </div>
    <div class="tm-global-bar">
      <div class="tm-global-fill" id="tm-gfill" style="width:0%"></div>
    </div>
    <div class="tm-tier-chips">${chipsHtml}</div>
  </div>
</div>

${sectionsHtml}

</div>`;

  root.querySelector("#tm-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("/parcours");
  });

  // Animer la ring et la barre après rendu
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const ring = root.querySelector("#tm-ring");
      if (ring)
        ring.setAttribute(
          "stroke-dasharray",
          `${filled.toFixed(1)} ${C.toFixed(1)}`,
        );
      const gfill = root.querySelector("#tm-gfill");
      if (gfill) gfill.style.width = `${pct}%`;
    });
  });
}

// ─── Card render ─────────────────────────────────────────────
function _renderCard(t, cfg, i) {
  const delay = `${i * 60}ms`;
  const prog = t.prog;
  const pct = prog.max > 0 ? Math.round((prog.v / prog.max) * 100) : 0;
  const isClose = !t.unlocked && pct >= 25;
  // Far-locked : on masque les détails (effet "mystère" Clash Royale)
  const isMystery = !t.unlocked && !isClose;

  const cssVars = `--tc-color:${cfg.color};--tc-glow:${cfg.glow};--tc-bg:${cfg.bg};--tc-border:${cfg.border};--tc-gradient:${cfg.gradient};--tc-shimmer:${cfg.shimmer}`;

  const cls = t.unlocked
    ? "tm-card tm-unlocked"
    : isMystery
      ? "tm-card tm-locked-mystery"
      : "tm-card tm-locked";

  // Icône: locked mystery → cadenas, sinon icône réelle
  const icoContent = isMystery
    ? icon("lock", { size: 18, strokeWidth: 2 })
    : icon(t.iconName, { size: 20, strokeWidth: 2 });

  // Badge droit
  const badge = t.unlocked
    ? `<div class="tm-card-badge done" aria-label="Débloqué">${icon("check", { size: 13, strokeWidth: 3 })}</div>`
    : isClose
      ? `<div class="tm-card-badge locked" aria-label="Verrouillé">${icon("lock", { size: 12, strokeWidth: 2 })}</div>`
      : "";

  // Label tier sur card débloquée
  const tierTag = t.unlocked
    ? `<div class="tm-card-tier-tag">${icon(cfg.iconName, { size: 10, strokeWidth: 2 })} ${cfg.label}</div>`
    : "";

  // Nom (masqué en mystery)
  const nameHtml = isMystery
    ? `<div class="tm-card-name" style="color:var(--mu5,var(--mu2));letter-spacing:.04em">??? ${cfg.label}</div>`
    : `<div class="tm-card-name">${esc(t.name)}</div>`;

  // Barre de progression (uniquement si proche et non débloqué)
  const progBar = isClose
    ? `<div class="tm-card-prog">
        <div class="tm-card-prog-bar">
          <div class="tm-card-prog-fill" style="width:${pct}%;background:${cfg.color}"></div>
        </div>
        <span class="tm-card-prog-txt">${prog.v}/${prog.max}</span>
      </div>`
    : "";

  return `
<div class="${cls}" style="${cssVars};animation-delay:${delay}">
  <div class="tm-card-ico">${icoContent}</div>
  <div class="tm-card-body">
    ${tierTag}
    ${nameHtml}
    <div class="tm-card-desc">${isMystery ? "Continue à progresser pour révéler ce trophée." : esc(t.desc)}</div>
    ${progBar}
  </div>
  ${badge}
</div>`;
}

// ─── Headline contextuel ─────────────────────────────────────
function _headline(unlocked, total, d) {
  if (unlocked === 0) return "Lance-toi — enregistre ta première séance";
  if (unlocked === total) return "Collection complète — Expert REMC";
  if (unlocked >= total * 0.75)
    return `Presque complet — ${total - unlocked} trophée${total - unlocked > 1 ? "s" : ""} restant`;
  if (d.prenom)
    return `${esc(d.prenom)}, ${unlocked} trophée${unlocked > 1 ? "s" : ""} débloqué${unlocked > 1 ? "s" : ""}`;
  return `${unlocked} trophée${unlocked > 1 ? "s" : ""} débloqué${unlocked > 1 ? "s" : ""}`;
}
