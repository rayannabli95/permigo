// ═══════════════════════════════════════════════════════════════
// Élève — MA COLLECTION de cartes « Monument Valley »
// Route #/cartes  (ou #/cartes/{compId} pour ouvrir sur une carte
// précise + jouer la révélation quand elle vient d'être débloquée).
//
// 31 cartes illustrées, une par compétence REMC. Une carte se
// débloque quand l'élève certifie la compétence (self_validations)
// ou quand le moniteur la valide (validations acquis).
//
// Interaction : deck façon Tinder — la carte du dessus se drague à
// gauche/droite (ou flèches ‹ ›) pour feuilleter la collection ; les
// cartes suivantes sont empilées derrière pour donner la profondeur.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { burstConfetti } from "@/components/common/confetti.js";
import { recompensesTabs } from "@/components/eleve/recompenses-tabs.js";
import { CARTES, CARTES_TOTAL } from "@/data/cartes.js";
import { getFiche } from "@/data/fiches-conduite.js";

const SWIPE_COMMIT = 90; // px de drag avant de valider le swipe
const SEEN_KEY = "pg-cartes-seen"; // cartes déjà regardées (badge « Nouveau »)

function loadSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function markSeen(id) {
  try {
    const s = loadSeen();
    if (!s.has(id)) {
      s.add(id);
      localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
    }
  } catch {
    /* stockage indispo → pas de badge, pas grave */
  }
}

const STYLE = `<style>
.col { max-width: 480px; margin: 0 auto; padding: 14px 16px calc(96px + env(safe-area-inset-bottom));
  min-height: calc(100dvh - 52px); font-family:'Inter',sans-serif; color:#f2f0fa;
  background:
    radial-gradient(120% 40% at 50% -5%, rgba(255,190,70,.10) 0%, transparent 55%),
    radial-gradient(120% 55% at 50% 30%, rgba(110,70,220,.22) 0%, transparent 62%),
    linear-gradient(180deg,#181241 0%,#0f0d24 58%,#0b0a1c 100%); }

/* Barre de progression + pastilles par monde */
.col-prog { margin:10px 0 4px; }
.col-prog-lbl { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px; }
.col-prog-lbl b { font:800 14px/1 'Plus Jakarta Sans',sans-serif; color:#fff; }
.col-prog-lbl span { font:600 12px/1 'Inter',sans-serif; color:#cabfef; }
.col-prog-bar { height:8px; border-radius:99px; background:rgba(255,255,255,.12); overflow:hidden; }
.col-prog-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,#f0a93f,#eab308); transition:width .6s cubic-bezier(.34,1.4,.64,1); }

/* Le deck */
.col-stage { position:relative; height:min(58vh,470px); margin:12px 0 6px;
  perspective:1200px; touch-action:pan-y; user-select:none; }
/* ATTENTION : pas de propriete filter ici. Un filter sur le parent d'un
   conteneur preserve-3d casse le backface-visibility (le recto transparait
   au verso). L'ombre vit donc sur les faces, pas sur .col-card. */
.col-card { position:absolute; inset:0; margin:auto; width:min(78vw,320px); aspect-ratio:5/7;
  perspective:1100px; will-change:transform; --rc:#9fb0c3; }
.col-card.is-anim { transition:transform .42s cubic-bezier(.4,0,.2,1); }

/* conteneur qui pivote (recto ↔ verso) */
.col-flip { position:absolute; inset:0; transform-style:preserve-3d; transition:transform .55s cubic-bezier(.4,0,.2,1); will-change:transform; }
.col-card.flipped .col-flip { transform:rotateY(180deg); }
/* Le backface-visibility seul ne suffit pas : selon le navigateur, les ENFANTS
   d'une face (titre, pastilles) continuent d'être peints et le recto apparaît
   en miroir au verso. On échange donc franchement les deux faces à MI-rotation
   (transition d'opacité de durée nulle, retardée à la moitié des .55s). */
.col-face { position:absolute; inset:0; border-radius:24px; overflow:hidden; -webkit-backface-visibility:hidden; backface-visibility:hidden;
  background:#0a0a10;
  box-shadow: 0 22px 45px -18px rgba(0,0,0,.65), inset 0 0 0 2.5px color-mix(in srgb, var(--rc) 82%, transparent);
  transition: opacity 0s linear .28s; }
.col-back { transform:rotateY(180deg); background:#0a0a10; isolation:isolate; opacity:0; }
.col-card.flipped .col-front { opacity:0; }
.col-card.flipped .col-back { opacity:1; }

.col-card-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.col-card-shade { position:absolute; inset:0; background:linear-gradient(180deg,transparent 42%,rgba(6,7,20,.15) 60%,rgba(6,7,20,.86) 100%); }
.col-card-meta { position:absolute; left:0; right:0; bottom:0; padding:15px 16px 16px; color:#fff; z-index:2; }
.col-card-world { display:inline-flex; align-items:center; gap:6px; font:800 9.5px/1 'Inter',sans-serif; letter-spacing:.14em; text-transform:uppercase;
  padding:5px 10px; border-radius:99px; background:rgba(255,255,255,.16); backdrop-filter:blur(4px); margin-bottom:9px; }
/* color explicite : base.css pose une couleur sur h1..h4, et une règle directe
   bat TOUJOURS la couleur héritée du parent. Sans ça le titre passe en encre
   sombre sur la carte (illisible en thème clair). */
.col-card-name { font:800 19px/1.15 'Plus Jakarta Sans',sans-serif; margin:0 0 4px; color:#fff; text-shadow:0 2px 12px rgba(0,0,0,.5); }
.col-card-idx { font:700 11px/1 'IBM Plex Mono',monospace; opacity:.8; }
.col-card-date { display:inline-flex; align-items:center; gap:5px; font:600 11px/1 'Inter',sans-serif; color:#8ef0b0; margin-top:8px; }

/* pastille de rareté (haut gauche) + badge Nouveau (haut droite) */
.col-rar { position:absolute; top:12px; left:12px; z-index:3; font:800 8.5px/1 'Inter',sans-serif; letter-spacing:.12em; text-transform:uppercase;
  padding:5px 9px; border-radius:99px; color:#fff; background:color-mix(in srgb, var(--rc) 48%, rgba(6,7,20,.55)); border:1px solid color-mix(in srgb, var(--rc) 80%, transparent); }
.col-new { position:absolute; top:12px; right:12px; z-index:3; font:800 8.5px/1 'Inter',sans-serif; letter-spacing:.1em; text-transform:uppercase;
  padding:5px 9px; border-radius:99px; color:#1a1030; background:linear-gradient(180deg,#ffe9b0,#f5b73d); box-shadow:0 3px 10px rgba(245,183,61,.5); }

/* gloss permanent : la carte débloquée devient un objet brillant qu'on veut posséder.
   Reflet diffus qui suit le doigt / l'inclinaison (--gx/--gy) + balayage lent auto. */
.col-card-gloss { position:absolute; inset:0; pointer-events:none; border-radius:inherit; z-index:2; mix-blend-mode:screen;
  background:
    radial-gradient(58% 50% at var(--gx,50%) var(--gy,12%), rgba(255,255,255,.5), rgba(255,255,255,.08) 38%, transparent 62%),
    linear-gradient(125deg, transparent 43%, rgba(255,255,255,.28) 50%, transparent 57%);
  background-size:100% 100%, 250% 250%;
  background-position:0 0, 120% 0;
  animation: colGloss 5.5s ease-in-out 1s infinite; }
@keyframes colGloss { 0%,100%{ background-position:0 0,120% 0; } 50%{ background-position:0 0,-20% 0; } }
/* plus la carte est rare, plus le reflet est marqué */
.col-card.r-epique .col-card-gloss { filter:brightness(1.15); }
.col-card.r-legendaire .col-front { animation: colLegend 3s ease-in-out infinite; }
@keyframes colLegend {
  0%,100%{ box-shadow: inset 0 0 0 2.5px rgba(255,207,90,.85), 0 0 16px -4px rgba(255,207,90,.45); }
  50%{ box-shadow: inset 0 0 0 3px rgba(255,231,150,1), 0 0 26px 0 rgba(255,207,90,.7); }
}

/* ── dos de carte : DA « WHOOP » ──────────────────────────────
   Noir profond, tout en BLANC, typo condensée, micro-labels en
   majuscules très espacées, filets fins, une seule couleur d'accent. */
/* fond du verso : l'illustration floutée + un voile sombre pour la lisibilité */
.col-back-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
  filter:blur(17px) saturate(1.15) brightness(.5); transform:scale(1.18); }
.col-back-veil { position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(8,8,16,.62) 0%, rgba(8,8,16,.76) 55%, rgba(8,8,16,.88) 100%); }
.col-back-in { position:absolute; inset:0; padding:22px 20px; display:flex; flex-direction:column;
  color:#fff; }
.col-back-top { display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding-bottom:11px; border-bottom:1px solid rgba(255,255,255,.12); }
.col-back-lbl { font:700 8.5px/1 'Inter',sans-serif; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,255,255,.45); }
.col-back-dot { width:6px; height:6px; border-radius:50%; background:var(--rc); box-shadow:0 0 8px var(--rc); flex-shrink:0; }
.col-back-ttl { font:800 19px/1.2 'Plus Jakarta Sans',sans-serif; margin:15px 0 4px; color:#fff; letter-spacing:-.01em; }
.col-back-sub { font:600 9px/1 'Inter',sans-serif; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.4); margin-bottom:17px; }
.col-back-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0; }
.col-back-list li { display:flex; gap:12px; align-items:flex-start; padding:11px 0;
  border-top:1px solid rgba(255,255,255,.08); font:500 12.5px/1.45 'Inter',sans-serif; color:rgba(255,255,255,.88); }
.col-back-list li:first-child { border-top:0; }
.col-back-list li b { color:var(--rc); font:800 10px/1.6 'Inter',sans-serif; letter-spacing:.08em; flex-shrink:0; width:14px; }
.col-back-hint { margin-top:auto; padding-top:14px; font:700 8.5px/1 'Inter',sans-serif; letter-spacing:.18em;
  text-transform:uppercase; color:rgba(255,255,255,.3); text-align:center; }

/* carte verrouillée */
.col-card.locked .col-card-img { filter:grayscale(1) brightness(.32) blur(2px); transform:scale(1.05); }
.col-card.locked .col-face { box-shadow: inset 0 0 0 2px rgba(255,255,255,.1); }
.col-card.locked .col-card-shade { background:linear-gradient(180deg,rgba(6,7,20,.55),rgba(6,7,20,.9)); }
.col-lock-badge { position:absolute; top:0; left:0; right:0; bottom:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; text-align:center; padding:20px; color:#fff; z-index:2; }
.col-lock-ring { width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  background:rgba(255,255,255,.1); border:1.5px solid rgba(255,255,255,.22); margin-bottom:14px; }
.col-lock-ttl { font:800 15px/1.25 'Plus Jakarta Sans',sans-serif; margin:0; }

/* indices de swipe qui apparaissent au drag */
.col-hint-l, .col-hint-r { position:absolute; top:18px; display:flex; align-items:center; gap:6px; padding:8px 12px; border-radius:12px;
  font:800 11px/1 'Plus Jakarta Sans',sans-serif; opacity:0; transition:opacity .12s; pointer-events:none; z-index:5;
  border:2px solid; text-transform:uppercase; letter-spacing:.05em; }
.col-hint-l { left:16px; color:#8ef0b0; border-color:#8ef0b0; transform:rotate(-12deg); }
.col-hint-r { right:16px; color:#ffd76e; border-color:#ffd76e; transform:rotate(12deg); }

/* révélation d'une carte fraîchement débloquée */
@keyframes colReveal { 0%{opacity:0; transform:scale(.6) rotate(-8deg);} 60%{transform:scale(1.06) rotate(2deg);} 100%{opacity:1; transform:scale(1) rotate(0);} }
.col-card.reveal { animation:colReveal .7s cubic-bezier(.34,1.56,.64,1) both; }

/* commandes bas */
.col-ctrls { display:flex; align-items:center; justify-content:center; gap:22px; margin-top:2px; }
.col-arrow { width:52px; height:52px; border-radius:50%; cursor:pointer;
  background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.16); color:#fff;
  box-shadow:0 6px 18px -6px rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; }
.col-arrow:active { transform:scale(.92); }
.col-counter { font:800 14px/1 'Plus Jakarta Sans',sans-serif; min-width:74px; text-align:center; color:#cabfef; }
.col-swipe-tip { text-align:center; margin:12px 0 0; font:600 12px/1.4 'Inter',sans-serif; color:rgba(255,255,255,.5); }

@media (prefers-reduced-motion: reduce) {
  .col-card.is-anim { transition:none; }
  .col-card.reveal { animation:none; }
  .col-card-gloss { animation:none; }
  /* pas de rotation → l'échange des faces doit être immédiat, sans délai */
  .col-flip { transition:none; }
  .col-face { transition:none; }
}
</style>`;

function header() {
  return recompensesTabs("cartes", { dark: true });
}

function progress(nbUnlocked) {
  const pct = Math.round((nbUnlocked / CARTES_TOTAL) * 100);
  return `<div class="col-prog">
    <div class="col-prog-lbl"><b>${nbUnlocked} / ${CARTES_TOTAL} débloquées</b><span>${pct}%</span></div>
    <div class="col-prog-bar"><div class="col-prog-fill" style="width:${pct}%"></div></div>
  </div>`;
}

// Raccourcit une étape de méthode pour tenir au dos de la carte.
function shorten(s, max = 88) {
  const t = String(s || "").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

// Dos de carte : les points clés de la compétence certifiée (pédagogie REMC).
function backFace(carte) {
  const f = getFiche(carte.id);
  const steps = (f?.methode || []).slice(0, 3);
  const list = steps.length
    ? `<ul class="col-back-list">${steps
        .map(
          (s, i) => `<li><b>${i + 1}</b><span>${esc(shorten(s))}</span></li>`,
        )
        .join("")}</ul>`
    : `<p style="font:500 13px/1.5 'Inter',sans-serif;color:#cfc9ea">Compétence certifiée de ton parcours.</p>`;
  // L'illustration reste visible derrière, floutée et assombrie : le dos
  // garde l'identité de la carte au lieu d'un aplat noir.
  return `<img class="col-back-bg" src="${esc(carte.img)}" alt="" loading="lazy" draggable="false">
  <div class="col-back-veil"></div>
  <div class="col-back-in">
    <div class="col-back-top">
      <span class="col-back-lbl">Carte ${String(carte.idx).padStart(2, "0")} / ${CARTES_TOTAL}</span>
      <span class="col-back-lbl" style="display:flex;align-items:center;gap:6px">${esc(carte.rarity.label)} <i class="col-back-dot"></i></span>
    </div>
    <h4 class="col-back-ttl">${esc(f?.titre || carte.n)}</h4>
    <div class="col-back-sub">${esc(carte.tname)}</div>
    ${list}
    <p class="col-back-hint">Appuie pour retourner</p>
  </div>`;
}

// Rendu du contenu d'une carte. `unlocked` bool, `dateStr`, `isNew`.
function cardInner(carte, unlocked, dateStr, isNew) {
  const idx = String(carte.idx).padStart(2, "0");
  const meta = (withName) => `
    <span class="col-rar">${esc(carte.rarity.label)}</span>
    ${isNew ? `<span class="col-new">Nouveau</span>` : ""}
    <div class="col-card-meta">
      <span class="col-card-world" style="background:${esc(carte.tint)}33">${esc(carte.tname)}</span>
      ${withName ? `<h3 class="col-card-name">${esc(carte.n)}</h3>` : ""}
      <div class="col-card-idx">Carte ${idx} sur ${CARTES_TOTAL}</div>
      ${withName && dateStr ? `<div class="col-card-date">Certifiée le ${esc(dateStr)}</div>` : ""}
    </div>`;

  if (unlocked) {
    return `<div class="col-flip">
      <div class="col-face col-front">
        <img class="col-card-img" src="${esc(carte.img)}" alt="Carte ${esc(carte.n)}" loading="lazy" draggable="false">
        <i class="col-card-gloss"></i>
        <div class="col-card-shade"></div>
        ${meta(true)}
      </div>
      <div class="col-face col-back">${backFace(carte)}</div>
    </div>`;
  }
  return `<div class="col-face col-front">
    <img class="col-card-img" src="${esc(carte.img)}" alt="" loading="lazy" draggable="false">
    <div class="col-card-shade"></div>
    <div class="col-lock-badge">
      <div class="col-lock-ring">${icon("lock", { size: 24 })}</div>
      <p class="col-lock-ttl">Carte verrouillée</p>
    </div>
    ${meta(false)}
  </div>`;
}

function skeleton() {
  return `${STYLE}<div class="col">${header()}<div class="col-stage"></div></div>`;
}

export async function mount(root, param) {
  const me = getCurUser();
  if (!me) return;
  track("page_view", { page: "cartes", role: me.role });

  root.innerHTML = skeleton();

  // Cartes débloquées = compétences certifiées (self_validations) OU
  // validées par le moniteur (validations acquis). On ne LIT que ses lignes.
  const [selfRes, valRes] = await Promise.allSettled([
    sb
      .from("self_validations")
      .select("competence_id, validated_at")
      .eq("eleve_id", me.id),
    sb
      .from("validations")
      .select("competence_id, statut")
      .eq("eleve_id", me.id)
      .eq("statut", "acquis"),
  ]);

  // Map compId → date de déblocage (préférence à la certif élève).
  const unlocked = new Map();
  if (selfRes.status === "fulfilled") {
    for (const r of selfRes.value?.data || [])
      unlocked.set(r.competence_id, r.validated_at || null);
  }
  if (valRes.status === "fulfilled") {
    for (const r of valRes.value?.data || [])
      if (!unlocked.has(r.competence_id)) unlocked.set(r.competence_id, null);
  }

  const state = {
    cur: 0,
    unlocked,
    seen: loadSeen(), // cartes déjà regardées → pas de badge « Nouveau »
    // carte à révéler (arrivée depuis une certif) : #/cartes/{compId}
    reveal: param && unlocked.has(param) ? param : null,
  };
  // Démarre sur la carte demandée si fournie.
  if (param) {
    const i = CARTES.findIndex((c) => c.id === param);
    if (i >= 0) state.cur = i;
  } else {
    // Sinon démarre sur la première carte non débloquée (« à viser »),
    // ou la dernière si tout est débloqué.
    const firstLocked = CARTES.findIndex((c) => !unlocked.has(c.id));
    state.cur = firstLocked >= 0 ? firstLocked : 0;
  }

  render(root, state);
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

function cardEl(carte, state, { reveal = false } = {}) {
  const isUnlocked = state.unlocked.has(carte.id);
  const isNew = isUnlocked && !state.seen.has(carte.id);
  const el = document.createElement("div");
  el.className = `col-card r-${carte.rarity.key}${isUnlocked ? "" : " locked"}${reveal ? " reveal" : ""}`;
  el.style.setProperty("--rc", carte.rarity.color);
  el.dataset.comp = carte.id;
  el.innerHTML = cardInner(
    carte,
    isUnlocked,
    isUnlocked ? fmtDate(state.unlocked.get(carte.id)) : "",
    isNew,
  );
  return el;
}

function render(root, state) {
  const nbUnlocked = state.unlocked.size;
  root.innerHTML = `${STYLE}<div class="col anim-slide-up">
    ${header()}
    ${progress(nbUnlocked)}
    <div class="col-stage" id="col-stage">
      <div class="col-hint-l">${icon("check", { size: 14 })} Suivante</div>
      <div class="col-hint-r">Précédente ${icon("chevron-right", { size: 14 })}</div>
    </div>
    <div class="col-ctrls">
      <button class="col-arrow" id="col-prev" aria-label="Carte précédente">${icon("chevron-left", { size: 22 })}</button>
      <div class="col-counter" id="col-counter"></div>
      <button class="col-arrow" id="col-next" aria-label="Carte suivante">${icon("chevron-right", { size: 22 })}</button>
    </div>
    <p class="col-swipe-tip" id="col-tip">Glisse pour feuilleter ta collection</p>
  </div>`;

  buildDeck(root, state);
  wireControls(root, state);
  enableTilt(root);
}

// Reconstruit les 3 couches empilées à partir de state.cur.
function buildDeck(root, state) {
  const stage = root.querySelector("#col-stage");
  if (!stage) return;
  // enlève les anciennes cartes (garde les indices de hint)
  stage.querySelectorAll(".col-card").forEach((n) => n.remove());

  // 3 couches : la 2e et 3e derrière, réduites/remontées.
  const DEPTH = 3;
  const layers = [];
  for (let d = DEPTH - 1; d >= 0; d--) {
    const carte = CARTES[(state.cur + d) % CARTES.length];
    const isTop = d === 0;
    const el = cardEl(carte, state, {
      reveal: isTop && state.reveal === carte.id,
    });
    if (!isTop) {
      const scale = 1 - d * 0.055;
      const ty = -d * 16;
      el.style.transform = `translateY(${ty}px) scale(${scale})`;
      el.style.filter = "brightness(.85)";
      el.style.pointerEvents = "none";
    }
    stage.appendChild(el);
    layers.push(el);
  }
  const top = stage.querySelector(".col-card:last-child");
  if (state.reveal) {
    // confettis + reset du flag pour ne jouer qu'une fois
    const carte = CARTES[state.cur % CARTES.length];
    if (state.reveal === carte.id) {
      haptic("success");
      burstConfetti({ count: 90, power: 15 });
      track("cartes.reveal", { competence_id: carte.id });
    }
    state.reveal = null;
  }
  // La carte du dessus est « vue » → retire le badge « Nouveau » au prochain passage.
  const topCarte = CARTES[state.cur % CARTES.length];
  if (state.unlocked.has(topCarte.id) && !state.seen.has(topCarte.id)) {
    state.seen.add(topCarte.id);
    markSeen(topCarte.id);
  }
  updateCounter(root, state);
  updateTip(root, state);
  makeDraggable(root, state, top);
}

function updateCounter(root, state) {
  const c = root.querySelector("#col-counter");
  if (c) c.textContent = `${(state.cur % CARTES.length) + 1} / ${CARTES_TOTAL}`;
}

// Texte du bas : instruction si la carte du dessus est verrouillée.
function updateTip(root, state) {
  const tip = root.querySelector("#col-tip");
  if (!tip) return;
  const carte = CARTES[state.cur % CARTES.length];
  const locked = !state.unlocked.has(carte.id);
  tip.textContent = locked
    ? "Certifie cette compétence en réussissant ton quiz"
    : "Glisse pour feuilleter ta collection";
}

// Avance (dir=+1) ou recule (dir=-1) d'une carte, avec l'envol de la carte du dessus.
function advance(root, state, dir) {
  const stage = root.querySelector("#col-stage");
  const top = stage?.querySelector(".col-card:last-child");
  if (!top) return;
  haptic("tap");
  const out = dir > 0 ? -1 : 1; // swipe gauche = suivante
  top.classList.add("is-anim");
  top.style.transform = `translateX(${out * 140}%) rotate(${out * 18}deg)`;
  top.style.opacity = "0";
  const after = () => {
    top.removeEventListener("transitionend", after);
    state.cur = (state.cur + dir + CARTES.length) % CARTES.length;
    buildDeck(root, state);
  };
  top.addEventListener("transitionend", after);
  // filet de sécurité si transitionend ne se déclenche pas
  setTimeout(() => {
    if (top.isConnected) after();
  }, 480);
}

function wireControls(root, state) {
  root
    .querySelector("#col-next")
    ?.addEventListener("click", () => advance(root, state, +1));
  root
    .querySelector("#col-prev")
    ?.addEventListener("click", () => advance(root, state, -1));
}

// Drag pointer sur la carte du dessus.
function makeDraggable(root, state, top) {
  if (!top) return;
  const stage = root.querySelector("#col-stage");
  const hintL = stage?.querySelector(".col-hint-l");
  const hintR = stage?.querySelector(".col-hint-r");
  const gloss = top.querySelector(".col-card-gloss");
  const comp = top.dataset.comp;
  const isLocked = !state.unlocked.has(comp);

  let startX = 0,
    startY = 0,
    dx = 0,
    dy = 0,
    moved = 0,
    dragging = false;

  const onDown = (e) => {
    requestTiltPermission(); // iOS : la permission capteur exige un geste
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    moved = 0;
    top.classList.remove("is-anim");
    top.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    // reflet qui suit le doigt même sans drag (donne la texture d'objet réel)
    if (gloss) {
      const r = top.getBoundingClientRect();
      gloss.style.setProperty(
        "--gx",
        `${((e.clientX - r.left) / r.width) * 100}%`,
      );
      gloss.style.setProperty(
        "--gy",
        `${((e.clientY - r.top) / r.height) * 100}%`,
      );
    }
    if (!dragging) return;
    dx = e.clientX - startX;
    dy = e.clientY - startY;
    moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
    if (Math.abs(dy) > Math.abs(dx) * 1.4 && Math.abs(dx) < 12) return; // scroll vertical
    const rot = dx / 18;
    top.style.transform = `translate(${dx}px, ${dy * 0.25}px) rotate(${rot}deg)`;
    const prog = Math.min(1, Math.abs(dx) / SWIPE_COMMIT);
    if (hintL) hintL.style.opacity = dx < 0 ? String(prog) : "0";
    if (hintR) hintR.style.opacity = dx > 0 ? String(prog) : "0";
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    if (hintL) hintL.style.opacity = "0";
    if (hintR) hintR.style.opacity = "0";
    if (Math.abs(dx) > SWIPE_COMMIT) {
      advance(root, state, dx < 0 ? +1 : -1);
    } else {
      top.classList.add("is-anim");
      top.style.transform = "";
      // tap net (pas un drag)
      if (moved < 8) {
        if (isLocked && comp) {
          // carte verrouillée → aller la certifier
          haptic("tap");
          track("cartes.certify_cta", { competence_id: comp });
          navigate(`#/valider-seul/${comp}`);
        } else {
          // carte débloquée → retourner pour voir la pédagogie au dos
          haptic("tap");
          top.classList.toggle("flipped");
          track("cartes.flip", { competence_id: comp });
        }
      }
    }
    dx = dy = 0;
  };

  top.addEventListener("pointerdown", onDown);
  top.addEventListener("pointermove", onMove);
  top.addEventListener("pointerup", onUp);
  top.addEventListener("pointercancel", onUp);
}

// ── Reflet réactif à l'inclinaison du téléphone (effet carte holographique) ──
let _tiltOn = false;
function requestTiltPermission() {
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function" && !_tiltOn) {
    DOE.requestPermission().catch(() => {});
  }
}
function enableTilt(root) {
  if (_tiltOn) return;
  _tiltOn = true;
  window.addEventListener("deviceorientation", (e) => {
    // gamma = gauche/droite (−90..90), beta = avant/arrière (−180..180)
    const g = Math.max(-35, Math.min(35, e.gamma || 0));
    const b = Math.max(-35, Math.min(35, (e.beta || 40) - 40));
    const gx = 50 + g * 1.1;
    const gy = 20 + b * 0.9;
    const gloss = root.querySelector(
      "#col-stage .col-card:last-child .col-card-gloss",
    );
    if (gloss) {
      gloss.style.setProperty("--gx", `${gx}%`);
      gloss.style.setProperty("--gy", `${gy}%`);
    }
  });
}
