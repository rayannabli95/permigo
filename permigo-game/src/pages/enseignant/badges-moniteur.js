// ═══════════════════════════════════════════════════════════════
// Enseignant — Mes badges
// Section 1 : 12 trophées pédagogiques (validations_count)
// Section 2 : 4 badges de réussite (validations_count)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { icon } from "@/utils/icons.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";

// ─── Données ─────────────────────────────────────────────────

const TROPHEES = [
  // Commun
  {
    id: "apprenti",
    emoji: "🌱",
    name: "Apprenti",
    desc: "1ère validation enregistrée.",
    threshold: 1,
    rarity: "commun",
  },
  {
    id: "instructeur",
    emoji: "📋",
    name: "Instructeur",
    desc: "5 compétences accompagnées.",
    threshold: 5,
    rarity: "commun",
  },
  {
    id: "formateur",
    emoji: "🎯",
    name: "Formateur",
    desc: "10 acquisitions — un début solide.",
    threshold: 10,
    rarity: "commun",
  },
  // Rare
  {
    id: "pedagogue",
    emoji: "📚",
    name: "Pédagogue",
    desc: "25 validations — la régularité paie.",
    threshold: 25,
    rarity: "rare",
  },
  {
    id: "maitre_ecol",
    emoji: "🏫",
    name: "Maître d'école",
    desc: "50 compétences accompagnées.",
    threshold: 50,
    rarity: "rare",
  },
  {
    id: "specialiste",
    emoji: "⚡",
    name: "Spécialiste",
    desc: "75 validations — expertise confirmée.",
    threshold: 75,
    rarity: "rare",
  },
  // Épique
  {
    id: "referent",
    emoji: "🔥",
    name: "Référent REMC",
    desc: "100 acquisitions — tu formes des conducteurs sûrs.",
    threshold: 100,
    rarity: "epique",
  },
  {
    id: "expert_fm",
    emoji: "💡",
    name: "Expert Formateur",
    desc: "150 validations — niveau hors-norme.",
    threshold: 150,
    rarity: "epique",
  },
  {
    id: "coach_elite",
    emoji: "🏆",
    name: "Coach Élite",
    desc: "200 validations — impact mesurable.",
    threshold: 200,
    rarity: "epique",
  },
  // Légendaire
  {
    id: "veteran",
    emoji: "💎",
    name: "Vétéran",
    desc: "300 validations — pilier de l'auto-école.",
    threshold: 300,
    rarity: "legendaire",
  },
  {
    id: "virtuose",
    emoji: "⭐",
    name: "Virtuose",
    desc: "500 validations — l'exception devient la règle.",
    threshold: 500,
    rarity: "legendaire",
  },
  {
    id: "maitre_remc",
    emoji: "👑",
    name: "Maître REMC",
    desc: "1000 validations — statut ultime débloqué.",
    threshold: 1000,
    rarity: "legendaire",
  },
];

const BADGES = [
  {
    id: "validateur",
    emoji: "✓",
    name: "Validateur",
    desc: "10 validations",
    threshold: 10,
    color: "#3b82f6",
    bg: "rgba(59,130,246,.12)",
    glow: "rgba(59,130,246,.4)",
  },
  {
    id: "mentor",
    emoji: "👥",
    name: "Mentor",
    desc: "50 validations",
    threshold: 50,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,.12)",
    glow: "rgba(139,92,246,.4)",
  },
  {
    id: "expert",
    emoji: "⭐",
    name: "Expert",
    desc: "100 validations",
    threshold: 100,
    color: "#f59e0b",
    bg: "rgba(245,158,11,.12)",
    glow: "rgba(245,158,11,.4)",
  },
  {
    id: "maitre",
    emoji: "👑",
    name: "Maître",
    desc: "200 validations",
    threshold: 200,
    color: "#ec4899",
    bg: "rgba(236,72,153,.12)",
    glow: "rgba(236,72,153,.4)",
  },
];

const RARITY = {
  commun: {
    gradient: "linear-gradient(145deg,#475569,#94a3b8)",
    glow: "rgba(148,163,184,.35)",
    color: "#94a3b8",
  },
  rare: {
    gradient: "linear-gradient(145deg,#1e40af,#60a5fa)",
    glow: "rgba(59,130,246,.45)",
    color: "#60a5fa",
  },
  epique: {
    gradient: "linear-gradient(145deg,#5b21b6,#a78bfa)",
    glow: "rgba(139,92,246,.5)",
    color: "#a78bfa",
  },
  legendaire: {
    gradient: "linear-gradient(145deg,#92400e,#fbbf24)",
    glow: "rgba(251,191,36,.6)",
    color: "#fbbf24",
  },
};

// ─── CSS ─────────────────────────────────────────────────────
const STYLE = `<style>
.bm {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: 110px;
  background: var(--bg);
  min-height: 100dvh;
  font-family: 'Inter', sans-serif;
}

/* ── Header ── */
.bm-hd {
  padding: 18px 16px 16px;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
  display: flex; align-items: center; gap: 12px;
}
.bm-back {
  width: 44px; height: 44px; border-radius: 10px;
  border: 1px solid rgba(99,102,241,.15); background: var(--su);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--ink); flex-shrink: 0;
  transition: background .15s, border-color .15s;
  -webkit-tap-highlight-color: transparent;
}
.bm-back:hover { background: rgba(99,102,241,.06); border-color: rgba(99,102,241,.3); }
.bm-back:active { background: var(--bg2); }
.bm-back:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
.bm-hd-title {
  font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); letter-spacing: -.025em;
}
.bm-hd-sub { font: 500 12px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }

/* ── Hero ── */
.bm-hero {
  position: relative;
  background: linear-gradient(160deg,#1a0533 0%,#1e1b4b 55%,#0c1a2e 100%);
  padding: 20px 20px 18px;
  overflow: hidden;
}
.bm-hero::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 65% 55% at 15% 20%, rgba(167,139,250,.28) 0%, transparent 55%),
    radial-gradient(ellipse 45% 45% at 85% 80%, rgba(251,191,36,.16) 0%, transparent 55%);
}
.bm-hero-inner { position: relative; z-index: 1; }
.bm-hero-row { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.bm-hero-count-wrap {
  width: 64px; height: 64px; border-radius: 16px; flex-shrink: 0;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.bm-hero-count-val { font: 800 22px/1 'Plus Jakarta Sans', sans-serif; color: #fff; }
.bm-hero-count-tot { font: 500 11px/1 'Inter', sans-serif; color: rgba(255,255,255,.55); margin-top: 2px; }
.bm-hero-txt { flex: 1; }
.bm-hero-headline { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: #fff; letter-spacing: -.02em; margin-bottom: 3px; }
.bm-hero-caption { font: 500 12px/1 'Inter', sans-serif; color: rgba(255,255,255,.55); }
.bm-hero-bar { height: 5px; background: rgba(255,255,255,.12); border-radius: 99px; overflow: hidden; }
.bm-hero-fill {
  height: 100%;
  background: linear-gradient(90deg,#6366f1,#a78bfa,#fbbf24);
  border-radius: 99px;
  transition: width .9s cubic-bezier(.2,.7,.3,1) .3s;
}

/* ── Section label ── */
.bm-section-label {
  padding: 22px 16px 10px;
  font: 700 11px/1 'Inter', sans-serif;
  letter-spacing: .08em; text-transform: uppercase; color: var(--mu2);
}

/* ── Grille 3 colonnes (trophées) ── */
.bm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px; padding: 0 12px;
}

/* ── Grille 2 colonnes (badges de réussite) ── */
.bm-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px; padding: 0 12px;
}

/* ── Card trophée ── */
.bm-card {
  position: relative;
  border-radius: 16px;
  padding: 14px 8px 10px;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  cursor: default; overflow: hidden;
  animation: bmCardIn .4s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes bmCardIn {
  from { opacity: 0; transform: translateY(10px) scale(.93); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) { .bm-card { animation: none; } }

.bm-card.locked { background: var(--su); border: 1px solid var(--bo); opacity: .65; }
.bm-card.commun    { background: linear-gradient(145deg,#475569,#64748b); box-shadow: 0 4px 14px -4px rgba(100,116,139,.5); }
.bm-card.rare      { background: linear-gradient(145deg,#1e40af,#3b82f6); box-shadow: 0 4px 16px -4px rgba(59,130,246,.55); }
.bm-card.epique    { background: linear-gradient(145deg,#5b21b6,#8b5cf6); box-shadow: 0 4px 16px -4px rgba(139,92,246,.55); }
.bm-card.legendaire {
  background: linear-gradient(145deg,#92400e,#d97706);
  animation: bmCardIn .4s cubic-bezier(.34,1.56,.64,1) both, bmGold 2.8s ease-in-out .4s infinite alternate;
}
@keyframes bmGold {
  from { box-shadow: 0 4px 20px -4px rgba(245,158,11,.6); }
  to   { box-shadow: 0 4px 28px -2px rgba(251,191,36,.9), 0 0 0 1px rgba(251,191,36,.35); }
}

.bm-card-rarity {
  position: absolute; top: 8px; right: 8px;
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(255,255,255,.55);
}
.bm-card.legendaire .bm-card-rarity { background: #fff; box-shadow: 0 0 6px rgba(255,255,255,.8); }
.bm-card.locked .bm-card-rarity { display: none; }

.bm-card-emoji { font-size: 26px; line-height: 1; }
.bm-card.locked .bm-card-emoji { filter: grayscale(1) brightness(.35); opacity: .5; }

.bm-card-name {
  font: 700 9px/1.2 'Plus Jakarta Sans', sans-serif;
  text-align: center; letter-spacing: -.005em;
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.bm-card.locked .bm-card-name { color: var(--mu2); }
.bm-card:not(.locked) .bm-card-name { color: rgba(255,255,255,.92); }

/* Progress bar sur card */
.bm-card-prog {
  width: 100%; margin-top: 2px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.bm-card-prog-bar {
  width: 100%; height: 3px;
  border-radius: 2px; overflow: hidden;
}
.bm-card.locked .bm-card-prog-bar { background: rgba(255,255,255,.1); }
.bm-card:not(.locked) .bm-card-prog-bar { background: rgba(255,255,255,.2); }
.bm-card-prog-fill {
  height: 100%; border-radius: 2px;
  transition: width .7s cubic-bezier(.2,.7,.3,1) .2s;
}
.bm-card.locked .bm-card-prog-fill { background: rgba(255,255,255,.4); }
.bm-card:not(.locked) .bm-card-prog-fill { background: rgba(255,255,255,.9); }
.bm-card-prog-txt {
  font: 600 8px/1 'IBM Plex Mono', monospace;
  color: rgba(255,255,255,.55);
}
.bm-card.locked .bm-card-prog-txt { color: var(--mu); }

/* ── Card badge de réussite ── */
.bm-badge-card {
  position: relative;
  border-radius: 16px; padding: 16px 12px 14px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: var(--su); border: 1px solid var(--bo);
  animation: bmCardIn .4s cubic-bezier(.34,1.56,.64,1) both;
  overflow: hidden;
}
.bm-badge-card.unlocked { background: var(--bm-bg); border-color: var(--bm-color); box-shadow: 0 4px 16px -4px var(--bm-glow); }
.bm-badge-ico {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  background: var(--bm-bg, var(--bg2));
  border: 2px solid var(--bm-color, var(--bo));
  transition: box-shadow .2s;
}
.bm-badge-card.unlocked .bm-badge-ico { box-shadow: 0 2px 10px -2px var(--bm-glow, transparent); }
.bm-badge-card.locked .bm-badge-ico { opacity: .35; filter: grayscale(1); }
.bm-badge-name { font: 700 13px/1.1 'Plus Jakarta Sans', sans-serif; color: var(--ink); text-align: center; }
.bm-badge-card.unlocked .bm-badge-name { color: var(--bm-color); }
.bm-badge-desc { font: 500 11px/1 'Inter', sans-serif; color: var(--mu2); text-align: center; }
.bm-badge-status {
  font: 700 11px/1 'IBM Plex Mono', monospace;
  padding: 4px 10px; border-radius: 99px;
}
.bm-badge-card.unlocked .bm-badge-status {
  background: var(--bm-bg); color: var(--bm-color); border: 1px solid var(--bm-color);
}
.bm-badge-card.locked .bm-badge-status {
  background: var(--bg2); color: var(--mu); border: 1px solid var(--bo);
}

/* ── Progress bar badge réussite ── */
.bm-badge-prog { width: 100%; }
.bm-badge-prog-bar {
  width: 100%; height: 4px; background: var(--bo2); border-radius: 2px; overflow: hidden; margin-bottom: 4px;
}
.bm-badge-prog-fill {
  height: 100%; border-radius: 2px;
  transition: width .7s cubic-bezier(.2,.7,.3,1) .3s;
}
.bm-badge-prog-txt {
  font: 600 10px/1 'IBM Plex Mono', monospace; color: var(--mu2); text-align: right; display: block;
}

/* ── Check badge débloqué ── */
.bm-badge-check {
  position: absolute; top: 10px; right: 10px;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
</style>`;

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== "enseignant") {
    root.innerHTML =
      '<p style="padding:32px;text-align:center">Accès enseignant requis</p>';
    return;
  }

  track("page_view", { page: "badges_moniteur" });

  root.innerHTML = `${STYLE}
<div class="bm anim-slide-up">
  <div class="bm-hd">
    <button class="bm-back" id="bm-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
    <div>
      <div class="bm-hd-title" tabindex="-1">Mes badges</div>
      <div class="bm-hd-sub">Chargement…</div>
    </div>
  </div>
  <div class="bm-hero">
    <div class="bm-hero-inner">
      <div class="bm-hero-row">
        <div class="bm-hero-count-wrap">
          <span class="bm-hero-count-val">—</span>
          <span class="bm-hero-count-tot">/${TROPHEES.length + BADGES.length}</span>
        </div>
        <div class="bm-hero-txt">
          <div class="bm-hero-headline">Chargement…</div>
          <div class="bm-hero-caption">badges débloqués</div>
        </div>
      </div>
      <div class="bm-hero-bar"><div class="bm-hero-fill" id="bm-fill" style="width:0%"></div></div>
    </div>
  </div>
  <div id="bm-body" style="padding-top:4px"></div>
</div>`;

  root.querySelector("#bm-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/parcours");
  });

  try {
    const { count, error } = await sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", me.id);

    if (error) throw error;

    _render(root, count ?? 0);
  } catch (e) {
    console.error("[badges-moniteur]", e);
    toast("Erreur de chargement", "error");
    root.querySelector("#bm-body").innerHTML =
      `<div style="padding:48px 24px;text-align:center;color:var(--mu)">
        <div style="font:700 15px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:6px">Impossible de charger tes badges</div>
        <div style="font:500 13px/1.5 'Inter',sans-serif">Vérifie ta connexion et réessaie</div>
      </div>`;
  }
}

// ─── Render ──────────────────────────────────────────────────
function _render(root, count) {
  const tropheeUnlocked = TROPHEES.filter((t) => count >= t.threshold).length;
  const badgeUnlocked = BADGES.filter((b) => count >= b.threshold).length;
  const totalUnlocked = tropheeUnlocked + badgeUnlocked;
  const totalItems = TROPHEES.length + BADGES.length;
  const pct = Math.round((totalUnlocked / totalItems) * 100);

  // Hero
  root.querySelector(".bm-hero-count-val").textContent = totalUnlocked;
  root.querySelector(".bm-hero-headline").textContent =
    totalUnlocked === 0
      ? "Lance-toi — enregistre ta première séance"
      : totalUnlocked === totalItems
        ? "Collection complète — Maître REMC !"
        : `${totalUnlocked} badge${totalUnlocked > 1 ? "s" : ""} débloqué${totalUnlocked > 1 ? "s" : ""}`;
  root.querySelector(".bm-hd-sub").textContent =
    `${count} validation${count > 1 ? "s" : ""} au total`;

  requestAnimationFrame(() => {
    const fill = root.querySelector("#bm-fill");
    if (fill) fill.style.width = `${pct}%`;
  });

  // Trophées grid
  let html = "";

  html += `<div class="bm-section-label">Trophées pédagogiques</div>
<div class="bm-grid">`;

  TROPHEES.forEach((t, i) => {
    const unlocked = count >= t.threshold;
    const r = RARITY[t.rarity] || RARITY.commun;
    const progPct = Math.min(100, Math.round((count / t.threshold) * 100));
    const remaining = Math.max(0, t.threshold - count);
    const cls = unlocked ? t.rarity : "locked";
    const progTxt = unlocked ? "✓" : `${count}/${t.threshold}`;
    html += `
<div class="bm-card ${cls}" style="animation-delay:${i * 40}ms" title="${esc(t.name)} — ${esc(t.desc)}">
  ${unlocked ? '<div class="bm-card-rarity"></div>' : ""}
  <div class="bm-card-emoji">${t.emoji}</div>
  <div class="bm-card-name">${unlocked ? esc(t.name) : esc(t.name)}</div>
  <div class="bm-card-prog">
    <div class="bm-card-prog-bar">
      <div class="bm-card-prog-fill" style="width:${progPct}%"></div>
    </div>
    <div class="bm-card-prog-txt">${progTxt}</div>
  </div>
</div>`;
  });

  html += `</div>`;

  // Badges de réussite grid
  html += `<div class="bm-section-label">Badges de réussite</div>
<div class="bm-grid-2">`;

  BADGES.forEach((b, i) => {
    const unlocked = count >= b.threshold;
    const progPct = Math.min(100, Math.round((count / b.threshold) * 100));
    const remaining = Math.max(0, b.threshold - count);
    const statusTxt = unlocked
      ? "Débloqué"
      : `${remaining} restante${remaining > 1 ? "s" : ""}`;
    const cssVars = `--bm-color:${b.color};--bm-bg:${b.bg};--bm-glow:${b.glow}`;
    html += `
<div class="bm-badge-card ${unlocked ? "unlocked" : "locked"}" style="${cssVars};animation-delay:${(TROPHEES.length + i) * 40}ms">
  ${unlocked ? `<div class="bm-badge-check" style="background:${b.color}">${icon("check", { size: 11, strokeWidth: 3 })}</div>` : ""}
  <div class="bm-badge-ico">${b.emoji}</div>
  <div class="bm-badge-name">${esc(b.name)}</div>
  <div class="bm-badge-desc">${esc(b.desc)}</div>
  <div class="bm-badge-prog">
    <div class="bm-badge-prog-bar">
      <div class="bm-badge-prog-fill" style="width:${progPct}%;background:${b.color}"></div>
    </div>
    <span class="bm-badge-prog-txt">${count}/${b.threshold}</span>
  </div>
  <div class="bm-badge-status">${esc(statusTxt)}</div>
</div>`;
  });

  html += `</div>`;

  root.querySelector("#bm-body").innerHTML = html;
}
