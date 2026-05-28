/**
 * Confetti burst — effet "feu d'artifice" pour célébrer une réussite.
 *
 * Usage :
 *   import { burstConfetti } from '@/components/common/confetti.js';
 *   burstConfetti();              // depuis le centre haut
 *   burstConfetti({ x: 0.5, y: 0.3, count: 80 });  // position + intensité
 *
 * Pas de dépendance externe — Canvas 2D pur, recyclage de particules.
 * Auto-cleanup quand toutes les particules sont sorties.
 */

const COLORS = [
  'var(--a)', 'var(--pu)', 'var(--bl)', 'var(--gr)',
  'var(--am)', 'var(--rd)', '#ec4899', 'var(--aml2)',
];

let _canvas = null;
let _ctx = null;
let _particles = [];
let _raf = null;

function ensureCanvas() {
  if (_canvas) return;
  _canvas = document.createElement('canvas');
  _canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998';
  _canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  if (!_canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  _canvas.width = window.innerWidth * dpr;
  _canvas.height = window.innerHeight * dpr;
  _ctx.scale(dpr, dpr);
}

export function burstConfetti(opts = {}) {
  // Respect prefers-reduced-motion
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  ensureCanvas();

  const count = opts.count || 90;
  const x = (opts.x ?? 0.5) * window.innerWidth;
  const y = (opts.y ?? 0.25) * window.innerHeight;
  const spread = opts.spread || Math.PI * 0.6;
  const power = opts.power || 14;

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
    const speed = power * (0.6 + Math.random() * 0.8);
    _particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.32 + Math.random() * 0.1,
      drag: 0.985,
      size: 5 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      life: 0,
      maxLife: 90 + Math.random() * 40,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }

  if (!_raf) loop();
}

function loop() {
  _raf = requestAnimationFrame(loop);
  _ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = _particles.length - 1; i >= 0; i--) {
    const p = _particles[i];
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;
    p.life++;

    // Fade out à la fin
    const lifeRatio = p.life / p.maxLife;
    const opacity = lifeRatio < 0.7 ? 1 : 1 - (lifeRatio - 0.7) / 0.3;

    _ctx.save();
    _ctx.translate(p.x, p.y);
    _ctx.rotate(p.rotation);
    _ctx.globalAlpha = Math.max(0, opacity);
    _ctx.fillStyle = p.color;
    if (p.shape === 'rect') {
      _ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      _ctx.beginPath();
      _ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      _ctx.fill();
    }
    _ctx.restore();

    // Retire si hors écran ou mort
    if (p.life > p.maxLife || p.y > window.innerHeight + 50) {
      _particles.splice(i, 1);
    }
  }

  if (_particles.length === 0) {
    cancelAnimationFrame(_raf);
    _raf = null;
    _ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

/** Burst depuis un élément DOM (centré sur lui). */
export function burstConfettiFromElement(el, opts = {}) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  burstConfetti({
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
    ...opts,
  });
}
