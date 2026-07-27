// ═══════════════════════════════════════════════════════════════
// Classement élève — « Arène Podium » (skin partagé arene-rank.js)
//  - Ligue Conduite = REMC (validations moniteur, /31) · portée Mon école / National
//  - Ligue Révision = effort solo (quiz + examens blancs, /50), cf. theory-league.js
// Deep-link : #/classement/ecole | /national | /revision
// Aucun nom réel exposé hors Hall of Fame : pseudo ou « Apprenti ».
// Élève SOLO (sans moniteur) : portée nationale + classement complété par
// des profils fictifs façon Duolingo (cf. utils/league-bots.js) le temps
// que la vraie base se remplisse.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { getLang } from "@/utils/lang.js";
import { track } from "@/services/analytics.js";
import { playPop, playClick } from "@/utils/sound.js";
import { haptic } from "@/utils/haptic.js";
import { fmtName } from "@/utils/fmt-name.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { THEORY_LEAGUES, theoryLeague } from "@/utils/theory-league.js";
import { msToNextMonday, fmtCountdown } from "@/utils/league-shared.js";
import { blendLeagueRows, isSoloEleve } from "@/utils/league-bots.js";
import {
  ARENE_CSS,
  arenePodium,
  areneRow,
  areneMeRow,
  arenePaliers,
} from "@/components/common/arene-rank.js";
import { recompensesTabs } from "@/components/eleve/recompenses-tabs.js";
import { medallion } from "@/utils/medallions.js";

const LIMIT = 50;

// ─── Paliers Conduite (REMC, /31) — 4 mondes, échelle accent ──────
// endAt = score atteint quand le monde est terminé.
const REMC_LEAGUES = [
  {
    id: "C1",
    name: "Maîtrise véhicule",
    endAt: 9,
    color: "color-mix(in srgb, var(--acc) 50%, #fff)",
  },
  {
    id: "C2",
    name: "Circulation",
    endAt: 17,
    color: "color-mix(in srgb, var(--acc) 78%, #fff)",
  },
  { id: "C3", name: "Conditions diff.", endAt: 24, color: "var(--acc)" },
  { id: "C4", name: "Conduite autonome", endAt: 31, color: "var(--acc-dk)" },
];

// Accent de l'arène : l'accent du COMPTE partout (« aux couleurs de token,
// trop de variations » — Rayan 17/07). L'ancien bleu dédié à la Révision est
// abandonné — une seule famille de couleur, la ligue unique suit l'accent.
const CONDUITE_ACCENT =
  "--acc:var(--a);--acc-lt:var(--a-lt);--acc-dk:var(--adk)";
const REVISION_ACCENT = CONDUITE_ACCENT;

// ── i18n de la COQUE Classement (élève non-francophone) : libellés,
// boutons, états vides/erreur, aria-labels, noms de paliers/récompenses.
// Les pseudos/scores restent tels quels. Repli FR systématique.
const CL_I18N = {
  en: {
    title: "Leaderboard",
    loading: "Loading…",
    err_title: "“Leaderboard” unavailable",
    err_sub: "Check your connection, then try again.",
    retry: "Try again",
    tab_conduite: "Driving",
    tab_conduite_sub: "in the car",
    tab_revision: "Revision",
    tab_revision_sub: "on your own",
    sub_revision: "Your effort this week — quizzes & mock exams",
    sub_conduite_solo: "Driving skills validated",
    sub_conduite_moniteur: "Validated in a lesson with your instructor",
    link_pseudo_t: "Choose your public nickname",
    link_pseudo_s: "Otherwise you'll show up as “Apprentice”.",
    season: "Season",
    scope_solo: "PermiGo students",
    scope_ecole: "My school",
    scope_national: "National",
    scope_aria: "Leaderboard scope",
    effectif_one: "out of {n} student",
    effectif_other: "out of {n} students",
    empty_revision:
      "The weekly leaderboard starts as soon as two students have scored revision points.",
    empty_conduite:
      "The leaderboard appears as soon as two students have validated a skill with their instructor.",
    quiz_cta: "Do a quiz to climb up",
    hof_badge: "Licence earned",
    hof_title_suffix: "licence earned",
    nudge_lead: "You're in the lead. Stay ahead.",
    nudge_need: "You need <b>{x}</b> to {y}.",
    unit_point: "point",
    unit_points: "points",
    unit_comp: "skill",
    unit_comps: "skills",
    place_first: "take 1st place",
    pal_title_revision: "Revision tiers",
    pal_title_conduite: "Driving tiers",
    pal_goal_certified: "Certified",
    pal_goal_objective: "Goal: {name}",
    pal_no_rank: "Not ranked yet",
    pal_goal_ready_exam: "Exam ready",
    list_head_top: "From 4th place",
  },
  ar: {
    title: "الترتيب",
    loading: "جارٍ التحميل…",
    err_title: "تعذّر تحميل «الترتيب»",
    err_sub: "تحقّق من اتصالك ثم أعد المحاولة.",
    retry: "أعد المحاولة",
    tab_conduite: "القيادة",
    tab_conduite_sub: "داخل السيارة",
    tab_revision: "المراجعة",
    tab_revision_sub: "بمفردك",
    sub_revision: "مجهودك هذا الأسبوع — اختبارات ومحاكاة الامتحان",
    sub_conduite_solo: "مهارات القيادة المثبَّتة",
    sub_conduite_moniteur: "مثبَّت في حصة مع مدرّبك",
    link_pseudo_t: "اختر اسمك المستعار العام",
    link_pseudo_s: "وإلا فستظهر باسم «متمرّن».",
    season: "الموسم",
    scope_solo: "طلاب بيرميغو",
    scope_ecole: "مدرستي",
    scope_national: "وطني",
    scope_aria: "نطاق الترتيب",
    effectif: "من أصل {n} طالب",
    empty_revision: "يبدأ ترتيب الأسبوع فور حصول طالبَين على نقاط في المراجعة.",
    empty_conduite: "يظهر الترتيب فور تثبيت مهارة من طالبَين مع مدرّبَيهما.",
    quiz_cta: "أنجز اختباراً لتتقدّم",
    hof_badge: "حصل على رخصته",
    hof_title_suffix: "حصلوا على رخصتهم",
    nudge_lead: "أنت في الصدارة. حافظ على تقدّمك.",
    nudge_need: "ينقصك <b>{x}</b> {y}.",
    unit_point: "نقطة",
    unit_points: "نقاط",
    unit_comp: "مهارة",
    unit_comps: "مهارات",
    place_first: "لتحصل على المركز الأول",
    pal_title_revision: "مستويات المراجعة",
    pal_title_conduite: "مستويات القيادة",
    pal_goal_certified: "مُثبتة",
    pal_goal_objective: "الهدف: {name}",
    pal_no_rank: "لم تُصنَّف بعد",
    pal_goal_ready_exam: "جاهز للامتحان",
    list_head_top: "بدءاً من المركز الرابع",
  },
};
// Traduit-ou-français (repli FR systématique, jamais de texte vide).
function xt(key, fr) {
  const l = getLang();
  return (l !== "fr" && CL_I18N[l]?.[key]) || fr;
}
// RTL : enveloppe le TEXTE arabe dans un span dir="rtl" (jamais <html dir>,
// jamais sur un conteneur flex — juste le texte inline). Sûr partout.
function xD(html) {
  return getLang() === "ar" ? `<span dir="rtl" lang="ar">${html}</span>` : html;
}
// Isolation LTR pour un nombre/compteur inséré dans une phrase arabe.
function xN(html) {
  return getLang() === "ar" ? `<span dir="ltr">${html}</span>` : html;
}
// Ordinal anglais (1st/2nd/3rd/4th/11th…) pour le nudge de classement.
function _ordinalEn(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  const s = ["th", "st", "nd", "rd"];
  return `${n}${s[n % 10] || s[0]}`;
}
// Traduction des noms de paliers Révision (THEORY_LEAGUES, alignés par n=1..5
// — robuste même après renommage du libellé FR source).
const TL_NAMES_I18N = {
  en: ["Novice", "Apprentice", "Committed", "Confirmed", "Revision certified"],
  ar: ["مبتدئ", "متمرّن", "ملتزم", "مؤكَّد", "مراجعة مُثبتة"],
};
function tlName(l) {
  if (!l) return "";
  const lang = getLang();
  if (lang === "fr") return l.name;
  return TL_NAMES_I18N[lang]?.[l.n - 1] || l.name;
}
// Traduction des noms de paliers Conduite (REMC_LEAGUES, définis ci-dessous,
// par id C1..C4).
const REMC_NAMES_I18N = {
  en: {
    C1: "Vehicle mastery",
    C2: "Traffic",
    C3: "Difficult conditions",
    C4: "Independent driving",
  },
  ar: {
    C1: "التحكم في المركبة",
    C2: "حركة المرور",
    C3: "ظروف صعبة",
    C4: "قيادة مستقلة",
  },
};
function remcName(l) {
  if (!l) return "";
  const lang = getLang();
  if (lang === "fr") return l.name;
  return REMC_NAMES_I18N[lang]?.[l.id] || l.name;
}
// « sur X élève(s) » — pluriel géré (fr logique d'origine ; en singulier/
// pluriel dédié ; ar forme invariable, correcte au singulier/pluriel/duel).
function _effectifTxt(n) {
  if (n <= 0) return "";
  const lang = getLang();
  if (lang === "en") {
    const tpl = CL_I18N.en[n > 1 ? "effectif_other" : "effectif_one"];
    return tpl.replace("{n}", String(n));
  }
  if (lang === "ar") return CL_I18N.ar.effectif.replace("{n}", String(n));
  return `sur ${n} élève${n > 1 ? "s" : ""}`;
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root, initialTab) {
  const me = getCurUser();
  if (!me) return;
  track("page_view", { page: "classement", user_role: me.role });

  // Élève solo : pas d'école → portée nationale (sinon ligue vide, il n'y
  // apparaîtrait même pas lui-même), complétée par des profils fictifs.
  const solo = isSoloEleve(me);
  const scope = solo ? "national" : "ecole";

  root.innerHTML = `${ARENE_CSS}<div class="arn" style="${CONDUITE_ACCENT}">
    <div class="arn-hd"><h1>${xD(esc(xt("title", "Classement")))}</h1><p class="arn-sub">${xD(esc(xt("loading", "Chargement…")))}</p></div>
    <div class="arn-list">${Array.from({ length: 5 })
      .map(
        () =>
          `<div class="arn-row" style="opacity:.4"><span class="arn-rk"></span><span class="arn-nm"></span></div>`,
      )
      .join("")}</div>
  </div>`;

  const [ecoleRes, nationalRes, theorieRes, theorieWeeklyRes, hofRes] =
    await Promise.all([
      sb.rpc("get_eleve_leaderboard", { p_scope: scope, p_limit: LIMIT }).then(
        (r) => r,
        () => ({ data: null }),
      ),
      sb
        .rpc("get_eleve_leaderboard", { p_scope: "national", p_limit: LIMIT })
        .then(
          (r) => r,
          () => ({ data: null }),
        ),
      sb.rpc("get_theory_leaderboard", { p_scope: scope, p_limit: LIMIT }).then(
        (r) => r,
        () => ({ data: null }),
      ),
      sb
        .rpc("get_theory_leaderboard_weekly", {
          p_scope: scope,
          p_limit: LIMIT,
        })
        .then(
          (r) => r,
          () => ({ data: null }),
        ),
      sb.rpc("get_hall_of_fame", { p_scope: scope, p_limit: 100 }).then(
        (r) => r,
        () => ({ data: null }),
      ),
    ]);

  // Panne totale (réseau/RPC) ≠ « pas encore classé » : on affiche un vrai
  // état d'erreur avec Réessayer au lieu d'un faux classement vide.
  const allFailed = [ecoleRes, nationalRes, theorieRes, hofRes].every(
    (r) => r.error || r.data == null,
  );
  if (allFailed) {
    root.innerHTML = `${ARENE_CSS}<div class="arn" style="${CONDUITE_ACCENT}">
      <div class="arn-hd"><h1>${xD(esc(xt("title", "Classement")))}</h1><p class="arn-sub">${xD(esc(xt("err_title", "« Classement » indisponible")))}</p></div>
      <div style="padding:28px 20px;text-align:center">
        <p style="font:600 13.5px/1.5 'Inter',sans-serif;color:var(--amute);margin:0 0 16px">${xD(esc(xt("err_sub", "Vérifie ta connexion, puis réessaie.")))}</p>
        <button id="arn-retry" style="font:800 14px 'Inter',sans-serif;padding:13px 28px;border-radius:14px;border:0;background:var(--aup);color:#04220f;cursor:pointer">${xD(esc(xt("retry", "Réessayer")))}</button>
      </div>
    </div>`;
    root
      .querySelector("#arn-retry")
      ?.addEventListener("click", () => mount(root, initialTab));
    return;
  }

  // Solo : on complète Conduite + Révision avec des profils fictifs (les
  // vraies lignes et les vrais scores sont conservés, rangs recalculés).
  const blend = (rows, ligue) =>
    solo ? blendLeagueRows(rows || [], { ligue, userKey: me.id }) : rows || [];
  const data = {
    ecole: blend(ecoleRes.data, "conduite"),
    national: blend(nationalRes.data, "conduite"),
    theorie: theorieRes.data || [], // à vie → paliers de progression
    theorieWeekly: blend(theorieWeeklyRes.data, "revision"), // saison → classement affiché
    hof: hofRes.data || [],
  };
  if (solo)
    track("league.bots_filled", {
      conduite: data.ecole.filter((r) => r.bot).length,
      revision: data.theorieWeekly.filter((r) => r.bot).length,
    });

  // État : ligue (conduite|revision) + portée (ecole|national, Conduite only).
  const DEEP = {
    ecole: { ligue: "conduite", scope: "ecole" },
    national: { ligue: "conduite", scope: "national" },
    revision: { ligue: "revision", scope: "ecole" },
    theorie: { ligue: "revision", scope: "ecole" },
  };
  const state = {
    // Ligue UNIQUE (pivot 17/07) : sans deep-link, on arrive sur LA ligue —
    // la saison hebdo. Les deep-links Conduite (#/classement/ecole|national)
    // restent valides le temps de trancher le sort de l'onglet avec Rayan.
    ...(DEEP[initialTab] || { ligue: "revision", scope: "ecole" }),
    solo,
  };

  const rerender = () => {
    root.innerHTML = `${ARENE_CSS}${_renderArena(state, data)}`;
    _wire(root, state, data, rerender);
  };
  rerender();
}

// ─── Helpers données ─────────────────────────────────────────────
const OF = { conduite: 31, revision: 50 };

function _rowsFor(state, data) {
  // Révision = classement de la SAISON (points de la semaine). Repli sur le
  // classement THÉORIE À VIE si le hebdo est vide/en panne — sinon la ligue
  // (onglet par défaut) s'affichait « 0 joueur » dès que la seule RPC weekly
  // échouait, alors que les autres classements marchaient (elle est exclue du
  // garde-fou allFailed). Le repli a la même forme de lignes.
  if (state.ligue === "revision")
    return data.theorieWeekly.length ? data.theorieWeekly : data.theorie;
  return state.scope === "national" ? data.national : data.ecole;
}
function _myRow(rows) {
  return rows.find((r) => r.is_me === true) || null;
}
function _fmtScore(ligue) {
  const of = OF[ligue];
  return (r) => ({ value: r.score ?? 0, suffix: `/${of}` });
}

// Palier courant (pour la ligne « Toi ») + rail des paliers.
function _paliersData(ligue, score) {
  const s = Math.max(0, score || 0);
  if (ligue === "revision") {
    const items = THEORY_LEAGUES.map((l) => ({
      short: String(l.startAt),
      name: tlName(l),
    }));
    const done = THEORY_LEAGUES.filter((l) => s >= l.startAt).length; // tiers entamés
    const info = theoryLeague(s);
    return {
      items,
      doneCount: done,
      targetIdx: info.top ? 0 : done + 1,
      title: xt("pal_title_revision", "Paliers Révision"),
      goal: info.top
        ? xt("pal_goal_certified", "Certifiée")
        : xt(
            "pal_goal_objective",
            `Objectif : ${esc(info.next?.name ?? "")}`,
          ).replace("{name}", esc(tlName(info.next))),
      palierName: info.league
        ? tlName(info.league)
        : xt("pal_no_rank", "Pas encore classé"),
      colorOf: (i, isDone) =>
        isDone
          ? `linear-gradient(160deg, ${THEORY_LEAGUES[i].color}, ${THEORY_LEAGUES[i].color})`
          : "linear-gradient(160deg,#3a3568,#262249)",
    };
  }
  const items = REMC_LEAGUES.map((l) => ({ short: l.id, name: remcName(l) }));
  const done = REMC_LEAGUES.filter((l) => s >= l.endAt).length; // mondes finis
  const all = done >= REMC_LEAGUES.length;
  const target = all ? 0 : done + 1;
  return {
    items,
    doneCount: done,
    targetIdx: target,
    title: xt("pal_title_conduite", "Paliers Conduite"),
    goal: all
      ? xt("pal_goal_ready_exam", "Prêt examen")
      : xt(
          "pal_goal_objective",
          `Objectif : ${esc(REMC_LEAGUES[target - 1]?.name ?? "")}`,
        ).replace("{name}", esc(remcName(REMC_LEAGUES[target - 1]))),
    palierName: remcName(REMC_LEAGUES[Math.min(done, 3)]),
    colorOf: (i, isDone) =>
      isDone
        ? `linear-gradient(160deg, ${REMC_LEAGUES[i].color}, ${REMC_LEAGUES[i].color})`
        : "linear-gradient(160deg,#3a3568,#262249)",
  };
}

// Nudge perso (écart de rang réel — pas de delta hebdo inventé).
function _nudge(ligue, rows, mine) {
  if (!mine) return "";
  if (mine.rang === 1)
    return xD(xt("nudge_lead", "Tu es en tête. Reste devant."));
  const above = rows.find((r) => r.rang === mine.rang - 1);
  if (!above) return "";
  const gap = Math.max(0, (above.score ?? 0) - (mine.score ?? 0));
  if (gap <= 0) return "";
  const lang = getLang();
  const plural = gap > 1;
  const unit =
    ligue === "revision"
      ? xt(plural ? "unit_points" : "unit_point", plural ? "points" : "point")
      : xt(
          plural ? "unit_comps" : "unit_comp",
          plural ? "compétences" : "compétence",
        );
  const rank = mine.rang - 1;
  const place =
    rank === 1
      ? xt("place_first", "prendre la 1<sup>re</sup> place")
      : lang === "en"
        ? `take ${_ordinalEn(rank)} place`
        : lang === "ar"
          ? `لتتقدم إلى المركز رقم ${rank}`
          : `passer ${rank}<sup>e</sup>`;
  return xD(
    xt("nudge_need", "Il te manque <b>{x}</b> pour {y}.")
      .replace("{x}", `${gap} ${unit}`)
      .replace("{y}", place),
  );
}

// ─── Render ──────────────────────────────────────────────────────
function _renderArena(state, data) {
  const accent = state.ligue === "revision" ? REVISION_ACCENT : CONDUITE_ACCENT;
  const rows = _rowsFor(state, data);
  const sub = xD(
    esc(
      state.ligue === "revision"
        ? xt("sub_revision", "Ton effort de la semaine — quiz & examens blancs")
        : state.solo
          ? xt("sub_conduite_solo", "Compétences de conduite validées")
          : xt("sub_conduite_moniteur", "Validé en leçon avec ton moniteur"),
    ),
  );

  return `<div class="arn" style="${accent}">
  <div class="arn-hd"><h1>${xD(esc(xt("title", "Classement")))}</h1><p class="arn-sub">${sub}</p></div>

  ${recompensesTabs("classement", { dark: true })}

  <div class="arn-seg" role="tablist">
    <button data-ligue="conduite" role="tab" aria-selected="${state.ligue === "conduite"}">${xD(esc(xt("tab_conduite", "Conduite")))} <span class="sub">${xD(esc(xt("tab_conduite_sub", "en voiture")))}</span></button>
    <button data-ligue="revision" role="tab" aria-selected="${state.ligue === "revision"}">${xD(esc(xt("tab_revision", "Révision")))} <span class="sub">${xD(esc(xt("tab_revision_sub", "en autonomie")))}</span></button>
  </div>

  ${_renderScopebar(state, rows)}
  <div id="arn-body">${_renderBody(state, rows, data)}</div>

  <a class="arn-link" href="#/profil">
    <span aria-hidden="true">${icon("user", { size: 16, strokeWidth: 2 })}</span>
    <span class="arn-link-body">
      <span class="arn-link-t">${xD(esc(xt("link_pseudo_t", "Choisis ton pseudo public")))}</span>
      <span class="arn-link-s">${xD(esc(xt("link_pseudo_s", "Sinon tu apparais en « Apprenti ».")))}</span>
    </span>
    <span style="color:var(--mu)" aria-hidden="true">›</span>
  </a>
</div>`;
}

// Portée Mon école / National (Conduite uniquement) + effectif.
function _renderScopebar(state, rows) {
  const ranked = rows.filter(
    (r) => (r.score ?? 0) > 0 && r.rang != null,
  ).length;
  const effectif = xD(esc(_effectifTxt(ranked)));
  if (state.ligue === "revision") {
    // Saison hebdo : compte à rebours jusqu'au reset (lundi 00:00).
    const cd = xN(esc(fmtCountdown(msToNextMonday())));
    return `<div class="arn-scopebar"><span style="display:inline-flex;align-items:center;gap:5px;font:800 12px/1 'Inter',sans-serif;color:#ffd9cf">${icon("clock", { size: 13, strokeWidth: 2.2 })} ${xD(esc(xt("season", "Saison")))} · <b style="color:#fff;font-variant-numeric:tabular-nums">${cd}</b></span><span class="arn-effectif">${effectif}</span></div>`;
  }
  if (state.solo) {
    // Solo : pas d'école → une seule portée (élèves PermiGo), pas de toggle.
    return `<div class="arn-scopebar"><span style="display:inline-flex;align-items:center;gap:5px;font:800 12px/1 'Inter',sans-serif;color:#cabfef">${icon("users", { size: 13, strokeWidth: 2.2 })} ${xD(esc(xt("scope_solo", "Élèves PermiGo")))}</span><span class="arn-effectif">${effectif}</span></div>`;
  }
  return `<div class="arn-scopebar">
    <div class="arn-scope" role="group" aria-label="${escAttr(xt("scope_aria", "Portée du classement"))}">
      <button data-scope="ecole" aria-pressed="${state.scope === "ecole"}" class="${state.scope === "ecole" ? "on" : ""}">${xD(esc(xt("scope_ecole", "Mon école")))}</button>
      <button data-scope="national" aria-pressed="${state.scope === "national"}" class="${state.scope === "national" ? "on" : ""}">${xD(esc(xt("scope_national", "National")))}</button>
    </div>
    <span class="arn-effectif">${effectif}</span>
  </div>`;
}

function _renderBody(state, rows, data) {
  const ligue = state.ligue;
  const hof = data.hof;
  const mine = _myRow(rows);
  const active = rows.filter((r) => (r.score ?? 0) > 0);

  // Onboarding / vide
  if (active.length < 2) {
    const cta = ligue === "revision" ? _quizCta() : "";
    const txt = xD(
      esc(
        ligue === "revision"
          ? xt(
              "empty_revision",
              "Le classement de la semaine démarre dès que deux élèves ont marqué des points en révision.",
            )
          : xt(
              "empty_conduite",
              "Le classement apparaît dès que deux élèves ont validé une compétence avec leur moniteur.",
            ),
      ),
    );
    return `<div class="arn-empty">
      <div class="arn-empty-ico" style="opacity:1">${
        ligue === "revision"
          ? medallion("eclair", "violet", { size: 48, glow: true })
          : medallion("cible", "red", { size: 48, glow: true })
      }</div>
      <div class="arn-empty-txt">${txt}</div>
    </div>${cta}`;
  }

  const top = active
    .filter((r) => r.rang <= LIMIT)
    .sort((a, b) => a.rang - b.rang);
  const fmt = _fmtScore(ligue);
  const hasPodium = top.length >= 3;
  const podium = hasPodium
    ? arenePodium(top.slice(0, 3), { fmtScore: fmt })
    : "";
  const listRows = hasPodium ? top.slice(3) : top;
  // Paliers Révision = progression cumulée À VIE → on lit le score lifetime
  // (data.theorie), pas le score hebdo du classement affiché (saison).
  const lifeScore =
    ligue === "revision"
      ? (data.theorie.find((r) => r.is_me === true)?.score ?? 0)
      : (mine?.score ?? 0);
  const pal = _paliersData(ligue, lifeScore);

  const list = listRows.length
    ? `<div class="arn-list-head"><span class="lbl">${hasPodium ? xD(esc(xt("list_head_top", "À partir du 4ᵉ"))) : xD(esc(xt("title", "Classement")))}</span><span class="rule"></span></div>
       <div class="arn-list">${listRows.map((r, i) => areneRow(r, { fmtScore: fmt, idx: i })).join("")}</div>`
    : "";

  // Ligne « Toi » épinglée (si je suis classé)
  const meRow = mine
    ? areneMeRow(mine, { fmtScore: fmt, palier: pal.palierName })
    : "";

  const nudge = _nudge(ligue, rows, mine);
  const nudgeHtml = nudge ? `<div class="arn-nudge">${nudge}</div>` : "";

  const rail = arenePaliers(pal);
  const help = ligue === "revision" ? _quizCta() : "";
  // Hall of Fame : seulement ligue Conduite, portée Mon école.
  const hofHtml =
    ligue === "conduite" && state.scope === "ecole" ? _hofSection(hof) : "";

  return `${podium}${nudgeHtml}${list}${meRow}${rail}${help}${hofHtml}`;
}

// CTA « Faire un quiz » (ligue Révision) + aide tuto.
function _quizCta() {
  return `<button class="arn-glass" id="arn-quiz-go" type="button">
    <span class="arn-glass-sheen" aria-hidden="true"></span>
    ${icon("zap", { size: 18, strokeWidth: 2.4 })}
    <span>${xD(esc(xt("quiz_cta", "Faire un quiz pour monter")))}</span>
  </button>`;
}

// Hall of Fame (lauréats — prénom réel, ni rang ni « Toi »).
function _hofSection(hof) {
  if (!hof || hof.length === 0) return "";
  const rows = hof
    .map(
      (g, i) => `<div class="arn-hof-row" style="--i:${i}">
      <span class="arn-av">${renderUserAvatar({ avatar_url: g.avatar, prenom: g.prenom }, 38)}</span>
      <span class="arn-nm">${esc(fmtName(g.prenom))}</span>
      <span class="arn-hof-badge">${icon("award", { size: 12, strokeWidth: 2.4 })} ${xD(esc(xt("hof_badge", "Permis obtenu")))}</span>
    </div>`,
    )
    .join("");
  return `<div class="arn-hof-title">${icon("award", { size: 13, strokeWidth: 2.2 })} Hall of Fame — ${xD(esc(xt("hof_title_suffix", "permis obtenu")))}</div>${rows}`;
}

// ─── Wire ────────────────────────────────────────────────────────
function _wire(root, state, data, rerender) {
  // Bascule de ligue
  root.querySelectorAll(".arn-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      const next = b.dataset.ligue;
      if (next === state.ligue) return;
      state.ligue = next;
      if (next === "conduite" && !state.scope) state.scope = "ecole";
      haptic("select");
      playPop();
      track("classement.ligue_changed", { ligue: next });
      rerender();
    });
  });

  // Bascule de portée (Conduite)
  root.querySelectorAll(".arn-scope button").forEach((b) => {
    b.addEventListener("click", () => {
      const next = b.dataset.scope;
      if (next === state.scope) return;
      state.scope = next;
      haptic("select");
      playClick();
      track("classement.scope_changed", { scope: next });
      rerender();
    });
  });

  // CTA quiz + aide tuto (délégation sur .arn, PAS sur root=#app persistant :
  // _wire() est rappelé à chaque rerender → un listener sur root s'accumulerait
  // à chaque bascule d'onglet/scope et de visite en visite. .arn est recréé par
  // innerHTML à chaque rerender, donc son listener meurt avec l'ancien nœud.
  root.querySelector(".arn")?.addEventListener("click", (e) => {
    if (e.target.closest("#arn-quiz-go")) {
      haptic("tap");
      playClick();
      track("revision_quiz.shortcut", { from: "classement" });
      location.hash = `#/quiz/next/post_validation/revision/${Date.now()}`;
    }
  });
}
