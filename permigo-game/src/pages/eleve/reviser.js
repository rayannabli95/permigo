// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Réviser » : LA porte unique d'entraînement
// (nav 5 portes — regroupe Arène, examen blanc, fiches conduite,
//  trouve la faute, question du jour, points faibles)
// Données 100% locales au premier rendu (instantané), enrichies
// ensuite par la question du jour (1 fetch léger).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { getStreak } from "@/utils/game-state.js";
import { isDailyDone } from "@/services/daily-quiz.js";
import { getWeakPoints } from "@/utils/weak-points.js";
import { FICHES } from "@/data/fiches-conduite.js";

const LS_READ_KEY = "rvc_read_v1"; // même clé que revision-conduite (fiches lues)

// Icônes vectorielles nettes (les emojis rendaient « png flou » selon l'appareil).
// Dessinées ici pour coller au sujet conduite (volant, feu, panneau danger…).
const IC = {
  flame: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 23a7 7 0 0 0 7-7c0-2.5-1.3-4.4-2.7-6C15 8.4 13.4 6.8 13.8 3.1c.1-.9-1-1.4-1.6-.7C9.4 5 6 8.6 6 13.6A6.4 6.4 0 0 0 12 23zm0-3.3a2.5 2.5 0 0 1-2.5-2.5c0-1.4 1-2.3 1.6-3.1.5.8 2 1.3 2 3a2.2 2.2 0 0 1-1.1 2.6z"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.2 18h5.6"/><path d="M10 21.5h4"/><path d="M12 2.5a7 7 0 0 0-4.2 12.6c.6.4 1 1.1 1.1 1.9h6.2c.1-.8.5-1.5 1.1-1.9A7 7 0 0 0 12 2.5z"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2H6v2H2.5a.5.5 0 0 0-.5.5V6a4.5 4.5 0 0 0 4.36 4.5A6 6 0 0 0 11 14.92V18H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-3v-3.08a6 6 0 0 0 4.64-4.42A4.5 4.5 0 0 0 22 6V4.5a.5.5 0 0 0-.5-.5H18V2zM4 6v-.5h2v2.9A2.5 2.5 0 0 1 4 6zm16 0a2.5 2.5 0 0 1-2 2.4V5.5h2V6z"/></svg>`,
  cap: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 1 8l11 5 9-4.1V15h2V8L12 3z"/><path d="M5 13.2V17c0 1.66 3.13 3 7 3s7-1.34 7-3v-3.8l-7 3.18-7-3.18z"/></svg>`,
  wheel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/><path d="M12 4.7v4.8M5.1 16.4l4.1-2.4M18.9 16.4l-4.1-2.4" stroke-linecap="round"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M12 3.5 2 20.5h20L12 3.5z"/><path d="M12 10v4"/><circle cx="12" cy="17.2" r=".8" fill="currentColor" stroke="none"/></svg>`,
  light: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="8" y="2" width="8" height="20" rx="4"/><circle cx="12" cy="7" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" opacity=".45"/><circle cx="12" cy="17" r="1.7" fill="currentColor" stroke="none" opacity=".45"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`,
};

const STYLE = `<style>
/* Monde de l'entraînement : Arène nuit-violet + or (comme le quiz),
   en full-bleed sous le header vitre (pattern livret). */
.rvh {
  --rvh-panel: #241644;
  --rvh-panel2: #2b1b54;
  --rvh-line: rgba(167,139,250,.20);
  --rvh-mu: #c3b8e8;
  --rvh-mu2: #9488bf;
  --rvh-gold: #ffd24a;
  --rvh-gold-soft: #ffe9a8;
  position: relative;
  margin-top: calc(-1 * (var(--th, 52px) + env(safe-area-inset-top, 0px)));
  padding: calc(var(--th, 52px) + env(safe-area-inset-top, 0px) + 10px) 16px 96px;
  min-height: 100dvh;
  max-width: 480px;
  margin-inline: auto;
  color: #fff;
  font-family: 'Nunito', system-ui, sans-serif;
  background:
    radial-gradient(120% 55% at 20% -6%, rgba(168,85,247,.40) 0%, transparent 54%),
    radial-gradient(110% 45% at 96% 4%, rgba(255,156,28,.14) 0%, transparent 50%),
    linear-gradient(180deg, #1d1138 0%, #150d2b 46%, #100a22 100%);
}
.rvh-title {
  font: 800 24px/1.1 'Baloo 2', cursive;
  letter-spacing: -.2px;
  margin: 4px 2px 12px;
  text-shadow: 0 2px 0 rgba(0,0,0,.25), 0 0 18px rgba(168,85,247,.4);
}

/* rituels du jour */
.rvh-daily { display: flex; gap: 10px; margin-bottom: 14px; }
.rvh-chip {
  flex: 1; display: flex; align-items: center; gap: 9px;
  padding: 11px 13px; border-radius: 16px;
  background: linear-gradient(180deg, var(--rvh-panel), var(--rvh-panel2));
  border: 1px solid var(--rvh-line);
}
.rvh-chip-ic {
  width: 32px; height: 32px; flex: none; border-radius: 10px;
  display: grid; place-items: center; color: #ff9c1c;
  background: rgba(255,156,28,.16); border: 1px solid rgba(255,156,28,.3);
}
.rvh-chip-ic svg { width: 18px; height: 18px; display: block; }
.rvh-chip-ic.q { color: #54a0ff; background: rgba(84,160,255,.14); border-color: rgba(84,160,255,.3); }
.rvh-chip-t { font: 700 13px/1.15 'Baloo 2', cursive; }
.rvh-chip-s { font: 700 10.5px/1.3 'Nunito', sans-serif; color: var(--rvh-mu2); }

/* hero Arène */
.rvh-arena {
  display: block; width: 100%; text-align: left; cursor: pointer;
  color: inherit; font: inherit;
  border: 1px solid rgba(255,210,74,.35); border-radius: 24px;
  padding: 18px 18px 16px; margin-bottom: 16px;
  background:
    radial-gradient(130% 90% at 85% 10%, rgba(255,180,40,.22) 0%, transparent 55%),
    linear-gradient(160deg, #33205f 0%, var(--rvh-panel2) 55%, var(--rvh-panel) 100%);
  box-shadow: 0 18px 34px -16px rgba(0,0,0,.8), 0 0 30px -12px rgba(255,180,40,.5),
    inset 0 1px 0 rgba(255,255,255,.12);
  transition: transform .16s cubic-bezier(.23,1,.32,1);
}
.rvh-arena:active { transform: scale(.98); }
.rvh-arena-k {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 11px; border-radius: 999px; margin-bottom: 9px;
  background: rgba(255,210,74,.16); border: 1px solid rgba(255,210,74,.4);
  font: 600 10px/1 'Fredoka', sans-serif; letter-spacing: .14em;
  text-transform: uppercase; color: var(--rvh-gold-soft);
}
.rvh-arena-row { display: flex; align-items: center; gap: 14px; }
.rvh-arena-t {
  font: 800 22px/1.05 'Baloo 2', cursive;
  background: linear-gradient(180deg, #fff 0%, #fff7e0 55%, #ffd86b 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.rvh-arena-s { margin-top: 5px; font: 700 12.5px/1.4 'Nunito', sans-serif; color: var(--rvh-mu); }
.rvh-arena-badge {
  width: 72px; height: 72px; flex: none; border-radius: 50%;
  display: grid; place-items: center; color: #6a4506;
  background: radial-gradient(circle at 36% 30%, #fff7da, var(--rvh-gold) 55%, #ff9c1c);
  border: 3px solid #fff5cf;
  box-shadow: 0 6px 0 #c87d12, 0 12px 24px -8px rgba(0,0,0,.6);
}
.rvh-arena-badge svg { width: 40px; height: 40px; display: block; filter: drop-shadow(0 1px 0 rgba(255,255,255,.5)); }
.rvh-arena-cta {
  margin-top: 14px; display: flex; align-items: center; justify-content: center;
  min-height: 52px; border-radius: 16px;
  background: linear-gradient(180deg, #6fe016, #58cc02);
  box-shadow: inset 0 1.5px 0 rgba(255,255,255,.5), 0 5px 0 #3f8f02,
    0 10px 20px -6px rgba(70,163,2,.7);
  font: 800 17px/1 'Baloo 2', cursive; color: #fff;
  text-shadow: 0 2px 0 rgba(40,90,5,.55);
}

/* grille des entraînements */
.rvh-h {
  display: flex; align-items: baseline; justify-content: space-between;
  margin: 2px 2px 10px;
}
.rvh-h h2 { font: 700 15px/1 'Baloo 2', cursive; }
.rvh-h span { font: 700 11px/1 'Nunito', sans-serif; color: var(--rvh-mu2); }
.rvh-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rvh-mode {
  display: flex; flex-direction: column; gap: 8px; text-align: left;
  cursor: pointer; color: inherit; font: inherit; min-height: 128px;
  border: 1px solid var(--rvh-line); border-radius: 18px; padding: 14px;
  background: linear-gradient(180deg, var(--rvh-panel), var(--rvh-panel2));
  box-shadow: 0 12px 24px -14px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.07);
  transition: transform .16s cubic-bezier(.23,1,.32,1);
}
.rvh-mode:active { transform: scale(.97); }
.rvh-mode-ic {
  width: 38px; height: 38px; border-radius: 12px;
  display: grid; place-items: center;
}
.rvh-mode-ic svg { width: 22px; height: 22px; display: block; }
.rvh-mode.exam .rvh-mode-ic { color: #ffd24a; background: rgba(255,210,74,.15); border: 1px solid rgba(255,210,74,.35); }
.rvh-mode.fiches .rvh-mode-ic { color: #6fe016; background: rgba(111,224,22,.13); border: 1px solid rgba(111,224,22,.32); }
.rvh-mode.faute .rvh-mode-ic { color: #ff7a7a; background: rgba(255,107,107,.13); border: 1px solid rgba(255,107,107,.32); }
.rvh-mode.daily .rvh-mode-ic { color: #54a0ff; background: rgba(84,160,255,.13); border: 1px solid rgba(84,160,255,.32); }
.rvh-mode.situation .rvh-mode-ic { color: #a78bff; background: rgba(167,139,255,.13); border: 1px solid rgba(167,139,255,.32); }
.rvh-mode-t { font: 700 14.5px/1.15 'Baloo 2', cursive; }
.rvh-mode-s { font: 700 11px/1.35 'Nunito', sans-serif; color: var(--rvh-mu2); }
.rvh-mode-meta {
  margin-top: auto; display: inline-flex; align-items: center; gap: 5px;
  font: 800 10.5px/1 'Nunito', sans-serif; color: #c9b8ff;
}
.rvh-mode-meta.done { color: #b9f26e; }
.rvh-mode-meta svg { width: 12px; height: 12px; }

/* points faibles */
.rvh-weak {
  margin-top: 14px; border-radius: 18px; padding: 14px;
  background: linear-gradient(180deg, var(--rvh-panel), var(--rvh-panel2));
  border: 1px solid var(--rvh-line);
}
.rvh-weak-h { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font: 700 14px/1 'Baloo 2', cursive; }
.rvh-weak-ic { display: inline-grid; place-items: center; width: 20px; height: 20px; color: #ff9c6b; }
.rvh-weak-ic svg { width: 18px; height: 18px; display: block; }
.rvh-weak-row {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 10px 2px; border-top: 1px solid rgba(167,139,250,.10);
  background: none; border-left: 0; border-right: 0; border-bottom: 0;
  color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.rvh-weak-row:first-of-type { border-top: 0; }
.rvh-weak-name { flex: 1; font: 800 13px/1.2 'Nunito', sans-serif; }
.rvh-weak-stat { font: 700 10.5px/1 'Nunito', sans-serif; color: var(--rvh-mu2); }
.rvh-weak-go { font: 800 12px/1 'Baloo 2', cursive; color: #6fe016; }

@media (prefers-reduced-motion: reduce) {
  .rvh-arena, .rvh-mode { transition: none; }
}
</style>`;

// ─── Render ──────────────────────────────────────────────────────
function render({ streak, dailyDone, fichesLues, fichesTotal, weak }) {
  const chevr = `<svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;

  const weakRows = weak
    .map(
      (w) => `
    <button class="rvh-weak-row" data-weak>
      <span class="rvh-weak-name">${esc(w.label)}</span>
      <span class="rvh-weak-stat">${w.wrong} erreur${w.wrong > 1 ? "s" : ""} · ${Math.round(w.rate * 100)} % ratées</span>
      <span class="rvh-weak-go">Réviser →</span>
    </button>`,
    )
    .join("");

  return `${STYLE}
<div class="rvh">
  <h1 class="rvh-title">Réviser</h1>

  <div class="rvh-daily">
    <div class="rvh-chip">
      <div class="rvh-chip-ic" aria-hidden="true">${IC.flame}</div>
      <div>
        <div class="rvh-chip-t">${streak.count > 0 ? `Série : ${streak.count} jour${streak.count > 1 ? "s" : ""}` : "Lance ta série"}</div>
        <div class="rvh-chip-s">${streak.count > 0 ? (streak.isToday ? "Validée pour aujourd'hui ✓" : "Révise pour la garder !") : "1 session = 1 jour de série"}</div>
      </div>
    </div>
    <div class="rvh-chip">
      <div class="rvh-chip-ic q" aria-hidden="true">${IC.bulb}</div>
      <div>
        <div class="rvh-chip-t">Question du jour</div>
        <div class="rvh-chip-s">${dailyDone ? "Faite ✓ Reviens demain" : "30 sec · à faire"}</div>
      </div>
    </div>
  </div>

  <button class="rvh-arena" id="rvh-arena">
    <span class="rvh-arena-k">Ton arène</span>
    <div class="rvh-arena-row">
      <div style="flex:1;min-width:0">
        <div class="rvh-arena-t">Continue ton Arène</div>
        <div class="rvh-arena-s">Quiz sur tes compétences · gagne des volants</div>
      </div>
      <div class="rvh-arena-badge" aria-hidden="true">${IC.trophy}</div>
    </div>
    <div class="rvh-arena-cta">Jouer</div>
  </button>

  <div class="rvh-h"><h2>Tes entraînements</h2><span>tout est là 👇</span></div>
  <div class="rvh-modes">
    <button class="rvh-mode exam" data-go="/exam-blanc">
      <div class="rvh-mode-ic" aria-hidden="true">${IC.cap}</div>
      <div class="rvh-mode-t">Examen blanc</div>
      <div class="rvh-mode-s">40 questions · chrono · comme le vrai</div>
      <span class="rvh-mode-meta">Se tester ${chevr}</span>
    </button>
    <button class="rvh-mode fiches" data-go="/revision-conduite">
      <div class="rvh-mode-ic" aria-hidden="true">${IC.wheel}</div>
      <div class="rvh-mode-t">Fiches de conduite</div>
      <div class="rvh-mode-s">Le geste, pas que le code</div>
      <span class="rvh-mode-meta">${fichesLues}/${fichesTotal} lues ${chevr}</span>
    </button>
    <button class="rvh-mode faute" data-go="/jeu-faute">
      <div class="rvh-mode-ic" aria-hidden="true">${IC.warning}</div>
      <div class="rvh-mode-t">Trouve la faute</div>
      <div class="rvh-mode-s">Repère la faute éliminatoire</div>
      <span class="rvh-mode-meta">2 min ${chevr}</span>
    </button>
    <button class="rvh-mode situation" data-go="/en-situation">
      <div class="rvh-mode-ic" aria-hidden="true">${IC.light}</div>
      <div class="rvh-mode-t">En situation</div>
      <div class="rvh-mode-s">Une scène, une décision</div>
      <span class="rvh-mode-meta">6 situations ${chevr}</span>
    </button>
    <button class="rvh-mode daily" id="rvh-daily-tile">
      <div class="rvh-mode-ic" aria-hidden="true">${IC.bulb}</div>
      <div class="rvh-mode-t">Question du jour</div>
      <div class="rvh-mode-s">${dailyDone ? "Fait pour aujourd'hui !" : "Ta dose du jour en 30 sec"}</div>
      <span class="rvh-mode-meta ${dailyDone ? "done" : ""}" id="rvh-daily-meta">${dailyDone ? "Faite ✓" : "À faire"} ${dailyDone ? "" : chevr}</span>
    </button>
  </div>

  ${
    weak.length
      ? `
  <div class="rvh-weak">
    <div class="rvh-weak-h"><span class="rvh-weak-ic" aria-hidden="true">${IC.target}</span> Tes points faibles</div>
    ${weakRows}
  </div>`
      : ""
  }
</div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, { dailyDone }) {
  // Arène : session révision libre (même entrée que « Continue à réviser »)
  root.querySelector("#rvh-arena")?.addEventListener("click", () => {
    track("reviser.arena_open", {});
    location.hash = "#/quiz/next/post_validation/revision";
  });

  root.querySelectorAll("[data-go]").forEach((btn) =>
    btn.addEventListener("click", () => {
      track("reviser.mode_open", { mode: btn.dataset.go });
      navigate(btn.dataset.go);
    }),
  );

  // Points faibles : la révision par thème vit sur l'écran examen blanc
  root.querySelectorAll("[data-weak]").forEach((btn) =>
    btn.addEventListener("click", () => {
      track("reviser.weak_open", {});
      navigate("/exam-blanc");
    }),
  );

  // Question du jour : enrichissement async (1 fetch léger) — la tuile
  // devient un lancement direct dès que la question est choisie.
  if (!dailyDone) {
    const tile = root.querySelector("#rvh-daily-tile");
    tile?.addEventListener("click", async () => {
      try {
        const me = getCurUser();
        const [{ data: rows }, { pickDailyQuiz }] = await Promise.all([
          sb
            .from("validations")
            .select("competence_id")
            .eq("eleve_id", me.id)
            .eq("statut", "acquis"),
          import("@/services/daily-quiz.js"),
        ]);
        const validated = (rows || [])
          .map((r) => r.competence_id)
          .filter(Boolean);
        const pick = await pickDailyQuiz(me.id, validated);
        track("reviser.daily_open", {});
        if (pick?.competenceId) {
          location.hash = `#/quiz/${pick.competenceId}/post_validation/daily`;
        } else {
          // pas de question dispo → l'Arène libre reste la meilleure porte
          location.hash = "#/quiz/next/post_validation/revision";
        }
      } catch {
        location.hash = "#/quiz/next/post_validation/revision";
      }
    });
  } else {
    root.querySelector("#rvh-daily-tile")?.addEventListener("click", () => {
      location.hash = "#/quiz/next/post_validation/revision";
    });
  }
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "eleve_reviser" });

  // Données locales → rendu instantané, pas de skeleton nécessaire
  let read = {};
  try {
    read = JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    /* noop */
  }
  const fichesLues = FICHES.filter((f) => read[f.code]).length;

  const data = {
    streak: getStreak(),
    dailyDone: isDailyDone(),
    fichesLues,
    fichesTotal: FICHES.length,
    weak: getWeakPoints({ minSeen: 3, limit: 3 }),
  };

  root.innerHTML = render(data);
  wire(root, data);
}
