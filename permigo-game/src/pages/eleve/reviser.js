// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Réviser » : LA porte d'entraînement de la CONDUITE.
//
// Parti pris (validé Rayan) : Réviser = la conduite, PAS le code de la
// route. Le différenciateur PermiGo passe donc devant. Le hero est
// ADAPTATIF :
//   • par défaut → « reprends ta prochaine fiche » (violet Arène) ;
//   • si le moniteur a ciblé des compétences (table revision_focus) →
//     sa demande prend le hero (doré) et passe avant tout. Les devoirs
//     du moniteur ne s'affichent QUE là (retirés de l'accueil et de la
//     page fiches — plus de doublon).
//
// DA « Arène Néo » : nuit-violet + or, matière premium, vrais médaillons
// 3D (banque @/utils/medallions.js). Rendu local instantané ; les devoirs
// moniteur arrivent en 1 fetch léger et remplacent le hero si présents.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { getStreak } from "@/utils/game-state.js";
import { FICHES, getFiche } from "@/data/fiches-conduite.js";
import { medallion } from "@/utils/medallions.js";

const LS_READ_KEY = "rvc_read_v1"; // même clé que revision-conduite (fiches lues)

// Médaillons 3D des tuiles (1 seul style cohérent, banque centrale).
const MED = {
  fiches: medallion("fiches", "violet", { cls: "rvh-med" }),
  faute: medallion("faute", "red", { cls: "rvh-med" }),
  situ: medallion("cone", "teal", { cls: "rvh-med" }),
  examConduite: medallion("voiture", "gold", { cls: "rvh-med" }),
};

const ARROW = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;

const STYLE = `<style>
/* ── Monde de l'entraînement : Arène nuit-violet + or, full-bleed sous le header. ── */
.rvh {
  --rvh-panel:#271850; --rvh-panel2:#2f1e5e; --rvh-panel-deep:#120a2e;
  --rvh-line:rgba(178,150,255,.22);
  --rvh-mu:#cabfef; --rvh-mu2:#9b8dcf;
  --rvh-gold-1:#ffe9a8; --rvh-gold-2:#ffd24a; --rvh-gold-3:#ff9c1c; --rvh-gold-deep:#c87d12;
  --rvh-violet:#a855f7; --rvh-violet-deep:#7c4dff; --rvh-violet-soft:#cbb9ff;
  position: relative;
  margin-top: calc(-1 * (var(--th, 52px) + env(safe-area-inset-top, 0px)));
  padding: calc(var(--th, 52px) + env(safe-area-inset-top, 0px) + 12px) 15px 96px;
  min-height: 100dvh;
  max-width: 480px;
  margin-inline: auto;
  color: #fff;
  font-family: 'Nunito', system-ui, sans-serif;
  overflow: hidden;
  background:
    radial-gradient(125% 52% at 18% -6%, rgba(168,85,247,.42) 0%, transparent 55%),
    radial-gradient(115% 46% at 98% 2%, rgba(255,156,28,.16) 0%, transparent 52%),
    radial-gradient(140% 90% at 50% 118%, rgba(0,0,0,.55) 0%, transparent 60%),
    linear-gradient(178deg, #1e1240 0%, #160d30 48%, #0f0824 100%);
}
.rvh::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
  opacity: .05; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>");
}
.rvh-stars { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.rvh-stars::before, .rvh-stars::after {
  content: ""; position: absolute; top: 0; left: 0; width: 2px; height: 2px; border-radius: 50%;
}
.rvh-stars::before {
  box-shadow:
    9vw 7vh 0 0 rgba(255,231,168,.85), 24vw 3vh 0 0 rgba(255,210,74,.5),
    38vw 11vh 0 0 rgba(255,255,255,.5), 57vw 5vh 0 0 rgba(255,225,140,.55),
    73vw 9vh 0 0 rgba(255,210,74,.6), 88vw 4vh 0 0 rgba(255,255,255,.45),
    14vw 17vh 0 0 rgba(255,255,255,.4), 91vw 15vh 0 0 rgba(255,210,74,.45);
  animation: rvhTwk 5s ease-in-out infinite;
}
.rvh-stars::after {
  box-shadow:
    6vw 30vh 0 0 rgba(203,185,255,.5), 46vw 34vh 0 0 rgba(255,255,255,.3),
    80vw 28vh 0 0 rgba(255,210,74,.4), 20vw 40vh 0 0 rgba(203,185,255,.4);
  animation: rvhTwk 6.4s ease-in-out .8s infinite;
}
@keyframes rvhTwk { 0%,100%{opacity:.35} 50%{opacity:1} }

.rvh-title {
  position: relative; z-index: 3;
  font: 800 26px/1.1 'Baloo 2', cursive; letter-spacing: .2px;
  margin: 2px 2px 12px;
  text-shadow: 0 2px 0 rgba(0,0,0,.3), 0 0 22px rgba(168,85,247,.45);
}

/* ── série (statut, discret) ── */
.rvh-streak {
  position: relative; z-index: 3; display: inline-flex; align-items: center; gap: 7px;
  margin-bottom: 14px; padding: 5px 13px 5px 7px; border-radius: 999px;
  background: rgba(255,210,74,.10); border: 1px solid rgba(255,210,74,.24);
}
.rvh-streak .pg-med { width: 22px; height: 22px; }
.rvh-streak b { font: 800 12.5px/1 'Nunito', sans-serif; color: var(--rvh-gold-1); }
.rvh-streak i { font: 700 11.5px/1 'Nunito', sans-serif; font-style: normal; color: var(--rvh-mu2); }

/* ── HERO adaptatif (façon header premium : dégradé plein + panneaux + gloss) ── */
.rvh-hero {
  position: relative; z-index: 3; display: block; width: 100%; text-align: left; cursor: pointer;
  color: inherit; font: inherit; overflow: hidden;
  border: 0; border-radius: 24px; padding: 18px; margin-bottom: 16px;
  transition: transform .16s cubic-bezier(.23,1,.32,1);
}
.rvh-hero:active { transform: translateY(2px) scale(.995); }
.rvh-hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,.20), transparent 42%); pointer-events: none; }
.rvh-hero.cont {
  color: #fff;
  background: linear-gradient(150deg, #6a4bd6, #7d6bff 58%, #9a6bff);
  box-shadow: 0 20px 44px -18px rgba(124,77,255,.75), inset 0 1px 0 rgba(255,255,255,.2);
}
.rvh-hero.moni {
  color: #2a1600;
  background: linear-gradient(150deg, #ffca57, #ffb03a 55%, #ff9422);
  box-shadow: 0 20px 44px -18px rgba(255,150,20,.7), inset 0 1px 0 rgba(255,255,255,.4);
}
/* panneaux routiers en filigrane */
.rvh-sg { position: absolute; pointer-events: none; opacity: .14; }
.rvh-sg.a { width: 72px; height: 72px; right: -16px; top: -22px; border-radius: 50%; border: 9px solid #fff; }
.rvh-sg.b { width: 0; height: 0; right: 66px; bottom: -14px; border-left: 30px solid transparent; border-right: 30px solid transparent; border-bottom: 52px solid #fff; transform: rotate(15deg); opacity: .1; }
.rvh-sg.c { width: 46px; height: 46px; left: 42%; top: -24px; background: #fff; transform: rotate(45deg); opacity: .08; border-radius: 7px; }

.rvh-hero-top { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; }
.rvh-hpill { flex: 1; display: inline-flex; align-items: center; gap: 7px; font: 800 11px/1.2 'Nunito', sans-serif; letter-spacing: .05em; text-transform: uppercase; }
.rvh-hero.cont .rvh-hpill { color: #efe9ff; }
.rvh-hero.moni .rvh-hpill { color: #4a2a00; }
.rvh-hdot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.rvh-hero.cont .rvh-hdot { background: var(--rvh-gold-2); box-shadow: 0 0 8px var(--rvh-gold-2); }
.rvh-hero.moni .rvh-hdot { background: #7a3d00; }
.rvh-hbadge {
  width: 46px; height: 46px; border-radius: 14px; flex: none; display: grid; place-items: center;
  background: rgba(255,255,255,.20); border: 1px solid rgba(255,255,255,.34); box-shadow: inset 0 1px 0 rgba(255,255,255,.45);
}
.rvh-hbadge .pg-med { width: 34px; height: 34px; }

.rvh-htitles { position: relative; z-index: 2; display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin: 13px 0 5px; }
.rvh-htitle { font: 600 25px/1.05 'Baloo 2', cursive; letter-spacing: .2px; }
.rvh-hmore { font: 800 12px/1 'Nunito', sans-serif; padding: 6px 11px; border-radius: 999px; white-space: nowrap;
  background: rgba(42,22,0,.15); color: #5c3800; border: 1px solid rgba(42,22,0,.22); }
.rvh-hsub { position: relative; z-index: 2; font: 700 13px/1.4 'Nunito', sans-serif; max-width: 90%; }
.rvh-hero.cont .rvh-hsub { color: #e4dcff; }
.rvh-hero.moni .rvh-hsub { color: #5c3800; }
.rvh-hcta {
  position: relative; z-index: 2; margin-top: 16px; display: flex; align-items: center; justify-content: space-between;
  border-radius: 14px; padding: 13px 16px; font: 600 16px/1 'Baloo 2', cursive; letter-spacing: .3px;
}
.rvh-hero.cont .rvh-hcta { background: rgba(0,0,0,.24); color: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,.16); }
.rvh-hero.moni .rvh-hcta { background: #2a1600; color: var(--rvh-gold-1); box-shadow: 0 4px 0 rgba(0,0,0,.25); }
.rvh-hcta svg { width: 20px; height: 20px; }

/* ── grille des entraînements ── */
.rvh-h { position: relative; z-index: 3; margin: 4px 3px 11px; font: 800 12px/1 'Nunito', sans-serif; letter-spacing: .08em; text-transform: uppercase; color: var(--rvh-mu2); }

.rvh-modes { position: relative; z-index: 3; display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.rvh-mode {
  position: relative; display: flex; flex-direction: column; gap: 7px; text-align: left; cursor: pointer;
  color: inherit; font: inherit; min-height: 132px;
  border: 1px solid var(--rvh-line); border-left: 2px solid rgba(255,210,74,.5); border-radius: 20px; padding: 13px 13px 14px;
  background: linear-gradient(180deg, var(--rvh-panel2) 0%, var(--rvh-panel) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.09), 0 8px 0 var(--rvh-panel-deep), 0 16px 26px -14px rgba(0,0,0,.75);
  transition: transform .16s cubic-bezier(.23,1,.32,1);
}
.rvh-mode:active { transform: translateY(2px) scale(.99); }
.rvh-mode.wide { grid-column: 1 / -1; flex-direction: row; align-items: center; gap: 13px; min-height: 0; }
.rvh-mode.wide .rvh-mode-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }

.rvh-sign { width: 54px; height: 54px; flex: none; display: grid; place-items: center; }
.rvh-med { width: 54px; height: 54px; display: block; filter: drop-shadow(0 4px 6px rgba(0,0,0,.45)); }

.rvh-mode-t { font: 700 15px/1.12 'Baloo 2', cursive; }
.rvh-mode-s { font: 700 11px/1.35 'Nunito', sans-serif; color: var(--rvh-mu2); }
.rvh-mode-meta { margin-top: auto; display: inline-flex; align-items: center; gap: 5px; font: 800 11px/1 'Nunito', sans-serif; color: var(--rvh-gold-1); }
.rvh-mode.wide .rvh-mode-meta { margin-top: 2px; }
.rvh-mode-meta svg { width: 13px; height: 13px; color: var(--rvh-violet-soft); }
.rvh-mode-badge {
  position: absolute; top: 11px; right: 11px;
  font: 600 9px/1 'Fredoka', sans-serif; letter-spacing: .09em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 999px;
  color: #ffdede; background: rgba(255,107,107,.16); border: 1px solid rgba(255,107,107,.4);
  box-shadow: 0 3px 8px -3px rgba(255,107,107,.5);
}

@media (prefers-reduced-motion: reduce) {
  .rvh-hero, .rvh-mode { transition: none; }
  .rvh-stars::before, .rvh-stars::after { animation: none; }
}
</style>`;

// ─── Hero (adaptatif) ────────────────────────────────────────────
function heroHtml({ nextFiche, allRead, focuses, moniteurPrenom }) {
  // Priorité absolue : la demande du moniteur.
  if (focuses && focuses.length) {
    const f0 = focuses[0];
    const fiche = getFiche(f0.competence_code);
    const titre = fiche ? fiche.titre : f0.competence_code;
    const more = focuses.length - 1;
    const who = moniteurPrenom
      ? `Demande de ${esc(moniteurPrenom)}, ton moniteur`
      : "Demande de ton moniteur";
    const sub =
      more > 0
        ? `Commence par « ${esc(titre)} » — le reste suit juste après.`
        : "Il veut que tu maîtrises ça avant ta prochaine leçon.";
    return `<button class="rvh-hero moni" id="rvh-hero" data-fcode="${esc(f0.competence_code)}">
      <span class="rvh-sg a"></span><span class="rvh-sg b"></span><span class="rvh-sg c"></span>
      <div class="rvh-hero-top">
        <span class="rvh-hpill"><span class="rvh-hdot"></span>${who}</span>
        <span class="rvh-hbadge">${medallion("cible", "gold", { size: 34 })}</span>
      </div>
      <div class="rvh-htitles"><span class="rvh-htitle">${esc(titre)}</span>${more > 0 ? `<span class="rvh-hmore">+ ${more} autre${more > 1 ? "s" : ""}</span>` : ""}</div>
      <div class="rvh-hsub">${sub}</div>
      <div class="rvh-hcta">M'entraîner ${ARROW}</div>
    </button>`;
  }

  // Par défaut : reprendre (ou commencer) la lecture des fiches.
  const f = nextFiche;
  return `<button class="rvh-hero cont" id="rvh-hero" data-fcode="${esc(f.code)}">
    <span class="rvh-sg a"></span><span class="rvh-sg b"></span><span class="rvh-sg c"></span>
    <div class="rvh-hero-top">
      <span class="rvh-hpill"><span class="rvh-hdot"></span>${allRead ? "Bien joué" : "On reprend"}</span>
      <span class="rvh-hbadge">${medallion("fiches", "night", { size: 34 })}</span>
    </div>
    <div class="rvh-htitles"><span class="rvh-htitle">${esc(f.titre)}</span></div>
    <div class="rvh-hsub">${allRead ? "Tu as lu toutes tes fiches — relis le geste avant ta leçon." : "Ta prochaine fiche — 2 min pour réviser le geste avant ta leçon."}</div>
    <div class="rvh-hcta">${allRead ? "Relire la fiche" : "Lire la fiche"} ${ARROW}</div>
  </button>`;
}

// ─── Render ──────────────────────────────────────────────────────
function render(data) {
  const { streak, fichesLues, fichesTotal } = data;
  const streakTxt =
    streak.count > 0
      ? `${streak.count} jour${streak.count > 1 ? "s" : ""}`
      : "Nouvelle série";
  const streakSub =
    streak.count > 0
      ? streak.isToday
        ? "· validée ✓"
        : "· garde ta série"
      : "· fais-toi 2 min";

  return `${STYLE}
<div class="rvh">
  <div class="rvh-stars" aria-hidden="true"></div>

  <h1 class="rvh-title">Réviser</h1>

  <div class="rvh-streak">${medallion("flamme", "orange", { size: 22 })}<b>${streakTxt}</b><i>${streakSub}</i></div>

  ${heroHtml(data)}

  <div class="rvh-h">Tout pour t'entraîner</div>
  <div class="rvh-modes">
    <button class="rvh-mode wide" data-go="/revision-conduite">
      <span class="rvh-sign" aria-hidden="true">${MED.fiches}</span>
      <div class="rvh-mode-body">
        <div class="rvh-mode-t">Fiches de conduite</div>
        <div class="rvh-mode-s">Le geste, pas le code · avant chaque leçon</div>
        <span class="rvh-mode-meta">${fichesLues}/${fichesTotal} lues ${CHEVRON}</span>
      </div>
    </button>

    <button class="rvh-mode" data-go="/jeu-faute">
      <span class="rvh-mode-badge">Mini-jeu</span>
      <span class="rvh-sign" aria-hidden="true">${MED.faute}</span>
      <div class="rvh-mode-t">Trouve la faute</div>
      <div class="rvh-mode-s">Repère la faute éliminatoire</div>
      <span class="rvh-mode-meta">2 min ${CHEVRON}</span>
    </button>

    <button class="rvh-mode" data-go="/en-situation">
      <span class="rvh-mode-badge">Mini-jeu</span>
      <span class="rvh-sign" aria-hidden="true">${MED.situ}</span>
      <div class="rvh-mode-t">En situation</div>
      <div class="rvh-mode-s">Une scène, une décision</div>
      <span class="rvh-mode-meta">6 situations ${CHEVRON}</span>
    </button>

    <button class="rvh-mode wide" data-go="/exam-conduite">
      <span class="rvh-sign" aria-hidden="true">${MED.examConduite}</span>
      <div class="rvh-mode-body">
        <div class="rvh-mode-t">Examen de conduite</div>
        <div class="rvh-mode-s">En conditions réelles, comme le jour J</div>
        <span class="rvh-mode-meta">Se tester ${CHEVRON}</span>
      </div>
    </button>
  </div>
</div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wireHero(root) {
  const hero = root.querySelector("#rvh-hero");
  if (!hero) return;
  hero.addEventListener("click", () => {
    const code = hero.getAttribute("data-fcode");
    const moni = hero.classList.contains("moni");
    track(moni ? "reviser.focus_open" : "reviser.next_fiche", { code });
    navigate(`/revision-conduite/${code}`);
  });
}

function wire(root) {
  wireHero(root);
  root.querySelectorAll("[data-go]").forEach((btn) =>
    btn.addEventListener("click", () => {
      track("reviser.mode_open", { mode: btn.dataset.go });
      navigate(btn.dataset.go);
    }),
  );
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "eleve_reviser" });

  // Données locales → rendu instantané, pas de skeleton nécessaire.
  let read = {};
  try {
    read = JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    /* noop */
  }
  const fichesLues = FICHES.filter((f) => read[f.code]).length;
  const nextFiche = FICHES.find((f) => !read[f.code]) || FICHES[0];

  const data = {
    streak: getStreak(),
    fichesLues,
    fichesTotal: FICHES.length,
    nextFiche,
    allRead: FICHES.length > 0 && fichesLues === FICHES.length,
    focuses: [],
    moniteurPrenom: "",
  };

  root.innerHTML = render(data);
  wire(root);

  // Devoirs du moniteur (revision_focus) : 1 fetch léger. Si présents, ils
  // PRENNENT le hero (priorité absolue). C'est le SEUL endroit où ils
  // s'affichent (retirés de l'accueil + de la page fiches).
  try {
    const { data: focuses } = await sb
      .from("revision_focus")
      .select("id, competence_code, note, created_at")
      .is("done_at", null)
      .order("created_at", { ascending: false });
    if (focuses && focuses.length) {
      data.focuses = focuses;
      // Prénom du moniteur (best-effort, non bloquant : fallback « ton moniteur »).
      try {
        const { data: prof } = await sb
          .from("profiles")
          .select("enseignant_id")
          .eq("id", me.id)
          .maybeSingle();
        if (prof?.enseignant_id) {
          const { data: ens } = await sb
            .from("profiles")
            .select("prenom")
            .eq("id", prof.enseignant_id)
            .maybeSingle();
          data.moniteurPrenom = ens?.prenom || "";
        }
      } catch {
        /* prénom optionnel */
      }
      // On ne remplace que le hero (évite de re-render toute la page).
      const cur = root.querySelector("#rvh-hero");
      if (cur) {
        cur.outerHTML = heroHtml(data);
        wireHero(root);
      }
    }
  } catch {
    /* table non migrée / hors-ligne → hero par défaut, silencieux */
  }
}
