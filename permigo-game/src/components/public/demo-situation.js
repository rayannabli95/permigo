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
// Le moteur de rendu, lui, est bien le vrai (situation-scene.js) et il est
// chargé À LA DEMANDE : la première vue de la page ne paie rien.
// ═══════════════════════════════════════════════════════════════
import { track } from "@/services/analytics.js";

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

const STR = {
  fr: {
    kick: "Essaie maintenant",
    alt: "Croisement sans panneau ni feu. Un camion arrive par ta droite.",
    q: "Un camion arrive par ta droite. Qui passe en premier ?",
    r: { v1: "Le camion", moi: "Toi" },
    ok: "Bien vu.",
    okSub:
      "Il vient de ta droite : il passe. Avec un camion, garde encore plus de marge. Il démarre lentement.",
    ko: "Presque.",
    koSub:
      "Regarde à droite. Gros ou petit, la règle ne change pas : le camion vient de ta droite, il passe en premier.",
    retry: "Réessayer",
    cta: "Continuer gratuitement",
    more: "Il y a 59 scènes comme celle-ci dans l'app.",
  },
  en: {
    kick: "Try it now",
    alt: "Crossroads with no sign and no lights. A truck is coming from your right.",
    q: "A truck is coming from your right. Who goes first?",
    r: { v1: "The truck", moi: "You" },
    ok: "Well spotted.",
    okSub:
      "It comes from your right, so it goes first. With a truck, keep even more margin. It pulls away slowly.",
    ko: "Almost.",
    koSub:
      "Look right. Big or small, the rule doesn't change: the truck comes from your right, it goes first.",
    retry: "Try again",
    cta: "Continue for free",
    more: "There are 59 scenes like this one in the app.",
  },
  ar: {
    kick: "جرّب الآن",
    alt: "تقاطع بلا لافتة ولا إشارة. شاحنة قادمة من يمينك.",
    q: "شاحنة قادمة من يمينك. من يمرّ أولًا؟",
    r: { v1: "الشاحنة", moi: "أنت" },
    ok: "أحسنت.",
    okSub:
      "هي قادمة من يمينك، فتمرّ أولًا. ومع الشاحنة، اترك هامشًا أكبر. فهي تنطلق ببطء.",
    ko: "تقريبًا.",
    koSub:
      "انظر إلى اليمين. كبيرة كانت المركبة أم صغيرة، القاعدة لا تتغيّر: الشاحنة قادمة من يمينك، فتمرّ أولًا.",
    retry: "أعد المحاولة",
    cta: "تابع مجاناً",
    more: "في التطبيق 59 سيناريو مثل هذا.",
  },
};

const STYLE = `<style>
  .dmo {
    position: relative; margin: 16px auto 0; max-width: 400px;
    border-radius: 24px; padding: 14px 14px 16px;
    background: rgba(255,255,255,.05); border: 1.5px solid rgba(142,135,255,.34);
    box-shadow: 0 18px 40px -18px rgba(0,0,0,.75);
  }
  .dmo-kick {
    display: inline-flex; align-items: center; gap: 6px;
    font: 800 10.5px/1 'Archivo', sans-serif; letter-spacing: .14em; text-transform: uppercase;
    color: #1a1030; background: var(--gold); padding: 6px 10px; border-radius: 999px;
    position: absolute; top: -11px; inset-inline-start: 16px;
  }
  .dmo-scene {
    border-radius: 16px; overflow: hidden; position: relative;
    border: 3px solid #160f38; box-shadow: 0 10px 24px rgba(0,0,0,.45);
  }
  /* La scène est carrée : on la recadre en hauteur pour que la question ET les
     deux réponses tiennent dans le premier écran d'un iPhone 13. */
  .dmo-scene svg { display: block; width: 100%; height: auto; max-height: 34vh; margin: -6% 0; }
  .dmo-fx { position: absolute; inset: 0; pointer-events: none; }
  .dmo-q {
    font: 800 16.5px/1.3 'Archivo', sans-serif; color: var(--pv-ink);
    margin: 10px 2px 10px; text-align: center; text-wrap: balance;
  }
  .dmo-answers { display: flex; gap: 9px; }
  .dmo-ans {
    flex: 1; min-height: 54px; padding: 13px 10px; cursor: pointer;
    border-radius: 15px; border: 1.5px solid rgba(255,255,255,.18);
    background: linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.05));
    color: #fff; font: 800 14.5px/1.2 'Archivo', sans-serif;
    transition: transform .1s ease, border-color .15s ease, background .15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .dmo-ans:active { transform: scale(.97); }
  .dmo-ans.ok { border-color: var(--go); background: linear-gradient(180deg, rgba(88,204,2,.32), rgba(88,204,2,.14)); }
  .dmo-ans.ko { border-color: #e2513f; background: linear-gradient(180deg, rgba(226,81,63,.28), rgba(226,81,63,.12)); }
  .dmo-ans[disabled] { cursor: default; opacity: .55; }
  .dmo-ans.ok[disabled], .dmo-ans.ko[disabled] { opacity: 1; }
  .dmo-fb { margin-top: 12px; border-radius: 15px; padding: 12px 14px; text-align: start; }
  .dmo-fb.ok { background: rgba(88,204,2,.13); border: 1px solid rgba(88,204,2,.4); }
  .dmo-fb.ko { background: rgba(255,206,77,.12); border: 1px solid rgba(255,206,77,.4); }
  .dmo-fb b { display: block; font: 800 15px/1.3 'Archivo', sans-serif; color: #fff; margin-bottom: 3px; }
  .dmo-fb span { font: 600 13px/1.5 'Archivo', sans-serif; color: var(--ink-soft); }
  .dmo-more { display: block; text-align: center; font: 600 12px/1.5 'Archivo', sans-serif; color: var(--ink-dim); margin: 10px 0 0; }
  .dmo-cta {
    display: block; width: 100%; margin: 12px 0 0; border: 0; cursor: pointer;
    border-radius: 15px; padding: 15px;
    font: 800 16px/1 'Archivo', sans-serif; color: #fff; text-shadow: 0 1.5px 0 rgba(0,0,0,.28);
    background: linear-gradient(180deg, var(--in) 0%, var(--in-dp) 70%, var(--in-dk));
    box-shadow: inset 0 2.5px 0 rgba(255,255,255,.28), 0 5px 0 var(--in-dk);
  }
  .dmo-cta:active { transform: translateY(3px); box-shadow: inset 0 2.5px 0 rgba(255,255,255,.28), 0 2px 0 var(--in-dk); }
  .dmo-retry {
    display: block; margin: 10px auto 0; background: none; border: 0; cursor: pointer;
    font: 700 13.5px/1 'Archivo', sans-serif; color: var(--ink-soft);
    text-decoration: underline; text-underline-offset: 3px; min-height: 44px;
  }
  @media (prefers-reduced-motion: reduce) { .dmo-ans { transition: none; } }
</style>`;

/**
 * Monte la démonstration dans `host`.
 * @param {HTMLElement} host
 * @param {'fr'|'en'|'ar'} lang
 * @param {() => void} onContinue  clic sur « Continuer gratuitement »
 */
export async function mountDemoSituation(host, lang, onContinue) {
  const L = STR[lang] || STR.fr;
  // Le moteur de scène (20 Ko) n'est chargé qu'ici : la première vue de la page
  // de vente ne le paie pas. Si l'import échoue (réseau coupé au mauvais
  // moment), la page reste vendable : on ne monte simplement rien.
  let renderSituationScene, buildFocusFX;
  try {
    ({ renderSituationScene, buildFocusFX } =
      await import("@/components/eleve/situation-scene.js"));
  } catch {
    host.remove();
    return;
  }

  host.innerHTML = `${STYLE}
    <div class="dmo">
      <span class="dmo-kick">${L.kick}</span>
      <div class="dmo-scene">
        ${renderSituationScene(SCENE, { alt: L.alt })}
        <div class="dmo-fx" id="dmo-fx" aria-hidden="true"></div>
      </div>
      <p class="dmo-q">${L.q}</p>
      <div class="dmo-answers" id="dmo-answers">
        <button class="dmo-ans" type="button" data-ans="v1">${L.r.v1}</button>
        <button class="dmo-ans" type="button" data-ans="moi">${L.r.moi}</button>
      </div>
      <div id="dmo-after"></div>
    </div>`;

  track("pass.demo_view", { lang });

  const answers = [...host.querySelectorAll(".dmo-ans")];
  const after = host.querySelector("#dmo-after");
  const fx = host.querySelector("#dmo-fx");

  const reset = () => {
    answers.forEach((b) => {
      b.disabled = false;
      b.classList.remove("ok", "ko");
    });
    after.innerHTML = "";
    fx.innerHTML = "";
  };

  answers.forEach((btn) => {
    btn.addEventListener("click", () => {
      const juste = btn.dataset.ans === BONNE;
      track("pass.demo_answer", { lang, ok: juste });
      answers.forEach((b) => (b.disabled = true));
      btn.classList.add(juste ? "ok" : "ko");
      if (!juste) {
        // On montre QUI avait la priorité plutôt que d'écrire « faux ».
        answers.find((b) => b.dataset.ans === BONNE)?.classList.add("ok");
        fx.innerHTML = buildFocusFX(SCENE, FOCUS);
      }
      after.innerHTML = `
        <div class="dmo-fb ${juste ? "ok" : "ko"}">
          <b>${juste ? L.ok : L.ko}</b>
          <span>${juste ? L.okSub : L.koSub}</span>
        </div>
        ${juste ? `<span class="dmo-more">${L.more}</span>` : ""}
        <button class="dmo-cta" id="dmo-cta" type="button">${L.cta}</button>
        ${juste ? "" : `<button class="dmo-retry" id="dmo-retry" type="button">${L.retry}</button>`}`;
      after.querySelector("#dmo-cta")?.addEventListener("click", () => {
        track("pass.demo_cta", { lang, ok: juste });
        onContinue();
      });
      after.querySelector("#dmo-retry")?.addEventListener("click", reset);
    });
  });
}
