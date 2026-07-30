// ═══════════════════════════════════════════════════════════════
// Revision Recap — écran plein écran de fin de session « Révision ».
//
// Affiche le résumé du jour : ce que l'élève vient de faire, et ce qu'il a
// intérêt à retravailler la prochaine fois. Rien d'autre.
//
// Retrait du 30/07/2026 (décision Rayan, du point de vue de l'élève) : le
// visuel de dépassement façon Clash Royale, les points de révision, le
// niveau et le rang ont été retirés. Ils comptaient une progression qui ne
// débloquait rien et que l'élève ne pouvait consulter nulle part.
//
// Usage :
//   import { showRevisionRecap } from '@/components/eleve/revision-recap.js';
//   await showRevisionRecap(summary, { onCta, onSecondary });
//   (summary = buildRevisionSummary() de @/services/revision-session.js)
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { playReward } from "@/utils/sound.js";
import { getWeakPoints } from "@/utils/weak-points.js";
import { openShareRecap } from "@/components/eleve/share-recap.js";

const STYLE_ID = "revision-recap-style";

const STYLE = `
.rcp-overlay {
  position: fixed; inset: 0; z-index: 10050;
  --rcp-accent: #22c55e;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: max(28px, env(safe-area-inset-top)) 22px max(28px, env(safe-area-inset-bottom));
  color: #fff; overflow: hidden;
  background:
    radial-gradient(120% 75% at 50% 14%, color-mix(in srgb, var(--rcp-accent) 30%, transparent) 0%, transparent 56%),
    linear-gradient(180deg, #05060b 0%, #0a0c16 55%, #05060b 100%);
  box-shadow: inset 0 0 200px 56px rgba(0,0,0,.72);
  opacity: 0; transition: opacity .35s cubic-bezier(0.23,1,0.32,1);
}
.rcp-overlay.rcp-show { opacity: 1; }
.rcp-overlay.rcp-closing { opacity: 0; }

.rcp-stage {
  position: relative; z-index: 2; width: 100%; max-width: 420px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}

.rcp-kicker {
  display: inline-flex; align-items: center; gap: 8px;
  font: 800 11.5px/1 var(--fd, system-ui), sans-serif;
  letter-spacing: .26em; text-transform: uppercase;
  color: color-mix(in srgb, var(--rcp-accent) 70%, #fff);
  padding: 7px 14px; border-radius: 999px;
  background: color-mix(in srgb, var(--rcp-accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--rcp-accent) 35%, transparent);
  opacity: 0; transform: translateY(-8px);
  transition: opacity .4s ease .05s, transform .5s cubic-bezier(0.23,1,0.32,1) .05s;
}
.rcp-overlay.rcp-show .rcp-kicker { opacity: 1; transform: translateY(0); }

.rcp-title {
  font: 900 clamp(26px, 8.5vw, 38px)/1.04 var(--fd, system-ui), sans-serif;
  font-style: italic; letter-spacing: -.02em; text-transform: uppercase;
  margin: 16px 0 4px; text-wrap: balance;
  /* Titre en italique dans une colonne flex : sans largeur imposée il prend sa
     largeur de contenu et déborde à droite (« 1 QUIZ RÉUSSI » coupé). */
  align-self: stretch; max-width: 100%;
  background: linear-gradient(176deg,#fff 0%,#fff 45%, color-mix(in srgb, var(--rcp-accent) 32%, #fff) 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  opacity: 0; transform: translateY(14px);
  transition: opacity .5s ease .16s, transform .6s cubic-bezier(0.23,1,0.32,1) .16s;
}
.rcp-overlay.rcp-show .rcp-title { opacity: 1; transform: translateY(0); }

.rcp-sub {
  font: 600 13px/1.4 var(--fd, system-ui), sans-serif;
  color: rgba(255,255,255,.6); margin: 0 0 6px;
  opacity: 0; transition: opacity .4s ease .26s;
}
.rcp-overlay.rcp-show .rcp-sub { opacity: 1; }

/* Points faibles — direction concrète pour la prochaine session */
.rcp-weak {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
  gap: 6px; margin-top: 16px; max-width: 320px;
  opacity: 0; transform: translateY(8px);
  transition: opacity .4s ease .55s, transform .5s ease .55s;
}
.rcp-overlay.rcp-show .rcp-weak { opacity: 1; transform: translateY(0); }
.rcp-weak-lbl { font: 700 9px/1.2 var(--fd, system-ui), sans-serif; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.5); }
.rcp-weak-tag {
  padding: 5px 11px; border-radius: 999px;
  font: 800 12px/1 var(--fd, system-ui), sans-serif;
  color: #fff; background: rgba(255,255,255,.10);
  border: 1px solid rgba(255,255,255,.16);
}

.rcp-cta {
  margin-top: 26px; width: 100%; max-width: 360px; min-height: 54px; padding: 17px 28px;
  border: 0; border-radius: 16px; cursor: pointer;
  font: 800 15px/1 var(--fd, system-ui), sans-serif; letter-spacing: .04em; text-transform: uppercase; color: #06070d;
  background: linear-gradient(135deg, color-mix(in srgb, var(--rcp-accent) 75%, #fff), var(--rcp-accent));
  box-shadow: 0 14px 32px color-mix(in srgb, var(--rcp-accent) 40%, transparent), inset 0 2px 0 rgba(255,255,255,.45), inset 0 -3px 0 rgba(0,0,0,.2);
  opacity: 0; transform: translateY(10px);
  transition: opacity .45s ease .7s, transform .55s cubic-bezier(0.23,1,0.32,1) .7s, scale .12s ease;
}
.rcp-overlay.rcp-show .rcp-cta { opacity: 1; transform: translateY(0); }
.rcp-cta:active { scale: .97; }
.rcp-second {
  margin-top: 14px; background: none; border: 0; cursor: pointer;
  font: 700 13px/1 var(--fd, system-ui), sans-serif; color: rgba(255,255,255,.6);
  text-decoration: underline; text-underline-offset: 3px;
  opacity: 0; transition: opacity .4s ease .8s;
}
.rcp-overlay.rcp-show .rcp-second { opacity: 1; }
.rcp-second:active { color: #fff; }

.rcp-close {
  position: absolute; top: max(16px, env(safe-area-inset-top)); right: 16px;
  width: 44px; height: 44px; border-radius: 50%; z-index: 5;
  background: rgba(255,255,255,.1); color: #fff; border: 0; cursor: pointer;
  font-size: 20px; line-height: 1; display: grid; place-items: center;
  opacity: 0; transition: opacity .3s ease .8s, background .15s;
}
.rcp-overlay.rcp-show .rcp-close { opacity: 1; }
.rcp-close:hover { background: rgba(255,255,255,.2); }

@media (prefers-reduced-motion: reduce) {
  .rcp-overlay, .rcp-kicker, .rcp-title, .rcp-sub, .rcp-weak, .rcp-cta, .rcp-second, .rcp-close {
    transition: opacity .2s ease !important; transform: none !important;
  }
}
`;

function ensureStyle() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID))
    return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = STYLE;
  document.head.appendChild(tag);
}

/**
 * Affiche le récap plein écran de fin de session révision.
 * @param {Object} summary  - sortie de buildRevisionSummary()
 * @param {Object} [opts]
 * @param {Function}[opts.onCta]        CTA principal (ex: aller au parcours)
 * @param {Function}[opts.onSecondary]  lien secondaire (ex: voir le classement)
 * @returns {Promise<'cta'|'secondary'|'close'>}
 */
export function showRevisionRecap(summary = {}, opts = {}) {
  ensureStyle();
  const { onCta, onSecondary } = opts;

  const accent = "#22c55e";
  const nPassed = summary.nPassed ?? 0;
  const nQuiz = summary.nQuiz ?? 0;

  const title =
    nPassed > 0
      ? `${nPassed} quiz réussi${nPassed > 1 ? "s" : ""}`
      : nQuiz > 0
        ? "Tu as bossé 💪"
        : "Session terminée";
  // Une session sans réussite est le pire moment pour démotiver : on valorise
  // l'effort plutôt que d'afficher un "0" sec.
  const sub =
    nPassed === 0 && nQuiz > 0
      ? `${nQuiz} quiz testé${nQuiz > 1 ? "s" : ""} — c'est en se trompant qu'on mémorise`
      : nQuiz > 0
        ? `${nQuiz} quiz joué${nQuiz > 1 ? "s" : ""} dans cette session de révision`
        : "Reviens demain pour réviser encore";

  // Points faibles (calculés localement par weak-points.js) — surfacés ici pour
  // donner une direction concrète à la prochaine session.
  const weak = getWeakPoints({ limit: 2 });
  const weakHtml = weak.length
    ? `<div class="rcp-weak"><span class="rcp-weak-lbl">À retravailler</span>${weak
        .map((w) => `<span class="rcp-weak-tag">${esc(w.label)}</span>`)
        .join("")}</div>`
    : "";

  // (Retrait du 30/07/2026 — décision Rayan : les points de révision, le
  // niveau et le rang ne sont plus affichés nulle part côté élève. Ils ne
  // débloquaient rien. Il reste ce qui l'aide vraiment : ce qu'il vient de
  // faire, et ce qu'il doit retravailler la prochaine fois.)

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "rcp-overlay";
    overlay.style.setProperty("--rcp-accent", accent);
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Résumé de ta session de révision");

    overlay.innerHTML = `
      <button class="rcp-close" type="button" aria-label="Fermer">×</button>
      <div class="rcp-stage">
        <span class="rcp-kicker">Session révision</span>
        <h1 class="rcp-title">${esc(title)}</h1>
        <p class="rcp-sub">${esc(sub)}</p>
        ${weakHtml}
        <button class="rcp-cta" type="button">Continuer</button>
        ${nPassed > 0 ? `<button class="rcp-second" data-share type="button">📲 Partager ma session</button>` : ""}
        ${onSecondary ? `<button class="rcp-second" data-secondary type="button">Voir le classement</button>` : ""}
      </div>
    `;

    document.body.appendChild(overlay);

    try {
      if (navigator.vibrate) navigator.vibrate([12, 40, 18, 60, 24]);
    } catch {
      /* noop */
    }
    try {
      playReward();
    } catch {
      /* noop */
    }

    void overlay.offsetWidth;
    overlay.classList.add("rcp-show");

    let done = false;
    const close = (src) => {
      if (done) return;
      done = true;
      overlay.classList.remove("rcp-show");
      overlay.classList.add("rcp-closing");
      document.removeEventListener("keydown", escHandler);
      setTimeout(() => {
        overlay.remove();
        resolve(src);
      }, 280);
    };

    overlay.querySelector(".rcp-cta").addEventListener("click", () => {
      try {
        onCta?.();
      } catch {
        /* noop */
      }
      close("cta");
    });
    overlay.querySelector("[data-secondary]")?.addEventListener("click", () => {
      try {
        onSecondary?.();
      } catch {
        /* noop */
      }
      close("secondary");
    });
    // Partage : la carte-image s'ouvre PAR-DESSUS la recap (z 10080), qui reste.
    overlay.querySelector("[data-share]")?.addEventListener("click", () => {
      openShareRecap({
        kicker: "Quiz réussis aujourd'hui",
        big: String(nPassed),
        sub: `${nQuiz} quiz joué${nQuiz > 1 ? "s" : ""} dans ma session de révision`,
      });
    });
    overlay
      .querySelector(".rcp-close")
      .addEventListener("click", () => close("close"));

    const escHandler = (e) => {
      if (e.key === "Escape") close("close");
    };
    document.addEventListener("keydown", escHandler);
  });
}
