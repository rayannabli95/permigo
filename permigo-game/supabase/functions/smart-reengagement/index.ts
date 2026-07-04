// ═════════════════════════════════════════════════════════════════════
// PermiGo — smart-reengagement
// Détecte les élèves bloqués près du palier 28 (entre 23 et 27 acquis) et inactifs
// depuis 5-13j → nudge custom "Tu es à X comp de l'examen blanc, ne lache pas".
//
// ⚠️ 2026-07-05 — FIX anti-spam : ne renvoie plus le MÊME nudge examen si déjà
//    envoyé à cet élève dans les 7 derniers jours (le cron tourne 1×/jour et la
//    condition reste vraie plusieurs jours → un élève stagnant recevait le même
//    "tu es si proche" chaque jour, ex. 9 jours d'affilée, 0 lu).
// ═════════════════════════════════════════════════════════════════════
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SHARED_SECRET = Deno.env.get("DISPATCH_PUSH_SECRET") ?? "";

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

    const since7d = new Date(Date.now() - 7 * 86400000).toISOString();

    // 1. Tous les élèves
    const { data: eleves } = await sb
      .from("profiles")
      .select("id, prenom, last_active_at")
      .eq("role", "eleve");

    let sent = 0,
      skipped = 0;

    for (const e of eleves ?? []) {
      try {
        // Inactif 5-13j (sweet spot pour ne pas perdre quelqu'un de prêt)
        if (!e.last_active_at) {
          skipped++;
          continue;
        }
        const daysSince = Math.floor(
          (Date.now() - new Date(e.last_active_at).getTime()) / 86400000,
        );
        if (daysSince < 5 || daysSince > 13) {
          skipped++;
          continue;
        }

        // N comp acquises
        const { count: nComp } = await sb
          .from("validations")
          .select("*", { count: "exact", head: true })
          .eq("eleve_id", e.id)
          .eq("statut", "acquis");

        if ((nComp ?? 0) < 23 || (nComp ?? 0) > 27) {
          skipped++;
          continue;
        }

        // Anti-répétition : déjà relancé (ce template) dans les 7 derniers jours ?
        const { count: recent } = await sb
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", e.id)
          .eq("type", "emotional_nudge")
          .eq("data->>template_id", "smart_reengagement_near_28")
          .gte("created_at", since7d);
        if ((recent ?? 0) > 0) {
          skipped++;
          continue;
        }

        const remaining = 28 - (nComp ?? 0);
        const title = `🎓 Plus que ${remaining} avant l'examen blanc`;
        const bodyText = `Tu es si proche, ${e.prenom} ! ${nComp}/31 acquises. Une dernière ligne droite.`;

        const { error } = await sb.from("notifications").insert({
          user_id: e.id,
          type: "emotional_nudge",
          title,
          body: bodyText,
          data: {
            template_id: "smart_reengagement_near_28",
            tone: "urgent",
            title,
            body: bodyText,
            cta: "Continuer",
            route: "#/parcours",
            stats: { n_comp: nComp, days_inactive: daysSince, remaining },
          },
        });
        if (error) skipped++;
        else sent++;
      } catch (err) {
        console.error("[smart-reengagement] err", e.id, err);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, skipped, total: eleves?.length ?? 0 }),
    );
  } catch (e: any) {
    console.error("[smart-reengagement]", e);
    return new Response(JSON.stringify({ error: e?.message ?? "internal" }), {
      status: 500,
    });
  }
});
