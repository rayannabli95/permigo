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
    route_title: "Here is your whole course",
    route_sub:
      "This part opens with your Pass. The full training. Your progress. Your rewards.",
    perk0_t: "Training without limits",
    perk0_d: "Questions · lesson sheets · road scenarios",
    perk1_t: "Your progress and your rewards",
    perk1_d: "Skills · chests · steering wheels · ranking",
    perk2_t: "Mock exam and certification",
    perk2_d: "Everything you need to be ready on test day",
    unlock: "Open my course",
    explore: "Keep exploring",
    banner_free: "Free account",
    banner_lessons: (n) => `First ${n} lessons`,
    banner_quiz: (u, m) => `${u}/${m} questions`,
    banner_scene: (u, m) => `${u}/${m} scenario`,
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
    route_title: "هذا مسارك كاملاً",
    route_sub: "هذا الجزء يُفتح مع باقتك. التدريب الكامل وتقدّمك ومكافآتك.",
    perk0_t: "تدريب بلا حدود",
    perk0_d: "أسئلة · دروس · سيناريوهات الطريق",
    perk1_t: "تقدّمك ومكافآتك",
    perk1_d: "المهارات · الصناديق · المقاود · الترتيب",
    perk2_t: "امتحان تجريبي وشهادة",
    perk2_d: "كل ما تحتاجه لتكون جاهزاً يوم الامتحان",
    unlock: "افتح مساري",
    explore: "متابعة الاستكشاف",
    banner_free: "حساب مجاني",
    banner_lessons: (n) => `أول ${n} دروس`,
    banner_quiz: (u, m) => `${u}/${m} أسئلة`,
    banner_scene: (u, m) => `${u}/${m} سيناريو`,
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
  route: {
    kick: "Mode découverte",
    ico: "map",
    title: "Voilà tout ton parcours",
    sub: "Cette partie s'ouvre avec ton Pass : l'entraînement complet, ta progression et tes récompenses.",
  },
};

// Icônes maison (utils/icons.js) — pas d'emoji : ils changent de dessin d'un
// téléphone à l'autre, cassent l'alignement en arabe et font « brouillon ».
const PERKS = [
  [
    "zap",
    "Entraînement sans limite",
    "Questions, fiches et mises en situation à volonté",
  ],
  [
    "award",
    "Ta progression + tes récompenses",
    "Compétences, coffres, volants et classement",
  ],
  [
    "target",
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
.ftw-perk{ display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:16px;
  background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); }
.ftw-perk .ico{ flex:none; width:34px; height:34px; display:grid; place-items:center; color:#b9a9ff;
  border-radius:11px; background:rgba(143,123,255,.16); }
.ftw-perk .tx{ min-width:0; }
.ftw-perk .tx b{ display:block; font-size:14px; font-weight:800; color:#fff; }
.ftw-perk .tx span{ display:block; font-size:11.5px; font-weight:600; color:#a99ddb; margin-top:1px; }
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
/* Arabe : le conteneur porte dir="rtl", donc les rangées d'avantages se
   retournent toutes seules (l'icône passe à droite). On ne redresse à la main
   que ce que le flux ne retourne pas : l'alignement du texte des rangées. */
.ftw[dir="rtl"] .ftw-perk .tx{ text-align:right; }
@media (prefers-reduced-motion: reduce){ .ftw-unlock{ transition:none; } }
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

  root.innerHTML = `${STYLE}<div class="ftw"${isAr() ? ' dir="rtl" lang="ar"' : ""}>
    <div>
      <div class="ftw-badge" aria-hidden="true">${icon(c.ico, { size: 34, strokeWidth: 2 })}</div>
      <div class="ftw-kick">${wt(`${ck}_kick`, c.kick)}</div>
      <h1 class="ftw-title" tabindex="-1">${wt(`${ck}_title`, c.title)}</h1>
      <p class="ftw-sub">${wt(`${ck}_sub`, c.sub)}</p>
      <div class="ftw-perks">
        ${PERKS.map(
          ([ico, t, s], i) => `<div class="ftw-perk">
            <span class="ico" aria-hidden="true">${icon(ico, { size: 18, strokeWidth: 2.2 })}</span>
            <span class="tx"><b>${wt(`perk${i}_t`, t)}</b><span>${wt(`perk${i}_d`, s)}</span></span>
          </div>`,
        ).join("")}
      </div>
      <button class="ftw-unlock" id="ftw-unlock" type="button">${wt("unlock", "Débloquer mon parcours")}</button>
      <button class="ftw-explore" id="ftw-explore" type="button">${wt("explore", "Continuer à explorer")}</button>
      ${counter}
    </div>
  </div>`;

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
    </span>
  </div>`;
}
