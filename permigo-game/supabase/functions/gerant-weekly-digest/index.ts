// ═════════════════════════════════════════════════════════════════════
// PermiGo — gerant-weekly-digest (lundi 7 h UTC)
// Pour chaque gérant : résumé de la semaine écoulée pour son auto-école.
//
// ⚠️ RÉÉCRIT le 30/07/2026 — suite du retrait de l'émission moniteur
// (cf. migrations 20260730120000 / 20260730130000). L'ancienne version
// comptait :
//   · `validations` (écrites UNIQUEMENT par un moniteur) → 0 à vie depuis
//     que la page de validation a été retirée. Vérifié en prod : 100 % des
//     validations historiques ont validated_by ≠ eleve_id, et la dernière
//     date de la semaine du 20/07.
//   · les heures de `sessions_moniteur` → la dernière ligne date du
//     07/06/2026, donc « 0h conduite » était DÉJÀ faux avant le retrait.
// Le gérant recevait donc chaque lundi « 0 validations · 0h conduite ».
// Le dernier envoi du 27/07 le prouve.
//
// La version actuelle compte ce qui BOUGE VRAIMENT depuis le pivot : ce que
// les ÉLÈVES font. Même correctif que côté moniteur, où « Élèves actifs »
// a été rebranché sur profiles.last_active_at.
//   ① compétences certifiées cette semaine  → self_validations
//   ② élèves actifs cette semaine           → profiles.last_active_at
//   ③ élèves à relancer (> 14 j sans venir) → inchangé, c'était déjà juste
// ═════════════════════════════════════════════════════════════════════
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SHARED_SECRET = Deno.env.get("DISPATCH_PUSH_SECRET") ?? "";

const DAY = 86400000;

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

    const since7 = new Date(Date.now() - 7 * DAY).toISOString();
    const since14 = new Date(Date.now() - 14 * DAY).toISOString();

    const { data: gerants } = await sb
      .from("profiles")
      .select("id, prenom, auto_ecole_id")
      .eq("role", "gerant")
      .not("auto_ecole_id", "is", null);

    let sent = 0,
      skipped = 0;

    for (const g of gerants ?? []) {
      try {
        // Les élèves de l'école : on en a besoin pour filtrer self_validations,
        // qui ne porte pas auto_ecole_id (elle est indexée sur l'élève).
        const { data: eleves } = await sb
          .from("profiles")
          .select("id, last_active_at")
          .eq("auto_ecole_id", g.auto_ecole_id)
          .eq("role", "eleve");

        const ids = (eleves ?? []).map((e: any) => e.id);

        // ① Compétences certifiées cette semaine (l'élève certifie lui-même
        //    depuis le pivot du 17/07 — c'est LE signal de progression).
        let nCertifs = 0;
        if (ids.length) {
          const { count } = await sb
            .from("self_validations")
            .select("*", { count: "exact", head: true })
            .in("eleve_id", ids)
            .gte("validated_at", since7);
          nCertifs = count ?? 0;
        }

        // ② Élèves venus cette semaine · ③ élèves muets depuis 14 jours.
        //    Un élève sans last_active_at n'est jamais venu → à relancer.
        const nActifs = (eleves ?? []).filter(
          (e: any) => (e.last_active_at ?? "") >= since7,
        ).length;
        const nRisk = (eleves ?? []).filter(
          (e: any) => !e.last_active_at || e.last_active_at < since14,
        ).length;

        // École muette sur toute la ligne → on n'envoie rien plutôt qu'un
        // digest à zéro (c'était le défaut de la version précédente).
        if (nCertifs === 0 && nActifs === 0) {
          skipped++;
          continue;
        }

        const title = "📊 Ta semaine à l'école";
        const bodyText =
          `${nCertifs} compétence${nCertifs > 1 ? "s" : ""} certifiée${nCertifs > 1 ? "s" : ""}` +
          ` · ${nActifs} élève${nActifs > 1 ? "s" : ""} actif${nActifs > 1 ? "s" : ""}` +
          ` · ${nRisk} à relancer`;

        const { error } = await sb.from("notifications").insert({
          user_id: g.id,
          type: "emotional_nudge",
          title,
          body: bodyText,
          data: {
            template_id: "gerant_weekly_digest",
            tone: "gentle",
            title,
            body: bodyText,
            cta: "Ouvrir Pulse",
            route: "#/",
            stats: { n_certifs: nCertifs, n_actifs: nActifs, n_risk: nRisk },
          },
        });
        if (error) {
          console.error("[gerant-digest]", g.id, error);
          skipped++;
        } else {
          sent++;
        }
      } catch (e) {
        console.error("[gerant-digest] err", g.id, e);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, skipped, total: gerants?.length ?? 0 }),
    );
  } catch (e: any) {
    console.error("[gerant-weekly-digest]", e);
    return new Response(JSON.stringify({ error: e?.message ?? "internal" }), {
      status: 500,
    });
  }
});
