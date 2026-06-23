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
import { illus } from "@/components/enseignant/illus.js";
import { haptic } from "@/utils/haptic.js";

const STYLE = `<style>
  .ce-page {
    padding: 0 0 calc(90px + env(safe-area-inset-bottom,0px));
    max-width: 600px; margin: 0 auto;
    background: var(--bg); color: var(--ink);
    font-family: var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  }

  /* ── Hero arcade (parité mes-eleves / aujourdhui) ── */
  .ce-hero {
    position: relative; overflow: hidden;
    padding: calc(env(safe-area-inset-top, 0px) + var(--th, 52px) + 22px) 20px 26px;
    background: linear-gradient(150deg, #4f46e5, #6d6bff 60%, #8b5cf6);
    color: #fff; isolation: isolate;
    animation: ceHeroIn .45s var(--ease, ease) both;
    margin: 0 0 0;
  }
  .ce-hero::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 5px; z-index: 1;
    background: none;
    opacity: .85;
  }
  .ce-hero .ens-panneaux__sign { opacity: var(--o, .13); filter: saturate(1.1) brightness(1.1); }
  .ce-hero-content { position: relative; z-index: 2; }
  .ce-hero-kicker {
    font: 700 11px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .12em;
    margin: 0 0 7px;
  }
  .ce-hero-title {
    font: 700 clamp(24px, 7.5vw, 30px)/1.05 var(--ens-display, 'Fredoka'), sans-serif;
    color: #fff; margin: 0; letter-spacing: -.02em;
    text-shadow: 0 2px 14px rgba(11,13,26,.5);
  }
  .ce-hero-sub {
    font: 500 12.5px/1.5 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: rgba(255,255,255,.75); margin: 8px 0 0; max-width: 40ch;
  }
  .ce-hero-chip {
    display: inline-flex; align-items: center; gap: 5px; margin-top: 12px;
    padding: 5px 12px; border-radius: var(--ens-r-pill, 999px);
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
    font: 700 12px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: #fff;
  }
  /* Toggle segmenté Pratique / Révision */
  .ce-hero-toggle {
    display: inline-flex; gap: 3px; margin: 14px 0 2px; padding: 4px;
    border-radius: 999px; background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
  }
  .ce-hero-tog {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 15px; border-radius: 999px; text-decoration: none;
    font: 700 12.5px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: rgba(255,255,255,.78); white-space: nowrap;
    -webkit-tap-highlight-color: transparent; transition: background .15s, color .15s;
  }
  .ce-hero-tog.is-active { background: #fff; color: var(--ink); }
  @keyframes ceHeroIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) { .ce-hero { animation: none; } }

  /* Zone corps sous le hero */
  .ce-body { padding: 16px 16px 0; }

  /* ── (legacy) header — conservé pour usage drill éventuel ── */
  .ce-hd { margin-bottom: 18px; }
  .ce-h1 {
    font: 700 22px/1.2 var(--ens-display, 'Fredoka'), sans-serif;
    color: var(--ink); margin: 0 0 4px; letter-spacing: -.02em;
  }
  .ce-sub { font: 500 13px/1.4 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu2); margin: 0; }

  /* Leaderboard — cards arcade ens-card */
  .ce-list { display: flex; flex-direction: column; gap: 8px; }
  .ce-row {
    background: var(--su); border: 1px solid var(--bo);
    border-radius: var(--ens-r, var(--r-lg)); padding: 11px 14px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: var(--ens-shadow, var(--s0)); cursor: pointer; min-height: 44px;
    transition: border-color .15s cubic-bezier(0.23,1,0.32,1),
                box-shadow .15s cubic-bezier(0.23,1,0.32,1),
                transform .2s cubic-bezier(0.23,1,0.32,1);
  }
  .ce-row.top1 {
    border-color: color-mix(in srgb, var(--ens-amber, #f59e0b) 50%, transparent);
    background: linear-gradient(100deg, color-mix(in srgb, var(--ens-amber, #f59e0b) 9%, var(--su)), var(--su) 55%);
    box-shadow: 0 3px 0 0 color-mix(in srgb, var(--ens-amber, #f59e0b) 30%, transparent);
  }
  .ce-row:hover { border-color: var(--bo4); transform: translateY(-1px); box-shadow: var(--s1); }
  .ce-row:active { transform: scale(.97); }
  @media (prefers-reduced-motion: reduce) { .ce-row { transition: none; } }
  .ce-row:focus-visible { outline: 3px solid #4f46e5; outline-offset: 2px; }

  /* Rang : numéro neutre, ou médaille pour le top 3 */
  .ce-rank {
    width: 30px; height: 30px; flex-shrink: 0; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 800 13px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu2);
    background: var(--bg2);
  }
  .ce-rank.medal { color: #fff; background: var(--mg); box-shadow: 0 3px 10px -2px var(--mglow); }

  .ce-row-nom {
    flex: 1; min-width: 0;
    font: 700 14px/1.2 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--ink);
    letter-spacing: -.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ce-row-bar { width: 64px; flex-shrink: 0; }
  .ce-row-bar-t { height: 4px; background: var(--bo); border-radius: 2px; overflow: hidden; margin-bottom: 3px; }
  .ce-row-bar-f { height: 100%; background: linear-gradient(90deg, #4f46e5, #34d27b); border-radius: 2px; }
  /* Score en Fredoka tabulaire (ens-stat__num spirit) */
  .ce-row-score {
    font: 700 12px/1 var(--ens-display, 'Fredoka'), sans-serif;
    color: var(--mu2); text-align: right; font-variant-numeric: tabular-nums;
  }

  /* Streak — chip amber arcade */
  .ce-streak {
    display: inline-flex; align-items: center; gap: 3px; flex-shrink: 0;
    font: 700 11px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: #fff; background: var(--ens-amber, #f59e0b);
    padding: 4px 8px; border-radius: var(--ens-r-pill, 999px);
  }
  .ce-streak.off { color: var(--mu2); background: var(--bg2); }
  .ce-streak svg { flex-shrink: 0; }

  /* Hall of fame — section go vert */
  .ce-hof-title {
    font: 700 11px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    text-transform: uppercase; letter-spacing: .1em;
    color: var(--mu2); margin: 28px 0 12px; display: flex; align-items: center; gap: 8px;
  }
  .ce-hof-title::after { content: ''; flex: 1; height: 1px; background: var(--bo); }
  .ce-hof-row {
    background: color-mix(in srgb, #4f46e5 6%, transparent);
    border: 1px solid color-mix(in srgb, #4f46e5 22%, transparent);
    border-radius: var(--ens-r, var(--r)); padding: 12px 14px;
    display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
    cursor: pointer; min-height: 44px;
    transition: border-color .12s, transform .12s;
  }
  .ce-hof-row:hover { border-color: color-mix(in srgb, #4f46e5 40%, transparent); transform: translateY(-1px); }
  .ce-hof-row:active { transform: scale(.98); }
  .ce-hof-nom {
    flex: 1; min-width: 0;
    font: 700 13px/1.2 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    color: #4f46e5;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ce-hof-badge {
    display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
    font: 700 11px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: #fff;
    background: #4f46e5; padding: 4px 9px; border-radius: var(--ens-r-pill, 999px);
  }

  /* Empty state arcade */
  .ce-empty {
    padding: 40px 20px; text-align: center; color: var(--mu2);
    font: 500 14px/1.6 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
    background: var(--su); border: 1px solid var(--bo); border-radius: var(--ens-r, var(--r-lg));
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .ce-cohorte-note {
    display: inline-flex; align-items: center; gap: 5px;
    font: 700 11px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu2);
    background: var(--bg2); border: 1px solid var(--bo);
    padding: 5px 10px; border-radius: var(--ens-r-pill, 999px); margin-top: 8px;
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

  root.innerHTML = `${STYLE}<div class="ce-page">
    <div class="ce-hero">
      <div class="ce-hero-content">
        <p class="ce-hero-kicker">Classement</p>
        <h1 class="ce-hero-title">${isTheorie ? "Ligue Révision" : "Ligue Pratique"}</h1>
        <p class="ce-hero-sub">Chargement en cours…</p>
      </div>
    </div>
    <div class="ce-body"><div class="ce-empty">Chargement du classement…</div></div>
  </div>`;

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
    // Streak d'activité (RLS : l'enseignant lit les streaks de son école).
    // last_activity_date est nécessaire pour calculer le streak RÉEL : la valeur
    // stockée ne se reset côté serveur qu'au prochain login de l'élève → sans ce
    // garde-fou, un élève inactif depuis 3 j afficherait encore son ancien streak.
    sb.from("streaks").select("user_id, current_streak, last_activity_date"),
  ]);

  if (elevesRes.error) {
    toast("Impossible de charger le classement", "error");
    return;
  }

  const elevesMap = {};
  (elevesRes.data || []).forEach((e) => (elevesMap[e.id] = e));

  // Streak RÉEL par élève : vivant seulement si actif aujourd'hui ou hier,
  // sinon 0 (le reset serveur n'a pas encore eu lieu). 0 si aucune ligne.
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
      ${heroArcade(0, isTheorie)}
      <div class="ce-body">
        <div class="ce-empty">
          ${illus(isTheorie ? "route" : "podium", { size: 80 })}
          <strong style="font:700 15px/1.2 var(--ens-display,'Fredoka'),sans-serif;color:var(--ink)">${
            isTheorie ? "Aucune révision ces 30 jours" : "Aucun élève à classer"
          }</strong>
          <span style="max-width:28ch;text-align:center">${
            isTheorie
              ? "Partage l'app à tes élèves — leur score apparaîtra ici dès leur première révision."
              : "Attribue des élèves ou enregistre une séance — leurs compétences alimenteront ce classement."
          }</span>
        </div>
      </div>
    </div>`;
    wireBack(root);
    return;
  }

  root.innerHTML = `${STYLE}
    <div class="ce-page anim-slide-up">
      ${heroArcade(ranked.length, isTheorie)}

      <div class="ce-body">
        ${ranked.length > 0 ? `<div class="ce-list">${ranked.map((e, i) => renderRow(e, i + 1, isTheorie)).join("")}</div>` : ""}

        ${
          hof.length > 0
            ? `<div class="ce-hof-title">${icon("award", { size: 13, strokeWidth: 2.2 })} Hall of fame — permis obtenu</div>
               ${hof.map(renderHof).join("")}`
            : ""
        }
      </div>
    </div>`;

  wireBack(root);
  root.querySelectorAll("[data-eleve-id]").forEach((el) => {
    el.addEventListener("click", () => {
      haptic("impact");
      navigate(`#/livret/${el.dataset.eleveId}`);
    });
  });
}

/** Hero arcade clé-en-main pour la page classement. */
function heroArcade(n, isTheorie) {
  const sub = isTheorie
    ? `Classés par volume de révision · 30 derniers jours`
    : `Classés par compétences de conduite validées`;
  return `
    <div class="ce-hero">
      <div class="ce-hero-content">
        <p class="ce-hero-kicker">${isTheorie ? "Ligue Révision" : "Ligue Pratique"}</p>
        <h1 class="ce-hero-title">Classement élèves</h1>
        <p class="ce-hero-sub">${sub}</p>
        <div class="ce-hero-toggle" role="tablist" aria-label="Type de ligue">
          <a class="ce-hero-tog ${!isTheorie ? "is-active" : ""}" href="#/classement-eleves/pratique" role="tab" aria-selected="${!isTheorie}">${icon("check-circle", { size: 13, strokeWidth: 2.2 })} Pratique</a>
          <a class="ce-hero-tog ${isTheorie ? "is-active" : ""}" href="#/classement-eleves/theorie" role="tab" aria-selected="${isTheorie}">${icon("book-open", { size: 13, strokeWidth: 2.2 })} Révision</a>
        </div>
        ${n > 0 ? `<span class="ce-hero-chip" style="margin-top:14px">${icon("users", { size: 12, strokeWidth: 2 })} ${n} élève${n > 1 ? "s" : ""} classé${n > 1 ? "s" : ""}</span>` : ""}
      </div>
    </div>`;
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
    ? `${e.quizCount} révision${e.quizCount > 1 ? "s" : ""}`
    : `${e.acquis}/${REMC_TOTAL}`;
  const ariaScore = isTheorie
    ? `${e.quizCount} révision${e.quizCount > 1 ? "s" : ""}, ${e.avgScore}% de moyenne`
    : `${e.acquis} compétences validées sur ${REMC_TOTAL}`;
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
      <span class="ce-streak${e.streak > 0 ? "" : " off"}" title="${e.streak > 0 ? `Actif ${e.streak} jour${e.streak > 1 ? "s" : ""} de suite` : "Inactif — aucune révision récente"}">
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
