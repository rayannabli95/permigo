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
import { haptic, hapticPulses, tapHaptic } from "@/utils/haptic.js";
import { playPop, playCoin, playReveal } from "@/utils/sound.js";
import { recordAnswer, recordCompetenceAnswer } from "@/utils/weak-points.js";
import { getLang } from "@/utils/lang.js";
import { PQ_UI } from "@/data/premium-quiz-i18n.js";

// Récompense VARIABLE : jamais 2× le même d'affilée (sinon le cerveau
// s'habitue et le pic dopamine disparaît — cf. reward prediction error).
const PRAISES = [
  "Dans le mille",
  "Tu gères",
  "Pile poil",
  "Réflexe parfait",
  "Bien vu",
  "Exact",
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

// DA « Arène 3D » (cohérente avec le quizz principal — quiz-ui.js) : nuit-violet
// + or, boutons plastique 3D, Baloo 2. Mascotte non utilisée ici (questions texte).
const STYLE = `<style>
.pq { position:relative; max-width: 480px; margin: 0 auto; min-height: 100dvh;
  padding: 0 18px calc(20px + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; isolation:isolate;
  color: #f4f1ff; font-family: 'Fredoka','Inter', sans-serif;
  background:
    radial-gradient(150% 60% at 50% -5%, rgba(255,180,60,.10) 0%, transparent 50%),
    radial-gradient(120% 55% at 50% 22%, rgba(110,70,220,.22) 0%, transparent 60%),
    linear-gradient(180deg,#181241 0%,#0c0a26 60%,#08071c 100%); }
.pq::before { content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image:
    radial-gradient(1.4px 1.4px at 22% 12%, rgba(255,255,255,.4), transparent),
    radial-gradient(1.2px 1.2px at 80% 8%, rgba(255,210,120,.45), transparent),
    radial-gradient(1.1px 1.1px at 64% 18%, rgba(255,255,255,.3), transparent),
    radial-gradient(1.3px 1.3px at 12% 26%, rgba(180,160,255,.35), transparent); }
.pq > * { position:relative; z-index:1; }

/* Immersion : pendant le quiz on masque le chrome (header + nav) ET on annule le
   padding-top de #app (sinon une bande claire = la place réservée au header). */
body.pq-immersive #header-bar, body.pq-immersive #bottom-nav { display:none !important; }
/* padding-bottom aussi : la place réservée à la nav laissait une BANDE BLANCHE
   sous l'arène sombre. Et le fond du body prend la couleur de l'arène pour
   couvrir les gouttières (écrans > 480px, rebonds de scroll iOS). */
body.pq-immersive #app { padding-top: 0 !important; padding-bottom: 0 !important; }
body.pq-immersive { background: #0c0a26 !important; }

/* Barre du haut : progression dorée + combo */
.pq-top { display:flex; align-items:center; gap:12px; padding:16px 0 6px; }
.pq-x { width:38px; height:38px; flex-shrink:0; border:0; border-radius:12px; cursor:pointer;
  background:linear-gradient(180deg,#2c2660,#1a1442); color:#cfc7ff; font-size:18px; line-height:1;
  box-shadow:0 4px 0 #100c30, inset 0 1px 0 rgba(255,255,255,.14); }
.pq-x:active { transform: translateY(3px); box-shadow:0 1px 0 #100c30, inset 0 1px 0 rgba(255,255,255,.14); }
.pq-seg { flex:1; display:flex; gap:5px; }
.pq-seg span { flex:1; height:9px; border-radius:999px; background:#251f56; box-shadow: inset 0 2px 3px rgba(0,0,0,.5); overflow:hidden; }
.pq-seg span i { display:block; height:100%; width:0; border-radius:999px; background:linear-gradient(180deg,#ffe588,#ff9d1f); transition: width .35s cubic-bezier(.23,1,.32,1); }
.pq-seg span.ok i { width:100%; background:linear-gradient(180deg,#ffd95e,#f59b16); box-shadow:0 0 8px rgba(255,170,40,.5); }
.pq-seg span.ko i { width:100%; background:linear-gradient(180deg,#f59e8a,#d96a52); }
.pq-seg span.now i { width:40%; }
.pq-seg span.just { animation: pqSegBump .3s cubic-bezier(.23,1,.32,1) both; }
@keyframes pqSegBump { 0%{transform:scaleY(1)} 40%{transform:scaleY(1.85)} 100%{transform:scaleY(1)} }
@media (prefers-reduced-motion: reduce){ .pq-seg span.just { animation:none; } }
.pq-combo { font:800 14px 'Baloo 2','Fredoka',sans-serif; color:#ffd06a; min-width:40px; text-align:right; opacity:0; transition:opacity .2s; text-shadow:0 1px 0 rgba(0,0,0,.4); }
.pq-combo.on { opacity:1; }

/* Question — gros, aéré, Baloo 2 */
.pq-mid { flex:1; display:flex; flex-direction:column; justify-content:center; padding:8px 0; }
.pq-qn { font:700 12px 'IBM Plex Mono',monospace; color:#b9b2e8; margin-bottom:10px; letter-spacing:.04em; }
.pq-q { font:700 25px/1.25 'Baloo 2','Fredoka',sans-serif; letter-spacing:-.01em; margin-bottom:22px; color:#fff;
  text-shadow:0 2px 0 rgba(0,0,0,.3), 0 0 18px rgba(120,90,230,.35); }

/* Options — boutons plastique 3D */
.pq-opts { display:flex; flex-direction:column; gap:13px; }
.pq-opt { display:flex; align-items:center; gap:13px; width:100%; text-align:left; cursor:pointer; min-height:58px;
  border:1px solid rgba(255,255,255,.06); border-radius:18px; padding:15px 16px;
  background:linear-gradient(180deg,#3a3470,#231d4f); color:#ece8ff; font:500 16px/1.3 'Fredoka','Inter',sans-serif;
  box-shadow:0 7px 0 #15113a, 0 12px 16px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.24), inset 0 -2px 6px rgba(0,0,0,.4);
  transition: transform .08s ease, box-shadow .08s ease, opacity .2s; }
.pq-opt:active:not([disabled]) { transform: translateY(5px); box-shadow:0 2px 0 #15113a, 0 4px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.24); }
.pq-opt-k { width:36px; height:36px; flex-shrink:0; border-radius:11px; display:flex; align-items:center; justify-content:center;
  font:800 16px 'Baloo 2','Fredoka',sans-serif; background:linear-gradient(180deg,#2b2560,#1b1545); color:#cfc7ff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 3px 0 #110d35; }
.pq-opt.good { background:linear-gradient(180deg,#ffd24a,#ff9c1c); border-color:rgba(255,255,255,.35); color:#3a1d00;
  box-shadow:0 5px 0 #b85e00, 0 10px 20px rgba(255,140,30,.4), inset 0 1px 0 rgba(255,255,255,.65); }
.pq-opt.good .pq-opt-k { background:linear-gradient(180deg,#fff,#ffe7a8); color:#c46a00; box-shadow:inset 0 1px 0 rgba(255,255,255,.9), 0 3px 0 #c46a00; }
.pq-opt.bad { background:linear-gradient(180deg,#4a2740,#34203a); border-color:rgba(255,160,90,.3); color:#ffd9c2; box-shadow:0 5px 0 #1f1430, inset 0 1px 0 rgba(255,255,255,.12); }
.pq-opt.bad .pq-opt-k { background:linear-gradient(180deg,#5a3450,#3a2440); color:#ffb890; }
.pq-opt.dim { opacity:.42; }
.pq-opt[disabled] { cursor:default; }

/* Bandeau correction (slide-up) */
.pq-fb { margin-top:16px; border-radius:16px; padding:16px; border:1px solid; animation: pqUp .28s cubic-bezier(.23,1,.32,1); }
@keyframes pqUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
.pq-fb.win { background:rgba(255,180,60,.1); border-color:rgba(255,180,60,.3); }
.pq-fb.lose { background:rgba(129,140,248,.1); border-color:rgba(129,140,248,.32); }
.pq-fb-h { font:800 14px 'Baloo 2','Fredoka',sans-serif; margin-bottom:3px; }
.pq-fb.win .pq-fb-h { color:#ffd06a; }
.pq-fb.lose .pq-fb-h { color:#c7d2fe; }
.pq-fb-t { font-size:14px; line-height:1.5; color:#e2e0ff; }
.pq-next { width:100%; border:0; border-radius:16px; padding:16px; cursor:pointer; margin-top:14px; min-height:54px;
  font:800 16px 'Baloo 2','Fredoka',sans-serif; color:#3a1d00; background:linear-gradient(180deg,#ffd24a,#ff9c1c);
  box-shadow:0 5px 0 #b85e00, 0 8px 18px rgba(255,140,30,.35), inset 0 1px 0 rgba(255,255,255,.5); transition: transform .1s, box-shadow .1s; }
.pq-next:active { transform: translateY(4px); box-shadow:0 1px 0 #b85e00, inset 0 1px 0 rgba(255,255,255,.5); }

/* Résultat */
.pq-res { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.pq-res-e { font-size:64px; animation: pqUp .4s cubic-bezier(.23,1,.32,1) both; filter: drop-shadow(0 8px 16px rgba(0,0,0,.4)); }
.pq-res-score { font:700 48px 'Baloo 2','Fredoka',sans-serif; margin:4px 0 0; transition: transform .12s cubic-bezier(.23,1,.32,1);
  background:linear-gradient(180deg,#ffe27a,#ff9b1e); -webkit-background-clip:text; background-clip:text; color:transparent; }
.pq-res-t { font:700 22px 'Baloo 2','Fredoka',sans-serif; margin:6px 0 4px; color:#fff; }
.pq-res-s { color:#cbc6f0; font-size:14px; max-width:300px; line-height:1.5; }
/* Ligne quête du jour : la règle du « réussi » (≥70 %) dite simplement. */
.pq-res-quest { margin-top:14px; padding:8px 14px; border-radius:999px; font:600 13px 'Baloo 2','Fredoka',sans-serif; }
.pq-res-quest.is-pass { color:#1c1533; background:linear-gradient(180deg,#ffe27a,#ffce4d); box-shadow:0 3px 0 #d99a00; }
.pq-res-quest.is-miss { color:#cbc6f0; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); }
/* i18n : traduction affichée + français gardé dessous (arabe RTL par span) */
.pq-tr { display:block; }
.pq-fr { display:block; margin-top:3px; font:500 .74em/1.3 'Inter',sans-serif; opacity:.6; }
.pq-q .pq-fr { font-weight:600; }
@media (prefers-reduced-motion: reduce) { .pq *, .pq *::before { transition:none !important; animation:none !important; } }
</style>`;

// questHint : affiche sur l'écran de score si le quiz « compte » pour la
// quête du jour (seuil serveur = 70 %). Opt-in — seul le quiz de fiche
// conduite alimente la quête, pas les mini-jeux.
export function mountPremiumQuiz(
  root,
  { questions, title = "Quiz", onExit, questHint = false },
) {
  const qs = (questions || []).filter((q) => q && Array.isArray(q.options));
  if (!qs.length) {
    onExit?.();
    return;
  }
  // Immersion : masque le chrome (header + nav) pendant le quiz, restauré à la sortie.
  document.body.classList.add("pq-immersive");
  // Filet de sécurité : si on quitte le quiz par une navigation (bouton
  // Précédent, lien, notif) au lieu du ✕/bouton de fin, on retire quand même la
  // classe immersive — sinon header + nav restent cachés sur tout le reste de
  // l'app (utilisateur piégé sans navigation). Ce composant est monté par
  // plusieurs pages (jeu-faute, revision-conduite), d'où le nettoyage interne.
  const onNavAway = () => {
    document.body.classList.remove("pq-immersive");
    window.removeEventListener("hashchange", onNavAway);
  };
  window.addEventListener("hashchange", onNavAway);
  const exit = (...a) => {
    document.body.classList.remove("pq-immersive");
    window.removeEventListener("hashchange", onNavAway);
    onExit?.(...a);
  };
  let idx = 0;
  let chosen = null; // index choisi (null = pas encore répondu)
  let correctCount = 0;
  let combo = 0;
  const results = []; // bool par question
  const lastPraise = { v: -1 };
  const lastCoach = { v: -1 };

  // ── i18n : rendu bilingue (traduction + français dessous) + libellés traduits.
  // Optionnel & rétro-compatible : sans champ *_tr sur la question, ou en 'fr',
  // le rendu est INCHANGÉ (jeu-faute, qui n'a pas de traduction, n'est pas touché).
  const lang = getLang();
  const rtl = lang === "ar";
  const biq = (fr, tr) =>
    lang === "fr" || !tr
      ? esc(fr)
      : `<span class="pq-tr"${rtl ? ' dir="rtl" lang="ar"' : ""}>${esc(tr)}</span><span class="pq-fr" lang="fr">${esc(fr)}</span>`;
  const L = (key, frFallback) =>
    (lang !== "fr" && PQ_UI[lang]?.[key]) || frFallback;
  const praises =
    lang !== "fr" && PQ_UI[lang]?.praises?.length
      ? PQ_UI[lang].praises
      : PRAISES;
  const coachArr =
    lang !== "fr" && PQ_UI[lang]?.coach?.length ? PQ_UI[lang].coach : COACH;

  function segHTML() {
    // Le segment qui vient de se remplir « pompe » une fois (synchro avec l'haptique).
    // Présent seulement sur le rendu de révélation → ne rejoue jamais ensuite.
    const justIdx = chosen !== null ? results.length - 1 : -1;
    return qs
      .map((_, i) => {
        let cls = "";
        if (i < results.length) cls = results[i] ? "ok" : "ko";
        else if (i === idx) cls = "now";
        if (i === justIdx) cls += " just";
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
          <span class="pq-opt-k">${letter}</span><span>${biq(o, q.options_tr?.[i])}</span>
        </button>`;
      })
      .join("");

    let fb = "";
    if (answered) {
      const win = chosen === q.correct;
      const head = win ? pick(praises, lastPraise) : pick(coachArr, lastCoach);
      fb = `<div class="pq-fb ${win ? "win" : "lose"}">
          <div class="pq-fb-h">${win ? esc(head) + " !" : esc(head)}</div>
          <div class="pq-fb-t">${biq(q.explication || q.options[q.correct], q.explication_tr)}</div>
        </div>
        <button class="pq-next" data-next>${idx + 1 >= qs.length ? esc(L("my_score", "Mon score")) : esc(L("next", "Suivant"))}</button>`;
    }

    root.innerHTML = `${STYLE}<div class="pq">
      <div class="pq-top">
        <button class="pq-x" aria-label="Quitter">✕</button>
        <div class="pq-seg">${segHTML()}</div>
        <div class="pq-combo ${combo >= 2 ? "on" : ""}">🔥 ${combo}</div>
      </div>
      <div class="pq-mid">
        <div class="pq-qn">${esc(title)} · ${idx + 1}/${qs.length}</div>
        <div class="pq-q">${biq(q.q, q.q_tr)}</div>
        <div class="pq-opts">${opts}</div>
        ${fb}
      </div>
    </div>`;

    root.querySelector(".pq-x").addEventListener("click", () => exit());

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
    // Nourrit « Mes fautes » (hub Réviser) : tags portés par la question
    // (jeu-faute) ou thèmes déduits du code REMC (quiz de fiche conduite).
    recordAnswer(q.tags, win);
    if (q.code) recordCompetenceAnswer(q.code, win);
    if (win) {
      correctCount++;
      combo++;
      hapticPulses(combo); // vibration escaladée avec le combo
      // Récompense VARIABLE (ratio variable → le pic dopamine grave la mémoire) :
      // léger le plus souvent, « coin » parfois, « reveal » rare = jamais le même.
      const r = Math.random();
      if (r < 0.06) playReveal();
      else if (r < 0.28) playCoin();
      else playPop();
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
    // Même règle que le serveur (quête « Réussir 1 quiz », ligue Révision) :
    // réussi à partir de 70 %. Dit en questions, pas en pourcents.
    const needed = Math.ceil(total * 0.7);
    const passed = correctCount >= needed;
    let e, t, s;
    if (pct >= 0.8) {
      e = "🏆";
      t = L("master_t", "Tu maîtrises !");
      s = L(
        "master_s",
        "Gros score. Garde ce niveau, montre-le à ton moniteur.",
      );
    } else if (questHint && passed) {
      // 70–79 % : réussi — ne surtout pas dire « Presque » (contradictoire).
      e = "🔥";
      t = L("good_t", "Bien joué");
      s = L(
        "good_s_pass",
        "Quiz réussi — refais-en pour verrouiller le geste.",
      );
    } else if (pct >= 0.5) {
      e = "🔥";
      t = L("good_t", "Bien joué");
      s = L(
        "good_s_mid",
        "Presque — refais-en deux-trois et c'est verrouillé.",
      );
    } else {
      e = "💪";
      t = L("start_t", "Ça vient");
      s = L("start_s", "Relis la fiche cool, puis retente. Ça va rentrer.");
    }
    const questLine = !questHint
      ? ""
      : passed
        ? `<div class="pq-res-quest is-pass">✓ ${esc(L("quest_pass", "Ça compte pour ta quête du jour"))}</div>`
        : `<div class="pq-res-quest is-miss">${esc(
            L(
              "quest_miss",
              "Quête du jour : réussis {needed}/{total} — retente quand tu veux",
            )
              .replace("{needed}", needed)
              .replace("{total}", total),
          )}</div>`;
    root.innerHTML = `${STYLE}<div class="pq">
      <div class="pq-top"><button class="pq-x" aria-label="Fermer">✕</button><div class="pq-seg">${segHTML()}</div><div class="pq-combo"></div></div>
      <div class="pq-res">
        <div class="pq-res-e">${e}</div>
        <div class="pq-res-score"><span data-count>0</span>/${total}</div>
        <div class="pq-res-t">${esc(t)}</div>
        <div class="pq-res-s">${esc(s)}</div>
        ${questLine}
      </div>
      <button class="pq-next" data-done>${esc(L("continue", "Continuer"))}</button>
    </div>`;
    root
      .querySelector(".pq-x")
      .addEventListener("click", () => exit(correctCount, total));
    root
      .querySelector("[data-done]")
      .addEventListener("click", () => exit(correctCount, total));
    // Count-up du score : chaque point « monte » avec un tic haptique + un pop.
    const countEl = root.querySelector("[data-count]");
    if (countEl && correctCount > 0) {
      let c = 0;
      const box = countEl.parentElement;
      const step = () => {
        countEl.textContent = String(++c);
        if (box) {
          box.style.transform = "scale(1.09)";
          setTimeout(() => (box.style.transform = ""), 90);
        }
        tapHaptic();
        if (c < correctCount) setTimeout(step, 170);
        else setTimeout(() => haptic("success"), 150);
      };
      setTimeout(step, 280);
    }
  }

  renderQuestion();
}
