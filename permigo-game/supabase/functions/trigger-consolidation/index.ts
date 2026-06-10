// ═══════════════════════════════════════════════════════════════
// Edge Function : trigger-consolidation
// Cron horaire — scanne les validations dont consolidation_due_at ≤ now()
// et crée une notification pour l'élève (quiz 2 questions).
//
// Colonnes utilisées (vérifiées en DB) :
//   validations.consolidation_due_at   (timestamptz)
//   validations.consolidation_done_at  (timestamptz, NULL = pas encore fait)
//   notifications.data                 (jsonb)
//
// Setup :
//   supabase functions deploy trigger-consolidation --no-verify-jwt
//   supabase secrets set SERVICE_ROLE_KEY=xxx
//   Schedule via Supabase Dashboard → Database → Cron : every hour
// ═══════════════════════════════════════════════════════════════
import { createClient } from "jsr:@supabase/supabase-js@2";

// Supabase injecte SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL automatiquement.
const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ??
  "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const now = new Date().toISOString();

  // Validations dues et pas encore terminées
  const { data: dues, error } = await supabase
    .from("validations")
    .select("id, eleve_id, competence_id, consolidation_due_at")
    .lte("consolidation_due_at", now)
    .is("consolidation_done_at", null)
    .not("consolidation_due_at", "is", null)
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  if (!dues?.length) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }));
  }

  // Exclure les validations pour lesquelles une notif consolidation existe déjà
  const validationIds = dues.map((v) => v.id);
  const { data: existingNotifs } = await supabase
    .from("notifications")
    .select("data")
    .eq("type", "consolidation_quiz")
    .in(
      "user_id",
      dues.map((v) => v.eleve_id),
    );

  const alreadyNotifiedValidationIds = new Set(
    (existingNotifs || []).map((n) => n.data?.validation_id).filter(Boolean),
  );

  const toProcess = dues.filter((v) => !alreadyNotifiedValidationIds.has(v.id));

  if (!toProcess.length) {
    return new Response(
      JSON.stringify({ ok: true, processed: 0, skipped: dues.length }),
    );
  }

  // Crée les notifications
  const notifs = toProcess.map((v) => ({
    user_id: v.eleve_id,
    type: "consolidation_quiz",
    title: "Quiz de consolidation 🧠",
    body: "Il est temps de consolider ta compétence — 2 questions rapides !",
    data: { competence_id: v.competence_id, validation_id: v.id },
    read: false,
  }));

  const { error: notifErr } = await supabase
    .from("notifications")
    .insert(notifs);
  if (notifErr) {
    return new Response(JSON.stringify({ error: notifErr.message }), {
      status: 500,
    });
  }

  // Relais Web Push (best-effort) : la notif in-app seule n'est vue qu'à la
  // prochaine ouverture — le push, lui, fait revenir. dispatch-push gère
  // silencieusement les élèves sans subscription / clés VAPID absentes.
  let pushed = 0;
  for (const v of toProcess) {
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/dispatch-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          user_id: v.eleve_id,
          type: "consolidation_quiz",
          data: { competence_id: v.competence_id },
        }),
      });
      if (r.ok) pushed++;
    } catch {
      /* push best-effort : la notif in-app est déjà créée */
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed: toProcess.length, pushed }),
  );
});
