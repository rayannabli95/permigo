// Point d'entrée du prototype. On peut ouvrir un exercice précis avec
// ?preset=<id> (ex. ?preset=priorite-a-droite) pour montrer un décor sans
// dérouler tout le parcours.
import { monter } from "./engine.js";

const demande = new URLSearchParams(location.search).get("preset");
monter(document.querySelector("#labo"), demande || undefined);
