// ═══════════════════════════════════════════════════════════════
// « Défie tes amis » — le jeu de soirée.
//
// Une seule page pour tout le circuit, parce qu'un invité arrive de WhatsApp
// et ne doit traverser aucun écran de compte :
//   #/duel          → l'hôte (connecté) crée la partie et montre son écran
//   #/duel/<code>   → l'ami arrive, tape son prénom, joue, voit le classement
//
// ⚠️ La route se déclare à DEUX endroits : `ROUTES` + `routePublic` dans
// router.js (navigation interne) ET la branche `!me` de `boot()` dans main.js
// (premier chargement). Un invité arrive TOUJOURS par le second.
//
// Tout le réseau passe par l'edge function `duel` : les invités n'ont pas de
// session, donc pas de RLS possible. Le jeton du joueur vit dans localStorage,
// ce qui permet de reprendre si l'écran se verrouille au milieu.
//
// ── Synchro temps réel (06/08, demande Rayan) ─────────────────────────────
// La partie n'est plus une course où chacun joue sa copie des 10 questions à
// son rythme : les téléphones voient la MÊME question en même temps, avec le
// MÊME chrono, et un écran de reveal après chaque question montre qui a
// répondu quoi. L'état de la manche (question affichée, échéance) vit dans
// `duels` côté serveur et se diffuse à tous les téléphones via Supabase
// Realtime Broadcast (canal `duel:<code>`), avec un sondage de secours en
// filet (action `state`) si un message de diffusion se perd en route.
//
// Ce n'est PAS un quiz certifiant : aucune compétence n'est validée ici.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { getLang } from "@/utils/lang.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { toast } from "@/components/common/toast.js";
import { chromeNight } from "@/utils/chrome-night.js";
import { prochainMessage } from "@/pages/common/duel-intermission.js";
import { commentaireReveal } from "@/pages/common/duel-commentary.js";
import { playCorrect, playWrong, playDuelBoost } from "@/utils/sound.js";

const LS = (code) => `duel_${code}`;
const LS_LANG = "duel_lang";
const LETTRES = ["A", "B", "C", "D", "E", "F"];

// ── Langue ───────────────────────────────────────────────────────────────
// Trois langues, choisies AVANT de jouer (demande Rayan 03/08). Elles
// changent la coque ET les questions : les 415 questions de la banque
// existent en anglais et en arabe (table question_translations).
//
// ⚠️ Écart ASSUMÉ avec lang.js : l'app garde d'habitude le français sous la
// traduction, parce que l'examen du code se passe en français. Ici c'est un
// jeu de soirée, pas de la préparation d'examen, et une question doublée
// serait illisible en 20 secondes. Une seule langue à l'écran.
const LANGUES = [
  ["fr", "Français"],
  ["en", "English"],
  ["ar", "العربية"],
];

const I18N = {
  en: {
    host_title: "Challenge your friends",
    who: "Who knows the road best?",
    rules: "10 questions. 20 seconds each.<br>Fastest wins.",
    create: "Create the game",
    qr_hint: "Point your camera at this",
    or_link: "Or send the link",
    send: "Send the link",
    copy: "Copy",
    no_account: "No account. No email.",
    in_party: "In the game",
    free_slot: "Free",
    you: "You",
    start: "Start",
    defies: "{n} challenges you",
    defies_any: "You have been challenged",
    f_questions: "10 questions",
    f_chrono: "20 s clock",
    f_winner: "1 winner",
    lang: "Language",
    your_name: "Your first name",
    name_ph: "Sarah",
    go: "Let's go",
    already: "Already here",
    of: "{i} of {n}",
    streak: "{n} in a row",
    timeout: "Time up",
    missed: "Wrong",
    next: "Next",
    see_rank: "See the ranking",
    takes_title: "{n} takes the crown",
    running: "Game running",
    points: "{p} points",
    correct_of: "{c} of {t}",
    nobody_done: "Nobody has finished yet",
    waiting: "Waiting for {n}.",
    nobody_had: "Nobody got this one",
    replay: "Play again",
    refresh: "Refresh",
    create_free: "Create my free account",
    keeps: "Your score lasts 7 days.",
    over: "This game is over",
    over_sub: "A link lasts 7 days.<br>Ask your friend for a new one.",
    discover: "Discover PermiGo",
    need_name: "I just need your first name",
    full: "The game is full",
    cant_join: "Could not join",
    copied: "Link copied",
    ad: "Advertisement",
    next_round: "Next round",
    wait_title: "Everyone's in",
    wait_sub: "The host starts the game. Stay on this screen.",
    already_started: "This game already started",
    already_started_sub:
      "You just missed it.<br>Create your own in ten seconds.",
    create_own: "Create my own game",
    you_picked: "Picked",
    both_answered: "Waiting for the others",
    right_answer: "Right answer",
  },
  ar: {
    host_title: "تحدَّ أصدقاءك",
    who: "من يعرف الطريق أكثر؟",
    rules: "10 أسئلة. 20 ثانية لكل سؤال.<br>الأسرع يفوز.",
    create: "أنشئ اللعبة",
    qr_hint: "وجّه الكاميرا نحو هذا المربع",
    or_link: "أو أرسل الرابط",
    send: "أرسل الرابط",
    copy: "نسخ",
    no_account: "بدون حساب. بدون بريد.",
    in_party: "في اللعبة",
    free_slot: "شاغر",
    you: "أنت",
    start: "لنبدأ",
    defies: "{n} يتحداك",
    defies_any: "لقد تم تحديك",
    f_questions: "10 أسئلة",
    f_chrono: "20 ثانية",
    f_winner: "فائز واحد",
    lang: "اللغة",
    your_name: "اسمك",
    name_ph: "سارة",
    go: "هيا بنا",
    already: "موجودون بالفعل",
    of: "{i} من {n}",
    streak: "{n} على التوالي",
    timeout: "انتهى الوقت",
    missed: "خطأ",
    next: "التالي",
    see_rank: "شاهد الترتيب",
    takes_title: "{n} يفوز باللقب",
    running: "اللعبة جارية",
    points: "{p} نقطة",
    correct_of: "{c} من {t}",
    nobody_done: "لم ينهِ أحد بعد",
    waiting: "في انتظار {n}.",
    nobody_had: "لم يعرفها أحد",
    replay: "العب مرة أخرى",
    refresh: "تحديث",
    create_free: "أنشئ حسابي المجاني",
    keeps: "نتيجتك تبقى 7 أيام.",
    over: "انتهت هذه اللعبة",
    over_sub: "الرابط يبقى 7 أيام.<br>اطلب من صديقك رابطًا جديدًا.",
    discover: "اكتشف PermiGo",
    need_name: "أحتاج فقط إلى اسمك",
    full: "اللعبة مكتملة",
    cant_join: "تعذّر الانضمام",
    copied: "تم نسخ الرابط",
    ad: "إعلان",
    next_round: "الجولة التالية",
    wait_title: "الجميع هنا",
    wait_sub: "المضيف يبدأ اللعبة. ابقَ في هذه الشاشة.",
    already_started: "بدأت هذه اللعبة بالفعل",
    already_started_sub: "فاتتك للتو.<br>أنشئ لعبتك الخاصة في عشر ثوانٍ.",
    create_own: "أنشئ لعبتي الخاصة",
    you_picked: "اختار",
    both_answered: "في انتظار الباقين",
    right_answer: "الإجابة الصحيحة",
  },
};

// La langue choisie pour CETTE partie. Un invité n'a pas de session, donc on
// ne touche jamais user_preferences : le choix vit dans localStorage.
let _lang = "fr";
function chargeLangue() {
  try {
    const v = localStorage.getItem(LS_LANG);
    if (v && LANGUES.some(([c]) => c === v)) return v;
  } catch {
    /* navigation privée */
  }
  try {
    return getLang();
  } catch {
    return "fr";
  }
}
function poseLangue(v) {
  _lang = v;
  try {
    localStorage.setItem(LS_LANG, v);
  } catch {
    /* navigation privée : la partie se joue quand même */
  }
}
function t(cle, fr, vars = {}) {
  let s = (_lang !== "fr" && I18N[_lang]?.[cle]) || fr;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
// L'app reste en LTR (règle de lang.js) : seul le TEXTE arabe passe en RTL,
// jamais la mise en page. Les écrans du duel sont centrés ou en colonne, donc
// l'attribut sur les blocs de texte suffit.
function R() {
  return _lang === "ar" ? ' dir="rtl" lang="ar"' : "";
}

// Chrono : 20 secondes par question (décision Rayan 03/08). L'échéance vient
// du SERVEUR (`etat.deadline`) : cette constante ne sert plus qu'à l'affichage
// des textes de règles, jamais à armer un minuteur local.
const DUREE = 20000;

// ── L'entracte ───────────────────────────────────────────────────────────
// Les 10 questions se jouent en DEUX manches de 5 (décision Rayan 03/08).
// Entre les deux : un écran de cinq secondes, en pleine page, qui s'ouvre et
// se ferme tout seul, synchronisé pour tous les téléphones (le serveur pose
// `status = 'intermission'` avec sa propre échéance).
const MI_TEMPS = 5;

// L'emplacement publicitaire.
//
// `externe` reste NULL tant qu'aucune régie n'est ouverte : l'emplacement
// affiche alors l'offre PermiGo, qui rapporte plus qu'une bannière (un
// abonné vaut des milliers d'impressions). Le jour où une régie existe,
// c'est la SEULE chose à changer ici : une fonction qui reçoit l'élément et
// y pose son bloc. ⚠️ Un script de régie est un tiers : il ne se charge
// qu'après acceptation du bandeau de consentement.
const PUB = { externe: null };

const COULEURS = [
  "linear-gradient(180deg,#8e87ff,#6058d8)",
  "linear-gradient(180deg,#ff9c8b,#e2604d)",
  "linear-gradient(180deg,#6fd6a8,#2f9d73)",
  "linear-gradient(180deg,#ffd24a,#e08c10)",
  "linear-gradient(180deg,#79c0ff,#3b82f6)",
  "linear-gradient(180deg,#f79bd8,#c8519f)",
  "linear-gradient(180deg,#a5e88a,#5faa3c)",
  "linear-gradient(180deg,#c4a6ff,#8b5cf6)",
];

// Minuteries vivantes : le chrono d'une question, la bascule automatique
// (reveal → suivante), le rafraîchissement du salon et le sondage de secours.
// Elles doivent mourir quand on quitte la page, sinon elles tournent dans le
// vide et rejouent sur un écran démonté.
let _tick = null;
let _fin = null;
let _avance = null;
let _salon = null;
let _sonde = null;
let _canal = null;

function stopChrono() {
  if (_tick) clearInterval(_tick);
  if (_fin) clearTimeout(_fin);
  if (_avance) clearTimeout(_avance);
  _tick = null;
  _fin = null;
  _avance = null;
}
function stopSalon() {
  if (_salon) clearInterval(_salon);
  _salon = null;
}
function stopSonde() {
  if (_sonde) clearInterval(_sonde);
  _sonde = null;
}
function stopCanal() {
  if (_canal) {
    try {
      sb.removeChannel(_canal);
    } catch {
      /* canal déjà fermé */
    }
  }
  _canal = null;
}
export function unmount() {
  stopChrono();
  stopSalon();
  stopSonde();
  stopCanal();
}

function appel(action, payload = {}) {
  return sb.functions
    .invoke("duel", { body: { action, ...payload } })
    .then(({ data, error }) => {
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    });
}

function jeton(code) {
  try {
    return JSON.parse(localStorage.getItem(LS(code)) || "null");
  } catch {
    return null;
  }
}
function poseJeton(code, v) {
  try {
    localStorage.setItem(LS(code), JSON.stringify(v));
  } catch {
    /* navigation privée : la partie marche quand même, sans reprise */
  }
}

function initiale(nom) {
  return (nom || "?").trim().charAt(0).toUpperCase();
}
// Les points se lisent d'un coup d'oeil : 7240 devient « 7 240 ».
function chiffres(n) {
  return String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const STYLE = `<style>
${chromeNight("#241a52", "#1a1340")}
.du { position:relative; overflow:hidden; max-width:480px; margin:0 auto; min-height:100dvh; color:#fff;
  background:linear-gradient(180deg,#241a52 0%,#1e1648 46%,#1a1340 100%); font-family:'Archivo',sans-serif;
  -webkit-font-smoothing:antialiased; }
.du::before { content:""; position:absolute; top:-120px; left:50%; transform:translateX(-50%);
  width:360px; height:300px; pointer-events:none;
  background:radial-gradient(ellipse at center,rgba(142,135,255,.18),transparent 70%); }
/* 96px en bas : un joueur CONNECTÉ garde la barre de navigation, qui recouvre
   le dernier bouton. Un invité n'a pas de barre, il n'y gagne qu'un peu de
   vide. Même valeur que le hub Réviser. */
.du-screen { position:relative; padding:14px 20px calc(96px + env(safe-area-inset-bottom)); }

/* base.css impose « h1,h2,h3,h4 { color: var(--ink) } », et --ink est presque
   NOIR en thème clair. Cette page est sombre en permanence : chaque titre doit
   reposer sa couleur, sinon c'est du noir sur violet et on ne lit plus rien
   (constaté par Rayan le 03/08). */
.du h1, .du h2, .du h3, .du h4 { color:#fff; }

.du-top { display:flex; align-items:center; justify-content:space-between; padding:8px 2px 14px; }
.du-top h1 { font:800 20px/1 'Archivo',sans-serif; letter-spacing:-.03em; margin:0; color:#fff; }
.du-back { width:38px; height:38px; display:grid; place-items:center; border:0; cursor:pointer;
  border-radius:12px; background:rgba(255,255,255,.07); color:#cfc7ff; font:800 18px/1 'Archivo',sans-serif; }
.du-spacer { width:38px; }

.du-wordmark { text-align:center; font:800 15px/1 'Archivo',sans-serif; letter-spacing:.2em;
  text-transform:uppercase; color:#6b63a8; padding:18px 0 8px; }
.du-mascot { display:block; width:118px; height:118px; object-fit:contain; margin:4px auto -6px;
  filter:drop-shadow(0 10px 18px rgba(0,0,0,.45)); }
.du-title { text-align:center; font:800 30px/1.1 'Archivo',sans-serif; letter-spacing:-.035em;
  margin:10px 0 0; color:#fff; }
.du-title em { font-style:normal; background:linear-gradient(110deg,#ffe27a,#ff9b1e);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
.du-sub { text-align:center; font:600 14.5px/1.45 'Archivo',sans-serif; color:#b3aede; margin:10px 0 24px; }

.du-cta { display:flex; align-items:center; justify-content:center; gap:9px; width:100%;
  padding:16px; border:0; border-radius:16px; cursor:pointer;
  background:linear-gradient(180deg,#8e87ff,#6c63ff);
  box-shadow:0 4px 0 #4a3fc9, 0 12px 22px -10px rgba(74,63,201,.9);
  color:#fff; font:800 16.5px/1 'Archivo',sans-serif; letter-spacing:-.01em;
  transition:transform .1s ease, box-shadow .1s ease; -webkit-tap-highlight-color:transparent; }
.du-cta:active { transform:translateY(2px); box-shadow:0 2px 0 #4a3fc9; }
.du-cta.gold { background:linear-gradient(180deg,#ffd24a,#ff9c1c); color:#3a1d00;
  box-shadow:0 4px 0 #b85e00, 0 12px 22px -10px rgba(255,140,30,.6); }
.du-cta.gold:active { box-shadow:0 2px 0 #b85e00; }
.du-cta[disabled] { opacity:.55; cursor:default; }
.du-ghost { display:block; width:100%; margin-top:10px; padding:15px; cursor:pointer;
  border-radius:16px; border:1px solid #3a3178; background:rgba(255,255,255,.04);
  color:#cfc7ff; font:800 15px/1 'Archivo',sans-serif; -webkit-tap-highlight-color:transparent; }

/* ===== Le QR de la partie =====
   Dans une soirée tout le monde est dans la même pièce : tendre son écran bat
   l'envoi d'un lien. Et il n'y a PAS de scanner à coder, l'appareil photo
   d'un iPhone ou d'un Android lit déjà les QR tout seul. */
.du-qr { margin-top:20px; padding:18px 18px 16px; border-radius:22px; text-align:center;
  background:linear-gradient(180deg,#2c2264,#241a56); border:1px solid rgba(245,196,81,.28);
  box-shadow:0 22px 44px -20px rgba(8,4,30,.9); }
.du-qrbox { width:min(230px,62vw); aspect-ratio:1; margin:0 auto; display:grid; place-items:center;
  background:#fff; border-radius:16px; padding:12px; box-shadow:0 10px 24px -12px rgba(0,0,0,.7); }
/* image-rendering pixelated : sans lui le lissage du navigateur bave sur les
   modules et certains téléphones ne décrochent plus le code. */
.du-qrbox img { width:100%; height:100%; display:block; image-rendering:pixelated; }
.du-qrhint { margin:14px 2px 0; font:700 14px/1.4 'Archivo',sans-serif; color:#cfc7ff; }
.du-qrfail { font:600 13px/1.4 'Archivo',sans-serif; color:#8c85bd; padding:20px; }

.du-lab { display:block; font:800 11px/1 'Archivo',sans-serif; letter-spacing:.14em;
  text-transform:uppercase; color:#9089c7; margin:0 2px 10px; }
.du-block { margin-top:22px; }
.du-link { display:flex; align-items:center; padding:14px 15px; border-radius:14px;
  background:rgba(0,0,0,.28); border:1px dashed #4a3f95;
  font:600 13.5px/1 var(--fn,'IBM Plex Mono',monospace); color:#cfc7ff; overflow:hidden;
  white-space:nowrap; text-overflow:ellipsis; }
.du-note { margin:12px 2px 0; font:600 12.5px/1.45 'Archivo',sans-serif; color:#8c85bd; text-align:center; }

.du-input { display:block; width:100%; padding:17px 18px; border-radius:16px;
  background:rgba(0,0,0,.3); border:1.5px solid #4a3f95; color:#fff;
  font:700 17px/1 'Archivo',sans-serif; -webkit-appearance:none; }
.du-input::placeholder { color:#6b63a8; }
.du-input:focus { outline:none; border-color:#f5c451; }

/* Le choix de langue : trois pastilles, avant de jouer. Assez grandes pour
   le pouce (44px de haut minimum, règle mobile). */
.du-langs { display:flex; justify-content:center; gap:8px; margin:0 0 22px; }
.du-langs button { flex:1; max-width:130px; min-height:46px; padding:12px 10px; cursor:pointer;
  border-radius:14px; border:1px solid #3a3178; background:rgba(255,255,255,.05); color:#b3aede;
  font:800 14px/1 'Archivo',sans-serif; -webkit-tap-highlight-color:transparent;
  transition:transform .1s ease; }
.du-langs button:active { transform:scale(.97); }
.du-langs button[aria-pressed="true"] { background:linear-gradient(180deg,#ffd24a,#ff9c1c);
  color:#3a1d00; border-color:#ffe08a; box-shadow:0 3px 0 #b85e00; }

.du-facts { display:flex; justify-content:center; gap:8px; margin:18px 0 26px; flex-wrap:wrap; }
.du-fact { padding:9px 14px; border-radius:999px; background:rgba(255,255,255,.06);
  border:1px solid #3a3178; font:800 12.5px/1 'Archivo',sans-serif; color:#cfc7ff; }

.du-players { display:flex; gap:8px; flex-wrap:wrap; }
.du-pl { position:relative; width:40px; height:40px; border-radius:50%; display:grid; place-items:center;
  font:800 15px/1 'Archivo',sans-serif; color:#fff; border:2px solid rgba(255,255,255,.14); }
.du-pl .tick { position:absolute; right:-3px; bottom:-3px; width:17px; height:17px; border-radius:50%;
  background:#35d07f; border:2px solid #1e1648; display:grid; place-items:center;
  font:800 9px/1 'Archivo',sans-serif; color:#06280f; }
.du-empty { width:40px; height:40px; border-radius:50%; border:2px dashed #4a3f95; }
.du-slots { display:flex; align-items:flex-start; gap:12px; flex-wrap:wrap; }
.du-slot { text-align:center; width:44px; }
.du-slot .nm { display:block; margin-top:7px; font:700 11.5px/1.2 'Archivo',sans-serif; color:#8c85bd;
  overflow:hidden; text-overflow:ellipsis; }
.du-slot .nm.moi { color:#f5c451; }
/* Un ami qui vient d'arriver se signale tout seul : sans ça l'hôte fixe un
   écran figé et croit que le lien n'a pas marché. */
.du-slot.neuf .du-pl { animation:duPop .45s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes duPop { 0%{transform:scale(.4);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
/* La pastille de l'écran d'attente respire doucement : elle prouve à l'ami
   que la page est vivante pendant qu'il patiente. */
.du-wait-pulse { animation:duBreath 1.8s ease-in-out infinite; }
@keyframes duBreath { 0%,100%{opacity:1} 50%{opacity:.55} }

/* ===== Le chrono ===== */
.du-chrono { display:flex; align-items:center; gap:12px; margin:6px 0 4px; }
.du-jauge { position:relative; flex:1; height:12px; border-radius:8px; background:#251f56; overflow:hidden;
  box-shadow:inset 0 2px 3px rgba(0,0,0,.5); }
.du-jauge i { position:absolute; inset:0; transform-origin:left center; border-radius:8px;
  background:linear-gradient(90deg,#ffd95e,#f59b16); }
.du-jauge.urgent i { background:linear-gradient(90deg,#ff8a6b,#e2442d); }
.du-secondes { min-width:34px; text-align:right; font:800 17px/1 var(--fn,'IBM Plex Mono',monospace); color:#ffd06a; }
.du-secondes.urgent { color:#ff8a6b; }
@media (prefers-reduced-motion: reduce){ .du-jauge i{transition:none !important} .du-slot.neuf .du-pl{animation:none} .du-wait-pulse{animation:none} }

.du-score { font:800 15px/1 var(--fn,'IBM Plex Mono',monospace); color:#f5c451; display:block; text-align:right; }
.du-combo { font:800 11px/1 'Archivo',sans-serif; letter-spacing:.06em; text-transform:uppercase;
  color:#ffb340; margin-top:5px; display:block; text-align:right; }

.du-q { font:700 clamp(20px,5.4vw,24px)/1.34 'Archivo',sans-serif; margin:20px 0; letter-spacing:-.01em;
  color:#fff; text-shadow:0 2px 0 rgba(0,0,0,.32), 0 0 18px rgba(120,90,230,.35); }
.du-opts { display:flex; flex-direction:column; gap:12px; }
.du-opt { position:relative; display:flex; align-items:center; gap:13px; width:100%; min-height:60px;
  padding:13px 16px; border-radius:18px; cursor:pointer; text-align:left;
  background:linear-gradient(180deg,#3a3470,#231d4f); border:1px solid rgba(255,255,255,.06); color:#ece8ff;
  box-shadow:0 7px 0 #15113a, 0 12px 16px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.26);
  font:500 15.5px/1.25 'Archivo',sans-serif; -webkit-tap-highlight-color:transparent;
  transition:transform .08s ease, box-shadow .08s ease; }
.du-opt:active { transform:translateY(3px); box-shadow:0 4px 0 #15113a; }
.du-opt[disabled] { cursor:default; }
.du-opt.moi { background:linear-gradient(180deg,#5b52c9,#403894); border-color:rgba(255,255,255,.3);
  box-shadow:0 5px 0 #241f6b, 0 10px 20px rgba(74,63,201,.4); }
.du-key { flex:none; display:grid; place-items:center; width:38px; height:38px; border-radius:12px;
  background:linear-gradient(180deg,#2b2560,#1b1545); color:#cfc7ff;
  font:800 17px/1 'Archivo',sans-serif; box-shadow:inset 0 1px 0 rgba(255,255,255,.16), 0 3px 0 #110d35; }
.du-opt.moi .du-key { background:linear-gradient(180deg,#ffd24a,#ff9c1c); color:#3a1d00; box-shadow:0 3px 0 #b85e00; }

.du-waiting { display:flex; align-items:center; gap:10px; margin:18px 0 0; padding:14px 16px;
  border-radius:16px; background:rgba(0,0,0,.24); border:1px solid #3a3178;
  font:700 14px/1.4 'Archivo',sans-serif; color:#cfc7ff; }
.du-waiting .dot { width:8px; height:8px; border-radius:50%; background:#ffd06a; flex:none;
  animation:duBreath 1s ease-in-out infinite; }

/* ===== Le reveal ===== */
.du-reveal-q { font:700 17px/1.4 'Archivo',sans-serif; color:#cfc7ff; margin:0 0 16px; }
.du-comment { text-align:center; margin:2px 0 18px; font:800 26px/1.15 'Archivo',sans-serif;
  letter-spacing:-.02em; background:linear-gradient(110deg,#ffe27a,#ff9b1e); -webkit-background-clip:text;
  background-clip:text; color:transparent; animation:duGain .45s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes duGain { 0%{transform:translateY(14px) scale(.8);opacity:0} 100%{transform:none;opacity:1} }
.du-rrow { display:flex; align-items:center; gap:12px; padding:13px 15px; border-radius:16px;
  background:rgba(255,255,255,.04); border:1px solid #3a3178; margin-top:10px; }
.du-rrow .who { width:36px; height:36px; border-radius:50%; flex:none; display:grid; place-items:center;
  font:800 14px/1 'Archivo',sans-serif; color:#fff; }
.du-rrow .info { flex:1; min-width:0; }
.du-rrow .nm { font:800 14.5px/1.2 'Archivo',sans-serif; color:#fff; overflow:hidden; text-overflow:ellipsis; }
.du-rrow .pick { font:600 12.5px/1.3 'Archivo',sans-serif; color:#9089c7; margin-top:2px; }
.du-rrow .gain { font:800 17px/1 var(--fn,'IBM Plex Mono',monospace); flex:none; }
.du-rrow.ok .gain { color:#35d07f; }
.du-rrow.ko .gain { color:#8c85bd; }
.du-rrow.ok { border-color:rgba(53,208,127,.35); }

/* ===== Podium ===== */
.du-podium { display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:auto 84px;
  column-gap:10px; align-items:end; max-width:340px; margin:26px auto 0; border-bottom:1px solid #443a86; }
.du-who { text-align:center; padding-bottom:10px; }
.du-who .head { width:56px; height:56px; margin:0 auto 8px; border-radius:50%; display:grid; place-items:center;
  font:800 21px/1 'Archivo',sans-serif; color:#fff; border:2px solid rgba(255,255,255,.18); }
.du-who.first .head { width:70px; height:70px; box-shadow:0 0 0 4px rgba(245,196,81,.22); }
.du-who .name { font:800 14px/1.1 'Archivo',sans-serif; color:#fff; overflow:hidden; text-overflow:ellipsis; }
.du-who .pts { font:700 12px/1 var(--fn,'IBM Plex Mono',monospace); color:#ffd06a; margin-top:4px; }
.du-step { align-self:end; border-radius:12px 12px 0 0; display:grid; place-items:center;
  background:linear-gradient(180deg,#3a3178,#2a2160); border:1px solid #443a86; border-bottom:0;
  font:800 22px/1 'Archivo',sans-serif; color:#9089c7; }
.du-step.s1 { height:84px; background:linear-gradient(180deg,#ffd24a,#e08c10); color:#3a1d00; border-color:#ffe08a; }
.du-step.s2 { height:58px; }
.du-step.s3 { height:40px; }
.du-row { display:flex; align-items:center; gap:12px; margin-top:10px; padding:11px 14px;
  border-radius:14px; background:rgba(255,255,255,.04); border:1px solid #3a3178; }
.du-row .rk { width:20px; font:800 15px/1 var(--fn,'IBM Plex Mono',monospace); color:#6b63a8; }
.du-row .nm { flex:1; font:800 15.5px/1.2 'Archivo',sans-serif; color:#fff; overflow:hidden; text-overflow:ellipsis; }
.du-row .sc { font:700 14px/1 var(--fn,'IBM Plex Mono',monospace); color:#9089c7; }
.du-win { text-align:center; margin:18px 0 2px; font:800 28px/1.1 'Archivo',sans-serif; letter-spacing:-.03em;
  background:linear-gradient(110deg,#ffe27a,#ff9b1e); -webkit-background-clip:text; background-clip:text; color:transparent; }

.du-card { margin-top:18px; padding:16px; border-radius:20px;
  background:linear-gradient(180deg,#2c2264,#241a56); border:1px solid rgba(245,196,81,.28);
  box-shadow:0 22px 44px -20px rgba(8,4,30,.9); }
.du-card h3 { margin:0 0 8px; font:800 19px/1.25 'Archivo',sans-serif; letter-spacing:-.02em; color:#fff; }
.du-card p { margin:0; font:600 13.5px/1.45 'Archivo',sans-serif; color:#b3aede; }
.du-eyebrow { display:block; font:800 11px/1 'Archivo',sans-serif; letter-spacing:.16em;
  text-transform:uppercase; color:#f5c451; margin-bottom:9px; }
.du-bonne { color:#f5c451; margin:0 0 10px; font:700 14.5px/1.4 'Archivo',sans-serif; }

/* ── L'entracte ─────────────────────────────────────────────────────────
   Cinq secondes plein écran. Tout ce qui bouge ici ne bouge QUE par
   transform ou opacity : ce sont les deux seules propriétés que le
   navigateur anime sans repasser par la mise en page, donc les seules qui
   tiennent 60 images par seconde sur un téléphone d'entrée de gamme. */
/* La colonne est bornée à zéro en minimum, pas laissée en 1fr : le mot ne se
   coupe jamais, et une colonne de grille refuse par défaut de descendre sous
   la largeur de son contenu. Sans ce garde-fou, c'est le MOT qui décide de
   la largeur de l'écran. */
.dui { position:relative; min-height:100dvh; display:grid;
  grid-template-columns:minmax(0,1fr); grid-template-rows:1fr auto;
  overflow:hidden; background:#181046; }

.dui-bg { position:absolute; inset:-25%; z-index:0; will-change:transform;
  animation:duiCam 20s ease-in-out infinite alternate; }
.dui-bg i { position:absolute; display:block; border-radius:50%; filter:blur(52px);
  will-change:transform; }
.dui-bg .b1 { width:78%; aspect-ratio:1; left:-8%; top:2%;
  background:radial-gradient(circle,rgba(124,92,255,.85),transparent 68%);
  animation:duiD1 17s ease-in-out infinite alternate; }
.dui-bg .b2 { width:62%; aspect-ratio:1; right:-6%; top:26%;
  background:radial-gradient(circle,rgba(255,180,58,.45),transparent 68%);
  animation:duiD2 21s ease-in-out infinite alternate; }
.dui-bg .b3 { width:70%; aspect-ratio:1; left:6%; bottom:-4%;
  background:radial-gradient(circle,rgba(196,82,255,.6),transparent 70%);
  animation:duiD3 25s ease-in-out infinite alternate; }
.dui-ray { position:absolute; top:-40%; left:0; width:38%; height:180%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent);
  will-change:transform; animation:duiRay 7s linear infinite; }
@keyframes duiCam { from{transform:scale(1)} to{transform:scale(1.12)} }
@keyframes duiD1 { from{transform:translate3d(0,0,0)} to{transform:translate3d(7%,5%,0)} }
@keyframes duiD2 { from{transform:translate3d(0,0,0)} to{transform:translate3d(-6%,8%,0)} }
@keyframes duiD3 { from{transform:translate3d(0,0,0)} to{transform:translate3d(5%,-6%,0)} }
@keyframes duiRay { from{transform:rotate(14deg) translate3d(-90%,0,0)} to{transform:rotate(14deg) translate3d(360%,0,0)} }

.dui-centre { position:relative; z-index:1; display:grid; align-content:center;
  justify-items:center; grid-template-columns:minmax(0,1fr);
  min-width:0; padding:0 16px; text-align:center; }
.dui-lab { display:block; margin-bottom:16px; padding:5px 12px; border-radius:999px;
  background:rgba(255,255,255,.10); color:#cfc9f5;
  font:800 10px/1 'Archivo',sans-serif; letter-spacing:.14em; text-transform:uppercase; }
.dui-slot { display:grid; justify-items:center; width:100%; }
.dui-mot { margin:0; font:900 80px/0.94 'Archivo',sans-serif; letter-spacing:-.045em;
  text-transform:uppercase; white-space:nowrap; color:#fff;
  text-shadow:0 8px 44px rgba(124,92,255,.6);
  opacity:0; transform:scale(.86);
  animation:duiEntre .78s cubic-bezier(.16,1,.3,1) .06s forwards; }
.dui-ligne { margin:18px 0 0; max-width:15em;
  font:600 16px/1.45 'Archivo',sans-serif; color:#d0c9f4;
  opacity:0; transform:translate3d(0,12px,0);
  animation:duiMonte .7s cubic-bezier(.16,1,.3,1) .3s forwards; }
@keyframes duiEntre { to { opacity:1; transform:scale(1); } }
@keyframes duiMonte { to { opacity:1; transform:none; } }

.dui-bas { position:relative; z-index:1;
  padding:0 22px calc(104px + env(safe-area-inset-bottom));
  opacity:0; animation:duiMonte .6s ease .5s forwards; }
.dui-meta { display:flex; align-items:center; justify-content:space-between;
  margin-bottom:10px; }
.dui-tag { font:800 12px/1 'Archivo',sans-serif; color:#a79ede;
  letter-spacing:.12em; text-transform:uppercase; }
.dui-sec { font:900 20px/1 'Archivo',sans-serif; color:#ffd24a; }
.dui-piste { height:6px; border-radius:999px; background:rgba(255,255,255,.12);
  overflow:hidden; }
.dui-jauge { display:block; height:100%; border-radius:999px;
  background:linear-gradient(90deg,#ffd24a,#ff9c1c);
  transform-origin:left center; transform:scaleX(1); will-change:transform; }

.du-skel { border-radius:18px; background:rgba(255,255,255,.05); animation:duPulse 1.2s ease-in-out infinite; }
.du-skel.big { height:220px; }
.du-skel.row { height:66px; margin-top:12px; }
@keyframes duPulse { 0%,100%{opacity:.5} 50%{opacity:.9} }
/* Sur un téléphone réglé sur « moins d'animations », le décor se fige et le
   mot arrive sans grandir. La jauge, elle, continue de se vider : c'est une
   information, pas une décoration. */
@media (prefers-reduced-motion: reduce){ .du-skel{animation:none} .du-cta,.du-opt{transition:none} .du-comment{animation:none}
  .dui-bg,.dui-bg i,.dui-ray{ animation:none; }
  .dui-ray{ display:none; }
  .dui-mot,.dui-ligne,.dui-bas{ animation-duration:.01ms; animation-delay:0s; } }
</style>`;

function coque(inner) {
  return `${STYLE}<div class="du"><div class="du-screen">${inner}</div></div>`;
}

function squelette() {
  return coque(
    `<div class="du-skel big"></div><div class="du-skel row"></div><div class="du-skel row"></div>`,
  );
}

function pastilles(noms) {
  return noms
    .map(
      (n, i) =>
        `<div class="du-pl" style="background:${COULEURS[i % COULEURS.length]}">${esc(initiale(n))}</div>`,
    )
    .join("");
}

// Les places du salon, rendues à part : le rafraîchissement ne remplace QUE ce
// bloc, sinon le QR se redessinerait toutes les trois secondes.
function slotsHTML(joueurs, neufs = []) {
  const pris = joueurs
    .map(
      (n, i) =>
        `<div class="du-slot${neufs.includes(n) ? " neuf" : ""}">
           <div class="du-pl" style="background:${COULEURS[i % COULEURS.length]}">${esc(initiale(n))}</div>
           <span class="nm${i === 0 ? " moi" : ""}">${esc(i === 0 ? t("you", "Toi") : n)}</span>
         </div>`,
    )
    .join("");
  const libres = Array.from(
    { length: Math.max(0, 4 - joueurs.length) },
    () =>
      `<div class="du-slot"><div class="du-empty"></div><span class="nm">${t("free_slot", "Libre")}</span></div>`,
  ).join("");
  return pris + libres;
}

// Les trois pastilles de langue. Rendues partout où on peut encore choisir,
// c'est à dire AVANT que la première question ne s'affiche.
function langsHTML() {
  return `<div class="du-langs" role="group" aria-label="${t("lang", "Langue")}">
    ${LANGUES.map(
      ([code, nom]) =>
        `<button type="button" data-lang="${code}" aria-pressed="${code === _lang}"${
          code === "ar" ? ' lang="ar"' : ""
        }>${nom}</button>`,
    ).join("")}
  </div>`;
}

// ───────────────────────────── L'hôte crée la partie ─────────────────────
function vueCreation(etat) {
  const lien = etat.code ? `${location.origin}/#/duel/${etat.code}` : "";
  return coque(`
    <div class="du-top">
      <button class="du-back" data-retour aria-label="Retour">←</button>
      <h1${R()}>${t("host_title", "Défie tes amis")}</h1>
      <span class="du-spacer"></span>
    </div>
    ${
      etat.code
        ? `<div class="du-qr">
             <div class="du-qrbox" id="du-qrbox"><span class="du-qrfail">…</span></div>
             <p class="du-qrhint"${R()}>${t("qr_hint", "Vise avec ton appareil photo")}</p>
           </div>
           <div class="du-block">
             <span class="du-lab"${R()}>${t("or_link", "Ou envoie le lien")}</span>
             <div class="du-link">${esc(lien)}</div>
             <button class="du-cta" data-partager style="margin-top:12px">${t("send", "Envoyer le lien")}</button>
             <button class="du-ghost" data-copier>${t("copy", "Copier")}</button>
             <p class="du-note"${R()}>${t("no_account", "Pas de compte. Pas d'email.")}</p>
           </div>
           <div class="du-block">
             <span class="du-lab" id="du-lab-salon"${R()}>${t("in_party", "Dans la partie")}</span>
             <div class="du-slots" id="du-slots">${slotsHTML(etat.joueurs || [])}</div>
           </div>
           <div class="du-block">
             <span class="du-lab"${R()}>${t("lang", "Langue")}</span>
             ${langsHTML()}
           </div>
           <button class="du-cta gold" data-jouer>${t("start", "Je commence")}</button>`
        : `<img class="du-mascot" src="/skins/mascot-hello-remastered.png" alt="">
           <h2 class="du-title"${R()}>${t("who", "Qui est le plus permifié ?")}</h2>
           <p class="du-sub"${R()}>${t("rules", "10 questions. 20 secondes chacune.<br>Le plus rapide gagne.")}</p>
           <button class="du-cta gold" data-creer>${t("create", "Créer la partie")}</button>`
    }
  `);
}

// ───────────────────────────── L'ami arrive ──────────────────────────────
function vueArrivee(etat) {
  return coque(`
    <div class="du-wordmark">PermiGo</div>
    <img class="du-mascot" src="/skins/mascot-hello-remastered.png" alt="">
    <h1 class="du-title"${R()}>${
      etat.hote
        ? t("defies", "<em>{n}</em> te défie", {
            n: `<em>${esc(etat.hote)}</em>`,
          })
        : t("defies_any", "On te défie")
    }</h1>
    <div class="du-facts">
      <span class="du-fact"${R()}>${t("f_questions", "10 questions")}</span>
      <span class="du-fact"${R()}>${t("f_chrono", "20 s chrono")}</span>
      <span class="du-fact"${R()}>${t("f_winner", "1 gagnant")}</span>
    </div>
    ${langsHTML()}
    <span class="du-lab"${R()}>${t("your_name", "Ton prénom")}</span>
    <input class="du-input" id="du-nom" type="text" maxlength="24" autocomplete="given-name"
           placeholder="${t("name_ph", "Sarah")}" aria-label="${t("your_name", "Ton prénom")}"${
             _lang === "ar" ? ' dir="rtl"' : ""
           }>
    <button class="du-cta gold" data-entrer style="margin-top:14px">${t("go", "J'y vais")}</button>
    <p class="du-note"${R()}>${t("no_account", "Pas de compte. Pas d'email.")}</p>
    ${
      (etat.joueurs || []).length
        ? `<div class="du-card" style="margin-top:26px">
             <span class="du-eyebrow"${R()}>${t("already", "Déjà là")}</span>
             <div class="du-players">${pastilles(etat.joueurs)}</div>
           </div>`
        : ""
    }
  `);
}

// L'écran d'attente : l'ami a rejoint, il patiente que l'hôte lance la
// partie. Sans lui, un invité voit un chrono partir tout seul sans savoir
// pourquoi (c'était l'ancien bug : chacun jouait sa propre copie).
function vueAttente(etat) {
  return coque(`
    <div class="du-wordmark">PermiGo</div>
    <img class="du-mascot du-wait-pulse" src="/skins/mascot-hello-remastered.png" alt="">
    <h1 class="du-title"${R()}>${t("wait_title", "On t'attend tous")}</h1>
    <p class="du-sub"${R()}>${t("wait_sub", "L'hôte lance la partie.<br>Reste sur cet écran.")}</p>
    <div class="du-card">
      <span class="du-eyebrow"${R()}>${t("in_party", "Dans la partie")}</span>
      <div class="du-players" id="du-wait-players">${pastilles(etat.joueurs || [])}</div>
    </div>
  `);
}

function vueDejaCommencee() {
  return coque(`
    <div class="du-wordmark">PermiGo</div>
    <h1 class="du-title" style="margin-top:40px"${R()}>${t("already_started", "Cette partie a déjà commencé")}</h1>
    <p class="du-sub"${R()}>${t("already_started_sub", "Tu l'as ratée de peu.<br>Crée la tienne en dix secondes.")}</p>
    <button class="du-cta gold" data-creer-perso>${t("create_own", "Créer ma propre partie")}</button>
  `);
}

// ───────────────────────────── Une question ──────────────────────────────
// `attends` : ce joueur a déjà répondu et patiente que les autres finissent
// (ou que le temps s'écoule). Le résultat détaillé n'apparaît qu'au reveal,
// synchronisé pour tout le monde : montrer sa propre correction tout de
// suite spoilerait la question à l'ami qui regarde encore l'écran.
function vueQuestion(etat) {
  const q = etat.questions[etat.index];
  const attends = etat.reponse !== null;

  const options = (q.options || [])
    .map((opt, i) => {
      const choisi = attends && i === etat.reponse;
      return `<button class="du-opt${choisi ? " moi" : ""}" data-rep="${i}"${attends ? " disabled" : ""}>
        <span class="du-key">${LETTRES[i] || i + 1}</span><span>${esc(opt)}</span>
      </button>`;
    })
    .join("");

  return coque(`
    <div class="du-top" style="padding-bottom:8px">
      <div class="du-players">${pastilles(etat.joueurs || [])}</div>
      <span>
        <span class="du-score">${chiffres(etat.points)}</span>
        ${etat.serie >= 2 ? `<span class="du-combo"${R()}>${t("streak", "{n} d'affilée", { n: etat.serie })}</span>` : ""}
      </span>
    </div>

    ${
      attends
        ? ""
        : `<div class="du-chrono">
             <div class="du-jauge" id="du-jauge"><i></i></div>
             <span class="du-secondes" id="du-sec">${Math.ceil(DUREE / 1000)}</span>
           </div>`
    }

    <h2 class="du-q"${R()}>${esc(q.question)}</h2>
    <div class="du-opts">${options}</div>

    ${
      attends
        ? `<div class="du-waiting"><span class="dot"></span><span${R()}>${t("both_answered", "En attente des autres")}</span></div>`
        : `<p class="du-note"${R()}>${t("of", "{i} sur {n}", { i: etat.index + 1, n: etat.questions.length })}</p>`
    }
  `);
}

// ───────────────────────────── Le reveal ─────────────────────────────────
// Après CHAQUE question (pas seulement à la fin) : ce que chacun a choisi,
// les points de la manche, le score qui monte, et un commentaire qui fait
// vivre le match. Le passage à la question suivante est automatique.
function vueReveal(etat) {
  const q = etat.questions[etat.index];
  const rep = etat.reveal || { reponses: [], correctIndex: -1 };
  const lignes = rep.reponses
    .map((r, i) => {
      const pick =
        r.choice >= 0 && q.options?.[r.choice] !== undefined
          ? q.options[r.choice]
          : t("timeout", "Temps écoulé");
      return `<div class="du-rrow ${r.correct ? "ok" : "ko"}">
        <div class="who" style="background:${COULEURS[i % COULEURS.length]}">${esc(initiale(r.name))}</div>
        <div class="info">
          <div class="nm">${esc(r.name)}</div>
          <div class="pick"${R()}>${t("you_picked", "A choisi")} · ${esc(pick)}</div>
        </div>
        <div class="gain">${r.correct ? `+${r.points}` : "+0"}</div>
      </div>`;
    })
    .join("");

  return coque(`
    <div class="du-top" style="padding-bottom:8px">
      <div class="du-players">${pastilles(etat.joueurs || [])}</div>
      <span class="du-score">${chiffres(etat.points)}</span>
    </div>
    <p class="du-reveal-q"${R()}>${esc(q.question)}</p>
    ${rep.commentaire ? `<p class="du-comment">${esc(rep.commentaire)}</p>` : ""}
    ${
      rep.correctIndex >= 0 && q.options?.[rep.correctIndex] !== undefined
        ? `<p class="du-bonne" style="margin:0 0 4px"${R()}>${t("right_answer", "La bonne réponse")} · ${esc(q.options[rep.correctIndex])}</p>`
        : ""
    }
    ${lignes}
    ${q.explanation ? `<p class="du-expl" style="margin-top:14px; padding:14px 16px; border-radius:16px; background:rgba(0,0,0,.24); border:1px solid #3a3178; font:600 14px/1.5 'Archivo',sans-serif; color:#cfc7ff;"${R()}>${esc(q.explanation)}</p>` : ""}
  `);
}

// ───────────────────────────── L'entracte ────────────────────────────────
// Un écran plein, cinq secondes, sans un seul bouton : un décor qui respire,
// un mot énorme, une phrase, et une barre qui se vide. Synchronisé : tous
// les téléphones l'ouvrent et le ferment à la même seconde (echéance serveur).
function vueEntracte(msg) {
  return `${STYLE}<div class="du">
    <div class="dui">
      <div class="dui-bg" aria-hidden="true">
        <i class="b1"></i><i class="b2"></i><i class="b3"></i>
        <span class="dui-ray"></span>
      </div>

      <div class="dui-centre">
        ${
          PUB.externe
            ? `<span class="dui-lab"${R()}>${t("ad", "Publicité")}</span>`
            : ""
        }
        <div class="dui-slot" id="du-pub-slot">
          <p class="dui-mot" id="dui-mot"${R()}>${esc(msg.mot)}</p>
          <p class="dui-ligne"${R()}>${esc(msg.ligne)}</p>
        </div>
      </div>

      <div class="dui-bas">
        <div class="dui-meta">
          <span class="dui-tag"${R()}>${t("next_round", "Manche suivante")}</span>
          <span class="dui-sec" id="dui-sec">0</span>
        </div>
        <div class="dui-piste"><span class="dui-jauge" id="dui-jauge"></span></div>
      </div>
    </div>
  </div>`;
}

// L'écran commence SOUS le bandeau du haut, pas en haut de la fenêtre. Une
// hauteur de 100dvh le fait donc dépasser par le bas d'exactement la hauteur
// du bandeau, et la barre du compte à rebours finit cachée derrière le menu.
// On retire la marge du haut, mesurée plutôt que devinée : elle change avec
// l'encoche du téléphone.
function caleEcran(root) {
  const el = root.querySelector(".dui");
  if (!el) return;
  const haut = Math.max(0, Math.round(el.getBoundingClientRect().top));
  el.style.minHeight = `calc(100dvh - ${haut}px)`;
}

// Le mot doit remplir la largeur, qu'il fasse quatre lettres ou douze. On le
// pose à une taille de référence, on mesure, et on applique le rapport. Sans
// ça « Calme » flotte au milieu de l'écran et « Rétroviseurs » déborde.
function ajusteMot(root) {
  const el = root.querySelector("#dui-mot");
  if (!el) return;
  // ⚠️ On mesure sur la COLONNE, jamais sur le parent direct du mot : le mot
  // est en `nowrap`, donc son conteneur se dimensionne SUR LUI. Mesurer là
  // revient à comparer le mot à lui-même, et il ressort toujours « à la
  // bonne taille » en débordant de l'écran.
  const ecran = el.closest(".dui");
  const dispo = Math.max(200, (ecran?.clientWidth || 360) - 34);
  el.style.fontSize = "80px";
  const large = el.scrollWidth;
  if (!large) return;
  const taille = Math.max(30, Math.min(92, (80 * dispo) / large));
  el.style.fontSize = `${Math.round(taille)}px`;
}

// ───────────────────────────── Le classement ─────────────────────────────
function vueClassement(etat) {
  const c = (etat.classement || []).filter((p) => p.fini);
  const attente = (etat.classement || []).filter((p) => !p.fini);
  const top = c.slice(0, 3);
  const reste = c.slice(3);
  const gagnant = top[0];
  const ordre = [top[1], top[0], top[2]]; // 2e · 1er · 3e
  const hauteurs = ["s2", "s1", "s3"];
  const rangs = ["2", "1", "3"];
  const connecte = !!getCurUser();

  const podium = ordre
    .map((p, col) => {
      if (!p) return `<div></div>`;
      const idx = c.indexOf(p);
      return `<div class="du-who${col === 1 ? " first" : ""}">
        <div class="head" style="background:${COULEURS[idx % COULEURS.length]}">${esc(initiale(p.name))}</div>
        <div class="name">${esc(p.name)}</div>
        <div class="pts">${chiffres(p.score)}</div>
      </div>`;
    })
    .join("");
  const marches = ordre
    .map((p, col) =>
      p
        ? `<div class="du-step ${hauteurs[col]}">${rangs[col]}</div>`
        : `<div></div>`,
    )
    .join("");

  return coque(`
    <img class="du-mascot" src="/skins/mascot-celebrate.webp" alt="" style="width:92px;height:92px">
    <h1 class="du-win"${R()}>${
      gagnant
        ? t("takes_title", "{n} prend le titre", { n: esc(gagnant.name) })
        : t("running", "Partie en cours")
    }</h1>
    ${
      gagnant
        ? `<p class="du-sub" style="margin:6px 0 0"${R()}>${t("points", "{p} points", { p: chiffres(gagnant.score) })}${
            gagnant.correct != null
              ? ` · ${t("correct_of", "{c} sur {t}", { c: gagnant.correct, t: etat.total })}`
              : ""
          }</p>`
        : `<p class="du-sub" style="margin:6px 0 0"${R()}>${t("nobody_done", "Personne n'a encore fini")}</p>`
    }
    ${c.length ? `<div class="du-podium">${podium}${marches}</div>` : ""}
    ${reste
      .map(
        (p, i) =>
          `<div class="du-row"><span class="rk">${i + 4}</span><span class="nm">${esc(p.name)}</span><span class="sc">${chiffres(p.score)}</span></div>`,
      )
      .join("")}
    ${
      attente.length
        ? `<p class="du-note"${R()}>${t("waiting", "On attend {n}.", { n: esc(attente.map((p) => p.name).join(" · ")) })}</p>`
        : ""
    }
    ${
      etat.ratee
        ? `<div class="du-card">
             <span class="du-eyebrow"${R()}>${t("nobody_had", "Personne ne l'a eue")}</span>
             <h3${R()}>${esc(etat.ratee.question)}</h3>
             <p class="du-bonne"${R()}>${esc(etat.ratee.options?.[etat.ratee.correct_index] || "")}</p>
             ${etat.ratee.explanation ? `<p${R()}>${esc(etat.ratee.explanation)}</p>` : ""}
           </div>`
        : ""
    }
    ${
      connecte
        ? `<button class="du-cta gold" data-relancer style="margin-top:22px">${t("replay", "Rejouer")}</button>
           <button class="du-ghost" data-rafraichir>${t("refresh", "Rafraîchir")}</button>`
        : `<button class="du-cta gold" data-compte style="margin-top:22px">${t("create_free", "Créer mon compte gratuit")}</button>
           <button class="du-ghost" data-rafraichir>${t("refresh", "Rafraîchir")}</button>
           <p class="du-note"${R()}>${t("keeps", "Ton score tient 7 jours.")}</p>`
    }
  `);
}

// ───────────────────────────── Montage ───────────────────────────────────
export async function mount(root, param) {
  unmount(); // une navigation en plein chrono ne laisse rien tourner derrière
  _lang = chargeLangue(); // langue de la partie précédente, ou celle de l'app
  const code = String(param || "")
    .toUpperCase()
    .trim();
  const me = getCurUser();

  // Pas de code : c'est l'hôte qui veut créer. Il lui faut un compte.
  if (!code) {
    if (!me) return navigate("/login");
    track("page_view", { page: "duel_creation" });
    const etat = { code: null, joueurs: [] };
    root.innerHTML = vueCreation(etat);
    cableCreation(root, me, etat);
    return;
  }

  track("page_view", { page: "duel_partie" });
  root.innerHTML = squelette();

  const garde = jeton(code);
  const etat = {
    code,
    index: 0,
    status: "lobby",
    deadline: null,
    revealUntil: null,
    reponse: null,
    reveal: null,
    points: 0,
    bonnes: 0,
    serie: 0,
    joueurs: [],
    questions: [],
    total: 10,
    leaderAvant: new Map(), // nom → total, pour détecter un changement de tête
    playerId: garde?.playerId || null,
    fini: !!garde?.fini,
    _sig: null,
  };

  if (etat.fini) return afficheClassement(root, etat);

  let info;
  try {
    info = await appel("results", { code });
    etat.joueurs = (info.classement || []).map((p) => p.name);
    etat.hote = info.hote || info.classement?.[0]?.name || null;
    etat.total = info.total || 10;
  } catch (e) {
    if (String(e.message) === "introuvable") {
      root.innerHTML = coque(`
        <div class="du-wordmark">PermiGo</div>
        <h1 class="du-title" style="margin-top:40px"${R()}>${t("over", "Cette partie est finie")}</h1>
        <p class="du-sub"${R()}>${t("over_sub", "Un lien tient 7 jours.<br>Demande à ton ami d'en relancer une.")}</p>
        <button class="du-cta gold" data-accueil>${t("discover", "Découvrir PermiGo")}</button>
      `);
      root
        .querySelector("[data-accueil]")
        ?.addEventListener("click", () => navigate("/"));
      return;
    }
    toast("Connexion impossible pour le moment", "error");
    return;
  }

  if (info.status === "finished") {
    poseJeton(code, { playerId: etat.playerId, fini: true });
    etat.fini = true;
    return afficheClassement(root, etat);
  }

  if (etat.playerId) {
    // Déjà dans la partie (rejoint plus tôt, ou reprise après un refresh).
    return demarrePartieSynchro(root, etat, info);
  }

  root.innerHTML = vueArrivee(etat);
  cableArrivee(root, etat);
}

// Dessine le QR APRÈS le rendu, jamais pendant : la bibliothèque arrive en
// import différé et son échec ne doit pas vider l'écran (piège du 02/08 sur la
// landing). Le lien et le bouton de partage sont posés avant.
async function dessineQr(root, lien) {
  const boite = root.querySelector("#du-qrbox");
  if (!boite) return;
  try {
    const { default: qrcode } = await import("qrcode-generator");
    const qr = qrcode(0, "M");
    qr.addData(lien);
    qr.make();
    boite.innerHTML = `<img src="${qr.createDataURL(8, 2)}" alt="Le carré à viser pour rejoindre la partie" width="256" height="256">`;
  } catch (e) {
    console.error("[duel:qr]", e);
    boite.innerHTML = `<span class="du-qrfail">Le carré n'a pas pu s'afficher. Envoie le lien juste en dessous.</span>`;
  }
}

// Le salon se rafraîchit tout seul : l'hôte doit VOIR ses amis arriver, sinon
// il croit que le lien n'a pas marché (remonté par Rayan le 03/08). On ne
// remplace que la rangée des places, pas l'écran, pour épargner le QR.
function suitLeSalon(root, etat) {
  stopSalon();
  _salon = setInterval(async () => {
    if (!document.body.contains(root)) return stopSalon();
    try {
      const info = await appel("results", { code: etat.code });
      const noms = (info.classement || []).map((p) => p.name);
      const avant = etat.joueurs || [];
      const neufs = noms.filter((n) => !avant.includes(n));
      if (!neufs.length && noms.length === avant.length) return;
      etat.joueurs = noms;
      const zone = root.querySelector("#du-slots");
      if (zone) zone.innerHTML = slotsHTML(noms, neufs);
      const lab = root.querySelector("#du-lab-salon");
      if (lab) lab.textContent = `Dans la partie · ${noms.length}`;
      if (neufs.length) haptic("tap");
    } catch {
      /* réseau qui tousse : on retentera dans 3 s */
    }
  }, 3000);
}

// Les pastilles de langue. Changer de langue redessine l'écran courant : la
// coque ET les questions suivront, puisque `questions` est rappelé au départ
// du jeu avec la langue retenue.
function cableLangs(root, redessine) {
  root.querySelectorAll("[data-lang]").forEach((b) => {
    b.addEventListener("click", () => {
      const code = b.getAttribute("data-lang");
      if (code === _lang) return;
      haptic("tap");
      poseLangue(code);
      track("duel.langue", { lang: code });
      redessine();
    });
  });
}

function cableCreation(root, me, etat) {
  cableLangs(root, () => {
    root.innerHTML = vueCreation(etat);
    cableCreation(root, me, etat);
  });

  root
    .querySelector("[data-retour]")
    ?.addEventListener("click", () => navigate("/reviser"));

  root.querySelector("[data-creer]")?.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    haptic("tap");
    try {
      const prenom = me.prenom || me.full_name?.split(" ")[0] || "Moi";
      const r = await appel("create", { name: prenom });
      etat.code = r.code;
      etat.playerId = r.playerId;
      etat.joueurs = [prenom];
      poseJeton(r.code, { playerId: r.playerId, fini: false });
      track("duel.cree", { code: r.code });
      root.innerHTML = vueCreation(etat);
      cableCreation(root, me, etat);
    } catch (e) {
      console.error("[duel:create]", e);
      btn.disabled = false;
      toast("La partie n'a pas pu être créée", "error");
    }
  });

  const lien = etat.code ? `${location.origin}/#/duel/${etat.code}` : "";
  if (lien) {
    dessineQr(root, lien);
    suitLeSalon(root, etat);
  }

  root.querySelector("[data-partager]")?.addEventListener("click", async () => {
    haptic("tap");
    track("duel.partage", { code: etat.code });
    const texte = "Tu l'as ton permis ? Prouve-le.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "PermiGo", text: texte, url: lien });
        return;
      } catch {
        /* partage annulé : on retombe sur la copie */
      }
    }
    copie(lien);
  });

  root.querySelector("[data-copier]")?.addEventListener("click", () => {
    haptic("tap");
    copie(lien);
  });

  root.querySelector("[data-jouer]")?.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    haptic("tap");
    try {
      await appel("start", { code: etat.code, playerId: etat.playerId });
      stopSalon();
      navigate(`/duel/${etat.code}`);
    } catch (e) {
      console.error("[duel:start]", e);
      btn.disabled = false;
      toast("La partie n'a pas pu démarrer", "error");
    }
  });
}

function copie(lien) {
  navigator.clipboard
    ?.writeText(lien)
    .then(() => toast(t("copied", "Lien copié"), "success"))
    .catch(() => toast("Copie impossible sur ce navigateur", "error"));
}

function cableArrivee(root, etat) {
  cableLangs(root, () => {
    root.innerHTML = vueArrivee(etat);
    cableArrivee(root, etat);
  });
  const input = root.querySelector("#du-nom");
  const go = async () => {
    const nom = (input?.value || "").trim();
    if (!nom) {
      input?.focus();
      toast(t("need_name", "Il me faut juste ton prénom"), "info");
      return;
    }
    const btn = root.querySelector("[data-entrer]");
    if (btn) btn.disabled = true;
    haptic("tap");
    try {
      const r = await appel("join", { code: etat.code, name: nom });
      etat.playerId = r.playerId;
      etat.total = r.total || 10;
      etat.joueurs = [...(r.players || []), r.name];
      poseJeton(etat.code, { playerId: r.playerId, fini: false });
      track("duel.rejoint", { code: etat.code });
      demarrePartieSynchro(root, etat, { status: "lobby" });
    } catch (e) {
      console.error("[duel:join]", e);
      if (btn) btn.disabled = false;
      if (String(e.message) === "commencee") {
        root.innerHTML = vueDejaCommencee();
        root
          .querySelector("[data-creer-perso]")
          ?.addEventListener("click", () => navigate("/duel"));
        return;
      }
      toast(
        String(e.message) === "complet"
          ? t("full", "La partie est complète")
          : t("cant_join", "Impossible de rejoindre"),
        "error",
      );
    }
  };
  root.querySelector("[data-entrer]")?.addEventListener("click", go);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") go();
  });
  input?.focus();
}

// ═══════════════════════════ La partie synchronisée ═══════════════════════
// Point d'entrée unique une fois `playerId` connu, que ce soit juste après un
// `join`, juste après le `start` de l'hôte, ou une reprise après un refresh.
async function demarrePartieSynchro(root, etat, infoInitiale) {
  stopSalon();
  if (!etat.questions.length) {
    try {
      const r = await appel("questions", { code: etat.code, lang: _lang });
      etat.questions = r.questions || [];
    } catch (e) {
      console.error("[duel:questions]", e);
      toast("Les questions n'ont pas pu être chargées", "error");
      return;
    }
  }
  abonneCanal(root, etat);
  sondeEtat(root, etat);
  appliqueEtatServeur(root, etat, infoInitiale);
}

// Écoute la diffusion Realtime : c'est elle qui donne l'instantanéité (les
// deux téléphones basculent à la même frappe de clavier serveur, pas au
// prochain sondage de 2,5 s).
function abonneCanal(root, etat) {
  stopCanal();
  _canal = sb
    .channel(`duel:${etat.code}`)
    .on("broadcast", { event: "round" }, ({ payload }) =>
      appliqueEtatServeur(root, etat, payload),
    )
    .on("broadcast", { event: "intermission" }, ({ payload }) =>
      appliqueEtatServeur(root, etat, payload),
    )
    .on("broadcast", { event: "reveal" }, ({ payload }) =>
      appliqueEtatServeur(root, etat, payload, payload),
    )
    .on("broadcast", { event: "finished" }, ({ payload }) =>
      appliqueEtatServeur(root, etat, payload),
    )
    .subscribe();
}

// Le filet de sécurité : si un message de diffusion se perd (réseau qui
// tousse, onglet mis en veille), ce sondage rattrape l'état réel dans les
// 2,5 secondes qui suivent plutôt que de laisser un téléphone figé.
function sondeEtat(root, etat) {
  stopSonde();
  _sonde = setInterval(async () => {
    if (!document.body.contains(root)) return stopSonde();
    try {
      const s = await appel("state", { code: etat.code });
      appliqueEtatServeur(root, etat, s);
    } catch {
      /* on retentera au prochain tour */
    }
  }, 2500);
}

function signatureEtat(s) {
  return `${s.status}:${s.index}`;
}

// Le seul endroit qui décide de ce qui s'affiche, qu'on arrive par la
// diffusion, le sondage, ou la réponse directe d'un appel réseau. Centraliser
// ici évite qu'un double événement (diffusion + sondage qui se croisent)
// redessine ou rejoue un son deux fois.
async function appliqueEtatServeur(root, etat, s, revealPayload) {
  if (!s || !s.status) return;
  const sig = signatureEtat(s);
  const dejaVu = sig === etat._sig;
  etat.status = s.status;
  etat.index = s.index;
  etat.deadline = s.deadline;
  etat.revealUntil = s.revealUntil;

  if (s.status === "lobby") {
    if (!dejaVu) {
      root.innerHTML = vueAttente(etat);
      etat._sig = sig;
    }
    return;
  }

  if (s.status === "playing") {
    if (etat.reponse !== null && etat._sig === sig) return; // déjà en attente, rien à changer
    if (dejaVu && etat.reponse === null) return; // déjà affichée, pas de flicker
    etat.reponse = null;
    etat._sig = sig;
    afficheQuestion(root, etat);
    return;
  }

  if (s.status === "reveal") {
    if (dejaVu && etat.reveal) return;
    etat._sig = sig;
    let payload = revealPayload;
    // Le sondage de secours ne porte pas le détail des réponses (seulement
    // l'état), on le reconstruit depuis `results` : moins riche (pas de « qui
    // a choisi quoi »), mais jamais un écran figé.
    if (!payload || !payload.reponses) {
      try {
        const r = await appel("results", { code: etat.code });
        payload = {
          reponses: (r.classement || []).map((p) => ({
            playerId: p.id,
            name: p.name,
            correct: null,
            points: null,
            choice: -1,
            total: p.score,
          })),
        };
      } catch {
        payload = { reponses: [] };
      }
    }
    const commentaire = commentaireReveal(
      payload.reponses,
      etat.leaderAvant,
      _lang,
    );
    etat.leaderAvant = new Map(
      payload.reponses.map((r) => [r.name, r.total ?? 0]),
    );
    if (payload.correctIndex != null) etat.correctIndex = payload.correctIndex;
    etat.reveal = { ...payload, commentaire };
    stopChrono();
    playDuelBoost();
    root.innerHTML = vueReveal(etat);
    planifieAvance(root, etat, "reveal", etat.index);
    return;
  }

  if (s.status === "intermission") {
    if (dejaVu) return;
    etat._sig = sig;
    stopChrono();
    const msg = prochainMessage(_lang);
    root.innerHTML = vueEntracte(msg);
    root.__code = etat.code;
    window.scrollTo(0, 0);
    caleEcran(root);
    ajusteMot(root);
    document.fonts?.ready.then(() => ajusteMot(root)).catch(() => {});
    track("duel.entracte", {
      code: etat.code,
      score: etat.points,
      message: msg.index,
    });
    if (typeof PUB.externe === "function") {
      const slot = root.querySelector("#du-pub-slot");
      try {
        if (slot) PUB.externe(slot);
      } catch (e) {
        console.error("[duel:pub]", e);
      }
    }
    armeBarreEcheance(root, etat.revealUntil);
    planifieAvance(root, etat, "intermission", etat.index);
    return;
  }

  if (s.status === "finished") {
    stopChrono();
    stopSonde();
    stopCanal();
    poseJeton(etat.code, { playerId: etat.playerId, fini: true });
    etat.fini = true;
    afficheClassement(root, etat);
  }
}

// La question s'affiche, on arme le chrono sur l'ÉCHÉANCE DU SERVEUR (pas une
// durée locale) : un téléphone qui rejoint le rendu deux secondes après les
// autres voit quand même le bon temps restant, pas 20 secondes pleines.
function afficheQuestion(root, etat) {
  root.innerHTML = vueQuestion(etat);
  if (etat.reponse === null) {
    armeChronoSync(root, etat);
  } else {
    stopChrono(); // déjà répondu : plus de compte à rebours à afficher ni à armer
  }
  root.querySelectorAll("[data-rep]").forEach((b) => {
    b.addEventListener("click", () =>
      soumetsReponse(root, etat, Number(b.getAttribute("data-rep"))),
    );
  });
}

function armeChronoSync(root, etat) {
  stopChrono();
  const jauge = root.querySelector("#du-jauge");
  const sec = root.querySelector("#du-sec");
  const echeance = new Date(etat.deadline).getTime();
  const restant0 = Math.max(0, echeance - Date.now());
  if (jauge) {
    const i = jauge.querySelector("i");
    if (i) {
      i.style.transition = "none";
      i.style.transform = "scaleX(1)";
      requestAnimationFrame(() => {
        i.style.transition = `transform ${restant0}ms linear`;
        i.style.transform = "scaleX(0)";
      });
    }
  }
  _tick = setInterval(() => {
    const reste = Math.max(0, Math.ceil((echeance - Date.now()) / 1000));
    if (sec) sec.textContent = String(reste);
    if (reste <= 5) {
      jauge?.classList.add("urgent");
      sec?.classList.add("urgent");
    }
  }, 200);
  _fin = setTimeout(() => {
    if (etat.reponse === null) soumetsReponse(root, etat, -1);
  }, restant0);
}

// Une barre qui se vide, réutilisée pour le reveal ET l'intermission : les
// deux sont « une pause avec une échéance serveur », seule la durée change.
function armeBarreEcheance(root, revealUntil) {
  const jauge = root.querySelector("#dui-jauge");
  const sec = root.querySelector("#dui-sec");
  const echeance = new Date(revealUntil).getTime();
  if (jauge) {
    requestAnimationFrame(() => {
      jauge.style.transition = `transform ${Math.max(0, echeance - Date.now())}ms linear`;
      jauge.style.transform = "scaleX(0)";
    });
  }
  _tick = setInterval(() => {
    const reste = Math.max(0, Math.ceil((echeance - Date.now()) / 1000));
    if (sec) sec.textContent = chiffres(reste);
  }, 120);
}

// N'importe quel téléphone peut faire avancer la manche : c'est celui dont le
// minuteur local touche zéro EN PREMIER qui gagne la course, les autres
// reçoivent juste l'état qui en résulte (diffusion ou sondage). Le serveur
// est gardé par l'état ATTENDU, donc deux appels concurrents ne font jamais
// avancer la partie deux fois.
function planifieAvance(root, etat, statusAttendu, indexAttendu) {
  const echeance = new Date(etat.revealUntil).getTime();
  const delai = Math.max(50, echeance - Date.now());
  _avance = setTimeout(async () => {
    try {
      const s = await appel("next", {
        code: etat.code,
        expectedStatus: statusAttendu,
        expectedIndex: indexAttendu,
      });
      appliqueEtatServeur(root, etat, s);
    } catch (e) {
      console.error("[duel:next]", e);
      // Le sondage de secours (2,5 s) rattrapera de toute façon l'état réel.
    }
  }, delai);
}

// Envoie la réponse (index choisi, ou -1 si le temps est écoulé). Le retour
// donne à CE téléphone ses points tout de suite (pas besoin d'attendre le
// reveal pour savoir combien il a gagné) ; si ce joueur est le dernier à
// répondre, la réponse porte aussi le reveal complet, prêt à afficher sans
// attendre l'aller retour de la diffusion.
async function soumetsReponse(root, etat, choix) {
  if (etat.reponse !== null) return;
  stopChrono();
  const q = etat.questions[etat.index];
  etat.reponse = choix;
  const localementCorrect = choix === q.correct_index;
  if (localementCorrect) {
    playCorrect();
    haptic("success");
  } else {
    playWrong();
    haptic("error");
  }
  afficheQuestion(root, etat); // repasse en mode « attends », boutons désactivés

  try {
    const r = await appel("answer", {
      code: etat.code,
      playerId: etat.playerId,
      index: etat.index,
      choice: choix,
    });
    if (r.perime) return; // la manche a déjà avancé, le sondage rattrapera
    etat.points += r.points || 0;
    if (r.correct) {
      etat.bonnes++;
      etat.serie++;
    } else {
      etat.serie = 0;
    }
    if (r.reveal) appliqueEtatServeur(root, etat, r.reveal, r.reveal);
  } catch (e) {
    console.error("[duel:answer]", e);
    // Le sondage de secours rattrapera l'état réel dans les 2,5 s.
  }
}

async function afficheClassement(root, etat) {
  stopChrono();
  stopSalon();
  stopSonde();
  stopCanal();
  root.innerHTML = squelette();
  try {
    const r = await appel("results", { code: etat.code });
    etat.classement = r.classement || [];
    etat.ratee = r.ratee || null;
    etat.total = r.total || etat.total;
  } catch (e) {
    console.error("[duel:results]", e);
    toast("Le classement n'a pas pu être chargé", "error");
    return;
  }
  root.innerHTML = vueClassement(etat);

  root.querySelector("[data-relancer]")?.addEventListener("click", () => {
    haptic("tap");
    track("duel.relance", { code: etat.code });
    navigate("/duel");
  });
  root.querySelector("[data-rafraichir]")?.addEventListener("click", () => {
    haptic("tap");
    afficheClassement(root, etat);
  });
  // « creer-compte » est l'inscription des MONITEURS indépendants. Un invité du
  // duel est un futur ÉLÈVE : sa porte est le compte solo gratuit (constaté par
  // Rayan le 03/08, il atterrissait sur la page moniteur).
  root.querySelector("[data-compte]")?.addEventListener("click", () => {
    haptic("tap");
    track("duel.vers_compte", { code: etat.code });
    navigate("/rejoindre?solo=1");
  });
}
