#!/usr/bin/env node
/**
 * Phase 1 Round 2 — Hex restants (non couverts par round 1).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const SRC_ROOT = '/Users/macbookm3/Desktop/permigo-v7/permigo-game';
const SRC_DIR  = join(SRC_ROOT, 'src');

const SKIP_FILES = new Set([
  'src/auth/auth-listener.js', 'src/auth/auth.js', 'src/auth/cur-user.js',
  'src/services/analytics.js', 'src/services/daily-action.js',
  'src/services/notif-listener.js', 'src/services/posthog.js',
  'src/services/quiz-engine.js', 'src/services/web-push.js',
  'src/utils/game-state.js', 'src/router.js', 'src/main.js',
  'src/db/client.js', 'src/styles/base.css',
]);

const REPLACEMENTS = [
  ['#e2e8f0', 'var(--bo3)'],
  ['#cbd5e1', 'var(--bo4)'],
  ['#374151', 'var(--ink5)'],
  ['#22c55e', 'var(--gr2)'],
  ['#16a34a', 'var(--grk)'],
  ['#4338ca', 'var(--adx)'],
];

const PATTERNS = REPLACEMENTS.map(([hex, varVal]) => ({
  re: new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![0-9a-fA-F])', 'gi'),
  replacement: varVal, hex,
}));

function applyReplacements(content) {
  let result = content;
  let totalChanged = 0;
  for (const { re, replacement, hex } of PATTERNS) {
    const before = result;
    result = result.replace(re, replacement);
    if (result !== before) {
      const m = before.match(new RegExp(hex + '(?![0-9a-fA-F])', 'gi'));
      totalChanged += m ? m.length : 0;
    }
  }
  return { result, totalChanged };
}

function walkDir(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fp = join(dir, entry);
    if (statSync(fp).isDirectory()) walkDir(fp, files);
    else if (['.js', '.css'].includes(extname(entry))) files.push(fp);
  }
  return files;
}

const allFiles = walkDir(SRC_DIR);
let total = 0; const changed = [];

for (const filepath of allFiles.sort()) {
  const rel = relative(SRC_ROOT, filepath);
  if (SKIP_FILES.has(rel)) continue;
  const original = readFileSync(filepath, 'utf-8');
  const { result, totalChanged } = applyReplacements(original);
  if (result !== original) {
    writeFileSync(filepath, result, 'utf-8');
    changed.push({ rel, count: totalChanged });
    total += totalChanged;
  }
}

console.log(`\nRound 2 — ${changed.length} fichiers, ${total} remplacements`);
for (const { rel, count } of changed) console.log(`  ${String(count).padStart(3)}×  ${rel}`);
