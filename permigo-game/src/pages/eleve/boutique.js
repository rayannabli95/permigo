// ═══════════════════════════════════════════════════════════════
// Élève — Boutique (refonte « Ton objectif », DA PermiGo / typo WHOOP)
// RPCs : get_items_catalog() · purchase_item(p_item_id)
//
// UN écran = UNE accroche (l'objectif visé) + LE catalogue. Les filtres
// filtrent vraiment (avant : ils faisaient défiler la page).
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
import {
  openBottomSheet,
  trustedBottomSheetHtml,
} from "@/components/common/bottom-sheet.js";
import { volantImg } from "@/utils/volant.js";
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
// Certaines clés ne servent plus (fonds de permis, thèmes, vedette du jour,
// tutoriel, récompense du jour) : gardées telles quelles, elles resserviront
// si ces rayons reviennent. Une clé non utilisée ne coûte rien.
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
    roue_s_solo: "Skins · titles · <b>rewards</b> to unlock.",
    roue_s: "Skins · titles · <b>real big prizes</b> from your instructor.",
    roue_go: "Free spin!",
    hd_title: "Shop",
    hd_small: "Your style on the leaderboard",
    balance_lab: "Your balance:",
    sr_volants: "steering wheels",
    unavailable: "“Shop” unavailable",
    check_conn: "Check your connection. Try again.",
    vedette: "Star of the day",
    vedette_sub: "The piece to aim for",
    selection: "✦ Selection",
    note: "Skins are 100% cosmetic: style and never an advantage.",
    obj_removed: "Objective removed",
    obj_set: "Objective set. Earn steering wheels by revising!",
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
    intro_title: "Your car. Your signature.",
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
    obj_touch: "tap to get it",
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
    equipped_remove: "Remove",
    obj_on: "✓ This is your goal",
    obj_off: "🎯 Set as goal",
    close: "Close",
    try_rank: "Your skin on the leaderboard",
    try_permis: "Preview on your licence",
    me_fallback: "You",
    missing_short: "Missing",
    pin_set: "Set as goal",
    pin_unset: "Remove goal",
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
    note: "الأشكال تجميلية 100% : أناقة فقط ولا أفضلية أبدًا.",
    obj_removed: "أُزيل الهدف",
    obj_set: "حُدّد الهدف. اربح مقاود بالمراجعة!",
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
    intro_title: "سيارتك. توقيعك.",
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
    obj_touch: "المس للحصول عليه",
    obj_earn: "يُربح <b>بالمراجعة</b>",
    obj_aria: "الهدف:",
    obj_can_buy: "يمكنك شراؤه",
    obj_x: "أزل الهدف",
    daily_kick: "مكافأة بالمراجعة",
    daily_title: "اربح مقاود كل يوم",
    daily_sub: "كل جلسة مراجعة مكتملة تُضاف إلى رصيدك. <b>لا اختصارات.</b>",
    daily_cta: "راجع",
    price: "السعر",
    equipped_remove: "أزِل",
    obj_on: "✓ هذا هدفك",
    obj_off: "🎯 حدّده هدفًا",
    close: "إغلاق",
    try_rank: "شكلك في التصنيف",
    try_permis: "معاينة على رخصتك",
    me_fallback: "أنت",
    missing_short: "ينقص",
    pin_set: "حدّده هدفًا",
    pin_unset: "أزل الهدف",
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
// Sections = les 2 filtres. Voiture vs Personnage = distinction par asset_url
// (les voitures ont '/car-' dans l'URL ; tout le reste des avatars = perso).
//
// On ne vend QUE ce que les autres voient : la voiture et le personnage
// s'affichent à côté du nom au classement.
const SECTIONS = [
  {
    key: "voitures",
    label: "Voitures",
    match: (i) => i.type === "avatar" && /\/car-/.test(i.asset_url || ""),
  },
  {
    key: "persos",
    label: "Persos",
    match: (i) => i.type === "avatar" && !/\/car-/.test(i.asset_url || ""),
  },
];
// ⚠️ Deux familles restent VOLONTAIREMENT hors rayon (décisions Rayan du
// 30/07/2026) — ne pas les remettre par réflexe :
//   · 'theme' (couleurs) — applyThemeColor() ne repeint que 3 des 5 tokens
//     d'accent, donc l'app ressort bicolore. À corriger dans game-state.js
//     AVANT toute remise en vente. Deux comptes en possèdent un, achetés avant.
//   · 'permis_bg' (fonds de permis) — la carte de permis ne se voit que sur sa
//     propre page Profil : personne d'autre ne la regarde. À reproposer
//     autrement plus tard.

// Rareté — une seule échelle, celle de l'accent PermiGo (gris → violet foncé).
// Avant : bleu + violet + magenta + or se battaient sur la même carte.
const RARITY_META = {
  commun: { label: "Commun", tone: 1, order: 0 },
  rare: { label: "Rare", tone: 2, order: 1 },
  epique: { label: "Épique", tone: 3, order: 2 },
  legendaire: { label: "Légendaire", tone: 4, order: 3 },
};

function rm(rarity) {
  return RARITY_META[rarity] ?? RARITY_META.commun;
}

// ─── CSS ──────────────────────────────────────────────────────
// Typo « WHOOP » : Archivo en display (titres + étiquettes en capitales
// espacées), Inter en courant, chiffres alignés (tabular-nums), rayons secs.
//
// ⚠️ Les accents sont DÉRIVÉS de --a par color-mix, jamais lus dans --a-lt /
// --a-txt : applyThemeColor() ne repose que --a / --adk / --ap, donc un élève
// qui a acheté le thème cyan garderait sinon des dégradés violets.
const STYLE = `<style>
/* La fiche détail est portée dans <body> (hors de .bo3) : sans ce second
   sélecteur, elle perdrait toutes les variables ci-dessous. */
.bo3, .bo3-modal-bg {
  --acc: var(--a);
  --acc-dk: var(--adk);
  --acc-lt: color-mix(in srgb, var(--a) 74%, #fff);
  --acc-txt: color-mix(in srgb, var(--a) 58%, #000);
  --acc-soft: color-mix(in srgb, var(--a) 9%, transparent);
  --f-d: 'Archivo', system-ui, sans-serif;
  --f-b: 'Archivo', system-ui, sans-serif;
}
.bo3 {
  max-width: 480px; margin: 0 auto; padding: 0 0 110px; min-height: 100dvh;
  font-family: var(--f-b); color: var(--ink);
  font-variant-numeric: tabular-nums;
  -webkit-tap-highlight-color: transparent;
}
[data-theme="dark"] .bo3, [data-theme="dark"] .bo3-modal-bg { --acc-txt: color-mix(in srgb, var(--a) 74%, #fff); }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]):not([data-theme="light"]) .bo3,
  :root:not([data-theme]):not([data-theme="light"]) .bo3-modal-bg { --acc-txt: color-mix(in srgb, var(--a) 74%, #fff); }
}

/* ── Squelette ── */
.bo3-skel {
  background: linear-gradient(90deg, var(--bo2) 0%, var(--su) 50%, var(--bo2) 100%);
  background-size: 200% 100%; animation: bo3Shim 1.4s ease-in-out infinite; border-radius: 14px;
}
@keyframes bo3Shim { from { background-position: 200% 0 } to { background-position: -200% 0 } }

/* ── Entête ──
   Pas de pastille de solde ici : le bandeau de l'app en affiche déjà une,
   à 60 px au-dessus. L'ancienne boutique montrait le même chiffre deux fois. */
.bo3-hd { padding: 4px 16px 0; }
.bo3-hd h1 { margin: 0; font: 800 27px/1 var(--f-d); letter-spacing: -.02em; text-transform: uppercase; color: var(--ink); }
.bo3-hd p { margin: 6px 0 0; font: 500 12px/1.3 var(--f-b); color: var(--mu); }

/* ── L'unique accroche : l'objectif ── */
.bo3-goal {
  position: relative; overflow: hidden; margin: 16px 16px 0; padding: 15px;
  display: flex; gap: 13px; align-items: center; cursor: pointer; color: #fff;
  border: 0; width: calc(100% - 32px); text-align: left; border-radius: 16px;
  background:
    radial-gradient(120% 110% at 88% -10%, color-mix(in srgb, var(--acc) 55%, transparent), transparent 60%),
    linear-gradient(155deg, var(--acc-dk), color-mix(in srgb, var(--acc-dk) 45%, #120f2e));
  transition: transform .14s var(--ease-spring);
}
.bo3-goal:active { transform: scale(.99); }
.bo3-goal-th { width: 76px; height: 76px; flex: none; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; }
.bo3-goal-th img { max-width: 100%; max-height: 100%; object-fit: contain; }
.bo3-goal-th.is-cover img { width: 100%; height: 100%; object-fit: cover; max-width: none; max-height: none; }
.bo3-goal-b { flex: 1; min-width: 0; }
.bo3-goal-k { font: 700 9.5px/1 var(--f-d); letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.58); }
.bo3-goal-n { margin: 6px 22px 10px 0; font: 800 18px/1 var(--f-d); letter-spacing: -.01em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bo3-goal-bar { height: 6px; border-radius: 99px; background: rgba(0,0,0,.34); overflow: hidden; }
.bo3-goal-bar > i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, color-mix(in srgb, var(--acc) 55%, #fff), #fff); transition: width .4s ease; }
.bo3-goal-m { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 10px; }
.bo3-goal-m span { font: 500 11px/1.3 var(--f-b); color: rgba(255,255,255,.72); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* la phrase vient d'une clé de traduction pensée pour être insérée dans un texte */
.bo3-goal-m span::first-letter { text-transform: uppercase; }
.bo3-goal-m b { flex: none; font: 700 12px/1 var(--f-d); color: #fff; letter-spacing: .02em; }
.bo3-goal-x {
  position: absolute; top: 10px; right: 10px; z-index: 2; width: 24px; height: 24px;
  border: 0; border-radius: 50%; background: rgba(255,255,255,.16); color: #fff;
  font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.bo3-goal-x::before { content: ''; position: absolute; inset: -7px; }

/* ── Filtres (ils filtrent) ── */
.bo3-filters { display: flex; gap: 7px; overflow-x: auto; padding: 18px 16px 2px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.bo3-filters::-webkit-scrollbar { display: none; }
.bo3-chip {
  flex: none; min-height: 44px; padding: 0 14px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--bo); background: var(--su); color: var(--mu);
  font: 700 10.5px/1 var(--f-d); letter-spacing: .1em; text-transform: uppercase; white-space: nowrap;
  transition: background .15s, color .15s, border-color .15s, transform .12s var(--ease-snap);
}
.bo3-chip:active { transform: scale(.96); }
.bo3-chip.on { background: var(--acc); border-color: var(--acc); color: var(--a-ink); box-shadow: 0 5px 14px -8px var(--acc); }
.bo3-chip i { font-style: normal; opacity: .55; margin-left: 6px; }

/* ── Grille ── */
.bo3-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 11px; padding: 14px 16px 0; }
.bo3-card {
  background: var(--su); border: 1px solid var(--bo); border-radius: 14px;
  overflow: hidden; cursor: pointer; position: relative; user-select: none;
  box-shadow: 0 6px 16px -14px rgba(20,16,60,.7);
  transition: transform .14s var(--ease-spring), box-shadow .2s ease;
}
.bo3-card:active { transform: scale(.97); }
@media (hover: hover) { .bo3-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -16px rgba(20,16,60,.9); } }
.bo3-card[data-tone="4"] { border-color: color-mix(in srgb, var(--acc) 42%, var(--bo)); }

.bo3-pv {
  position: relative; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center;
  overflow: hidden; background: linear-gradient(180deg, color-mix(in srgb, var(--acc) 5%, var(--su)), color-mix(in srgb, var(--acc) 11%, var(--su)));
}
.bo3-pv img { max-width: 78%; max-height: 78%; object-fit: contain; filter: drop-shadow(0 10px 12px rgba(20,16,60,.24)); }
.bo3-pv.is-cover img { width: 100%; height: 100%; max-width: none; max-height: none; object-fit: cover; filter: none; }
/* Voile d'accent : relie les scènes opaques (voitures néon) au reste de l'écran. */
.bo3-pv.is-cover::after {
  content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: linear-gradient(180deg, color-mix(in srgb, var(--acc) 15%, transparent), transparent 45%, rgba(15,12,40,.28));
}

.bo3-tag {
  position: absolute; top: 8px; left: 8px; z-index: 3; padding: 4px 7px; border-radius: 5px;
  font: 700 8.5px/1 var(--f-d); letter-spacing: .13em; text-transform: uppercase;
  background: var(--su); color: var(--mu); box-shadow: 0 2px 5px rgba(20,16,60,.18);
}
.bo3-tag[data-tone="2"] { background: color-mix(in srgb, var(--acc) 26%, var(--su)); color: var(--acc-txt); }
.bo3-tag[data-tone="3"] { background: var(--acc); color: var(--a-ink); }
.bo3-tag[data-tone="4"] { background: var(--acc-dk); color: #fff; }

.bo3-pin {
  position: absolute; top: 6px; right: 6px; z-index: 3; width: 32px; height: 32px;
  border: 0; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--su) 88%, transparent); color: var(--acc-txt); font-size: 13px; line-height: 1;
  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
}
.bo3-pin.on { background: var(--acc); color: var(--a-ink); }
.bo3-owned {
  position: absolute; top: 8px; right: 8px; z-index: 3; padding: 4px 8px; border-radius: var(--r-full);
  background: var(--acc); color: var(--a-ink);
  font: 700 8.5px/1 var(--f-d); letter-spacing: .1em; text-transform: uppercase;
}

.bo3-info { padding: 11px 11px 12px; }
.bo3-nm { font: 700 13px/1.15 var(--f-d); letter-spacing: -.005em; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bo3-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; }
.bo3-pr { display: inline-flex; align-items: center; gap: 5px; }
.bo3-pr img { width: 15px; height: 15px; object-fit: contain; }
.bo3-pr b { font: 700 13.5px/1 var(--f-d); letter-spacing: -.01em; color: var(--ink); }
.bo3-pr.off b { color: var(--mu); }
.bo3-have { font: 700 10px/1 var(--f-d); letter-spacing: .1em; text-transform: uppercase; color: var(--mu); }
.bo3-btn {
  border: 0; border-radius: 9px; min-height: 40px; padding: 0 13px; cursor: pointer;
  color: var(--a-ink); font: 700 10.5px/1 var(--f-d); letter-spacing: .1em; text-transform: uppercase;
  background: linear-gradient(180deg, var(--acc-lt), var(--acc));
  box-shadow: 0 3px 0 var(--acc-dk);
  transition: transform .1s var(--ease-snap), box-shadow .1s var(--ease-snap);
}
.bo3-btn:active { transform: translateY(3px); box-shadow: 0 0 0 var(--acc-dk); }
.bo3-btn.off { background: var(--bo2); color: var(--mu); box-shadow: none; letter-spacing: .05em; padding: 0 10px; cursor: default; }
.bo3-btn.off:active { transform: none; }
.bo3-btn.ghost { background: var(--su); color: var(--acc-txt); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--acc) 45%, transparent); }
.bo3-btn.ghost:active { transform: translateY(1px); }
.bo3-eq { display: inline-flex; align-items: center; gap: 5px; min-height: 40px; padding: 0 11px; border-radius: 9px;
  font: 700 10px/1 var(--f-d); letter-spacing: .1em; text-transform: uppercase;
  color: var(--acc-txt); background: var(--acc-soft); box-shadow: inset 0 0 0 1.4px color-mix(in srgb, var(--acc) 40%, transparent); }

/* ── La Roue : une ligne, plus un panneau ── */
.bo3-roue {
  display: flex; align-items: center; gap: 11px; margin: 22px 16px 0; padding: 12px 14px;
  border-radius: 14px; background: var(--su); border: 1px solid var(--bo);
  text-decoration: none; color: inherit;
}
.bo3-roue-w {
  width: 32px; height: 32px; flex: none; border-radius: 50%;
  background: conic-gradient(var(--acc) 0 90deg, var(--acc-lt) 90deg 180deg, var(--acc-dk) 180deg 270deg, color-mix(in srgb, var(--acc) 30%, #fff) 270deg 360deg);
  border: 2px solid var(--su); box-shadow: 0 0 0 1.5px var(--bo);
  animation: bo3Spin 13s linear infinite;
}
@keyframes bo3Spin { to { transform: rotate(360deg) } }
.bo3-roue-t { flex: 1; min-width: 0; }
.bo3-roue-t b { display: block; font: 700 11px/1 var(--f-d); letter-spacing: .12em; text-transform: uppercase; color: var(--ink); }
.bo3-roue-t span { display: block; margin-top: 4px; font: 500 11.5px/1.3 var(--f-b); color: var(--mu); }
.bo3-roue-t span b { display: inline; font: inherit; letter-spacing: 0; text-transform: none; color: var(--acc-txt); }
.bo3-roue-g { flex: none; font: 700 10.5px/1 var(--f-d); letter-spacing: .1em; text-transform: uppercase; color: var(--a-ink); background: var(--acc); padding: 11px 13px; border-radius: 9px; }

.bo3-note { text-align: center; color: var(--mu); font: 500 11px/1.5 var(--f-b); margin: 20px 28px 0; }
.bo3-empty { text-align: center; padding: 48px 24px; color: var(--mu); }
.bo3-empty-t { font: 800 15px/1.3 var(--f-d); letter-spacing: -.01em; color: var(--ink); margin: 12px 0 6px; text-transform: uppercase; }
.bo3-empty-d { font: 500 13px/1.5 var(--f-b); }

@keyframes bo3In { from { opacity: 0; transform: translateY(12px) scale(.95) } to { opacity: 1; transform: none } }

/* ═══ Fiche détail (bottom-sheet) ═══ */
.bo3-modal-bg {
  position: fixed; inset: 0; background: rgba(11,13,26,.5);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  z-index: 500; display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0); animation: bo3Fade .2s ease both;
}
@keyframes bo3Fade { from { opacity: 0 } to { opacity: 1 } }
.bo3-modal {
  width: 100%; max-width: 480px; border-radius: 22px 22px 0 0; padding: 0 0 24px;
  background: var(--su); color: var(--ink);
  box-shadow: 0 -10px 40px rgba(11,13,26,.35);
  animation: bo3Up .3s cubic-bezier(.32,.72,0,1) both;
  font-variant-numeric: tabular-nums;
}
@keyframes bo3Up { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
.bo3-modal-handle { width: 36px; height: 4px; background: var(--bo4); border-radius: 2px; margin: 14px auto 10px; }
.bo3-halo { padding: 0 24px; }
.bo3-halo-ring {
  height: 200px; border-radius: 16px; overflow: hidden; position: relative;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(180deg, color-mix(in srgb, var(--acc) 6%, var(--su)), color-mix(in srgb, var(--acc) 13%, var(--su)));
  border: 1px solid var(--bo);
}
.bo3-halo-ring img { max-width: 80%; max-height: 152px; object-fit: contain; filter: drop-shadow(0 14px 16px rgba(20,16,60,.3)); }
.bo3-halo-ring.is-cover img { width: 100%; height: 100%; max-width: none; max-height: none; object-fit: cover; filter: none; }
.bo3-halo-ring.is-cover::after {
  content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: linear-gradient(180deg, color-mix(in srgb, var(--acc) 15%, transparent), transparent 45%, rgba(15,12,40,.3));
}

.bo3-modal-body { padding: 16px 24px 0; text-align: center; }
.bo3-modal-pill { display: inline-block; font: 700 9.5px/1 var(--f-d); letter-spacing: .14em; text-transform: uppercase; padding: 5px 11px; border-radius: 6px; margin-bottom: 10px; background: var(--acc); color: var(--a-ink); }
.bo3-modal-pill[data-tone="1"] { background: var(--bo2); color: var(--mu); }
.bo3-modal-pill[data-tone="2"] { background: color-mix(in srgb, var(--acc) 26%, var(--su)); color: var(--acc-txt); }
.bo3-modal-pill[data-tone="4"] { background: var(--acc-dk); color: #fff; }
.bo3-modal-name { font: 800 25px/1.05 var(--f-d); letter-spacing: -.02em; text-transform: uppercase; margin-bottom: 8px; }
.bo3-modal-desc { font: 500 14px/1.5 var(--f-b); color: var(--mu); margin-bottom: 14px; max-width: 320px; margin-left: auto; margin-right: auto; }
.bo3-modal-price { margin: 0 24px 12px; padding: 12px 15px; border-radius: 12px; background: var(--su2); border: 1px solid var(--bo); display: flex; align-items: center; justify-content: space-between; }
.bo3-modal-price-l { font: 700 10px/1 var(--f-d); letter-spacing: .12em; text-transform: uppercase; color: var(--mu); }
.bo3-modal-price-a { display: flex; align-items: center; gap: 6px; font: 700 19px/1 var(--f-d); letter-spacing: -.01em; }
.bo3-modal-balance { font: 500 12px/1.4 var(--f-b); color: var(--mu); text-align: center; margin: 0 24px 12px; }
.bo3-modal-cta {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: calc(100% - 48px); margin: 0 24px; min-height: 54px; border: 0; border-radius: 13px; cursor: pointer;
  font: 700 13px/1 var(--f-d); letter-spacing: .1em; text-transform: uppercase;
  transition: transform .12s var(--ease-snap), box-shadow .12s var(--ease-snap);
}
.bo3-modal-cta.buy { background: linear-gradient(180deg, var(--acc-lt), var(--acc)); color: var(--a-ink); box-shadow: 0 5px 0 var(--acc-dk); }
.bo3-modal-cta.buy:active { transform: translateY(4px); box-shadow: 0 1px 0 var(--acc-dk); }
.bo3-modal-cta.equip { background: var(--su); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--bo4); }
.bo3-modal-cta.equip:active { transform: translateY(2px); }
.bo3-modal-cta.locked { background: var(--bo2); color: var(--mu); cursor: default; }
.bo3-modal-obj {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  width: calc(100% - 48px); margin: 10px 24px 0; min-height: 46px; cursor: pointer;
  border: 1px solid var(--bo); border-radius: 13px; background: var(--su); color: var(--mu);
  font: 700 11px/1 var(--f-d); letter-spacing: .1em; text-transform: uppercase;
}
.bo3-modal-obj.on { background: var(--acc-soft); border-color: color-mix(in srgb, var(--acc) 40%, transparent); color: var(--acc-txt); }
.bo3-modal-obj:active { transform: scale(.98); }
.bo3-modal-cancel { display: block; width: calc(100% - 48px); margin: 8px 24px 0; padding: 12px; min-height: 44px; background: none; border: 0; color: var(--mu); font: 600 12px/1 var(--f-b); cursor: pointer; }

/* Aperçu avant achat */
.bo3-try { margin: 0 24px 14px; border-radius: 12px; overflow: hidden; background: var(--su2); border: 1px solid var(--bo); }
.bo3-try-t { font: 700 9.5px/1 var(--f-d); letter-spacing: .14em; text-transform: uppercase; color: var(--mu); padding: 10px 12px 8px; }
.bo3-try-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px 10px; border-top: 1px solid var(--bo); }
.bo3-try-num { font: 800 14px/1 var(--f-d); color: var(--acc-txt); min-width: 22px; }
.bo3-try-av { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: var(--bo2); }
.bo3-try-av img { width: 100%; height: 100%; object-fit: cover; }
.bo3-try-nm { flex: 1; font: 700 13px/1.2 var(--f-d); color: var(--ink); }
.bo3-try-sc { font: 600 12px/1 var(--f-d); color: var(--mu); }

/* Focus clavier visible (a11y) */
.bo3-chip:focus-visible, .bo3-btn:focus-visible, .bo3-goal:focus-visible,
.bo3-card:focus-visible, .bo3-pin:focus-visible, .bo3-modal-cta:focus-visible,
.bo3-modal-obj:focus-visible, .bo3-modal-cancel:focus-visible {
  outline: 2px solid var(--acc); outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .bo3 *, .bo3 *::before, .bo3 *::after,
  .bo3-modal-bg, .bo3-modal-bg * {
    animation-duration: .001ms !important; animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
  .bo3-roue-w { animation: none !important; }
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

  const solo = isSoloEleve(me);

  root.innerHTML = `${STYLE}
<div class="bo3 anim-slide-up">
  ${recompensesTabs("boutique")}
  <div class="bo3-hd">
    <h1 tabindex="-1">${bt("hd_title", "Boutique")}</h1>
    <p>${bt("hd_small", "Ton style au classement")}</p>
  </div>
  <div id="bo3-content">
    <div class="bo3-grid" style="padding:22px 16px 0">
      ${[...Array(4)].map(() => `<div class="bo3-skel" style="height:190px"></div>`).join("")}
    </div>
  </div>
</div>`;

  // Source canonique du solde : localStorage hydraté par initGameState.
  // Un fetch frais depuis profiles.gemmes est lancé en parallèle.
  let gemmes = getGemmes();

  const [profileRes, itemsRes] = await Promise.allSettled([
    sb.from("profiles").select("gemmes").eq("id", me.id).maybeSingle(),
    sb.rpc("get_items_catalog"),
  ]);

  // Si le serveur renvoie un solde plus récent, on prend le serveur.
  const serverBalance = profileRes.value?.data?.gemmes;
  if (typeof serverBalance === "number") {
    gemmes = serverBalance;
    localStorage.setItem("pg-gemmes", String(gemmes));
  }

  const catalogFailed =
    itemsRes.status === "rejected" || !!itemsRes.value?.error;
  const allItems = itemsRes.value?.data ?? [];

  // Filtre courant : première section non vide.
  let activeKey = null;

  // ── Source unique du solde après achat ────────────────────────
  function applyPurchase(result, item) {
    if (!result || result.ok === false) return false;
    const fallback =
      typeof gemmes === "number" ? gemmes - item.cost_gemmes : gemmes;
    const newBalance =
      typeof result.new_balance === "number" ? result.new_balance : fallback;
    gemmes = newBalance;

    const target = allItems.find((i) => i.id === item.id);
    if (target) {
      target.owned = true;
      target.acquired_at = new Date().toISOString();
    }

    // La pastille du bandeau écoute cet event : elle se met à jour et rebondit
    // toute seule (cf. header-top.js).
    localStorage.setItem("pg-gemmes", String(newBalance));
    window.dispatchEvent(
      new CustomEvent("pg-gemmes-changed", { detail: { balance: newBalance } }),
    );

    // Objectif atteint → on le retire (la pièce est obtenue)
    if (getObjectif() === item.id) setObjectif(null);

    return true;
  }

  function buyFlow(item, triggerEl) {
    showDetailModal(
      item,
      gemmes,
      me,
      async () => {
        // La pièce s'envole vers la pastille du bandeau de l'app.
        const balanceBadge = document.querySelector("#ht-volant-btn");
        const result = await doPurchase(item);
        if (applyPurchase(result, item)) {
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
    toggleEquipLocal(item, root);
  }

  // ── Rendu ────────────────────────────────────────────────────
  const byRarityCost = (a, b) =>
    rm(b.rarity).order - rm(a.rarity).order || b.cost_gemmes - a.cost_gemmes;

  function sections() {
    return SECTIONS.map((s) => ({
      ...s,
      items: allItems.filter(s.match).sort(byRarityCost),
    })).filter((c) => c.items.length);
  }

  function renderAll() {
    const content = root.querySelector("#bo3-content");
    if (!content) return;

    if (catalogFailed) {
      content.innerHTML = `<div class="bo3-empty">
        ${medallion("panneau", "orange", { size: 48 })}
        <div class="bo3-empty-t">${bt("unavailable", "Boutique indisponible")}</div>
        <div class="bo3-empty-d">${bt("check_conn", "Vérifie ta connexion puis réessaie.")}</div>
      </div>`;
      return;
    }

    const cats = sections();
    if (!cats.length) {
      content.innerHTML = `<div class="bo3-empty">
        ${medallion("cadeau", "pink", { size: 48 })}
        <div class="bo3-empty-t">${bt("unavailable", "Boutique indisponible")}</div>
        <div class="bo3-empty-d">${bt("check_conn", "Vérifie ta connexion puis réessaie.")}</div>
      </div>`;
      return;
    }
    if (!cats.some((c) => c.key === activeKey)) activeKey = cats[0].key;
    const current = cats.find((c) => c.key === activeKey);

    // Objectif : épinglé (localStorage) sinon la pièce la plus prestigieuse
    // encore à débloquer, toutes catégories confondues.
    const objId = getObjectif();
    let objItem = objId
      ? allItems.find((i) => i.id === objId && !i.owned)
      : null;
    const objPinned = !!objItem;
    if (!objItem) {
      const inShop = allItems.filter(
        (i) => !i.owned && SECTIONS.some((s) => s.match(i)),
      );
      objItem = [...inShop].sort(byRarityCost)[0] || null;
    }

    content.innerHTML = `
      ${objItem ? renderGoal(objItem, gemmes, objPinned) : ""}
      <div class="bo3-filters" id="bo3-filters" role="tablist" aria-label="${escAttr(btR("hd_title", "Boutique"))}">
        ${cats
          .map(
            (
              c,
            ) => `<button class="bo3-chip${c.key === activeKey ? " on" : ""}" type="button"
              role="tab" aria-selected="${c.key === activeKey}" data-key="${escAttr(c.key)}">${bt(`sec_${c.key}`, c.label)} <i>${c.items.length}</i></button>`,
          )
          .join("")}
      </div>
      <div class="bo3-grid" id="bo3-grid">
        ${current.items.map((it, idx) => renderCard(it, gemmes, idx)).join("")}
      </div>
      <a class="bo3-roue" href="#/roue" aria-label="${escAttr(btR("roue_aria", "Ouvrir la Roue"))}">
        <span class="bo3-roue-w" aria-hidden="true"></span>
        <span class="bo3-roue-t">
          <b>${bt("roue_t", "La Roue")}</b>
          <span>${brtl(
            solo
              ? btR(
                  "roue_s_solo",
                  "Skins · titres · <b>récompenses</b> à débloquer.",
                )
              : btR(
                  "roue_s",
                  "Skins · titres · <b>gros lots réels</b> de ton moniteur.",
                ),
          )}</span>
        </span>
        <span class="bo3-roue-g">${bt("roue_go", "Tour gratuit !")}</span>
      </a>
      <div class="bo3-note">${bt("note", "Les skins sont 100 % cosmétiques : du style et jamais d’avantage.")}</div>`;

    wire(content);
    _scanCovers(content);

    // Le filtre actif doit rester visible : sur 390 px le dernier sort du cadre
    // et l'élève ne voit pas lequel est sélectionné.
    content
      .querySelector(".bo3-chip.on")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function wire(content) {
    // Filtres
    content.querySelector("#bo3-filters")?.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-key]");
      if (!chip || chip.dataset.key === activeKey) return;
      haptic("tap");
      activeKey = chip.dataset.key;
      renderAll();
    });

    // Cartes
    content.querySelectorAll(".bo3-card").forEach((el) => {
      const activate = () => {
        haptic("select");
        const item = allItems.find((i) => i.id === el.dataset.itemId);
        if (!item) return;
        if (item.owned) toggleEquip(item);
        else buyFlow(item, el);
      };
      el.addEventListener("click", activate);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
    content.querySelectorAll(".bo3-btn:not(.off)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        haptic("select");
        const item = allItems.find(
          (i) => i.id === btn.closest(".bo3-card")?.dataset.itemId,
        );
        if (!item) return;
        if (item.owned) toggleEquip(item);
        else buyFlow(item, btn);
      });
    });

    // Épingler / retirer l'objectif directement depuis la grille
    content.querySelectorAll(".bo3-pin").forEach((pin) => {
      pin.addEventListener("click", (e) => {
        e.stopPropagation();
        haptic("tap");
        const id = pin.closest(".bo3-card")?.dataset.itemId;
        if (!id) return;
        const nowOn = getObjectif() !== id;
        setObjectif(nowOn ? id : null);
        toast(
          nowOn
            ? btR(
                "obj_set",
                "Objectif défini. Gagne des volants en révisant !",
              )
            : btR("obj_removed", "Objectif retiré"),
          nowOn ? "success" : "info",
        );
        renderAll();
      });
    });

    // Carte objectif
    const goal = content.querySelector(".bo3-goal");
    if (goal) {
      goal.querySelector("[data-goal-x]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        haptic("tap");
        setObjectif(null);
        toast(btR("obj_removed", "Objectif retiré"), "info");
        renderAll();
      });
      const activateGoal = () => {
        haptic("select");
        const it = allItems.find((i) => i.id === goal.dataset.itemId);
        if (!it) return;
        if (it.owned) toggleEquip(it);
        else buyFlow(it, goal);
      };
      goal.addEventListener("click", activateGoal);
      goal.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateGoal();
        }
      });
    }
  }

  // Re-render quand l'objectif change depuis la fiche détail
  _activeRerender = () => renderAll();
  _ensureObjListener();

  renderAll();
}

// ─── Aperçu d'un article ──────────────────────────────────────
// 2 natures d'assets (scène opaque, objet détouré) mais UN seul cadre :
// c'est ce qui rendait l'ancienne grille incohérente.
function _preview(item, size) {
  if (item.asset_url) {
    return `<img src="${escAttr(item.asset_url)}" alt="${escAttr(iName(item))}" loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span style="display:none">${_typeMed(item.type, size)}</span>`;
  }
  return `<span>${_typeMed(item.type, size)}</span>`;
}

// ─── Carte de la grille ───────────────────────────────────────
function renderCard(item, gemmes, idx) {
  const r = rm(item.rarity);
  const canAfford = gemmes >= item.cost_gemmes;
  const lacking = item.cost_gemmes - gemmes;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;
  const isGoal = getObjectif() === item.id;

  let footer;
  if (item.owned) {
    footer = isEquipped
      ? `<span class="bo3-eq">${icon("check", { size: 12, strokeWidth: 3 })} ${bt("equipped_short", "Équipé")}</span>`
      : `<span class="bo3-have">${bt("owned_lab", "Possédé")}</span><button class="bo3-btn ghost" type="button">${bt("equip_btn", "Équiper")}</button>`;
  } else {
    footer = `<span class="bo3-pr${canAfford ? "" : " off"}">${volantImg(15)} <b>${item.cost_gemmes}</b></span>
      <button class="bo3-btn ${canAfford ? "" : "off"}" type="button" ${canAfford ? "" : "disabled"}>${canAfford ? bt("buy", "Acheter") : `${bt("missing_short", "Manque")} ${lacking}`}</button>`;
  }

  // L'épingle n'a de sens que sur une pièce pas encore débloquée.
  const pin = item.owned
    ? `<span class="bo3-owned">${bt("unlocked_badge", "Débloqué")}</span>`
    : `<button class="bo3-pin${isGoal ? " on" : ""}" type="button"
        aria-label="${escAttr(isGoal ? btR("pin_unset", "Retirer de tes objectifs") : btR("pin_set", "Définir comme objectif"))}"
        aria-pressed="${isGoal}">${isGoal ? "★" : "☆"}</button>`;

  const ariaState = item.owned
    ? isEquipped
      ? btR("aria_equipped", "équipé")
      : btR("aria_unlocked", "débloqué")
    : canAfford
      ? btR("aria_buy", "acheter")
      : btR("aria_not_enough", "pas assez de volants");

  return `
    <div class="bo3-card" data-item-id="${escAttr(item.id)}" data-tone="${r.tone}"
      role="button" tabindex="0"
      aria-label="${escAttr(iName(item))}, ${escAttr(rLabel(item))}, ${escAttr(ariaState)}"
      style="animation: bo3In .34s ${idx * 45}ms cubic-bezier(.34,1.56,.64,1) both">
      <div class="bo3-pv" data-prev>
        <span class="bo3-tag" data-tone="${r.tone}">${esc(rLabel(item))}</span>
        ${pin}
        ${_preview(item, 58)}
      </div>
      <div class="bo3-info">
        <div class="bo3-nm">${esc(iName(item))}</div>
        <div class="bo3-row">${footer}</div>
      </div>
    </div>`;
}

// ─── L'objectif (unique accroche de l'écran) ──────────────────
function renderGoal(item, gemmes, pinned) {
  const pct = Math.min(100, Math.round((gemmes / item.cost_gemmes) * 100));
  const lacking = item.cost_gemmes - gemmes;
  const ready = gemmes >= item.cost_gemmes;
  const closeBtn = pinned
    ? `<button class="bo3-goal-x" data-goal-x type="button" aria-label="${escAttr(btR("obj_x", "Retirer l’objectif"))}">×</button>`
    : "";

  // <div role=button> et non <button> : le « × » est un vrai bouton imbriqué,
  // ce qui est interdit dans un <button>.
  return `
    <div class="bo3-goal" role="button" tabindex="0" data-item-id="${escAttr(item.id)}"
      aria-label="${escAttr(btR("obj_aria", "Objectif :"))} ${escAttr(iName(item))}, ${ready ? escAttr(btR("obj_can_buy", "tu peux l’acheter")) : escAttr(stillVolants(lacking))}">
      ${closeBtn}
      <div class="bo3-goal-th" data-prev>${_preview(item, 44)}</div>
      <div class="bo3-goal-b">
        <div class="bo3-goal-k">${pinned ? bt("obj_kick_pin", "Ton objectif") : bt("obj_kick_aim", "À viser")}</div>
        <div class="bo3-goal-n">${esc(iName(item))}</div>
        <div class="bo3-goal-bar"><i style="width:${pct}%"></i></div>
        <div class="bo3-goal-m">
          <span>${ready ? bt("obj_can_buy", "tu peux l’acheter") : esc(stillVolants(lacking))}</span>
          <b>${gemmes}/${item.cost_gemmes}</b>
        </div>
      </div>
    </div>`;
}

// ─── Médaillon 3D de secours (quand l'item n'a pas d'asset_url) ──
const _TYPE_MED = {
  avatar: ["voiture", "blue"],
};
function _typeMed(type, size) {
  const [glyph, ramp] = _TYPE_MED[type] || ["cadeau", "pink"];
  return medallion(glyph, ramp, { size });
}

// ─── Détection d'opacité du skin ──────────────────────────────
// Certains skins (voitures) sont des scènes opaques ; d'autres (persos) sont
// détourés. On détecte l'opacité au chargement (alpha des 4 coins via canvas)
// → les opaques passent en « cover » plein cadre, les autres flottent.
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
// Stocké en localStorage : c'est une préférence perso (quelle pièce tu vises),
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
// Re-render quand l'objectif change depuis la fiche détail. Un seul listener
// window (posé une fois) → pas de fuite au remount de la page.
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

// ─── Équiper / retirer ────────────────────────────────────────
function toggleEquipLocal(item, root) {
  const eq = getEquipped();
  const on = eq[item.type] !== item.id;
  if (on) {
    equipItem(item.type, item.id);
    setEquippedAsset(item.type, item.asset_url || null);
    syncAvatarUrlToProfile(item.type, item.asset_url || null);
  } else {
    unequipItem(item.type);
    setEquippedAsset(item.type, null);
    syncAvatarUrlToProfile(item.type, null);
  }
  toast(equipToast(item, on), on ? "success" : "info");
  _muteCard(root, item);
}

// Mise à jour ciblée de la carte après équipement (pas de re-render global :
// ça ferait sauter la grille sous le doigt).
function _muteCard(root, item) {
  const card = root.querySelector(
    `.bo3-card[data-item-id="${CSS.escape(item.id)}"]`,
  );
  if (!card) return;
  const isEquipped = getEquipped()[item.type] === item.id;
  const row = card.querySelector(".bo3-row");
  if (!row) return;
  if (isEquipped) {
    row.innerHTML = `<span class="bo3-eq">${icon("check", { size: 12, strokeWidth: 3 })} ${bt("equipped_short", "Équipé")}</span>`;
  } else {
    row.innerHTML = `<span class="bo3-have">${bt("owned_lab", "Possédé")}</span><button class="bo3-btn ghost" type="button">${bt("equip_btn", "Équiper")}</button>`;
    row.querySelector(".bo3-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      haptic("select");
      toggleEquipLocal(item, root);
    });
  }
}

// ─── Fiche détail (bottom-sheet) ─────────────────────────────
function showDetailModal(item, gemmes, me, onConfirm, triggerEl) {
  if (document.querySelector(".bo3-modal-bg")) return; // une seule à la fois
  const r = rm(item.rarity);
  const afterBalance = gemmes - item.cost_gemmes;
  const canAfford = afterBalance >= 0;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;
  const lacking = item.cost_gemmes - gemmes;

  const priceBlock = item.owned
    ? ""
    : `<div class="bo3-modal-price">
        <span class="bo3-modal-price-l">${bt("price", "Prix")}</span>
        <span class="bo3-modal-price-a">${volantImg(16)} ${item.cost_gemmes}</span>
      </div>`;

  let cta;
  let balanceLine = "";
  if (item.owned) {
    cta = `<button class="bo3-modal-cta equip" id="bo3-cta" type="button">${isEquipped ? bt("equipped_remove", "Retirer") : bt("equip_btn", "Équiper")}</button>`;
  } else if (canAfford) {
    cta = `<button class="bo3-modal-cta buy" id="bo3-cta" type="button">${bt("buy", "Acheter")} ${item.cost_gemmes} ${volantImg(14)}</button>`;
    balanceLine = `<div class="bo3-modal-balance">${brtl(afterBuyLine(afterBalance))}</div>`;
  } else {
    cta = `<button class="bo3-modal-cta locked" id="bo3-cta" type="button" disabled>${icon("lock", { size: 14 })} ${bt("not_enough", "Pas assez de volants")}</button>`;
    balanceLine = `<div class="bo3-modal-balance">${esc(missingLine(lacking))}</div>`;
  }

  const isGoal = getObjectif() === item.id;
  const desc = iDesc(item);

  const html = `
    <div class="bo3-modal" role="document">
      <div class="bo3-modal-handle" aria-hidden="true"></div>
      <div class="bo3-halo"><div class="bo3-halo-ring" data-prev>${_preview(item, 96)}</div></div>
      <div class="bo3-modal-body">
        <div class="bo3-modal-pill" data-tone="${r.tone}" id="bo3-modal-title">${esc(rLabel(item))}</div>
        <div class="bo3-modal-name">${esc(iName(item))}</div>
        ${desc ? `<div class="bo3-modal-desc">${esc(desc)}</div>` : ""}
      </div>
      ${_renderTryPreview(item, me)}
      ${priceBlock}
      ${balanceLine}
      ${cta}
      ${item.owned ? "" : `<button class="bo3-modal-obj ${isGoal ? "on" : ""}" id="bo3-obj-toggle" type="button">${isGoal ? bt("obj_on", "C’est ton objectif") : bt("obj_off", "En faire ton objectif")}</button>`}
      <button class="bo3-modal-cancel" id="bo3-modal-cancel" type="button">${bt("close", "Fermer")}</button>
    </div>`;

  const { overlay, close } = openBottomSheet({
    bgClass: "bo3-modal-bg",
    sheetSelector: ".bo3-modal",
    // Le composant refuse le HTML brut : tout ce qui vient de la base est déjà
    // passé par esc() / escAttr() ci-dessus.
    html: trustedBottomSheetHtml(html),
    labelledBy: "bo3-modal-title",
    triggerEl,
  });
  track("boutique.detail_opened", { item_id: item.id });
  _scanCovers(overlay);
  overlay.querySelector("#bo3-modal-cancel")?.addEventListener("click", close);

  overlay.querySelector("#bo3-obj-toggle")?.addEventListener("click", () => {
    const nowOn = getObjectif() !== item.id;
    setObjectif(nowOn ? item.id : null);
    const b = overlay.querySelector("#bo3-obj-toggle");
    if (b) {
      b.classList.toggle("on", nowOn);
      b.textContent = nowOn
        ? btR("obj_on", "C’est ton objectif")
        : btR("obj_off", "En faire ton objectif");
    }
    haptic("tap");
    toast(
      nowOn
        ? btR("obj_set", "Objectif défini. Gagne des volants en révisant !")
        : btR("obj_removed", "Objectif retiré"),
      nowOn ? "success" : "info",
    );
    window.dispatchEvent(new CustomEvent("pg-objectif-changed"));
  });

  const ctaBtn = overlay.querySelector("#bo3-cta");
  if (ctaBtn && !ctaBtn.disabled) {
    ctaBtn.addEventListener("click", async () => {
      if (item.owned) {
        const eq = getEquipped();
        const on = eq[item.type] !== item.id;
        if (on) {
          equipItem(item.type, item.id);
          setEquippedAsset(item.type, item.asset_url || null);
          syncAvatarUrlToProfile(item.type, item.asset_url || null);
        } else {
          unequipItem(item.type);
          setEquippedAsset(item.type, null);
          syncAvatarUrlToProfile(item.type, null);
        }
        toast(equipToast(item, on), on ? "success" : "info");
        overlay.remove();
        window.dispatchEvent(
          new CustomEvent("pg-equipped-changed", {
            detail: { slot: item.type, itemId: item.id },
          }),
        );
        _activeRerender?.();
        return;
      }
      overlay.remove();
      await onConfirm();
    });
  }
}

// ─── Aperçu avant achat : le contexte réel d'usage ────────────
function _renderTryPreview(item, me) {
  if (item.type !== "avatar" || !item.asset_url) return "";
  const pseudoEsc = esc(
    me?.display_name || me?.email?.split("@")[0] || btR("me_fallback", "Toi"),
  );
  return `
    <div class="bo3-try">
      <div class="bo3-try-t">${bt("try_rank", "Ton skin dans le classement")}</div>
      <div class="bo3-try-row">
        <div class="bo3-try-num">1</div>
        <div class="bo3-try-av"><img src="${escAttr(item.asset_url)}" alt="" aria-hidden="true"></div>
        <div class="bo3-try-nm">${pseudoEsc}</div>
        <div class="bo3-try-sc">1 250 pts</div>
      </div>
    </div>`;
}

// ─── Achat ────────────────────────────────────────────────────
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
      toast(btR("not_enough", "Pas assez de volants"), "error");
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

    // Auto-équipement de la pièce achetée
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
