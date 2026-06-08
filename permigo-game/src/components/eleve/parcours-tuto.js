// ═══════════════════════════════════════════════════════════════
// Tuto parcours élève — carrousel d'intro (4 slides) guidé par la mascotte.
// S'affiche au 1er passage sur le parcours (localStorage), re-consultable
// via le bouton « ? ». Skippable. Respecte prefers-reduced-motion.
// ═══════════════════════════════════════════════════════════════
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { track } from "@/services/analytics.js";

const SEEN_KEY = "permigo-parcours-tuto-v1";

const SLIDES = [
  {
    mascot: "/skins/mascot-hello.png",
    extra: "/skins/avatars/permigo-badge-icon.png",
    title: "Bienvenue sur ton parcours !",
    text: "Voici ta carte d'apprentissage du permis. Suis la route, étape par étape.",
  },
  {
    mascot: "/skins/mascot-point.png",
    extra: "/skins/drapeau.png",
    title: "Suis tes compétences",
    text: "Chaque étape de la carte = une compétence REMC à valider avec ton moniteur.",
  },
  {
    mascot: "/skins/mascot-celebrate.png",
    extra: "/skins/chest-open.png",
    title: "Débloque des récompenses",
    text: "Avance pour gagner des coffres, des skins de voiture et personnaliser ton profil.",
  },
  {
    mascot: "/skins/mascot-celebrate.png",
    extra: "/skins/couronne.png",
    title: "Grimpe dans la ligue",
    text: "Mesure-toi aux autres élèves de ton auto-école et vise le haut du classement.",
  },
];

let _overlay = null;
let _onKey = null;

function slideHtml(s, i) {
  return `
    <div class="pt-slide" data-slide="${i}">
      <div class="pt-art">
        <img class="pt-mascot" src="${s.mascot}" alt="" />
        ${s.extra ? `<img class="pt-extra" src="${s.extra}" alt="" />` : ""}
      </div>
      <h2 class="pt-title">${esc(s.title)}</h2>
      <p class="pt-text">${esc(s.text)}</p>
    </div>`;
}

export function showParcoursTuto() {
  if (_overlay) return;
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* mode privé strict → on affiche quand même, juste pas mémorisé */
  }
  track("parcours_tuto.opened");

  let idx = 0;
  const total = SLIDES.length;

  const ov = document.createElement("div");
  _overlay = ov;
  ov.id = "pt-tuto";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "Présentation du parcours");
  ov.innerHTML = `
    <style>
      #pt-tuto{position:fixed;inset:0;z-index:8500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:24px;background:var(--bg);opacity:0;transition:opacity .3s ease;}
      #pt-tuto.on{opacity:1;}
      #pt-tuto .pt-skip{position:absolute;top:calc(env(safe-area-inset-top,0px) + 14px);right:16px;border:0;background:none;color:var(--mu2);font:600 13px/1 'Inter',sans-serif;cursor:pointer;padding:8px 10px;border-radius:8px;-webkit-tap-highlight-color:transparent;}
      #pt-tuto .pt-skip:hover{color:var(--ink);background:var(--bg2);}
      #pt-tuto .pt-stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;max-width:420px;width:100%;}
      #pt-tuto .pt-slide{display:flex;flex-direction:column;align-items:center;gap:8px;animation:ptIn .35s cubic-bezier(.34,1.4,.64,1);}
      #pt-tuto .pt-art{position:relative;width:210px;height:210px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;}
      #pt-tuto .pt-mascot{width:200px;height:200px;object-fit:contain;filter:drop-shadow(0 14px 28px rgba(10,13,26,.18));animation:ptFloat 3s ease-in-out infinite;}
      #pt-tuto .pt-extra{position:absolute;right:-6px;bottom:6px;width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 6px 14px rgba(10,13,26,.22));animation:ptPop .4s .2s cubic-bezier(.34,1.56,.64,1) both;}
      #pt-tuto .pt-title{font:800 22px/1.2 'Plus Jakarta Sans',sans-serif;color:var(--ink);letter-spacing:-.02em;margin:0;}
      #pt-tuto .pt-text{font:500 14.5px/1.5 'Inter',sans-serif;color:var(--mu);margin:0;max-width:320px;}
      #pt-tuto .pt-footer{width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center;gap:18px;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 8px);}
      #pt-tuto .pt-dots{display:flex;gap:8px;}
      #pt-tuto .pt-dot{width:8px;height:8px;border-radius:99px;background:var(--bo4);transition:width .25s,background .25s;}
      #pt-tuto .pt-dot.on{width:22px;background:var(--a);}
      #pt-tuto .pt-next{width:100%;min-height:52px;border:0;border-radius:16px;color:var(--a-ink);font:800 15px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;background:linear-gradient(to bottom,var(--a-lt) 0%,var(--a) 48%,var(--adk) 100%);box-shadow:0 8px 22px -6px color-mix(in srgb,var(--adk) 55%,transparent),0 1.5px 0 0 rgba(255,255,255,.28) inset;transition:transform .12s,filter .15s;-webkit-tap-highlight-color:transparent;}
      #pt-tuto .pt-next:active{transform:scale(.98);}
      @keyframes ptIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes ptFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      @keyframes ptPop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
      @media (prefers-reduced-motion:reduce){#pt-tuto,#pt-tuto .pt-slide,#pt-tuto .pt-mascot,#pt-tuto .pt-extra{animation:none!important;transition:none!important;}}
    </style>
    <button class="pt-skip" id="pt-skip" type="button">Passer</button>
    <div class="pt-stage" id="pt-stage">${slideHtml(SLIDES[0], 0)}</div>
    <div class="pt-footer">
      <div class="pt-dots" id="pt-dots" aria-hidden="true">
        ${SLIDES.map((_, i) => `<span class="pt-dot${i === 0 ? " on" : ""}"></span>`).join("")}
      </div>
      <button class="pt-next" id="pt-next" type="button">Suivant</button>
    </div>
  `;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add("on"));

  const stage = ov.querySelector("#pt-stage");
  const nextBtn = ov.querySelector("#pt-next");
  const dots = ov.querySelectorAll(".pt-dot");

  const sync = () => {
    stage.innerHTML = slideHtml(SLIDES[idx], idx);
    dots.forEach((d, i) => d.classList.toggle("on", i === idx));
    nextBtn.textContent = idx === total - 1 ? "C'est parti !" : "Suivant";
  };

  nextBtn.addEventListener("click", () => {
    if (idx < total - 1) {
      idx++;
      sync();
    } else {
      track("parcours_tuto.completed");
      close();
    }
  });

  ov.querySelector("#pt-skip").addEventListener("click", () => {
    track("parcours_tuto.skipped", { slide: idx });
    close();
  });

  _onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", _onKey);
}

function close() {
  const ov = _overlay;
  if (!ov) return;
  _overlay = null;
  if (_onKey) {
    document.removeEventListener("keydown", _onKey);
    _onKey = null;
  }
  ov.classList.remove("on");
  setTimeout(() => ov.remove(), 320);
}

// À appeler au montage du parcours : affiche le tuto si jamais vu.
export function maybeShowParcoursTuto() {
  let seen = false;
  try {
    seen = !!localStorage.getItem(SEEN_KEY);
  } catch {
    seen = false;
  }
  if (!seen) showParcoursTuto();
}
