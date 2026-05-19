// ═══════════════════════════════════════════════════════════════
// Legal — Politique de confidentialité + CGU
// Route : #/legal/privacy · #/legal/cgu
// ═══════════════════════════════════════════════════════════════
import { track }   from '@/services/analytics.js';
import { navigate } from '@/router.js';

const CONTENT = {
  privacy: {
    title: 'Politique de confidentialité',
    sections: [
      { heading: 'Responsable du traitement', body: 'PermiGo SAS — dpo@permigo.fr' },
      { heading: 'Données collectées', body: 'Données de progression pédagogique (compétences validées, quiz, streak), profil pseudonymisé (prénom, email), historique d\'apprentissage. Aucune donnée bancaire, NEPH ou adresse postale n\'est collectée.' },
      { heading: 'Finalité du traitement', body: 'Suivi pédagogique de l\'apprentissage du permis de conduire, personnalisation de l\'expérience d\'apprentissage, communication pédagogique.' },
      { heading: 'Base légale', body: 'Exécution du contrat (abonnement auto-école), intérêt légitime (amélioration du service), consentement (emails marketing — révocable à tout moment dans Paramètres).' },
      { heading: 'Conservation', body: 'Données conservées pendant la durée de l\'abonnement + 3 ans. Suppression sur demande à dpo@permigo.fr ou via Paramètres → Supprimer mon compte.' },
      { heading: 'Vos droits', body: 'Accès, rectification, effacement, portabilité, opposition — exercez-les via dpo@permigo.fr. Réclamation possible auprès de la CNIL (cnil.fr).' },
      { heading: 'Cookies', body: 'Cookies fonctionnels uniquement (session auth). Aucun cookie publicitaire ou de tracking tiers.' },
    ],
  },
  cgu: {
    title: 'Conditions générales d\'utilisation',
    sections: [
      { heading: 'Objet', body: 'PermiGo est une plateforme d\'accompagnement pédagogique pour l\'apprentissage du permis de conduire (catégorie B). L\'accès est réservé aux élèves, moniteurs et gérants d\'auto-écoles abonnées.' },
      { heading: 'Accès au service', body: 'L\'accès est conditionné à un abonnement souscrit par l\'auto-école. Chaque utilisateur dispose d\'un compte nominatif non cessible.' },
      { heading: 'Utilisation', body: 'L\'application est strictement réservée à l\'apprentissage du permis de conduire. Toute utilisation frauduleuse, partage de compte ou tentative de manipulation des données pédagogiques est interdite.' },
      { heading: 'Propriété intellectuelle', body: 'Le contenu pédagogique (questions, référentiel REMC, design) est la propriété exclusive de PermiGo SAS. La reproduction est interdite sans accord écrit.' },
      { heading: 'Responsabilité', body: 'PermiGo est un outil d\'aide à la préparation du permis de conduire. Les résultats obtenus dans l\'application ne préjugent pas des résultats à l\'examen officiel.' },
      { heading: 'Résiliation', body: 'L\'accès peut être résilié par l\'auto-école ou sur demande de l\'utilisateur. Les données sont supprimées selon la politique de confidentialité.' },
      { heading: 'Contact', body: 'PermiGo SAS — contact@permigo.fr · dpo@permigo.fr' },
    ],
  },
};

export async function mount(root, param = 'privacy') {
  const page = CONTENT[param] || CONTENT.privacy;
  track('page_view', { page: `legal_${param}` });

  root.innerHTML = `
<style>
.legal {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 80px;
  background: var(--bg);
  min-height: 100svh;
  font-family: 'Inter', sans-serif;
  color: var(--ink);
}
.legal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
}
.legal-back {
  width: 36px; height: 36px;
  border-radius: 8px;
  border: 1px solid var(--bo);
  background: var(--su);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--ink);
  font-size: 16px;
}
.legal-header-title {
  font: 700 16px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
}
.legal-body { padding: 20px 16px; display: flex; flex-direction: column; gap: 16px; }
.legal-section {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 16px;
  padding: 16px 18px;
}
.legal-section-title {
  font: 700 14px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 6px;
}
.legal-section-body {
  font: 400 13px/1.65 'Inter', sans-serif;
  color: var(--mu);
}
.legal-footer {
  text-align: center;
  font: 400 11px/1.5 'Inter', sans-serif;
  color: var(--mu2);
  padding: 16px;
}
</style>
<div class="legal anim-slide-up">
  <div class="legal-header">
    <button class="legal-back" id="legal-back">←</button>
    <div class="legal-header-title">${page.title}</div>
  </div>
  <div class="legal-body">
    ${page.sections.map(s => `
    <div class="legal-section">
      <div class="legal-section-title">${s.heading}</div>
      <div class="legal-section-body">${s.body}</div>
    </div>`).join('')}
  </div>
  <div class="legal-footer">PermiGo v7 · ${new Date().getFullYear()}</div>
</div>`;

  root.querySelector('#legal-back')?.addEventListener('click', () => navigate('/settings'));
}
