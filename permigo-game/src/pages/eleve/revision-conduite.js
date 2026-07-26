// ═══════════════════════════════════════════════════════════════
// Élève — « Révision conduite »
// Le différenciateur PermiGo : on révise le GESTE de conduite (pas le code),
// entre les leçons. Données = src/data/fiches-conduite.js (vécu de vrais
// moniteurs). Mécanique : fiche → 3 questions en récupération active (flashcard).
//
// v1 100% front + localStorage (aucune table DB). Le pilotage par le moniteur
// (« Avant/Après ta leçon ») viendra dans une 2e couche (nécessite la DB).
// ═══════════════════════════════════════════════════════════════
import { esc, escAttr } from "@/utils/escape.js";
import { navigate } from "@/router.js";
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { haptic } from "@/utils/haptic.js";
import { mountPremiumQuiz } from "@/components/eleve/premium-quiz.js";
import { quizByCode } from "@/data/quiz-conduite.js";
import { track } from "@/services/analytics.js";
import { medallion } from "@/utils/medallions.js";
import { getLang } from "@/utils/lang.js";
import { ficheTr, uiFiche } from "@/data/fiches-i18n.js";
import { openCoachSheet } from "@/components/eleve/coach-sheet.js";
import {
  isFreeTierUser,
  freeQuota,
  consumeFree,
  resetIfNewDay,
} from "@/utils/free-tier.js";
import { mountFreeTierWall } from "@/components/eleve/free-tier-wall.js";
import { ficheSchemas } from "@/data/fiches-schemas.js";
import {
  FICHES,
  MONDES,
  getFiche,
  fichesByMonde,
} from "@/data/fiches-conduite.js";

const LS_KEY = "rvc_revised_v1"; // { [code]: isoDate }
const LS_READ_KEY = "rvc_read_v1"; // { [code]: 1 } — fiche déjà déroulée (relecture = tout affiché)

function loadRead() {
  try {
    return JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

// ── Ré-hydratation multi-appareils ────────────────────────────────
// Le compteur de fiches lues vivait UNIQUEMENT en localStorage → un élève
// qui a tout lu voyait « 0/31 » sur un autre appareil. Or chaque lecture est
// déjà en base (event `revision_conduite_fiche_read`, properties.code). Au
// montage, on récupère les codes lus côté serveur (RPC SECURITY DEFINER,
// l'élève n'a pas de policy SELECT directe sur events_analytics) et on les
// FUSIONNE dans le localStorage. Best-effort : RPC absente / hors-ligne →
// on garde le comportement local d'avant (aucune régression).
async function hydrateReadFromServer() {
  try {
    const { data, error } = await sb.rpc("get_my_conduite_fiches_read");
    if (error || !Array.isArray(data) || !data.length) return;
    const r = loadRead();
    let changed = false;
    for (const code of data) {
      if (code && !r[code]) {
        r[code] = 1;
        changed = true;
      }
    }
    if (changed) localStorage.setItem(LS_READ_KEY, JSON.stringify(r));
  } catch {
    /* hors-ligne / RPC pas encore déployée : repli localStorage */
  }
}
function markRead(code) {
  const r = loadRead();
  r[code] = 1;
  try {
    localStorage.setItem(LS_READ_KEY, JSON.stringify(r));
  } catch {
    /* quota / private mode : non bloquant */
  }
}

function loadRevised() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function markRevised(code) {
  const r = loadRevised();
  r[code] = new Date().toISOString();
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(r));
  } catch {
    /* quota / private mode : non bloquant */
  }
}
function revisedToday(code, revised) {
  const iso = revised[code];
  if (!iso) return false;
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

// Point faible du jour : la compétence la moins récemment révisée
// (jamais révisée d'abord), déterministe et stable dans la journée.
function pointFaible(revised) {
  if (!FICHES.length) return null;
  const sorted = [...FICHES].sort((a, b) => {
    const ra = revised[a.code] || "";
    const rb = revised[b.code] || "";
    return ra < rb ? -1 : ra > rb ? 1 : 0;
  });
  return sorted[0];
}

// Découpe la méthode en sections à partir des préfixes « Label — … » déjà
// présents dans certaines fiches (ex. « Créneau — … », « Règles communes — … »).
// Le libellé doit rester court (≤ 26 car.) pour ne pas confondre avec un tiret
// employé au milieu d'une phrase. Sans préfixe : un seul groupe (label null).
function groupSteps(methode) {
  const groups = [];
  let cur = null;
  for (const raw of methode) {
    const m = raw.match(/^(.{2,26}?) [—–] (.+)$/s);
    const label = m ? m[1].trim() : null;
    const text = m ? m[2].trim() : raw.trim();
    if (!cur || cur.label !== label) {
      cur = { label, steps: [] };
      groups.push(cur);
    }
    cur.steps.push(text);
  }
  return groups;
}

// On ne bascule en accordéons que pour une VRAIE structure en sections :
// assez longue (≥ 8 étapes), ≥ 3 groupes, chacun d'au moins 2 étapes (sinon =
// tiret au milieu d'une phrase, ou fiche courte → liste à plat, plus honnête).
function useGrouped(methode, groups) {
  return (
    methode.length >= 8 &&
    groups.length >= 3 &&
    groups.every((g) => g.steps.length >= 2)
  );
}

// sources = ["chaine-slug/videoId", …] : on n'affiche QUE le nom de la
// chaîne, humanisé — l'id vidéo brut à l'écran faisait note de dev.
function sourceChannels(f) {
  return Array.isArray(f.sources)
    ? [
        ...new Set(
          f.sources
            .map((s) => String(s).split("/")[0].replace(/-/g, " ").trim())
            .filter(Boolean)
            .map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
        ),
      ]
    : [];
}

// ═══════════════════════════════════════════════════════════════
// Intro narrative personnalisée (demande Rayan 22/07) : une à deux phrases
// chaleureuses qui s'adressent à l'élève par son prénom, composées PAR
// TEMPLATE à partir des champs existants (titre + 1re phrase du « pourquoi »).
// Template choisi par hash du code de fiche → stable d'un rendu à l'autre
// (pas de Math.random au rendu). Prénom vide → formulation neutre sans trou.
// Ton : encourageant simple — jamais « échec » ni « maîtrisé ».
// ═══════════════════════════════════════════════════════════════
function firstSentence(txt) {
  const s = String(txt || "").trim();
  const m = s.match(/^[\s\S]*?[.!?…؟](?=\s|$)/);
  return (m ? m[0] : s).trim();
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const INTRO_TPL = {
  fr: [
    (p, t) =>
      p
        ? `Aujourd'hui ${p}, tu attaques « ${t} ».`
        : `Aujourd'hui, tu attaques « ${t} ».`,
    (p, t) =>
      p
        ? `À toi de jouer, ${p} : « ${t} », ça se travaille dès maintenant.`
        : `À toi de jouer : « ${t} », ça se travaille dès maintenant.`,
    (p, t) =>
      p
        ? `C'est parti, ${p} ! Prochaine étape : « ${t} ».`
        : `C'est parti ! Prochaine étape : « ${t} ».`,
  ],
  en: [
    (p, t) =>
      p
        ? `Today ${p}, you're taking on "${t}".`
        : `Today, you're taking on "${t}".`,
    (p, t) =>
      p
        ? `Your turn, ${p}: "${t}" starts right now.`
        : `Your turn: "${t}" starts right now.`,
    (p, t) =>
      p
        ? `Here we go, ${p}! Next step: "${t}".`
        : `Here we go! Next step: "${t}".`,
  ],
  ar: [
    (p, t) => (p ? `اليوم يا ${p}، تبدأ « ${t} ».` : `اليوم تبدأ « ${t} ».`),
    (p, t) =>
      p ? `دورك يا ${p} : « ${t} » يبدأ الآن.` : `دورك : « ${t} » يبدأ الآن.`,
    (p, t) =>
      p
        ? `هيا يا ${p} ! الخطوة التالية : « ${t} ».`
        : `هيا ! الخطوة التالية : « ${t} ».`,
  ],
};
function introText(lang, i, prenom, titre, pourquoi) {
  const bank = INTRO_TPL[lang] || INTRO_TPL.fr;
  const lead = bank[i % bank.length](prenom, titre);
  const why = firstSentence(pourquoi);
  return why ? `${lead} ${why}` : lead;
}

const STYLE = `<style>
.rvc { max-width: 480px; margin: 0 auto; padding: 0 16px calc(110px + env(safe-area-inset-bottom));
  background: var(--bg); color: var(--ink); font-family: 'Inter', sans-serif; }
.rvc-top { display:flex; align-items:center; gap:10px; padding:16px 0 8px; }
.rvc-back { width:38px; height:38px; border-radius:11px; border:0; cursor:pointer;
  background: var(--su, #fff); color: var(--ink); font-size:20px; line-height:1;
  box-shadow: 0 1px 4px rgba(0,0,0,.08); flex-shrink:0; }
.rvc-back:active { transform: scale(0.95); }
.rvc-h1 { font: 800 22px/1.1 'Plus Jakarta Sans', sans-serif; letter-spacing:-.025em; margin:0; }
.rvc-sub { color: var(--mu, #64748b); font-size:13px; line-height:1.5; margin:2px 0 0; }

.rvc-go { position:sticky; bottom: calc(16px + env(safe-area-inset-bottom)); width:100%;
  border:0; border-radius:14px; padding:15px; cursor:pointer; margin-top:18px;
  font:800 16px 'Plus Jakarta Sans',sans-serif; color:#fff; background:var(--a,#6366f1);
  box-shadow:0 8px 20px color-mix(in srgb, var(--a,#6366f1) 40%, transparent); }
.rvc-go:active { transform: scale(0.98); }

/* Flashcards */
.rvc-prog { font:700 12px 'IBM Plex Mono',monospace; color:var(--mu,#64748b); text-align:center; margin:10px 0 14px; }
@keyframes rvcrise { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
.rvc-done { text-align:center; padding:40px 16px; }
.rvc-done-e { font-size:54px; animation: rvcrise .35s cubic-bezier(.23,1,.32,1) both; }
.rvc-done-t { font:800 22px 'Plus Jakarta Sans',sans-serif; margin:10px 0 4px; }
.rvc-ohint { color:var(--mu,#64748b); font-size:13px; margin:2px 0 14px; }
.rvc-oslot { display:flex; align-items:center; gap:10px; padding:11px 12px; border-radius:12px; margin-bottom:8px; background: color-mix(in srgb,#10b981 12%, transparent); font-size:14px; line-height:1.35; animation: rvcrise .25s cubic-bezier(.23,1,.32,1); }
.rvc-onum { width:22px; height:22px; border-radius:50%; background:#047857; color:#fff; font:700 12px 'IBM Plex Mono',monospace; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.rvc-opool { display:flex; flex-direction:column; gap:8px; margin-top:6px; }
.rvc-ochip { width:100%; text-align:left; border:1px solid var(--bo3,#e2e8f0); background:var(--su,#fff); color:var(--ink); border-radius:12px; padding:12px; cursor:pointer; font:600 14px/1.35 'Inter',sans-serif; transition: transform .12s ease-out; }
.rvc-ochip:active { transform: scale(0.985); }
.rvc-shake { animation: rvcshake .35s; border-color:#ef4444 !important; }
@keyframes rvcshake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }

@media (prefers-reduced-motion: reduce) { .rvc *, .rvc *::before { transition:none !important; animation:none !important; } }
</style>`;

// ═══════════════════════════════════════════════════════════════
// Fiche « Deck » indigo (DA Arène jour — choix Rayan 2026-07-17).
// Univers du jeu (nuit-indigo + or, Clash Royale) MAIS fond clair/lisible :
// cartes blanches sur indigo. La méthode = un « deck » de gestes à cocher
// (médailles or), les 3 « à retenir » deviennent des cartes coach discrètes,
// une seule action or « Teste-toi ». Style auto-contenu (scopé .fd) pour ne
// pas interférer avec le CSS partagé (STYLE) ni le global.
// ═══════════════════════════════════════════════════════════════
const FD_STYLE = `<style>
.fd{ position:relative; max-width:480px; margin:0 auto; min-height:100dvh;
  font-family:'Inter',sans-serif; color:#ded7ff; overflow-x:hidden;
  padding:0 0 calc(96px + env(safe-area-inset-bottom));
  background:
    radial-gradient(120% 55% at 50% -6%, rgba(240,169,63,.16) 0%, rgba(240,169,63,0) 55%),
    radial-gradient(120% 60% at 82% 12%, rgba(150,120,255,.30) 0%, rgba(150,120,255,0) 60%),
    linear-gradient(#5a4fc0 0%, #4a3fa4 60%, #423a96 100%); }
.fd *{ box-sizing:border-box; }
.fd-gold{ background:linear-gradient(180deg,#ffe9b0 0%,#f6c85f 40%,#f0a93f 72%,#d98a1f 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; }

.fd-hero{ position:relative; padding:16px 18px 20px; }
.fd-topbar{ display:flex; align-items:center; gap:12px; }
.fd-back{ width:42px; height:42px; flex:0 0 42px; border-radius:14px; cursor:pointer;
  background:linear-gradient(180deg,#ffffff,#efecff); border:1px solid #e6e2fb; border-top-color:#fff;
  box-shadow:0 4px 0 rgba(20,12,60,.35), inset 0 1px 0 rgba(255,255,255,.9);
  display:flex; align-items:center; justify-content:center; }
.fd-back:active{ transform:translateY(2px); box-shadow:0 2px 0 rgba(20,12,60,.35); }
.fd-back svg{ display:block; }
.fd-tag{ display:inline-flex; align-items:center; gap:7px; min-width:0; padding:7px 13px 7px 9px; border-radius:999px;
  background:linear-gradient(180deg,rgba(240,169,63,.28),rgba(240,169,63,.10)); border:1px solid rgba(240,169,63,.55);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.20); }
.fd-dot{ width:20px; height:20px; border-radius:50%; flex:0 0 20px;
  background:radial-gradient(circle at 35% 28%,#ffe9b0,#f0a93f 60%,#b46a10);
  box-shadow:inset 0 -2px 3px rgba(120,60,0,.55), inset 0 1px 1px rgba(255,255,255,.7); }
.fd-tag b{ font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:12px; letter-spacing:.08em; color:#ffe4a6;
  text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fd-title{ font-family:'Baloo 2',cursive; font-weight:800; font-size:27px; line-height:1.07; letter-spacing:-.01em;
  margin:15px 0 4px; filter:drop-shadow(0 2px 0 rgba(60,30,0,.30)); }
.fd-sub{ font-size:13px; color:#ded7ff; font-weight:600; margin-bottom:16px; }

.fd-xp{ background:linear-gradient(180deg,#ffffff,#f6f4ff); border:1px solid #e6e2fb; border-top-color:#fff;
  border-radius:18px; padding:13px 15px 15px; box-shadow:0 6px 18px rgba(20,12,60,.28), inset 0 1px 0 rgba(255,255,255,.9); }
.fd-xp-top{ display:flex; align-items:baseline; justify-content:space-between; margin-bottom:9px; }
.fd-xp-top .lab{ font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:12px; letter-spacing:.06em; color:#6b5fa0; text-transform:uppercase; }
.fd-xp-top .cnt{ font-family:'Baloo 2',cursive; font-weight:800; font-size:17px; }
.fd-xp-top .cnt small{ font-size:13px; color:#6b5fa0; -webkit-text-fill-color:#6b5fa0; font-family:'Inter',sans-serif; font-weight:700; }
.fd-bar{ height:16px; border-radius:999px; background:#2a2170; border:1px solid rgba(20,12,60,.5);
  box-shadow:inset 0 2px 4px rgba(0,0,0,.45); position:relative; overflow:hidden; }
.fd-bar .fill{ position:absolute; top:2px; bottom:2px; left:2px; border-radius:999px;
  background:linear-gradient(180deg,#ffe9b0,#f0a93f 55%,#d98a1f);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.7), inset 0 -3px 4px rgba(150,80,0,.45); transition:width .35s cubic-bezier(.23,1,.32,1); }

/* Intro narrative personnalisée (prénom) — bloc discret sous le héros. */
.fd-intro{ margin:0 18px 2px; display:flex; gap:11px; align-items:flex-start; padding:13px 15px 14px; border-radius:16px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.16); box-shadow:inset 0 1px 0 rgba(255,255,255,.10); }
.fd-intro-ic{ flex:0 0 30px; width:30px; height:30px; border-radius:10px; display:flex; align-items:center; justify-content:center;
  background:rgba(255,223,150,.14); border:1px solid rgba(255,223,150,.30); }
.fd-intro p{ margin:0; font:600 13.5px/1.6 'Inter',sans-serif; color:#efe9ff; }
.fd-intro p .fd-fr{ color:#b9aee0; opacity:.85; }

.fd-seclab{ display:flex; align-items:center; gap:10px; padding:0 18px; margin:22px 0 12px; }
.fd-seclab h2{ font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:13px; letter-spacing:.10em; text-transform:uppercase; color:#ded7ff; white-space:nowrap; margin:0; }
.fd-seclab .line{ height:1px; flex:1; background:linear-gradient(90deg,rgba(222,215,255,.55),transparent); }

.fd-deck{ padding:0 18px; display:flex; flex-direction:column; gap:9px; }
.fd-deck + .fd-seclab{ margin-top:20px; }
.fd-card{ position:relative; display:flex; align-items:center; gap:12px; width:100%; text-align:left; cursor:pointer;
  padding:12px 14px 12px 12px; border-radius:16px; background:#f6f4ff; border:1px solid #e6e2fb; border-top-color:#fff;
  box-shadow:0 4px 0 rgba(20,12,60,.35), inset 0 1px 0 rgba(255,255,255,.8);
  -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.fd-card:active{ transform:scale(.99); }
.fd-card.done{ background:linear-gradient(180deg,#fff8ea,#fdefcc); border-color:rgba(240,169,63,.55); border-top-color:#fff3d4;
  box-shadow:0 4px 0 rgba(150,95,10,.32), inset 0 1px 0 rgba(255,255,255,.8), 0 0 0 1px rgba(240,169,63,.18); }
.fd-card.next{ border-color:#c9bff5; border-top-color:#fff;
  box-shadow:0 4px 0 rgba(20,12,60,.35), inset 0 1px 0 rgba(255,255,255,.8), 0 0 0 2px rgba(150,120,255,.38); }
.fd-next-flag{ position:absolute; top:-9px; left:44px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:9px; letter-spacing:.10em;
  color:#1a1240; background:linear-gradient(180deg,#e6d4ff,#b296ff); padding:2px 8px; border-radius:999px; text-transform:uppercase; box-shadow:0 2px 4px rgba(20,12,60,.3); }
.fd-chk{ flex:0 0 34px; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.fd-chk.empty{ border:2.5px dashed rgba(107,95,160,.55); background:rgba(90,79,192,.05); }
.fd-chk.filled{ background:radial-gradient(circle at 36% 28%,#ffe9b0,#f0a93f 58%,#b46a10);
  box-shadow:inset 0 -3px 4px rgba(120,60,0,.55), inset 0 2px 2px rgba(255,255,255,.7), 0 2px 5px rgba(20,12,60,.3); }
.fd-num{ flex:0 0 auto; font-family:'Baloo 2',cursive; font-weight:800; font-size:15px; width:20px; text-align:center; color:#8579b8; }
.fd-card.done .fd-num{ color:#b46a10; }
.fd-card.next .fd-num{ color:#5a4fc0; }
.fd-txt{ font-size:13px; line-height:1.4; color:#241a45; font-weight:600; flex:1; }
.fd-card.done .fd-txt{ color:#4a3712; }
.fd-txt b{ color:#140f33; font-weight:800; }
.fd-card.done .fd-txt b{ color:#7a4c0d; }

.fd-schemas{ margin-top:2px; }
.fd-gal{ display:flex; gap:12px; overflow-x:auto; scroll-snap-type:x mandatory; padding:2px 18px 8px; scrollbar-width:none; }
.fd-gal::-webkit-scrollbar{ display:none; }
.fd-shot{ margin:0; flex:0 0 84%; max-width:340px; scroll-snap-align:center; background:#f6f4ff; border:1px solid #e6e2fb;
  border-radius:16px; overflow:hidden; box-shadow:0 3px 0 rgba(20,12,60,.28), inset 0 1px 0 rgba(255,255,255,.8); }
.fd-shot img{ display:block; width:100%; aspect-ratio:1/1; object-fit:cover; background:#dfe3ea; }
.fd-shot figcaption{ padding:9px 12px 11px; font-size:11.5px; line-height:1.35; color:#3d2f7a; font-weight:600; }

.fd-coach-wrap{ margin-top:6px; }
.fd-coach{ display:grid; gap:9px; padding:0 18px; align-items:stretch; }
/* Carte coach = bouton (demande Rayan 22/07 : tap → lecture en grand). */
.fd-cc{ position:relative; border-radius:14px; padding:11px 10px 12px; background:#f6f4ff; border:1px solid #e6e2fb; border-top-color:#fff;
  box-shadow:0 3px 0 rgba(20,12,60,.28), inset 0 1px 0 rgba(255,255,255,.8); display:flex; flex-direction:column; gap:7px;
  width:100%; text-align:left; font-family:inherit; cursor:pointer;
  -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.fd-cc:active{ transform:scale(.97); }
.fd-cc-zoom{ position:absolute; top:8px; right:8px; width:22px; height:22px; border-radius:7px;
  display:flex; align-items:center; justify-content:center;
  background:rgba(90,79,192,.08); border:1px solid rgba(90,79,192,.16); }
.fd-ic{ width:34px; height:34px; border-radius:11px; flex:none; display:flex; align-items:center; justify-content:center;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.7), 0 2px 4px rgba(20,12,60,.2); }
.fd-cc.err .fd-ic{ background:linear-gradient(180deg,#ffe3d6,#ffd0bd); border:1px solid rgba(230,90,50,.4); }
.fd-cc.why .fd-ic{ background:linear-gradient(180deg,#ece5ff,#ddd2ff); border:1px solid rgba(124,95,224,.4); }
.fd-cc.auto .fd-ic{ background:linear-gradient(180deg,#dcebff,#c6ddff); border:1px solid rgba(63,130,214,.4); }
/* Spans display:block (pas de h4/p dans un <button> — contenu phrasé only). */
.fd-cc-h{ display:block; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:11px; letter-spacing:.02em; line-height:1.15; margin:0; }
.fd-cc.err .fd-cc-h{ color:#c2410c; }
.fd-cc.why .fd-cc-h{ color:#5b3fbf; }
.fd-cc.auto .fd-cc-h{ color:#1e5fa8; }
.fd-cc-p{ display:block; font-size:10.5px; line-height:1.4; color:#6b5fa0; font-weight:500; margin:0; }

.fd-source{ text-align:center; font-size:10.5px; color:#c9bdf5; font-weight:600; margin:18px 18px 0; }
.fd-source b{ color:#ffe4a6; font-weight:700; }

.fd-actions{ padding:16px 18px 0; }
.fd-cta{ display:flex; align-items:center; justify-content:center; gap:10px; width:100%; height:60px; border:none; border-radius:20px; cursor:pointer; position:relative;
  background:linear-gradient(180deg,#ffe9b0 0%,#f6c85f 38%,#f0a93f 72%,#e2951f 100%);
  box-shadow:0 6px 0 #b46a10, 0 12px 20px rgba(180,106,16,.35), inset 0 2px 0 rgba(255,255,255,.7); transition:transform .1s ease, box-shadow .1s ease; }
.fd-cta:active{ transform:translateY(3px); box-shadow:0 3px 0 #b46a10,0 6px 12px rgba(180,106,16,.3),inset 0 2px 0 rgba(255,255,255,.7); }
.fd-cta span{ font-family:'Baloo 2',cursive; font-weight:800; font-size:20px; color:#5a3406; letter-spacing:.01em; text-shadow:0 1px 0 rgba(255,255,255,.35); }
.fd-secondary{ display:flex; align-items:center; justify-content:center; gap:8px; width:100%; height:46px; margin-top:11px; border-radius:15px; cursor:pointer;
  background:linear-gradient(180deg,#ffffff,#ece8ff); border:1px solid #d9d2f5; border-top-color:#fff;
  box-shadow:0 4px 0 rgba(20,12,60,.3), inset 0 1px 0 rgba(255,255,255,.9); transition:transform .1s ease; }
.fd-secondary:active{ transform:translateY(2px); box-shadow:0 2px 0 rgba(20,12,60,.3), inset 0 1px 0 rgba(255,255,255,.9); }
.fd-secondary span{ font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:13px; color:#3d2f7a; }
/* Bilingue (en/ar) : traduction affichée, français gardé dessous (arabe RTL par
   span — l'app reste LTR). Voir lang.js + fiches-i18n.js. */
.fd-tr{ display:block; }
.fd-fr{ display:block; margin-top:4px; font-weight:500; opacity:.62; }
.fd-txt .fd-fr{ font-size:.9em; color:#5b5286; opacity:.72; }
.fd-card.done .fd-txt .fd-fr{ color:#6f5a2a; }
.fd-cc-p .fd-fr{ font-size:.94em; color:#8a7fb5; opacity:.8; margin-top:3px; }
.fd-title .fd-tr{ display:block; }
.fd-title .fd-fr{ -webkit-text-fill-color:#cabef7; color:#cabef7; background:none;
  font-family:'Inter',sans-serif; font-size:.5em; font-weight:600; line-height:1.25; filter:none; }
.fd-seclab h2[dir="rtl"]{ direction:rtl; }
@media (prefers-reduced-motion: reduce){ .fd *{ transition:none!important; animation:none!important; } }
</style>`;

const LS_GESTES_KEY = "rvc_gestes_v1"; // { [code]: number[] } — index des gestes cochés
function loadGestes() {
  try {
    return JSON.parse(localStorage.getItem(LS_GESTES_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function saveGestes(codeK, arr) {
  const g = loadGestes();
  if (arr.length) g[codeK] = arr;
  else delete g[codeK];
  try {
    localStorage.setItem(LS_GESTES_KEY, JSON.stringify(g));
  } catch {
    /* quota / private mode : non bloquant */
  }
}

// ═══════════════════════════════════════════════════════════════
// Hub « Révise ta conduite » — « Carte des mondes » indigo (choix Rayan 2026-07-18).
// Décombré : fini le doublon (hero « reprends » + ligne 1 identique), les 6 blocs
// du même poids. UN seul focus : les 4 mondes REMC en cartes « sélection de niveau »,
// le monde EN COURS agrandi porte l'unique bouton or « Continuer » (pas de carte
// dupliquée). Même DA indigo que la fiche « Deck ». CSS auto-contenu scopé .hub.
// ═══════════════════════════════════════════════════════════════
// Un badge 3D par monde (public/art/reviser/) — partagé hub + liste de monde.
const BADGE_MONDE = { 1: "voiture", 2: "feu", 3: "eclair", 4: "toque" };

// Liste des fiches d'un monde, DA indigo (cohérente avec .hub et .fd). Scopé .wm.
const MONDE_STYLE = `<style>
.wm{ position:relative; max-width:480px; margin:0 auto; min-height:100dvh;
  font-family:'Inter',sans-serif; color:#ded7ff; overflow-x:hidden;
  padding:0 0 calc(96px + env(safe-area-inset-bottom));
  background:
    radial-gradient(120% 46% at 50% -8%, rgba(255,223,150,.18) 0%, rgba(255,223,150,0) 55%),
    radial-gradient(120% 52% at 84% 8%, rgba(150,120,235,.32) 0%, rgba(150,120,235,0) 60%),
    linear-gradient(#5a4fc0 0%, #4a3fa4 60%, #423a96 100%); }
.wm *{ box-sizing:border-box; }
.wm-gold{ background:linear-gradient(180deg,#fff2cf 0%,#ffe093 38%,#f4b24a 72%,#e0921f 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; }
.wm-hero{ display:flex; align-items:center; gap:12px; padding:16px 18px 4px; }
.wm-back{ flex:0 0 38px; width:38px; height:38px; border-radius:12px; cursor:pointer;
  background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14); display:flex; align-items:center; justify-content:center; }
.wm-back:active{ transform:scale(.95); }
.wm-back svg{ display:block; }
.wm-med{ flex:0 0 52px; width:52px; height:52px; border-radius:50%; position:relative;
  background:radial-gradient(circle at 38% 30%,#fff6df,#f6ead0 62%,#e6d6b4); border:1px solid #e6dcc4;
  box-shadow:inset 0 -3px 5px rgba(150,110,40,.22), inset 0 2px 2px rgba(255,255,255,.9), 0 3px 6px rgba(20,12,60,.14);
  display:flex; align-items:center; justify-content:center; }
.wm-med img{ width:40px; height:40px; object-fit:contain; display:block; filter:drop-shadow(0 2px 2px rgba(80,50,10,.28)); }
.wm-htx{ flex:1; min-width:0; }
.wm-name{ font-family:'Baloo 2',cursive; font-weight:800; font-size:21px; line-height:1.05; letter-spacing:-.01em; filter:drop-shadow(0 2px 0 rgba(90,52,6,.3)); }
.wm-sub{ font-family:'Inter',sans-serif; font-weight:600; font-size:12px; color:#c3b8ec; margin-top:2px; }
.wm-prog{ display:flex; align-items:center; gap:10px; padding:10px 20px 16px; }
.wm-bar{ position:relative; flex:1; height:10px; border-radius:999px; background:#2a2170; border:1px solid rgba(20,12,60,.5); box-shadow:inset 0 2px 4px rgba(0,0,0,.4); overflow:hidden; }
.wm-fill{ position:absolute; top:1px; bottom:1px; left:1px; border-radius:999px; background:linear-gradient(180deg,#ffe9b0,#f4b24a 60%,#dd921f); box-shadow:inset 0 1px 0 rgba(255,255,255,.7); }
.wm-px{ flex:0 0 auto; font-family:'Baloo 2',cursive; font-weight:800; font-size:12.5px; color:#e8ddff; }
.wm-list{ padding:0 16px; display:flex; flex-direction:column; gap:9px; }
.wm-fiche{ position:relative; display:flex; align-items:center; gap:12px; width:100%; text-align:left; cursor:pointer;
  padding:13px 14px; border-radius:15px; background:#f6f4ff; border:1px solid #e6e2fb; border-top-color:#fff;
  box-shadow:0 3px 0 rgba(20,12,60,.32), inset 0 1px 0 #fff; -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.wm-fiche:active{ transform:scale(.99); }
.wm-fiche.done{ background:linear-gradient(180deg,#fff8ea,#fdefcc); border-color:rgba(240,169,63,.5); border-top-color:#fff3d4; }
.wm-fiche.next{ border-color:#c9bff5; box-shadow:0 3px 0 rgba(20,12,60,.32), inset 0 1px 0 #fff, 0 0 0 2px rgba(150,120,255,.36); }
.wm-nextflag{ position:absolute; top:-8px; left:42px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:9px; letter-spacing:.1em; text-transform:uppercase;
  color:#1a1240; background:linear-gradient(180deg,#e6d4ff,#b296ff); padding:2px 8px; border-radius:999px; box-shadow:0 2px 4px rgba(20,12,60,.3); }
.wm-chk{ flex:0 0 30px; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.wm-chk.empty{ border:2.5px dashed rgba(107,95,160,.5); background:rgba(90,79,192,.05); }
.wm-chk.filled{ background:radial-gradient(circle at 36% 28%,#ffe9b0,#f0a93f 58%,#b46a10); box-shadow:inset 0 -3px 4px rgba(120,60,0,.5), inset 0 2px 2px rgba(255,255,255,.7), 0 2px 5px rgba(20,12,60,.3); }
.wm-ft{ flex:1; min-width:0; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:14px; line-height:1.2; color:#241a45; letter-spacing:-.01em; }
.wm-fiche.done .wm-ft{ color:#5a4712; }
.wm-arw{ flex:0 0 auto; display:flex; }
@media (prefers-reduced-motion: reduce){ .wm *{ transition:none!important; } }
</style>`;

const HUB_STYLE = `<style>
.hub{ position:relative; max-width:480px; margin:0 auto; min-height:100dvh;
  font-family:'Inter',sans-serif; color:#ded7ff; overflow-x:hidden;
  padding:0 0 calc(96px + env(safe-area-inset-bottom));
  background:
    radial-gradient(120% 46% at 50% -8%, rgba(255,223,150,.18) 0%, rgba(255,223,150,0) 55%),
    radial-gradient(120% 52% at 84% 8%, rgba(150,120,235,.32) 0%, rgba(150,120,235,0) 60%),
    linear-gradient(#5a4fc0 0%, #4a3fa4 60%, #423a96 100%); }
.hub *{ box-sizing:border-box; }
.hub-gold{ background:linear-gradient(180deg,#fff2cf 0%,#ffe093 38%,#f4b24a 72%,#e0921f 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; }

.hub-hero{ display:flex; align-items:center; gap:10px; padding:16px 18px 6px; }
.hub-back{ flex:0 0 38px; width:38px; height:38px; border-radius:12px; cursor:pointer;
  background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14); display:flex; align-items:center; justify-content:center; }
.hub-back:active{ transform:scale(.95); }
.hub-back svg{ display:block; }
.hub-title{ flex:1; min-width:0; font-family:'Baloo 2',cursive; font-weight:800; font-size:22px; line-height:1; letter-spacing:-.01em;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; filter:drop-shadow(0 2px 0 rgba(90,52,6,.35)); }
.hub-gauge{ flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:6px 11px 6px 7px; border-radius:999px;
  background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.04)); border:1px solid rgba(255,223,150,.45);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.2); }
.hub-ring{ position:relative; width:24px; height:24px; flex:0 0 24px; border-radius:50%; box-shadow:inset 0 1px 1px rgba(255,255,255,.3); }
.hub-ring::after{ content:""; position:absolute; inset:4px; border-radius:50%; background:linear-gradient(180deg,#5346b6,#453b9c); }
.hub-gauge b{ position:relative; z-index:1; font-family:'Baloo 2',cursive; font-weight:800; font-size:15px; line-height:1; }
.hub-gauge small{ font-family:'Inter',sans-serif; font-weight:700; font-size:11px; color:#bcb0f0; }

.hub-kick{ padding:6px 20px 14px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#b6a8ec; }

.hub-worlds{ padding:0 16px; display:flex; flex-direction:column; gap:13px; }
.hub-world{ position:relative; display:flex; align-items:center; gap:13px; width:100%; text-align:left; cursor:pointer;
  padding:14px 16px; border-radius:20px; background:linear-gradient(180deg,#faf8ff 0%,#efeafc 100%);
  border:1px solid #e6e2fb; border-top-color:#fff; box-shadow:0 4px 0 rgba(20,12,60,.35), inset 0 1px 0 #fff;
  -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.hub-world:active{ transform:scale(.99); }
.hub-med{ position:relative; flex:0 0 58px; width:58px; height:58px; border-radius:50%;
  background:radial-gradient(circle at 38% 30%,#fff6df,#f6ead0 62%,#e6d6b4); border:1px solid #e6dcc4;
  box-shadow:inset 0 -3px 5px rgba(150,110,40,.22), inset 0 2px 2px rgba(255,255,255,.9), 0 3px 6px rgba(20,12,60,.14);
  display:flex; align-items:center; justify-content:center; }
.hub-med img{ width:46px; height:46px; object-fit:contain; display:block; filter:drop-shadow(0 2px 2px rgba(80,50,10,.28)); }
.hub-wbody{ flex:1; min-width:0; display:flex; flex-direction:column; }
.hub-wname{ font-family:'Baloo 2',cursive; font-weight:800; font-size:17px; line-height:1.05; color:#241a45; letter-spacing:-.01em; }
.hub-wsub{ font-family:'Inter',sans-serif; font-weight:600; font-size:11.5px; color:#7c71a6; margin:2px 0 9px; }
.hub-wprog{ display:flex; align-items:center; gap:9px; }
.hub-mbar{ position:relative; flex:1; height:9px; border-radius:999px; background:#e2ddf2; border:1px solid rgba(20,12,60,.06); box-shadow:inset 0 1px 2px rgba(20,12,60,.14); overflow:hidden; }
.hub-mf{ position:absolute; top:1px; bottom:1px; left:1px; border-radius:999px; background:linear-gradient(180deg,#ffe9b0,#f4b24a 60%,#dd921f); box-shadow:inset 0 1px 0 rgba(255,255,255,.75); }
.hub-wxn{ flex:0 0 auto; font-family:'Baloo 2',cursive; font-weight:800; font-size:13px; color:#8a7fb5; }
.hub-wxn b{ color:#e0921f; }
.hub-arw{ flex:0 0 auto; display:flex; align-items:center; }

.hub-world.active{ display:block; padding:16px 18px 18px;
  background:linear-gradient(180deg,#fff9ec 0%,#fdefcf 100%); border:1.5px solid #f4c463; border-top-color:#fff3d0;
  box-shadow:0 5px 0 rgba(150,100,20,.4), inset 0 1px 0 #fff, 0 0 0 4px rgba(255,223,150,.22); }
.hub-flag{ position:absolute; top:-10px; left:18px; display:inline-flex; align-items:center; gap:5px;
  font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:10px; letter-spacing:.1em; color:#5a3406; text-transform:uppercase;
  padding:3px 10px 3px 8px; border-radius:999px; background:linear-gradient(180deg,#ffe9b0,#f4b24a);
  box-shadow:0 3px 6px rgba(120,70,0,.3), inset 0 1px 0 rgba(255,255,255,.6); }
.hub-pulse{ width:7px; height:7px; border-radius:50%; background:#5a3406; box-shadow:0 0 0 3px rgba(90,52,6,.18); }
.hub-ahead{ display:flex; align-items:center; gap:14px; width:100%; text-align:left; cursor:pointer; background:none; border:0; padding:0;
  -webkit-tap-highlight-color:transparent; }
.hub-world.active .hub-med{ flex:0 0 66px; width:66px; height:66px; }
.hub-world.active .hub-med img{ width:54px; height:54px; }
.hub-world.active .hub-wname{ font-size:19px; }
.hub-world.active .hub-wsub{ margin:2px 0 10px; }
.hub-world.active .hub-wxn b{ color:#c9791a; }
.hub-resume{ display:flex; align-items:center; gap:12px; width:100%; margin-top:15px; padding:11px 14px; border:none; border-radius:16px; cursor:pointer; text-align:left;
  background:linear-gradient(180deg,#ffe9b0 0%,#f6c85f 38%,#f0a93f 72%,#e2951f 100%);
  box-shadow:0 5px 0 #b46a10, 0 10px 18px rgba(180,106,16,.32), inset 0 2px 0 rgba(255,255,255,.7); transition:transform .1s ease, box-shadow .1s ease; }
.hub-resume:active{ transform:translateY(3px); box-shadow:0 2px 0 #b46a10,0 5px 10px rgba(180,106,16,.28),inset 0 2px 0 rgba(255,255,255,.7); }
.hub-play{ flex:0 0 38px; width:38px; height:38px; border-radius:12px; background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,.15)); border:1px solid rgba(255,255,255,.5); display:flex; align-items:center; justify-content:center; box-shadow:inset 0 1px 0 rgba(255,255,255,.7); }
.hub-rtxt{ flex:1; min-width:0; display:flex; flex-direction:column; }
.hub-rlab{ font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#8a5410; }
.hub-rttl{ font-family:'Baloo 2',cursive; font-weight:800; font-size:15.5px; color:#5a3406; line-height:1.12; text-shadow:0 1px 0 rgba(255,255,255,.4);
  /* 2 lignes max au lieu d'une coupure « … » mi-mot sur le CTA principal */
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

.hub-extra{ display:flex; gap:10px; padding:20px 16px 0; }
.hub-chip{ flex:1; min-width:0; display:flex; align-items:center; gap:9px; cursor:pointer; padding:11px 12px; border-radius:14px;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); box-shadow:inset 0 1px 0 rgba(255,255,255,.1);
  -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.hub-chip:active{ transform:scale(.98); }
.hub-ci{ flex:0 0 30px; width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; background:rgba(255,223,150,.14); border:1px solid rgba(255,223,150,.3); }
.hub-ct{ min-width:0; display:flex; flex-direction:column; text-align:left; }
.hub-ct b{ font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:12.5px; color:#efe9ff; line-height:1.1; }
.hub-ct span{ font-family:'Inter',sans-serif; font-weight:600; font-size:10px; color:#a99ddb; }
@media (prefers-reduced-motion: reduce){ .hub *{ transition:none!important; } }
</style>`;

// ═══════════════════════════════════════════════════════════════
// Pont vers la certification (pivot 17/07 : l'élève certifie lui-même).
// Après un quiz « Teste-toi » RÉUSSI, on propose de certifier la compétence —
// mais le juge officiel reste le quiz de #/valider-seul (5 questions corrigées
// SERVEUR). On ne valide JAMAIS ici : les questions locales ne sont pas celles
// du serveur. DA nuit-indigo + or, cohérente avec l'écran de certification.
// ═══════════════════════════════════════════════════════════════
const PONT_STYLE = `<style>
.pont{ position:relative; min-height:calc(100dvh - 60px);
  padding:32px 22px calc(40px + env(safe-area-inset-bottom));
  color:#f2f0fa; font-family:'Inter',sans-serif; display:flex; flex-direction:column;
  align-items:center; justify-content:center; text-align:center;
  background:
    radial-gradient(120% 55% at 50% -5%, rgba(255,190,70,.12) 0%, transparent 55%),
    radial-gradient(120% 60% at 50% 22%, rgba(110,70,220,.24) 0%, transparent 62%),
    linear-gradient(180deg,#181241 0%,#0f0d24 58%,#0b0a1c 100%); }
.pont-med{ width:88px; height:88px; margin-bottom:16px; animation:pontPop .5s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes pontPop{ from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
.pont-kick{ display:inline-flex; align-items:center; gap:6px; font:800 11px/1 'Inter',sans-serif;
  letter-spacing:.12em; text-transform:uppercase; color:#ffd76e;
  background:rgba(255,210,74,.12); border:1px solid rgba(255,210,74,.3); padding:6px 14px; border-radius:99px; margin-bottom:14px; }
.pont-ttl{ font:800 24px/1.22 'Baloo 2',cursive; margin:0 0 10px;
  background:linear-gradient(180deg,#ffe9b0,#f5b73d); -webkit-background-clip:text; background-clip:text; color:transparent; }
.pont-p{ font:500 14px/1.55 'Inter',sans-serif; color:#cabfef; margin:0; max-width:340px; }
.pont-p b{ color:#e9e2ff; font-weight:700; }
.pont-cta{ width:100%; max-width:340px; margin-top:26px; min-height:54px; padding:16px; border:0; border-radius:14px; cursor:pointer;
  font:800 15px/1.2 'Plus Jakarta Sans',sans-serif; color:#4a2500;
  background:linear-gradient(180deg,#ffd76e,#f0a93f); box-shadow:0 6px 0 #b46a10, 0 12px 22px rgba(0,0,0,.4);
  display:flex; align-items:center; justify-content:center; gap:9px; }
.pont-cta:active{ transform:translateY(3px); box-shadow:0 3px 0 #b46a10, 0 7px 14px rgba(0,0,0,.4); }
.pont-ghost{ width:100%; max-width:340px; margin-top:11px; min-height:48px; padding:13px; border:1.5px solid rgba(255,255,255,.32);
  background:transparent; color:#fff; border-radius:14px; cursor:pointer; font:700 13.5px/1.2 'Plus Jakarta Sans',sans-serif; }
.pont-ghost:active{ transform:scale(.98); }
.pont-link{ margin-top:20px; min-height:44px; display:inline-flex; align-items:center; gap:7px; padding:6px 8px; background:none; border:0; cursor:pointer;
  font:700 14px/1.2 'Plus Jakarta Sans',sans-serif; color:#ffd76e; text-decoration:underline; text-underline-offset:3px; }
.pont-link:active{ opacity:.7; }
@media (prefers-reduced-motion: reduce){ .pont-med{ animation:none; } }
</style>`;

export async function mount(root, param) {
  track("page_view", { page: "revision-conduite" });

  // Garde-fou : si les données ne sont pas chargées (build/JSON), on n'explose pas.
  if (!FICHES.length) {
    root.innerHTML = `${STYLE}<div class="rvc"><div class="rvc-top">
      <button class="rvc-back" aria-label="Retour">←</button>
      <h1 class="rvc-h1">Révise ta conduite</h1></div>
      <p class="rvc-sub" style="margin-top:20px">Les fiches arrivent très vite. Reviens dans un instant.</p></div>`;
    root
      .querySelector(".rvc-back")
      ?.addEventListener("click", () => navigate("#/"));
    return;
  }

  // Fusionne les lectures déjà enregistrées en base (autres appareils) AVANT
  // toute lecture de `loadRead()` — corrige le « 0/31 » multi-appareils et la
  // résolution de « next ».
  await hydrateReadFromServer();

  // Deep-link : #/revision-conduite/{code} (ex. depuis « Ton centre ») ouvre
  // directement la fiche de la compétence.
  // Variantes : {code}:quiz lance le quiz de la fiche sans détour, et le
  // pseudo-code « next » se résout en première fiche non lue — c'est la cible
  // du CTA « Faire un quiz » de la quête du jour (accueil), pour que le mot
  // « quiz » mène à un quiz en un tap, sans embarquer les données de fiches
  // dans le chunk accueil.
  const [pCode, pAction] = String(param || "").split(":");
  let resolved = pCode;
  if (pCode === "next") {
    const read = loadRead();
    resolved = (FICHES.find((f) => !read[f.code]) || FICHES[0]).code;
  }
  const deep = resolved && getFiche(resolved) ? resolved : null;
  let view = deep ? (pAction === "quiz" ? "quiz" : "fiche") : "home";
  let code = deep;
  let focusId = null;
  let orderPlaced = [];
  let orderPool = [];
  let mondeN = null;
  let lastFicheTracked = null; // évite de re-tracker/markRead à chaque coche de geste

  // Ciblages du moniteur (couche 2). Requête gardée : si la table n'est pas
  // encore migrée / élève hors-ligne, on ignore silencieusement (pas de bannière).
  let focuses = [];
  try {
    const me = getCurUser();
    if (me) {
      const { data } = await sb
        .from("revision_focus")
        .select("id, competence_code, note, created_at")
        .is("done_at", null)
        .order("created_at", { ascending: false });
      focuses = data || [];
    }
  } catch {
    focuses = [];
  }

  async function markFocusDone(id) {
    try {
      await sb.rpc("mark_revision_focus_done", { p_id: id });
    } catch {
      /* non bloquant */
    }
  }

  function render() {
    if (view === "fiche") return renderFicheDeck();
    if (view === "quiz") return renderQuiz();
    if (view === "order") return renderOrder();
    if (view === "monde") return renderMonde();
    return renderHome();
  }

  // Liste des fiches d'UN monde — même DA indigo que le hub et la fiche Deck.
  // Chaque fiche = une carte tap-pour-ouvrir ; lue = coche or, prochaine à lire
  // = liseré violet + « à lire ». Retour → le hub des 4 mondes.
  function renderMonde() {
    const m = MONDES.find((x) => x.n === mondeN);
    if (!m) {
      view = "home";
      return render();
    }
    const read = loadRead();
    const fm = fichesByMonde(m.n);
    const done = fm.filter((f) => read[f.code]).length;
    const p = fm.length ? Math.round((done / fm.length) * 100) : 0;
    const badge = `/art/reviser/${BADGE_MONDE[m.n] || "cible"}.png`;
    const firstUnread = fm.findIndex((f) => !read[f.code]);

    const CHK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 6" stroke="#5a3406" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const chev = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#b8afd6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const back = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="#efe9ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const items = fm
      .map((f, i) => {
        const on = !!read[f.code];
        const next = i === firstUnread;
        return `<button class="wm-fiche${on ? " done" : ""}${next ? " next" : ""}" data-code="${escAttr(f.code)}">
          ${next ? `<span class="wm-nextflag">à lire</span>` : ""}
          <span class="wm-chk ${on ? "filled" : "empty"}">${on ? CHK : ""}</span>
          <span class="wm-ft">${esc(f.titre)}</span>
          <span class="wm-arw">${chev}</span>
        </button>`;
      })
      .join("");

    root.innerHTML = `${MONDE_STYLE}<div class="wm">
      <div class="wm-hero">
        <button class="wm-back" aria-label="Retour aux mondes">${back}</button>
        <span class="wm-med"><img src="${badge}" alt="" loading="lazy"></span>
        <div class="wm-htx">
          <h1 class="wm-name wm-gold">${esc(m.nom)}</h1>
          <div class="wm-sub">${esc(m.sous)}</div>
        </div>
      </div>
      <div class="wm-prog">
        <div class="wm-bar"><div class="wm-fill" style="width:${done ? Math.max(p, 5) : 0}%"></div></div>
        <span class="wm-px">${done}/${fm.length} lues</span>
      </div>
      <div class="wm-list">${items}</div>
    </div>`;

    root.querySelector(".wm-back").addEventListener("click", () => {
      view = "home";
      render();
    });
    root.querySelectorAll("[data-code]").forEach((b) =>
      b.addEventListener("click", () => {
        code = b.getAttribute("data-code");
        focusId = null;
        view = "fiche";
        render();
      }),
    );
  }

  // Hub « Carte des mondes » indigo (choix Rayan 2026-07-18) : les 4 mondes REMC
  // en cartes « sélection de niveau ». Le monde EN COURS est agrandi et porte
  // l'UNIQUE bouton or « Continuer » (fini le doublon hero + ligne 1). Défi/faute
  // en petites puces discrètes. CSS auto-contenu (.hub), cohérent avec la fiche Deck.
  function renderHome() {
    const read = loadRead();
    const revised = loadRevised();
    const totalF = FICHES.length;
    const lues = FICHES.filter((f) => read[f.code]).length;
    const pct = totalF ? Math.round((lues / totalF) * 100) : 0;
    const pf = pointFaible(revised);
    const nextF = FICHES.find((f) => !read[f.code]) || pf;
    const firstEver = lues === 0;
    const curMonde = nextF ? Number(nextF.monde) : null;

    const arw = (c) =>
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const worlds = MONDES.map((m) => {
      const fm = fichesByMonde(m.n);
      const done = fm.filter((f) => read[f.code]).length;
      const mpct = fm.length ? Math.round((done / fm.length) * 100) : 0;
      const badge = `/art/reviser/${BADGE_MONDE[m.n] || "cible"}.png`;
      const bar = `<span class="hub-mbar"><span class="hub-mf" style="width:${done ? Math.max(mpct, 5) : 0}%"></span></span>`;
      const xn = `<span class="hub-wxn">${done ? `<b>${done}</b>/` : "0/"}${fm.length}</span>`;

      if (curMonde === m.n && nextF) {
        // Monde en cours : agrandi, porte le bouton « Continuer ».
        return `<div class="hub-world active">
          <span class="hub-flag"><span class="hub-pulse"></span>${firstEver ? "À commencer" : "En cours"}</span>
          <button class="hub-ahead" data-monde="${m.n}" aria-label="Voir toutes les fiches — ${escAttr(m.nom)}">
            <span class="hub-med"><img src="${badge}" alt="" loading="lazy"></span>
            <span class="hub-wbody">
              <span class="hub-wname">${esc(m.nom)}</span>
              <span class="hub-wsub">${esc(m.sous)}</span>
              <span class="hub-wprog">${bar}${xn}</span>
            </span>
          </button>
          <button class="hub-resume" ${firstEver ? "data-first" : "data-next"} data-code="${escAttr(nextF.code)}">
            <span class="hub-play"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5-11-6.5z" fill="#5a3406"/></svg></span>
            <span class="hub-rtxt"><span class="hub-rlab">${firstEver ? "Commencer" : read[nextF.code] ? "Relire" : "Continuer"}</span><span class="hub-rttl">${esc(nextF.titre)}</span></span>
            <span class="hub-arw">${arw("#5a3406")}</span>
          </button>
        </div>`;
      }
      // Monde normal : la carte entière ouvre la liste de ses fiches.
      return `<button class="hub-world" data-monde="${m.n}">
        <span class="hub-med"><img src="${badge}" alt="" loading="lazy"></span>
        <span class="hub-wbody">
          <span class="hub-wname">${esc(m.nom)}</span>
          <span class="hub-wsub">${esc(m.sous)}</span>
          <span class="hub-wprog">${bar}${xn}</span>
        </span>
        <span class="hub-arw">${arw("#b8afd6")}</span>
      </button>`;
    }).join("");

    const lightning = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#f4b24a"/></svg>`;
    const loupe = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="#f4b24a" stroke-width="2.4"/><path d="M16 16l4.5 4.5" stroke="#f4b24a" stroke-width="2.6" stroke-linecap="round"/></svg>`;
    const back = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="#efe9ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    root.innerHTML = `${HUB_STYLE}<div class="hub">
      <div class="hub-hero">
        <button class="hub-back" aria-label="Retour à Réviser">${back}</button>
        <h1 class="hub-title hub-gold">Révise ta conduite</h1>
        <div class="hub-gauge">
          <span class="hub-ring" style="background:conic-gradient(#f4b24a 0 ${pct}%, rgba(20,12,60,.5) ${pct}% 100%)"></span>
          <span><b class="hub-gold">${lues}</b><small> / ${totalF}</small></span>
        </div>
      </div>
      <div class="hub-kick">Tes 4 mondes</div>
      <div class="hub-worlds">${worlds}</div>
      <div class="hub-extra">
        ${pf ? `<button class="hub-chip" data-pf="${escAttr(pf.code)}"><span class="hub-ci">${lightning}</span><span class="hub-ct"><b>Défi du jour</b><span>1 min</span></span></button>` : ""}
        <button class="hub-chip" data-faute><span class="hub-ci">${loupe}</span><span class="hub-ct"><b>Trouve la faute</b><span>Repère l’erreur</span></span></button>
      </div>
    </div>`;
    wireHome();
  }

  function wireHome() {
    root
      .querySelector(".hub-back")
      ?.addEventListener("click", () => navigate("#/reviser"));
    root.querySelector("[data-pf]")?.addEventListener("click", (e) => {
      code = e.currentTarget.getAttribute("data-pf");
      focusId = null;
      track("revision_conduite_pf_start", { code });
      startQuiz();
    });
    root.querySelector("[data-faute]")?.addEventListener("click", () => {
      track("revision_conduite_faute_open");
      navigate("#/jeu-faute");
    });
    const openFiche = (e) => {
      code = e.currentTarget.getAttribute("data-code");
      focusId = null;
      view = "fiche";
      render();
    };
    root.querySelector("[data-next]")?.addEventListener("click", openFiche);
    root.querySelector("[data-first]")?.addEventListener("click", (e) => {
      track("revision_conduite_first_fiche", {
        code: e.currentTarget.getAttribute("data-code"),
      });
      openFiche(e);
    });
    root.querySelectorAll("[data-monde]").forEach((b) =>
      b.addEventListener("click", () => {
        mondeN = Number(b.getAttribute("data-monde"));
        view = "monde";
        render();
      }),
    );
  }

  // Fiche « Deck » indigo (choix Rayan 2026-07-17) : la méthode = un deck de
  // gestes à cocher (médailles or), les « à retenir » en cartes coach discrètes,
  // une seule action or « Teste-toi ». S'applique à TOUTES les fiches (les longues
  // gardent leurs sections via des sous-titres). Cocher un geste est purement
  // local (localStorage rvc_gestes) ; « lue » (progression du hub) = fiche ouverte.
  function renderFicheDeck() {
    const f = getFiche(code);
    if (!f) {
      view = "home";
      return render();
    }

    // ── Mode découverte : 1 fiche lisible par jour ─────────────────────────
    // Ré-ouvrir la MÊME fiche reste permis (relecture) ; une AUTRE fiche après
    // la fiche du jour → mur découverte. Les re-render de coche de geste
    // repassent par ici : consumeFree est idempotent sur le même code.
    const meFt = getCurUser();
    if (isFreeTierUser(meFt)) {
      resetIfNewDay();
      if (!freeQuota("fiche", f.code).allowed) {
        track("freetier.quota_hit", { kind: "fiche", code: f.code });
        return mountFreeTierWall(root, {
          me: meFt,
          reason: "quota",
          kind: "fiche",
        });
      }
      consumeFree("fiche", f.code);
    }

    // Ouvrir = « lue » (progression du hub), tracké UNE fois — pas à chaque coche
    // de geste, qui re-render la fiche.
    if (lastFicheTracked !== f.code) {
      markRead(f.code);
      track("revision_conduite_fiche_open", { code: f.code });
      track("revision_conduite_fiche_read", { code: f.code });
      lastFicheTracked = f.code;
    }

    // ── i18n : traduction affichée, français gardé dessous (arabe RTL par span) ──
    const lang = getLang();
    const rtl = lang === "ar";
    const tr = ficheTr(f.code, lang); // {titre,competence,methode,pourquoi,erreur,bva,quiz} | null
    const bi = (fr, t) =>
      lang === "fr" || t == null || t === ""
        ? esc(fr)
        : `<span class="fd-tr"${rtl ? ' dir="rtl" lang="ar"' : ""}>${esc(t)}</span>` +
          `<span class="fd-fr" lang="fr" dir="ltr">${esc(fr)}</span>`;
    const ui = (key, frTxt) => uiFiche(lang, key, frTxt);

    const steps = Array.isArray(f.methode) ? f.methode : [];
    const total = steps.length;
    const groups = groupSteps(steps);
    const grouped = useGrouped(steps, groups);
    // Texte « propre » (préfixe de section retiré) pour le jeu « remets dans l'ordre ».
    const flatSteps = grouped ? groups.flatMap((g) => g.steps) : steps;
    // Gestes traduits, parallèles au FR. En mode groupé on n'utilise la
    // traduction que si le découpage en sections est identique (sinon repli FR) ;
    // en mode plat on mappe geste à geste par index.
    const stepsTR =
      tr && tr.methode && tr.methode.length === steps.length
        ? tr.methode
        : null;
    let groupsTR = null;
    if (grouped && stepsTR) {
      const g2 = groupSteps(stepsTR);
      const aligned =
        g2.length === groups.length &&
        groups.every((g, i) => g2[i] && g.steps.length === g2[i].steps.length);
      if (aligned) groupsTR = g2;
    }

    const doneSet = new Set(
      (loadGestes()[f.code] || []).filter((i) => i < total),
    );
    const count = doneSet.size;
    let firstUnchecked = -1;
    for (let i = 0; i < total; i++) {
      if (!doneSet.has(i)) {
        firstUnchecked = i;
        break;
      }
    }
    const pct = total ? Math.round((count / total) * 100) : 0;

    const CHK = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 6" stroke="#5a3406" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const card = (s, i, sTr) => {
      const done = doneSet.has(i);
      const next = i === firstUnchecked;
      return `<button class="fd-card${done ? " done" : ""}${next ? " next" : ""}" data-geste="${i}" aria-pressed="${done}">
        ${next ? `<span class="fd-next-flag">${esc(ui("next", "à toi"))}</span>` : ""}
        <span class="fd-chk ${done ? "filled" : "empty"}">${done ? CHK : ""}</span>
        <span class="fd-num">${i + 1}</span>
        <span class="fd-txt">${bi(s, sTr)}</span>
      </button>`;
    };

    // Le sous-titre de section fait office d'en-tête « La méthode » (pas de
    // double titre) : chaque groupe a le sien, le 1er sans libellé retombe dessus.
    // En en/ar : libellé traduit seul (chrome), français en repli.
    const seclab = (fr, trLab) =>
      `<div class="fd-seclab"><h2${rtl && trLab ? ' dir="rtl" lang="ar"' : ""}>${esc(lang !== "fr" && trLab ? trLab : fr)}</h2><div class="line"></div></div>`;
    const methLab = lang !== "fr" ? ui("methode", "La méthode") : null;
    let deckHtml = "";
    if (grouped) {
      let idx = 0;
      deckHtml = groups
        .map((g, gi) => {
          const gTR = groupsTR ? groupsTR[gi] : null;
          const cards = g.steps
            .map((s, j) => card(s, idx++, gTR ? gTR.steps[j] : null))
            .join("");
          const lab = g.label || "La méthode";
          const labTR = g.label ? (gTR ? gTR.label : null) : methLab;
          return `${seclab(lab, labTR)}<div class="fd-deck">${cards}</div>`;
        })
        .join("");
    } else {
      deckHtml = `${seclab("La méthode", methLab)}<div class="fd-deck">${steps
        .map((s, i) => card(s, i, stepsTR ? stepsTR[i] : null))
        .join("")}</div>`;
    }

    // Cartes coach : uniquement celles présentes dans la fiche (repli gracieux).
    const ERR_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l9.5 16.5H2.5L12 3z" fill="#ef6a3a"/><path d="M12 10v4.5" stroke="#fff0e8" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.2" fill="#fff0e8"/></svg>`;
    const WHY_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M9.5 21h5" stroke="#7c5fe0" stroke-width="1.8" stroke-linecap="round"/><path d="M12 3a6 6 0 0 1 3.6 10.8c-.7.5-1.1 1.2-1.1 2H9.5c0-.8-.4-1.5-1.1-2A6 6 0 0 1 12 3z" fill="#7c5fe0"/></svg>`;
    const AUTO_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7h9a2 2 0 0 1 1.9 1.6L20 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z" fill="#3f82d6"/><circle cx="7.2" cy="15.4" r="1.1" fill="#eaf3ff"/><circle cx="16.8" cy="15.4" r="1.1" fill="#eaf3ff"/></svg>`;
    // Loupe discrète (affordance) : la carte se tape pour lire en grand.
    const ZOOM_IC = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5" stroke="#8579b8" stroke-width="2"/><path d="M15.5 15.5L21 21" stroke="#8579b8" stroke-width="2" stroke-linecap="round"/><path d="M10.5 8v5M8 10.5h5" stroke="#8579b8" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    const coach = [];
    if (f.erreur)
      coach.push({
        k: "err",
        h: ui("err_h", "L’erreur à éviter"),
        fr: f.erreur,
        tr: tr?.erreur,
        ic: ERR_IC,
      });
    if (f.pourquoi)
      coach.push({
        k: "why",
        h: ui("why_h", "Pourquoi ça compte"),
        fr: f.pourquoi,
        tr: tr?.pourquoi,
        ic: WHY_IC,
      });
    if (f.bva)
      coach.push({
        k: "auto",
        h: ui("bva_h", "En boîte auto"),
        fr: f.bva,
        tr: tr?.bva,
        ic: AUTO_IC,
      });
    // Carte = <button> tapable (≥ 44px) → bottom-sheet « lecture en grand »
    // (demande Rayan 22/07 : « c'est tout petit »). Spans block, pas de h4/p
    // dans un <button> (contenu phrasé uniquement).
    const coachHtml = coach.length
      ? `<div class="fd-coach-wrap">
          ${seclab("Cartes coach", lang !== "fr" ? ui("coach", "Cartes coach") : null)}
          <div class="fd-coach" style="grid-template-columns:repeat(${coach.length},1fr)">
            ${coach
              .map(
                (c, i) =>
                  `<button type="button" class="fd-cc ${c.k}" data-coach="${i}" aria-haspopup="dialog"><span class="fd-cc-zoom" aria-hidden="true">${ZOOM_IC}</span><span class="fd-ic">${c.ic}</span><span class="fd-cc-h">${esc(c.h)}</span><span class="fd-cc-p">${bi(c.fr, c.tr)}</span></button>`,
              )
              .join("")}
          </div>
        </div>`
      : "";

    const srcChaines = sourceChannels(f);
    const srcHtml = srcChaines.length
      ? `<div class="fd-source">${esc(ui("source", "Vu chez de vrais moniteurs :"))} <b>${srcChaines.map((s) => esc(s)).join(", ")}</b></div>`
      : "";

    // Intro narrative personnalisée (ton voulu par Rayan : « Aujourd'hui
    // {prenom}, tu attaques le giratoire… »). Composée par template stable
    // (hash du code), esc() appliqué via bi(). Bilingue comme le reste de la
    // page : traduction affichée + français gardé dessous.
    const prenom = String(getCurUser()?.prenom || "").trim();
    const tplIdx = hashStr(f.code) % INTRO_TPL.fr.length;
    const introFr = introText("fr", tplIdx, prenom, f.titre, f.pourquoi);
    const introTr =
      lang !== "fr" && tr
        ? introText(
            lang,
            tplIdx,
            prenom,
            tr.titre || f.titre,
            tr.pourquoi || f.pourquoi,
          )
        : null;
    const SPARK_IC = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4L12 2z" fill="#ffd76e"/></svg>`;
    const introHtml = `<div class="fd-intro"><span class="fd-intro-ic" aria-hidden="true">${SPARK_IC}</span><p>${bi(introFr, introTr)}</p></div>`;

    const BACK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="#3d2f7a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const SHUF = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h11M4 12h11M4 17h7" stroke="#3d2f7a" stroke-width="2" stroke-linecap="round"/><path d="M18 8l3 3-3 3" stroke="#3d2f7a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const competenceTxt =
      lang !== "fr" && tr?.competence ? tr.competence : f.competence;

    // ── Galerie « En images » : schémas de trajectoire + photos de gestes.
    // Images sans texte (public/art/fiches/*.webp) ; légendes traduites ici.
    const shots = ficheSchemas(f.code);
    const legOf = (s) => esc(s[lang] || s.fr);
    const schemasHtml = shots.length
      ? `<div class="fd-schemas">
          ${seclab(
            "En images",
            lang === "en" ? "In pictures" : lang === "ar" ? "بالصور" : null,
          )}
          <div class="fd-gal">
            ${shots
              .map(
                (s) => `<figure class="fd-shot">
              <img src="/art/fiches/${escAttr(s.src)}.webp" alt="" loading="lazy" decoding="async">
              <figcaption${rtl && s[lang] ? ' dir="rtl" lang="ar"' : ""}>${legOf(s)}</figcaption>
            </figure>`,
              )
              .join("")}
          </div>
        </div>`
      : "";

    root.innerHTML = `${FD_STYLE}<div class="fd">
      <div class="fd-hero">
        <div class="fd-topbar">
          <button class="fd-back" aria-label="${escAttr(ui("back", "Retour"))}">${BACK}</button>
          <span class="fd-tag"><span class="fd-dot"></span><b>${esc(f.code)} · ${esc(competenceTxt)} · ${esc(ui("monde", "Monde"))} ${esc(String(f.monde))}</b></span>
        </div>
        <h1 class="fd-title fd-gold">${bi(f.titre, tr?.titre)}</h1>
        <div class="fd-sub">${esc(ui("sub", "Coche tes gestes, puis débloque le test."))}</div>
        <div class="fd-xp">
          <div class="fd-xp-top"><span class="lab">${esc(ui("deck", "Ton deck"))}</span><span class="cnt fd-gold">${count}<small> / ${total} ${esc(ui(total > 1 ? "gestes" : "geste", total > 1 ? "gestes" : "geste"))}</small></span></div>
          <div class="fd-bar"><div class="fill" style="width:${count ? Math.max(pct, 4) : 0}%"></div></div>
        </div>
      </div>

      ${introHtml}
      ${schemasHtml}

      ${deckHtml}

      ${coachHtml}
      ${srcHtml}

      <div class="fd-actions">
        <button class="fd-cta" data-quiz><span>${esc(ui("cta", "Teste-toi"))}</span></button>
        ${total >= 3 ? `<button class="fd-secondary" data-order>${SHUF}<span>${esc(ui("order", "Remets dans l’ordre"))}</span></button>` : ""}
      </div>
    </div>`;

    wireFicheDeck(f, flatSteps, coach, rtl);
  }

  function wireFicheDeck(f, flatSteps, coach = [], rtl = false) {
    root.querySelector(".fd-back")?.addEventListener("click", () => {
      view = "home";
      render();
    });
    // Cocher / décocher un geste : local, re-render en place (scroll conservé).
    root.querySelectorAll("[data-geste]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-geste"));
        const set = new Set(loadGestes()[f.code] || []);
        const wasDone = set.has(i);
        if (wasDone) set.delete(i);
        else set.add(i);
        saveGestes(
          f.code,
          [...set].sort((a, b) => a - b),
        );
        haptic(wasDone ? "select" : "success");
        const y = window.scrollY;
        renderFicheDeck();
        window.scrollTo(0, y);
      }),
    );
    // Carte coach → bottom-sheet « lecture en grand » (demande Rayan 22/07).
    root.querySelectorAll("[data-coach]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const c = coach[Number(btn.getAttribute("data-coach"))];
        if (!c) return;
        haptic("select");
        openCoachSheet({
          title: c.h,
          fr: c.fr,
          tr: c.tr || null,
          rtl,
          icon: c.ic,
        });
      }),
    );
    root.querySelector("[data-quiz]")?.addEventListener("click", () => {
      focusId = null;
      startQuiz();
    });
    root.querySelector("[data-order]")?.addEventListener("click", () => {
      orderPlaced = [];
      const flat = flatSteps && flatSteps.length ? flatSteps : f.methode || [];
      orderPool = flat
        .map((t, i) => ({ i, t }))
        .sort(() => Math.random() - 0.5);
      view = "order";
      render();
    });
  }

  function renderOrder() {
    const f = getFiche(code);
    const steps = (f && f.methode) || [];
    if (!f || steps.length < 2) {
      view = "fiche";
      return render();
    }
    if (orderPlaced.length === steps.length) {
      markRevised(code);
      haptic("success");
      root.innerHTML = `${STYLE}<div class="rvc"><div class="rvc-done">
        <div class="rvc-done-e">${medallion("check", "green", { size: 64 })}</div>
        <div class="rvc-done-t">Dans l’ordre, nickel !</div>
        <p class="rvc-sub">Les ${steps.length} étapes de « ${esc(f.titre)} » : pliées.</p>
        <button class="rvc-go" data-next>Continuer</button>
      </div></div>`;
      root.querySelector("[data-next]").addEventListener("click", () => {
        view = "fiche";
        render();
      });
      return;
    }
    const placed = orderPlaced
      .map(
        (p, idx) =>
          `<div class="rvc-oslot"><span class="rvc-onum">${idx + 1}</span><span>${esc(p.t)}</span></div>`,
      )
      .join("");
    const pool = orderPool
      .map(
        (p) =>
          `<button class="rvc-ochip" data-oi="${p.i}">${esc(p.t)}</button>`,
      )
      .join("");
    root.innerHTML = `${STYLE}<div class="rvc">
      <div class="rvc-top">
        <button class="rvc-back" aria-label="Retour à la fiche">←</button>
        <h1 class="rvc-h1" style="font-size:17px">${esc(f.titre)}</h1>
      </div>
      <div class="rvc-prog">${orderPlaced.length + 1} / ${steps.length}</div>
      <p class="rvc-ohint">Dans le bon ordre. À toi.</p>
      ${placed}
      <div class="rvc-opool">${pool}</div>
    </div>`;
    root.querySelector(".rvc-back").addEventListener("click", () => {
      view = "fiche";
      render();
    });
    root.querySelectorAll(".rvc-ochip").forEach((b) =>
      b.addEventListener("click", (e) => {
        const i = Number(b.getAttribute("data-oi"));
        if (i === orderPlaced.length) {
          orderPlaced.push(orderPool.find((x) => x.i === i));
          orderPool = orderPool.filter((x) => x.i !== i);
          haptic("select");
          render();
        } else {
          haptic("warning");
          const el = e.currentTarget;
          el.classList.add("rvc-shake");
          setTimeout(() => el.classList.remove("rvc-shake"), 350);
        }
      }),
    );
  }

  function startQuiz() {
    // Si cette compétence est un ciblage moniteur non fait (arrivée par le hero
    // « Réviser » en deep-link, ou par navigation normale), on la marquera faite
    // à la fin du quiz — même sans être passé par une liste de devoirs.
    if (!focusId) {
      const fx = focuses.find((x) => x.competence_code === code);
      if (fx) focusId = fx.id;
    }
    view = "quiz";
    render();
  }

  function renderQuiz() {
    const f = getFiche(code);
    const lang = getLang();
    const trF = ficheTr(code, lang); // { titre, quiz:[{q,options,explication}], … } | null
    // Chaque question reçoit sa traduction (premium-quiz affiche la trad + le FR
    // dessous ; sans `tr`, rendu FR d'origine). Ordre garanti = même que la source.
    let questions = quizByCode(code).map((q, i) =>
      trF && trF.quiz && trF.quiz[i] ? { ...q, tr: trF.quiz[i] } : q,
    );
    if (!questions.length) {
      view = "fiche";
      return render();
    }

    // ── Mode découverte : « Teste-toi » consomme aussi le quota de questions ──
    // (même compteur que #/quiz — 3 questions/jour). Épuisé → mur découverte ;
    // sinon on plafonne le nombre de questions au reste du quota.
    const meFt = getCurUser();
    if (isFreeTierUser(meFt)) {
      resetIfNewDay();
      const q = freeQuota("quiz");
      if (q.remaining <= 0) {
        track("freetier.quota_hit", { kind: "quiz" });
        return mountFreeTierWall(root, {
          me: meFt,
          reason: "quota",
          kind: "quiz",
        });
      }
      questions = questions.slice(0, Math.min(questions.length, q.remaining));
      consumeFree("quiz", null, questions.length);
    }

    track("revision_conduite_quiz_start", { code });
    mountPremiumQuiz(root, {
      questions,
      questHint: true, // ce quiz alimente la quête du jour (réussi = ≥70 %)
      title: (trF && trF.titre) || (f ? f.titre : "Quiz"),
      onExit: (good, total) => {
        markRevised(code);
        track("revision_conduite_quiz_done", { code, good, total });
        // Alimente la ligue Révision : +1 pt si ≥70% sur cette compétence.
        // Insertion directe (RLS : l'élève écrit les siens), type 'review' →
        // compté par get_theory_leaderboard (DISTINCT competence_id, score≥70).
        // On n'appelle PAS submit_competence_quiz ni self_validate_competence
        // ici : ces questions sont LOCALES, le juge officiel reste le quiz de
        // #/valider-seul (5 questions corrigées serveur). Ce quiz « Teste-toi »
        // ne fait qu'alimenter quête + ligue, puis PROPOSE la certification.
        const me = getCurUser();
        if (me?.id && total > 0) {
          // Cette ligne alimente la quête du jour (trigger advance_quest_quiz)
          // ET la ligue Révision : si l'insert rate en silence, l'élève « joue
          // pour rien ». On retente donc une fois avant d'abandonner.
          const attemptRow = {
            user_id: me.id,
            competence_id: code,
            type: "review",
            score: Math.round((good / total) * 100),
            questions_ids: [],
            answers_indices: [],
          };
          (async () => {
            for (let tryN = 0; tryN < 2; tryN++) {
              try {
                const { error } = await sb
                  .from("quiz_attempts")
                  .insert(attemptRow);
                if (!error) return;
                console.error("[revision-conduite] persist review", error);
              } catch (e) {
                console.error("[revision-conduite] persist review", e);
              }
              await new Promise((r) => setTimeout(r, 1500));
            }
          })();
        }
        if (focusId) {
          const fid = focusId;
          focusId = null;
          focuses = focuses.filter((x) => x.id !== fid);
          markFocusDone(fid);
        }
        // Pont vers la certification : quiz RÉUSSI (même seuil que le composant,
        // ≥70 %) → on propose de certifier la compétence dans Mon permis. Sinon,
        // retour au hub comme avant. Le pont récupère lui-même l'état (déjà
        // certifiée / validée moniteur) pour adapter son CTA.
        const passed = total > 0 && good >= Math.ceil(total * 0.7);
        if (passed) {
          showCertBridge(code, good, total);
          return;
        }
        view = "home";
        render();
      },
    });
  }

  // ── Pont Réviser → certification (pivot 17/07) ──────────────────────────
  // Récupère l'état de certification de la compétence puis affiche l'écran de
  // fin adapté. On NE valide RIEN ici : le bouton mène au quiz officiel de
  // #/valider-seul (juge serveur). Best-effort : si l'état est indéterminé, on
  // propose quand même la certification (le garde-fou serveur tranchera).
  async function certState(compId) {
    const me = getCurUser();
    if (!me?.id) return { moniteur: false, certified: false };
    try {
      const [vRes, sRes] = await Promise.allSettled([
        sb
          .from("validations")
          .select("statut")
          .eq("eleve_id", me.id)
          .eq("competence_id", compId)
          .maybeSingle(),
        sb
          .from("self_validations")
          .select("validated_at")
          .eq("eleve_id", me.id)
          .eq("competence_id", compId)
          .maybeSingle(),
      ]);
      return {
        moniteur:
          vRes.status === "fulfilled" && vRes.value.data?.statut === "acquis",
        certified: sRes.status === "fulfilled" && !!sRes.value.data,
      };
    } catch {
      return { moniteur: false, certified: false };
    }
  }

  async function showCertBridge(compId, good, total) {
    const { moniteur, certified } = await certState(compId);
    const f = getFiche(compId);
    const titre = f ? f.titre : "cette compétence";
    const done = moniteur || certified;
    track("revision_conduite_cert_bridge", { code: compId, done });

    const BOUCLIER = medallion("bouclier", "violet", { size: 88 });
    const CHECK = medallion("check", "violet", { size: 88 });

    if (done) {
      // Déjà certifiée par toi (ou validée par ton moniteur) : pas de nouvelle
      // certification à faire — juste un petit lien pour la revoir dans Mon permis.
      root.innerHTML = `${PONT_STYLE}<div class="pont anim-slide-up">
        <div class="pont-med">${CHECK}</div>
        <span class="pont-kick">Déjà dans Mon permis</span>
        <h1 class="pont-ttl">Déjà certifiée par toi</h1>
        <p class="pont-p">« <b>${esc(titre)}</b> » est déjà acquise dans ton parcours. Beau boulot — continue à réviser quand tu veux.</p>
        <button class="pont-cta" data-continue type="button">Continuer à réviser</button>
        <button class="pont-link" data-revoir type="button">Revoir dans Mon permis →</button>
      </div>`;
    } else {
      // Non certifiée : on propose de la certifier via le quiz officiel.
      root.innerHTML = `${PONT_STYLE}<div class="pont anim-slide-up">
        <div class="pont-med">${BOUCLIER}</div>
        <span class="pont-kick">Quiz réussi</span>
        <h1 class="pont-ttl">Prêt·e à certifier cette compétence ?</h1>
        <p class="pont-p">Tu viens de réviser « <b>${esc(titre)}</b> ». Certifie-la pour la faire avancer dans <b>Mon permis</b> — un quiz officiel de 5 questions confirme que c'est acquis.</p>
        <button class="pont-cta" data-certify type="button">Certifier cette compétence</button>
        <button class="pont-ghost" data-continue type="button">Plus tard</button>
      </div>`;
    }

    root.querySelector("[data-certify]")?.addEventListener("click", () => {
      haptic("tap");
      track("revision_conduite_cert_bridge_go", { code: compId });
      navigate(`#/valider-seul/${compId}`);
    });
    root.querySelector("[data-revoir]")?.addEventListener("click", () => {
      haptic("tap");
      navigate(`#/parcours?focus=${encodeURIComponent(compId)}`);
    });
    root.querySelector("[data-continue]")?.addEventListener("click", () => {
      haptic("select");
      view = "home";
      render();
    });
  }

  render();
}
