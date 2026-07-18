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
import {
  FICHES,
  MONDES,
  getFiche,
  fichesByMonde,
} from "@/data/fiches-conduite.js";
import { getLang } from "@/utils/lang.js";
import {
  FICHES_I18N,
  FICHE_QUIZ_I18N,
  MONDES_I18N,
  RVC_UI,
} from "@/data/fiches-i18n.js";

const LS_KEY = "rvc_revised_v1"; // { [code]: isoDate }
const LS_READ_KEY = "rvc_read_v1"; // { [code]: 1 } — fiche déjà déroulée (relecture = tout affiché)

function loadRead() {
  try {
    return JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    return {};
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
.rvc-onum { width:22px; height:22px; border-radius:50%; background:#10b981; color:#fff; font:700 12px 'IBM Plex Mono',monospace; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
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

.fd-coach-wrap{ margin-top:6px; }
.fd-coach{ display:grid; gap:9px; padding:0 18px; align-items:stretch; }
.fd-cc{ border-radius:14px; padding:11px 10px 12px; background:#f6f4ff; border:1px solid #e6e2fb; border-top-color:#fff;
  box-shadow:0 3px 0 rgba(20,12,60,.28), inset 0 1px 0 rgba(255,255,255,.8); display:flex; flex-direction:column; gap:7px; }
.fd-ic{ width:34px; height:34px; border-radius:11px; flex:none; display:flex; align-items:center; justify-content:center;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.7), 0 2px 4px rgba(20,12,60,.2); }
.fd-cc.err .fd-ic{ background:linear-gradient(180deg,#ffe3d6,#ffd0bd); border:1px solid rgba(230,90,50,.4); }
.fd-cc.why .fd-ic{ background:linear-gradient(180deg,#ece5ff,#ddd2ff); border:1px solid rgba(124,95,224,.4); }
.fd-cc.auto .fd-ic{ background:linear-gradient(180deg,#dcebff,#c6ddff); border:1px solid rgba(63,130,214,.4); }
.fd-cc h4{ font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:11px; letter-spacing:.02em; line-height:1.15; margin:0; }
.fd-cc.err h4{ color:#c2410c; }
.fd-cc.why h4{ color:#5b3fbf; }
.fd-cc.auto h4{ color:#1e5fa8; }
.fd-cc p{ font-size:10.5px; line-height:1.4; color:#6b5fa0; font-weight:500; margin:0; }

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
/* i18n : traduction affichée + français gardé dessous (arabe RTL par span) */
.fd-tr{ display:block; }
.fd-fr{ display:block; margin-top:4px; font-size:.92em; font-weight:500; opacity:.62; }
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
.hub-rttl{ font-family:'Baloo 2',cursive; font-weight:800; font-size:15.5px; color:#5a3406; line-height:1.05; text-shadow:0 1px 0 rgba(255,255,255,.4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

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

export async function mount(root, param) {
  track("page_view", { page: "revision-conduite" });

  // ── i18n : traduction affichée + français gardé dessous (arabe RTL par span).
  // En 'fr' (ou sans traduction dispo), le rendu d'origine est STRICTEMENT inchangé.
  // bi() = bloc bilingue (contenu pédago : gestes + cartes coach + quiz) ;
  // T()/U() = libellé unique traduit (titres, boutons, noms de mondes).
  const lang = getLang();
  const rtl = lang === "ar";
  const fTr = (c) => (lang !== "fr" ? FICHES_I18N[lang]?.[c] : null);
  const mTr = (n) => (lang !== "fr" ? MONDES_I18N[lang]?.[n] : null);
  const T = (fr, tr) => (lang !== "fr" && tr ? tr : fr);
  const U = (key, fr) => T(fr, RVC_UI[lang]?.[key]);
  const bi = (fr, tr) =>
    lang === "fr" || !tr
      ? esc(fr)
      : `<span class="fd-tr"${rtl ? ' dir="rtl" lang="ar"' : ""}>${esc(tr)}</span><span class="fd-fr" lang="fr">${esc(fr)}</span>`;

  // Garde-fou : si les données ne sont pas chargées (build/JSON), on n'explose pas.
  if (!FICHES.length) {
    root.innerHTML = `${STYLE}<div class="rvc"><div class="rvc-top">
      <button class="rvc-back" aria-label="Retour">←</button>
      <h1 class="rvc-h1">${esc(U("home_title", "Révise ta conduite"))}</h1></div>
      <p class="rvc-sub" style="margin-top:20px">${esc(U("fallback_sub", "Les fiches arrivent très vite. Reviens dans un instant."))}</p></div>`;
    root
      .querySelector(".rvc-back")
      ?.addEventListener("click", () => navigate("#/"));
    return;
  }

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
          ${next ? `<span class="wm-nextflag">${esc(U("read_flag", "à lire"))}</span>` : ""}
          <span class="wm-chk ${on ? "filled" : "empty"}">${on ? CHK : ""}</span>
          <span class="wm-ft">${esc(T(f.titre, fTr(f.code)?.titre))}</span>
          <span class="wm-arw">${chev}</span>
        </button>`;
      })
      .join("");

    root.innerHTML = `${MONDE_STYLE}<div class="wm">
      <div class="wm-hero">
        <button class="wm-back" aria-label="Retour aux mondes">${back}</button>
        <span class="wm-med"><img src="${badge}" alt="" loading="lazy"></span>
        <div class="wm-htx">
          <h1 class="wm-name wm-gold">${esc(T(m.nom, mTr(m.n)?.nom))}</h1>
          <div class="wm-sub">${esc(T(m.sous, mTr(m.n)?.sous))}</div>
        </div>
      </div>
      <div class="wm-prog">
        <div class="wm-bar"><div class="wm-fill" style="width:${done ? Math.max(p, 5) : 0}%"></div></div>
        <span class="wm-px">${done}/${fm.length} ${esc(U("read_suffix", "lues"))}</span>
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
      const nom = T(m.nom, mTr(m.n)?.nom);
      const sous = T(m.sous, mTr(m.n)?.sous);

      if (curMonde === m.n && nextF) {
        // Monde en cours : agrandi, porte le bouton « Continuer ».
        return `<div class="hub-world active">
          <span class="hub-flag"><span class="hub-pulse"></span>${esc(firstEver ? U("flag_start", "À commencer") : U("flag_current", "En cours"))}</span>
          <button class="hub-ahead" data-monde="${m.n}" aria-label="${escAttr(nom)}">
            <span class="hub-med"><img src="${badge}" alt="" loading="lazy"></span>
            <span class="hub-wbody">
              <span class="hub-wname">${esc(nom)}</span>
              <span class="hub-wsub">${esc(sous)}</span>
              <span class="hub-wprog">${bar}${xn}</span>
            </span>
          </button>
          <button class="hub-resume" ${firstEver ? "data-first" : "data-next"} data-code="${escAttr(nextF.code)}">
            <span class="hub-play"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5-11-6.5z" fill="#5a3406"/></svg></span>
            <span class="hub-rtxt"><span class="hub-rlab">${esc(firstEver ? U("resume_start", "Commencer") : read[nextF.code] ? U("resume_reread", "Relire") : U("resume_continue", "Continuer"))}</span><span class="hub-rttl">${esc(T(nextF.titre, fTr(nextF.code)?.titre))}</span></span>
            <span class="hub-arw">${arw("#5a3406")}</span>
          </button>
        </div>`;
      }
      // Monde normal : la carte entière ouvre la liste de ses fiches.
      return `<button class="hub-world" data-monde="${m.n}">
        <span class="hub-med"><img src="${badge}" alt="" loading="lazy"></span>
        <span class="hub-wbody">
          <span class="hub-wname">${esc(nom)}</span>
          <span class="hub-wsub">${esc(sous)}</span>
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
        <h1 class="hub-title hub-gold">${esc(U("home_title", "Révise ta conduite"))}</h1>
        <div class="hub-gauge">
          <span class="hub-ring" style="background:conic-gradient(#f4b24a 0 ${pct}%, rgba(20,12,60,.5) ${pct}% 100%)"></span>
          <span><b class="hub-gold">${lues}</b><small> / ${totalF}</small></span>
        </div>
      </div>
      <div class="hub-kick">${esc(U("worlds_kicker", "Tes 4 mondes"))}</div>
      <div class="hub-worlds">${worlds}</div>
      <div class="hub-extra">
        ${pf ? `<button class="hub-chip" data-pf="${escAttr(pf.code)}"><span class="hub-ci">${lightning}</span><span class="hub-ct"><b>${esc(U("defi_title", "Défi du jour"))}</b><span>${esc(U("defi_sub", "1 min"))}</span></span></button>` : ""}
        <button class="hub-chip" data-faute><span class="hub-ci">${loupe}</span><span class="hub-ct"><b>${esc(U("faute_title", "Trouve la faute"))}</b><span>${esc(U("faute_sub", "Repère l’erreur"))}</span></span></button>
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

    // Ouvrir = « lue » (progression du hub), tracké UNE fois — pas à chaque coche
    // de geste, qui re-render la fiche.
    if (lastFicheTracked !== f.code) {
      markRead(f.code);
      track("revision_conduite_fiche_open", { code: f.code });
      track("revision_conduite_fiche_read", { code: f.code });
      lastFicheTracked = f.code;
    }

    const steps = Array.isArray(f.methode) ? f.methode : [];
    const total = steps.length;
    const groups = groupSteps(steps);
    const grouped = useGrouped(steps, groups);
    // Texte « propre » (préfixe de section retiré) pour le jeu « remets dans l'ordre ».
    const flatSteps = grouped ? groups.flatMap((g) => g.steps) : steps;

    // i18n : méthode traduite (raw, parallèle à f.methode). Pour les fiches
    // « à sections », on re-groupe la traduction (préfixes « Libellé — » gardés)
    // et on vérifie qu'elle s'aligne 1-pour-1 ; sinon repli propre (FR seul).
    const tf = fTr(f.code);
    const trMethode = tf?.methode || null;
    const trGroups = grouped && trMethode ? groupSteps(trMethode) : null;
    const gAligned =
      !!trGroups &&
      trGroups.length === groups.length &&
      groups.every((g, gi) => trGroups[gi].steps.length === g.steps.length);
    const flatTr = grouped
      ? gAligned
        ? trGroups.flatMap((g) => g.steps)
        : null
      : trMethode;
    const flatStepsData = flatSteps.map((s, i) => ({ fr: s, tr: flatTr?.[i] }));

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
    const card = (s, tr, i) => {
      const done = doneSet.has(i);
      const next = i === firstUnchecked;
      return `<button class="fd-card${done ? " done" : ""}${next ? " next" : ""}" data-geste="${i}" aria-pressed="${done}">
        ${next ? `<span class="fd-next-flag">${esc(U("next_flag", "à toi"))}</span>` : ""}
        <span class="fd-chk ${done ? "filled" : "empty"}">${done ? CHK : ""}</span>
        <span class="fd-num">${i + 1}</span>
        <span class="fd-txt">${bi(s, tr)}</span>
      </button>`;
    };

    // Le sous-titre de section fait office d'en-tête « La méthode » (pas de
    // double titre) : chaque groupe a le sien, le 1er sans libellé retombe dessus.
    const seclab = (t) =>
      `<div class="fd-seclab"><h2>${esc(t)}</h2><div class="line"></div></div>`;
    let deckHtml = "";
    if (grouped) {
      let idx = 0;
      deckHtml = groups
        .map((g, gi) => {
          const cards = g.steps
            .map((s, si) =>
              card(s, gAligned ? trGroups[gi].steps[si] : undefined, idx++),
            )
            .join("");
          const label = g.label
            ? T(g.label, gAligned ? trGroups[gi].label : null)
            : U("method_header", "La méthode");
          return `${seclab(label)}<div class="fd-deck">${cards}</div>`;
        })
        .join("");
    } else {
      deckHtml = `${seclab(U("method_header", "La méthode"))}<div class="fd-deck">${steps.map((s, i) => card(s, trMethode?.[i], i)).join("")}</div>`;
    }

    // Cartes coach : uniquement celles présentes dans la fiche (repli gracieux).
    const ERR_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l9.5 16.5H2.5L12 3z" fill="#ef6a3a"/><path d="M12 10v4.5" stroke="#fff0e8" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.2" fill="#fff0e8"/></svg>`;
    const WHY_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M9.5 21h5" stroke="#7c5fe0" stroke-width="1.8" stroke-linecap="round"/><path d="M12 3a6 6 0 0 1 3.6 10.8c-.7.5-1.1 1.2-1.1 2H9.5c0-.8-.4-1.5-1.1-2A6 6 0 0 1 12 3z" fill="#7c5fe0"/></svg>`;
    const AUTO_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7h9a2 2 0 0 1 1.9 1.6L20 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z" fill="#3f82d6"/><circle cx="7.2" cy="15.4" r="1.1" fill="#eaf3ff"/><circle cx="16.8" cy="15.4" r="1.1" fill="#eaf3ff"/></svg>`;
    const coach = [];
    if (f.erreur)
      coach.push([
        "err",
        U("err_label", "L’erreur à éviter"),
        f.erreur,
        tf?.erreur,
        ERR_IC,
      ]);
    if (f.pourquoi)
      coach.push([
        "why",
        U("why_label", "Pourquoi ça compte"),
        f.pourquoi,
        tf?.pourquoi,
        WHY_IC,
      ]);
    if (f.bva)
      coach.push([
        "auto",
        U("bva_label", "En boîte auto"),
        f.bva,
        tf?.bva,
        AUTO_IC,
      ]);
    const coachHtml = coach.length
      ? `<div class="fd-coach-wrap">
          <div class="fd-seclab"><h2>${esc(U("coach_header", "Cartes coach"))}</h2><div class="line"></div></div>
          <div class="fd-coach" style="grid-template-columns:repeat(${coach.length},1fr)">
            ${coach
              .map(
                ([c, h, pFr, pTr, ic]) =>
                  `<div class="fd-cc ${c}"><span class="fd-ic">${ic}</span><h4>${esc(h)}</h4><p>${bi(pFr, pTr)}</p></div>`,
              )
              .join("")}
          </div>
        </div>`
      : "";

    const srcChaines = sourceChannels(f);
    const srcHtml = srcChaines.length
      ? `<div class="fd-source">${esc(U("source_prefix", "Vu chez de vrais moniteurs :"))} <b>${srcChaines.map((s) => esc(s)).join(", ")}</b></div>`
      : "";

    const BACK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="#3d2f7a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const SHUF = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h11M4 12h11M4 17h7" stroke="#3d2f7a" stroke-width="2" stroke-linecap="round"/><path d="M18 8l3 3-3 3" stroke="#3d2f7a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    root.innerHTML = `${FD_STYLE}<div class="fd">
      <div class="fd-hero">
        <div class="fd-topbar">
          <button class="fd-back" aria-label="Retour">${BACK}</button>
          <span class="fd-tag"><span class="fd-dot"></span><b>${esc(f.code)} · ${esc(T(f.competence, tf?.competence))} · ${esc(U("monde_word", "Monde"))} ${esc(String(f.monde))}</b></span>
        </div>
        <h1 class="fd-title fd-gold">${esc(T(f.titre, tf?.titre))}</h1>
        <div class="fd-sub">${esc(U("deck_sub", "Coche tes gestes, puis débloque le test."))}</div>
        <div class="fd-xp">
          <div class="fd-xp-top"><span class="lab">${esc(U("deck_label", "Ton deck"))}</span><span class="cnt fd-gold">${count}<small> / ${total} ${esc(total > 1 ? U("geste_plur", "gestes") : U("geste_sing", "geste"))}</small></span></div>
          <div class="fd-bar"><div class="fill" style="width:${count ? Math.max(pct, 4) : 0}%"></div></div>
        </div>
      </div>

      ${deckHtml}

      ${coachHtml}
      ${srcHtml}

      <div class="fd-actions">
        <button class="fd-cta" data-quiz><span>${esc(U("cta_test", "Teste-toi"))}</span></button>
        ${total >= 3 ? `<button class="fd-secondary" data-order>${SHUF}<span>${esc(U("cta_order", "Remets dans l’ordre"))}</span></button>` : ""}
      </div>
    </div>`;

    wireFicheDeck(f, flatStepsData);
  }

  function wireFicheDeck(f, flatStepsData) {
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
    root.querySelector("[data-quiz]")?.addEventListener("click", () => {
      focusId = null;
      startQuiz();
    });
    root.querySelector("[data-order]")?.addEventListener("click", () => {
      orderPlaced = [];
      const flat =
        flatStepsData && flatStepsData.length
          ? flatStepsData
          : (f.methode || []).map((s) => ({ fr: s }));
      orderPool = flat
        .map((d, i) => ({ i, t: d.fr, tr: d.tr }))
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
      const doneSub = U(
        "order_done_sub",
        "Les {n} étapes de « {titre} » : pliées.",
      )
        .replace("{n}", steps.length)
        .replace("{titre}", T(f.titre, fTr(f.code)?.titre));
      root.innerHTML = `${STYLE}<div class="rvc"><div class="rvc-done">
        <div class="rvc-done-e">${medallion("check", "green", { size: 64 })}</div>
        <div class="rvc-done-t">${esc(U("order_done_title", "Dans l’ordre, nickel !"))}</div>
        <p class="rvc-sub">${esc(doneSub)}</p>
        <button class="rvc-go" data-next>${esc(U("order_continue", "Continuer"))}</button>
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
          `<div class="rvc-oslot"><span class="rvc-onum">${idx + 1}</span><span>${esc(T(p.t, p.tr))}</span></div>`,
      )
      .join("");
    const pool = orderPool
      .map(
        (p) =>
          `<button class="rvc-ochip" data-oi="${p.i}">${esc(T(p.t, p.tr))}</button>`,
      )
      .join("");
    root.innerHTML = `${STYLE}<div class="rvc">
      <div class="rvc-top">
        <button class="rvc-back" aria-label="Retour à la fiche">←</button>
        <h1 class="rvc-h1" style="font-size:17px">${esc(T(f.titre, fTr(f.code)?.titre))}</h1>
      </div>
      <div class="rvc-prog">${orderPlaced.length + 1} / ${steps.length}</div>
      <p class="rvc-ohint">${esc(U("order_hint", "Dans le bon ordre. À toi."))}</p>
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
    // i18n : on attache la traduction (énoncé + options DANS LE MÊME ORDRE +
    // explication) à chaque question. options_tr aligné → l'index de la bonne
    // réponse (correction) n'est jamais touché. En 'fr', questions inchangées.
    const qtr = lang !== "fr" ? FICHE_QUIZ_I18N[lang]?.[code] : null;
    const questions = quizByCode(code).map((q, i) => {
      const tr = qtr?.[i];
      return tr
        ? {
            ...q,
            q_tr: tr.q,
            options_tr: tr.options,
            explication_tr: tr.explication,
          }
        : q;
    });
    if (!questions.length) {
      view = "fiche";
      return render();
    }
    track("revision_conduite_quiz_start", { code });
    mountPremiumQuiz(root, {
      questions,
      questHint: true, // ce quiz alimente la quête du jour (réussi = ≥70 %)
      title: f ? T(f.titre, fTr(f.code)?.titre) : "Quiz",
      onExit: (good, total) => {
        markRevised(code);
        track("revision_conduite_quiz_done", { code, good, total });
        // Alimente la ligue Révision : +1 pt si ≥70% sur cette compétence.
        // Insertion directe (RLS : l'élève écrit les siens), type 'review' →
        // compté par get_theory_leaderboard (DISTINCT competence_id, score≥70).
        // On n'appelle PAS submit_competence_quiz : il passe la validation à
        // « acquis », or l'élève ne valide JAMAIS sa conduite (c'est le moniteur).
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
        view = "home";
        render();
      },
    });
  }

  render();
}
