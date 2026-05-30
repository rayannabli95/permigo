/**
 * Cosmos Background — starfield canvas 2D animé avec parallax au scroll.
 *
 * Inspiré du composant "HORIZON" Three.js mais en canvas 2D pur :
 *  - 3 layers d'étoiles (z-depth simulée par taille + vitesse)
 *  - Parallax au scroll (les layers loin bougent peu, les proches bougent fort)
 *  - Twinkle subtil (opacity wave)
 *  - Camera "floating" continue (rotation lente du field)
 *  - Couleur stars : blanc / jaune pâle / bleu pâle (variation HSL)
 *
 * Aucune dépendance externe — perfs mobiles garanties.
 *
 * Usage :
 *   import { mountCosmos, unmountCosmos } from '@/components/common/cosmos-bg.js';
 *   const cosmos = mountCosmos(parentEl);  // monte un <canvas> position:absolute
 *   cosmos.destroy();                       // cleanup
 */

const LAYER_COUNTS = [800, 500, 300];      // étoiles par layer (loin → proche)
const LAYER_SPEEDS = [0.02, 0.06, 0.14];   // vitesse parallax scroll
const LAYER_SIZES  = [[0.4, 1.2], [0.8, 1.8], [1.2, 2.6]]; // [min, max] taille px

export function mountCosmos(parent) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity .6s ease';
  parent.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // A11y : si l'utilisateur réduit les animations, on rend un ciel étoilé
  // STATIQUE (une seule frame, sans scintillement ni parallax).
  const REDUCED = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0;
  let layers = [];
  let rafId = null;
  let scrollY = 0;
  let time = 0;

  const resize = () => {
    W = parent.clientWidth;
    H = parent.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    generateStars();
    if (REDUCED) paint();    // repeindre la frame statique après resize
  };

  const generateStars = () => {
    layers = LAYER_COUNTS.map((count, layerIdx) => {
      const [minSize, maxSize] = LAYER_SIZES[layerIdx];
      const stars = [];
      for (let i = 0; i < count; i++) {
        const colorChoice = Math.random();
        let hsl;
        if (colorChoice < 0.7)      hsl = `hsl(0,0%,${75 + Math.random() * 20}%)`;       // blanc
        else if (colorChoice < 0.9) hsl = `hsl(45,55%,${70 + Math.random() * 15}%)`;     // jaune doux
        else                        hsl = `hsl(220,55%,${75 + Math.random() * 15}%)`;    // bleu pâle
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          size: minSize + Math.random() * (maxSize - minSize),
          color: hsl,
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.4 + Math.random() * 0.8,
        });
      }
      return { stars, speed: LAYER_SPEEDS[layerIdx] };
    });
  };

  const onScroll = () => {
    scrollY = window.scrollY || window.pageYOffset || 0;
  };

  // Rendu d'une frame. En reduced-motion : pas de floating, pas de twinkle.
  const paint = () => {
    ctx.clearRect(0, 0, W, H);

    // Rotation très lente du field (camera floating) — neutralisée si reduced-motion
    const camX = REDUCED ? 0 : Math.sin(time * 0.1) * 6;
    const camY = REDUCED ? 0 : Math.cos(time * 0.13) * 4;

    for (let li = 0; li < layers.length; li++) {
      const { stars, speed } = layers[li];
      const offsetY = (scrollY * speed) % H;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // Position avec parallax + floating
        let x = s.x + camX * (li + 1);
        let y = (s.y - offsetY + H) % H + camY * (li + 1);
        // Twinkle : opacity sinusoidale (fixe si reduced-motion)
        const alpha = REDUCED ? 0.8 : 0.55 + 0.45 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fill();
        // Halo pour les grosses étoiles
        if (s.size > 1.6) {
          ctx.globalAlpha = alpha * 0.25;
          ctx.beginPath();
          ctx.arc(x, y, s.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  const draw = () => {
    rafId = requestAnimationFrame(draw);
    time += 0.012;
    paint();
  };

  // Init
  resize();
  if (REDUCED) {
    paint();                 // une seule frame, aucune boucle
  } else {
    draw();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  // Fade-in après init
  requestAnimationFrame(() => { canvas.style.opacity = '1'; });

  window.addEventListener('resize', resize);

  return {
    canvas,
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      canvas.remove();
    },
  };
}
