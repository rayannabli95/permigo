// ═══════════════════════════════════════════════════════════════
// Gain Ligue Révision — feedback « +N pts Révision » sur les écrans
// de résultat (quiz compétence réussi / parcours d'examen réussi).
// Honnêteté : le bloc ne s'affiche QUE si le point est réellement
// nouveau (compétence / parcours pas déjà compté) → on valorise la
// maîtrise, on n'incite jamais à re-farmer un quiz déjà acquis.
// Barème et paliers 100 % dérivés de theory-league.js.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { burstConfetti } from "@/components/common/confetti.js";
import {
  computeTheoryScore,
  theoryLeague,
  THEORY_QUIZ_PASS_PCT,
} from "@/utils/theory-league.js";

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * Calcule le gain théorie qu'apporterait cet essai.
 * À appeler AVANT (ou en parallèle de) la persistance de l'essai :
 * le score « avant » vient de la BDD, le delta est simulé localement
 * via computeTheoryScore → toujours cohérent avec le barème réel.
 *
 * @param {Object} p
 * @param {'quiz'|'exam'} p.kind
 * @param {string} [p.competenceId] - kind=quiz
 * @param {string|number} [p.refId] - kind=exam (id du parcours)
 * @param {number} [p.scorePct]     - kind=quiz (0-100)
 * @param {boolean} [p.passed]      - kind=exam (verdict CEPC)
 * @returns {Promise<null|{delta:number,before:number,after:number,from:object,to:object,leveledUp:boolean}>}
 *   null = pas de point nouveau (échec, seuil non atteint, ou déjà compté)
 */
export async function computeTheoryGain({
  kind,
  competenceId,
  refId,
  scorePct,
  passed,
}) {
  const me = getCurUser();
  if (!me?.id) return null;
  if (kind === "quiz" && (scorePct ?? 0) < THEORY_QUIZ_PASS_PCT) return null;
  if (kind === "exam" && !passed) return null;

  let attempts = [];
  try {
    const { data, error } = await sb
      .from("quiz_attempts")
      .select("competence_id, type, score, ref_id, passed")
      .eq("user_id", me.id);
    if (error) {
      console.error("[theory-gain]", error);
      return null;
    }
    attempts = data || [];
  } catch (e) {
    console.error("[theory-gain]", e);
    return null;
  }

  const before = computeTheoryScore(attempts);
  const simulated =
    kind === "quiz"
      ? {
          competence_id: competenceId,
          type: "post_validation",
          score: scorePct,
          ref_id: null,
          passed: true,
        }
      : {
          competence_id: null,
          type: "exam_blanc",
          score: scorePct ?? null,
          ref_id: String(refId),
          passed: true,
        };
  const after = computeTheoryScore([...attempts, simulated]);

  const delta = after.score - before.score;
  if (delta <= 0) return null; // déjà compté → pas de fausse récompense

  const from = theoryLeague(before.score);
  const to = theoryLeague(after.score);
  return {
    delta,
    before: before.score,
    after: after.score,
    from,
    to,
    leveledUp: to.idx > from.idx,
  };
}

let _cssInjected = false;
function injectCss() {
  if (_cssInjected) return;
  _cssInjected = true;
  const st = document.createElement("style");
  st.id = "tg-style";
  st.textContent = `
.tg-block{margin:14px auto 6px;max-width:340px;padding:12px 16px;border-radius:14px;text-align:center;
  background:color-mix(in srgb, var(--a, #6366f1) 10%, transparent);
  border:1px solid color-mix(in srgb, var(--a, #6366f1) 32%, transparent);
  animation:tgIn .45s cubic-bezier(.34,1.4,.64,1) both;}
.tg-pts{font:800 18px/1.2 'Plus Jakarta Sans',sans-serif;color:var(--a,#818cf8) !important;}
.tg-pts .tg-n{display:inline-block;}
.tg-pts.tg-pop .tg-n{animation:tgPop .4s cubic-bezier(.34,1.56,.64,1);}
.tg-sub{font:600 11px/1 'Inter',sans-serif;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-top:2px;}
.tg-league{font:500 12.5px/1.45 'Inter',sans-serif;opacity:.88;margin-top:8px;}
.tg-league strong{font-weight:800;color:var(--a,#818cf8) !important;}
.tg-bar{height:6px;border-radius:99px;overflow:hidden;margin-top:8px;
  background:color-mix(in srgb, var(--a, #6366f1) 16%, transparent);}
.tg-fill{height:100%;border-radius:99px;background:var(--a,#818cf8);width:0%;
  transition:width .6s cubic-bezier(.23,1,.32,1);}
.tg-up{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;
  font:700 13px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--am,#f59e0b) !important;}
.tg-up img{width:44px;height:44px;object-fit:contain;
  animation:tgPop .45s .15s cubic-bezier(.34,1.56,.64,1) both;}
@keyframes tgIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes tgPop{0%{transform:scale(1)}45%{transform:scale(1.35)}100%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){
  .tg-block,.tg-up img{animation:none;}
  .tg-fill{transition:none;}
  .tg-pts.tg-pop .tg-n{animation:none;}
}`;
  document.head.appendChild(st);
}

// Compteur 0 → delta (~450ms, rAF). Sous reduced-motion : valeur directe.
function animateCount(el, to, dur = 450) {
  if (reducedMotion() || to <= 1) {
    el.textContent = String(to);
    return;
  }
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = String(Math.max(1, Math.round(to * eased)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * Rend le bloc de gain animé dans `host` (élément vide à remplir).
 * @param {HTMLElement} host
 * @param {Object} gain - résultat de computeTheoryGain (non null)
 */
export function renderTheoryGain(host, gain) {
  if (!host || !gain) return;
  injectCss();
  const { delta, before, after, to, leveledUp } = gain;

  // Progression dans le segment de palier courant (après gain)
  let fillNew = 100;
  let fillOld = 100;
  let progLine = "";
  if (to.top) {
    progLine = `<strong>${esc(to.league.name)}</strong> — tu es prêt pour l'examen.`;
  } else {
    const start = to.league ? to.league.startAt : 0;
    const span = to.next.startAt - start;
    fillNew = Math.max(0, Math.min(100, ((after - start) / span) * 100));
    fillOld = Math.max(0, Math.min(100, ((before - start) / span) * 100));
    progLine = `Plus que <strong>${to.toNext}</strong> pt${to.toNext > 1 ? "s" : ""} avant la Ligue ${to.next.n} — <strong>${esc(to.next.name)}</strong>`;
  }

  const upHtml = leveledUp
    ? `<div class="tg-up">
         <img src="/skins/mascot-celebrate.png" alt="" aria-hidden="true" />
         <span>${to.league.n === 1 && before === 0 ? "Tu entres dans la ligue !" : `Ligue ${to.league.n} — ${esc(to.league.name)} atteinte !`}</span>
       </div>`
    : "";

  host.innerHTML = `
    <div class="tg-block" role="status">
      <div class="tg-pts tg-pop">+<span class="tg-n">1</span> pt${delta > 1 ? "s" : ""} Révision</div>
      <div class="tg-sub">Ligue Révision</div>
      <div class="tg-league">${progLine}</div>
      <div class="tg-bar"><div class="tg-fill" style="width:${fillOld}%"></div></div>
      ${upHtml}
    </div>`;

  animateCount(host.querySelector(".tg-n"), delta);
  // Barre : ancien remplissage → nouveau (transition CSS)
  const fill = host.querySelector(".tg-fill");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      fill.style.width = `${fillNew}%`;
    }),
  );

  if (leveledUp && !reducedMotion()) {
    burstConfetti({ count: 80, power: 14 });
  }
  track("theory_gain.shown", {
    delta,
    score_after: after,
    leveled_up: leveledUp,
  });
}
