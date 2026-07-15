// ═══════════════════════════════════════════════════════════════
// Page publique — Pré-vente « Pass Permis » (payeur = ÉLÈVE)
// URL : #/pass  (partageable en DM : permigo.vercel.app/#/pass?lang=en)
//
// DA « Ticket d'Or » (choix Rayan 15/07) + polish 2e passe :
//  - billet 3D (relief, grain, reflet balayé au scroll), badge P gloss seul
//  - BILINGUE FR/EN (bouton dans la barre + ?lang= + langue du navigateur) —
//    cible aussi les candidats qui galèrent avec le français
//  - zéro jargon (« REMC » banni), textes courts, message CONDUITE martelé
//  - assets maison à la place des emojis, révélation des sections au scroll
//  - jauge de places RÉELLE (RPC publique pass_founder_count, pas de faux chiffre)
//
// 100 % pensé mobile (colonne ≤ 480 px, desktop = même colonne centrée).
// Retour Checkout : #/pass?checkout=success&plan=xxx | #/pass?checkout=cancel
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { track } from "@/services/analytics.js";
import { startPassCheckout } from "@/services/billing.js";
import { getCurUser } from "@/auth/cur-user.js";
import { illMask } from "@/utils/illustrations.js";

const TOTAL_PLACES = 20;

// ── Textes FR / EN ─────────────────────────────────────────────
const STR = {
  fr: {
    login: "Se connecter",
    langBtn: "EN",
    kicker: "Promo fondatrice — 20 places",
    h1: `Réserve ta place.<br><em>Permis en 90 jours.</em>`,
    lead: `La seule app qui bosse ta <strong>conduite</strong> entre les leçons — pas une énième app de code.`,
    tTitle: `OBJECTIF PERMIS<br>EN 90 JOURS`,
    tSub: "Conduite · mini-jeux · examens blancs",
    tBoardLbl: "Embarquement",
    tBoard: "JUIL. 2026",
    tPriceLbl: "Tarif fondateur",
    tPrice: "24,99 €",
    tPlace: "Place",
    counterZero: `${TOTAL_PLACES} places fondatrices — prix bloqué à vie`,
    counterSome: (n) =>
      `${n} place${n > 1 ? "s" : ""} prise${n > 1 ? "s" : ""} sur ${TOTAL_PLACES}`,
    cta: "Réserver ma place — 24,99 €",
    ctaNote: `Stripe sécurisé · <b>100 % remboursable</b> en un message`,
    bulle: "3 compétences validées !",
    bulleSub: "cette semaine",
    secCode: `Le code, tout le monde le fait.<br>Nous, on bosse ta <em>conduite</em>.`,
    secCodeSub: "Ce qui fait rater le permis, c'est la conduite :",
    situTitle: "Mini-jeux « En situation »",
    situTxt:
      "Une scène, une décision : qui passe en premier ? Priorités, distances, insertions — comme au volant.",
    situAlt:
      "Mini-jeu En situation : un croisement, à toi de décider qui passe",
    feats: [
      {
        mask: "cahier",
        t: "Chaque leçon préparée",
        d: "Créneau, autoroute, giratoire : une fiche claire avant de monter en voiture.",
      },
      {
        img: "/skins/badge-medaille.png",
        t: "Examen blanc de conduite",
        d: "Un faux examen de conduite, noté sur les mêmes critères que l'inspecteur. Le jour J, zéro surprise.",
      },
      {
        img: "/signs/carrefour-giratoire.svg",
        t: "Ton centre d'examen décortiqué",
        d: "Les infos pratiques et les pièges connus du parcours, centre par centre.",
      },
      {
        img: "/skins/volant-coin.webp",
        t: "Et ça donne envie de revenir",
        d: "Série, ligue, récompenses. Le code est inclus aussi.",
      },
    ],
    mathsRows: [
      ["1 heure de conduite", "55 €"],
      ["Budget permis moyen", "1 800 €"],
      ["PermiGo, par mois", "9,99 €"],
    ],
    mathsNote: "Une leçon mal préparée, c'est 55 € de perdus.",
    mathsSrc: "Sources : UFC-Que Choisir (budget permis) · Sécurité routière",
    secPass: "Trois billets, un objectif",
    secPassSub: "Tout est inclus dans chacun.",
    passes: {
      mensuel: {
        name: "Billet Mensuel",
        desc: "Sans engagement — stop en un clic.",
        price: "9,99 €",
        per: "/mois",
        btn: "Commencer",
      },
      pass3: {
        tag: "Le plus choisi",
        name: "Billet Or · 3 mois",
        desc: "« Objectif permis en 90 jours ».",
        permo: "≈ 8,33 €/mois, payé une fois.",
        strike: "29,97 €",
        price: "24,99 €",
        btn: "Réserver",
      },
      pass6: {
        name: "Billet Platine · 6 mois",
        desc: "Conduite accompagnée, zéro pression.",
        strike: "59,94 €",
        price: "39,99 €",
        btn: "Réserver",
      },
    },
    err: "Le paiement n'a pas pu démarrer. Réessaie.",
    btnWait: "Ouverture du paiement…",
    stampTag: "Garanti",
    stampT: "Remboursable en un message",
    stampD: "Tu changes d'avis ? Remboursé. Sans question, sans délai.",
    secProof: "S'entraîner régulièrement, ça paie",
    proofA: "Avec entraînement régulier",
    proofB: "Filière classique",
    proofSrc: "Taux de réussite au permis B — Sécurité routière.",
    secFaq: "Questions fréquentes",
    faq: [
      [
        "C'est une app de code ?",
        "Non. Le code est inclus (quiz, examens blancs), mais la vraie différence : on t'entraîne à la <strong>conduite</strong> — mini-jeux, fiches de leçon, examens blancs de conduite, centres d'examen.",
      ],
      [
        "Et si je change d'avis ?",
        "Un message, remboursement intégral. Sans question.",
      ],
      [
        "Ça marche avec mon auto-école ?",
        "Oui. Tu gardes tes leçons — PermiGo bosse entre. Si ton moniteur l'utilise, ta progression se synchronise avec lui.",
      ],
      [
        "Comment je paye ?",
        "Carte, Apple Pay ou Google Pay, via Stripe. On ne voit jamais ta carte.",
      ],
      [
        "Le mensuel m'engage ?",
        "Non, stop en un clic. Billets Or et Platine : paiement unique, zéro renouvellement.",
      ],
    ],
    foot: `Paiement sécurisé par Stripe · Remboursable sur demande<br><a href="#/legal">Mentions légales</a>`,
    stickyName: "Billet Or · 3 mois",
    stickyPrice: "24,99 € · remboursable",
    stickyBtn: "Réserver ma place",
    cancelNote:
      "Paiement annulé — rien n'a été débité. Ton billet t'attend juste en dessous. 👇",
    successT: "Billet validé — bienvenue dans la promo fondatrice ! 🎉",
    successD:
      "Ton reçu Stripe arrive par email. Sous 24 h, tu reçois ton accès sur ce même email — et on t'installe l'app avec toi si tu veux. Une question ? Un message suffit.",
    planLabels: {
      mensuel: "Billet Mensuel — 9,99 €/mois",
      pass3: "Billet Or · 3 mois — 24,99 €",
      pass6: "Billet Platine · 6 mois — 39,99 €",
    },
  },
  en: {
    login: "Log in",
    langBtn: "FR",
    kicker: "Founding offer — 20 seats",
    h1: `Book your seat.<br><em>Licence in 90 days.</em>`,
    lead: `The only app that trains your <strong>driving</strong> between lessons — not just another code-test app.`,
    tTitle: `LICENCE GOAL:<br>90 DAYS`,
    tSub: "Driving · mini-games · mock tests",
    tBoardLbl: "Boarding",
    tBoard: "JUL 2026",
    tPriceLbl: "Founder price",
    tPrice: "€24.99",
    tPlace: "Seat",
    counterZero: `${TOTAL_PLACES} founding seats — price locked for life`,
    counterSome: (n) => `${n} of ${TOTAL_PLACES} seats taken`,
    cta: "Book my seat — €24.99",
    ctaNote: `Secure Stripe checkout · <b>100% refundable</b> with one message`,
    bulle: "3 skills validated!",
    bulleSub: "this week",
    secCode: `Everyone drills the code test.<br>We train your <em>driving</em>.`,
    secCodeSub: "Driving is what fails candidates:",
    situTitle: "“On the road” mini-games",
    situTxt:
      "One scene, one decision: who goes first? Right of way, distances, merging — like behind the wheel.",
    situAlt: "On-the-road mini-game: a crossroads, you decide who goes first",
    feats: [
      {
        mask: "cahier",
        t: "Every lesson prepped",
        d: "Parking, motorway, roundabouts: a clear sheet before you get in the car.",
      },
      {
        img: "/skins/badge-medaille.png",
        t: "Mock driving test",
        d: "A practice driving exam, scored on the examiner's own criteria. No surprises on test day.",
      },
      {
        img: "/signs/carrefour-giratoire.svg",
        t: "Your test centre, decoded",
        d: "Practical info and the known traps of the route, centre by centre.",
      },
      {
        img: "/skins/volant-coin.webp",
        t: "And you'll want to come back",
        d: "Streaks, leagues, rewards. The code test is included too.",
      },
    ],
    mathsRows: [
      ["1 hour of driving lessons", "€55"],
      ["Average licence budget (France)", "€1,800"],
      ["PermiGo, per month", "€9.99"],
    ],
    mathsNote: "One unprepared lesson = €55 wasted.",
    mathsSrc: "Sources: UFC-Que Choisir (licence budget) · Sécurité routière",
    secPass: "Three tickets, one goal",
    secPassSub: "Everything is included in each.",
    passes: {
      mensuel: {
        name: "Monthly Ticket",
        desc: "No strings — cancel in one click.",
        price: "€9.99",
        per: "/mo",
        btn: "Start",
      },
      pass3: {
        tag: "Most popular",
        name: "Gold Ticket · 3 months",
        desc: "“Licence in 90 days”.",
        permo: "≈ €8.33/mo, paid once.",
        strike: "€29.97",
        price: "€24.99",
        btn: "Book",
      },
      pass6: {
        name: "Platinum · 6 months",
        desc: "Accompanied driving, zero pressure.",
        strike: "€59.94",
        price: "€39.99",
        btn: "Book",
      },
    },
    err: "Payment couldn't start. Please try again.",
    btnWait: "Opening checkout…",
    stampTag: "Guaranteed",
    stampT: "Refund with one message",
    stampD: "Change your mind? Refunded. No questions, no delay.",
    secProof: "Regular practice pays off",
    proofA: "With regular practice",
    proofB: "Standard route",
    proofSrc: "French driving-test pass rates — Sécurité routière.",
    secFaq: "Frequently asked",
    faq: [
      [
        "Is this a code-test app?",
        "No. The code test is included (quizzes, mock tests), but the real difference: we train your <strong>driving</strong> — mini-games, lesson sheets, mock driving tests, test-centre guides.",
      ],
      [
        "What if I change my mind?",
        "One message, full refund. No questions asked.",
      ],
      [
        "Does it work with my driving school?",
        "Yes. Keep your lessons — PermiGo works in between. If your instructor uses PermiGo, your progress syncs with them.",
      ],
      [
        "How do I pay?",
        "Card, Apple Pay or Google Pay, through Stripe. We never see your card.",
      ],
      [
        "Does the monthly plan lock me in?",
        "No — cancel in one click. Gold and Platinum tickets: one-time payment, no renewal.",
      ],
    ],
    foot: `Secure payment by Stripe · Refundable on request<br><a href="#/legal">Legal notice</a>`,
    stickyName: "Gold Ticket · 3 months",
    stickyPrice: "€24.99 · refundable",
    stickyBtn: "Book my seat",
    cancelNote:
      "Payment cancelled — nothing was charged. Your ticket is waiting below. 👇",
    successT: "Ticket confirmed — welcome to the founding crew! 🎉",
    successD:
      "Your Stripe receipt is on its way by email. Within 24 h you'll get your access on that same email — and we'll set the app up with you if you like. Any question? One message.",
    planLabels: {
      mensuel: "Monthly Ticket — €9.99/mo",
      pass3: "Gold Ticket · 3 months — €24.99",
      pass6: "Platinum Ticket · 6 months — €39.99",
    },
  },
};

// Grain très léger posé sur le billet (relief papier doré).
const GRAIN =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.55'/></svg>";

const STYLE = `<style>
  .pv {
    position: relative;
    min-height: 100dvh;
    font-family: 'Baloo 2', var(--fb), sans-serif;
    -webkit-font-smoothing: antialiased;
    --in:#6c63ff;--in-lt:#8e87ff;--in-dp:#4a3fc9;--in-dk:#372fa3;
    --gold:#ffce4d;--gold-dp:#e8a317;--go:#58cc02;
    --pv-ink:#f4f1ff;--ink-soft:#cdc8ec;--ink-mu:#aaa2d8;--ink-dim:#8b7fc4;
    --tik-ink:#3a2a05;--tik-mu:#6b520f;--tik-lbl:#8a6a17;
    color: var(--pv-ink);
    background:
      radial-gradient(100% 46% at 50% -4%, rgba(255,206,77,.16), transparent 58%),
      linear-gradient(180deg, #1b1240 0%, #241a4d 50%, #170f38 100%);
    background-color:#1b1240;
    padding-bottom: calc(88px + env(safe-area-inset-bottom));
    overflow-x: clip;
  }
  .pv * { box-sizing: border-box; }
  /* Colonne mobile, même sur grand écran (produit 100 % téléphone). */
  .pv-wrap { max-width: 480px; margin: 0 auto; padding: 0 18px; }

  /* ── Révélation au scroll ── */
  .pv-rev { opacity: 0; transform: translateY(24px); transition: opacity .55s ease, transform .55s cubic-bezier(.22,1,.36,1); }
  .pv-rev.in { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) { .pv-rev { opacity: 1; transform: none; transition: none; } }

  /* ── Barre haute ── */
  .pv-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(14px + env(safe-area-inset-top)) 18px 4px;
    max-width: 480px; margin: 0 auto;
  }
  /* Badge P seul, effet gloss (plus de texte « PermiGo ») */
  .pv-badge-p {
    position: relative; width: 44px; height: 44px; border-radius: 14px;
    display: grid; place-items: center; text-decoration: none;
    background: linear-gradient(180deg, #372b76, #241c5e);
    box-shadow: inset 0 2px 0 rgba(255,255,255,.28), inset 0 -3px 6px rgba(0,0,0,.4), 0 6px 14px rgba(0,0,0,.4);
  }
  .pv-badge-p::after {
    content: ""; position: absolute; inset: 2px 2px 55% 2px; border-radius: 12px 12px 20px 20px;
    background: linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,0));
    pointer-events: none;
  }
  .pv-badge-p img { width: 30px; height: 30px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.45)); }
  .pv-nav-right { display: flex; align-items: center; gap: 8px; }
  .pv-lang {
    font: 800 13px/1 'Baloo 2', sans-serif; letter-spacing: .05em; color: var(--pv-ink);
    background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.22);
    border-radius: 999px; padding: 9px 14px; cursor: pointer;
  }
  .pv-lang:active { background: rgba(255,255,255,.2); }
  .pv-login { font: 700 14px/1 'Baloo 2', sans-serif; color: var(--ink-soft); background: none; border: 0; padding: 10px 8px; cursor: pointer; border-radius: 12px; }

  /* ── Hero ── */
  .pv-hero { text-align: center; padding-top: 20px; }
  .pv-kicker { font: 700 12px/1 Inter, sans-serif; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-mu); }
  .pv-h1 { font: 800 clamp(36px, 10vw, 44px)/1.05 'Baloo 2', sans-serif; color: var(--pv-ink); margin: 12px 0 10px; text-shadow: 0 3px 0 rgba(12,7,32,.8); }
  .pv-h1 em { font-style: normal; color: var(--gold); }
  .pv-lead { font: 600 15.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); max-width: 330px; margin: 0 auto; }
  .pv-lead strong { color: var(--gold); }

  /* ── LE billet d'or (relief + grain + reflet) ── */
  .pv-ticket-scene { position: relative; margin: 28px auto 0; max-width: 400px; filter: drop-shadow(0 30px 40px rgba(0,0,0,.55)); }
  .pv-ticket-scene.pv-rev { transform: translateY(28px) scale(.96) rotate(-1deg); }
  .pv-ticket-scene.pv-rev.in { transform: none; }
  .pv-ticket {
    position: relative; transform: rotate(-2.5deg);
    background:
      radial-gradient(130% 100% at 18% -6%, rgba(255,255,255,.5), transparent 42%),
      radial-gradient(90% 70% at 85% 110%, rgba(120,78,8,.35), transparent 55%),
      linear-gradient(115deg, #f6d267 0%, #ffe9a8 22%, #eab63a 48%, #ffdf8a 70%, #d99c1e 100%);
    border-radius: 20px; color: var(--tik-ink); overflow: hidden;
    box-shadow:
      inset 0 2.5px 0 rgba(255,255,255,.75),
      inset 0 -4px 8px rgba(122,85,16,.55),
      inset 3px 0 6px rgba(255,255,255,.25),
      inset -3px 0 8px rgba(122,85,16,.3),
      0 3px 0 #a87c14, 0 10px 18px rgba(0,0,0,.35);
  }
  .pv-ticket::before {
    content: ""; position: absolute; top: 0; bottom: 0; left: calc(100% - 96px); width: 0;
    border-left: 2.5px dashed rgba(58,42,5,.4);
  }
  .pv-t-grain { position: absolute; inset: 0; pointer-events: none; background: url("${GRAIN}"); opacity: .12; mix-blend-mode: overlay; }
  .pv-t-shine {
    position: absolute; inset: -20% -35%; pointer-events: none;
    background: linear-gradient(115deg, transparent 38%, rgba(255,255,255,.75) 48%, rgba(255,255,255,.2) 52%, transparent 62%);
    mix-blend-mode: soft-light; transform: translateX(-130%);
  }
  .pv-ticket-scene.in .pv-t-shine { animation: pvSheen 1.5s cubic-bezier(.4,0,.2,1) .35s both; }
  @keyframes pvSheen { to { transform: translateX(130%); } }
  @media (prefers-reduced-motion: reduce) { .pv-ticket-scene.in .pv-t-shine { animation: none; transform: translateX(-130%); } }
  .pv-t-inner { display: flex; position: relative; }
  .pv-t-main { flex: 1; padding: 18px 14px 16px 18px; }
  .pv-t-stub { width: 96px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px 6px; text-align: center; }
  .pv-t-brand { display: flex; align-items: center; gap: 7px; font: 800 14px/1 'Baloo 2', sans-serif; text-shadow: 0 1px 0 rgba(255,255,255,.4); }
  .pv-t-brand img { width: 20px; height: 20px; filter: drop-shadow(0 1px 1px rgba(90,60,5,.5)); }
  .pv-t-title { font: 800 23px/1.05 'Baloo 2', sans-serif; margin: 9px 0 3px; letter-spacing: -.01em; text-shadow: 0 1px 0 rgba(255,255,255,.45), 0 -1px 0 rgba(90,60,5,.3); }
  .pv-t-sub { font: 600 11.5px/1.4 Inter, sans-serif; color: var(--tik-mu); }
  .pv-t-meta { display: flex; gap: 14px; margin-top: 12px; }
  .pv-t-meta div b { display: block; font: 700 10px/1 Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--tik-lbl); margin-bottom: 2px; }
  .pv-t-meta div span { font: 600 13px/1 'IBM Plex Mono', monospace; }
  .pv-t-stub .n { font: 600 11px/1 Inter, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: var(--tik-lbl); }
  .pv-t-place { font: 800 26px/1 'Baloo 2', sans-serif; text-shadow: 0 1px 0 rgba(255,255,255,.45); }
  .pv-t-place small { font-size: 14px; }
  .pv-t-barcode {
    width: 64px; height: 34px; border-radius: 3px; opacity: .85;
    background: repeating-linear-gradient(90deg, #3a2a05 0 2px, transparent 2px 5px, #3a2a05 5px 6px, transparent 6px 10px);
    box-shadow: 0 1px 0 rgba(255,255,255,.35);
  }

  /* compteur de places (chiffre réel) */
  .pv-counter { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 22px; min-height: 20px; }
  .pv-pips { display: flex; gap: 4px; }
  .pv-pip { width: 11px; height: 16px; border-radius: 3px; background: rgba(255,255,255,.12); box-shadow: inset 0 1px 2px rgba(0,0,0,.35); }
  .pv-pip.on { background: linear-gradient(180deg, #ffe08a, var(--gold-dp)); box-shadow: inset 0 1.5px 0 rgba(255,255,255,.5), 0 0 8px rgba(255,206,77,.5); }
  .pv-counter b { font: 700 13px/1.2 'Baloo 2', sans-serif; color: var(--gold); }

  /* CTA principal */
  .pv-cta-hero {
    display: block; width: 100%; max-width: 340px; margin: 22px auto 0;
    border: 0; cursor: pointer; border-radius: 18px; padding: 17px;
    font: 800 17px/1 'Baloo 2', sans-serif; color: #4a3300; text-shadow: 0 1px 0 rgba(255,255,255,.35);
    background: linear-gradient(180deg, #ffe08a, var(--gold) 55%, var(--gold-dp));
    box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 6px 0 #a86e00, 0 12px 26px rgba(0,0,0,.4);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pv-cta-hero:active { transform: translateY(4px); box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 2px 0 #a86e00, 0 4px 8px rgba(0,0,0,.3); }
  .pv-cta-hero[disabled] { opacity: .65; cursor: wait; }
  .pv-cta-note { text-align: center; font: 600 12.5px/1.5 Inter, sans-serif; color: var(--ink-dim); margin: 12px 0 0; }
  .pv-cta-note b { color: var(--ink-soft); }

  /* ── Scène téléphone + mascotte (Arène) ── */
  .pv-stage { position: relative; height: 470px; max-width: 400px; margin: 44px auto 0; }
  .pv-phone {
    position: absolute; left: 50%; transform: translateX(-26%) rotate(4deg); top: 0; width: 196px;
    border-radius: 30px; overflow: hidden; border: 6px solid #160f38;
    box-shadow: 0 24px 50px rgba(0,0,0,.55), 0 0 0 2px rgba(142,135,255,.5);
  }
  .pv-phone::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(155deg, rgba(255,255,255,.2), transparent 32%); }
  .pv-phone img { display: block; width: 100%; height: auto; }
  .pv-mascot { position: absolute; left: -8px; bottom: 0; width: 180px; z-index: 3; filter: drop-shadow(0 18px 30px rgba(0,0,0,.5)); }
  .pv-coin { position: absolute; z-index: 3; right: 4px; top: -6px; width: 72px; transform: rotate(12deg); filter: drop-shadow(0 10px 18px rgba(0,0,0,.45)); }
  .pv-bulle {
    position: absolute; z-index: 3; right: 0; bottom: 116px;
    background: #fff; color: #231603; border-radius: 16px 16px 4px 16px; padding: 10px 14px;
    font: 700 13px/1.3 'Baloo 2', sans-serif; box-shadow: 0 8px 20px rgba(0,0,0,.4);
  }
  .pv-bulle small { display: block; color: #8a7a52; font-weight: 600; font-size: 11px; }

  /* ── Sections ── */
  .pv-sec-title {
    text-align: center; font: 800 clamp(24px, 7vw, 28px)/1.15 'Baloo 2', sans-serif;
    color: var(--pv-ink); margin: 52px 0 0; text-shadow: 0 3px 0 rgba(12,7,32,.8);
  }
  .pv-sec-title em { font-style: normal; color: var(--gold); }
  .pv-sec-sub { text-align: center; font: 600 13.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-mu); margin: 8px auto 22px; max-width: 340px; }

  /* ── « Pas une app de code » ── */
  .pv-conduite { display: flex; flex-direction: column; gap: 12px; }
  .pv-situ {
    display: flex; gap: 14px; align-items: center;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
    border-radius: 20px; padding: 14px;
  }
  .pv-situ-shot {
    position: relative; flex: none; width: 138px; border-radius: 16px; overflow: hidden;
    border: 4px solid #160f38; box-shadow: 0 10px 24px rgba(0,0,0,.45), 0 0 0 1.5px rgba(142,135,255,.45);
  }
  .pv-situ-shot::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(155deg, rgba(255,255,255,.16), transparent 30%); }
  .pv-situ-shot img { display: block; width: 100%; height: auto; }
  .pv-situ-txt b { display: block; font: 800 16px/1.25 'Baloo 2', sans-serif; margin-bottom: 5px; }
  .pv-situ-txt span { font: 600 12.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-mu); }
  .pv-feat {
    display: flex; gap: 13px; align-items: center;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); border-radius: 16px; padding: 13px 14px;
  }
  .pv-feat-img { flex: none; width: 46px; height: 46px; object-fit: contain; filter: drop-shadow(0 5px 8px rgba(0,0,0,.45)); }
  .pv-feat b { display: block; font: 700 15px/1.3 'Baloo 2', sans-serif; }
  .pv-feat span { font: 600 13px/1.45 'Baloo 2', sans-serif; color: var(--ink-mu); }

  /* ── L'addition (ancrage) ── */
  .pv-maths { margin-top: 22px; border-radius: 20px; padding: 8px 18px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); }
  .pv-maths-row { display: flex; justify-content: space-between; align-items: baseline; padding: 13px 0; font: 500 14px Inter, sans-serif; color: var(--ink-soft); }
  .pv-maths-row + .pv-maths-row { border-top: 1px dashed rgba(255,255,255,.1); }
  .pv-maths-row b { font: 700 16px 'Baloo 2', sans-serif; color: #fff; }
  .pv-maths-row.hot { color: var(--gold); }
  .pv-maths-row.hot b { color: var(--gold); font-size: 18px; }
  .pv-maths-note { text-align: center; font: 600 12.5px/1.6 'Baloo 2', sans-serif; color: var(--ink-dim); margin: 12px 0 0; }
  .pv-maths-src { text-align: center; font: 500 10.5px/1.5 Inter, sans-serif; color: #655a97; margin: 6px 0 0; }

  /* ── Les 3 billets ── */
  .pv-pass { position: relative; display: flex; border-radius: 18px; margin-bottom: 14px; box-shadow: 0 14px 28px rgba(0,0,0,.4); }
  .pv-pass-main { flex: 1; padding: 16px 14px 15px 18px; border-radius: 18px 0 0 18px; }
  .pv-pass-cut {
    width: 116px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 8px; border-left: 2px dashed rgba(255,255,255,.25); border-radius: 0 18px 18px 0;
  }
  .pv-pass-std { background: linear-gradient(180deg, #352a6e, #2b2160); box-shadow: inset 0 2px 0 rgba(255,255,255,.12), 0 14px 28px rgba(0,0,0,.4); }
  .pv-pass-std .pv-pass-cut { border-left-color: rgba(255,255,255,.18); background: rgba(0,0,0,.18); }
  .pv-pass-name { font: 800 17px/1.2 'Baloo 2', sans-serif; }
  .pv-pass-desc { font: 600 12.5px/1.45 'Baloo 2', sans-serif; color: var(--ink-mu); margin-top: 3px; }
  .pv-pass-price { font: 800 24px/1 'Baloo 2', sans-serif; }
  .pv-pass-price small { font-size: 12px; color: var(--ink-mu); }
  .pv-pass-strike { font: 600 12px Inter, sans-serif; color: var(--ink-dim); text-decoration: line-through; }
  .pv-pass-btn {
    border: 0; cursor: pointer; border-radius: 12px; padding: 11px 14px; width: 100%;
    font: 800 13.5px 'Baloo 2', sans-serif; color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.25);
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 4px 0 var(--in-dk);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pv-pass-btn:active { transform: translateY(3px); box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 1px 0 var(--in-dk); }
  .pv-pass-btn[disabled] { opacity: .65; cursor: wait; }

  .pv-pass-gold {
    transform: scale(1.04); margin: 24px 0;
    background:
      radial-gradient(120% 90% at 15% 0%, rgba(255,255,255,.45), transparent 40%),
      linear-gradient(115deg, #f6d267 0%, #ffe9a8 25%, #eab63a 55%, #d99c1e 100%);
    color: var(--tik-ink);
    box-shadow: inset 0 2px 0 rgba(255,255,255,.7), inset 0 -3px 6px rgba(122,85,16,.5), 0 20px 40px rgba(0,0,0,.5), 0 0 60px rgba(255,206,77,.25);
  }
  .pv-pass-gold .pv-pass-name { text-shadow: 0 1px 0 rgba(255,255,255,.4); }
  .pv-pass-gold .pv-pass-desc { color: var(--tik-mu); }
  .pv-pass-gold .pv-pass-cut { border-left-color: rgba(58,42,5,.4); background: rgba(255,255,255,.14); }
  .pv-pass-gold .pv-pass-strike { color: var(--tik-lbl); }
  .pv-pass-gold .pv-pass-btn {
    background: linear-gradient(180deg, var(--in-dp), var(--in-dk));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.3), 0 4px 0 #241c6e;
  }
  .pv-pass-permo { font: 700 12px/1.3 'Baloo 2', sans-serif; color: var(--tik-mu); margin-top: 4px; }
  .pv-pass-tag {
    position: absolute; top: -11px; left: 16px; z-index: 1;
    font: 800 10.5px/1 Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #fff;
    background: #e2513f; padding: 7px 12px; border-radius: 99px; box-shadow: 0 4px 10px rgba(0,0,0,.35);
  }
  .pv-err { font: 700 13px/1.4 'Baloo 2', sans-serif; color: #ffb4a8; text-align: center; margin: 4px 0 0; display: none; }
  .pv-err.on { display: block; }

  /* ── Garantie (zone tamponnée) ── */
  .pv-stamp-zone { position: relative; margin-top: 26px; padding: 20px 18px; border-radius: 20px; border: 2px dashed rgba(88,204,2,.5); text-align: center; }
  .pv-stamp-zone b { display: block; font: 800 16.5px/1.3 'Baloo 2', sans-serif; margin-bottom: 4px; }
  .pv-stamp-zone span { font: 600 13px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); }
  .pv-stamp {
    position: absolute; top: -16px; right: 10px; transform: rotate(9deg);
    font: 800 11px/1 Inter, sans-serif; letter-spacing: .1em; text-transform: uppercase;
    color: #7ee838; border: 2.5px solid var(--go); border-radius: 8px; padding: 7px 10px;
    background: rgba(20,40,4,.6);
  }

  /* ── Preuve ── */
  .pv-proof { margin-top: 20px; }
  .pv-bar-lbl { display: flex; justify-content: space-between; font: 600 13px Inter, sans-serif; margin-bottom: 6px; color: var(--ink-soft); }
  .pv-bar { height: 12px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; margin-bottom: 14px; }
  .pv-bar span { display: block; height: 100%; border-radius: 99px; }
  .pv-bar-go span { width: 75%; background: linear-gradient(90deg, var(--go), #8aec3c); }
  .pv-bar-mu span { width: 58%; background: #5c519f; }
  .pv-src { text-align: center; font: 500 11px Inter, sans-serif; color: #655a97; margin: 0; }

  /* ── FAQ ── */
  .pv-faq details { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 15px; padding: 0 15px; margin-bottom: 9px; }
  .pv-faq summary {
    font: 700 14.5px/1.4 'Baloo 2', sans-serif; padding: 14px 0; cursor: pointer; list-style: none;
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
  }
  .pv-faq summary::-webkit-details-marker { display: none; }
  .pv-faq summary::after { content: "+"; font: 800 19px/1 'Baloo 2', sans-serif; color: var(--gold); flex: none; }
  .pv-faq details[open] summary::after { content: "–"; }
  .pv-faq p { font: 600 13.5px/1.55 'Baloo 2', sans-serif; color: var(--ink-soft); margin: 0 0 14px; }

  .pv-foot { text-align: center; padding: 36px 0 10px; font: 600 12px/1.7 'Baloo 2', sans-serif; color: var(--ink-dim); }
  .pv-foot a { color: var(--ink-soft); }

  /* ── Barre CTA collante ── */
  .pv-sticky {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    background: rgba(18,11,44,.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border-top: 1.5px solid rgba(255,206,77,.25);
    display: flex; align-items: center; gap: 12px;
  }
  .pv-sticky-inner { display: flex; align-items: center; gap: 12px; width: 100%; max-width: 480px; margin: 0 auto; }
  .pv-sticky-txt { font: 700 12.5px/1.25 'Baloo 2', sans-serif; color: var(--ink-soft); white-space: nowrap; }
  .pv-sticky-txt b { display: block; color: var(--gold); font-size: 14.5px; }
  .pv-sticky-btn {
    flex: 1; border: 0; cursor: pointer; border-radius: 14px; padding: 13px 14px;
    font: 800 15px/1 'Baloo 2', sans-serif; color: #4a3300; text-shadow: 0 1px 0 rgba(255,255,255,.35);
    background: linear-gradient(180deg, #ffe08a, var(--gold) 55%, var(--gold-dp));
    box-shadow: inset 0 2px 0 rgba(255,255,255,.55), 0 4px 0 #a86e00;
  }
  .pv-sticky-btn[disabled] { opacity: .65; cursor: wait; }

  /* ── Retour checkout ── */
  .pv-result { max-width: 400px; margin: 26px auto 0; filter: drop-shadow(0 30px 40px rgba(0,0,0,.55)); }
  .pv-result-note { text-align: center; font: 600 14px/1.6 'Baloo 2', sans-serif; color: var(--ink-soft); max-width: 340px; margin: 24px auto 0; }
  .pv-result-note strong { color: var(--gold); }
  .pv-cancel-note {
    max-width: 444px; margin: 14px auto 0; padding: 12px 16px;
    background: rgba(255,206,77,.1); border: 1.5px solid rgba(255,206,77,.35); border-radius: 14px;
    font: 700 13.5px/1.5 'Baloo 2', sans-serif; color: var(--ink-soft); text-align: center;
  }
</style>`;

/** Query params du hash (#/pass?checkout=success&plan=pass3&lang=en). */
function hashQuery() {
  const q = (location.hash.split("?")[1] || "").trim();
  return new URLSearchParams(q);
}

/** Langue : choix mémorisé > ?lang= > langue du navigateur (candidats
 *  étrangers → anglais automatique). */
function getLang() {
  const stored = localStorage.getItem("pv_lang");
  if (stored === "fr" || stored === "en") return stored;
  const p = hashQuery().get("lang");
  if (p === "fr" || p === "en") return p;
  return (navigator.language || "fr").toLowerCase().startsWith("fr")
    ? "fr"
    : "en";
}

/** Le billet d'or (hero + succès). stamped = billet validé. */
function renderTicket(L, { stamped = false } = {}) {
  return `
    <div class="pv-ticket-scene pv-rev">
      <div class="pv-ticket">
        <div class="pv-t-inner">
          <div class="pv-t-main">
            <div class="pv-t-brand"><img src="/permigo-logo.png" alt="" width="20" height="20">PERMIGO</div>
            <div class="pv-t-title">${L.tTitle}</div>
            <div class="pv-t-sub">${L.tSub}</div>
            <div class="pv-t-meta">
              <div><b>${L.tBoardLbl}</b><span>${L.tBoard}</span></div>
              <div><b>${L.tPriceLbl}</b><span>${L.tPrice}</span></div>
            </div>
          </div>
          <div class="pv-t-stub">
            <span class="n">${L.tPlace}</span>
            <span class="pv-t-place">${stamped ? "✔" : `N° <span id="pv-place-no">—</span><small>/${TOTAL_PLACES}</small>`}</span>
            <div class="pv-t-barcode"></div>
          </div>
        </div>
        <div class="pv-t-grain"></div>
        <div class="pv-t-shine"></div>
      </div>
    </div>`;
}

export async function mount(root) {
  const me = getCurUser();
  const lang = getLang();
  const L = STR[lang];
  const q = hashQuery();
  const checkout = q.get("checkout");
  const planParam = q.get("plan");

  track("pass.view", {
    logged: !!me,
    lang,
    checkout_return: checkout || "none",
  });

  // ── Retour succès : billet tamponné, pas de re-vente ──
  if (checkout === "success") {
    track("pass.checkout_success", { plan: planParam || "?" });
    const label = L.planLabels[planParam] || "Pass Permis";
    root.innerHTML = `${STYLE}
      <div class="pv">
        <header class="pv-nav">
          <a class="pv-badge-p" href="#/pass" aria-label="PermiGo"><img src="/permigo-logo.png" alt=""></a>
        </header>
        <div class="pv-wrap">
          <div class="pv-result">${renderTicket(L, { stamped: true })}</div>
          <div class="pv-result-note"><strong>${L.successT}</strong><br>${label}. ${L.successD}</div>
        </div>
        <footer class="pv-foot">${L.foot}</footer>
      </div>`;
    root.querySelectorAll(".pv-rev").forEach((el) => el.classList.add("in"));
    return;
  }

  const P = L.passes;
  root.innerHTML = `${STYLE}
  <div class="pv">

    <header class="pv-nav">
      <a class="pv-badge-p" href="#/" aria-label="PermiGo"><img src="/permigo-logo.png" alt=""></a>
      <div class="pv-nav-right">
        <button class="pv-lang" id="pv-lang" type="button" aria-label="Switch language">${L.langBtn}</button>
        ${me ? "" : `<button class="pv-login" id="pv-login" type="button">${L.login}</button>`}
      </div>
    </header>

    ${checkout === "cancel" ? `<div class="pv-cancel-note">${L.cancelNote}</div>` : ""}

    <div class="pv-wrap">

      <!-- ── Hero ── -->
      <section class="pv-hero">
        <div class="pv-kicker">${L.kicker}</div>
        <h1 class="pv-h1">${L.h1}</h1>
        <p class="pv-lead">${L.lead}</p>
      </section>

      ${renderTicket(L)}

      <div class="pv-counter" id="pv-counter" hidden>
        <div class="pv-pips" id="pv-pips"></div>
        <b id="pv-count-txt"></b>
      </div>

      <button class="pv-cta-hero" data-plan="pass3" type="button">${L.cta}</button>
      <p class="pv-cta-note">${L.ctaNote}</p>

      <!-- ── Scène Arène : l'app que tu reçois ── -->
      <div class="pv-stage pv-rev" aria-hidden="true">
        <div class="pv-phone"><img src="/showcase/eleve-parcours.png" alt="" width="390" height="844" loading="lazy" decoding="async"></div>
        <img class="pv-coin" src="/skins/volant-coin.webp" alt="" loading="lazy" decoding="async">
        <img class="pv-mascot" src="/skins/mascot-celebrate.png" alt="" loading="lazy" decoding="async">
        <div class="pv-bulle">${L.bulle}<small>${L.bulleSub}</small></div>
      </div>

      <!-- ── Pas une app de code ── -->
      <h2 class="pv-sec-title pv-rev">${L.secCode}</h2>
      <p class="pv-sec-sub">${L.secCodeSub}</p>

      <div class="pv-conduite pv-rev">
        <div class="pv-situ">
          <div class="pv-situ-shot"><img src="/showcase/eleve-en-situation.png" alt="${L.situAlt}" loading="lazy" decoding="async"></div>
          <div class="pv-situ-txt">
            <b>${L.situTitle}</b>
            <span>${L.situTxt}</span>
          </div>
        </div>
        ${L.feats
          .map(
            (f) => `
        <div class="pv-feat">
          ${
            f.mask
              ? `<span class="pv-feat-img" style="display:grid;place-items:center">${illMask(f.mask, { size: 40, color: "var(--gold)" })}</span>`
              : `<img class="pv-feat-img" src="${f.img}" alt="" loading="lazy" decoding="async">`
          }
          <div><b>${f.t}</b><span>${f.d}</span></div>
        </div>`,
          )
          .join("")}
      </div>

      <!-- ── L'addition ── -->
      <div class="pv-maths pv-rev">
        ${L.mathsRows
          .map(
            ([lbl, val], i) =>
              `<div class="pv-maths-row${i === 2 ? " hot" : ""}"><span>${lbl}</span><b>${val}</b></div>`,
          )
          .join("")}
      </div>
      <p class="pv-maths-note">${L.mathsNote}</p>
      <p class="pv-maths-src">${L.mathsSrc}</p>

      <!-- ── Les 3 billets ── -->
      <h2 class="pv-sec-title pv-rev" id="pv-pricing">${L.secPass}</h2>
      <p class="pv-sec-sub">${L.secPassSub}</p>

      <article class="pv-pass pv-pass-std pv-rev">
        <div class="pv-pass-main">
          <div class="pv-pass-name">${P.mensuel.name}</div>
          <div class="pv-pass-desc">${P.mensuel.desc}</div>
        </div>
        <div class="pv-pass-cut">
          <div class="pv-pass-price">${P.mensuel.price}<small>${P.mensuel.per}</small></div>
          <button class="pv-pass-btn" data-plan="mensuel" type="button">${P.mensuel.btn}</button>
        </div>
      </article>

      <article class="pv-pass pv-pass-gold pv-rev">
        <span class="pv-pass-tag">${P.pass3.tag}</span>
        <div class="pv-pass-main">
          <div class="pv-pass-name">${P.pass3.name}</div>
          <div class="pv-pass-desc">${P.pass3.desc}</div>
          <div class="pv-pass-permo">${P.pass3.permo}</div>
        </div>
        <div class="pv-pass-cut">
          <div class="pv-pass-strike">${P.pass3.strike}</div>
          <div class="pv-pass-price">${P.pass3.price}</div>
          <button class="pv-pass-btn" data-plan="pass3" type="button">${P.pass3.btn}</button>
        </div>
      </article>

      <article class="pv-pass pv-pass-std pv-rev">
        <div class="pv-pass-main">
          <div class="pv-pass-name">${P.pass6.name}</div>
          <div class="pv-pass-desc">${P.pass6.desc}</div>
        </div>
        <div class="pv-pass-cut">
          <div class="pv-pass-strike">${P.pass6.strike}</div>
          <div class="pv-pass-price">${P.pass6.price}</div>
          <button class="pv-pass-btn" data-plan="pass6" type="button">${P.pass6.btn}</button>
        </div>
      </article>

      <p class="pv-err" id="pv-err">${L.err}</p>

      <div class="pv-stamp-zone pv-rev">
        <span class="pv-stamp">${L.stampTag}</span>
        <b>${L.stampT}</b>
        <span>${L.stampD}</span>
      </div>

      <!-- ── Preuve ── -->
      <h2 class="pv-sec-title pv-rev">${L.secProof}</h2>
      <div class="pv-proof pv-rev">
        <div class="pv-bar-lbl"><span>${L.proofA}</span><span>75 %</span></div>
        <div class="pv-bar pv-bar-go"><span></span></div>
        <div class="pv-bar-lbl"><span>${L.proofB}</span><span>58 %</span></div>
        <div class="pv-bar pv-bar-mu"><span></span></div>
        <p class="pv-src">${L.proofSrc}</p>
      </div>

      <!-- ── FAQ ── -->
      <section class="pv-faq pv-rev">
        <h2 class="pv-sec-title">${L.secFaq}</h2>
        <div style="margin-top:16px">
          ${L.faq
            .map(
              ([sq, sa]) => `
          <details>
            <summary>${sq}</summary>
            <p>${sa}</p>
          </details>`,
            )
            .join("")}
        </div>
      </section>

      <footer class="pv-foot">${L.foot}</footer>
    </div>

    <!-- ── CTA collant ── -->
    <div class="pv-sticky">
      <div class="pv-sticky-inner">
        <div class="pv-sticky-txt">${L.stickyName}<b>${L.stickyPrice}</b></div>
        <button class="pv-sticky-btn" data-plan="pass3" type="button">${L.stickyBtn}</button>
      </div>
    </div>

  </div>`;

  wire(root, me, lang, L);
  wireReveal(root);
  loadFounderCount(root, L);
}

/** Révélation au scroll : .pv-rev → .in à l'entrée dans le viewport. */
function wireReveal(root) {
  const els = [...root.querySelectorAll(".pv-rev")];
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  if (reduced || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -60px 0px", threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}

/** Jauge de places : chiffre RÉEL (RPC publique pass_founder_count). En cas
 *  d'échec, la jauge reste cachée et le billet garde « N° — » (pas de faux chiffre). */
async function loadFounderCount(root, L) {
  try {
    const { data, error } = await sb.rpc("pass_founder_count");
    if (error) throw error;
    const taken = Math.max(0, Math.min(TOTAL_PLACES, Number(data) || 0));
    // Numéro du billet = prochaine place libre.
    const no = root.querySelector("#pv-place-no");
    if (no)
      no.textContent = String(Math.min(taken + 1, TOTAL_PLACES)).padStart(
        2,
        "0",
      );
    // Jauge 10 crans pour 20 places (1 cran = 2 places).
    const pips = root.querySelector("#pv-pips");
    const txt = root.querySelector("#pv-count-txt");
    const counter = root.querySelector("#pv-counter");
    if (pips && txt && counter) {
      const lit = Math.round((taken / TOTAL_PLACES) * 10);
      pips.innerHTML = Array.from(
        { length: 10 },
        (_, i) => `<i class="pv-pip${i < lit ? " on" : ""}"></i>`,
      ).join("");
      txt.textContent = taken > 0 ? L.counterSome(taken) : L.counterZero;
      counter.hidden = false;
    }
  } catch (e) {
    console.warn("[pass] founder count", e);
  }
}

function wire(root, me, lang, L) {
  const err = root.querySelector("#pv-err");

  root.querySelector("#pv-login")?.addEventListener("click", () => {
    location.hash = "#/login";
  });

  // Bascule FR/EN : mémorise le choix puis re-rend la page entière.
  root.querySelector("#pv-lang")?.addEventListener("click", () => {
    const next = lang === "fr" ? "en" : "fr";
    localStorage.setItem("pv_lang", next);
    track("pass.lang_switch", { lang: next });
    mount(root);
  });

  // Un clic = une session Checkout. On fige TOUS les boutons le temps de la
  // redirection (double-tap mobile = double session sinon).
  const btns = [...root.querySelectorAll("[data-plan]")];
  btns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const plan = btn.dataset.plan;
      track("pass.checkout_click", { plan, lang, logged: !!me });
      err?.classList.remove("on");
      btns.forEach((b) => (b.disabled = true));
      const prev = btn.textContent;
      btn.textContent = L.btnWait;
      try {
        await startPassCheckout(plan);
        // Succès = redirection : on ne repasse jamais ici.
      } catch (e) {
        console.error("[pass] checkout", e);
        track("pass.checkout_error", { plan });
        btns.forEach((b) => (b.disabled = false));
        btn.textContent = prev;
        err?.classList.add("on");
        err?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  });
}
