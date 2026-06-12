// ═══════════════════════════════════════════════════════════════
// Quiz UI — langage visuel partagé par tous les quizz élève
// (quiz-engine overlay, flash-quiz). Une seule source de vérité
// pour : carte question, pips de progression, options A/B/C/D,
// hero de célébration, révélation douce, écran de résultat.
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";

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
    <h3 class="qz-q">${richEsc(q.question)}</h3>
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
      if (key) key.innerHTML = icon("check", { size: 16, strokeWidth: 3 });
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
  if (img) img.src = `/skins/mascot-${state}.png`;
}

// ─── Styles partagés ─────────────────────────────────────────────
// Fond sombre « épreuve » commun aux deux contextes (overlay + page).
export const QUIZ_STYLE = `<style>
  :root{--qz-out:cubic-bezier(.23,1,.32,1);--qz-spring:cubic-bezier(.34,1.56,.64,1);--qz-gold:#f59e0b}

  /* Mascotte */
  .qz-mascot{position:absolute;top:-34px;right:14px;width:76px;height:76px;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,.35));animation:qzMascotIn .4s var(--qz-spring) both,qzMascotFloat 3.2s ease-in-out .4s infinite;pointer-events:none;z-index:2}
  .qz-mascot-result{display:block;margin:0 auto 4px;width:104px;height:104px;object-fit:contain;animation:qzMascotIn .45s var(--qz-spring) both}
  @keyframes qzMascotIn{from{opacity:0;transform:scale(.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes qzMascotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

  /* Progression — pips segmentés */
  .qz-top{display:flex;align-items:center;gap:12px;margin-bottom:22px;padding-right:62px} /* réserve l'angle à la mascotte */
  .qz-pips{display:flex;flex:1;gap:6px}
  .qz-pip{flex:1;height:7px;border-radius:4px;background:rgba(148,163,184,.18);position:relative;overflow:hidden}
  .qz-pip::after{content:"";position:absolute;inset:0;border-radius:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6);transform:scaleX(0);transform-origin:left;transition:transform .35s var(--qz-out)}
  .qz-pip.done::after{transform:scaleX(1)}
  .qz-pip.cur{box-shadow:0 0 0 1.5px rgba(129,140,248,.55)}
  .qz-pip.cur::after{transform:scaleX(.35);background:linear-gradient(90deg,#818cf8,#a78bfa)}
  .qz-count{font:700 13px/1 'IBM Plex Mono',monospace;color:#a5b4fc;font-variant-numeric:tabular-nums}

  /* Énoncé */
  .qz-q{font:800 clamp(20px,5.2vw,25px)/1.45 'Plus Jakarta Sans',sans-serif;color:#fff;margin:0 0 22px;letter-spacing:-.015em;max-width:32em}
  .qz-q strong{font-weight:900;color:#fcd34d;background:linear-gradient(transparent 68%,rgba(252,211,77,.14) 68%);padding:0 2px;border-radius:2px}

  /* Options A/B/C/D */
  .qz-opts{display:flex;flex-direction:column;gap:12px}
  .qz-opt{display:flex;align-items:center;gap:13px;min-height:56px;padding:13px 15px;background:rgba(99,102,241,.13);border:1.5px solid rgba(129,140,248,.4);border-radius:16px;color:#fff;font:600 16px/1.4 'Inter',sans-serif;text-align:left;cursor:pointer;touch-action:manipulation;transition:background .18s,border-color .18s,opacity .25s var(--qz-out),transform .14s var(--qz-out);animation:qzOptIn .28s var(--qz-out) both}
  .qz-opt:nth-child(2){animation-delay:40ms}
  .qz-opt:nth-child(3){animation-delay:80ms}
  .qz-opt:nth-child(4){animation-delay:120ms}
  @keyframes qzOptIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .qz-key{flex:none;display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:rgba(129,140,248,.22);color:#c7d2fe;font:800 13px/1 'Plus Jakarta Sans',sans-serif;transition:background .2s,color .2s}
  .qz-txt{flex:1}
  .qz-txt strong{font-weight:800;color:#fcd34d}
  @media(hover:hover)and(pointer:fine){.qz-opt:hover:not(:disabled){background:rgba(99,102,241,.24);border-color:rgba(129,140,248,.75)}}
  .qz-opt:active:not(:disabled){transform:scale(.97)}
  .qz-opt:disabled{cursor:default}

  /* Bonne réponse */
  .qz-opt.ok{background:rgba(16,185,129,.2);border-color:#10b981;color:#d1fae5}
  .qz-opt.ok .qz-key{background:#10b981;color:#06241a}
  /* Hero : pop spring + halo doré — célébration, pas d'infini distrayant */
  .qz-opt.hero{animation:qzHero .55s var(--qz-spring) both;border-color:var(--qz-gold)}
  .qz-opt.hero .qz-key{background:var(--qz-gold);color:#451a03}
  @keyframes qzHero{0%{transform:scale(1)}38%{transform:scale(1.05);box-shadow:0 0 0 6px rgba(245,158,11,.28),0 8px 28px rgba(245,158,11,.3)}100%{transform:scale(1);box-shadow:0 0 0 2px rgba(245,158,11,.4),0 4px 18px rgba(245,158,11,.18)}}
  /* Mauvais choix : grisé doux, AUCUNE secousse */
  .qz-opt.miss{background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.4);color:#fde68a;opacity:.7}
  .qz-opt.miss .qz-key{background:rgba(245,158,11,.22);color:#fcd34d}
  .qz-opt.fade{opacity:.35}

  /* Bandeau de célébration */
  .qz-praise{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:16px;animation:qzPraiseIn .45s var(--qz-spring) both}
  .qz-praise-txt{font:600 21px/1.2 'Fredoka','Plus Jakarta Sans',sans-serif;background:linear-gradient(110deg,#fcd34d,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.01em}
  .qz-streak{display:inline-flex;align-items:center;gap:5px;font:700 12px/1 'Inter',sans-serif;color:#fb923c;background:rgba(251,146,60,.14);border:1px solid rgba(251,146,60,.35);border-radius:999px;padding:6px 11px;animation:qzStreakPop .5s var(--qz-spring) .15s both}
  @keyframes qzPraiseIn{from{opacity:0;transform:translateY(6px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes qzStreakPop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}

  /* Explication — coach */
  .qz-expl{margin-top:14px;padding:15px 16px;border-radius:16px;font:500 14.5px/1.6 'Inter',sans-serif;animation:qzExplIn .35s var(--qz-out) both}
  .qz-expl strong{font-weight:800;color:#fcd34d}
  .qz-expl.ok{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.32);color:#d1fae5}
  .qz-expl.soft{background:rgba(129,140,248,.1);border:1px solid rgba(129,140,248,.35);color:#e2e8f0}
  .qz-expl-h{display:flex;align-items:center;gap:6px;font:800 13px/1 'Plus Jakarta Sans',sans-serif;margin-bottom:7px;letter-spacing:.02em}
  .qz-expl.ok .qz-expl-h{color:#a7f3d0}
  .qz-expl.soft .qz-expl-h{color:#c7d2fe}
  @keyframes qzExplIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}

  /* Résultat */
  .qz-result{text-align:center;padding:18px 0 6px}
  .qz-score{font:600 64px/1 'Fredoka','Plus Jakarta Sans',sans-serif;background:linear-gradient(135deg,#818cf8,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:10px}
  .qz-score.gold{background:linear-gradient(135deg,#fcd34d,#f59e0b);-webkit-background-clip:text;background-clip:text}
  .qz-score-sep{font-size:.55em;margin:0 2px;color:#64748b;-webkit-text-fill-color:#64748b}
  .qz-result-msg{font:600 17px/1.45 'Inter',sans-serif;color:#cbd5e1;margin:0 0 24px}
  .qz-cta{padding:15px 36px;min-height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:14px;color:#fff;font:700 15px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;touch-action:manipulation;transition:transform .14s var(--qz-out),opacity .14s}
  .qz-cta:active{transform:scale(.97);opacity:.92}

  /* Bouton « Suivant » pleine largeur (engine) */
  .qz-next{width:100%;margin-top:14px;padding:15px;min-height:50px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:14px;color:#fff;font:700 15px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;touch-action:manipulation;transition:transform .14s var(--qz-out),opacity .14s;animation:qzExplIn .3s var(--qz-out) .1s both}
  .qz-next:active{transform:scale(.98)}

  /* Reduced motion : on garde les fondus, on coupe les mouvements */
  @media (prefers-reduced-motion: reduce){
    .qz-mascot,.qz-mascot-result{animation:none}
    .qz-opt,.qz-praise,.qz-streak,.qz-expl,.qz-next{animation-duration:.01ms;animation-delay:0ms}
    .qz-opt.hero{animation:none;box-shadow:0 0 0 2px rgba(245,158,11,.4)}
    .qz-pip::after{transition:none}
  }
</style>`;
