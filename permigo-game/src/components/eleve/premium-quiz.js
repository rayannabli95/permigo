// ═══════════════════════════════════════════════════════════════
// Premium Quiz — l'asset « question en mode jeu vidéo ».
// Conçu autour de la psychologie : lecture rapide (TikTok), réponse
// instantanée, récompense VARIABLE (le pic dopamine grave la mémoire),
// correction courte qu'on a ENVIE de lire, combo, feedback haptique.
//
// Réutilisable : mountPremiumQuiz(root, { questions, title, onExit }).
//   questions = [{ q, options:[..], correct:Index, explication, code? }]
// Autonome (son propre <style>, son propre état). Aucune dépendance DB.
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { haptic } from "@/utils/haptic.js";

// Récompense VARIABLE : jamais 2× le même d'affilée (sinon le cerveau
// s'habitue et le pic dopamine disparaît — cf. reward prediction error).
const PRAISES = [
  "Dans le mille",
  "Tu gères",
  "Pile poil",
  "Réflexe parfait",
  "Bien vu",
  "Exactement",
  "Au quart de tour",
  "Comme un pro",
  "Propre",
];
const COACH = [
  "Le bon réflexe",
  "À garder en tête",
  "Le truc de pro",
  "Pour la prochaine",
  "Bon à savoir",
];
function pick(arr, last) {
  let i = (Math.random() * arr.length) | 0;
  if (i === last.v) i = (i + 1) % arr.length;
  last.v = i;
  return arr[i];
}

const STYLE = `<style>
.pq { max-width: 480px; margin: 0 auto; min-height: 100dvh;
  padding: 0 18px calc(20px + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; background: var(--bg);
  color: var(--ink); font-family: 'Inter', sans-serif; }

/* Barre du haut : progression segmentée + combo */
.pq-top { display:flex; align-items:center; gap:12px; padding:16px 0 6px; }
.pq-x { width:34px; height:34px; flex-shrink:0; border:0; border-radius:10px; cursor:pointer;
  background:var(--surface,#fff); color:var(--ink); font-size:18px; line-height:1; box-shadow:0 1px 4px rgba(0,0,0,.08); }
.pq-x:active { transform: scale(0.92); }
.pq-seg { flex:1; display:flex; gap:4px; }
.pq-seg span { flex:1; height:6px; border-radius:999px; background: color-mix(in srgb,#6366f1 14%, transparent); overflow:hidden; }
.pq-seg span i { display:block; height:100%; width:0; border-radius:999px; background:var(--a,#6366f1); transition: width .35s cubic-bezier(.23,1,.32,1); }
.pq-seg span.ok i { width:100%; background:#10b981; }
.pq-seg span.ko i { width:100%; background:#ef4444; }
.pq-seg span.now i { width:40%; }
.pq-combo { font:800 13px 'Plus Jakarta Sans',sans-serif; color:#f59e0b; min-width:38px; text-align:right; opacity:0; transition:opacity .2s; }
.pq-combo.on { opacity:1; }

/* Question — gros, aéré, lecture 2 sec */
.pq-mid { flex:1; display:flex; flex-direction:column; justify-content:center; padding:8px 0; }
.pq-qn { font:700 12px 'IBM Plex Mono',monospace; color:var(--muted,#94a3b8); margin-bottom:10px; }
.pq-q { font:800 26px/1.2 'Plus Jakarta Sans',sans-serif; letter-spacing:-.02em; margin-bottom:22px; }

/* Options tappables */
.pq-opts { display:flex; flex-direction:column; gap:10px; }
.pq-opt { display:flex; align-items:center; gap:12px; width:100%; text-align:left; cursor:pointer;
  border:2px solid var(--border,#e2e8f0); background:var(--surface,#fff); color:var(--ink);
  border-radius:15px; padding:16px; font:600 16px/1.3 'Inter',sans-serif;
  transition: transform .12s ease-out, border-color .15s, background .15s; }
.pq-opt:active { transform: scale(0.985); }
.pq-opt-k { width:26px; height:26px; flex-shrink:0; border-radius:8px; display:flex; align-items:center; justify-content:center;
  font:800 13px 'Plus Jakarta Sans',sans-serif; background: color-mix(in srgb,#6366f1 12%, transparent); color:var(--a,#6366f1); }
.pq-opt.good { border-color:#10b981; background: color-mix(in srgb,#10b981 12%, transparent); }
.pq-opt.good .pq-opt-k { background:#10b981; color:#fff; }
.pq-opt.bad { border-color:#ef4444; background: color-mix(in srgb,#ef4444 10%, transparent); }
.pq-opt.bad .pq-opt-k { background:#ef4444; color:#fff; }
.pq-opt.dim { opacity:.5; }
.pq-opt[disabled] { cursor:default; }

/* Bandeau correction (slide-up) — court, qu'on a envie de lire */
.pq-fb { margin-top:16px; border-radius:16px; padding:16px; animation: pqUp .28s cubic-bezier(.23,1,.32,1); }
@keyframes pqUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
.pq-fb.win { background: color-mix(in srgb,#10b981 12%, transparent); }
.pq-fb.lose { background: color-mix(in srgb,#f59e0b 14%, transparent); }
.pq-fb-h { font:800 14px 'Plus Jakarta Sans',sans-serif; margin-bottom:3px; }
.pq-fb.win .pq-fb-h { color:#047857; }
.pq-fb.lose .pq-fb-h { color:#b45309; }
.pq-fb-t { font-size:14px; line-height:1.45; }
.pq-next { width:100%; border:0; border-radius:15px; padding:16px; cursor:pointer; margin-top:14px;
  font:800 16px 'Plus Jakarta Sans',sans-serif; color:#fff; background:var(--a,#6366f1);
  box-shadow:0 8px 20px color-mix(in srgb,var(--a,#6366f1) 40%, transparent); }
.pq-next:active { transform: scale(0.985); }

/* Résultat */
.pq-res { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.pq-res-e { font-size:60px; animation: pqUp .4s cubic-bezier(.23,1,.32,1) both; }
.pq-res-score { font:800 44px 'IBM Plex Mono',monospace; margin:4px 0 0; }
.pq-res-t { font:800 22px 'Plus Jakarta Sans',sans-serif; margin:6px 0 4px; }
.pq-res-s { color:var(--muted,#64748b); font-size:14px; max-width:300px; }
@media (prefers-reduced-motion: reduce) { .pq *, .pq *::before { transition:none !important; animation:none !important; } }
</style>`;

export function mountPremiumQuiz(root, { questions, title = "Quiz", onExit }) {
  const qs = (questions || []).filter((q) => q && Array.isArray(q.options));
  if (!qs.length) {
    onExit?.();
    return;
  }
  let idx = 0;
  let chosen = null; // index choisi (null = pas encore répondu)
  let correctCount = 0;
  let combo = 0;
  const results = []; // bool par question
  const lastPraise = { v: -1 };
  const lastCoach = { v: -1 };

  function segHTML() {
    return qs
      .map((_, i) => {
        let cls = "";
        if (i < results.length) cls = results[i] ? "ok" : "ko";
        else if (i === idx) cls = "now";
        return `<span class="${cls}"><i></i></span>`;
      })
      .join("");
  }

  function renderQuestion() {
    const q = qs[idx];
    const answered = chosen !== null;
    const opts = q.options
      .map((o, i) => {
        const letter = ["A", "B", "C", "D"][i] || "•";
        let cls = "";
        if (answered) {
          if (i === q.correct) cls = "good";
          else if (i === chosen) cls = "bad";
          else cls = "dim";
        }
        return `<button class="pq-opt ${cls}" data-i="${i}" ${answered ? "disabled" : ""}>
          <span class="pq-opt-k">${letter}</span><span>${esc(o)}</span>
        </button>`;
      })
      .join("");

    let fb = "";
    if (answered) {
      const win = chosen === q.correct;
      const head = win ? pick(PRAISES, lastPraise) : pick(COACH, lastCoach);
      fb = `<div class="pq-fb ${win ? "win" : "lose"}">
          <div class="pq-fb-h">${win ? esc(head) + " !" : esc(head)}</div>
          <div class="pq-fb-t">${esc(q.explication || q.options[q.correct])}</div>
        </div>
        <button class="pq-next" data-next>${idx + 1 >= qs.length ? "Voir mon score" : "Suivant"}</button>`;
    }

    root.innerHTML = `${STYLE}<div class="pq">
      <div class="pq-top">
        <button class="pq-x" aria-label="Quitter">✕</button>
        <div class="pq-seg">${segHTML()}</div>
        <div class="pq-combo ${combo >= 2 ? "on" : ""}">🔥 ${combo}</div>
      </div>
      <div class="pq-mid">
        <div class="pq-qn">${esc(title)} · ${idx + 1}/${qs.length}</div>
        <div class="pq-q">${esc(q.q)}</div>
        <div class="pq-opts">${opts}</div>
        ${fb}
      </div>
    </div>`;

    root.querySelector(".pq-x").addEventListener("click", () => onExit?.());

    if (!answered) {
      root
        .querySelectorAll(".pq-opt")
        .forEach((b) =>
          b.addEventListener("click", () =>
            answer(Number(b.getAttribute("data-i"))),
          ),
        );
    } else {
      root.querySelector("[data-next]").addEventListener("click", next);
    }
  }

  function answer(i) {
    if (chosen !== null) return;
    chosen = i;
    const q = qs[idx];
    const win = i === q.correct;
    results[idx] = win;
    if (win) {
      correctCount++;
      combo++;
      haptic("success");
    } else {
      combo = 0;
      haptic("warning");
    }
    renderQuestion();
  }

  function next() {
    idx++;
    chosen = null;
    if (idx >= qs.length) return renderResults();
    renderQuestion();
  }

  function renderResults() {
    const total = qs.length;
    const pct = correctCount / total;
    let e, t, s;
    if (pct >= 0.8) {
      e = "🏆";
      t = "Tu maîtrises !";
      s = "Beau score. Garde ce niveau et confirme avec ton moniteur.";
    } else if (pct >= 0.5) {
      e = "🔥";
      t = "Bien joué";
      s = "Tu y es presque — refais-en quelques-unes et c'est verrouillé.";
    } else {
      e = "💪";
      t = "Ça vient";
      s = "Relis la fiche tranquille, puis retente. Ça va rentrer.";
    }
    root.innerHTML = `${STYLE}<div class="pq">
      <div class="pq-top"><button class="pq-x" aria-label="Fermer">✕</button><div class="pq-seg">${segHTML()}</div><div class="pq-combo"></div></div>
      <div class="pq-res">
        <div class="pq-res-e">${e}</div>
        <div class="pq-res-score">${correctCount}/${total}</div>
        <div class="pq-res-t">${esc(t)}</div>
        <div class="pq-res-s">${esc(s)}</div>
      </div>
      <button class="pq-next" data-done>Continuer</button>
    </div>`;
    root
      .querySelector(".pq-x")
      .addEventListener("click", () => onExit?.(correctCount, total));
    root
      .querySelector("[data-done]")
      .addEventListener("click", () => onExit?.(correctCount, total));
  }

  renderQuestion();
}
