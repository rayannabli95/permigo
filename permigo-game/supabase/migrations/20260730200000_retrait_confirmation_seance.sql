-- ═══════════════════════════════════════════════════════════════
-- 20260730200000 — Retrait de la confirmation de séance
--
-- Suite (et fin) du retrait de l'émission moniteur → élève. Le lot 4
-- (20260730120000) avait coupé 5 canaux, mais il en restait UN, entier :
--
--   le moniteur enregistre une séance  →  l'élève reçoit une notification
--   →  il ouvre #/sessions/{id}  →  il confirme ou refuse.
--
-- Rayan, 30/07/2026 : « on n'a pas besoin de confirmation de séance ».
--
-- ⚠️ CE QUI A ÉTÉ TROUVÉ EN CREUSANT : l'écran de saisie de séance avait été
-- supprimé en #608, mais les RPC d'écriture étaient RESTÉES OUVERTES à
-- `authenticated`. `log_session` / `log_session_v2` sont encore appelables —
-- juste plus appelées. La porte de l'interface était fermée, pas celle du
-- serveur. Et deux déclencheurs sur `sessions_moniteur`
-- (trg_notify_eleve_on_session_insert, trg_notify_eleve_session_logged)
-- notifiaient l'élève à chaque insertion : un 6e canal d'émission que #608
-- n'avait pas vu.
--
-- MÉTHODE : REVOKE, pas DROP — même choix qu'en #608. Le corps des fonctions
-- reste en base, une seule ligne de GRANT les rouvre si on se trompe.
-- Les déclencheurs sont laissés en place : sans écriture possible, ils ne
-- peuvent plus se déclencher. On ferme la porte, on ne casse pas la maison.
--
-- ZÉRO donnée supprimée : les 3 lignes de `sessions_moniteur` et la policy
-- de LECTURE restent. On arrête d'écrire, pas de lire.
--
-- NON TOUCHÉ VOLONTAIREMENT : `send_push_on_notification_insert` garde
-- 'session_confirmation' dans son allowlist. Plus aucune notification de ce
-- type ne peut naître (l'insertion de séance est fermée ci-dessous), donc
-- l'entrée est morte et inoffensive. La retirer imposerait de réécrire tout
-- le corps de la fonction pour zéro gain : on ne prend pas ce risque ici.
-- ═══════════════════════════════════════════════════════════════

-- ── Écriture : enregistrer une séance ──────────────────────────
REVOKE EXECUTE ON FUNCTION public.log_session(uuid, integer, date, text)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_session(uuid, integer, date, text, text[], text)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_session_v2(uuid, integer, date, text, text[], text)
  FROM authenticated;

-- ── Écriture : confirmer / refuser une séance ──────────────────
REVOKE EXECUTE ON FUNCTION public.confirm_session(uuid, text) FROM authenticated;

-- ── Lectures qui n'alimentaient QUE ces écrans (zéro appel restant
--    dans src/ après cette PR) ───────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.get_pending_sessions_eleve() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_pending_sessions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_today_sessions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_duplicate_session(uuid, date) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.suggest_next_session(integer) FROM authenticated;
