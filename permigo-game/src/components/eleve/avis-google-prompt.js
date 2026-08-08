// ═══════════════════════════════════════════════════════════════
// Avis Google — écran plein écran qui demande un avis Google à l'élève,
// une seule fois dans toute sa vie sur PermiGo : au moment où il certifie
// sa TOUTE PREMIÈRE compétence (le moment où il croit le plus dans l'app).
//
// DA « Arène 3D » assortie à competence-unlock.js (même nuit violet + or,
// même famille d'animations à ressort) mais un motif à elle : des étoiles,
// pas un coffre. Ce n'est pas une récompense, c'est une demande.
//
// Déclenché depuis valider-seul.js juste après un `self_validate_competence`
// réussi. Rien à appeler ailleurs : `maybeAskGoogleReview()` fait ses
// propres vérifications (lien configuré, pas déjà demandé, bien la 1re
// compétence) et ne montre rien si une seule condition manque.
//
// ⚠️ AVANT LA MISE EN LIGNE : coller ici le lien « Demander des avis » une
// fois la fiche Google PermiGo validée (cf. le guide envoyé à Rayan).
// Tant que ce lien est vide, cet écran ne s'affiche jamais.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { playReveal, playStar } from "@/utils/sound.js";

// 👉 À REMPLIR PAR RAYAN dès que la fiche Google PermiGo est validée.
export const GOOGLE_REVIEW_URL = "";

const ASKED_KEY = "permigo:avis_google_asked_v1";
const STYLE_ID = "agp-style";

function alreadyAsked() {
  try {
    return (
      typeof localStorage !== "undefined" && !!localStorage.getItem(ASKED_KEY)
    );
  } catch {
    return false;
  }
}

function markAsked() {
  try {
    localStorage.setItem(ASKED_KEY, "1");
  } catch {
    /* quota / navigation privée — best-effort, tant pis pour la 2e visite */
  }
}

/** Nombre de compétences distinctes acquises (moniteur + élève solo confondus). */
async function countAcquired(meId) {
  const [valRes, selfRes] = await Promise.allSettled([
    sb
      .from("validations")
      .select("competence_id")
      .eq("eleve_id", meId)
      .eq("statut", "acquis"),
    sb.from("self_validations").select("competence_id").eq("eleve_id", meId),
  ]);
  const ids = new Set();
  for (const r of valRes.value?.data || [])
    if (r.competence_id) ids.add(r.competence_id);
  for (const r of selfRes.value?.data || [])
    if (r.competence_id) ids.add(r.competence_id);
  return ids.size;
}

/**
 * Montre l'écran si et seulement si : un lien est configuré, l'élève n'a
 * jamais été sollicité, et c'est bien sa toute première compétence acquise.
 * Fire-and-forget : n'importe quelle erreur reste silencieuse, la
 * certification elle-même ne doit jamais en dépendre.
 */
export async function maybeAskGoogleReview() {
  if (!GOOGLE_REVIEW_URL) return;
  if (alreadyAsked()) return;
  const me = getCurUser();
  if (!me?.id) return;
  let total = 0;
  try {
    total = await countAcquired(me.id);
  } catch {
    return;
  }
  if (total !== 1) return;
  markAsked();
  await showAvisGooglePrompt();
}

function ensureStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

const STAR_SVG = `<svg viewBox="0 0 24 24"><polygon points="12 1.5 15.4 8.6 23 9.6 17.5 15 18.9 22.6 12 18.9 5.1 22.6 6.5 15 1 9.6 8.6 8.6 12 1.5"/></svg>`;

/**
 * @returns {Promise<'cta'|'close'>}
 */
export function showAvisGooglePrompt() {
  ensureStyle();

  try {
    track("eleve.avis_google_shown", {});
  } catch {
    /* best-effort */
  }

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  return new Promise((resolve) => {
    const ov = document.createElement("div");
    ov.className = "agp-ov";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", "Un mot sur PermiGo ?");

    ov.innerHTML = `
      <div class="agp-rays" aria-hidden="true"></div>
      <div class="agp-glow" aria-hidden="true"></div>
      <div class="agp-dust" aria-hidden="true"></div>
      <div class="agp-vignette" aria-hidden="true"></div>

      <button class="agp-close" type="button" aria-label="Fermer">×</button>

      <main class="agp-stage">
        <div class="agp-kicker"><span>Aide nous à grandir</span></div>

        <div class="agp-focal" aria-hidden="true">
          <div class="agp-beam"></div>
          <div class="agp-star agp-star--big">${STAR_SVG}</div>
          <div class="agp-star s1">${STAR_SVG}</div>
          <div class="agp-star s2">${STAR_SVG}</div>
          <div class="agp-star s3">${STAR_SVG}</div>
          <div class="agp-star s4">${STAR_SVG}</div>
        </div>

        <div class="agp-titleWrap">
          <h1 class="agp-title">Un mot sur PermiGo ?</h1>
          <p class="agp-sub">Tu viens de certifier ta toute première compétence.</p>
        </div>

        <p class="agp-body">Un avis Google prend deux minutes et aide d'autres élèves à nous trouver.</p>

        <div class="agp-ctaWrap">
          <button type="button" class="agp-cta" id="agp-yes">Je laisse un avis</button>
          <button type="button" class="agp-ghost" id="agp-later">Plus tard</button>
        </div>
      </main>

      <img class="agp-mascot" src="/skins/mascot-celebrate.png" alt="" aria-hidden="true" onerror="this.style.display='none'" />
    `;

    document.body.appendChild(ov);

    try {
      if (navigator.vibrate) navigator.vibrate([0, 24, 30, 48]);
    } catch {
      /* noop */
    }
    try {
      playReveal();
    } catch {
      /* noop */
    }

    void ov.offsetWidth;
    ov.classList.add("agp-show");

    let done = false;
    const close = (src) => {
      if (done) return;
      done = true;
      ov.classList.remove("agp-show");
      ov.classList.add("agp-closing");
      document.removeEventListener("keydown", onKey);
      setTimeout(() => {
        ov.remove();
        resolve(src);
      }, 280);
    };

    ov.querySelector("#agp-yes").addEventListener("click", () => {
      try {
        if (navigator.vibrate) navigator.vibrate(20);
      } catch {
        /* noop */
      }
      try {
        playStar();
      } catch {
        /* noop */
      }
      try {
        track("eleve.avis_google_accepted", {});
      } catch {
        /* noop */
      }
      try {
        window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
      } catch {
        /* noop */
      }
      close("cta");
    });
    ov.querySelector("#agp-later").addEventListener("click", () => {
      try {
        track("eleve.avis_google_dismissed", {});
      } catch {
        /* noop */
      }
      close("close");
    });
    ov.querySelector(".agp-close").addEventListener("click", () => {
      try {
        track("eleve.avis_google_dismissed", {});
      } catch {
        /* noop */
      }
      close("close");
    });

    const onKey = (e) => {
      if (e.key === "Escape") close("close");
    };
    document.addEventListener("keydown", onKey);

    // esc()/escAttr importés pour cohérence avec le reste de l'app même si
    // ce module n'injecte aucune donnée utilisateur en innerHTML (rien à
    // échapper : tous les textes sont statiques).
    void esc;
    void escAttr;
  });
}

const CSS = `
.agp-ov{
  --night-core:#2d1b69; --night-mid:#1a1040; --night-edge:#0d0a1a;
  --gold-1:#ffe9a8; --gold-2:#ffcf52; --gold-3:#f0a818; --gold-deep:#b9760a;
  --violet-ink:#efe7ff; --violet-soft:#c9b8ff;
  --agp-ease:cubic-bezier(.22,.61,.36,1);
  --agp-spring:cubic-bezier(.34,1.56,.64,1);

  position:fixed; inset:0; z-index:10060;
  overflow:hidden; isolation:isolate;
  font-family:'Archivo',system-ui,sans-serif;
  background:radial-gradient(120% 90% at 50% 38%, var(--night-core) 0%, var(--night-mid) 46%, var(--night-edge) 100%);
  opacity:0; transition:opacity .3s var(--agp-ease);
  -webkit-font-smoothing:antialiased;
}
.agp-ov.agp-show{ opacity:1; }
.agp-ov.agp-closing{ opacity:0; }

.agp-rays{
  position:absolute; left:50%; top:30%; width:680px; height:680px;
  transform:translate(-50%,-50%);
  background:repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,207,82,.16) 0deg 5deg, transparent 5deg 13deg);
  -webkit-mask-image:radial-gradient(closest-side,#000 6%,rgba(0,0,0,.5) 40%,transparent 72%);
          mask-image:radial-gradient(closest-side,#000 6%,rgba(0,0,0,.5) 40%,transparent 72%);
  opacity:0; animation:agpRaysSpin 30s linear infinite, agpFadeIn 1.1s var(--agp-ease) .1s forwards;
}
@keyframes agpRaysSpin{ to{ transform:translate(-50%,-50%) rotate(360deg); } }
@keyframes agpFadeIn{ to{ opacity:.8; } }

.agp-glow{
  position:absolute; left:50%; top:30%; width:380px; height:380px;
  transform:translate(-50%,-50%) scale(.6);
  background:radial-gradient(closest-side, rgba(255,225,140,.5) 0%, rgba(255,190,80,.24) 38%, transparent 70%);
  filter:blur(6px); opacity:0;
  animation:agpGlowIn .9s var(--agp-ease) .15s forwards, agpGlowBreath 4s var(--agp-ease) 1.3s infinite;
}
@keyframes agpGlowIn{ to{ opacity:1; transform:translate(-50%,-50%) scale(1); } }
@keyframes agpGlowBreath{ 0%,100%{ opacity:.9; transform:translate(-50%,-50%) scale(1);} 50%{ opacity:1; transform:translate(-50%,-50%) scale(1.05);} }

.agp-dust{ position:absolute; inset:0; pointer-events:none; }
.agp-dust::before{ content:""; position:absolute; top:0; left:0; width:3px; height:3px; border-radius:50%;
  box-shadow:10vw 10vh 0 0 rgba(255,231,168,.85),24vw 6vh 0 0 rgba(255,207,82,.65),38vw 15vh 0 0 rgba(255,255,255,.55),58vw 8vh 0 0 rgba(255,225,140,.6),72vw 13vh 0 0 rgba(255,207,82,.7),86vw 6vh 0 0 rgba(255,255,255,.5),18vw 22vh 0 0 rgba(255,207,82,.45),60vw 24vh 0 0 rgba(255,231,168,.5);
  animation:agpTwinkle 4.4s ease-in-out infinite; }
@keyframes agpTwinkle{ 0%,100%{ opacity:.4; } 50%{ opacity:1; } }

.agp-vignette{ position:absolute; inset:0; z-index:1; pointer-events:none;
  background:radial-gradient(120% 95% at 50% 32%, transparent 40%, rgba(5,4,14,.62) 100%); }

.agp-close{
  position:absolute; top:max(16px,env(safe-area-inset-top)); right:16px; z-index:9;
  width:40px; height:40px; min-width:44px; min-height:44px; border-radius:50%;
  display:grid; place-items:center; cursor:pointer;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); color:#fff;
  font-size:20px; line-height:1; opacity:0; animation:agpFadeLate 1s ease 1.4s forwards;
  -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
}
.agp-close:hover{ background:rgba(255,255,255,.16); }
.agp-close:focus-visible{ outline:2px solid var(--gold-2); outline-offset:2px; }
@keyframes agpFadeLate{ to{ opacity:1; } }

.agp-stage{
  position:relative; z-index:2; height:100%;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:max(18px,env(safe-area-inset-top)) 26px max(20px,env(safe-area-inset-bottom));
  max-width:420px; margin:0 auto; text-align:center;
}

.agp-kicker{
  display:inline-flex; align-items:center; padding:7px 16px; border-radius:999px;
  background:linear-gradient(180deg, rgba(255,207,82,.20), rgba(255,207,82,.07));
  border:1px solid rgba(255,207,82,.45);
  box-shadow:0 1px 0 rgba(255,255,255,.18) inset, 0 6px 18px -8px rgba(255,180,40,.55);
  opacity:0; animation:agpPopIn .6s var(--agp-spring) .2s forwards;
}
.agp-kicker span{ font-weight:700; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--gold-1); text-shadow:0 1px 6px rgba(255,180,40,.4); }
@keyframes agpPopIn{ 0%{ opacity:0; transform:scale(.7);} 100%{ opacity:1; transform:scale(1);} }

.agp-focal{ position:relative; margin-top:18px; width:230px; height:120px; }
.agp-beam{
  position:absolute; left:50%; top:0; width:150px; height:150px;
  transform:translateX(-50%) scaleY(0); transform-origin:top center;
  background:linear-gradient(180deg, rgba(255,205,82,.5) 0%, rgba(255,221,120,.2) 55%, transparent 100%);
  clip-path:polygon(38% 0, 62% 0, 82% 100%, 18% 100%); filter:blur(3px); mix-blend-mode:screen; opacity:0;
  animation:agpBeamDown .6s var(--agp-spring) .45s forwards;
}
@keyframes agpBeamDown{ to{ opacity:.85; transform:translateX(-50%) scaleY(1); } }

.agp-star{ position:absolute; color:var(--gold-2); filter:drop-shadow(0 3px 8px rgba(0,0,0,.4)) drop-shadow(0 0 10px rgba(255,205,82,.65));
  opacity:0; transform:scale(0) rotate(-25deg); }
.agp-star svg{ width:100%; height:100%; fill:currentColor; display:block; }
.agp-star--big{ left:50%; top:6px; width:64px; height:64px; margin-left:-32px;
  animation:agpStarPop .6s var(--agp-spring) .55s forwards, agpStarFloat 3.6s ease-in-out 1.3s infinite; }
.agp-star.s1{ left:6%; top:36px; width:26px; height:26px; animation:agpStarPop .5s var(--agp-spring) .75s forwards, agpStarFloat 3.2s ease-in-out 1.5s infinite; }
.agp-star.s2{ right:4%; top:30px; width:22px; height:22px; animation:agpStarPop .5s var(--agp-spring) .85s forwards, agpStarFloat 3.6s ease-in-out 1.6s infinite reverse; }
.agp-star.s3{ left:16%; top:82px; width:20px; height:20px; animation:agpStarPop .5s var(--agp-spring) .95s forwards, agpStarFloat 3s ease-in-out 1.7s infinite; }
.agp-star.s4{ right:14%; top:78px; width:24px; height:24px; animation:agpStarPop .5s var(--agp-spring) 1.05s forwards, agpStarFloat 3.4s ease-in-out 1.8s infinite reverse; }
@keyframes agpStarPop{ 0%{ opacity:0; transform:scale(0) rotate(-25deg);} 60%{ opacity:1; transform:scale(1.15) rotate(6deg);} 100%{ opacity:1; transform:scale(1) rotate(0deg);} }
@keyframes agpStarFloat{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-6px);} }

.agp-titleWrap{ margin-top:20px; }
.agp-title{
  font-weight:800; font-size:clamp(24px,7.5vw,30px); line-height:1.12; letter-spacing:-.3px;
  max-width:15ch; margin:0 auto; text-wrap:balance; color:#fff;
  background:linear-gradient(180deg,#ffffff 0%,#fff7e0 58%,#ffd86b 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
  text-shadow:0 2px 0 rgba(70,38,6,.4), 0 4px 14px rgba(0,0,0,.5);
  transform:scale(.7); opacity:0; animation:agpTitleIn .6s var(--agp-spring) 1.15s forwards;
}
@keyframes agpTitleIn{ 0%{ opacity:0; transform:scale(.7);} 60%{ opacity:1;} 100%{ opacity:1; transform:scale(1);} }
.agp-sub{ margin-top:8px; font-weight:500; font-size:14.5px; color:var(--violet-soft);
  opacity:0; animation:agpFadeUp .55s var(--agp-ease) 1.3s forwards; }
.agp-body{ margin-top:14px; font-weight:500; font-size:14px; line-height:1.5; color:var(--violet-soft); opacity:.9;
  max-width:32ch; opacity:0; animation:agpFadeUp .55s var(--agp-ease) 1.4s forwards; }
@keyframes agpFadeUp{ from{ opacity:0; transform:translateY(10px);} to{ opacity:.92; transform:translateY(0);} }

.agp-ctaWrap{ margin-top:26px; width:100%; max-width:300px; display:flex; flex-direction:column; gap:10px;
  opacity:0; animation:agpFadeUp .55s var(--agp-ease) 1.55s forwards; }
.agp-cta{
  position:relative; width:100%; min-height:56px; border:0; border-radius:18px; cursor:pointer;
  font-family:'Archivo',sans-serif; font-weight:800; font-size:16.5px; letter-spacing:.2px; color:#4a2500;
  background:linear-gradient(180deg,#ffd76e,#f0a93f);
  box-shadow:0 1.5px 0 rgba(255,255,255,.55) inset, 0 6px 0 #b46a10, 0 10px 22px -6px rgba(180,106,16,.6);
  transition:transform .08s var(--agp-ease), box-shadow .08s var(--agp-ease), filter .15s var(--agp-ease);
  -webkit-user-select:none; user-select:none;
}
.agp-cta:hover{ filter:brightness(1.04); }
.agp-cta:active{ transform:translateY(4px); box-shadow:0 1.5px 0 rgba(255,255,255,.55) inset, 0 2px 0 #b46a10, 0 5px 12px -6px rgba(180,106,16,.5); }
.agp-cta:focus-visible{ outline:3px solid rgba(255,255,255,.6); outline-offset:3px; }

.agp-ghost{
  width:100%; min-height:44px; border:0; background:transparent; cursor:pointer;
  font-family:'Archivo',sans-serif; font-weight:700; font-size:14px; color:var(--violet-soft);
  opacity:.8; transition:opacity .15s var(--agp-ease);
}
.agp-ghost:hover{ opacity:1; }
.agp-ghost:focus-visible{ outline:2px solid var(--gold-2); outline-offset:2px; border-radius:8px; }

.agp-mascot{ position:absolute; left:12px; bottom:max(16px,env(safe-area-inset-bottom)); width:76px; height:auto; z-index:3;
  opacity:0; filter:drop-shadow(0 8px 14px rgba(0,0,0,.5));
  animation:agpMascotIn .6s var(--agp-spring) 1.5s forwards, agpMascotBounce 1.7s var(--agp-ease) 2.2s infinite; pointer-events:none; }
@keyframes agpMascotIn{ to{ opacity:1; } }
@keyframes agpMascotBounce{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-10px);} }

@media (max-height:720px){
  .agp-focal{ width:190px; height:96px; }
  .agp-star--big{ width:52px; height:52px; margin-left:-26px; }
  .agp-mascot{ width:62px; }
}
@media (prefers-reduced-motion: reduce){
  .agp-ov *, .agp-ov *::before, .agp-ov *::after{ animation:none !important; transition:none !important; }
  .agp-rays{ opacity:.7; }
  .agp-glow,.agp-star,.agp-title,.agp-sub,.agp-body,.agp-kicker,.agp-ctaWrap,.agp-mascot,.agp-beam,.agp-close{ opacity:1 !important; transform:none !important; }
}
`;
