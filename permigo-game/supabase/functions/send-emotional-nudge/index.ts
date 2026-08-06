// ═════════════════════════════════════════════════════════════════════
// PermiGo — send-emotional-nudge v3 (smart timing)
// Tourne TOUTES LES HEURES. Pour chaque élève, check si l'heure actuelle UTC
// correspond à son heure de connexion habituelle. Si oui, send nudge.
// Antispam : skip si nudge envoyé dans les 36h (+ un come_back max 1×/7j).
//
// ⚠️ 2026-07-05 — FIX CIBLAGE (bug « une semaine sans toi » à un élève actif) :
//    les relances d'absence (come_back_3d/7d) se basent désormais sur la VRAIE
//    activité `profiles.last_active_at` (tenue à jour par le trigger sur
//    quiz_attempts), et PLUS sur la dernière VALIDATION moniteur (rare) — qui
//    faisait passer pour « absents 7 jours » des élèves connectés tous les jours.
// ═════════════════════════════════════════════════════════════════════
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SHARED_SECRET = Deno.env.get("DISPATCH_PUSH_SECRET") ?? "";

const TEMPLATES: Record<string, any> = {
  palier_1: {
    title: "⚡ Une seule compétence",
    body: "Une seule compétence te sépare du palier {target} 💪",
    cta: "Y aller",
    route: "#/parcours",
    tone: "urgent",
  },
  palier_2: {
    title: "🔥 Tu y es presque",
    body: "Plus que {n} compétences pour atteindre le palier {target}",
    cta: "Continuer",
    route: "#/parcours",
    tone: "celebrate",
  },
  come_back_3d: {
    title: "👋 Ton parcours t'attend",
    body: "3 jours déjà. 5 minutes suffisent pour reprendre le rythme",
    cta: "Reprendre",
    route: "#/parcours",
    tone: "gentle",
  },
  come_back_7d: {
    title: "💙 On pense à toi",
    body: "Une semaine sans toi. Reviens quand tu veux, on est là",
    cta: "Revenir",
    route: "#/",
    tone: "warm",
  },
  week_summary: {
    title: "✨ Belle semaine",
    body: "{n_comp} compétences cette semaine. Bravo",
    cta: "Voir mon bilan",
    route: "#/",
    tone: "celebrate",
  },
};

function hydrate(template: any, vars: Record<string, any>) {
  const repl = (s: string) =>
    s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  return {
    title: repl(template.title),
    body: repl(template.body),
    cta: template.cta,
    route: template.route,
    tone: template.tone,
  };
}

function nextPalier(n: number): number | null {
  for (const p of [10, 15, 20, 25, 30]) if (n < p) return p;
  return null;
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

    const currentHourUTC = new Date().getUTCHours();

    // 1. Élèves actifs (créés <90j) — on lit AUSSI last_active_at (le bon signal)
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: eleves, error: e1 } = await sb
      .from("profiles")
      .select("id, prenom, created_at, last_active_at")
      .eq("role", "eleve")
      .gte("created_at", cutoff);
    if (e1) throw e1;

    const since36h = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
    let sent = 0,
      skipped = 0,
      mismatch_hour = 0;

    for (const eleve of eleves ?? []) {
      try {
        // 2. Check heure optimale (default 10h UTC si pas d'historique)
        const { data: optHr } = await sb.rpc("get_user_optimal_hour", {
          p_user_id: eleve.id,
        });
        const optimalHour = typeof optHr === "number" ? optHr : 10;

        // Tolérance ±1 heure autour de l'heure optimale
        const diff = Math.min(
          Math.abs(currentHourUTC - optimalHour),
          24 - Math.abs(currentHourUTC - optimalHour),
        );
        if (diff > 1) {
          mismatch_hour++;
          continue;
        }

        // 3. Anti-spam : skip si nudge dans les 36h
        const { count: recent } = await sb
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", eleve.id)
          .eq("type", "emotional_nudge")
          .gte("created_at", since36h);
        if ((recent ?? 0) > 0) {
          skipped++;
          continue;
        }

        // 4. Contexte user
        const { count: acquired_count } = await sb
          .from("validations")
          .select("*", { count: "exact", head: true })
          .eq("eleve_id", eleve.id)
          .eq("statut", "acquis");

        // ⚠️ FIX ciblage : "jours d'absence" = VRAIE activité (last_active_at),
        // PAS la dernière validation moniteur. Un élève qui révise tous les
        // jours a last_active_at récent → il ne recevra JAMAIS "une semaine
        // sans toi" (le bug d'origine lisait validations.validated_at).
        const lastDate = eleve.last_active_at
          ? new Date(eleve.last_active_at)
          : null;
        const daysSince = lastDate
          ? Math.floor((Date.now() - lastDate.getTime()) / 86400000)
          : null;

        // 5. Sélection template par priorité
        let template: any = null;
        let vars: any = {};
        const palier = nextPalier(acquired_count ?? 0);
        const n_to_palier = palier ? palier - (acquired_count ?? 0) : null;
        const today = new Date();
        const isSunday = today.getUTCDay() === 0;

        if (daysSince !== null && daysSince >= 7 && daysSince < 30) {
          template = TEMPLATES.come_back_7d;
        } else if (daysSince !== null && daysSince >= 3 && daysSince < 7) {
          template = TEMPLATES.come_back_3d;
        } else if (n_to_palier === 1) {
          template = TEMPLATES.palier_1;
          vars = { target: palier };
        } else if (n_to_palier === 2) {
          template = TEMPLATES.palier_2;
          vars = { n: 2, target: palier };
        } else if (isSunday && daysSince !== null && daysSince < 7) {
          const { count: nWeek } = await sb
            .from("validations")
            .select("*", { count: "exact", head: true })
            .eq("eleve_id", eleve.id)
            .gte("validated_at", since7d);
          if ((nWeek ?? 0) >= 1) {
            template = TEMPLATES.week_summary;
            vars = { n_comp: nWeek };
          }
        }

        if (!template) {
          skipped++;
          continue;
        }

        const tplId = Object.keys(TEMPLATES).find(
          (k) => TEMPLATES[k] === template,
        );

        // Anti-répétition des relances d'ABSENCE : un come_back n'est envoyé
        // qu'une fois par semaine (l'anti-spam 36h ne suffisait pas → un absent
        // recevait le même "on pense à toi" plusieurs fois en 7 jours).
        if (tplId && tplId.startsWith("come_back")) {
          const { count: recentComeback } = await sb
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", eleve.id)
            .eq("type", "emotional_nudge")
            .like("data->>template_id", "come_back%")
            .gte("created_at", since7d);
          if ((recentComeback ?? 0) > 0) {
            skipped++;
            continue;
          }
        }

        const payload = hydrate(template, vars);

        const { error: e2 } = await sb.from("notifications").insert({
          user_id: eleve.id,
          type: "emotional_nudge",
          title: payload.title,
          body: payload.body,
          data: {
            template_id: tplId,
            tone: payload.tone,
            title: payload.title,
            body: payload.body,
            cta: payload.cta,
            route: payload.route,
          },
        });
        if (e2) {
          console.error("[emotional-nudge] insert err", eleve.id, e2);
          skipped++;
        } else {
          sent++;
        }
      } catch (e) {
        console.error("[emotional-nudge] eleve err", eleve.id, e);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent,
        skipped,
        mismatch_hour,
        total: eleves?.length ?? 0,
        hour_utc: currentHourUTC,
      }),
    );
  } catch (e: any) {
    console.error("[send-emotional-nudge]", e);
    return new Response(JSON.stringify({ error: e?.message ?? "internal" }), {
      status: 500,
    });
  }
});
