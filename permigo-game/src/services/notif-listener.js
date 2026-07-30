// ═══════════════════════════════════════════════════════════════
// Notif Listener — polling notifications toutes les 60s
// Lance automatiquement les quiz post-validation ou consolidation
// Démarrer dans main.js après login : startNotifListener()
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { track } from "@/services/analytics.js";
import { toast } from "@/components/common/toast.js";
import { burstConfetti } from "@/components/common/confetti.js";
import { markHasValidated } from "@/services/web-push.js";
import { playNotify } from "@/utils/sound.js";

const POLL_INTERVAL = 60_000; // 60 secondes (allégé : 2× moins de requêtes réseau)
let _intervalId = null;
let _quizOpen = false;

export function startNotifListener() {
  if (_intervalId) return;
  const me = getCurUser();
  import.meta.env.DEV &&
    console.log(`[notif-listener] starting, user=${me?.id ?? "none"}`);
  poll();
  _intervalId = setInterval(poll, POLL_INTERVAL);
  _wireVisibility();
}

export function stopNotifListener() {
  import.meta.env.DEV && console.log("[notif-listener] stopping");
  clearInterval(_intervalId);
  _intervalId = null;
}

// Pause le polling quand l'app passe en arrière-plan (batterie/réseau),
// reprend immédiatement au retour au premier plan.
let _visWired = false;
function _wireVisibility() {
  if (_visWired) return;
  _visWired = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (_intervalId) {
        clearInterval(_intervalId);
        _intervalId = null;
      }
    } else if (!_intervalId && getCurUser()) {
      poll();
      _intervalId = setInterval(poll, POLL_INTERVAL);
    }
  });
}

// ─── Polling ─────────────────────────────────────────────────────
async function poll() {
  const me = getCurUser();
  import.meta.env.DEV &&
    console.log(
      `[notif-listener] poll cycle — user=${me?.id ?? "none"} quizOpen=${_quizOpen}`,
    );

  if (!me || _quizOpen) return;

  try {
    // IMPORTANT: user_id dans notifications = profiles.id (pas auth.users.id)
    // On NE récupère QUE les types que ce listener consomme (auto-lancement de
    // quiz). Sinon on marquait `read` toute notif non-lue (comp_acquise,
    // relance, session_confirmation…) avant que l'élève la voie → la cloche
    // n'alertait jamais pour ces types.
    const { data, error } = await sb
      .from("notifications")
      .select("id, type, data")
      .eq("user_id", me.id)
      .eq("read", false)
      .in("type", ["post_validation_quiz", "consolidation_quiz"])
      .order("created_at", { ascending: true })
      .limit(5);

    import.meta.env.DEV &&
      console.log(
        `[notif-listener] found ${data?.length ?? 0} unread notifs`,
        error ?? "",
      );

    if (error || !data?.length) return;

    for (const notif of data) {
      import.meta.env.DEV &&
        console.log(
          `[notif-listener] dispatching type=${notif.type} id=${notif.id}`,
        );
      // Marquer LU avant de traiter → anti double-trigger même si quiz crash
      await sb.from("notifications").update({ read: true }).eq("id", notif.id);
      await dispatch(notif, me);
    }
  } catch (e) {
    console.warn("[notif-listener] poll error", e);
  }
}

// ─── Dispatch par type ───────────────────────────────────────────
async function dispatch(notif, me) {
  switch (notif.type) {
    case "post_validation_quiz":
      // Dopamine: celebrate before launching quiz
      _celebrateValidation(notif.data?.competence_id);
      await handleQuiz(notif, me, "post_validation", 3);
      break;
    case "consolidation_quiz":
      await handleQuiz(notif, me, "consolidation", 2);
      break;
    default:
      import.meta.env.DEV &&
        console.log(`[notif-listener] unknown notif type: ${notif.type}`);
  }
}

async function _celebrateValidation(compId) {
  // Marque que l'élève a ≥1 validation → débloque le banner push
  markHasValidated();

  playNotify();
  setTimeout(() => {
    burstConfetti({ count: 55, power: 10, spread: Math.PI * 0.5 });
  }, 200);
  const compLabel = compId ? ` (${compId})` : "";
  toast(`Nouvelle compétence acquise${compLabel} !`, "success", 4000);

  // Trigger éventuel d'un Celebrate Screen fullscreen sur les paliers majeurs
  // (1ère validation, 10 acquises, 28 acquises = prêt examen, 31 acquises = permis)
  try {
    const me = getCurUser();
    if (!me?.id) return;
    const [valRes, selfValRes] = await Promise.allSettled([
      sb
        .from("validations")
        .select("competence_id")
        .eq("eleve_id", me.id)
        .eq("statut", "acquis"),
      // Validation autonome (élève solo, valider-seul.js) : table séparée de
      // `validations`, fusionnée pour que les paliers 10/28/31 se déclenchent
      // aussi pour un compte sans moniteur. Même pattern que accueil.js.
      sb.from("self_validations").select("competence_id").eq("eleve_id", me.id),
    ]);
    const _compSet = new Set(
      (valRes.value?.data || []).map((v) => v.competence_id),
    );
    for (const s of selfValRes.value?.data || []) _compSet.add(s.competence_id);
    const count = _compSet.size;
    if (typeof count === "number") {
      const { maybeCelebrateMilestone } =
        await import("@/components/common/celebrate-screen.js");
      // Petit délai pour laisser le confetti + toast respirer
      setTimeout(() => maybeCelebrateMilestone(count), 800);
    }
  } catch (e) {
    console.warn("[notif-listener] milestone celebrate failed", e);
  }
}

async function handleQuiz(notif, me, type, nbQuestions) {
  const competenceId = notif.data?.competence_id;
  if (!competenceId || _quizOpen) return;

  import.meta.env.DEV &&
    console.log(
      `[notif-listener] launching quiz type=${type} competence=${competenceId}`,
    );
  track("notification.opened", {
    type: notif.type,
    competence_id: competenceId,
  });

  _quizOpen = true;
  try {
    const { lancerQuiz } = await import("@/services/quiz-engine.js");
    await lancerQuiz({
      competenceId,
      type,
      nbQuestions,
      onComplete: async (score, total) => {
        _quizOpen = false;
        const scorePct = Math.round((score / total) * 100);
        const { data, error } = await sb.rpc("submit_competence_quiz", {
          p_competence_id: competenceId,
          p_score: scorePct,
          p_type: type,
        });
        if (error) {
          console.warn("[notif-listener] submit_competence_quiz error", error);
          return;
        }
        const result = data?.[0] ?? data ?? {};
        track("quiz.result_saved", {
          source: "notif_listener",
          competence_id: competenceId,
          type,
          score_pct: scorePct,
          passed: !!result.passed,
          validated: !!result.validated,
        });
      },
    });
  } catch (e) {
    _quizOpen = false;
    console.warn("[notif-listener] quiz launch failed", e);
  }
}
