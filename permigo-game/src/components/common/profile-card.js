// ═══════════════════════════════════════════════════════════════
// Profile Card — héros d'identité role-native (refonte 2026-06-25)
//
// Avant : carte « sociale » générique (bannière violet/bleu, barre XP
// arc-en-ciel, badge prestige Px, rangée WhatsApp/Insta/lien). → « trop IA »,
// ne ressemblait NI à l'accueil élève NI à l'aujourd'hui moniteur.
//
// Maintenant : un héros par rôle, raccord avec la DA déjà validée :
//  • élève     → fond vert tendre (color-mix --a), barre de progression
//                RÉELLE vers le permis (X/31), 3 stats, theme-aware.
//  • moniteur  → dégradé indigo confiant (#4f46e5→#8b5cf6), halo doré,
//                3 stats en verre dépoli.
// On garde : avatar + bannière éditables (Supabase Storage), Partager natif.
// On retire : prestige, XP arc-en-ciel, triple bouton social (filler).
// ═══════════════════════════════════════════════════════════════
import { esc, escAttr } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { sb } from "@/auth/auth.js";
import { haptic } from "@/utils/haptic.js";
import {
  openAvatarPicker,
  AVATAR_PICKER_UPLOAD,
} from "@/components/common/avatar-picker.js";

const STYLE = `<style>
.pcc { width: 100%; padding: 0 16px; }

/* ── Coquille commune ── */
.pcc-card {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  isolation: isolate;
}

/* ════════════ VARIANTE ÉLÈVE — vert tendre, premium clair ════════════ */
.pcc-card.is-eleve {
  background: linear-gradient(155deg,
    color-mix(in srgb, var(--a) 14%, var(--su)) 0%,
    color-mix(in srgb, var(--a) 6%, var(--su)) 52%,
    var(--su) 100%);
  border: 1px solid color-mix(in srgb, var(--a) 22%, var(--su));
  box-shadow:
    0 16px 40px -18px color-mix(in srgb, var(--a) 32%, transparent),
    0 1px 0 rgba(255,255,255,.6) inset;
  padding: 18px 18px 16px;
}
.pcc-card.is-eleve .pcc-halo {
  position: absolute; right: -30px; top: -40px;
  width: 180px; height: 180px; border-radius: 50%;
  background: radial-gradient(circle,
    color-mix(in srgb, var(--a-lt) 50%, transparent),
    color-mix(in srgb, var(--a) 16%, transparent) 50%, transparent 72%);
  filter: blur(8px); z-index: 0; pointer-events: none;
}

/* ════════════ VARIANTE MONITEUR — indigo confiant ════════════ */
.pcc-card.is-ens {
  background: linear-gradient(150deg, #4f46e5, #625ee8 58%, #7750db);
  box-shadow: 0 18px 44px -16px rgba(79,70,229,.6);
  padding: 18px 18px 16px;
  --pcc-fg: #fff;
  --pcc-fg-mu: #d8d5ff;
}
.pcc-card.is-ens .pcc-halo {
  position: absolute; right: -24px; top: -34px;
  width: 168px; height: 168px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,210,120,.55), transparent 64%);
  filter: blur(6px); z-index: 0; pointer-events: none;
}

/* ── Bannière (optionnelle, en fond du héros) ── */
.pcc-banner {
  position: absolute; inset: 0; z-index: 0; overflow: hidden;
}
.pcc-banner img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pcc-banner::after {
  content: ''; position: absolute; inset: 0;
}
.pcc-card.is-eleve .pcc-banner::after {
  background: linear-gradient(160deg,
    color-mix(in srgb, var(--su) 78%, transparent),
    color-mix(in srgb, var(--su) 92%, transparent));
}
.pcc-card.is-ens .pcc-banner::after {
  background: linear-gradient(150deg, rgba(79,70,229,.82), rgba(139,92,246,.82));
}

/* ── Rangée du haut : avatar + identité ── */
.pcc-top {
  position: relative; z-index: 2;
  display: flex; align-items: center; gap: 14px;
}
.pcc-av-wrap { position: relative; flex-shrink: 0; width: 72px; height: 72px; }
.pcc-av {
  width: 100%; height: 100%; border-radius: 50%;
  border: 3px solid var(--su);
  background: linear-gradient(135deg, var(--a), var(--adk));
  overflow: hidden; display: flex; align-items: center; justify-content: center;
  font: 800 26px/1 'Plus Jakarta Sans', sans-serif; color: var(--a-ink);
  box-shadow: 0 6px 18px rgba(10,13,26,.18);
}
.pcc-card.is-ens .pcc-av { border-color: rgba(255,255,255,.92); }
.pcc-av img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pcc-av-edit {
  position: absolute; bottom: -2px; right: -2px;
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--a); color: var(--a-ink);
  border: 2.5px solid var(--su);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(10,13,26,.22);
  transition: transform .15s ease;
}
.pcc-card.is-ens .pcc-av-edit { border-color: #fff; background: #fff; color: var(--adk); }
.pcc-av-edit::after { content: ''; position: absolute; inset: -8px; }
.pcc-av-edit:active { transform: scale(.9); }

.pcc-id { flex: 1; min-width: 0; }
.pcc-name {
  font: 700 21px/1.15 'Fredoka', 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.01em;
  color: var(--pcc-fg, var(--ink));
  margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pcc-bio {
  font: 600 13px/1.4 'Plus Jakarta Sans', sans-serif;
  color: var(--pcc-fg-mu, var(--mu));
  margin: 3px 0 0;
}

/* ── Bouton partager (coin haut-droit) ── */
.pcc-share {
  position: absolute; top: 0; right: 0; z-index: 3;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 12px; border-radius: 999px; border: 0; cursor: pointer;
  font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
  transition: transform .15s ease;
}
.pcc-card.is-eleve .pcc-share {
  background: color-mix(in srgb, var(--a) 12%, var(--su));
  color: var(--a-txt);
  border: 1px solid color-mix(in srgb, var(--a) 22%, transparent);
}
.pcc-card.is-ens .pcc-share {
  background: rgba(255,255,255,.18);
  color: #fff;
  border: 1px solid rgba(255,255,255,.32);
}
.pcc-share:active { transform: scale(.94); }
.pcc-share svg { width: 14px; height: 14px; }

/* ── Barre de progression permis (élève) ── */
.pcc-prog { position: relative; z-index: 2; margin-top: 16px; }
.pcc-prog-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 7px;
}
.pcc-prog-lbl {
  font: 700 12px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink2);
}
.pcc-prog-val {
  font: 800 12px/1 'Plus Jakarta Sans', sans-serif; color: var(--a-txt);
}
.pcc-prog-track {
  height: 9px; border-radius: 999px;
  background: color-mix(in srgb, var(--a) 12%, var(--su2, #f1f3fa));
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(10,13,26,.06) inset;
}
.pcc-prog-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--a-lt), var(--a));
  box-shadow: 0 0 10px color-mix(in srgb, var(--a) 45%, transparent);
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}

/* ── Strip de 3 stats ── */
.pcc-stats {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: repeat(3, 1fr);
  margin-top: 16px;
}
.pcc-card.is-eleve .pcc-stats {
  border-top: 1px solid color-mix(in srgb, var(--a) 16%, var(--bo));
  padding-top: 14px;
}
.pcc-card.is-ens .pcc-stats {
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 16px;
  padding: 12px 0;
}
.pcc-stat { text-align: center; padding: 0 6px; }
.pcc-stat + .pcc-stat { border-left: 1px solid; }
.pcc-card.is-eleve .pcc-stat + .pcc-stat { border-color: color-mix(in srgb, var(--a) 14%, var(--bo)); }
.pcc-card.is-ens .pcc-stat + .pcc-stat { border-color: rgba(255,255,255,.2); }
.pcc-stat-val {
  font: 800 23px/1 'Fredoka', 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.01em;
  color: var(--pcc-fg, var(--ink));
  margin-bottom: 4px;
}
.pcc-stat-lbl {
  font: 600 11px/1.1 'Plus Jakarta Sans', sans-serif;
  color: var(--pcc-fg-mu, var(--mu2));
}

.pcc-file-input { display: none; }

@media (prefers-reduced-motion: reduce) {
  .pcc-prog-fill, .pcc-share, .pcc-av-edit { transition: none !important; }
}
</style>`;

/**
 * Render le héros d'identité role-native.
 * @param {Object} opts
 * @param {Object} opts.me        user {id, prenom, nom, role}
 * @param {string} opts.avatarUrl URL avatar (ou null → initiales)
 * @param {string} opts.bannerUrl URL bannière de fond (ou null)
 * @param {{label:string,value:number|string}[]} opts.stats 3 stats
 * @param {string} opts.bio       sous-titre court (ex: « Apprenti permis B »)
 * @param {{pct:number,current:number,total:number,label:string}} [opts.progress]
 *        barre de progression RÉELLE (élève uniquement)
 */
function renderProfileCard({
  me,
  avatarUrl,
  bannerUrl,
  stats = [],
  bio = "",
  progress = null,
}) {
  const role = me.role || "eleve";
  const variant = role === "enseignant" ? "is-ens" : "is-eleve";
  const initials = ((me.prenom || "")[0] || "") + ((me.nom || "")[0] || "");
  const displayName = `${me.prenom || ""} ${me.nom || ""}`.trim() || "Élève";

  const stats3 = stats.slice(0, 3);
  while (stats3.length < 3) stats3.push({ label: "—", value: 0 });

  const avatarInner = avatarUrl
    ? `<img src="${escAttr(avatarUrl)}" alt="${escAttr(displayName)}" />`
    : esc((initials || "?").toUpperCase());

  return `${STYLE}
<div class="pcc">
  <div class="pcc-card ${variant}">
    ${bannerUrl ? `<div class="pcc-banner"><img src="${escAttr(bannerUrl)}" alt="" /></div>` : `<div class="pcc-halo" aria-hidden="true"></div>`}

    <button class="pcc-share" data-action="share" aria-label="Partager mon profil">
      ${icon("share", { size: 14, strokeWidth: 2.2 })} Partager
    </button>

    <div class="pcc-top">
      <div class="pcc-av-wrap">
        <div class="pcc-av">${avatarInner}</div>
        <button class="pcc-av-edit" data-action="edit-avatar" aria-label="Modifier la photo" title="Modifier la photo">${icon("edit", { size: 12, strokeWidth: 2.4 })}</button>
      </div>
      <div class="pcc-id">
        <h2 class="pcc-name">${esc(displayName)}</h2>
        ${bio ? `<p class="pcc-bio">${esc(bio)}</p>` : ""}
      </div>
    </div>

    ${
      progress
        ? `
    <div class="pcc-prog">
      <div class="pcc-prog-head">
        <span class="pcc-prog-lbl">Mon permis</span>
        <span class="pcc-prog-val">${esc(progress.label)}</span>
      </div>
      <div class="pcc-prog-track">
        <div class="pcc-prog-fill" style="width:${Math.max(3, Math.min(100, progress.pct))}%"></div>
      </div>
    </div>`
        : ""
    }

    <div class="pcc-stats">
      ${stats3
        .map(
          (s) => `
        <div class="pcc-stat">
          <div class="pcc-stat-val" data-target="${escAttr(String(s.value))}">0</div>
          <div class="pcc-stat-lbl">${esc(s.label)}</div>
        </div>`,
        )
        .join("")}
    </div>

    <input type="file" class="pcc-file-input" accept="image/*" data-target="avatar" />
    <input type="file" class="pcc-file-input" accept="image/*" data-target="banner" />
  </div>
</div>`;
}

/**
 * Anime les compteurs de 0 vers leur valeur cible.
 */
function animateStats(root) {
  if (matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    root.querySelectorAll("[data-target]").forEach((el) => {
      el.textContent = formatNum(parseFloat(el.dataset.target));
    });
    return;
  }
  const duration = 1100;
  const start = performance.now();
  const items = [...root.querySelectorAll("[data-target]")].map((el) => ({
    el,
    target: parseFloat(el.dataset.target) || 0,
  }));
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    items.forEach((it) => {
      it.el.textContent = formatNum(Math.round(it.target * eased));
    });
    if (t < 1) requestAnimationFrame(frame);
    else
      items.forEach((it) => {
        it.el.textContent = formatNum(it.target);
      });
  }
  requestAnimationFrame(frame);
}

function formatNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

/**
 * Upload une image dans le bucket user-media et update profiles.{column}_url
 */
async function uploadAndSet(userId, file, kind /* 'avatar' | 'banner' */) {
  if (!file) return null;
  if (file.size > 5 * 1024 * 1024) {
    const { toast } = await import("@/components/common/toast.js");
    toast("Image trop grosse (max 5 MB)", "error");
    return null;
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;

  const { error } = await sb.storage.from("user-media").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    const { toast } = await import("@/components/common/toast.js");
    toast("Échec upload : " + (error.message || ""), "error");
    return null;
  }
  const { data } = sb.storage.from("user-media").getPublicUrl(path);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) return null;

  const column = kind === "avatar" ? "avatar_url" : "banner_url";
  const { error: errUpd } = await sb
    .from("profiles")
    .update({ [column]: publicUrl })
    .eq("id", userId);
  if (errUpd) {
    const { toast } = await import("@/components/common/toast.js");
    toast("URL non persistée — réessaie", "error");
    return null;
  }
  return publicUrl;
}

// Helper : enveloppe un handler async pour capturer les rejets
async function safeRun(fn, label = "handler") {
  try {
    await fn();
  } catch (e) {
    console.error(`[profile-card] ${label} failed`, e);
    const { toast } = await import("@/components/common/toast.js");
    toast("Action impossible — réessaie", "error");
  }
}

/**
 * Mount + branche tous les listeners (édit photo, édit bannière, partage).
 */
export function mountProfileCard(container, opts) {
  const { me, shareUrl, shareText, avatarUrl } = opts;
  container.innerHTML = renderProfileCard(opts);
  const card = container.querySelector(".pcc");
  if (!card) return;

  setTimeout(() => animateStats(card), 180);

  // Edit avatar — ouvre d'abord le picker (6 défauts + option « Ma photo »)
  const avInput = card.querySelector('.pcc-file-input[data-target="avatar"]');
  card
    .querySelector('[data-action="edit-avatar"]')
    ?.addEventListener("click", async () => {
      haptic("select");
      try {
        const choice = await openAvatarPicker({
          currentUrl: avatarUrl ?? me.avatar_url ?? null,
        });
        if (!choice) return; // annulé
        if (choice === AVATAR_PICKER_UPLOAD) {
          avInput.click();
          return;
        }
        await safeRun(async () => {
          const { error } = await sb
            .from("profiles")
            .update({ avatar_url: choice })
            .eq("id", me.id);
          if (error) throw error;
          const avEl = card.querySelector(".pcc-av");
          avEl.innerHTML = `<img src="${escAttr(choice)}" alt="" />`;
          haptic("success");
          const { toast } = await import("@/components/common/toast.js");
          toast("Avatar mis à jour ✓", "success", 2500);
        }, "avatar default pick");
      } catch (e) {
        console.warn("[profile-card] avatar picker failed", e);
      }
    });
  avInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    safeRun(async () => {
      const url = await uploadAndSet(me.id, file, "avatar");
      if (url) {
        const avEl = card.querySelector(".pcc-av");
        avEl.innerHTML = `<img src="${escAttr(url)}" alt="" />`;
        haptic("success");
        const { toast } = await import("@/components/common/toast.js");
        toast("Photo mise à jour ✓", "success", 2500);
      }
    }, "avatar upload").finally(() => {
      avInput.value = "";
    });
  });

  // Edit banner — déclenché par appui long / via le picker ? On garde le
  // file input câblé (utilisé par la bannière de fond). Pour le déclencher,
  // un double-tap sur le héros ouvre le sélecteur de bannière.
  const bnInput = card.querySelector('.pcc-file-input[data-target="banner"]');
  card.querySelector(".pcc-card")?.addEventListener("dblclick", () => {
    haptic("select");
    bnInput?.click();
  });
  bnInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    safeRun(async () => {
      const url = await uploadAndSet(me.id, file, "banner");
      if (url) {
        const cardEl = card.querySelector(".pcc-card");
        let bnEl = cardEl.querySelector(".pcc-banner");
        if (!bnEl) {
          cardEl.insertAdjacentHTML(
            "afterbegin",
            `<div class="pcc-banner"><img src="${escAttr(url)}" alt="" /></div>`,
          );
          cardEl.querySelector(".pcc-halo")?.remove();
        } else {
          const img = bnEl.querySelector("img");
          if (img) img.src = url;
          else bnEl.innerHTML = `<img src="${escAttr(url)}" alt="" />`;
        }
        haptic("success");
        const { toast } = await import("@/components/common/toast.js");
        toast("Bannière mise à jour ✓", "success", 2500);
      }
    }, "banner upload").finally(() => {
      bnInput.value = "";
    });
  });

  // Share natif
  const shareData = {
    title: "PermiGo",
    text: shareText || "Suis ma progression sur PermiGo",
    url: shareUrl || window.location.origin,
  };
  card
    .querySelector('[data-action="share"]')
    ?.addEventListener("click", async () => {
      haptic("select");
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          /* annulé */
        }
      } else {
        await copyLink(shareData.url);
      }
    });
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    const { toast } = await import("@/components/common/toast.js");
    toast("Lien copié ✓", "success", 2000);
  } catch {
    const { toast } = await import("@/components/common/toast.js");
    toast("Impossible de copier", "error");
  }
}
