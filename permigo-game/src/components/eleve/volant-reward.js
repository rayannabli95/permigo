// ═══════════════════════════════════════════════════════════════
// Jus monnaie — quand l'élève GAGNE des volants, des jetons dorés
// s'envolent vers le compteur, qui rebondit. C'est le feedback « ludique ».
//
// L'animation est PUREMENT visuelle : le solde réel doit déjà avoir été
// crédité (addGemmes / open_chest) AVANT d'appeler flyVolants — le HUD se
// met à jour seul via l'event `pg-gemmes-changed`. Ici on ajoute le plaisir.
//
// Usage :
//   import { flyVolants } from "@/components/eleve/volant-reward.js";
//   addGemmes(25);              // crédite (truth)
//   flyVolants(25, { from });   // jus (coins qui volent + rebond)
//
//  from   = élément/point d'origine (défaut : centre de l'écran)
//  target = élément cible (défaut : pastille HUD #ghud-gemmes-btn,
//           sinon [data-volant-balance], sinon halo flottant en repli)
// ═══════════════════════════════════════════════════════════════
import { ASSETS } from "@/utils/assets.js";

let _cssDone = false;
function _ensureCss() {
  if (_cssDone) return;
  _cssDone = true;
  const s = document.createElement("style");
  s.textContent = `
  .vol-fly{position:fixed;z-index:9000;pointer-events:none;will-change:transform,opacity;
    filter:drop-shadow(0 4px 8px rgba(120,80,10,.45))}
  .vol-pill-bump{animation:volPillBump .42s cubic-bezier(.34,1.56,.64,1) both}
  @keyframes volPillBump{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}
  .vol-spark{position:fixed;z-index:9001;pointer-events:none;width:8px;height:8px;border-radius:50%;
    background:radial-gradient(circle,#ffe27a,#f5a623);will-change:transform,opacity}
  .vol-fallback{position:fixed;z-index:9000;pointer-events:none;display:flex;align-items:center;gap:6px;
    font:800 17px/1 'Archivo',system-ui,sans-serif;color:#b8860b;
    text-shadow:0 1px 2px rgba(255,255,255,.6);will-change:transform,opacity}
  @media (prefers-reduced-motion:reduce){.vol-fly,.vol-spark{display:none}}
  `;
  document.head.appendChild(s);
}

function _haptic(ms = 14) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

function _centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function _resolveTarget(target) {
  if (target instanceof Element) return target;
  return (
    document.getElementById("ghud-gemmes-btn") ||
    document.querySelector("[data-volant-balance]") ||
    null
  );
}

function _reduced() {
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Petit éclat doré à l'arrivée d'un jeton. */
function _spark(x, y) {
  const sp = document.createElement("div");
  sp.className = "vol-spark";
  sp.style.left = x - 4 + "px";
  sp.style.top = y - 4 + "px";
  document.body.appendChild(sp);
  const a = Math.random() * Math.PI * 2;
  const d = 10 + Math.random() * 16;
  sp.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      {
        transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(0)`,
        opacity: 0,
      },
    ],
    { duration: 360, easing: "cubic-bezier(.2,.7,.3,1)" },
  ).onfinish = () => sp.remove();
}

/** Rebond du compteur cible (pastille HUD ou solde boutique). */
export function bumpVolantPill(target) {
  const t = _resolveTarget(target);
  if (!t) return;
  const node = t.querySelector(".ghud-pill-v, [data-volant-count]") || t;
  node.classList.remove("vol-pill-bump");
  void node.offsetWidth;
  node.classList.add("vol-pill-bump");
}

/**
 * Fait voler `amount` volants depuis `from` vers le compteur.
 * @param {number} amount
 * @param {{from?:Element|{x:number,y:number}, target?:Element}} [opts]
 */
export function flyVolants(amount = 1, opts = {}) {
  const n = Math.max(0, Math.round(Number(amount) || 0));
  if (n <= 0) return;
  _ensureCss();
  _haptic(18);

  const target = _resolveTarget(opts.target);

  // Point de départ : élément, point {x,y}, ou centre écran.
  let from = opts.from;
  if (from instanceof Element) from = _centerOf(from);
  if (!from || typeof from.x !== "number")
    from = { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };

  // Repli sans cible : un « +N volants » doré qui s'élève et s'estompe.
  if (!target || _reduced()) {
    if (_reduced() && target) {
      bumpVolantPill(target);
      return;
    }
    const tag = document.createElement("div");
    tag.className = "vol-fallback";
    tag.style.left = from.x + "px";
    tag.style.top = from.y + "px";
    tag.style.transform = "translate(-50%,-50%)";
    tag.innerHTML = `<img src="${ASSETS.volantCoin}" alt="" width="22" height="22" style="width:22px;height:22px;object-fit:contain"> +${n}`;
    document.body.appendChild(tag);
    tag.animate(
      [
        { transform: "translate(-50%,-50%) scale(.6)", opacity: 0 },
        {
          transform: "translate(-50%,-130%) scale(1)",
          opacity: 1,
          offset: 0.3,
        },
        { transform: "translate(-50%,-260%) scale(1)", opacity: 0 },
      ],
      { duration: 1100, easing: "cubic-bezier(.2,.7,.3,1)" },
    ).onfinish = () => tag.remove();
    return;
  }

  const dest = _centerOf(target);
  const coins = Math.min(n, 14); // on plafonne le nombre de sprites
  const size = 26;

  for (let i = 0; i < coins; i++) {
    const c = document.createElement("img");
    c.src = ASSETS.volantCoin;
    c.alt = "";
    c.className = "vol-fly";
    c.width = size;
    c.height = size;
    c.style.width = size + "px";
    c.style.height = size + "px";
    c.style.left = from.x - size / 2 + "px";
    c.style.top = from.y - size / 2 + "px";
    document.body.appendChild(c);

    // Éclatement initial aléatoire puis convergence vers la cible (arc).
    const burstX = (Math.random() - 0.5) * 120;
    const burstY = -40 - Math.random() * 70;
    const dx = dest.x - from.x;
    const dy = dest.y - from.y;
    const delay = i * 55;
    const dur = 620 + Math.random() * 160;

    const anim = c.animate(
      [
        { transform: "translate(0,0) scale(.5)", opacity: 0 },
        {
          transform: `translate(${burstX}px,${burstY}px) scale(1.1)`,
          opacity: 1,
          offset: 0.28,
        },
        {
          transform: `translate(${dx}px,${dy}px) scale(.45)`,
          opacity: 1,
        },
      ],
      {
        duration: dur,
        delay,
        easing: "cubic-bezier(.5,0,.2,1)",
        fill: "forwards",
      },
    );
    anim.onfinish = () => {
      c.remove();
      _spark(dest.x, dest.y);
      bumpVolantPill(target);
      if (i === coins - 1) _haptic(22);
    };
  }
}
