// ═════════════════════════════════════════════════════════════════════
// PermiGo — weekly-recap-eleve
// Dimanche soir (18h UTC) : pour chaque élève ACTIF cette semaine, un récap
// émotionnel de sa semaine (validations, quiz, jours actifs).
//
// ⚠️ 2026-07-05 — 3 fixes :
//  1. L'INSERT oubliait les colonnes `title`/`body` (NOT NULL) → 100 % des
//     envois échouaient en silence depuis le 31/05. Feature morte. Corrigé.
//  2. Type dédié `emotional_recap` (au lieu de `emotional_nudge`) : plus de
//     collision avec la dédup 360 min des relances (un récap était avalé si un
//     come_back était parti dans les 6h). Reste visible en bannière (emotional_%)
//     + liste. Anti-spam sur son propre type.
//  3. Audience = actifs cette semaine (last_active_at ≥ 7j) au lieu de
//     created_at < 90j → le bilan ne part qu'à des élèves réellement présents
//     (message toujours vrai), disjoint des relances d'absence.
// ═════════════════════════════════════════════════════════════════════
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SHARED_SECRET = Deno.env.get("DISPATCH_PUSH_SECRET") ?? "";

function pickRecapTemplate(stats: {
  n_comp: number;
  n_quiz: number;
  n_jours: number;
}) {
  // Sélection de tone selon l'intensité de la semaine
  if (stats.n_comp === 0 && stats.n_quiz === 0) {
    return {
      template_id: "recap_quiet_week",
      tone: "gentle",
      title: "💫 Ta semaine sur PermiGo",
      body: "Reprends quand tu veux. 5 minutes suffisent",
      cta: "Reprendre",
      route: "#/parcours",
    };
  }
  if (stats.n_comp >= 5) {
    return {
      template_id: "recap_strong_week",
      tone: "celebrate",
      title: "🔥 Quelle semaine",
      body: `${stats.n_comp} compétences · ${stats.n_quiz} quiz cette semaine`,
      cta: "Voir mon parcours",
      route: "#/parcours",
    };
  }
  if (stats.n_comp >= 2) {
    return {
      template_id: "recap_solid_week",
      tone: "celebrate",
      title: "✨ Belle semaine",
      body: `${stats.n_comp} compétences validées · ${stats.n_quiz} quiz · ${stats.n_jours} jours actifs`,
      cta: "Voir mon bilan",
      route: "#/parcours",
    };
  }
  // 0-1 comp mais activité quiz
  return {
    template_id: "recap_warm_week",
    tone: "warm",
    title: "🌱 Petit à petit",
    body: `${stats.n_quiz} quiz cette semaine. La prochaine sera la bonne`,
    cta: "Reprendre",
    route: "#/parcours",
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });
  try {
    const body = await req.json().catch(() => ({}));
    if (SHARED_SECRET && body?.secret !== SHARED_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - 7 * 86400000).toISOString();

    // 1. Élèves ACTIFS cette semaine (vraie activité, pas l'âge du compte)
    const { data: eleves, error: e1 } = await sb
      .from("profiles")
      .select("id, prenom, last_active_at")
      .eq("role", "eleve")
      .gte("last_active_at", since);
    if (e1) throw e1;

    let sent = 0,
      skipped = 0;

    for (const eleve of eleves ?? []) {
      try {
        // Anti-spam : un seul récap par 5 jours (sur SON propre type)
        const cutoff5d = new Date(Date.now() - 5 * 86400000).toISOString();
        const { count: recent } = await sb
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", eleve.id)
          .eq("type", "emotional_recap")
          .gte("created_at", cutoff5d);
        if ((recent ?? 0) > 0) {
          skipped++;
          continue;
        }

        // Compte validations + quiz + jours uniques de la semaine
        const [vRes, qRes] = await Promise.all([
          sb
            .from("validations")
            .select("validated_at", { count: "exact" })
            .eq("eleve_id", eleve.id)
            .eq("statut", "acquis")
            .gte("validated_at", since),
          sb
            .from("quiz_attempts")
            .select("completed_at")
            .eq("user_id", eleve.id)
            .gte("completed_at", since),
        ]);

        const n_comp = vRes.count ?? 0;
        const validations = vRes.data ?? [];
        const quizzes = qRes.data ?? [];
        const n_quiz = quizzes.length;
        const jours = new Set<string>();
        for (const v of validations)
          jours.add(String(v.validated_at).slice(0, 10));
        for (const q of quizzes) jours.add(String(q.completed_at).slice(0, 10));
        const n_jours = jours.size;

        const t = pickRecapTemplate({ n_comp, n_quiz, n_jours });

        const { error: e2 } = await sb.from("notifications").insert({
          user_id: eleve.id,
          type: "emotional_recap",
          title: t.title,
          body: t.body,
          data: {
            template_id: t.template_id,
            tone: t.tone,
            title: t.title,
            body: t.body,
            cta: t.cta,
            route: t.route,
            stats: { n_comp, n_quiz, n_jours },
          },
        });
        if (e2) {
          console.error("[weekly-recap] insert err", eleve.id, e2);
          skipped++;
        } else {
          sent++;
        }
      } catch (e) {
        console.error("[weekly-recap] eleve err", eleve.id, e);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, skipped, total: eleves?.length ?? 0 }),
    );
  } catch (e: any) {
    console.error("[weekly-recap-eleve]", e);
    return new Response(JSON.stringify({ error: e?.message ?? "internal" }), {
      status: 500,
    });
  }
});
