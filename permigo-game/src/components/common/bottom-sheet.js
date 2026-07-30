// ═══════════════════════════════════════════════════════════════
// Bottom-sheet — cycle de vie mutualisé des feuilles qui glissent du bas.
//
// Ne fournit QUE le shell (création de l'overlay, montage, swipe-to-dismiss,
// clic backdrop, fermeture). Le STYLE et le contenu restent à la page appelante
// (via `bgClass` + `html`), donc le rendu visuel est inchangé d'une page à
// l'autre. Dédup de boutique/trophées (le drag était déjà partagé via
// sheet-swipe.js ; ici on factorise le reste du cycle de vie).
//
// Accessibilité (WCAG 2.2) :
//   - role="dialog" + aria-modal="true" + aria-labelledby sur la feuille
//   - Focus initial sur le CTA principal (ou le 1er focusable)
//   - Piège Tab dans la feuille (cycle)
//   - Listener Échap → fermeture
//   - Restauration du focus sur l'élément déclencheur
//
// Usage :
//   const { overlay, sheet, close } = openBottomSheet({
//     bgClass: "bo2-modal-bg",      // classe de l'overlay (backdrop) — CSS de la page
//     sheetSelector: ".bo2-modal",  // sélecteur de la feuille à l'intérieur
//     html: trustedBottomSheetHtml(`<div class="bo2-modal">…</div>`),
//     onClose,                      // optionnel
//     labelledBy,                   // optionnel — id du titre dans la feuille
//     initialFocus,                 // optionnel — sélecteur ou Element cible du focus
//     triggerEl,                    // optionnel — Element qui a déclenché l'ouverture (restauration focus)
//   });
//   overlay.querySelector("#mon-bouton")?.addEventListener("click", close);
// ═══════════════════════════════════════════════════════════════
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import { haptic } from "@/utils/haptic.js";

const TRUSTED_SHEET_HTML = Symbol("PermiGoTrustedBottomSheetHtml");

/**
 * Marque explicitement un gabarit interne déjà échappé comme HTML de confiance.
 * `openBottomSheet` refuse désormais toute chaîne brute : les appelants doivent
 * donc auditer leurs interpolations au point de construction.
 */
export function trustedBottomSheetHtml(value) {
  return Object.freeze({
    [TRUSTED_SHEET_HTML]: true,
    value: String(value ?? ""),
  });
}

/** Sélecteur de tous les éléments focusables dans un conteneur. */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function openBottomSheet({
  bgClass,
  sheetSelector,
  html,
  onClose,
  labelledBy,
  initialFocus,
  triggerEl,
}) {
  // Mémorise l'élément actif AVANT d'ouvrir (pour restauration à la fermeture).
  const previousFocus =
    triggerEl instanceof Element
      ? triggerEl
      : document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

  const overlay = document.createElement("div");
  overlay.className = bgClass;
  if (!html?.[TRUSTED_SHEET_HTML]) {
    throw new TypeError(
      "openBottomSheet attend trustedBottomSheetHtml(...) et refuse le HTML brut",
    );
  }
  overlay.innerHTML = html.value;
  document.body.appendChild(overlay);

  const sheet = overlay.querySelector(sheetSelector);

  // ── Accessibilité dialog ──────────────────────────────────────
  if (sheet) {
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    if (labelledBy) sheet.setAttribute("aria-labelledby", labelledBy);
  }

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    haptic("select");
    overlay.remove();
    // Nettoyage des listeners
    document.removeEventListener("keydown", _onKey);
    window.removeEventListener("hashchange", _onNav);
    // Restauration du focus (UX clavier + lecteur d'écran)
    try {
      previousFocus?.focus?.({ preventScroll: true });
    } catch {}
    try {
      onClose?.();
    } catch {
      /* noop */
    }
  };

  // ── Piège de focus (Tab cycle dans la feuille) ────────────────
  const _trapFocus = (e) => {
    if (!sheet) return;
    const focusables = Array.from(sheet.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null, // exclut les éléments masqués
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // ── Listener clavier (Échap + Tab) ────────────────────────────
  const _onKey = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
    if (e.key === "Tab") {
      _trapFocus(e);
    }
  };
  document.addEventListener("keydown", _onKey);

  // ── Fermeture à la navigation (changement de route hash) ──────
  // L'overlay est posé sur <body> : sans ça, naviguer (ex : ouvrir un détail
  // de trophée en deep-link puis changer de page) laisse le fond flou COLLÉ
  // par-dessus la nouvelle page, qui intercepte tous les clics (« je clique,
  // ça ne fait que du flou »). On le ferme donc à tout hashchange.
  const _onNav = () => close();
  window.addEventListener("hashchange", _onNav);

  // ── Focus initial ─────────────────────────────────────────────
  // Priorisation : initialFocus param > 1er bouton principal > 1er focusable.
  requestAnimationFrame(() => {
    if (!sheet) return;
    let target = null;
    if (initialFocus instanceof Element) {
      target = initialFocus;
    } else if (typeof initialFocus === "string") {
      target = sheet.querySelector(initialFocus);
    }
    if (!target) {
      // 1er bouton principal (CTA), ou à défaut le premier focusable
      target =
        sheet.querySelector("button:not([disabled])") ||
        sheet.querySelector(FOCUSABLE);
    }
    try {
      target?.focus({ preventScroll: true });
    } catch {}
  });

  if (sheet) enableSheetSwipe(sheet, close, { overlay });
  // Clic sur le backdrop (hors feuille) ferme.
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  return { overlay, sheet, close };
}
