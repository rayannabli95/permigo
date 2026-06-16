// ═══════════════════════════════════════════════════════════════
// Élève — « Ton centre d'examen »
// Fiche par centre d'examen du permis B : difficulté, accès, pièges
// du parcours, conseils, FAQ. Contenu dans src/data/centres-examen.js.
//
// 💎 Futur module premium : flip CENTRES_PREMIUM_LOCKED à `true` le jour
//    où PermiGo+ élève est en place → la fiche se grise et propose l'achat.
//    Tant que c'est `false`, les fiches sont gratuites (pour donner envie).
// ═══════════════════════════════════════════════════════════════
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { track } from "@/services/analytics.js";
import {
  CENTRES_EXAMEN,
  getCentre,
  listCentres,
} from "@/data/centres-examen.js";

const CENTRES_PREMIUM_LOCKED = false;

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.ce {
  padding: 18px 16px calc(100px + env(safe-area-inset-bottom));
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', sans-serif;
}
@keyframes ceUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
.ce-card { animation: ceUp .35s cubic-bezier(.23,1,.32,1) both; }
.ce-card:nth-child(2){animation-delay:.05s}
.ce-card:nth-child(3){animation-delay:.10s}
.ce-card:nth-child(4){animation-delay:.15s}
.ce-card:nth-child(5){animation-delay:.20s}
@media (prefers-reduced-motion:reduce){ .ce-card{animation:none;opacity:1} }

/* ── Header ── */
.ce-hd { display:flex; align-items:center; gap:10px; margin-bottom:16px; padding-top:4px; }
.ce-hd-ico {
  width:40px; height:40px; background:var(--a); border-radius:12px;
  display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0;
}
.ce-hd-tit { font-size:20px; font-weight:800; letter-spacing:-.02em; line-height:1.1; }
.ce-hd-sub { font-size:13px; color:var(--mu2); margin-top:1px; }

/* ── Sélecteur centre ── */
.ce-chips { display:flex; gap:8px; overflow-x:auto; padding:2px 0 10px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
.ce-chips::-webkit-scrollbar { display:none; }
.ce-chip {
  flex:0 0 auto; min-height:44px; padding:10px 16px; border-radius:999px;
  border:1.5px solid var(--bo); background:var(--bg3); color:var(--ink);
  font-size:14px; font-weight:700; cursor:pointer; white-space:nowrap;
  transition:transform .12s, border-color .12s, background .12s;
}
.ce-chip:active { transform:scale(.95); }
.ce-chip.active { border-color:var(--a); background:var(--a); color:#fff; }
.ce-chip.soon { opacity:.55; cursor:default; font-weight:600; }

/* ── Cartes ── */
.ce-block {
  background:var(--bg3); border:1px solid var(--bo); border-radius:18px;
  padding:18px; margin-bottom:14px;
}
.ce-block-tit { font-size:16px; font-weight:800; letter-spacing:-.01em; margin:0 0 12px; display:flex; align-items:center; gap:8px; }

/* ── Hero centre ── */
.ce-hero { background:linear-gradient(135deg,var(--bg5),var(--bg3)); }
.ce-hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.ce-hero-nom { font-size:24px; font-weight:900; letter-spacing:-.02em; line-height:1.05; }
.ce-hero-dep { display:inline-flex; align-items:center; gap:5px; margin-top:6px; font-size:13px; font-weight:700; color:var(--mu2); }
.ce-hero-dep b { color:var(--ink); }
.ce-diff { text-align:right; flex-shrink:0; }
.ce-diff-dots { display:flex; gap:4px; justify-content:flex-end; }
.ce-dot { width:9px; height:9px; border-radius:50%; background:var(--bo); }
.ce-dot.on { background:var(--am); }
.ce-diff-lbl { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:var(--mu3); margin-top:6px; }
.ce-resume { font-size:14.5px; line-height:1.55; color:var(--ink5); margin:14px 0 0; }

/* ── Accès / adresse ── */
.ce-addr { display:flex; align-items:center; gap:10px; font-size:14px; font-weight:700; margin-bottom:12px; }
.ce-addr svg { color:var(--a); flex-shrink:0; }
.ce-acces-li { display:flex; gap:10px; align-items:flex-start; font-size:14px; line-height:1.45; color:var(--ink5); padding:7px 0; }
.ce-acces-li svg { color:var(--mu3); flex-shrink:0; margin-top:1px; }
.ce-maps {
  display:flex; align-items:center; justify-content:center; gap:8px;
  width:100%; min-height:46px; margin-top:12px; border-radius:12px;
  background:var(--a); color:#fff; font-size:15px; font-weight:800;
  text-decoration:none; transition:transform .12s, filter .12s;
}
.ce-maps:active { transform:scale(.98); filter:brightness(.96); }

/* ── Pièges ── */
.ce-piege { display:flex; gap:12px; padding:12px 0; border-top:1px solid var(--bo); }
.ce-piege:first-of-type { border-top:none; padding-top:0; }
.ce-piege-ico {
  width:38px; height:38px; border-radius:11px; flex-shrink:0;
  background:var(--amp); color:var(--amk);
  display:flex; align-items:center; justify-content:center;
}
.ce-piege-tit { font-size:15px; font-weight:800; margin-bottom:3px; }
.ce-piege-txt { font-size:13.5px; line-height:1.5; color:var(--ink5); }

/* ── Conseils ── */
.ce-tip { display:flex; gap:10px; align-items:flex-start; padding:8px 0; font-size:14px; line-height:1.5; color:var(--ink5); }
.ce-tip svg { color:var(--gr); flex-shrink:0; margin-top:2px; }

/* ── FAQ ── */
.ce-faq { border-top:1px solid var(--bo); }
.ce-faq[open] .ce-faq-q svg { transform:rotate(180deg); }
.ce-faq-q {
  list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between;
  gap:10px; padding:13px 0; font-size:14.5px; font-weight:700; min-height:44px;
}
.ce-faq-q::-webkit-details-marker { display:none; }
.ce-faq-q svg { color:var(--mu3); flex-shrink:0; transition:transform .2s; }
.ce-faq-a { font-size:13.5px; line-height:1.55; color:var(--ink5); padding:0 0 13px; }

/* ── Disclaimer ── */
.ce-note { font-size:12px; line-height:1.5; color:var(--mu3); text-align:center; margin-top:6px; padding:0 8px; }

/* ── Verrou premium ── */
.ce-lock { text-align:center; padding:28px 18px; }
.ce-lock-ico { width:56px; height:56px; border-radius:16px; background:var(--amp); color:var(--amk); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
.ce-lock-tit { font-size:18px; font-weight:900; letter-spacing:-.01em; }
.ce-lock-sub { font-size:14px; line-height:1.55; color:var(--ink5); margin:8px 0 16px; }
.ce-lock-cta { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:48px; padding:0 22px; border-radius:12px; background:var(--a); color:#fff; font-size:15px; font-weight:800; border:none; cursor:pointer; }
.ce-lock-cta:active { transform:scale(.98); }
</style>`;

// ─── Skeleton ────────────────────────────────────────────────────
function skeleton() {
  return `${STYLE}<div class="ce">
    <div class="ce-hd">
      <div class="ce-hd-ico">${icon("map", { size: 22 })}</div>
      <div><div class="ce-hd-tit">Ton centre d'examen</div></div>
    </div>
    <div class="ce-block ce-hero" style="height:160px"></div>
    <div class="ce-block" style="height:120px"></div>
  </div>`;
}

// ─── Render ──────────────────────────────────────────────────────
function diffDots(n) {
  let s = "";
  for (let i = 1; i <= 5; i++)
    s += `<span class="ce-dot${i <= n ? " on" : ""}"></span>`;
  return s;
}

function mapsUrl(c) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.mapsQuery)}`;
}

function renderChips(activeSlug) {
  const chips = listCentres()
    .map(
      (c) =>
        `<button class="ce-chip${c.slug === activeSlug ? " active" : ""}" data-slug="${esc(c.slug)}">${esc(c.nom)} <span style="opacity:.7">${esc(c.deptNum)}</span></button>`,
    )
    .join("");
  // Indice "autres centres à venir" — la promesse premium se construit ici.
  const soon = `<span class="ce-chip soon">Autres centres bientôt</span>`;
  return `<div class="ce-chips">${chips}${soon}</div>`;
}

function renderFiche(c) {
  return `
  <div class="ce-block ce-hero ce-card">
    <div class="ce-hero-top">
      <div>
        <div class="ce-hero-nom">${esc(c.nom)}</div>
        <div class="ce-hero-dep">${icon("map", { size: 14 })} <b>${esc(c.departement)}</b> · ${esc(c.deptNum)}</div>
      </div>
      <div class="ce-diff">
        <div class="ce-diff-dots">${diffDots(c.difficulte)}</div>
        <div class="ce-diff-lbl">${esc(c.difficulteLabel)}</div>
      </div>
    </div>
    <p class="ce-resume">${esc(c.resume)}</p>
  </div>

  <div class="ce-block ce-card">
    <div class="ce-addr">${icon("map", { size: 18 })} ${esc(c.adresse)}</div>
    ${c.acces
      .map(
        (a) =>
          `<div class="ce-acces-li">${icon(a.ico, { size: 17 })} <span>${esc(a.texte)}</span></div>`,
      )
      .join("")}
    <a class="ce-maps" href="${esc(mapsUrl(c))}" target="_blank" rel="noopener" data-act="maps">
      ${icon("compass", { size: 18 })} Voir sur la carte
    </a>
  </div>

  <div class="ce-block ce-card">
    <h2 class="ce-block-tit">${icon("alert-triangle", { size: 18 })} Les pièges à ${esc(c.nom)}</h2>
    ${c.pieges
      .map(
        (p) => `<div class="ce-piege">
          <div class="ce-piege-ico">${icon(p.ico, { size: 19 })}</div>
          <div><div class="ce-piege-tit">${esc(p.titre)}</div><div class="ce-piege-txt">${esc(p.texte)}</div></div>
        </div>`,
      )
      .join("")}
  </div>

  <div class="ce-block ce-card">
    <h2 class="ce-block-tit">${icon("target", { size: 18 })} Nos conseils</h2>
    ${c.conseils
      .map(
        (t) =>
          `<div class="ce-tip">${icon("check-circle", { size: 17 })} <span>${esc(t)}</span></div>`,
      )
      .join("")}
  </div>

  <div class="ce-block ce-card">
    <h2 class="ce-block-tit">${icon("message-circle", { size: 18 })} Questions fréquentes</h2>
    ${c.faq
      .map(
        (f) => `<details class="ce-faq">
          <summary class="ce-faq-q">${esc(f.q)} ${icon("chevron-down", { size: 18 })}</summary>
          <div class="ce-faq-a">${esc(f.r)}</div>
        </details>`,
      )
      .join("")}
  </div>

  <p class="ce-note">Infos données à titre indicatif pour t'aider à préparer. Vérifie toujours l'adresse exacte sur ta convocation officielle.</p>`;
}

function renderLocked(c) {
  return `
  <div class="ce-block ce-card ce-lock">
    <div class="ce-lock-ico">${icon("lock", { size: 26 })}</div>
    <div class="ce-lock-tit">Fiche centre — ${esc(c.nom)}</div>
    <div class="ce-lock-sub">Difficulté, pièges du parcours, conseils et FAQ de ton centre d'examen. Débloque les fiches centre avec PermiGo+.</div>
    <button class="ce-lock-cta" id="ce-unlock">${icon("sparkle", { size: 18 })} Débloquer</button>
  </div>`;
}

function template(activeSlug) {
  const c = getCentre(activeSlug) || CENTRES_EXAMEN[0];
  const body = CENTRES_PREMIUM_LOCKED ? renderLocked(c) : renderFiche(c);
  return `${STYLE}<div class="ce anim-slide-up">
    <div class="ce-hd">
      <div class="ce-hd-ico">${icon("map", { size: 22 })}</div>
      <div>
        <div class="ce-hd-tit">Ton centre d'examen</div>
        <div class="ce-hd-sub">Connais le terrain avant le jour J</div>
      </div>
    </div>
    ${renderChips(c.slug)}
    <div id="ce-fiche">${body}</div>
  </div>`;
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root, param) {
  const me = getCurUser();
  if (!me) {
    root.innerHTML = "<p>Non connecté</p>";
    return;
  }

  root.innerHTML = skeleton();

  // Slug depuis l'URL (#/centre-examen/cergy), sinon premier centre.
  let active = getCentre(param) ? param : CENTRES_EXAMEN[0].slug;

  track("page_view", {
    page: "centre-examen",
    centre: active,
    user_role: me.role,
  });

  root.innerHTML = template(active);
  wire(root, active);
}

function wire(root, active) {
  // Sélecteur de centre → re-render de la fiche sans reload.
  root.querySelectorAll(".ce-chip[data-slug]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slug = btn.dataset.slug;
      if (!slug || slug === active) return;
      active = slug;
      track("centre_examen_switch", { centre: slug });
      // Maj URL (deep-link) sans déclencher de navigation lourde.
      if (location.hash !== `#/centre-examen/${slug}`) {
        history.replaceState(null, "", `#/centre-examen/${slug}`);
      }
      root.innerHTML = template(active);
      wire(root, active);
    });
  });

  root.querySelector('[data-act="maps"]')?.addEventListener("click", () => {
    track("centre_examen_maps", { centre: active });
  });

  root.querySelectorAll(".ce-faq").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) track("centre_examen_faq_open", { centre: active });
    });
  });

  root.querySelector("#ce-unlock")?.addEventListener("click", () => {
    track("centre_examen_unlock_click", { centre: active });
    location.hash = "#/boutique";
  });
}
