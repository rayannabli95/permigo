# 🚀 PermiGo QA Testing - FINAL SETUP READY

## TEST ACCOUNTS (Real Users)

### Primary Credentials

```
Password Option 1: Autopilot2025!
Password Option 2: Auto1234
```

**Try both if one fails - system may have different policies per user**

---

## PERSONAS FOR QA TESTING

### MANAGER/ADMIN
```
Email:    rayan.nabli@autopilot.fr
Password: Autopilot2025! or Auto1234
Role:     admin
Purpose:  Manage instructors, assign students, view reports
```

### INSTRUCTOR #1
```
Email:    elyne.semaan@autopilot.fr
Password: Autopilot2025! or Auto1234
Role:     moniteur
Purpose:  Create lessons, rate students, track hours
```

### INSTRUCTOR #2
```
Email:    lassaad.sahli@autopilot.fr
Password: Autopilot2025! or Auto1234
Role:     moniteur
Purpose:  Secondary instructor for multi-teacher workflows
```

### STUDENT #1
```
Email:    latifa.sahli@autopilot.fr
Password: Autopilot2025! or Auto1234
Role:     élève
Purpose:  Attend lessons, view progress
```

### STUDENT #2
```
Email:    sherine.nabli@autopilot.fr
Password: Autopilot2025! or Auto1234
Role:     élève
Purpose:  Secondary student for multi-student workflows
```

### BACKUP ADMIN
```
Email:    rayannabli27@gmail.com
Password: Autopilot2025! or Auto1234
Role:     admin (assumed)
Purpose:  Alternative admin access if needed
```

---

## FILES TO USE

✅ **HTML Application**: `/Users/macbookm3/Desktop/autopilot-project-9/autopilot.html`
✅ **Login Tester**: `/Users/macbookm3/Desktop/autopilot-project-9/login-test.html`
✅ **Master QA Prompt**: `/Users/macbookm3/Desktop/PROMPT_MASTER_PERMIGO_TESTER.md`
✅ **Audit Report**: `/Users/macbookm3/Desktop/PermiGo_Audit_Report.docx`

---

## WORKFLOW FOR NEW CONVERSATION

**Copy & Paste This Into Claude Opus 4.6:**

```markdown
# PermiGo Autopilot - Comprehensive QA Testing

## Test Accounts Ready

1. Admin: rayan.nabli@autopilot.fr (Autopilot2025! or Auto1234)
2. Instructor 1: elyne.semaan@autopilot.fr
3. Instructor 2: lassaad.sahli@autopilot.fr
4. Student 1: latifa.sahli@autopilot.fr
5. Student 2: sherine.nabli@autopilot.fr

## HTML Files

- App: /Users/macbookm3/Desktop/autopilot-project-9/autopilot.html
- Login: /Users/macbookm3/Desktop/autopilot-project-9/login-test.html

## Master QA Prompt

[PASTE ENTIRE CONTENT OF: /Users/macbookm3/Desktop/PROMPT_MASTER_PERMIGO_TESTER.md HERE]

---

🚀 START COMPREHENSIVE QA TESTING NOW
```

---

## QUICK PRE-FLIGHT CHECK

Before launching QA test, verify you can login to:

```
[ ] Admin (rayan.nabli@autopilot.fr)
    Expected: Gestion du Personnel menu visible
    
[ ] Instructor (elyne.semaan@autopilot.fr)
    Expected: Mes Élèves list visible
    
[ ] Student (latifa.sahli@autopilot.fr)
    Expected: Mon Moniteur info visible
```

If login fails, try the alternate password.

---

## TROUBLESHOOTING

**"Identifiants invalides"**
- Try other password option
- Check email case (should be lowercase)
- Check Supabase auth service is connected

**"User not found"**
- Confirm email is exact match
- Check account exists in Supabase auth

**"Session expired"**
- Clear browser cache/cookies
- Re-login with fresh credentials

---

**Status**: ✅ READY FOR QA TESTING
**Test Duration**: 1 context window (Opus 4.6)
**Expected Output**: Complete bug report + LIVRABLE/NON-LIVRABLE verdict

🎯 Go!
