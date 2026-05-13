# 🔐 PermiGo Autopilot - Real Test Accounts

## EXISTING ACCOUNTS IN SUPABASE

| Name | Email | UID | Role | Password |
|------|-------|-----|------|----------|
| **Elyne Semaan** | elyne.semaan@autopilot.fr | fee86cb-a668-4556-80d8-02dcfc113378 | ? | ⚠️ Unknown |
| **Lassaad Sahli** | lassaad.sahli@autopilot.fr | 8e0d39d7-3cc5-492a-ab11-6e501e79779d | ? | ⚠️ Unknown |
| **Latifa Sahli** | latifa.sahli@autopilot.fr | 5abe0d30-b912-4ae2-8777-1fbd5b7a5f67 | ? | ⚠️ Unknown |
| **Rayan Nabli** | rayan.nabli@autopilot.fr | d9731711-29b6-4e31-8c2b-21631145116c | ? | ⚠️ Unknown |
| **Rayannabli** | rayannabli27@gmail.com | 0ff64d18-752c-4884-b2b0-364dffb88459 | ? | ⚠️ Unknown |
| **Sherine Nabli** | sherine.nabli@autopilot.fr | 426a1f86-cbf9-4818-85b1-5adc51d7c4b8 | ? | ⚠️ Unknown |

---

## ROLES NEEDED FOR QA TESTING

To run the Master QA Prompt, we need:

```
✅ Manager/Admin (1): Gérer moniteurs et élèves
✅ Instructor (2): Créer leçons, noter élèves  
✅ Student (2): Assister leçons, voir progression
```

---

## ACTION REQUIRED

**Check which account has which role:**

In Supabase:
1. Go to: https://app.supabase.com → Project → SQL Editor
2. Run:
```sql
SELECT nom, email, role FROM profiles WHERE email IN 
('elyne.semaan@autopilot.fr', 'lassaad.sahli@autopilot.fr', 
'latifa.sahli@autopilot.fr', 'rayan.nabli@autopilot.fr');
```

**Get passwords:**

If you have access to reset, use Supabase → Authentication → Users → {user} → Reset Password

OR if you remember them, paste here:
```
Elyne password: _____
Lassaad password: _____
Latifa password: _____
Rayan password: _____
Sherine password: _____
```

---

## FILES READY

✅ HTML: `/Users/macbookm3/Desktop/autopilot-project-9/autopilot.html`
✅ Login: `/Users/macbookm3/Desktop/autopilot-project-9/login-test.html`
✅ Master Prompt: `/Users/macbookm3/Desktop/PROMPT_MASTER_PERMIGO_TESTER.md`
✅ Audit Report: `/Users/macbookm3/Desktop/PermiGo_Audit_Report.docx`

**Once you confirm roles + passwords, I'll update the QA setup with real accounts.**

