# ✅ done-log.md — Journal append-only

> Ajoute une ligne quand une tâche est **finie et vérifiée**. N'édite jamais les lignes passées (audit trail). Format : `YYYY-MM-DD — [PR #] résumé — vérifié par (build/lint/agent)`.

- 2026-06-21 — Rattachement élève par CODE moniteur (chemin bis à l'invitation email) : migration `20260621120000_join_code.sql` (col `profiles.join_code` + RPC `set_my_join_code`/`get_join_code_info`/`join_moniteur_by_code`) + page `#/rejoindre` (élève self-serve) + bloc code dans `invite-eleve.js` + entrée login. Build vert. ⚠️ migration À APPLIQUER en prod (non commité, non mergé).
- 2026-06-21 — Heartbeat pilier 1 activé : routine cloud quotidienne `trig_01NBuewjGcrtCq4hnKct4SfG` (triage 09h Paris, PR `chore/loop-heartbeat`, ne merge pas). Bloqué tant que GitHub non connecté.
- 2026-06-21 — Vault Loop Engineering initialisé (`.claude/loop/`) — charte + 4 fichiers d'état seedés sur l'état réel (HEAD @ 6a8a7f0).
- 2026-06-21 — [#243] Quiz vocal : lecture FR de la question + meilleure voix dispo + bouton muet persistant — mergé main.
- 2026-06-20 — [#242] Centres d'examen : +fiches Massy / Évry (91) / Melun–Vaux-le-Pénil (77) — mergé main.
- 2026-06-20 — [#217/#218] Refonte intuition élève + enseignant (vocab, trophées auto, empty states pédagogiques, nom réel) — build vert, baseline-diff e2e OK.
- 2026-06-20 — Sécu prélancement appliquée en prod : IDOR + streak + consolidation policies + RPC onboarding (PR #223 mergée).
