# KPI.md — Métriques à tracker

> Plan tracking complet. La référence détaillée est dans `.telemetry/tracking-plan.yaml`.

## 🎯 La métrique North Star

**% d'élèves "actifs hebdomadaires"** (ouvrent l'app + complètent ≥1 action / semaine).

**Cible** : 75% à 6 mois.

C'est l'indicateur ultime. Si ça monte → tout va bien. Si ça stagne → bug d'engagement.

---

## 📊 Les 8 KPI clés à surveiller en permanence

### 🎓 Engagement élève (les 4 critiques)

| KPI | Formule | Cible 6 mois | Pourquoi |
|---|---|---|---|
| **DAU/MAU** (stickiness) | DAU moyens / MAU | > 50% | Indique si les élèves reviennent quotidiennement |
| **Sessions/jour moyennes** | Sum sessions / user_count | 1.5+ | Habit formation |
| **Streak médian** | Median(current_streak) | > 12 jours | Mesure rétention à court terme |
| **Quiz post-validation completion rate** | Quiz completed / Quiz triggered | > 80% | La feature pédagogique core marche |

### 📈 Progression (les 2 mesurables)

| KPI | Formule | Cible | Pourquoi |
|---|---|---|---|
| **Vitesse de progression** | Compétences acquises / semaine | > 1.5 | Plus rapide qu'avec un livret papier classique |
| **Score consolidation moyen** | Avg(score_consolidation) | > 70 | Preuve que la mémorisation 48h fonctionne |

### 💼 Business (les 2 commerciaux)

| KPI | Formule | Cible 12 mois | Pourquoi |
|---|---|---|---|
| **Conversion beta → payant** | Schools active après 6 mois / Total beta | > 60% | Valide le pricing 19€/mois |
| **Taux abandon élèves** | Élèves inactifs >30j / Total | < 10% | -15% vs marché classique = argument vente |

---

## 🎯 Les 5 questions stratégiques que les KPI doivent répondre

### Q1 : "Est-ce que la pédagogie marche ?"

**Indicateurs** :
- `score_cognitif` moyen > 75 (quiz post-validation)
- `score_consolidation` > 70 (quiz 48h)
- Écart entre les deux < 15 points (= la mémorisation tient)

### Q2 : "Est-ce que les élèves sont accros (de manière saine) ?"

**Indicateurs** :
- DAU/MAU > 50%
- Streak médian > 12 jours
- Sessions/jour > 1.5
- Notification opening rate > 60%

### Q3 : "Est-ce que ça impacte VRAIMENT le permis ?"

**Indicateurs** (à mesurer après 6 mois) :
- Taux de réussite des écoles partenaires VS moyenne nationale
- Temps moyen pour valider 31 compétences (chez nos clients vs ailleurs)
- Taux d'abandon élèves chez nos clients vs ailleurs

### Q4 : "Est-ce que le gérant en a pour son argent ?"

**Indicateurs école** (Pulse école) :
- `taux_reussite_12m` école vs moyenne nationale
- `nb_eleves_actifs_30d` / `nb_eleves_total`
- `abandons_30d` (tendance baissière)

### Q5 : "Est-ce que ça scale commercialement ?"

**Indicateurs business** :
- MRR (Monthly Recurring Revenue)
- Churn rate écoles (mensuel)
- CAC (Customer Acquisition Cost) — temps + budget pour gagner 1 école
- NPS écoles (Net Promoter Score)
- NPS élèves

---

## 🗂 Catégories d'événements à tracker

### Lifecycle (parcours user)
- `user.signed_up`, `user.first_login`, `user.app_opened`, `user.session_ended`
- `user.invitation_sent`, `user.invitation_accepted`

### Core Value (la pédagogie — le cœur)
- `validation.created` — instructeur valide compétence
- `quiz.post_validation_started` / `completed`
- `quiz.consolidation_started` / `completed`
- `quiz.exam_blanc_started` / `completed` (V2)
- `competence.unlocked`
- `monde.completed`

### Engagement (gamification)
- `streak.increased`, `streak.broken`, `streak.frozen`
- `trophy.unlocked`
- `gems.earned`, `gems.spent`
- `avatar.changed`
- `notification.received`, `notification.opened`

### Collaboration (enseignant ↔ élève)
- `lesson.logged`
- `instructor.note_sent`

### Manager (gérant)
- `manager.dashboard_viewed`
- `manager.at_risk_student_clicked`

### Configuration
- `profile.completed`
- `school.created`

### Billing (commercial)
- `trial.started`, `trial.expired`
- `plan.upgraded`, `plan.cancelled`

### Navigation (sparse, uniquement les écrans critiques)
- Évite blanket page views — on track uniquement les features avec valeur business

---

## 🔄 Snapshot sync (mis à jour quotidiennement)

À 2h du matin (Edge Function Supabase cron), on rafraîchit :

### Sur chaque utilisateur (`profiles` table)
- `competences_acquises_count` ← COUNT validations
- `competences_solid_count` ← COUNT validations avec score_consolidation > 60
- `current_streak`, `longest_streak`
- `xp_total`, `gems_total`
- `last_active_at`

### Sur chaque auto-école
- `nb_enseignants` actifs
- `nb_eleves_actifs_30d`
- `taux_reussite_12m` (% élèves ayant passé examen avec succès sur 12 mois)
- `abandons_30d` (élèves sans activité >30 jours)

---

## 🚫 Anti-patterns (ce qu'on NE TRACK PAS)

| Pattern | Pourquoi non |
|---|---|
| `button.clicked` génériques | Trop de noise, pas actionable |
| Page views automatiques | On track uniquement les engagements significatifs |
| Mouvements souris / scrolls | Volume énorme, valeur zéro |
| Données PII dans les propriétés | Pas de tel, adresse, NEPH (RGPD + mission) |
| `api.called`, `component.rendered` | Détails techniques, pas business |
| Events spéculatifs ("on verra plus tard") | Si tu doutes, ne track pas. Tu peux ajouter après. |

---

## 🛠 Implementation côté code

### Wrapper analytics (`src/services/analytics.js`)

```js
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';

export async function trackEvent(eventName, properties = {}) {
  const me = getCurUser();
  if (!me || me.is_internal) return; // Skip internal users

  try {
    await sb.from('events_analytics').insert({
      user_id: me.id,
      event_name: eventName,
      properties: properties,
      session_id: getSessionId(),
    });
    // Aussi : envoie vers PostHog/Plausible si configuré
  } catch (e) {
    // Best effort : on ne bloque jamais l'action si tracking échoue
    console.warn('[analytics] failed', e);
  }
}
```

### Usage dans le code

```js
// Quand l'enseignant valide une compétence
await sb.from('validations').insert({...});
trackEvent('validation.created', {
  competence_id: 'C03.1',
  competence_monde: 1,
  student_id: eleveId,
});
```

---

## 📈 Vue gérant (Dashboard "Pulse école")

Les 4 KPI vu en surface :

1. **Taux de réussite école 12M** : `taux_reussite_12m` vs moyenne nationale (60%)
2. **Élèves actifs / total** : `nb_eleves_actifs_30d` / `nb_eleves_total`
3. **À risque** : COUNT(`status_eleve = 'a_risque'`)
4. **Prêts examen** : COUNT(élèves avec >80% compétences validées)

Plus un graphique : évolution engagement (DAU sur 4 semaines).

---

## 🔮 V2 — Analytics avancées

### Cohortes
- Cohorte par mois de signup → retention curve
- Cohorte par auto-école → segment d'usage

### Funnels
- Funnel pédagogique : signup → 1ère validation → 1er trophée → permis obtenu
- Funnel école : signup → 1 enseignant → 5 élèves → 30 validations → premier témoignage

### Segmentation
- Élèves "champions" (top 10% engagement) → témoignages, refer-a-friend
- Élèves "à risque" (<2 sessions/sem) → push d'aide ciblé

---

## 📞 Outils d'analyse

### Phase 1 (V1) : Supabase pur
- Table `events_analytics`
- Vues SQL pour Pulse école
- Dashboards manuels (queries SQL exécutées 1x/semaine)

### Phase 2 (V2) : PostHog ou Plausible
- Ingestion via Supabase webhook
- Dashboards visuels
- Funnels et cohortes automatiques

### Phase 3 (V3) : Outils dédiés (si besoin)
- Mixpanel ou Amplitude (si volume justifie)
- Segment comme CDP (si plusieurs destinations)

---

## ✅ Checklist d'implémentation (V1)

- [ ] Table `events_analytics` créée avec RLS
- [ ] Wrapper `trackEvent()` dans `src/services/analytics.js`
- [ ] Guard `is_internal` qui exclut les comptes test
- [ ] Snapshot sync quotidien via Edge Function Supabase
- [ ] 30+ events trackés (lifecycle + core_value + engagement)
- [ ] Vue SQL "Pulse école" pour le dashboard gérant
- [ ] Documentation events dans `.telemetry/tracking-plan.yaml` à jour
