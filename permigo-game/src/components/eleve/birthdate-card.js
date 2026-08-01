// ═══════════════════════════════════════════════════════════════
// Carte « ta date de naissance » — posée DANS l'accueil, jamais en pop-up.
//
// Pourquoi elle existe : l'inscription est tombée à deux champs (email + mot
// de passe). La date de naissance reste une obligation légale — en dessous de
// 15 ans, l'accord d'un parent est requis (art. 8 RGPD) — mais la demander
// avant que l'élève ait vu le produit faisait fuir des gens pour rien.
//
// Règles de conception :
//  · Une carte NORMALE dans le flux de la page. Pas de modale, pas de voile,
//    rien qui se met devant. On peut l'ignorer et jouer.
//  · Rien n'est bloqué tant qu'elle n'est pas remplie. Le seul verrou légal
//    (mineur sans accord parental) se déclenche APRÈS la réponse.
//  · Elle disparaît dès qu'elle est remplie et ne revient jamais.
//
// Voir aussi : set_my_birthdate() (migration 20260801200000) et
// route-guards.js qui monte l'écran de consentement quand il le faut.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser, setCurUser } from "@/auth/cur-user.js";
import { getLang } from "@/utils/lang.js";
import { track } from "@/services/analytics.js";

const I18N = {
  en: {
    kicker: "One last thing",
    title: "Your date of birth is used for one thing",
    sub: "Knowing whether we must ask a parent. Under 15 the law requires their consent.",
    label: "Your date of birth",
    parent_label: "A parent's email",
    parent_help:
      "You're under 15. Your parent gets a link and your account unlocks as soon as they agree.",
    submit: "Save",
    saving: "Saving…",
    done: "Noted. Thanks.",
    err_date: "Check that date.",
    err_parent: "Enter a valid parent email.",
    err_generic: "Could not save. Try again.",
  },
  ar: {
    kicker: "أمر أخير",
    title: "تاريخ ميلادك يُستعمل لشيء واحد",
    sub: "لنعرف إن كان علينا أخذ موافقة أحد والديك. تحت 15 سنة يفرض القانون ذلك.",
    label: "تاريخ ميلادك",
    parent_label: "بريد أحد الوالدين",
    parent_help:
      "عمرك أقل من 15 سنة. يصل رابط إلى والدك ويُفتح حسابك بمجرّد موافقته.",
    submit: "حفظ",
    saving: "جارٍ الحفظ…",
    done: "تمّ. شكراً.",
    err_date: "تحقّق من التاريخ.",
    err_parent: "أدخِل بريد أحد الوالدين صحيحاً.",
    err_generic: "تعذّر الحفظ. أعد المحاولة.",
  },
};
function t(key, fr) {
  const l = getLang();
  return (l !== "fr" && I18N[l]?.[key]) || fr;
}

const STYLE = `<style>
  .bdc{margin:18px 16px 4px;padding:16px;border-radius:18px;
    background:var(--su);border:1px solid var(--bo);
    font-family:'Archivo',sans-serif}
  .bdc-k{font:700 10.5px/1 'Archivo',sans-serif;letter-spacing:.09em;
    text-transform:uppercase;color:var(--a);margin:0 0 8px}
  .bdc-t{font:800 17px/1.25 'Archivo',sans-serif;color:var(--ink);margin:0 0 6px}
  .bdc-s{font:500 13.5px/1.5 'Archivo',sans-serif;color:var(--mu);margin:0 0 14px}
  .bdc-l{display:block;font:700 11px/1 'Archivo',sans-serif;letter-spacing:.05em;
    text-transform:uppercase;color:var(--mu);margin:0 0 6px 2px}
  .bdc-i{width:100%;box-sizing:border-box;height:48px;padding:0 13px;
    border-radius:12px;border:1px solid var(--bo);background:var(--bg);
    color:var(--ink);font:600 15.5px/1.3 'Archivo',sans-serif}
  .bdc-i:focus{outline:0;border-color:var(--a);
    box-shadow:0 0 0 3px color-mix(in srgb, var(--a) 22%, transparent)}
  .bdc-i[type="date"]::-webkit-calendar-picker-indicator{cursor:pointer}
  .bdc-parent{margin-top:12px}
  .bdc-h{font:500 12px/1.45 'Archivo',sans-serif;color:var(--mu);margin:6px 2px 0}
  .bdc-h.err{color:#e5484d;font-weight:600}
  .bdc-btn{width:100%;min-height:48px;margin-top:14px;border:0;border-radius:12px;
    background:var(--a);color:#fff;cursor:pointer;
    font:800 15px/1 'Archivo',sans-serif}
  .bdc-btn:disabled{opacity:.5;cursor:default}
  .bdc-btn:active:not(:disabled){transform:scale(.98)}
  html[data-theme="light"] .bdc-i{background:#fff}
</style>`;

/** Rendu de la carte. Chaîne VIDE si la date est déjà connue. */
export function birthdateCardHTML(me) {
  if (!me || me.role !== "eleve" || me.date_naissance) return "";
  const rtl = getLang() === "ar" ? ' dir="rtl"' : "";
  const max = new Date().toISOString().slice(0, 10);
  return `${STYLE}
  <section class="bdc" id="acc-bdc"${rtl} aria-labelledby="acc-bdc-t">
    <p class="bdc-k">${t("kicker", "Un dernier point")}</p>
    <h2 class="bdc-t" id="acc-bdc-t">${t("title", "Ta date de naissance sert à une seule chose")}</h2>
    <p class="bdc-s">${t("sub", "Savoir si on doit demander l'accord d'un parent. En dessous de 15 ans la loi l'exige.")}</p>
    <label class="bdc-l" for="acc-bdc-date">${t("label", "Ta date de naissance")}</label>
    <input class="bdc-i" id="acc-bdc-date" type="date" max="${max}" />
    <div class="bdc-parent" id="acc-bdc-parent" style="display:none">
      <label class="bdc-l" for="acc-bdc-pmail">${t("parent_label", "Email d'un parent")}</label>
      <input class="bdc-i" id="acc-bdc-pmail" type="email" autocomplete="off" placeholder="parent@exemple.fr" />
      <p class="bdc-h">${t("parent_help", "Tu as moins de 15 ans. Ton parent reçoit un lien et ton compte s'ouvre dès qu'il accepte.")}</p>
    </div>
    <p class="bdc-h" id="acc-bdc-err" hidden></p>
    <button class="bdc-btn" id="acc-bdc-btn" type="button" disabled>${t("submit", "C'est noté")}</button>
  </section>`;
}

// Moins de 15 ans — âge du consentement numérique en France. Même règle que
// set_my_birthdate() côté base ; ici c'est juste pour afficher le champ parent.
function isMinorDate(str) {
  if (!str) return false;
  const b = new Date(str);
  if (isNaN(b.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age < 15;
}

const emailOk = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim());

export function wireBirthdateCard(root) {
  const card = root.querySelector("#acc-bdc");
  if (!card) return;
  const dateEl = card.querySelector("#acc-bdc-date");
  const parentRow = card.querySelector("#acc-bdc-parent");
  const parentEl = card.querySelector("#acc-bdc-pmail");
  const errEl = card.querySelector("#acc-bdc-err");
  const btn = card.querySelector("#acc-bdc-btn");
  let seen = false;

  const showErr = (msg) => {
    errEl.textContent = msg || "";
    errEl.hidden = !msg;
    errEl.classList.toggle("err", !!msg);
  };

  const validate = () => {
    const minor = isMinorDate(dateEl.value);
    parentRow.style.display = minor ? "" : "none";
    btn.disabled = !dateEl.value || (minor && !emailOk(parentEl.value));
  };
  dateEl.addEventListener("input", () => {
    if (!seen) {
      seen = true;
      track("birthdate_card.started");
    }
    showErr("");
    validate();
  });
  parentEl.addEventListener("input", validate);
  validate();

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = t("saving", "Enregistrement…");
    showErr("");
    try {
      const { data, error } = await sb.rpc("set_my_birthdate", {
        p_date_naissance: dateEl.value,
        p_parent_email: parentEl.value.trim() || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const minor = !!row?.consent_required;
      track("birthdate_card.saved", { minor });

      const me = getCurUser();
      if (me) setCurUser({ ...me, date_naissance: dateEl.value });

      // Mineur : le mur de consentement parental doit prendre la main tout de
      // suite. On recharge, route-guards.js monte l'écran d'attente.
      if (minor) {
        window.location.reload();
        return;
      }
      const { toast } = await import("@/components/common/toast.js");
      toast(t("done", "C'est noté. Merci."), "success", 2600);
      card.remove();
    } catch (e) {
      console.error("[birthdate-card] save failed", e);
      const msg = /parent_email_required/i.test(e?.message || "")
        ? t("err_parent", "Renseigne un email de parent valide.")
        : /invalid_birthdate/i.test(e?.message || "")
          ? t("err_date", "Vérifie cette date.")
          : t("err_generic", "Enregistrement impossible. Réessaie.");
      showErr(msg);
      btn.textContent = label;
      validate();
    }
  });
}
