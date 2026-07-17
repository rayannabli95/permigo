// ═══════════════════════════════════════════════════════════════
// Héros « Ta Ligue » — carte Arène (nuit) posée sur l'accueil.
// LIGUE UNIQUE depuis le pivot 17/07 (décision Rayan) :
//  · l'ancien toggle Conduite/Révision est supprimé — deux ligues = trop
//    d'info, et l'onglet « Révision » faisait « app de code »
//  · LA ligue = SAISON HEBDO d'activité (points de la semaine, reset lundi)
//  · les compétences certifiées apparaissent comme GRADE (x/31) à côté du
//    rang — la certification est valorisée, pas concurrente
//  · pédagogie visible : l'élève doit comprendre COMMENT monter
//  · couleurs : tokens accent (--a/--adk) + or réservé au rang et au trophée
//    (« trop de variations de couleurs » — Rayan, 17/07)
// Carte toujours sombre (skin Arène) : contraste = mise en avant.
// Données : lignes leaderboard { rang, display_name, score, is_me, avatar }.
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { navigate } from "@/router.js";
import { track } from "@/services/analytics.js";
import { msToNextMonday, fmtCountdown } from "@/utils/league-shared.js";

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

// Jusqu'à 3 lignes de podium : top-3, ou top-2 + moi si je suis plus bas.
function podiumRows(m) {
  if (!m.sorted.length) return [];
  if (m.classed && m.mine.rang <= 3) return m.sorted.slice(0, 3);
  if (m.classed) return [m.sorted[0], m.sorted[1], m.mine].filter(Boolean);
  return m.sorted.slice(0, 3);
}

function heroRowHtml(r, isMe) {
  const rk = r.rang;
  const disc =
    rk <= 3
      ? `lgh-disc lgh-m${rk}`
      : isMe
        ? "lgh-disc lgh-me-disc"
        : "lgh-disc";
  const pts = r.score ?? 0;
  return `<div class="lgh-row${isMe ? " is-me" : ""}">
    <span class="${disc}">${rk}</span>
    <span class="lgh-nm">${isMe ? "Toi" : esc(r.display_name || "")}</span>
    ${isMe && rk > 3 ? `<span class="lgh-tag">${rk}ᵉ</span>` : ""}
    <span class="lgh-pts">${pts} pt${pts > 1 ? "s" : ""}</span>
  </div>`;
}

function goalHtml(m) {
  if (!m.classed) {
    return `<div class="lgh-goal lgh-goal-invite">
      <span class="lgh-goal-t">Réponds à des questions cette semaine — chaque bonne réponse te fait entrer dans la course.</span>
    </div>`;
  }
  if (m.mine.rang === 1) {
    return `<div class="lgh-goal">
      <div class="lgh-goal-hd"><span>Tu es en tête — garde ta place 👑</span></div>
      <div class="lgh-track"><i style="width:100%"></i></div>
    </div>`;
  }
  if (m.above) {
    const unit = m.gap > 1 ? "pts" : "pt";
    const mine = m.mine.score ?? 0;
    const goal = m.above.score ?? 0;
    const pct =
      goal > 0 ? Math.min(100, Math.max(8, (mine / goal) * 100)) : 100;
    const who =
      m.mine.rang - 1 === 1
        ? "la 1ʳᵉ place"
        : `${esc(m.above.display_name || "")}`;
    return `<div class="lgh-goal">
      <div class="lgh-goal-hd">
        <span>Plus que <b>${m.gap} ${unit}</b> pour dépasser ${who}</span>
        <em>${mine} / ${goal}</em>
      </div>
      <div class="lgh-track"><i style="width:${pct.toFixed(0)}%"></i></div>
    </div>`;
  }
  return "";
}

function renderHero(models, solo) {
  const m = models.revision;
  const grade = models.conduite?.mine?.score ?? null;
  const rows = podiumRows(m);

  const rankBig = m.classed
    ? `<span class="lgh-hash">#</span>${m.mine.rang}`
    : "—";
  const ofTxt = m.classed
    ? `sur ${m.total} élève${m.total > 1 ? "s" : ""}`
    : "Pas encore de points cette semaine";

  const podium = rows.length
    ? `<div class="lgh-podium">${rows
        .map((r) => heroRowHtml(r, r.is_me === true))
        .join("")}</div>`
    : `<div class="lgh-podium lgh-podium-empty">Personne n'a encore marqué cette semaine — lance-toi !</div>`;

  return `<div class="lgh-eyebrow">Ta ligue</div>
  <div class="lgh" role="button" tabindex="0"
       aria-label="Ta ligue de la semaine — voir le classement">
    <span class="lgh-glow lgh-glow-a" aria-hidden="true"></span>
    <span class="lgh-glow lgh-glow-b" aria-hidden="true"></span>

    <div class="lgh-top">
      <span class="lgh-kick">${icon("trophy", { size: 13, strokeWidth: 2.4 })} ${solo ? "Élèves PermiGo" : "Ton école"}</span>
      <span class="lgh-chip lgh-chip-season">${icon("clock", { size: 12, strokeWidth: 2.6 })} Fin de saison · <b>${esc(fmtCountdown(msToNextMonday()))}</b></span>
    </div>

    <div class="lgh-core">
      <div class="lgh-rank">
        <span class="lgh-rank-lbl">Ta place</span>
        <span class="lgh-rank-big${m.classed ? "" : " is-empty"}">${rankBig}</span>
        <span class="lgh-rank-of">${esc(ofTxt)}</span>
        ${grade != null ? `<span class="lgh-grade" title="Compétences acquises">${icon("shield", { size: 11, strokeWidth: 2.6 })} ${grade}/31 compétences</span>` : ""}
      </div>
      ${podium}
    </div>

    <p class="lgh-how">Quiz, préparations, mises en situation : chaque bonne réponse = des points. Remise à zéro chaque lundi.</p>

    ${goalHtml(m)}

    <button class="lgh-cta" type="button" data-cta>
      Voir le classement <span aria-hidden="true">→</span>
    </button>
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
// L'or ne reste que sur le rang, le trophée et la médaille n°1.
export const LEAGUE_HERO_CSS = `
.lgh-eyebrow{
  font:800 11.5px/1 'Plus Jakarta Sans',sans-serif;letter-spacing:.06em;
  text-transform:uppercase;color:var(--mu);margin:28px 20px 10px;
  display:flex;align-items:center;gap:8px;
}
.lgh-eyebrow::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--bo),transparent);}

.lgh{
  position:relative;margin:0 15px;padding:16px 16px 15px;border-radius:26px;
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

/* lueur de fond — une seule, à l'accent */
.lgh-glow{position:absolute;border-radius:50%;pointer-events:none;filter:blur(34px);z-index:0}
.lgh-glow-a{width:200px;height:150px;top:-60px;right:-40px;background:radial-gradient(circle,color-mix(in srgb, var(--a) 30%, transparent),transparent 68%)}
.lgh-glow-b{width:230px;height:180px;bottom:-70px;left:-60px;background:radial-gradient(circle,color-mix(in srgb, var(--a) 24%, transparent),transparent 68%)}
.lgh>*{position:relative;z-index:1}

/* top : badge école + chip saison */
.lgh-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.lgh-kick{display:inline-flex;align-items:center;gap:5px;padding:5px 11px 5px 9px;border-radius:999px;
  font:800 12px/1 'Baloo 2','Plus Jakarta Sans',cursive;letter-spacing:.02em;color:#ffe9a8;
  background:rgba(255,210,74,.13);border:1px solid rgba(255,210,74,.35)}
.lgh-kick svg{color:#ffd24a}
.lgh-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:999px;
  font:800 11.5px/1 'Plus Jakarta Sans',sans-serif}
.lgh-chip-season{color:#e4defc;background:rgba(10,7,24,.5);
  border:1px solid color-mix(in srgb, var(--a) 40%, transparent)}
.lgh-chip-season svg{color:var(--a-lt)}
.lgh-chip-season b{color:#fff;font-variant-numeric:tabular-nums}

/* cœur : rang + podium */
.lgh-core{display:flex;align-items:center;gap:14px;margin-top:15px}
.lgh-rank{flex:0 0 auto;display:flex;flex-direction:column;min-width:96px}
.lgh-rank-lbl{font:800 11px/1 'Nunito',sans-serif;color:#c9c2ea}
.lgh-rank-big{font:800 60px/1 'Baloo 2',cursive;letter-spacing:-.03em;margin:1px 0 2px;
  background:linear-gradient(180deg,#fff 0%,#fff7e0 50%,#ffd86b 100%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 3px 2px rgba(0,0,0,.35))}
.lgh-rank-big.is-empty{font-size:52px;opacity:.85}
.lgh-hash{font-size:32px;-webkit-text-fill-color:#ffd24a;color:#ffd24a;vertical-align:12px;margin-right:1px}
.lgh-rank-of{font:800 11.5px/1.25 'Nunito',sans-serif;color:#c9c2ea}
.lgh-grade{display:inline-flex;align-items:center;gap:4px;margin-top:7px;padding:4px 9px;border-radius:999px;
  font:800 10.5px/1 'Plus Jakarta Sans',sans-serif;color:#e4defc;
  background:color-mix(in srgb, var(--a) 22%, transparent);
  border:1px solid color-mix(in srgb, var(--a) 45%, transparent);align-self:flex-start}
.lgh-grade svg{color:var(--a-lt)}

.lgh-podium{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding:9px 10px;border-radius:16px;
  background:rgba(11,8,34,.6);border:1px solid color-mix(in srgb, var(--a) 26%, transparent)}
.lgh-podium-empty{display:block;padding:16px 12px;text-align:center;
  font:700 12px/1.4 'Nunito',sans-serif;color:#c9c2ea}
.lgh-row{display:flex;align-items:center;gap:9px}
.lgh-row.is-me{margin:1px 0;padding:6px;border-radius:11px;
  background:linear-gradient(90deg,color-mix(in srgb,var(--a) 30%,transparent),color-mix(in srgb,var(--a) 8%,transparent));
  border:1px solid color-mix(in srgb,var(--a) 55%,transparent)}
.lgh-disc{flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font:900 12px/1 'Nunito',sans-serif;color:#2b2450;
  box-shadow:inset 0 1px 1px rgba(255,255,255,.55),0 2px 4px rgba(0,0,0,.4)}
.lgh-m1{background:radial-gradient(circle at 38% 30%,#fff3c4,#ffd24a 55%,#e8991c);color:#3a2600}
.lgh-m2{background:radial-gradient(circle at 38% 30%,#fbfdff,#cfd8e6 55%,#9aa6b8);color:#2b3446}
.lgh-m3{background:radial-gradient(circle at 38% 30%,#ffe0c4,#e0a06a 55%,#b06a34);color:#3a1e08}
.lgh-me-disc{background:linear-gradient(150deg,var(--a-lt),var(--adk));color:#fff;
  box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 45%,transparent)}
.lgh-nm{flex:1;min-width:0;font:800 12.5px/1 'Nunito',sans-serif;color:#f4f2ff;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lgh-row.is-me .lgh-nm{color:#fff}
.lgh-tag{flex:0 0 auto;font:900 9px/1 'Nunito',sans-serif;color:#0f0824;background:var(--a-lt);
  padding:2px 6px;border-radius:999px}
.lgh-pts{flex:0 0 auto;font:800 12px/1 'Plus Jakarta Sans',sans-serif;color:#e4defc;font-variant-numeric:tabular-nums}

/* pédagogie : COMMENT on monte (demande Rayan : que l'élève comprenne) */
.lgh-how{margin:11px 2px 0;font:700 11.5px/1.45 'Nunito',sans-serif;color:#c9c2ea}

/* objectif */
.lgh-goal{margin-top:11px;padding:11px 13px;border-radius:15px;
  background:color-mix(in srgb, var(--a) 12%, transparent);
  border:1px solid color-mix(in srgb, var(--a) 30%, transparent)}
.lgh-goal-invite{background:rgba(11,8,34,.4)}
.lgh-goal-hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;
  font:800 11.5px/1.3 'Nunito',sans-serif;color:#e9e4ff;margin-bottom:8px}
.lgh-goal-hd b{color:#fff}
.lgh-goal-hd em{flex:0 0 auto;font-style:normal;color:#fff;font-family:'Plus Jakarta Sans';font-weight:800;font-variant-numeric:tabular-nums}
.lgh-goal-t{font:800 12px/1.35 'Nunito',sans-serif;color:#e7ddff}
.lgh-track{height:8px;border-radius:999px;background:rgba(10,7,24,.6);box-shadow:inset 0 1px 2px rgba(0,0,0,.6);overflow:hidden}
.lgh-track i{display:block;height:100%;border-radius:999px;
  background:linear-gradient(90deg,var(--adk),var(--a-lt));
  box-shadow:0 0 10px color-mix(in srgb,var(--a) 70%,transparent)}

/* CTA accent 3D */
.lgh-cta{width:100%;margin-top:13px;min-height:52px;border:0;border-radius:16px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;
  font:800 17px/1 'Baloo 2',cursive;color:#fff;letter-spacing:.3px;text-shadow:0 2px 0 color-mix(in srgb, var(--adk) 60%, transparent);
  background:linear-gradient(180deg,color-mix(in srgb, var(--a) 88%, #fff) 0%,var(--a) 52%,var(--adk) 100%);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -4px 8px rgba(0,0,0,.22),0 6px 0 var(--adk),0 12px 22px -6px color-mix(in srgb, var(--a) 70%, transparent);
  transition:transform .1s,box-shadow .1s}
.lgh-cta span{font-size:19px}
.lgh-cta:active{transform:translateY(4px);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 2px 0 var(--adk),0 6px 12px -6px color-mix(in srgb, var(--a) 70%, transparent)}
`;
