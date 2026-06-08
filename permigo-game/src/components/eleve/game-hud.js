/**
 * Game HUD — barre persistante en haut du parcours.
 *
 * Sections :
 *  - Avatar + Niveau (LVL 7)
 *  - Barre XP avec progression vers next level
 *  - Streak 🔥 (cliquable → modal calendrier)
 *  - Ligue (Bronze → Champion)
 *  - Gemmes (placeholder, display only)
 *
 * Usage :
 *   import { renderGameHUD, wireGameHUD } from '@/components/eleve/game-hud.js';
 *   parent.innerHTML += renderGameHUD(stats, me);
 *   wireGameHUD(parent);
 */

import { esc } from '@/utils/escape.js';
import { icon } from '@/utils/icons.js';
import { getLast7Days, getEquipped, getEquippedAsset, getGemmes } from '@/utils/game-state.js';

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

/** HTML du HUD complet. À placer en haut du parcours. */
export function renderGameHUD(stats, me) {
  const { level, pctLevel, xpInLevel, xpForNextLevel, league, streak, gemmes, availableChests } = stats;
  const chestBadge = availableChests.length > 0 ? `<span class="ghud-chest-badge">${availableChests.length}</span>` : '';
  const equipped = getEquipped();
  const avatarFrame = equipped.avatarFrame ? `frame-${equipped.avatarFrame.replace('frame-', '')}` : '';
  const avatarSrc = getEquippedAsset('avatar') || me?.avatar_url || null;

  return `
    <style>
      /* ╔══ HUD ESPORT-GRADE — dark glass + neon accents ══╗ */
      .ghud{
        position:sticky;top:0;z-index:30;
        background:
          linear-gradient(180deg,rgba(11,13,26,.96) 0%,rgba(15,17,36,.92) 100%);
        backdrop-filter:blur(20px) saturate(180%);
        -webkit-backdrop-filter:blur(20px) saturate(180%);
        border-bottom:1px solid color-mix(in srgb, var(--a) 25%, transparent);
        box-shadow:
          0 10px 32px -8px rgba(0,0,0,.5),
          0 1px 0 rgba(255,255,255,.06) inset,
          0 -1px 0 color-mix(in srgb, var(--a) 30%, transparent) inset;
        color:#fff;
        padding:max(11px,env(safe-area-inset-top)) 14px 12px;
        position:relative;overflow:hidden;
      }
      /* Bande lumineuse animée en bas du HUD */
      .ghud::after{
        content:'';position:absolute;bottom:0;left:0;right:0;height:2px;
        background:linear-gradient(90deg,transparent 0%,var(--a) 30%,#a78bfa 50%,var(--a) 70%,transparent 100%);
        background-size:200% 100%;
        animation:ghud-line-flow 4s linear infinite;
        opacity:.7;
      }
      @keyframes ghud-line-flow{0%{background-position:200% 0}100%{background-position:-200% 0}}

      .ghud-row{display:flex;align-items:center;gap:11px;max-width:580px;margin:0 auto}

      /* ─ Avatar épuré, cliquable → /profil ─ */
      .ghud-avatar{
        position:relative;width:46px;height:46px;flex-shrink:0;
        border-radius:14px;
        background:linear-gradient(135deg,var(--a) 0%,var(--adx) 50%,#1e1b4b 100%);
        display:flex;align-items:center;justify-content:center;
        font-family:var(--fd);font-weight:900;font-size:17px;color:#fff;
        box-shadow:
          0 6px 18px -4px color-mix(in srgb, var(--a) 60%, transparent),
          0 0 0 2px rgba(255,255,255,.12) inset,
          0 0 0 1px color-mix(in srgb, var(--a) 40%, transparent);
        letter-spacing:-.02em;
        text-shadow:0 1px 2px rgba(0,0,0,.5);
        cursor:pointer;border:0;padding:0;overflow:hidden;
        transition:transform .18s cubic-bezier(.2,.7,.3,1),box-shadow .2s;
      }
      .ghud-avatar:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 10px 24px -6px color-mix(in srgb, var(--a) 80%, transparent),0 0 0 2px rgba(255,255,255,.2) inset,0 0 0 2px rgba(167,139,250,.6)}

      /* ─── AVATAR FRAMES PREMIUM (boutique) ─── */
      .ghud-avatar.frame-rainbow::after{
        content:'';position:absolute;inset:-3px;border-radius:16px;
        background:conic-gradient(from 0deg,var(--rd),var(--aml2),var(--gr),var(--bl),var(--pul),var(--rd));
        z-index:-1;filter:blur(2px);
        animation:ghud-frame-rainbow 3s linear infinite;
      }
      @keyframes ghud-frame-rainbow{from{transform:rotate(0)}to{transform:rotate(360deg)}}

      .ghud-avatar.frame-glow-violet::after{
        content:'';position:absolute;inset:-6px;border-radius:18px;
        background:radial-gradient(circle,#a78bfa,transparent 65%);
        filter:blur(8px);z-index:-1;
        animation:ghud-frame-pulse 1.8s ease-in-out infinite;
      }

      .ghud-avatar.frame-glow-or::after{
        content:'';position:absolute;inset:-6px;border-radius:18px;
        background:radial-gradient(circle,var(--aml2),transparent 65%);
        filter:blur(8px);z-index:-1;
        animation:ghud-frame-pulse 1.8s ease-in-out infinite;
      }
      @keyframes ghud-frame-pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
      .ghud-avatar:active{transform:scale(.94)}
      .ghud-avatar:focus-visible{outline:none;box-shadow:0 6px 18px -4px color-mix(in srgb, var(--a) 60%, transparent),0 0 0 3px var(--a)}
      .ghud-avatar::before{
        content:'';position:absolute;inset:0;border-radius:14px;
        background:linear-gradient(135deg,rgba(255,255,255,.22) 0%,transparent 50%);
        pointer-events:none;z-index:2;
      }
      .ghud-avatar-img{width:100%;height:100%;object-fit:cover;border-radius:14px;display:block;position:relative;z-index:1}
      .ghud-avatar-init{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative;z-index:1}
      /* Badge LVL retiré de l'avatar — déplacé dans le label XP pour zéro overlap */

      /* ─ XP zone ─ */
      .ghud-xp{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:6px}
      .ghud-xp-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;line-height:1}
      .ghud-xp-meta .lvl-tag{
        display:inline-flex;align-items:center;
        padding:3px 10px;border-radius:99px;
        background:linear-gradient(180deg,var(--aml) 0%,var(--aml2) 50%,var(--amk) 100%);
        color:#451a03;
        font-family:var(--fd);font-size:11px;font-weight:900;
        letter-spacing:.6px;line-height:1;
        box-shadow:
          0 3px 8px -2px rgba(251,191,36,.55),
          0 1px 0 rgba(255,255,255,.5) inset,
          0 -1px 0 rgba(0,0,0,.15) inset;
        flex-shrink:0;
      }
      .ghud-xp-meta .to-next{font-family:var(--fn);font-size:10px;font-weight:800;color:rgba(255,255,255,.6);letter-spacing:.4px;white-space:nowrap}

      /* Barre XP avec liquid shimmer */
      .ghud-xp-bar{
        height:10px;background:rgba(11,13,26,.6);
        border-radius:99px;overflow:hidden;position:relative;
        box-shadow:0 1px 2px rgba(0,0,0,.5) inset,0 0 0 1px rgba(255,255,255,.06) inset;
      }
      .ghud-xp-bar i{
        display:block;height:100%;
        background:linear-gradient(90deg,var(--aml2) 0%,var(--am) 50%,#fb923c 100%);
        border-radius:99px;
        width:${pctLevel.toFixed(1)}%;
        box-shadow:
          0 0 12px rgba(251,191,36,.7),
          0 1px 0 rgba(255,255,255,.4) inset,
          0 -1px 0 rgba(0,0,0,.2) inset;
        transition:width 1.2s cubic-bezier(.2,.7,.3,1);
        position:relative;
      }
      .ghud-xp-bar i::after{
        content:'';position:absolute;inset:0;
        background:linear-gradient(110deg,transparent 0%,transparent 30%,rgba(255,255,255,.5) 50%,transparent 70%,transparent 100%);
        background-size:200% 100%;
        animation:ghud-xp-shimmer 2.4s linear infinite;
      }
      @keyframes ghud-xp-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

      /* ─ Pills — carrées 40×40, icon-only sauf streak qui montre le count ─ */
      .ghud-pills{display:flex;align-items:center;gap:8px;flex-shrink:0}
      .ghud-pill{
        position:relative;display:inline-flex;align-items:center;justify-content:center;gap:5px;
        width:40px;height:40px;padding:0 8px;
        border-radius:11px;
        background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,.03) 100%);
        border:1px solid rgba(255,255,255,.16);
        font-family:var(--fd);font-size:14px;font-weight:900;color:#fff;
        letter-spacing:.3px;cursor:pointer;
        transition:all .18s cubic-bezier(.2,.7,.3,1);
        line-height:1;white-space:nowrap;
        box-shadow:0 1px 0 rgba(255,255,255,.12) inset,0 -1px 0 rgba(0,0,0,.25) inset,0 4px 10px -2px rgba(0,0,0,.3);
      }
      .ghud-pill:hover{transform:translateY(-2px);box-shadow:0 8px 20px -4px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.18) inset,0 -1px 0 rgba(0,0,0,.25) inset}
      .ghud-pill:active{transform:translateY(0) scale(.94)}
      .ghud-pill-v{
        font-family:var(--fd);font-size:13px;font-weight:900;color:#fff;
        text-shadow:0 1px 2px rgba(0,0,0,.5);letter-spacing:-.01em;line-height:1;
      }

      /* Streak pill — large pour montrer la flame + count */
      .ghud-pill.streak{
        width:auto;min-width:62px;padding:0 12px 0 8px;
        background:linear-gradient(135deg,#7c2d12 0%,var(--rdk) 50%,var(--or) 100%);
        border-color:rgba(251,191,36,.5);
        box-shadow:0 4px 14px -2px rgba(220,38,38,.55),0 0 12px rgba(220,38,38,.25),0 1px 0 rgba(255,255,255,.18) inset;
      }
      .ghud-svg-flame{filter:drop-shadow(0 0 6px rgba(251,191,36,.8));animation:ghud-flame-dance .5s ease-in-out infinite alternate}
      @keyframes ghud-flame-dance{
        0%{transform:scale(1) rotate(-3deg)}
        100%{transform:scale(1.1) rotate(3deg)}
      }

      /* League pill — couleur du tier avec glow tier-matched */
      .ghud-pill.league{
        background:linear-gradient(135deg,var(--lg-c1) 0%,var(--lg-c2) 100%);
        border-color:var(--lg-bd);
        box-shadow:
          0 4px 14px -2px var(--lg-glow),
          0 0 18px var(--lg-glow),
          0 1px 0 rgba(255,255,255,.22) inset;
      }
      .ghud-svg-rosette{filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));animation:ghud-rosette-spin 8s linear infinite}
      @keyframes ghud-rosette-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

      /* Gemmes pill — violet/indigo gradient, cliquable boutique */
      .ghud-pill.gemmes{
        width:auto;min-width:60px;padding:0 12px 0 8px;
        background:linear-gradient(135deg,#4c1d95 0%,var(--puk) 50%,var(--pul) 100%);
        border-color:rgba(167,139,250,.5);
        box-shadow:0 4px 14px -2px rgba(139,92,246,.55),0 0 12px rgba(167,139,250,.3),0 1px 0 rgba(255,255,255,.2) inset;
      }
      .ghud-svg-gem{filter:drop-shadow(0 0 6px rgba(167,139,250,.7));animation:ghud-gem-rotate 3.5s ease-in-out infinite}
      @keyframes ghud-gem-rotate{0%,100%{transform:rotate(-6deg) scale(1)}50%{transform:rotate(6deg) scale(1.08)}}

      /* Chests pill */
      .ghud-pill.chests{
        background:linear-gradient(135deg,#451a03 0%,#854d0e 50%,#a16207 100%);
        border-color:rgba(251,191,36,.45);
        box-shadow:0 4px 14px -2px rgba(161,98,7,.5),0 1px 0 rgba(255,255,255,.18) inset;
      }
      .ghud-svg-chest{filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))}
      .ghud-pill.chests.has{
        animation:ghud-chest-wiggle 2.4s ease-in-out infinite;
        box-shadow:0 4px 14px -2px rgba(251,191,36,.7),0 0 20px rgba(251,191,36,.45),0 1px 0 rgba(255,255,255,.22) inset;
      }
      .ghud-pill.chests.has .ghud-svg-chest{animation:ghud-chest-icon-bob 1.6s ease-in-out infinite}
      @keyframes ghud-chest-icon-bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(-3deg)}}
      @keyframes ghud-chest-wiggle{0%,84%,100%{transform:rotate(0deg) scale(1)}87%{transform:rotate(-8deg) scale(1.05)}93%{transform:rotate(8deg) scale(1.05)}}

      .ghud-chest-badge{
        position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;
        background:linear-gradient(180deg,#fb7185,var(--rd));
        color:#fff;
        font-family:var(--fd);font-size:10px;font-weight:900;
        border-radius:99px;
        display:flex;align-items:center;justify-content:center;
        border:2px solid var(--ink);
        box-shadow:0 4px 10px -2px rgba(239,68,68,.6);
        animation:ghud-badge-bounce 1.2s ease-in-out infinite;
      }
      @keyframes ghud-badge-bounce{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.25) rotate(-5deg)}}

      /* Streak modal */
      .ghud-streak-modal{position:fixed;inset:0;background:rgba(11,13,26,.72);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:14px;z-index:200}
      .ghud-streak-modal.show{display:flex;animation:fadeIn .2s}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      .ghud-streak-panel{background:linear-gradient(160deg,#7c2d12 0%,#9a3412 40%,var(--ink) 100%);width:100%;max-width:420px;border-radius:24px;padding:28px 24px;color:#fff;text-align:center;box-shadow:0 24px 60px -16px rgba(0,0,0,.7);border:1px solid rgba(251,191,36,.3);animation:popIn .3s cubic-bezier(.5,1.6,.4,1)}
      @keyframes popIn{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
      .ghud-streak-flame{font-size:72px;line-height:1;filter:drop-shadow(0 8px 24px rgba(251,191,36,.6));animation:ghud-flame-flicker 1s ease-in-out infinite alternate}
      .ghud-streak-count{font-family:var(--fd);font-size:48px;font-weight:900;margin-top:8px;letter-spacing:-.04em;color:var(--aml);text-shadow:0 4px 16px rgba(251,191,36,.5)}
      .ghud-streak-lbl{font-family:var(--fn);font-size:11px;font-weight:800;color:rgba(255,255,255,.8);letter-spacing:.25em;text-transform:uppercase;margin-top:4px}
      .ghud-streak-msg{font-size:13.5px;line-height:1.5;color:rgba(255,255,255,.9);margin-top:18px}
      .ghud-streak-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:20px}
      .ghud-streak-day{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
      .ghud-streak-day .dl{font-family:var(--fn);font-size:9px;font-weight:800;color:rgba(255,255,255,.6);letter-spacing:.5px}
      .ghud-streak-day .dn{font-family:var(--fd);font-size:14px;font-weight:900;color:rgba(255,255,255,.5)}
      .ghud-streak-day.active{background:linear-gradient(180deg,rgba(251,191,36,.3),rgba(245,158,11,.2));border-color:rgba(251,191,36,.55)}
      .ghud-streak-day.active .dl,.ghud-streak-day.active .dn{color:#fff}
      .ghud-streak-day.active::before{content:'🔥';font-size:13px;line-height:1}
      .ghud-streak-day.today{box-shadow:0 0 0 2px #fff}
      .ghud-streak-close{margin-top:22px;padding:12px 26px;border-radius:99px;background:var(--su);color:var(--ink);border:0;font-family:var(--fd);font-size:13px;font-weight:800;cursor:pointer;letter-spacing:.3px;width:100%}
    </style>

    <div class="ghud" role="status" aria-label="Tableau de bord du joueur">
      <div class="ghud-row">
        <button class="ghud-avatar ${avatarFrame}" id="ghud-avatar-btn" type="button" aria-label="Aller à mon profil">
          ${avatarSrc
            ? `<img src="${esc(avatarSrc)}" alt="" class="ghud-avatar-img" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="ghud-avatar-init" style="display:none">${esc(initials(me?.nom))}</span>`
            : `<span class="ghud-avatar-init">${esc(initials(me?.nom))}</span>`}
        </button>
        <div class="ghud-xp">
          <div class="ghud-xp-meta">
            <span class="lvl-tag">LVL ${level}</span>
            <span class="to-next">${xpInLevel} / 500 XP</span>
          </div>
          <div class="ghud-xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="500" aria-valuenow="${xpInLevel}"><i></i></div>
        </div>
        <div class="ghud-pills">
          <button class="ghud-pill streak" id="ghud-streak-btn" type="button" aria-label="Streak : ${streak.count} jour${streak.count > 1 ? 's' : ''}">
            ${flameIconSVG()}
            <span class="ghud-pill-v">${streak.count}</span>
          </button>
          <button class="ghud-pill league" type="button"
                  style="--lg-c1:${shade(league.color, -15)};--lg-c2:${league.color};--lg-bd:${league.color};--lg-glow:${league.glow}"
                  aria-label="Ligue ${league.name}">
            ${rosetteIconSVG(league.color)}
          </button>
          <button class="ghud-pill gemmes" id="ghud-gemmes-btn" type="button" aria-label="Boutique — ${gemmes} gemmes">
            ${gemIconSVG()}
            <span class="ghud-pill-v">${gemmes}</span>
          </button>
          <button class="ghud-pill chests ${availableChests.length > 0 ? 'has' : ''}" id="ghud-chests-btn" type="button"
                  aria-label="${availableChests.length} coffre${availableChests.length > 1 ? 's' : ''} à ouvrir">
            ${chestIconSVG()}${chestBadge}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Streak Calendar -->
    <div class="ghud-streak-modal" id="ghud-streak-modal" role="dialog" aria-modal="true" aria-labelledby="ghud-streak-title">
      <div class="ghud-streak-panel">
        <div class="ghud-streak-flame">${icon('flame',{size:20})}</div>
        <div class="ghud-streak-count" id="ghud-streak-title">${streak.count}</div>
        <div class="ghud-streak-lbl">${streak.count > 1 ? 'JOURS DE SÉRIE' : 'JOUR DE SÉRIE'}</div>
        <div class="ghud-streak-msg" id="ghud-streak-msg">${streakMsg(streak.count)}</div>
        <div class="ghud-streak-cal" id="ghud-streak-cal">
          ${getLast7Days().map(d => `
            <div class="ghud-streak-day ${d.active ? 'active' : ''} ${d.isToday ? 'today' : ''}">
              <div class="dl">${d.label}</div>
              <div class="dn">${d.num}</div>
            </div>
          `).join('')}
        </div>
        <button class="ghud-streak-close" id="ghud-streak-close" type="button">Continuer →</button>
      </div>
    </div>
  `;
}

/** Branche les événements du HUD (avatar → profil, streak modal, chest button). */
export function wireGameHUD(root, callbacks = {}) {
  const avatarBtn = root.querySelector('#ghud-avatar-btn');
  const streakBtn = root.querySelector('#ghud-streak-btn');
  const streakModal = root.querySelector('#ghud-streak-modal');
  const closeBtn = root.querySelector('#ghud-streak-close');
  const chestsBtn = root.querySelector('#ghud-chests-btn');

  // Avatar → navigation vers /profil
  avatarBtn?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/profil');
  });

  streakBtn?.addEventListener('click', () => streakModal?.classList.add('show'));
  closeBtn?.addEventListener('click', () => streakModal?.classList.remove('show'));
  streakModal?.addEventListener('click', (e) => {
    if (e.target === streakModal) streakModal.classList.remove('show');
  });

  chestsBtn?.addEventListener('click', () => {
    if (callbacks.onChestsClick) callbacks.onChestsClick();
  });

  // Gemmes → boutique
  const gemmesBtn = root.querySelector('#ghud-gemmes-btn');
  gemmesBtn?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/boutique');
  });

  // Rafraîchit le compteur de gemmes en live après ouverture d'un coffre
  // (open_chest crédite côté serveur et émet pg-gemmes-changed avec new_balance).
  window.addEventListener('pg-gemmes-changed', (e) => {
    const bal = e?.detail?.balance;
    if (typeof bal !== 'number') return;
    const v = gemmesBtn?.querySelector('.ghud-pill-v');
    if (v) v.textContent = String(bal);
    gemmesBtn?.setAttribute('aria-label', `Boutique — ${bal} gemmes`);
  });
}

// ─── Icônes SVG custom (cross-platform stable, mieux que emoji) ───
function flameIconSVG() {
  return `<svg class="ghud-svg-flame" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <defs>
      <linearGradient id="flame-grad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="40%" stop-color="var(--aml2)"/>
        <stop offset="100%" stop-color="var(--rdk)"/>
      </linearGradient>
    </defs>
    <path d="M12 2 C 11 5 7 7 7 12 C 7 16 9 20 12 22 C 15 20 17 16 17 12 C 17 9 14 8 14 5 C 13 6 12 8 12 2 Z" fill="url(#flame-grad)" stroke="#7c2d12" stroke-width=".8"/>
    <path d="M12 9 C 11.5 11 10 12 10 14 C 10 16 11 17 12 18 C 13 17 14 16 14 14 C 14 12.5 13 12 13 10 C 12.5 10.5 12 11 12 9 Z" fill="#fff" opacity=".85"/>
  </svg>`;
}

function rosetteIconSVG(color) {
  // Rosette/badge medal style FIFA — bien plus propre qu'un emoji 🥇
  return `<svg class="ghud-svg-rosette" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
    <defs>
      <linearGradient id="ros-grad-${color.replace('#', '')}" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#fff" stop-opacity=".7"/>
        <stop offset="50%" stop-color="${color}"/>
        <stop offset="100%" stop-color="#000" stop-opacity=".25"/>
      </linearGradient>
    </defs>
    <!-- Étoile à 8 branches en arrière-plan -->
    <path d="M16 2 L18 8 L24 6 L22 12 L28 14 L22 17 L24 23 L18 21 L16 27 L14 21 L8 23 L10 17 L4 14 L10 12 L8 6 L14 8 Z" fill="${color}" opacity=".35"/>
    <!-- Cercle central avec gradient -->
    <circle cx="16" cy="15" r="9" fill="url(#ros-grad-${color.replace('#', '')})" stroke="#fff" stroke-width="1.2"/>
    <!-- Inner highlight -->
    <circle cx="16" cy="15" r="7" fill="none" stroke="rgba(255,255,255,.4)" stroke-width=".6"/>
    <!-- Ruban du badge en bas -->
    <path d="M11 22 L11 29 L13 27 L16 29 L19 27 L21 29 L21 22 Z" fill="${color}" stroke="#000" stroke-width=".5" opacity=".9"/>
  </svg>`;
}

function gemIconSVG() {
  return `<svg class="ghud-svg-gem" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <defs>
      <linearGradient id="gem-grad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#fff"/>
        <stop offset="50%" stop-color="#a78bfa"/>
        <stop offset="100%" stop-color="#6d28d9"/>
      </linearGradient>
    </defs>
    <path d="M12 2 L21 9 L12 22 L3 9 Z" fill="url(#gem-grad)" stroke="#4c1d95" stroke-width=".8"/>
    <path d="M12 2 L21 9 L12 12 L3 9 Z" fill="#fff" opacity=".35"/>
    <path d="M12 2 L12 22" stroke="rgba(0,0,0,.18)" stroke-width=".7"/>
  </svg>`;
}

function chestIconSVG() {
  return `<svg class="ghud-svg-chest" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <defs>
      <linearGradient id="chest-icon-grad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="var(--aml)"/>
        <stop offset="100%" stop-color="var(--amk)"/>
      </linearGradient>
    </defs>
    <!-- Corps -->
    <rect x="3" y="10" width="18" height="11" rx="1.5" fill="url(#chest-icon-grad)" stroke="#451a03" stroke-width=".8"/>
    <!-- Couvercle bombé -->
    <path d="M3 10 L3 8 Q 3 5 6 5 L 18 5 Q 21 5 21 8 L 21 10 Z" fill="url(#chest-icon-grad)" stroke="#451a03" stroke-width=".8"/>
    <!-- Bande centrale -->
    <rect x="3" y="12" width="18" height=".8" fill="#451a03"/>
    <!-- Serrure -->
    <rect x="10.5" y="11" width="3" height="3" rx=".5" fill="#451a03"/>
    <circle cx="12" cy="12.5" r=".6" fill="var(--aml)"/>
  </svg>`;
}

// ─── Helpers ───
function streakMsg(count) {
  if (count === 0) return "Commence ta série dès aujourd'hui !";
  if (count === 1) return 'Belle entame. Reviens demain pour continuer ta série.';
  if (count < 7) return `Tu es sur ${count} jours d'affilée. Ne casse pas le rythme !`;
  if (count < 30) return `${count} jours de suite — tu deviens un habitué`;
  if (count < 100) return `${count} jours — légendaire. Tu vas chercher le permis.`;
  return `${count} jours — culte. Respect total.`;
}

/** Assombrit une couleur hex de N% (négatif = plus sombre). */
function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + percent));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
