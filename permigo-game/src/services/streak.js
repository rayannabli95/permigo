// ═══════════════════════════════════════════════════════════════
// Série de révision (streak) — SOURCE UNIQUE pour l'élève.
//
// Pourquoi ce fichier existe (06/08/2026) : accueil.js, profil.js et
// reviser.js affichaient CHACUN un nombre différent pour la même série
// (ex : « 6 j » sur Réviser, « 0 j » sur Profil, « En cours : 6 » sur la
// fenêtre calendrier de l'accueil). Racine du bug : 3 calculs distincts
// sur la même table `streaks`, chacun avec sa propre demi-règle.
//   - accueil.js  : lisait `current_streak` BRUT (jamais remis à 0 même
//                   si la série est objectivement cassée), + un bump
//                   optimiste local si un quiz a été fait aujourd'hui.
//   - profil.js   : remettait `current_streak` à 0 si `last_activity_date`
//                   datait de plus d'un jour (« périmée ») — SANS le bump.
//   - reviser.js  : lisait `game-state.js#getStreak()`, un cache
//                   localStorage hydraté UNE FOIS au boot de l'app
//                   (`initGameState`), jamais rafraîchi ensuite : un
//                   snapshot figé qui dérive du vrai état DB au fil de
//                   la session.
//
// `current_streak` en base n'est JAMAIS remis à 0 par un job serveur : il
// reste au dernier nombre connu tant qu'aucun nouveau quiz n'a lieu (cf.
// migration 20260709120000_streak_activity_based.sql, fonction
// get_today_quests). Une série « cassée » (dernière activité avant hier)
// a donc un `current_streak` en base qui MENT si on l'affiche tel quel.
// La bonne lecture côté élève : 0 tant que rien n'a été refait.
//
// Règle unique retenue ici (reprend exactement `streakStatus()` qui
// vivait dans accueil.js, la seule des 3 pages à avoir déjà ce concept) :
//   - Aucune activité, ou dernière activité avant hier → status "broken",
//     `current` affiché = 0 (la série n'existe plus, peu importe le nombre
//     figé en base).
//   - Dernière activité aujourd'hui → "saved", `current` = valeur DB
//     (+ bump optimiste si applicable, cf. plus bas).
//   - Dernière activité hier, rien aujourd'hui → "at_risk"/"critical"
//     selon l'heure, `current` = valeur DB (la série tient encore).
// `longest` (record) n'est JAMAIS remis à 0 : c'est un historique.
//
// Deux niveaux d'API :
//   - `getStreakStatus` / `computeEffectiveStreak` : PURS, synchrones.
//     Pour une page qui a déjà les lignes `streaks` + `quiz_attempts` en
//     main (ex : accueil.js, qui les charge de toute façon pour sa
//     heatmap) — zéro requête réseau supplémentaire, juste le calcul
//     unifié.
//   - `getStreak()` : ASYNC, fait sa propre lecture DB si besoin, avec un
//     cache mémoire (module-level, par user id) pour qu'un même écran
//     n'émette pas deux fois la même requête. Pour les pages qui n'ont
//     pas déjà cette donnée sous la main (profil.js, reviser.js).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { todayKey, yesterdayKey } from "@/services/daily-quiz.js";

const EMPTY = {
  current: 0,
  longest: 0,
  status: "broken",
  lastActivityDate: null,
  raw: { current_streak: 0, longest_streak: 0, last_activity_date: null },
};

let _cache = null; // { key, value }
let _pending = null; // { key, promise }

/**
 * Statut d'une série à partir des colonnes brutes `streaks`. Pure,
 * synchrone, réutilisable pour l'affichage (dimming, bandeau SOS…).
 */
export function getStreakStatus(currentStreak, lastActivityDate) {
  if (!currentStreak) return "broken";
  const today = todayKey();
  if (lastActivityDate === today) return "saved";
  const yesterday = yesterdayKey();
  if (lastActivityDate !== yesterday) return "broken";
  const hoursLeft = 24 - new Date().getHours() - new Date().getMinutes() / 60;
  return hoursLeft < 6 ? "critical" : "at_risk";
}

/**
 * Applique le bump optimiste (même règle partout) : si un quiz a été fait
 * AUJOURD'HUI et que la ligne `streaks` n'a pas encore été avancée par le
 * serveur (round-trip de `get_today_quests()` pas encore rejoué), on
 * anticipe l'affichage sans attendre. N'écrit rien en DB.
 *
 * @param {{current_streak?:number, longest_streak?:number, last_activity_date?:string|null}} raw
 * @param {boolean} didActivityToday
 * @returns {{current_streak:number, longest_streak:number, last_activity_date:string|null}}
 */
export function computeEffectiveStreak(raw, didActivityToday) {
  const base = {
    current_streak: raw?.current_streak || 0,
    longest_streak: raw?.longest_streak || 0,
    last_activity_date: raw?.last_activity_date || null,
  };
  const today = todayKey();
  if (!didActivityToday || base.last_activity_date === today) return base;
  const yesterday = yesterdayKey();
  const bumped =
    base.last_activity_date === yesterday ? base.current_streak + 1 : 1;
  return {
    current_streak: bumped,
    longest_streak: Math.max(base.longest_streak, bumped),
    last_activity_date: today,
  };
}

/**
 * Lecture unique de la série de l'élève courant, prête à afficher
 * (`current` déjà à 0 si la série est cassée, déjà bumpée si applicable).
 *
 * @param {object} opts
 * @param {boolean} [opts.force] Ignore le cache mémoire, refetch.
 * @param {boolean} [opts.didActivityToday] Si l'appelant sait déjà
 *   qu'un quiz a été complété aujourd'hui, le passer évite une requête
 *   `quiz_attempts` supplémentaire ici. Sinon ce module vérifie lui-même
 *   (1 requête légère, `limit(1)`).
 * @returns {Promise<{current:number, longest:number, status:string,
 *   lastActivityDate:string|null, raw:object}>}
 */
export async function getStreak({ force = false, didActivityToday } = {}) {
  const me = getCurUser();
  if (!me) return EMPTY;
  const key = me.id;

  if (!force && _cache?.key === key) return _cache.value;
  if (_pending?.key === key) return _pending.promise;

  const promise = (async () => {
    let didToday = didActivityToday;
    const queries = [
      sb
        .from("streaks")
        .select("current_streak, last_activity_date, longest_streak")
        .eq("user_id", key)
        .maybeSingle(),
    ];
    if (didToday == null) {
      const _todayStart = `${todayKey()}T00:00:00.000Z`;
      queries.push(
        sb
          .from("quiz_attempts")
          .select("id")
          .eq("user_id", key)
          .gte("completed_at", _todayStart)
          .limit(1),
      );
    }
    const results = await Promise.allSettled(queries);
    const streakRes = results[0];
    if (didToday == null) {
      didToday = !!results[1]?.value?.data?.length;
    }

    const raw = streakRes?.value?.data || {
      current_streak: 0,
      last_activity_date: null,
      longest_streak: 0,
    };

    const effective = computeEffectiveStreak(raw, didToday);
    const status = getStreakStatus(
      effective.current_streak,
      effective.last_activity_date,
    );
    const current = status === "broken" ? 0 : effective.current_streak;

    const value = {
      current,
      longest: effective.longest_streak,
      status,
      lastActivityDate: effective.last_activity_date,
      raw,
    };
    _cache = { key, value };
    return value;
  })();

  _pending = { key, promise };
  try {
    return await promise;
  } finally {
    if (_pending?.key === key) _pending = null;
  }
}

/** Vide le cache mémoire (rare : après une action qui change la série
 * dans la MÊME session sans reload, ex : gel de série). */
export function clearStreakCache() {
  _cache = null;
  _pending = null;
}
