/**
 * Composant Stacked Cards — empilement de 3 cartes max, écartement au hover.
 *
 * Inspiré du composant Aceternity Stacked Cards Interaction, porté en vanilla CSS + JS.
 *
 * Usage :
 *   import { renderStackedCards, wireStackedCards, STACKED_CARDS_CSS } from '@/components/common/stacked-cards.js';
 *
 *   // 1. Injecter le CSS une fois (inline ou dans le <style> de la page)
 *   // 2. Injecter le markup
 *   root.innerHTML = `<style>${STACKED_CARDS_CSS}</style>${renderStackedCards(cards)}`;
 *   // 3. Wire les click handlers
 *   wireStackedCards(root, (id) => { ... });
 *
 * Items :
 *   { id, title, sub, avatar (initiales), gradient (auto si absent), meta (badge texte optionnel) }
 */

import { esc } from '@/utils/escape.js';

const GRADIENTS = [
  'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
  'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
  'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
  'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
  'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',
  'linear-gradient(135deg,#30cfd0 0%,#330867 100%)',
  'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)',
  'linear-gradient(135deg,#ff9a9e 0%,#fad0c4 100%)',
];

function gradientFor(seed) {
  if (!seed) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function renderStackedCards(items = []) {
  const limited = items.slice(0, 3);
  if (limited.length === 0) return `<div class="sc-empty">Aucun enseignant disponible</div>`;

  return `
    <div class="sc-stage" data-count="${limited.length}">
      ${limited.map((c, i) => {
        const grad = c.gradient || gradientFor(c.id || c.title || String(i));
        const initials = (c.title || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
        return `
          <div class="sc-card sc-card-${i}" data-id="${esc(c.id)}" tabindex="0" role="button" aria-label="Choisir ${esc(c.title || '')}">
            <div class="sc-card-img" style="background:${grad}">
              <div class="sc-card-initials">${esc(initials)}</div>
              ${c.meta ? `<div class="sc-card-meta">${esc(c.meta)}</div>` : ''}
            </div>
            <div class="sc-card-body">
              <h3>${esc(c.title || '')}</h3>
              ${c.sub ? `<p>${esc(c.sub)}</p>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Wire les click handlers. onPick(id) reçoit l'id sélectionné.
 */
export function wireStackedCards(root, onPick) {
  const stage = root.querySelector('.sc-stage');
  if (!stage) return;

  // Hover spread (desktop)
  stage.addEventListener('mouseenter', () => stage.classList.add('sc-spread'));
  stage.addEventListener('mouseleave', () => stage.classList.remove('sc-spread'));

  // Touch / tap reveal (mobile) — premier tap : spread, deuxième : pick
  let isOpen = false;
  stage.addEventListener('touchstart', () => {
    if (!isOpen) {
      stage.classList.add('sc-spread');
      isOpen = true;
    }
  }, { passive: true });

  // Click sur une carte = pick (sauf si elle n'est pas spread et c'est pas la 1ère)
  stage.querySelectorAll('.sc-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const id = card.dataset.id;
      if (typeof onPick === 'function') onPick(id);
    });
    // Keyboard accessible
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

export const STACKED_CARDS_CSS = `
  .sc-stage{
    position:relative;
    width:100%;
    max-width:340px;
    aspect-ratio:340/400;
    margin:0 auto;
    perspective:1000px;
  }
  .sc-card{
    position:absolute;
    inset:0;
    background:var(--su);
    border-radius:22px;
    box-shadow:0 4px 24px -6px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06);
    overflow:hidden;
    cursor:pointer;
    transition:transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .25s;
    transform-origin:center bottom;
    display:flex;
    flex-direction:column;
  }
  .sc-card-0{ z-index:30 }
  .sc-card-1{ z-index:20; transform:translateY(8px) scale(.97) }
  .sc-card-2{ z-index:10; transform:translateY(16px) scale(.94) }

  /* Hover : spread */
  .sc-stage.sc-spread .sc-card-0{ transform:translateY(-6px) scale(1.02) rotate(0deg); z-index:30 }
  .sc-stage.sc-spread .sc-card-1{ transform:translateX(-44px) translateY(8px) rotate(-6deg); z-index:25 }
  .sc-stage.sc-spread .sc-card-2{ transform:translateX(44px) translateY(8px) rotate(6deg); z-index:25 }

  /* Hover sur une carte spread → la mettre en avant */
  .sc-stage.sc-spread .sc-card:hover{
    transform:translateY(-12px) scale(1.04) rotate(0deg) !important;
    z-index:40;
    box-shadow:0 16px 40px -8px rgba(0,0,0,.28), 0 0 0 1px color-mix(in srgb, var(--a) 40%, transparent);
  }

  /* Si une seule carte → pas d'écart */
  .sc-stage[data-count="1"] .sc-card-0{ transform:none }

  .sc-card-img{
    position:relative;
    height:260px;
    margin:10px 10px 0;
    border-radius:16px;
    overflow:hidden;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .sc-card-initials{
    font-family:var(--fd, system-ui);
    font-size:64px;
    font-weight:900;
    color:#fff;
    letter-spacing:-.04em;
    text-shadow:0 4px 24px rgba(0,0,0,.18);
    line-height:1;
  }
  .sc-card-meta{
    position:absolute;
    top:14px;
    right:14px;
    padding:6px 12px;
    background:rgba(255,255,255,.92);
    backdrop-filter:blur(8px);
    border-radius:99px;
    font-size:11px;
    font-weight:800;
    color:#1c1c1c;
    letter-spacing:.2px;
    box-shadow:0 4px 12px rgba(0,0,0,.15);
  }

  .sc-card-body{
    padding:14px 18px 18px;
    flex:1;
    display:flex;
    flex-direction:column;
    justify-content:center;
  }
  .sc-card-body h3{
    font-family:var(--fd, system-ui);
    font-size:18px;
    font-weight:800;
    letter-spacing:-.015em;
    color:var(--ink);
    margin:0 0 4px;
  }
  .sc-card-body p{
    font-size:13px;
    color:var(--mu3);
    margin:0;
    line-height:1.4;
  }

  .sc-empty{
    padding:40px 20px;
    text-align:center;
    color:rgba(255,255,255,.5);
    font-size:13.5px;
  }

  /* Mobile : 1 colonne, juste lift l'active card */
  @media (max-width:520px){
    .sc-stage{max-width:300px;aspect-ratio:300/360}
    .sc-card-img{height:230px}
    .sc-card-initials{font-size:54px}
    .sc-stage.sc-spread .sc-card-1{ transform:translateX(-32px) translateY(8px) rotate(-5deg) }
    .sc-stage.sc-spread .sc-card-2{ transform:translateX(32px) translateY(8px) rotate(5deg) }
  }
`;
