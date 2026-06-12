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

  /* Podium */
  .ce-podium {
    display: grid;
    grid-template-columns: 1fr 1.15fr 1fr;
    align-items: end;
    gap: 10px;
    margin-bottom: 22px;
  }
  .ce-pod {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--rl);
    padding: 14px 8px 12px;
    text-align: center;
    box-shadow: var(--s1);
    position: relative;
  }
  .ce-pod.p1 {
    border-color: color-mix(in srgb, var(--am) 45%, transparent);
    background: linear-gradient(180deg, color-mix(in srgb, var(--am) 12%, var(--su)), var(--su));
    padding-top: 26px;
  }
  .ce-crown {
    position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
    color: var(--am-txt);
    filter: drop-shadow(0 2px 4px rgba(245,158,11,.4));
  }
  .ce-pod-av { display: inline-flex; margin-bottom: 8px; }
  .ce-pod-rank {
    position: absolute; top: 8px; left: 8px;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 800 11px/1 'Plus Jakarta Sans', sans-serif; color: #fff;
  }
  .ce-pod.p1 .ce-pod-rank { background: linear-gradient(135deg,var(--am),var(--amk)); }
  .ce-pod.p2 .ce-pod-rank { background: linear-gradient(135deg,var(--mu2),var(--mu3)); }
  .ce-pod.p3 .ce-pod-rank { background: linear-gradient(135deg,var(--amx),#92400e); }
  .ce-pod-nom {
    font: 700 13px/1.2 'Inter', sans-serif; color: var(--ink);
    text-transform: uppercase; letter-spacing: .01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ce-pod-score {
    font: 800 16px/1 'IBM Plex Mono', monospace; color: var(--adk); margin-top: 4px;
  }
  .ce-pod-score span { font-size: .65em; color: var(--mu2); }

  /* Liste */
  .ce-list { display: flex; flex-direction: column; gap: 8px; }
  .ce-row {
    background: var(--su); border: 1px solid var(--bo);
    border-radius: var(--r); padding: 12px 14px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: var(--s0); cursor: pointer; min-height: 44px;
    transition: border-color .15s, transform .15s;
  }
  .ce-row:hover { border-color: var(--bo4); transform: translateY(-1px); }
  .ce-row:active { transform: scale(.985); }
  .ce-row:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
  .ce-row-rank {
    font: 800 14px/1 'Plus Jakarta Sans', sans-serif; color: var(--mu2);
    width: 26px; text-align: center; flex-shrink: 0;
  }
  .ce-row-nom {
    flex: 1; min-width: 0;
    font: 600 13px/1.2 'Inter', sans-serif; color: var(--ink);
    text-transform: uppercase; letter-spacing: .01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ce-row-bar { width: 70px; flex-shrink: 0; }
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
  .ce-pod-streak {
    display: inline-flex; align-items: center; gap: 3px; margin-top: 5px;
    font: 700 10px/1 'IBM Plex Mono', monospace; color: var(--amx);
  }
  .ce-pod-streak.off { color: var(--mu2); }

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

export async function mount(root) {
  const me = getCurUser();
  if (!me || (me.role !== "enseignant" && me.role !== "moniteur")) {
    root.innerHTML = "<p>Accès enseignant requis</p>";
    return;
  }

  track("page.view", { page: "classement_eleves", role: me.role });

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

  const all = Array.from(mesIds).map((id) => {
    const e = elevesMap[id] || { prenom: "Élève", nom: "" };
    return {
      id,
      prenom: e.prenom,
      nom: e.nom,
      avatar_url: e.avatar_url,
      acquis: acquisByEleve[id]?.size || 0,
      streak: streakByEleve[id] || 0,
      recu: lastExam[id] === "recu",
    };
  });

  // Hall of fame = permis obtenu ; classement = les autres, triés par acquis
  const hof = all.filter((e) => e.recu);
  const ranked = all
    .filter((e) => !e.recu)
    .sort(
      (a, b) =>
        b.acquis - a.acquis || (a.prenom || "").localeCompare(b.prenom || ""),
    );

  if (ranked.length === 0 && hof.length === 0) {
    root.innerHTML = `${STYLE}<div class="ce-page anim-slide-up">
      ${header(ranked.length)}
      <div class="ce-empty">Aucun élève à classer pour l'instant.<br>Enregistre des séances pour faire monter ton classement.</div>
    </div>`;
    wireBack(root);
    return;
  }

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  // Ordre visuel du podium : 2 - 1 - 3
  const podiumOrder = [top3[1], top3[0], top3[2]];

  root.innerHTML = `${STYLE}
    <div class="ce-page anim-slide-up">
      ${header(ranked.length)}

      ${
        top3.length > 0
          ? `<div class="ce-podium">${podiumOrder.map((e, i) => renderPod(e, i)).join("")}</div>`
          : ""
      }

      ${rest.length > 0 ? `<div class="ce-list">${rest.map((e, i) => renderRow(e, i + 4)).join("")}</div>` : ""}

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

function header(n) {
  return `<header class="ce-hd">
    <h1 class="ce-h1">Classement de tes élèves</h1>
    <p class="ce-sub">${n} élève${n > 1 ? "s" : ""} en course · classés par compétences acquises</p>
  </header>`;
}

function renderPod(e, visualIdx) {
  if (!e) return `<div></div>`;
  // visualIdx : 0 = #2 (gauche), 1 = #1 (centre), 2 = #3 (droite)
  const rank = visualIdx === 0 ? 2 : visualIdx === 1 ? 1 : 3;
  const pct = REMC_TOTAL > 0 ? Math.round((e.acquis / REMC_TOTAL) * 100) : 0;
  return `
    <div class="ce-pod p${rank}" data-eleve-id="${esc(e.id)}" role="button" tabindex="0">
      ${rank === 1 ? `<span class="ce-crown">${icon("crown", { size: 26, strokeWidth: 2 })}</span>` : ""}
      <span class="ce-pod-rank">${rank}</span>
      <div class="ce-pod-av">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, rank === 1 ? 52 : 44)}</div>
      <div class="ce-pod-nom">${esc(e.prenom || "Élève")}</div>
      <div class="ce-pod-score">${e.acquis}<span>/${REMC_TOTAL}</span></div>
      <div style="font:500 10px/1 'Inter',sans-serif;color:var(--mu2);margin-top:3px">${pct}%</div>
      <div class="ce-pod-streak${e.streak > 0 ? "" : " off"}" title="${e.streak} jour${e.streak > 1 ? "s" : ""} d'activité d'affilée">
        ${icon("flame", { size: 11, strokeWidth: 2 })} ${e.streak}j
      </div>
    </div>`;
}

function renderRow(e, rank) {
  const pct = REMC_TOTAL > 0 ? Math.round((e.acquis / REMC_TOTAL) * 100) : 0;
  const nom = esc([e.prenom, e.nom].filter(Boolean).join(" ") || "Élève");
  return `
    <div class="ce-row" data-eleve-id="${esc(e.id)}" role="button" tabindex="0"
         aria-label="${nom} — rang ${rank}, ${e.acquis} sur ${REMC_TOTAL}, série ${e.streak} jour${e.streak > 1 ? "s" : ""}">
      <span class="ce-row-rank">${rank}</span>
      <div style="flex-shrink:0">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 36)}</div>
      <span class="ce-row-nom">${nom}</span>
      <span class="ce-streak${e.streak > 0 ? "" : " off"}" title="${e.streak} jour${e.streak > 1 ? "s" : ""} d'activité d'affilée">
        ${icon("flame", { size: 12, strokeWidth: 2 })} ${e.streak}j
      </span>
      <div class="ce-row-bar">
        <div class="ce-row-bar-t"><div class="ce-row-bar-f" style="width:${pct}%"></div></div>
        <div class="ce-row-score">${e.acquis}/${REMC_TOTAL}</div>
      </div>
    </div>`;
}

function renderHof(e) {
  const nom = esc([e.prenom, e.nom].filter(Boolean).join(" ") || "Élève");
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
