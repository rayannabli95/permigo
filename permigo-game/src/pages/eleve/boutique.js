// ═══════════════════════════════════════════════════════════════
// Élève — Boutique (refonte "app de l'année" — ADN Supercell/CR)
// RPCs : get_items_catalog() · purchase_item(p_item_id)
// Onglets : Skins (avatars = voitures) · Fonds (permis_bg)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { getCurUser } from "@/auth/cur-user.js";
import { isSoloEleve } from "@/utils/league-bots.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { toast } from "@/components/common/toast.js";
import { haptic } from "@/utils/haptic.js";
import { recompensesTabs } from "@/components/eleve/recompenses-tabs.js";
import {
  equipItem,
  unequipItem,
  setEquippedAsset,
  getEquipped,
  getEquippedAsset,
  getGemmes,
} from "@/utils/game-state.js";
import { openBottomSheet } from "@/components/common/bottom-sheet.js";
import { volantImg } from "@/utils/volant.js";
import { bumpVolantPill } from "@/components/eleve/volant-reward.js";
import { showPurchaseReveal } from "@/components/eleve/purchase-reveal.js";
import { getLang } from "@/utils/lang.js";
import {
  itemName,
  itemDesc,
  rarityLabel,
  volantWord,
} from "@/data/rewards-i18n.js";

// ── i18n de la COQUE (EN/AR) — dict local (convention coque, cf. profil #555).
// bt(key, fr) = traduit-ou-français esc() intégré (sûr texte + attribut) ;
// btR = brut (toasts, textContent, interpolation). Noms/descriptions d'objets :
// data/rewards-i18n.js (catalogue prod mappé par id, fallback FR serveur).
// En 'fr' ou clé absente → FR inchangé.
const BO_I18N = {
  en: {
    sec_voitures: "Cars",
    sec_voitures_sub: "Your car on the leaderboard",
    sec_persos: "Characters",
    sec_persos_sub: "Your avatar next to your name",
    sec_fonds: "Licence backgrounds",
    sec_fonds_sub: "Your virtual licence card",
    roue_aria: "Open the Wheel",
    roue_t: "The Wheel",
    roue_s_solo: "Skins, titles and <b>rewards</b> to unlock.",
    roue_s: "Skins, titles and <b>real big prizes</b> from your instructor.",
    roue_go: "Free spin!",
    hd_title: "Shop",
    hd_small: "Your style on the leaderboard",
    balance_lab: "Your balance:",
    sr_volants: "steering wheels",
    unavailable: "“Shop” unavailable",
    check_conn: "Check your connection, then try again.",
    vedette: "Star of the day",
    vedette_sub: "The piece to aim for",
    selection: "✦ Selection",
    note: "Skins are 100% cosmetic: style, never an advantage.",
    obj_removed: "Objective removed",
    obj_set: "Objective set — earn steering wheels by revising!",
    buy_fail: "Purchase failed. Try again.",
    not_enough: "Not enough steering wheels",
    already_owned: "Already in your inventory",
    buy: "Buy",
    see: "View",
    can_afford: "You can buy it!",
    equipped: "✓ Equipped",
    equipped_short: "Equipped",
    tap_equip: "Tap to equip",
    aria_equipped: "equipped",
    aria_unlocked: "unlocked",
    aria_buy: "buy",
    aria_not_enough: "not enough steering wheels",
    hero_sub_default: "Your signature on the leaderboard",
    intro_x: "Got it",
    intro_title: "Your car, your signature",
    intro_1: "It shows next to your name on the leaderboard",
    intro_2: "Unlock skins with your steering wheels",
    intro_3: "Tap a skin to equip it in 1 tap",
    ribbon: "Legend.",
    owned_lab: "Owned",
    equip_btn: "Equip",
    unlocked_badge: "Unlocked",
    obj_kick_pin: "Your goal",
    obj_kick_aim: "To aim for",
    obj_reached: "Goal reached!",
    obj_touch: "— tap to get it",
    obj_earn: "Earned by <b>revising</b>",
    obj_aria: "Goal:",
    obj_can_buy: "you can buy it",
    obj_x: "Remove the objective",
    daily_kick: "Reward for revising",
    daily_title: "Earn steering wheels every day",
    daily_sub:
      "Every finished revision session credits your balance. <b>No shortcuts.</b>",
    daily_cta: "Revise",
    price: "Price",
    equipped_remove: "✓ Equipped — remove",
    obj_on: "✓ This is your goal",
    obj_off: "🎯 Set as goal",
    close: "Close",
    try_rank: "Your skin on the leaderboard",
    try_permis: "Preview on your licence",
    me_fallback: "You",
  },
  ar: {
    sec_voitures: "السيارات",
    sec_voitures_sub: "سيارتك في التصنيف",
    sec_persos: "الشخصيات",
    sec_persos_sub: "صورتك الرمزية بجانب اسمك",
    sec_fonds: "خلفيات الرخصة",
    sec_fonds_sub: "بطاقة رخصتك الافتراضية",
    roue_aria: "افتح العجلة",
    roue_t: "العجلة",
    roue_s_solo: "أشكال وألقاب و<b>مكافآت</b> للفتح.",
    roue_s: "أشكال وألقاب و<b>جوائز كبرى حقيقية</b> من مدرّبك.",
    roue_go: "دورة مجانية!",
    hd_title: "المتجر",
    hd_small: "أسلوبك في التصنيف",
    balance_lab: "رصيدك:",
    sr_volants: "مقود",
    unavailable: "«المتجر» غير متاح",
    check_conn: "تحقّق من اتصالك ثم أعد المحاولة.",
    vedette: "نجم اليوم",
    vedette_sub: "القطعة المنشودة",
    selection: "✦ مختارات",
    note: "الأشكال تجميلية 100% : أناقة فقط، لا أفضلية أبدًا.",
    obj_removed: "أُزيل الهدف",
    obj_set: "حُدّد الهدف — اربح مقاود بالمراجعة!",
    buy_fail: "تعذّر الشراء. أعد المحاولة.",
    not_enough: "لا مقاود كافية",
    already_owned: "موجود في مخزونك بالفعل",
    buy: "اشترِ",
    see: "عرض",
    can_afford: "يمكنك شراؤه!",
    equipped: "✓ مُجهَّز",
    equipped_short: "مُجهَّز",
    tap_equip: "المس للتجهيز",
    aria_equipped: "مُجهَّز",
    aria_unlocked: "مفتوح",
    aria_buy: "اشترِ",
    aria_not_enough: "لا مقاود كافية",
    hero_sub_default: "توقيعك في التصنيف",
    intro_x: "فهمت",
    intro_title: "سيارتك، توقيعك",
    intro_1: "تظهر بجانب اسمك في التصنيف",
    intro_2: "افتح الأشكال بمقاودك",
    intro_3: "المس شكلًا لتجهيزه بلمسة واحدة",
    ribbon: "أسطوري",
    owned_lab: "مِلكك",
    equip_btn: "جهّز",
    unlocked_badge: "مفتوح",
    obj_kick_pin: "هدفك",
    obj_kick_aim: "للطموح",
    obj_reached: "تحقّق الهدف!",
    obj_touch: "— المس للحصول عليه",
    obj_earn: "يُربح <b>بالمراجعة</b>",
    obj_aria: "الهدف:",
    obj_can_buy: "يمكنك شراؤه",
    obj_x: "أزل الهدف",
    daily_kick: "مكافأة بالمراجعة",
    daily_title: "اربح مقاود كل يوم",
    daily_sub: "كل جلسة مراجعة مكتملة تُضاف إلى رصيدك. <b>لا اختصارات.</b>",
    daily_cta: "راجع",
    price: "السعر",
    equipped_remove: "✓ مُجهَّز — أزِل",
    obj_on: "✓ هذا هدفك",
    obj_off: "🎯 حدّده هدفًا",
    close: "إغلاق",
    try_rank: "شكلك في التصنيف",
    try_permis: "معاينة على رخصتك",
    me_fallback: "أنت",
  },
};
function btR(key, fr) {
  const l = getLang();
  return (l !== "fr" && BO_I18N[l]?.[key]) || fr;
}
function bt(key, fr) {
  return esc(btR(key, fr));
}
// Texte traduit (éventuellement avec <b> maison) posé en HTML : span RTL en
// arabe pour garder la ponctuation du bon côté. Jamais en attribut.
function brtl(html) {
  return getLang() === "ar" ? `<span dir="rtl">${html}</span>` : html;
}
// « Encore N volants » (barre de progression) — ordre des mots par langue.
function stillVolants(n) {
  const l = getLang();
  if (l === "en") return `${n} ${volantWord(n, "en")} to go`;
  if (l === "ar") return `بقي ${n} مقود`;
  return `Encore ${n} volant${n > 1 ? "s" : ""}`;
}
// Toast équiper/retirer — ordre des mots par langue (nom traduit).
function equipToast(item, on) {
  const l = getLang();
  const name = itemName(item.id, item.name, l);
  if (l === "en") return on ? `${name} equipped ✓` : `${name} removed`;
  if (l === "ar") return on ? `جُهّز ${name} ✓` : `أُزيل ${name}`;
  return on ? `${esc(item.name)} équipé ✓` : `${esc(item.name)} retiré`;
}

// ── Nom/description/rareté traduits (rewards-i18n, repli FR serveur) ──
function iName(item) {
  return itemName(item.id, item.name, getLang());
}
function iDesc(item) {
  return itemDesc(item.id, item.description, getLang());
}
function rLabel(item) {
  return rarityLabel(item.rarity, rm(item.rarity).label, getLang());
}
// Lignes de solde du modal — ordre des mots + pluriel par langue.
function afterBuyLine(n) {
  const l = getLang();
  if (l === "en")
    return `<strong>${n}</strong> ${volantWord(n, "en")} left after buying`;
  if (l === "ar") return `يتبقّى لك <strong>${n}</strong> مقود بعد الشراء`;
  return `Il te restera <strong>${n}</strong> volant${n <= 1 ? "" : "s"} après l’achat`;
}
function missingLine(n) {
  const l = getLang();
  if (l === "en") return `You’re missing ${n} ${volantWord(n, "en")}`;
  if (l === "ar") return `ينقصك ${n} مقود`;
  return `Il te manque ${n} volant${n > 1 ? "s" : ""}`;
}

// Sections de la boutique. Voiture vs Personnage = distinction par asset_url
// (les voitures ont '/car-' dans l'URL ; tout le reste des avatars = perso).
const SECTIONS = [
  {
    key: "voitures",
    label: "Voitures",
    sub: "Ta voiture au classement",
    match: (i) => i.type === "avatar" && /\/car-/.test(i.asset_url || ""),
  },
  {
    key: "persos",
    label: "Personnages",
    sub: "Ton avatar à côté de ton nom",
    match: (i) => i.type === "avatar" && !/\/car-/.test(i.asset_url || ""),
  },
  {
    key: "fonds",
    label: "Fonds de permis",
    sub: "Ta carte de permis virtuelle",
    match: (i) => i.type === "permis_bg",
  },
];

// Rareté — palette harmonisée :
//   commun    = bleu neutre  (aucune émotion)
//   rare      = violet accent (thème élève)
//   épique    = magenta/violet chaud (jamais orange = « alerte »)
//   légendaire = or (aspiration max)
//
// ⚠️ Volontairement DISTINCT de RARITY_META dans data/achievements.js :
// surfaces différentes — ici, tags boutique (fond sombre) ; là-bas, médailles
// trophées (dégradés). Ne PAS fusionner sans refonte visuelle des deux écrans.
const RARITY_META = {
  commun: {
    label: "Commun",
    c: "#3b82f6",
    tagBg: "color-mix(in srgb, #3b82f6 75%, #000)",
    tagFg: "#fff",
    order: 0,
    glow: false,
    legendary: false,
  },
  rare: {
    label: "Rare",
    c: "#8b5cf6",
    tagBg: "color-mix(in srgb, #8b5cf6 75%, #000)",
    tagFg: "#fff",
    order: 1,
    glow: false,
    legendary: false,
  },
  epique: {
    label: "Épique",
    c: "#c026d3",
    tagBg: "color-mix(in srgb, #c026d3 70%, #000)",
    tagFg: "#fff",
    order: 2,
    glow: true, // glow subtil + léger gradient de fond
    legendary: false,
  },
  legendaire: {
    label: "Légendaire",
    c: "#fbbf24",
    tagBg: "#fbbf24",
    tagFg: "#1a1208",
    order: 3,
    glow: true,
    legendary: true, // bordure conic animée + shimmer holographique
  },
};

function rm(rarity) {
  return RARITY_META[rarity] ?? RARITY_META.commun;
}

// ─── CSS — GALERIE MATIN (clair luxe / joaillier) ─────────────
const STYLE = `<style>
.bo2 {
  /* Palette locale "Galerie Matin" (scopée, indépendante du thème app) */
  --g-bg:#F7F5EF; --g-top:#FFFDF8; --g-bot:#F1EDE2;
  --g-card:#FFFFFF; --g-ink:#1C1A17; --g-soft:#5C574E; --g-mute:#736D5D;
  --g-line:#EBE6DA;
  --g-gold1:#F7E7B6; --g-gold2:#E7C672; --g-gold3:#C99A3B; --g-gold4:#9C7322;
  --g-rare:#3E78C8; --g-epic:#7C4DD8; --g-common:#9A938A;
  --g-sh:0 8px 24px rgba(28,26,23,.10);
  --g-sh-lg:0 18px 44px rgba(28,26,23,.16);
  --g-rad:20px;

  max-width: 480px; margin: 0 auto; padding: 0 0 110px; min-height: 100dvh;
  font-family: 'Inter', system-ui, sans-serif; color: var(--g-ink);
  background: radial-gradient(120% 80% at 50% -10%, var(--g-top) 0%, var(--g-bg) 46%, var(--g-bot) 100%);
  -webkit-tap-highlight-color: transparent;
}

/* ── Skeleton ── */
.bo2-skel {
  background: linear-gradient(90deg, #F1EDE2 0%, #FBF8F1 50%, #F1EDE2 100%);
  background-size: 200% 100%; animation: bo2Shim 1.4s ease-in-out infinite; border-radius: var(--g-rad);
}
@keyframes bo2Shim { from{background-position:200% 0} to{background-position:-200% 0} }

/* ── Sticky header (barre verre clair) ── */
.bo2-hd {
  position: sticky; top: calc(52px + env(safe-area-inset-top, 0px)); z-index: 20;
  padding: 12px 16px 8px;
  background: linear-gradient(180deg, rgba(247,245,239,.92) 0%, rgba(247,245,239,.78) 70%, rgba(247,245,239,0) 100%);
  -webkit-backdrop-filter: saturate(150%) blur(10px); backdrop-filter: saturate(150%) blur(10px);
}
.bo2-hd-row {
  position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
  background: rgba(255,253,248,.85); border: 1px solid rgba(255,255,255,.8);
  box-shadow: 0 6px 20px rgba(28,26,23,.08), inset 0 1px 0 rgba(255,255,255,.9);
  border-radius: 16px; padding: 9px 9px 9px 15px;
}
.bo2-hd-title { font: 800 clamp(18px, 5.4vw, 20px)/1.1 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); letter-spacing: -.025em; }
.bo2-hd-title small { display: block; font: 500 10.5px/1.2 'Inter', sans-serif; color: var(--g-mute); margin-top: 2px; letter-spacing: 0; }

/* Pastille solde — capsule blanche sertie or */
.bo2-gems {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(180deg,#FFFFFF,#FBF7EC);
  border: 1px solid var(--g-gold2);
  box-shadow: 0 4px 12px rgba(201,154,59,.20), inset 0 1px 0 #fff;
  border-radius: var(--r-full); padding: 6px 14px 6px 7px; position: relative; overflow: hidden;
}
.bo2-gems-ico { font-size: 0; line-height: 0; display: flex; }
.bo2-gems-ico img { filter: drop-shadow(0 2px 3px rgba(156,115,34,.45)); }
.bo2-gems-val { font: 700 16px/1 'IBM Plex Mono', monospace; color: #7a5a16; letter-spacing: -.01em; font-variant-numeric: tabular-nums; }
.bo2-gems-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.bo2-gems-float {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  font: 700 13px/1 'IBM Plex Mono', monospace; color: #c0392b; pointer-events: none;
  opacity: 0; animation: bo2Float .8s ease-out both; z-index: 2;
}
@keyframes bo2Float { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-20px)} }

/* ── Tabs ── */
.bo2-tabs { position: relative; z-index: 1; display: flex; gap: 8px; }
.bo2-tab {
  flex: 1; padding: 10px 8px; border-radius: 13px; min-height: 44px;
  background: transparent; border: 1px solid transparent;
  font: 700 13.5px/1 'Plus Jakarta Sans', sans-serif; color: var(--g-soft);
  cursor: pointer; transition: color .15s, background .15s, border-color .15s, box-shadow .15s, transform .14s var(--ease-snap);
  white-space: nowrap;
}
.bo2-tab:active { transform: scale(.97); }
.bo2-tab.active { color: var(--g-ink); background: var(--g-card); border-color: var(--g-line); box-shadow: var(--g-sh); }

/* ═══ Hero vedette — vitrine showroom ═══ */
.bo2-hero {
  --cg: rgba(255,224,150,.55); /* ambiance cover, teintée par data-rarity */
  margin: 18px 16px 0; border-radius: 26px; overflow: hidden; position: relative;
  padding: 16px 18px 16px; cursor: pointer;
  background:
    radial-gradient(115% 75% at 50% -8%, rgba(247,231,182,.55), transparent 60%),
    linear-gradient(180deg, #FFFFFF 0%, #FBF6EA 100%);
  border: 1px solid var(--g-gold2);
  box-shadow: var(--g-sh-lg), inset 0 1px 0 #fff;
  transition: transform .14s var(--ease-spring);
}
.bo2-hero:active { transform: scale(.985); }
.bo2-hero[data-rarity="rare"] { --cg: rgba(84,160,255,.5); }
.bo2-hero[data-rarity="epique"] { --cg: rgba(168,107,255,.55); }
.bo2-hero[data-rarity="legendaire"] { --cg: rgba(255,212,120,.62); box-shadow: var(--g-sh-lg), 0 0 0 1px var(--g-gold2), 0 18px 50px -16px rgba(201,154,59,.5), inset 0 1px 0 #fff; }
.bo2-hero::before {
  content: ''; position: absolute; left: 50%; top: -40%; width: 150%; height: 130%;
  transform: translateX(-50%); pointer-events: none;
  background: radial-gradient(50% 50% at 50% 50%, rgba(255,250,235,.9), rgba(255,250,235,0) 70%);
}
/* (compat ancien markup — neutralisé en clair) */
.bo2-hero-legendary-border { display: none; }
.bo2-hero-spark {
  position: absolute; z-index: 3; width: 9px; height: 9px; pointer-events: none;
  background:
    linear-gradient(transparent 45%, #E7C672 45% 55%, transparent 55%),
    linear-gradient(90deg, transparent 45%, #E7C672 45% 55%, transparent 55%);
  filter: drop-shadow(0 0 3px rgba(231,198,114,.9));
  animation: bo2Spark 2.6s ease-in-out infinite;
}
.bo2-hero-spark.s1 { top: 14px; right: 18px; left: auto; }
.bo2-hero-spark.s2 { top: 70px; left: 22px; width: 6px; height: 6px; animation-delay: 1.2s; }
@keyframes bo2Spark { 0%,100%{opacity:0;transform:scale(.4) rotate(0)} 50%{opacity:1;transform:scale(1) rotate(45deg)} }

.bo2-hero-tag {
  position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(180deg, var(--g-gold1), var(--g-gold2)); color: #5e430f;
  border: 1px solid var(--g-gold3);
  font: 800 10px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .1em; text-transform: uppercase;
  padding: 5px 11px; border-radius: var(--r-full);
  box-shadow: 0 3px 8px rgba(201,154,59,.3), inset 0 1px 0 rgba(255,255,255,.6);
}
.bo2-hero-stage { position: relative; z-index: 1; text-align: center; padding: 8px 0 2px; min-height: 132px; display: flex; align-items: center; justify-content: center; }
.bo2-hero-stage::after {
  content: ''; position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%);
  width: 58%; height: 20px; border-radius: 50%; z-index: 0;
  background: radial-gradient(50% 50% at 50% 50%, rgba(120,80,10,.26), transparent 72%); filter: blur(3px);
}
.bo2-hero-obj {
  position: relative; z-index: 2; max-width: 86%; max-height: 124px; object-fit: contain;
  filter: drop-shadow(0 16px 20px rgba(120,80,10,.28));
  animation: bo2HeroFloat 5s ease-in-out infinite;
}
.bo2-hero-emoji { font-size: 72px; position: relative; z-index: 2; animation: bo2HeroFloat 5s ease-in-out infinite; }
@keyframes bo2HeroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
/* Hero en mode COVER (skin = scène opaque) : VITRINE CINÉMA plein cadre.
   Même mise en scène que les cartes mais plus généreuse (la vedette domine). */
.bo2-hero-stage.is-cover { padding: 0; border-radius: 18px; overflow: hidden; background: #0c0a12; min-height: 184px; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.10), inset 0 0 64px rgba(0,0,0,.5); }
.bo2-hero-stage.is-cover::after {
  content: ''; display: block; position: absolute; inset: 0; z-index: 3; pointer-events: none; border-radius: 18px;
  background:
    radial-gradient(80% 58% at 50% -10%, var(--cg), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,.16), transparent 24%),
    radial-gradient(130% 85% at 50% 124%, rgba(0,0,0,.5), transparent 60%);
}
.bo2-hero-stage.is-cover .bo2-hero-obj { max-width: none; max-height: none; width: 100%; height: 184px; object-fit: cover; filter: none; border-radius: 18px; }
.bo2-hero-sheen {
  position: absolute; top: 0; left: -35%; width: 38%; height: 100%; z-index: 3; pointer-events: none;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,.6), transparent); transform: skewX(-18deg);
  animation: bo2Sweep 4.6s ease-in-out infinite;
}
@keyframes bo2Sweep { 0%,72%{left:-40%} 86%,100%{left:120%} }

.bo2-hero-foot { position: relative; z-index: 2; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: 8px; }
.bo2-hero-body { flex: 1; min-width: 0; }
.bo2-hero-name { font: 800 21px/1.05 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); letter-spacing: -.025em; }
.bo2-hero-sub { display: flex; align-items: center; gap: 6px; margin-top: 5px; font: 600 11.5px/1.3 'Inter', sans-serif; color: var(--g-soft); }
.bo2-hero-sub .lab { font: 800 9.5px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .08em; text-transform: uppercase; color: var(--g-gold4); background: rgba(201,154,59,.14); padding: 3px 7px; border-radius: 6px; }
/* Barre de progression « plus que N volants » */
.bo2-hero-prog-wrap { display: flex; flex-direction: column; gap: 5px; margin-top: 9px; }
.bo2-hero-prog-label { font: 600 11px/1 'Inter', sans-serif; color: var(--g-soft); }
.bo2-hero-prog-track { height: 8px; border-radius: 99px; background: #EFE9DA; overflow: hidden; box-shadow: inset 0 1px 2px rgba(28,26,23,.10); }
.bo2-hero-prog-bar { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--g-gold2), var(--g-gold3) 70%, var(--g-gold4)); box-shadow: 0 0 8px rgba(201,154,59,.5); transition: width .4s ease; }
.bo2-hero-buy { flex: none; text-align: right; }
.bo2-hero-price { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }
.bo2-hero-price b { font: 700 19px/1 'IBM Plex Mono', monospace; color: var(--g-ink); font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.bo2-hero-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin-top: 8px;
  min-height: 44px; padding: 0 22px; border: none; border-radius: 14px; cursor: pointer;
  font: 800 14px/1 'Plus Jakarta Sans', sans-serif; color: #fff;
  background: linear-gradient(180deg, var(--a-lt), var(--a));
  box-shadow: 0 4px 0 var(--adk), 0 8px 16px color-mix(in srgb, var(--a) 30%, transparent);
  transition: transform .1s var(--ease-snap), box-shadow .1s var(--ease-snap);
}
.bo2-hero:active .bo2-hero-cta { transform: translateY(2px); box-shadow: 0 2px 0 var(--adk), 0 5px 10px color-mix(in srgb, var(--a) 30%, transparent); }
.bo2-hero-owned { font: 800 12px/1 'Plus Jakarta Sans', sans-serif; color: var(--adk); }

/* ═══ Objectif épinglé (wishlist, localStorage) ═══ */
.bo2-obj {
  position: relative; overflow: hidden; margin: 18px 16px 0; padding: 14px 15px;
  display: flex; gap: 13px; align-items: center; cursor: pointer;
  background: linear-gradient(180deg, #FFFFFF 0%, #FCFAF3 100%);
  border: 1px solid var(--g-line); border-radius: var(--g-rad); box-shadow: var(--g-sh);
  transition: transform .14s var(--ease-spring);
}
.bo2-obj:active { transform: scale(.99); }
.bo2-obj::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 140% at 88% -20%, rgba(231,198,114,.20), transparent 60%); }
.bo2-obj-thumb {
  position: relative; z-index: 1; width: 76px; height: 60px; flex: none; border-radius: 14px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(70% 60% at 50% 38%, rgba(231,198,114,.32), transparent 70%), linear-gradient(180deg, #FBF3DD, #F4E7C2);
  border: 1px solid var(--g-gold2); box-shadow: inset 0 1px 0 #fff;
}
.bo2-obj-thumb img { max-width: 72px; max-height: 50px; object-fit: contain; filter: drop-shadow(0 5px 7px rgba(120,80,10,.30)); }
.bo2-obj-thumb.is-cover { background: #0c0a12; border-color: var(--g-gold3); }
.bo2-obj-thumb.is-cover img { max-width: none; max-height: none; width: 100%; height: 100%; object-fit: cover; filter: none; }
.bo2-obj-body { position: relative; z-index: 1; flex: 1; min-width: 0; }
.bo2-obj-kick { display: flex; align-items: center; gap: 6px; font: 800 10px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .09em; text-transform: uppercase; color: var(--g-gold4); }
.bo2-obj-kick .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--g-gold3); box-shadow: 0 0 0 3px rgba(201,154,59,.18); }
.bo2-obj-name { font: 800 15px/1.1 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); letter-spacing: -.02em; margin: 4px 24px 9px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bo2-obj-bar { height: 9px; border-radius: 99px; background: #EFE9DA; overflow: hidden; box-shadow: inset 0 1px 2px rgba(28,26,23,.10); }
.bo2-obj-bar > i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--g-gold2), var(--g-gold3) 70%, var(--g-gold4)); box-shadow: 0 0 8px rgba(201,154,59,.5); transition: width .4s ease; }
.bo2-obj-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 7px; gap: 10px; }
.bo2-obj-meta .left { font: 600 11px/1.3 'Inter', sans-serif; color: var(--g-soft); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bo2-obj-meta .left b { color: var(--adk); }
.bo2-obj-meta .nums { flex: none; font: 700 12.5px/1 'IBM Plex Mono', monospace; color: #7a5a16; font-variant-numeric: tabular-nums; }
.bo2-obj-x { position: absolute; top: 8px; right: 8px; z-index: 2; width: 28px; height: 28px; border: 0; border-radius: 50%; background: #F2EFE7; color: var(--g-mute); font-size: 16px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.bo2-obj-x::before { content: ''; position: absolute; inset: -6px; }

/* Bouton « définir comme objectif » dans le modal */
.bo2-modal-obj { display: flex; align-items: center; justify-content: center; gap: 7px; width: calc(100% - 48px); margin: 10px 24px 0; min-height: 46px; border: 1px solid var(--g-gold2); border-radius: 14px; background: #FBF7EC; color: var(--g-gold4); font: 800 13px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer; }
.bo2-modal-obj.on { background: color-mix(in srgb, var(--a) 10%, transparent); border-color: color-mix(in srgb, var(--a) 40%, transparent); color: var(--adk); }
.bo2-modal-obj:active { transform: scale(.98); }

/* ── Section heading ── */
.bo2-sec { padding: 22px 18px 2px; display: flex; align-items: baseline; gap: 9px; }
.bo2-sec-block { display: flex; flex-direction: column; }
.bo2-sec-title { font: 800 16px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); letter-spacing: -.02em; }
.bo2-sec-sub { font: 500 12px/1.4 'Inter', sans-serif; color: var(--g-mute); margin-top: 2px; }
.bo2-sec-count { margin-left: auto; align-self: center; font: 700 11.5px/1 'Inter', sans-serif; color: var(--g-mute); }

/* Rangées horizontales (scroll-snap) — layout mockup */
.bo2-row { display: flex; gap: 13px; overflow-x: auto; padding: 12px 16px 4px; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.bo2-row::-webkit-scrollbar { display: none; }
.bo2-row > .bo2-card { flex: none; width: 158px; scroll-snap-align: start; }

/* Récompense du jour */
.bo2-daily { margin: 22px 16px 0; position: relative; overflow: hidden; display: flex; align-items: center; gap: 13px; background: linear-gradient(180deg,#FFFFFF,#FAF8F1); border: 1px dashed var(--g-gold3); border-radius: var(--g-rad); box-shadow: var(--g-sh); padding: 14px 15px; }
.bo2-daily-ico { width: 50px; height: 50px; flex: none; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: radial-gradient(60% 60% at 50% 40%, rgba(231,198,114,.4), transparent 70%), linear-gradient(180deg,#FBF3DD,#F4E7C2); border: 1px solid var(--g-gold2); box-shadow: inset 0 1px 0 #fff; }
.bo2-daily-ico img { filter: drop-shadow(0 3px 4px rgba(156,115,34,.4)); }
.bo2-daily-body { flex: 1; min-width: 0; }
.bo2-daily-kick { font: 800 9.5px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .09em; text-transform: uppercase; color: var(--g-gold4); }
.bo2-daily-title { font: 800 14px/1.15 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); margin: 3px 0; letter-spacing: -.01em; }
.bo2-daily-sub { font: 500 11px/1.5 'Inter', sans-serif; color: var(--g-soft); }
.bo2-daily-sub b { color: var(--g-ink); }
.bo2-daily-cta { flex: none; min-height: 44px; padding: 0 16px; border: none; border-radius: 12px; cursor: pointer; font: 800 12.5px/1 'Plus Jakarta Sans', sans-serif; color: #fff; background: linear-gradient(180deg,var(--a-lt),var(--a)); box-shadow: 0 3px 0 var(--adk); }
.bo2-daily-cta:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--adk); }

/* ═══ Grid (conservé pour compatibilité éventuelle) ═══ */
.bo2-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 13px; padding: 12px 16px 0; }

/* ═══ Carte produit (galerie claire) ═══ */
.bo2-card {
  /* --cg = couleur d'ambiance projetee derriere/au-dessus d'une scene en
     mode cover, teintee par la rarete (la scene parait eclairee, pas un
     carre noir brut). Surchargee par data-rarity ci-dessous. */
  --cg: rgba(255,255,255,.26);
  background: var(--g-card); border: 1px solid var(--g-line); border-radius: var(--g-rad);
  overflow: hidden; cursor: pointer; position: relative; user-select: none;
  box-shadow: var(--g-sh);
  transition: transform .14s var(--ease-spring), box-shadow .2s ease;
}
.bo2-card:active { transform: scale(.96); }
@media (hover: hover) { .bo2-card:hover { transform: translateY(-3px); box-shadow: var(--g-sh-lg); } }

/* Lueur de rareté (sous la carte) — lisible même quand le skin est en cover */
.bo2-card[data-rarity="rare"] { --cg: rgba(84,160,255,.5); box-shadow: 0 10px 26px -8px rgba(62,120,200,.36), var(--g-sh); }
.bo2-card[data-rarity="epique"] { --cg: rgba(168,107,255,.55); box-shadow: 0 12px 30px -8px rgba(124,77,216,.42), var(--g-sh); }
.bo2-card[data-rarity="legendaire"] { --cg: rgba(255,212,120,.6); border-color: var(--g-gold2); box-shadow: 0 14px 34px -8px rgba(201,154,59,.48), var(--g-sh); }

/* ── Zone preview (objet flottant sur teinte claire de rareté) ── */
.bo2-card-preview {
  position: relative; height: 120px; display: flex; align-items: center; justify-content: center;
  overflow: hidden; background: linear-gradient(180deg, #FBFAF6, #F3F0E8);
}
.bo2-card[data-rarity="rare"] .bo2-card-preview:not(.is-cover) { background: linear-gradient(180deg, #F2F6FC, #E6EFFA); }
.bo2-card[data-rarity="epique"] .bo2-card-preview:not(.is-cover) { background: linear-gradient(180deg, #F6F1FD, #ECE2FA); }
.bo2-card[data-rarity="legendaire"] .bo2-card-preview:not(.is-cover) { background: linear-gradient(180deg, #FCF5E4, #F6EAC8); }
/* halo de rareté derrière l'objet (float) */
.bo2-card[data-rarity="rare"] .bo2-card-preview:not(.is-cover)::before { content:''; position:absolute; inset:0; background: radial-gradient(60% 55% at 50% 42%, rgba(62,120,200,.16), transparent 68%); }
.bo2-card[data-rarity="epique"] .bo2-card-preview:not(.is-cover)::before { content:''; position:absolute; inset:0; background: radial-gradient(62% 58% at 50% 42%, rgba(124,77,216,.22), transparent 66%); animation: bo2EpicPulse 3.4s ease-in-out infinite; }
.bo2-card[data-rarity="legendaire"] .bo2-card-preview:not(.is-cover)::before { content:''; position:absolute; inset:0; background: radial-gradient(62% 58% at 50% 42%, rgba(201,154,59,.28), transparent 64%); }
@keyframes bo2EpicPulse { 0%,100%{opacity:.7} 50%{opacity:1} }
/* objet flottant + ombre au sol */
.bo2-card-preview img { position: relative; z-index: 2; max-width: 78%; max-height: 86px; object-fit: contain; filter: drop-shadow(0 8px 9px rgba(28,26,23,.22)); transition: transform .25s var(--ease-spring); }
.bo2-card-preview::after { content:''; position:absolute; left:50%; bottom:12px; transform:translateX(-50%); width:56%; height:13px; border-radius:50%; z-index:1; background: radial-gradient(50% 50% at 50% 50%, rgba(28,26,23,.18), transparent 72%); filter: blur(2px); }
.bo2-card:active .bo2-card-preview img { transform: scale(.93); }
@media (hover: hover) { .bo2-card:hover .bo2-card-preview img { transform: translateY(-4px) scale(1.05); } }

/* ── Mode COVER : skins = scènes opaques (voitures néon) → vitrine plein cadre ──
   La scène sombre est MISE EN SCÈNE comme dans une vitrine éclairée : halo
   d'ambiance teinté par la rareté (var --cg) qui déborde par le haut, lumière
   directionnelle, cadre cinéma (liseré interne) et vignette de pied. Fini le
   carré noir brut qui faisait « dark-mode IA ». */
.bo2-card-preview.is-cover { background: #0c0a12; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.10), inset 0 0 44px rgba(0,0,0,.55); }
.bo2-card-preview.is-cover img { max-width: none; max-height: none; width: 100%; height: 100%; object-fit: cover; filter: none; }
.bo2-card-preview.is-cover::after { display: none; }
.bo2-card-preview.is-cover::before {
  content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none;
  background:
    radial-gradient(85% 55% at 50% -12%, var(--cg), transparent 62%),
    linear-gradient(180deg, rgba(255,255,255,.16), transparent 26%),
    radial-gradient(130% 85% at 50% 125%, rgba(0,0,0,.5), transparent 60%);
}
/* Légendaire en cover : le cadre respire (aura dorée qui scintille) */
.bo2-card[data-rarity="legendaire"] .bo2-card-preview.is-cover { animation: bo2LegFrame 3.2s ease-in-out infinite; }
@keyframes bo2LegFrame {
  0%,100% { box-shadow: inset 0 0 0 1.5px rgba(255,212,120,.45), inset 0 0 44px rgba(0,0,0,.55); }
  50% { box-shadow: inset 0 0 0 1.5px rgba(255,212,120,.85), inset 0 0 44px rgba(0,0,0,.42); }
}
/* sheen légendaire (cover) */
.bo2-card[data-rarity="legendaire"] .bo2-card-preview .bo2-card-sheen {
  position: absolute; top: 0; left: -35%; width: 42%; height: 100%; z-index: 4; pointer-events: none;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,.5), transparent); transform: skewX(-18deg);
  animation: bo2Sweep 4.6s ease-in-out .8s infinite;
}

.bo2-card-preview-circle { width: 66px; height: 66px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; position: relative; z-index: 2; }

/* Étiquette de rareté */
.bo2-card-rarity-tag {
  position: absolute; top: 9px; left: 9px; z-index: 5;
  padding: 3px 8px; border-radius: 7px;
  font: 800 8.5px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .09em; text-transform: uppercase;
  background: #fff; border: 1px solid var(--g-line); color: var(--g-common);
  box-shadow: 0 2px 5px rgba(28,26,23,.10);
}
.bo2-card[data-rarity="rare"] .bo2-card-rarity-tag { color: #fff; background: var(--g-rare); border-color: var(--g-rare); }
.bo2-card[data-rarity="epique"] .bo2-card-rarity-tag { color: #fff; background: var(--g-epic); border-color: var(--g-epic); }
.bo2-card[data-rarity="legendaire"] .bo2-card-rarity-tag { color: #5e430f; background: linear-gradient(180deg, var(--g-gold1), var(--g-gold2)); border-color: var(--g-gold3); }
.bo2-card-owned-badge {
  position: absolute; top: 9px; right: 9px; z-index: 5;
  background: var(--adk); border-radius: 99px;
  padding: 3px 8px; font: 800 8.5px/1 'Plus Jakarta Sans', sans-serif; color: #fff; letter-spacing: .04em; text-transform: uppercase;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--a) 35%, transparent);
}

/* Ruban légendaire */
.bo2-legendary-ribbon { position: absolute; top: 0; right: 0; z-index: 5; width: 60px; height: 60px; overflow: hidden; pointer-events: none; }
.bo2-legendary-ribbon span {
  position: absolute; top: 12px; right: -13px; transform: rotate(45deg); transform-origin: 50% 50%;
  width: 70px; text-align: center;
  font: 800 7px/1.6 'IBM Plex Mono', monospace; letter-spacing: .06em; text-transform: uppercase;
  background: linear-gradient(180deg, var(--g-gold1), var(--g-gold2) 60%, var(--g-gold3)); color: #5e430f; padding: 2px 0;
  box-shadow: 0 1px 4px rgba(120,80,10,.35), inset 0 1px 0 rgba(255,255,255,.5);
}

.bo2-card-info { padding: 11px 12px 12px; position: relative; z-index: 1; }
.bo2-card-name { font: 700 13.5px/1.15 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); margin-bottom: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bo2-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

/* Bouton acheter — vert 3D doux + prix mono */
.bo2-card-footer .bo2-price-cell { display: inline-flex; align-items: center; gap: 5px; }
.bo2-card-footer .bo2-price-cell img { filter: drop-shadow(0 1px 1px rgba(156,115,34,.4)); }
.bo2-card-footer .bo2-price-cell b { font: 700 13.5px/1 'IBM Plex Mono', monospace; color: var(--g-ink); font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.bo2-price-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  min-height: 44px; min-width: 64px; padding: 0 14px; border: none; border-radius: 12px; cursor: pointer;
  color: #fff; font: 800 12px/1 'Plus Jakarta Sans', sans-serif; white-space: nowrap;
  background: linear-gradient(180deg, var(--a-lt), var(--a));
  box-shadow: 0 3px 0 var(--adk), 0 5px 11px color-mix(in srgb, var(--a) 24%, transparent);
  transition: transform .1s var(--ease-snap), box-shadow .1s var(--ease-snap), opacity .12s;
}
.bo2-price-btn:active { transform: translateY(3px); box-shadow: 0 0 0 var(--adk), 0 2px 5px color-mix(in srgb, var(--a) 24%, transparent); }
.bo2-price-btn:disabled { cursor: default; }
.bo2-price-btn.cant-afford { background: #EEE9DD; color: var(--g-soft); box-shadow: inset 0 0 0 1px var(--g-line); font-weight: 700; }
.bo2-price-btn.cant-afford:active { transform: none; }
.bo2-equip-cta { background: linear-gradient(180deg,#fff,#F1EEE6); color: var(--g-ink); box-shadow: 0 3px 0 #D8D2C4, inset 0 1px 0 #fff; }
.bo2-equip-cta:active { box-shadow: 0 0 0 #D8D2C4; }
.bo2-owned-txt {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  min-height: 44px; padding: 0 12px; font: 800 11.5px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--adk); background: color-mix(in srgb, var(--a) 12%, transparent); border-radius: 12px; box-shadow: inset 0 0 0 1.4px color-mix(in srgb, var(--a) 45%, transparent);
}

/* ── Intro / tuto (clair) ── */
.bo2-intro {
  position: relative; margin: 16px 16px 0; padding: 14px 16px;
  border-radius: var(--g-rad); overflow: hidden;
  display: flex; gap: 13px; align-items: flex-start;
  background: linear-gradient(150deg, color-mix(in srgb, var(--a) 10%, #fff) 0%, #fff 70%);
  border: 1px solid color-mix(in srgb, var(--a) 24%, var(--g-line));
  box-shadow: var(--g-sh);
  transition: height .26s ease, opacity .26s ease, margin .26s ease, padding .26s ease;
}
.bo2-intro.out { opacity: 0; height: 0 !important; margin-top: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
.bo2-intro-x::before { content: ''; position: absolute; inset: -7px; }
.bo2-intro-x {
  position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border: 0;
  background: #F2EFE7; color: var(--g-mute); border-radius: 50%; font-size: 17px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.bo2-intro-ico {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: 12px;
  background: var(--a); color: var(--a-ink);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 5px 14px -4px color-mix(in srgb, var(--a) 55%, transparent);
}
.bo2-intro-body { flex: 1; min-width: 0; padding-right: 24px; }
.bo2-intro-title { font: 800 14px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); margin-bottom: 8px; }
.bo2-intro-steps { display: flex; flex-direction: column; gap: 6px; }
.bo2-intro-steps span { display: flex; align-items: center; gap: 7px; font: 500 12px/1.3 'Inter', sans-serif; color: var(--g-soft); }
.bo2-intro-steps span svg { color: var(--adk); flex-shrink: 0; }

/* ═══ Detail modal (bottom-sheet clair) ═══ */
.bo2-modal-bg {
  position: fixed; inset: 0; background: rgba(28,26,23,.42); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  z-index: 500; display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0); animation: bo2FadeBg .2s ease both;
}
@keyframes bo2FadeBg { from{opacity:0} to{opacity:1} }
.bo2-modal {
  width: 100%; max-width: 480px; border-radius: 28px 28px 0 0; padding: 0 0 24px;
  background: linear-gradient(180deg, #FFFFFF 0%, #FAF7EF 100%);
  box-shadow: 0 -10px 40px rgba(28,26,23,.22);
  animation: bo2ModalUp .3s cubic-bezier(.32,.72,0,1) both;
}
@keyframes bo2ModalUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
.bo2-modal-handle { width: 36px; height: 4px; background: rgba(28,26,23,.18); border-radius: 2px; margin: 14px auto 8px; }

/* Halo preview modal (objet sur scène claire ou cover) */
.bo2-halo { height: 232px; display: flex; align-items: center; justify-content: center; position: relative; padding: 8px 24px 0; }
.bo2-halo-ring {
  width: 100%; max-width: 300px; height: 200px; border-radius: 22px; overflow: hidden;
  display: flex; align-items: center; justify-content: center; position: relative;
  background: linear-gradient(180deg, #FBFAF6, #F1EDE2); border: 1px solid var(--g-line);
}
.bo2-halo-ring::after { content:''; position:absolute; left:50%; bottom:16px; transform:translateX(-50%); width:54%; height:18px; border-radius:50%; background: radial-gradient(50% 50% at 50% 50%, rgba(28,26,23,.20), transparent 72%); filter: blur(3px); z-index:1; }
.bo2-halo-ring img { max-width: 80%; max-height: 150px; object-fit: contain; position: relative; z-index: 2; filter: drop-shadow(0 14px 16px rgba(28,26,23,.26)); }
.bo2-halo-ring.is-cover { background: #0c0a12; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.10), inset 0 0 60px rgba(0,0,0,.5); }
.bo2-halo-ring.is-cover::after { display: none; }
.bo2-halo-ring.is-cover::before {
  content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none; border-radius: 22px;
  background:
    radial-gradient(80% 55% at 50% -10%, rgba(255,212,120,.45), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,.14), transparent 24%),
    radial-gradient(130% 85% at 50% 124%, rgba(0,0,0,.5), transparent 60%);
}
.bo2-halo-ring.is-cover img { max-width: none; max-height: none; width: 100%; height: 100%; object-fit: cover; filter: none; }
.bo2-halo-ring .bo2-fallback { font-size: 76px; position: relative; z-index: 2; }
.bo2-halo-ring.legendary { border-color: var(--g-gold2); box-shadow: 0 0 0 1px var(--g-gold2), 0 14px 34px -10px rgba(201,154,59,.45); }

/* Try-before-buy */
.bo2-try-preview { margin: 0 24px 14px; border-radius: 14px; overflow: hidden; background: #fff; border: 1px solid var(--g-line); box-shadow: var(--g-sh); }
.bo2-try-preview-title { font: 700 10px/1 'IBM Plex Mono', monospace; letter-spacing: .08em; text-transform: uppercase; color: var(--g-mute); padding: 9px 12px 6px; }
.bo2-try-rank-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px 10px; border-top: 1px solid var(--g-line); }
.bo2-try-rank-num { font: 800 14px/1 'IBM Plex Mono', monospace; color: var(--g-gold3); min-width: 24px; }
.bo2-try-rank-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #F2EFE7; display: flex; align-items: center; justify-content: center; }
.bo2-try-rank-avatar img { width: 100%; height: 100%; object-fit: cover; }
.bo2-try-rank-avatar-emoji { font-size: 20px; }
.bo2-try-rank-name { flex: 1; font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); }
.bo2-try-rank-score { font: 600 12px/1 'IBM Plex Mono', monospace; color: var(--g-mute); }
.bo2-try-permis { display: flex; align-items: center; justify-content: center; padding: 10px; }
.bo2-try-permis-card { width: 180px; height: 112px; border-radius: 10px; overflow: hidden; position: relative; box-shadow: var(--g-sh); }
.bo2-try-permis-card img { width: 100%; height: 100%; object-fit: cover; }
.bo2-try-permis-badge { position: absolute; bottom: 6px; left: 8px; right: 8px; font: 700 9px/1.3 'Inter', sans-serif; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.7); }

.bo2-modal-body { padding: 8px 24px 0; text-align: center; }
.bo2-modal-pill { display: inline-block; font: 800 10px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .08em; text-transform: uppercase; padding: 5px 12px; border-radius: var(--r-full); color: #fff; margin-bottom: 10px; }
.bo2-modal-name { font: 800 26px/1.05 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); letter-spacing: -.03em; margin-bottom: 8px; }
.bo2-modal-desc { font: 500 14px/1.5 'Inter', sans-serif; color: var(--g-soft); margin-bottom: 14px; max-width: 320px; margin-left: auto; margin-right: auto; }

.bo2-modal-price { margin: 0 24px 14px; padding: 12px 16px; border-radius: 14px; background: #FBF7EC; border: 1px solid var(--g-line); display: flex; align-items: center; justify-content: space-between; }
.bo2-modal-price-label { font: 600 14px/1 'Inter', sans-serif; color: var(--g-soft); }
.bo2-modal-price-amount { display: flex; align-items: center; gap: 6px; font: 700 20px/1 'IBM Plex Mono', monospace; color: var(--g-ink); }
.bo2-modal-balance { font: 500 12px/1 'Inter', sans-serif; color: var(--g-mute); text-align: center; margin: 0 24px 14px; }

.bo2-modal-cta {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: calc(100% - 48px); margin: 0 24px; padding: 0; min-height: 56px; border: none; border-radius: 16px;
  font: 800 17px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
  transition: transform .12s var(--ease-snap), box-shadow .12s var(--ease-snap), opacity .12s;
}
.bo2-modal-cta.buy { background: linear-gradient(180deg, var(--a-lt), var(--a)); color: #fff; box-shadow: 0 5px 0 var(--adk), 0 10px 20px color-mix(in srgb, var(--a) 28%, transparent); }
.bo2-modal-cta.buy:active { transform: translateY(4px); box-shadow: 0 1px 0 var(--adk); }
.bo2-modal-cta.equip { background: linear-gradient(180deg,#fff,#F1EEE6); color: var(--g-ink); box-shadow: 0 5px 0 #D8D2C4, inset 0 1px 0 #fff; }
.bo2-modal-cta.equip:active { transform: translateY(4px); box-shadow: 0 1px 0 #D8D2C4; }
.bo2-modal-cta.locked { background: #EEE9DD; color: var(--g-mute); cursor: default; box-shadow: inset 0 0 0 1px var(--g-line); }
.bo2-modal-cancel { display: block; width: calc(100% - 48px); margin: 10px 24px 0; padding: 12px; min-height: 44px; background: none; border: none; color: var(--g-mute); font: 600 13px/1 'Inter', sans-serif; cursor: pointer; }

/* ── Note / Empty / error ── */
.bo2-note { text-align: center; color: var(--g-mute); font: 600 10.5px/1.4 'Inter', sans-serif; margin: 22px 18px 4px; }
.bo2-empty { text-align: center; padding: 56px 24px; color: var(--g-soft); }
.bo2-empty-ico { font-size: 48px; margin-bottom: 12px; color: var(--g-mute); }
.bo2-empty-t { font: 700 16px/1.3 'Plus Jakarta Sans', sans-serif; color: var(--g-ink); margin-bottom: 6px; }
.bo2-empty-d { font: 500 13px/1.5 'Inter', sans-serif; }

@keyframes bo2CardIn { from{opacity:0;transform:translateY(14px) scale(.93)} to{opacity:1;transform:none} }

/* Focus clavier visible (a11y) */
.bo2-tab:focus-visible, .bo2-price-btn:focus-visible, .bo2-equip-cta:focus-visible,
.bo2-modal-cta:focus-visible, .bo2-modal-cancel:focus-visible, .bo2-hero:focus-visible {
  outline: 2px solid var(--adk); outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important }
  .bo2-hero-obj, .bo2-hero-emoji, .bo2-hero-sheen, .bo2-card-sheen, .bo2-hero-spark { animation: none !important; transform: none !important; }
}
</style>`;

// Persiste l'avatar équipé dans profiles.avatar_url (slot 'avatar' seulement).
// Sans ça, l'équipement vit en localStorage → invisible du serveur, donc le
// classement affiche toujours l'avatar d'inscription au lieu du skin équipé.
async function syncAvatarUrlToProfile(slot, assetUrl) {
  if (slot !== "avatar") return;
  const me = getCurUser();
  if (!me) return;
  try {
    await sb
      .from("profiles")
      .update({ avatar_url: assetUrl || null })
      .eq("id", me.id);
    me.avatar_url = assetUrl || null;
  } catch (e) {
    console.warn("[boutique] sync avatar_url failed", e);
  }
}

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track("page.view", { page: "boutique" });

  // Réconciliation : un avatar équipé en local mais absent de la base (ancien
  // équipement) → on le pousse dans profiles.avatar_url pour le classement.
  const equippedAv = getEquippedAsset("avatar");
  if (equippedAv && equippedAv !== me.avatar_url)
    syncAvatarUrlToProfile("avatar", equippedAv);

  root.innerHTML = `${STYLE}
<style>
  .bo2-roue {
    display: flex; align-items: center; gap: 13px; width: 100%; text-align: left;
    margin: 0 0 16px; padding: 13px 15px; border-radius: 20px; cursor: pointer;
    color: #fff; font: inherit; text-decoration: none;
    background:
      radial-gradient(120% 90% at 88% 14%, rgba(255,180,40,.28) 0%, transparent 55%),
      linear-gradient(150deg, #33205f 0%, #241644 72%);
    border: 1px solid rgba(255,210,74,.4);
    box-shadow: 0 16px 30px -16px rgba(20,10,40,.6);
  }
  .bo2-roue-w {
    width: 58px; height: 58px; flex: none; border-radius: 50%; position: relative;
    background: conic-gradient(#ffd24a 0 45deg,#54a0ff 45deg 90deg,#b06bff 90deg 135deg,#9a93c8 135deg 180deg,#6fe016 180deg 225deg,#b06bff 225deg 270deg,#9a93c8 270deg 315deg,#54a0ff 315deg 360deg);
    border: 3px solid #ffe9a8; box-shadow: 0 4px 0 #c87d12, 0 0 16px -3px rgba(255,180,40,.7);
    animation: bo2RoueSpin 13s linear infinite;
  }
  @keyframes bo2RoueSpin { to { transform: rotate(360deg); } }
  .bo2-roue-w::after { content: ""; position: absolute; left: 50%; top: 50%; width: 16px; height: 16px; transform: translate(-50%,-50%); border-radius: 50%; background: radial-gradient(circle at 36% 30%, #fff7da, #ffd24a 60%, #ff9c1c); border: 2px solid #ffe9a8; }
  .bo2-roue-tx { flex: 1; min-width: 0; }
  .bo2-roue-t { font: 800 16.5px/1.1 'Baloo 2', cursive, sans-serif; background: linear-gradient(180deg,#fff,#ffd86b); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .bo2-roue-s { margin-top: 3px; font: 700 11.5px/1.35 'Nunito', sans-serif; color: #c3b8e8; }
  .bo2-roue-s b { color: var(--a-lt); }
  .bo2-roue-go { flex: none; font: 800 12.5px/1 'Baloo 2', cursive, sans-serif; color: #fff; padding: 9px 13px; border-radius: 12px; background: linear-gradient(180deg,var(--a-lt),var(--a)); box-shadow: 0 3px 0 var(--adk); }
  @media (prefers-reduced-motion: reduce) { .bo2-roue-w { animation: none; } }
</style>
<div class="bo2 anim-slide-up">
  ${recompensesTabs("boutique")}
  <a class="bo2-roue" href="#/roue" aria-label="${bt("roue_aria", "Ouvrir la Roue")}">
    <span class="bo2-roue-w" aria-hidden="true"></span>
    <span class="bo2-roue-tx">
      <span class="bo2-roue-t">${bt("roue_t", "La Roue")}</span>
      <span class="bo2-roue-s">${isSoloEleve(getCurUser()) ? brtl(btR("roue_s_solo", "Skins, titres et des <b>récompenses</b> à débloquer.")) : brtl(btR("roue_s", `Skins, titres et des <b>gros lots réels</b> de ton moniteur.`))}</span>
    </span>
    <span class="bo2-roue-go">${bt("roue_go", "Tour gratuit !")}</span>
  </a>
  <div class="bo2-hd">
    <div class="bo2-hd-row">
      <h1 class="bo2-hd-title" tabindex="-1">${bt("hd_title", "Boutique")}<small>${bt("hd_small", "Ton style au classement")}</small></h1>
      <div class="bo2-gems"
           id="bo2-gems-badge"
           data-volant-balance
           role="status"
           aria-live="polite"
           aria-label="${bt("balance_lab", "Ton solde :")} … ${bt("sr_volants", "volants")}">
        <span class="bo2-gems-ico">${volantImg(24)}</span>
        <span class="bo2-gems-val" id="bo2-gems-val" data-volant-count>…</span>
        <span class="bo2-gems-sr">${bt("sr_volants", "volants")}</span>
      </div>
    </div>
    <div class="bo2-tabs" id="bo2-tabs">
      ${SECTIONS.map(
        (s, i) => `
        <button class="bo2-tab ${i === 0 ? "active" : ""}" data-jump="${escAttr(s.key)}" type="button">${bt(`sec_${s.key}`, s.label)}</button>
      `,
      ).join("")}
    </div>
  </div>
  <div id="bo2-content">
    <div class="bo2-grid" style="padding:12px 16px 0">
      ${[...Array(4)].map(() => `<div class="bo2-skel" style="height:180px"></div>`).join("")}
    </div>
  </div>
</div>`;

  // Source canonique du solde : localStorage hydraté par initGameState.
  // Un fetch frais depuis profiles.gemmes est lancé en parallèle.
  let gemmes = getGemmes();
  _updateGemsBadge(root, gemmes);

  const [profileRes, itemsRes] = await Promise.allSettled([
    sb.from("profiles").select("gemmes").eq("id", me.id).maybeSingle(),
    sb.rpc("get_items_catalog"),
  ]);

  // Si le serveur renvoie un solde plus récent, on prend le serveur.
  const serverBalance = profileRes.value?.data?.gemmes;
  if (typeof serverBalance === "number") {
    gemmes = serverBalance;
    // Met à jour localStorage + notifie le header.
    localStorage.setItem("pg-gemmes", String(gemmes));
    _updateGemsBadge(root, gemmes);
  }

  const catalogFailed =
    itemsRes.status === "rejected" || !!itemsRes.value?.error;
  const allItems = itemsRes.value?.data ?? [];

  // ── Source unique du solde après achat ────────────────────────
  function applyPurchase(result, item) {
    if (!result || result.ok === false) return false;
    const fallback =
      typeof gemmes === "number" ? gemmes - item.cost_gemmes : gemmes;
    const newBalance =
      typeof result.new_balance === "number" ? result.new_balance : fallback;
    gemmes = newBalance;

    // Marque comme possédé dans la liste locale
    const target = allItems.find((i) => i.id === item.id);
    if (target) {
      target.owned = true;
      target.acquired_at = new Date().toISOString();
    }

    // Met à jour le cache localStorage ET notifie le header (event pg-gemmes-changed)
    localStorage.setItem("pg-gemmes", String(newBalance));
    window.dispatchEvent(
      new CustomEvent("pg-gemmes-changed", { detail: { balance: newBalance } }),
    );

    // Met à jour la pastille locale
    _updateGemsBadge(root, newBalance);

    // Rebond visuel sur la pastille
    const badge = root.querySelector("[data-volant-balance]");
    if (badge) bumpVolantPill(badge);

    // Objectif atteint → on le retire (le skin est obtenu)
    if (getObjectif() === item.id) setObjectif(null);

    return true;
  }

  function buyFlow(item, triggerEl) {
    showDetailModal(
      item,
      gemmes,
      me,
      async () => {
        const balanceBadge = root.querySelector("#bo2-gems-badge");
        const result = await doPurchase(item, root, allItems);
        if (applyPurchase(result, item)) {
          showGemsFloat(root, `-${item.cost_gemmes}`);
          // Reveal plein écran (priorité #1)
          showPurchaseReveal({
            item,
            balanceBadge,
            cost: item.cost_gemmes,
            onClose: () => renderAll(),
          });
        }
      },
      triggerEl,
    );
  }

  function toggleEquip(item) {
    const eq = getEquipped();
    if (eq[item.type] === item.id) {
      unequipItem(item.type);
      setEquippedAsset(item.type, null);
      syncAvatarUrlToProfile(item.type, null);
      toast(equipToast(item, false), "info");
    } else {
      equipItem(item.type, item.id);
      setEquippedAsset(item.type, item.asset_url || null);
      syncAvatarUrlToProfile(item.type, item.asset_url || null);
      toast(equipToast(item, true), "success");
    }
    // Mute seulement la carte concernée (pas de re-render global)
    _muteCard(root, item);
  }

  // Wire commun aux grilles
  function wireGrid(content) {
    content.querySelectorAll(".bo2-card").forEach((el) => {
      el.addEventListener("click", (e) => {
        haptic("select");
        const item = allItems.find((i) => i.id === el.dataset.itemId);
        if (!item) return;
        if (item.owned) {
          toggleEquip(item);
          return;
        }
        buyFlow(item, el);
      });
    });
    content.querySelectorAll(".bo2-price-btn:not(:disabled)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        haptic("select");
        const item = allItems.find(
          (i) => i.id === btn.closest(".bo2-card")?.dataset.itemId,
        );
        if (!item) return;
        if (item.owned) toggleEquip(item);
        else buyFlow(item, btn);
      });
    });
    // Hero vedette
    const hero = content.querySelector(".bo2-hero");
    if (hero) {
      const activateHero = (e) => {
        haptic("select");
        const item = allItems.find((i) => i.id === hero.dataset.itemId);
        if (!item) return;
        if (item.owned) toggleEquip(item);
        else buyFlow(item, e.currentTarget || hero);
      };
      hero.addEventListener("click", activateHero);
      hero.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateHero(e);
        }
      });
    }
  }

  // ── Scroll vertical unique — toutes les sections ─────────────
  const byRarityCost = (a, b) =>
    rm(b.rarity).order - rm(a.rarity).order || b.cost_gemmes - a.cost_gemmes;

  function renderAll() {
    const content = root.querySelector("#bo2-content");
    if (!content) return;
    if (catalogFailed) {
      content.innerHTML = `<div class="bo2-empty"><div class="bo2-empty-ico">${medallion("panneau", "orange", { size: 48 })}</div><div class="bo2-empty-t">${brtl(bt("unavailable", "« Boutique » indisponible"))}</div><div class="bo2-empty-d">${brtl(bt("check_conn", "Vérifie ta connexion, puis réessaie."))}</div></div>`;
      return;
    }

    const cats = SECTIONS.map((s) => ({
      ...s,
      items: allItems.filter(s.match).sort(byRarityCost),
    })).filter((c) => c.items.length);

    // Vedette du jour = item le plus prestigieux (légendaire / + cher) toutes catégories
    const inShop = allItems.filter((i) => SECTIONS.some((s) => s.match(i)));
    const vedette = [...inShop].sort(byRarityCost)[0] || null;

    // Objectif : épinglé (localStorage) sinon suggestion = la vedette non possédée
    const objId = getObjectif();
    let objItem = objId
      ? allItems.find((i) => i.id === objId && !i.owned)
      : null;
    const objPinned = !!objItem;
    if (!objItem && vedette && !vedette.owned) objItem = vedette;
    const objHtml = objItem
      ? renderObjectifCard(objItem, gemmes, objPinned)
      : "";

    const vedetteHtml = vedette
      ? `<div class="bo2-sec"><div class="bo2-sec-block"><div class="bo2-sec-title">${bt("vedette", "Vedette du jour")}</div><div class="bo2-sec-sub">${bt("vedette_sub", "La pièce à viser")}</div></div><span class="bo2-sec-count">${bt("selection", "✦ Sélection")}</span></div>${renderHeroCard(vedette, gemmes)}`
      : "";

    const sectionsHtml = cats
      .map(
        (c) => `
      <div class="bo2-sec" id="bo2-sec-${esc(c.key)}">
        <div class="bo2-sec-block"><div class="bo2-sec-title">${bt(`sec_${c.key}`, c.label)}</div><div class="bo2-sec-sub">${bt(`sec_${c.key}_sub`, c.sub)}</div></div>
        <span class="bo2-sec-count">${c.items.length}</span>
      </div>
      <div class="bo2-row">${c.items.map((it, idx) => renderGridCard(it, gemmes, idx)).join("")}</div>`,
      )
      .join("");

    content.innerHTML = `
      ${objHtml}
      ${renderIntro()}
      ${vedetteHtml}
      ${sectionsHtml}
      ${renderDailyCard()}
      <div class="bo2-note">${brtl(bt("note", "Les skins sont 100 % cosmétiques : du style, jamais d’avantage."))}</div>`;

    wireGrid(content);
    wireIntro(content);
    _scanCovers(content);

    // CTA "Réviser" de la récompense du jour
    content.querySelector("[data-go-revise]")?.addEventListener("click", () => {
      haptic("tap");
      location.hash = "#/parcours";
    });

    // Carte objectif : clic = ouvre l'item, × = retire (si épinglé)
    const objEl = content.querySelector(".bo2-obj");
    if (objEl) {
      objEl.querySelector("[data-obj-x]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        haptic("tap");
        setObjectif(null);
        toast(btR("obj_removed", "Objectif retiré"), "info");
        renderAll();
      });
      const activateObj = () => {
        haptic("select");
        const it = allItems.find((i) => i.id === objEl.dataset.itemId);
        if (!it) return;
        if (it.owned) toggleEquip(it);
        else buyFlow(it, objEl);
      };
      objEl.addEventListener("click", activateObj);
      objEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateObj();
        }
      });
    }
  }

  // Wishlist : re-render quand l'objectif change depuis le modal détail
  _activeRerender = () => renderAll();
  _ensureObjListener();

  renderAll();

  // Chips = navigation : scroll vers la section
  root.querySelector("#bo2-tabs")?.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-jump]");
    if (!chip) return;
    haptic("tap");
    root
      .querySelectorAll(".bo2-tab")
      .forEach((b) => b.classList.toggle("active", b === chip));
    root
      .querySelector(`#bo2-sec-${chip.dataset.jump}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// ─── Mise à jour pastille solde ───────────────────────────────
function _updateGemsBadge(root, balance) {
  const val = root.querySelector("#bo2-gems-val");
  if (val) val.textContent = balance;
  const badge = root.querySelector("#bo2-gems-badge");
  if (badge) {
    badge.setAttribute(
      "aria-label",
      getLang() === "fr"
        ? `Ton solde : ${balance} volant${balance <= 1 ? "" : "s"}`
        : `${btR("balance_lab", "Ton solde :")} ${balance} ${volantWord(balance, getLang())}`,
    );
  }
}

// ─── Hero vedette — vitrine showroom ─────────────────────────
function renderHeroCard(item, gemmes) {
  const r = rm(item.rarity);
  const canAfford = gemmes >= item.cost_gemmes;
  const pct = Math.min(100, Math.round((gemmes / item.cost_gemmes) * 100));
  const lacking = item.cost_gemmes - gemmes;
  const isOwned = item.owned;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;
  const isLeg = item.rarity === "legendaire";

  const objHtml = item.asset_url
    ? `<img class="bo2-hero-obj" src="${escAttr(item.asset_url)}" alt="${escAttr(iName(item))}" loading="lazy">`
    : `<span class="bo2-hero-emoji">${_typeMed(item.type, 72)}</span>`;

  // Pied droit : à acheter (prix + CTA) / débloqué / équipé
  let footRight = "";
  let progHtml = "";
  if (!isOwned) {
    footRight = `<div class="bo2-hero-buy">
        <div class="bo2-hero-price">${volantImg(20)} <b>${item.cost_gemmes}</b></div>
        <button class="bo2-hero-cta" tabindex="-1">${canAfford ? bt("buy", "Acheter") : bt("see", "Voir")}</button>
      </div>`;
    progHtml = `<div class="bo2-hero-prog-wrap">
        <div class="bo2-hero-prog-label">${canAfford ? bt("can_afford", "Tu peux l’acheter !") : esc(stillVolants(lacking))}</div>
        <div class="bo2-hero-prog-track"><div class="bo2-hero-prog-bar" style="width:${pct}%"></div></div>
      </div>`;
  } else {
    footRight = `<div class="bo2-hero-buy"><div class="bo2-hero-owned">${isEquipped ? bt("equipped", "✓ Équipé") : bt("tap_equip", "Touche pour équiper")}</div></div>`;
  }

  return `
    <div class="bo2-hero" data-item-id="${escAttr(item.id)}" data-rarity="${escAttr(item.rarity)}" role="button" tabindex="0" aria-label="${escAttr(iName(item))}, ${escAttr(rLabel(item))}, ${isOwned ? (isEquipped ? btR("aria_equipped", "équipé") : btR("aria_unlocked", "débloqué")) : canAfford ? btR("aria_buy", "acheter") : btR("aria_not_enough", "pas assez de volants")}">
      <span class="bo2-hero-tag">${isLeg ? "★ " : ""}${esc(rLabel(item))}</span>
      <span class="bo2-hero-spark s1" aria-hidden="true"></span>
      <span class="bo2-hero-spark s2" aria-hidden="true"></span>
      <div class="bo2-hero-stage" data-prev>
        <span class="bo2-hero-sheen" aria-hidden="true"></span>
        ${objHtml}
      </div>
      <div class="bo2-hero-foot">
        <div class="bo2-hero-body">
          <div class="bo2-hero-name">${brtl(esc(iName(item)))}</div>
          <div class="bo2-hero-sub"><span class="lab">${esc(rLabel(item))}</span>${item.description ? brtl(esc(iDesc(item))) : brtl(bt("hero_sub_default", "Ta signature au classement"))}</div>
          ${progHtml}
        </div>
        ${footRight}
      </div>
    </div>`;
}

// ─── Tuto / intro ─────────────────────────────────────────────
const INTRO_KEY = "pg-boutique-intro-seen";
function introSeen() {
  try {
    return localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}
function renderIntro() {
  if (introSeen()) return "";
  return `
    <div class="bo2-intro" id="bo2-intro">
      <button class="bo2-intro-x" id="bo2-intro-x" type="button" aria-label="${escAttr(btR("intro_x", "J’ai compris"))}">×</button>
      <div class="bo2-intro-ico" style="background:transparent;box-shadow:none">${medallion("voiture", "blue", { size: 40 })}</div>
      <div class="bo2-intro-body">
        <div class="bo2-intro-title">${brtl(bt("intro_title", "Ta voiture, ta signature"))}</div>
        <div class="bo2-intro-steps">
          <span>${icon("users", { size: 13 })} ${brtl(bt("intro_1", "Elle s’affiche à côté de ton nom au classement"))}</span>
          <span>${volantImg(14)} ${brtl(bt("intro_2", "Débloque des skins avec tes volants"))}</span>
          <span>${icon("check", { size: 13, strokeWidth: 3 })} ${brtl(bt("intro_3", "Touche un skin pour l’équiper en 1 tap"))}</span>
        </div>
      </div>
    </div>`;
}
function wireIntro(content) {
  content.querySelector("#bo2-intro-x")?.addEventListener("click", () => {
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignore */
    }
    const el = content.querySelector("#bo2-intro");
    if (el) {
      el.style.height = el.offsetHeight + "px";
      requestAnimationFrame(() => el.classList.add("out"));
      setTimeout(() => el.remove(), 280);
    }
  });
}

// ─── Grid card ────────────────────────────────────────────────
function renderGridCard(item, gemmes, idx) {
  const r = rm(item.rarity);
  const canAfford = gemmes >= item.cost_gemmes;
  const imgUrl = item.asset_url ?? null;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;

  const lacking = item.cost_gemmes - gemmes;
  const preview = imgUrl
    ? `<img src="${escAttr(imgUrl)}" alt="${escAttr(iName(item))}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` +
      `<div class="bo2-card-preview-circle" style="display:none">${_typeMed(item.type, 60)}</div>`
    : `<div class="bo2-card-preview-circle">${_typeMed(item.type, 60)}</div>`;

  const legendaryRibbon =
    item.rarity === "legendaire"
      ? `<div class="bo2-legendary-ribbon" aria-hidden="true"><span>${bt("ribbon", "Légend.")}</span></div>`
      : "";
  const legendarySheen =
    item.rarity === "legendaire"
      ? `<span class="bo2-card-sheen" aria-hidden="true"></span>`
      : "";

  let footer;
  if (item.owned) {
    footer = isEquipped
      ? `<span class="bo2-owned-txt" style="flex:1">${icon("check", { size: 13, strokeWidth: 3 })} ${bt("equipped_short", "Équipé")}</span>`
      : `<span class="bo2-price-cell" style="color:var(--g-mute);font:700 11.5px/1 'Plus Jakarta Sans',sans-serif">${bt("owned_lab", "Possédé")}</span><button class="bo2-price-btn bo2-equip-cta">${bt("equip_btn", "Équiper")}</button>`;
  } else {
    footer = `<span class="bo2-price-cell">${volantImg(16)} <b>${item.cost_gemmes}</b></span><button class="bo2-price-btn ${canAfford ? "" : "cant-afford"}" ${!canAfford ? "disabled" : ""}>${canAfford ? bt("buy", "Acheter") : `−${lacking}`}</button>`;
  }

  return `
    <div class="bo2-card" data-item-id="${escAttr(item.id)}" data-rarity="${escAttr(item.rarity)}"
      style="animation: bo2CardIn .4s ${idx * 60}ms cubic-bezier(.34,1.56,.64,1) both">
      <div class="bo2-card-preview" data-prev>
        <span class="bo2-card-rarity-tag">${esc(rLabel(item))}</span>
        ${legendaryRibbon}${legendarySheen}
        ${preview}
        ${item.owned ? `<div class="bo2-card-owned-badge">${bt("unlocked_badge", "Débloqué")}</div>` : ""}
      </div>
      <div class="bo2-card-info">
        <div class="bo2-card-name">${brtl(esc(iName(item)))}</div>
        <div class="bo2-card-footer">${footer}</div>
      </div>
    </div>`;
}

// ─── Médaillon 3D de secours par type (quand l'item n'a pas d'asset_url) ──
// Un seul langage visuel pour les 3 fonds : la pièce premium remplace à la
// fois les anciens SVG stroke (#8) ET les emoji nus. Glyphe/rampe par type :
//   avatar (voiture) → voiture/bleu · theme (palette) → crayon/rose
//   permis_bg (carte) → carte/teal · autre → cadeau/rose
const _TYPE_MED = {
  avatar: ["voiture", "blue"],
  theme: ["crayon", "pink"],
  permis_bg: ["carte", "teal"],
};
function _typeMed(type, size) {
  const [glyph, ramp] = _TYPE_MED[type] || ["cadeau", "pink"];
  return medallion(glyph, ramp, { size });
}

// ─── Détection d'opacité du skin ──────────────────────────────
// Certains skins (voitures) sont des scènes NÉON opaques (fond noir incrusté) ;
// d'autres (persos) sont transparents. Sur le thème clair, un asset opaque
// affiché « contain » = un carré noir dégueu qui flotte. On détecte l'opacité
// au chargement (alpha des 4 coins via canvas) → les opaques passent en mode
// « cover » plein cadre (la scène devient une vraie vitrine encadrée), les
// transparents restent flottants sur la teinte claire de rareté.
const _opaqueCache = new Map();
function _applyCover(img) {
  if (!img) return;
  const zone = img.closest("[data-prev]");
  if (!zone) return;
  const url = img.currentSrc || img.src || "";
  const set = (opaque) => zone.classList.toggle("is-cover", opaque);
  if (_opaqueCache.has(url)) return set(_opaqueCache.get(url));
  const probe = () => {
    if (!img.naturalWidth) return; // image cassée → reste flottant
    let opaque = true;
    try {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 20;
      const cx = cv.getContext("2d", { willReadFrequently: true });
      cx.drawImage(img, 0, 0, 20, 20);
      const pts = [
        [1, 1],
        [18, 1],
        [1, 18],
        [18, 18],
      ];
      opaque = pts.every(([x, y]) => cx.getImageData(x, y, 1, 1).data[3] > 248);
    } catch {
      opaque = false; // canvas indisponible/teinté → on garde le mode flottant
    }
    _opaqueCache.set(url, opaque);
    set(opaque);
  };
  if (img.complete && img.naturalWidth) probe();
  else img.addEventListener("load", probe, { once: true });
}
function _scanCovers(root) {
  if (!root) return;
  root.querySelectorAll("[data-prev] img").forEach(_applyCover);
}

// ─── Objectif épinglé (wishlist) ──────────────────────────────
// Stocké en localStorage : c'est une préférence perso (quel skin tu vises),
// pas une donnée serveur → zéro migration. La barre se remplit avec ton solde
// de volants, qui se gagne en révisant → le désir cosmétique tire la révision.
const OBJ_KEY = "pg-boutique-objectif";
function getObjectif() {
  try {
    return localStorage.getItem(OBJ_KEY) || null;
  } catch {
    return null;
  }
}
function setObjectif(id) {
  try {
    if (id) localStorage.setItem(OBJ_KEY, id);
    else localStorage.removeItem(OBJ_KEY);
  } catch {
    /* ignore */
  }
}
// Re-render de l'onglet courant quand l'objectif change depuis le modal.
// Un seul listener window (posé une fois) → pas de fuite au remount de la page.
let _activeRerender = null;
let _objListenerSet = false;
function _ensureObjListener() {
  if (_objListenerSet) return;
  _objListenerSet = true;
  window.addEventListener("pg-objectif-changed", () => {
    try {
      _activeRerender?.();
    } catch {
      /* ignore */
    }
  });
}

// Démontage (appelé par le router avant de monter la page suivante) : oublie le
// re-render de la page démontée — le listener global « pg-objectif-changed »
// ne doit ni rappeler ni retenir en mémoire un DOM déjà retiré.
export function unmount() {
  _activeRerender = null;
}

function renderObjectifCard(item, gemmes, pinned = true) {
  const r = rm(item.rarity);
  const pct = Math.min(100, Math.round((gemmes / item.cost_gemmes) * 100));
  const lacking = item.cost_gemmes - gemmes;
  const ready = gemmes >= item.cost_gemmes;
  const imgHtml = item.asset_url
    ? `<img src="${escAttr(item.asset_url)}" alt="" aria-hidden="true">`
    : `<span aria-hidden="true">${_typeMed(item.type, 44)}</span>`;
  const kickerLabel = `${esc(rLabel(item))} · ${pinned ? btR("obj_kick_pin", "Ton objectif") : btR("obj_kick_aim", "À viser")}`;
  const closeBtn = pinned
    ? `<button class="bo2-obj-x" data-obj-x type="button" aria-label="${escAttr(btR("obj_x", "Retirer l’objectif"))}">×</button>`
    : "";
  return `
    <div class="bo2-obj" data-item-id="${escAttr(item.id)}" role="button" tabindex="0" aria-label="${escAttr(btR("obj_aria", "Objectif :"))} ${escAttr(iName(item))}, ${ready ? escAttr(btR("obj_can_buy", "tu peux l’acheter")) : escAttr(stillVolants(lacking))}">
      ${closeBtn}
      <div class="bo2-obj-thumb" data-prev>${imgHtml}</div>
      <div class="bo2-obj-body">
        <div class="bo2-obj-kick"><span class="dot"></span>${kickerLabel}</div>
        <div class="bo2-obj-name">${ready ? brtl(bt("obj_reached", "Objectif atteint !")) : brtl(esc(stillVolants(lacking)))}</div>
        <div class="bo2-obj-bar"><i style="width:${pct}%"></i></div>
        <div class="bo2-obj-meta">
          <span class="left">${ready ? `<b>${esc(iName(item))}</b> ${btR("obj_touch", "— touche pour l’avoir")}` : btR("obj_earn", "Gagné en <b>révisant</b>")}</span>
          <span class="nums">${gemmes} / ${item.cost_gemmes}</span>
        </div>
      </div>
    </div>`;
}

function renderDailyCard() {
  return `
    <div class="bo2-daily">
      <div class="bo2-daily-ico">${volantImg(34)}</div>
      <div class="bo2-daily-body">
        <div class="bo2-daily-kick">${bt("daily_kick", "Récompense en révisant")}</div>
        <div class="bo2-daily-title">${brtl(bt("daily_title", "Gagne des volants chaque jour"))}</div>
        <div class="bo2-daily-sub">${brtl(btR("daily_sub", "Chaque session de révision terminée crédite ton solde. <b>Pas de raccourci.</b>"))}</div>
      </div>
      <button class="bo2-daily-cta" type="button" data-go-revise>${bt("daily_cta", "Réviser")}</button>
    </div>`;
}

// ─── Gem float animation ──────────────────────────────────────
function showGemsFloat(root, text) {
  const badge = root.querySelector("#bo2-gems-badge");
  if (!badge) return;
  const el = document.createElement("div");
  el.className = "bo2-gems-float";
  el.textContent = text;
  badge.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ─── Mute ciblé de la carte après équipement (sans re-render global) ─
function _muteCard(root, item) {
  const card = root.querySelector(
    `.bo2-card[data-item-id="${CSS.escape(item.id)}"]`,
  );
  if (!card) return;
  const isEquipped = getEquipped()[item.type] === item.id;
  const footer = card.querySelector(".bo2-card-footer");
  if (!footer) return;
  if (isEquipped) {
    footer.innerHTML = `<div class="bo2-owned-txt">${icon("check", { size: 13, strokeWidth: 3 })} ${bt("equipped_short", "Équipé")}</div>`;
  } else {
    footer.innerHTML = `<button class="bo2-price-btn bo2-equip-cta">${bt("equip_btn", "Équiper")}</button>`;
    // Re-wire le bouton équiper
    footer.querySelector(".bo2-equip-cta")?.addEventListener("click", (e) => {
      e.stopPropagation();
      haptic("select");
      toggleEquipLocal(item, root);
    });
  }
}

// toggleEquip inline pour le re-wire post-mute
function toggleEquipLocal(item, root) {
  const eq = getEquipped();
  if (eq[item.type] === item.id) {
    unequipItem(item.type);
    setEquippedAsset(item.type, null);
    syncAvatarUrlToProfile(item.type, null);
    toast(equipToast(item, false), "info");
  } else {
    equipItem(item.type, item.id);
    setEquippedAsset(item.type, item.asset_url || null);
    syncAvatarUrlToProfile(item.type, item.asset_url || null);
    toast(equipToast(item, true), "success");
  }
  _muteCard(root, item);
}

// ─── Detail modal (bottom-sheet) ─────────────────────────────
function showDetailModal(item, gemmes, me, onConfirm, triggerEl) {
  if (document.querySelector(".bo2-modal-bg")) return; // une seule modale à la fois
  const r = rm(item.rarity);
  const afterBalance = gemmes - item.cost_gemmes;
  const canAfford = afterBalance >= 0;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;

  const imgUrl = item.asset_url ?? null;
  const halo = imgUrl
    ? `<img src="${escAttr(imgUrl)}" alt="${escAttr(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="bo2-fallback" style="display:none">${_typeMed(item.type, 96)}</span>`
    : `<span class="bo2-fallback">${_typeMed(item.type, 96)}</span>`;

  // Try-before-buy : contexte visuel selon le type (#5)
  const tryPreview = _renderTryPreview(item, me);

  // Bloc prix consolidé (un seul affichage — #8)
  const priceBlock = item.owned
    ? ""
    : `<div class="bo2-modal-price">
        <span class="bo2-modal-price-label">${bt("price", "Prix")}</span>
        <span class="bo2-modal-price-amount">${volantImg(16)} ${item.cost_gemmes}</span>
      </div>`;

  let cta,
    balanceLine = "";
  if (item.owned) {
    cta = `<button class="bo2-modal-cta equip" id="bo2-cta">${isEquipped ? bt("equipped_remove", "✓ Équipé — retirer") : bt("equip_btn", "Équiper")}</button>`;
  } else if (canAfford) {
    cta = `<button class="bo2-modal-cta buy" id="bo2-cta">${bt("buy", "Acheter")} — ${item.cost_gemmes} ${volantImg(14)}</button>`;
    balanceLine = `<div class="bo2-modal-balance">${brtl(afterBuyLine(afterBalance))}</div>`;
  } else {
    cta = `<button class="bo2-modal-cta locked" id="bo2-cta" disabled>${icon("lock", { size: 14 })} ${bt("not_enough", "Pas assez de volants")}</button>`;
    balanceLine = `<div class="bo2-modal-balance" style="color:#f87171">${brtl(missingLine(item.cost_gemmes - gemmes))}</div>`;
  }

  const isLegendary = item.rarity === "legendaire";
  const haloRingClass = `bo2-halo-ring${isLegendary ? " legendary" : ""}`;

  const html = `
    <div class="bo2-modal" role="document">
      <div class="bo2-modal-handle" aria-hidden="true"></div>
      <div class="bo2-halo">
        <div class="${haloRingClass}" data-prev>
          ${halo}
        </div>
      </div>
      <div class="bo2-modal-body">
        <div class="bo2-modal-pill" style="background:${esc(r.c)};color:${item.rarity === "legendaire" ? "#5e430f" : "#fff"}" id="bo2-modal-title">${esc(rLabel(item))}</div>
        <div class="bo2-modal-name">${brtl(esc(iName(item)))}</div>
        ${item.description ? `<div class="bo2-modal-desc">${brtl(esc(iDesc(item)))}</div>` : ""}
      </div>
      ${tryPreview}
      ${priceBlock}
      ${balanceLine}
      ${cta}
      ${item.owned ? "" : `<button class="bo2-modal-obj ${getObjectif() === item.id ? "on" : ""}" id="bo2-obj-toggle" type="button">${getObjectif() === item.id ? btR("obj_on", "✓ C’est ton objectif") : btR("obj_off", "🎯 Définir comme objectif")}</button>`}
      <button class="bo2-modal-cancel" id="bo2-modal-cancel">${bt("close", "Fermer")}</button>
    </div>`;

  const { overlay, close } = openBottomSheet({
    bgClass: "bo2-modal-bg",
    sheetSelector: ".bo2-modal",
    html,
    labelledBy: "bo2-modal-title",
    triggerEl,
  });
  track("boutique.detail_opened", { item_id: item.id });
  _scanCovers(overlay);
  overlay.querySelector("#bo2-modal-cancel")?.addEventListener("click", close);

  // Wishlist : définir / retirer l'objectif depuis le modal détail
  overlay.querySelector("#bo2-obj-toggle")?.addEventListener("click", () => {
    const nowOn = getObjectif() !== item.id;
    setObjectif(nowOn ? item.id : null);
    const b = overlay.querySelector("#bo2-obj-toggle");
    if (b) {
      b.classList.toggle("on", nowOn);
      b.textContent = nowOn
        ? btR("obj_on", "✓ C’est ton objectif")
        : btR("obj_off", "🎯 Définir comme objectif");
    }
    haptic("tap");
    toast(
      nowOn
        ? btR("obj_set", "Objectif défini — gagne des volants en révisant !")
        : btR("obj_removed", "Objectif retiré"),
      nowOn ? "success" : "info",
    );
    window.dispatchEvent(new CustomEvent("pg-objectif-changed"));
  });

  const ctaBtn = overlay.querySelector("#bo2-cta");
  if (ctaBtn && !ctaBtn.disabled) {
    ctaBtn.addEventListener("click", async () => {
      if (item.owned) {
        // Équiper / retirer directement depuis le modal
        const eq = getEquipped();
        if (eq[item.type] === item.id) {
          unequipItem(item.type);
          setEquippedAsset(item.type, null);
          syncAvatarUrlToProfile(item.type, null);
          toast(equipToast(item, false), "info");
        } else {
          equipItem(item.type, item.id);
          setEquippedAsset(item.type, item.asset_url || null);
          syncAvatarUrlToProfile(item.type, item.asset_url || null);
          toast(equipToast(item, true), "success");
        }
        overlay.remove();
        window.dispatchEvent(
          new CustomEvent("pg-equipped-changed", {
            detail: { slot: item.type, itemId: item.id },
          }),
        );
        return;
      }
      overlay.remove();
      await onConfirm();
    });
  }
}

// ─── Try-before-buy : contexte visuel par type (#5) ───────────
function _renderTryPreview(item, me) {
  if (!item.asset_url) return "";
  const pseudoEsc = esc(
    me?.display_name || me?.email?.split("@")[0] || btR("me_fallback", "Toi"),
  );

  if (item.type === "avatar") {
    // Fausse ligne de classement avec le skin équipé
    return `
      <div class="bo2-try-preview">
        <div class="bo2-try-preview-title">${brtl(bt("try_rank", "Ton skin dans le classement"))}</div>
        <div class="bo2-try-rank-row">
          <div class="bo2-try-rank-num">1</div>
          <div class="bo2-try-rank-avatar">
            <img src="${escAttr(item.asset_url)}" alt="" aria-hidden="true">
          </div>
          <div class="bo2-try-rank-name">${pseudoEsc}</div>
          <div class="bo2-try-rank-score">1 250 pts</div>
        </div>
      </div>`;
  }

  if (item.type === "permis_bg") {
    // Mini permis virtuel avec ce fond appliqué
    return `
      <div class="bo2-try-preview">
        <div class="bo2-try-preview-title">${brtl(bt("try_permis", "Aperçu sur ton permis"))}</div>
        <div class="bo2-try-permis">
          <div class="bo2-try-permis-card">
            <img src="${escAttr(item.asset_url)}" alt="" aria-hidden="true">
            <div class="bo2-try-permis-badge">${pseudoEsc}</div>
          </div>
        </div>
      </div>`;
  }

  return "";
}

// ─── Execute purchase ─────────────────────────────────────────
async function doPurchase(item) {
  try {
    const { data, error } = await sb.rpc("purchase_item", {
      p_item_id: item.id,
    });
    if (error) {
      toast(btR("buy_fail", "Achat impossible. Réessaie."), "error");
      return null;
    }
    if (data?.error === "insufficient_gemmes") {
      toast("Pas assez de volants", "error");
      return null;
    }
    if (data?.error === "already_owned") {
      toast(btR("already_owned", "Déjà dans ton inventaire"), "info");
      return null;
    }
    if (data?.error) {
      toast(btR("buy_fail", "Achat impossible. Réessaie."), "error");
      return null;
    }
    haptic("success");

    // Auto-équipement de l'item acheté
    try {
      equipItem(item.type, item.id);
      setEquippedAsset(item.type, item.asset_url || null);
      syncAvatarUrlToProfile(item.type, item.asset_url || null);
    } catch (eqErr) {
      console.warn("[boutique] auto-equip failed", eqErr);
    }

    track("boutique.item_purchased", {
      item_id: item.id,
      cost: item.cost_gemmes,
    });
    return data;
  } catch (e) {
    console.error("[boutique] purchase", e);
    toast(btR("buy_fail", "Achat impossible. Réessaie."), "error");
    return null;
  }
}
