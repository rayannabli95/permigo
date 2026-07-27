// ═══════════════════════════════════════════════════════════════
// Enseignant — Classement de tes élèves (skin « Arène Podium », indigo)
// Podium (couronne #1) + liste dense + Hall of Fame. Lecture seule :
// aide le moniteur à repérer qui pousser / féliciter. Tap → livret.
// Deux ligues : Pratique (compétences REMC validées) · Révision (quiz 30 j).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC_TOTAL } from "@/data/remc.js";
import { medallion } from "@/utils/medallions.js";
import { fmtName } from "@/utils/fmt-name.js";
import { haptic } from "@/utils/haptic.js";
import {
  ARENE_CSS,
  areneAccent,
  arenePodium,
  areneRow,
} from "@/components/common/arene-rank.js";

const ACCENT = areneAccent("indigo");

// mode = "pratique" (compétences REMC validées, défaut) | "theorie" (quiz)
// PostgREST tronque en silence à 1000 lignes : à l'échelle école, les
// validations « acquis » dépassent ce seuil dès ~33 livrets remplis → l'acquis
// par élève serait sous-compté et le classement faux. On pagine par .range().
async function fetchAllRows(buildQuery) {
  const PAGE = 1000;
  let from = 0;
  const data = [];
  for (;;) {
    const { data: page, error } = await buildQuery().range(
      from,
      from + PAGE - 1,
    );
    if (error) return { data, error };
    data.push(...(page || []));
    if (!page || page.length < PAGE) return { data, error: null };
    from += PAGE;
  }
}

/**
 * Fetch + transforme les données de classement d'un moniteur.
 * Exportée : réutilisée telle quelle par le hub « Mes élèves » (onglet
 * Classement), qui la re-skinne en léger (maquette Pupitre) au lieu du
 * skin Arène nuit — même logique/mêmes requêtes, présentation différente.
 * @param {{id:string}} me
 * @param {{isTheorie?:boolean}} opts
 * @returns {Promise<{error:boolean, ranked:Array, hof:Array, isTheorie:boolean}>}
 *   `ranked`/`hof` : lignes `{id,prenom,nom,avatar_url,acquis,quizCount,avgScore,streak,recu}`
 */
export async function fetchRanking(me, { isTheorie = false } = {}) {
  // ── Fetch : élèves de l'école, mes validations, examens « reçu », streaks ──
  const [elevesRes, valsRes, examsRes, streaksRes] = await Promise.all([
    sb
      .from("profiles")
      .select("id, prenom, nom, enseignant_id, avatar_url")
      .eq("role", "eleve"),
    fetchAllRows(() =>
      sb
        .from("validations")
        .select("eleve_id, competence_id, validated_by, statut")
        .eq("statut", "acquis"),
    ),
    fetchAllRows(() =>
      sb.from("examens").select("eleve_id, statut, created_at"),
    ),
    // Streak RÉEL : last_activity_date nécessaire car la valeur stockée ne se
    // reset côté serveur qu'au prochain login de l'élève (cf. mémoire projet).
    sb.from("streaks").select("user_id, current_streak, last_activity_date"),
  ]);

  if (elevesRes.error) {
    return { error: true, ranked: [], hof: [], isTheorie };
  }

  const elevesMap = {};
  (elevesRes.data || []).forEach((e) => (elevesMap[e.id] = e));

  // Streak vivant seulement si actif aujourd'hui ou hier, sinon 0.
  const _today = new Date();
  _today.setHours(0, 0, 0, 0);
  const _yesterday = new Date(_today);
  _yesterday.setDate(_today.getDate() - 1);
  const streakByEleve = {};
  (streaksRes.data || []).forEach((s) => {
    const cur = s.current_streak || 0;
    const la = s.last_activity_date
      ? new Date(s.last_activity_date + "T00:00:00")
      : null;
    const alive = la && la.getTime() >= _yesterday.getTime();
    streakByEleve[s.user_id] = alive ? cur : 0;
  });

  // Acquis distincts par élève + élèves que j'ai validés
  const acquisByEleve = {};
  const validatedByMe = new Set();
  (valsRes.data || []).forEach((v) => {
    if (v.competence_id)
      (acquisByEleve[v.eleve_id] ||= new Set()).add(v.competence_id);
    if (v.validated_by === me.id) validatedByMe.add(v.eleve_id);
  });

  // Dernier examen par élève → statut « reçu »
  const lastExam = {};
  (examsRes.data || [])
    .slice()
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .forEach((ex) => {
      if (!lastExam[ex.eleve_id]) lastExam[ex.eleve_id] = ex.statut;
    });

  // Mes élèves = attitrés ∪ validés par moi
  const mesIds = new Set(
    (elevesRes.data || [])
      .filter((e) => e.enseignant_id === me.id)
      .map((e) => e.id),
  );
  validatedByMe.forEach((id) => mesIds.add(id));

  // ── Mode théorie : quiz des élèves (30 j) → volume + score moyen ──
  const quizByEleve = {};
  if (isTheorie && mesIds.size > 0) {
    const ago30 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const { data: qa, error: qaErr } = await sb
      .from("quiz_attempts")
      .select("user_id, score, completed_at")
      .in("user_id", Array.from(mesIds))
      .gte("completed_at", ago30);
    if (qaErr) console.error("[classement-eleves] quiz_attempts", qaErr);
    (qa || []).forEach((q) => {
      const b = (quizByEleve[q.user_id] ||= { count: 0, sum: 0 });
      b.count++;
      b.sum += q.score ?? 0;
    });
  }

  const all = Array.from(mesIds).map((id) => {
    const e = elevesMap[id] || { prenom: "Élève", nom: "" };
    const q = quizByEleve[id];
    return {
      id,
      prenom: e.prenom,
      nom: e.nom,
      avatar_url: e.avatar_url,
      acquis: acquisByEleve[id]?.size || 0,
      quizCount: q?.count || 0,
      avgScore: q && q.count ? Math.round(q.sum / q.count) : 0,
      streak: streakByEleve[id] || 0,
      recu: lastExam[id] === "recu",
    };
  });

  // Hall of fame = permis obtenu ; classement = les autres.
  const hof = all.filter((e) => e.recu);
  const ranked = all
    .filter((e) => !e.recu)
    .sort((a, b) =>
      isTheorie
        ? b.quizCount - a.quizCount ||
          b.avgScore - a.avgScore ||
          (a.prenom || "").localeCompare(b.prenom || "")
        : b.acquis - a.acquis || (a.prenom || "").localeCompare(b.prenom || ""),
    );

  return { error: false, ranked, hof, isTheorie };
}

export async function mount(root, mode) {
  const me = getCurUser();
  if (!me || (me.role !== "enseignant" && me.role !== "moniteur")) {
    root.innerHTML = "<p>Réservé aux moniteurs.</p>";
    return;
  }

  const isTheorie = mode === "theorie";
  track("page.view", {
    page: "classement_eleves",
    role: me.role,
    mode: isTheorie ? "theorie" : "pratique",
  });

  root.innerHTML = `${ARENE_CSS}<div class="arn" style="${ACCENT}">
    ${_header(isTheorie, 0)}
    <div class="arn-empty"><div class="arn-empty-txt">Chargement…</div></div>
  </div>`;

  const { error, ranked, hof } = await fetchRanking(me, { isTheorie });

  if (error) {
    toast(
      "Classement indisponible. Vérifie ta connexion, puis réessaie.",
      "error",
    );
    return;
  }

  if (ranked.length === 0 && hof.length === 0) {
    root.innerHTML = `${ARENE_CSS}<div class="arn" style="${ACCENT}">
      ${_header(isTheorie, 0)}
      <div class="arn-empty">
        <div class="arn-empty-ico">${
          isTheorie
            ? medallion("eclair", "indigo", { size: 48 })
            : medallion("trophee", "gold", { size: 48 })
        }</div>
        <div class="arn-empty-txt">${
          isTheorie
            ? "Aucune révision ces 30 derniers jours. Partage l’app à tes élèves : leur score apparaîtra ici dès la première révision."
            : "Aucun élève à classer. Attribue des élèves ou enregistre une séance : leurs compétences apparaîtront ici."
        }</div>
      </div>
    </div>`;
    _wire(root, isTheorie);
    return;
  }

  // ── Mapping vers la forme attendue par le skin Arène ──
  const fmt = isTheorie
    ? (r) => ({ value: r.score, suffix: "quiz" })
    : (r) => ({ value: r.score, suffix: `/${REMC_TOTAL}` });
  const mapped = ranked.map((e, i) => ({
    rang: i + 1,
    id: e.id,
    display_name:
      fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "Élève",
    avatar: e.avatar_url,
    score: isTheorie ? e.quizCount : e.acquis,
    streak: e.streak,
  }));

  const top = mapped.slice(0, 3);
  const rest = mapped.slice(3);
  const hasPodium = top.length >= 3;

  const podium = hasPodium
    ? arenePodium(top, { fmtScore: fmt, clickable: true })
    : "";
  const listRows = hasPodium ? rest : mapped;
  const list = listRows.length
    ? `<div class="arn-list-head"><span class="lbl">${hasPodium ? "À partir du 4ᵉ" : "Classement"}</span><span class="rule"></span></div>
       <div class="arn-list">${listRows
         .map((r, i) =>
           areneRow(r, {
             fmtScore: fmt,
             idx: i,
             clickable: true,
             showStreak: true,
           }),
         )
         .join("")}</div>`
    : "";

  root.innerHTML = `${ARENE_CSS}<div class="arn" style="${ACCENT}">
    ${_header(isTheorie, ranked.length)}
    ${podium}
    ${list}
    ${_hofSection(hof)}
  </div>`;

  _wire(root, isTheorie);
}

// ─── En-tête : titre + sous-titre + segmenté Pratique / Révision ──
function _header(isTheorie, n) {
  const sub = isTheorie
    ? "Classés par nombre de révisions · 30 derniers jours"
    : "Classés par compétences de conduite validées";
  const effectif =
    n > 0
      ? `<div class="arn-scopebar"><span style="font:600 12px/1 'Inter',sans-serif;color:var(--amute)">Tes élèves</span><span class="arn-effectif">${n} classé${n > 1 ? "s" : ""}</span></div>`
      : "";
  return `
    <div class="arn-hd"><h1>Classement élèves</h1><p class="arn-sub">${sub}</p></div>
    <div class="arn-seg" role="tablist">
      <button data-mode="pratique" role="tab" aria-selected="${!isTheorie}">Pratique <span class="sub">en voiture</span></button>
      <button data-mode="theorie" role="tab" aria-selected="${isTheorie}">Révision <span class="sub">quiz 30 j</span></button>
    </div>
    ${effectif}`;
}

function _hofSection(hof) {
  if (!hof || hof.length === 0) return "";
  const rows = hof
    .map((e) => {
      const nom = esc(
        fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "Élève",
      );
      return `<div class="arn-hof-row clickable" role="button" tabindex="0" data-eleve-id="${escAttr(String(e.id))}">
        <span class="arn-nm">${nom}</span>
        <span class="arn-hof-badge">${medallion("medaille", "gold", { size: 16 })} Permis obtenu</span>
      </div>`;
    })
    .join("");
  return `<div class="arn-hof-title">${medallion("medaille", "gold", { size: 16 })} Ils ont eu leur permis</div>${rows}`;
}

// ─── Wire ────────────────────────────────────────────────────────
function _wire(root, isTheorie) {
  // Bascule de ligue (navigation route → re-mount)
  root.querySelectorAll(".arn-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      const mode = b.dataset.mode;
      if ((mode === "theorie") === isTheorie) return;
      haptic("select");
      navigate(`#/classement-eleves/${mode}`);
    });
  });
  // Tap sur un élève (podium, liste ou HoF) → son livret
  root.querySelectorAll("[data-eleve-id]").forEach((el) => {
    el.addEventListener("click", () => {
      haptic("impact");
      navigate(`#/livret/${el.dataset.eleveId}`);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigate(`#/livret/${el.dataset.eleveId}`);
      }
    });
  });
}
