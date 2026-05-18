/**
 * Game State — moteur centralisé XP/Niveau/Streak/Ligue/Coffres.
 *
 * Coffres : localStorage (cache immédiat) + RPC Supabase (persistance DB).
 * Le ground-truth des compétences acquises vient de `validations` Supabase
 * (passé en paramètre dans `computeStats({ doneCount, worldsCompleted })`).
 *
 * Usage :
 *   import { computeStats, updateStreak, getOpenedChests, markChestOpened,
 *            getMyChests, unlockChest, openChest } from '@/utils/game-state.js';
 */
import { sb } from '@/auth/auth.js';

const XP_PER_COMP = 100;
const XP_PER_LEVEL = 500;
const LS_STREAK_DATE = 'pg-streak-date';
const LS_STREAK_COUNT = 'pg-streak-count';
const LS_CHESTS_OPENED   = 'pg-chests-opened';
const LS_CHESTS_DB_CACHE = 'pg-chests-db-v1';
const LS_GEMMES = 'pg-gemmes';
const LS_OWNED = 'pg-owned';        // array d'item IDs achetés
const LS_EQUIPPED = 'pg-equipped';  // { permit, avatarFrame, theme }

// ─── Ligues : seuils en XP ───
const LEAGUES = [
  { id: 'bronze',    name: 'Bronze',    min: 0,    color: '#a16207', glow: 'rgba(161,98,7,.45)',   emoji: '🥉' },
  { id: 'argent',    name: 'Argent',    min: 500,  color: '#94a3b8', glow: 'rgba(148,163,184,.45)', emoji: '🥈' },
  { id: 'or',        name: 'Or',        min: 1500, color: '#fbbf24', glow: 'rgba(251,191,36,.5)',   emoji: '🥇' },
  { id: 'platine',   name: 'Platine',   min: 2500, color: '#22d3ee', glow: 'rgba(34,211,238,.5)',   emoji: '💎' },
  { id: 'diamant',   name: 'Diamant',   min: 3000, color: '#a78bfa', glow: 'rgba(167,139,250,.55)', emoji: '💠' },
  { id: 'champion',  name: 'Champion',  min: 3100, color: '#f472b6', glow: 'rgba(244,114,182,.55)', emoji: '👑' },
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

// ─── Streak ───
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayDiff(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  const d1d = new Date(y1, m1 - 1, d1);
  const d2d = new Date(y2, m2 - 1, d2);
  return Math.round((d2d - d1d) / 86400000);
}

/** À appeler au mount du parcours. Met à jour le streak selon date dernière visite. */
export function updateStreak() {
  const last = localStorage.getItem(LS_STREAK_DATE);
  const count = parseInt(localStorage.getItem(LS_STREAK_COUNT) || '0', 10);
  const today = todayKey();

  if (!last) {
    localStorage.setItem(LS_STREAK_DATE, today);
    localStorage.setItem(LS_STREAK_COUNT, '1');
    return { count: 1, isNewDay: true, justBroken: false };
  }

  if (last === today) {
    // Déjà visité aujourd'hui
    return { count: Math.max(count, 1), isNewDay: false, justBroken: false };
  }

  const diff = dayDiff(last, today);
  if (diff === 1) {
    // Continuité +1
    const next = count + 1;
    localStorage.setItem(LS_STREAK_DATE, today);
    localStorage.setItem(LS_STREAK_COUNT, String(next));

    // Coffres streak jalons — idempotent (RPC gère les doublons)
    let pendingChest = null;
    if (next === 7)  pendingChest = { chestType: 'streak_7',  rewards: { xp: 150, gemmes: 30,  title: 'Persévérant' } };
    if (next === 14) pendingChest = { chestType: 'streak_14', rewards: { xp: 350, gemmes: 80,  title: 'Constant' } };
    if (next === 30) pendingChest = { chestType: 'streak_30', rewards: { xp: 800, gemmes: 200, title: 'Inarrêtable' } };

    return { count: next, isNewDay: true, justBroken: false, pendingChest };
  }

  // Streak cassée
  localStorage.setItem(LS_STREAK_DATE, today);
  localStorage.setItem(LS_STREAK_COUNT, '1');
  return { count: 1, isNewDay: true, justBroken: count > 1 };
}

export function getStreak() {
  const count = parseInt(localStorage.getItem(LS_STREAK_COUNT) || '0', 10);
  const last = localStorage.getItem(LS_STREAK_DATE) || '';
  const isToday = last === todayKey();
  // Si pas connecté aujourd'hui ET streak existait → considéré comme "à risque"
  return { count, isToday, last };
}

/** Renvoie les 7 derniers jours avec leur statut (active/inactive). */
export function getLast7Days() {
  const last = localStorage.getItem(LS_STREAK_DATE) || '';
  const count = parseInt(localStorage.getItem(LS_STREAK_COUNT) || '0', 10);
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // Un jour est actif si :
    //   - C'est le jour `last` (dernière visite)
    //   - OU c'est dans la fenêtre count avant `last`
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

// ─── Coffres ───
function getOpenedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_CHESTS_OPENED) || '[]'));
  } catch { return new Set(); }
}

export function getOpenedChests() {
  return Array.from(getOpenedSet());
}

export function isChestOpened(worldNum) {
  return getOpenedSet().has(worldNum);
}

export function markChestOpened(worldNum) {
  const s = getOpenedSet();
  s.add(worldNum);
  localStorage.setItem(LS_CHESTS_OPENED, JSON.stringify(Array.from(s)));
  // Gemmes : DÉJÀ attribuées par la modal coffre via les rewards du tier
  // (chest.js → TIERS[worldNum].gemmes). Pas de double-bonus ici.
  // Persister en DB (fire-and-forget — idempotent via contrainte UNIQUE)
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

/**
 * Récupère tous les coffres de l'utilisateur depuis la DB.
 * Retourne le cache localStorage si la RPC échoue.
 * @returns {Promise<Array<{id, chest_type, unlocked_at, opened_at, rewards}>>}
 */
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

/**
 * Débloque un coffre côté DB (idempotent).
 * Met aussi à jour le cache localStorage.
 * @returns {Promise<{unlocked:boolean, already_unlocked?:boolean, chest:object}|null>}
 */
export async function unlockChest(chestType, rewards = {}) {
  try {
    const { data, error } = await sb.rpc('unlock_chest', {
      p_chest_type: chestType,
      p_rewards: rewards,
    });
    if (error) throw error;
    // Invalide le cache DB pour forcer un refresh au prochain getMyChests()
    _dbCacheSet([]);
    return data;
  } catch (e) {
    console.warn('[chests] unlockChest failed (RPC not deployed yet?)', e?.message);
    return null;
  }
}

/**
 * Marque un coffre comme ouvert (déclenché par la modal).
 * @returns {Promise<{opened:boolean, chest:object}|null>}
 */
export async function openChest(chestType) {
  try {
    const { data, error } = await sb.rpc('open_chest', { p_chest_type: chestType });
    if (error) throw error;
    _dbCacheSet([]);
    return data;
  } catch (e) {
    console.warn('[chests] openChest failed (RPC not deployed yet?)', e?.message);
    return null;
  }
}

// ─── Gemmes ───
export function getGemmes() {
  return parseInt(localStorage.getItem(LS_GEMMES) || '0', 10);
}

export function addGemmes(n) {
  const cur = getGemmes();
  localStorage.setItem(LS_GEMMES, String(cur + n));
  return cur + n;
}

export function spendGemmes(n) {
  const cur = getGemmes();
  if (cur < n) return false;
  localStorage.setItem(LS_GEMMES, String(cur - n));
  return true;
}

// ─── Inventaire (items achetés) ───
function getOwnedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_OWNED) || '[]')); }
  catch { return new Set(); }
}

export function getOwnedItems() {
  return Array.from(getOwnedSet());
}

export function ownsItem(itemId) {
  return getOwnedSet().has(itemId);
}

export function addOwnedItem(itemId) {
  const s = getOwnedSet();
  s.add(itemId);
  localStorage.setItem(LS_OWNED, JSON.stringify(Array.from(s)));
}

// ─── Équipement (skin actuel par slot) ───
export function getEquipped() {
  try { return JSON.parse(localStorage.getItem(LS_EQUIPPED) || '{}'); }
  catch { return {}; }
}

export function equipItem(slot, itemId) {
  const eq = getEquipped();
  eq[slot] = itemId;
  localStorage.setItem(LS_EQUIPPED, JSON.stringify(eq));
  // Re-apply le thème global si on change la couleur d'accent
  if (slot === 'theme') applyThemeColor(itemId);
  // Notifie les autres composants
  window.dispatchEvent(new CustomEvent('pg-equipped-changed', { detail: { slot, itemId } }));
}

export function unequipItem(slot) {
  const eq = getEquipped();
  delete eq[slot];
  localStorage.setItem(LS_EQUIPPED, JSON.stringify(eq));
  if (slot === 'theme') applyThemeColor(null);
  window.dispatchEvent(new CustomEvent('pg-equipped-changed', { detail: { slot, itemId: null } }));
}

// ─── Achat d'un item (vérifie gemmes, retire, ajoute à owned) ───
export function purchaseItem(itemId, cost) {
  if (ownsItem(itemId)) return { ok: false, error: 'already-owned' };
  if (!spendGemmes(cost)) return { ok: false, error: 'insufficient-gemmes' };
  addOwnedItem(itemId);
  return { ok: true };
}

// ─── Couleurs de thème custom ───
const THEME_COLORS = {
  rose:  { a: '#ec4899', adk: '#be185d', ap: 'rgba(236,72,153,.09)' },
  vert:  { a: '#10b981', adk: '#047857', ap: 'rgba(16,185,129,.09)' },
  cyan:  { a: '#0ea5e9', adk: '#0369a1', ap: 'rgba(14,165,233,.09)' },
  rouge: { a: '#ef4444', adk: '#b91c1c', ap: 'rgba(239,68,68,.09)' },
};

/** Applique la couleur d'accent globalement via CSS variables. */
export function applyThemeColor(themeId) {
  const root = document.documentElement;
  const c = themeId && THEME_COLORS[themeId];
  if (c) {
    root.style.setProperty('--a', c.a);
    root.style.setProperty('--adk', c.adk);
    root.style.setProperty('--ap', c.ap);
  } else {
    // Reset au défaut indigo
    root.style.removeProperty('--a');
    root.style.removeProperty('--adk');
    root.style.removeProperty('--ap');
  }
}

/** À appeler au boot pour ré-appliquer le thème équipé. */
export function initEquippedTheme() {
  const eq = getEquipped();
  if (eq.theme) applyThemeColor(eq.theme);
}

// ─── Stats agrégées ───
/**
 * @param {{ doneCount: number, worldsCompleted: number[] }} ctx
 * @returns stats complètes pour le HUD
 */
export function computeStats({ doneCount = 0, worldsCompleted = [] } = {}) {
  const xp = doneCount * XP_PER_COMP;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL - xpInLevel;
  const pctLevel = (xpInLevel / XP_PER_LEVEL) * 100;
  const league = getLeague(xp);
  const nextLeague = getNextLeague(xp);
  const streak = getStreak();
  const opened = getOpenedSet();
  const availableChests = worldsCompleted.filter(n => !opened.has(n));
  return {
    xp,
    level,
    xpInLevel,
    xpForNextLevel,
    pctLevel,
    league,
    nextLeague,
    streak,
    availableChests,
    openedChests: Array.from(opened),
    gemmes: getGemmes(),
  };
}
