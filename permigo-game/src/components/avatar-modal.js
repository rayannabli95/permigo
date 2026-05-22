/**
 * Avatar Modal — modal avec 2 onglets :
 *  - Photo perso : upload + auto-crop carré 400x400 + Supabase Storage
 *  - Avatars stylés : 6 SVG, certains débloquables avec gemmes
 *
 * Game design business :
 *  - 2 avatars gratuits (commencement)
 *  - 4 avatars premium : 10 / 25 / 50 / 100 gemmes
 *  - Gemmes stockées dans profiles (table à venir) ou localStorage pour MVP
 *
 * Usage :
 *   import { openAvatarModal } from '@/components/avatar-modal.js';
 *   openAvatarModal({ onUpdate: (newUrl) => { ... } });
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';

// ─── Bibliothèque d'avatars SVG ─────────────────────────────────────
export const AVATAR_PRESETS = [
  { id: 'starter-1', name: 'Pilote rookie', cost: 0,  bg: '#ff005b', skin: '#ffb238' },
  { id: 'starter-2', name: 'Aventurier',    cost: 0,  bg: '#0a0310', skin: '#d8fcb3' },
  { id: 'fire',      name: 'Pilote feu',    cost: 10, bg: '#ff7d10', skin: '#0a0310' },
  { id: 'mint',      name: 'Mintée',        cost: 25, bg: '#89fcb3', skin: '#d8fcb3' },
  { id: 'royal',     name: 'Royal',         cost: 50, bg: '#7c3aed', skin: '#fbbf24' },
  { id: 'galaxy',    name: 'Galactique',    cost: 100, bg: '#0e7c66', skin: '#f87171' },
];

export function avatarSvg(preset) {
  const seed = preset.id;
  // Simple "boring avatar" style avec couleurs du preset
  return `
    <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">
      <mask id="m-${seed}" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF"/>
      </mask>
      <g mask="url(#m-${seed})">
        <rect width="36" height="36" fill="${preset.bg}"/>
        <rect x="0" y="0" width="36" height="36" transform="translate(9 -5) rotate(219 18 18) scale(1)" fill="${preset.skin}" rx="6"/>
        <g transform="translate(4.5 -4) rotate(9 18 18)">
          <path d="M15 19c2 1 4 1 6 0" stroke="${preset.bg === '#0a0310' ? '#FFFFFF' : '#000000'}" fill="none" stroke-linecap="round"/>
          <rect x="10" y="14" width="1.5" height="2" rx="1" fill="${preset.bg === '#0a0310' ? '#FFFFFF' : '#000000'}"/>
          <rect x="24" y="14" width="1.5" height="2" rx="1" fill="${preset.bg === '#0a0310' ? '#FFFFFF' : '#000000'}"/>
        </g>
      </g>
    </svg>
  `;
}

// ─── Gemmes (MVP localStorage) ─────────────────────────────────────
const GEMS_KEY = (uid) => `permigo-gems-${uid}`;

export function getGems(uid) {
  return parseInt(localStorage.getItem(GEMS_KEY(uid)) || '120', 10);
}

export function setGems(uid, n) {
  localStorage.setItem(GEMS_KEY(uid), String(Math.max(0, n)));
}

export function addGems(uid, delta) {
  const cur = getGems(uid);
  setGems(uid, cur + delta);
}

// ─── Modal ─────────────────────────────────────────────────────────
let _onUpdate = null;
let _tab = 'photo';
let _selectedPreset = null;
let _filePreview = null;
let _me = null;

export function openAvatarModal({ onUpdate } = {}) {
  _me = getCurUser();
  if (!_me) return;
  _onUpdate = onUpdate;
  _tab = 'photo';
  _selectedPreset = _me.avatar_preset || null;
  _filePreview = null;

  ensureStyles();
  render();
}

function render() {
  let host = document.getElementById('avatar-modal-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'avatar-modal-host';
    document.body.appendChild(host);
  }

  const gems = getGems(_me.id);
  const unlocked = new Set((_me.unlocked_avatars || []).concat(AVATAR_PRESETS.filter(p => p.cost === 0).map(p => p.id)));

  host.innerHTML = `
    <div class="amd-bg"></div>
    <div class="amd-wrap">
      <header class="amd-h">
        <h2 class="amd-ti">Modifier mon avatar</h2>
        <button class="amd-close" type="button" aria-label="Fermer">✕</button>
      </header>

      <div class="amd-tabs" role="tablist">
        <button class="amd-tab ${_tab === 'photo' ? 'on' : ''}" data-tab="photo" type="button">📷 Photo</button>
        <button class="amd-tab ${_tab === 'avatars' ? 'on' : ''}" data-tab="avatars" type="button">🎭 Avatars</button>
      </div>

      <div class="amd-body">
        ${_tab === 'photo' ? renderPhotoTab() : renderAvatarsTab(unlocked, gems)}
      </div>

      <footer class="amd-foot">
        <button class="amd-cancel" type="button">Annuler</button>
        <button class="amd-save" type="button" ${canSave() ? '' : 'disabled'}>
          ${_tab === 'photo' && _filePreview ? 'Enregistrer la photo' : _tab === 'avatars' && _selectedPreset ? 'Choisir cet avatar' : 'Enregistrer'}
        </button>
      </footer>
    </div>
  `;

  requestAnimationFrame(() => host.classList.add('amd-in'));
  wire(host);
}

function canSave() {
  if (_tab === 'photo') return !!_filePreview;
  if (_tab === 'avatars') return !!_selectedPreset;
  return false;
}

function renderPhotoTab() {
  return `
    <div class="amd-photo">
      ${_filePreview ? `
        <div class="amd-preview">
          <img src="${esc(_filePreview)}" alt="Aperçu" />
          <div class="amd-preview-hint">Centré et carré automatiquement</div>
        </div>
        <button class="amd-pick-again" type="button">Choisir une autre photo</button>
      ` : `
        <label class="amd-drop" for="amd-file">
          <div class="amd-drop-em">📷</div>
          <div class="amd-drop-ti">Choisis ta photo</div>
          <div class="amd-drop-sub">JPG, PNG ou WebP · max 5 MB</div>
        </label>
        <input id="amd-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
      `}
    </div>
  `;
}

function renderAvatarsTab(unlocked, gems) {
  return `
    <div class="amd-gems">
      <span class="amd-gems-em">💎</span>
      <span class="amd-gems-val"><b>${gems}</b> gemmes</span>
      <span class="amd-gems-hint">Gagne des gemmes en complétant des compétences REMC</span>
    </div>
    <div class="amd-avatars">
      ${AVATAR_PRESETS.map(p => {
        const isUnlocked = unlocked.has(p.id);
        const isSelected = _selectedPreset === p.id;
        const canAfford = gems >= p.cost;
        return `
          <button
            class="amd-av ${isSelected ? 'sel' : ''} ${isUnlocked ? 'unlocked' : 'locked'}"
            data-preset="${esc(p.id)}"
            data-cost="${p.cost}"
            type="button"
            aria-label="${esc(p.name)} ${isUnlocked ? '' : `(${p.cost} gemmes)`}"
          >
            <div class="amd-av-img">${avatarSvg(p)}</div>
            <div class="amd-av-nm">${esc(p.name)}</div>
            ${isUnlocked ? '' : `
              <div class="amd-av-lock ${canAfford ? '' : 'expensive'}">
                <span class="amd-av-lock-em">🔒</span>
                <span>${p.cost} 💎</span>
              </div>
            `}
            ${isSelected ? `<div class="amd-av-check">✓</div>` : ''}
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function wire(host) {
  const close = () => {
    host.classList.remove('amd-in');
    setTimeout(() => host.remove(), 250);
  };

  host.querySelector('.amd-close')?.addEventListener('click', close);
  host.querySelector('.amd-cancel')?.addEventListener('click', close);
  host.querySelector('.amd-bg')?.addEventListener('click', close);

  // Tabs
  host.querySelectorAll('[data-tab]').forEach(b => {
    b.addEventListener('click', () => {
      _tab = b.dataset.tab;
      render();
    });
  });

  // Photo : file input
  host.querySelector('#amd-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('Image trop grande (max 5 MB)', 'error');
      return;
    }
    try {
      _filePreview = await fileToSquareDataUrl(file, 400);
      render();
    } catch (err) {
      toast('Erreur de lecture de l\'image', 'error');
      console.warn('[avatar] file err', err);
    }
  });

  host.querySelector('.amd-pick-again')?.addEventListener('click', () => {
    _filePreview = null;
    render();
  });

  // Avatars : click sur un avatar
  host.querySelectorAll('[data-preset]').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.dataset.preset;
      const cost = parseInt(b.dataset.cost, 10) || 0;
      const isUnlocked = b.classList.contains('unlocked');

      if (isUnlocked) {
        _selectedPreset = id;
        render();
        return;
      }

      // Sinon : essayer de déverrouiller avec gemmes
      const gems = getGems(_me.id);
      if (gems < cost) {
        toast(`Il te manque ${cost - gems} 💎 pour cet avatar`, 'error');
        return;
      }
      // Confirmation
      if (!confirm(`Débloquer "${AVATAR_PRESETS.find(p => p.id === id)?.name}" pour ${cost} 💎 ?`)) return;
      unlockAvatar(id, cost);
    });
  });

  // Save
  host.querySelector('.amd-save')?.addEventListener('click', async () => {
    const btn = host.querySelector('.amd-save');
    btn.disabled = true;
    btn.textContent = 'Enregistrement…';
    try {
      if (_tab === 'photo' && _filePreview) {
        await uploadPhoto(_filePreview);
      } else if (_tab === 'avatars' && _selectedPreset) {
        await savePreset(_selectedPreset);
      }
      toast('Avatar mis à jour', 'success');
      close();
      if (typeof _onUpdate === 'function') _onUpdate();
    } catch (err) {
      console.warn('[avatar] save err', err);
      toast(err.message || 'Erreur lors de l\'enregistrement', 'error');
      btn.disabled = false;
      btn.textContent = _tab === 'photo' ? 'Enregistrer la photo' : 'Choisir cet avatar';
    }
  });
}

async function unlockAvatar(id, cost) {
  const current = _me.unlocked_avatars || [];
  if (current.includes(id)) return;
  const next = [...current, id];
  const { error } = await sb.from('profiles').update({ unlocked_avatars: next }).eq('id', _me.id);
  if (error) {
    toast('Erreur déverrouillage', 'error');
    console.warn('[avatar] unlock err', error);
    return;
  }
  _me.unlocked_avatars = next;
  setGems(_me.id, getGems(_me.id) - cost);
  _selectedPreset = id;
  toast(`Avatar débloqué ! 🎉`, 'success');
  render();
}

async function savePreset(presetId) {
  // Update profile : avatar_preset + clear avatar_url
  const { error } = await sb.from('profiles')
    .update({ avatar_preset: presetId, avatar_url: null })
    .eq('id', _me.id);
  if (error) throw new Error('Erreur de sauvegarde');
  _me.avatar_preset = presetId;
  _me.avatar_url = null;
}

async function uploadPhoto(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  const path = `${_me.id}/avatar-${Date.now()}.${ext}`;

  const { error: upErr } = await sb.storage.from('avatars').upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);

  const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path);

  const { error: updErr } = await sb.from('profiles')
    .update({ avatar_url: publicUrl, avatar_preset: null })
    .eq('id', _me.id);
  if (updErr) throw new Error(updErr.message);

  _me.avatar_url = publicUrl;
  _me.avatar_preset = null;
}

// Resize + center-crop carré via canvas
function fileToSquareDataUrl(file, size = 400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88));
    };
    img.onerror = () => reject(new Error('Image invalide'));
    img.src = URL.createObjectURL(file);
  });
}

// ─── Styles ────────────────────────────────────────────────────────
let _stylesInjected = false;
function ensureStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const s = document.createElement('style');
  s.id = 'avatar-modal-styles';
  s.textContent = `
    #avatar-modal-host{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;padding:14px;opacity:0;transition:opacity .25s}
    #avatar-modal-host.amd-in{opacity:1}

    .amd-bg{position:absolute;inset:0;background:rgba(8,10,20,.7);backdrop-filter:blur(10px)}

    .amd-wrap{position:relative;background:#fff;color:#0f172a;border-radius:22px;width:100%;max-width:500px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px -16px rgba(0,0,0,.5);transform:translateY(40px) scale(.95);transition:transform .35s cubic-bezier(.34,1.56,.64,1)}
    #avatar-modal-host.amd-in .amd-wrap{transform:translateY(0) scale(1)}

    .amd-h{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px;border-bottom:1px solid #f1f5f9}
    .amd-ti{font-family:var(--fd,system-ui);font-size:18px;font-weight:900;letter-spacing:-.015em;margin:0;color:#0f172a}
    .amd-close{width:32px;height:32px;border-radius:50%;background:#f1f5f9;border:0;cursor:pointer;font-size:14px;color:#64748b;transition:background .15s}
    .amd-close:hover{background:#e2e8f0}

    .amd-tabs{display:flex;gap:6px;padding:14px 22px 0;border-bottom:1px solid #f1f5f9}
    .amd-tab{background:transparent;border:0;padding:10px 14px;font-family:inherit;font-weight:700;font-size:13px;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;letter-spacing:-.005em}
    .amd-tab:hover{color:#0f172a}
    .amd-tab.on{color:#6366f1;border-bottom-color:#6366f1}

    .amd-body{flex:1;overflow-y:auto;padding:22px}

    /* Photo tab */
    .amd-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:48px 20px;border:2px dashed #cbd5e1;border-radius:14px;cursor:pointer;transition:all .2s;background:#f8fafc}
    .amd-drop:hover{border-color:#6366f1;background:#eef2ff}
    .amd-drop-em{font-size:38px;line-height:1}
    .amd-drop-ti{font-family:var(--fd,system-ui);font-weight:800;font-size:15px;color:#0f172a}
    .amd-drop-sub{font-size:12px;color:#64748b}

    .amd-preview{position:relative;aspect-ratio:1;max-width:280px;margin:0 auto 16px;border-radius:16px;overflow:hidden;background:#0f172a;box-shadow:0 10px 30px -8px rgba(15,23,42,.25)}
    .amd-preview img{width:100%;height:100%;display:block;object-fit:cover}
    .amd-preview-hint{position:absolute;bottom:0;left:0;right:0;padding:8px 12px;background:linear-gradient(0deg,rgba(0,0,0,.6),transparent);color:#fff;font-size:11px;font-weight:600;text-align:center}
    .amd-pick-again{display:block;margin:0 auto;background:none;border:0;color:#6366f1;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;padding:8px;text-decoration:underline}

    /* Avatars tab */
    .amd-gems{display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #fbbf24;border-radius:12px;margin-bottom:18px;flex-wrap:wrap}
    .amd-gems-em{font-size:20px}
    .amd-gems-val{font-family:var(--fd,system-ui);font-size:14px;color:#92400e}
    .amd-gems-val b{font-size:18px;font-weight:900}
    .amd-gems-hint{font-size:11px;color:#92400e;opacity:.85;flex:1;min-width:140px}

    .amd-avatars{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .amd-av{position:relative;background:#f8fafc;border:2px solid #e2e8f0;border-radius:14px;padding:10px;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:6px;font-family:inherit}
    .amd-av:hover{transform:translateY(-2px);border-color:#cbd5e1}
    .amd-av.sel{border-color:#6366f1;background:#eef2ff;box-shadow:0 0 0 3px rgba(99,102,241,.15)}
    .amd-av.locked{opacity:.85}
    .amd-av.locked .amd-av-img{filter:grayscale(.6) opacity(.8)}
    .amd-av-img{width:100%;aspect-ratio:1;border-radius:50%;overflow:hidden;background:#f1f5f9;display:flex;align-items:center;justify-content:center}
    .amd-av-nm{font-family:var(--fd,system-ui);font-weight:700;font-size:11.5px;color:#0f172a;text-align:center;letter-spacing:-.005em}
    .amd-av-lock{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:#1c1c1c;color:#fbbf24;font-size:10.5px;font-weight:800;border-radius:99px;letter-spacing:.2px;position:absolute;top:6px;right:6px}
    .amd-av-lock.expensive{background:#7f1d1d;color:#fecaca}
    .amd-av-check{position:absolute;top:6px;left:6px;width:22px;height:22px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900}

    /* Footer */
    .amd-foot{display:flex;gap:10px;padding:16px 22px;border-top:1px solid #f1f5f9;background:#f8fafc}
    .amd-cancel{flex:1;padding:12px 14px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-family:var(--fd,system-ui);font-weight:700;font-size:13.5px;border-radius:11px;cursor:pointer;transition:background .15s}
    .amd-cancel:hover{background:#f1f5f9}
    .amd-save{flex:1.5;padding:12px 14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;color:#fff;font-family:var(--fd,system-ui);font-weight:800;font-size:13.5px;border-radius:11px;cursor:pointer;transition:transform .12s,box-shadow .2s;box-shadow:0 6px 16px -4px rgba(99,102,241,.5)}
    .amd-save:hover:not([disabled]){transform:translateY(-1px);box-shadow:0 10px 24px -4px rgba(99,102,241,.65)}
    .amd-save[disabled]{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}

    @media (max-width:560px){
      .amd-avatars{grid-template-columns:repeat(2,1fr)}
      .amd-h,.amd-tabs,.amd-foot{padding-left:16px;padding-right:16px}
      .amd-body{padding:18px 16px}
    }
  `;
  document.head.appendChild(s);
}

/** Renvoie le HTML pour afficher un avatar (preset OU url) — utilisable partout dans l'app */
export function renderUserAvatar({ avatar_url, avatar_preset, nom }, size = 40) {
  if (avatar_url) {
    return `<img src="${esc(avatar_url)}" alt="${esc(nom || '')}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer">`;
  }
  if (avatar_preset) {
    const p = AVATAR_PRESETS.find(x => x.id === avatar_preset);
    if (p) {
      return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden">${avatarSvg(p)}</div>`;
    }
  }
  // Fallback initiales
  const init = (nom || '?').split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${Math.floor(size * 0.4)}px;font-family:var(--fd,system-ui)">${esc(init)}</div>`;
}
