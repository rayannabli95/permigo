// Stub Cloudflare Turnstile — désactivé si VITE_TURNSTILE_SITEKEY absent
const SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY || '';

export function isTurnstileEnabled() {
  return Boolean(SITEKEY);
}

export async function getTurnstileToken() {
  if (!isTurnstileEnabled()) return null;
  return new Promise((resolve) => {
    if (!window.turnstile) { resolve(null); return; }
    window.turnstile.execute('#turnstile-widget', {
      sitekey: SITEKEY,
      callback: resolve,
    });
  });
}
