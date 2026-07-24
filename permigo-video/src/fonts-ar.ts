// Police arabe LOCALE (Cairo variable) — glyphes arabes réels, chargée depuis
// public/fonts/ (téléchargée depuis google/fonts). AUCUN fetch réseau au rendu :
// le fichier est servi par staticFile(). Chargée via l'API FontFace + delayRender
// pour que le rendu attende que les glyphes soient prêts (déterministe).
import { staticFile, delayRender, continueRender } from "remotion";

export const CAIRO = "Cairo";

// Chargement au niveau module (une seule fois, comme @remotion/google-fonts).
const handle = delayRender("load-cairo-arabic");
const face = new FontFace(
  CAIRO,
  `url(${staticFile("fonts/Cairo-Variable.ttf")}) format('truetype')`,
  { weight: "200 1000", display: "block" },
);
face
  .load()
  .then((loaded) => {
    document.fonts.add(loaded);
    continueRender(handle);
  })
  .catch((err) => {
    // ne bloque pas le rendu si échec — on continue quand même
    // eslint-disable-next-line no-console
    console.error("Cairo font load failed", err);
    continueRender(handle);
  });
