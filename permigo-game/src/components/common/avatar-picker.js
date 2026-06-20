// ═══════════════════════════════════════════════════════════════
// Avatar Picker — bottom sheet pour choisir parmi 9 avatars par défaut
//
// Usage :
//   import { openAvatarPicker } from '@/components/common/avatar-picker.js';
//   const url = await openAvatarPicker({ currentUrl: me.avatar_url });
//   if (url) await sb.from('profiles').update({ avatar_url: url }).eq('id', me.id);
//
// Pattern : promise-based, résout avec l'URL choisie ou null si annulé.
// ═══════════════════════════════════════════════════════════════
import { ASSETS } from "@/utils/assets.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { esc } from "@/utils/escape.js";

/** Sentinelle exportée — utilisée par les consommateurs pour détecter le choix "upload custom" */
export const AVATAR_PICKER_UPLOAD = "__permigo_upload_custom__";

const STYLE = `<style>
.avpk-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 9990;
  opacity: 0;
  transition: opacity .25s;
  backdrop-filter: blur(4px);
}
.avpk-bg.show { opacity: 1; }

.avpk-sheet {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 9991;
  background: var(--su);
  border-radius: 28px 28px 0 0;
  transform: translateY(100%);
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  max-width: 480px;
  margin: 0 auto;
}
.avpk-sheet.show { transform: translateY(0); }

.avpk-handle {
  width: 36px; height: 4px;
  background: var(--bo);
  border-radius: 2px;
  margin: 12px auto 6px;
}
.avpk-hd {
  text-align: center;
  padding: 14px 20px 6px;
}
.avpk-title {
  font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -.025em;
}
.avpk-sub {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--mu3);
  margin-top: 4px;
}
.avpk-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding: 18px 20px;
}
.avpk-opt {
  aspect-ratio: 1;
  border-radius: 22px;
  border: 2.5px solid var(--bo);
  background: var(--su2);
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: transform .15s, border-color .15s;
  padding: 0;
}
.avpk-opt:active { transform: scale(.94); }
.avpk-opt.selected {
  border-color: var(--a);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--a) 18%, transparent);
}
.avpk-opt img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.avpk-opt.selected::after {
  content: '✓';
  position: absolute;
  top: 4px; right: 4px;
  width: 22px; height: 22px;
  background: var(--a);
  color: var(--a-ink);
  border-radius: 50%;
  display: grid; place-items: center;
  font: 800 13px/1 'Inter', sans-serif;
}
.avpk-actions {
  display: flex; gap: 10px;
  padding: 0 20px 8px;
}
.avpk-btn {
  flex: 1;
  height: 50px;
  border-radius: 14px;
  border: 1.5px solid var(--bo);
  background: var(--su2);
  color: var(--ink);
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  font-family: inherit;
  transition: background .12s;
}
.avpk-btn:hover { background: var(--bg3); }
.avpk-btn.primary {
  background: var(--a);
  border-color: var(--a);
  color: var(--a-ink);
}
.avpk-btn.primary:hover { background: var(--adk); }
.avpk-btn:disabled { opacity: .45; cursor: default; }
@media (prefers-reduced-motion: reduce) {
  .avpk-bg, .avpk-sheet { transition: none; }
}
</style>`;

/**
 * Affiche le picker d'avatars en bottom sheet.
 * @param {{ currentUrl?: string }} opts
 * @returns {Promise<string|null>} URL choisie ou null si annulé
 */
export function openAvatarPicker(opts = {}) {
  return new Promise((resolve) => {
    // Dédup style — injecté une seule fois par session
    if (!document.getElementById("avpk-style")) {
      const styleNode = document.createElement("div");
      styleNode.innerHTML = STYLE;
      const sEl = styleNode.querySelector("style");
      if (sEl) {
        sEl.id = "avpk-style";
        document.head.appendChild(sEl);
      }
    }

    const container = document.createElement("div");
    container.innerHTML = `
      <div class="avpk-bg"></div>
      <div class="avpk-sheet" role="dialog" aria-label="Choisir un avatar">
        <div class="avpk-handle"></div>
        <div class="avpk-hd">
          <div class="avpk-title">Choisis ton avatar</div>
          <div class="avpk-sub">9 visuels au choix — change quand tu veux</div>
        </div>
        <div class="avpk-grid">
          ${ASSETS.avatar
            .map(
              (url, i) => `
            <button class="avpk-opt ${url === opts.currentUrl ? "selected" : ""}"
                    data-url="${esc(url)}"
                    aria-label="Avatar ${i + 1}">
              <img src="${esc(url)}" alt="" loading="lazy" />
            </button>
          `,
            )
            .join("")}
        </div>
        <div class="avpk-actions" style="flex-direction:column;gap:8px">
          <button class="avpk-btn primary" data-action="confirm" disabled>Choisir cet avatar</button>
          <div style="display:flex;gap:8px">
            <button class="avpk-btn" data-action="upload" style="flex:1">${icon("image", { size: 16 })} Ma photo</button>
            <button class="avpk-btn" data-action="cancel" style="flex:1">Annuler</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    const bg = container.querySelector(".avpk-bg");
    const sheet = container.querySelector(".avpk-sheet");
    const confirmBtn = container.querySelector('[data-action="confirm"]');

    // Animation entrée
    requestAnimationFrame(() => {
      bg.classList.add("show");
      sheet.classList.add("show");
    });

    let selected = opts.currentUrl || null;
    if (selected) confirmBtn.disabled = false;

    // Sélection visuelle
    container.querySelectorAll(".avpk-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        haptic("select");
        container
          .querySelectorAll(".avpk-opt")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selected = btn.dataset.url;
        confirmBtn.disabled = false;
      });
    });

    const close = (val) => {
      bg.classList.remove("show");
      sheet.classList.remove("show");
      setTimeout(() => {
        container.remove();
        resolve(val);
      }, 280);
    };

    bg.addEventListener("click", () => close(null));
    container
      .querySelector('[data-action="cancel"]')
      .addEventListener("click", () => {
        haptic("tap");
        close(null);
      });
    container
      .querySelector('[data-action="upload"]')
      .addEventListener("click", () => {
        haptic("select");
        close(AVATAR_PICKER_UPLOAD); // sentinelle interceptée par profile-card
      });
    confirmBtn.addEventListener("click", () => {
      haptic("success");
      close(selected);
    });
  });
}
