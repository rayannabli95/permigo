// ═══════════════════════════════════════════════════════════════
// « Défie tes amis » — le jeu de soirée.
//
// Une seule page pour tout le circuit, parce qu'un invité arrive de WhatsApp
// et ne doit traverser aucun écran de compte :
//   #/duel          → l'hôte (connecté) crée la partie et récupère le lien
//   #/duel/<code>   → l'ami arrive, tape son prénom, joue, voit le classement
//
// Tout le réseau passe par l'edge function `duel` (voir supabase/functions/
// duel/index.ts) : les invités n'ont pas de session, donc pas de RLS possible.
// Le jeton du joueur vit dans localStorage, ce qui permet de reprendre une
// partie si l'écran se verrouille au milieu.
//
// Ce n'est PAS un quiz certifiant : aucune compétence n'est validée ici.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { toast } from "@/components/common/toast.js";
import { chromeNight } from "@/utils/chrome-night.js";

const LS = (code) => `duel_${code}`;
const LETTRES = ["A", "B", "C", "D", "E", "F"];
const COULEURS = [
  "linear-gradient(180deg,#8e87ff,#6058d8)",
  "linear-gradient(180deg,#ff9c8b,#e2604d)",
  "linear-gradient(180deg,#6fd6a8,#2f9d73)",
  "linear-gradient(180deg,#ffd24a,#e08c10)",
  "linear-gradient(180deg,#79c0ff,#3b82f6)",
  "linear-gradient(180deg,#f79bd8,#c8519f)",
  "linear-gradient(180deg,#a5e88a,#5faa3c)",
  "linear-gradient(180deg,#c4a6ff,#8b5cf6)",
];

function appel(action, payload = {}) {
  return sb.functions
    .invoke("duel", { body: { action, ...payload } })
    .then(({ data, error }) => {
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    });
}

function jeton(code) {
  try {
    return JSON.parse(localStorage.getItem(LS(code)) || "null");
  } catch {
    return null;
  }
}
function poseJeton(code, v) {
  try {
    localStorage.setItem(LS(code), JSON.stringify(v));
  } catch {
    /* navigation privée : la partie marche quand même, sans reprise */
  }
}

function initiale(nom) {
  return (nom || "?").trim().charAt(0).toUpperCase();
}

const STYLE = `<style>
${chromeNight("#241a52", "#1a1340")}
.du { position:relative; overflow:hidden; max-width:480px; margin:0 auto; min-height:100dvh; color:#fff;
  background:linear-gradient(180deg,#241a52 0%,#1e1648 46%,#1a1340 100%); font-family:'Archivo',sans-serif;
  -webkit-font-smoothing:antialiased; }
.du::before { content:""; position:absolute; top:-120px; left:50%; transform:translateX(-50%);
  width:360px; height:300px; pointer-events:none;
  background:radial-gradient(ellipse at center,rgba(142,135,255,.18),transparent 70%); }
.du-screen { position:relative; padding:14px 20px calc(40px + env(safe-area-inset-bottom)); }

.du-top { display:flex; align-items:center; justify-content:space-between; padding:8px 2px 14px; }
.du-top h1 { font:800 20px/1 'Archivo',sans-serif; letter-spacing:-.03em; margin:0; }
.du-back { width:38px; height:38px; display:grid; place-items:center; border:0; cursor:pointer;
  border-radius:12px; background:rgba(255,255,255,.07); color:#cfc7ff; font:800 18px/1 'Archivo',sans-serif; }
.du-spacer { width:38px; }

.du-wordmark { text-align:center; font:800 15px/1 'Archivo',sans-serif; letter-spacing:.2em;
  text-transform:uppercase; color:#6b63a8; padding:18px 0 8px; }
.du-mascot { display:block; width:118px; height:118px; object-fit:contain; margin:4px auto -6px;
  filter:drop-shadow(0 10px 18px rgba(0,0,0,.45)); }
.du-title { text-align:center; font:800 30px/1.1 'Archivo',sans-serif; letter-spacing:-.035em; margin:10px 0 0; }
.du-title em { font-style:normal; background:linear-gradient(110deg,#ffe27a,#ff9b1e);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
.du-sub { text-align:center; font:600 14.5px/1.45 'Archivo',sans-serif; color:#b3aede; margin:10px 0 24px; }

.du-cta { display:flex; align-items:center; justify-content:center; gap:9px; width:100%;
  padding:16px; border:0; border-radius:16px; cursor:pointer;
  background:linear-gradient(180deg,#8e87ff,#6c63ff);
  box-shadow:0 4px 0 #4a3fc9, 0 12px 22px -10px rgba(74,63,201,.9);
  color:#fff; font:800 16.5px/1 'Archivo',sans-serif; letter-spacing:-.01em;
  transition:transform .1s ease, box-shadow .1s ease; -webkit-tap-highlight-color:transparent; }
.du-cta:active { transform:translateY(2px); box-shadow:0 2px 0 #4a3fc9; }
.du-cta.gold { background:linear-gradient(180deg,#ffd24a,#ff9c1c); color:#3a1d00;
  box-shadow:0 4px 0 #b85e00, 0 12px 22px -10px rgba(255,140,30,.6); }
.du-cta.gold:active { box-shadow:0 2px 0 #b85e00; }
.du-cta[disabled] { opacity:.55; cursor:default; }
.du-ghost { display:block; width:100%; margin-top:10px; padding:15px; cursor:pointer;
  border-radius:16px; border:1px solid #3a3178; background:rgba(255,255,255,.04);
  color:#cfc7ff; font:800 15px/1 'Archivo',sans-serif; -webkit-tap-highlight-color:transparent; }

/* ===== Le QR de la partie =====
   Dans une soirée tout le monde est dans la même pièce : tendre son écran
   bat l'envoi d'un lien. Et il n'y a PAS de scanner à coder, l'appareil
   photo d'un iPhone ou d'un Android lit déjà les QR tout seul. */
.du-qr { margin-top:22px; padding:18px 18px 16px; border-radius:22px; text-align:center;
  background:linear-gradient(180deg,#2c2264,#241a56); border:1px solid rgba(245,196,81,.28);
  box-shadow:0 22px 44px -20px rgba(8,4,30,.9); }
.du-qrbox { width:min(230px,62vw); aspect-ratio:1; margin:0 auto; display:grid; place-items:center;
  background:#fff; border-radius:16px; padding:12px;
  box-shadow:0 10px 24px -12px rgba(0,0,0,.7); }
/* image-rendering pixelated : sans lui le lissage du navigateur bave sur les
   modules et certains téléphones ne décrochent plus le code. */
.du-qrbox img { width:100%; height:100%; display:block; image-rendering:pixelated; }
.du-qrhint { margin:14px 2px 0; font:700 14px/1.4 'Archivo',sans-serif; color:#cfc7ff; }
.du-qrfail { font:600 13px/1.4 'Archivo',sans-serif; color:#8c85bd; padding:20px; }

.du-lab { display:block; font:800 11px/1 'Archivo',sans-serif; letter-spacing:.14em;
  text-transform:uppercase; color:#9089c7; margin:0 2px 10px; }
.du-block { margin-top:22px; }
.du-link { display:flex; align-items:center; padding:14px 15px; border-radius:14px;
  background:rgba(0,0,0,.28); border:1px dashed #4a3f95;
  font:600 13.5px/1 var(--fn,'IBM Plex Mono',monospace); color:#cfc7ff; overflow:hidden;
  white-space:nowrap; text-overflow:ellipsis; }
.du-note { margin:12px 2px 0; font:600 12.5px/1.45 'Archivo',sans-serif; color:#8c85bd; text-align:center; }

.du-input { display:block; width:100%; padding:17px 18px; border-radius:16px;
  background:rgba(0,0,0,.3); border:1.5px solid #4a3f95; color:#fff;
  font:700 17px/1 'Archivo',sans-serif; -webkit-appearance:none; }
.du-input::placeholder { color:#6b63a8; }
.du-input:focus { outline:none; border-color:#f5c451; }

.du-facts { display:flex; justify-content:center; gap:8px; margin:18px 0 26px; flex-wrap:wrap; }
.du-fact { padding:9px 14px; border-radius:999px; background:rgba(255,255,255,.06);
  border:1px solid #3a3178; font:800 12.5px/1 'Archivo',sans-serif; color:#cfc7ff; }

.du-players { display:flex; gap:8px; flex-wrap:wrap; }
.du-pl { position:relative; width:40px; height:40px; border-radius:50%; display:grid; place-items:center;
  font:800 15px/1 'Archivo',sans-serif; color:#fff; border:2px solid rgba(255,255,255,.14); }
.du-pl.wait { opacity:.38; }
.du-pl .tick { position:absolute; right:-3px; bottom:-3px; width:17px; height:17px; border-radius:50%;
  background:#35d07f; border:2px solid #1e1648; display:grid; place-items:center;
  font:800 9px/1 'Archivo',sans-serif; color:#06280f; }
.du-empty { width:40px; height:40px; border-radius:50%; border:2px dashed #4a3f95; }
.du-slots { display:flex; align-items:flex-start; gap:12px; flex-wrap:wrap; }
.du-slot { text-align:center; width:40px; }
.du-slot .nm { display:block; margin-top:7px; font:700 11.5px/1.2 'Archivo',sans-serif; color:#8c85bd;
  overflow:hidden; text-overflow:ellipsis; }
.du-slot .nm.moi { color:#f5c451; }

/* ===== Jeu ===== */
.du-bar { display:flex; align-items:center; gap:12px; margin-bottom:4px; }
.du-pips { display:flex; flex:1; gap:7px; }
.du-pip { flex:1; height:11px; border-radius:6px; background:#251f56; box-shadow:inset 0 2px 3px rgba(0,0,0,.5); }
.du-pip.done { background:linear-gradient(180deg,#ffd95e,#f59b16); box-shadow:0 0 10px rgba(255,170,40,.5); }
.du-pip.cur { background:linear-gradient(180deg,#ffe588,#ff9d1f); box-shadow:0 0 16px rgba(255,180,50,.85); }
.du-count { font:800 13px/1 var(--fn,'IBM Plex Mono',monospace); color:#ffd06a; }
.du-q { font:700 clamp(20px,5.4vw,24px)/1.34 'Archivo',sans-serif; margin:22px 0; letter-spacing:-.01em;
  text-shadow:0 2px 0 rgba(0,0,0,.32), 0 0 18px rgba(120,90,230,.35); }
.du-opts { display:flex; flex-direction:column; gap:12px; }
.du-opt { position:relative; display:flex; align-items:center; gap:13px; width:100%; min-height:60px;
  padding:13px 16px; border-radius:18px; cursor:pointer; text-align:left;
  background:linear-gradient(180deg,#3a3470,#231d4f); border:1px solid rgba(255,255,255,.06); color:#ece8ff;
  box-shadow:0 7px 0 #15113a, 0 12px 16px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.26);
  font:500 15.5px/1.25 'Archivo',sans-serif; -webkit-tap-highlight-color:transparent;
  transition:transform .08s ease, box-shadow .08s ease; }
.du-opt:active { transform:translateY(3px); box-shadow:0 4px 0 #15113a; }
.du-opt[disabled] { cursor:default; }
.du-opt.ok { background:linear-gradient(180deg,#ffd24a,#ff9c1c); color:#3a1d00;
  border:1px solid rgba(255,255,255,.35); box-shadow:0 5px 0 #b85e00, 0 10px 20px rgba(255,140,30,.4); }
.du-opt.ko { background:linear-gradient(180deg,#4a2740,#34203a); border-color:rgba(255,160,90,.3);
  color:#ffd9c2; box-shadow:0 5px 0 #1f1430; }
.du-key { flex:none; display:grid; place-items:center; width:38px; height:38px; border-radius:12px;
  background:linear-gradient(180deg,#2b2560,#1b1545); color:#cfc7ff;
  font:800 17px/1 'Archivo',sans-serif; box-shadow:inset 0 1px 0 rgba(255,255,255,.16), 0 3px 0 #110d35; }
.du-opt.ok .du-key { background:linear-gradient(180deg,#fff,#ffe7a8); color:#c46a00; box-shadow:0 3px 0 #c46a00; }
.du-expl { margin:16px 0 0; padding:14px 16px; border-radius:16px; background:rgba(0,0,0,.24);
  border:1px solid #3a3178; font:600 14px/1.5 'Archivo',sans-serif; color:#cfc7ff; }

/* ===== Podium ===== */
.du-podium { display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:auto 84px;
  column-gap:10px; align-items:end; max-width:340px; margin:26px auto 0; border-bottom:1px solid #443a86; }
.du-who { text-align:center; padding-bottom:10px; }
.du-who .head { width:56px; height:56px; margin:0 auto 8px; border-radius:50%; display:grid; place-items:center;
  font:800 21px/1 'Archivo',sans-serif; color:#fff; border:2px solid rgba(255,255,255,.18); }
.du-who.first .head { width:70px; height:70px; box-shadow:0 0 0 4px rgba(245,196,81,.22); }
.du-who .name { font:800 14px/1.1 'Archivo',sans-serif; overflow:hidden; text-overflow:ellipsis; }
.du-who .pts { font:700 12px/1 var(--fn,'IBM Plex Mono',monospace); color:#ffd06a; margin-top:4px; }
.du-step { align-self:end; border-radius:12px 12px 0 0; display:grid; place-items:center;
  background:linear-gradient(180deg,#3a3178,#2a2160); border:1px solid #443a86; border-bottom:0;
  font:800 22px/1 'Archivo',sans-serif; color:#9089c7; }
.du-step.s1 { height:84px; background:linear-gradient(180deg,#ffd24a,#e08c10); color:#3a1d00; border-color:#ffe08a; }
.du-step.s2 { height:58px; }
.du-step.s3 { height:40px; }
.du-row { display:flex; align-items:center; gap:12px; margin-top:10px; padding:11px 14px;
  border-radius:14px; background:rgba(255,255,255,.04); border:1px solid #3a3178; }
.du-row .rk { width:20px; font:800 15px/1 var(--fn,'IBM Plex Mono',monospace); color:#6b63a8; }
.du-row .nm { flex:1; font:800 15.5px/1.2 'Archivo',sans-serif; overflow:hidden; text-overflow:ellipsis; }
.du-row .sc { font:700 14px/1 var(--fn,'IBM Plex Mono',monospace); color:#9089c7; }
.du-win { text-align:center; margin:18px 0 2px; font:800 28px/1.1 'Archivo',sans-serif; letter-spacing:-.03em;
  background:linear-gradient(110deg,#ffe27a,#ff9b1e); -webkit-background-clip:text; background-clip:text; color:transparent; }

.du-card { margin-top:18px; padding:16px; border-radius:20px;
  background:linear-gradient(180deg,#2c2264,#241a56); border:1px solid rgba(245,196,81,.28);
  box-shadow:0 22px 44px -20px rgba(8,4,30,.9); }
.du-card h3 { margin:0 0 6px; font:800 19px/1.2 'Archivo',sans-serif; letter-spacing:-.02em; }
.du-card p { margin:0 0 14px; font:600 13.5px/1.45 'Archivo',sans-serif; color:#b3aede; }
.du-eyebrow { display:block; font:800 11px/1 'Archivo',sans-serif; letter-spacing:.16em;
  text-transform:uppercase; color:#f5c451; margin-bottom:9px; }

.du-skel { border-radius:18px; background:rgba(255,255,255,.05); animation:duPulse 1.2s ease-in-out infinite; }
.du-skel.big { height:220px; }
.du-skel.row { height:66px; margin-top:12px; }
@keyframes duPulse { 0%,100%{opacity:.5} 50%{opacity:.9} }
@media (prefers-reduced-motion: reduce){ .du-skel{animation:none} .du-cta,.du-opt{transition:none} }
</style>`;

function coque(inner) {
  return `${STYLE}<div class="du"><div class="du-screen">${inner}</div></div>`;
}

function squelette() {
  return coque(
    `<div class="du-skel big"></div><div class="du-skel row"></div><div class="du-skel row"></div>`,
  );
}

function pastilles(noms, finis = []) {
  return noms
    .map(
      (n, i) =>
        `<div class="du-pl" style="background:${COULEURS[i % COULEURS.length]}">${esc(initiale(n))}${
          finis[i] ? '<span class="tick">✓</span>' : ""
        }</div>`,
    )
    .join("");
}

// ───────────────────────────── L'hôte crée la partie ─────────────────────
function vueCreation(me, etat) {
  const lien = etat.code ? `${location.origin}/#/duel/${etat.code}` : "";
  return coque(`
    <div class="du-top">
      <button class="du-back" data-retour aria-label="Retour">←</button>
      <h1>Défie tes amis</h1>
      <span class="du-spacer"></span>
    </div>
    <img class="du-mascot" src="/skins/mascot-hello-remastered.png" alt="">
    <h2 class="du-title">Qui est le plus permifié ?</h2>
    <p class="du-sub">10 questions dans tout le programme.<br>Le meilleur score prend le titre.</p>
    ${
      etat.code
        ? `<div class="du-qr">
             <div class="du-qrbox" id="du-qrbox"><span class="du-qrfail">…</span></div>
             <p class="du-qrhint">Tes amis visent ce carré avec leur appareil photo.</p>
           </div>
           <div class="du-block">
             <span class="du-lab">Ou envoie le lien</span>
             <div class="du-link">${esc(lien)}</div>
             <button class="du-cta" data-partager style="margin-top:12px">Envoyer le lien</button>
             <button class="du-ghost" data-copier>Copier</button>
             <p class="du-note">Tes amis tapent leur prénom et ils jouent.<br>Pas de compte. Pas d'email.</p>
           </div>
           <div class="du-block">
             <span class="du-lab">Dans la partie</span>
             <div class="du-slots">
               ${(etat.joueurs || [])
                 .map(
                   (n, i) =>
                     `<div class="du-slot"><div class="du-pl" style="background:${
                       COULEURS[i % COULEURS.length]
                     }">${esc(initiale(n))}</div><span class="nm${
                       i === 0 ? " moi" : ""
                     }">${esc(i === 0 ? "Toi" : n)}</span></div>`,
                 )
                 .join("")}
               ${Array.from(
                 { length: Math.max(0, 4 - (etat.joueurs || []).length) },
                 () =>
                   `<div class="du-slot"><div class="du-empty"></div><span class="nm">Libre</span></div>`,
               ).join("")}
             </div>
           </div>
           <button class="du-cta gold" data-jouer style="margin-top:26px">Jouer ma partie</button>`
        : `<button class="du-cta gold" data-creer>Créer la partie</button>`
    }
  `);
}

// ───────────────────────────── L'ami arrive ──────────────────────────────
function vueArrivee(etat) {
  return coque(`
    <div class="du-wordmark">PermiGo</div>
    <img class="du-mascot" src="/skins/mascot-hello-remastered.png" alt="">
    <h1 class="du-title">${
      etat.hote ? `<em>${esc(etat.hote)}</em> te défie` : "On te défie"
    }</h1>
    <div class="du-facts">
      <span class="du-fact">10 questions</span>
      <span class="du-fact">3 minutes</span>
      <span class="du-fact">Un seul titre</span>
    </div>
    <span class="du-lab">Ton prénom</span>
    <input class="du-input" id="du-nom" type="text" maxlength="24" autocomplete="given-name"
           placeholder="Sarah" aria-label="Ton prénom">
    <button class="du-cta gold" data-entrer style="margin-top:14px">J'y vais</button>
    <p class="du-note">Pas de compte. Pas d'email.<br>Tu joues dans 5 secondes.</p>
    ${
      (etat.joueurs || []).length
        ? `<div class="du-card" style="margin-top:26px">
             <span class="du-eyebrow">Déjà dans la partie</span>
             <div class="du-players">${pastilles(etat.joueurs)}</div>
             <p style="margin:12px 0 0;color:#b3aede;font:600 13.5px/1.4 'Archivo',sans-serif">${esc(
               etat.joueurs.join(" · "),
             )}</p>
           </div>`
        : ""
    }
  `);
}

// ───────────────────────────── Une question ──────────────────────────────
function vueQuestion(etat) {
  const q = etat.questions[etat.i];
  const rep = etat.reponse; // index choisi, ou null
  const pips = etat.questions
    .map(
      (_, i) =>
        `<div class="du-pip${i < etat.i ? " done" : i === etat.i ? " cur" : ""}"></div>`,
    )
    .join("");

  const options = (q.options || [])
    .map((opt, i) => {
      let cls = "";
      if (rep != null) {
        if (i === q.correct_index) cls = " ok";
        else if (i === rep) cls = " ko";
      }
      return `<button class="du-opt${cls}" data-rep="${i}"${rep != null ? " disabled" : ""}>
        <span class="du-key">${LETTRES[i] || i + 1}</span><span>${esc(opt)}</span>
      </button>`;
    })
    .join("");

  const dernier = etat.i === etat.questions.length - 1;
  return coque(`
    <div class="du-top" style="padding-bottom:10px">
      <div class="du-players">${pastilles(etat.joueurs || [])}</div>
      <span class="du-count">${etat.i + 1}/${etat.questions.length}</span>
    </div>
    <div class="du-bar"><div class="du-pips">${pips}</div></div>
    <h2 class="du-q">${esc(q.question)}</h2>
    <div class="du-opts">${options}</div>
    ${
      rep != null
        ? `${q.explanation ? `<p class="du-expl">${esc(q.explanation)}</p>` : ""}
           <button class="du-cta" data-suite style="margin-top:16px">${
             dernier ? "Voir le classement" : "Question suivante"
           }</button>`
        : ""
    }
  `);
}

// ───────────────────────────── Le classement ─────────────────────────────
function vueClassement(etat) {
  const c = (etat.classement || []).filter((p) => p.fini);
  const attente = (etat.classement || []).filter((p) => !p.fini);
  const top = c.slice(0, 3);
  const reste = c.slice(3);
  const gagnant = top[0];
  const ordre = [top[1], top[0], top[2]]; // 2e · 1er · 3e
  const hauteurs = ["s2", "s1", "s3"];
  const rangs = ["2", "1", "3"];

  const podium = ordre
    .map((p, col) => {
      if (!p) return `<div></div>`;
      const idx = c.indexOf(p);
      return `<div class="du-who${col === 1 ? " first" : ""}">
        <div class="head" style="background:${COULEURS[idx % COULEURS.length]}">${esc(
          initiale(p.name),
        )}</div>
        <div class="name">${esc(p.name)}</div>
        <div class="pts">${p.score}/${etat.total}</div>
      </div>`;
    })
    .join("");
  const marches = ordre
    .map((p, col) =>
      p
        ? `<div class="du-step ${hauteurs[col]}">${rangs[col]}</div>`
        : `<div></div>`,
    )
    .join("");

  return coque(`
    <img class="du-mascot" src="/skins/mascot-celebrate.webp" alt="" style="width:92px;height:92px">
    <h1 class="du-win">${
      gagnant ? `${esc(gagnant.name)} prend le titre` : "Partie en cours"
    }</h1>
    ${
      gagnant
        ? `<p class="du-sub" style="margin:6px 0 0">${gagnant.score} bonnes réponses sur ${etat.total}</p>`
        : `<p class="du-sub" style="margin:6px 0 0">Personne n'a encore fini</p>`
    }
    ${c.length ? `<div class="du-podium">${podium}${marches}</div>` : ""}
    ${reste
      .map(
        (p, i) =>
          `<div class="du-row"><span class="rk">${i + 4}</span><span class="nm">${esc(
            p.name,
          )}</span><span class="sc">${p.score}/${etat.total}</span></div>`,
      )
      .join("")}
    ${
      attente.length
        ? `<p class="du-note">On attend encore ${esc(
            attente.map((p) => p.name).join(" · "),
          )}.</p>`
        : ""
    }
    ${
      etat.ratee
        ? `<div class="du-card">
             <span class="du-eyebrow">Vous avez tous séché dessus</span>
             <h3>${esc(etat.ratee.question)}</h3>
             <p>${esc(
               etat.ratee.explanation ||
                 `${etat.ratee.rates} joueurs se sont trompés sur celle-là.`,
             )}</p>
             <p style="color:#f5c451;margin:0 0 14px">La bonne réponse : ${esc(
               etat.ratee.options?.[etat.ratee.correct_index] || "",
             )}</p>
             <button class="du-cta gold" data-relancer>Relancer une partie</button>
           </div>`
        : `<button class="du-cta gold" data-relancer style="margin-top:22px">Relancer une partie</button>`
    }
    ${
      getCurUser()
        ? `<button class="du-ghost" data-rafraichir>Rafraîchir le classement</button>`
        : `<button class="du-ghost" data-compte>Créer mon compte gratuit</button>
           <p class="du-note">Ton score tient 7 jours.<br>Crée ton compte gratuit pour le garder.</p>`
    }
  `);
}

// ───────────────────────────── Montage ───────────────────────────────────
export async function mount(root, param) {
  const code = String(param || "")
    .toUpperCase()
    .trim();
  const me = getCurUser();

  // Pas de code : c'est l'hôte qui veut créer. Il lui faut un compte.
  if (!code) {
    if (!me) return navigate("/login");
    track("page_view", { page: "duel_creation" });
    const etat = { code: null, joueurs: [] };
    root.innerHTML = vueCreation(me, etat);
    cableCreation(root, me, etat);
    return;
  }

  track("page_view", { page: "duel_partie" });
  root.innerHTML = squelette();

  const garde = jeton(code);
  const etat = {
    code,
    i: 0,
    reponse: null,
    score: 0,
    ratees: [],
    joueurs: [],
    questions: [],
    total: 10,
    playerId: garde?.playerId || null,
    fini: !!garde?.fini,
  };

  // Déjà joué sur cet appareil : on va droit au classement.
  if (etat.fini) return afficheClassement(root, etat);

  try {
    const info = await appel("results", { code });
    etat.joueurs = (info.classement || []).map((p) => p.name);
    etat.hote = info.classement?.[0]?.name || null;
    etat.total = info.total || 10;
  } catch (e) {
    if (String(e.message) === "introuvable") {
      root.innerHTML = coque(`
        <div class="du-wordmark">PermiGo</div>
        <h1 class="du-title" style="margin-top:40px">Cette partie n'existe plus</h1>
        <p class="du-sub">Un lien de duel tient 7 jours.<br>Demande à ton ami d'en relancer une.</p>
        <button class="du-cta gold" data-accueil>Découvrir PermiGo</button>
      `);
      root.querySelector("[data-accueil]")?.addEventListener("click", () => {
        navigate("/");
      });
      return;
    }
    toast("Connexion impossible pour le moment", "error");
    return;
  }

  // Déjà entré dans la partie mais pas fini : on reprend le jeu.
  if (etat.playerId) return lanceJeu(root, etat);

  root.innerHTML = vueArrivee(etat);
  cableArrivee(root, etat);
}

// Dessine le QR APRÈS le rendu, jamais pendant : la bibliothèque arrive en
// import différé et son échec ne doit pas vider l'écran (déjà vu le 02/08 sur
// la landing). Le lien et le bouton de partage sont posés avant, ils restent
// là quoi qu'il arrive.
async function dessineQr(root, lien) {
  const boite = root.querySelector("#du-qrbox");
  if (!boite) return;
  try {
    const { default: qrcode } = await import("qrcode-generator");
    // Type 0 = la plus petite version qui accepte le texte. Correction « M » :
    // le carré reste lisible même photographié de travers ou sur un écran sale.
    const qr = qrcode(0, "M");
    qr.addData(lien);
    qr.make();
    boite.innerHTML = `<img src="${qr.createDataURL(8, 2)}" alt="Le carré à viser pour rejoindre la partie" width="256" height="256">`;
  } catch (e) {
    console.error("[duel:qr]", e);
    boite.innerHTML = `<span class="du-qrfail">Le carré n'a pas pu s'afficher. Envoie le lien juste en dessous.</span>`;
  }
}

function cableCreation(root, me, etat) {
  root.querySelector("[data-retour]")?.addEventListener("click", () => {
    navigate("/reviser");
  });

  root.querySelector("[data-creer]")?.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    haptic("tap");
    try {
      const prenom = me.prenom || me.full_name?.split(" ")[0] || "Moi";
      const r = await appel("create", { name: prenom });
      etat.code = r.code;
      etat.joueurs = [prenom];
      poseJeton(r.code, { playerId: r.playerId, fini: false });
      track("duel.cree", { code: r.code });
      root.innerHTML = vueCreation(me, etat);
      cableCreation(root, me, etat);
    } catch (e) {
      console.error("[duel:create]", e);
      btn.disabled = false;
      toast("La partie n'a pas pu être créée", "error");
    }
  });

  const lien = etat.code ? `${location.origin}/#/duel/${etat.code}` : "";
  if (lien) dessineQr(root, lien);

  root.querySelector("[data-partager]")?.addEventListener("click", async () => {
    haptic("tap");
    track("duel.partage", { code: etat.code });
    const texte = "Tu l'as ton permis ? Prouve-le.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "PermiGo", text: texte, url: lien });
        return;
      } catch {
        /* partage annulé : on retombe sur la copie */
      }
    }
    copie(lien);
  });

  root.querySelector("[data-copier]")?.addEventListener("click", () => {
    haptic("tap");
    copie(lien);
  });

  root.querySelector("[data-jouer]")?.addEventListener("click", () => {
    haptic("tap");
    navigate(`/duel/${etat.code}`);
  });
}

function copie(lien) {
  navigator.clipboard
    ?.writeText(lien)
    .then(() => toast("Lien copié", "success"))
    .catch(() => toast("Copie impossible sur ce navigateur", "error"));
}

function cableArrivee(root, etat) {
  const input = root.querySelector("#du-nom");
  const go = async () => {
    const nom = (input?.value || "").trim();
    if (!nom) {
      input?.focus();
      toast("Il me faut juste ton prénom", "info");
      return;
    }
    const btn = root.querySelector("[data-entrer]");
    if (btn) btn.disabled = true;
    haptic("tap");
    try {
      const r = await appel("join", { code: etat.code, name: nom });
      etat.playerId = r.playerId;
      etat.total = r.total || 10;
      etat.joueurs = [...(r.players || []), r.name];
      poseJeton(etat.code, { playerId: r.playerId, fini: false });
      track("duel.rejoint", { code: etat.code });
      lanceJeu(root, etat);
    } catch (e) {
      console.error("[duel:join]", e);
      if (btn) btn.disabled = false;
      toast(
        String(e.message) === "complet"
          ? "La partie est complète"
          : "Impossible de rejoindre",
        "error",
      );
    }
  };
  root.querySelector("[data-entrer]")?.addEventListener("click", go);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") go();
  });
  input?.focus();
}

async function lanceJeu(root, etat) {
  root.innerHTML = squelette();
  try {
    const r = await appel("questions", { code: etat.code });
    etat.questions = r.questions || [];
  } catch (e) {
    console.error("[duel:questions]", e);
    toast("Les questions n'ont pas pu être chargées", "error");
    return;
  }
  if (!etat.questions.length) {
    toast("Cette partie n'a plus de questions", "error");
    return;
  }
  etat.i = 0;
  etat.reponse = null;
  etat.score = 0;
  etat.ratees = [];
  dessineQuestion(root, etat);
}

function dessineQuestion(root, etat) {
  root.innerHTML = vueQuestion(etat);

  root.querySelectorAll("[data-rep]").forEach((b) => {
    b.addEventListener("click", () => {
      if (etat.reponse != null) return;
      const choix = Number(b.getAttribute("data-rep"));
      const q = etat.questions[etat.i];
      etat.reponse = choix;
      if (choix === q.correct_index) {
        etat.score++;
        haptic("success");
      } else {
        etat.ratees.push(q.id);
        haptic("error");
      }
      dessineQuestion(root, etat);
    });
  });

  root.querySelector("[data-suite]")?.addEventListener("click", async () => {
    haptic("tap");
    if (etat.i < etat.questions.length - 1) {
      etat.i++;
      etat.reponse = null;
      dessineQuestion(root, etat);
      return;
    }
    root.innerHTML = squelette();
    try {
      await appel("finish", {
        playerId: etat.playerId,
        score: etat.score,
        missed: etat.ratees,
      });
      poseJeton(etat.code, { playerId: etat.playerId, fini: true });
      track("duel.termine", { code: etat.code, score: etat.score });
    } catch (e) {
      // « déjà joué » n'est pas une erreur pour le joueur : il verra le
      // classement, c'est ce qu'il attend.
      if (String(e.message) !== "deja_joue") console.error("[duel:finish]", e);
    }
    etat.fini = true;
    afficheClassement(root, etat);
  });
}

async function afficheClassement(root, etat) {
  root.innerHTML = squelette();
  try {
    const r = await appel("results", { code: etat.code });
    etat.classement = r.classement || [];
    etat.ratee = r.ratee || null;
    etat.total = r.total || etat.total;
  } catch (e) {
    console.error("[duel:results]", e);
    toast("Le classement n'a pas pu être chargé", "error");
    return;
  }
  root.innerHTML = vueClassement(etat);

  root.querySelector("[data-relancer]")?.addEventListener("click", () => {
    haptic("tap");
    track("duel.relance", { code: etat.code });
    navigate(getCurUser() ? "/duel" : "/creer-compte");
  });
  root.querySelector("[data-rafraichir]")?.addEventListener("click", () => {
    haptic("tap");
    afficheClassement(root, etat);
  });
  root.querySelector("[data-compte]")?.addEventListener("click", () => {
    haptic("tap");
    track("duel.vers_compte", { code: etat.code });
    navigate("/creer-compte");
  });
}
