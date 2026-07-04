// ═════════════════════════════════════════════════════════════════════
// PermiGo — monthly-recap-moniteur
// 1er de chaque mois (8h UTC) : récap du mois précédent à chaque moniteur ACTIF.
//
// ⚠️ 2026-07-05 — 3 fixes :
//  1. « 👑 #1 ce mois-ci » n'apparaît QUE s'il y a une vraie cohorte (≥5
//     moniteurs classés). Avant : un seul moniteur classé recevait « #1 »
//     (premier de personne = mensonge à un payeur).
//  2. Audience = TOUS les moniteurs actifs (rôle enseignant), pas seulement
//     ceux avec ≥1 séance confirmée. Avant : 6 moniteurs sur 7 ne recevaient
//     RIEN. On skippe seulement ceux à activité nulle (évite un « 0h »).
//  3. Type dédié `moniteur_recap` (au lieu de `emotional_nudge`) → plus de
//     collision de dédup + affichage propre (« Bilan du mois »).
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

    // 1. Fenêtre du mois précédent
    const now = new Date();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const rawLabel = lastMonthStart.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    const monthLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

    // 2. Séances du mois passé (confirmées)
    const { data: sessions, error: e1 } = await sb
      .from("sessions_moniteur")
      .select(
        "moniteur_id, eleve_id, duration_minutes, session_date, confirmation_status",
      )
      .gte("session_date", lastMonthStart.toISOString().slice(0, 10))
      .lt("session_date", lastMonthEnd.toISOString().slice(0, 10))
      .in("confirmation_status", ["confirmed", "auto"]);
    if (e1) throw e1;

    const perMoniteur = new Map<
      string,
      { minutes: number; eleves: Set<string>; days: Set<string> }
    >();
    for (const s of sessions ?? []) {
      const m = perMoniteur.get(s.moniteur_id) ?? {
        minutes: 0,
        eleves: new Set(),
        days: new Set(),
      };
      m.minutes += s.duration_minutes;
      m.eleves.add(s.eleve_id);
      m.days.add(String(s.session_date));
      perMoniteur.set(s.moniteur_id, m);
    }

    // 3. Validations du mois par moniteur
    const { data: validations } = await sb
      .from("validations")
      .select("validated_by, eleve_id")
      .gte("validated_at", lastMonthStart.toISOString())
      .lt("validated_at", lastMonthEnd.toISOString())
      .eq("statut", "acquis");
    const valsCount = new Map<string, number>();
    for (const v of validations ?? []) {
      if (v.validated_by)
        valsCount.set(v.validated_by, (valsCount.get(v.validated_by) ?? 0) + 1);
    }

    // 4. Rang (parmi ceux qui ont réellement travaillé) — n'affiché QUE si
    //    la cohorte est assez grande pour que « #1 » veuille dire quelque chose.
    const ranked = Array.from(perMoniteur.entries())
      .map(([id, s]) => ({ id, minutes: s.minutes }))
      .sort((a, b) => b.minutes - a.minutes);
    const rankOf = new Map<string, number>();
    ranked.forEach((r, i) => rankOf.set(r.id, i + 1));
    const SHOW_RANK = ranked.length >= 5;

    // 5. Audience = TOUS les moniteurs (on skippe ceux à activité nulle)
    const { data: moniteurs, error: e2 } = await sb
      .from("profiles")
      .select("id, prenom")
      .eq("role", "enseignant");
    if (e2) throw e2;

    let sent = 0,
      skipped = 0;

    for (const mo of moniteurs ?? []) {
      const s = perMoniteur.get(mo.id);
      const minutes = s?.minutes ?? 0;
      const eleves = s?.eleves.size ?? 0;
      const days = s?.days.size ?? 0;
      const hours = Math.round(minutes / 6) / 10;
      const nVal = valsCount.get(mo.id) ?? 0;

      // Rien de mesurable ce mois → pas de récap (évite un « 0h · 0 validation »)
      if (hours === 0 && nVal === 0 && eleves === 0) {
        skipped++;
        continue;
      }

      const rank = rankOf.get(mo.id) ?? null;
      let toneTitle: { tone: string; title: string; body: string };
      if (SHOW_RANK && rank === 1) {
        toneTitle = {
          tone: "celebrate",
          title: "👑 #1 ce mois-ci",
          body: `${hours}h · ${nVal} validations · ${eleves} élèves · ${days} jours actifs. Bravo ${mo.prenom} !`,
        };
      } else if (SHOW_RANK && rank && rank <= 3) {
        toneTitle = {
          tone: "celebrate",
          title: `🥇 Top ${rank} en ${monthLabel}`,
          body: `${hours}h · ${nVal} validations · ${eleves} élèves. Continue !`,
        };
      } else {
        toneTitle = {
          tone: "gentle",
          title: `📊 Ton mois — ${monthLabel}`,
          body: `${hours}h · ${nVal} validations · ${eleves} élèves ce mois-ci. Bravo ${mo.prenom} !`,
        };
      }

      const { error: e3 } = await sb.from("notifications").insert({
        user_id: mo.id,
        type: "moniteur_recap",
        title: toneTitle.title,
        body: toneTitle.body,
        data: {
          template_id: "monthly_recap_moniteur",
          tone: toneTitle.tone,
          title: toneTitle.title,
          body: toneTitle.body,
          cta: "Voir mon profil",
          route: "#/profil",
          stats: {
            hours,
            validations: nVal,
            eleves,
            days,
            rank: SHOW_RANK ? rank : null,
          },
        },
      });
      if (e3) {
        console.error("[monthly-recap]", mo.id, e3);
        skipped++;
      } else {
        sent++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent,
        skipped,
        total_moniteurs: moniteurs?.length ?? 0,
        ranked: ranked.length,
        month: monthLabel,
      }),
    );
  } catch (e: any) {
    console.error("[monthly-recap-moniteur]", e);
    return new Response(JSON.stringify({ error: e?.message ?? "internal" }), {
      status: 500,
    });
  }
});
