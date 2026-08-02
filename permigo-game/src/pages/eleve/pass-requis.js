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
import { isFreeTierUser } from "@/utils/free-tier.js";

// ─── i18n (coque) — traduction seule, repli FR. « Pass » = باقة, « moniteur »
// = مدرّب, « volants » hors sujet ici. Prix/€ inchangés. ───
const PRQ_I18N = {
  en: {
    bulle: "Your first 3 lessons are yours. 28 to go.",
    kick: "The rest is waiting",
    title: "Open the other<br>28 lessons",
    sub: "The full course, the mock exam, your progress and your rewards. Unlocked right away.",
    guarantee: "Money-back guarantee within 3 days",
    or: "or",
    code_lab: "I have a code from my instructor",
    code_help: "Your instructor pays for you: enter their code, it's free.",
    code_ph: "E.G. PERMIS75",
    code_btn: "Confirm",
    code_empty: "Enter your instructor's code.",
    code_checking: "Checking…",
    code_ok: "All set! Signing you in…",
    code_invalid: "Invalid code. Check with your instructor.",
    checkout_err: "Payment unavailable right now. Try again in a moment.",
    logout: "Log out",
    back: "Back",
    keep_free: "Keep going with my free account",
    tier_mensuel_nom: "PermiGo Pass",
    tier_mensuel_sous: "everything unlocked · cancel in one click",
    tier_mensuel_note: "/ month",
  },
  ar: {
    bulle: "دروسك الثلاثة الأولى لك. بقي 28 درساً.",
    kick: "الباقي في انتظارك",
    title: "افتح الدروس<br>الـ 28 الأخرى",
    sub: "الدورة كاملة، والامتحان التجريبي، وتقدّمك ومكافآتك. تُفتح فوراً.",
    guarantee: "استرداد المال مضمون خلال 3 أيام",
    or: "أو",
    code_lab: "لديّ رمز من مدرّبي",
    code_help: "مدرّبك يدفع عنك: أدخِل رمزه، والاشتراك مجاني.",
    code_ph: "مثال: PERMIS75",
    code_btn: "تأكيد",
    code_empty: "أدخِل رمز مدرّبك.",
    code_checking: "جارٍ التحقّق…",
    code_ok: "تمّ! جارٍ تسجيل دخولك…",
    code_invalid: "رمز غير صالح. تحقّق مع مدرّبك.",
    checkout_err: "الدفع غير متاح حالياً. أعد المحاولة بعد لحظات.",
    logout: "تسجيل الخروج",
    back: "رجوع",
    keep_free: "المتابعة بحسابي المجاني",
    tier_mensuel_nom: "باقة PermiGo",
    tier_mensuel_sous: "كل شيء مفتوح · ألغِ بنقرة واحدة",
    tier_mensuel_note: "/ شهر",
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

// UNE seule offre (décision Rayan 02/08/2026) : 4,99 €/mois, point. Trois
// cartes faisaient hésiter, deux faisaient encore calculer ; une seule fait
// décider. C'est ici que l'élève arrive quand ses 3 questions du jour sont
// épuisées : le moment où il a envie de continuer, pas de comparer une grille.
const TIERS = [
  {
    plan: "mensuel",
    nom: "Pass PermiGo",
    sous: "tout est ouvert · résiliable en un clic",
    price: "4,99 €",
    note: "/ mois",
    best: true,
  },
];

const MASCOTTE = "/skins/mascot-point.png";

const STYLE = `<style>
.prq{ position:relative; max-width:480px; margin:0 auto; min-height:100dvh;
  padding:26px 18px calc(24px + env(safe-area-inset-bottom));
  font-family:'Archivo',sans-serif; color:#ece9ff;
  background:
    radial-gradient(120% 46% at 50% -6%, rgba(124,99,255,.35) 0%, rgba(124,99,255,0) 55%),
    linear-gradient(180deg,#2a2170 0%,#1d1852 60%,#14103a 100%); }
.prq *{ box-sizing:border-box; }
.prq-head{ text-align:center; margin-bottom:18px; }
/* La mascotte présente l'offre : elle sort du cadre par le haut et se pose sur
   une lueur dorée, pour que l'œil aille d'elle vers le prix. Image PNG à fond
   transparent (public/skins/), jamais un emoji. */
.prq-mascot{ position:relative; width:172px; height:172px; margin:-6px auto 2px; display:block; }
.prq-mascot img{ position:relative; z-index:1; width:100%; height:100%; object-fit:contain;
  filter:drop-shadow(0 14px 22px rgba(8,4,30,.55)); animation:prqPop .5s cubic-bezier(.34,1.56,.64,1) both; }
.prq-mascot::after{ content:""; position:absolute; left:50%; top:52%; width:150px; height:150px;
  transform:translate(-50%,-50%); border-radius:50%; z-index:0;
  background:radial-gradient(circle, rgba(255,206,77,.34) 0%, rgba(255,206,77,0) 68%); }
@keyframes prqPop{ from{ opacity:0; transform:translateY(10px) scale(.9);} to{ opacity:1; transform:none;} }
/* Bulle de la mascotte — c'est elle qui annonce, pas un bandeau anonyme. */
.prq-bulle{ position:relative; display:inline-block; max-width:290px; margin:0 auto 12px; padding:10px 15px;
  border-radius:16px 16px 16px 4px; background:linear-gradient(180deg,#fffdf6,#ffeec2); color:#3a2a05;
  font-weight:700; font-size:13px; line-height:1.45; box-shadow:0 6px 16px -6px rgba(8,4,30,.6); }
.prq-kick{ font-weight:800; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#b6a8ec; margin-bottom:8px; }
/* color:inherit obligatoire — base.css pose une couleur sur h1..h4 et une règle
   directe bat la couleur héritée : sans ça le titre passe en encre sombre sur ce
   fond violet foncé (illisible en thème clair). */
.prq-title{ color:#fff; font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:26px; line-height:1.14; margin:0 0 8px; }
.prq-sub{ font-size:13.5px; font-weight:600; color:#c3bdf0; margin:0 auto; max-width:330px; line-height:1.5; }
.prq-tiers{ display:flex; flex-direction:column; gap:11px; margin-bottom:16px; }
.prq-tier{ position:relative; display:flex; align-items:center; gap:13px; width:100%; text-align:left; cursor:pointer;
  padding:14px 15px; border-radius:18px; background:rgba(255,255,255,.06); border:1.5px solid rgba(255,255,255,.14);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1); -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.prq-tier:active{ transform:scale(.99); }
.prq-tier.best{ background:linear-gradient(180deg,rgba(124,99,255,.28),rgba(124,99,255,.12)); border-color:#8f7bff;
  box-shadow:0 0 0 3px rgba(143,123,255,.22), inset 0 1px 0 rgba(255,255,255,.18); }
.prq-tinfo{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.prq-tnom{ font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:16px; color:#fff; line-height:1.1; }
.prq-tsous{ font-size:11.5px; font-weight:600; color:#b8aef0; margin-top:2px; }
.prq-tprice{ flex:0 0 auto; text-align:right; }
.prq-tprice b{ font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:22px; color:#ffe4a6; }
.prq-tprice span{ display:block; font-size:10px; font-weight:700; color:#b8aef0; }
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
.prq-back{ position:absolute; top:14px; left:14px; z-index:3; width:40px; height:40px; border:0; border-radius:50%;
  display:flex; align-items:center; justify-content:center; cursor:pointer; color:#efe9ff;
  background:rgba(255,255,255,.1); box-shadow:inset 0 0 0 1px rgba(255,255,255,.16); }
.prq-back:active{ transform:scale(.94); }
.prq-logout{ display:block; margin:20px auto 0; background:none; border:none; cursor:pointer;
  font-weight:700; font-size:13px; color:#9a8fd0; text-decoration:underline; text-underline-offset:3px; }
/* ─── Arabe : l'écran se retourne ────────────────────────────────
   Sans dir="rtl", cet écran restait en miroir pour un arabophone : la flèche de
   retour à gauche, le prix à droite, le bouclier avant le texte, et surtout la
   ponctuation des phrases arabes rejetée du mauvais bout (bidi en paragraphe
   LTR). Le dir retourne SEUL les rangées en flex ; ne restent à redresser que
   les positions absolues et les alignements, qui sont physiques.
   ⚠️ On ne touche PAS au <html> : la bascule reste enfermée dans cette page,
   dont tout le CSS vit ici. Le champ de code, lui, garde dir="ltr" : les codes
   moniteur sont en lettres latines (PERMIS75). */
.prq[dir="rtl"] .prq-tier{ text-align:right; }
.prq[dir="rtl"] .prq-tprice{ text-align:left; }
.prq[dir="rtl"] .prq[dir="rtl"] .prq-back{ left:auto; right:14px; }
.prq[dir="rtl"] .prq-back svg{ transform:scaleX(-1); }
.prq[dir="rtl"] .prq-bulle{ border-radius:16px 16px 4px 16px; }
@media (prefers-reduced-motion: reduce){ .prq *{ transition:none!important; } }
</style>`;

const BACK_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SHIELD = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 2.5v5c0 4.2-2.9 7.5-7 9-4.1-1.5-7-4.8-7-9v-5L12 3z" fill="rgba(52,199,120,.9)"/><path d="M8.5 12l2.5 2.5L15.5 10" stroke="#0c2b18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export async function mount(root, me) {
  // Deux contextes très différents :
  //  · À LA PORTE (élève bloqué avant d'entrer) → plein écran, sans navigation,
  //    et on retire la réserve d'espace du bandeau (sinon bande blanche en haut).
  //  · DEPUIS L'APP (il a tapé un cadenas) → il DOIT pouvoir revenir en arrière,
  //    donc on garde le bandeau et la barre du bas, et on pose une flèche.
  const dansApp = isFreeTierUser(me);
  track("eleve.pass_wall_viewed", {
    reason: me?.eleveAccess?.reason || "solo_no_pass",
    from: dansApp ? "cadenas" : "porte",
  });
  if (!dansApp) {
    document
      .getElementById("header-bar")
      ?.style.setProperty("display", "none", "important");
    document
      .getElementById("bottom-nav")
      ?.style.setProperty("display", "none", "important");
    document.body.classList.add("no-top-chrome");
  }

  const tiers = TIERS.map(
    (
      t,
    ) => `<button class="prq-tier${t.best ? " best" : ""}" data-plan="${escAttr(t.plan)}">
      <span class="prq-tinfo"><span class="prq-tnom">${pt(`tier_${t.plan}_nom`, t.nom)}</span><span class="prq-tsous">${pt(`tier_${t.plan}_sous`, t.sous)}</span></span>
      <span class="prq-tprice"><b>${esc(t.price)}</b><span>${pt(`tier_${t.plan}_note`, t.note)}</span></span>
    </button>`,
  ).join("");

  root.innerHTML = `${STYLE}<div class="prq"${getLang() === "ar" ? ' dir="rtl" lang="ar"' : ""}>
    ${dansApp ? `<button class="prq-back" id="prq-back" type="button" aria-label="${pt("back", "Retour")}">${BACK_SVG}</button>` : ""}
    <div class="prq-mascot"><img src="${MASCOTTE}" alt="" width="600" height="400" /></div>
    <div class="prq-head">
      <div class="prq-bulle">${pt("bulle", "Tes 3 premières leçons sont à toi. Il en reste 28.")}</div>
      <div class="prq-kick">${pt("kick", "La suite t'attend")}</div>
      <h1 class="prq-title">${ptR("title", "Ouvre les 28<br>autres leçons")}</h1>
      <p class="prq-sub">${pt("sub", "Le parcours complet, l'examen blanc, ta progression et tes récompenses. Débloqués tout de suite.")}</p>
    </div>
    <div class="prq-tiers">${tiers}</div>
    <div class="prq-guar">${SHIELD} ${pt("guarantee", "Satisfait ou remboursé sous 3 jours")}</div>
    <div class="prq-or">${pt("or", "ou")}</div>
    <div class="prq-code">
      <div class="prq-code-lab">${pt("code_lab", "J'ai un code de mon moniteur")}</div>
      <div class="prq-code-help">${pt("code_help", "Ton moniteur paie pour toi : entre son code, c'est gratuit.")}</div>
      <div class="prq-code-row">
        <input class="prq-code-in" id="prq-code" type="text" dir="ltr" autocomplete="off" maxlength="12" placeholder="${pt("code_ph", "EX : PERMIS75")}" />
        <button class="prq-code-btn" id="prq-code-btn" type="button">${pt("code_btn", "Valider")}</button>
      </div>
      <div class="prq-msg" id="prq-msg" role="status" aria-live="polite"></div>
    </div>
    ${dansApp ? `<button class="prq-logout" id="prq-keep" type="button">${pt("keep_free", "Continuer avec mon compte gratuit")}</button>` : `<button class="prq-logout" id="prq-logout" type="button">${pt("logout", "Me déconnecter")}</button>`}
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
            "Paiement indisponible pour le moment. Réessaie dans un instant.",
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

  const retour = () => {
    track("eleve.pass_wall_back");
    location.hash = "#/revision-conduite";
  };
  root.querySelector("#prq-back")?.addEventListener("click", retour);
  root.querySelector("#prq-keep")?.addEventListener("click", retour);

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
