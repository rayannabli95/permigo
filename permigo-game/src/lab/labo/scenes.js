// ═══════════════════════════════════════════════════════════════
// LE LABO DE LA CONDUITE — les décors.
//
// Un décor sait se dessiner à partir d'un preset. Il ne connaît ni le
// parcours, ni la langue, ni la progression : il reçoit ce qu'il faut
// afficher et rend du HTML. C'est ce qui permet d'ajouter un décor plus
// tard (rond-point, parking…) sans toucher au moteur.
//
// Deux décors :
//
//   « route »   — vue de dessus. On NE redessine RIEN : on rebranche le
//                 moteur isométrique de « En situation »
//                 (components/eleve/situation-scene.js). Même carrefour,
//                 mêmes voitures, mêmes panneaux, même halo doré que le
//                 mini-jeu que les élèves connaissent déjà. Un preset
//                 décrit son plateau exactement comme une situation.
//
//   « cockpit » — vue depuis le siège conducteur. Celle-là n'existe nulle
//                 part ailleurs dans l'app, donc elle est dessinée ici, en
//                 SVG, dans la même palette nuit/or.
// ═══════════════════════════════════════════════════════════════

import {
  renderSituationScene,
  buildFocusFX,
} from "@/components/eleve/situation-scene.js";

function esc(v) {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function t(dico, langue) {
  return dico?.[langue] || dico?.fr || "";
}

// ─── Décor « cockpit » ─────────────────────────────────────────

// Icônes de zone. Trait seul : elles se posent sur un fond qui change.
const ICONES = {
  "retro-int": `<svg viewBox="0 0 64 44" aria-hidden="true"><rect x="5" y="7" width="54" height="28" rx="10"/><path d="M31 35v6M22 41h18"/><path class="lb-shine" d="m16 26 14-12h17"/></svg>`,
  "retro-ext": `<svg viewBox="0 0 64 50" aria-hidden="true"><path d="M10 36c0-17 10-27 30-27 8 0 13 5 13 13 0 15-12 21-35 21Z"/><path d="m19 35 24-18"/></svg>`,
  epaule: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="28" cy="19" r="9"/><path d="M13 53c1-15 7-23 18-23 8 0 14 5 18 14"/><path d="M42 14c8 3 12 8 13 16"/><path d="m50 26 5 4 3-6"/></svg>`,
};

/**
 * L'habitacle : pare-brise (route qui fuit), montants, planche de bord,
 * volant, rétroviseur intérieur, rétroviseur extérieur gauche, vitre
 * latérale. Dessin fixe : les zones cliquables se posent PAR-DESSUS, en
 * pourcentage, donc le décor sert tel quel à n'importe quel exercice.
 */
function habitacle() {
  return `
  <svg class="lb-hab" viewBox="0 0 360 300" role="img"
       aria-label="Vue depuis le siège conducteur" focusable="false">
    <defs>
      <linearGradient id="lb-ciel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a1f68"/>
        <stop offset=".42" stop-color="#6b4fc4"/>
        <stop offset=".76" stop-color="#e08a6b"/>
        <stop offset="1" stop-color="#ffc98a"/>
      </linearGradient>
      <linearGradient id="lb-bitume" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4b4e66"/>
        <stop offset="1" stop-color="#2e3047"/>
      </linearGradient>
      <linearGradient id="lb-planche" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a2263"/>
        <stop offset="1" stop-color="#0b0820"/>
      </linearGradient>
      <linearGradient id="lb-jante" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4a3f8f"/>
        <stop offset=".5" stop-color="#241e56"/>
        <stop offset="1" stop-color="#3a3178"/>
      </linearGradient>
      <clipPath id="lb-vitrage"><path d="M62 30h238l16 146H46Z"/></clipPath>
      <clipPath id="lb-verre-int"><rect x="136" y="20" width="88" height="34" rx="12"/></clipPath>
      <clipPath id="lb-verre-ext"><path d="M8 152q34-14 72 0v38q-38 14-72 0Z"/></clipPath>
      <clipPath id="lb-vitre-g"><path d="M0 92h52l-8 122H0Z"/></clipPath>
    </defs>

    <rect width="360" height="300" fill="#0e0b28"/>

    <!-- ── la route, à travers le pare-brise ───────────────── -->
    <g clip-path="url(#lb-vitrage)">
      <rect x="40" y="24" width="284" height="160" fill="url(#lb-ciel)"/>
      <circle cx="252" cy="132" r="34" fill="#ffd8a0" opacity=".5"/>
      <circle cx="252" cy="132" r="16" fill="#fff0cf" opacity=".85"/>
      <path d="M40 140q52-30 104-6t104-12 116 16v50H40Z" fill="#3c2f7a" opacity=".85"/>
      <path d="M40 152q66-18 126 2t142-8v40H40Z" fill="#2b2160"/>
      <rect x="40" y="156" width="284" height="34" fill="#2c6b46"/>
      <!-- chaussée en fuite -->
      <path d="M172 156h20l104 34H72Z" fill="url(#lb-bitume)"/>
      <path d="M172 156h2l-38 34h-11Z" fill="#f3f4f8" opacity=".5"/>
      <path d="M190 156h2l48 34h11Z" fill="#f3f4f8" opacity=".5"/>
      <!-- axe : les segments grandissent en approchant -->
      <path d="M181 158h2l.6 5h-3.2Z" fill="#f3f4f8" opacity=".75"/>
      <path d="M179.6 167h4.8l1.2 8h-7.2Z" fill="#f3f4f8" opacity=".85"/>
      <path d="M177 179h10l2.4 11h-14.8Z" fill="#f3f4f8"/>
    </g>

    <!-- ── carrosserie ─────────────────────────────────────── -->
    <path d="M0 0h360v26q-96-12-180-12T0 26Z" fill="#171242"/>
    <path d="M0 24q84-12 180-12t180 12v10q-96-12-180-12T0 34Z" fill="#241d5c" opacity=".85"/>
    <path d="M0 22h64l-18 158H0Z" fill="#1b1548"/>
    <path d="M300 22h60v158h-44Z" fill="#1b1548"/>
    <path d="M54 28h10l-15 150h-9Z" fill="#382e86" opacity=".65"/>

    <!-- vitre latérale gauche : c'est par là que passe le regard
         par-dessus l'épaule -->
    <path d="M0 88h56l-9 130H0Z" fill="#0a0722"/>
    <g clip-path="url(#lb-vitre-g)">
      <rect x="0" y="88" width="56" height="130" fill="#5a44ab"/>
      <rect x="0" y="150" width="56" height="70" fill="#2c6b46"/>
      <rect x="0" y="176" width="56" height="16" fill="#4b4e66"/>
      <!-- le paysage file : traits de vitesse -->
      <path d="M4 106h34M10 122h30M2 138h26" stroke="#cfc9f2" stroke-width="3"
            stroke-linecap="round" opacity=".35"/>
    </g>
    <path d="M0 88h56l-9 130H0Z" fill="none" stroke="#6b5bd6" stroke-width="2.5" opacity=".55"/>

    <!-- rétroviseur extérieur gauche, sous la vitre -->
    <path d="M4 148q38-16 80 0v42q-42 16-80 0Z" fill="#1b1548"/>
    <g clip-path="url(#lb-verre-ext)">
      <rect x="4" y="146" width="86" height="26" fill="#6b4fc4"/>
      <rect x="4" y="170" width="86" height="26" fill="#2c6b46"/>
      <path d="M4 174h86v10H4Z" fill="#4b4e66"/>
      <path d="M24 176h30v6H24Z" fill="#ef5350"/>
    </g>
    <path d="M4 148q38-16 80 0v42q-42 16-80 0Z" fill="none" stroke="#8b7bf0" stroke-width="2.5" opacity=".8"/>

    <!-- rétroviseur intérieur -->
    <path d="M175 12h10v12h-10Z" fill="#2a2263"/>
    <rect x="132" y="16" width="96" height="42" rx="15" fill="#1b1548"/>
    <g clip-path="url(#lb-verre-int)">
      <rect x="136" y="20" width="88" height="34" fill="#5a44ab"/>
      <rect x="136" y="40" width="88" height="14" fill="#3a3060"/>
      <rect x="164" y="30" width="32" height="16" rx="5" fill="#c9c2f5" opacity=".85"/>
      <circle cx="150" cy="46" r="4" fill="#e6e2ff" opacity=".6"/>
    </g>
    <rect x="136" y="20" width="88" height="34" rx="12" fill="none" stroke="#8b7bf0" stroke-width="2.2" opacity=".8"/>

    <!-- planche de bord -->
    <path d="M46 178q160-24 314 0v122H46Z" fill="url(#lb-planche)"/>
    <path d="M46 178q160-24 314 0v9q-154-24-314 0Z" fill="#8b7bf0" opacity=".4"/>
    <rect x="140" y="196" width="124" height="44" rx="17" fill="#0b0820" opacity=".92"/>
    <circle cx="172" cy="218" r="15" fill="none" stroke="#4a3f8f" stroke-width="3"/>
    <circle cx="232" cy="218" r="15" fill="none" stroke="#4a3f8f" stroke-width="3"/>
    <path d="M172 218l9-8" stroke="#ffcb3d" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M232 218l-7-9" stroke="#9ef06a" stroke-width="2.8" stroke-linecap="round"/>
    <rect x="282" y="200" width="58" height="34" rx="10" fill="#0b0820" opacity=".85"/>
    <rect x="292" y="210" width="38" height="4" rx="2" fill="#8b7bf0" opacity=".6"/>
    <rect x="292" y="220" width="24" height="4" rx="2" fill="#8b7bf0" opacity=".35"/>

    <!-- portière côté conducteur (l'épaule est de ce côté) -->
    <path d="M0 210h50l-6 90H0Z" fill="#1b1548"/>
    <path d="M6 226h34l-4 66H6Z" fill="#2a2263" opacity=".8"/>
    <rect x="10" y="234" width="22" height="6" rx="3" fill="#8b7bf0" opacity=".5"/>

    <!-- volant -->
    <g class="lb-volant">
      <circle cx="196" cy="312" r="84" fill="none" stroke="url(#lb-jante)" stroke-width="18"/>
      <circle cx="196" cy="312" r="84" fill="none" stroke="#8b7bf0" stroke-width="2" opacity=".4"/>
      <path d="M120 304h152" stroke="#241e56" stroke-width="16" stroke-linecap="round"/>
      <path d="M120 304h152" stroke="#4a3f8f" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <rect x="166" y="286" width="60" height="36" rx="14" fill="#2a2263"/>
      <path d="M188 296q8-6 16 0l-8 15Z" fill="#ffcb3d"/>
    </g>
  </svg>`;
}

/**
 * Décor « cockpit ». Les zones sont posées en pourcentage, donc le décor
 * reste juste quelle que soit la taille de l'écran, et la position PHYSIQUE
 * ne bouge pas en arabe (on n'inverse pas un rétroviseur en RTL).
 *
 * Le libellé se range du côté où il y a de la place (une zone collée au bord
 * gauche affiche son libellé à sa droite), sinon il sortait du cadre.
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
    .map((z, i) => {
      const nom = t(z.label, langue);
      const cote = z.at.x < 34 ? "droite" : z.at.x > 66 ? "gauche" : "bas";
      const classes = [
        "lb-zone",
        `lb-zone--${cote}`,
        faites.has(z.id) ? "is-faite" : "",
        reperees.has(z.id) ? "is-reperee" : "",
        signale === z.id ? "a-regarder" : "",
        attendue === z.id ? "est-attendue" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const attr = interactif
        ? `data-sequence="${esc(z.id)}"`
        : `data-repere="${esc(z.id)}"`;
      return `
        <button class="${classes}" type="button" ${attr}
          style="left:${z.at.x}%;top:${z.at.y}%;--lb-delai:${i * 0.12}s"
          aria-label="${esc(nom)}"
          aria-pressed="${faites.has(z.id) || reperees.has(z.id)}">
          <span class="lb-zone-pastille">
            ${ICONES[z.icone] || ICONES.epaule}
            <span class="lb-zone-ok" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-9"/></svg>
            </span>
          </span>
          <span class="lb-zone-nom">${esc(nom)}</span>
        </button>`;
    })
    .join("");

  return `
    <div class="lb-cockpit${interactif ? " est-interactif" : ""}">
      ${habitacle()}
      ${zones}
    </div>`;
}

// ─── Décor « route » ───────────────────────────────────────────

/**
 * Vue de dessus. Le plateau du preset a exactement le format d'une scène
 * de « En situation » : on le passe tel quel au moteur isométrique de
 * l'app. Rien n'est redessiné ici.
 */
export function renderRoute(preset, opts = {}) {
  const {
    langue = "fr",
    selectionnable = false,
    choisi = "",
    juste = null,
  } = opts;
  const brut = preset.plateau || { kind: "croisement", vehicules: [] };
  // L'étiquette « Toi » est du contenu : elle suit la langue de l'élève.
  const plateau = {
    ...brut,
    vehicules: (brut.vehicules || []).map((v) =>
      v.label && preset.etiquette
        ? { ...v, label: t(preset.etiquette, langue) }
        : v,
    ),
  };

  let svg = renderSituationScene(plateau, {
    alt: t(preset.alt, langue),
    tappable: selectionnable ? (plateau.vehicules || []).map((v) => v.id) : [],
  });

  // Halo doré + chevrons sur le véhicule prioritaire, une fois la réponse
  // trouvée : même retour visuel que le mini-jeu.
  if (juste && preset.focus) {
    svg = svg.replace(
      '<g class="sit-fx"></g>',
      `<g class="sit-fx">${buildFocusFX(plateau, preset.focus)}</g>`,
    );
  }
  if (choisi) {
    svg = svg.replace(
      `data-veh="${choisi}"`,
      `data-veh="${choisi}" data-choisi`,
    );
  }

  return `<div class="lb-plateau${selectionnable ? " est-interactif" : ""}">${svg}</div>`;
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
      <span class="lb-lueur"></span>
      <svg viewBox="0 0 360 250" focusable="false">
        <defs>
          <linearGradient id="lb-route-haut" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#8b7bf0" />
            <stop offset="1" stop-color="#4439a8" />
          </linearGradient>
          <linearGradient id="lb-route-cote" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#39317f" />
            <stop offset="1" stop-color="#181141" />
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
            stroke="#b8c0d4"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="12 12"
          />
          <g class="lb-voiture">
            <path d="M131 119h38l10 10v17h-58v-17Z" fill="#fff" />
            <path d="m137 121 7-8h18l9 8Z" fill="#bfe9ff" />
            <path d="M126 143h48" stroke="#cbd5e1" stroke-width="3" />
            <circle cx="133" cy="147" r="6" fill="#17192c" />
            <circle cx="168" cy="147" r="6" fill="#17192c" />
            <rect x="174" y="131" width="5" height="7" rx="2" fill="#9ef06a" />
          </g>
        </g>
      </svg>
      <span class="lb-etoile lb-etoile-one">✦</span>
      <span class="lb-etoile lb-etoile-two">✦</span>
      <span class="lb-etoile lb-etoile-three">✦</span>
    </div>
  `;
}
