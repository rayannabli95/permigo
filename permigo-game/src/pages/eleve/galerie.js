// ═══════════════════════════════════════════════════════════════
// Élève — Galerie des récompenses (light theme)
// 3 sections : Trophées · Fonds carte permis · (Badges futur)
// Permet de visualiser TOUT ce qui est débloquable + l'état (acquis/verrouillé)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { yesterdayKey } from "@/services/daily-quiz.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { volantImg } from "@/utils/volant.js";
import { getCurUser } from "@/auth/cur-user.js";
import {
  esc,
  escAttr,
  safeAssetUrl,
  safeCssColor,
} from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import {
  CATALOG,
  RARITY_COLOR,
  RARITY_META,
  shortProgress,
} from "@/data/achievements.js";
import { ASSETS } from "@/utils/assets.js";
import { recompensesTabs } from "@/components/eleve/recompenses-tabs.js";
import { getLang } from "@/utils/lang.js";
import {
  trophyTitle,
  trophyBody,
  trophyGoal,
  rarityLabel,
  volantWord,
} from "@/data/rewards-i18n.js";

const RARITY_LABEL = Object.fromEntries(
  Object.entries(RARITY_META).map(([k, v]) => [k, v.label]),
);

// ── i18n de la COQUE (EN/AR) — dict local (convention coque, cf. profil #555).
// gt(key, fr) = traduit-ou-français avec esc() intégré ; gtR = brut (toasts).
// Noms/descriptions de trophées : data/rewards-i18n.js (mêmes titres que le
// profil). En 'fr' ou clé absente → FR inchangé.
const GAL_I18N = {
  en: {
    title: "My collection",
    sub_all: "Everything you can unlock.",
    loading: "Loading…",
    conn_unstable: "Unstable connection. Counters unavailable",
    unlocked_hd: "Unlocked",
    locked_hd: "To unlock",
    empty_hint:
      "No trophy unlocked yet. Validate your first skill to get started!",
    see_troph: "See the trophy",
    locked_troph: "Locked trophy:",
    locked_meta: "Locked",
    permis_hd: "Licence card backgrounds",
    tier_mesh: "Mesh",
    tier_route: "Road",
    tier_holographic: "Holographic",
    cond_start: "Available from the start",
    cond_10: "10 skills validated",
    cond_20: "20 skills validated",
    acquis: "Owned",
    comp_word: "skills",
    close: "Close",
    unlocked_state: "Unlocked",
    locked_state: "Locked",
    tab_troph: "Trophies",
    tab_permis: "Backgrounds",
    reward_sing: "reward unlocked out of",
    reward_plur: "rewards unlocked out of",
  },
  ar: {
    title: "مجموعتي",
    sub_all: "كل ما يمكنك فتحه.",
    loading: "جارٍ التحميل…",
    conn_unstable: "اتصال غير مستقر. العدادات غير متاحة",
    unlocked_hd: "مفتوحة",
    locked_hd: "للفتح",
    empty_hint: "لا كؤوس مفتوحة بعد. تحقّق من مهارتك الأولى للبدء!",
    see_troph: "عرض الكأس",
    locked_troph: "كأس مقفلة:",
    locked_meta: "مقفلة",
    permis_hd: "خلفيات بطاقة الرخصة",
    tier_mesh: "شبكي",
    tier_route: "الطريق",
    tier_holographic: "هولوغرافي",
    cond_start: "متاحة منذ البداية",
    cond_10: "10 مهارات مُتحقّقة",
    cond_20: "20 مهارة مُتحقّقة",
    acquis: "مِلكك",
    comp_word: "مهارات",
    close: "إغلاق",
    unlocked_state: "مفتوحة",
    locked_state: "مقفلة",
    tab_troph: "الكؤوس",
    tab_permis: "الخلفيات",
    reward_sing: "مكافأة مفتوحة من أصل",
    reward_plur: "مكافآت مفتوحة من أصل",
  },
};
function gtR(key, fr) {
  const l = getLang();
  return (l !== "fr" && GAL_I18N[l]?.[key]) || fr;
}
function gt(key, fr) {
  return esc(gtR(key, fr));
}
// Texte traduit posé en HTML : span RTL en arabe (ponctuation au bon endroit).
function gtD(key, fr) {
  const v = gt(key, fr);
  return getLang() === "ar" ? `<span dir="rtl">${v}</span>` : v;
}
function grtl(html) {
  return getLang() === "ar" ? `<span dir="rtl">${html}</span>` : html;
}

const STYLE = `<style>
.gal {
  padding: 0 0 100px;
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  font-family: 'Archivo', sans-serif;
}
.gal-hd {
  padding: 20px 20px 12px;
  background: var(--bg);
}
.gal-title { font: 800 24px/1.1 'Archivo', sans-serif; color: var(--ink); letter-spacing: -.025em; margin: 0; }
.gal-sub   { font: 500 13px/1.4 'Archivo', sans-serif; color: var(--mu3); margin: 4px 0 0; }

/* Tabs */
.gal-tabs {
  display: flex; gap: 4px;
  padding: 12px 20px 16px;
  background: var(--bg);
  position: sticky; top: 0; z-index: 10;
}
.gal-tab {
  flex: 1;
  padding: 10px 12px;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 12px;
  font: 700 12px/1 'Archivo', sans-serif;
  color: var(--mu);
  letter-spacing: .04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
  font-family: inherit;
  min-height: 44px;
}
.gal-tab.active {
  background: var(--su);
  color: var(--a-txt);
  border-color: color-mix(in srgb, var(--a) 25%, transparent);
  box-shadow: 0 1px 3px rgba(11,13,26,.06);
}
.gal-tab:not(.active):hover { color: var(--ink); }

/* Section heading */
.gal-section-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px 8px;
}
.gal-section-title { font: 700 13px/1 'Archivo', sans-serif; color: var(--mu3); letter-spacing: .08em; text-transform: uppercase; }
.gal-section-count { font: 700 12px/1 'Archivo', sans-serif; color: var(--a-txt); background: color-mix(in srgb, var(--a) 10%, transparent); border-radius: 20px; padding: 3px 10px; }

/* Grid */
.gal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 16px;
}
@media (max-width: 360px) { .gal-grid { grid-template-columns: 1fr 1fr; } }

.gal-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 18px;
  padding: 14px 10px 12px;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), border-color .15s ease;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(11,13,26,.05);
}
.gal-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--gc, var(--a)) 35%, transparent); }
.gal-card:active { transform: scale(.97); }
.gal-card.locked { opacity: .55; }
.gal-card.locked .gal-card-visual { filter: grayscale(.9); }

.gal-card-visual {
  width: 56px; height: 56px;
  border-radius: 14px;
  margin: 0 auto 8px;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--gc, var(--a)) 12%, #fff);
  overflow: hidden;
  position: relative;
}
.gal-card-visual img { width: 100%; height: 100%; object-fit: contain; }
.gal-card-visual .gal-emoji { font-size: 28px; line-height: 1; }

.gal-card-nom {
  font: 700 11px/1.3 'Archivo', sans-serif;
  color: var(--ink);
  margin-bottom: 4px;
  letter-spacing: -.005em;
}
.gal-card-meta {
  font: 600 9.5px/1 'Archivo', sans-serif;
  color: var(--mu2);
  letter-spacing: .04em;
  text-transform: uppercase;
}

/* Lock icon overlay */
.gal-lock-badge {
  position: absolute;
  top: 7px; right: 7px;
  width: 18px; height: 18px;
  display: grid; place-items: center;
  line-height: 0;
  filter: drop-shadow(0 1px 3px rgba(11,13,26,.35));
}

/* Fonds permis — card un peu plus large */
.gal-permis-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 0 16px;
}
.gal-permis-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 18px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 0 1px 3px rgba(11,13,26,.05);
}
.gal-permis-card.locked { opacity: .55; }
.gal-permis-card.acquis { border-color: rgba(16,185,129,.35); background: linear-gradient(135deg, #ecfdf5 0%, #fff 60%); }
.gal-permis-preview {
  width: 90px; height: 64px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  border: 1px solid rgba(11,13,26,.08);
  box-shadow: 0 4px 14px rgba(11,13,26,.1);
}
.gal-permis-card.locked .gal-permis-preview { filter: grayscale(.85) brightness(.92); }
.gal-permis-info { flex: 1; min-width: 0; }
.gal-permis-nom { font: 800 14px/1.2 'Archivo', sans-serif; color: var(--ink); margin-bottom: 4px; letter-spacing: -.01em; }
.gal-permis-cond { font: 500 12px/1.4 'Archivo', sans-serif; color: var(--mu3); }
.gal-permis-status { flex-shrink: 0; }

/* Hint footer */
.gal-empty-hint {
  margin: 20px 16px 0;
  padding: 18px 16px;
  text-align: center;
  background: var(--su);
  border: 1px dashed var(--bo);
  border-radius: 14px;
}
.gal-empty-hint-emoji { font-size: 28px; margin-bottom: 6px; }
.gal-empty-hint-txt { font: 500 12.5px/1.5 'Archivo', sans-serif; color: var(--mu2); font-style: italic; }

/* ── Modal agrandissement trophée ── */
.gal-modal-bg {
  position: fixed; inset: 0; z-index: 320;
  display: flex; align-items: center; justify-content: center;
  padding: calc(env(safe-area-inset-top, 0px) + 24px) 24px calc(env(safe-area-inset-bottom, 0px) + 24px);
  background: rgba(11,13,26,.62);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  animation: galFade .2s ease;
}
@keyframes galFade { from { opacity: 0; } to { opacity: 1; } }
.gal-modal {
  position: relative;
  width: 100%; max-width: 340px;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 24px;
  padding: 28px 22px 22px;
  text-align: center;
  box-shadow: 0 24px 60px -12px rgba(11,13,26,.5);
  animation: galPop .32s cubic-bezier(.5,1.5,.4,1);
}
@keyframes galPop { from { transform: scale(.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.gal-modal.locked .gal-modal-visual { filter: grayscale(.9) brightness(.85); }
.gal-modal-close {
  position: absolute; top: 12px; right: 12px;
  width: 32px; height: 32px; border-radius: 50%;
  border: 0; cursor: pointer;
  background: var(--bg2, rgba(15,23,42,.06)); color: var(--mu);
  font-size: 18px; line-height: 1;
  display: grid; place-items: center;
}
.gal-modal-close::before { content: ''; position: absolute; inset: -6px; }
.gal-modal-visual {
  width: 132px; height: 132px;
  margin: 4px auto 16px;
  border-radius: 28px;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--gc, var(--a)) 14%, var(--su));
  overflow: hidden;
}
.gal-modal-visual img { width: 100%; height: 100%; object-fit: contain; }
.gal-modal-visual .gal-emoji { font-size: 72px; line-height: 1; }
.gal-modal-rarity {
  display: inline-block;
  font: 800 10px/1 'Archivo', sans-serif;
  letter-spacing: .1em; text-transform: uppercase;
  padding: 5px 12px; border-radius: 99px;
  margin-bottom: 10px;
  color: var(--rarity-color, var(--mu2));
  background: color-mix(in srgb, var(--rarity-color, var(--mu2)) 16%, transparent);
}
.gal-modal-nom { font: 800 21px/1.2 'Archivo', sans-serif; color: var(--ink); letter-spacing: -.02em; margin-bottom: 8px; }
.gal-modal-desc { font: 500 14px/1.5 'Archivo', sans-serif; color: var(--mu); margin-bottom: 16px; }
.gal-modal-foot {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font: 700 12px/1 'Archivo', sans-serif;
}
.gal-modal-xp { color: var(--a-txt); background: color-mix(in srgb, var(--a) 10%, transparent); padding: 6px 12px; border-radius: 99px; }
.gal-modal-state { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 99px; }
.gal-modal-state .pg-med { flex: none; }
.gal-modal-state.on  { color: var(--grdk); background: rgba(16,185,129,.12); }
.gal-modal-state.off { color: var(--mu2); background: var(--bg2, var(--bg3)); }

    @media (prefers-reduced-motion: reduce){
      *,*::before,*::after{
        animation-duration:.001ms!important;animation-iteration-count:1!important;
        transition-duration:.001ms!important;scroll-behavior:auto!important}
    }
</style>`;

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page.view", { page: "galerie", user_role: me.role });

  // Initial skeleton
  root.innerHTML = `${STYLE}<div class="gal">
    ${recompensesTabs("galerie")}
    <div class="gal-hd">
      <h1 class="gal-title">${gt("title", "Ma collection")}</h1>
      <p class="gal-sub">${gtD("sub_all", "Tout ce que tu peux débloquer.")}</p>
    </div>
    <div style="padding:24px;text-align:center;color:var(--mu2)">${gt("loading", "Chargement…")}</div>
  </div>`;

  // Source de vérité : succès réellement débloqués (table achievements_unlocked)
  // + compteurs pour la progression des cartes verrouillées.
  let validatedCount = 0;
  let currentStreak = 0;
  let unlockedMap = new Map();
  try {
    const [achRes, validRes, streakRes, selfValRes] = await Promise.allSettled([
      sb.rpc("get_my_achievements"),
      sb
        .from("validations")
        .select("competence_id")
        .eq("eleve_id", me.id)
        .eq("statut", "acquis"),
      sb
        .from("streaks")
        .select("current_streak, last_activity_date")
        .eq("user_id", me.id)
        .maybeSingle(),
      // Validation autonome (élève solo, valider-seul.js) : table séparée de
      // `validations`, fusionnée pour ne pas laisser la collection bloquée.
      // Même pattern que accueil.js.
      sb.from("self_validations").select("competence_id").eq("eleve_id", me.id),
    ]);
    unlockedMap = new Map(
      (achRes.value?.data ?? []).map((u) => [u.achievement_key, u]),
    );
    // Compétences acquises (moniteur ou auto-validées), dédupliquées.
    const _compSet = new Set(
      (validRes.value?.data || []).map((v) => v.competence_id),
    );
    for (const s of selfValRes.value?.data || []) _compSet.add(s.competence_id);
    validatedCount = _compSet.size;
    const _skRow = streakRes.value?.data;
    const _yStr = yesterdayKey();
    // Série d'activité : périmée si dernière activité < hier (sinon on afficherait
    // un vieux chiffre alors que la série est cassée). Cf. accueil streakStatus.
    currentStreak =
      _skRow && _skRow.last_activity_date >= _yStr
        ? (_skRow.current_streak ?? 0)
        : 0;
  } catch (e) {
    console.warn("[galerie] fetch failed", e);
    import("@/components/common/toast.js")
      .then(({ toast }) =>
        toast(
          gtR("conn_unstable", "Connexion instable. Compteurs indisponibles"),
          "info",
        ),
      )
      .catch(() => {});
  }

  const progressStats = { compCount: validatedCount, streak: currentStreak };
  const _lang = getLang();
  const trophees = CATALOG.map((c) => ({
    id: c.key,
    image: c.image,
    ico: c.emoji,
    nom: trophyTitle(c.key, c.title, _lang),
    desc: trophyBody(c.key, c.body, _lang),
    rarity: c.rarity,
    xp: c.xp,
    gemmes: c.gemmes,
    color: RARITY_COLOR[c.rarity] || "var(--mu2)",
    objectif:
      trophyGoal(c.key, progressStats, _lang) ??
      shortProgress(c.key, progressStats),
    unlocked: unlockedMap.has(c.key),
  }));
  const unlockedTrophies = trophees.filter((t) => t.unlocked).length;

  // 3 paliers fonds permis (mesh < 10, route 10-19, holo 20+)
  const permisTiers = [
    {
      key: "mesh",
      min: 0,
      max: 9,
      nom: gtR("tier_mesh", "Mesh"),
      cond: gtR("cond_start", "Disponible dès le départ"),
      img: ASSETS.permisBg.mesh,
    },
    {
      key: "route",
      min: 10,
      max: 19,
      nom: gtR("tier_route", "Route"),
      cond: gtR("cond_10", "10 compétences acquises"),
      img: ASSETS.permisBg.route,
    },
    {
      key: "holographic",
      min: 20,
      max: 31,
      nom: gtR("tier_holographic", "Holographique"),
      cond: gtR("cond_20", "20 compétences acquises"),
      img: ASSETS.permisBg.holographic,
    },
  ].map((t) => ({ ...t, unlocked: validatedCount >= t.min }));
  const unlockedPermisBg = permisTiers.filter((t) => t.unlocked).length;

  let activeTab = "trophees";

  function applyGalleryStyles(scope) {
    scope.querySelectorAll("[data-gal-color]").forEach((element) => {
      element.style.setProperty(
        "--gc",
        safeCssColor(element.dataset.galColor, "var(--mu2)"),
      );
    });
    scope.querySelectorAll("[data-rarity-color]").forEach((element) => {
      element.style.setProperty(
        "--rarity-color",
        safeCssColor(element.dataset.rarityColor, "var(--mu2)"),
      );
    });
    scope.querySelectorAll("[data-gal-bg]").forEach((element) => {
      const url = safeAssetUrl(element.dataset.galBg);
      if (url) element.style.backgroundImage = `url("${url}")`;
    });
  }

  function renderTrophees() {
    const unlocked = trophees.filter((t) => t.unlocked);
    const locked = trophees.filter((t) => !t.unlocked);
    return `
      <div class="gal-section-hd">
        <span class="gal-section-title">${gt("unlocked_hd", "Débloqués")}</span>
        <span class="gal-section-count">${unlocked.length}/${trophees.length}</span>
      </div>
      <div class="gal-grid">
        ${unlocked.length === 0 ? "" : unlocked.map((t) => renderTrophyCard(t, true)).join("")}
      </div>
      ${
        unlocked.length === 0
          ? `
        <div class="gal-empty-hint">
          <div class="gal-empty-hint-emoji">${medallion("trophee", "gold", { size: 44 })}</div>
          <div class="gal-empty-hint-txt">${gtD("empty_hint", "Aucun trophée débloqué pour l'instant. Valide ta première compétence pour commencer !")}</div>
        </div>
      `
          : ""
      }
      ${
        locked.length > 0
          ? `
        <div class="gal-section-hd" style="margin-top:8px"><span class="gal-section-title">${gt("locked_hd", "À débloquer")}</span></div>
        <div class="gal-grid">${locked.map((t) => renderTrophyCard(t, false)).join("")}</div>
      `
          : ""
      }
    `;
  }

  function renderTrophyCard(t, unlocked) {
    const color = safeCssColor(t.color, "var(--mu2)");
    const imageUrl = safeAssetUrl(t.image);
    const visual = imageUrl
      ? `<img src="${escAttr(imageUrl)}" alt="${escAttr(t.nom)}" loading="lazy" />`
      : `<span class="gal-emoji">${medallion("trophee", "gold", { size: 48 })}</span>`;
    const ariaLabel = unlocked
      ? `${gtR("see_troph", "Voir le trophée")} ${t.nom}`
      : `${gtR("locked_troph", "Trophée verrouillé :")} ${t.nom}`;
    return `
      <div class="gal-card ${unlocked ? "acquis" : "locked"}" data-gal-color="${escAttr(color)}"
           data-id="${escAttr(t.id)}" role="button" tabindex="0"
           aria-label="${escAttr(ariaLabel)}">
        ${!unlocked ? `<div class="gal-lock-badge" aria-hidden="true">${medallion("cadenas", "slate", { size: 18 })}</div>` : ""}
        <div class="gal-card-visual">${visual}</div>
        <div class="gal-card-nom">${grtl(esc(t.nom))}</div>
        ${unlocked ? "" : `<div class="gal-card-meta">${grtl(esc(t.objectif || gtR("locked_meta", "Verrouillé")))}</div>`}
      </div>
    `;
  }

  function renderPermisTiers() {
    return `
      <div class="gal-section-hd">
        <span class="gal-section-title">${gt("permis_hd", "Fonds carte permis")}</span>
        <span class="gal-section-count">${unlockedPermisBg}/${permisTiers.length}</span>
      </div>
      <div class="gal-permis-grid">
        ${permisTiers
          .map(
            (t) => `
          <div class="gal-permis-card ${t.unlocked ? "acquis" : "locked"}">
            <div class="gal-permis-preview" data-gal-bg="${escAttr(safeAssetUrl(t.img))}"></div>
            <div class="gal-permis-info">
              <div class="gal-permis-nom">${grtl(esc(t.nom))}</div>
              <div class="gal-permis-cond">${grtl(esc(t.cond))}</div>
            </div>
            <div class="gal-permis-status">
              ${
                t.unlocked
                  ? `<span style="font:700 10px/1 'Archivo',sans-serif;color:var(--grdk);background:rgba(16,185,129,.12);padding:5px 10px;border-radius:99px;text-transform:uppercase;letter-spacing:.06em">${gt("acquis", "Acquis")}</span>`
                  : `<span style="font:700 10px/1 'Archivo',sans-serif;color:var(--mu2);background:var(--bg3);padding:5px 10px;border-radius:99px;text-transform:uppercase;letter-spacing:.06em">${icon("lock", { size: 11 })} ${esc(`${t.min}`)} ${gt("comp_word", "comp")}</span>`
              }
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  // Modal d'agrandissement d'un trophée (clic carte)
  function openTrophyModal(t, unlocked) {
    if (document.querySelector(".gal-modal-bg")) return;
    const color = safeCssColor(t.color, "var(--mu2)");
    const rarityColor = safeCssColor(
      RARITY_COLOR[t.rarity],
      "var(--mu2)",
    );
    const rarityTxt = rarityLabel(
      t.rarity,
      RARITY_LABEL[t.rarity] || t.rarity || "",
      getLang(),
    );
    const imageUrl = safeAssetUrl(t.image);
    const visual = imageUrl
      ? `<img src="${escAttr(imageUrl)}" alt="${escAttr(t.nom)}" />`
      : `<span class="gal-emoji">${medallion("trophee", "gold", { size: 96 })}</span>`;

    const overlay = document.createElement("div");
    overlay.className = "gal-modal-bg";
    overlay.innerHTML = `
      <div class="gal-modal ${unlocked ? "" : "locked"}" data-gal-color="${escAttr(color)}" role="dialog" aria-modal="true" aria-label="${escAttr(t.nom)}">
        <button class="gal-modal-close" type="button" aria-label="${escAttr(gtR("close", "Fermer"))}">×</button>
        <div class="gal-modal-visual">${visual}</div>
        ${rarityTxt ? `<div class="gal-modal-rarity" data-rarity-color="${escAttr(rarityColor)}">${esc(rarityTxt)}</div>` : ""}
        <div class="gal-modal-nom">${grtl(esc(t.nom))}</div>
        <div class="gal-modal-desc">${grtl(esc(t.desc || ""))}</div>
        <div class="gal-modal-foot">
          ${t.gemmes ? `<span class="gal-modal-xp" style="color:var(--gr);background:rgba(16,185,129,.1)">+${t.gemmes} ${volantImg(13)} ${esc(volantWord(t.gemmes, getLang()))}</span>` : ""}
          <span class="gal-modal-state ${unlocked ? "on" : "off"}">${unlocked ? `${medallion("check", "green", { size: 16 })} ${gt("unlocked_state", "Débloqué")}` : t.objectif ? grtl(esc(t.objectif)) : `${medallion("cadenas", "slate", { size: 16 })} ${gt("locked_state", "Verrouillé")}`}</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    applyGalleryStyles(overlay);
    track("galerie.trophy_opened", { trophy_id: t.id, unlocked });

    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    const close = () => {
      overlay.style.animation = "galFade .15s ease reverse forwards";
      setTimeout(() => overlay.remove(), 140);
      document.removeEventListener("keydown", onKey);
    };
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector(".gal-modal-close")?.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
  }

  function render() {
    root.innerHTML = `${STYLE}
      <div class="gal anim-slide-up">
        ${recompensesTabs("galerie")}
        <div class="gal-hd">
          <h1 class="gal-title">${gt("title", "Ma collection")}</h1>
          <p class="gal-sub">${(() => {
            const n = unlockedTrophies + unlockedPermisBg;
            const m = trophees.length + permisTiers.length;
            const plur = n > 1;
            const txt =
              getLang() === "fr"
                ? `${n} récompense${plur ? "s" : ""} débloquée${plur ? "s" : ""} sur ${m}.`
                : `${n} ${gtR(plur ? "reward_plur" : "reward_sing", "récompense débloquée sur")} ${m}.`;
            return grtl(esc(txt));
          })()}</p>
        </div>
        <div class="gal-tabs" role="tablist">
          <button class="gal-tab ${activeTab === "trophees" ? "active" : ""}" data-tab="trophees" role="tab" aria-selected="${activeTab === "trophees"}">${gt("tab_troph", "Trophées")}</button>
          <button class="gal-tab ${activeTab === "permis" ? "active" : ""}" data-tab="permis" role="tab" aria-selected="${activeTab === "permis"}">${gt("tab_permis", "Fonds permis")}</button>
        </div>
        <div id="gal-content">
          ${activeTab === "trophees" ? renderTrophees() : renderPermisTiers()}
        </div>
      </div>`;
    applyGalleryStyles(root);

    root.querySelectorAll(".gal-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        if (tab === activeTab) return;
        activeTab = tab;
        track("galerie.tab_switched", { tab });
        render();
      });
    });

    // Clic / clavier sur une carte trophée → agrandissement
    root.querySelectorAll(".gal-card").forEach((card) => {
      const open = () => {
        const t = trophees.find((x) => x.id === card.dataset.id);
        if (t) openTrophyModal(t, !!t.unlocked);
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  render();
}
