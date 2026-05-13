# Edge Function — `create-user`

Permet à un admin (gérant) de créer un compte élève ou moniteur depuis le frontend
PermiGo. Utilise la `SUPABASE_SERVICE_ROLE_KEY` côté serveur — jamais exposée au client.

## Déploiement

```bash
# Une seule fois
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>

# Déploiement de la fonction
supabase functions deploy create-user

# Si tu veux la rendre publique sans JWT vérifié par Supabase (on vérifie nous-mêmes le JWT)
supabase functions deploy create-user --no-verify-jwt
# ⚠️ Garde la vérification par défaut, la fonction check elle-même le JWT + rôle admin
```

Les variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
sont injectées **automatiquement** par Supabase dans les edge functions — pas
besoin de les setter manuellement.

## Test local

```bash
supabase start                              # démarre Supabase local
supabase functions serve create-user        # lance la fonction sur localhost:54321
```

Puis dans le frontend, surcharge `SUPABASE_URL=http://localhost:54321` pour tester.

## Logs

```bash
supabase functions logs create-user --tail
```

## Appel depuis le frontend

```js
const { data, error } = await sb.functions.invoke('create-user', {
  body: { nom, email, tel, forfait_h: 20, role: 'eleve' },
});

if (error || data?.error) {
  // gérer l'erreur
}
// data.userId, data.action_link disponibles
```

## Sécurité

1. Vérifie le JWT de l'appelant (`auth.getUser()`)
2. Vérifie son rôle `admin` dans la table `profiles`
3. Si non-admin → 403
4. Si la création du profil échoue après création de l'auth user → rollback
   (`auth.admin.deleteUser`)
5. Refuse si un profil avec le même email existe déjà → 409
