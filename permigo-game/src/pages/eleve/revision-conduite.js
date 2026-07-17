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
const LS_PARTS_KEY = "rvc_parts_v1"; // { [code]: n } — étapes lues d'une fiche « mission »

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
function loadParts() {
  try {
    return JSON.parse(localStorage.getItem(LS_PARTS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function savePartsDone(code, n) {
  const p = loadParts();
  p[code] = n;
  try {
    localStorage.setItem(LS_PARTS_KEY, JSON.stringify(p));
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

/* ───── Fiche « Carnet » : éditorial, gros numéros, filets, zéro carte ─────
   Lecture confortable : la fiche se lit TOUJOURS sur un papier clair pastel
   (crème chaud), même quand l'appareil est en mode sombre — on lit une méthode,
   pas un tableau de bord. On redéfinit les tokens NEUTRES en local (exactement
   comme les encarts coaching-tip) : tous les enfants héritent, aucun token
   global n'est touché. L'accent violet (--a) reste la marque élève. */
.rvc-detail {
  --bg:#faf6ec; --su:#ffffff; --su2:#fbf8f1;
  --bo:#ece4d2; --bo3:#ece4d2;
  --ink:#2a2416; --mu:#7b7159; --mu2:#9a9078;
  --a-txt:#4a3fc9; --am-txt:#b45309;
  color-scheme: light;
  color: var(--ink);
}
.rvc-detail .rvc-back { border-radius:6px; border:1.5px solid var(--ink); background:transparent;
  box-shadow:none; }
.rvc-fbadge { font:600 11px 'IBM Plex Mono',monospace; letter-spacing:.14em; text-transform:uppercase;
  color:var(--a,#6366f1); margin-left:2px; }
.rvc-ftitle { font:800 27px/1.08 'Plus Jakarta Sans',sans-serif; letter-spacing:-.03em; margin:14px 0 6px; color:var(--ink); }
.rvc-fmeta { font:500 13px 'IBM Plex Mono',monospace; color:var(--mu,#94a3b8); letter-spacing:.01em; margin:0; }

/* Libellé de section : mot + filet plein + numérotage à droite */
.rvc-lbl { display:flex; align-items:center; gap:12px; margin:30px 0 6px; }
.rvc-lbl b { font:700 12px 'IBM Plex Mono',monospace; letter-spacing:.16em; text-transform:uppercase; color:var(--ink); }
.rvc-lbl-line { flex:1; height:1.5px; background:var(--ink); opacity:.85; }
.rvc-lbl-n { font:600 11px 'IBM Plex Mono',monospace; color:var(--mu,#94a3b8); letter-spacing:.04em; }

/* Méthode éditoriale : colonne à gros numéros, filets entre les gestes */
.rvc-method { margin-top:2px; }
.rvc-msub { font:700 11px 'IBM Plex Mono',monospace; letter-spacing:.13em; text-transform:uppercase;
  color:var(--a,#6366f1); margin:16px 0 2px; }
.rvc-step { display:grid; grid-template-columns:42px 1fr; gap:14px; align-items:start; padding:16px 0; }
.rvc-step + .rvc-step, .rvc-msub + .rvc-step { border-top:1px solid var(--bo3,#e2e8f0); }
.rvc-msub + .rvc-step { border-top:0; }
.rvc-step-n { font:800 26px/1 'Plus Jakarta Sans',sans-serif; color:var(--a,#6366f1); letter-spacing:-.04em; padding-top:1px; }
.rvc-step-t { font:400 15px/1.55 'Inter',sans-serif; color:var(--ink); }
.rvc-step-t b { font-weight:700; }

@keyframes rvcreveal { from{opacity:0; transform:translateY(14px) scale(.98);} to{opacity:1; transform:none;} }

/* « À retenir » : encadrés VOYANTS — l'élève doit les repérer d'un coup d'œil.
   Chaque type a sa couleur, une pastille icône et un fond teinté (fini les
   notes discrètes « qu'on voit mal »). La boîte auto passe en bleu net. */
.rvc-note { display:grid; grid-template-columns:auto 1fr; gap:11px; align-items:start;
  padding:13px 14px; border-radius:14px; margin:10px 0 0; border:1px solid; }
.rvc-note-ic { width:30px; height:30px; border-radius:9px; display:grid; place-items:center; flex:none; }
.rvc-note-ic svg { width:17px; height:17px; }
.rvc-note-k { font:800 11px 'Plus Jakarta Sans',sans-serif; letter-spacing:.05em; text-transform:uppercase; margin:1px 0 4px; }
.rvc-note-p { font:500 14px/1.55 'Inter',sans-serif; color:var(--ink); margin:0; }
/* Erreur à éviter — orange/rouge, le plus voyant */
.rvc-note.warn { background:#fff1e6; border-color:#f9c99a; }
.rvc-note.warn .rvc-note-ic { background:#f97316; color:#fff; }
.rvc-note.warn .rvc-note-k { color:#c2410c; }
/* Pourquoi ça compte — violet (l'accent élève) */
.rvc-note.why { background:#f1efff; border-color:#cfc8fb; }
.rvc-note.why .rvc-note-ic { background:var(--a,#6c63ff); color:#fff; }
.rvc-note.why .rvc-note-k { color:#4a3fc9; }
/* En boîte auto — bleu net (bien visible, demande explicite) */
.rvc-note.bva { background:#e8f4ff; border-color:#b7dbfb; }
.rvc-note.bva .rvc-note-ic { background:#2b83e0; color:#fff; }
.rvc-note.bva .rvc-note-k { color:#1a63b8; }
.rvc-fsrc { font:500 11px 'IBM Plex Mono',monospace; color:var(--mu,#94a3b8); letter-spacing:.02em; margin:22px 0 0; }

.rvc-actbar { position:sticky; bottom:0; display:flex; gap:10px; margin-top:26px;
  padding:12px 0 calc(6px + env(safe-area-inset-bottom)); background:var(--bg); border-top:1px solid var(--bo3,#e2e8f0); }
.rvc-act-ghost { flex:none; border:1.5px solid var(--ink); background:transparent; color:var(--ink); border-radius:6px;
  padding:0 16px; height:50px; cursor:pointer; font:700 13px 'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; gap:8px;
  transition:transform .12s ease; }
.rvc-act-ghost svg { width:16px; height:16px; color:var(--a,#6366f1); }
.rvc-act-ghost:active { transform:scale(.97); }
.rvc-act-main { flex:1; border:0; border-radius:6px; height:50px; cursor:pointer; color:#fff;
  font:800 15px 'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:9px;
  background:var(--a,#6366f1); transition:transform .12s ease,opacity .3s ease; }
.rvc-act-main:active { transform:scale(.97); }
.rvc-act-main svg { width:18px; height:18px; }
.rvc-act-main.locked { opacity:.45; pointer-events:none; }
.rvc-act-main .lock { display:none; }
.rvc-act-main.locked .lock { display:block; }
.rvc-act-main.locked .go { display:none; }

/* (bloc accordéons « rvc-grp » retiré — méthode désormais en colonne éditoriale) */

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

/* ═══ Fiche « Mission » (maquette validée fiche-triee-F-mission.html, choix
      Rayan 2026-07-15) : les fiches longues structurées (sections « Label — »)
      passent en DA Arène nuit-violet + or — 1 partie = 1 étape de mission,
      l'étape en cours est ouverte, les suivantes verrouillées. Toujours
      sombre, comme le hub Réviser (indépendant du thème). ═══ */
.rvm { position:relative;
  margin-top: calc(-1 * (var(--th, 52px) + env(safe-area-inset-top, 0px)));
  padding: calc(var(--th, 52px) + env(safe-area-inset-top, 0px) + 14px) 16px calc(110px + env(safe-area-inset-bottom, 0px));
  min-height: 100dvh; max-width: 480px; margin-left:auto; margin-right:auto;
  color:#f2f0fa; font-family:'Inter',sans-serif;
  background:
    radial-gradient(120% 50% at 50% -5%, rgba(255,190,70,.10) 0%, transparent 55%),
    radial-gradient(120% 55% at 50% 22%, rgba(110,70,220,.22) 0%, transparent 62%),
    linear-gradient(180deg,#181241 0%,#0f0d24 58%,#0b0a1c 100%); }
.rvm-top { display:flex; align-items:center; gap:10px; padding:2px 0 6px; }
.rvm-back { width:38px; height:38px; border-radius:11px; border:0; cursor:pointer; flex-shrink:0;
  background:rgba(255,255,255,.1); color:#fff; font-size:19px; line-height:1; }
.rvm-back:active { transform:scale(.95); }
.rvm-badge { font:700 11px 'Plus Jakarta Sans',sans-serif; letter-spacing:.14em; text-transform:uppercase; color:#cabfef; }
.rvm-title { font:800 26px/1.15 'Baloo 2',cursive; letter-spacing:.01em; margin:10px 0 2px;
  background:linear-gradient(180deg,#ffe9b0,#f5b73d); -webkit-background-clip:text; background-clip:text; color:transparent; }
.rvm-sub { font:600 12.5px/1.5 'Inter',sans-serif; color:#9b8dcf; margin:0; }
.rvm-bar { display:flex; gap:6px; margin:14px 0 4px; }
.rvm-bar i { flex:1; height:9px; border-radius:99px; background:rgba(255,255,255,.12);
  box-shadow:inset 0 2px 3px rgba(0,0,0,.35); position:relative; overflow:hidden; }
.rvm-bar i.done::after { content:""; position:absolute; inset:0; border-radius:99px;
  background:linear-gradient(180deg,#ffe9b0,#f0a93f); box-shadow:inset 0 -2px 0 rgba(0,0,0,.25); }
.rvm-bar-t { font:700 11px 'Plus Jakarta Sans',sans-serif; color:#9b8dcf; margin:0 0 12px; }
.rvm-bar-t b { color:#ffd76e; }
.rvm-etape { border-radius:18px; margin-top:14px; padding:14px 14px 13px;
  background:linear-gradient(180deg,#241c52,#171034); border:1px solid rgba(178,150,255,.28);
  box-shadow:0 8px 0 #0c0820, 0 14px 26px rgba(0,0,0,.45), inset 0 1.5px 0 rgba(255,255,255,.14); }
.rvm-etape.locked { opacity:.55; }
.rvm-eh { display:flex; align-items:center; gap:11px; width:100%; background:none; border:0; padding:0;
  text-align:left; color:inherit; font-family:inherit; cursor:pointer; }
.rvm-eh:disabled { cursor:default; }
.rvm-medal { flex:none; width:44px; height:44px; border-radius:50%; display:grid; place-items:center;
  font:800 17px 'Baloo 2',cursive; color:#4a2500;
  background:radial-gradient(circle at 35% 30%, #ffe9b0, #f0a93f 60%, #b46a10);
  box-shadow:0 4px 8px rgba(0,0,0,.4), inset 0 -3px 4px rgba(0,0,0,.25), inset 0 2px 2px rgba(255,255,255,.55); }
.rvm-etape.done .rvm-medal { background:radial-gradient(circle at 35% 30%, #b5f5cf, #2fae7d 60%, #0d5c3d); color:#04160d; }
.rvm-etape.locked .rvm-medal { background:radial-gradient(circle at 35% 30%, #6a6488, #3a3555 60%, #232040); color:#12101f; }
.rvm-eh .rvm-et b { font:800 16.5px/1.2 'Plus Jakarta Sans',sans-serif; display:block; }
.rvm-eh .rvm-et span { font:600 11.5px 'Inter',sans-serif; color:#9b8dcf; }
.rvm-st { margin-left:auto; flex:none; font:800 10.5px 'Plus Jakarta Sans',sans-serif; letter-spacing:.06em;
  border-radius:99px; padding:5px 10px; background:rgba(0,0,0,.35); color:#8ef0b0; white-space:nowrap; }
.rvm-etape.cur .rvm-st { color:#ffd76e; }
.rvm-etape.locked .rvm-st { color:#9b8dcf; }
.rvm-gestes { margin-top:12px; border-top:1px solid rgba(178,150,255,.18); }
.rvm-gestes[hidden] { display:none; }
.rvm-geste { display:flex; gap:11px; padding:11px 2px; align-items:flex-start; }
.rvm-geste + .rvm-geste { border-top:1px solid rgba(178,150,255,.12); }
.rvm-geste .n { flex:none; width:23px; height:23px; border-radius:7px; background:rgba(255,255,255,.1);
  color:#ffd76e; font:800 11.5px/23px 'Plus Jakarta Sans',sans-serif; text-align:center;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18); }
.rvm-geste p { font:400 13.5px/1.5 'Inter',sans-serif; color:#e8e4f6; margin:0; }
.rvm-cta { margin-top:11px; width:100%; height:46px; border:0; border-radius:12px; cursor:pointer;
  background:linear-gradient(180deg,#ffd76e,#f0a93f); color:#4a2500; font:800 14.5px 'Plus Jakarta Sans',sans-serif;
  box-shadow:0 5px 0 #b46a10, 0 9px 16px rgba(0,0,0,.4); }
.rvm-cta:active { transform:translateY(2px); box-shadow:0 3px 0 #b46a10, 0 6px 12px rgba(0,0,0,.4); }
.rvm-hint { text-align:center; font:600 11.5px 'Inter',sans-serif; color:#9b8dcf; margin:16px 0 0; }
/* Encadrés « à retenir » : fond teinté + filet épais pour qu'ils ressortent
   sur le fond nuit (avant : simple filet, « on les voit mal »). */
.rvm-note { margin-top:14px; padding:12px 14px; border-radius:14px;
  border:1px solid rgba(255,255,255,.10); border-left:4px solid #f0a93f;
  background:rgba(240,169,63,.13); }
.rvm-note.why { border-left-color:#a78bfa; background:rgba(139,92,246,.16); }
.rvm-note.bva { border-left-color:#5fa8ff; background:rgba(95,168,255,.15); }
.rvm-note b { display:block; font:800 11px 'Plus Jakarta Sans',sans-serif; letter-spacing:.06em;
  text-transform:uppercase; color:#ffd76e; margin-bottom:4px; }
.rvm-note.why b { color:#cabfef; }
.rvm-note.bva b { color:#9fccff; }
.rvm-note p { font:400 13.5px/1.55 'Inter',sans-serif; color:#e8e4f6; margin:0; }
.rvm-src { font:500 11px 'IBM Plex Mono',monospace; color:#9b8dcf; margin:18px 0 0; }
.rvm-acts { display:flex; gap:10px; margin-top:22px; }
.rvm-ghost { flex:none; border:1.5px solid rgba(255,255,255,.5); background:transparent; color:#fff;
  border-radius:12px; padding:0 16px; height:50px; cursor:pointer;
  font:700 13px 'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; gap:8px; }
.rvm-ghost svg { width:16px; height:16px; color:#ffd76e; }
.rvm-ghost:active { transform:scale(.97); }
.rvm-main { flex:1; border:0; border-radius:12px; height:50px; cursor:pointer; color:#4a2500;
  font:800 15px 'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:9px;
  background:linear-gradient(180deg,#ffd76e,#f0a93f); box-shadow:0 5px 0 #b46a10, 0 9px 16px rgba(0,0,0,.4); }
.rvm-main:active { transform:translateY(2px); }
.rvm-main svg { width:18px; height:18px; }

@media (prefers-reduced-motion: reduce) { .rvc *, .rvc *::before, .rvm *, .rvm *::before { transition:none !important; animation:none !important; } }
</style>`;

// Pictos SVG (sobres, mono-trait) réutilisés par la fiche « Coach ».
const FSVG = {
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  warn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>`,
  auto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg>`,
  video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m23 7-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  shuffle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>`,
  play: `<svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>`,
};

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
    if (view === "fiche") return renderFiche();
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

  // Fiche « Coach » : un coach déroule la méthode pas à pas (engagement par
  // l'interaction). Le quiz se débloque une fois la méthode lue. En relecture
  // (déjà déroulée) ou en mouvement réduit, tout s'affiche d'emblée — pas de
  // re-tap forcé.
  // Fiche « rangée » : on lit d'un coup d'œil (méthode + à retenir), une seule
  // action. La méthode se plie en sections quand la fiche est longue et
  // structurée (préfixes « Label — » présents dans les données, ex. C1h).
  function renderFiche() {
    const f = getFiche(code);
    if (!f) {
      view = "home";
      return render();
    }
    track("revision_conduite_fiche_open", { code });

    const steps = Array.isArray(f.methode) ? f.methode : [];
    const total = steps.length;
    const groups = groupSteps(steps);
    const grouped = useGrouped(steps, groups);
    // Étapes « propres » (préfixe de section retiré) : pour le jeu « remets dans
    // l'ordre », sinon les libellés de section donneraient l'ordre.
    const flatSteps = groups.flatMap((g) => g.steps);

    // Fiches longues structurées → affichage « mission » en étapes (DA Arène).
    // Là-bas, « lue » = mission TERMINÉE (markRead à la dernière étape), pas
    // juste ouverte — sinon la 2ᵉ visite sauterait le déroulé.
    if (grouped) return renderFicheMission(f, groups, flatSteps);

    markRead(code); // ouvrir la fiche = « lue » (alimente la progression du hub)
    track("revision_conduite_fiche_read", { code });

    // Étape éditoriale « Carnet » : gros numéro + texte, zéro carte ni ombre.
    const stepRow = (s, n) =>
      `<div class="rvc-step"><span class="rvc-step-n">${String(n).padStart(2, "0")}</span><div class="rvc-step-t">${esc(s)}</div></div>`;

    let methodeHtml = "";
    if (total) {
      // Liste à plat — les fiches structurées sont parties en « mission » plus haut.
      const rows = steps.map((s, i) => stepRow(s, i + 1)).join("");
      const range = total > 1 ? `01–${String(total).padStart(2, "0")}` : "01";
      methodeHtml = `<div class="rvc-lbl"><b>La méthode</b><span class="rvc-lbl-line"></span><span class="rvc-lbl-n">${range}</span></div>
        <div class="rvc-method">${rows}</div>`;
    }

    // « À retenir » : encadrés voyants avec pastille icône (repérables d'un
    // coup d'œil — la boîte auto en bleu, la plus demandée).
    const note = (cls, kicker, txt, icon) =>
      txt
        ? `<div class="rvc-note pg-loupe ${cls}"><span class="rvc-note-ic">${icon}</span><div><p class="rvc-note-k">${kicker}</p><p class="rvc-note-p">${esc(txt)}</p></div></div>`
        : "";
    const retenir =
      note("warn", "L’erreur à éviter", f.erreur, FSVG.warn) +
      note("why", "Pourquoi ça compte", f.pourquoi, FSVG.info) +
      note("bva", "En boîte auto", f.bva, FSVG.auto);
    const srcChaines = sourceChannels(f);
    const srcHtml = srcChaines.length
      ? `<p class="rvc-fsrc">↳ Vu chez de vrais moniteurs : ${srcChaines.map((s) => esc(s)).join(", ")}</p>`
      : "";

    root.innerHTML = `${STYLE}<div class="rvc rvc-detail">
      <div class="rvc-top">
        <button class="rvc-back" aria-label="Retour">←</button>
        <span class="rvc-fbadge">${esc(f.code)} · ${esc(f.competence)}</span>
      </div>
      <h1 class="rvc-ftitle">${esc(f.titre)}</h1>
      ${total ? `<p class="rvc-fmeta">${total} geste${total > 1 ? "s" : ""} · la méthode pas à pas</p>` : ""}

      ${methodeHtml}

      ${retenir ? `<div class="rvc-lbl"><b>À retenir</b><span class="rvc-lbl-line"></span></div>${retenir}` : ""}
      ${srcHtml}

      <div class="rvc-actbar">
        ${total >= 3 ? `<button class="rvc-act-ghost" data-order>${FSVG.shuffle}Remets dans l’ordre</button>` : ""}
        <button class="rvc-act-main" data-quiz>${FSVG.play}<span>Teste-toi</span></button>
      </div>
    </div>`;

    wireFiche(f, flatSteps);
  }

  function wireFiche(f, flatSteps) {
    root.querySelector(".rvc-back, .rvm-back").addEventListener("click", () => {
      view = "home";
      render();
    });
    root.querySelector("[data-order]")?.addEventListener("click", () => {
      orderPlaced = [];
      orderPool = (flatSteps && flatSteps.length ? flatSteps : f.methode || [])
        .map((t, i) => ({ i, t }))
        .sort(() => Math.random() - 0.5);
      view = "order";
      render();
    });
    root.querySelector("[data-quiz]")?.addEventListener("click", () => {
      focusId = null;
      startQuiz();
    });
  }

  // ── Fiche « Mission » : la méthode en étapes (une partie = une étape).
  // L'étape en cours est ouverte, les faites se replient (tap pour rouvrir),
  // les suivantes sont verrouillées. Le quiz se débloque à la fin. En
  // relecture (fiche déjà lue, ou mission terminée), tout est ouvert.
  function renderFicheMission(f, groups, flatSteps) {
    const parts = groups.map((g) => ({
      label: g.label || "Pour commencer",
      steps: g.steps,
    }));
    const totalParts = parts.length;

    // Reprise : étapes déjà lues (persisté). Fiche lue sous l'ANCIEN
    // affichage (rvc_read_v1 sans état d'étapes) = relecture → tout ouvert.
    const wasRead = !!loadRead()[f.code];
    const saved = loadParts()[f.code];
    const nDone =
      typeof saved === "number"
        ? Math.min(saved, totalParts)
        : wasRead
          ? totalParts
          : 0;
    const finie = nDone >= totalParts;

    const gesteRows = (p) =>
      p.steps
        .map(
          (s, i) =>
            `<div class="rvm-geste"><span class="n">${i + 1}</span><p>${esc(s)}</p></div>`,
        )
        .join("");

    const etapes = parts
      .map((p, i) => {
        const state = i < nDone ? "done" : i === nDone ? "cur" : "locked";
        const nG = p.steps.length;
        const meta = `${nG} geste${nG > 1 ? "s" : ""}`;
        const medal = state === "done" ? "✓" : String(i + 1);
        const st =
          state === "done" ? "FAIT" : state === "cur" ? "EN COURS" : "À VENIR";
        // done : gestes repliés (tap sur l'en-tête pour rouvrir) — sauf en
        // relecture, où tout est affiché d'emblée (pattern des fiches).
        const open = state === "cur" || finie;
        const next = parts[i + 1];
        const cta =
          state === "cur" && !finie
            ? `<button class="rvm-cta" data-part-done>${next ? `Étape lue → ${esc(next.label)}` : "Étape lue → au quiz !"}</button>`
            : "";
        const gestes =
          state === "locked"
            ? ""
            : `<div class="rvm-gestes" ${open ? "" : "hidden"}>${gesteRows(p)}${cta}</div>`;
        return `<section class="rvm-etape ${state}">
          <button class="rvm-eh" data-part="${i}" ${state === "locked" ? "disabled" : ""} aria-expanded="${open}"
            aria-label="${escAttr(`Étape ${i + 1} : ${p.label} (${st.toLowerCase()})`)}">
            <span class="rvm-medal" aria-hidden="true">${medal}</span>
            <span class="rvm-et"><b>${esc(p.label)}</b><span>${meta}</span></span>
            <span class="rvm-st">${st}</span>
          </button>
          ${gestes}
        </section>`;
      })
      .join("");

    const barSegs = parts
      .map((_, i) => `<i class="${i < nDone ? "done" : ""}"></i>`)
      .join("");
    const barTxt = finie
      ? `<b>${totalParts}/${totalParts} étapes</b> — mission accomplie ✓`
      : `<b>${nDone}/${totalParts} étapes</b> — la suite : ${esc(parts[nDone].label)}`;

    // Fin de mission : « à retenir », sources et actions (quiz débloqué).
    const note = (cls, kicker, txt) =>
      txt
        ? `<div class="rvm-note ${cls}"><b>${kicker}</b><p>${esc(txt)}</p></div>`
        : "";
    const srcChaines = sourceChannels(f);
    const outro = finie
      ? `${note("warn", "L’erreur à éviter", f.erreur)}
         ${note("why", "Pourquoi ça compte", f.pourquoi)}
         ${note("bva", "En boîte auto", f.bva)}
         ${srcChaines.length ? `<p class="rvm-src">↳ Vu chez de vrais moniteurs : ${srcChaines.map((s) => esc(s)).join(", ")}</p>` : ""}
         <div class="rvm-acts">
           ${flatSteps.length >= 3 ? `<button class="rvm-ghost" data-order>${FSVG.shuffle}Remets dans l’ordre</button>` : ""}
           <button class="rvm-main" data-quiz>${FSVG.play}<span>Teste-toi</span></button>
         </div>`
      : `<p class="rvm-hint">Le quiz se débloque à la fin de la mission.</p>`;

    root.innerHTML = `${STYLE}<div class="rvm">
      <div class="rvm-top">
        <button class="rvm-back" aria-label="Retour">←</button>
        <span class="rvm-badge">${esc(f.code)} · ${esc(f.competence)}</span>
      </div>
      <h1 class="rvm-title">${esc(f.titre)}</h1>
      <p class="rvm-sub">Ta mission : ${totalParts} étapes, ${flatSteps.length} gestes. Le quiz t'attend au bout.</p>
      <div class="rvm-bar" aria-hidden="true">${barSegs}</div>
      <p class="rvm-bar-t">${barTxt}</p>
      ${etapes}
      ${outro}
    </div>`;

    wireFiche(f, flatSteps);
    wireFicheMission(f, totalParts, nDone);
  }

  function wireFicheMission(f, totalParts, nDone) {
    // Replier / rouvrir une étape déjà lue (l'étape en cours reste ouverte).
    root.querySelectorAll(".rvm-etape.done [data-part]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const box = btn.parentElement.querySelector(".rvm-gestes");
        if (!box) return;
        const willOpen = box.hasAttribute("hidden");
        box.toggleAttribute("hidden", !willOpen);
        btn.setAttribute("aria-expanded", String(willOpen));
      }),
    );

    // « Étape lue » → étape suivante (ou fin de mission → quiz débloqué).
    root.querySelector("[data-part-done]")?.addEventListener("click", () => {
      haptic("success");
      const next = nDone + 1;
      savePartsDone(f.code, next);
      track("revision_conduite_part_done", {
        code: f.code,
        part: next,
        total: totalParts,
      });
      if (next >= totalParts) {
        // Mission terminée = fiche « lue » (progression du hub + relecture).
        markRead(f.code);
        track("revision_conduite_fiche_read", { code: f.code });
      }
      view = "fiche";
      render();
      requestAnimationFrame(() => {
        const cible = root.querySelector(".rvm-etape.cur, .rvm-acts");
        cible?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "center",
        });
      });
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
