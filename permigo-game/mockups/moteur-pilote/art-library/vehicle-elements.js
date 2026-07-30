/**
 * Bibliothèque graphique Mode Pilote — lot 3 « Véhicule et contrôles ».
 *
 * Contrat public :
 *   renderVehicleElement(type, options) -> chaîne HTML autonome
 *   mountVehicleElement(target, type, options) -> HTMLElement
 */

import {
  ART_PALETTE,
  createArtId,
  escapeText,
  renderElementFrame,
  safeState,
  svgShell,
} from "./art-core.js";

export const VEHICLE_FLUIDS = Object.freeze([
  Object.freeze({
    id: "oil",
    label: "Huile moteur",
    shortLabel: "Huile",
    tone: ART_PALETTE.gold,
  }),
  Object.freeze({
    id: "coolant",
    label: "Liquide de refroidissement",
    shortLabel: "Refroid.",
    tone: ART_PALETTE.red,
  }),
  Object.freeze({
    id: "brake",
    label: "Liquide de frein",
    shortLabel: "Frein",
    tone: ART_PALETTE.gold,
  }),
  Object.freeze({
    id: "washer",
    label: "Lave-glace",
    shortLabel: "Lave-glace",
    tone: ART_PALETTE.green,
  }),
]);

export const LOT_THREE_ELEMENTS = Object.freeze([
  Object.freeze({
    type: "car-front",
    number: 10,
    title: "Voiture de face",
    shortTitle: "Vue frontale",
    ariaLabel: "Voiture vue de face",
  }),
  Object.freeze({
    type: "car-rear",
    number: 11,
    title: "Voiture de dos",
    shortTitle: "Vue arrière",
    ariaLabel: "Voiture vue de dos",
  }),
  Object.freeze({
    type: "car-profile",
    number: 12,
    title: "Voiture de profil",
    shortTitle: "Vue latérale",
    ariaLabel: "Voiture vue de profil",
  }),
  Object.freeze({
    type: "tyre-wear",
    number: 13,
    title: "Pneu et témoin",
    shortTitle: "Usure pilotable",
    ariaLabel: "Pneu avec témoin d'usure",
  }),
  Object.freeze({
    type: "headlight-front",
    number: 14,
    title: "Feu avant",
    shortTitle: "Éteint ou allumé",
    ariaLabel: "Bloc optique avant",
  }),
  Object.freeze({
    type: "taillight-rear",
    number: 15,
    title: "Feu arrière",
    shortTitle: "Éteint ou allumé",
    ariaLabel: "Bloc optique arrière",
  }),
  Object.freeze({
    type: "hood-levels",
    number: 16,
    title: "Sous le capot",
    shortTitle: "Quatre niveaux pilotables",
    ariaLabel: "Capot ouvert et niveaux des fluides",
  }),
]);

const ELEMENT_TYPES = new Set(
  LOT_THREE_ELEMENTS.map((element) => element.type),
);
const FLUID_IDS = new Set(VEHICLE_FLUIDS.map((fluid) => fluid.id));

function safeFluid(value) {
  return FLUID_IDS.has(value) ? value : "oil";
}

function safePercent(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function wheel(id, x, y, scale = 1, className = "") {
  return `
    <g class="pg-car-wheel ${className}" transform="translate(${x} ${y}) scale(${scale})">
      <circle r="14" fill="${ART_PALETTE.night}"/>
      <circle r="8" fill="url(#${id}-metal)"/>
      <circle r="3.2" fill="${ART_PALETTE.n3}"/>
      <path d="M0-7V-3M7 0H3M0 7V3M-7 0H-3" fill="none" stroke="${ART_PALETTE.accent}" stroke-width="1.7" stroke-linecap="round"/>
    </g>`;
}

function carFront(id, options) {
  const lit = options.lit === true;
  const drawing = svgShell(
    id,
    `
      <ellipse class="pg-contact-shadow" cx="80" cy="91" rx="62" ry="6" fill="url(#${id}-contact)"/>
      ${wheel(id, 34, 79, 0.88, "pg-car-wheel-front")}
      ${wheel(id, 126, 79, 0.88, "pg-car-wheel-front")}
      <path class="pg-car-mirror" d="M31 40 18 42 13 48 31 49ZM129 40 142 42 147 48 129 49Z" fill="url(#${id}-metal)"/>
      <path class="pg-car-body" d="M61 14Q80 8 99 14L115 30Q128 36 130 44L134 72Q133 79 124 81H36Q27 79 26 72L30 44Q32 36 45 30Z" fill="url(#${id}-gloss)"/>
      <path class="pg-car-roof" d="M61 14Q80 8 99 14L105 22H55Z" fill="url(#${id}-matte)"/>
      <path class="pg-car-windshield" d="M60 21Q80 17 100 21L112 43H48Z" fill="url(#${id}-glass)"/>
      <path class="pg-focus-edge pg-car-hood-edge" d="M43 49Q80 42 117 49" fill="none" stroke="${ART_PALETTE.accent}" stroke-width="2.2" stroke-linecap="round"/>
      <path class="pg-car-lamp pg-car-lamp-front ${lit ? "is-lit" : "is-off"}" d="M35 54 61 51 58 63 35 64Z" fill="${lit ? ART_PALETTE.gold : ART_PALETTE.accent}"/>
      <path class="pg-car-lamp pg-car-lamp-front ${lit ? "is-lit" : "is-off"}" d="M125 54 99 51 102 63 125 64Z" fill="${lit ? ART_PALETTE.gold : ART_PALETTE.accent}"/>
      <rect class="pg-car-grille" x="64" y="54" width="32" height="16" rx="4" fill="${ART_PALETTE.night}"/>
      <path class="pg-car-grille-detail" d="M70 58H90M68 62H92M70 66H90" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".58" stroke-width="1.7" stroke-linecap="round"/>
      <path class="pg-car-bumper" d="M29 70Q80 76 131 70L128 80Q80 85 32 80Z" fill="url(#${id}-matte)"/>
      <g class="pg-silhouette-only">
        <path fill="${ART_PALETTE.night}" fill-rule="evenodd" d="M61 14Q80 8 99 14L115 30Q128 36 130 44L134 72Q133 79 124 81H36Q27 79 26 72L30 44Q32 36 45 30ZM60 21Q80 17 100 21L112 43H48ZM35 54 61 51 58 63 35 64ZM125 54 99 51 102 63 125 64ZM68 56H92V59H68ZM68 62H92V65H68ZM70 68H90V70H70Z"/>
        <path d="M31 40 18 42 13 48 31 49ZM129 40 142 42 147 48 129 49Z" fill="${ART_PALETTE.night}"/>
        <ellipse cx="34" cy="82" rx="12" ry="10" fill="${ART_PALETTE.night}"/>
        <ellipse cx="126" cy="82" rx="12" ry="10" fill="${ART_PALETTE.night}"/>
      </g>
    `,
    "pg-drawing-vehicle",
    { viewBox: "0 0 160 100" },
  );
  return { drawing, labels: "" };
}

function carRear(id, options) {
  const lit = options.lit === true;
  const drawing = svgShell(
    id,
    `
      <ellipse class="pg-contact-shadow" cx="80" cy="91" rx="62" ry="6" fill="url(#${id}-contact)"/>
      ${wheel(id, 34, 79, 0.88, "pg-car-wheel-rear")}
      ${wheel(id, 126, 79, 0.88, "pg-car-wheel-rear")}
      <path class="pg-car-mirror" d="M31 40 18 42 13 48 31 49ZM129 40 142 42 147 48 129 49Z" fill="url(#${id}-metal)"/>
      <path class="pg-car-body" d="M61 14Q80 8 99 14L115 30Q128 36 130 44L134 72Q133 79 124 81H36Q27 79 26 72L30 44Q32 36 45 30Z" fill="url(#${id}-gloss)"/>
      <path class="pg-car-roof" d="M61 14Q80 8 99 14L105 22H55Z" fill="url(#${id}-matte)"/>
      <path class="pg-car-rear-glass" d="M58 21Q80 17 102 21L112 44H48Z" fill="url(#${id}-glass)"/>
      <path class="pg-car-wiper" d="M58 39 84 33 94 35" fill="none" stroke="url(#${id}-metal)" stroke-width="2.4" stroke-linecap="round"/>
      <path class="pg-focus-edge pg-car-trunk-edge" d="M42 49Q80 43 118 49" fill="none" stroke="${ART_PALETTE.accent}" stroke-width="2.2" stroke-linecap="round"/>
      <path class="pg-car-lamp pg-car-lamp-rear ${lit ? "is-lit" : "is-off"}" d="M35 53 61 51 59 65 35 64Z" fill="${ART_PALETTE.red}"/>
      <path class="pg-car-lamp pg-car-lamp-rear ${lit ? "is-lit" : "is-off"}" d="M125 53 99 51 101 65 125 64Z" fill="${ART_PALETTE.red}"/>
      <rect class="pg-car-plate" x="66" y="54" width="28" height="13" rx="3" fill="${ART_PALETTE.gold}"/>
      <path class="pg-car-bumper" d="M29 70Q80 76 131 70L128 80Q80 85 32 80Z" fill="url(#${id}-matte)"/>
      <path class="pg-car-exhaust" d="M35 79H49V85H39ZM125 79H111V85H121Z" fill="url(#${id}-metal)"/>
      <g class="pg-silhouette-only">
        <path fill="${ART_PALETTE.night}" fill-rule="evenodd" d="M61 14Q80 8 99 14L115 30Q128 36 130 44L134 72Q133 79 124 81H36Q27 79 26 72L30 44Q32 36 45 30ZM58 21Q80 17 102 21L112 44H48ZM35 53 61 51 59 65 35 64ZM125 53 99 51 101 65 125 64ZM66 54H94V67H66Z"/>
        <path d="M31 40 18 42 13 48 31 49ZM129 40 142 42 147 48 129 49Z" fill="${ART_PALETTE.night}"/>
        <path d="M58 39 84 33 94 35" fill="none" stroke="${ART_PALETTE.night}" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="34" cy="82" rx="12" ry="10" fill="${ART_PALETTE.night}"/>
        <ellipse cx="126" cy="82" rx="12" ry="10" fill="${ART_PALETTE.night}"/>
        <path d="M35 79H49V86H39ZM125 79H111V86H121Z" fill="${ART_PALETTE.night}"/>
      </g>
    `,
    "pg-drawing-vehicle",
    { viewBox: "0 0 160 100" },
  );
  return { drawing, labels: "" };
}

function profileCar(id, options) {
  const lit = options.lit === true;
  const drawing = svgShell(
    id,
    `
      <ellipse class="pg-contact-shadow" cx="80" cy="84" rx="69" ry="7" fill="url(#${id}-contact)"/>
      ${wheel(id, 43, 72, 0.92, "pg-car-wheel-near")}
      ${wheel(id, 119, 72, 0.92, "pg-car-wheel-near")}
      <path class="pg-car-body" d="M10 62 21 49 46 45 64 28H102L122 45 142 51 151 64 146 73H135Q131 56 119 56T103 73H59Q55 56 43 56T27 73H13Z" fill="url(#${id}-gloss)"/>
      <path class="pg-car-profile-glass" d="M51 44 67 31H81V44ZM85 31H100L116 44H85Z" fill="url(#${id}-glass)"/>
      <path class="pg-car-door" d="M81 47V68M85 47 114 47M68 50H75" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".55" stroke-width="1.5" stroke-linecap="round"/>
      <path class="pg-car-lamp pg-car-lamp-front ${lit ? "is-lit" : "is-off"}" d="M136 52 146 57 148 63H136Z" fill="${lit ? ART_PALETTE.gold : ART_PALETTE.accent}"/>
      <path class="pg-car-lamp pg-car-lamp-rear ${lit ? "is-lit" : "is-off"}" d="M14 56 24 51 26 61H13Z" fill="${ART_PALETTE.red}"/>
      <path class="pg-focus-edge" d="M10 62 21 49 46 45 64 28H102L122 45 142 51 151 64" fill="none" stroke="${ART_PALETTE.accent}" stroke-width="2" stroke-linecap="round"/>
    `,
    "pg-drawing-vehicle",
    { viewBox: "0 0 160 100" },
  );
  return { drawing, labels: "" };
}

/**
 * Le pneu, vu de près sur la bande de roulement.
 *
 * Une roue vue de face ne montre PAS l'usure : c'est la profondeur des rainures
 * qui la dit, et elle ne se voit que de près. Le dessin est donc un gros plan de
 * la gomme : quatre pavés, trois rainures, et le témoin d'usure au fond. Quand
 * la gomme descend jusqu'au témoin, les deux arrivent au même niveau et le pneu
 * est à changer. L'écart entre un pneu neuf et un pneu usé se voit d'un coup.
 */
function tyre(id, options) {
  const wear = safePercent(options.wear, 20);

  const FOND = 70;    // fond des rainures
  const TEMOIN = 63;  // sommet du témoin d'usure, hauteur fixe
  const CROWN = 6;    // bombé de la bande de roulement

  // La gomme descend avec l'usure et s'arrête au témoin.
  const surface = Math.min(TEMOIN, 24 + wear * 0.44);
  const mort = surface >= TEMOIN - 1;
  const teinte = mort ? ART_PALETTE.red : ART_PALETTE.gold;

  // Corps de gomme : bombé sur le dessus, épaules arrondies, base au fond.
  const gomme =
    `M12 ${(surface + CROWN).toFixed(1)} ` +
    `Q50 ${surface.toFixed(1)} 88 ${(surface + CROWN).toFixed(1)} ` +
    `L88 ${FOND} L12 ${FOND} Z`;

  const rainures = [26, 46, 66]
    .map(
      (x) =>
        `<rect x="${x}" y="${(surface - 2).toFixed(1)}" width="8" height="${(
          FOND - surface + 4
        ).toFixed(1)}" rx="2" fill="${ART_PALETTE.night}"/>`,
    )
    .join("");

  // Le témoin vit au fond de chaque rainure : quand la gomme arrive à son
  // niveau, les deux affleurent et le pneu est à changer.
  const temoins = [27.5, 47.5, 67.5]
    .map(
      (x) =>
        `<rect x="${x}" y="${TEMOIN}" width="5" height="${FOND - TEMOIN}" rx="1.2" fill="${teinte}"/>`,
    )
    .join("");

  const drawing = svgShell(
    id,
    `
      <defs>
        <clipPath id="${id}-gomme"><path d="${gomme}"/></clipPath>
      </defs>

      <ellipse class="pg-contact-shadow" cx="50" cy="93" rx="40" ry="5" fill="url(#${id}-contact)"/>

      <!-- flanc et carcasse : ce qui ne s'use pas, identique sur les deux pneus -->
      <path d="M10 ${FOND} H90 V84 A8 8 0 0 1 82 92 H18 A8 8 0 0 1 10 84 Z"
        fill="${ART_PALETTE.n2}"/>
      <path d="M16 ${FOND + 6} H84 M20 ${FOND + 13} H80" stroke="${ART_PALETTE.night}"
        stroke-width="2" stroke-linecap="round" opacity=".7"/>
      <path d="M10 ${FOND} H90" stroke="${ART_PALETTE.night}" stroke-width="2.4"/>

      <!-- la gomme restante : c'est la seule chose qui change -->
      <path d="${gomme}" fill="${ART_PALETTE.n3}"/>
      <g clip-path="url(#${id}-gomme)">${rainures}</g>
      <g clip-path="url(#${id}-gomme)">${temoins}</g>

      <!-- la surface, c'est elle qui descend -->
      <path d="M12 ${(surface + CROWN).toFixed(1)} Q50 ${surface.toFixed(1)} 88 ${(surface + CROWN).toFixed(1)}"
        fill="none" stroke="${mort ? ART_PALETTE.red : ART_PALETTE.accent}"
        stroke-width="2.4" stroke-linecap="round"/>

      <!-- ce qu'il reste avant le témoin -->
      <path d="M94 ${surface.toFixed(1)} V${TEMOIN}" stroke="${teinte}"
        stroke-width="2" stroke-linecap="round"
        stroke-dasharray="${mort ? "0 5" : "3 3"}"/>
    `,
    "pg-drawing-tyre",
    { sweep: false },
  );

  return {
    drawing,
    labels: `
      <span
        class="pg-object-label pg-wear-label"
        style="--label-x:80%;--label-y:15%"
      >${wear}%</span>`,
  };
}

function frontLight(id, options) {
  const lit = options.lit === true;
  const drawing = svgShell(
    id,
    `
      <ellipse class="pg-contact-shadow" cx="48" cy="78" rx="38" ry="6" fill="url(#${id}-contact)"/>
      <path class="pg-light-housing" d="M8 62 22 32 75 20 93 36 82 68 30 76Z" fill="url(#${id}-matte)"/>
      <path class="pg-light-glass" d="M15 59 27 37 73 27 85 39 76 61 32 68Z" fill="url(#${id}-glass)"/>
      <path class="pg-light-reflector" d="M36 39 62 32 73 43 65 58 39 61 27 52Z" fill="url(#${id}-metal)"/>
      <circle class="pg-light-bulb pg-light-unit ${lit ? "is-lit" : "is-off"}" cx="51" cy="48" r="9" fill="${lit ? ART_PALETTE.gold : ART_PALETTE.n3}"/>
      <path class="pg-light-beam ${lit ? "is-lit" : "is-off"}" d="M66 37 98 25V70L65 58Z" fill="${ART_PALETTE.gold}" opacity="${lit ? ".22" : "0"}"/>
      <path class="pg-focus-edge" d="M9 62 22 32 75 20 93 36" fill="none" stroke="${ART_PALETTE.accent}" stroke-width="2" stroke-linecap="round"/>
      <path class="pg-silhouette-only" fill="${ART_PALETTE.night}" fill-rule="evenodd" d="M8 62 22 32 75 20 93 36 82 68 30 76ZM42 48A9 9 0 1 0 60 48 9 9 0 1 0 42 48Z"/>
    `,
    "pg-drawing-light",
  );
  return { drawing, labels: "" };
}

function rearLight(id, options) {
  const lit = options.lit === true;
  const drawing = svgShell(
    id,
    `
      <ellipse class="pg-contact-shadow" cx="50" cy="80" rx="36" ry="6" fill="url(#${id}-contact)"/>
      <path class="pg-light-housing" d="M10 35 28 19 78 24 92 44 80 73 29 77 12 61Z" fill="url(#${id}-matte)"/>
      <path class="pg-tail-glass pg-light-unit ${lit ? "is-lit" : "is-off"}" d="M17 38 31 27 72 31 83 45 74 65 32 69 19 57Z" fill="${ART_PALETTE.red}"/>
      <path class="pg-tail-segment" d="M31 29 38 67M50 30 55 67M68 33 70 65" fill="none" stroke="${ART_PALETTE.night}" stroke-opacity=".7" stroke-width="3"/>
      <path class="pg-tail-core ${lit ? "is-lit" : "is-off"}" d="M26 42 35 34 66 37 74 46 68 58 37 62 27 54Z" fill="${lit ? ART_PALETTE.red : ART_PALETTE.n3}"/>
      <path class="pg-focus-edge" d="M10 35 28 19 78 24 92 44" fill="none" stroke="${ART_PALETTE.accent}" stroke-width="2" stroke-linecap="round"/>
      <path class="pg-silhouette-only" fill="${ART_PALETTE.night}" fill-rule="evenodd" d="M10 35 28 19 78 24 92 44 80 73 29 77 12 61ZM31 31H38V65H31ZM49 30H56V67H49ZM67 33H74V64H67Z"/>
    `,
    "pg-drawing-light",
  );
  return { drawing, labels: "" };
}

function fluidContainer(id, fluid, x, y, width, height, options) {
  const selected = fluid.id === options.fluid;
  const level = selected ? options.level : 72;
  const innerHeight = Math.max(2, ((height - 8) * level) / 100);
  const innerY = y + height - 4 - innerHeight;
  return `
    <g
      class="pg-fluid-container ${selected ? "is-selected" : ""}"
      data-fluid-vessel="${fluid.id}"
      style="--fluid-tone:${fluid.tone}"
    >
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="url(#${id}-glass)"/>
      <rect x="${x + 3}" y="${innerY}" width="${width - 6}" height="${innerHeight}" rx="2" fill="${level < 25 ? ART_PALETTE.red : fluid.tone}" opacity=".76"/>
      <rect x="${x + width * 0.22}" y="${y - 4}" width="${width * 0.56}" height="5" rx="2" fill="url(#${id}-metal)"/>
      <path class="pg-fluid-mark" d="M${x + width - 6} ${y + 8}V${y + height - 8}" fill="none" stroke="${ART_PALETTE.accent}" stroke-width="1.3" stroke-linecap="round"/>
    </g>`;
}

function hood(id, options) {
  const fluid = safeFluid(options.fluid);
  const level = safePercent(options.level, 72);
  const fluidOptions = { fluid, level };
  const drawing = svgShell(
    id,
    `
      <ellipse class="pg-contact-shadow" cx="80" cy="91" rx="68" ry="6" fill="url(#${id}-contact)"/>
      <path class="pg-hood-lid" d="M21 45 33 8H128L140 45 116 53H44Z" fill="url(#${id}-gloss)"/>
      <path class="pg-hood-inner" d="M34 40 42 16H119L127 40 111 45H49Z" fill="${ART_PALETTE.n2}"/>
      <path class="pg-hood-brace" d="M46 20 63 43M115 20 97 43M54 29H107" fill="none" stroke="url(#${id}-metal)" stroke-width="3" stroke-linecap="round"/>
      <path class="pg-engine-bay" d="M13 49 32 40H128L147 49 137 89H23Z" fill="url(#${id}-matte)"/>
      <rect class="pg-engine-cover" x="56" y="53" width="51" height="29" rx="8" fill="url(#${id}-gloss)"/>
      <path class="pg-engine-detail" d="M64 62H97M64 69H88M113 56c11 1 17 7 21 16" fill="none" stroke="${ART_PALETTE.accent}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
      ${fluidContainer(id, VEHICLE_FLUIDS[0], 29, 59, 15, 25, fluidOptions)}
      ${fluidContainer(id, VEHICLE_FLUIDS[1], 115, 53, 17, 29, fluidOptions)}
      ${fluidContainer(id, VEHICLE_FLUIDS[2], 44, 51, 13, 19, fluidOptions)}
      ${fluidContainer(id, VEHICLE_FLUIDS[3], 16, 48, 15, 25, fluidOptions)}
      <path class="pg-focus-edge" d="M21 45 33 8H128L140 45" fill="none" stroke="${ART_PALETTE.accent}" stroke-width="2" stroke-linecap="round"/>
      <path class="pg-silhouette-only" d="M21 43 33 8H128L140 43 116 49H44ZM13 55 32 49H128L147 55 137 89H23Z" fill="${ART_PALETTE.night}"/>
    `,
    "pg-drawing-hood",
    { viewBox: "0 0 160 100" },
  );
  const labels = VEHICLE_FLUIDS.map((item) => {
    const positions = {
      oil: ["18%", "93%"],
      coolant: ["82%", "93%"],
      brake: ["82%", "7%"],
      washer: ["18%", "7%"],
    };
    const [x, y] = positions[item.id];
    const label = options.labels?.[item.id] || item.shortLabel;
    return `
      <span
        class="pg-object-label pg-fluid-label ${item.id === fluid ? "is-selected" : ""}"
        data-fluid-label="${item.id}"
        dir="auto"
        style="--label-x:${x};--label-y:${y};--fluid-tone:${item.tone}"
      >${escapeText(label)}</span>`;
  }).join("");
  return { drawing, labels };
}

function renderByType(type, id, options) {
  if (type === "car-front") return carFront(id, options);
  if (type === "car-rear") return carRear(id, options);
  if (type === "car-profile") return profileCar(id, options);
  if (type === "tyre-wear") return tyre(id, options);
  if (type === "headlight-front") return frontLight(id, options);
  if (type === "taillight-rear") return rearLight(id, options);
  return hood(id, options);
}

/**
 * Produit le HTML d'un élément du lot 3.
 *
 * @param {"car-front"|"car-rear"|"car-profile"|"tyre-wear"|"headlight-front"|"taillight-rear"|"hood-levels"} type
 * @param {object} options
 * @param {"idle"|"active"|"found"|"error"} [options.state="idle"]
 * @param {boolean} [options.lit=false]
 * @param {number} [options.wear=20]
 * @param {"oil"|"coolant"|"brake"|"washer"} [options.fluid="oil"]
 * @param {number} [options.level=72]
 * @param {boolean} [options.silhouette=false]
 * @param {object} [options.labels]
 */
export function renderVehicleElement(type, options = {}) {
  if (!ELEMENT_TYPES.has(type)) {
    throw new TypeError(`Élément véhicule inconnu : ${type}`);
  }

  const meta = LOT_THREE_ELEMENTS.find((element) => element.type === type);
  const state = safeState(options.state);
  const lit = options.lit === true;
  const wear = safePercent(options.wear, 20);
  const fluid = safeFluid(options.fluid);
  const level = safePercent(options.level, 72);
  const id = createArtId(type);
  const rendered = renderByType(type, id, {
    ...options,
    state,
    lit,
    wear,
    fluid,
    level,
  });
  const status = lit ? "allumé" : "éteint";
  const ariaLabel =
    type === "tyre-wear"
      ? `${meta.ariaLabel}, usure ${wear} pour cent`
      : type === "hood-levels"
        ? `${meta.ariaLabel}, ${VEHICLE_FLUIDS.find((item) => item.id === fluid).label} à ${level} pour cent`
        : `${meta.ariaLabel}, feux ${status}`;

  return renderElementFrame({
    type,
    state,
    ariaLabel,
    drawing: rendered.drawing,
    labels: rendered.labels,
    silhouette: options.silhouette,
    extraClasses: "pg-element-vehicle",
    extraAttributes: `data-lit="${lit}" data-wear="${wear}" data-fluid="${fluid}" data-level="${level}"`,
  });
}

export function mountVehicleElement(target, type, options = {}) {
  if (!(target instanceof Element)) {
    throw new TypeError("mountVehicleElement attend un élément DOM cible.");
  }
  target.innerHTML = renderVehicleElement(type, options);
  return target.firstElementChild;
}
