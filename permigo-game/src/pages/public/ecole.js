// ═══════════════════════════════════════════════════════════════
// Page publique — Présentation auto-école
// Route : #/ecole/{slug}  (accès sans auth)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { getCurUser } from "@/auth/cur-user.js";

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
  .ec {
    max-width: 640px;
    margin: 0 auto;
    background: var(--ink);
    font-family: 'Inter', sans-serif;
    color: var(--bg4);
    min-height: 100dvh;
    padding-bottom: 80px;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Hero ── */
  .ec-hero {
    position: relative;
    overflow: hidden;
    padding: 56px 24px 48px;
    text-align: center;
  }
  .ec-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--a) 30%, transparent) 0%, transparent 70%);
    pointer-events: none;
  }
  .ec-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: color-mix(in srgb, var(--a) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--a) 30%, transparent);
    border-radius: 99px;
    padding: 5px 14px;
    font: 600 11px/1 'Inter', sans-serif;
    color: var(--al);
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .ec-hero-title {
    font: 900 36px/1.1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    letter-spacing: -.04em;
    margin: 0 0 12px;
  }
  .ec-hero-ville {
    display: inline-flex; align-items: center; gap: 6px;
    font: 500 15px/1 'Inter', sans-serif;
    color: var(--mu3);
    margin-bottom: 28px;
  }
  .ec-hero-kpis {
    display: flex; gap: 12px; justify-content: center;
    flex-wrap: wrap;
  }
  .ec-hero-kpi {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 16px;
    padding: 14px 20px;
    text-align: center;
    min-width: 80px;
  }
  .ec-kpi-val {
    font: 800 24px/1 'IBM Plex Mono', monospace;
    color: #fff;
    letter-spacing: -.02em;
  }
  .ec-kpi-lbl {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu3);
    margin-top: 6px;
    text-transform: uppercase;
    letter-spacing: .06em;
  }

  /* ── Section ── */
  .ec-section { padding: 0 20px; margin-bottom: 32px; }
  .ec-section-title {
    font: 700 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--mu4);
    margin: 0 0 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .ec-section-title::after {
    content: '';
    flex: 1; height: 1px;
    background: rgba(255,255,255,.06);
  }

  /* ── Features ── */
  .ec-features {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ec-feature {
    background: var(--ink);
    border: 1px solid var(--ink4);
    border-radius: 18px;
    padding: 18px 16px;
    position: relative;
    overflow: hidden;
  }
  .ec-feature::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--f-color, var(--a));
    opacity: .6;
  }
  .ec-feature-ico { font-size: 24px; margin-bottom: 10px; display: block; }
  .ec-feature-title {
    font: 700 13px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--bo3);
    margin: 0 0 4px;
  }
  .ec-feature-sub {
    font: 500 11px/1.4 'Inter', sans-serif;
    color: var(--mu4);
  }

  /* ── Moniteurs ── */
  .ec-moniteurs {
    display: flex; flex-direction: column; gap: 10px;
  }
  .ec-moniteur {
    display: flex; align-items: center; gap: 14px;
    background: var(--ink);
    border: 1px solid var(--ink4);
    border-radius: 18px;
    padding: 16px;
    animation: ecCardIn .4s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes ecCardIn {
    from { opacity: 0; transform: translateY(10px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ec-mon-av {
    width: 44px; height: 44px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .ec-mon-info { flex: 1; min-width: 0; }
  .ec-mon-name {
    font: 600 14px/1.2 'Inter', sans-serif;
    color: var(--bo3);
    margin-bottom: 3px;
  }
  .ec-mon-tag {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--a-txt);
    background: color-mix(in srgb, var(--a) 12%, transparent);
    padding: 3px 8px;
    border-radius: 99px;
    display: inline-block;
  }

  /* ── Témoignages ── */
  .ec-temoignages {
    display: flex; flex-direction: column; gap: 12px;
  }
  .ec-temoignage {
    background: var(--ink);
    border: 1px solid var(--ink4);
    border-radius: 18px;
    padding: 18px 20px;
    position: relative;
  }
  .ec-temoignage::before {
    content: '"';
    position: absolute; top: 12px; left: 16px;
    font-size: 40px; line-height: 1;
    color: color-mix(in srgb, var(--a) 30%, transparent);
    font-family: Georgia, serif;
  }
  .ec-temo-text {
    font: 500 13px/1.6 'Inter', sans-serif;
    color: var(--bo4);
    padding-top: 14px;
    margin-bottom: 12px;
  }
  .ec-temo-author {
    display: flex; align-items: center; gap: 8px;
  }
  .ec-temo-av {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 700 10px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .ec-temo-name {
    font: 600 12px/1 'Inter', sans-serif;
    color: var(--mu2);
  }
  .ec-temo-stars {
    margin-left: auto;
    color: var(--aml2);
    font-size: 12px;
    letter-spacing: 1px;
  }

  /* ── CTA ── */
  .ec-cta {
    margin: 0 20px;
    background: var(--a);
    border-radius: 24px;
    padding: 28px 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .ec-cta::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 60% at 30% 30%, rgba(255,255,255,.12) 0%, transparent 60%);
  }
  .ec-cta-title {
    font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    letter-spacing: -.02em;
    margin: 0 0 8px;
    position: relative;
  }
  .ec-cta-sub {
    font: 500 13px/1.5 'Inter', sans-serif;
    color: rgba(255,255,255,.8);
    margin: 0 0 22px;
    position: relative;
  }
  .ec-cta-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fff;
    color: var(--adk);
    border: none;
    border-radius: 14px;
    padding: 16px 28px;
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    position: relative;
    transition: transform .12s, box-shadow .12s;
    box-shadow: 0 4px 16px rgba(0,0,0,.2);
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }
  .ec-cta-btn:active { transform: scale(.96); box-shadow: none; }

  /* ── Skeleton ── */
  .ec-skel {
    background: linear-gradient(90deg, var(--ink) 0%, #1a2236 50%, var(--ink) 100%);
    background-size: 200% 100%;
    animation: ecShim 1.6s ease-in-out infinite;
    border-radius: 16px;
  }
  @keyframes ecShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  /* ── Error ── */
  .ec-err {
    padding: 80px 24px;
    text-align: center;
    color: var(--mu4);
  }
  .ec-err-ico { font-size: 48px; margin-bottom: 16px; }
  .ec-err-title {
    font: 700 18px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--bo4);
    margin-bottom: 8px;
  }
  .ec-err-sub {
    font: 500 13px/1.5 'Inter', sans-serif;
    color: var(--mu4);
  }
</style>`;

const AVATARS_GRAD = [
  "linear-gradient(135deg,#5b5bd6,#3a3a8e)",
  "linear-gradient(135deg,var(--blk),#155e75)",
  "linear-gradient(135deg,var(--puk),#4c1d95)",
  "linear-gradient(135deg,#0e7c66,#064e3b)",
  "linear-gradient(135deg,var(--rdk),#7f1d1d)",
  "linear-gradient(135deg,#a16207,#713f12)",
];

// Mock témoignages (données fictives MVP)
const TEMOIGNAGES = [
  {
    initials: "LM",
    grad: AVATARS_GRAD[0],
    name: "Léa M.",
    text: "Grâce aux quiz après chaque leçon, j'ai vraiment compris où j'en étais. J'ai eu le permis du premier coup !",
    stars: "★★★★★",
  },
  {
    initials: "TR",
    grad: AVATARS_GRAD[2],
    name: "Thomas R.",
    text: "Super clair de voir mes compétences validées au fil des séances. Ça motive vraiment de voir la progression.",
    stars: "★★★★★",
  },
  {
    initials: "SK",
    grad: AVATARS_GRAD[3],
    name: "Sara K.",
    text: "L'app m'a aidé à rester régulière. Mon moniteur voyait exactement sur quoi je devais travailler.",
    stars: "★★★★☆",
  },
];

// ─── Entry point ─────────────────────────────────────────────
export async function mount(root, slugOrId) {
  track("page.view", { page: "ecole_publique", slug: slugOrId || null });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="ec">
      <div class="ec-hero" style="padding-top:72px">
        <div class="ec-skel" style="width:120px;height:22px;margin:0 auto 20px"></div>
        <div class="ec-skel" style="width:220px;height:40px;margin:0 auto 12px"></div>
        <div class="ec-skel" style="width:100px;height:18px;margin:0 auto 28px"></div>
        <div style="display:flex;gap:12px;justify-content:center">
          ${[1, 2, 3].map(() => `<div class="ec-skel" style="width:80px;height:70px;border-radius:16px"></div>`).join("")}
        </div>
      </div>
      <div class="ec-section">
        <div class="ec-skel" style="height:120px"></div>
      </div>
    </div>
  `;

  try {
    await renderEcole(root, slugOrId);
  } catch (err) {
    console.error("[ecole] load error", err);
    const notFound = err?.code === "ECOLE_NOT_FOUND";
    root.innerHTML = `${STYLE}<div class="ec">
      <div class="ec-err">
        <div class="ec-err-ico" aria-hidden="true">${icon("school", { size: 34 })}</div>
        <div class="ec-err-title">${notFound ? "École introuvable" : "Page temporairement indisponible"}</div>
        <div class="ec-err-sub">${notFound ? "Vérifie l'URL de cette auto-école." : "Vérifie ta connexion ou reviens plus tard."}</div>
      </div>
    </div>`;
  }
}

async function renderEcole(root, slugOrId) {
  if (!slugOrId) {
    throw new Error("slug manquant");
  }

  // Fetch école — essaie slug, puis id
  let ecole = null;
  const { data: bySlug, error: bySlugError } = await sb
    .from("auto_ecoles")
    .select("id, nom, slug, ville")
    .eq("slug", slugOrId)
    .maybeSingle();
  if (bySlugError) throw bySlugError;
  ecole = bySlug;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      slugOrId,
    );
  if (!ecole && isUuid) {
    const { data: byId, error: byIdError } = await sb
      .from("auto_ecoles")
      .select("id, nom, slug, ville")
      .eq("id", slugOrId)
      .maybeSingle();
    if (byIdError) throw byIdError;
    ecole = byId;
  }

  if (!ecole) {
    const notFoundError = new Error("École introuvable");
    notFoundError.code = "ECOLE_NOT_FOUND";
    throw notFoundError;
  }

  // Fetch moniteurs (aucune PII sensible)
  const { data: moniteurs, error: moniteursError } = await sb
    .from("profiles")
    .select("id, prenom, nom")
    .eq("auto_ecole_id", ecole.id)
    .in("role", ["enseignant", "moniteur"])
    .limit(6);
  if (moniteursError) throw moniteursError;

  // Fetch stats : nb élèves actifs
  const { count: nbEleves, error: elevesError } = await sb
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("auto_ecole_id", ecole.id)
    .eq("role", "eleve");
  if (elevesError) throw elevesError;

  const nbMoniteurs = (moniteurs || []).length;
  const nom = ecole.nom || "Auto-école";
  const ville = ecole.ville || "";

  const features = [
    {
      ico: icon("target", { size: 22 }),
      title: "Parcours REMC",
      sub: "31 compétences officielles",
      color: "var(--a)",
    },
    {
      ico: icon("zap", { size: 22 }),
      title: "Quiz post-leçon",
      sub: "Validation immédiate",
      color: "var(--gr)",
    },
    {
      ico: icon("chart-bar", { size: 22 }),
      title: "Suivi temps réel",
      sub: "Moniteur + élève synchronisés",
      color: "var(--am)",
    },
    {
      ico: icon("trophy", { size: 22 }),
      title: "Gamification",
      sub: "XP, trophées et streaks",
      color: "var(--pu)",
    },
  ];

  const me = getCurUser();

  root.innerHTML = `
    ${STYLE}
    <div class="ec anim-slide-up">

      <!-- HERO -->
      <div class="ec-hero">
        <div class="ec-hero-badge">
          <span aria-hidden="true">${icon("map-pin", { size: 14 })}</span> Auto-école partenaire PermiGo
        </div>
        <h1 class="ec-hero-title">${esc(nom)}</h1>
        ${ville ? `<div class="ec-hero-ville"><span aria-hidden="true">${icon("map-pin", { size: 14 })}</span> ${esc(ville)}</div>` : ""}
        <div class="ec-hero-kpis">
          <div class="ec-hero-kpi">
            <div class="ec-kpi-val">${nbEleves ?? "—"}</div>
            <div class="ec-kpi-lbl">Élèves</div>
          </div>
          <div class="ec-hero-kpi">
            <div class="ec-kpi-val">${nbMoniteurs || "—"}</div>
            <div class="ec-kpi-lbl">Moniteurs</div>
          </div>
          <div class="ec-hero-kpi">
            <div class="ec-kpi-val">4.9</div>
            <div class="ec-kpi-lbl">Note</div>
          </div>
        </div>
      </div>

      <!-- FEATURES -->
      <div class="ec-section">
        <div class="ec-section-title">Avec PermiGo</div>
        <div class="ec-features">
          ${features
            .map(
              (f, i) => `
            <div class="ec-feature" style="--f-color:${f.color};animation-delay:${i * 0.06}s"
                 class="ecCardIn">
              <span class="ec-feature-ico" aria-hidden="true">${f.ico}</span>
              <div class="ec-feature-title">${esc(f.title)}</div>
              <div class="ec-feature-sub">${esc(f.sub)}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>

      <!-- MONITEURS -->
      ${
        (moniteurs || []).length > 0
          ? `
      <div class="ec-section">
        <div class="ec-section-title">Nos moniteurs</div>
        <div class="ec-moniteurs">
          ${(moniteurs || [])
            .map((m, i) => {
              const ini =
                ((m.prenom || "")[0] || "") + ((m.nom || "")[0] || "");
              const grad = AVATARS_GRAD[i % AVATARS_GRAD.length];
              const full = esc(
                [m.prenom, m.nom].filter(Boolean).join(" ") || "—",
              );
              return `
              <div class="ec-moniteur" style="animation-delay:${i * 0.08}s">
                <div class="ec-mon-av" style="background:${grad}">${esc(ini.toUpperCase() || "?")}</div>
                <div class="ec-mon-info">
                  <div class="ec-mon-name">${full}</div>
                  <span class="ec-mon-tag">Moniteur certifié</span>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
      `
          : ""
      }

      <!-- TÉMOIGNAGES -->
      <div class="ec-section">
        <div class="ec-section-title">Témoignages</div>
        <div class="ec-temoignages">
          ${TEMOIGNAGES.map(
            (t, i) => `
            <div class="ec-temoignage" style="animation:ecCardIn .4s cubic-bezier(.34,1.56,.64,1) ${i * 0.1}s both">
              <div class="ec-temo-text">${esc(t.text)}</div>
              <div class="ec-temo-author">
                <div class="ec-temo-av" style="background:${t.grad}">${esc(t.initials)}</div>
                <span class="ec-temo-name">${esc(t.name)}</span>
                <span class="ec-temo-stars" aria-label="5 étoiles">${esc(t.stars)}</span>
              </div>
            </div>
          `,
          ).join("")}
        </div>
      </div>

      <!-- CTA -->
      <div class="ec-cta">
        <div class="ec-cta-title">Rejoins ${esc(nom)}</div>
        <div class="ec-cta-sub">
          Ton moniteur te communique un code d'invitation.<br>
          Crée ton compte en 30 secondes.
        </div>
        ${
          me
            ? `<a class="ec-cta-btn" href="#/parcours">Mon parcours <span aria-hidden="true">→</span></a>`
            : `<a class="ec-cta-btn" id="ec-cta-btn" href="#/signup">Créer un compte <span aria-hidden="true">→</span></a>`
        }
      </div>

    </div>
  `;

  // Wire CTA
  root.querySelector("#ec-cta-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    track("ecole.cta.clicked", { ecole_id: ecole.id });
    location.hash = "#/signup";
  });
}
