// ═══════════════════════════════════════════════════════════════
// Daily Quests — quêtes du jour élève
// RPC : get_today_quests() → [{ quest_id, title, progress, target, completed, claimed, reward_xp, reward_gemmes }]
// RPC : claim_quest({ p_quest_id }) → { xp_gained, gemmes_gained }
// Usage : mountDailyQuests(root) — inject avant .streak-pro
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";
import { ill, illMask } from "@/utils/illustrations.js";
import { toast } from "@/components/common/toast.js";
import { playStar } from "@/utils/sound.js";
import { flyVolants } from "@/components/eleve/volant-reward.js";
import { refreshGemmes } from "@/utils/game-state.js";
import { getLang } from "@/utils/lang.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";

const STYLE_ID = "daily-quests-style";

// ── i18n de la COQUE (EN/AR) — dict local, repli FR (règle coque validée 3×).
// Les titres de quêtes arrivent de la DB en FR, mais c'est un enum FERMÉ de
// quest_id → on traduit PAR ID, repli sur le titre DB nettoyé si id inconnu.
const DQ_I18N = {
  en: {
    title: "Today's quests",
    count: "{n} to claim",
    claim: "Claim",
    done: "Done",
    claim_aria: " — claim the reward",
    missing: "Quest not found.",
    pop_ok: "Quest complete ✓",
    pop_volants: "+{n} steering wheels",
    quest_login: "Log in today",
    quest_validate_1: "Certify a skill",
    quest_quiz_1: "Pass 1 quiz",
    quest_quiz_3: "Pass 3 quizzes",
    quest_streak_keep: "Keep your streak",
    quest_quiz_perfect: "Get 1 perfect quiz",
    go: "Go",
    go_aria: " — go there",
  },
  ar: {
    title: "مهام اليوم",
    count: "{n} للاستلام",
    claim: "استلام",
    done: "تم",
    claim_aria: " — استلم المكافأة",
    missing: "المهمة غير موجودة.",
    pop_ok: "أُنجزت المهمة ✓",
    pop_volants: "+{n} مقود",
    quest_login: "سجّل الدخول اليوم",
    quest_validate_1: "صادِق على مهارة",
    quest_quiz_1: "انجح في اختبار واحد",
    quest_quiz_3: "انجح في 3 اختبارات",
    quest_streak_keep: "حافظ على سلسلتك",
    quest_quiz_perfect: "حقّق اختبارًا بعلامة كاملة",
    go: "اذهب",
    go_aria: " — اذهب إلى هناك",
  },
};
function dqt(key, fr) {
  const l = getLang();
  return (l !== "fr" && DQ_I18N[l]?.[key]) || fr;
}
// Isolation RTL par span (l'app reste LTR — cf. utils/lang.js).
function dqRtl(html) {
  return getLang() === "ar" ? `<span dir="rtl">${html}</span>` : html;
}

// Nettoie un libellé de quête venu de la DB : retire le suffixe technique
// « (≥70%) » / « (70 %) » en fin de titre — du jargon qui ne parle pas à
// l'élève (« Réussir 1 quiz (≥70%) » → « Réussir 1 quiz »).
function cleanQuestTitle(title) {
  return String(title ?? "")
    .replace(/\s*\([^)]*%\)\s*$/u, "")
    .trim();
}

// Titre affiché : traduction par quest_id (enum fermé), repli titre DB nettoyé.
function questTitle(q) {
  return dqt(q.quest_id, cleanQuestTitle(q.title));
}

// Où emmener l'élève quand la quête n'est pas encore faite. Sans ça, la carte
// dit quoi faire sans dire où : « Certifier une compétence » demandait de
// deviner qu'il fallait passer par le parcours.
const QUEST_ROUTE = {
  quest_validate_1: "#/parcours",
  quest_quiz_1: "#/reviser",
  quest_quiz_3: "#/reviser",
  quest_quiz_perfect: "#/reviser",
  quest_streak_keep: "#/reviser",
};

// img/mask = illustration PNG (éclair/badge/cahier) ; ico = icône SVG classique
const CAT_CFG = {
  quiz: { mask: "cahier", color: "var(--a)" },
  streak: { ico: "flame", color: "var(--or)" },
  competence: { img: "badge", color: "var(--gr2)" },
  session: { ico: "map-pin", color: "var(--blk)" },
  default: { img: "eclair", color: "var(--a)" },
};

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .dq-section { margin: 0 0 14px; }
  .dq-hd {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px; padding: 0 4px;
  }
  .dq-title {
    font: 800 15px/1 'Archivo', sans-serif;
    color: var(--ink); letter-spacing: -.01em;
    display: flex; align-items: center; gap: 7px;
  }
  .dq-count {
    font: 800 11px/1 'Archivo', sans-serif;
    color: var(--a-txt); background: color-mix(in srgb, var(--a) 12%, transparent);
    border-radius: 99px; padding: 4px 9px;
  }

  /* ── Rangées pleine largeur (fini le carrousel horizontal serré) ── */
  .dq-list { display: flex; flex-direction: column; gap: 8px; }

  .dq-card {
    display: flex; align-items: center; gap: 13px; width: 100%;
    background: var(--su); border: 1.5px solid var(--bo);
    border-radius: 16px; padding: 11px 13px;
    position: relative; overflow: hidden; text-align: left;
    transition: transform .15s cubic-bezier(.23,1,.32,1), border-color .15s, background .2s;
    animation: dqCardIn .34s cubic-bezier(.34,1.56,.64,1) both;
    -webkit-tap-highlight-color: transparent;
  }
  .dq-card:nth-child(2) { animation-delay: .05s; }
  .dq-card:nth-child(3) { animation-delay: .10s; }
  .dq-card:nth-child(4) { animation-delay: .15s; }
  .dq-card:nth-child(5) { animation-delay: .20s; }
  @keyframes dqCardIn {
    from { opacity:0; transform:translateY(9px) scale(.98); }
    to   { opacity:1; transform:translateY(0)   scale(1); }
  }
  @media (hover:hover) and (pointer:fine) {
    .dq-card--ready:hover { border-color: color-mix(in srgb, var(--a) 55%, transparent); }
  }
  .dq-card--ready {
    cursor: pointer;
    border-color: color-mix(in srgb, var(--a) 36%, transparent);
    background: linear-gradient(135deg, color-mix(in srgb, var(--a) 9%, var(--su)), var(--su) 60%);
    box-shadow: 0 6px 18px -12px color-mix(in srgb, var(--a) 50%, transparent);
  }
  .dq-card--ready:active { transform: scale(.985); }
  .dq-card--claimed {
    border-color: rgba(16,185,129,.24);
    background: linear-gradient(135deg, rgba(16,185,129,.07), var(--su) 60%);
    pointer-events: none; cursor: default;
  }
  .dq-card--pending { cursor: default; }

  .dq-ico {
    width: 42px; height: 42px; border-radius: 13px; flex: none;
    display: flex; align-items: center; justify-content: center;
  }
  .dq-body { flex: 1; min-width: 0; }
  .dq-name {
    font: 700 13.5px/1.2 'Archivo', sans-serif;
    color: var(--ink); margin-bottom: 7px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .dq-track {
    height: 6px; background: var(--bo);
    border-radius: 99px; overflow: hidden;
  }
  .dq-fill { height: 100%; border-radius: 99px; transition: width .55s cubic-bezier(.23,1,.32,1); }
  .dq-prog { font: 700 10.5px/1 'IBM Plex Mono', monospace; color: var(--mu2); margin-top: 5px; display: inline-block; }

  /* ── Rail droit : bouton Réclamer / récompense / fait ── */
  .dq-right { flex: none; display: flex; align-items: center; }
  .dq-claim {
    display: inline-flex; align-items: center; gap: 5px;
    /* --adk (violet profond) et non --a : blanc sur --a (#6c63ff) à 12.5px
       = 4.31:1 (échec AA) ; --adk (#4a3fc9) = ~8:1. */
    background: var(--adk); color: #fff;
    font: 800 12.5px/1 'Archivo', sans-serif;
    padding: 10px 14px; border-radius: 12px;
    box-shadow: 0 5px 0 color-mix(in srgb, var(--adk) 55%, #000); white-space: nowrap;
  }
  .dq-card--ready:active .dq-claim { transform: translateY(2px); box-shadow: 0 3px 0 color-mix(in srgb, var(--adk) 55%, #000); }
  /* Bouton « Y aller » : quête pas encore faite → on emmène l'élève à
     l'endroit où la faire. Contour et non plein, pour que « Réclamer »
     (récompense à prendre) reste le bouton le plus fort de la liste. */
  .dq-go {
    display: inline-flex; align-items: center; gap: 5px;
    background: color-mix(in srgb, var(--a) 12%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--a) 34%, transparent);
    color: var(--a-txt);
    font: 800 12.5px/1 'Archivo', sans-serif;
    padding: 9px 14px; border-radius: 12px; white-space: nowrap;
  }
  .dq-card--go { cursor: pointer; }
  .dq-card--go:active { transform: scale(.985); }
  @media (hover:hover) and (pointer:fine) {
    .dq-card--go:hover { border-color: color-mix(in srgb, var(--a) 40%, transparent); }
    .dq-card--go:hover .dq-go { background: color-mix(in srgb, var(--a) 18%, transparent); }
  }
  .dq-reward {
    display: inline-flex; align-items: center; gap: 4px;
    font: 800 12px/1 'Archivo', sans-serif; color: var(--a-txt); white-space: nowrap;
  }
  .dq-reward img { width: 17px; height: 17px; }
  /* Récompense repliée sous la barre quand le rail droit porte « Y aller » */
  .dq-meta { display: inline-flex; align-items: center; gap: 6px; margin-top: 5px; }
  .dq-meta .dq-prog { margin-top: 0; }
  .dq-meta .dq-reward { font-size: 11px; }
  .dq-meta .dq-reward img { width: 14px; height: 14px; }
  .dq-done {
    display: inline-flex; align-items: center; gap: 4px;
    font: 800 12px/1 'Archivo', sans-serif; color: #15803d; white-space: nowrap;
  }

  /* XP popup */
  .dq-xp-pop {
    position: fixed; pointer-events: none; z-index: 9999;
    font: 800 15px/1 'Archivo', sans-serif;
    color: var(--a-txt); text-shadow: 0 1px 8px color-mix(in srgb, var(--a) 35%, transparent);
    animation: dqXpPop .75s cubic-bezier(.23,1,.32,1) forwards;
    white-space: nowrap; transform: translateX(-50%);
  }
  @keyframes dqXpPop {
    0%   { opacity:0; transform:translateX(-50%) translateY(0)   scale(.85); }
    25%  { opacity:1; transform:translateX(-50%) translateY(-16px) scale(1); }
    80%  { opacity:1; transform:translateX(-50%) translateY(-28px) scale(1); }
    100% { opacity:0; transform:translateX(-50%) translateY(-38px) scale(.9); }
  }
  @media (prefers-reduced-motion: reduce) {
    .dq-card { animation: none; }
    .dq-xp-pop { animation: none; opacity: 0; }
  }
  `;
  document.head.appendChild(s);
}

export async function mountDailyQuests(root, { prefetchedQuests } = {}) {
  let quests = prefetchedQuests ?? null;
  if (quests === null) {
    try {
      const { data, error } = await sb.rpc("get_today_quests");
      if (error || data?.error) {
        console.error("[daily-quests] get_today_quests error:", error);
        return;
      }
      quests = Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn("[daily-quests] fetch error", e);
      return;
    }
  }

  // Hide section if every quest is already claimed (réclamée, pas juste complétée)
  if (quests.length === 0 || quests.every((q) => q.claimed)) return;

  ensureStyle();
  track("daily_quests.shown", { count: quests.length });

  const section = document.createElement("div");
  section.className = "dq-section";
  section.innerHTML = renderSection(quests);

  // Inject avant .streak-pro
  const streakEl =
    root.querySelector(".streak-pro") || root.querySelector("#streak-card");
  if (streakEl) streakEl.parentNode.insertBefore(section, streakEl);
  else root.appendChild(section);

  // Wire "ready" cards only
  section.querySelectorAll(".dq-card--ready").forEach((card) => {
    const questId = card.dataset.questId;
    const quest = quests.find((q) => q.quest_id === questId);
    if (!quest) return;

    const handler = async () => {
      if (card.dataset.claiming) return;
      card.dataset.claiming = "1";

      try {
        const { data, error } = await sb.rpc("claim_quest", {
          p_quest_id: questId,
        });
        if (error || data?.error) {
          toast(dqt("missing", "Quête introuvable."), "error");
          delete card.dataset.claiming;
          return;
        }

        const xpGained = data?.xp_gained ?? quest.reward_xp ?? 0;
        const gemGained = data?.gemmes_gained ?? quest.reward_gemmes ?? 0;
        playStar();
        track("daily_quests.claimed", {
          quest_id: questId,
          xp: xpGained,
          gems: gemGained,
        });

        // Jetons dorés vers le HUD si des volants ont été crédités
        if (gemGained > 0) {
          flyVolants(gemGained, { from: card });
        }

        // Popup XP
        const rect = card.getBoundingClientRect();
        const pop = document.createElement("div");
        pop.className = "dq-xp-pop";
        pop.textContent =
          gemGained > 0
            ? dqt("pop_volants", "+{n} volants").replace("{n}", gemGained)
            : dqt("pop_ok", "Quête validée ✓");
        pop.style.cssText = `left:${rect.left + rect.width / 2}px;top:${rect.top}px`;
        document.body.appendChild(pop);
        setTimeout(() => pop.remove(), 800);

        // Le serveur vient de créditer les volants : on resynchronise le
        // solde canonique (header + cache) — sinon la pastille reste figée
        // sur l'ancien montant jusqu'au prochain boot.
        refreshGemmes().catch(() => {});

        // Badge « N à réclamer » de l'entête : recalculé, sinon il ment
        // (il restait à sa valeur de rendu même après réclamation).
        const countEl = section.querySelector(".dq-count");
        if (countEl) {
          const left = [...section.querySelectorAll(".dq-card--ready")].filter(
            (c) => c !== card,
          ).length;
          if (left > 0)
            countEl.textContent = dqt("count", "{n} à réclamer").replace(
              "{n}",
              left,
            );
          else countEl.remove();
        }

        // Fade out card
        card.style.transition = "opacity .28s ease, transform .28s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(.92)";
        setTimeout(() => {
          card.remove();
          // Remove section when no more visible cards
          if (!section.querySelector(".dq-card")) section.remove();
        }, 300);
      } catch (e) {
        console.warn("[daily-quests] claim error", e);
        delete card.dataset.claiming;
      }
    };

    card.addEventListener("click", handler);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    });
  });

  // Cartes « à faire » : la carte entière emmène à l'écran où la faire.
  section.querySelectorAll(".dq-card--go").forEach((card) => {
    const go = () => {
      const route = card.dataset.route;
      if (!route) return;
      haptic("tap");
      track("daily_quests.go", { quest_id: card.dataset.questId, route });
      navigate(route);
    };
    card.addEventListener("click", go);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  });
}

function renderSection(quests) {
  const readyCount = quests.filter((q) => q.completed && !q.claimed).length;
  return `
    <div class="dq-hd">
      <div class="dq-title">
        ${ill("eclair", { size: 18 })}
        ${dqRtl(esc(dqt("title", "Quêtes du jour")))}
      </div>
      ${readyCount > 0 ? `<span class="dq-count">${dqRtl(esc(dqt("count", "{n} à réclamer").replace("{n}", readyCount)))}</span>` : ""}
    </div>
    <div class="dq-list">
      ${quests.map(renderCard).join("")}
    </div>
  `;
}

function renderCard(q) {
  const pct =
    q.target > 0 ? Math.min(100, Math.round((q.progress / q.target) * 100)) : 0;
  const ready = q.completed && !q.claimed; // objectif atteint → récompense à réclamer
  const done = q.claimed; // récompense déjà réclamée

  const _catKey = q.quest_id?.startsWith("quest_quiz")
    ? "quiz"
    : q.quest_id?.startsWith("quest_streak")
      ? "streak"
      : q.quest_id?.startsWith("quest_validate")
        ? "competence"
        : "default";
  const cat = CAT_CFG[_catKey];
  // Barre : violet (le vert « fait » jurait avec la DA violette ; le « fait »
  // est déjà signalé par le libellé ✓). Fait = violet profond.
  const fillClr = done ? "var(--adk)" : "var(--a)";
  // Quête en cours qui a une destination connue → la carte devient un chemin
  // vers l'action, pas seulement un compteur.
  const route = !ready && !done ? QUEST_ROUTE[q.quest_id] : null;
  const stCls = done
    ? "dq-card--claimed"
    : ready
      ? "dq-card--ready"
      : route
        ? "dq-card--go"
        : "dq-card--pending";
  const actionable = ready || !!route;

  const rewardChip =
    q.reward_gemmes > 0
      ? `<span class="dq-reward"><img src="/skins/volant-coin.webp" alt="" aria-hidden="true">+${q.reward_gemmes}</span>`
      : "";

  // Rail droit : réclamer (état prêt) · y aller (en cours) · récompense · fait
  const right = done
    ? `<span class="dq-done">${ill("coche", { size: 14 })} ${dqRtl(esc(dqt("done", "Fait")))}</span>`
    : ready
      ? `<span class="dq-claim">${dqRtl(esc(dqt("claim", "Réclamer")))}</span>`
      : route
        ? `<span class="dq-go">${dqRtl(esc(dqt("go", "Y aller")))} <span aria-hidden="true">→</span></span>`
        : rewardChip;

  // Barre de progression : sous elle, l'avancement et (si le rail droit porte
  // le bouton) la récompense, qui n'a plus sa place à droite.
  const meta =
    !ready && !done
      ? `<span class="dq-meta"><span class="dq-prog">${q.progress}/${q.target}</span>${route ? rewardChip : ""}</span>`
      : "";

  return `
    <div class="dq-card ${stCls}" data-quest-id="${escAttr(String(q.quest_id))}"
         ${route ? `data-route="${escAttr(route)}"` : ""}
         role="${actionable ? "button" : "article"}" tabindex="${actionable ? "0" : "-1"}"
         aria-label="${escAttr(questTitle(q))}${ready ? escAttr(dqt("claim_aria", " — réclamer la récompense")) : route ? escAttr(dqt("go_aria", " — y aller")) : ""}">
      <div class="dq-ico" style="background:${cat.color}18">
        ${
          cat.img
            ? ill(cat.img, { size: 24 })
            : cat.mask
              ? illMask(cat.mask, { size: 22, color: cat.color })
              : icon(cat.ico, { size: 18, strokeWidth: 2.2, color: cat.color })
        }
      </div>
      <div class="dq-body">
        <div class="dq-name">${dqRtl(esc(questTitle(q)))}</div>
        <div class="dq-track">
          <div class="dq-fill" style="width:${pct}%;background:${fillClr}"></div>
        </div>
        ${meta}
      </div>
      <div class="dq-right">${right}</div>
    </div>
  `;
}
