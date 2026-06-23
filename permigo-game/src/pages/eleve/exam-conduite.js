// ═══════════════════════════════════════════════════════════════
// Élève — « Examen blanc de CONDUITE » (le boss de fin de la révision conduite)
// Auto-évaluation honnête sur l'ensemble des compétences : ~16 questions
// tirées des 4 mondes → l'élève s'auto-note (su / pas sûr) → verdict de
// readiness + compétences à revoir.
//
// ⚠️ Ce n'est PAS la note officielle /31 (seul l'inspecteur la donne).
// On le dit clairement : c'est un « où tu en es ». La seule écriture DB est
// UNE ligne quiz_attempts (type 'exam_blanc') à la fin → +4 ligue Révision,
// comme l'ancien examen blanc. Rien d'autre (pas de note officielle stockée).
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { navigate } from "@/router.js";
import { track } from "@/services/analytics.js";
import { haptic, tapHaptic } from "@/utils/haptic.js";
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { MONDES, fichesByMonde } from "@/data/fiches-conduite.js";

const PER_MONDE = 4; // ~16 questions au total, couvre les 4 mondes

function shuffle(a) {
  return a.sort(() => Math.random() - 0.5);
}

function buildExam() {
  const picked = [];
  MONDES.forEach((m) => {
    const qs = [];
    fichesByMonde(m.n).forEach((f) => {
      (f.questions || []).forEach((q) =>
        qs.push({ code: f.code, titre: f.titre, monde: m.n, ...q }),
      );
    });
    picked.push(...shuffle(qs).slice(0, PER_MONDE));
  });
  return shuffle(picked);
}

function verdict(pct) {
  if (pct >= 0.8)
    return {
      e: "💪",
      t: "Ça sent bon !",
      s: "Gros score. Le dernier mot, c'est ton moniteur — montre-lui.",
    };
  if (pct >= 0.5)
    return {
      e: "🔥",
      t: "Presque !",
      s: "Quelques révisions et c'est plié.",
    };
  return {
    e: "📚",
    t: "Faut bosser un peu",
    s: "Relis les fiches cool, ça va rentrer.",
  };
}

const STYLE = `<style>
.exc { max-width: 480px; margin: 0 auto; padding: 0 16px calc(110px + env(safe-area-inset-bottom));
  background: var(--bg); color: var(--ink); font-family: 'Inter', sans-serif; }
.exc-top { display:flex; align-items:center; gap:10px; padding:16px 0 8px; }
.exc-back { width:38px; height:38px; border-radius:11px; border:0; cursor:pointer;
  background: var(--su,#fff); color: var(--ink); font-size:20px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
.exc-back:active { transform: scale(0.95); }
.exc-h1 { font:800 22px/1.1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.025em; margin:0; }
.exc-intro { text-align:center; padding:24px 8px; }
.exc-intro-e { font-size:52px; }
.exc-intro-t { font:800 22px 'Plus Jakarta Sans',sans-serif; margin:10px 0 6px; }
.exc-sub { color: var(--mu,#64748b); font-size:14px; line-height:1.5; }
.exc-note { font-size:12px; color: var(--mu,#94a3b8); margin-top:14px; line-height:1.5; }
.exc-prog { font:700 12px 'IBM Plex Mono',monospace; color:var(--mu,#64748b); text-align:center; margin:10px 0 6px; }
.exc-barwrap { height:6px; border-radius:999px; background: color-mix(in srgb,#6366f1 14%, transparent); overflow:hidden; margin-bottom:16px; }
.exc-bar { height:100%; background: var(--a,#6366f1); transition: width .3s cubic-bezier(.23,1,.32,1); }
.exc-tag { display:inline-block; font-size:11px; font-weight:700; color:var(--a,#6366f1);
  background: color-mix(in srgb,var(--a,#6366f1) 12%, transparent); padding:3px 9px; border-radius:999px; margin-bottom:10px; }
.exc-q { background:var(--su,#fff); border-radius:18px; padding:22px 18px; min-height:110px;
  display:flex; align-items:center; box-shadow:0 2px 10px rgba(0,0,0,.07);
  font:700 18px/1.35 'Plus Jakarta Sans',sans-serif; }
.exc-a { margin-top:14px; border-radius:16px; padding:18px; background: color-mix(in srgb,#10b981 10%, transparent);
  animation: excrise .25s cubic-bezier(.23,1,.32,1); }
@keyframes excrise { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
.exc-a-r { font:800 16px 'Plus Jakarta Sans',sans-serif; color:var(--gr-txt,#047857); }
.exc-a-e { font-size:14px; line-height:1.45; margin-top:6px; color:var(--ink); }
.exc-go { width:100%; border:0; border-radius:14px; padding:15px; cursor:pointer; margin-top:18px;
  font:800 16px 'Plus Jakarta Sans',sans-serif; color:#fff; background:var(--a,#6366f1);
  box-shadow:0 8px 20px color-mix(in srgb,var(--a,#6366f1) 38%, transparent); }
.exc-go:active { transform: scale(0.98); }
.exc-rate { display:flex; gap:10px; margin-top:14px; }
.exc-rate button { flex:1; border:0; border-radius:12px; padding:14px; cursor:pointer; font:800 15px 'Plus Jakarta Sans',sans-serif; }
.exc-rate button:active { transform: scale(0.97); }
.exc-knew { background: color-mix(in srgb,#10b981 16%, transparent); color:var(--gr-txt,#047857); }
.exc-nope { background: color-mix(in srgb,#f59e0b 16%, transparent); color:var(--am-txt,#b45309); }
.exc-res { text-align:center; padding:24px 8px; }
.exc-res-e { font-size:54px; animation: excrise .35s cubic-bezier(.23,1,.32,1) both; }
.exc-score { font:800 40px 'IBM Plex Mono',monospace; margin:6px 0 2px; transition: transform .12s cubic-bezier(.23,1,.32,1); }
.exc-res-t { font:800 22px 'Plus Jakarta Sans',sans-serif; margin:4px 0; }
.exc-weak { text-align:left; margin-top:20px; }
.exc-weak-h { font:800 13px 'Plus Jakarta Sans',sans-serif; text-transform:uppercase; letter-spacing:.05em; color:var(--mu,#64748b); margin-bottom:8px; }
.exc-weak-row { background:var(--su,#fff); border-radius:12px; padding:11px 14px; margin-bottom:8px; font-size:14px; font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,.05); }
@media (prefers-reduced-motion: reduce) { .exc *, .exc *::before { transition:none !important; animation:none !important; } }
</style>`;

export async function mount(root) {
  track("page_view", { page: "exam-conduite" });

  let exam = buildExam();
  if (!exam.length) {
    root.innerHTML = `${STYLE}<div class="exc"><div class="exc-top">
      <button class="exc-back" aria-label="Retour">←</button>
      <h1 class="exc-h1">Examen blanc</h1></div>
      <p class="exc-sub" style="margin-top:20px">Le contenu arrive très vite 👀</p></div>`;
    root
      .querySelector(".exc-back")
      ?.addEventListener("click", () => navigate("#/revision-conduite"));
    return;
  }

  let view = "intro";
  let idx = 0;
  let revealed = false;
  const results = []; // { code, titre, known }

  function render() {
    if (view === "exam") return renderQ();
    if (view === "results") return renderResults();
    return renderIntro();
  }

  function renderIntro() {
    root.innerHTML = `${STYLE}<div class="exc">
      <div class="exc-top">
        <button class="exc-back" aria-label="Retour à la révision">←</button>
        <h1 class="exc-h1">Examen blanc</h1>
      </div>
      <div class="exc-intro">
        <div class="exc-intro-e">🏁</div>
        <div class="exc-intro-t">${exam.length} questions · toutes les compétences</div>
        <p class="exc-sub">Réponds dans ta tête, vérifie, note-toi cash. À la fin : où t'en es + quoi bosser.</p>
        <p class="exc-note">⚠️ C'est un entraînement, pas la vraie note. Le /31, c'est l'inspecteur le jour J.</p>
        <button class="exc-go" data-start>C'est parti</button>
      </div>
    </div>`;
    root
      .querySelector(".exc-back")
      .addEventListener("click", () => navigate("#/revision-conduite"));
    root.querySelector("[data-start]").addEventListener("click", () => {
      view = "exam";
      track("exam_conduite_start", { n: exam.length });
      render();
    });
  }

  function renderQ() {
    const q = exam[idx];
    const pct = Math.round((idx / exam.length) * 100);
    root.innerHTML = `${STYLE}<div class="exc">
      <div class="exc-top">
        <button class="exc-back" aria-label="Abandonner">←</button>
        <h1 class="exc-h1" style="font-size:18px">Examen blanc</h1>
      </div>
      <div class="exc-prog">${idx + 1} / ${exam.length}</div>
      <div class="exc-barwrap"><div class="exc-bar" style="width:${pct}%"></div></div>
      <span class="exc-tag">${esc(q.titre)}</span>
      <div class="exc-q">${esc(q.q)}</div>
      ${
        revealed
          ? `<div class="exc-a">
              <div class="exc-a-r">${esc(q.reponse)}</div>
              ${q.explication ? `<div class="exc-a-e">${esc(q.explication)}</div>` : ""}
            </div>
            <div class="exc-rate">
              <button class="exc-knew" data-k="1">Je savais ✅</button>
              <button class="exc-nope" data-k="0">Pas sûr</button>
            </div>`
          : `<button class="exc-go" data-reveal>La réponse</button>`
      }
    </div>`;
    root.querySelector(".exc-back").addEventListener("click", () => {
      if (confirm("Abandonner l'examen blanc ?"))
        navigate("#/revision-conduite");
    });
    if (!revealed) {
      root.querySelector("[data-reveal]").addEventListener("click", () => {
        revealed = true;
        haptic("select");
        render();
      });
    } else {
      root.querySelectorAll("[data-k]").forEach((b) =>
        b.addEventListener("click", () => {
          const known = b.getAttribute("data-k") === "1";
          results.push({ code: q.code, titre: q.titre, known });
          haptic(known ? "success" : "tap");
          idx += 1;
          revealed = false;
          if (idx >= exam.length) view = "results";
          render();
        }),
      );
    }
  }

  function renderResults() {
    const known = results.filter((r) => r.known).length;
    const total = results.length;
    const pct = total ? known / total : 0;
    const v = verdict(pct);
    // compétences à revoir (uniques, dans l'ordre d'apparition)
    const weak = [];
    const seen = new Set();
    results.forEach((r) => {
      if (!r.known && !seen.has(r.code)) {
        seen.add(r.code);
        weak.push(r.titre);
      }
    });
    track("exam_conduite_done", { known, total });
    // Ligue Révision : +4 pts (ref_id 'exam-conduite' distinct des parcours du
    // code → compté une fois par get_theory_leaderboard). Insertion directe,
    // fire-and-forget (RLS : l'élève écrit les siens). passed ≥70% des « je savais ».
    const me = getCurUser();
    if (me?.id && total > 0) {
      const scorePct = Math.round((known / total) * 100);
      sb.from("quiz_attempts")
        .insert({
          user_id: me.id,
          competence_id: null,
          type: "exam_blanc",
          ref_id: "exam-conduite",
          score: scorePct,
          passed: scorePct >= 70,
          questions_ids: [],
          answers_indices: [],
        })
        .then(({ error }) => {
          if (error) console.error("[exam-conduite] persist attempt", error);
        })
        .catch((e) => console.error("[exam-conduite] persist attempt", e));
    }
    root.innerHTML = `${STYLE}<div class="exc">
      <div class="exc-res">
        <div class="exc-res-e">${v.e}</div>
        <div class="exc-score"><span data-count>0</span>/${total}</div>
        <div class="exc-res-t">${esc(v.t)}</div>
        <p class="exc-sub">${esc(v.s)}</p>
      </div>
      ${
        weak.length
          ? `<div class="exc-weak">
              <div class="exc-weak-h">À retravailler en premier</div>
              ${weak.map((t) => `<div class="exc-weak-row">${esc(t)}</div>`).join("")}
            </div>`
          : `<p class="exc-sub" style="text-align:center">Rien à retravailler, propre. 🎯</p>`
      }
      <button class="exc-go" data-again>Retour aux révisions</button>
    </div>`;
    root
      .querySelector("[data-again]")
      .addEventListener("click", () => navigate("#/revision-conduite"));
    const countEl = root.querySelector("[data-count]");
    if (countEl && known > 0) {
      let c = 0;
      const box = countEl.parentElement;
      const step = () => {
        countEl.textContent = String(++c);
        if (box) {
          box.style.transform = "scale(1.09)";
          setTimeout(() => (box.style.transform = ""), 90);
        }
        tapHaptic();
        if (c < known) setTimeout(step, 150);
        else setTimeout(() => haptic("success"), 150);
      };
      setTimeout(step, 280);
    }
  }

  render();
}
