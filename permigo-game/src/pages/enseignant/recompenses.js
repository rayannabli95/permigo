// ═══════════════════════════════════════════════════════════════
// Enseignant — Mes récompenses
// Affiche gemmes + badges débloqués (monétisation future)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { toast } from "@/components/common/toast.js";

const BADGES = [
  {
    id: "validateur",
    name: "Validateur",
    desc: "10 validations",
    threshold: 10,
    emoji: "✓",
    color: "#3b82f6",
  },
  {
    id: "mentor",
    name: "Mentor",
    desc: "50 validations",
    threshold: 50,
    emoji: "👥",
    color: "#8b5cf6",
  },
  {
    id: "expert",
    name: "Expert",
    desc: "100 validations",
    threshold: 100,
    emoji: "⭐",
    color: "#f59e0b",
  },
  {
    id: "maitre",
    name: "Maître",
    desc: "200 validations",
    threshold: 200,
    emoji: "👑",
    color: "#ec4899",
  },
];

const STYLE = `<style>
  .rec-page {
    padding: 20px 16px 100px;
    max-width: 900px;
    margin: 0 auto;
    background: var(--bg);
    color: var(--ink);
  }

  .rec-h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 24px;
    color: var(--ink);
  }

  .rec-gemmes-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    margin-bottom: 32px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .rec-gemmes-display {
    margin: 16px 0;
  }

  .rec-gemmes-val {
    font-size: 48px;
    font-weight: 700;
    letter-spacing: -1px;
  }

  .rec-gemmes-label {
    font-size: 14px;
    opacity: 0.9;
    margin-top: 4px;
  }

  .rec-gemmes-help {
    font-size: 13px;
    opacity: 0.85;
    margin-top: 12px;
  }

  .rec-section-title {
    font-size: 18px;
    font-weight: 600;
    margin: 32px 0 16px;
    color: var(--ink);
  }

  .rec-badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
    margin-bottom: 32px;
  }

  .rec-badge-card {
    background: var(--su);
    border: 2px solid var(--bo);
    border-radius: 12px;
    padding: 12px;
    text-align: center;
    position: relative;
    transition: all 0.2s ease;
  }

  .rec-badge-card.unlocked {
    border-color: #6366f1;
    background: rgba(99,102,241,.05);
  }

  .rec-badge-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin: 0 auto 8px;
  }

  .rec-badge-name {
    font-weight: 600;
    font-size: 12px;
    line-height: 1.2;
  }

  .rec-badge-desc {
    font-size: 11px;
    color: var(--mu2);
    margin-top: 4px;
  }

  .rec-locked-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 10px;
  }

  .rec-shop-preview {
    background: var(--su);
    border: 1px dashed var(--bo);
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 32px 0;
  }

  .rec-shop-preview p {
    color: var(--mu2);
    font-size: 13px;
    margin: 0;
  }
</style>`;

export async function mount(root) {
  const me = getCurUser();
  if (!me) {
    root.innerHTML = `<div style="padding:32px;text-align:center">Erreur auth</div>`;
    return;
  }

  // Récupérer gemmes + count de validations pour calculer les badges
  const [profileRes, valCountRes] = await Promise.all([
    sb.from("profiles").select("gemmes").eq("id", me.id).single(),
    sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", me.id),
  ]);

  if (profileRes.error) {
    console.error("[recompenses]", profileRes.error);
    toast("Impossible de charger les récompenses", "error");
    return;
  }

  const gemmes = profileRes.data?.gemmes || 0;
  // Badges débloqués selon seuils de validations (10 / 50 / 100 / 200)
  const totalValidations = valCountRes.count ?? 0;

  // Rendre
  root.innerHTML = `
    ${STYLE}
    <div class="rec-page">
      <h1 class="rec-h1">Mes récompenses</h1>

      <!-- Gemmes -->
      <div class="rec-gemmes-section">
        <h2 style="margin:0;font-size:16px;font-weight:600">Mes gemmes</h2>
        <div class="rec-gemmes-display">
          <div class="rec-gemmes-val">${gemmes}</div>
          <div class="rec-gemmes-label">Gemmes</div>
        </div>
        <p class="rec-gemmes-help">Gagnées via validations (+10 par séance).<br/>Utilisables pour débloquer cosmétiques premium.</p>
      </div>

      <!-- Badges -->
      <h2 class="rec-section-title">Mes badges</h2>
      <div class="rec-badges-grid">
        ${BADGES.map((badge) => {
          const unlocked = totalValidations >= badge.threshold;
          return `
            <div class="rec-badge-card ${unlocked ? "unlocked" : ""}">
              <div class="rec-badge-icon" style="background: ${badge.color}; opacity: ${unlocked ? 1 : 0.3}">
                ${badge.emoji}
              </div>
              <div class="rec-badge-name">${esc(badge.name)}</div>
              <div class="rec-badge-desc">${esc(badge.desc)}</div>
              ${!unlocked ? `<div class="rec-locked-overlay">${totalValidations}/${badge.threshold}</div>` : ""}
            </div>
          `;
        }).join("")}
      </div>

      <!-- Shop preview -->
      <div class="rec-shop-preview">
        <h2 style="margin:0 0 12px;font-size:16px;font-weight:600">Shop (bientôt)</h2>
        <p>Dépensez vos gemmes pour débloquer des cosmétiques premium.</p>
      </div>
    </div>
  `;
}
