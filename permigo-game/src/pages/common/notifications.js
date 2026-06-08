// ═══════════════════════════════════════════════════════════════
// Notifications — groupées par jour, pull-to-refresh, swipe-to-delete
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { emptyState } from "@/components/common/empty-state.js";

// ─── Deep-link resolver ───────────────────────────────────────
function notifRoute(n) {
  const d = n.data || {};
  switch (n.type) {
    case "session_confirmation":
    case "session_logged":
      return d.session_id ? `#/sessions/${d.session_id}` : "#/";
    case "new_message":
      return d.thread_id ? `#/messages/${d.thread_id}` : "#/messages";
    case "achievement_unlocked":
      return "#/trophees";
    case "streak_at_risk":
    case "post_validation_quiz":
    case "consolidation_quiz":
      return "#/parcours";
    case "session_confirmed":
    case "session_refused":
      return "#/";
    default:
      return "#/";
  }
}

// ─── Icon map ────────────────────────────────────────────────
const TYPE_META = {
  xp: { iconName: "zap", bg: "color-mix(in srgb, var(--a) 12%, transparent)", color: "var(--a)" },
  trophy: {
    iconName: "trophy",
    bg: "rgba(245,158,11,.12)",
    color: "var(--am)",
  },
  achievement_unlocked: {
    iconName: "trophy",
    bg: "rgba(245,158,11,.12)",
    color: "var(--am)",
  },
  validation: {
    iconName: "check-circle",
    bg: "rgba(16,185,129,.12)",
    color: "var(--gr)",
  },
  session_confirmation: {
    iconName: "check-circle",
    bg: "color-mix(in srgb, var(--a) 12%, transparent)",
    color: "var(--a)",
  },
  session_logged: {
    iconName: "check-circle",
    bg: "color-mix(in srgb, var(--a) 12%, transparent)",
    color: "var(--a)",
  },
  session_confirmed: {
    iconName: "check",
    bg: "rgba(16,185,129,.12)",
    color: "var(--gr)",
  },
  session_refused: {
    iconName: "x-circle",
    bg: "rgba(239,68,68,.12)",
    color: "var(--rd)",
  },
  streak_at_risk: {
    iconName: "flame",
    bg: "rgba(239,68,68,.12)",
    color: "var(--rd)",
  },
  streak: { iconName: "flame", bg: "rgba(239,68,68,.12)", color: "var(--rd)" },
  consolidation_quiz: {
    iconName: "target",
    bg: "rgba(139,92,246,.12)",
    color: "var(--pu)",
  },
  post_validation_quiz: {
    iconName: "target",
    bg: "rgba(139,92,246,.12)",
    color: "var(--pu)",
  },
  new_message: {
    iconName: "message-circle",
    bg: "rgba(14,165,233,.12)",
    color: "var(--bl)",
  },
  reminder: {
    iconName: "bell",
    bg: "rgba(14,165,233,.12)",
    color: "var(--bl)",
  },
  info: { iconName: "bell", bg: "rgba(100,116,139,.12)", color: "var(--mu3)" },
};
function typeMeta(t) {
  return TYPE_META[t] || TYPE_META.info;
}

// ─── Grouping ─────────────────────────────────────────────────
function groupByDay(notifs) {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;
  const groups = { today: [], yesterday: [], week: [], older: [] };
  for (const n of notifs) {
    const day = new Date(
      new Date(n.created_at).getFullYear(),
      new Date(n.created_at).getMonth(),
      new Date(n.created_at).getDate(),
    ).getTime();
    if (day >= today) groups.today.push(n);
    else if (day >= yesterday) groups.yesterday.push(n);
    else if (day >= weekAgo) groups.week.push(n);
    else groups.older.push(n);
  }
  return groups;
}

function fmtTime(iso) {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
.nf2 {
  max-width: 480px; margin: 0 auto;
  background: var(--bg); min-height: 100dvh;
  padding-bottom: 80px; font-family: 'Inter', sans-serif;
}

/* ── Header ── */
.nf2-hd {
  position: sticky; top: calc(52px + env(safe-area-inset-top, 0px)); z-index: 20;
  background: var(--su); border-bottom: 1px solid var(--bo);
  padding: 10px 16px; display: flex; align-items: center; gap: 10px;
}
.nf2-back {
  width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--bo);
  background: var(--su); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--ink); padding: 0; font-family: inherit;
  transition: background .12s;
}
.nf2-back:active { background: var(--bg); }
.nf2-title { font: 800 16px/1.2 'Plus Jakarta Sans', sans-serif; letter-spacing: -.02em; color: var(--ink); flex: 1; }
.nf2-unread-badge {
  font: 700 11px/1 'IBM Plex Mono', monospace;
  color: var(--a); background: color-mix(in srgb, var(--a) 10%, transparent);
  border-radius: 99px; padding: 4px 8px; flex-shrink: 0;
}
.nf2-mark-all {
  font: 700 12px/1 'Inter', sans-serif; color: var(--a);
  background: none; border: none; cursor: pointer; padding: 8px 4px;
  border-radius: 6px; transition: background .12s; font-family: inherit;
}
.nf2-mark-all:hover { background: color-mix(in srgb, var(--a) 8%, transparent); }
.nf2-mark-all:disabled { color: var(--mu2); cursor: default; }
.nf2-mark-all:disabled:hover { background: none; }

/* ── Pull to refresh indicator ── */
.nf2-ptr {
  height: 0; overflow: hidden; display: flex; align-items: center; justify-content: center;
  transition: height .2s ease;
  font: 600 12px/1 'Inter', sans-serif; color: var(--mu); gap: 8px;
}
.nf2-ptr.visible { height: 48px; }
.nf2-ptr-ico {
  width: 20px; height: 20px; border: 2px solid var(--bo); border-top-color: var(--a);
  border-radius: 50%; animation: nf2Spin .7s linear infinite;
}
@keyframes nf2Spin { to { transform: rotate(360deg); } }

/* ── Group label ── */
.nf2-group-label {
  padding: 16px 16px 6px;
  font: 700 11px/1 'Inter', sans-serif; letter-spacing: .05em;
  text-transform: uppercase; color: var(--mu2);
  position: sticky; top: calc(52px + env(safe-area-inset-top,0px) + 58px); z-index: 5;
  background: var(--bg);
}

/* ── List ── */
.nf2-list { background: var(--su); border-top: 1px solid var(--bo); border-bottom: 1px solid var(--bo); }

/* ── Item (swipe container) ── */
.nf2-item-wrap {
  position: relative; overflow: hidden;
  border-bottom: 1px solid var(--bo2);
}
.nf2-item-wrap:last-child { border-bottom: 0; }

/* Delete reveal */
.nf2-delete-bg {
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 72px; background: var(--rd);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font: 600 11px/1 'Inter', sans-serif; gap: 4px;
  flex-direction: column;
  border-radius: 0;
}

/* Item row */
.nf2-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 13px 16px; cursor: pointer;
  transition: transform .25s cubic-bezier(.32,.72,0,1), background .1s;
  position: relative; background: var(--su);
  -webkit-tap-highlight-color: transparent;
  user-select: none; touch-action: pan-y;
}
.nf2-item:active { background: var(--bg); }
.nf2-item.unread { background: linear-gradient(90deg, color-mix(in srgb, var(--a) 6%, transparent) 0%, var(--su) 40%); }
.nf2-item.unread:active { background: linear-gradient(90deg, color-mix(in srgb, var(--a) 10%, transparent) 0%, var(--bg) 60%); }
.nf2-item-ico {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; flex-shrink: 0; margin-top: 1px;
}
.nf2-item-body { flex: 1; min-width: 0; }
.nf2-item-title {
  font: 700 13.5px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); letter-spacing: -.005em;
  display: flex; align-items: center; gap: 6px;
}
.nf2-item-title::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: var(--a); flex-shrink: 0; opacity: 0; transition: opacity .15s;
}
.nf2-item.unread .nf2-item-title::before { opacity: 1; }
.nf2-item-desc { font: 500 12px/1.45 'Inter', sans-serif; color: var(--mu); margin-top: 3px; }
.nf2-item-time { font: 700 10.5px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 5px; }

/* ── Empty ── */
.nf2-empty {
  padding: 56px 24px; text-align: center;
}
.nf2-empty-ico { font-size: 52px; margin-bottom: 14px; }
.nf2-empty-title {
  font: 800 18px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); letter-spacing: -.02em; margin-bottom: 6px;
}
.nf2-empty-sub { font: 500 13px/1.5 'Inter', sans-serif; color: var(--mu); margin-bottom: 24px; }
.nf2-empty-cta {
  display: inline-block; padding: 12px 24px;
  background: color-mix(in srgb, var(--a) 8%, transparent); border: 1.5px solid color-mix(in srgb, var(--a) 20%, transparent);
  border-radius: 12px; color: var(--a); font: 600 13px/1 'Inter', sans-serif;
  cursor: pointer; min-height: 44px; transition: background .12s;
}
.nf2-empty-cta:active { background: color-mix(in srgb, var(--a) 15%, transparent); }
</style>`;

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root, me) {
  if (!me) me = getCurUser();
  if (!me) return;

  track("page.view", { page: "notifications", role: me.role });

  root.innerHTML = `${STYLE}
<div class="nf2 anim-slide-up" id="nf2-root">
  <div class="nf2-hd">
    <button class="nf2-back" id="nf2-back" aria-label="Retour">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div class="nf2-title">Notifications</div>
    <span class="nf2-unread-badge" id="nf2-badge" style="display:none"></span>
    <button class="nf2-mark-all" id="nf2-mark-all" disabled>Tout lu</button>
  </div>
  <div class="nf2-ptr" id="nf2-ptr"><div class="nf2-ptr-ico"></div> Actualisation…</div>
  <div id="nf2-content" style="min-height:200px">
    ${skelRows(5)}
  </div>
</div>`;

  root
    .querySelector("#nf2-back")
    ?.addEventListener("click", () => navigate("/"));

  await loadNotifs(root, me);
  wirePullToRefresh(root, me);
}

// ─── Load & render ────────────────────────────────────────────
async function loadNotifs(root, me) {
  const content = root.querySelector("#nf2-content");
  if (!content) return;

  const { data, error } = await sb
    .from("notifications")
    .select("id, type, title, body, data, read, created_at")
    .eq("user_id", me.id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    toast("Impossible de charger les notifications", "error");
    content.innerHTML = `<div class="nf2-empty"><div class="nf2-empty-ico">${icon("alert-triangle", { size: 28 })}</div><div class="nf2-empty-title">Erreur de chargement</div><div class="nf2-empty-sub">Vérifie ta connexion et réessaie.</div></div>`;
    return;
  }

  const notifs = data || [];
  const unreadCount = notifs.filter((n) => !n.read).length;

  // Update badge
  const badge = root.querySelector("#nf2-badge");
  if (badge) {
    badge.style.display = unreadCount > 0 ? "" : "none";
    badge.textContent =
      unreadCount > 0
        ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
        : "";
  }

  // Update mark-all
  const markAll = root.querySelector("#nf2-mark-all");
  if (markAll) markAll.disabled = unreadCount === 0;

  if (notifs.length === 0) {
    const cta = `<button class="nf2-empty-cta" id="nf2-back-home">← Retour à l'accueil</button>`;
    content.innerHTML = emptyState({
      image: "/skins/empty-states/empty_notifications.png",
      title: "Aucune notification",
      body: "Tu es à jour ! Reviens plus tard.",
      cta,
    });
    root
      .querySelector("#nf2-back-home")
      ?.addEventListener("click", () => navigate("/"));
    return;
  }

  const groups = groupByDay(notifs);
  const groupDefs = [
    { key: "today", label: "Aujourd'hui" },
    { key: "yesterday", label: "Hier" },
    { key: "week", label: "Cette semaine" },
    { key: "older", label: "Plus ancien" },
  ];

  let html = "";
  for (const { key, label } of groupDefs) {
    if (!groups[key].length) continue;
    html += `<div class="nf2-group-label">${label}</div><div class="nf2-list">`;
    for (const n of groups[key]) {
      const m = typeMeta(n.type);
      html += `
        <div class="nf2-item-wrap" data-id="${esc(n.id)}">
          <div class="nf2-delete-bg" aria-label="Supprimer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Suppr.
          </div>
          <div class="nf2-item ${n.read ? "" : "unread"}" data-id="${esc(n.id)}" data-read="${n.read}" data-route="${esc(notifRoute(n))}">
            <div class="nf2-item-ico" style="background:${m.bg};color:${m.color}">${icon(m.iconName, { size: 18 })}</div>
            <div class="nf2-item-body">
              <div class="nf2-item-title">${esc(n.title)}</div>
              ${n.body ? `<div class="nf2-item-desc">${esc(n.body)}</div>` : ""}
              <div class="nf2-item-time">${fmtTime(n.created_at)}</div>
            </div>
          </div>
        </div>`;
    }
    html += `</div>`;
  }
  content.innerHTML = html;

  wireItems(root, me, unreadCount);
}

// ─── Wire items (read + swipe-to-delete) ─────────────────────
function wireItems(root, me, initialUnread) {
  let unreadCount = initialUnread;

  const updateBadge = () => {
    const badge = root.querySelector("#nf2-badge");
    if (badge) {
      badge.style.display = unreadCount > 0 ? "" : "none";
      badge.textContent =
        unreadCount > 0
          ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
          : "";
    }
    const markAll = root.querySelector("#nf2-mark-all");
    if (markAll) markAll.disabled = unreadCount === 0;
  };

  // Mark single as read + navigate
  root.querySelectorAll(".nf2-item").forEach((el) => {
    el.addEventListener("click", async () => {
      haptic("select");
      const id = el.dataset.id;
      const route = el.dataset.route;
      if (el.dataset.read === "false") {
        el.dataset.read = "true";
        el.classList.remove("unread");
        unreadCount = Math.max(0, unreadCount - 1);
        updateBadge();
        Promise.resolve(sb.rpc("mark_notif_read", { p_notif_id: id })).catch(
          () => {},
        );
        track("notification.read", { notif_id: id });
      }
      if (route && route !== "#/") {
        navigate(route);
      }
    });
  });

  // Mark all
  const markAllBtn = root.querySelector("#nf2-mark-all");
  if (markAllBtn) {
    markAllBtn.addEventListener("click", async () => {
      markAllBtn.disabled = true;
      markAllBtn.textContent = "…";
      const { error } = await sb.rpc("mark_all_notifs_read");
      if (error) {
        toast("Erreur de mise à jour", "error");
        markAllBtn.disabled = false;
        markAllBtn.textContent = "Tout lu";
        return;
      }
      root.querySelectorAll(".nf2-item.unread").forEach((el) => {
        el.classList.remove("unread");
        el.dataset.read = "true";
      });
      unreadCount = 0;
      updateBadge();
      markAllBtn.textContent = "Tout lu";
      toast("Toutes les notifications lues", "success", 2000);
      track("notifications.mark_all_read", {});
    });
  }

  // Swipe to delete
  root.querySelectorAll(".nf2-item-wrap").forEach((wrap) => {
    wireSwipeDelete(wrap, async () => {
      haptic("warning");
      const id = wrap.dataset.id;
      const undoEl = document.createElement("div");
      undoEl.style.cssText =
        "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:12px 20px;border-radius:12px;font:600 13px/1 Inter,sans-serif;z-index:999;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,.3)";
      undoEl.innerHTML = `<span>Notification supprimée</span><button style="background:none;border:none;color:var(--a);font:700 12px/1 Inter,sans-serif;cursor:pointer;padding:0">Annuler</button>`;
      document.body.appendChild(undoEl);

      let undone = false;
      undoEl.querySelector("button")?.addEventListener("click", () => {
        undone = true;
        undoEl.remove();
        wrap.style.height = "";
        wrap.style.overflow = "";
        wrap.querySelector(".nf2-item").style.transform = "";
        wrap.style.opacity = "";
        track("notification.delete_undone", { notif_id: id });
      });

      setTimeout(async () => {
        undoEl.remove();
        if (undone) return;
        wrap.style.transition = "height .3s ease, opacity .3s ease";
        wrap.style.height = "0";
        wrap.style.opacity = "0";
        wrap.style.overflow = "hidden";
        await sb.from("notifications").delete().eq("id", id);
        setTimeout(() => wrap.remove(), 350);
        if (wrap.querySelector(".nf2-item.unread")) {
          unreadCount = Math.max(0, unreadCount - 1);
          updateBadge();
        }
        track("notification.deleted", { notif_id: id });
      }, 3000);
    });
  });
}

// ─── Swipe-to-delete logic ────────────────────────────────────
function wireSwipeDelete(wrap, onDelete) {
  const item = wrap.querySelector(".nf2-item");
  if (!item) return;
  const THRESHOLD = 64;
  let startX = 0,
    curX = 0,
    swiping = false;

  item.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      curX = 0;
      swiping = true;
    },
    { passive: true },
  );

  item.addEventListener(
    "touchmove",
    (e) => {
      if (!swiping) return;
      const dx = e.touches[0].clientX - startX;
      if (dx > 0) {
        swiping = false;
        return;
      } // only left swipe
      curX = Math.max(-80, dx);
      item.style.transition = "none";
      item.style.transform = `translateX(${curX}px)`;
    },
    { passive: true },
  );

  item.addEventListener(
    "touchend",
    () => {
      if (!swiping) return;
      swiping = false;
      if (curX <= -THRESHOLD) {
        item.style.transition = "transform .25s cubic-bezier(.32,.72,0,1)";
        item.style.transform = "translateX(-80px)";
        // Tap on delete bg
        const deleteBg = wrap.querySelector(".nf2-delete-bg");
        if (deleteBg) {
          deleteBg.addEventListener("click", onDelete, { once: true });
          // Auto-delete after 400ms if not tapped
          setTimeout(() => {
            if (!wrap.parentNode) return;
            item.style.transition = "transform .2s ease";
            item.style.transform = "";
          }, 3000);
        }
      } else {
        item.style.transition = "transform .2s cubic-bezier(.23,1,.32,1)";
        item.style.transform = "";
      }
    },
    { passive: true },
  );

  // Tap delete bg directly
  const deleteBg = wrap.querySelector(".nf2-delete-bg");
  if (deleteBg) {
    deleteBg.addEventListener("click", () => {
      if (
        parseFloat(item.style.transform?.replace("translateX(", "") ?? "0") <
        -THRESHOLD
      ) {
        onDelete();
      }
    });
  }
}

// ─── Pull-to-refresh ──────────────────────────────────────────
function wirePullToRefresh(root, me) {
  const scrollEl = root.querySelector(".nf2") || root;
  const ptr = root.querySelector("#nf2-ptr");
  if (!ptr) return;

  let startY = 0,
    pulling = false;
  const THRESHOLD = 60;

  scrollEl.addEventListener(
    "touchstart",
    (e) => {
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    },
    { passive: true },
  );

  scrollEl.addEventListener(
    "touchmove",
    (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 10 && window.scrollY <= 0) {
        ptr.classList.add("visible");
      }
    },
    { passive: true },
  );

  scrollEl.addEventListener(
    "touchend",
    async () => {
      if (!pulling) return;
      pulling = false;
      if (!ptr.classList.contains("visible")) return;

      haptic("select");
      track("notifications.pull_refreshed", {});
      await loadNotifs(root, me);
      wireItems(root, me, root.querySelectorAll(".nf2-item.unread").length);
      ptr.classList.remove("visible");
    },
    { passive: true },
  );
}

// ─── Skeleton helper (inline fallback) ────────────────────────
function skelRows(n) {
  const row = `<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--bo2)">
    <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%);background-size:200% 100%;animation:nfShim 1.4s ease-in-out infinite;flex-shrink:0"></div>
    <div style="flex:1;display:flex;flex-direction:column;gap:6px">
      <div style="height:13px;border-radius:6px;width:60%;background:linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%);background-size:200% 100%;animation:nfShim 1.4s ease-in-out infinite"></div>
      <div style="height:11px;border-radius:6px;width:80%;background:linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%);background-size:200% 100%;animation:nfShim 1.4s ease-in-out infinite"></div>
    </div>
  </div>`;
  return `<style>@keyframes nfShim{from{background-position:200% 0}to{background-position:-200% 0}}</style>
    <div style="background:var(--su);border-top:1px solid var(--bo);border-bottom:1px solid var(--bo)">${row.repeat(n)}</div>`;
}
