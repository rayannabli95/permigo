// Construit la page de démo « plateau + voitures qui bougent ».
// Sort deux fichiers : demo-body.html (pour l'artifact, sans <html>) et
// demo-full.html (document complet, pour la capture Playwright).
import fs from "node:fs";
import path from "node:path";

const ART = "/Users/macbookm3/Desktop/permigo-v7/permigo-game/public/art/plateau";
const OUT = path.dirname(new URL(import.meta.url).pathname);

const uri = (f) =>
  `data:image/webp;base64,${fs.readFileSync(path.join(ART, f)).toString("base64")}`;

const P = Object.fromEntries(
  ["croisement", "route", "giratoire", "autoroute", "insertion"].map((n) => [
    n,
    uri(`${n}.webp`),
  ]),
);
const V = Object.fromEntries(
  [
    "joueur",
    "gris",
    "rouge",
    "bleu",
    "jaune",
    "moto",
    "camion",
    "velo",
    "bus",
    "pieton",
  ].map((n) => [n, uri(`v-${n}.webp`)]),
);

// Largeur réelle en mètres de chaque pièce. C'est elle, et pas la taille du
// fichier, qui donne l'échelle : une voie fait 3,2 m, donc tout se déduit.
// ⚠️ C'est l'ENCOMBREMENT de la pièce détourée, pas la carrosserie : le
// cycliste écarte les coudes, le piéton balance les bras. Sinon ils font la
// taille d'une pièce de monnaie sur le plateau.
const METRES = {
  joueur: 1.8,
  gris: 1.85,
  rouge: 1.78,
  bleu: 1.8,
  jaune: 1.75,
  moto: 0.9,
  camion: 2.3,
  velo: 0.75,
  bus: 2.5,
  pieton: 1.35,
};

// Largeur d'une voie, relevée à l'écran sur chaque plateau (en % du plateau).
const VOIE = { croisement: 17, route: 35, giratoire: 8, autoroute: 15, insertion: 16 };
const parMetre = (plateau) => VOIE[plateau] / 3.2;

// Le giratoire : une orbite, pas une translation.
// 🔴 `translate(x%)` se calcule sur la PIÈCE, jamais sur le plateau. Un
// translateY(-31%) déplaçait donc la voiture d'un tiers de sa propre longueur
// et elle restait plantée sur l'îlot central. On calcule les positions.
// Relevé sur le plateau : îlot jusqu'à r=18, voie intérieure r=24, voie
// extérieure r=30, bord r=33. Tout en % du plateau.
function orbite(nom, depart, rayon = 30, pas = 48) {
  const img = [];
  for (let i = 0; i <= pas; i++) {
    const t = i / pas;
    // 🔴 On tourne dans le sens ANTIHORAIRE. L'angle DÉCROÎT.
    const th = depart - 360 * t;
    const a = (th * Math.PI) / 180;
    const x = 50 + rayon * Math.sin(a);
    const y = 50 - rayon * Math.cos(a);
    img.push(
      `${(t * 100).toFixed(2)}%{left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;transform:translate(-50%,-50%) rotate(${(th - 90).toFixed(1)}deg)}`,
    );
  }
  return `@keyframes ${nom}{${img.join("")}}`;
}

const piece = (plateau, nom, cls, style = "") =>
  `<img class="pc ${cls}" src="${V[nom]}" alt="" style="width:${(METRES[nom] * parMetre(plateau)).toFixed(2)}%;${style}">`;

const scenes = `
<section class="scenes">

  <figure class="sc">
    <div class="board" style="background-image:url('${P.croisement}')">
      <div class="halo h-joueur"></div>
      ${piece("croisement", "joueur", "a-joueur")}
      ${piece("croisement", "pieton", "a-pieton")}
      ${piece("croisement", "rouge", "a-rouge")}
    </div>
    <figcaption><b>Un piéton s'engage</b>Le plateau est une image. La voiture, le piéton et la voiture rouge sont trois pièces posées dessus, placées en mètres.</figcaption>
  </figure>

  <figure class="sc">
    <div class="board" style="background-image:url('${P.route}')">
      <div class="halo h-joueur2"></div>
      ${piece("route", "joueur", "b-joueur")}
      ${piece("route", "velo", "b-velo")}
    </div>
    <figcaption><b>Dépasser un cycliste</b>La même pièce violette, sur un autre plateau. Elle se déporte, elle double, elle se rabat.</figcaption>
  </figure>

  <figure class="sc">
    <div class="board" style="background-image:url('${P.giratoire}')">
      ${piece("giratoire", "joueur", "c-joueur")}
      ${piece("giratoire", "bleu", "c-bleu")}
      ${piece("giratoire", "camion", "c-camion")}
    </div>
    <figcaption><b>Entrer dans un giratoire</b>Une trajectoire courbe est une simple rotation. Rien n'est redessiné.</figcaption>
  </figure>

</section>`;

const inventaire = `
<section class="inv">
  <h2>Les cinq plateaux</h2>
  <div class="grille grille-p">
    ${["croisement", "route", "giratoire", "autoroute", "insertion"]
      .map(
        (n) =>
          `<figure><img src="${P[n]}" alt=""><figcaption>${n}</figcaption></figure>`,
      )
      .join("")}
  </div>
  <h2>Les dix pièces</h2>
  <div class="grille grille-v">
    ${Object.keys(V)
      .map(
        (n) =>
          `<figure><span><img src="${V[n]}" alt=""></span><figcaption>${n}</figcaption></figure>`,
      )
      .join("")}
  </div>
</section>`;

const css = `
:root{
  --nuit:#120d28; --nuit2:#1a1436; --nuit3:#241c4a;
  --violet:#7c5cff; --lila:#c4b6ff; --sodium:#d4976d; --chaud:#f0b98a;
  --ink:#f4f1ff; --ink2:#b4a9d6; --trait:rgba(148,132,255,.17);
}
*{box-sizing:border-box}
body{margin:0;background:
    radial-gradient(80% 60% at 50% -10%, rgba(124,92,255,.18), transparent 70%),
    linear-gradient(180deg,#0d0920 0%,#120d28 60%,#0b0819 100%);
  color:var(--ink);
  font-family:'Archivo',system-ui,-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased}
.wrap{max-width:960px;margin:0 auto;padding:56px 20px 80px}
h1{font-size:clamp(28px,5vw,46px);line-height:1.05;margin:0 0 14px;font-weight:800;letter-spacing:-.02em;text-wrap:balance}
h1 em{font-style:normal;color:var(--sodium)}
.chapeau{color:var(--ink2);font-size:17px;line-height:1.6;max-width:60ch;margin:0 0 44px}
h2{font-size:20px;margin:48px 0 16px;font-weight:700;letter-spacing:-.01em}

.scenes{display:flex;flex-direction:column;gap:34px}
.sc{margin:0}
.board{position:relative;width:100%;aspect-ratio:1/1;border-radius:20px;overflow:hidden;
  background-size:cover;background-position:center;
  border:1px solid var(--trait);
  box-shadow:inset 0 1px 0 rgba(196,182,255,.24), inset 0 -30px 46px -28px rgba(0,0,0,.8), 0 14px 34px -18px rgba(0,0,0,.8)}
.board::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;
  background:radial-gradient(122% 122% at 50% 44%,transparent 52%,rgba(8,6,22,.5) 100%)}
.pc{position:absolute;left:0;top:0;transform-origin:50% 50%;
  filter:drop-shadow(0 6px 10px rgba(0,0,0,.55))}
.halo{position:absolute;width:26%;aspect-ratio:1/1;border-radius:50%;
  background:radial-gradient(circle,rgba(124,92,255,.34),transparent 68%);
  transform:translate(-50%,-50%);pointer-events:none}

figcaption{color:var(--ink2);font-size:14.5px;line-height:1.55;margin-top:12px}
.sc figcaption b{display:block;color:var(--ink);font-size:16px;margin-bottom:3px;font-weight:700}

.grille{display:grid;gap:12px}
.grille-p{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.grille-v{grid-template-columns:repeat(auto-fit,minmax(84px,1fr))}
.grille figure{margin:0}
.grille img{display:block;width:100%;border-radius:12px}
.grille-v span{position:relative;display:block;aspect-ratio:1/1;border-radius:12px;
  background:linear-gradient(180deg,var(--nuit3),var(--nuit));border:1px solid var(--trait)}
/* ⚠️ Une hauteur en pourcentage ne résout rien quand la case centre son
   contenu : la hauteur de référence redevient auto et la pièce déborde. On lui
   donne une BOÎTE définie, et contain la range dedans. */
.grille-v img{position:absolute;inset:10px;width:auto;height:auto;
  max-width:calc(100% - 20px);max-height:calc(100% - 20px);margin:auto;
  object-fit:contain;border-radius:0;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))}
.grille figcaption{font-size:12px;text-align:center;margin-top:6px;color:var(--ink2);letter-spacing:.02em}

/* ─── Scène 1 · le croisement ───────────────────────────────
   Voie montante à x=57, passage piéton entre y=70 et y=79.
   La voiture s'arrête AVANT le passage, centre à y=93. */
.a-joueur{left:57%;animation:aJoueur 11s linear infinite}
.h-joueur{left:57%;animation:aHalo 11s linear infinite}
.a-pieton{left:30%;top:74%;animation:aPieton 11s linear infinite}
/* Elle roule vers l'est, donc sur la MOITIÉ BASSE de la chaussée. */
.a-rouge{top:57%;animation:aRouge 11s linear infinite}
@keyframes aJoueur{
  0%   {top:130%;transform:translate(-50%,-50%)}
  16%  {top:93%; transform:translate(-50%,-50%)}
  56%  {top:93%; transform:translate(-50%,-50%)}
  100% {top:-30%;transform:translate(-50%,-50%)}
}
@keyframes aHalo{
  0%{top:130%}16%{top:93%}56%{top:93%}100%{top:-30%}
}
@keyframes aPieton{
  0%,14%   {left:26%;opacity:0}
  18%      {left:28%;opacity:1;transform:translate(-50%,-50%) rotate(90deg)}
  52%      {left:70%;opacity:1;transform:translate(-50%,-50%) rotate(90deg)}
  58%,100% {left:72%;opacity:0;transform:translate(-50%,-50%) rotate(90deg)}
}
@keyframes aRouge{
  0%   {left:-12%;transform:translate(-50%,-50%) rotate(90deg)}
  38%  {left:112%;transform:translate(-50%,-50%) rotate(90deg)}
  100% {left:112%;transform:translate(-50%,-50%) rotate(90deg)}
}

/* ─── Scène 2 · le dépassement ─────────────────────────────
   Voie de droite à x=65, axe à x=48. On empiète, on ne franchit pas. */
.b-joueur{animation:bJoueur 10s ease-in-out infinite}
.h-joueur2{animation:bHalo 10s ease-in-out infinite}
.b-velo{left:76%;animation:bVelo 10s linear infinite}
@keyframes bJoueur{
  0%   {left:66%;top:135%;transform:translate(-50%,-50%) rotate(0deg)}
  22%  {left:66%;top:82%; transform:translate(-50%,-50%) rotate(0deg)}
  38%  {left:55%;top:58%; transform:translate(-50%,-50%) rotate(-8deg)}
  58%  {left:55%;top:22%; transform:translate(-50%,-50%) rotate(0deg)}
  74%  {left:65%;top:2%;  transform:translate(-50%,-50%) rotate(8deg)}
  100% {left:66%;top:-40%;transform:translate(-50%,-50%) rotate(0deg)}
}
@keyframes bHalo{
  0%{left:66%;top:135%}22%{left:66%;top:82%}38%{left:55%;top:58%}
  58%{left:55%;top:22%}74%{left:65%;top:2%}100%{left:66%;top:-40%}
}
/* Le cycliste garde une allure lente : il n'avance que d'un tiers de plateau. */
@keyframes bVelo{
  0%   {top:62%; transform:translate(-50%,-50%)}
  100% {top:26%; transform:translate(-50%,-50%)}
}

/* ─── Scène 3 · le giratoire ───────────────────────────────
   L'anneau est centré. Tourner = faire tourner un rayon. */
.c-joueur{animation:cJoueur 14s linear infinite}
.c-bleu{animation:cBleu 14s linear infinite}
.c-camion{animation:cCamion 18s linear infinite}
${orbite("cJoueur", 200, 30)}
${orbite("cBleu", 60, 24)}
${orbite("cCamion", 310, 30)}

@media (prefers-reduced-motion:reduce){
  .pc,.halo{animation:none!important}
}
`;

const body = `
<div class="wrap">
  <h1>Le plateau devient <em>une image</em>. Les voitures <em>bougent dessus</em>.</h1>
  <p class="chapeau">Les mises en situation étaient dessinées trait par trait, en plein jour, sur un fond de nuit. Elles deviennent ce que sont déjà les fiches de révision : une vue du ciel. Le décor est une image, chaque véhicule est une pièce découpée, et le placement se fait en mètres. Une voie fait 3,2 m, tout le reste s'en déduit.</p>
  ${scenes}
  ${inventaire}
</div>`;

fs.writeFileSync(path.join(OUT, "demo-body.html"), `<style>${css}</style>${body}`);
fs.writeFileSync(
  path.join(OUT, "demo-full.html"),
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plateau</title><style>${css}</style></head><body>${body}</body></html>`,
);
console.log(
  "ok",
  (fs.statSync(path.join(OUT, "demo-body.html")).size / 1024).toFixed(0) + " Ko",
);
