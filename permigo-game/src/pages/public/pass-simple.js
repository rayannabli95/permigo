// ═══════════════════════════════════════════════════════════════
// Page de vente, version SIMPLE — route #/simple
//
// Rayan, 07/08/2026 : « y a trop d'infos », « épure le texte, vire tout ce
// qui est inutile, ça doit pas être chiant à lire ». Cette page ne garde que
// cinq blocs, dans cet ordre :
//
//   la route → ce qu'il y a dedans → les gens → le prix → c'est tout
//
// Ce que dit la recherche sur les pages qui convertissent, et qu'on applique :
// · UN seul but, UN seul bouton principal. Le gratuit. Tout le reste s'efface.
// · Le titre porte le bénéfice, la promesse tient en moins de 30 mots.
// · La preuve se met À CÔTÉ de la demande : les avis viennent juste AVANT le
//   prix, pas après. C'est le levier le plus cité.
// · Pas de menu de navigation, rien qui emmène ailleurs.
// · Une page qui se PARCOURT du regard : des lignes courtes, jamais de
//   paragraphe. Si un inconnu ne sait pas dire ce qu'on vend après un coup
//   d'œil, le haut de page a raté.
//
// ⚠️ LA DÉMONSTRATION EST EN HAUT, ET C'EST VOULU. Elle a d'abord été mise
// en bas de page, puis retirée : faire passer un test à quelqu'un qui vient
// de lire le prix, ça refroidit. Mais la retirer complètement laissait une
// page qui VEND UNE PROMESSE SANS MONTRER LE PRODUIT — on demandait un email
// pour une app dont le visiteur n'avait pas vu un seul écran. La leçon de
// Duolingo tranche : on fait essayer AVANT de demander quoi que ce soit
// (déplacer l'inscription derrière la première leçon leur a fait +20 %
// d'utilisateurs actifs). Donc : le premier écran, ou nulle part.
//
// Le hero fait 74dvh et pas 100 : la scène DÉPASSE volontairement sous la
// ligne de flottaison. C'est elle qui donne envie de faire défiler, pas une
// flèche.
//
// ⚠️ Page de COMPARAISON, montée à côté de #/pass. Liée de nulle part : on y
// va par l'adresse. Si elle gagne, elle remplace pass.js.
//
// Partagé et surtout pas recopié : les avis (src/data/avis-eleves.js), chaque
// élève a relu et validé sa phrase. Le décor de route
// (components/public/route-backdrop.js).
// ═══════════════════════════════════════════════════════════════
import { getLang, applyLang } from "@/utils/lang.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { AVIS } from "@/data/avis-eleves.js";
import { mountDemoSituation } from "@/components/public/demo-situation.js";
import {
  BACKDROP_STYLE,
  backdropHTML,
  wireBackdrop,
} from "@/components/public/route-backdrop.js";

const LOGO = "/p-badge.webp";

// Pictos : même trait que partout dans l'app (24×24, stroke 2, currentColor).
const ICONS = {
  zap: `<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>`,
  book: `<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>`,
  wheel: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M4.2 16.5l5.2-3M19.8 16.5l-5.2-3"/>`,
  target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>`,
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;

const FEATS = ["situation", "prepa", "pilote", "examen"];
const FEAT_ICO = {
  situation: "zap",
  prepa: "book",
  pilote: "wheel",
  examen: "target",
};

// ⚠️ Règle maison : zéro tiret, zéro virgule dans un titre ou un libellé de
// carte. Deux idées = deux phrases courtes.
const STR = {
  fr: {
    login: "Se connecter",
    kicker: "Auto-école ou candidat libre",
    h1: `Prépare ta leçon <br><em>avant de monter en voiture.</em>`,
    lead: `L'app qui travaille ta <strong>conduite</strong> entre les leçons.`,
    cta: "Commencer gratuitement",
    // ⚠️ « 3 leçons offertes » tout court se lit « 3 heures de conduite
    // gratuites ». On promet alors ce qu'on ne donne pas, et la déception
    // arrive juste après l'inscription. « de l'app » lève le doute en 3 mots.
    ctaNote: "3 leçons de l'app offertes · sans carte bancaire",
    secFeats: "Ce qu'il y a dedans",
    feats: {
      situation: { t: "Mise en situation", d: "Une scène. Une décision." },
      prepa: { t: "Ta leçon préparée", d: "3 min avant de monter." },
      pilote: { t: "Mode Pilote", d: "Les gestes au volant." },
      examen: { t: "Examen blanc", d: "Noté comme le jour J." },
    },
    secAvis: "Ils l'utilisent déjà",
    avisAge: "ans",
    price: "4,99 € seulement",
    priceSub: "Par mois. Sans engagement.",
    priceBtn: "Tout débloquer",
    foot: "Paiement sécurisé par Stripe · Remboursé sous 3 jours",
    legal: "Mentions légales",
  },
  en: {
    login: "Log in",
    kicker: "Driving school or self-taught",
    h1: `Prepare every lesson <br><em>before you get in the car.</em>`,
    lead: `The app that works on your <strong>driving</strong> between lessons.`,
    cta: "Start for free",
    ctaNote: "3 in-app lessons free · no card needed",
    secFeats: "What is inside",
    feats: {
      situation: { t: "Real situations", d: "One scene. One decision." },
      prepa: { t: "Your lesson ready", d: "3 min before you drive." },
      pilote: { t: "Pilot mode", d: "The moves behind the wheel." },
      examen: { t: "Mock exam", d: "Marked like the real day." },
    },
    secAvis: "They already use it",
    avisAge: "years old",
    price: "Only €4.99",
    priceSub: "Per month. No commitment.",
    priceBtn: "Unlock everything",
    foot: "Secure payment by Stripe · Money back within 3 days",
    legal: "Legal notice",
  },
  ar: {
    login: "تسجيل الدخول",
    kicker: "مدرسة قيادة أو مترشّح حر",
    h1: `حضّر حصتك <br><em>قبل أن تركب السيارة.</em>`,
    lead: `التطبيق الذي يشتغل على <strong>قيادتك</strong> بين الحصص.`,
    cta: "ابدأ مجاناً",
    ctaNote: "3 دروس داخل التطبيق مجاناً · بلا بطاقة بنكية",
    secFeats: "ماذا يوجد بالداخل",
    feats: {
      situation: { t: "وضعيات حقيقية", d: "مشهد. قرار." },
      prepa: { t: "حصتك جاهزة", d: "3 دقائق قبل القيادة." },
      pilote: { t: "نمط القيادة", d: "الحركات خلف المقود." },
      examen: { t: "امتحان تجريبي", d: "مُقيَّم كيوم الامتحان." },
    },
    secAvis: "يستعملونه فعلاً",
    avisAge: "سنة",
    price: "€4.99 فقط",
    priceSub: "شهرياً. بلا التزام.",
    priceBtn: "افتح كل شيء",
    foot: "دفع آمن عبر Stripe · استرداد خلال 3 أيام",
    legal: "الإشعارات القانونية",
  },
};

/** Initiales pour la pastille (« Salah S. » → « SS »). */
const initiales = (nom) =>
  nom
    .split(/\s+/)
    .map((m) => m[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

const STYLE = `<style>
  .ps {
    position: relative; z-index: 1;
    font-family: 'Archivo', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    --in:#6c63ff; --in-lt:#8e87ff; --in-dp:#4a3fc9; --in-dk:#372fa3;
    --gold:#ffce4d; --gold-dp:#e8a317;
    --pv-ink:#f4f1ff; --ink-soft:#cdc8ec; --ink-mu:#aaa2d8; --ink-dim:#8b7fc4;
    color: var(--pv-ink);
    padding-bottom: calc(30px + env(safe-area-inset-bottom));
    overflow-x: clip;
  }
  .ps * { box-sizing: border-box; }
  .ps-wrap { max-width: 480px; margin: 0 auto; padding: 0 18px; }

  /* ── Barre haute : le logo et la connexion, rien d'autre. Une page de
     vente n'a pas de menu, tout ce qui emmène ailleurs coûte une vente. ── */
  .ps-nav {
    position: relative; z-index: 2;
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(12px + env(safe-area-inset-top)) 18px 0;
    max-width: 480px; margin: 0 auto;
  }
  .ps-nav img { width: 42px; height: 42px; filter: drop-shadow(0 4px 10px rgba(0,0,0,.7)); }
  .ps-login {
    font: 700 14px/1 'Archivo', sans-serif; color: #fff; background: rgba(0,0,0,.3);
    border: 1px solid rgba(255,255,255,.2); padding: 10px 16px; cursor: pointer;
    border-radius: 999px; backdrop-filter: blur(8px);
    min-height: 44px; /* règle maison : jamais moins de 44px sous un pouce */
  }

  /* ── Le premier écran : la route en grand, le texte posé en BAS.
     En haut, le titre obligerait à noircir le ciel et la route disparaît. ── */
  .ps-hero {
    min-height: 74dvh; margin-top: calc(-54px - env(safe-area-inset-top));
    display: flex; flex-direction: column; justify-content: flex-end;
    text-align: center; padding: 0 18px 26px;
  }
  .ps-kicker {
    font: 700 12px/1 'Archivo', sans-serif; letter-spacing: .2em;
    text-transform: uppercase; color: var(--ink-soft);
    text-shadow: 0 2px 8px rgba(12,7,32,.95);
  }
  .ps-h1 {
    font: 800 clamp(31px, 8.8vw, 42px)/1.06 'Archivo', sans-serif;
    color: #fff; margin: 10px 0 9px; text-wrap: balance;
    text-shadow: 0 3px 0 rgba(12,7,32,.8), 0 6px 26px rgba(0,0,0,.6);
  }
  .ps-h1 em { font-style: normal; color: var(--gold); }
  .ps-lead {
    font: 600 15px/1.5 'Archivo', sans-serif; color: var(--ink-soft);
    max-width: 330px; margin: 0 auto; text-shadow: 0 2px 8px rgba(12,7,32,.95);
  }
  .ps-lead strong { color: var(--gold); }

  /* LE bouton. Il n'y en a qu'un sur toute la page, plus son jumeau à côté
     du prix. Deux portes sur un écran, c'est une hésitation de plus. */
  .ps-cta {
    display: block; width: 100%; max-width: 340px; margin: 22px auto 0;
    min-height: 56px; border: 0; border-radius: 18px; cursor: pointer;
    font: 800 16.5px/1 'Archivo', sans-serif; color: #4a2500;
    background: linear-gradient(180deg, #ffe27a 0%, #ffcb3d 45%, #ff9b1e 100%);
    box-shadow: 0 6px 0 #b85e00, 0 14px 30px -8px rgba(255,155,30,.5);
    transition: transform .1s ease, box-shadow .1s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .ps-cta:active { transform: translateY(4px); box-shadow: 0 2px 0 #b85e00; }
  .ps-cta-note {
    margin: 11px 0 0; font: 600 12.5px/1.5 'Archivo', sans-serif;
    color: var(--ink-soft); text-shadow: 0 2px 8px rgba(12,7,32,.95);
  }

  /* ── Titres de section : trois mots, jamais de sous-titre. ── */
  .ps-sec { padding: 46px 0 0; }
  .ps-title {
    font: 800 clamp(21px, 5.6vw, 26px)/1.2 'Archivo', sans-serif;
    text-align: center; margin: 0 0 16px; color: #fff; text-wrap: balance;
    text-shadow: 0 2px 10px rgba(12,7,32,.7);
  }

  /* ── Les rails qui glissent : fonctionnalités et avis, même patron. ── */
  .ps-lot {
    display: flex; gap: 12px;
    overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
    margin-inline: -18px; padding: 4px 18px 10px; scrollbar-width: none;
  }
  .ps-lot::-webkit-scrollbar { display: none; }

  .ps-feat {
    flex: 0 0 60%; max-width: 210px; scroll-snap-align: start;
    display: flex; flex-direction: column; gap: 8px;
    padding: 16px 15px; border-radius: 20px;
    background: linear-gradient(180deg, rgba(42,35,97,.78), rgba(23,17,57,.82));
    border: 1px solid rgba(255,255,255,.13);
    box-shadow: 0 12px 26px -12px rgba(0,0,0,.7);
    backdrop-filter: blur(10px);
  }
  .ps-feat-ico {
    display: grid; place-items: center; width: 38px; height: 38px;
    border-radius: 12px; background: rgba(255,203,61,.14); color: var(--gold);
  }
  .ps-feat-ico svg { width: 21px; height: 21px; }
  .ps-feat b { font: 800 15px/1.2 'Archivo', sans-serif; color: #fff; }
  .ps-feat span { font: 600 12.5px/1.45 'Archivo', sans-serif; color: var(--ink-mu); }

  .ps-avis {
    flex: 0 0 78%; max-width: 320px; scroll-snap-align: start;
    margin: 0; padding: 16px 17px; border-radius: 20px;
    background: linear-gradient(180deg, rgba(42,35,97,.78), rgba(23,17,57,.82));
    border: 1px solid rgba(255,255,255,.13);
    box-shadow: 0 12px 26px -12px rgba(0,0,0,.7);
    backdrop-filter: blur(10px);
  }
  .ps-avis blockquote { margin: 0 0 13px; font: 500 14.5px/1.55 'Archivo', sans-serif; color: var(--pv-ink); }
  /* Guillemets écrits en clair : dans un littéral de gabarit JS, un
     échappement CSS est lu par JS avant CSS et casse le build. */
  .ps-avis blockquote::before { content: "“"; }
  .ps-avis blockquote::after { content: "”"; }
  .ps-avis figcaption { display: flex; align-items: center; gap: 10px; }
  .ps-avis-ini {
    flex: 0 0 34px; width: 34px; height: 34px; border-radius: 50%;
    display: grid; place-items: center;
    background: linear-gradient(180deg, #4a3fc9, #2f2688);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.22);
    font: 800 12px/1 'Archivo', sans-serif; color: #fff;
  }
  .ps-avis-qui b { display: block; font: 700 13.5px/1.25 'Archivo', sans-serif; color: #fff; }
  .ps-avis-qui span { font: 600 12px/1 'Archivo', sans-serif; color: var(--ink-mu); }

  /* ── Le prix, posé JUSTE APRÈS les avis. La preuve doit toucher la
     demande : c'est le levier le plus cité sur les pages qui convertissent. ── */
  .ps-price {
    text-align: center; border-radius: 24px; padding: 26px 20px; margin-top: 8px;
    background: linear-gradient(180deg, rgba(38,32,89,.86), rgba(20,15,56,.9));
    border: 1.5px solid rgba(255,203,61,.34);
    box-shadow: 0 24px 50px -20px rgba(0,0,0,.85), inset 0 1.5px 0 rgba(255,255,255,.14);
    backdrop-filter: blur(10px);
  }
  .ps-price-big {
    font: 900 clamp(34px, 9.5vw, 44px)/1.1 'Archivo', sans-serif;
    color: var(--gold); margin: 0 0 7px; text-wrap: balance;
    text-shadow: 0 2px 0 rgba(90,50,0,.5);
  }
  .ps-price-sub { margin: 0; font: 600 13.5px/1.5 'Archivo', sans-serif; color: var(--ink-soft); }
  .ps-price-btn {
    display: block; width: 100%; margin: 18px auto 0; min-height: 52px;
    border: 0; border-radius: 16px; cursor: pointer;
    font: 800 15.5px/1 'Archivo', sans-serif; color: #fff;
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2.5px 0 rgba(255,255,255,.35), 0 5px 0 var(--in-dk);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .ps-price-btn:active { transform: translateY(3px); box-shadow: inset 0 2.5px 0 rgba(255,255,255,.35), 0 1px 0 var(--in-dk); }

  /* La scène jouable, juste sous le titre. Le bouton qui la suit est celui
     qui compte : on le propose au moment où le visiteur vient de réussir. */
  .ps-demo { margin-top: 4px; }
  .ps-demo-cta { margin-top: 16px; }
  .ps-demo-cta.ps-pulse { animation: psPulse 1.7s ease-out; }
  @keyframes psPulse {
    0%, 100% { box-shadow: 0 6px 0 #b85e00, 0 14px 30px -8px rgba(255,155,30,.5); }
    30% { box-shadow: 0 6px 0 #b85e00, 0 0 0 10px rgba(255,203,61,.28), 0 14px 30px -8px rgba(255,155,30,.6); }
  }
  @media (prefers-reduced-motion: reduce) { .ps-demo-cta.ps-pulse { animation: none; } }

  .ps-foot {
    text-align: center; padding: 34px 0 6px;
    font: 600 12px/1.7 'Archivo', sans-serif; color: var(--ink-dim);
  }
  .ps-foot a { color: var(--ink-soft); display: inline-block; min-height: 44px; line-height: 44px; padding: 0 10px; }

  @media (min-width: 860px) {
    .ps-wrap, .ps-nav { max-width: 640px; }
    .ps-lot { flex-wrap: wrap; overflow: visible; scroll-snap-type: none; margin-inline: 0; padding: 4px 0 10px; }
    .ps-feat { flex: 0 0 calc(25% - 9px); max-width: none; }
    .ps-avis { flex: 0 0 calc(50% - 6px); max-width: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ps-cta, .ps-price-btn { transition: none; }
  }
${BACKDROP_STYLE}
</style>`;

export async function mount(root) {
  const lang = getLang();
  const L = STR[lang] || STR.fr;
  applyLang(lang);
  track("simple.view", { lang });

  root.innerHTML = `${STYLE}
  ${backdropHTML({ texte: "bas" })}
  <div class="ps" dir="${lang === "ar" ? "rtl" : "ltr"}">

    <header class="ps-nav">
      <a href="#/" aria-label="PermiGo"><img src="${LOGO}" alt="PermiGo"></a>
      <button class="ps-login" id="ps-login" type="button">${L.login}</button>
    </header>

    <section class="ps-hero">
      <div class="ps-kicker">${L.kicker}</div>
      <h1 class="ps-h1">${L.h1}</h1>
      <p class="ps-lead">${L.lead}</p>
      <button class="ps-cta" id="ps-cta" type="button">${L.cta}</button>
      <p class="ps-cta-note">${L.ctaNote}</p>
    </section>

    <div class="ps-wrap">

      <section class="ps-sec" style="padding-top:22px">
        <div class="ps-demo" id="ps-demo"></div>
        <button class="ps-cta ps-demo-cta" id="ps-cta2" type="button">${L.cta}</button>
        <p class="ps-cta-note">${L.ctaNote}</p>
      </section>

      <section class="ps-sec">
        <h2 class="ps-title">${L.secFeats}</h2>
        <div class="ps-lot">
          ${FEATS.map(
            (f) => `
            <article class="ps-feat">
              <span class="ps-feat-ico">${icon(FEAT_ICO[f])}</span>
              <b>${L.feats[f].t}</b>
              <span>${L.feats[f].d}</span>
            </article>`,
          ).join("")}
        </div>
      </section>

      <section class="ps-sec">
        <h2 class="ps-title">${L.secAvis}</h2>
        <div class="ps-lot">
          ${AVIS.slice(0, 3).map(
            (a) => `
            <figure class="ps-avis">
              <blockquote>${esc(a[lang] || a.fr)}</blockquote>
              <figcaption>
                <span class="ps-avis-ini">${esc(initiales(a.n))}</span>
                <span class="ps-avis-qui">
                  <b><bdi>${esc(a.n)}</bdi></b>
                  <span>${a.age} ${L.avisAge}</span>
                </span>
              </figcaption>
            </figure>`,
          ).join("")}
        </div>

        <div class="ps-price">
          <div class="ps-price-big">${L.price}</div>
          <p class="ps-price-sub">${L.priceSub}</p>
          <button class="ps-price-btn" id="ps-buy" type="button">${L.priceBtn}</button>
        </div>
      </section>

      <footer class="ps-foot">
        ${L.foot}<br><a href="#/legal">${L.legal}</a>
      </footer>
    </div>
  </div>`;

  root.querySelector("#ps-cta")?.addEventListener("click", () => {
    track("simple.free_click", { lang });
    location.hash = "#/rejoindre?solo=1";
  });
  // Le circuit Stripe vit dans #/pass tant que cette page est en comparaison :
  // on ne duplique pas un paiement qui marche.
  root.querySelector("#ps-buy")?.addEventListener("click", () => {
    track("simple.buy_click", { lang });
    location.hash = "#/pass";
  });
  root.querySelector("#ps-login")?.addEventListener("click", () => {
    location.hash = "#/login";
  });

  // La scène jouable. onCorrect : la motivation est à son maximum juste après
  // la bonne réponse. On ne fabrique pas un deuxième bouton, on met en valeur
  // celui qui est déjà juste en dessous.
  const demo = root.querySelector("#ps-demo");
  const cta2 = root.querySelector("#ps-cta2");
  if (demo)
    mountDemoSituation(demo, lang, {
      onCorrect: () => {
        track("simple.demo_success", { lang });
        if (!cta2) return;
        cta2.classList.remove("ps-pulse");
        void cta2.offsetWidth; // force le rejeu si l'élève relance la démo
        cta2.classList.add("ps-pulse");
      },
    });
  cta2?.addEventListener("click", () => {
    track("simple.free_click", { lang, from: "demo" });
    location.hash = "#/rejoindre?solo=1";
  });

  wireBackdrop(root);
}
