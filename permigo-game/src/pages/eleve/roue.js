// ═══════════════════════════════════════════════════════════════
// Élève — Le coffre du jour (1 ouverture offerte par jour)
// La roue de la fortune a été retirée le 06/08/2026 (décision Rayan) : elle
// faisait « casino générique », ses chiffres tournaient avec les parts donc la
// police ne se reconnaissait plus, et trois blocs s'empilaient sous elle. Le
// coffre reprend l'imagerie déjà dessinée pour l'app. La mécanique, elle, n'a
// pas bougé d'un pouce.
// Le tirage ET le crédit des volants se font CÔTÉ SERVEUR via le RPC
// spin_roue_daily() (1 ouverture/jour garantie, impossible à tricher).
// Repli « aperçu » propre tant que la migration n'est pas posée en prod
// (le RPC renvoie alors une erreur « fonction inconnue »).
// Les gros lots réels (disque A, heure offerte) + le gacha cosmétique
// restent en teaser : ils attendent la config moniteur.
// DA « Arène » nuit-violet + or.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { isSoloEleve } from "@/utils/league-bots.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { toast } from "@/components/common/toast.js";
import {
  isSoundEnabled,
  playClick,
  playTick,
  playCoin,
  playReward,
} from "@/utils/sound.js";
import { medallion, medLot } from "@/utils/medallions.js";
import { volantImg } from "@/utils/volant.js";
import { getLang } from "@/utils/lang.js";

// ── i18n de la COQUE (EN/AR) — dict local (convention coque, cf. profil #555).
// wt(key, fr) = traduit-ou-français esc() intégré ; wtR = brut (toasts,
// textContent). Les lots CONFIGURÉS par le moniteur (labels serveur) restent
// à leur source ; seuls les 2 lots par défaut (hardcodés ici) sont traduits.
// En 'fr' ou clé absente → FR inchangé.
const ROUE_I18N = {
  en: {
    back: "Back",
    title: "Your daily chest",
    gifts_link: "Real gifts · coming soon",
    gifts_link_live: "Real gifts · in play",
    how_link: "How it works",
    sheet_close: "Close",
    cta_done: "Come back tomorrow",
    cta_free: "Open",
    free_done: "Today's chest is already open.",
    free_ok: "1 free chest every day",
    lot_disque: "A-plate for new drivers",
    lot_heure: "1 free driving hour",
    gifts_h: "Real gifts",
    tag_live: "In play",
    tag_soon: "Coming soon",
    gift_fallback: "Gift",
    big_tag: "To win",
    offered_by: "Offered by",
    your_moniteur: "your instructor",
    sign_live: "Try your luck every day. The gifts come from them.",
    sign_soon: "They choose the gifts.",
    wins_h: "🏆 Your prizes won",
    win_got: "Collected ✓",
    win_show: "Show this code to your instructor",
    note_solo:
      "Steering wheels are earned by playing, <b>never</b> with money.",
    note: "A <b>big prize</b> can drop (rare!) if your instructor has put one in play. You collect it for real with your code. Steering wheels are earned by playing, <b>never</b> with money.",
    res_apercu:
      "Preview. Your steering wheels will be credited once the chest goes live.",
    res_credited: "steering wheels added to your balance!",
    gros_badge: "🎁 BIG PRIZE!",
    gros_code: "Your pickup code",
    gros_show_pre: "Show this code to",
    gros_show_post: "to collect your prize. It’s their gift.",
    spinning: "Opening…",
    retry_toast: "Try again in a moment.",
    already_toast: "You already opened today's chest. Come back tomorrow!",
  },
  ar: {
    back: "رجوع",
    title: "صندوقك اليومي",
    gifts_link: "هدايا حقيقية · قريبًا",
    gifts_link_live: "هدايا حقيقية · قيد اللعب",
    how_link: "كيف يعمل",
    sheet_close: "إغلاق",
    cta_done: "عد غدًا",
    cta_free: "افتح",
    free_done: "صندوق اليوم مفتوح بالفعل.",
    free_ok: "صندوق مجاني كل يوم",
    lot_disque: "لوحة A للسائق الجديد",
    lot_heure: "ساعة قيادة مجانية",
    gifts_h: "هدايا حقيقية",
    tag_live: "قيد اللعب",
    tag_soon: "قريبًا",
    gift_fallback: "هدية",
    big_tag: "للربح",
    offered_by: "مقدَّمة من",
    your_moniteur: "مدرّبك",
    sign_live: "جرّب حظك كل يوم. هو من يقدّم الهدايا.",
    sign_soon: "هو من يختار الهدايا.",
    wins_h: "🏆 جوائزك المربوحة",
    win_got: "استُلمت ✓",
    win_show: "أرِ هذا الرمز لمدرّبك",
    note_solo: "تُربح المقاود باللعب. <b>وليس</b> بالمال أبدًا.",
    note: "قد تسقط <b>جائزة كبرى</b> (نادرًا!) إذا وضعها مدرّبك قيد اللعب. تستلمها فعليًا برمزك. تُربح المقاود باللعب. <b>وليس</b> بالمال أبدًا.",
    res_apercu: "معاينة. ستُضاف مقاودك عند إطلاق الصندوق.",
    res_credited: "مقود أُضيفت إلى رصيدك!",
    gros_badge: "🎁 جائزة كبرى!",
    gros_code: "رمز الاستلام الخاص بك",
    gros_show_pre: "أرِ هذا الرمز إلى",
    gros_show_post: "لاستلام جائزتك. هو من يقدّمها.",
    spinning: "يُفتح…",
    retry_toast: "أعد المحاولة بعد لحظة.",
    already_toast: "لقد فتحت صندوق اليوم. عد غدًا!",
  },
};
const ROUE_FR_RICH = {
  note_solo:
    "Les volants se gagnent en jouant, <b>jamais</b> avec de l’argent.",
  note: "Un <b>gros lot</b> peut tomber (rare !) si ton moniteur en a mis en jeu. Tu le récupères en vrai avec ton code. Les volants se gagnent en jouant, <b>jamais</b> avec de l’argent.",
};
function wtR(key, fr) {
  const l = getLang();
  return (l !== "fr" && ROUE_I18N[l]?.[key]) || fr;
}
function wt(key, fr) {
  return esc(wtR(key, fr));
}
// Texte (éventuellement avec <b>/<em> maison, jamais de donnée user) posé en
// HTML : span RTL en arabe pour garder la ponctuation du bon côté.
function wrtl(html) {
  return getLang() === "ar" ? `<span dir="rtl">${html}</span>` : html;
}

// Durée de la mise en scène d'ouverture. Une roue avait besoin de 5 s pour
// ralentir de façon crédible ; un coffre qui tressaute n'a besoin que d'une
// seconde et demie. Au-delà on fait juste attendre l'élève.
const OPEN_MS = 1500;

const LS_FREE = "pg-roue-free-last"; // repli aperçu : YYYY-MM-DD du dernier tour

// Drapeau posé par first-quiz-reward.js : l'élève arrive ici depuis le tour
// offert de son 1er quiz réussi → on pitche l'install PILE après le gain
// (meilleur moment de valeur). Appelé une fois, après le résultat du tour.
function maybeInstallAfterSpin() {
  let flagged = false;
  try {
    flagged = sessionStorage.getItem("pg-install-after-roue") === "1";
    if (flagged) sessionStorage.removeItem("pg-install-after-roue");
  } catch {
    return;
  }
  if (!flagged) return;
  import("@/components/common/install-nudge.js")
    .then((m) =>
      m.promptInstallAtValueMoment(getCurUser(), "eleve_first_quiz_roue"),
    )
    .catch(() => {});
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Paliers de volants, alignés sur la distribution serveur. Ne sert plus qu'au
// mode « aperçu » (migration pas encore posée) pour tirer un montant plausible.
const PALIERS = [20, 50, 10, 30, 100, 10, 20, 30];

const STYLE = `<style>
/* L'écran tient dans UNE hauteur, sans défilement : colonne flex, le coffre et
   son bouton forment un groupe centré. Le reste (cadeaux, historique, note) vit
   dans la feuille du bas. C'est ce qui supprime le tiers de vide noir et la
   carte coupée par la barre de navigation. */
.roue {
  --pnl: #241644; --pnl2: #2b1b54; --line: rgba(167,139,250,.20);
  --mu: #c3b8e8; --mu2: #9488bf; --gold: #ffd24a; --gold-s: #ffe9a8;
  position: relative;
  margin-top: calc(-1 * (var(--th, 52px) + env(safe-area-inset-top, 0px)));
  /* #app pose un padding bas de 60px pour la barre de nav (components.css).
     Additionné à min-height:100dvh il faisait dépasser la page de 60px : un
     ruban noir qui n'apparaissait qu'en défilant. On l'annule ici pour que
     l'écran fasse exactement une hauteur, ni plus ni moins. */
  margin-bottom: calc(-60px - env(safe-area-inset-bottom, 0px));
  padding: calc(var(--th, 52px) + env(safe-area-inset-top, 0px) + 8px) 16px
    calc(78px + env(safe-area-inset-bottom, 0px));
  min-height: 100dvh; max-width: 480px; margin-inline: auto;
  display: flex; flex-direction: column;
  color: #fff; font-family: 'Archivo', system-ui, sans-serif; overflow: hidden;
  background:
    radial-gradient(120% 55% at 20% -6%, rgba(168,85,247,.42) 0%, transparent 54%),
    radial-gradient(110% 45% at 96% 4%, rgba(255,156,28,.16) 0%, transparent 50%),
    linear-gradient(180deg, #1d1138 0%, #150d2b 46%, #100a22 100%);
}
.roue-body {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.roue-foot { width: 100%; display: flex; flex-direction: column; align-items: center; margin-top: 22px; }
.roue-top { display: flex; align-items: center; gap: 10px; flex: none; }
.roue-back {
  width: 44px; height: 44px; flex: none; border-radius: 13px;
  border: 1px solid var(--line); background: rgba(255,255,255,.06);
  color: #fff; display: grid; place-items: center; cursor: pointer;
}
.roue-back svg { width: 20px; height: 20px; }
.roue-title { font: 800 20px/1 'Archivo', system-ui, sans-serif; text-shadow: 0 0 18px rgba(168,85,247,.4); }

/* ── Le coffre ──
   Une seule image, deux états (fermé / ouvert). Les deux visuels sont une
   paire dessinée ensemble, indigo et or, avec le volant gravé : ils tiennent
   la DA de l'app là où la roue arc-en-ciel sonnait « casino générique ». */
.roue-stage {
  position: relative; width: min(340px, 88vw); aspect-ratio: 1;
  display: grid; place-items: center;
}
.roue-halo {
  position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, rgba(255,210,74,.32) 0%, rgba(168,85,247,.16) 50%, transparent 74%);
  filter: blur(6px);
}
.roue-rays {
  position: absolute; inset: 0; border-radius: 50%; pointer-events: none; opacity: .28;
  background: repeating-conic-gradient(from 0deg, rgba(255,255,255,.18) 0deg 4deg, transparent 4deg 22deg);
  -webkit-mask: radial-gradient(closest-side, transparent 34%, #000 62%, transparent 88%);
          mask: radial-gradient(closest-side, transparent 34%, #000 62%, transparent 88%);
  animation: roueRays 26s linear infinite;
}
@keyframes roueRays { to { transform: rotate(360deg); } }
.roue-socle {
  position: absolute; bottom: 12%; width: 52%; height: 22px; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(0,0,0,.55), transparent 78%);
  pointer-events: none;
}
.roue-chest {
  position: relative; width: 72%; z-index: 2;
  filter: drop-shadow(0 22px 26px rgba(0,0,0,.6));
  animation: roueBob 3.4s ease-in-out infinite;
}
@keyframes roueBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
/* Ouverture : le coffre tressaute, puis l'image bascule sur la version ouverte. */
.roue-chest.shaking { animation: roueShake .16s linear infinite; }
@keyframes roueShake {
  0%,100% { transform: translate(0,0) rotate(0deg); }
  25% { transform: translate(-3px,1px) rotate(-1.4deg); }
  75% { transform: translate(3px,-1px) rotate(1.4deg); }
}
.roue-chest.opened { animation: rouePop2 .42s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes rouePop2 { from { transform: scale(.9); } to { transform: scale(1.06); } }

.roue-cta {
  display: block; width: 100%; max-width: 330px; margin: 0 auto; min-height: 60px;
  border: 0; border-radius: 18px; cursor: pointer;
  font: 800 17px/1 'Archivo', system-ui, sans-serif; color: #fff; text-shadow: 0 2px 0 rgba(40,90,5,.55);
  background: linear-gradient(180deg, var(--a-lt), var(--a));
  box-shadow: inset 0 1.5px 0 rgba(255,255,255,.5), 0 6px 0 var(--adk), 0 12px 24px -6px color-mix(in srgb, var(--a) 70%, transparent);
  transition: transform .1s, filter .15s;
}
.roue-cta:active { transform: translateY(3px); box-shadow: inset 0 1.5px 0 rgba(255,255,255,.5), 0 3px 0 var(--adk); }
.roue-cta:disabled { filter: grayscale(.5) brightness(.8); cursor: default; }
.roue-free { text-align: center; margin-top: 10px; font: 600 12px/1.4 'Archivo', sans-serif; color: var(--mu); }

/* Lien discret vers la feuille : c'est lui qui absorbe les 3 blocs qui
   encombraient l'écran (vrais cadeaux, lots gagnés, la note). */
.roue-link {
  margin-top: 14px; font: 700 12px/1 'Archivo', sans-serif; color: #c9c0ff;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.16);
  padding: 10px 16px; border-radius: 999px; cursor: pointer;
}
.roue-link:active { transform: scale(.97); }

/* ── Feuille du bas ── */
/* z-index au-dessus du bandeau et de la barre du bas, qui sont à 300 et 320 :
   une feuille modale qui passe SOUS la barre se fait couper son bouton Fermer. */
.roue-sheet {
  position: fixed; inset: 0; z-index: 400; display: flex; align-items: flex-end;
  background: rgba(8,6,22,.66); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
  animation: roueFade .2s ease both;
}
@keyframes roueFade { from { opacity: 0; } to { opacity: 1; } }
.roue-sheet-in {
  width: 100%; max-height: 86dvh; overflow-y: auto; -webkit-overflow-scrolling: touch;
  background: linear-gradient(180deg, #241644, #180f34);
  border-top-left-radius: 26px; border-top-right-radius: 26px;
  border-top: 1px solid rgba(167,139,250,.3);
  padding: 10px 16px calc(26px + env(safe-area-inset-bottom, 0px));
  animation: roueUp .26s cubic-bezier(.22,1,.32,1) both;
}
@keyframes roueUp { from { transform: translateY(24px); } to { transform: translateY(0); } }
.roue-sheet-grip { width: 40px; height: 4px; border-radius: 999px; background: rgba(255,255,255,.24); margin: 4px auto 12px; }
.roue-sheet-close {
  display: block; width: 100%; margin-top: 16px; min-height: 48px;
  border: 1px solid rgba(255,255,255,.16); border-radius: 15px; cursor: pointer;
  background: rgba(255,255,255,.06); color: #fff;
  font: 700 14px/1 'Archivo', sans-serif;
}

.roue-result {
  margin: 14px auto 0; max-width: 360px; text-align: center;
  padding: 14px 16px; border-radius: 18px;
  background: linear-gradient(180deg, var(--pnl), var(--pnl2)); border: 1px solid var(--line);
  animation: rouepop .35s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes rouepop { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
.roue-result-v { font: 800 26px/1 'Archivo', system-ui, sans-serif; color: var(--gold-s); display: inline-flex; align-items: center; gap: 7px; }
.roue-result-s { font: 700 12px/1.5 'Archivo', sans-serif; color: var(--mu2); margin-top: 5px; }

.roue-real {
  margin: 20px auto 0; max-width: 400px; border-radius: 20px; padding: 16px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--a) 10%, transparent), color-mix(in srgb, var(--a) 3%, transparent)),
    linear-gradient(180deg, var(--pnl), var(--pnl2));
  border: 1px solid color-mix(in srgb, var(--a) 38%, transparent);
  box-shadow: 0 16px 30px -18px rgba(0,0,0,.8), 0 0 26px -10px color-mix(in srgb, var(--a) 35%, transparent);
}
.roue-real-h { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.roue-real-h h2 { font: 700 15px/1.1 'Archivo', system-ui, sans-serif; display: flex; align-items: center; gap: 7px; }
.roue-real-h .tag { flex: none; font: 600 9.5px/1 'Archivo', sans-serif; letter-spacing: .08em; text-transform: uppercase; color: var(--a-lt); padding: 4px 9px; border-radius: 999px; background: color-mix(in srgb, var(--a) 14%, transparent); border: 1px solid color-mix(in srgb, var(--a) 35%, transparent); }
.roue-real-row { display: flex; align-items: center; gap: 11px; padding: 10px 2px; border-bottom: 1px solid color-mix(in srgb, var(--a) 12%, transparent); }
.roue-real-row:last-of-type { border-bottom: 0; }
.roue-real-ic { width: 38px; height: 38px; flex: none; display: grid; place-items: center; }
.roue-real-ic svg { filter: drop-shadow(0 3px 5px rgba(0,0,0,.4)); }
.roue-real-name { font: 700 13.5px/1.15 'Archivo', system-ui, sans-serif; color: #e9ffd2; }
.roue-real-sub { font: 700 11px/1.3 'Archivo', sans-serif; color: var(--mu2); margin-top: 1px; }
.roue-real-flex { flex: 1; min-width: 0; }
.roue-real-sign { margin-top: 10px; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: rgba(10,7,24,.35); border: 1px dashed color-mix(in srgb, var(--a) 35%, transparent); }
.roue-real-av { width: 32px; height: 32px; flex: none; border-radius: 50%; display: grid; place-items: center; font: 800 15px/1 'Archivo', system-ui, sans-serif; color: #fff; background: linear-gradient(160deg, var(--a-lt), var(--a)); border: 2px solid rgba(255,255,255,.5); }
.roue-real-sign b { display: block; font: 700 12.5px/1.2 'Archivo', system-ui, sans-serif; color: #e9ffd2; }
.roue-real-sign span { font: 700 10.5px/1.3 'Archivo', sans-serif; color: var(--mu2); }

.roue-note { margin: 14px auto 0; max-width: 400px; display: flex; align-items: flex-start; gap: 9px; padding: 12px 14px; border-radius: 16px; background: rgba(124,77,255,.10); border: 1px solid rgba(167,139,250,.22); }
.roue-note svg { width: 16px; height: 16px; flex: none; color: #c9b8ff; margin-top: 1px; }
.roue-note p { font: 700 11.5px/1.5 'Archivo', sans-serif; color: var(--mu); }
.roue-note b { color: #c9b8ff; }

/* Célébration GROS LOT (au lieu du résultat volants) */
.roue-gros { background: linear-gradient(180deg, #2a1a08, #3a2408); border-color: rgba(255,210,74,.55);
  box-shadow: 0 0 34px -6px rgba(255,180,40,.5), inset 0 1px 0 rgba(255,255,255,.12); }
.roue-gros-badge { display: inline-block; font: 800 12px/1 'Archivo', system-ui, sans-serif; letter-spacing: .1em;
  color: #3a2408; background: linear-gradient(180deg, #ffe9a8, #ffd24a); padding: 6px 14px; border-radius: 999px;
  box-shadow: 0 4px 0 #c87d12; }
.roue-gros-lot { margin: 12px 0 4px; display: flex; align-items: center; justify-content: center; gap: 10px; }
.roue-gros-lot .roue-gros-ic { font-size: 30px; }
.roue-gros-lot b { font: 800 20px/1.1 'Archivo', system-ui, sans-serif; color: var(--gold-s); }
.roue-gros-code { margin-top: 8px; font: 700 13px/1.3 'Archivo', sans-serif; color: #fff; }
.roue-gros-code b { font: 800 20px/1 'Archivo', system-ui, sans-serif; letter-spacing: .12em; color: var(--gold);
  display: inline-block; margin-top: 3px; padding: 5px 12px; border-radius: 12px;
  background: rgba(255,210,74,.14); border: 1px dashed rgba(255,210,74,.55); }

/* Mes lots gagnés (le code reste retrouvable après coup) */
.roue-wins { margin: 16px auto 0; max-width: 400px; border-radius: 18px; padding: 14px 16px;
  background: linear-gradient(180deg, var(--pnl), var(--pnl2)); border: 1px solid rgba(255,210,74,.4); }
.roue-wins h3 { font: 700 14px/1.1 'Archivo', system-ui, sans-serif; display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
.roue-wins-row { display: flex; align-items: center; gap: 11px; padding: 9px 0; border-bottom: 1px solid rgba(167,139,250,.14); }
.roue-wins-row:last-child { border-bottom: 0; }
.roue-wins-ic { width: 34px; height: 34px; flex: none; border-radius: 11px; display: grid; place-items: center; font-size: 18px; background: rgba(255,210,74,.12); border: 1px solid rgba(255,210,74,.3); }
.roue-wins-tx { flex: 1; min-width: 0; }
.roue-wins-tx b { display: block; font: 700 13px/1.2 'Archivo', system-ui, sans-serif; color: #fff; }
.roue-wins-tx span { font: 700 11px/1.3 'Archivo', sans-serif; color: var(--mu2); }
.roue-wins-code { flex: none; font: 800 13px/1 'Archivo', system-ui, sans-serif; letter-spacing: .08em; color: var(--gold);
  padding: 6px 10px; border-radius: 10px; background: rgba(255,210,74,.12); border: 1px dashed rgba(255,210,74,.45); }
.roue-wins-code.remis { color: var(--mu2); border-style: solid; border-color: rgba(167,139,250,.3); }

.roue-real-big { flex: none; font: 700 9px/1 'Archivo', sans-serif; letter-spacing: .06em; text-transform: uppercase;
  color: #3a2408; background: linear-gradient(180deg, #ffe9a8, #ffd24a); padding: 3px 7px; border-radius: 999px; }
@media (prefers-reduced-motion: reduce) {
  .roue-chest, .roue-chest.shaking, .roue-chest.opened, .roue-rays { animation: none; }
  .roue-result, .roue-sheet, .roue-sheet-in { animation: none; }
}
</style>`;

// Panneau « gros lots réels » : les lots ACTIVÉS par le moniteur (via
// get_moniteur_rewards) — sinon les 2 lots par défaut. Signé à sa marque.
// Les lots marqués « gros lot » (big) sont réellement gagnables à la roue.
function renderRealLots(lots, moniteurPrenom) {
  const name = (moniteurPrenom || wtR("your_moniteur", "ton moniteur")).trim();
  const initiale = (name.charAt(0) || "R").toUpperCase();
  const list =
    Array.isArray(lots) && lots.length
      ? lots
      : [
          { icon: "🅰️", label: wtR("lot_disque", "Disque A jeune conducteur") },
          {
            icon: "🚗",
            label: wtR("lot_heure", "1 heure de conduite offerte"),
          },
        ];
  const anyBig = list.some((l) => l && l.big);
  const rows = list
    .slice(0, 6)
    .map(
      (l) => `
    <div class="roue-real-row">
      <div class="roue-real-ic">${medLot(l.icon, { size: 34 })}</div>
      <div class="roue-real-flex">
        <div class="roue-real-name">${wrtl(esc(l.label || wtR("gift_fallback", "Cadeau")))}</div>
      </div>
      ${l && l.big ? `<span class="roue-real-big">${wt("big_tag", "À gagner")}</span>` : ""}
    </div>`,
    )
    .join("");
  return `
  <section class="roue-real">
    <div class="roue-real-h">
      <h2>${medallion("cadeau", "pink", { size: 20 })} ${wt("gifts_h", "Vrais cadeaux")}</h2>
      <span class="tag">${anyBig ? wt("tag_live", "En jeu") : wt("tag_soon", "Bientôt")}</span>
    </div>
    ${rows}
    <div class="roue-real-sign">
      <div class="roue-real-av">${esc(initiale)}</div>
      <div>
        <b>${wrtl(`${wt("offered_by", "Offert par")} ${esc(name)} · ${wt("your_moniteur", "ton moniteur")}`)}</b>
        <span>${anyBig ? wrtl(wt("sign_live", "Tente ta chance chaque jour. C’est lui qui offre.")) : wrtl(wt("sign_soon", "C’est lui qui choisit les cadeaux."))}</span>
      </div>
    </div>
  </section>`;
}

// « Mes lots gagnés » : garde le code de retrait à portée après coup.
function renderMyWins(wins) {
  if (!Array.isArray(wins) || !wins.length) return "";
  const rows = wins
    .slice(0, 5)
    .map((w) => {
      const remis = w.status === "remis";
      return `
    <div class="roue-wins-row">
      <div class="roue-wins-ic">${esc(w.lot_icon || "🎁")}</div>
      <div class="roue-wins-tx">
        <b>${wrtl(esc(w.lot_label || wtR("gift_fallback", "Cadeau")))}</b>
        <span>${remis ? wt("win_got", "Récupéré ✓") : wrtl(wt("win_show", "Montre ce code à ton moniteur"))}</span>
      </div>
      <span class="roue-wins-code${remis ? " remis" : ""}">${esc(w.claim_code || "")}</span>
    </div>`;
    })
    .join("");
  return `
  <section class="roue-wins">
    <h3>${wrtl(wt("wins_h", "🏆 Tes lots gagnés"))}</h3>
    ${rows}
  </section>`;
}

// Tics audio programmés pendant un spin — module-level pour pouvoir les couper
// au démontage (sinon les setTimeout continuent de jouer après avoir quitté la page).
const _tickTimers = [];
function clearTickTimers() {
  _tickTimers.forEach(clearTimeout);
  _tickTimers.length = 0;
}

// Feuilles posées sur <body> : elles ne partent pas avec le contenu de #app,
// donc on les retire nous-mêmes au démontage.
const _openSheets = [];

// Démontage (appelé par le router avant de monter la page suivante).
export function unmount() {
  clearTickTimers();
  _openSheets.forEach((s) => s.remove());
  _openSheets.length = 0;
}

export async function mount(root) {
  const me = getCurUser();
  // Élève solo : pas de moniteur → pas de « vrais cadeaux » (c'est lui qui
  // les offre) ; textes neutralisés, panneau + note masqués.
  const solo = isSoloEleve(me);
  if (!me) return;
  track("page_view", { page: "eleve_roue" });

  const prenom =
    (me.prenom || me.nom || "ton moniteur").trim().split(/\s+/)[0] || "R";
  const initiale = prenom.charAt(0).toUpperCase() || "R";

  // État initial : le RPC est-il posé (migration en prod) ? A-t-on déjà tourné ?
  // - 'ready'   : peut tourner pour de vrai (RPC live, pas encore tourné aujourd'hui)
  // - 'done'    : déjà tourné aujourd'hui (RPC live)
  // - 'apercu'  : migration pas encore posée → repli visuel (gate localStorage)
  // En parallèle : l'état du tour du jour + les lots configurés par le moniteur.
  let mode = "apercu";
  let realLots = null;
  let moniteurName = null;
  let myWins = [];
  const [spinRes, rewardsRes, winsRes] = await Promise.allSettled([
    sb
      .from("roue_daily_spins")
      .select("volants")
      .eq("spin_date", todayKey())
      .maybeSingle(),
    sb.rpc("get_moniteur_rewards"),
    sb
      .from("gros_lot_wins")
      .select("lot_label, lot_icon, claim_code, status, won_at")
      .order("won_at", { ascending: false })
      .limit(5),
  ]);
  if (spinRes.status === "fulfilled" && !spinRes.value.error) {
    mode = spinRes.value.data ? "done" : "ready";
  }
  if (rewardsRes.status === "fulfilled" && !rewardsRes.value.error) {
    const d = rewardsRes.value.data;
    if (Array.isArray(d?.lots)) realLots = d.lots;
    moniteurName = d?.moniteur || null;
  }
  if (winsRes.status === "fulfilled" && !winsRes.value.error) {
    myWins = Array.isArray(winsRes.value.data) ? winsRes.value.data : [];
  }
  if (mode === "apercu" && localStorage.getItem(LS_FREE) === todayKey()) {
    mode = "done";
  }

  const disabled = mode === "done";
  const ctaLabel = disabled
    ? wtR("cta_done", "Reviens demain")
    : wtR("cta_free", "Ouvrir");
  const freeLabel = disabled
    ? wtR("free_done", "Ton coffre du jour est déjà ouvert.")
    : wtR("free_ok", "1 coffre offert chaque jour");
  // Le lien dit la vérité : « en jeu » seulement si le moniteur a vraiment
  // posé un gros lot, « bientôt » sinon.
  const anyBig = Array.isArray(realLots) && realLots.some((l) => l && l.big);
  // Un élève solo n'a pas de moniteur : lui promettre des « vrais cadeaux »
  // serait un mensonge, sa feuille ne contient que la note. On change le lien.
  const linkLabel = solo
    ? wtR("how_link", "Comment ça marche")
    : anyBig
      ? wtR("gifts_link_live", "Vrais cadeaux · en jeu")
      : wtR("gifts_link", "Vrais cadeaux · bientôt");

  root.innerHTML = `${STYLE}
<div class="roue">
  <div class="roue-top">
    <button class="roue-back" id="roue-back" aria-label="${wt("back", "Retour")}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <div class="roue-title">${wt("title", "Ton coffre du jour")}</div>
  </div>

  <div class="roue-body">
    <div class="roue-stage">
      <div class="roue-halo" aria-hidden="true"></div>
      <div class="roue-rays" aria-hidden="true"></div>
      <div class="roue-socle" aria-hidden="true"></div>
      <img class="roue-chest" id="roue-chest" src="/skins/chest-closed.png" alt="" draggable="false" />
    </div>

    <div class="roue-foot">
      <button class="roue-cta" id="roue-spin" ${disabled ? "disabled" : ""}>${esc(ctaLabel)}</button>
      <div class="roue-free" id="roue-free">${esc(freeLabel)}</div>
      <div id="roue-result-slot"></div>
      <button class="roue-link" id="roue-more">${esc(linkLabel)}</button>
    </div>
  </div>
</div>`;

  root
    .querySelector("#roue-back")
    ?.addEventListener("click", () => navigate("/boutique"));

  // ── La feuille : tout ce qui encombrait l'écran vit ici ──
  const sheetBody = `
    ${solo ? "" : renderRealLots(realLots, moniteurName)}
    ${renderMyWins(myWins)}
    <div class="roue-note">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
      <p>${solo ? wrtl(wtR("note_solo", ROUE_FR_RICH.note_solo)) : wrtl(wtR("note", ROUE_FR_RICH.note))}</p>
    </div>`;

  root.querySelector("#roue-more")?.addEventListener("click", () => {
    playClick();
    const sheet = document.createElement("div");
    sheet.className = "roue-sheet";
    sheet.innerHTML = `<div class="roue-sheet-in" role="dialog" aria-modal="true">
      <div class="roue-sheet-grip" aria-hidden="true"></div>
      ${sheetBody}
      <button class="roue-sheet-close">${wt("sheet_close", "Fermer")}</button>
    </div>`;
    const close = () => sheet.remove();
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet || e.target.closest(".roue-sheet-close")) close();
    });
    // Posée sur <body>, pas dans .roue : la page anime des transform, et un
    // ancêtre qui se transforme casse le position:fixed de la feuille.
    // unmount() la retire si l'élève quitte la page sans la fermer.
    document.body.appendChild(sheet);
    _openSheets.push(sheet);
  });

  const chest = root.querySelector("#roue-chest");
  const btn = root.querySelector("#roue-spin");
  const free = root.querySelector("#roue-free");
  let busy = false;
  clearTickTimers(); // défensif : aucun tic fantôme d'un montage précédent

  // Le suspense du coffre : quelques tics rapprochés pendant qu'il tressaute,
  // puis le couvercle saute. Beaucoup plus court que le ralenti d'une roue.
  function openChest() {
    if (!chest) return;
    chest.classList.remove("opened");
    chest.classList.add("shaking");
    if (isSoundEnabled()) {
      for (let ms = 160; ms < OPEN_MS - 120; ms += 150) {
        _tickTimers.push(setTimeout(playTick, ms));
      }
    }
    _tickTimers.push(
      setTimeout(() => {
        chest.classList.remove("shaking");
        chest.src = "/skins/chest-open.png";
        chest.classList.add("opened");
      }, OPEN_MS - 120),
    );
  }

  function showResult(volants, apercu) {
    // Ding de fin : plus « précieux » pour un gros gain.
    if (volants >= 50) playReward();
    else playCoin();
    const slot = root.querySelector("#roue-result-slot");
    if (!slot) return;
    slot.innerHTML = `
    <div class="roue-result">
      <div class="roue-result-v">${volantImg(24, { drop: true })}+${volants}</div>
      <div class="roue-result-s">${
        apercu
          ? wrtl(
              wt(
                "res_apercu",
                "Aperçu. Tes volants seront crédités à l’ouverture des coffres.",
              ),
            )
          : wrtl(wt("res_credited", "volants ajoutés à ton solde !"))
      }</div>
    </div>`;
  }

  function showGrosLot(gl) {
    playReward();
    haptic("success");
    const slot = root.querySelector("#roue-result-slot");
    if (!slot) return;
    slot.innerHTML = `
    <div class="roue-result roue-gros">
      <div class="roue-gros-badge">${wt("gros_badge", "🎁 GROS LOT !")}</div>
      <div class="roue-gros-lot"><span class="roue-gros-ic" aria-hidden="true">${esc(gl.icon || "🎁")}</span><b>${wrtl(esc(gl.label || wtR("gift_fallback", "Cadeau")))}</b></div>
      <div class="roue-gros-code">${wrtl(wt("gros_code", "Ton code de retrait"))}<br><b>${esc(gl.claim_code || "")}</b></div>
      <div class="roue-result-s">${wrtl(`${wt("gros_show_pre", "Montre ce code à")} <b>${esc(gl.moniteur || wtR("your_moniteur", "ton moniteur"))}</b> ${wt("gros_show_post", "pour récupérer ton lot. C’est lui qui offre.")}`)}</div>
    </div>`;
  }

  function finishDone() {
    btn.textContent = wtR("cta_done", "Reviens demain");
    btn.disabled = true;
    if (free)
      free.textContent = wtR(
        "free_done",
        "Ton coffre du jour est déjà ouvert.",
      );
    busy = false;
  }

  btn?.addEventListener("click", async () => {
    if (busy || btn.disabled) return;
    busy = true;
    haptic("select");
    playClick(); // son au clic du bouton
    btn.disabled = true;
    btn.textContent = wtR("spinning", "Le coffre s’ouvre…");

    if (mode === "apercu") {
      // Repli visuel : la migration n'est pas posée → aucun crédit réel.
      track("roue.spin", { kind: "apercu" });
      const gain = PALIERS[Math.floor(Math.random() * PALIERS.length)];
      openChest();
      setTimeout(() => {
        try {
          localStorage.setItem(LS_FREE, todayKey());
        } catch {
          /* noop */
        }
        showResult(gain, true);
        finishDone();
        maybeInstallAfterSpin();
      }, OPEN_MS + 100);
      return;
    }

    // Mode réel : le serveur tire ET crédite.
    track("roue.spin", { kind: "free" });
    let res = null;
    try {
      const { data, error } = await sb.rpc("spin_roue_daily");
      if (error) throw error;
      res = data;
    } catch (e) {
      // RPC absent (migration retirée entre-temps) ou réseau → repli doux
      console.warn("[roue] spin_roue_daily failed", e?.message);
      toast(wtR("retry_toast", "Réessaie dans un instant."), "error", 2200);
      btn.disabled = false;
      btn.textContent = wtR("cta_free", "Ouvrir");
      busy = false;
      return;
    }

    if (res?.already) {
      // Le serveur (date de Paris) sait que le coffre du jour est DÉJÀ ouvert,
      // même si le front (date locale) le croyait dispo — cas de la fenêtre
      // minuit → ~02h où l'UTC est en retard d'un jour. On NE joue PAS une
      // fausse ouverture (un coffre qui s'ouvre sans rien créditer =
      // incompréhensible) : on affiche honnêtement l'état « déjà ouvert » et
      // on resynchronise l'état local pour ne plus reproposer le bouton.
      mode = "done";
      try {
        localStorage.setItem(LS_FREE, todayKey());
      } catch {
        /* noop */
      }
      toast(
        wtR(
          "already_toast",
          "Tu as déjà ouvert ton coffre aujourd’hui. Reviens demain !",
        ),
        "info",
        2600,
      );
      finishDone();
      return;
    }

    // Gros lot ! (le serveur a tiré un vrai lot du moniteur)
    if (res?.gros_lot) {
      track("roue.gros_lot_win");
      openChest();
      setTimeout(() => {
        showGrosLot(res.gros_lot);
        finishDone();
        maybeInstallAfterSpin();
      }, OPEN_MS + 100);
      return;
    }

    const volants = res?.volants ?? 10;
    openChest();
    setTimeout(() => {
      showResult(volants, false);
      // Met à jour le solde du header (event écouté dans header-top.js)
      if (typeof res?.new_balance === "number") {
        window.dispatchEvent(
          new CustomEvent("pg-gemmes-changed", {
            detail: { balance: res.new_balance },
          }),
        );
      }
      haptic("tap");
      finishDone();
      maybeInstallAfterSpin();
    }, OPEN_MS + 100);
  });
}
