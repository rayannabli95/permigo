// ═══════════════════════════════════════════════════════════════
// Router minimal — route selon role + hash
// ═══════════════════════════════════════════════════════════════
import { unmountLogSessionFab } from '@/components/enseignant/log-session-fab.js';
import { phPageview } from '@/services/posthog.js';

const ROUTES = {
  eleve: {
    default: () => import('@/pages/eleve/accueil.js'),
    ecole: () => import('@/pages/public/ecole.js'),
    parcours: () => import('@/pages/eleve/parcours.js'),
    sessions: () => import('@/pages/eleve/session-confirmation.js'),
    quiz: () => import('@/pages/eleve/quiz.js'),
    'flash-quiz': () => import('@/pages/eleve/flash-quiz.js'),
    trophees: () => import('@/pages/eleve/trophees.js'),
    classement: () => import('@/pages/eleve/classement.js'),
    galerie: () => import('@/pages/eleve/galerie.js'),
    examen: () => import('@/pages/eleve/examen.js'),
    feedback: () => import('@/pages/eleve/feedback.js'),
    boutique: () => import('@/pages/eleve/boutique.js'),
    'exam-blanc': () => import('@/pages/eleve/exam-blanc.js'),
    wrapped: () => import('@/pages/eleve/wrapped.js'),
    'mes-coffres': () => import('@/pages/eleve/mes-coffres.js'),
    messages: () => import('@/pages/common/messages.js'),
    legal: () => import('@/pages/common/legal.js'),
    dbg: () => import('@/pages/admin/debug.js'),
    profil: () => import('@/pages/common/profil.js'),
    notifications: () => import('@/pages/common/notifications.js'),
    settings: () => import('@/pages/common/settings.js'),
  },
  enseignant: {
    default: () => import('@/pages/enseignant/aujourdhui.js'),
    ecole: () => import('@/pages/public/ecole.js'),
    aujourdhui: () => import('@/pages/enseignant/aujourdhui.js'),
    parcours: () => import('@/pages/enseignant/parcours-pro.js'),
    'parcours-complet': () => import('@/pages/enseignant/parcours-pro-complet.js'),
    validation: () => import('@/pages/enseignant/validation.js'),
    eleves: () => import('@/pages/enseignant/mes-eleves.js'),
    livret: () => import('@/pages/enseignant/livret-remc.js'),
    insights: () => import('@/pages/enseignant/insights.js'),
    bilan: () => import('@/pages/enseignant/bilan.js'),
    'log-session': () => import('@/pages/enseignant/log-session.js'),
    messages: () => import('@/pages/common/messages.js'),
    legal: () => import('@/pages/common/legal.js'),
    dbg: () => import('@/pages/admin/debug.js'),
    profil: () => import('@/pages/common/profil.js'),
    notifications: () => import('@/pages/common/notifications.js'),
    settings: () => import('@/pages/common/settings.js'),
  },
  gerant: {
    default: () => import('@/pages/gerant/cockpit.js'),
    ecole: () => import('@/pages/public/ecole.js'),
    pulse:   () => import('@/pages/gerant/pulse.js'),
    equipe: () => import('@/pages/gerant/equipe.js'),
    eleves: () => import('@/pages/gerant/eleves.js'),
    // Réutilise le livret REMC de l'enseignant pour la vue détail élève côté gérant
    livret: () => import('@/pages/enseignant/livret-remc.js'),
    bilan: () => import('@/pages/enseignant/bilan.js'),
    messages: () => import('@/pages/common/messages.js'),
    legal: () => import('@/pages/common/legal.js'),
    dbg: () => import('@/pages/admin/debug.js'),
    profil: () => import('@/pages/common/profil.js'),
    notifications: () => import('@/pages/common/notifications.js'),
    settings: () => import('@/pages/common/settings.js'),
  },
};

// Libellés de titre de page (a11y lecteur d'écran, onglet, historique, SEO).
// On préfère le <h1> réel rendu par la page ; ce map sert de repli.
const ROUTE_TITLES = {
  default: 'Accueil', ecole: 'École', aujourdhui: "Aujourd'hui",
  parcours: 'Parcours', 'parcours-complet': 'Parcours', validation: 'Valider',
  eleves: 'Mes élèves', livret: 'Livret REMC', insights: 'Insights', bilan: 'Bilan',
  'log-session': 'Séance', sessions: 'Mes séances', quiz: 'Quiz', 'flash-quiz': 'Quiz éclair', trophees: 'Trophées',
  classement: 'Classement',
  galerie: 'Galerie', examen: 'Examen', 'exam-blanc': 'Examen blanc', feedback: 'Feedback',
  boutique: 'Boutique', wrapped: 'Rétro', 'mes-coffres': 'Mes coffres', messages: 'Messages',
  legal: 'Mentions légales', profil: 'Profil', notifications: 'Notifications',
  settings: 'Réglages', pulse: 'Pulse', equipe: 'Équipe', dbg: 'Debug',
};

function _setPageTitle(root, routeName) {
  const h1 = root.querySelector('h1');
  const fromH1 = (h1?.textContent || '').trim().split('\n')[0].slice(0, 60);
  const label = fromH1 || ROUTE_TITLES[routeName] || '';
  document.title = label ? `${label} · PermiGo` : 'PermiGo';
}

export async function route(root, me) {
  const role = me.role || 'eleve';
  const map = ROUTES[role] || ROUTES.eleve;
  // segments[0] = route name, segments[1] = optional param (ex: eleve UUID pour livret)
  const segments = (location.hash || '').replace('#/', '').split('/');
  const routeName = segments[0] || 'default';
  const param = segments[1] || null; // ex: eleveId pour #/livret/{id}
  const loader = map[routeName] || map.default;

  // nav-bottom gère le "+" central — on retire le FAB flottant noir (doublon)
  unmountLogSessionFab();

  try {
    const mod = await loader();
    // Pour les pages qui attendent (root, eleveId) on passe param en 2e arg
    // Les autres pages ignorent les args supplémentaires
    await mod.mount(root, param);
    const heading = root.querySelector('h1') || root;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: false });
    _setPageTitle(root, routeName);
  } catch (e) {
    console.error('[router]', e);
    // Stale chunk après deploy : le hash JS a changé, l'index.html cached
    // référence un module qui n'existe plus → on force le reload
    const isStaleChunk = /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError/i.test(e?.message || '');
    if (isStaleChunk && !sessionStorage.getItem('reloaded_once')) {
      sessionStorage.setItem('reloaded_once', '1');
      window.location.reload();
      return;
    }
    sessionStorage.removeItem('reloaded_once');
    root.innerHTML = `<div class="err" style="padding:32px;text-align:center;color:#64748b">
      <p>Cette page n'a pas pu être chargée.</p>
      <button onclick="location.reload()" style="margin-top:12px;padding:12px 24px;border:0;background:#6366f1;color:#fff;border-radius:12px;cursor:pointer">Recharger</button>
    </div>`;
  }
}

window.addEventListener('hashchange', () => {
  import('@/auth/cur-user.js').then(({ getCurUser }) => {
    const me = getCurUser();
    if (me) {
      route(document.getElementById('app'), me);
      phPageview();   // hash-router SPA : PostHog ne détecte pas les hashchanges seul
    } else {
      // Fallback : user déconnecté → re-render la page de login plutôt qu'écran blanc
      import('@/pages/auth/login.js').then(m => m.mount?.(document.getElementById('app')));
    }
  });
});

export function navigate(path) {
  location.hash = path.startsWith('#') ? path : `#${path}`;
}
