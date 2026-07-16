// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Mon permis » : la route vers le VRAI permis (chantier 5,
// nav simplifiée, maquette validée Rayan : mockups/nav-mon-permis-A.html,
// variante A « La Route » — timeline sérieuse en 3 étapes).
//
// Décision produit ferme (2026-07) : le JEU et le SÉRIEUX sont séparés.
//   - La route immersive (mondes/boss/coffres de parcours.js) RESTE à
//     #/parcours, accessible par Réviser → « Jouer ». Elle n'apparaît PAS
//     ici.
//   - « Mon permis » devient la route crédible : ce que le moniteur a
//     VALIDÉ en leçon (table `validations`), les comptes-rendus reçus, et
//     l'examen. Zéro XP/mondes/coffres dans cet écran.
//
// Grammaire éditoriale (fidèle à la maquette, façon Carnet) : timeline 3
// étapes, numéros violets + filet vertical — PAS de médaillon-monde/route
// SVG (ça, c'est le langage du jeu).
//
// Réutilisation (ne duplique PAS la grosse logique métier des pages
// dédiées — même doctrine que recompenses.js) :
//   ① Mes compétences → `computeWorldStates()` EXPORTÉE de parcours.js
//     (mêmes seuils de déblocage, mêmes 4 chapitres, zéro seuil réécrit).
//   ③ L'examen → `loadData/buildCriteria/buildVerdict/parseSavedDate/
//     saveExamDate/countdown/fmtDate` EXPORTÉS de examen.js (la readiness
//     reste GELÉE : un seul calcul dans toute l'app, jamais un « prêt à
//     X % » inventé ici).
//   ② Mes leçons → `fetchLastCompteRendu()` EXPORTÉE de accueil.js (même
//     table `comptes_rendus`, même tri).
// Ces 3 pages sœurs sont IMPORTÉES DYNAMIQUEMENT (jamais en import statique
// en tête de fichier) : parcours.js/accueil.js sont de GROS chunks (chest,
// sheet-swipe, league-hero, heatmap…) — un import statique les fusionnerait
// dans le chunk de ce hub, alors que #/parcours et #/accueil ont déjà leur
// propre chunk chargé par le router. Même raisonnement que le commentaire
// de reviser.js sur exam-blanc.js, appliqué via import() plutôt que
// duplication (les seuils/la readiness ne doivent JAMAIS diverger).
//
// Le centre d'examen (entrée finale) pointe vers #/centre-examen dans son
// état ACTUEL (CENTRES_PREMIUM_LOCKED = false dans centre-examen.js) :
// PAS de pastille PermiGo+ ni de cadenas — la maquette montre un état futur
// (module verrouillable), on ne l'invente pas ici.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { REMC_TOTAL } from "@/data/remc.js";

const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;

function ordinalOrPlural(n, singular, plural) {
  return n > 1 ? plural : singular;
}

// ─── STYLE (scopé .mp-*, tokens theme-aware — jamais --surface/--border/--muted) ──
const STYLE = `<style>
.mp {
  --gold-1:#ffe9a8; --gold-2:#ffd24a; --gold-3:#ff9c1c; --gold-deep:#c87d12; --gold-ink:#7a5510;
  max-width: 480px; margin: 0 auto; padding: 14px 15px 32px;
  font-family: 'Nunito', system-ui, sans-serif; color: var(--ink);
  background:
    radial-gradient(120% 40% at 22% -6%, color-mix(in srgb, var(--a) 10%, transparent) 0%, transparent 58%),
    radial-gradient(110% 36% at 96% 0%, rgba(255,180,40,.12) 0%, transparent 55%),
    var(--bg);
}
.mp-title { font: 800 26px/1.1 'Baloo 2', cursive; letter-spacing: .2px; margin: 4px 2px 14px; }

/* ── Chip moniteur : la preuve que c'est LUI qui valide ── */
.mp-monit {
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 14px;
  padding: 5px 13px 5px 6px; border-radius: 999px;
  background: color-mix(in srgb, var(--a) 10%, var(--su)); border: 1px solid color-mix(in srgb, var(--a) 30%, transparent);
}
.mp-mavatar {
  width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; flex: none;
  font: 800 12px/1 'Baloo 2', cursive; color: var(--a-ink);
  background: linear-gradient(180deg, var(--a), var(--adk)); box-shadow: 0 2px 5px color-mix(in srgb, var(--adk) 45%, transparent);
}
.mp-monit b { font-size: 12.5px; font-weight: 800; color: var(--a-txt); }
.mp-monit i { font-size: 11.5px; font-weight: 700; font-style: normal; color: var(--mu2); }

/* ══ HERO — LE PERMIS VIRTUEL ══ */
.mp-hero {
  position: relative; border: 1.5px solid color-mix(in srgb, var(--a) 26%, var(--bo)); border-radius: 26px;
  padding: 17px 16px 16px; margin-bottom: 20px; overflow: hidden;
  background:
    radial-gradient(130% 80% at 88% 0%, color-mix(in srgb, var(--a) 14%, transparent) 0%, transparent 55%),
    radial-gradient(90% 70% at 6% 100%, rgba(255,210,74,.10) 0%, transparent 60%),
    var(--su);
  box-shadow: inset 0 2px 0 rgba(255,255,255,.06), 0 6px 20px -14px rgba(0,0,0,.35);
}
.mp-hero-k {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; margin-bottom: 11px;
  background: linear-gradient(180deg, var(--a), var(--adk)); box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
  font: 600 10px/1 'Fredoka', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--a-ink);
}
.mp-hero-row { display: flex; align-items: center; gap: 14px; }
.mp-hero-txt { flex: 1; min-width: 0; }
.mp-hero-t { font: 800 30px/1 'Baloo 2', cursive; color: var(--ink); }
.mp-hero-t small { font-size: 16px; font-weight: 800; color: var(--mu2); }
.mp-hero-lbl { margin-top: 3px; font-size: 13px; font-weight: 800; color: var(--mu); }
.mp-hero-s { margin-top: 7px; font-size: 11.5px; font-weight: 700; color: var(--mu2); line-height: 1.4; }
.mp-hero-med { flex: none; filter: drop-shadow(0 8px 12px rgba(50,40,110,.3)); }
.mp-hero-track {
  margin-top: 13px; height: 10px; border-radius: 6px; background: var(--bg2); overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(50,40,110,.12);
}
.mp-hero-track i {
  display: block; height: 100%; border-radius: 6px;
  background: linear-gradient(90deg, var(--adk), var(--a)); box-shadow: 0 0 10px color-mix(in srgb, var(--a) 50%, transparent);
  transition: width .6s var(--ease, ease);
}
.mp-hero-foot { display: flex; justify-content: space-between; margin-top: 7px; gap: 8px; font-size: 10.5px; font-weight: 800; color: var(--mu2); }
.mp-hero-foot b { color: var(--a-txt); }

/* ══ TIMELINE — numéros violets + filet ══ */
.mp-tl { position: relative; }
.mp-step { position: relative; padding: 0 0 26px 44px; }
.mp-step:last-child { padding-bottom: 6px; }
.mp-step::before {
  content: ""; position: absolute; left: 15px; top: 36px; bottom: -2px; width: 2px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--a) 35%, transparent), color-mix(in srgb, var(--a) 12%, transparent));
}
.mp-step:last-child::before { display: none; }
.mp-step-num {
  position: absolute; left: 0; top: 0; width: 32px; height: 32px; border-radius: 50%;
  display: grid; place-items: center; font: 800 15px/1 'Baloo 2', cursive; color: var(--a-ink);
  background: linear-gradient(180deg, var(--a), var(--adk));
  border: 2px solid var(--su); box-shadow: 0 3px 0 var(--adk), 0 8px 14px -6px color-mix(in srgb, var(--adk) 50%, transparent);
}
.mp-step-h { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-height: 32px; padding-top: 4px; margin-bottom: 10px; }
.mp-step-t { font: 800 17px/1 'Baloo 2', cursive; }
.mp-step-s { font-size: 10.5px; font-weight: 800; color: var(--mu2); text-align: right; }

/* ── Étape 1 : les 4 blocs C1-C4 ── */
.mp-comps { display: flex; flex-direction: column; gap: 9px; }
.mp-comp {
  display: flex; align-items: center; gap: 12px; padding: 11px 13px; border-radius: 17px; cursor: pointer;
  background: var(--su); border: 1px solid var(--bo); font: inherit; color: inherit; text-align: left;
  box-shadow: 0 4px 0 var(--bg2), 0 1px 2px rgba(10,13,26,.04);
  transition: transform .16s cubic-bezier(.23,1,.32,1); min-height: 44px;
}
.mp-comp:active { transform: translateY(2px); }
.mp-comp-b { flex: 1; min-width: 0; }
.mp-comp-t { font: 700 14px/1.12 'Baloo 2', cursive; }
.mp-comp-bar { margin-top: 6px; height: 6px; border-radius: 4px; background: var(--bg2); overflow: hidden; }
.mp-comp-bar i { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--adk), var(--a)); }
.mp-comp.done .mp-comp-bar i { background: linear-gradient(90deg, var(--grd), var(--gr)); }
.mp-comp-n { flex: none; text-align: right; }
.mp-comp-n b { display: block; font: 800 14px/1 'Baloo 2', cursive; color: var(--a-txt); }
.mp-comp.done .mp-comp-n b { color: var(--gr-txt); }
.mp-comp.locked .mp-comp-n b { color: var(--mu2); }
.mp-comp-n span { font-size: 9px; font-weight: 800; color: var(--mu2); text-transform: uppercase; letter-spacing: .06em; }
.mp-comp.locked { opacity: .72; }
.mp-comp.locked .mp-comp-t { color: var(--mu); }

.mp-hstat {
  display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 10px 13px; border-radius: 15px;
  background: var(--su); border: 1px solid var(--bo); box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.mp-hstat p { flex: 1; font-size: 12px; font-weight: 800; color: var(--mu); }
.mp-hstat p b { color: var(--ink); }

.mp-renvoi {
  display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 10px; padding: 11px 13px; border-radius: 15px; cursor: pointer;
  background: color-mix(in srgb, var(--a) 8%, var(--su)); border: 1px dashed color-mix(in srgb, var(--a) 40%, transparent);
  font: inherit; color: inherit; text-align: left; min-height: 44px;
}
.mp-renvoi p { flex: 1; font-size: 12px; font-weight: 800; color: var(--a-txt); line-height: 1.35; }
.mp-renvoi p i { display: block; font-style: normal; font-size: 10.5px; font-weight: 700; color: var(--mu2); margin-top: 2px; }
.mp-renvoi svg { width: 16px; height: 16px; flex: none; color: var(--a-txt); }

/* ── Étape 2 : mes leçons (comptes-rendus) ── */
.mp-cr {
  display: block; width: 100%; padding: 13px 14px; border-radius: 19px; cursor: pointer; text-align: left; font: inherit; color: inherit;
  background: var(--su); border: 1px solid var(--bo); box-shadow: 0 4px 0 var(--bg2), 0 1px 2px rgba(10,13,26,.04);
  min-height: 44px;
}
.mp-cr-top { display: flex; align-items: center; gap: 8px; }
.mp-cr-date { font: 800 14.5px/1.2 'Baloo 2', cursive; flex: 1; }
.mp-cr-new {
  padding: 3px 9px; border-radius: 999px; flex: none; font: 600 8.5px/1 'Fredoka', sans-serif;
  letter-spacing: .1em; text-transform: uppercase; color: var(--a-ink);
  background: linear-gradient(180deg, var(--a), var(--adk)); box-shadow: 0 2px 6px color-mix(in srgb, var(--adk) 45%, transparent);
}
.mp-cr-chips { display: flex; gap: 7px; margin-top: 9px; flex-wrap: wrap; }
.mp-cr-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }
.mp-cr-chip.ok { background: var(--grp); color: var(--gr-txt); border: 1px solid color-mix(in srgb, var(--gr) 25%, transparent); }
.mp-cr-chip.warn { background: var(--amp); color: var(--am-txt); border: 1px solid color-mix(in srgb, var(--am) 25%, transparent); }
.mp-cr-note {
  margin-top: 10px; padding: 9px 12px; border-radius: 12px; background: var(--bg2); border-left: 3px solid var(--a);
  font-size: 12px; font-weight: 700; color: var(--mu); line-height: 1.45; font-style: italic;
}
.mp-cr-note b { color: var(--ink); font-style: normal; }
.mp-cr-empty { padding: 16px 14px; border-radius: 19px; background: var(--su); border: 1px dashed var(--bo); text-align: center; }
.mp-cr-empty p { font-size: 12.5px; font-weight: 700; color: var(--mu); line-height: 1.5; }

.mp-linkrow {
  display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 9px; padding: 11px 13px; border-radius: 15px; cursor: pointer;
  background: var(--su); border: 1px solid var(--bo); box-shadow: 0 1px 2px rgba(10,13,26,.04); font: inherit; color: inherit; text-align: left;
  min-height: 44px;
}
.mp-linkrow p { flex: 1; font-size: 12.5px; font-weight: 800; }
.mp-linkrow p i { display: block; font-style: normal; font-size: 10.5px; font-weight: 700; color: var(--mu2); margin-top: 2px; }
.mp-linkrow svg { width: 16px; height: 16px; flex: none; color: var(--mu2); }

/* ── Étape 3 : l'examen ── */
.mp-exam {
  padding: 14px; border-radius: 20px; margin-bottom: 9px;
  background:
    radial-gradient(120% 80% at 85% 0%, rgba(255,210,74,.16) 0%, transparent 55%),
    var(--su);
  border: 1.5px solid color-mix(in srgb, var(--gold-deep) 35%, var(--bo)); box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.mp-exam-top { display: flex; align-items: center; gap: 12px; }
.mp-exam-cd {
  flex: none; width: 74px; padding: 9px 4px 7px; border-radius: 15px; text-align: center;
  background: color-mix(in srgb, var(--gold-1) 30%, var(--su)); border: 1px solid color-mix(in srgb, var(--gold-deep) 40%, transparent);
}
.mp-exam-cd b { display: block; font: 800 26px/1 'Baloo 2', cursive; color: var(--gold-ink); }
.mp-exam-cd span { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--gold-deep); }
.mp-exam-tb { flex: 1; min-width: 0; }
.mp-exam-t { font: 800 15.5px/1.15 'Baloo 2', cursive; }
.mp-exam-d { font-size: 11.5px; font-weight: 800; color: var(--mu); margin-top: 3px; }
.mp-exam-edit {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; padding: 5px 10px; border-radius: 999px;
  border: 1px solid var(--bo); background: var(--su); cursor: pointer; font: 800 10.5px/1 'Nunito', sans-serif; color: var(--mu);
  min-height: 30px;
}
.mp-exam-date-wrap { display: none; margin-top: 10px; align-items: center; gap: 8px; }
.mp-exam-date-wrap.open { display: flex; }
.mp-exam-date-input {
  flex: 1; border: 1.5px solid var(--bo); border-radius: 12px; padding: 9px 12px; font: 500 13px/1 'Inter', sans-serif;
  color: var(--ink); background: var(--bg); outline: none; min-height: 40px;
}
.mp-exam-date-save {
  padding: 9px 14px; background: var(--a); color: var(--a-ink); border: 0; border-radius: 12px;
  font: 700 12.5px/1 'Nunito', sans-serif; cursor: pointer; min-height: 40px;
}
.mp-exam-nodate { text-align: center; padding: 6px 0 2px; }
.mp-exam-nodate p { font: 600 12.5px/1.4 'Inter', sans-serif; color: var(--mu); margin-bottom: 10px; }

.mp-verdict {
  display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; padding: 10px 12px; border-radius: 13px;
  font-size: 11.5px; font-weight: 800; line-height: 1.4;
}
.mp-verdict.high { background: var(--grp2); color: var(--grk2); }
.mp-verdict.mid  { background: #fef9c3; color: #a16207; }
.mp-verdict.low  { background: var(--amp); color: var(--am-txt); }
.mp-verdict svg { flex: none; margin-top: 1px; }

.mp-prep { margin-top: 10px; display: flex; flex-direction: column; gap: 7px; }
.mp-prep-h { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--mu2); margin: 2px 2px 1px; }
.mp-crit { display: flex; align-items: center; gap: 10px; padding: 8px 11px; border-radius: 13px; background: var(--su); border: 1px solid var(--bo); }
.mp-crit.pass { background: var(--grp); border-color: color-mix(in srgb, var(--gr) 24%, transparent); }
.mp-crit.fail { background: var(--amp); border-color: color-mix(in srgb, var(--am) 24%, transparent); }
.mp-crit p { flex: 1; font-size: 11.5px; font-weight: 800; line-height: 1.25; }
.mp-crit p i { display: block; font-style: normal; font-size: 10px; font-weight: 700; color: var(--mu2); margin-top: 1px; }
.mp-crit.pass p i { color: var(--gr-txt); opacity: .85; }
.mp-crit.fail p i { color: var(--am-txt); opacity: .85; }
.mp-crit-b { flex: none; font: 800 12px/1 'Baloo 2', cursive; padding: 3px 8px; border-radius: 8px; }
.mp-crit.pass .mp-crit-b { background: var(--grp2); color: var(--grk2); }
.mp-crit.fail .mp-crit-b { background: #fbe5c4; color: var(--am-txt); }
.mp-crit.neutral .mp-crit-b { background: var(--bg2); color: var(--mu3); }

.mp-centre {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 13px; border-radius: 17px; cursor: pointer;
  background: var(--su); border: 1px solid var(--bo); box-shadow: 0 1px 2px rgba(10,13,26,.04);
  font: inherit; color: inherit; text-align: left; text-decoration: none; min-height: 44px;
}
.mp-centre svg { width: 16px; height: 16px; flex: none; color: var(--mu2); }
.mp-centre-b { flex: 1; min-width: 0; }
.mp-centre-t { font: 700 14px/1 'Baloo 2', cursive; }
.mp-centre-s { font-size: 10.5px; font-weight: 700; color: var(--mu2); margin-top: 2px; line-height: 1.35; }

.mp-err {
  padding: 24px 18px; border-radius: 18px; background: var(--su); border: 1px solid var(--bo); text-align: center;
}
.mp-err p { font: 600 13px/1.5 'Inter', sans-serif; color: var(--mu3); margin: 8px 0 12px; }
.mp-err button {
  padding: 10px 20px; border: 0; border-radius: 12px; background: var(--a); color: var(--a-ink);
  font: 700 13px/1 'Inter', sans-serif; cursor: pointer; min-height: 40px;
}

/* ── Skeleton ── */
.mp-skel { border-radius: 18px; background: var(--bg2); }
@keyframes mpPulse { 0%,100% { opacity: .55; } 50% { opacity: .9; } }
.mp-skel { animation: mpPulse 1.3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .mp-comp, .mp-hero-track i { transition: none; }
  .mp-skel { animation: none; }
}
</style>`;

// ─── Skeleton ─────────────────────────────────────────────────
function skeleton() {
  return `${STYLE}<div class="mp">
    <h1 class="mp-title" tabindex="-1">Mon permis</h1>
    <div class="mp-skel" style="height:170px;margin-bottom:20px"></div>
    <div class="mp-skel" style="height:220px;margin-bottom:20px"></div>
    <div class="mp-skel" style="height:140px;margin-bottom:20px"></div>
    <div class="mp-skel" style="height:280px"></div>
  </div>`;
}

// ─── Petits helpers de format (locaux, pas de dépendance page→page) ────
function fmtHeures(totalMin) {
  const h = Math.round((totalMin / 60) * 10) / 10;
  return Number.isInteger(h) ? String(h) : String(h).replace(".", ",");
}

function fmtDateFR(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  const dt = y && m && d ? new Date(y, m - 1, d) : new Date(iso);
  return dt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Médaillon d'un chapitre selon son état — grammaire dédiée « permis
// virtuel » (check/vert = acquis, étoile/or = en cours, cadenas/slate =
// à venir), distincte des médaillons-monde du jeu (parcours.js).
function chapMedallion(status) {
  if (status === "complete") return medallion("check", "green", { size: 40 });
  if (status === "locked") return medallion("cadenas", "slate", { size: 40 });
  return medallion("etoile", "gold", { size: 40 });
}

// ─── Chip moniteur ───────────────────────────────────────────────
function renderChip(moniteurPrenom) {
  if (!moniteurPrenom) return "";
  const initial = (moniteurPrenom[0] || "?").toUpperCase();
  return `<div class="mp-monit">
    <span class="mp-mavatar" aria-hidden="true">${esc(initial)}</span>
    <b>Suivi par ${esc(moniteurPrenom)}</b><i>· validé en leçon</i>
  </div>`;
}

// ─── Hero — permis virtuel ─────────────────────────────────────
function renderHero({ totalAcquis, currentTitre, allDone }) {
  const pct = REMC_TOTAL > 0 ? Math.round((totalAcquis / REMC_TOTAL) * 100) : 0;
  const chapLabel = allDone ? "Tous les chapitres validés" : currentTitre || "";
  return `<section class="mp-hero">
    <span class="mp-hero-k">La route vers le vrai permis</span>
    <div class="mp-hero-row">
      <div class="mp-hero-txt">
        <div class="mp-hero-t">${totalAcquis} <small>sur ${REMC_TOTAL}</small></div>
        <div class="mp-hero-lbl">compétences validées</div>
        <div class="mp-hero-s">Par ton moniteur, en leçon — c'est ta vraie progression.</div>
      </div>
      <span class="mp-hero-med" aria-hidden="true">${medallion("trophee", "gold", { size: 68 })}</span>
    </div>
    <div class="mp-hero-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${totalAcquis} compétences sur ${REMC_TOTAL}"><i style="width:${pct}%"></i></div>
    <div class="mp-hero-foot">
      <span>Chapitre en cours : <b>${esc(chapLabel)}</b></span>
      <span>${pct}&nbsp;%</span>
    </div>
  </section>`;
}

// ─── Étape 1 : mes compétences ─────────────────────────────────
function renderStep1({
  worldStates,
  step1Failed,
  totalMin,
  nbLecons,
  moniteurPrenom,
}) {
  if (step1Failed) {
    return `<section class="mp-step" id="mp-step-comps">
      <span class="mp-step-num" aria-hidden="true">1</span>
      <div class="mp-step-h"><h2 class="mp-step-t">Mes compétences</h2></div>
      <div class="mp-err">
        <p>« Mes compétences » indisponible. Vérifie ta connexion, puis réessaie.</p>
        <button id="mp-retry-1" type="button">Réessayer</button>
      </div>
    </section>`;
  }

  const compsHtml = worldStates
    .map((ws) => {
      const cls =
        ws.status === "complete"
          ? "done"
          : ws.status === "locked"
            ? "locked"
            : "";
      const pct = ws.total ? Math.round((ws.done / ws.total) * 100) : 0;
      const lbl =
        ws.status === "complete"
          ? "acquis"
          : ws.status === "locked"
            ? "à venir"
            : "en cours";
      const titre = ws.world?.titre || "";
      return `<button class="mp-comp ${cls}" type="button" data-chap="${ws.idx}" aria-label="${escAttr(titre)} — ${ws.done} sur ${ws.total} ${lbl}">
        ${chapMedallion(ws.status)}
        <div class="mp-comp-b">
          <div class="mp-comp-t">${esc(titre)}</div>
          <div class="mp-comp-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
        </div>
        <div class="mp-comp-n"><b>${ws.done}/${ws.total}</b><span>${lbl}</span></div>
      </button>`;
    })
    .join("");

  const hstatHtml =
    nbLecons > 0
      ? `<div class="mp-hstat">
          ${medallion("horloge", "violet", { size: 30 })}
          <p><b>${esc(fmtHeures(totalMin))} h de conduite</b> · ${nbLecons} leçon${nbLecons > 1 ? "s" : ""}${moniteurPrenom ? ` avec ${esc(moniteurPrenom)}` : ""}</p>
        </div>`
      : "";

  return `<section class="mp-step" id="mp-step-comps">
    <span class="mp-step-num" aria-hidden="true">1</span>
    <div class="mp-step-h">
      <h2 class="mp-step-t">Mes compétences</h2>
      <span class="mp-step-s">les 4 chapitres du permis B</span>
    </div>
    <div class="mp-comps">${compsHtml}</div>
    ${hstatHtml}
    <button class="mp-renvoi" id="mp-btn-reviser" type="button">
      ${medallion("eclair", "gold", { size: 28 })}
      <p>Envie de t'entraîner ? Direction Réviser.
        <i>Ici, c'est ta progression validée — l'entraînement se passe dans Réviser.</i></p>
      ${CHEVRON}
    </button>
  </section>`;
}

// ─── Étape 2 : mes leçons ───────────────────────────────────────
function renderStep2({ lastCR, crCount }) {
  let crHtml;
  if (lastCR) {
    const acquisN = (lastCR.acquis || []).length;
    const retrN = (lastCR.a_retravailler || []).length;
    const chips = [];
    if (acquisN > 0)
      chips.push(
        `<span class="mp-cr-chip ok">${medallion("check", "green", { size: 15 })}${acquisN} validée${acquisN > 1 ? "s" : ""}</span>`,
      );
    if (retrN > 0)
      chips.push(
        `<span class="mp-cr-chip warn">${medallion("cible", "orange", { size: 15 })}${retrN} à retravailler</span>`,
      );
    const noteHtml = lastCR.note
      ? `<div class="mp-cr-note">« ${esc(lastCR.note)} »</div>`
      : "";
    crHtml = `<button class="mp-cr" id="mp-cr-open" type="button" data-id="${escAttr(lastCR.id)}">
      <div class="mp-cr-top">
        <span class="mp-cr-date">Leçon du ${esc(fmtDateFR(lastCR.session_date || lastCR.created_at))}</span>
        ${!lastCR.read_at ? `<span class="mp-cr-new">Nouveau</span>` : ""}
      </div>
      ${chips.length ? `<div class="mp-cr-chips">${chips.join("")}</div>` : ""}
      ${noteHtml}
    </button>`;
  } else {
    crHtml = `<div class="mp-cr-empty"><p>Ton moniteur ne t'a pas encore envoyé de compte-rendu de leçon.</p></div>`;
  }

  const totalTxt =
    crCount > 0
      ? `${crCount} compte${ordinalOrPlural(crCount, "", "s")}-rendu${ordinalOrPlural(crCount, "", "s")}`
      : "Aucun compte-rendu pour l'instant";

  return `<section class="mp-step" id="mp-step-lecons">
    <span class="mp-step-num" aria-hidden="true">2</span>
    <div class="mp-step-h">
      <h2 class="mp-step-t">Mes leçons</h2>
      <span class="mp-step-s">les comptes-rendus de ton moniteur</span>
    </div>
    ${crHtml}
    <button class="mp-linkrow" id="mp-btn-toutes-lecons" type="button">
      ${medallion("livret", "violet", { size: 28 })}
      <p>Toutes mes leçons <i>${esc(totalTxt)}</i></p>
      ${CHEVRON}
    </button>
  </section>`;
}

// ─── Étape 3 : l'examen ─────────────────────────────────────────
const READINESS_ICON = {
  high: "check-circle",
  mid: "alert-triangle",
  low: "alert-circle",
};

function renderExamCountdown(examDate, examMod) {
  if (!examDate) {
    return `<div class="mp-exam-nodate">
      <p>Ajoute ta date d'examen pour lancer le compte à rebours.</p>
      <button class="mp-exam-edit" id="mp-exam-choose" type="button">${icon("calendar", { size: 14 })} Choisir ma date</button>
      <div class="mp-exam-date-wrap" id="mp-exam-date-wrap">
        <input type="date" class="mp-exam-date-input" id="mp-exam-date-input" />
        <button class="mp-exam-date-save" id="mp-exam-date-save" type="button">Enregistrer</button>
      </div>
    </div>`;
  }
  const cd = examMod.countdown(examDate);
  if (cd.passed) {
    return `<div class="mp-exam-top">
      <div class="mp-exam-cd"><b>${icon("check-circle", { size: 26, color: "var(--gr-txt)" })}</b><span>Passé</span></div>
      <div class="mp-exam-tb">
        <div class="mp-exam-t">Ton examen est passé</div>
        <div class="mp-exam-d">Bonne chance pour les résultats.</div>
        <button class="mp-exam-edit" id="mp-exam-choose" type="button">${icon("calendar", { size: 14 })} Changer la date</button>
        <div class="mp-exam-date-wrap" id="mp-exam-date-wrap">
          <input type="date" class="mp-exam-date-input" id="mp-exam-date-input" value="${examDate.toISOString().slice(0, 10)}" />
          <button class="mp-exam-date-save" id="mp-exam-date-save" type="button">Enregistrer</button>
        </div>
      </div>
    </div>`;
  }
  return `<div class="mp-exam-top">
    <div class="mp-exam-cd" aria-hidden="true"><b>${cd.days}</b><span>jour${cd.days > 1 ? "s" : ""}</span></div>
    <div class="mp-exam-tb">
      <div class="mp-exam-t">Ton examen approche</div>
      <div class="mp-exam-d">${esc(examMod.fmtDate(examDate))}</div>
      <button class="mp-exam-edit" id="mp-exam-choose" type="button">${icon("calendar", { size: 14 })} Modifier la date</button>
      <div class="mp-exam-date-wrap" id="mp-exam-date-wrap">
        <input type="date" class="mp-exam-date-input" id="mp-exam-date-input" value="${examDate.toISOString().slice(0, 10)}" />
        <button class="mp-exam-date-save" id="mp-exam-date-save" type="button">Enregistrer</button>
      </div>
    </div>
  </div>`;
}

function renderStep3({ examMod, examData, examDate }) {
  if (!examMod || examData?.loadFailed) {
    return `<section class="mp-step" id="mp-step-exam">
      <span class="mp-step-num" aria-hidden="true">3</span>
      <div class="mp-step-h"><h2 class="mp-step-t">L'examen</h2></div>
      <div class="mp-err">
        <p>« L'examen » indisponible. Vérifie ta connexion, puis réessaie.</p>
        <button id="mp-retry-3" type="button">Réessayer</button>
      </div>
    </section>`;
  }

  const verdict = examMod.buildVerdict(examData);
  const verdictHtml = `<div class="mp-verdict ${verdict.level}" role="status">
    ${icon(READINESS_ICON[verdict.level], { size: 18 })}
    <span>${esc(verdict.text)}</span>
  </div>`;

  const criteria = examMod.buildCriteria(examData);
  const critHtml = criteria
    .map((c) => {
      const cls = c.neutral ? "neutral" : c.pass ? "pass" : "fail";
      return `<div class="mp-crit ${cls}">
        <span aria-hidden="true">${c.ico}</span>
        <p>${esc(c.label)} <i>${esc(c.sub)}</i></p>
        <span class="mp-crit-b">${esc(c.badge)}</span>
      </div>`;
    })
    .join("");

  return `<section class="mp-step" id="mp-step-exam">
    <span class="mp-step-num" aria-hidden="true">3</span>
    <div class="mp-step-h">
      <h2 class="mp-step-t">L'examen</h2>
      <span class="mp-step-s">le jour J se prépare ici</span>
    </div>

    <div class="mp-exam">
      <div id="mp-exam-countdown-body">${renderExamCountdown(examDate, examMod)}</div>
      ${verdictHtml}
      <div class="mp-prep">
        <div class="mp-prep-h">Ta préparation</div>
        ${critHtml}
      </div>
    </div>

    <a class="mp-centre" id="mp-centre-link" href="#/centre-examen">
      ${medallion("carte", "blue", { size: 38 })}
      <div class="mp-centre-b">
        <div class="mp-centre-t">Ton centre d'examen</div>
        <div class="mp-centre-s">Difficulté, pièges du parcours, conseils sur place</div>
      </div>
      ${CHEVRON}
    </a>
  </section>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, ctx) {
  const { examMod } = ctx;

  root.querySelectorAll(".mp-comp[data-chap]").forEach((btn) => {
    btn.addEventListener("click", () => {
      haptic("tap");
      track("mon_permis.chapter_tap", { chap: btn.dataset.chap });
      navigate("/parcours");
    });
  });

  root.querySelector("#mp-btn-reviser")?.addEventListener("click", () => {
    haptic("tap");
    track("mon_permis.go_reviser");
    navigate("/reviser");
  });

  root.querySelector("#mp-cr-open")?.addEventListener("click", (e) => {
    haptic("tap");
    const id = e.currentTarget.dataset.id;
    track("mon_permis.compte_rendu_open", { cr_id: id });
    navigate(`/compte-rendu/${id}`);
  });

  root.querySelector("#mp-btn-toutes-lecons")?.addEventListener("click", () => {
    haptic("tap");
    track("mon_permis.toutes_lecons");
    navigate("/mes-lecons");
  });

  root
    .querySelector("#mp-retry-1")
    ?.addEventListener("click", () => mount(root));
  root
    .querySelector("#mp-retry-3")
    ?.addEventListener("click", () => mount(root));

  root.querySelector("#mp-centre-link")?.addEventListener("click", () => {
    track("mon_permis.centre_examen_open");
  });

  wireExamCountdown(root, examMod);
}

function wireExamCountdown(root, examMod) {
  if (!examMod) return;

  root.querySelector("#mp-exam-choose")?.addEventListener("click", () => {
    const wrap = root.querySelector("#mp-exam-date-wrap");
    wrap?.classList.add("open");
    root.querySelector("#mp-exam-date-input")?.focus();
  });

  root.querySelector("#mp-exam-date-save")?.addEventListener("click", () => {
    const input = root.querySelector("#mp-exam-date-input");
    const val = input?.value;
    if (!val) return;
    examMod.saveExamDate(val);
    track("mon_permis.exam_date_set", { date: val });
    const body = root.querySelector("#mp-exam-countdown-body");
    if (body) {
      const d = new Date(val);
      body.innerHTML = renderExamCountdown(d, examMod);
      wireExamCountdown(root, examMod);
    }
  });
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "mon_permis_hub", role: me.role });

  root.innerHTML = skeleton();

  // Import dynamique des pages sœurs (jamais statique — cf. commentaire de
  // tête de fichier). Démarré immédiatement, en parallèle des requêtes DB.
  const accueilModP = import("@/pages/eleve/accueil.js");
  const examModP = import("@/pages/eleve/examen.js");
  const parcoursModP = import("@/pages/eleve/parcours.js");
  const crP = accueilModP.then((m) => m.fetchLastCompteRendu(me));
  const examDataP = examModP.then((m) => m.loadData(me.id));

  const [
    valRes,
    profRes,
    sessRes,
    crCountRes,
    crRes,
    examDataRes,
    parcoursModRes,
    examModRes,
    selfValRes,
  ] = await Promise.allSettled([
    sb
      .from("validations")
      .select("competence_id, statut")
      .eq("eleve_id", me.id),
    // ⚠️ Pas d'embed self-join ici : PostgREST résout
    // `moniteur:profiles!enseignant_id(prenom)` dans le sens INVERSE
    // (to-many : « les profils dont je suis l'enseignant ») → tableau vide
    // pour un élève, et la chip ne s'affichait jamais. Deux requêtes plates,
    // couvertes par la policy profiles_select (élève lit les profils
    // enseignant/gerant de son école).
    (async () => {
      const { data: moi, error } = await sb
        .from("profiles")
        .select("enseignant_id")
        .eq("id", me.id)
        .maybeSingle();
      if (error || !moi?.enseignant_id) return { data: null };
      return sb
        .from("profiles")
        .select("prenom")
        .eq("id", moi.enseignant_id)
        .maybeSingle();
    })(),
    sb
      .from("sessions_moniteur")
      .select("duration_minutes")
      .eq("eleve_id", me.id)
      .in("confirmation_status", ["confirmed", "auto"]),
    sb
      .from("comptes_rendus")
      .select("id", { count: "exact", head: true })
      .eq("eleve_id", me.id),
    crP,
    examDataP,
    parcoursModP,
    examModP,
    // Validation autonome (élève SANS moniteur, pré-vente Pass Permis) :
    // table séparée de `validations`, fusionnée en LECTURE SEULE ci-dessous
    // pour que la progression du hub reste juste pour un compte solo.
    sb.from("self_validations").select("competence_id").eq("eleve_id", me.id),
  ]);

  const examMod = examModRes.status === "fulfilled" ? examModRes.value : null;
  const parcoursMod =
    parcoursModRes.status === "fulfilled" ? parcoursModRes.value : null;

  // ── Étape 1 : compétences ──
  const valOk = valRes.status === "fulfilled" && !valRes.value.error;
  const validatedMap = {};
  if (valOk) {
    for (const v of valRes.value.data || []) {
      if (v.statut === "acquis") validatedMap[v.competence_id] = true;
    }
  }
  if (selfValRes.status === "fulfilled" && !selfValRes.value.error) {
    for (const s of selfValRes.value.data || []) {
      if (!validatedMap[s.competence_id]) validatedMap[s.competence_id] = true;
    }
  }
  const step1Failed = !valOk || !parcoursMod;
  const worldStates = step1Failed
    ? []
    : parcoursMod.computeWorldStates(validatedMap);
  const totalAcquis = worldStates.reduce((n, w) => n + w.done, 0);
  const allDone =
    worldStates.length > 0 && worldStates.every((w) => w.status === "complete");
  let currentIdx = worldStates.findIndex((w) => w.status === "in_progress");
  if (currentIdx === -1) {
    let lastComplete = 0;
    worldStates.forEach((w, i) => {
      if (w.status === "complete") lastComplete = i;
    });
    currentIdx = lastComplete;
  }
  const currentTitre = worldStates[currentIdx]?.world?.titre || "";

  const moniteurPrenom =
    profRes.status === "fulfilled" ? profRes.value.data?.prenom || null : null;

  const sessRows =
    sessRes.status === "fulfilled" ? sessRes.value.data || [] : [];
  const totalMin = sessRows.reduce(
    (n, r) => n + (Number(r.duration_minutes) || 0),
    0,
  );
  const nbLecons = sessRows.length;

  // ── Étape 2 : mes leçons ──
  const lastCR = crRes.status === "fulfilled" ? crRes.value : null;
  const crCount =
    crCountRes.status === "fulfilled" ? crCountRes.value.count || 0 : 0;

  // ── Étape 3 : examen ──
  const examData =
    examDataRes.status === "fulfilled"
      ? examDataRes.value
      : { loadFailed: true };
  const examDate = examMod ? examMod.parseSavedDate() : null;

  root.innerHTML = `${STYLE}
  <div class="mp anim-slide-up">
    <h1 class="mp-title" tabindex="-1">Mon permis</h1>
    ${renderChip(moniteurPrenom)}
    ${step1Failed ? "" : renderHero({ totalAcquis, currentTitre, allDone })}
    <div class="mp-tl">
      ${renderStep1({ worldStates, step1Failed, totalMin, nbLecons, moniteurPrenom })}
      ${renderStep2({ lastCR, crCount })}
      ${renderStep3({ examMod, examData, examDate })}
    </div>
  </div>`;

  wire(root, { examMod });

  // Deep-link « ?scroll=exam » (porte parcours.js → étape ③ du hub).
  try {
    const qs = (location.hash.split("?")[1] || "").replace(/^\?/, "");
    const params = new URLSearchParams(qs);
    if (params.get("scroll") === "exam") {
      requestAnimationFrame(() => {
        root
          .querySelector("#mp-step-exam")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  } catch {
    /* noop */
  }
}
