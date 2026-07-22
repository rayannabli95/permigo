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
import { track } from "@/services/analytics.js";
import { getCurUser } from "@/auth/cur-user.js";
import { discoveryCounterLabel, freeQuota } from "@/utils/free-tier.js";

const COPY = {
  quota: {
    kick: "Mode découverte",
    emoji: "🎉",
    title: "Tu as goûté PermiGo aujourd'hui",
    sub: "Reviens demain pour une nouvelle dose — ou débloque tout ton parcours maintenant, sans attendre.",
  },
  route: {
    kick: "Mode découverte",
    emoji: "🚀",
    title: "Ça, c'est tout ton parcours",
    sub: "Cette partie s'ouvre avec ton Pass : l'entraînement complet, ta progression et tes récompenses.",
  },
};

const PERKS = [
  [
    "♾️",
    "Entraînement sans limite",
    "Questions, fiches et mises en situation à volonté",
  ],
  [
    "🏅",
    "Ta progression + tes récompenses",
    "Compétences, coffres, volants et classement",
  ],
  [
    "🎯",
    "Examen blanc & certification",
    "Tout ce qu'il faut pour être prêt le jour J",
  ],
];

const STYLE = `<style>
.ftw{ max-width:480px; margin:0 auto; min-height:100dvh;
  padding:34px 20px calc(28px + env(safe-area-inset-bottom));
  font-family:'Plus Jakarta Sans','Inter',sans-serif; color:#efeaff;
  display:flex; flex-direction:column; justify-content:center;
  background:
    radial-gradient(130% 44% at 50% -4%, rgba(124,99,255,.34) 0%, rgba(124,99,255,0) 56%),
    linear-gradient(180deg,#241a52 0%,#1e1648 52%,#161138 100%); }
.ftw *{ box-sizing:border-box; }
.ftw-badge{ width:78px; height:78px; margin:0 auto 18px; display:grid; place-items:center;
  font-size:38px; border-radius:24px;
  background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04));
  border:1px solid rgba(245,196,81,.34); box-shadow:0 16px 34px -18px rgba(6,2,22,.9); }
.ftw-kick{ text-align:center; font-weight:800; font-size:11px; letter-spacing:.16em;
  text-transform:uppercase; color:#f5c451; margin-bottom:8px; }
.ftw-title{ text-align:center; font-family:'Baloo 2','Plus Jakarta Sans',cursive;
  font-weight:800; font-size:26px; line-height:1.15; margin:0 auto 10px; max-width:340px; }
.ftw-sub{ text-align:center; font-size:14px; font-weight:600; color:#c3bdf0;
  margin:0 auto 22px; max-width:330px; line-height:1.5; }
.ftw-perks{ display:flex; flex-direction:column; gap:10px; margin-bottom:24px; }
.ftw-perk{ display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:16px;
  background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); }
.ftw-perk .ico{ flex:none; width:34px; height:34px; display:grid; place-items:center; font-size:19px;
  border-radius:11px; background:rgba(143,123,255,.16); }
.ftw-perk .tx{ min-width:0; }
.ftw-perk .tx b{ display:block; font-size:14px; font-weight:800; color:#fff; }
.ftw-perk .tx span{ display:block; font-size:11.5px; font-weight:600; color:#a99ddb; margin-top:1px; }
.ftw-unlock{ width:100%; padding:17px; border:0; border-radius:16px; cursor:pointer;
  font:800 16.5px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.01em; color:#241a45;
  background:linear-gradient(180deg,#ffe9b0,#f0a93f);
  box-shadow:0 12px 24px -10px rgba(240,170,44,.7), inset 0 1px 0 rgba(255,255,255,.5);
  transition:transform .1s ease; }
.ftw-unlock:active{ transform:scale(.98); }
.ftw-explore{ display:block; margin:14px auto 0; background:none; border:0; cursor:pointer;
  font:700 14px/1 'Plus Jakarta Sans',sans-serif; color:#b3aede;
  text-decoration:underline; text-underline-offset:3px; }
.ftw-note{ text-align:center; font-size:11.5px; font-weight:600; color:#8f86c4; margin:16px 0 0; }
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

  const c = COPY[reason] || COPY.quota;
  const counter =
    reason === "quota" && kind
      ? `<p class="ftw-note">${esc(discoveryCounterLabel(kind))}</p>`
      : "";

  root.innerHTML = `${STYLE}<div class="ftw">
    <div>
      <div class="ftw-badge" aria-hidden="true">${c.emoji}</div>
      <div class="ftw-kick">${esc(c.kick)}</div>
      <h1 class="ftw-title" tabindex="-1">${esc(c.title)}</h1>
      <p class="ftw-sub">${esc(c.sub)}</p>
      <div class="ftw-perks">
        ${PERKS.map(
          ([ico, t, s]) => `<div class="ftw-perk">
            <span class="ico" aria-hidden="true">${ico}</span>
            <span class="tx"><b>${esc(t)}</b><span>${esc(s)}</span></span>
          </div>`,
        ).join("")}
      </div>
      <button class="ftw-unlock" id="ftw-unlock" type="button">Débloquer mon parcours</button>
      <button class="ftw-explore" id="ftw-explore" type="button">Continuer à explorer</button>
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
  font:800 11.5px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.01em;
  color:#f5c451; background:rgba(245,196,81,.12); border:1px solid rgba(245,196,81,.32); }
</style>`;

// ─── Bannière découverte (compteur du jour) pour un hub (ex. Réviser) ───────
const BANNER_STYLE = `<style>
.ft-banner{ display:flex; align-items:center; gap:10px; flex-wrap:wrap;
  margin:0 0 14px; padding:9px 13px; border-radius:14px;
  background:rgba(245,196,81,.08); border:1px solid rgba(245,196,81,.26); }
.ft-banner b{ font:800 11px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:.1em;
  text-transform:uppercase; color:#f5c451; }
.ft-banner .items{ display:flex; gap:9px; flex-wrap:wrap; }
.ft-banner .items span{ font:700 12px/1 'Nunito','Inter',sans-serif; color:#c7c0ee; }
</style>`;

export function discoveryBannerHTML() {
  const q = freeQuota("quiz");
  const f = freeQuota("fiche");
  const s = freeQuota("scene");
  return `${BANNER_STYLE}<div class="ft-banner" role="status">
    <b>Mode découverte</b>
    <span class="items">
      <span>${q.used}/${q.max} questions</span>
      <span>${f.used}/${f.max} fiche</span>
      <span>${s.used}/${s.max} scène</span>
    </span>
  </div>`;
}
