// ═══════════════════════════════════════════════════════════════
// Enseignant — Mes avatars
// Sélection d'avatar professionnel. Déblocage par palier (pas de
// monnaie virtuelle — vision V3 antipattern #2).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import {
  equipItem,
  setEquippedAsset,
  getEquipped,
} from "@/utils/game-state.js";
import { getMoniteurState } from "@/data/moniteur-levels.js";

// ─── Avatars — déblocage par palier (tier = seuil MONITEUR_TIERS) ────────
// tier 0 = dispo dès le départ. tier N = palier N requis (validations ≥ threshold).
const AVATARS = [
  {
    id: "avatar-default-01",
    name: "Classique",
    asset: "/skins/avatar-default-01.png",
    tier: 0,
    unlock: "Disponible dès le départ",
  },
  {
    id: "avatar-default-02",
    name: "Moderne",
    asset: "/skins/avatar-default-02.png",
    tier: 0,
    unlock: "Disponible dès le départ",
  },
  {
    id: "avatar-default-03",
    name: "Professionnel",
    asset: "/skins/avatar-default-03-.png",
    tier: 2,
    unlock: "Enseignant confirmé (8 validations)",
  },
  {
    id: "avatar-default-04",
    name: "Expert",
    asset: "/skins/avatar-default-04-.png",
    tier: 4,
    unlock: "Enseignant chevronné (30 validations)",
  },
  {
    id: "avatar-default-05",
    name: "Senior",
    asset: "/skins/avatar-default-05-v2.png",
    tier: 7,
    unlock: "Enseignant Senior (120 validations)",
  },
  {
    id: "avatar-default-06",
    name: "Référent REMC",
    asset: "/skins/avatar-default-06.png",
    tier: 9,
    unlock: "Expert REMC certifié (230 validations)",
  },
];

// ─── CSS ────────────────────────────────────────────────────────
const STYLE = `<style>
.smo {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 0 100px;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--ink);
}
.smo-hd {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px 16px;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
  position: sticky;
  top: 0;
  z-index: 10;
}
.smo-back {
  width: 44px; height: 44px; border-radius: 10px;
  border: 1px solid rgba(99,102,241,.15); background: var(--su);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--ink); flex-shrink: 0;
  transition: background .15s, border-color .15s;
  -webkit-tap-highlight-color: transparent;
}
.smo-back:hover { background: rgba(99,102,241,.06); border-color: rgba(99,102,241,.3); }
.smo-back:active { background: var(--bg2); }
.smo-back:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
.smo-hd-info { flex: 1; }
.smo-title { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.025em; }
.smo-sub { font: 500 12px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }

/* Tier banner */
.smo-tier-banner {
  margin: 16px 16px 0;
  padding: 14px 16px;
  background: var(--su);
  border: 1px solid rgba(99,102,241,.12);
  border-radius: 14px;
  display: flex; align-items: center; gap: 12px;
}
.smo-tier-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.12));
  border: 1px solid rgba(99,102,241,.2);
  display: flex; align-items: center; justify-content: center;
  color: #6366f1; flex-shrink: 0;
}
.smo-tier-label { font: 600 11px/1 'Inter', sans-serif; color: var(--mu2); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 4px; }
.smo-tier-name { font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.01em; }

/* Grid */
.smo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
}
@media (min-width: 400px) {
  .smo-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Card */
.smo-card {
  position: relative;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 16px;
  padding: 14px 12px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: border-color .15s, transform .15s;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
  min-height: 140px;
}
.smo-card:hover { border-color: rgba(99,102,241,.3); transform: translateY(-1px); }
.smo-card:active { transform: scale(.97); }
.smo-card:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
.smo-card.equipped {
  border-color: #6366f1;
  background: rgba(99,102,241,.04);
  box-shadow: 0 0 0 3px rgba(99,102,241,.1);
}
.smo-card.locked {
  opacity: .55;
  cursor: default;
  pointer-events: none;
}
.smo-card.locked:hover { transform: none; }

/* Équipé badge */
.smo-equipped-badge {
  position: absolute;
  top: 8px; right: 8px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #6366f1;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}

/* Avatar image */
.smo-avatar-wrap {
  width: 64px; height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg2);
  flex-shrink: 0;
  border: 2px solid transparent;
  transition: border-color .15s;
}
.smo-card.equipped .smo-avatar-wrap { border-color: #6366f1; }
.smo-avatar-img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.smo-avatar-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  background: linear-gradient(135deg, rgba(99,102,241,.1), rgba(139,92,246,.1));
}

/* Card info */
.smo-card-name {
  font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  text-align: center;
  letter-spacing: -.01em;
}
.smo-card-status {
  font: 500 11px/1.3 'Inter', sans-serif;
  color: var(--mu2);
  text-align: center;
}
.smo-card.equipped .smo-card-status {
  color: #6366f1;
  font-weight: 600;
}

/* Lock overlay */
.smo-lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(var(--bg-rgb, 255,255,255), .6);
  backdrop-filter: blur(2px);
  border-radius: 14px;
  padding: 12px;
}
.smo-lock-icon { color: var(--mu2); opacity: .7; }
.smo-lock-txt {
  font: 500 10px/1.3 'Inter', sans-serif;
  color: var(--mu2);
  text-align: center;
}

/* Skel */
.smo-skel {
  background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
  background-size: 200% 100%;
  animation: smo-shimmer 1.4s ease-in-out infinite;
  border-radius: 16px;
}
@keyframes smo-shimmer { from{background-position:200% 0} to{background-position:-200% 0} }
</style>`;

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== "enseignant") return;

  track("page_view", { page: "shop_moniteur" });

  // Skeleton
  root.innerHTML = `${STYLE}
<div class="smo anim-slide-up">
  <div class="smo-hd">
    <button class="smo-back" id="smo-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
    <div class="smo-hd-info">
      <div class="smo-title">Mes avatars</div>
      <div class="smo-sub">Chargement…</div>
    </div>
  </div>
  <div class="smo-grid">
    ${Array.from({ length: 6 })
      .map(() => `<div class="smo-skel" style="height:140px"></div>`)
      .join("")}
  </div>
</div>`;

  root
    .querySelector("#smo-back")
    ?.addEventListener("click", () => navigate("#/parcours"));

  try {
    const [profileRes, countRes] = await Promise.all([
      sb
        .from("profiles")
        .select("prenom, avatar_preset, avatar_url")
        .eq("id", me.id)
        .maybeSingle(),
      sb
        .from("validations")
        .select("id", { count: "exact", head: true })
        .eq("validated_by", me.id),
    ]);

    const profile = profileRes.data || {};
    const totalVals = countRes.count ?? 0;
    const state = getMoniteurState(totalVals);
    const currentTierNum = state.tier?.tier ?? 0;

    // L'avatar actif = avatar_preset en DB, sinon localStorage, sinon fallback
    const equipped =
      profile.avatar_preset || getEquipped()["avatar"] || AVATARS[0].id;

    _render(root, { state, currentTierNum, equipped, totalVals });
  } catch (err) {
    console.error("[shop-moniteur]", err);
    toast("Impossible de charger les avatars", "error");
  }
}

// ─── Render ──────────────────────────────────────────────────────
function _render(root, { state, currentTierNum, equipped }) {
  const tierTitle = state.tier?.title ?? "Enseignant — Démarrage";

  root.innerHTML = `${STYLE}
<div class="smo anim-slide-up">
  <div class="smo-hd">
    <button class="smo-back" id="smo-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
    <div class="smo-hd-info">
      <div class="smo-title">Mes avatars</div>
      <div class="smo-sub">Sélectionne ton avatar professionnel</div>
    </div>
  </div>

  <div class="smo-tier-banner">
    <div class="smo-tier-icon">${icon("award", { size: 18, strokeWidth: 2 })}</div>
    <div>
      <div class="smo-tier-label">Palier actuel</div>
      <div class="smo-tier-name">${esc(tierTitle)}</div>
    </div>
  </div>

  <div class="smo-grid" id="smo-grid">
    ${AVATARS.map((av) => _renderCard(av, currentTierNum, equipped)).join("")}
  </div>
</div>`;

  root
    .querySelector("#smo-back")
    ?.addEventListener("click", () => navigate("#/parcours"));

  // Wire equip buttons
  root.querySelectorAll(".smo-card[data-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const av = AVATARS.find((a) => a.id === id);
      if (
        !av ||
        card.classList.contains("locked") ||
        card.classList.contains("equipped")
      )
        return;
      _equip(root, av, currentTierNum);
    });
  });
}

function _renderCard(av, currentTierNum, equipped) {
  const isEquipped = equipped === av.id;
  const isUnlocked = av.tier <= currentTierNum;

  const equippedBadge = isEquipped
    ? `<div class="smo-equipped-badge" aria-label="Équipé">${icon("check", { size: 11, strokeWidth: 3 })}</div>`
    : "";

  const img = `
    <div class="smo-avatar-wrap">
      <img class="smo-avatar-img" src="${esc(av.asset)}" alt="${esc(av.name)}"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="smo-avatar-fallback" style="display:none">👤</div>
    </div>`;

  const statusTxt = isEquipped
    ? "Équipé"
    : isUnlocked
      ? "Équiper"
      : "Verrouillé";

  const lockOverlay = !isUnlocked
    ? `<div class="smo-lock-overlay" aria-hidden="true">
        <span class="smo-lock-icon">${icon("lock", { size: 16, strokeWidth: 2 })}</span>
        <span class="smo-lock-txt">${esc(av.unlock)}</span>
      </div>`
    : "";

  return `<div
    class="smo-card${isEquipped ? " equipped" : ""}${!isUnlocked ? " locked" : ""}"
    data-id="${esc(av.id)}"
    role="button"
    tabindex="${isUnlocked && !isEquipped ? "0" : "-1"}"
    aria-label="${esc(av.name)}${isEquipped ? " — équipé" : ""}"
    aria-pressed="${isEquipped ? "true" : "false"}"
  >
    ${equippedBadge}
    ${img}
    <div class="smo-card-name">${esc(av.name)}</div>
    <div class="smo-card-status">${esc(statusTxt)}</div>
    ${lockOverlay}
  </div>`;
}

async function _equip(root, av, currentTierNum) {
  // Mise à jour UI optimiste
  root.querySelectorAll(".smo-card[data-id]").forEach((c) => {
    const wasEquipped = c.dataset.id === av.id;
    c.classList.toggle("equipped", wasEquipped);
    c.setAttribute("aria-pressed", wasEquipped ? "true" : "false");
    const statusEl = c.querySelector(".smo-card-status");
    if (statusEl) {
      if (wasEquipped) statusEl.textContent = "Équipé";
      else if (!c.classList.contains("locked"))
        statusEl.textContent = "Équiper";
    }
    // Badge check
    let badge = c.querySelector(".smo-equipped-badge");
    if (wasEquipped && !badge) {
      badge = document.createElement("div");
      badge.className = "smo-equipped-badge";
      badge.setAttribute("aria-label", "Équipé");
      badge.innerHTML = icon("check", { size: 11, strokeWidth: 3 });
      c.prepend(badge);
    } else if (!wasEquipped && badge) {
      badge.remove();
    }
  });

  // Persist local
  equipItem("avatar", av.id);
  setEquippedAsset("avatar", av.asset);

  // Sync DB
  try {
    const me = getCurUser();
    const { error } = await sb
      .from("profiles")
      .update({ avatar_preset: av.id, avatar_url: av.asset })
      .eq("id", me.id);
    if (error) throw error;
    toast("Avatar mis à jour", "success");
    track("avatar.equipped", { avatar_id: av.id });
  } catch (err) {
    console.error("[shop-moniteur] equip sync", err);
    toast("Changement local — synchronisation échouée", "error");
  }
}
