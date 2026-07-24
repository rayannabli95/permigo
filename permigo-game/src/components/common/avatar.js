// ═══════════════════════════════════════════════════════════════
// Avatar — helper canonique de rendu (un seul système).
//   - Photo uploadée OU avatar réaliste choisi via avatar-picker.js
//     → <img> recadrée en cercle (object-fit: cover).
//   - Sinon : initiales sur fond dégradé.
//
// Remplace l'ancien renderUserAvatar d'avatar-modal.js (presets SVG
// "orange" payants en gemmes) — supprimé (antipattern vision V3).
// ═══════════════════════════════════════════════════════════════
import { esc, escAttr } from "@/utils/escape.js";

/**
 * Rend l'avatar d'un utilisateur. Rendu unique partagé (header, carte profil…).
 * @param {{ avatar_url?: string, prenom?: string, nom?: string }} user
 * @param {number} size - diamètre en px
 * @param {{ loading?: "lazy" | "eager" }} options
 * @returns {string} HTML
 */
export function renderUserAvatar(
  { avatar_url, prenom, nom } = {},
  size = 40,
  { loading = "lazy" } = {},
) {
  const name = `${prenom || ""} ${nom || ""}`.trim();
  if (avatar_url) {
    // escAttr (pas esc) : dans un ATTRIBUT, les guillemets doivent être
    // encodés, sinon une URL piégée sort de src="…" (XSS via onerror).
    const loadingAttr = loading === "eager" ? "eager" : "lazy";
    return `<img src="${escAttr(avatar_url)}" alt="${escAttr(name)}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;object-position:center;display:block" loading="${loadingAttr}" referrerpolicy="no-referrer">`;
  }
  const init =
    (name || nom || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0] || "")
      .join("")
      .toUpperCase() || "?";
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg, var(--a), var(--adk));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${Math.floor(size * 0.4)}px;font-family:var(--fd,system-ui)">${esc(init)}</div>`;
}
