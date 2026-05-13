# 🎓 PermiGo Autopilot - Master QA Testing Prompt

**Version**: 1.0 | **Target Model**: Claude Opus 4.6 (Maximum Capability)  
**Task**: Comprehensive System Testing as Multiple User Personas  
**Duration**: Full Week Simulation | **Scope**: All Workflows & Edge Cases

---

## CRITICAL OPERATING PRINCIPLES

### Authority: Non-Negotiable Rules

You MUST follow these rules without exception. No rationalization, no shortcuts.

1. **YOU WILL TEST EVERYTHING** - Complete all workflows to completion, document every state change
2. **YOU WILL REPORT BUGS IMMEDIATELY** - Every error, permission denied, data inconsistency gets logged
3. **YOU WILL MAINTAIN PERSONA INTEGRITY** - Stay in character for each role, never break immersion
4. **YOU WILL DOCUMENT WITH PRECISION** - Every action = timestamp + result + screenshot intent
5. **YOU WILL TEST EDGE CASES** - Intentionally break workflows to find failure modes

### Commitment: Announcement Requirement

Before starting EACH major workflow, you MUST announce:
```
🚀 [START WORKFLOW] {workflow_name} | Persona: {role} | Time: {day_hour}
```

When completing a workflow:
```
✅ [COMPLETE] {workflow_name} | Status: {passed/failed} | Issues Found: {count}
```

### Scarcity: Time-Bound Testing

You have ONE context window to complete comprehensive testing. IMMEDIATELY document findings. Do not defer reporting.

---

## YOUR MISSION

**Objective**: Perform exhaustive QA testing on PermiGo Autopilot by acting as multiple user personas over a simulated week (Monday 8am → Friday 6pm).

**Success Criteria**:
- All workflows executed successfully
- All user roles tested independently
- All permission boundaries verified
- All data consistency checked
- All edge cases attempted
- Complete bug report generated
- Database state validated

**Failure Criteria**:
- Any workflow fails silently
- Any error message appears
- Any permission mistake occurs
- Any data inconsistency found
- Any expected feature missing

---

## THE PERSONAS & WORKFLOWS

### PERSONA 1: MANAGER (Gérant) - Monday 9am

**Role**: School administrator, manages instructors and enrollment  
**Access Level**: Admin-equivalent for school operations

#### Week 1 Monday Tasks:

```
🚀 [START WORKFLOW] Manager Setup & Staff Management | Persona: Manager | Time: Mon 9am

Step 1: Login as Manager
- Navigate to login page
- Email: manager@permigo.local | Password: test123!Manager
- Expected: Dashboard loads with admin menu
- Log: [✓/✗] Login successful

Step 2: Add New Instructor
- Click "Ajouter Moniteur" button
- Fill form:
  * Nom: "Jean-Pierre Dubois"
  * Email: jp.dubois@permigo.local
  * Téléphone: +33612345678
  * Numéro Agréement: "MON-2024-001"
- Expected: Confirmation message, new instructor visible in list
- Log: [✓/✗] Instructor created, ID: {id}

Step 3: Assign Students to Instructor
- Select 3 existing students from pool
- Assign to Jean-Pierre
- Expected: Each student shows "Moniteur Principal: Jean-Pierre"
- Log: [✓/✗] 3 students assigned

Step 4: Configure Max Hours for Instructor
- Click instructor settings
- Set "Heures Maximum": 40h/week
- Save
- Expected: Setting persists on page reload
- Log: [✓/✗] Max hours saved

Step 5: View Instructor Dashboard
- Switch to instructor view
- Expected: Shows assigned students, schedule, hours consumed
- Log: [✓/✗] Dashboard loads with correct data

✅ [COMPLETE] Manager Setup & Staff Management | Status: passed/failed | Issues Found: 0
```

---

### PERSONA 2: INSTRUCTOR #1 (Moniteur Principal) - Monday 10am to Friday 6pm

**Role**: Jean-Pierre Dubois, the instructor added by manager  
**Access Level**: Can see own students, create events, rate students, manage schedule

#### Week 1 Monday - First Day:

```
🚀 [START WORKFLOW] Instructor First Day Setup | Persona: Moniteur JP | Time: Mon 10am

Step 1: Login as Instructor
- Email: jp.dubois@permigo.local | Password: auto-generated-email
- Expected: Email with temp password sent to jp.dubois@permigo.local
- Action: Reset password → "MonitorPass123!"
- Log: [✓/✗] Login successful

Step 2: View Assigned Students
- Expected: See 3 students from manager assignment
- For each student, verify visible:
  * Nom complet
  * Heures planifiées
  * Heures effectuées
  * Dernière progression
- Log: [✓/✗] All 3 students visible with correct data

Step 3: Schedule First Lesson
- Click "Créer Événement"
- Student: "Marie Martin" (Student 1)
- Date: Monday 14:00-15:30 (1.5h)
- Lieu: "Centre Ville - Boulevard de la Paix"
- Type: "Leçon" (lesson)
- Thème: "Conduite urbaine - Croisement d'intersections"
- Notes: "Première leçon - évaluation initiale"
- Save
- Expected: Event appears in calendar, student gets notification
- Log: [✓/✗] Event created, ID: {event_id}

Step 4: Start Lesson (at simulated 14:00)
- Click event "Démarrer Leçon"
- Expected: Interface switches to lesson tracking
- Verify: Timer starts, axes competencies visible
- Log: [✓/✗] Lesson started

Step 5: Track Competencies During Lesson
- 5 axes should be visible:
  1. Mécanique (Mechanics) - ⚙️
  2. Conduite (Driving) - 🛣️
  3. Sécurité (Safety) - 🛑
  4. Vigilance (Awareness) - 👁️
  5. Responsabilité (Responsibility) - 🌍
- For each axis, click to mark competencies:
  * Check 3-4 competencies per axis
  * Comment on each: "Good progress", "Needs work", etc.
- Log: [✓/✗] All 5 axes tracked, {total} competencies marked

Step 6: End Lesson (simulated 15:30)
- Click "Terminer Leçon"
- Rate student 1-5: 3.5/5
- Comment: "Bonne maîtrise des basics, à travailler les intersections"
- Confirm completion
- Expected: Event marked complete, notification sent to student
- Log: [✓/✗] Lesson complete, rating saved

Step 7: View Lesson Summary
- Student progress should update:
  * Hours: 1.5h added to "Heures effectuées"
  * Rating: 3.5/5 visible in history
  * Competencies: Marked axes visible
- Log: [✓/✗] Summary correct, data persisted

✅ [COMPLETE] Instructor First Day Setup | Status: passed/failed | Issues Found: 0
```

#### Tuesday - Friday Pattern (Repeat Daily):

```
FOR EACH DAY (Tue, Wed, Thu, Fri):

🚀 [START WORKFLOW] Daily Instruction Schedule | Persona: Moniteur JP | Time: {Day} 8:00am

Morning (9:00-12:30):
- Lesson 1: Student 2 (Croisements urbains) - 1.5h
- Lesson 2: Student 3 (Autoroute basics) - 1.5h

Afternoon (14:00-17:30):
- Lesson 1: Student 1 (Continuation) - 1.5h
- Lesson 2: Student 2 (Follow-up) - 1.5h

For EACH lesson:
1. Create event
2. Assign date/time/location
3. Start at simulated time
4. Mark 15-20 competencies across axes
5. Rate student (1-5 scale)
6. Add detailed comment
7. End lesson
8. Verify hour tracking updated

Expected Weekly Totals:
- Lessons: 9 total (Mon=1, Tue-Fri=2 per day)
- Hours: 13.5 total
- Competencies tracked: 180+ items
- Ratings given: 9 total
- No errors or data loss

✅ [COMPLETE] Daily Instruction Schedule | Persona: Moniteur JP | Status: passed/failed
```

---

### PERSONA 3: STUDENT #1 (Élève) - Monday 8am to Friday 6pm

**Role**: Marie Martin, student assigned to Jean-Pierre  
**Access Level**: View own lessons, see progress, request help

#### Week 1 Monday:

```
🚀 [START WORKFLOW] Student First Day | Persona: Élève Marie | Time: Mon 8:00am

Step 1: Login as Student
- Email: marie.martin@permigo.local
- Password: auto-generated-email
- Expected: Student dashboard loads
- Log: [✓/✗] Login successful

Step 2: View My Instructor
- Expected: "Moniteur Principal: Jean-Pierre Dubois" visible
- Click to view instructor profile
- Expected: Phone, email, availability visible
- Log: [✓/✗] Instructor profile visible

Step 3: View My Lessons
- Expected: Empty list initially (first lesson at 14:00)
- Verify message: "Aucune leçon planifiée"
- Log: [✓/✗] Correct state

Step 4: Attend First Lesson (14:00)
- Notification arrives at 13:50
- Click notification → lesson details
- Details shown: Time, location, instructor, theme
- Click "Je suis prêt(e)" to confirm attendance
- Expected: Status changes to "Confirmée"
- Log: [✓/✗] Attendance confirmed

Step 5: During Lesson (Real-time)
- Instructor marks competencies
- Student sees real-time progress bar filling
- Expected: Visual feedback of learning progress
- Log: [✓/✗] Real-time updates visible

Step 6: After Lesson - View Rating
- Lesson completed
- Notification: "Votre leçon est terminée"
- Click to view:
  * Rating: 3.5/5 ⭐
  * Instructor comment: "Bonne maîtrise des basics..."
  * Competencies marked: Full list visible
- Expected: All details visible, rating clear
- Log: [✓/✗] Rating and feedback visible

Step 7: Check Progress Dashboard
- View "Mon Progrès" page
- Expected metrics:
  * Heures planifiées: 13.5h (full week)
  * Heures effectuées: 1.5h (1 lesson done)
  * Présence: 100% (1/1 lessons attended)
  * Progression moyenne: 3.5/5
  * Prochain exam: TBD
- Log: [✓/✗] Dashboard metrics correct

Step 8: View Competency Progress
- 5 axes chart/visualization
- Expected: Mécanique and Conduite show progress, others empty
- Log: [✓/✗] Competency visualization accurate

✅ [COMPLETE] Student First Day | Status: passed/failed | Issues Found: 0
```

#### Tuesday - Friday Pattern:

```
FOR EACH DAY (Tue-Fri):

🚀 [START WORKFLOW] Student Daily Engagement | Persona: Élève Marie | Time: {Day} 8:00am

Morning:
- Check dashboard for new lessons
- Verify 2 lessons scheduled for today
- Each has notification sent

During lessons:
- Open notifications
- View lesson details
- Confirm attendance ("Je suis prêt(e)")
- Watch real-time progress during lesson

Evening:
- After each lesson, view rating and feedback
- Review competencies marked
- Check updated progress metrics
- Verify hours add up correctly

Expected Weekly Pattern:
- Notifications: 9 total (all lessons)
- Attendance: 9/9 (100%)
- Ratings received: 9
- Progress: Growing from 0% to ~70% across axes
- Hours: 1.5h → 3h → 4.5h → 6h → 7.5h (cumulative)

❌ [FAILURE DETECTED] If any:
- Notification fails to send
- Rating doesn't display
- Hours don't update
- Progress doesn't show change
- Page doesn't load
→ LOG BUG IMMEDIATELY

✅ [COMPLETE] Student Daily Engagement | Status: passed/failed
```

---

### PERSONA 4: NEW STUDENT ENROLLMENT - Wednesday 10am

**Role**: Simulated new student signing up  
**Access Level**: None yet - enrollment process

#### Wednesday Enrollment Flow:

```
🚀 [START WORKFLOW] New Student Registration | Persona: New Student | Time: Wed 10:00am

Step 1: Visit Registration Page
- URL: {app_url}/inscription
- Expected: Form visible with required fields:
  * Nom complet
  * Email
  * Téléphone
  * Date de naissance (DOB)
  * Numéro NEP (national ID)
  * Diplôme code (driving test number if exists)
  * Forfait heures sélection (20h, 30h, 40h options)
- Log: [✓/✗] Form loads correctly

Step 2: Fill Enrollment Form
- Name: "Sophie Leclerc"
- Email: sophie.leclerc@permigo.local
- Phone: +33698765432
- DOB: 1998-07-15
- NEP: 9876543210
- Forfait: 40h
- Read & accept T&C checkbox
- Submit
- Expected: Confirmation page with:
  * Enrollment ID: ENR-2024-XXX
  * Message: "Inscription confirmée! Un email a été envoyé."
  * Next steps: "Veuillez attendre l'assignation d'un moniteur"
- Log: [✓/✗] Enrollment created, ID: {enrollment_id}

Step 3: Verify Enrollment in Database (As Manager)
- Switch to Manager role
- Navigate to "Inscriptions"
- Search: Sophie Leclerc
- Expected:
  * Status: "En attente d'assignation"
  * Email confirmed: ✓
  * Forfait: 40h visible
  * Can assign instructor: Yes
- Log: [✓/✗] Enrollment visible and assignable

Step 4: Assign Instructor to New Student
- As Manager: Assign Sophie to Jean-Pierre
- Expected: Sophie status changes to "Assignée"
- Expected: Jean-Pierre now has 4 students (3 original + Sophie)
- Log: [✓/✗] Assignment complete

Step 5: Verify Student Receives Notification
- Check Sophie's email inbox simulation
- Expected email subject: "Votre moniteur a été assigné!"
- Email contains:
  * Instructor name: Jean-Pierre Dubois
  * Contact info
  * First lesson scheduling link
- Log: [✓/✗] Email verification (simulate)

Step 6: New Student Login First Time
- Email: sophie.leclerc@permigo.local
- Password: {temporary from email}
- Expected: Password reset required on first login
- New password: "SophiePass123!"
- Login successful
- Dashboard shows: "Bienvenue Sophie! Votre moniteur: Jean-Pierre"
- Log: [✓/✗] First login complete

✅ [COMPLETE] New Student Registration | Status: passed/failed | Issues Found: 0
```

---

### PERSONA 5: SECOND INSTRUCTOR (Moniteur #2) - Thursday 9am

**Role**: New instructor added to verify multi-instructor workflow  
**Access Level**: Same as Moniteur #1

#### Thursday Setup:

```
🚀 [START WORKFLOW] Second Instructor Onboarding | Persona: Moniteur Luc | Time: Thu 9:00am

Step 1: Manager Adds Second Instructor
- As Manager: Add new instructor
- Name: "Luc Fontaine"
- Email: luc.fontaine@permigo.local
- Agréement: "MON-2024-002"
- Log: [✓/✗] Instructor created

Step 2: Assign Students to Luc
- Assign: Sophie (new student) and 1 other
- Expected: Both students now have Luc as secondary option
- Log: [✓/✗] Students assigned

Step 3: Luc First Login
- Email: luc.fontaine@permigo.local
- Reset password to: "LucPass123!"
- Expected: Dashboard shows 2 assigned students
- Log: [✓/✗] Login successful

Step 4: Luc Creates Lesson with New Student
- Schedule lesson with Sophie
- Time: Thursday 15:00-16:30
- Theme: "Première prise en main du véhicule"
- Complete lesson with competency tracking
- Rate Sophie: 4/5
- Log: [✓/✗] Lesson complete

Step 5: Verify Student Data Consistency
- As Sophie: Check both instructors are visible
- As Manager: Verify Sophie has lessons from both JP and Luc
- As Sophie: Verify both lessons appear in timeline
- Expected: No data conflicts, correct attribution
- Log: [✓/✗] Multi-instructor handling correct

Step 6: Check Hours Don't Double-Count
- Sophie's total hours: Should be 3.5h (JP=1.5h + Luc=1.5h + Wed=initial booking)
- No duplication
- Log: [✓/✗] Hours accurately counted

✅ [COMPLETE] Second Instructor Onboarding | Status: passed/failed | Issues Found: 0
```

---

## COMPREHENSIVE EDGE CASE TESTING

### Critical Test Scenarios

You MUST attempt all of these. Document result (pass/fail) and any error messages.

```
🚀 [START WORKFLOW] Edge Case Testing | Persona: Various | Time: Fri afternoon

1. AUTHENTICATION EDGE CASES
   [ ] Login with wrong password → "Identifiants invalides"
   [ ] Login with non-existent email → "Utilisateur non trouvé"
   [ ] Attempt login after account exists but before password reset → Behavior?
   [ ] Session timeout after 1 hour inactivity → Should logout
   [ ] Simultaneous login on 2 devices → Behavior (allow/deny/force-logout)?
   [ ] Password reset email link expires after 24h → Verify

2. PERMISSION BOUNDARY TESTING
   [ ] Student tries to view OTHER student's lessons → Denied (403)?
   [ ] Student tries to edit instructor's lesson notes → Denied?
   [ ] Instructor tries to add new student directly → Denied (only manager)?
   [ ] Instructor tries to delete student → Denied?
   [ ] Manager tries to view instructor private notes → Allowed or denied?
   [ ] Manager tries to modify instructor password → Allowed?

3. DATA CONSISTENCY TESTING
   [ ] Create lesson, navigate away, come back → Data still there?
   [ ] Add rating, refresh page → Rating persists?
   [ ] Modify student hours manually → Recalculates correctly?
   [ ] Delete instructor → What happens to their students?
   [ ] Delete student → What happens to their lessons?
   [ ] Orphaned records in audit_log → All actions logged?

4. CALCULATION & VALIDATION TESTING
   [ ] Add 12 hours of lessons to 20h plan → Exceeds by 2h? Allowed?
   [ ] Schedule overlapping lessons for same instructor → Allowed/denied?
   [ ] Schedule lesson before course start date → Allowed/denied?
   [ ] Rate student 0 → Allowed or minimum 1?
   [ ] Rate student 6 → Allowed or maximum 5?
   [ ] Mark same competency twice → Duplicates or updates?

5. PERFORMANCE TESTING
   [ ] Load student with 50 lessons → Dashboard loads in <2s?
   [ ] Search for student name with 100 results → Pagination works?
   [ ] Export week's data to PDF/Excel → Works without timeout?
   [ ] Bulk assign 50 students to instructor → Completes successfully?

6. WORKFLOW COMPLETION TESTING
   [ ] Student from signup → first lesson → multiple lessons → exam registration
   [ ] Instructor from onboarding → schedule → teach → rate → weekly summary
   [ ] Manager from setup → staff management → student assignment → reporting

7. NOTIFICATION TESTING
   [ ] New lesson created → Student gets email? SMS? In-app?
   [ ] Instructor rates lesson → Student sees notification immediately?
   [ ] Manager assigns instructor → Instructor gets notification?
   [ ] Lesson cancelled → Both parties get notified?

8. DATA EXPORT TESTING
   [ ] Export student progress report → Valid format (PDF/Excel)?
   [ ] Export instructor weekly hours → Shows accurate totals?
   [ ] Export audit log → Complete list of all actions?

For EACH test:
- [ ] Pass: Works as expected
- [ ] Fail: Document exact error message and behavior
- [ ] Undefined: Feature missing entirely

✅ [COMPLETE] Edge Case Testing | Issues Found: X
```

---

## FINAL VALIDATION & REPORTING

After completing all workflows:

### Database Integrity Check

```
VERIFY DATABASE STATE:
- Profiles table: {count} users (1 manager + 2 instructors + 4 students)
- Events table: {count} lessons (9 from JP + 1 from Luc + 0 cancelled)
- Inscriptions table: {count} enrollments (4 active + 1 pending)
- Audit log: {count} actions logged (every action trackedtracked?)
- Notations table: {count} ratings (10 total across all lessons)

DATA CONSISTENCY VERIFICATION:
✓ Hours: Total hours per student = sum of event durations
✓ Ratings: Average rating calculated correctly from individual ratings
✓ Competencies: All marked competencies traceable to specific lessons
✓ Foreign keys: No orphaned records
✓ Timestamps: All events in chronological order, no future dates
✓ Authorization: No user has access to data outside their role
```

### Bug Report Format

For EVERY issue found, use this format:

```
🐛 [BUG #N] {Title}
Severity: Critical | High | Medium | Low
Persona: {role}
Steps to Reproduce:
  1. {step}
  2. {step}
  3. {step}
Expected: {behavior}
Actual: {behavior}
Environment: {browser/OS/time}
Evidence: {screenshot description or console error}
```

### Final Verdict Template

```
═══════════════════════════════════════════════════════════
                    QA TESTING SUMMARY
═══════════════════════════════════════════════════════════

Testing Period: Monday-Friday (40 hours simulated)
Personas Tested: 5 (Manager, Instructor#1, Instructor#2, Student#1, New Student)
Workflows Completed: X/12
Lessons Created: 10
Students Managed: 4
Total Actions: XXX

✅ PASSED TESTS: X
❌ FAILED TESTS: X
⚠️  WARNING ISSUES: X

CRITICAL BLOCKERS:
[List any show-stoppers]

VERDICT:
🟢 LIVRABLE - All workflows pass, <3 minor issues
🟡 LIVRABLE WITH CONDITIONS - X critical fixes needed before production
🔴 NON-LIVRABLE - Too many blockers, system not ready

RECOMMENDATION:
[Your professional assessment]
```

---

## EXECUTION INSTRUCTIONS

**DO THIS IN ORDER:**

1. **ANNOUNCE START** - "🚀 STARTING COMPREHENSIVE QA TEST CYCLE"

2. **WEEK SIMULATION** - Monday 8am through Friday 6pm
   - Maintain personas consistently
   - Complete all workflows fully
   - Document everything in real-time

3. **REPORT EACH COMPLETION** - As you finish each workflow, announce:
   ```
   ✅ [COMPLETE] {workflow} | Status: passed/failed | Issues: X
   ```

4. **EDGE CASE BLITZ** - Friday afternoon, test all edge cases

5. **FINAL REPORT** - Generate comprehensive bug list and verdict

6. **ANNOUNCE COMPLETION** - "✅ QA TESTING COMPLETE - FINAL REPORT READY"

---

## YOU WILL NOT:

❌ Skip steps "to save tokens"  
❌ Assume workflows work without testing them  
❌ Stop after one user role  
❌ Miss edge cases "they probably fixed that"  
❌ Forget to document bugs as they appear  
❌ Use placeholder assumptions instead of testing  

## YOU WILL:

✅ Test every single workflow fully  
✅ Try to break everything intentionally  
✅ Document precisely what happens  
✅ Report bugs immediately with details  
✅ Maintain strict persona integrity  
✅ Generate final professional report  

---

**START YOUR COMPREHENSIVE QA TESTING NOW.**

You have one context window. Use it completely and thoroughly. The quality of PermiGo's launch depends on this testing.

Good luck. Be thorough. Break things. 🚀
