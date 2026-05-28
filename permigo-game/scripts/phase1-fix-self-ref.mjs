#!/usr/bin/env node
/**
 * Nettoie les fallbacks auto-référentiels var(--x, var(--x)) → var(--x)
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

// Pattern: var(--name, var(--name)) → var(--name)
const SELF_REF_RE = /var\((--[a-z0-9-]+),\s*var\(\1\)\)/g;

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
  const result = original.replace(SELF_REF_RE, 'var($1)');
  if (result !== original) {
    writeFileSync(filepath, result, 'utf-8');
    const count = (original.match(SELF_REF_RE) || []).length;
    changed.push({ rel, count });
    total += count;
  }
}

console.log(`\nFix self-ref — ${changed.length} fichiers, ${total} nettoyages`);
for (const { rel, count } of changed) console.log(`  ${String(count).padStart(3)}×  ${rel}`);
