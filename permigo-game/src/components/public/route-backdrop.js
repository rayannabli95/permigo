// ═══════════════════════════════════════════════════════════════
// Le décor de la page de vente : la route de montagne, derrière TOUTE la page
//
// Ce que ça fait : l'illustration « Prépare ta leçon » (celle du hero élève)
// tient le fond du premier au dernier écran, et le défilement de la page
// PILOTE la vidéo. On descend, la voiture monte vers le col ; on remonte,
// elle redescend. Le décor recule et s'assombrit au passage pour laisser le
// texte lisible.
//
// ── Les trois pièges, et comment on les évite ──
//
// 1. LE POIDS. La vidéo fait 2,8 Mo. On ne la met JAMAIS dans le chemin du
//    premier affichage : le fond est d'abord l'image fixe (38 Ko, déjà servie
//    par l'app), et la vidéo n'est demandée qu'une fois la page posée. Si le
//    réseau est lent, coupé, ou si l'appareil demande moins d'animations, on
//    reste sur l'image et personne ne voit de trou.
//
// 2. LE DÉPLACEMENT DANS LA VIDÉO. Une vidéo normale n'a une image-clé que
//    toutes les N images : se déplacer dedans oblige le navigateur à repartir
//    de la dernière clé, et ça saccade. Le fichier servi ici est réencodé
//    avec une image-clé sur CHAQUE image (ffmpeg -g 1 -keyint_min 1). C'est
//    ce qui rend le pilotage au doigt fluide sur mobile.
//
// 3. `animation-timeline: view()` NE MARCHE PAS ICI. Le décor est en position
//    fixe : il ne défile jamais lui-même, sa progression resterait bloquée à
//    zéro sans la moindre erreur. On se branche donc explicitement sur le
//    défilement du document, avec `scroll(root block)`.
// ═══════════════════════════════════════════════════════════════

const VIDEO = "/video/route-pass-scrub.mp4";
// L'image de repli est celle du hero élève « Prépare ta leçon » : même route,
// même heure. Elle est déjà dans l'app, elle ne coûte rien de plus.
const POSTER = "/skins/prepare-lecon/midi.webp";

// La route, la voiture et le drapeau vivent sur la DROITE de l'illustration.
// Un cadrage centré ne montre que du ciel et du désert : sur un téléphone en
// portrait, on ne voit pas la route du tout.
const CADRAGE = "85% 50%";

export const BACKDROP_STYLE = `
  /* ══════════ Le décor de route ══════════ */
  .pv-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  .pv-bg-media {
    position: absolute; inset: 0;
    background: url("${POSTER}") ${CADRAGE} / cover no-repeat;
    transform-origin: ${CADRAGE};
  }
  .pv-bg-media video {
    width: 100%; height: 100%; object-fit: cover; object-position: ${CADRAGE};
    display: block; opacity: 0; transition: opacity .5s ease;
  }
  .pv-bg-media video.on { opacity: 1; }
  /* Le voile : c'est SON opacity qui monte au défilement. Jamais un
     filter: brightness, qui repasse par le processeur à chaque image. */
  .pv-bg-veil { position: absolute; inset: 0; background: #170f38; opacity: 0; }
  /* Dégradé permanent : garantit la lisibilité du premier écran, même quand
     le voile est encore à zéro. */
  /* ⚠️ Le HAUT est très sombre, et ce n'est pas un choix esthétique. Le ciel
     de l'illustration est clair : la barre de langues, la ligne « auto-école
     ou candidat libre » et le sous-titre y devenaient illisibles (constaté à
     l'écran, ce sont les seules couleurs douces de la page, --ink-mu et
     --ink-soft). Le milieu reste ouvert, c'est là que la route se voit. */
  .pv-bg-grad {
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg, rgba(23,15,56,.78) 0%, rgba(23,15,56,.60) 26%, rgba(23,15,56,.30) 52%, rgba(23,15,56,.80) 87%, rgba(23,15,56,.96) 100%),
      radial-gradient(100% 44% at 50% 0%, rgba(255,206,77,.13), transparent 58%);
  }
  /* Variante « texte en bas ». Quand le titre est posé au BAS du premier
     écran, le haut n'a plus rien à protéger : on le laisse presque nu et la
     route se voit enfin en grand. C'est la différence qui faisait que la
     maquette respirait et pas la page. */
  .pv-bg--bas .pv-bg-grad {
    background:
      linear-gradient(180deg, rgba(23,15,56,.34) 0%, rgba(23,15,56,.10) 22%, rgba(23,15,56,.14) 46%, rgba(23,15,56,.72) 78%, rgba(23,15,56,.96) 100%);
  }

  /* La page passe au-dessus du décor et perd son propre fond. Le modificateur
     est nécessaire : les écrans de retour de paiement réutilisent .pv sans
     décor, et doivent garder leur dégradé plein. */
  .pv.pv-onbg { position: relative; z-index: 1; background: none; background-color: transparent; }
  /* Filet de sécurité sur les deux lignes en couleur douce du premier écran :
     le dégradé ci-dessus les couvre, l'ombre les tient même si l'image change
     un jour. Le h1 a déjà la sienne. */
  .pv-onbg .pv-kicker, .pv-onbg .pv-lead { text-shadow: 0 2px 6px rgba(12,7,32,.9); }

  @supports (animation-timeline: scroll()) {
    @media (prefers-reduced-motion: no-preference) {
      @keyframes pvBgRecede { 0% { transform: scale(1); } 100% { transform: scale(1.2); } }
      /* Le voile monte VITE sur le premier tiers (le prix et les preuves
         doivent se lire sans effort), puis se stabilise. La route reste
         visible en fond jusqu'en bas, elle ne disparaît pas. */
      @keyframes pvBgVeil { 0% { opacity: 0; } 32% { opacity: .86; } 100% { opacity: .93; } }
      .pv-bg-media { animation: pvBgRecede linear both; animation-timeline: scroll(root block); }
      .pv-bg-veil  { animation: pvBgVeil   linear both; animation-timeline: scroll(root block); }
    }
  }
  /* Sans scroll-driven (vieux navigateur) ou si l'appareil demande moins
     d'animations : le décor ne bouge pas et le voile est posé une bonne fois,
     à un niveau qui garantit la lecture partout. */
  @supports not (animation-timeline: scroll()) {
    .pv-bg-veil { opacity: .86; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pv-bg-media { animation: none; }
    .pv-bg-veil { animation: none; opacity: .86; }
    .pv-bg-media video { transition: none; }
  }
`;

/** Le décor, à poser en FRÈRE de `.pv` (jamais dedans : `.pv` a un
 *  `overflow-x: clip` qui rognerait un enfant en position fixe). */
export const backdropHTML = ({ texte = "haut" } = {}) => `
  <div class="pv-bg${texte === "bas" ? " pv-bg--bas" : ""}" aria-hidden="true">
    <div class="pv-bg-media"></div>
    <div class="pv-bg-veil"></div>
    <div class="pv-bg-grad"></div>
  </div>`;

/**
 * Charge la vidéo une fois la page posée, puis lui fait suivre le doigt.
 * Ne renvoie rien : si quoi que ce soit manque à l'appel, on garde l'image
 * fixe et la page reste exactement telle qu'elle est.
 * @param {HTMLElement} root
 */
export function wireBackdrop(root) {
  const media = root.querySelector(".pv-bg-media");
  if (!media) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Une vidéo de 2,8 Mo n'a rien à faire sur un forfait compté. Le navigateur
  // dit quand il est en mode économie de données ou sur un réseau lent.
  const net = navigator.connection;
  if (net && (net.saveData || /(^|-)2g$/.test(net.effectiveType || ""))) return;

  const charger = () => {
    const v = document.createElement("video");
    v.muted = true;
    v.defaultMuted = true; // ⚠️ iOS lit l'ATTRIBUT, pas seulement la propriété
    v.playsInline = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", ""); // vieux iOS
    v.preload = "auto";
    v.setAttribute("aria-hidden", "true");
    v.src = VIDEO;

    // ⚠️⚠️ LE PIÈGE QUI A FAIT « la vidéo ne se joue pas » SUR TÉLÉPHONE.
    // On ne montre la vidéo QUE lorsqu'une vraie image a été peinte. Sur iOS,
    // une vidéo qui n'a jamais été LUE ne dessine rien quand on se contente de
    // déplacer `currentTime` : l'élément restait posé par-dessus l'image fixe,
    // vide, et le décor semblait mort. Tant qu'aucune image n'est peinte, on
    // garde l'illustration, qui est belle et qui suit déjà le défilement.
    const montrer = () => v.classList.add("on");
    if ("requestVideoFrameCallback" in v) v.requestVideoFrameCallback(montrer);
    else v.addEventListener("seeked", montrer, { once: true });

    v.addEventListener(
      "loadedmetadata",
      () => {
        const duree = v.duration;
        if (!isFinite(duree) || duree <= 0) return; // illisible → on garde l'image

        // L'amorçage : un play() suivi d'un pause() immédiat réveille le
        // décodeur. Muette et `playsinline`, la lecture est autorisée sans
        // geste de l'utilisateur. Si elle est refusée quand même, on continue :
        // sur les navigateurs de bureau le déplacement suffit.
        const amorce = v.play();
        if (amorce && typeof amorce.then === "function")
          amorce.then(() => v.pause()).catch(() => {});

        let visee = 0;
        let pos = 0;
        let raf = 0;

        const avancement = () => {
          const max =
            document.documentElement.scrollHeight - window.innerHeight;
          return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        };
        const tick = () => {
          pos += (visee - pos) * 0.14; // lissage
          if (Math.abs(visee - pos) < 0.0006) pos = visee;
          v.currentTime = pos * (duree - 0.06);
          raf = pos === visee ? 0 : requestAnimationFrame(tick);
        };
        const onScroll = () => {
          visee = avancement();
          if (!raf) raf = requestAnimationFrame(tick);
        };

        visee = pos = avancement();
        v.currentTime = pos * (duree - 0.06);
        // `passive` : l'écoute ne fait QUE relever une valeur, le déplacement
        // réel se joue dans la boucle rAF, qui s'arrête d'elle-même.
        addEventListener("scroll", onScroll, { passive: true });
        addEventListener("resize", onScroll);
      },
      { once: true },
    );

    media.appendChild(v);
  };

  // Après l'affichage, jamais pendant. requestIdleCallback si le navigateur
  // le connaît, sinon un simple délai : dans les deux cas la page est déjà
  // lisible et cliquable quand le téléchargement commence.
  if ("requestIdleCallback" in window)
    requestIdleCallback(charger, { timeout: 2500 });
  else setTimeout(charger, 1200);
}
