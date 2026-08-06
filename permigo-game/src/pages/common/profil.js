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
import { yesterdayKey } from "@/services/daily-quiz.js";
// Source unique de la série (cf. src/services/streak.js) : même calcul que
// accueil.js et reviser.js, pour ne plus jamais afficher un chiffre différent
// sur cette page (bug des 3 séries incohérentes corrigé le 06/08/2026).
import { getStreak } from "@/services/streak.js";
import { getCurUser, setCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { mountPermisCard } from "@/components/eleve/permis-card.js";
import { mountProfileCard } from "@/components/common/profile-card.js";
import { changeAvatar } from "@/components/common/avatar-edit.js";
import { getEquippedAsset, getEquipped } from "@/utils/game-state.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";
import { CATALOG, STREAK_SEUIL } from "@/data/achievements.js";
// « Mes cartes » (profil variante B, 06/08/2026) : la liste des 31 cartes
// vient de la MÊME source que #/cartes (src/data/cartes.js), le paquet
// lui-même (mécanique + CSS) vient d'un import dynamique de collection.js
// (cf. mountEleveArene) — jamais dupliqué, cf. commentaire dans ce fichier.
import { CARTES } from "@/data/cartes.js";
import { itemName } from "@/data/rewards-i18n.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { volantImg, volantLabel } from "@/utils/volant.js";
import { haptic } from "@/utils/haptic.js";
import { isPushEnabled, optOutPush, optInPush } from "@/services/web-push.js";
import { getLang } from "@/utils/lang.js";
import { toast } from "@/components/common/toast.js";
import { chromeNight } from "@/utils/chrome-night.js";

// ─── Labels rôle ─────────────────────────────────────────────
let _areneEscHandler = null;

// Démontage : retire le listener clavier global de la modale pseudo (sinon il
// s'accumule sur `document` à chaque visite du profil → fuite + handlers
// fantômes qui ciblent une modale déjà retirée du DOM).
export function unmount() {
  if (_areneEscHandler) {
    document.removeEventListener("keydown", _areneEscHandler);
    _areneEscHandler = null;
  }
}

function _queryError(result) {
  if (result?.status === "rejected") {
    return result.reason || new Error("Requête Supabase rejetée");
  }
  if (result?.status === "fulfilled") return result.value?.error || null;
  return result?.error || null;
}

function _queryData(result) {
  if (_queryError(result)) return null;
  return result?.status === "fulfilled" ? result.value?.data : result?.data;
}

function _reportQueryErrors(scope, entries, toastMessage = "") {
  const errors = entries
    .map(([label, result]) => [label, _queryError(result)])
    .filter(([, error]) => error);
  if (!errors.length) return false;
  console.error(`[profil] ${scope}`, Object.fromEntries(errors));
  if (toastMessage) toast(toastMessage, "error");
  return true;
}

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
  /* #app (has-chrome) compense déjà le header fixe — pas de var(--th) ici */
  padding-top: 8px;
  padding-bottom: calc(var(--bh, 64px) + env(safe-area-inset-bottom, 0px) + 24px);
  max-width: 480px;
  margin: 0 auto;
  color: var(--ink);
  font-family: 'Archivo', sans-serif;
  background: var(--bg);
}

/* ── Héro : pas de padding latéral (la ProfileCard sort plein-bord) ── */
.prf-hero { padding: 0 0 4px; }

/* ── Titre de section : vrai titre humain (sentence-case, pas de MAJUSCULE crispée) ── */
.prf-sec-ttl {
  font: 800 17px/1.2 'Archivo', sans-serif;
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
  font: 600 12px/1 'Archivo', sans-serif;
  color: var(--mu2);
  margin-bottom: 4px;
}
.prf-row-val {
  font: 600 14px/1.3 'Archivo', sans-serif;
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
.prf-linkrow-lbl { flex: 1; font: 700 14px/1.2 'Archivo', sans-serif; }
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
  font: 800 15px/1.2 'Archivo', sans-serif;
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
  font: 700 28px/1 'Archivo', sans-serif;
  color: var(--ink);
  display: block;
  margin-bottom: 6px;
  letter-spacing: -0.025em;
}
.prf-kpi-lbl {
  font: 500 11px/1.3 'Archivo', sans-serif;
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
  font: 800 15px/1.2 'Archivo', sans-serif;
  letter-spacing: -.01em;
  color: var(--ink);
  margin: 0 0 6px;
}
.prf-pseudo-help {
  font: 500 12px/1.4 'Archivo', sans-serif;
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
  font: 700 14px/1 'Archivo', sans-serif;
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;
  transition: opacity .12s, transform .12s;
}
.prf-pseudo-save:active { transform: scale(.97); }
.prf-pseudo-save:disabled { opacity: .5; cursor: not-allowed; }
.prf-pseudo-err {
  font: 500 12px/1.3 'Archivo', sans-serif;
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
.prf-ref-ico {
  display: inline-flex;
  flex-shrink: 0;
  line-height: 0;
}
.prf-ref-ttl {
  font: 800 15px/1.2 'Archivo', sans-serif;
  letter-spacing: -.01em;
  color: var(--ink);
  margin: 0;
  flex: 1;
}
.prf-ref-volant-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font: 700 12px/1 'Archivo', sans-serif;
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
  font: 700 22px/1 'Archivo', sans-serif;
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}
.prf-ref-stat-lbl {
  font: 500 10px/1.3 'Archivo', sans-serif;
  color: var(--mu2);
}
.prf-ref-share-btn {
  width: 100%;
  padding: 13px;
  background: var(--a);
  border: none;
  border-radius: var(--r, 12px);
  color: var(--a-ink);
  font: 700 14px/1 'Archivo', sans-serif;
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
  font: 700 14px/1 'Archivo', sans-serif;
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
  font: 700 13px/1 'Archivo', sans-serif;
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
  font: 500 13px/1 'Archivo', sans-serif;
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
  font: 600 14px/1 'Archivo', sans-serif;
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
.prf-notif-lbl { font: 600 14px/1.3 'Archivo', sans-serif; color: var(--ink); }
.prf-notif-sub { font: 500 12px/1.3 'Archivo', sans-serif; color: var(--mu2); margin-top: 2px; }
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
.prf-notif-denied { font: 500 12px/1.3 'Archivo', sans-serif; color: var(--or); margin-top: 2px; }
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
  font: 700 18px/1.2 'Archivo', sans-serif;
  color: var(--ink);
  text-align: center;
  margin: 0 0 8px;
}
.prf-sheet-body {
  font: 500 14px/1.6 'Archivo', sans-serif;
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
  font: 700 14px/1 'Archivo', sans-serif;
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
  font: 500 14px/1 'Archivo', sans-serif;
  cursor: pointer;
  min-height: 44px;
}

/* ── Version bas de page ── */
.prf-version {
  text-align: center;
  font: 500 11px/1 'Archivo', sans-serif;
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

  // ── Moniteur : profil « Blason pro » (indigo premium) — chemin dédié ──
  if (me.role === "enseignant") {
    return mountEnseignantArene(root, me);
  }

  // Skeleton pendant les fetches
  root.innerHTML = `${STYLE}<div class="prf"><div class="skel skel-card" style="height:220px;margin:0 0 10px"></div><div class="skel skel-card" style="height:80px;margin:0 16px 10px"></div><div class="skel skel-card" style="height:140px;margin:0 16px"></div></div>`;

  // ── Fetch profil complet ──────────────────────────────────
  const { data: profile, error: profileError } = await sb
    .from("profiles")
    .select(
      "email, prenom, nom, xp, streak_pro_days, created_at, avatar_url, banner_url, username",
    )
    .eq("id", me.id)
    .single();
  if (profileError) {
    console.error("[profil] profil principal", profileError);
    toast("Certaines données du profil sont indisponibles.", "error");
  }

  // ── Fetch élève : validations + streak + parrainage ───────
  let permisData = null;
  let eleveStreak = 0;
  let referralStats = null;
  if (me.role === "eleve") {
    const [valRes, streakRes, referralRes] = await Promise.all([
      sb
        .from("validations")
        .select("competence_id")
        .eq("eleve_id", me.id)
        .eq("statut", "acquis"),
      sb
        .from("streaks")
        .select("current_streak, last_activity_date")
        .eq("user_id", me.id)
        .maybeSingle(),
      sb.rpc("get_my_referral_stats"),
    ]);
    _reportQueryErrors("données élève", [
      ["validations", valRes],
      ["série", streakRes],
      ["parrainage", referralRes],
    ]);
    const valData = _queryData(valRes);
    const streakRow = _queryData(streakRes);
    const rStats = _queryData(referralRes);
    const _yStrE = yesterdayKey();
    // Série d'activité : périmée si dernière activité < hier (cf. accueil).
    eleveStreak =
      streakRow && streakRow.last_activity_date >= _yStrE
        ? (streakRow.current_streak ?? 0)
        : 0;
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
    // Retrait de la gamification moniteur (30/07/2026) : on ne lit plus
    // profiles.streak_pro_days (une série de VALIDATIONS, donc gelée à vie), et
    // « élèves actifs » se mesure sur last_active_at — l'activité RÉELLE des
    // élèves — au lieu d'être déduite des validations du moniteur.
    const [validationsRes, elevesRes] = await Promise.all([
      sb
        .from("validations")
        .select("competence_id, eleve_id, validated_at")
        .eq("validated_by", me.id)
        .gte("validated_at", yearStart),
      sb
        .from("profiles")
        .select("id, last_active_at")
        .eq("role", "eleve")
        .eq("enseignant_id", me.id)
        .is("deleted_at", null),
    ]);
    _reportQueryErrors("statistiques enseignant", [
      ["validations", validationsRes],
      ["élèves", elevesRes],
    ]);
    const valData = _queryData(validationsRes);
    const elevesData = _queryData(elevesRes);

    const vals = valData || [];
    const elevesIds = new Set((elevesData || []).map((e) => e.id));
    for (const v of vals) elevesIds.add(v.eleve_id);
    const elevesCount = elevesIds.size;
    const c3Count = vals.filter((v) =>
      v.competence_id?.startsWith("C3"),
    ).length;
    const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
    const elevesActifsCount = (elevesData || []).filter(
      (e) => (e.last_active_at || "") >= since30d,
    ).length;

    anneeStats = {
      totalValidations: vals.length,
      elevesCount,
      elevesActifsCount,
      c3Count,
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
      memberSince = d.toLocaleDateString(
        { fr: "fr-FR", en: "en-GB", ar: "ar" }[getLang()] || "fr-FR",
        {
          month: "long",
          year: "numeric",
        },
      );
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
      bio: ptR("student_bio", "Apprenti permis B"),
      // Barre de progression RÉELLE vers le permis (remplace le badge prestige + l'XP arc-en-ciel)
      progress: {
        pct: REMC_TOTAL ? (permisData.validated / REMC_TOTAL) * 100 : 0,
        current: permisData.validated,
        total: REMC_TOTAL,
        label: `${permisData.validated} / ${REMC_TOTAL}`,
      },
      stats: [
        {
          label: ptR("stat_skills", "Compétences"),
          value: permisData.validated,
        },
        { label: ptR("stat_streak", "Série"), value: eleveStreak },
        { label: ptR("stat_remaining", "Restantes"), value: restantes },
      ],
      shareUrl: window.location.origin,
      shareText: ptR(
        "share_student",
        "Je suis à {current}/{total} compétences validées sur PermiGo",
        { current: permisData.validated, total: REMC_TOTAL },
      ),
    };
  } else if (me.role === "enseignant" && anneeStats) {
    profileCardData = {
      me: { ...me, prenom: profile?.prenom || "", nom: profile?.nom || "" },
      avatarUrl: profile?.avatar_url || null,
      bannerUrl: profile?.banner_url || null,
      bio: ptR(
        "instructor_bio",
        `${anneeStats.elevesCount} élève${anneeStats.elevesCount > 1 ? "s" : ""} suivi${anneeStats.elevesCount > 1 ? "s" : ""} · cette année`,
        { count: anneeStats.elevesCount },
      ),
      stats: [
        {
          label: ptR("valid_lab", "Validations"),
          value: anneeStats.totalValidations,
        },
        {
          label: ptR("stat_students", "Élèves"),
          value: anneeStats.elevesCount,
        },
        // « Série » retirée le 30/07/2026 : streak_pro_days comptait des jours
        // de VALIDATION → gelée à vie. Remplacée par les élèves qui bossent.
        {
          label: ptR("stat_active", "Actifs 30 j"),
          value: anneeStats.elevesActifsCount ?? 0,
        },
      ],
      shareUrl: window.location.origin,
      shareText: ptR(
        "share_instructor",
        "{count} validations sur PermiGo cette année",
        { count: anneeStats.totalValidations },
      ),
    };
  }

  // ── Render HTML ──────────────────────────────────────────
  root.innerHTML = `${STYLE}
<div class="prf anim-slide-up"${profileDir()}>

  <!-- 1. Héro d'identité unique (ProfileCard ou fallback gérant) -->
  <div class="prf-hero">
    ${
      profileCardData
        ? `<div id="prf-social-card"></div>`
        : `<div style="padding:8px 16px 0;display:flex;flex-direction:column;align-items:center;gap:12px;padding-bottom:20px">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--a),var(--adk));display:flex;align-items:center;justify-content:center;font:700 32px/1 'Archivo',sans-serif;color:var(--a-ink);box-shadow:0 8px 24px color-mix(in srgb,var(--a) 25%,transparent)">${esc(initials)}</div>
          <div style="font:700 22px/1.2 'Archivo',sans-serif;color:var(--ink);letter-spacing:-0.022em">${esc(displayName)}</div>
          <span style="font:600 11px/1 'Archivo',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--a-txt);background:color-mix(in srgb,var(--a) 10%,transparent);border-radius:99px;padding:6px 12px">${esc(profileRoleLabel(me.role) || me.role)}</span>
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
  <a class="prf-linkrow" href="#/galerie" aria-label="${ptA("view_gallery", "Voir ma galerie")}">
    <span class="prf-linkrow-ico" aria-hidden="true">${icon("image", { size: 17 })}</span>
    <span class="prf-linkrow-lbl">${pt("view_gallery", "Voir ma galerie")}</span>
    <span class="prf-linkrow-chev" aria-hidden="true">›</span>
  </a>`
      : ""
  }

  <!-- Retrait de la gamification moniteur (30/07/2026) : le classement des
       moniteurs (points = validations données) vivait ici. -->

  <!-- Mon année (enseignant) : le dossier de preuve -->
  ${
    anneeStats
      ? `
  <div class="prf-annee">
    <h2 class="prf-annee-ttl">${pt("my_year", "Mon année {year}", { year: new Date().getFullYear() })}</h2>
    <div class="prf-annee-grid">
      <div class="prf-kpi"><span class="prf-kpi-n">${anneeStats.totalValidations}</span><div class="prf-kpi-lbl">${pt("skills_validated", "compétences validées")}</div></div>
      <div class="prf-kpi"><span class="prf-kpi-n">${anneeStats.elevesCount}</span><div class="prf-kpi-lbl">${pt("students_supported", "élèves suivis")}</div></div>
      <div class="prf-kpi"><span class="prf-kpi-n">${anneeStats.c3Count}</span><div class="prf-kpi-lbl">${pt("c3_reached", "C3 Maîtrise atteints")}</div></div>
      <div class="prf-kpi"><span class="prf-kpi-n">${anneeStats.elevesActifsCount ?? 0}</span><div class="prf-kpi-lbl">${pt("active_students", "élèves actifs (30 j)")}</div></div>
    </div>
  </div>
  <a class="prf-linkrow" href="#/boutique" aria-label="${ptA("view_store", "Voir la boutique")}">
    <span class="prf-linkrow-ico" aria-hidden="true">${icon("car", { size: 17 })}</span>
    <span class="prf-linkrow-lbl">${pt("view_store", "Voir la boutique")}</span>
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
  <h2 class="prf-sec-ttl">${pt("settings", "Réglages")}</h2>

  <!-- Compte : email + membre depuis (UUID et rôle retirés — du bruit) -->
  <div class="prf-section">
    <div class="prf-row">
      <span class="prf-row-ico" aria-hidden="true">${icon("mail", { size: 16 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">${pt("email", "Email")}</div>
        <div class="prf-row-val">${esc(profile?.email || me.email || "—")}</div>
      </div>
    </div>
    ${
      memberSince
        ? `
    <div class="prf-row">
      <span class="prf-row-ico" aria-hidden="true">${icon("user", { size: 16 })}</span>
      <div class="prf-row-body">
        <div class="prf-row-lbl">${pt("member_since", "Membre depuis")}</div>
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
      ${icon("graduation-cap", { size: 16 })} ${pt("replay_tour", "Revoir le tour de bienvenue")}
    </button>`
        : ""
    }
    <button class="prf-btn-logout" id="btn-logout">${pt("logout", "Se déconnecter")}</button>
    ${me.role === "eleve" ? `<button class="prf-btn-delete" id="btn-delete">${pt("delete_account", "Supprimer mon compte")}</button>` : ""}
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
      toast(
        ptR("toast_logout_err", "Déconnexion impossible. Réessaie"),
        "error",
      );
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
  overlay.dir = getLang() === "ar" ? "rtl" : "ltr";
  if (getLang() === "ar") overlay.lang = "ar";
  overlay.innerHTML = `
    <div class="prf-sheet">
      <div class="prf-sheet-handle" aria-hidden="true"></div>
      <div class="prf-sheet-ico" aria-hidden="true">🗑️</div>
      <h2 class="prf-sheet-title" id="prf-delete-title">${pt("delete_sheet_title", "Supprimer mon compte")}</h2>
      <p class="prf-sheet-body">
        ${pt("delete_sheet_prefix", "La suppression est")} <strong>${pt("delete_sheet_immediate", "immédiate et irréversible")}</strong> ${pt("delete_sheet_law", "(RGPD, art. 17).")}
        ${pt("delete_sheet_transparency", "Tes données personnelles sont supprimées ou anonymisées : ton prénom, ton email et ta photo disparaissent, tes statistiques deviennent anonymes. Ton compte ne pourra pas être récupéré.")}<br><br>
        ${pt("delete_sheet_question", "Question ou demande par écrit ?")} <a href="mailto:dpo@permigo.fr">dpo@permigo.fr</a>
        ${pt("delete_sheet_processed", "(traitée sous 30 jours).")}
      </p>
      <button class="prf-sheet-cta" id="prf-delete-contact">${pt("delete_account", "Supprimer mon compte")}</button>
      <button class="prf-sheet-cancel" id="prf-delete-cancel">${pt("cancel", "Annuler")}</button>
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

  // Vrai flux in-app (exigence Google Play) : la modale de confirmation des
  // Réglages (saisie « SUPPRIMER MON COMPTE » → RPC delete_my_account),
  // au lieu de l'ancien brouillon d'email sans effet.
  overlay
    .querySelector("#prf-delete-contact")
    ?.addEventListener("click", () => {
      haptic("select");
      track("profile.delete_flow_opened", { user_role: me.role });
      close();
      location.hash = "#/settings/supprimer";
    });
}

// ─── Pseudo public (élève) ────────────────────────────────────
function _renderPseudo(username) {
  return `
<div class="prf-pseudo">
  <h2 class="prf-pseudo-ttl">${pt("public_username", "Pseudo public")}</h2>
  <p class="prf-pseudo-help">${pt("public_username_help", "Visible dans le classement. Laisse vide pour rester anonyme. 3 à 16 caractères, lettres/chiffres/_")}</p>
  <div class="prf-pseudo-row">
    <input class="prf-pseudo-input" id="prf-pseudo-input" type="text" inputmode="text"
           placeholder="ex: speedy_lea" maxlength="16" autocomplete="off" spellcheck="false"
           value="${escAttr(username || "")}">
    <button class="prf-pseudo-save" id="prf-pseudo-save">${pt("save", "Enregistrer")}</button>
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
        showErr(
          ptR(
            "pseudo_format_err",
            "3 à 16 caractères : lettres, chiffres ou _ uniquement.",
          ),
        );
        return;
      }
      if (_isBlocked(raw)) {
        showErr(ptR("pseudo_not_allowed", "Ce pseudo n'est pas autorisé."));
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
          showErr(ptR("pseudo_taken_err", "Ce pseudo est déjà pris."));
          toast(ptR("toast_pseudo_taken", "Ce pseudo est déjà pris"), "error");
        } else if (error.code === "23514") {
          showErr(ptR("pseudo_invalid", "Format invalide."));
        } else {
          toast(
            ptR("toast_pseudo_save_err", "Impossible d'enregistrer le pseudo"),
            "error",
          );
        }
      } else {
        showErr("");
        haptic("success");
        track("pseudo.updated", { has_pseudo: value !== null });
        toast(
          value
            ? ptR("toast_pseudo_saved", "Pseudo enregistré")
            : ptR("toast_pseudo_removed", "Pseudo retiré"),
          "success",
        );
      }
    } catch (e) {
      console.error("[profil] pseudo", e);
      const { toast } = await import("@/components/common/toast.js");
      toast(ptR("toast_conn_err", "Erreur de connexion"), "error");
    } finally {
      btn.disabled = false;
      btn.textContent = ptR("save", "Enregistrer");
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
    <span class="prf-ref-ico" aria-hidden="true">${medallion("cadeau", "pink", { size: 32 })}</span>
    <h2 class="prf-ref-ttl">${pt("referral", "Parrainage")}</h2>
    <div class="prf-ref-volant-badge" aria-label="${ptA("referral_reward", "+50 volants par filleul")}">
      ${volantImg(14, { drop: true })} ${pt("referral_reward", `+50 ${volantLabel(50)} par filleul`)}
    </div>
  </div>

  ${
    code
      ? `
  <div class="prf-ref-code-wrap">
    <span class="prf-ref-code" id="prf-ref-code" aria-label="${ptA("referral_code_aria", "Mon code parrainage : {code}", { code })}">${esc(code)}</span>
    <button class="prf-ref-copy-btn" id="prf-ref-copy" title="${ptA("referral_copy_title", "Copier le code")}" aria-label="${ptA("referral_copy_aria", "Copier mon code parrainage")}">

      ${icon("copy", { size: 18 })}
    </button>
  </div>
  <div class="prf-ref-stats">
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${nRefs}</span>
      <div class="prf-ref-stat-lbl">${pt("referrals_count", `filleul${nRefs !== 1 ? "s" : ""}`)}</div>
    </div>
    <div class="prf-ref-stat">
      <span class="prf-ref-stat-n">${volantImg(16, { drop: true })} ${volantsEarned}</span>
      <div class="prf-ref-stat-lbl">${pt("steering_wheels_earned", `${volantLabel(volantsEarned)} gagnés`)}</div>
    </div>
  </div>
  <button class="prf-ref-share-btn" id="prf-ref-share">
    ${icon("share", { size: 15 })} ${pt("share_code", "Partager mon code")}
  </button>
  `
      : `
  <button class="prf-ref-gen-btn" id="prf-ref-gen">${pt("generate_code", "Générer mon code de parrainage")}</button>
  `
  }

  <div class="prf-ref-apply">
    <input class="prf-ref-apply-input" id="prf-ref-input" type="text"
           placeholder="${ptA("friend_code_placeholder", "Code d'un ami…")}" maxlength="12" autocomplete="off">
    <button class="prf-ref-apply-btn" id="prf-ref-apply-btn">${pt("apply", "Appliquer")}</button>
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
            title: ptR("referral_share_title", "Rejoins PermiGo !"),
            text: ptR(
              "referral_share_text",
              "Utilise mon code {code} sur PermiGo et gagne 50 volants",
              { code },
            ),
            url: window.location.origin,
          });
          track("referral.shared", { code });
        } catch {
          /* annulé */
        }
      } else {
        try {
          await navigator.clipboard.writeText(
            ptR("referral_clipboard", "Mon code PermiGo : {code}. {url}", {
              code,
              url: window.location.origin,
            }),
          );
          const { toast } = await import("@/components/common/toast.js");
          toast(ptR("link_copied", "Lien copié"), "success");
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
    btn.textContent = ptR("generating", "Génération…");
    try {
      const { data, error } = await sb.rpc("generate_referral_code");
      if (error || data?.error) {
        const { toast } = await import("@/components/common/toast.js");
        toast(
          data?.error ||
            ptR("generate_failed", "Impossible de générer le code"),
          "error",
        );
        btn.disabled = false;
        btn.textContent = ptR(
          "generate_code",
          "Générer mon code de parrainage",
        );
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
      btn.textContent = ptR("generate_code", "Générer mon code de parrainage");
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
      const { data, error } = await sb.rpc("apply_referral", { p_code: code });
      const { toast } = await import("@/components/common/toast.js");
      if (error || data?.error) {
        toast(
          data?.error ||
            ptR("referral_invalid", "Code invalide ou déjà utilisé"),
          "error",
        );
      } else {
        haptic("success");
        toast(
          ptR("referral_applied", "Code appliqué ! +50 volants"),
          "success",
          4000,
        );
        track("referral.applied", { code });
        if (applyInput) applyInput.value = "";
      }
    } catch {
      const { toast } = await import("@/components/common/toast.js");
      toast(ptR("toast_conn_err", "Erreur de connexion"), "error");
    } finally {
      applyBtn.disabled = false;
      applyBtn.textContent = ptR("apply", "Appliquer");
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
         aria-pressed="${enabled}" aria-label="${escAttr(`${ptR("notifications", "Notifications")} ${enabled ? ptR("notifications_enabled", "activées") : ptR("notifications_disabled", "désactivées")}`)}">
      <span class="prf-notif-ico" aria-hidden="true">${icon("bell", { size: 18 })}</span>
      <div class="prf-notif-body">
        <div class="prf-notif-lbl">${pt("notifications", "Notifications")}</div>
        ${
          denied
            ? `<div class="prf-notif-denied">${pt("notif_browser_help", "Bloquées par le navigateur. Autorise-les dans les réglages")}</div>`
            : `<div class="prf-notif-sub">${enabled ? pt("notif_quiz_streak", "Quiz et streak actifs") : pt("notif_off", "Désactivées")}</div>`
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
    row.setAttribute(
      "aria-label",
      `${ptR("notifications", "Notifications")} ${
        !nowEnabled
          ? ptR("notifications_enabled", "activées")
          : ptR("notifications_disabled", "désactivées")
      }`,
    );
    if (nowEnabled) {
      await optOutPush();
      toggle?.classList.remove("on");
      if (sub) sub.textContent = ptR("notif_off", "Désactivées");
    } else {
      const granted = await optInPush();
      if (granted) {
        haptic("success");
        toggle?.classList.add("on");
        if (sub)
          sub.textContent = ptR("notif_quiz_streak", "Quiz et streak actifs");
      } else if (Notification.permission === "denied") {
        if (sub)
          sub.outerHTML = `<div class="prf-notif-denied">${pt("notif_browser_help", "Bloquées par le navigateur. Autorise-les dans les réglages")}</div>`;
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
// PROFIL ÉLÈVE — « Le paquet » (variante B, décision Rayan 06/08/2026)
// « Rempli d'infos, trop de choses inutiles, on sait pas où donner de la
// tête. Mets à la place des succès mes cartes, ça s'ouvre comme les
// applis de rencontre. » Le profil élève DEVIENT la maison des cartes :
//   • identité = 44px en haut (photo + pseudo), plus de « carte de joueur »
//   • héros = le paquet de cartes REMC (mécanique PARTAGÉE avec #/cartes,
//     cf. le commentaire CARD_DECK_STYLE dans src/pages/eleve/collection.js
//     : jamais dupliquée, importée dynamiquement dans mountEleveArene)
//   • trophées : 13 → 2 (seuls comp_28/comp_31 marquent un vrai moment de
//     la conduite, les autres comptent ce que les cartes montrent déjà ou
//     mesurent l'usage de l'app, pas la conduite)
//   • monnaie = volants (profiles.gemmes), affichés dans l'en-tête de la
//     vitrine (grille skins façon Duolingo), là où ils servent vraiment
// ═══════════════════════════════════════════════════════════════
// Les 2 seuls trophées qui restent sur le profil : ils marquent un vrai
// jalon de la conduite (prêt pour l'examen blanc, permis virtuel complet),
// contrairement aux comp_5/10/15/20/25 (déjà montrés par les 31 cartes),
// aux streak_* (mesurent l'usage de l'app, pas la conduite) et aux quiz_*
// (idem). Le CATALOG complet (13 trophées) reste la source unique pour
// tout autre écran qui en aurait besoin : on FILTRE à l'affichage ici,
// on ne retire rien du catalogue partagé.
const PROFIL_TROPHIES = ["comp_28", "comp_31"];

// Repli quand get_my_achievements est indisponible : on déduit ce qu'on peut
// des compteurs locaux (compétences + série). Les succès quiz restent
// verrouillés faute de compteur ici — c'est le mode dégradé, pas la norme.
function _fallbackUnlocked(key, validated, streak) {
  if (key.startsWith("comp_")) return validated >= parseInt(key.slice(5), 10);
  if (key.startsWith("streak_"))
    return streak >= (STREAK_SEUIL[key] ?? parseInt(key.slice(7), 10));
  return false;
}

const STYLE_ARENE = `<style>
${chromeNight("#2a1a5e", "#08071a")}
.arn{
  --gd:#f7b32b; --gd-pale:#ffe6a8; --gd-lt:#ffd27a; --gd-2:#ff9b1e; --gd-dp:#e8a317; --gd-deep:#b5610a; --gd-ink:#43250a;
  --gr:#58CC02; --gr-dk:#3a8a02; --gr-rim:#79e63a;
  --tx:#f3efff; --tx-dim:#c3bce6; --tx-mu:#8b83b8; --tx-fa:#6c6498;
  --ctop:#241c52; --cbot:#171134; --cedge:#0c0922;
  --gl:rgba(247,179,43,.40); --gl2:rgba(247,179,43,.18);
  position:relative; max-width:480px; min-height:100dvh;
  /* Fond nuit pleine hauteur sous le header verre (pattern livret) */
  margin:calc(-1 * (var(--th, 52px) + env(safe-area-inset-top,0px))) auto 0;
  padding-top:calc(var(--th, 52px) + env(safe-area-inset-top,0px) + 6px);
  padding-bottom:calc(var(--bh, 64px) + env(safe-area-inset-bottom,0px) + 28px);
  color:var(--tx); font-family:'Archivo',system-ui,sans-serif;
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

/* ═══ VARIANTE « PAQUET » (06/08/2026) ═══════════════════════════
   Refonte Rayan : « rempli d'infos, trop de choses inutiles, on sait pas
   où donner de la tête. Mets à la place des succès mes cartes, ça
   s'ouvre comme les applis de rencontre. » Le profil élève DEVIENT la
   maison des cartes : l'identité tient dans une barre de 44px, « Mes
   cartes » domine, les trophées tombent de 13 à 2, la vitrine se lit
   d'un regard. Maquette : mockups/profil-refonte/profil-B-paquet.html
   ═══════════════════════════════════════════════════════════════ */
.arn{ --csu:#1c1548; --csu2:#221a54; --cbo2:rgba(255,255,255,.07); }

/* ── Barre d'identité : 44px, un tap sur la photo ou le nom suffit ── */
.arn2-top{display:flex;align-items:center;gap:11px;padding:0 20px}
.arn2-av{width:44px;height:44px;flex:0 0 auto;border-radius:14px;overflow:hidden;border:0;padding:0;cursor:pointer;
  box-shadow:0 0 0 2px var(--gl),0 5px 14px rgba(0,0,0,.5)}
.arn2-av img{width:100%;height:100%;object-fit:cover;display:block}
.arn2-av .ini{width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(155deg,#7c5cff 0%,#5a3fd6 45%,#3a2a9e 100%);color:#fff;font:700 17px/1 'Archivo',sans-serif}
.arn2-name{flex:1;min-width:0;background:none;border:0;padding:0;text-align:left;cursor:pointer;color:inherit;font-family:inherit}
.arn2-name b{display:block;font:700 16px/1.15 'Archivo',sans-serif;letter-spacing:-.01em;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.arn2-name b i{font-style:normal;color:var(--gd-lt);opacity:.8}
.arn2-name small{display:block;font:600 11px/1 'Archivo',sans-serif;color:var(--tx-mu);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── LE héros : « Mes cartes » ── */
.arn2-cards-hd{display:flex;align-items:baseline;justify-content:space-between;padding:22px 20px 0}
.arn2-cards-ttl{margin:0;font:800 26px/1 'Archivo',sans-serif;color:#fff;letter-spacing:-.03em}

/* ── Prochaine carte + trophées de conduite, une seule bande ── */
.arn2-strip{margin:22px 16px 0;border-radius:20px;overflow:hidden;
  background:linear-gradient(180deg,var(--csu),var(--csu2));box-shadow:0 7px 0 var(--cedge),inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px var(--gl2)}
.arn2-strip-a{display:flex;align-items:center;gap:13px;padding:14px 16px;border-bottom:1px solid var(--cbo2)}
.arn2-strip-img{width:42px;height:58px;flex:0 0 auto;border-radius:10px;overflow:hidden;position:relative;background:#0a0a10;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.12)}
.arn2-strip-img img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) brightness(.36) blur(1px)}
.arn2-strip-img i{position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.65)}
.arn2-strip-b{flex:1;min-width:0}
.arn2-strip-k{font:800 9.5px/1 'Archivo',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--gd-lt)}
.arn2-strip-n{margin-top:5px;font:700 14.5px/1.2 'Archivo',sans-serif;color:#fff;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.arn2-strip-go{height:44px;padding:0 16px;flex:0 0 auto;border:0;border-radius:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;color:#1c1140;font:800 13px/1 'Archivo',sans-serif;
  background:linear-gradient(180deg,var(--gd-pale),var(--gd) 55%,var(--gd-2));box-shadow:0 3px 0 var(--gd-deep)}
.arn2-strip-b2{display:flex;align-items:center;gap:11px;padding:13px 16px}
.arn2-medal{width:40px;height:40px;flex:0 0 auto;border-radius:12px;display:grid;place-items:center;overflow:hidden;
  background:linear-gradient(180deg,#221a52,#171038);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.arn2-medal img{width:32px;height:32px;object-fit:contain}
.arn2-medal.locked img{filter:grayscale(1) brightness(.6);opacity:.55}
.arn2-strip-t{flex:1;font:700 12.5px/1.3 'Archivo',sans-serif;color:var(--tx-dim)}
.arn2-strip-t small{display:block;font:600 11px/1.3 'Archivo',sans-serif;color:var(--tx-mu);margin-top:3px}

/* ── Ma vitrine ── */
.arn2-sec{margin:28px 16px 0}
.arn2-sec-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 4px}
.arn2-sec-ttl{margin:0;font:800 18px/1 'Archivo',sans-serif;color:#fff;letter-spacing:-.02em}
.arn2-sec-sub{margin:0 2px 14px;font:600 12px/1.4 'Archivo',sans-serif;color:var(--tx-mu)}
.arn2-wallet{display:flex;align-items:center;gap:6px;padding:6px 12px 6px 8px;border-radius:99px;flex-shrink:0;
  font:800 13px/1 'Archivo',sans-serif;color:var(--gd-lt);background:rgba(247,179,43,.12);box-shadow:inset 0 0 0 1px rgba(247,179,43,.3)}
.arn2-wallet img{width:18px;height:18px}
.arn2-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.arn2-tile{display:block;border:0;text-align:center;padding:12px 11px 11px;border-radius:20px;cursor:pointer;font-family:inherit;color:inherit;text-decoration:none;
  background:linear-gradient(180deg,var(--csu2),var(--csu));box-shadow:0 5px 0 var(--cedge),inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px rgba(255,255,255,.06)}
.arn2-tile-plate{height:88px;border-radius:14px;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(80% 70% at 50% 22%, rgba(124,92,255,.28), rgba(10,8,26,.5))}
.arn2-tile-plate img{width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 5px 10px rgba(0,0,0,.5))}
.arn2-tile.is-locked .arn2-tile-plate img{filter:grayscale(1) brightness(.55)}
.arn2-tile-n{margin:10px 0 0;font:700 12.5px/1.2 'Archivo',sans-serif;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.arn2-tag{margin-top:9px;display:flex;align-items:center;justify-content:center;gap:5px;height:32px;border-radius:11px;font:800 12px/1 'Archivo',sans-serif}
.arn2-tag img{width:15px;height:15px}
.arn2-tag svg{width:14px;height:14px}
.arn2-tag.buy{color:#1c1140;background:linear-gradient(180deg,var(--gd-pale),var(--gd) 58%,var(--gd-2));box-shadow:0 3px 0 var(--gd-deep)}
.arn2-tag.own{color:#a9f0c0;background:rgba(88,204,2,.14);box-shadow:inset 0 0 0 1px rgba(121,230,58,.35)}
.arn2-tag.eq{color:#1c3306;background:linear-gradient(180deg,#79e63a,#58cc02 60%,#3a8a02);box-shadow:0 3px 0 #2c6a01}
.arn2-tag.lock{color:var(--tx-mu);background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.arn2-linkall{margin-top:12px;width:100%;border:0;cursor:pointer;padding:13px;border-radius:15px;text-decoration:none;display:block;text-align:center;
  font:700 14px/1 'Archivo',sans-serif;color:var(--gd-lt);background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(247,179,43,.22)}

/* ── Accès rapide + bas de page ── */
.arn2-linkrow{margin:22px 16px 0;display:flex;align-items:center;gap:12px;padding:14px 16px;min-height:52px;border-radius:16px;text-decoration:none;color:var(--tx);
  background:var(--csu);box-shadow:0 5px 0 var(--cedge),inset 0 1px 0 rgba(255,255,255,.07),inset 0 0 0 1px var(--gl2)}
.arn2-linkrow span.lbl{flex:1;font:700 14px/1.2 'Archivo',sans-serif}
.arn2-linkrow svg{width:20px;height:20px;flex-shrink:0;color:var(--tx-mu)}
.arn2-foot{margin:22px 16px 0;display:flex;gap:10px}
.arn2-foot a,.arn2-foot button{flex:1;border:0;cursor:pointer;text-decoration:none;padding:15px 10px;border-radius:16px;font:700 13.5px/1 'Archivo',sans-serif;font-family:inherit;
  display:flex;align-items:center;justify-content:center;gap:8px}
.arn2-foot svg{width:16px;height:16px}
.arn2-f-set{color:var(--tx);background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.arn2-f-out{color:#ffd4cf;background:linear-gradient(180deg,#2c1a44,#1f1234);box-shadow:0 4px 0 #130a22,inset 0 0 0 1px rgba(255,120,120,.14)}
.arn2-del{display:block;margin:15px auto 0;background:none;border:0;color:var(--tx-mu);font:500 12.5px/1 'Archivo',sans-serif;text-decoration:underline;cursor:pointer;padding:9px}

/* La carte profil entre avec une translation (slide-up partagé, fill-mode
   « both »). Or un élément qui ANIME un transform reste un bloc conteneur pour
   ses enfants position:fixed tant que le remplissage « forward » persiste —
   même quand la frame finale vaut transform:none (le moteur calcule une matrice
   identité, pas le mot-clé none). Résultat : la modale (inset:0) couvrait toute
   la page haute au lieu du viewport → centrée ≈ en bas de l'écran.
   Fix : fill-mode « backwards » → l'anim garde son état de départ (aucun flash à
   l'entrée) mais NE persiste PAS après : .arn revient à transform:none et ne
   capture donc plus le position:fixed. Scopé à .arn (profil élève) uniquement.
   ⚠️ Ne JAMAIS repasser en « both » / « forwards » : le bug de position revient. */
.arn.anim-slide-up{animation-fill-mode:backwards}

/* modale pseudo */
.arn-modal-scrim{position:fixed;inset:0;z-index:var(--z-modal,200);display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(120% 80% at 50% 30%,rgba(30,18,72,.7),rgba(4,3,14,.88));backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .22s,visibility .22s}
.arn-modal-scrim.open{opacity:1;visibility:visible}
.arn-modal{width:100%;max-width:330px;border-radius:26px;overflow:hidden;transform:translateY(16px) scale(.95);transition:transform .26s cubic-bezier(.2,1.2,.4,1);background:linear-gradient(180deg,#241c54 0%,#171138 100%);box-shadow:0 18px 0 #0b0820,0 32px 64px rgba(0,0,0,.6),inset 0 1.5px 0 rgba(255,255,255,.14),inset 0 0 0 1.5px var(--gl)}
.arn-modal-scrim.open .arn-modal{transform:translateY(0) scale(1)}
.arn-modal-head{position:relative;padding:14px 18px;text-align:center;background:linear-gradient(180deg,rgba(255,255,255,.22),transparent 44%),linear-gradient(180deg,var(--gd-pale) 0%,var(--gd) 46%,var(--gd-2) 80%,var(--gd-deep) 100%);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 4px 0 var(--gd-deep)}
.arn-modal-head h3{font-family:'Archivo',sans-serif;font-weight:600;font-size:18px;color:var(--gd-ink);margin:0;text-shadow:0 1px 0 rgba(255,255,255,.35)}
.arn-modal-close{position:absolute;right:13px;top:11px;width:30px;height:30px;border:0;border-radius:9px;cursor:pointer;background:rgba(60,30,5,.22);color:var(--gd-ink);font-weight:800;font-size:16px;line-height:1}
.arn-modal-close::before{content:"";position:absolute;inset:-7px}
.arn-modal-body{padding:20px 18px 22px}
.arn-modal-tip{font-size:12.5px;font-weight:600;color:var(--tx-dim);text-align:center;line-height:1.55;margin:0 0 16px}
.arn-field{display:flex;align-items:center;gap:8px;background:#120d33;border-radius:16px;padding:0 14px;box-shadow:inset 0 2px 5px rgba(0,0,0,.5),inset 0 0 0 1.5px rgba(124,92,255,.3)}
.arn-field.bad{box-shadow:inset 0 2px 5px rgba(0,0,0,.5),inset 0 0 0 1.5px rgba(244,80,80,.6)}
.arn-field .at{font-family:'Archivo',sans-serif;font-weight:600;font-size:20px;color:var(--gd-lt)}
.arn-field input{flex:1;background:transparent;border:0;outline:0;font-family:'Archivo',sans-serif;font-weight:500;font-size:20px;color:var(--tx);padding:14px 0;min-width:0}
.arn-rules{display:flex;justify-content:space-between;margin-top:9px;padding:0 4px;min-height:16px}
.arn-rules small{font-size:11px;font-weight:700;color:var(--tx-mu)}
.arn-rules small.ok{color:var(--gr-rim)}
.arn-rules small.err{color:#ff8a8a}
.arn-modal-save{margin-top:18px;width:100%;border:0;cursor:pointer;font-family:'Archivo',sans-serif;font-weight:600;font-size:17px;color:#1c3306;padding:15px;border-radius:16px;background:linear-gradient(180deg,var(--gr-rim) 0%,var(--gr) 52%,var(--gr-dk) 100%);box-shadow:0 6px 0 var(--gr-dk),inset 0 1px 0 rgba(255,255,255,.5);transition:transform .08s,box-shadow .08s}
.arn-modal-save:active{transform:translateY(4px);box-shadow:0 2px 0 var(--gr-dk),inset 0 1px 0 rgba(255,255,255,.5)}
.arn-modal-save:disabled{opacity:.5;cursor:not-allowed}
</style>`;

// ── i18n des coques profil (EN/AR) : élève, moniteur et composants communs.
// Dict LOCAL au composant. pt() échappe le contenu HTML, ptA() les attributs et
// ptR() sert aux textContent, toasts et interpolations contrôlées. En français
// ou si une clé manque, le littéral FR passé à l'appel reste le repli. Le
// contenu REMC dynamique conserve sa langue source, comme sur l'accueil.
const PROF_I18N = {
  en: {
    h1_title: "My profile",
    pseudo_ph: "your_handle",
    pseudo_edit_aria: "Change username",
    photo_edit: "Change my photo",
    comp_n: "Skill {n}",
    valid_lab: "Validations",
    valid_sub: "booklet objectives",
    bar_done: "done ✓",
    bar_next: "next validation",
    stat_streak: "Streak",
    stat_volants: "Steering wheels",
    stat_remaining: "Remaining",
    ach_title: "Your achievements",
    ach_list_aria: "Your achievements (scrollable list)",
    next_kick: "Your next challenge",
    all_done: "Everything validated. Virtual licence unlocked",
    next_skill: "Next skill",
    cta_review: "Revise now",
    settings: "Settings",
    row_notifs: "My notifications",
    row_notifs_sub: "Validations · encouragements · reports",
    row_reminders: "Revision reminders",
    notif_off: "Off",
    notif_rhythm: "Stay on track",
    notif_blocked: "Blocked by the browser",
    row_settings_sub: "Theme · language · privacy",
    logout: "Log out",
    delete_account: "Delete my account",
    delete_sheet_transparency:
      "Your personal data is deleted or anonymised: your first name, email and photo are removed, and your statistics become anonymous. Your account cannot be recovered.",
    member_since: "Member since",
    modal_title: "Choose your player name",
    modal_close: "Close",
    modal_tip: "This is the name other students see in the arena ranking.",
    pseudo_rule: "3 to 16 characters: letters, numbers or _",
    modal_save: "Save my name",
    pseudo_not_allowed: "This username isn't allowed.",
    pseudo_taken_err: "This username is already taken.",
    pseudo_save_err: "Couldn't save.",
    toast_photo: "Photo updated ✓",
    toast_logout_err: "Couldn't log out. Try again",
    toast_pseudo_taken: "This username is already taken",
    toast_pseudo_save_err: "Couldn't save the username",
    toast_pseudo_saved: "Username saved",
    toast_pseudo_removed: "Username removed",
    toast_conn_err: "Connection error",
    role_student: "Student",
    role_instructor: "Instructor",
    role_manager: "Manager",
    role_platform: "Platform",
    student_bio: "Category B learner",
    stat_skills: "Skills",
    share_student: "I have validated {current}/{total} skills on PermiGo",
    instructor_bio: "{count} student(s) supported · this year",
    stat_students: "Students",
    share_instructor: "{count} validations on PermiGo this year",
    view_gallery: "View my gallery",
    my_year: "My year {year}",
    skills_validated: "Skills validated",
    students_supported: "Students supported",
    c3_reached: "C3 Mastery reached",
    active_students: "Active students (30 d)",
    view_store: "View the store",
    email: "Email",
    replay_tour: "Replay the welcome tour",
    delete_sheet_title: "Delete my account",
    delete_sheet_prefix: "Deletion is",
    delete_sheet_immediate: "immediate and irreversible",
    delete_sheet_law: "(GDPR, Art. 17).",
    delete_sheet_question: "Question or written request?",
    delete_sheet_processed: "(processed within 30 days).",
    cancel: "Cancel",
    public_username: "Public username",
    public_username_help:
      "Visible in the ranking. Leave blank to remain anonymous. 3 to 16 characters: letters, numbers or _",
    save: "Save",
    pseudo_format_err: "3 to 16 characters: letters, numbers or _ only.",
    pseudo_invalid: "Invalid format.",
    referral: "Referrals",
    referral_reward: "+50 steering wheels per referral",
    referral_code_aria: "My referral code: {code}",
    referral_copy_title: "Copy code",
    referral_copy_aria: "Copy my referral code",
    referrals_count: "referral(s)",
    steering_wheels_earned: "steering wheels earned",
    share_code: "Share my code",
    generate_code: "Generate my referral code",
    friend_code_placeholder: "A friend's code…",
    apply: "Apply",
    referral_share_title: "Join PermiGo!",
    referral_share_text:
      "Use my code {code} on PermiGo and earn 50 steering wheels",
    referral_clipboard: "My PermiGo code: {code}. {url}",
    link_copied: "Link copied",
    generating: "Generating…",
    generate_failed: "Unable to generate the code",
    referral_invalid: "Invalid or already used code",
    referral_applied: "Code applied! +50 steering wheels",
    notifications: "Notifications",
    notifications_enabled: "enabled",
    notifications_disabled: "disabled",
    notif_browser_help: "Blocked by the browser. Allow them in the settings",
    notif_quiz_streak: "Quiz and streak active",
    licence_b: "Category B licence",
    instructor_default: "Instructor",
    rank_month: "{rank} this month · {score} pts",
    validations_this_year: "Validations|this year",
    students_activity:
      "{students} student(s) supported · {active} active over 30 days",
    pro_streak: "Pro streak",
    my_achievements: "My achievements",
    unlocked_to_come: "{unlocked} unlocked · {locked} to come",
    achievements_list: "Your achievements (scrollable list)",
    my_position: "My position",
    monthly_ranking: "Monthly ranking",
    view_ranking: "View ranking",
    you: "you",
    points: "pts",
    ranking_empty:
      "Your ranking will appear after your first validations this month.",
    account_settings: "Account settings",
    teacher_notif_sub: "Validations · lessons · messages",
    validations_followups: "Validations & follow-ups",
    theme_subscription_security: "Theme · subscription · security",
    ach_first_validation: "1st validation",
    ach_50_validations: "50 validations",
    ach_100_validations: "100 validations",
    ach_10_students: "10 students supported",
    ach_streak_7: "7-day streak",
    ach_top_5: "Top 5 this month",
    ach_250_validations: "250 validations",
    ach_streak_30: "30-day streak",
    ach_25_students: "25 students supported",
    ach_month_number_one: "No. 1 this month",
  },
  ar: {
    h1_title: "ملفي الشخصي",
    pseudo_ph: "لقبك",
    pseudo_edit_aria: "تغيير اللقب",
    photo_edit: "تغيير صورتي",
    comp_n: "المهارة {n}",
    valid_lab: "التحقّقات",
    valid_sub: "أهداف الدفتر",
    bar_done: "اكتمل ✓",
    bar_next: "التحقق التالي",
    stat_streak: "السلسلة",
    stat_volants: "مقود",
    stat_remaining: "المتبقية",
    ach_title: "إنجازاتك",
    ach_list_aria: "إنجازاتك (قائمة قابلة للتمرير)",
    next_kick: "تحديك التالي",
    all_done: "كل شيء مُتحقق. الرخصة الافتراضية مفتوحة",
    next_skill: "المهارة التالية",
    cta_review: "راجع الآن",
    settings: "الإعدادات",
    row_notifs: "إشعاراتي",
    row_notifs_sub: "التحقّقات · التشجيعات · التقارير",
    row_reminders: "تذكيرات المراجعة",
    notif_off: "معطّلة",
    notif_rhythm: "حافظ على وتيرتك",
    notif_blocked: "محظورة من المتصفح",
    row_settings_sub: "السمة · اللغة · الخصوصية",
    logout: "تسجيل الخروج",
    delete_account: "حذف حسابي",
    delete_sheet_transparency:
      "تُحذف بياناتك الشخصية أو تُجعل مجهولة الهوية: يُمحى اسمك وبريدك الإلكتروني وصورتك، وتصبح إحصاءاتك مجهولة. لا يمكن استرجاع حسابك.",
    member_since: "عضو منذ",
    modal_title: "اختر اسم لاعبك",
    modal_close: "إغلاق",
    modal_tip: "هذا هو الاسم الذي يراه بقية الطلاب في تصنيف الحلبة.",
    pseudo_rule: "من 3 إلى 16 حرفًا: أحرف أو أرقام أو _",
    modal_save: "حفظ اسمي",
    pseudo_not_allowed: "هذا اللقب غير مسموح به.",
    pseudo_taken_err: "هذا اللقب مأخوذ بالفعل.",
    pseudo_save_err: "تعذّر الحفظ.",
    toast_photo: "تم تحديث الصورة ✓",
    toast_logout_err: "تعذّر تسجيل الخروج. أعد المحاولة",
    toast_pseudo_taken: "هذا اللقب مأخوذ بالفعل",
    toast_pseudo_save_err: "تعذّر حفظ اللقب",
    toast_pseudo_saved: "تم حفظ اللقب",
    toast_pseudo_removed: "تمت إزالة اللقب",
    toast_conn_err: "خطأ في الاتصال",
    role_student: "طالب",
    role_instructor: "مدرّب",
    role_manager: "مدير",
    role_platform: "المنصة",
    student_bio: "متعلم رخصة الفئة B",
    stat_skills: "المهارات",
    share_student: "اعتمدت {current}/{total} مهارة على بيرميغو",
    instructor_bio: "متابعة {count} طالب · هذا العام",
    stat_students: "الطلاب",
    share_instructor: "{count} اعتمادًا على بيرميغو هذا العام",
    view_gallery: "عرض معرضي",
    my_year: "عامي {year}",
    skills_validated: "المهارات المعتمدة",
    students_supported: "الطلاب المتابَعون",
    c3_reached: "تم بلوغ إتقان C3",
    active_students: "الطلاب النشطون (30 يومًا)",
    view_store: "عرض المتجر",
    email: "البريد الإلكتروني",
    replay_tour: "إعادة جولة الترحيب",
    delete_sheet_title: "حذف حسابي",
    delete_sheet_prefix: "الحذف",
    delete_sheet_immediate: "فوري ولا رجعة فيه",
    delete_sheet_law: "(المادة 17 من اللائحة العامة لحماية البيانات).",
    delete_sheet_question: "لديك سؤال أو طلب كتابي؟",
    delete_sheet_processed: "(تتم المعالجة خلال 30 يومًا).",
    cancel: "إلغاء",
    public_username: "اللقب العام",
    public_username_help:
      "يظهر في التصنيف. اتركه فارغًا لتبقى مجهولًا. من 3 إلى 16 حرفًا: أحرف أو أرقام أو _",
    save: "حفظ",
    pseudo_format_err: "من 3 إلى 16 حرفًا: أحرف أو أرقام أو _ فقط.",
    pseudo_invalid: "تنسيق غير صالح.",
    referral: "الإحالات",
    referral_reward: "+50 مقودًا لكل إحالة",
    referral_code_aria: "رمز إحالتي: {code}",
    referral_copy_title: "نسخ الرمز",
    referral_copy_aria: "نسخ رمز إحالتي",
    referrals_count: "إحالة",
    steering_wheels_earned: "مقودًا مكتسبًا",
    share_code: "مشاركة رمزي",
    generate_code: "إنشاء رمز الإحالة",
    friend_code_placeholder: "رمز صديق…",
    apply: "تطبيق",
    referral_share_title: "انضم إلى بيرميغو!",
    referral_share_text: "استخدم رمزي {code} على بيرميغو واربح 50 مقودًا",
    referral_clipboard: "رمزي على بيرميغو: {code}. {url}",
    link_copied: "تم نسخ الرابط",
    generating: "جارٍ الإنشاء…",
    generate_failed: "تعذّر إنشاء الرمز",
    referral_invalid: "الرمز غير صالح أو مستخدم من قبل",
    referral_applied: "تم تطبيق الرمز! +50 مقودًا",
    notifications: "الإشعارات",
    notifications_enabled: "مفعّلة",
    notifications_disabled: "معطّلة",
    notif_browser_help: "محظورة من المتصفح. اسمح بها في الإعدادات",
    notif_quiz_streak: "الاختبارات والسلسلة مفعّلة",
    licence_b: "رخصة الفئة B",
    instructor_default: "مدرّب",
    rank_month: "{rank} هذا الشهر · {score} نقطة",
    validations_this_year: "الاعتمادات|هذا العام",
    students_activity: "متابعة {students} طالب · {active} نشط خلال 30 يومًا",
    pro_streak: "السلسلة المهنية",
    my_achievements: "إنجازاتي",
    unlocked_to_come: "{unlocked} مفتوحة · {locked} قادمة",
    achievements_list: "إنجازاتك (قائمة قابلة للتمرير)",
    my_position: "مركزي",
    monthly_ranking: "تصنيف الشهر",
    view_ranking: "عرض التصنيف",
    you: "أنت",
    points: "نقطة",
    ranking_empty: "سيظهر تصنيفك بعد أول اعتماداتك هذا الشهر.",
    account_settings: "إعدادات الحساب",
    teacher_notif_sub: "الاعتمادات · الحصص · الرسائل",
    validations_followups: "الاعتمادات والمتابعات",
    theme_subscription_security: "السمة · الاشتراك · الأمان",
    ach_first_validation: "أول اعتماد",
    ach_50_validations: "50 اعتمادًا",
    ach_100_validations: "100 اعتماد",
    ach_10_students: "متابعة 10 طلاب",
    ach_streak_7: "سلسلة 7 أيام",
    ach_top_5: "أفضل 5 هذا الشهر",
    ach_250_validations: "250 اعتمادًا",
    ach_streak_30: "سلسلة 30 يومًا",
    ach_25_students: "متابعة 25 طالبًا",
    ach_month_number_one: "الأول هذا الشهر",
  },
};

function pt(key, fr, vars) {
  return esc(ptR(key, fr, vars));
}
function ptA(key, fr, vars) {
  return escAttr(ptR(key, fr, vars));
}
function ptR(key, fr, vars) {
  const l = getLang();
  let value = (l !== "fr" && PROF_I18N[l]?.[key]) || fr;
  if (vars)
    for (const [name, replacement] of Object.entries(vars))
      value = value.split(`{${name}}`).join(String(replacement));
  return value;
}
function profileDir() {
  return getLang() === "ar" ? ' dir="rtl" lang="ar"' : "";
}
function profileRoleLabel(role) {
  return {
    eleve: ptR("role_student", ROLE_LABELS.eleve),
    enseignant: ptR("role_instructor", ROLE_LABELS.enseignant),
    gerant: ptR("role_manager", ROLE_LABELS.gerant),
    owner: ptR("role_platform", ROLE_LABELS.owner),
  }[role];
}

// Noms des succès (« Tes succès ») — même métaphore automobile que le FR, une
// entrée par clé de trophée (CATALOG). Traduits avec soin, pas de « gems ».
const PROF_ACH_I18N = {
  en: {
    comp_5: "First adjustments",
    comp_10: "Chassis set",
    comp_15: "Engine fitted",
    comp_20: "Body mounted",
    comp_25: "Headlights on",
    comp_28: "Mock exam ready",
    comp_31: "Open road",
    streak_3: "Engine started",
    streak_14: "Full tank",
    streak_60: "Streak driver",
    quiz_10: "Brakes tested",
    quiz_50: "Steering calibrated",
    quiz_perfect_5: "Retro rim",
  },
  ar: {
    comp_5: "الضبط الأول",
    comp_10: "الهيكل جاهز",
    comp_15: "المحرك مثبّت",
    comp_20: "البدن مركّب",
    comp_25: "الأضواء مشتعلة",
    comp_28: "جاهز للامتحان التجريبي",
    comp_31: "الطريق مفتوح",
    streak_3: "المحرك يعمل",
    streak_14: "خزان ممتلئ",
    streak_60: "سائق مثابر",
    quiz_10: "الفرامل مُختبرة",
    quiz_50: "المقود مُعاير",
    quiz_perfect_5: "جنط كلاسيكي",
  },
};
function ptAch(key, fr) {
  const l = getLang();
  return (l !== "fr" && PROF_ACH_I18N[l]?.[key]) || fr;
}

async function mountEleveArene(root, me) {
  root.innerHTML = `${STYLE_ARENE}<div class="arn"${profileDir()}><div class="skel skel-card" style="height:44px;margin:0 16px 20px;border-radius:14px"></div><div class="skel skel-card" style="height:420px;margin:0 16px;border-radius:26px"></div></div>`;

  // ── Fetch réel ─────────────────────────────────────────────
  // get_my_achievements = MÊME source que la salle des trophées → les 2
  // trophées qui restent ici sont EXACTEMENT dans le même état débloqué/pas.
  // get_items_catalog + le module collection.js (le paquet, importé
  // dynamiquement pour ne pas alourdir CE chunk pour le moniteur/gérant qui
  // ne le verront jamais) sont chargés dans le même lot.
  const [
    [profileRes, valRes, achRes, selfValRes, itemsRes, deckRes],
    streakData,
  ] = await Promise.all([
    Promise.allSettled([
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
      sb.rpc("get_my_achievements"),
      // Validation autonome (élève solo, valider-seul.js) : table séparée de
      // `validations`, fusionnée en lecture pour que le paquet et la carte
      // « prochaine » élève solo ne restent pas figés à 0/31.
      sb
        .from("self_validations")
        .select("competence_id, validated_at")
        .eq("eleve_id", me.id),
      // Lecture seule (même RPC que boutique.js) : juste un APERÇU de la
      // vitrine ici, l'achat/l'équipement complet reste sur #/boutique.
      sb.rpc("get_items_catalog"),
      import("@/pages/eleve/collection.js"),
    ]),
    getStreak(),
  ]);

  _reportQueryErrors(
    "carte élève",
    [
      ["profil", profileRes],
      ["validations", valRes],
      ["trophées", achRes],
      ["auto-validations", selfValRes],
      ["boutique", itemsRes],
    ],
    "Certaines données du profil sont indisponibles.",
  );
  const profile = _queryData(profileRes);
  const valData = _queryData(valRes);
  const selfValData = _queryData(selfValRes);
  const achData = _queryData(achRes);
  const catalogData = _queryData(itemsRes) || [];
  // Le paquet est un import dynamique (pas un appel Supabase) : géré à part.
  const deck = deckRes.status === "fulfilled" ? deckRes.value : null;
  if (deckRes.status === "rejected")
    console.error("[profil] chargement du paquet", deckRes.reason);

  // compId → date de déblocage (préférence à la certif élève), même logique
  // que collection.js#mount pour que « Carte X sur 31 » raconte la même
  // histoire des deux côtés.
  const unlockedMap = new Map();
  for (const s of selfValData || [])
    unlockedMap.set(s.competence_id, s.validated_at || null);
  for (const v of valData || [])
    if (!unlockedMap.has(v.competence_id))
      unlockedMap.set(v.competence_id, null);
  const validated = unlockedMap.size;
  // Série : déjà à 0 si cassée, déjà bumpée si un quiz a été fait aujourd'hui
  // (même règle que l'accueil et Réviser, cf. src/services/streak.js).
  const streak = streakData.current;
  const volants = typeof profile?.gemmes === "number" ? profile.gemmes : 0;
  // Photo de profil : même source que le header (avatar équipé de la boutique,
  // sinon la photo persistée). Repli sur les initiales si aucune image.
  const avatarUrl = getEquippedAsset("avatar") || profile?.avatar_url || null;

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

  // ── Les 2 seuls trophées : même source que la salle des trophées ──
  const achOk = Array.isArray(achData);
  const unlockedKeys = new Set((achData || []).map((u) => u.achievement_key));
  const trophies = CATALOG.filter((d) => PROFIL_TROPHIES.includes(d.key)).map(
    (def) => ({
      image: def.image,
      name: ptAch(def.key, def.title),
      need: achOk
        ? unlockedKeys.has(def.key)
        : _fallbackUnlocked(def.key, validated, streak),
    }),
  );

  // ── La prochaine carte à préparer (première non débloquée) ──
  const nextCarte = CARTES.find((c) => !unlockedMap.has(c.id)) || null;

  // ── Ma vitrine : un aperçu (6 pièces), le reste vit sur #/boutique ──
  const equippedId = getEquipped()?.avatar || null;
  const avatarItems = catalogData.filter((i) => i.type === "avatar");
  const tileRank = (it) =>
    equippedId && it.id === equippedId ? 0 : it.owned ? 1 : 2;
  const previewItems = [...avatarItems]
    .sort((a, b) => tileRank(a) - tileRank(b) || a.cost_gemmes - b.cost_gemmes)
    .slice(0, 6);

  // ── État initial du paquet (même règle que collection.js#mount : on ouvre
  // sur la première carte non débloquée, la « à viser », sinon la 1ère). ──
  let deckState = null;
  if (deck) {
    const firstLocked = CARTES.findIndex((c) => !unlockedMap.has(c.id));
    deckState = {
      cur: firstLocked >= 0 ? firstLocked : 0,
      unlocked: unlockedMap,
      seen: deck.loadSeen(),
      reveal: null,
    };
  }

  // ── Render ─────────────────────────────────────────────────
  root.innerHTML = `${STYLE_ARENE}${deck ? `<style>${deck.CARD_DECK_STYLE}</style>` : ""}
<div class="arn anim-slide-up"${profileDir()}>

  <!-- Identité : 44px, un tap sur la photo ou le nom suffit. Pas de bouton
       Réglages ici : le bandeau global (header-top.js) en a déjà un, tout en
       haut de CHAQUE page — l'empiler ici aurait remis du bruit qu'on vient
       de retirer. « Réglages » reste accessible en bas de page. -->
  <div class="arn2-top">
    <button class="arn2-av" id="arn2-avatar-btn" type="button" aria-label="${ptA("photo_edit", "Changer ma photo")}">
      ${avatarUrl ? `<img src="${escAttr(avatarUrl)}" alt="" referrerpolicy="no-referrer" />` : `<span class="ini">${esc(initials)}</span>`}
    </button>
    <button class="arn2-name" id="arn2-pseudo-btn" type="button" aria-label="${ptA("pseudo_edit_aria", "Changer de pseudo")}">
      <b id="arn2-pseudo-lbl">${pseudo ? `<i>@</i>${esc(pseudo)}` : esc(ptR("pseudo_ph", "ton_pseudo"))}</b>
      <small>${esc(legalName)}</small>
    </button>
  </div>

  <!-- LE héros : le paquet, mécanique partagée avec #/cartes (jamais dupliquée) -->
  <div class="arn2-cards-hd">
    <h1 class="arn2-cards-ttl">Mes cartes</h1>
  </div>
  ${
    deck
      ? `
  <div class="col-stage" id="col-stage">
    <div class="col-hint-l">${icon("check", { size: 14 })} Suivante</div>
    <div class="col-hint-r">Précédente ${icon("chevron-right", { size: 14 })}</div>
  </div>
  <div class="col-ctrls">
    <button class="col-arrow" id="col-prev" aria-label="Carte précédente">${icon("chevron-left", { size: 22 })}</button>
    <div class="col-counter" id="col-counter"></div>
    <button class="col-arrow" id="col-next" aria-label="Carte suivante">${icon("chevron-right", { size: 22 })}</button>
  </div>
  <p class="col-swipe-tip" id="col-tip"></p>`
      : `<div style="margin:16px 20px 0;padding:22px;border-radius:20px;background:var(--csu);color:var(--tx-mu);font:600 13px/1.5 'Archivo',sans-serif;text-align:center">Tes cartes ne se chargent pas. Vérifie ta connexion puis réessaie.</div>`
  }

  <!-- Prochaine carte + les 2 trophées de conduite, une seule bande -->
  <div class="arn2-strip">
    ${
      nextCarte
        ? `
    <div class="arn2-strip-a">
      <span class="arn2-strip-img">
        <img src="${esc(nextCarte.img)}" alt="" loading="lazy" />
        <i>${icon("lock", { size: 16 })}</i>
      </span>
      <div class="arn2-strip-b">
        <div class="arn2-strip-k">Prochaine carte</div>
        <div class="arn2-strip-n">${esc(nextCarte.n)}</div>
      </div>
      <a class="arn2-strip-go" href="#/revision-conduite/${escAttr(nextCarte.id)}">Préparer</a>
    </div>`
        : ""
    }
    <div class="arn2-strip-b2">
      ${trophies
        .map(
          (t) =>
            `<span class="arn2-medal${t.need ? "" : " locked"}"><img src="${t.image}" alt="" loading="lazy" /></span>`,
        )
        .join("")}
      <div class="arn2-strip-t">${trophies.length} trophée${trophies.length > 1 ? "s" : ""} de conduite<small>Prêt examen blanc à 28 cartes · Route ouverte à 31</small></div>
    </div>
  </div>

  <!-- Ma vitrine : un aperçu lisible, l'achat complet vit sur #/boutique -->
  <div class="arn2-sec">
    <div class="arn2-sec-hd">
      <h2 class="arn2-sec-ttl">Ma vitrine</h2>
      <span class="arn2-wallet">${volantImg(18)}${volants}</span>
    </div>
    <p class="arn2-sec-sub">Ta photo de profil dans toute l'app.</p>
    ${
      previewItems.length
        ? `
    <div class="arn2-grid">
      ${previewItems.map((it) => _vitrineTile(it, equippedId, volants)).join("")}
    </div>
    <a class="arn2-linkall" href="#/boutique">Voir les ${avatarItems.length} skins</a>`
        : `<a class="arn2-linkall" href="#/boutique">Découvrir la boutique</a>`
    }
  </div>

  <a class="arn2-linkrow" href="#/notifications">
    <span class="lbl">${pt("row_notifs", "Mes notifications")}</span>
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>

  <div class="arn2-foot">
    <a class="arn2-f-set" href="#/settings">${icon("settings", { size: 16 })} ${pt("settings", "Réglages")}</a>
    <button class="arn2-f-out" id="arn-logout" type="button">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 12H4m0 0l4-4m-4 4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 3h8a2 2 0 012 2v14a2 2 0 01-2 2H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      ${pt("logout", "Se déconnecter")}
    </button>
  </div>
  <button class="arn2-del" id="arn-del" type="button">${pt("delete_account", "Supprimer mon compte")}</button>

  <!-- modale changer de pseudo -->
  <div class="arn-modal-scrim" id="arn-modal" role="dialog" aria-modal="true" aria-label="${ptA("pseudo_edit_aria", "Changer de pseudo")}">
    <div class="arn-modal">
      <div class="arn-modal-head">
        <h3>${pt("modal_title", "Choisis ton nom de joueur")}</h3>
        <button class="arn-modal-close" id="arn-modal-close" aria-label="${ptA("modal_close", "Fermer")}">✕</button>
      </div>
      <div class="arn-modal-body">
        <p class="arn-modal-tip">${pt("modal_tip", "C'est le nom que voient les autres élèves au classement de l'arène.")}</p>
        <div class="arn-field" id="arn-field">
          <span class="at">@</span>
          <input id="arn-input" type="text" maxlength="16" autocomplete="off" spellcheck="false" placeholder="speedy_lea" value="${escAttr(pseudo)}" />
        </div>
        <div class="arn-rules">
          <small id="arn-rule">${pt("pseudo_rule", "3 à 16 caractères : lettres, chiffres ou _")}</small>
          <small id="arn-count">${pseudo.length} / 16</small>
        </div>
        <button class="arn-modal-save" id="arn-save">${pt("modal_save", "Valider mon nom")}</button>
      </div>
    </div>
  </div>
</div>`;

  // ── Le paquet : mécanique 100% partagée avec #/cartes (buildDeck/
  // wireControls/enableTilt viennent tels quels de collection.js) ──
  if (deck && deckState) {
    deck.buildDeck(root, deckState);
    deck.wireControls(root, deckState);
    deck.enableTilt(root);
  }

  _wireEleveArene(root, me, avatarUrl);
}

// Une tuile de la vitrine (aperçu lecture seule — l'achat/l'équipement
// complet vivent sur #/boutique, on ne duplique pas ce flux ici). États
// évidents façon Duolingo : équipé (vert plein) · possédé (vert sourdine) ·
// achetable (or) · verrouillé (gris + prix). Un tap va sur la boutique.
function _vitrineTile(it, equippedId, volants) {
  const isEquipped = it.owned && equippedId === it.id;
  const isOwned = it.owned && !isEquipped;
  const canAfford = volants >= (it.cost_gemmes || 0);
  const name = itemName(it.id, it.name, getLang());
  let tag;
  if (isEquipped) {
    tag = `<div class="arn2-tag eq">${icon("check", { size: 14 })}${pt("equipped_short", "Équipé")}</div>`;
  } else if (isOwned) {
    tag = `<div class="arn2-tag own">${pt("owned_lab", "Possédé")}</div>`;
  } else if (canAfford) {
    tag = `<div class="arn2-tag buy">${volantImg(15)}${it.cost_gemmes}</div>`;
  } else {
    tag = `<div class="arn2-tag lock">${icon("lock", { size: 14 })}${it.cost_gemmes}</div>`;
  }
  return `<a class="arn2-tile${it.owned ? "" : " is-locked"}" href="#/boutique">
    <div class="arn2-tile-plate">${it.asset_url ? `<img src="${escAttr(it.asset_url)}" alt="" loading="lazy" />` : ""}</div>
    <p class="arn2-tile-n">${esc(name)}</p>
    ${tag}
  </a>`;
}

function _wireEleveArene(root, me, avatarUrl) {
  // ── Changer ma photo (avatars au choix + ma photo) — tap sur la vignette
  // de la barre d'identité (44px), même geste qu'une appli de rencontre. ──
  root
    .querySelector("#arn2-avatar-btn")
    ?.addEventListener("click", async () => {
      haptic("select");
      const url = await changeAvatar({
        me,
        currentUrl: avatarUrl || getEquippedAsset("avatar") || me.avatar_url,
      });
      if (!url) return;
      me.avatar_url = url;
      const btn = root.querySelector("#arn2-avatar-btn");
      if (btn)
        btn.innerHTML = `<img src="${escAttr(url)}" alt="" referrerpolicy="no-referrer" />`;
      haptic("success");
      track("profile.avatar_updated", { user_role: me.role });
      const { toast } = await import("@/components/common/toast.js");
      toast(ptR("toast_photo", "Photo mise à jour ✓"), "success", 2500);
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
      toast(
        ptR("toast_logout_err", "Déconnexion impossible. Réessaie"),
        "error",
      );
    }
  });

  // ── Supprimer (bottom-sheet RGPD réutilisé) ──
  root.querySelector("#arn-del")?.addEventListener("click", () => {
    haptic("warning");
    track("profile.delete_intent", { user_role: me.role });
    _openDeleteSheet(root, me);
  });

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

  root.querySelector("#arn2-pseudo-btn")?.addEventListener("click", openModal);
  root.querySelector("#arn-modal-close")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  if (_areneEscHandler)
    document.removeEventListener("keydown", _areneEscHandler);
  _areneEscHandler = (e) => {
    if (e.key === "Escape") closeModal();
  };
  document.addEventListener("keydown", _areneEscHandler);

  input?.addEventListener("input", () => {
    const v = input.value.trim();
    if (count) count.textContent = `${v.length} / 16`;
    field?.classList.remove("bad");
    if (rule) {
      rule.textContent = ptR(
        "pseudo_rule",
        "3 à 16 caractères : lettres, chiffres ou _",
      );
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
        showErr(
          ptR("pseudo_rule", "3 à 16 caractères : lettres, chiffres ou _"),
        );
        return;
      }
      if (_isBlocked(raw)) {
        showErr(ptR("pseudo_not_allowed", "Ce pseudo n'est pas autorisé."));
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
        if (error.code === "23505")
          showErr(ptR("pseudo_taken_err", "Ce pseudo est déjà pris."));
        else showErr(ptR("pseudo_save_err", "Impossible d'enregistrer."));
        toast(
          error.code === "23505"
            ? ptR("toast_pseudo_taken", "Ce pseudo est déjà pris")
            : ptR(
                "toast_pseudo_save_err",
                "Impossible d'enregistrer le pseudo",
              ),
          "error",
        );
      } else {
        haptic("success");
        track("pseudo.updated", { has_pseudo: value !== null });
        toast(
          value
            ? ptR("toast_pseudo_saved", "Pseudo enregistré")
            : ptR("toast_pseudo_removed", "Pseudo retiré"),
          "success",
        );
        // Met à jour la barre d'identité sans recharger
        const ps = root.querySelector("#arn2-pseudo-lbl");
        if (ps) {
          ps.innerHTML = value
            ? `<i>@</i>${esc(value)}`
            : esc(ptR("pseudo_ph", "ton_pseudo"));
        }
        closeModal();
      }
    } catch (e) {
      console.error("[profil] pseudo", e);
      const { toast } = await import("@/components/common/toast.js");
      toast(ptR("toast_conn_err", "Erreur de connexion"), "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = ptR("modal_save", "Valider mon nom");
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// PROFIL MONITEUR — « Blason pro » (INDIGO PREMIUM CLAIR)
// Même énergie « carte premium » que l'élève, mais univers PRO :
//   • identité = VRAI NOM (pas de pseudo, pas de modale)
//   • métrique reine = validations cette année (preuve & autorité)
//   • « prochain défi » remplacé par MA POSITION (classement réel)
//   • OR = prestige uniquement (rang, trophées) ; l'indigo domine
//   • fond CLAIR, cartes blanches premium (univers moniteur)
// ═══════════════════════════════════════════════════════════════
function _ensInitials(prenom, nom) {
  return (
    ((prenom || "")[0] || "") + ((nom || "")[0] || "") || "?"
  ).toUpperCase();
}
// Retrait de la gamification moniteur (30/07/2026) : `_rankLabel()` (rang
// mensuel) et `_ensAchievements()` (les 10 trophées, tous conditionnés à des
// validations, une série ou un rang) vivaient ici. `_ensInitials` est gardée :
// elle sert encore à l'avatar de repli.

const STYLE_ENS = `<style>
.enp{
  --ind:#4f46e5; --ind-dk:#3a32c4; --ind-lt:#6d6bff; --ind-pale:#eef0ff; --vio:#8b5cf6;
  --gd:#f7b32b; --gd-hi:#ffd27a; --gd-dp:#bd7a08; --gd-deep:#b5610a; --gd-pale:#ffe6a8; --gd-ink:#5a3a08;
  --grn:#18a558; --grn-dk:#0f7a3e; --grn-rim:#3fd17a;
  --c:#fff; --c-soft:#fbfbff;
  --enk:#1c1b3a; --enk2:#3a3a5c; --enmu:#6f6e92; --enfa:#6e6d91;
  --enl:#eceaf6; --enl2:#e3e1f2;
  --oni:#fff; --oni-dim:#d9d8ff; --oni-mu:#b6b4f0;
  max-width:480px; min-height:100dvh; position:relative;
  /* Fond pleine hauteur sous le header verre (pattern livret) */
  margin:calc(-1 * (var(--th, 52px) + env(safe-area-inset-top,0px))) auto 0;
  padding-top:calc(var(--th, 52px) + env(safe-area-inset-top,0px) + 4px);
  padding-bottom:calc(var(--bh, 64px) + env(safe-area-inset-bottom,0px) + 28px);
  color:var(--enk); font-family:'Archivo',system-ui,sans-serif;
  background:
    radial-gradient(120% 30% at 50% 0%, rgba(79,70,229,.10), transparent 62%),
    linear-gradient(180deg,#f7f8ff 0%,var(--bg, #f4f5fb) 22%);
}
.enp-h1{font-family:'Archivo',sans-serif;font-weight:600;font-size:21px;margin:0;padding:2px 22px 0;color:var(--enk)}

/* ── Carte héros (blason pro indigo) ── */
.enp-hero{position:relative;overflow:hidden;color:var(--oni);margin:14px 16px 0;border-radius:30px;padding:20px 20px 22px;
  background:
    radial-gradient(120% 80% at 85% -10%, rgba(139,92,246,.55), transparent 58%),
    radial-gradient(90% 70% at 8% 110%, rgba(58,50,196,.6), transparent 60%),
    linear-gradient(155deg,#5b52ff 0%,#4f46e5 42%,#5b3fd6 74%,#3a32c4 100%);
  box-shadow:0 22px 44px rgba(60,46,180,.40),0 8px 16px rgba(60,46,180,.26),inset 0 1.5px 0 rgba(255,255,255,.30),inset 0 0 0 1.5px rgba(255,255,255,.10)}
.enp-hero::before{content:"";position:absolute;right:-50px;top:-60px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle,rgba(255,210,122,.30),transparent 66%);pointer-events:none}
.enp-hero::after{content:"";position:absolute;top:-40%;left:-10%;width:60%;height:120%;background:linear-gradient(120deg,rgba(255,255,255,.16),transparent 60%);transform:rotate(6deg);pointer-events:none}
.enp-rank{position:relative;z-index:1;display:inline-flex;align-items:center;gap:9px;padding:7px 13px 7px 9px;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.06));border:1px solid rgba(255,226,168,.45);box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}
.enp-rank img{width:24px;height:24px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}
.enp-rank .rt{font-size:12px;font-weight:800;color:#fff}
.enp-rank .rt b{color:var(--gd-hi)}
.enp-id{position:relative;z-index:1;display:flex;align-items:center;gap:15px;margin-top:16px}
.enp-crest{position:relative;flex:0 0 auto;width:74px;height:74px}
.enp-crest-disc{position:absolute;inset:0;border-radius:22px;padding:3px;background:linear-gradient(155deg,#8b7bff,#4f46e5 60%,#3a32c4);box-shadow:0 10px 22px rgba(20,14,80,.45)}
.enp-crest-disc::after{content:"";position:absolute;inset:-2px;border-radius:24px;border:2px solid transparent;background:linear-gradient(150deg,var(--gd-hi),var(--gd-deep)) border-box;-webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.enp-crest-inner{width:100%;height:100%;border-radius:19px;display:grid;place-items:center;position:relative;overflow:hidden;background:linear-gradient(160deg,#6a5cf0,#3f37c7);font-family:'Archivo',sans-serif;font-weight:600;font-size:28px;color:#fff;letter-spacing:1px;text-shadow:0 2px 5px rgba(0,0,0,.4);box-shadow:inset 0 3px 9px rgba(0,0,0,.28)}
.enp-crest-inner::before{content:"";position:absolute;top:-30%;left:-20%;width:80%;height:90%;background:linear-gradient(120deg,rgba(255,255,255,.30),transparent 60%);transform:rotate(8deg)}
.enp-crest-inner img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
.enp-crest-edit{position:absolute;right:-5px;bottom:-5px;width:29px;height:29px;border:2.5px solid #4f46e5;border-radius:50%;cursor:pointer;display:grid;place-items:center;color:var(--ind);background:#fff;box-shadow:0 3px 8px rgba(20,14,80,.30);transition:transform .08s}
.enp-crest-edit:active{transform:translateY(2px)}
.enp-crest-edit svg{width:14px;height:14px}
.enp-nm{min-width:0}
.enp-nm .nn{font-family:'Archivo',sans-serif;font-weight:600;font-size:25px;line-height:1.05;color:#fff;letter-spacing:.2px;text-shadow:0 1px 2px rgba(20,14,70,.3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.enp-nm .tg{display:inline-flex;align-items:center;gap:6px;margin-top:7px;padding:4px 11px;border-radius:999px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);color:#fff;font-size:11px;font-weight:800;letter-spacing:.7px;text-transform:uppercase}
.enp-nm .tg .dot{width:7px;height:7px;border-radius:50%;background:var(--grn-rim);box-shadow:0 0 7px var(--grn-rim)}
.enp-metric{position:relative;z-index:1;margin-top:18px;display:flex;align-items:center;gap:16px;padding:16px 18px;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.22)}
.enp-metric .em-emb{width:46px;height:46px;flex:0 0 auto;border-radius:13px;display:grid;place-items:center;background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 1px rgba(255,226,168,.4)}
.enp-metric .em-emb img{width:34px;height:34px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}
.enp-metric .em-num{font-family:'Archivo',sans-serif;font-weight:700;font-size:42px;color:#fff;line-height:1;text-shadow:0 2px 4px rgba(20,14,70,.3)}
.enp-metric .em-lab{margin-left:auto;text-align:right}
.enp-metric .em-lab .l1{font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--gd-hi)}
.enp-metric .em-lab .l2{font-size:11.5px;font-weight:700;color:var(--oni-dim);margin-top:3px}
.enp-sub{position:relative;z-index:1;margin-top:13px;display:flex;align-items:center;gap:9px;font-size:13px;font-weight:700;color:var(--oni-dim)}
.enp-sub svg{width:17px;height:17px;color:#fff;flex:0 0 auto}
.enp-sub b{color:#fff;font-weight:800}

/* ── Stats (cartes claires) ── */
.enp-stats{display:flex;gap:11px;margin:18px 16px 0}
.enp-stat{flex:1;border-radius:20px;padding:16px 8px 14px;text-align:center;background:var(--c);box-shadow:0 8px 18px rgba(60,50,160,.08),inset 0 0 0 1px var(--enl)}
.enp-s-ico{height:30px;margin:0 auto 8px;display:block}
.enp-s-num{font-family:'Archivo',sans-serif;font-weight:700;font-size:23px;color:var(--enk);line-height:1}
.enp-s-num.gd{color:var(--gd-dp)}
.enp-s-lab{font-size:10.5px;font-weight:700;color:var(--enmu);margin-top:5px}

/* ── Succès ── */
.enp-ach{margin:26px 0 0}
.enp-ach-head{display:flex;align-items:baseline;justify-content:space-between;margin:0 22px 12px}
.enp-ach-title{font-family:'Archivo',sans-serif;font-weight:600;font-size:17px;color:var(--enk)}
.enp-ach-count{font-size:11.5px;font-weight:800;color:var(--ind)}
.enp-ach-scroll{display:flex;gap:13px;overflow-x:auto;padding:4px 18px 16px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.enp-ach-scroll::-webkit-scrollbar{height:0}
.enp-a{flex:0 0 auto;width:96px;scroll-snap-align:start;text-align:center}
.enp-medal{position:relative;width:96px;height:96px;border-radius:22px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(180deg,#fff,#f5f5ff);box-shadow:0 8px 18px rgba(60,50,160,.10),inset 0 0 0 1px var(--enl2)}
.enp-medal img{width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(60,50,160,.20));position:relative;z-index:1}
.enp-medal::before{content:"";position:absolute;width:66px;height:66px;border-radius:50%;background:radial-gradient(circle,rgba(79,70,229,.16),transparent 70%)}
.enp-a.locked .enp-medal{background:linear-gradient(180deg,#f3f3f8,#eceaf3);box-shadow:0 5px 12px rgba(60,50,160,.06),inset 0 0 0 1px var(--enl)}
.enp-a.locked .enp-medal::before{display:none}
.enp-a.locked .enp-medal img{filter:grayscale(1) brightness(1.05) contrast(.85);opacity:.4}
.enp-alock{position:absolute;z-index:2;width:26px;height:26px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 2px 5px rgba(60,50,160,.18),inset 0 0 0 1px var(--enl2)}
.enp-alock svg{width:18px;height:18px}
.enp-a-name{font-size:10.5px;font-weight:700;color:var(--enk2);margin-top:9px;line-height:1.25}
.enp-a.locked .enp-a-name{color:var(--enfa)}

/* ── Ma position ── */
.enp-rankcard{margin:26px 16px 0;border-radius:24px;padding:18px 18px 16px;background:var(--c);box-shadow:0 12px 28px rgba(60,50,160,.10),inset 0 0 0 1px var(--enl);position:relative;overflow:hidden}
.enp-rh{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.enp-rh-l{display:flex;align-items:center;gap:9px}
.enp-rh-badge{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;flex:0 0 auto;background:linear-gradient(160deg,#fff0cf,#ffe0a0);box-shadow:inset 0 0 0 1px rgba(247,179,43,.4)}
.enp-rh-badge img{width:24px;height:24px;object-fit:contain}
.enp-rh-tt{font-family:'Archivo',sans-serif;font-weight:600;font-size:16px;color:var(--enk)}
.enp-rh-sub{font-size:11px;font-weight:700;color:var(--enmu);margin-top:1px}
.enp-rlink{border:0;background:transparent;cursor:pointer;font-size:12.5px;font-weight:800;color:var(--ind);display:inline-flex;align-items:center;gap:4px;padding:6px 2px;font-family:inherit}
.enp-rlink svg{width:15px;height:15px}
.enp-rlist{display:flex;flex-direction:column;gap:7px}
.enp-rrow{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:15px;background:var(--c-soft);box-shadow:inset 0 0 0 1px var(--enl)}
.enp-rrow .rp{width:30px;height:30px;flex:0 0 auto;border-radius:9px;display:grid;place-items:center;font-family:'Archivo',sans-serif;font-weight:600;font-size:14px;color:var(--enmu);background:#fff;box-shadow:inset 0 0 0 1px var(--enl2)}
.enp-rrow .rav{width:34px;height:34px;flex:0 0 auto;border-radius:10px;display:grid;place-items:center;font-family:'Archivo',sans-serif;font-weight:600;font-size:13px;color:#fff;letter-spacing:.5px;background:linear-gradient(160deg,#9b95c6,#7d77ad);box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}
.enp-rrow .rnm{flex:1;font-size:14px;font-weight:700;color:var(--enk2);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.enp-rrow .rpt{font-family:'Archivo',sans-serif;font-weight:600;font-size:14px;color:var(--enmu);flex:0 0 auto}
.enp-rrow .rpt span{font-size:11px;font-weight:700;color:var(--enfa)}
.enp-rrow.me{background:linear-gradient(160deg,#5b52ff,#4f46e5);box-shadow:0 10px 22px rgba(60,46,180,.34),inset 0 1px 0 rgba(255,255,255,.28)}
.enp-rrow.me .rp{background:rgba(255,255,255,.18);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
.enp-rrow.me .rav{background:linear-gradient(160deg,#fff0cf,#ffd27a);color:var(--gd-ink);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 0 0 1.5px rgba(255,226,168,.5)}
.enp-rrow.me .rnm{color:#fff;font-weight:800}
.enp-rrow.me .rpt{color:#fff}.enp-rrow.me .rpt span{color:var(--oni-mu)}
.enp-rempty{text-align:center;color:var(--enmu);font:600 13px/1.5 'Archivo',sans-serif;padding:8px 4px}

/* ── Mon année ── */
.enp-year{margin:24px 16px 0;border-radius:24px;padding:18px 18px 16px;background:var(--c);box-shadow:0 12px 28px rgba(60,50,160,.10),inset 0 0 0 1px var(--enl)}
.enp-yh{display:flex;align-items:center;gap:9px;margin-bottom:15px}
.enp-yh-ico{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;flex:0 0 auto;color:#fff;background:linear-gradient(160deg,#6d6bff,#4f46e5);box-shadow:0 5px 12px rgba(60,46,180,.28)}
.enp-yh-ico svg{width:19px;height:19px}
.enp-yh h2{font-family:'Archivo',sans-serif;font-weight:600;font-size:16px;color:var(--enk);margin:0}
.enp-ygrid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.enp-kpi{border-radius:16px;padding:14px;background:var(--c-soft);box-shadow:inset 0 0 0 1px var(--enl)}
.enp-kpi .kn{font-family:'Archivo',sans-serif;font-weight:700;font-size:27px;color:var(--ind);line-height:1}
.enp-kpi .kn.gd{color:var(--gd-dp)}.enp-kpi .kn.gr{color:var(--grn)}
.enp-kpi .kl{font-size:11.5px;font-weight:700;color:var(--enmu);margin-top:6px;line-height:1.25}

/* ── Réglages ── */
.enp-set{margin:28px 16px 0}
.enp-set-title{font-size:11px;font-weight:800;color:var(--enfa);letter-spacing:2px;text-transform:uppercase;margin:0 6px 11px}
.enp-set-list{border-radius:22px;overflow:hidden;background:var(--c);box-shadow:0 10px 24px rgba(60,50,160,.08),inset 0 0 0 1px var(--enl)}
.enp-row{display:flex;align-items:center;gap:14px;padding:16px 17px;border-bottom:1px solid var(--enl);width:100%;background:none;border-left:0;border-right:0;border-top:0;text-align:left;cursor:pointer;font-family:inherit;color:inherit;text-decoration:none}
.enp-row:last-child{border-bottom:0}
.enp-row-ico{width:30px;height:30px;flex:0 0 auto;display:grid;place-items:center}
.enp-row-ico svg{width:30px;height:30px}
.enp-row-lab{flex:1;font-size:15px;font-weight:700;color:var(--enk)}
.enp-row-lab small{display:block;font-size:11.5px;font-weight:600;color:var(--enmu);margin-top:2px}
.enp-chev{color:var(--enfa)}.enp-chev svg{width:18px;height:18px}
.enp-tog{width:52px;height:30px;border-radius:999px;border:0;cursor:pointer;position:relative;flex:0 0 auto;background:#e1e0ee;box-shadow:inset 0 1px 3px rgba(60,50,120,.18);transition:background .2s}
.enp-tog.on{background:linear-gradient(180deg,#6d6bff,#4f46e5);box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}
.enp-tog .knob{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(40,35,90,.3);transition:transform .2s}
.enp-tog.on .knob{transform:translateX(22px)}
.enp-logout{margin:18px 16px 0;width:calc(100% - 32px);border:0;cursor:pointer;font-family:'Archivo',sans-serif;font-weight:600;font-size:15.5px;color:#d92d52;padding:15px;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 6px 16px rgba(217,45,82,.10),inset 0 0 0 1px rgba(217,45,82,.16);transition:transform .08s,box-shadow .08s}
.enp-logout:active{transform:translateY(2px)}
.enp-logout svg{width:18px;height:18px}
.enp-since{text-align:center;margin:18px 0 4px;font-size:11px;font-weight:700;color:var(--enfa);letter-spacing:.6px;text-transform:uppercase}
</style>`;

async function mountEnseignantArene(root, me) {
  root.innerHTML = `${STYLE_ENS}<div class="enp"${profileDir()}><div class="skel skel-card" style="height:300px;margin:14px 16px 0;border-radius:30px"></div><div class="skel skel-card" style="height:90px;margin:18px 16px 0;border-radius:20px"></div></div>`;

  const yearStart = `${new Date().getFullYear()}-01-01`;

  // Retrait de la gamification moniteur (30/07/2026) : plus de classement
  // mensuel (get_moniteur_ranking) ni de série de validations (streak_pro_days).
  const [profileRes, validationsRes, elevesRes] = await Promise.all([
    sb
      .from("profiles")
      .select("email, prenom, nom, created_at, avatar_url")
      .eq("id", me.id)
      .single(),
    sb
      .from("validations")
      .select("competence_id, eleve_id, validated_at")
      .eq("validated_by", me.id)
      .gte("validated_at", yearStart),
    sb
      .from("profiles")
      .select("id, last_active_at")
      .eq("role", "eleve")
      .eq("enseignant_id", me.id)
      .is("deleted_at", null),
  ]);
  _reportQueryErrors(
    "carte enseignant",
    [
      ["profil", profileRes],
      ["validations", validationsRes],
      ["élèves", elevesRes],
    ],
    "Certaines données du profil sont indisponibles.",
  );
  const profile = _queryData(profileRes);
  const valData = _queryData(validationsRes);
  const elevesData = _queryData(elevesRes);

  // ── Stats Mon Année ───────────────────────────────────────
  const vals = valData || [];
  const elevesIds = new Set((elevesData || []).map((e) => e.id));
  for (const v of vals) elevesIds.add(v.eleve_id);
  const elevesCount = elevesIds.size;
  const totalValidations = vals.length;
  const c3Count = vals.filter((v) => v.competence_id?.startsWith("C3")).length;
  // « Élèves actifs » sur l'activité RÉELLE des élèves (last_active_at) et non
  // plus déduit des validations du moniteur, qui n'en produit plus.
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
  const elevesActifsCount = (elevesData || []).filter(
    (e) => (e.last_active_at || "") >= since30d,
  ).length;

  // ── Identité ──────────────────────────────────────────────
  const name =
    `${profile?.prenom || ""} ${profile?.nom || ""}`.trim() ||
    profile?.email ||
    me.email ||
    ptR("instructor_default", "Enseignant");
  const initials = _ensInitials(profile?.prenom, profile?.nom);
  // Photo de profil : même source que le header. Repli initiales si absente.
  const avatarUrl = getEquippedAsset("avatar") || profile?.avatar_url || null;
  const year = new Date().getFullYear();

  let memberSince = "";
  if (profile?.created_at) {
    const d = new Date(profile.created_at);
    if (!isNaN(d))
      memberSince = d.toLocaleDateString(
        { fr: "fr-FR", en: "en-GB", ar: "ar" }[getLang()] || "fr-FR",
        {
          month: "long",
          year: "numeric",
        },
      );
  }

  const [validationsLabel, thisYearLabel] = ptR(
    "validations_this_year",
    "Validations|cette année",
  ).split("|");

  const notifSupported = "Notification" in window;
  const notifDenied = notifSupported && Notification.permission === "denied";
  const notifOn = notifSupported && isPushEnabled();

  // ── Render ────────────────────────────────────────────────
  root.innerHTML = `${STYLE_ENS}
<div class="enp anim-slide-up"${profileDir()}>
  <h1 class="enp-h1">${pt("h1_title", "Mon profil")}</h1>

  <div class="enp-hero">
    <!-- Retrait de la gamification moniteur (30/07/2026) : le bandeau de rang
         mensuel (« #3 ce mois-ci · 120 pts ») vivait ici. -->
    <div class="enp-id">
      <div class="enp-crest">
        <div class="enp-crest-disc"><div class="enp-crest-inner">${avatarUrl ? `<img src="${escAttr(avatarUrl)}" alt="" referrerpolicy="no-referrer" />` : esc(initials)}</div></div>
        <button class="enp-crest-edit" id="enp-edit-avatar" aria-label="${ptA("photo_edit", "Changer ma photo")}" title="${ptA("photo_edit", "Changer ma photo")}">${icon("image", { size: 14, strokeWidth: 2.2 })}</button>
      </div>
      <div class="enp-nm">
        <div class="nn">${esc(name)}</div>
        <span class="tg"><span class="dot"></span>${pt("role_instructor", "Enseignant")}</span>
      </div>
    </div>
    <div class="enp-metric">
      <span class="em-emb"><img src="/skins/trophy-permis-virtuel.webp" alt="" /></span>
      <div class="em-num">${totalValidations}</div>
      <div class="em-lab"><div class="l1">${esc(validationsLabel)}</div><div class="l2">${esc(thisYearLabel)}</div></div>
    </div>
    <div class="enp-sub">
      <svg viewBox="0 0 24 24" fill="none"><path d="M16 19v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="7" r="3.2" stroke="currentColor" stroke-width="2"/><path d="M22 19v-2a4 4 0 00-3-3.9M16 3.1A4 4 0 0116 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <span>${pt("students_activity", `${elevesCount} élève${elevesCount > 1 ? "s" : ""} suivi${elevesCount > 1 ? "s" : ""} · ${elevesActifsCount} actif${elevesActifsCount > 1 ? "s" : ""} sur 30 jours`, { students: elevesCount, active: elevesActifsCount })}</span>
    </div>
  </div>

  <div class="enp-stats">
    <div class="enp-stat">
      <svg class="enp-s-ico" viewBox="0 0 24 24" fill="none" style="width:30px"><path d="M16 19v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 17.5V19" stroke="#4f46e5" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="7.5" r="3" stroke="#4f46e5" stroke-width="2"/><path d="M19 8l1.6 1.6L23 6.6" stroke="#18a558" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="enp-s-num">${elevesCount}</div>
      <div class="enp-s-lab">${pt("students_supported", "Élèves suivis")}</div>
    </div>
    <div class="enp-stat">
      ${medallion("etoile", "gold", { size: 30, cls: "enp-s-ico" })}
      <div class="enp-s-num gd">${c3Count}</div>
      <div class="enp-s-lab">${pt("c3_reached", "C3 Maîtrise")}</div>
    </div>
  </div>

  <!-- Retrait de la gamification moniteur (30/07/2026, décision Rayan) : les
       blocs « Mes succès » (10 trophées sur validations / série / rang) et
       « Ma position · Classement du mois » vivaient ici. Tous mesuraient une
       action que le moniteur ne peut plus faire. -->

  <div class="enp-year">
    <div class="enp-yh">
      <span class="enp-yh-ico"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
      <h2>${pt("my_year", "Mon année {year}", { year })}</h2>
    </div>
    <div class="enp-ygrid">
      <div class="enp-kpi"><div class="kn">${totalValidations}</div><div class="kl">${pt("skills_validated", "Compétences validées")}</div></div>
      <div class="enp-kpi"><div class="kn">${elevesCount}</div><div class="kl">${pt("students_supported", "Élèves suivis")}</div></div>
      <div class="enp-kpi"><div class="kn gd">${c3Count}</div><div class="kl">${pt("c3_reached", "C3 Maîtrise atteints")}</div></div>
      <div class="enp-kpi"><div class="kn gr">${elevesActifsCount}</div><div class="kl">${pt("active_students", "Élèves actifs (30 j)")}</div></div>
    </div>
  </div>

  <div class="enp-set">
    <p class="enp-set-title">${pt("settings", "Réglages")}</p>
    <div class="enp-set-list">
      <a class="enp-row" href="#/notifications">
        <span class="enp-row-ico">${medallion("message", "blue", { size: 30, shape: "tile" })}</span>
        <span class="enp-row-lab">${pt("row_notifs", "Mes notifications")}<small>${pt("teacher_notif_sub", "Validations · séances · messages")}</small></span>
        <span class="enp-chev"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </a>
      ${
        notifSupported
          ? `
      <button class="enp-row" id="enp-notif" type="button" aria-pressed="${notifOn}">
        <span class="enp-row-ico">${medallion("cloche", "orange", { size: 30, shape: "tile" })}</span>
        <span class="enp-row-lab">${pt("notifications", "Notifications")}<small id="enp-notif-sub">${notifDenied ? pt("notif_blocked", "Bloquées par le navigateur") : notifOn ? pt("validations_followups", "Validations & relances") : pt("notif_off", "Désactivées")}</small></span>
        ${notifDenied ? "" : `<span class="enp-tog ${notifOn ? "on" : ""}" id="enp-notif-tog"><span class="knob"></span></span>`}
      </button>`
          : ""
      }
      <a class="enp-row" href="#/settings">
        <span class="enp-row-ico">${medallion("reglages", "slate", { size: 30, shape: "tile" })}</span>
        <span class="enp-row-lab">${pt("account_settings", "Réglages du compte")}<small>${pt("theme_subscription_security", "Thème · abonnement · sécurité")}</small></span>
        <span class="enp-chev"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </a>
    </div>
  </div>

  <button class="enp-logout" id="enp-logout">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 12H4m0 0l4-4m-4 4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 3h8a2 2 0 012 2v14a2 2 0 01-2 2H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    ${pt("logout", "Se déconnecter")}
  </button>

  <div class="enp-since">${memberSince ? `${pt("member_since", "Membre depuis")} ${esc(memberSince)}` : ""}</div>
</div>`;

  // ── Wire ──────────────────────────────────────────────────
  root.querySelector("#enp-logout")?.addEventListener("click", async () => {
    haptic("tap");
    track("auth.logout", { user_role: me.role });
    try {
      await logout();
    } catch (e) {
      console.error("[profil] logout", e);
      const { toast } = await import("@/components/common/toast.js");
      toast(
        ptR("toast_logout_err", "Déconnexion impossible. Réessaie"),
        "error",
      );
    }
  });

  // ── Changer ma photo (avatars au choix + ma photo) ──
  root
    .querySelector("#enp-edit-avatar")
    ?.addEventListener("click", async () => {
      haptic("select");
      const url = await changeAvatar({
        me,
        currentUrl: avatarUrl || getEquippedAsset("avatar") || me.avatar_url,
      });
      if (!url) return;
      me.avatar_url = url;
      const inner = root.querySelector(".enp-crest-inner");
      if (inner)
        inner.innerHTML = `<img src="${escAttr(url)}" alt="" referrerpolicy="no-referrer" />`;
      haptic("success");
      track("profile.avatar_updated", { user_role: me.role });
      const { toast } = await import("@/components/common/toast.js");
      toast(ptR("toast_photo", "Photo mise à jour ✓"), "success", 2500);
    });

  const notifRow = root.querySelector("#enp-notif");
  if (notifRow && !notifDenied) {
    notifRow.addEventListener("click", async () => {
      haptic("tap");
      const tog = root.querySelector("#enp-notif-tog");
      const sub = root.querySelector("#enp-notif-sub");
      if (isPushEnabled()) {
        await optOutPush();
        tog?.classList.remove("on");
        notifRow.setAttribute("aria-pressed", "false");
        if (sub) sub.textContent = ptR("notif_off", "Désactivées");
      } else {
        const ok = await optInPush();
        if (ok) {
          haptic("success");
          tog?.classList.add("on");
          notifRow.setAttribute("aria-pressed", "true");
          if (sub)
            sub.textContent = ptR(
              "validations_followups",
              "Validations & relances",
            );
        } else if (Notification.permission === "denied") {
          if (sub)
            sub.textContent = ptR(
              "notif_blocked",
              "Bloquées par le navigateur",
            );
          tog?.remove();
        }
      }
    });
  }
}
