#!/usr/bin/env node
/** Phase 1 Round 3 — Hex sémantiques restants. */

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
  ['#047857', 'var(--grdk)'],
  ['#15803d', 'var(--grk2)'],
  ['#dcfce7', 'var(--grp2)'],
  ['#fee2e2', 'var(--rdp2)'],
  ['#818cf8', 'var(--al)'],
  ['#c7d2fe', 'var(--al2)'],
  ['#1d4ed8', 'var(--blk2)'],
  ['#f1f3f9', 'var(--bg4)'],   // 1-digit diff de --bg4 (#f1f5f9), imperceptible
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

console.log(`\nRound 3 — ${changed.length} fichiers, ${total} remplacements`);
for (const { rel, count } of changed) console.log(`  ${String(count).padStart(3)}×  ${rel}`);
