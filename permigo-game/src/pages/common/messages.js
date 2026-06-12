// ═══════════════════════════════════════════════════════════════
// Common — Messagerie
// RPCs : get_my_threads() · get_thread(p_partner_id, limit)
//        send_message(p_partner_id, p_body)
// ═══════════════════════════════════════════════════════════════
import { sb }         from '@/auth/auth.js';
import { icon } from '@/utils/icons.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast }      from '@/components/common/toast.js';
import { esc }        from '@/utils/escape.js';
import { track }      from '@/services/analytics.js';
import { emptyState } from '@/components/common/empty-state.js';

const MSG_LIMIT = 50;

// ─── Mount ───────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track('page_view', { page: 'messages', user_role: me.role });

  root.innerHTML = renderStyles() + `
<div class="msg anim-slide-up" id="msg-root">
  <div class="msg-list-view" id="msg-list-view">
    ${renderListSkeleton()}
  </div>
  <div class="msg-conv-view" id="msg-conv-view" style="display:none"></div>
</div>`;

  loadThreads(root, me);
}

// ─── Thread list ─────────────────────────────────────────────
async function loadThreads(root, me) {
  try {
    const { data, error } = await sb.rpc('get_my_threads');
    if (error || data?.error) throw new Error(data?.error || 'Erreur chargement');

    const threads = Array.isArray(data) ? data : [];
    renderThreadList(root, me, threads);
  } catch (e) {
    console.error('[messages] loadThreads', e);
    root.querySelector('#msg-list-view').innerHTML = `
      <div class="msg-empty">
        <div class="msg-empty-ico">${icon('alert-triangle',{size:28})}</div>
        <div class="msg-empty-txt">Impossible de charger les messages</div>
        <button class="msg-retry-btn" id="msg-retry">Réessayer</button>
      </div>
    `;
    root.querySelector('#msg-retry')?.addEventListener('click', () => {
      root.querySelector('#msg-list-view').innerHTML = renderListSkeleton();
      loadThreads(root, me);
    });
  }
}

function renderThreadList(root, me, threads) {
  const listView = root.querySelector('#msg-list-view');

  if (threads.length === 0) {
    listView.innerHTML = `
      <div class="msg-list-header">
        <h1 class="msg-title">Messages</h1>
      </div>
      ${emptyState({
        image: '/skins/empty-states/empty_messages.png',
        title: 'Aucun message',
        body: 'Lance la conversation avec ton moniteur ou ta classe.',
      })}
    `;
    return;
  }

  listView.innerHTML = `
    <div class="msg-list-header">
      <h1 class="msg-title">Messages</h1>
      <span class="msg-count">${threads.length}</span>
    </div>
    <div class="msg-threads" id="msg-threads">
      ${threads.map(t => renderThreadRow(t, me)).join('')}
    </div>
  `;

  threads.forEach(thread => {
    const partnerId = thread.partner_id;
    listView.querySelector(`[data-partner="${partnerId}"]`)
      ?.addEventListener('click', () => openConversation(root, me, thread));
  });
}

function renderThreadRow(thread, me) {
  const name     = esc(thread.partner_name || 'Inconnu');
  const lastMsg  = esc(thread.last_message || '');
  const unread   = thread.unread_count || 0;
  const initials = (thread.partner_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const ts       = thread.last_message_at ? relativeTime(thread.last_message_at) : '';

  return `
<div class="msg-thread-row" data-partner="${esc(thread.partner_id)}">
  <div class="msg-avatar">${esc(initials)}</div>
  <div class="msg-thread-body">
    <div class="msg-thread-top">
      <span class="msg-thread-name">${name}</span>
      <span class="msg-thread-ts">${ts}</span>
    </div>
    <div class="msg-thread-bottom">
      <span class="msg-thread-last">${lastMsg}</span>
      ${unread > 0 ? `<span class="msg-badge">${unread > 9 ? '9+' : unread}</span>` : ''}
    </div>
  </div>
</div>`;
}

// ─── Conversation ─────────────────────────────────────────────
async function openConversation(root, me, thread) {
  const listView = root.querySelector('#msg-list-view');
  const convView = root.querySelector('#msg-conv-view');
  listView.style.display = 'none';
  convView.style.display = 'flex';

  const partnerName = esc(thread.partner_name || 'Conversation');
  convView.innerHTML = `
    <div class="msg-conv-header">
      <button class="msg-back-btn" id="msg-back" aria-label="Retour">←</button>
      <div class="msg-conv-name">${partnerName}</div>
    </div>
    <div class="msg-conv-messages" id="msg-conv-messages">
      ${renderConvSkeleton()}
    </div>
    <div class="msg-conv-footer">
      <input class="msg-input" id="msg-input" type="text" placeholder="Écrire un message…" autocomplete="off" maxlength="500">
      <button class="msg-send-btn" id="msg-send">↑</button>
    </div>
  `;

  root.querySelector('#msg-back')?.addEventListener('click', () => {
    convView.style.display = 'none';
    listView.style.display = 'flex';
    loadThreads(root, me);
  });

  track('messages.thread_opened', { partner_id: thread.partner_id });

  await loadMessages(root, me, thread.partner_id);
  wireConvInput(root, me, thread.partner_id);
}

async function loadMessages(root, me, partnerId) {
  try {
    const { data, error } = await sb.rpc('get_thread', {
      p_partner_id: partnerId,
      p_limit: MSG_LIMIT,
    });
    if (error || data?.error) throw new Error(data?.error || 'Erreur chargement');

    const messages = Array.isArray(data) ? data : [];
    renderMessages(root, me, messages);
  } catch (e) {
    console.error('[messages] loadMessages', e);
    const el = root.querySelector('#msg-conv-messages');
    if (el) el.innerHTML = `<div class="msg-conv-err">Impossible de charger les messages</div>`;
  }
}

function renderMessages(root, me, messages) {
  const el = root.querySelector('#msg-conv-messages');
  if (!el) return;

  if (messages.length === 0) {
    el.innerHTML = `<div class="msg-conv-empty">Commencez la conversation</div>`;
    return;
  }

  el.innerHTML = messages.map(msg => renderBubble(msg, me)).join('');
  el.scrollTop = el.scrollHeight;
}

function renderBubble(msg, me) {
  const isMine = msg.sender_id === me.id;
  const body   = esc(msg.body || '');
  const ts     = msg.created_at ? relativeTime(msg.created_at) : '';

  return `
<div class="msg-bubble-wrap ${isMine ? 'msg-bubble-wrap--mine' : ''}">
  <div class="msg-bubble ${isMine ? 'msg-bubble--mine' : 'msg-bubble--other'}">
    ${body}
  </div>
  <div class="msg-bubble-ts">${ts}</div>
</div>`;
}

function wireConvInput(root, me, partnerId) {
  const input  = root.querySelector('#msg-input');
  const sendBtn = root.querySelector('#msg-send');

  async function sendMessage() {
    const body = input?.value?.trim();
    if (!body) return;
    input.value = '';
    sendBtn.disabled = true;

    const optimisticEl = appendOptimistic(root, me, body);

    try {
      const { data, error } = await sb.rpc('send_message', {
        p_partner_id: partnerId,
        p_body: body,
      });
      if (error || data?.error) {
        optimisticEl?.remove();
        toast(data?.error || 'Envoi impossible', 'error');
        input.value = body;
      } else {
        track('messages.sent', { partner_id: partnerId });
      }
    } catch (e) {
      optimisticEl?.remove();
      toast('Erreur de connexion', 'error');
      input.value = body;
    } finally {
      sendBtn.disabled = false;
      input?.focus();
    }
  }

  sendBtn?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
}

function appendOptimistic(root, me, body) {
  const el = root.querySelector('#msg-conv-messages');
  if (!el) return null;
  const div = document.createElement('div');
  div.className = 'msg-bubble-wrap msg-bubble-wrap--mine';
  div.innerHTML = `
    <div class="msg-bubble msg-bubble--mine msg-bubble--pending">${esc(body)}</div>
    <div class="msg-bubble-ts">Envoi…</div>
  `;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
  return div;
}

// ─── Helpers ─────────────────────────────────────────────────
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function renderListSkeleton() {
  return `
<div class="msg-list-header">
  <h1 class="msg-title">Messages</h1>
</div>
${[...Array(4)].map(() => `
<div class="msg-thread-row msg-thread-row--skel">
  <div class="skel" style="width:44px;height:44px;border-radius:50%"></div>
  <div style="flex:1;display:flex;flex-direction:column;gap:8px">
    <div class="skel" style="width:60%;height:13px;border-radius:6px"></div>
    <div class="skel" style="width:85%;height:12px;border-radius:6px"></div>
  </div>
</div>`).join('')}`;
}

function renderConvSkeleton() {
  return [...Array(5)].map((_, i) => `
<div class="msg-bubble-wrap ${i % 2 === 0 ? '' : 'msg-bubble-wrap--mine'}">
  <div class="skel" style="width:${60 + Math.random() * 30 | 0}%;height:40px;border-radius:12px"></div>
</div>`).join('');
}

// ─── Styles ──────────────────────────────────────────────────
function renderStyles() {
  return `<style>
/* === Messages === */
.msg {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  background: var(--ink);
  font-family: 'Inter', sans-serif;
  color: #fff;
}

/* List view */
.msg-list-view {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.msg-list-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 12px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.msg-title {
  font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
  margin: 0;
  flex: 1;
}
.msg-count {
  background: color-mix(in srgb, var(--a) 20%, transparent);
  color: var(--al);
  border-radius: 10px;
  font: 600 12px/1 'IBM Plex Mono', monospace;
  padding: 4px 8px;
}

/* Thread row */
.msg-threads { flex: 1; }
.msg-thread-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  cursor: pointer;
  transition: background 120ms;
}
.msg-thread-row:active { background: rgba(255,255,255,.04); }
.msg-thread-row--skel { pointer-events: none; }
.msg-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--a);
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--a-ink);
  flex-shrink: 0;
}
.msg-thread-body { flex: 1; overflow: hidden; }
.msg-thread-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.msg-thread-name {
  font: 600 15px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--bg4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.msg-thread-ts {
  font: 400 11px/1 'IBM Plex Mono', monospace;
  color: var(--mu4);
  flex-shrink: 0;
}
.msg-thread-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.msg-thread-last {
  font: 400 13px/1 'Inter', sans-serif;
  color: var(--mu);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.msg-badge {
  background: var(--a);
  color: var(--a-ink);
  border-radius: 10px;
  font: 700 11px/1 'IBM Plex Mono', monospace;
  padding: 3px 7px;
  flex-shrink: 0;
}

/* Conversation view */
.msg-conv-view {
  flex-direction: column;
  height: 100svh;
  overflow: hidden;
}
.msg-conv-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(10,13,26,.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
}
.msg-back-btn {
  background: rgba(255,255,255,.08);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 18px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms;
}
.msg-back-btn:active { background: rgba(255,255,255,.15); }
.msg-conv-name {
  font: 700 16px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--bg4);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.msg-conv-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overscroll-behavior: contain;
}
.msg-conv-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255,255,255,.06);
  background: rgba(10,13,26,.95);
  flex-shrink: 0;
}
.msg-input {
  flex: 1;
  padding: 12px 16px;
  background: var(--ink2);
  border: 1.5px solid rgba(255,255,255,.08);
  border-radius: 24px;
  color: var(--bg4);
  font: 400 15px/1 'Inter', sans-serif;
  outline: none;
  transition: border-color 140ms;
  min-height: 44px;
}
.msg-input:focus { border-color: color-mix(in srgb, var(--a) 50%, transparent); }
.msg-input::placeholder { color: var(--mu4); }
.msg-send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--a);
  border: none;
  color: var(--a-ink);
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 120ms cubic-bezier(.23,1,.32,1), opacity 120ms;
}
.msg-send-btn:active { transform: scale(0.9); }
.msg-send-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }

/* Bubbles */
.msg-bubble-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 85%;
  gap: 3px;
}
.msg-bubble-wrap--mine { align-self: flex-end; align-items: flex-end; }
.msg-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font: 400 14px/1.5 'Inter', sans-serif;
  word-break: break-word;
}
.msg-bubble--other {
  background: var(--ink2);
  color: var(--bo3);
  border-bottom-left-radius: 4px;
}
.msg-bubble--mine {
  background: var(--a);
  color: var(--a-ink);
  border-bottom-right-radius: 4px;
}
.msg-bubble--pending { opacity: .6; }
.msg-bubble-ts {
  font: 400 11px/1 'IBM Plex Mono', monospace;
  color: var(--mu4);
  padding: 0 4px;
}

/* Empty / error states */
.msg-empty, .msg-conv-empty, .msg-conv-err {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px 24px;
  gap: 8px;
  text-align: center;
}
.msg-empty-ico { font-size: 40px; margin-bottom: 8px; }
.msg-empty-txt {
  font: 600 16px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--bg4);
}
.msg-empty-sub {
  font: 400 14px/1.5 'Inter', sans-serif;
  color: var(--mu);
}
.msg-conv-empty, .msg-conv-err {
  font: 400 14px/1.5 'Inter', sans-serif;
  color: var(--mu);
}
.msg-retry-btn {
  margin-top: 12px;
  padding: 10px 20px;
  background: color-mix(in srgb, var(--a) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--a) 30%, transparent);
  border-radius: 10px;
  color: var(--al);
  font: 600 14px/1 'Inter', sans-serif;
  cursor: pointer;
  min-height: 44px;
}
</style>`;
}
