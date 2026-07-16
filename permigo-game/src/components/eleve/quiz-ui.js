// ═══════════════════════════════════════════════════════════════
// Quiz UI — langage visuel partagé par tous les quizz élève
// (quiz-engine overlay, flash-quiz). Une seule source de vérité
// pour : carte question, pips de progression, options A/B/C/D,
// hero de célébration, révélation douce, écran de résultat.
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { ill } from "@/utils/illustrations.js";
import { muteButtonHTML } from "@/utils/speech.js";
import {
  quizVisualHTML,
  QUIZ_VISUAL_STYLE,
} from "@/components/eleve/quiz-visuals.js";

// ─── Texte ───────────────────────────────────────────────────────

// Esc + **mot** → <strong> + auto-bold des chiffres/unités/mots-pièges
export function richEsc(str) {
  return esc(String(str ?? ""))
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /\b(\d+(?:[.,]\d+)?\s*(?:%|km\/h|m|sec|secondes?|min|minutes?|heures?|jours?|mois|g\/L))\b/gi,
      "<strong>$1</strong>",
    )
    .replace(
      /\b(JAMAIS|TOUJOURS|OBLIGATOIRE|INTERDIT|IMPÉRATIF|AUCUN)\b/g,
      "<strong>$1</strong>",
    );
}

// Encouragements bonne réponse — variés, jamais 2× le même d'affilée
const PRAISES = [
  "Dans le mille !",
  "Tu gères.",
  "Pile poil !",
  "Réflexe parfait.",
  "Bien vu !",
  "Exactement ça.",
  "Au quart de tour !",
  "Ça roule !",
  "Solide.",
  "Comme un pro.",
];
// En-têtes mauvaise réponse — ton coach, jamais punitif
const COACH_HEADS = [
  "Le bon réflexe",
  "À garder en tête",
  "Pour la prochaine fois",
  "Le truc à retenir",
  "Bon à savoir",
];
let _lastPraise = -1;
let _lastCoach = -1;

function pickVaried(pool, last) {
  let i = Math.floor(Math.random() * pool.length);
  if (i === last) i = (i + 1) % pool.length;
  return i;
}

export function pickPraise() {
  _lastPraise = pickVaried(PRAISES, _lastPraise);
  return PRAISES[_lastPraise];
}

export function pickCoachHead() {
  _lastCoach = pickVaried(COACH_HEADS, _lastCoach);
  return COACH_HEADS[_lastCoach];
}

// Messages de fin — varient selon le palier
const RESULT_MSGS = {
  perfect: [
    "Sans-faute. Sérieux ?!",
    "100 %. Chapeau.",
    "Zéro erreur — propre.",
  ],
  passed: [
    "Bien joué, ça avance !",
    "Solide. Continue comme ça.",
    "Tu progresses, ça se voit.",
  ],
  learn: [
    "Chaque question t'apprend un truc.",
    "On retient mieux après une erreur — c'est prouvé.",
    "Pas grave : maintenant tu sais.",
  ],
};

export function pickResultMsg({ perfect, passed }) {
  const pool = perfect
    ? RESULT_MSGS.perfect
    : passed
      ? RESULT_MSGS.passed
      : RESULT_MSGS.learn;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Rendu ───────────────────────────────────────────────────────

const KEYS = ["A", "B", "C", "D", "E", "F"];

// Pips segmentés (1 par question) — remplace la barre fine
export function pipsHTML(idx, total) {
  const pips = Array.from({ length: total }, (_, i) => {
    const cls = i < idx ? "done" : i === idx ? "cur" : "";
    return `<span class="qz-pip ${cls}"></span>`;
  }).join("");
  return `
    <div class="qz-top">
      <div class="qz-pips" role="progressbar" aria-valuemin="1" aria-valuenow="${idx + 1}" aria-valuemax="${total}" aria-label="Question ${idx + 1} sur ${total}">${pips}</div>
      <span class="qz-count">${idx + 1}/${total}</span>
    </div>`;
}

// Corps de question complet : pips + énoncé + options A/B/C/D
export function questionHTML({ q, idx, total }) {
  return `
    ${pipsHTML(idx, total)}
    <div class="qz-qhead">
      ${muteButtonHTML()}
      <h3 class="qz-q">${richEsc(q.question)}</h3>
    </div>
    ${quizVisualHTML(q.question)}
    <div class="qz-opts">
      ${(q.options || [])
        .map(
          (opt, i) => `
        <button class="qz-opt" data-i="${i}" type="button">
          <span class="qz-key">${KEYS[i] || i + 1}</span>
          <span class="qz-txt">${richEsc(opt)}</span>
        </button>`,
        )
        .join("")}
    </div>`;
}

// Révélation : hero spring sur bonne réponse choisie, révélation
// calme (sans secousse) sinon. Retourne `correct`.
export function applyReveal(container, { chosen, correctIndex }) {
  const correct = chosen === correctIndex;
  container.querySelectorAll(".qz-opt").forEach((b) => {
    b.disabled = true;
    const i = parseInt(b.dataset.i, 10);
    if (i === correctIndex) {
      b.classList.add("ok");
      if (correct) b.classList.add("hero");
      const key = b.querySelector(".qz-key");
      if (key) key.innerHTML = ill("coche", { size: 20 });
    } else if (i === chosen) {
      // Mauvais choix : on grise doucement, AUCUNE animation punitive
      b.classList.add("miss");
    } else {
      b.classList.add("fade");
    }
  });
  return correct;
}

// Bandeau de célébration (bonne réponse) — phrase variée + série
export function praiseHTML({ streak = 0 } = {}) {
  const flame =
    streak >= 2
      ? `<span class="qz-streak">${icon("flame", { size: 14, strokeWidth: 2.5 })} Série de ${streak}</span>`
      : "";
  return `
    <div class="qz-praise" role="status">
      <span class="qz-praise-txt">${esc(pickPraise())}</span>${flame}
    </div>`;
}

// Bloc explication — coach bienveillant, jamais « faux ! »
export function explHTML({ correct, explanation }) {
  if (!explanation) return "";
  const head = correct
    ? `${icon("check-circle", { size: 14, strokeWidth: 2.5 })} Pourquoi c'est juste`
    : `${icon("lightbulb", { size: 14, strokeWidth: 2.5 })} ${esc(pickCoachHead())}`;
  return `
    <div class="qz-expl ${correct ? "ok" : "soft"}">
      <div class="qz-expl-h">${head}</div>
      <div class="qz-expl-b">${richEsc(explanation)}</div>
    </div>`;
}

// Écran de résultat (corps) — gros score Fredoka + mascotte + message varié
export function resultHTML({ score, total, ctaLabel = "Continuer" }) {
  const perfect = score === total;
  const passed = score >= total * 0.6;
  return `
    <div class="qz-result">
      <img class="qz-mascot-result" src="/skins/${passed ? "mascot-celebrate" : "mascot-coach"}.png" alt="" aria-hidden="true" />
      <div class="qz-score${perfect ? " gold" : ""}">${score}<span class="qz-score-sep">/</span>${total}</div>
      <p class="qz-result-msg">${esc(pickResultMsg({ perfect, passed }))}</p>
      <button class="qz-cta" type="button">${esc(ctaLabel)}</button>
    </div>`;
}

// Mascotte d'angle (état pensif/célébration/coach)
export function mascotHTML(state = "think") {
  return `<img class="qz-mascot" src="/skins/mascot-${esc(state)}.png" alt="" aria-hidden="true" />`;
}

export function setMascot(container, state) {
  const img = container.querySelector(".qz-mascot");
  if (!img) return;
  // Swap src only if actually different (avoids spurious reflow)
  const next = `/skins/mascot-${state}.png`;
  if (img.src.endsWith(next.replace(/^\//, ""))) return;
  img.src = next;
  // Micro-pop on state change: remove + force reflow + re-add so the
  // animation fires even when called twice in a row with different states.
  img.classList.remove("qz-mascot--pop");
  void img.offsetWidth; // force reflow
  img.classList.add("qz-mascot--pop");
}

// ─── Styles partagés ─────────────────────────────────────────────
// Fond sombre « épreuve » commun aux deux contextes (overlay + page).
export const QUIZ_STYLE = `<style>
  :root{
    --qz-out:cubic-bezier(.23,1,.32,1);--qz-spring:cubic-bezier(.34,1.56,.64,1);
    --qz-gold:#ffcb3d;--qz-gold2:#ff9b1e;--qz-gold-deep:#e07b00;
    --qz-btn-top:#3a3470;--qz-btn-bot:#231d4f;--qz-btn-edge:#15113a;
    --qz-sel-top:#ffd24a;--qz-sel-bot:#ff9c1c;--qz-sel-edge:#b85e00;
  }

  /* Mascotte (coin de l'arène) */
  .qz-mascot{position:absolute;top:-32px;right:10px;width:84px;height:84px;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(0,0,0,.45));animation:qzMascotIn .4s var(--qz-spring) both,qzMascotFloat 3.2s ease-in-out .4s infinite;pointer-events:none;z-index:3}
  .qz-mascot-result{display:block;margin:0 auto 4px;width:112px;height:112px;object-fit:contain;animation:qzMascotIn .45s var(--qz-spring) both;filter:drop-shadow(0 10px 18px rgba(0,0,0,.4))}
  @keyframes qzMascotIn{from{opacity:0;transform:scale(.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes qzMascotFloat{0%,100%{transform:translateY(0) rotate(2deg)}50%{transform:translateY(-7px) rotate(-2deg)}}
  /* Micro-pop on state change (celebrate / coach) */
  .qz-mascot--pop{animation:qzMascotPop .38s var(--qz-spring) both}
  @keyframes qzMascotPop{0%{transform:scale(1) translateY(0)}30%{transform:scale(1.18) translateY(-5px)}70%{transform:scale(.96) translateY(1px)}100%{transform:scale(1) translateY(0)}}

  /* Progression — pips dorés glow */
  .qz-top{display:flex;align-items:center;gap:12px;margin-bottom:22px;padding-right:70px} /* réserve l'angle à la mascotte */
  .qz-pips{display:flex;flex:1;gap:7px}
  .qz-pip{flex:1;height:11px;border-radius:6px;background:#251f56;box-shadow:inset 0 2px 3px rgba(0,0,0,.5),inset 0 -1px 0 rgba(255,255,255,.04);position:relative;overflow:hidden}
  .qz-pip.done{background:linear-gradient(180deg,#ffd95e,#f59b16);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 0 10px rgba(255,170,40,.5)}
  .qz-pip.cur{background:linear-gradient(180deg,#ffe588,#ff9d1f);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 0 16px rgba(255,180,50,.85);animation:qzPipPulse 1.4s ease-in-out infinite}
  .qz-pip.cur::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:translateX(-120%);animation:qzPipShine 1.8s ease-in-out infinite}
  @keyframes qzPipPulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}
  @keyframes qzPipShine{0%{transform:translateX(-120%)}60%,100%{transform:translateX(220%)}}
  .qz-count{font:800 13px/1 'Baloo 2','Fredoka',sans-serif;color:#ffd06a;font-variant-numeric:tabular-nums;text-shadow:0 1px 0 rgba(0,0,0,.4)}

  /* Énoncé */
  .qz-qhead{display:flex;align-items:flex-start;gap:12px;margin:0 0 22px}
  .qz-qhead .qz-q{margin:0;flex:1 1 auto}
  .qz-mute:active{transform:scale(.92)}
  .qz-q{font:700 clamp(20px,5.4vw,25px)/1.34 'Baloo 2','Fredoka',sans-serif;color:#fff;margin:0 0 22px;letter-spacing:-.01em;max-width:32em;text-shadow:0 2px 0 rgba(0,0,0,.32),0 0 18px rgba(120,90,230,.35)}
  .qz-q strong{color:#0d0a26;font-weight:700;padding:1px 8px;border-radius:9px;background:linear-gradient(180deg,#ffe27a,#ffb02e);box-shadow:0 3px 0 var(--qz-gold-deep),inset 0 1px 0 rgba(255,255,255,.6);text-shadow:none;-webkit-box-decoration-break:clone;box-decoration-break:clone}

  /* Options A/B/C/D — boutons « plastique » 3D */
  .qz-opts{display:flex;flex-direction:column;gap:13px}
  .qz-opt{position:relative;display:flex;align-items:center;gap:13px;min-height:60px;padding:13px 16px;border-radius:18px;background:linear-gradient(180deg,var(--qz-btn-top),var(--qz-btn-bot));border:1px solid rgba(255,255,255,.06);box-shadow:0 7px 0 var(--qz-btn-edge),0 12px 16px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.26),inset 0 -2px 6px rgba(0,0,0,.4);color:#ece8ff;font:500 15.5px/1.25 'Fredoka','Inter',sans-serif;text-align:left;cursor:pointer;touch-action:manipulation;transform:translateY(0);transition:transform .08s ease,box-shadow .08s ease,opacity .25s var(--qz-out);opacity:0;animation:qzOptIn .5s var(--qz-spring) both}
  .qz-opt:nth-child(1){animation-delay:.06s}
  .qz-opt:nth-child(2){animation-delay:.13s}
  .qz-opt:nth-child(3){animation-delay:.20s}
  .qz-opt:nth-child(4){animation-delay:.27s}
  @keyframes qzOptIn{0%{opacity:0;transform:translateY(16px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}
  .qz-key{flex:none;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;background:linear-gradient(180deg,#2b2560,#1b1545);color:#cfc7ff;font:800 17px/1 'Baloo 2','Fredoka',sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 3px 0 #110d35,inset 0 -2px 4px rgba(0,0,0,.4);transition:background .2s,color .2s}
  .qz-txt{flex:1}
  .qz-txt strong{font-weight:700;color:#ffd76a}
  .qz-opt:active:not(:disabled){transform:translateY(5px);box-shadow:0 2px 0 var(--qz-btn-edge),0 4px 8px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.26),inset 0 -2px 6px rgba(0,0,0,.4)}
  .qz-opt:disabled{cursor:default}

  /* Bonne réponse = bouton OR (le « win ») */
  .qz-opt.ok{background:linear-gradient(180deg,var(--qz-sel-top),var(--qz-sel-bot));border:1px solid rgba(255,255,255,.35);color:#3a1d00;box-shadow:0 5px 0 var(--qz-sel-edge),0 10px 20px rgba(255,140,30,.4),inset 0 1px 0 rgba(255,255,255,.65),inset 0 -2px 6px rgba(180,80,0,.3)}
  .qz-opt.ok .qz-key{background:linear-gradient(180deg,#fff,#ffe7a8);color:#c46a00;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 3px 0 #c46a00}
  .qz-opt.ok .qz-txt{font-weight:600}
  .qz-opt.ok .qz-txt strong{color:#7a3d00}
  /* Hero : pop spring sur la bonne réponse choisie */
  .qz-opt.hero{animation:qzHero .55s var(--qz-spring) both}
  @keyframes qzHero{0%{transform:scale(1)}40%{transform:scale(1.04);box-shadow:0 5px 0 var(--qz-sel-edge),0 0 0 5px rgba(255,210,90,.35),0 12px 28px rgba(255,150,30,.45),inset 0 1px 0 rgba(255,255,255,.65)}100%{transform:scale(1);box-shadow:0 5px 0 var(--qz-sel-edge),0 0 0 3px rgba(255,210,90,.25),0 10px 20px rgba(255,140,30,.4),inset 0 1px 0 rgba(255,255,255,.65)}}
  /* Mauvais choix : doux, jamais punitif */
  .qz-opt.miss{background:linear-gradient(180deg,#4a2740,#34203a);border-color:rgba(255,160,90,.3);color:#ffd9c2;box-shadow:0 5px 0 #1f1430,inset 0 1px 0 rgba(255,255,255,.12);opacity:.92}
  .qz-opt.miss .qz-key{background:linear-gradient(180deg,#5a3450,#3a2440);color:#ffb890}
  .qz-opt.fade{opacity:.4;box-shadow:0 4px 0 var(--qz-btn-edge),inset 0 1px 0 rgba(255,255,255,.1)}

  /* Bandeau de célébration */
  .qz-praise{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:18px;animation:qzPraiseIn .45s var(--qz-spring) both}
  .qz-praise-txt{font:700 23px/1.2 'Baloo 2','Fredoka',sans-serif;background:linear-gradient(110deg,#ffe27a,#ff9b1e);-webkit-background-clip:text;background-clip:text;color:transparent}
  .qz-streak{display:inline-flex;align-items:center;gap:5px;font:700 12px/1 'Inter',sans-serif;color:#3a1d00;background:linear-gradient(180deg,#ffd24a,#ff9c1c);border:1px solid rgba(255,255,255,.4);border-radius:999px;padding:6px 11px;box-shadow:0 3px 0 var(--qz-sel-edge);animation:qzStreakPop .5s var(--qz-spring) .15s both}
  @keyframes qzPraiseIn{from{opacity:0;transform:translateY(6px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes qzStreakPop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}

  /* Explication — coach */
  .qz-expl{margin-top:14px;padding:15px 16px;border-radius:16px;font:500 14.5px/1.6 'Inter',sans-serif;animation:qzExplIn .35s var(--qz-out) both}
  .qz-expl strong{font-weight:800;color:#ffd76a}
  .qz-expl.ok{background:rgba(255,180,60,.1);border:1px solid rgba(255,180,60,.3);color:#ffeccc}
  .qz-expl.soft{background:rgba(129,140,248,.1);border:1px solid rgba(129,140,248,.32);color:#e2e8f0}
  .qz-expl-h{display:flex;align-items:center;gap:6px;font:800 13px/1 'Baloo 2','Fredoka',sans-serif;margin-bottom:7px}
  .qz-expl.ok .qz-expl-h{color:#ffd06a}
  .qz-expl.soft .qz-expl-h{color:#c7d2fe}
  @keyframes qzExplIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}

  /* Résultat */
  .qz-result{text-align:center;padding:18px 0 6px}
  .qz-score{font:700 66px/1 'Baloo 2','Fredoka',sans-serif;background:linear-gradient(180deg,#cdc7ff,#8b80e8);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:10px}
  .qz-score.gold{background:linear-gradient(180deg,#ffe27a,#ff9b1e);-webkit-background-clip:text;background-clip:text}
  .qz-score-sep{font-size:.55em;margin:0 2px;-webkit-text-fill-color:#5b5392}
  .qz-result-msg{font:600 17px/1.45 'Inter',sans-serif;color:#cbc6f0;margin:0 0 24px}
  .qz-cta,.qz-next{border:0;color:#3a1d00;font:800 15.5px/1 'Baloo 2','Fredoka',sans-serif;cursor:pointer;touch-action:manipulation;background:linear-gradient(180deg,var(--qz-sel-top),var(--qz-sel-bot));box-shadow:0 5px 0 var(--qz-sel-edge),0 8px 18px rgba(255,140,30,.35),inset 0 1px 0 rgba(255,255,255,.5);transition:transform .1s ease,box-shadow .1s ease}
  .qz-cta{padding:15px 38px;min-height:52px;border-radius:16px}
  .qz-cta:active,.qz-next:active{transform:translateY(4px);box-shadow:0 1px 0 var(--qz-sel-edge),0 3px 8px rgba(255,140,30,.3),inset 0 1px 0 rgba(255,255,255,.5)}

  /* Bouton « Suivant » pleine largeur (engine) */
  .qz-next{width:100%;margin-top:16px;padding:16px;min-height:54px;border-radius:16px;animation:qzExplIn .3s var(--qz-out) .1s both}

  /* Reduced motion : on garde les fondus, on coupe les mouvements */
  @media (prefers-reduced-motion: reduce){
    .qz-mascot,.qz-mascot-result,.qz-mascot--pop,.qz-pip.cur,.qz-pip.cur::after{animation:none!important}
    .qz-opt,.qz-praise,.qz-streak,.qz-expl,.qz-next{animation-duration:.01ms;animation-delay:0ms}
    .qz-opt.hero{animation:none}
  }
</style>` + QUIZ_VISUAL_STYLE;
