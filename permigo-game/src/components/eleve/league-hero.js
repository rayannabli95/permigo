// ═══════════════════════════════════════════════════════════════
// Héros « Ta Ligue » — carte Arène (nuit-violet) posée sur l'accueil.
// Met la ligue EN AVANT (l'entrée était noyée dans un teaser 2 cartes).
//  · Toggle Conduite / Révision (2 dimensions à égalité)
//  · Conduite = classement cumulé à VIE (validations moniteur) → « À vie »
//  · Révision = SAISON HEBDO (reset lundi) → compte à rebours de fin
//  · Rang héros + mini-podium + « plus que X pts pour dépasser… » + CTA
// Carte toujours sombre (comme la page classement / skin Arène), quel que
// soit le thème de l'app : contraste = mise en avant sur l'accueil clair.
// Données : lignes leaderboard { rang, display_name, score, is_me, avatar }.
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { playPop } from "@/utils/sound.js";
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

function goalHtml(active, m) {
  const isRev = active === "revision";
  if (!m.classed) {
    const txt = isRev
      ? "Réussis un quiz cette semaine pour entrer dans la saison."
      : "Valide une compétence avec ton moniteur pour te classer.";
    return `<div class="lgh-goal lgh-goal-invite">
      <span class="lgh-goal-t">${esc(txt)}</span>
    </div>`;
  }
  if (m.mine.rang === 1) {
    return `<div class="lgh-goal">
      <div class="lgh-goal-hd"><span>Tu es en tête — garde ta place 👑</span></div>
      <div class="lgh-track"><i style="width:100%"></i></div>
    </div>`;
  }
  if (m.above) {
    const unit = isRev
      ? m.gap > 1
        ? "pts"
        : "pt"
      : m.gap > 1
        ? "compétences"
        : "compétence";
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

function renderHero(active, models) {
  const m = models[active];
  const isRev = active === "revision";
  const rows = podiumRows(m);

  const chip = isRev
    ? `<span class="lgh-chip lgh-chip-season">${icon("clock", { size: 12, strokeWidth: 2.6 })} Saison · <b>${esc(fmtCountdown(msToNextMonday()))}</b></span>`
    : `<span class="lgh-chip lgh-chip-life">À vie</span>`;

  const rankBig = m.classed
    ? `<span class="lgh-hash">#</span>${m.mine.rang}`
    : "—";
  const ofTxt = m.classed
    ? `sur ${m.total} élève${m.total > 1 ? "s" : ""}`
    : isRev
      ? "Pas encore de points cette semaine"
      : "Pas encore classé";

  const podium = rows.length
    ? `<div class="lgh-podium">${rows
        .map((r) => heroRowHtml(r, r.is_me === true))
        .join("")}</div>`
    : `<div class="lgh-podium lgh-podium-empty">${
        isRev
          ? "Personne n'a encore marqué cette semaine — lance-toi !"
          : "Le classement s'ouvre dès 2 élèves classés."
      }</div>`;

  return `<div class="lgh-eyebrow">Ta ligue</div>
  <div class="lgh" data-lg="${active}" role="button" tabindex="0"
       aria-label="Ligue ${isRev ? "Révision" : "Conduite"} — voir le classement">
    <span class="lgh-glow lgh-glow-a" aria-hidden="true"></span>
    <span class="lgh-glow lgh-glow-b" aria-hidden="true"></span>

    <div class="lgh-top">
      <span class="lgh-kick">${icon("trophy", { size: 13, strokeWidth: 2.4 })} Ton école</span>
      ${chip}
    </div>

    <div class="lgh-seg" role="tablist">
      <button data-lg="conduite" role="tab" aria-selected="${active === "conduite"}" class="${active === "conduite" ? "on" : ""}">Conduite</button>
      <button data-lg="revision" role="tab" aria-selected="${active === "revision"}" class="${active === "revision" ? "on" : ""}">Révision</button>
    </div>

    <div class="lgh-core">
      <div class="lgh-rank">
        <span class="lgh-rank-lbl">Ta place</span>
        <span class="lgh-rank-big${m.classed ? "" : " is-empty"}">${rankBig}</span>
        <span class="lgh-rank-of">${esc(ofTxt)}</span>
      </div>
      ${podium}
    </div>

    ${goalHtml(active, m)}

    <button class="lgh-cta" type="button" data-cta>
      Voir le classement <span aria-hidden="true">→</span>
    </button>
  </div>`;
}

/**
 * Monte le héros dans un slot et gère le toggle + navigation.
 * @param {HTMLElement} slot
 * @param {{conduite: Array, revision: Array, defaultTab?: 'conduite'|'revision'}} data
 */
export function mountLeagueHero(slot, { conduite, revision, defaultTab } = {}) {
  const models = {
    conduite: buildModel(conduite),
    revision: buildModel(revision),
  };
  let active = defaultTab === "revision" ? "revision" : "conduite";

  const go = () => {
    const dest =
      active === "revision" ? "#/classement/revision" : "#/classement/ecole";
    track("league_hero.open", { ligue: active });
    navigate(dest);
  };

  const render = () => {
    slot.innerHTML = renderHero(active, models);
    const card = slot.querySelector(".lgh");
    slot.querySelectorAll(".lgh-seg button").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const next = b.dataset.lg;
        if (next === active) return;
        active = next;
        haptic("select");
        playPop();
        track("league_hero.toggle", { ligue: next });
        render();
      });
    });
    card?.addEventListener("click", (e) => {
      if (e.target.closest(".lgh-seg")) return;
      go();
    });
    card?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  };

  render();
}

// ─── CSS (injecté une fois ; carte toujours sombre — skin Arène) ────
export const LEAGUE_HERO_CSS = `
.lgh-eyebrow{
  font:800 11.5px/1 'Plus Jakarta Sans',sans-serif;letter-spacing:.06em;
  text-transform:uppercase;color:var(--mu);margin:28px 20px 10px;
  display:flex;align-items:center;gap:8px;
}
.lgh-eyebrow::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--bo),transparent);}

.lgh{
  --acc:#a855f7;--acc-lt:#c99bff;--acc-dk:#6d34d6;
  position:relative;margin:0 15px;padding:16px 16px 15px;border-radius:26px;
  overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent;
  border:1.5px solid rgba(255,210,74,.42);
  background:linear-gradient(158deg,#2c1b54 0%,#1d1445 50%,#130b30 100%);
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.12),
    inset 0 -14px 30px rgba(0,0,0,.42),
    0 10px 0 #120a2e,
    0 24px 44px -16px rgba(40,20,90,.9),
    0 0 40px -14px rgba(255,182,44,.45);
  animation:lghReveal .42s cubic-bezier(.34,1.56,.64,1) both;
}
.lgh[data-lg="revision"]{--acc:#3b82f6;--acc-lt:#7fb0ff;--acc-dk:#2563eb;}
@keyframes lghReveal{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.lgh{animation:none}}
.lgh:active{transform:scale(.992)}
.lgh:focus-visible{outline:2px solid var(--acc-lt);outline-offset:3px}

/* lueurs de fond */
.lgh-glow{position:absolute;border-radius:50%;pointer-events:none;filter:blur(34px);z-index:0}
.lgh-glow-a{width:200px;height:150px;top:-60px;right:-40px;background:radial-gradient(circle,rgba(255,182,44,.30),transparent 68%)}
.lgh-glow-b{width:230px;height:180px;bottom:-70px;left:-60px;background:radial-gradient(circle,rgba(124,77,255,.36),transparent 68%)}
.lgh>*{position:relative;z-index:1}

/* liseré doré haut */
.lgh::before{content:'';position:absolute;inset:0;border-radius:26px;padding:1.5px;pointer-events:none;z-index:2;
  background:linear-gradient(180deg,rgba(255,210,74,.6),rgba(255,210,74,0) 42%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude}

/* top : badge école + chip saison / à vie */
.lgh-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.lgh-kick{display:inline-flex;align-items:center;gap:5px;padding:5px 11px 5px 9px;border-radius:999px;
  font:800 12px/1 'Baloo 2','Plus Jakarta Sans',cursive;letter-spacing:.02em;color:#ffe9a8;
  background:rgba(255,210,74,.15);border:1px solid rgba(255,210,74,.4)}
.lgh-kick svg{color:#ffd24a}
.lgh-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:999px;
  font:800 11.5px/1 'Plus Jakarta Sans',sans-serif}
.lgh-chip-season{color:#ffd9cf;background:linear-gradient(180deg,rgba(255,107,107,.2),rgba(255,107,107,.06));
  border:1px solid rgba(255,140,120,.4)}
.lgh-chip-season svg{color:#ff9c6a}
.lgh-chip-season b{color:#fff;font-variant-numeric:tabular-nums}
.lgh-chip-life{color:#cabfef;background:rgba(10,7,24,.5);border:1px solid rgba(178,150,255,.28)}

/* toggle */
.lgh-seg{display:flex;gap:4px;margin-top:13px;padding:3px;border-radius:13px;
  background:rgba(11,8,34,.62);border:1px solid rgba(178,150,255,.22)}
.lgh-seg button{flex:1;height:36px;border:0;border-radius:10px;background:transparent;cursor:pointer;
  font:700 13.5px/1 'Baloo 2','Plus Jakarta Sans',cursive;color:#cabfef;
  transition:color .15s,background .15s}
.lgh-seg button.on{color:#fff;
  background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 70%,transparent),color-mix(in srgb,var(--acc-dk) 62%,transparent));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 3px 8px -3px color-mix(in srgb,var(--acc-dk) 90%,transparent)}

/* cœur : rang + podium */
.lgh-core{display:flex;align-items:center;gap:14px;margin-top:14px}
.lgh-rank{flex:0 0 auto;display:flex;flex-direction:column;min-width:96px}
.lgh-rank-lbl{font:800 11px/1 'Nunito',sans-serif;color:#cabfef}
.lgh-rank-big{font:800 60px/1 'Baloo 2',cursive;letter-spacing:-.03em;margin:1px 0 2px;
  background:linear-gradient(180deg,#fff 0%,#fff7e0 50%,#ffd86b 100%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 3px 2px rgba(0,0,0,.35))}
.lgh-rank-big.is-empty{font-size:52px;opacity:.85}
.lgh-hash{font-size:32px;-webkit-text-fill-color:#ffd24a;color:#ffd24a;vertical-align:12px;margin-right:1px}
.lgh-rank-of{font:800 11.5px/1.25 'Nunito',sans-serif;color:#cabfef}

.lgh-podium{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding:9px 10px;border-radius:16px;
  background:rgba(11,8,34,.6);border:1px solid rgba(178,150,255,.22)}
.lgh-podium-empty{display:block;padding:16px 12px;text-align:center;
  font:700 12px/1.4 'Nunito',sans-serif;color:#cabfef}
.lgh-row{display:flex;align-items:center;gap:9px}
.lgh-row.is-me{margin:1px 0;padding:6px;border-radius:11px;
  background:linear-gradient(90deg,color-mix(in srgb,var(--acc) 30%,transparent),color-mix(in srgb,var(--acc) 8%,transparent));
  border:1px solid color-mix(in srgb,var(--acc) 55%,transparent)}
.lgh-disc{flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font:900 12px/1 'Nunito',sans-serif;color:#2b2450;
  box-shadow:inset 0 1px 1px rgba(255,255,255,.55),0 2px 4px rgba(0,0,0,.4)}
.lgh-m1{background:radial-gradient(circle at 38% 30%,#fff3c4,#ffd24a 55%,#e8991c);color:#3a2600}
.lgh-m2{background:radial-gradient(circle at 38% 30%,#fbfdff,#cfd8e6 55%,#9aa6b8);color:#2b3446}
.lgh-m3{background:radial-gradient(circle at 38% 30%,#ffe0c4,#e0a06a 55%,#b06a34);color:#3a1e08}
.lgh-me-disc{background:linear-gradient(150deg,var(--acc-lt),var(--acc-dk));color:#fff;
  box-shadow:0 0 0 2px color-mix(in srgb,var(--acc) 45%,transparent)}
.lgh-nm{flex:1;min-width:0;font:800 12.5px/1 'Nunito',sans-serif;color:#f4f2ff;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lgh-row.is-me .lgh-nm{color:#fff}
.lgh-tag{flex:0 0 auto;font:900 9px/1 'Nunito',sans-serif;color:#0f0824;background:var(--acc-lt);
  padding:2px 6px;border-radius:999px}
.lgh-pts{flex:0 0 auto;font:800 12px/1 'Plus Jakarta Sans',sans-serif;color:#ffe9a8;font-variant-numeric:tabular-nums}

/* objectif */
.lgh-goal{margin-top:13px;padding:11px 13px;border-radius:15px;
  background:linear-gradient(180deg,rgba(255,210,74,.13),rgba(255,210,74,.04));
  border:1px solid rgba(255,210,74,.28)}
.lgh-goal-invite{background:rgba(11,8,34,.4);border-color:rgba(178,150,255,.24)}
.lgh-goal-hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;
  font:800 11.5px/1.3 'Nunito',sans-serif;color:#ffe9c9;margin-bottom:8px}
.lgh-goal-hd b{color:#ffe9a8}
.lgh-goal-hd em{flex:0 0 auto;font-style:normal;color:#ffe9a8;font-family:'Plus Jakarta Sans';font-weight:800;font-variant-numeric:tabular-nums}
.lgh-goal-t{font:800 12px/1.35 'Nunito',sans-serif;color:#e7ddff}
.lgh-track{height:8px;border-radius:999px;background:rgba(10,7,24,.6);box-shadow:inset 0 1px 2px rgba(0,0,0,.6);overflow:hidden}
.lgh-track i{display:block;height:100%;border-radius:999px;
  background:linear-gradient(90deg,var(--acc-dk),var(--acc-lt));
  box-shadow:0 0 10px color-mix(in srgb,var(--acc) 70%,transparent)}

/* CTA violet 3D */
.lgh-cta{width:100%;margin-top:14px;min-height:52px;border:0;border-radius:16px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;
  font:800 17px/1 'Baloo 2',cursive;color:#fff;letter-spacing:.3px;text-shadow:0 2px 0 color-mix(in srgb, var(--adk) 60%, transparent);
  background:linear-gradient(180deg,var(--a-lt) 0%,var(--a) 52%,var(--adk) 100%);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -4px 8px rgba(0,0,0,.22),0 6px 0 var(--adk),0 12px 22px -6px color-mix(in srgb, var(--a) 70%, transparent);
  transition:transform .1s,box-shadow .1s}
.lgh-cta span{font-size:19px}
.lgh-cta:active{transform:translateY(4px);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 2px 0 var(--adk),0 6px 12px -6px color-mix(in srgb, var(--a) 70%, transparent)}
`;
