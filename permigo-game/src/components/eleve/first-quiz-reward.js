// ═══════════════════════════════════════════════════════════════
// Récompense « 1er quiz réussi » — overlay plein écran (Arène nuit-violet
// + or). Le tout premier quiz réussi débloque un COFFRE offert :
//   - « Ouvrir le coffre » → pose un drapeau session + va sur #/roue
//     (la route garde son nom, la roue elle-même a été retirée le 06/08/2026).
//     L'install (A2HS) est pitchée JUSTE APRÈS le tour, sur la page roue
//     (meilleur moment de valeur — cf. roue.js maybeInstallAfterSpin()).
//   - « Plus tard » → ferme et pitche l'install ici (l'élève a quand même
//     réussi un quiz = moment de valeur).
// Déclenché une seule fois (flag posé côté quiz.js). Esc ferme.
// ═══════════════════════════════════════════════════════════════
import { track } from "@/services/analytics.js";
import { playReward } from "@/utils/sound.js";
import { haptic } from "@/utils/haptic.js";

// Drapeau lu par roue.js après le tour pour pitcher l'install au bon moment.
const INSTALL_AFTER_ROUE_KEY = "pg-install-after-roue";

const CSS = `
  .fqr{position:fixed;inset:0;z-index:8600;display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:0;padding:32px 24px calc(28px + env(safe-area-inset-bottom,0px));text-align:center;opacity:0;transition:opacity .3s ease;
    background:radial-gradient(120% 80% at 50% 0%,#3a2a7a 0%,#201748 55%,#17123a 100%);}
  .fqr.on{opacity:1;}
  .fqr-stars{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
  .fqr-star{position:absolute;color:#ffce4d;opacity:.55;font-size:14px;animation:fqrTwinkle 2.4s ease-in-out infinite;}
  .fqr-badge{width:96px;height:96px;object-fit:contain;filter:drop-shadow(0 12px 26px rgba(0,0,0,.4));
    animation:fqrPop .5s cubic-bezier(.34,1.56,.64,1) both;}
  .fqr-title{font:800 24px/1.2 'Archivo',sans-serif;color:#fff;margin:14px 0 0;letter-spacing:-.01em;}
  .fqr-sub{font:500 14px/1.45 'Archivo',sans-serif;color:#cdc2f5;margin:6px 0 0;max-width:300px;}
  .fqr-reward{margin:24px 0 0;width:100%;max-width:360px;position:relative;overflow:hidden;display:flex;align-items:center;gap:14px;
    border-radius:24px;padding:18px;background:linear-gradient(160deg,#4a2fa8,#2f2170);
    border:1px solid rgba(255,206,77,.4);box-shadow:0 16px 40px -14px rgba(255,206,77,.35);
    animation:fqrRise .5s .12s cubic-bezier(.34,1.4,.64,1) both;}
  .fqr-glow{position:absolute;top:-40px;right:-30px;width:120px;height:120px;border-radius:50%;
    background:radial-gradient(circle,rgba(255,206,77,.35),transparent 70%);}
  /* La roue a ete retiree le 06/08/2026 : c'est un coffre qui attend au bout
     du bouton, lui montrer une roue ici trompait sur ce qui allait s'ouvrir. */
  .fqr-chest{width:72px;flex-shrink:0;position:relative;
    filter:drop-shadow(0 6px 12px rgba(0,0,0,.5));
    animation:fqrBob 3.4s ease-in-out infinite;}
  @keyframes fqrBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  .fqr-rbody{position:relative;flex:1;text-align:left;}
  .fqr-tag{font:800 11px/1 'Archivo',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#ffce4d;}
  .fqr-rt{font:700 16.5px/1.2 'Archivo',sans-serif;color:#fff;margin-top:3px;}
  .fqr-rs{font:500 12px/1.35 'Archivo',sans-serif;color:#cdc2f5;margin-top:3px;}
  .fqr-cta{margin:22px 0 0;width:100%;max-width:360px;min-height:56px;border:0;border-radius:18px;cursor:pointer;
    font:800 16px/1 'Archivo',sans-serif;color:#1a1233;display:flex;align-items:center;justify-content:center;gap:8px;
    background:linear-gradient(180deg,#ffe39a,#f0a500);
    box-shadow:0 10px 24px -8px rgba(255,206,77,.6),inset 0 2px 0 rgba(255,255,255,.5);
    transition:transform .12s;-webkit-tap-highlight-color:transparent;}
  .fqr-cta:active{transform:scale(.98);}
  .fqr-later{margin:14px 0 0;background:none;border:0;cursor:pointer;padding:10px 14px;
    font:600 13.5px/1 'Archivo',sans-serif;color:#9b8fd0;-webkit-tap-highlight-color:transparent;}
  .fqr-later:active{color:#fff;}
  @keyframes fqrPop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
  @keyframes fqrRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes fqrTwinkle{0%,100%{opacity:.25;transform:scale(.85)}50%{opacity:.7;transform:scale(1)}}
  @media (prefers-reduced-motion:reduce){
    .fqr,.fqr-badge,.fqr-reward,.fqr-chest,.fqr-star{animation:none!important;transition:opacity .2s ease!important;}
  }
`;

const STARS = [
  { t: 12, l: 16, d: 0 },
  { t: 20, l: 82, d: 0.6 },
  { t: 34, l: 40, d: 1.1 },
  { t: 15, l: 60, d: 1.6 },
  { t: 44, l: 8, d: 0.3 },
  { t: 40, l: 90, d: 0.9 },
];

/**
 * Affiche l'overlay de récompense du 1er quiz réussi.
 * @param {{me?:object, scorePct?:number}} opts
 */
export function showFirstQuizReward({ me = null, scorePct = null } = {}) {
  if (document.querySelector(".fqr")) return;

  const ov = document.createElement("div");
  ov.className = "fqr";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "Premier quiz réussi. Un coffre offert");
  ov.innerHTML = `
    <style>${CSS}</style>
    <div class="fqr-stars" aria-hidden="true">
      ${STARS.map(
        (s) =>
          `<span class="fqr-star" style="top:${s.t}%;left:${s.l}%;animation-delay:${s.d}s">✦</span>`,
      ).join("")}
    </div>
    <img class="fqr-badge" src="/skins/mascot-celebrate.png" alt="" />
    <h2 class="fqr-title">Premier quiz réussi&nbsp;! 🎉</h2>
    <p class="fqr-sub">Tu débloques un coffre offert.</p>
    <div class="fqr-reward">
      <div class="fqr-glow" aria-hidden="true"></div>
      <img class="fqr-chest" src="/skins/chest-closed.png" alt="" aria-hidden="true" draggable="false" />
      <div class="fqr-rbody">
        <div class="fqr-tag">Cadeau débloqué</div>
        <div class="fqr-rt">Un coffre offert</div>
        <div class="fqr-rs">De vrais volants à gagner 🪙</div>
      </div>
    </div>
    <button class="fqr-cta" id="fqr-go" type="button">🎁 Ouvrir le coffre</button>
    <button class="fqr-later" id="fqr-later" type="button">Plus tard</button>
  `;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add("on"));
  playReward();
  haptic("success");
  track("first_quiz_reward.shown", { score_pct: scorePct });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey);
    ov.classList.remove("on");
    setTimeout(() => ov.remove(), 320);
  };

  function onKey(e) {
    if (e.key === "Escape") later();
  }

  function goRoue() {
    track("first_quiz_reward.spin");
    try {
      sessionStorage.setItem(INSTALL_AFTER_ROUE_KEY, "1");
    } catch {
      /* pas de sessionStorage → on pitchera l'install autrement, pas grave */
    }
    close();
    location.hash = "#/roue";
  }

  function later() {
    track("first_quiz_reward.later");
    close();
    // L'élève zappe le coffre mais vient de réussir un quiz → moment de valeur.
    import("@/components/common/install-nudge.js")
      .then((m) => m.promptInstallAtValueMoment(me, "eleve_first_quiz_skip"))
      .catch(() => {});
  }

  ov.querySelector("#fqr-go").addEventListener("click", goRoue);
  ov.querySelector("#fqr-later").addEventListener("click", later);
  document.addEventListener("keydown", onKey);
}
