# 🔧 PermiGo - Guide de Réparation du Login

**Date:** 10 mai 2026  
**Problème:** Login échoue pour Elyne et Rayan (erreur 400 sur /token)  
**Cause:** Les comptes auth.users n'existent pas dans Supabase

---

## ✅ Étapes de correction

### **Étape 1 : Initialiser les comptes auth** (CRITIQUE)

1. Ouvre le fichier: `/Users/macbookm3/Library/Application Support/Claude/local-agent-mode-sessions/e2df268e-8ea9-4e74-908f-020cc4283cd6/370dfa6e-289a-4043-baa4-14e25bd96da7/local_f4545afb-8666-4738-baed-f7bb98227ae7/outputs/fix-auth.html`
   
2. **Récupère ta clé Service Role** depuis Supabase:
   - Va à: https://app.supabase.com/project/ivtuheoyfgljujliscwf/settings/api
   - Copie la clé **Service Role** (pas la clé anon)
   - C'est une clé JWT qui commence par `eyJhbGci...`

3. **Dans fix-auth.html**, remplace la clé vide:
   ```html
   <input type="password" id="key" placeholder="..."
          value="PASTE_TA_CLE_SERVICE_ROLE_ICI">
   ```

4. **Ouvre fix-auth.html dans le navigateur** et clique:
   - ✅ **"Initialiser les comptes"** → crée Elyne + Rayan dans auth.users
   - 🔍 **"Vérifier les comptes"** → vérifie que c'est OK

---

### **Étape 2 : Nettoyage Supabase** ✅ DONE

- ✅ Audit_log nettoyé (logs de test supprimés)
- ✅ Base propre (0 données démo)
- ✅ Profils OK (3 utilisateurs: admin, Elyne, Rayan)

---

### **Étape 3 : Améliorer le code du login (optionnel mais recommandé)**

Le code du login dans `index.html` (GitHub) peut être amélioré avec:
- ✅ Retry logic (2 tentatives en cas d'erreur temporaire)
- ✅ Meilleur logging console (pour déboguer)
- ✅ Messages d'erreur plus clairs

**Changements:** Lignes 6480-6801 dans `/tmp/Autopilot/index.html`

Si tu veux appliquer ces changements:
```bash
# Option A: Faire un find/replace manuel dans VS Code
# Option B: Utiliser le script Python fourni (voir ci-dessous)
```

---

## 🧪 Tests après correction

Une fois l'étape 1 complétée:

```
1. Va à: https://rayannabli95.github.io/Autopilot/
2. Essaie de te connecter avec:
   - Email: elyne@autopilot.fr
   - Mot de passe: Autopilot2025!
3. Ouvre la console (Cmd+Opt+J) et tu devrais voir:
   [LOGIN] Tentative 1/2: signIn avec elyne@autopilot.fr
   [LOGIN] signInWithPassword réponse: {...}
   [LOGIN] ✅ Auth OK. user_id=60122db2...
   [LOGIN] ✅ Profil OK: {role: 'eleve', nom: 'Elyne'}
```

---

## 📊 État actuel de Supabase

| Table | Rows | Status |
|-------|------|--------|
| profiles | 3 | ✅ Admin + Elyne + Rayan |
| events | 0 | ✅ Clean |
| audit_log | 0 | ✅ Clean |
| remc_entries | 0 | ✅ Clean |
| absences | 0 | ✅ Clean |
| notations | 0 | ✅ Clean |
| autres | 0 | ✅ Clean |

---

## 🔑 Comptes Supabase

| Rôle | Email | Mot de passe | Status |
|------|-------|--------------|--------|
| admin | rayannabli27@gmail.com | (connu) | ✅ OK |
| eleve | elyne@autopilot.fr | Autopilot2025! | ⏳ À initialiser |
| moniteur | rayan@autopilot.fr | Autopilot2025! | ⏳ À initialiser |

---

## 🚀 Prochaines étapes

1. **IMMÉDIAT:** Utilise fix-auth.html pour initialiser Elyne + Rayan
2. **PUIS:** Teste le login à https://rayannabli95.github.io/Autopilot/
3. **OPTIONNEL:** Améliore le code du login dans index.html avec les changements proposés

---

## ❓ Troubleshooting

### Erreur "Clé Service Role manquante"
→ Copie la vraie clé depuis https://app.supabase.com/project/ivtuheoyfgljujliscwf/settings/api

### Erreur "Auth: invalid JWT"
→ La clé Service Role est expirée ou invalide. Récupère une nouvelle clé.

### "Profil existe déjà" après init
→ Normal, ça veut dire que les comptes et profils sont déjà là. Ça va marcher!

### Login toujours en erreur après init
→ Ouvre la console (Cmd+Opt+J) et partage les erreurs rouges

---

## 📝 Notes

- La clé Service Role est sensible → **ne la partage jamais publiquement**
- Les mots de passe Elyne/Rayan sont: `Autopilot2025!`
- RLS activée sur toutes les tables (sécurisé)
- GitHub Pages sera auto-actualisé quand tu pushs les changements

**Besoin d'aide?** Partage les erreurs console + la réponse du fix-auth.html
