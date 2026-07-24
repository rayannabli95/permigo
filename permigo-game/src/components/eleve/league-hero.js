// ═══════════════════════════════════════════════════════════════
// Héros « Ta Ligue » — carte Arène (nuit) posée sur l'accueil.
// LIGUE UNIQUE depuis le pivot 17/07 (décision Rayan).
// CARTE RÉDUITE (demande Rayan 17/07) : on ne montre plus le podium, ni le
// texte « comment ça marche », ni la barre de progression. Juste :
//  · TA PLACE (gros rang doré) + ton école · N élèves
//  · le compte à rebours de fin de saison (chip)
//  · UNE ligne d'objectif (« plus que X pts pour passer Nᵉ »)
// Le détail complet (podium, points, comment monter) vit dans la page
// « Voir le classement » (toute la carte est tappable → #/classement).
// Carte toujours sombre (skin Arène) ; or réservé au rang.
// Données : lignes leaderboard { rang, display_name, score, is_me, avatar }.
// ═══════════════════════════════════════════════════════════════
import { esc, escAttr } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { navigate } from "@/router.js";
import { track } from "@/services/analytics.js";
import { msToNextMonday, fmtCountdown } from "@/utils/league-shared.js";
import { getLang } from "@/utils/lang.js";

// ── i18n de la COQUE (EN/AR) — dict local, repli FR (règle coque validée 3×).
const LGH_I18N = {
  en: {
    eyebrow: "Your league",
    season: "Season ends · ",
    place: "Your rank",
    school: "Your school",
    solo: "PermiGo learners",
    of_students: "{org} · {n} learner{s}",
    aria: "Your league this week — {st} — see the leaderboard",
    aria_rank: "you're {r} of {n}",
    aria_empty: "no points yet this week",
    invite:
      "Answer questions this week — every right answer puts you in the race.",
    top: "You're in the lead — keep your spot",
    gap: "Only <b>{g} {u}</b> to overtake {w}",
    first_place: "1st place",
    pt: "pt",
    pts: "pts",
  },
  ar: {
    eyebrow: "دوريك",
    season: "نهاية الموسم · ",
    place: "مركزك",
    school: "مدرستك",
    solo: "طلاب بيرميغو",
    of_students: "{org} · {n} طالبًا",
    aria: "دوريك هذا الأسبوع — {st} — عرض الترتيب",
    aria_rank: "أنت في المركز {r} من أصل {n}",
    aria_empty: "لا نقاط بعد هذا الأسبوع",
    invite: "أجب عن أسئلة هذا الأسبوع — كل إجابة صحيحة تُدخلك السباق.",
    top: "أنت في الصدارة — حافظ على مركزك",
    gap: "تفصلك <b>{g} {u}</b> عن تجاوز {w}",
    first_place: "المركز الأول",
    pt: "نقطة",
    pts: "نقاط",
  },
};
function lgt(key, fr) {
  const l = getLang();
  return (l !== "fr" && LGH_I18N[l]?.[key]) || fr;
}
// Isolation RTL par span (l'app reste LTR — cf. utils/lang.js).
function lgRtl(html) {
  return getLang() === "ar" ? `<span dir="rtl">${html}</span>` : html;
}
// Compte à rebours localisé (fmtCountdown écrit « 2j 5h » en FR).
function lgCountdown(ms) {
  const l = getLang();
  if (l === "fr") return fmtCountdown(ms);
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (l === "ar") {
    if (d > 0) return `${d} يوم ${h} س`;
    if (h > 0) return `${h} س ${m} د`;
    return `${m} د`;
  }
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

// Vue-modèle d'une ligue à partir des lignes de classement.
function buildModel(rows) {
  const arr = Array.isArray(rows) ? rows : [];
  const active = arr.filter((r) => (r.score ?? 0) > 0 && r.rang != null);
  const sorted = active.slice().sort((a, b) => a.rang - b.rang);
  const mine = arr.find((r) => r.is_me === true) || null;
  const classed = !!mine && (mine.score ?? 0) > 0 && mine.rang != null;
  const above =
    classed && mine.rang > 1
      ? active.find((r) => r.rang === mine.rang - 1) || null
      : null;
  const gap = above ? Math.max(0, (above.score ?? 0) - (mine.score ?? 0)) : 0;
  return { active, sorted, total: active.length, mine, classed, above, gap };
}

// UNE ligne d'objectif — jamais culpabilisante, toujours « voilà comment monter ».
function nudgeLine(m) {
  if (!m.classed) {
    return `<div class="lgh-nudge lgh-nudge-invite">${lgRtl(esc(lgt("invite", "Réponds à des questions cette semaine — chaque bonne réponse te fait entrer dans la course.")))}</div>`;
  }
  if (m.mine.rang === 1) {
    return `<div class="lgh-nudge"><span class="lgh-up" aria-hidden="true">👑</span> ${lgRtl(esc(lgt("top", "Tu es en tête — garde ta place")))}</div>`;
  }
  if (m.above) {
    const unit = m.gap > 1 ? lgt("pts", "pts") : lgt("pt", "pt");
    const who =
      m.mine.rang - 1 === 1
        ? esc(lgt("first_place", "la 1ʳᵉ place"))
        : esc(m.above.display_name || "");
    return `<div class="lgh-nudge"><span class="lgh-up" aria-hidden="true">▲</span> ${lgRtl(
      lgt("gap", "Plus que <b>{g} {u}</b> pour passer {w}")
        .replace("{g}", m.gap)
        .replace("{u}", esc(unit))
        .replace("{w}", who),
    )}</div>`;
  }
  return "";
}

function renderHero(models, solo) {
  const m = models.revision;
  const rankBig = m.classed
    ? `<span class="lgh-hash">#</span>${m.mine.rang}`
    : "—";
  const org = solo ? lgt("solo", "Élèves PermiGo") : lgt("school", "Ton école");
  const lang = getLang();
  const ofTxt = m.classed
    ? lang === "fr"
      ? `${org} · ${m.total} élève${m.total > 1 ? "s" : ""}`
      : lgt("of_students", "{org} · {n} élèves")
          .replace("{org}", org)
          .replace("{n}", m.total)
          .replace("{s}", m.total > 1 ? "s" : "")
    : org;
  const ariaSt = m.classed
    ? lgt("aria_rank", "tu es {r}ᵉ sur {n}")
        .replace("{r}", m.mine.rang)
        .replace("{n}", m.total)
    : lgt("aria_empty", "pas encore de points cette semaine");

  return `<div class="lgh-eyebrow">${lgRtl(esc(lgt("eyebrow", "Ta ligue")))}</div>
  <div class="lgh" role="button" tabindex="0"
       aria-label="${escAttr(lgt("aria", "Ta ligue de la semaine — {st} — voir le classement").replace("{st}", ariaSt))}">
    <span class="lgh-glow lgh-glow-a" aria-hidden="true"></span>
    <span class="lgh-glow lgh-glow-b" aria-hidden="true"></span>

    <div class="lgh-head">
      <span class="lgh-season">${icon("clock", { size: 12, strokeWidth: 2.6 })} ${lgRtl(`${esc(lgt("season", "Fin de saison · "))}<b>${esc(lgCountdown(msToNextMonday()))}</b>`)}</span>
    </div>

    <div class="lgh-core">
      <span class="lgh-rank-big${m.classed ? "" : " is-empty"}">${rankBig}</span>
      <div class="lgh-mid">
        <span class="lgh-lbl">${lgRtl(esc(lgt("place", "Ta place")))}</span>
        <span class="lgh-of">${lgRtl(esc(ofTxt))}</span>
      </div>
      <span class="lgh-go" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </div>

    ${nudgeLine(m)}
  </div>`;
}

/**
 * Monte le héros (ligue unique) dans un slot.
 * @param {HTMLElement} slot
 * @param {{conduite: Array, revision: Array, solo?: boolean}} data
 *   revision = LA ligue (saison hebdo) · conduite = source du grade x/31.
 *   solo : élève sans moniteur → libellé « Élèves PermiGo » (pas d'école).
 */
export function mountLeagueHero(slot, { conduite, revision, solo } = {}) {
  const models = {
    conduite: buildModel(conduite),
    revision: buildModel(revision),
  };

  const go = () => {
    track("league_hero.open", { ligue: "semaine" });
    navigate("#/classement/revision");
  };

  slot.innerHTML = renderHero(models, solo);
  const card = slot.querySelector(".lgh");
  card?.addEventListener("click", go);
  card?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  });
}

// ─── CSS (injecté une fois ; carte toujours sombre — skin Arène) ────
// Palette resserrée : fond nuit + ACCENT du compte (--a/--a-lt/--adk).
// L'or ne reste que sur le rang.
export const LEAGUE_HERO_CSS = `
.lgh-eyebrow{
  font:800 11.5px/1 'Plus Jakarta Sans',sans-serif;letter-spacing:.06em;
  text-transform:uppercase;color:var(--mu);margin:28px 20px 10px;
  display:flex;align-items:center;gap:8px;
}
.lgh-eyebrow::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--bo),transparent);}

.lgh{
  position:relative;margin:0 15px;padding:17px 17px 16px;border-radius:24px;
  overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent;
  border:1.5px solid color-mix(in srgb, var(--a) 45%, transparent);
  background:linear-gradient(158deg,#221a44 0%,#191340 50%,#110c2c 100%);
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.10),
    inset 0 -14px 30px rgba(0,0,0,.42),
    0 10px 0 #120a2e,
    0 24px 44px -16px rgba(40,20,90,.9);
  animation:lghReveal .42s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes lghReveal{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.lgh{animation:none}}
.lgh:active{transform:scale(.992)}
.lgh:focus-visible{outline:2px solid var(--a-lt);outline-offset:3px}

/* lueur de fond — à l'accent */
.lgh-glow{position:absolute;border-radius:50%;pointer-events:none;filter:blur(34px);z-index:0}
.lgh-glow-a{width:200px;height:150px;top:-60px;right:-40px;background:radial-gradient(circle,color-mix(in srgb, var(--a) 30%, transparent),transparent 68%)}
.lgh-glow-b{width:230px;height:180px;bottom:-70px;left:-60px;background:radial-gradient(circle,color-mix(in srgb, var(--a) 24%, transparent),transparent 68%)}
.lgh>*{position:relative;z-index:1}

/* chip saison — sur sa PROPRE ligne, alignée à droite (plus d'absolute → plus de collision avec la flèche) */
.lgh-head{display:flex;justify-content:flex-end;margin-bottom:6px}
.lgh-season{display:inline-flex;align-items:center;gap:5px;
  padding:5px 10px;border-radius:999px;font:800 11px/1 'Plus Jakarta Sans',sans-serif;color:#e4defc;
  background:rgba(10,7,24,.55);border:1px solid color-mix(in srgb, var(--a) 40%, transparent)}
.lgh-season svg{color:var(--a-lt)}
.lgh-season b{color:#fff;font-variant-numeric:tabular-nums}

/* cœur : gros rang doré + place + flèche */
.lgh-core{display:flex;align-items:center;gap:15px;margin-top:8px}
.lgh-rank-big{flex:0 0 auto;font:800 58px/.86 'Baloo 2',cursive;letter-spacing:-.03em;
  background:linear-gradient(180deg,#fff 0%,#fff7e0 50%,#ffd86b 100%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 3px 2px rgba(0,0,0,.35))}
.lgh-rank-big.is-empty{font-size:44px;opacity:.85}
.lgh-hash{font-size:28px;-webkit-text-fill-color:#ffd24a;color:#ffd24a;vertical-align:14px;margin-right:1px}
.lgh-mid{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.lgh-lbl{font:800 10.5px/1 'Plus Jakarta Sans',sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#c9c2ea}
.lgh-of{font:800 15px/1.2 'Baloo 2','Plus Jakarta Sans',sans-serif;color:#f7f5ff;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lgh-go{flex:0 0 auto;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  color:#fff;background:linear-gradient(180deg,color-mix(in srgb, var(--a) 85%, #fff) 0%,var(--a) 50%,var(--adk) 100%);
  box-shadow:0 4px 12px -2px color-mix(in srgb,var(--a) 55%,transparent),inset 0 1px 0 rgba(255,255,255,.45)}
.lgh-go svg{width:18px;height:18px}

/* objectif : une seule ligne (jamais culpabilisante) */
.lgh-nudge{margin-top:13px;padding-top:12px;border-top:1px solid color-mix(in srgb, var(--a) 22%, transparent);
  font:800 12.5px/1.35 'Nunito',sans-serif;color:#e7ddff;display:flex;align-items:center;gap:7px}
.lgh-nudge b{color:#fff}
.lgh-nudge .lgh-up{color:#ffd24a;font-size:13px;flex:0 0 auto}
.lgh-nudge-invite{color:#c9c2ea;font-weight:700}
`;
