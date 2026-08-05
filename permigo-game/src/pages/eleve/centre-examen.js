// ═══════════════════════════════════════════════════════════════
// Élève — « Ton centre d'examen » — Variant A (CINÉMATIQUE / PREMIUM)
// Réécriture visuelle drop-in : aucun autre fichier modifié.
//
// Direction : hero teinté par la difficulté (vert→ambre→rouge),
// jauge animée en cascade, reveals au scroll, FAQ accordéon fluide,
// cartes pièges avec glow, sélecteur chips premium.
// ═══════════════════════════════════════════════════════════════
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { track } from "@/services/analytics.js";
import {
  CENTRES_EXAMEN,
  getCentre,
  listCentres,
} from "@/data/centres-examen.js";
import { haptic } from "@/utils/haptic.js";
import { setupReveals } from "@/utils/reveal-on-scroll.js";
import { navigate } from "@/router.js";
import { getFicheMeta } from "@/data/conduite-meta.js";
import { getLang } from "@/utils/lang.js";
import { chromeNight } from "@/utils/chrome-night.js";
import {
  isFreeTierUser,
  isFreeCentre,
  FREE_CENTRE,
} from "@/utils/free-tier.js";

const CENTRES_PREMIUM_LOCKED = false;

// L'élève en mode découverte lit UN centre en entier, les autres chips sont
// cadenassées. ⚠️ Le routeur mure déjà `#/centre-examen/{autre-slug}`, mais le
// sélecteur de centre ne passe PAS par le routeur : il fait un replaceState et
// re-rend la page sur place. Sans ce garde-fou, deux clics dans les chips
// ouvraient les 30 fiches payantes.
let _gated = false;

// ── i18n de la COQUE (les données propres à chaque centre restent dans
// data/centres-examen.js). Dict local, repli FR systématique.
const I18N = {
  en: {
    difficulty: "Difficulty",
    other_centres: "More centres coming soon",
    read_more: "Details",
    read_less: "Collapse",
    access_title: "Access and address",
    open_map: "Open in Maps",
    traps_title: "Pitfalls at {name}",
    revise_title: "Revise your driving for {name}",
    revise_intro: "The actions that make a difference in this area.",
    revise_link: "Revise →",
    revise_aria: "Revise the pitfalls at {name}",
    revise_btn: "🎯 Revise the pitfalls at {name}",
    targeted_quiz: "Targeted quiz · 15 questions",
    advice_title: "Our advice",
    faq_title: "Frequently asked questions",
    info_note:
      "This information may change. Check the exact address on your official exam notice.",
    locked_title: "Centre guide. {name}",
    locked_sub:
      "Difficulty, route pitfalls, advice and FAQs for your exam centre. Unlock the guides with PermiGo+.",
    route_pitfalls: "Route pitfalls",
    targeted_advice: "Targeted advice",
    centre_faq: "Centre FAQ",
    unlock: "Unlock PermiGo+",
    page_title: "Your exam centre",
    page_subtitle: "Know the area before exam day",
    centre_guide: "Centre guide",
    login: "Log in to view your centre.",
  },
  ar: {
    difficulty: "الصعوبة",
    other_centres: "مراكز أخرى قريبًا",
    read_more: "التفاصيل",
    read_less: "طيّ",
    access_title: "الوصول والعنوان",
    open_map: "فتح في الخرائط",
    traps_title: "مطبّات مركز {name}",
    revise_title: "راجع قيادتك استعدادًا لمركز {name}",
    revise_intro: "التصرفات التي تصنع الفارق في هذه المنطقة.",
    revise_link: "راجع ←",
    revise_aria: "راجع مطبّات مركز {name}",
    revise_btn: "🎯 راجع مطبّات مركز {name}",
    targeted_quiz: "اختبار موجّه · 15 سؤالًا",
    advice_title: "نصائحنا",
    faq_title: "الأسئلة الشائعة",
    info_note:
      "قد تتغيّر هذه المعلومات. تحقّق من العنوان الدقيق في استدعائك الرسمي للامتحان.",
    locked_title: "بطاقة المركز. {name}",
    locked_sub:
      "الصعوبة ومطبّات المسار والنصائح والأسئلة الشائعة لمركز امتحانك. افتح البطاقات مع PermiGo+.",
    route_pitfalls: "مطبّات المسار",
    targeted_advice: "نصائح موجّهة",
    centre_faq: "أسئلة المركز",
    unlock: "فتح PermiGo+",
    page_title: "مركز امتحانك",
    page_subtitle: "تعرّف إلى المكان قبل يوم الامتحان",
    centre_guide: "بطاقة المركز",
    login: "سجّل الدخول لعرض مركزك.",
  },
};
function t(key, fr) {
  const lang = getLang();
  return (lang !== "fr" && I18N[lang]?.[key]) || fr;
}
function rtl(html) {
  return getLang() === "ar" ? `<span dir="rtl">${html}</span>` : html;
}
function txt(key, fr) {
  return rtl(esc(t(key, fr)));
}
function format(key, fr, values) {
  let value = t(key, fr);
  Object.entries(values).forEach(([name, replacement]) => {
    value = value.replace(`{${name}}`, replacement);
  });
  return value;
}

// Pont « centre → révision conduite » : relie les quizTags d'un centre aux
// fiches de révision de CONDUITE correspondantes (codes REMC).
const TAG_TO_CODES = {
  rond_point: ["C2f"],
  giratoire: ["C2f"],
  intersection: ["C2f"],
  priorite: ["C2f"],
  cycliste: ["C3g"],
  pieton: ["C3g"],
  angle_mort: ["C3g"],
  bus: ["C3g"],
  partage: ["C3g"],
  ville: ["C3g"],
  vitesse: ["C2b"],
  allure: ["C2b"],
  depassement: ["C2e"],
  croisement: ["C2e"],
  insertion: ["C3e"],
  autoroute: ["C3e"],
  voie_rapide: ["C3e"],
  nuit: ["C3a"],
  pluie: ["C3b"],
  meteo: ["C3b"],
  manoeuvre: ["C1h"],
  creneau: ["C1h"],
  stationnement: ["C1h"],
  autonomie: ["C2h"],
};

function centreFiches(c) {
  const codes = [];
  (c.quizTags || []).forEach((tag) =>
    (TAG_TO_CODES[tag] || []).forEach((code) => {
      if (!codes.includes(code)) codes.push(code);
    }),
  );
  return codes.map((code) => getFicheMeta(code)).filter(Boolean);
}

// ─── Couleur de difficulté (1-5) ─────────────────────────────
// Vert clair (1) → ambre (3) → rouge (5)
function diffColor(n) {
  if (n <= 1) return { h: "145deg", s: "60%", l: "42%", name: "vert" };
  if (n === 2) return { h: "160deg", s: "55%", l: "38%", name: "vert" };
  if (n === 3) return { h: "38deg", s: "88%", l: "46%", name: "ambre" };
  if (n === 4) return { h: "22deg", s: "90%", l: "48%", name: "orange" };
  return { h: "0deg", s: "78%", l: "50%", name: "rouge" };
}

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ─────────────────────────────────────────────────
   CEA — Centre d'examen, DA Arène (nuit-violet + or)
   Tout préfixé .cea- pour zéro collision.

   ⚠️ Cette page vivait en BLANC avec un gros aplat moutarde en hero, au milieu
   d'un produit qui est en Arène 3D (cf. reviser.js). Retour Rayan 05/08/2026 :
   « les centres d'exam sont pas sur la même DA que PermiGo ».

   ⚠️⚠️ ZÉRO BACKTICK dans ce commentaire : il vit DANS un template littéral,
   un seul backtick le referme et le build casse (« is not a function »).

   Le geste : on garde TOUTE la structure et on repeint, en redéfinissant les
   tokens de thème SUR .cea (bloc ci-dessous). Chaque règle plus bas continue
   d'écrire var(--bg3) / var(--bo) / var(--ink) et atterrit dans la nuit. C'est
   pour ça qu'il ne faut PAS remplacer ces var() par des couleurs en dur : la
   page se re-peindrait à la main, règle par règle, et le prochain qui touche
   une couleur en oublierait la moitié.

   Palette : la même que l'Arène de Réviser, au pixel près.
───────────────────────────────────────────────── */
${chromeNight("#241a52", "#1a1340")}

.cea {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 calc(110px + env(safe-area-inset-bottom));
  font-family: 'Archivo', sans-serif;
  position: relative;

  /* ── Les tokens de la page, repeints en nuit ── */
  --bg:   #1a1340;                    /* fond de page */
  --bg3:  linear-gradient(180deg,#2c2264 0%,#241a56 100%);  /* carte */
  --su:   linear-gradient(180deg,#2c2264 0%,#241a56 100%);  /* idem (rangées) */
  --bo:   #3a3178;                    /* bord de carte / séparateur */
  --bo2:  #3a3178;
  --ink:  #f4f2ff;                    /* titres */
  --mu:   rgba(244,242,255,.72);      /* corps de texte */
  --mu2:  rgba(244,242,255,.58);      /* secondaire */
  --mu3:  rgba(244,242,255,.42);      /* icônes discrètes */
  --a:    #6c63ff;                    /* accent plein (boutons, chip active) */
  --a-ink:#fff;
  --a-txt:#b3adff;                    /* accent LISIBLE sur fond nuit */
  --am:   #f0aa2c;                    /* ambre des pièges */
  --amp:  rgba(245,196,81,.14);
  --amk:  #f7cf68;
  --gr:   #4ade80;                    /* vert des conseils */

  color: var(--ink);
  /* Le fond couvre toute la hauteur même quand la fiche est courte : sans ça
     on voyait le blanc de l'app réapparaître sous le dernier bloc. */
  min-height: 100%;
  background:
    radial-gradient(120% 45% at 50% 0%, rgba(142,135,255,.16) 0%, transparent 60%),
    linear-gradient(180deg,#241a52 0%,#1e1648 46%,#1a1340 100%);
}

/* ── Reveal au scroll ── */
.cea .reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity .5s cubic-bezier(.23,1,.32,1), transform .5s cubic-bezier(.23,1,.32,1);
}
.cea .reveal.revealed {
  opacity: 1;
  transform: none;
}
/* stagger automatique via nth-child */
.cea .reveal:nth-child(2) { transition-delay: .06s; }
.cea .reveal:nth-child(3) { transition-delay: .12s; }
.cea .reveal:nth-child(4) { transition-delay: .18s; }
.cea .reveal:nth-child(5) { transition-delay: .24s; }
.cea .reveal:nth-child(6) { transition-delay: .30s; }
@media (prefers-reduced-motion: reduce) {
  .cea .reveal { opacity: 1; transform: none; transition: none; }
}

/* ── Page header ── */
.cea-hd {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px 8px;
}
.cea-hd-ico {
  width: 42px; height: 42px;
  border-radius: 13px;
  background: var(--a);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--a) 45%, transparent);
}
.cea-hd-tit {
  font: 800 20px/1.1 'Archivo', sans-serif;
  letter-spacing: -.025em;
  color: var(--ink);
}
.cea-hd-sub {
  font: 500 12px/1.3 'Archivo', sans-serif;
  color: var(--mu2);
  margin-top: 2px;
}
/* Badge « Fiche centre » premium */
.cea-badge-premium {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font: 800 9px/1 'Archivo', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--a-txt);
  background: color-mix(in srgb, var(--a) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--a) 25%, transparent);
  margin-top: 5px;
}

/* ── Sélecteur chips segmenté ── */
.cea-chips-wrap {
  padding: 6px 16px 0;
  position: relative;
}
.cea-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0 12px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  scroll-snap-type: x mandatory;
}
.cea-chips::-webkit-scrollbar { display: none; }
.cea-chip {
  flex: 0 0 auto;
  scroll-snap-align: start;
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1.5px solid var(--bo);
  background: var(--bg3);
  color: var(--ink);
  font: 700 13px/1 'Archivo', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: transform .14s cubic-bezier(.23,1,.32,1),
              border-color .16s,
              background .16s,
              box-shadow .16s;
  -webkit-tap-highlight-color: transparent;
}
.cea-chip:active { transform: scale(.93); }
.cea-chip.active {
  border-color: var(--a);
  background: var(--a);
  color: var(--a-ink);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--a) 38%, transparent);
}
/* sur la puce active, le n° de département (span opacity:.65) doit rester lisible
   sur fond accent → opacité pleine, sinon le blend tombe sous 4.5:1 (a11y) */
.cea-chip.active span { opacity: 1 !important; }
/* Découverte : chip d'un centre payant. Assez visible pour donner envie, assez
   discrète pour qu'on voie tout de suite laquelle est ouverte. Pas d'opacité
   sous .7 : le nom du centre est justement l'argument. */
.cea-chip.locked {
  opacity: .78;
  border-style: dashed;
}
.cea-chip.soon {
  opacity: .5;
  cursor: default;
  font-weight: 600;
  pointer-events: none;
}

/* ── Hero cinématique centre ── */
.cea-hero {
  margin: 6px 12px 0;
  border-radius: 22px;
  position: relative;
  overflow: hidden;
  padding: 22px 20px 20px;
  /* La teinte de difficulté vient d'une variable injectée inline (heroBg) */
  background: var(--cea-hero-bg, linear-gradient(180deg,#2c2264 0%,#241a56 100%));
  border: 1px solid var(--bo);
  box-shadow: 0 18px 38px -20px rgba(6,2,22,.9);
}
/* Shimmer / sheen premium — bande lumineuse qui défile */
.cea-hero::after {
  content: '';
  position: absolute;
  top: -60%;
  left: -80%;
  width: 60%;
  height: 220%;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255,255,255,.06) 45%,
    rgba(255,255,255,.12) 50%,
    rgba(255,255,255,.06) 55%,
    transparent 100%
  );
  pointer-events: none;
  animation: ceaSheen 4s ease-in-out 1s infinite;
}
@keyframes ceaSheen {
  0%   { left: -80%; opacity: 0; }
  10%  { opacity: 1; }
  60%  { left: 160%; opacity: 1; }
  65%  { opacity: 0; }
  100% { left: 160%; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .cea-hero::after { animation: none; } }

/* Grain texture sur le hero */
.cea-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: .04;
  mix-blend-mode: overlay;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.cea-hero-inner { position: relative; z-index: 1; }

/* Badge département */
.cea-hero-dept {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font: 700 11px/1 'Archivo', sans-serif;
  letter-spacing: .05em;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  color: rgba(255,255,255,.85);
  margin-bottom: 12px;
  backdrop-filter: blur(4px);
}

/* Nom du centre — entrée animée */
.cea-hero-nom {
  font: 900 clamp(24px,7vw,32px)/1.05 'Archivo', sans-serif;
  letter-spacing: -.03em;
  color: #fff;
  margin-bottom: 14px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .5s .15s cubic-bezier(.23,1,.32,1),
              transform .5s .15s cubic-bezier(.23,1,.32,1);
}
.cea-hero.in .cea-hero-nom {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .cea-hero-nom { opacity: 1; transform: none; transition: none; }
}

/* Difficulté — jauge segments */
.cea-diff-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.cea-diff-label {
  font: 800 10px/1 'Archivo', sans-serif;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(255,255,255,.55);
  white-space: nowrap;
}
.cea-diff-gauge {
  display: flex;
  gap: 5px;
  flex: 1;
}
.cea-diff-seg {
  flex: 1;
  height: 5px;
  border-radius: 999px;
  background: rgba(255,255,255,.15);
  overflow: hidden;
}
/* Rempli via JS : on anime un fill intérieur */
.cea-diff-seg-fill {
  height: 100%;
  width: 0%;
  border-radius: 999px;
  background: var(--cea-diff-color, rgba(255,255,255,.8));
  transition: width .45s cubic-bezier(.34,1.56,.64,1);
}
.cea-diff-val {
  font: 900 12px/1 'IBM Plex Mono', monospace;
  color: rgba(255,255,255,.8);
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .cea-diff-seg-fill { transition: none; }
}

/* Résumé */
.cea-hero-resume {
  font: 500 14px/1.6 'Archivo', sans-serif;
  color: rgba(255,255,255,.72);
  margin: 0;
}

/* ── Section (carte blanche) ── */
.cea-section {
  margin: 10px 12px 0;
  background: var(--bg3);
  border: 1px solid var(--bo);
  border-radius: 20px;
  padding: 18px;
  overflow: hidden;
}
.cea-section-tit {
  font: 800 15px/1.2 'Archivo', sans-serif;
  letter-spacing: -.01em;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
}
.cea-section-tit svg { color: var(--a-txt); flex-shrink: 0; }

/* ── Adresse / accès ── */
.cea-addr-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 12px;
  font: 700 14px/1.3 'Archivo', sans-serif;
  color: var(--ink);
  border-bottom: 1px solid var(--bo);
  margin-bottom: 12px;
}
.cea-addr-row svg { color: var(--a-txt); flex-shrink: 0; }
.cea-acces-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 7px 0;
  font: 500 13.5px/1.5 'Archivo', sans-serif;
  color: var(--mu);
}
.cea-acces-item svg { color: var(--mu3); flex-shrink: 0; margin-top: 2px; }

/* Bouton carte premium */
.cea-maps-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  margin-top: 14px;
  border-radius: 14px;
  background: var(--a);
  color: var(--a-ink);
  font: 800 15px/1 'Archivo', sans-serif;
  text-decoration: none;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--a) 38%, transparent);
  transition: transform .12s cubic-bezier(.23,1,.32,1),
              filter .12s,
              box-shadow .12s;
  -webkit-tap-highlight-color: transparent;
}
.cea-maps-btn:active {
  transform: scale(.97);
  filter: brightness(.95);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--a) 25%, transparent);
}

/* ── Pièges — cartes premium ── */
.cea-rev-intro { font-size:13px; line-height:1.5; color:var(--mu2,#64748b); margin:0 0 10px; }
.cea-rev-row { display:flex; align-items:center; justify-content:space-between; gap:10px; text-decoration:none; background:var(--su,#fff); border:1px solid var(--bo2,#e2e8f0); border-radius:12px; padding:13px 14px; margin-bottom:8px; }
.cea-rev-row:active { transform: scale(0.99); }
.cea-rev-t { font:700 14px/1.25 'Archivo',sans-serif; color:var(--ink,#0f172a); }
.cea-rev-go { font:700 13px 'Archivo',sans-serif; color:var(--a,#6366f1); white-space:nowrap; }
.cea-pieges-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.cea-piege {
  display: flex;
  gap: 13px;
  padding: 14px 0;
  border-bottom: 1px solid var(--bo);
  position: relative;
  transition: background .12s;
  -webkit-tap-highlight-color: transparent;
}
.cea-piege:last-child { border-bottom: none; padding-bottom: 2px; }
.cea-piege:first-child { padding-top: 2px; }
/* Glow hover subtil sur mobile (press state) */
.cea-piege:active { background: color-mix(in srgb, var(--amp) 30%, transparent); border-radius: 12px; }

.cea-piege-ico {
  width: 42px; height: 42px;
  border-radius: 13px;
  flex-shrink: 0;
  background: var(--amp);
  color: var(--amk);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--am) 25%, transparent);
  transition: transform .14s cubic-bezier(.23,1,.32,1), box-shadow .14s;
}
.cea-piege:active .cea-piege-ico {
  transform: scale(.9);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--am) 15%, transparent);
}
.cea-piege-body { flex: 1; min-width: 0; }
.cea-piege-tit {
  font: 800 14.5px/1.2 'Archivo', sans-serif;
  color: var(--ink);
  margin-bottom: 4px;
}
.cea-piege-txt {
  font: 500 13px/1.55 'Archivo', sans-serif;
  color: var(--mu);
}

/* ── Conseils ── */
.cea-tip {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 9px 0;
  font: 500 13.5px/1.5 'Archivo', sans-serif;
  color: var(--mu);
  border-bottom: 1px solid var(--bo);
}
.cea-tip:last-child { border-bottom: none; padding-bottom: 2px; }
.cea-tip:first-child { padding-top: 2px; }
.cea-tip-ico {
  width: 22px; height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--gr) 15%, transparent);
  color: var(--gr);
  display: flex; align-items: center; justify-content: center;
  margin-top: 1px;
}

/* ── FAQ accordéon fluide ── */
.cea-faq-item {
  border-bottom: 1px solid var(--bo);
  overflow: hidden;
}
.cea-faq-item:last-child { border-bottom: none; }
.cea-faq-q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  font: 700 14px/1.35 'Archivo', sans-serif;
  color: var(--ink);
  cursor: pointer;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.cea-faq-chev {
  flex-shrink: 0;
  color: var(--mu3);
  transition: transform .28s cubic-bezier(.23,1,.32,1);
  display: flex;
}
.cea-faq-item.open .cea-faq-chev { transform: rotate(180deg); }
.cea-faq-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height .38s cubic-bezier(.23,1,.32,1);
}
.cea-faq-body-inner {
  padding: 0 0 14px;
  font: 500 13.5px/1.6 'Archivo', sans-serif;
  color: var(--mu);
}
@media (prefers-reduced-motion: reduce) {
  .cea-faq-chev { transition: none; }
  .cea-faq-body { transition: none; }
}

/* ── Verrou premium ── */
.cea-lock-wrap {
  margin: 10px 12px 0;
}
.cea-lock {
  text-align: center;
  padding: 36px 24px;
  background: var(--bg3);
  border: 1px solid var(--bo);
  border-radius: 22px;
  position: relative;
  overflow: hidden;
}
/* Halo derrière le cadenas */
.cea-lock::before {
  content: '';
  position: absolute;
  top: 30%;
  left: 50%;
  width: 200px; height: 200px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, color-mix(in srgb, var(--a) 18%, transparent) 0%, transparent 70%);
  pointer-events: none;
  animation: ceaLockHalo 3s ease-in-out infinite;
}
@keyframes ceaLockHalo {
  0%,100% { transform: translate(-50%,-50%) scale(.85); opacity: .7; }
  50%     { transform: translate(-50%,-50%) scale(1.15); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .cea-lock::before { animation: none; }
}
.cea-lock-ico {
  width: 64px; height: 64px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--a) 14%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--a) 28%, transparent);
  color: var(--a-txt);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  position: relative;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--a) 22%, transparent);
}
.cea-lock-badge {
  position: absolute;
  top: -6px; right: -6px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--am);
  display: flex; align-items: center; justify-content: center;
  font: 900 9px/1 'Archivo', sans-serif;
  color: #fff;
  box-shadow: 0 2px 8px rgba(245,158,11,.5);
  animation: ceaLockBadge 1.6s ease-in-out infinite;
}
@keyframes ceaLockBadge {
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.2); }
}
@media (prefers-reduced-motion: reduce) {
  .cea-lock-badge { animation: none; }
}
.cea-lock-tit {
  font: 900 20px/1.2 'Archivo', sans-serif;
  letter-spacing: -.02em;
  color: var(--ink);
  margin-bottom: 8px;
}
.cea-lock-sub {
  font: 500 14px/1.6 'Archivo', sans-serif;
  color: var(--mu);
  margin: 0 auto 20px;
  max-width: 320px;
}
/* Chips "bénéfices" */
.cea-lock-perks {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 22px;
}
.cea-lock-perk {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 999px;
  font: 700 12px/1 'Archivo', sans-serif;
  background: var(--bg5, var(--bg2));
  color: var(--ink);
  border: 1px solid var(--bo);
}
.cea-lock-perk svg { color: var(--a-txt); }
.cea-lock-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 52px;
  padding: 0 28px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--adk, #4f46e5), var(--a));
  color: #fff;
  font: 800 16px/1 'Archivo', sans-serif;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 22px color-mix(in srgb, var(--a) 42%, transparent);
  transition: transform .12s cubic-bezier(.23,1,.32,1),
              filter .12s,
              box-shadow .12s;
  -webkit-tap-highlight-color: transparent;
}
.cea-lock-cta:active {
  transform: scale(.97);
  filter: brightness(.95);
  box-shadow: 0 3px 12px color-mix(in srgb, var(--a) 28%, transparent);
}

/* ── Note bas de page ── */
.cea-note {
  font: 500 11.5px/1.55 'Archivo', sans-serif;
  color: var(--mu3);
  text-align: center;
  padding: 14px 20px 0;
}

/* ── Skeleton ── */
.cea-skel-block {
  margin: 10px 12px 0;
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(90deg, var(--bg2) 0%, var(--bo) 50%, var(--bg2) 100%);
  background-size: 200% 100%;
  animation: ceaSkim 1.4s ease-in-out infinite;
}
@keyframes ceaSkim { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) {
  .cea-skel-block { animation: none; background: var(--bg2); }
}

/* ── Bouton « Révise pour ton centre » ── */
.cea-revise-wrap {
  margin: 10px 12px 0;
}
.cea-revise-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 56px;
  border-radius: 18px;
  border: none;
  cursor: pointer;
  font: 800 16px/1.1 'Archivo', sans-serif;
  letter-spacing: -.01em;
  color: #fff;
  /* Gradient or/ambre premium cohérent avec le style cinématique */
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  box-shadow: 0 6px 24px rgba(245, 158, 11, 0.40);
  transition: transform .13s cubic-bezier(.23,1,.32,1),
              filter .13s,
              box-shadow .13s;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow: hidden;
}
.cea-revise-btn::after {
  content: '';
  position: absolute;
  top: -60%; left: -70%;
  width: 50%; height: 220%;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255,255,255,.08) 45%,
    rgba(255,255,255,.16) 50%,
    rgba(255,255,255,.08) 55%,
    transparent 100%
  );
  pointer-events: none;
  animation: ceaReviseSheen 3.5s ease-in-out 0.8s infinite;
}
@keyframes ceaReviseSheen {
  0%   { left: -70%; opacity: 0; }
  10%  { opacity: 1; }
  60%  { left: 140%; opacity: 1; }
  65%  { opacity: 0; }
  100% { left: 140%; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .cea-revise-btn::after { animation: none; } }
.cea-revise-btn:active {
  transform: scale(.97);
  filter: brightness(.93);
  box-shadow: 0 3px 12px rgba(245, 158, 11, 0.28);
}
.cea-revise-sub {
  font: 500 12px/1 'Archivo', sans-serif;
  color: var(--mu2);
  text-align: center;
  margin: 6px 0 0;
}

/* ── Lire l'essentiel, déplier le reste ──
   Le bouton est volontairement discret : c'est une sortie de secours pour qui
   veut tout lire, pas un appel à l'action. La porte de la page reste
   « Révise les pièges de X ». */
.cea-plus {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 9px;
  padding: 7px 12px 7px 13px;
  min-height: 34px;
  border-radius: 999px;
  border: 1px solid var(--bo);
  background: rgba(255,255,255,.04);
  color: var(--a-txt);
  font: 800 11.5px/1 'Archivo', sans-serif;
  letter-spacing: .04em;
  text-transform: uppercase;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s cubic-bezier(.23,1,.32,1), background .16s;
}
.cea-plus:active { transform: scale(.95); }
.cea-plus svg { transition: transform .28s cubic-bezier(.23,1,.32,1); }
.cea-plus[aria-expanded="true"] { background: rgba(255,255,255,.09); }
/* 90deg et pas 180 : l'icône « chevron » pointe à DROITE au repos, la tourner
   d'un demi-tour la ferait pointer à gauche (= retour en arrière). */
.cea-plus[aria-expanded="true"] svg { transform: rotate(90deg); }
.cea-hero-resume-rest .cea-hero-resume,
.cea-piege-rest { margin-top: 9px; }
.cea-piege-rest {
  font: 500 13px/1.55 'Archivo', sans-serif;
  color: var(--mu);
}

/* ── Accès en chips ──
   Avant : trois lignes de 90 caractères empilées, dont l'élève ne lit que le
   premier mot (« RER A », « Métro 5 »). C'est donc ce premier mot qui devient
   la chip, et la ligne complète s'ouvre dessous quand il la touche. */
.cea-acces-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 2px;
}
.cea-acces-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid var(--bo);
  background: rgba(255,255,255,.05);
  color: var(--ink);
  font: 700 13px/1 'Archivo', sans-serif;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s cubic-bezier(.23,1,.32,1), background .16s, border-color .16s;
}
.cea-acces-chip svg { color: var(--a-txt); }
.cea-acces-chip:active { transform: scale(.94); }
.cea-acces-chip[aria-expanded="true"] {
  background: var(--a);
  border-color: var(--a);
  color: var(--a-ink);
}
.cea-acces-chip[aria-expanded="true"] svg { color: var(--a-ink); }
.cea-acces-detail {
  font: 500 13.5px/1.55 'Archivo', sans-serif;
  color: var(--mu);
  margin: 10px 0 0;
}
@media (prefers-reduced-motion: reduce) {
  .cea-plus, .cea-plus svg, .cea-acces-chip { transition: none; }
}
</style>`;

// ─── Helpers couleur difficulté ──────────────────────────────
function diffCss(c, alpha = 1) {
  return `hsl(${c.h} ${c.s} ${c.l} / ${alpha})`;
}

// ─── Couper un texte éditorial en « ce qu'on lit » / « le reste » ───
//
// La fiche empilait des pavés : 5 lignes de résumé, puis 3 pièges de 4 lignes
// chacun, puis 4 conseils, puis 5 questions. Personne ne lit ça sur un
// téléphone. Retour Rayan 05/08/2026 : « réduit le texte à l'essentiel, fais
// une belle mise en forme qu'on veut lire ».
//
// ⚠️ On ne SUPPRIME rien : les 21 fiches sont du contenu éditorial original,
// écrit à la main, et il porte le SEO. On le HIÉRARCHISE. La première phrase
// se lit tout de suite, le reste se déplie d'un geste. « L'essentiel » c'est
// ce qu'on VOIT, pas ce qui reste dans le fichier.
//
// Découpe sur le premier point suivi d'une majuscule (ou fin de chaîne). Pas
// sur n'importe quel point : « 6 à 8 ronds-points. » et « A15 / N184 » en
// contiennent, et « M. Dupont » aussi.
function splitLead(texte) {
  const t = String(texte || "").trim();
  const m = t.match(/^(.{20,190}?[.!?])\s+(?=[A-ZÀÂÉÈÊÎÔÙÜÇ«])/);
  if (!m) return { lead: t, rest: "" };
  return { lead: m[1], rest: t.slice(m[0].length).trim() };
}

// Un pavé éditorial rendu en « première phrase + Le détail ».
function renderPlie(texte, cls) {
  const { lead, rest } = splitLead(texte);
  if (!rest) return `<p class="cea-${cls}">${esc(lead)}</p>`;
  return `<p class="cea-${cls}">${esc(lead)}</p>
    <div class="cea-${cls}-rest" hidden><p class="cea-${cls}">${esc(rest)}</p></div>
    <button class="cea-plus" type="button" data-plus aria-expanded="false">
      <span>${txt("read_more", "Le détail")}</span>${icon("chevron", { size: 14 })}
    </button>`;
}

// Étiquette courte d'un moyen d'accès, pour la chip.
//
// Les 21 fiches suivent toutes la même écriture : « RER A. Arrêt … »,
// « Métro ligne 5. Stations … », « En voiture : axes A15 / N184, … ». On prend
// donc ce qui précède le premier point ou deux-points. Si ça ne matche pas (une
// fiche écrite autrement plus tard), on se replie sur les premiers mots plutôt
// que de rendre une chip vide.
function accesChip(texte) {
  const t = String(texte || "").trim();
  const m = t.match(/^([^.:]{2,26})\s*[.:]/);
  const brut = m ? m[1] : t.split(/\s+/).slice(0, 3).join(" ");
  // « En voiture : … » → « Voiture ». La majuscule est remise à la main : sans
  // elle la chip affichait « voiture » en minuscule à côté de « RER A ».
  const court = brut.replace(/^En\s+/i, "").trim();
  return court.charAt(0).toUpperCase() + court.slice(1);
}

// Le hero est une CARTE DE L'ARÈNE, pas un aplat de couleur.
//
// Avant : la difficulté peignait tout le bloc, du sol au plafond. À 3/5 ça
// donnait une dalle moutarde de 400 px au milieu d'une app nuit-violet, et le
// résumé se lisait en doré sur doré. La difficulté reste lisible — c'est la
// JAUGE qui la porte, plus une teinte de 8 % en haut de la carte. Un seul objet
// coloré au lieu d'un mur.
function heroBg(c) {
  const teinte = diffCss(c, 0.16);
  return `radial-gradient(120% 70% at 50% 0%, ${teinte} 0%, transparent 62%),
          linear-gradient(180deg, #2c2264 0%, #241a56 100%)`;
}

// ─── Jauge de difficulté (HTML) ──────────────────────────────
function diffGauge(n, label, colCss) {
  const segs = Array.from(
    { length: 5 },
    (_, i) =>
      `<div class="cea-diff-seg">
       <div class="cea-diff-seg-fill" data-filled="${i < n ? "1" : "0"}"></div>
     </div>`,
  ).join("");
  return `
  <div class="cea-diff-wrap">
    <span class="cea-diff-label">${txt("difficulty", "Difficulté")}</span>
    <div class="cea-diff-gauge" style="--cea-diff-color:${colCss}">${segs}</div>
    <span class="cea-diff-val">${n}/5</span>
  </div>`;
}

// ─── Maps URL ────────────────────────────────────────────────
function mapsUrl(c) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.mapsQuery)}`;
}

// ─── Chips sélecteur ─────────────────────────────────────────
function renderChips(activeSlug) {
  const chips = listCentres()
    .map((c) => {
      // Découverte : le centre offert reste cliquable, les autres deviennent
      // une invitation à débloquer. On garde le NOM lisible plutôt qu'un chip
      // grisé anonyme : l'élève doit voir ce qu'il y a derrière le cadenas.
      const locked = _gated && !isFreeCentre(c.slug);
      const attr = locked
        ? `data-lock="${escAttr(c.slug)}"`
        : `data-slug="${escAttr(c.slug)}"`;
      const mark = locked
        ? `<span style="opacity:.8">${icon("lock", { size: 12 })}</span> `
        : "";
      return `<button class="cea-chip${c.slug === activeSlug ? " active" : ""}${locked ? " locked" : ""}" ${attr} type="button">
           ${mark}${esc(c.nom)} <span style="opacity:.65;font-weight:600">${esc(c.deptNum)}</span>
         </button>`;
    })
    .join("");
  const soon = `<span class="cea-chip soon">${icon("plus", { size: 13 })} ${txt("other_centres", "Autres centres bientôt")}</span>`;
  return `<div class="cea-chips-wrap"><div class="cea-chips">${chips}${soon}</div></div>`;
}

// ─── Fiche pleine ────────────────────────────────────────────
function renderFiche(c) {
  const col = diffColor(c.difficulte);
  const colCss = diffCss(col);

  const heroCss = `--cea-hero-bg: ${heroBg(col)};`;

  return `
  <!-- HERO -->
  <div class="cea-hero reveal" style="${heroCss}">
    <div class="cea-hero-inner">
      <div class="cea-hero-dept">
        ${icon("map-pin", { size: 12 })} ${esc(c.departement)} &nbsp;·&nbsp; ${esc(c.deptNum)}
      </div>
      <h1 class="cea-hero-nom">${esc(c.nom)}</h1>
      ${diffGauge(c.difficulte, c.difficulteLabel, colCss)}
      ${renderPlie(c.resume, "hero-resume")}
    </div>
  </div>

  <!-- ACCÈS — chips : le moyen de transport d'abord, le détail au clic -->
  <div class="cea-section reveal">
    <h2 class="cea-section-tit">${icon("map-pin", { size: 17 })} ${txt("access_title", "Accès et adresse")}</h2>
    <div class="cea-addr-row">${icon("map-pin", { size: 17 })} ${esc(c.adresse)}</div>
    <div class="cea-acces-chips">
      ${c.acces
        .map(
          (a, i) =>
            `<button class="cea-acces-chip" type="button" data-acces="${i}" aria-expanded="false">
               ${icon(a.ico, { size: 14 })} ${esc(accesChip(a.texte))}
             </button>`,
        )
        .join("")}
    </div>
    ${c.acces
      .map(
        (a, i) =>
          `<p class="cea-acces-detail" data-acces-detail="${i}" hidden>${esc(a.texte)}</p>`,
      )
      .join("")}
    <a class="cea-maps-btn" href="${escAttr(mapsUrl(c))}" target="_blank" rel="noopener" data-act="maps">
      ${icon("compass", { size: 18 })} ${txt("open_map", "Ouvrir dans le plan")}
    </a>
  </div>

  <!-- PIÈGES — le titre et la phrase qui pique, le reste au clic -->
  <div class="cea-section reveal">
    <h2 class="cea-section-tit">${icon("alert-triangle", { size: 17 })} ${rtl(esc(format("traps_title", "Les pièges à {name}", { name: c.nom })))}</h2>
    <div class="cea-pieges-list">
      ${c.pieges
        .map((p) => {
          const { lead, rest } = splitLead(p.texte);
          return `
        <div class="cea-piege">
          <div class="cea-piege-ico">${icon(p.ico, { size: 20 })}</div>
          <div class="cea-piege-body">
            <div class="cea-piege-tit">${esc(p.titre)}</div>
            <div class="cea-piege-txt">${esc(lead)}</div>
            ${
              rest
                ? `<div class="cea-piege-rest" hidden>${esc(rest)}</div>
                   <button class="cea-plus" type="button" data-plus aria-expanded="false">
                     <span>${txt("read_more", "Le détail")}</span>${icon("chevron", { size: 14 })}
                   </button>`
                : ""
            }
          </div>
        </div>`;
        })
        .join("")}
    </div>
  </div>

  <!-- RÉVISION CONDUITE PAR CENTRE (le geste, relié aux pièges du secteur) -->
  ${
    centreFiches(c).length
      ? `<div class="cea-section reveal">
    <h2 class="cea-section-tit">${icon("car", { size: 17 })} ${rtl(esc(format("revise_title", "Révise ta conduite pour {name}", { name: c.nom })))}</h2>
    <p class="cea-rev-intro">${txt("revise_intro", "Les gestes qui font la différence sur ce secteur.")}</p>
    ${centreFiches(c)
      .map(
        (f) =>
          `<a class="cea-rev-row" href="#/revision-conduite/${escAttr(f.code)}"><span class="cea-rev-t">${esc(f.titre)}</span><span class="cea-rev-go">${txt("revise_link", "Réviser →")}</span></a>`,
      )
      .join("")}
  </div>`
      : ""
  }

  <!-- BOUTON RÉVISION CENTRE (seulement si des thèmes sont mappés) -->
  ${
    c.quizTags?.length
      ? `<div class="cea-revise-wrap reveal">
    <button class="cea-revise-btn" id="cea-revise" type="button"
      aria-label="${escAttr(format("revise_aria", "Réviser les pièges de {name}", { name: c.nom }))}">
      ${rtl(esc(format("revise_btn", "🎯 Révise les pièges de {name}", { name: c.nom })))}
    </button>
    <p class="cea-revise-sub">${txt("targeted_quiz", "Quiz ciblé · 15 questions")}</p>
  </div>`
      : ""
  }

  <!-- CONSEILS -->
  <div class="cea-section reveal">
    <h2 class="cea-section-tit">${icon("target", { size: 17 })} ${txt("advice_title", "Nos conseils")}</h2>
    ${c.conseils
      .map(
        (t) => `<div class="cea-tip">
          <span class="cea-tip-ico">${icon("check", { size: 13 })}</span>
          <span>${esc(t)}</span>
        </div>`,
      )
      .join("")}
  </div>

  <!-- FAQ -->
  <div class="cea-section reveal">
    <h2 class="cea-section-tit">${icon("message-circle", { size: 17 })} ${txt("faq_title", "Questions fréquentes")}</h2>
    ${c.faq
      .map(
        (f, idx) => `
      <div class="cea-faq-item" data-faq="${idx}">
        <button class="cea-faq-q" type="button" aria-expanded="false">
          <span>${esc(f.q)}</span>
          <span class="cea-faq-chev">${icon("chevron-down", { size: 18 })}</span>
        </button>
        <div class="cea-faq-body" role="region">
          <div class="cea-faq-body-inner">${esc(f.r)}</div>
        </div>
      </div>`,
      )
      .join("")}
  </div>

  <p class="cea-note">${txt("info_note", "Ces infos peuvent changer. Vérifie l’adresse exacte sur ta convocation officielle.")}</p>`;
}

// ─── Écran verrou premium ────────────────────────────────────
function renderLocked(c) {
  return `
  <div class="cea-lock-wrap">
    <div class="cea-lock reveal">
      <div class="cea-lock-ico">
        ${icon("lock", { size: 28 })}
        <span class="cea-lock-badge">${icon("sparkle", { size: 10 })}</span>
      </div>
      <div class="cea-lock-tit">${rtl(esc(format("locked_title", "Fiche centre. {name}", { name: c.nom })))}</div>
      <p class="cea-lock-sub">${txt("locked_sub", "Difficulté, pièges du parcours, conseils et FAQ de ton centre d’examen. Débloque les fiches avec PermiGo+.")}</p>
      <div class="cea-lock-perks">
        <span class="cea-lock-perk">${icon("alert-triangle", { size: 13 })} ${txt("route_pitfalls", "Pièges du parcours")}</span>
        <span class="cea-lock-perk">${icon("target", { size: 13 })} ${txt("targeted_advice", "Conseils ciblés")}</span>
        <span class="cea-lock-perk">${icon("message-circle", { size: 13 })} ${txt("centre_faq", "FAQ du centre")}</span>
      </div>
      <button class="cea-lock-cta" id="cea-unlock" type="button">
        ${icon("sparkle", { size: 18 })} ${txt("unlock", "Débloquer PermiGo+")}
      </button>
    </div>
  </div>`;
}

// ─── Template complet ────────────────────────────────────────
function template(activeSlug) {
  const c = getCentre(activeSlug) || CENTRES_EXAMEN[0];
  const body = CENTRES_PREMIUM_LOCKED ? renderLocked(c) : renderFiche(c);

  return `${STYLE}
<div class="cea anim-slide-up">
  <!-- En-tête page -->
  <div class="cea-hd">
    <div class="cea-hd-ico">${icon("map", { size: 22 })}</div>
    <div>
      <div class="cea-hd-tit">${txt("page_title", "Ton centre d’examen")}</div>
      <div class="cea-hd-sub">${txt("page_subtitle", "Connais le terrain avant le jour J")}</div>
      <div class="cea-badge-premium">${icon("map-pin", { size: 10 })} ${txt("centre_guide", "Fiche centre")}</div>
    </div>
  </div>

  <!-- Sélecteur de centre -->
  ${renderChips(c.slug)}

  <!-- Corps (fiche ou lock) -->
  <div id="cea-fiche">${body}</div>
</div>`;
}

// ─── Skeleton ────────────────────────────────────────────────
function skeleton() {
  return `${STYLE}
<div class="cea">
  <div class="cea-hd">
    <div class="cea-hd-ico">${icon("map", { size: 22 })}</div>
    <div><div class="cea-hd-tit">${txt("page_title", "Ton centre d’examen")}</div></div>
  </div>
  <div class="cea-chips-wrap"><div class="cea-chips" style="gap:8px">
    ${[120, 100, 90].map((w) => `<div class="cea-skel-block" style="width:${w}px;height:44px;border-radius:999px;flex-shrink:0;margin:0"></div>`).join("")}
  </div></div>
  <div class="cea-skel-block" style="height:220px"></div>
  <div class="cea-skel-block" style="height:140px"></div>
</div>`;
}

// ─── Animation : jauge + hero entry ─────────────────────────
function animateHero(root) {
  // Entrée du nom (délai microtask pour forcer la transition CSS)
  requestAnimationFrame(() => {
    root.querySelector(".cea-hero")?.classList.add("in");
  });

  // Remplissage des segments de difficulté en cascade
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll(".cea-diff-seg-fill").forEach((seg, i) => {
    const filled = seg.dataset.filled === "1";
    if (reduced) {
      seg.style.width = filled ? "100%" : "0%";
    } else {
      setTimeout(
        () => {
          seg.style.width = filled ? "100%" : "0%";
        },
        180 + i * 90,
      );
    }
  });
}

// ─── FAQ accordéon fluide ────────────────────────────────────
function wireAccordion(root, activeSlug) {
  root.querySelectorAll(".cea-faq-item").forEach((item) => {
    const btn = item.querySelector(".cea-faq-q");
    const body = item.querySelector(".cea-faq-body");
    if (!btn || !body) return;

    btn.addEventListener("click", () => {
      haptic("tap");
      const isOpen = item.classList.contains("open");

      // Ferme les autres
      root.querySelectorAll(".cea-faq-item.open").forEach((other) => {
        if (other !== item) {
          other.classList.remove("open");
          other.querySelector(".cea-faq-body").style.maxHeight = "0px";
          other
            .querySelector(".cea-faq-q")
            ?.setAttribute("aria-expanded", "false");
        }
      });

      if (isOpen) {
        item.classList.remove("open");
        body.style.maxHeight = "0px";
        btn.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("open");
        body.style.maxHeight = body.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
        track("centre_examen_faq_open", { centre: activeSlug });
      }
    });
  });
}

// ─── Mount ───────────────────────────────────────────────────
export async function mount(root, param) {
  const me = getCurUser();
  if (!me) {
    root.innerHTML = `<p style="padding:24px;color:var(--mu)">${txt("login", "Connecte-toi pour voir ton centre.")}</p>`;
    return;
  }

  root.innerHTML = skeleton();

  _gated = isFreeTierUser(me);

  let active = getCentre(param) ? param : CENTRES_EXAMEN[0].slug;
  // Filet : le routeur ne laisse déjà passer que le centre offert en découverte,
  // mais mount() est aussi appelé par le sélecteur et par un retour arrière.
  if (_gated && !isFreeCentre(active)) active = FREE_CENTRE;

  track("page_view", {
    page: "centre-examen",
    centre: active,
    user_role: me.role,
    gated: _gated,
  });

  root.innerHTML = template(active);
  animateHero(root);
  setupReveals(root);
  wire(root, active);
}

// ─── Wire ────────────────────────────────────────────────────
function wire(root, active) {
  // Sélecteur de centre
  root.querySelectorAll(".cea-chip[data-slug]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slug = btn.dataset.slug;
      if (!slug || slug === active) return;
      haptic("select");
      active = slug;
      track("centre_examen_switch", { centre: slug });
      if (location.hash !== `#/centre-examen/${slug}`) {
        history.replaceState(null, "", `#/centre-examen/${slug}`);
      }
      root.innerHTML = template(active);
      animateHero(root);
      setupReveals(root);
      wire(root, active);
    });
  });

  // Découverte : chip d'un centre payant → le mur, avec le nom du centre dans
  // l'événement. C'est le meilleur signal d'intention d'achat de la page : il a
  // lu une fiche en entier et il en veut une autre.
  root.querySelectorAll(".cea-chip[data-lock]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      haptic("select");
      track("centre_examen_locked_click", { centre: btn.dataset.lock });
      const { mount: mountWall } = await import("@/pages/eleve/pass-requis.js");
      await mountWall(root, getCurUser());
    });
  });

  // Bouton carte
  root.querySelector('[data-act="maps"]')?.addEventListener("click", () => {
    haptic("tap");
    track("centre_examen_maps", { centre: active });
  });

  // Accordéon FAQ
  wireAccordion(root, active);

  // « Le détail » — déplie le pavé qu'on avait replié (résumé, piège).
  // Le bloc caché est le frère JUSTE AVANT le bouton : c'est ce que renderPlie
  // et le rendu des pièges produisent tous les deux, donc une seule règle suffit
  // pour les deux endroits.
  root.querySelectorAll("[data-plus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const bloc = btn.previousElementSibling;
      if (!bloc) return;
      const ouvert = btn.getAttribute("aria-expanded") === "true";
      bloc.hidden = ouvert;
      btn.setAttribute("aria-expanded", ouvert ? "false" : "true");
      btn.querySelector("span").textContent = ouvert
        ? txt("read_more", "Le détail")
        : txt("read_less", "Replier");
      haptic("tap");
      if (!ouvert) track("centre_examen_detail_open", { centre: active });
    });
  });

  // Chips d'accès — une seule ouverte à la fois : deux détails côte à côte
  // reformaient le pavé qu'on vient de défaire.
  root.querySelectorAll("[data-acces]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const i = chip.dataset.acces;
      const deja = chip.getAttribute("aria-expanded") === "true";
      root.querySelectorAll("[data-acces]").forEach((c2) => {
        c2.setAttribute("aria-expanded", "false");
      });
      root.querySelectorAll("[data-acces-detail]").forEach((d) => {
        d.hidden = true;
      });
      if (!deja) {
        chip.setAttribute("aria-expanded", "true");
        const d = root.querySelector(`[data-acces-detail="${i}"]`);
        if (d) d.hidden = false;
      }
      haptic("select");
    });
  });

  // Bouton « Révise les pièges de <centre> »
  root.querySelector("#cea-revise")?.addEventListener("click", () => {
    haptic("select");
    track("centre_examen_revise_click", { centre: active });
    navigate(`/exam-blanc/c-${active}`);
  });

  // Verrou premium
  root.querySelector("#cea-unlock")?.addEventListener("click", () => {
    haptic("select");
    track("centre_examen_unlock_click", { centre: active });
    location.hash = "#/boutique";
  });
}
