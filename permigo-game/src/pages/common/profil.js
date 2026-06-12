// ═══════════════════════════════════════════════════════════════
// Profil — commun à tous les rôles
// ═══════════════════════════════════════════════════════════════
import { sb, logout } from "@/auth/auth.js";
import { getCurUser, setCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { mountPermisCard } from "@/components/eleve/permis-card.js";
import { mountProfileCard } from "@/components/common/profile-card.js";
import { getEquippedAsset } from "@/utils/game-state.js";
import { getPermisBg } from "@/utils/assets.js";
import { REMC_TOTAL } from "@/data/remc.js";
import { icon } from "@/utils/icons.js";
import {
  isPushEnabled,
  requestPushPermission,
  optOutPush,
  optInPush,
} from "@/services/web-push.js";
import { mountMoniteurRanking } from "@/components/enseignant/moniteur-ranking.js";

// ─── CSS (cohérent avec design system permigo-game) ─────────────
const STYLE = `<style>
.prf {
  padding: 20px 16px calc(60px + env(safe-area-inset-bottom, 0px) + 24px); /* #15 — clearance bottom nav */
  max-width: 480px;
  margin: 0 auto;
  color: var(--ink);
  font-family: 'Inter', sans-serif;
  background: var(--bg);
}
.prf-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
}
.prf-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: var(--a);
  display: flex; align-items: center; justify-content: center;
  font: 700 32px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--a-ink);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--a) 25%, transparent);
}
.prf-name {
  font: 700 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  text-align: center;
  letter-spacing: -0.022em;
}
.prf-role-badge {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--a-txt);
  background: color-mix(in srgb, var(--a) 10%, transparent);
  border-radius: 99px;
  padding: 6px 12px;
}

/* #19 — tuile d'accès galerie (élève only) */
.prf-nav-tiles { display: flex; gap: 10px; margin: 16px 0; }
.prf-nav-tile {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 12px;
  background: var(--su); border: 1px solid var(--bo); border-radius: 16px;
  color: var(--tx, var(--ink)); text-decoration: none;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  box-shadow: 0 1px 3px rgba(10,13,26,.06);
  transition: transform .12s, box-shadow .2s;
}
.prf-nav-tile:active { transform: scale(.98); }
.prf-nav-ico { font-size: 18px; line-height: 1; }

/* Info section */
.prf-section {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bo2);
}
.prf-row:last-child { border-bottom: none; }
.prf-row-ico { font-size: 18px; line-height: 1; flex-shrink: 0; }
.prf-row-body { flex: 1; min-width: 0; }
.prf-row-lbl { font: 500 11px/1 'Inter', sans-serif; color: var(--mu2); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .04em; }
.prf-row-val { font: 600 14px/1.3 'Inter', sans-serif; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Buttons */
.prf-btn-logout {
  width: 100%;
  padding: 16px;
  background: rgba(239,68,68,.08);
  border: 1.5px solid rgba(239,68,68,.25);
  border-radius: 16px;
  color: var(--rd-txt);
  font: 700 15px/1 var(--fd);
  cursor: pointer;
  transition: background .2s, transform .15s;
  margin-bottom: 10px;
  min-height: 52px;
}
.prf-btn-logout:hover { background: rgba(239,68,68,.14); }
.prf-btn-logout:active { transform: scale(.98); }

.prf-btn-delete {
  width: 100%;
  padding: 14px;
  min-height: 44px;
  background: none;
  border: 0;
  color: var(--mu2);
  font: 500 13px/1 'Inter', sans-serif;
  cursor: pointer;
  text-decoration: underline;
}

/* Mon Année — enseignant only */
.prf-annee {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-annee-ttl {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mu2);
  margin: 0 0 16px;
}
.prf-annee-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.prf-kpi {
  background: var(--bg);
  border: 1px solid var(--bo);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
}
.prf-kpi-n {
  font: 700 28px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  display: block;
  margin-bottom: 6px;
  letter-spacing: -0.025em;
}
.prf-kpi-lbl {
  font: 500 11px/1.3 'Inter', sans-serif;
  color: var(--mu2);
}
.prf-streak {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-streak-ico { font-size: 24px; line-height: 1; }
.prf-streak-body { flex: 1; }
.prf-streak-n {
  font: 700 20px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -0.022em;
}
.prf-streak-lbl {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: var(--mu2);
  margin-top: 4px;
}

/* Version */
.prf-version {
  text-align: center;
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  padding: 20px 0 0;
}

/* ── Notification toggle ── */
.prf-notif-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bo2);
  cursor: pointer;
  transition: background .15s;
  min-height: 60px;
}
.prf-notif-row:active { background: var(--bg); transform: scale(.99); }
@media(hover:hover)and(pointer:fine){.prf-notif-row:hover{background:var(--su2)}}
.prf-notif-ico { font-size: 18px; line-height: 1; flex-shrink: 0; }
.prf-notif-body { flex: 1; min-width: 0; }
.prf-notif-lbl { font: 600 14px/1.3 'Inter', sans-serif; color: var(--ink); }
.prf-notif-sub { font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 2px; }
/* iOS-style toggle pill */
.prf-toggle {
  flex-shrink: 0;
  position: relative;
  width: 44px; height: 26px;
  background: #d1d8ee;
  border-radius: 13px;
  transition: background .2s cubic-bezier(.23,1,.32,1);
  pointer-events: none; /* le click est géré par la row */
}
.prf-toggle.on { background: var(--a); }
.prf-toggle::after {
  content: '';
  position: absolute;
  top: 3px; left: 3px;
  width: 20px; height: 20px;
  background: var(--su);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
  transition: transform .2s cubic-bezier(.23,1,.32,1);
}
.prf-toggle.on::after { transform: translateX(18px); }
/* État "bloqué par le navigateur" */
.prf-notif-denied { font: 500 12px/1.3 'Inter', sans-serif; color: var(--or); margin-top: 2px; }
@media(prefers-reduced-motion:reduce){.prf-toggle,.prf-toggle::after{transition:none}}

/* ── Parrainage (élève) ── */
.prf-ref {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-ref-ttl {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mu2);
  margin: 0 0 14px;
}
.prf-ref-code-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.prf-ref-code {
  flex: 1;
  font: 700 18px/1 'IBM Plex Mono', monospace;
  color: var(--a-txt);
  letter-spacing: .1em;
}
.prf-ref-copy-btn {
  background: none;
  border: none;
  color: var(--a-txt);
  font-size: 18px;
  cursor: pointer;
  padding: 14px;
  margin: -10px;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background .12s;
}
.prf-ref-copy-btn:active { background: color-mix(in srgb, var(--a) 10%, transparent); }
.prf-ref-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.prf-ref-stat {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--bo);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}
.prf-ref-stat-n {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  display: block;
  margin-bottom: 4px;
}
.prf-ref-stat-lbl {
  font: 500 10px/1.3 'Inter', sans-serif;
  color: var(--mu2);
}
.prf-ref-share-btn {
  width: 100%;
  padding: 13px;
  background: var(--a);
  border: none;
  border-radius: 12px;
  color: var(--a-ink);
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: transform 120ms cubic-bezier(.23,1,.32,1), opacity 120ms;
  min-height: 46px;
}
.prf-ref-share-btn:active { transform: scale(.97); }
.prf-ref-gen-btn {
  width: 100%;
  padding: 13px;
  background: color-mix(in srgb, var(--a) 8%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--a) 20%, transparent);
  border-radius: 12px;
  color: var(--a-txt);
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: background .15s;
  min-height: 46px;
}
.prf-ref-gen-btn:active { background: color-mix(in srgb, var(--a) 15%, transparent); }
.prf-ref-apply {
  margin-top: 14px;
  display: flex;
  gap: 8px;
}
.prf-ref-apply-input {
  flex: 1;
  padding: 12px 14px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: 12px;
  font: 600 14px/1 'IBM Plex Mono', monospace;
  color: var(--ink);
  letter-spacing: .08em;
  text-transform: uppercase;
  outline: none;
  transition: border-color .14s;
  min-height: 44px;
}
.prf-ref-apply-input:focus { border-color: var(--a); }
.prf-ref-apply-btn {
  padding: 0 16px;
  background: var(--ink);
  border: none;
  border-radius: 12px;
  color: var(--bg);
  font: 700 13px/1 'Inter', sans-serif;
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;
  transition: background .12s;
}
.prf-ref-apply-btn:active { background: #1e2235; }
.prf-ref-apply-btn:disabled { opacity: .5; cursor: not-allowed; }

/* ── Pseudo public (élève) ── */
.prf-pseudo {
  background: var(--su); border: 1px solid var(--bo); border-radius: 20px;
  padding: 20px; margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.prf-pseudo-ttl {
  font: 600 11px/1 'Inter', sans-serif; letter-spacing: .08em; text-transform: uppercase;
  color: var(--mu2); margin: 0 0 6px;
}
.prf-pseudo-help { font: 500 12px/1.4 'Inter', sans-serif; color: var(--mu2); margin: 0 0 12px; }
.prf-pseudo-row { display: flex; gap: 8px; }
.prf-pseudo-row .prf-pseudo-input { min-width: 0; }
.prf-pseudo-input {
  flex: 1; padding: 12px 14px; background: var(--bg); border: 1.5px solid var(--bo);
  border-radius: 12px; font: 600 14px/1 'IBM Plex Mono', monospace; color: var(--ink);
  outline: none; transition: border-color .14s; min-height: 44px;
}
.prf-pseudo-input:focus { border-color: var(--a); }
.prf-pseudo-input.invalid { border-color: var(--rd); }
.prf-pseudo-save {
  padding: 0 18px; background: var(--a); border: none; border-radius: 12px; color: var(--a-ink);
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer; min-height: 44px;
  white-space: nowrap; transition: opacity .12s, transform .12s;
}
.prf-pseudo-save:active { transform: scale(.97); }
.prf-pseudo-save:disabled { opacity: .5; cursor: not-allowed; }
.prf-pseudo-err { font: 500 12px/1.3 'Inter', sans-serif; color: var(--rd-txt); margin-top: 8px; min-height: 14px; }
</style>`;

const ROLE_LABELS = {
  eleve: "Élève",
  enseignant: "Enseignant",
  gerant: "Gérant",
};

function renderAccountActions(me) {
  return `
    ${me.role === "eleve" ? `<button class="prf-btn-logout" id="btn-replay-tour" type="button" style="background:transparent;color:var(--mu);border:1px solid var(--bo);margin-bottom:10px">${icon("graduation-cap", { size: 16 })} Revoir le tour de bienvenue</button>` : ""}
    <button class="prf-btn-logout" id="btn-logout">Se déconnecter</button>
    ${me.role === "eleve" ? '<button class="prf-btn-delete" id="btn-delete">Supprimer mon compte</button>' : ""}
  `;
}

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "profil", user_role: me.role });

  // Skeleton
  root.innerHTML = `${STYLE}<div class="prf"><div class="skel skel-card" style="height:180px;margin-bottom:14px"></div><div class="skel skel-card"></div></div>`;

  // Fetch profil complet (xp, streak_pro_days, prenom, created_at, avatar, banner)
  const { data: profile } = await sb
    .from("profiles")
    .select(
      "email, prenom, nom, xp, streak_pro_days, created_at, avatar_url, banner_url, username",
    )
    .eq("id", me.id)
    .single();

  // Pour élève : compte des compétences validées (pour la carte permis)
  let permisData = null;
  let eleveStreak = 0;
  if (me.role === "eleve") {
    const [{ data: valData }, { data: streakRow }] = await Promise.all([
      sb
        .from("validations")
        .select("competence_id")
        .eq("eleve_id", me.id)
        .eq("statut", "acquis"),
      sb
        .from("streaks")
        .select("current_streak")
        .eq("user_id", me.id)
        .maybeSingle(),
    ]);
    eleveStreak = streakRow?.current_streak ?? 0;
    permisData = {
      prenom: profile?.prenom || "",
      nom: profile?.nom || "",
      created_at: profile?.created_at || null,
      validated: (valData || []).length,
      total: REMC_TOTAL,
    };
  }

  // Pour élève : parrainage
  let referralStats = null;
  if (me.role === "eleve") {
    const { data: rStats } = await sb.rpc("get_my_referral_stats");
    referralStats = rStats && !rStats.error ? rStats : null;
  }

  // Pour enseignant : stats "Mon Année"
  let anneeStats = null;
  if (me.role === "enseignant") {
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: valData }, { data: streakProfile }, { data: elevesData }] =
      await Promise.all([
        sb
          .from("validations")
          .select("competence_id, eleve_id, validated_at")
          .eq("validated_by", me.id)
          .gte("validated_at", yearStart),
        sb.from("profiles").select("streak_pro_days").eq("id", me.id).single(),
        sb
          .from("profiles")
          .select("id")
          .eq("role", "eleve")
          .eq("enseignant_id", me.id)
          .is("deleted_at", null),
      ]);

    const vals = valData || [];
    const totalValidations = vals.length;
    // Union: élèves assignés + élèves ayant au moins une validation (pour rétrocompatibilité)
    const elevesIds = new Set((elevesData || []).map((e) => e.id));
    for (const v of vals) elevesIds.add(v.eleve_id);
    const elevesCount = elevesIds.size;
    const c3Count = vals.filter((v) =>
      v.competence_id?.startsWith("C3"),
    ).length;
    // streak_pro_days est mis à jour par trigger DB mais peut avoir 1 jour de délai
    // si une validation existe aujourd'hui on garantit au moins 1
    const hasValidationToday = vals.some((v) =>
      v.validated_at?.startsWith(today),
    );
    const streakDays = Math.max(
      streakProfile?.streak_pro_days ?? 0,
      hasValidationToday ? 1 : 0,
    );

    const since30d = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .slice(0, 10);
    const elevesActifsCount = new Set(
      vals.filter((v) => v.validated_at >= since30d).map((v) => v.eleve_id),
    ).size;

    anneeStats = {
      totalValidations,
      elevesCount,
      elevesActifsCount,
      c3Count,
      streakDays,
    };
  }

  const displayName = me.nom || profile?.email || me.email || "?";
  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  // ─── Données pour la ProfileCard sociale (élève + enseignant) ──────
  let profileCardData = null;
  if (me.role === "eleve" && permisData) {
    profileCardData = {
      me: { ...me, prenom: profile?.prenom || "", nom: profile?.nom || "" },
      avatarUrl: getEquippedAsset("avatar") || profile?.avatar_url || null,
      bannerUrl: profile?.banner_url || null,
      count: permisData.validated, // pour calcul prestige (max 31)
      bio: `Apprenti permis B · ${permisData.validated}/${REMC_TOTAL} compétences`,
      stats: [
        { label: "Compétences", value: permisData.validated },
        { label: "Streak", value: eleveStreak },
        { label: "Restantes", value: REMC_TOTAL - permisData.validated },
      ],
      shareUrl: window.location.origin,
      shareText: `Je suis à ${permisData.validated}/${REMC_TOTAL} compétences validées sur PermiGo`,
    };
  } else if (me.role === "enseignant" && anneeStats) {
    profileCardData = {
      me: { ...me, prenom: profile?.prenom || "", nom: profile?.nom || "" },
      avatarUrl: profile?.avatar_url || null,
      // Pas de bannière uploadée → fond évolutif selon les validations (mesh → route → holo)
      bannerUrl:
        profile?.banner_url ||
        getPermisBg(anneeStats.totalValidations, "enseignant"),
      count: anneeStats.totalValidations, // pour calcul prestige (carrière)
      bio: `Enseignant · ${anneeStats.elevesCount} élève${anneeStats.elevesCount > 1 ? "s" : ""} suivi${anneeStats.elevesCount > 1 ? "s" : ""}`,
      stats: [
        { label: "Validations", value: anneeStats.totalValidations },
        { label: "Élèves", value: anneeStats.elevesCount },
        { label: "Streak", value: anneeStats.streakDays },
      ],
      shareUrl: window.location.origin,
      shareText: `${anneeStats.totalValidations} validations sur PermiGo cette année`,
    };
  }

  root.innerHTML = `${STYLE}
<div class="prf anim-slide-up">
  ${
    profileCardData
      ? `<div id="prf-social-card"></div>`
      : `<div class="prf-avatar-wrap">
        <div class="prf-avatar">${esc(initials)}</div>
        <div class="prf-name">${esc(displayName)}</div>
        <span class="prf-role-badge">${esc(ROLE_LABELS[me.role] || me.role)}</span>
      </div>`
  }

  ${permisData ? `<div id="prf-permis-card" style="margin-top:16px"></div>` : ""}

  ${
    me.role === "eleve"
      ? `
  <div class="prf-nav-tiles">
    <a class="prf-nav-tile" href="#/galerie" aria-label="Ouvrir ta galerie">
      <span class="prf-nav-ico" aria-hidden="true">${icon("image", { size: 18 })}</span><span>Ta galerie</span>
    </a>
  </div>`
      : ""
  }

  ${
    me.role === "enseignant"
      ? `
  <div class="prf-nav-tiles">
    <a class="prf-nav-tile" href="#/boutique" aria-label="Ouvrir la boutique">
      <span class="prf-nav-ico" aria-hidden="true">${icon("car", { size: 18 })}</span><span>Boutique</span>
    </a>
  </div>`
      : ""
  }

  ${me.role === "eleve" ? `<div id="prf-pseudo-section">${_renderPseudo(profile?.username)}</div>` : ""}

  ${referralStats !== null ? `<div id="prf-ref-section">${_renderReferral(referralStats)}</div>` : ""}

  ${anneeStats ? `<div id="prf-ranking-host"></div>` : ""}

  ${
    anneeStats
      ? `
  <div class="prf-streak">
    <span class="prf-streak-ico" style="color:var(--or);display:flex;align-items:center" aria-hidden="true">${icon("flame", { size: 28, strokeWidth: 2.2 })}</span>

    <div class="prf-streak-body">
      <div class="prf-streak-n">${anneeStats.streakDays} jour${anneeStats.streakDays !== 1 ? "s" : ""}</div>
      <div class="prf-streak-lbl">d'affilée cette semaine</div>
    </div>
  </div>

  <div class="prf-annee">
    <h2 class="prf-annee-ttl">Ma chasse en ${new Date().getFullYear()}</h2>
    <div class="prf-annee-grid">
      <div class="prf-kpi">
        <span class="prf-kpi-n">${anneeStats.totalValidations}</span>
        <div class="prf-kpi-lbl">compétences validées</div>
      </div>
      <div class="prf-kpi">
        <span class="prf-kpi-n">${anneeStats.elevesCount}</span>
        <div class="prf-kpi-lbl">élèves suivis</div>
      </div>
      <div class="prf-kpi">
        <span class="prf-kpi-n">${anneeStats.c3Count}</span>
        <div class="prf-kpi-lbl">C3 Maîtrise atteints</div>
      </div>
      <div class="prf-kpi">
        <span class="prf-kpi-n">${anneeStats.elevesActifsCount ?? 0}</span>
        <div class="prf-kpi-lbl">élèves actifs 30j</div>
      </div>
    </div>
  </div>
  `
      : ""
  }

  <div class="prf-section">
    <div class="prf-row">
      <span class="prf-row-ico">${icon("mail", { size: 18 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Email</div>
        <div class="prf-row-val">${esc(profile?.email || me.email || "—")}</div>
      </div>
    </div>
    <div class="prf-row">
      <span class="prf-row-ico">${icon("user", { size: 18 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Rôle</div>
        <div class="prf-row-val">${esc(ROLE_LABELS[me.role] || me.role)}</div>
      </div>
    </div>
    ${
      me.role !== "eleve" && profile?.xp != null
        ? `
    <div class="prf-row">
      <span class="prf-row-ico">${icon("zap", { size: 18 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">XP total</div>
        <div class="prf-row-val" style="color:var(--a-txt)">${esc(String(profile.xp))} XP</div>
      </div>
    </div>`
        : ""
    }
    <div class="prf-row">
      <span class="prf-row-ico">${icon("key", { size: 18 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">ID profil</div>
        <div class="prf-row-val" style="font-size:11px;color:var(--mu2)">${esc(me.id)}</div>
      </div>
    </div>
  </div>

  ${_renderNotifToggle()}

  ${renderAccountActions(me)}

  <div class="prf-version">PermiGo v7 · Sprint 2</div>
</div>`;

  // Mount ProfileCard sociale (élève + enseignant) — avatar/banner modifiables + partage
  if (profileCardData) {
    const socialHost = root.querySelector("#prf-social-card");
    if (socialHost) mountProfileCard(socialHost, profileCardData);
  }

  // Mount carte permis pour les élèves (avec tilt 3D au touch)
  if (permisData) {
    const cardHost = root.querySelector("#prf-permis-card");
    if (cardHost) mountPermisCard(cardHost, permisData);
  }

  // Mount ranking moniteur (enseignant uniquement)
  if (me.role === "enseignant") {
    const rankingHost = root.querySelector("#prf-ranking-host");
    if (rankingHost)
      mountMoniteurRanking(rankingHost, { myId: me.id }).catch(() => {});
  }

  // Wire pseudo public + referral (élève)
  if (me.role === "eleve") {
    _wirePseudo(root, me);
    _wireReferral(root, me);
  }

  root.querySelector("#btn-logout")?.addEventListener("click", async () => {
    track("auth.logout", { user_role: me.role });
    try {
      await logout();
    } catch (e) {
      console.error("[profil] logout failed", e);
      const { toast } = await import("@/components/common/toast.js");
      toast("Déconnexion impossible — réessaie", "error");
    }
  });

  root.querySelector("#btn-delete")?.addEventListener("click", () => {
    alert(
      "La suppression de compte est gérée par l'administrateur de ton auto-école. Contacte-le directement.",
    );
  });

  root
    .querySelector("#btn-replay-tour")
    ?.addEventListener("click", async () => {
      track("onboarding.replay_requested", { user_role: me.role });
      try {
        await sb
          .from("profiles")
          .update({ first_value_action_at: null })
          .eq("id", me.id);
        setCurUser({ ...me, first_value_action_at: null });
      } catch (e) {
        console.error("[profil] replay tour failed", e);
      }
      location.hash = "#/";
      location.reload();
    });

  _wireNotifToggle(root);
}

// ─── Pseudo public (élève) ────────────────────────────────────────

const PSEUDO_RE = /^[A-Za-z0-9_]{3,16}$/;
// Blocklist minimale (v1) — usurpations / insultes basiques. Comparaison lower-case.
const PSEUDO_BLOCKLIST = [
  "admin",
  "moderator",
  "moderateur",
  "permigo",
  "support",
  "staff",
  "putain",
  "merde",
  "connard",
  "salope",
  "pute",
];

function _isBlocked(name) {
  return PSEUDO_BLOCKLIST.includes(name.toLowerCase());
}

function _renderPseudo(username) {
  return `
<div class="prf-pseudo">
  <h2 class="prf-pseudo-ttl">Pseudo public</h2>
  <p class="prf-pseudo-help">Visible dans le classement. Laisse vide pour rester anonyme. 3 à 16 caractères, lettres/chiffres/_</p>
  <div class="prf-pseudo-row">
    <input class="prf-pseudo-input" id="prf-pseudo-input" type="text" inputmode="text"
           placeholder="ex: speedy_lea" maxlength="16" autocomplete="off" spellcheck="false"
           value="${esc(username || "")}">
    <button class="prf-pseudo-save" id="prf-pseudo-save">Enregistrer</button>
  </div>
  <div class="prf-pseudo-err" id="prf-pseudo-err"></div>
</div>`;
}

function _wirePseudo(root, me) {
  const section = root.querySelector("#prf-pseudo-section");
  if (!section) return;
  const input = section.querySelector("#prf-pseudo-input");
  const btn = section.querySelector("#prf-pseudo-save");
  const err = section.querySelector("#prf-pseudo-err");
  if (!input || !btn) return;

  const showErr = (msg) => {
    if (err) err.textContent = msg || "";
    input.classList.toggle("invalid", !!msg);
  };

  input.addEventListener("input", () => showErr(""));

  btn.addEventListener("click", async () => {
    const raw = input.value.trim();

    // Validation front AVANT update Supabase
    if (raw !== "") {
      if (!PSEUDO_RE.test(raw)) {
        showErr("3 à 16 caractères : lettres, chiffres ou _ uniquement.");
        return;
      }
      if (_isBlocked(raw)) {
        showErr("Ce pseudo n'est pas autorisé.");
        return;
      }
    }

    const value = raw === "" ? null : raw;
    btn.disabled = true;
    btn.textContent = "…";
    try {
      const { error } = await sb
        .from("profiles")
        .update({ username: value })
        .eq("id", me.id);
      const { toast } = await import("@/components/common/toast.js");
      if (error) {
        if (error.code === "23505") {
          showErr("Ce pseudo est déjà pris.");
          toast("Ce pseudo est déjà pris", "error");
        } else if (error.code === "23514") {
          showErr("Format invalide.");
        } else {
          toast("Impossible d'enregistrer le pseudo", "error");
        }
      } else {
        showErr("");
        track("pseudo.updated", { has_pseudo: value !== null });
        toast(value ? "Pseudo enregistré" : "Pseudo retiré", "success");
      }
    } catch (e) {
      console.error("[profil] pseudo", e);
      const { toast } = await import("@/components/common/toast.js");
      toast("Erreur de connexion", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Enregistrer";
    }
  });
}

// ─── Referral (élève) ─────────────────────────────────────────────

function _renderReferral(stats) {
  const code = stats?.code;
  const nRefs = stats?.n_referrals ?? 0;
  // 50 volants par filleul (même barème que le RPC apply_referral_code)
  const volantsEarned = nRefs * 50;

  return `
<div class="prf-ref">
  <h2 class="prf-ref-ttl">Parrainage · +50 volants par filleul</h2>

  ${
    code
      ? `
  <div class="prf-ref-code-wrap">
    <span class="prf-ref-code" id="prf-ref-code">${esc(code)}</span>
    <button class="prf-ref-copy-btn" id="prf-ref-copy" title="Copier le code">${icon("copy", { size: 16 })}</button>
  </div>
  <div class="prf-ref-stats">
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${nRefs}</span>
      <div class="prf-ref-stat-lbl">filleul${nRefs !== 1 ? "s" : ""}</div>
    </div>
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${volantsEarned}</span>
      <div class="prf-ref-stat-lbl">volants gagnés</div>
    </div>
  </div>
  <button class="prf-ref-share-btn" id="prf-ref-share">Partager mon code</button>
  `
      : `
  <button class="prf-ref-gen-btn" id="prf-ref-gen">Générer mon code de parrainage</button>
  `
  }

  <div class="prf-ref-apply">
    <input class="prf-ref-apply-input" id="prf-ref-input" type="text"
           placeholder="Code d'un ami…" maxlength="12" autocomplete="off">
    <button class="prf-ref-apply-btn" id="prf-ref-apply-btn">Appliquer</button>
  </div>
</div>`;
}

function _wireReferral(root, me) {
  const section = root.querySelector("#prf-ref-section");
  if (!section) return;

  // Copy code
  section
    .querySelector("#prf-ref-copy")
    ?.addEventListener("click", async () => {
      const code = section.querySelector("#prf-ref-code")?.textContent?.trim();
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        const btn = section.querySelector("#prf-ref-copy");
        if (btn) {
          btn.textContent = "✓";
          setTimeout(() => {
            btn.innerHTML = icon("copy", { size: 16 });
          }, 1500);
        }
        track("referral.code_copied", {});
      } catch {
        /* clipboard unavailable */
      }
    });

  // Share code
  section
    .querySelector("#prf-ref-share")
    ?.addEventListener("click", async () => {
      const code = section.querySelector("#prf-ref-code")?.textContent?.trim();
      if (!code) return;
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Rejoins PermiGo !",
            text: `Utilise mon code ${code} sur PermiGo et gagne 50 volants`,
            url: window.location.origin,
          });
          track("referral.shared", { code });
        } catch {
          /* cancelled */
        }
      } else {
        try {
          await navigator.clipboard.writeText(
            `Mon code PermiGo : ${code} — ${window.location.origin}`,
          );
          const { toast: _toast } =
            await import("@/components/common/toast.js");
          _toast("Lien copié", "success");
        } catch {
          /* unavailable */
        }
      }
    });

  // Generate code
  section.querySelector("#prf-ref-gen")?.addEventListener("click", async () => {
    const btn = section.querySelector("#prf-ref-gen");
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = "Génération…";
    try {
      const { data, error } = await sb.rpc("generate_referral_code");
      if (error || data?.error) {
        const { toast: _toast } = await import("@/components/common/toast.js");
        _toast(data?.error || "Impossible de générer le code", "error");
        btn.disabled = false;
        btn.textContent = "Générer mon code de parrainage";
        return;
      }
      track("referral.code_generated", {});
      const { data: rStats } = await sb.rpc("get_my_referral_stats");
      if (rStats && !rStats.error) {
        section.innerHTML = _renderReferral(rStats);
        _wireReferral(root, me);
      }
    } catch {
      btn.disabled = false;
      btn.textContent = "Générer mon code de parrainage";
    }
  });

  // Apply referral code
  const applyBtn = section.querySelector("#prf-ref-apply-btn");
  const applyInput = section.querySelector("#prf-ref-input");
  applyBtn?.addEventListener("click", async () => {
    const code = applyInput?.value?.trim().toUpperCase();
    if (!code || code.length < 4) return;
    applyBtn.disabled = true;
    applyBtn.textContent = "…";
    try {
      const { data, error } = await sb.rpc("apply_referral", { code });
      const { toast: _toast } = await import("@/components/common/toast.js");
      if (error || data?.error) {
        _toast(data?.error || "Code invalide ou déjà utilisé", "error");
      } else {
        _toast("Code appliqué ! +50 volants", "success", 4000);
        track("referral.applied", { code });
        if (applyInput) applyInput.value = "";
      }
    } catch {
      const { toast: _toast } = await import("@/components/common/toast.js");
      _toast("Erreur de connexion", "error");
    } finally {
      applyBtn.disabled = false;
      applyBtn.textContent = "Appliquer";
    }
  });
}

// ─── Notifications toggle ─────────────────────────────────────────

function _renderNotifToggle() {
  if (!("Notification" in window)) return ""; // API absente (iOS < 16.4 en dehors de PWA)

  const denied = Notification.permission === "denied";
  const enabled = isPushEnabled();

  return `
  <div class="prf-section">
    <div class="prf-notif-row" id="prf-notif-row" role="button" tabindex="0"
         aria-pressed="${enabled}" aria-label="Notifications ${enabled ? "activées" : "désactivées"}">
      <span class="prf-notif-ico">${icon("bell", { size: 18 })}</span>
      <div class="prf-notif-body">
        <div class="prf-notif-lbl">Notifications</div>
        ${
          denied
            ? `<div class="prf-notif-denied">Bloquées par le navigateur — autorise-les dans les réglages</div>`
            : `<div class="prf-notif-sub">${enabled ? "Quiz et streak actifs" : "Désactivées"}</div>`
        }
      </div>
      ${!denied ? `<div class="prf-toggle ${enabled ? "on" : ""}" aria-hidden="true"></div>` : ""}
    </div>
  </div>`;
}

function _wireNotifToggle(root) {
  const row = root.querySelector("#prf-notif-row");
  if (!row || Notification.permission === "denied") return;

  const toggle = row.querySelector(".prf-toggle");
  const sub = row.querySelector(".prf-notif-sub");

  async function flip() {
    const nowEnabled = isPushEnabled();
    row.setAttribute("aria-pressed", String(!nowEnabled));
    if (nowEnabled) {
      await optOutPush();
      toggle?.classList.remove("on");
      if (sub) sub.textContent = "Désactivées";
    } else {
      const granted = await optInPush();
      if (granted) {
        toggle?.classList.add("on");
        if (sub) sub.textContent = "Quiz et streak actifs";
      } else if (Notification.permission === "denied") {
        // L'utilisateur a refusé → met à jour le texte
        if (sub)
          sub.outerHTML = `<div class="prf-notif-denied">Bloquées par le navigateur — autorise-les dans les réglages</div>`;
        toggle?.remove();
      }
    }
  }

  row.addEventListener("click", flip);
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flip();
    }
  });
}
