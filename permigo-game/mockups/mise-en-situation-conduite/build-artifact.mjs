// Fabrique la page jouable à envoyer à Rayan. Tout est embarqué : la page
// publiée n'a le droit d'aller chercher aucun fichier ailleurs.
import fs from "node:fs";
import path from "node:path";

const ART = "/Users/macbookm3/Desktop/permigo-v7/permigo-game/public/art/course";
const OUT = path.dirname(new URL(import.meta.url).pathname);
const uri = (f) =>
  `data:image/webp;base64,${fs.readFileSync(path.join(ART, f)).toString("base64")}`;

const A = {
  horizon: uri("horizon.webp"),
  joueur: uri("c-joueur.webp"),
  joueurG: uri("c-joueur-g.webp"),
  joueurD: uri("c-joueur-d.webp"),
  gris: uri("c-gris.webp"),
  rouge: uri("c-rouge.webp"),
  camion: uri("c-camion.webp"),
  velo: uri("c-velo.webp"),
  pieton: uri("c-pieton.webp"),
  suiveur: uri("c-suiveur.webp"),
  lampe: uri("d-lampe.webp"),
  arbre: uri("d-arbre.webp"),
};

const css = fs.readFileSync(path.join(ART, "jeu.css"), "utf8");

// Les deux modules sont recollés en un seul script : l'import relatif ne
// résout rien dans une page sans fichiers à côté d'elle.
const route = fs
  .readFileSync(path.join(ART, "route.js"), "utf8")
  .replace(/^export /gm, "");
const jeu = fs
  .readFileSync(path.join(ART, "jeu.js"), "utf8")
  .replace(/^import .*$/gm, "")
  .replace("${sur}/horizon.webp", "${A.horizon}")
  .replace("${sur}/c-joueur-g.webp", "${A.joueurG}")
  .replace("${sur}/c-joueur-d.webp", "${A.joueurD}")
  .replace("${sur}/c-joueur.webp", "${A.joueur}")
  .replace("${sur}/c-suiveur.webp", "${A.suiveur}")
  .replace("${sur}/d-${n}.webp", "${A[n]}")
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
  <p>La route vient vers toi, une situation arrive, le temps ralentit le temps que tu choisisses. Bonne réponse, le combo monte et ça enchaîne. Mauvaise réponse, tu freines et tu prends la leçon. Aucun écran de résultat entre deux.</p>

  <div id="jeu"></div>
  <button class="rejouer" type="button">Rejouer</button>

  <p class="note"><b>Neuf secondes pour choisir</b>Et le monde tourne à un cinquième de sa vitesse pendant que la carte est levée. Avant, la scène était passée avant qu'on ait fini de lire.</p>
  <p class="note"><b>La route tourne</b>Elle est peinte en tranches de 4 m, chacune avec sa courbure, comme dans OutRun ou Horizon Chase. Une route qui tourne n'est pas un trapèze, elle ne peut pas se peindre d'un seul tenant. Les lampadaires, les arbres et les autres véhicules suivent la courbe sans une ligne de code en plus.</p>
  <p class="note"><b>Tu changes vraiment de voie</b>Quand tu doubles, ce n'est pas l'image qui penche : la voiture se déplace en mètres et toute la route glisse sous elle. La caméra la suit à 80 %, le reste c'est elle qui dérive à l'écran.</p>
  <p class="note"><b>La force centrifuge</b>Dans un virage à droite tu es poussé vers la gauche, et la voiture montre ses roues braquées. C'est ce qui fait qu'une courbe se ressent au lieu de se regarder.</p>
  <p class="note"><b>Le rétroviseur, le seul autre angle</b>Il rejoue la même projection en marche arrière. Il occupe le haut de l'écran qui était vide, et il rend jouables les situations qui se passent derrière. La quatrième question en est une.</p>
  <p class="note"><b>Ce qui est vrai à l'écran</b>Une voie fait 3,20 m, et la route, les lampadaires, les arbres et les véhicules passent tous par le même calcul de perspective. Rien n'est calé à l'œil.</p>
</div>

<script type="module">
const A = ${JSON.stringify(A)};
${route}
${jeu}
const hote = document.getElementById("jeu");
let partie = creerJeu(hote);
document.querySelector(".rejouer").addEventListener("click", () => {
  partie.arreter();
  partie = creerJeu(hote);
});
</script>`;

fs.writeFileSync(path.join(OUT, "..", "jeu-permigo.html"), page);
console.log("ok", (page.length / 1024).toFixed(0) + " Ko");
