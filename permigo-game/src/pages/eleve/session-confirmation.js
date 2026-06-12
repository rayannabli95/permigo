// ═══════════════════════════════════════════════════════════════
// Élève — Confirmation de séance
// Route : #/sessions/{session_id}
// L'élève confirme ou refuse la séance enregistrée par son moniteur
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/common/toast.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { icon } from '@/utils/icons.js';
import { haptic } from '@/utils/haptic.js';

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.sc {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 110px;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--ink);
  min-height: 100dvh;
}

/* ── Skeleton ── */
.sc-skel {
  background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
  background-size: 200% 100%;
  animation: scShim 1.4s ease-in-out infinite;
  border-radius: 20px;
}
@keyframes scShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* ── Back header ── */
.sc-hd {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
  background: color-mix(in srgb, var(--su2) 94%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 10px 16px;
  border-bottom: 1px solid var(--bo);
  display: flex;
  align-items: center;
  gap: 10px;
}
.sc-back {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--bg2);
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.sc-back:active { background: var(--bo); transform: scale(.93); }
.sc-hd-title {
  font: 700 16px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  flex: 1;
}

/* ── HERO moniteur ── */
.sc-hero {
  position: relative;
  overflow: hidden;
  padding: 40px 24px 32px;
  background: linear-gradient(160deg, var(--ink) 0%, var(--ink4) 50%, #1e1b4b 100%);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.sc-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 70% 60% at 80% 20%, color-mix(in srgb, var(--a) 30%, transparent) 0%, transparent 55%);
  pointer-events: none;
}
.sc-hero-content { position: relative; z-index: 1; }
.sc-hero-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.sc-hero-av {
  width: 60px; height: 60px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--a) 30%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--a) 50%, transparent);
  display: flex; align-items: center; justify-content: center;
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
}
.sc-hero-av img { width: 100%; height: 100%; object-fit: cover; }
.sc-hero-info { flex: 1; }
.sc-hero-label {
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.5);
  letter-spacing: .06em;
  text-transform: uppercase;
  margin-bottom: 5px;
}
.sc-hero-name {
  font: 800 26px/1.1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -.025em;
}

/* ── Carte récap session ── */
.sc-recap {
  margin: 16px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.sc-recap-title {
  font: 600 11px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--mu2);
  margin-bottom: 14px;
}
.sc-recap-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--bo2);
}
.sc-recap-row:last-of-type { border-bottom: none; }
.sc-recap-ico {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--a) 8%, transparent);
  display: flex; align-items: center; justify-content: center;
  color: var(--a-txt);
  flex-shrink: 0;
}
.sc-recap-lbl {
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  margin-bottom: 3px;
}
.sc-recap-val {
  font: 600 14px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
}

/* ── Compétences validées ── */
.sc-comps {
  margin: 0 16px 16px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.sc-comps-title {
  font: 600 11px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--mu2);
  margin-bottom: 14px;
}
.sc-comp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--bo2);
}
.sc-comp-row:last-child { border-bottom: none; }
.sc-comp-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--gr);
  flex-shrink: 0;
}
.sc-comp-name {
  font: 600 13px/1.3 'Inter', sans-serif;
  color: var(--ink);
  flex: 1;
}
.sc-comp-status {
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--gr-txt);
  background: rgba(16,185,129,.1);
  border-radius: 99px;
  padding: 3px 8px;
  flex-shrink: 0;
}
.sc-comps-empty {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--mu2);
  text-align: center;
  padding: 8px 0;
}

/* ── Commentaire moniteur ── */
.sc-comment {
  margin: 0 16px 16px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--a) 7%, transparent) 0%, color-mix(in srgb, var(--a) 4%, transparent) 100%);
  border: 1.5px solid color-mix(in srgb, var(--a) 15%, transparent);
  border-radius: 24px;
  padding: 20px;
}
.sc-comment-label {
  font: 600 11px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--a-txt);
  margin-bottom: 10px;
}
.sc-comment-text {
  font: 500 15px/1.5 'Inter', sans-serif;
  color: var(--ink4);
  font-style: italic;
}

/* ── CTAs sticky en bas ── */
.sc-actions {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding: 12px 16px max(16px, env(safe-area-inset-bottom, 16px));
  background: color-mix(in srgb, var(--su2) 94%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--bo);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 350;
}
.sc-btn-confirm {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 16px 24px;
  background: var(--a);
  border: none; border-radius: 16px;
  color: var(--a-ink);
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; min-height: 54px;
  box-shadow: 0 8px 24px -6px color-mix(in srgb, var(--a) 45%, transparent);
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s cubic-bezier(.34,1.56,.64,1), opacity .12s;
}
.sc-btn-confirm:active { transform: scale(.97); }
.sc-btn-confirm:disabled { opacity: .6; cursor: default; }
.sc-btn-refuse {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 12px 24px;
  background: none; border: 1.5px solid #fca5a5;
  border-radius: 14px; color: var(--rd-txt);
  font: 600 13px/1 'Inter', sans-serif;
  cursor: pointer; min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.sc-btn-refuse:active { background: rgba(239,68,68,.05); }

/* ── Modal refus ── */
.sc-modal-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  z-index: 200;
  display: flex; align-items: flex-end;
  backdrop-filter: blur(4px);
}
.sc-modal {
  background: var(--su);
  border-radius: 28px 28px 0 0;
  padding: 24px 20px max(24px, env(safe-area-inset-bottom));
  width: 100%; max-width: 480px; margin: 0 auto;
}
.sc-modal-title {
  font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 8px;
}
.sc-modal-sub {
  font: 500 14px/1.4 'Inter', sans-serif;
  color: var(--mu);
  margin-bottom: 20px;
}
.sc-modal-confirm-refuse {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px 20px;
  background: var(--rd); border: none; border-radius: 14px;
  color: #fff; font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; min-height: 50px; margin-bottom: 8px;
  -webkit-tap-highlight-color: transparent;
}
.sc-modal-cancel {
  width: 100%; padding: 12px;
  background: none; border: none;
  color: var(--mu); font: 600 13px/1 'Inter', sans-serif;
  cursor: pointer;
}
    @media (prefers-reduced-motion: reduce){
      *,*::before,*::after{
        animation-duration:.001ms!important;animation-iteration-count:1!important;
        transition-duration:.001ms!important;scroll-behavior:auto!important}
    }
</style>`;

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root, sessionId) {
  const me = getCurUser();
  if (!me || me.role !== 'eleve') return;

  if (!sessionId) {
    navigate('#/');
    return;
  }

  track('page.view', { page: 'eleve_session_confirmation', session_id: sessionId });

  root.innerHTML = `${STYLE}
    <div class="sc">
      <div class="sc-hd">
        <button class="sc-back" id="sc-back-btn" aria-label="Retour">${icon('arrow-left', { size: 18, strokeWidth: 2.5 })}</button>
        <div class="sc-hd-title">Confirmer la séance</div>
      </div>
      <div class="sc-skel" style="height:200px;border-radius:0"></div>
      <div class="sc-skel" style="height:120px;margin:16px"></div>
      <div class="sc-skel" style="height:100px;margin:16px"></div>
    </div>`;

  root.querySelector('#sc-back-btn')?.addEventListener('click', () => navigate('#/'));

  // ─── Fetch session ───────────────────────────────────────────
  const { data: session, error } = await sb
    .from('sessions_moniteur')
    .select('*, moniteur:profiles!moniteur_id(id, prenom, nom, avatar_url)')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !session) {
    toast('Séance introuvable', 'error');
    navigate('#/');
    return;
  }

  // Fetch compétences validées pendant cette séance
  const sessionDate = session.session_date ?? session.created_at;
  const { data: validations } = await sb
    .from('validations')
    .select('competence_id, competences_remc!competence_id(nom), statut')
    .eq('eleve_id', me.id)
    .eq('validated_by', session.moniteur_id)
    .gte('validated_at', sessionDate);

  const comps = validations ?? [];

  // ─── Render ─────────────────────────────────────────────────
  const mon       = session.moniteur ?? {};
  const monPrenom = mon.prenom ?? 'Moniteur';
  const monNom    = mon.nom ?? '';
  const initials  = ((monPrenom[0] ?? '') + (monNom[0] ?? '')).toUpperCase() || 'M';

  const dateStr = session.session_date
    ? new Date(session.session_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date inconnue';
  const durStr  = session.duration_minutes
    ? `${Math.floor(session.duration_minutes / 60) > 0 ? `${Math.floor(session.duration_minutes / 60)}h` : ''}${session.duration_minutes % 60 > 0 ? `${session.duration_minutes % 60}min` : ''}`.trim()
    : null;

  root.innerHTML = `${STYLE}
    <div class="sc anim-slide-up">

      <div class="sc-hd">
        <button class="sc-back" id="sc-back-btn" aria-label="Retour">${icon('arrow-left', { size: 18, strokeWidth: 2.5 })}</button>
        <h1 class="sc-hd-title" tabindex="-1">Confirmer la séance</h1>
      </div>

      <!-- HERO moniteur -->
      <div class="sc-hero">
        <div class="sc-hero-content">
          <div class="sc-hero-top">
            <div class="sc-hero-av">
              ${mon.avatar_url
                ? `<img src="${esc(mon.avatar_url)}" alt="${esc(monPrenom)}" loading="lazy">`
                : esc(initials)}
            </div>
            <div class="sc-hero-info">
              <div class="sc-hero-label">Séance avec</div>
              <div class="sc-hero-name">${esc(monPrenom)} ${esc(monNom)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Récap session -->
      <div class="sc-recap">
        <div class="sc-recap-title">Détails de la séance</div>
        <div class="sc-recap-row">
          <div class="sc-recap-ico">${icon('calendar', { size: 16 })}</div>
          <div>
            <div class="sc-recap-lbl">Date</div>
            <div class="sc-recap-val">${esc(dateStr)}</div>
          </div>
        </div>
        ${durStr ? `
        <div class="sc-recap-row">
          <div class="sc-recap-ico">${icon('clock', { size: 16 })}</div>
          <div>
            <div class="sc-recap-lbl">Durée</div>
            <div class="sc-recap-val">${esc(durStr)}</div>
          </div>
        </div>` : ''}
      </div>

      <!-- Compétences validées -->
      ${comps.length > 0 ? `
      <div class="sc-comps">
        <div class="sc-comps-title">Compétences validées · ${comps.length}</div>
        ${comps.map(v => `
          <div class="sc-comp-row">
            <div class="sc-comp-dot"></div>
            <div class="sc-comp-name">${esc(v.competences_remc?.nom ?? v.competence_id)}</div>
            <div class="sc-comp-status">${icon('check', { size: 10, strokeWidth: 3 })} Acquis</div>
          </div>
        `).join('')}
      </div>` : ''}

      <!-- Commentaire moniteur -->
      ${session.notes ? `
      <div class="sc-comment">
        <div class="sc-comment-label">Retour de ${esc(monPrenom)}</div>
        <div class="sc-comment-text">"${esc(session.notes)}"</div>
      </div>` : ''}

    </div>

    <!-- CTAs sticky -->
    <div class="sc-actions">
      <button class="sc-btn-confirm" id="sc-confirm-btn" data-session-id="${esc(sessionId)}">
        ${icon('check', { size: 16, strokeWidth: 2.8 })}
        Confirmer la séance
      </button>
      <button class="sc-btn-refuse" id="sc-refuse-btn">
        ${icon('x', { size: 14, strokeWidth: 2.5 })}
        Refuser
      </button>
    </div>`;

  wire(root, { sessionId, monPrenom });
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, { sessionId, monPrenom }) {
  root.querySelector('#sc-back-btn')?.addEventListener('click', () => {
    haptic('select');
    navigate('#/');
  });

  // Confirmer
  root.querySelector('#sc-confirm-btn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    haptic('success');
    btn.disabled = true;
    btn.innerHTML = `<div style="width:18px;height:18px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></div> En cours…`;
    try {
      const { data, error } = await sb.rpc('confirm_session', {
        p_session_id: sessionId,
        p_status: 'confirmed',
      });
      if (error || data?.error) throw (error || new Error(data.error));
      track('session.confirmed', { session_id: sessionId });
      navigator.vibrate?.(50);
      toast('Séance confirmée ✓', 'success');
      setTimeout(() => navigate('#/'), 800);
    } catch (err) {
      console.error('[session-confirmation] confirm', err);
      const msg = translateSessionError(err?.message) || 'réessaie dans un instant';
      toast(`Impossible de confirmer — ${msg}`, 'error');
      btn.disabled = false;
      btn.innerHTML = `${icon('check', { size: 16, strokeWidth: 2.8 })} Confirmer la séance`;
    }
  });

  // Refuser → modal
  root.querySelector('#sc-refuse-btn')?.addEventListener('click', () => {
    haptic('warning');
    showRefuseModal(root, sessionId, monPrenom);
  });
}

// Traduit les codes d'erreur backend RPC confirm_session en messages FR lisibles
function translateSessionError(code) {
  const map = {
    already_decided: 'cette séance a déjà été traitée',
    not_found:       'séance introuvable',
    forbidden:       'tu n\'as pas accès à cette séance',
    invalid_status:  'statut de séance invalide',
  };
  return map[code] || null;
}

// ─── Modal confirmation refus ────────────────────────────────────
function showRefuseModal(root, sessionId, monPrenom) {
  const modal = document.createElement('div');
  modal.className = 'sc-modal-bg';
  modal.innerHTML = `
    <div class="sc-modal">
      <div class="sc-modal-title">Refuser la séance ?</div>
      <div class="sc-modal-sub">${esc(monPrenom)} sera notifié du refus.</div>
      <button class="sc-modal-confirm-refuse" id="sc-modal-refuse-confirm">
        ${icon('x-circle', { size: 16 })} Oui, refuser
      </button>
      <button class="sc-modal-cancel" id="sc-modal-cancel">Annuler</button>
    </div>`;

  document.body.appendChild(modal);
  modal.querySelector('#sc-modal-cancel')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  modal.querySelector('#sc-modal-refuse-confirm')?.addEventListener('click', async () => {
    const btn = modal.querySelector('#sc-modal-refuse-confirm');
    btn.disabled = true;
    btn.textContent = 'En cours…';
    try {
      const { data, error } = await sb.rpc('confirm_session', {
        p_session_id: sessionId,
        p_status: 'refused',
      });
      if (error || data?.error) throw (error || new Error(data.error));
      track('session.refused', { session_id: sessionId });
      modal.remove();
      toast('Séance refusée', 'info');
      setTimeout(() => navigate('#/'), 800);
    } catch (err) {
      console.error('[session-confirmation] refuse', err);
      const msg = translateSessionError(err?.message) || 'réessaie dans un instant';
      toast(`Impossible de refuser — ${msg}`, 'error');
      btn.disabled = false;
      btn.innerHTML = `${icon('x-circle', { size: 16 })} Oui, refuser`;
    }
  });
}
