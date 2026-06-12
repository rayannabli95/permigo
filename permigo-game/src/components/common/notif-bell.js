/**
 * Composant Cloche de notifications.
 *
 * Usage :
 *   import { mountNotifBell } from '@/components/common/notif-bell.js';
 *   mountNotifBell(container);   // monte une cloche cliquable
 *
 * - Badge rouge avec le count non-lus (+ App Badging API en PWA)
 * - Click → page #/notifications (une seule surface de lecture,
 *   l'ancien panneau déroulant générique a été retiré)
 *
 * Branché sur Supabase : notifications (SELECT user_id = me.id)
 */

import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser } from "@/auth/cur-user.js";

/**
 * Monte une cloche dans le `container` donné.
 * @param {HTMLElement} container
 */
export async function mountNotifBell(container) {
  const me = getCurUser();
  if (!me) return;

  container.innerHTML = `
    <style>
      .nb-wrap{position:relative;display:inline-block}
      .nb-btn{width:36px;height:36px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;transition:background .12s,border-color .12s;font-family:inherit;padding:0}
      .nb-btn:hover{background:var(--bg2);border-color:var(--mu2)}
      /* Hit-area 44x44 sans grossir le visuel (bouton le plus tape de l'app) */
      .nb-btn::after{content:'';position:absolute;inset:-4px}
      .nb-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:var(--rd);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg);line-height:1;font-family:var(--fn)}
    </style>
    <div class="nb-wrap">
      <button class="nb-btn" id="nb-toggle" aria-label="Notifications" title="Notifications">
        ${icon("bell", { size: 20, strokeWidth: 2 })}
        <span class="nb-badge" id="nb-badge" style="display:none">0</span>
      </button>
    </div>
  `;

  container.querySelector("#nb-toggle")?.addEventListener("click", async () => {
    try {
      const { navigate } = await import("@/router.js");
      navigate("/notifications");
    } catch {
      window.location.hash = "#/notifications";
    }
  });

  await refreshBell(container, me);
}

async function refreshBell(container, me) {
  const { count, error } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", me.id)
    .eq("read", false);
  if (error) {
    console.warn("[notif-bell] err", error);
    return;
  }

  const unread = count ?? 0;
  const badge = container.querySelector("#nb-badge");
  if (badge) {
    badge.style.display = unread > 0 ? "flex" : "none";
    badge.textContent = unread > 99 ? "99+" : String(unread);
  }

  // App Badging API : pastille sur l'icône de l'app installée (PWA).
  // Seul rappel visuel hors-app tant que le push n'est pas câblé.
  try {
    if ("setAppBadge" in navigator) {
      if (unread > 0) navigator.setAppBadge(unread);
      else navigator.clearAppBadge();
    }
  } catch {
    /* non supporté → silencieux */
  }
}
