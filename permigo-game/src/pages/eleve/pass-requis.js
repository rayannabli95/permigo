// ═══════════════════════════════════════════════════════════════
// Mur PASS ÉLÈVE SOLO — affiché par accessGateFor quand un élève sans moniteur
// (pas de code) et sans Pass payé crée son compte. On paie à la création
// (choix Rayan), avec la garantie « satisfait ou remboursé 3 jours ».
//
// 3 sorties : choisir un Pass (Stripe Checkout via startPassCheckout), entrer un
// code moniteur (→ rattachement → gratuit), ou se déconnecter. Statut serveur
// (RPC eleve_access_status) → après paiement/rattachement, reload = mur levé.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { startPassCheckout } from "@/services/billing.js";
import { getLang } from "@/utils/lang.js";

// ─── i18n (coque) — traduction seule, repli FR. « Pass » = باقة, « moniteur »
// = مدرّب, « volants » hors sujet ici. Prix/€ inchangés. ───
const PRQ_I18N = {
  en: {
    kick: "Just one more step",
    title: "Choose your Pass to<br>start training",
    sub: "All the content, your progress, your rewards — unlocked right away.",
    guarantee: "Money-back guarantee — 3 days. Zero risk.",
    or: "— or —",
    code_lab: "I have a code from my instructor",
    code_help: "Your instructor pays for you: enter their code, it's free.",
    code_ph: "E.G. PERMIS75",
    code_btn: "Confirm",
    code_empty: "Enter your instructor's code.",
    code_checking: "Checking…",
    code_ok: "All set! Signing you in…",
    code_invalid: "Invalid code. Check with your instructor.",
    launch_price: "launch price",
    checkout_err: "Payment unavailable right now — try again in a moment.",
    logout: "Log out",
    tier_pass3_nom: "Gold Pass",
    tier_pass3_sous: "3 months",
    tier_pass3_note: "most popular",
    tier_mensuel_nom: "Monthly Pass",
    tier_mensuel_sous: "no commitment",
    tier_mensuel_note: "/ month",
    tier_pass6_nom: "Platinum Pass",
    tier_pass6_sous: "6 months",
    tier_pass6_note: "cheapest per month",
  },
  ar: {
    kick: "خطوة أخيرة فقط",
    title: "اختر باقتك لتبدأ<br>تدريبك",
    sub: "كل المحتوى وتقدّمك ومكافآتك — مفتوحة فوراً.",
    guarantee: "استرداد المال مضمون — 3 أيام. دون أي مخاطرة.",
    or: "— أو —",
    code_lab: "لديّ رمز من مدرّبي",
    code_help: "مدرّبك يدفع عنك: أدخِل رمزه، والاشتراك مجاني.",
    code_ph: "مثال: PERMIS75",
    code_btn: "تأكيد",
    code_empty: "أدخِل رمز مدرّبك.",
    code_checking: "جارٍ التحقّق…",
    code_ok: "تمّ! جارٍ تسجيل دخولك…",
    code_invalid: "رمز غير صالح. تحقّق مع مدرّبك.",
    launch_price: "سعر الإطلاق",
    checkout_err: "الدفع غير متاح حالياً — أعد المحاولة بعد لحظات.",
    logout: "تسجيل الخروج",
    tier_pass3_nom: "الباقة الذهبية",
    tier_pass3_sous: "3 أشهر",
    tier_pass3_note: "الأكثر اختياراً",
    tier_mensuel_nom: "الباقة الشهرية",
    tier_mensuel_sous: "دون التزام",
    tier_mensuel_note: "/ شهر",
    tier_pass6_nom: "الباقة البلاتينية",
    tier_pass6_sous: "6 أشهر",
    tier_pass6_note: "الأرخص شهرياً",
  },
};
function pt(key, fr) {
  const l = getLang();
  return esc((l !== "fr" && PRQ_I18N[l]?.[key]) || fr);
}
function ptR(key, fr) {
  const l = getLang();
  return (l !== "fr" && PRQ_I18N[l]?.[key]) || fr;
}

const TIERS = [
  {
    plan: "pass3",
    nom: "Billet Or",
    sous: "3 mois",
    price: "24,99 €",
    note: "le + choisi",
    best: true,
  },
  {
    plan: "mensuel",
    nom: "Billet Mensuel",
    sous: "sans engagement",
    price: "9,99 €",
    note: "/ mois",
    best: false,
  },
  {
    plan: "pass6",
    nom: "Billet Platine",
    sous: "6 mois",
    price: "39,99 €",
    note: "le - cher au mois",
    best: false,
  },
];

const STYLE = `<style>
.prq{ position:relative; max-width:480px; margin:0 auto; min-height:100dvh;
  padding:26px 18px calc(24px + env(safe-area-inset-bottom));
  font-family:'Archivo',sans-serif; color:#ece9ff;
  background:
    radial-gradient(120% 46% at 50% -6%, rgba(124,99,255,.35) 0%, rgba(124,99,255,0) 55%),
    linear-gradient(180deg,#2a2170 0%,#1d1852 60%,#14103a 100%); }
.prq *{ box-sizing:border-box; }
.prq-head{ text-align:center; margin-bottom:20px; }
.prq-kick{ font-weight:800; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#b6a8ec; margin-bottom:8px; }
/* color:inherit obligatoire — base.css pose une couleur sur h1..h4 et une règle
   directe bat la couleur héritée : sans ça le titre passe en encre sombre sur ce
   fond violet foncé (illisible en thème clair). */
.prq-title{ color:inherit; font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:25px; line-height:1.14; margin:0 0 8px; }
.prq-sub{ font-size:13.5px; font-weight:600; color:#c3bdf0; margin:0 auto; max-width:330px; line-height:1.5; }
.prq-tiers{ display:flex; flex-direction:column; gap:11px; margin-bottom:16px; }
.prq-tier{ display:flex; align-items:center; gap:13px; width:100%; text-align:left; cursor:pointer;
  padding:14px 15px; border-radius:18px; background:rgba(255,255,255,.06); border:1.5px solid rgba(255,255,255,.14);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1); -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.prq-tier:active{ transform:scale(.99); }
.prq-tier.best{ background:linear-gradient(180deg,rgba(124,99,255,.28),rgba(124,99,255,.12)); border-color:#8f7bff;
  box-shadow:0 0 0 3px rgba(143,123,255,.22), inset 0 1px 0 rgba(255,255,255,.18); }
.prq-tinfo{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.prq-tnom{ font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:16px; color:#fff; line-height:1.1; }
.prq-tsous{ font-size:11.5px; font-weight:600; color:#b8aef0; margin-top:2px; }
.prq-tprice{ flex:0 0 auto; text-align:right; }
.prq-tprice b{ font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:19px; color:#ffe4a6; }
.prq-tprice span{ display:block; font-size:10px; font-weight:700; color:#b8aef0; }
.prq-badge{ position:absolute; top:-9px; right:14px; font-weight:800; font-size:9px; letter-spacing:.08em; text-transform:uppercase;
  color:#1a1240; background:linear-gradient(180deg,#ffe9b0,#f4b24a); padding:3px 9px; border-radius:999px; box-shadow:0 2px 5px rgba(20,12,60,.35); }
.prq-guar{ display:flex; align-items:center; justify-content:center; gap:8px; text-align:center; font-size:12.5px; font-weight:700; color:#d9f2e0;
  padding:10px 12px; border-radius:13px; background:rgba(52,199,120,.12); border:1px solid rgba(52,199,120,.3); margin-bottom:18px; }
.prq-or{ text-align:center; font-size:11px; font-weight:700; color:#9a8fd0; letter-spacing:.1em; text-transform:uppercase; margin:4px 0 12px; }
.prq-code{ background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:14px; }
.prq-code-lab{ font-weight:800; font-size:13px; color:#e6e2ff; margin-bottom:4px; }
.prq-code-help{ font-size:11.5px; color:#a99ddb; margin-bottom:10px; }
.prq-code-row{ display:flex; gap:8px; }
.prq-code-in{ flex:1; min-width:0; height:46px; border-radius:12px; border:1.5px solid rgba(255,206,77,.4);
  background:rgba(20,12,60,.5); color:#ffe9b0; font:800 16px/1 'IBM Plex Mono',monospace; letter-spacing:.18em; text-align:center; text-transform:uppercase; }
.prq-code-in::placeholder{ color:rgba(255,206,77,.4); }
.prq-code-btn{ flex:0 0 auto; padding:0 16px; height:46px; border:none; border-radius:12px; cursor:pointer; font-weight:800; font-size:13px;
  color:#241a45; background:linear-gradient(180deg,#ffe9b0,#f0a93f); }
.prq-code-btn[disabled]{ opacity:.6; cursor:default; }
.prq-msg{ font-size:12px; font-weight:700; margin-top:8px; min-height:16px; }
.prq-msg.err{ color:#ffb4a0; } .prq-msg.ok{ color:#9fe7b6; }
.prq-logout{ display:block; margin:20px auto 0; background:none; border:none; cursor:pointer;
  font-weight:700; font-size:13px; color:#9a8fd0; text-decoration:underline; text-underline-offset:3px; }
@media (prefers-reduced-motion: reduce){ .prq *{ transition:none!important; } }
</style>`;

const SHIELD = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 2.5v5c0 4.2-2.9 7.5-7 9-4.1-1.5-7-4.8-7-9v-5L12 3z" fill="rgba(52,199,120,.9)"/><path d="M8.5 12l2.5 2.5L15.5 10" stroke="#0c2b18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export async function mount(root, me) {
  track("eleve.pass_wall_viewed", {
    reason: me?.eleveAccess?.reason || "solo_no_pass",
  });
  document
    .getElementById("header-bar")
    ?.style.setProperty("display", "none", "important");
  document
    .getElementById("bottom-nav")
    ?.style.setProperty("display", "none", "important");

  const tiers = TIERS.map(
    (
      t,
    ) => `<button class="prq-tier${t.best ? " best" : ""}" data-plan="${escAttr(t.plan)}">
      ${t.best ? `<span class="prq-badge">${pt(`tier_${t.plan}_note`, t.note)}</span>` : ""}
      <span class="prq-tinfo"><span class="prq-tnom">${pt(`tier_${t.plan}_nom`, t.nom)}</span><span class="prq-tsous">${pt(`tier_${t.plan}_sous`, t.sous)}</span></span>
      <span class="prq-tprice"><b>${esc(t.price)}</b><span>${t.best ? pt("launch_price", "prix de lancement") : pt(`tier_${t.plan}_note`, t.note)}</span></span>
    </button>`,
  ).join("");

  root.innerHTML = `${STYLE}<div class="prq">
    <div class="prq-head">
      <div class="prq-kick">${pt("kick", "Plus qu'une étape")}</div>
      <h1 class="prq-title">${ptR("title", "Choisis ton Pass pour<br>commencer ton entraînement")}</h1>
      <p class="prq-sub">${pt("sub", "Tout le contenu, ta progression, tes récompenses — débloqués tout de suite.")}</p>
    </div>
    <div class="prq-tiers">${tiers}</div>
    <div class="prq-guar">${SHIELD} ${pt("guarantee", "Satisfait ou remboursé — 3 jours. Zéro risque.")}</div>
    <div class="prq-or">${pt("or", "— ou —")}</div>
    <div class="prq-code">
      <div class="prq-code-lab">${pt("code_lab", "J'ai un code de mon moniteur")}</div>
      <div class="prq-code-help">${pt("code_help", "Ton moniteur paie pour toi : entre son code, c'est gratuit.")}</div>
      <div class="prq-code-row">
        <input class="prq-code-in" id="prq-code" type="text" autocomplete="off" maxlength="12" placeholder="${pt("code_ph", "EX : PERMIS75")}" />
        <button class="prq-code-btn" id="prq-code-btn" type="button">${pt("code_btn", "Valider")}</button>
      </div>
      <div class="prq-msg" id="prq-msg" role="status" aria-live="polite"></div>
    </div>
    <button class="prq-logout" id="prq-logout" type="button">${pt("logout", "Me déconnecter")}</button>
  </div>`;

  root.querySelectorAll("[data-plan]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const plan = btn.getAttribute("data-plan");
      track("billing.pass_checkout_start", { plan, from: "pass_wall" });
      try {
        await startPassCheckout(plan); // redirige vers Stripe si OK
      } catch (err) {
        console.error("[pass-requis] checkout", err);
        const { toast } = await import("@/components/common/toast.js");
        toast(
          ptR(
            "checkout_err",
            "Paiement indisponible pour le moment — réessaie dans un instant.",
          ),
          "error",
          4500,
        );
      }
    }),
  );

  const codeIn = root.querySelector("#prq-code");
  const codeBtn = root.querySelector("#prq-code-btn");
  const msg = root.querySelector("#prq-msg");
  codeBtn?.addEventListener("click", async () => {
    const code = (codeIn.value || "").trim().toUpperCase();
    if (code.length < 3) {
      msg.className = "prq-msg err";
      msg.textContent = ptR("code_empty", "Entre le code de ton moniteur.");
      return;
    }
    codeBtn.disabled = true;
    msg.className = "prq-msg";
    msg.textContent = ptR("code_checking", "Vérification…");
    try {
      const { error } = await sb.rpc("join_moniteur_by_code", { p_code: code });
      if (error) throw error;
      track("eleve.pass_wall_code_joined", { code });
      msg.className = "prq-msg ok";
      msg.textContent = ptR("code_ok", "C'est bon ! On te connecte…");
      setTimeout(() => {
        window.location.href = "/#";
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error("[pass-requis] join code", err);
      msg.className = "prq-msg err";
      msg.textContent = ptR(
        "code_invalid",
        "Code invalide. Vérifie auprès de ton moniteur.",
      );
      codeBtn.disabled = false;
    }
  });

  root.querySelector("#prq-logout")?.addEventListener("click", async () => {
    track("eleve.pass_wall_logout");
    try {
      await sb.auth.signOut();
    } catch (e) {
      console.error("[pass-requis] signOut", e);
    }
    window.location.href = "/#/login";
    window.location.reload();
  });
}
