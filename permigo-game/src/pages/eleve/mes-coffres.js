// ═══════════════════════════════════════════════════════════════
// Élève — Mes Coffres
// Route : #/mes-coffres
// Liste tous les coffres DB (get_my_chests) :
//   - À ouvrir (unlocked, opened_at IS NULL)
//   - Déjà ouverts
//   - Prochains jalons (série / mondes)
// ═══════════════════════════════════════════════════════════════
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { volantImg } from "@/utils/volant.js";
import { flyVolants } from "@/components/eleve/volant-reward.js";
import { toast } from "@/components/common/toast.js";
import { getMyChests, openChest } from "@/utils/game-state.js";
import { playCoin } from "@/utils/sound.js";
import { openChestModal, ensureChestStyles } from "@/components/eleve/chest.js";
import { getLang } from "@/utils/lang.js";
import { volantWord, dateLocale } from "@/data/rewards-i18n.js";

// ── i18n de la COQUE (EN/AR) — dict local (convention coque, cf. profil #555).
// ct(key, fr) = traduit-ou-français esc() intégré ; ctR = brut (toasts,
// textContent). Les libellés de coffres (CHEST_META, données locales) sont
// traduits AU RENDU via `chest` ci-dessous — la DB (rewards jsonb serveur)
// n'est jamais touchée. En 'fr' ou clé absente → FR inchangé.
const MC_I18N = {
  en: {
    title: "My chests",
    back: "Back",
    to_open: "To open",
    opened_hd: "Already opened",
    today: "today",
    yesterday: "yesterday",
    won: "Won",
    opened: "Opened",
    opened_today: "Opened today",
    open_btn: "Open",
    open_chest_aria: "Open the chest",
    open_aria: "Open",
    already_aria: "Already opened:",
    unavailable: "“Chests” unavailable.",
    check_conn: "Check your connection, then try again.",
    retry: "Try again",
    none: "No chest yet.",
    none_sub: "Finish a world or keep your streak going.",
    open_fail: "The chest couldn’t open. Try again.",
    toast_open_mid: "opened!",
    world_n: "World",
    chest_world_1: "World 1 — Safety",
    chest_world_2: "World 2 — Manoeuvres",
    chest_world_3: "World 3 — Driving",
    chest_world_4: "World 4 — Mastery",
    chest_streak_7: "7-day streak",
    chest_streak_14: "14-day streak",
    chest_streak_30: "30-day streak",
    chest_perfect_quiz: "Perfect quiz",
    chest_welcome: "Welcome chest",
    wname_1: "Safety",
    wname_2: "Manoeuvres",
    wname_3: "Driving",
    wname_4: "Mastery",
  },
  ar: {
    title: "صناديقي",
    back: "رجوع",
    to_open: "للفتح",
    opened_hd: "فُتحت سابقًا",
    today: "اليوم",
    yesterday: "أمس",
    won: "رُبح",
    opened: "فُتح",
    opened_today: "فُتح اليوم",
    open_btn: "افتح",
    open_chest_aria: "افتح الصندوق",
    open_aria: "افتح",
    already_aria: "فُتح سابقًا:",
    unavailable: "«الصناديق» غير متاحة.",
    check_conn: "تحقّق من اتصالك ثم أعد المحاولة.",
    retry: "أعد المحاولة",
    none: "لا صناديق حاليًا.",
    none_sub: "أنهِ عالمًا أو حافظ على سلسلتك.",
    open_fail: "تعذّر فتح الصندوق. أعد المحاولة.",
    toast_open_mid: "فُتح!",
    world_n: "العالم",
    chest_world_1: "العالم 1 — السلامة",
    chest_world_2: "العالم 2 — المناورات",
    chest_world_3: "العالم 3 — القيادة",
    chest_world_4: "العالم 4 — الإتقان",
    chest_streak_7: "سلسلة 7 أيام",
    chest_streak_14: "سلسلة 14 يومًا",
    chest_streak_30: "سلسلة 30 يومًا",
    chest_perfect_quiz: "اختبار كامل العلامة",
    chest_welcome: "صندوق الترحيب",
    wname_1: "السلامة",
    wname_2: "المناورات",
    wname_3: "القيادة",
    wname_4: "الإتقان",
  },
};
function ctR(key, fr) {
  const l = getLang();
  return (l !== "fr" && MC_I18N[l]?.[key]) || fr;
}
function ct(key, fr) {
  return esc(ctR(key, fr));
}
// Libellé traduit d'un coffre (fallback = label FR de CHEST_META).
function chestLabel(chestType, frLabel) {
  return ctR(`chest_${chestType}`, frLabel);
}
// Texte traduit posé en HTML : span RTL en arabe (ponctuation au bon endroit).
function crtl(html) {
  return getLang() === "ar" ? `<span dir="rtl">${html}</span>` : html;
}

// ─── Metadata par type de coffre ─────────────────────────────────
const CHEST_META = {
  world_1: {
    label: "Monde 1 — Sécurité",
    image: "/skins/chests/chest_world_1.png",
    ico: "shield",
    tier: "bronze",
    xp: 200,
    gemmes: 50,
  },
  world_2: {
    label: "Monde 2 — Manœuvres",
    image: "/skins/chests/chest_world_2.png",
    ico: "settings",
    tier: "argent",
    xp: 400,
    gemmes: 100,
  },
  world_3: {
    label: "Monde 3 — Conduite",
    image: "/skins/chests/chest_world_3.png",
    ico: "car",
    tier: "or",
    xp: 700,
    gemmes: 175,
  },
  world_4: {
    label: "Monde 4 — Maîtrise",
    image: "/skins/chests/chest_world_4.png",
    ico: "trophy",
    tier: "legendaire",
    xp: 1200,
    gemmes: 300,
  },
  streak_7: {
    label: "Série 7 jours",
    image: "/skins/chests/chest_streak_7.png",
    ico: "flame",
    tier: "argent",
    xp: 150,
    gemmes: 30,
  },
  streak_14: {
    label: "Série 14 jours",
    image: "/skins/chests/chest_streak_14.png",
    ico: "zap",
    tier: "or",
    xp: 350,
    gemmes: 80,
  },
  streak_30: {
    label: "Série 30 jours",
    image: "/skins/chests/chest_streak_30.png",
    ico: "crown",
    tier: "legendaire",
    xp: 800,
    gemmes: 200,
  },
  perfect_quiz: {
    label: "Quiz parfait",
    image: "/skins/chests/chest_perfect_quiz.png",
    emoji: "✨",
    tier: "or",
    xp: 100,
    gemmes: 25,
  },
  welcome: {
    label: "Coffre de bienvenue",
    image: "/skins/chests/chest_welcome.png",
    ico: "gift",
    tier: "bronze",
    xp: 50,
    gemmes: 25,
  },
};

const TIER_GRADIENT = {
  bronze: "linear-gradient(135deg,var(--amk),#7c2d12)",
  argent: "linear-gradient(135deg,var(--mu2),var(--mu4))",
  or: "linear-gradient(135deg,#facc15,#a16207)",
  legendaire: "linear-gradient(135deg,var(--pul),#581c87)",
};

// Médaillon 3D de secours par type de coffre (affiché si le PNG du coffre
// ne charge pas). Glyphe = thème du coffre ; rampe = rareté (tier).
const CHEST_MED_GLYPH = {
  world_1: "bouclier",
  world_2: "reglages",
  world_3: "voiture",
  world_4: "trophee",
  streak_7: "flamme",
  streak_14: "eclair",
  streak_30: "couronne",
  perfect_quiz: "etoile",
  welcome: "cadeau",
};
const TIER_RAMP = {
  bronze: "bronze",
  argent: "argent",
  or: "gold",
  legendaire: "violet",
};
function _chestMed(chestType, tier, size = 48) {
  const glyph = CHEST_MED_GLYPH[chestType] || "coffre";
  const ramp = TIER_RAMP[tier] || "bronze";
  return medallion(glyph, ramp, { size });
}

const STYLE = `<style>
.mc-page {
  max-width: 480px; margin: 0 auto;
  padding: 20px 16px 110px;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', sans-serif;
}
.mc-hd {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 24px;
}
.mc-back::before { content: ''; position: absolute; inset: -4px; }
.mc-back {
  position: relative;
  width: 36px; height: 36px; border-radius: 50%;
  border: 1.5px solid var(--bo);
  background: var(--su);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink);
  font-size: 18px; line-height: 1;
  transition: transform .12s;
  flex-shrink: 0;
}
.mc-back:active { transform: scale(.93); }
.mc-h1 {
  font: 700 22px/1.15 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); letter-spacing: -.02em; margin: 0; flex: 1;
}

/* ── Section headers ── */
.mc-section {
  font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--mu2);
  letter-spacing: .08em;
  text-transform: uppercase;
  margin: 24px 0 12px;
}
.mc-section:first-of-type { margin-top: 0; }

/* ── Chest card ── */
.mc-list { display: flex; flex-direction: column; gap: 10px; }
.mc-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  padding: 16px;
  display: flex; align-items: center; gap: 14px;
  transition: border-color .14s, transform .14s;
  cursor: default;
  animation: mcCardIn .35s cubic-bezier(.34,1.56,.64,1) both;
}
.mc-card:nth-child(n+5) { animation: none; }
@keyframes mcCardIn {
  from { opacity:0; transform:translateY(10px) scale(.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.mc-card.mc-can-open {
  cursor: pointer;
  border-color: transparent;
  background: var(--su);
  box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--a) 30%, transparent),
              0 8px 24px -8px color-mix(in srgb, var(--a) 20%, transparent);
}
@media (hover:hover) and (pointer:fine) {
  .mc-card.mc-can-open:hover {
    border-color: transparent;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--a) 55%, transparent),
                0 12px 32px -8px color-mix(in srgb, var(--a) 30%, transparent);
    transform: translateY(-2px);
  }
}
.mc-card.mc-can-open:active { transform: scale(.98); }
/* coffre ouvert = « consommé » : on garde l'effet fané sur le visuel
   (désaturation + vignette estompée) MAIS le texte reste à pleine opacité,
   sinon le label/sous-titre tombait sous 4.5:1 (a11y). */
.mc-card.mc-opened { filter: saturate(.5); cursor: default; }
.mc-card.mc-opened .mc-thumb { opacity: .5; }
.mc-card.mc-opened .mc-label { color: var(--mu); }
.mc-card.mc-opened .mc-sub { color: var(--mu2); }
/* Rareté lisible même une fois ouvert — le légendaire domine la liste */
.mc-card.mc-opened[data-tier="argent"] { border-color: color-mix(in srgb, var(--mu2) 40%, var(--bo)); }
.mc-card.mc-opened[data-tier="or"] { border-color: color-mix(in srgb, #facc15 55%, var(--bo)); }
.mc-card.mc-opened[data-tier="legendaire"] {
  border-color: color-mix(in srgb, var(--pul) 60%, var(--bo));
  background: linear-gradient(135deg, color-mix(in srgb, var(--pul) 8%, var(--su)) 0%, var(--su) 70%);
  filter: saturate(.85);
}
.mc-card.mc-opened[data-tier="legendaire"] .mc-thumb { opacity: .75; }

.mc-thumb {
  width: 72px; height: 72px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  position: relative;
  overflow: visible;
}
.mc-icon-glow {
  position: absolute; inset: -4px;
  border-radius: 20px;
  opacity: .35; filter: blur(10px);
  z-index: -1;
}

/* ── Légendaire pulse ── */
.mc-card[data-tier="legendaire"]:not(.mc-opened) {
  animation: mcCardIn .35s cubic-bezier(.34,1.56,.64,1) both,
             legendaryPulse 2.4s 0.4s ease-in-out infinite;
}
.mc-card[data-tier="legendaire"]:not(.mc-opened):nth-child(n+5) {
  animation: legendaryPulse 2.4s ease-in-out infinite;
}
@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,.4); }
  50%       { box-shadow: 0 0 24px 6px rgba(168,85,247,.55); }
}

.mc-info { flex: 1; min-width: 0; }
.mc-label {
  font: 600 14px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mc-sub {
  font: 500 12px/1.4 'Inter', sans-serif;
  color: var(--mu);
  margin-top: 3px;
}
.mc-rewards {
  display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;
}
.mc-rew-chip {
  font: 700 11px/1 'Inter', sans-serif;
  padding: 3px 8px; border-radius: 99px;
  background: color-mix(in srgb, var(--a) 8%, transparent);
  color: var(--a-txt);
}

/* ── CTA open button on card ── */
.mc-open-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 10px;
  border: 0;
  font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
  background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
  box-shadow: 0 2px 8px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 6px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
  color: var(--a-ink);
  cursor: pointer;
  transition: transform .12s, opacity .12s;
  min-height: 44px;
  white-space: nowrap;
}
.mc-open-btn:active { transform: scale(.96); opacity: .88; }

/* ── Empty ── */
.mc-empty {
  text-align: center; padding: 40px 0;
  font: 500 14px/1.6 'Inter', sans-serif;
  color: var(--mu2);
}
.mc-empty-ico { font-size: 36px; margin-bottom: 12px; }

/* ── Skeleton ── */
.mc-skel {
  height: 76px; background: var(--su);
  border: 1.5px solid var(--bo); border-radius: 20px;
  animation: mcPulse 1.4s ease-in-out infinite;
}
.mc-skel:nth-child(2) { animation-delay: .1s; }
.mc-skel:nth-child(3) { animation-delay: .2s; }
@keyframes mcPulse { 0%,100%{opacity:1} 50%{opacity:.5} }

@media (prefers-reduced-motion:reduce) {
  .mc-card { animation: none; }
  .mc-skel { animation: none; }
}
</style>`;

function relTime(ts) {
  if (!ts) return "";
  const l = getLang();
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return ctR("today", "aujourd’hui");
  if (d === 1) return ctR("yesterday", "hier");
  if (d < 7)
    return l === "en"
      ? `${d} d ago`
      : l === "ar"
        ? `قبل ${d} أيام`
        : `il y a ${d} j`;
  return new Date(ts).toLocaleDateString(dateLocale(l), {
    day: "numeric",
    month: "short",
  });
}

function renderCard(chest) {
  const meta = CHEST_META[chest.chest_type] || {
    label: chest.chest_type,
    ico: "inbox",
    tier: "bronze",
    xp: 0,
    gemmes: 0,
  };
  const grad = TIER_GRADIENT[meta.tier] || TIER_GRADIENT.bronze;
  const canOpen = !chest.opened_at;
  const rew = chest.rewards || {};
  const xp = rew.xp || meta.xp;
  const gemmes = rew.gemmes || meta.gemmes;
  const label = chestLabel(chest.chest_type, meta.label);

  return `
  <div class="mc-card${canOpen ? " mc-can-open" : " mc-opened"}"
       data-chest-type="${escAttr(chest.chest_type)}"
       data-chest-id="${escAttr(chest.id)}"
       data-tier="${escAttr(meta.tier)}"
       role="${canOpen ? "button" : "article"}"
       tabindex="${canOpen ? "0" : "-1"}"
       aria-label="${canOpen ? `${ct("open_aria", "Ouvrir")} ${esc(label)}` : `${ct("already_aria", "Déjà ouvert :")} ${esc(label)}`}">
    <div class="mc-thumb" style="background:${grad}">
      <img src="${meta.image}" alt="${escAttr(label)}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
           style="width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,.35))">
      <span style="display:none" aria-hidden="true">${_chestMed(chest.chest_type, meta.tier, 56)}</span>
      <div class="mc-icon-glow" style="background:${grad}"></div>
    </div>
    <div class="mc-info">
      <div class="mc-label">${crtl(esc(label))}</div>
      <div class="mc-sub">${crtl(canOpen ? `${ct("won", "Gagné")} ${esc(relTime(chest.unlocked_at))}` : `${ct("opened", "Ouvert")} ${esc(relTime(chest.opened_at))}`)}</div>
      ${
        canOpen
          ? `<div class="mc-rewards">
        <span class="mc-rew-chip">${volantImg(13)} +${gemmes} ${esc(volantWord(gemmes, getLang()))}</span>
      </div>`
          : ""
      }
    </div>
    ${
      canOpen
        ? `<button class="mc-open-btn" aria-label="${ct("open_chest_aria", "Ouvrir le coffre")}">${ct("open_btn", "Ouvrir")}</button>`
        : ""
    }
  </div>`;
}

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page.view", { page: "mes_coffres", role: me.role });

  root.innerHTML = `
    ${STYLE}
    <div class="mc-page anim-slide-up">
      <div class="mc-hd">
        <button class="mc-back" aria-label="${ct("back", "Retour")}" id="mc-back">${icon("arrow-left", { size: 18 })}</button>
        <h1 class="mc-h1">${ct("title", "Mes coffres")}</h1>
      </div>
      <div class="mc-list">
        <div class="mc-skel"></div>
        <div class="mc-skel"></div>
        <div class="mc-skel"></div>
      </div>
    </div>
  `;

  root
    .querySelector("#mc-back")
    ?.addEventListener("click", () => navigate("#/"));

  ensureChestStyles();

  let chests = [];
  let loadFailed = false;
  try {
    chests = await getMyChests({ throwOnError: true });
  } catch (e) {
    console.error("[mes-coffres] load failed", e);
    loadFailed = true;
  }

  const toOpen = chests.filter((c) => !c.opened_at);
  // Dernier coffre ouvert en tête de section (le plus récent d'abord)
  const opened = chests
    .filter((c) => c.opened_at)
    .sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at));

  const page = root.querySelector(".mc-page");
  if (!page) return;

  let html = "";

  if (toOpen.length > 0) {
    html += `<div class="mc-section">${ct("to_open", "À ouvrir")} (${toOpen.length})</div>`;
    html += `<div class="mc-list">${toOpen.map(renderCard).join("")}</div>`;
  }

  if (opened.length > 0) {
    // Le compteur vit dans l'en-tête (remplace les coches identiques par carte)
    html += `<div class="mc-section">${ct("opened_hd", "Déjà ouverts")} (${opened.length})</div>`;
    html += `<div class="mc-list">${opened.map(renderCard).join("")}</div>`;
  }

  if (chests.length === 0) {
    html = loadFailed
      ? `<div class="mc-empty"><div class="mc-empty-ico">${medallion("panneau", "orange", { size: 52 })}</div>${crtl(ct("unavailable", "« Coffres » indisponible."))}<br>${crtl(ct("check_conn", "Vérifie ta connexion, puis réessaie."))}<br>
         <button class="mc-open-btn" id="mc-retry" style="margin-top:12px">${ct("retry", "Réessayer")}</button></div>`
      : `<div class="mc-empty"><div class="mc-empty-ico">${medallion("coffre", "slate", { size: 52 })}</div>${crtl(ct("none", "Aucun coffre pour l’instant."))}<br>${crtl(ct("none_sub", "Termine un monde ou tiens ta série."))}</div>`;
  }

  // Replace skeleton with real content
  page.querySelector(".mc-list")?.remove();
  page.insertAdjacentHTML("beforeend", html);
  page.querySelector("#mc-retry")?.addEventListener("click", () => mount(root));

  // Wire click on "can open" cards
  page.querySelectorAll(".mc-card.mc-can-open").forEach((card) => {
    const chestType = card.dataset.chestType;
    const meta = CHEST_META[chestType] || { label: chestType };

    const triggerOpen = async () => {
      track("chest.opened_from_page", { chest_type: chestType });
      playCoin();

      const markOpened = () => {
        card.classList.remove("mc-can-open");
        card.classList.add("mc-opened");
        card.tabIndex = -1;
        card.querySelector(".mc-open-btn")?.remove();
        const sub = card.querySelector(".mc-sub");
        if (sub) sub.textContent = ctR("opened_today", "Ouvert aujourd’hui");
        card.querySelector(".mc-rewards")?.remove();
      };

      const migrateCard = () => {
        const fromList = card.closest(".mc-list");
        const sectionHdr = fromList?.previousElementSibling;
        card.remove();

        // Update or remove the "À ouvrir" section
        if (fromList) {
          if (fromList.children.length === 0) {
            fromList.remove();
            sectionHdr?.remove();
          } else {
            sectionHdr.textContent = `${ctR("to_open", "À ouvrir")} (${fromList.children.length})`;
          }
        }

        // Find or create the "Déjà ouverts" section
        let openedList = null;
        page.querySelectorAll(".mc-section").forEach((hdr) => {
          if (hdr.textContent.startsWith(ctR("opened_hd", "Déjà ouverts"))) {
            openedList = hdr.nextElementSibling;
          }
        });
        if (!openedList) {
          const hdr = Object.assign(document.createElement("div"), {
            className: "mc-section",
            textContent: ctR("opened_hd", "Déjà ouverts"),
          });
          openedList = Object.assign(document.createElement("div"), {
            className: "mc-list",
          });
          page.appendChild(hdr);
          page.appendChild(openedList);
        }
        openedList.prepend(card);
        // Le compteur de l'en-tête suit le nombre de coffres ouverts
        const openedHdr = openedList.previousElementSibling;
        if (openedHdr?.classList?.contains("mc-section"))
          openedHdr.textContent = `${ctR("opened_hd", "Déjà ouverts")} (${openedList.children.length})`;
      };

      // Persiste l'ouverture en DB + met à jour l'UI
      const persistOpen = async (silent = false) => {
        const result = await openChest(chestType);
        if (result.ok) {
          markOpened();
          migrateCard();
          if (!silent) {
            navigator.vibrate?.([30, 50, 30]);
            // Montant réellement crédité par le serveur : openChest renvoie
            // { ok, data } et le RPC open_chest expose data.gemmes_added
            // (result.gemmes n'a jamais existé), fallback sur la méta locale.
            const gemsWon = result.data?.gemmes_added ?? meta.gemmes ?? 0;
            const _l = getLang();
            const _lab = chestLabel(chestType, meta.label);
            toast(
              _l === "en"
                ? `${_lab} opened! +${gemsWon} ${volantWord(gemsWon, _l)}`
                : _l === "ar"
                  ? `${_lab} فُتح! +${gemsWon} مقود`
                  : `${meta.label} ouvert ! +${gemsWon} volants`,
              "success",
            );
            // Jetons dorés vers le HUD (coffres non-monde)
            if (gemsWon > 0) flyVolants(gemsWon, { from: card });
          }
        } else if (result.error === "already_opened") {
          markOpened();
          migrateCard();
        } else {
          console.error("[mes-coffres] openChest error:", result.error);
          toast(
            result.error || ctR("open_fail", "Le coffre n’a pas pu s’ouvrir. Réessaie."),
            "error",
          );
        }
      };

      // Coffres MONDE → modal cinématique, persistance DB au clic "Réclamer" (onClaim)
      const worldMatch = chestType.match(/^world_(\d+)$/);
      if (worldMatch) {
        const worldNum = parseInt(worldMatch[1], 10);
        const WORLD_NAMES = [
          "",
          ctR("wname_1", "Sécurité"),
          ctR("wname_2", "Manœuvres"),
          ctR("wname_3", "Conduite"),
          ctR("wname_4", "Maîtrise"),
        ];
        openChestModal({
          worldNum,
          worldName:
            WORLD_NAMES[worldNum] || `${ctR("world_n", "Monde")} ${worldNum}`,
          onClaim: () => persistOpen(true), // l'anim affiche déjà les récompenses
        });
        return;
      }

      // Coffres non-monde (streak, quiz) → ouverture directe
      const btn = card.querySelector(".mc-open-btn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "…";
      }
      await persistOpen(false);
      if (btn && card.classList.contains("mc-can-open")) {
        btn.disabled = false;
        btn.textContent = ctR("open_btn", "Ouvrir");
      }
    };

    card.addEventListener("click", triggerOpen);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        triggerOpen();
      }
    });
    card.querySelector(".mc-open-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerOpen();
    });
  });
}
