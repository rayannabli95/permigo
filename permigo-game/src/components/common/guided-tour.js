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
  .gt-catch.gt-dim {
    background: rgba(10,8,26,.74);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
  }
  .gt-spot {
    position: fixed; z-index: 10001;
    border-radius: 14px;
    box-shadow: 0 0 0 9999px rgba(10,8,26,.74),
                0 0 0 3px var(--a, #6366f1) inset,
                0 0 24px color-mix(in srgb, var(--a, #6366f1) 65%, transparent);
    pointer-events: none;
    transition: ${REDUCED ? "none" : "left .28s cubic-bezier(.4,0,.2,1), top .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1), height .28s cubic-bezier(.4,0,.2,1)"};
  }
  /* Bulle « Arène » : surface teintée accent + liseré + halo → se détache
     du voile même en dark (fini la carte noire sur fond noir). */
  .gt-bubble {
    position: fixed; z-index: 10002;
    left: 50%; transform: translateX(-50%);
    width: min(360px, calc(100vw - 28px));
    background:
      radial-gradient(130% 90% at 50% -10%,
        color-mix(in srgb, var(--a, #6366f1) 26%, var(--su, #fff)) 0%,
        var(--su, #fff) 62%);
    border: 2px solid color-mix(in srgb, var(--a, #6366f1) 55%, var(--su, #fff));
    border-radius: 24px;
    padding: 20px 20px 18px;
    box-shadow:
      0 1px 0 rgba(255,255,255,.14) inset,
      0 22px 60px rgba(8,10,20,.5),
      0 0 44px color-mix(in srgb, var(--a, #6366f1) 32%, transparent);
    color: var(--ink, #0a0d1a);
    ${REDUCED ? "" : "animation: gtIn .32s cubic-bezier(.34,1.45,.64,1);"}
  }
  .gt-bubble.gt-center {
    top: 50%; transform: translate(-50%, -50%); text-align: center;
    ${REDUCED ? "" : "animation-name: gtInC;"}
  }
  @keyframes gtIn {
    from { opacity: 0; transform: translateX(-50%) translateY(14px) scale(.94); }
    to { opacity: 1; }
  }
  @keyframes gtInC {
    from { opacity: 0; transform: translate(-50%, -46%) scale(.9); }
    to { opacity: 1; }
  }
  .gt-step {
    display: inline-block;
    font: 800 11px/1 'Baloo 2', 'Fredoka', sans-serif;
    letter-spacing: .1em; text-transform: uppercase;
    color: var(--a-txt, var(--a, #6366f1));
    background: color-mix(in srgb, var(--a, #6366f1) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--a, #6366f1) 30%, transparent);
    border-radius: 999px; padding: 6px 11px; margin-bottom: 12px;
  }
  .gt-title {
    font: 800 26px/1.12 'Baloo 2', 'Fredoka', 'Plus Jakarta Sans', sans-serif;
    color: var(--ink, #0a0d1a); margin: 0 0 8px; letter-spacing: -.01em;
    text-wrap: balance;
  }
  .gt-bubble.gt-center .gt-title { font-size: 30px; }
  .gt-text {
    font: 600 15.5px/1.5 'Plus Jakarta Sans', 'Inter', sans-serif;
    color: var(--ink2, #3a3f52); margin: 0 0 18px;
  }
  .gt-actions { display: flex; align-items: center; gap: 12px; }
  .gt-skip {
    flex-shrink: 0;
    background: none; border: none; cursor: pointer;
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif; color: var(--mu, #9aa0b4);
    padding: 10px 6px; min-height: 44px;
    -webkit-tap-highlight-color: transparent;
  }
  .gt-skip:hover { color: var(--ink5, #3a3f52); }
  /* Bouton « plastique 3D » (même famille que les CTA de l'Arène) */
  .gt-next {
    flex: 1;
    border: none; cursor: pointer; position: relative; overflow: hidden;
    font: 800 17px/1 'Baloo 2', 'Fredoka', 'Plus Jakarta Sans', sans-serif;
    letter-spacing: .3px;
    color: var(--a-ink, #fff);
    padding: 0 20px; min-height: 52px; border-radius: 16px;
    background: linear-gradient(180deg,
      var(--a-lt, color-mix(in srgb, var(--a, #6366f1) 70%, #fff)) 0%,
      var(--a, #6366f1) 48%,
      var(--adk, var(--a, #6366f1)) 100%);
    box-shadow:
      0 5px 0 color-mix(in srgb, var(--adk, var(--a, #6366f1)) 72%, #000),
      0 10px 22px color-mix(in srgb, var(--a, #6366f1) 45%, transparent),
      0 1px 0 rgba(255,255,255,.5) inset;
    -webkit-tap-highlight-color: transparent;
    transition: transform .1s, box-shadow .1s;
  }
  .gt-next::after {
    content: ""; position: absolute; top: 3px; left: 10%; right: 10%; height: 36%;
    border-radius: 99px; pointer-events: none;
    background: linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0));
  }
  .gt-next:active {
    transform: translateY(3px);
    box-shadow:
      0 2px 0 color-mix(in srgb, var(--adk, var(--a, #6366f1)) 72%, #000),
      0 5px 12px color-mix(in srgb, var(--a, #6366f1) 40%, transparent),
      0 1px 0 rgba(255,255,255,.4) inset;
  }
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
    window.removeEventListener("hashchange", end);
    ov.remove();
    opts.onDone?.();
  }
  // Changement de route (hash) : la page sous le tour n'existe plus — un
  // tour qui reste affiché recouvre la nouvelle page et bloque tous les taps.
  window.addEventListener("hashchange", end);

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
    elStep.textContent = `Étape ${i + 1}/${steps.length}`;
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
