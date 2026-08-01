// ═══════════════════════════════════════════════════════════════
// Carte « comment on t'appelle » — posée en haut du classement.
//
// L'inscription ne demande plus que l'email et le mot de passe : tant que
// l'élève n'a rien dit, le déclencheur DB a posé la partie de son email avant
// le @ comme prénom (« yanis27 »). Ça passe tant qu'il joue seul, mais ça
// devient gênant le jour où il se compare aux autres et où son moniteur le
// cherche dans sa liste.
//
// ⚠️ Le classement n'expose AUCUN nom réel (pseudo ou « Apprenti », cf.
// classement.js). On ne raconte donc pas que ce prénom va s'y afficher : il
// sert à son moniteur et aux écrans qui le saluent. Dire l'inverse serait une
// promesse fausse au moment précis où on demande une donnée.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser, setCurUser } from "@/auth/cur-user.js";
import { getLang } from "@/utils/lang.js";
import { track } from "@/services/analytics.js";

const I18N = {
  en: {
    title: "What should we call you?",
    sub: "Your instructor sees this name. In the ranking you stay under your nickname.",
    prenom: "First name",
    nom: "Last name",
    nom_opt: "optional",
    nom_help: "Only the first letter is ever shown.",
    submit: "Save",
    saving: "Saving…",
    done: "Thanks.",
    err: "Could not save. Try again.",
  },
  ar: {
    title: "بماذا نناديك؟",
    sub: "مدرّبك يرى هذا الاسم. أمّا في الترتيب فتبقى باسمك المستعار.",
    prenom: "الاسم",
    nom: "اللقب",
    nom_opt: "اختياري",
    nom_help: "لا يظهر منه سوى الحرف الأول.",
    submit: "حفظ",
    saving: "جارٍ الحفظ…",
    done: "شكراً.",
    err: "تعذّر الحفظ. أعد المحاولة.",
  },
};
function t(key, fr) {
  const l = getLang();
  return (l !== "fr" && I18N[l]?.[key]) || fr;
}

const STYLE = `<style>
  /* Deux décors : la page d'accueil suit le thème de l'app (tokens), le
     classement vit dans l'arène qui est sombre quel que soit le thème. Une
     seule carte, un modificateur — sinon le texte blanc de l'arène atterrit
     sur le fond clair de l'accueil et devient illisible (vu le 01/08). */
  .idp{margin:18px 16px 4px;padding:16px;border-radius:18px;
    background:var(--su);border:1px solid var(--bo);
    font-family:'Archivo',sans-serif}
  .idp-t{font:800 16.5px/1.25 'Archivo',sans-serif;color:var(--ink);margin:0 0 5px}
  .idp-s{font:500 13px/1.45 'Archivo',sans-serif;color:var(--mu);margin:0 0 13px}
  .idp-l{display:block;font:700 10.5px/1 'Archivo',sans-serif;letter-spacing:.05em;
    text-transform:uppercase;color:var(--mu);margin:0 0 5px 2px}
  .idp-opt{text-transform:none;letter-spacing:0;font-weight:600;opacity:.75}
  .idp-i{width:100%;box-sizing:border-box;height:46px;padding:0 12px;
    border-radius:11px;border:1px solid var(--bo);background:var(--bg);
    color:var(--ink);font:600 15px/1.3 'Archivo',sans-serif}
  .idp-i::placeholder{color:var(--mu)}
  .idp-i:focus{outline:0;border-color:var(--a);
    box-shadow:0 0 0 3px color-mix(in srgb, var(--a) 22%, transparent)}
  .idp-row2{margin-top:11px}
  .idp-h{font:500 11.5px/1.4 'Archivo',sans-serif;color:var(--mu);margin:5px 2px 0}
  .idp-h.err{color:#e5484d;font-weight:600}
  .idp-btn{width:100%;min-height:46px;margin-top:13px;border:0;border-radius:11px;
    background:var(--a);color:#fff;cursor:pointer;
    font:800 14.5px/1 'Archivo',sans-serif}
  .idp-btn:disabled{opacity:.45;cursor:default}
  .idp-btn:active:not(:disabled){transform:scale(.98)}
  html[data-theme="light"] .idp-i{background:#fff}

  /* ── Dans l'arène du classement ── */
  .idp--dark{margin:0 14px 14px;background:rgba(255,255,255,.06);
    border-color:rgba(255,255,255,.13)}
  .idp--dark .idp-t{color:#fff}
  .idp--dark .idp-s,.idp--dark .idp-l{color:#cabfef}
  .idp--dark .idp-h{color:#a396d6}
  .idp--dark .idp-h.err{color:#ff9ba0}
  .idp--dark .idp-i{background:rgba(0,0,0,.24);color:#fff;
    border-color:rgba(255,255,255,.16)}
  .idp--dark .idp-i::placeholder{color:rgba(255,255,255,.38)}
  .idp--dark .idp-i:focus{border-color:#ffce4d;box-shadow:0 0 0 3px rgba(255,206,77,.2)}
  .idp--dark .idp-btn{background:linear-gradient(180deg,#ffe39a,#f0a500);color:#1a1233}
</style>`;

/** true quand le profil n'a encore aucun vrai prénom (juste le préfixe email). */
export function needsPrenom(me) {
  if (!me || me.role !== "eleve") return false;
  const prefix = String(me.email || "").split("@")[0];
  const p = (me.prenom || "").trim();
  return !p || p === prefix;
}

/** @param {{dark?: boolean}} opts dark = posée dans l'arène du classement */
export function identityPromptHTML(me, opts = {}) {
  if (!needsPrenom(me)) return "";
  const rtl = getLang() === "ar" ? ' dir="rtl"' : "";
  const skin = opts.dark ? " idp--dark" : "";
  return `${STYLE}
  <section class="idp${skin}" id="arn-idp"${rtl} aria-labelledby="arn-idp-t">
    <h2 class="idp-t" id="arn-idp-t">${t("title", "Comment on t'appelle ?")}</h2>
    <p class="idp-s">${t("sub", "Ton moniteur voit ce nom. Dans le classement tu restes sous ton pseudo.")}</p>
    <label class="idp-l" for="arn-idp-p">${t("prenom", "Prénom")}</label>
    <input class="idp-i" id="arn-idp-p" type="text" autocomplete="given-name" maxlength="40" />
    <div class="idp-row2">
      <label class="idp-l" for="arn-idp-n">${t("nom", "Nom")} <span class="idp-opt">${t("nom_opt", "facultatif")}</span></label>
      <input class="idp-i" id="arn-idp-n" type="text" autocomplete="family-name" maxlength="40" />
      <p class="idp-h">${t("nom_help", "Seule l'initiale est affichée.")}</p>
    </div>
    <p class="idp-h" id="arn-idp-err" hidden></p>
    <button class="idp-btn" id="arn-idp-btn" type="button" disabled>${t("submit", "Enregistrer")}</button>
  </section>`;
}

export function wireIdentityPrompt(root, onSaved) {
  const card = root.querySelector("#arn-idp");
  if (!card) return;
  const pEl = card.querySelector("#arn-idp-p");
  const nEl = card.querySelector("#arn-idp-n");
  const errEl = card.querySelector("#arn-idp-err");
  const btn = card.querySelector("#arn-idp-btn");

  const validate = () => {
    btn.disabled = pEl.value.trim().length < 2;
  };
  pEl.addEventListener("input", validate);
  validate();

  btn.addEventListener("click", async () => {
    const prenom = pEl.value.trim();
    const nom = nEl.value.trim();
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = t("saving", "Enregistrement…");
    errEl.hidden = true;
    try {
      const { error } = await sb.rpc("set_my_identity", {
        p_prenom: prenom,
        p_nom: nom || null,
      });
      if (error) throw error;
      track("identity_prompt.saved", { with_nom: !!nom });
      const me = getCurUser();
      if (me) setCurUser({ ...me, prenom, nom: nom || me.nom });
      const { toast } = await import("@/components/common/toast.js");
      toast(t("done", "Merci."), "success", 2200);
      card.remove();
      onSaved?.();
    } catch (e) {
      console.error("[identity-prompt] save failed", e);
      errEl.textContent = t("err", "Enregistrement impossible. Réessaie.");
      errEl.hidden = false;
      errEl.classList.add("err");
      btn.textContent = label;
      validate();
    }
  });
}
