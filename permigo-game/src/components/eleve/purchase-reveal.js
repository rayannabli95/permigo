// ═══════════════════════════════════════════════════════════════
// Reveal d'achat — célébration plein écran après achat d'un skin.
//
// Flux :
//   1. Jetons dorés qui s'envolent DU solde VERS le skin (variante « dépense »).
//   2. Le skin s'affiche en plein écran avec halo + scale-pop + confetti doré.
//   3. Fermeture manuelle (CTA) ou auto après 3,5 s.
//
// DA : copie le duo halo+ring de level-up.js + confetti de burstConfetti.
// On RECOPIE le CSS (pas de modification de level-up.js).
//
// Usage :
//   import { showPurchaseReveal } from "@/components/eleve/purchase-reveal.js";
//   showPurchaseReveal({
//     item,          // objet item du catalogue { name, asset_url, rarity, type }
//     balanceBadge,  // Element — pastille solde (point de départ des jetons)
//     cost,          // number — montant dépensé (pour l'animation de vol)
//     onClose,       // () => void optionnel
//   });
// ═══════════════════════════════════════════════════════════════
import { volantImg } from "@/utils/volant.js";
import {
  esc,
  escAttr,
  safeAssetUrl,
} from "@/utils/escape.js";
import { haptic } from "@/utils/haptic.js";
import { flyVolants } from "@/components/eleve/volant-reward.js";

// Couleurs des raretés (cohérence boutique)
const RARITY_COLOR = {
  commun: "#3b82f6",
  rare: "#8b5cf6",
  epique: "#c026d3", // magenta/violet chaud (pas orange/alerte)
  legendaire: "#fbbf24",
};

function rarityColor(rarity) {
  return RARITY_COLOR[rarity] ?? RARITY_COLOR.commun;
}

let _busy = false;

/** CSS injecté une seule fois. */
let _cssDone = false;
function _ensureCss() {
  if (_cssDone) return;
  _cssDone = true;
  const s = document.createElement("style");
  s.textContent = `
  /* ── Overlay reveal achat ── */
  .pr-overlay {
    position: fixed; inset: 0; z-index: 10060;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: calc(env(safe-area-inset-top,0px) + 32px) 28px
             calc(env(safe-area-inset-bottom,0px) + 32px);
    background: radial-gradient(130% 100% at 50% 15%, #2a2350 0%, #14112c 48%, #080614 100%);
    text-align: center; overflow: hidden;
    animation: prIn .32s cubic-bezier(.2,.7,.3,1) both;
  }
  @keyframes prIn { from{opacity:0} to{opacity:1} }
  @keyframes prOut { to{opacity:0;transform:scale(.96)} }

  /* Rayons conic (copié de level-up.js .lvlup__rays) */
  .pr-rays {
    position: absolute; inset: -30%;
    background: conic-gradient(from 0deg,rgba(255,210,120,.15) 0 12deg,transparent 12deg 30deg);
    animation: prSpin 16s linear infinite; pointer-events: none;
  }
  @keyframes prSpin { to{transform:rotate(360deg)} }

  /* Halo ring */
  .pr-ring-wrap {
    position: relative; display: inline-block;
    margin-bottom: 22px;
  }
  .pr-ring {
    position: absolute; top: 50%; left: 50%;
    width: 148px; height: 148px; border-radius: 50%;
    transform: translate(-50%,-50%);
    box-shadow: 0 0 0 0 rgba(255,210,120,.55);
    animation: prRing 1.1s ease-out .15s both;
    pointer-events: none;
  }
  @keyframes prRing {
    from { box-shadow: 0 0 0 0 rgba(255,210,120,.55); }
    to   { box-shadow: 0 0 0 72px rgba(255,210,120,0); }
  }
  .pr-asset-wrap {
    width: 148px; height: 148px; border-radius: 24px; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,.06);
    animation: prPop .55s cubic-bezier(.34,1.56,.64,1) both .06s;
    position: relative; z-index: 1;
  }
  .pr-asset-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .pr-asset-emoji { font-size: 64px; line-height: 1; }

  @keyframes prPop { from{opacity:0;transform:scale(.35)} to{opacity:1;transform:scale(1)} }

  .pr-kick {
    font: 800 12px/1 'Archivo', system-ui, sans-serif;
    letter-spacing: .24em; text-transform: uppercase;
    color: #ffd27a; margin-bottom: 10px; position: relative; z-index: 1;
    animation: prPop .4s cubic-bezier(.34,1.56,.64,1) both .22s;
  }
  .pr-name {
    font: 900 28px/1.1 'Archivo', system-ui, sans-serif;
    color: #fff; letter-spacing: -.03em; margin-bottom: 6px;
    position: relative; z-index: 1;
    animation: prPop .45s cubic-bezier(.34,1.56,.64,1) both .28s;
  }
  .pr-sub {
    font: 500 14px/1.5 'Archivo', system-ui, sans-serif;
    color: rgba(255,255,255,.65); max-width: 280px; margin-bottom: 28px;
    position: relative; z-index: 1;
    animation: prPop .4s cubic-bezier(.34,1.56,.64,1) both .34s;
  }
  .pr-cost {
    display: flex; align-items: center; gap: 6px;
    font: 800 16px/1 'IBM Plex Mono', monospace;
    color: rgba(255,255,255,.55); margin-bottom: 28px;
    position: relative; z-index: 1;
    animation: prPop .4s cubic-bezier(.34,1.56,.64,1) both .36s;
  }
  .pr-cta {
    position: relative; z-index: 1;
    padding: 16px 44px; border: 0; border-radius: 16px;
    background: linear-gradient(180deg, #a78bfa, #7c4dff);
    color: #fff; cursor: pointer; min-height: 56px;
    font: 800 16px 'Archivo', system-ui, sans-serif;
    letter-spacing: -.01em;
    box-shadow: 0 8px 22px -6px rgba(124,77,255,.6), 0 2px 0 rgba(0,0,0,.18);
    animation: prPop .4s cubic-bezier(.34,1.56,.64,1) both .42s;
    -webkit-tap-highlight-color: transparent;
  }
  .pr-cta:active { transform: translateY(2px); }

  @media (prefers-reduced-motion:reduce) {
    .pr-rays, .pr-ring { animation: none; }
    .pr-overlay, .pr-overlay * { animation-duration: .01ms !important; }
  }
  `;
  document.head.appendChild(s);
}

/**
 * Plein écran de célébration après un achat réussi.
 * @param {{ item: object, balanceBadge: Element|null, cost: number, onClose?: () => void }} opts
 */
export function showPurchaseReveal({ item, balanceBadge, cost, onClose } = {}) {
  if (_busy) return;
  _busy = true;
  _ensureCss();

  const rColor = rarityColor(item?.rarity);
  const assetUrl = safeAssetUrl(item?.asset_url);

  // Rendu de l'asset (image ou emoji fallback)
  const assetHtml = assetUrl
    ? `<img src="${escAttr(assetUrl)}" alt="${escAttr(item?.name ?? "")}" loading="lazy">`
    : `<span class="pr-asset-emoji">${_typeEmoji(item?.type)}</span>`;

  const el = document.createElement("div");
  el.className = "pr-overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-labelledby", "pr-name");
  el.innerHTML = `
    <div class="pr-rays" aria-hidden="true"></div>
    <div class="pr-kick">Débloqué !</div>
    <div class="pr-ring-wrap">
      <span class="pr-ring" aria-hidden="true"></span>
      <div class="pr-asset-wrap">
        ${assetHtml}
      </div>
    </div>
    <div class="pr-name" id="pr-name">${esc(item?.name ?? "")}</div>
    <div class="pr-sub">Équipé automatiquement sur ton profil !</div>
    ${cost ? `<div class="pr-cost">${volantImg(16)} −${cost} volants dépensés</div>` : ""}
    <button class="pr-cta" id="pr-cta" type="button">Super !</button>
  `;
  el.querySelector(".pr-asset-wrap").style.boxShadow =
    `0 0 48px ${rColor}55`;
  document.body.appendChild(el);

  // Focus sur le CTA (accessibilité)
  requestAnimationFrame(() => {
    el.querySelector("#pr-cta")?.focus();
  });

  // Haptique « unlock » (crescendo)
  haptic("unlock");

  // Jetons qui s'envolent DU solde VERS le skin (variante dépense : jetons partent
  // de la pastille de solde et disparaissent vers le centre de l'écran —
  // l'inverse du gain pour matérialiser la dépense).
  if (balanceBadge && cost > 0) {
    // Petit délai pour que l'overlay soit dans le DOM et visible
    setTimeout(() => {
      flyVolants(Math.min(cost, 8), {
        from: balanceBadge,
        // Pas de target → les jetons disparaissent au centre (effet « absorbé par le skin »)
        target: el.querySelector(".pr-asset-wrap") ?? undefined,
      });
    }, 80);
  }

  // Confetti doré
  import("@/components/common/confetti.js")
    .then(({ burstConfetti }) => {
      burstConfetti?.({
        x: 0.5,
        y: window.innerWidth > 400 ? 0.25 : 0.35,
        count: 55,
        spread: 160,
        power: 1.0,
      });
    })
    .catch(() => {});

  const close = () => {
    if (!el.isConnected) return;
    el.style.animation = "prOut .26s ease both";
    setTimeout(() => {
      el.remove();
      _busy = false;
      try {
        onClose?.();
      } catch {}
    }, 240);
  };

  el.querySelector("#pr-cta")?.addEventListener("click", close);
  // Clic sur le fond = ferme aussi
  el.addEventListener("click", (e) => {
    if (e.target === el) close();
  });
  // Échap
  const onKey = (e) => {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", onKey);
      close();
    }
  };
  document.addEventListener("keydown", onKey);

  // Auto-fermeture après 4 s
  const autoTimer = setTimeout(() => {
    document.removeEventListener("keydown", onKey);
    close();
  }, 4000);
  el.querySelector("#pr-cta")?.addEventListener(
    "click",
    () => clearTimeout(autoTimer),
    { once: true },
  );
}

function _typeEmoji(type) {
  if (type === "avatar") return "🚗";
  if (type === "theme") return "🎨";
  if (type === "permis_bg") return "🖼";
  return "🎁";
}
