# AUTOPILOT v6 — PROMPT COWORK FRONTEND

**Status:** PROD — Ready to build
**Role:** Frontend Engineer + UI/UX Designer
**Duration:** 4 weeks
**Timeline:** 1h/day recommended
**Output:** Beautiful, functional HTML/CSS frontend + Figma design

> Source de vérité design pour Autopilot v6.
> Tout dev sur ce projet doit s'aligner sur ce document.

---

## 🎯 OBJECTIF

Build a beautiful, user-friendly frontend for Autopilot (driving school management app).

**You are:** UI/UX Designer + Frontend developer
**Your job:** Make the app LOOK amazing and be EASY to use.
**NOT your job:** Database, APIs, authentication logic (backend handles that).

---

## 👥 CONTEXT

- **Rayan:** Building frontend (1h/day, zéro tech background)
- **Dev friend:** Building backend simultaneously
- **Goal:** MVP demo to driving school in 4 weeks
- **Platform:** Web (desktop first)

---

## 🎨 DESIGN SPECS (LOCKED)

### Color scheme

```
Primary Blue:   #2563eb
Light Gray:     #f3f4f6
Dark Gray:      #111827
Success Green:  #10b981
Danger Red:     #ef4444
Warning Yellow: #f59e0b
```

### Status colors (LOCKED)

| Status | Background | Border | Text |
|---|---|---|---|
| ⚪ Confirmed | `#ffffff` | `#d1d5db` | dark gray |
| 🟡 Pending | `#fef3c7` (light yellow) | `#f59e0b` | dark |
| 🔴 Cancelled | `#fee2e2` (light red) | `#ef4444` | dark red |

### Typography

- Headlines: 24px, Bold, Dark Gray
- Subheaders: 18px, Semi-bold, Dark Gray
- Body: 14px, Regular, Dark Gray
- Small: 12px, Regular, Light Gray
- Buttons: 14px, Semi-bold, White on Primary Blue

### Spacing

- Padding inside boxes: 16px
- Margin between sections: 24px
- Gap in grids: 16px
- Border radius: 8px

---

## 📱 SCREENS TO BUILD (8 total)

1. **Login Screen** — centered card, email + password, error states
2. **Signup Screen** — role selector (Student/Instructor/Admin), name, email, password + confirm, strength meter
3. **Admin Dashboard** — sidebar + 3 KPIs + absence chart + recent lessons table + pending confirmations
4. **Instructor Calendar** — Mon-Fri 8h-18h grid, status colors, CCN hours bar, "Mark Absent 4h" button
5. **Create/Edit Lesson Modal** — instructor + student + date + time + duration + notes
6. **Lesson Detail Screen** — student/instructor info, status badge, action buttons selon statut
7. **REMC Form Screen** — observations obligatoires (min 10 chars), instructor notes, ~10 competency checkboxes
8. **Student Dashboard** — upcoming lessons + donut chart progression + category bars

Voir doc Google complète pour layouts et états détaillés.

---

## 🛠️ TECH STACK

```
Design:         Figma
Code:           HTML5 + CSS3 + Vanilla JavaScript
Integration:    fetch/axios → backend APIs
Storage:        LocalStorage (session token)
Deployment:     GitHub + Vercel
```

---

## 📅 TIMELINE (4 weeks, 1h/day)

| Semaine | Focus |
|---|---|
| 1 | Design Figma — 8 screens |
| 2 | HTML/CSS statique |
| 3 | JS + intégration APIs backend |
| 4 | Polish + déploiement Vercel |

---

## 🔌 API ENDPOINTS (à fournir par le backend)

```
// Auth
POST   /api/auth/login
POST   /api/auth/signup
POST   /api/auth/logout

// Lessons
GET    /api/lessons?week=YYYY-MM-DD
POST   /api/lessons
PATCH  /api/lessons/:id
DELETE /api/lessons/:id

// Confirmations
POST   /api/lessons/:id/confirm
POST   /api/lessons/:id/reject

// REMC
POST   /api/lessons/:id/remc
GET    /api/lessons/:id/remc

// Dashboard
GET    /api/dashboard/admin
GET    /api/dashboard/instructor
GET    /api/dashboard/student

// Users
GET    /api/users/:id
GET    /api/users

// Absences
POST   /api/absences
```

---

## 📋 FEATURES CHECKLIST

### Auth
- [ ] Login screen (email validation)
- [ ] Signup screen (role + password strength + confirm match)
- [ ] Logout button
- [ ] Session persistence (token localStorage)

### Admin
- [ ] KPI cards (Total lessons / Instructors / Students)
- [ ] Lessons table avec filtres
- [ ] Absence rate chart
- [ ] Pending confirmations list
- [ ] Sidebar nav

### Calendar (Instructor)
- [ ] Vue semaine Mon-Fri 08-18h
- [ ] Lesson blocks colorés selon statut
- [ ] Modal création leçon
- [ ] "Mark Absent 4h" button
- [ ] Status colors : white/yellow/red

### Lessons
- [ ] Create / Edit form
- [ ] Detail view + action buttons selon statut
- [ ] Confirm / Reject / Cancel

### REMC
- [ ] Observations textarea (min 10 chars, obligatoire)
- [ ] Competencies checkboxes
- [ ] Notes field
- [ ] Bouton "Complete" désactivé sans observations
- [ ] Compteur progression

### Student
- [ ] Upcoming lessons list
- [ ] Donut chart progression
- [ ] Category breakdown chart
- [ ] Request lesson button
- [ ] Contact instructor link

### Général
- [ ] Responsive (tablet OK)
- [ ] Loading states (spinners)
- [ ] Error messages rouges
- [ ] Success messages verts
- [ ] Couleurs / spacing / fonts cohérents

---

## 🎨 RÈGLES DESIGN

### Premium feel
- Spacing 16px grid
- Transitions 0.2s ease
- Hover states partout
- Loading spinners
- Error rouges, success verts

### Easy to use
- Boutons 12px 24px min
- Labels formulaires clairs
- Astérisque rouge si requis
- Validation inline (✓ / ✗)
- Texte d'action explicite ("Confirmer" pas "OK")

### Fast
- Pas d'animations gratuites
- Charge uniquement le nécessaire
- Cache session
- Skeleton screens
- Lazy-load images

---

## 📞 SYNC AVEC LE BACKEND

Call hebdo 1h, partage Figma + GitHub, alignement sur API spec.

---

**Ce document est la spec officielle. Si l'app diverge, c'est la spec qui gagne.**
