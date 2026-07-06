// ═══════════════════════════════════════════════════════════════
// Enseignant — Aujourd'hui (design Néo-arcade pro)
// Hero validations du jour + roster élèves + bouton 3D + footer tuiles
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";

// « Prêt » pour l'examen = MÊME règle métier que mes-eleves.js (source de vérité) :
// les compétences de BASE C1-C2-C3 sont toutes acquises (C4 = conduite autonome
// ne conditionne pas la présentation). On évite ainsi le seuil ad hoc 0.85 qui
// faisait diverger le compteur « N prêts » entre l'accueil et la liste.
const BASE_CATS = ["C1", "C2", "C3"];
const BASE_COMPS = REMC.filter((c) => BASE_CATS.includes(c.id)).flatMap((c) =>
  c.subs.map((s) => s.c),
);
const isPretExam = (acquisSet) =>
  !!acquisSet && BASE_COMPS.every((c) => acquisSet.has(c));
import { labelComp } from "@/utils/remc-label.js";
import { statutCfg } from "@/utils/statut-label.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { fmtName } from "@/utils/fmt-name.js";
import { openInviteEleveModal } from "@/services/invite-eleve.js";
import { getMoniteurState } from "@/data/moniteur-levels.js";
import { getLeague } from "@/utils/league-shared.js";
import { startTour } from "@/components/common/guided-tour.js";
import { haptic } from "@/utils/haptic.js";
import { onPopupsSettled } from "@/utils/intro-overlays.js";
import { medallion } from "@/utils/medallions.js";

// Tour guidé enseignant — affiché 1× à la première connexion
const TOUR_KEY = "pg-tour-moniteur-v1";
const MONITEUR_TOUR_STEPS = [
  {
    title: "Bienvenue sur PermiGo",
    text: "Ton livret passe en numérique. Tes élèves voient leur progression en temps réel. Toi, tu sais où en est chacun d’un coup d’œil.",
  },
  {
    sel: "#aj-act-invite",
    title: "Commence ici",
    text: "Invite un élève. Il reçoit un lien, crée son compte en 1 minute et t’est rattaché tout seul. C’est le point de départ.",
  },
  {
    sel: "#aj-cta-seance",
    title: "Valide après la leçon",
    text: "Coche les compétences réussies. Le livret de ton élève se met à jour aussitôt. Fini le papier.",
  },
  {
    sel: '.bn-tab[data-id="eleves"]',
    title: "Suis tes élèves",
    text: "Retrouve chaque élève, son livret et sa progression. Ceux à relancer remontent tout seuls.",
  },
  {
    sel: '.bn-tab[data-id="insights"]',
    title: "Mesure l’engagement",
    text: "Qui révise cette semaine, qui stagne. Les chiffres t’aident à décider par où commencer.",
  },
];

function maybeStartMoniteurTour() {
  try {
    if (localStorage.getItem(TOUR_KEY)) return;
  } catch {
    return;
  }
  onPopupsSettled(() => {
    setTimeout(() => {
      if (!document.querySelector("#aj-act-invite")) return;
      track("moniteur.tour.start");
      startTour(MONITEUR_TOUR_STEPS, {
        onDone: () => {
          try {
            localStorage.setItem(TOUR_KEY, "1");
          } catch {
            /* stockage indispo */
          }
          track("moniteur.tour.done");
        },
      });
    }, 450);
  });
}

// ─── CSS ──────────────────────────────────────────────────────────
const STYLE = `<style>
  /* ── Reset local ── */
  /* Le FAB « séance » global (#bn-seance-fab) fait doublon avec le gros
     bouton « Valider une séance » de cette page ET chevauche le footer →
     on le masque ICI seulement (il reste sur les autres pages moniteur). */
  #bn-seance-fab { display: none !important; }
  .aj-page {
    padding: 0 0 calc(84px + env(safe-area-inset-bottom, 0px));
    max-width: 600px;
    margin: 0 auto;
    background: #eef1fb;
    font-family: 'Inter', sans-serif;
    color: #1a1c2e;
    min-height: 100vh;
  }

  /* ── Salutation ── */
  .aj-hi {
    /* #app (has-chrome) compense déjà le header fixe — pas de var(--th) ici */
    padding: 12px 20px 0;
    font: 700 14px/1.3 'Inter', sans-serif;
    color: #5a6188;
  }
  .aj-hi-name {
    display: block;
    font: 800 22px/1.15 'Inter', sans-serif;
    color: #1a1c2e;
    letter-spacing: -.02em;
    margin-top: 2px;
  }

  /* ── Hero dégradé indigo→violet ── */
  .aj-hero {
    position: relative;
    margin: 14px 16px 0;
    background: linear-gradient(150deg, #4f46e5, #6d6bff 60%, #8b5cf6);
    border-radius: 26px;
    padding: 20px 18px 24px;
    overflow: visible;
    box-shadow: 0 16px 40px -14px rgba(79, 70, 229, .6);
    isolation: isolate;
    min-height: 160px;
    animation: ajIn .45s cubic-bezier(.22,.68,0,1.2) both;
  }

  /* Halo doré derrière le trophée */
  .aj-hero-halo {
    position: absolute;
    right: -10px;
    top: -18px;
    width: 170px;
    height: 170px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 210, 120, .65), transparent 65%);
    z-index: 0;
    filter: blur(5px);
    pointer-events: none;
  }

  .aj-hero-content { position: relative; z-index: 2; }

  .aj-hero-label {
    font: 700 10.5px/1 'Inter', sans-serif;
    letter-spacing: .11em;
    text-transform: uppercase;
    color: #c9c6ff;
  }

  .aj-hero-big {
    font: 700 64px/1 'Fredoka One', 'Fredoka', sans-serif;
    color: #fff;
    letter-spacing: -.01em;
    text-shadow: 0 4px 18px rgba(0, 0, 0, .2);
    line-height: 1;
    margin-top: 2px;
  }
  .aj-hero-big-unit {
    font-size: 20px;
    font-weight: 600;
    color: #d8d5ff;
    margin-left: 5px;
    vertical-align: middle;
  }

  .aj-hero-sub {
    font: 600 12.5px/1.4 'Inter', sans-serif;
    color: #e2e0ff;
    margin-top: 4px;
  }
  .aj-hero-sub b { color: #ffd27a; }

  /* Trophée PNG flottant — déborde en bas-droite */
  .aj-hero-trophy {
    position: absolute;
    right: -4px;
    bottom: -10px;
    width: 130px;
    z-index: 3;
    filter: drop-shadow(0 14px 20px rgba(40, 20, 90, .45));
    animation: ajFloat 4s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .aj-hero-trophy { animation: none; }
  }

  /* Pastille verre dépoli Top X% */
  .aj-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 13px;
    background: rgba(255, 255, 255, .17);
    border: 1px solid rgba(255, 255, 255, .3);
    color: #fff;
    font: 800 10.5px/1 'Inter', sans-serif;
    padding: 5px 11px;
    border-radius: 999px;
  }
  .aj-hero-badge img {
    width: 14px;
    height: 14px;
    object-fit: contain;
    filter: drop-shadow(0 1px 3px rgba(40,20,90,.3));
  }

  /* ── Section header (« Tes élèves · N prêts ») ── */
  .aj-sec-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 20px 10px;
  }
  .aj-sec-title {
    font: 800 13px/1.2 'Inter', sans-serif;
    color: #3a3f63;
    letter-spacing: .005em;
  }
  .aj-sec-link {
    font: 700 11.5px/1 'Inter', sans-serif;
    color: #4f46e5;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    min-height: 44px;
    display: flex;
    align-items: center;
    -webkit-tap-highlight-color: transparent;
  }
  .aj-sec-link:active { opacity: .7; }

  /* ── Carte élève ── */
  .aj-eleve-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border: 1px solid #e6e9f7;
    border-radius: 16px;
    padding: 11px 13px;
    margin: 0 16px 8px;
    box-shadow: 0 6px 18px -10px rgba(60, 50, 130, .28);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform .12s ease, box-shadow .12s ease;
    min-height: 56px;
  }
  .aj-eleve-card:active {
    transform: scale(.975);
    box-shadow: 0 2px 8px -4px rgba(60, 50, 130, .2);
  }
  .aj-eleve-card:focus-visible {
    outline: 3px solid #4f46e5;
    outline-offset: 2px;
  }

  .aj-eleve-av { flex-shrink: 0; }
  .aj-eleve-body { flex: 1; min-width: 0; }
  .aj-eleve-nom {
    font: 700 13.5px/1.25 'Inter', sans-serif;
    color: #1a1c2e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .aj-eleve-bar-wrap {
    height: 6px;
    background: #eceefb;
    border-radius: 999px;
    margin-top: 6px;
    overflow: hidden;
    width: 120px;
    max-width: 100%;
  }
  .aj-eleve-bar-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    transition: width .5s ease-out;
  }

  /* Pastilles statut */
  .aj-pill {
    margin-left: auto;
    flex-shrink: 0;
    font: 800 10px/1 'Inter', sans-serif;
    padding: 5px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .aj-pill-ok   { background: #dcfce7; color: #15803d; }
  .aj-pill-warn { background: #fef3c7; color: #b45309; }
  .aj-pill-go   { background: #eae8ff; color: #4f46e5; }

  /* ── Bouton 3D « Valider une séance » ── */
  .aj-cta-wrap { padding: 6px 16px 0; }
  .aj-cta {
    width: 100%;
    border: none;
    border-radius: 16px;
    padding: 16px;
    min-height: 54px;
    font: 800 15px/1 'Inter', sans-serif;
    color: #fff;
    background: linear-gradient(180deg, #5b54ff, #4f46e5);
    box-shadow: 0 6px 0 #3a32c4;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform .12s ease, box-shadow .12s ease;
    letter-spacing: -.01em;
  }
  .aj-cta:active {
    transform: translateY(5px);
    box-shadow: 0 1px 0 #3a32c4;
  }
  .aj-cta:focus-visible {
    outline: 3px solid #c7c4ff;
    outline-offset: 3px;
  }

  /* ── Footer 2 tuiles ── */
  .aj-foot {
    display: flex;
    gap: 10px;
    padding: 18px 16px 0;
  }
  .aj-ft {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 1px solid #e6e9f7;
    border-radius: 15px;
    padding: 10px 12px;
    box-shadow: 0 4px 12px -8px rgba(60, 50, 130, .22);
  }
  .aj-ft img {
    width: 32px;
    height: 32px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 3px 5px rgba(40, 20, 90, .25));
  }
  .aj-ft-val {
    font: 800 14px/1.2 'Inter', sans-serif;
    color: #1a1c2e;
    letter-spacing: -.01em;
  }
  .aj-ft-lbl {
    font: 600 10px/1.2 'Inter', sans-serif;
    color: #646a8c;
    margin-top: 1px;
  }

  /* ── Action rapide Inviter ── */
  .aj-invite-wrap { padding: 16px 16px 0; }
  .aj-invite-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 13px;
    min-height: 44px;
    background: none;
    border: 1.5px solid #d5d8f0;
    border-radius: 13px;
    font: 700 13px/1 'Inter', sans-serif;
    color: #4f46e5;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: border-color .12s, background .12s;
  }
  .aj-invite-btn:hover { border-color: #4f46e5; background: rgba(79,70,229,.04); }
  .aj-invite-btn:active { opacity: .8; }

  /* ── Skeleton ── */
  .aj-skel {
    padding: 20px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .aj-skel-item {
    border-radius: 20px;
    background: linear-gradient(90deg, #dde0f5 0%, #eceef8 50%, #dde0f5 100%);
    background-size: 200% 100%;
    animation: aj-shimmer 1.4s ease-in-out infinite;
  }
  @keyframes aj-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  /* ── Keyframes ── */
  @keyframes ajIn {
    from { opacity: 0; transform: translateY(10px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes ajFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .aj-hero, .aj-cta, .aj-eleve-card {
      animation: none !important;
      transition: none !important;
    }
  }
</style>`;

// ─── Helpers ──────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO() {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10);
}

function initiales(prenom, nom) {
  const p = (prenom || "").trim()[0] || "";
  const n = (nom || "").trim()[0] || "";
  return (p + n).toUpperCase() || "?";
}

// Couleurs déterministes pour les avatars initiales
const AV_COLORS = [
  "#4f46e5",
  "#0891b2",
  "#15803d",
  "#b45309",
  "#7c3aed",
  "#c026d3",
];
function avatarColor(id) {
  if (!id) return AV_COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

// ─── Entry point ──────────────────────────────────────────────────
let _ptrCleanup = null;

export async function unmount() {
  if (_ptrCleanup) {
    _ptrCleanup();
    _ptrCleanup = null;
  }
}

export async function mount(root) {
  const _me = getCurUser();
  if (!_me) return;

  track("page.view", { page: "aujourdhui", role: _me.role });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="aj-page">
      <div class="aj-skel">
        <div class="aj-skel-item" style="height:40px"></div>
        <div class="aj-skel-item" style="height:168px"></div>
        <div class="aj-skel-item" style="height:56px"></div>
        <div class="aj-skel-item" style="height:56px"></div>
        <div class="aj-skel-item" style="height:56px"></div>
        <div class="aj-skel-item" style="height:54px"></div>
      </div>
    </div>
  `;

  async function renderAll() {
    await renderInto(root, _me);
  }

  await renderAll();

  // Pull-to-refresh
  const { attachPullToRefresh } = await import("@/utils/gestures.js");
  _ptrCleanup?.();
  _ptrCleanup = attachPullToRefresh(
    document.scrollingElement || document.body,
    {
      onRefresh: async () => {
        await renderAll();
      },
    },
  );
}

// ─── Render principal ─────────────────────────────────────────────
async function renderInto(root, _me) {
  const today = todayISO();
  const yesterday = yesterdayISO();

  // ─── Fetch en parallèle ────────────────────────────────────────
  const [
    valsAll,
    elevesAll,
    todayValsRes,
    yesterdayValsRes,
    profileRes,
    totalValsRes,
    leagueRes,
  ] = await Promise.all([
    // Dernières validations (activité récente) — non utilisées dans ce design
    // mais gardées pour éviter de casser les listeners existants
    sb
      .from("validations")
      .select("id, competence_id, statut, eleve_id, validated_at")
      .eq("validated_by", _me.id)
      .order("validated_at", { ascending: false })
      .limit(8),

    // Tous les élèves de l'école
    sb
      .from("profiles")
      .select("id, prenom, nom, last_active_at, enseignant_id, avatar_url")
      .eq("role", "eleve"),

    // Validations d'aujourd'hui
    sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", _me.id)
      .gte("validated_at", today + "T00:00:00Z")
      .lt("validated_at", today + "T23:59:59Z"),

    // Validations d'hier
    sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", _me.id)
      .gte("validated_at", yesterday + "T00:00:00Z")
      .lt("validated_at", yesterday + "T23:59:59Z"),

    // Profil : prénom
    sb
      .from("profiles")
      .select("prenom, streak_pro_days")
      .eq("id", _me.id)
      .maybeSingle(),

    // Total validations cumulées
    sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", _me.id),

    // Ligue
    Promise.resolve(
      sb.rpc("get_league_leaderboard", { p_role: "enseignant", p_limit: 50 }),
    ).catch(() => ({ data: null })),
  ]);

  // Erreur bloquante (réseau, RLS…) → vrai état d'erreur récupérable.
  // Avant : un toast de 3s puis un dashboard « normal mais vide » trompeur.
  const loadError = valsAll.error || elevesAll.error || todayValsRes.error;
  if (loadError) {
    console.error("[aujourdhui] chargement", loadError);
    toast("« Aujourd’hui » indisponible", "error");
    root.innerHTML = `
      ${STYLE}
      <div class="aj-page">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:72px 24px;text-align:center;">
          ${medallion("cone", "orange", { size: 52 })}
          <p style="margin:0;font:600 15px/1.5 'Inter',sans-serif;color:#1a1c2e;">
            « Aujourd’hui » indisponible.<br>
            <span style="font:500 13px/1.5 'Inter',sans-serif;color:#5a6188;">Vérifie ta connexion, puis réessaie.</span>
          </p>
          <button id="aj-retry" type="button" style="border:none;border-radius:999px;padding:13px 24px;min-height:44px;background:#4f46e5;color:#fff;font:700 14px/1 'Inter',sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;">Réessayer</button>
        </div>
      </div>
    `;
    root.querySelector("#aj-retry")?.addEventListener("click", () => {
      renderInto(root, _me);
    });
    return;
  }

  const recentVals = valsAll.data || [];
  const elevesMap = {};
  (elevesAll.data || []).forEach((e, i) => {
    elevesMap[e.id] = { ...e, idx: i };
  });

  const prenom = profileRes?.data?.prenom || "";
  const totalValsCount = totalValsRes?.count ?? 0;
  const moniteurState = getMoniteurState(totalValsCount);

  // KPI hero
  const todayCount = todayValsRes?.count ?? 0;
  const yesterdayCount = yesterdayValsRes?.count ?? 0;
  const deltaVsHier = todayCount - yesterdayCount;

  // Ma ligue
  const leagueRows = leagueRes?.data || [];
  const myLeagueRow = leagueRows.find((r) => r.is_me) || null;
  const myWeeklyPts = myLeagueRow?.weekly_pts ?? 0;
  const myLeague = getLeague(myWeeklyPts);
  const myRank = myLeagueRow?.rank_pos ?? null;

  // Élèves que j'ai validé + qui me sont attitrés
  const { data: elevesValides } = await sb
    .from("validations")
    .select("eleve_id")
    .eq("validated_by", _me.id);
  const validatedByMe = new Set((elevesValides || []).map((v) => v.eleve_id));

  const { data: acquisAll } = await sb
    .from("validations")
    .select("eleve_id, competence_id")
    .eq("statut", "acquis");
  const acquisSetByEleve = {};
  (acquisAll || []).forEach((v) => {
    if (!v.competence_id) return;
    (acquisSetByEleve[v.eleve_id] ||= new Set()).add(v.competence_id);
  });

  // Élèves ayant OBTENU le permis (dernier examen = 'recu') → ils sortent de la
  // formation active : ils ne doivent PLUS compter comme « prêts » ni encombrer
  // le roster (sinon un reçu très avancé reste affiché « Prête » à tort).
  const { data: examsAll } = await sb
    .from("examens")
    .select("eleve_id, statut, created_at")
    .order("created_at", { ascending: false });
  const recuByEleve = new Set();
  const lastExamSeen = new Set();
  (examsAll || []).forEach((ex) => {
    if (lastExamSeen.has(ex.eleve_id)) return; // 1ère ligne vue = plus récente
    lastExamSeen.add(ex.eleve_id);
    if (ex.statut === "recu") recuByEleve.add(ex.eleve_id);
  });

  const mesIds = new Set(
    Object.values(elevesMap)
      .filter((e) => e.enseignant_id === _me.id)
      .map((e) => e.id),
  );
  for (const id of validatedByMe) mesIds.add(id);

  const mesEleves = Array.from(mesIds).map((id) => ({
    id,
    ...(elevesMap[id] || { prenom: "Élève", nom: "", idx: 0 }),
    acquis: acquisSetByEleve[id]?.size || 0,
    acquisSet: acquisSetByEleve[id] || new Set(),
    recu: recuByEleve.has(id), // a déjà obtenu son permis
  }));

  // Élèves encore EN FORMATION (les reçus sont sortis) — base des compteurs.
  const elevesEnFormation = mesEleves.filter((e) => !e.recu);
  const nbElevesActifs = elevesEnFormation.length;
  const nbRecus = mesEleves.length - elevesEnFormation.length;

  // « Prêts » = bien avancé ET pas encore passé l'examen (un reçu n'est pas
  // « prêt à passer », il a déjà réussi).
  const prets = elevesEnFormation.filter((e) => isPretExam(e.acquisSet));
  const nbPrets = prets.length;

  // Roster 3 élèves prioritaires
  // Tri : 1) inactifs depuis > 7j (à relancer) 2) proches de la fin 3) actifs récemment
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const roster = elevesEnFormation
    .filter((e) => (e.acquis || 0) < REMC_TOTAL)
    .sort((a, b) => {
      const aLast = elevesMap[a.id]?.last_active_at || "";
      const bLast = elevesMap[b.id]?.last_active_at || "";
      const aInactif = aLast < sevenDaysAgo;
      const bInactif = bLast < sevenDaysAgo;
      // Inactifs en premier (à relancer), puis par acquis décroissant
      if (aInactif !== bInactif) return aInactif ? -1 : 1;
      return (b.acquis || 0) - (a.acquis || 0);
    })
    .slice(0, 3);

  // ─── Hero HTML ────────────────────────────────────────────────
  const prenomEsc = prenom ? esc(fmtName(prenom)) : "";
  const deltaHtml =
    deltaVsHier !== 0
      ? `<b>${deltaVsHier > 0 ? "+" + deltaVsHier : deltaVsHier}</b> vs hier`
      : "pareil qu’hier";

  // Flamme PNG pour le record
  const flammeHtml = `<img src="/skins/permigo-streak-flame-v1.webp" alt="" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;display:inline-block;margin-right:2px;filter:drop-shadow(0 1px 3px rgba(255,150,0,.5))">`;

  // À 0 validation : pas de célébration à vide. Trophée en sourdine +
  // message d'amorçage vers le CTA, au lieu d'un « 0 » triomphal avec
  // « record à battre » et « pareil qu'hier ».
  const heroEmpty = todayCount === 0;
  const heroSubHtml = heroEmpty
    ? `<b>Valide ta première compétence du jour</b> avec « Valider une séance »`
    : `${deltaHtml} &nbsp;·&nbsp; record ${flammeHtml} à battre`;
  const trophyMutedStyle = heroEmpty
    ? ' style="opacity:.4;filter:grayscale(.75) drop-shadow(0 14px 20px rgba(40,20,90,.3));animation:none"'
    : "";

  // Pastille badge top dept — on montre si rang connu + top quartile
  const topBadgeHtml =
    myRank !== null && myRank <= 5
      ? `<span class="aj-hero-badge"><img src="/skins/trophy-streak-7d.webp" alt="">Top ${myRank} du département</span>`
      : `<span class="aj-hero-badge">Ta ligue&nbsp;: ${myLeague ? esc(myLeague.name) : "à venir"}</span>`;

  // ─── Roster élèves ────────────────────────────────────────────
  function renderRosterCard(e) {
    const nom = esc(
      fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "—",
    );
    const pct = REMC_TOTAL > 0 ? Math.round((e.acquis / REMC_TOTAL) * 100) : 0;
    const lastActive = elevesMap[e.id]?.last_active_at || "";
    const inactifDepuis = lastActive < sevenDaysAgo;

    // Statut + couleur barre
    let pillClass = "aj-pill-go";
    let pillText = `${REMC_TOTAL - e.acquis} à valider`;
    let barColor = "#4f46e5";

    if (isPretExam(e.acquisSet)) {
      pillClass = "aj-pill-ok";
      pillText = "Prête";
      barColor = "#15803d";
    } else if (inactifDepuis) {
      // Calcule jours d'inactivité
      const joursOff = lastActive
        ? Math.round((Date.now() - new Date(lastActive)) / 86400000)
        : null;
      pillClass = "aj-pill-warn";
      // Libellé explicite : « 43 j » nu se lisait comme un jeton mystère
      pillText = joursOff ? `Inactif ${joursOff} j` : "Inactif";
      barColor = "#d97706";
    }

    // Avatar : vrai URL si dispo, sinon initiales
    let avHtml;
    if (e.avatar_url) {
      avHtml = `<img src="${esc(e.avatar_url)}" alt="" width="36" height="36" style="border-radius:50%;object-fit:cover;flex-shrink:0;" loading="lazy">`;
    } else {
      const color = avatarColor(e.id);
      const inits = esc(initiales(e.prenom, e.nom));
      avHtml = `<span style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font:800 13px 'Inter',sans-serif;color:#fff;flex-shrink:0;">${inits}</span>`;
    }

    return `<div class="aj-eleve-card" data-eleve-id="${esc(e.id)}" role="button" tabindex="0" aria-label="Livret de ${nom}">
      <div class="aj-eleve-av">${avHtml}</div>
      <div class="aj-eleve-body">
        <div class="aj-eleve-nom">${nom}</div>
        <div class="aj-eleve-bar-wrap">
          <span class="aj-eleve-bar-fill" style="width:${pct}%;background:${barColor}"></span>
        </div>
      </div>
      <span class="aj-pill ${pillClass}">${esc(pillText)}</span>
    </div>`;
  }

  // Ligue footer
  const ligueVal = myLeague
    ? `${esc(myLeague.name)}${myRank ? " · #" + myRank : ""}`
    : "Hors-ligue";

  // ─── Render ───────────────────────────────────────────────────
  root.innerHTML = `
    ${STYLE}
    <div class="aj-page anim-slide-up">

      <!-- Salutation -->
      <div class="aj-hi">
        Bonjour
        ${prenomEsc ? `<span class="aj-hi-name">${prenomEsc}</span>` : '<span class="aj-hi-name">Moniteur</span>'}
      </div>

      <!-- Hero validations du jour -->
      <div class="aj-hero">
        <div class="aj-hero-halo"${heroEmpty ? ' style="opacity:.3"' : ""}></div>
        <div class="aj-hero-content">
          <div class="aj-hero-label">Tes validations du jour</div>
          <div class="aj-hero-big">${todayCount}<span class="aj-hero-big-unit">compétence${todayCount > 1 ? "s" : ""}</span></div>
          <div class="aj-hero-sub">${heroSubHtml}</div>
          ${topBadgeHtml}
        </div>
        <img
          class="aj-hero-trophy"
          src="/skins/trophy-permis-virtuel.webp"
          alt=""
          loading="eager"
          width="130"
          height="130"${trophyMutedStyle}
        >
      </div>

      <!-- Radar de relance -->
      <button id="aj-radar" type="button" style="display:flex;align-items:center;gap:12px;width:calc(100% - 32px);margin:0 16px 14px;padding:14px 15px;background:#fff;border:1px solid #e6e9f7;border-radius:16px;box-shadow:0 6px 16px -10px rgba(60,50,130,.3);cursor:pointer;text-align:left;-webkit-tap-highlight-color:transparent;">
        <span style="flex-shrink:0;display:flex;">${medallion("cible", "indigo", { size: 36 })}</span>
        <span style="flex:1;min-width:0;">
          <span style="display:block;font:800 14.5px/1.15 'Manrope','Plus Jakarta Sans',sans-serif;color:#1a1c2e;">Radar de relance</span>
          <span style="display:block;font:600 12px/1.5 'Inter',sans-serif;color:#5a6188;margin-top:2px;">Relance en 1 tap tes élèves qui ne révisent plus</span>
        </span>
        <span style="flex-shrink:0;color:#646a8c;">${icon("chevron-right", { size: 20, strokeWidth: 2.4 })}</span>
      </button>

      <!-- Tes élèves -->
      <div class="aj-sec-header">
        <span class="aj-sec-title">Tes élèves${nbPrets > 0 ? " · " + nbPrets + " prêt" + (nbPrets > 1 ? "s" : "") : ""}${nbRecus > 0 ? " · " + nbRecus + " reçu" + (nbRecus > 1 ? "s" : "") : ""}</span>
        <button class="aj-sec-link" id="aj-voir-tout" type="button">Tout voir</button>
      </div>

      ${
        nbElevesActifs === 0
          ? `<p style="margin:0 16px 12px;font:500 13px/1.5 'Inter',sans-serif;color:#5a6188;padding:16px;background:#fff;border-radius:16px;border:1px solid #e6e9f7;">
            Invite ton premier élève pour commencer.
          </p>`
          : roster.map(renderRosterCard).join("")
      }

      <!-- Bouton 3D Valider une séance -->
      <div class="aj-cta-wrap">
        <button class="aj-cta" id="aj-cta-seance" type="button">
          Valider une séance
        </button>
      </div>

      <!-- Footer 2 tuiles -->
      <div class="aj-foot">
        <div class="aj-ft">
          <img src="/skins/badge-3d-06.webp" alt="" loading="lazy" width="32" height="32">
          <div>
            <div class="aj-ft-val">${nbElevesActifs > 0 ? nbPrets : "—"}</div>
            <div class="aj-ft-lbl">${nbPrets >= 2 ? "élèves prêts" : "élève prêt"}</div>
          </div>
        </div>
        <div class="aj-ft">
          <img src="/skins/couronne.png" alt="" loading="lazy" width="32" height="32">
          <div>
            <div class="aj-ft-val">${esc(ligueVal)}</div>
            <div class="aj-ft-lbl">ta ligue</div>
          </div>
        </div>
      </div>

      <!-- Action rapide : inviter un élève -->
      <div class="aj-invite-wrap">
        <button class="aj-invite-btn" id="aj-act-invite" type="button">
          + Inviter un élève
        </button>
      </div>

    </div>
  `;

  // ─── Listeners ────────────────────────────────────────────────
  // Bouton Valider une séance
  root.querySelector("#aj-cta-seance")?.addEventListener("click", () => {
    haptic("impact");
    track("aujourdhui.cta_seance.clicked");
    navigate("#/log-session");
  });

  // Voir tout les élèves
  root.querySelector("#aj-voir-tout")?.addEventListener("click", () => {
    track("aujourdhui.voir_tout.clicked");
    navigate("#/eleves");
  });

  root.querySelector("#aj-radar")?.addEventListener("click", () => {
    haptic("tap");
    track("aujourdhui.radar.clicked");
    navigate("#/relances");
  });

  // Cartes élèves → livret
  root.querySelectorAll(".aj-eleve-card[data-eleve-id]").forEach((card) => {
    const open = () => {
      const id = card.dataset.eleveId;
      haptic("impact");
      track("eleve.livret.open", { eleve_id: id, from: "aujourdhui" });
      navigate(`#/livret/${id}`);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  // Inviter un élève
  root.querySelector("#aj-act-invite")?.addEventListener("click", () => {
    track("quick_action.invite");
    openInviteEleveModal(_me);
  });

  // Tour guidé à la première connexion
  maybeStartMoniteurTour();
}
