// ═══════════════════════════════════════════════════════════════
// Élève — Trophées (Clash Royale ADN)
// RPC : get_my_achievements()
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { haptic } from '@/utils/haptic.js';
import { toast } from '@/components/common/toast.js';
import { enableSheetSwipe } from '@/utils/sheet-swipe.js';
import { CATALOG, RARITY_META, shortProgress } from '@/data/achievements.js';

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
.tr2 {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 100px;
  background: var(--bg);
  min-height: 100dvh;
  font-family: 'Inter', sans-serif;
}

/* ── Skeleton ── */
.tr2-skel {
  background: linear-gradient(90deg, var(--bg2) 0%, var(--bo) 50%, var(--bg2) 100%);
  background-size: 200% 100%;
  animation: tr2Shim 1.4s ease-in-out infinite;
  border-radius: 16px;
}
@keyframes tr2Shim { from{background-position:200% 0} to{background-position:-200% 0} }

/* ── Hero sticky ── */
.tr2-hero {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
  background: linear-gradient(160deg, #1e1b4b 0%, #312e81 60%, var(--adk) 100%);
  padding: 16px 20px 20px;
  overflow: hidden;
}
.tr2-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 70% at 10% 30%, rgba(167,139,250,.35) 0%, transparent 55%),
              radial-gradient(ellipse 50% 60% at 90% 80%, rgba(88,204,2,.2) 0%, transparent 50%);
  pointer-events: none;
}
.tr2-hero-inner { position: relative; z-index: 1; }
.tr2-hero-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.tr2-hero-title {
  font: 800 22px/1.1 'Plus Jakarta Sans', sans-serif;
  color: #fff; letter-spacing: -.03em;
}
.tr2-hero-count {
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: rgba(255,255,255,.7);
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 99px; padding: 5px 10px;
}
.tr2-progress-wrap { display: flex; flex-direction: column; gap: 5px; }
.tr2-progress-bar {
  height: 6px; background: rgba(255,255,255,.2);
  border-radius: 99px; overflow: hidden;
}
.tr2-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,.6) 100%);
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}
.tr2-progress-hint {
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.5);
}

/* ── Accès Galerie ── */
.tr2-galerie {
  display: flex; align-items: center; gap: 12px;
  margin: 14px 16px 0; padding: 12px 14px;
  background: var(--bg2); border: 1px solid var(--bo);
  border-radius: 16px; cursor: pointer; text-decoration: none; color: inherit;
  transition: transform .15s, border-color .15s;
}
.tr2-galerie:hover { transform: translateY(-1px); border-color: #a78bfa; }
.tr2-galerie:active { transform: scale(.99); }
.tr2-galerie-ico {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(167,139,250,.16); color: #a78bfa;
}
.tr2-galerie-tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.tr2-galerie-t { font: 800 15px/1.1 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.02em; }
.tr2-galerie-s { font: 500 12px/1.2 'Inter', sans-serif; color: var(--mu); }
.tr2-galerie-arrow { flex-shrink: 0; color: var(--mu); display: flex; }

/* ── Section label ── */
.tr2-group-label {
  padding: 20px 16px 10px;
  font: 700 11px/1 'Inter', sans-serif;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--mu2);
}

/* ── Grille 3 colonnes ── */
.tr2-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px; padding: 0 12px;
}

/* ── Card trophée ── */
.tr2-card {
  position: relative;
  border-radius: 18px;
  padding: 14px 8px 12px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: transform .14s cubic-bezier(.34,1.56,.64,1), opacity .12s;
  overflow: hidden; min-height: 100px; user-select: none;
}
.tr2-card:active { transform: scale(.93); opacity: .9; }
.tr2-card.locked { background: var(--su); border: 1px solid var(--bo); }
.tr2-card.locked .tr2-card-emoji { filter: grayscale(1) brightness(.4); opacity: .5; }
/* Mix-blend-mode multiply pour les PNG avec fond blanc (le blanc devient invisible sur card colorée) */
.tr2-card-emoji img { mix-blend-mode: multiply; }
.tr2-card.commun    { background: linear-gradient(145deg,var(--mu4),var(--mu3)); box-shadow: 0 4px 16px -4px rgba(100,116,139,.5); }
.tr2-card.rare      { background: linear-gradient(145deg,var(--blk2),#60a5fa); box-shadow: 0 4px 16px -4px rgba(59,130,246,.6); }
.tr2-card.epique    { background: linear-gradient(145deg,#6d28d9,#a78bfa); box-shadow: 0 4px 16px -4px rgba(139,92,246,.6); }
.tr2-card.legendaire {
  background: linear-gradient(145deg,var(--amx),var(--aml2));
  animation: tr2GoldGlow 2.5s ease-in-out infinite alternate;
}
@keyframes tr2GoldGlow {
  from { box-shadow: 0 4px 24px -4px rgba(245,158,11,.7); }
  to   { box-shadow: 0 4px 32px -2px rgba(251,191,36,1), 0 0 0 1px rgba(251,191,36,.4); }
}
.tr2-card-rarity {
  position: absolute; top: 7px; right: 7px;
  width: 6px; height: 6px; border-radius: 50%;
}
.tr2-card.commun    .tr2-card-rarity { background: rgba(255,255,255,.5); }
.tr2-card.rare      .tr2-card-rarity { background: rgba(255,255,255,.7); }
.tr2-card.epique    .tr2-card-rarity { background: rgba(255,255,255,.8); box-shadow: 0 0 6px rgba(255,255,255,.6); }
.tr2-card.legendaire .tr2-card-rarity { background: #fff; box-shadow: 0 0 8px rgba(255,255,255,.9); }
.tr2-card-emoji { font-size: 28px; line-height: 1; transition: transform .2s; }
.tr2-card:not(.locked):active .tr2-card-emoji { transform: scale(1.15); }
.tr2-card-name {
  font: 700 10px/1.2 'Plus Jakarta Sans', sans-serif;
  text-align: center; letter-spacing: -.005em;
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.tr2-card.locked .tr2-card-name { color: var(--mu2); }
.tr2-card:not(.locked) .tr2-card-name { color: rgba(255,255,255,.9); }
.tr2-card-mystery { font: 700 10px/1 'IBM Plex Mono', monospace; color: var(--mu); }

/* ── Modal ── */
.tr2-modal-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 500; display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
  animation: tr2FadeBg .2s ease both;
}
@keyframes tr2FadeBg { from{opacity:0} to{opacity:1} }
.tr2-modal {
  width: 100%; max-width: 480px; border-radius: 28px 28px 0 0;
  padding: 0 0 32px; overflow: hidden;
  animation: tr2ModalUp .28s cubic-bezier(.32,.72,0,1) both;
}
@keyframes tr2ModalUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
.tr2-modal-glow {
  height: 160px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; position: relative; overflow: hidden;
}
.tr2-modal { touch-action: none; }
.tr2-modal-handle { width: 36px; height: 4px; background: rgba(255,255,255,.3); border-radius: 2px; margin: 14px auto 0; cursor: grab; }
.tr2-modal-locked-handle { width: 36px; height: 4px; background: var(--bo); border-radius: 2px; margin: 14px auto 0; cursor: grab; }
.tr2-modal-emoji {
  font-size: 60px; position: relative; z-index: 1;
  animation: tr2EmojiIn .5s .1s cubic-bezier(.34,1.56,.64,1) both;
  filter: drop-shadow(0 0 18px rgba(255,255,255,.6));
}
/* PNG badge cadré en cercle (cache le damier de transparence baked dans l'asset) */
.tr2-modal-emoji:has(img) {
  width: 120px; height: 120px; border-radius: 50%; overflow: hidden;
  margin: 0 auto; display: flex; align-items: center; justify-content: center;
  filter: drop-shadow(0 6px 18px rgba(0,0,0,.25));
}
.tr2-modal-emoji img { width: 160%; height: 160%; object-fit: cover; mix-blend-mode: normal !important; }
.tr2-modal-locked-ico:has(img) {
  width: 110px; height: 110px; border-radius: 50%; overflow: hidden;
  margin: 0 auto; display: flex; align-items: center; justify-content: center;
}
.tr2-modal-locked-ico img { width: 160%; height: 160%; object-fit: cover; mix-blend-mode: normal !important; }
@keyframes tr2EmojiIn { from{transform:scale(.4) rotate(-10deg);opacity:0} to{transform:scale(1) rotate(0deg);opacity:1} }
.tr2-rarity-chip {
  position: relative; z-index: 1;
  font: 700 11px/1 'IBM Plex Mono', monospace; letter-spacing: .06em; text-transform: uppercase;
  color: #fff; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.3);
  border-radius: 99px; padding: 4px 10px;
}
.tr2-modal-locked-hd {
  height: 140px; background: var(--bg);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; border-bottom: 1px solid var(--bo);
}
.tr2-modal-locked-ico { font-size: 52px; filter: grayscale(1) brightness(.3); opacity: .4; }
.tr2-modal-locked-lbl { font: 600 11px/1 'Inter', sans-serif; color: var(--mu2); letter-spacing: .06em; text-transform: uppercase; }
.tr2-modal-body { padding: 20px 20px 8px; background: var(--su); }
.tr2-modal-title { font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.025em; margin-bottom: 8px; }
.tr2-modal-desc { font: 500 14px/1.55 'Inter', sans-serif; color: var(--mu); margin-bottom: 16px; }
.tr2-modal-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.tr2-modal-chip { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 99px; font: 700 12px/1 'IBM Plex Mono', monospace; }
.tr2-modal-chip.xp   { background: rgba(88,204,2,.1); color: var(--a); }
.tr2-modal-chip.gems { background: rgba(16,185,129,.1); color: var(--gr); }
.tr2-modal-chip.date { background: var(--bg); color: var(--mu); }
.tr2-modal-social { font: 500 12px/1.4 'Inter', sans-serif; color: var(--mu2); margin-bottom: 20px; }
.tr2-modal-actions { display: flex; gap: 8px; padding: 0 20px; background: var(--su); }
.tr2-modal-share {
  flex: 1; padding: 14px;
  background: var(--a);
  border: none; border-radius: 14px; color: #fff;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer; min-height: 50px;
  transition: transform .12s, opacity .12s;
}
.tr2-modal-share:active { transform: scale(.97); opacity: .9; }
.tr2-modal-close {
  padding: 14px 20px; background: var(--bg); border: 1px solid var(--bo); border-radius: 14px;
  color: var(--mu); font: 600 14px/1 'Inter', sans-serif; cursor: pointer; min-height: 50px;
  transition: background .12s;
}
.tr2-modal-close:active { background: var(--bg2); }
    @media (prefers-reduced-motion: reduce){
      *,*::before,*::after{
        animation-duration:.001ms!important;animation-iteration-count:1!important;
        transition-duration:.001ms!important;scroll-behavior:auto!important}
    }
</style>`;

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track('page.view', { page: 'trophees' });

  root.innerHTML = `${STYLE}
<div class="tr2 anim-slide-up">
  <div class="tr2-hero">
    <div class="tr2-hero-inner">
      <div class="tr2-hero-top">
        <h1 class="tr2-hero-title" tabindex="-1">Mes trophées</h1>
        <div class="tr2-hero-count" id="tr2-count">— / ${CATALOG.length}</div>
      </div>
      <div class="tr2-progress-wrap">
        <div class="tr2-progress-bar"><div class="tr2-progress-fill" id="tr2-fill" style="width:0%"></div></div>
        <div class="tr2-progress-hint" id="tr2-hint">Chargement…</div>
      </div>
    </div>
  </div>
  <a class="tr2-galerie" href="#/galerie" aria-label="Ouvrir ta galerie de récompenses">
    <span class="tr2-galerie-ico" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></span>
    <span class="tr2-galerie-tx">
      <span class="tr2-galerie-t">Ta galerie</span>
      <span class="tr2-galerie-s">Tes skins et badges débloqués</span>
    </span>
    <span class="tr2-galerie-arrow" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
  </a>
  <div id="tr2-body">
    ${[...Array(3)].map(() => `
      <div class="tr2-group-label"><div class="tr2-skel" style="height:11px;width:80px;display:inline-block"></div></div>
      <div class="tr2-grid">${[...Array(6)].map(() => `<div class="tr2-skel" style="min-height:100px"></div>`).join('')}</div>
    `).join('')}
  </div>
</div>`;

  try {
    const [achRes, cntRes, strkRes] = await Promise.allSettled([
      sb.rpc('get_my_achievements'),
      sb.from('validations').select('id', { count: 'exact', head: true }).eq('eleve_id', me.id).eq('statut', 'acquis'),
      sb.from('streaks').select('current_streak').eq('user_id', me.id).maybeSingle(),
    ]);
    if (achRes.value?.error) throw achRes.value.error;
    const stats = {
      compCount: cntRes.value?.count ?? 0,
      streak:    strkRes.value?.data?.current_streak ?? 0,
    };
    renderAll(root, achRes.value?.data ?? [], stats);
  } catch (e) {
    console.error('[trophees]', e);
    toast('Impossible de charger les trophées', 'error');
    root.querySelector('#tr2-body').innerHTML = `
      <div style="text-align:center;padding:56px 24px;color:var(--mu)">
        <div style="font-size:48px;margin-bottom:12px">🏆</div>
        <div style="font:700 16px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:6px">Continue à apprendre</div>
        <div style="font:500 13px/1.5 'Inter',sans-serif">Tes premiers trophées arrivent ✨</div>
      </div>`;
  }
}

// ─── Render all ───────────────────────────────────────────────
function renderAll(root, unlocked, stats = { compCount: 0, streak: 0 }) {
  const unlockedMap = new Map(unlocked.map(u => [u.achievement_key, u]));
  const unlockedCount = CATALOG.filter(t => unlockedMap.has(t.key)).length;

  // Hero
  root.querySelector('#tr2-count').textContent = `${unlockedCount} / ${CATALOG.length}`;
  const pct = Math.round(100 * unlockedCount / CATALOG.length);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fill = root.querySelector('#tr2-fill');
  if (reduceMotion) {
    // Pas de remplissage progressif : on pose directement la valeur réelle
    if (fill) { fill.style.transition = 'none'; fill.style.width = pct + '%'; }
  } else {
    requestAnimationFrame(() => {
      if (fill) fill.style.width = pct + '%';
    });
  }
  root.querySelector('#tr2-hint').textContent = unlockedCount === 0
    ? 'Commence à valider des compétences pour débloquer tes premiers trophées !'
    : `${pct}% du parcours — ${CATALOG.length - unlockedCount} restant${CATALOG.length - unlockedCount > 1 ? 's' : ''}`;

  // Add entry keyframe
  if (!document.head.querySelector('#tr2-kf')) {
    const s = document.createElement('style');
    s.id = 'tr2-kf';
    s.textContent = `@keyframes tr2CardIn{from{opacity:0;transform:translateY(12px) scale(.92)}to{opacity:1;transform:none}}`;
    document.head.appendChild(s);
  }

  // Group by category
  const groups = {};
  for (const t of CATALOG) {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  }

  // NB : même avec 0 trophée débloqué, on affiche TOUTE la grille verrouillée
  // (grisée + "???" + progression) — ADN Clash Royale/Duolingo : montrer les
  // objectifs à viser crée le désir. Pas d'empty state qui tue la motivation.

  let html = '';
  let globalIdx = 0;
  for (const [group, items] of Object.entries(groups)) {
    html += `<div class="tr2-group-label">${esc(group)}</div><div class="tr2-grid">`;
    for (const t of items) {
      const u = unlockedMap.get(t.key);
      const cssClass = u ? t.rarity : 'locked';
      // For unlocked: subtle drop-shadow. For locked: CSS class .locked already handles grayscale/opacity on the parent .tr2-card-emoji
      const imgFilter = u ? 'drop-shadow(0 2px 8px rgba(0,0,0,.25))' : 'none';
      html += `
        <div class="tr2-card ${cssClass}" data-key="${esc(t.key)}"
          style="animation:tr2CardIn .4s ${globalIdx * 50}ms cubic-bezier(.34,1.56,.64,1) both">
          ${u ? `<div class="tr2-card-rarity"></div>` : ''}
          <div class="tr2-card-emoji">
            ${t.image ? `
              <img src="${t.image}" alt="${esc(t.title)}" loading="lazy"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"
                   style="width:56px;height:56px;object-fit:contain;filter:${imgFilter}">
              <span style="display:none;font-size:36px">${t.emoji}</span>
            ` : `<span style="font-size:36px">${t.emoji}</span>`}
          </div>
          <div class="tr2-card-name">${u ? esc(t.title) : '???'}</div>
          ${!u ? `<div class="tr2-card-mystery">${esc(shortProgress(t.key, stats))}</div>` : ''}
        </div>`;
      globalIdx++;
    }
    html += `</div>`;
  }
  root.querySelector('#tr2-body').innerHTML = html;

  root.querySelectorAll('.tr2-card').forEach(el => {
    el.addEventListener('click', () => {
      haptic('select');
      const key = el.dataset.key;
      const def = CATALOG.find(t => t.key === key);
      const unlockData = unlockedMap.get(key) ?? null;
      if (def) showModal(def, unlockData, unlockedCount);
    });
  });
}

// ─── Modal ────────────────────────────────────────────────────
function showModal(def, unlockData, totalUnlocked) {
  const rm = RARITY_META[def.rarity];
  const isUnlocked = !!unlockData;
  const dateStr = unlockData?.unlocked_at
    ? new Date(unlockData.unlocked_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const overlay = document.createElement('div');
  overlay.className = 'tr2-modal-bg';
  overlay.innerHTML = isUnlocked ? `
    <div class="tr2-modal" style="background:var(--su)">
      <div class="tr2-modal-glow" style="background:${rm.gradient}">
        <div class="tr2-modal-handle"></div>
        <div class="tr2-modal-emoji">${def.image
          ? `<img src="${def.image}" alt="${esc(def.title)}" loading="lazy" style="width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none;font-size:64px">${def.emoji}</span>`
          : `<span style="font-size:64px">${def.emoji}</span>`}</div>
        <div class="tr2-rarity-chip">${esc(rm.label)}</div>
      </div>
      <div class="tr2-modal-body">
        <h2 class="tr2-modal-title">${esc(def.title)}</h2>
        <div class="tr2-modal-desc">${esc(def.body)}</div>
        <div class="tr2-modal-meta">
          <div class="tr2-modal-chip xp">+${def.xp} XP</div>
          <div class="tr2-modal-chip gems">+${def.gemmes} 💎</div>
          ${dateStr ? `<div class="tr2-modal-chip date">🗓 ${esc(dateStr)}</div>` : ''}
        </div>
        <div class="tr2-modal-social">${totalUnlocked > 1
          ? `Tu es parmi les élèves les plus avancés de ton école ✨`
          : 'Continue pour débloquer plus de trophées !'}</div>
      </div>
      <div class="tr2-modal-actions">
        <button class="tr2-modal-share" id="tr2-share-btn" aria-label="Partager ce trophée"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg><span>Partager</span></button>
        <button class="tr2-modal-close" id="tr2-close-btn">Fermer</button>
      </div>
    </div>
  ` : `
    <div class="tr2-modal" style="background:var(--su)">
      <div class="tr2-modal-locked-hd">
        <div class="tr2-modal-locked-handle"></div>
        <div class="tr2-modal-locked-ico">${def.image
          ? `<img src="${def.image}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;filter:grayscale(1) opacity(.5)" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none;font-size:64px">${def.emoji}</span>`
          : `<span style="font-size:64px">${def.emoji}</span>`}</div>
        <div class="tr2-modal-locked-lbl">🔒 Trophée verrouillé</div>
      </div>
      <div class="tr2-modal-body">
        <h2 class="tr2-modal-title">${esc(def.title)}</h2>
        <div class="tr2-modal-desc">${esc(def.body)}</div>
        <div class="tr2-modal-meta">
          <div class="tr2-modal-chip xp">+${def.xp} XP à débloquer</div>
          <div class="tr2-modal-chip gems">+${def.gemmes} 💎 à débloquer</div>
          <div class="tr2-modal-chip date">${esc(rm.label)}</div>
        </div>
        <div class="tr2-modal-social">Objectif : ${esc(shortProgress(def.key))}</div>
      </div>
      <div class="tr2-modal-actions">
        <button class="tr2-modal-share" id="tr2-goto-btn" style="background:linear-gradient(135deg,var(--adk),var(--puk))">Aller au parcours →</button>
        <button class="tr2-modal-close" id="tr2-close-btn">Fermer</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  track('trophy.modal_opened', { key: def.key, unlocked: isUnlocked });

  const closeModal = () => { haptic('select'); overlay.remove(); };
  overlay.querySelector('#tr2-close-btn')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  // Swipe-to-dismiss : glisser la feuille vers le bas pour fermer
  const sheet = overlay.querySelector('.tr2-modal');
  if (sheet) enableSheetSwipe(sheet, closeModal, { overlay });

  if (isUnlocked) {
    overlay.querySelector('#tr2-share-btn')?.addEventListener('click', async () => {
      const text = `J'ai débloqué "${def.title}" sur PermiGo ! 🏆\n+${def.xp} XP`;
      if (navigator.share) {
        try { await navigator.share({ title: 'Mon trophée PermiGo', text, url: window.location.origin }); }
        catch { /* cancelled */ }
      } else {
        try { await navigator.clipboard.writeText(text); toast('Texte copié 📋', 'success'); }
        catch { /* unavailable */ }
      }
    });
  } else {
    overlay.querySelector('#tr2-goto-btn')?.addEventListener('click', () => {
      overlay.remove();
      navigate('#/parcours');
    });
  }
}
