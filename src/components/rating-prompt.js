/**
 * Rating Prompt — modal "Note ta dernière leçon" affiché après chaque leçon terminée.
 *
 * Usage :
 *   import { checkAndPromptRating } from '@/components/rating-prompt.js';
 *   await checkAndPromptRating(eleveId); // appelé au mount de l'accueil élève
 *
 * Logique :
 *  1. Cherche le dernier event terminé (ended_at NOT NULL) confirmé pour cet élève dans les 24h
 *  2. Si trouvé ET localStorage 'rated-event-{id}' absent → affiche la modal
 *  3. Au submit → INSERT dans notations + marque localStorage
 *  4. "Plus tard" → reporte de 1h
 *
 * Tags pré-faits selon le rating (positifs si ≥4, neutres si =3, négatifs si ≤2).
 */

import { sb } from '@/auth/auth.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';

const SNOOZE_MS = 60 * 60 * 1000; // 1h

const TAGS_POS = [
  '🌟 Très pédagogue',
  '😌 Patient(e)',
  '🎯 Explications claires',
  '💪 Encourageant(e)',
  '🚗 Bonne ambiance',
  '⏱ Ponctuel(le)',
];
const TAGS_NEU = [
  '🤔 Pédagogie à améliorer',
  '🗓 Manque d\'organisation',
  '💬 Communication moyenne',
];
const TAGS_NEG = [
  '😟 Trop strict',
  '🌀 Pas clair',
  '😰 Stressant',
  '⏰ En retard',
];

export async function checkAndPromptRating(eleveId) {
  if (!sb || !eleveId) return;

  // Snooze actif ?
  const snoozeUntil = parseInt(localStorage.getItem('rating-snooze-until') || '0', 10);
  if (snoozeUntil > Date.now()) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: lastEvent } = await sb
    .from('events')
    .select('id, eleve_id, moniteur_id, mon_nom, lieu, h, date_event, ended_at, dur, n')
    .eq('eleve_id', eleveId)
    .eq('is_deleted', false)
    .not('ended_at', 'is', null)
    .gte('ended_at', since)
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastEvent) return;
  // Déjà noté localement ?
  if (localStorage.getItem(`rated-event-${lastEvent.id}`)) return;

  // Vérifie aussi côté DB : si déjà 1 notation pour ce moniteur dans la dernière heure → skip
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentNotation } = await sb
    .from('notations')
    .select('id')
    .eq('eleve_id', eleveId)
    .eq('moniteur_id', lastEvent.moniteur_id)
    .gte('created_at', oneHourAgo)
    .limit(1)
    .maybeSingle();
  if (recentNotation) {
    localStorage.setItem(`rated-event-${lastEvent.id}`, '1');
    return;
  }

  // Récupère le nom du moniteur
  let moniteurNom = lastEvent.mon_nom || 'ton moniteur';
  if (lastEvent.moniteur_id) {
    const { data: mon } = await sb
      .from('profiles')
      .select('nom')
      .eq('id', lastEvent.moniteur_id)
      .maybeSingle();
    if (mon?.nom) moniteurNom = mon.nom;
  }

  showModal({ event: lastEvent, moniteurNom });
}

function showModal({ event, moniteurNom }) {
  // Container
  const host = document.createElement('div');
  host.id = 'rating-prompt';
  host.innerHTML = `
    <style>
      #rating-prompt{position:fixed;inset:0;z-index:200;display:flex;align-items:flex-end;justify-content:center;background:rgba(11,13,26,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:rp-fade .25s ease}
      @keyframes rp-fade{from{opacity:0}to{opacity:1}}
      .rp-panel{background:var(--bg);width:100%;max-width:480px;border-radius:22px 22px 0 0;padding:24px 22px 28px;box-shadow:0 -20px 60px -10px rgba(0,0,0,.4);animation:rp-up .32s cubic-bezier(.2,.7,.3,1);max-height:90vh;overflow-y:auto}
      @keyframes rp-up{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      @media (min-width:560px){#rating-prompt{align-items:center}.rp-panel{border-radius:22px;max-width:440px}}

      .rp-handle{width:42px;height:4px;border-radius:99px;background:var(--bo2);margin:-8px auto 14px}
      .rp-title{font-family:var(--fd);font-size:22px;font-weight:800;letter-spacing:-.022em;color:var(--ink);margin:0;text-align:center;text-wrap:balance}
      .rp-sub{font-size:13px;color:var(--mu);text-align:center;margin:6px 0 22px;letter-spacing:-.005em}
      .rp-sub b{color:var(--ink);font-weight:700}

      .rp-stars{display:flex;justify-content:center;gap:6px;margin-bottom:6px}
      .rp-star{font-size:42px;cursor:pointer;line-height:1;color:var(--bo);transition:transform .15s,color .15s;user-select:none;background:transparent;border:0;padding:4px;font-family:inherit}
      .rp-star:hover{transform:scale(1.15)}
      .rp-star.on{color:#fbbf24;text-shadow:0 4px 12px rgba(251,191,36,.35);animation:rp-pop .35s cubic-bezier(.4,1.6,.5,1)}
      @keyframes rp-pop{0%{transform:scale(.6)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
      .rp-rating-lbl{text-align:center;font-family:var(--fd);font-size:14px;font-weight:700;color:var(--mu);min-height:22px;margin-bottom:18px;letter-spacing:-.005em}

      .rp-tags-lbl{font-family:var(--fn);font-size:10.5px;font-weight:800;color:var(--mu);letter-spacing:.18em;text-transform:uppercase;margin-bottom:10px}
      .rp-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px}
      .rp-tag{padding:7px 12px;border-radius:99px;border:1px solid var(--bo);background:var(--bg2);font-family:inherit;font-size:12.5px;font-weight:600;color:var(--ink);cursor:pointer;transition:all .15s;letter-spacing:-.005em;white-space:nowrap}
      .rp-tag:hover{background:var(--ap);border-color:var(--a)}
      .rp-tag.on{background:linear-gradient(135deg,#6366f1,#8b5cf6);border-color:transparent;color:#fff;box-shadow:0 4px 12px -2px rgba(99,102,241,.4)}

      .rp-comment{margin-bottom:18px}
      .rp-comment label{display:block;font-family:var(--fn);font-size:10.5px;font-weight:800;color:var(--mu);letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}
      .rp-comment textarea{width:100%;min-height:64px;padding:10px 12px;border:1px solid var(--bo);border-radius:10px;font-family:var(--fb);font-size:13.5px;color:var(--ink);background:var(--su);resize:vertical;letter-spacing:-.005em}
      .rp-comment textarea:focus{outline:0;border-color:var(--a);box-shadow:0 0 0 3px var(--ap)}

      .rp-actions{display:grid;grid-template-columns:1fr 2fr;gap:8px}
      .rp-btn{height:48px;border-radius:12px;font-family:var(--fd);font-size:14px;font-weight:800;cursor:pointer;border:0;transition:transform .12s,box-shadow .15s;letter-spacing:-.005em}
      .rp-btn-snooze{background:var(--bg2);color:var(--mu);border:1px solid var(--bo)}
      .rp-btn-snooze:hover{background:var(--su)}
      .rp-btn-send{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 10px 24px -8px rgba(99,102,241,.5)}
      .rp-btn-send:hover:not(:disabled){transform:translateY(-1px)}
      .rp-btn-send:disabled{opacity:.45;cursor:not-allowed}
    </style>

    <div class="rp-panel" role="dialog" aria-modal="true" aria-labelledby="rp-title">
      <div class="rp-handle"></div>
      <h2 class="rp-title" id="rp-title">Comment s'est passée ta leçon&nbsp;?</h2>
      <p class="rp-sub">Avec <b>${esc(moniteurNom)}</b> · ${esc(formatEventDate(event))}</p>

      <div class="rp-stars" role="radiogroup" aria-label="Note sur 5">
        ${[1, 2, 3, 4, 5].map(n => `<button class="rp-star" type="button" data-star="${n}" role="radio" aria-checked="false" aria-label="${n} étoile${n > 1 ? 's' : ''}">★</button>`).join('')}
      </div>
      <div class="rp-rating-lbl" id="rp-rating-lbl">Tape une étoile pour noter</div>

      <div id="rp-tags-block" style="display:none">
        <div class="rp-tags-lbl">Quelques mots pour préciser ?</div>
        <div class="rp-tags" id="rp-tags"></div>
      </div>

      <div class="rp-comment">
        <label for="rp-cmt">Commentaire (optionnel)</label>
        <textarea id="rp-cmt" maxlength="300" placeholder="Ce que tu as aimé, ce qui pourrait être amélioré…"></textarea>
      </div>

      <div class="rp-actions">
        <button class="rp-btn rp-btn-snooze" id="rp-snooze" type="button">Plus tard</button>
        <button class="rp-btn rp-btn-send" id="rp-send" type="button" disabled>Envoyer ma note</button>
      </div>
    </div>
  `;
  document.body.appendChild(host);

  const stars = host.querySelectorAll('.rp-star');
  const lbl = host.querySelector('#rp-rating-lbl');
  const tagsBlock = host.querySelector('#rp-tags-block');
  const tagsHost = host.querySelector('#rp-tags');
  const cmt = host.querySelector('#rp-cmt');
  const sendBtn = host.querySelector('#rp-send');
  const snoozeBtn = host.querySelector('#rp-snooze');

  let rating = 0;
  const selectedTags = new Set();

  const LABELS = ['', '😞 Mauvaise', '😐 Moyenne', '🙂 Correcte', '😊 Bonne', '🤩 Excellente'];

  function setRating(n) {
    rating = n;
    stars.forEach((s, i) => {
      s.classList.toggle('on', i < n);
      s.setAttribute('aria-checked', i + 1 === n ? 'true' : 'false');
    });
    lbl.textContent = LABELS[n];
    sendBtn.disabled = n === 0;

    // Tags suggérés selon le rating
    selectedTags.clear();
    const pool = n >= 4 ? TAGS_POS : n === 3 ? TAGS_NEU : TAGS_NEG;
    tagsHost.innerHTML = pool.map(t => `<button type="button" class="rp-tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
    tagsBlock.style.display = '';
    tagsHost.querySelectorAll('.rp-tag').forEach(b => {
      b.addEventListener('click', () => {
        b.classList.toggle('on');
        const t = b.dataset.tag;
        if (selectedTags.has(t)) selectedTags.delete(t); else selectedTags.add(t);
      });
    });
  }

  stars.forEach(s => s.addEventListener('click', () => setRating(parseInt(s.dataset.star, 10))));

  snoozeBtn.addEventListener('click', () => {
    localStorage.setItem('rating-snooze-until', String(Date.now() + SNOOZE_MS));
    host.remove();
    toast('On te le redemandera plus tard ⏰', 'info');
  });

  sendBtn.addEventListener('click', async () => {
    if (rating === 0) return;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Envoi…';
    const tags = [...selectedTags];
    const comment = [tags.length ? tags.join(' · ') : '', cmt.value.trim()]
      .filter(Boolean).join(' — ') || null;

    const { error } = await sb.from('notations').insert({
      eleve_id: event.eleve_id,
      moniteur_id: event.moniteur_id,
      note: rating,
      comment,
    });
    if (error) {
      console.warn('[rating] err', error);
      toast('Erreur, réessaye', 'error');
      sendBtn.disabled = false;
      sendBtn.textContent = 'Envoyer ma note';
      return;
    }
    localStorage.setItem(`rated-event-${event.id}`, '1');
    localStorage.removeItem('rating-snooze-until');
    toast('Merci pour ton retour ✨', 'success');
    host.style.animation = 'rp-fade .25s reverse ease forwards';
    setTimeout(() => host.remove(), 250);
  });
}

function formatEventDate(e) {
  if (!e.date_event) return '';
  const d = new Date(e.date_event + 'T00:00:00');
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}${e.h ? ' à ' + e.h : ''}`;
}
