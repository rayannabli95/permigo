// ═══════════════════════════════════════════════════════════════
// Onboarding magique — 3 steps pour les nouveaux élèves
// Déclenché quand profiles.first_value_action_at IS NULL
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser, setCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { ASSETS } from '@/utils/assets.js';

// ─── Shared CSS ───────────────────────────────────────────────
const STYLE = `<style>
  .ob {
    position: fixed; inset: 0;
    background: #0a0d1a;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    font-family: 'Inter', sans-serif;
    color: #f1f5f9;
    -webkit-font-smoothing: antialiased;
  }

  /* Progress dots */
  .ob-dots {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 20px 0 0;
    flex-shrink: 0;
  }
  .ob-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,.2);
    transition: background .3s, width .3s;
  }
  .ob-dot.active {
    width: 18px; border-radius: 3px;
    background: #6366f1;
  }
  .ob-dot.done { background: rgba(99,102,241,.4); }

  /* Content area */
  .ob-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    text-align: center;
    animation: obSlideIn .45s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes obSlideIn {
    from { opacity: 0; transform: translateY(24px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) { .ob-body { animation: none; } }

  /* Logo */
  .ob-logo {
    font: 900 28px/1 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.04em;
    color: #fff;
    margin-bottom: 32px;
  }
  .ob-logo span { color: #6366f1; }

  /* Illustration */
  .ob-illo {
    font-size: 72px;
    margin-bottom: 24px;
    animation: obIlloFloat 3s ease-in-out infinite alternate;
    display: inline-block;
  }
  @keyframes obIlloFloat {
    from { transform: translateY(0); }
    to   { transform: translateY(-8px); }
  }

  /* Title */
  .ob-title {
    font: 800 28px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    letter-spacing: -.03em;
    margin: 0 0 12px;
  }
  .ob-title .accent { color: #818cf8; }

  /* Subtitle */
  .ob-sub {
    font: 500 16px/1.6 'Inter', sans-serif;
    color: #94a3b8;
    margin: 0 0 40px;
    max-width: 300px;
  }

  /* Features list (step 1) */
  .ob-features {
    display: flex; flex-direction: column; gap: 12px;
    width: 100%; max-width: 320px;
    margin-bottom: 40px;
    text-align: left;
  }
  .ob-feat {
    display: flex; align-items: center; gap: 14px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 14px;
    padding: 12px 16px;
  }
  .ob-feat-ico { font-size: 22px; flex-shrink: 0; }
  .ob-feat-txt {
    font: 500 13px/1.4 'Inter', sans-serif;
    color: #e2e8f0;
  }
  .ob-feat-txt strong { color: #fff; display: block; font-weight: 700; margin-bottom: 1px; }

  /* CTA Button */
  .ob-btn {
    width: 100%; max-width: 320px;
    padding: 18px 24px;
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 16px;
    font: 700 16px/1 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.01em;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: transform .15s, background .15s, box-shadow .15s;
    box-shadow: 0 4px 20px rgba(99,102,241,.4);
    -webkit-tap-highlight-color: transparent;
  }
  .ob-btn:active { transform: scale(.97); background: #5558e3; }
  .ob-btn:disabled { background: #334155; box-shadow: none; cursor: not-allowed; }

  /* ── Step 2 — Avatar picker ── */
  .ob-av-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
    max-width: 320px;
    margin-bottom: 32px;
  }
  .ob-av-card {
    aspect-ratio: 1;
    border-radius: 20px;
    border: 2px solid rgba(255,255,255,.1);
    background: #0f172a;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: border-color .15s, transform .15s;
    -webkit-tap-highlight-color: transparent;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
  }
  .ob-av-card:active { transform: scale(.93); }
  .ob-av-card.selected {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,.25), 0 0 20px rgba(99,102,241,.2);
  }
  .ob-av-card.locked { opacity: .45; cursor: default; }
  .ob-av-img {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }
  .ob-av-name {
    font: 600 9px/1 'Inter', sans-serif;
    color: #94a3b8;
    margin-top: 4px;
    text-align: center;
    padding: 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 90%;
  }
  .ob-av-lock {
    position: absolute; top: 6px; right: 6px;
    font-size: 11px; opacity: .7;
  }
  .ob-av-check {
    position: absolute; top: 6px; right: 6px;
    width: 18px; height: 18px;
    background: #6366f1;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    display: none;
  }
  .ob-av-card.selected .ob-av-check { display: flex; }

  /* ── Step 3 — First quest ── */
  .ob-milestones {
    display: flex; flex-direction: column; gap: 10px;
    width: 100%; max-width: 320px;
    margin-bottom: 40px;
    text-align: left;
  }
  .ob-milestone {
    display: flex; align-items: center; gap: 14px;
    background: rgba(99,102,241,.08);
    border: 1px solid rgba(99,102,241,.2);
    border-radius: 14px;
    padding: 14px 16px;
    animation: obSlideIn .45s cubic-bezier(.34,1.56,.64,1) both;
  }
  .ob-milestone:nth-child(1) { animation-delay: .1s; }
  .ob-milestone:nth-child(2) { animation-delay: .2s; }
  .ob-milestone:nth-child(3) { animation-delay: .3s; }
  .ob-m-num {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(99,102,241,.2);
    display: flex; align-items: center; justify-content: center;
    font: 800 14px/1 'Plus Jakarta Sans', sans-serif;
    color: #818cf8;
    flex-shrink: 0;
  }
  .ob-m-body { flex: 1; }
  .ob-m-title {
    font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #e2e8f0;
    margin-bottom: 2px;
  }
  .ob-m-sub {
    font: 500 11px/1.3 'Inter', sans-serif;
    color: #64748b;
  }
  .ob-m-reward {
    font: 700 12px/1 'IBM Plex Mono', monospace;
    color: #818cf8;
    flex-shrink: 0;
  }

  .ob-footer {
    flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center;
    padding: 0 24px max(32px, env(safe-area-inset-bottom, 24px));
  }
</style>`;

// ─── Helpers ──────────────────────────────────────────────────
function dots(active) {
  return `<div class="ob-dots">
    ${[0,1,2].map(i => `<div class="ob-dot${i < active ? ' done' : i === active ? ' active' : ''}"></div>`).join('')}
  </div>`;
}

// ─── Entry point ──────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track('onboarding.start', { role: me.role });
  renderWelcome(root, me);
}

// ─── Step 1 — Welcome ─────────────────────────────────────────
function renderWelcome(root, me) {
  const prenom = esc(me.prenom || me.nom || 'toi');
  root.innerHTML = `
    ${STYLE}
    <div class="ob">
      ${dots(0)}
      <div class="ob-body">
        <div class="ob-logo">Permi<span>Go</span></div>
        <div class="ob-illo" aria-hidden="true">🚗</div>
        <h1 class="ob-title">Bienvenue, <span class="accent">${prenom}</span>&nbsp;!</h1>
        <p class="ob-sub">Ton permis commence ici — une habitude par jour pour réussir.</p>
        <div class="ob-features">
          <div class="ob-feat">
            <span class="ob-feat-ico" aria-hidden="true">🎯</span>
            <div class="ob-feat-txt"><strong>Parcours REMC officiel</strong>31 compétences pour passer le permis B</div>
          </div>
          <div class="ob-feat">
            <span class="ob-feat-ico" aria-hidden="true">⚡</span>
            <div class="ob-feat-txt"><strong>Quiz post-leçon</strong>Valide tes acquis juste après chaque séance</div>
          </div>
          <div class="ob-feat">
            <span class="ob-feat-ico" aria-hidden="true">🏆</span>
            <div class="ob-feat-txt"><strong>Trophées & récompenses</strong>Gagne des trophées en progressant</div>
          </div>
        </div>
      </div>
      <div class="ob-footer">
        <button class="ob-btn" id="ob-next-1">
          Commencer <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  `;
  root.querySelector('#ob-next-1').addEventListener('click', () => {
    track('onboarding.welcome.next');
    renderChooseAvatar(root, me);
  });
}

// ─── Step 2 — Choose Avatar ────────────────────────────────────
function renderChooseAvatar(root, me) {
  let selected = (me.avatar_url && ASSETS.avatar.includes(me.avatar_url)) ? me.avatar_url : ASSETS.avatar[0];

  function html() {
    return `
      ${STYLE}
      <div class="ob">
        ${dots(1)}
        <div class="ob-body">
          <h1 class="ob-title">Choisis ton avatar</h1>
          <p class="ob-sub" style="margin-bottom:28px">Tu pourras le changer quand tu veux depuis ton profil.</p>
          <div class="ob-av-grid" id="ob-av-grid">
            ${ASSETS.avatar.map((url, i) => `
                <div class="ob-av-card${url === selected ? ' selected' : ''}"
                     data-url="${esc(url)}" role="button" aria-label="Avatar ${i + 1}">
                  <img class="ob-av-img" src="${esc(url)}" alt="" loading="lazy" />
                  <span class="ob-av-check" aria-hidden="true">✓</span>
                </div>`).join('')}
          </div>
        </div>
        <div class="ob-footer">
          <button class="ob-btn" id="ob-next-2">
            Continuer <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    `;
  }

  root.innerHTML = html();

  function wire() {
    root.querySelectorAll('.ob-av-card').forEach(card => {
      card.addEventListener('click', () => {
        selected = card.dataset.url;
        root.querySelectorAll('.ob-av-card').forEach(c => c.classList.toggle('selected', c.dataset.url === selected));
      });
    });

    root.querySelector('#ob-next-2').addEventListener('click', async () => {
      track('onboarding.avatar.selected', { url: selected });
      // Persist avatar choice
      try {
        await sb.from('profiles').update({ avatar_url: selected }).eq('id', me.id);
        me.avatar_url = selected;
      } catch {}
      renderFirstQuest(root, me);
    });
  }

  wire();
}

// ─── Step 3 — First Quest ─────────────────────────────────────
function renderFirstQuest(root, me) {
  const MILESTONES = [
    { num: '5',  title: 'Premières racines',   sub: 'Valide tes 5 premières compétences',     reward: '+50 XP',  emoji: '🌱' },
    { num: '15', title: 'Halfway there',        sub: 'Atteins la moitié du parcours REMC',     reward: '+200 XP', emoji: '🚀' },
    { num: '31', title: 'Permis décroché !',    sub: 'Maîtrise les 31 compétences officielles', reward: '🏆 Trophée légendaire', emoji: '👑' },
  ];

  root.innerHTML = `
    ${STYLE}
    <div class="ob">
      ${dots(2)}
      <div class="ob-body">
        <div class="ob-illo" style="font-size:60px;margin-bottom:16px" aria-hidden="true">🗺️</div>
        <h1 class="ob-title">Ta première mission</h1>
        <p class="ob-sub" style="margin-bottom:28px">
          Voici les 3 jalons qui jalonnent ton parcours.
          Chaque leçon te rapproche de la prochaine étape.
        </p>
        <div class="ob-milestones">
          ${MILESTONES.map(m => `
            <div class="ob-milestone">
              <div class="ob-m-num">${esc(m.emoji)}</div>
              <div class="ob-m-body">
                <div class="ob-m-title">${esc(m.title)}</div>
                <div class="ob-m-sub">${esc(m.sub)}</div>
              </div>
              <div class="ob-m-reward">${esc(m.reward)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="ob-footer">
        <button class="ob-btn" id="ob-finish" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
          C'est parti&nbsp;! <span aria-hidden="true">🚀</span>
        </button>
      </div>
    </div>
  `;

  root.querySelector('#ob-finish').addEventListener('click', async () => {
    const btn = root.querySelector('#ob-finish');
    btn.disabled = true;
    btn.textContent = 'Lancement…';

    track('onboarding.completed');

    try {
      const now = new Date().toISOString();
      await sb.from('profiles')
        .update({ first_value_action_at: now })
        .eq('id', me.id);
      // Update in-memory copy so router won't loop
      me.first_value_action_at = now;
      setCurUser({ ...me, first_value_action_at: now });
    } catch {}

    // Full reboot to mount chrome + normal flow
    location.hash = '#/parcours';
    location.reload();
  });
}
