// ═══════════════════════════════════════════════════════════════
// Enseignant — Mon blason (chantier nav simplifiée)
// Fusionne Progression (parcours-pro.js, retiré) + aperçu Trophées +
// aperçu Ligue de la semaine (toggle National/Mon école inline) : LA page
// statut/fierté du moniteur — « preuve & autorité » à sa marque.
//
// Source de données :
//   - Palier      : validations WHERE validated_by = me.id (count) → getMoniteurState
//   - Trophées    : trophy-sheet.js (source unique des 12 jalons, partagée
//                   avec la sous-page #/trophees-moniteur inchangée)
//   - Parcours    : moniteur-levels.js (source unique des 10 paliers, partagée
//                   avec la sous-page #/parcours-complet inchangée)
//   - Preuve chiffrée (taux de réussite / permis / élèves en formation) :
//                   examens WHERE eleve_id IN (mes élèves), même règle que
//                   insights.js bloc 5 (dernier statut par élève, fenêtre 12
//                   mois, seuil 3 résultats saisis avant d'afficher un %).
//
// Anciennes routes conservées comme sous-pages À PART ENTIÈRE (pas des
// alias) : #/trophees-moniteur (grille complète 12 jalons) et #/ligue-semaine
// (classement complet, jusqu'à 50 rangs) — cohérent avec nav-bottom.js qui
// les traite déjà comme des satellites du même onglet (`match`), pas des
// routes fusionnées. Seule l'ancienne route hub #/parcours (parcours-pro.js,
// retiré) devient un alias vers cette page (router.js).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { getMoniteurState, MONITEUR_TIERS } from "@/data/moniteur-levels.js";
import {
  badgeSrc,
  computeTrophees,
  openTrophySheet,
} from "@/components/enseignant/trophy-sheet.js";
import { openPalierSheet } from "@/components/common/palier-sheet.js";
import { medallion } from "@/utils/medallions.js";

// ─── Pastille « nouveau » trophée (non-vu) ────────────────────────
const TROPH_SEEN_KEY = "pg-troph-moniteur-seen";
function _readSeenTrophies() {
  try {
    return new Set(JSON.parse(localStorage.getItem(TROPH_SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function _markTrophiesSeen(ids) {
  try {
    const cur = _readSeenTrophies();
    ids.forEach((id) => cur.add(id));
    localStorage.setItem(TROPH_SEEN_KEY, JSON.stringify([...cur]));
  } catch {
    /* localStorage indispo — pas de pastille persistée, tant pis */
  }
}

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.mb {
  max-width: 480px; margin: 0 auto;
  padding: 0 0 calc(96px + env(safe-area-inset-bottom, 0px));
  background: var(--bg); color: var(--ink);
  font-family: var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  min-height: 100dvh;
}

/* ── En-tête : titre + Partager ── */
.mb-hd {
  padding: 14px 20px 0;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
}
.mb-hd-kick {
  font: 700 10px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  letter-spacing: .13em; text-transform: uppercase; color: var(--mu3);
}
.mb-hd-title {
  font: 700 24px/1.15 var(--ens-display, 'Fredoka'), sans-serif;
  color: var(--ink); letter-spacing: -.01em; margin-top: 4px;
}
.mb-share {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 14px; min-height: 44px; border-radius: var(--ens-r-pill, 999px);
  border: 0; cursor: pointer; margin-top: 3px; flex-shrink: 0;
  background: linear-gradient(180deg, #ffe6a8, #f0b23a);
  color: #5a3a08;
  font: 700 12px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  box-shadow: 0 3px 0 0 #a86408;
  transition: transform .1s ease, box-shadow .1s ease;
  -webkit-tap-highlight-color: transparent;
}
.mb-share:active { transform: translateY(2px); box-shadow: 0 1px 0 0 #a86408; }
.mb-share:focus-visible { outline: 3px solid #4f46e5; outline-offset: 2px; }

/* ── Hero écusson ── */
.mb-hero {
  position: relative; margin: 14px 16px 0; border-radius: 24px;
  padding: 18px 16px 20px; color: #fff; overflow: hidden; isolation: isolate;
  background: linear-gradient(150deg, #4f46e5, #6d6bff 58%, #8b5cf6);
  box-shadow: 0 16px 40px -14px rgba(79,70,229,.58);
  animation: mbHeroIn .45s cubic-bezier(.22,.68,0,1.2) both;
}
.mb-hero-halo {
  position: absolute; left: -34px; top: -40px; width: 210px; height: 210px;
  border-radius: 50%; background: radial-gradient(circle, rgba(255,210,122,.5), transparent 64%);
  filter: blur(6px); z-index: 0; pointer-events: none;
}
.mb-hero-top { position: relative; z-index: 2; display: flex; align-items: center; gap: 15px; }
.mb-hero-shield { flex: none; filter: drop-shadow(0 12px 18px rgba(26,16,80,.45)); }
.mb-hero-id { flex: 1; min-width: 0; }
.mb-hero-surt {
  font: 800 9.5px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  letter-spacing: .13em; text-transform: uppercase; color: #b6b4f0; margin-bottom: 6px;
}
.mb-hero-nom {
  font: 700 21px/1.1 var(--ens-display, 'Fredoka'), sans-serif;
  letter-spacing: -.01em; color: #fff;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mb-hero-marque {
  font: 700 11.5px/1.35 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  color: #d9d8ff; margin-top: 3px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mb-hero-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.mb-hchip {
  display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px;
  border-radius: 999px; font: 800 10.5px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  white-space: nowrap; background: rgba(255,255,255,.13);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.22); color: #fff;
}
.mb-hchip--or {
  background: linear-gradient(180deg, #ffd27a, #e8a317); color: #5a3a08;
  box-shadow: 0 2px 7px -2px rgba(181,97,10,.6), inset 0 1px 0 rgba(255,255,255,.5);
}

/* ── Preuve chiffrée ── */
.mb-proof { position: relative; z-index: 2; display: flex; gap: 8px; margin-top: 15px; }
.mb-hp {
  flex: 1; padding: 10px 8px 9px; border-radius: 15px; text-align: center;
  background: rgba(255,255,255,.11); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2);
}
.mb-hp-val { font: 700 20px/1 var(--ens-display, 'Fredoka'), sans-serif; letter-spacing: -.01em; color: #fff; }
.mb-hp-val small { font: 700 11px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: #d9d8ff; }
.mb-hp-lbl {
  font: 800 8.5px/1.3 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  letter-spacing: .05em; text-transform: uppercase; color: #b6b4f0; margin-top: 5px;
}
.mb-hp--or {
  background: linear-gradient(170deg, rgba(255,210,122,.3), rgba(232,163,23,.2));
  box-shadow: inset 0 0 0 1.5px rgba(255,210,122,.55);
}
.mb-hp--or .mb-hp-val { color: #ffd27a; }
.mb-proof-note {
  position: relative; z-index: 2;
  font: 700 9.5px/1.4 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  color: #b6b4f0; margin-top: 8px; text-align: center;
}

/* ── Barre de progression vers le palier suivant ── */
.mb-hero-prog { position: relative; z-index: 2; margin-top: 13px; }
.mb-hero-bar { height: 8px; border-radius: 999px; background: rgba(255,255,255,.2); overflow: hidden; }
.mb-hero-fill { display: block; height: 100%; width: 0; border-radius: 999px; background: #fff; transition: width 1.1s cubic-bezier(.2,.7,.3,1); }
.mb-hero-hint { font: 700 10.5px/1.4 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: #e2e0ff; margin-top: 7px; }
.mb-hero-hint b { color: #ffd27a; }
.mb-max {
  display: flex; align-items: center; gap: 10px; margin-top: 12px;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22);
  border-radius: 12px; padding: 10px 14px; position: relative; z-index: 2;
}
.mb-max-txt { font: 700 12.5px/1.5 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: #fff; }

/* ── Section générique ── */
.mb-sec { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 22px 20px 10px; }
.mb-sec-t { font: 700 15px/1.15 var(--ens-display, 'Fredoka'), sans-serif; color: var(--ink); letter-spacing: -.01em; }
.mb-sec-t small { display: block; font: 700 10.5px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu2); margin-top: 4px; }
.mb-sec-lnk {
  font: 700 11.5px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: #4f46e5;
  background: none; border: 0; cursor: pointer; padding: 4px 0; min-height: 32px;
  display: inline-flex; align-items: center; gap: 3px; -webkit-tap-highlight-color: transparent;
}
.mb-sec-lnk:focus-visible { outline: 2px solid #4f46e5; border-radius: 4px; }


.mb-troph-row { display: flex; gap: 9px; overflow-x: auto; padding: 2px 20px 4px; scrollbar-width: none; }
.mb-troph-row::-webkit-scrollbar { display: none; }
.mb-tcell {
  width: 64px; height: 64px; flex: none; background: var(--su); border: 1px solid var(--bo);
  border-radius: 18px; display: grid; place-items: center; box-shadow: 0 6px 16px -10px rgba(60,50,130,.28);
  position: relative; overflow: visible; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: transform .14s cubic-bezier(.23,1,.32,1);
}
.mb-tcell:active { transform: scale(.93); }
.mb-tcell:focus-visible { outline: 3px solid #4f46e5; outline-offset: 2px; }
.mb-tcell img { width: 46px; height: 46px; object-fit: contain; display: block; filter: drop-shadow(0 3px 5px rgba(40,20,90,.22)); }
.mb-tcell.lock img { filter: grayscale(1) brightness(.82); opacity: .7; }
.mb-tcell.lock::after { content: ""; position: absolute; inset: 0; border-radius: 18px; background: rgba(245,247,252,.35); }
.mb-tcell.new-badge { border-color: #a78bff; box-shadow: 0 0 0 2px rgba(140,90,255,.32), 0 8px 18px -7px rgba(109,77,255,.48); }
.mb-tcell.new-badge::before {
  content: ""; position: absolute; top: -3px; right: -3px; width: 12px; height: 12px; border-radius: 50%;
  background: #ff4d6d; border: 2.5px solid var(--bg); z-index: 2;
}

/* ── Parcours : aperçu 3 paliers ── */
.mb-par-card { background: var(--su); border-radius: 18px; margin: 0 16px; padding: 14px 15px 12px; box-shadow: 0 8px 18px -8px rgba(60,50,160,.14), inset 0 0 0 1px var(--bo); }
.mb-stop { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; position: relative; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mb-stop:not(:last-child)::before { content: ""; position: absolute; left: 15px; top: 38px; bottom: -8px; width: 2px; background: var(--bo3); }
.mb-stop.done:not(:last-child)::before { background: var(--gr); }
.mb-stop:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; border-radius: 10px; }
.mb-stop-dot { width: 32px; flex: none; display: grid; place-items: center; position: relative; z-index: 1; margin-top: 1px; }
.mb-stop-body { flex: 1; min-width: 0; }
.mb-stop-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.mb-stop-lvl { font: 800 9.5px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; letter-spacing: .07em; text-transform: uppercase; color: var(--mu3); }
.mb-stop.now .mb-stop-lvl { color: #4f46e5; }
.mb-stop.done .mb-stop-lvl { color: var(--gr-txt); }
.mb-stop-cost { font: 800 10px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; padding: 4px 9px; border-radius: 999px; white-space: nowrap; flex: none; }
.mb-stop-cost.done { color: var(--gr-txt); background: var(--gr-bg, rgba(22,163,74,.14)); }
.mb-stop-cost.now { color: #fff; background: #4f46e5; }
.mb-stop-cost.todo { color: var(--mu3); background: var(--bg2); }
.mb-stop-t { font: 700 13.5px/1.25 var(--ens-display, 'Fredoka'), sans-serif; color: var(--ink); margin-top: 3px; }
.mb-stop.todo .mb-stop-t { color: var(--mu2); }
.mb-stop-s { font: 600 10.5px/1.4 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu2); margin-top: 2px; }

.mb-streak {
  display: flex; align-items: center; gap: 9px; margin: 10px 16px 0; padding: 11px 13px; border-radius: 15px;
  background: linear-gradient(155deg, #fff8ec, #fff3da); box-shadow: inset 0 0 0 1.5px rgba(217,119,6,.22);
}
.mb-streak-t { font: 700 11.5px/1.4 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: #3a3a5c; }
.mb-streak-t b { color: #b45309; }

/* ── Skeleton ── */
.mb-skel { border-radius: 18px; background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%); background-size: 200% 100%; animation: mbShim 1.4s ease-in-out infinite; }
@keyframes mbShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

#mb-retry {
  display: block; margin: 24px auto 0; padding: 14px 32px; min-height: 48px;
  background: #4f46e5; color: #fff; border: 0; border-radius: 14px;
  font: 700 14px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; cursor: pointer;
  box-shadow: 0 8px 20px -6px rgba(79,70,229,.5);
}

@keyframes mbHeroIn { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .mb-hero-fill, .mb-skel, .mb-hero { animation: none !important; transition: none !important; }
}
</style>`;

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== "enseignant") {
    root.innerHTML = `<p style="padding:32px;text-align:center;color:var(--mu)">Accès réservé aux moniteurs.</p>`;
    return;
  }

  track("page_view", { page: "mon_blason", role: me.role });

  root.innerHTML = `${STYLE}
    <div class="mb">
      <div class="mb-hd"><div><div class="mb-hd-kick">Statut &amp; réputation</div><div class="mb-hd-title">Mon blason</div></div></div>
      <div class="mb-skel" style="height:236px;margin:14px 16px 0"></div>
      <div class="mb-skel" style="height:150px;margin:22px 16px 0"></div>
      <div class="mb-skel" style="height:86px;margin:22px 16px 0"></div>
      <div class="mb-skel" style="height:140px;margin:22px 16px 0"></div>
    </div>`;

  let data;
  try {
    data = await _loadData(me);
  } catch (e) {
    console.error("[mon-blason]", e);
    root.innerHTML = `${STYLE}
      <div class="mb">
        <div class="mb-hd"><div><div class="mb-hd-kick">Statut &amp; réputation</div><div class="mb-hd-title">Mon blason</div></div></div>
        <div style="padding:48px 24px;text-align:center;color:var(--mu2)">
          <p style="font:700 16px/1.4 var(--ens-body,'Plus Jakarta Sans'),sans-serif;color:var(--ink)">« Mon blason » indisponible</p>
          <p style="font:600 14px/1.5 var(--ens-body,'Plus Jakarta Sans'),sans-serif;margin-top:6px">Vérifie ta connexion, puis réessaie.</p>
          <button id="mb-retry">Réessayer</button>
        </div>
      </div>`;
    root
      .querySelector("#mb-retry")
      ?.addEventListener("click", () => mount(root));
    return;
  }

  _render(root, me, data);
}

// ─── Data loading ────────────────────────────────────────────────
async function _loadData(me) {
  const since30d = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [valsRes, profileRes, elevesRes, activeRes, ecoleRes] =
    await Promise.all([
      sb
        .from("validations")
        .select("id", { count: "exact", head: true })
        .eq("validated_by", me.id),
      sb
        .from("profiles")
        .select("streak_pro_days")
        .eq("id", me.id)
        .maybeSingle(),
      sb
        .from("profiles")
        .select("id")
        .eq("enseignant_id", me.id)
        .eq("role", "eleve"),
      sb
        .from("validations")
        .select("eleve_id")
        .eq("validated_by", me.id)
        .gte("validated_at", since30d),
      me.auto_ecole_id
        ? sb
            .from("auto_ecoles")
            .select("nom, ville")
            .eq("id", me.auto_ecole_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const loadError =
    valsRes.error ||
    profileRes.error ||
    elevesRes.error ||
    activeRes.error ||
    ecoleRes.error;
  if (loadError) throw loadError;

  const eleveIds = (elevesRes.data || []).map((e) => e.id);
  const studentsTotal = eleveIds.length;

  // Examens de mes élèves — même règle que insights.js bloc 5 (dernier
  // statut par élève, fenêtre 12 mois, seuil 3 résultats saisis).
  let exams = [];
  if (eleveIds.length > 0) {
    const { data: examsRaw, error: examsErr } = await sb
      .from("examens")
      .select("eleve_id, statut, date_examen, created_at")
      .in("eleve_id", eleveIds)
      .order("created_at", { ascending: false });
    if (examsErr) console.error("[mon-blason] examens", examsErr);
    exams = examsRaw || [];
  }

  const lastExamByEleve = new Map();
  exams.forEach((x) => {
    if (!lastExamByEleve.has(x.eleve_id)) lastExamByEleve.set(x.eleve_id, x);
  });
  const recuSet = new Set(
    [...lastExamByEleve.values()]
      .filter((x) => x.statut === "recu")
      .map((x) => x.eleve_id),
  );
  const enFormation = Math.max(0, studentsTotal - recuSet.size);

  const ago12mois = Date.now() - 365 * 86400000;
  const recusEleves12m = new Set();
  let nbRates12m = 0;
  exams.forEach((x) => {
    if (x.statut !== "recu" && x.statut !== "rate") return;
    const ref = x.date_examen
      ? new Date(`${x.date_examen}T12:00:00`)
      : new Date(x.created_at);
    if (ref.getTime() < ago12mois) return;
    if (x.statut === "recu") recusEleves12m.add(x.eleve_id);
    else nbRates12m++;
  });
  const nbRecus12m = recusEleves12m.size;
  const nbResultats12m = nbRecus12m + nbRates12m;

  return {
    totalVals: valsRes.count ?? 0,
    streak: profileRes.data?.streak_pro_days ?? 0,
    studentsTotal,
    studentsActive: new Set(
      (activeRes.data || []).map((v) => v.eleve_id).filter(Boolean),
    ).size,
    enFormation,
    nbRecus12m,
    nbResultats12m,
    ecole: ecoleRes.data || null,
  };
}

// ─── Render ──────────────────────────────────────────────────────
function _render(root, me, d) {
  const state = getMoniteurState(d.totalVals);
  const troResults = computeTrophees(d);

  root.innerHTML = `${STYLE}
<div class="mb anim-slide-up">

  <div class="mb-hd">
    <div>
      <div class="mb-hd-kick">Statut &amp; réputation</div>
      <div class="mb-hd-title" tabindex="-1">Mon blason</div>
    </div>
    <button class="mb-share" id="mb-share" type="button" aria-label="Partager mon blason">
      ${icon("share", { size: 14, strokeWidth: 2.2 })} Partager
    </button>
  </div>

  ${_heroHtml(me, d, state)}

  <!-- Trophées -->
  <div class="mb-sec">
    <div class="mb-sec-t">Trophées <small>${troResults.filter((t) => t.unlocked).length} sur ${troResults.length}</small></div>
    <button class="mb-sec-lnk" id="mb-tro-link" aria-label="Voir tous les trophées">Tout voir ${icon("chevron-right", { size: 12, strokeWidth: 2.6 })}</button>
  </div>
  <div class="mb-troph-row" role="group" aria-label="Aperçu des trophées">
    ${_trophRow(troResults)}
  </div>

  <!-- Parcours -->
  ${_parcoursSectionHtml(state, d.totalVals)}

  ${_streakBannerHtml(d.streak)}

</div>`;

  // Animations différées (barre hero)
  requestAnimationFrame(() => {
    const fill = root.querySelector("#mb-hero-fill");
    if (fill)
      fill.style.width = `${Math.min(100, state.pctToNextReward ?? 0)}%`;
  });

  _wire(root, me, d, state, troResults);
}

// ─── Hero écusson ──────────────────────────────────────────────
function _heroHtml(me, d, state) {
  const palierNum = state.tier?.tier ?? 0;
  const palierTitre = state.tier?.title ?? "Premiers pas";
  const nomComplet = `${me.prenom || ""} ${me.nom || ""}`.trim() || "Moniteur";
  const ecoleNom = d.ecole?.nom || nomComplet;
  const marqueLine = d.ecole?.ville
    ? `${ecoleNom} · ${d.ecole.ville}`
    : ecoleNom;

  const taux =
    d.nbResultats12m >= 3
      ? Math.round((d.nbRecus12m / d.nbResultats12m) * 100)
      : null;

  const proofCards = [
    taux != null
      ? `<div class="mb-hp mb-hp--or"><div class="mb-hp-val">${taux}<small> %</small></div><div class="mb-hp-lbl">de réussite</div></div>`
      : "",
    `<div class="mb-hp"><div class="mb-hp-val">${d.nbRecus12m}</div><div class="mb-hp-lbl">permis obtenus</div></div>`,
    `<div class="mb-hp"><div class="mb-hp-val">${d.enFormation}</div><div class="mb-hp-lbl">élève${d.enFormation > 1 ? "s" : ""} en formation</div></div>`,
  ]
    .filter(Boolean)
    .join("");

  let proofNote = "";
  if (taux != null) {
    proofNote = `<div class="mb-proof-note">${d.nbRecus12m} reçu${d.nbRecus12m > 1 ? "s" : ""} sur ${d.nbResultats12m} · 12 derniers mois</div>`;
  } else if (d.nbResultats12m > 0) {
    const manque = 3 - d.nbResultats12m;
    proofNote = `<div class="mb-proof-note">Encore ${manque} résultat${manque > 1 ? "s" : ""} d'examen à saisir pour afficher ton taux</div>`;
  }

  return `
  <div class="mb-hero" aria-label="Ton blason de moniteur : palier ${palierNum} sur ${MONITEUR_TIERS.length}, ${escAttr(palierTitre)}">
    <div class="mb-hero-halo"></div>
    <div class="mb-hero-top">
      ${_shieldSvg(palierNum)}
      <div class="mb-hero-id">
        <div class="mb-hero-surt">Moniteur indépendant</div>
        <div class="mb-hero-nom">${esc(nomComplet)}</div>
        <div class="mb-hero-marque">${esc(marqueLine)}</div>
        <div class="mb-hero-chips">
          <span class="mb-hchip">${esc(palierTitre)}</span>
        </div>
      </div>
    </div>

    <div class="mb-proof">${proofCards}</div>
    ${proofNote}

    ${_progHtml(state)}
  </div>`;
}

// Écusson SVG inline (palier au centre) — indigo + or, DA moniteur unifiée.
function _shieldSvg(palierNum) {
  return `<svg class="mb-hero-shield" viewBox="0 0 128 148" width="96" aria-hidden="true">
    <defs>
      <linearGradient id="mbShGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe6a8"/><stop offset=".45" stop-color="#f0b23a"/><stop offset="1" stop-color="#a86408"/>
      </linearGradient>
      <linearGradient id="mbShBody" x1="0" y1="0" x2=".9" y2="1">
        <stop offset="0" stop-color="#7c79ff"/><stop offset=".55" stop-color="#4f46e5"/><stop offset="1" stop-color="#2a2399"/>
      </linearGradient>
      <linearGradient id="mbShGloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M64 4 116 18v48c0 34-22 56-52 74C34 122 12 100 12 66V18Z" fill="url(#mbShGold)"/>
    <path d="M64 13 107 25v40c0 29-18 47-43 63-25-16-43-34-43-63V25Z" fill="url(#mbShBody)"/>
    <path d="M64 13 107 25v40c0 29-18 47-43 63-25-16-43-34-43-63V25Z" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6"/>
    <path d="M64 13 107 25v13c-28 7.5-58 7.5-86 0V25Z" fill="url(#mbShGloss)" opacity=".4"/>
    <g stroke="#fff" fill="none" stroke-width="3.4" opacity=".92">
      <circle cx="64" cy="43" r="11.5"/>
      <circle cx="64" cy="43" r="3.4" fill="#fff" stroke="none"/>
      <path d="M64 46.5v7.5M53.5 40.5l7.4 1.7M74.5 40.5l-7.4 1.7" stroke-linecap="round" stroke-width="2.8"/>
    </g>
    <text x="64" y="72" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="10" letter-spacing="2.4" fill="#d9d8ff">PALIER</text>
    <text x="64" y="105" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="40" fill="#fff">${palierNum}</text>
    <path d="M42 114l22 10 22-10" fill="none" stroke="url(#mbShGold)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function _progHtml(state) {
  if (state.isMax) {
    return `<div class="mb-max">
      ${icon("check-circle", { size: 18, strokeWidth: 2 })}
      <div class="mb-max-txt">Palier maximum atteint. Tu es référent certifié.</div>
    </div>`;
  }
  const missing = state.nextReward?.missing ?? 0;
  const nextNum = (state.tier?.tier ?? 0) + 1;
  const nextTitle = state.nextReward?.data?.title ?? "";
  return `<div class="mb-hero-prog">
    <div class="mb-hero-bar">
      <span class="mb-hero-fill" id="mb-hero-fill" role="progressbar"
        aria-valuenow="${Math.round(state.pctToNextReward ?? 0)}" aria-valuemin="0" aria-valuemax="100"
        aria-label="Progression vers le palier ${nextNum}"></span>
    </div>
    <div class="mb-hero-hint">
      ${state.validations} compétence${state.validations > 1 ? "s" : ""} validée${state.validations > 1 ? "s" : ""} · plus que <b>${missing} validation${missing > 1 ? "s" : ""}</b> pour le palier ${nextNum}${nextTitle ? ` — ${esc(nextTitle)}` : ""}
    </div>
  </div>`;
}

// ─── Section Trophées : rail (12 jalons) ──────────────────────────
function _trophRow(troResults) {
  const seen = _readSeenTrophies();
  const unlockedIds = troResults.filter((t) => t.unlocked).map((t) => t.id);
  const html = troResults
    .map((t) => {
      const lockCls = t.unlocked ? "" : " lock";
      const isNew = t.unlocked && !seen.has(t.id);
      const newCls = isNew ? " new-badge" : "";
      const label = t.name || t.id;
      return `<div class="mb-tcell${lockCls}${newCls}" role="button" tabindex="0" data-key="${escAttr(t.id)}" aria-label="${escAttr(label)}${t.unlocked ? " — débloqué" : " — verrouillé"} — voir le détail">
        <img src="${badgeSrc(t.id)}" alt="" width="46" height="46" loading="lazy">
      </div>`;
    })
    .join("");
  // Marque les trophées débloqués comme « vus » dès l'affichage du rail
  // (même mécanique que la pastille « nouveau » élève : 1 visite = vu).
  if (unlockedIds.length) _markTrophiesSeen(unlockedIds);
  return html;
}

// ─── Section Parcours : aperçu 3 paliers (atteint · en cours · sommet) ──
function _parcoursSectionHtml(state, totalVals) {
  const sommetTier = MONITEUR_TIERS[MONITEUR_TIERS.length - 1];
  const stops = [];
  if (state.tier) stops.push({ kind: "done", tier: state.tier });
  if (state.nextTier) stops.push({ kind: "now", tier: state.nextTier });
  const alreadyHasSommet = stops.some((s) => s.tier.tier === sommetTier.tier);
  if (!alreadyHasSommet) stops.push({ kind: "todo", tier: sommetTier });

  const stopsHtml = stops
    .map((s) => {
      const done = totalVals >= s.tier.threshold;
      const kind =
        done && s.kind !== "now" ? "done" : s.kind === "now" ? "now" : "todo";
      const diff = Math.max(0, s.tier.threshold - totalVals);
      const lvlLabel =
        kind === "done" ? "atteint" : kind === "now" ? "en cours" : "le sommet";
      const costHtml =
        kind === "done"
          ? `<span class="mb-stop-cost done">${s.tier.threshold} validations</span>`
          : kind === "now"
            ? `<span class="mb-stop-cost now">+${diff} validation${diff > 1 ? "s" : ""}</span>`
            : `<span class="mb-stop-cost todo">${s.tier.threshold} validations</span>`;
      const dot =
        kind === "done"
          ? medallion("check", "green", { size: 30 })
          : kind === "now"
            ? medallion("etoile", "indigo", { size: 30, glow: true })
            : medallion("couronne", "gold", { size: 30 });
      return `<div class="mb-stop ${kind}" role="button" tabindex="0" data-tier="${s.tier.tier}" aria-label="Palier ${s.tier.tier}, ${lvlLabel} : ${escAttr(s.tier.title)}">
        <div class="mb-stop-dot">${dot}</div>
        <div class="mb-stop-body">
          <div class="mb-stop-head"><span class="mb-stop-lvl">Palier ${s.tier.tier} · ${lvlLabel}</span>${costHtml}</div>
          <div class="mb-stop-t">${esc(s.tier.title)}</div>
          <div class="mb-stop-s">${esc(s.tier.unlock?.name || "")}</div>
        </div>
      </div>`;
    })
    .join("");

  return `
  <div class="mb-sec">
    <div class="mb-sec-t">Parcours <small>palier ${state.tier?.tier ?? 0} sur ${MONITEUR_TIERS.length}</small></div>
    <button class="mb-sec-lnk" id="mb-par-link" aria-label="Voir tous les paliers">Tous les paliers ${icon("chevron-right", { size: 12, strokeWidth: 2.6 })}</button>
  </div>
  <div class="mb-par-card">${stopsHtml}</div>`;
}

function _streakBannerHtml(streak) {
  if (!streak || streak <= 0) return "";
  if (streak >= 30) {
    return `<div class="mb-streak">
      ${medallion("flamme", "orange", { size: 30 })}
      <div class="mb-streak-t"><b>${streak} jours d'activité d'affilée</b> — record en cours.</div>
    </div>`;
  }
  const restant = 30 - streak;
  return `<div class="mb-streak">
    ${medallion("flamme", "orange", { size: 30 })}
    <div class="mb-streak-t"><b>${streak} jour${streak > 1 ? "s" : ""} d'activité d'affilée</b> — encore ${restant} pour le trophée « Mois sans faille ».</div>
  </div>`;
}

// ─── Wire ──────────────────────────────────────────────────────
function _wire(root, me, d, state, troResults) {
  // Partager (V1 simple : texte de preuve, pas d'image)
  root.querySelector("#mb-share")?.addEventListener("click", () => {
    haptic("tap");
    track("mon_blason.share");
    _shareBlason(me, d);
  });

  // Trophées : rail → feuille de détail (en place) ; "Tout voir" → grille complète
  root.querySelectorAll(".mb-tcell[data-key]").forEach((cell) => {
    const open = () => {
      const t = troResults.find((x) => x.id === cell.dataset.key);
      if (t) openTrophySheet(t, { triggerEl: cell });
    };
    cell.addEventListener("click", open);
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
  root.querySelector("#mb-tro-link")?.addEventListener("click", () => {
    haptic("tap");
    track("mon_blason.trophees.tout_voir");
    navigate("#/trophees-moniteur");
  });

  // Parcours : stops → détail palier ; "Tous les paliers" → timeline complète
  root.querySelectorAll(".mb-stop[data-tier]").forEach((el) => {
    const open = () => {
      const tierNum = parseInt(el.dataset.tier, 10);
      const tier = MONITEUR_TIERS.find((t) => t.tier === tierNum);
      if (!tier) return;
      haptic(d.totalVals >= tier.threshold ? "levelup" : "impact");
      track("mon_blason.parcours.stop", { tier: tierNum });
      openPalierSheet(tier, d.totalVals);
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
  root.querySelector("#mb-par-link")?.addEventListener("click", () => {
    haptic("tap");
    track("mon_blason.parcours.tous_paliers");
    navigate("#/parcours-complet");
  });
}

// ─── Partage V1 (texte de preuve, pas d'image) ────────────────────
async function _shareBlason(me, d) {
  const nomComplet =
    `${me.prenom || ""} ${me.nom || ""}`.trim() || "Moniteur PermiGo";
  const marque = d.ecole?.nom || nomComplet;

  const clauses = [];
  if (d.nbResultats12m >= 3) {
    const taux = Math.round((d.nbRecus12m / d.nbResultats12m) * 100);
    clauses.push(`${taux} % de réussite`);
  }
  clauses.push(`${d.nbRecus12m} permis obtenu${d.nbRecus12m > 1 ? "s" : ""}`);
  clauses.push(
    `${d.enFormation} élève${d.enFormation > 1 ? "s" : ""} en formation`,
  );

  const text = `${marque} — ${clauses.join(", ")}.`;

  try {
    if (navigator.share) {
      await navigator.share({ title: "Mon blason PermiGo", text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toast("Copié", "success");
    } else {
      toast(text, "info", 5000);
    }
  } catch {
    /* partage annulé par l'utilisateur — silencieux */
  }
}
