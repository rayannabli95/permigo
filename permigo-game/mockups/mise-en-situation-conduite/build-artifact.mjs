// Fabrique la page jouable à envoyer à Rayan. Tout est embarqué : la page
// publiée n'a le droit d'aller chercher aucun fichier ailleurs.
import fs from "node:fs";
import path from "node:path";

const ART = "/Users/macbookm3/Desktop/permigo-v7/permigo-game/public/art/course";
const OUT = path.dirname(new URL(import.meta.url).pathname);
const uri = (f) =>
  `data:image/webp;base64,${fs.readFileSync(path.join(ART, f)).toString("base64")}`;

const A = {
  bitume: uri("bitume.webp"),
  horizon: uri("horizon.webp"),
  joueur: uri("c-joueur.webp"),
  gris: uri("c-gris.webp"),
  rouge: uri("c-rouge.webp"),
  camion: uri("c-camion.webp"),
  velo: uri("c-velo.webp"),
  pieton: uri("c-pieton.webp"),
};

let css = fs.readFileSync(path.join(ART, "jeu.css"), "utf8");
css = css.replace('url("/art/course/bitume.webp")', `url("${A.bitume}")`);

let js = fs.readFileSync(path.join(ART, "jeu.js"), "utf8");
js = js
  .replace("${sur}/horizon.webp", "${A.horizon}")
  .replace("${sur}/c-joueur.webp", "${A.joueur}")
  .replace("${sur}/c-${a.piece}.webp", "${A[a.piece]}")
  .replace(/^export /gm, "");

const page = `<style>
${css}
.pg{max-width:440px;margin:0 auto;padding:34px 16px 60px;
  font-family:'Archivo',system-ui,-apple-system,sans-serif;color:#f4f1ff}
.pg h1{font-size:clamp(26px,6vw,38px);line-height:1.04;margin:0 0 12px;font-weight:800;
  letter-spacing:-.02em;text-wrap:balance}
.pg h1 em{font-style:normal;color:#f0b98a}
.pg p{color:#b4a9d6;font-size:16px;line-height:1.6;margin:0 0 26px}
.pg .note{font-size:14px;line-height:1.6;margin:22px 0 0;color:#b4a9d6}
.pg .note b{color:#f4f1ff;display:block;margin-bottom:2px;font-size:15px}
.pg .rejouer{display:block;width:100%;margin-top:16px;font:inherit;font-size:15px;font-weight:700;
  color:#120d28;background:linear-gradient(180deg,#ffd9a8,#f0b98a);border:0;border-radius:12px;
  padding:13px;cursor:pointer}
body{margin:0;background:radial-gradient(80% 50% at 50% 0%,rgba(124,92,255,.16),transparent 70%),
  linear-gradient(180deg,#0d0920,#0b0819)}
</style>

<div class="pg">
  <h1>Tu ne regardes plus une carte. <em>Tu conduis.</em></h1>
  <p>La route vient vers toi, une situation arrive, le temps ralentit le temps que tu choisisses. Bonne réponse, le combo monte et ça enchaîne. Mauvaise réponse, tu freines et tu prends la leçon dans la figure. Aucun écran de résultat entre deux.</p>

  <div id="jeu"></div>
  <button class="rejouer" type="button">Rejouer</button>

  <p class="note"><b>Ce qui est vrai à l'écran</b>Une voie fait 3,20 m et le sol est un plan basculé, donc un véhicule à 40 m se place et se dimensionne tout seul. Rien n'est calé à l'œil.</p>
  <p class="note"><b>Ce que ça pèse</b>Tout le décor et les six véhicules tiennent en 240 Ko. C'est du CSS et deux images, pas un moteur 3D.</p>
</div>

<script type="module">
const A = ${JSON.stringify(A)};
${js}
const hote = document.getElementById("jeu");
let partie = creerJeu(hote);
document.querySelector(".rejouer").addEventListener("click", () => {
  partie.arreter();
  partie = creerJeu(hote);
});
</script>`;

fs.writeFileSync(path.join(OUT, "..", "jeu-permigo.html"), page);
console.log("ok", (page.length / 1024).toFixed(0) + " Ko");
