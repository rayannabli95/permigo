/**
 * Page Trophées Élève — vue ludique de la progression REMC par catégorie.
 *
 * Affiche les 4 catégories REMC :
 *  - Catégorie validée (toutes sous-comp acquises) → trophée doré débloqué + animation shimmer
 *  - En cours → trophée gris avec progression
 *  - Pas commencée → trophée verrouillé
 *
 * + KPIs globaux + countdown vers le prochain trophée.
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { REMC, REMC_TOTAL } from '@/data/remc.js';
import { mountNotifBell } from '@/components/notif-bell.js';
import { burstConfetti, burstConfettiFromElement } from '@/components/confetti.js';
import { countUpAll } from '@/utils/count-up.js';

let _root, _me;

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  const { data } = await sb.from('remc_entries').select('comp_id, lv').eq('eleve_id', _me.id);
  const entries = data || [];
  const validSet = new Set(entries.filter(e => e.lv === 'v').map(e => e.comp_id));

  const cats = REMC.map(cat => {
    const done = cat.subs.filter(s => validSet.has(s.c)).length;
    const total = cat.subs.length;
    return {
      ...cat,
      done, total,
      pct: Math.round(done / total * 100),
      isUnlocked: done === total,
      isStarted: done > 0,
    };
  });

  const trophiesDone = cats.filter(c => c.isUnlocked).length;
  const allDone = validSet.size;
  const nextTrophy = cats.find(c => !c.isUnlocked);

  root.innerHTML = render({ me: _me, cats, trophiesDone, allDone, nextTrophy });
  wire();

  // ─── Animations d'arrivée ───
  // Count-up sur les compteurs de hero (trophées, total)
  setTimeout(() => {
    countUpAll(root.querySelectorAll('[data-count]'), { stagger: 150, duration: 1200 });
  }, 250);

  // Confetti automatique si l'élève vient de débloquer un nouveau trophée
  const lastSeenKey = `troph-seen-${_me.id}`;
  const lastSeen = parseInt(localStorage.getItem(lastSeenKey) || '0', 10);
  if (trophiesDone > lastSeen) {
    setTimeout(() => burstConfetti({ count: 120, y: 0.25, power: 18 }), 700);
    if (trophiesDone === 4) {
      // Quadruple confetti pour tous les trophées !
      setTimeout(() => burstConfetti({ count: 100, x: 0.25, y: 0.4, power: 16, spread: Math.PI * 0.5 }), 1100);
      setTimeout(() => burstConfetti({ count: 100, x: 0.75, y: 0.4, power: 16, spread: Math.PI * 0.5 }), 1300);
    }
    localStorage.setItem(lastSeenKey, String(trophiesDone));
  }
}

function render({ me, cats, trophiesDone, allDone, nextTrophy }) {
  return `
    <style>
      .tr-wrap{max-width:520px;margin:0 auto;padding:14px}
      .tr-top{display:flex;align-items:center;gap:10px;padding:6px 4px 14px}
      .tr-back{width:34px;height:34px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer}
      .tr-top .ttl{font-family:var(--fd);font-weight:800;font-size:20px;letter-spacing:-.02em}
      .tr-top .sub{font-size:11px;color:var(--mu);margin-top:2px}
      .tr-top-r{margin-left:auto}

      .tr-hero{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-radius:var(--rx);padding:22px 18px;margin-bottom:18px;box-shadow:var(--s2);position:relative;overflow:hidden}
      .tr-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(255,255,255,.18),transparent 50%);pointer-events:none}
      .tr-hero-row{display:flex;align-items:center;justify-content:space-between;position:relative}
      .tr-hero .big{font-family:var(--fd);font-size:48px;font-weight:900;letter-spacing:-.03em;line-height:1}
      .tr-hero .big small{font-size:20px;opacity:.7;font-weight:700;margin-left:2px}
      .tr-hero .lbl{font-size:11px;font-weight:800;opacity:.9;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px}
      .tr-hero .next{margin-top:14px;font-size:12.5px;line-height:1.5;opacity:.95;position:relative}
      .tr-hero .next b{font-weight:800}

      .tr-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
      .tr-card{position:relative;background:var(--su);border:1px solid var(--bo);border-radius:var(--rl);padding:18px 14px;text-align:center;overflow:hidden;transition:transform .15s,border-color .15s;box-shadow:var(--s1)}
      .tr-card:hover{transform:translateY(-2px)}
      .tr-card.unlocked{border-color:#f59e0b;background:linear-gradient(135deg,#fffbeb,#fef3c7);box-shadow:0 12px 30px -10px rgba(245,158,11,.4)}
      .tr-card.unlocked::before{content:'';position:absolute;inset:-50%;background:linear-gradient(60deg,transparent 30%,rgba(255,255,255,.5) 50%,transparent 70%);animation:tr-shimmer 3.5s linear infinite;pointer-events:none}
      @keyframes tr-shimmer{0%{transform:translateX(-100%) translateY(-100%)}100%{transform:translateX(100%) translateY(100%)}}
      .tr-card.locked{opacity:.7}

      .tr-trophy{font-size:54px;line-height:1;margin-bottom:8px;filter:grayscale(.7);transition:filter .25s}
      .tr-card.unlocked .tr-trophy{filter:none;animation:tr-bounce 2.5s ease-in-out infinite}
      .tr-card.started:not(.unlocked) .tr-trophy{filter:grayscale(.3)}
      @keyframes tr-bounce{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-4px) rotate(3deg)}}

      .tr-cat-id{font-family:var(--fn);font-size:10px;font-weight:800;color:var(--mu);letter-spacing:1.5px}
      .tr-cat-nm{font-family:var(--fd);font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--ink);margin-top:2px;min-height:36px;display:flex;align-items:center;justify-content:center}
      .tr-card.unlocked .tr-cat-nm{color:#92400e}
      .tr-cat-pr{margin-top:8px;display:flex;flex-direction:column;align-items:center;gap:4px}
      .tr-bar{width:80%;height:5px;background:var(--bo2);border-radius:99px;overflow:hidden}
      .tr-bar i{display:block;height:100%;background:var(--gr);border-radius:99px;transition:width .8s ease}
      .tr-card.unlocked .tr-bar i{background:#f59e0b}
      .tr-cat-cnt{font-family:var(--fn);font-size:11px;color:var(--mu);font-weight:700}
      .tr-card.unlocked .tr-cat-cnt{color:#92400e}

      .tr-status{position:absolute;top:8px;right:8px;font-size:9.5px;font-weight:800;padding:3px 7px;border-radius:99px;letter-spacing:.5px;text-transform:uppercase}
      .tr-card.unlocked .tr-status{background:#f59e0b;color:#fff}
      .tr-card.started:not(.unlocked) .tr-status{background:var(--ap);color:var(--a)}
      .tr-card.locked .tr-status{background:var(--bg2);color:var(--mu2)}

      .tr-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px}
      .tr-stat{background:var(--su);border:1px solid var(--bo);border-radius:10px;padding:12px;text-align:center}
      .tr-stat .v{font-family:var(--fd);font-size:20px;font-weight:900;letter-spacing:-.02em}
      .tr-stat .lb{font-size:9.5px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-top:3px}
    </style>

    <div class="tr-wrap anim-slide-up">
      <div class="tr-top">
        <button class="tr-back" id="tr-back" aria-label="Retour">‹</button>
        <img src="permigo-logo.png" alt="PermiGo" style="height:26px;width:auto;margin-right:4px;filter:drop-shadow(0 3px 8px rgba(99,102,241,.25))" onerror="this.style.display='none'">
        <div>
          <div class="ttl">🏆 Mes trophées</div>
          <div class="sub">${esc(me.nom)}</div>
        </div>
        <div class="tr-top-r"><span id="tr-bell"></span></div>
      </div>

      <div class="tr-hero">
        <div class="tr-hero-row">
          <div>
            <div class="lbl">Trophées débloqués</div>
            <div class="big"><span data-count="${trophiesDone}">0</span><small>/ 4</small></div>
          </div>
          <div style="font-size:64px;line-height:1">🏆</div>
        </div>
        ${nextTrophy ? `
          <div class="next">
            🎯 Prochain trophée : <b>${esc(nextTrophy.tname)}</b><br>
            Encore <b>${nextTrophy.total - nextTrophy.done}</b> sous-compétence(s) à valider pour le débloquer.
          </div>
        ` : `
          <div class="next">🎉 <b>Bravo !</b> Tu as débloqué tous les trophées du parcours REMC.</div>
        `}
      </div>

      <div class="tr-stats">
        <div class="tr-stat"><div class="v" style="color:var(--gr)"><span data-count="${trophiesDone}">0</span></div><div class="lb">Trophées</div></div>
        <div class="tr-stat"><div class="v" style="color:var(--a)"><span data-count="${cats.filter(c => c.isStarted && !c.isUnlocked).length}">0</span></div><div class="lb">En cours</div></div>
        <div class="tr-stat"><div class="v" style="color:var(--am)"><span data-count="${REMC_TOTAL - validSetSize(cats)}">0</span></div><div class="lb">À débloquer</div></div>
      </div>

      <div class="tr-grid">
        ${cats.map(renderCard).join('')}
      </div>

      <div style="height:24px"></div>
    </div>
  `;
}

function validSetSize(cats) {
  return cats.reduce((s, c) => s + c.done, 0);
}

function renderCard(cat) {
  const status = cat.isUnlocked ? 'unlocked' : cat.isStarted ? 'started' : 'locked';
  const statusLabel = cat.isUnlocked ? '✓ Débloqué' : cat.isStarted ? `${cat.pct}%` : 'Verrouillé';
  return `
    <div class="tr-card ${status}">
      <div class="tr-status">${statusLabel}</div>
      <div class="tr-trophy">${cat.isUnlocked ? '🏆' : cat.isStarted ? '🥉' : '🔒'}</div>
      <div class="tr-cat-id">${esc(cat.id)} · ${esc(cat.name).toUpperCase()}</div>
      <div class="tr-cat-nm">${esc(cat.tname)}</div>
      <div class="tr-cat-pr">
        <div class="tr-bar"><i style="width:${cat.pct}%"></i></div>
        <div class="tr-cat-cnt">${cat.done}/${cat.total}</div>
      </div>
    </div>
  `;
}

function wire() {
  const bellHost = _root.querySelector('#tr-bell');
  if (bellHost) mountNotifBell(bellHost);

  _root.querySelector('#tr-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/accueil');
  });
}
