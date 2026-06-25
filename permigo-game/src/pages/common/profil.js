// ═══════════════════════════════════════════════════════════════
// Profil — commun à tous les rôles (élève, enseignant, gérant)
//
// Architecture "app de l'année" (Strava / Cash App style) :
//  1. Héro d'identité unique (ProfileCard) — bannière var(--a)/var(--adk)
//     rôle-adaptative (violet élève, indigo moniteur, auto). Porte les 3 stats
//     clés (compétences/streak/restantes) — source unique, pas de doublon.
//  2. Sections labellisées : Ma vitrine · Inviter des amis · Réglages
//  4. Carte permis dans Ma vitrine (sans redondance de chiffres)
//  5. Parrainage avec volant doré
//  6. Suppression de l'UUID brut côté UI
//  7. Bottom-sheet RGPD maison (remplace l'alert() auto-école incorrect)
// ═══════════════════════════════════════════════════════════════
import { sb, logout } from "@/auth/auth.js";
import { getCurUser, setCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { mountPermisCard } from "@/components/eleve/permis-card.js";
import { mountProfileCard } from "@/components/common/profile-card.js";
import { getEquippedAsset } from "@/utils/game-state.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";
import { icon } from "@/utils/icons.js";
import { volantImg, volantLabel } from "@/utils/volant.js";
import { haptic } from "@/utils/haptic.js";
import {
  isPushEnabled,
  requestPushPermission,
  optOutPush,
  optInPush,
} from "@/services/web-push.js";
import { mountMoniteurRanking } from "@/components/enseignant/moniteur-ranking.js";

// ─── Labels rôle ─────────────────────────────────────────────
const ROLE_LABELS = {
  eleve: "Élève",
  enseignant: "Enseignant",
  gerant: "Gérant",
  owner: "Plateforme",
};

// ─── CSS scoped .prf ─────────────────────────────────────────
const STYLE = `<style>
/* ── Conteneur principal ── */
.prf {
  padding-top: calc(var(--th) + env(safe-area-inset-top, 0px) + 8px);
  padding-bottom: calc(var(--bh, 64px) + env(safe-area-inset-bottom, 0px) + 24px);
  max-width: 480px;
  margin: 0 auto;
  color: var(--ink);
  font-family: 'Inter', sans-serif;
  background: var(--bg);
}

/* ── Héro : pas de padding latéral (la ProfileCard sort plein-bord) ── */
.prf-hero { padding: 0 0 4px; }

/* ── Titre de section : vrai titre humain (sentence-case, pas de MAJUSCULE crispée) ── */
.prf-sec-ttl {
  font: 800 17px/1.2 'Fredoka', 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.01em;
  color: var(--ink);
  padding: 26px 20px 10px;
  margin: 0;
}

/* ── Section carte (liste de rows) ── */
.prf-section {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-xl, 20px);
  margin: 0 16px 12px;
  overflow: hidden;
  box-shadow: var(--s0);
}
.prf-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bo2);
  min-height: 54px;
}
.prf-row:last-child { border-bottom: none; }
.prf-row-ico {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border-radius: var(--r, 12px);
  border: 1px solid var(--bo);
}
.prf-row-body { flex: 1; min-width: 0; }
.prf-row-lbl {
  font: 600 12px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--mu2);
  margin-bottom: 4px;
}
.prf-row-val {
  font: 600 14px/1.3 'Inter', sans-serif;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Lien-ligne (galerie / boutique) — discret, intentionnel ── */
.prf-linkrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 16px 0;
  padding: 14px 18px;
  min-height: 52px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-lg, 16px);
  color: var(--ink);
  text-decoration: none;
  box-shadow: var(--s0);
  transition: transform .12s var(--ease-snap), background .15s;
}
.prf-linkrow:active { transform: scale(.99); background: var(--su2); }
@media(hover:hover){ .prf-linkrow:hover { background: var(--su2); } }
.prf-linkrow-ico {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex-shrink: 0;
  border-radius: 10px;
  background: color-mix(in srgb, var(--a) 10%, transparent);
  color: var(--a-txt);
}
.prf-linkrow-lbl { flex: 1; font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif; }
.prf-linkrow-chev { font-size: 22px; color: var(--mu2); line-height: 1; }

/* ── Stats enseignant (grille Mon Année) ── */
.prf-annee {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-xl, 20px);
  padding: 20px;
  margin: 0 16px 12px;
  box-shadow: var(--s0);
}
.prf-annee-ttl {
  font: 800 15px/1.2 'Fredoka', 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.01em;
  color: var(--ink);
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
  border-radius: var(--r, 12px);
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

/* ── Pseudo public (élève) ── */
.prf-pseudo {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-xl, 20px);
  padding: 20px;
  margin: 0 16px 12px;
  box-shadow: var(--s0);
}
.prf-pseudo-ttl {
  font: 800 15px/1.2 'Fredoka', 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.01em;
  color: var(--ink);
  margin: 0 0 6px;
}
.prf-pseudo-help {
  font: 500 12px/1.4 'Inter', sans-serif;
  color: var(--mu2);
  margin: 0 0 12px;
}
.prf-pseudo-row { display: flex; gap: 8px; }
.prf-pseudo-input {
  flex: 1;
  padding: 12px 14px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: var(--r, 12px);
  font: 600 14px/1 'IBM Plex Mono', monospace;
  color: var(--ink);
  outline: none;
  transition: border-color .14s;
  min-height: 44px;
}
.prf-pseudo-input:focus { border-color: var(--a); }
.prf-pseudo-input.invalid { border-color: var(--rd); }
.prf-pseudo-save {
  padding: 0 18px;
  background: var(--a);
  border: none;
  border-radius: var(--r, 12px);
  color: var(--a-ink);
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;
  transition: opacity .12s, transform .12s;
}
.prf-pseudo-save:active { transform: scale(.97); }
.prf-pseudo-save:disabled { opacity: .5; cursor: not-allowed; }
.prf-pseudo-err {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: var(--rd-txt);
  margin-top: 8px;
  min-height: 14px;
}

/* ── Parrainage (élève) ── */
.prf-ref {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-xl, 20px);
  padding: 20px;
  margin: 0 16px 12px;
  box-shadow: var(--s0);
}
.prf-ref-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.prf-ref-ttl {
  font: 800 15px/1.2 'Fredoka', 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.01em;
  color: var(--ink);
  margin: 0;
  flex: 1;
}
.prf-ref-volant-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--am-txt, #935e06);
  background: var(--amp, rgba(245,158,11,.09));
  border: 1px solid var(--aml2, #fbbf24);
  border-radius: 99px;
  padding: 4px 10px;
}
.prf-ref-code-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-radius: var(--r, 12px);
  padding: 12px 14px;
  margin-bottom: 12px;
}
.prf-ref-code {
  flex: 1;
  font: 700 18px/1 'IBM Plex Mono', monospace;
  color: var(--a-txt);
  letter-spacing: .1em;
}
/* Bouton copier — 44×44 net, sans margin négatif */
.prf-ref-copy-btn {
  background: color-mix(in srgb, var(--a) 8%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--a) 20%, transparent);
  color: var(--a-txt);
  font-size: 18px;
  cursor: pointer;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r, 12px);
  flex-shrink: 0;
  transition: background .12s;
}
.prf-ref-copy-btn:active { background: color-mix(in srgb, var(--a) 16%, transparent); transform: scale(.95); }
.prf-ref-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.prf-ref-stat {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--bo);
  border-radius: var(--r, 12px);
  padding: 12px;
  text-align: center;
}
.prf-ref-stat-n {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
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
  border-radius: var(--r, 12px);
  color: var(--a-ink);
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: transform 120ms var(--ease-snap), opacity 120ms;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.prf-ref-share-btn:active { transform: scale(.97); }
.prf-ref-gen-btn {
  width: 100%;
  padding: 13px;
  background: color-mix(in srgb, var(--a) 8%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--a) 20%, transparent);
  border-radius: var(--r, 12px);
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
  border-radius: var(--r, 12px);
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
  border-radius: var(--r, 12px);
  color: var(--bg);
  font: 700 13px/1 'Inter', sans-serif;
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;
  transition: background .12s;
}
.prf-ref-apply-btn:active { background: var(--ink2); }
.prf-ref-apply-btn:disabled { opacity: .5; cursor: not-allowed; }

/* ── Boutons d'action (déco + déco secondaire) ── */
.prf-btn-logout {
  width: 100%;
  padding: 16px;
  background: rgba(239,68,68,.08);
  border: 1.5px solid rgba(239,68,68,.25);
  border-radius: var(--r-lg, 16px);
  color: var(--rd-txt);
  font: 700 15px/1 var(--fd);
  cursor: pointer;
  transition: background .2s, transform .15s;
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

/* ── Réinitialiser le tour ── */
.prf-btn-tour {
  width: 100%;
  padding: 15px;
  background: transparent;
  color: var(--mu);
  border: 1px solid var(--bo);
  border-radius: var(--r-lg, 16px);
  font: 600 14px/1 'Inter', sans-serif;
  cursor: pointer;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background .15s, transform .12s;
}
.prf-btn-tour:active { transform: scale(.98); background: var(--su); }

/* ── Wrapper actions bas ── */
.prf-actions {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Notifications toggle ── */
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
.prf-notif-row:last-child { border-bottom: none; }
.prf-notif-row:active { background: var(--bg); transform: scale(.99); }
@media(hover:hover) and (pointer:fine) { .prf-notif-row:hover { background: var(--su2); } }
.prf-notif-ico { font-size: 18px; line-height: 1; flex-shrink: 0; }
.prf-notif-body { flex: 1; min-width: 0; }
.prf-notif-lbl { font: 600 14px/1.3 'Inter', sans-serif; color: var(--ink); }
.prf-notif-sub { font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 2px; }
/* Toggle iOS-style */
.prf-toggle {
  flex-shrink: 0;
  position: relative;
  width: 44px; height: 26px;
  background: #d1d8ee;
  border-radius: 13px;
  transition: background .2s cubic-bezier(.23,1,.32,1);
  pointer-events: none;
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
.prf-notif-denied { font: 500 12px/1.3 'Inter', sans-serif; color: var(--or); margin-top: 2px; }
@media (prefers-reduced-motion: reduce) {
  .prf-toggle, .prf-toggle::after { transition: none; }
}

/* ── Bottom-sheet de confirmation suppression ── */
.prf-sheet-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal, 200);
  display: flex;
  align-items: flex-end;
  padding: 0 0 env(safe-area-inset-bottom, 0);
  animation: prfOverlayIn .22s var(--ease-out) both;
}
@keyframes prfOverlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.prf-sheet {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: var(--su);
  border-radius: 24px 24px 0 0;
  padding: 8px 24px 24px;
  animation: prfSheetIn .28s var(--ease-out) both;
}
@keyframes prfSheetIn {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.prf-sheet-handle {
  width: 36px; height: 4px;
  background: var(--bo3);
  border-radius: 99px;
  margin: 8px auto 20px;
}
.prf-sheet-ico {
  font-size: 36px;
  text-align: center;
  margin-bottom: 12px;
  line-height: 1;
}
.prf-sheet-title {
  font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  text-align: center;
  margin: 0 0 8px;
}
.prf-sheet-body {
  font: 500 14px/1.6 'Inter', sans-serif;
  color: var(--mu);
  text-align: center;
  margin: 0 0 24px;
}
.prf-sheet-body a {
  color: var(--a-txt);
  text-decoration: underline;
}
.prf-sheet-cta {
  width: 100%;
  padding: 14px;
  background: rgba(239,68,68,.08);
  border: 1.5px solid rgba(239,68,68,.3);
  border-radius: var(--r-lg, 16px);
  color: var(--rd-txt);
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 48px;
  margin-bottom: 10px;
}
.prf-sheet-cancel {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 0;
  color: var(--mu2);
  font: 500 14px/1 'Inter', sans-serif;
  cursor: pointer;
  min-height: 44px;
}

/* ── Version bas de page ── */
.prf-version {
  text-align: center;
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  padding: 16px 0 4px;
}

@media (prefers-reduced-motion: reduce) {
  .prf-sheet, .prf-sheet-overlay { animation: none !important; }
}
</style>`;

// ─── Blocklist pseudo ─────────────────────────────────────────
const PSEUDO_RE = /^[A-Za-z0-9_]{3,16}$/;
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

// ─── Entry point ─────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "profil", user_role: me.role });

  // ── Élève : profil « Carte de joueur » (Arène) — chemin dédié ──
  if (me.role === "eleve") {
    return mountEleveArene(root, me);
  }

  // Skeleton pendant les fetches
  root.innerHTML = `${STYLE}<div class="prf"><div class="skel skel-card" style="height:220px;margin:0 0 10px"></div><div class="skel skel-card" style="height:80px;margin:0 16px 10px"></div><div class="skel skel-card" style="height:140px;margin:0 16px"></div></div>`;

  // ── Fetch profil complet ──────────────────────────────────
  const { data: profile } = await sb
    .from("profiles")
    .select(
      "email, prenom, nom, xp, streak_pro_days, created_at, avatar_url, banner_url, username",
    )
    .eq("id", me.id)
    .single();

  // ── Fetch élève : validations + streak + parrainage ───────
  let permisData = null;
  let eleveStreak = 0;
  let referralStats = null;
  if (me.role === "eleve") {
    const [{ data: valData }, { data: streakRow }, { data: rStats }] =
      await Promise.all([
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
        sb.rpc("get_my_referral_stats"),
      ]);
    eleveStreak = streakRow?.current_streak ?? 0;
    permisData = {
      prenom: profile?.prenom || "",
      nom: profile?.nom || "",
      created_at: profile?.created_at || null,
      validated: (valData || []).length,
      total: REMC_TOTAL,
    };
    referralStats = rStats && !rStats.error ? rStats : null;
  }

  // ── Fetch enseignant : stats Mon Année ───────────────────
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
    const elevesIds = new Set((elevesData || []).map((e) => e.id));
    for (const v of vals) elevesIds.add(v.eleve_id);
    const elevesCount = elevesIds.size;
    const c3Count = vals.filter((v) =>
      v.competence_id?.startsWith("C3"),
    ).length;
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
      totalValidations: vals.length,
      elevesCount,
      elevesActifsCount,
      c3Count,
      streakDays,
    };
  }

  // ── Identité affichée ────────────────────────────────────
  const displayName = me.nom || profile?.email || me.email || "?";
  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  // ── « Membre depuis » (humanise la section Réglages) ─────
  let memberSince = "";
  if (profile?.created_at) {
    const d = new Date(profile.created_at);
    if (!isNaN(d)) {
      memberSince = d.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    }
  }

  // ── Données du héros d'identité (élève + enseignant) ──────
  let profileCardData = null;
  if (me.role === "eleve" && permisData) {
    const restantes = REMC_TOTAL - permisData.validated;
    profileCardData = {
      me: { ...me, prenom: profile?.prenom || "", nom: profile?.nom || "" },
      avatarUrl: getEquippedAsset("avatar") || profile?.avatar_url || null,
      bannerUrl: profile?.banner_url || null,
      bio: "Apprenti permis B",
      // Barre de progression RÉELLE vers le permis (remplace le badge prestige + l'XP arc-en-ciel)
      progress: {
        pct: REMC_TOTAL ? (permisData.validated / REMC_TOTAL) * 100 : 0,
        current: permisData.validated,
        total: REMC_TOTAL,
        label: `${permisData.validated} / ${REMC_TOTAL}`,
      },
      stats: [
        { label: "Compétences", value: permisData.validated },
        { label: "Série", value: eleveStreak },
        { label: "Restantes", value: restantes },
      ],
      shareUrl: window.location.origin,
      shareText: `Je suis à ${permisData.validated}/${REMC_TOTAL} compétences validées sur PermiGo`,
    };
  } else if (me.role === "enseignant" && anneeStats) {
    profileCardData = {
      me: { ...me, prenom: profile?.prenom || "", nom: profile?.nom || "" },
      avatarUrl: profile?.avatar_url || null,
      bannerUrl: profile?.banner_url || null,
      bio: `${anneeStats.elevesCount} élève${anneeStats.elevesCount > 1 ? "s" : ""} suivi${anneeStats.elevesCount > 1 ? "s" : ""} · cette année`,
      stats: [
        { label: "Validations", value: anneeStats.totalValidations },
        { label: "Élèves", value: anneeStats.elevesCount },
        { label: "Série", value: anneeStats.streakDays },
      ],
      shareUrl: window.location.origin,
      shareText: `${anneeStats.totalValidations} validations sur PermiGo cette année`,
    };
  }

  // ── Render HTML ──────────────────────────────────────────
  root.innerHTML = `${STYLE}
<div class="prf anim-slide-up">

  <!-- 1. Héro d'identité unique (ProfileCard ou fallback gérant) -->
  <div class="prf-hero">
    ${
      profileCardData
        ? `<div id="prf-social-card"></div>`
        : `<div style="padding:calc(var(--th) + 8px) 16px 0;display:flex;flex-direction:column;align-items:center;gap:12px;padding-bottom:20px">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--a),var(--adk));display:flex;align-items:center;justify-content:center;font:700 32px/1 'Plus Jakarta Sans',sans-serif;color:var(--a-ink);box-shadow:0 8px 24px color-mix(in srgb,var(--a) 25%,transparent)">${esc(initials)}</div>
          <div style="font:700 22px/1.2 'Plus Jakarta Sans',sans-serif;color:var(--ink);letter-spacing:-0.022em">${esc(displayName)}</div>
          <span style="font:600 11px/1 'Inter',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--a-txt);background:color-mix(in srgb,var(--a) 10%,transparent);border-radius:99px;padding:6px 12px">${esc(ROLE_LABELS[me.role] || me.role)}</span>
        </div>`
    }
  </div>

  <!-- 2. Les 3 stats clés sont déjà DANS le héro (ProfileCard) — source unique.
       On a retiré le bandeau bento qui les répétait à l'identique. -->

  <!-- Carte permis (objet de collection) + lien galerie (élève) -->
  ${permisData ? `<div id="prf-permis-card" style="padding:0 16px;margin-top:6px"></div>` : ""}
  ${
    me.role === "eleve"
      ? `
  <a class="prf-linkrow" href="#/galerie" aria-label="Voir ma galerie">
    <span class="prf-linkrow-ico" aria-hidden="true">${icon("image", { size: 17 })}</span>
    <span class="prf-linkrow-lbl">Voir ma galerie</span>
    <span class="prf-linkrow-chev" aria-hidden="true">›</span>
  </a>`
      : ""
  }

  <!-- Classement moniteur -->
  ${anneeStats ? `<div id="prf-ranking-host"></div>` : ""}

  <!-- Mon année (enseignant) : le dossier de preuve ; la « série » est déjà dans le héro -->
  ${
    anneeStats
      ? `
  <div class="prf-annee">
    <h2 class="prf-annee-ttl">Mon année ${new Date().getFullYear()}</h2>
    <div class="prf-annee-grid">
      <div class="prf-kpi"><span class="prf-kpi-n">${anneeStats.totalValidations}</span><div class="prf-kpi-lbl">compétences validées</div></div>
      <div class="prf-kpi"><span class="prf-kpi-n">${anneeStats.elevesCount}</span><div class="prf-kpi-lbl">élèves suivis</div></div>
      <div class="prf-kpi"><span class="prf-kpi-n">${anneeStats.c3Count}</span><div class="prf-kpi-lbl">C3 Maîtrise atteints</div></div>
      <div class="prf-kpi"><span class="prf-kpi-n">${anneeStats.elevesActifsCount ?? 0}</span><div class="prf-kpi-lbl">élèves actifs (30 j)</div></div>
    </div>
  </div>
  <a class="prf-linkrow" href="#/boutique" aria-label="Voir la boutique">
    <span class="prf-linkrow-ico" aria-hidden="true">${icon("car", { size: 17 })}</span>
    <span class="prf-linkrow-lbl">Voir la boutique</span>
    <span class="prf-linkrow-chev" aria-hidden="true">›</span>
  </a>`
      : ""
  }

  <!-- Pseudo public (élève) — la carte porte son propre titre -->
  ${me.role === "eleve" ? `<div id="prf-pseudo-section">${_renderPseudo(profile?.username)}</div>` : ""}

  <!-- Parrainage (élève) — la carte porte son propre titre -->
  ${
    referralStats !== null
      ? `<div id="prf-ref-section">${_renderReferral(referralStats)}</div>`
      : ""
  }

  <!-- ═══ RÉGLAGES ══════════════════════════════ -->
  <h2 class="prf-sec-ttl">Réglages</h2>

  <!-- Compte : email + membre depuis (UUID et rôle retirés — du bruit) -->
  <div class="prf-section">
    <div class="prf-row">
      <span class="prf-row-ico" aria-hidden="true">${icon("mail", { size: 16 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Email</div>
        <div class="prf-row-val">${esc(profile?.email || me.email || "—")}</div>
      </div>
    </div>
    ${
      memberSince
        ? `
    <div class="prf-row">
      <span class="prf-row-ico" aria-hidden="true">${icon("user", { size: 16 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">Membre depuis</div>
        <div class="prf-row-val">${esc(memberSince)}</div>
      </div>
    </div>`
        : ""
    }
  </div>

  <!-- Notifications + toggle -->
  ${_renderNotifToggle()}

  <!-- Déconnexion + supprimer + tour -->
  <div class="prf-actions">
    ${
      me.role === "eleve"
        ? `
    <button class="prf-btn-tour" id="btn-replay-tour" type="button">
      ${icon("graduation-cap", { size: 16 })} Revoir le tour de bienvenue
    </button>`
        : ""
    }
    <button class="prf-btn-logout" id="btn-logout">Se déconnecter</button>
    ${me.role === "eleve" ? `<button class="prf-btn-delete" id="btn-delete">Supprimer mon compte</button>` : ""}
  </div>

  <div class="prf-version">PermiGo v7 · Sprint 2</div>
</div>`;

  // ── Mount ProfileCard (élève + enseignant) ────────────────
  if (profileCardData) {
    const socialHost = root.querySelector("#prf-social-card");
    if (socialHost) mountProfileCard(socialHost, profileCardData);
  }

  // ── Mount carte permis (élève) ────────────────────────────
  if (permisData) {
    const cardHost = root.querySelector("#prf-permis-card");
    if (cardHost) mountPermisCard(cardHost, permisData);
  }

  // ── Mount ranking moniteur (enseignant) ──────────────────
  if (me.role === "enseignant") {
    const rankingHost = root.querySelector("#prf-ranking-host");
    if (rankingHost)
      mountMoniteurRanking(rankingHost, { myId: me.id }).catch(() => {});
  }

  // ── Wire pseudo + referral (élève) ───────────────────────
  if (me.role === "eleve") {
    _wirePseudo(root, me);
    _wireReferral(root, me);
  }

  // ── Déconnexion ───────────────────────────────────────────
  root.querySelector("#btn-logout")?.addEventListener("click", async () => {
    haptic("tap");
    track("auth.logout", { user_role: me.role });
    try {
      await logout();
    } catch (e) {
      console.error("[profil] logout failed", e);
      const { toast } = await import("@/components/common/toast.js");
      toast("Déconnexion impossible — réessaie", "error");
    }
  });

  // ── Suppression de compte — bottom-sheet RGPD maison ─────
  root.querySelector("#btn-delete")?.addEventListener("click", () => {
    haptic("warning");
    track("profile.delete_intent", { user_role: me.role });
    _openDeleteSheet(root, me);
  });

  // ── Replay tour ───────────────────────────────────────────
  root
    .querySelector("#btn-replay-tour")
    ?.addEventListener("click", async () => {
      haptic("select");
      track("onboarding.replay_requested", { user_role: me.role });
      // ⚠️ Le tour guidé est gaté par CE flag localStorage (cf. accueil.js
      // maybeStartEleveTour). Sans l'effacer, le tour NE repart pas — le reset
      // DB de first_value_action_at seul ne suffit pas (c'était le bug).
      try {
        localStorage.removeItem("pg-tour-eleve-v1");
      } catch {
        /* stockage indispo */
      }
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

// ─── Bottom-sheet suppression compte ─────────────────────────
function _openDeleteSheet(root, me) {
  const overlay = document.createElement("div");
  overlay.className = "prf-sheet-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "prf-delete-title");
  overlay.innerHTML = `
    <div class="prf-sheet">
      <div class="prf-sheet-handle" aria-hidden="true"></div>
      <div class="prf-sheet-ico" aria-hidden="true">🗑️</div>
      <h2 class="prf-sheet-title" id="prf-delete-title">Supprimer mon compte</h2>
      <p class="prf-sheet-body">
        Tu as le droit de demander la suppression de tes données personnelles (RGPD, art. 17).<br><br>
        Pour exercer ce droit, contacte-nous à
        <a href="mailto:support@permigo.fr">support@permigo.fr</a>.<br><br>
        Nous traiterons ta demande dans un délai de <strong>30 jours</strong>.
      </p>
      <button class="prf-sheet-cta" id="prf-delete-contact">Envoyer un e-mail de suppression</button>
      <button class="prf-sheet-cancel" id="prf-delete-cancel">Annuler</button>
    </div>`;

  document.body.appendChild(overlay);

  // Fermeture
  function close() {
    overlay.style.animation = "prfOverlayIn .18s var(--ease-out) reverse both";
    setTimeout(() => overlay.remove(), 180);
  }
  overlay.querySelector("#prf-delete-cancel")?.addEventListener("click", () => {
    haptic("tap");
    close();
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  // Ouvre le client mail avec un brouillon pré-rempli
  overlay
    .querySelector("#prf-delete-contact")
    ?.addEventListener("click", () => {
      haptic("select");
      const subject = encodeURIComponent(
        "Demande de suppression de compte PermiGo",
      );
      const body = encodeURIComponent(
        `Bonjour,\n\nJe souhaite exercer mon droit à l'effacement (RGPD, art. 17) et demander la suppression de mon compte PermiGo.\n\nEmail du compte : ${me.email || ""}\n\nMerci.`,
      );
      window.open(
        `mailto:support@permigo.fr?subject=${subject}&body=${body}`,
        "_self",
      );
      track("profile.delete_contact_clicked", { user_role: me.role });
      close();
    });
}

// ─── Pseudo public (élève) ────────────────────────────────────
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
  <div class="prf-pseudo-err" id="prf-pseudo-err" aria-live="polite"></div>
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
        haptic("success");
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

// ─── Referral (élève) ─────────────────────────────────────────
function _renderReferral(stats) {
  const code = stats?.code;
  const nRefs = stats?.n_referrals ?? 0;
  const volantsEarned = nRefs * 50;

  return `
<div class="prf-ref">
  <div class="prf-ref-header">
    <h2 class="prf-ref-ttl">Parrainage</h2>
    <div class="prf-ref-volant-badge" aria-label="+50 volants par filleul">
      ${volantImg(14, { drop: true })} +50 ${volantLabel(50)} par filleul
    </div>
  </div>

  ${
    code
      ? `
  <div class="prf-ref-code-wrap">
    <span class="prf-ref-code" id="prf-ref-code" aria-label="Mon code parrainage : ${esc(code)}">${esc(code)}</span>
    <button class="prf-ref-copy-btn" id="prf-ref-copy" title="Copier le code" aria-label="Copier mon code parrainage">
      ${icon("copy", { size: 18 })}
    </button>
  </div>
  <div class="prf-ref-stats">
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${nRefs}</span>
      <div class="prf-ref-stat-lbl">filleul${nRefs !== 1 ? "s" : ""}</div>
    </div>
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${volantImg(16, { drop: true })} ${volantsEarned}</span>
      <div class="prf-ref-stat-lbl">${volantLabel(volantsEarned)} gagnés</div>
    </div>
  </div>
  <button class="prf-ref-share-btn" id="prf-ref-share">
    ${icon("share", { size: 15 })} Partager mon code
  </button>
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

  // Copier le code
  section
    .querySelector("#prf-ref-copy")
    ?.addEventListener("click", async () => {
      haptic("tap");
      const code = section.querySelector("#prf-ref-code")?.textContent?.trim();
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        const btn = section.querySelector("#prf-ref-copy");
        if (btn) {
          btn.innerHTML = icon("check", { size: 18 });
          setTimeout(() => {
            btn.innerHTML = icon("copy", { size: 18 });
          }, 1500);
        }
        track("referral.code_copied", {});
      } catch {
        /* clipboard unavailable */
      }
    });

  // Partager
  section
    .querySelector("#prf-ref-share")
    ?.addEventListener("click", async () => {
      haptic("select");
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
          /* annulé */
        }
      } else {
        try {
          await navigator.clipboard.writeText(
            `Mon code PermiGo : ${code} — ${window.location.origin}`,
          );
          const { toast } = await import("@/components/common/toast.js");
          toast("Lien copié", "success");
        } catch {
          /* unavailable */
        }
      }
    });

  // Générer un code
  section.querySelector("#prf-ref-gen")?.addEventListener("click", async () => {
    const btn = section.querySelector("#prf-ref-gen");
    if (!btn) return;
    haptic("select");
    btn.disabled = true;
    btn.textContent = "Génération…";
    try {
      const { data, error } = await sb.rpc("generate_referral_code");
      if (error || data?.error) {
        const { toast } = await import("@/components/common/toast.js");
        toast(data?.error || "Impossible de générer le code", "error");
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

  // Appliquer un code reçu
  const applyBtn = section.querySelector("#prf-ref-apply-btn");
  const applyInput = section.querySelector("#prf-ref-input");
  applyBtn?.addEventListener("click", async () => {
    const code = applyInput?.value?.trim().toUpperCase();
    if (!code || code.length < 4) return;
    haptic("tap");
    applyBtn.disabled = true;
    applyBtn.textContent = "…";
    try {
      const { data, error } = await sb.rpc("apply_referral", { code });
      const { toast } = await import("@/components/common/toast.js");
      if (error || data?.error) {
        toast(data?.error || "Code invalide ou déjà utilisé", "error");
      } else {
        haptic("success");
        toast("Code appliqué ! +50 volants", "success", 4000);
        track("referral.applied", { code });
        if (applyInput) applyInput.value = "";
      }
    } catch {
      const { toast } = await import("@/components/common/toast.js");
      toast("Erreur de connexion", "error");
    } finally {
      applyBtn.disabled = false;
      applyBtn.textContent = "Appliquer";
    }
  });
}

// ─── Notifications toggle ─────────────────────────────────────
function _renderNotifToggle() {
  if (!("Notification" in window)) return "";

  const denied = Notification.permission === "denied";
  const enabled = isPushEnabled();

  return `
  <div class="prf-section">
    <div class="prf-notif-row" id="prf-notif-row" role="button" tabindex="0"
         aria-pressed="${enabled}" aria-label="Notifications ${enabled ? "activées" : "désactivées"}">
      <span class="prf-notif-ico" aria-hidden="true">${icon("bell", { size: 18 })}</span>
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
    haptic("tap");
    const nowEnabled = isPushEnabled();
    row.setAttribute("aria-pressed", String(!nowEnabled));
    if (nowEnabled) {
      await optOutPush();
      toggle?.classList.remove("on");
      if (sub) sub.textContent = "Désactivées";
    } else {
      const granted = await optInPush();
      if (granted) {
        haptic("success");
        toggle?.classList.add("on");
        if (sub) sub.textContent = "Quiz et streak actifs";
      } else if (Notification.permission === "denied") {
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

// ═══════════════════════════════════════════════════════════════
// PROFIL ÉLÈVE — « Carte de joueur » (Arène)
// DA Arène 3D (nuit-violet + or, plastique 3D), vocabulaire cohérent :
//   • le PSEUDO est l'identité (pas le nom légal)
//   • compteur = VALIDATIONS x/31 (pas de « niveau » inventé)
//   • « arène » = COMPÉTENCE REMC en cours (C1–C4) + emblème réel
//   • monnaie = volants (profiles.gemmes) · succès = vrais badges
// ═══════════════════════════════════════════════════════════════
const REMC_EMBLEM = {
  C1: "/skins/permigo-remc-maitrise-vehicule-flag-v1.webp",
  C2: "/skins/permigo-remc-circulation-normale-v3.webp",
  C3: "/skins/permigo-remc-conditions-difficiles-v1.webp",
  C4: "/skins/permigo-autonomie-crown-v1.webp",
};

// Quelle compétence REMC l'élève travaille (d'après le nb de validations).
function _competenceState(validated) {
  let acc = 0;
  for (let i = 0; i < REMC.length; i++) {
    const comp = REMC[i];
    const n = comp.subs.length;
    if (validated < acc + n) {
      return {
        comp,
        idx: i + 1,
        inComp: validated - acc,
        total: n,
        next: comp.subs[validated - acc] || null,
        allDone: false,
      };
    }
    acc += n;
  }
  const last = REMC[REMC.length - 1];
  return {
    comp: last,
    idx: REMC.length,
    inComp: last.subs.length,
    total: last.subs.length,
    next: null,
    allDone: true,
  };
}

// Succès (vrais badges) déduits des validations + série. Débloqués d'abord.
function _areneAchievements(validated, streak) {
  return [
    { img: "ach_comp_5", name: "5 compétences", need: validated >= 5 },
    { img: "ach_comp_10", name: "10 compétences", need: validated >= 10 },
    { img: "ach_comp_15", name: "15 compétences", need: validated >= 15 },
    { img: "ach_comp_20", name: "20 compétences", need: validated >= 20 },
    { img: "ach_comp_25", name: "25 compétences", need: validated >= 25 },
    { img: "ach_comp_28", name: "28 compétences", need: validated >= 28 },
    { img: "ach_comp_31", name: "Permis virtuel", need: validated >= 31 },
    { img: "ach_streak_3", name: "Série de 3 j", need: streak >= 3 },
    { img: "ach_streak_14", name: "Série de 14 j", need: streak >= 14 },
  ].sort((a, b) => (a.need === b.need ? 0 : a.need ? -1 : 1));
}

const STYLE_ARENE = `<style>
.arn{
  --gd:#f7b32b; --gd-pale:#ffe6a8; --gd-lt:#ffd27a; --gd-2:#ff9b1e; --gd-dp:#e8a317; --gd-deep:#b5610a; --gd-ink:#43250a;
  --gr:#58CC02; --gr-dk:#3a8a02; --gr-rim:#79e63a;
  --tx:#f3efff; --tx-dim:#c3bce6; --tx-mu:#8b83b8; --tx-fa:#6c6498;
  --ctop:#241c52; --cbot:#171134; --cedge:#0c0922;
  --gl:rgba(247,179,43,.40); --gl2:rgba(247,179,43,.18);
  position:relative; max-width:480px; margin:0 auto; min-height:100dvh;
  padding-top:calc(var(--th, 52px) + env(safe-area-inset-top,0px) + 6px);
  padding-bottom:calc(var(--bh, 64px) + env(safe-area-inset-bottom,0px) + 28px);
  color:var(--tx); font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  background:
    radial-gradient(115% 42% at 50% 2%, rgba(247,179,43,.14), transparent 60%),
    linear-gradient(176deg,#2a1a5e 0%,#1a1342 36%,#0d0a26 74%,#08071a 100%);
  isolation:isolate; overflow:hidden;
}
.arn::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;z-index:0;
  background-image:
    radial-gradient(1.4px 1.4px at 14% 5%, rgba(255,255,255,.7), transparent),
    radial-gradient(1.2px 1.2px at 82% 3%, rgba(255,255,255,.5), transparent),
    radial-gradient(1.1px 1.1px at 58% 9%, rgba(255,255,255,.45), transparent),
    radial-gradient(1.2px 1.2px at 30% 13%, rgba(255,255,255,.4), transparent),
    radial-gradient(1px 1px at 91% 11%, rgba(255,255,255,.4), transparent);}
.arn>*{position:relative;z-index:2}
.arn-h1{font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px;margin:0;padding:2px 20px 0;color:var(--tx)}

/* ── Carte de joueur ── */
.arn-card{margin:14px 16px 0;border-radius:28px;position:relative;overflow:hidden;padding:0 0 22px;
  background:radial-gradient(120% 70% at 50% -5%, rgba(247,179,43,.10), transparent 62%),linear-gradient(180deg,var(--ctop) 0%,#1d1545 58%,var(--cbot) 100%);
  box-shadow:0 16px 0 var(--cedge),0 30px 56px rgba(0,0,0,.5),inset 0 1.5px 0 rgba(255,255,255,.12),inset 0 0 0 1.5px var(--gl);}
.arn-corner{position:absolute;width:22px;height:22px;border:1.5px solid var(--gl);pointer-events:none;opacity:.7}
.arn-corner.tl{top:54px;left:14px;border-right:0;border-bottom:0;border-radius:6px 0 0 0}
.arn-corner.tr{top:54px;right:14px;border-left:0;border-bottom:0;border-radius:0 6px 0 0}
.arn-corner.bl{bottom:14px;left:14px;border-right:0;border-top:0;border-radius:0 0 0 6px}
.arn-corner.br{bottom:14px;right:14px;border-left:0;border-top:0;border-radius:0 0 6px 0}

/* bandeau pseudo — or bombé (riche) */
.arn-banner{position:relative;text-align:center;padding:15px 16px 17px;
  background:linear-gradient(180deg,rgba(255,255,255,.22),transparent 44%),linear-gradient(180deg,var(--gd-pale) 0%,var(--gd) 44%,var(--gd-2) 78%,var(--gd-deep) 100%);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.65),0 6px 0 var(--gd-deep),inset 0 -3px 8px rgba(120,60,0,.4);}
.arn-banner::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.10;background-image:repeating-linear-gradient(180deg,rgba(0,0,0,.5) 0 1px,transparent 1px 3px)}
.arn-pseudo-row{position:relative;display:inline-flex;align-items:center;gap:9px}
.arn-pseudo{font-family:'Fredoka',sans-serif;font-weight:600;font-size:25px;color:var(--gd-ink);letter-spacing:.3px;line-height:1;text-shadow:0 1px 0 rgba(255,255,255,.45)}
.arn-pseudo .at{opacity:.55;font-weight:500}
.arn-pseudo.unset{opacity:.78}
.arn-edit{width:30px;height:30px;border:0;border-radius:10px;cursor:pointer;display:grid;place-items:center;color:var(--gd-lt);
  background:linear-gradient(180deg,#4a3208,#33220a);box-shadow:0 2px 0 #1c1304,inset 0 1px 0 rgba(255,255,255,.22);transition:transform .08s,box-shadow .08s}
.arn-edit:active{transform:translateY(2px);box-shadow:0 0 0 #1c1304,inset 0 1px 0 rgba(255,255,255,.22)}
.arn-edit svg{width:15px;height:15px}
.arn-legal{margin-top:4px;font-size:11px;font-weight:700;color:#5a3a08;opacity:.72;letter-spacing:.4px;text-transform:uppercase}

/* corps : écusson + identité */
.arn-body{padding:20px 20px 0;display:flex;gap:16px;align-items:center}
.arn-crest{position:relative;flex:0 0 auto;width:84px;height:84px}
.arn-crest-disc{position:absolute;inset:0;border-radius:24px;padding:3px;background:linear-gradient(155deg,#7c5cff 0%,#5a3fd6 45%,#3a2a9e 100%);box-shadow:0 10px 22px rgba(0,0,0,.5)}
.arn-crest-disc::after{content:"";position:absolute;inset:-2px;border-radius:26px;border:2px solid transparent;background:linear-gradient(150deg,var(--gd-pale),var(--gd-deep)) border-box;-webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.arn-crest-inner{width:100%;height:100%;border-radius:21px;background:linear-gradient(160deg,#3a2f7e,#221a4e);display:grid;place-items:center;position:relative;overflow:hidden;font-family:'Fredoka',sans-serif;font-weight:600;font-size:32px;color:#fff;letter-spacing:1px;text-shadow:0 2px 5px rgba(0,0,0,.5);box-shadow:inset 0 3px 9px rgba(0,0,0,.4)}
.arn-crest-inner::before{content:"";position:absolute;top:-30%;left:-20%;width:80%;height:90%;background:linear-gradient(120deg,rgba(255,255,255,.22),transparent 60%);transform:rotate(8deg)}
.arn-meta{flex:1;min-width:0}
.arn-permis{display:inline-flex;align-items:center;gap:7px;background:rgba(124,92,255,.16);border:1px solid rgba(167,139,255,.28);color:#cdbcff;font-size:11px;font-weight:800;letter-spacing:.6px;padding:5px 11px;border-radius:999px;text-transform:uppercase}
.arn-permis .dot{width:7px;height:7px;border-radius:50%;background:var(--gr);box-shadow:0 0 7px var(--gr)}
.arn-comp{margin-top:12px;display:flex;align-items:center;gap:12px}
.arn-comp-emblem{width:52px;height:52px;flex:0 0 auto;border-radius:14px;display:grid;place-items:center;overflow:hidden;background:radial-gradient(120% 120% at 30% 18%,#2a2160,#171038);box-shadow:inset 0 0 0 1.5px var(--gl),0 5px 12px rgba(0,0,0,.4)}
.arn-comp-emblem img{width:100%;height:100%;object-fit:cover}
.arn-rank{font-family:'Fredoka',sans-serif;font-weight:600;font-size:15.5px;color:var(--gd-lt);line-height:1.1}
.arn-csub{font-size:11.5px;font-weight:700;color:var(--tx-mu);margin-top:2px}

/* compteur validations */
.arn-valid{margin:20px 20px 0;border-radius:18px;padding:16px 18px;display:flex;align-items:center;gap:16px;
  background:linear-gradient(180deg,#1c1548,#15103a);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),inset 0 0 0 1px var(--gl2),0 6px 0 var(--cedge)}
.arn-valid-emblem{width:42px;height:42px;flex:0 0 auto;border-radius:12px;display:grid;place-items:center;background:rgba(247,179,43,.10);box-shadow:inset 0 0 0 1px var(--gl)}
.arn-valid-emblem img{width:30px;height:30px;object-fit:contain}
.arn-valid-num{display:flex;align-items:baseline;gap:3px;line-height:1}
.arn-valid-num b{font-family:'Fredoka',sans-serif;font-weight:700;font-size:40px;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.3)}
.arn-valid-num .sl{font-family:'Fredoka',sans-serif;font-weight:600;font-size:24px;color:var(--tx-mu)}
.arn-valid-num .tt{font-family:'Fredoka',sans-serif;font-weight:600;font-size:24px;color:var(--gd-lt)}
.arn-valid-meta{margin-left:auto;text-align:right}
.arn-vm-lab{font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--gd-lt)}
.arn-vm-sub{font-size:11px;font-weight:700;color:var(--tx-mu);margin-top:2px}

/* barre progression compétence */
.arn-bar-wrap{margin:14px 20px 0}
.arn-bar-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;padding:0 2px}
.arn-bar-l{font-size:12px;font-weight:800;color:var(--tx-dim)}
.arn-bar-r{font-family:'Fredoka',sans-serif;font-weight:600;font-size:12.5px;color:var(--gd-lt)}
.arn-bar{position:relative;height:14px;border-radius:999px;background:#120d33;overflow:hidden;box-shadow:inset 0 2px 5px rgba(0,0,0,.55),inset 0 0 0 1px rgba(124,92,255,.2)}
.arn-bar-fill{position:absolute;inset:2px auto 2px 2px;border-radius:999px;background:linear-gradient(180deg,var(--gd-pale) 0%,var(--gd) 48%,var(--gd-2) 100%);box-shadow:0 0 12px rgba(247,179,43,.55),inset 0 1px 0 rgba(255,255,255,.7)}
.arn-bar-fill::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.5) 50%,transparent 65%);animation:arnShine 3.4s ease-in-out infinite}
@keyframes arnShine{0%{transform:translateX(-130%)}55%,100%{transform:translateX(280%)}}

/* stats */
.arn-stats{display:flex;gap:11px;margin:18px 16px 0}
.arn-stat{flex:1;border-radius:18px;padding:15px 8px 13px;text-align:center;background:linear-gradient(180deg,#1f1850,#161038);box-shadow:0 6px 0 var(--cedge),inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px var(--gl2)}
.arn-s-ico{height:30px;margin:0 auto 7px;display:block}
.arn-s-num{font-family:'Fredoka',sans-serif;font-weight:700;font-size:22px;color:var(--tx);line-height:1}
.arn-s-num.gd{color:var(--gd-lt)}
.arn-s-lab{font-size:10.5px;font-weight:700;color:var(--tx-mu);margin-top:4px}

/* succès */
.arn-ach-block{margin:24px 0 0}
.arn-ach-head{display:flex;align-items:baseline;justify-content:space-between;margin:0 22px 12px}
.arn-ach-title{font-family:'Fredoka',sans-serif;font-weight:600;font-size:16px;color:var(--tx)}
.arn-ach-count{font-size:11.5px;font-weight:800;color:var(--gd-lt)}
.arn-ach-scroll{display:flex;gap:13px;overflow-x:auto;padding:4px 18px 14px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.arn-ach-scroll::-webkit-scrollbar{height:0}
.arn-ach{flex:0 0 auto;width:92px;scroll-snap-align:start;text-align:center}
.arn-medal{position:relative;width:92px;height:92px;border-radius:20px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(180deg,#221a52,#171038);box-shadow:0 7px 0 var(--cedge),inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px var(--gl)}
.arn-medal img{width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,.45))}
.arn-medal::before{content:"";position:absolute;width:66px;height:66px;border-radius:50%;background:radial-gradient(circle,rgba(247,179,43,.28),transparent 70%)}
.arn-ach.locked .arn-medal{box-shadow:0 7px 0 var(--cedge),inset 0 1px 0 rgba(255,255,255,.04),inset 0 0 0 1px rgba(255,255,255,.05)}
.arn-ach.locked .arn-medal::before{display:none}
.arn-ach.locked .arn-medal img{filter:grayscale(1) brightness(.45);opacity:.5}
.arn-lock{position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(10,8,26,.72);display:grid;place-items:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.arn-lock svg{width:15px;height:15px;color:var(--tx-mu)}
.arn-ach-name{font-size:10.5px;font-weight:700;color:var(--tx-dim);margin-top:8px;line-height:1.25}
.arn-ach.locked .arn-ach-name{color:var(--tx-fa)}

/* prochain défi */
.arn-next{margin:24px 16px 0;border-radius:24px;padding:18px 18px 20px;position:relative;overflow:hidden;background:linear-gradient(160deg,#251d5a 0%,#181140 100%);box-shadow:0 12px 0 var(--cedge),0 22px 36px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1.5px var(--gl)}
.arn-next::before{content:"";position:absolute;right:-40px;top:-50px;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,rgba(124,92,255,.28),transparent 68%);pointer-events:none}
.arn-next-kick{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:var(--gd-lt)}
.arn-next-kick svg{width:14px;height:14px}
.arn-next-main{display:flex;align-items:center;gap:14px;margin-top:13px}
.arn-next-emblem{width:56px;height:56px;flex:0 0 auto;border-radius:16px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(160deg,#7c5cff,#4a2fc4);box-shadow:0 6px 0 #2c1d80,inset 0 1px 0 rgba(255,255,255,.3),inset 0 0 0 1.5px var(--gl)}
.arn-next-emblem img{width:100%;height:100%;object-fit:cover}
.arn-next-info{flex:1;min-width:0}
.arn-next-code{font-size:10.5px;font-weight:800;color:var(--tx-mu);letter-spacing:.6px;text-transform:uppercase}
.arn-next-name{font-family:'Fredoka',sans-serif;font-weight:600;font-size:18px;color:var(--tx);line-height:1.18;margin-top:3px}
.arn-cta{margin-top:17px;width:100%;border:0;cursor:pointer;font-family:'Fredoka',sans-serif;font-weight:600;font-size:17px;color:#1c3306;padding:15px;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:9px;
  background:linear-gradient(180deg,var(--gr-rim) 0%,var(--gr) 52%,var(--gr-dk) 100%);box-shadow:0 6px 0 var(--gr-dk),inset 0 1px 0 rgba(255,255,255,.5);transition:transform .08s,box-shadow .08s}
.arn-cta:active{transform:translateY(4px);box-shadow:0 2px 0 var(--gr-dk),inset 0 1px 0 rgba(255,255,255,.5)}
.arn-cta svg{width:18px;height:18px}

/* réglages */
.arn-set{margin:26px 16px 0}
.arn-set-title{font-size:11px;font-weight:800;color:var(--tx-mu);letter-spacing:2px;text-transform:uppercase;margin:0 6px 11px}
.arn-set-list{border-radius:20px;overflow:hidden;background:linear-gradient(180deg,#1c1548,#15103a);box-shadow:0 8px 0 var(--cedge),inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px var(--gl2)}
.arn-row{display:flex;align-items:center;gap:14px;padding:16px 17px;border-bottom:1px solid rgba(255,255,255,.05);width:100%;background:none;border-left:0;border-right:0;border-top:0;color:inherit;text-align:left;cursor:pointer;font-family:inherit}
.arn-row:last-child{border-bottom:0}
.arn-row-ico{width:38px;height:38px;flex:0 0 auto;border-radius:11px;display:grid;place-items:center;background:rgba(124,92,255,.14);color:var(--gd-lt);box-shadow:inset 0 0 0 1px var(--gl2)}
.arn-row-ico svg{width:20px;height:20px}
.arn-row-lab{flex:1;font-size:15px;font-weight:700;color:var(--tx)}
.arn-row-lab small{display:block;font-size:11.5px;font-weight:600;color:var(--tx-mu);margin-top:2px}
.arn-chev{color:var(--tx-mu)}.arn-chev svg{width:18px;height:18px}
.arn-tog{width:52px;height:30px;border-radius:999px;border:0;cursor:pointer;position:relative;flex:0 0 auto;background:#120d33;box-shadow:inset 0 2px 4px rgba(0,0,0,.5);transition:background .2s}
.arn-tog.on{background:linear-gradient(180deg,var(--gr) 0%,var(--gr-dk) 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}
.arn-tog .knob{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:linear-gradient(180deg,#fff,#dcd6f5);box-shadow:0 2px 4px rgba(0,0,0,.4);transition:transform .2s}
.arn-tog.on .knob{transform:translateX(22px)}

.arn-logout{margin:18px 16px 0;width:calc(100% - 32px);border:0;cursor:pointer;font-family:'Fredoka',sans-serif;font-weight:600;font-size:15.5px;color:#ffd4cf;padding:15px;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:10px;
  background:linear-gradient(180deg,#2c1a44,#1f1234);box-shadow:0 5px 0 #130a22,inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px rgba(255,120,120,.14);transition:transform .08s,box-shadow .08s}
.arn-logout:active{transform:translateY(3px);box-shadow:0 2px 0 #130a22,inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px rgba(255,120,120,.14)}
.arn-logout svg{width:18px;height:18px}
.arn-del{display:block;margin:14px auto 0;background:none;border:0;color:var(--tx-fa);font:500 12.5px/1 'Plus Jakarta Sans',sans-serif;text-decoration:underline;cursor:pointer;padding:8px}
.arn-since{text-align:center;margin:16px 0 4px;font-size:11px;font-weight:700;color:var(--tx-fa);letter-spacing:.6px;text-transform:uppercase}

/* modale pseudo */
.arn-modal-scrim{position:fixed;inset:0;z-index:var(--z-modal,200);display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(120% 80% at 50% 30%,rgba(30,18,72,.7),rgba(4,3,14,.88));backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .22s,visibility .22s}
.arn-modal-scrim.open{opacity:1;visibility:visible}
.arn-modal{width:100%;max-width:330px;border-radius:26px;overflow:hidden;transform:translateY(16px) scale(.95);transition:transform .26s cubic-bezier(.2,1.2,.4,1);background:linear-gradient(180deg,#241c54 0%,#171138 100%);box-shadow:0 18px 0 #0b0820,0 32px 64px rgba(0,0,0,.6),inset 0 1.5px 0 rgba(255,255,255,.14),inset 0 0 0 1.5px var(--gl)}
.arn-modal-scrim.open .arn-modal{transform:translateY(0) scale(1)}
.arn-modal-head{position:relative;padding:14px 18px;text-align:center;background:linear-gradient(180deg,rgba(255,255,255,.22),transparent 44%),linear-gradient(180deg,var(--gd-pale) 0%,var(--gd) 46%,var(--gd-2) 80%,var(--gd-deep) 100%);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 4px 0 var(--gd-deep)}
.arn-modal-head h3{font-family:'Fredoka',sans-serif;font-weight:600;font-size:18px;color:var(--gd-ink);margin:0;text-shadow:0 1px 0 rgba(255,255,255,.35)}
.arn-modal-close{position:absolute;right:13px;top:11px;width:30px;height:30px;border:0;border-radius:9px;cursor:pointer;background:rgba(60,30,5,.22);color:var(--gd-ink);font-weight:800;font-size:16px;line-height:1}
.arn-modal-body{padding:20px 18px 22px}
.arn-modal-tip{font-size:12.5px;font-weight:600;color:var(--tx-dim);text-align:center;line-height:1.55;margin:0 0 16px}
.arn-field{display:flex;align-items:center;gap:8px;background:#120d33;border-radius:16px;padding:0 14px;box-shadow:inset 0 2px 5px rgba(0,0,0,.5),inset 0 0 0 1.5px rgba(124,92,255,.3)}
.arn-field.bad{box-shadow:inset 0 2px 5px rgba(0,0,0,.5),inset 0 0 0 1.5px rgba(244,80,80,.6)}
.arn-field .at{font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px;color:var(--gd-lt)}
.arn-field input{flex:1;background:transparent;border:0;outline:0;font-family:'Fredoka',sans-serif;font-weight:500;font-size:20px;color:var(--tx);padding:14px 0;min-width:0}
.arn-rules{display:flex;justify-content:space-between;margin-top:9px;padding:0 4px;min-height:16px}
.arn-rules small{font-size:11px;font-weight:700;color:var(--tx-mu)}
.arn-rules small.ok{color:var(--gr-rim)}
.arn-rules small.err{color:#ff8a8a}
.arn-modal-save{margin-top:18px;width:100%;border:0;cursor:pointer;font-family:'Fredoka',sans-serif;font-weight:600;font-size:17px;color:#1c3306;padding:15px;border-radius:16px;background:linear-gradient(180deg,var(--gr-rim) 0%,var(--gr) 52%,var(--gr-dk) 100%);box-shadow:0 6px 0 var(--gr-dk),inset 0 1px 0 rgba(255,255,255,.5);transition:transform .08s,box-shadow .08s}
.arn-modal-save:active{transform:translateY(4px);box-shadow:0 2px 0 var(--gr-dk),inset 0 1px 0 rgba(255,255,255,.5)}
.arn-modal-save:disabled{opacity:.5;cursor:not-allowed}
@media (prefers-reduced-motion: reduce){.arn-bar-fill::after{animation:none}}
</style>`;

const _LOCK_SVG = `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" stroke-width="2"/></svg>`;

async function mountEleveArene(root, me) {
  root.innerHTML = `${STYLE_ARENE}<div class="arn"><div class="skel skel-card" style="height:300px;margin:14px 16px 0;border-radius:28px"></div><div class="skel skel-card" style="height:90px;margin:18px 16px 0;border-radius:18px"></div></div>`;

  // ── Fetch réel ─────────────────────────────────────────────
  const [{ data: profile }, { data: valData }, { data: streakRow }] =
    await Promise.all([
      sb
        .from("profiles")
        .select("email, prenom, nom, username, gemmes, created_at, avatar_url")
        .eq("id", me.id)
        .single(),
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

  const validated = (valData || []).length;
  const streak = streakRow?.current_streak ?? 0;
  const volants = typeof profile?.gemmes === "number" ? profile.gemmes : 0;
  const restantes = Math.max(0, REMC_TOTAL - validated);

  const st = _competenceState(validated);
  const emblem = REMC_EMBLEM[st.comp.id] || REMC_EMBLEM.C1;
  const compPct = st.total ? Math.round((st.inComp / st.total) * 100) : 0;
  const nextName = st.allDone
    ? "Tout est validé — permis virtuel débloqué"
    : st.next?.n || "Compétence suivante";
  const nextCode = `Compétence ${st.idx} · ${st.comp.name}`;

  const pseudo = (profile?.username || "").trim();
  const legalName =
    `${profile?.prenom || ""} ${profile?.nom || ""}`.trim() ||
    profile?.email ||
    me.email ||
    "";
  const initials = (
    ((profile?.prenom || "")[0] || "") + ((profile?.nom || "")[0] || "") ||
    pseudo.slice(0, 2) ||
    "?"
  ).toUpperCase();

  let memberSince = "";
  if (profile?.created_at) {
    const d = new Date(profile.created_at);
    if (!isNaN(d))
      memberSince = d.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
  }

  const achievements = _areneAchievements(validated, streak);
  const unlocked = achievements.filter((a) => a.need).length;

  // ── Notifications : état réel ──────────────────────────────
  const notifSupported = "Notification" in window;
  const notifDenied = notifSupported && Notification.permission === "denied";
  const notifOn = notifSupported && isPushEnabled();

  // ── Render ─────────────────────────────────────────────────
  root.innerHTML = `${STYLE_ARENE}
<div class="arn anim-slide-up">
  <h1 class="arn-h1">Mon profil</h1>

  <div class="arn-card">
    <span class="arn-corner tl"></span><span class="arn-corner tr"></span>
    <span class="arn-corner bl"></span><span class="arn-corner br"></span>

    <div class="arn-banner">
      <div class="arn-pseudo-row">
        <span class="arn-pseudo ${pseudo ? "" : "unset"}" id="arn-pseudo"><span class="at">@</span>${esc(pseudo || "ton_pseudo")}</span>
        <button class="arn-edit" id="arn-edit-pseudo" aria-label="Changer de pseudo">
          ${icon("edit", { size: 14, strokeWidth: 2.2 })}
        </button>
      </div>
      <div class="arn-legal">${esc(legalName)}</div>
    </div>

    <div class="arn-body">
      <div class="arn-crest"><div class="arn-crest-disc"><div class="arn-crest-inner">${esc(initials)}</div></div></div>
      <div class="arn-meta">
        <span class="arn-permis"><span class="dot"></span>Permis B</span>
        <div class="arn-comp">
          <span class="arn-comp-emblem"><img src="${emblem}" alt="" /></span>
          <div class="arn-comp-txt">
            <div class="arn-rank">${esc(st.comp.tname)}</div>
            <div class="arn-csub">Compétence ${st.idx} · ${esc(st.comp.name)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="arn-valid">
      <span class="arn-valid-emblem"><img src="/skins/trophy-permis-virtuel.webp" alt="" /></span>
      <div class="arn-valid-num"><b>${validated}</b><span class="sl">/</span><span class="tt">${REMC_TOTAL}</span></div>
      <div class="arn-valid-meta">
        <div class="arn-vm-lab">Validations</div>
        <div class="arn-vm-sub">objectifs du livret</div>
      </div>
    </div>

    <div class="arn-bar-wrap">
      <div class="arn-bar-head">
        <span class="arn-bar-l">Compétence ${st.idx} · ${st.inComp} / ${st.total}</span>
        <span class="arn-bar-r">${st.allDone ? "terminé ✓" : "prochaine validation"}</span>
      </div>
      <div class="arn-bar"><div class="arn-bar-fill" style="width:${Math.max(4, compPct)}%"></div></div>
    </div>
  </div>

  <!-- stats : série · volants · restantes (tous réels) -->
  <div class="arn-stats">
    <div class="arn-stat">
      <img class="arn-s-ico" src="/skins/permigo-streak-flame-v1.webp" alt="" />
      <div class="arn-s-num gd">${streak} j</div>
      <div class="arn-s-lab">Série</div>
    </div>
    <div class="arn-stat">
      <img class="arn-s-ico" src="/skins/volant-coin.webp" alt="" />
      <div class="arn-s-num gd">${volants}</div>
      <div class="arn-s-lab">Volants</div>
    </div>
    <div class="arn-stat">
      <svg class="arn-s-ico" viewBox="0 0 24 24" fill="none" style="width:30px"><path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.5L12 21l-5 -2.8 1-5.5-4-3.9 5.5-.8L12 3z" stroke="#cdbcff" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <div class="arn-s-num">${restantes}</div>
      <div class="arn-s-lab">Restantes</div>
    </div>
  </div>

  <!-- succès : vrais badges -->
  <div class="arn-ach-block">
    <div class="arn-ach-head">
      <span class="arn-ach-title">Tes succès</span>
      <span class="arn-ach-count">${unlocked} débloqué${unlocked > 1 ? "s" : ""} · ${achievements.length - unlocked} à venir</span>
    </div>
    <div class="arn-ach-scroll">
      ${achievements
        .map(
          (a) => `
      <div class="arn-ach ${a.need ? "" : "locked"}">
        <div class="arn-medal">
          <img src="/skins/achievements/${a.img}.png" alt="" loading="lazy" />
          ${a.need ? "" : `<span class="arn-lock">${_LOCK_SVG}</span>`}
        </div>
        <div class="arn-ach-name">${esc(a.name)}</div>
      </div>`,
        )
        .join("")}
    </div>
  </div>

  <!-- prochain défi -->
  <div class="arn-next">
    <span class="arn-next-kick">${icon("zap", { size: 14 })} Ton prochain défi</span>
    <div class="arn-next-main">
      <span class="arn-next-emblem"><img src="${emblem}" alt="" /></span>
      <div class="arn-next-info">
        <div class="arn-next-code">${esc(nextCode)}</div>
        <div class="arn-next-name">${esc(nextName)}</div>
      </div>
    </div>
    <button class="arn-cta" id="arn-reviser">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 4l13 8-13 8V4z" fill="#1c3306"/></svg> Réviser maintenant
    </button>
  </div>

  <!-- réglages -->
  <div class="arn-set">
    <p class="arn-set-title">Réglages</p>
    <div class="arn-set-list">
      ${
        notifSupported
          ? `
      <button class="arn-row" id="arn-notif" type="button" aria-pressed="${notifOn}">
        <span class="arn-row-ico">${icon("bell", { size: 19 })}</span>
        <span class="arn-row-lab">Rappels de révision<small id="arn-notif-sub">${notifDenied ? "Bloqués par le navigateur" : notifOn ? "Reste dans le rythme" : "Désactivés"}</small></span>
        ${notifDenied ? "" : `<span class="arn-tog ${notifOn ? "on" : ""}" id="arn-notif-tog"><span class="knob"></span></span>`}
      </button>`
          : ""
      }
      <a class="arn-row" href="#/settings">
        <span class="arn-row-ico">${icon("settings", { size: 19 })}</span>
        <span class="arn-row-lab">Réglages<small>Thème, langue, confidentialité</small></span>
        <span class="arn-chev"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </a>
    </div>
  </div>

  <button class="arn-logout" id="arn-logout">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 12H4m0 0l4-4m-4 4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 3h8a2 2 0 012 2v14a2 2 0 01-2 2H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Se déconnecter
  </button>
  <button class="arn-del" id="arn-del">Supprimer mon compte</button>

  <div class="arn-since">${memberSince ? `Membre depuis ${esc(memberSince)}` : ""}</div>

  <!-- modale changer de pseudo -->
  <div class="arn-modal-scrim" id="arn-modal" role="dialog" aria-modal="true" aria-label="Changer de pseudo">
    <div class="arn-modal">
      <div class="arn-modal-head">
        <h3>Choisis ton nom de joueur</h3>
        <button class="arn-modal-close" id="arn-modal-close" aria-label="Fermer">✕</button>
      </div>
      <div class="arn-modal-body">
        <p class="arn-modal-tip">C'est le nom que voient les autres élèves au classement de l'arène.</p>
        <div class="arn-field" id="arn-field">
          <span class="at">@</span>
          <input id="arn-input" type="text" maxlength="16" autocomplete="off" spellcheck="false" placeholder="speedy_lea" value="${esc(pseudo)}" />
        </div>
        <div class="arn-rules">
          <small id="arn-rule">3 à 16 caractères : lettres, chiffres ou _</small>
          <small id="arn-count">${pseudo.length} / 16</small>
        </div>
        <button class="arn-modal-save" id="arn-save">Valider mon nom</button>
      </div>
    </div>
  </div>
</div>`;

  _wireEleveArene(root, me);
}

function _wireEleveArene(root, me) {
  // ── Réviser → parcours ──
  root.querySelector("#arn-reviser")?.addEventListener("click", () => {
    haptic("select");
    location.hash = "#/parcours";
  });

  // ── Déconnexion ──
  root.querySelector("#arn-logout")?.addEventListener("click", async () => {
    haptic("tap");
    track("auth.logout", { user_role: me.role });
    try {
      await logout();
    } catch (e) {
      console.error("[profil] logout", e);
      const { toast } = await import("@/components/common/toast.js");
      toast("Déconnexion impossible — réessaie", "error");
    }
  });

  // ── Supprimer (bottom-sheet RGPD réutilisé) ──
  root.querySelector("#arn-del")?.addEventListener("click", () => {
    haptic("warning");
    track("profile.delete_intent", { user_role: me.role });
    _openDeleteSheet(root, me);
  });

  // ── Notifications (toggle réel) ──
  const notifRow = root.querySelector("#arn-notif");
  if (
    notifRow &&
    !("Notification" in window && Notification.permission === "denied")
  ) {
    notifRow.addEventListener("click", async () => {
      haptic("tap");
      const tog = root.querySelector("#arn-notif-tog");
      const sub = root.querySelector("#arn-notif-sub");
      if (isPushEnabled()) {
        await optOutPush();
        tog?.classList.remove("on");
        notifRow.setAttribute("aria-pressed", "false");
        if (sub) sub.textContent = "Désactivés";
      } else {
        const ok = await optInPush();
        if (ok) {
          haptic("success");
          tog?.classList.add("on");
          notifRow.setAttribute("aria-pressed", "true");
          if (sub) sub.textContent = "Reste dans le rythme";
        } else if (Notification.permission === "denied") {
          if (sub) sub.textContent = "Bloqués par le navigateur";
          tog?.remove();
        }
      }
    });
  }

  // ── Modale pseudo ──
  const modal = root.querySelector("#arn-modal");
  const input = root.querySelector("#arn-input");
  const field = root.querySelector("#arn-field");
  const rule = root.querySelector("#arn-rule");
  const count = root.querySelector("#arn-count");
  const saveBtn = root.querySelector("#arn-save");

  const openModal = () => {
    haptic("select");
    modal?.classList.add("open");
    setTimeout(() => input?.focus(), 240);
  };
  const closeModal = () => modal?.classList.remove("open");

  root.querySelector("#arn-edit-pseudo")?.addEventListener("click", openModal);
  root.querySelector("#arn-modal-close")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") closeModal();
  });

  input?.addEventListener("input", () => {
    const v = input.value.trim();
    if (count) count.textContent = `${v.length} / 16`;
    field?.classList.remove("bad");
    if (rule) {
      rule.textContent = "3 à 16 caractères : lettres, chiffres ou _";
      rule.classList.remove("err");
    }
  });

  saveBtn?.addEventListener("click", async () => {
    const raw = input.value.trim();
    const showErr = (msg) => {
      if (rule) {
        rule.textContent = msg;
        rule.classList.add("err");
      }
      field?.classList.add("bad");
    };
    if (raw !== "") {
      if (!PSEUDO_RE.test(raw)) {
        showErr("3 à 16 caractères : lettres, chiffres ou _");
        return;
      }
      if (_isBlocked(raw)) {
        showErr("Ce pseudo n'est pas autorisé.");
        return;
      }
    }
    const value = raw === "" ? null : raw;
    saveBtn.disabled = true;
    saveBtn.textContent = "…";
    try {
      const { error } = await sb
        .from("profiles")
        .update({ username: value })
        .eq("id", me.id);
      const { toast } = await import("@/components/common/toast.js");
      if (error) {
        if (error.code === "23505") showErr("Ce pseudo est déjà pris.");
        else showErr("Impossible d'enregistrer.");
        toast(
          error.code === "23505"
            ? "Ce pseudo est déjà pris"
            : "Impossible d'enregistrer le pseudo",
          "error",
        );
      } else {
        haptic("success");
        track("pseudo.updated", { has_pseudo: value !== null });
        toast(value ? "Pseudo enregistré" : "Pseudo retiré", "success");
        // Met à jour le bandeau sans recharger
        const ps = root.querySelector("#arn-pseudo");
        if (ps) {
          ps.innerHTML = `<span class="at">@</span>${esc(value || "ton_pseudo")}`;
          ps.classList.toggle("unset", !value);
        }
        closeModal();
      }
    } catch (e) {
      console.error("[profil] pseudo", e);
      const { toast } = await import("@/components/common/toast.js");
      toast("Erreur de connexion", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Valider mon nom";
    }
  });
}
