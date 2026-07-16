// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Réviser » (style streaming, maquette validée
// mockups/reviser-style-D-streaming.html — choix Rayan 2026-07-15).
//
// Structure :
//   1. Carrousel héros « Pour toi » (swipe + points) — recos RÉELLES :
//      thèmes ratés (weak-points) · devoir du moniteur (revision_focus) ·
//      repli : prochaine fiche non lue, sinon l'examen blanc.
//   2. Rangée « S'entraîner un peu chaque jour » : Arène · En situation ·
//      Quiz éclair.
//   3. Rangée « Comme le jour J » : Examen blanc de conduite · Mes fautes.
//   4. Rangée « Avant ta prochaine leçon » : fiche du moment · toutes les
//      fiches.
//
// Données 100 % réelles (repli gracieux si indisponible, jamais inventées) :
//   - Monde/étoiles   : table `validations` (eleve_id=moi) + data/remc.js + data/worlds.js
//   - Ligue Révision  : RPC get_theory_leaderboard (déjà utilisé par classement.js)
//   - Série           : utils/game-state.js getStreak() (local)
//   - Examen blanc    : quiz_attempts (type=exam_blanc, ref_id="exam-conduite")
//   - Mes fautes      : utils/weak-points.js (local — alimenté par exam-blanc.js,
//                       l'Arène, l'exam conduite, En situation, jeu-faute, fiches)
//   - Devoir ciblé    : table revision_focus (assigné par le moniteur,
//                       boucle fermée via done_at)
//   - Quiz éclair     : table flash_quizzes (sent_to=moi, non répondu, non expiré)
//   - Fiches lues     : localStorage rvc_read_v1 + data/fiches-conduite.js
//
// Wording honnête (audit 2026-07-15) : nb de questions ciblées = vrai
// compte min(12, pool du thème) ; « à revoir » = solde de fautes qui
// REDESCEND quand l'élève réussit (weak-points `left`) ; pas de barre de
// lecture sur une fiche (état binaire) ; pas de durée inventée.
// Visuels : public/art/reviser/*.png (source Figma « PermiGo — Jaquettes
// hub Réviser », SVG sources dans mockups/assets-reviser/src/).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { getStreak } from "@/utils/game-state.js";
import { SITUATIONS } from "@/data/situations-conduite.js";
import { getWeakPoints } from "@/utils/weak-points.js";
import { theoryLeague } from "@/utils/theory-league.js";
import { FICHES } from "@/data/fiches-conduite.js";
import { QUESTIONS } from "@/data/parcours-quiz.js";
import { REMC } from "@/data/remc.js";
import { WORLDS } from "@/data/worlds.js";
import { medallion } from "@/utils/medallions.js";
import { toast } from "@/components/common/toast.js";

const LS_READ_KEY = "rvc_read_v1"; // même clé que revision-conduite.js

// code fiche → titre (fiche du moment, devoir du moniteur)
const FICHE_TITRE = Object.fromEntries(FICHES.map((f) => [f.code, f.titre]));

// Seuils de déblocage des mondes — mêmes valeurs que parcours.js
// (computeWorldStates / UNLOCK_REQ). Dupliqué ici volontairement : lecture
// seule d'une petite constante, pas de dépendance vers une page.
const UNLOCK_REQ = [null, 5, 6, 6];

function ordinal(n) {
  return n === 1 ? "ʳᵉ" : "ᵉ";
}

// Nb de questions que la révision ciblée proposera VRAIMENT pour un thème
// (même règle que startThemeRevision d'exam-blanc.js : min(12, pool du tag)).
function themeQuestionCount(tag) {
  const pool = QUESTIONS.filter((q) => (q.tags || []).includes(tag)).length;
  return Math.min(12, pool);
}

// ─── Logique métier : monde REMC en cours ─────────────────────────
function computeCurrentWorld(validatedMap) {
  const states = REMC.map((cat, idx) => {
    const done = cat.subs.filter((s) => validatedMap[s.c]).length;
    const total = cat.subs.length;
    const complete = done === total;
    let status;
    if (idx === 0) {
      status = complete ? "complete" : "in_progress";
    } else {
      const prevDone = REMC[idx - 1].subs.filter(
        (s) => validatedMap[s.c],
      ).length;
      status =
        prevDone < UNLOCK_REQ[idx]
          ? "locked"
          : complete
            ? "complete"
            : "in_progress";
    }
    return { idx, world: WORLDS[idx], done, total, complete, status };
  });

  const current = states.find((s) => s.status === "in_progress");
  if (current) return { ...current, allDone: false };

  const allDone = states.every((s) => s.complete);
  if (allDone) {
    const doneAll = states.reduce((n, s) => n + s.done, 0);
    const totalAll = states.reduce((n, s) => n + s.total, 0);
    return {
      ...states[states.length - 1],
      allDone: true,
      done: doneAll,
      total: totalAll,
    };
  }
  return { ...states[0], allDone: false };
}

// ─── STYLE ─────────────────────────────────────────────────────────
const STYLE = `<style>
.rvh {
  --rvh-mu:#cabfef; --rvh-mu2:#9b8dcf;
  --rvh-line:rgba(178,150,255,.22);
  position: relative;
  margin-top: calc(-1 * (var(--th, 52px) + env(safe-area-inset-top, 0px)));
  padding: calc(var(--th, 52px) + env(safe-area-inset-top, 0px) + 12px) 0 96px;
  min-height: 100dvh;
  max-width: 480px;
  margin-left: auto; margin-right: auto;
  color: #f2f0fa;
  font-family: 'Plus Jakarta Sans','Inter',sans-serif;
  background:
    radial-gradient(140% 50% at 50% -4%, rgba(255,180,60,.08) 0%, transparent 55%),
    radial-gradient(120% 55% at 50% 24%, rgba(110,70,220,.20) 0%, transparent 62%),
    linear-gradient(180deg,#181241 0%,#0f0d24 58%,#0b0a1c 100%);
}
.rvh-stars { position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image:radial-gradient(1.4px 1.4px at 22% 6%,rgba(255,255,255,.4),transparent),radial-gradient(1.2px 1.2px at 78% 4%,rgba(255,210,120,.45),transparent),radial-gradient(1.2px 1.2px at 60% 10%,rgba(255,255,255,.28),transparent),radial-gradient(1.4px 1.4px at 12% 14%,rgba(180,160,255,.36),transparent); }
.rvh > * { position:relative; z-index:1; }

.rvh-head { display:flex; align-items:center; justify-content:space-between; padding:6px 18px 10px; }
.rvh-title { font:800 26px/1.1 'Plus Jakarta Sans',sans-serif; margin:0; }
.rvh-streak { display:flex; align-items:center; gap:6px; font:700 12px 'Plus Jakarta Sans',sans-serif; color:#ffd76e;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,200,90,.25); border-radius:999px; padding:6px 11px; }
.rvh-streak i { font-style:normal; font-weight:600; color:var(--rvh-mu2); }

/* ── Carrousel héros « Pour toi » ── */
.rvh-heros { display:flex; overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:none; gap:10px; padding:2px 16px; }
.rvh-heros::-webkit-scrollbar { display:none; }
.rvh-hero { flex:0 0 100%; scroll-snap-align:center; scroll-snap-stop:always; border-radius:20px; overflow:hidden;
  position:relative; padding:64px 16px 14px; border:0; text-align:left; cursor:pointer; color:#fff;
  font-family:inherit; box-shadow:0 10px 24px rgba(0,0,0,.35); }
.rvh-hero:active { transform:scale(.99); }
.rvh-hero-k { position:absolute; top:12px; left:12px; font:800 10px 'Plus Jakarta Sans',sans-serif; letter-spacing:.1em;
  background:rgba(0,0,0,.4); border-radius:6px; padding:5px 8px; }
.rvh-hero img { position:absolute; top:8px; right:10px; width:76px; height:76px; filter:drop-shadow(0 8px 14px rgba(0,0,0,.5)); }
.rvh-hero-t { font:800 20px/1.2 'Plus Jakarta Sans',sans-serif; display:block; padding-right:74px; }
.rvh-hero-s { font:500 12.5px/1.45 'Inter',sans-serif; color:rgba(255,255,255,.85); margin:3px 0 10px; }
.rvh-hero-bar { height:4px; border-radius:99px; background:rgba(255,255,255,.25); margin-bottom:10px; }
.rvh-hero-bar i { display:block; height:100%; border-radius:99px; background:#fff; }
.rvh-hero-st { font:700 11px 'Plus Jakarta Sans',sans-serif; color:#8ef0b0; margin:0 0 10px; }
.rvh-hero-cta { display:inline-block; background:#fff; color:#12101f; font:700 13px 'Plus Jakarta Sans',sans-serif; border-radius:10px; padding:9px 16px; }
.rvh-hero--faute { background:linear-gradient(200deg,#e6394f 0%,#7a1030 55%,#3a0817 100%); }
.rvh-hero--conso { background:linear-gradient(200deg,#8b5cf6 0%,#3e1a92 55%,#1c0b4a 100%); }
.rvh-hero--fiche { background:linear-gradient(200deg,#2fae7d 0%,#0d5c3d 55%,#06301f 100%); }
.rvh-hero--exam { background:linear-gradient(200deg,#f0a93f 0%,#a35400 55%,#4a2500 100%); }
.rvh-dots { display:flex; justify-content:center; gap:6px; padding:10px 0 0; }
.rvh-dots i { width:6px; height:6px; border-radius:50%; background:#3a3663; transition:all .25s; }
.rvh-dots i.on { background:#fff; width:18px; border-radius:99px; }

/* ── Rangées de jaquettes ── */
.rvh-rowt { margin:18px 18px 8px; font:700 14.5px 'Plus Jakarta Sans',sans-serif; display:flex; justify-content:space-between; align-items:baseline; }
.rvh-rowt span { font:600 11px 'Inter',sans-serif; color:var(--rvh-mu2); }
.rvh-scroller { display:flex; gap:10px; overflow-x:auto; scroll-snap-type:x mandatory; padding:2px 16px 8px; scrollbar-width:none; }
.rvh-scroller::-webkit-scrollbar { display:none; }
.rvh-jaq { flex:0 0 138px; scroll-snap-align:start; border-radius:14px; padding:12px 11px 10px; min-height:152px;
  display:flex; flex-direction:column; position:relative; border:0; text-align:left; cursor:pointer; color:#fff;
  font-family:inherit; box-shadow:0 8px 18px rgba(0,0,0,.35); transition:transform .15s; }
.rvh-jaq:active { transform:scale(.97); }
.rvh-jaq--lg { flex-basis:178px; }
.rvh-jaq img { width:56px; height:56px; margin-bottom:auto; filter:drop-shadow(0 5px 8px rgba(0,0,0,.4)); }
.rvh-jaq b { font:700 14px/1.15 'Plus Jakarta Sans',sans-serif; }
.rvh-jaq p { font:500 10.5px/1.3 'Inter',sans-serif; color:rgba(255,255,255,.78); margin:3px 0 0; }
.rvh-jaq-m { margin-top:7px; font:700 10px 'Plus Jakarta Sans',sans-serif; background:rgba(0,0,0,.32); border-radius:99px; padding:3px 8px; align-self:flex-start; }
.rvh-jaq-dot { position:absolute; top:9px; right:9px; background:#ff5a6e; font:800 11px 'Plus Jakarta Sans',sans-serif; border-radius:99px; padding:2px 7px; }

/* Skeleton */
.rvh-skel { border-radius:16px; background:rgba(255,255,255,.06); animation:rvhPulse 1.2s ease-in-out infinite; margin:0 16px 10px; }
.rvh-skel-hero { height:190px; }
.rvh-skel-row { height:152px; }
@keyframes rvhPulse { 0%,100% { opacity:.5; } 50% { opacity:1; } }

@media (prefers-reduced-motion: reduce) {
  .rvh-skel { animation:none; }
  .rvh-jaq, .rvh-hero, .rvh-dots i { transition:none; }
}
</style>`;

// ─── Skeleton ────────────────────────────────────────────────────
function skeletonHtml() {
  return `${STYLE}
<div class="rvh">
  <div class="rvh-stars" aria-hidden="true"></div>
  <div class="rvh-head"><h1 class="rvh-title">Réviser</h1></div>
  <div class="rvh-skel rvh-skel-hero"></div>
  <div class="rvh-skel rvh-skel-row"></div>
  <div class="rvh-skel rvh-skel-row"></div>
</div>`;
}

// ─── Carrousel héros « Pour toi » — recos réelles ────────────────
// Construit jusqu'à 3 slides : thèmes ratés → devoir du moniteur → repli
// (prochaine fiche non lue, sinon l'examen blanc).
function buildHeroSlides({ weakPoints, devoir, nextFiche, examBest }) {
  const slides = [];

  weakPoints.slice(0, 2).forEach((w, i) => {
    const pct = Math.round(w.rate * 100);
    const nQ = themeQuestionCount(w.tag);
    // « à consolider » quand le thème est en voie d'être maîtrisé (< 30 % de ratés)
    const conso = i > 0 || pct < 30;
    slides.push({
      kind: "faute",
      cls: conso ? "rvh-hero--conso" : "rvh-hero--faute",
      kicker: conso
        ? "POUR TOI · À CONSOLIDER"
        : "POUR TOI · D'APRÈS TES FAUTES",
      img: w.tag === "signalisation" ? "panneau" : "cible",
      title: `${w.label} : ${w.left} faute${w.left > 1 ? "s" : ""} à effacer`,
      sub: `Tu rates ${pct} % sur ce thème · ${nQ} questions ciblées`,
      bar: 100 - pct, // maîtrise réelle du thème
      cta: "Corriger maintenant",
      route: `/exam-blanc/t-${w.tag}`,
      aria: `Corriger tes fautes sur ${w.label}`,
    });
  });

  if (devoir) {
    const titre = FICHE_TITRE[devoir.competence_code] || devoir.competence_code;
    slides.push({
      kind: "devoir",
      cls: "rvh-hero--fiche",
      kicker: "DE TON MONITEUR",
      img: "livre",
      title: `Fiche « ${titre} » à lire`,
      sub: devoir.note
        ? `« ${devoir.note} »`
        : "Il te l'a assignée — le geste, pas le code.",
      state: "● Pas encore fait",
      cta: "Lire la fiche",
      route: `/revision-conduite/${devoir.competence_code}`,
      aria: `Lire la fiche ${titre} assignée par ton moniteur`,
    });
  }

  if (!slides.length && nextFiche) {
    slides.push({
      kind: "fiche",
      cls: "rvh-hero--fiche",
      kicker: "À DÉCOUVRIR",
      img: "livre",
      title: `Fiche « ${nextFiche.titre} »`,
      sub: "Ta prochaine fiche de conduite — le geste, pas le code.",
      state: "● Pas encore lue",
      cta: "Lire la fiche",
      route: `/revision-conduite/${nextFiche.code}`,
      aria: `Lire la fiche ${nextFiche.titre}`,
    });
  }

  if (!slides.length) {
    slides.push({
      kind: "exam",
      cls: "rvh-hero--exam",
      kicker: "COMME LE JOUR J",
      img: "toque",
      title: "Examen blanc de conduite",
      sub: "8 phases, noté sur 31, fautes éliminatoires — comme le vrai.",
      state:
        examBest != null ? `● Ton meilleur : ${examBest} %` : "● Jamais tenté",
      cta: "Se tester",
      route: "/exam-conduite",
      aria: "Passer l'examen blanc de conduite",
    });
  }

  return slides;
}

function heroHtml(slides) {
  const cards = slides
    .map(
      (s, i) => `
    <button class="rvh-hero ${s.cls}" data-hero="${i}" aria-label="${escAttr(s.aria)}">
      <span class="rvh-hero-k">${esc(s.kicker)}</span>
      <img src="/art/reviser/${s.img}.png" alt="" aria-hidden="true">
      <span class="rvh-hero-t">${esc(s.title)}</span>
      <div class="rvh-hero-s">${esc(s.sub)}</div>
      ${s.bar != null ? `<div class="rvh-hero-bar" aria-hidden="true"><i style="width:${s.bar}%"></i></div>` : ""}
      ${s.state ? `<div class="rvh-hero-st">${esc(s.state)}</div>` : ""}
      <span class="rvh-hero-cta">▶ ${esc(s.cta)}</span>
    </button>`,
    )
    .join("");

  const dots =
    slides.length > 1
      ? `<div class="rvh-dots" id="rvh-dots" aria-hidden="true">${slides.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div>`
      : "";

  return `<div class="rvh-heros" id="rvh-heros">${cards}</div>${dots}`;
}

// ─── Render ──────────────────────────────────────────────────────
function render(data) {
  const {
    streak,
    world,
    ligue,
    fichesLues,
    fichesTotal,
    examBest,
    weakPoints,
    weakCount,
    flash,
    slides,
    devoir,
    nextFiche,
  } = data;

  const streakTxt =
    streak.count > 0
      ? `Série : ${streak.count} jour${streak.count > 1 ? "s" : ""}`
      : "Série : nouvelle";

  // Arène — étoiles réelles (compétences validées par le moniteur) + ligue
  const arenaMeta =
    world && world.total > 0 ? `${world.done}/${world.total} ★` : "Découvrir";
  const arenaSub = world?.allDone
    ? "Tous les mondes terminés — reviens quand tu veux."
    : "La théorie, monde par monde.";
  const ligueMeta =
    ligue && ligue.classed
      ? `Ligue ${ligue.tier.league?.name || "Novice"} · ${ligue.rank}${ordinal(ligue.rank)} sur ${ligue.total}`
      : null;

  const weakSub = weakPoints.length
    ? `${weakPoints
        .slice(0, 2)
        .map((w) => w.label)
        .join(", ")} — rejoue-les.`
    : "Repère tes points faibles au fil des quiz.";

  // Fiche du moment : devoir du moniteur, sinon prochaine non lue
  const ficheDuMoment = devoir
    ? {
        titre: FICHE_TITRE[devoir.competence_code] || devoir.competence_code,
        sub: "Assignée par ton moniteur.",
        meta: "À lire",
        code: devoir.competence_code,
      }
    : nextFiche
      ? {
          titre: nextFiche.titre,
          sub: "Ta prochaine fiche — le geste, pas le code.",
          meta: "À lire",
          code: nextFiche.code,
        }
      : null;

  return `${STYLE}
<div class="rvh">
  <div class="rvh-stars" aria-hidden="true"></div>

  <div class="rvh-head">
    <h1 class="rvh-title">Réviser</h1>
    <div class="rvh-streak">${medallion("flamme", "orange", { size: 18 })}${esc(streakTxt)}</div>
  </div>

  ${heroHtml(slides)}

  <div class="rvh-rowt">S'entraîner un peu chaque jour <span>3 modes</span></div>
  <div class="rvh-scroller">
    <button class="rvh-jaq" id="rvh-arena" style="background:linear-gradient(200deg,#6d5df0,#33249c);" aria-label="${escAttr(`L'Arène — la théorie monde par monde (${arenaMeta})`)}">
      <img src="/art/reviser/epees.png" alt="" aria-hidden="true">
      <b>L'Arène</b>
      <p>${esc(arenaSub)}</p>
      <span class="rvh-jaq-m">${esc(arenaMeta)}${ligueMeta ? ` · ${esc(ligueMeta)}` : ""}</span>
    </button>
    <button class="rvh-jaq" id="rvh-row-situation" style="background:linear-gradient(200deg,#3f8fe8,#173f92);" aria-label="En situation — une scène réelle, une décision">
      <img src="/art/reviser/voiture.png" alt="" aria-hidden="true">
      <b>En situation</b>
      <p>3 min ? Une scène, une décision.</p>
      <span class="rvh-jaq-m">${SITUATIONS.length} scènes · Jouer</span>
    </button>
    <button class="rvh-jaq" id="rvh-row-flash" style="background:linear-gradient(200deg,#8b5cf6,#471bb0);" aria-label="Quiz éclair — le défi de ton moniteur">
      ${flash ? `<span class="rvh-jaq-dot">1</span>` : ""}
      <img src="/art/reviser/eclair.png" alt="" aria-hidden="true">
      <b>Quiz éclair</b>
      <p>Le défi de ton moniteur.</p>
      <span class="rvh-jaq-m">${flash ? `1 en attente · ${flash.minsLeft} min` : "Aucun en attente"}</span>
    </button>
  </div>

  <div class="rvh-rowt">Comme le jour J <span>se tester</span></div>
  <div class="rvh-scroller">
    <button class="rvh-jaq rvh-jaq--lg" id="rvh-row-exam" style="background:linear-gradient(200deg,#f0a93f,#a35400);" aria-label="Examen blanc de conduite — l'épreuve phase par phase, comme le jour J">
      <img src="/art/reviser/toque.png" alt="" aria-hidden="true">
      <b>Examen blanc de conduite</b>
      <p>8 phases, noté /31, fautes éliminatoires.</p>
      <span class="rvh-jaq-m">${examBest != null ? `Meilleur : ${examBest} %` : "Découvrir"}</span>
    </button>
    <button class="rvh-jaq" id="rvh-row-fautes" style="background:linear-gradient(200deg,#e6394f,#6d0e22);" aria-label="Mes fautes à revoir">
      ${weakCount > 0 ? `<span class="rvh-jaq-dot">${weakCount}</span>` : ""}
      <img src="/art/reviser/cible.png" alt="" aria-hidden="true">
      <b>Mes fautes</b>
      <p>${esc(weakSub)}</p>
      <span class="rvh-jaq-m">${weakCount > 0 ? `${weakCount} à revoir` : "Repérer"}</span>
    </button>
  </div>

  <div class="rvh-rowt">Avant ta prochaine leçon <span>fiches de conduite</span></div>
  <div class="rvh-scroller">
    ${
      ficheDuMoment
        ? `<button class="rvh-jaq rvh-jaq--lg" id="rvh-row-fiche-moment" data-code="${escAttr(ficheDuMoment.code)}" style="background:linear-gradient(200deg,#2fae7d,#0a4d33);" aria-label="${escAttr(`Lire la fiche ${ficheDuMoment.titre}`)}">
      <img src="/art/reviser/livre.png" alt="" aria-hidden="true">
      <b>Fiche « ${esc(ficheDuMoment.titre)} »</b>
      <p>${esc(ficheDuMoment.sub)}</p>
      <span class="rvh-jaq-m">${esc(ficheDuMoment.meta)}</span>
    </button>`
        : ""
    }
    <button class="rvh-jaq" id="rvh-row-fiches" style="background:linear-gradient(200deg,#26907f,#0c3f38);" aria-label="Toutes les fiches de conduite">
      <img src="/art/reviser/classeur.png" alt="" aria-hidden="true">
      <b>Toutes les fiches</b>
      <p>Le geste, pas le code.</p>
      <span class="rvh-jaq-m">${fichesLues}/${fichesTotal} lues</span>
    </button>
  </div>
</div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, data) {
  // Carrousel héros : navigation au tap + points synchronisés sur le swipe
  const car = root.querySelector("#rvh-heros");
  const dots = [...(root.querySelector("#rvh-dots")?.children || [])];
  if (car && dots.length) {
    car.addEventListener(
      "scroll",
      () => {
        const i = Math.round(car.scrollLeft / car.clientWidth);
        dots.forEach((d, j) => d.classList.toggle("on", j === i));
      },
      { passive: true },
    );
  }
  root.querySelectorAll("[data-hero]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = data.slides[parseInt(btn.dataset.hero, 10)];
      if (!s) return;
      haptic("tap");
      track("reviser.hero_open", { kind: s.kind });
      navigate(s.route);
    });
  });

  root.querySelector("#rvh-arena")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.arena_play", { world: (data.world?.idx ?? 0) + 1 });
    navigate("/parcours");
  });

  root.querySelector("#rvh-row-exam")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.mode_open", { mode: "exam-conduite" });
    navigate("/exam-conduite");
  });

  root.querySelector("#rvh-row-situation")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.mode_open", { mode: "en-situation" });
    navigate("/en-situation");
  });

  root.querySelector("#rvh-row-fautes")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.mode_open", { mode: "mes-fautes" });
    navigate("/exam-blanc/mes-fautes");
  });

  root.querySelector("#rvh-row-fiches")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.mode_open", { mode: "revision-conduite" });
    navigate("/revision-conduite");
  });

  root
    .querySelector("#rvh-row-fiche-moment")
    ?.addEventListener("click", (e) => {
      haptic("tap");
      track("reviser.mode_open", { mode: "fiche-moment" });
      navigate(`/revision-conduite/${e.currentTarget.dataset.code}`);
    });

  root.querySelector("#rvh-row-flash")?.addEventListener("click", () => {
    haptic("tap");
    if (data.flash) {
      track("reviser.mode_open", { mode: "flash-quiz" });
      navigate(`/flash-quiz/${data.flash.id}`);
    } else {
      toast("Pas de quiz éclair pour l'instant.", "info", 3000);
    }
  });
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "eleve_reviser" });

  root.innerHTML = skeletonHtml();

  // Fiches lues (local, instantané)
  let read = {};
  try {
    read = JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    /* noop */
  }
  const fichesLues = FICHES.filter((f) => read[f.code]).length;
  const nextFiche = FICHES.find((f) => !read[f.code]) || null;

  // Mes fautes (local — solde « à revoir » qui redescend quand on réussit)
  const weakPoints = getWeakPoints({ minSeen: 3, limit: 3 });
  const weakCount = getWeakPoints({ minSeen: 3, limit: 50 }).reduce(
    (n, w) => n + w.left,
    0,
  );

  const [valRes, examRes, flashRes, ligueRes, devoirRes] =
    await Promise.allSettled([
      sb
        .from("validations")
        .select("competence_id, statut")
        .eq("eleve_id", me.id),
      sb
        .from("quiz_attempts")
        .select("score, ref_id")
        .eq("user_id", me.id)
        .eq("type", "exam_blanc"),
      sb
        .from("flash_quizzes")
        .select("id, expires_at, sent_at")
        .eq("sent_to", me.id)
        .is("responded_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("sent_at", { ascending: false })
        .limit(1),
      sb.rpc("get_theory_leaderboard", { p_scope: "ecole", p_limit: 50 }),
      sb
        .from("revision_focus")
        .select("id, competence_code, note, created_at")
        .eq("eleve_id", me.id)
        .is("done_at", null)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  // Monde REMC en cours + étoiles
  let world = null;
  if (valRes.status === "fulfilled" && !valRes.value.error) {
    const validatedMap = {};
    for (const v of valRes.value.data || []) {
      if (v.statut === "acquis") validatedMap[v.competence_id] = true;
    }
    world = computeCurrentWorld(validatedMap);
  }

  // Meilleur score de l'examen blanc de CONDUITE (exam-conduite.js écrit
  // quiz_attempts type 'exam_blanc' / ref_id 'exam-conduite', score en %).
  let examBest = null;
  if (examRes.status === "fulfilled" && !examRes.value.error) {
    const attempts = (examRes.value.data || []).filter(
      (a) => a.ref_id === "exam-conduite" && typeof a.score === "number",
    );
    if (attempts.length) {
      examBest = Math.max(...attempts.map((a) => a.score));
    }
  }

  // Quiz éclair en attente
  let flash = null;
  if (
    flashRes.status === "fulfilled" &&
    !flashRes.value.error &&
    flashRes.value.data?.length
  ) {
    const row = flashRes.value.data[0];
    const minsLeft = Math.max(
      1,
      Math.round((new Date(row.expires_at).getTime() - Date.now()) / 60000),
    );
    flash = { id: row.id, minsLeft };
  }

  // Ligue Révision (école, à vie) — repli gracieux : méta masquée si non classé.
  let ligue = null;
  if (
    ligueRes.status === "fulfilled" &&
    !ligueRes.value.error &&
    Array.isArray(ligueRes.value.data)
  ) {
    const rows = ligueRes.value.data;
    const mine = rows.find((r) => r.is_me === true) || null;
    const total = rows.filter((r) => (r.score ?? 0) > 0).length;
    const classed = !!mine && (mine.score ?? 0) > 0;
    if (classed) {
      ligue = {
        classed: true,
        rank: mine.rang,
        total,
        score: mine.score,
        tier: theoryLeague(mine.score),
      };
    }
  }

  // Devoir du moniteur en attente (revision_focus, boucle fermée via done_at)
  let devoir = null;
  if (
    devoirRes.status === "fulfilled" &&
    !devoirRes.value.error &&
    devoirRes.value.data?.length
  ) {
    devoir = devoirRes.value.data[0];
  }

  const slides = buildHeroSlides({ weakPoints, devoir, nextFiche, examBest });

  const data = {
    streak: getStreak(),
    world,
    ligue,
    fichesLues,
    fichesTotal: FICHES.length,
    examBest,
    weakPoints,
    weakCount,
    flash,
    slides,
    devoir,
    nextFiche,
  };

  root.innerHTML = render(data);
  wire(root, data);
}
