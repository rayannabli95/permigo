// ═══════════════════════════════════════════════════════════════
// Élève — « Révision conduite »
// Le différenciateur PermiGo : on révise le GESTE de conduite (pas le code),
// entre les leçons. Données = src/data/fiches-conduite.js (vécu de vrais
// moniteurs). Mécanique : fiche → 3 questions en récupération active (flashcard).
//
// v1 100% front + localStorage (aucune table DB). Le pilotage par le moniteur
// (« Avant/Après ta leçon ») viendra dans une 2e couche (nécessite la DB).
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { navigate } from "@/router.js";
import { track } from "@/services/analytics.js";
import {
  FICHES,
  MONDES,
  getFiche,
  fichesByMonde,
} from "@/data/fiches-conduite.js";

const LS_KEY = "rvc_revised_v1"; // { [code]: isoDate }

function loadRevised() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function markRevised(code) {
  const r = loadRevised();
  r[code] = new Date().toISOString();
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(r));
  } catch {
    /* quota / private mode : non bloquant */
  }
}
function revisedToday(code, revised) {
  const iso = revised[code];
  if (!iso) return false;
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

// Point faible du jour : la compétence la moins récemment révisée
// (jamais révisée d'abord), déterministe et stable dans la journée.
function pointFaible(revised) {
  if (!FICHES.length) return null;
  const sorted = [...FICHES].sort((a, b) => {
    const ra = revised[a.code] || "";
    const rb = revised[b.code] || "";
    return ra < rb ? -1 : ra > rb ? 1 : 0;
  });
  return sorted[0];
}

const STYLE = `<style>
.rvc { max-width: 480px; margin: 0 auto; padding: 0 16px calc(110px + env(safe-area-inset-bottom));
  background: var(--bg); color: var(--ink); font-family: 'Inter', sans-serif; }
.rvc-top { display:flex; align-items:center; gap:10px; padding:16px 0 8px; }
.rvc-back { width:38px; height:38px; border-radius:11px; border:0; cursor:pointer;
  background: var(--surface, #fff); color: var(--ink); font-size:20px; line-height:1;
  box-shadow: 0 1px 4px rgba(0,0,0,.08); flex-shrink:0; }
.rvc-back:active { transform: scale(0.95); }
.rvc-h1 { font: 800 22px/1.1 'Plus Jakarta Sans', sans-serif; letter-spacing:-.025em; margin:0; }
.rvc-sub { color: var(--muted, #64748b); font-size:13px; margin:2px 0 0; }

/* Carte « point faible du jour » */
.rvc-pf { margin:14px 0 18px; border-radius:18px; padding:18px;
  background: linear-gradient(135deg, var(--a, #6366f1), #8b5cf6); color:#fff;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--a, #6366f1) 35%, transparent); }
.rvc-pf-k { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; opacity:.9; }
.rvc-pf-t { font: 800 19px/1.15 'Plus Jakarta Sans', sans-serif; margin:6px 0 2px; }
.rvc-pf-c { font-size:13px; opacity:.92; }
.rvc-pf-btn { margin-top:14px; width:100%; border:0; border-radius:12px; padding:13px;
  font:700 15px 'Plus Jakarta Sans',sans-serif; cursor:pointer; background:#fff; color:#4f46e5; }
.rvc-pf-btn:active { transform: scale(0.98); }

/* Mondes + compétences */
.rvc-monde { margin-bottom:18px; }
.rvc-monde-h { font:800 15px 'Plus Jakarta Sans',sans-serif; margin:0 0 2px; }
.rvc-monde-s { color: var(--muted,#64748b); font-size:12px; margin:0 0 10px; }
.rvc-list { display:flex; flex-direction:column; gap:8px; }
.rvc-card { display:flex; align-items:center; gap:12px; text-align:left; width:100%;
  border:0; cursor:pointer; background: var(--surface,#fff); color:var(--ink);
  border-radius:14px; padding:13px 14px; box-shadow:0 1px 4px rgba(0,0,0,.06);
  transition: transform .15s cubic-bezier(.23,1,.32,1); }
.rvc-card:active { transform: scale(0.985); }
.rvc-card-tit { font:700 14px/1.2 'Plus Jakarta Sans',sans-serif; flex:1; }
.rvc-chk { width:20px; height:20px; border-radius:50%; flex-shrink:0; font-size:12px;
  display:flex; align-items:center; justify-content:center; }
.rvc-chk.on { background:#10b981; color:#fff; }
.rvc-chk.off { border:2px solid var(--border,#e2e8f0); color:transparent; }

/* Fiche détail */
.rvc-fiche-tag { display:inline-block; font-size:11px; font-weight:700; color:var(--a,#6366f1);
  background: color-mix(in srgb, var(--a,#6366f1) 12%, transparent); padding:3px 9px; border-radius:999px; }
.rvc-block { margin:16px 0; }
.rvc-block-h { font:800 13px 'Plus Jakarta Sans',sans-serif; text-transform:uppercase;
  letter-spacing:.05em; color:var(--muted,#64748b); margin:0 0 8px; }
.rvc-steps { margin:0; padding:0; list-style:none; counter-reset: s; display:flex; flex-direction:column; gap:8px; }
.rvc-steps li { counter-increment:s; position:relative; padding:10px 12px 10px 40px;
  background: var(--surface,#fff); border-radius:12px; font-size:14px; line-height:1.4;
  box-shadow:0 1px 3px rgba(0,0,0,.05); }
.rvc-steps li::before { content: counter(s); position:absolute; left:10px; top:10px;
  width:22px; height:22px; border-radius:50%; background:var(--a,#6366f1); color:#fff;
  font:700 12px 'IBM Plex Mono',monospace; display:flex; align-items:center; justify-content:center; }
.rvc-why, .rvc-err, .rvc-bva { border-radius:12px; padding:12px 14px; font-size:14px; line-height:1.45; }
.rvc-why { background: color-mix(in srgb, #6366f1 8%, transparent); }
.rvc-err { background: color-mix(in srgb, #f59e0b 12%, transparent); }
.rvc-bva { background: color-mix(in srgb, #06b6d4 10%, transparent); }
.rvc-src { font-size:11px; color:var(--muted,#94a3b8); margin-top:14px; }
.rvc-go { position:sticky; bottom: calc(16px + env(safe-area-inset-bottom)); width:100%;
  border:0; border-radius:14px; padding:15px; cursor:pointer; margin-top:18px;
  font:800 16px 'Plus Jakarta Sans',sans-serif; color:#fff; background:var(--a,#6366f1);
  box-shadow:0 8px 20px color-mix(in srgb, var(--a,#6366f1) 40%, transparent); }
.rvc-go:active { transform: scale(0.98); }

/* Flashcards */
.rvc-prog { font:700 12px 'IBM Plex Mono',monospace; color:var(--muted,#64748b); text-align:center; margin:10px 0 14px; }
.rvc-q { background:var(--surface,#fff); border-radius:18px; padding:22px 18px; min-height:120px;
  display:flex; align-items:center; box-shadow:0 2px 10px rgba(0,0,0,.07);
  font:700 18px/1.35 'Plus Jakarta Sans',sans-serif; }
.rvc-a { margin-top:14px; border-radius:16px; padding:18px; background: color-mix(in srgb,#10b981 10%, transparent);
  animation: rvcrise .25s cubic-bezier(.23,1,.32,1); }
@keyframes rvcrise { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
.rvc-a-r { font:800 16px 'Plus Jakarta Sans',sans-serif; color:#047857; }
.rvc-a-e { font-size:14px; line-height:1.45; margin-top:6px; color:var(--ink); }
.rvc-done { text-align:center; padding:40px 16px; }
.rvc-done-e { font-size:54px; }
.rvc-done-t { font:800 22px 'Plus Jakarta Sans',sans-serif; margin:10px 0 4px; }
@media (prefers-reduced-motion: reduce) { .rvc *, .rvc *::before { transition:none !important; animation:none !important; } }
</style>`;

export async function mount(root) {
  track("page_view", { page: "revision-conduite" });

  // Garde-fou : si les données ne sont pas chargées (build/JSON), on n'explose pas.
  if (!FICHES.length) {
    root.innerHTML = `${STYLE}<div class="rvc"><div class="rvc-top">
      <button class="rvc-back" aria-label="Retour">←</button>
      <h1 class="rvc-h1">Révision conduite</h1></div>
      <p class="rvc-sub" style="margin-top:20px">Le contenu arrive très vite. Reviens dans un instant 👀</p></div>`;
    root
      .querySelector(".rvc-back")
      ?.addEventListener("click", () => navigate("#/"));
    return;
  }

  let view = "home";
  let code = null;
  let qi = 0;
  let revealed = false;

  function render() {
    if (view === "fiche") return renderFiche();
    if (view === "quiz") return renderQuiz();
    return renderHome();
  }

  function renderHome() {
    const revised = loadRevised();
    const pf = pointFaible(revised);
    const mondes = MONDES.map((m) => {
      const items = fichesByMonde(m.n)
        .map((f) => {
          const on = revisedToday(f.code, revised);
          return `<button class="rvc-card" data-code="${esc(f.code)}">
            <span class="rvc-card-tit">${esc(f.titre)}</span>
            <span class="rvc-chk ${on ? "on" : "off"}">${on ? "✓" : ""}</span>
          </button>`;
        })
        .join("");
      return `<section class="rvc-monde">
        <h2 class="rvc-monde-h">${esc(m.nom)}</h2>
        <p class="rvc-monde-s">${esc(m.sous)}</p>
        <div class="rvc-list">${items}</div>
      </section>`;
    }).join("");

    root.innerHTML = `${STYLE}<div class="rvc">
      <div class="rvc-top">
        <button class="rvc-back" aria-label="Retour à l'accueil">←</button>
        <div><h1 class="rvc-h1">Révision conduite</h1>
        <p class="rvc-sub">Le geste, pas le code. Révise entre tes leçons.</p></div>
      </div>
      ${
        pf
          ? `<div class="rvc-pf">
        <div class="rvc-pf-k">⚡ Ton point faible du jour</div>
        <div class="rvc-pf-t">${esc(pf.titre)}</div>
        <div class="rvc-pf-c">3 questions ciblées · 1 minute</div>
        <button class="rvc-pf-btn" data-pf="${esc(pf.code)}">Réviser maintenant</button>
      </div>`
          : ""
      }
      ${mondes}
    </div>`;
    wireHome();
  }

  function wireHome() {
    root
      .querySelector(".rvc-back")
      ?.addEventListener("click", () => navigate("#/"));
    root.querySelector("[data-pf]")?.addEventListener("click", (e) => {
      code = e.currentTarget.getAttribute("data-pf");
      track("revision_conduite_pf_start", { code });
      startQuiz();
    });
    root.querySelectorAll(".rvc-card").forEach((b) =>
      b.addEventListener("click", () => {
        code = b.getAttribute("data-code");
        view = "fiche";
        render();
      }),
    );
  }

  function renderFiche() {
    const f = getFiche(code);
    if (!f) {
      view = "home";
      return render();
    }
    const steps = (f.methode || []).map((s) => `<li>${esc(s)}</li>`).join("");
    root.innerHTML = `${STYLE}<div class="rvc">
      <div class="rvc-top">
        <button class="rvc-back" aria-label="Retour">←</button>
        <div><span class="rvc-fiche-tag">${esc(f.code)} · ${esc(f.competence)}</span>
        <h1 class="rvc-h1" style="margin-top:6px">${esc(f.titre)}</h1></div>
      </div>
      ${
        steps
          ? `<div class="rvc-block"><h3 class="rvc-block-h">La méthode</h3>
        <ol class="rvc-steps">${steps}</ol></div>`
          : ""
      }
      ${
        f.pourquoi
          ? `<div class="rvc-block"><h3 class="rvc-block-h">Le pourquoi</h3>
        <div class="rvc-why">${esc(f.pourquoi)}</div></div>`
          : ""
      }
      ${
        f.erreur
          ? `<div class="rvc-block"><h3 class="rvc-block-h">L'erreur classique</h3>
        <div class="rvc-err">${esc(f.erreur)}</div></div>`
          : ""
      }
      ${
        f.bva
          ? `<div class="rvc-block"><h3 class="rvc-block-h">Boîte automatique</h3>
        <div class="rvc-bva">${esc(f.bva)}</div></div>`
          : ""
      }
      ${
        Array.isArray(f.sources) && f.sources.length
          ? `<p class="rvc-src">🎬 D'après de vrais moniteurs : ${f.sources.map((s) => esc(s)).join(", ")}</p>`
          : ""
      }
      <button class="rvc-go">Réviser ces ${(f.questions || []).length} questions</button>
    </div>`;
    root.querySelector(".rvc-back").addEventListener("click", () => {
      view = "home";
      render();
    });
    root.querySelector(".rvc-go").addEventListener("click", () => startQuiz());
  }

  function startQuiz() {
    view = "quiz";
    qi = 0;
    revealed = false;
    track("revision_conduite_quiz_start", { code });
    render();
  }

  function renderQuiz() {
    const f = getFiche(code);
    const qs = (f && f.questions) || [];
    if (!f || !qs.length) {
      view = "fiche";
      return render();
    }
    if (qi >= qs.length) {
      markRevised(code);
      track("revision_conduite_quiz_done", { code });
      root.innerHTML = `${STYLE}<div class="rvc"><div class="rvc-done">
        <div class="rvc-done-e">🏁</div>
        <div class="rvc-done-t">${esc(f.titre)} : révisé !</div>
        <p class="rvc-sub">${qs.length} questions passées. Reviens demain pour le garder en tête.</p>
        <button class="rvc-go" data-next>Continuer</button>
      </div></div>`;
      root.querySelector("[data-next]").addEventListener("click", () => {
        view = "home";
        render();
      });
      return;
    }
    const q = qs[qi];
    root.innerHTML = `${STYLE}<div class="rvc">
      <div class="rvc-top">
        <button class="rvc-back" aria-label="Retour à la fiche">←</button>
        <h1 class="rvc-h1" style="font-size:17px">${esc(f.titre)}</h1>
      </div>
      <div class="rvc-prog">Question ${qi + 1} / ${qs.length}</div>
      <div class="rvc-q">${esc(q.q)}</div>
      ${
        revealed
          ? `<div class="rvc-a">
        <div class="rvc-a-r">${esc(q.reponse)}</div>
        ${q.explication ? `<div class="rvc-a-e">${esc(q.explication)}</div>` : ""}
      </div>`
          : ""
      }
      <button class="rvc-go" data-act="${revealed ? "next" : "reveal"}">
        ${revealed ? (qi + 1 >= qs.length ? "Terminer" : "Question suivante") : "Voir la réponse"}
      </button>
    </div>`;
    root.querySelector(".rvc-back").addEventListener("click", () => {
      view = "fiche";
      render();
    });
    root.querySelector("[data-act]").addEventListener("click", (e) => {
      if (e.currentTarget.getAttribute("data-act") === "reveal") {
        revealed = true;
      } else {
        qi += 1;
        revealed = false;
      }
      render();
    });
  }

  render();
}
