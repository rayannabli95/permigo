// ═══════════════════════════════════════════════════════════════
// Page publique — Consentement parental (élève < 15 ans)
// URL : #/parental-consent?token=xxx  (sans login)
// Le parent valide → débloque le compte de l'enfant.
//
// ⚠️ TEXTE JURIDIQUE : template type CNIL, À FAIRE VALIDER PAR UN
// JURISTE / DPO avant mise en service large.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";

const STYLE = `<style>
  .pc { min-height:100dvh; background:linear-gradient(180deg,var(--su2) 0%,#fff 100%);
    padding:32px 20px max(60px,env(safe-area-inset-bottom)); font-family:'Inter',sans-serif;
    color:var(--ink); display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .pc-card { width:100%; max-width:460px; background:var(--su); border:1px solid var(--bo);
    border-radius:24px; padding:28px 24px; box-shadow:0 4px 24px rgba(10,13,26,.06); }
  .pc-ico { font-size:42px; text-align:center; margin-bottom:10px; }
  .pc-title { font:800 21px/1.25 'Plus Jakarta Sans',sans-serif; color:var(--ink); text-align:center; margin:0 0 6px; letter-spacing:-.02em; }
  .pc-sub { font:500 14px/1.55 'Inter',sans-serif; color:var(--mu); text-align:center; margin:0 0 20px; }
  .pc-info { background:var(--bg); border-radius:14px; padding:14px 16px; margin-bottom:16px; }
  .pc-info-row { display:flex; gap:8px; font:500 13.5px/1.5 'Inter',sans-serif; color:var(--ink); margin-bottom:8px; }
  .pc-info-row:last-child { margin-bottom:0; }
  .pc-info-row b { color:var(--mu); font-weight:700; min-width:120px; flex-shrink:0; }
  .pc-legal { font:500 12px/1.5 'Inter',sans-serif; color:var(--mu2); margin:0 0 18px; }
  .pc-check { display:flex; align-items:flex-start; gap:10px; margin-bottom:18px; cursor:pointer; }
  .pc-check input { width:22px; height:22px; flex-shrink:0; margin-top:1px; accent-color:var(--a); }
  .pc-check span { font:500 14px/1.45 'Inter',sans-serif; color:var(--ink); }
  .pc-btn { width:100%; padding:16px; background:var(--a); color: var(--a-ink); border:0; border-radius:14px;
    font:800 15px/1 'Plus Jakarta Sans',sans-serif; cursor:pointer; box-shadow:0 8px 24px color-mix(in srgb, var(--a) 35%, transparent);
    transition:transform .12s,opacity .15s; min-height:54px; }
  .pc-btn:active { transform:scale(.98); }
  .pc-btn:disabled { opacity:.4; cursor:default; box-shadow:none; }
  .pc-skel { width:100%; max-width:460px; height:320px; border-radius:24px;
    background:linear-gradient(90deg,var(--bg3) 0%,var(--bg5) 50%,var(--bg3) 100%); background-size:200% 100%;
    animation:pcSkel 1.4s infinite; } @keyframes pcSkel { to { background-position:-200% 0; } }
  .pc-err-ico { font-size:38px; text-align:center; margin-bottom:10px; }
</style>`;

export async function mount(root) {
  track("parental_consent.viewed");
  root.innerHTML = `${STYLE}<div class="pc"><div class="pc-skel"></div></div>`;

  const hash = location.hash;
  const qi = hash.indexOf("?");
  const params = new URLSearchParams(qi >= 0 ? hash.slice(qi + 1) : "");
  const token = params.get("token");

  if (!token)
    return renderError(
      root,
      "Ce lien de consentement est incomplet. Demande à ton enfant de te renvoyer le lien.",
    );

  let req;
  try {
    const { data, error } = await sb.rpc("get_consent_request", {
      p_token: token,
    });
    if (error) throw error;
    req = Array.isArray(data) ? data[0] : data;
  } catch (e) {
    console.error("[parental-consent] fetch failed", e);
    return renderError(
      root,
      "Impossible de vérifier ce lien pour le moment. Réessaie dans quelques instants.",
    );
  }

  if (!req)
    return renderError(
      root,
      "Ce lien n'est plus valide : le consentement a peut-être déjà été donné, ou le lien a expiré.",
    );

  renderForm(root, req, token);
}

function renderForm(root, req, token) {
  const prenom = esc(req.prenom || "votre enfant");
  const ecole = req.ecole_nom ? esc(req.ecole_nom) : null;
  const inscritLe = req.inscrit_le
    ? new Date(req.inscrit_le).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  root.innerHTML = `${STYLE}
    <div class="pc">
      <div class="pc-card">
        <div class="pc-ico">${icon("users", { size: 36 })}</div>
        <h1 class="pc-title">Consentement parental</h1>
        <p class="pc-sub">Votre enfant souhaite utiliser <strong>PermiGo</strong> pour son apprentissage du code de la route.</p>

        <div class="pc-info">
          <div class="pc-info-row"><b>Enfant</b><span>${prenom}</span></div>
          ${ecole ? `<div class="pc-info-row"><b>Auto-école</b><span>${ecole}</span></div>` : ""}
          <div class="pc-info-row"><b>Inscrit le</b><span>${esc(inscritLe)}</span></div>
        </div>

        <p class="pc-reassure" style="font:600 13px/1.55 'Inter',sans-serif;color:var(--ink);background:color-mix(in srgb, var(--gr, #22c55e) 9%, transparent);border:1px solid color-mix(in srgb, var(--gr, #22c55e) 24%, transparent);border-radius:12px;padding:12px 14px;margin:0 0 14px">
          PermiGo, c'est un cahier de révision numérique — rien de plus. On garde seulement le <strong>prénom</strong> et la <strong>progression</strong> de votre enfant. <strong>Aucun numéro de téléphone, aucune adresse, aucune donnée bancaire.</strong>
        </p>

        <p class="pc-legal">
          <strong>Finalités</strong> : apprentissage du code de la route et suivi pédagogique par l'auto-école.
          <strong>Base légale</strong> : votre consentement, en tant que titulaire de l'autorité parentale (mineur de moins de 15 ans, art. 8 RGPD).
          <strong>Données traitées</strong> : prénom, nom, pseudo, date de naissance, progression pédagogique.
          <strong>Conservation</strong> : jusqu'à l'obtention du permis + 3 ans, puis suppression ou anonymisation.
          <strong>Vos droits</strong> : accès, rectification, suppression, portabilité, retrait du consentement à tout moment via l'auto-école. Détails dans les mentions légales.
        </p>

        <label class="pc-check">
          <input type="checkbox" id="pc-accept" />
          <span>J'accepte que mon enfant utilise PermiGo dans le cadre de son apprentissage, et je reconnais avoir pris connaissance des informations ci-dessus.</span>
        </label>

        <button class="pc-btn" id="pc-submit" disabled>Donner mon consentement</button>
      </div>
    </div>`;

  const checkEl = root.querySelector("#pc-accept");
  const btn = root.querySelector("#pc-submit");
  checkEl.addEventListener("change", () => {
    btn.disabled = !checkEl.checked;
  });

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Validation…";
    try {
      const { error } = await sb.rpc("accept_parental_consent", {
        p_token: token,
      });
      if (error) throw error;
      track("parental_consent.given");
      renderDone(root, prenom);
    } catch (e) {
      console.error("[parental-consent] accept failed", e);
      const { toast } = await import("@/components/common/toast.js");
      toast(
        /invalid_or_used/i.test(e?.message || "")
          ? "Ce lien a déjà été utilisé."
          : "Erreur · réessaie.",
        "error",
        4000,
      );
      btn.disabled = false;
      btn.textContent = "Donner mon consentement";
    }
  });
}

function renderDone(root, prenom) {
  root.innerHTML = `${STYLE}
    <div class="pc">
      <div class="pc-card" style="text-align:center">
        <div class="pc-ico">${icon("check-circle", { size: 36 })}</div>
        <h1 class="pc-title">Merci&nbsp;!</h1>
        <p class="pc-sub">Le consentement est enregistré. ${prenom} peut désormais utiliser PermiGo pleinement.</p>
      </div>
    </div>`;
}

function renderError(root, message) {
  root.innerHTML = `${STYLE}
    <div class="pc">
      <div class="pc-card" style="text-align:center">
        <div class="pc-err-ico">${icon("alert-triangle", { size: 32 })}</div>
        <h1 class="pc-title">Lien indisponible</h1>
        <p class="pc-sub">${esc(message)}</p>
      </div>
    </div>`;
}
