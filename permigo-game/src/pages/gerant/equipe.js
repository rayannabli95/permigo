// ⚠️ DORMANT / HORS-CIBLE — cap « moniteur indépendant » (cf. CLAUDE.md racine).
//    Ne pas y investir. Ne pas supprimer sans chantier DB (rôle `gerant` couplé au RLS leads_select).
// ═══════════════════════════════════════════════════════════════
// Gérant — Équipe (light theme)
// Liste enseignants + stats ce mois + recherche
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import { track } from "@/services/analytics.js";

// ─── CSS scoped (cohérent avec pulse.js — cockpit gérant) ────────
const STYLE = `<style>
.eq-page {
  max-width: 580px;
  margin: 0 auto;
  background: var(--bg);
  padding-bottom: 100px;
  font-family: 'Archivo', sans-serif;
  color: var(--ink);
}

/* Header — collé au chrome d'app (qui gère déjà la safe-area), sans espace mort */
.eq-hd {
  padding: 14px 20px 16px;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
}
.eq-hd-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.eq-title {
  font: 700 22px/1.2 'Archivo', sans-serif;
  color: var(--ink);
  letter-spacing: -0.022em;
}
.eq-count {
  font: 600 12px/1 'Archivo', sans-serif;
  color: var(--a-txt);
  background: color-mix(in srgb, var(--a) 10%, transparent);
  padding: 6px 12px;
  border-radius: var(--r-full);
}

/* Search */
.eq-search-wrap {
  margin-top: 16px;
  position: relative;
}
.eq-search-ico {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--mu2);
  font-size: 15px;
  pointer-events: none;
}
.eq-search {
  width: 100%;
  height: 44px;
  padding: 0 16px 0 40px;
  border: 1px solid var(--bo);
  border-radius: var(--r);
  background: var(--bg);
  color: var(--ink);
  font: 500 14px/1 'Archivo', sans-serif;
  outline: none;
  box-sizing: border-box;
  transition: border-color .15s ease, background .15s ease;
}
.eq-search::placeholder { color: var(--mu2); }
.eq-search:focus {
  border-color: var(--a);
  background: var(--su);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--a) 12%, transparent);
}

/* Liste */
.eq-list {
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Card enseignant */
.eq-card {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-xl);
  padding: 20px;
  box-shadow: var(--s0);
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: border-color .15s ease;
}
.eq-card:hover { border-color: var(--a); }
.eq-av {
  width: 44px; height: 44px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 600 16px/1 'Archivo', sans-serif;
  color: var(--a-ink);
  flex-shrink: 0;
  background: var(--a);
}
.eq-info { flex: 1; min-width: 0; }
.eq-name {
  font: 600 15px/1.3 'Archivo', sans-serif;
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.eq-email {
  font: 500 12px/1 'Archivo', sans-serif;
  color: var(--mu2);
  margin-top: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.eq-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.eq-stat {
  font: 500 12px/1 'Archivo', sans-serif;
  color: var(--mu);
  background: var(--bg);
  border: 1px solid var(--bo);
  border-radius: var(--r-sm);
  padding: 6px 10px;
}
.eq-stat strong {
  color: var(--ink);
  font-weight: 600;
}
.eq-badge {
  font: 600 11px/1 'Archivo', sans-serif;
  padding: 5px 10px;
  border-radius: var(--r-full);
  letter-spacing: .2px;
}
.eq-badge.actif {
  color: var(--grd);
  background: rgba(16,185,129,.12);
}
.eq-badge.inactif {
  color: var(--mu2);
  background: var(--bg);
  border: 1px solid var(--bo);
}

/* Bouton ajouter */
.eq-add-wrap {
  padding: 20px 16px 0;
}
.eq-add-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border: 1.5px dashed var(--bo4);
  border-radius: var(--r);
  background: transparent;
  color: var(--mu);
  font: 600 14px/1 'Archivo', sans-serif;
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease, color .15s ease;
}
.eq-add-btn:hover {
  border-color: var(--a);
  background: color-mix(in srgb, var(--a) 6%, transparent);
  color: var(--a-txt);
}
.eq-add-ico { font-size: 18px; }

/* Vide / pas de résultat */
.eq-empty {
  padding: 32px 20px;
  text-align: center;
  color: var(--mu2);
  font: 500 13px/1.6 'Archivo', sans-serif;
  background: var(--su);
  border: 1px dashed var(--bo);
  border-radius: var(--r);
  margin: 16px;
}
.eq-empty-ico { font-size: 36px; margin-bottom: 10px; }

/* Erreur de chargement */
.eq-error {
  margin: 48px 20px 0;
  padding: 32px 20px;
  text-align: center;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-xl);
}
.eq-error-ico {
  width: 44px; height: 44px;
  border-radius: 50%;
  margin: 0 auto 12px;
  display: flex; align-items: center; justify-content: center;
  color: var(--rd);
  background: rgba(239,68,68,.1);
}
.eq-error-title {
  font: 700 15px/1.3 'Archivo', sans-serif;
  color: var(--ink);
  margin-bottom: 6px;
}
.eq-error-sub {
  font: 500 13px/1.5 'Archivo', sans-serif;
  color: var(--mu2);
  margin-bottom: 18px;
}
.eq-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 24px;
  border: 0;
  border-radius: var(--r);
  background: var(--a);
  color: var(--a-ink);
  font: 700 14px/1 'Archivo', sans-serif;
  cursor: pointer;
  transition: transform .12s ease, background .15s ease;
}
.eq-retry-btn:hover { background: var(--adk); }
.eq-retry-btn:active { transform: scale(.97); }

/* Skeleton */
.eq-skel {
  background: linear-gradient(90deg, var(--bg2) 0%, var(--bo) 50%, var(--bg2) 100%);
  background-size: 200% 100%;
  animation: eqShimmer 1.4s ease-in-out infinite;
  border-radius: var(--r-xl);
}
@keyframes eqShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
</style>`;

const AVATARS = [
  "linear-gradient(135deg,#5b5bd6,#3a3a8e)",
  "linear-gradient(135deg,var(--blk),#155e75)",
  "linear-gradient(135deg,var(--puk),#4c1d95)",
  "linear-gradient(135deg,#0e7c66,#064e3b)",
  "linear-gradient(135deg,#9333ea,#6b21a8)",
  "linear-gradient(135deg,var(--rdk),#7f1d1d)",
];

// ─── Entry point ─────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== "gerant") return;

  track("page_view", { page: "gerant_equipe", user_role: me.role });

  // Skeleton
  root.innerHTML = `${STYLE}
<div class="eq-page anim-slide-up">
  <div class="eq-hd">
    <div class="eq-hd-top">
      <div class="eq-title">Équipe</div>
    </div>
    <div class="eq-skel" style="height:42px;margin-top:14px;border-radius:var(--r)"></div>
  </div>
  <div class="eq-list">
    ${[1, 2, 3].map(() => `<div class="eq-skel" style="height:100px"></div>`).join("")}
  </div>
</div>`;

  try {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    // Fetch enseignants + validations ce mois
    const [teachersRes, valsRes] = await Promise.all([
      sb
        .from("profiles")
        .select("id, prenom, nom, email, created_at")
        .eq("role", "enseignant")
        .order("prenom", { ascending: true }),
      sb
        .from("validations")
        .select("validated_by, eleve_id")
        .gte("validated_at", startOfMonth)
        .not("validated_by", "is", null),
    ]);

    if (teachersRes.error) throw teachersRes.error;

    const teachers = teachersRes.data || [];
    const vals = valsRes.data || [];

    // Calcul stats par enseignant
    const teacherStats = {};
    vals.forEach((v) => {
      if (!v.validated_by) return;
      if (!teacherStats[v.validated_by]) {
        teacherStats[v.validated_by] = { valCount: 0, eleveIds: new Set() };
      }
      teacherStats[v.validated_by].valCount++;
      if (v.eleve_id) teacherStats[v.validated_by].eleveIds.add(v.eleve_id);
    });

    render(root, teachers, teacherStats);
  } catch (e) {
    console.error("[equipe]", e);
    root.innerHTML = `${STYLE}
<div class="eq-page">
  <div class="eq-hd">
    <div class="eq-hd-top">
      <div class="eq-title">Équipe</div>
    </div>
  </div>
  <div class="eq-error">
    <div class="eq-error-ico">${icon("alert-triangle", { size: 20 })}</div>
    <div class="eq-error-title">Impossible de charger l'équipe</div>
    <div class="eq-error-sub">Vérifie ta connexion puis réessaie.</div>
    <button id="eq-retry" class="eq-retry-btn">${icon("refresh-cw", { size: 14 })} Réessayer</button>
  </div>
</div>`;
    root
      .querySelector("#eq-retry")
      ?.addEventListener("click", () => mount(root));
  }
}

// ─── Render + filtrage reactif ────────────────────────────────
function render(root, teachers, teacherStats) {
  root.innerHTML = `${STYLE}
<div class="eq-page anim-slide-up">
  <div class="eq-hd">
    <div class="eq-hd-top">
      <div class="eq-title">Équipe</div>
      <div class="eq-count">${teachers.length} enseignant${teachers.length > 1 ? "s" : ""}</div>
    </div>
    <div class="eq-search-wrap">
      <span class="eq-search-ico">${icon("search", { size: 16 })}</span>
      <input
        id="eq-search"
        class="eq-search"
        type="search"
        placeholder="Rechercher un enseignant…"
        autocomplete="off"
        enterkeyhint="search"
      />
    </div>
  </div>

  <div id="eq-list" class="eq-list">
    ${renderCards(teachers, teacherStats)}
  </div>

  <div class="eq-add-wrap">
    <button id="eq-add-btn" class="eq-add-btn">
      <span class="eq-add-ico">+</span>
      Ajouter un enseignant
    </button>
  </div>
</div>`;

  // Recherche en temps reel
  const searchInput = root.querySelector("#eq-search");
  const listEl = root.querySelector("#eq-list");

  searchInput?.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered =
      q === ""
        ? teachers
        : teachers.filter((t) => {
            const full =
              `${t.prenom || ""} ${t.nom || ""} ${t.email || ""}`.toLowerCase();
            return full.includes(q);
          });
    listEl.innerHTML = renderCards(filtered, teacherStats);
  });

  // Bouton ajouter — vrai modal d'invitation (utilise table invitations)
  root.querySelector("#eq-add-btn")?.addEventListener("click", () => {
    openInviteModal(getCurUser());
  });
}

// ─── Modal d'invitation enseignant ──────────────────────────────
function openInviteModal(me) {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;animation:invFadeIn .25s ease;";
  overlay.innerHTML = `
    <style>
      @keyframes invFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes invSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .inv-sheet { width:100%; max-width:480px; background:var(--su); border-radius:32px 32px 0 0; padding:24px 24px max(32px, env(safe-area-inset-bottom)); animation: invSlideUp .3s var(--ease-out); font-family:'Archivo',sans-serif; }
      .inv-handle { width:36px; height:4px; background:var(--bo); border-radius:2px; margin:0 auto 20px; }
      .inv-title { font:800 22px/1.2 'Archivo',sans-serif; color:var(--ink); margin:0 0 6px; letter-spacing:-.02em; }
      .inv-sub { font:500 14px/1.4 'Archivo',sans-serif; color:var(--mu3); margin:0 0 20px; }
      .inv-label { display:block; font:600 12px/1 'Archivo',sans-serif; color:var(--mu3); text-transform:uppercase; letter-spacing:.08em; margin:14px 0 6px; }
      .inv-input { width:100%; padding:14px 16px; border:1.5px solid var(--bo); border-radius:var(--r-md); font:500 16px/1.3 'Archivo',sans-serif; color:var(--ink); transition:border-color .15s; font-family:inherit; }
      .inv-input:focus { outline:0; border-color:var(--a); }
      .inv-actions { display:flex; gap:10px; margin-top:24px; }
      .inv-btn { flex:1; padding:16px; border-radius:var(--r-md); font:700 14px/1 'Archivo',sans-serif; cursor:pointer; transition:transform .12s, background .15s; font-family:inherit; }
      .inv-btn:active { transform: scale(.97); }
      .inv-btn-cancel { background:var(--su2); border:1.5px solid var(--bo); color:var(--mu4); }
      .inv-btn-cancel:hover { background:var(--bg3); }
      .inv-btn-go { background:var(--a); border:0; color: var(--a-ink); }
      .inv-btn-go:hover { background:var(--adk); }
      .inv-btn-go:disabled { opacity:.4; cursor:default; }
    </style>
    <div class="inv-sheet">
      <div class="inv-handle"></div>
      <h3 class="inv-title">Inviter un enseignant</h3>
      <p class="inv-sub">Il recevra un email avec un lien pour rejoindre ton auto-école.</p>
      <label class="inv-label">Email de l'enseignant</label>
      <input class="inv-input" id="inv-email" type="email" placeholder="marie@auto-ecole.fr" autocomplete="email" />
      <label class="inv-label">Prénom (optionnel)</label>
      <input class="inv-input" id="inv-prenom" type="text" placeholder="Marie" autocomplete="given-name" />
      <div class="inv-actions">
        <button class="inv-btn inv-btn-cancel" id="inv-cancel">Annuler</button>
        <button class="inv-btn inv-btn-go" id="inv-send" disabled>Envoyer l'invitation</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const emailEl = overlay.querySelector("#inv-email");
  const prenomEl = overlay.querySelector("#inv-prenom");
  const sendBtn = overlay.querySelector("#inv-send");
  const close = () => {
    overlay.style.animation = "invFadeIn .2s ease reverse";
    setTimeout(() => overlay.remove(), 200);
  };

  emailEl.addEventListener("input", () => {
    const ok = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
      emailEl.value.trim(),
    );
    sendBtn.disabled = !ok;
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector("#inv-cancel").addEventListener("click", close);
  enableSheetSwipe(overlay.querySelector(".inv-sheet"), close, { overlay });
  sendBtn.addEventListener("click", async () => {
    sendBtn.disabled = true;
    sendBtn.textContent = "Envoi…";
    try {
      // Génère un token sécurisé (UUID v4 + timestamp en suffix pour unicité)
      const token = crypto.randomUUID() + "-" + Date.now().toString(36);
      // Expire dans 7 jours
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

      const { data, error } = await sb
        .from("invitations")
        .insert({
          email: emailEl.value.trim().toLowerCase(),
          role: "enseignant",
          token,
          expires_at: expiresAt,
          auto_ecole_id: me.auto_ecole_id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Déclenche l'envoi d'email via Edge Function (best-effort, ne bloque pas l'UX)
      let emailSent = true;
      try {
        const { error: emailError } = await sb.functions.invoke(
          "send-invitation-email",
          {
            body: {
              invitation_id: data?.id,
              token,
              email: data?.email,
              role: "enseignant",
            },
          },
        );
        if (emailError) throw emailError;
      } catch (emailErr) {
        emailSent = false;
        // Email a échoué mais l'invitation est créée en DB → on garde
        console.warn(
          "[invite] email send failed (invitation still created)",
          emailErr,
        );
      }

      const { toast } = await import("@/components/common/toast.js");
      const { playNotify } = await import("@/utils/sound.js");
      playNotify();
      if (!emailSent) {
        const invitationLink = `${window.location.origin}/#/signup?token=${encodeURIComponent(data?.token || token)}`;
        overlay.querySelector(".inv-title").textContent = "Invitation créée";
        overlay.querySelector(".inv-sub").textContent =
          "L'email n'a pas pu être envoyé. Copie ce lien et partage-le directement.";
        const labels = overlay.querySelectorAll(".inv-label");
        labels[0].textContent = "Lien d'invitation";
        labels[1].hidden = true;
        emailEl.type = "text";
        emailEl.value = invitationLink;
        emailEl.readOnly = true;
        prenomEl.hidden = true;
        overlay.querySelector("#inv-cancel").textContent = "Fermer";
        const copyBtn = sendBtn.cloneNode(true);
        copyBtn.disabled = false;
        copyBtn.textContent = "Copier le lien";
        sendBtn.replaceWith(copyBtn);
        copyBtn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(invitationLink);
            toast("Lien copié ✓", "success");
          } catch {
            emailEl.focus();
            emailEl.select();
            toast("Copie impossible. Sélectionne le lien", "error");
          }
        });
        toast("Invitation créée. Email non envoyé", "info", 5000);
        emailEl.focus();
        emailEl.select();
        return;
      }
      toast("Invitation envoyée ✓", "success");
      close();
    } catch (e) {
      console.error("[invite] failed", e);
      const { toast } = await import("@/components/common/toast.js");
      toast(
        e.message?.includes("duplicate")
          ? "Cet email est déjà invité"
          : "Erreur lors de l'envoi",
        "error",
      );
      sendBtn.disabled = false;
      sendBtn.textContent = "Envoyer l'invitation";
    }
  });
  setTimeout(() => emailEl.focus(), 100);
}

function renderCards(teachers, teacherStats) {
  if (teachers.length === 0) {
    return `<div class="eq-empty">
      <div class="eq-empty-ico">${icon("users", { size: 30 })}</div>
      Aucun enseignant trouvé
    </div>`;
  }

  const monthLabel = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return teachers
    .map((t, i) => {
      const initials = initials2(t.prenom, t.nom);
      const gradient = AVATARS[i % AVATARS.length];
      const stats = teacherStats[t.id] || { valCount: 0, eleveIds: new Set() };
      const actif = stats.valCount > 0;
      const fullName = [t.prenom, t.nom].filter(Boolean).join(" ") || "—";

      return `
    <div class="eq-card">
      <div class="eq-av" style="background:${gradient}">${esc(initials)}</div>
      <div class="eq-info">
        <div class="eq-name">${esc(fullName)}</div>
        <div class="eq-email">${esc(t.email || "—")}</div>
        <div class="eq-stats">
          <div class="eq-stat"><strong>${stats.valCount}</strong> valid. ${esc(monthLabel)}</div>
          <div class="eq-stat"><strong>${stats.eleveIds.size}</strong> élève${stats.eleveIds.size > 1 ? "s" : ""}</div>
          <span class="eq-badge ${actif ? "actif" : "inactif"}">${actif ? "Actif" : "Inactif"}</span>
        </div>
      </div>
    </div>`;
    })
    .join("");
}

// ─── Helpers ─────────────────────────────────────────────────
function initials2(prenom, nom) {
  const p = (prenom || "").trim()[0] || "";
  // Initiale prénom + initiale du nom (dernier mot du nom).
  // Fallback : 2e lettre du prénom si pas de nom.
  const parts = (nom || "")
    .trim()
    .replace(/\./g, "")
    .split(/\s+/)
    .filter(Boolean);
  const n = parts.length
    ? parts[parts.length - 1][0] || ""
    : (prenom || "").trim()[1] || "";
  return (p + n).toUpperCase() || "?";
}
