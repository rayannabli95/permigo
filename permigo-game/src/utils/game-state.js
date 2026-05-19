/**
 * Game State — moteur centralisé XP/Niveau/Streak/Ligue/Coffres.
 *
 * Coffres : localStorage (cache immédiat) + RPC Supabase (persistance DB).
 * Le ground-truth des compétences acquises vient de `validations` Supabase
 * (passé en paramètre dans `computeStats({ doneCount, worldsCompleted })`).
 *
 * Streak / Gemmes / Owned / Equipped : localStorage comme cache synchrone
 * + user_preferences.custom comme source de vérité DB (sync on init + writes).
 *
 * Usage :
 *   import { initGameState, computeStats, updateStreak, getOpenedChests,
 *            markChestOpened, getMyChests, unlockChest, openChest } from '@/utils/game-state.js';
 *   await initGameState(me.id);   // une fois au boot, après auth
 */
import { sb } from '@/auth/auth.js';

const XP_PER_COMP = 100;
const XP_PER_LEVEL = 500;
const LS_STREAK_DATE     = 'pg-streak-date';
const LS_STREAK_COUNT    = 'pg-streak-count';
const LS_CHESTS_OPENED   = 'pg-chests-opened';
const LS_CHESTS_DB_CACHE = 'pg-chests-db-v1';
const LS_GEMMES          = 'pg-gemmes';
const LS_OWNED           = 'pg-owned';     // array d'item IDs achetés
const LS_EQUIPPED        = 'pg-equipped';  // { permit, avatarFrame, theme }

// ─── Ligues : seuils en XP ───
const LEAGUES = [
  { id: 'bronze',   name: 'Bronze',   min: 0,    color: '#a16207', glow: 'rgba(161,98,7,.45)',    emoji: '🥉' },
  { id: 'argent',   name: 'Argent',   min: 500,  color: '#94a3b8', glow: 'rgba(148,163,184,.45)', emoji: '🥈' },
  { id: 'or',       name: 'Or',       min: 1500, color: '#fbbf24', glow: 'rgba(251,191,36,.5)',   emoji: '🥇' },
  { id: 'platine',  name: 'Platine',  min: 2500, color: '#22d3ee', glow: 'rgba(34,211,238,.5)',   emoji: '💎' },
  { id: 'diamant',  name: 'Diamant',  min: 3000, color: '#a78bfa', glow: 'rgba(167,139,250,.55)', emoji: '💠' },
  { id: 'champion', name: 'Champion', min: 3100, color: '#f472b6', glow: 'rgba(244,114,182,.55)', emoji: '👑' },
];

export function getLeague(xp) {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= LEAGUES[i].min) return LEAGUES[i];
  }
  return LEAGUES[0];
}

export function getNextLeague(xp) {
  const cur = getLeague(xp);
  const curIdx = LEAGUES.findIndex(l => l.id === cur.id);
  return LEAGUES[curIdx + 1] || null;
}

// ─── DB persistence (user_preferences.custom) ────────────────────
let _userId = null;
let _saveTimer = null;

function _buildCustomPayload() {
  return {
    streak_date:  localStorage.getItem(LS_STREAK_DATE) || null,
    streak_count: parseInt(localStorage.getItem(LS_STREAK_COUNT) || '0', 10),
    gemmes:       parseInt(localStorage.getItem(LS_GEMMES) || '0', 10),
    owned_items:  (() => { try { return JSON.parse(localStorage.getItem(LS_OWNED) || '[]'); } catch { return []; } })(),
    equipped:     (() => { try { return JSON.parse(localStorage.getItem(LS_EQUIPPED) || '{}'); } catch { return {}; } })(),
  };
}

async function _flushToDb() {
  if (!_userId) return;
  try {
    await sb.from('user_preferences').upsert(
      { user_id: _userId, custom: _buildCustomPayload(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  } catch (e) {
    console.warn('[game-state] flush failed', e?.message);
  }
}

function _scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => _flushToDb(), 800);
}

/**
 * À appeler une fois au boot après auth.
 * Charge user_preferences.custom depuis la DB et hydrate localStorage.
 * DB est source de vérité si un enregistrement existe.
 */
export async function initGameState(userId) {
  _userId = userId;
  try {
    const { data, error } = await sb
      .from('user_preferences')
      .select('custom')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data?.custom && Object.keys(data.custom).length > 0) {
      // DB wins — hydrate localStorage
      const c = data.custom;
      if (c.streak_date != null)  localStorage.setItem(LS_STREAK_DATE, c.streak_date);
      if (c.streak_count != null) localStorage.setItem(LS_STREAK_COUNT, String(c.streak_count));
      if (c.gemmes != null)       localStorage.setItem(LS_GEMMES, String(c.gemmes));
      if (c.owned_items)          localStorage.setItem(LS_OWNED, JSON.stringify(c.owned_items));
      if (c.equipped)             localStorage.setItem(LS_EQUIPPED, JSON.stringify(c.equipped));
    } else {
      // Première fois : upload le localStorage courant
      await _flushToDb();
    }
  } catch (e) {
    console.warn('[game-state] initGameState failed, using localStorage only', e?.message);
  }
}

// ─── Streak ──────────────────────────────────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayDiff(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

/** À appeler au mount du parcours. Met à jour le streak selon date dernière visite. */
export function updateStreak() {
  const last  = localStorage.getItem(LS_STREAK_DATE);
  const count = parseInt(localStorage.getItem(LS_STREAK_COUNT) || '0', 10);
  const today = todayKey();
  let result;

  if (!last) {
    localStorage.setItem(LS_STREAK_DATE, today);
    localStorage.setItem(LS_STREAK_COUNT, '1');
    result = { count: 1, isNewDay: true, justBroken: false };
  } else if (last === today) {
    result = { count: Math.max(count, 1), isNewDay: false, justBroken: false };
  } else {
    const diff = dayDiff(last, today);
    if (diff === 1) {
      const next = count + 1;
      localStorage.setItem(LS_STREAK_DATE, today);
      localStorage.setItem(LS_STREAK_COUNT, String(next));

      let pendingChest = null;
      if (next === 7)  pendingChest = { chestType: 'streak_7',  rewards: { xp: 150, gemmes: 30,  title: 'Persévérant' } };
      if (next === 14) pendingChest = { chestType: 'streak_14', rewards: { xp: 350, gemmes: 80,  title: 'Constant' } };
      if (next === 30) pendingChest = { chestType: 'streak_30', rewards: { xp: 800, gemmes: 200, title: 'Inarrêtable' } };

      result = { count: next, isNewDay: true, justBroken: false, pendingChest };
    } else {
      localStorage.setItem(LS_STREAK_DATE, today);
      localStorage.setItem(LS_STREAK_COUNT, '1');
      result = { count: 1, isNewDay: true, justBroken: count > 1 };
    }
  }

  _scheduleSave();
  return result;
}

export function getStreak() {
  const count = parseInt(localStorage.getItem(LS_STREAK_COUNT) || '0', 10);
  const last  = localStorage.getItem(LS_STREAK_DATE) || '';
  return { count, isToday: last === todayKey(), last };
}

/** Renvoie les 7 derniers jours avec leur statut (active/inactive). */
export function getLast7Days() {
  const last  = localStorage.getItem(LS_STREAK_DATE) || '';
  const count = parseInt(localStorage.getItem(LS_STREAK_COUNT) || '0', 10);
  const today = new Date();
  const days  = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let active = false;
    if (last) {
      const distFromLast = dayDiff(key, last);
      if (distFromLast >= 0 && distFromLast < count) active = true;
    }
    days.push({
      key,
      label: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][((d.getDay() + 6) % 7)],
      num: d.getDate(),
      active,
      isToday: i === 0,
    });
  }
  return days;
}

// ─── Coffres ─────────────────────────────────────────────────────
function getOpenedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_CHESTS_OPENED) || '[]')); }
  catch { return new Set(); }
}

export function getOpenedChests() { return Array.from(getOpenedSet()); }
export function isChestOpened(worldNum) { return getOpenedSet().has(worldNum); }

export function markChestOpened(worldNum) {
  const s = getOpenedSet();
  s.add(worldNum);
  localStorage.setItem(LS_CHESTS_OPENED, JSON.stringify(Array.from(s)));
  // Persiste en DB (fire-and-forget — idempotent)
  openChest('world_' + worldNum).catch(() => {});
}

// ─── RPC Coffres (DB) ─────────────────────────────────────────────
function _dbCacheGet() {
  try { return JSON.parse(localStorage.getItem(LS_CHESTS_DB_CACHE) || '[]'); }
  catch { return []; }
}
function _dbCacheSet(data) {
  try { localStorage.setItem(LS_CHESTS_DB_CACHE, JSON.stringify(data)); } catch {}
}

/** @returns {Promise<Array<{id, chest_type, unlocked_at, opened_at, rewards}>>} */
export async function getMyChests() {
  try {
    const { data, error } = await sb.rpc('get_my_chests');
    if (error) throw error;
    _dbCacheSet(data || []);
    return data || [];
  } catch (e) {
    console.warn('[chests] getMyChests fallback to cache', e?.message);
    return _dbCacheGet();
  }
}

/** @returns {Promise<{unlocked:boolean, already_unlocked?:boolean, chest:object}|null>} */
export async function unlockChest(chestType, rewards = {}) {
  try {
    const { data, error } = await sb.rpc('unlock_chest', {
      p_chest_type: chestType,
      p_rewards: rewards,
    });
    if (error) throw error;
    _dbCacheSet([]);
    return data;
  } catch (e) {
    console.warn('[chests] unlockChest failed', e?.message);
    return null;
  }
}

/** @returns {Promise<{ok:boolean, data?, error?, chest?}>} */
export async function openChest(chestType) {
  try {
    const { data, error } = await sb.rpc('open_chest', { p_chest_type: chestType });
    if (error) return { ok: false, error: error.message || String(error) };
    if (data?.error) return { ok: false, error: data.error, chest: data.chest };
    _dbCacheSet([]);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e?.message || 'unknown' };
  }
}

// ─── Gemmes ──────────────────────────────────────────────────────
export function getGemmes() {
  return parseInt(localStorage.getItem(LS_GEMMES) || '0', 10);
}

export function addGemmes(n) {
  const next = getGemmes() + n;
  localStorage.setItem(LS_GEMMES, String(next));
  _scheduleSave();
  // Sync aussi profiles.gemmes (source canonique pour le HUD)
  if (_userId) {
    sb.from('profiles').update({ gemmes: next }).eq('id', _userId).catch(() => {});
  }
  return next;
}

export function spendGemmes(n) {
  const cur = getGemmes();
  if (cur < n) return false;
  const next = cur - n;
  localStorage.setItem(LS_GEMMES, String(next));
  _scheduleSave();
  if (_userId) {
    sb.from('profiles').update({ gemmes: next }).eq('id', _userId).catch(() => {});
  }
  return true;
}

// ─── Inventaire ──────────────────────────────────────────────────
function getOwnedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_OWNED) || '[]')); }
  catch { return new Set(); }
}

export function getOwnedItems()        { return Array.from(getOwnedSet()); }
export function ownsItem(itemId)       { return getOwnedSet().has(itemId); }

export function addOwnedItem(itemId) {
  const s = getOwnedSet();
  s.add(itemId);
  localStorage.setItem(LS_OWNED, JSON.stringify(Array.from(s)));
  _scheduleSave();
}

// ─── Équipement ───────────────────────────────────────────────────
export function getEquipped() {
  try { return JSON.parse(localStorage.getItem(LS_EQUIPPED) || '{}'); }
  catch { return {}; }
}

export function equipItem(slot, itemId) {
  const eq = getEquipped();
  eq[slot] = itemId;
  localStorage.setItem(LS_EQUIPPED, JSON.stringify(eq));
  _scheduleSave();
  if (slot === 'theme') applyThemeColor(itemId);
  window.dispatchEvent(new CustomEvent('pg-equipped-changed', { detail: { slot, itemId } }));
}

export function unequipItem(slot) {
  const eq = getEquipped();
  delete eq[slot];
  localStorage.setItem(LS_EQUIPPED, JSON.stringify(eq));
  _scheduleSave();
  if (slot === 'theme') applyThemeColor(null);
  window.dispatchEvent(new CustomEvent('pg-equipped-changed', { detail: { slot, itemId: null } }));
}

// ─── Achat ────────────────────────────────────────────────────────
export function purchaseItem(itemId, cost) {
  if (ownsItem(itemId)) return { ok: false, error: 'already-owned' };
  if (!spendGemmes(cost)) return { ok: false, error: 'insufficient-gemmes' };
  addOwnedItem(itemId);
  return { ok: true };
}

// ─── Couleurs de thème custom ─────────────────────────────────────
const THEME_COLORS = {
  rose:  { a: '#ec4899', adk: '#be185d', ap: 'rgba(236,72,153,.09)' },
  vert:  { a: '#10b981', adk: '#047857', ap: 'rgba(16,185,129,.09)' },
  cyan:  { a: '#0ea5e9', adk: '#0369a1', ap: 'rgba(14,165,233,.09)' },
  rouge: { a: '#ef4444', adk: '#b91c1c', ap: 'rgba(239,68,68,.09)' },
};

export function applyThemeColor(themeId) {
  const root = document.documentElement;
  const c = themeId && THEME_COLORS[themeId];
  if (c) {
    root.style.setProperty('--a',   c.a);
    root.style.setProperty('--adk', c.adk);
    root.style.setProperty('--ap',  c.ap);
  } else {
    root.style.removeProperty('--a');
    root.style.removeProperty('--adk');
    root.style.removeProperty('--ap');
  }
}

export function initEquippedTheme() {
  const eq = getEquipped();
  if (eq.theme) applyThemeColor(eq.theme);
}

// ─── Stats agrégées ───────────────────────────────────────────────
/**
 * @param {{ doneCount: number, worldsCompleted: number[] }} ctx
 * @returns stats complètes pour le HUD
 */
export function computeStats({ doneCount = 0, worldsCompleted = [] } = {}) {
  const xp            = doneCount * XP_PER_COMP;
  const level         = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel     = xp % XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL - xpInLevel;
  const pctLevel      = (xpInLevel / XP_PER_LEVEL) * 100;
  const league        = getLeague(xp);
  const nextLeague    = getNextLeague(xp);
  const streak        = getStreak();
  const opened        = getOpenedSet();
  const availableChests = worldsCompleted.filter(n => !opened.has(n));
  return {
    xp, level, xpInLevel, xpForNextLevel, pctLevel,
    league, nextLeague, streak,
    availableChests,
    openedChests: Array.from(opened),
    gemmes: getGemmes(),
  };
}
