// ═══════════════════════════════════════════════════════════════
// PWA — détection "installée" (standalone), plateforme, et capture
// de l'event beforeinstallprompt (Android/Chrome) pour un install natif.
// Importé une fois dans main.js pour que l'écoute soit active très tôt.
// ═══════════════════════════════════════════════════════════════

let _deferredPrompt = null;

// L'event arrive tôt après le chargement. On le capture et on empêche
// la mini-infobar par défaut pour déclencher l'install nous-mêmes plus tard.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferredPrompt = e;
});

// Une fois installée, on oublie le prompt.
window.addEventListener("appinstalled", () => {
  _deferredPrompt = null;
});

// L'app tourne-t-elle déjà comme app installée (écran d'accueil) ?
export function isStandalone() {
  try {
    return (
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  } catch {
    return false;
  }
}

// 'ios' | 'android' | 'other' — simple heuristique pour PRÉ-sélectionner
// le bon onglet du tuto (l'utilisateur peut toujours choisir manuellement).
export function guessPlatform() {
  const ua = navigator.userAgent || "";
  const iOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (/Macintosh/i.test(ua) &&
      typeof document !== "undefined" &&
      "ontouchend" in document);
  if (iOS) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

// Navigateur in-app (webview embarquée dans une autre app : Instagram, Facebook,
// Messenger, TikTok, Snapchat, LinkedIn, X, Pinterest, Line, WeChat, Gmail/GSA…).
// L'« ajout à l'écran d'accueil » y est IMPOSSIBLE → il faut ouvrir dans le
// vrai navigateur. Levier critique : la plupart des liens partagés (Le Bon Coin,
// DM, réseaux) s'ouvrent dans ce type de webview.
export function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|MicroMessenger|TikTok|musical_ly|BytedanceWebview|Snapchat|Pinterest|LinkedInApp|Twitter|GSA\/|DuckDuckGo|YJApp/i.test(
    ua,
  );
}

// iOS : seul Safari peut « Sur l'écran d'accueil ». Chrome/Firefox/Edge/Opera iOS
// ne le peuvent PAS (mêmes restrictions WebKit, pas de menu A2HS).
export function isIosNonSafari() {
  const ua = navigator.userAgent || "";
  return (
    guessPlatform() === "ios" && /CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua)
  );
}

// Raison pour laquelle l'A2HS est IMPOSSIBLE dans ce contexte (sinon null).
// 'inapp'       → webview d'une autre app, il faut ouvrir dans le navigateur
// 'ios-browser' → iPhone hors Safari, il faut basculer sur Safari
export function installBlockedReason() {
  if (isStandalone()) return null; // déjà installée : non concerné
  if (isInAppBrowser()) return "inapp";
  if (isIosNonSafari()) return "ios-browser";
  return null;
}

// Un install natif est-il dispo (Chrome Android surtout) ?
export function canPromptInstall() {
  return !!_deferredPrompt;
}

// Déclenche l'install natif. Retourne 'accepted' | 'dismissed' | 'unavailable'.
export async function promptInstall() {
  if (!_deferredPrompt) return "unavailable";
  _deferredPrompt.prompt();
  try {
    const { outcome } = await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    return outcome || "dismissed";
  } catch {
    _deferredPrompt = null;
    return "dismissed";
  }
}
