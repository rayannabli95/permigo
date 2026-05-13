# 🔒 PermiGo — Setup sécurité

Tout ce qui se passe **côté code** est déjà fait (honeypot, rate limit client, magic link/OTP UI, intégration Turnstile). Il reste 3 choses à activer **côté Supabase + Cloudflare** pour que la protection soit complète.

## ✅ 1. Magic link / OTP — Supabase

**Sans rien faire de plus**, le bouton "Recevoir un code par email" sur la page login envoie un code OTP à 6 chiffres + un magic link cliquable, en utilisant la config Supabase email par défaut.

À vérifier :

1. https://supabase.com/dashboard/project/_/auth/providers
2. **Email** doit être ✅ Enabled
3. Sous l'onglet **Email Templates**, le template **Magic Link** doit avoir `{{ .Token }}` (code 6 chiffres) ET `{{ .ConfirmationURL }}` (lien cliquable)
4. Sous **URL Configuration**, ajoute ton domaine de redirection :
   - `https://rayannabli95.github.io/permigo/`
   - `http://localhost:5173/`

## ✅ 2. Rate limiting — Supabase

Supabase a un rate limit global natif (déjà actif). Pour le durcir :

1. https://supabase.com/dashboard/project/_/auth/rate-limits
2. Limites recommandées pour PermiGo :
   - **Sign-up / sign-in (per IP)** : 10 par heure
   - **Send OTP** : 5 par heure par email
   - **Verify OTP** : 5 par 5 min
   - **Token refresh** : 30 par heure

Le rate limit client (localStorage) est aussi actif : 5 tentatives login par 5 min par email, 3 signups par 10 min, 3 OTP par 5 min.

## ✅ 3. Cloudflare Turnstile — captcha invisible

### Côté Cloudflare

1. Crée un compte gratuit sur https://dash.cloudflare.com/sign-up
2. Menu gauche → **Turnstile** → bouton **Add Site**
3. Remplis :
   - **Site name** : PermiGo
   - **Domain** : `rayannabli95.github.io` et `localhost`
   - **Widget mode** : **Managed** (recommandé)
4. Tu obtiens 2 clés :
   - **Site key** (publique, commence par `0x4AAA...`)
   - **Secret key** (privée, commence par `0x4AAA...`)

### Côté code (PermiGo)

Édite `.env` à la racine et ajoute :

```
VITE_TURNSTILE_SITEKEY=0x4AAA...ta_site_key_publique
```

Puis push sur GitHub. **Important** : sur GitHub Actions, va dans **Settings → Secrets and variables → Actions → Variables** et ajoute la même variable `VITE_TURNSTILE_SITEKEY` pour qu'elle soit injectée au build de prod (sinon Turnstile sera désactivé en prod).

### Côté Supabase

1. https://supabase.com/dashboard/project/_/auth/settings
2. Scroll jusqu'à **Bot and Abuse Protection**
3. Coche **Enable Captcha protection**
4. **Captcha Provider** : `Turnstile`
5. **Captcha Secret** : colle ta **Secret key** Cloudflare
6. **Save**

Désormais, chaque appel `signInWithPassword` / `signUp` / `signInWithOtp` doit fournir un `captchaToken` valide, sinon Supabase rejette. Le code PermiGo le fait automatiquement.

## 🛡️ Récap protection PermiGo

| Couche | Quoi | Où |
|---|---|---|
| **Honeypot** | Champs cachés `website_url`, `fax_number` — bots les remplissent | `src/utils/honeypot.js`, intégré login + signup |
| **Rate limit client** | localStorage : 5 essais login/5min, 3 signups/10min, 3 OTP/5min | `src/utils/rate-limit.js` |
| **Rate limit serveur** | Supabase Auth rate limits natifs | Dashboard Supabase |
| **Captcha** | Cloudflare Turnstile invisible (mode managed) | `src/utils/turnstile.js` + Supabase |
| **Magic link / OTP** | Login sans mot de passe via code email | `loginWithOtp()` + `verifyOtp()` dans `auth.js` |
| **PKCE flow** | Échange code sécurisé pour magic link (anti-interception) | `flowType: 'pkce'` dans `auth.js` |

## 🧪 Tester

1. Ouvre la console réseau
2. Tente 6 logins faux avec le même email → le 6e doit être bloqué client-side
3. Si Turnstile est configuré : tu verras des appels à `challenges.cloudflare.com`
4. Tente le bouton "Recevoir un code par email" → vérifie ta boîte mail
5. Le champ honeypot doit être totalement invisible (Inspect → présent en DOM mais `position:absolute;left:-10000px`)
