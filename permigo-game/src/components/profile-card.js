// ═══════════════════════════════════════════════════════════════
// Profile Card — carte profil sociale adaptable élève/enseignant
// Inspiré ProfileCard (React) → vanilla JS, design system PermiGo
// Features :
//  - Avatar + bannière modifiables (Supabase Storage)
//  - Barre XP gamifiée (gradient arc-en-ciel élève / indigo-violet enseignant)
//  - 3 stats animées (rôle-dépendantes)
//  - Bouton Partager natif (Web Share API + fallback)
//  - Badge prestige avec accent color du tier
// ═══════════════════════════════════════════════════════════════
import { esc } from '@/utils/escape.js';
import { sb } from '@/auth/auth.js';
import { getPrestige } from '@/data/prestige.js';
import { haptic } from '@/utils/haptic.js';
import { wrapAnimatedBorder, BORDER_PRESETS } from '@/components/animated-border.js';
import { openAvatarPicker, AVATAR_PICKER_UPLOAD } from '@/components/avatar-picker.js';
import { AVATAR_PRESETS, avatarSvg } from '@/components/avatar-modal.js';

const STYLE = `<style>
.pcc { width: 100%; max-width: 380px; margin: 0 auto; padding: 0; }
.pcc-card {
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(10,13,26,.06), 0 10px 30px -12px rgba(10,13,26,.12);
  position: relative;
}

/* ── Bannière ── */
.pcc-banner {
  position: relative;
  height: 140px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #0891b2);
  overflow: hidden;
}
.pcc-banner img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.pcc-banner::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(255,255,255,.0) 100%);
  pointer-events: none;
}
.pcc-banner-edit {
  position: absolute;
  top: 12px; left: 12px;
  width: 34px; height: 34px;
  border-radius: 50%;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(8px);
  border: 0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: #0a0d1a;
  box-shadow: 0 2px 8px rgba(10,13,26,.15);
  transition: transform .15s ease;
}
.pcc-banner-edit:hover { transform: scale(1.06); }
.pcc-banner-edit:active { transform: scale(.94); }

/* ── Bouton partager (remplace Follow) ── */
.pcc-share {
  position: absolute;
  top: 12px; right: 12px;
  padding: 9px 18px 9px 14px;
  border-radius: 99px;
  background: rgba(255,255,255,.95);
  backdrop-filter: blur(10px);
  border: 0;
  font: 600 13px/1 'Inter', sans-serif;
  color: #0a0d1a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(10,13,26,.12);
  transition: transform .15s ease, background .15s ease;
}
.pcc-share:hover { background: #fff; transform: translateY(-1px); }
.pcc-share:active { transform: scale(.96); }
.pcc-share-ico { font-size: 14px; }

/* ── Body ── */
.pcc-body {
  padding: 0 20px 20px;
  margin-top: -42px;
  position: relative;
}

/* ── Avatar ── */
.pcc-av-wrap {
  position: relative;
  width: 84px; height: 84px;
  margin-bottom: 14px;
}
.pcc-av {
  width: 100%; height: 100%;
  border-radius: 50%;
  border: 4px solid #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(10,13,26,.12);
  display: flex; align-items: center; justify-content: center;
  font: 700 28px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
}
.pcc-av img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.pcc-av-edit {
  position: absolute;
  bottom: 0; right: 0;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  border: 2.5px solid #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 6px rgba(10,13,26,.2);
  transition: transform .15s ease;
}
.pcc-av-edit:hover { transform: scale(1.1); }
.pcc-av-edit:active { transform: scale(.94); }

/* ── Barre XP ── */
.pcc-xp {
  margin-bottom: 16px;
}
.pcc-xp-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pcc-xp-lbl {
  font: 600 10.5px/1 'Inter', sans-serif;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .12em;
  flex-shrink: 0;
}
.pcc-xp-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
}
.pcc-xp-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}
.pcc-xp-fill.gradient-rainbow {
  background: linear-gradient(90deg, #8b5cf6, #ec4899, #f97316, #f59e0b, #10b981, #06b6d4, #6366f1);
}
.pcc-xp-fill.gradient-indigo {
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}
.pcc-xp-val {
  font: 600 11px/1 'Inter', sans-serif;
  color: #0a0d1a;
  flex-shrink: 0;
}

/* ── Badge prestige ── */
.pcc-prestige {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 99px;
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .04em;
  margin-bottom: 12px;
  border: 1px solid;
}
.pcc-prestige-ico { font-size: 13px; line-height: 1; }
.pcc-prestige-num {
  font: 700 10px/1 'Inter', sans-serif;
  background: rgba(0,0,0,.06);
  padding: 3px 6px;
  border-radius: 6px;
}

/* ── Nom + bio ── */
.pcc-name {
  font: 700 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  margin: 0 0 6px;
  letter-spacing: -0.022em;
}
.pcc-bio {
  font: 500 13px/1.5 'Inter', sans-serif;
  color: #64748b;
  margin: 0 0 20px;
}

/* ── Stats grid ── */
.pcc-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 16px 0;
  margin: 0 -4px 16px;
  border-top: 1px solid #e2e6f2;
  border-bottom: 1px solid #e2e6f2;
}
.pcc-stat {
  text-align: center;
  padding: 0 8px;
}
.pcc-stat + .pcc-stat {
  border-left: 1px solid #e2e6f2;
}
.pcc-stat-val {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  margin-bottom: 4px;
  letter-spacing: -0.022em;
}
.pcc-stat-lbl {
  font: 500 11px/1 'Inter', sans-serif;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .04em;
}

/* ── Actions partage social ── */
.pcc-social {
  display: flex;
  justify-content: center;
  gap: 20px;
}
.pcc-social-btn {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: #f8f9fc;
  border: 1px solid #e2e6f2;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #0a0d1a;
  transition: background .12s ease, border-color .12s ease, transform .12s ease;
}
.pcc-social-btn:hover { background: #fff; border-color: #6366f1; color: #6366f1; }
.pcc-social-btn:active { transform: scale(.94); }
.pcc-social-btn svg { width: 18px; height: 18px; }

/* ── Hidden file input ── */
.pcc-file-input { display: none; }

@media (prefers-reduced-motion: reduce) {
  .pcc-card, .pcc-xp-fill, .pcc-share, .pcc-av-edit, .pcc-banner-edit {
    transition: none !important;
  }
}
</style>`;

/**
 * Render la card profile pour un user.
 * @param {Object} opts
 * @param {Object} opts.me - user object {id, prenom, nom, role, ...}
 * @param {string} opts.avatarUrl - URL avatar (peut être null)
 * @param {string} opts.bannerUrl - URL bannière (peut être null)
 * @param {number} opts.count - count métier (compétences validées ou validations faites)
 * @param {{label:string, value:number|string}[]} opts.stats - 3 stats à afficher
 * @param {string} opts.bio - sous-titre / bio courte
 */
export function renderProfileCard({ me, avatarUrl, avatarPreset = null, bannerUrl, count = 0, stats = [], bio = '' }) {
  const role = me.role || 'eleve';
  const { current, next, pctToNext } = getPrestige(role, count);
  const xpBarClass = role === 'enseignant' ? 'gradient-indigo' : 'gradient-rainbow';
  const initials = ((me.prenom || '')[0] || '') + ((me.nom || '')[0] || '');
  const displayName = `${me.prenom || ''} ${me.nom || ''}`.trim() || 'Élève';

  const stats3 = stats.slice(0, 3);
  while (stats3.length < 3) stats3.push({ label: '—', value: 0 });

  // Avatar : url uploadée > preset choisi (SVG) > initiales
  const presetObj = avatarPreset ? AVATAR_PRESETS.find(p => p.id === avatarPreset) : null;
  const avatarInner = avatarUrl
    ? `<img src="${esc(avatarUrl)}" alt="${esc(displayName)}" />`
    : presetObj
      ? avatarSvg(presetObj)
      : esc((initials || '?').toUpperCase());

  // Border preset selon le rôle : moniteur=cyan / élève=violet / gerant=gold
  const borderPreset = role === 'enseignant' ? BORDER_PRESETS.cyan
                     : role === 'gerant'     ? BORDER_PRESETS.gold
                     : BORDER_PRESETS.violet;

  return `${STYLE}
<div class="pcc">
  ${wrapAnimatedBorder(`<div class="pcc-card">
    <div class="pcc-banner">
      ${bannerUrl ? `<img src="${esc(bannerUrl)}" alt="" />` : ''}
      <button class="pcc-banner-edit" data-action="edit-banner" aria-label="Modifier la bannière" title="Modifier la bannière">✎</button>
      <button class="pcc-share" data-action="share" aria-label="Partager mon profil">
        <span class="pcc-share-ico">↗</span> Partager
      </button>
    </div>

    <div class="pcc-body">
      <div class="pcc-av-wrap">
        <div class="pcc-av">
          ${avatarInner}
        </div>
        <button class="pcc-av-edit" data-action="edit-avatar" aria-label="Modifier la photo" title="Modifier la photo">✎</button>
      </div>

      <div class="pcc-prestige" style="color:${esc(current.accent)};background:${esc(current.accent)}1a;border-color:${esc(current.accent)}40">
        <span class="pcc-prestige-ico">${current.emoji}</span>
        <span>${esc(current.name)}</span>
        <span class="pcc-prestige-num">P${current.p}</span>
      </div>

      <h2 class="pcc-name">${esc(displayName)}</h2>
      ${bio ? `<p class="pcc-bio">${esc(bio)}</p>` : ''}

      <div class="pcc-xp">
        <div class="pcc-xp-row">
          <span class="pcc-xp-lbl">${next ? 'Prog.' : 'Max'}</span>
          <div class="pcc-xp-bar">
            <div class="pcc-xp-fill ${xpBarClass}" style="width:${pctToNext}%"></div>
          </div>
          <span class="pcc-xp-val">${next ? `→ ${esc(next.name)}` : '✓ Élite'}</span>
        </div>
      </div>

      <div class="pcc-stats">
        ${stats3.map(s => `
          <div class="pcc-stat">
            <div class="pcc-stat-val" data-target="${s.value}">0</div>
            <div class="pcc-stat-lbl">${esc(s.label)}</div>
          </div>
        `).join('')}
      </div>

      <div class="pcc-social">
        <button class="pcc-social-btn" data-action="share-whatsapp" aria-label="Partager sur WhatsApp" title="WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9s-.5-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1c-.3-.1-1.2-.5-2.3-1.4-.8-.8-1.4-1.7-1.5-2s0-.3.1-.5c.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5s-.6-1.4-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.2-1 1-1 2.4s1 2.8 1.2 3 2.1 3.1 5.1 4.3c.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.5.8 3.1 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
        </button>
        <button class="pcc-social-btn" data-action="share-instagram" aria-label="Partager sur Instagram" title="Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        </button>
        <button class="pcc-social-btn" data-action="copy-link" aria-label="Copier le lien" title="Copier le lien">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
      </div>
    </div>
  </div>`, { ...borderPreset, radius: 28, borderWidth: 2.5, bg: '#fff' })}

  <input type="file" class="pcc-file-input" accept="image/*" data-target="avatar" />
  <input type="file" class="pcc-file-input" accept="image/*" data-target="banner" />
</div>`;
}

/**
 * Anime les compteurs de 0 vers leur valeur cible.
 */
function animateStats(root) {
  if (matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    root.querySelectorAll('[data-target]').forEach(el => {
      el.textContent = formatNum(parseFloat(el.dataset.target));
    });
    return;
  }
  const duration = 1200;
  const start = performance.now();
  const items = [...root.querySelectorAll('[data-target]')].map(el => ({
    el, target: parseFloat(el.dataset.target) || 0,
  }));
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    items.forEach(it => {
      it.el.textContent = formatNum(Math.round(it.target * eased));
    });
    if (t < 1) requestAnimationFrame(frame);
    else items.forEach(it => { it.el.textContent = formatNum(it.target); });
  }
  requestAnimationFrame(frame);
}

function formatNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

/**
 * Upload une image dans le bucket user-media et update profiles.{column}_url
 */
async function uploadAndSet(userId, file, kind /* 'avatar' | 'banner' */, onProgress) {
  if (!file) return null;
  if (file.size > 5 * 1024 * 1024) {
    const { toast } = await import('@/components/toast.js');
    toast('Image trop grosse (max 5 MB)', 'error');
    return null;
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;

  const { error } = await sb.storage.from('user-media').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    const { toast } = await import('@/components/toast.js');
    toast('Échec upload : ' + (error.message || ''), 'error');
    return null;
  }
  const { data } = sb.storage.from('user-media').getPublicUrl(path);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) return null;

  const column = kind === 'avatar' ? 'avatar_url' : 'banner_url';
  const { error: errUpd } = await sb.from('profiles').update({ [column]: publicUrl }).eq('id', userId);
  if (errUpd) {
    const { toast } = await import('@/components/toast.js');
    toast('URL non persistée — réessaie', 'error');
    return null;
  }
  return publicUrl;
}

// Helper : enveloppe un handler async pour capturer les rejets
async function safeRun(fn, label = 'handler') {
  try { await fn(); }
  catch (e) {
    console.error(`[profile-card] ${label} failed`, e);
    const { toast } = await import('@/components/toast.js');
    toast('Action impossible — réessaie', 'error');
  }
}

/**
 * Mount + branche tous les listeners (édit photo, édit bannière, partage).
 */
export function mountProfileCard(container, opts) {
  const { me, shareUrl, shareText, avatarUrl } = opts;
  container.innerHTML = renderProfileCard(opts);
  const card = container.querySelector('.pcc');
  if (!card) return;

  // Anime les stats
  setTimeout(() => animateStats(card), 200);

  // Edit avatar — ouvre d'abord le picker (6 défauts + option "Ma photo")
  const avInput = card.querySelector('.pcc-file-input[data-target="avatar"]');
  card.querySelector('[data-action="edit-avatar"]').addEventListener('click', async () => {
    haptic('select');
    try {
      const choice = await openAvatarPicker({ currentUrl: avatarUrl ?? me.avatar_url ?? null });
      if (!choice) return; // annulé
      if (choice === AVATAR_PICKER_UPLOAD) {
        avInput.click(); // déclenche le file picker existant
        return;
      }
      // Avatar par défaut sélectionné — persist direct, pas d'upload
      await safeRun(async () => {
        const { error } = await sb.from('profiles').update({ avatar_url: choice }).eq('id', me.id);
        if (error) throw error;
        const avEl = card.querySelector('.pcc-av');
        avEl.innerHTML = `<img src="${esc(choice)}" alt="" />`;
        haptic('success');
        const { toast } = await import('@/components/toast.js');
        toast('Avatar mis à jour ✓', 'success', 2500);
      }, 'avatar default pick');
    } catch (e) {
      console.warn('[profile-card] avatar picker failed', e);
    }
  });
  avInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    safeRun(async () => {
      const url = await uploadAndSet(me.id, file, 'avatar');
      if (url) {
        const avEl = card.querySelector('.pcc-av');
        avEl.innerHTML = `<img src="${url}" alt="" />`;
        haptic('success');
        const { toast } = await import('@/components/toast.js');
        toast('Photo mise à jour ✓', 'success', 2500);
      }
    }, 'avatar upload').finally(() => { avInput.value = ''; });
  });

  // Edit banner
  const bnInput = card.querySelector('.pcc-file-input[data-target="banner"]');
  card.querySelector('[data-action="edit-banner"]').addEventListener('click', () => {
    haptic('select');
    bnInput.click();
  });
  bnInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    safeRun(async () => {
      const url = await uploadAndSet(me.id, file, 'banner');
      if (url) {
        const bnEl = card.querySelector('.pcc-banner');
        const existing = bnEl.querySelector('img');
        if (existing) existing.src = url;
        else bnEl.insertAdjacentHTML('afterbegin', `<img src="${url}" alt="" />`);
        haptic('success');
        const { toast } = await import('@/components/toast.js');
        toast('Bannière mise à jour ✓', 'success', 2500);
      }
    }, 'banner upload').finally(() => { bnInput.value = ''; });
  });

  // Share natif
  const shareData = {
    title: 'PermiGo',
    text: shareText || 'Suis ma progression sur PermiGo',
    url: shareUrl || window.location.origin,
  };

  card.querySelector('[data-action="share"]').addEventListener('click', async () => {
    haptic('select');
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await copyLink(shareData.url, card);
    }
  });

  card.querySelector('[data-action="share-whatsapp"]').addEventListener('click', () => {
    haptic('tap');
    const url = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
    window.open(url, '_blank', 'noopener');
  });

  card.querySelector('[data-action="share-instagram"]').addEventListener('click', async () => {
    haptic('tap');
    // Instagram n'a pas d'URL share direct → on copie le lien
    await copyLink(shareData.url, card);
    const { toast } = await import('@/components/toast.js');
    toast('Lien copié — colle-le dans Instagram', 'info', 3000);
  });

  card.querySelector('[data-action="copy-link"]').addEventListener('click', async () => {
    haptic('tap');
    await copyLink(shareData.url, card);
  });
}

async function copyLink(url, card) {
  try {
    await navigator.clipboard.writeText(url);
    const { toast } = await import('@/components/toast.js');
    toast('Lien copié ✓', 'success', 2000);
  } catch {
    const { toast } = await import('@/components/toast.js');
    toast('Impossible de copier', 'error');
  }
}
