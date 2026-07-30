// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Réviser » (DA « Arène » — choix Rayan 2026-07-17).
//
// Univers du jeu : nuit-violet + or. « Mise en situation » en héros
// (la vraie capture du mini-jeu, cadrée sur la scène), puis 3 entraînements
// plus petits avec les badges 3D de public/art/reviser/.
//   1. Mise en situation — LA carte héros (le mini-jeu que les élèves kiffent)
//   2. Examen blanc de conduite  3. Fiches de révision  4. Centre d'examen
//
// Données 100 % réelles (repli gracieux, jamais inventées) :
//   - Série            : utils/game-state.js getStreak() (local)
//   - Scènes           : data/situations-conduite.js (SITUATIONS.length)
//   - Examen blanc      : quiz_attempts (type=exam_blanc, ref_id="exam-conduite")
//   - Fiches lues       : localStorage rvc_read_v1 + data/fiches-conduite.js
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { getStreak } from "@/utils/game-state.js";
import { getLang } from "@/utils/lang.js";
import {
  FICHE_CODES,
  FICHE_TOTAL,
  SITUATION_TOTAL,
} from "@/data/conduite-meta.js";
import { isFreeTierUser } from "@/utils/free-tier.js";
import { discoveryBannerHTML } from "@/components/eleve/free-tier-wall.js";

// i18n de la COQUE (élève non-francophone) : textes REMPLACÉS (pas de FR gardé
// dessous — ça, c'est pour le contenu pédagogique long). Dict local (règle
// coque : pas de fichier i18n partagé), repli FR si clé absente. Le titre
// reprend le libellé de l'onglet nav (« Practice » / « المراجعة »).
const RV_I18N = {
  en: {
    title: "Practice",
    streak_new: "New streak",
    streak_days: "{n}-day streak",
    best: "Best",
    goal: "Goal",
    hero_aria: "Play a driving scene",
    eyebrow: "Real-life scenarios · {n} scenes",
    fav: "Students' favourite",
    hero_alt: "A scene from the game: an intersection, one decision to make",
    hero_title: "One scene, one decision",
    hero_sub: "3 min, just like the road — not theory.",
    hero_cta: "Play a scene",
    rail: "More ways to practise",
    exam_t: "Mock exam",
    exam_s: "Just like exam day, scored out of 31",
    fiches_t: "Revision sheets",
    fiches_s: "The right moves, not theory",
    fiches_m: "Sheets",
    centre_t: "Exam centre",
    centre_s: "Your centre on exam day",
    centre_m: "Exam day",
    centre_v: "View",
  },
  ar: {
    title: "المراجعة",
    streak_new: "سلسلة جديدة",
    streak_days: "سلسلة {n} أيام",
    streak_day: "سلسلة يوم واحد",
    best: "الأفضل",
    goal: "الهدف",
    hero_aria: "العب مشهد قيادة",
    eyebrow: "مواقف قيادة واقعية · {n} مشهدًا",
    fav: "المفضّل لدى الطلاب",
    hero_alt: "مشهد من اللعبة: تقاطع يتطلب قرارًا",
    hero_title: "مشهد واحد، قرار واحد",
    hero_sub: "3 دقائق، كما على الطريق — وليس النظري.",
    hero_cta: "العب مشهدًا",
    rail: "طرق أخرى للتدرّب",
    exam_t: "امتحان تجريبي",
    exam_s: "مثل يوم الامتحان، الدرجة من 31",
    fiches_t: "بطاقات المراجعة",
    fiches_s: "الحركات الصحيحة، لا النظري",
    fiches_m: "بطاقات",
    centre_t: "مركز الامتحان",
    centre_s: "مركزك يوم الامتحان",
    centre_m: "يوم الامتحان",
    centre_v: "عرض",
  },
};
function rv(key, fr) {
  const l = getLang();
  return (l !== "fr" && RV_I18N[l]?.[key]) || fr;
}
// RTL par ATTRIBUT sur le bloc de texte (jamais <html dir> — règle lang.js).
function rvRtl() {
  return getLang() === "ar" ? ' dir="rtl" lang="ar"' : "";
}

const LS_READ_KEY = "rvc_read_v1"; // même clé que revision-conduite.js
const HERO_IMG = "/showcase/eleve-en-situation.webp"; // vraie capture du jeu (cadrée sur la scène)

// Badges 3D glossy (public/art/reviser/), posés sans cadre sur les cartes.
const BADGE = {
  exam: "/art/reviser/cible.webp",
  fiche: "/art/reviser/livre.webp",
  centre: "/art/reviser/panneau.webp",
};

const SVG = {
  flame: `<svg class="rv4-flame" viewBox="0 0 15 19" fill="none" aria-hidden="true">
      <path d="M7.5 0.5C8.3 3.4 6.2 4.6 5 6.2 3.8 7.8 3.4 9.1 4.4 9.7 4.1 8.6 4.6 7.7 5.5 7.1 5.1 8.9 6.8 9.4 6.7 11.1 8.9 9.9 8 7.4 8.9 6.1 9.6 7.5 10.9 8.1 10.9 9.8 12.2 8.9 12.6 7.5 12.2 6.2 13.9 8 14.5 10.4 13.6 12.6 12.4 15.6 9.4 18.5 5.9 17.9 3.2 17.4 1.1 15.2 1 12.5 0.9 9.8 2.6 8.9 3.9 7.1 5.6 4.8 7.9 3.5 7.5 0.5Z" fill="url(#rv4fg)"/>
      <defs><linearGradient id="rv4fg" x1="7.5" y1="0.5" x2="7.5" y2="18.5" gradientUnits="userSpaceOnUse">
        <stop stop-color="#f7d878"/><stop offset="1" stop-color="#f0a828"/>
      </linearGradient></defs>
    </svg>`,
  play: `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true"><path d="M4 3.2v10.6c0 .7.8 1.1 1.4.7l8.2-5.3a.85.85 0 000-1.4L5.4 2.5C4.8 2.1 4 2.5 4 3.2z" fill="#fff"/></svg>`,
};

const STYLE = `<style>
.rv4 { position:relative; overflow:hidden; max-width:480px; margin:0 auto;
  min-height:100dvh; color:#fff;
  background:linear-gradient(180deg,#241a52 0%,#1e1648 46%,#1a1340 100%);
  font-family:'Nunito',sans-serif; -webkit-font-smoothing:antialiased; }
.rv4::before { content:""; position:absolute; top:-120px; left:50%; transform:translateX(-50%);
  width:360px; height:300px; pointer-events:none;
  background:radial-gradient(ellipse at center,rgba(142,135,255,.18),transparent 70%); }
.rv4-screen { position:relative; padding:14px 20px calc(96px + env(safe-area-inset-bottom)); }

/* ===== HEADER ===== */
.rv4-top { display:flex; align-items:center; justify-content:space-between; padding:8px 2px 14px; }
.rv4-top h1 { font:800 30px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.03em; color:#fff; margin:0; }
.rv4-streak { display:flex; align-items:center; gap:7px; padding:7px 13px 7px 10px; border-radius:999px;
  background:rgba(245,196,81,.12); border:1px solid rgba(245,196,81,.34); }
.rv4-streak span { font:800 13.5px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.01em; color:#f5c451; white-space:nowrap; }
.rv4-flame { width:15px; height:19px; display:block; flex:none; }

/* ===== HÉROS ===== */
.rv4-hero { position:relative; display:block; width:100%; text-align:left; cursor:pointer;
  border:1px solid rgba(245,196,81,.28); border-radius:24px; padding:14px 14px 16px;
  background:linear-gradient(180deg,#2c2264 0%,#241a56 100%);
  box-shadow:0 22px 44px -20px rgba(8,4,30,.9), inset 0 1px 0 rgba(255,255,255,.05);
  -webkit-tap-highlight-color:transparent; color:inherit; }
.rv4-eyebrow { display:block; font:800 11px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:.16em;
  text-transform:uppercase; color:#f5c451; margin:2px 2px 9px; }
.rv4-frame { display:block; position:relative; height:202px; border-radius:18px; overflow:hidden;
  border:1.5px solid #f5c451; box-shadow:0 14px 30px -14px rgba(6,2,22,.85); background:#241a52; }
.rv4-frame img { position:absolute; top:0; left:50%; transform:translateX(-50%); width:104%; display:block; }
.rv4-frame::after { content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(180deg,transparent 62%,rgba(29,21,66,.55) 100%); }
.rv4-pastille { position:absolute; top:12px; left:12px; z-index:2; display:flex; align-items:center; gap:6px;
  background:linear-gradient(180deg,#f7cf68,#f0aa2c); color:#2a1e05;
  font:800 11.5px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.01em; padding:6px 11px 6px 9px; border-radius:999px;
  box-shadow:0 6px 14px -4px rgba(240,170,44,.6), inset 0 1px 0 rgba(255,255,255,.5); }
.rv4-pastille .dot { width:6px; height:6px; border-radius:50%; background:#2a1e05; }
.rv4-hbody { display:block; padding:15px 4px 2px; }
.rv4-htitle { font:800 25px/1.06 'Plus Jakarta Sans',sans-serif; letter-spacing:-.03em; color:#fff; margin:0; }
.rv4-hsub { margin:7px 0 0; font:700 14px/1.35 'Nunito',sans-serif; color:#b3aede; }
.rv4-cta { display:flex; align-items:center; justify-content:center; gap:9px; width:100%; margin-top:15px;
  padding:15px; border:0; border-radius:16px; cursor:pointer;
  background:linear-gradient(180deg,#665edb,#5d56d8);
  box-shadow:0 4px 0 #4a3fc9, 0 12px 22px -10px rgba(74,63,201,.9);
  color:#fff; font:800 16.5px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.01em;
  transition:transform .1s ease, box-shadow .1s ease; }
.rv4-cta:active { transform:translateY(2px); box-shadow:0 2px 0 #4a3fc9, 0 8px 16px -10px rgba(74,63,201,.9); }
.rv4-cta svg { display:block; }

/* ===== SECONDAIRES ===== */
.rv4-rail { margin-top:20px; display:flex; flex-direction:column; gap:11px; }
.rv4-railhead { display:flex; align-items:center; gap:10px; margin:0 2px 3px; }
.rv4-railhead span { font:800 11px/1 'Plus Jakarta Sans',sans-serif; letter-spacing:.14em; text-transform:uppercase; color:#9089c7; }
.rv4-railhead .rule { flex:1; height:1px; background:linear-gradient(90deg,#3a3178,transparent); }
.rv4-item { display:flex; align-items:center; gap:13px; width:100%; text-align:left; cursor:pointer;
  background:linear-gradient(180deg,#322a6b,#2a2160); border:1px solid #3a3178; border-radius:16px; padding:12px 14px;
  box-shadow:0 10px 20px -16px rgba(6,2,22,.9); color:inherit;
  -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.rv4-item:active { transform:scale(.99); }
.rv4-badge { flex:none; width:64px; height:64px; display:grid; place-items:center; }
.rv4-badge img { width:64px; height:64px; object-fit:contain; display:block; filter:drop-shadow(0 5px 8px rgba(0,0,0,.5)); }
.rv4-itx { flex:1; min-width:0; }
.rv4-itx h3 { font:800 16px/1.15 'Plus Jakarta Sans',sans-serif; letter-spacing:-.02em; color:#fff; margin:0; }
.rv4-itx p { margin:2px 0 0; font:600 12.5px/1.3 'Nunito',sans-serif; color:#b3aede; }
.rv4-meta { flex:none; text-align:right; font:800 12.5px/1.1 'Plus Jakarta Sans',sans-serif; letter-spacing:-.01em; color:#f5c451; }
.rv4-meta small { display:block; font:700 9.5px/1 'Nunito',sans-serif; letter-spacing:.08em; text-transform:uppercase; color:#9089c7; margin-bottom:3px; }

/* Skeleton */
.rv4-skel { border-radius:18px; background:rgba(255,255,255,.05); animation:rv4pulse 1.2s ease-in-out infinite; }
.rv4-skel.hero { height:300px; border-radius:24px; }
.rv4-skel.row { height:88px; margin-top:11px; border-radius:16px; }
@keyframes rv4pulse { 0%,100%{opacity:.5} 50%{opacity:.9} }
@media (prefers-reduced-motion: reduce){ .rv4-skel{animation:none} .rv4-cta,.rv4-item{transition:none} }
</style>`;

function skeleton() {
  return `${STYLE}<div class="rv4"><div class="rv4-screen">
    <div class="rv4-top"><h1${rvRtl()}>${rv("title", "Réviser")}</h1></div>
    <div class="rv4-skel hero"></div>
    <div class="rv4-skel row"></div>
    <div class="rv4-skel row"></div>
    <div class="rv4-skel row"></div>
  </div></div>`;
}

function render({
  streak,
  sceneCount,
  examBest,
  fichesLues,
  fichesTotal,
  discovery,
}) {
  const R = rvRtl();
  const streakTxt =
    streak.count > 0
      ? streak.count === 1
        ? rv("streak_day", rv("streak_days", "Série 1 j").replace("{n}", "1"))
        : rv("streak_days", `Série ${streak.count} j`).replace(
            "{n}",
            String(streak.count),
          )
      : rv("streak_new", "Nouvelle série");
  const examMeta =
    examBest != null
      ? `<small${R}>${rv("best", "Record")}</small>${examBest} %`
      : `<small${R}>${rv("goal", "Objectif")}</small>/31`;

  const item = (id, badge, title, sub, meta) => `
    <button class="rv4-item" data-go="${id}">
      <span class="rv4-badge"><img src="${badge}" alt="" width="512" height="512" loading="lazy" decoding="async"></span>
      <span class="rv4-itx"><h3${R}>${title}</h3><p${R}>${sub}</p></span>
      <span class="rv4-meta">${meta}</span>
    </button>`;

  return `${STYLE}<div class="rv4"><div class="rv4-screen">

    <div class="rv4-top">
      <h1${R}>${rv("title", "Réviser")}</h1>
      <span class="rv4-streak">${SVG.flame}<span${R}>${streakTxt}</span></span>
    </div>

    ${discovery ? discoveryBannerHTML() : ""}

    <button class="rv4-hero" data-go="en-situation" aria-label="${rv("hero_aria", "Jouer une scène de conduite")}">
      <span class="rv4-eyebrow"${R}>${rv("eyebrow", `Mise en situation · ${sceneCount} scènes`).replace("{n}", String(sceneCount))}</span>
      <span class="rv4-frame">
        <span class="rv4-pastille"><span class="dot"></span><span${R}>${rv("fav", "Le préféré des élèves")}</span></span>
        <img src="${HERO_IMG}" alt="${rv("hero_alt", "Une scène du jeu En situation : un croisement à décider")}" width="780" height="980" loading="eager" decoding="async">
      </span>
      <span class="rv4-hbody">
        <h2 class="rv4-htitle"${R}>${rv("hero_title", "Une scène, une décision")}</h2>
        <p class="rv4-hsub"${R}>${rv("hero_sub", "3 min, comme sur la route — pas du code.")}</p>
        <span class="rv4-cta">${SVG.play}<span${R}>${rv("hero_cta", "Jouer une scène")}</span></span>
      </span>
    </button>

    <div class="rv4-rail">
      <div class="rv4-railhead"><span${R}>${rv("rail", "Aussi pour s'entraîner")}</span><div class="rule"></div></div>
      ${item("exam-conduite", BADGE.exam, rv("exam_t", "Examen blanc"), rv("exam_s", "Comme le jour J, noté sur 31"), examMeta)}
      ${item("revision-conduite", BADGE.fiche, rv("fiches_t", "Fiches de révision"), rv("fiches_s", "Le geste, pas le code"), `<small${R}>${rv("fiches_m", "Fiches")}</small>${fichesLues} / ${fichesTotal}`)}
      ${item("centre-examen", BADGE.centre, rv("centre_t", "Centre d'examen"), rv("centre_s", "Ton centre, le jour J"), `<small${R}>${rv("centre_m", "Le jour J")}</small>${rv("centre_v", "Voir")}`)}
    </div>

  </div></div>`;
}

function wire(root) {
  root.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => {
      const dest = el.getAttribute("data-go");
      haptic("tap");
      track("reviser.open", { dest });
      navigate(`/${dest}`);
    });
  });
}

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track("page_view", { page: "eleve_reviser" });

  root.innerHTML = skeleton();

  // Fiches lues (local, instantané)
  let read = {};
  try {
    read = JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    /* noop */
  }
  const fichesLues = FICHE_CODES.filter((code) => read[code]).length;

  // Meilleur score de l'examen blanc de CONDUITE (repli gracieux si indispo).
  let examBest = null;
  try {
    const { data, error } = await sb
      .from("quiz_attempts")
      .select("score, ref_id")
      .eq("user_id", me.id)
      .eq("type", "exam_blanc");
    if (!error) {
      const attempts = (data || []).filter(
        (a) => a.ref_id === "exam-conduite" && typeof a.score === "number",
      );
      if (attempts.length) examBest = Math.max(...attempts.map((a) => a.score));
    }
  } catch {
    /* réseau indispo → méta « Objectif » */
  }

  root.innerHTML = render({
    streak: getStreak(),
    sceneCount: SITUATION_TOTAL,
    examBest,
    fichesLues,
    fichesTotal: FICHE_TOTAL,
    discovery: isFreeTierUser(me),
  });
  wire(root);
}
