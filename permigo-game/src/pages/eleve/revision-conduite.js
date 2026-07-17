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
import { medallion, medStatus } from "@/utils/medallions.js";
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

/* ───── Home « Bento » : navigation engageante vers les fiches ───── */
.rvcb { --lime:#c8ff4d; --lime-ink:#1f2a00; --rb:24px; }
.rvcb-top { display:flex; align-items:center; gap:11px; padding:16px 0 12px; }
.rvcb-hi { display:flex; flex-direction:column; gap:1px; flex:1; min-width:0; }
.rvcb-k { font:600 12px 'Plus Jakarta Sans',sans-serif; letter-spacing:.04em; text-transform:uppercase; color:var(--mu,#9499a8); }
.rvcb-n { font:800 21px/1.1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.02em; color:var(--ink); }

.rvcb-bar { height:7px; border-radius:99px; background:var(--bo3,#e7e9f0); overflow:hidden; margin-top:10px; }
.rvcb-bar > i { display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--a,#6366f1),var(--a-lt,#818cf8)); }

/* liste de fiches d'un monde (renderMonde) */
.rvcb-mprog { display:flex; align-items:center; gap:10px; margin:2px 0 14px; }
.rvcb-mprog .rvcb-bar { flex:1; margin-top:0; }
.rvcb-mprog-x { font:700 12px 'Plus Jakarta Sans',sans-serif; color:var(--mu,#9499a8); white-space:nowrap; }
.rvcb-flist { display:flex; flex-direction:column; gap:9px; }
.rvcb-frow { display:flex; align-items:center; gap:12px; width:100%; text-align:left; cursor:pointer; color:var(--ink);
  background:var(--su,#fff); border:1px solid var(--bo3,#e7e9f0); border-radius:15px; padding:13px 14px;
  box-shadow:0 6px 18px -14px rgba(40,30,90,.4); transition:transform .15s cubic-bezier(.23,1,.32,1); }
.rvcb-frow:active { transform:scale(.985); }
.rvcb-frow-code { flex:none; font:700 11px 'IBM Plex Mono',monospace; color:var(--a,#6366f1);
  background:color-mix(in srgb,var(--a,#6366f1) 12%,transparent); padding:5px 8px; border-radius:8px; }
.rvcb-frow-t { flex:1; font:700 14px/1.25 'Plus Jakarta Sans',sans-serif; }
.rvcb-frow.is-read .rvcb-frow-t { color:var(--mu,#9499a8); }
.rvcb-frow-st { flex:none; width:22px; height:22px; display:grid; place-items:center; }
.rvcb-frow-st .pg-med { width:22px; height:22px; }

/* ═══ Refonte « simple » de la home (mockup validé) : une seule action,
      progression calme, liste des fiches repliée, entraînement optionnel en bas.
      Theme-aware : suit l'accent du compte (--a). ═══ */
.rvs-head { display:flex; align-items:flex-start; gap:12px; padding:16px 0 4px; }
.rvs-head .rvc-back { margin-top:2px; }
.rvs-h1 { font:800 24px/1.05 'Plus Jakarta Sans',sans-serif; letter-spacing:-.025em; margin:0; color:var(--ink); }
.rvs-p { margin:5px 0 0; font:600 13px/1.5 'Inter',sans-serif; color:var(--mu,#64748b); }
.rvs-p b { color:var(--a-txt,var(--a,#4f46e5)); }

.rvs-now { position:relative; overflow:hidden; display:block; width:100%; text-align:left; cursor:pointer;
  margin:16px 0 0; border:1px solid var(--bo3,#e6eaf2); border-radius:22px; padding:17px;
  background:var(--su,#fff); color:var(--ink); box-shadow:0 12px 26px -16px rgba(30,40,80,.4);
  -webkit-tap-highlight-color:transparent; transition:transform .12s ease; }
.rvs-now:active { transform:scale(.99); }
.rvs-now::before { content:""; position:absolute; right:-40px; top:-40px; width:150px; height:150px; border-radius:50%;
  background:radial-gradient(circle, color-mix(in srgb,var(--a,#6c63ff) 18%,transparent), transparent 70%); }
.rvs-now-k { position:relative; display:inline-flex; align-items:center; gap:7px; font:800 11px/1 'Inter',sans-serif;
  letter-spacing:.09em; text-transform:uppercase; color:var(--a-txt,var(--a));
  background:color-mix(in srgb,var(--a,#6c63ff) 12%,transparent); padding:6px 10px; border-radius:999px; }
.rvs-dot { width:7px; height:7px; border-radius:50%; background:var(--a,#6c63ff);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--a,#6c63ff) 25%,transparent); }
.rvs-now-t { position:relative; display:block; margin:11px 0 4px; font:800 20px/1.15 'Plus Jakarta Sans',sans-serif; letter-spacing:-.01em; }
.rvs-now-meta { position:relative; display:flex; align-items:center; gap:7px; font:600 13px/1 'Inter',sans-serif; color:var(--mu,#64748b); }
.rvs-chipm { background:var(--bg,#eef1f7); border-radius:6px; padding:3px 7px; font:800 11.5px/1 'Inter',sans-serif; color:var(--mu,#57617c); }
.rvs-cta { position:relative; margin-top:14px; width:100%; height:54px; border-radius:16px;
  /* Dégradé MÊME TEINTE (reflet clair → accent → foncé) : avec un skin
     d'accent, --a-lt peut diverger de --a et le bouton devenait bicolore. */
  background:linear-gradient(180deg,
    color-mix(in srgb, var(--a) 88%, #fff) 0%,
    var(--a) 50%,
    var(--adk) 100%); color:#fff;
  box-shadow:0 5px 0 var(--adk), 0 10px 20px -6px color-mix(in srgb, var(--a) 50%, transparent);
  font:800 16px/1 'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:9px; }
.rvs-cta-ic { width:26px; height:26px; border-radius:8px; background:var(--adk); display:grid; place-items:center; }
.rvs-cta-ic svg { width:14px; height:14px; color:#fff; }
.rvs-done { cursor:default; } .rvs-done:active { transform:none; }

.rvs-prog { margin:20px 2px 0; }
.rvs-prog-h { display:flex; align-items:center; justify-content:space-between; font:800 13px/1 'Inter',sans-serif; color:var(--ink); }
.rvs-prog-x { color:var(--mu,#64748b); }
.rvs-bar { margin-top:9px; height:9px; border-radius:99px; background:var(--bo3,#e2e7f1); overflow:hidden; }
.rvs-bar > i { display:block; height:100%; border-radius:99px;
  background:linear-gradient(90deg,var(--a,#6c63ff),color-mix(in srgb,var(--a,#6c63ff) 55%,#fff)); transition:width .5s ease; }

.rvs-sec { margin:22px 2px 8px; font:800 12px/1 'Inter',sans-serif; letter-spacing:.06em; text-transform:uppercase; color:var(--mu2,#9aa3ba); }
.rvs-list { display:flex; flex-direction:column; gap:10px; }
.rvs-grp { display:flex; align-items:center; gap:12px; width:100%; text-align:left; cursor:pointer;
  background:var(--su,#fff); border:1px solid var(--bo3,#e6eaf2); border-radius:16px; padding:13px 14px; color:var(--ink);
  -webkit-tap-highlight-color:transparent; transition:transform .12s ease; }
.rvs-grp:active { transform:scale(.99); }
.rvs-num { width:34px; height:34px; border-radius:10px; flex:none; display:grid; place-items:center; color:#fff;
  font:800 15px/1 'Plus Jakarta Sans',sans-serif; box-shadow:inset 0 -2px 0 rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.35); }
.rvs-grp-t { flex:1; min-width:0; }
.rvs-grp-t b { display:block; font:800 14.5px/1.15 'Plus Jakarta Sans',sans-serif; }
.rvs-grp-t span { font:600 12px/1 'Inter',sans-serif; color:var(--mu,#64748b); }
.rvs-grp-c { font:800 12.5px/1 'Inter',sans-serif; color:var(--mu2,#9aa3ba); flex:none; }
.rvs-chev { width:20px; height:20px; flex:none; color:var(--mu2,#9aa3ba); }

/* Les 4 mondes différenciés : chaque ligne a le rail de couleur de SON monde,
   et le monde EN COURS ressort (teinte + ombre + pastille « Reprendre ») pour
   que le regard s'y pose direct — fini les 4 lignes identiques. */
.rvs-grp { border-left:5px solid var(--mc,#6366f1); }
.rvs-grp.is-current { padding:15px 14px;
  border:1.5px solid color-mix(in srgb, var(--mc,#6366f1) 45%, var(--bo3,#e6eaf2));
  border-left:5px solid var(--mc,#6366f1);
  background:color-mix(in srgb, var(--mc,#6366f1) 9%, var(--su,#fff));
  box-shadow:0 14px 30px -16px var(--mc,#6366f1); }
.rvs-grp.is-current .rvs-grp-t b { color:var(--ink); }
.rvs-grp-badge { flex:none; font:800 11px/1 'Inter',sans-serif; color:#fff;
  background:var(--mc,#6366f1); border-radius:999px; padding:6px 11px; white-space:nowrap; }
.rvs-grp.is-done { opacity:.9; }
.rvs-grp.is-done .rvs-grp-c { color:var(--gr-txt,#16a34a); }

.rvs-extra { margin:22px 0 0; background:color-mix(in srgb,var(--ink,#141c30) 3%,var(--su,#fff));
  border:1px dashed var(--bo3,#d9dfec); border-radius:14px; padding:13px 14px; }
.rvs-extra > p { margin:0 0 9px; font:700 12.5px/1 'Inter',sans-serif; color:var(--mu,#64748b); }
.rvs-extra-row { display:flex; gap:9px; }
.rvs-mini { flex:1; display:flex; align-items:center; gap:9px; cursor:pointer; background:var(--su,#fff);
  border:1px solid var(--bo3,#e6eaf2); border-radius:11px; padding:9px 10px; color:var(--ink);
  font:800 12.5px/1.1 'Inter',sans-serif; text-align:left; -webkit-tap-highlight-color:transparent; }
.rvs-mini-ic { width:26px; height:26px; border-radius:8px; flex:none; display:grid; place-items:center; color:#fff; font-weight:900; }
.rvs-mini-ic svg { width:15px; height:15px; }

.rvs-foot { text-align:center; margin:20px 0 0; font:600 12px/1.4 'Inter',sans-serif; color:var(--mu2,#9aa3ba); }

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
    const items = fm
      .map((f) => {
        const on = !!read[f.code];
        return `<button class="rvcb-frow ${on ? "is-read" : ""}" data-code="${esc(f.code)}">
            <span class="rvcb-frow-code">${esc(f.code)}</span>
            <span class="rvcb-frow-t">${esc(f.titre)}</span>
            <span class="rvcb-frow-st">${on ? medStatus("acquis", { size: 22 }) : ""}</span>
          </button>`;
      })
      .join("");
    root.innerHTML = `${STYLE}<div class="rvc rvcb">
      <div class="rvcb-top">
        <button class="rvc-back" aria-label="Retour">←</button>
        <div class="rvcb-hi">
          <span class="rvcb-k">Monde ${m.n} · ${esc(m.nom)}</span>
          <span class="rvcb-n">${esc(m.sous)}</span>
        </div>
      </div>
      <div class="rvcb-mprog"><div class="rvcb-bar"><i style="width:${p}%"></i></div><span class="rvcb-mprog-x">${done}/${fm.length} lues</span></div>
      <div class="rvcb-flist">${items}</div>
    </div>`;
    root.querySelector(".rvc-back").addEventListener("click", () => {
      view = "home";
      render();
    });
    root.querySelectorAll(".rvcb-frow").forEach((b) =>
      b.addEventListener("click", () => {
        code = b.getAttribute("data-code");
        focusId = null;
        view = "fiche";
        render();
      }),
    );
  }

  // Home « Bento » (style validé sur maquette) : tuiles modulaires premium —
  // défi du jour dominant, progression chiffrée, prochaine fiche, Trouve la
  // faute, ciblage moniteur, et les 4 mondes en mosaïque. Donne envie d'entrer
  // dans les fiches « Coach ». Theme-aware (suit l'accent du compte).
  function renderHome() {
    const read = loadRead();
    const revised = loadRevised();
    const totalF = FICHES.length;
    const lues = FICHES.filter((f) => read[f.code]).length;
    const pct = totalF ? Math.round((lues / totalF) * 100) : 0;
    const pf = pointFaible(revised);
    const nextF = FICHES.find((f) => !read[f.code]) || pf;
    const firstEver = lues === 0;

    const chev = `<svg class="rvs-chev" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;
    const play = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5l12 7-12 7V5z"/></svg>`;
    const eclair = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>`;

    // ── UNE seule action : reprendre (ou commencer) la lecture ──
    const primary = nextF
      ? `<button class="rvs-now" ${firstEver ? "data-first" : "data-next"} data-code="${esc(nextF.code)}">
          <span class="rvs-now-k"><span class="rvs-dot"></span>${firstEver ? "Commence ta révision" : "Reprends ta lecture"}</span>
          <span class="rvs-now-t">${esc(nextF.titre)}</span>
          <span class="rvs-now-meta"><span class="rvs-chipm">Monde ${nextF.monde}</span>Fiche ${esc(nextF.code)}</span>
          <span class="rvs-cta"><span class="rvs-cta-ic">${play}</span>${read[nextF.code] ? "Relire la fiche" : "Lire la fiche"}</span>
        </button>`
      : `<div class="rvs-now rvs-done">
          <span class="rvs-now-k"><span class="rvs-dot"></span>Bien joué</span>
          <span class="rvs-now-t">Tu as lu les ${totalF} fiches</span>
          <span class="rvs-now-meta">Reviens avant chaque leçon.</span>
        </div>`;

    // ── Les 4 mondes : liste calme, une ligne = un monde, ouvre ses fiches ──
    // Pivot 17/07 (Rayan, capture à l'appui : « ça surstimule mon cerveau ») :
    // une SEULE teinte — l'accent du compte. La hiérarchie passe par le
    // numéro, le monde EN COURS mis en avant et l'état ✓, pas par 4 couleurs.
    const MCOLOR_ALL =
      "linear-gradient(160deg, color-mix(in srgb, var(--a) 78%, #fff), var(--a))";
    const curMonde = nextF ? Number(nextF.monde) : null;
    const mondeRows = MONDES.map((m) => {
      const fm = fichesByMonde(m.n);
      const done = fm.filter((f) => read[f.code]).length;
      const isCurrent = curMonde === m.n;
      const complete = fm.length > 0 && done === fm.length;
      const cls = `rvs-grp pg-loupe${isCurrent ? " is-current" : ""}${complete ? " is-done" : ""}`;
      return `<button class="${cls}" data-monde="${m.n}" style="--mc:var(--a)">
        <span class="rvs-num" style="background:${MCOLOR_ALL}">${complete ? "✓" : m.n}</span>
        <span class="rvs-grp-t"><b>${esc(m.sous)}</b><span>${esc(m.nom)}</span></span>
        ${isCurrent ? `<span class="rvs-grp-badge">Reprendre</span>` : `<span class="rvs-grp-c">${done}/${fm.length}</span>`}
        ${chev}
      </button>`;
    }).join("");

    root.innerHTML = `${STYLE}<div class="rvc">
      <div class="rvs-head">
        <button class="rvc-back" aria-label="Retour à l’accueil">←</button>
        <div class="rvs-head-tx">
          <h1 class="rvs-h1">Révise ta conduite</h1>
          <p class="rvs-p">Le geste, pas le code. Ici, tu prépares tes leçons de conduite, à ton rythme.</p>
        </div>
      </div>

      ${primary}

      <div class="rvs-prog">
        <div class="rvs-prog-h"><span>Ta progression</span><span class="rvs-prog-x">${lues} fiche${lues > 1 ? "s" : ""} sur ${totalF}</span></div>
        <div class="rvs-bar"><i style="width:${Math.max(pct, lues ? 3 : 0)}%"></i></div>
      </div>

      <div class="rvs-sec">Toutes les fiches</div>
      <div class="rvs-list">${mondeRows}</div>

      <div class="rvs-extra">
        <p>Pour t’entraîner autrement · optionnel</p>
        <div class="rvs-extra-row">
          ${pf ? `<button class="rvs-mini" data-pf="${esc(pf.code)}"><span class="rvs-mini-ic" style="background:linear-gradient(160deg, color-mix(in srgb, var(--a) 78%, #fff), var(--a))">${eclair}</span>Défi du jour · 1 min</button>` : ""}
          <button class="rvs-mini" data-faute><span class="rvs-mini-ic" style="background:linear-gradient(160deg,var(--a),var(--adk))">!</span>Trouve la faute</button>
        </div>
      </div>

      <div class="rvs-foot">${totalF} fiches · le geste, pas que le code</div>
    </div>`;
    wireHome();
  }

  function wireHome() {
    root
      .querySelector(".rvc-back")
      ?.addEventListener("click", () => navigate("#/"));
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
    root.querySelector("[data-next]")?.addEventListener("click", (e) => {
      code = e.currentTarget.getAttribute("data-code");
      focusId = null;
      view = "fiche";
      render();
    });
    root.querySelector("[data-first]")?.addEventListener("click", (e) => {
      code = e.currentTarget.getAttribute("data-code");
      focusId = null;
      track("revision_conduite_first_fiche", { code });
      view = "fiche";
      render();
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
    const card = (s, i) => {
      const done = doneSet.has(i);
      const next = i === firstUnchecked;
      return `<button class="fd-card${done ? " done" : ""}${next ? " next" : ""}" data-geste="${i}" aria-pressed="${done}">
        ${next ? `<span class="fd-next-flag">à toi</span>` : ""}
        <span class="fd-chk ${done ? "filled" : "empty"}">${done ? CHK : ""}</span>
        <span class="fd-num">${i + 1}</span>
        <span class="fd-txt">${esc(s)}</span>
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
        .map((g) => {
          const cards = g.steps.map((s) => card(s, idx++)).join("");
          return `${seclab(g.label || "La méthode")}<div class="fd-deck">${cards}</div>`;
        })
        .join("");
    } else {
      deckHtml = `${seclab("La méthode")}<div class="fd-deck">${steps.map((s, i) => card(s, i)).join("")}</div>`;
    }

    // Cartes coach : uniquement celles présentes dans la fiche (repli gracieux).
    const ERR_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l9.5 16.5H2.5L12 3z" fill="#ef6a3a"/><path d="M12 10v4.5" stroke="#fff0e8" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.2" fill="#fff0e8"/></svg>`;
    const WHY_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M9.5 21h5" stroke="#7c5fe0" stroke-width="1.8" stroke-linecap="round"/><path d="M12 3a6 6 0 0 1 3.6 10.8c-.7.5-1.1 1.2-1.1 2H9.5c0-.8-.4-1.5-1.1-2A6 6 0 0 1 12 3z" fill="#7c5fe0"/></svg>`;
    const AUTO_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7h9a2 2 0 0 1 1.9 1.6L20 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z" fill="#3f82d6"/><circle cx="7.2" cy="15.4" r="1.1" fill="#eaf3ff"/><circle cx="16.8" cy="15.4" r="1.1" fill="#eaf3ff"/></svg>`;
    const coach = [];
    if (f.erreur) coach.push(["err", "L’erreur à éviter", f.erreur, ERR_IC]);
    if (f.pourquoi)
      coach.push(["why", "Pourquoi ça compte", f.pourquoi, WHY_IC]);
    if (f.bva) coach.push(["auto", "En boîte auto", f.bva, AUTO_IC]);
    const coachHtml = coach.length
      ? `<div class="fd-coach-wrap">
          <div class="fd-seclab"><h2>Cartes coach</h2><div class="line"></div></div>
          <div class="fd-coach" style="grid-template-columns:repeat(${coach.length},1fr)">
            ${coach
              .map(
                ([c, h, p, ic]) =>
                  `<div class="fd-cc ${c}"><span class="fd-ic">${ic}</span><h4>${h}</h4><p>${esc(p)}</p></div>`,
              )
              .join("")}
          </div>
        </div>`
      : "";

    const srcChaines = sourceChannels(f);
    const srcHtml = srcChaines.length
      ? `<div class="fd-source">Vu chez de vrais moniteurs : <b>${srcChaines.map((s) => esc(s)).join(", ")}</b></div>`
      : "";

    const BACK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="#3d2f7a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const SHUF = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h11M4 12h11M4 17h7" stroke="#3d2f7a" stroke-width="2" stroke-linecap="round"/><path d="M18 8l3 3-3 3" stroke="#3d2f7a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    root.innerHTML = `${FD_STYLE}<div class="fd">
      <div class="fd-hero">
        <div class="fd-topbar">
          <button class="fd-back" aria-label="Retour">${BACK}</button>
          <span class="fd-tag"><span class="fd-dot"></span><b>${esc(f.code)} · ${esc(f.competence)} · Monde ${esc(String(f.monde))}</b></span>
        </div>
        <h1 class="fd-title fd-gold">${esc(f.titre)}</h1>
        <div class="fd-sub">Coche tes gestes, puis débloque le test.</div>
        <div class="fd-xp">
          <div class="fd-xp-top"><span class="lab">Ton deck</span><span class="cnt fd-gold">${count}<small> / ${total} geste${total > 1 ? "s" : ""}</small></span></div>
          <div class="fd-bar"><div class="fill" style="width:${count ? Math.max(pct, 4) : 0}%"></div></div>
        </div>
      </div>

      ${deckHtml}

      ${coachHtml}
      ${srcHtml}

      <div class="fd-actions">
        <button class="fd-cta" data-quiz><span>Teste-toi</span></button>
        ${total >= 3 ? `<button class="fd-secondary" data-order>${SHUF}<span>Remets dans l’ordre</span></button>` : ""}
      </div>
    </div>`;

    wireFicheDeck(f, flatSteps);
  }

  function wireFicheDeck(f, flatSteps) {
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
    const questions = quizByCode(code);
    if (!questions.length) {
      view = "fiche";
      return render();
    }
    track("revision_conduite_quiz_start", { code });
    mountPremiumQuiz(root, {
      questions,
      questHint: true, // ce quiz alimente la quête du jour (réussi = ≥70 %)
      title: f ? f.titre : "Quiz",
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
