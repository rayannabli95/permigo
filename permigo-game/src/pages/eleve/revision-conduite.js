// ═══════════════════════════════════════════════════════════════
// Élève — « Révision conduite »
// Le différenciateur PermiGo : on révise le GESTE de conduite (pas le code),
// entre les leçons. Données = src/data/fiches-conduite.js (vécu de vrais
// moniteurs). Mécanique : fiche → 3 questions en récupération active (flashcard).
//
// v1 100% front + localStorage (aucune table DB). Le pilotage par le moniteur
// (« Avant/Après ta leçon ») viendra dans une 2e couche (nécessite la DB).
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { navigate } from "@/router.js";
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { haptic } from "@/utils/haptic.js";
import { mountPremiumQuiz } from "@/components/eleve/premium-quiz.js";
import { quizByCode } from "@/data/quiz-conduite.js";
import { track } from "@/services/analytics.js";
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

const STYLE = `<style>
.rvc { max-width: 480px; margin: 0 auto; padding: 0 16px calc(110px + env(safe-area-inset-bottom));
  background: var(--bg); color: var(--ink); font-family: 'Inter', sans-serif; }
.rvc-top { display:flex; align-items:center; gap:10px; padding:16px 0 8px; }
.rvc-back { width:38px; height:38px; border-radius:11px; border:0; cursor:pointer;
  background: var(--su, #fff); color: var(--ink); font-size:20px; line-height:1;
  box-shadow: 0 1px 4px rgba(0,0,0,.08); flex-shrink:0; }
.rvc-back:active { transform: scale(0.95); }
.rvc-h1 { font: 800 22px/1.1 'Plus Jakarta Sans', sans-serif; letter-spacing:-.025em; margin:0; }
.rvc-sub { color: var(--mu, #64748b); font-size:13px; margin:2px 0 0; }

/* Carte « défi du jour » — premium */
.rvc-pf { position:relative; overflow:hidden; margin:14px 0 18px; border-radius:22px; padding:20px;
  background: linear-gradient(140deg, var(--adk, #4f46e5) 0%, var(--a, #6366f1) 55%, var(--a-lt, #818cf8) 100%); color:#fff;
  box-shadow: 0 16px 36px -10px color-mix(in srgb, var(--a, #6366f1) 55%, transparent), inset 0 1px 0 rgba(255,255,255,.22); }
.rvc-pf-glow { position:absolute; pointer-events:none; top:-40%; right:-20%; width:220px; height:220px; border-radius:50%;
  background: radial-gradient(circle, rgba(255,255,255,.30), transparent 65%); }
.rvc-pf-head { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:10px; }
.rvc-pf-k { font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.07em; opacity:.95; }
.rvc-pf-chrono { flex-shrink:0; font:800 11px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:.02em;
  background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.32); border-radius:999px; padding:5px 10px; }
.rvc-pf-t { position:relative; z-index:1; font: 800 22px/1.15 'Plus Jakarta Sans', sans-serif; letter-spacing:-.01em; margin:10px 0 3px; }
.rvc-pf-c { position:relative; z-index:1; font-size:13.5px; line-height:1.4; opacity:.94; }
.rvc-pf-btn { position:relative; z-index:1; margin-top:16px; width:100%; border:0; border-radius:14px; padding:15px;
  font:800 15.5px 'Plus Jakarta Sans',sans-serif; cursor:pointer; background:var(--su); color:var(--a-txt);
  box-shadow: 0 6px 16px -4px rgba(15,23,42,.28); transition: transform .12s ease, box-shadow .12s ease; }
.rvc-pf-btn:active { transform: scale(0.98); box-shadow: 0 2px 8px -4px rgba(15,23,42,.24); }

/* Carte « Trouve la faute » — premium (ambre/orange, distincte) */
.rvc-faute2 { display:flex; align-items:center; gap:14px; width:100%; text-align:left; cursor:pointer;
  border:0; border-radius:18px; padding:16px; margin:0 0 18px; color:#fff;
  background: linear-gradient(135deg, #9a3412 0%, #ea580c 70%, #f59e0b 100%);
  box-shadow: 0 12px 28px -10px rgba(234,88,12,.5), inset 0 1px 0 rgba(255,255,255,.2);
  -webkit-tap-highlight-color: transparent; transition: transform .12s ease; }
.rvc-faute2:active { transform: scale(0.985); }
.rvc-faute2-ico { flex-shrink:0; width:46px; height:46px; border-radius:14px; display:grid; place-items:center;
  font-size:24px; background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.28); }
.rvc-faute2-txt { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.rvc-faute2-t { font:800 17px/1.15 'Plus Jakarta Sans',sans-serif; letter-spacing:-.01em; }
.rvc-faute2-s { font-size:12.5px; line-height:1.35; opacity:.92; }
.rvc-faute2-arr { flex-shrink:0; display:inline-flex; align-items:center; justify-content:center;
  width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,.2); font-size:18px; font-weight:800; }
@media (prefers-reduced-motion: reduce) {
  .rvc-pf-btn, .rvc-faute2 { transition:none; }
}

/* Mondes + compétences */
.rvc-monde { margin-bottom:18px; }
.rvc-monde-h { font:800 15px 'Plus Jakarta Sans',sans-serif; margin:0 0 2px; }
.rvc-monde-s { color: var(--mu,#64748b); font-size:12px; margin:0 0 10px; }
.rvc-list { display:flex; flex-direction:column; gap:8px; }
.rvc-card { display:flex; align-items:center; gap:12px; text-align:left; width:100%;
  border:0; cursor:pointer; background: var(--su,#fff); color:var(--ink);
  border-radius:14px; padding:13px 14px; box-shadow:0 1px 4px rgba(0,0,0,.06);
  transition: transform .15s cubic-bezier(.23,1,.32,1); }
.rvc-card:active { transform: scale(0.985); }
.rvc-card-tit { font:700 14px/1.2 'Plus Jakarta Sans',sans-serif; flex:1; }
.rvc-chk { width:20px; height:20px; border-radius:50%; flex-shrink:0; font-size:12px;
  display:flex; align-items:center; justify-content:center; }
.rvc-chk.on { background:#10b981; color:#fff; }
.rvc-chk.off { border:2px solid var(--bo3,#e2e8f0); color:transparent; }

/* Fiche détail */
.rvc-fiche-tag { display:inline-block; font-size:11px; font-weight:700; color:var(--a,#6366f1);
  background: color-mix(in srgb, var(--a,#6366f1) 12%, transparent); padding:3px 9px; border-radius:999px; }
.rvc-block { margin:16px 0; }
.rvc-block-h { font:800 13px 'Plus Jakarta Sans',sans-serif; text-transform:uppercase;
  letter-spacing:.05em; color:var(--mu,#64748b); margin:0 0 8px; }
.rvc-steps { margin:0; padding:0; list-style:none; counter-reset: s; display:flex; flex-direction:column; gap:8px; }
.rvc-steps li { counter-increment:s; position:relative; padding:10px 12px 10px 40px;
  background: var(--su,#fff); border-radius:12px; font-size:14px; line-height:1.4;
  box-shadow:0 1px 3px rgba(0,0,0,.05); }
.rvc-steps li::before { content: counter(s); position:absolute; left:10px; top:10px;
  width:22px; height:22px; border-radius:50%; background:var(--a,#6366f1); color:#fff;
  font:700 12px 'IBM Plex Mono',monospace; display:flex; align-items:center; justify-content:center; }
.rvc-why, .rvc-err, .rvc-bva { border-radius:12px; padding:12px 14px; font-size:14px; line-height:1.45; }
.rvc-why { background: color-mix(in srgb, var(--a) 8%, transparent); }
.rvc-err { background: color-mix(in srgb, #f59e0b 12%, transparent); }
.rvc-bva { background: color-mix(in srgb, #06b6d4 10%, transparent); }
.rvc-src { font-size:11px; color:var(--mu,#94a3b8); margin-top:14px; }
.rvc-go { position:sticky; bottom: calc(16px + env(safe-area-inset-bottom)); width:100%;
  border:0; border-radius:14px; padding:15px; cursor:pointer; margin-top:18px;
  font:800 16px 'Plus Jakarta Sans',sans-serif; color:#fff; background:var(--a,#6366f1);
  box-shadow:0 8px 20px color-mix(in srgb, var(--a,#6366f1) 40%, transparent); }
.rvc-go:active { transform: scale(0.98); }

/* Flashcards */
.rvc-prog { font:700 12px 'IBM Plex Mono',monospace; color:var(--mu,#64748b); text-align:center; margin:10px 0 14px; }
.rvc-q { background:var(--su,#fff); border-radius:18px; padding:22px 18px; min-height:120px;
  display:flex; align-items:center; box-shadow:0 2px 10px rgba(0,0,0,.07);
  font:700 18px/1.35 'Plus Jakarta Sans',sans-serif; }
.rvc-a { margin-top:14px; border-radius:16px; padding:18px; background: color-mix(in srgb,#10b981 10%, transparent);
  animation: rvcrise .25s cubic-bezier(.23,1,.32,1); }
@keyframes rvcrise { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
.rvc-a-r { font:800 16px 'Plus Jakarta Sans',sans-serif; color:var(--gr-txt,#047857); }
.rvc-a-e { font-size:14px; line-height:1.45; margin-top:6px; color:var(--ink); }
.rvc-done { text-align:center; padding:40px 16px; }
.rvc-done-e { font-size:54px; animation: rvcrise .35s cubic-bezier(.23,1,.32,1) both; }
.rvc-done-t { font:800 22px 'Plus Jakarta Sans',sans-serif; margin:10px 0 4px; }
.rvc-focus { margin:0 0 18px; border:2px solid color-mix(in srgb,#f59e0b 45%, transparent); border-radius:16px; padding:14px; background: color-mix(in srgb,#f59e0b 7%, transparent); }
.rvc-focus-k { font:800 12px 'Plus Jakarta Sans',sans-serif; text-transform:uppercase; letter-spacing:.05em; color:var(--am-txt,#b45309); margin-bottom:6px; }
.rvc-focus-row { display:flex; align-items:center; gap:10px; width:100%; text-align:left; border:0; cursor:pointer; background:var(--su,#fff); border-radius:12px; padding:12px; margin-top:8px; box-shadow:0 1px 3px rgba(0,0,0,.06); }
.rvc-focus-row:active { transform: scale(0.985); }
.rvc-focus-t { font:700 14px/1.25 'Plus Jakarta Sans',sans-serif; flex:1; }
.rvc-focus-n { font-size:12px; color:var(--mu,#64748b); }
.rvc-focus-go { font:700 13px 'Plus Jakarta Sans',sans-serif; color:var(--am-txt,#b45309); white-space:nowrap; }
.rvc-mlabel { font:800 12px 'Plus Jakarta Sans',sans-serif; text-transform:uppercase; letter-spacing:.05em; color:var(--mu,#94a3b8); margin:6px 0 10px; }
.rvc-mcard { display:flex; align-items:center; gap:12px; width:100%; text-align:left; border:0; cursor:pointer; background:var(--su,#fff); color:var(--ink); border-radius:14px; padding:15px 14px; margin-bottom:10px; box-shadow:0 1px 4px rgba(0,0,0,.06); transition: transform .15s cubic-bezier(.23,1,.32,1); }
.rvc-mcard:active { transform: scale(0.985); }
.rvc-mnum { width:30px; height:30px; border-radius:9px; flex-shrink:0; background:var(--a,#6366f1); color:#fff; font:800 15px 'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; justify-content:center; }
.rvc-mcard-t { font:700 15px 'Plus Jakarta Sans',sans-serif; flex:1; }
.rvc-mcard-done { font:700 12px 'IBM Plex Mono',monospace; color:var(--gr-txt,#10b981); }
.rvc-mcard-go { font-size:22px; color:var(--mu,#cbd5e1); }
.rvc-go2 { width:100%; border:2px solid var(--a,#6366f1); background:transparent; color:var(--a,#6366f1); border-radius:14px; padding:13px; cursor:pointer; margin-top:18px; font:800 15px 'Plus Jakarta Sans',sans-serif; }
.rvc-go2:active { transform: scale(0.98); }
.rvc-ohint { color:var(--mu,#64748b); font-size:13px; margin:2px 0 14px; }
.rvc-oslot { display:flex; align-items:center; gap:10px; padding:11px 12px; border-radius:12px; margin-bottom:8px; background: color-mix(in srgb,#10b981 12%, transparent); font-size:14px; line-height:1.35; animation: rvcrise .25s cubic-bezier(.23,1,.32,1); }
.rvc-onum { width:22px; height:22px; border-radius:50%; background:#10b981; color:#fff; font:700 12px 'IBM Plex Mono',monospace; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.rvc-opool { display:flex; flex-direction:column; gap:8px; margin-top:6px; }
.rvc-ochip { width:100%; text-align:left; border:1px solid var(--bo3,#e2e8f0); background:var(--su,#fff); color:var(--ink); border-radius:12px; padding:12px; cursor:pointer; font:600 14px/1.35 'Inter',sans-serif; transition: transform .12s ease-out; }
.rvc-ochip:active { transform: scale(0.985); }
.rvc-shake { animation: rvcshake .35s; border-color:#ef4444 !important; }
@keyframes rvcshake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }

/* ───── Fiche « Coach » : lecture engageante, révélation progressive ───── */
.rvc-fbadge { font:600 11px 'IBM Plex Mono',monospace; letter-spacing:.04em; text-transform:uppercase;
  color:var(--a,#6366f1); background:color-mix(in srgb,var(--a,#6366f1) 12%,transparent);
  border:1px solid color-mix(in srgb,var(--a,#6366f1) 22%,transparent); padding:6px 11px; border-radius:999px; margin-left:auto; }
.rvc-ftitle { font:800 24px/1.2 'Plus Jakarta Sans',sans-serif; letter-spacing:-.01em; margin:12px 0 0; color:var(--ink); }

.rvc-coach { position:relative; overflow:hidden; margin:16px 0 0; border-radius:22px; padding:17px 17px 18px; color:#fff;
  background:linear-gradient(135deg,var(--a,#6366f1) 0%,var(--adk,#4f46e5) 60%,#6d28d9 100%);
  box-shadow:0 14px 30px -14px color-mix(in srgb,var(--adk,#4f46e5) 65%,transparent); }
.rvc-coach::after { content:""; position:absolute; right:-40px; top:-50px; width:150px; height:150px; border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.22),transparent 70%); pointer-events:none; }
.rvc-coach-row { position:relative; z-index:1; display:flex; gap:12px; align-items:flex-start; }
.rvc-coach-av { width:44px; height:44px; border-radius:14px; flex:none; display:grid; place-items:center;
  background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.34); }
.rvc-coach-av svg { width:23px; height:23px; }
.rvc-coach-tag { font:600 10px 'IBM Plex Mono',monospace; letter-spacing:.14em; text-transform:uppercase; color:#dcddff; margin-bottom:3px; }
.rvc-coach-msg { font:600 15px/1.42 'Plus Jakarta Sans',sans-serif; }
.rvc-coach-msg b { font-weight:800; }
.rvc-prog { position:relative; z-index:1; margin-top:15px; display:flex; align-items:center; gap:11px; }
.rvc-prog-bar { flex:1; height:8px; border-radius:99px; background:rgba(255,255,255,.22); overflow:hidden; }
.rvc-prog-fill { height:100%; width:0; border-radius:99px; background:linear-gradient(90deg,#fff,#c7d2fe); transition:width .5s cubic-bezier(.4,0,.2,1); }
.rvc-prog-txt { font:600 12px 'IBM Plex Mono',monospace; color:#eceaff; min-width:30px; text-align:right; }

.rvc-sect { display:flex; align-items:center; gap:9px; margin:22px 0 2px; }
.rvc-sect i { width:7px; height:7px; border-radius:50%; background:var(--a,#6366f1); }
.rvc-sect span { font:600 11px 'IBM Plex Mono',monospace; letter-spacing:.12em; text-transform:uppercase; color:var(--mu,#94a3b8); }

.rvc-msteps { display:flex; flex-direction:column; gap:11px; margin-top:10px; }
.rvc-step { display:flex; gap:13px; align-items:flex-start; background:var(--su,#fff); border:1px solid var(--bo3,#e2e8f0);
  border-radius:18px; padding:14px 15px; box-shadow:0 6px 18px -14px rgba(40,30,90,.4); }
.rvc-step.is-hidden { display:none; }
.rvc-step.is-reveal { animation:rvcreveal .45s cubic-bezier(.16,.84,.44,1) both; }
@keyframes rvcreveal { from{opacity:0; transform:translateY(14px) scale(.98);} to{opacity:1; transform:none;} }
.rvc-step.is-current { border-color:color-mix(in srgb,var(--a,#6366f1) 40%,transparent);
  box-shadow:0 12px 26px -16px color-mix(in srgb,var(--adk,#4f46e5) 55%,transparent); }
.rvc-step-n { width:33px; height:33px; flex:none; border-radius:11px; display:grid; place-items:center;
  background:color-mix(in srgb,var(--a,#6366f1) 12%,transparent); color:var(--adk,#4f46e5);
  border:1px solid color-mix(in srgb,var(--a,#6366f1) 22%,transparent); font:700 16px 'Baloo 2',cursive; }
.rvc-step-n svg { display:none; width:17px; height:17px; }
.rvc-step.is-done .rvc-step-n { background:linear-gradient(135deg,var(--a,#6366f1),var(--adk,#4f46e5)); color:#fff; border-color:transparent; }
.rvc-step.is-done .rvc-step-n b { display:none; }
.rvc-step.is-done .rvc-step-n svg { display:block; }
.rvc-step-t { font:400 14.5px/1.5 'Inter',sans-serif; color:var(--ink); padding-top:4px; }

.rvc-next { margin-top:16px; }
.rvc-next-btn { width:100%; border:0; border-radius:16px; padding:16px; cursor:pointer;
  font:700 15.5px 'Plus Jakarta Sans',sans-serif; color:#fff; display:flex; align-items:center; justify-content:center; gap:9px;
  background:linear-gradient(135deg,var(--a,#6366f1),var(--adk,#4f46e5));
  box-shadow:0 12px 24px -12px color-mix(in srgb,var(--adk,#4f46e5) 70%,transparent); transition:transform .12s ease; }
.rvc-next-btn:active { transform:scale(.975); }
.rvc-next-btn svg { width:18px; height:18px; }
.rvc-hint2 { text-align:center; font:500 12px 'IBM Plex Mono',monospace; color:var(--mu,#94a3b8); margin-top:9px; }

.rvc-finale { display:none; }
.rvc-finale.on { display:block; animation:rvcreveal .5s ease both; }
.rvc-bravo { display:flex; gap:12px; align-items:center; margin-top:16px; border-radius:18px; padding:15px 16px;
  background:color-mix(in srgb,#10b981 12%,transparent); border:1px solid color-mix(in srgb,#10b981 28%,transparent); }
.rvc-bravo-ic { width:40px; height:40px; flex:none; border-radius:12px; display:grid; place-items:center;
  background:linear-gradient(135deg,#22c55e,#16a34a); box-shadow:0 8px 18px -10px rgba(22,163,74,.7); }
.rvc-bravo-ic svg { width:21px; height:21px; color:#fff; }
.rvc-bravo h3 { font:800 15px 'Plus Jakarta Sans',sans-serif; color:var(--gr-txt,#047857); }
.rvc-bravo p { font-size:12.5px; line-height:1.4; color:var(--gr-txt,#047857); opacity:.85; margin-top:2px; }

.rvc-icard { margin-top:13px; border-radius:18px; padding:15px 16px; border:1px solid var(--bo3,#e2e8f0);
  background:var(--su,#fff); box-shadow:0 6px 18px -16px rgba(40,30,90,.5); }
.rvc-icard-h { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.rvc-icard-ic { width:33px; height:33px; flex:none; border-radius:11px; display:grid; place-items:center; }
.rvc-icard-ic svg { width:18px; height:18px; }
.rvc-icard-h b { font:700 14.5px 'Plus Jakarta Sans',sans-serif; }
.rvc-icard p { font:400 14px/1.55 'Inter',sans-serif; color:var(--ink); }
.rvc-icard.why .rvc-icard-ic { background:color-mix(in srgb,var(--a,#6366f1) 14%,transparent); color:var(--adk,#4f46e5); }
.rvc-icard.why .rvc-icard-h b { color:var(--ink); }
.rvc-icard.trap { background:color-mix(in srgb,#f59e0b 12%,transparent); border-color:color-mix(in srgb,#f59e0b 30%,transparent); }
.rvc-icard.trap .rvc-icard-ic { background:color-mix(in srgb,#f59e0b 22%,transparent); color:#d97706; }
.rvc-icard.trap .rvc-icard-h b { color:var(--am-txt,#b45309); }
.rvc-icard.bva { background:color-mix(in srgb,#06b6d4 10%,transparent); border-color:color-mix(in srgb,#06b6d4 26%,transparent); }
.rvc-icard.bva .rvc-icard-ic { background:color-mix(in srgb,#06b6d4 20%,transparent); color:#0891b2; }
.rvc-icard.bva .rvc-icard-h b { color:#0e7490; }
.rvc-fsrc { display:flex; align-items:center; gap:8px; margin-top:14px; font-size:12px; font-style:italic; color:var(--mu,#94a3b8); }
.rvc-fsrc svg { width:15px; height:15px; color:var(--a-lt,#818cf8); flex:none; }

.rvc-actbar { position:sticky; bottom:calc(13px + env(safe-area-inset-bottom)); display:flex; gap:11px; margin-top:22px; padding:8px 0;
  background:linear-gradient(to top,var(--bg) 70%,transparent); }
.rvc-act-ghost { flex:none; border:1px solid var(--bo3,#e2e8f0); background:var(--su,#fff); color:var(--ink); border-radius:15px;
  padding:14px 15px; cursor:pointer; font:700 13.5px 'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; gap:8px;
  box-shadow:0 6px 16px -12px rgba(40,30,90,.4); transition:transform .12s ease; }
.rvc-act-ghost svg { width:17px; height:17px; color:var(--a,#6366f1); }
.rvc-act-ghost:active { transform:scale(.97); }
.rvc-act-main { flex:1; border:0; border-radius:15px; cursor:pointer; color:#fff;
  font:800 15px 'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:9px;
  background:linear-gradient(135deg,var(--a,#6366f1),var(--adk,#4f46e5));
  box-shadow:0 14px 26px -12px color-mix(in srgb,var(--adk,#4f46e5) 75%,transparent); transition:transform .12s ease,opacity .3s ease; }
.rvc-act-main:active { transform:scale(.97); }
.rvc-act-main svg { width:18px; height:18px; }
.rvc-act-main.locked { opacity:.45; pointer-events:none; }
.rvc-act-main .lock { display:none; }
.rvc-act-main.locked .lock { display:block; }
.rvc-act-main.locked .go { display:none; }

@media (prefers-reduced-motion: reduce) { .rvc *, .rvc *::before { transition:none !important; animation:none !important; } }
</style>`;

// Pictos SVG (sobres, mono-trait) réutilisés par la fiche « Coach ».
const FSVG = {
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16l-4.9 2.6.9-5.5-4-3.9 5.5-.8z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  warn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>`,
  auto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg>`,
  video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m23 7-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  shuffle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>`,
  lock: `<svg class="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  play: `<svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>`,
};

export async function mount(root, param) {
  track("page_view", { page: "revision-conduite" });

  // Garde-fou : si les données ne sont pas chargées (build/JSON), on n'explose pas.
  if (!FICHES.length) {
    root.innerHTML = `${STYLE}<div class="rvc"><div class="rvc-top">
      <button class="rvc-back" aria-label="Retour">←</button>
      <h1 class="rvc-h1">Révise ta conduite</h1></div>
      <p class="rvc-sub" style="margin-top:20px">Le contenu arrive très vite. Reviens dans un instant 👀</p></div>`;
    root
      .querySelector(".rvc-back")
      ?.addEventListener("click", () => navigate("#/"));
    return;
  }

  // Deep-link : #/revision-conduite/{code} (ex. depuis « Ton centre ») ouvre
  // directement la fiche de la compétence.
  const deep = param && getFiche(param) ? param : null;
  let view = deep ? "fiche" : "home";
  let code = deep;
  let qi = 0;
  let revealed = false;
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
    const revised = loadRevised();
    const items = fichesByMonde(m.n)
      .map((f) => {
        const on = revisedToday(f.code, revised);
        return `<button class="rvc-card" data-code="${esc(f.code)}">
            <span class="rvc-card-tit">${esc(f.titre)}</span>
            <span class="rvc-chk ${on ? "on" : "off"}">${on ? "✓" : ""}</span>
          </button>`;
      })
      .join("");
    root.innerHTML = `${STYLE}<div class="rvc">
      <div class="rvc-top">
        <button class="rvc-back" aria-label="Retour">←</button>
        <h1 class="rvc-h1">${esc(m.nom)}</h1>
      </div>
      <div class="rvc-list">${items}</div>
    </div>`;
    root.querySelector(".rvc-back").addEventListener("click", () => {
      view = "home";
      render();
    });
    root.querySelectorAll(".rvc-card").forEach((b) =>
      b.addEventListener("click", () => {
        code = b.getAttribute("data-code");
        focusId = null;
        view = "fiche";
        render();
      }),
    );
  }

  function renderHome() {
    const revised = loadRevised();
    const pf = pointFaible(revised);
    const mondeCards = MONDES.map((m) => {
      const total = fichesByMonde(m.n).length;
      const done = fichesByMonde(m.n).filter((f) =>
        revisedToday(f.code, revised),
      ).length;
      return `<button class="rvc-mcard" data-monde="${m.n}">
        <span class="rvc-mnum">${m.n}</span>
        <span class="rvc-mcard-t">${esc(m.nom)}</span>
        ${done ? `<span class="rvc-mcard-done">${done}/${total}</span>` : ""}
        <span class="rvc-mcard-go">›</span>
      </button>`;
    }).join("");

    const focusHtml = focuses.length
      ? `<div class="rvc-focus"><div class="rvc-focus-k">🎯 Ton moniteur t'a ciblé ça</div>${focuses
          .map((x) => {
            const ff = getFiche(x.competence_code);
            const t = ff ? ff.titre : x.competence_code;
            return `<button class="rvc-focus-row" data-focus="${esc(x.id)}" data-fcode="${esc(x.competence_code)}"><span class="rvc-focus-t">${esc(t)}</span>${x.note ? `<span class="rvc-focus-n">${esc(x.note)}</span>` : ""}<span class="rvc-focus-go">J'm'y mets →</span></button>`;
          })
          .join("")}</div>`
      : "";

    root.innerHTML = `${STYLE}<div class="rvc">
      <div class="rvc-top">
        <button class="rvc-back" aria-label="Retour à l'accueil">←</button>
        <h1 class="rvc-h1">Révise ta conduite</h1>
      </div>
      ${
        pf
          ? `<div class="rvc-pf">
        <div class="rvc-pf-glow" aria-hidden="true"></div>
        <div class="rvc-pf-head">
          <span class="rvc-pf-k">⚡ Ton défi du jour</span>
          <span class="rvc-pf-chrono">1 min chrono</span>
        </div>
        <div class="rvc-pf-t">${esc(pf.titre)}</div>
        <div class="rvc-pf-c">3 questions ciblées sur ton point faible du moment.</div>
        <button class="rvc-pf-btn" data-pf="${esc(pf.code)}">Relever le défi →</button>
      </div>`
          : ""
      }
      ${focusHtml}
      <button class="rvc-faute2" data-faute>
        <span class="rvc-faute2-ico" aria-hidden="true">⚠️</span>
        <span class="rvc-faute2-txt">
          <span class="rvc-faute2-t">Trouve la faute</span>
          <span class="rvc-faute2-s">Repère la faute éliminatoire avant le jour J</span>
        </span>
        <span class="rvc-faute2-arr" aria-hidden="true">›</span>
      </button>
      <div class="rvc-mlabel">Par thème</div>
      ${mondeCards}
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
    root.querySelectorAll("[data-monde]").forEach((b) =>
      b.addEventListener("click", () => {
        mondeN = Number(b.getAttribute("data-monde"));
        view = "monde";
        render();
      }),
    );
    root.querySelectorAll("[data-focus]").forEach((b) =>
      b.addEventListener("click", () => {
        focusId = b.getAttribute("data-focus");
        code = b.getAttribute("data-fcode");
        track("revision_conduite_focus_start", { code });
        startQuiz();
      }),
    );
    root.querySelectorAll(".rvc-card").forEach((b) =>
      b.addEventListener("click", () => {
        code = b.getAttribute("data-code");
        view = "fiche";
        render();
      }),
    );
  }

  // Fiche « Coach » : un coach déroule la méthode pas à pas (engagement par
  // l'interaction). Le quiz se débloque une fois la méthode lue. En relecture
  // (déjà déroulée) ou en mouvement réduit, tout s'affiche d'emblée — pas de
  // re-tap forcé.
  function renderFiche() {
    const f = getFiche(code);
    if (!f) {
      view = "home";
      return render();
    }
    track("revision_conduite_fiche_open", { code });
    const steps = Array.isArray(f.methode) ? f.methode : [];
    const total = steps.length;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealAll = reduced || !!loadRead()[code] || total === 0;

    // Phrase d'intro du coach : « Je te montre comment <titre minuscule>. »
    const titreFlow = f.titre
      ? f.titre.charAt(0).toLowerCase() + f.titre.slice(1)
      : "";

    const stepsHtml = steps
      .map(
        (s, i) => `
        <div class="rvc-step ${i === 0 ? "is-current" : "is-hidden"}" data-step="${i + 1}">
          <div class="rvc-step-n"><b>${i + 1}</b>${FSVG.check}</div>
          <div class="rvc-step-t">${esc(s)}</div>
        </div>`,
      )
      .join("");

    const whyCard = f.pourquoi
      ? `<div class="rvc-icard why"><div class="rvc-icard-h"><span class="rvc-icard-ic">${FSVG.info}</span><b>Pourquoi ça compte</b></div><p>${esc(f.pourquoi)}</p></div>`
      : "";
    const trapCard = f.erreur
      ? `<div class="rvc-icard trap"><div class="rvc-icard-h"><span class="rvc-icard-ic">${FSVG.warn}</span><b>Le piège</b></div><p>${esc(f.erreur)}</p></div>`
      : "";
    const bvaCard = f.bva
      ? `<div class="rvc-icard bva"><div class="rvc-icard-h"><span class="rvc-icard-ic">${FSVG.auto}</span><b>En boîte auto</b></div><p>${esc(f.bva)}</p></div>`
      : "";
    const srcHtml =
      Array.isArray(f.sources) && f.sources.length
        ? `<div class="rvc-fsrc">${FSVG.video}<span>Vu chez de vrais moniteurs : ${f.sources.map((s) => esc(s)).join(", ")}</span></div>`
        : "";

    root.innerHTML = `${STYLE}<div class="rvc">
      <div class="rvc-top">
        <button class="rvc-back" aria-label="Retour">←</button>
        <span class="rvc-fbadge">${esc(f.code)} · ${esc(f.competence)}</span>
      </div>
      <h1 class="rvc-ftitle">${esc(f.titre)}</h1>

      ${
        total
          ? `<div class="rvc-coach">
        <div class="rvc-coach-row">
          <div class="rvc-coach-av">${FSVG.star}</div>
          <div>
            <div class="rvc-coach-tag">Ton coach</div>
            <div class="rvc-coach-msg">Je te montre comment <b>${esc(titreFlow)}</b>. On y va pas à pas — prêt&nbsp;?</div>
          </div>
        </div>
        <div class="rvc-prog">
          <div class="rvc-prog-bar"><div class="rvc-prog-fill"></div></div>
          <div class="rvc-prog-txt">0/${total}</div>
        </div>
      </div>

      <div class="rvc-sect"><i></i><span>La méthode</span></div>
      <div class="rvc-msteps">${stepsHtml}</div>
      <div class="rvc-next">
        <button class="rvc-next-btn"><span class="rvc-next-lbl">Étape suivante</span>${FSVG.arrow}</button>
        <div class="rvc-hint2">Tape la carte ou le bouton pour avancer</div>
      </div>`
          : ""
      }

      <div class="rvc-finale">
        ${total ? `<div class="rvc-bravo"><div class="rvc-bravo-ic">${FSVG.check}</div><div><h3>Bien joué&nbsp;!</h3><p>Tu as la méthode complète. Voici ce qu'il faut retenir.</p></div></div>` : ""}
        ${whyCard}${trapCard}${bvaCard}${srcHtml}
      </div>

      <div class="rvc-actbar">
        ${total >= 3 ? `<button class="rvc-act-ghost" data-order>${FSVG.shuffle}Remets dans l'ordre</button>` : ""}
        <button class="rvc-act-main locked" data-quiz>${FSVG.lock}${FSVG.play}<span>Lance le quiz</span></button>
      </div>
    </div>`;

    wireFiche(f, total, revealAll, reduced);
  }

  function wireFiche(f, total, revealAll, reduced) {
    root.querySelector(".rvc-back").addEventListener("click", () => {
      view = "home";
      render();
    });

    const mainBtn = root.querySelector("[data-quiz]");
    const fillEl = root.querySelector(".rvc-prog-fill");
    const ptxtEl = root.querySelector(".rvc-prog-txt");
    const finaleEl = root.querySelector(".rvc-finale");
    const nextZone = root.querySelector(".rvc-next");
    const stepEls = Array.prototype.slice.call(
      root.querySelectorAll(".rvc-step"),
    );
    let current = 1;

    function setProgress(n) {
      if (fillEl) fillEl.style.width = total ? (n / total) * 100 + "%" : "100%";
      if (ptxtEl) ptxtEl.textContent = n + "/" + total;
    }
    function unlockEnd() {
      if (nextZone) nextZone.style.display = "none";
      if (finaleEl) finaleEl.classList.add("on");
      if (mainBtn) mainBtn.classList.remove("locked");
    }
    function finish() {
      unlockEnd();
      markRead(code);
      track("revision_conduite_fiche_read", { code });
      if (finaleEl)
        setTimeout(
          () =>
            finaleEl.scrollIntoView({
              behavior: reduced ? "auto" : "smooth",
              block: "start",
            }),
          120,
        );
    }
    function advance() {
      const cur = stepEls[current - 1];
      if (cur) {
        cur.classList.remove("is-current");
        cur.classList.add("is-done");
      }
      if (current >= total) {
        setProgress(total);
        haptic("success");
        finish();
        return;
      }
      current++;
      const nx = stepEls[current - 1];
      if (nx) {
        nx.classList.remove("is-hidden");
        if (!reduced) nx.classList.add("is-reveal");
        nx.classList.add("is-current");
      }
      setProgress(current - 1);
      haptic("select");
      if (current === total) {
        const lbl = root.querySelector(".rvc-next-lbl");
        if (lbl) lbl.textContent = "Terminer";
      }
    }

    if (revealAll) {
      stepEls.forEach((s) => {
        s.classList.remove("is-hidden", "is-current");
        s.classList.add("is-done");
      });
      setProgress(total);
      unlockEnd();
    } else {
      setProgress(0);
      root.querySelector(".rvc-next-btn")?.addEventListener("click", advance);
      stepEls.forEach((s) =>
        s.addEventListener("click", () => {
          if (s.classList.contains("is-current")) advance();
        }),
      );
    }

    root.querySelector("[data-order]")?.addEventListener("click", () => {
      orderPlaced = [];
      orderPool = (f.methode || [])
        .map((t, i) => ({ i, t }))
        .sort(() => Math.random() - 0.5);
      view = "order";
      render();
    });
    mainBtn?.addEventListener("click", () => {
      focusId = null;
      startQuiz();
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
        <div class="rvc-done-e">🧩</div>
        <div class="rvc-done-t">Dans l'ordre, nickel !</div>
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
          sb.from("quiz_attempts")
            .insert({
              user_id: me.id,
              competence_id: code,
              type: "review",
              score: Math.round((good / total) * 100),
              questions_ids: [],
              answers_indices: [],
            })
            .then(({ error }) => {
              if (error)
                console.error("[revision-conduite] persist review", error);
            })
            .catch((e) =>
              console.error("[revision-conduite] persist review", e),
            );
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
