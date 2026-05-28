#!/usr/bin/env node
/**
 * Phase 2 — purge gradients vert→violet + rgba indigo
 * Règles par fichier pour distinguer CTA (solid green) vs décoratif (green gradient).
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/macbookm3/Desktop/permigo-v7/permigo-game/src';

// ─── Patterns gradient → cible ────────────────────────────────────────────
//  Toutes les variantes de l'ancien gradient indigo→violet avec var(--a)
const GRAD_PATTERNS = [
  /linear-gradient\(135deg,\s*var\(--a\),\s*var\(--pu\)\)/g,
  /linear-gradient\(135deg,\s*var\(--a\)\s*0%,\s*var\(--pu\)\s*100%\)/g,
  /linear-gradient\(135deg,\s*var\(--a\)\s*0%,\s*var\(--pu\)\s*50%,\s*var\(--a\)\s*100%\)/g,
  /linear-gradient\(90deg,\s*var\(--a\)\s*0%,\s*var\(--pu\)\s*100%\)/g,
  /linear-gradient\(90deg,\s*var\(--a\)\s*0%,\s*var\(--pu\)\s*50%,\s*var\(--a\)\s*100%\)/g,
  /linear-gradient\(180deg,\s*var\(--a\),\s*var\(--pu\)\)/g,
  /linear-gradient\(180deg,\s*var\(--a\)\s*0%,\s*var\(--pu\)\s*100%\)/g,
];

// ─── Fichiers et leur règle gradient ──────────────────────────────────────
// 'btn'  → var(--a)  (solid, bouton CTA)
// 'deco' → linear-gradient(135deg, var(--a), var(--adk))  (icône déco)
// 'chart'→ linear-gradient(180deg, var(--a), var(--adk))  (barre graphe)
// 'violet'→ linear-gradient(135deg, var(--pu), var(--puk)) (hero décoratif violet)
// 'text' → linear-gradient(90deg, var(--a) 0%, var(--adk) 50%, var(--a) 100%)

const GRAD_REPLACE = {
  'btn':    'var(--a)',
  'deco':   'linear-gradient(135deg, var(--a), var(--adk))',
  'chart':  'linear-gradient(180deg, var(--a), var(--adk))',
  'violet': 'linear-gradient(135deg, var(--pu), var(--puk))',
  'text':   'linear-gradient(90deg, var(--a) 0%, var(--adk) 50%, var(--a) 100%)',
};

// Chemin relatif → type de remplacement
const FILE_RULES = {
  // ── Boutons CTA purs ────────────────────────────────────────────────────
  'components/common/cookie-banner.js':     'btn',
  'components/common/fab.js':               'btn',
  'components/common/nav-bottom.js':        'btn',
  'components/enseignant/log-session-modal.js': 'btn',
  'pages/auth/login.js':                    'btn',
  'pages/eleve/boutique.js':               'btn',
  'pages/eleve/exam-blanc.js':             'btn',
  'pages/eleve/examen.js':                 'btn',
  'pages/eleve/quiz.js':                   'btn',
  'pages/eleve/session-confirmation.js':   'btn',
  'pages/eleve/trophees.js':               'btn',
  'pages/eleve/wrapped.js':               'btn',
  'pages/eleve/accueil.js':               'btn',
  'pages/enseignant/log-session.js':       'btn',
  'pages/enseignant/validation.js':        'btn',
  'pages/enseignant/livret-remc.js':       'btn',
  'pages/enseignant/mes-eleves.js':        'btn',
  'pages/common/messages.js':             'btn',
  'pages/common/profil.js':               'btn',
  'pages/public/signup.js':               'btn',
  'pages/public/ecole.js':               'btn',
  'pages/onboarding/index.js':            'btn',
  'pages/eleve/parcours.js':              'btn',
  // ── Icônes / avatars → dégradé vert cohérent ───────────────────────────
  'components/eleve/xp-toast.js':          'deco',
  'components/eleve/onboarding-modal.js':  'deco',
  'components/common/avatar.js':           'deco',
  // ── Graphiques → dégradé vertical vert ─────────────────────────────────
  'pages/gerant/pulse.js':                 'chart',
  'pages/enseignant/bilan.js':             'chart',
  // ── Text gradient ─────────────────────────────────────────────────────
  'styles/animations.css':                 'text',
};

// ─── Remplacements ponctuels (lignes spécifiques dans certains fichiers) ──
// Appliqués AVANT la règle générale.
const PATCH = [
  // profile-card : bannière héro → violet pur
  {
    file: 'components/common/profile-card.js',
    from: /linear-gradient\(135deg,\s*var\(--a\),\s*var\(--pu\),\s*var\(--blk\)\)/g,
    to:   'linear-gradient(135deg, var(--pu), var(--puk), var(--blk))',
  },
  // profile-card : avatar fallback → dégradé vert
  {
    file: 'components/common/profile-card.js',
    from: /linear-gradient\(135deg,\s*var\(--a\),\s*var\(--pu\)\)/g,
    to:   'linear-gradient(135deg, var(--a), var(--adk))',
  },
  // profile-card : barre XP "gradient-indigo" → vert
  {
    file: 'components/common/profile-card.js',
    from: /linear-gradient\(90deg,\s*var\(--a\),\s*var\(--pu\)\)/g,
    to:   'linear-gradient(90deg, var(--a), var(--adk))',
  },
  // profil.js : avatar → vert
  {
    file: 'pages/common/profil.js',
    from: /linear-gradient\(135deg,\s*var\(--a\),\s*var\(--pu\)\)/g,
    to:   GRAD_REPLACE['btn'],  // on traitera les boutons ici aussi via btn rule
  },
  // permis-card : active state → tout vert
  {
    file: 'components/eleve/permis-card.js',
    from: /linear-gradient\(135deg,\s*var\(--adk\)\s*0%,\s*var\(--a\)\s*45%,\s*var\(--pu\)\s*100%\)/g,
    to:   'linear-gradient(135deg, var(--adk) 0%, var(--a) 45%, #3a9000 100%)',
  },
  // update-badge → vert
  {
    file: 'styles/animations.css',
    from: /linear-gradient\(135deg,\s*var\(--a\),\s*var\(--pu\)\)/g,
    to:   'linear-gradient(135deg, var(--a), var(--adk))',
  },
];

// ─── Replacement rgba indigo → rgba vert (global, tous fichiers) ───────────
const RGBA_INDIGO = /rgba\(\s*99\s*,\s*102\s*,\s*241\s*,/g;
const RGBA_GREEN  = 'rgba(88,204,2,';

// ─── Fichiers interdits ────────────────────────────────────────────────────
const SKIP = new Set([
  'auth/auth-listener.js','auth/auth.js','auth/cur-user.js',
  'services/analytics.js','services/daily-action.js',
  'services/notif-listener.js','services/posthog.js',
  'services/quiz-engine.js','services/web-push.js',
  'utils/game-state.js','router.js','main.js','db/client.js',
]);

// ─── Walk ──────────────────────────────────────────────────────────────────
import { readdirSync, statSync } from 'fs';
import { relative, extname } from 'path';

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fp = join(dir, entry);
    if (statSync(fp).isDirectory()) walk(fp, files);
    else if (['.js','.css'].includes(extname(entry))) files.push(fp);
  }
  return files;
}

const allFiles = walk(ROOT);
let totalFiles = 0; const report = [];

for (const fp of allFiles.sort()) {
  const rel = relative(ROOT, fp);
  if (SKIP.has(rel)) continue;

  let content = readFileSync(fp, 'utf-8');
  const before = content;

  // 1. Patchs ponctuels
  for (const p of PATCH) {
    if (rel === p.file) {
      content = content.replace(p.from, p.to);
    }
  }

  // 2. Règle générale gradient (si la règle patch n'a pas tout couvert)
  const rule = FILE_RULES[rel];
  if (rule) {
    const target = GRAD_REPLACE[rule];
    for (const pat of GRAD_PATTERNS) {
      pat.lastIndex = 0; // reset global regex
      content = content.replace(pat, target);
    }
  }

  // 3. Remplacement global rgba indigo
  content = content.replace(RGBA_INDIGO, RGBA_GREEN);

  if (content !== before) {
    writeFileSync(fp, content, 'utf-8');
    totalFiles++;
    report.push(rel);
  }
}

console.log(`\nfix-gradients — ${totalFiles} fichiers modifiés`);
for (const r of report) console.log(`  ✓  ${r}`);
