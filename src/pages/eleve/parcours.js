/**
 * Page Parcours Élève v3 — Map immersive continue à 4 MONDES.
 *
 * Inspiration : Duolingo / Mario World / Monument Valley / Apple Fitness
 * Direction : premium minimal, pas cartoon enfant, immersion forte.
 *
 * Structure :
 *  - 1 hero global en haut (progression + XP + trophées)
 *  - 4 mondes en séquence verticale (1 grande route continue)
 *  - Chaque monde a son ambiance (couleur, gradient, décor subtil)
 *  - Portails de transition entre mondes
 *  - Route SVG sinueuse continue traversant chaque monde
 *  - Nodes (checkpoints) le long de la route, animés
 *  - Footer global avec stats et CTA
 *
 * Données : REMC (4 catégories × 31 sous-comp) — chaque catégorie = un monde.
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { REMC } from '@/data/remc.js';
import { mountCosmos } from '@/components/cosmos-bg.js';
import { setupReveals } from '@/utils/reveal-on-scroll.js';
import { burstConfettiFromElement } from '@/components/confetti.js';
import { computeStats, updateStreak, isChestOpened } from '@/utils/game-state.js';
import { renderGameHUD, wireGameHUD } from '@/components/game-hud.js';
import { renderChest, openChestModal, ensureChestStyles } from '@/components/chest.js';
import { lootToast } from '@/components/loot-toast.js';
import { renderPermitCard, wirePermitCard, ensurePermitStyles } from '@/components/permit-card.js';
import { detectAndPlayUnlock } from '@/components/world-unlock-cinematic.js';

let STATE = []; // remc_entries Supabase
let EVENTS = []; // events leçons (pour heures faites)
let ME = null;
let _cosmos = null;

// Identité visuelle + décor SVG de chaque monde
const WORLDS_META = [
  {
    num: 1, name: 'Premiers Tours de Roues', tagline: 'Tes premières heures au volant',
    color: '#10b981', glow: 'rgba(16,185,129,.4)',
    // Sky : aube douce campagne · sol : prairies
    skyFrom: '#fef3c7', skyMid: '#dbeafe', skyTo: '#86efac',
    groundFrom: '#86efac', groundTo: '#16a34a',
    nodeBg: 'linear-gradient(180deg,#34d399,#10b981)',
    sceneryEmoji: '🌳🏡🌾',
  },
  {
    num: 2, name: 'Circulation & Priorités', tagline: 'Lecture des intersections et règles',
    color: '#8b5cf6', glow: 'rgba(139,92,246,.4)',
    // Sky : crépuscule urbain
    skyFrom: '#fce7f3', skyMid: '#e9d5ff', skyTo: '#7c3aed',
    groundFrom: '#6d28d9', groundTo: '#312e81',
    nodeBg: 'linear-gradient(180deg,#a78bfa,#8b5cf6)',
    sceneryEmoji: '🏙️🚦',
  },
  {
    num: 3, name: 'Maîtrise & Conditions', tagline: 'Montagnes, météo, autoroute',
    color: '#f59e0b', glow: 'rgba(245,158,11,.4)',
    // Sky : orage couché soleil
    skyFrom: '#fde68a', skyMid: '#fb923c', skyTo: '#92400e',
    groundFrom: '#78350f', groundTo: '#451a03',
    nodeBg: 'linear-gradient(180deg,#fbbf24,#f59e0b)',
    sceneryEmoji: '⛰️🌧️',
  },
  {
    num: 4, name: 'Conduite Autonome', tagline: 'Futur, autonomie, examen',
    color: '#0ea5e9', glow: 'rgba(14,165,233,.4)',
    // Sky : nuit néon futur
    skyFrom: '#0c4a6e', skyMid: '#1e1b4b', skyTo: '#020617',
    groundFrom: '#020617', groundTo: '#082f49',
    nodeBg: 'linear-gradient(180deg,#38bdf8,#0ea5e9)',
    sceneryEmoji: '🌃🌐',
  },
];

const XP_PER_COMP = 100;

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  ME = me;

  root.innerHTML = `<div style="padding:32px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  // Fetch en parallèle : REMC + profil complet (dob/neph) + events (heures faites)
  const [remcRes, profileRes, eventsRes] = await Promise.allSettled([
    sb.from('remc_entries').select('comp_id, lv, note, validated_at').eq('eleve_id', me.id),
    sb.from('profiles').select('id, nom, email, dob, neph, forfait_h, created_at, code_statut').eq('id', me.id).maybeSingle(),
    sb.from('events').select('dur, t, date_event').eq('eleve_id', me.id).eq('is_deleted', false),
  ]);

  if (remcRes.value?.error) console.warn('[parcours] err', remcRes.value.error);
  STATE = remcRes.value?.data || [];
  EVENTS = eventsRes.value?.data || [];
  // Merge profil fresh dans ME
  if (profileRes.value?.data) ME = { ...me, ...profileRes.value.data };

  // ─── Update streak au mount (un compteur de jours consécutifs) ───
  const streakResult = updateStreak();

  // Inject les styles de coffre + carte permis (1× par session)
  ensureChestStyles();
  ensurePermitStyles();

  root.innerHTML = renderShell(ME);
  setupReveals(root);
  wire(root);
  wirePermitCard(root);

  // ─── DETECT & PLAY : cinematic d'unlock de monde ───
  const gameStats = computeGameStats();
  // Si y'a un monde complété pas encore "vu" → joue la cinematic après 600ms (le temps que le DOM se stabilise)
  setTimeout(() => {
    detectAndPlayUnlock({
      worldsCompleted: gameStats.openedChests.concat(
        REMC.map((cat, i) => statsForWorld(cat).isComplete ? (i + 1) : null).filter(Boolean)
      ).filter((v, i, arr) => arr.indexOf(v) === i),  // dedup
      worldsMeta: WORLDS_META,
      stats: { byWorld: computeStatsByWorld() },
      onEnter: (nextWorldNum) => {
        // Scroll fluide vers le prochain monde
        const sections = root.querySelectorAll('.pc3-world');
        const target = sections[nextWorldNum - 1];
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    });
  }, 600);

  // Background cosmos subtil
  const bgHost = root.querySelector('#pc3-cosmos-host');
  if (bgHost) _cosmos = mountCosmos(bgHost);

  // ─── Loot toasts d'arrivée ───
  // Si streak vient d'augmenter (nouveau jour) → célébration
  if (streakResult.isNewDay && streakResult.count > 1) {
    setTimeout(() => {
      lootToast({
        icon: '🔥',
        label: `STREAK ×${streakResult.count}`,
        subLabel: 'Continue la série !',
        kind: 'warm',
      });
    }, 600);
  }
  // Si streak vient d'être cassée
  if (streakResult.justBroken) {
    setTimeout(() => {
      lootToast({
        icon: '💔',
        label: 'Streak réinitialisée',
        subLabel: 'On repart à 1, tu vas la rebattre !',
        kind: '',
      });
    }, 600);
  }
}

export function unmount() {
  if (_cosmos) { _cosmos.destroy(); _cosmos = null; }
}

// ─── Helpers d'état ───
function entryFor(c) { return STATE.find(e => e.comp_id === c) || null; }
function statusFor(c) {
  const e = entryFor(c);
  if (!e) return 'locked';
  if (e.lv === 'v') return 'done';
  if (e.lv === 'p') return 'active';
  if (e.lv === 'r') return 'review';
  return 'locked';
}
function statsForWorld(cat) {
  const total = cat.subs.length;
  const done = cat.subs.filter(s => statusFor(s.c) === 'done').length;
  const active = cat.subs.filter(s => statusFor(s.c) === 'active').length;
  const review = cat.subs.filter(s => statusFor(s.c) === 'review').length;
  return { total, done, active, review, pct: total ? Math.round(done / total * 100) : 0, isComplete: done === total };
}
function globalStats() {
  const all = REMC.flatMap(c => c.subs);
  const done = all.filter(s => statusFor(s.c) === 'done').length;
  const xp = done * XP_PER_COMP;
  const level = Math.floor(xp / 500) + 1;
  const trophies = REMC.filter(c => statsForWorld(c).isComplete).length;
  return { total: all.length, done, pct: Math.round(done / all.length * 100), xp, level, trophies };
}

/** Calcule les stats pour le Game HUD (utilise le moteur game-state). */
function computeGameStats() {
  const all = REMC.flatMap(c => c.subs);
  const doneCount = all.filter(s => statusFor(s.c) === 'done').length;
  // Mondes complétés = mondes où toutes les sous-comp sont 'done'
  const worldsCompleted = REMC
    .map((cat, idx) => statsForWorld(cat).isComplete ? (idx + 1) : null)
    .filter(Boolean);
  return computeStats({ doneCount, worldsCompleted });
}

/** Heures totales conduites (events confirmés). */
function totalHeuresConduites() {
  return EVENTS
    .filter(e => { const s = (e.t || '').toLowerCase(); return s === 'conf' || s === 'lecon' || s === 'leçon'; })
    .reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
}

/** Stats par monde pour la cinematic : heures, comp, jours. */
function computeStatsByWorld() {
  const byWorld = {};
  REMC.forEach((cat, idx) => {
    const worldNum = idx + 1;
    // Comp acquises dans ce monde
    const comps = cat.subs.filter(s => statusFor(s.c) === 'done').length;
    // Estimation heures (proportionnelle au % d'avancement du monde sur le forfait total)
    // Plus simple : utilise la 1ère et dernière validation comme range temporel
    const validations = cat.subs
      .map(s => STATE.find(e => e.comp_id === s.c && e.lv === 'v'))
      .filter(Boolean)
      .filter(e => e.validated_at);
    let days = 0;
    if (validations.length >= 2) {
      const sorted = validations.map(v => new Date(v.validated_at).getTime()).sort();
      days = Math.max(1, Math.round((sorted[sorted.length - 1] - sorted[0]) / 86400000));
    } else if (validations.length === 1) {
      days = 1;
    }
    // Heures : approx = (comp validées du monde / total comp validées) × heures totales
    const allDone = REMC.flatMap(c => c.subs).filter(s => statusFor(s.c) === 'done').length;
    const hours = allDone > 0 ? Math.round(totalHeuresConduites() * (comps / allDone)) : 0;
    byWorld[worldNum] = { hours, comps, days };
  });
  return byWorld;
}

// ─── Rendu ───

function renderShell(me) {
  const g = globalStats();
  return `
    <style>
      .pc3-cosmos{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;opacity:.18}
      .pc3-cosmos::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.5) 0%,rgba(255,255,255,.9) 100%)}

      /* ─── Bulles flottantes fixed (concept landing — restent en place au swipe) ─── */
      /* z-index 5 → au-dessus des mondes (pc3-wrap z-index 2) MAIS sous le HUD top (z-index 20) et back-fab (z-index 40) */
      /* mix-blend-mode: soft-light → teinte sans cacher le texte */
      .pc3-bubbles{position:fixed;inset:0;z-index:5;overflow:hidden;pointer-events:none;mix-blend-mode:soft-light}
      .pc3-bubbles::before{content:'';position:absolute;inset:-30%;background:radial-gradient(ellipse 50% 40% at 18% 18%,#6366f1 0%,transparent 55%),radial-gradient(ellipse 55% 45% at 82% 28%,#8b5cf6 0%,transparent 55%),radial-gradient(ellipse 50% 50% at 25% 75%,#0ea5e9 0%,transparent 55%),radial-gradient(ellipse 55% 45% at 78% 82%,#f59e0b 0%,transparent 55%);filter:blur(80px);opacity:.85;animation:pc3-bubbles-float 24s ease-in-out infinite alternate;will-change:transform}
      .pc3-bubbles::after{content:'';position:absolute;inset:-20%;background:radial-gradient(ellipse 40% 35% at 50% 50%,#10b981 0%,transparent 55%),radial-gradient(ellipse 35% 30% at 70% 15%,#ec4899 0%,transparent 55%);filter:blur(70px);opacity:.7;animation:pc3-bubbles-float2 28s ease-in-out infinite alternate;will-change:transform}
      @keyframes pc3-bubbles-float{0%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(40px,-30px) rotate(120deg) scale(1.08)}100%{transform:translate(-30px,40px) rotate(240deg) scale(.94)}}
      @keyframes pc3-bubbles-float2{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-50px,40px) scale(1.12)}100%{transform:translate(50px,-30px) scale(.9)}}
      @media (prefers-reduced-motion: reduce){.pc3-bubbles::before,.pc3-bubbles::after{animation:none}}

      .pc3-wrap{position:relative;z-index:2;max-width:540px;margin:0 auto;padding-bottom:40px}
      .pc3-content{max-width:520px;margin:0 auto;padding:0 14px}

      /* Bouton retour flottant (remplace le pc3-top — le HUD prend sa place) */
      .pc3-back-fab{position:fixed;top:calc(72px + env(safe-area-inset-top));left:12px;z-index:40;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid var(--bo);color:var(--ink);font-size:18px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px -4px rgba(0,0,0,.25);transition:transform .15s}
      .pc3-back-fab:hover{transform:translateX(-2px)}
      @media (max-width:560px){.pc3-back-fab{top:calc(64px + env(safe-area-inset-top))}}

      /* Header global sticky (ancien, conservé pour compatibilité mais non utilisé) */
      .pc3-top{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(255,255,255,.85);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid var(--bo2)}
      .pc3-back{width:34px;height:34px;border-radius:10px;border:1px solid var(--bo);background:var(--su);font-size:16px;cursor:pointer;flex-shrink:0}
      .pc3-top .ttl{font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:-.02em;line-height:1.1}
      .pc3-top .sub{font-size:11px;color:var(--mu);margin-top:2px}
      .pc3-top-r{margin-left:auto;display:flex;align-items:center;gap:6px;font-family:var(--fn);font-size:11.5px;font-weight:700;color:var(--ink)}
      .pc3-top-r .chip{display:inline-flex;align-items:center;gap:4px;padding:5px 9px;border-radius:99px;background:var(--bg2);border:1px solid var(--bo2)}
      .pc3-top-r .chip.xp{background:linear-gradient(135deg,#fed7aa,#fdba74);border-color:#fb923c;color:#9a3412}

      /* Hero progression globale */
      .pc3-hero{padding:24px 18px 14px;text-align:center}
      .pc3-hero .greet{font-size:11.5px;font-weight:700;color:var(--mu);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px}
      .pc3-hero h1{font-family:var(--fd);font-weight:800;font-size:24px;letter-spacing:-.02em;margin:0 0 14px}
      .pc3-hero .pbar{height:8px;background:var(--bo2);border-radius:99px;overflow:hidden;margin:0 auto 6px;max-width:300px}
      .pc3-hero .pbar i{display:block;height:100%;background:linear-gradient(90deg,#10b981,#8b5cf6,#f59e0b,#0ea5e9);border-radius:99px;transition:width 1s cubic-bezier(.2,.7,.3,1)}
      .pc3-hero .pmeta{font-size:11.5px;color:var(--mu);font-weight:600;font-family:var(--fn)}
      .pc3-hero .pmeta b{color:var(--ink);font-weight:800}

      /* Légende des états */
      .pc3-legend{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:6px 14px 14px;font-size:10.5px;color:var(--mu);font-weight:700}
      .pc3-legend span{display:inline-flex;align-items:center;gap:5px}
      .pc3-legend i{width:8px;height:8px;border-radius:50%}

      /* ─── WORLD section IMMERSIF avec image décor ─── */
      .pc3-world{position:relative;padding:0 0 80px;margin:0;overflow:hidden;background:var(--w-sky-mid)}
      /* Image décor pleine largeur (ChatGPT-generated PNG) */
      .pc3-scenery{position:absolute;inset:0;z-index:1;pointer-events:none}
      .pc3-scenery-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block}
      /* Voile léger pour adoucir l'image si besoin et fondre avec la route */
      .pc3-scenery::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 50%,transparent 0%,rgba(0,0,0,.1) 100%);pointer-events:none}
      /* Layer sky/ground supprimés — l'image les remplace */
      .pc3-world-sky,.pc3-world-ground{display:none}

      .pc3-world-h{padding:30px 18px 14px;text-align:center;position:relative;z-index:5}
      .pc3-world-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:99px;background:rgba(255,255,255,.95);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.4);font-family:var(--fn);font-size:10.5px;font-weight:800;letter-spacing:1.8px;color:var(--w-color);margin-bottom:12px;text-transform:uppercase;box-shadow:0 8px 24px -6px rgba(0,0,0,.4)}
      .pc3-world-badge .num{display:inline-flex;width:18px;height:18px;border-radius:50%;background:var(--w-color);color:#fff;align-items:center;justify-content:center;font-size:10px;font-weight:900}
      .pc3-world-h h2{font-family:var(--fd);font-weight:800;font-size:24px;letter-spacing:-.02em;color:#fff;margin:0 0 4px;text-shadow:0 2px 12px rgba(0,0,0,.4)}
      .pc3-world-h .tagline{font-size:12.5px;color:rgba(255,255,255,.85);margin-bottom:10px;text-shadow:0 1px 4px rgba(0,0,0,.3)}
      .pc3-world-h .count{display:inline-flex;align-items:center;gap:6px;font-family:var(--fn);font-size:12.5px;font-weight:800;color:#fff;background:rgba(0,0,0,.35);padding:5px 12px;border-radius:99px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.18)}
      .pc3-world-h .count .trophy{font-size:14px;line-height:1}

      /* Route SVG : large, organique, traverse le décor */
      .pc3-route{position:relative;padding:0 20px 70px;min-height:380px;z-index:3}
      .pc3-route svg{display:block;width:100%;height:auto;overflow:visible}
      /* Couche 1 : ombre projetée sous la route */
      .pc3-path-shadow{stroke:rgba(0,0,0,.18);stroke-width:32;fill:none;stroke-linecap:round;filter:blur(6px);transform:translateY(3px)}
      /* Couche 2 : bordure asphalte sombre */
      .pc3-path-edge{stroke:rgba(15,23,42,.65);stroke-width:30;fill:none;stroke-linecap:round}
      /* Couche 3 : surface asphalte */
      .pc3-path{stroke:#475569;stroke-width:24;fill:none;stroke-linecap:round}
      /* Couche 4 : marquage central jaune dashed */
      .pc3-path-light{stroke:#fbbf24;stroke-width:1.5;stroke-dasharray:5 10;stroke-linecap:round;fill:none;opacity:.95}

      /* Nodes */
      .pc3-node{position:absolute;transform:translate(-50%,-50%);z-index:5;opacity:0;animation:nd-pop .6s cubic-bezier(.34,1.56,.64,1) both;animation-delay:var(--nd-delay,0s)}
      @keyframes nd-pop{
        0%{opacity:0;transform:translate(-50%,-50%) scale(.3);filter:blur(8px)}
        70%{opacity:1;transform:translate(-50%,-50%) scale(1.1);filter:blur(0)}
        100%{opacity:1;transform:translate(-50%,-50%) scale(1)}
      }
      .pc3-node .ring{width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;transition:transform .25s cubic-bezier(.2,.7,.3,1)}
      .pc3-node:not(.locked):hover .ring{transform:translateY(-4px) scale(1.08)}
      .pc3-node .ring::before{content:'';position:absolute;inset:-6px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 16px 32px -8px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.8)}
      .pc3-node .dot{position:relative;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:800;border:4px solid #fff;box-shadow:0 14px 28px -8px rgba(11,13,26,.5),inset 0 -10px 16px rgba(0,0,0,.18),inset 0 3px 0 rgba(255,255,255,.45);z-index:1}
      .pc3-node.done .dot{background:var(--w-node)}
      .pc3-node.done .ring::after{content:'';position:absolute;inset:-8px;border-radius:50%;border:2px solid var(--w-color);opacity:.4;animation:nd-pulse 2.5s ease-out infinite}
      @keyframes nd-pulse{0%{transform:scale(.85);opacity:.6}100%{transform:scale(1.3);opacity:0}}
      .pc3-node.active .dot{background:radial-gradient(circle at 30% 25%,#c4b5fd,var(--w-color))}
      .pc3-node.active .ring::after{content:'';position:absolute;inset:-12px;border-radius:50%;background:radial-gradient(circle,var(--w-glow),transparent 70%);animation:nd-breath 2s ease-in-out infinite;z-index:-1}
      @keyframes nd-breath{0%,100%{transform:scale(.8);opacity:.5}50%{transform:scale(1.2);opacity:1}}
      .pc3-node.review .dot{background:linear-gradient(180deg,#fbbf24,#f59e0b)}
      .pc3-node.locked{cursor:default}
      .pc3-node.locked .dot{background:linear-gradient(180deg,#cbd5e1,#94a3b8);color:rgba(255,255,255,.85);box-shadow:0 6px 16px -6px rgba(11,13,26,.25),inset 0 -8px 12px rgba(0,0,0,.1)}
      .pc3-node.locked .ring{cursor:default}

      /* Labels en mode "carte gaming" — numéro gros + nom complet + statut visible */
      .pc3-node .lbl{position:absolute;top:calc(100% + 12px);left:50%;transform:translateX(-50%);background:rgba(255,255,255,.98);backdrop-filter:blur(10px) saturate(180%);-webkit-backdrop-filter:blur(10px) saturate(180%);border:1px solid rgba(255,255,255,.7);border-radius:11px;padding:7px 11px 8px;width:max-content;max-width:200px;min-width:130px;text-align:center;box-shadow:0 12px 28px -8px rgba(11,13,26,.35),0 1px 2px rgba(11,13,26,.08);pointer-events:none;cursor:pointer}
      .pc3-node .lbl .num{display:block;font-family:var(--fn);font-size:11.5px;font-weight:900;color:var(--w-color);letter-spacing:.6px;line-height:1;margin-bottom:3px}
      .pc3-node .lbl .nm{display:block;font-family:var(--fb);font-size:11.5px;font-weight:700;color:var(--ink);line-height:1.25;white-space:normal;word-wrap:break-word;hyphens:auto}
      .pc3-node .lbl .stt{display:inline-flex;align-items:center;gap:3px;margin-top:5px;font-family:var(--fn);font-size:8.5px;font-weight:900;letter-spacing:.9px;text-transform:uppercase;padding:2px 7px;border-radius:99px}

      /* DONE — vert, validé, +XP */
      .pc3-node.done .lbl{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(220,252,231,.95));border-color:rgba(16,185,129,.4);box-shadow:0 12px 28px -8px rgba(16,185,129,.35),0 0 0 1px rgba(16,185,129,.2)}
      .pc3-node.done .lbl .num{color:var(--gr)}
      .pc3-node.done .lbl .stt{background:var(--gr);color:#fff;box-shadow:0 2px 6px rgba(16,185,129,.4)}

      /* ACTIVE — couleur monde, "EN COURS" + badge TU ES ICI */
      .pc3-node.active .lbl{background:#fff;border-color:var(--w-color);box-shadow:0 14px 32px -8px var(--w-glow),0 0 0 2px var(--w-color)}
      .pc3-node.active .lbl .stt{background:var(--w-color);color:#fff;animation:lbl-pulse 1.5s ease-in-out infinite}
      @keyframes lbl-pulse{0%,100%{opacity:1}50%{opacity:.75}}
      .pc3-node.active .lbl::before{content:'TU ES ICI';position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--w-color);color:#fff;font-family:var(--fn);font-size:9px;font-weight:900;padding:3px 9px;border-radius:99px;letter-spacing:.16em;white-space:nowrap;box-shadow:0 6px 14px -2px var(--w-glow);animation:tu-es-ici-bounce 1.6s ease-in-out infinite}
      @keyframes tu-es-ici-bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-4px)}}

      /* REVIEW — orange, à retravailler */
      .pc3-node.review .lbl{background:linear-gradient(180deg,#fff,#fffbeb);border-color:rgba(245,158,11,.4);box-shadow:0 12px 28px -8px rgba(245,158,11,.3)}
      .pc3-node.review .lbl .num{color:var(--am)}
      .pc3-node.review .lbl .stt{background:var(--am);color:#fff}

      /* LOCKED — grisé, cadenas */
      .pc3-node.locked .lbl{background:rgba(241,245,249,.85);border-color:rgba(148,163,184,.3);box-shadow:0 6px 14px -6px rgba(11,13,26,.18)}
      .pc3-node.locked .lbl .num{color:var(--mu2)}
      .pc3-node.locked .lbl .nm{color:var(--mu)}
      .pc3-node.locked .lbl .stt{background:var(--bg2);color:var(--mu)}

      /* Portail entre mondes */
      .pc3-portal{position:relative;padding:8px 18px 32px;text-align:center}
      .pc3-portal-arch{position:relative;width:130px;height:170px;margin:0 auto 16px}
      .pc3-portal-arch::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,var(--w-glow) 0%,transparent 60%);filter:blur(8px);animation:portal-pulse 3s ease-in-out infinite}
      @keyframes portal-pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
      .pc3-portal-arch svg{position:relative;width:100%;height:100%;filter:drop-shadow(0 8px 20px var(--w-glow))}
      .pc3-portal-arch .arch-bg{fill:var(--w-color);opacity:.18}
      .pc3-portal-arch .arch-stroke{fill:none;stroke:var(--w-color);stroke-width:3;stroke-linecap:round}
      .pc3-portal-arch .arch-light{fill:none;stroke:#fff;stroke-width:1.5;stroke-dasharray:3 6;stroke-linecap:round;opacity:.8}

      .pc3-portal .badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;background:rgba(255,255,255,.85);border:1px solid var(--bo2);font-family:var(--fn);font-size:10.5px;font-weight:800;color:var(--w-color);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
      .pc3-portal h3{font-family:var(--fd);font-weight:800;font-size:16px;color:var(--ink);margin:0 0 4px}
      .pc3-portal p{font-size:12.5px;color:var(--mu);max-width:280px;margin:0 auto}

      /* World complete state */
      .pc3-world.complete .pc3-portal-arch{filter:drop-shadow(0 0 30px var(--w-glow))}
      .pc3-world.complete .pc3-portal h3{color:var(--w-color)}

      /* Boss de fin de monde — placeholder examen blanc */
      .pc3-boss{position:relative;margin:18px auto 8px;max-width:320px;padding:20px 22px 22px;background:linear-gradient(160deg,#0b0d1a 0%,#1e1b4b 100%);border:2px solid #8b5cf6;border-radius:18px;color:#fff;text-align:center;box-shadow:0 18px 44px -10px rgba(139,92,246,.5);overflow:hidden}
      .pc3-boss-glow{position:absolute;inset:-30px;background:radial-gradient(ellipse at center,#8b5cf6 0%,transparent 60%);opacity:.35;filter:blur(22px);z-index:-1;animation:boss-glow 2.8s ease-in-out infinite}
      @keyframes boss-glow{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.55;transform:scale(1.12)}}
      .pc3-boss-em{font-size:42px;line-height:1;filter:drop-shadow(0 4px 14px rgba(251,191,36,.6));animation:boss-bounce 2s ease-in-out infinite}
      @keyframes boss-bounce{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-6px) scale(1.05)}}
      .pc3-boss-lbl{font-family:var(--fn);font-size:10px;font-weight:900;letter-spacing:.25em;color:#fde68a;margin-top:8px;text-transform:uppercase}
      .pc3-boss-name{font-family:var(--fd);font-size:16px;font-weight:800;margin-top:3px;color:#fff;letter-spacing:-.01em}
      .pc3-boss-cta{margin-top:14px;padding:12px 26px;border-radius:99px;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;border:0;font-family:var(--fd);font-size:13px;font-weight:900;cursor:pointer;letter-spacing:.4px;box-shadow:0 8px 20px -4px rgba(139,92,246,.6);transition:transform .15s;animation:boss-cta-pulse 2s ease-in-out infinite}
      .pc3-boss-cta:hover{transform:translateY(-2px) scale(1.04)}
      @keyframes boss-cta-pulse{0%,100%{box-shadow:0 8px 20px -4px rgba(139,92,246,.6)}50%{box-shadow:0 8px 30px 0 rgba(139,92,246,.8)}}

      /* Particules dorées sur nodes acquis (juice ambient) */
      .pc3-node.done::after{content:'';position:absolute;top:50%;left:50%;width:6px;height:6px;background:radial-gradient(circle,#fde68a,transparent 70%);border-radius:50%;pointer-events:none;animation:gold-float 3s ease-out infinite;opacity:0;z-index:6}
      @keyframes gold-float{0%{transform:translate(-50%,-50%) translateY(0) scale(.6);opacity:0}20%{opacity:1}100%{transform:translate(-50%,-50%) translateY(-50px) scale(1.5);opacity:0}}

      /* Connecteur entre 2 mondes (route qui passe) */
      .pc3-bridge{height:50px;position:relative;overflow:hidden}
      .pc3-bridge::before{content:'';position:absolute;left:50%;top:-10px;bottom:-10px;width:14px;transform:translateX(-50%);background:rgba(11,13,26,.08);border-radius:99px}
      .pc3-bridge::after{content:'';position:absolute;left:50%;top:0;bottom:0;width:2px;transform:translateX(-50%);background:#fff;border-style:dashed;border-width:0 0 0 0;background-image:linear-gradient(180deg,#fff 50%,transparent 0);background-size:2px 10px;opacity:.9}

      /* Footer final — fin du voyage */
      .pc3-final{margin:30px 16px 0;padding:30px 22px;background:linear-gradient(135deg,#0b0d1a,#1e1b4b);color:#fff;border-radius:var(--rx);text-align:center;box-shadow:0 24px 60px -20px rgba(11,13,26,.5);position:relative;overflow:hidden}
      .pc3-final::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 20%,rgba(99,102,241,.25),transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(245,158,11,.18),transparent 50%);pointer-events:none}
      .pc3-final h3{font-family:var(--fd);font-weight:800;font-size:18px;margin:0 0 6px;letter-spacing:-.01em;position:relative}
      .pc3-final p{font-size:13px;opacity:.75;margin:0 0 18px;position:relative}
      .pc3-final-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;position:relative}
      .pc3-final-stat .v{font-family:var(--fd);font-size:24px;font-weight:900;letter-spacing:-.02em}
      .pc3-final-stat .l{font-size:10px;color:rgba(255,255,255,.6);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:2px}

      /* Bottom sheet fiche compétence (réutilisée) */
      .sheet{position:fixed;inset:0;background:rgba(11,13,26,.55);backdrop-filter:blur(4px);display:none;align-items:flex-end;justify-content:center;z-index:90}
      .sheet.show{display:flex;animation:fadeIn .2s ease}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      .sheet .panel{background:var(--bg);width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:var(--rx) var(--rx) 0 0;box-shadow:var(--s3);animation:slideUp .25s cubic-bezier(.2,.7,.3,1)}
      @media(min-width:640px){.sheet{align-items:center}.sheet .panel{border-radius:var(--rx);max-height:88vh}}
      @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}

      .fiche-hero{position:relative;padding:18px 18px 26px;color:#fff;background:radial-gradient(120% 80% at 50% 0%,var(--w-color) 0%,#0b0d1a 75%)}
      .fiche-hero .close{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;border:0}
      .fiche-hero .badge-cat{font-size:10px;font-weight:800;opacity:.7;letter-spacing:1.5px;text-align:center}
      .fiche-circle{width:88px;height:88px;border-radius:50%;margin:14px auto 12px;border:4px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 30px -8px rgba(0,0,0,.4);font-size:34px;color:#fff;background:var(--w-color)}
      .fiche-hero h3{font-family:var(--fd);font-size:22px;font-weight:800;text-align:center;margin:0;letter-spacing:-.02em}
      .fiche-hero .id{text-align:center;font-family:var(--fn);font-size:11px;opacity:.75;margin-top:4px;letter-spacing:1px}
      .fiche-hero .stt{text-align:center;margin-top:12px}
      .fiche-body{padding:14px;margin-top:-18px}
      .fiche-section{background:var(--su);border:1px solid var(--bo);border-radius:var(--rl);padding:14px;margin-bottom:10px;box-shadow:var(--s1)}
      .fiche-section .lbl{font-size:10px;font-weight:800;color:var(--mu);letter-spacing:1px;margin-bottom:8px}
      .fiche-section .txt{font-size:13.5px;color:var(--ink);line-height:1.5}
      .meta-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px dashed var(--bo2);font-size:13px}
      .meta-row:last-child{border-bottom:0}
      .meta-row .l{color:var(--mu);font-weight:600}
      .meta-row .v{font-family:var(--fn);font-weight:700;color:var(--ink)}
    </style>

    <div class="pc3-cosmos" id="pc3-cosmos-host"></div>
    <div class="pc3-bubbles" aria-hidden="true"></div>

    <div class="pc3-wrap">

      ${renderGameHUD(computeGameStats(), me)}

      <!-- Bouton retour discret en absolu (le HUD prend déjà la place du header) -->
      <button class="pc3-back-fab" id="pc3-back" aria-label="Retour à l'accueil" type="button">‹</button>

      <!-- ╔══ CARTE PERMIS PERSONNELLE ══╗ -->
      ${renderPermitCard({
        me,
        stats: computeGameStats(),
        doneCount: g.done,
        totalCount: g.total,
        heuresFaites: totalHeuresConduites(),
        forfait: me.forfait_h || 20,
      })}

      <!-- Hero progression -->
      <div class="pc3-hero reveal">
        <div class="greet">${esc(me.nom.split(' ')[0])}, ${pickGreeting(g.pct)}</div>
        <h1>${greetingTitle(g.pct)}</h1>
        <div class="pbar"><i style="width:${g.pct}%"></i></div>
        <div class="pmeta"><b>${g.done}</b> sur ${g.total} compétences · <b>${g.pct}%</b> du chemin parcouru</div>
      </div>

      <div class="pc3-legend">
        <span><i style="background:#10b981"></i>Acquis</span>
        <span><i style="background:#8b5cf6"></i>En cours</span>
        <span><i style="background:#f59e0b"></i>À retravailler</span>
        <span><i style="background:#94a3b8"></i>Verrouillé</span>
      </div>

      <!-- Les 4 mondes en route continue -->
      ${REMC.map((cat, i) => renderWorld(cat, WORLDS_META[i], i, i < REMC.length - 1)).join('')}

      <!-- Fin du voyage -->
      ${renderFinal(g)}

      <div style="height:30px"></div>
    </div>

    <!-- Bottom sheet pour la fiche compétence -->
    <div class="sheet" id="pc3-sheet"><div class="panel" id="pc3-sheet-panel"></div></div>
  `;
}

function pickGreeting(pct) {
  if (pct === 0) return 'prêt(e) pour le départ ?';
  if (pct < 25) return 'le voyage commence';
  if (pct < 50) return 'belle progression';
  if (pct < 75) return 'sur la bonne voie';
  if (pct < 100) return 'tout proche du but';
  return 'félicitations !';
}
function greetingTitle(pct) {
  if (pct === 0) return 'Commence ton aventure';
  if (pct < 50) return 'Continue la route';
  if (pct < 100) return 'Tu approches du sommet';
  return 'Permis en vue 🎯';
}

// ─── Décor par monde : image PNG haute qualité dans /public/worlds/ ───
function renderWorldScenery(worldIdx) {
  const num = worldIdx + 1;
  return `
    <img src="worlds/monde-${num}.png"
         alt=""
         loading="lazy"
         class="pc3-scenery-img"
         draggable="false">
  `;
}

// Monde 1 : Campagne — collines + arbres + soleil + maisons + champs
function sceneryCampagne() {
  return `
    <svg viewBox="0 0 540 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- Soleil -->
      <circle cx="430" cy="120" r="50" fill="#fef3c7" opacity=".85"/>
      <circle cx="430" cy="120" r="36" fill="#fde68a" opacity=".95"/>
      <!-- Nuages -->
      <g opacity=".55" fill="#fff">
        <ellipse cx="120" cy="100" rx="40" ry="14"/>
        <ellipse cx="155" cy="110" rx="28" ry="10"/>
        <ellipse cx="350" cy="180" rx="34" ry="11"/>
        <ellipse cx="60" cy="220" rx="30" ry="10"/>
      </g>
      <!-- Collines arrière (plus claires) -->
      <path d="M 0 380 Q 100 320, 200 360 T 400 350 T 540 370 L 540 900 L 0 900 Z" fill="#86efac" opacity=".55"/>
      <!-- Collines milieu -->
      <path d="M 0 480 Q 130 410, 260 460 T 540 470 L 540 900 L 0 900 Z" fill="#4ade80" opacity=".75"/>
      <!-- Collines proche -->
      <path d="M 0 600 Q 140 530, 290 580 T 540 590 L 540 900 L 0 900 Z" fill="#16a34a"/>
      <!-- Arbres dispersés -->
      <g>
        <!-- Arbre 1 (gauche) -->
        <circle cx="55" cy="560" r="22" fill="#15803d"/>
        <rect x="51" y="575" width="8" height="22" fill="#78350f"/>
        <!-- Arbre 2 -->
        <circle cx="480" cy="600" r="24" fill="#15803d"/>
        <rect x="476" y="615" width="8" height="22" fill="#78350f"/>
        <!-- Arbre 3 plus petit lointain -->
        <circle cx="380" cy="500" r="14" fill="#16a34a"/>
        <rect x="378" y="510" width="4" height="14" fill="#92400e"/>
        <!-- Arbre 4 -->
        <circle cx="100" cy="440" r="12" fill="#16a34a"/>
        <rect x="98" y="448" width="4" height="12" fill="#92400e"/>
      </g>
      <!-- Petite maison -->
      <g transform="translate(390 540)">
        <rect x="0" y="20" width="36" height="28" fill="#fef3c7"/>
        <polygon points="-3,20 18,-2 39,20" fill="#dc2626"/>
        <rect x="14" y="32" width="8" height="16" fill="#78350f"/>
        <rect x="3" y="26" width="6" height="6" fill="#1e40af" opacity=".55"/>
      </g>
      <!-- Champs lignes -->
      <g stroke="#15803d" stroke-width="1" opacity=".35">
        <path d="M 30 750 Q 270 720, 510 750" fill="none"/>
        <path d="M 30 770 Q 270 740, 510 770" fill="none"/>
        <path d="M 30 790 Q 270 760, 510 790" fill="none"/>
      </g>
    </svg>
  `;
}

// Monde 2 : Ville — buildings + feux + néons subtils + signalisation
function sceneryVille() {
  return `
    <svg viewBox="0 0 540 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- Lune crépuscule -->
      <circle cx="100" cy="110" r="38" fill="#fef3c7" opacity=".75"/>
      <circle cx="100" cy="110" r="28" fill="#fde68a"/>
      <!-- Skyline lointaine -->
      <g opacity=".4" fill="#1e1b4b">
        <rect x="0" y="320" width="40" height="200"/>
        <rect x="44" y="280" width="50" height="240"/>
        <rect x="100" y="340" width="35" height="180"/>
        <rect x="140" y="300" width="60" height="220"/>
        <rect x="205" y="270" width="45" height="250"/>
        <rect x="255" y="320" width="38" height="200"/>
        <rect x="300" y="290" width="55" height="230"/>
        <rect x="360" y="340" width="40" height="180"/>
        <rect x="405" y="280" width="50" height="240"/>
        <rect x="460" y="310" width="45" height="210"/>
        <rect x="510" y="330" width="30" height="190"/>
      </g>
      <!-- Skyline proche (plus foncée + fenêtres lumineuses) -->
      <g fill="#312e81">
        <rect x="-20" y="430" width="100" height="200" rx="2"/>
        <rect x="85" y="380" width="80" height="250" rx="2"/>
        <rect x="170" y="410" width="65" height="220" rx="2"/>
        <rect x="240" y="360" width="90" height="270" rx="2"/>
        <rect x="335" y="400" width="70" height="230" rx="2"/>
        <rect x="410" y="370" width="85" height="260" rx="2"/>
        <rect x="500" y="420" width="60" height="210" rx="2"/>
      </g>
      <!-- Fenêtres lumineuses (néons) -->
      <g fill="#fde68a" opacity=".85">
        <rect x="10" y="450" width="5" height="6"/>
        <rect x="22" y="450" width="5" height="6"/>
        <rect x="38" y="450" width="5" height="6"/>
        <rect x="58" y="470" width="5" height="6"/>
        <rect x="22" y="475" width="5" height="6"/>
        <rect x="105" y="400" width="5" height="6"/>
        <rect x="120" y="400" width="5" height="6"/>
        <rect x="135" y="420" width="5" height="6"/>
        <rect x="150" y="420" width="5" height="6"/>
        <rect x="185" y="430" width="5" height="6"/>
        <rect x="210" y="430" width="5" height="6"/>
        <rect x="255" y="380" width="5" height="6"/>
        <rect x="275" y="380" width="5" height="6"/>
        <rect x="295" y="400" width="5" height="6"/>
        <rect x="315" y="400" width="5" height="6"/>
      </g>
      <g fill="#a78bfa" opacity=".9">
        <rect x="350" y="420" width="5" height="6"/>
        <rect x="370" y="420" width="5" height="6"/>
        <rect x="390" y="445" width="5" height="6"/>
        <rect x="425" y="395" width="5" height="6"/>
        <rect x="445" y="395" width="5" height="6"/>
        <rect x="465" y="420" width="5" height="6"/>
        <rect x="485" y="420" width="5" height="6"/>
      </g>
      <!-- Feu tricolore (élément emblématique) -->
      <g transform="translate(440 580)">
        <rect x="-3" y="0" width="6" height="50" fill="#0f172a"/>
        <rect x="-15" y="-50" width="30" height="55" rx="6" fill="#0f172a"/>
        <circle cx="0" cy="-38" r="6" fill="#ef4444"/>
        <circle cx="0" cy="-23" r="6" fill="#fbbf24" opacity=".4"/>
        <circle cx="0" cy="-8" r="6" fill="#10b981" opacity=".4"/>
      </g>
      <!-- Lampadaire -->
      <g transform="translate(60 580)" stroke="#0f172a" stroke-width="2">
        <line x1="0" y1="0" x2="0" y2="-60"/>
        <path d="M 0 -60 Q 0 -68, 8 -68 L 22 -68" fill="none"/>
        <circle cx="24" cy="-66" r="4" fill="#fde68a"/>
      </g>
      <g opacity=".5">
        <circle cx="84" cy="514" r="22" fill="#fde68a"/>
      </g>
    </svg>
  `;
}

// Monde 3 : Montagne — pics + pluie + tunnel + falaises
function sceneryMontagne() {
  return `
    <svg viewBox="0 0 540 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- Soleil couchant -->
      <circle cx="270" cy="150" r="55" fill="#fde68a" opacity=".75"/>
      <circle cx="270" cy="150" r="40" fill="#fb923c" opacity=".7"/>
      <!-- Nuages d'orage -->
      <g opacity=".6" fill="#451a03">
        <ellipse cx="80" cy="80" rx="55" ry="14"/>
        <ellipse cx="130" cy="95" rx="40" ry="10"/>
        <ellipse cx="430" cy="110" rx="50" ry="12"/>
        <ellipse cx="480" cy="95" rx="35" ry="9"/>
      </g>
      <!-- Montagnes lointaines -->
      <g opacity=".4">
        <polygon points="0,420 90,250 180,400 0,420" fill="#7c2d12"/>
        <polygon points="120,440 230,200 340,440 120,440" fill="#7c2d12"/>
        <polygon points="280,420 380,230 480,420 280,420" fill="#7c2d12"/>
        <polygon points="430,440 510,260 540,440 540,440" fill="#7c2d12"/>
      </g>
      <!-- Sommets enneigés (caps blancs) -->
      <g fill="#fefce8" opacity=".75">
        <polygon points="60,310 90,250 120,310"/>
        <polygon points="200,250 230,200 260,250"/>
        <polygon points="350,290 380,230 410,290"/>
      </g>
      <!-- Montagnes proches plus sombres -->
      <g>
        <polygon points="0,560 110,360 220,540 320,400 430,540 540,460 540,900 0,900" fill="#451a03"/>
      </g>
      <!-- Tunnel (arche sombre à mi-hauteur) -->
      <g transform="translate(180 550)">
        <path d="M 0 80 L 0 30 Q 0 0, 30 0 L 60 0 Q 90 0, 90 30 L 90 80 Z" fill="#0c0a09"/>
        <path d="M 8 80 L 8 32 Q 8 8, 30 8 L 60 8 Q 82 8, 82 32 L 82 80 Z" fill="#1c1917"/>
        <path d="M 14 80 L 14 34 Q 14 14, 32 14 L 58 14 Q 76 14, 76 34 L 76 80 Z" fill="#0c0a09"/>
      </g>
      <!-- Pluie (lignes verticales animées via opacity) -->
      <g stroke="#a5b4fc" stroke-width="1.2" opacity=".5">
        ${Array.from({length: 80}, (_, i) => {
          const x = (i * 7 + (i % 3) * 3) % 540;
          const y = (i * 11) % 850;
          return `<line x1="${x}" y1="${y}" x2="${x - 3}" y2="${y + 18}"/>`;
        }).join('')}
      </g>
      <!-- Éclair lointain -->
      <path d="M 470 130 L 460 180 L 472 175 L 460 230" stroke="#fde68a" stroke-width="2" fill="none" opacity=".7"/>
    </svg>
  `;
}

// Monde 4 : Futur — gratte-ciels néon + ville cyberpunk + lignes lumineuses
function sceneryFutur() {
  return `
    <svg viewBox="0 0 540 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="neon-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#22d3ee" stop-opacity="0"/>
          <stop offset="50%" stop-color="#22d3ee" stop-opacity=".8"/>
          <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="neon-pink" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ec4899" stop-opacity="0"/>
          <stop offset="50%" stop-color="#ec4899" stop-opacity=".9"/>
          <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Étoiles -->
      <g fill="#fff">
        ${Array.from({length: 40}, () => {
          const x = Math.floor(Math.random() * 540);
          const y = Math.floor(Math.random() * 400);
          const r = (Math.random() * 1.3 + 0.4).toFixed(1);
          return `<circle cx="${x}" cy="${y}" r="${r}" opacity="${(0.4 + Math.random() * 0.5).toFixed(2)}"/>`;
        }).join('')}
      </g>
      <!-- Lune néon -->
      <circle cx="440" cy="130" r="42" fill="#0ea5e9" opacity=".3" filter="blur(2px)"/>
      <circle cx="440" cy="130" r="32" fill="#67e8f9"/>
      <!-- Grattes-ciels lointains -->
      <g opacity=".5" fill="#0c4a6e">
        <rect x="0" y="380" width="35" height="180"/>
        <rect x="40" y="340" width="50" height="220"/>
        <rect x="95" y="370" width="40" height="190"/>
        <rect x="140" y="320" width="55" height="240"/>
        <rect x="200" y="350" width="45" height="210"/>
        <rect x="250" y="310" width="60" height="250"/>
        <rect x="315" y="340" width="50" height="220"/>
        <rect x="370" y="370" width="45" height="190"/>
        <rect x="420" y="300" width="55" height="260"/>
        <rect x="480" y="350" width="40" height="210"/>
      </g>
      <!-- Grattes-ciels proches avec néons -->
      <g>
        <rect x="-10" y="420" width="90" height="250" fill="#082f49"/>
        <rect x="85" y="380" width="75" height="290" fill="#0c4a6e"/>
        <rect x="170" y="410" width="60" height="260" fill="#082f49"/>
        <rect x="235" y="360" width="85" height="310" fill="#0c4a6e"/>
        <rect x="325" y="400" width="70" height="270" fill="#082f49"/>
        <rect x="400" y="380" width="80" height="290" fill="#0c4a6e"/>
        <rect x="485" y="430" width="65" height="240" fill="#082f49"/>
      </g>
      <!-- Néons verticaux (rayures lumineuses sur les buildings) -->
      <g>
        <rect x="35" y="430" width="2" height="200" fill="#22d3ee" opacity=".9"/>
        <rect x="50" y="430" width="2" height="200" fill="#22d3ee" opacity=".7"/>
        <rect x="120" y="395" width="2" height="240" fill="#a78bfa" opacity=".9"/>
        <rect x="135" y="395" width="2" height="240" fill="#a78bfa" opacity=".7"/>
        <rect x="200" y="425" width="2" height="220" fill="#22d3ee" opacity=".85"/>
        <rect x="275" y="375" width="2" height="270" fill="#ec4899" opacity=".9"/>
        <rect x="290" y="375" width="2" height="270" fill="#ec4899" opacity=".7"/>
        <rect x="360" y="415" width="2" height="225" fill="#22d3ee" opacity=".85"/>
        <rect x="430" y="395" width="2" height="245" fill="#a78bfa" opacity=".9"/>
        <rect x="445" y="395" width="2" height="245" fill="#a78bfa" opacity=".7"/>
        <rect x="510" y="445" width="2" height="200" fill="#22d3ee" opacity=".85"/>
      </g>
      <!-- Fenêtres allumées aléatoires -->
      <g fill="#fde68a" opacity=".7">
        ${Array.from({length: 35}, () => {
          const x = Math.floor(Math.random() * 530) + 5;
          const y = Math.floor(Math.random() * 240) + 400;
          return `<rect x="${x}" y="${y}" width="3" height="3"/>`;
        }).join('')}
      </g>
      <!-- Lignes horizontales néon (traînées de lumière) -->
      <line x1="0" y1="680" x2="540" y2="680" stroke="url(#neon-pink)" stroke-width="1.5"/>
      <line x1="0" y1="700" x2="540" y2="700" stroke="#22d3ee" stroke-width=".8" opacity=".7"/>
      <!-- Grille perspective sol futuriste -->
      <g stroke="#22d3ee" stroke-width=".6" opacity=".4">
        <path d="M 0 750 L 540 750" fill="none"/>
        <path d="M 0 790 L 540 790" fill="none"/>
        <path d="M 0 830 L 540 830" fill="none"/>
        <path d="M 0 870 L 540 870" fill="none"/>
        <line x1="80" y1="750" x2="-80" y2="900"/>
        <line x1="180" y1="750" x2="120" y2="900"/>
        <line x1="270" y1="750" x2="270" y2="900"/>
        <line x1="360" y1="750" x2="420" y2="900"/>
        <line x1="460" y1="750" x2="620" y2="900"/>
      </g>
    </svg>
  `;
}

function renderWorld(cat, meta, worldIdx, hasNext) {
  const stats = statsForWorld(cat);
  // Génère la path SVG verticale sinueuse
  const W = 280;
  // Espacement vertical : labels gaming-style plus grands → plus de respiration
  const H = Math.max(460, cat.subs.length * 170 + 80);

  const points = cat.subs.map((sub, i) => {
    const yPct = (i + 0.5) / cat.subs.length;
    // Sinusoïde gauche-droite (labels centrés sous le node → on peut élargir un peu)
    const wave = Math.sin(i * 0.85) * 0.28;
    const xPct = 0.5 + wave;
    return {
      c: sub.c, n: sub.n,
      x: xPct * W,
      y: yPct * H,
    };
  });

  // Path SVG passant par tous les points (bezier doux)
  let path = `M ${points[0].x} 0 L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i], pp = points[i - 1];
    const my = (pp.y + p.y) / 2;
    path += ` C ${pp.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  }
  path += ` L ${points[points.length - 1].x} ${H}`;

  const nodesHTML = points.map((p, i) => {
    const st = statusFor(p.c);
    const xp = (p.x / W * 100).toFixed(2);
    const yp = (p.y / H * 100).toFixed(2);
    const idx = String(i + 1).padStart(2, '0');
    const delay = (i * 0.06 + 0.1).toFixed(2);
    const sttBadge = ({
      done: '<span class="stt">✓ Acquis · +100 XP</span>',
      active: '<span class="stt">⌁ En cours</span>',
      review: '<span class="stt">! À revoir</span>',
      locked: '<span class="stt">🔒 Verrouillé</span>',
    })[st] || '';

    return `
      <div class="pc3-node ${st}" data-comp="${esc(p.c)}" data-world="${worldIdx}"
           style="left:${xp}%;top:${yp}%;--nd-delay:${delay}s">
        <div class="ring">
          <div class="dot">${statusGlyph(st)}</div>
        </div>
        <div class="lbl">
          <span class="num">${meta.num}.${idx}</span>
          <span class="nm">${esc(p.n)}</span>
          ${sttBadge}
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="pc3-world ${stats.isComplete ? 'complete' : ''}"
             style="--w-color:${meta.color};--w-glow:${meta.glow};--w-node:${meta.nodeBg};
                    --w-sky-from:${meta.skyFrom};--w-sky-mid:${meta.skyMid};--w-sky-to:${meta.skyTo};
                    --w-ground-from:${meta.groundFrom};--w-ground-to:${meta.groundTo}">
      <!-- Sky gradient + halo -->
      <div class="pc3-world-sky"></div>
      <!-- Décor SVG illustré spécifique au monde -->
      <div class="pc3-scenery">${renderWorldScenery(worldIdx)}</div>
      <!-- Sol bas -->
      <div class="pc3-world-ground"></div>

      <div class="pc3-world-h reveal">
        <div class="pc3-world-badge"><span class="num">${meta.num}</span>Monde ${meta.num}</div>
        <h2>${esc(meta.name)}</h2>
        <div class="tagline">${esc(meta.tagline)}</div>
        <div class="count">
          ${stats.done} / ${stats.total} compétences
          ${stats.isComplete ? `<span class="trophy">🏆</span>` : ''}
        </div>
      </div>

      <div class="pc3-route reveal">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">
          <path class="pc3-path-shadow" d="${path}" />
          <path class="pc3-path-edge" d="${path}" />
          <path class="pc3-path" d="${path}" />
          <path class="pc3-path-light" d="${path}" />
        </svg>
        ${nodesHTML}
      </div>

      <div class="pc3-portal">
        ${renderPortalArch(meta.color, stats.isComplete)}
        <div class="badge">${stats.isComplete ? '✓ Monde terminé' : `${stats.total - stats.done} à débloquer`}</div>
        <h3>${stats.isComplete ? `Monde ${meta.num} terminé !` : `Continuez votre aventure`}</h3>
        <p>${stats.isComplete
          ? (hasNext ? `Le monde ${meta.num + 1} t'attend.` : `Tu as conquis tous les mondes — bravo !`)
          : (hasNext ? `Termine ce monde pour débloquer le suivant.` : `Le sommet du parcours t'attend.`)}</p>
      </div>

      ${stats.isComplete ? renderChest({ worldNum: meta.num, worldName: meta.name, color: meta.color, opened: isChestOpened(meta.num) }) : ''}

      ${stats.isComplete ? `
        <!-- Boss de fin de monde (placeholder pour examen blanc) -->
        <div class="pc3-boss" data-world="${meta.num}">
          <div class="pc3-boss-glow"></div>
          <div class="pc3-boss-em">🏆</div>
          <div class="pc3-boss-lbl">BOSS — EXAMEN BLANC</div>
          <div class="pc3-boss-name">Monde ${meta.num} · ${esc(meta.name)}</div>
          <button class="pc3-boss-cta" data-boss="${meta.num}" type="button">AFFRONTER →</button>
        </div>
      ` : ''}

      ${hasNext ? '<div class="pc3-bridge"></div>' : ''}
    </section>
  `;
}

function renderPortalArch(color, isComplete) {
  // Arc gothique stylisé (premium, pas cartoon)
  return `
    <div class="pc3-portal-arch">
      <svg viewBox="0 0 130 170" xmlns="http://www.w3.org/2000/svg">
        <!-- Fill background subtil -->
        <path class="arch-bg"
              d="M 20 170 L 20 80 Q 20 20, 65 20 Q 110 20, 110 80 L 110 170 Z" />
        <!-- Stroke outline -->
        <path class="arch-stroke"
              d="M 20 170 L 20 80 Q 20 20, 65 20 Q 110 20, 110 80 L 110 170" />
        <!-- Light line (dashed, blanc) -->
        <path class="arch-light"
              d="M 30 170 L 30 80 Q 30 30, 65 30 Q 100 30, 100 80 L 100 170" />
        ${isComplete ? `
          <!-- Star burst si terminé -->
          <circle cx="65" cy="70" r="5" fill="${color}" opacity=".9" />
          <circle cx="65" cy="70" r="12" fill="none" stroke="${color}" stroke-width="1.5" opacity=".5">
            <animate attributeName="r" values="6;20" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values=".8;0" dur="2s" repeatCount="indefinite" />
          </circle>
        ` : ''}
      </svg>
    </div>
  `;
}

function renderFinal(g) {
  return `
    <div class="pc3-final reveal">
      <h3>Bout du voyage : Examen</h3>
      <p>Quand toutes tes compétences sont acquises, prépare-toi à l'épreuve.</p>
      <div class="pc3-final-stats">
        <div class="pc3-final-stat">
          <div class="v">${g.done}<small style="font-size:14px;opacity:.6">/${g.total}</small></div>
          <div class="l">Compétences</div>
        </div>
        <div class="pc3-final-stat">
          <div class="v">${g.xp}</div>
          <div class="l">XP totaux</div>
        </div>
        <div class="pc3-final-stat">
          <div class="v">${g.trophies}<small style="font-size:14px;opacity:.6">/4</small></div>
          <div class="l">Trophées</div>
        </div>
      </div>
    </div>
  `;
}

function shortLabel(text) {
  // Labels sur 1 ligne avec ellipsis → ~20 chars max pour lisibilité
  if (!text) return '';
  if (text.length <= 20) return text;
  const cut = text.slice(0, 18);
  const parts = cut.split(' ');
  if (parts.length > 1) return parts.slice(0, -1).join(' ') + '…';
  return cut + '…';
}
function statusGlyph(st) {
  return ({ done: '✓', active: '⌁', review: '!', locked: '🔒' })[st] || '';
}

// ─── Wire ───
function wire(root) {
  root.querySelector('#pc3-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/accueil');
  });

  // Game HUD : streak modal + bouton coffres
  wireGameHUD(root, {
    onChestsClick: () => {
      const stats = computeGameStats();
      if (stats.availableChests.length === 0) {
        lootToast({ icon: '🎁', label: 'Aucun coffre dispo', subLabel: 'Termine un monde pour en débloquer', kind: '' });
        return;
      }
      // Scroll vers le 1er coffre dispo
      const first = stats.availableChests[0];
      const el = root.querySelector(`[data-chest-world="${first}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el?.click(), 700);
    },
  });

  // Nodes : tap → ouvre fiche + loot toast si déjà acquis
  root.querySelectorAll('.pc3-node:not(.locked)').forEach(n => {
    n.addEventListener('click', () => {
      const st = n.classList.contains('done') ? 'done' : n.classList.contains('active') ? 'active' : 'review';
      openFiche(root, n.dataset.comp, n.dataset.world);

      // Loot toast distinct pour les nodes acquis (pas spammer les tap successifs)
      if (st === 'done') {
        const compId = n.dataset.comp;
        const k = `pc-loot-${compId}`;
        if (!sessionStorage.getItem(k)) {
          lootToast({ icon: '⚡', label: '+100 XP', subLabel: 'Compétence acquise', kind: 'success' });
          sessionStorage.setItem(k, '1');
        }
      }
    });
  });

  // Boutons Coffres (cards inline) → ouvrent le modal d'ouverture
  root.querySelectorAll('[data-chest-world]').forEach(el => {
    if (el.classList.contains('opened')) return;
    const onActivate = () => {
      const worldNum = parseInt(el.dataset.chestWorld, 10);
      const meta = WORLDS_META[worldNum - 1];
      openChestModal({ worldNum, worldName: meta?.name || `Monde ${worldNum}` });
      // Re-render après fermeture pour montrer le coffre comme "ouvert"
      setTimeout(() => {
        if (!document.querySelector('.chest-modal')) {
          el.classList.remove('unlocked');
          el.classList.add('opened');
          el.querySelector('.chest-lbl').textContent = '✓ Coffre ouvert';
          const cta = el.querySelector('.chest-cta');
          if (cta) cta.remove();
        }
      }, 400);
    };
    el.addEventListener('click', onActivate);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); }
    });
  });

  // Boutons Boss (placeholder examen blanc)
  root.querySelectorAll('[data-boss]').forEach(b => {
    b.addEventListener('click', () => {
      lootToast({
        icon: '🚧',
        label: 'Examen blanc — Bientôt',
        subLabel: 'Tu pourras affronter cet examen prochainement',
        kind: 'levelup',
      });
    });
  });

  const sheet = root.querySelector('#pc3-sheet');
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.classList.remove('show'); });
}

function openFiche(root, compId, worldIdxStr) {
  const worldIdx = parseInt(worldIdxStr, 10);
  const cat = REMC[worldIdx];
  const meta = WORLDS_META[worldIdx];
  const sub = cat?.subs.find(s => s.c === compId);
  if (!sub || !cat) return;

  const e = entryFor(compId);
  const st = statusFor(compId);
  const stLabel = ({ done: 'Compétence acquise', active: "En cours d'acquisition", review: 'À retravailler', locked: 'Verrouillée' })[st];
  const stEmoji = ({ done: '✓', active: '⌁', review: '!', locked: '🔒' })[st];
  const idx = cat.subs.findIndex(x => x.c === compId) + 1;

  const xpGagne = st === 'done' ? 100 : 0;
  const validatedAgo = e?.validated_at ? formatAgo(e.validated_at) : null;

  const panel = root.querySelector('#pc3-sheet-panel');
  panel.innerHTML = `
    <style>
      /* Style dopamine pour les comp ACQUISES — confettis-ready, gaming feel */
      .fiche-hero.done-celebrate{background:radial-gradient(120% 80% at 50% 0%,#10b981 0%,#065f46 60%,#0b0d1a 100%) !important}
      .fiche-hero.done-celebrate::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,rgba(255,255,255,.18),transparent 60%);pointer-events:none;animation:fiche-shine 3s ease-in-out infinite}
      @keyframes fiche-shine{0%,100%{opacity:.5}50%{opacity:1}}
      .fiche-circle.done-circle{background:#fff !important;color:var(--gr) !important;font-size:48px !important;animation:fiche-pop .55s cubic-bezier(.5,1.6,.4,1) both,fiche-spin 8s linear infinite 1s;box-shadow:0 16px 40px -8px rgba(16,185,129,.6),0 0 0 6px rgba(16,185,129,.18) !important}
      @keyframes fiche-pop{0%{transform:scale(.3) rotate(-180deg);opacity:0}60%{transform:scale(1.15) rotate(10deg);opacity:1}100%{transform:scale(1) rotate(0)}}
      @keyframes fiche-spin{0%{filter:drop-shadow(0 0 8px rgba(16,185,129,.4))}50%{filter:drop-shadow(0 0 24px rgba(16,185,129,.8))}100%{filter:drop-shadow(0 0 8px rgba(16,185,129,.4))}}
      .xp-burst{position:absolute;top:48%;left:50%;transform:translate(-50%,-50%);font-family:var(--fd);font-size:34px;font-weight:900;color:#fde68a;text-shadow:0 4px 12px rgba(245,158,11,.5);animation:xp-fly 1.4s cubic-bezier(.2,.7,.3,1) both;animation-delay:.4s;pointer-events:none;letter-spacing:-.02em}
      @keyframes xp-fly{0%{opacity:0;transform:translate(-50%,20px) scale(.5)}25%{opacity:1;transform:translate(-50%,0) scale(1.2)}80%{opacity:1;transform:translate(-50%,-90px) scale(1)}100%{opacity:0;transform:translate(-50%,-130px) scale(.9)}}
      .stt-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:99px;font-family:var(--fn);font-size:10.5px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;backdrop-filter:blur(8px)}
      .stt-pill.done{background:rgba(255,255,255,.95);color:var(--gr);box-shadow:0 6px 16px -4px rgba(0,0,0,.3)}
      .stt-pill.active{background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.3)}
      .stt-pill.review{background:#fde68a;color:#92400e}
      .stt-pill.locked{background:rgba(148,163,184,.3);color:rgba(255,255,255,.75)}
    </style>
    <div class="fiche-hero ${st === 'done' ? 'done-celebrate' : ''}" style="--w-color:${meta.color}">
      <button class="close" aria-label="Fermer">×</button>
      <div class="badge-cat">MONDE ${meta.num} · ${esc(meta.name).toUpperCase()}</div>
      <div class="fiche-circle ${st === 'done' ? 'done-circle' : ''}">${stEmoji}</div>
      ${st === 'done' ? `<div class="xp-burst">+${xpGagne} XP</div>` : ''}
      <h3>${esc(sub.n)}</h3>
      <div class="id">${esc(compId.toUpperCase())} · CHECKPOINT ${idx}/${cat.subs.length}</div>
      <div class="stt"><span class="stt-pill ${st}">${stEmoji} ${stLabel}</span></div>
    </div>
    <div class="fiche-body">
      <div class="fiche-section">
        <div class="lbl">OBJECTIF</div>
        <div class="txt">${esc(sub.n)}. Compétence du programme REMC officiel.</div>
      </div>
      <div class="fiche-section">
        <div class="meta-row"><span class="l">Identifiant</span><span class="v">${esc(compId.toUpperCase())}</span></div>
        <div class="meta-row"><span class="l">Monde</span><span class="v">${meta.num} · ${esc(meta.name)}</span></div>
        <div class="meta-row"><span class="l">Statut</span><span class="v">${stLabel}</span></div>
        ${st === 'done' ? `<div class="meta-row"><span class="l">XP gagnés</span><span class="v" style="color:var(--am);font-weight:800">+${xpGagne} XP ⚡</span></div>` : ''}
        ${e && e.validated_at ? `<div class="meta-row"><span class="l">Validée</span><span class="v">${validatedAgo} · ${new Date(e.validated_at).toLocaleDateString('fr-FR')}</span></div>` : ''}
      </div>
      ${e && e.note ? `
        <div class="fiche-section">
          <div class="lbl">DERNIER RETOUR MONITEUR</div>
          <div class="txt" style="font-style:italic">« ${esc(e.note)} »</div>
        </div>` : ''}
    </div>
  `;
  const sheet = root.querySelector('#pc3-sheet');
  sheet.classList.add('show');
  panel.querySelector('.close').onclick = () => sheet.classList.remove('show');

  // Confetti dopamine quand on ouvre une comp acquise (1× par session pour pas overcharger)
  if (st === 'done') {
    const seenKey = `pc-confetti-${compId}`;
    if (!sessionStorage.getItem(seenKey)) {
      setTimeout(() => {
        const circle = panel.querySelector('.fiche-circle');
        if (circle) burstConfettiFromElement(circle, { count: 50, power: 12, spread: Math.PI });
      }, 400);
      sessionStorage.setItem(seenKey, '1');
    }
  }
}

/** Formatte une date ISO en "il y a X jours/heures". */
function formatAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!then) return '';
  const diffMs = Date.now() - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `il y a ${diffD}j`;
  if (diffD < 30) return `il y a ${Math.round(diffD / 7)} sem`;
  return `il y a ${Math.round(diffD / 30)} mois`;
}
