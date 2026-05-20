---
description: Setup d'un nouveau client auto-école
---
Demande-moi :
1. Nom auto-école
2. Email gérant
3. Nombre de moniteurs (= seats Stripe)
4. URL souhaitée

Puis :
1. Crée la row `driving_schools` via MCP Supabase
2. Crée la subscription Stripe via MCP Stripe (per-seat)
3. Envoie magic-link via Supabase Auth au gérant
4. Génère un guide d'onboarding PDF dans /tmp
5. Confirme tout
