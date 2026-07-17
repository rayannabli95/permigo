// « En situation » — mini-jeu élève : une scène routière isométrique, une
// décision à prendre selon le code de la route. Manche de 6 situations,
// feedback immédiat, volants à la clé (plafond quotidien pour l'économie).
// Données : src/data/situations-conduite.js · rendu : situation-scene.js.

import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { medallion } from "@/utils/medallions.js";
import {
  pickSession,
  situationDuJour,
  THEME_LABELS,
  THEME_WEAK_TAGS,
  SITUATIONS,
} from "@/data/situations-conduite.js";
import { SITU_I18N, THEME_I18N, SITU_UI } from "@/data/situations-i18n.js";
import { getLang } from "@/utils/lang.js";
import { recordAnswer } from "@/utils/weak-points.js";
import { getScenesVues, marquerSceneVue } from "@/utils/situations-vues.js";
import {
  renderSituationScene,
  buildFocusFX,
  actorScreenDelta,
} from "@/components/eleve/situation-scene.js";
import { addGemmes } from "@/utils/game-state.js";
import { volantImg, volantLabel } from "@/utils/volant.js";
import {
  playCorrect,
  playWrong,
  playWhoosh,
  playVictory,
  playSuccess,
} from "@/utils/sound.js";
import { haptic } from "@/utils/haptic.js";
import { burstConfetti } from "@/components/common/confetti.js";

// Emoji d'action des réponses (data/situations-conduite.js) → mini-médaillon 3D.
// On ne touche pas la donnée : on traduit l'emoji au rendu. Emoji inconnu →
// on garde l'emoji brut (jamais de trou).
const REP_MED = {
  "✋": ["bouclier", "teal"], // je cède / je laisse passer
  "🛑": ["panneau", "red"], // je m'arrête
  "⚡": ["eclair", "orange"], // j'accélère
  "🐢": ["horloge", "blue"], // je ralentis
  "👀": ["cible", "violet"], // je regarde / j'observe
  "📢": ["megaphone", "orange"], // je klaxonne
};
function repIco(emoji, size = 24) {
  const m = REP_MED[(emoji || "").trim()];
  return m ? medallion(m[0], m[1], { size }) : emoji;
}

const ROUND_SIZE = 6;
const INTRO_SIZE = 3; // manche courte de l'accroche post-onboarding
const VOLANTS_PAR_BONNE = 2;
const PLAFOND_JOUR = 24; // volants max gagnés par jour sur ce jeu
const LS_JOUR = "pg-sit-volants"; // { day: 'YYYY-MM-DD', total: n }

let _timers = [];
let _onHash = null;

function later(fn, ms) {
  _timers.push(setTimeout(fn, ms));
}
function clearTimers() {
  _timers.forEach(clearTimeout);
  _timers = [];
}

export async function mount(root, param) {
  const me = getCurUser();
  if (!me) return;
  // Mode « intro » : accroche jouée juste après l'onboarding (manche courte,
  // sortie vers l'accueil au lieu de « Rejouer »). Déclenché par le param de
  // route "en-situation/intro" ou par un mount direct depuis l'onboarding.
  const isIntro = param === "intro";
  // Mode « jour » : arrivée depuis la carte « Scène du jour » de l'accueil.
  // On saute l'intro (la carte a déjà promis « Je décide ») et la manche
  // démarre par la scène du jour.
  const isJour = param === "jour";
  track("page.view", { page: "en-situation", intro: isIntro, jour: isJour });

  // Plein écran arène : header + nav masqués (filet : restauré au hashchange)
  document.body.classList.add("sit-immersive");
  _onHash = () => document.body.classList.remove("sit-immersive");
  window.addEventListener("hashchange", _onHash);

  root.innerHTML = `${STYLE}<div class="page-sit anim-slide-up"><div id="sit-stage"></div></div>`;
  const stage = root.querySelector("#sit-stage");

  // état de manche (closure)
  let session = [];
  let idx = 0;
  let bonnes = 0;
  let manquees = []; // situations ratées (pour le récap)
  let answered = false;

  // ── i18n : rendu traduit + français gardé dessous (arabe RTL par span) ──
  const lang = getLang();
  const rtl = lang === "ar";
  const sBi = (fr, tr) =>
    lang === "fr" || !tr
      ? esc(fr)
      : `<span class="sit-tr"${rtl ? ' dir="rtl" lang="ar"' : ""}>${esc(tr)}</span><span class="sit-fr" lang="fr">${esc(fr)}</span>`;
  const sT1 = (fr, tr) => esc(lang !== "fr" && tr ? tr : fr);
  const sUI = (key, fr) => sT1(fr, SITU_UI[lang]?.[key]);
  const sScene = (id) => (lang !== "fr" ? SITU_I18N[id]?.[lang] : null);
  const sTheme = (theme) => (lang !== "fr" ? THEME_I18N[lang]?.[theme] : null);

  if (isJour) startRound();
  else renderIntro();

  // ── Écran d'intro ────────────────────────────────────────────
  function renderIntro() {
    clearTimers();
    const demo =
      SITUATIONS.find((s) => s.id === "prio-droite-cible") || SITUATIONS[0];
    const count = isIntro ? INTRO_SIZE : ROUND_SIZE;
    stage.innerHTML = `
      <div class="sit-top">
        <button class="sit-x" id="sit-quit" type="button" aria-label="${isIntro ? "Passer" : "Quitter le jeu"}">✕</button>
      </div>
      <div class="sit-intro">
        <div class="sit-kicker">${isIntro ? "Avant de démarrer" : "Mini-jeu"}</div>
        <h1 class="sit-h1">${isIntro ? "Mise en situation" : "En situation"}</h1>
        <p class="sit-sub">${
          isIntro
            ? "Une scène, une décision. Montre ton flair pour la route."
            : "Une scène, une décision. Applique le code de la route."
        }</p>
        <div class="sit-hero" aria-hidden="true">${renderSituationScene(demo.scene)}</div>
        <div class="sit-chips">
          <span class="sit-chip">${medallion("voiture", "blue", { size: 18 })} ${count} situations</span>
          <span class="sit-chip">${volantImg(14)} +${VOLANTS_PAR_BONNE} par bonne réponse</span>
        </div>
        <button class="sit-cta" id="sit-start" type="button">${isIntro ? "C’est parti !" : "Jouer"}</button>
      </div>`;
    stage.querySelector("#sit-quit").addEventListener("click", quit);
    stage.querySelector("#sit-start").addEventListener("click", () => {
      haptic("tap");
      startRound();
    });
  }

  // ── Manche ───────────────────────────────────────────────────
  function startRound() {
    session = pickSession(
      isIntro ? INTRO_SIZE : ROUND_SIZE,
      getScenesVues(me.id),
    );
    if (isJour) {
      const daily = situationDuJour();
      session = [daily, ...session.filter((s) => s.id !== daily.id)].slice(
        0,
        ROUND_SIZE,
      );
    }
    idx = 0;
    bonnes = 0;
    manquees = [];
    track("situation.started", { count: session.length });
    renderStep();
  }

  function renderStep() {
    clearTimers();
    answered = false;
    const s = session[idx];
    const tappable =
      s.mode === "cible" ? s.reponses.map((r) => r.veh).filter(Boolean) : [];
    const pct = Math.round((idx / session.length) * 100);

    stage.innerHTML = `
      <div class="sit-top">
        <button class="sit-x" id="sit-quit" type="button" aria-label="Quitter le jeu">✕</button>
        <div class="sit-prog" role="progressbar" aria-valuemin="1" aria-valuemax="${session.length}"
             aria-valuenow="${idx + 1}" aria-label="Situation ${idx + 1} sur ${session.length}"><i style="width:${pct}%"></i></div>
        <span class="sit-count">${idx + 1}/${session.length}</span>
        <span class="sit-coin" aria-label="Volants gagnés : ${bonnes * VOLANTS_PAR_BONNE}">${volantImg(14)} +${bonnes * VOLANTS_PAR_BONNE}</span>
      </div>
      <div class="sit-scene">${renderSituationScene(s.scene, { alt: s.alt, tappable })}</div>
      <div class="sit-qwrap">
        <div class="sit-kicker">${sT1(THEME_LABELS[s.theme] || "Code de la route", sTheme(s.theme))}</div>
        <h2 class="sit-q" tabindex="-1">${sBi(s.question, sScene(s.id)?.q)}</h2>
      </div>
      <div class="sit-cards" data-mode="${s.mode}">
        ${s.reponses
          .map(
            (r) => `
          <button class="sit-card" type="button" data-rep="${esc(r.id)}">
            ${r.ico ? `<span class="sit-card-ico" aria-hidden="true">${repIco(r.ico, 26)}</span>` : ""}
            <span>${sBi(r.label, sScene(s.id)?.r?.[r.id])}</span>
          </button>`,
          )
          .join("")}
      </div>
      <div class="sit-feedback" id="sit-feedback"></div>`;

    stage.querySelector(".sit-q")?.focus({ preventScroll: true });
    stage.querySelector("#sit-quit").addEventListener("click", quit);
    stage.querySelectorAll(".sit-card").forEach((btn) => {
      btn.addEventListener("click", () => onAnswer(btn.dataset.rep));
    });
    // mode cible : on peut aussi taper le véhicule dans la scène
    if (tappable.length) {
      stage.querySelector(".sit-scene svg")?.addEventListener("click", (e) => {
        const hit = e.target.closest?.("[data-hit]");
        if (!hit) return;
        const rep = s.reponses.find((r) => r.veh === hit.dataset.hit);
        if (rep) onAnswer(rep.id);
      });
    }
  }

  function onAnswer(repId) {
    if (answered) return;
    answered = true;
    const s = session[idx];
    const ok = repId === s.bonne;
    // Nourrit « Mes fautes » (hub Réviser) + la collection de scènes vues
    recordAnswer(THEME_WEAK_TAGS[s.theme], ok);
    marquerSceneVue(me.id, s.id);
    track("situation.answered", {
      situation_id: s.id,
      theme: s.theme,
      correct: ok,
      mode: s.mode,
    });

    // état visuel des cartes
    stage.querySelectorAll(".sit-card").forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.rep === s.bonne) btn.classList.add("ok");
      else if (btn.dataset.rep === repId) btn.classList.add("miss");
      else btn.classList.add("fade");
    });

    const svg = stage.querySelector(".sit-scene svg");
    if (ok) {
      bonnes++;
      playCorrect();
      haptic("success");
      const chip = stage.querySelector(".sit-coin");
      if (chip) {
        chip.innerHTML = `${volantImg(14)} +${bonnes * VOLANTS_PAR_BONNE}`;
        chip.setAttribute(
          "aria-label",
          `Volants gagnés : ${bonnes * VOLANTS_PAR_BONNE}`,
        );
      }
      // la scène se joue : chacun part dans l'ordre de la règle
      const steps = s.okAnim || [{ veh: "moi" }];
      for (const st of steps) {
        later(() => {
          const el = svg?.querySelector(
            st.veh === "pieton"
              ? '[data-actor="pieton"]'
              : `[data-veh="${st.veh}"]`,
          );
          if (!el) return;
          if (st.clign === "warning")
            el.classList.add("clign-droit", "clign-gauche");
          else if (st.clign) el.classList.add(`clign-${st.clign}`);
          // avance: 0 → l'acteur clignote sans bouger (ex. feux de détresse)
          const tiles = st.avance ?? (st.veh === "pieton" ? 2.4 : 3.6);
          if (tiles > 0) {
            const { dx, dy } = actorScreenDelta(s.scene, st.veh, tiles);
            el.style.transform = `translate(${dx}px, ${dy}px)`;
          }
        }, st.delai || 60);
      }
    } else {
      manquees.push(s);
      playWrong();
      haptic("warning");
      // montrer visuellement QUI est prioritaire
      const fx = svg?.querySelector(".sit-fx");
      if (fx && s.focus) fx.innerHTML = buildFocusFX(s.scene, s.focus);
    }

    const last = idx >= session.length - 1;
    const fb = stage.querySelector("#sit-feedback");
    fb.innerHTML = `
      <div aria-live="polite">
        <div class="sit-expl ${ok ? "good" : "bad"}">
          <div class="sit-expl-t">${ok ? sUI("good", "Bien vu !") : sUI("rule", "La règle à retenir")}</div>
          <p class="sit-expl-p">${sBi(s.explication, sScene(s.id)?.e)}</p>
        </div>
      </div>
      <button class="sit-cta" id="sit-next" type="button">${last ? sUI("recap", "Voir le récap") : sUI("next", "Suivant")}</button>`;
    const nextBtn = fb.querySelector("#sit-next");
    nextBtn.addEventListener("click", () => {
      if (nextBtn.disabled) return;
      nextBtn.disabled = true; // anti double-tap (le 2e toucherait le nouvel écran)
      playWhoosh();
      idx++;
      if (idx >= session.length) renderRecap();
      else renderStep();
    });
    nextBtn.focus({ preventScroll: true });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    fb.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
  }

  // ── Récap de manche ──────────────────────────────────────────
  function renderRecap() {
    clearTimers();
    const total = session.length;
    const pct = Math.round((bonnes / total) * 100);
    const gagnes = bonnes * VOLANTS_PAR_BONNE;
    const { credites, plafonne } = crediterAvecPlafond(gagnes, me.id);
    if (credites > 0) addGemmes(credites);

    const vues = getScenesVues(me.id);
    const collPct = Math.round((vues.size / SITUATIONS.length) * 100);

    track("situation.completed", {
      score: bonnes,
      total,
      pct,
      volants_gagnes: credites,
      collection_vues: vues.size,
    });

    if (pct === 100) {
      playVictory();
      burstConfetti({ y: 0.3 });
      navigator.vibrate?.([12, 40, 18, 60, 24]);
    } else if (pct >= 60) {
      playVictory();
    } else {
      playSuccess();
    }

    // Accroche post-onboarding : récap léger qui invite à entrer dans l'app
    // (l'élève y trouvera son coffre de bienvenue). Pas de « Rejouer ».
    if (isIntro) {
      const introTitre =
        pct === 100
          ? "Sans faute, bravo !"
          : pct >= 50
            ? "Tu as déjà l’œil"
            : "Bienvenue à bord !";
      stage.innerHTML = `
        <div class="sit-top">
          <button class="sit-x" id="sit-quit" type="button" aria-label="Passer">✕</button>
        </div>
        <div class="sit-recap">
          <div class="sit-kicker">Terminé</div>
          <div class="sit-score" id="sit-score">${bonnes}<span>/${total}</span></div>
          <h2 class="sit-h1 sit-h1-sm" tabindex="-1">${introTitre}</h2>
          <p class="sit-sub">Ton parcours et ton coffre de bienvenue t’attendent.</p>
          <div class="sit-gain" id="sit-gain">
            ${
              credites > 0
                ? `${volantImg(20, { drop: true })} <b>+${credites}</b>&nbsp;${volantLabel(credites)}`
                : `${volantImg(20)} Prêt pour la suite`
            }
          </div>
          <button class="sit-cta" id="sit-enter" type="button">Entrer dans PermiGo <span aria-hidden="true">→</span></button>
        </div>`;
      stage.querySelector(".sit-h1-sm")?.focus({ preventScroll: true });
      stage.querySelector("#sit-quit").addEventListener("click", exitIntro);
      stage.querySelector("#sit-enter").addEventListener("click", () => {
        haptic("tap");
        exitIntro();
      });
      if (credites > 0) {
        later(async () => {
          try {
            const { flyVolants } =
              await import("@/components/eleve/volant-reward.js");
            flyVolants(credites, {
              from: stage.querySelector("#sit-score"),
              target: stage.querySelector("#sit-gain"),
            });
          } catch {
            /* purement décoratif */
          }
        }, 350);
      }
      return;
    }

    const titre =
      pct === 100
        ? "Sans faute !"
        : pct >= 60
          ? "Bien joué !"
          : "Ça rentre, continue !";
    const sousTitre =
      pct === 100
        ? "Tu lis la route comme un chef."
        : pct >= 60
          ? "Encore quelques réflexes et c’est du solide."
          : "Chaque erreur vue ici, c’est une erreur en moins en vraie leçon.";

    stage.innerHTML = `
      <div class="sit-top">
        <button class="sit-x" id="sit-quit" type="button" aria-label="Quitter le jeu">✕</button>
      </div>
      <div class="sit-recap">
        <div class="sit-kicker">Manche terminée</div>
        <div class="sit-score" id="sit-score">${bonnes}<span>/${total}</span></div>
        <h2 class="sit-h1 sit-h1-sm" tabindex="-1">${titre}</h2>
        <p class="sit-sub">${sousTitre}</p>
        <div class="sit-gain" id="sit-gain">
          ${
            credites > 0
              ? `${volantImg(20, { drop: true })} <b>+${credites}</b>&nbsp;${volantLabel(credites)}`
              : gagnes > 0 && plafonne
                ? `${volantImg(20)} Récompense du jour au max — reviens demain`
                : `${volantImg(20)} 0 volant — la prochaine est la bonne`
          }
        </div>
        ${
          plafonne && credites > 0
            ? `<p class="sit-cap">Plafond du jour atteint. Les volants reviennent demain.</p>`
            : ""
        }
        <div class="sit-coll">
          <div class="sit-coll-t">Collection · ${vues.size}/${SITUATIONS.length} scènes vues</div>
          <div class="sit-coll-bar"><i style="width:${collPct}%"></i></div>
        </div>
        ${
          manquees.length
            ? `<div class="sit-revoir">
                 <div class="sit-revoir-t">À revoir</div>
                 ${manquees
                   .map(
                     (m) => `
                   <div class="sit-revoir-item">
                     <div class="sit-revoir-th">${sT1(THEME_LABELS[m.theme] || m.theme, sTheme(m.theme))}</div>
                     <p>${sBi(m.explication, sScene(m.id)?.e)}</p>
                   </div>`,
                   )
                   .join("")}
               </div>`
            : `<div class="sit-revoir"><div class="sit-revoir-item sit-revoir-clean">
                 Rien à revoir. Toutes les règles sont passées.
               </div></div>`
        }
        <button class="sit-cta" id="sit-again" type="button">Rejouer</button>
        <button class="sit-ghost" id="sit-home" type="button">Retour à l’accueil</button>
      </div>`;

    stage.querySelector(".sit-h1-sm")?.focus({ preventScroll: true });
    stage.querySelector("#sit-quit").addEventListener("click", quit);
    stage.querySelector("#sit-home").addEventListener("click", quit);
    stage.querySelector("#sit-again").addEventListener("click", () => {
      haptic("tap");
      playWhoosh();
      startRound();
    });

    if (credites > 0) {
      later(async () => {
        try {
          const { flyVolants } =
            await import("@/components/eleve/volant-reward.js");
          flyVolants(credites, {
            from: stage.querySelector("#sit-score"),
            target: stage.querySelector("#sit-gain"),
          });
        } catch {
          /* purement décoratif */
        }
      }, 350);
    }
  }

  function exitIntro() {
    // Fin de l'accroche post-onboarding → accueil (le coffre de bienvenue s'y
    // ouvre). reload : le chrome n'a pas été monté pendant l'onboarding, c'est
    // le boot qui le montera.
    location.hash = "#/";
    location.reload();
  }

  function quit() {
    haptic("tap");
    if (isIntro) exitIntro();
    else location.hash = "#/";
  }
}

export function unmount() {
  clearTimers();
  document.body.classList.remove("sit-immersive");
  if (_onHash) {
    window.removeEventListener("hashchange", _onHash);
    _onHash = null;
  }
}

// ── Plafond quotidien de volants (anti-farming doux) ───────────

function jourLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function crediterAvecPlafond(gagnes, userId) {
  // clé scopée au compte : deux élèves sur le même appareil ont chacun leur plafond
  const key = userId ? `${LS_JOUR}:${userId}` : LS_JOUR;
  let etat = { day: jourLocal(), total: 0 };
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "null");
    if (raw && raw.day === etat.day) etat = raw;
  } catch {
    /* état corrompu → on repart de zéro */
  }
  const credites = Math.max(0, Math.min(gagnes, PLAFOND_JOUR - etat.total));
  etat.total += credites;
  try {
    localStorage.setItem(key, JSON.stringify(etat));
  } catch {
    /* stockage plein : on crédite quand même */
  }
  return { credites, plafonne: etat.total >= PLAFOND_JOUR };
}

// ── Styles (scopés .page-sit / .sit-*) ─────────────────────────

const STYLE = `<style>
/* plein écran arène : header + nav masqués */
body.sit-immersive #header-bar, body.sit-immersive #bottom-nav { display: none !important; }
body.sit-immersive #app { padding-top: 0 !important; padding-bottom: 0 !important; }

.page-sit {
  --sit-btn-top: #3a3470; --sit-btn-bot: #231d4f; --sit-btn-edge: #15113a;
  --sit-sel-top: #ffd24a; --sit-sel-bot: #ff9c1c; --sit-sel-edge: #b85e00;
  --sit-gold: #ffcb3d;
  min-height: 100dvh; display: flex; flex-direction: column; color: #ece8ff;
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 16px calc(env(safe-area-inset-bottom, 0px) + 18px);
  background:
    radial-gradient(150% 60% at 50% -5%, rgba(255,180,60,.10) 0%, transparent 50%),
    radial-gradient(120% 55% at 50% 22%, rgba(110,70,220,.22) 0%, transparent 60%),
    linear-gradient(180deg, #181241 0%, #0c0a26 60%, #08071c 100%);
}
#sit-stage { display: flex; flex-direction: column; flex: 1; max-width: 520px; width: 100%; margin: 0 auto; }

/* barre du haut */
.sit-top { display: flex; align-items: center; gap: 10px; min-height: 44px; }
.sit-x {
  width: 44px; height: 44px; flex: 0 0 44px; border-radius: 14px; border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.08); color: #ece8ff; font-size: 17px; cursor: pointer;
  touch-action: manipulation; transition: transform .1s ease;
}
.sit-x:active { transform: scale(.94); }
.sit-prog { flex: 1; height: 8px; border-radius: 999px; background: rgba(255,255,255,.14); overflow: hidden; }
.sit-prog i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--sit-gold), #ff9b1e); transition: width .3s ease; }
.sit-count { font: 700 13px/1 'Baloo 2','Fredoka',sans-serif; color: #b9b3e6; }
.sit-coin {
  display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px;
  font: 800 13.5px/1 'Baloo 2','Fredoka',sans-serif; color: var(--sit-gold);
  background: rgba(255,203,61,.12); border: 1px solid rgba(255,203,61,.3);
}

/* scène */
.sit-scene, .sit-hero { margin: 4px -8px 0; }
.sit-scene svg, .sit-hero svg { width: 100%; height: auto; max-height: 38dvh; display: block; }
.sit-scene svg { animation: sitFloat 7s ease-in-out infinite alternate; }
.sit-veh { transition: transform 1.6s cubic-bezier(.45,.05,.3,1); will-change: transform; }
.sit-clign { opacity: 0; }
.sit-veh.clign-droit .sit-clign-droit, .sit-veh.clign-gauche .sit-clign-gauche { opacity: 1; animation: sitBlink .72s steps(2, jump-none) infinite; }
.sit-pieton-bob { animation: sitBob 1.6s ease-in-out infinite; }
.sit-pieton { transition: transform 2.2s ease-in-out; }
.sit-feu-on { animation: sitFeu 1.05s ease-in-out infinite; }
.sit-halo { animation: sitHalo 1.15s ease-in-out infinite; }
.sit-chev { opacity: 0; animation: sitChev 1.4s ease-in-out infinite; }
.sit-tag { animation: sitTagIn .5s cubic-bezier(.34,1.56,.64,1) both; }

/* question + cartes */
.sit-qwrap { margin-top: 10px; }
.sit-kicker { font: 800 11px/1 'Baloo 2','Fredoka',sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #b9b3e6; }
.sit-q { margin: 4px 0 0; font: 700 19px/1.25 'Baloo 2','Fredoka',sans-serif; color: #fff; }
/* Bilingue : traduction (langue élève) + français gardé dessous (discret). App LTR ; texte arabe RTL par span. */
.sit-tr { display: block; }
.sit-fr { display: block; margin-top: 3px; font: 500 .8em/1.35 'Inter',sans-serif; opacity: .58; }
.sit-cards { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.sit-cards[data-mode="cible"] { flex-direction: row; }
.sit-cards[data-mode="cible"] .sit-card { flex: 1; justify-content: center; text-align: center; }
.sit-card {
  display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 12px 16px;
  border-radius: 16px; background: linear-gradient(180deg, var(--sit-btn-top), var(--sit-btn-bot));
  border: 1px solid rgba(255,255,255,.06); color: #ece8ff; text-align: left; cursor: pointer;
  font: 500 15.5px/1.25 'Fredoka','Inter',sans-serif; touch-action: manipulation;
  box-shadow: 0 6px 0 var(--sit-btn-edge), 0 10px 14px rgba(0,0,0,.4),
    inset 0 1px 0 rgba(255,255,255,.24), inset 0 -2px 6px rgba(0,0,0,.4);
  transform: translateY(0); transition: transform .08s ease, box-shadow .08s ease, opacity .25s ease;
}
.sit-card-ico { font-size: 19px; flex: 0 0 auto; display: inline-flex; align-items: center; }
.sit-card:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 2px 0 var(--sit-btn-edge), 0 4px 8px rgba(0,0,0,.4),
    inset 0 1px 0 rgba(255,255,255,.24), inset 0 -2px 6px rgba(0,0,0,.4);
}
.sit-card:disabled { cursor: default; }
.sit-card.ok {
  background: linear-gradient(180deg, var(--sit-sel-top), var(--sit-sel-bot));
  border-color: rgba(255,255,255,.35); color: #3a1d00; font-weight: 700;
  box-shadow: 0 5px 0 var(--sit-sel-edge), 0 10px 20px rgba(255,140,30,.4),
    inset 0 1px 0 rgba(255,255,255,.65), inset 0 -2px 6px rgba(180,80,0,.3);
}
.sit-card.miss {
  background: linear-gradient(180deg, #5c2440, #3d1830);
  border-color: rgba(255,110,110,.4); color: #ffd7d7;
  box-shadow: 0 3px 0 #2a0f20, 0 6px 10px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12);
}
.sit-card.fade { opacity: .42; }

/* feedback */
.sit-feedback { margin-top: 12px; display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; }
.sit-expl {
  border-radius: 16px; padding: 13px 15px; background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.14); animation: sitPop .35s cubic-bezier(.34,1.56,.64,1) both;
}
.sit-expl.good { border-color: rgba(120,224,60,.45); background: rgba(88,204,2,.1); }
.sit-expl.bad { border-color: rgba(255,203,61,.4); background: rgba(255,203,61,.08); }
.sit-expl-t { font: 800 13px/1 'Baloo 2','Fredoka',sans-serif; letter-spacing: .04em; text-transform: uppercase; }
.sit-expl.good .sit-expl-t { color: #9ef06a; }
.sit-expl.bad .sit-expl-t { color: var(--sit-gold); }
.sit-expl-p { margin: 6px 0 0; font: 400 14.5px/1.45 'Inter',sans-serif; color: #e6e2ff; }

/* CTA or + bouton fantôme */
.sit-cta {
  border: 0; min-height: 54px; padding: 14px 30px; border-radius: 16px; cursor: pointer;
  color: #3a1d00; font: 800 16px/1 'Baloo 2','Fredoka',sans-serif; touch-action: manipulation;
  background: linear-gradient(180deg, var(--sit-sel-top), var(--sit-sel-bot));
  box-shadow: 0 5px 0 var(--sit-sel-edge), 0 8px 18px rgba(255,140,30,.35), inset 0 1px 0 rgba(255,255,255,.5);
  transition: transform .1s ease, box-shadow .1s ease;
}
.sit-cta:active {
  transform: translateY(4px);
  box-shadow: 0 1px 0 var(--sit-sel-edge), 0 3px 8px rgba(255,140,30,.3), inset 0 1px 0 rgba(255,255,255,.5);
}
.sit-ghost {
  border: 0; background: none; min-height: 44px; color: #b9b3e6; cursor: pointer;
  font: 600 14px/1 'Inter',sans-serif; text-decoration: underline; text-underline-offset: 3px;
  touch-action: manipulation;
}

/* intro */
.sit-intro { display: flex; flex-direction: column; flex: 1; justify-content: center; text-align: center; gap: 4px; padding-bottom: 12px; }
.sit-h1 { margin: 2px 0 0; font: 800 34px/1.05 'Baloo 2','Fredoka',sans-serif; color: #fff; }
.sit-h1-sm { font-size: 24px; }
.sit-sub { margin: 6px auto 0; max-width: 300px; font: 400 14.5px/1.45 'Inter',sans-serif; color: #cfc9f2; }
.sit-hero { margin-top: 2px; pointer-events: none; }
.sit-chips { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin: 4px 0 14px; }
.sit-chip {
  display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 999px;
  font: 600 12.5px/1 'Inter',sans-serif; color: #e6e2ff;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14);
}
.sit-intro .sit-cta { align-self: center; min-width: 220px; }

/* récap */
.sit-recap { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 10px 0 16px; }
.sit-score { font: 800 58px/1 'Baloo 2','Fredoka',sans-serif; color: var(--sit-gold); animation: sitPop .5s cubic-bezier(.34,1.56,.64,1) both; }
.sit-score span { font-size: 26px; color: #b9b3e6; }
.sit-gain {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 6px; padding: 9px 16px; border-radius: 999px;
  font: 700 15px/1.2 'Baloo 2','Fredoka',sans-serif; color: var(--sit-gold);
  background: rgba(255,203,61,.12); border: 1px solid rgba(255,203,61,.3);
}
.sit-cap { margin: 2px 0 0; font: 400 12.5px/1.4 'Inter',sans-serif; color: #b9b3e6; }
.sit-coll { width: 100%; margin-top: 12px; text-align: left; }
.sit-coll-t { font: 800 12px/1 'Baloo 2','Fredoka',sans-serif; letter-spacing: .06em; text-transform: uppercase; color: var(--sit-gold); }
.sit-coll-bar { margin-top: 6px; height: 8px; border-radius: 999px; background: rgba(255,255,255,.14); overflow: hidden; }
.sit-coll-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--sit-gold), #ff9b1e); }
.sit-revoir { width: 100%; margin: 14px 0 6px; text-align: left; display: flex; flex-direction: column; gap: 8px; }
.sit-revoir-t { font: 800 12px/1 'Baloo 2','Fredoka',sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #b9b3e6; }
.sit-revoir-item {
  border-radius: 14px; padding: 11px 14px; background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
}
.sit-revoir-item p { margin: 4px 0 0; font: 400 13.5px/1.45 'Inter',sans-serif; color: #d9d4f7; }
.sit-revoir-th { font: 700 13.5px/1 'Baloo 2','Fredoka',sans-serif; color: #fff; }
.sit-revoir-clean { text-align: center; font: 600 14px/1.4 'Inter',sans-serif; color: #d9d4f7; }
.sit-recap .sit-cta { margin-top: 10px; min-width: 220px; }

/* animations */
@keyframes sitFloat { from { transform: translateY(0); } to { transform: translateY(-5px); } }
@keyframes sitBlink { 0%, 100% { opacity: 1; } 50% { opacity: .12; } }
@keyframes sitBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
@keyframes sitFeu { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes sitHalo { 0%, 100% { opacity: .95; } 50% { opacity: .4; } }
@keyframes sitChev { 0%, 70%, 100% { opacity: 0; } 25%, 45% { opacity: 1; } }
@keyframes sitTagIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sitPop { from { opacity: 0; transform: translateY(10px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

/* focus clavier : anneau blanc lisible sur fond nuit */
.sit-card:focus-visible, .sit-cta:focus-visible, .sit-x:focus-visible, .sit-ghost:focus-visible {
  outline: 3px solid rgba(255,255,255,.65); outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .sit-scene svg, .sit-veh, .sit-pieton { animation: none; transition: none; }
}
</style>`;
