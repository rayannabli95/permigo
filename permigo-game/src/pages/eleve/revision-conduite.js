// ═══════════════════════════════════════════════════════════════
// Élève — « Révision conduite »
// Le différenciateur PermiGo : on révise le GESTE de conduite (pas le code),
// entre les leçons. Données = src/data/fiches-conduite.js (vécu de vrais
// moniteurs). Mécanique : fiche → 3 questions en récupération active (flashcard).
//
// v1 100% front + localStorage (aucune table DB). Le pilotage par le moniteur
// (« Avant/Après ta leçon ») viendra dans une 2e couche (nécessite la DB).
// ═══════════════════════════════════════════════════════════════
import { esc, escAttr } from "@/utils/escape.js";
import { navigate } from "@/router.js";
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { haptic } from "@/utils/haptic.js";
import { hideHeader } from "@/utils/nav.js";
import { mountPremiumQuiz } from "@/components/eleve/premium-quiz.js";
import { loadQuizByCode } from "@/data/quiz-conduite-loader.js";
import { track } from "@/services/analytics.js";
import { medallion } from "@/utils/medallions.js";
import { getLang } from "@/utils/lang.js";
import { openCoachSheet } from "@/components/eleve/coach-sheet.js";
import {
  isFreeTierUser,
  isFreeSub,
  FREE_SUBS,
  freeQuota,
  consumeFree,
  resetIfNewDay,
} from "@/utils/free-tier.js";
import { mountFreeTierWall } from "@/components/eleve/free-tier-wall.js";
import {
  FICHE_META as FICHES,
  MONDES_CONDUITE as MONDES,
  getFicheMeta,
  fichesMetaByMonde as fichesByMonde,
} from "@/data/conduite-meta.js";
import { loadFiche } from "@/data/fiches-loader.js";
import { chromeNight } from "@/utils/chrome-night.js";
import { chargerBoite, boiteConnue } from "@/utils/transmission.js";
import {
  marquerTermes,
  brancherGlossaire,
} from "@/components/eleve/glossaire.js";

const ficheCache = new Map();
const quizCache = new Map();
let fichesI18n = null;
let fichesI18nPromise = null;

function getFiche(code) {
  return ficheCache.get(code) || null;
}

async function ensureFiche(code) {
  if (ficheCache.has(code)) return ficheCache.get(code);
  const fiche = await loadFiche(code);
  if (fiche) ficheCache.set(code, fiche);
  return fiche;
}

async function ensureQuiz(code) {
  if (quizCache.has(code)) return quizCache.get(code);
  const questions = await loadQuizByCode(code);
  quizCache.set(code, questions);
  return questions;
}

function quizByCode(code) {
  return quizCache.get(code) || [];
}

async function ensureFichesI18n() {
  if (getLang() === "fr" || fichesI18n) return fichesI18n;
  if (!fichesI18nPromise)
    fichesI18nPromise = import("@/data/fiches-i18n.js").then((module) => {
      fichesI18n = module;
      return module;
    });
  return fichesI18nPromise;
}

function ficheTr(code, lang) {
  return fichesI18n?.ficheTr(code, lang) || null;
}

function uiFiche(lang, key, fr) {
  return fichesI18n?.uiFiche(lang, key, fr) ?? fr;
}

const LS_KEY = "rvc_revised_v1"; // { [code]: isoDate }
const LS_READ_KEY = "rvc_read_v1"; // { [code]: 1 } — fiche déjà déroulée (relecture = tout affiché)

const RVC_I18N = {
  en: {
    empty_title: "Review your driving",
    empty_body: "The review cards are almost ready. Come back in a moment.",
    back: "Back",
    unread: "To read",
    back_worlds: "Back to the worlds",
    read_count: "{done}/{total} read",
    with_pass: "with the Pass",
    world_1_name: "Vehicle control",
    world_1_sub: "Get to know the car",
    world_2_name: "Driving in traffic",
    world_2_sub: "Drive in normal conditions",
    world_3_name: "Difficult conditions",
    world_3_sub: "Night · weather · sharing the road",
    world_4_name: "Independent driving",
    world_4_sub: "On your own · safe · economical",
    to_start: "To start",
    in_progress: "In progress",
    see_all: "See all the cards. {name}",
    start: "Start",
    reread: "Read again",
    continue: "Continue",
    back_review: "Back to Review",
    page_title: "Review your driving",
    four_worlds: "Your 4 worlds",
    daily_challenge: "Daily challenge",
    one_min: "1 min",
    find_fault: "Find the mistake",
    spot_error: "Spot the error",
    back_card: "Back to the card",
    skill_fallback: "this skill",
    cert_done_kicker: "Already in My licence",
    cert_done_title: "Already self-certified",
    cert_done_body:
      "“{title}” is already acquired in your journey. Great job. Keep reviewing whenever you like.",
    cert_keep: "Keep reviewing",
    cert_review: "Review in My licence →",
    my_licence: "My licence",
    quiz_passed: "Quiz passed",
    cert_prompt: "Ready to certify this skill?",
    cert_prompt_body:
      "You have just reviewed “{title}”. Certify it to move it forward in {product}. Five questions confirm you have acquired it.",
    certify: "Certify this skill",
    later: "Later",
  },
  ar: {
    empty_title: "راجع قيادتك",
    empty_body: "ستتوفر بطاقات المراجعة قريباً جداً. عد بعد قليل.",
    back: "رجوع",
    unread: "للقراءة",
    back_worlds: "الرجوع إلى العوالم",
    read_count: "{done}/{total} مقروءة",
    with_pass: "مع الباقة",
    world_1_name: "التحكم في المركبة",
    world_1_sub: "التعرّف على السيارة",
    world_2_name: "السير",
    world_2_sub: "القيادة في الظروف العادية",
    world_3_name: "ظروف صعبة",
    world_3_sub: "الليل والطقس وتقاسم الطريق",
    world_4_name: "القيادة المستقلة",
    world_4_sub: "بمفردك وبأمان واقتصاد",
    to_start: "للبدء",
    in_progress: "قيد التقدم",
    see_all: "عرض جميع البطاقات. {name}",
    start: "ابدأ",
    reread: "اقرأ مجدداً",
    continue: "واصل",
    back_review: "العودة إلى المراجعة",
    page_title: "راجع قيادتك",
    four_worlds: "عوالمك الأربعة",
    daily_challenge: "تحدي اليوم",
    one_min: "دقيقة واحدة",
    find_fault: "اعثر على الخطأ",
    spot_error: "اكتشف الخطأ",
    back_card: "العودة إلى البطاقة",
    skill_fallback: "هذه المهارة",
    cert_done_kicker: "موجودة بالفعل في رخصتي",
    cert_done_title: "سبق أن اعتمدتها بنفسك",
    cert_done_body:
      "« {title} » مكتسبة بالفعل في مسارك. أحسنت. يمكنك متابعة مراجعتها متى شئت.",
    cert_keep: "واصل المراجعة",
    cert_review: "← عرضها في رخصتي",
    my_licence: "رخصتي",
    quiz_passed: "نجحت في الاختبار",
    cert_prompt: "هل أنت مستعد لاعتماد هذه المهارة؟",
    cert_prompt_body:
      "لقد راجعت للتو « {title} ». اعتمدها لتتقدم في « {product} ». وخمسة أسئلة تؤكد أنك أتقنتها.",
    certify: "اعتماد هذه المهارة",
    later: "لاحقاً",
  },
};

function rvcT(key, fr, vars) {
  const lang = getLang();
  let value = (lang !== "fr" && RVC_I18N[lang]?.[key]) || fr;
  if (vars)
    for (const [name, replacement] of Object.entries(vars))
      value = value.split(`{${name}}`).join(String(replacement));
  return value;
}

function rvcDisplay(value) {
  const safe = esc(value);
  return getLang() === "ar" ? `<span dir="rtl" lang="ar">${safe}</span>` : safe;
}

function rvcText(key, fr, vars) {
  return rvcDisplay(rvcT(key, fr, vars));
}

// Variante riche limitée à des valeurs dynamiques en gras. Le texte et chaque
// interpolation sont échappés séparément avant de réintroduire les balises.
function rvcRich(key, fr, vars) {
  let value = rvcT(key, fr);
  const replacements = [];
  for (const [name, replacement] of Object.entries(vars || {})) {
    const marker = `\uE000${replacements.length}\uE001`;
    value = value.split(`{${name}}`).join(marker);
    replacements.push([marker, replacement]);
  }
  let safe = esc(value);
  for (const [marker, replacement] of replacements)
    safe = safe.split(marker).join(`<b>${esc(replacement)}</b>`);
  return getLang() === "ar" ? `<span dir="rtl" lang="ar">${safe}</span>` : safe;
}

function rvcWorld(m, field) {
  return rvcT(`world_${m.n}_${field}`, field === "name" ? m.nom : m.sous);
}

function rvcFicheTitle(f) {
  return ficheTr(f.code, getLang())?.titre || f.titre;
}

function loadRead() {
  try {
    return JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

// ── Ré-hydratation multi-appareils ────────────────────────────────
// Le compteur de fiches lues vivait UNIQUEMENT en localStorage → un élève
// qui a tout lu voyait « 0/31 » sur un autre appareil. Or chaque lecture est
// déjà en base (event `revision_conduite_fiche_read`, properties.code). Au
// montage, on récupère les codes lus côté serveur (RPC SECURITY DEFINER,
// l'élève n'a pas de policy SELECT directe sur events_analytics) et on les
// FUSIONNE dans le localStorage. Best-effort : RPC absente / hors-ligne →
// on garde le comportement local d'avant (aucune régression).
async function hydrateReadFromServer() {
  try {
    const { data, error } = await sb.rpc("get_my_conduite_fiches_read");
    if (error || !Array.isArray(data) || !data.length) return;
    const r = loadRead();
    let changed = false;
    for (const code of data) {
      if (code && !r[code]) {
        r[code] = 1;
        changed = true;
      }
    }
    if (changed) localStorage.setItem(LS_READ_KEY, JSON.stringify(r));
  } catch {
    /* hors-ligne / RPC pas encore déployée : repli localStorage */
  }
}
function markRead(code) {
  const r = loadRead();
  r[code] = 1;
  try {
    localStorage.setItem(LS_READ_KEY, JSON.stringify(r));
  } catch {
    /* quota / private mode : non bloquant */
  }
}

function loadRevised() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function markRevised(code) {
  const r = loadRevised();
  r[code] = new Date().toISOString();
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(r));
  } catch {
    /* quota / private mode : non bloquant */
  }
}
function revisedToday(code, revised) {
  const iso = revised[code];
  if (!iso) return false;
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

// Point faible du jour : la compétence la moins récemment révisée
// (jamais révisée d'abord), déterministe et stable dans la journée.
function pointFaible(revised) {
  if (!FICHES.length) return null;
  const sorted = [...FICHES].sort((a, b) => {
    const ra = revised[a.code] || "";
    const rb = revised[b.code] || "";
    return ra < rb ? -1 : ra > rb ? 1 : 0;
  });
  return sorted[0];
}

// Découpe la méthode en sections à partir des préfixes « Label. … » déjà
// présents dans certaines fiches (ex. « Créneau. … », « Règles communes. … »).
// Le libellé doit rester court (≤ 26 car.) pour ne pas confondre avec une
// phrase courte. Sans préfixe : un seul groupe (label null).
function groupSteps(methode) {
  const groups = [];
  let cur = null;
  for (const raw of methode) {
    const m = raw.match(/^(.{2,26}?)[.—–] (.+)$/s);
    const label = m ? m[1].trim() : null;
    const text = m ? m[2].trim() : raw.trim();
    if (!cur || cur.label !== label) {
      cur = { label, steps: [] };
      groups.push(cur);
    }
    cur.steps.push(text);
  }
  return groups;
}

// On ne bascule en accordéons que pour une VRAIE structure en sections :
// assez longue (≥ 8 étapes), ≥ 3 groupes, chacun d'au moins 2 étapes (sinon =
// tiret au milieu d'une phrase, ou fiche courte → liste à plat, plus honnête).
function useGrouped(methode, groups) {
  return (
    methode.length >= 8 &&
    groups.length >= 3 &&
    groups.every((g) => g.steps.length >= 2)
  );
}

// ═══════════════════════════════════════════════════════════════
// Fiche « variante A » (maquette mockups/fiches-lisibles/fiche-A-consigne-
// detail.html, validée) : chaque geste devient une carte « consigne en gras
// puis détail ». Le découpage est 100 % AUTOMATIQUE à partir du texte déjà en
// base (aucune donnée réécrite) : la 1re clause avant le premier point ou
// deux-points devient la consigne, le reste se découpe en phrases, ce qui
// était entre parenthèses part dans un encart annexe.
//
// Règle mécanique, pas sémantique : on ne « comprend » pas la phrase, on
// coupe à la ponctuation. D'où un filet de sécurité strict — mieux vaut
// RIEN découper qu'afficher un titre absurde ou coupé en plein milieu d'une
// parenthèse. Validé à la main sur les 215 gestes réels des 4 mondes
// (src/data/fiches/monde-1..4.json) : 175 se découpent proprement (81 %),
// 40 se replient sur l'affichage à plat existant (repli du bloc appelant,
// cf. card() dans renderFicheDeck) — jamais de carte vide, jamais de titre
// tronqué. Ne s'applique qu'au FRANÇAIS (cf. appel dans card()) : la
// ponctuation d'une traduction n'a aucune raison de suivre la même
// structure que la source.
/**
 * Une ligne de détail commence par une majuscule. Le découpage coupe après un
 * deux-points, et ce qui suit démarre presque toujours en minuscule dans la
 * donnée source : « pas de zigzag. », « avec tes rétros, vérifie l'écart… ».
 * Affiché tel quel, ça se lit comme un bout de phrase tombé de nulle part.
 * On ne touche pas à un mot déjà capitalisé ni à un chiffre.
 */
function majusculeEnTete(ligne) {
  const s = String(ligne || "").trim();
  if (!s) return s;
  const premier = s[0];
  return premier === premier.toLocaleUpperCase("fr")
    ? s
    : premier.toLocaleUpperCase("fr") + s.slice(1);
}

/**
 * Une énumération devient une ligne par élément.
 * « rien sous les roues, pneus pas à plat, feux et plaques propres » se lit
 * mieux en trois lignes qu'en une phrase à virgules. On ne coupe QUE si c'est
 * vraiment une liste : au moins trois morceaux, tous courts, aucun qui
 * ressemble à une phrase complète. Sinon on laisse la phrase entière, parce
 * que « Sur sol mouillé, freiner prend deux fois plus de distance » coupée en
 * deux ne veut plus rien dire.
 */
function couperEnumeration(ligne) {
  const s = String(ligne || "").trim();
  if (!s) return [];
  // Le point-virgule est un vrai séparateur : on coupe toujours dessus.
  const parPointVirgule = s
    .split(/\s*;\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parPointVirgule.length > 1)
    return parPointVirgule.flatMap(couperEnumeration);

  const morceaux = s
    .replace(/[.!?]$/, "")
    .split(/\s*,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const liste =
    morceaux.length >= 3 &&
    morceaux.every((p) => p.length <= 40) &&
    !morceaux.some((p) =>
      /\b(et|puis|donc|car|mais|si|quand)\b.*\b(tu|je|on|il|elle)\b/i.test(p),
    );
  // Pas de point final sur un élément de liste : « Feux et plaques propres. »
  // au bout de trois lignes courtes ne sert à rien et pique l'œil.
  return liste ? morceaux : [s];
}

function splitStepCard(raw) {
  let text = String(raw || "").trim();
  if (!text) return null;

  // 1. Sort les parenthèses du flux principal (contenu d'annexe), dans
  // l'ordre. Une parenthèse non refermée après ce retrait (imbrication,
  // longueur qui dépasse) est un signal d'abandon : mieux vaut replier que
  // couper une phrase en plein milieu d'une parenthèse.
  const asides = [];
  text = text.replace(/\(([^()]{2,220})\)/g, (_, inner) => {
    asides.push(inner.trim());
    return "";
  });
  if (/[()]/.test(text)) return null;
  text = text
    // Le point et la virgule se collent au mot. Les deux-points et le
    // point-virgule prennent une espace AVANT en français : les coller
    // donnait « Un repère répandu: elle arrive… », qui se lit mal et fait
    // faute. On la remet, y compris quand la source ne l'avait pas.
    .replace(/\s+([.,])/g, "$1")
    .replace(/\s*([:;])\s*/g, " $1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!text) return null;

  // 2. Première frontière franche : point ou deux-points suivi d'un espace
  // ou de la fin de chaîne. On ignore un point décimal (chiffre des deux
  // côtés, ex. « 2.5 ») et un point d'initiale isolée (ex. « M. »).
  const boundRe = /[.:](?=\s|$)/g;
  let boundIdx = -1;
  let m;
  while ((m = boundRe.exec(text))) {
    const i = m.index;
    const before = text[i - 1] || "";
    const after = text[i + 1] || "";
    if (text[i] === "." && /\d/.test(before) && /\d/.test(after)) continue;
    if (
      text[i] === "." &&
      /[A-Z]/.test(before) &&
      /(^|\s)$/.test(text.slice(Math.max(0, i - 2), i - 1))
    )
      continue;
    boundIdx = i;
    break;
  }
  if (boundIdx === -1) return null; // aucune frontière → repli

  const consigne = text.slice(0, boundIdx).trim();
  const rest = text.slice(boundIdx + 1).trim();

  // Une consigne trop courte (un seul mot, un label de section échappé du
  // regroupement) ou trop longue (elle n'a plus rien d'un titre) → repli.
  if (consigne.length < 8 || consigne.length > 62 || !/\s/.test(consigne))
    return null;

  // 3. Détail : le reste, une phrase par ligne.
  const detail = rest
    ? rest
        .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý«"“])|(?<=[.!?])$/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const detailFinal = (detail.length ? detail : rest ? [rest] : [])
    .flatMap(couperEnumeration)
    .map(majusculeEnTete);

  const aside = asides.length ? asides.join(" · ") : null;

  return { consigne, detail: detailFinal, aside };
}

// sources = ["chaine-slug/videoId", …] : on n'affiche QUE le nom de la
// chaîne, humanisé — l'id vidéo brut à l'écran faisait note de dev.
function sourceChannels(f) {
  return Array.isArray(f.sources)
    ? [
        ...new Set(
          f.sources
            .map((s) => String(s).split("/")[0].replace(/-/g, " ").trim())
            .filter(Boolean)
            .map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
        ),
      ]
    : [];
}

// Combien de mots « utiles » le texte long a-t-il en plus du titre court ?
// Sert à ne pas répéter sous le pli une consigne qui redit le titre.
// Accents retirés et mots de 3 lettres et moins ignorés (« le », « la »,
// « de ») : ils ne portent jamais l'information qu'on cherche à mesurer.
function motsEnPlus(long, court) {
  const mots = (t) =>
    new Set(
      String(t || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3),
    );
  const ref = mots(court);
  return [...mots(long)].filter((w) => !ref.has(w)).length;
}

const STYLE = `<style>
.rvc { max-width: 480px; margin: 0 auto; padding: 0 16px calc(110px + env(safe-area-inset-bottom));
  background: var(--bg); color: var(--ink); font-family: 'Archivo', sans-serif; }
.rvc-top { display:flex; align-items:center; gap:10px; padding:16px 0 8px; }
.rvc-back { width:44px; height:44px; border-radius:11px; border:0; cursor:pointer;
  background: var(--su, #fff); color: var(--ink); font-size:20px; line-height:1;
  box-shadow: 0 1px 4px rgba(0,0,0,.08); flex-shrink:0; }
.rvc-back:active { transform: scale(0.95); }
.rvc-h1 { font: 800 22px/1.1 'Archivo', sans-serif; letter-spacing:-.025em; margin:0; }
.rvc-sub { color: var(--mu, #64748b); font-size:13px; line-height:1.5; margin:2px 0 0; }

.rvc-go { position:sticky; bottom: calc(16px + env(safe-area-inset-bottom)); width:100%;
  border:0; border-radius:14px; padding:15px; cursor:pointer; margin-top:18px;
  font:800 16px 'Archivo',sans-serif; color:#fff; background:var(--a,#6366f1);
  box-shadow:0 8px 20px color-mix(in srgb, var(--a,#6366f1) 40%, transparent); }
.rvc-go:active { transform: scale(0.98); }

/* Flashcards */
.rvc-prog { font:700 12px 'IBM Plex Mono',monospace; color:var(--mu,#64748b); text-align:center; margin:10px 0 14px; }
@keyframes rvcrise { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
.rvc-done { text-align:center; padding:40px 16px; }
.rvc-done-e { font-size:54px; animation: rvcrise .35s cubic-bezier(.23,1,.32,1) both; }
.rvc-done-t { font:800 22px 'Archivo',sans-serif; margin:10px 0 4px; }

@media (prefers-reduced-motion: reduce) { .rvc *, .rvc *::before { transition:none !important; animation:none !important; } }
</style>`;

// ═══════════════════════════════════════════════════════════════
// Fiche « Deck » indigo (DA Arène jour — choix Rayan 2026-07-17).
// Univers du jeu (nuit-indigo + or, Clash Royale) MAIS fond clair/lisible :
// cartes blanches sur indigo. La méthode = un « deck » de gestes à cocher
// (médailles or), les 3 « à retenir » deviennent des cartes coach discrètes,
// une seule action or « Teste-toi ». Style auto-contenu (scopé .fd) pour ne
// pas interférer avec le CSS partagé (STYLE) ni le global.
// ═══════════════════════════════════════════════════════════════
const FD_STYLE = `<style>
${chromeNight("#5a4fc0", "#423a96")}
.fd{ position:relative; max-width:480px; margin:0 auto; min-height:100dvh;
  font-family:'Archivo',sans-serif; color:#ded7ff; overflow-x:hidden;
  /* Le bandeau global est masqué sur cette page (hideHeader) : #app ne pose
     plus ses 52 px de padding haut, la fiche encaisse elle-même l'encoche. */
  padding:calc(env(safe-area-inset-top, 0px) + 12px) 0 calc(96px + env(safe-area-inset-bottom));
  background:
    radial-gradient(120% 55% at 50% -6%, rgba(240,169,63,.16) 0%, rgba(240,169,63,0) 55%),
    radial-gradient(120% 60% at 82% 12%, rgba(150,120,255,.30) 0%, rgba(150,120,255,0) 60%),
    linear-gradient(#5a4fc0 0%, #4a3fa4 60%, #423a96 100%); }
.fd *{ box-sizing:border-box; }
.fd-gold{ background:linear-gradient(180deg,#ffe9b0 0%,#f6c85f 40%,#f0a93f 72%,#d98a1f 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; }

.fd-hero{ position:relative; padding:14px 18px 2px; }
.fd-topbar{ display:flex; align-items:center; gap:12px; }
.fd-back{ width:44px; height:44px; flex:0 0 44px; border-radius:14px; cursor:pointer;
  background:linear-gradient(180deg,#ffffff,#efecff); border:1px solid #e6e2fb; border-top-color:#fff;
  box-shadow:0 4px 0 rgba(20,12,60,.35), inset 0 1px 0 rgba(255,255,255,.9);
  display:flex; align-items:center; justify-content:center; }
.fd-back:active{ transform:translateY(2px); box-shadow:0 2px 0 rgba(20,12,60,.35); }
.fd-back svg{ display:block; }
.fd-tag{ display:inline-flex; align-items:center; gap:7px; min-width:0; padding:7px 13px 7px 9px; border-radius:999px;
  background:linear-gradient(180deg,rgba(240,169,63,.28),rgba(240,169,63,.10)); border:1px solid rgba(240,169,63,.55);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.20); }
.fd-dot{ width:20px; height:20px; border-radius:50%; flex:0 0 20px;
  background:radial-gradient(circle at 35% 28%,#ffe9b0,#f0a93f 60%,#b46a10);
  box-shadow:inset 0 -2px 3px rgba(120,60,0,.55), inset 0 1px 1px rgba(255,255,255,.7); }
.fd-tag b{ font-family:'Archivo',sans-serif; font-weight:800; font-size:12px; letter-spacing:.08em; color:#ffe4a6;
  text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
/* color:inherit obligatoire — base.css pose une couleur sur h1..h4 et une règle
   directe bat la couleur héritée : sans ça le titre passe en encre sombre sur ce
   fond sombre (illisible en thème clair). */
.fd-title{ color:inherit; font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:27px; line-height:1.07; letter-spacing:-.01em;
  margin:15px 0 4px; filter:drop-shadow(0 2px 0 rgba(60,30,0,.30)); }

/* « En boîte auto » remontée en tête de fiche. Bleu (comme le picto voiture de
   l'ancienne carte coach) pour se distinguer de l'or de l'intro. Variante
   .off = la fiche ne concerne pas l'automatique : on passe en orange, la même
   teinte que l'avertissement du bas de page, pour que ça se lise comme un
   « passe ton chemin » et pas comme un conseil de plus. */
/* Bandeau « En boîte auto » : le titre seul, le texte sous le pli. */
.fd-auto{ margin:0 18px 12px; padding:4px 14px 4px;
  border-radius:18px; background:rgba(63,130,214,.16); border:1px solid rgba(63,130,214,.42); }
.fd-auto-head{ display:flex; align-items:center; gap:11px; width:100%; margin:0; padding:11px 1px;
  border:0; background:none; font-family:inherit; text-align:left; cursor:pointer;
  -webkit-tap-highlight-color:transparent; }
.fd-auto-ic{ flex:0 0 22px; display:flex; }
.fd-auto-ic svg{ display:block; }
.fd-auto-head svg:last-child{ flex:0 0 18px; margin-left:auto; color:#8ebbe8; transition:transform .18s ease; }
.fd-auto-head[aria-expanded="true"] svg:last-child{ transform:rotate(90deg); }
.fd-auto-body{ min-width:0; padding:0 1px 10px 33px; }
.fd-auto-h{ flex:1; min-width:0; font:800 11.5px/1.2 'Archivo',sans-serif; letter-spacing:.14em;
  text-transform:uppercase; color:#bcdcff; }
.fd-auto-p{ margin:0; font:600 14px/1.5 'Archivo',sans-serif; color:#e7f1ff; }
.fd-auto-p .fd-fr{ display:block; margin-top:6px; color:#b9cfe8; opacity:.85; }
.fd-auto.off{ background:rgba(239,106,58,.15); border-color:rgba(239,106,58,.45); }
.fd-auto.off .fd-auto-head svg:last-child{ color:#e8a98e; }
.fd-auto.off .fd-auto-h{ color:#ffc7ad; }
.fd-auto.off .fd-auto-p{ color:#ffe6da; }
.fd-auto.off .fd-auto-p .fd-fr{ color:#e0b6a4; }

.fd-seclab{ display:flex; align-items:center; gap:10px; padding:0 18px; margin:22px 0 12px; }
.fd-seclab h2{ font-family:'Archivo',sans-serif; font-weight:800; font-size:13px; letter-spacing:.10em; text-transform:uppercase; color:#ded7ff; white-space:nowrap; margin:0; }
.fd-seclab .line{ height:1px; flex:1; background:linear-gradient(90deg,rgba(222,215,255,.55),transparent); }

/* ── La liste des gestes, façon antisèche (choix Rayan 07/08) ─────────────
   Avant : une carte par geste, chacune sur 3 à 5 lignes, la fiche faisait
   3,6 écrans et l'élève abandonnait avant la fin. Maintenant les gestes
   tiennent tous dans UNE carte blanche, un titre court par ligne. Le détail
   du geste n'est pas supprimé, il est replié : un tap l'ouvre.
   Le tout tient sur un écran, on voit la fin avant de commencer. */
.fd-deck{ margin:14px 18px 0; padding:8px 0 6px; border-radius:22px;
  background:linear-gradient(180deg,#ffffff,#f4f1ff);
  border:1px solid #e6e2fb; border-top-color:#fff;
  box-shadow:0 6px 0 rgba(20,12,60,.30), 0 16px 30px rgba(20,12,60,.34), inset 0 1px 0 rgba(255,255,255,.95); }
.fd-deck + .fd-seclab{ margin-top:20px; }
.fd-line{ position:relative; padding:3px 14px; }
/* Le pointillé qui relie les médaillons : les gestes SE SUIVENT, ce n'est pas
   une liste de courses. Il s'arrête au dernier (:last-child). */
/* Ancre en px, PAS en pourcentage : quand un geste s'ouvre, la ligne grandit
   et un top:50% ferait redescendre le pointillé au milieu du détail, loin du
   médaillon auquel il est censé se raccrocher. */
.fd-line::after{ content:""; position:absolute; left:31px; top:42px; bottom:-6px; width:3px; border-radius:2px;
  background:repeating-linear-gradient(#ded7f8 0 6px, transparent 6px 12px); }
.fd-line:last-child::after{ display:none; }
.fd-line.done::after{ background:repeating-linear-gradient(#f3ddab 0 6px, transparent 6px 12px); }
.fd-line-top{ display:flex; align-items:center; gap:14px; }
/* Le médaillon plastique : le numéro tant que ce n'est pas fait, la coche
   après. C'est LUI qui coche, pas la ligne entière — le reste ouvre le détail. */
.fd-med{ position:relative; z-index:1; flex:0 0 36px; width:36px; height:36px; margin:0; padding:0; border:0;
  border-radius:50%; cursor:pointer; -webkit-tap-highlight-color:transparent;
  display:flex; align-items:center; justify-content:center; font-family:inherit;
  background:radial-gradient(circle at 34% 26%,#8a7ce8,#5a4fc0 62%,#3b3190); color:#fff;
  box-shadow:inset 0 -3px 4px rgba(20,10,60,.55), inset 0 2px 2px rgba(255,255,255,.45), 0 2px 5px rgba(20,12,60,.30);
  transition:transform .1s ease; }
.fd-med b{ font-weight:900; font-size:15px; }
.fd-med:active{ transform:scale(.92); }
.fd-line.next .fd-med{ box-shadow:inset 0 -3px 4px rgba(20,10,60,.55), inset 0 2px 2px rgba(255,255,255,.45), 0 0 0 5px rgba(150,120,255,.30); }
.fd-line.done .fd-med{ background:radial-gradient(circle at 34% 26%,#ffe9b0,#f0a93f 60%,#b46a10);
  box-shadow:inset 0 -3px 4px rgba(120,60,0,.55), inset 0 2px 2px rgba(255,255,255,.75), 0 2px 5px rgba(20,12,60,.28); }
/* La tête du geste : titre court écrit à la main (champ « titres »). */
.fd-tete{ flex:1; min-width:0; display:flex; align-items:center; gap:10px; margin:0;
  padding:11px 2px 11px 0; border:0; background:none; text-align:left; font-family:inherit;
  cursor:pointer; -webkit-tap-highlight-color:transparent; }
.fd-tete > span{ flex:1; min-width:0; font-weight:800; font-size:16.5px; line-height:1.22;
  letter-spacing:-.015em; color:#211a4d; }
.fd-line.done .fd-tete > span{ color:#6b5a2c; }
.fd-tete .fd-fr{ display:block; font-size:.82em; font-weight:600; color:#5b5286; opacity:.72; margin-top:3px; }
.fd-tete svg{ flex:0 0 18px; color:#c1b8ec; transition:transform .18s ease; }
.fd-tete[aria-expanded="true"] svg{ transform:rotate(90deg); }
.fd-tete-fixe{ cursor:default; }
/* Le détail, sous le pli. Il porte le geste ENTIER : on raccourcit ce qui
   s'affiche, jamais le cours. */
.fd-plus{ padding:0 6px 12px 50px; }
.fd-plus ul{ margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; }
.fd-plus li{ position:relative; padding-left:14px; font:600 13.5px/1.45 'Archivo',sans-serif; color:#5b5089; }
.fd-plus .fd-aside{ margin-left:0; margin-right:0; }
.fd-plus li::before{ content:""; position:absolute; left:0; top:7px; width:5px; height:5px; border-radius:50%; background:#c3b6f0; }
.fd-line.done .fd-plus li{ color:#7a5f28; }
.fd-line.done .fd-plus li::before{ background:#e0b463; }

/* ── Le piège : l'erreur à éviter, en clair sous la liste ───────────────── */
.fd-piege{ margin:16px 18px 0; padding:13px 15px; border-radius:14px;
  background:linear-gradient(180deg,#fff3ec,#ffe7da);
  border:1px solid #ffcdb2; border-left:4px solid #ef6a3a; }
.fd-piege b{ display:block; font-family:'Archivo',sans-serif; font-weight:800; font-size:11px;
  letter-spacing:.09em; text-transform:uppercase; color:#c1400f; margin-bottom:5px; }
.fd-piege p{ margin:0; font:600 14.5px/1.45 'Archivo',sans-serif; color:#5a2a12; }
.fd-piege .fd-fr{ display:block; margin-top:5px; font-size:.88em; color:#8a5238; opacity:.9; }

/* ── Le briefing : la mascotte annonce, le prénom en or ─────────────────── */
.fd-brief{ position:relative; margin:14px 18px 0; padding:4px 124px 2px 2px; min-height:100px; }
.fd-brief .nom{ display:block; font-family:'Archivo',sans-serif; font-weight:900; font-size:26px; line-height:1;
  letter-spacing:-.02em; filter:drop-shadow(0 2px 0 rgba(60,30,0,.34)); }
.fd-brief .dit{ display:block; margin-top:9px; font-size:16.5px; line-height:1.28; font-weight:700; color:#efeaff; }
.fd-brief img{ position:absolute; right:-10px; bottom:-6px; width:138px; height:auto;
  filter:drop-shadow(0 10px 16px rgba(10,6,40,.55)); pointer-events:none; }
@media (max-width:340px){ .fd-brief{ padding-right:104px; } .fd-brief img{ width:112px; } }
/* Annexe : ce qui était entre parenthèses vit ici, sur sa propre ligne
   encadrée, plutôt qu'au milieu de la phrase. */
.fd-aside{ margin:10px 0 0 44px; padding:8px 11px; border-radius:11px; display:flex; gap:7px; align-items:flex-start;
  background:rgba(122,90,220,.09); border:1px solid rgba(122,90,220,.16); }
.fd-aside svg{ flex:0 0 14px; margin-top:2px; }
.fd-aside p{ margin:0; font:600 12px/1.4 'Archivo',sans-serif; color:#5f4fa8; }
.fd-line.done .fd-aside{ background:rgba(240,169,63,.10); border-color:rgba(240,169,63,.22); }
.fd-line.done .fd-aside p{ color:#8a6a1c; }

.fd-schemas{ margin-top:2px; }
.fd-gal{ display:flex; gap:12px; overflow-x:auto; scroll-snap-type:x mandatory; padding:2px 18px 8px; scrollbar-width:none; }
.fd-gal::-webkit-scrollbar{ display:none; }
.fd-shot{ margin:0; flex:0 0 84%; max-width:340px; scroll-snap-align:center; background:#f6f4ff; border:1px solid #e6e2fb;
  border-radius:16px; overflow:hidden; box-shadow:0 3px 0 rgba(20,12,60,.28), inset 0 1px 0 rgba(255,255,255,.8); }
.fd-shot img{ display:block; width:100%; aspect-ratio:1/1; object-fit:cover; background:#dfe3ea; }
.fd-shot figcaption{ padding:9px 12px 11px; font-size:11.5px; line-height:1.35; color:#3d2f7a; font-weight:600; }

.fd-coach-wrap{ margin-top:6px; }
/* Le crochet qui donne envie d'ouvrir une carte : la mascotte pointe la
   promesse. Choix Rayan 02/08 : ce qui fait cliquer, ce n'est pas le résumé du
   contenu, c'est ce que l'élève y gagne. */
.fd-coach-hook{ display:flex; align-items:center; gap:12px; margin:0 18px 12px; padding:9px 15px 9px 9px; border-radius:20px;
  background:linear-gradient(180deg, rgba(255,228,166,.14), rgba(255,228,166,.05));
  border:1px solid rgba(255,228,166,.26); }
/* La mascotte est violet foncé : posée telle quelle sur le bandeau sombre elle
   disparaît. Elle a donc son médaillon clair, comme les icônes des cartes.
   Et son PNG est en paysage : sans boîte plus large que haute, object-fit la
   réduisait à un tiers de la hauteur disponible. */
.fd-hook-av{ width:58px; height:58px; flex:none; border-radius:18px; display:grid; place-items:center; overflow:hidden;
  background:linear-gradient(180deg,#fff6e2,#ffdfa8); border:1px solid rgba(255,228,166,.55);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.85), 0 4px 10px rgba(0,0,0,.3); }
.fd-hook-av img{ width:68px; height:54px; object-fit:contain; margin-bottom:-3px;
  animation:fdHookNod 3.4s ease-in-out 1.2s infinite; }
@keyframes fdHookNod{ 0%,72%,100%{ transform:rotate(0) translateY(0); } 80%{ transform:rotate(-5deg) translateY(-3px); } 88%{ transform:rotate(4deg) translateY(-1px); } }
.fd-coach-hook p{ margin:0; font:800 13.5px/1.35 'Archivo',sans-serif; color:#ffe4a6; }
/* Le deck : les cartes s'empilent au lieu de se ranger en grille (demande
   Rayan 02/08). touch-action:pan-y garde le scroll vertical de la page pendant
   qu'on glisse la carte horizontalement. */
.fd-coach{ position:relative; height:clamp(196px,28vh,240px); margin:0 18px; touch-action:pan-y; user-select:none; -webkit-user-select:none; }
/* Carte coach = bouton (demande Rayan 22/07 : tap → lecture en grand). */
.fd-cc{ position:absolute; inset:0; border-radius:18px; padding:14px 14px 15px; background:#f6f4ff; border:1px solid #e6e2fb; border-top-color:#fff;
  box-shadow:0 8px 0 -2px rgba(20,12,60,.26), 0 16px 30px -14px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.8);
  display:flex; flex-direction:column; gap:9px;
  width:100%; text-align:left; font-family:inherit; cursor:grab; overflow:hidden;
  -webkit-tap-highlight-color:transparent; will-change:transform; }
.fd-cc.is-anim{ transition:transform .42s cubic-bezier(.4,0,.2,1), opacity .42s cubic-bezier(.4,0,.2,1); }
.fd-cc:active{ cursor:grabbing; }
/* Les cartes du dessous : réduites, remontées, hors du parcours de tabulation. */
.fd-cc[data-depth="1"]{ transform:translateY(-14px) scale(.935); filter:brightness(.96); }
.fd-cc[data-depth="2"]{ transform:translateY(-26px) scale(.87); filter:brightness(.92); }
.fd-cc[data-depth]:not([data-depth="0"]){ pointer-events:none; }
/* Reflet qui balaie la carte, le même que les cartes de collection quand une
   compétence se débloque (collection.js, .col-card-gloss). Deux différences.
   Là-bas la carte est sombre et une bande blanche suffit ; ici le fond est clair
   (#f6f4ff) donc la bande est bordée d'un violet très doux, sinon on ne la voit
   pas. Et là-bas la lumière fait l'aller-retour ; ici elle part toujours de la
   gauche puis se repose hors champ, sinon ça ne se lit pas comme un swipe.
   Seule la carte du dessus brille : sur les couches du dessous on ne verrait
   qu'un liseré qui clignote. */
.fd-cc[data-depth="0"]::after{ content:""; position:absolute; top:-55%; bottom:-55%; left:0; width:34%; pointer-events:none; z-index:1;
  background:linear-gradient(90deg, transparent 0%, rgba(110,84,214,.10) 24%, rgba(255,255,255,.95) 47%, rgba(255,255,255,.95) 53%, rgba(110,84,214,.10) 76%, transparent 100%);
  transform:rotate(18deg) translateX(-170%);
  animation:fdGloss 4s cubic-bezier(.4,0,.5,1) 1s infinite; }
/* La course s'arrête à 32 % : la lumière traverse en une seconde puis se repose
   hors champ le reste du cycle. Une course plus longue passerait l'essentiel du
   temps hors de la carte et on ne verrait qu'un éclair. */
@keyframes fdGloss{ 0%{ transform:rotate(18deg) translateX(-170%); } 32%,100%{ transform:rotate(18deg) translateX(330%); } }
.fd-cc-zoom{ position:absolute; top:12px; right:12px; width:28px; height:28px; border-radius:9px;
  display:flex; align-items:center; justify-content:center;
  background:rgba(90,79,192,.08); border:1px solid rgba(90,79,192,.16); }
.fd-ic{ width:40px; height:40px; border-radius:13px; flex:none; display:flex; align-items:center; justify-content:center;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.7), 0 2px 4px rgba(20,12,60,.2); }
.fd-ic svg{ width:22px; height:22px; }
.fd-cc.err .fd-ic{ background:linear-gradient(180deg,#ffe3d6,#ffd0bd); border:1px solid rgba(230,90,50,.4); }
.fd-cc.why .fd-ic{ background:linear-gradient(180deg,#ece5ff,#ddd2ff); border:1px solid rgba(124,95,224,.4); }
.fd-cc.auto .fd-ic{ background:linear-gradient(180deg,#dcebff,#c6ddff); border:1px solid rgba(63,130,214,.4); }
/* ICRI — contexte (quand), risque (ce qu'on encourt), influence (les autres). */
.fd-cc.ctx .fd-ic{ background:linear-gradient(180deg,#d5f2ee,#bfe8e2); border:1px solid rgba(20,150,140,.4); }
.fd-cc.rsk .fd-ic{ background:linear-gradient(180deg,#ffdfe4,#ffc9d2); border:1px solid rgba(200,50,80,.4); }
.fd-cc.inf .fd-ic{ background:linear-gradient(180deg,#dcf0dd,#c6e6ca); border:1px solid rgba(45,150,90,.4); }
/* Spans display:block (pas de h4/p dans un <button> — contenu phrasé only). */
.fd-cc-h{ display:block; font-family:'Archivo',sans-serif; font-weight:800; font-size:15px; letter-spacing:.01em; line-height:1.15; margin:0; padding-right:34px; }
.fd-cc.err .fd-cc-h{ color:#c2410c; }
.fd-cc.why .fd-cc-h{ color:#5b3fbf; }
.fd-cc.auto .fd-cc-h{ color:#1e5fa8; }
.fd-cc.ctx .fd-cc-h{ color:#0f6f68; }
.fd-cc.rsk .fd-cc-h{ color:#b02a45; }
.fd-cc.inf .fd-cc-h{ color:#1f7a45; }
/* Le texte est coupé à la hauteur de la carte, sinon les cartes ne peuvent pas
   s'empiler. Rien n'est perdu : le tap ouvre la lecture en grand, et le dégradé
   du bas dit qu'il y a une suite. */
.fd-cc-p{ display:block; font-size:13.5px; line-height:1.5; color:#5f5497; font-weight:500; margin:0;
  flex:1; min-height:0; overflow:hidden;
  -webkit-mask-image:linear-gradient(180deg,#000 calc(100% - 28px),transparent 100%);
          mask-image:linear-gradient(180deg,#000 calc(100% - 28px),transparent 100%); }

/* Commandes du deck : compteur encadré de deux chevrons, pour qui ne glisse pas. */
.fd-cd-ctrls{ display:flex; align-items:center; justify-content:center; gap:18px; margin-top:14px; }
.fd-cd-arrow{ width:44px; height:44px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;
  background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.17); color:#ede8ff;
  box-shadow:0 5px 14px -6px rgba(0,0,0,.55); transition:transform .1s ease; }
.fd-cd-arrow:active{ transform:scale(.92); }
.fd-cd-count{ font:800 13.5px/1 'Archivo',sans-serif; color:#cabff2; min-width:56px; text-align:center; font-variant-numeric:tabular-nums; }
.fd-cd-tip{ text-align:center; margin:9px 0 0; font:600 11.5px/1.4 'Archivo',sans-serif; color:rgba(222,215,255,.55); }

.fd-source{ text-align:center; font-size:10.5px; color:#c9bdf5; font-weight:600; margin:18px 18px 0; }
.fd-source b{ color:#ffe4a6; font-weight:700; }

.fd-actions{ padding:16px 18px 0; }
/* Prévention avant la certification : on certifie ce qu'on sait FAIRE, pas ce
   qu'on vient de lire (décision Rayan, 31/07/2026). */
.fd-warn{ display:flex; align-items:flex-start; gap:9px; margin:0 0 12px; padding:11px 13px; border-radius:14px;
  background:rgba(255,228,166,.10); border:1px solid rgba(255,228,166,.28); }
.fd-warn svg{ width:16px; height:16px; flex:none; margin-top:1px; color:#ffe4a6; }
.fd-warn p{ margin:0; font-family:'Archivo',sans-serif; font-size:12px; line-height:1.45; font-weight:600; color:#e6dcff; }
.fd-cta{ display:flex; align-items:center; justify-content:center; gap:10px; width:100%; height:60px; border:none; border-radius:20px; cursor:pointer; position:relative;
  background:linear-gradient(180deg,#ffe9b0 0%,#f6c85f 38%,#f0a93f 72%,#e2951f 100%);
  box-shadow:0 6px 0 #b46a10, 0 12px 20px rgba(180,106,16,.35), inset 0 2px 0 rgba(255,255,255,.7); transition:transform .1s ease, box-shadow .1s ease; }
.fd-cta:active{ transform:translateY(3px); box-shadow:0 3px 0 #b46a10,0 6px 12px rgba(180,106,16,.3),inset 0 2px 0 rgba(255,255,255,.7); }
.fd-cta span{ font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:20px; color:#5a3406; letter-spacing:.01em; text-shadow:0 1px 0 rgba(255,255,255,.35); }
.fd-secondary{ display:flex; align-items:center; justify-content:center; gap:8px; width:100%; height:46px; margin-top:11px; border-radius:15px; cursor:pointer;
  background:linear-gradient(180deg,#ffffff,#ece8ff); border:1px solid #d9d2f5; border-top-color:#fff;
  box-shadow:0 4px 0 rgba(20,12,60,.3), inset 0 1px 0 rgba(255,255,255,.9); transition:transform .1s ease; }
.fd-secondary:active{ transform:translateY(2px); box-shadow:0 2px 0 rgba(20,12,60,.3), inset 0 1px 0 rgba(255,255,255,.9); }
.fd-secondary span{ font-family:'Archivo',sans-serif; font-weight:800; font-size:13px; color:#3d2f7a; }
/* Bilingue (en/ar) : traduction affichée, français gardé dessous (arabe RTL par
   span — l'app reste LTR). Voir lang.js + fiches-i18n.js. */
.fd-tr{ display:block; }
.fd-fr{ display:block; margin-top:4px; font-weight:500; opacity:.62; }
.fd-cc-p .fd-fr{ font-size:.94em; color:#8a7fb5; opacity:.8; margin-top:3px; }
.fd-title .fd-tr{ display:block; }
.fd-title .fd-fr{ -webkit-text-fill-color:#cabef7; color:#cabef7; background:none;
  font-family:'Archivo',sans-serif; font-size:.5em; font-weight:600; line-height:1.25; filter:none; }
.fd-seclab h2[dir="rtl"]{ direction:rtl; }
/* Les pseudo-éléments doivent être nommés : « animation » ne s'hérite pas, donc
   .fd * seul laissait tourner le reflet des cartes coach. */
@media (prefers-reduced-motion: reduce){ .fd *, .fd *::before, .fd *::after{ transition:none!important; animation:none!important; } }
</style>`;

const LS_GESTES_KEY = "rvc_gestes_v1"; // { [code]: number[] } — index des gestes cochés
function loadGestes() {
  try {
    return JSON.parse(localStorage.getItem(LS_GESTES_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function saveGestes(codeK, arr) {
  const g = loadGestes();
  if (arr.length) g[codeK] = arr;
  else delete g[codeK];
  try {
    localStorage.setItem(LS_GESTES_KEY, JSON.stringify(g));
  } catch {
    /* quota / private mode : non bloquant */
  }
}

// ═══════════════════════════════════════════════════════════════
// Hub « Révise ta conduite » — « Carte des mondes » indigo (choix Rayan 2026-07-18).
// Décombré : fini le doublon (hero « reprends » + ligne 1 identique), les 6 blocs
// du même poids. UN seul focus : les 4 mondes REMC en cartes « sélection de niveau »,
// le monde EN COURS agrandi porte l'unique bouton or « Continuer » (pas de carte
// dupliquée). Même DA indigo que la fiche « Deck ». CSS auto-contenu scopé .hub.
// ═══════════════════════════════════════════════════════════════
// Un badge 3D par monde (public/art/reviser/) — partagé hub + liste de monde.
const BADGE_MONDE = { 1: "voiture", 2: "feu", 3: "eclair", 4: "toque" };

// Liste des fiches d'un monde, DA indigo (cohérente avec .hub et .fd). Scopé .wm.
const MONDE_STYLE = `<style>
${chromeNight("#5a4fc0", "#423a96")}
.wm{ position:relative; max-width:480px; margin:0 auto; min-height:100dvh;
  font-family:'Archivo',sans-serif; color:#ded7ff; overflow-x:hidden;
  padding:0 0 calc(96px + env(safe-area-inset-bottom));
  background:
    radial-gradient(120% 46% at 50% -8%, rgba(255,223,150,.18) 0%, rgba(255,223,150,0) 55%),
    radial-gradient(120% 52% at 84% 8%, rgba(150,120,235,.32) 0%, rgba(150,120,235,0) 60%),
    linear-gradient(#5a4fc0 0%, #4a3fa4 60%, #423a96 100%); }
.wm *{ box-sizing:border-box; }
.wm-gold{ background:linear-gradient(180deg,#fff2cf 0%,#ffe093 38%,#f4b24a 72%,#e0921f 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; }
.wm-hero{ display:flex; align-items:center; gap:12px; padding:16px 18px 4px; }
.wm-back{ flex:0 0 44px; width:44px; height:44px; border-radius:12px; cursor:pointer;
  background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14); display:flex; align-items:center; justify-content:center; }
.wm-back:active{ transform:scale(.95); }
.wm-back svg{ display:block; }
.wm-med{ flex:0 0 52px; width:52px; height:52px; border-radius:50%; position:relative;
  background:radial-gradient(circle at 38% 30%,#fff6df,#f6ead0 62%,#e6d6b4); border:1px solid #e6dcc4;
  box-shadow:inset 0 -3px 5px rgba(150,110,40,.22), inset 0 2px 2px rgba(255,255,255,.9), 0 3px 6px rgba(20,12,60,.14);
  display:flex; align-items:center; justify-content:center; }
.wm-med img{ width:40px; height:40px; object-fit:contain; display:block; filter:drop-shadow(0 2px 2px rgba(80,50,10,.28)); }
.wm-htx{ flex:1; min-width:0; }
.wm-name{ font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:21px; line-height:1.05; letter-spacing:-.01em; filter:drop-shadow(0 2px 0 rgba(90,52,6,.3)); }
.wm-sub{ font-family:'Archivo',sans-serif; font-weight:600; font-size:12px; color:#c3b8ec; margin-top:2px; }
.wm-prog{ display:flex; align-items:center; gap:10px; padding:10px 20px 16px; }
.wm-bar{ position:relative; flex:1; height:10px; border-radius:999px; background:#2a2170; border:1px solid rgba(20,12,60,.5); box-shadow:inset 0 2px 4px rgba(0,0,0,.4); overflow:hidden; }
.wm-fill{ position:absolute; top:1px; bottom:1px; left:1px; border-radius:999px; background:linear-gradient(180deg,#ffe9b0,#f4b24a 60%,#dd921f); box-shadow:inset 0 1px 0 rgba(255,255,255,.7); }
.wm-px{ flex:0 0 auto; font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:12.5px; color:#e8ddff; }
.wm-list{ padding:0 16px; display:flex; flex-direction:column; gap:9px; }
.wm-fiche{ position:relative; display:flex; align-items:center; gap:12px; width:100%; text-align:left; cursor:pointer;
  padding:13px 14px; border-radius:15px; background:#f6f4ff; border:1px solid #e6e2fb; border-top-color:#fff;
  box-shadow:0 3px 0 rgba(20,12,60,.32), inset 0 1px 0 #fff; -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.wm-fiche:active{ transform:scale(.99); }
.wm-fiche.done{ background:linear-gradient(180deg,#fff8ea,#fdefcc); border-color:rgba(240,169,63,.5); border-top-color:#fff3d4; }
.wm-fiche.next{ border-color:#c9bff5; box-shadow:0 3px 0 rgba(20,12,60,.32), inset 0 1px 0 #fff, 0 0 0 2px rgba(150,120,255,.36); }
.wm-nextflag{ position:absolute; top:-8px; left:42px; font-family:'Archivo',sans-serif; font-weight:800; font-size:9px; letter-spacing:.1em; text-transform:uppercase;
  color:#1a1240; background:linear-gradient(180deg,#e6d4ff,#b296ff); padding:2px 8px; border-radius:999px; box-shadow:0 2px 4px rgba(20,12,60,.3); }
.wm-chk{ flex:0 0 30px; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.wm-chk.empty{ border:2.5px dashed rgba(107,95,160,.5); background:rgba(90,79,192,.05); }
.wm-chk.filled{ background:radial-gradient(circle at 36% 28%,#ffe9b0,#f0a93f 58%,#b46a10); box-shadow:inset 0 -3px 4px rgba(120,60,0,.5), inset 0 2px 2px rgba(255,255,255,.7), 0 2px 5px rgba(20,12,60,.3); }
.wm-ft{ flex:1; min-width:0; font-family:'Archivo',sans-serif; font-weight:800; font-size:14px; line-height:1.2; color:#241a45; letter-spacing:-.01em; }
.wm-fiche.done .wm-ft{ color:#5a4712; }
.wm-arw{ flex:0 0 auto; display:flex; }
/* Compte gratuit : les leçons au-delà des 3 offertes restent VISIBLES, avec un
   cadenas. On ne cache pas le programme — on montre ce qui attend derrière. */
.wm-fiche.pglock{ background:linear-gradient(180deg,#f4f1fb,#eae5f7); border-color:rgba(120,105,180,.28); }
.wm-fiche.pglock .wm-ft{ color:#6f639b; }
.wm-lock{ flex:0 0 30px; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  color:#8a7cc0; background:rgba(120,105,180,.13); box-shadow:inset 0 0 0 1.5px rgba(120,105,180,.22); }
.wm-lockflag{ position:absolute; top:-8px; right:14px; font-family:'Archivo',sans-serif; font-weight:800; font-size:9px;
  letter-spacing:.1em; text-transform:uppercase; color:#241a45; background:linear-gradient(180deg,#ffe9b0,#f0a93f);
  padding:3px 8px; border-radius:999px; box-shadow:0 2px 5px rgba(20,12,60,.28); }
@media (prefers-reduced-motion: reduce){ .wm *{ transition:none!important; } }
</style>`;

const HUB_STYLE = `<style>
${chromeNight("#5a4fc0", "#423a96")}
/* Cette page commence SOUS le bandeau (contrairement aux pages nuit qui se
   glissent dessous par une marge haute négative) : elle démarre donc déjà à
   52px du haut. Lui demander 100dvh en plus la faisait dépasser d'autant, et
   #app ajoutait encore ses 60px de réserve pour la barre du bas. Résultat :
   un ruban sombre qu'on ne découvrait qu'en tirant l'écran, alors que le
   contenu tient largement. On retranche l'un et on annule l'autre. */
.hub{ position:relative; max-width:480px; margin:0 auto;
  min-height:calc(100dvh - 52px - env(safe-area-inset-top, 0px));
  margin-bottom:calc(-60px - env(safe-area-inset-bottom, 0px));
  font-family:'Archivo',sans-serif; color:#ded7ff; overflow-x:hidden;
  padding:0 0 calc(96px + env(safe-area-inset-bottom));
  background:
    radial-gradient(120% 46% at 50% -8%, rgba(255,223,150,.18) 0%, rgba(255,223,150,0) 55%),
    radial-gradient(120% 52% at 84% 8%, rgba(150,120,235,.32) 0%, rgba(150,120,235,0) 60%),
    linear-gradient(#5a4fc0 0%, #4a3fa4 60%, #423a96 100%); }
.hub *{ box-sizing:border-box; }
.hub-gold{ background:linear-gradient(180deg,#fff2cf 0%,#ffe093 38%,#f4b24a 72%,#e0921f 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; }

.hub-hero{ display:flex; align-items:center; gap:10px; padding:16px 18px 6px; }
.hub-back{ flex:0 0 44px; width:44px; height:44px; border-radius:12px; cursor:pointer;
  background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14); display:flex; align-items:center; justify-content:center; }
.hub-back:active{ transform:scale(.95); }
.hub-back svg{ display:block; }
.hub-title{ flex:1; min-width:0; font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:22px; line-height:1; letter-spacing:-.01em;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; filter:drop-shadow(0 2px 0 rgba(90,52,6,.35)); }
.hub-gauge{ flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:6px 11px 6px 7px; border-radius:999px;
  background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.04)); border:1px solid rgba(255,223,150,.45);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.2); }
.hub-ring{ position:relative; width:24px; height:24px; flex:0 0 24px; border-radius:50%; box-shadow:inset 0 1px 1px rgba(255,255,255,.3); }
.hub-ring::after{ content:""; position:absolute; inset:4px; border-radius:50%; background:linear-gradient(180deg,#5346b6,#453b9c); }
.hub-gauge b{ position:relative; z-index:1; font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:15px; line-height:1; }
.hub-gauge small{ font-family:'Archivo',sans-serif; font-weight:700; font-size:11px; color:#bcb0f0; }

.hub-kick{ padding:6px 20px 14px; font-family:'Archivo',sans-serif; font-weight:800; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#b6a8ec; }

.hub-worlds{ padding:0 16px; display:flex; flex-direction:column; gap:13px; }
.hub-world{ position:relative; display:flex; align-items:center; gap:13px; width:100%; text-align:left; cursor:pointer;
  padding:14px 16px; border-radius:20px; background:linear-gradient(180deg,#faf8ff 0%,#efeafc 100%);
  border:1px solid #e6e2fb; border-top-color:#fff; box-shadow:0 4px 0 rgba(20,12,60,.35), inset 0 1px 0 #fff;
  -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.hub-world:active{ transform:scale(.99); }
.hub-world.pglock{ opacity:.85; }
.hub-world.pglock .hub-med{ filter:grayscale(.5) brightness(.94); }
.hub-med{ position:relative; flex:0 0 58px; width:58px; height:58px; border-radius:50%;
  background:radial-gradient(circle at 38% 30%,#fff6df,#f6ead0 62%,#e6d6b4); border:1px solid #e6dcc4;
  box-shadow:inset 0 -3px 5px rgba(150,110,40,.22), inset 0 2px 2px rgba(255,255,255,.9), 0 3px 6px rgba(20,12,60,.14);
  display:flex; align-items:center; justify-content:center; }
.hub-med img{ width:46px; height:46px; object-fit:contain; display:block; filter:drop-shadow(0 2px 2px rgba(80,50,10,.28)); }
.hub-wbody{ flex:1; min-width:0; display:flex; flex-direction:column; }
.hub-wname{ font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:17px; line-height:1.05; color:#241a45; letter-spacing:-.01em; }
.hub-wsub{ font-family:'Archivo',sans-serif; font-weight:600; font-size:11.5px; color:#7c71a6; margin:2px 0 9px; }
.hub-wprog{ display:flex; align-items:center; gap:9px; }
.hub-mbar{ position:relative; flex:1; height:9px; border-radius:999px; background:#e2ddf2; border:1px solid rgba(20,12,60,.06); box-shadow:inset 0 1px 2px rgba(20,12,60,.14); overflow:hidden; }
.hub-mf{ position:absolute; top:1px; bottom:1px; left:1px; border-radius:999px; background:linear-gradient(180deg,#ffe9b0,#f4b24a 60%,#dd921f); box-shadow:inset 0 1px 0 rgba(255,255,255,.75); }
.hub-wxn{ flex:0 0 auto; font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:13px; color:#8a7fb5; }
.hub-wxn b{ color:#e0921f; }
.hub-arw{ flex:0 0 auto; display:flex; align-items:center; }

.hub-world.active{ display:block; padding:16px 18px 18px;
  background:linear-gradient(180deg,#fff9ec 0%,#fdefcf 100%); border:1.5px solid #f4c463; border-top-color:#fff3d0;
  box-shadow:0 5px 0 rgba(150,100,20,.4), inset 0 1px 0 #fff, 0 0 0 4px rgba(255,223,150,.22); }
.hub-flag{ position:absolute; top:-10px; left:18px; display:inline-flex; align-items:center; gap:5px;
  font-family:'Archivo',sans-serif; font-weight:800; font-size:10px; letter-spacing:.1em; color:#5a3406; text-transform:uppercase;
  padding:3px 10px 3px 8px; border-radius:999px; background:linear-gradient(180deg,#ffe9b0,#f4b24a);
  box-shadow:0 3px 6px rgba(120,70,0,.3), inset 0 1px 0 rgba(255,255,255,.6); }
.hub-pulse{ width:7px; height:7px; border-radius:50%; background:#5a3406; box-shadow:0 0 0 3px rgba(90,52,6,.18); }
.hub-ahead{ display:flex; align-items:center; gap:14px; width:100%; text-align:left; cursor:pointer; background:none; border:0; padding:0;
  -webkit-tap-highlight-color:transparent; }
.hub-world.active .hub-med{ flex:0 0 66px; width:66px; height:66px; }
.hub-world.active .hub-med img{ width:54px; height:54px; }
.hub-world.active .hub-wname{ font-size:19px; }
.hub-world.active .hub-wsub{ margin:2px 0 10px; }
.hub-world.active .hub-wxn b{ color:#c9791a; }
.hub-resume{ display:flex; align-items:center; gap:12px; width:100%; margin-top:15px; padding:11px 14px; border:none; border-radius:16px; cursor:pointer; text-align:left;
  background:linear-gradient(180deg,#ffe9b0 0%,#f6c85f 38%,#f0a93f 72%,#e2951f 100%);
  box-shadow:0 5px 0 #b46a10, 0 10px 18px rgba(180,106,16,.32), inset 0 2px 0 rgba(255,255,255,.7); transition:transform .1s ease, box-shadow .1s ease; }
.hub-resume:active{ transform:translateY(3px); box-shadow:0 2px 0 #b46a10,0 5px 10px rgba(180,106,16,.28),inset 0 2px 0 rgba(255,255,255,.7); }
.hub-play{ flex:0 0 38px; width:38px; height:38px; border-radius:12px; background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,.15)); border:1px solid rgba(255,255,255,.5); display:flex; align-items:center; justify-content:center; box-shadow:inset 0 1px 0 rgba(255,255,255,.7); }
.hub-rtxt{ flex:1; min-width:0; display:flex; flex-direction:column; }
.hub-rlab{ font-family:'Archivo',sans-serif; font-weight:800; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#8a5410; }
.hub-rttl{ font-family:'Archivo', system-ui, sans-serif; font-weight:800; font-size:15.5px; color:#5a3406; line-height:1.12; text-shadow:0 1px 0 rgba(255,255,255,.4);
  /* 2 lignes max au lieu d'une coupure « … » mi-mot sur le CTA principal */
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

.hub-extra{ display:flex; gap:10px; padding:20px 16px 0; }
.hub-chip{ flex:1; min-width:0; display:flex; align-items:center; gap:9px; cursor:pointer; padding:11px 12px; border-radius:14px;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); box-shadow:inset 0 1px 0 rgba(255,255,255,.1);
  -webkit-tap-highlight-color:transparent; transition:transform .1s ease; }
.hub-chip:active{ transform:scale(.98); }
.hub-ci{ flex:0 0 30px; width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; background:rgba(255,223,150,.14); border:1px solid rgba(255,223,150,.3); }
.hub-ct{ min-width:0; display:flex; flex-direction:column; text-align:left; }
.hub-ct b{ font-family:'Archivo',sans-serif; font-weight:800; font-size:12.5px; color:#efe9ff; line-height:1.1; }
.hub-ct span{ font-family:'Archivo',sans-serif; font-weight:600; font-size:10px; color:#a99ddb; }
@media (prefers-reduced-motion: reduce){ .hub *{ transition:none!important; } }
</style>`;

// ═══════════════════════════════════════════════════════════════
// Pont vers la certification (pivot 17/07 : l'élève certifie lui-même).
// Après un quiz « Teste-toi » RÉUSSI, on propose de certifier la compétence —
// mais le juge officiel reste le quiz de #/valider-seul (5 questions corrigées
// SERVEUR). On ne valide JAMAIS ici : les questions locales ne sont pas celles
// du serveur. DA nuit-indigo + or, cohérente avec l'écran de certification.
// ═══════════════════════════════════════════════════════════════
const PONT_STYLE = `<style>
.pont{ position:relative; min-height:calc(100dvh - 60px);
  padding:32px 22px calc(40px + env(safe-area-inset-bottom));
  color:#f2f0fa; font-family:'Archivo',sans-serif; display:flex; flex-direction:column;
  align-items:center; justify-content:center; text-align:center;
  background:
    radial-gradient(120% 55% at 50% -5%, rgba(255,190,70,.12) 0%, transparent 55%),
    radial-gradient(120% 60% at 50% 22%, rgba(110,70,220,.24) 0%, transparent 62%),
    linear-gradient(180deg,#181241 0%,#0f0d24 58%,#0b0a1c 100%); }
.pont-med{ width:88px; height:88px; margin-bottom:16px; animation:pontPop .5s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes pontPop{ from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
.pont-kick{ display:inline-flex; align-items:center; gap:6px; font:800 11px/1 'Archivo',sans-serif;
  letter-spacing:.12em; text-transform:uppercase; color:#ffd76e;
  background:rgba(255,210,74,.12); border:1px solid rgba(255,210,74,.3); padding:6px 14px; border-radius:99px; margin-bottom:14px; }
.pont-ttl{ font:800 24px/1.22 'Archivo', system-ui, sans-serif; margin:0 0 10px;
  background:linear-gradient(180deg,#ffe9b0,#f5b73d); -webkit-background-clip:text; background-clip:text; color:transparent; }
.pont-p{ font:500 14px/1.55 'Archivo',sans-serif; color:#cabfef; margin:0; max-width:340px; }
.pont-p b{ color:#e9e2ff; font-weight:700; }
.pont-cta{ width:100%; max-width:340px; margin-top:26px; min-height:54px; padding:16px; border:0; border-radius:14px; cursor:pointer;
  font:800 15px/1.2 'Archivo',sans-serif; color:#4a2500;
  background:linear-gradient(180deg,#ffd76e,#f0a93f); box-shadow:0 6px 0 #b46a10, 0 12px 22px rgba(0,0,0,.4);
  display:flex; align-items:center; justify-content:center; gap:9px; }
.pont-cta:active{ transform:translateY(3px); box-shadow:0 3px 0 #b46a10, 0 7px 14px rgba(0,0,0,.4); }
.pont-ghost{ width:100%; max-width:340px; margin-top:11px; min-height:48px; padding:13px; border:1.5px solid rgba(255,255,255,.32);
  background:transparent; color:#fff; border-radius:14px; cursor:pointer; font:700 13.5px/1.2 'Archivo',sans-serif; }
.pont-ghost:active{ transform:scale(.98); }
.pont-link{ margin-top:20px; min-height:44px; display:inline-flex; align-items:center; gap:7px; padding:6px 8px; background:none; border:0; cursor:pointer;
  font:700 14px/1.2 'Archivo',sans-serif; color:#ffd76e; text-decoration:underline; text-underline-offset:3px; }
.pont-link:active{ opacity:.7; }
@media (prefers-reduced-motion: reduce){ .pont-med{ animation:none; } }
</style>`;

export async function mount(root, param) {
  track("page_view", { page: "revision-conduite" });

  // Garde-fou : si les données ne sont pas chargées (build/JSON), on n'explose pas.
  if (!FICHES.length) {
    root.innerHTML = `${STYLE}<div class="rvc"><div class="rvc-top">
      <button class="rvc-back" aria-label="${escAttr(rvcT("back", "Retour"))}">←</button>
      <h1 class="rvc-h1">${rvcText("empty_title", "Révise ta conduite")}</h1></div>
      <p class="rvc-sub" style="margin-top:20px">${rvcText("empty_body", "Les fiches arrivent très vite. Reviens dans un instant.")}</p></div>`;
    root
      .querySelector(".rvc-back")
      ?.addEventListener("click", () => navigate("#/"));
    return;
  }

  // Fusionne les lectures déjà enregistrées en base (autres appareils) AVANT
  // toute lecture de `loadRead()` — corrige le « 0/31 » multi-appareils et la
  // résolution de « next ».
  // La boîte de l'élève conditionne désormais le CONTENU de la fiche (et plus
  // seulement les mots soulignés du glossaire). On la charge AVANT le premier
  // rendu : la lire après ferait clignoter la fiche. Le résultat est mis en
  // cache par le module, donc les rendus suivants la lisent sans réseau, via
  // boiteConnue(). Échec ou colonne absente → null, et la fiche s'affiche
  // entière comme avant : jamais d'écran cassé pour un profil incomplet.
  await Promise.all([
    hydrateReadFromServer(),
    chargerBoite().catch(() => null),
  ]);

  // Deep-link : #/revision-conduite/{code} (ex. depuis « Ton centre ») ouvre
  // directement la fiche de la compétence.
  // Variantes : {code}:quiz lance le quiz de la fiche sans détour, et le
  // pseudo-code « next » se résout en première fiche non lue — c'est la cible
  // du CTA « Faire un quiz » de la quête du jour (accueil), pour que le mot
  // « quiz » mène à un quiz en un tap, sans embarquer les données de fiches
  // dans le chunk accueil.
  const [pCode, pAction] = String(param || "").split(":");
  let resolved = pCode;
  if (pCode === "next") {
    const read = loadRead();
    resolved = (FICHES.find((f) => !read[f.code]) || FICHES[0]).code;
  }
  const deep = resolved && getFicheMeta(resolved) ? resolved : null;
  let view = deep ? (pAction === "quiz" ? "quiz" : "fiche") : "home";
  let code = deep;
  let focusId = null;
  // Compétences déjà acquises (moniteur ou certification par l'élève), par code.
  // Renseigné après coup : tant que la réponse n'est pas là, on propose la
  // certification, le garde-fou serveur tranchera.
  const CERT_CACHE = new Map();
  const estAcquise = (c) => CERT_CACHE.get(c) === true;
  let mondeN = null;
  let lastFicheTracked = null; // évite de re-tracker/markRead à chaque coche de geste

  if (deep) {
    const loaders = [ensureFiche(deep), ensureFichesI18n()];
    if (view === "quiz") loaders.push(ensureQuiz(deep));
    await Promise.all(loaders);
  }

  // Ciblages du moniteur (couche 2). Requête gardée : si la table n'est pas
  // encore migrée / élève hors-ligne, on ignore silencieusement (pas de bannière).
  let focuses = [];
  try {
    const me = getCurUser();
    if (me) {
      const { data } = await sb
        .from("revision_focus")
        .select("id, competence_code, note, created_at")
        .is("done_at", null)
        .order("created_at", { ascending: false });
      focuses = data || [];
    }
  } catch {
    focuses = [];
  }

  async function markFocusDone(id) {
    try {
      await sb.rpc("mark_revision_focus_done", { p_id: id });
    } catch {
      /* non bloquant */
    }
  }

  // Le bandeau du haut (volants, réglages, avatar) est masqué SUR LA FICHE
  // seulement (choix Rayan 07/08) : c'est un écran de lecture, le compteur de
  // monnaie n'y a rien à faire, et la fiche a déjà son propre bouton retour.
  // hideHeader() se restaure tout seul au changement de hash — insuffisant
  // ici, où l'on passe de la fiche au hub SANS changer de hash (view + render).
  // D'où la restauration manuelle à chaque rendu d'une autre vue.
  let rendreLeBandeau = null;
  function render() {
    if (view !== "fiche" && rendreLeBandeau) {
      rendreLeBandeau();
      rendreLeBandeau = null;
    }
    if (view === "fiche") return renderFicheDeck();
    if (view === "quiz") return renderQuiz();
    if (view === "monde") return renderMonde();
    return renderHome();
  }

  // Liste des fiches d'UN monde — même DA indigo que le hub et la fiche Deck.
  // Chaque fiche = une carte tap-pour-ouvrir ; lue = coche or, prochaine à lire
  // = liseré violet + « à lire ». Retour → le hub des 4 mondes.
  function renderMonde() {
    const m = MONDES.find((x) => x.n === mondeN);
    if (!m) {
      view = "home";
      return render();
    }
    const read = loadRead();
    const fm = fichesByMonde(m.n);
    const done = fm.filter((f) => read[f.code]).length;
    const p = fm.length ? Math.round((done / fm.length) * 100) : 0;
    const badge = `/art/reviser/${BADGE_MONDE[m.n] || "cible"}.webp`;
    const firstUnread = fm.findIndex((f) => !read[f.code]);

    const CHK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 6" stroke="#5a3406" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const chev = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#b8afd6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const back = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="#efe9ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    // Compte gratuit : tout est listé, mais seules les 3 premières leçons
    // s'ouvrent. Les autres portent un cadenas et mènent à l'offre.
    const gratuit = isFreeTierUser(getCurUser());
    const LOCK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="5" y="10.5" width="14" height="9.5" rx="2.4" stroke="currentColor" stroke-width="2"/><path d="M8.4 10.5V7.9a3.6 3.6 0 0 1 7.2 0v2.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    const items = fm
      .map((f, i) => {
        const verrou = gratuit && !isFreeSub(f.code);
        const on = !verrou && !!read[f.code];
        const next = !verrou && i === firstUnread;
        const title = rvcFicheTitle(f);
        return `<button class="wm-fiche${on ? " done" : ""}${next ? " next" : ""}${verrou ? " pglock" : ""}" data-code="${escAttr(f.code)}"${verrou ? ' data-verrou="1"' : ""}>
          ${next ? `<span class="wm-nextflag">${rvcText("unread", "à lire")}</span>` : ""}
          ${verrou && i === FREE_SUBS.length ? `<span class="wm-lockflag">${rvcText("with_pass", "avec le Pass")}</span>` : ""}
          ${verrou ? `<span class="wm-lock">${LOCK}</span>` : `<span class="wm-chk ${on ? "filled" : "empty"}">${on ? CHK : ""}</span>`}
          <span class="wm-ft">${rvcDisplay(title)}</span>
          <span class="wm-arw">${chev}</span>
        </button>`;
      })
      .join("");

    root.innerHTML = `${MONDE_STYLE}<div class="wm">
      <div class="wm-hero">
        <button class="wm-back" aria-label="${escAttr(rvcT("back_worlds", "Retour aux mondes"))}">${back}</button>
        <span class="wm-med"><img src="${badge}" alt="" width="512" height="512" loading="lazy" decoding="async"></span>
        <div class="wm-htx">
          <h1 class="wm-name wm-gold">${rvcDisplay(rvcWorld(m, "name"))}</h1>
          <div class="wm-sub">${rvcDisplay(rvcWorld(m, "sub"))}</div>
        </div>
      </div>
      <div class="wm-prog">
        <div class="wm-bar"><div class="wm-fill" style="width:${done ? Math.max(p, 5) : 0}%"></div></div>
        <span class="wm-px">${rvcText("read_count", "{done}/{total} lues", { done, total: fm.length })}</span>
      </div>
      <div class="wm-list">${items}</div>
    </div>`;

    root.querySelector(".wm-back").addEventListener("click", () => {
      view = "home";
      render();
    });
    root.querySelectorAll("[data-code]").forEach((b) =>
      b.addEventListener("click", async () => {
        const c = b.getAttribute("data-code");
        if (b.dataset.verrou) {
          // Droit à l'offre : ouvrir la fiche pour la refermer aussitôt donnerait
          // l'impression d'un bug.
          track("freetier.lock_tap", { kind: "fiche", code: c });
          const { mount } = await import("@/pages/eleve/pass-requis.js");
          return mount(root, getCurUser());
        }
        code = c;
        focusId = null;
        await Promise.all([ensureFiche(code), ensureFichesI18n()]);
        view = "fiche";
        render();
      }),
    );
  }

  // Hub « Carte des mondes » indigo (choix Rayan 2026-07-18) : les 4 mondes REMC
  // en cartes « sélection de niveau ». Le monde EN COURS est agrandi et porte
  // l'UNIQUE bouton or « Continuer » (fini le doublon hero + ligne 1). Défi/faute
  // en petites puces discrètes. CSS auto-contenu (.hub), cohérent avec la fiche Deck.
  function renderHome() {
    const read = loadRead();
    const revised = loadRevised();
    const totalF = FICHES.length;
    const lues = FICHES.filter((f) => read[f.code]).length;
    const pct = totalF ? Math.round((lues / totalF) * 100) : 0;
    const pf = pointFaible(revised);
    const nextF = FICHES.find((f) => !read[f.code]) || pf;
    const firstEver = lues === 0;
    const curMonde = nextF ? Number(nextF.monde) : null;

    const arw = (c) =>
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const hubGratuit = isFreeTierUser(getCurUser());
    const HUB_LOCK = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="5" y="10.5" width="14" height="9.5" rx="2.4" stroke="#b8afd6" stroke-width="2"/><path d="M8.4 10.5V7.9a3.6 3.6 0 0 1 7.2 0v2.6" stroke="#b8afd6" stroke-width="2" stroke-linecap="round"/></svg>`;

    const worlds = MONDES.map((m) => {
      const fm = fichesByMonde(m.n);
      const done = fm.filter((f) => read[f.code]).length;
      const mpct = fm.length ? Math.round((done / fm.length) * 100) : 0;
      const badge = `/art/reviser/${BADGE_MONDE[m.n] || "cible"}.webp`;
      const worldName = rvcWorld(m, "name");
      const worldSub = rvcWorld(m, "sub");
      const bar = `<span class="hub-mbar"><span class="hub-mf" style="width:${done ? Math.max(mpct, 5) : 0}%"></span></span>`;
      const xn = `<span class="hub-wxn">${done ? `<b>${done}</b>/` : "0/"}${fm.length}</span>`;

      if (curMonde === m.n && nextF) {
        // Monde en cours : agrandi, porte le bouton « Continuer ».
        return `<div class="hub-world active">
          <span class="hub-flag"><span class="hub-pulse"></span>${firstEver ? rvcText("to_start", "À commencer") : rvcText("in_progress", "En cours")}</span>
          <button class="hub-ahead" data-monde="${m.n}" aria-label="${escAttr(rvcT("see_all", "Voir toutes les fiches. {name}", { name: worldName }))}">
            <span class="hub-med"><img src="${badge}" alt="" width="512" height="512" loading="lazy" decoding="async"></span>
            <span class="hub-wbody">
              <span class="hub-wname">${rvcDisplay(worldName)}</span>
              <span class="hub-wsub">${rvcDisplay(worldSub)}</span>
              <span class="hub-wprog">${bar}${xn}</span>
            </span>
          </button>
          <button class="hub-resume" ${firstEver ? "data-first" : "data-next"} data-code="${escAttr(nextF.code)}">
            <span class="hub-play"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5-11-6.5z" fill="#5a3406"/></svg></span>
            <span class="hub-rtxt"><span class="hub-rlab">${firstEver ? rvcText("start", "Commencer") : read[nextF.code] ? rvcText("reread", "Relire") : rvcText("continue", "Continuer")}</span><span class="hub-rttl">${rvcDisplay(rvcFicheTitle(nextF))}</span></span>
            <span class="hub-arw">${arw("#5a3406")}</span>
          </button>
        </div>`;
      }
      // Monde normal : la carte entière ouvre la liste de ses fiches. Sur un
      // compte gratuit, un monde dont AUCUNE leçon n'est offerte porte un
      // cadenas — il reste visible et cliquable (il mène à l'offre).
      const mondeVerrou = hubGratuit && !fm.some((f) => isFreeSub(f.code));
      return `<button class="hub-world${mondeVerrou ? " pglock" : ""}" data-monde="${m.n}">
        <span class="hub-med"><img src="${badge}" alt="" width="512" height="512" loading="lazy" decoding="async"></span>
        <span class="hub-wbody">
          <span class="hub-wname">${rvcDisplay(worldName)}</span>
          <span class="hub-wsub">${rvcDisplay(worldSub)}</span>
          <span class="hub-wprog">${bar}${xn}</span>
        </span>
        <span class="hub-arw">${mondeVerrou ? HUB_LOCK : arw("#b8afd6")}</span>
      </button>`;
    }).join("");

    const lightning = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#f4b24a"/></svg>`;
    const loupe = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="#f4b24a" stroke-width="2.4"/><path d="M16 16l4.5 4.5" stroke="#f4b24a" stroke-width="2.6" stroke-linecap="round"/></svg>`;
    const back = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="#efe9ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    root.innerHTML = `${HUB_STYLE}<div class="hub">
      <div class="hub-hero">
        <button class="hub-back" aria-label="${escAttr(rvcT("back_review", "Retour à Réviser"))}">${back}</button>
        <h1 class="hub-title hub-gold">${rvcText("page_title", "Révise ta conduite")}</h1>
        <div class="hub-gauge">
          <span class="hub-ring" style="background:conic-gradient(#f4b24a 0 ${pct}%, rgba(20,12,60,.5) ${pct}% 100%)"></span>
          <span><b class="hub-gold">${lues}</b><small> / ${totalF}</small></span>
        </div>
      </div>
      <div class="hub-kick">${rvcText("four_worlds", "Tes 4 mondes")}</div>
      <div class="hub-worlds">${worlds}</div>
      <div class="hub-extra">
        ${pf ? `<button class="hub-chip" data-pf="${escAttr(pf.code)}"><span class="hub-ci">${lightning}</span><span class="hub-ct"><b>${rvcText("daily_challenge", "Défi du jour")}</b><span>${rvcText("one_min", "1 min")}</span></span></button>` : ""}
        <button class="hub-chip" data-faute><span class="hub-ci">${loupe}</span><span class="hub-ct"><b>${rvcText("find_fault", "Trouve la faute")}</b><span>${rvcText("spot_error", "Repère l’erreur")}</span></span></button>
      </div>
    </div>`;
    wireHome();
  }

  function wireHome() {
    root
      .querySelector(".hub-back")
      ?.addEventListener("click", () => navigate("#/reviser"));
    root.querySelector("[data-pf]")?.addEventListener("click", (e) => {
      code = e.currentTarget.getAttribute("data-pf");
      focusId = null;
      track("revision_conduite_pf_start", { code });
      startQuiz();
    });
    root.querySelector("[data-faute]")?.addEventListener("click", () => {
      track("revision_conduite_faute_open");
      navigate("#/jeu-faute");
    });
    const openFiche = async (e) => {
      code = e.currentTarget.getAttribute("data-code");
      focusId = null;
      await Promise.all([ensureFiche(code), ensureFichesI18n()]);
      view = "fiche";
      render();
    };
    root.querySelector("[data-next]")?.addEventListener("click", openFiche);
    root.querySelector("[data-first]")?.addEventListener("click", (e) => {
      track("revision_conduite_first_fiche", {
        code: e.currentTarget.getAttribute("data-code"),
      });
      openFiche(e);
    });
    root.querySelectorAll("[data-monde]").forEach((b) =>
      b.addEventListener("click", () => {
        mondeN = Number(b.getAttribute("data-monde"));
        view = "monde";
        render();
      }),
    );
  }

  // Fiche « Deck » indigo (choix Rayan 2026-07-17) : la méthode = un deck de
  // gestes à cocher (médailles or), les « à retenir » en cartes coach discrètes,
  // une seule action or « Teste-toi ». S'applique à TOUTES les fiches (les longues
  // gardent leurs sections via des sous-titres). Cocher un geste est purement
  // local (localStorage rvc_gestes) ; « lue » (progression du hub) = fiche ouverte.
  function renderFicheDeck() {
    const f = getFiche(code);
    if (!f) {
      view = "home";
      return render();
    }

    // ── Compte gratuit : les 3 premières leçons, en grand ──────────────────
    // Plus de quota quotidien sur les fiches (cf. free-tier.js) : C1a, C1b et
    // C1c sont ouvertes autant qu'il veut, tout le reste renvoie au mur. Il
    // traverse le début du cours d'une traite et bute sur « Démarrer et
    // s'arrêter » — là où l'envie est la plus forte.
    const meFt = getCurUser();
    if (isFreeTierUser(meFt) && !isFreeSub(f.code)) {
      track("freetier.quota_hit", { kind: "fiche", code: f.code });
      return mountFreeTierWall(root, {
        me: meFt,
        reason: "quota",
        kind: "fiche",
      });
    }

    // Ouvrir = « lue » (progression du hub), tracké UNE fois — pas à chaque coche
    // de geste, qui re-render la fiche.
    if (lastFicheTracked !== f.code) {
      markRead(f.code);
      track("revision_conduite_fiche_open", { code: f.code });
      track("revision_conduite_fiche_read", { code: f.code });
      lastFicheTracked = f.code;
    }

    // ── i18n : traduction affichée, français gardé dessous (arabe RTL par span) ──
    const lang = getLang();
    const rtl = lang === "ar";
    const tr = ficheTr(f.code, lang); // {titre,competence,methode,pourquoi,erreur,bva,quiz} | null
    const bi = (fr, t) =>
      lang === "fr" || t == null || t === ""
        ? esc(fr)
        : `<span class="fd-tr"${rtl ? ' dir="rtl" lang="ar"' : ""}>${esc(t)}</span>` +
          `<span class="fd-fr" lang="fr" dir="ltr">${esc(fr)}</span>`;
    const ui = (key, frTxt) => uiFiche(lang, key, frTxt);

    // ── La boîte de l'élève ────────────────────────────────────────────────
    // L'app SAIT depuis l'inscription quelle boîte il conduit
    // (profiles.transmission). Jusqu'ici elle ne servait qu'à choisir les mots
    // soulignés du glossaire : un élève en automatique lisait quatorze gestes
    // d'embrayage comme s'ils le concernaient, et la carte « En boîte auto »
    // arrivait tout en bas — poussée en plus à ceux qui roulent en manuelle,
    // à qui elle ne sert à rien.
    // Ce qu'on fait, sans réécrire une seule ligne de fiche :
    //   · manuelle   → la carte « En boîte auto » disparaît ;
    //   · automatique→ le MÊME texte remonte en tête de fiche ;
    //   · fiche que l'automatique ne concerne pas (le champ bva le dit
    //     littéralement, d'où le drapeau bvaHorsSujet) → on le dit d'emblée,
    //     et le résumé « En 10 secondes » écrit pour la manuelle se tait.
    // Boîte inconnue (colonne pas encore migrée, hors-ligne, profil sans
    // réglage) → strictement l'ancien comportement : la fiche entière, carte
    // « En boîte auto » comprise, à sa place d'avant. On ne cache jamais du
    // contenu sur une supposition.
    const boite = boiteConnue();
    const enAuto = boite === "auto";
    const enManuelle = boite === "manuelle";
    const bvaHorsSujet = enAuto && f.bvaHorsSujet === true;

    const steps = Array.isArray(f.methode) ? f.methode : [];
    const total = steps.length;
    const groups = groupSteps(steps);
    const grouped = useGrouped(steps, groups);
    // Texte « propre » (préfixe de section retiré) pour le jeu « remets dans l'ordre ».
    const flatSteps = grouped ? groups.flatMap((g) => g.steps) : steps;
    // Gestes traduits, parallèles au FR. En mode groupé on n'utilise la
    // traduction que si le découpage en sections est identique (sinon repli FR) ;
    // en mode plat on mappe geste à geste par index.
    const stepsTR =
      tr && tr.methode && tr.methode.length === steps.length
        ? tr.methode
        : null;
    let groupsTR = null;
    if (grouped && stepsTR) {
      const g2 = groupSteps(stepsTR);
      const aligned =
        g2.length === groups.length &&
        groups.every((g, i) => g2[i] && g.steps.length === g2[i].steps.length);
      if (aligned) groupsTR = g2;
    }
    const flatStepsTR = grouped
      ? groupsTR?.flatMap((g) => g.steps) || null
      : stepsTR;

    const doneSet = new Set(
      (loadGestes()[f.code] || []).filter((i) => i < total),
    );
    const count = doneSet.size;
    let firstUnchecked = -1;
    for (let i = 0; i < total; i++) {
      if (!doneSet.has(i)) {
        firstUnchecked = i;
        break;
      }
    }
    const pct = total ? Math.round((count / total) * 100) : 0;

    const CHK = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 6" stroke="#5a3406" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    // Petit picto générique pour l'encart annexe (l'ex-parenthèse) : on ne
    // sait pas deviner s'il s'agit d'un avertissement ou d'une précision, un
    // seul picto « information » pour tous plutôt qu'une fausse distinction.
    const ASIDE_IC = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#7c5fe0"/><path d="M12 11v5.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="8" r="1.15" fill="#fff"/></svg>`;
    const CHEV = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    // Titres courts écrits à la main, un par geste, dans le champ « titres »
    // des fiches (215 au total). Ils n'existent qu'en français : une longueur
    // qui tient sur une ligne dépend de la langue, on ne la devine pas. Sans
    // eux (fiche pas encore pourvue, autre langue) on retombe exactement sur
    // l'affichage d'avant — la fiche reste lisible, juste plus longue.
    const titresFr =
      lang === "fr" && Array.isArray(f.titres) && f.titres.length === total
        ? f.titres
        : null;
    // rank = position DANS la section affichée (un groupe, ou la fiche
    // entière si pas de groupe) — c'est le numéro du médaillon.
    const card = (s, i, sTr, rank) => {
      const done = doneSet.has(i);
      const next = i === firstUnchecked;
      // Le découpage « consigne + détail » ne s'applique qu'au français : il
      // coupe sur la ponctuation du texte SOURCE, une traduction n'a aucune
      // raison de porter la même structure (cf. commentaire sur splitStepCard).
      const parsed = lang === "fr" ? splitStepCard(s) : null;
      const teteHtml = titresFr
        ? esc(titresFr[i])
        : parsed
          ? bi(parsed.consigne, null)
          : bi(s, sTr);
      // Sous le pli : le geste ENTIER. Quand un titre court le remplace en
      // tête, la consigne d'origine redescend ici — sinon on perdrait du cours.
      // Sauf si elle ne dit rien de plus que le titre : « Fais le tour de la
      // voiture » suivi de « Fais le tour rapide de la voiture » se lit comme
      // un bégaiement. On la garde dès qu'elle apporte deux mots nouveaux
      // (« derrière le volant », « et vérifie qu'elle est bien claquée »).
      const sous = [];
      if (titresFr) {
        const brut = parsed ? parsed.consigne : s;
        if (motsEnPlus(brut, titresFr[i]) >= 2) sous.push(brut);
      }
      if (parsed && parsed.detail.length) sous.push(...parsed.detail);
      const aside = parsed && parsed.aside ? parsed.aside : "";
      const ouvrable = sous.length > 0 || Boolean(aside);
      const tete = ouvrable
        ? `<button type="button" class="fd-tete" data-ouvre="${i}" aria-expanded="false" aria-controls="fd-plus-${i}">
             <span>${teteHtml}</span>${CHEV}
           </button>`
        : `<span class="fd-tete fd-tete-fixe"><span>${teteHtml}</span></span>`;
      return `<div class="fd-line${done ? " done" : ""}${next ? " next" : ""}">
        <div class="fd-line-top">
          <button type="button" class="fd-med" data-geste="${i}" aria-pressed="${done}"
            aria-label="${escAttr(ui("coche", "Cocher ce geste"))}">${done ? CHK : `<b>${rank}</b>`}</button>
          ${tete}
        </div>
        ${
          ouvrable
            ? `<div class="fd-plus" id="fd-plus-${i}" hidden>
            ${sous.length ? `<ul>${sous.map((d) => `<li>${bi(d, null)}</li>`).join("")}</ul>` : ""}
            ${aside ? `<div class="fd-aside">${ASIDE_IC}<p>${bi(aside, null)}</p></div>` : ""}
          </div>`
            : ""
        }
      </div>`;
    };

    // Le sous-titre de section fait office d'en-tête « La méthode » (pas de
    // double titre) : chaque groupe a le sien, le 1er sans libellé retombe dessus.
    // En en/ar : libellé traduit seul (chrome), français en repli.
    const seclab = (fr, trLab) =>
      `<div class="fd-seclab"><h2${rtl && trLab ? ' dir="rtl" lang="ar"' : ""}>${esc(lang !== "fr" && trLab ? trLab : fr)}</h2><div class="line"></div></div>`;
    const methLab = lang !== "fr" ? ui("methode", "La méthode") : null;
    let deckHtml = "";
    if (grouped) {
      let idx = 0;
      deckHtml = groups
        .map((g, gi) => {
          const gTR = groupsTR ? groupsTR[gi] : null;
          const cards = g.steps
            .map((s, j) =>
              card(s, idx++, gTR ? gTR.steps[j] : null, j + 1, g.steps.length),
            )
            .join("");
          const lab = g.label || "La méthode";
          const labTR = g.label ? (gTR ? gTR.label : null) : methLab;
          return `${seclab(lab, labTR)}<div class="fd-deck">${cards}</div>`;
        })
        .join("");
    } else {
      // Fiche d'un seul tenant : pas de bandeau « La méthode ». Il ne
      // séparerait rien (une seule section) et le briefing juste au-dessus
      // annonce déjà la liste. Les fiches groupées gardent leurs libellés :
      // là, ils portent une vraie information (créneau, bataille, giratoire).
      deckHtml = `<div class="fd-deck">${steps
        .map((s, i) => card(s, i, stepsTR ? stepsTR[i] : null, i + 1, total))
        .join("")}</div>`;
    }

    // Cartes coach : uniquement celles présentes dans la fiche (repli gracieux).
    const WHY_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M9.5 21h5" stroke="#7c5fe0" stroke-width="1.8" stroke-linecap="round"/><path d="M12 3a6 6 0 0 1 3.6 10.8c-.7.5-1.1 1.2-1.1 2H9.5c0-.8-.4-1.5-1.1-2A6 6 0 0 1 12 3z" fill="#7c5fe0"/></svg>`;
    const AUTO_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7h9a2 2 0 0 1 1.9 1.6L20 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z" fill="#3f82d6"/><circle cx="7.2" cy="15.4" r="1.1" fill="#eaf3ff"/><circle cx="16.8" cy="15.4" r="1.1" fill="#eaf3ff"/></svg>`;
    // ICRI : horloge (quand), panneau danger (ce qu'on risque), deux usagers
    // (l'effet sur les autres).
    const CTX_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#14968c"/><path d="M12 7v5.2l3.2 2" stroke="#eafaf7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const RSK_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#c8324f"/><path d="M13.4 6.5l-4.6 6.4h3.1l-1.3 4.6 4.6-6.4h-3.1l1.3-4.6z" fill="#fff0f3"/></svg>`;
    const INF_IC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="8.6" cy="9" r="3.1" fill="#2d965a"/><path d="M3 19c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2z" fill="#2d965a"/><circle cx="16.8" cy="10.2" r="2.4" fill="#2d965a" opacity=".55"/><path d="M13.4 19c0-2.5 1.9-4.1 3.9-4.1 1.6 0 3.7 1 3.7 4.1z" fill="#2d965a" opacity=".55"/></svg>`;
    // Loupe discrète (affordance) : la carte se tape pour lire en grand.
    const ZOOM_IC = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5" stroke="#8579b8" stroke-width="2"/><path d="M15.5 15.5L21 21" stroke="#8579b8" stroke-width="2" stroke-linecap="round"/><path d="M10.5 8v5M8 10.5h5" stroke="#8579b8" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    // Chevrons du deck (pour qui ne glisse pas : souris, clavier, lecteur d'écran).
    const CD_LEFT = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const CD_RIGHT = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    // Ordre ICRI (Intérêt → Contexte → Risque → Influence) : l'élève lit
    // d'abord à quoi ça sert, puis quand ça tombe, ce qu'il encourt, et l'effet
    // sur les autres. L'erreur type et la boîte auto ferment la série.
    const coach = [];
    if (f.pourquoi)
      coach.push({
        k: "why",
        h: ui("why_h", "Pourquoi ça compte"),
        fr: f.pourquoi,
        tr: tr?.pourquoi,
        ic: WHY_IC,
      });
    if (f.contexte)
      coach.push({
        k: "ctx",
        h: ui("ctx_h", "Quand ça arrive"),
        fr: f.contexte,
        tr: tr?.contexte,
        ic: CTX_IC,
      });
    if (f.risque)
      coach.push({
        k: "rsk",
        h: ui("rsk_h", "Ce que tu risques"),
        fr: f.risque,
        tr: tr?.risque,
        ic: RSK_IC,
      });
    if (f.influence)
      coach.push({
        k: "inf",
        h: ui("inf_h", "L’effet sur les autres"),
        fr: f.influence,
        tr: tr?.influence,
        ic: INF_IC,
      });
    // « L'erreur à éviter » ne fait plus partie du deck coach : c'est la seule
    // des cinq cartes qui change la leçon de demain, elle monte donc en clair
    // juste sous les gestes (le « piège »). L'enfouir dans une pile qu'il faut
    // faire défiler la rendait invisible.
    // En manuelle : rien à dire sur la boîte auto. En automatique : le texte
    // remonte en tête de fiche (autoNoteHtml), il n'a plus rien à faire ici.
    // Boîte inconnue : on garde la carte à sa place historique.
    if (f.bva && !enAuto && !enManuelle)
      coach.push({
        k: "auto",
        h: ui("bva_h", "En boîte auto"),
        fr: f.bva,
        tr: tr?.bva,
        ic: AUTO_IC,
      });
    // Carte = <button> tapable (≥ 44px) → bottom-sheet « lecture en grand »
    // (demande Rayan 22/07 : « c'est tout petit »). Spans block, pas de h4/p
    // dans un <button> (contenu phrasé uniquement).
    //
    // Deck empilé et non plus grille (demande Rayan 02/08 : « je veux empiler
    // une sur l'autre et on swipe »). Même mécanique que la collection : trois
    // couches, la carte du dessus se glisse à gauche ou à droite. Le texte est
    // tronqué à hauteur fixe pour que les cartes s'empilent proprement ; le tap
    // ouvre la lecture en grand, donc rien n'est perdu.
    // Le HTML de chaque carte est mémorisé sur la carte elle-même : le deck est
    // reconstruit en JS à chaque glissement, hors de cette portée.
    coach.forEach((c, i) => {
      c.html = `<button type="button" class="fd-cc ${c.k}" data-coach="${i}" aria-haspopup="dialog"><span class="fd-cc-zoom" aria-hidden="true">${ZOOM_IC}</span><span class="fd-ic">${c.ic}</span><span class="fd-cc-h">${esc(c.h)}</span><span class="fd-cc-p">${bi(c.fr, c.tr)}</span></button>`;
    });
    // Le piège : une seule chose à ne pas rater demain, en clair sous la liste.
    const piegeHtml = f.erreur
      ? `<div class="fd-piege">
          <b>${esc(ui("piege_h", "Le piège"))}</b>
          <p${rtl && tr?.erreur ? ' dir="rtl" lang="ar"' : ""}>${bi(f.erreur, tr?.erreur)}</p>
        </div>`
      : "";
    // ── Les cartes coach ne sont plus dans la fiche ───────────────────────
    // Le deck empilé (pourquoi ça compte · quand ça arrive · ce que tu risques
    // · l'effet sur les autres) coûtait 353 à 436 px et jusqu'à 125 mots,
    // placés APRÈS le bouton : personne ne descendait jusque-là.
    // Aucune des quatre ne dit à l'élève quoi faire de ses mains demain — la
    // seule qui changeait sa leçon, « l'erreur à éviter », est remontée en
    // clair sous les gestes (le piège).
    // Le tableau `coach` reste construit plus haut : il alimente encore la
    // lecture en grand (openCoachSheet) et se rebranche en une ligne.

    // ── « En boîte auto », remontée en tête de fiche ───────────────────────
    // Même texte que la carte coach d'avant (f.bva), mot pour mot. Il ne
    // change pas, il change de PLACE : l'élève en automatique le lit avant les
    // gestes, pas quatorze gestes plus bas. Variante « off » quand le champ
    // bva dit lui-même que la fiche ne le concerne pas.
    // La boîte auto remonte SOUS le briefing, là où l'élève la lit.
    // Elle était sous le bouton, donc invisible : c'est pourtant le seul bloc
    // qui change ce qu'il fait de ses pieds demain.
    // ⚠️ Condition STRICTE : `enAuto`, jamais « tout sauf la manuelle ».
    // Mesuré le 07/08 : 99 profils élèves sur 106 n'ont AUCUNE boîte
    // renseignée. Élargir aux boîtes inconnues aurait collé 259 px de texte
    // sur l'automatique en tête de fiche à 93 % des élèves, dont tous ceux qui
    // apprennent en manuelle. On n'affiche que si l'app SAIT.
    const autoNoteHtml =
      enAuto && f.bva
        ? // Replié comme les gestes : 55 à 83 mots de prose posés entre le
          // briefing et la liste repoussaient les gestes de 260 px. Le titre
          // suffit à dire à l'élève que la fiche tient compte de sa boîte ;
          // il ouvre s'il veut le détail.
          // Exception : quand la fiche ne le concerne pas (bvaHorsSujet), le
          // texte reste ouvert — c'est un avertissement, pas un complément.
          `<div class="fd-auto${bvaHorsSujet ? " off" : ""}">
            <button type="button" class="fd-auto-head" data-ouvre="auto"
              aria-expanded="${bvaHorsSujet}" aria-controls="fd-plus-auto">
              <span class="fd-auto-ic" aria-hidden="true">${AUTO_IC}</span>
              <span class="fd-auto-h">${esc(
                bvaHorsSujet
                  ? ui("bva_off_h", "Cette fiche ne te concerne pas")
                  : ui("bva_h", "En boîte auto"),
              )}</span>
              ${CHEV}
            </button>
            <div class="fd-auto-body" id="fd-plus-auto"${bvaHorsSujet ? "" : " hidden"}>
              <p class="fd-auto-p">${bi(f.bva, tr?.bva)}</p>
            </div>
          </div>`
        : "";

    const srcChaines = sourceChannels(f);
    const srcHtml = srcChaines.length
      ? `<div class="fd-source">${esc(ui("source", "Vu chez de vrais moniteurs :"))} <b>${srcChaines.map((s) => esc(s)).join(", ")}</b></div>`
      : "";

    // ── Le briefing ────────────────────────────────────────────────────────
    // Remplace l'ancienne intro narrative (« Aujourd'hui Rayan, tu attaques
    // … ») : elle prenait 277 px pour annoncer ce que le titre juste
    // au-dessus disait déjà, et sa 1re phrase de « pourquoi » était redite
    // plus bas dans les cartes coach.
    // Ici la mascotte annonce, le prénom porte l'adresse. Deux lignes.
    // Sans prénom (profil pas encore rempli) on garde la seule ligne utile,
    // jamais une salutation à trou.
    const prenom = String(getCurUser()?.prenom || "").trim();
    const briefHtml = `<div class="fd-brief">
      ${prenom ? `<span class="nom fd-gold">${esc(prenom)}</span>` : ""}
      <span class="dit"${rtl ? ' dir="rtl" lang="ar"' : ""}>${esc(
        prenom
          ? ui("brief", `Tes ${total} gestes dans l'ordre`)
          : ui("brief_seul", `Les ${total} gestes dans l'ordre`),
      )}</span>
      <img class="fd-brief-masc" src="/skins/mascot-pointing.png" alt=""
        aria-hidden="true" width="138" height="138" loading="eager" decoding="async">
    </div>`;

    // Le bloc « En 10 secondes » (resume10s / resume10sBva) n'est plus
    // affiché : c'était la méthode résumée en 3 lignes, juste au-dessus de la
    // méthode en entier. Cette redite existait parce que la liste des gestes
    // était illisible d'un coup d'œil ; maintenant qu'elle tient en une carte
    // de titres courts, elle EST le résumé. Les champs restent dans les JSON,
    // rien n'est perdu si on veut les ré-afficher ailleurs.

    const BACK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="#3d2f7a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const competenceTxt =
      lang !== "fr" && tr?.competence ? tr.competence : f.competence;

    // Une seule pose : renderFicheDeck() est rappelée à chaque coche.
    if (!rendreLeBandeau) rendreLeBandeau = hideHeader();

    root.innerHTML = `${FD_STYLE}<div class="fd">
      <div class="fd-hero">
        <div class="fd-topbar">
          <button class="fd-back" aria-label="${escAttr(ui("back", "Retour"))}">${BACK}</button>
          <span class="fd-tag"><span class="fd-dot"></span><b>${esc(f.code)} · ${esc(competenceTxt)} · ${esc(ui("monde", "Monde"))} ${esc(String(f.monde))}</b></span>
        </div>
        <h1 class="fd-title fd-gold">${bi(f.titre, tr?.titre)}</h1>
      </div>

      ${briefHtml}
      ${autoNoteHtml}
      ${deckHtml}
      ${piegeHtml}

      <div class="fd-actions">
        <!-- La prévention ne sert qu'AVANT : une fois la compétence acquise,
             elle n'a plus rien à prévenir et le bouton dit déjà tout. -->
        ${
          estAcquise(f.code)
            ? ""
            : `<div class="fd-warn">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>
          <p>${esc(ui("cta_warn", "Fais-la d'abord en leçon avec ton enseignant. On certifie ce que tu sais faire, pas ce que tu viens de lire."))}</p>
        </div>`
        }
        <button class="fd-cta" data-certif-fiche><span>${esc(
          estAcquise(f.code)
            ? ui("cta_done", "Rejoue cette compétence")
            : ui("cta", "Certifie la compétence"),
        )}</span></button>
      </div>

      ${srcHtml}
    </div>`;

    wireFicheDeck(f, flatSteps, flatStepsTR, coach, rtl);

    // Les mots de moniteur (« commodo », « patinage », « rétrograder »)
    // arrivaient sans jamais être définis, y compris pour un élève qui
    // apprend le français (audit 01/08). Ils sont soulignés une fois par
    // fiche, un tap ouvre la définition. On attend la boîte pour ne pas
    // souligner « débrayer » à quelqu'un qui roule en automatique.
    const zoneFiche = root.querySelector(".fd");
    if (zoneFiche) {
      brancherGlossaire(zoneFiche);
      chargerBoite()
        .then((boite) => {
          if (root.querySelector(".fd") !== zoneFiche) return; // fiche changée
          // marquerTermes seul : les mots sont soulignés dans le texte et
          // se tapent. Le bloc récapitulatif du bas (poserLexique) est retiré,
          // il redisait la même liste 85 px plus bas, après le bouton.
          marquerTermes(zoneFiche, boite);
        })
        .catch(() => {
          /* pas de glossaire plutôt qu'une fiche cassée */
        });
    }
  }

  function wireFicheDeck(f, flatSteps, flatStepsTR, coach = [], rtl = false) {
    root.querySelector(".fd-back")?.addEventListener("click", () => {
      view = "home";
      render();
    });
    // Déplier un geste : le détail vit sous le pli, un tap l'ouvre. En JS pur
    // (pas de <details>) pour garder le médaillon cliquable à côté du titre.
    // Pas de re-render ici : cocher un geste re-rend la fiche et refermerait
    // tout, ce qui est le bon comportement (on coche quand on a fini de lire).
    root.querySelectorAll("[data-ouvre]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const zone = document.getElementById(
          `fd-plus-${btn.getAttribute("data-ouvre")}`,
        );
        if (!zone) return;
        const ouvert = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", ouvert ? "false" : "true");
        zone.hidden = ouvert;
        haptic("select");
      }),
    );
    // Cocher / décocher un geste : local, re-render en place (scroll conservé).
    root.querySelectorAll("[data-geste]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-geste"));
        const set = new Set(loadGestes()[f.code] || []);
        const wasDone = set.has(i);
        if (wasDone) set.delete(i);
        else set.add(i);
        saveGestes(
          f.code,
          [...set].sort((a, b) => a - b),
        );
        haptic(wasDone ? "select" : "success");
        const y = window.scrollY;
        renderFicheDeck();
        window.scrollTo(0, y);
      }),
    );
    // ── Deck des cartes coach : empilées, on glisse pour passer à la suivante
    // (demande Rayan 02/08). Trois couches comme la collection ; le tap ouvre
    // toujours la lecture en grand (demande Rayan 22/07).
    const cdeck = root.querySelector("[data-cdeck]");
    if (cdeck && coach.length) {
      const counter = root.querySelector("[data-cd-count]");
      let cur = 0;
      let ignoreClickUntil = 0; // un glissement ne doit pas ouvrir la fiche

      const buildCoachDeck = () => {
        cdeck.textContent = "";
        const depth = Math.min(3, coach.length);
        for (let d = depth - 1; d >= 0; d--) {
          const idx = (cur + d) % coach.length;
          const holder = document.createElement("div");
          holder.innerHTML = coach[idx].html;
          const el = holder.firstElementChild;
          el.dataset.depth = String(d);
          el.dataset.coach = String(idx);
          if (d > 0) {
            // Les cartes du dessous sont décoratives : ni tabulation ni voix.
            el.setAttribute("aria-hidden", "true");
            el.tabIndex = -1;
          }
          cdeck.appendChild(el);
        }
        if (counter) counter.textContent = `${cur + 1} / ${coach.length}`;
        makeCoachDraggable(cdeck.lastElementChild);
      };

      const advanceCoach = (dir) => {
        if (coach.length < 2) return;
        const top = cdeck.lastElementChild;
        if (!top) return;
        haptic("tap");
        const out = dir > 0 ? -1 : 1; // glissé vers la gauche = suivante
        top.classList.add("is-anim");
        top.style.transform = `translateX(${out * 130}%) rotate(${out * 14}deg)`;
        top.style.opacity = "0";
        // transitionend part DEUX fois (transform + opacity) : on ne rebâtit
        // le deck qu'une seule.
        let done = false;
        const after = () => {
          if (done) return;
          done = true;
          cur = (cur + dir + coach.length) % coach.length;
          buildCoachDeck();
        };
        top.addEventListener("transitionend", after);
        setTimeout(after, 470); // filet si la transition ne se déclenche pas
      };

      function makeCoachDraggable(top) {
        if (!top || coach.length < 2) return;
        let startX = 0,
          startY = 0,
          dx = 0,
          dy = 0,
          moved = 0,
          axis = null,
          dragging = false;
        top.addEventListener("pointerdown", (e) => {
          dragging = true;
          startX = e.clientX;
          startY = e.clientY;
          dx = dy = moved = 0;
          axis = null;
          top.classList.remove("is-anim");
          top.setPointerCapture?.(e.pointerId);
        });
        top.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          dx = e.clientX - startX;
          dy = e.clientY - startY;
          moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
          // L'axe se décide une fois pour toutes : sinon un scroll vertical de
          // la page emmène la carte avec lui.
          if (!axis && moved > 8)
            axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
          if (axis !== "x") return;
          top.style.transform = `translate(${dx}px, ${dy * 0.18}px) rotate(${dx / 22}deg)`;
        });
        const end = () => {
          if (!dragging) return;
          dragging = false;
          if (moved >= 8) ignoreClickUntil = Date.now() + 260;
          if (axis === "x" && Math.abs(dx) > 70) {
            advanceCoach(dx < 0 ? 1 : -1);
          } else {
            top.classList.add("is-anim");
            top.style.transform = "";
          }
        };
        top.addEventListener("pointerup", end);
        top.addEventListener("pointercancel", end);
      }

      // Délégué : le deck est reconstruit à chaque carte, les cartes non.
      cdeck.addEventListener("click", (e) => {
        if (Date.now() < ignoreClickUntil) return;
        const btn = e.target.closest?.("[data-coach]");
        const c = btn && coach[Number(btn.getAttribute("data-coach"))];
        if (!c) return;
        haptic("select");
        openCoachSheet({
          title: c.h,
          fr: c.fr,
          tr: c.tr || null,
          rtl,
          icon: c.ic,
        });
      });
      cdeck.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") advanceCoach(-1);
        else if (e.key === "ArrowRight") advanceCoach(1);
        else return;
        e.preventDefault();
      });
      root
        .querySelectorAll("[data-cd]")
        .forEach((b) =>
          b.addEventListener("click", () =>
            advanceCoach(b.getAttribute("data-cd") === "next" ? 1 : -1),
          ),
        );
      buildCoachDeck();
    }
    // La fiche mène désormais DIRECTEMENT à la certification (décision Rayan,
    // 31/07/2026) : « Teste-toi » ouvrait un quiz de révision, qui proposait
    // ensuite un second quiz pour certifier — deux quiz d'affilée pour un
    // élève qui voulait juste avancer. Le quiz de révision reste joignable
    // depuis la quête du jour (deep-link `{code}:quiz`).
    root.querySelector("[data-certif-fiche]")?.addEventListener("click", () => {
      focusId = null;
      haptic("tap");
      // Acquise ou pas, le bouton mène au MÊME endroit. Avant, une compétence
      // déjà acquise renvoyait sur Mon permis : l'élève qui voulait juste
      // rejouer la mise en situation se retrouvait sur une page de suivi, sans
      // aucun moyen de revenir jouer (remonté par Rayan, 02/08/2026).
      // #/valider-seul sait quoi proposer selon l'état : certifier, ou
      // s'entraîner sans enjeu.
      track("revision_conduite_certif_go", {
        code: f.code,
        from: "fiche",
        acquise: estAcquise(f.code),
      });
      navigate(`#/valider-seul/${f.code}`);
    });

    // L'état de certification arrive après coup (lecture serveur non bloquante).
    // On le met en cache et on redessine : le libellé et la destination du
    // bouton sortent TOUS LES DEUX du cache, ils ne peuvent pas se contredire
    // même si la fiche se redessine entre-temps. Hors-ligne, le cache reste
    // vide → la certification demeure joignable, valider-seul sait dire
    // « déjà certifiée ».
    if (!CERT_CACHE.has(f.code)) {
      certState(f.code)
        .then(({ moniteur, certified }) => {
          CERT_CACHE.set(f.code, moniteur || certified);
          if (view === "fiche" && code === f.code) render();
        })
        .catch(() => {
          /* état indéterminé : on laisse la certification joignable */
        });
    }
  }

  async function startQuiz() {
    // Si cette compétence est un ciblage moniteur non fait (arrivée par le hero
    // « Réviser » en deep-link, ou par navigation normale), on la marquera faite
    // à la fin du quiz — même sans être passé par une liste de devoirs.
    if (!focusId) {
      const fx = focuses.find((x) => x.competence_code === code);
      if (fx) focusId = fx.id;
    }
    await Promise.all([
      ensureFiche(code),
      ensureQuiz(code),
      ensureFichesI18n(),
    ]);
    view = "quiz";
    render();
  }

  function renderQuiz() {
    const f = getFiche(code);
    const lang = getLang();
    const trF = ficheTr(code, lang); // { titre, quiz:[{q,options,explication}], … } | null
    // Chaque question reçoit sa traduction (premium-quiz affiche la trad + le FR
    // dessous ; sans `tr`, rendu FR d'origine). Ordre garanti = même que la source.
    let questions = quizByCode(code).map((q, i) =>
      trF && trF.quiz && trF.quiz[i] ? { ...q, tr: trF.quiz[i] } : q,
    );
    if (!questions.length) {
      view = "fiche";
      return render();
    }

    // ── Mode découverte : « Teste-toi » consomme aussi le quota de questions ──
    // (même compteur que #/quiz — 3 questions/jour). Épuisé → mur découverte ;
    // sinon on plafonne le nombre de questions au reste du quota.
    const meFt = getCurUser();
    if (isFreeTierUser(meFt)) {
      resetIfNewDay();
      const q = freeQuota("quiz");
      if (q.remaining <= 0) {
        track("freetier.quota_hit", { kind: "quiz" });
        return mountFreeTierWall(root, {
          me: meFt,
          reason: "quota",
          kind: "quiz",
        });
      }
      questions = questions.slice(0, Math.min(questions.length, q.remaining));
      consumeFree("quiz", null, questions.length);
    }

    track("revision_conduite_quiz_start", { code });
    mountPremiumQuiz(root, {
      questions,
      questHint: true, // ce quiz alimente la quête du jour (réussi = ≥70 %)
      title: (trF && trF.titre) || (f ? f.titre : "Quiz"),
      onExit: (good, total) => {
        markRevised(code);
        track("revision_conduite_quiz_done", { code, good, total });
        // Alimente la ligue Révision : +1 pt si ≥70% sur cette compétence.
        // Insertion directe (RLS : l'élève écrit les siens), type 'review' →
        // compté par get_theory_leaderboard (DISTINCT competence_id, score≥70).
        // On n'appelle PAS submit_competence_quiz ni self_validate_competence
        // ici : ces questions sont LOCALES, le juge officiel reste le quiz de
        // #/valider-seul (5 questions corrigées serveur). Ce quiz « Teste-toi »
        // ne fait qu'alimenter quête + ligue, puis PROPOSE la certification.
        const me = getCurUser();
        if (me?.id && total > 0) {
          // Cette ligne alimente la quête du jour (trigger advance_quest_quiz)
          // ET la ligue Révision : si l'insert rate en silence, l'élève « joue
          // pour rien ». On retente donc une fois avant d'abandonner.
          const attemptRow = {
            user_id: me.id,
            competence_id: code,
            type: "review",
            score: Math.round((good / total) * 100),
            questions_ids: [],
            answers_indices: [],
          };
          (async () => {
            for (let tryN = 0; tryN < 2; tryN++) {
              try {
                const { error } = await sb
                  .from("quiz_attempts")
                  .insert(attemptRow);
                if (!error) return;
                console.error("[revision-conduite] persist review", error);
              } catch (e) {
                console.error("[revision-conduite] persist review", e);
              }
              await new Promise((r) => setTimeout(r, 1500));
            }
          })();
        }
        if (focusId) {
          const fid = focusId;
          focusId = null;
          focuses = focuses.filter((x) => x.id !== fid);
          markFocusDone(fid);
        }
        // Pont vers la certification : quiz RÉUSSI (même seuil que le composant,
        // ≥70 %) → on propose de certifier la compétence dans Mon permis. Sinon,
        // retour au hub comme avant. Le pont récupère lui-même l'état (déjà
        // certifiée / validée moniteur) pour adapter son CTA.
        const passed = total > 0 && good >= Math.ceil(total * 0.7);
        if (passed) {
          showCertBridge(code, good, total);
          return;
        }
        view = "home";
        render();
      },
    });
  }

  // ── Pont Réviser → certification (pivot 17/07) ──────────────────────────
  // Récupère l'état de certification de la compétence puis affiche l'écran de
  // fin adapté. On NE valide RIEN ici : le bouton mène au quiz officiel de
  // #/valider-seul (juge serveur). Best-effort : si l'état est indéterminé, on
  // propose quand même la certification (le garde-fou serveur tranchera).
  async function certState(compId) {
    const me = getCurUser();
    if (!me?.id) return { moniteur: false, certified: false };
    try {
      const [vRes, sRes] = await Promise.allSettled([
        sb
          .from("validations")
          .select("statut")
          .eq("eleve_id", me.id)
          .eq("competence_id", compId)
          .maybeSingle(),
        sb
          .from("self_validations")
          .select("validated_at")
          .eq("eleve_id", me.id)
          .eq("competence_id", compId)
          .maybeSingle(),
      ]);
      return {
        moniteur:
          vRes.status === "fulfilled" && vRes.value.data?.statut === "acquis",
        certified: sRes.status === "fulfilled" && !!sRes.value.data,
      };
    } catch {
      return { moniteur: false, certified: false };
    }
  }

  async function showCertBridge(compId, good, total) {
    const { moniteur, certified } = await certState(compId);
    const f = getFiche(compId);
    const titre = f
      ? rvcFicheTitle(f)
      : rvcT("skill_fallback", "cette compétence");
    const done = moniteur || certified;
    track("revision_conduite_cert_bridge", { code: compId, done });

    const BOUCLIER = medallion("bouclier", "violet", { size: 88 });
    const CHECK = medallion("check", "violet", { size: 88 });

    if (done) {
      // Déjà certifiée par toi (ou validée par ton moniteur) : pas de nouvelle
      // certification à faire — juste un petit lien pour la revoir dans Mon permis.
      root.innerHTML = `${PONT_STYLE}<div class="pont anim-slide-up">
        <div class="pont-med">${CHECK}</div>
        <span class="pont-kick">${rvcText("cert_done_kicker", "Déjà dans Mon permis")}</span>
        <h1 class="pont-ttl">${rvcText("cert_done_title", "Déjà certifiée par toi")}</h1>
        <p class="pont-p">${rvcRich("cert_done_body", "« {title} » est déjà acquise dans ton parcours. Beau boulot. Continue à réviser quand tu veux.", { title: titre })}</p>
        <button class="pont-cta" data-continue type="button">${rvcText("cert_keep", "Continuer à réviser")}</button>
        <button class="pont-link" data-revoir type="button">${rvcText("cert_review", "Revoir dans Mon permis →")}</button>
      </div>`;
    } else {
      // Non certifiée : on propose de la certifier via le quiz officiel.
      root.innerHTML = `${PONT_STYLE}<div class="pont anim-slide-up">
        <div class="pont-med">${BOUCLIER}</div>
        <span class="pont-kick">${rvcText("quiz_passed", "Quiz réussi")}</span>
        <h1 class="pont-ttl">${rvcText("cert_prompt", "Prêt à certifier cette compétence ?")}</h1>
        <p class="pont-p">${rvcRich("cert_prompt_body", "Tu viens de réviser « {title} ». Certifie-la pour la faire avancer dans {product}. Cinq questions confirment que c'est acquis.", { title: titre, product: rvcT("my_licence", "Mon permis") })}</p>
        <button class="pont-cta" data-certify type="button">${rvcText("certify", "Certifier cette compétence")}</button>
        <button class="pont-ghost" data-continue type="button">${rvcText("later", "Plus tard")}</button>
      </div>`;
    }

    root.querySelector("[data-certify]")?.addEventListener("click", () => {
      haptic("tap");
      track("revision_conduite_cert_bridge_go", { code: compId });
      navigate(`#/valider-seul/${compId}`);
    });
    root.querySelector("[data-revoir]")?.addEventListener("click", () => {
      haptic("tap");
      navigate(`#/parcours?focus=${encodeURIComponent(compId)}`);
    });
    root.querySelector("[data-continue]")?.addEventListener("click", () => {
      haptic("select");
      view = "home";
      render();
    });
  }

  render();
}
