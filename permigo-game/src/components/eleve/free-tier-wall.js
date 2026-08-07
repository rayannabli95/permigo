// ═══════════════════════════════════════════════════════════════
// Mur « mode découverte » — écran chaleureux affiché à l'élève SOLO non payé
// quand un quota quotidien est épuisé (3 questions / 1 fiche / 1 scène) OU
// qu'il touche une surface premium (récompenses, examen blanc, certification…).
//
// Jamais culpabilisant : on félicite (« Tu as goûté PermiGo »), on invite. Le
// CTA principal ouvre le mur de paiement EXISTANT (pass-requis.js) ; un CTA
// secondaire renvoie explorer le reste. Réutilisé par le router (surface murée)
// et par les pages quiz / fiches / en-situation (quota épuisé).
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { track } from "@/services/analytics.js";
import { getCurUser } from "@/auth/cur-user.js";
import { getLang } from "@/utils/lang.js";
import {
  discoveryCounterLabel,
  freeQuota,
  FREE_SUBS,
} from "@/utils/free-tier.js";

// ─── i18n (traduction seule, repli FR) ───────────────────────────
// Cet écran est le SEUL que le compte gratuit revoit tous les jours. Le laisser
// en français, c'est promettre « ton app dans ta langue » dans la pub puis
// accueillir l'élève en français au premier mur. « Pass » = باقة, « mise en
// situation » = سيناريو الطريق (jamais « موقف » : ça veut aussi dire parking).
const FTW_I18N = {
  en: {
    quota_kick: "Discovery mode",
    quota_title: "That is your taste of PermiGo for today",
    quota_sub:
      "Come back tomorrow for a fresh round. Or open your whole course right now.",
    lesson_kick: "Free account",
    lesson_title: "You finished the free lessons",
    lesson_sub:
      "The first 3 are yours for good. The rest of the course opens with your Pass.",
    route_kick: "Discovery mode",
    route_title: "Your road continues.",
    route_cta: "Open what's next",
    route_amount: "€4.99/month",
    route_price: "3 days money-back · cancel anytime in one click",
    perk0_t: "Training without limits",
    perk0_d: "Questions · lesson sheets · road scenarios",
    perk1_t: "Your progress and your rewards",
    perk1_d: "Skills · chests · steering wheels · ranking",
    perk2_t: "Mock exam and certification",
    perk2_d: "Everything you need to be ready on test day",
    unlock: "Unlock everything · €4.99/month",
    explore: "Keep exploring",
    banner_free: "Free account",
    banner_lessons: (n) => `First ${n} lessons`,
    banner_quiz: (u, m) => `${u}/${m} questions`,
    banner_scene: (u, m) => `${u}/${m} scenario`,
    banner_duel: "Unlimited friend duels",
  },
  ar: {
    quota_kick: "وضع الاكتشاف",
    quota_title: "لقد جرّبت PermiGo اليوم",
    quota_sub: "عُد غداً لجولة جديدة. أو افتح مسارك كاملاً الآن.",
    lesson_kick: "حساب مجاني",
    lesson_title: "أنهيت الدروس المجانية",
    lesson_sub:
      "الدروس الثلاثة الأولى لك إلى الأبد. بقية المسار تُفتح مع باقتك.",
    route_kick: "وضع الاكتشاف",
    route_title: "طريقك يتواصل.",
    route_cta: "افتح ما يلي",
    route_amount: "€4.99/شهر",
    route_price: "استرداد خلال 3 أيام · إلغاء بنقرة واحدة",
    perk0_t: "تدريب بلا حدود",
    perk0_d: "أسئلة · دروس · سيناريوهات الطريق",
    perk1_t: "تقدّمك ومكافآتك",
    perk1_d: "المهارات · الصناديق · المقاود · الترتيب",
    perk2_t: "امتحان تجريبي وشهادة",
    perk2_d: "كل ما تحتاجه لتكون جاهزاً يوم الامتحان",
    unlock: "افتح كل شيء · €4.99/شهر",
    explore: "متابعة الاستكشاف",
    banner_free: "حساب مجاني",
    banner_lessons: (n) => `أول ${n} دروس`,
    banner_quiz: (u, m) => `${u}/${m} أسئلة`,
    banner_scene: (u, m) => `${u}/${m} سيناريو`,
    banner_duel: "تحدي الأصدقاء بلا حدود",
  },
};

/** Traduit et échappe. Repli sur le français si la clé manque. */
function wt(key, fr, ...args) {
  const l = getLang();
  const v = l !== "fr" ? FTW_I18N[l]?.[key] : null;
  if (typeof v === "function") return esc(v(...args));
  return esc(v || fr);
}

/** L'arabe se lit de droite à gauche : sinon la ponctuation et les compteurs
 *  « 2/3 » se posent du mauvais côté, et l'icône d'un bloc reste à gauche. */
function isAr() {
  return getLang() === "ar";
}

const COPY = {
  quota: {
    kick: "Mode découverte",
    ico: "sparkle",
    title: "Tu as goûté PermiGo aujourd'hui",
    sub: "Reviens demain pour une nouvelle dose. Ou débloque tout ton parcours maintenant, sans attendre.",
  },
  // ⚠️ Une leçon au-delà des 3 offertes ne s'ouvrira PAS demain : surtout pas
  // de « reviens demain » ici, ce serait une promesse fausse (les questions et
  // la scène, elles, reviennent bien chaque jour → COPY.quota).
  lesson: {
    kick: "Compte gratuit",
    ico: "key",
    title: "Tu as fini les leçons offertes",
    sub: "Les 3 premières sont à toi pour toujours. La suite du parcours s'ouvre avec ton Pass.",
  },
  // Le mur qui remplace toute la page /parcours : une scène, pas une fiche
  // produit (décision Rayan, 08/08 : « fin de démo de jeu », pas de liste de
  // fonctionnalités). Titre et sous-titre volontairement minimaux, l'image
  // fait le travail.
  route: {
    kick: "Mode découverte",
    ico: "map",
    title: "Ta route continue.",
    sub: "",
  },
};

// Le rideau de garage grand ouvert (ce que l'élève entrevoit, généré via
// Higgsfield le 08/08 avec l'accord explicite de Rayan pour CET écran
// seulement, la règle « zéro asset généré » reste la norme partout ailleurs)
// puis le même garage rideau presque baissé : monde1nuit.webp, déjà dans le
// dépôt, aucune génération pour cette seconde image.
const HERO_OPEN = "/skins/eleve/mur-porte-ouverte.webp";
const HERO_CLOSED = "/skins/eleve/mur-porte-fermee.webp";

// Avantages listés : uniquement pour les murs sobres (quota/lesson). Le mur
// « route » cinématique n'en a plus, décision Rayan 08/08.
const PERKS = [
  [
    "Entraînement sans limite",
    "Questions, fiches et mises en situation à volonté",
  ],
  [
    "Ta progression + tes récompenses",
    "Compétences, coffres, volants et classement",
  ],
  [
    "Examen blanc & certification",
    "Tout ce qu'il faut pour être prêt le jour J",
  ],
];

const STYLE = `<style>
.ftw{ max-width:480px; margin:0 auto; min-height:100dvh;
  padding:34px 20px calc(28px + env(safe-area-inset-bottom));
  font-family:'Archivo',sans-serif; color:#efeaff;
  display:flex; flex-direction:column; justify-content:center;
  background:
    radial-gradient(130% 44% at 50% -4%, rgba(124,99,255,.34) 0%, rgba(124,99,255,0) 56%),
    linear-gradient(180deg,#241a52 0%,#1e1648 52%,#161138 100%); }
.ftw *{ box-sizing:border-box; }
.ftw-badge{ width:78px; height:78px; margin:0 auto 18px; display:grid; place-items:center;
  color:#f5c451; border-radius:24px;
  background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04));
  border:1px solid rgba(245,196,81,.34); box-shadow:0 16px 34px -18px rgba(6,2,22,.9); }
.ftw-kick{ text-align:center; font-weight:800; font-size:11px; letter-spacing:.16em;
  text-transform:uppercase; color:#f5c451; margin-bottom:8px; }
/* ⚠️ Couleur explicite obligatoire : la règle h1 globale de l'app repeint les
   titres en sombre → sur ce fond nuit, le titre devenait illisible (vu à
   l'écran le 31/07). Piège déjà payé sur les pages publiques dark.
   (Pas d'accent grave dans ce commentaire : on est dans un gabarit JS.) */
.ftw-title{ text-align:center; font-family:'Archivo', system-ui, sans-serif;
  color:#fff;
  font-weight:800; font-size:26px; line-height:1.15; margin:0 auto 10px; max-width:340px; }
.ftw-sub{ text-align:center; font-size:14px; font-weight:600; color:#c3bdf0;
  margin:0 auto 22px; max-width:330px; line-height:1.5; }
.ftw-perks{ display:flex; flex-direction:column; gap:10px; margin-bottom:24px; }
.ftw-perk{ padding:12px 14px 12px 16px; border-radius:16px; border-left:3px solid #f5c451;
  background:rgba(255,255,255,.05); border-top:1px solid rgba(255,255,255,.1);
  border-right:1px solid rgba(255,255,255,.1); border-bottom:1px solid rgba(255,255,255,.1); }
.ftw-perk b{ display:block; font-size:14px; font-weight:800; color:#fff; }
.ftw-perk span{ display:block; font-size:11.5px; font-weight:600; color:#a99ddb; margin-top:1px; }
.ftw-unlock{ width:100%; padding:17px; border:0; border-radius:16px; cursor:pointer;
  font:800 16.5px/1 'Archivo',sans-serif; letter-spacing:-.01em; color:#241a45;
  background:linear-gradient(180deg,#ffe9b0,#f0a93f);
  box-shadow:0 12px 24px -10px rgba(240,170,44,.7), inset 0 1px 0 rgba(255,255,255,.5);
  transition:transform .1s ease; }
.ftw-unlock:active{ transform:scale(.98); }
.ftw-explore{ display:block; margin:14px auto 0; background:none; border:0; cursor:pointer;
  font:700 14px/1 'Archivo',sans-serif; color:#b3aede;
  text-decoration:underline; text-underline-offset:3px; }
.ftw-note{ text-align:center; font-size:11.5px; font-weight:600; color:#8f86c4; margin:16px 0 0; }
.ftw-guarantee{ text-align:center; font-size:11.5px; font-weight:600; color:#a99ddb;
  margin:12px auto 0; max-width:300px; line-height:1.5; }
/* Arabe : le conteneur porte dir="rtl", le texte s'aligne à droite et le
   liseré doré (repère visuel, pas une flèche) passe du même côté que le texte. */
.ftw[dir="rtl"] .ftw-perk{ border-left:1px solid rgba(255,255,255,.1); border-right:3px solid #f5c451; }
.ftw[dir="rtl"] .ftw-perk b, .ftw[dir="rtl"] .ftw-perk span{ text-align:right; }
@media (prefers-reduced-motion: reduce){ .ftw-unlock{ transition:none; } }

/* ─── Mur « route » : la scène cinématique ────────────────────────────────
   La porte est grande ouverte au chargement (on entrevoit les 4 mondes),
   puis elle se referme sur une fente (état où l'écran se stabilise). Le
   texte n'apparaît qu'une fois la porte refermée : l'image raconte, le
   texte ne fait que confirmer. Décision Rayan 08/08 : « fin de démo de jeu
   vidéo », pas de fiche produit. */
.ftw-route{ position:relative; overflow:hidden; background:#0d0820; min-height:100dvh;
  padding:0; display:block; }
.ftw-cine{ position:absolute; inset:0; }
.ftw-cine-layer{ position:absolute; inset:0; background-size:cover; background-position:center; }
.ftw-cine-open{ background-image:url("${HERO_OPEN}");
  animation: ftw-cine-open-seq 2.4s cubic-bezier(.4,0,.2,1) forwards; }
.ftw-cine-closed{ background-image:url("${HERO_CLOSED}"); opacity:0;
  animation: ftw-cine-closed-seq 2.4s cubic-bezier(.4,0,.2,1) forwards; }
@keyframes ftw-cine-open-seq{
  0%{ opacity:0; transform:scale(1.05); }
  12%{ opacity:1; transform:scale(1.05); }
  58%{ opacity:1; transform:scale(1); }
  82%{ opacity:0; transform:scale(.985); }
  100%{ opacity:0; transform:scale(.985); }
}
@keyframes ftw-cine-closed-seq{
  0%{ opacity:0; transform:scale(1.03); }
  58%{ opacity:0; transform:scale(1.03); }
  82%{ opacity:1; transform:scale(1); }
  100%{ opacity:1; transform:scale(1); }
}
.ftw-cine-fade{ position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(13,8,32,.1) 0%, rgba(13,8,32,.22) 38%, rgba(13,8,32,.8) 74%, #0d0820 100%); }
.ftw-route-content{ position:relative; z-index:1; min-height:100dvh;
  display:flex; flex-direction:column; justify-content:flex-end; align-items:center;
  gap:22px; padding:0 26px calc(36px + env(safe-area-inset-bottom)); text-align:center; }
.ftw-route-content .ftw-kick{ margin:0; text-shadow:0 2px 12px rgba(0,0,0,.6); }
/* Le titre porte tout le poids émotionnel de l'écran : plus grand, plus
   serré, une ombre portée pour rester lisible quel que soit l'endroit de la
   photo où il tombe (le rideau n'a pas toujours la même luminosité). */
.ftw-route-content .ftw-title{ font-size:34px; letter-spacing:-.02em; max-width:280px;
  margin:-14px 0 0; text-shadow:0 4px 24px rgba(0,0,0,.55); }
.ftw-route-content .ftw-cta{ display:flex; flex-direction:column; align-items:center;
  gap:14px; width:100%; }
.ftw-route-content .ftw-unlock{ max-width:360px; }
.ftw-route-content .ftw-price{ display:flex; flex-direction:column; gap:3px; }
.ftw-route-content .ftw-price b{ font:800 15px/1 'Archivo',sans-serif; color:#fff; }
.ftw-route-content .ftw-price span{ font:600 12px/1.5 'Archivo',sans-serif; color:#9d94c9; }
.ftw-route-content .ftw-explore{ margin:0; }
.ftw-reveal{ opacity:0; animation: ftw-reveal .7s cubic-bezier(.16,.84,.44,1) forwards;
  animation-delay:var(--d,0s); }
@keyframes ftw-reveal{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:translateY(0); } }
@media (prefers-reduced-motion: reduce){
  .ftw-cine-open, .ftw-cine-closed{ animation:none; }
  .ftw-cine-open{ opacity:0; }
  .ftw-cine-closed{ opacity:1; }
  .ftw-reveal{ opacity:1; transform:none; animation:none; }
}
</style>`;

/**
 * Monte le mur découverte dans `root`.
 * @param {HTMLElement} root
 * @param {{me?:object, reason?:'quota'|'route', kind?:string|null, routeName?:string|null}} opts
 */
export async function mountFreeTierWall(
  root,
  { me = null, reason = "quota", kind = null, routeName = null } = {},
) {
  const user = me || getCurUser();
  track("freetier.paywall_view", {
    reason,
    kind: kind || null,
    route: routeName || null,
  });

  // Certaines surfaces masquent le chrome (arène / quiz plein écran) : on le
  // restaure pour que l'élève garde sa navigation vers le reste de la découverte.
  document.body.classList.remove("sit-immersive", "pq-immersive");

  // Une fiche murée = « tu as fini les leçons offertes » (définitif), pas
  // « reviens demain » (le quota quotidien, lui, ne concerne que quiz + scène).
  const ck =
    reason === "quota" && kind === "fiche"
      ? "lesson"
      : COPY[reason]
        ? reason
        : "quota";
  const c = COPY[ck];
  const counter =
    reason === "quota" && kind
      ? `<p class="ftw-note">${esc(discoveryCounterLabel(kind))}</p>`
      : "";

  // Le mur « route » remplace toute la page /parcours : c'est LUI qui doit
  // vendre, donc lui seul porte la scène cinématique. Les murs « quota » et
  // « lesson » gardent le gabarit sobre (ils coupent une action ponctuelle,
  // pas tout le produit) : icône, sous-titre, avantages listés.
  const markup =
    ck === "route"
      ? `<div class="ftw ftw-route"${isAr() ? ' dir="rtl" lang="ar"' : ""}>
          <div class="ftw-cine" aria-hidden="true">
            <div class="ftw-cine-layer ftw-cine-open"></div>
            <div class="ftw-cine-layer ftw-cine-closed"></div>
            <div class="ftw-cine-fade"></div>
          </div>
          <div class="ftw-route-content">
            <div class="ftw-kick ftw-reveal" style="--d:1.65s">${wt("route_kick", c.kick)}</div>
            <h1 class="ftw-title ftw-reveal" style="--d:1.8s" tabindex="-1">${wt("route_title", c.title)}</h1>
            <div class="ftw-cta ftw-reveal" style="--d:2.15s">
              <button class="ftw-unlock" id="ftw-unlock" type="button">${wt("route_cta", "Ouvrir la suite")}</button>
              <p class="ftw-price"><b>${wt("route_amount", "4,99 €/mois")}</b><span>${wt("route_price", "3 jours satisfait ou remboursé · résiliable en un clic")}</span></p>
              <button class="ftw-explore" id="ftw-explore" type="button">${wt("explore", "Continuer à explorer")}</button>
            </div>
          </div>
        </div>`
      : `<div class="ftw"${isAr() ? ' dir="rtl" lang="ar"' : ""}>
          <div>
            <div class="ftw-badge" aria-hidden="true">${icon(c.ico, { size: 34, strokeWidth: 2 })}</div>
            <div class="ftw-kick">${wt(`${ck}_kick`, c.kick)}</div>
            <h1 class="ftw-title" tabindex="-1">${wt(`${ck}_title`, c.title)}</h1>
            <p class="ftw-sub">${wt(`${ck}_sub`, c.sub)}</p>
            <div class="ftw-perks">
              ${PERKS.map(
                ([t, s], i) => `<div class="ftw-perk">
                  <b>${wt(`perk${i}_t`, t)}</b><span>${wt(`perk${i}_d`, s)}</span>
                </div>`,
              ).join("")}
            </div>
            <button class="ftw-unlock" id="ftw-unlock" type="button">${wt("unlock", "Tout débloquer · 4,99 €/mois")}</button>
            <button class="ftw-explore" id="ftw-explore" type="button">${wt("explore", "Continuer à explorer")}</button>
            ${counter}
          </div>
        </div>`;

  root.innerHTML = `${STYLE}${markup}`;

  root.querySelector("#ftw-unlock")?.addEventListener("click", async () => {
    track("freetier.unlock_click", { reason, kind: kind || null });
    document.body.classList.remove("sit-immersive", "pq-immersive");
    const { mount } = await import("@/pages/eleve/pass-requis.js");
    await mount(root, user);
  });

  root.querySelector("#ftw-explore")?.addEventListener("click", () => {
    document.body.classList.remove("sit-immersive", "pq-immersive");
    location.hash = "#/reviser";
  });
}

// ─── Compteur discret réutilisable (pill « Découverte : 2/3 questions ») ─────
export function discoveryPillHTML(kind) {
  return `<span class="ft-pill" role="status">${esc(discoveryCounterLabel(kind))}</span>`;
}

// Feuille de style du pill (à injecter une fois par page qui l'utilise).
export const DISCOVERY_PILL_STYLE = `<style>
.ft-pill{ display:inline-flex; align-items:center; gap:6px;
  padding:5px 12px; border-radius:999px; white-space:nowrap;
  font:800 11.5px/1 'Archivo',sans-serif; letter-spacing:-.01em;
  color:#f5c451; background:rgba(245,196,81,.12); border:1px solid rgba(245,196,81,.32); }
</style>`;

// ─── Bannière découverte (compteur du jour) pour un hub (ex. Réviser) ───────
const BANNER_STYLE = `<style>
.ft-banner{ display:flex; align-items:center; gap:10px; flex-wrap:wrap;
  margin:0 0 14px; padding:9px 13px; border-radius:14px;
  background:rgba(245,196,81,.08); border:1px solid rgba(245,196,81,.26); }
.ft-banner b{ font:800 11px/1 'Archivo',sans-serif; letter-spacing:.1em;
  text-transform:uppercase; color:#f5c451; }
.ft-banner .items{ display:flex; gap:9px; flex-wrap:wrap; }
.ft-banner .items span{ font:700 12px/1 'Archivo',sans-serif; color:#c7c0ee; }
</style>`;

export function discoveryBannerHTML() {
  const q = freeQuota("quiz");
  const s = freeQuota("scene");
  // Les fiches ne sont plus un quota : les 3 premières leçons sont ouvertes en
  // permanence (cf. free-tier.js). On affiche donc un acquis, pas un décompte.
  return `${BANNER_STYLE}<div class="ft-banner" role="status"${isAr() ? ' dir="rtl" lang="ar"' : ""}>
    <b>${wt("banner_free", "Compte gratuit")}</b>
    <span class="items">
      <span>${wt("banner_lessons", `${FREE_SUBS.length} premières leçons`, FREE_SUBS.length)}</span>
      <span>${wt("banner_quiz", `${q.used}/${q.max} questions`, q.used, q.max)}</span>
      <span>${wt("banner_scene", `${s.used}/${s.max} scène`, s.used, s.max)}</span>
      <!-- « Défie tes amis » est OUVERT au compte gratuit et ne consomme aucun
           quota. Sans cette ligne, le gratuit ne voit que ses limites et ne
           découvre jamais la seule chose illimitée qu'il possède. -->
      <span>${wt("banner_duel", "Duel entre amis sans limite")}</span>
    </span>
  </div>`;
}
