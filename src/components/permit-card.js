/**
 * Permit Card — vrai-faux permis de conduire stylé pour l'élève en formation.
 *
 * Format réaliste (ratio 1.586:1, comme une vraie carte ID), flip 3D au tap,
 * recto = identité + photo + ligue + status "EN FORMATION",
 * verso = stats détaillées + date estimée examen.
 *
 * Hologramme CSS animé + tampon "EN FORMATION" stylé.
 *
 * Usage :
 *   import { renderPermitCard, wirePermitCard, ensurePermitStyles } from '@/components/permit-card.js';
 *   ensurePermitStyles();
 *   `<div>${renderPermitCard({ me, stats, doneCount, totalCount, dateDebut, forfait, heuresFaites })}</div>`
 *   wirePermitCard(root);
 */

import { esc } from '@/utils/escape.js';
import { getEquipped } from '@/utils/game-state.js';

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function formatDateFr(iso) {
  if (!iso) return '—';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '—';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function formatNeph(neph) {
  if (!neph) return '— — — — — — — —';
  return String(neph).replace(/(.{4})/g, '$1 ').trim();
}

/**
 * @param {Object} opts
 * @param {Object} opts.me            - profil élève (nom, dob, neph, created_at, code_statut, forfait_h)
 * @param {Object} opts.stats         - { league }
 * @param {number} opts.doneCount     - nb comp acquises
 * @param {number} opts.totalCount    - total comp (31)
 * @param {number} opts.heuresFaites  - heures de conduite réalisées
 * @param {number} opts.forfait       - forfait total
 */
export function renderPermitCard({ me, stats, doneCount, totalCount, heuresFaites = 0, forfait = 20 }) {
  const nom = (me?.nom || '').split(/\s+/);
  const lastName = nom.length > 1 ? nom.slice(-1)[0].toUpperCase() : (me?.nom || '').toUpperCase();
  const firstName = nom.length > 1 ? nom.slice(0, -1).join(' ') : '';
  const dob = formatDateFr(me?.dob);
  const dateDebut = formatDateFr(me?.created_at);
  const neph = formatNeph(me?.neph || '');
  const pctReady = Math.round((doneCount / totalCount) * 100);
  const heuresRestantes = Math.max(0, forfait - heuresFaites);
  const league = stats?.league || { name: 'Bronze', emoji: '🥉', color: '#a16207' };

  // ID conducteur : hash simple à partir de l'ID Supabase
  const conductorId = (me?.id || '').slice(0, 8).toUpperCase();

  const equipped = getEquipped();
  const permitSkin = equipped.permit ? `skin-${equipped.permit.replace('permit-', '')}` : '';

  return `
    <div class="permit-card-wrap" id="permit-card-wrap">
      <div class="permit-card ${permitSkin}" id="permit-card" role="button" tabindex="0" aria-label="Carte de conducteur en formation, tap pour retourner">
        <!-- ╔══ RECTO ══════════════════════════════════════════╗ -->
        <div class="permit-face permit-front">
          <div class="permit-holo" aria-hidden="true"></div>
          <div class="permit-pattern" aria-hidden="true"></div>

          <div class="permit-header">
            <div class="permit-flag">
              <span class="permit-bar permit-blue"></span>
              <span class="permit-bar permit-white"></span>
              <span class="permit-bar permit-red"></span>
            </div>
            <div class="permit-titles">
              <div class="permit-country">RÉPUBLIQUE PERMIGO</div>
              <div class="permit-title">PERMIS DE CONDUIRE</div>
              <div class="permit-subtitle">EN FORMATION · CATÉGORIE B</div>
            </div>
            <div class="permit-logo-pg" aria-label="PermiGo">
              <span class="pg-logo-txt">PermiGo</span>
              <span class="permit-logo-fb" style="display:none">PG</span>
            </div>
          </div>

          <div class="permit-body">
            <div class="permit-photo" aria-label="Photo de profil">
              <div class="permit-photo-inner">
                ${me?.avatar_url
                  ? `<img src="${esc(me.avatar_url)}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="permit-photo-fallback" style="display:none">${esc(initials(me?.nom))}</span>`
                  : `<span class="permit-photo-fallback">${esc(initials(me?.nom))}</span>`}
              </div>
              <div class="permit-photo-tag">${league.emoji}</div>
            </div>
            <div class="permit-info">
              <div class="permit-field">
                <span class="lbl">1. Nom</span>
                <span class="val">${esc(lastName) || '—'}</span>
              </div>
              <div class="permit-field">
                <span class="lbl">2. Prénom</span>
                <span class="val">${esc(firstName) || '—'}</span>
              </div>
              <div class="permit-field-row">
                <div class="permit-field">
                  <span class="lbl">3. Né(e) le</span>
                  <span class="val">${esc(dob)}</span>
                </div>
                <div class="permit-field">
                  <span class="lbl">4. Début formation</span>
                  <span class="val">${esc(dateDebut)}</span>
                </div>
              </div>
              <div class="permit-field">
                <span class="lbl">5. NEPH</span>
                <span class="val mono">${esc(neph)}</span>
              </div>
            </div>
          </div>

          <div class="permit-footer">
            <div class="permit-status">
              <div class="permit-stamp" aria-hidden="true">
                <div class="permit-stamp-inner">EN<br>FORMATION</div>
              </div>
            </div>
            <div class="permit-readiness">
              <div class="permit-readiness-lbl">PRÊT POUR L'EXAMEN À</div>
              <div class="permit-readiness-pct">${pctReady}<small>%</small></div>
              <div class="permit-readiness-bar"><i style="width:${pctReady}%"></i></div>
            </div>
          </div>

          <div class="permit-hint">↻ Retourner</div>
        </div>

        <!-- ╔══ VERSO ══════════════════════════════════════════╗ -->
        <div class="permit-face permit-back">
          <div class="permit-holo" aria-hidden="true"></div>
          <div class="permit-mag-stripe" aria-hidden="true"></div>

          <div class="permit-back-header">
            <div class="permit-back-id">
              <span class="lbl">ID Conducteur</span>
              <span class="val mono">PG-${esc(conductorId) || '00000000'}</span>
            </div>
            <div class="permit-back-league" style="--lg-c:${league.color}">
              <span class="em">${league.emoji}</span>
              <span class="nm">${esc(league.name)}</span>
            </div>
          </div>

          <div class="permit-back-stats">
            <div class="permit-stat">
              <div class="v">${heuresFaites}<small>h</small></div>
              <div class="l">Conduites</div>
            </div>
            <div class="permit-stat">
              <div class="v">${heuresRestantes}<small>h</small></div>
              <div class="l">Restantes</div>
            </div>
            <div class="permit-stat">
              <div class="v">${doneCount}<small>/${totalCount}</small></div>
              <div class="l">Compétences</div>
            </div>
          </div>

          <div class="permit-back-track">
            <div class="permit-back-track-lbl">PROGRESSION FORFAIT</div>
            <div class="permit-back-track-bar">
              <i style="width:${Math.min(100, (heuresFaites / forfait) * 100).toFixed(0)}%"></i>
            </div>
            <div class="permit-back-track-pct">${heuresFaites}h / ${forfait}h</div>
          </div>

          <div class="permit-back-footer">
            <div class="permit-back-brand" aria-label="Émis par PermiGo">
              <span class="pg-logo-txt">PermiGo</span>
              <span class="permit-back-brand-fb" style="display:none">PermiGo</span>
            </div>
            <div class="permit-microtext">
              Document généré par PermiGo — Pour utilisation interne uniquement.
              Non valide comme pièce d'identité légale. Conserve-moi précieusement, je serai
              bientôt remplacé par un vrai permis 🚗
            </div>
            <div class="permit-back-signature">
              <span>Signature de l'élève</span>
              <div class="permit-sig-line"></div>
            </div>
          </div>

          <div class="permit-hint">↻ Retourner</div>
        </div>
      </div>
    </div>
  `;
}

/** Branche le tap + clavier pour flip la carte. */
export function wirePermitCard(root) {
  const card = root.querySelector('#permit-card');
  if (!card) return;
  const toggle = () => {
    card.classList.toggle('flipped');
    try { navigator.vibrate?.(15); } catch (_) {}
  };
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
}

let _permitCssInjected = false;
export function ensurePermitStyles() {
  if (_permitCssInjected) return;
  _permitCssInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    /* ╔══ WRAPPER ══════════════════════════════════════════╗ */
    .permit-card-wrap{perspective:1400px;padding:18px 14px 8px;max-width:540px;margin:0 auto}
    .permit-card{
      position:relative;width:100%;
      aspect-ratio:1.586/1;
      transform-style:preserve-3d;
      transition:transform .9s cubic-bezier(.55,1.25,.4,1);
      cursor:pointer;outline:none;
      filter:drop-shadow(0 20px 40px rgba(11,13,26,.35));
      animation:permit-in .9s cubic-bezier(.34,1.4,.64,1) both;
    }
    @keyframes permit-in{0%{opacity:0;transform:translateY(40px) rotateX(-15deg) scale(.9)}100%{opacity:1;transform:translateY(0) rotateX(0) scale(1)}}
    .permit-card.flipped{transform:rotateY(180deg)}
    .permit-card:focus-visible{filter:drop-shadow(0 0 0 3px rgba(99,102,241,.5)) drop-shadow(0 20px 40px rgba(11,13,26,.35))}

    /* ╔══ FACES ══════════════════════════════════════════╗ */
    .permit-face{
      position:absolute;inset:0;
      border-radius:16px;
      backface-visibility:hidden;-webkit-backface-visibility:hidden;
      overflow:hidden;
      box-shadow:
        0 0 0 1px rgba(255,255,255,.18) inset,
        0 1px 0 rgba(255,255,255,.4) inset,
        0 -1px 0 rgba(0,0,0,.1) inset;
    }

    /* ── RECTO ── */
    .permit-front{
      background:
        linear-gradient(135deg,#dbeafe 0%,#bfdbfe 25%,#fef3c7 60%,#fde68a 100%);
      padding:14px;
      display:flex;flex-direction:column;
      position:relative;
    }

    /* ╔══ SKIN OR ══╗ — bordure dorée, hologramme premium */
    .permit-card.skin-or{filter:drop-shadow(0 0 30px rgba(251,191,36,.55)) drop-shadow(0 20px 40px rgba(11,13,26,.35))}
    .permit-card.skin-or .permit-front{
      background:linear-gradient(135deg,#fef3c7 0%,#fde68a 30%,#fbbf24 70%,#f59e0b 100%);
      box-shadow:0 0 0 2px #f59e0b inset,0 0 0 4px #fde68a inset;
    }
    .permit-card.skin-or .permit-back{
      background:linear-gradient(160deg,#451a03 0%,#7c2d12 50%,#1e1b4b 100%);
      box-shadow:0 0 0 2px #d97706 inset;
    }
    .permit-card.skin-or .permit-holo{
      background:linear-gradient(135deg,transparent 25%,rgba(255,255,255,.6) 40%,rgba(251,191,36,.45) 50%,rgba(255,255,255,.5) 60%,transparent 75%);
      background-size:200% 200%;
      animation:permit-holo 3.5s ease-in-out infinite;
      opacity:1;
    }
    .permit-card.skin-or .permit-stamp{border-color:#d97706;color:#92400e;background:rgba(251,191,36,.15)}
    .permit-card.skin-or .permit-stamp-inner{color:#92400e}

    /* ╔══ SKIN PLATINE ══╗ — bordure métal froid + hologramme RGB */
    .permit-card.skin-platine{filter:drop-shadow(0 0 40px rgba(167,139,250,.6)) drop-shadow(0 20px 40px rgba(11,13,26,.4))}
    .permit-card.skin-platine .permit-front{
      background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 25%,#cbd5e1 60%,#94a3b8 100%);
      box-shadow:0 0 0 2px #475569 inset,0 0 0 4px #e2e8f0 inset;
    }
    .permit-card.skin-platine .permit-back{
      background:linear-gradient(160deg,#0f172a 0%,#1e293b 50%,#312e81 100%);
      box-shadow:0 0 0 2px #94a3b8 inset;
    }
    .permit-card.skin-platine .permit-holo{
      background:conic-gradient(from 0deg,
        rgba(239,68,68,.4),
        rgba(251,191,36,.4),
        rgba(16,185,129,.4),
        rgba(14,165,233,.4),
        rgba(167,139,250,.4),
        rgba(239,68,68,.4));
      animation:permit-platine-holo 4s linear infinite;
      mix-blend-mode:overlay;
      opacity:.7;
    }
    @keyframes permit-platine-holo{from{transform:rotate(0deg) scale(1.5)}to{transform:rotate(360deg) scale(1.5)}}
    .permit-card.skin-platine .permit-stamp{border-color:#64748b;color:#1e293b;background:rgba(241,245,249,.7)}
    .permit-card.skin-platine .permit-stamp-inner{color:#1e293b}
    .permit-card.skin-platine .permit-stamp-inner::after{content:'';}

    /* Pattern subtil */
    .permit-pattern{
      position:absolute;inset:0;
      background-image:
        repeating-linear-gradient(45deg,rgba(30,64,175,.04) 0,rgba(30,64,175,.04) 1px,transparent 1px,transparent 8px),
        repeating-linear-gradient(-45deg,rgba(30,64,175,.04) 0,rgba(30,64,175,.04) 1px,transparent 1px,transparent 8px);
      pointer-events:none;
    }

    /* Hologramme animé */
    .permit-holo{
      position:absolute;inset:0;
      background:linear-gradient(
        135deg,
        transparent 30%,
        rgba(255,255,255,.4) 40%,
        rgba(167,139,250,.3) 50%,
        rgba(34,211,238,.3) 60%,
        transparent 70%
      );
      background-size:200% 200%;
      animation:permit-holo 5s ease-in-out infinite;
      pointer-events:none;
      mix-blend-mode:overlay;
    }
    @keyframes permit-holo{0%,100%{background-position:0% 0%}50%{background-position:100% 100%}}

    /* Header */
    .permit-header{
      display:flex;align-items:center;gap:10px;
      position:relative;z-index:2;margin-bottom:10px;
    }
    .permit-flag{display:flex;height:14px;border-radius:2px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.15);flex-shrink:0}
    .permit-bar{width:7px;height:100%}
    .permit-blue{background:#0055a4}
    .permit-white{background:#fff}
    .permit-red{background:#ef4135}
    .permit-titles{flex:1;line-height:1.05}
    .permit-country{font-family:var(--fd);font-size:7px;font-weight:900;color:#1e3a8a;letter-spacing:.25em}
    .permit-title{font-family:var(--fd);font-size:11px;font-weight:900;color:#1e3a8a;letter-spacing:.08em;margin-top:1px}
    .permit-subtitle{font-family:var(--fn);font-size:7.5px;font-weight:800;color:#1e40af;opacity:.75;letter-spacing:.15em;margin-top:2px}
    /* Logo PermiGo : image officielle en bandeau (recto) */
    .permit-logo-pg{
      height:30px;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;
      padding:4px 8px;
      background:linear-gradient(135deg,rgba(11,13,26,.85),rgba(30,27,75,.85));
      border-radius:7px;
      border:1px solid rgba(255,255,255,.18);
      box-shadow:0 4px 10px -2px rgba(99,102,241,.4);
    }
    .permit-logo-pg img{
      height:18px;width:auto;display:block;
      filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));
    }
    .permit-logo-fb{
      font-family:var(--fd);font-size:13px;font-weight:900;letter-spacing:-.04em;
      background:linear-gradient(90deg,#a5b4fc,#fff,#c4b5fd);
      -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
      padding:0 4px;
    }

    /* Body : photo + info */
    .permit-body{
      display:grid;grid-template-columns:auto 1fr;gap:12px;
      position:relative;z-index:2;flex:1;align-items:flex-start;
    }

    /* Photo conducteur (avatar initiales) */
    .permit-photo{
      position:relative;width:78px;height:96px;flex-shrink:0;
      background:linear-gradient(180deg,#fff 0%,#f1f5f9 100%);
      border:1.5px solid #1e3a8a;border-radius:6px;
      padding:4px;
      box-shadow:0 4px 10px -2px rgba(0,0,0,.15);
    }
    .permit-photo-inner{
      width:100%;height:100%;border-radius:4px;
      background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#0ea5e9 100%);
      color:#fff;font-family:var(--fd);font-weight:900;font-size:26px;letter-spacing:-.02em;
      display:flex;align-items:center;justify-content:center;
      text-shadow:0 2px 4px rgba(0,0,0,.3);
      overflow:hidden;position:relative;
    }
    .permit-photo-inner img{width:100%;height:100%;object-fit:cover;display:block;border-radius:4px}
    .permit-photo-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .permit-photo-tag{
      position:absolute;bottom:-5px;right:-6px;
      width:22px;height:22px;border-radius:50%;
      background:#fff;border:1.5px solid #1e3a8a;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;line-height:1;
      box-shadow:0 2px 4px rgba(0,0,0,.2);
    }

    .permit-info{display:flex;flex-direction:column;gap:5px}
    .permit-field{display:flex;flex-direction:column;line-height:1}
    .permit-field .lbl{font-family:var(--fn);font-size:6.5px;font-weight:800;color:#1e3a8a;opacity:.7;letter-spacing:.15em;text-transform:uppercase;margin-bottom:1px}
    .permit-field .val{font-family:var(--fd);font-size:11.5px;font-weight:800;color:#0f172a;letter-spacing:-.005em;line-height:1.1}
    .permit-field .val.mono{font-family:var(--fn);font-size:10px;font-weight:700;letter-spacing:.05em}
    .permit-field-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}

    /* Footer recto */
    .permit-footer{
      display:flex;align-items:center;gap:12px;
      position:relative;z-index:2;margin-top:8px;
    }
    .permit-status{flex-shrink:0}
    .permit-stamp{
      width:64px;height:64px;border-radius:50%;
      border:2.5px solid #dc2626;
      transform:rotate(-12deg);
      display:flex;align-items:center;justify-content:center;
      opacity:.85;
    }
    .permit-stamp-inner{
      font-family:var(--fd);font-size:8.5px;font-weight:900;
      color:#dc2626;letter-spacing:.1em;text-align:center;line-height:1.15;
    }
    .permit-readiness{flex:1}
    .permit-readiness-lbl{font-family:var(--fn);font-size:7.5px;font-weight:800;color:#1e3a8a;opacity:.75;letter-spacing:.18em;text-transform:uppercase}
    .permit-readiness-pct{font-family:var(--fd);font-size:32px;font-weight:900;color:#0f172a;letter-spacing:-.03em;line-height:1;margin-top:2px}
    .permit-readiness-pct small{font-size:14px;color:#1e3a8a;opacity:.75;font-weight:700}
    .permit-readiness-bar{height:5px;background:rgba(30,58,138,.15);border-radius:99px;overflow:hidden;margin-top:6px}
    .permit-readiness-bar i{display:block;height:100%;background:linear-gradient(90deg,#10b981 0%,#22c55e 50%,#84cc16 100%);border-radius:99px;transition:width 1.4s cubic-bezier(.2,.7,.3,1);box-shadow:0 0 6px rgba(16,185,129,.5)}

    /* Hint flip */
    .permit-hint{
      position:absolute;bottom:6px;right:10px;
      font-family:var(--fn);font-size:8px;font-weight:800;
      color:#1e3a8a;opacity:.4;letter-spacing:.2em;
      pointer-events:none;
    }
    .permit-back .permit-hint{color:#94a3b8;opacity:.5}

    /* ── VERSO ── */
    .permit-back{
      background:linear-gradient(135deg,#1e293b 0%,#0f172a 50%,#1e1b4b 100%);
      color:#fff;
      transform:rotateY(180deg);
      padding:14px;
      display:flex;flex-direction:column;
    }
    .permit-back .permit-holo{
      background:linear-gradient(
        135deg,
        transparent 30%,
        rgba(167,139,250,.25) 40%,
        rgba(34,211,238,.25) 55%,
        rgba(244,114,182,.2) 70%,
        transparent 80%
      );
      opacity:.4;
      mix-blend-mode:screen;
    }

    .permit-mag-stripe{
      position:absolute;top:18px;left:0;right:0;height:32px;
      background:linear-gradient(180deg,#000 0%,#1a1a1a 50%,#000 100%);
      opacity:.85;
    }

    .permit-back-header{
      display:flex;align-items:center;justify-content:space-between;gap:10px;
      margin-top:62px;margin-bottom:14px;
      position:relative;z-index:2;
    }
    .permit-back-id{display:flex;flex-direction:column;line-height:1}
    .permit-back-id .lbl{font-family:var(--fn);font-size:7px;font-weight:800;color:rgba(255,255,255,.5);letter-spacing:.18em;text-transform:uppercase}
    .permit-back-id .val{font-family:var(--fn);font-size:13px;font-weight:900;color:#fde68a;letter-spacing:.08em;margin-top:2px}

    .permit-back-league{
      display:inline-flex;align-items:center;gap:6px;
      padding:6px 12px;border-radius:99px;
      background:linear-gradient(135deg,var(--lg-c),rgba(0,0,0,.3));
      border:1px solid var(--lg-c);
      font-family:var(--fd);font-size:11px;font-weight:900;
      letter-spacing:.3px;
      box-shadow:0 4px 14px -2px var(--lg-c);
    }
    .permit-back-league .em{font-size:14px;line-height:1}

    /* Stats verso */
    .permit-back-stats{
      display:grid;grid-template-columns:repeat(3,1fr);gap:8px;
      position:relative;z-index:2;margin-bottom:12px;
    }
    .permit-stat{
      padding:10px 8px;border-radius:10px;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.1);
      text-align:center;
      box-shadow:0 1px 0 rgba(255,255,255,.1) inset;
    }
    .permit-stat .v{font-family:var(--fd);font-size:20px;font-weight:900;letter-spacing:-.02em;line-height:1;color:#fff}
    .permit-stat .v small{font-size:11px;color:rgba(255,255,255,.5);font-weight:700;margin-left:1px}
    .permit-stat .l{font-family:var(--fn);font-size:8px;font-weight:800;color:rgba(255,255,255,.55);letter-spacing:.15em;text-transform:uppercase;margin-top:4px}

    /* Track forfait */
    .permit-back-track{
      padding:10px 12px;border-radius:10px;
      background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);
      position:relative;z-index:2;margin-bottom:10px;
    }
    .permit-back-track-lbl{font-family:var(--fn);font-size:7.5px;font-weight:800;color:#a5b4fc;letter-spacing:.18em;text-transform:uppercase}
    .permit-back-track-bar{height:5px;background:rgba(0,0,0,.3);border-radius:99px;overflow:hidden;margin-top:6px}
    .permit-back-track-bar i{display:block;height:100%;background:linear-gradient(90deg,#6366f1,#a78bfa);border-radius:99px;box-shadow:0 0 8px rgba(167,139,250,.5)}
    .permit-back-track-pct{font-family:var(--fn);font-size:10px;font-weight:800;color:#fff;margin-top:4px;letter-spacing:.05em;text-align:right}

    /* Footer verso */
    .permit-back-footer{margin-top:auto;position:relative;z-index:2}
    /* Logo PermiGo sur le verso */
    .permit-back-brand{display:flex;align-items:center;justify-content:flex-end;margin-bottom:8px;opacity:.85}
    .permit-back-brand img{height:14px;width:auto;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}
    .permit-back-brand-fb{font-family:var(--fd);font-weight:900;font-size:11px;letter-spacing:-.02em;background:linear-gradient(90deg,#a5b4fc,#fff,#c4b5fd);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
    .permit-microtext{font-family:var(--fb);font-size:7px;font-weight:500;color:rgba(255,255,255,.4);letter-spacing:.02em;line-height:1.3;margin-bottom:6px}
    .permit-back-signature{display:flex;align-items:center;gap:8px}
    .permit-back-signature span{font-family:var(--fn);font-size:7.5px;font-weight:800;color:rgba(255,255,255,.5);letter-spacing:.15em;text-transform:uppercase;white-space:nowrap}
    .permit-sig-line{flex:1;height:1px;background:rgba(255,255,255,.3)}

    /* Réduction mobile */
    @media (max-width:380px){
      .permit-photo{width:64px;height:80px}
      .permit-photo-inner{font-size:22px}
      .permit-readiness-pct{font-size:26px}
      .permit-stamp{width:54px;height:54px}
      .permit-stamp-inner{font-size:7.5px}
    }
    @media (prefers-reduced-motion:reduce){
      .permit-card{animation:none}
      .permit-holo{animation:none}
    }
  `;
  document.head.appendChild(style);
}
