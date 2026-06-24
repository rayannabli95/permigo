// ═══════════════════════════════════════════════════════════════
// Élève — « Examen blanc de CONDUITE » version /31 hiérarchisée par phases.
// 8 phases dans l'ordre réel de l'ECE → QCM de mise en situation →
// scoring « façon /31 » (familles + 2 bonus) → bilan par compétence.
// Une faute ÉLIMINATOIRE rencontrée stoppe la simulation (échec), comme le réel.
//
// ⚠️ SIMULATION d'entraînement, PAS la vraie note (seul l'inspecteur la donne).
// Données + barème : src/data/exam-conduite-phases.js (sourcé officiel).
// Ligue Révision : 1 ligne quiz_attempts (type 'exam_blanc', ref_id
// 'exam-conduite') à la fin → +4, comme l'ancien examen blanc.
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { navigate } from "@/router.js";
import { track } from "@/services/analytics.js";
import { haptic, tapHaptic } from "@/utils/haptic.js";
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { openShareRecap } from "@/components/eleve/share-recap.js";
import {
  PHASES,
  FAMILLES,
  BONUS,
  TOTAL,
  SEUIL,
  scoreExam,
} from "@/data/exam-conduite-phases.js";

const STYLE = `<style>
.exc2 { position:relative; max-width:480px; margin:0 auto; min-height:100dvh; isolation:isolate;
  padding:0 18px calc(24px + env(safe-area-inset-bottom)); display:flex; flex-direction:column;
  color:#f4f1ff; font-family:'Fredoka','Inter',sans-serif;
  background:
    radial-gradient(150% 60% at 50% -5%, rgba(255,180,60,.10) 0%, transparent 50%),
    radial-gradient(120% 55% at 50% 22%, rgba(110,70,220,.22) 0%, transparent 60%),
    linear-gradient(180deg,#181241 0%,#0c0a26 60%,#08071c 100%); }
.exc2::before { content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
  background-image:
    radial-gradient(1.4px 1.4px at 22% 12%, rgba(255,255,255,.4), transparent),
    radial-gradient(1.2px 1.2px at 80% 8%, rgba(255,210,120,.45), transparent),
    radial-gradient(1.1px 1.1px at 64% 18%, rgba(255,255,255,.3), transparent); }
.exc2 > * { position:relative; z-index:1; }
body.exc2-immersive #header-bar, body.exc2-immersive #bottom-nav { display:none !important; }
body.exc2-immersive #app { padding-top:0 !important; }

.exc2-top { display:flex; align-items:center; gap:12px; padding:16px 0 6px; }
.exc2-x { width:38px; height:38px; flex-shrink:0; border:0; border-radius:12px; cursor:pointer;
  background:linear-gradient(180deg,#2c2660,#1a1442); color:#cfc7ff; font-size:18px;
  box-shadow:0 4px 0 #100c30, inset 0 1px 0 rgba(255,255,255,.14); }
.exc2-x:active { transform:translateY(3px); box-shadow:0 1px 0 #100c30; }
.exc2-pips { flex:1; display:flex; gap:4px; }
.exc2-pips span { flex:1; height:8px; border-radius:999px; background:#251f56; box-shadow:inset 0 2px 3px rgba(0,0,0,.5); }
.exc2-pips span.done { background:linear-gradient(180deg,#ffd95e,#f59b16); box-shadow:0 0 8px rgba(255,170,40,.4); }
.exc2-pips span.ko { background:linear-gradient(180deg,#f59e8a,#d96a52); }
.exc2-pips span.now { background:linear-gradient(180deg,#ffe588,#ff9d1f); }

/* Centres (intro, phase, élim, bilan) */
.exc2-mid { flex:1; display:flex; flex-direction:column; justify-content:center; padding:10px 0; }
.exc2-center { text-align:center; }
.exc2-e { font-size:60px; filter:drop-shadow(0 8px 16px rgba(0,0,0,.4)); }
.exc2-h { font:700 24px/1.15 'Baloo 2','Fredoka',sans-serif; margin:12px 0 8px; color:#fff; }
.exc2-sub { color:#cbc6f0; font-size:14.5px; line-height:1.55; max-width:32ch; margin:0 auto; }
.exc2-note { font-size:12px; color:#9a93cf; margin-top:16px; line-height:1.5; max-width:34ch; margin-left:auto; margin-right:auto; }
.exc2-chips { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin:16px 0 4px; }
.exc2-chip { font:700 12px 'Fredoka',sans-serif; color:#ffd06a; background:rgba(255,190,70,.12);
  border:1px solid rgba(255,190,70,.28); border-radius:999px; padding:6px 12px; }

/* Phase intro */
.exc2-pk { font:800 12px 'IBM Plex Mono',monospace; color:#b9b2e8; letter-spacing:.08em; }

/* Question */
.exc2-qn { font:700 12px 'IBM Plex Mono',monospace; color:#b9b2e8; margin-bottom:10px; letter-spacing:.04em; }
.exc2-q { font:700 22px/1.3 'Baloo 2','Fredoka',sans-serif; color:#fff; margin-bottom:20px;
  text-shadow:0 2px 0 rgba(0,0,0,.3), 0 0 18px rgba(120,90,230,.35); }
.exc2-opts { display:flex; flex-direction:column; gap:12px; }
.exc2-opt { display:flex; align-items:center; gap:13px; width:100%; text-align:left; cursor:pointer; min-height:56px;
  border:1px solid rgba(255,255,255,.06); border-radius:18px; padding:14px 16px;
  background:linear-gradient(180deg,#3a3470,#231d4f); color:#ece8ff; font:500 15.5px/1.3 'Fredoka','Inter',sans-serif;
  box-shadow:0 6px 0 #15113a, 0 10px 14px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.22);
  transition:transform .08s ease, box-shadow .08s ease, opacity .2s; }
.exc2-opt:active:not([disabled]) { transform:translateY(4px); box-shadow:0 2px 0 #15113a, inset 0 1px 0 rgba(255,255,255,.22); }
.exc2-opt-k { width:34px; height:34px; flex-shrink:0; border-radius:10px; display:flex; align-items:center; justify-content:center;
  font:800 15px 'Baloo 2','Fredoka',sans-serif; background:linear-gradient(180deg,#2b2560,#1b1545); color:#cfc7ff;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.16), 0 3px 0 #110d35; }
.exc2-opt.good { background:linear-gradient(180deg,#ffd24a,#ff9c1c); border-color:rgba(255,255,255,.35); color:#3a1d00;
  box-shadow:0 5px 0 #b85e00, 0 10px 20px rgba(255,140,30,.4), inset 0 1px 0 rgba(255,255,255,.65); }
.exc2-opt.good .exc2-opt-k { background:linear-gradient(180deg,#fff,#ffe7a8); color:#c46a00; }
.exc2-opt.bad { background:linear-gradient(180deg,#4a2740,#34203a); border-color:rgba(255,160,90,.3); color:#ffd9c2; box-shadow:0 5px 0 #1f1430; }
.exc2-opt.elim { background:linear-gradient(180deg,#7a1f2e,#4a121d); border-color:rgba(255,90,90,.45); color:#ffd7d7; box-shadow:0 5px 0 #3a0d14; }
.exc2-opt.elim .exc2-opt-k { background:#b3122b; color:#fff; }
.exc2-opt.dim { opacity:.42; }

.exc2-fb { margin-top:16px; border-radius:16px; padding:15px 16px; border:1px solid; animation:exc2Up .28s cubic-bezier(.23,1,.32,1); }
@keyframes exc2Up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
.exc2-fb.win { background:rgba(255,180,60,.1); border-color:rgba(255,180,60,.3); }
.exc2-fb.soft { background:rgba(129,140,248,.1); border-color:rgba(129,140,248,.32); }
.exc2-fb.elimfb { background:rgba(179,18,43,.16); border-color:rgba(255,90,90,.4); }
.exc2-fb-h { font:800 13px 'Baloo 2','Fredoka',sans-serif; margin-bottom:4px; }
.exc2-fb.win .exc2-fb-h { color:#ffd06a; }
.exc2-fb.soft .exc2-fb-h { color:#c7d2fe; }
.exc2-fb.elimfb .exc2-fb-h { color:#ff9b9b; }
.exc2-fb-t { font-size:14px; line-height:1.5; color:#e2e0ff; }

/* Boutons CTA dorés 3D */
.exc2-go { width:100%; border:0; border-radius:16px; padding:16px; min-height:54px; cursor:pointer; margin-top:16px;
  font:800 16px 'Baloo 2','Fredoka',sans-serif; color:#3a1d00; background:linear-gradient(180deg,#ffd24a,#ff9c1c);
  box-shadow:0 5px 0 #b85e00, 0 8px 18px rgba(255,140,30,.35), inset 0 1px 0 rgba(255,255,255,.5); transition:transform .1s, box-shadow .1s; }
.exc2-go:active { transform:translateY(4px); box-shadow:0 1px 0 #b85e00, inset 0 1px 0 rgba(255,255,255,.5); }
.exc2-ghost { width:100%; border:1px solid rgba(255,255,255,.16); border-radius:16px; padding:14px; min-height:50px; cursor:pointer; margin-top:10px;
  font:700 15px 'Fredoka',sans-serif; color:#cbc6f0; background:rgba(255,255,255,.04); }

/* Bilan /31 */
.exc2-score { font:700 64px/1 'Baloo 2','Fredoka',sans-serif; margin:6px 0 2px;
  background:linear-gradient(180deg,#ffe27a,#ff9b1e); -webkit-background-clip:text; background-clip:text; color:transparent;
  transition:transform .12s cubic-bezier(.23,1,.32,1); }
.exc2-score-sep { font-size:.42em; -webkit-text-fill-color:#6b62a8; color:#6b62a8; margin:0 4px; }
.exc2-verdict { display:inline-block; font:800 13px 'Baloo 2','Fredoka',sans-serif; border-radius:999px; padding:6px 14px; margin-top:6px; }
.exc2-verdict.ok { background:linear-gradient(180deg,#ffd24a,#ff9c1c); color:#3a1d00; }
.exc2-verdict.ko { background:rgba(129,140,248,.16); color:#c7d2fe; border:1px solid rgba(129,140,248,.32); }
.exc2-fams { text-align:left; margin-top:22px; display:flex; flex-direction:column; gap:11px; }
.exc2-fam-h { font:800 12px 'Fredoka',sans-serif; text-transform:uppercase; letter-spacing:.06em; color:#9a93cf; margin-bottom:2px; }
.exc2-fam { }
.exc2-fam-row { display:flex; justify-content:space-between; font:600 13.5px 'Fredoka',sans-serif; color:#e2e0ff; margin-bottom:5px; }
.exc2-fam-row b { color:#ffd06a; font-weight:800; font-family:'IBM Plex Mono',monospace; }
.exc2-fam-row.weak b { color:#ff9b9b; }
.exc2-fam-bar { height:8px; border-radius:999px; background:#251f56; overflow:hidden; }
.exc2-fam-bar i { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg,#ffd95e,#f59b16); transition:width .6s cubic-bezier(.23,1,.32,1); }
.exc2-fam.weak .exc2-fam-bar i { background:linear-gradient(90deg,#f59e8a,#d96a52); }
.exc2-weakmsg { margin-top:18px; background:rgba(129,140,248,.1); border:1px solid rgba(129,140,248,.3); border-radius:14px; padding:13px 15px; font-size:14px; line-height:1.5; color:#e2e0ff; }
.exc2-weakmsg b { color:#ffd06a; }

@media (prefers-reduced-motion: reduce){ .exc2 *, .exc2 *::before { transition:none !important; animation:none !important; } }
</style>`;

const KEYS = ["A", "B", "C", "D"];

export async function mount(root) {
  track("page_view", { page: "exam_conduite" });
  document.body.classList.add("exc2-immersive");

  const phases = PHASES;
  const answers = []; // { item, fam, bonusKey, picked, correct, isElim }
  let view = "intro";
  let pi = 0; // phase index
  let ii = 0; // item index dans la phase
  let picked = null; // index choisi (null = pas répondu)
  const me = getCurUser();
  let moniteurName = null; // pour la carte partageable (marque du moniteur)

  // Récupère le prénom du moniteur de l'élève (best-effort, non bloquant).
  (async () => {
    try {
      if (!me?.enseignant_id) return;
      const { data } = await sb
        .from("profiles")
        .select("prenom, nom")
        .eq("id", me.enseignant_id)
        .maybeSingle();
      if (data) moniteurName = (data.prenom || data.nom || "").trim() || null;
    } catch {
      /* pas grave, on retombe sur « ton moniteur » */
    }
  })();

  const leave = () => {
    document.body.classList.remove("exc2-immersive");
    navigate("#/revision-conduite");
  };

  function pips(extra = {}) {
    return phases
      .map((_, i) => {
        let cls = "";
        if (i < pi)
          cls = extra.elimAt != null && i === extra.elimAt ? "ko" : "done";
        else if (i === pi) cls = extra.elimAt === i ? "ko" : "now";
        return `<span class="${cls}"></span>`;
      })
      .join("");
  }

  function topBar(label, onX = "abandon") {
    return `<div class="exc2-top">
      <button class="exc2-x" data-x aria-label="Quitter">✕</button>
      <div class="exc2-pips">${pips()}</div>
    </div>`;
  }

  function wireX(confirmAbandon = true) {
    root.querySelector("[data-x]")?.addEventListener("click", () => {
      if (!confirmAbandon || confirm("Quitter l'examen blanc ?")) leave();
    });
  }

  function render() {
    if (view === "phase") return renderPhaseIntro();
    if (view === "item") return renderItem();
    if (view === "results") return renderResults();
    return renderIntro();
  }

  // ── Intro ────────────────────────────────────────────────
  function renderIntro() {
    root.innerHTML = `${STYLE}<div class="exc2">
      ${topBar()}
      <div class="exc2-mid exc2-center">
        <div class="exc2-e">🏁</div>
        <div class="exc2-h">Examen blanc de conduite</div>
        <p class="exc2-sub">8 phases, comme le vrai examen. Tu choisis la bonne action à chaque fois.</p>
        <div class="exc2-chips">
          <span class="exc2-chip">Noté / ${TOTAL}</span>
          <span class="exc2-chip">Reçu dès ${SEUIL}</span>
          <span class="exc2-chip">1 faute grave = échec</span>
        </div>
        <p class="exc2-note">⚠️ C'est un entraînement, pas la vraie note. Le ${TOTAL}, c'est l'inspecteur qui le met le jour J. Ici, tu vois juste où tu en es.</p>
      </div>
      <button class="exc2-go" data-start>Commencer</button>
    </div>`;
    wireX(false);
    root.querySelector("[data-start]").addEventListener("click", () => {
      view = "phase";
      pi = 0;
      track("exam_conduite_start", { version: "phases31" });
      render();
    });
  }

  // ── Intro d'une phase ────────────────────────────────────
  function renderPhaseIntro() {
    const p = phases[pi];
    root.innerHTML = `${STYLE}<div class="exc2">
      ${topBar()}
      <div class="exc2-mid exc2-center">
        <div class="exc2-pk">PHASE ${p.n} / ${phases.length}</div>
        <div class="exc2-e">${p.emoji}</div>
        <div class="exc2-h">${esc(p.titre)}</div>
        <p class="exc2-sub">${esc(p.sous)}</p>
      </div>
      <button class="exc2-go" data-go>Commencer la phase</button>
    </div>`;
    wireX();
    root.querySelector("[data-go]").addEventListener("click", () => {
      view = "item";
      ii = 0;
      picked = null;
      render();
    });
  }

  // ── Un item (QCM) ────────────────────────────────────────
  function renderItem() {
    const p = phases[pi];
    const it = p.items[ii];
    const answered = picked !== null;
    const isElim = answered && it.elim != null && picked === it.elim;

    const opts = it.opts
      .map((o, i) => {
        let cls = "";
        if (answered) {
          if (i === it.correct) cls = "good";
          else if (i === picked) cls = i === it.elim ? "elim" : "bad";
          else cls = "dim";
        }
        return `<button class="exc2-opt ${cls}" data-i="${i}" ${answered ? "disabled" : ""}>
          <span class="exc2-opt-k">${KEYS[i] || "•"}</span><span>${esc(o)}</span>
        </button>`;
      })
      .join("");

    let fb = "";
    if (answered) {
      const good = picked === it.correct;
      const cls = isElim ? "elimfb" : good ? "win" : "soft";
      const head = isElim
        ? "⛔ Faute éliminatoire"
        : good
          ? "Bien vu"
          : "Le bon réflexe";
      const nextLabel = isElim
        ? "Voir le verdict"
        : pi === phases.length - 1 && ii === p.items.length - 1
          ? "Mon bilan"
          : "Suivant";
      fb = `<div class="exc2-fb ${cls}">
          <div class="exc2-fb-h">${head}</div>
          <div class="exc2-fb-t">${esc(it.why)}</div>
        </div>
        <button class="exc2-go" data-next>${nextLabel}</button>`;
    }

    root.innerHTML = `${STYLE}<div class="exc2">
      ${topBar()}
      <div class="exc2-mid">
        <div class="exc2-qn">${esc(phases[pi].titre)} · phase ${p.n}/${phases.length}</div>
        <div class="exc2-q">${esc(it.q)}</div>
        <div class="exc2-opts">${opts}</div>
        ${fb}
      </div>
    </div>`;
    wireX();

    if (!answered) {
      root
        .querySelectorAll(".exc2-opt")
        .forEach((b) =>
          b.addEventListener("click", () => choose(Number(b.dataset.i))),
        );
    } else {
      root.querySelector("[data-next]").addEventListener("click", () => {
        if (isElim) {
          view = "results";
          return render();
        }
        advance();
      });
    }
  }

  function choose(i) {
    if (picked !== null) return;
    const p = phases[pi];
    const it = p.items[ii];
    picked = i;
    const correct = i === it.correct;
    const isElim = it.elim != null && i === it.elim;
    answers.push({
      item: it.id,
      fam: it.fam,
      bonusKey: it.bonus || null,
      picked: i,
      correct,
      isElim,
    });
    haptic(isElim ? "warning" : correct ? "success" : "tap");
    render();
  }

  function advance() {
    const p = phases[pi];
    picked = null;
    if (ii + 1 < p.items.length) {
      ii += 1;
      view = "item";
      return render();
    }
    // phase suivante
    if (pi + 1 < phases.length) {
      pi += 1;
      ii = 0;
      view = "phase";
      return render();
    }
    view = "results";
    render();
  }

  // ── Bilan ────────────────────────────────────────────────
  function renderResults() {
    const r = scoreExam(answers);
    track("exam_conduite_done", {
      note: r.note,
      passed: r.passed,
      elim: !!r.elim,
    });
    persistLigue(r);

    if (r.elim) return renderElim(r);

    const fams = Object.keys(FAMILLES)
      .map((key) => {
        const f = FAMILLES[key];
        const got = r.famScore[key];
        const weak = r.weak === key;
        const pct = Math.round((got / f.max) * 100);
        return `<div class="exc2-fam ${weak ? "weak" : ""}">
          <div class="exc2-fam-row ${weak ? "weak" : ""}"><span>${esc(f.label)}</span><b>${got}/${f.max}</b></div>
          <div class="exc2-fam-bar"><i style="width:${pct}%"></i></div>
        </div>`;
      })
      .join("");
    const bonusTxt = Object.keys(BONUS)
      .map((k) => `${r.bonusGot[k] ? "✓" : "—"} ${BONUS[k].label}`)
      .join("   ·   ");

    root.innerHTML = `${STYLE}<div class="exc2">
      <div class="exc2-mid">
        <div class="exc2-center">
          <div class="exc2-score"><span data-count>0</span><span class="exc2-score-sep">/</span>${TOTAL}</div>
          <div class="exc2-verdict ${r.passed ? "ok" : "ko"}">${r.passed ? `Au-dessus de ${SEUIL} 🎯` : `Sous le seuil de ${SEUIL}`}</div>
          <p class="exc2-note">Bonus : ${esc(bonusTxt)}</p>
        </div>
        <div class="exc2-fams">
          <div class="exc2-fam-h">Le détail par compétence</div>
          ${fams}
        </div>
        ${
          r.weak
            ? `<div class="exc2-weakmsg">Ton point faible : <b>${esc(FAMILLES[r.weak].label)}</b>. C'est là que tu gagnes le plus de points — montre-le à ton moniteur pour la prochaine leçon.</div>`
            : `<div class="exc2-weakmsg">Rien à retravailler, c'est propre 🎯 Montre ce score à ton moniteur.</div>`
        }
        <p class="exc2-note">Rappel : c'est un entraînement. Le vrai ${TOTAL}, c'est l'inspecteur.</p>
      </div>
      <button class="exc2-go" data-share>📲 Partager mon score</button>
      <button class="exc2-ghost" data-done>Retour aux révisions</button>
    </div>`;
    root.querySelector("[data-done]").addEventListener("click", leave);
    root.querySelector("[data-share]").addEventListener("click", () => {
      openShareRecap({
        kicker: "Examen blanc de conduite",
        big: `${r.note}/${TOTAL}`,
        sub: r.passed
          ? `Au-dessus du seuil de ${SEUIL} 🎯`
          : `${r.note} points — ça progresse`,
        eleveName: me?.prenom || null,
        moniteurName,
      });
    });
    countUp(r.note);
  }

  // ── Écran faute éliminatoire ─────────────────────────────
  function renderElim() {
    root.innerHTML = `${STYLE}<div class="exc2">
      <div class="exc2-mid exc2-center">
        <div class="exc2-e">⛔</div>
        <div class="exc2-h">Faute éliminatoire</div>
        <p class="exc2-sub">Dans la réalité, une seule suffit à recaler — quel que soit ton nombre de points. C'est pour ça qu'on s'arrête ici.</p>
        <p class="exc2-note">Pas de panique : c'est un entraînement, justement pour la repérer AVANT le jour J. Relis la correction juste au-dessus et retente.</p>
      </div>
      <button class="exc2-go" data-retry>Recommencer</button>
      <button class="exc2-ghost" data-done>Retour aux révisions</button>
    </div>`;
    root.querySelector("[data-retry]").addEventListener("click", () => {
      answers.length = 0;
      pi = 0;
      ii = 0;
      picked = null;
      view = "intro";
      render();
    });
    root.querySelector("[data-done]").addEventListener("click", leave);
  }

  function countUp(target) {
    const el = root.querySelector("[data-count]");
    if (!el || target <= 0) return;
    let c = 0;
    const box = el.parentElement;
    const step = () => {
      el.textContent = String(++c);
      if (box) {
        box.style.transform = "scale(1.06)";
        setTimeout(() => (box.style.transform = ""), 80);
      }
      tapHaptic();
      if (c < target) setTimeout(step, 70);
      else setTimeout(() => haptic("success"), 120);
    };
    setTimeout(step, 280);
  }

  // Ligue Révision : +4 (1 ligne quiz_attempts, comme l'ancien examen blanc).
  function persistLigue(r) {
    const me = getCurUser();
    if (!me?.id) return;
    sb.from("quiz_attempts")
      .insert({
        user_id: me.id,
        competence_id: null,
        type: "exam_blanc",
        ref_id: "exam-conduite",
        score: Math.round((r.note / TOTAL) * 100),
        passed: r.passed,
        questions_ids: [],
        answers_indices: [],
      })
      .then(({ error }) => {
        if (error) console.error("[exam-conduite] persist", error);
      })
      .catch((e) => console.error("[exam-conduite] persist", e));
  }

  render();
}
