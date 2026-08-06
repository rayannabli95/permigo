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
import { optimizedAvatarUrl } from "@/utils/assets.js";

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
  const init =
    (name || nom || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0] || "")
      .join("")
      .toUpperCase() || "?";
  // Repli initiales — c'est L'avatar par défaut du projet (déjà ce que voit
  // tout élève sans photo). `hidden` : quand un avatar_url existe, ce repli
  // reste posé en DOM mais masqué, prêt à être révélé par l'onerror de l'img
  // juste en dessous si le fichier est introuvable (avatar_url orphelin en
  // base, skin renommé/supprimé…) — jamais l'icône « image cassée » du
  // navigateur.
  const fallback = (hidden) =>
    `<div style="${hidden ? "display:none;" : "display:flex;"}width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg, var(--a), var(--adk));color:#fff;align-items:center;justify-content:center;font-weight:800;font-size:${Math.floor(size * 0.4)}px;font-family:var(--fd,system-ui)">${esc(init)}</div>`;
  if (!avatar_url) return fallback(false);
  // escAttr (pas esc) : dans un ATTRIBUT, les guillemets doivent être
  // encodés, sinon une URL piégée sort de src="…" (XSS via onerror).
  const loadingAttr = loading === "eager" ? "eager" : "lazy";
  const src = optimizedAvatarUrl(avatar_url);
  return `<img src="${escAttr(src)}" alt="${escAttr(name)}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;object-position:center;display:block" loading="${loadingAttr}" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">${fallback(true)}`;
}
