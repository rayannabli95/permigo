// ═══════════════════════════════════════════════════════════════
// Edge Function : dispatch-push
// Envoi des Web Push (VAPID) — la « clé de contact » de la boucle
// quotidienne (plan rétention 2026-06-10 + .telemetry/push-spec.md).
//
// Deux modes :
//   POST { mode: "daily" }              → batch quotidien (cron ~18h Paris)
//       · élève abonné qui a déjà fait un quiz aujourd'hui → rien
//       · inactif ≥ 3 jours (et < 30 j) → relance « reviens » (remplace le ding)
//       · sinon                         → ding « ta question du jour t'attend »
//   POST { user_id, type, data? }       → push événementiel à UN élève
//       (types du spec : post_validation_quiz | consolidation_quiz | streak_risk)
//
// Auth : header `x-cron-secret` === CRON_SECRET (cron Vercel)
//        OU Authorization: Bearer SERVICE_ROLE_KEY (appels internes).
//
// Setup (cf. permigo-game/docs/PUSH-SETUP.md) :
//   npx web-push generate-vapid-keys
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... \
//     VAPID_SUBJECT=mailto:rayannabli27@gmail.com CRON_SECRET=...
//   supabase functions deploy dispatch-push --no-verify-jwt
// ═══════════════════════════════════════════════════════════════
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type NotifType = "post_validation_quiz" | "consolidation_quiz" | "streak_risk";

const EVENT_PAYLOADS: Record<
  NotifType,
  (data: Record<string, unknown>) => {
    title: string;
    body: string;
    data: object;
  }
> = {
  post_validation_quiz: (d) => ({
    title: "Compétence validée !",
    body: "Ton moniteur a validé une compétence. Lance le quiz maintenant !",
    data: { route: `#/quiz/${d?.competence_id ?? ""}/post_validation` },
  }),
  consolidation_quiz: (d) => ({
    title: "Consolide tes acquis",
    body: "Il est temps de revoir une compétence. 2 questions, 2 minutes.",
    data: { route: `#/quiz/${d?.competence_id ?? ""}/consolidation` },
  }),
  streak_risk: () => ({
    title: "Ta série t'attend",
    body: "Ne perds pas ta flamme ! Une session rapide suffit.",
    data: { route: "#/" },
  }),
};

const DAILY_PAYLOAD = {
  title: "Ta question du jour t'attend",
  body: "3 questions · 2 minutes — garde ton avance dans la ligue Théorie.",
  type: "daily_quiz",
  data: { route: "#/" },
};
const COMEBACK_PAYLOAD = (days: number) => ({
  title: "On t'a gardé ta place",
  body: `Ça fait ${days} jours — reprends en 2 minutes, ta question du jour t'attend.`,
  type: "comeback",
  data: { route: "#/" },
});

const DAY_MS = 86_400_000;
const COMEBACK_AFTER_DAYS = 3; // relance à partir de 3 j d'absence (plan)
const GIVE_UP_AFTER_DAYS = 30; // au-delà : silence (anti-fatigue, élève parti/reçu)

function setupVapid(): boolean {
  const pub = Deno.env.get("VAPID_PUBLIC_KEY");
  const priv = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject =
    Deno.env.get("VAPID_SUBJECT") ?? "mailto:rayannabli27@gmail.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  return true;
}

// deno-lint-ignore no-explicit-any
async function sendTo(supabase: any, sub: any, payload: object) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
    return "sent";
  } catch (e) {
    const code = (e as { statusCode?: number })?.statusCode;
    // 404/410 = subscription expirée/désinscrite → on nettoie la ligne
    if (code === 404 || code === 410) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", sub.endpoint);
      return "expired";
    }
    console.warn("[dispatch-push] send failed", code, (e as Error)?.message);
    return "failed";
  }
}

Deno.serve(async (req) => {
  // ── Auth : cron secret OU service role ──
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY")!;
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const gotCron = req.headers.get("x-cron-secret") ?? "";
  const gotAuth = req.headers.get("authorization") ?? "";
  const authorized =
    (cronSecret && gotCron === cronSecret) ||
    gotAuth === `Bearer ${serviceKey}`;
  if (!authorized) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
    });
  }

  if (!setupVapid()) {
    return new Response(
      JSON.stringify({
        error: "vapid_keys_missing",
        hint: "supabase secrets set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY",
      }),
      { status: 500 },
    );
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const body = await req.json().catch(() => ({}));

  // ════ Mode événementiel : { user_id, type, data } ════
  if (body?.user_id && body?.type) {
    const make = EVENT_PAYLOADS[body.type as NotifType];
    if (!make) {
      return new Response(JSON.stringify({ error: "unknown_type" }), {
        status: 400,
      });
    }
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", body.user_id);
    if (!subs?.length)
      return new Response(JSON.stringify({ ok: true, sent: 0 }));

    let sent = 0;
    for (const sub of subs) {
      if ((await sendTo(supabase, sub, make(body.data ?? {}))) === "sent")
        sent++;
    }
    return new Response(JSON.stringify({ ok: true, sent }));
  }

  // ════ Mode batch quotidien : { mode: "daily" } ════
  if (body?.mode !== "daily") {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400,
    });
  }

  // Minuit Paris (DST-proof) : on retranche l'heure courante de Paris.
  const now = new Date();
  const paris = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const h = parseInt(paris.find((p) => p.type === "hour")?.value ?? "0", 10);
  const m = parseInt(paris.find((p) => p.type === "minute")?.value ?? "0", 10);
  const parisMidnight = new Date(now.getTime() - (h * 3600 + m * 60) * 1000);

  // 1. Tous les abonnés élèves (+ activité)
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select(
      "user_id, endpoint, p256dh, auth, profile:profiles(role, last_active_at)",
    )
    .limit(2000);
  if (subErr) {
    return new Response(JSON.stringify({ error: subErr.message }), {
      status: 500,
    });
  }

  // 2. Qui a déjà fait un quiz aujourd'hui (heure de Paris) ?
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("user_id")
    .gte("completed_at", parisMidnight.toISOString());
  const doneToday = new Set(
    (attempts ?? []).map((a: { user_id: string }) => a.user_id),
  );

  let sent = 0,
    comeback = 0,
    skipped = 0,
    expired = 0;
  for (const sub of subs ?? []) {
    const profile = Array.isArray(sub.profile) ? sub.profile[0] : sub.profile;
    if (profile?.role !== "eleve") {
      skipped++;
      continue;
    }
    if (doneToday.has(sub.user_id)) {
      skipped++;
      continue;
    }

    const lastActive = profile?.last_active_at
      ? new Date(profile.last_active_at)
      : null;
    const awayDays = lastActive
      ? Math.floor((now.getTime() - lastActive.getTime()) / DAY_MS)
      : 0;
    if (awayDays >= GIVE_UP_AFTER_DAYS) {
      skipped++;
      continue;
    }

    const payload =
      awayDays >= COMEBACK_AFTER_DAYS
        ? COMEBACK_PAYLOAD(awayDays)
        : DAILY_PAYLOAD;
    const r = await sendTo(supabase, sub, payload);
    if (r === "sent") {
      sent++;
      if (awayDays >= COMEBACK_AFTER_DAYS) comeback++;
    } else if (r === "expired") expired++;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sent,
      comeback,
      skipped,
      expired,
      total: subs?.length ?? 0,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
