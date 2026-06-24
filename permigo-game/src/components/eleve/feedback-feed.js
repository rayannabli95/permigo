// ═══════════════════════════════════════════════════════════════
// Feedback Feed — "Retours de ton moniteur" en TIMELINE de progression.
// Usage : mountFeedbackFeed(root, { eleveId, limit, anchorEl })
//   Injecte avant `anchorEl` (ou avant .acc-footer / en dernier).
// Lecture comme une histoire : jalons reliés, validations célébrées en vert,
// séances en accent neutre. Le moniteur (souvent unique) est dégroupé en tête.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";
import { navigate } from "@/router.js";
import { findSubComp } from "@/data/remc.js";

// "C2f" → "Intersections, ronds-points" (fallback : code brut)
function compLabel(compId) {
  const sub = findSubComp(compId);
  return sub ? sub.n : compId || "—";
}

const STYLE_ID = "feedback-feed-style";

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  @keyframes fftIn {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .fft-section { margin: 40px 16px 0; }

  .fft-hd {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; margin-bottom: 0;
  }
  /* Le toggle est désormais un VRAI bouton (plus de div role=button imbriquant
     un autre bouton → corrige nested-interactive). Reset des styles natifs. */
  .fft-hd-toggle {
    flex: 1; min-width: 0;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: none; border: none; font: inherit; color: inherit; text-align: left;
    cursor: pointer; padding: 8px 0; user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .fft-hd-toggle:focus-visible { outline: 2px solid var(--a); outline-offset: 2px; border-radius: 8px; }
  .fft-hd-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
  .fft-title {
    font: 800 16px/1.15 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); letter-spacing: -.02em;
    display: flex; align-items: center; gap: 8px;
  }
  .fft-title-ico { color: var(--a-txt); display: inline-flex; }
  .fft-sub {
    font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 3px;
  }
  .fft-count {
    font: 600 11px/1 'Inter', sans-serif; color: var(--mu2);
    background: var(--su); border: 1px solid var(--bo);
    padding: 3px 8px; border-radius: var(--r-full);
    white-space: nowrap; flex-shrink: 0;
  }
  .fft-hd-right {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  }
  .fft-all {
    font: 600 12.5px/1 'Inter', sans-serif; color: var(--a-txt);
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; gap: 2px;
    padding: 10px 8px; margin: -10px -8px;
    -webkit-tap-highlight-color: transparent; transition: opacity .12s;
    white-space: nowrap;
  }
  .fft-all:active { opacity: .6; }
  .fft-chevron {
    display: inline-flex; color: var(--mu2);
    transition: transform .22s cubic-bezier(.23,1,.32,1);
    flex-shrink: 0;
  }
  .fft-section.fft-open .fft-chevron { transform: rotate(180deg); }

  /* ── Timeline (repliée par défaut) ── */
  .fft-timeline-wrap {
    overflow: hidden;
    max-height: 0;
    transition: max-height .35s cubic-bezier(.23,1,.32,1),
                opacity .25s ease,
                margin-top .22s ease;
    opacity: 0;
    margin-top: 0;
  }
  .fft-section.fft-open .fft-timeline-wrap {
    max-height: 1200px;
    opacity: 1;
    margin-top: 16px;
  }
  .fft-timeline { position: relative; }
  .fft-item {
    display: flex; gap: 12px; position: relative;
    padding-bottom: 18px;
    animation: fftIn .32s cubic-bezier(.23,1,.32,1) both;
  }
  .fft-item:nth-child(2) { animation-delay: .05s; }
  .fft-item:nth-child(3) { animation-delay: .10s; }
  .fft-item:nth-child(4) { animation-delay: .15s; }
  .fft-item:nth-child(5) { animation-delay: .20s; }
  .fft-item:last-child { padding-bottom: 0; }

  .fft-node { position: relative; flex-shrink: 0; width: 28px; display: flex; justify-content: center; }
  /* trait reliant ce jalon au suivant */
  .fft-node::before {
    content: ''; position: absolute; left: 50%; transform: translateX(-50%);
    top: 30px; bottom: -18px; width: 2px;
    background: linear-gradient(var(--bo), var(--bo2));
  }
  .fft-item:last-child .fft-node::before { display: none; }
  .fft-dot {
    width: 28px; height: 28px; border-radius: 50%; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    background: var(--su); box-shadow: 0 1px 3px rgba(10,13,26,.08);
  }
  .fft-dot.val {
    background: rgba(16,185,129,.12); color: var(--grd);
    border: 1.5px solid rgba(16,185,129,.34);
  }
  .fft-dot.ses {
    background: color-mix(in srgb, var(--a) 12%, transparent); color: var(--a-txt);
    border: 1.5px solid color-mix(in srgb, var(--a) 30%, transparent);
  }

  .fft-content { flex: 1; min-width: 0; padding-top: 2px; }
  .fft-line {
    font: 500 13.5px/1.4 'Inter', sans-serif; color: var(--ink5);
    display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap;
  }
  .fft-line strong { color: var(--ink); font-weight: 700; }
  .fft-pill {
    font: 700 10px/1 'Inter', sans-serif; letter-spacing: .03em;
    padding: 4px 8px; border-radius: var(--r-full); white-space: nowrap;
  }
  .fft-pill.val { color: var(--grdk); background: rgba(16,185,129,.13); }
  .fft-pill.ses { color: var(--a-txt); background: color-mix(in srgb, var(--a) 12%, transparent); }
  .fft-meta {
    font: 500 11.5px/1.3 'Inter', sans-serif; color: var(--mu2);
    margin-top: 4px; display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  }
  .fft-meta .ok { color: var(--grdk); }
  .fft-quote {
    font: italic 400 12.5px/1.5 'Inter', sans-serif; color: var(--mu3);
    margin-top: 7px; padding: 2px 0 2px 11px;
    border-left: 2px solid color-mix(in srgb, var(--a) 32%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    .fft-item { animation: none; }
  }
  `;
  document.head.appendChild(s);
}

// ─── Helpers ─────────────────────────────────────────────────
function relDate(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "aujourd'hui";
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d}j`;
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
function fmtDuration(min) {
  if (!min) return "";
  const h = Math.floor(min / 60),
    m = min % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}
function fullName(evt) {
  return `${evt.moniteur_prenom || ""} ${evt.moniteur_nom || ""}`.trim();
}

// ─── Render un jalon ─────────────────────────────────────────
function renderItem(evt, showAuthor) {
  const isSession = evt.kind === "session";
  const dotCls = isSession ? "ses" : "val";
  const dotIcon = isSession
    ? icon("clock", { size: 14, strokeWidth: 2.2 })
    : icon("check", { size: 15, strokeWidth: 3 });

  const line = isSession
    ? `<strong>${esc(fmtDuration(evt.duration_minutes))} de conduite</strong>
       <span class="fft-pill ses">Séance</span>`
    : `<strong>${esc(compLabel(evt.competence_id))}</strong>
       <span class="fft-pill val">Validé ✓</span>`;

  // Méta : statut (séance) + date + auteur si plusieurs moniteurs
  const statusBit =
    isSession && evt.confirmation_status === "confirmed"
      ? `<span class="ok">✓ confirmée</span><span>·</span>`
      : isSession && evt.confirmation_status === "refused"
        ? `<span>refusée</span><span>·</span>`
        : isSession && evt.confirmation_status
          ? `<span>en attente</span><span>·</span>`
          : "";
  const authorBit = showAuthor
    ? `<span>·</span><span>${esc(fullName(evt))}</span>`
    : "";

  return `
  <div class="fft-item">
    <div class="fft-node"><div class="fft-dot ${dotCls}">${dotIcon}</div></div>
    <div class="fft-content">
      <div class="fft-line">${line}</div>
      <div class="fft-meta">${statusBit}<span>${esc(relDate(evt.ts))}</span>${authorBit}</div>
      ${evt.comment ? `<div class="fft-quote">« ${esc(evt.comment)} »</div>` : ""}
    </div>
  </div>`;
}

/**
 * Monte la timeline "Retours de ton moniteur" dans root.
 * @param {HTMLElement} root — container parent
 * @param {{ eleveId: string, limit?: number, anchorEl?: Element }} opts
 */
export async function mountFeedbackFeed(
  root,
  { eleveId, limit = 5, anchorEl } = {},
) {
  ensureStyle();

  let events = [];
  try {
    const { data } = await sb.rpc("get_eleve_feedback_feed", {
      p_eleve_id: eleveId || null,
      p_limit: limit,
    });
    events = data || [];
  } catch (e) {
    console.error("[feedback-feed] fetch error", e);
    return;
  }

  if (events.length === 0) return;

  track("feedback_feed.shown", { count: events.length, eleve_id: eleveId });

  // Moniteur(s) : si un seul, on le sort en sous-titre et on l'enlève des items.
  const names = [...new Set(events.map(fullName).filter(Boolean))];
  const singleMoniteur = names.length === 1 ? names[0] : null;
  const title = singleMoniteur
    ? "Retours de ton moniteur"
    : "Retours de tes moniteurs";

  const countLabel =
    events.length === 1 ? "1 retour" : `${events.length} retours`;

  const wrap = document.createElement("div");
  wrap.className = "fft-section";
  wrap.id = "ff-section";
  wrap.innerHTML = `
    <div class="fft-hd">
      <button class="fft-hd-toggle" id="ff-toggle" type="button"
              aria-expanded="false" aria-controls="ff-timeline-wrap">
        <div class="fft-hd-left">
          <div>
            <div class="fft-title">
              <span class="fft-title-ico">${icon("message-circle", { size: 16, strokeWidth: 2.2 })}</span>
              ${esc(title)}
            </div>
            ${singleMoniteur ? `<div class="fft-sub">Avec ${esc(singleMoniteur)}</div>` : ""}
          </div>
          <span class="fft-count">${esc(countLabel)}</span>
        </div>
        <span class="fft-chevron">${icon("chevron-down", { size: 16, strokeWidth: 2.2 })}</span>
      </button>
      <button class="fft-all" id="ff-see-all" aria-label="Voir tout le fil">
        Tout voir ${icon("chevron-right", { size: 13, strokeWidth: 2.5 })}
      </button>
    </div>
    <div class="fft-timeline-wrap" id="ff-timeline-wrap">
      <div class="fft-timeline">
        ${events.map((e) => renderItem(e, !singleMoniteur)).join("")}
      </div>
    </div>
  `;

  // Injecter avant ancre (ou avant le footer dans .acc)
  if (anchorEl && anchorEl.parentNode === root) {
    root.insertBefore(wrap, anchorEl);
  } else {
    const footer = root.querySelector(".acc-footer");
    if (footer) root.insertBefore(wrap, footer);
    else root.appendChild(wrap);
  }

  // Toggle dépli / repli au clic sur le header
  const toggleEl = wrap.querySelector("#ff-toggle");
  toggleEl?.addEventListener("click", () => {
    const isOpen = wrap.classList.toggle("fft-open");
    toggleEl.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      track("feedback_feed.expanded", { count: events.length });
    }
  });
  // (clavier géré nativement par le <button> #ff-toggle)

  // "Tout voir" ne déclenche pas le toggle
  wrap.querySelector("#ff-see-all")?.addEventListener("click", (e) => {
    e.stopPropagation();
    track("feedback_feed.see_all_clicked");
    navigate("#/feedback");
  });
}
