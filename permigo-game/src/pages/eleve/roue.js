// ═══════════════════════════════════════════════════════════════
// Élève — La Roue de la chance (tour gratuit du jour)
// Le tirage ET le crédit des volants se font CÔTÉ SERVEUR via le RPC
// spin_roue_daily() (1 tour/jour garanti, impossible à tricher).
// Repli « aperçu » propre tant que la migration n'est pas posée en prod
// (le RPC renvoie alors une erreur « fonction inconnue »).
// Les gros lots réels (disque A, heure offerte) + le gacha cosmétique
// restent en teaser : ils attendent la config moniteur.
// DA « Arène » nuit-violet + or.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { isSoloEleve } from "@/utils/league-bots.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { toast } from "@/components/common/toast.js";
import {
  isSoundEnabled,
  playClick,
  playTick,
  playCoin,
  playReward,
} from "@/utils/sound.js";
import { medallion, medLot } from "@/utils/medallions.js";

const SPIN_MS = 5200; // = durée de la transition CSS du disque

const LS_FREE = "pg-roue-free-last"; // repli aperçu : YYYY-MM-DD du dernier tour

// Drapeau posé par first-quiz-reward.js : l'élève arrive ici depuis le tour
// offert de son 1er quiz réussi → on pitche l'install PILE après le gain
// (meilleur moment de valeur). Appelé une fois, après le résultat du tour.
function maybeInstallAfterSpin() {
  let flagged = false;
  try {
    flagged = sessionStorage.getItem("pg-install-after-roue") === "1";
    if (flagged) sessionStorage.removeItem("pg-install-after-roue");
  } catch {
    return;
  }
  if (!flagged) return;
  import("@/components/common/install-nudge.js")
    .then((m) =>
      m.promptInstallAtValueMoment(getCurUser(), "eleve_first_quiz_roue"),
    )
    .catch(() => {});
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 8 segments = paliers de volants (alignés sur la distribution serveur).
// L'ordre suit le disque (0 = premier segment sous le pointeur haut).
const SEGMENTS = [20, 50, 10, 30, 100, 10, 20, 30];

// Renvoie l'index d'un segment portant ce montant (aléatoire si plusieurs).
function segmentFor(amount) {
  const idx = SEGMENTS.map((v, i) => (v === amount ? i : -1)).filter(
    (i) => i >= 0,
  );
  if (!idx.length) return 0;
  return idx[Math.floor(Math.random() * idx.length)];
}

const STYLE = `<style>
.roue {
  --pnl: #241644; --pnl2: #2b1b54; --line: rgba(167,139,250,.20);
  --mu: #c3b8e8; --mu2: #9488bf; --gold: #ffd24a; --gold-s: #ffe9a8;
  position: relative;
  margin-top: calc(-1 * (var(--th, 52px) + env(safe-area-inset-top, 0px)));
  padding: calc(var(--th, 52px) + env(safe-area-inset-top, 0px) + 8px) 16px 96px;
  min-height: 100dvh; max-width: 480px; margin-inline: auto;
  color: #fff; font-family: 'Nunito', system-ui, sans-serif; overflow: hidden;
  background:
    radial-gradient(120% 55% at 20% -6%, rgba(168,85,247,.42) 0%, transparent 54%),
    radial-gradient(110% 45% at 96% 4%, rgba(255,156,28,.16) 0%, transparent 50%),
    linear-gradient(180deg, #1d1138 0%, #150d2b 46%, #100a22 100%);
}
.roue-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.roue-back {
  width: 40px; height: 40px; flex: none; border-radius: 13px;
  border: 1px solid var(--line); background: rgba(255,255,255,.06);
  color: #fff; display: grid; place-items: center; cursor: pointer;
}
.roue-back svg { width: 20px; height: 20px; }
.roue-title { font: 800 20px/1 'Baloo 2', cursive; text-shadow: 0 0 18px rgba(168,85,247,.4); }

.roue-hero { text-align: center; padding: 8px 8px 2px; }
.roue-kicker {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 999px; margin-bottom: 8px;
  background: rgba(255,210,74,.16); border: 1px solid rgba(255,210,74,.4);
  font: 600 10px/1 'Fredoka', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: var(--gold-s);
}
.roue-h1 {
  font: 800 25px/1.05 'Baloo 2', cursive;
  background: linear-gradient(180deg, #fff 0%, #fff7e0 55%, #ffd86b 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.roue-sub { margin-top: 5px; font: 700 12.5px/1.5 'Nunito', sans-serif; color: var(--mu); }

.roue-zone { position: relative; margin: 14px auto 4px; width: 290px; height: 290px; }
.roue-zone::before {
  content: ""; position: absolute; left: 50%; top: 50%; width: 330px; height: 330px;
  transform: translate(-50%,-50%);
  background: radial-gradient(closest-side, rgba(255,210,74,.28) 0%, rgba(168,85,247,.16) 45%, transparent 72%);
  filter: blur(8px); pointer-events: none;
}
.roue-rim {
  position: absolute; inset: 0; border-radius: 50%; padding: 10px;
  background: conic-gradient(from 0deg, #ffe9a8, #f0a818 18%, #ffd24a 35%, #c87d12 52%, #ffe9a8 70%, #f0a818 86%, #ffe9a8 100%);
  box-shadow: 0 18px 40px -10px rgba(0,0,0,.7), 0 0 34px -4px rgba(255,180,40,.5),
    inset 0 2px 4px rgba(255,255,255,.55), inset 0 -3px 6px rgba(122,74,5,.6);
}
.roue-disc {
  position: absolute; inset: 10px; border-radius: 50%; overflow: hidden;
  transform: rotate(0deg); transition: transform 5.2s cubic-bezier(.16,.84,.28,1);
  box-shadow: inset 0 0 0 3px rgba(10,7,24,.85), inset 0 4px 18px rgba(0,0,0,.6);
  background: conic-gradient(
    #9a6bff 0deg 45deg, #54a0ff 45deg 90deg, #6fe016 90deg 135deg, #ffb347 135deg 180deg,
    #ffd24a 180deg 225deg, #6fe016 225deg 270deg, #9a6bff 270deg 315deg, #ffb347 315deg 360deg);
}
.roue-disc::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  background: repeating-conic-gradient(from 0deg, transparent 0deg 44.4deg, rgba(10,7,24,.8) 44.4deg 45deg);
}
.roue-seg { position: absolute; left: 50%; top: 50%; width: 0; height: 0; transform: translate(-50%,-50%) rotate(var(--a)); }
.roue-seg > span {
  position: absolute; left: 50%; top: -98px; transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: 2px; white-space: nowrap;
  font: 800 15px/1 'Baloo 2', cursive; color: #1a1030; text-shadow: 0 1px 0 rgba(255,255,255,.35);
}
.roue-seg .rcoin {
  width: 14px; height: 14px; border-radius: 50%;
  background: radial-gradient(circle at 36% 30%, #fff7da, #ffd24a 60%, #ff9c1c);
  border: 1px solid #fff5cf; box-shadow: 0 1px 0 #c87d12;
}
.roue-hub {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 4;
  width: 66px; height: 66px; border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #fff7da 0%, var(--gold-s) 22%, var(--gold) 55%, #ff9c1c 100%);
  border: 3px solid #fff7df; display: grid; place-items: center; color: #6a4506;
  box-shadow: 0 6px 0 #c87d12, 0 12px 22px -6px rgba(0,0,0,.6);
}
.roue-hub svg { width: 30px; height: 30px; }
.roue-ptr {
  position: absolute; left: 50%; top: -12px; transform: translateX(-50%); z-index: 6;
  width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent;
  border-top: 24px solid var(--gold);
  filter: drop-shadow(0 3px 5px rgba(0,0,0,.6)) drop-shadow(0 0 8px rgba(255,180,40,.7));
}

.roue-cta {
  display: block; width: 100%; max-width: 330px; margin: 16px auto 0; min-height: 60px;
  border: 0; border-radius: 18px; cursor: pointer;
  font: 800 17px/1 'Baloo 2', cursive; color: #fff; text-shadow: 0 2px 0 rgba(40,90,5,.55);
  background: linear-gradient(180deg, var(--a-lt), var(--a));
  box-shadow: inset 0 1.5px 0 rgba(255,255,255,.5), 0 6px 0 var(--adk), 0 12px 24px -6px color-mix(in srgb, var(--a) 70%, transparent);
  transition: transform .1s, filter .15s;
}
.roue-cta:active { transform: translateY(3px); box-shadow: inset 0 1.5px 0 rgba(255,255,255,.5), 0 3px 0 var(--adk); }
.roue-cta:disabled { filter: grayscale(.5) brightness(.8); cursor: default; }
.roue-free { text-align: center; margin-top: 10px; font: 600 12px/1.4 'Fredoka', sans-serif; color: var(--mu); }

.roue-result {
  margin: 14px auto 0; max-width: 360px; text-align: center;
  padding: 14px 16px; border-radius: 18px;
  background: linear-gradient(180deg, var(--pnl), var(--pnl2)); border: 1px solid var(--line);
  animation: rouepop .35s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes rouepop { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
.roue-result-v { font: 800 26px/1 'Baloo 2', cursive; color: var(--gold-s); display: inline-flex; align-items: center; gap: 7px; }
.roue-result-v .rcoin2 { width: 24px; height: 24px; border-radius: 50%; background: radial-gradient(circle at 36% 30%, #fff7da, #ffd24a 60%, #ff9c1c); border: 1.5px solid #fff5cf; box-shadow: 0 2px 0 #c87d12; }
.roue-result-s { font: 700 12px/1.5 'Nunito', sans-serif; color: var(--mu2); margin-top: 5px; }

.roue-real {
  margin: 20px auto 0; max-width: 400px; border-radius: 20px; padding: 16px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--a) 10%, transparent), color-mix(in srgb, var(--a) 3%, transparent)),
    linear-gradient(180deg, var(--pnl), var(--pnl2));
  border: 1px solid color-mix(in srgb, var(--a) 38%, transparent);
  box-shadow: 0 16px 30px -18px rgba(0,0,0,.8), 0 0 26px -10px color-mix(in srgb, var(--a) 35%, transparent);
}
.roue-real-h { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.roue-real-h h2 { font: 700 15px/1.1 'Baloo 2', cursive; display: flex; align-items: center; gap: 7px; }
.roue-real-h .tag { flex: none; font: 600 9.5px/1 'Fredoka', sans-serif; letter-spacing: .08em; text-transform: uppercase; color: var(--a-lt); padding: 4px 9px; border-radius: 999px; background: color-mix(in srgb, var(--a) 14%, transparent); border: 1px solid color-mix(in srgb, var(--a) 35%, transparent); }
.roue-real-row { display: flex; align-items: center; gap: 11px; padding: 10px 2px; border-bottom: 1px solid color-mix(in srgb, var(--a) 12%, transparent); }
.roue-real-row:last-of-type { border-bottom: 0; }
.roue-real-ic { width: 38px; height: 38px; flex: none; display: grid; place-items: center; }
.roue-real-ic svg { filter: drop-shadow(0 3px 5px rgba(0,0,0,.4)); }
.roue-real-name { font: 700 13.5px/1.15 'Baloo 2', cursive; color: #e9ffd2; }
.roue-real-sub { font: 700 11px/1.3 'Nunito', sans-serif; color: var(--mu2); margin-top: 1px; }
.roue-real-flex { flex: 1; min-width: 0; }
.roue-real-sign { margin-top: 10px; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: rgba(10,7,24,.35); border: 1px dashed color-mix(in srgb, var(--a) 35%, transparent); }
.roue-real-av { width: 32px; height: 32px; flex: none; border-radius: 50%; display: grid; place-items: center; font: 800 15px/1 'Baloo 2', cursive; color: #fff; background: linear-gradient(160deg, var(--a-lt), var(--a)); border: 2px solid rgba(255,255,255,.5); }
.roue-real-sign b { display: block; font: 700 12.5px/1.2 'Baloo 2', cursive; color: #e9ffd2; }
.roue-real-sign span { font: 700 10.5px/1.3 'Nunito', sans-serif; color: var(--mu2); }

.roue-note { margin: 14px auto 0; max-width: 400px; display: flex; align-items: flex-start; gap: 9px; padding: 12px 14px; border-radius: 16px; background: rgba(124,77,255,.10); border: 1px solid rgba(167,139,250,.22); }
.roue-note svg { width: 16px; height: 16px; flex: none; color: #c9b8ff; margin-top: 1px; }
.roue-note p { font: 700 11.5px/1.5 'Nunito', sans-serif; color: var(--mu); }
.roue-note b { color: #c9b8ff; }

/* Célébration GROS LOT (au lieu du résultat volants) */
.roue-gros { background: linear-gradient(180deg, #2a1a08, #3a2408); border-color: rgba(255,210,74,.55);
  box-shadow: 0 0 34px -6px rgba(255,180,40,.5), inset 0 1px 0 rgba(255,255,255,.12); }
.roue-gros-badge { display: inline-block; font: 800 12px/1 'Baloo 2', cursive; letter-spacing: .1em;
  color: #3a2408; background: linear-gradient(180deg, #ffe9a8, #ffd24a); padding: 6px 14px; border-radius: 999px;
  box-shadow: 0 4px 0 #c87d12; }
.roue-gros-lot { margin: 12px 0 4px; display: flex; align-items: center; justify-content: center; gap: 10px; }
.roue-gros-lot .roue-gros-ic { font-size: 30px; }
.roue-gros-lot b { font: 800 20px/1.1 'Baloo 2', cursive; color: var(--gold-s); }
.roue-gros-code { margin-top: 8px; font: 700 13px/1.3 'Nunito', sans-serif; color: #fff; }
.roue-gros-code b { font: 800 20px/1 'Baloo 2', cursive; letter-spacing: .12em; color: var(--gold);
  display: inline-block; margin-top: 3px; padding: 5px 12px; border-radius: 12px;
  background: rgba(255,210,74,.14); border: 1px dashed rgba(255,210,74,.55); }

/* Mes lots gagnés (le code reste retrouvable après coup) */
.roue-wins { margin: 16px auto 0; max-width: 400px; border-radius: 18px; padding: 14px 16px;
  background: linear-gradient(180deg, var(--pnl), var(--pnl2)); border: 1px solid rgba(255,210,74,.4); }
.roue-wins h3 { font: 700 14px/1.1 'Baloo 2', cursive; display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
.roue-wins-row { display: flex; align-items: center; gap: 11px; padding: 9px 0; border-bottom: 1px solid rgba(167,139,250,.14); }
.roue-wins-row:last-child { border-bottom: 0; }
.roue-wins-ic { width: 34px; height: 34px; flex: none; border-radius: 11px; display: grid; place-items: center; font-size: 18px; background: rgba(255,210,74,.12); border: 1px solid rgba(255,210,74,.3); }
.roue-wins-tx { flex: 1; min-width: 0; }
.roue-wins-tx b { display: block; font: 700 13px/1.2 'Baloo 2', cursive; color: #fff; }
.roue-wins-tx span { font: 700 11px/1.3 'Nunito', sans-serif; color: var(--mu2); }
.roue-wins-code { flex: none; font: 800 13px/1 'Baloo 2', cursive; letter-spacing: .08em; color: var(--gold);
  padding: 6px 10px; border-radius: 10px; background: rgba(255,210,74,.12); border: 1px dashed rgba(255,210,74,.45); }
.roue-wins-code.remis { color: var(--mu2); border-style: solid; border-color: rgba(167,139,250,.3); }

.roue-real-big { flex: none; font: 700 9px/1 'Fredoka', sans-serif; letter-spacing: .06em; text-transform: uppercase;
  color: #3a2408; background: linear-gradient(180deg, #ffe9a8, #ffd24a); padding: 3px 7px; border-radius: 999px; }
@media (prefers-reduced-motion: reduce) { .roue-disc { transition: transform 1.2s ease-out; } .roue-result { animation: none; } }
</style>`;

function segLabel(v) {
  return `<span><span class="rcoin" aria-hidden="true"></span>${v}</span>`;
}

// Panneau « gros lots réels » : les lots ACTIVÉS par le moniteur (via
// get_moniteur_rewards) — sinon les 2 lots par défaut. Signé à sa marque.
// Les lots marqués « gros lot » (big) sont réellement gagnables à la roue.
function renderRealLots(lots, moniteurPrenom) {
  const name = (moniteurPrenom || "ton moniteur").trim();
  const initiale = (name.charAt(0) || "R").toUpperCase();
  const list =
    Array.isArray(lots) && lots.length
      ? lots
      : [
          { icon: "🅰️", label: "Disque A jeune conducteur" },
          { icon: "🚗", label: "1 heure de conduite offerte" },
        ];
  const anyBig = list.some((l) => l && l.big);
  const rows = list
    .slice(0, 6)
    .map(
      (l) => `
    <div class="roue-real-row">
      <div class="roue-real-ic">${medLot(l.icon, { size: 34 })}</div>
      <div class="roue-real-flex">
        <div class="roue-real-name">${esc(l.label || "Cadeau")}</div>
      </div>
      ${l && l.big ? `<span class="roue-real-big">À gagner</span>` : ""}
    </div>`,
    )
    .join("");
  return `
  <section class="roue-real">
    <div class="roue-real-h">
      <h2>${medallion("cadeau", "pink", { size: 20 })} Vrais cadeaux</h2>
      <span class="tag">${anyBig ? "En jeu" : "Bientôt"}</span>
    </div>
    ${rows}
    <div class="roue-real-sign">
      <div class="roue-real-av">${esc(initiale)}</div>
      <div>
        <b>Offert par ${esc(name)} · ton moniteur</b>
        <span>${anyBig ? "Tente ta chance chaque jour. C’est lui qui offre." : "C’est lui qui choisit les cadeaux."}</span>
      </div>
    </div>
  </section>`;
}

// « Mes lots gagnés » : garde le code de retrait à portée après coup.
function renderMyWins(wins) {
  if (!Array.isArray(wins) || !wins.length) return "";
  const rows = wins
    .slice(0, 5)
    .map((w) => {
      const remis = w.status === "remis";
      return `
    <div class="roue-wins-row">
      <div class="roue-wins-ic">${esc(w.lot_icon || "🎁")}</div>
      <div class="roue-wins-tx">
        <b>${esc(w.lot_label || "Cadeau")}</b>
        <span>${remis ? "Récupéré ✓" : "Montre ce code à ton moniteur"}</span>
      </div>
      <span class="roue-wins-code${remis ? " remis" : ""}">${esc(w.claim_code || "")}</span>
    </div>`;
    })
    .join("");
  return `
  <section class="roue-wins">
    <h3>🏆 Tes lots gagnés</h3>
    ${rows}
  </section>`;
}

export async function mount(root) {
  const me = getCurUser();
  // Élève solo : pas de moniteur → pas de « vrais cadeaux » (c'est lui qui
  // les offre) ; textes neutralisés, panneau + note masqués.
  const solo = isSoloEleve(me);
  if (!me) return;
  track("page_view", { page: "eleve_roue" });

  const prenom =
    (me.prenom || me.nom || "ton moniteur").trim().split(/\s+/)[0] || "R";
  const initiale = prenom.charAt(0).toUpperCase() || "R";

  // État initial : le RPC est-il posé (migration en prod) ? A-t-on déjà tourné ?
  // - 'ready'   : peut tourner pour de vrai (RPC live, pas encore tourné aujourd'hui)
  // - 'done'    : déjà tourné aujourd'hui (RPC live)
  // - 'apercu'  : migration pas encore posée → repli visuel (gate localStorage)
  // En parallèle : l'état du tour du jour + les lots configurés par le moniteur.
  let mode = "apercu";
  let realLots = null;
  let moniteurName = null;
  let myWins = [];
  const [spinRes, rewardsRes, winsRes] = await Promise.allSettled([
    sb
      .from("roue_daily_spins")
      .select("volants")
      .eq("spin_date", todayKey())
      .maybeSingle(),
    sb.rpc("get_moniteur_rewards"),
    sb
      .from("gros_lot_wins")
      .select("lot_label, lot_icon, claim_code, status, won_at")
      .order("won_at", { ascending: false })
      .limit(5),
  ]);
  if (spinRes.status === "fulfilled" && !spinRes.value.error) {
    mode = spinRes.value.data ? "done" : "ready";
  }
  if (rewardsRes.status === "fulfilled" && !rewardsRes.value.error) {
    const d = rewardsRes.value.data;
    if (Array.isArray(d?.lots)) realLots = d.lots;
    moniteurName = d?.moniteur || null;
  }
  if (winsRes.status === "fulfilled" && !winsRes.value.error) {
    myWins = Array.isArray(winsRes.value.data) ? winsRes.value.data : [];
  }
  if (mode === "apercu" && localStorage.getItem(LS_FREE) === todayKey()) {
    mode = "done";
  }

  const disabled = mode === "done";
  const ctaLabel = disabled ? "Reviens demain" : "Tour gratuit du jour";
  const freeLabel = disabled
    ? "Ton tour du jour est déjà passé."
    : "1 tour offert par jour · de vrais volants.";
  const kicker =
    mode === "apercu" ? "Aperçu · bientôt jouable" : "Tour gratuit du jour";

  root.innerHTML = `${STYLE}
<div class="roue">
  <div class="roue-top">
    <button class="roue-back" id="roue-back" aria-label="Retour">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <div class="roue-title">La Roue</div>
  </div>

  <div class="roue-hero">
    <div class="roue-kicker">${esc(kicker)}</div>
    <div class="roue-h1">Roue de la chance</div>
    <div class="roue-sub">${solo ? "Gagne des volants chaque jour. Bientôt des skins à débloquer." : "Gagne des volants chaque jour. Bientôt des skins et de vrais cadeaux de ton moniteur."}</div>
  </div>

  <div class="roue-zone">
    <div class="roue-ptr" aria-hidden="true"></div>
    <div class="roue-rim">
      <div class="roue-disc" id="roue-disc">
        ${SEGMENTS.map((v, i) => `<div class="roue-seg" style="--a:${22.5 + i * 45}deg">${segLabel(v)}</div>`).join("")}
      </div>
    </div>
    <div class="roue-hub" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="#fff"><path d="M32 13a18 18 0 0 0-18 18h10.5a7.5 7.5 0 0 1 15 0H50A18 18 0 0 0 32 13z M14.4 35a18 18 0 0 0 13.1 13.6c.3-4.6-1.3-9.3-4.5-11.7-2.4-1.9-5.5-2.5-8.6-1.9z M49.6 35c-3.1-.6-6.2 0-8.6 1.9-3.2 2.4-4.8 7.1-4.5 11.7A18 18 0 0 0 49.6 35z"/><circle cx="32" cy="31" r="3.8"/></svg>
    </div>
  </div>

  <button class="roue-cta" id="roue-spin" ${disabled ? "disabled" : ""}>${ctaLabel}</button>
  <div class="roue-free" id="roue-free">${freeLabel}</div>

  <div id="roue-result-slot"></div>

  ${solo ? "" : renderRealLots(realLots, moniteurName)}

  ${renderMyWins(myWins)}

  <div class="roue-note">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
    <p>${solo ? "Les volants se gagnent en jouant, <b>jamais</b> avec de l’argent." : `Un <b>gros lot</b> peut tomber (rare !) si ton moniteur en a mis en jeu. Tu le récupères en vrai avec ton code. Les volants se gagnent en jouant, <b>jamais</b> avec de l’argent.`}</p>
  </div>
</div>`;

  root
    .querySelector("#roue-back")
    ?.addEventListener("click", () => navigate("/boutique"));

  const disc = root.querySelector("#roue-disc");
  const btn = root.querySelector("#roue-spin");
  const free = root.querySelector("#roue-free");
  let turns = 0;
  let prevRot = 0;
  let busy = false;
  const _tickTimers = [];
  // Si on quitte la page en plein spin, on coupe les tics programmés.
  window.addEventListener(
    "hashchange",
    () => {
      _tickTimers.forEach(clearTimeout);
      _tickTimers.length = 0;
    },
    { once: true },
  );

  // Ratchet de roulette : un « tic » chaque fois qu'une frontière de segment
  // (45°) passe sous le pointeur, avec un ralenti calqué sur l'easing du disque
  // (fort ease-out) → tic-tic-tic rapide au départ … tic … tic à la fin.
  function scheduleSpinSound(deltaDeg) {
    if (!isSoundEnabled()) return;
    const crossings = Math.max(1, Math.floor(deltaDeg / 45));
    const N = 240;
    let last = 0;
    let lastMs = -100;
    for (let i = 1; i <= N; i++) {
      const t = i / N;
      const prog = 1 - Math.pow(1 - t, 4); // ease-out quart ≈ courbe du disque
      const b = Math.floor(prog * crossings);
      if (b > last) {
        last = b;
        const ms = t * SPIN_MS;
        if (ms - lastMs >= 55) {
          // évite un débit d'audio ingérable
          lastMs = ms;
          _tickTimers.push(setTimeout(playTick, ms));
        }
      }
    }
  }

  function spinTo(segIdx) {
    turns += 5;
    const target = 360 * turns + (360 - (segIdx * 45 + 22.5));
    disc.style.transform = `rotate(${target}deg)`;
    scheduleSpinSound(target - prevRot);
    prevRot = target;
  }

  function showResult(volants, apercu) {
    // Ding de fin : plus « précieux » pour un gros gain.
    if (volants >= 50) playReward();
    else playCoin();
    const slot = root.querySelector("#roue-result-slot");
    if (!slot) return;
    slot.innerHTML = `
    <div class="roue-result">
      <div class="roue-result-v"><span class="rcoin2" aria-hidden="true"></span>+${volants}</div>
      <div class="roue-result-s">${
        apercu
          ? "Aperçu. Tes volants seront crédités à l’ouverture de la roue."
          : "volants ajoutés à ton solde !"
      }</div>
    </div>`;
  }

  function showGrosLot(gl) {
    playReward();
    haptic("success");
    const slot = root.querySelector("#roue-result-slot");
    if (!slot) return;
    slot.innerHTML = `
    <div class="roue-result roue-gros">
      <div class="roue-gros-badge">🎁 GROS LOT !</div>
      <div class="roue-gros-lot"><span class="roue-gros-ic" aria-hidden="true">${esc(gl.icon || "🎁")}</span><b>${esc(gl.label || "Cadeau")}</b></div>
      <div class="roue-gros-code">Ton code de retrait<br><b>${esc(gl.claim_code || "")}</b></div>
      <div class="roue-result-s">Montre ce code à <b>${esc(gl.moniteur || "ton moniteur")}</b> pour récupérer ton lot. C’est lui qui offre.</div>
    </div>`;
  }

  function finishDone() {
    btn.textContent = "Reviens demain";
    btn.disabled = true;
    if (free) free.textContent = "Ton tour du jour est déjà passé.";
    busy = false;
  }

  btn?.addEventListener("click", async () => {
    if (busy || btn.disabled) return;
    busy = true;
    haptic("select");
    playClick(); // son au clic du bouton
    btn.disabled = true;
    btn.textContent = "La roue tourne…";

    if (mode === "apercu") {
      // Repli visuel : la migration n'est pas posée → aucun crédit réel.
      track("roue.spin", { kind: "apercu" });
      const seg = Math.floor(Math.random() * SEGMENTS.length);
      spinTo(seg);
      setTimeout(() => {
        try {
          localStorage.setItem(LS_FREE, todayKey());
        } catch {
          /* noop */
        }
        showResult(SEGMENTS[seg], true);
        finishDone();
        maybeInstallAfterSpin();
      }, 5300);
      return;
    }

    // Mode réel : le serveur tire ET crédite.
    track("roue.spin", { kind: "free" });
    let res = null;
    try {
      const { data, error } = await sb.rpc("spin_roue_daily");
      if (error) throw error;
      res = data;
    } catch (e) {
      // RPC absent (migration retirée entre-temps) ou réseau → repli doux
      console.warn("[roue] spin_roue_daily failed", e?.message);
      toast("Réessaie dans un instant.", "error", 2200);
      btn.disabled = false;
      btn.textContent = "Tour gratuit du jour";
      busy = false;
      return;
    }

    if (res?.already) {
      spinTo(0);
      setTimeout(finishDone, 900);
      return;
    }

    // Gros lot ! (le serveur a tiré un vrai lot du moniteur)
    if (res?.gros_lot) {
      track("roue.gros_lot_win");
      spinTo(Math.floor(Math.random() * SEGMENTS.length));
      setTimeout(() => {
        showGrosLot(res.gros_lot);
        finishDone();
        maybeInstallAfterSpin();
      }, 5300);
      return;
    }

    const volants = res?.volants ?? 10;
    spinTo(segmentFor(volants));
    setTimeout(() => {
      showResult(volants, false);
      // Met à jour le solde du header (event écouté dans header-top.js)
      if (typeof res?.new_balance === "number") {
        window.dispatchEvent(
          new CustomEvent("pg-gemmes-changed", {
            detail: { balance: res.new_balance },
          }),
        );
      }
      haptic("tap");
      finishDone();
      maybeInstallAfterSpin();
    }, 5300);
  });
}
