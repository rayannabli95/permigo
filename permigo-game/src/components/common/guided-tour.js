// ═══════════════════════════════════════════════════════════════
// Tour guidé (coach marks) — sobre, mobile-first.
// Pointe des bulles sur des éléments de l'UI, une étape à la fois.
// API : startTour(steps, { onDone })
//   steps = [{ sel?, title, text }]  — sans `sel` = carte centrée (intro/outro)
// Pas de gamification : ton pro, « Passer » toujours dispo.
// Sécu : tous les textes passent par textContent (jamais innerHTML) → pas de XSS.
// ═══════════════════════════════════════════════════════════════

const REDUCED =
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const STYLE = `<style>
  .gt-catch {
    position: fixed; inset: 0; z-index: 10000;
    background: transparent;
    transition: background .2s ease;
  }
  .gt-catch.gt-dim { background: rgba(8,10,20,.6); }
  .gt-spot {
    position: fixed; z-index: 10001;
    border-radius: 14px;
    box-shadow: 0 0 0 9999px rgba(8,10,20,.6), 0 0 0 2px var(--a, #6366f1) inset;
    pointer-events: none;
    transition: ${REDUCED ? "none" : "left .28s cubic-bezier(.4,0,.2,1), top .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1), height .28s cubic-bezier(.4,0,.2,1)"};
  }
  .gt-bubble {
    position: fixed; z-index: 10002;
    left: 50%; transform: translateX(-50%);
    width: min(340px, calc(100vw - 32px));
    background: var(--su, #fff);
    border: 1.5px solid var(--bo, #e6e8ef);
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 12px 40px rgba(8,10,20,.28);
    color: var(--ink, #0a0d1a);
    ${REDUCED ? "" : "animation: gtIn .26s cubic-bezier(.34,1.4,.64,1);"}
  }
  .gt-bubble.gt-center { top: 50%; transform: translate(-50%, -50%); }
  @keyframes gtIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; } }
  .gt-step {
    font: 700 11px/1 'IBM Plex Mono', monospace;
    color: var(--mu2, #9aa0b4); letter-spacing: .06em; margin-bottom: 8px;
  }
  .gt-title {
    font: 800 17px/1.25 'Plus Jakarta Sans', sans-serif;
    color: var(--ink, #0a0d1a); margin: 0 0 6px; letter-spacing: -.02em;
  }
  .gt-text {
    font: 500 13.5px/1.5 'Inter', sans-serif;
    color: var(--ink5, #3a3f52); margin: 0 0 16px;
  }
  .gt-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .gt-skip {
    background: none; border: none; cursor: pointer;
    font: 600 13px/1 'Inter', sans-serif; color: var(--mu2, #9aa0b4);
    padding: 10px 4px; min-height: 44px;
    -webkit-tap-highlight-color: transparent;
  }
  .gt-skip:hover { color: var(--ink5, #3a3f52); }
  .gt-next {
    background: var(--a, #6366f1); color: var(--a-ink); border: none; cursor: pointer;
    font: 700 13.5px/1 'Plus Jakarta Sans', sans-serif;
    padding: 0 20px; min-height: 44px; border-radius: 12px;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--a, #6366f1) 35%, transparent);
    -webkit-tap-highlight-color: transparent;
    transition: transform .14s cubic-bezier(.23,1,.32,1);
  }
  .gt-next:active { transform: scale(.96); }
</style>`;

export function startTour(steps, opts = {}) {
  if (!Array.isArray(steps) || steps.length === 0) return;
  // Évite deux tours simultanés
  if (document.querySelector(".gt-root")) return;

  let i = 0;

  const ov = document.createElement("div");
  ov.className = "gt-root";
  ov.innerHTML = `${STYLE}
    <div class="gt-catch"></div>
    <div class="gt-spot" hidden></div>
    <div class="gt-bubble" role="dialog" aria-modal="true" aria-live="polite" aria-label="Guide rapide">
      <div class="gt-step"></div>
      <h3 class="gt-title"></h3>
      <p class="gt-text"></p>
      <div class="gt-actions">
        <button class="gt-skip" type="button">Passer</button>
        <button class="gt-next" type="button">Suivant</button>
      </div>
    </div>`;
  document.body.appendChild(ov);

  const catchEl = ov.querySelector(".gt-catch");
  const spot = ov.querySelector(".gt-spot");
  const bubble = ov.querySelector(".gt-bubble");
  const elStep = ov.querySelector(".gt-step");
  const elTitle = ov.querySelector(".gt-title");
  const elText = ov.querySelector(".gt-text");
  const btnNext = ov.querySelector(".gt-next");
  const btnSkip = ov.querySelector(".gt-skip");

  let done = false;
  function end() {
    if (done) return;
    done = true;
    window.removeEventListener("resize", place);
    ov.remove();
    opts.onDone?.();
  }

  function place() {
    const s = steps[i];
    const target = s.sel ? document.querySelector(s.sel) : null;

    if (!target) {
      // Carte centrée (intro / fin)
      spot.hidden = true;
      catchEl.classList.add("gt-dim");
      bubble.classList.add("gt-center");
      bubble.style.top = "";
      return;
    }

    catchEl.classList.remove("gt-dim");
    bubble.classList.remove("gt-center");
    // Scroll INSTANTANÉ : un smooth-scroll n'est pas terminé au moment de la
    // mesure (rAF) → spotlight décalé. L'instantané garantit un rect correct.
    target.scrollIntoView({ block: "center", behavior: "auto" });

    // Mesure après application du layout du scroll
    requestAnimationFrame(() => {
      const r = target.getBoundingClientRect();
      const pad = 6;
      spot.hidden = false;
      spot.style.left = `${r.left - pad}px`;
      spot.style.top = `${r.top - pad}px`;
      spot.style.width = `${r.width + pad * 2}px`;
      spot.style.height = `${r.height + pad * 2}px`;

      // Bulle sous la cible si la place le permet, sinon au-dessus.
      // La marge basse integre la home bar iOS (env() lisible via une sonde).
      const vh = window.innerHeight;
      const bubbleH = bubble.offsetHeight || 170;
      const below = r.bottom + 14;
      const safeBottom = (() => {
        const probe = document.createElement("div");
        probe.style.cssText =
          "position:fixed;bottom:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden";
        document.body.appendChild(probe);
        const v = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
        probe.remove();
        return v;
      })();
      bubble.style.top =
        below + bubbleH < vh - 12 - safeBottom
          ? `${below}px`
          : `${Math.max(12, r.top - bubbleH - 14)}px`;
    });
  }

  function render() {
    const s = steps[i];
    elStep.textContent = `${i + 1} / ${steps.length}`;
    elTitle.textContent = s.title || "";
    elText.textContent = s.text || "";
    btnNext.textContent = i === steps.length - 1 ? "Terminer" : "Suivant";
    place();
  }

  btnNext.addEventListener("click", () => {
    if (i < steps.length - 1) {
      i++;
      render();
    } else {
      end();
    }
  });
  btnSkip.addEventListener("click", end);
  // Clic hors bulle = avancer (sans permettre d'interagir avec l'app dessous)
  catchEl.addEventListener("click", () => btnNext.click());
  window.addEventListener("resize", place);

  render();
}
