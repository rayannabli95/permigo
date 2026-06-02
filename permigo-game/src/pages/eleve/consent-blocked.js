// ═══════════════════════════════════════════════════════════════
// Écran bloquant — élève mineur en attente du consentement parental.
// Monté par main.js avant le chrome tant que parental_consent_required
// est vrai et parental_consent_given_at est null.
// ═══════════════════════════════════════════════════════════════
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { logout } from '@/auth/auth.js';

const STYLE = `<style>
  .cb { position:fixed; inset:0; z-index:9000; overflow-y:auto;
    background:linear-gradient(180deg,var(--ink) 0%,var(--ink4,#0f1424) 100%);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:32px 22px max(40px,env(safe-area-inset-bottom)); font-family:'Inter',sans-serif; color:#fff; text-align:center; }
  .cb-ico { font-size:60px; margin-bottom:18px; }
  .cb-title { font:800 24px/1.25 'Plus Jakarta Sans',sans-serif; margin:0 0 12px; letter-spacing:-.02em; max-width:18ch; }
  .cb-sub { font:500 15px/1.55 'Inter',sans-serif; color:rgba(255,255,255,.72); margin:0 0 22px; max-width:34ch; }
  .cb-link-row { width:100%; max-width:420px; margin-bottom:12px; }
  .cb-input { width:100%; padding:14px 16px; border:1.5px solid rgba(255,255,255,.18); border-radius:14px;
    font:500 14px/1.3 'Inter',sans-serif; color:#fff; background:rgba(255,255,255,.06); }
  .cb-btn { width:100%; max-width:420px; padding:15px; border:0; border-radius:14px; cursor:pointer;
    font:800 15px/1 'Plus Jakarta Sans',sans-serif; min-height:52px; transition:transform .12s; }
  .cb-btn:active { transform:scale(.98); }
  .cb-btn-primary { background:linear-gradient(135deg,var(--a),var(--adk,#46a302)); color:#fff;
    box-shadow:0 8px 24px -8px rgba(88,204,2,.55); margin-bottom:12px; }
  .cb-btn-ghost { background:transparent; color:rgba(255,255,255,.6); border:1px solid rgba(255,255,255,.18); }
</style>`;

export function mountConsentBlocked(root, me) {
  track('consent_blocked.viewed');
  const token = me?.parental_consent_token || '';
  const link = token ? `${location.origin}/#/parental-consent?token=${encodeURIComponent(token)}` : '';

  root.innerHTML = `${STYLE}
    <div class="cb">
      <div class="cb-ico">👨‍👩‍👧</div>
      <h1 class="cb-title">En attente de l'accord de ton parent</h1>
      <p class="cb-sub">Tu as moins de 15 ans : un parent ou tuteur doit valider ton inscription avant que tu puisses utiliser PermiGo. Renvoie-lui le lien ci-dessous si besoin.</p>
      ${link ? `
        <div class="cb-link-row"><input class="cb-input" id="cb-link" type="text" readonly value="${esc(link)}" /></div>
        <button class="cb-btn cb-btn-primary" id="cb-copy" type="button">📋 Copier le lien pour mon parent</button>
      ` : `<p class="cb-sub">Demande à ton auto-école de relancer la validation.</p>`}
      <button class="cb-btn cb-btn-ghost" id="cb-logout" type="button">Se déconnecter</button>
    </div>`;

  root.querySelector('#cb-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(link);
      const b = root.querySelector('#cb-copy'); b.textContent = '✓ Lien copié';
      setTimeout(() => { b.textContent = '📋 Copier le lien pour mon parent'; }, 2000);
    } catch {
      root.querySelector('#cb-link')?.select();
    }
  });

  root.querySelector('#cb-logout')?.addEventListener('click', async () => {
    try { await logout(); } catch {}
    location.reload();
  });
}
