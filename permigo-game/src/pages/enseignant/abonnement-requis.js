// ═══════════════════════════════════════════════════════════════
// Mur d'abonnement MONITEUR — affiché par accessGateFor quand l'essai gratuit
// (14 j) est terminé et qu'aucun abonnement n'est actif. Aucun accès à l'espace
// moniteur tant que le paiement n'est pas fait. Le statut vient du SERVEUR
// (RPC moniteur_access_status, cf. main.js + billing.js) → non contournable en
// changeant un état client.
//
// Sorties possibles : « Activer mon abonnement » (Stripe Checkout) ou se
// déconnecter. Après paiement, Stripe redirige → reload → le boot recalcule le
// statut (abonné) → le mur tombe.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";

const STYLE = `<style>
.mpw{ position:relative; max-width:480px; margin:0 auto; min-height:100dvh;
  display:flex; flex-direction:column; justify-content:center; align-items:center;
  padding:24px 20px calc(28px + env(safe-area-inset-bottom));
  font-family:'Plus Jakarta Sans','Inter',sans-serif; color:#eef0ff; text-align:center;
  background:
    radial-gradient(120% 50% at 50% -8%, rgba(255,206,77,.14) 0%, rgba(255,206,77,0) 55%),
    radial-gradient(120% 55% at 82% 10%, rgba(99,102,241,.35) 0%, rgba(99,102,241,0) 60%),
    linear-gradient(180deg,#3730a3 0%,#2b2578 55%,#1e1b52 100%); }
.mpw *{ box-sizing:border-box; }
.mpw-badge{ width:78px; height:78px; border-radius:24px; display:flex; align-items:center; justify-content:center;
  background:linear-gradient(180deg,#ffe9b0,#f6c85f 55%,#e2951f);
  box-shadow:0 8px 0 #b46a10, 0 16px 26px rgba(180,106,16,.4), inset 0 2px 0 rgba(255,255,255,.6); margin-bottom:22px; }
.mpw-title{ font-family:'Baloo 2',cursive; font-weight:800; font-size:26px; line-height:1.12; margin:0 0 8px; letter-spacing:-.01em; }
.mpw-sub{ font-size:14px; font-weight:600; color:#c7c9f5; margin:0 0 22px; max-width:340px; line-height:1.5; }
.mpw-card{ width:100%; max-width:360px; text-align:left; padding:18px; border-radius:20px; margin-bottom:20px;
  background:rgba(255,255,255,.06); border:1px solid rgba(255,206,77,.35); box-shadow:inset 0 1px 0 rgba(255,255,255,.14); }
.mpw-price{ font-family:'Baloo 2',cursive; font-weight:800; font-size:26px; color:#ffe4a6;
  display:flex; align-items:baseline; gap:6px; margin-bottom:12px; }
.mpw-price small{ font-family:'Inter',sans-serif; font-weight:700; font-size:13px; color:#c7c9f5; }
.mpw-feat{ display:flex; flex-direction:column; gap:9px; }
.mpw-feat span{ display:flex; gap:9px; align-items:flex-start; font-size:13.5px; font-weight:600; color:#e6e7ff; line-height:1.35; }
.mpw-feat svg{ flex:0 0 18px; margin-top:1px; }
.mpw-cta{ width:100%; max-width:360px; height:58px; border:none; border-radius:18px; cursor:pointer;
  font-family:'Baloo 2',cursive; font-weight:800; font-size:18px; color:#5a3406;
  background:linear-gradient(180deg,#ffe9b0 0%,#f6c85f 38%,#f0a93f 72%,#e2951f 100%);
  box-shadow:0 6px 0 #b46a10, 0 12px 20px rgba(180,106,16,.35), inset 0 2px 0 rgba(255,255,255,.7);
  transition:transform .1s ease, box-shadow .1s ease; }
.mpw-cta:active{ transform:translateY(3px); box-shadow:0 3px 0 #b46a10, inset 0 2px 0 rgba(255,255,255,.7); }
.mpw-cta[disabled]{ opacity:.7; cursor:default; }
.mpw-logout{ margin-top:18px; background:none; border:none; cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:13px; color:#a7a9e0; text-decoration:underline; text-underline-offset:3px; }
.mpw-note{ margin-top:14px; font-size:11.5px; color:#9a9cd6; max-width:320px; line-height:1.4; }
@media (prefers-reduced-motion: reduce){ .mpw *{ transition:none!important; } }
</style>`;

const CHECK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="rgba(255,206,77,.18)"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#ffd86a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const LOCK = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="#5a3406"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="#5a3406" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="15" r="1.7" fill="#ffe9b0"/></svg>`;

export async function mount(root, me) {
  track("moniteur.paywall_viewed", {
    reason: me?.moniteurAccess?.reason || "trial_ended",
  });
  // Défensif : au vrai boot le chrome n'est pas encore monté (le gate `return`
  // avant), mais si un abonnement expire en cours de session on masque quand
  // même header + nav — le mur est plein écran. Restauré au reload (Stripe/logout).
  document
    .getElementById("header-bar")
    ?.style.setProperty("display", "none", "important");
  document
    .getElementById("bottom-nav")
    ?.style.setProperty("display", "none", "important");
  const prenom = me?.prenom || me?.nom || "";
  // Moniteur inscrit après le paywall (2026-07-23) : jamais d'essai → copie
  // honnête (pas de « essai terminé »). Les moniteurs d'avant gardent leur essai
  // 14 j et la copie « essai terminé » historique.
  const isPaywall = me?.moniteurAccess?.reason === "signup_paywall";

  root.innerHTML = `${STYLE}<div class="mpw">
    <div class="mpw-badge">${LOCK}</div>
    <h1 class="mpw-title">${
      isPaywall
        ? `Active ton abonnement${prenom ? `,<br>${esc(prenom)}` : ""}`
        : `Ton essai gratuit est terminé${prenom ? `,<br>${esc(prenom)}` : ""}`
    }</h1>
    <p class="mpw-sub">${
      isPaywall
        ? "Ton espace moniteur t'attend. Active ton abonnement pour y accéder et garder tes élèves gratuits."
        : "Active ton abonnement pour retrouver ton espace moniteur, et garder tes élèves gratuits."
    }</p>
    <div class="mpw-card">
      <div class="mpw-price">9,99 €<small>/ mois</small></div>
      <div class="mpw-feat">
        <span>${CHECK} Tes élèves <b>gratuits</b> (jusqu'à 100) avec ton code</span>
        <span>${CHECK} Sans engagement, résiliable en 2 clics</span>
        <span>${CHECK} Ton suivi, tes classements, tes relances</span>
      </div>
    </div>
    <button class="mpw-cta" id="mpw-pay" type="button">Activer mon abonnement</button>
    <button class="mpw-logout" id="mpw-logout" type="button">Me déconnecter</button>
    <p class="mpw-note">Tes élèves rattachés par ton code continuent d'accéder à l'app pendant ce temps.</p>
  </div>`;

  const payBtn = root.querySelector("#mpw-pay");
  payBtn?.addEventListener("click", async () => {
    payBtn.disabled = true;
    payBtn.textContent = "Redirection vers le paiement…";
    track("billing.checkout_start", { role: "enseignant", from: "paywall" });
    try {
      const { startCheckout } = await import("@/services/billing.js");
      await startCheckout(); // redirige vers Stripe si OK
    } catch (err) {
      console.error("[abonnement-requis] checkout", err);
      const { toast } = await import("@/components/common/toast.js");
      toast(
        "Paiement indisponible pour le moment. Réessaie dans un instant.",
        "error",
        4500,
      );
      payBtn.disabled = false;
      payBtn.textContent = "Activer mon abonnement";
    }
  });

  root.querySelector("#mpw-logout")?.addEventListener("click", async () => {
    track("moniteur.paywall_logout");
    try {
      await sb.auth.signOut();
    } catch (e) {
      console.error("[abonnement-requis] signOut", e);
    }
    window.location.href = "/#/login";
    window.location.reload();
  });
}
