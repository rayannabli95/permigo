/**
 * Section "Lampe" — effet de halo conique premium (inspiré Aceternity Lamp).
 *
 * Reveal au scroll (IntersectionObserver) : la lampe s'ouvre, la ligne s'étend,
 * le glow s'allume, le titre monte. Pure vanilla JS + CSS (pas de framer-motion).
 *
 * Usage :
 *   import { renderLampSection } from '@/components/common/lamp-section.js';
 *   const html = renderLampSection({ title: '...', sub: '...' });
 *
 * Puis appeler `wireLampReveal(rootEl)` après injection dans le DOM.
 */

export function renderLampSection({ title, sub, eyebrow } = {}) {
  return `
    <section class="lamp-section">
      <div class="lamp-stage">
        <!-- Cône lumineux gauche -->
        <div class="lamp-cone lamp-cone-l">
          <div class="lamp-cone-mask-bottom"></div>
          <div class="lamp-cone-mask-right"></div>
        </div>
        <!-- Cône lumineux droit -->
        <div class="lamp-cone lamp-cone-r">
          <div class="lamp-cone-mask-bottom"></div>
          <div class="lamp-cone-mask-left"></div>
        </div>
        <!-- Plate-forme sombre qui coupe la base -->
        <div class="lamp-floor-blur"></div>
        <div class="lamp-floor-glass"></div>
        <!-- Glow central (halo) -->
        <div class="lamp-glow"></div>
        <!-- Faisceau intense en U inversé -->
        <div class="lamp-beam"></div>
        <!-- Ligne horizontale lumineuse -->
        <div class="lamp-line"></div>
        <!-- Plate-forme du dessus qui masque tout au-dessus -->
        <div class="lamp-top-mask"></div>

        <!-- Contenu (titre + sous-titre) -->
        <div class="lamp-content">
          ${eyebrow ? `<div class="lamp-eyebrow">${eyebrow}</div>` : ''}
          <h2 class="lamp-title">${title || ''}</h2>
          ${sub ? `<p class="lamp-sub">${sub}</p>` : ''}
        </div>
      </div>
    </section>
  `;
}

/** Active l'animation reveal-on-view quand la section entre dans le viewport. */
export function wireLampReveal(root) {
  const sec = root.querySelector('.lamp-section');
  if (!sec) return;

  if (!('IntersectionObserver' in window)) {
    sec.classList.add('lamp-in');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        sec.classList.add('lamp-in');
        io.unobserve(sec);
      }
    }
  }, { threshold: 0.35 });
  io.observe(sec);
}

/** CSS de la section. À injecter une fois (depuis la landing). */
export const LAMP_CSS = `
  .lamp-section{
    position:relative;
    z-index:5;
    width:100%;
    min-height:560px;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
    background:transparent;
    margin:40px 0 60px;
  }
  @media (max-width:720px){
    .lamp-section{min-height:420px;margin:20px 0 40px}
  }

  .lamp-stage{
    position:relative;
    flex:1;
    display:flex;
    align-items:center;
    justify-content:center;
    width:100%;
    isolation:isolate;
    transform:scaleY(1.25);
  }

  /* ── Les 2 cônes coniques (gauche / droite) ───────── */
  .lamp-cone{
    position:absolute;
    inset:auto;
    top:0;
    height:220px;
    width:240px;
    opacity:.5;
    background-image:conic-gradient(from var(--lp-pos, 70deg) at center top, #22d3ee, transparent 30%);
    transition:opacity .8s ease-in-out, width .9s ease-in-out;
  }
  .lamp-cone-l{ right:50%; --lp-pos:from 70deg at center top; }
  .lamp-cone-r{ left:50%;  --lp-pos:from 290deg at center top; }
  .lamp-in .lamp-cone{ opacity:1; width:480px; }
  @media (max-width:720px){
    .lamp-cone{height:160px;width:160px}
    .lamp-in .lamp-cone{width:320px}
  }

  /* Masques pour donner la forme de cône (dégradé vers le bas / vers le côté) */
  .lamp-cone-mask-bottom{
    position:absolute;
    left:0;bottom:0;
    width:100%;height:160px;
    background:#0b0d1a;
    z-index:20;
    -webkit-mask-image:linear-gradient(to top, white, transparent);
            mask-image:linear-gradient(to top, white, transparent);
  }
  .lamp-cone-mask-right{
    position:absolute;
    left:0;bottom:0;
    width:160px;height:100%;
    background:#0b0d1a;
    z-index:20;
    -webkit-mask-image:linear-gradient(to right, white, transparent);
            mask-image:linear-gradient(to right, white, transparent);
  }
  .lamp-cone-mask-left{
    position:absolute;
    right:0;bottom:0;
    width:160px;height:100%;
    background:#0b0d1a;
    z-index:20;
    -webkit-mask-image:linear-gradient(to left, white, transparent);
            mask-image:linear-gradient(to left, white, transparent);
  }

  /* ── Plate-forme du sol qui masque le bas des cônes ── */
  .lamp-floor-blur{
    position:absolute;
    top:50%;
    width:100%;
    height:192px;
    transform:translateY(48px) scaleX(1.5);
    background:#0b0d1a;
    filter:blur(28px);
    z-index:30;
  }
  .lamp-floor-glass{
    position:absolute;
    top:50%;
    width:100%;
    height:192px;
    z-index:50;
    background:transparent;
    opacity:.1;
    backdrop-filter:blur(8px);
    -webkit-backdrop-filter:blur(8px);
  }

  /* ── Glow central qui s'allume ── */
  .lamp-glow{
    position:absolute;
    inset:auto;
    top:50%;
    width:448px;
    height:144px;
    transform:translateY(-50%);
    border-radius:9999px;
    background:#22d3ee;
    opacity:0;
    filter:blur(64px);
    transition:opacity .9s ease-in-out;
    z-index:50;
  }
  .lamp-in .lamp-glow{ opacity:.5 }

  /* ── Faisceau intense en U inversé ── */
  .lamp-beam{
    position:absolute;
    inset:auto;
    top:50%;
    width:128px;
    height:144px;
    transform:translateY(-6rem);
    border-radius:9999px;
    background:#67e8f9;
    filter:blur(28px);
    z-index:30;
    transition:width .9s ease-in-out;
  }
  .lamp-in .lamp-beam{ width:256px }

  /* ── Ligne horizontale lumineuse ── */
  .lamp-line{
    position:absolute;
    inset:auto;
    top:50%;
    width:240px;
    height:2px;
    transform:translateY(-7rem);
    background:#22d3ee;
    z-index:50;
    box-shadow:0 0 24px #22d3ee99;
    transition:width .9s ease-in-out;
  }
  .lamp-in .lamp-line{ width:480px }
  @media (max-width:720px){
    .lamp-line{width:160px}
    .lamp-in .lamp-line{width:320px}
  }

  /* ── Masque haut : cache tout ce qui dépasse au-dessus de la ligne ── */
  .lamp-top-mask{
    position:absolute;
    inset:auto;
    top:50%;
    width:100%;
    height:11rem;
    transform:translateY(-12.5rem);
    background:#0b0d1a;
    z-index:40;
  }

  /* ── Contenu titre / sous-titre ── */
  .lamp-content{
    position:relative;
    z-index:60;
    transform:translateY(-19rem);
    display:flex;
    flex-direction:column;
    align-items:center;
    padding:0 20px;
    text-align:center;
    opacity:0;
    transition:opacity .8s ease-out .4s, transform .8s ease-out .4s;
  }
  .lamp-in .lamp-content{
    opacity:1;
    transform:translateY(-19rem) translateY(-12px);
  }
  @media (max-width:720px){
    .lamp-content{transform:translateY(-13rem)}
    .lamp-in .lamp-content{transform:translateY(-13rem) translateY(-8px)}
  }

  .lamp-eyebrow{
    font-family:var(--fn);
    font-size:11px;
    font-weight:800;
    letter-spacing:3px;
    text-transform:uppercase;
    color:#67e8f9;
    margin-bottom:14px;
    opacity:.85;
  }
  .lamp-title{
    font-family:var(--fd);
    font-weight:600;
    font-size:42px;
    letter-spacing:-.03em;
    line-height:1.05;
    margin:0 0 14px;
    background:linear-gradient(180deg, #e2e8f0, #64748b);
    -webkit-background-clip:text;
            background-clip:text;
    color:transparent;
    -webkit-text-fill-color:transparent;
    max-width:880px;
  }
  @media (min-width:900px){
    .lamp-title{font-size:64px}
  }
  @media (max-width:560px){
    .lamp-title{font-size:30px}
  }
  .lamp-sub{
    color:rgba(255,255,255,.6);
    font-size:15px;
    line-height:1.55;
    max-width:560px;
    margin:0;
    letter-spacing:-.005em;
  }
`;
