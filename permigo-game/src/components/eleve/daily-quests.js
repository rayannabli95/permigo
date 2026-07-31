// ═══════════════════════════════════════════════════════════════
// Quête du jour — élève
// RPC : get_today_quests() → [{ quest_id, title, progress, target, completed, claimed, reward_xp, reward_gemmes }]
// RPC : claim_quest({ p_quest_id }) → { xp_gained, gemmes_gained }
// Usage : mountDailyQuests(slot) — une ligne posée DANS la carte du permis
// virtuel de l'accueil (décision Rayan 31/07). L'ancien affichage en cartes
// empilées, avec titre de section et barres de progression, a été retiré :
// une seule quête par jour, qu'on fait ou qu'on ne fait pas.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
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
    claim: "Claim",
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
    inline_k: "Your quest today",
  },
  ar: {
    claim: "استلام",
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
    inline_k: "مهمتك اليوم",
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

// Libellés FR portés par l'app plutôt que par la base : depuis le pivot, le
// mot juste est « certifier » (c'est l'élève qui certifie, le moniteur ne
// valide plus rien) — et l'écran n'a pas à attendre une migration pour le dire.
const QUEST_FR = { quest_validate_1: "Certifier une compétence" };

// Titre affiché : traduction par quest_id (enum fermé), repli libellé FR de
// l'app, puis titre DB nettoyé si l'id est inconnu.
function questTitle(q) {
  return dqt(q.quest_id, QUEST_FR[q.quest_id] || cleanQuestTitle(q.title));
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

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  /* ── Mode « intégré » : la quête vit DANS la carte du permis virtuel ──
     Une seule quête par jour, posée sous le compteur qu'elle fait avancer :
     pas de titre de section, pas de barre (un objectif qu'on fait une fois
     n'a rien à raconter entre 0 et 1), pas de carte en plus sur l'accueil. */
  .dq-in {
    margin-top: 12px; padding-top: 12px;
    border-top: 1.5px dashed var(--bo);
    display: flex; align-items: center; gap: 10px;
    -webkit-tap-highlight-color: transparent;
  }
  .dq-in--go { cursor: pointer; }
  .dq-in--go:active { transform: scale(.99); }
  .dq-in-t { flex: 1; min-width: 0; display: block; }
  .dq-in-k {
    display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
    font: 800 10.5px/1 'Archivo', sans-serif; letter-spacing: .09em;
    text-transform: uppercase; color: var(--a-txt);
  }
  .dq-in-n { display: block; font: 700 13.5px/1.25 'Archivo', sans-serif; color: var(--ink); }
  /* Récompense sur la ligne du surtitre, jamais au milieu de la phrase */
  .dq-in-r {
    display: inline-flex; align-items: center; gap: 3px; flex: none;
    font: 800 10.5px/1 'Archivo', sans-serif; letter-spacing: 0; color: var(--mu2);
  }
  .dq-in-r img { width: 13px; height: 13px; }
  .dq-in-b {
    flex: none; font: 800 12.5px/1 'Archivo', sans-serif;
    padding: 11px 15px; border-radius: 12px; white-space: nowrap;
  }
  .dq-in-b.pri {
    background: var(--adk); color: #fff;
    box-shadow: 0 4px 0 color-mix(in srgb, var(--adk) 55%, #000);
  }
  .dq-in--go:active .dq-in-b.pri { transform: translateY(2px); box-shadow: 0 2px 0 color-mix(in srgb, var(--adk) 55%, #000); }
  .dq-in-b.sec {
    background: color-mix(in srgb, var(--a) 12%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--a) 34%, transparent);
    color: var(--a-txt);
  }
  /* Arabe : la ligne se lit de droite à gauche (l'app reste LTR — lang.js) */
  .dq-in--rtl { flex-direction: row-reverse; }
  .dq-in--rtl .dq-in-t { text-align: right; }
  .dq-in--rtl .dq-in-k { flex-direction: row-reverse; }

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

  // « Se connecter aujourd'hui » ne s'affiche plus : elle se réclamait pour
  // être simplement là (décision Rayan 31/07). Le serveur ne la crée plus,
  // mais on la filtre AUSSI ici — sinon, entre le déploiement de cet écran et
  // celui de la base, c'est elle qui occuperait la carte du permis.
  // Récompense déjà prise (ou rien à faire) → rien à montrer, et la carte se
  // referme sans trait pointillé qui pende.
  const quest = quests.find((q) => !q.claimed && q.quest_id !== "quest_login");
  if (!quest) return;

  ensureStyle();
  track("daily_quests.shown", { quest_id: quest.quest_id });

  const section = document.createElement("div");
  section.innerHTML = renderInline(quest);
  root.appendChild(section);

  // Réclamation : le crochet est un attribut (data-dq-claim) et non une classe
  // de style — l'apparence peut changer sans casser le câblage.
  section.querySelectorAll("[data-dq-claim]").forEach((card) => {
    const questId = card.dataset.questId;

    const handler = async (e) => {
      // La quête est posée DANS la carte du permis, qui est elle-même
      // cliquable : sans ça, réclamer sa récompense t'envoyait au parcours
      // dans la foulée.
      e?.stopPropagation?.();
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

        // Fade out card
        card.style.transition = "opacity .28s ease, transform .28s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(.92)";
        setTimeout(() => {
          card.remove();
          // Plus rien à montrer → le bloc disparaît, et le trait pointillé qui
          // le séparait du permis avec lui.
          if (!section.querySelector(".dq-in")) section.remove();
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
        handler(e);
      }
    });
  });

  // « À faire » : le bloc entier emmène à l'écran où la faire.
  section.querySelectorAll("[data-route]").forEach((card) => {
    const go = (e) => {
      e?.stopPropagation?.();
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
        go(e);
      }
    });
  });
}

// Ligne intégrée à la carte du permis virtuel : une seule quête, le strict
// nécessaire — ce qu'il y a à faire, ce que ça rapporte, et où aller le faire.
function renderInline(q) {
  if (!q) return "";
  const ready = q.completed && !q.claimed;
  const route = ready ? null : QUEST_ROUTE[q.quest_id];
  const rtl = getLang() === "ar";
  const label = ready
    ? dqt("claim", "Réclamer")
    : `${dqt("go", "Y aller")} ${rtl ? "←" : "→"}`;

  return `
    <div class="dq-in${route ? " dq-in--go" : ""}${rtl ? " dq-in--rtl" : ""}"
         data-quest-id="${escAttr(String(q.quest_id))}"
         ${ready ? 'data-dq-claim="1"' : ""}
         ${route ? `data-route="${escAttr(route)}"` : ""}
         role="${ready || route ? "button" : "group"}"
         tabindex="${ready || route ? "0" : "-1"}"
         aria-label="${escAttr(questTitle(q))}${ready ? escAttr(dqt("claim_aria", " — réclamer la récompense")) : route ? escAttr(dqt("go_aria", " — y aller")) : ""}">
      <span class="dq-in-t">
        <span class="dq-in-k">
          ${dqRtl(esc(dqt("inline_k", "Ta quête du jour")))}
          ${
            q.reward_gemmes > 0
              ? `<span class="dq-in-r"><img src="/skins/volant-coin.webp" alt="" aria-hidden="true">+${q.reward_gemmes}</span>`
              : ""
          }
        </span>
        <span class="dq-in-n">${dqRtl(esc(questTitle(q)))}</span>
      </span>
      <span class="dq-in-b ${ready ? "pri" : "sec"}">${dqRtl(esc(label))}</span>
    </div>`;
}
