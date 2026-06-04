// ═══════════════════════════════════════════════════════════════
// Quiz éclair — modal moniteur
// Le moniteur choisit 1 compétence travaillée et pousse 3 questions
// à l'élève (5 min pour répondre). Ton pro (Linear/Notion), pas Duolingo.
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { icon } from '@/utils/icons.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/common/toast.js';

let _stylesInjected = false;

function ensureStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const s = document.createElement('style');
  s.id = 'fq-modal-styles';
  s.textContent = `
    .fq-overlay{position:fixed;inset:0;z-index:9999;background:rgba(10,13,26,.55);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;padding:0;animation:fqFade .2s ease}
    @media(min-width:520px){.fq-overlay{align-items:center;padding:20px}}
    @keyframes fqFade{from{opacity:0}to{opacity:1}}
    .fq-sheet{width:100%;max-width:480px;background:var(--bg2,#fff);color:var(--ink,#0f172a);border-radius:24px 24px 0 0;padding:24px 20px calc(env(safe-area-inset-bottom,0px) + 20px);box-shadow:0 -8px 40px rgba(0,0,0,.25);animation:fqUp .26s cubic-bezier(.23,1,.32,1)}
    @media(min-width:520px){.fq-sheet{border-radius:20px}}
    @keyframes fqUp{from{transform:translateY(24px);opacity:.5}to{transform:translateY(0);opacity:1}}
    .fq-head{display:flex;align-items:center;gap:10px;margin-bottom:4px}
    .fq-badge{font-size:22px;line-height:1}
    .fq-title{font:800 18px/1.25 'Plus Jakarta Sans',sans-serif;color:var(--ink,#0f172a);margin:0}
    .fq-sub{font:500 13.5px/1.45 'Inter',sans-serif;color:var(--mu3,#64748b);margin:6px 0 18px}
    .fq-list{display:flex;flex-direction:column;gap:8px;max-height:46vh;overflow-y:auto;margin-bottom:18px}
    .fq-opt{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid var(--bg5,#e2e8f0);border-radius:14px;background:var(--bg,#fff);cursor:pointer;transition:border-color .15s,background .15s;min-height:44px}
    .fq-opt:hover{border-color:var(--a,#6366f1)}
    .fq-opt.sel{border-color:var(--a,#6366f1);background:color-mix(in srgb,var(--a,#6366f1) 8%,transparent)}
    .fq-radio{width:20px;height:20px;border-radius:50%;border:2px solid var(--bg5,#cbd5e1);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:border-color .15s}
    .fq-opt.sel .fq-radio{border-color:var(--a,#6366f1)}
    .fq-opt.sel .fq-radio::after{content:'';width:10px;height:10px;border-radius:50%;background:var(--a,#6366f1)}
    .fq-opt-id{font:700 12px/1 'IBM Plex Mono',monospace;color:var(--a,#6366f1);flex-shrink:0}
    .fq-opt-lbl{font:600 14px/1.3 'Inter',sans-serif;color:var(--ink,#0f172a)}
    .fq-btns{display:flex;gap:10px}
    .fq-btn{flex:1;padding:14px;border-radius:14px;font:700 14.5px/1 'Inter',sans-serif;cursor:pointer;border:0;min-height:48px;transition:opacity .15s,transform .12s}
    .fq-btn:active{transform:scale(.98)}
    .fq-btn-skip{background:var(--bg4,#f1f5f9);color:var(--mu3,#64748b)}
    .fq-btn-send{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff}
    .fq-btn-send:disabled{opacity:.45;cursor:not-allowed}
    .fq-btn-send.loading{opacity:.65;cursor:wait}
  `;
  document.head.appendChild(s);
}

/**
 * Ouvre la modal de quiz éclair.
 * @param {Object} p
 * @param {string} p.eleveId   - id profil élève
 * @param {string} p.eleveNom  - prénom élève (affichage)
 * @param {Array<{id:string,nom:string}>} p.competences - compétences travaillées
 * @returns {Promise<boolean>} true si un quiz a été envoyé, false sinon
 */
export function openFlashQuizModal({ eleveId, eleveNom, competences = [] }) {
  ensureStyles();
  const list = competences.filter(c => c && c.id);
  if (!eleveId || list.length === 0) return Promise.resolve(false);

  return new Promise(resolve => {
    let selected = list.length === 1 ? list[0].id : null;

    const overlay = document.createElement('div');
    overlay.className = 'fq-overlay';
    overlay.innerHTML = `
      <div class="fq-sheet" role="dialog" aria-modal="true" aria-label="Envoyer un quiz éclair">
        <div class="fq-head">
          <span class="fq-badge" aria-hidden="true">${icon('zap',{size:16})}</span>
          <h2 class="fq-title">Quiz éclair à ${esc(eleveNom || "l'élève")}</h2>
        </div>
        <p class="fq-sub">3 questions, 5 minutes pour répondre. Idéal pour ancrer ce que vous venez de travailler.</p>
        <div class="fq-list" role="radiogroup">
          ${list.map(c => `
            <div class="fq-opt${selected === c.id ? ' sel' : ''}" data-comp="${esc(c.id)}" role="radio" aria-checked="${selected === c.id}" tabindex="0">
              <span class="fq-radio" aria-hidden="true"></span>
              <span class="fq-opt-id">${esc(c.id)}</span>
              <span class="fq-opt-lbl">${esc(c.nom || '')}</span>
            </div>
          `).join('')}
        </div>
        <div class="fq-btns">
          <button class="fq-btn fq-btn-skip" type="button" id="fq-skip">Plus tard</button>
          <button class="fq-btn fq-btn-send" type="button" id="fq-send" ${selected ? '' : 'disabled'}>Envoyer</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const sendBtn = overlay.querySelector('#fq-send');

    function selectComp(id, el) {
      selected = id;
      overlay.querySelectorAll('.fq-opt').forEach(o => {
        const on = o.dataset.comp === id;
        o.classList.toggle('sel', on);
        o.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      sendBtn.disabled = false;
    }

    overlay.querySelectorAll('.fq-opt').forEach(opt => {
      opt.addEventListener('click', () => selectComp(opt.dataset.comp, opt));
      opt.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectComp(opt.dataset.comp, opt); }
      });
    });

    function close(sent) { overlay.remove(); resolve(sent); }

    overlay.querySelector('#fq-skip').addEventListener('click', () => close(false));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });

    sendBtn.addEventListener('click', async () => {
      if (!selected) return;
      sendBtn.disabled = true; sendBtn.classList.add('loading'); sendBtn.textContent = 'Envoi…';
      try {
        const { error } = await sb.rpc('send_flash_quiz', {
          p_eleve_id: eleveId,
          p_competence_id: selected,
        });
        if (error) {
          console.error('[flash-quiz] send error', error);
          toast(/not enough questions/i.test(error.message || '')
            ? "Pas assez de questions sur cette compétence"
            : "Envoi impossible — réessaie", 'error');
          sendBtn.disabled = false; sendBtn.classList.remove('loading'); sendBtn.textContent = 'Envoyer';
          return;
        }
        toast(`Quiz éclair envoyé à ${eleveNom || "l'élève"} — 5 min pour répondre`, 'success');
        close(true);
      } catch (e) {
        console.error('[flash-quiz] send crashed', e);
        toast("Erreur réseau — réessaie", 'error');
        sendBtn.disabled = false; sendBtn.classList.remove('loading'); sendBtn.textContent = 'Envoyer';
      }
    });
  });
}
