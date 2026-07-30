// ═══════════════════════════════════════════════════════════════
// League system — constantes et helpers partagés
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { medallion } from "@/utils/medallions.js";
import { getLang } from "@/utils/lang.js";

// Écusson médaillon par ligue (grammaire visuelle premium, par id de ligue).
// Basse → bouclier bronze · argent → médaille · or → trophée · haute → diamant.
const LEAGUE_MED = {
  bronze: ["bouclier", "bronze"],
  argent: ["medaille", "argent"],
  or: ["trophee", "gold"],
  diamant: ["diamant", "cyan"],
};

// 4 ligues ordonnées du plus haut au plus bas
const LEAGUES = [
  {
    id: "diamant",
    name: "Diamant",
    minPts: 40,
    iconName: "gem",
    color: "#a78bfa",
    bg: "rgba(167,139,250,.12)",
    border: "rgba(167,139,250,.35)",
    gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)",
  },
  {
    id: "or",
    name: "Or",
    minPts: 20,
    iconName: "trophy",
    color: "#f59e0b",
    bg: "rgba(245,158,11,.12)",
    border: "rgba(245,158,11,.35)",
    gradient: "linear-gradient(135deg,#d97706,#fbbf24)",
  },
  {
    id: "argent",
    name: "Argent",
    minPts: 8,
    iconName: "shield",
    color: "#9ca3af",
    bg: "rgba(156,163,175,.12)",
    border: "rgba(156,163,175,.35)",
    gradient: "linear-gradient(135deg,#6b7280,#d1d5db)",
  },
  {
    id: "bronze",
    name: "Bronze",
    minPts: 1,
    iconName: "award",
    color: "#cd7f32",
    bg: "rgba(205,127,50,.12)",
    border: "rgba(205,127,50,.35)",
    gradient: "linear-gradient(135deg,#92400e,#d97706)",
  },
];

/** Retourne la ligue correspondant aux points, ou null si 0 pts. */
function getLeague(pts) {
  if (!pts || pts <= 0) return null;
  return LEAGUES.find((l) => pts >= l.minPts) ?? null;
}

/**
 * Rendu du badge de ligue (hero).
 * size: 'sm' | 'md' | 'lg'
 */
export function renderLeagueBadge(league, pts, size = "md") {
  const icoSize = size === "lg" ? 48 : size === "sm" ? 30 : 40;
  if (!league) {
    return `<div class="lg-badge lg-badge-${size} lg-badge-none">
      <div class="lg-badge-ico">${medallion("drapeau", "slate", { size: icoSize })}</div>
      <div>
        <div class="lg-badge-name">Hors-ligue</div>
        <div class="lg-badge-pts">0 pt cette semaine</div>
      </div>
    </div>`;
  }
  const [glyph, ramp] = LEAGUE_MED[league.id] || ["trophee", "gold"];
  return `<div class="lg-badge lg-badge-${size}" style="--lc:${league.color};--lb:${league.bg};--lbr:${league.border}">
    <div class="lg-badge-ico">${medallion(glyph, ramp, { size: icoSize })}</div>
    <div>
      <div class="lg-badge-name">Ligue ${esc(league.name)}</div>
      <div class="lg-badge-pts">${pts} pt${pts > 1 ? "s" : ""} cette semaine</div>
    </div>
  </div>`;
}

/** Rendu d'une ligne de classement. */
export function renderLeagueRow(entry, showPts = true) {
  const league = getLeague(entry.weekly_pts);
  const rankStr = `#${entry.rank_pos}`;
  const isMe = entry.is_me;

  const avatar = renderUserAvatar(
    { avatar_url: entry.avatar_url, prenom: entry.display_name },
    36,
  );

  return `
  <div class="lg-row${isMe ? " lg-row-me" : ""}" ${isMe ? 'aria-label="Ma position"' : ""}>
    <span class="lg-row-rank${entry.rank_pos <= 3 ? " lg-row-rank-medal" : ""}">${esc(rankStr)}</span>
    <div class="lg-row-av">${avatar}</div>
    <div class="lg-row-name">${esc(entry.display_name)}${isMe ? ' <span class="lg-row-you">toi</span>' : ""}</div>
    ${league ? `<span class="lg-row-league-dot" style="background:${league.color}" title="Ligue ${league.name}"></span>` : ""}
    ${showPts ? `<span class="lg-row-pts">${entry.weekly_pts} pt${entry.weekly_pts > 1 ? "s" : ""}</span>` : ""}
  </div>`;
}

// ─── Countdown : temps restant jusqu'au prochain lundi 00:00 ────
export function msToNextMonday() {
  const now = new Date();
  const dow = now.getDay(); // 0=dim, 1=lun … 6=sam
  const days = dow === 0 ? 1 : 8 - dow;
  const next = new Date(now);
  next.setDate(now.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next - now;
}

// Unités localisées (EN/AR) — chiffres toujours en latin (jamais indo-arabe),
// seule l'unité change. Repli FR si langue absente/non gérée.
export function fmtCountdown(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const l = getLang();
  if (l === "en") {
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  }
  if (l === "ar") {
    if (d > 0) return `${d} ي ${h} س`;
    if (h > 0) return `${h} س ${m} د`;
    return `${m} د`;
  }
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

/** CSS partagé des ligues — à injecter une seule fois par page. */
export const LEAGUE_CSS = `
/* ─── League badge ─── */
.lg-badge {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  background: var(--lb, var(--bg2)); border: 1.5px solid var(--lbr, var(--bo));
  border-radius: 18px;
  box-shadow: 0 2px 12px -4px rgba(10,13,26,.08);
}
.lg-badge-none { --lc:var(--mu2); --lb:var(--bg2); --lbr:var(--bo); }
.lg-badge-ico { flex-shrink: 0; }
.lg-badge-name {
  font: 800 16px/1.2 'Archivo', sans-serif;
  color: var(--lc, var(--ink));
}
.lg-badge-pts {
  font: 500 12px/1 'Archivo', sans-serif;
  color: var(--mu2);
  margin-top: 3px;
}
.lg-badge-sm .lg-badge-name { font-size: 13px; }
.lg-badge-sm .lg-badge-pts { font-size: 11px; }
.lg-badge-lg .lg-badge-name { font-size: 20px; }

/* ─── League row ─── */
.lg-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--su); border: 1px solid var(--bo); border-radius: 14px;
  transition: border-color .12s;
}
.lg-row-me {
  border: 2px solid var(--a);
  background: color-mix(in srgb, var(--a) 4%, transparent);
}
.lg-row-rank {
  flex-shrink: 0; min-width: 28px; text-align: center;
  font: 700 13px/1 'IBM Plex Mono', monospace; color: var(--mu2);
}
.lg-row-rank-medal { font-size: 18px; }
.lg-row-av { flex-shrink: 0; }
.lg-row-name {
  flex: 1; min-width: 0;
  font: 600 14px/1.2 'Archivo', sans-serif; color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 6px;
}
.lg-row-you {
  font: 700 10px/1 'Archivo', sans-serif; color: var(--a-txt);
  background: color-mix(in srgb, var(--a) 10%, transparent); padding: 2px 6px; border-radius: 4px;
  text-transform: uppercase; letter-spacing: .04em;
}
.lg-row-league-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.lg-row-pts {
  font: 700 13px/1 'IBM Plex Mono', monospace; color: var(--ink);
  flex-shrink: 0;
}

/* ─── Points legend ─── */
.lg-legend {
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px;
}
.lg-legend-item {
  display: inline-flex; align-items: center; gap: 5px;
  font: 500 11px/1 'Archivo', sans-serif; color: var(--mu2);
  padding: 4px 9px; border-radius: 8px;
  background: var(--bg2); border: 1px solid var(--bo);
}

/* ─── Countdown ─── */
.lg-countdown {
  display: inline-flex; align-items: center; gap: 6px;
  font: 600 12px/1 'Archivo', sans-serif; color: var(--mu2);
}
.lg-countdown-val { color: var(--ink); font-family: 'IBM Plex Mono', monospace; }
`;
