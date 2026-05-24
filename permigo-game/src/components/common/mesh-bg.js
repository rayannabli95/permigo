/**
 * Mesh Background — 6 blobs colorés flous animés, pur CSS.
 *
 * Inspiré de Linear / Stripe / Vercel. Très premium, ~3kb, GPU-accelerated.
 *
 * Usage :
 *   import { renderMeshBg, MESH_BG_CSS } from '@/components/common/mesh-bg.js';
 *
 *   // Dans le <style> de la page :
 *   ${MESH_BG_CSS}
 *
 *   // Dans le HTML, en premier dans le container :
 *   ${renderMeshBg()}
 *
 * Configuration : couleurs prédéfinies (bleu/violet/cyan/indigo).
 * Pour changer la palette, édite les variables `--mb-*` dans le CSS.
 */

export function renderMeshBg() {
  return `
    <div class="mesh-bg" aria-hidden="true">
      <div class="mesh-blob mb-b1"></div>
      <div class="mesh-blob mb-b2"></div>
      <div class="mesh-blob mb-b3"></div>
      <div class="mesh-blob mb-b4"></div>
      <div class="mesh-blob mb-b5"></div>
      <div class="mesh-blob mb-b6"></div>
      <div class="mesh-vignette"></div>
      <div class="mesh-grain"></div>
    </div>
  `;
}

export const MESH_BG_CSS = `
  /* ─── Mesh Background ─── */
  .mesh-bg{
    position:fixed;
    inset:0;
    z-index:0;
    overflow:hidden;
    pointer-events:none;
    background:#0a0a14;
    contain:strict;
  }

  .mesh-blob{
    position:absolute;
    border-radius:50%;
    filter:blur(90px);
    opacity:.5;
    will-change:transform;
    transform:translate3d(0,0,0);
  }
  /* Réduit l'intensité du blur sur mobile pour préserver le GPU */
  @media (max-width:720px){
    .mesh-blob{filter:blur(60px);opacity:.45}
  }

  /* 6 blobs avec couleurs / positions / animations différentes pour un effet organique */
  .mb-b1{width:680px;height:680px;background:#3b82f6;top:-15%;left:-12%;animation:mb-float-1 32s ease-in-out infinite}
  .mb-b2{width:560px;height:560px;background:#8b5cf6;top:25%;right:-18%;animation:mb-float-2 42s ease-in-out infinite}
  .mb-b3{width:520px;height:520px;background:#06b6d4;bottom:-12%;left:25%;animation:mb-float-3 37s ease-in-out infinite}
  .mb-b4{width:480px;height:480px;background:#6366f1;top:45%;left:35%;animation:mb-float-4 48s ease-in-out infinite}
  .mb-b5{width:420px;height:420px;background:#7c3aed;bottom:5%;right:10%;animation:mb-float-5 35s ease-in-out infinite}
  .mb-b6{width:380px;height:380px;background:#0ea5e9;top:8%;left:55%;animation:mb-float-6 44s ease-in-out infinite;opacity:.35}

  @media (max-width:720px){
    .mb-b1{width:420px;height:420px}
    .mb-b2{width:380px;height:380px}
    .mb-b3{width:360px;height:360px}
    .mb-b4{width:340px;height:340px}
    .mb-b5{width:300px;height:300px}
    .mb-b6{width:280px;height:280px}
  }

  /* Animations en boucle — mouvements organiques (translation + scale) */
  @keyframes mb-float-1{
    0%,100%{transform:translate3d(0,0,0) scale(1)}
    33%{transform:translate3d(120px,80px,0) scale(1.1)}
    66%{transform:translate3d(-80px,160px,0) scale(.95)}
  }
  @keyframes mb-float-2{
    0%,100%{transform:translate3d(0,0,0) scale(1)}
    50%{transform:translate3d(-180px,120px,0) scale(1.12)}
  }
  @keyframes mb-float-3{
    0%,100%{transform:translate3d(0,0,0) scale(1)}
    40%{transform:translate3d(140px,-100px,0) scale(1.08)}
    75%{transform:translate3d(-60px,-180px,0) scale(.92)}
  }
  @keyframes mb-float-4{
    0%,100%{transform:translate3d(0,0,0) scale(1)}
    50%{transform:translate3d(220px,-140px,0) scale(1.15)}
  }
  @keyframes mb-float-5{
    0%,100%{transform:translate3d(0,0,0) scale(1)}
    33%{transform:translate3d(-140px,-90px,0) scale(.9)}
    66%{transform:translate3d(100px,60px,0) scale(1.1)}
  }
  @keyframes mb-float-6{
    0%,100%{transform:translate3d(0,0,0) scale(1)}
    50%{transform:translate3d(-160px,180px,0) scale(1.05)}
  }

  /* Vignette sombre pour ramener le focus au centre */
  .mesh-vignette{
    position:absolute;
    inset:0;
    background:radial-gradient(ellipse at center, transparent 0%, rgba(10,10,20,.5) 70%, rgba(10,10,20,.85) 100%);
    pointer-events:none;
  }

  /* Grain subtle (noise) pour finition premium — SVG inline turbulence */
  .mesh-grain{
    position:absolute;
    inset:0;
    opacity:.06;
    mix-blend-mode:overlay;
    pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  @media (max-width:720px){
    .mesh-grain{display:none}
  }

  /* Respect prefers-reduced-motion */
  @media (prefers-reduced-motion:reduce){
    .mesh-blob{animation:none}
  }
`;
