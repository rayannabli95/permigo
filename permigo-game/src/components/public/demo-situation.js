// ═══════════════════════════════════════════════════════════════
// Démonstration jouable — page publique (aucun compte, aucun appel réseau)
//
// Pourquoi : la page de vente demandait 24,99 € à quelqu'un qui n'avait rien vu
// bouger (audit du 01/08/2026, faille C1). Ici il joue une vraie scène du
// mini-jeu « En situation » en deux taps, avant le prix et avant l'inscription.
//
// ⚠️ La scène est RECOPIÉE de src/data/situations-conduite.js (id
// « camion-prio-droite », difficulté 1) et ses traductions de
// src/data/situations-i18n.js. On ne les importe pas : ces deux fichiers pèsent
// 87 Ko et 63 Ko, soit tout le catalogue, pour UNE scène sur la page la plus
// coûteuse du site. Si tu modifies la scène là-bas, reporte-la ici.
//
// Le moteur de rendu, lui, est bien le vrai (situation-scene.js). Il était
// chargé à la demande pour alléger la première vue ; il ne l'est plus. Un
// chargement séparé peut échouer (déploiement pendant qu'un onglet reste
// ouvert, réseau qui saute) et la scène disparaissait alors en silence. Sur la
// page qui vend, la démonstration ne peut pas être optionnelle.
// ═══════════════════════════════════════════════════════════════
import { track } from "@/services/analytics.js";
import {
  renderSituationScene,
  buildFocusFX,
  actorScreenDelta,
} from "@/components/eleve/situation-scene.js";

// ── La scène (copie conforme de « camion-prio-droite ») ─────────
const SCENE = {
  kind: "croisement",
  vehicules: [
    { id: "moi", at: "S", d: 1.9, couleur: "joueur", label: "Toi" },
    { id: "v1", at: "E", d: 2.0, type: "camion" },
  ],
};
const FOCUS = { veh: "v1" };
const BONNE = "v1";
// La scène SE JOUE quand la réponse est bonne : le camion s'engage, ta voiture
// le suit une seconde après. Recopié de « camion-prio-droite » (okAnim).
const OK_ANIM = [{ veh: "v1" }, { veh: "moi", delai: 1100 }];

const STR = {
  fr: {
    kick: "Essaie maintenant",
    alt: "Croisement sans panneau ni feu. Un camion arrive par ta droite.",
    q: "Un camion arrive par ta droite.",
    qAsk: "Qui passe en premier ?",
    r: { v1: "Le camion", moi: "Toi" },
    // Une ligne, pas trois, et sans point final. Personne ne lit un
    // paragraphe pour une réponse qu'il vient de donner, et la scène qui se
    // joue dit déjà l'essentiel.
    ok: "Bien vu",
    okSub: "Il vient de ta droite donc il passe",
    ko: "Presque",
    koSub: "Il vient de ta droite donc il passe avant toi",
    retry: "Réessayer",
    // La motivation est à son maximum juste après la bonne réponse (audit
    // landing du 03/08/2026) : avant, rien ne la recueillait, le visiteur
    // retombait sur trois avis puis un billet doré. Cette ligne referme la
    // boucle (la démo → PermiGo en vrai) sans ajouter de deuxième bouton.
    demoCtaLine:
      "C'est exactement comme ça que PermiGo te prépare avant de conduire.",
  },
  en: {
    kick: "Try it now",
    alt: "Crossroads with no sign and no lights. A truck is coming from your right.",
    q: "A truck is coming from your right.",
    qAsk: "Who goes first?",
    r: { v1: "The truck", moi: "You" },
    ok: "Well spotted",
    okSub: "It comes from your right so it goes first",
    ko: "Almost",
    koSub: "It comes from your right so it goes before you",
    retry: "Try again",
    demoCtaLine: "That's exactly how PermiGo gets you ready before you drive.",
  },
  ar: {
    kick: "جرّب الآن",
    alt: "تقاطع بلا لافتة ولا إشارة. شاحنة قادمة من يمينك.",
    q: "شاحنة قادمة من يمينك.",
    qAsk: "من يمرّ أولًا؟",
    r: { v1: "الشاحنة", moi: "أنت" },
    ok: "أحسنت",
    okSub: "هي قادمة من يمينك فتمرّ أولًا",
    ko: "تقريبًا",
    koSub: "هي قادمة من يمينك فتمرّ قبلك",
    retry: "أعد المحاولة",
    demoCtaLine: "هكذا بالضبط يُحضّرك PermiGo قبل أن تقود.",
  },
};

// DA « Arène 3D » (mockups/DA-ARENE-3D-SPEC.md, choix Rayan du 02/08/2026) :
// nuit violet, or chaud, boutons plastique qui s'enfoncent. La page qui vend
// parle enfin la même langue que le produit qu'elle vend. Une seule police,
// Archivo, comme partout ailleurs.
const STYLE = `<style>
  .dmo {
    position: relative; margin: 20px auto 0; max-width: 400px;
    border-radius: 26px; padding: 18px 16px;
    background: linear-gradient(180deg, #262059 0%, #191344 55%, #140f38 100%);
    border: 1.5px solid rgba(255,203,61,.30);
    box-shadow:
      0 30px 60px -24px rgba(0,0,0,.9),
      0 0 0 1px rgba(0,0,0,.4),
      inset 0 1.5px 0 rgba(255,255,255,.16),
      inset 0 -22px 40px -24px rgba(255,155,30,.35);
  }
  .dmo-kick {
    display: inline-flex; align-items: center; gap: 6px;
    font: 800 11px/1 'Archivo', sans-serif; letter-spacing: .14em; text-transform: uppercase;
    color: #4a2500; padding: 7px 13px; border-radius: 999px;
    background: linear-gradient(180deg, #ffe27a 0%, #ffcb3d 45%, #ff9b1e 100%);
    box-shadow: 0 3px 0 #b85e00, 0 6px 14px rgba(255,155,30,.35);
    position: absolute; top: -13px; inset-inline-start: 16px;
  }
  /* Le cadre doré tient la scène comme un écran de jeu : liseré or, tranche
     sombre, puis l'ombre portée. Trois couches d'un seul box-shadow. */
  .dmo-scene {
    border-radius: 18px; overflow: hidden; position: relative; border: 0;
    box-shadow:
      0 0 0 1.5px rgba(255,203,61,.34),
      0 0 0 5px #120d33,
      0 14px 30px -8px rgba(0,0,0,.75),
      inset 0 0 60px 12px rgba(4,2,20,.55);
  }
  /* Reflet de vitre en haut de la scène. */
  .dmo-scene::after {
    content: ""; position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
    background: linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0) 42%);
  }
  /* La scène est carrée : on la recadre en hauteur pour que la question ET les
     deux réponses tiennent dans le premier écran d'un iPhone 13. */
  .dmo-scene svg { display: block; width: 100%; height: auto; max-height: 34vh; margin: -6% 0; }
  /* Le décor respire, puis la scène SE JOUE : les acteurs avancent pour de
     vrai. Mêmes classes et mêmes durées que le mini-jeu de l'app, sinon la
     démonstration promet un mouvement que le produit ne tient pas. */
  .dmo-scene svg { animation: dmoFloat 7s ease-in-out infinite alternate; }
  .dmo-scene .sit-veh { transition: transform 1.6s cubic-bezier(.45,.05,.3,1), opacity .55s ease .95s; will-change: transform; }
  .dmo-scene .sit-clign { opacity: 0; }
  .dmo-scene .sit-veh.clign-droit .sit-clign-droit,
  .dmo-scene .sit-veh.clign-gauche .sit-clign-gauche { opacity: 1; animation: dmoBlink .72s steps(2, jump-none) infinite; }
  .dmo-scene .sit-halo { animation: dmoHalo 1.15s ease-in-out infinite; }
  .dmo-scene .sit-chev { opacity: 0; animation: dmoChev 1.4s ease-in-out infinite; }
  .dmo-scene .sit-tag { animation: dmoTagIn .5s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes dmoFloat { from { transform: translateY(0); } to { transform: translateY(-5px); } }
  @keyframes dmoBlink { 0%, 100% { opacity: 1; } 50% { opacity: .12; } }
  @keyframes dmoHalo { 0%, 100% { opacity: .95; } 50% { opacity: .4; } }
  @keyframes dmoChev { 0%, 70%, 100% { opacity: 0; } 25%, 45% { opacity: 1; } }
  @keyframes dmoTagIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  /* Deux lignes, deux roles. En haut la scene, en gras et en grand : c'est ce
     qui se passe. En dessous la question, plus petite et en couleur douce :
     c'est ce qu'on te demande. Les deux sur une seule ligne se melangeaient,
     on ne savait plus ou finissait le decor et ou commencait la question. */
  .dmo-q {
    font: 800 18px/1.3 'Archivo', sans-serif; color: #fff;
    margin: 16px 4px 12px; text-align: center; text-wrap: balance;
    text-shadow: 0 2px 4px rgba(0,0,0,.35);
  }
  .dmo-q span {
    display: block; margin-top: 5px;
    font: 700 14px/1.35 'Archivo', sans-serif; color: var(--gold);
    text-shadow: none;
  }
  .dmo-answers { display: flex; gap: 9px; }
  /* Boutons « plastique » : la tranche dure (0 7px 0) est ce qui donne le
     relief, et elle se réduit à 2px quand le doigt appuie. Le bouton
     s'enfonce vraiment, il ne fait pas semblant. */
  .dmo-ans {
    flex: 1; min-height: 60px; padding: 13px 10px; cursor: pointer;
    border: 0; border-radius: 18px;
    background: linear-gradient(180deg, #443c80 0%, #2c2560 55%, #241e52 100%);
    box-shadow: 0 7px 0 #15113a, 0 12px 20px -8px rgba(0,0,0,.7),
                inset 0 2px 0 rgba(255,255,255,.26), inset 0 -8px 14px -8px rgba(0,0,0,.5);
    color: #fff; font: 800 15.5px/1.2 'Archivo', sans-serif;
    transition: transform .1s ease, box-shadow .1s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .dmo-ans:active {
    transform: translateY(5px);
    box-shadow: 0 2px 0 #15113a, inset 0 2px 0 rgba(255,255,255,.26);
  }
  .dmo-ans.ok {
    background: linear-gradient(180deg, #b6f05a 0%, #78d128 55%, #58a416 100%);
    color: #1c3300;
    box-shadow: 0 7px 0 #3d7a06, 0 12px 22px -8px rgba(88,204,2,.5),
                inset 0 2px 0 rgba(255,255,255,.5);
  }
  .dmo-ans.ko {
    background: linear-gradient(180deg, #ff8b7a 0%, #e2513f 55%, #b93526 100%);
    color: #3d0b04;
    box-shadow: 0 7px 0 #8a2418, 0 12px 22px -8px rgba(226,81,63,.45),
                inset 0 2px 0 rgba(255,255,255,.45);
  }
  .dmo-ans[disabled] { cursor: default; opacity: .5; }
  .dmo-ans.ok[disabled], .dmo-ans.ko[disabled] { opacity: 1; }
  .dmo-fb {
    margin-top: 15px; border-radius: 18px; padding: 14px 15px 14px 17px; text-align: start;
    background: linear-gradient(180deg, rgba(12,8,36,.85), rgba(12,8,36,.6));
    border: 1px solid rgba(255,255,255,.10);
    border-inline-start: 4px solid var(--gold);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.10);
  }
  .dmo-fb.ok { border-inline-start-color: #78d128; }
  .dmo-fb.ko { border-inline-start-color: var(--gold); }
  .dmo-fb b { display: block; font: 800 16px/1.3 'Archivo', sans-serif; color: #fff; margin-bottom: 3px; }
  .dmo-fb span { font: 600 13.5px/1.5 'Archivo', sans-serif; color: var(--ink-soft); }
  .dmo-retry {
    display: block; margin: 10px auto 0; background: none; border: 0; cursor: pointer;
    font: 700 13.5px/1 'Archivo', sans-serif; color: var(--ink-soft);
    text-decoration: underline; text-underline-offset: 3px; min-height: 44px;
  }
  /* La ligne de renfort après la bonne réponse. PAS de bouton ici : PR #690
     (« il ne reste qu'une porte par écran ») a délibérément retiré tout ce qui
     ferait deux portes sur un même écran. La barre collante (.pv-sticky-free
     dans pass.js) est déjà à portée de pouce en permanence ; cette ligne
     referme la boucle vers elle au lieu de lui fabriquer une doublure juste
     au-dessus. Cf. onCorrect plus bas : c'est lui qui la met en valeur. */
  .dmo-cta-line {
    margin: 14px 4px 0; text-align: center; text-wrap: balance;
    font: 700 14.5px/1.4 'Archivo', sans-serif; color: var(--ink-soft);
  }
  @media (prefers-reduced-motion: reduce) {
    .dmo-ans { transition: none; }
    /* Mouvement coupé : le décor ne respire plus et les acteurs se posent
       d'un coup à l'arrivée. La scène se joue quand même, elle ne glisse pas. */
    .dmo-scene svg, .dmo-scene .sit-veh, .dmo-scene .sit-halo,
    .dmo-scene .sit-chev, .dmo-scene .sit-tag { animation: none; transition: none; }
    .dmo-scene .sit-chev { opacity: 1; }
  }
</style>`;

/**
 * Monte la démonstration dans `host`.
 * @param {HTMLElement} host
 * @param {'fr'|'en'|'ar'} lang
 * @param {{ onCorrect?: () => void }} [opts] onCorrect : appelé une fois,
 *   dès la bonne réponse (avant même que l'élève ait lu la ligne de renfort).
 *   Laisse la page hôte réagir au moment où la motivation est la plus haute,
 *   par exemple en mettant en valeur SA porte gratuite déjà à l'écran, plutôt
 *   que d'en fabriquer une seconde ici (cf. commentaire .dmo-cta-line).
 */
export function mountDemoSituation(host, lang, opts = {}) {
  const L = STR[lang] || STR.fr;

  host.innerHTML = `${STYLE}
    <div class="dmo">
      <span class="dmo-kick">${L.kick}</span>
      <div class="dmo-scene">
        ${renderSituationScene(SCENE, { alt: L.alt })}
      </div>
      <p class="dmo-q">${L.q}<span>${L.qAsk}</span></p>
      <div class="dmo-answers" id="dmo-answers">
        <button class="dmo-ans" type="button" data-ans="v1">${L.r.v1}</button>
        <button class="dmo-ans" type="button" data-ans="moi">${L.r.moi}</button>
      </div>
      <div id="dmo-after"></div>
    </div>`;

  track("pass.demo_view", { lang });

  const answers = [...host.querySelectorAll(".dmo-ans")];
  const after = host.querySelector("#dmo-after");
  // Le calque d'effets vit DANS le SVG, pas à côté. Il était posé dans un
  // <div> par-dessus la scène : les ellipses et les chevrons rendus par
  // buildFocusFX sont du SVG, un navigateur ne les dessine pas dans du HTML.
  // Le halo qui désigne le prioritaire n'est donc jamais apparu.
  const fx = host.querySelector(".sit-fx");
  const veh = (id) => host.querySelector(`[data-veh="${id}"]`);
  const timers = [];

  const reset = () => {
    timers.splice(0).forEach(clearTimeout);
    answers.forEach((b) => {
      b.disabled = false;
      b.classList.remove("ok", "ko");
    });
    after.innerHTML = "";
    if (fx) fx.innerHTML = "";
    // Les acteurs reviennent à leur place de départ pour un second essai.
    for (const { veh: id } of OK_ANIM) {
      const el = veh(id);
      if (el) el.style.transform = "";
    }
  };

  answers.forEach((btn) => {
    btn.addEventListener("click", () => {
      const juste = btn.dataset.ans === BONNE;
      track("pass.demo_answer", { lang, ok: juste });
      answers.forEach((b) => (b.disabled = true));
      btn.classList.add(juste ? "ok" : "ko");
      if (juste) {
        // La scène se joue : le camion s'engage, ta voiture le suit. C'est la
        // récompense de la bonne réponse, et c'est ce que promet le titre
        // « Une scène. Une décision. ».
        for (const st of OK_ANIM) {
          timers.push(
            setTimeout(() => {
              const el = veh(st.veh);
              if (!el) return;
              const { dx, dy } = actorScreenDelta(SCENE, st.veh, 3.6);
              el.style.transform = `translate(${dx}px, ${dy}px)`;
            }, st.delai || 60),
          );
        }
        // La motivation est à son maximum ici. On le signale à la page hôte
        // (elle décide quoi en faire, cf. commentaire d'opts.onCorrect) plutôt
        // que d'ajouter un deuxième bouton à côté du sien.
        opts.onCorrect?.();
      } else {
        // On montre QUI avait la priorité plutôt que d'écrire « faux ».
        answers.find((b) => b.dataset.ans === BONNE)?.classList.add("ok");
        if (fx) fx.innerHTML = buildFocusFX(SCENE, FOCUS);
      }
      after.innerHTML = `
        <div class="dmo-fb ${juste ? "ok" : "ko"}">
          <b>${juste ? L.ok : L.ko}</b>
          <span>${juste ? L.okSub : L.koSub}</span>
        </div>
        ${
          juste
            ? `<p class="dmo-cta-line">${L.demoCtaLine}</p>`
            : `<button class="dmo-retry" id="dmo-retry" type="button">${L.retry}</button>`
        }`;
      after.querySelector("#dmo-retry")?.addEventListener("click", reset);
    });
  });
}
