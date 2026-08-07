/**
 * Game State — moteur centralisé Gemmes/Coffres/Inventaire/Équipement.
 *
 * Coffres : localStorage (cache immédiat) + RPC Supabase (persistance DB).
 *
 * Gemmes / Owned / Equipped : localStorage comme cache synchrone
 * + user_preferences.custom comme source de vérité DB (sync on init + writes).
 *
 * ⚠️ XP/Niveau/Ligue/Streak ne vivent PLUS ici (retiré le 08/08/2026, code
 * mort depuis le 06/08 : la série élève vient de `services/streak.js`, le
 * classement/ligue de `utils/league-shared.js` — ce module gardait une 2e
 * implémentation de chacun, jamais appelée, seulement testée à l'audit).
 *
 * Usage :
 *   import { initGameState, getOpenedChests,
 *            markChestOpened, getMyChests, unlockChest, openChest } from '@/utils/game-state.js';
 *   await initGameState(me.id);   // une fois au boot, après auth
 */
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { purgeAccountLocalCache } from "@/utils/account-cache.js";

const LS_STREAK_DATE = "pg-streak-date";
const LS_STREAK_COUNT = "pg-streak-count";
const LS_CHESTS_OPENED = "pg-chests-opened";
const LS_CHESTS_DB_CACHE = "pg-chests-db-v1";
const LS_GEMMES = "pg-gemmes";
const LS_OWNED = "pg-owned"; // array d'item IDs achetés
const LS_EQUIPPED = "pg-equipped"; // { permit, avatarFrame, theme }
const LS_LAST_USER = "pg-last-user"; // id du dernier compte connecté sur cet appareil

// ─── DB persistence (user_preferences.custom) ────────────────────
let _userId = null;
let _saveTimer = null;

function _buildCustomPayload() {
  return {
    streak_date: localStorage.getItem(LS_STREAK_DATE) || null,
    streak_count: parseInt(localStorage.getItem(LS_STREAK_COUNT) || "0", 10),
    gemmes: parseInt(localStorage.getItem(LS_GEMMES) || "0", 10),
    owned_items: (() => {
      try {
        return JSON.parse(localStorage.getItem(LS_OWNED) || "[]");
      } catch {
        return [];
      }
    })(),
    equipped: (() => {
      try {
        return JSON.parse(localStorage.getItem(LS_EQUIPPED) || "{}");
      } catch {
        return {};
      }
    })(),
    equipped_assets: (() => {
      try {
        return JSON.parse(localStorage.getItem(LS_EQUIPPED_ASSETS) || "{}");
      } catch {
        return {};
      }
    })(),
  };
}

async function _flushToDb() {
  if (!_userId) return;
  try {
    await sb.from("user_preferences").upsert(
      {
        user_id: _userId,
        custom: _buildCustomPayload(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch (e) {
    console.warn("[game-state] flush failed", e?.message);
  }
}

function _scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => _flushToDb(), 800);
}

/**
 * Vide tout le cache local lié à un compte : progression (série, gemmes,
 * coffres, objets, équipement) ET tout le reste listé dans
 * `account-cache.js` (quotas, jalons "déjà vu", préférences d'achat...).
 * À appeler à la déconnexion et avant toute inscription, pour qu'un nouveau
 * compte ne parte jamais avec les données du précédent. Point d'entrée
 * unique : n'ajoute jamais un `localStorage.removeItem()` isolé ailleurs
 * dans l'app pour ce genre de purge, complète `ACCOUNT_SCOPED_KEYS` à la
 * place (sinon on recrée exactement le bug que ce module corrige).
 */
export function clearLocalGameState() {
  purgeAccountLocalCache();
  _userId = null;
}

/**
 * À appeler une fois au boot après auth.
 * Charge user_preferences.custom depuis la DB et hydrate localStorage.
 * DB est source de vérité si un enregistrement existe.
 */
export async function initGameState(userId) {
  // Garde-fou : un autre compte s'est connecté sur cet appareil depuis la
  // dernière fois (déconnexion qui n'a pas purgé, appareil partagé...) : la
  // mémoire locale (skins équipés, gemmes, série) lui appartient, pas au
  // compte courant. On la vide pour ne rien lui faire hériter par erreur
  // (ex : un skin premium jamais acheté qui semblait "déjà débloqué").
  try {
    const lastUser = localStorage.getItem(LS_LAST_USER);
    if (lastUser && lastUser !== userId) clearLocalGameState();
    localStorage.setItem(LS_LAST_USER, userId);
  } catch {}

  _userId = userId;
  try {
    // Pull en parallèle : user_preferences (custom) + streaks (table dédiée) + profiles.gemmes
    const [prefsRes, streakRes, profileRes] = await Promise.allSettled([
      sb
        .from("user_preferences")
        .select("custom")
        .eq("user_id", userId)
        .maybeSingle(),
      sb
        .from("streaks")
        .select("current_streak, last_activity_date")
        .eq("user_id", userId)
        .maybeSingle(),
      sb.from("profiles").select("gemmes").eq("id", userId).maybeSingle(),
    ]);

    const data = prefsRes.value?.data;
    const streakRow = streakRes.value?.data;
    const profile = profileRes.value?.data;

    if (data?.custom && Object.keys(data.custom).length > 0) {
      // DB wins — hydrate localStorage
      const c = data.custom;
      if (c.streak_date != null)
        localStorage.setItem(LS_STREAK_DATE, c.streak_date);
      if (c.streak_count != null)
        localStorage.setItem(LS_STREAK_COUNT, String(c.streak_count));
      if (c.gemmes != null) localStorage.setItem(LS_GEMMES, String(c.gemmes));
      if (c.owned_items)
        localStorage.setItem(LS_OWNED, JSON.stringify(c.owned_items));
      if (c.equipped)
        localStorage.setItem(LS_EQUIPPED, JSON.stringify(c.equipped));
      if (c.equipped_assets)
        localStorage.setItem(
          LS_EQUIPPED_ASSETS,
          JSON.stringify(c.equipped_assets),
        );
    } else {
      // Première fois : upload le localStorage courant
      await _flushToDb();
    }

    // OVERRIDE : la table streaks est la source canonique du streak (plus fiable que custom jsonb)
    if (streakRow?.current_streak != null) {
      localStorage.setItem(LS_STREAK_COUNT, String(streakRow.current_streak));
    }
    if (streakRow?.last_activity_date) {
      localStorage.setItem(LS_STREAK_DATE, streakRow.last_activity_date);
    }
    // OVERRIDE : profiles.gemmes est la source canonique des gemmes
    if (profile?.gemmes != null) {
      localStorage.setItem(LS_GEMMES, String(profile.gemmes));
      // Le header (pastille volants) se monte sans attendre cet init : on lui
      // pousse le solde synchronisé pour qu'il affiche la bonne valeur.
      try {
        window.dispatchEvent(
          new CustomEvent("pg-gemmes-changed", {
            detail: { balance: profile.gemmes },
          }),
        );
      } catch {}
    }
  } catch (e) {
    console.warn(
      "[game-state] initGameState failed, using localStorage only",
      e?.message,
    );
  }
}

// ─── Coffres ─────────────────────────────────────────────────────
function getOpenedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_CHESTS_OPENED) || "[]"));
  } catch {
    return new Set();
  }
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
  // Marquage local seulement. La persistance DB + le crédit gemmes passent
  // par openChest() appelé depuis le onClaim de la modal (résultat exploité,
  // crédit serveur idempotent). On évite ainsi un 2e appel RPC non maîtrisé.
}

// ─── RPC Coffres (DB) ─────────────────────────────────────────────
function _dbCacheGet() {
  try {
    return JSON.parse(localStorage.getItem(LS_CHESTS_DB_CACHE) || "[]");
  } catch {
    return [];
  }
}
function _dbCacheSet(data) {
  try {
    localStorage.setItem(LS_CHESTS_DB_CACHE, JSON.stringify(data));
  } catch {}
}

/** @returns {Promise<Array<{id, chest_type, unlocked_at, opened_at, rewards}>>} */
export async function getMyChests({ throwOnError = false } = {}) {
  try {
    const { data, error } = await sb.rpc("get_my_chests");
    if (error) throw error;
    _dbCacheSet(data || []);
    return data || [];
  } catch (e) {
    console.warn("[chests] getMyChests fallback to cache", e?.message);
    if (throwOnError) throw e;
    return _dbCacheGet();
  }
}

/** @returns {Promise<{unlocked:boolean, already_unlocked?:boolean, chest:object}|null>} */
export async function unlockChest(chestType, rewards = {}) {
  try {
    const { data, error } = await sb.rpc("unlock_chest", {
      p_chest_type: chestType,
      p_rewards: rewards,
    });
    if (error) throw error;
    _dbCacheSet([]);
    return data;
  } catch (e) {
    console.warn("[chests] unlockChest failed", e?.message);
    return null;
  }
}

/** @returns {Promise<{ok:boolean, data?, error?, chest?}>} */
export async function openChest(chestType) {
  try {
    const { data, error } = await sb.rpc("open_chest", {
      p_chest_type: chestType,
    });
    if (error) return { ok: false, error: error.message || String(error) };
    if (data?.error) return { ok: false, error: data.error, chest: data.chest };
    _dbCacheSet([]);
    // Le serveur a crédité les gemmes (open_chest, migration 0010) : on aligne
    // le cache local sur le solde réel pour que le HUD affiche le bon total.
    if (typeof data?.new_balance === "number") {
      localStorage.setItem(LS_GEMMES, String(data.new_balance));
      // Notifie le HUD (pattern identique à pg-equipped-changed) pour
      // rafraîchir le compteur de gemmes en live, sans reload.
      window.dispatchEvent(
        new CustomEvent("pg-gemmes-changed", {
          detail: { balance: data.new_balance },
        }),
      );
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e?.message || "unknown" };
  }
}

// ─── Gemmes ──────────────────────────────────────────────────────
export function getGemmes() {
  return parseInt(localStorage.getItem(LS_GEMMES) || "0", 10);
}

/**
 * Re-synchronise le solde de volants depuis la source canonique
 * (profiles.gemmes), met à jour le cache localStorage et notifie l'UI
 * (event pg-gemmes-changed). À appeler quand l'affichage doit être SÛR
 * d'être à jour (ex: montage du header), car initGameState() tourne au boot
 * sans être attendu et peut rater la fenêtre auth. Renvoie le solde.
 */
export async function refreshGemmes(userId) {
  // _userId peut être null (initGameState pas encore passé, ex: 1re session
  // juste après inscription) → on retombe sur le profil courant en mémoire.
  const uid = userId || _userId || getCurUser()?.id;
  try {
    let row = null;
    if (uid) {
      const { data, error } = await sb
        .from("profiles")
        .select("gemmes")
        .eq("id", uid)
        .maybeSingle();
      if (!error) row = data;
    }
    if (!row || typeof row.gemmes !== "number") {
      // Filet : requête par auth_id (même filtre que restoreSession, qui
      // fonctionne toujours) au cas où l'id passé n'est pas l'id profil.
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (user?.id) {
        const { data, error } = await sb
          .from("profiles")
          .select("gemmes")
          .eq("auth_id", user.id)
          .maybeSingle();
        if (!error) row = data;
      }
    }
    if (row && typeof row.gemmes === "number") {
      localStorage.setItem(LS_GEMMES, String(row.gemmes));
      try {
        window.dispatchEvent(
          new CustomEvent("pg-gemmes-changed", {
            detail: { balance: row.gemmes },
          }),
        );
      } catch {}
      return row.gemmes;
    }
  } catch {}
  return getGemmes();
}

export function addGemmes(n) {
  const next = getGemmes() + n;
  localStorage.setItem(LS_GEMMES, String(next));
  _scheduleSave();
  // Crédit serveur par le RPC sanctionné : l'UPDATE direct de profiles.gemmes
  // était BLOQUÉ silencieusement par le trigger protect_profile_fields (le
  // solde local montait puis se faisait écraser par le solde serveur inchangé
  // au prochain refreshGemmes). add_gemmes passe le trigger et renvoie le
  // solde canonique — on aligne le local dessus dès la réponse.
  if (_userId) {
    Promise.resolve(sb.rpc("add_gemmes", { p_amount: n }))
      .then(({ data, error }) => {
        if (error || data?.error) {
          console.warn("[game-state] add_gemmes refusé", error || data?.error);
          return;
        }
        if (typeof data?.new_balance === "number") {
          localStorage.setItem(LS_GEMMES, String(data.new_balance));
          window.dispatchEvent(
            new CustomEvent("pg-gemmes-changed", {
              detail: { balance: data.new_balance },
            }),
          );
        }
      })
      .catch((e) => console.warn("[game-state] add_gemmes échec réseau", e));
  }
  return next;
}

function spendGemmes(n) {
  const cur = getGemmes();
  if (cur < n) return false;
  const next = cur - n;
  localStorage.setItem(LS_GEMMES, String(next));
  _scheduleSave();
  // Pas d'écriture directe de profiles.gemmes : elle était bloquée par le
  // trigger protect_profile_fields (échec silencieux). Le seul débit sanctionné
  // côté serveur est purchase_item (utilisé par la boutique) — ce débit local
  // ne sert que l'aperçu optimiste.
  return true;
}

// ─── Inventaire ──────────────────────────────────────────────────
function getOwnedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_OWNED) || "[]"));
  } catch {
    return new Set();
  }
}

export function getOwnedItems() {
  return Array.from(getOwnedSet());
}
function ownsItem(itemId) {
  return getOwnedSet().has(itemId);
}

function addOwnedItem(itemId) {
  const s = getOwnedSet();
  s.add(itemId);
  localStorage.setItem(LS_OWNED, JSON.stringify(Array.from(s)));
  _scheduleSave();
}

// ─── Équipement ───────────────────────────────────────────────────
export function getEquipped() {
  try {
    return JSON.parse(localStorage.getItem(LS_EQUIPPED) || "{}");
  } catch {
    return {};
  }
}

export function equipItem(slot, itemId) {
  const eq = getEquipped();
  eq[slot] = itemId;
  localStorage.setItem(LS_EQUIPPED, JSON.stringify(eq));
  _scheduleSave();
  if (slot === "theme") applyThemeColor(itemId);
  window.dispatchEvent(
    new CustomEvent("pg-equipped-changed", { detail: { slot, itemId } }),
  );
}

export function unequipItem(slot) {
  const eq = getEquipped();
  delete eq[slot];
  localStorage.setItem(LS_EQUIPPED, JSON.stringify(eq));
  _scheduleSave();
  if (slot === "theme") applyThemeColor(null);
  window.dispatchEvent(
    new CustomEvent("pg-equipped-changed", { detail: { slot, itemId: null } }),
  );
}

// ─── Asset équipé (URL résolue) ───────────────────────────────────
// Le localStorage d'équipement ne garde que l'id ; les items boutique (avatars,
// fonds permis) ont une asset_url qu'on stocke ici pour pouvoir les AFFICHER.
const LS_EQUIPPED_ASSETS = "pg-equipped-assets";
export function getEquippedAsset(slot) {
  try {
    return (
      JSON.parse(localStorage.getItem(LS_EQUIPPED_ASSETS) || "{}")[slot] || null
    );
  } catch {
    return null;
  }
}
export function setEquippedAsset(slot, url) {
  let m = {};
  try {
    m = JSON.parse(localStorage.getItem(LS_EQUIPPED_ASSETS) || "{}");
  } catch {}
  if (url) m[slot] = url;
  else delete m[slot];
  try {
    localStorage.setItem(LS_EQUIPPED_ASSETS, JSON.stringify(m));
  } catch {}
  _scheduleSave(); // persiste l'URL équipée en DB (suivi entre appareils)
  // Notifie les vues persistantes (header) pour rafraîchir l'affichage sans reload
  try {
    window.dispatchEvent(
      new CustomEvent("pg:cosmetics-changed", { detail: { slot } }),
    );
  } catch {}
}

// ─── Achat ────────────────────────────────────────────────────────
export function purchaseItem(itemId, cost) {
  if (ownsItem(itemId)) return { ok: false, error: "already-owned" };
  if (!spendGemmes(cost)) return { ok: false, error: "insufficient-gemmes" };
  addOwnedItem(itemId);
  return { ok: true };
}

// ─── Couleurs de thème custom ─────────────────────────────────────
// Mêmes 4 tokens que utils/accent.js (--a/--adk/--a-lt/--a-ink) : un thème
// boutique recolore TOUTE l'app, sans reste violet sur les éléments qui
// utilisent --a-lt ou --a-ink. `ink` = texte posé sur l'accent (contraste AA).
const THEME_COLORS = {
  rose: {
    a: "#ec4899",
    adk: "#be185d",
    lt: "#fb7bb8",
    ink: "#ffffff",
    ap: "rgba(236,72,153,.09)",
  },
  vert: {
    a: "#10b981",
    adk: "#047857",
    lt: "#34d399",
    ink: "#04281d",
    ap: "rgba(16,185,129,.09)",
  },
  cyan: {
    a: "#0ea5e9",
    adk: "#0369a1",
    lt: "#38bdf8",
    ink: "#062c3f",
    ap: "rgba(14,165,233,.09)",
  },
  rouge: {
    a: "#ef4444",
    adk: "#b91c1c",
    lt: "#f87171",
    ink: "#ffffff",
    ap: "rgba(239,68,68,.09)",
  },
};

function applyThemeColor(themeId) {
  const root = document.documentElement;
  // Accepte aussi bien "rouge" que "theme_rouge" (id boutique)
  const key =
    typeof themeId === "string" ? themeId.replace(/^theme_/, "") : themeId;
  const c = key && THEME_COLORS[key];
  if (c) {
    root.style.setProperty("--a", c.a);
    root.style.setProperty("--adk", c.adk);
    root.style.setProperty("--a-lt", c.lt);
    root.style.setProperty("--a-ink", c.ink);
    root.style.setProperty("--ap", c.ap);
  } else {
    root.style.removeProperty("--a");
    root.style.removeProperty("--adk");
    root.style.removeProperty("--a-lt");
    root.style.removeProperty("--a-ink");
    root.style.removeProperty("--ap");
  }
}

export function initEquippedTheme() {
  const eq = getEquipped();
  if (eq.theme) applyThemeColor(eq.theme);
}
