// ═══════════════════════════════════════════════════════════════
// Enseignant — Trophées (écran unifié) — DA Arcade Routière v2
// Moteur visuel des trophées moniteur : hero arcade (panneauxLayer/ensHero),
// grille 3 col par médaille, états verrouillés visibles (ADN Clash Royale),
// bottom-sheet de détail. ZÉRO gemme / monnaie virtuelle (décision figée).
//
// Contenu = 12 jalons pédagogiques.
// Données réelles : validations.validated_by, profiles.streak_pro_days,
// élèves suivis (enseignant_id) + actifs 30j. Tout existe déjà en base.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { illus } from "@/components/enseignant/illus.js";
// Données + feuille de détail partagées avec le rail de parcours-pro.js.
import {
  TIERS,
  TIER_ORDER,
  badgeSrc,
  computeTrophees,
  openTrophySheet,
} from "@/components/enseignant/trophy-sheet.js";

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.tr2 {
  max-width: 480px; margin: 0 auto;
  padding: 0 0 calc(100px + env(safe-area-inset-bottom, 0px));
  background: var(--bg); color: var(--ink);
  font-family: var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
}

/* ── Header navigation ── */
.tr2-hd {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; background: var(--su);
  border-bottom: 1px solid var(--bo);
}
.tr2-back {
  width: 44px; height: 44px; border-radius: var(--ens-r, var(--r)); flex-shrink: 0;
  border: 1.5px solid var(--bo4); background: var(--su); color: var(--ink);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background .15s, border-color .15s;
  -webkit-tap-highlight-color: transparent;
}
@media (hover:hover) { .tr2-back:hover { background: var(--bg2); border-color: var(--bo4); } }
.tr2-back:active { background: var(--bg2); transform: translateY(1px); }
.tr2-back:focus-visible { outline: 3px solid #4f46e5); outline-offset: 2px; }
.tr2-hd-info { flex: 1; min-width: 0; }
.tr2-hd-title {
  font: 700 17px/1.2 var(--ens-display, 'Fredoka'), sans-serif;
  color: var(--ink); letter-spacing: -.015em;
}
.tr2-hd-sub { font: 500 12px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu2); margin-top: 3px; }

/* ── Hero arcade (remplace l'image de fond) ── */
.tr2-hero-wrap {
  position: relative; overflow: hidden;
  padding: 20px 20px 32px;
  background: linear-gradient(150deg, #4f46e5, #6d6bff 60%, #8b5cf6);
  color: #fff;
  isolation: isolate;
}
/* liseré marquage au sol */
.tr2-hero-wrap::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 5px; z-index: 1;
  background: none;
  opacity: .85;
}
.tr2-hero-inner { position: relative; z-index: 2; }
.tr2-hero-top { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 12px; }
.tr2-hero-illus { flex-shrink: 0; opacity: .92; }
.tr2-hero-text { flex: 1; min-width: 0; }
.tr2-hero-kicker {
  font: 700 11px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  text-transform: uppercase; letter-spacing: .12em;
  color: rgba(255,255,255,.62); margin: 0 0 6px;
}
.tr2-hero-title {
  font: 700 24px/1.08 var(--ens-display, 'Fredoka'), sans-serif;
  color: #fff; letter-spacing: -.02em; margin: 0 0 4px;
}
.tr2-hero-count {
  display: inline-block;
  font: 700 12px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  color: rgba(255,255,255,.82);
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.22);
  border-radius: var(--ens-r-pill, 999px); padding: 5px 12px;
}
.tr2-prog { display: flex; flex-direction: column; gap: 7px; }
.tr2-prog-bar { height: 7px; background: rgba(255,255,255,.18); border-radius: var(--ens-r-pill, 999px); overflow: hidden; }
.tr2-prog-fill {
  height: 100%; width: 0; border-radius: var(--ens-r-pill, 999px);
  background: #fff;
  box-shadow: 0 0 10px rgba(255,255,255,.5);
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}
.tr2-prog-hint { font: 500 11.5px/1.3 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: rgba(255,255,255,.62); }

/* ── CTA premier démarrage ── */
.tr2-cta {
  margin: 16px 16px 0; padding: 14px 16px;
  background: var(--su); border: 1.5px solid var(--bo); border-radius: var(--ens-r, 16px);
  display: flex; align-items: center; gap: 14px; box-shadow: var(--ens-shadow, var(--s0));
}
.tr2-cta-txt { flex: 1; font: 500 13px/1.45 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu); }
.tr2-cta-btn {
  flex-shrink: 0; padding: 12px 16px; min-height: 48px;
  border: 0; border-radius: var(--ens-r, 16px);
  background: linear-gradient(180deg, #6d6bff, #4f46e5);
  color: var(--ens-ink-go, #07150c);
  font: 700 13px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; cursor: pointer;
  box-shadow: 0 4px 0 0 color-mix(in srgb, #4f46e5 60%, #000), var(--ens-shadow, var(--s0));
  white-space: nowrap;
  transition: transform .1s ease, box-shadow .1s ease;
}
.tr2-cta-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 0 color-mix(in srgb, #4f46e5 60%, #000); }
.tr2-cta-btn:focus-visible { outline: 3px solid #4f46e5); outline-offset: 2px; }

/* ── Section label par médaille ── */
.tr2-group {
  padding: 22px 16px 10px; display: flex; align-items: center; gap: 8px;
  font: 700 11px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  letter-spacing: .09em; text-transform: uppercase;
  /* couleur du palier mélangée vers --ink (theme-aware) : foncée sur fond clair,
     claire sur fond sombre → ≥4.5:1 dans les deux thèmes (a11y) */
  color: color-mix(in srgb, var(--tier, var(--ink)) 55%, var(--ink));
}
.tr2-group .gcount {
  margin-left: auto; font: 700 11px/1 'IBM Plex Mono', monospace;
  color: var(--mu2); text-transform: none; letter-spacing: 0;
}

/* ── Grille 3 colonnes ── */
.tr2-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0 12px; }

/* ── Carte trophée ── */
.tr2-card {
  position: relative; border-radius: var(--ens-r, 16px); padding: 14px 8px 12px;
  display: flex; flex-direction: column; align-items: center; gap: 7px;
  min-height: 122px; width: 100%; border: 0; background: none; cursor: pointer;
  text-align: center; font-family: inherit; overflow: hidden;
  -webkit-tap-highlight-color: transparent; user-select: none;
  transition: transform .14s cubic-bezier(.23,1,.32,1);
  animation: tr2In .45s var(--ease-out, cubic-bezier(.2,.7,.3,1)) both;
}
@keyframes tr2In { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }
.tr2-card:active { transform: scale(.93); }
.tr2-card:focus-visible { outline: 3px solid #4f46e5); outline-offset: 3px; }
.tr2-card.locked { background: var(--su); border: 1.5px solid var(--bo); }
.tr2-card.unlocked { color: #fff; }
.tr2-card.bronze  { background: var(--tc-grad); box-shadow: 0 4px 16px -4px var(--tc-glow); }
.tr2-card.argent  { background: var(--tc-grad); box-shadow: 0 4px 16px -4px var(--tc-glow); }
.tr2-card.or      { background: var(--tc-grad); box-shadow: 0 4px 16px -4px var(--tc-glow); }
.tr2-card.platine { background: var(--tc-grad); box-shadow: 0 4px 16px -4px var(--tc-glow); }
.tr2-card.diamant { background: var(--tc-grad); animation: tr2In .45s var(--ease-out, cubic-bezier(.2,.7,.3,1)) both, diamGlow 2.6s ease-in-out infinite alternate; }
@keyframes diamGlow {
  from { box-shadow: 0 4px 22px -4px rgba(167,139,250,.6); }
  to   { box-shadow: 0 4px 32px -2px rgba(196,181,253,.95), 0 0 0 1px rgba(196,181,253,.4); }
}
.tr2-card-dot {
  position: absolute; top: 8px; right: 8px; width: 6px; height: 6px; border-radius: 50%;
  background: #fff; box-shadow: 0 0 7px rgba(255,255,255,.8);
}
.tr2-card-ico {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.tr2-card.locked .tr2-card-ico { background: var(--bg2); color: var(--mu2); border: 1px solid var(--bo); }
.tr2-card.unlocked .tr2-card-ico,
.tr2-card.locked .tr2-card-ico { background: transparent; border: 0; box-shadow: none; }
.tr2-card-img { width: 48px; height: 48px; object-fit: contain; display: block; filter: drop-shadow(0 3px 6px rgba(0,0,0,.2)); }
.tr2-card-img.locked { filter: grayscale(1) opacity(.4); }
.tr2-card-name {
  font: 700 10.5px/1.2 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  letter-spacing: -.01em;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.tr2-card.unlocked .tr2-card-name { color: rgba(255,255,255,.96); }
.tr2-card.locked .tr2-card-name { color: var(--mu2); }
.tr2-card-prog {
  font: 700 9.5px/1 'IBM Plex Mono', monospace;
  color: var(--mu3); background: var(--bg2); padding: 3px 7px; border-radius: var(--ens-r-pill, 999px);
}

@media (prefers-reduced-motion: reduce) {
  .tr2-card, .tr2-prog-fill { animation: none !important; transition: none !important; }
  .tr2-card.diamant { animation: none !important; }
  .tr2-cta-btn { transition: none !important; }
}

/* ── Empty state trophy ── */
.tr2-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 40px 24px; text-align: center;
}
.tr2-empty-sub {
  font: 500 13px/1.5 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  color: var(--mu2); max-width: 28ch;
}

/* La feuille de détail vit désormais dans le module partagé trophy-sheet.js
   (posée sur <body>, au-dessus de la nav). Plus de markup/CSS de feuille ici. */
</style>`;

// ─── État module ─────────────────────────────────────────────────
// _results = trophées enrichis (computeTrophees) — utilisé par la grille + le
// deep-link. La feuille de détail est gérée par le module partagé (body-level).
let _results = [];

// ─── Mount ────────────────────────────────────────────────────────
// openKey : deep-link #/trophees-moniteur/{id} → ouvre directement le détail
// (depuis le rail « Tes trophées » de la page Progression).
export async function mount(root, openKey = null) {
  const me = getCurUser();
  if (!me || me.role !== "enseignant") {
    root.innerHTML = `<p style="padding:32px;text-align:center;color:var(--mu)">Accès enseignant requis</p>`;
    return;
  }

  track("page_view", { page: "trophees_moniteur" });

  root.innerHTML = `${STYLE}
<div class="tr2 anim-slide-up">
  ${_headerHtml("Chargement…")}
  <div class="tr2-hero-wrap">
    <div class="tr2-hero-inner">
      <div class="tr2-hero-top">
        <div class="tr2-hero-illus">${illus("trophy", { size: 64 })}</div>
        <div class="tr2-hero-text">
          <p class="tr2-hero-kicker">Jalons pédagogiques</p>
          <h1 class="tr2-hero-title">Mes trophées</h1>
          <span class="tr2-hero-count">—</span>
        </div>
      </div>
      <div class="tr2-prog"><div class="tr2-prog-bar"><div class="tr2-prog-fill"></div></div></div>
    </div>
  </div>
</div>`;
  _wireBack(root);

  try {
    const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
    const [profileRes, countRes, studentsRes, activeRes] = await Promise.all([
      sb
        .from("profiles")
        .select("prenom, streak_pro_days")
        .eq("id", me.id)
        .maybeSingle(),
      sb
        .from("validations")
        .select("id", { count: "exact", head: true })
        .eq("validated_by", me.id),
      sb
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("enseignant_id", me.id)
        .eq("role", "eleve"),
      sb
        .from("validations")
        .select("eleve_id")
        .eq("validated_by", me.id)
        .gte("validated_at", since30d),
    ]);

    const d = {
      totalVals: countRes.count ?? 0,
      streak: profileRes.data?.streak_pro_days ?? 0,
      studentsTotal: studentsRes.count ?? 0,
      studentsActive: new Set(
        (activeRes.data || []).map((v) => v.eleve_id).filter(Boolean),
      ).size,
      prenom: profileRes.data?.prenom ?? "",
    };
    _render(root, d, openKey);
  } catch (e) {
    console.error("[trophees-moniteur]", e);
    toast("Erreur de chargement", "error");
  }
}

export function unmount() {
  // La feuille de détail (module partagé) se ferme d'elle-même au hashchange.
}

// ─── Render ──────────────────────────────────────────────────────
function _render(root, d, openKey = null) {
  _results = computeTrophees(d);

  const unlockedCount = _results.filter((t) => t.unlocked).length;
  const total = _results.length;
  const pct = Math.round((unlockedCount / total) * 100);
  const remaining = total - unlockedCount;

  let gridHtml = "";
  for (const key of TIER_ORDER) {
    const cfg = TIERS[key];
    const list = _results.filter((t) => t.tier === key);
    if (!list.length) continue;
    const done = list.filter((t) => t.unlocked).length;
    gridHtml += `
      <div class="tr2-group" style="--tier:${cfg.color}">${cfg.label}<span class="gcount">${done}/${list.length}</span></div>
      <div class="tr2-grid">${list.map((t) => _cardHtml(t)).join("")}</div>`;
  }

  const cta =
    d.totalVals === 0
      ? `<div class="tr2-cta">
          <div class="tr2-cta-txt">Enregistre ta première séance pour débloquer tes premiers trophées.</div>
          <button class="tr2-cta-btn" id="tr2-start">Première séance</button>
        </div>`
      : "";

  // Empty state si aucune donnée significative
  const emptyState =
    d.totalVals === 0
      ? `<div class="tr2-empty">
          ${illus("route", { size: 72 })}
          <p class="tr2-empty-sub">Valide ta première compétence pour commencer à débloquer tes jalons.</p>
        </div>`
      : "";

  root.innerHTML = `${STYLE}
<div class="tr2 anim-slide-up">
  ${_headerHtml(`${unlockedCount} débloqué${unlockedCount > 1 ? "s" : ""} sur ${total}`)}
  <div class="tr2-hero-wrap">
    <div class="tr2-hero-inner">
      <div class="tr2-hero-top">
        <div class="tr2-hero-illus">${illus("trophy", { size: 64 })}</div>
        <div class="tr2-hero-text">
          <p class="tr2-hero-kicker">Jalons pédagogiques</p>
          <h1 class="tr2-hero-title">Mes trophées</h1>
          <span class="tr2-hero-count">${unlockedCount} / ${total}</span>
        </div>
      </div>
      <div class="tr2-prog">
        <div class="tr2-prog-bar"><div class="tr2-prog-fill" id="tr2-fill"></div></div>
        <div class="tr2-prog-hint">${pct}&nbsp;% des jalons atteints${remaining > 0 ? ` — ${remaining} restant${remaining > 1 ? "s" : ""} à débloquer` : " — collection complète"}</div>
      </div>
    </div>
  </div>
  ${cta}
  ${emptyState}
  ${gridHtml}
</div>`;

  _wireBack(root);
  root
    .querySelector("#tr2-start")
    ?.addEventListener("click", () => navigate("#/log-session"));

  root.querySelectorAll(".tr2-card").forEach((el) => {
    el.addEventListener("click", () => {
      haptic("impact");
      openTrophySheet(_results[parseInt(el.dataset.i, 10)], { triggerEl: el });
    });
  });

  requestAnimationFrame(() => {
    const fill = root.querySelector("#tr2-fill");
    if (fill) fill.style.width = `${pct}%`;
  });

  // Deep-link : ouvre directement le détail du trophée ciblé (rail Progression).
  if (openKey) {
    const t = _results.find((x) => x.id === openKey);
    if (t) openTrophySheet(t);
  }
}

// ─── Header ──────────────────────────────────────────────────────
function _headerHtml(sub) {
  return `
  <div class="tr2-hd">
    <button class="tr2-back" id="tr2-back" aria-label="Retour au parcours">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
    <div class="tr2-hd-info">
      <div class="tr2-hd-title" tabindex="-1">Trophées</div>
      <div class="tr2-hd-sub">${esc(sub)}</div>
    </div>
  </div>`;
}

function _wireBack(root) {
  root.querySelector("#tr2-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/parcours");
  });
}

// ─── Carte ───────────────────────────────────────────────────────
function _cardHtml(t) {
  const i = _results.indexOf(t);
  const cfg = TIERS[t.tier];
  const cls = t.unlocked ? `unlocked ${t.tier}` : "locked";
  const icoHtml = t.mystery
    ? icon("lock", { size: 22, strokeWidth: 2 })
    : `<img src="${badgeSrc(t.id)}" alt="" class="tr2-card-img${t.unlocked ? "" : " locked"}" loading="lazy">`;
  const name = t.mystery ? "???" : esc(t.name);
  const sub = t.unlocked
    ? `<div class="tr2-card-dot"></div>`
    : t.close
      ? `<div class="tr2-card-prog">${t.prog.v}/${t.prog.max}</div>`
      : `<div class="tr2-card-prog">${cfg.label}</div>`;
  const styleVars = t.unlocked
    ? `--tc-grad:${cfg.gradient};--tc-glow:${cfg.glow}`
    : "";
  return `<button class="tr2-card ${cls}" style="${styleVars}" data-i="${i}" aria-label="${name}${t.unlocked ? " — débloqué" : " — verrouillé"}">
    <div class="tr2-card-ico">${icoHtml}</div>
    <div class="tr2-card-name">${name}</div>
    ${sub}
  </button>`;
}
