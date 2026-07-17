// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Réviser » (refonte « épuré », choix Rayan 2026-07-17).
//
// Fini le mur de tuiles « où donner de la tête ». 4 choix, point :
//   1. Mise en situation — LA carte héros (le mini-jeu que les élèves kiffent),
//      avec la vraie image du jeu.
//   2. Examen blanc de conduite  3. Fiches de révision  4. Centre d'examen
//      → liste nette, filets, un seul accent (violet). Zéro dégradé/glow/3D.
//
// Données 100 % réelles (repli gracieux, jamais inventées) :
//   - Série            : utils/game-state.js getStreak() (local)
//   - Scènes           : data/situations-conduite.js (SITUATIONS.length)
//   - Examen blanc      : quiz_attempts (type=exam_blanc, ref_id="exam-conduite")
//   - Fiches lues       : localStorage rvc_read_v1 + data/fiches-conduite.js
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { getStreak } from "@/utils/game-state.js";
import { SITUATIONS } from "@/data/situations-conduite.js";
import { FICHES } from "@/data/fiches-conduite.js";

const LS_READ_KEY = "rvc_read_v1"; // même clé que revision-conduite.js
const HERO_IMG = "/showcase/eleve-en-situation.png"; // vraie capture du jeu

// Pictos mono-trait (sobres, ligne — pas de pastille dégradée).
const SVG = {
  play: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 3-1 4-2 6s0 4 2 4 3-2 2-5c2 1 4 4 4 7a6 6 0 1 1-12 0c0-3 2-5 3-7 .5 2 2 2 3 1 .5-2 0-4-3-6z"/></svg>`,
  exam: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  fiche: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  centre: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>`,
  chev: `<svg class="rv2-chev" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
};

const STYLE = `<style>
.rv2 { max-width:480px; margin:0 auto; padding:8px 20px calc(96px + env(safe-area-inset-bottom));
  background:var(--bg); color:var(--ink); min-height:100dvh;
  font-family:'Plus Jakarta Sans','Nunito',sans-serif; }

.rv2-top { display:flex; align-items:center; justify-content:space-between; padding:10px 0 16px; }
.rv2-top h1 { font:800 27px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.035em; margin:0; }
.rv2-streak { display:inline-flex; align-items:center; gap:6px; font:800 12.5px/1 'Plus Jakarta Sans',sans-serif;
  color:var(--ink); background:var(--su2); border:1px solid var(--bo); border-radius:11px; padding:8px 12px; }
.rv2-streak svg { width:14px; height:14px; color:#f59e0b; }

/* Héros : la vraie image du jeu, cadrée sur la scène */
.rv2-hero { display:block; width:100%; border:0; padding:0; background:none; cursor:pointer; position:relative;
  border-radius:18px; overflow:hidden; -webkit-tap-highlight-color:transparent; transition:transform .12s ease; }
.rv2-hero:active { transform:scale(.99); }
.rv2-hero img { display:block; width:100%; height:196px; object-fit:cover; object-position:center 7%; background:#241a52; }
.rv2-badge { position:absolute; top:12px; left:12px; font:800 10.5px/1 'Plus Jakarta Sans',sans-serif;
  color:#fff; background:var(--a); padding:6px 10px; border-radius:8px; }

.rv2-lead { padding:15px 2px 0; }
.rv2-lead .k { font:800 10.5px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:.12em; text-transform:uppercase; color:var(--a-txt,var(--a)); }
.rv2-lead h2 { font:800 21px/1.12 'Plus Jakarta Sans',sans-serif; letter-spacing:-.03em; margin:8px 0 3px; color:var(--ink); }
.rv2-lead p { font:600 13px/1.45 'Nunito',sans-serif; color:var(--mu); margin:0; }

.rv2-cta { margin-top:15px; width:100%; height:52px; border:0; border-radius:14px; cursor:pointer;
  background:var(--a); color:var(--a-ink,#fff); font:800 16px/1 'Plus Jakarta Sans',sans-serif;
  display:flex; align-items:center; justify-content:center; gap:9px; transition:transform .12s ease; }
.rv2-cta:active { transform:scale(.985); }
.rv2-cta svg { width:17px; height:17px; }

/* Le reste : liste nette à filets, un seul accent */
.rv2-list { margin-top:24px; }
.rv2-row { display:flex; align-items:center; gap:14px; width:100%; text-align:left; cursor:pointer;
  background:none; border:0; border-top:1px solid var(--bo); padding:16px 2px; color:var(--ink);
  -webkit-tap-highlight-color:transparent; transition:opacity .12s ease; }
.rv2-row:last-child { border-bottom:1px solid var(--bo); }
.rv2-row:active { opacity:.55; }
.rv2-ic { width:44px; height:44px; border-radius:12px; flex:none; display:grid; place-items:center; background:var(--su2); }
.rv2-ic svg { width:22px; height:22px; }
.rv2-ic.ex { color:#5b4fd0; } .rv2-ic.fi { color:#0f9d67; } .rv2-ic.ce { color:#d97a2b; }
.rv2-rtx { flex:1; min-width:0; }
.rv2-rtx b { display:block; font:800 15px/1.18 'Plus Jakarta Sans',sans-serif; letter-spacing:-.02em; }
.rv2-rtx span { font:600 12px/1.3 'Nunito',sans-serif; color:var(--mu); }
.rv2-rm { flex:none; font:800 12.5px/1 'Plus Jakarta Sans',sans-serif; color:var(--mu); }
.rv2-chev { width:18px; height:18px; flex:none; color:var(--mu); opacity:.5; }

/* Skeleton */
.rv2-skel { border-radius:18px; background:var(--su2); animation:rv2pulse 1.2s ease-in-out infinite; }
.rv2-skel.hero { height:198px; margin-top:2px; }
.rv2-skel.row { height:64px; margin-top:12px; border-radius:12px; }
@keyframes rv2pulse { 0%,100%{opacity:.55} 50%{opacity:1} }
@media (prefers-reduced-motion: reduce){ .rv2-skel{animation:none} .rv2-hero,.rv2-cta,.rv2-row{transition:none} }
</style>`;

function skeleton() {
  return `${STYLE}<div class="rv2">
    <div class="rv2-top"><h1>Réviser</h1></div>
    <div class="rv2-skel hero"></div>
    <div class="rv2-skel row"></div>
    <div class="rv2-skel row"></div>
    <div class="rv2-skel row"></div>
  </div>`;
}

function render({ streak, sceneCount, examBest, fichesLues, fichesTotal }) {
  const streakTxt =
    streak.count > 0 ? `Série ${streak.count} j` : "Série · nouvelle";
  const examMeta = examBest != null ? `Record ${examBest} %` : "Se tester";
  const row = (id, ic, cls, title, sub, meta) => `
    <button class="rv2-row" data-go="${id}">
      <span class="rv2-ic ${cls}">${ic}</span>
      <span class="rv2-rtx"><b>${title}</b><span>${sub}</span></span>
      <span class="rv2-rm">${meta}</span>
      ${SVG.chev}
    </button>`;

  return `${STYLE}<div class="rv2">
    <div class="rv2-top">
      <h1>Réviser</h1>
      <span class="rv2-streak">${SVG.flame}${streakTxt}</span>
    </div>

    <button class="rv2-hero" data-go="en-situation" aria-label="Jouer une scène de conduite">
      <img src="${HERO_IMG}" alt="Une scène du jeu En situation : un croisement à décider" loading="eager">
      <span class="rv2-badge">Le préféré des élèves</span>
    </button>

    <div class="rv2-lead">
      <div class="k">Mise en situation · ${sceneCount} scènes</div>
      <h2>Une scène, une décision</h2>
      <p>3 min, comme sur la route — pas du code.</p>
    </div>
    <button class="rv2-cta" data-go="en-situation">${SVG.play}Jouer une scène</button>

    <div class="rv2-list">
      ${row("exam-conduite", SVG.exam, "ex", "Examen blanc", "Comme le jour J, noté /31", examMeta)}
      ${row("revision-conduite", SVG.fiche, "fi", "Fiches de révision", "Le geste, pas le code", `${fichesLues}/${fichesTotal}`)}
      ${row("centre-examen", SVG.centre, "ce", "Centre d'examen", "Ton centre, le jour J", "Voir")}
    </div>
  </div>`;
}

function wire(root) {
  root.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => {
      const dest = el.getAttribute("data-go");
      haptic("tap");
      track("reviser.open", { dest });
      navigate(`/${dest}`);
    });
  });
}

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track("page_view", { page: "eleve_reviser" });

  root.innerHTML = skeleton();

  // Fiches lues (local, instantané)
  let read = {};
  try {
    read = JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    /* noop */
  }
  const fichesLues = FICHES.filter((f) => read[f.code]).length;

  // Meilleur score de l'examen blanc de CONDUITE (repli gracieux si indispo).
  let examBest = null;
  try {
    const { data, error } = await sb
      .from("quiz_attempts")
      .select("score, ref_id")
      .eq("user_id", me.id)
      .eq("type", "exam_blanc");
    if (!error) {
      const attempts = (data || []).filter(
        (a) => a.ref_id === "exam-conduite" && typeof a.score === "number",
      );
      if (attempts.length) examBest = Math.max(...attempts.map((a) => a.score));
    }
  } catch {
    /* réseau indispo → méta « Se tester » */
  }

  root.innerHTML = render({
    streak: getStreak(),
    sceneCount: SITUATIONS.length,
    examBest,
    fichesLues,
    fichesTotal: FICHES.length,
  });
  wire(root);
}
