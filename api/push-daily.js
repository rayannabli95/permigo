// ═══════════════════════════════════════════════════════════════
// Vercel Cron → relaie vers l'edge function Supabase dispatch-push.
// (Vercel ne peut cron que ses propres routes ; Supabase héberge la
// logique d'envoi. Ce fichier ne fait QUE le pont, avec secret.)
//
// ⚠️ CE FICHIER DOIT RESTER À LA RACINE DU DÉPÔT, dans /api/.
// Le projet Vercel est configuré sur la racine de permigo-v7 (il y lit
// /vercel.json, qui build permigo-game). Vercel ne cherche les fonctions
// serverless que dans le /api/ de SA racine. Tant qu'il a vécu dans
// permigo-game/api/, il n'a jamais été déployé : /api/push-daily renvoyait
// la page d'accueil (le rewrite l'attrapait) et le cron n'a jamais tourné.
//
// Planifié dans /vercel.json : "0 17 * * *" UTC ≈ 18h (hiver) / 19h (été) Paris.
// Env Vercel requis : CRON_SECRET (même valeur que le secret Supabase).
// Vercel ajoute automatiquement `Authorization: Bearer ${CRON_SECRET}`
// aux requêtes cron quand la variable CRON_SECRET existe.
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://arrfmdagdqtrtfbhxlty.supabase.co";

export default async function handler(req, res) {
  // Seul le cron Vercel (ou un appel muni du secret) peut déclencher.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res
      .status(500)
      .json({ error: "CRON_SECRET non configuré sur Vercel" });
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/dispatch-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": secret,
      },
      body: JSON.stringify({ mode: "daily" }),
    });
    const body = await r.json().catch(() => ({}));
    return res.status(r.ok ? 200 : 502).json(body);
  } catch (e) {
    return res.status(502).json({ error: e?.message || "dispatch failed" });
  }
}
