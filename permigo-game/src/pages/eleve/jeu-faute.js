// ═══════════════════════════════════════════════════════════════
// Élève — « Trouve la faute » : repère l'action qui est une faute
// éliminatoire parmi 3. Réutilise le composant premium-quiz (pick 1/3).
// Contenu : src/data/jeu-faute.json. 100% front, 0 DB.
// ═══════════════════════════════════════════════════════════════
import { navigate } from "@/router.js";
import { track } from "@/services/analytics.js";
import { mountPremiumQuiz } from "@/components/eleve/premium-quiz.js";
import { loadJeuFauteSession } from "@/data/quiz-conduite-loader.js";
import { getLang } from "@/utils/lang.js";
import { esc } from "@/utils/escape.js";

// i18n de la COQUE (élève non-francophone) — état vide seulement (le titre du
// quiz « Trouve la faute » est passé tel quel au composant partagé
// premium-quiz.js, hors scope de cette tâche). Dict local (règle coque),
// repli FR si clé absente.
const JF_I18N = {
  en: {
    empty_title: "Nothing to review for now",
    empty_sub:
      "Mistakes come from your driving sheets. Read one to get started.",
    empty_cta: "See driving sheets",
  },
  ar: {
    empty_title: "لا شيء للمراجعة حاليًا",
    empty_sub: "الأخطاء تأتي من بطاقات القيادة الخاصة بك. اقرأ واحدة للبدء.",
    empty_cta: "عرض بطاقات القيادة",
  },
};
function jft(key, fr) {
  const l = getLang();
  return (l !== "fr" && JF_I18N[l]?.[key]) || fr;
}
// RTL par ATTRIBUT sur le bloc de texte (jamais <html dir> — règle lang.js).
function jfRtl() {
  return getLang() === "ar" ? ' dir="rtl" lang="ar"' : "";
}

export async function mount(root) {
  track("page_view", { page: "jeu-faute" });
  const questions = await loadJeuFauteSession(8);
  if (!questions.length) {
    // État vide explicite plutôt qu'une redirection muette (cul-de-sac invisible)
    root.innerHTML = `
<div style="min-height:60dvh;display:flex;align-items:center;justify-content:center;padding:24px">
  <div style="text-align:center;max-width:300px">
    <div style="font-size:40px;margin-bottom:12px" aria-hidden="true">🧐</div>
    <div style="font:700 17px/1.3 'Archivo',sans-serif;color:var(--ink);margin-bottom:6px"${jfRtl()}>${esc(jft("empty_title", "Rien à revoir pour l’instant"))}</div>
    <p style="font:500 13.5px/1.5 'Archivo',sans-serif;color:var(--mu);margin-bottom:18px"${jfRtl()}>${esc(jft("empty_sub", "Les fautes viennent de tes fiches de conduite. Lis-en une pour commencer."))}</p>
    <button id="jf-empty-cta" style="min-height:44px;padding:12px 20px;border:0;border-radius:14px;background:var(--a);color:var(--a-ink);font:600 14px/1 'Archivo',sans-serif;cursor:pointer"${jfRtl()}>${esc(jft("empty_cta", "Voir les fiches de conduite"))}</button>
  </div>
</div>`;
    root
      .querySelector("#jf-empty-cta")
      ?.addEventListener("click", () => navigate("#/revision-conduite"));
    return;
  }
  mountPremiumQuiz(root, {
    questions,
    title: "Trouve la faute",
    onExit: () => navigate("#/revision-conduite"),
  });
}
