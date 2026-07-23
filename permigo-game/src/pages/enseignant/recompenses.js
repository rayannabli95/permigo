// ═══════════════════════════════════════════════════════════════
// Moniteur — « Ta roue de récompenses » : choisir les lots offerts
// aux élèves (presets + lots perso avec icône). L'élève voit ensuite
// ces lots dans sa roue, signés à ta marque (« Offert par … »).
// RPCs : get_my_reward_config() · set_my_reward_config(p_lots, p_gen)
// DA moniteur « Blason pro » : indigo premium clair.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { toast } from "@/components/common/toast.js";
import { haptic } from "@/utils/haptic.js";
import { medallion, medLot } from "@/utils/medallions.js";
import { icon } from "@/utils/icons.js";

// Icônes proposées pour un lot perso (emoji = rendu identique élève/moniteur,
// zéro asset à héberger → règle le « comment le représenter côté élève »).
const ICON_CHOICES = [
  "🎁",
  "🅰️",
  "🚗",
  "🧰",
  "☕",
  "🎟️",
  "🛒",
  "⛽",
  "🍔",
  "🎧",
  "🧢",
  "🎫",
];

const GENEROSITE = [
  { key: "eco", label: "Éco", hint: "Rare" },
  { key: "equilibre", label: "Équilibré", hint: "~1 / trimestre" },
  { key: "genereux", label: "Généreux", hint: "Plus de chances" },
];

// état module (le temps de la page)
let LOTS = [];
let GEN = "equilibre";
let _customSeq = 0;

const STYLE = `<style>
.mrw {
  --ind:#4f46e5; --ind-2:#6366f1; --ind-deep:#3730a3;
  --ind-soft:#eef0fe; --ind-softer:#f6f7ff;
  --card:#fff; --line:#e6e8f4; --ink:#1c1e2e; --mu:#6b7089; --mu2:#9aa0b8;
  --green:#16a34a; --sh:0 10px 30px -14px rgba(38,42,90,.18);
  position: relative; max-width: 480px; margin-inline: auto;
  padding: 8px 16px 60px; color: var(--ink); font-family: 'Nunito', system-ui, sans-serif;
  background:
    radial-gradient(120% 40% at 50% -6%, rgba(99,102,241,.14) 0%, transparent 60%),
    var(--bg, #f4f5fb);
  min-height: 100dvh;
}
.mrw-top { display: flex; align-items: center; gap: 10px; padding: 6px 0 8px; }
.mrw-back {
  width: 40px; height: 40px; flex: none; border-radius: 13px; border: 1px solid var(--line);
  background: var(--card); color: var(--ink); display: grid; place-items: center; cursor: pointer; box-shadow: var(--sh);
}
.mrw-back svg { width: 20px; height: 20px; }
.mrw-crumb { font: 500 13.5px/1 'Fredoka', sans-serif; color: var(--mu); }

.mrw-hd { padding: 6px 2px 2px; }
.mrw-kicker {
  display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px 5px 9px; border-radius: 999px; margin-bottom: 10px;
  background: var(--ind-soft); border: 1px solid rgba(99,102,241,.28);
  font: 600 10.5px/1 'Fredoka', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--ind);
}
.mrw-hd h1 { font: 700 24px/1.12 'Fredoka', sans-serif; letter-spacing: -.2px; }
.mrw-hd p { margin-top: 6px; font: 700 13.5px/1.5 'Nunito', sans-serif; color: var(--mu); max-width: 34ch; }

.mrw-card { margin-top: 16px; border-radius: 20px; padding: 16px; background: var(--card); border: 1px solid var(--line); box-shadow: var(--sh); }
.mrw-card-h { font: 600 16px/1.1 'Fredoka', sans-serif; display: flex; align-items: center; gap: 8px; }
.mrw-card-h .ic { width: 30px; height: 30px; flex: none; border-radius: 10px; display: grid; place-items: center; background: var(--ind-soft); color: var(--ind); }
.mrw-card-h .ic svg { width: 16px; height: 16px; }
.mrw-card-sub { font: 700 12px/1.4 'Nunito', sans-serif; color: var(--mu2); margin: 2px 0 4px 38px; }

.mrw-lot { display: flex; align-items: center; gap: 12px; padding: 12px 2px; border-bottom: 1px solid var(--line); }
.mrw-lot:last-of-type { border-bottom: 0; }
.mrw-lot-ic { width: 44px; height: 44px; flex: none; display: grid; place-items: center; }
.mrw-lot-ic svg { display: block; }
.mrw-lot-tx { flex: 1; min-width: 0; }
.mrw-lot-name { font: 800 14.5px/1.2 'Nunito', sans-serif; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mrw-lot-badge { font: 600 9.5px/1 'Fredoka', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: var(--ind); background: var(--ind-soft); border: 1px solid rgba(99,102,241,.3); padding: 2px 7px; border-radius: 999px; }
.mrw-lot-badge.big { color: #8a5a00; background: #fff3d6; border-color: #f0c164; }
.mrw-lot-big { margin-top: 6px; font: 700 11px/1 'Fredoka', sans-serif; color: var(--mu); background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 6px 11px; cursor: pointer; }
.mrw-lot-big.on { color: #8a5a00; background: #fff3d6; border-color: #f0c164; }

.mrw-wins-row { display: flex; align-items: center; gap: 11px; padding: 11px 2px; border-bottom: 1px solid var(--line); }
.mrw-wins-row:last-of-type { border-bottom: 0; }
.mrw-wins-ic { width: 38px; height: 38px; flex: none; border-radius: 12px; display: grid; place-items: center; font-size: 19px; background: var(--ind-softer); border: 1px solid var(--line); }
.mrw-wins-tx { flex: 1; min-width: 0; }
.mrw-wins-tx b { display: block; font: 800 13.5px/1.2 'Nunito', sans-serif; }
.mrw-wins-tx span { font: 700 11px/1.3 'Nunito', sans-serif; color: var(--mu2); }
.mrw-wins-code { flex: none; font: 800 13px/1 'Fredoka', sans-serif; letter-spacing: .06em; color: var(--ind-deep); background: var(--ind-soft); border: 1px dashed rgba(99,102,241,.4); border-radius: 9px; padding: 6px 9px; }
.mrw-wins-btn { flex: none; min-height: 38px; padding: 0 14px; border: 0; border-radius: 10px; background: linear-gradient(180deg, var(--ind-2), var(--ind)); color: #fff; font: 600 12.5px/1 'Fredoka', sans-serif; cursor: pointer; }
.mrw-wins-btn:disabled { opacity: .55; }
.mrw-wins-done { flex: none; font: 700 12px/1 'Fredoka', sans-serif; color: var(--green); display: inline-flex; align-items: center; gap: 5px; }
.mrw-wins-empty { font: 700 12.5px/1.5 'Nunito', sans-serif; color: var(--mu); text-align: center; padding: 4px 0; }
.mrw-lot-del { flex: none; width: 30px; height: 30px; border: 0; border-radius: 9px; background: transparent; color: var(--mu2); cursor: pointer; display: grid; place-items: center; }
.mrw-lot-del svg { width: 16px; height: 16px; }

.mrw-sw { position: relative; flex: none; width: 46px; height: 28px; }
.mrw-sw input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.mrw-sw i { position: absolute; inset: 0; border-radius: 999px; background: #d7daea; transition: background .18s; pointer-events: none; }
.mrw-sw i::after { content: ""; position: absolute; left: 3px; top: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 2px 5px rgba(30,34,70,.25); transition: transform .18s; }
.mrw-sw input:checked + i { background: var(--ind); }
.mrw-sw input:checked + i::after { transform: translateX(18px); }

.mrw-add { margin-top: 12px; width: 100%; min-height: 46px; border-radius: 14px; cursor: pointer; border: 1.5px dashed rgba(99,102,241,.45); background: var(--ind-softer); font: 600 14px/1 'Fredoka', sans-serif; color: var(--ind); display: flex; align-items: center; justify-content: center; gap: 7px; }
.mrw-add svg { width: 16px; height: 16px; }

/* éditeur lot perso */
.mrw-editor { margin-top: 12px; padding: 14px; border-radius: 16px; background: var(--ind-softer); border: 1px solid var(--line); }
.mrw-editor label { display: block; font: 700 11px/1 'Fredoka', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: var(--mu2); margin-bottom: 6px; }
.mrw-editor input[type=text] { width: 100%; min-height: 44px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: #fff; font: 700 14px/1.2 'Nunito', sans-serif; color: var(--ink); outline: none; }
.mrw-editor input[type=text]:focus { border-color: var(--ind-2); }
.mrw-icons { display: grid; grid-template-columns: repeat(6, 1fr); gap: 7px; margin: 10px 0 12px; }
.mrw-ico-btn { aspect-ratio: 1; border-radius: 11px; border: 1.5px solid var(--line); background: #fff; cursor: pointer; display: grid; place-items: center; }
.mrw-ico-btn svg { display: block; }
.mrw-ico-btn.on { border-color: var(--ind); background: var(--ind-soft); box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
.mrw-editor-actions { display: flex; gap: 8px; }
.mrw-btn-add { flex: 1; min-height: 44px; border: 0; border-radius: 12px; background: linear-gradient(180deg, var(--ind-2), var(--ind)); color: #fff; font: 600 14px/1 'Fredoka', sans-serif; cursor: pointer; }
.mrw-btn-add:disabled { opacity: .5; cursor: default; }
.mrw-btn-cancel { min-height: 44px; padding: 0 16px; border: 1px solid var(--line); border-radius: 12px; background: #fff; color: var(--mu); font: 600 14px/1 'Fredoka', sans-serif; cursor: pointer; }

/* générosité */
.mrw-seg { margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; padding: 5px; border-radius: 16px; background: var(--ind-softer); border: 1px solid var(--line); }
.mrw-seg-opt { border: 0; border-radius: 12px; padding: 10px 4px 9px; cursor: pointer; text-align: center; background: transparent; color: var(--mu); }
.mrw-seg-opt b { display: block; font: 600 13.5px/1 'Fredoka', sans-serif; color: inherit; }
.mrw-seg-opt span { display: block; margin-top: 3px; font: 700 10px/1.25 'Nunito', sans-serif; color: inherit; opacity: .85; }
.mrw-seg-opt.on { background: linear-gradient(180deg, var(--ind-2), var(--ind)); color: #fff; box-shadow: 0 6px 14px -6px rgba(79,70,229,.55); }

.mrw-cap { margin-top: 16px; border-radius: 18px; padding: 14px; display: flex; gap: 12px; align-items: flex-start; background: linear-gradient(180deg, var(--ind-soft), #fff); border: 1px solid rgba(99,102,241,.3); box-shadow: var(--sh); }
.mrw-cap-ic { width: 40px; height: 40px; flex: none; border-radius: 13px; display: grid; place-items: center; background: linear-gradient(180deg, var(--ind-2), var(--ind)); color: #fff; box-shadow: 0 8px 16px -8px rgba(79,70,229,.7); }
.mrw-cap-ic svg { width: 20px; height: 20px; }
.mrw-cap-tx h3 { font: 600 14.5px/1.1 'Fredoka', sans-serif; }
.mrw-cap-tx p { margin-top: 4px; font: 700 12px/1.5 'Nunito', sans-serif; color: var(--mu); }
.mrw-cap-tx b { color: var(--ind-deep); }

/* aperçu élève */
.mrw-prev-k { font: 600 10.5px/1 'Fredoka', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--mu2); margin: 18px 2px 8px; }
.mrw-prev { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border-radius: 16px; background: linear-gradient(180deg, #241644, #2b1b54); border: 1px solid rgba(167,139,250,.3); box-shadow: var(--sh); }
.mrw-prev-av { width: 34px; height: 34px; flex: none; border-radius: 50%; display: grid; place-items: center; font: 700 15px/1 'Fredoka', sans-serif; color: #0d2402; background: linear-gradient(160deg, #b9f26e, #58cc02); border: 2px solid rgba(255,255,255,.55); }
.mrw-prev-tx { flex: 1; min-width: 0; }
.mrw-prev-tx b { display: block; font: 800 13px/1.2 'Nunito', sans-serif; color: #fff; }
.mrw-prev-tx span { font: 700 11px/1.3 'Nunito', sans-serif; color: #c3b8e8; display: inline-flex; align-items: center; gap: 5px; }
.mrw-prev-ic { display: inline-flex; flex: none; }
.mrw-prev-ic svg { display: block; }
.mrw-prev-tag { flex: none; font: 600 9.5px/1 'Fredoka', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: #b9f26e; background: rgba(111,224,22,.15); border: 1px solid rgba(111,224,22,.4); padding: 3px 8px; border-radius: 999px; }
.mrw-prev-empty { padding: 14px; border-radius: 16px; background: var(--ind-softer); border: 1px dashed var(--line); font: 700 12.5px/1.5 'Nunito', sans-serif; color: var(--mu); text-align: center; }

.mrw-save { margin-top: 22px; width: 100%; min-height: 54px; border: 0; border-radius: 16px; cursor: pointer; font: 600 16.5px/1 'Fredoka', sans-serif; color: #fff; background: linear-gradient(180deg, var(--ind-2), var(--ind)); box-shadow: 0 12px 24px -8px rgba(79,70,229,.65), inset 0 1px 0 rgba(255,255,255,.25); }
.mrw-save:disabled { opacity: .6; cursor: default; }

/* Écran focus (sous-page config) : on masque la nav du bas + le FAB « séance »
   le temps de la page (retour propre via le bouton en haut). Le <style> est
   retiré au changement de route → la nav revient d'elle-même. */
#bottom-nav, #bn-seance-fab { display: none !important; }

.mrw-skel { height: 120px; border-radius: 20px; margin-top: 16px; background: linear-gradient(90deg,#eef0f8 0%,#f7f8fc 50%,#eef0f8 100%); background-size: 200% 100%; animation: mrwsh 1.4s infinite; }
@keyframes mrwsh { to { background-position: -200% 0; } }
</style>`;

function renderLotsSection() {
  return LOTS.map(
    (lot, i) => `
    <div class="mrw-lot" data-lot="${i}">
      <div class="mrw-lot-ic" aria-hidden="true">${medLot(lot.icon, { size: 40 })}</div>
      <div class="mrw-lot-tx">
        <div class="mrw-lot-name">${esc(lot.label)}${lot.kind === "custom" ? '<span class="mrw-lot-badge">Lot perso</span>' : ""}${lot.enabled && lot.big ? '<span class="mrw-lot-badge big">🎯 En jeu</span>' : ""}</div>
        ${
          lot.enabled
            ? `<button class="mrw-lot-big ${lot.big ? "on" : ""}" data-big="${i}">${lot.big ? "🎯 En jeu · gagnable à la roue" : "Mettre en jeu dans la roue"}</button>`
            : ""
        }
      </div>
      ${
        lot.kind === "custom"
          ? `<button class="mrw-lot-del" data-del="${i}" aria-label="Retirer ce lot">
               ${icon("trash", { size: 16 })}
             </button>`
          : ""
      }
      <label class="mrw-sw"><input type="checkbox" data-toggle="${i}" ${lot.enabled ? "checked" : ""}><i></i></label>
    </div>`,
  ).join("");
}

function renderPreview(prenom, initiale) {
  const active = LOTS.filter((l) => l.enabled);
  if (!active.length) {
    return `<div class="mrw-prev-empty">Active au moins un lot pour qu’il apparaisse dans la roue de tes élèves.</div>`;
  }
  const lot = active[0];
  return `
    <div class="mrw-prev">
      <div class="mrw-prev-av">${esc(initiale)}</div>
      <div class="mrw-prev-tx">
        <b>Offert par ${esc(prenom)} · ton moniteur</b>
        <span><span class="mrw-prev-ic">${medLot(lot.icon, { size: 18, glow: true })}</span>${esc(lot.label)}</span>
      </div>
      <span class="mrw-prev-tag">Réel</span>
    </div>`;
}

// Carte « à remettre » : les gros lots gagnés par ses élèves, en attente.
function renderWinsCard(wins) {
  const pending = (wins || []).filter((w) => w.status === "a_remettre");
  if (!pending.length) return "";
  const rows = pending
    .map(
      (w) => `
    <div class="mrw-wins-row" data-row="${escAttr(w.claim_code)}">
      <div class="mrw-wins-ic" aria-hidden="true">${esc(w.lot_icon || "🎁")}</div>
      <div class="mrw-wins-tx">
        <b>${esc(w.lot_label || "Cadeau")}</b>
        <span>Gagné par ${esc(w.eleve || "un élève")}</span>
      </div>
      <span class="mrw-wins-code">${esc(w.claim_code)}</span>
      <button class="mrw-wins-btn" data-remis="${escAttr(w.claim_code)}">Remis</button>
    </div>`,
    )
    .join("");
  return `
  <section class="mrw-card">
    <div class="mrw-card-h"><span class="ic">🎁</span>À remettre</div>
    <div class="mrw-card-sub">Un élève a gagné un gros lot chez toi. Vérifie son code, remets le lot, puis marque-le remis.</div>
    ${rows}
  </section>`;
}

function render(root, me) {
  const prenom = (me.prenom || me.nom || "toi").trim().split(/\s+/)[0] || "toi";
  const initiale = prenom.charAt(0).toUpperCase() || "R";
  const activeCount = LOTS.filter((l) => l.enabled).length;

  root.innerHTML = `${STYLE}
<div class="mrw">
  <div class="mrw-top">
    <button class="mrw-back" id="mrw-back" aria-label="Retour">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <span class="mrw-crumb">Récompenses élèves</span>
  </div>

  <div class="mrw-hd">
    <div class="mrw-kicker">Ta marque</div>
    <h1>Ta roue de récompenses</h1>
    <p>Les gros lots, c’est <b>toi</b> qui les offres. Ton nom apparaît sur chacun.</p>
  </div>

  <div id="mrw-wins-slot"></div>

  <section class="mrw-card">
    <div class="mrw-card-h">
      <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7S10.5 3 7.5 3 4.5 5.2 4.5 5.2 6.5 7 8 7h4z"/><path d="M12 7s1.5-4 4.5-4 3 2.2 3 2.2S17.5 7 16 7h-4z"/></svg></span>
      Tes lots
    </div>
    <div class="mrw-card-sub">Active un lot pour l’afficher aux élèves. Mets-le en jeu pour qu’il soit <b>gagnable</b> à la roue.</div>
    <div id="mrw-lots">${renderLotsSection()}</div>
    <button class="mrw-add" id="mrw-add">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      Ajouter un lot
    </button>
    <div id="mrw-editor-slot"></div>
  </section>

  <section class="mrw-card">
    <div class="mrw-card-h">
      <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg></span>
      Générosité
    </div>
    <div class="mrw-card-sub">La fréquence à laquelle un gros lot peut tomber.</div>
    <div class="mrw-seg" id="mrw-seg">
      ${GENEROSITE.map((g) => `<button class="mrw-seg-opt ${g.key === GEN ? "on" : ""}" data-gen="${g.key}"><b>${g.label}</b><span>${g.hint}</span></button>`).join("")}
    </div>
  </section>

  <section class="mrw-cap">
    <div class="mrw-cap-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></div>
    <div class="mrw-cap-tx">
      <h3>Plafond de sécurité</h3>
      <p>Jamais plus d’<b>1 gros lot par trimestre et par élève</b>. Une fois ce plafond atteint, la roue n’offre plus que des volants. Aucune mauvaise surprise.</p>
    </div>
  </section>

  <div class="mrw-prev-k">Aperçu côté élève</div>
  <div id="mrw-preview">${renderPreview(prenom, initiale)}</div>

  <button class="mrw-save" id="mrw-save">Enregistrer (${activeCount} lot${activeCount > 1 ? "s" : ""})</button>
</div>`;

  wire(root, me, prenom, initiale);
}

function refresh(root, me, prenom, initiale) {
  root.querySelector("#mrw-lots").innerHTML = renderLotsSection();
  root.querySelector("#mrw-preview").innerHTML = renderPreview(
    prenom,
    initiale,
  );
  const activeCount = LOTS.filter((l) => l.enabled).length;
  const save = root.querySelector("#mrw-save");
  if (save)
    save.textContent = `Enregistrer (${activeCount} lot${activeCount > 1 ? "s" : ""})`;
  wireLots(root, me, prenom, initiale);
}

function wireLots(root, me, prenom, initiale) {
  root.querySelectorAll("[data-toggle]").forEach((cb) =>
    cb.addEventListener("change", () => {
      const i = +cb.dataset.toggle;
      if (LOTS[i]) LOTS[i].enabled = cb.checked;
      // re-rend : fait apparaître/disparaître le bouton « Mettre en jeu ».
      refresh(root, me, prenom, initiale);
    }),
  );
  root.querySelectorAll("[data-big]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = +b.dataset.big;
      if (LOTS[i]) LOTS[i].big = !LOTS[i].big;
      haptic("select");
      refresh(root, me, prenom, initiale);
    }),
  );
  root.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = +b.dataset.del;
      LOTS.splice(i, 1);
      refresh(root, me, prenom, initiale);
    }),
  );
}

function openEditor(root, me, prenom, initiale) {
  const slot = root.querySelector("#mrw-editor-slot");
  if (!slot || slot.querySelector(".mrw-editor")) return;
  let icon = ICON_CHOICES[0];
  slot.innerHTML = `
    <div class="mrw-editor">
      <label for="mrw-lot-name">Nom du lot</label>
      <input type="text" id="mrw-lot-name" maxlength="40" placeholder="Ex : café offert, bon carburant…" autocomplete="off">
      <label style="margin-top:12px">Icône</label>
      <div class="mrw-icons" id="mrw-icons">
        ${ICON_CHOICES.map((ic, k) => `<button type="button" class="mrw-ico-btn ${k === 0 ? "on" : ""}" data-ico="${escAttr(ic)}">${esc(ic)}</button>`).join("")}
      </div>
      <div class="mrw-editor-actions">
        <button class="mrw-btn-add" id="mrw-ed-add" disabled>Ajouter</button>
        <button class="mrw-btn-cancel" id="mrw-ed-cancel">Annuler</button>
      </div>
    </div>`;
  const input = slot.querySelector("#mrw-lot-name");
  const addBtn = slot.querySelector("#mrw-ed-add");
  input?.focus();
  input?.addEventListener("input", () => {
    addBtn.disabled = !input.value.trim();
  });
  slot.querySelectorAll("[data-ico]").forEach((b) =>
    b.addEventListener("click", () => {
      slot
        .querySelectorAll(".mrw-ico-btn")
        .forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      icon = b.dataset.ico;
    }),
  );
  slot.querySelector("#mrw-ed-cancel")?.addEventListener("click", () => {
    slot.innerHTML = "";
  });
  addBtn?.addEventListener("click", () => {
    const label = input.value.trim();
    if (!label) return;
    LOTS.push({
      key: `custom_${Date.now()}_${_customSeq++}`,
      label,
      icon,
      kind: "custom",
      enabled: true,
    });
    slot.innerHTML = "";
    refresh(root, me, prenom, initiale);
  });
}

function wire(root, me, prenom, initiale) {
  root
    .querySelector("#mrw-back")
    ?.addEventListener("click", () => navigate("/settings"));
  root
    .querySelector("#mrw-add")
    ?.addEventListener("click", () => openEditor(root, me, prenom, initiale));
  root.querySelectorAll("[data-gen]").forEach((b) =>
    b.addEventListener("click", () => {
      GEN = b.dataset.gen;
      root
        .querySelectorAll(".mrw-seg-opt")
        .forEach((x) => x.classList.toggle("on", x.dataset.gen === GEN));
    }),
  );
  wireLots(root, me, prenom, initiale);

  root.querySelector("#mrw-save")?.addEventListener("click", async () => {
    const save = root.querySelector("#mrw-save");
    save.disabled = true;
    save.textContent = "Enregistrement…";
    haptic("select");
    try {
      const { data, error } = await sb.rpc("set_my_reward_config", {
        p_lots: LOTS,
        p_generosite: GEN,
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      track("moniteur.rewards_saved", {
        lots: LOTS.length,
        actifs: LOTS.filter((l) => l.enabled).length,
        generosite: GEN,
      });
      toast("Tes récompenses sont enregistrées", "success", 2200);
      const activeCount = LOTS.filter((l) => l.enabled).length;
      save.textContent = `Enregistrer (${activeCount} lot${activeCount > 1 ? "s" : ""})`;
      save.disabled = false;
    } catch (e) {
      console.error("[recompenses] save", e);
      toast("Enregistrement impossible. Réessaie.", "error", 2500);
      save.textContent = "Enregistrer";
      save.disabled = false;
    }
  });
}

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  if (me.role !== "enseignant") {
    navigate("/");
    return;
  }
  track("page_view", { page: "moniteur_recompenses" });

  root.innerHTML = `${STYLE}<div class="mrw"><div class="mrw-skel"></div><div class="mrw-skel"></div></div>`;

  try {
    const { data } = await sb.rpc("get_my_reward_config");
    LOTS = Array.isArray(data?.lots) ? data.lots : [];
    GEN = data?.generosite || "equilibre";
  } catch {
    LOTS = [];
    GEN = "equilibre";
  }
  // Filet : si le RPC n'est pas encore posé, on part sur les presets par défaut.
  if (!LOTS.length) {
    LOTS = [
      {
        key: "disque_a",
        label: "Disque A jeune conducteur",
        icon: "🅰️",
        kind: "preset",
        enabled: true,
      },
      {
        key: "heure_conduite",
        label: "1 heure de conduite offerte",
        icon: "🚗",
        kind: "preset",
        enabled: true,
      },
      {
        key: "pack_securite",
        label: "Pack ampoules + éthylotest",
        icon: "🧰",
        kind: "preset",
        enabled: false,
      },
    ];
  }

  render(root, me);

  // Gros lots gagnés à remettre (best-effort : RPC absent = section masquée).
  try {
    const { data, error } = await sb.rpc("get_my_lot_wins");
    if (!error && Array.isArray(data)) {
      const slot = root.querySelector("#mrw-wins-slot");
      if (slot) {
        slot.innerHTML = renderWinsCard(data);
        wireWins(root);
      }
    }
  } catch {
    /* RPC pas encore posé en prod : on masque simplement la section */
  }
}

function wireWins(root) {
  root.querySelectorAll("[data-remis]").forEach((b) =>
    b.addEventListener("click", async () => {
      const code = b.dataset.remis;
      b.disabled = true;
      b.textContent = "…";
      try {
        const { data, error } = await sb.rpc("mark_lot_win_remis", {
          p_claim_code: code,
        });
        if (error || !data?.ok) throw new Error("fail");
        haptic("success");
        b.outerHTML = `<span class="mrw-wins-done">✓ Remis</span>`;
        toast("Lot marqué remis", "success", 1800);
      } catch {
        b.disabled = false;
        b.textContent = "Remis";
        toast("Réessaie dans un instant", "error", 2200);
      }
    }),
  );
}
