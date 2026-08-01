// ═══════════════════════════════════════════════════════════════
// Souligne les mots de moniteur dans une fiche, et ouvre leur définition.
//
// On travaille sur les NŒUDS TEXTE du DOM déjà rendu, jamais sur la chaîne
// HTML : une recherche de « point mort » dans du HTML finirait un jour par
// tomber dans un attribut ou dans un nom de classe, et casserait la page.
//
// Un mot n'est souligné qu'à sa PREMIÈRE apparition dans la fiche. Souligner
// les huit « rétrograder » d'une fiche transforme le texte en sapin de Noël
// et on ne lit plus rien.
// ═══════════════════════════════════════════════════════════════
import { openCoachSheet } from "@/components/eleve/coach-sheet.js";
import { getLang } from "@/utils/lang.js";
import { termesAReperer, terme } from "@/data/glossaire.js";
import { haptic } from "@/utils/haptic.js";
import { icon } from "@/utils/icons.js";

const STYLE_ID = "glossaire-style";

const CSS = `
.gl-mot{
  display:inline; padding:0; margin:0; border:0; background:none; cursor:pointer;
  font:inherit; color:inherit; -webkit-tap-highlight-color:transparent;
  text-decoration:underline; text-decoration-style:dotted; text-decoration-thickness:1.5px;
  text-underline-offset:3px; text-decoration-color:currentColor;
}
.gl-mot::after{
  content:''; display:inline-block; width:.42em; height:.42em; margin-inline-start:.22em;
  border:1.4px solid currentColor; border-radius:50%; opacity:.62; vertical-align:.16em;
}
.gl-mot:active{ opacity:.6; }
.gl-mot:focus-visible{ outline:2px solid currentColor; outline-offset:2px; border-radius:3px; }

/* Le lexique de la fiche : les gestes de la méthode sont des cartes cliquables,
   on ne peut pas y glisser un bouton dans un bouton. Les mots qui s'y trouvent
   sont donc rassemblés ici, sous la méthode. */
.gl-lex{ margin:18px 18px 0; padding:14px 15px; border-radius:16px;
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); }
.gl-lex-h{ display:block; margin:0 0 10px; font:800 11px/1 'Archivo',sans-serif;
  letter-spacing:.09em; text-transform:uppercase; color:#c9bdf5; }
.gl-chips{ display:flex; flex-wrap:wrap; gap:8px; }
.gl-chip{ min-height:34px; padding:7px 13px; cursor:pointer; border-radius:99px;
  background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.18);
  font:700 13px/1.2 'Archivo',sans-serif; color:#f0ecff; }
.gl-chip:active{ transform:scale(.96); }
.gl-chip:focus-visible{ outline:2px solid #ffe4a6; outline-offset:2px; }
`;

function injecterStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Les zones où on ne touche à rien : boutons, champs, code. */
const INTERDITS = new Set([
  "BUTTON",
  "A",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "CODE",
  "SVG",
  "STYLE",
  "SCRIPT",
]);

function estMarquable(noeud) {
  for (let p = noeud.parentElement; p; p = p.parentElement) {
    if (INTERDITS.has(p.tagName)) return false;
    if (p.classList?.contains("gl-mot")) return false;
  }
  return true;
}

/** Une frontière de mot qui tient compte des accents (\b ne les gère pas). */
function bornes(forme) {
  const echappe = forme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}-])(${echappe})(?![\\p{L}\\p{N}-])`,
    "iu",
  );
}

/**
 * @param {HTMLElement} racine la zone de texte de la fiche
 * @param {'manuelle'|'auto'|null} boite
 * @returns {number} nombre de mots soulignés
 */
export function marquerTermes(racine, boite) {
  if (!racine) return 0;
  injecterStyle();

  const restants = termesAReperer(boite);
  const faits = new Set();
  let poses = 0;

  // On collecte AVANT de modifier : remplacer un nœud pendant qu'on marche
  // dessus fait sauter des nœuds au TreeWalker.
  const noeuds = [];
  const walker = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeValue && n.nodeValue.trim().length > 2 && estMarquable(n))
      noeuds.push(n);
  }

  for (const noeud of noeuds) {
    for (const { forme, t } of restants) {
      if (faits.has(t.id)) continue;
      const m = bornes(forme).exec(noeud.nodeValue);
      if (!m) continue;

      const debut = m.index + m[1].length;
      const fin = debut + m[2].length;
      const apres = noeud.splitText(debut);
      apres.splitText(fin - debut);

      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "gl-mot";
      bouton.dataset.terme = t.id;
      bouton.setAttribute("aria-label", `${m[2]}. Voir la définition`);
      bouton.textContent = apres.nodeValue;
      apres.parentNode.replaceChild(bouton, apres);

      faits.add(t.id);
      poses += 1;
      break; // ce nœud est coupé en trois, on passe au suivant
    }
  }

  return poses;
}

/**
 * Pose le lexique de la fiche : tous les mots de moniteur présents dans le
 * texte, y compris ceux enfermés dans les cartes cliquables de la méthode.
 *
 * @param {HTMLElement} zoneFiche
 * @param {'manuelle'|'auto'|null} boite
 * @param {string} titre libellé traduit, ex. « Les mots de la fiche »
 * @returns {number} nombre de mots proposés
 */
export function poserLexique(zoneFiche, boite, titre) {
  if (!zoneFiche || zoneFiche.querySelector(".gl-lex")) return 0;
  const ancre = zoneFiche.querySelector(".fd-actions");
  if (!ancre) return 0;
  injecterStyle();

  const texte = zoneFiche.textContent || "";
  const trouves = [];
  const vus = new Set();
  for (const { forme, t } of termesAReperer(boite)) {
    if (vus.has(t.id)) continue;
    if (!bornes(forme).test(texte)) continue;
    vus.add(t.id);
    trouves.push(t);
  }
  if (!trouves.length) return 0;

  const lang = getLang();
  const bloc = document.createElement("div");
  bloc.className = "gl-lex";
  const h = document.createElement("span");
  h.className = "gl-lex-h";
  h.textContent = titre;
  bloc.appendChild(h);
  const chips = document.createElement("div");
  chips.className = "gl-chips";
  for (const t of trouves) {
    const trad = lang !== "fr" ? t[lang] : null;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gl-chip";
    b.dataset.terme = t.id;
    b.textContent = trad ? `${trad.mot} · ${t.mot}` : t.mot;
    chips.appendChild(b);
  }
  bloc.appendChild(chips);
  ancre.parentNode.insertBefore(bloc, ancre);
  return trouves.length;
}

/** Ouvre la définition d'un terme dans la feuille du coach. */
export function ouvrirTerme(id) {
  const t = terme(id);
  if (!t) return;
  const lang = getLang();
  const trad = lang !== "fr" ? t[lang] : null;
  haptic("tap");
  openCoachSheet({
    title: trad ? `${trad.mot} · ${t.mot}` : t.mot,
    fr: t.fr,
    tr: trad ? trad.def : null,
    rtl: lang === "ar",
    // `icon` attend du HTML d'icône, pas un nom de médaillon.
    icon: icon("book", { size: 26, strokeWidth: 2 }),
  });
}

/**
 * Branche les clics une seule fois sur un conteneur (délégation) : la fiche
 * se redessine souvent, on ne veut pas empiler les écouteurs.
 * @param {HTMLElement} racine
 */
export function brancherGlossaire(racine) {
  if (!racine || racine.dataset.glossaireBranche === "1") return;
  racine.dataset.glossaireBranche = "1";
  racine.addEventListener("click", (e) => {
    const bouton = e.target.closest?.(".gl-mot, .gl-chip");
    if (!bouton) return;
    e.preventDefault();
    e.stopPropagation();
    ouvrirTerme(bouton.dataset.terme);
  });
}
