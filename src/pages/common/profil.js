/**
 * Page Profil — commune aux 3 rôles.
 *
 * Affiche :
 *  - Avatar (initiales gradient) + nom + rôle + email
 *  - Sections éditables : nom, téléphone, date de naissance (élève), NEPH (élève)
 *  - Section sécurité : changer mot de passe
 *  - Bouton ⏻ Déconnexion
 *
 * Branchée sur Supabase :
 *  - profiles (read + update)
 *  - auth.updateUser (changement password)
 */

import { sb, logout } from '@/auth/auth.js';
import { getCurUser, setCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { mountNotifBell } from '@/components/notif-bell.js';
import { getTheme, applyTheme } from '@/components/theme-toggle.js';
import { openAvatarModal, renderUserAvatar } from '@/components/avatar-modal.js';

let _root, _me;

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  // Refresh profile depuis la DB pour avoir les data fraîches
  const { data: fresh } = await sb.from('profiles').select('*').eq('id', _me.id).maybeSingle();
  if (fresh) _me = { ..._me, ...fresh };

  root.innerHTML = render(_me);
  wire();

  // Charge les stats moniteur en parallèle (non-bloquant)
  if (_me.role === 'moniteur') loadEnseignantStats();
}

async function loadEnseignantStats() {
  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
  // Lundi de la semaine en cours
  const ws = new Date(now); ws.setHours(0, 0, 0, 0);
  const dayIdx = (ws.getDay() + 6) % 7;
  ws.setDate(ws.getDate() - dayIdx);
  const weekStartIso = ws.toISOString().slice(0, 10);
  const weekEnd = new Date(ws); weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndIso = weekEnd.toISOString().slice(0, 10);

  const [evtsYear, evtsWeek, notations, eleves] = await Promise.allSettled([
    sb.from('events').select('id, t, dur, date_event, eleve_id').eq('moniteur_id', _me.id).eq('is_deleted', false).gte('date_event', yearStart),
    sb.from('events').select('id, t, dur, date_event').eq('moniteur_id', _me.id).eq('is_deleted', false).gte('date_event', weekStartIso).lte('date_event', weekEndIso),
    sb.from('notations').select('note').eq('moniteur_id', _me.id),
    sb.from('profiles').select('id, code_statut').eq('role', 'eleve'),
  ]);

  const yearData = evtsYear.value?.data || [];
  const weekData = evtsWeek.value?.data || [];
  const notatData = notations.value?.data || [];
  const elevesAll = eleves.value?.data || [];

  const isLec = (t) => { const s = (t || '').toLowerCase(); return s === 'conf' || s === 'lecon' || s === 'leçon'; };

  // Filtre par période côté JS
  const inRange = (d, start, end) => d >= start && d <= end;
  const monthData = yearData.filter(e => e.date_event && e.date_event >= monthStart);
  const prevMonthData = yearData.filter(e => e.date_event && inRange(e.date_event, prevMonthStart, prevMonthEnd));

  const hMonth = monthData.filter(e => isLec(e.t)).reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const hPrevMonth = prevMonthData.filter(e => isLec(e.t)).reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const hWeek = weekData.filter(e => isLec(e.t)).reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const hDispoWeek = weekData.filter(e => (e.t || '').toLowerCase() === 'dispo').reduce((s, e) => s + (parseFloat(e.dur) || 0), 0);
  const elevesUniques = new Set(monthData.filter(e => isLec(e.t)).map(e => e.eleve_id).filter(Boolean)).size;
  const avgNote = notatData.length ? (notatData.reduce((s, n) => s + (n.note || 0), 0) / notatData.length) : null;
  const rate = (hWeek + hDispoWeek) > 0 ? Math.round((hWeek / (hWeek + hDispoWeek)) * 100) : 0;
  const elevesPermis = elevesAll.filter(e => e.code_statut === 'Permis obtenu').length;
  // Delta vs mois dernier
  const deltaMonth = hPrevMonth > 0 ? Math.round(((hMonth - hPrevMonth) / hPrevMonth) * 100) : null;

  // Count-up animation pour le rendering
  const { countUp } = await import('@/utils/count-up.js');
  const animateNum = (key, value, opts = {}) => {
    const el = _root.querySelector(`[data-mon-stat="${key}"]`);
    if (el) countUp(el, value, { duration: 900, ...opts });
  };
  animateNum('hweek', hWeek, { decimals: hWeek % 1 ? 1 : 0 });
  animateNum('hmonth', hMonth, { decimals: hMonth % 1 ? 1 : 0 });
  animateNum('eleves', elevesUniques);
  animateNum('rate', rate);

  // Note avec étoile
  const noteEl = _root.querySelector(`[data-mon-stat="note"]`);
  if (noteEl) noteEl.textContent = avgNote !== null ? '⭐ ' + avgNote.toFixed(1) : '—';

  // Delta mois
  if (deltaMonth !== null) {
    const deltaEl = _root.querySelector('[data-mon-delta]');
    if (deltaEl) {
      const sign = deltaMonth >= 0 ? '+' : '';
      const color = deltaMonth >= 0 ? 'var(--gr)' : 'var(--rd)';
      const arrow = deltaMonth >= 0 ? '↗' : '↘';
      deltaEl.innerHTML = `<span style="color:${color};font-weight:800">${arrow} ${sign}${deltaMonth}%</span> vs mois dernier`;
    }
  }

  // Élèves au permis cette année
  const permisEl = _root.querySelector('[data-mon-permis]');
  if (permisEl) permisEl.textContent = elevesPermis;
}

function initials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function roleLabel(role) {
  return ({ eleve: '🎓 Élève', moniteur: '🚗 Enseignant', admin: '👑 Gérant' })[role] || role;
}

function render(me) {
  const isEleve = me.role === 'eleve';
  const isEnseignant = me.role === 'moniteur';
  return `
    <style>
      .pr-wrap{max-width:520px;margin:0 auto;padding:14px}
      .pr-top{display:flex;align-items:center;gap:10px;padding:6px 4px 14px}
      .pr-top .ttl{font-family:var(--fd);font-weight:800;font-size:20px;letter-spacing:-.02em;flex:1}
      .pr-top .sub{font-size:11px;color:var(--mu);margin-top:2px}

      .pr-hero{background:linear-gradient(135deg,var(--a),var(--adk));color:#fff;border-radius:var(--rx);padding:24px 20px;text-align:center;margin-bottom:16px;box-shadow:var(--s2);position:relative}
      .pr-av-wrap{position:relative;width:104px;height:104px;margin:0 auto 12px}
      .pr-av{width:100%;height:100%;border-radius:50%;background:rgba(255,255,255,.18);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:900;font-size:34px;border:3px solid rgba(255,255,255,.35);box-shadow:0 10px 28px -8px rgba(0,0,0,.4);overflow:hidden;cursor:pointer}
      .pr-av img{width:100%;height:100%;object-fit:cover;display:block}
      .pr-av-btn{position:absolute;bottom:-2px;right:-2px;width:34px;height:34px;border-radius:50%;background:#fff;color:var(--a);border:2px solid var(--a);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px -2px rgba(0,0,0,.3);transition:transform .15s,background .15s}
      .pr-av-btn:hover{transform:scale(1.08);background:var(--ap)}
      .pr-av-btn:active{transform:scale(.92)}
      .pr-av-upload{display:none}
      .pr-av-loading{position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;letter-spacing:.5px}
      .pr-av-spin{width:24px;height:24px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:pr-spin .8s linear infinite}
      @keyframes pr-spin{to{transform:rotate(360deg)}}
      .pr-nm{font-family:var(--fd);font-size:22px;font-weight:800;letter-spacing:-.02em}
      .pr-rl{font-size:11.5px;font-weight:700;opacity:.85;margin-top:4px;letter-spacing:.5px}
      .pr-em{font-size:12.5px;opacity:.85;margin-top:8px;font-family:var(--fn)}

      .pr-section{background:var(--su);border:1px solid var(--bo);border-radius:var(--rl);overflow:hidden;margin-bottom:14px;box-shadow:var(--s0)}
      .pr-sec-h{padding:11px 14px;border-bottom:1px solid var(--bo2);display:flex;align-items:center;justify-content:space-between;font-family:var(--fd);font-weight:700;font-size:13px}
      .pr-row{padding:12px 14px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--bo2)}
      .pr-row:last-child{border-bottom:0}
      .pr-row label{font-size:10px;font-weight:800;color:var(--mu);letter-spacing:1px;text-transform:uppercase;min-width:90px;flex-shrink:0}
      .pr-row .val{flex:1;min-width:0;font-size:14px;color:var(--ink);font-weight:500}
      .pr-row .val input{width:100%;height:34px;padding:0 10px;border:1px solid var(--bo);border-radius:7px;font-family:inherit;font-size:13.5px;color:var(--ink);background:var(--su2);box-sizing:border-box}
      .pr-row .val input:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 3px var(--ap)}
      .pr-row button{flex-shrink:0;height:32px;padding:0 12px;font-size:12px;font-weight:700;border-radius:7px;border:1px solid var(--bo);background:var(--bg2);cursor:pointer;font-family:inherit;color:var(--ink)}
      .pr-row button:hover{background:var(--bg)}
      .pr-row button.save{background:var(--a);color:#fff;border-color:var(--a)}
      .pr-row button.save:hover{background:var(--adk)}

      .pr-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
      .pr-actions .btn{height:46px;font-size:13.5px;font-weight:700}
      .pr-logout{background:var(--rdp);color:var(--rd);border-color:var(--rd)}
      .pr-logout:hover{background:#fecaca}
    </style>

    <div class="pr-wrap anim-slide-up">
      <div class="pr-top">
        <span class="pg-logo-txt">PermiGo</span>
        <div style="flex:1">
          <div class="ttl">Mon profil</div>
          <div class="sub">${esc(me.nom)} · ${roleLabel(me.role)}</div>
        </div>
        <span id="pr-bell"></span>
      </div>

      <div class="pr-hero">
        <div class="pr-av-wrap" id="pr-av-wrap">
          <div class="pr-av" id="pr-av" role="button" tabindex="0" aria-label="Changer ma photo de profil">
            ${renderUserAvatar(me, 120).replace(/^<(img|div)/, '<$1 style="width:100%;height:100%;border-radius:0"')}
          </div>
          <button class="pr-av-btn" id="pr-av-btn" type="button" aria-label="Choisir une nouvelle photo">📷</button>
          <input class="pr-av-upload" id="pr-av-upload" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Sélectionner une photo">
        </div>
        <div class="pr-nm">${esc(me.nom)}</div>
        <div class="pr-rl">${roleLabel(me.role)}</div>
        ${me.email ? `<div class="pr-em">${esc(me.email)}</div>` : ''}
      </div>

      <div class="pr-section">
        <div class="pr-sec-h"><div>📝 Mes infos</div></div>
        <div class="pr-row">
          <label>Nom</label>
          <div class="val"><input id="pr-nom" value="${esc(me.nom || '')}" maxlength="60"></div>
          <button class="save" data-field="nom">Modifier</button>
        </div>
        <div class="pr-row">
          <label>Téléphone</label>
          <div class="val"><input id="pr-tel" value="${esc(me.tel || '')}" placeholder="06 12 34 56 78" maxlength="20"></div>
          <button class="save" data-field="tel">Modifier</button>
        </div>
        ${isEleve ? `
          <div class="pr-row">
            <label>Date naiss.</label>
            <div class="val"><input id="pr-dob" type="date" value="${esc(me.dob || '')}"></div>
            <button class="save" data-field="dob">Modifier</button>
          </div>
          <div class="pr-row">
            <label>NEPH</label>
            <div class="val"><input id="pr-neph" value="${esc(me.neph || '')}" placeholder="Numéro NEPH" maxlength="20"></div>
            <button class="save" data-field="neph">Modifier</button>
          </div>
        ` : ''}
      </div>

      ${isEnseignant ? `
        <!-- ╔══ DASHBOARD PERSO MONITEUR ══╗ -->
        <style>
          .pr-mon-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px}
          .pr-mon-stat{padding:14px;background:linear-gradient(135deg,var(--bg2),var(--su));border:1px solid var(--bo);border-radius:10px;text-align:center}
          .pr-mon-stat .v{font-family:var(--fd);font-size:24px;font-weight:900;letter-spacing:-.02em;line-height:1}
          .pr-mon-stat .v small{font-size:12px;color:var(--mu);font-weight:700;margin-left:1px}
          .pr-mon-stat .l{font-size:10.5px;letter-spacing:.06em;color:var(--mu);text-transform:uppercase;font-weight:700;margin-top:5px}
          .pr-mon-stat.note .v{color:var(--am)}
          .pr-mon-stat.hours .v{color:var(--a)}
          .pr-mon-stat.eleves .v{color:var(--gr)}
          .pr-mon-stat.rate .v{color:var(--pu)}
          .pr-link-row{padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;border-top:1px solid var(--bo2);transition:background .12s;text-decoration:none;color:var(--ink)}
          .pr-link-row:hover{background:var(--bg2)}
          .pr-link-row .ic{font-size:18px;line-height:1;flex-shrink:0}
          .pr-link-row .nm{flex:1;font-size:13.5px;font-weight:700}
          .pr-link-row .arr{color:var(--mu2);font-size:14px}
        </style>
        <div class="pr-section">
          <div class="pr-sec-h"><div>📊 Mes statistiques</div></div>
          <div class="pr-mon-stats" id="pr-mon-stats">
            <div class="pr-mon-stat hours">
              <div class="v"><span data-mon-stat="hweek">0</span><small>h</small></div>
              <div class="l">Cette semaine</div>
            </div>
            <div class="pr-mon-stat hours" style="position:relative">
              <div class="v"><span data-mon-stat="hmonth">0</span><small>h</small></div>
              <div class="l">Ce mois</div>
              <div data-mon-delta style="font-size:9.5px;margin-top:4px;color:var(--mu);font-weight:700;letter-spacing:.2px"></div>
            </div>
            <div class="pr-mon-stat note">
              <div class="v"><span data-mon-stat="note">—</span></div>
              <div class="l">Note moyenne</div>
            </div>
            <div class="pr-mon-stat eleves">
              <div class="v"><span data-mon-stat="eleves">0</span></div>
              <div class="l">Élèves actifs</div>
            </div>
            <div class="pr-mon-stat rate" style="grid-column:1/-1;background:linear-gradient(135deg,rgba(139,92,246,.08),var(--su))">
              <div class="v"><span data-mon-stat="rate">0</span><small>%</small></div>
              <div class="l">Taux remplissage (semaine)</div>
            </div>
            <div class="pr-mon-stat" style="grid-column:1/-1;background:linear-gradient(135deg,rgba(245,158,11,.1),var(--su));border-color:rgba(245,158,11,.3)">
              <div class="v" style="color:var(--am);display:flex;align-items:center;justify-content:center;gap:6px">🏆 <span data-mon-permis>0</span></div>
              <div class="l">Élèves au permis cette année</div>
            </div>
          </div>
          <a class="pr-link-row" href="#/lieux">
            <span class="ic">📍</span>
            <span class="nm">Mes lieux RDV favoris</span>
            <span class="arr">›</span>
          </a>
        </div>
      ` : ''}

      <div class="pr-section">
        <div class="pr-sec-h"><div>🎨 Apparence</div></div>
        <style>
          .pr-themes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px 14px}
          .pr-theme{padding:14px 8px;border:1.5px solid var(--bo);background:var(--bg2);border-radius:10px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .15s;color:var(--ink)}
          .pr-theme:hover{border-color:var(--mu2);transform:translateY(-1px)}
          .pr-theme.on{border-color:var(--a);background:var(--ap);box-shadow:0 0 0 3px var(--ap)}
          .pr-theme .em{font-size:22px;line-height:1}
          .pr-theme .lb{font-size:11px;font-weight:700;letter-spacing:.3px}
          .pr-theme .sub{font-size:10px;color:var(--mu);font-weight:600}
        </style>
        <div class="pr-themes" role="group" aria-label="Choisir le thème de l'application">
          <button class="pr-theme" data-theme-pick="auto" type="button"><span class="em">🌓</span><span class="lb">Auto</span><span class="sub">Système</span></button>
          <button class="pr-theme" data-theme-pick="light" type="button"><span class="em">☀️</span><span class="lb">Clair</span><span class="sub">Light</span></button>
          <button class="pr-theme" data-theme-pick="dark" type="button"><span class="em">🌙</span><span class="lb">Sombre</span><span class="sub">Dark</span></button>
        </div>
      </div>

      <div class="pr-section">
        <div class="pr-sec-h"><div>🔒 Sécurité</div></div>
        <div class="pr-row">
          <label>Mot de passe</label>
          <div class="val"><input id="pr-pwd" type="password" placeholder="Nouveau mot de passe (min 8)" minlength="8"></div>
          <button class="save" id="pr-pwd-save">Changer</button>
        </div>
      </div>

      <div class="pr-actions">
        <button class="btn" id="pr-back">‹ Retour</button>
        <button class="btn pr-logout" id="pr-logout">⏻ Déconnexion</button>
      </div>

      <div style="height:24px"></div>
    </div>
  `;
}

function wire() {
  const bellHost = _root.querySelector('#pr-bell');
  if (bellHost) mountNotifBell(bellHost);

  // Save individual fields
  _root.querySelectorAll('.pr-row button.save[data-field]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const field = btn.dataset.field;
      const value = _root.querySelector(`#pr-${field}`).value.trim() || null;
      btn.disabled = true; const orig = btn.textContent; btn.textContent = '…';
      const { error } = await sb.from('profiles').update({ [field]: value }).eq('id', _me.id);
      if (error) { toast('Erreur', 'error'); btn.disabled = false; btn.textContent = orig; return; }
      // MAJ état local
      _me = { ..._me, [field]: value };
      setCurUser(_me);
      toast('Modifié ✓', 'success');
      btn.disabled = false; btn.textContent = orig;
    });
  });

  // ─── Upload photo de profil ───
  const fileInput = _root.querySelector('#pr-av-upload');
  const avEl = _root.querySelector('#pr-av');
  const btnEl = _root.querySelector('#pr-av-btn');

  // Clic sur l'avatar OU le bouton 📷 → ouvre le modal (2 onglets : Photo / Avatars stylés)
  const openModal = () => openAvatarModal({
    onUpdate: () => {
      // Refresh local + UI sans reload complet
      setCurUser({ ..._me });
      const wrap = _root.querySelector('#pr-av');
      if (wrap) wrap.innerHTML = renderUserAvatar(_me, 120).replace(/^<(img|div)/, '<$1 style="width:100%;height:100%;border-radius:0"');
    },
  });
  avEl?.addEventListener('click', openModal);
  btnEl?.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
  avEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
  });

  // Conservé : file input + fallback pour ancien flux direct (au cas où)
  const triggerUpload = () => fileInput?.click();

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('Image trop lourde (max 5 Mo)', 'error');
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast('Format non supporté (JPG, PNG, WebP)', 'error');
      return;
    }

    // Loading overlay
    const wrap = _root.querySelector('#pr-av-wrap');
    const loader = document.createElement('div');
    loader.className = 'pr-av-loading';
    loader.innerHTML = `<div class="pr-av-spin"></div>`;
    wrap.appendChild(loader);

    try {
      // Récupère l'auth_id (UUID Supabase) — c'est ce que les policies storage utilisent
      const { data: authData } = await sb.auth.getUser();
      const authId = authData?.user?.id;
      if (!authId) throw new Error('Pas authentifié');

      // Path : {auth_id}/avatar.{ext}  → la policy storage check (storage.foldername(name))[1] = auth_id
      const ext = file.name.split('.').pop().toLowerCase().replace('jpeg', 'jpg');
      const path = `${authId}/avatar-${Date.now()}.${ext}`;

      // Upload
      const { error: upErr } = await sb.storage.from('avatars').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;

      // URL publique
      const { data: urlData } = sb.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('URL publique non générée');

      // Update profile
      const { error: profErr } = await sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', _me.id);
      if (profErr) throw profErr;

      // Update local + UI
      _me.avatar_url = publicUrl;
      const newMe = { ..._me };
      setCurUser(newMe);

      // Remplace l'avatar
      avEl.innerHTML = `<img src="${publicUrl}" alt="">`;

      toast('Photo de profil mise à jour ✓', 'success');
    } catch (err) {
      console.warn('[avatar] upload err', err);
      toast(err.message || 'Erreur upload', 'error');
    } finally {
      loader.remove();
      fileInput.value = ''; // reset pour pouvoir re-upload même fichier
    }
  });

  // Sélecteur de thème (Auto / Clair / Sombre)
  function repaintThemeButtons() {
    const cur = getTheme();
    _root.querySelectorAll('[data-theme-pick]').forEach(b => {
      b.classList.toggle('on', b.dataset.themePick === cur);
    });
  }
  _root.querySelectorAll('[data-theme-pick]').forEach(b => {
    b.addEventListener('click', () => {
      const mode = b.dataset.themePick;
      localStorage.setItem('pg-theme', mode);
      applyTheme(mode);
      repaintThemeButtons();
      toast(`Thème ${mode === 'auto' ? 'auto' : mode === 'light' ? 'clair' : 'sombre'} ✓`, 'success');
    });
  });
  repaintThemeButtons();

  // Change password
  _root.querySelector('#pr-pwd-save')?.addEventListener('click', async () => {
    const pwd = _root.querySelector('#pr-pwd').value;
    if (!pwd || pwd.length < 8) { toast('8 caractères minimum', 'error'); return; }
    const btn = _root.querySelector('#pr-pwd-save');
    btn.disabled = true; btn.textContent = '…';
    const { error } = await sb.auth.updateUser({ password: pwd });
    if (error) { toast('Erreur : ' + error.message, 'error'); btn.disabled = false; btn.textContent = 'Changer'; return; }
    _root.querySelector('#pr-pwd').value = '';
    toast('Mot de passe modifié ✓', 'success');
    btn.disabled = false; btn.textContent = 'Changer';
  });

  // Retour selon rôle
  _root.querySelector('#pr-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/');
  });

  // Logout
  _root.querySelector('#pr-logout')?.addEventListener('click', async () => {
    await logout();
    const { navigate } = await import('@/router.js');
    navigate('/');
  });
}
