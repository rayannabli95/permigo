// ═══════════════════════════════════════════════════════════════
// Level up — célébration plein écran quand l'élève passe un niveau.
//
// L'XP est DÉRIVÉE des compétences validées (cf. game-state.js :
// XP_PER_COMP=100, XP_PER_LEVEL=500 → 1 niveau tous les 5 compétences).
// On ne stocke donc PAS l'XP ; on mémorise juste le dernier niveau VU
// (pg-level-seen) pour ne célébrer qu'une vraie montée, une seule fois.
//
// Usage :
//   import { levelForCount, checkLevelUp, showLevelUp } from "@/components/eleve/level-up.js";
//   const lvl = levelForCount(acquiredCount);
//   if (checkLevelUp(lvl)) showLevelUp({ level: lvl, onClose });
// Et côté HUD (pour fixer la référence sans célébrer) : markLevelSeen(level).
// ═══════════════════════════════════════════════════════════════
import { ASSETS } from "@/utils/assets.js";

const LS_SEEN = "pg-level-seen";
const COMPS_PER_LEVEL = 5; // 500 XP / (100 XP par compétence)

/** Niveau correspondant à un nombre de compétences acquises. */
export function levelForCount(count = 0) {
  return Math.floor((Number(count) || 0) / COMPS_PER_LEVEL) + 1;
}

function _seen() {
  const v = parseInt(localStorage.getItem(LS_SEEN) || "", 10);
  return Number.isFinite(v) ? v : null;
}

/** Pose la référence sans rien célébrer (à appeler au rendu du HUD). */
export function markLevelSeen(level) {
  const lvl = Math.max(1, Number(level) || 1);
  const s = _seen();
  if (s === null || lvl > s) {
    try {
      localStorage.setItem(LS_SEEN, String(lvl));
    } catch {}
  }
}

/**
 * Retourne `level` si c'est une VRAIE montée (au-dessus du dernier vu), sinon 0.
 * Met à jour la référence. Au tout premier appel (aucune référence), n'éclate
 * pas la fanfare : on enregistre juste le niveau courant.
 */
export function checkLevelUp(level) {
  const lvl = Math.max(1, Number(level) || 1);
  const s = _seen();
  try {
    localStorage.setItem(LS_SEEN, String(lvl));
  } catch {}
  if (s === null) return 0; // 1ʳᵉ visite : on cale la référence, pas de fanfare
  return lvl > s ? lvl : 0;
}

let _busy = false;

/** Overlay plein écran « Niveau N ». */
export function showLevelUp({ level, onClose } = {}) {
  if (_busy) return;
  _busy = true;
  const lvl = Math.max(2, Number(level) || 2);

  try {
    navigator.vibrate?.([18, 60, 28]);
  } catch {}

  const el = document.createElement("div");
  el.className = "lvlup";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", `Niveau ${lvl} atteint`);
  el.innerHTML = `
    <style>
      .lvlup{position:fixed;inset:0;z-index:10050;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:6px;text-align:center;
        padding:calc(env(safe-area-inset-top,0px) + 24px) 28px calc(env(safe-area-inset-bottom,0px) + 28px);
        background:radial-gradient(120% 90% at 50% 18%,#2a2350 0%,#15132e 48%,#090814 100%);
        animation:lvlupIn .32s cubic-bezier(.2,.7,.3,1) both;overflow:hidden}
      .lvlup__rays{position:absolute;inset:-30%;background:
        conic-gradient(from 0deg,rgba(255,210,120,.18) 0 12deg,transparent 12deg 30deg);
        animation:lvlupSpin 14s linear infinite;pointer-events:none}
      .lvlup__kick{position:relative;font:800 13px/1 'Plus Jakarta Sans',system-ui,sans-serif;
        letter-spacing:.24em;text-transform:uppercase;color:#ffd27a;margin-bottom:2px}
      .lvlup__coin{position:relative;width:118px;height:118px;object-fit:contain;
        filter:drop-shadow(0 14px 26px rgba(120,80,10,.55));animation:lvlupPop .5s cubic-bezier(.34,1.56,.64,1) both .08s}
      .lvlup__ring{position:absolute;top:50%;left:50%;width:118px;height:118px;border-radius:50%;
        transform:translate(-50%,-50%);box-shadow:0 0 0 0 rgba(255,210,120,.5);animation:lvlupRing 1.1s ease-out .2s both}
      .lvlup__big{position:relative;font:900 76px/1 'Plus Jakarta Sans',system-ui,sans-serif;
        color:#fff;letter-spacing:-.03em;margin-top:8px;
        text-shadow:0 4px 24px rgba(167,139,250,.5);animation:lvlupPop .5s cubic-bezier(.34,1.56,.64,1) both .14s}
      .lvlup__lbl{position:relative;font:800 16px/1.3 'Plus Jakarta Sans',system-ui,sans-serif;
        color:#cfc6ff;letter-spacing:.02em}
      .lvlup__sub{position:relative;font:500 14px/1.5 'Inter',system-ui,sans-serif;
        color:rgba(255,255,255,.7);max-width:300px;margin-top:8px}
      .lvlup__cta{position:relative;margin-top:26px;padding:15px 40px;border:0;border-radius:16px;
        background:linear-gradient(180deg,#7652d1,#7c4dff);color:#fff;cursor:pointer;
        font:800 15px 'Plus Jakarta Sans',system-ui,sans-serif;letter-spacing:-.01em;
        box-shadow:0 8px 22px -6px rgba(124,77,255,.6),0 2px 0 rgba(0,0,0,.18);
        animation:lvlupPop .4s cubic-bezier(.34,1.56,.64,1) both .3s;-webkit-tap-highlight-color:transparent}
      .lvlup__cta:active{transform:translateY(2px)}
      @keyframes lvlupIn{from{opacity:0}to{opacity:1}}
      @keyframes lvlupOut{to{opacity:0;transform:scale(.96)}}
      @keyframes lvlupSpin{to{transform:rotate(360deg)}}
      @keyframes lvlupPop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
      @keyframes lvlupRing{from{box-shadow:0 0 0 0 rgba(255,210,120,.55)}to{box-shadow:0 0 0 60px rgba(255,210,120,0)}}
      @media (prefers-reduced-motion:reduce){.lvlup__rays,.lvlup__ring{animation:none}.lvlup,.lvlup *{animation-duration:.01ms!important}}
    </style>
    <div class="lvlup__rays" aria-hidden="true"></div>
    <div class="lvlup__kick">Niveau supérieur</div>
    <div style="position:relative;display:inline-block">
      <span class="lvlup__ring" aria-hidden="true"></span>
      <img class="lvlup__coin" src="${ASSETS.volantCoin}" alt="" aria-hidden="true">
    </div>
    <div class="lvlup__big">${lvl}</div>
    <div class="lvlup__lbl">Tu passes niveau ${lvl}</div>
    <div class="lvlup__sub">Continue à valider tes compétences pour grimper les ligues.</div>
    <button class="lvlup__cta" id="lvlup-cta" type="button">Continuer</button>
  `;
  document.body.appendChild(el);

  // Pluie de jetons dorés.
  import("@/components/common/confetti.js")
    .then(({ burstConfetti }) => {
      burstConfetti?.({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.32,
        count: 60,
        spread: 150,
        power: 1.1,
      });
    })
    .catch(() => {});

  const close = () => {
    el.style.animation = "lvlupOut .26s ease both";
    setTimeout(() => {
      el.remove();
      _busy = false;
      try {
        onClose?.();
      } catch {}
    }, 240);
  };
  el.querySelector("#lvlup-cta")?.addEventListener("click", close);
  el.addEventListener("click", (e) => {
    if (e.target === el) close();
  });
}
