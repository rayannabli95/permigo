// ═══════════════════════════════════════════════════════════════
// Router minimal — route selon role + hash
// ═══════════════════════════════════════════════════════════════
const ROUTES = {
  eleve: {
    default: () => import('@/pages/eleve/accueil.js'),
    parcours: () => import('@/pages/eleve/parcours.js'),
    quiz: () => import('@/pages/eleve/quiz.js'),
    trophees: () => import('@/pages/eleve/trophees.js'),
    profil: () => import('@/pages/common/profil.js'),
    notifications: () => import('@/pages/common/notifications.js'),
    settings: () => import('@/pages/common/settings.js'),
  },
  enseignant: {
    default: () => import('@/pages/enseignant/aujourdhui.js'),
    aujourdhui: () => import('@/pages/enseignant/aujourdhui.js'),
    parcours: () => import('@/pages/enseignant/parcours.js'),
    validation: () => import('@/pages/enseignant/validation.js'),
    eleves: () => import('@/pages/enseignant/mes-eleves.js'),
    livret: () => import('@/pages/enseignant/livret-remc.js'),
    profil: () => import('@/pages/common/profil.js'),
    notifications: () => import('@/pages/common/notifications.js'),
    settings: () => import('@/pages/common/settings.js'),
  },
  gerant: {
    default: () => import('@/pages/gerant/pulse.js'),
    equipe: () => import('@/pages/gerant/equipe.js'),
    eleves: () => import('@/pages/gerant/eleves.js'),
    // Réutilise le livret REMC de l'enseignant pour la vue détail élève côté gérant
    livret: () => import('@/pages/enseignant/livret-remc.js'),
    profil: () => import('@/pages/common/profil.js'),
    notifications: () => import('@/pages/common/notifications.js'),
    settings: () => import('@/pages/common/settings.js'),
  },
};

export async function route(root, me) {
  const role = me.role || 'eleve';
  const map = ROUTES[role] || ROUTES.eleve;
  // segments[0] = route name, segments[1] = optional param (ex: eleve UUID pour livret)
  const segments = (location.hash || '').replace('#/', '').split('/');
  const routeName = segments[0] || 'default';
  const param = segments[1] || null; // ex: eleveId pour #/livret/{id}
  const loader = map[routeName] || map.default;

  try {
    const mod = await loader();
    // Pour les pages qui attendent (root, eleveId) on passe param en 2e arg
    // Les autres pages ignorent les args supplémentaires
    await mod.mount(root, param);
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
    if (me) route(document.getElementById('app'), me);
  });
});

export function navigate(path) {
  location.hash = path.startsWith('#') ? path : `#${path}`;
}
