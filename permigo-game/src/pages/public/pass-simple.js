// ═══════════════════════════════════════════════════════════════
// La page de vente — « Avant la route, il y a PermiGo »
//
// Refonte du 08/08/2026, brief de Rayan : « je trouve la page trop site créé
// par IA / template SaaS. PermiGo doit avoir SON univers. »
//
// ⚠️ CE QUI FAISAIT « TEMPLATE », ET CE N'ÉTAIT PAS LA COULEUR.
// L'ancienne page empilait TROIS FOIS LA MÊME COMPOSITION : un titre centré,
// puis un rail de cartes arrondies. Titre centré, rail. Titre centré, rail.
// C'est cette répétition qui se lit comme un gabarit, pas le violet ni la
// typo. La règle qui remplace : UNE COMPOSITION PAR SÉQUENCE, JAMAIS DEUX
// FOIS LA MÊME. Plein écran, puis presque vide, puis une bande qui défile,
// puis un mur d'images. Le regard ne doit jamais reconnaître le motif.
//
// Trois trous relevés dans l'audit, tous les trois comblés ici :
// 1. Les 31 illustrations de compétences (public/cartes/) n'étaient NULLE
//    PART sur la landing. Le plus bel asset du projet dormait. Elles font
//    maintenant la séquence 06.
// 2. AUCUN sélecteur de langue. La page était traduite en 3 langues et un
//    visiteur ne pouvait pas le deviner. Or « mon moniteur parle une langue
//    que je comprends mal » est notre meilleur argument à l'international.
//    Il a maintenant sa propre séquence plein écran (05), et le sélecteur
//    est visible dès le premier écran.
// 3. On ne voyait JAMAIS l'application. On vendait une app invisible.
//
// ── Ce qui ne bouge pas, et pourquoi ──
//
// ⛔ La route `#/pass` et le circuit Stripe. L'edge function `pass-checkout`
//    est déployée avec `success_url` EN DUR sur #/pass : l'acheteur y revient
//    après paiement. Supprimer la page ou la route casse le retour de
//    paiement en production.
// ⛔ Le décor de route (route-backdrop.js). C'est l'univers PermiGo, il vient
//    d'être repassé en 4K et découpé par format d'écran.
// ⛔ La scène jouable du camion. Elle reste HAUT dans la page : on fait
//    essayer avant de demander quoi que ce soit (la leçon Duolingo, +20 %
//    d'actifs en déplaçant l'inscription derrière la première leçon).
//
// ── Règles d'écriture maison appliquées partout ──
// Zéro tiret dans un texte affiché. Zéro virgule dans un titre ou un bouton.
// Le point médian `·` pour accoler deux informations. Et zéro écriture
// inclusive : on reformule pour que la question du genre ne se pose pas
// (« tu montes en sachant quoi faire », jamais « tu arrives prêt·e »).
// ═══════════════════════════════════════════════════════════════
import { getLang, applyLang, LANGS, isRTL } from "@/utils/lang.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { startPassCheckout } from "@/services/billing.js";
import { fbTrack } from "@/services/meta-pixel.js";
import { AVIS } from "@/data/avis-eleves.js";
import { mountDemoSituation } from "@/components/public/demo-situation.js";
import {
  BACKDROP_STYLE,
  backdropHTML,
  wireBackdrop,
} from "@/components/public/route-backdrop.js";

const LOGO = "/p-badge.webp";

// Les illustrations de compétences, déjà dans l'app depuis juin. Elles ont
// toutes le même univers que la route de montagne du décor : même palette,
// mêmes facettes. On en prend 12 sur 31 — assez pour que le mur donne le
// vertige, pas assez pour peser un mégaoctet. Toutes en chargement différé,
// elles sont très bas dans la page.
const CARTES = [
  "c1c",
  "c2f",
  "c1f",
  "c3b",
  "c2a",
  "c4c",
  "c1h",
  "c2e",
  "c3f",
  "c1a",
  "c4a",
  "c2h",
];

// Le libellé court des langues. Pas de drapeau : un drapeau désigne un PAYS,
// pas une langue, et l'arabe n'en a pas un seul.
const LANG_COURT = { fr: "FR", en: "EN", ar: "ع" };

const STR = {
  fr: {
    login: "Se connecter",
    // Deux lignes et deux rôles. La 1re est la marque, faite pour être
    // retenue et reconnue sans le logo. La 2e explique, et un inconnu qui
    // arrive de TikTok comprend en deux secondes.
    h1a: "Avant la route,",
    h1b: "il y a PermiGo.",
    lead: "Tu sais ce que tu vas travailler avant de monter en voiture.",
    cta: "Commencer gratuitement",
    ctaNote: "3 leçons de l'app offertes · sans carte bancaire",

    probA: "Une heure de conduite.",
    probB: "Puis rien pendant six jours.",
    probC: "PermiGo remplit ce vide.",
    probLegend: "Une semaine d'élève. Une seule heure au volant.",

    howTitle: "Comment ça marche",
    how: [
      "Ta prochaine compétence arrive.",
      "Tu la comprends.",
      "Tu t'entraînes dessus.",
      "Tu montes en sachant quoi faire.",
    ],

    demoTitle: "Une scène. Une décision.",

    cutA: "Tu la prépares ici.",
    cutB: "Tu la conduis là.",

    langKicker: "Français · English · العربية",
    langFixe: "Ton moniteur parle français.",
    langTourne: [
      "PermiGo t'explique dans ta langue.",
      "PermiGo explains it in yours.",
      "بيرميغو يشرح لك بلغتك.",
    ],
    langNote: "La règle française reste écrite dessous. Tu apprends les deux.",

    progKicker: "31 compétences",
    progTitle: "Une par une jusqu'au permis.",
    progNote: "Tu vois où tu en es. Tout le temps.",

    avisTitle: "Ils l'utilisent déjà",
    avisAge: "ans",

    price: "4,99 €",
    priceOnly: "seulement",
    priceSub: "Par mois. Sans engagement.",
    priceWhat:
      "Les 31 leçons au lieu de 3 · scènes et questions sans limite · le Mode Pilote",
    priceBtn: "Tout débloquer",
    finTitle: "Commence avant ta prochaine heure.",
    btnWait: "Ouverture du paiement…",
    err: "Le paiement n'a pas pu démarrer. Réessaie.",
    foot: "Paiement sécurisé par Stripe · Remboursé sous 3 jours",
    legal: "Mentions légales",
  },
  en: {
    login: "Log in",
    h1a: "Before the road,",
    h1b: "there is PermiGo.",
    lead: "You know what you will work on before you drive.",
    cta: "Start for free",
    ctaNote: "3 in-app lessons free · no card needed",

    probA: "One hour of driving.",
    probB: "Then nothing for six days.",
    probC: "PermiGo fills that gap.",
    probLegend: "A learner's week. One single hour at the wheel.",

    howTitle: "How it works",
    how: [
      "Your next skill comes up.",
      "You understand it.",
      "You practise it.",
      "You drive off knowing what to do.",
    ],

    demoTitle: "One scene. One decision.",

    cutA: "You prepare it here.",
    cutB: "You drive it there.",

    langKicker: "Français · English · العربية",
    langFixe: "Your instructor speaks French.",
    langTourne: [
      "PermiGo explains it in your language.",
      "PermiGo t'explique dans ta langue.",
      "بيرميغو يشرح لك بلغتك.",
    ],
    langNote: "The French wording stays underneath. You learn both.",

    progKicker: "31 skills",
    progTitle: "One by one all the way to the licence.",
    progNote: "You always see where you stand.",

    avisTitle: "They already use it",
    avisAge: "years old",

    price: "€4.99",
    priceOnly: "only",
    priceSub: "Per month. No commitment.",
    priceWhat:
      "All 31 lessons instead of 3 · scenes and questions with no limit · the full Pilot mode",
    priceBtn: "Unlock everything",
    finTitle: "Start before your next hour.",
    btnWait: "Opening payment…",
    err: "Payment could not start. Please try again.",
    foot: "Secure payment by Stripe · Money back within 3 days",
    legal: "Legal notice",
  },
  ar: {
    login: "تسجيل الدخول",
    h1a: "قبل الطريق،",
    h1b: "هناك بيرميغو.",
    lead: "تعرف ما ستشتغل عليه قبل أن تركب السيارة.",
    cta: "ابدأ مجاناً",
    ctaNote: "3 دروس داخل التطبيق مجاناً · بلا بطاقة بنكية",

    probA: "ساعة قيادة واحدة.",
    probB: "ثم لا شيء طوال ستة أيام.",
    probC: "بيرميغو يملأ هذا الفراغ.",
    probLegend: "أسبوع متعلّم. ساعة واحدة خلف المقود.",

    howTitle: "كيف يعمل",
    how: [
      "تظهر مهارتك التالية.",
      "تفهمها.",
      "تتدرّب عليها.",
      "تركب وأنت تعرف ما تفعل.",
    ],

    demoTitle: "مشهد. قرار.",

    cutA: "تحضّرها هنا.",
    cutB: "تقودها هناك.",

    langKicker: "Français · English · العربية",
    langFixe: "مدرّبك يتكلّم الفرنسية.",
    langTourne: [
      "بيرميغو يشرح لك بلغتك.",
      "PermiGo explains it in yours.",
      "PermiGo t'explique dans ta langue.",
    ],
    langNote: "القاعدة الفرنسية تبقى مكتوبة تحته. تتعلّم الاثنين.",

    progKicker: "31 مهارة",
    progTitle: "واحدة تلو الأخرى حتى الرخصة.",
    progNote: "ترى دائماً أين وصلت.",

    avisTitle: "يستعملونه فعلاً",
    avisAge: "سنة",

    price: "€4.99",
    priceOnly: "فقط",
    priceSub: "شهرياً. بلا التزام.",
    priceWhat:
      "الدروس الـ31 بدل 3 · مشاهد وأسئلة بلا حدود · نمط القيادة كاملاً",
    priceBtn: "افتح كل شيء",
    finTitle: "ابدأ قبل ساعتك القادمة.",
    btnWait: "جارٍ فتح الدفع…",
    err: "تعذّر بدء الدفع. حاول مرة أخرى.",
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
    .slice(0, 2)
    .toUpperCase();

const STYLE = `<style>
  .pg {
    --gold:#ffcb3d; --in:#5b4bdb; --in-lt:#7d70ec; --in-dp:#4436b8; --in-dk:#33279a;
    --ink:#f4f1ff; --ink-soft:#cdc8ec; --ink-mu:#aaa2d8; --ink-dim:#8b7fc4;
    position: relative; z-index: 1; color: var(--ink);
    font-family: 'Archivo', system-ui, sans-serif;
    overflow-x: clip;
    padding-bottom: calc(28px + env(safe-area-inset-bottom));
  }
  /* Le décor fixe passe dessous. Cette page n'a pas de fond à elle. */
  .pg, .pg * { -webkit-tap-highlight-color: transparent; }

  .pg-wrap { max-width: 560px; margin: 0 auto; padding: 0 20px; }
  @media (min-width: 900px) { .pg-wrap { max-width: 720px; } }

  /* ══════════ La barre du haut ══════════
     Le sélecteur de langue vit ICI, visible dès la première seconde. Avant, la
     page était traduite en 3 langues sans que personne puisse le deviner. */
  .pg-nav {
    position: relative; z-index: 3;
    display: flex; align-items: center; gap: 10px;
    padding: calc(12px + env(safe-area-inset-top)) 20px 0;
    max-width: 560px; margin: 0 auto;
  }
  @media (min-width: 900px) { .pg-nav { max-width: 720px; } }
  .pg-nav img { height: 34px; width: auto; display: block; }
  .pg-nav-sp { flex: 1; }
  .pg-langs { display: flex; gap: 2px; padding: 3px; border-radius: 999px; background: rgba(12,7,32,.42); }
  .pg-lang {
    min-width: 34px; min-height: 30px; padding: 0 9px; border: 0; border-radius: 999px;
    background: none; cursor: pointer; color: var(--ink-mu);
    font: 800 12px/1 'Archivo', sans-serif;
  }
  .pg-lang[aria-pressed="true"] { background: rgba(255,255,255,.15); color: #fff; }
  .pg-login {
    min-height: 38px; padding: 0 15px; border-radius: 999px; cursor: pointer;
    border: 1px solid rgba(255,255,255,.2); background: rgba(12,7,32,.42);
    color: var(--ink); font: 700 13.5px/1 'Archivo', sans-serif;
  }

  /* ══════════ 01 · La promesse ══════════
     Plein écran, texte EN BAS. ⚠️ Ce n'est pas un choix esthétique : le ciel
     de l'illustration est clair, un titre posé en haut oblige à noircir le
     ciel et l'image disparaît. En bas, la route se voit en grand. */
  .pg-hero {
    min-height: min(92svh, 100svh - 150px); display: flex; flex-direction: column; justify-content: flex-end;
    padding: 0 20px 26px; max-width: 560px; margin: 0 auto;
  }
  @media (min-width: 900px) { .pg-hero { max-width: 720px; } }
  /* ⚠️ LE BANDEAU COOKIES FAIT 110 px ET SE POSE EN BAS, par-dessus la page.
     Le bouton passait dessous : mesuré sur iPhone SE, recouvert de 63 px,
     donc pas cliquable au premier geste.
     ⚠️ Un simple seuil en hauteur d'écran NE SUFFIT PAS : le résultat basculait
     d'un essai à l'autre sur iPhone 13 en anglais, où le sous-titre prend une
     ligne de plus. Une mise en page limite bascule aussi sur un vrai
     téléphone. On garantit donc l'écart partout, quelle que soit la taille :
     le premier écran s'arrête 150 px avant le bas. La séquence suivante
     dépasse, ce qui donne envie de faire défiler. */
  /* La typo EST le graphisme. Aligné à gauche : le texte centré sur texte
     centré est la signature n°1 du gabarit SaaS. */
  .pg-h1 {
    margin: 0; font: 900 clamp(38px, 12.4vw, 62px)/.98 'Archivo', sans-serif;
    letter-spacing: -.035em; text-wrap: balance;
    text-shadow: 0 3px 22px rgba(12,7,32,.85);
  }
  .pg-h1 span { display: block; }
  .pg-h1 .b { color: var(--gold); }
  .pg-lead {
    margin: 14px 0 0; max-width: 22ch;
    font: 600 clamp(15px, 4.2vw, 18px)/1.45 'Archivo', sans-serif; color: var(--ink-soft);
    text-shadow: 0 2px 10px rgba(12,7,32,.9);
  }
  .pg-cta {
    display: block; width: 100%; margin: 22px 0 0; min-height: 56px;
    border: 0; border-radius: 17px; cursor: pointer;
    font: 800 16.5px/1 'Archivo', sans-serif; color: #2a1a00;
    background: linear-gradient(180deg, #ffdc7a, var(--gold) 52%, #f0a81f);
    box-shadow: inset 0 2.5px 0 rgba(255,255,255,.6), 0 6px 0 #b87b09, 0 16px 30px -12px rgba(0,0,0,.7);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pg-cta:active { transform: translateY(4px); box-shadow: inset 0 2.5px 0 rgba(255,255,255,.6), 0 2px 0 #b87b09; }
  .pg-cta-note {
    margin: 11px 0 0; text-align: center;
    font: 600 12.5px/1.5 'Archivo', sans-serif; color: var(--ink-mu);
    text-shadow: 0 2px 8px rgba(12,7,32,.9);
  }

  /* ══════════ 02 · Le problème ══════════
     Composition volontairement PRESQUE VIDE. C'est le contraste avec le
     premier écran qui fait respirer la page. */
  .pg-prob { padding: 18svh 0 14svh; }
  /* ⚠️ Classe explicite et PAS « .pg-prob p » : ce sélecteur-là (0,1,1) écrasait
     « .pg-legend » (0,1,0) et la légende s'affichait en 40 px comme un titre.
     Styler un élément nu depuis un conteneur, c'est se tirer dessus dès qu'un
     autre style veut passer. */
  .pg-prob .big {
    margin: 0; font: 900 clamp(26px, 8vw, 40px)/1.12 'Archivo', sans-serif;
    letter-spacing: -.03em; color: var(--ink);
  }
  .pg-prob .dim { color: var(--ink-dim); margin-top: 8px; }
  .pg-prob .out { color: var(--gold); margin-top: 9svh; }
  /* Les 7 jours de la semaine : un seul point allumé. Aucune icône, aucune
     bibliothèque, et ça se comprend sans légende. */
  .pg-week { display: flex; gap: 9px; margin: 6svh 0 14px; }
  .pg-week i {
    flex: 1; height: 10px; border-radius: 3px; background: rgba(255,255,255,.13);
  }
  .pg-week i.on { background: var(--gold); box-shadow: 0 0 22px rgba(255,203,61,.55); }
  .pg-legend { margin: 0; font: 600 12.5px/1.5 'Archivo', sans-serif; color: var(--ink-dim); }

  /* ══════════ 03 · Comment ça marche ══════════
     Quatre temps sur une ligne verticale. Les chiffres en contour sont
     l'élément graphique : pas d'icône, pas de carte. */
  .pg-sec { padding: 10svh 0; }
  .pg-kicker {
    margin: 0 0 10px; font: 800 12px/1 'Archivo', sans-serif;
    letter-spacing: .2em; text-transform: uppercase; color: var(--gold);
  }
  .pg-h2 {
    margin: 0 0 6px; font: 900 clamp(25px, 7.4vw, 38px)/1.1 'Archivo', sans-serif;
    letter-spacing: -.03em; color: var(--ink); text-wrap: balance;
  }
  .pg-steps { list-style: none; margin: 26px 0 0; padding: 0; position: relative; }
  .pg-steps::before {
    content: ""; position: absolute; inset-inline-start: 21px; top: 12px; bottom: 22px;
    width: 2px; background: linear-gradient(180deg, var(--gold), rgba(255,203,61,.08));
  }
  .pg-step {
    position: relative; display: flex; align-items: center; gap: 16px;
    padding: 13px 0; min-height: 52px;
  }
  .pg-step b {
    position: relative; z-index: 1; flex: 0 0 44px; height: 44px;
    display: grid; place-items: center; border-radius: 50%;
    background: #1b1246; border: 2px solid var(--gold);
    font: 900 15px/1 'Archivo', sans-serif; color: var(--gold);
    font-variant-numeric: tabular-nums;
  }
  .pg-step span { font: 700 clamp(16px, 4.6vw, 20px)/1.3 'Archivo', sans-serif; }

  /* ══════════ 04 · La démonstration ══════════
     Bord à bord, sans cadre de téléphone : « pas simplement un iPhone mockup
     posé au milieu ». La scène EST l'écran. */
  .pg-demo-w { padding: 7svh 0 9svh; }
  .pg-demo {
    margin-inline: -20px; padding: 18px 14px 20px;
    background: linear-gradient(180deg, rgba(30,22,74,.92), rgba(16,11,46,.96));
    border-top: 1px solid rgba(255,203,61,.22); border-bottom: 1px solid rgba(255,203,61,.22);
  }
  @media (min-width: 620px) { .pg-demo { margin-inline: 0; border-radius: 26px; border: 1px solid rgba(255,203,61,.22); } }

  /* ══════════ 04 bis · Le raccord ══════════
     La scène de l'app, puis la meme scene vue de la route. Les deux images
     occupent EXACTEMENT le meme cadre : c'est ce qui fait le raccord. La
     premiere s'agrandit et s'efface, la route est dessous depuis le debut.

     ⚠️ Pilote a l'INTERSECTION OBSERVER, pas a la timeline de defilement.
     Le cadre a un overflow:hidden (obligatoire pour rogner l'agrandissement),
     or un overflow:hidden cree un conteneur de defilement et fige
     'animation-timeline: view()' a zero SANS la moindre erreur. Piege deja
     paye, on ne le repaie pas.

     ⚠️ La video est un plan de l'univers PermiGo, pas une prise de vue reelle.
     Une image filmee au milieu d'une page entierement illustree casserait la
     direction artistique. Point de depart = la carte de competence C1a, deja
     dans l'app : seul le mouvement est genere. */
  .pg-cut-w { padding: 4svh 0 10svh; }
  .pg-cut-t { margin: 0 0 6px; }
  .pg-cut-t .b { color: var(--gold); }
  .pg-cut {
    position: relative; margin-top: 20px; border-radius: 22px; overflow: hidden;
    aspect-ratio: 3 / 2; background: #16103f;
    box-shadow: 0 24px 50px -22px rgba(0,0,0,.85);
    border: 1px solid rgba(255,203,61,.2);
  }
  .pg-cut video, .pg-cut-app {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; display: block;
  }
  .pg-cut-app {
    z-index: 1; transform: scale(1); opacity: 1;
    transition: transform 1.15s cubic-bezier(.45,0,.2,1), opacity .8s ease .35s;
  }
  /* Le raccord : la scene de l'app avance vers nous et disparait, la route
     etait deja derriere. On ne coupe pas, on traverse. */
  .pg-cut.passe .pg-cut-app { transform: scale(1.7); opacity: 0; }
  .pg-cut-lg {
    position: absolute; z-index: 2; inset-inline-start: 14px; bottom: 12px;
    padding: 6px 12px; border-radius: 999px; background: rgba(12,7,32,.62);
    font: 800 12px/1 'Archivo', sans-serif; color: var(--ink-soft);
  }

  /* ══════════ 05 · Ta langue ══════════
     La séquence la plus importante de la page. Elle n'existait pas.
     Une phrase fixe, puis une phrase qui TOURNE dans les trois langues.
     Aucun drapeau : un drapeau désigne un pays, pas une langue. */
  .pg-lang-sec { padding: 10svh 0; text-align: center; }
  .pg-fixe {
    margin: 0; font: 700 clamp(17px, 4.8vw, 22px)/1.35 'Archivo', sans-serif; color: var(--ink-mu);
  }
  .pg-rot {
    display: grid; margin-top: 12px; min-height: 3.2em;
  }
  .pg-rot b {
    grid-area: 1 / 1; align-self: center;
    font: 900 clamp(24px, 7.2vw, 36px)/1.2 'Archivo', sans-serif;
    letter-spacing: -.025em; color: var(--gold);
    opacity: 0; transform: translateY(9px);
    /* ⚠️ PAS de fondu croise. Les trois phrases occupent la MEME case de
       grille : si l'entrante monte pendant que la sortante descend, les deux
       sont peintes en meme temps et on lit deux textes superposes (constate a
       l'ecran). La sortante s'efface vite, l'entrante attend son tour. */
    transition: opacity .22s ease, transform .22s ease;
  }
  .pg-rot b.on {
    opacity: 1; transform: none;
    transition: opacity .4s ease .24s, transform .4s cubic-bezier(.2,.7,.3,1) .24s;
  }
  .pg-lang-note {
    margin: 16px auto 0; max-width: 30ch;
    font: 600 13.5px/1.6 'Archivo', sans-serif; color: var(--ink-dim);
  }

  /* ══════════ 06 · La progression ══════════
     Le mur des compétences. Deux bandes qui glissent en sens contraire.
     Ces 31 illustrations existaient depuis juin et n'étaient nulle part. */
  .pg-mur { padding: 6svh 0 12svh; }
  .pg-bande { display: flex; gap: 12px; width: max-content; margin-bottom: 12px; }
  .pg-bande img {
    width: 190px; height: 127px; object-fit: cover; border-radius: 15px; display: block;
    box-shadow: 0 16px 30px -14px rgba(0,0,0,.85);
  }
  .pg-rail { overflow: hidden; margin-inline: -20px; -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
  @keyframes pgGlisseA { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes pgGlisseB { from { transform: translateX(-50%); } to { transform: translateX(0); } }
  .pg-rail-a .pg-bande { animation: pgGlisseA 42s linear infinite; }
  .pg-rail-b .pg-bande { animation: pgGlisseB 52s linear infinite; }

  /* ══════════ Les avis ══════════
     UN avis en grand, pas trois cartes en rang. Les pastilles d'initiales
     dans un rond étaient le cliché le plus reconnaissable de la page. */
  .pg-avis { padding: 8svh 0 4svh; }
  .pg-avis blockquote {
    margin: 0; font: 700 clamp(19px, 5.4vw, 26px)/1.4 'Archivo', sans-serif;
    letter-spacing: -.02em; color: var(--ink); text-wrap: pretty;
  }
  .pg-avis figcaption {
    margin-top: 14px; font: 600 13.5px/1.5 'Archivo', sans-serif; color: var(--ink-dim);
  }

  /* ══════════ 07 · Le prix, puis le bouton ══════════ */
  .pg-fin { padding: 6svh 0 0; }
  .pg-fin-t {
    margin: 0 0 20px; font: 900 clamp(26px, 7.6vw, 40px)/1.1 'Archivo', sans-serif;
    letter-spacing: -.03em; text-wrap: balance;
  }
  .pg-price {
    text-align: center; border-radius: 24px; padding: 26px 20px;
    background: linear-gradient(180deg, rgba(38,32,89,.86), rgba(20,15,56,.9));
    border: 1.5px solid rgba(255,203,61,.34);
    box-shadow: 0 24px 50px -20px rgba(0,0,0,.85), inset 0 1.5px 0 rgba(255,255,255,.14);
  }
  /* ⚠️ Le montant et le mot ne doivent PAS avoir la même taille : en 44px
     tous les deux, « 4,99 € seulement » se cassait en deux lignes qui se
     lisaient comme deux titres empilés. */
  .pg-price-big {
    font: 900 clamp(40px, 12vw, 52px)/1 'Archivo', sans-serif;
    color: var(--gold); margin: 0; letter-spacing: -.02em;
    font-variant-numeric: tabular-nums; text-shadow: 0 2px 0 rgba(90,50,0,.5);
  }
  .pg-price-only {
    display: block; margin: 6px 0 9px;
    font: 800 13px/1 'Archivo', sans-serif; letter-spacing: .22em;
    text-transform: uppercase; color: var(--gold); opacity: .82;
  }
  /* ⚠️ L'arabe s'écrit attaché : un letter-spacing écarte les lettres et
     étire leur trait de liaison, si bien que le mot s'affiche souligné d'une
     barre. L'espacement et les majuscules ne valent que pour le latin. */
  [dir="rtl"] .pg-price-only,
  [dir="rtl"] .pg-kicker { letter-spacing: 0; text-transform: none; }
  .pg-price-sub { margin: 0; font: 600 13.5px/1.5 'Archivo', sans-serif; color: var(--ink-soft); }
  .pg-price-what {
    margin: 13px auto 0; max-width: 30ch; padding-top: 13px;
    border-top: 1px solid rgba(255,203,61,.24);
    font: 600 13px/1.65 'Archivo', sans-serif; color: var(--ink-mu);
  }
  .pg-price-btn {
    display: block; width: 100%; margin: 18px auto 0; min-height: 54px;
    border: 0; border-radius: 16px; cursor: pointer;
    font: 800 15.5px/1 'Archivo', sans-serif; color: #fff;
    background: linear-gradient(180deg, var(--in-lt), var(--in) 55%, var(--in-dp));
    box-shadow: inset 0 2.5px 0 rgba(255,255,255,.35), 0 5px 0 var(--in-dk);
    transition: transform .1s ease, box-shadow .1s ease;
  }
  .pg-price-btn:active { transform: translateY(3px); box-shadow: inset 0 2.5px 0 rgba(255,255,255,.35), 0 1px 0 var(--in-dk); }
  .pg-err {
    display: none; margin: 12px 0 0; padding: 11px 13px; border-radius: 13px;
    background: rgba(179,18,43,.2); border: 1px solid rgba(255,120,140,.4);
    font: 600 13px/1.5 'Archivo', sans-serif; color: #ffd9df;
  }
  .pg-err.on { display: block; }
  .pg-foot {
    text-align: center; padding: 32px 0 6px;
    font: 600 12px/1.7 'Archivo', sans-serif; color: var(--ink-dim);
  }
  .pg-foot a { color: var(--ink-soft); display: inline-block; min-height: 44px; line-height: 44px; padding: 0 10px; }

  /* ══════════ Le mouvement ══════════
     Un seul motif : ça monte de 18 px en apparaissant. Pas de librairie, pas
     de scroll-jacking, une seule transition par élément. */
  .rv { opacity: 0; transform: translateY(18px); transition: opacity .6s ease, transform .6s cubic-bezier(.2,.7,.3,1); }
  .rv.vu { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) {
    .rv { opacity: 1; transform: none; transition: none; }
    .pg-rail-a .pg-bande, .pg-rail-b .pg-bande { animation: none; }
    .pg-rot b { transition: none; }
    .pg-cta, .pg-price-btn { transition: none; }
  }
${BACKDROP_STYLE}
</style>`;

// Provenance du visiteur (pub, referrer) — lue une fois à l'arrivée sur la
// landing. Sert à répondre à « combien de clics viennent de Facebook ». On ne
// stocke aucune donnée perso : présence du fbclid (pas l'ID) et hostname du
// referrer (pas l'URL complète, qui peut porter des paramètres sensibles).
function adSource() {
  try {
    const src = {};
    const hash = location.hash || "";
    const qs =
      location.search.slice(1) +
      (hash.includes("?") ? "&" + hash.slice(hash.indexOf("?") + 1) : "");
    const q = new URLSearchParams(qs);
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]) {
      const v = q.get(k);
      if (v) src[k] = v.slice(0, 100);
    }
    if (q.get("fbclid")) src.fbclid = true; // présence seule, jamais l'identifiant
    if (document.referrer) {
      try {
        src.referrer = new URL(document.referrer).hostname;
      } catch {
        /* referrer non parsable : on ignore */
      }
    }
    return src;
  } catch {
    return {};
  }
}

export async function mount(root) {
  const lang = getLang();
  const L = STR[lang] || STR.fr;
  applyLang(lang);
  track("landing.view", { lang, ...adSource() });

  const cartes = (cls, rep) => `
    <div class="pg-rail ${cls}"><div class="pg-bande">
      ${Array.from({ length: rep })
        .map(() =>
          CARTES.map(
            (c) =>
              `<img src="/cartes/${c}.webp" alt="" loading="lazy" decoding="async" width="190" height="127">`,
          ).join(""),
        )
        .join("")}
    </div></div>`;

  const a = AVIS[0];

  root.innerHTML = `${STYLE}
  ${backdropHTML({ texte: "bas" })}
  <div class="pg" dir="${isRTL(lang) ? "rtl" : "ltr"}">

    <header class="pg-nav">
      <img src="${LOGO}" alt="PermiGo" width="34" height="34">
      <span class="pg-nav-sp"></span>
      <div class="pg-langs" role="group" aria-label="Langue">
        ${LANGS.map(
          (l) =>
            `<button class="pg-lang" type="button" data-l="${l}" aria-pressed="${l === lang}">${LANG_COURT[l]}</button>`,
        ).join("")}
      </div>
      <button class="pg-login" id="pg-login" type="button">${L.login}</button>
    </header>

    <!-- 01 · La promesse -->
    <section class="pg-hero">
      <h1 class="pg-h1"><span>${L.h1a}</span><span class="b">${L.h1b}</span></h1>
      <p class="pg-lead">${L.lead}</p>
      <button class="pg-cta" id="pg-cta" type="button">${L.cta}</button>
      <p class="pg-cta-note">${L.ctaNote}</p>
    </section>

    <div class="pg-wrap">

      <!-- 02 · Le problème -->
      <section class="pg-prob">
        <p class="big rv">${L.probA}</p>
        <p class="big dim rv">${L.probB}</p>
        <div class="pg-week rv" aria-hidden="true">
          <i class="on"></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
        <p class="pg-legend rv">${L.probLegend}</p>
        <p class="big out rv">${L.probC}</p>
      </section>

      <!-- 03 · Comment ça marche -->
      <section class="pg-sec">
        <h2 class="pg-h2 rv">${L.howTitle}</h2>
        <ol class="pg-steps">
          ${L.how
            .map(
              (t, i) =>
                `<li class="pg-step rv"><b>0${i + 1}</b><span>${t}</span></li>`,
            )
            .join("")}
        </ol>
      </section>
    </div>

    <!-- 04 · La démonstration -->
    <div class="pg-wrap">
      <section class="pg-demo-w">
        <h2 class="pg-h2 rv" style="margin-bottom:18px">${L.demoTitle}</h2>
        <div class="pg-demo rv"><div id="pg-demo"></div></div>
      </section>
    </div>

    <!-- 04 bis · Le raccord : la scene preparee, puis la meme sur la route -->
    <div class="pg-wrap">
      <section class="pg-cut-w">
        <h2 class="pg-h2 pg-cut-t rv">${L.cutA}<br><span class="b">${L.cutB}</span></h2>
        <div class="pg-cut rv" id="pg-cut">
          <video id="pg-cut-v" poster="/video/route-volant.webp" muted playsinline webkit-playsinline preload="none" aria-hidden="true"></video>
          <img class="pg-cut-app" src="/showcase/eleve-en-situation.webp" alt="" loading="lazy" decoding="async" width="780" height="980">
        </div>
      </section>
    </div>

    <!-- 05 · Ta langue -->
    <div class="pg-wrap">
      <section class="pg-lang-sec">
        <p class="pg-kicker rv">${L.langKicker}</p>
        <p class="pg-fixe rv">${L.langFixe}</p>
        <p class="pg-rot rv" id="pg-rot">
          ${L.langTourne.map((t, i) => `<b class="${i === 0 ? "on" : ""}" ${i === 2 ? 'dir="rtl"' : ""}>${t}</b>`).join("")}
        </p>
        <p class="pg-lang-note rv">${L.langNote}</p>
      </section>
    </div>

    <!-- 06 · La progression -->
    <section class="pg-mur">
      <div class="pg-wrap">
        <p class="pg-kicker rv">${L.progKicker}</p>
        <h2 class="pg-h2 rv" style="margin-bottom:22px">${L.progTitle}</h2>
      </div>
      ${cartes("pg-rail-a", 2)}
      ${cartes("pg-rail-b", 2)}
      <div class="pg-wrap"><p class="pg-legend rv" style="margin-top:14px">${L.progNote}</p></div>
    </section>

    <div class="pg-wrap">
      <!-- Les avis : un seul, en grand -->
      <figure class="pg-avis rv">
        <blockquote>“${esc(a[lang] || a.fr)}”</blockquote>
        <figcaption><bdi>${esc(a.n)}</bdi> · ${a.age} ${L.avisAge}</figcaption>
      </figure>

      <!-- 07 · La fin -->
      <section class="pg-fin">
        <h2 class="pg-fin-t rv">${L.finTitle}</h2>
        <div class="pg-price rv">
          <div class="pg-price-big">${L.price}</div>
          <span class="pg-price-only">${L.priceOnly}</span>
          <p class="pg-price-sub">${L.priceSub}</p>
          <p class="pg-price-what">${L.priceWhat}</p>
          <button class="pg-price-btn" id="pg-buy" type="button">${L.priceBtn}</button>
          <p class="pg-err" id="pg-err">${L.err}</p>
        </div>
      </section>

      <footer class="pg-foot">
        ${L.foot}<br><a href="#/legal">${L.legal}</a>
      </footer>
    </div>
  </div>`;

  // ── Le sélecteur de langue ──
  // applyLang écrit le choix ET marque qu'il est explicite : on remonte la
  // page pour la relire dans la nouvelle langue.
  root.querySelectorAll(".pg-lang").forEach((b) =>
    b.addEventListener("click", () => {
      const l = b.dataset.l;
      if (l === lang) return;
      track("landing.lang", { from: lang, to: l });
      applyLang(l);
      location.reload();
    }),
  );

  root.querySelector("#pg-cta")?.addEventListener("click", () => {
    track("landing.free_click", { lang });
    location.hash = "#/rejoindre?solo=1";
  });
  root.querySelector("#pg-login")?.addEventListener("click", () => {
    location.hash = "#/login";
  });

  // ── Le paiement ──
  // ⚠️ Stripe REVIENT sur #/pass?checkout=success : c'est écrit en dur dans
  // l'edge function pass-checkout, côté serveur et déjà déployée. On ne le
  // change pas d'ici, et #/pass reste routée pour afficher l'écran de retour.
  // Un clic = une session : on fige le bouton, sinon un double-tap sur mobile
  // ouvre deux sessions de paiement.
  const buy = root.querySelector("#pg-buy");
  const err = root.querySelector("#pg-err");
  buy?.addEventListener("click", async () => {
    track("landing.checkout_click", { lang });
    fbTrack("InitiateCheckout", {
      content_name: "mensuel",
      currency: "EUR",
      value: 4.99,
    });
    err?.classList.remove("on");
    buy.disabled = true;
    const avant = buy.textContent;
    buy.textContent = L.btnWait;
    try {
      await startPassCheckout("mensuel");
      // Succès = redirection vers Stripe : on ne repasse jamais ici.
    } catch (e) {
      console.error("[landing] checkout", e);
      track("landing.checkout_error", { lang });
      buy.disabled = false;
      buy.textContent = avant;
      err?.classList.add("on");
      err?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });

  // La scène jouable. Elle referme elle-même la boucle après une bonne
  // réponse, sans deuxième bouton : le même mot deux fois ne se lit pas comme
  // deux occasions, ça se lit comme un doublon.
  const demo = root.querySelector("#pg-demo");
  if (demo)
    mountDemoSituation(demo, lang, {
      onCorrect: () => track("landing.demo_success", { lang }),
    });

  // ── L'apparition au défilement ──
  // Un observateur, un seul motif, et on se débranche dès que c'est vu.
  const doux = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cibles = [...root.querySelectorAll(".rv")];
  if (doux || !("IntersectionObserver" in window)) {
    cibles.forEach((e) => e.classList.add("vu"));
  } else {
    const io = new IntersectionObserver(
      (ents) =>
        ents.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("vu");
          io.unobserve(en.target);
        }),
      { rootMargin: "0px 0px -12% 0px" },
    );
    cibles.forEach((e) => io.observe(e));
  }

  // ── La phrase qui tourne dans les trois langues ──
  // Elle ne tourne QUE quand elle est à l'écran : une animation qui tourne
  // dans le vide réveille le processeur pour rien pendant toute la visite.
  const rot = root.querySelector("#pg-rot");
  if (rot && !doux) {
    const mots = [...rot.querySelectorAll("b")];
    let i = 0;
    let minuteur = null;
    const tour = () => {
      mots[i].classList.remove("on");
      i = (i + 1) % mots.length;
      mots[i].classList.add("on");
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (ents) =>
          ents.forEach((en) => {
            if (en.isIntersecting && !minuteur)
              minuteur = setInterval(tour, 2600);
            else if (!en.isIntersecting && minuteur) {
              clearInterval(minuteur);
              minuteur = null;
            }
          }),
        { threshold: 0.4 },
      ).observe(rot);
    } else {
      minuteur = setInterval(tour, 2600);
    }
  }

  // ── Le raccord ──
  // La vidéo n'est demandée QUE quand la séquence approche : elle est loin
  // dans la page et beaucoup de visiteurs ne descendront jamais jusque-là.
  // Quand elle entre à l'écran, la scène de l'app avance vers nous et
  // s'efface, et la route est déjà derrière. On ne coupe pas, on traverse.
  const cut = root.querySelector("#pg-cut");
  const cutV = root.querySelector("#pg-cut-v");
  if (cut && cutV) {
    // ⚠️ iOS lit les ATTRIBUTS, pas seulement les propriétés (piège #743).
    cutV.muted = true;
    cutV.defaultMuted = true;
    cutV.playsInline = true;
    const net = navigator.connection;
    const leger =
      doux ||
      (net && (net.saveData || /(^|-)2g$/.test(net.effectiveType || "")));
    // Sans mouvement demandé ou sur un forfait compté : on garde la scène de
    // l'app, le titre dit déjà tout. Aucun trou, aucune vidéo téléchargée.
    if (!leger && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (ents) =>
          ents.forEach((en) => {
            if (!en.isIntersecting) return;
            io.disconnect();
            cutV.src = "/video/route-volant.mp4";
            // ⚠️ `preload="none"` économise le réseau tant qu'on n'arrive pas
            // ici, MAIS poser la source ne télécharge alors RIEN : sans ces
            // deux lignes, `canplay` n'arrive jamais et le raccord ne se
            // déclenche pas. Aucun message d'erreur, la vidéo reste vide.
            cutV.preload = "auto";
            cutV.load();
            const traverser = () => {
              const p = cutV.play();
              if (p && typeof p.catch === "function") p.catch(() => {});
              cut.classList.add("passe");
            };
            // On demande tout de suite, et `canplay` sert de filet si ce
            // premier appel arrive trop tôt. On ne traverse qu'avec une vraie
            // image prête, sinon la scène de l'app s'efface sur du vide.
            cutV.addEventListener("canplay", traverser, { once: true });
            // Filet : si la vidéo ne vient jamais, la scène de l'app reste.
            cutV.addEventListener(
              "error",
              () => track("landing.cut_error", { lang }),
              { once: true },
            );
          }),
        { rootMargin: "0px 0px -18% 0px" },
      );
      io.observe(cut);
    }
  }

  wireBackdrop(root);
}
