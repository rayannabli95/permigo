// ═══════════════════════════════════════════════════════════════
// Permis Card — pass Apple Wallet évolutif (carte qui se débloque)
// État : formation (0-30%) → pret (30-70%) → validé (70-100%)
// Couleurs + sceau changent selon le % de compétences validées
// Pas de NEPH, pas de mention "République" (règle PermiGo)
// ═══════════════════════════════════════════════════════════════
import { esc } from '@/utils/escape.js';

const STYLE = `<style>
.pc-wrap {
  perspective: 1200px;
  padding: 16px 0;
  display: flex;
  justify-content: center;
}
.pc {
  position: relative;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 1 / 1.58;
  border-radius: 24px;
  padding: 24px 20px 20px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform .4s cubic-bezier(.2,.7,.3,1), box-shadow .4s ease;
  isolation: isolate;
  user-select: none;
  -webkit-user-select: none;
}

/* Shine effect au touch / hover */
.pc::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 35%, rgba(255,255,255,.22) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s cubic-bezier(.2,.7,.3,1);
  pointer-events: none;
  z-index: 1;
}
.pc:hover::before, .pc:active::before { transform: translateX(100%); }

/* Grain texture pour effet matière */
.pc::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255,255,255,.04) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* ─── États visuels ─── */
.pc.s-formation {
  background:
    linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%);
  box-shadow:
    0 10px 30px -10px rgba(100,116,139,.5),
    0 4px 12px rgba(10,13,26,.08);
}
.pc.s-pret {
  background:
    linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #8b5cf6 100%);
  box-shadow:
    0 16px 40px -12px rgba(99,102,241,.55),
    0 4px 12px rgba(10,13,26,.1);
}
.pc.s-valide {
  background:
    linear-gradient(135deg, #d97706 0%, #f59e0b 40%, #fde68a 100%);
  box-shadow:
    0 20px 50px -10px rgba(245,158,11,.6),
    0 0 0 1px rgba(254,243,199,.4),
    0 4px 12px rgba(10,13,26,.1);
  animation: pcGlow 3s ease-in-out infinite;
}
@keyframes pcGlow {
  0%, 100% {
    box-shadow:
      0 20px 50px -10px rgba(245,158,11,.5),
      0 0 0 1px rgba(254,243,199,.4),
      0 4px 12px rgba(10,13,26,.1);
  }
  50% {
    box-shadow:
      0 24px 60px -8px rgba(245,158,11,.75),
      0 0 0 1px rgba(254,243,199,.6),
      0 4px 12px rgba(10,13,26,.1);
  }
}

/* ─── Sections ─── */
.pc-inner { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; }

.pc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: auto;
}
.pc-flag {
  width: 28px; height: 20px;
  border-radius: 4px;
  background: linear-gradient(90deg, #002395 33.33%, #fff 33.33% 66.66%, #ED2939 66.66%);
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,.15);
}
.pc-brand {
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .04em;
  background: rgba(255,255,255,.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 99px;
  border: 1px solid rgba(255,255,255,.22);
}

.pc-label {
  font: 600 9.5px/1 'Inter', sans-serif;
  letter-spacing: .18em;
  text-transform: uppercase;
  opacity: .82;
  margin: 16px 0 4px;
}
.pc-title {
  font: 700 19px/1.15 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.01em;
  margin: 0 0 2px;
}
.pc-subtitle {
  font: 500 11px/1 'Inter', sans-serif;
  opacity: .75;
  margin: 0 0 18px;
}

/* Avatar + nom inline */
.pc-id {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.pc-av {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(255,255,255,.16);
  border: 1.5px solid rgba(255,255,255,.3);
  display: flex; align-items: center; justify-content: center;
  font: 700 18px/1 'Plus Jakarta Sans', sans-serif;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.pc-id-info { min-width: 0; }
.pc-nom {
  font: 700 16px/1.2 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-prenom {
  font: 500 12px/1 'Inter', sans-serif;
  opacity: .82;
  margin-top: 3px;
}

/* Meta rows */
.pc-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.pc-meta-item {
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 10px;
  padding: 8px 10px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.pc-meta-lbl {
  font: 600 9px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: .72;
  margin-bottom: 4px;
}
.pc-meta-val {
  font: 600 12px/1.2 'Inter', sans-serif;
}

/* Footer : progression + sceau */
.pc-foot { margin-top: auto; display: flex; align-items: flex-end; gap: 12px; }
.pc-prog { flex: 1; min-width: 0; }
.pc-prog-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.pc-prog-lbl {
  font: 600 9.5px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: .78;
}
.pc-prog-pct {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.02em;
}
.pc-prog-bar {
  height: 5px;
  background: rgba(0,0,0,.18);
  border-radius: 99px;
  overflow: hidden;
}
.pc-prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,.85) 100%);
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}

/* Sceau / cachet */
.pc-sceau {
  flex-shrink: 0;
  width: 70px; height: 70px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2px solid currentColor;
  font: 800 8px/1.05 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .04em;
  text-transform: uppercase;
  transform: rotate(-8deg);
  padding: 4px;
  background: rgba(255,255,255,.96);
}
.pc.s-formation .pc-sceau { color: #b91c1c; }
.pc.s-pret      .pc-sceau { color: #b45309; }
.pc.s-valide    .pc-sceau {
  color: #047857;
  animation: pcSceauPulse 2.4s ease-in-out infinite;
}
.pc-sceau-ico { font-size: 14px; line-height: 1; margin-bottom: 2px; }
@keyframes pcSceauPulse {
  0%, 100% { transform: rotate(-8deg) scale(1); }
  50%      { transform: rotate(-8deg) scale(1.06); }
}

/* Hint sous la carte */
.pc-hint {
  text-align: center;
  font: 500 11px/1.4 'Inter', sans-serif;
  color: #94a3b8;
  margin-top: 12px;
  padding: 0 24px;
}

@media (prefers-reduced-motion: reduce) {
  .pc, .pc::before, .pc.s-valide, .pc.s-valide .pc-sceau { animation: none !important; transition: none !important; }
}
</style>`;

/**
 * Détermine l'état visuel selon le % de complétion
 */
function getState(pct) {
  if (pct >= 70) return { key: 'valide', label: 'Validé', ico: '✓' };
  if (pct >= 30) return { key: 'pret',   label: "Prêt à l'examen", ico: '◐' };
  return { key: 'formation', label: 'En formation', ico: '◯' };
}

/**
 * Génère les initiales depuis prenom+nom
 */
function initials(prenom, nom) {
  const p = (prenom || '').trim()[0] || '';
  const n = (nom || '').trim()[0] || '';
  return (p + n).toUpperCase() || '?';
}

/**
 * Formate date YYYY-MM-DD → DD/MM/YYYY
 */
function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

/**
 * Render la carte permis.
 * @param {Object} opts
 * @param {string} opts.prenom
 * @param {string} opts.nom
 * @param {string} opts.created_at - date début formation (ISO)
 * @param {number} opts.validated  - nb compétences validées
 * @param {number} opts.total      - total compétences REMC (31)
 */
export function renderPermisCard({ prenom = '', nom = '', created_at = null, validated = 0, total = 31 }) {
  const pct = Math.min(100, Math.round((validated / total) * 100));
  const state = getState(pct);
  const ini = initials(prenom, nom);

  return `${STYLE}
<div class="pc-wrap">
  <div class="pc s-${state.key}" role="img" aria-label="Carte permis - ${esc(state.label)}">
    <div class="pc-inner">

      <div class="pc-top">
        <div class="pc-flag" aria-hidden="true"></div>
        <div class="pc-brand">PermiGo</div>
      </div>

      <div class="pc-label">Permis de conduire</div>
      <div class="pc-title">Catégorie B</div>
      <div class="pc-subtitle">Véhicules légers · Apprentissage</div>

      <div class="pc-id">
        <div class="pc-av">${esc(ini)}</div>
        <div class="pc-id-info">
          <div class="pc-nom">${esc(nom || prenom || '—')}</div>
          <div class="pc-prenom">${esc(prenom || '')}</div>
        </div>
      </div>

      <div class="pc-meta">
        <div class="pc-meta-item">
          <div class="pc-meta-lbl">Début formation</div>
          <div class="pc-meta-val">${esc(formatDate(created_at))}</div>
        </div>
        <div class="pc-meta-item">
          <div class="pc-meta-lbl">Compétences</div>
          <div class="pc-meta-val">${validated} / ${total}</div>
        </div>
      </div>

      <div class="pc-foot">
        <div class="pc-prog">
          <div class="pc-prog-row">
            <span class="pc-prog-lbl">Prêt examen</span>
            <span class="pc-prog-pct">${pct}%</span>
          </div>
          <div class="pc-prog-bar">
            <div class="pc-prog-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="pc-sceau" aria-hidden="true">
          <div class="pc-sceau-ico">${state.ico}</div>
          <div>${esc(state.label)}</div>
        </div>
      </div>

    </div>
  </div>
</div>
<div class="pc-hint">Ta carte évolue à chaque compétence validée. Vise les 100% pour la passer en or.</div>`;
}

/**
 * Mount + branche le tilt 3D sur touch/mouse
 */
export function mountPermisCard(container, opts) {
  container.innerHTML = renderPermisCard(opts);
  const card = container.querySelector('.pc');
  if (!card) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let raf = null;
  function onMove(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    const rx = ((y / rect.height) - 0.5) * -8;
    const ry = ((x / rect.width)  - 0.5) *  8;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  }
  function onLeave() {
    cancelAnimationFrame(raf);
    card.style.transform = '';
  }
  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseleave', onLeave);
  card.addEventListener('touchmove', onMove, { passive: true });
  card.addEventListener('touchend', onLeave);
}
