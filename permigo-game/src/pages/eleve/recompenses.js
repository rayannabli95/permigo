// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Récompenses » : 1 porte, 4 salles (nav 5 portes,
// maquette validée Rayan : mockups/nav-hub-recompenses-A.html).
//
// Hiérarchie (fidèle à la maquette) :
//   1. Hero « La Roue » — tour gratuit dispo (ou reviens demain) + pastilles
//      « à réclamer maintenant » (coffre, trophée) + ligne « gros lot réel »
//      (si le moniteur en a configuré) + « prochain coffre » (série).
//   2. 4 onglets internes : Boutique · Ma collection · Trophées · Ligue.
//
// Réutilisation (ne duplique PAS la grosse logique métier des pages dédiées) :
//   - Boutique / Ma collection / Trophées → résumé fidèle + « Tout voir »
//     vers #/boutique, #/galerie, #/trophees (achat, équipement, modales
//     détaillées restent SUR ces pages, pas ici).
//   - Ligue → le composant partagé `league-hero.js` (déjà utilisé par
//     accueil.js) est monté tel quel : zéro duplication, données 100% réelles.
//
// DA : « clair premium » (comme boutique/accueil), mais theme-aware —
// tokens --su/--bo/--ink/--mu/--a (jamais --surface/--border/--muted) pour
// que le hub reste lisible en dark mode (contrairement à la Galerie Matin
// de boutique.js qui est volontairement figée en clair).
//
// Données 100% réelles, repli gracieux si indisponible :
//   - Roue         : roue_daily_spins (tour du jour) + get_moniteur_rewards
//   - Coffres      : get_my_chests (game-state.js)
//   - Trophées     : get_my_achievements + data/achievements.js CATALOG
//   - Boutique     : get_items_catalog
//   - Collection   : mêmes données que trophées + paliers fonds permis (galerie.js)
//   - Ligue        : get_eleve_leaderboard + get_theory_leaderboard_weekly
//     (via league-hero.js, identique à accueil.js)
//
// Écarts assumés vs la maquette (données honnêtes, jamais inventées) :
//   - Pas de « vedette exclu 7 jours » / compte à rebours : aucune rotation
//     hebdo n'existe côté catalogue → kicker neutre, pas de faux timer.
//   - Pas de prix « 80 volants » pour un 2e tour : ce mécanisme n'existe pas
//     côté serveur (spin_roue_daily = 1 tour gratuit/jour, point).
//   - « 1 gros lot réel maximum par TRIMESTRE » (pas « par mois ») : c'est la
//     vraie règle serveur (spin_roue_daily, cf. moniteur_reward_config).
//   - Ligue = Ligue Révision (Novice/Apprenti/…) et non « Ligue Argent » :
//     « Argent » est un palier réservé à l'échelle moniteur.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { haptic } from "@/utils/haptic.js";
import { getStreak, getMyChests } from "@/utils/game-state.js";
import { medallion } from "@/utils/medallions.js";
import { volantImg } from "@/utils/volant.js";
import { ASSETS } from "@/utils/assets.js";
import { CATALOG, RARITY_COLOR } from "@/data/achievements.js";
import {
  mountLeagueHero,
  LEAGUE_HERO_CSS,
} from "@/components/eleve/league-hero.js";

// ─── Petites constantes locales (dupliquées volontairement — même convention
// que reviser.js : pas de dépendance page→page pour 2-3 valeurs) ──────────
const STREAK_MILESTONES = [7, 14, 30];
const PERMIS_TIERS = [
  { key: "mesh", min: 0, nom: "Fond « Mesh »", img: ASSETS.permisBg?.mesh },
  { key: "route", min: 10, nom: "Fond « Route »", img: ASSETS.permisBg?.route },
  {
    key: "holographic",
    min: 20,
    nom: "Fond « Holographique »",
    img: ASSETS.permisBg?.holographic,
  },
];
const RARITY_ORDER = { legendaire: 3, epique: 2, rare: 1, commun: 0 };
const RARITY_LABEL_SHOP = {
  commun: "Commun",
  rare: "Rare",
  epique: "Épique",
  legendaire: "Légendaire",
};
const LS_TROPH_SEEN = "pg-troph-seen";

function nextStreakMilestone(days) {
  const next = STREAK_MILESTONES.find((n) => days < n);
  if (!next) return null;
  return { days: next, remaining: next - days };
}

// Trophées débloqués mais jamais vus sur #/trophees — LECTURE SEULE (on ne
// touche jamais le ledger localStorage ici, c'est trophees.js qui le tient).
function getFreshTrophies(unlockedDefs) {
  let raw;
  try {
    raw = localStorage.getItem(LS_TROPH_SEEN);
  } catch {
    return [];
  }
  if (raw == null) return []; // jamais visité #/trophees → pas de faux "nouveau"
  let seen;
  try {
    seen = new Set(JSON.parse(raw));
  } catch {
    seen = new Set();
  }
  return unlockedDefs.filter((d) => !seen.has(d.key));
}

function byPrestige(a, b) {
  return (
    (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0) ||
    (b.cost_gemmes ?? 0) - (a.cost_gemmes ?? 0)
  );
}

function badgeMarkup(def, size) {
  if (def.image) {
    return `<img src="${esc(def.image)}" alt="" loading="lazy" width="${size}" height="${size}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'"
      style="width:${size}px;height:${size}px;object-fit:contain">
      <span style="display:none">${medallion("trophee", "gold", { size })}</span>`;
  }
  return medallion("trophee", "gold", { size });
}

// ─── STYLE (scopé .rec-*, tokens theme-aware) ───────────────────
const STYLE = `<style>
.rec {
  --gold-1:#ffe9a8; --gold-2:#ffd24a; --gold-3:#ff9c1c; --gold-deep:#c87d12; --gold-ink:#7a5510;
  --go-1:#7ee83a; --go-2:#58cc02; --go-3:#46a302; --go-deep:#357c00;
  max-width: 480px; margin: 0 auto; padding: 14px 15px 32px;
  font-family: 'Nunito', system-ui, sans-serif; color: var(--ink);
  background:
    radial-gradient(120% 40% at 22% -6%, color-mix(in srgb, var(--a) 10%, transparent) 0%, transparent 58%),
    radial-gradient(110% 36% at 96% 0%, rgba(255,180,40,.12) 0%, transparent 55%),
    var(--bg);
}
.rec-title { font: 800 26px/1.1 'Baloo 2', cursive; letter-spacing: .2px; margin: 4px 2px 12px; }

/* ── Série (statut discret) ── */
.rec-serie {
  display: inline-flex; align-items: center; gap: 7px; margin-bottom: 13px;
  padding: 5px 13px 5px 7px; border-radius: 999px;
  background: rgba(255,210,74,.14); border: 1px solid rgba(231,178,60,.35);
}
.rec-serie .pg-med { width: 22px; height: 22px; }
.rec-serie b { font: 800 12.5px/1 'Nunito', sans-serif; color: var(--gold-ink); }
.rec-serie i { font: 700 11.5px/1 'Nunito', sans-serif; font-style: normal; color: var(--mu2); }

/* ══ HERO « La Roue » ══ */
.rec-hero {
  position: relative; border-radius: 26px; padding: 17px 16px 15px; margin-bottom: 16px; overflow: hidden;
  border: 1.5px solid color-mix(in srgb, var(--gold-deep) 40%, var(--bo));
  background:
    radial-gradient(130% 80% at 86% 0%, rgba(255,210,74,.20) 0%, transparent 52%),
    radial-gradient(90% 70% at 8% 100%, color-mix(in srgb, var(--a) 10%, transparent) 0%, transparent 60%),
    var(--su);
  box-shadow: inset 0 2px 0 rgba(255,255,255,.06), 0 6px 20px -14px rgba(0,0,0,.35);
}
.rec-hero-k {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; margin-bottom: 11px;
  background: linear-gradient(180deg, var(--gold-1), var(--gold-2)); border: 1px solid rgba(201,125,18,.4);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
  font: 600 10px/1 'Fredoka', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #5e430f;
}
.rec-hero-row { display: flex; align-items: center; gap: 14px; }
.rec-hero-txt { flex: 1; min-width: 0; }
.rec-hero-t { font: 800 21px/1.08 'Baloo 2', cursive; color: var(--ink); }
.rec-hero-t em { font-style: normal; color: var(--gold-deep); }
.rec-hero-s { margin-top: 6px; font-size: 12.5px; font-weight: 700; color: var(--mu); line-height: 1.4; }
.rec-hero-s b { color: var(--ink); }

.rec-wheel-wrap { position: relative; width: 88px; height: 88px; flex: none; }
.rec-wheel-ptr {
  position: absolute; left: 50%; top: -4px; transform: translateX(-50%); z-index: 3;
  width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent;
  border-top: 11px solid var(--gold-3); filter: drop-shadow(0 2px 2px rgba(122,74,5,.4));
}
.rec-wheel {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(var(--gold-2) 0 45deg, #54a0ff 45deg 90deg, #b06bff 90deg 135deg, #b7b0d4 135deg 180deg,
    var(--go-2) 180deg 225deg, #b06bff 225deg 270deg, #b7b0d4 270deg 315deg, #54a0ff 315deg 360deg);
  border: 4px solid var(--gold-1);
  box-shadow: 0 5px 0 var(--gold-deep), 0 12px 22px -8px rgba(201,125,18,.5), inset 0 2px 6px rgba(255,255,255,.35);
  animation: recSpin 16s linear infinite;
}
@keyframes recSpin { to { transform: rotate(360deg); } }
.rec-wheel-hub {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 2;
  width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center;
  background: radial-gradient(circle at 36% 30%, #fff7da, var(--gold-2) 62%, var(--gold-3));
  border: 2px solid #fff5cf; box-shadow: 0 3px 6px rgba(122,74,5,.4);
}

.rec-hero-cta {
  position: relative; z-index: 2; margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 9px;
  width: 100%; min-height: 52px; border-radius: 17px; border: 0; cursor: pointer;
  background: linear-gradient(180deg, var(--go-1) 0%, var(--go-2) 52%, var(--go-3) 100%);
  box-shadow: inset 0 2px 0 rgba(255,255,255,.55), inset 0 -4px 8px rgba(0,0,0,.22),
    0 6px 0 var(--go-deep), 0 12px 22px -6px rgba(70,163,2,.45);
  font: 800 18px/1 'Baloo 2', cursive; color: #fff; text-shadow: 0 2px 0 rgba(35,80,4,.6);
  text-decoration: none;
}
.rec-hero-cta:active { transform: translateY(2px); }
.rec-hero-cta svg { width: 21px; height: 21px; }

.rec-claims { display: flex; gap: 9px; margin-top: 13px; }
.rec-claim {
  flex: 1; display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 15px; cursor: pointer;
  background: var(--su); border: 1px solid var(--bo); font: inherit; color: inherit; text-align: left;
  text-decoration: none; min-height: 44px;
}
.rec-claim .pg-med { flex: none; }
.rec-claim-b { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; text-align: left; }
.rec-claim-t { display: block; font: 700 12px/1.15 'Baloo 2', cursive; color: var(--ink); }
.rec-claim-s { display: block; font-size: 9.5px; font-weight: 700; color: var(--mu2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rec-claim-n {
  flex: none; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; display: grid; place-items: center;
  font: 800 11.5px/1 'Baloo 2', cursive; color: #fff;
  background: linear-gradient(180deg,#ff8a8a,#f43f5e 60%,#d92c4b); border: 1px solid rgba(255,255,255,.5);
}

.rec-hero-cap { display: flex; align-items: flex-start; gap: 7px; margin-top: 12px; font-size: 10.5px; font-weight: 700; color: var(--mu2); }
.rec-hero-cap svg, .rec-hero-cap .pg-med { flex: none; color: var(--gold-deep); }
.rec-hero-cap b { color: var(--gold-ink); }

/* ── ONGLETS INTERNES ── */
.rec-tabs {
  display: flex; gap: 6px; padding: 5px; border-radius: 16px; margin-bottom: 14px;
  background: color-mix(in srgb, var(--ink) 5%, var(--bg2));
  border: 1px solid var(--bo);
}
.rec-tab {
  flex: 1; border: 0; border-radius: 12px; padding: 9px 2px; min-height: 44px; cursor: pointer; text-align: center;
  font: 600 12px/1.15 'Fredoka', sans-serif; color: var(--mu); background: transparent;
  transition: background .16s, color .16s;
}
.rec-tab.on { background: var(--su); color: var(--a-txt); box-shadow: 0 2px 8px -4px rgba(20,16,60,.3); }

.rec-panel { display: none; }
.rec-panel.on { display: block; animation: recPin .22s ease; }
@keyframes recPin { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }

.rec-sec-h { display: flex; align-items: baseline; justify-content: space-between; margin: 2px 3px 10px; }
.rec-sec-h h2 { font: 700 15px/1 'Baloo 2', cursive; }
.rec-sec-h span { font-size: 11px; font-weight: 800; color: var(--mu2); }

/* Vedette boutique / collection head / claim card — même écrin doré */
.rec-gold-card {
  position: relative; border-radius: 22px; overflow: hidden; margin-bottom: 12px; padding: 14px 15px;
  background:
    radial-gradient(120% 80% at 80% 0%, rgba(255,210,74,.18) 0%, transparent 55%),
    var(--su);
  border: 1.5px solid color-mix(in srgb, var(--gold-deep) 32%, var(--bo));
  box-shadow: 0 4px 14px -10px rgba(0,0,0,.3);
  cursor: pointer; text-decoration: none; color: inherit; display: block; font: inherit; text-align: left;
}
.rec-gold-k {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; margin-bottom: 10px;
  background: linear-gradient(180deg, var(--gold-1), var(--gold-2)); border: 1px solid rgba(201,125,18,.4);
  font: 600 9.5px/1 'Fredoka', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #5e430f;
}
.rec-star-row { display: flex; align-items: center; gap: 13px; }
.rec-star-img {
  width: 68px; height: 68px; flex: none; border-radius: 16px; object-fit: cover;
  border: 2px solid var(--gold-1); box-shadow: 0 4px 10px -6px rgba(122,74,5,.5);
}
.rec-star-txt { flex: 1; min-width: 0; }
.rec-star-t { font: 800 15.5px/1.15 'Baloo 2', cursive; color: var(--ink); }
.rec-star-s { font-size: 11px; font-weight: 700; color: var(--mu); margin-top: 3px; }
.rec-star-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; gap: 8px; }
.rec-star-price { display: inline-flex; align-items: center; gap: 6px; font: 800 13px/1 'Baloo 2', cursive; color: var(--gold-ink); }
.rec-go-shop {
  display: inline-flex; align-items: center; gap: 6px; font: 800 12.5px/1 'Baloo 2', cursive; color: #fff;
  padding: 9px 13px; border-radius: 12px; border: 0; cursor: pointer;
  background: linear-gradient(180deg, var(--a-lt), var(--a)); box-shadow: 0 3px 0 var(--adk);
  text-decoration: none; white-space: nowrap;
}

.rec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rec-item {
  border-radius: 18px; overflow: hidden; background: var(--su); border: 1px solid var(--bo);
  box-shadow: 0 3px 10px -8px rgba(0,0,0,.3); text-align: left; font: inherit; color: inherit; cursor: pointer; padding: 0;
  text-decoration: none; display: block; position: relative;
}
.rec-item-vis {
  height: 78px; display: grid; place-items: center; overflow: hidden;
  background: linear-gradient(160deg, color-mix(in srgb, var(--a) 8%, var(--bg2)), var(--bg2));
}
.rec-item-vis img { width: 100%; height: 100%; object-fit: cover; }
.rec-item-vis img.pad { width: 56px; height: 56px; object-fit: contain; border-radius: 50%; }
.rec-item-vis.locked img { filter: grayscale(1) opacity(.4); }
.rec-item-b { padding: 9px 11px 11px; }
.rec-item-t {
  font: 700 12.5px/1.15 'Baloo 2', cursive; color: var(--ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rec-item-r { font-size: 9.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; margin-top: 2px; color: var(--mu2); }
.rec-item-p { display: inline-flex; align-items: center; gap: 5px; margin-top: 6px; font: 800 12px/1 'Baloo 2', cursive; color: var(--gold-ink); }
.rec-item-owned { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 10px; font-weight: 800; color: var(--grdk); }
.rec-tag {
  position: absolute; left: 8px; top: 8px; z-index: 2; padding: 3px 9px; border-radius: 999px;
  font: 600 8.5px/1 'Fredoka', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: #fff;
  background: linear-gradient(180deg, var(--a), var(--adk)); box-shadow: 0 2px 6px rgba(83,72,232,.4);
}
.rec-tag.gold { color: #5e430f; background: linear-gradient(180deg, var(--gold-1), var(--gold-2)); box-shadow: 0 2px 6px rgba(201,125,18,.35); }

/* Collection head */
.rec-col-head {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 12px 14px; border-radius: 18px;
  background: var(--su); border: 1px solid var(--bo);
}
.rec-col-hb { flex: 1; min-width: 0; }
.rec-col-ht { font: 800 14px/1 'Baloo 2', cursive; color: var(--ink); }
.rec-col-track { margin-top: 6px; height: 8px; border-radius: 5px; background: var(--bg2); overflow: hidden; }
.rec-col-track i { display: block; height: 100%; border-radius: 5px; background: linear-gradient(90deg, var(--adk), var(--a)); }
.rec-col-hn { flex: none; font: 800 13px/1 'Baloo 2', cursive; color: var(--a-txt); white-space: nowrap; }

/* Trophées grid (dot rareté réutilise RARITY_COLOR d'achievements.js) */
.rec-tro-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.rec-tro { position: relative; border-radius: 16px; padding: 10px 8px 9px; text-align: center; background: var(--su); border: 1px solid var(--bo); }
.rec-tro img, .rec-tro .pg-med { width: 48px; height: 48px; object-fit: contain; }
.rec-tro-t { font: 700 10.5px/1.15 'Baloo 2', cursive; margin-top: 5px; color: var(--ink); }
.rec-tro.locked img { filter: grayscale(1) opacity(.4); }
.rec-tro.locked .rec-tro-t { color: var(--mu2); }
.rec-tro-dot { position: absolute; top: 7px; right: 7px; width: 8px; height: 8px; border-radius: 50%; }

.rec-note { text-align: center; color: var(--mu2); font: 600 10.5px/1.4 'Inter', sans-serif; margin: 6px 4px 4px; }
.rec-empty { text-align: center; padding: 28px 16px; color: var(--mu); font: 600 12.5px/1.5 'Inter', sans-serif; }

.rec-tout-voir {
  display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 44px;
  margin-top: 4px; border: 1px solid var(--bo); border-radius: 14px; background: var(--su); color: var(--a-txt);
  font: 800 12.5px/1 'Fredoka', sans-serif; cursor: pointer; text-decoration: none;
}

#rec-ligue-slot .lgh-eyebrow { display: none; } /* déjà annoncé par l'onglet "Ligue" */
#rec-ligue-slot .lgh { margin: 0; }

@media (prefers-reduced-motion: reduce) {
  .rec-wheel { animation: none; }
  .rec-panel.on { animation: none; }
}
</style>`;

// ─── Skeleton ─────────────────────────────────────────────────
function skeleton() {
  return `${STYLE}<div class="rec">
    <h1 class="rec-title" tabindex="-1">Récompenses</h1>
    <div class="rec-hero" style="min-height:260px;background:var(--bg2);border-color:var(--bo)"></div>
    <div class="rec-tabs">${[...Array(4)].map(() => `<div class="rec-tab" style="opacity:.4"></div>`).join("")}</div>
  </div>`;
}

// ─── Hero « La Roue » ─────────────────────────────────────────
function renderHero(ctx) {
  const {
    spinAvailable,
    anyBig,
    moniteurPrenom,
    coffresToOpen,
    freshTrophies,
    streak,
  } = ctx;

  const kicker = anyBig ? "La Roue · gros lots réels" : "La Roue";
  const title = spinAvailable
    ? `Ton <em>tour gratuit</em> t'attend`
    : `Reviens demain pour rejouer`;
  const sub =
    anyBig && moniteurPrenom
      ? `Avatars, fonds, titres… et parfois un <b>vrai cadeau</b> signé ${esc(moniteurPrenom)}.`
      : `Des volants, des avatars et des titres à gagner chaque jour.`;
  const ctaLabel = spinAvailable ? "Lancer la roue" : "Voir la Roue";

  const claims = [];
  if (coffresToOpen > 0) {
    claims.push(`
      <a class="rec-claim" href="#/mes-coffres" data-track="claim_coffre">
        ${medallion("coffre", "gold", { size: 34 })}
        <span class="rec-claim-b">
          <span class="rec-claim-t">Coffre à ouvrir</span>
          <span class="rec-claim-s">${coffresToOpen > 1 ? `${coffresToOpen} coffres prêts` : "Prêt à ouvrir"}</span>
        </span>
        <span class="rec-claim-n">${coffresToOpen}</span>
      </a>`);
  }
  if (freshTrophies.length > 0) {
    claims.push(`
      <a class="rec-claim" href="#/trophees" data-track="claim_trophee">
        ${medallion("trophee", "violet", { size: 34 })}
        <span class="rec-claim-b">
          <span class="rec-claim-t">Trophée à réclamer</span>
          <span class="rec-claim-s">${esc(freshTrophies[0].title)}</span>
        </span>
        <span class="rec-claim-n">${freshTrophies.length}</span>
      </a>`);
  }

  const capLine1 = anyBig
    ? `<div class="rec-hero-cap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="14" height="14"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
        <span><b>1 gros lot réel maximum par trimestre</b> · taux affichés et honnêtes</span>
      </div>`
    : "";

  const next =
    streak.count > 0
      ? nextStreakMilestone(streak.count)
      : nextStreakMilestone(0);
  const capLine2 = next
    ? `<div class="rec-hero-cap">
        ${medallion("flamme", "orange", { size: 14 })}
        <span>Prochain coffre : <b>série ${next.days} jours</b> — encore ${next.remaining} jour${next.remaining > 1 ? "s" : ""}</span>
      </div>`
    : "";

  return `
  <section class="rec-hero">
    <span class="rec-hero-k">${esc(kicker)}</span>
    <div class="rec-hero-row">
      <div class="rec-hero-txt">
        <div class="rec-hero-t">${title}</div>
        <div class="rec-hero-s">${sub}</div>
      </div>
      <div class="rec-wheel-wrap" aria-hidden="true">
        <span class="rec-wheel-ptr"></span>
        <span class="rec-wheel"></span>
        <span class="rec-wheel-hub">${volantImg(20)}</span>
      </div>
    </div>

    <a class="rec-hero-cta" href="#/roue" id="rec-roue-cta">
      <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.5-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z"/></svg>
      ${esc(ctaLabel)}
    </a>

    ${claims.length ? `<div class="rec-claims">${claims.join("")}</div>` : ""}
    ${capLine1}
    ${capLine2}
  </section>`;
}

// ─── Onglet Boutique (résumé) ─────────────────────────────────
function renderBoutiquePanel(ctx) {
  const { itemsFailed, shopItems } = ctx;
  if (itemsFailed) {
    return `<div class="rec-empty">« Boutique » indisponible. <a href="#/boutique" style="color:var(--a-txt)">Ouvrir la boutique →</a></div>`;
  }
  if (!shopItems.length) {
    return `<div class="rec-empty">Rien à afficher pour l'instant.</div>`;
  }
  const vedette = shopItems[0];
  const grid = shopItems.slice(1, 5);

  const vedetteHtml = `
    <a class="rec-gold-card" href="#/boutique" data-track="boutique_vedette">
      <span class="rec-gold-k">Vedette de la boutique</span>
      <div class="rec-star-row">
        <img class="rec-star-img" src="${esc(vedette.asset_url || "")}" alt="" loading="lazy"
          onerror="this.style.display='none'">
        <div class="rec-star-txt">
          <div class="rec-star-t">${esc(vedette.name)}</div>
          <div class="rec-star-s">${esc(vedette.type === "permis_bg" ? "Fond de permis" : "Avatar")} · ${esc(RARITY_LABEL_SHOP[vedette.rarity] || "")}</div>
        </div>
      </div>
      <div class="rec-star-foot">
        ${
          vedette.owned
            ? `<span class="rec-item-owned">${medallion("check", "green", { size: 16 })} Dans ta collection</span>`
            : `<span class="rec-star-price">${volantImg(16)} ${vedette.cost_gemmes ?? "—"}</span>`
        }
        <span class="rec-go-shop">Voir en boutique</span>
      </div>
    </a>`;

  const gridHtml = grid.length
    ? `<div class="rec-sec-h"><h2>Skins &amp; fonds</h2><span>ta voiture, ton permis</span></div>
       <div class="rec-grid">${grid.map((it) => renderShopItem(it)).join("")}</div>`
    : "";

  return `${vedetteHtml}${gridHtml}
    <a class="rec-tout-voir" href="#/boutique" data-track="tout_voir_boutique">Tout voir la boutique →</a>`;
}

function renderShopItem(it) {
  const cover = it.type === "permis_bg" || /\/car-/.test(it.asset_url || "");
  return `
  <a class="rec-item" href="#/boutique" data-track="boutique_item">
    <div class="rec-item-vis">
      <img class="${cover ? "" : "pad"}" src="${esc(it.asset_url || "")}" alt="" loading="lazy" onerror="this.style.display='none'">
    </div>
    <div class="rec-item-b">
      <div class="rec-item-t">${esc(it.name)}</div>
      <div class="rec-item-r">${esc(RARITY_LABEL_SHOP[it.rarity] || "")}</div>
      ${
        it.owned
          ? `<span class="rec-item-owned">${medallion("check", "green", { size: 14 })} Obtenu</span>`
          : `<span class="rec-item-p">${volantImg(15)} ${it.cost_gemmes ?? "—"}</span>`
      }
    </div>
  </a>`;
}

// ─── Onglet Ma collection (résumé galerie.js) ─────────────────
function renderCollectionPanel(ctx) {
  const { unlockedDefs, lockedDefs, unlockedPermisCount, validatedCount } = ctx;
  const totalCollect = CATALOG.length + PERMIS_TIERS.length;
  const doneCollect = unlockedDefs.length + unlockedPermisCount;
  const pct = totalCollect ? Math.round((100 * doneCollect) / totalCollect) : 0;

  // 4 vignettes de prévisualisation : trophées débloqués d'abord, puis un
  // aperçu verrouillé (trophée ou fond de permis) pour donner envie.
  const tiles = [];
  for (const t of unlockedDefs.slice(0, 2)) {
    tiles.push({ img: t.image, name: t.title, locked: false, tag: null });
  }
  for (const t of lockedDefs.slice(0, 2)) {
    tiles.push({ img: t.image, name: t.title, locked: true, tag: null });
  }
  for (const p of PERMIS_TIERS) {
    if (tiles.length >= 4) break;
    tiles.push({
      img: p.img,
      name: p.nom,
      locked: validatedCount < p.min,
      tag: "Fond permis",
    });
  }

  return `
    <div class="rec-col-head">
      ${medallion("diamant", "violet", { size: 38 })}
      <div class="rec-col-hb">
        <div class="rec-col-ht">Ma collection</div>
        <div class="rec-col-track" aria-hidden="true"><i style="width:${pct}%"></i></div>
      </div>
      <div class="rec-col-hn">${doneCollect} / ${totalCollect}</div>
    </div>
    ${
      tiles.length
        ? `<div class="rec-grid">${tiles.map((t) => renderCollectionTile(t)).join("")}</div>`
        : `<div class="rec-empty">Valide ta première compétence pour débloquer un trophée.</div>`
    }
    <a class="rec-tout-voir" href="#/galerie" data-track="tout_voir_collection">Tout voir ma collection →</a>`;
}

function renderCollectionTile(t) {
  return `
  <a class="rec-item" href="#/galerie" data-track="collection_item">
    ${t.tag ? `<span class="rec-tag${t.locked ? "" : " gold"}">${esc(t.tag)}</span>` : ""}
    <div class="rec-item-vis${t.locked ? " locked" : ""}">
      <img class="pad" src="${esc(t.img || "")}" alt="" loading="lazy" onerror="this.style.display='none'">
    </div>
    <div class="rec-item-b">
      <div class="rec-item-t">${t.locked ? "???" : esc(t.name)}</div>
      <div class="rec-item-r">${t.locked ? "Verrouillé" : "Débloqué"}</div>
    </div>
  </a>`;
}

// ─── Onglet Trophées (résumé trophees.js) ─────────────────────
function renderTropheesPanel(ctx) {
  const { unlockedDefs, lockedDefs, freshTrophies } = ctx;
  const total = CATALOG.length;

  const claimHtml = freshTrophies.length
    ? `
    <a class="rec-gold-card" href="#/trophees" data-track="trophee_claim_card">
      <span class="rec-gold-k">Nouveau</span>
      <div class="rec-star-row">
        <span style="width:56px;height:56px;flex:none;display:flex;align-items:center;justify-content:center">${badgeMarkup(freshTrophies[0], 56)}</span>
        <div class="rec-star-txt">
          <div class="rec-star-t">${esc(freshTrophies[0].title)}</div>
          <div class="rec-star-s">${esc(freshTrophies[0].body || "")}</div>
        </div>
      </div>
      <div class="rec-star-foot"><span></span><span class="rec-go-shop">Voir mes trophées</span></div>
    </a>`
    : "";

  const preview = [
    ...unlockedDefs.slice(0, 4),
    ...lockedDefs.slice(0, 6 - Math.min(4, unlockedDefs.length)),
  ].slice(0, 6);
  const gridHtml = preview.length
    ? `<div class="rec-sec-h"><h2>Mes trophées</h2><span>${unlockedDefs.length} sur ${total} débloqués</span></div>
       <div class="rec-tro-grid">${preview.map((t) => renderTrophyTile(t, ctx.unlockedSet.has(t.key))).join("")}</div>`
    : "";

  return `${claimHtml}${gridHtml}
    <a class="rec-tout-voir" href="#/trophees" data-track="tout_voir_trophees">Tout voir mes trophées →</a>`;
}

function renderTrophyTile(t, unlocked) {
  const color = RARITY_COLOR[t.rarity] || "var(--mu2)";
  return `
  <a class="rec-tro${unlocked ? "" : " locked"}" href="#/trophees" data-track="trophee_item">
    ${unlocked ? `<span class="rec-tro-dot" style="background:${color}" aria-hidden="true"></span>` : ""}
    ${badgeMarkup(t, 48)}
    <div class="rec-tro-t">${unlocked ? esc(t.title) : "???"}</div>
  </a>`;
}

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track("page_view", { page: "recompenses_hub", role: me.role });

  root.innerHTML = skeleton();

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const [
    spinRes,
    rewardsRes,
    chestsRes,
    achRes,
    validRes,
    itemsRes,
    condRes,
    revRes,
    selfValRes,
  ] = await Promise.allSettled([
    sb
      .from("roue_daily_spins")
      .select("volants")
      .eq("spin_date", today)
      .maybeSingle(),
    sb.rpc("get_moniteur_rewards"),
    getMyChests(),
    sb.rpc("get_my_achievements"),
    sb
      .from("validations")
      .select("competence_id")
      .eq("eleve_id", me.id)
      .eq("statut", "acquis"),
    sb.rpc("get_items_catalog"),
    sb.rpc("get_eleve_leaderboard", { p_scope: "ecole", p_limit: 50 }),
    sb.rpc("get_theory_leaderboard_weekly", { p_scope: "ecole", p_limit: 50 }),
    // Validation autonome (élève solo, valider-seul.js) : table séparée de
    // `validations`, fusionnée pour ne pas laisser le palier permis bloqué.
    // Même pattern que accueil.js / mon-permis.js.
    sb.from("self_validations").select("competence_id").eq("eleve_id", me.id),
  ]);

  // ── Roue ──
  const spinAvailable =
    spinRes.status === "fulfilled" && !spinRes.value.error
      ? !spinRes.value.data
      : true; // repli optimiste (même logique que roue.js : "apercu")
  let realLots = [];
  let moniteurPrenom = null;
  if (rewardsRes.status === "fulfilled" && !rewardsRes.value.error) {
    const d = rewardsRes.value.data;
    if (Array.isArray(d?.lots)) realLots = d.lots;
    moniteurPrenom = d?.moniteur || null;
  }
  const anyBig = realLots.some((l) => l && l.big);

  // ── Série (pour "prochain coffre") ──
  const streak = getStreak();

  // ── Coffres ──
  const chests = chestsRes.status === "fulfilled" ? chestsRes.value || [] : [];
  const coffresToOpen = chests.filter((c) => !c.opened_at).length;

  // ── Trophées / achievements ──
  const unlockedList =
    achRes.status === "fulfilled" && !achRes.value?.error
      ? achRes.value.data || []
      : [];
  const unlockedSet = new Set(unlockedList.map((u) => u.achievement_key));
  const unlockedDefs = CATALOG.filter((t) => unlockedSet.has(t.key));
  const lockedDefs = CATALOG.filter((t) => !unlockedSet.has(t.key));
  const freshTrophies = getFreshTrophies(unlockedDefs);

  // Compétences acquises (moniteur ou auto-validées), dédupliquées.
  const _compSet = new Set(
    validRes.status === "fulfilled"
      ? (validRes.value?.data || []).map((v) => v.competence_id)
      : [],
  );
  if (selfValRes.status === "fulfilled") {
    for (const s of selfValRes.value?.data || []) _compSet.add(s.competence_id);
  }
  const validatedCount = _compSet.size;
  const unlockedPermisCount = PERMIS_TIERS.filter(
    (t) => validatedCount >= t.min,
  ).length;

  // ── Boutique ──
  const itemsFailed = itemsRes.status === "rejected" || !!itemsRes.value?.error;
  const allItems =
    itemsRes.status === "fulfilled" ? itemsRes.value?.data || [] : [];
  const shopItems = allItems
    .filter((i) => i.type === "avatar" || i.type === "permis_bg")
    .sort(byPrestige);

  const ctx = {
    spinAvailable,
    anyBig,
    moniteurPrenom,
    coffresToOpen,
    freshTrophies,
    streak,
    itemsFailed,
    shopItems,
    unlockedDefs,
    lockedDefs,
    unlockedSet,
    unlockedPermisCount,
    validatedCount,
  };

  root.innerHTML = `${STYLE}
  <div class="rec anim-slide-up">
    <h1 class="rec-title" tabindex="-1">Récompenses</h1>
    ${
      streak.count > 0
        ? `<div class="rec-serie">${medallion("flamme", "orange", { size: 22 })}<b>Série : ${streak.count} jour${streak.count > 1 ? "s" : ""}</b></div>`
        : ""
    }
    ${renderHero(ctx)}

    <div class="rec-tabs" role="tablist" aria-label="Salles Récompenses">
      <button class="rec-tab on" role="tab" aria-selected="true" data-p="boutique">Boutique</button>
      <button class="rec-tab" role="tab" aria-selected="false" data-p="collection">Ma collection</button>
      <button class="rec-tab" role="tab" aria-selected="false" data-p="trophees">Trophées</button>
      <button class="rec-tab" role="tab" aria-selected="false" data-p="ligue">Ligue</button>
    </div>

    <div class="rec-panel on" id="rec-p-boutique" role="tabpanel">${renderBoutiquePanel(ctx)}</div>
    <div class="rec-panel" id="rec-p-collection" role="tabpanel">${renderCollectionPanel(ctx)}</div>
    <div class="rec-panel" id="rec-p-trophees" role="tabpanel">${renderTropheesPanel(ctx)}</div>
    <div class="rec-panel" id="rec-p-ligue" role="tabpanel"><div id="rec-ligue-slot"></div></div>
  </div>`;

  // ── Onglets : clic = bascule instantanée (tout est déjà rendu) ──
  const tabs = root.querySelectorAll(".rec-tab");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = btn.dataset.p;
      if (btn.classList.contains("on")) return;
      haptic("select");
      track("recompenses_hub.tab", { tab: p });
      tabs.forEach((b) => {
        b.classList.toggle("on", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      root.querySelectorAll(".rec-panel").forEach((panel) => {
        panel.classList.toggle("on", panel.id === `rec-p-${p}`);
      });
    });
  });

  // ── Tracking clics (CTA roue, claims, tout voir, items) — délégation ──
  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    track(`recompenses_hub.${el.dataset.track}`);
  });
  root.querySelector("#rec-roue-cta")?.addEventListener("click", () => {
    haptic("tap");
  });

  // ── Ligue : composant partagé (identique à accueil.js) ──
  const conduite =
    condRes.status === "fulfilled" && Array.isArray(condRes.value?.data)
      ? condRes.value.data
      : [];
  const revision =
    revRes.status === "fulfilled" && Array.isArray(revRes.value?.data)
      ? revRes.value.data
      : [];
  if (!document.getElementById("lgh-css")) {
    const st = document.createElement("style");
    st.id = "lgh-css";
    st.textContent = LEAGUE_HERO_CSS;
    document.head.appendChild(st);
  }
  const ligueSlot = root.querySelector("#rec-ligue-slot");
  if (ligueSlot)
    mountLeagueHero(ligueSlot, { conduite, revision, defaultTab: "revision" });
}
