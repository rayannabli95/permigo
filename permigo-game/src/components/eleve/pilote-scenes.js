// ═══════════════════════════════════════════════════════════════
// Les décors du Mode Pilote.
//
// Douze scènes dessinées en CSS pur : l'habitacle, le pédalier, le carrefour,
// le giratoire, la nuit, la pluie… Repris tels quels du prototype
// `mockups/moteur-pilote`, ils ne coûtent aucune image à charger.
//
// Le style qui les dessine vit dans `pilote.css`, à côté. Une classe
// `.mp-art-{nom}` porte la mise en scène, les `<span>` portent les pièces.
// ═══════════════════════════════════════════════════════════════

/** @param {string} visual nom du décor, cf. `visual` dans les missions */
export function renderArt(visual) {
  if (visual === "cockpit") return artCockpit();
  if (visual === "start-manual" || visual === "start-automatic") {
    return artStart(visual === "start-automatic");
  }
  if (visual === "warning") return artWarning();
  if (visual === "intersection") return artIntersection();
  if (visual === "roundabout") return artRoundabout();
  if (visual === "bend") return artBend();
  if (visual === "night") return artNight();
  if (visual === "rain") return artRain();
  if (visual === "emergency") return artEmergency();
  if (visual === "gps") return artGps();
  if (visual === "city-light") return artCityLight();
  if (visual === "exterior") return artExterior();
  if (visual === "parking") return artParking();
  if (visual === "mirror") return artMirror();
  if (visual === "overtake") return artOvertake({ cyclist: true });
  if (visual === "overtake-oncoming")
    return artOvertake({ cyclist: true, oncoming: true });
  if (visual === "overtake-empty") return artOvertake({});
  if (visual === "overtake-top") return artOvertakeTop();
  return artCockpit();
}

function artCockpit() {
  return `
    <div class="art-sky"><span class="art-road"></span></div>
    <div class="art-dash">
      <span class="art-dial art-dial-left"></span>
      <span class="art-dial art-dial-right"></span>
      <span class="art-screen">0</span>
    </div>
    <span class="art-stalk art-stalk-left"></span>
    <span class="art-stalk art-stalk-right"></span>
    <div class="art-wheel"><span>PG</span></div>
    <div class="art-pedals"><i></i><i></i><i></i></div>`;
}

function artStart(automatic) {
  return `
    <div class="art-start-grid"></div>
    <div class="art-footwell">
      <span class="art-foot"></span>
      <span class="art-pedal-large"></span>
      ${automatic ? `<span class="art-pedal-small"></span>` : `<span class="art-pedal-small"></span><span class="art-pedal-clutch"></span>`}
    </div>
    <div class="art-selector">
      <span class="${automatic ? "" : "is-active"}">${automatic ? "P" : "1"}</span>
      <span class="${automatic ? "is-active" : ""}">${automatic ? "D" : "2"}</span>
      <span>${automatic ? "R" : "3"}</span>
      <i></i>
    </div>`;
}

function artWarning() {
  return `
    <div class="art-warning-dash">
      <span class="art-warning-dial"><i></i></span>
      <span class="art-warning-screen">CONTACT</span>
      <span class="art-warning-dial"><i></i></span>
      <b class="art-warning-light">!</b>
      <small>ALERTE ACTIVE</small>
    </div>`;
}

function artIntersection() {
  return `
    <div class="art-city-sky"></div>
    <div class="art-building art-building-left"><i></i><i></i><i></i></div>
    <div class="art-building art-building-right"><i></i><i></i><i></i></div>
    <div class="art-main-road"><span></span></div>
    <div class="art-side-road"><span></span></div>
    <div class="art-parked-car"><i></i><b></b></div>
    <span class="art-crosswalk"></span>`;
}

function artRoundabout() {
  return `
    <div class="art-top-road art-top-road-v"></div>
    <div class="art-top-road art-top-road-h"></div>
    <div class="art-roundabout-ring"><span></span></div>
    <span class="art-top-car art-top-car-player"></span>
    <span class="art-top-car art-top-car-other"></span>
    <span class="art-exit-arrow">↗</span>`;
}

function artBend() {
  return `
    <svg class="art-bend-svg" viewBox="0 0 360 260" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#58a06d"/><stop offset="1" stop-color="#284c3a"/></linearGradient>
      </defs>
      <rect width="360" height="260" fill="url(#grass)"/>
      <path d="M132 270 C140 192 57 163 90 48 L280 48 C245 141 292 185 280 270Z" fill="#4a4857"/>
      <path d="M205 270 C211 192 154 154 183 48" fill="none" stroke="#f7e9a1" stroke-width="5" stroke-dasharray="18 14"/>
      <path d="M130 270 C140 192 57 163 90 48M280 270 C292 185 245 141 280 48" fill="none" stroke="#f7f3ff" stroke-width="4"/>
      <circle cx="54" cy="76" r="27" fill="#1d5e3e"/><circle cx="314" cy="105" r="34" fill="#1d5e3e"/>
    </svg>`;
}

function artNight() {
  return `
    <div class="art-night-sky"><i></i><i></i><i></i><i></i></div>
    <div class="art-night-road"><span></span><b></b></div>
    <div class="art-oncoming"><i></i><i></i></div>
    <span class="art-right-edge"></span>
    <div class="art-night-dash"></div>`;
}

function artRain() {
  return `
    <div class="art-rain-sky"></div>
    <div class="art-rain-road"><span></span></div>
    <div class="art-rain-car"><i></i><b></b></div>
    <div class="art-rain-lines">${"<i></i>".repeat(18)}</div>
    <span class="art-wiper art-wiper-left"></span>
    <span class="art-wiper art-wiper-right"></span>`;
}

function artEmergency() {
  return `
    <div class="art-emergency-sky"></div>
    <div class="art-emergency-road"><span></span></div>
    <div class="art-obstacle"><i></i><b>!</b></div>
    <div class="art-player-hood"></div>
    <span class="art-brake-wave art-brake-wave-a"></span>
    <span class="art-brake-wave art-brake-wave-b"></span>`;
}

function artGps() {
  return `
    <div class="art-map-grid"></div>
    <span class="art-map-road art-map-road-main"></span>
    <span class="art-map-road art-map-road-exit"></span>
    <span class="art-map-route"></span>
    <span class="art-map-car">▲</span>
    <span class="art-map-exit">SORTIE</span>
    <div class="art-gps-card"><small>RECALCUL</small><strong>Continue tout droit</strong></div>`;
}

function artCityLight() {
  return `
    <div class="art-light-sky"></div>
    <div class="art-light-city"><i></i><i></i><i></i><i></i></div>
    <div class="art-light-road"><span></span></div>
    <div class="art-traffic-light"><i></i><i class="is-red"></i><i></i></div>
    <div class="art-player-hood"></div>`;
}

function artExterior() {
  return `
    <div class="art-garage-grid"></div>
    <div class="art-car-side">
      <span class="art-car-window"></span>
      <span class="art-car-door"></span>
      <i class="art-car-wheel art-car-wheel-left"></i>
      <i class="art-car-wheel art-car-wheel-right is-flat"></i>
      <b class="art-car-mirror"></b>
      <small class="art-car-plate">PG-2026</small>
    </div>
    <span class="art-floor-shadow"></span>`;
}

// Vue de dessus d'un créneau. Tout est posé en POURCENTAGE, pas en pixels :
// les zones tactiles des missions sont elles aussi en pourcentage de la scène,
// et un décor calé en pixels les décalerait dès que la largeur change.
function artParking() {
  return `
    <div class="art-pk-road"><span></span></div>
    <div class="art-pk-kerb"></div>
    <span class="art-pk-car art-pk-car-a"></span>
    <span class="art-pk-slot"></span>
    <span class="art-pk-car art-pk-car-b"></span>
    <span class="art-pk-car art-pk-player"><i></i></span>`;
}

// Le poste de conduite vu par le conducteur : les deux miroirs, et la vitre
// latérale gauche où passe un deux-roues qu'aucun miroir ne montre. Ajouté
// pour le chapitre 2 (prendre l'information avant de bouger).
function artMirror() {
  return `
    <div class="art-mr-cabin"></div>
    <div class="art-mr-window">
      <span class="art-mr-far"></span>
      <span class="art-mr-bike"><i></i><b></b></span>
    </div>
    <div class="art-mr-inner"><span></span><i></i></div>
    <div class="art-mr-side"><span></span></div>
    <div class="art-mr-dash"><i></i><i></i></div>`;
}

// Route à double sens vue du conducteur. Trois variantes qui partagent le même
// style : la route nue, la route avec un cycliste, et la route avec le cycliste
// ET la voiture qui arrive en face. Cette dernière change la bonne réponse,
// donc elle doit changer le décor : l'élève ne peut pas décider sur une scène
// qui ne montre pas ce dont on lui parle.
function artOvertake({ cyclist, oncoming }) {
  return `
    <div class="art-ov-sky"></div>
    <div class="art-ov-field"></div>
    <div class="art-ov-road"><span class="art-ov-center"></span></div>
    ${oncoming ? `<span class="art-ov-oncoming"><i></i><i></i></span>` : ""}
    ${cyclist ? `<span class="art-ov-cyclist"><i></i><b></b></span>` : ""}
    <div class="art-ov-hood"></div>`;
}

// Le même dépassement, mais vu de dessus. En vue subjective les trois
// trajectoires se superposent et ne veulent plus rien dire : l'écart latéral
// y vaut quelques pixels. De dessus, un mètre se voit.
function artOvertakeTop() {
  return `
    <div class="art-ot-verge"></div>
    <div class="art-ot-road"><span class="art-ot-center"></span></div>
    <span class="art-ot-cyclist"><i></i></span>
    <span class="art-ot-player"><i></i></span>`;
}
