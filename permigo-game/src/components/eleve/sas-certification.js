// ═══════════════════════════════════════════════════════════════
// Sas d'entrée en mode certification.
//
// Un rituel court (~3,5s) juste avant que l'élève entre en certification
// (mission ou quiz) : gros plan sur le regard de la mascotte, fond noir,
// puis « Mode certification » qui bascule sur ON. Le but n'est pas de faire
// patienter, c'est de faire comprendre que ce qui suit n'est plus un simple
// entraînement (demandé par Rayan, 08/08/2026).
//
// Vidéo générée (Higgsfield, autorisation explicite de Rayan pour CETTE
// séquence précise — la règle par défaut du projet reste zéro asset généré
// par IA, cf. permigo-game/CLAUDE.md).
//
// Vit sur <body>, pas dans #app (même piège que ouvrirLaScene() du Mode
// Pilote dans valider-seul.js : un parent animé en transform redevient le
// bloc de référence d'un position:fixed).
// ═══════════════════════════════════════════════════════════════
import { haptic } from "@/utils/haptic.js";

const VIDEO_SRC = "/video/sas-certification-2026-08-08.mp4";
const POSTER_SRC = "/video/sas-certification-2026-08-08-poster.jpg";
// Instant où l'écran est déjà quasi noir dans la vidéo : c'est là que le
// texte doit apparaître, jamais avant (il se lirait mal sur l'image encore
// claire du regard).
const TOGGLE_AT_S = 3.05;
// Filet : si la vidéo ne joue jamais (réseau lent, format refusé, autoplay
// bloqué par le navigateur), on ne bloque JAMAIS l'élève plus que ça.
const MAX_WAIT_MS = 4500;

const STYLE = `<style>
  .sas-certif-host { position: fixed; inset: 0; z-index: 400; background: #000;
    display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .sas-certif-video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sas-certif-toggle { position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 18px; opacity: 0; pointer-events: none; }
  .sas-certif-toggle.show { animation: sasToggleIn 500ms cubic-bezier(.2,.9,.3,1.2) forwards; }
  @keyframes sasToggleIn { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: scale(1); } }
  .sas-certif-label { font: 800 13px/1 'Archivo', sans-serif; letter-spacing: .12em; color: #efe9ff; text-transform: uppercase; }
  .sas-certif-switch { width: 84px; height: 44px; border-radius: 999px;
    background: linear-gradient(180deg, #2a1f4d, #1a1330); border: 2px solid rgba(167,139,250,.5);
    position: relative; animation: sasSwitchPulse 700ms ease-out 80ms both; }
  .sas-certif-switch::before { content: ''; position: absolute; top: 4px; left: 4px;
    width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(180deg, #fff, #e6def7);
    animation: sasKnobOn 380ms cubic-bezier(.3,1.4,.5,1) 80ms both; box-shadow: 0 2px 8px rgba(0,0,0,.4); }
  @keyframes sasKnobOn { to { transform: translateX(36px); } }
  .sas-certif-switch::after { content: ''; position: absolute; inset: 0; border-radius: 999px;
    background: rgba(167,139,250,0); animation: sasFillOn 380ms ease 80ms both; }
  @keyframes sasFillOn { to { background: rgba(139,92,246,.35); box-shadow: inset 0 0 16px rgba(167,139,250,.5); } }
  @keyframes sasSwitchPulse { 0% { box-shadow: 0 0 0 0 rgba(167,139,250,.6); } 60% { box-shadow: 0 0 0 14px rgba(167,139,250,0); } 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0); } }
  .sas-certif-state { font: 900 18px/1 'Archivo', sans-serif; letter-spacing: .04em;
    background: linear-gradient(90deg, #c4b5fd, #ffffff); -webkit-background-clip: text; background-clip: text;
    color: transparent; opacity: 0; animation: sasStateIn 300ms ease 260ms forwards; }
  @keyframes sasStateIn { to { opacity: 1; } }
  .sas-certif-skip { position: absolute; bottom: max(28px, env(safe-area-inset-bottom)); left: 0; right: 0;
    text-align: center; color: rgba(255,255,255,.4); font: 600 11px/1 'Archivo', sans-serif; letter-spacing: .06em; }
  @media (prefers-reduced-motion: reduce) { .sas-certif-switch, .sas-certif-switch::before, .sas-certif-switch::after,
    .sas-certif-toggle.show, .sas-certif-state { animation: none !important; opacity: 1 !important; } }
</style>`;

/**
 * Joue le sas et résout quand il faut enchaîner sur la certification (fin
 * naturelle, tap de l'élève pour passer, ou filet de sécurité). Ne rejette
 * jamais : un souci vidéo ne doit jamais empêcher la certification.
 * @returns {Promise<void>}
 */
export function ouvrirSasCertification() {
  return new Promise((resolve) => {
    try {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        resolve();
        return;
      }
    } catch {}

    const hote = document.createElement("div");
    hote.className = "sas-certif-host";
    hote.innerHTML = `${STYLE}
      <video class="sas-certif-video" src="${VIDEO_SRC}" poster="${POSTER_SRC}" playsinline autoplay></video>
      <div class="sas-certif-toggle" id="sas-toggle">
        <div class="sas-certif-label">Mode certification</div>
        <div class="sas-certif-switch"></div>
        <div class="sas-certif-state">ON</div>
      </div>
      <div class="sas-certif-skip">Toucher l'écran pour passer</div>`;
    document.body.appendChild(hote);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("hashchange", finish);
      clearTimeout(safety);
      hote.remove();
      resolve();
    };

    // Même piège que le Mode Pilote (ouvrirLaScene) : vit sur <body>, donc un
    // changement de route pendant l'animation doit la fermer proprement.
    window.addEventListener("hashchange", finish, { once: true });
    const safety = setTimeout(finish, MAX_WAIT_MS);

    const video = hote.querySelector("video");
    const toggle = hote.querySelector("#sas-toggle");
    video.addEventListener("timeupdate", () => {
      if (video.currentTime >= TOGGLE_AT_S) toggle.classList.add("show");
    });
    video.addEventListener("ended", finish);
    // Autoplay bloqué (rare, iOS strict) : on ne fait jamais attendre
    // l'élève devant un écran figé, on passe direct.
    video.play().catch(finish);

    hote.addEventListener("click", () => {
      haptic("tap");
      finish();
    });
  });
}
