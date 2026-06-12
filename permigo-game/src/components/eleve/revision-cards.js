// ═══════════════════════════════════════════════════════════════
// Revision Cards — section "Mes révisions" élève
// Dopamine mémoire espacée : 3 compétences à réviser
//
// Usage :
//   import { mountRevisionCards } from '@/components/eleve/revision-cards.js';
//   await mountRevisionCards(root, { eleveId, limit });
//
// RPC : get_revision_recommendations(p_eleve_id, p_limit)
// → [{ competence_id, reason, score, nom, monde, ordre }]
// reasons : quiz_fails | old_validation | consolidation_due
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";

const STYLE_ID = "revision-cards-style";

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .rc-section {
    margin-bottom: 20px;
  }
  .rc-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding: 0 2px;
  }
  .rc-title {
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -.01em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .rc-count {
    font: 700 11px/1 'Inter', sans-serif;
    color: var(--a-txt);
    background: color-mix(in srgb, var(--a) 10%, transparent);
    border-radius: 99px;
    padding: 2px 8px;
  }

  /* Cards stack */
  .rc-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rc-card {
    background: var(--su);
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    border: 1.5px solid var(--bo);
    transition: border-color .12s, transform .15s cubic-bezier(.23,1,.32,1);
    animation: rcCardIn .3s cubic-bezier(.34,1.56,.64,1) both;
    -webkit-tap-highlight-color: transparent;
  }
  .rc-card:nth-child(2) { animation-delay: .06s; }
  .rc-card:nth-child(3) { animation-delay: .12s; }
  @keyframes rcCardIn {
    from { opacity:0; transform:translateY(8px) scale(.97); }
    to   { opacity:1; transform:translateY(0)   scale(1); }
  }
  @media (hover:hover) and (pointer:fine) {
    .rc-card:hover { border-color: color-mix(in srgb, var(--a) 30%, transparent); }
  }
  .rc-card:active { transform: scale(.98); }

  /* Reason dot */
  .rc-dot {
    width: 40px; height: 40px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .rc-dot--quiz_fails       { background: rgba(239,68,68,.1);   color: var(--rdk); }
  .rc-dot--old_validation   { background: rgba(245,158,11,.1);  color: var(--amk); }
  .rc-dot--consolidation_due { background: rgba(139,92,246,.1); color: var(--puk); }

  .rc-body { flex: 1; min-width: 0; }
  .rc-comp {
    font: 600 13px/1.3 'Inter', sans-serif;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rc-reason {
    font: 500 11px/1.2 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 3px;
  }
  .rc-reason--quiz_fails       { color: var(--rdk); }
  .rc-reason--old_validation   { color: var(--amk); }
  .rc-reason--consolidation_due { color: var(--puk); }

  .rc-arrow { color: var(--bo4); flex-shrink: 0; }

  @media (prefers-reduced-motion: reduce) {
    .rc-card { animation: none; }
  }
  `;
  document.head.appendChild(s);
}

const REASON_LABELS = {
  quiz_fails: "Quiz raté — à retravailler",
  old_validation: "Acquis il y a longtemps — à rafraîchir",
  consolidation_due: "Quiz de révision à refaire",
};

const REASON_ICONS = {
  quiz_fails: "alert-circle",
  old_validation: "clock",
  consolidation_due: "refresh-cw",
};

/**
 * Injecte la section "Mes révisions" avant anchorEl (ou avant .acc-footer).
 * Ne fait rien si 0 recommandations.
 *
 * @param {HTMLElement} root - le container .acc ou racine de la page
 * @param {{ eleveId: string, limit?: number }} opts
 */
export async function mountRevisionCards(root, { eleveId, limit = 3 }) {
  let recos = [];
  try {
    const { data, error } = await sb.rpc("get_revision_recommendations", {
      p_eleve_id: eleveId,
      p_limit: limit,
    });
    if (error) {
      console.error("[revision-cards] get_revision_recommendations:", error);
      return;
    }
    recos = data || [];
  } catch (e) {
    console.warn("[revision-cards] fetch error", e);
    return;
  }

  if (recos.length === 0) return;

  ensureStyle();
  track("revision_cards.shown", { count: recos.length, eleve_id: eleveId });

  const section = document.createElement("div");
  section.className = "rc-section";
  section.innerHTML = `
    <div class="rc-hd">
      <div class="rc-title">
        ${icon("book-open", { size: 14, strokeWidth: 2.2, color: "var(--a)" })}
        Mes révisions
      </div>
      <span class="rc-count">${recos.length}</span>
    </div>
    <div class="rc-list">
      ${recos
        .map((r) => {
          const reasonKey = r.reason || "old_validation";
          const icoName = REASON_ICONS[reasonKey] || "clock";
          return `
          <div class="rc-card" data-comp-id="${esc(r.competence_id)}" role="button" tabindex="0">
            <div class="rc-dot rc-dot--${esc(reasonKey)}">
              ${icon(icoName, { size: 18, strokeWidth: 2.2 })}
            </div>
            <div class="rc-body">
              <div class="rc-comp">${esc(r.competence_nom || r.competence_id)}</div>
              <div class="rc-reason rc-reason--${esc(reasonKey)}">${esc(REASON_LABELS[reasonKey] || reasonKey)}</div>
            </div>
            <div class="rc-arrow">${icon("chevron-right", { size: 16, strokeWidth: 2.5 })}</div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;

  // Inject avant .acc-footer ou en fin du root
  const footer = root.querySelector(".acc-footer");
  if (footer) {
    root.insertBefore(section, footer);
  } else {
    root.appendChild(section);
  }

  // Wire tap
  section.querySelectorAll(".rc-card").forEach((card) => {
    const handler = () => {
      const compId = card.dataset.compId;
      track("revision_cards.card_tapped", {
        competence_id: compId,
        eleve_id: eleveId,
      });
      try {
        localStorage.setItem("permigo:has_revised", "1");
      } catch {}
      navigate(`#/quiz/${compId}/post_validation`);
    };
    card.addEventListener("click", handler);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    });
  });
}
