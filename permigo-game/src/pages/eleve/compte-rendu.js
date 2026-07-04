// ═══════════════════════════════════════════════════════════════
// Compte-rendu de leçon — réception côté élève
// Route : #/compte-rendu/:id
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { toast } from "@/components/common/toast.js";
import { navigate } from "@/router.js";
import { labelComp } from "@/utils/remc-label.js";
import { REMC_TOTAL } from "@/data/remc.js";
import { icon } from "@/utils/icons.js";
import { medStatus } from "@/utils/medallions.js";

// ─── CSS scoped ────────────────────────────────────────────────
const STYLE = `<style>
.cr {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 100px);
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--ink);
  min-height: 100dvh;
}

/* ── Header ── */
.cr-hd {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 20;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.cr-back {
  width: 36px; height: 36px;
  border-radius: 8px; border: 1px solid var(--bo);
  background: var(--su); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--ink); padding: 0;
  transition: background .12s; position: relative;
}
.cr-back::before { content: ''; position: absolute; inset: -4px; }
.cr-back:active { background: var(--bg); }
.cr-hd-title {
  font: 800 16px/1.2 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.02em; color: var(--ink); flex: 1;
}

/* ── Hero ── */
.cr-hero {
  margin: 16px 16px 0;
  padding: 20px;
  background: color-mix(in srgb, var(--a) 8%, var(--su));
  border: 1px solid color-mix(in srgb, var(--a) 18%, transparent);
  border-radius: 20px;
  box-shadow: 0 8px 24px -12px color-mix(in srgb, var(--a) 22%, transparent);
}
.cr-hero-kicker {
  font: 700 11px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .07em; text-transform: uppercase;
  color: var(--a-txt); margin-bottom: 8px;
}
.cr-hero-title {
  font: 800 22px/1.15 'Fredoka', 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.01em; color: var(--ink); margin: 0 0 4px;
}
.cr-hero-sub {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--mu); margin: 0;
}

/* ── Barre de progression ── */
.cr-prog {
  margin: 14px 16px 0;
  padding: 14px 16px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 16px;
}
.cr-prog-row {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 8px;
}
.cr-prog-label {
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink);
}
.cr-prog-count {
  font: 800 15px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--a-txt);
}
.cr-prog-track {
  height: 8px; background: color-mix(in srgb, var(--a) 14%, var(--bo));
  border-radius: 99px; overflow: hidden;
}
.cr-prog-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--a), color-mix(in srgb, var(--a) 80%, #fff));
  border-radius: 99px;
  transition: width .6s cubic-bezier(.22,1,.36,1);
}

/* ── Sections compétences ── */
.cr-section {
  margin: 14px 16px 0;
}
.cr-section-title {
  font: 700 12px/1 'Inter', sans-serif;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--mu2); margin: 0 0 8px 2px;
}
.cr-comp-list {
  display: flex; flex-direction: column; gap: 8px;
}
.cr-comp-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 14px;
  font: 600 14px/1.3 'Inter', sans-serif;
  color: var(--ink);
}
.cr-comp-ico {
  width: 32px; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.cr-comp-code {
  font: 700 10.5px/1 'IBM Plex Mono', monospace;
  color: var(--mu2); margin-top: 2px;
}

/* ── Note du moniteur ── */
.cr-note {
  margin: 14px 16px 0;
  padding: 16px;
  background: color-mix(in srgb, var(--a) 6%, var(--su));
  border: 1px solid color-mix(in srgb, var(--a) 16%, transparent);
  border-radius: 16px;
}
.cr-note-label {
  font: 700 11px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .07em; text-transform: uppercase;
  color: var(--a-txt); margin-bottom: 8px;
}
.cr-note-body {
  font: 500 14px/1.55 'Inter', sans-serif; color: var(--ink);
  white-space: pre-wrap; word-break: break-word;
}

/* ── CTAs ── */
.cr-cta-primary {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: calc(100% - 32px); margin: 20px 16px 0;
  padding: 17px;
  border: none; border-radius: 18px; cursor: pointer;
  font: 800 17px/1 'Plus Jakarta Sans', sans-serif; color: #fff;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--a) 88%, #fff) 0%,
    var(--a) 50%,
    var(--adk) 100%);
  box-shadow: 0 6px 0 var(--adk), 0 14px 26px -6px color-mix(in srgb, var(--a) 42%, transparent);
  -webkit-tap-highlight-color: transparent;
  transition: transform .09s, box-shadow .09s;
  min-height: 54px;
}
.cr-cta-primary:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 var(--adk), 0 6px 14px -6px color-mix(in srgb, var(--a) 30%, transparent);
}
.cr-cta-secondary {
  display: flex; align-items: center; justify-content: center;
  width: calc(100% - 32px); margin: 10px 16px 0;
  padding: 14px;
  border: 1.5px solid var(--bo); border-radius: 14px; cursor: pointer;
  font: 600 15px/1 'Inter', sans-serif; color: var(--mu);
  background: transparent; min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.cr-cta-secondary:active { background: var(--bg); }

/* ── Skeleton ── */
@keyframes crShim {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
.cr-skel {
  background: linear-gradient(90deg, var(--bg3, #f0f0f4) 0%, var(--bo, #e4e4eb) 50%, var(--bg3, #f0f0f4) 100%);
  background-size: 200% 100%;
  animation: crShim 1.4s ease-in-out infinite;
  border-radius: 14px;
}
</style>`;

// ─── Skeleton ──────────────────────────────────────────────────
function renderSkeleton() {
  return `${STYLE}
<div class="cr anim-slide-up">
  <div class="cr-hd">
    <button class="cr-back" id="cr-back-skel" aria-label="Retour">
      ${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}
    </button>
    <div class="cr-hd-title">Compte-rendu</div>
  </div>
  <div style="margin:16px;display:flex;flex-direction:column;gap:12px">
    <div class="cr-skel" style="height:108px"></div>
    <div class="cr-skel" style="height:72px"></div>
    <div class="cr-skel" style="height:120px"></div>
    <div class="cr-skel" style="height:88px"></div>
  </div>
</div>`;
}

// ─── Format date FR ────────────────────────────────────────────
function fmtDateFR(iso) {
  if (!iso) return "";
  // session_date est un DATE SQL (yyyy-mm-dd) : on le parse en LOCAL (et non
  // via new Date(iso) qui le lirait en UTC → décalage possible d'un jour).
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  const dt = y && m && d ? new Date(y, m - 1, d) : new Date(iso);
  return dt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Render ────────────────────────────────────────────────────
function renderPage(cr) {
  const dateStr = fmtDateFR(cr.session_date);
  const total = cr.total_acquis ?? 0;
  const pct = REMC_TOTAL > 0 ? Math.round((total / REMC_TOTAL) * 100) : 0;

  const acquis = cr.acquis || [];
  const retravailler = cr.a_retravailler || [];
  const enCours = cr.en_cours || [];

  function compItem(code, type) {
    const nom = labelComp(code);
    // Même grammaire de statut que le livret moniteur (médaillons 3D).
    const status =
      { acquis: "acquis", a_retravailler: "retravailler" }[type] || "encours";
    return `
      <div class="cr-comp-item">
        <div class="cr-comp-ico" aria-hidden="true">${medStatus(status, { size: 26 })}</div>
        <div>
          <div>${esc(nom)}</div>
          <div class="cr-comp-code">${esc(code)}</div>
        </div>
      </div>`;
  }

  const acquisHtml = acquis.length
    ? `<div class="cr-section">
        <div class="cr-section-title">Validé</div>
        <div class="cr-comp-list">${acquis.map((c) => compItem(c, "acquis")).join("")}</div>
      </div>`
    : "";

  const retrHtml = retravailler.length
    ? `<div class="cr-section">
        <div class="cr-section-title">A retravailler</div>
        <div class="cr-comp-list">${retravailler.map((c) => compItem(c, "a_retravailler")).join("")}</div>
      </div>`
    : "";

  const enCoursHtml = enCours.length
    ? `<div class="cr-section">
        <div class="cr-section-title">En cours</div>
        <div class="cr-comp-list">${enCours.map((c) => compItem(c, "en_cours")).join("")}</div>
      </div>`
    : "";

  const noteHtml = cr.note
    ? `<div class="cr-note">
        <div class="cr-note-label">Note de ton moniteur</div>
        <div class="cr-note-body">${esc(cr.note)}</div>
      </div>`
    : "";

  return `${STYLE}
<div class="cr anim-slide-up">
  <div class="cr-hd">
    <button class="cr-back" id="cr-back" aria-label="Retour">
      ${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}
    </button>
    <div class="cr-hd-title">Compte-rendu</div>
  </div>

  <div class="cr-hero">
    <div class="cr-hero-kicker">De la part de ton moniteur</div>
    <h1 class="cr-hero-title">Compte-rendu de ta leçon</h1>
    <p class="cr-hero-sub">${esc(dateStr)}</p>
  </div>

  <div class="cr-prog">
    <div class="cr-prog-row">
      <span class="cr-prog-label">Progression globale</span>
      <span class="cr-prog-count">${esc(String(total))} / ${esc(String(REMC_TOTAL))}</span>
    </div>
    <div class="cr-prog-track">
      <div class="cr-prog-fill" style="width:${esc(String(pct))}%"></div>
    </div>
  </div>

  ${acquisHtml}
  ${retrHtml}
  ${enCoursHtml}
  ${noteHtml}

  <button class="cr-cta-primary" id="cr-cta-parcours" type="button">
    Voir mon itinéraire ${icon("arrow-right", { size: 18, strokeWidth: 2.5 })}
  </button>
  <button class="cr-cta-secondary" id="cr-cta-retour" type="button">
    Retour à l'accueil
  </button>
</div>`;
}

// ─── Wire ──────────────────────────────────────────────────────
function wire(root) {
  root
    .querySelector("#cr-cta-parcours")
    ?.addEventListener("click", () => navigate("#/parcours"));
  root
    .querySelector("#cr-cta-retour")
    ?.addEventListener("click", () => navigate("#/"));
  root
    .querySelector("#cr-back")
    ?.addEventListener("click", () => navigate("#/"));
}

// ─── Mount ─────────────────────────────────────────────────────
export async function mount(root, id) {
  const me = getCurUser();
  if (!me) return;

  track("page.view", { page: "compte-rendu", role: me.role });

  // Skeleton immédiat
  root.innerHTML = renderSkeleton();
  root
    .querySelector("#cr-back-skel")
    ?.addEventListener("click", () => navigate("#/"));

  if (!id) {
    toast("Compte-rendu introuvable", "error");
    navigate("#/parcours");
    return;
  }

  // Chargement
  const { data, error } = await sb
    .from("comptes_rendus")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    toast("Impossible de charger ce compte-rendu", "error");
    navigate("#/parcours");
    return;
  }

  // Marquer comme lu (best-effort)
  sb.rpc("mark_compte_rendu_read", { p_id: id }).catch(() => {});

  root.innerHTML = renderPage(data);
  wire(root);
}
