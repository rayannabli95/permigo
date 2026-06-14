// ═══════════════════════════════════════════════════════════════
// Enseignant — Classement de tes élèves du moment
// Podium (couronne #1) + liste, classé par compétences acquises.
// Lecture seule : aide le moniteur à repérer qui pousser / féliciter.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC_TOTAL } from "@/data/remc.js";
import { icon } from "@/utils/icons.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { fmtName } from "@/utils/fmt-name.js";

const STYLE = `<style>
  .ce-page {
    padding: 20px 16px calc(90px + env(safe-area-inset-bottom,0px));
    max-width: 600px; margin: 0 auto;
    background: var(--bg); color: var(--ink);
    font-family: 'Inter', sans-serif;
  }
  .ce-hd { margin-bottom: 18px; }
  .ce-h1 {
    font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); margin: 0 0 4px; letter-spacing: -.02em;
  }
  .ce-sub { font: 500 13px/1.4 'Inter', sans-serif; color: var(--mu2); margin: 0; }

  /* Leaderboard unifié (parité design côté élève) : médailles top-3 inline,
     lignes épurées, score à droite. Plus de podium séparé. */
  .ce-list { display: flex; flex-direction: column; gap: 8px; }
  .ce-row {
    background: var(--su); border: 1px solid var(--bo);
    border-radius: var(--r-lg); padding: 11px 14px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: var(--s0); cursor: pointer; min-height: 44px;
    transition: border-color .15s, transform .15s;
  }
  .ce-row.top1 { border-color: color-mix(in srgb, var(--am) 40%, transparent); background: linear-gradient(100deg, color-mix(in srgb, var(--am) 9%, var(--su)), var(--su) 55%); }
  .ce-row:hover { border-color: var(--bo4); transform: translateY(-1px); }
  .ce-row:active { transform: scale(.985); }
  .ce-row:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }

  /* Rang : numéro neutre, ou médaille pour le top 3 */
  .ce-rank {
    width: 30px; height: 30px; flex-shrink: 0; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 800 13px/1 'Plus Jakarta Sans', sans-serif; color: var(--mu2);
    background: var(--bg2);
  }
  .ce-rank.medal { color: #fff; background: var(--mg); box-shadow: 0 3px 10px -2px var(--mglow); }

  .ce-row-nom {
    flex: 1; min-width: 0;
    font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink);
    letter-spacing: -.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ce-row-bar { width: 64px; flex-shrink: 0; }
  .ce-row-bar-t { height: 4px; background: var(--bo); border-radius: 2px; overflow: hidden; margin-bottom: 3px; }
  .ce-row-bar-f { height: 100%; background: linear-gradient(90deg, var(--a), var(--a-lt)); border-radius: 2px; }
  .ce-row-score { font: 700 11px/1 'IBM Plex Mono', monospace; color: var(--mu2); text-align: right; }

  /* Streak 🔥 — chip discret, ton factuel (pas de pression) */
  .ce-streak {
    display: inline-flex; align-items: center; gap: 3px; flex-shrink: 0;
    font: 700 11px/1 'IBM Plex Mono', monospace; color: var(--amx);
    background: var(--amp); border: 1px solid color-mix(in srgb, var(--am) 22%, transparent);
    padding: 4px 7px; border-radius: var(--r-sm);
  }
  .ce-streak.off { color: var(--mu2); background: var(--bg2); border-color: var(--bo); }
  .ce-streak svg { flex-shrink: 0; }

  /* Hall of fame (permis obtenu) */
  .ce-hof-title {
    font: 700 11px/1 'Inter', sans-serif; text-transform: uppercase; letter-spacing: .1em;
    color: var(--mu2); margin: 28px 0 12px; display: flex; align-items: center; gap: 8px;
  }
  .ce-hof-title::after { content: ''; flex: 1; height: 1px; background: var(--bo); }
  .ce-hof-row {
    background: color-mix(in srgb, var(--a) 6%, transparent); border: 1px solid color-mix(in srgb, var(--a) 20%, transparent);
    border-radius: var(--r); padding: 12px 14px;
    display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
  }
  .ce-hof-nom {
    flex: 1; min-width: 0;
    font: 700 13px/1.2 'Inter', sans-serif; color: var(--adk);
    text-transform: uppercase; letter-spacing: .01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ce-hof-badge {
    display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
    font: 700 11px/1 'Inter', sans-serif; color: var(--adk);
    background: color-mix(in srgb, var(--a) 14%, transparent); padding: 4px 8px; border-radius: var(--r);
  }

  .ce-empty {
    padding: 40px 20px; text-align: center; color: var(--mu2);
    font: 500 14px/1.6 'Inter', sans-serif;
    background: var(--su); border: 1px solid var(--bo); border-radius: var(--r-lg);
  }
</style>`;

// mode = "pratique" (compétences REMC validées, défaut) | "theorie" (quiz)
export async function mount(root, mode) {
  const me = getCurUser();
  if (!me || (me.role !== "enseignant" && me.role !== "moniteur")) {
    root.innerHTML = "<p>Accès enseignant requis</p>";
    return;
  }

  const isTheorie = mode === "theorie";
  track("page.view", {
    page: "classement_eleves",
    role: me.role,
    mode: isTheorie ? "theorie" : "pratique",
  });

  root.innerHTML = `${STYLE}<div class="ce-page"><div class="ce-empty">Chargement du classement…</div></div>`;

  // ── Fetch : élèves de l'école, mes validations, examens « reçu », streaks ──
  const [elevesRes, valsRes, examsRes, streaksRes] = await Promise.all([
    sb
      .from("profiles")
      .select("id, prenom, nom, enseignant_id, avatar_url")
      .eq("role", "eleve"),
    sb
      .from("validations")
      .select("eleve_id, competence_id, validated_by, statut")
      .eq("statut", "acquis"),
    sb.from("examens").select("eleve_id, statut, created_at"),
    // Streak d'activité (RLS : l'enseignant lit les streaks de son école)
    sb.from("streaks").select("user_id, current_streak"),
  ]);

  if (elevesRes.error) {
    toast("Impossible de charger le classement", "error");
    return;
  }

  const elevesMap = {};
  (elevesRes.data || []).forEach((e) => (elevesMap[e.id] = e));

  // Streak courant par élève (0 si aucune ligne)
  const streakByEleve = {};
  (streaksRes.data || []).forEach((s) => {
    streakByEleve[s.user_id] = s.current_streak || 0;
  });

  // Acquis distincts par élève + ensemble des élèves que j'ai validés
  const acquisByEleve = {};
  const validatedByMe = new Set();
  (valsRes.data || []).forEach((v) => {
    if (v.competence_id)
      (acquisByEleve[v.eleve_id] ||= new Set()).add(v.competence_id);
    if (v.validated_by === me.id) validatedByMe.add(v.eleve_id);
  });

  // Dernier examen par élève (le plus récent fait foi) → statut « reçu »
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

  // ── Mode théorie : quiz des élèves (30 j) → volume de révision + score moyen ──
  // Le moniteur lit quiz_attempts de ses élèves (même requête que la KPI
  // « Taux quiz » d'Analyses). score sur 100, réussite ≥ 60.
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
  // Tri : pratique → compétences acquises ; théorie → volume de quiz puis score.
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

  if (ranked.length === 0 && hof.length === 0) {
    root.innerHTML = `${STYLE}<div class="ce-page anim-slide-up">
      ${header(ranked.length, isTheorie)}
      <div class="ce-empty">${
        isTheorie
          ? "Aucun quiz fait par tes élèves ces 30 derniers jours.<br>Incite-les à réviser en autonomie entre deux leçons."
          : "Aucun élève à classer pour l'instant.<br>Enregistre des séances pour faire monter ton classement."
      }</div>
    </div>`;
    wireBack(root);
    return;
  }

  root.innerHTML = `${STYLE}
    <div class="ce-page anim-slide-up">
      ${header(ranked.length, isTheorie)}

      ${ranked.length > 0 ? `<div class="ce-list">${ranked.map((e, i) => renderRow(e, i + 1, isTheorie)).join("")}</div>` : ""}

      ${
        hof.length > 0
          ? `<div class="ce-hof-title">${icon("award", { size: 13, strokeWidth: 2.2 })} Hall of fame — permis obtenu</div>
             ${hof.map(renderHof).join("")}`
          : ""
      }
    </div>`;

  wireBack(root);
  root.querySelectorAll("[data-eleve-id]").forEach((el) => {
    el.addEventListener("click", () => {
      navigate(`#/livret/${el.dataset.eleveId}`);
    });
  });
}

function header(n, isTheorie) {
  return `<header class="ce-hd">
    <h1 class="ce-h1">${isTheorie ? "Ligue théorie" : "Ligue pratique"}</h1>
    <p class="ce-sub">${n} élève${n > 1 ? "s" : ""} en course · ${
      isTheorie
        ? "classés par révision quiz (30 j)"
        : "classés par compétences acquises"
    }</p>
  </header>`;
}

// Médailles top-3 (parité côté élève : badge rond coloré + glow)
const MEDALS = {
  1: {
    grad: "linear-gradient(135deg,var(--am),var(--amk))",
    glow: "rgba(245,158,11,.5)",
    ico: "crown",
  },
  2: {
    grad: "linear-gradient(135deg,#cbd5e1,#94a3b8)",
    glow: "rgba(148,163,184,.45)",
    ico: null,
  },
  3: {
    grad: "linear-gradient(135deg,#d97706,#92400e)",
    glow: "rgba(217,119,6,.4)",
    ico: null,
  },
};

function renderRow(e, rank, isTheorie) {
  // pratique : barre = % de compétences acquises, score = X/31.
  // théorie  : barre = score moyen quiz, score = nombre de quiz révisés.
  const pct = isTheorie
    ? e.avgScore
    : REMC_TOTAL > 0
      ? Math.round((e.acquis / REMC_TOTAL) * 100)
      : 0;
  const scoreLabel = isTheorie
    ? `${e.quizCount} quiz`
    : `${e.acquis}/${REMC_TOTAL}`;
  const ariaScore = isTheorie
    ? `${e.quizCount} quiz révisés, ${e.avgScore}% de moyenne`
    : `${e.acquis} sur ${REMC_TOTAL}`;
  const nom = esc(
    fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "Élève",
  );
  const m = MEDALS[rank];
  const rankEl = m
    ? `<div class="ce-rank medal" style="--mg:${m.grad};--mglow:${m.glow}">${m.ico ? icon(m.ico, { size: 15, strokeWidth: 2.2, color: "#fff" }) : rank}</div>`
    : `<div class="ce-rank">${rank}</div>`;
  return `
    <div class="ce-row ${rank === 1 ? "top1" : ""}" data-eleve-id="${esc(e.id)}" role="button" tabindex="0"
         aria-label="${nom} — rang ${rank}, ${ariaScore}, série ${e.streak} jour${e.streak > 1 ? "s" : ""}">
      ${rankEl}
      <div style="flex-shrink:0">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 36)}</div>
      <span class="ce-row-nom">${nom}</span>
      <span class="ce-streak${e.streak > 0 ? "" : " off"}" title="${e.streak} jour${e.streak > 1 ? "s" : ""} d'activité d'affilée">
        ${icon("flame", { size: 12, strokeWidth: 2 })} ${e.streak}j
      </span>
      <div class="ce-row-bar">
        <div class="ce-row-bar-t"><div class="ce-row-bar-f" style="width:${pct}%"></div></div>
        <div class="ce-row-score">${scoreLabel}</div>
      </div>
    </div>`;
}

function renderHof(e) {
  const nom = esc(
    fmtName([e.prenom, e.nom].filter(Boolean).join(" ")) || "Élève",
  );
  return `
    <div class="ce-hof-row" data-eleve-id="${esc(e.id)}" role="button" tabindex="0">
      <div style="flex-shrink:0">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 36)}</div>
      <span class="ce-hof-nom">${nom}</span>
      <span class="ce-hof-badge">${icon("award", { size: 12, strokeWidth: 2.4 })} Permis obtenu</span>
    </div>`;
}

function wireBack(root) {
  root
    .querySelector("#ce-back")
    ?.addEventListener("click", () => navigate("#/eleves"));
}
