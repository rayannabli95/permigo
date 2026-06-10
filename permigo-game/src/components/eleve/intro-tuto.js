// ═══════════════════════════════════════════════════════════════
// Carrousel de tuto réutilisable — mascotte + slides + dots + CTA.
// Généralisation de l'ancien parcours-tuto : chaque tuto fournit
// sa clé localStorage, ses slides et son préfixe analytics.
// Skippable. Respecte prefers-reduced-motion. Esc ferme.
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { playTutoMusic, playWhoosh } from "@/utils/sound.js";

function slideHtml(s, i) {
  return `
    <div class="it-slide" data-slide="${i}">
      <div class="it-art">
        <img class="it-mascot" src="${s.mascot}" alt="" />
        ${s.extra ? `<img class="it-extra" src="${s.extra}" alt="" />` : ""}
      </div>
      <h2 class="it-title">${esc(s.title)}</h2>
      <p class="it-text">${esc(s.text)}</p>
    </div>`;
}

const CSS = `
  .it-tuto{position:fixed;inset:0;z-index:8500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:24px;background:var(--bg);opacity:0;transition:opacity .3s ease;}
  .it-tuto.on{opacity:1;}
  .it-tuto .it-skip{position:absolute;top:calc(env(safe-area-inset-top,0px) + 14px);right:16px;border:0;background:none;color:var(--mu2);font:600 13px/1 'Inter',sans-serif;cursor:pointer;padding:8px 10px;border-radius:8px;-webkit-tap-highlight-color:transparent;}
  .it-tuto .it-skip:hover{color:var(--ink);background:var(--bg2);}
  .it-tuto .it-stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;max-width:420px;width:100%;}
  .it-tuto .it-slide{display:flex;flex-direction:column;align-items:center;gap:8px;animation:itIn .35s cubic-bezier(.34,1.4,.64,1);}
  .it-tuto .it-art{position:relative;width:210px;height:210px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;}
  .it-tuto .it-mascot{width:200px;height:200px;object-fit:contain;filter:drop-shadow(0 14px 28px rgba(10,13,26,.18));animation:itFloat 3s ease-in-out infinite;}
  .it-tuto .it-extra{position:absolute;right:-6px;bottom:6px;width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 6px 14px rgba(10,13,26,.22));animation:itPop .4s .2s cubic-bezier(.34,1.56,.64,1) both;}
  .it-tuto .it-title{font:800 22px/1.2 'Plus Jakarta Sans',sans-serif;color:var(--ink);letter-spacing:-.02em;margin:0;}
  .it-tuto .it-text{font:500 14.5px/1.5 'Inter',sans-serif;color:var(--mu);margin:0;max-width:320px;}
  .it-tuto .it-footer{width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center;gap:18px;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 8px);}
  .it-tuto .it-dots{display:flex;gap:8px;}
  .it-tuto .it-dot{width:8px;height:8px;border-radius:99px;background:var(--bo4);transition:width .25s,background .25s;}
  .it-tuto .it-dot.on{width:22px;background:var(--a);}
  .it-tuto .it-next{width:100%;min-height:52px;border:0;border-radius:16px;color:var(--a-ink);font:800 15px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;background:linear-gradient(to bottom,var(--a-lt) 0%,var(--a) 48%,var(--adk) 100%);box-shadow:0 8px 22px -6px color-mix(in srgb,var(--adk) 55%,transparent),0 1.5px 0 0 rgba(255,255,255,.28) inset;transition:transform .12s,filter .15s;-webkit-tap-highlight-color:transparent;}
  .it-tuto .it-next:active{transform:scale(.98);}
  @keyframes itIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes itFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes itPop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
  @media (prefers-reduced-motion:reduce){.it-tuto,.it-tuto .it-slide,.it-tuto .it-mascot,.it-tuto .it-extra{animation:none!important;transition:none!important;}}
`;

/**
 * Fabrique un tuto carrousel.
 * @param {Object} cfg
 * @param {string} cfg.storageKey   - flag localStorage « vu »
 * @param {Array<{mascot:string,extra?:string,title:string,text:string}>} cfg.slides
 * @param {string} cfg.ariaLabel
 * @param {string} cfg.trackPrefix  - ex: "parcours_tuto" → events .opened/.completed/.skipped
 * @param {string} [cfg.lastCta]    - libellé du bouton sur la dernière slide
 * @param {() => void} [cfg.onDone] - appelé UNIQUEMENT à la complétion (pas au skip)
 * @returns {{show: () => void, maybeShow: () => void}}
 */
export function createTuto({
  storageKey,
  slides,
  ariaLabel,
  trackPrefix,
  lastCta = "C'est parti !",
  onDone,
}) {
  let _overlay = null;
  let _onKey = null;
  let _stopMusic = null;

  function close() {
    const ov = _overlay;
    if (!ov) return;
    _overlay = null;
    if (_stopMusic) {
      _stopMusic();
      _stopMusic = null;
    }
    if (_onKey) {
      document.removeEventListener("keydown", _onKey);
      _onKey = null;
    }
    ov.classList.remove("on");
    setTimeout(() => ov.remove(), 320);
  }

  function show() {
    if (_overlay) return;
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* mode privé strict → on affiche quand même, juste pas mémorisé */
    }
    track(`${trackPrefix}.opened`);

    let idx = 0;
    const total = slides.length;

    const ov = document.createElement("div");
    _overlay = ov;
    ov.className = "it-tuto";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", ariaLabel);
    ov.innerHTML = `
      <style>${CSS}</style>
      <button class="it-skip" type="button">Passer</button>
      <div class="it-stage">${slideHtml(slides[0], 0)}</div>
      <div class="it-footer">
        <div class="it-dots" aria-hidden="true">
          ${slides.map((_, i) => `<span class="it-dot${i === 0 ? " on" : ""}"></span>`).join("")}
        </div>
        <button class="it-next" type="button">${total === 1 ? esc(lastCta) : "Suivant"}</button>
      </div>
    `;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add("on"));

    // Mélodie de fond (coupée à la fermeture)
    _stopMusic = playTutoMusic();

    const stage = ov.querySelector(".it-stage");
    const nextBtn = ov.querySelector(".it-next");
    const dots = ov.querySelectorAll(".it-dot");

    const sync = () => {
      stage.innerHTML = slideHtml(slides[idx], idx);
      dots.forEach((d, i) => d.classList.toggle("on", i === idx));
      nextBtn.textContent = idx === total - 1 ? lastCta : "Suivant";
    };

    nextBtn.addEventListener("click", () => {
      if (idx < total - 1) {
        idx++;
        playWhoosh();
        sync();
      } else {
        track(`${trackPrefix}.completed`);
        close();
        onDone?.();
      }
    });

    ov.querySelector(".it-skip").addEventListener("click", () => {
      track(`${trackPrefix}.skipped`, { slide: idx });
      close();
    });

    _onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", _onKey);
  }

  function maybeShow() {
    let seen = false;
    try {
      seen = !!localStorage.getItem(storageKey);
    } catch {
      seen = false;
    }
    if (!seen) show();
  }

  return { show, maybeShow };
}
