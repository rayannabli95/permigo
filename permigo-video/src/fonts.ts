// Chargement des vraies polices PermiGo via @remotion/google-fonts.
// Les fontFamily retournés sont hashés par Remotion → on les réexporte pour les composants.
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadBaloo } from "@remotion/google-fonts/Baloo2";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const jakarta = loadJakarta("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
}).fontFamily;

export const fredoka = loadFredoka("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
}).fontFamily;

export const baloo = loadBaloo("normal", {
  weights: ["600", "700", "800"],
  subsets: ["latin"],
}).fontFamily;

export const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
}).fontFamily;
