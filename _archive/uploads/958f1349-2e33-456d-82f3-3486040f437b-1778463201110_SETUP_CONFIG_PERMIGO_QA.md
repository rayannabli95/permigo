# 🔐 PermiGo QA Testing - Setup & Credentials

## FILES NEEDED FOR QA TESTING CONVERSATION

### HTML Files Location
All files are in: `/Users/macbookm3/Desktop/autopilot-project-9/`

```
autopilot-project-9/
├── autopilot.html          ← Main application
├── login-test.html         ← Login testing interface
└── [index.html not found - may be same as autopilot.html]
```

**Action**: Copy these files to test directory or use directly from Desktop

---

## TEST ACCOUNT CREDENTIALS

### ACCOUNT 1: MANAGER (École Admin)

```
Email:    manager@permigo.local
Password: PermManager2024!
Role:     admin
Name:     Philippe Rousseau
Phone:    +33612345670
Created:  Auto-generate via signup form
```

**Setup Steps:**
1. Open `autopilot.html`
2. Click "S'inscrire" (Register)
3. Select role: "Gérant" (Manager)
4. Fill form with credentials above
5. Confirm email (simulate or check console)
6. Login with credentials

---

### ACCOUNT 2: INSTRUCTOR #1 (Jean-Pierre)

```
Email:    jp.dubois@permigo.local
Password: Moniteur2024!JP
Role:     moniteur
Name:     Jean-Pierre Dubois
Phone:    +33612345671
Agréement: MON-2024-001
Created:  By manager (via "Ajouter Moniteur")
```

**Setup Steps:**
1. Login as Manager
2. Go to "Gestion du Personnel"
3. Click "Ajouter Moniteur"
4. Fill form with credentials above
5. System generates temp password → send to email
6. First login: Reset password to `Moniteur2024!JP`

---

### ACCOUNT 3: INSTRUCTOR #2 (Luc Fontaine)

```
Email:    luc.fontaine@permigo.local
Password: Moniteur2024!Luc
Role:     moniteur
Name:     Luc Fontaine
Phone:    +33612345672
Agréement: MON-2024-002
Created:  By manager (via "Ajouter Moniteur")
```

**Setup Steps:**
Same as Instructor #1, created Thursday 9am during QA test

---

### ACCOUNT 4: STUDENT #1 (Marie Martin)

```
Email:    marie.martin@permigo.local
Password: Eleve2024!Marie
Role:     élève
Name:     Marie Martin
Phone:    +33612345673
NEP:      1234567890
DOB:      2003-05-12
Forfait:  40h
Created:  Auto-assign by manager
```

**Setup Steps:**
1. As manager: Go to "Inscriptions"
2. Click "Importer Élèves" or create manually
3. Fill form with credentials above
4. Assign to Jean-Pierre
5. Student receives email with login link
6. First login: Reset password to `Eleve2024!Marie`

---

### ACCOUNT 5: STUDENT #2 (Marc Durand)

```
Email:    marc.durand@permigo.local
Password: Eleve2024!Marc
Role:     élève
Name:     Marc Durand
Phone:    +33612345674
NEP:      1234567891
DOB:      2004-08-22
Forfait:  30h
Created:  Auto-assign by manager
```

---

### ACCOUNT 6: STUDENT #3 (Lisa Petit)

```
Email:    lisa.petit@permigo.local
Password: Eleve2024!Lisa
Role:     élève
Name:     Lisa Petit
Phone:    +33612345675
NEP:      1234567892
DOB:      2003-11-08
Forfait:  40h
Created:  Auto-assign by manager
```

---

### ACCOUNT 7: NEW STUDENT (Sophie Leclerc) - Created During QA

```
Email:    sophie.leclerc@permigo.local
Password: Eleve2024!Sophie
Role:     élève
Name:     Sophie Leclerc
Phone:    +33698765432
NEP:      9876543210
DOB:      1998-07-15
Forfait:  40h
Created:  Wednesday 10am via public signup form
```

**Setup Steps:**
1. During QA test: Go to `autopilot.html#/inscription`
2. Fill registration form with credentials above
3. System creates account and sends confirmation email
4. Manager assigns to Jean-Pierre
5. Sophie receives invitation email
6. First login: Reset password to `Eleve2024!Sophie`

---

## DATABASE SEEDING SCRIPT

If Supabase allows direct SQL, use this to pre-populate test accounts:

```sql
-- Create manager profile
INSERT INTO profiles (auth_id, role, nom, email, tel, created_at)
VALUES ('auth-manager-uuid', 'admin', 'Philippe Rousseau', 'manager@permigo.local', '+33612345670', NOW());

-- Create instructors
INSERT INTO profiles (auth_id, role, nom, email, tel, created_at)
VALUES 
  ('auth-jp-uuid', 'moniteur', 'Jean-Pierre Dubois', 'jp.dubois@permigo.local', '+33612345671', NOW()),
  ('auth-luc-uuid', 'moniteur', 'Luc Fontaine', 'luc.fontaine@permigo.local', '+33612345672', NOW());

-- Create students
INSERT INTO profiles (auth_id, role, nom, email, tel, dob, neph, created_at)
VALUES 
  ('auth-marie-uuid', 'élève', 'Marie Martin', 'marie.martin@permigo.local', '+33612345673', '2003-05-12', '1234567890', NOW()),
  ('auth-marc-uuid', 'élève', 'Marc Durand', 'marc.durand@permigo.local', '+33612345674', '2004-08-22', '1234567891', NOW()),
  ('auth-lisa-uuid', 'élève', 'Lisa Petit', 'lisa.petit@permigo.local', '+33612345675', '2003-11-08', '1234567892', NOW());

-- Create enrollments
INSERT INTO inscriptions (eleve_id, moniteur_principal_id, inscription_date, forfait_heures, statut, created_at)
VALUES 
  ((SELECT id FROM profiles WHERE email='marie.martin@permigo.local'),
   (SELECT id FROM profiles WHERE email='jp.dubois@permigo.local'),
   NOW(), 40, 'active', NOW()),
  ((SELECT id FROM profiles WHERE email='marc.durand@permigo.local'),
   (SELECT id FROM profiles WHERE email='jp.dubois@permigo.local'),
   NOW(), 30, 'active', NOW()),
  ((SELECT id FROM profiles WHERE email='lisa.petit@permigo.local'),
   (SELECT id FROM profiles WHERE email='jp.dubois@permigo.local'),
   NOW(), 40, 'active', NOW());
```

---

## QUICK LOGIN CHECKLIST

Before starting QA test, verify you can login to:

```
[ ] Manager account
    Email: manager@permigo.local
    Expected: Admin dashboard with "Gestion du Personnel"

[ ] Instructor #1 account
    Email: jp.dubois@permigo.local
    Expected: Instructor dashboard with "Mes Élèves" list

[ ] Student #1 account
    Email: marie.martin@permigo.local
    Expected: Student dashboard with "Mon Moniteur: Jean-Pierre Dubois"
```

If any login fails:
1. Check browser console for errors (F12)
2. Verify Supabase auth is connected
3. Check email case sensitivity (should be lowercase)
4. Reset password via "Mot de passe oublié" if needed

---

## ENVIRONMENT VARIABLES (If needed)

```
VITE_SUPABASE_URL=https://ivtuheoyifgljujliscwf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dHVoZW95aWZnbGp1amxpc2N3ZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc4MTgyNjk4LCJleHAiOjIwOTM3NTg2OTh9.NP4V9qjM30qy8cNLf6dO02W_gbuztBqpty_jA8CsbI0

APP_ENV=test
API_URL={your_app_url}
```

---

## TESTING CHECKLIST

### Pre-Test Setup
- [ ] HTML files accessible
- [ ] Supabase connection working
- [ ] All 7 accounts can login
- [ ] Manager can see "Ajouter Moniteur" button
- [ ] Instructors can see "Mes Élèves" list
- [ ] Students can see "Mon Moniteur" info

### During QA (Use Master Prompt)
- [ ] Manager: Add Instructor #2 (Thursday)
- [ ] Instructor #1: Create 9 lessons (Mon-Fri)
- [ ] Student #1: Attend all 9 lessons
- [ ] New Student: Register & get assigned (Wednesday)
- [ ] Verify: No data loss, permissions enforced, notifications sent

### Post-Test Validation
- [ ] All lessons created (10 total)
- [ ] All ratings assigned (9-10 total)
- [ ] All competencies tracked (180+ items)
- [ ] Database consistent (no orphaned records)
- [ ] Bug report generated

---

## COMMON ISSUES & FIXES

**Issue: "Email verification required"**
- Solution: Check browser console, look for email verification link
- Workaround: Use test email service (simulate verification)

**Issue: "Password reset link expired"**
- Solution: Re-send reset email via "Mot de passe oublié"
- Ensure email copy is exact (case-sensitive)

**Issue: "Student not assigned to instructor"**
- Solution: Check manager account has "Gestion du Personnel" access
- Verify student role is 'élève' in database

**Issue: "Lessons not appearing in calendar"**
- Solution: Check browser timezone settings
- Verify lesson datetime is correct
- Refresh page to force reload

**Issue: "Competencies not saving"**
- Solution: Check network tab in browser (F12)
- Verify POST request to `/api/events/{id}/competencies`
- Check Supabase RLS policies allow write

---

## ADDITIONAL RESOURCES

- **Master QA Prompt**: `/Users/macbookm3/Desktop/PROMPT_MASTER_PERMIGO_TESTER.md`
- **Audit Report**: `/Users/macbookm3/Desktop/PermiGo_Audit_Report.docx`
- **GitHub Repo**: https://github.com/rayannabli95/Autopilot
- **Supabase Project**: https://app.supabase.com (project: ivtuheoyifgljujliscwf)

---

## NEXT STEPS

1. **Copy this file** to your testing environment
2. **Verify HTML files** are accessible
3. **Create test accounts** using credentials above
4. **Use Master Prompt** to run comprehensive QA
5. **Document findings** with bug report template
6. **Generate verdict**: LIVRABLE or NON-LIVRABLE

Good luck! 🚀
