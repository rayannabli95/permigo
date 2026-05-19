// ═══════════════════════════════════════════════════════════════
// Élève — Galerie des récompenses (light theme)
// 3 sections : Trophées · Fonds carte permis · (Badges futur)
// Permet de visualiser TOUT ce qui est débloquable + l'état (acquis/verrouillé)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { TROPHEES, RARITY_COLOR, RARITY_LABEL } from '@/data/trophees.js';
import { ASSETS, getPermisBg } from '@/utils/assets.js';
import { ELEVE_SKINS } from '@/data/prestige.js';

const STYLE = `<style>
.gal {
  padding: 0 0 100px;
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
}
.gal-hd {
  padding: 20px 20px 12px;
  background: var(--bg);
}
.gal-title { font: 800 24px/1.1 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; letter-spacing: -.025em; margin: 0; }
.gal-sub   { font: 500 13px/1.4 'Inter', sans-serif; color: #64748b; margin: 4px 0 0; }

/* Tabs */
.gal-tabs {
  display: flex; gap: 4px;
  padding: 12px 20px 16px;
  background: var(--bg);
  position: sticky; top: 0; z-index: 10;
}
.gal-tab {
  flex: 1;
  padding: 10px 12px;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 12px;
  font: 700 12px/1 'Inter', sans-serif;
  color: var(--mu);
  letter-spacing: .04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
  font-family: inherit;
  min-height: 44px;
}
.gal-tab.active {
  background: var(--su);
  color: #6366f1;
  border-color: rgba(99,102,241,.25);
  box-shadow: 0 1px 3px rgba(11,13,26,.06);
}
.gal-tab:not(.active):hover { color: #0b0d1a; }

/* Section heading */
.gal-section-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px 8px;
}
.gal-section-title { font: 700 13px/1 'Inter', sans-serif; color: #64748b; letter-spacing: .08em; text-transform: uppercase; }
.gal-section-count { font: 700 12px/1 'Inter', sans-serif; color: #6366f1; background: rgba(99,102,241,.1); border-radius: 20px; padding: 3px 10px; }

/* Grid */
.gal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 16px;
}
@media (max-width: 360px) { .gal-grid { grid-template-columns: 1fr 1fr; } }

.gal-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 18px;
  padding: 14px 10px 12px;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), border-color .15s ease;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(11,13,26,.05);
}
.gal-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--gc, #6366f1) 35%, transparent); }
.gal-card:active { transform: scale(.97); }
.gal-card.locked { opacity: .55; }
.gal-card.locked .gal-card-visual { filter: grayscale(.9); }

.gal-card-visual {
  width: 56px; height: 56px;
  border-radius: 14px;
  margin: 0 auto 8px;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--gc, #6366f1) 12%, #fff);
  overflow: hidden;
  position: relative;
}
.gal-card-visual img { width: 100%; height: 100%; object-fit: contain; }
.gal-card-visual .gal-emoji { font-size: 28px; line-height: 1; }

.gal-card-nom {
  font: 700 11px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 4px;
  letter-spacing: -.005em;
}
.gal-card-meta {
  font: 600 9.5px/1 'Inter', sans-serif;
  color: var(--mu2);
  letter-spacing: .04em;
  text-transform: uppercase;
}
.gal-card.acquis .gal-card-meta { color: #047857; }

/* Lock icon overlay */
.gal-lock-badge {
  position: absolute;
  top: 8px; right: 8px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: rgba(15,23,42,.85);
  color: #fff;
  display: grid; place-items: center;
  font-size: 11px;
  line-height: 1;
}

/* Fonds permis — card un peu plus large */
.gal-permis-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 0 16px;
}
.gal-permis-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 18px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 0 1px 3px rgba(11,13,26,.05);
}
.gal-permis-card.locked { opacity: .55; }
.gal-permis-card.acquis { border-color: rgba(16,185,129,.35); background: linear-gradient(135deg, #ecfdf5 0%, #fff 60%); }
.gal-permis-preview {
  width: 90px; height: 64px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  border: 1px solid rgba(11,13,26,.08);
  box-shadow: 0 4px 14px rgba(11,13,26,.1);
}
.gal-permis-card.locked .gal-permis-preview { filter: grayscale(.85) brightness(.92); }
.gal-permis-info { flex: 1; min-width: 0; }
.gal-permis-nom { font: 800 14px/1.2 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; margin-bottom: 4px; letter-spacing: -.01em; }
.gal-permis-cond { font: 500 12px/1.4 'Inter', sans-serif; color: #64748b; }
.gal-permis-status { flex-shrink: 0; }

/* Hint footer */
.gal-empty-hint {
  margin: 20px 16px 0;
  padding: 18px 16px;
  text-align: center;
  background: var(--su);
  border: 1px dashed #e2e6f2;
  border-radius: 14px;
}
.gal-empty-hint-emoji { font-size: 28px; margin-bottom: 6px; }
.gal-empty-hint-txt { font: 500 12.5px/1.5 'Inter', sans-serif; color: #94a3b8; font-style: italic; }
</style>`;

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page.view', { page: 'galerie', user_role: me.role });

  // Initial skeleton
  root.innerHTML = `${STYLE}<div class="gal">
    <div class="gal-hd">
      <h1 class="gal-title">Ma collection</h1>
      <p class="gal-sub">Tout ce que tu peux débloquer.</p>
    </div>
    <div style="padding:24px;text-align:center;color:#94a3b8">Chargement…</div>
  </div>`;

  // Fetch validations acquises + scores quiz
  let validatedCount = 0;
  let longestStreak = 0;
  let hasPerfectQuiz = false;
  try {
    const [validRes, streakRes, quizRes] = await Promise.allSettled([
      sb.from('validations').select('id', { count: 'exact', head: true }).eq('eleve_id', me.id).eq('statut', 'acquis'),
      sb.from('streaks').select('longest_streak').eq('user_id', me.id).maybeSingle(),
      sb.from('quiz_attempts').select('id').eq('user_id', me.id).gte('score', 100).limit(1),
    ]);
    validatedCount = validRes.value?.count ?? 0;
    longestStreak = streakRes.value?.data?.longest_streak ?? 0;
    hasPerfectQuiz = (quizRes.value?.data?.length ?? 0) > 0;
  } catch (e) {
    console.warn('[galerie] fetch failed', e);
  }

  const ctx = { validatedCount, longestStreak, hasPerfectQuiz, c1ValidatedCount: 0, hasNightSession: false, hasEcoSession: false };
  const trophees = TROPHEES.map(t => ({ ...t, unlocked: t.check ? !!t.check(ctx) : false }));
  const unlockedTrophies = trophees.filter(t => t.unlocked).length;

  // 3 paliers fonds permis (mesh < 10, route 10-19, holo 20+)
  const permisTiers = [
    { key: 'mesh',         min: 0,  max: 9,  nom: 'Mesh', cond: 'Disponible dès le départ', img: ASSETS.permisBg.mesh },
    { key: 'route',        min: 10, max: 19, nom: 'Route', cond: '10 compétences acquises', img: ASSETS.permisBg.route },
    { key: 'holographic',  min: 20, max: 31, nom: 'Holographique', cond: '20 compétences acquises', img: ASSETS.permisBg.holographic },
  ].map(t => ({ ...t, unlocked: validatedCount >= t.min }));
  const unlockedPermisBg = permisTiers.filter(t => t.unlocked).length;

  let activeTab = 'trophees';

  function renderTrophees() {
    const unlocked = trophees.filter(t => t.unlocked);
    const locked   = trophees.filter(t => !t.unlocked);
    return `
      <div class="gal-section-hd">
        <span class="gal-section-title">Débloqués</span>
        <span class="gal-section-count">${unlocked.length}/${trophees.length}</span>
      </div>
      <div class="gal-grid">
        ${unlocked.length === 0 ? '' : unlocked.map(t => renderTrophyCard(t, true)).join('')}
      </div>
      ${unlocked.length === 0 ? `
        <div class="gal-empty-hint">
          <div class="gal-empty-hint-emoji">🏆</div>
          <div class="gal-empty-hint-txt">Aucun trophée débloqué pour l'instant — valide ta première compétence pour commencer !</div>
        </div>
      ` : ''}
      ${locked.length > 0 ? `
        <div class="gal-section-hd" style="margin-top:8px"><span class="gal-section-title">À débloquer</span></div>
        <div class="gal-grid">${locked.map(t => renderTrophyCard(t, false)).join('')}</div>
      ` : ''}
    `;
  }

  function renderTrophyCard(t, unlocked) {
    const color = t.color || '#94a3b8';
    const visual = t.image
      ? `<img src="${esc(t.image)}" alt="${esc(t.nom)}" loading="lazy" />`
      : `<span class="gal-emoji">${esc(t.ico || '🏆')}</span>`;
    return `
      <div class="gal-card ${unlocked ? 'acquis' : 'locked'}" style="--gc:${color}">
        ${!unlocked ? `<div class="gal-lock-badge" aria-hidden="true">🔒</div>` : ''}
        <div class="gal-card-visual">${visual}</div>
        <div class="gal-card-nom">${esc(t.nom)}</div>
        <div class="gal-card-meta">${unlocked ? 'Acquis' : esc(t.desc?.slice(0, 32) || 'Verrouillé')}${!unlocked && t.desc?.length > 32 ? '…' : ''}</div>
      </div>
    `;
  }

  function renderPermisTiers() {
    return `
      <div class="gal-section-hd">
        <span class="gal-section-title">Fonds carte permis</span>
        <span class="gal-section-count">${unlockedPermisBg}/${permisTiers.length}</span>
      </div>
      <div class="gal-permis-grid">
        ${permisTiers.map(t => `
          <div class="gal-permis-card ${t.unlocked ? 'acquis' : 'locked'}">
            <div class="gal-permis-preview" style="background-image:url('${esc(t.img)}')"></div>
            <div class="gal-permis-info">
              <div class="gal-permis-nom">${esc(t.nom)}</div>
              <div class="gal-permis-cond">${esc(t.cond)}</div>
            </div>
            <div class="gal-permis-status">
              ${t.unlocked
                ? `<span style="font:700 10px/1 'Inter',sans-serif;color:#047857;background:rgba(16,185,129,.12);padding:5px 10px;border-radius:99px;text-transform:uppercase;letter-spacing:.06em">Acquis</span>`
                : `<span style="font:700 10px/1 'Inter',sans-serif;color:#94a3b8;background:#f0f2f8;padding:5px 10px;border-radius:99px;text-transform:uppercase;letter-spacing:.06em">🔒 ${esc(`${t.min}`)} comp</span>`}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function render() {
    root.innerHTML = `${STYLE}
      <div class="gal anim-slide-up">
        <div class="gal-hd">
          <h1 class="gal-title">Ma collection</h1>
          <p class="gal-sub">${unlockedTrophies + unlockedPermisBg} récompense${unlockedTrophies + unlockedPermisBg > 1 ? 's' : ''} débloquée${unlockedTrophies + unlockedPermisBg > 1 ? 's' : ''} sur ${trophees.length + permisTiers.length}.</p>
        </div>
        <div class="gal-tabs" role="tablist">
          <button class="gal-tab ${activeTab === 'trophees' ? 'active' : ''}" data-tab="trophees" role="tab" aria-selected="${activeTab === 'trophees'}">Trophées</button>
          <button class="gal-tab ${activeTab === 'permis' ? 'active' : ''}" data-tab="permis" role="tab" aria-selected="${activeTab === 'permis'}">Fonds permis</button>
        </div>
        <div id="gal-content">
          ${activeTab === 'trophees' ? renderTrophees() : renderPermisTiers()}
        </div>
      </div>`;

    root.querySelectorAll('.gal-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab === activeTab) return;
        activeTab = tab;
        track('galerie.tab_switched', { tab });
        render();
      });
    });
  }

  render();
}
