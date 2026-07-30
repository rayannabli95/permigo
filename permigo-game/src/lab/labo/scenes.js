// ═══════════════════════════════════════════════════════════════
// LE LABO DE LA CONDUITE — les décors.
//
// Un décor sait se dessiner à partir d'un preset. Il ne connaît ni le
// parcours, ni la langue, ni la progression : il reçoit ce qu'il faut
// afficher et rend du HTML. C'est ce qui permet d'ajouter un décor plus
// tard (rond-point, parking…) sans toucher au moteur.
//
// Tout est en SVG/CSS local : rien à générer, rien à télécharger, et une
// voiture reste strictement la même d'un exercice à l'autre.
// ═══════════════════════════════════════════════════════════════

const COULEURS = {
  bleu: { corps: "#4f7cf0", toit: "#dbe7ff" },
  rouge: { corps: "#e2564f", toit: "#ffdedb" },
  violet: { corps: "#8b5cf6", toit: "#e9defd" },
  vert: { corps: "#3aa76d", toit: "#d8f3e5" },
  jaune: { corps: "#e0a92b", toit: "#fbefd2" },
};

// D'où arrive le véhicule → sa case de départ et son cap (degrés).
// On roule à droite : chaque véhicule se place sur la voie de droite DANS
// SON SENS de marche. Celui qui monte est donc à l'est de l'axe, celui qui
// descend à l'ouest. Sans ça, la scène montre des voitures à contresens et
// l'exercice de priorité devient faux.
const DEPUIS = {
  nord: { x: 132, y: 62, cap: 180 },
  sud: { x: 168, y: 238, cap: 0 },
  est: { x: 238, y: 132, cap: 270 },
  ouest: { x: 62, y: 168, cap: 90 },
};

function esc(v) {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ─── Icônes de zone (cockpit) ──────────────────────────────────
const ICONES = {
  "retro-int": `<svg viewBox="0 0 64 44" aria-hidden="true"><rect x="5" y="7" width="54" height="28" rx="10"/><path d="M31 35v6M22 41h18"/><path class="lb-shine" d="m16 26 14-12h17"/></svg>`,
  "retro-ext": `<svg viewBox="0 0 64 50" aria-hidden="true"><path d="M10 36c0-17 10-27 30-27 8 0 13 5 13 13 0 15-12 21-35 21Z"/><path d="m19 35 24-18"/></svg>`,
  epaule: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="28" cy="19" r="9"/><path d="M13 53c1-15 7-23 18-23 8 0 14 5 18 14"/><path d="M42 14c8 3 12 8 13 16"/><path d="m50 26 5 4 3-6"/></svg>`,
};

/**
 * Décor « cockpit ». Les zones sont posées en pourcentage, donc le décor
 * reste juste quelle que soit la taille de l'écran, et la position PHYSIQUE
 * ne bouge pas en arabe (on n'inverse pas un rétroviseur en RTL).
 */
export function renderCockpit(preset, opts = {}) {
  const {
    langue = "fr",
    faites = new Set(),
    reperees = new Set(),
    attendue = null,
    interactif = false,
    signale = "",
  } = opts;

  const zones = preset.zones
    .map((z) => {
      const nom = z.label?.[langue] || z.label?.fr || z.id;
      const classes = [
        "lb-zone",
        faites.has(z.id) ? "is-faite" : "",
        reperees.has(z.id) ? "is-reperee" : "",
        signale === z.id ? "a-regarder" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const attr = interactif
        ? `data-sequence="${esc(z.id)}"`
        : `data-repere="${esc(z.id)}"`;
      return `
        <button class="${classes}" type="button" ${attr}
          style="left:${z.at.x}%;top:${z.at.y}%"
          aria-label="${esc(nom)}"
          aria-pressed="${faites.has(z.id) || reperees.has(z.id)}"
          data-icone="${esc(z.icone || "")}"
          ${attendue === z.id ? 'data-attendue="true"' : ""}>
          ${ICONES[z.icone] || ICONES.epaule}
          <span class="lb-zone-nom">${esc(nom)}</span>
          <span class="lb-zone-ok" aria-hidden="true">✓</span>
        </button>`;
    })
    .join("");

  return `
    <div class="lb-cockpit${interactif ? " est-interactif" : ""}">
      <div class="lb-parebrise" aria-hidden="true">
        <span class="lb-horizon"></span><span class="lb-route-loin"></span>
      </div>
      <div class="lb-planche" aria-hidden="true"></div>
      <div class="lb-volant" aria-hidden="true"><span></span></div>
      ${zones}
    </div>`;
}

function voitureSVG(v, { selectionnable, choisi, langue }) {
  const c = COULEURS[v.couleur] || COULEURS.bleu;
  const d = DEPUIS[v.de] || DEPUIS.sud;
  const nom = { fr: "voiture", en: "car", ar: "سيارة" }[langue] || "voiture";
  const etat = choisi ? " est-choisie" : "";
  const balise = selectionnable ? "button" : "g";
  const attrs = selectionnable
    ? `type="button" data-vehicule="${esc(v.id)}" aria-label="${esc(nom)} ${esc(v.couleur)}"`
    : 'aria-hidden="true"';

  const corps = `
    <g transform="translate(${d.x} ${d.y}) rotate(${d.cap})">
      <rect x="-15" y="-24" width="30" height="48" rx="9" fill="${c.corps}"/>
      <rect x="-11" y="-15" width="22" height="17" rx="6" fill="${c.toit}"/>
      <rect x="-11" y="8" width="22" height="9" rx="4" fill="${c.toit}" opacity=".7"/>
      <circle cx="-9" cy="-22" r="2.7" fill="#fff6d8"/>
      <circle cx="9" cy="-22" r="2.7" fill="#fff6d8"/>
      ${v.moi ? '<circle cx="0" cy="0" r="7.5" fill="#fff" opacity=".92"/><text x="0" y="4" text-anchor="middle" font-size="10" font-weight="800" fill="#2a2350">?</text>' : ""}
    </g>`;

  if (balise === "g") return `<g class="lb-veh${etat}">${corps}</g>`;
  return `<g class="lb-veh est-cliquable${etat}" ${attrs} role="button" tabindex="0" data-vehicule="${esc(v.id)}">${corps}</g>`;
}

/**
 * Décor « route » : vue de dessus. Les véhicules sont posés à partir des
 * données du preset (couleur, provenance, intention) — jamais générés à la
 * volée, donc identiques d'un affichage à l'autre.
 */
export function renderRoute(preset, opts = {}) {
  const { langue = "fr", selectionnable = false, choisi = "" } = opts;
  const vehicules = (preset.vehicules || [])
    .map((v) =>
      voitureSVG(v, {
        selectionnable,
        choisi: choisi === v.id,
        langue,
      }),
    )
    .join("");

  return `
    <div class="lb-route${selectionnable ? " est-interactif" : ""}">
      <svg viewBox="0 0 300 300" role="img" aria-label="Vue de dessus d’un carrefour">
        <rect width="300" height="300" fill="#e8ecf6"/>
        <rect x="0" y="112" width="300" height="76" fill="#4a4f63"/>
        <rect x="112" y="0" width="76" height="300" fill="#4a4f63"/>
        <g stroke="#f2f4fa" stroke-width="3" stroke-linecap="round" stroke-dasharray="12 12">
          <path d="M0 150h104"/><path d="M196 150h104"/>
          <path d="M150 0v104"/><path d="M150 196v104"/>
        </g>
        <g fill="#3d4256" opacity=".55">
          <rect x="88" y="88" width="18" height="18" rx="4"/>
          <rect x="194" y="88" width="18" height="18" rx="4"/>
          <rect x="88" y="194" width="18" height="18" rx="4"/>
          <rect x="194" y="194" width="18" height="18" rx="4"/>
        </g>
        ${vehicules}
      </svg>
    </div>`;
}

/** Aiguillage : le moteur demande un décor, il ne sait pas lequel. */
export function renderScene(preset, opts) {
  return preset.scene === "route"
    ? renderRoute(preset, opts)
    : renderCockpit(preset, opts);
}

/**
 * Décor d'ouverture : l'île flottante avec la voiture. Sert à l'écran
 * d'intro et à l'écran de fin (variante `reussi`), quel que soit le décor
 * d'exercice du preset.
 */
export function renderIle({ reussi = false } = {}) {
  return `
    <div class="lb-ile${reussi ? " est-reussi" : ""}" aria-hidden="true">
      <span class="lb-soleil"></span>
      <span class="lb-nuage lb-nuage-1"></span>
      <span class="lb-nuage lb-nuage-2"></span>
      <svg viewBox="0 0 360 250" focusable="false">
        <defs>
          <linearGradient id="lb-route-haut" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#6d68ee" />
            <stop offset="1" stop-color="#4439a8" />
          </linearGradient>
          <linearGradient id="lb-route-cote" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#393183" />
            <stop offset="1" stop-color="#211d53" />
          </linearGradient>
        </defs>
        <g class="lb-ile-bloc">
          <path d="M31 190 180 88l149 69-146 84Z" fill="url(#lb-route-cote)" />
          <path d="m31 174 149-102 149 69-146 84Z" fill="url(#lb-route-haut)" />
          <path
            d="m54 169 126-82 126 58-124 64Z"
            fill="none"
            stroke="#f7fbff"
            stroke-width="34"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="m54 169 126-82 126 58-124 64Z"
            fill="none"
            stroke="#c7cfdf"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="12 12"
          />
          <g class="lb-voiture">
            <path d="M131 119h38l10 10v17h-58v-17Z" fill="#fff" />
            <path d="m137 121 7-8h18l9 8Z" fill="#dff6ff" />
            <path d="M126 143h48" stroke="#cbd5e1" stroke-width="3" />
            <circle cx="133" cy="147" r="6" fill="#17192c" />
            <circle cx="168" cy="147" r="6" fill="#17192c" />
            <rect x="174" y="131" width="5" height="7" rx="2" fill="#34d399" />
          </g>
        </g>
      </svg>
      <span class="lb-orbite"></span>
      <span class="lb-etoile lb-etoile-one">✦</span>
      <span class="lb-etoile lb-etoile-two">✦</span>
      <span class="lb-etoile lb-etoile-three">✦</span>
    </div>
  `;
}
