// ═══════════════════════════════════════════════════════════════
// Le décor de la page de vente : la route de montagne, derrière TOUTE la page
//
// Ce que ça fait : l'illustration « Prépare ta leçon » (celle du hero élève)
// tient le fond du premier au dernier écran. La vidéo tourne en boucle toute
// seule, et le DÉFILEMENT fait reculer le décor et monter un voile sombre pour
// laisser le texte lisible.
//
// ⚠️⚠️ POURQUOI LA VIDÉO NE SE PILOTE PLUS AU DOIGT (07/08/2026)
// Elle l'a fait : la position dans la page donnait la position dans le film.
// C'était joli, et ça coûtait très cher en image. Pour pouvoir se déplacer
// dedans sans saccade il faut une image-clé sur CHAQUE image (ffmpeg -g 1),
// or une image-clé ne compresse rien : tout le budget partait là-dedans et il
// ne restait plus rien pour la qualité. Résultat, du 720p baveux en 2,8 Mo.
// Rayan : « la vidéo est en qualité merdique, au pire laisse-la se jouer
// seule ». En lecture normale, le même extrait tient en 1080p propre pour
// 963 Ko. Meilleure image, trois fois plus léger. Le mouvement au défilement
// reste, il est fait en CSS et ne coûte rien.
// ⛔ Ne pas re-brancher le pilotage au doigt sans refaire ce calcul.
//
// ── Les deux pièges qui restent ──
//
// 1. LE POIDS. La vidéo n'est JAMAIS dans le chemin du premier affichage : le
//    fond est d'abord l'image fixe (92 Ko sur téléphone), et la vidéo n'est
//    demandée qu'une fois la page posée. Réseau lent, mode économie de
//    données, ou appareil qui demande moins d'animations : on reste sur
//    l'image et personne ne voit de trou. Cette image se voit donc pendant
//    plusieurs secondes chez tout le monde : elle mérite sa définition.
//
// 2. `animation-timeline: view()` NE MARCHE PAS ICI. Le décor est en position
//    fixe : il ne défile jamais lui-même, sa progression resterait bloquée à
//    zéro sans la moindre erreur. On se branche donc explicitement sur le
//    défilement du document, avec `scroll(root block)`.
// ═══════════════════════════════════════════════════════════════

// ⚠️⚠️ POURQUOI DEUX JEUX D'IMAGES, UN PAR FORMAT D'ÉCRAN (07/08/2026)
// Le décor était servi en un seul fichier paysage. Sur un téléphone tenu à la
// verticale, un fichier 16/9 posé en `cover` déborde énormément sur les côtés :
// on n'en montrait qu'une bande de 499 px de large, étirée sur les 1170 pixels
// réels de l'écran. Trois fois trop peu. Rayan, à raison : « on dirait du
// 360p ». Le fond fixe était pire encore, 312 px étirés sur 1170.
// On découpe donc la bande réellement visible à la source, en pleine
// résolution, et tout le poids part dans ce qui se voit.
// ⛔ Ne pas revenir à un fichier unique : un décor plein cadre en portrait,
//    c'est 74 % des pixels téléchargés puis jetés hors de l'écran.
//
// ⚠️ NOM DE FICHIER NEUF à chaque réencodage : un même nom, et les caches
// (navigateur, service worker, CDN) resservent l'ancienne vidéo à vie.
const DECORS = {
  // Téléphone à la verticale : la bande découpée, aux pixels de l'écran.
  portrait: {
    video: "/video/route-pass-portrait.mp4",
    poster: "/video/route-pass-portrait.webp",
    cadrage: "50% 50%",
  },
  // Tablette et ordinateur : l'illustration entière. La route, la voiture et
  // le drapeau vivent sur la DROITE ; un cadrage centré ne montrerait que du
  // ciel et du désert.
  large: {
    video: "/video/route-pass-large.mp4",
    poster: "/video/route-pass-large.webp",
    cadrage: "85% 50%",
  },
};

// Le seuil : plus haut que large, donc un téléphone tenu normalement. C'est le
// seul cas où le fichier paysage gaspille vraiment ses pixels.
const PORTRAIT = "(max-aspect-ratio: 3/4)";

export const BACKDROP_STYLE = `
  /* ══════════ Le décor de route ══════════ */
  .pv-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  .pv-bg-media {
    position: absolute; inset: 0;
    background: url("${DECORS.large.poster}") ${DECORS.large.cadrage} / cover no-repeat;
    transform-origin: ${DECORS.large.cadrage};
  }
  .pv-bg-media video {
    width: 100%; height: 100%; object-fit: cover; object-position: ${DECORS.large.cadrage};
    display: block; opacity: 0; transition: opacity .5s ease;
  }
  .pv-bg-media video.on { opacity: 1; }
  /* Téléphone à la verticale : la bande déjà découpée. Elle est cadrée au
     centre, et le point de fuite du zoom suit, sinon le décor dériverait sur
     le côté en reculant. */
  @media ${PORTRAIT} {
    .pv-bg-media {
      background-image: url("${DECORS.portrait.poster}");
      background-position: ${DECORS.portrait.cadrage};
      transform-origin: ${DECORS.portrait.cadrage};
    }
    .pv-bg-media video { object-position: ${DECORS.portrait.cadrage}; }
  }
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
 * Charge la vidéo une fois la page posée et la laisse tourner en boucle.
 * Ne renvoie rien : si quoi que ce soit manque à l'appel, on garde l'image
 * fixe et la page reste exactement telle qu'elle est. Le mouvement au
 * défilement (recul + voile) est en CSS et vit sa vie dans les deux cas.
 * @param {HTMLElement} root
 */
export function wireBackdrop(root) {
  const media = root.querySelector(".pv-bg-media");
  if (!media) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Un mégaoctet de vidéo n'a rien à faire sur un forfait compté. Le navigateur
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
    v.loop = true;
    v.setAttribute("loop", "");
    v.preload = "auto";
    v.setAttribute("aria-hidden", "true");
    // Le fichier suit le format de l'écran, comme l'image de fond juste
    // au-dessus dans la feuille de style. On choisit une fois : si l'écran
    // tourne en cours de route, l'autre fichier n'a rien de mieux à offrir et
    // il coûterait un second téléchargement.
    v.src = matchMedia(PORTRAIT).matches
      ? DECORS.portrait.video
      : DECORS.large.video;

    // ⚠️ On ne MONTRE la vidéo qu'une fois une vraie image peinte. Sinon, sur
    // un appareil où la lecture est refusée, un rectangle vide se posait
    // par-dessus l'illustration et le décor semblait mort (le bug « la vidéo
    // ne se joue pas », #743). Tant qu'aucune image n'arrive, on garde
    // l'illustration : elle est belle et elle suit déjà le défilement.
    const montrer = () => v.classList.add("on");
    if ("requestVideoFrameCallback" in v) v.requestVideoFrameCallback(montrer);
    else v.addEventListener("playing", montrer, { once: true });

    // Muette et `playsinline`, la lecture automatique est autorisée sans geste
    // de l'utilisateur. Si un navigateur la refuse quand même, on ne force
    // rien et on ne montre rien : l'illustration reste, sans trou ni erreur.
    v.addEventListener(
      "canplay",
      () => {
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
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
