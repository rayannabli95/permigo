#!/usr/bin/env node
/**
 * Phase 1 — Refactor hex hardcodés → variables CSS.
 * Zero visual change : remplace uniquement les hex qui ont une variable exacte.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const SRC_ROOT = '/Users/macbookm3/Desktop/permigo-v7/permigo-game';
const SRC_DIR  = join(SRC_ROOT, 'src');

// Fichiers interdits (no-touch per CLAUDE.md + design prompt)
const SKIP_FILES = new Set([
  'src/auth/auth-listener.js',
  'src/auth/auth.js',
  'src/auth/cur-user.js',
  'src/services/analytics.js',
  'src/services/daily-action.js',
  'src/services/notif-listener.js',
  'src/services/posthog.js',
  'src/services/quiz-engine.js',
  'src/services/web-push.js',
  'src/utils/game-state.js',
  'src/router.js',
  'src/main.js',
  'src/db/client.js',
  'src/styles/base.css', // traité manuellement
]);

// Mapping hex → var (ordre : spécifiques d'abord pour éviter chevauchements)
const REPLACEMENTS = [
  // ── Accent principal ──
  ['#6366f1', 'var(--a)'],
  ['#4f46e5', 'var(--adk)'],

  // ── Vert ──
  ['#10b981', 'var(--gr)'],
  ['#059669', 'var(--grd)'],

  // ── Rouge ──
  ['#ef4444', 'var(--rd)'],
  ['#dc2626', 'var(--rdk)'],
  ['#b91c1c', 'var(--rdx)'],

  // ── Amber ──
  ['#f59e0b', 'var(--am)'],
  ['#d97706', 'var(--amk)'],
  ['#b45309', 'var(--amx)'],
  ['#fde68a', 'var(--aml)'],
  ['#fbbf24', 'var(--aml2)'],

  // ── Bleu / cyan ──
  ['#0ea5e9', 'var(--bl)'],
  ['#0891b2', 'var(--blk)'],

  // ── Violet ──
  ['#8b5cf6', 'var(--pu)'],
  ['#7c3aed', 'var(--puk)'],
  ['#a855f7', 'var(--pul)'],

  // ── Ink / texte ──
  ['#0b0d1a', 'var(--ink)'],
  ['#0a0d1a', 'var(--ink)'],
  ['#0f172a', 'var(--ink)'],
  ['#1a1d2e', 'var(--ink2)'],
  ['#1e293b', 'var(--ink4)'],

  // ── Muted ──
  ['#7880a4', 'var(--mu)'],
  ['#64748b', 'var(--mu3)'],
  ['#475569', 'var(--mu4)'],
  ['#94a3b8', 'var(--mu2)'],
  ['#9ba3c2', 'var(--mu2)'],

  // ── Surfaces / backgrounds ──
  ['#e2e6f2', 'var(--bo)'],
  ['#f4f5fb', 'var(--bg)'],
  ['#f0f2f8', 'var(--bg3)'],
  ['#f1f5f9', 'var(--bg4)'],
  ['#f8f9fc', 'var(--su2)'],
  ['#f8f9fd', 'var(--su2)'],
];

// Compile les regex une fois (case-insensitive, word-boundary après le hex)
const PATTERNS = REPLACEMENTS.map(([hex, varVal]) => {
  const escaped = hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    re: new RegExp(escaped + '(?![0-9a-fA-F])', 'gi'),
    replacement: varVal,
    hex,
  };
});

function applyReplacements(content) {
  let result = content;
  let totalChanged = 0;
  for (const { re, replacement, hex } of PATTERNS) {
    const before = result;
    result = result.replace(re, replacement);
    // Compte les remplacements (approx)
    if (result !== before) {
      const matches = before.match(new RegExp(hex + '(?![0-9a-fA-F])', 'gi'));
      totalChanged += matches ? matches.length : 0;
    }
  }
  return { result, totalChanged };
}

function walkDir(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const st = statSync(fullPath);
    if (st.isDirectory()) {
      walkDir(fullPath, files);
    } else {
      const ext = extname(entry);
      if (ext === '.js' || ext === '.css') {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const allFiles = walkDir(SRC_DIR);
let totalReplacements = 0;
const changedFiles = [];
const skippedFiles = [];

for (const filepath of allFiles.sort()) {
  const rel = relative(SRC_ROOT, filepath);
  if (SKIP_FILES.has(rel)) {
    skippedFiles.push(rel);
    continue;
  }

  const original = readFileSync(filepath, 'utf-8');
  const { result, totalChanged } = applyReplacements(original);

  if (result !== original) {
    writeFileSync(filepath, result, 'utf-8');
    changedFiles.push({ rel, count: totalChanged });
    totalReplacements += totalChanged;
  }
}

console.log('\n' + '='.repeat(60));
console.log('PHASE 1 — Résultats');
console.log('='.repeat(60));
console.log(`Fichiers modifiés  : ${changedFiles.length}`);
console.log(`Remplacements      : ${totalReplacements}`);
console.log('\nFichiers modifiés :');
for (const { rel, count } of changedFiles) {
  console.log(`  ${String(count).padStart(4)}×  ${rel}`);
}
console.log('\nFichiers SKIPPÉS (no-touch) :');
for (const f of skippedFiles) {
  console.log(`  ${f}`);
}
