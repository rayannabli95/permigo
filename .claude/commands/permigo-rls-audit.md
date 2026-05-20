---
description: Audit RLS hebdo sur toutes les tables publiques
---
Connecte-toi au MCP Supabase. Pour chaque table dans `public` :

1. Vérifie si RLS est activée. Non → ALERTE ROUGE.
2. Liste policies SELECT / INSERT / UPDATE / DELETE.
3. Tables sans policy d'auth → ALERTE.
4. `auth.uid() = user_id` sans index sur `user_id` → recommande index.
5. Rapporte sous forme de tableau Markdown.
