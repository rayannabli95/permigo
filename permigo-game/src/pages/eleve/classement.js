// ═══════════════════════════════════════════════════════════════
// Classement élève — « Arène Podium » (skin partagé arene-rank.js)
//
// LIGUE UNIQUE (décision Rayan 30/07/2026) : UNE seule ligue, celle des
// COMPÉTENCES QUE L'ÉLÈVE A CERTIFIÉES (/31) · portée Mon école / National.
// Source : get_eleve_leaderboard — la RPC fusionne déjà `self_validations`
// (l'élève certifie lui-même, pivot 17/07) et les anciennes `validations`
// moniteur (gelées depuis le retrait de l'émission moniteur, lot 4 du
// 30/07) : personne ne perd la progression déjà affichée dans son parcours.
//
// L'ancien onglet « Révision » (points de quiz de la semaine,
// get_theory_leaderboard_weekly) est retiré : deux ligues côte à côte
// racontaient deux produits. Les points de révision restent une
// PROGRESSION personnelle (paliers Novice → Maîtrisée, theory-league.js),
// plus un classement.
//
// Deep-link : #/classement/ecole | /national (les anciens /revision et
// /theorie restent valides et atterrissent sur LA ligue).
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
import { playClick } from "@/utils/sound.js";
import { haptic } from "@/utils/haptic.js";
import { fmtName } from "@/utils/fmt-name.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
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
const TOTAL_COMPETENCES = 31;

// ─── Paliers (REMC, /31) — 4 mondes, échelle accent ───────────────
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
// trop de variations » — Rayan 17/07). Une seule famille de couleur.
const ARENE_ACCENT = "--acc:var(--a);--acc-lt:var(--a-lt);--acc-dk:var(--adk)";

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
    sub: "The skills you have certified",
    link_pseudo_t: "Choose your public nickname",
    link_pseudo_s: "Otherwise you'll show up as “Apprentice”.",
    scope_solo: "PermiGo students",
    scope_ecole: "My school",
    scope_national: "National",
    scope_aria: "Leaderboard scope",
    effectif_one: "out of {n} student",
    effectif_other: "out of {n} students",
    empty:
      "The leaderboard appears as soon as two students have certified a skill.",
    certify_cta: "Certify a skill",
    hof_badge: "Licence earned",
    hof_title_suffix: "licence earned",
    nudge_lead: "You're in the lead. Stay ahead.",
    nudge_need: "You need <b>{x}</b> to {y}.",
    unit_comp: "skill",
    unit_comps: "skills",
    place_first: "take 1st place",
    pal_title: "Driving tiers",
    pal_goal_objective: "Goal: {name}",
    pal_goal_ready_exam: "Exam ready",
    list_head_top: "From 4th place",
  },
  ar: {
    title: "الترتيب",
    loading: "جارٍ التحميل…",
    err_title: "تعذّر تحميل «الترتيب»",
    err_sub: "تحقّق من اتصالك ثم أعد المحاولة.",
    retry: "أعد المحاولة",
    sub: "المهارات التي ثبَّتها بنفسك",
    link_pseudo_t: "اختر اسمك المستعار العام",
    link_pseudo_s: "وإلا فستظهر باسم «متمرّن».",
    scope_solo: "طلاب بيرميغو",
    scope_ecole: "مدرستي",
    scope_national: "وطني",
    scope_aria: "نطاق الترتيب",
    effectif: "من أصل {n} طالب",
    empty: "يظهر الترتيب فور تثبيت مهارة من طالبَين.",
    certify_cta: "ثبّت مهارة",
    hof_badge: "حصل على رخصته",
    hof_title_suffix: "حصلوا على رخصتهم",
    nudge_lead: "أنت في الصدارة. حافظ على تقدّمك.",
    nudge_need: "ينقصك <b>{x}</b> {y}.",
    unit_comp: "مهارة",
    unit_comps: "مهارات",
    place_first: "لتحصل على المركز الأول",
    pal_title: "مستويات القيادة",
    pal_goal_objective: "الهدف: {name}",
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
// Ordinal anglais (1st/2nd/3rd/4th/11th…) pour le nudge de classement.
function _ordinalEn(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  const s = ["th", "st", "nd", "rd"];
  return `${n}${s[n % 10] || s[0]}`;
}
// Traduction des noms de paliers (REMC_LEAGUES, par id C1..C4).
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

  root.innerHTML = `${ARENE_CSS}<div class="arn" style="${ARENE_ACCENT}">
    <div class="arn-hd"><h1>${xD(esc(xt("title", "Classement")))}</h1><p class="arn-sub">${xD(esc(xt("loading", "Chargement…")))}</p></div>
    <div class="arn-list">${Array.from({ length: 5 })
      .map(
        () =>
          `<div class="arn-row" style="opacity:.4"><span class="arn-rk"></span><span class="arn-nm"></span></div>`,
      )
      .join("")}</div>
  </div>`;

  const [ecoleRes, nationalRes, hofRes] = await Promise.all([
    sb.rpc("get_eleve_leaderboard", { p_scope: scope, p_limit: LIMIT }).then(
      (r) => r,
      (error) => ({ data: null, error }),
    ),
    sb
      .rpc("get_eleve_leaderboard", { p_scope: "national", p_limit: LIMIT })
      .then(
        (r) => r,
        (error) => ({ data: null, error }),
      ),
    sb.rpc("get_hall_of_fame", { p_scope: scope, p_limit: 100 }).then(
      (r) => r,
      (error) => ({ data: null, error }),
    ),
  ]);

  const rankingErrors = [
    ["école", ecoleRes.error],
    ["national", nationalRes.error],
    ["hall of fame", hofRes.error],
  ].filter(([, error]) => error);
  if (rankingErrors.length) {
    console.error(
      "[classement] chargement partiel",
      Object.fromEntries(rankingErrors),
    );
  }

  // Panne totale (réseau/RPC) ≠ « pas encore classé » : on affiche un vrai
  // état d'erreur avec Réessayer au lieu d'un faux classement vide.
  const allFailed = [ecoleRes, nationalRes].every(
    (r) => r.error || r.data == null,
  );
  if (allFailed) {
    root.innerHTML = `${ARENE_CSS}<div class="arn" style="${ARENE_ACCENT}">
      <div class="arn-hd"><h1>${xD(esc(xt("title", "Classement")))}</h1><p class="arn-sub">${xD(esc(xt("err_title", "« Classement » indisponible")))}</p></div>
      <div style="padding:28px 20px;text-align:center">
        <p style="font:600 13.5px/1.5 'Archivo',sans-serif;color:var(--amute);margin:0 0 16px">${xD(esc(xt("err_sub", "Vérifie ta connexion, puis réessaie.")))}</p>
        <button id="arn-retry" style="font:800 14px 'Archivo',sans-serif;padding:13px 28px;border-radius:14px;border:0;background:var(--aup);color:#04220f;cursor:pointer">${xD(esc(xt("retry", "Réessayer")))}</button>
      </div>
    </div>`;
    root
      .querySelector("#arn-retry")
      ?.addEventListener("click", () => mount(root, initialTab));
    return;
  }

  // Solo : on complète la ligue avec des profils fictifs (les vraies lignes
  // et les vrais scores sont conservés, rangs recalculés).
  const blend = (rows) =>
    solo
      ? blendLeagueRows(rows || [], { ligue: "conduite", userKey: me.id })
      : rows || [];
  const data = {
    ecole: blend(ecoleRes.data),
    national: blend(nationalRes.data),
    hof: hofRes.data || [],
  };
  if (solo)
    track("league.bots_filled", {
      conduite: data.ecole.filter((r) => r.bot).length,
    });

  // État : portée seule (la ligue est unique depuis le 30/07). Les deep-links
  // /revision et /theorie de l'ancienne 2e ligue restent valides → portée par
  // défaut, jamais d'écran mort.
  const state = {
    scope: initialTab === "national" ? "national" : scope,
    solo,
  };

  const rerender = () => {
    root.innerHTML = `${ARENE_CSS}${_renderArena(state, data)}`;
    _wire(root, state, rerender);
  };
  rerender();
}

// ─── Helpers données ─────────────────────────────────────────────
function _rowsFor(state, data) {
  return state.scope === "national" ? data.national : data.ecole;
}
function _myRow(rows) {
  return rows.find((r) => r.is_me === true) || null;
}
function _fmtScore() {
  return (r) => ({ value: r.score ?? 0, suffix: `/${TOTAL_COMPETENCES}` });
}

// Palier courant (pour la ligne « Toi ») + rail des paliers.
function _paliersData(score) {
  const s = Math.max(0, score || 0);
  const items = REMC_LEAGUES.map((l) => ({ short: l.id, name: remcName(l) }));
  const done = REMC_LEAGUES.filter((l) => s >= l.endAt).length; // mondes finis
  const all = done >= REMC_LEAGUES.length;
  const target = all ? 0 : done + 1;
  return {
    items,
    doneCount: done,
    targetIdx: target,
    title: xt("pal_title", "Paliers Conduite"),
    goal: all
      ? xt("pal_goal_ready_exam", "Prêt examen")
      : xt(
          "pal_goal_objective",
          `Objectif : ${esc(REMC_LEAGUES[target - 1]?.name ?? "")}`,
        ).replace("{name}", esc(remcName(REMC_LEAGUES[target - 1]))),
    palierName: remcName(REMC_LEAGUES[Math.min(done, 3)]),
    colorOf: (i, isDone) =>
      isDone
        ? `linear-gradient(160deg, ${REMC_LEAGUES[i].color}, ${REMC_LEAGUES[i].color})`
        : "linear-gradient(160deg,#3a3568,#262249)",
  };
}

// Nudge perso (écart de rang réel — pas de delta hebdo inventé).
function _nudge(rows, mine) {
  if (!mine) return "";
  if (mine.rang === 1)
    return xD(xt("nudge_lead", "Tu es en tête. Reste devant."));
  const above = rows.find((r) => r.rang === mine.rang - 1);
  if (!above) return "";
  const gap = Math.max(0, (above.score ?? 0) - (mine.score ?? 0));
  if (gap <= 0) return "";
  const lang = getLang();
  const plural = gap > 1;
  const unit = xt(
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
  const rows = _rowsFor(state, data);
  const sub = xD(esc(xt("sub", "Les compétences que tu as certifiées")));

  return `<div class="arn" style="${ARENE_ACCENT}">
  <div class="arn-hd"><h1>${xD(esc(xt("title", "Classement")))}</h1><p class="arn-sub">${sub}</p></div>

  ${recompensesTabs("classement", { dark: true })}

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

// Portée Mon école / National + effectif.
function _renderScopebar(state, rows) {
  const ranked = rows.filter(
    (r) => (r.score ?? 0) > 0 && r.rang != null,
  ).length;
  const effectif = xD(esc(_effectifTxt(ranked)));
  if (state.solo) {
    // Solo : pas d'école → une seule portée (élèves PermiGo), pas de toggle.
    return `<div class="arn-scopebar"><span style="display:inline-flex;align-items:center;gap:5px;font:800 12px/1 'Archivo',sans-serif;color:#cabfef">${icon("users", { size: 13, strokeWidth: 2.2 })} ${xD(esc(xt("scope_solo", "Élèves PermiGo")))}</span><span class="arn-effectif">${effectif}</span></div>`;
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
  const hof = data.hof;
  const mine = _myRow(rows);
  const active = rows.filter((r) => (r.score ?? 0) > 0);

  // Onboarding / vide
  if (active.length < 2) {
    const txt = xD(
      esc(
        xt(
          "empty",
          "Le classement apparaît dès que deux élèves ont certifié une compétence.",
        ),
      ),
    );
    return `<div class="arn-empty">
      <div class="arn-empty-ico" style="opacity:1">${medallion("cible", "red", { size: 48, glow: true })}</div>
      <div class="arn-empty-txt">${txt}</div>
    </div>${_certifyCta()}`;
  }

  const top = active
    .filter((r) => r.rang <= LIMIT)
    .sort((a, b) => a.rang - b.rang);
  const fmt = _fmtScore();
  const hasPodium = top.length >= 3;
  const podium = hasPodium
    ? arenePodium(top.slice(0, 3), { fmtScore: fmt })
    : "";
  const listRows = hasPodium ? top.slice(3) : top;
  const pal = _paliersData(mine?.score ?? 0);

  const list = listRows.length
    ? `<div class="arn-list-head"><span class="lbl">${hasPodium ? xD(esc(xt("list_head_top", "À partir du 4ᵉ"))) : xD(esc(xt("title", "Classement")))}</span><span class="rule"></span></div>
       <div class="arn-list">${listRows.map((r, i) => areneRow(r, { fmtScore: fmt, idx: i })).join("")}</div>`
    : "";

  // Ligne « Toi » épinglée (si je suis classé)
  const meRow = mine
    ? areneMeRow(mine, { fmtScore: fmt, palier: pal.palierName })
    : "";

  const nudge = _nudge(rows, mine);
  const nudgeHtml = nudge ? `<div class="arn-nudge">${nudge}</div>` : "";

  const rail = arenePaliers(pal);
  // Hall of Fame : portée Mon école (les lauréats de SON école).
  const hofHtml = state.scope === "ecole" ? _hofSection(hof) : "";

  return `${podium}${nudgeHtml}${list}${meRow}${rail}${_certifyCta()}${hofHtml}`;
}

// CTA « Certifier une compétence » — la SEULE façon de monter dans la ligue.
function _certifyCta() {
  return `<button class="arn-glass" id="arn-certify-go" type="button">
    <span class="arn-glass-sheen" aria-hidden="true"></span>
    ${icon("shield", { size: 18, strokeWidth: 2.4 })}
    <span>${xD(esc(xt("certify_cta", "Certifier une compétence")))}</span>
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
  return `<div class="arn-hof-title">${icon("award", { size: 13, strokeWidth: 2.2 })} Hall of Fame. ${xD(esc(xt("hof_title_suffix", "permis obtenu")))}</div>${rows}`;
}

// ─── Wire ────────────────────────────────────────────────────────
function _wire(root, state, rerender) {
  // Bascule de portée (Mon école / National)
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

  // CTA certifier (délégation sur .arn, PAS sur root=#app persistant :
  // _wire() est rappelé à chaque rerender → un listener sur root s'accumulerait
  // à chaque bascule de portée et de visite en visite. .arn est recréé par
  // innerHTML à chaque rerender, donc son listener meurt avec l'ancien nœud.
  root.querySelector(".arn")?.addEventListener("click", (e) => {
    if (e.target.closest("#arn-certify-go")) {
      haptic("tap");
      playClick();
      track("classement.certify_shortcut", { from: "classement" });
      location.hash = "#/parcours";
    }
  });
}
