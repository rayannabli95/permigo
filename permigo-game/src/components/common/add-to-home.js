// ═══════════════════════════════════════════════════════════════
// Tuto "Ajouter PermiGo à l'écran d'accueil"
// Affiché en fin d'inscription (tous les rôles) pour créer de l'engagement.
// Demande d'abord la plateforme (iPhone / Android) puis explique pas à pas.
// Auto-skip si l'app tourne déjà en mode installé (standalone).
//
// Usage : renderAddToHome(root, { onDone })
//   - root   : élément hôte (on remplace son innerHTML)
//   - onDone : callback appelé quand l'utilisateur continue vers l'app
// ═══════════════════════════════════════════════════════════════
import { isStandalone, guessPlatform, canPromptInstall, promptInstall } from '@/utils/pwa.js';
import { track } from '@/services/analytics.js';

const BADGE = '/skins/avatars/permigo-badge-icon.png';

// ─── Petits pictos inline (le jeu d'icônes n'a pas "partager") ──────
const SHARE_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>`;
const DOTS_SVG  = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
const PLUS_SVG  = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;

const STYLE = `<style>
  .a2hs {
    min-height: 100dvh;
    background: linear-gradient(180deg, var(--su2, #eef1ff) 0%, #fff 100%);
    padding: 40px 22px max(40px, env(safe-area-inset-bottom));
    font-family: 'Inter', sans-serif;
    color: var(--ink, #11131f);
    display: flex; flex-direction: column; align-items: center;
  }
  .a2hs-badge {
    width: 96px; height: 96px; object-fit: contain;
    filter: drop-shadow(0 10px 22px rgba(16,185,129,.35));
    animation: a2hsPop .5s cubic-bezier(.2,.9,.3,1.2) both;
  }
  @keyframes a2hsPop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .a2hs-title { font: 800 24px/1.2 'Plus Jakarta Sans', sans-serif; text-align: center; margin: 18px 0 6px; }
  .a2hs-sub   { font-size: 15px; line-height: 1.5; text-align: center; color: var(--mu2, #5b6072); max-width: 340px; margin-bottom: 24px; }
  .a2hs-card  { width: 100%; max-width: 400px; background: #fff; border: 1px solid rgba(0,0,0,.07);
                border-radius: 20px; padding: 18px; box-shadow: 0 6px 24px rgba(20,20,50,.06); }
  /* Sélecteur plateforme */
  .a2hs-seg { display: flex; gap: 8px; background: var(--su2, #eef1ff); padding: 5px; border-radius: 14px; margin-bottom: 18px; }
  .a2hs-seg-btn { flex: 1; border: 0; background: transparent; padding: 11px 8px; border-radius: 10px;
                  font: 700 14px/1 'Inter', sans-serif; color: var(--mu2, #5b6072); cursor: pointer; transition: .15s; }
  .a2hs-seg-btn.active { background: #fff; color: var(--ink, #11131f); box-shadow: 0 2px 8px rgba(20,20,50,.1); }
  /* Étapes */
  .a2hs-step { display: flex; gap: 13px; align-items: flex-start; padding: 11px 0; }
  .a2hs-step + .a2hs-step { border-top: 1px solid rgba(0,0,0,.06); }
  .a2hs-num { flex: 0 0 26px; width: 26px; height: 26px; border-radius: 50%;
              background: #22c55e; color: #fff; font: 800 14px/26px 'Inter'; text-align: center; }
  .a2hs-step-txt { font-size: 14.5px; line-height: 1.45; padding-top: 2px; }
  .a2hs-glyph { display: inline-flex; vertical-align: -5px; margin: 0 3px; padding: 3px;
                border-radius: 7px; background: var(--su2, #eef1ff); color: #4f46e5; }
  /* Bouton install natif */
  .a2hs-install { width: 100%; margin: 4px 0 14px; border: 0; border-radius: 14px;
                  background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff;
                  font: 800 16px/1 'Inter'; padding: 16px; cursor: pointer;
                  box-shadow: 0 8px 20px rgba(34,197,94,.35); }
  .a2hs-install:active { transform: translateY(1px); }
  /* Actions bas */
  .a2hs-continue { width: 100%; max-width: 400px; margin-top: 22px; border: 0; border-radius: 14px;
                   background: var(--ink, #11131f); color: #fff; font: 800 16px/1 'Inter'; padding: 16px; cursor: pointer; }
  .a2hs-later { margin-top: 14px; background: none; border: 0; color: var(--mu2, #5b6072);
                font: 600 14px/1 'Inter'; text-decoration: underline; cursor: pointer; }
</style>`;

export function renderAddToHome(root, { onDone } = {}) {
  const done = () => { try { onDone?.(); } catch {} };

  // Déjà installée → on saute le tuto.
  if (isStandalone()) { done(); return; }

  let platform = guessPlatform();
  if (platform === 'other') platform = 'ios'; // défaut raisonnable

  track('a2hs.shown', { guessed: guessPlatform() });

  root.innerHTML = `${STYLE}
    <div class="a2hs">
      <img class="a2hs-badge" src="${BADGE}" alt="PermiGo" />
      <h1 class="a2hs-title">Ajoute PermiGo à ton écran d'accueil</h1>
      <p class="a2hs-sub">Ouvre l'app d'un seul geste, comme une vraie appli — et garde ta progression à portée de main chaque jour.</p>

      <div class="a2hs-card">
        <div class="a2hs-seg" role="tablist">
          <button class="a2hs-seg-btn" data-plat="ios" type="button">iPhone (iOS)</button>
          <button class="a2hs-seg-btn" data-plat="android" type="button">Android</button>
        </div>
        <div class="a2hs-steps" id="a2hs-steps"></div>
      </div>

      <button class="a2hs-continue" id="a2hs-continue" type="button">Continuer vers l'app</button>
      <button class="a2hs-later" id="a2hs-later" type="button">Je le ferai plus tard</button>
    </div>`;

  const stepsEl = root.querySelector('#a2hs-steps');

  function stepsIOS() {
    return `
      <div class="a2hs-step"><div class="a2hs-num">1</div><div class="a2hs-step-txt">Dans <strong>Safari</strong>, touche le bouton Partager <span class="a2hs-glyph">${SHARE_SVG}</span> en bas de l'écran.</div></div>
      <div class="a2hs-step"><div class="a2hs-num">2</div><div class="a2hs-step-txt">Fais défiler et choisis <strong>« Sur l'écran d'accueil »</strong>.</div></div>
      <div class="a2hs-step"><div class="a2hs-num">3</div><div class="a2hs-step-txt">Touche <strong>« Ajouter »</strong> en haut à droite. C'est fait !</div></div>`;
  }

  function stepsAndroid() {
    const installBtn = canPromptInstall()
      ? `<button class="a2hs-install" id="a2hs-install" type="button">Installer l'app en 1 tap</button>`
      : '';
    return `${installBtn}
      <div class="a2hs-step"><div class="a2hs-num">1</div><div class="a2hs-step-txt">Dans <strong>Chrome</strong>, touche le menu <span class="a2hs-glyph">${DOTS_SVG}</span> en haut à droite.</div></div>
      <div class="a2hs-step"><div class="a2hs-num">2</div><div class="a2hs-step-txt">Choisis <strong>« Ajouter à l'écran d'accueil »</strong> <span class="a2hs-glyph">${PLUS_SVG}</span> (ou « Installer l'application »).</div></div>
      <div class="a2hs-step"><div class="a2hs-num">3</div><div class="a2hs-step-txt">Confirme avec <strong>« Ajouter »</strong>. C'est fait !</div></div>`;
  }

  function renderSteps() {
    root.querySelectorAll('.a2hs-seg-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.plat === platform));
    stepsEl.innerHTML = platform === 'android' ? stepsAndroid() : stepsIOS();

    const installBtn = root.querySelector('#a2hs-install');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        installBtn.disabled = true;
        installBtn.textContent = 'Installation…';
        const outcome = await promptInstall();
        track('a2hs.install_prompt', { outcome });
        if (outcome === 'accepted') { done(); return; }
        installBtn.disabled = false;
        installBtn.textContent = "Installer l'app en 1 tap";
      });
    }
  }

  root.querySelectorAll('.a2hs-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      platform = btn.dataset.plat;
      track('a2hs.platform_selected', { platform });
      renderSteps();
    });
  });

  root.querySelector('#a2hs-continue').addEventListener('click', () => { track('a2hs.continue'); done(); });
  root.querySelector('#a2hs-later').addEventListener('click', () => { track('a2hs.later'); done(); });

  renderSteps();
}
