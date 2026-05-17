# Product Model — PermiGo Game

## What the product does

PermiGo Game is a B2B2C web/mobile app that turns driving license learning into a daily habit. It connects students, driving instructors, and school managers via a "Triple Validation" pedagogical system: practical validation by instructor → cognitive quiz (30s after) → consolidation quiz (48h later).

## Who uses it

| Persona | Role | Frequency |
|---|---|---|
| **Student** (élève) | Daily active user, completes quizzes, tracks progression | 4-7 sessions/week |
| **Instructor** (enseignant) | Validates competences after lessons | 1-2 sessions/day |
| **Manager** (gérant) | Monitors school performance KPIs | 1-2 sessions/week |

## Core value flow

```
Lesson happens IRL → Instructor validates competence in app
→ Student receives push → 30s quiz (cognitive validation)
→ Score stored, trophy unlocked if competence complete
→ 48h later: consolidation quiz (2 questions)
→ Long-term retention measured
```

## Primary value action

**Competence validation by instructor**, which triggers the entire downstream pedagogical chain.

## Entities

- `user` (student / instructor / manager)
- `auto_ecole` (driving school = top-level group)
- `competence_remc` (the 31 official REMC sub-competences)
- `validation` (one competence × one student)
- `quiz_attempt` (each quiz session)

## Group hierarchy

- **auto_ecole** (top level) — driving school
- Sub-level: instructor's caseload (logical, not a real group entity)

## Integration targets

- **Primary**: Supabase `events_analytics` table (custom, embedded)
- **Future**: PostHog or Plausible (for ad-hoc analysis without writing SQL)

## PII policy

**`none` — strict.** Core to product mission. No phone, address, NEPH stored. Email used only as ephemeral identifier in auth.users (Supabase). Student prenom + initial only.

## Internal user exclusion

YES — admin/test accounts excluded via `is_internal: true` trait on profile.

## Business model

Beta free for 6 months → 19€/month flat per school → 39€/month after 6 months proof. Eventually: per-instructor or B2C student plan (4.99€/month).

## North Star metric

**% of students "active weekly"** (open app + complete ≥1 action per week). Target: 75% at 6 months.
