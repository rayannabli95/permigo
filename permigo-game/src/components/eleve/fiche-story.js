// ═══════════════════════════════════════════════════════════════
// Les images d'une fiche de révision, en story plein écran.
//
// Demande Rayan 10/08/2026 : « quand on clique sur révision ça nous met
// direct les images comme une story insta, on swipe ou on clique à droite
// ou à gauche, puis ça affiche la fiche quand on a fini les images. »
//
// Donc : la fiche s'affiche derrière, la story passe devant, et l'élève voit
// le geste AVANT de lire la méthode. Une image se regarde en grand ou ne se
// regarde pas : sur la bande de la fiche elle faisait 154 px de large.
//
// ⚠️ Le média est POSÉ, jamais recadré : une vue du ciel est un plan vertical
// et la rogner coupe les deux voitures, donc l'écart qu'elle raconte. Le vide
// autour est rempli par une copie floutée du même média (même recette que le
// hublot du quiz).
//
// Pas d'avance automatique : la légende porte le cours, un compte à rebours
// la volerait à celui qui lit lentement. On avance au doigt.
// ═══════════════════════════════════════════════════════════════
import { esc, escAttr } from "@/utils/escape.js";
import { haptic } from "@/utils/haptic.js";

const STYLE_ID = "fiche-story-style";

const CSS = `
.fst{ position:fixed; inset:0; z-index:430; background:#08061a; color:#f4f1ff;
  font-family:'Archivo',sans-serif; display:flex; flex-direction:column;
  opacity:0; transition:opacity .2s ease; -webkit-tap-highlight-color:transparent;
  padding-top:env(safe-area-inset-top); padding-bottom:env(safe-area-inset-bottom); }
.fst.open{ opacity:1; }
.fst:focus{ outline:none; }
.fst *{ box-sizing:border-box; }

.fst-bars{ display:flex; gap:5px; padding:12px 14px 8px; flex:0 0 auto; }
.fst-bar{ flex:1 1 0; height:3px; border-radius:99px; background:rgba(255,255,255,.20); overflow:hidden; }
.fst-bar i{ display:block; height:100%; width:0; border-radius:99px; background:#f0c860; transition:width .22s ease; }
.fst-bar.vu i{ width:100%; opacity:.7; }
.fst-bar.ici i{ width:100%; }

.fst-top{ display:flex; align-items:center; gap:10px; padding:0 14px 10px; flex:0 0 auto; }
.fst-kick{ flex:1 1 auto; min-width:0; margin:0; font:800 12px/1.3 'Archivo',sans-serif;
  letter-spacing:.09em; text-transform:uppercase; color:#c3b6f0;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fst-skip{ flex:0 0 auto; height:34px; padding:0 14px; border-radius:99px; cursor:pointer;
  background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18); color:#efe9ff;
  font:800 13px/1 'Archivo',sans-serif; display:flex; align-items:center; }
.fst-skip:active{ transform:scale(.95); }

.fst-scene{ position:relative; flex:1 1 auto; min-height:0; overflow:hidden; }
.fst-flou{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
  filter:blur(34px) saturate(1.15) brightness(.55); transform:scale(1.2); }
.fst-net{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
.fst-voile{ position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(120% 70% at 50% 40%, transparent 40%, rgba(6,4,20,.55) 100%); }

.fst-zone{ position:absolute; top:0; bottom:0; width:34%; border:0; padding:0; margin:0;
  background:transparent; cursor:pointer; }
.fst-zone.gauche{ left:0; }
.fst-zone.droite{ right:0; width:66%; }
.fst-zone:focus-visible{ outline:2px solid #f0c860; outline-offset:-4px; }

.fst-bas{ flex:0 0 auto; padding:16px 20px 22px; }
.fst-leg{ margin:0; font:700 17px/1.5 'Archivo',sans-serif; color:#f4f1ff; text-wrap:pretty; }
.fst-leg[dir="rtl"]{ text-align:right; }
.fst-aide{ margin:12px 0 0; font:600 12.5px/1.4 'Archivo',sans-serif; color:#9d92c8;
  opacity:1; transition:opacity .4s ease; }
.fst-aide.parti{ opacity:0; }

.fst-fin{ margin:14px 0 0; width:100%; height:54px; border-radius:16px; cursor:pointer;
  border:0; color:#3a2a05; font:800 16px/1 'Archivo',sans-serif;
  background:linear-gradient(180deg,#ffd97a,#e9ac35); box-shadow:0 4px 0 #a9761c; }
.fst-fin:active{ transform:translateY(2px); box-shadow:0 2px 0 #a9761c; }

@media (prefers-reduced-motion: reduce){
  .fst, .fst-bar i, .fst-aide{ transition:none; }
}
`;

const T = {
  fr: {
    skip: "Passer",
    aide: "Touche à droite pour avancer",
    fin: "Lire la fiche",
    a11y: "Les images de la fiche",
    prec: "Image précédente",
    suiv: "Image suivante",
  },
  en: {
    skip: "Skip",
    aide: "Tap the right side to move on",
    fin: "Read the sheet",
    a11y: "The pictures of this sheet",
    prec: "Previous picture",
    suiv: "Next picture",
  },
  ar: {
    skip: "تخطّي",
    aide: "المس الجهة اليمنى للمتابعة",
    fin: "قراءة البطاقة",
    a11y: "صور هذه البطاقة",
    prec: "الصورة السابقة",
    suiv: "الصورة التالية",
  },
};

/**
 * Ouvre les images d'une fiche en story plein écran.
 * @param {object} opts
 * @param {Array<{src:string,video?:boolean,fr:string,en?:string,ar?:string}>} opts.shots
 * @param {string} [opts.lang]   fr | en | ar
 * @param {boolean} [opts.rtl]   true = légendes arabes (RTL par span)
 * @param {string} [opts.kicker] le titre de la fiche, rappelé en haut
 * @param {() => void} [opts.onFin] appelée à la sortie, quelle qu'en soit la façon
 * @returns {() => void} fonction de fermeture
 */
export function ouvrirStoryFiche({
  shots,
  lang = "fr",
  rtl = false,
  kicker = "",
  onFin = null,
}) {
  const vues = Array.isArray(shots) ? shots.filter(Boolean) : [];
  if (!vues.length) {
    onFin?.();
    return () => {};
  }
  const t = T[lang] || T.fr;

  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  document.querySelector(".fst")?.remove(); // jamais deux stories empilées

  const prevFocus = document.activeElement;
  const ov = document.createElement("div");
  ov.className = "fst";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", t.a11y);
  ov.tabIndex = -1;
  ov.innerHTML = `
    <div class="fst-bars" aria-hidden="true">
      ${vues.map(() => `<span class="fst-bar"><i></i></span>`).join("")}
    </div>
    <div class="fst-top">
      <p class="fst-kick">${esc(kicker)}</p>
      <button type="button" class="fst-skip">${esc(t.skip)}</button>
    </div>
    <div class="fst-scene">
      <div class="fst-media"></div>
      <div class="fst-voile" aria-hidden="true"></div>
      <button type="button" class="fst-zone gauche" aria-label="${escAttr(t.prec)}"></button>
      <button type="button" class="fst-zone droite" aria-label="${escAttr(t.suiv)}"></button>
    </div>
    <div class="fst-bas">
      <p class="fst-leg" aria-live="polite"></p>
      <p class="fst-aide">${esc(t.aide)}</p>
      <button type="button" class="fst-fin" hidden>${esc(t.fin)}</button>
    </div>`;
  document.body.appendChild(ov);

  const media = ov.querySelector(".fst-media");
  const leg = ov.querySelector(".fst-leg");
  const aide = ov.querySelector(".fst-aide");
  const finBtn = ov.querySelector(".fst-fin");
  const barres = [...ov.querySelectorAll(".fst-bar")];
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  let i = 0;
  let closed = false;

  // Le média est monté deux fois : une copie floutée qui remplit le cadre, une
  // copie nette posée dedans. Deux <video> du même fichier ne coûtent qu'un
  // téléchargement, le navigateur sert la seconde depuis son cache.
  const paire = (s) => {
    const url = `/art/fiches/${escAttr(s.src)}.${s.video ? "mp4" : "webp"}`;
    return s.video
      ? `<video class="fst-flou" src="${url}" autoplay loop muted playsinline aria-hidden="true"></video>
         <video class="fst-net" src="${url}" autoplay loop muted playsinline></video>`
      : `<img class="fst-flou" src="${url}" alt="" aria-hidden="true" decoding="async">
         <img class="fst-net" src="${url}" alt="" decoding="async">`;
  };

  const montrer = (n) => {
    i = Math.max(0, Math.min(vues.length - 1, n));
    const s = vues[i];
    media.innerHTML = paire(s);
    const texte = s[lang] || s.fr;
    leg.textContent = texte;
    if (rtl && s[lang]) {
      leg.setAttribute("dir", "rtl");
      leg.setAttribute("lang", "ar");
    } else {
      leg.removeAttribute("dir");
      leg.removeAttribute("lang");
    }
    barres.forEach((b, k) => {
      b.classList.toggle("vu", k < i);
      b.classList.toggle("ici", k === i);
    });
    // Le bouton n'apparaît qu'à la dernière image : avant, il dirait « c'est
    // fini » au milieu de la série.
    finBtn.hidden = i < vues.length - 1;
    if (i > 0) aide.classList.add("parti");
  };

  const fermer = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = prevOverflow;
    ov.classList.remove("open");
    setTimeout(() => ov.remove(), 220);
    if (prevFocus && typeof prevFocus.focus === "function") {
      try {
        prevFocus.focus();
      } catch {
        /* élément disparu entre-temps : non bloquant */
      }
    }
    onFin?.();
  };

  const suivant = () => {
    if (i >= vues.length - 1) return fermer();
    haptic("select");
    montrer(i + 1);
  };
  const precedent = () => {
    if (i <= 0) return;
    haptic("select");
    montrer(i - 1);
  };

  const onKey = (e) => {
    if (e.key === "Escape") fermer();
    else if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      suivant();
    } else if (e.key === "ArrowLeft") precedent();
  };

  ov.querySelector(".fst-zone.droite").addEventListener("click", suivant);
  ov.querySelector(".fst-zone.gauche").addEventListener("click", precedent);
  ov.querySelector(".fst-skip").addEventListener("click", fermer);
  finBtn.addEventListener("click", fermer);
  document.addEventListener("keydown", onKey);

  // Le swipe, parce que c'est le geste qu'une story appelle. Seuil à 45 px
  // pour ne pas prendre un doigt qui tremble pour une intention.
  let x0 = null;
  let y0 = null;
  ov.addEventListener(
    "touchstart",
    (e) => {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    },
    { passive: true },
  );
  ov.addEventListener(
    "touchend",
    (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) suivant();
      else precedent();
    },
    { passive: true },
  );

  montrer(0);
  requestAnimationFrame(() => {
    ov.classList.add("open");
    // On pose le focus sur la story elle-même, pas sur la zone de tap : la
    // poser sur un bouton dessine un liseré jaune en travers de l'image dès
    // l'ouverture, alors que personne n'a rien touché.
    ov.focus();
  });
  return fermer;
}
