#!/usr/bin/env python3
"""
Phase 1 — Refactor hex hardcodés → variables CSS.
Zero visual change : remplace uniquement les hex qui ont une variable exacte (ou nouvellement ajoutée).
"""
import re
import sys
import os

# Fichiers interdits (no-touch per CLAUDE.md)
SKIP_FILES = {
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
    'src/styles/base.css',  # traité manuellement
}

# Mapping hex → var (insensible à la casse, word-boundary enforced)
# Ordre important : les plus spécifiques en premier
REPLACEMENTS = [
    # ── Accent principal ──
    ('#6366f1', 'var(--a)'),
    ('#4f46e5', 'var(--adk)'),

    # ── Vert ──
    ('#10b981', 'var(--gr)'),
    ('#059659', 'var(--grd)'),   # typo variante trouvée dans certains fichiers
    ('#059669', 'var(--grd)'),

    # ── Rouge ──
    ('#ef4444', 'var(--rd)'),
    ('#dc2626', 'var(--rdk)'),
    ('#b91c1c', 'var(--rdx)'),

    # ── Amber ──
    ('#f59e0b', 'var(--am)'),
    ('#d97706', 'var(--amk)'),
    ('#b45309', 'var(--amx)'),
    ('#fde68a', 'var(--aml)'),
    ('#fbbf24', 'var(--aml2)'),

    # ── Bleu / cyan ──
    ('#0ea5e9', 'var(--bl)'),
    ('#0891b2', 'var(--blk)'),

    # ── Violet ──
    ('#8b5cf6', 'var(--pu)'),
    ('#7c3aed', 'var(--puk)'),
    ('#a855f7', 'var(--pul)'),

    # ── Ink / texte ──
    ('#0b0d1a', 'var(--ink)'),
    ('#0a0d1a', 'var(--ink)'),
    ('#0f172a', 'var(--ink)'),
    ('#1a1d2e', 'var(--ink2)'),
    ('#1e293b', 'var(--ink4)'),

    # ── Muted ──
    ('#7880a4', 'var(--mu)'),
    ('#64748b', 'var(--mu3)'),
    ('#475569', 'var(--mu4)'),
    ('#94a3b8', 'var(--mu2)'),
    ('#9ba3c2', 'var(--mu2)'),

    # ── Surfaces / backgrounds ──
    ('#e2e6f2', 'var(--bo)'),
    ('#f4f5fb', 'var(--bg)'),
    ('#f0f2f8', 'var(--bg3)'),
    ('#f1f5f9', 'var(--bg4)'),
    ('#f8f9fc', 'var(--su2)'),
    ('#f8f9fd', 'var(--su2)'),
]

def apply_replacements(content, filepath):
    """Remplace les hex dans le contenu, case-insensitive, word-boundary."""
    original = content
    for hex_val, var_val in REPLACEMENTS:
        # Match hex avec word-boundary (pas suivi d'un autre chiffre hex)
        pattern = re.compile(
            re.escape(hex_val) + r'(?![0-9a-fA-F])',
            re.IGNORECASE
        )
        content = pattern.sub(var_val, content)
    return content

def process_file(filepath, src_root):
    rel = os.path.relpath(filepath, src_root)
    if rel in SKIP_FILES:
        return 0, False

    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    updated = apply_replacements(original, filepath)
    if updated == original:
        return 0, False

    count = sum(
        len(re.findall(re.escape(h) + r'(?![0-9a-fA-F])', original, re.IGNORECASE))
        for h, _ in REPLACEMENTS
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(updated)

    return count, True

def main():
    src_root = '/Users/macbookm3/Desktop/permigo-v7/permigo-game'
    src_dir = os.path.join(src_root, 'src')

    total_replacements = 0
    changed_files = []

    for dirpath, dirnames, filenames in os.walk(src_dir):
        for filename in sorted(filenames):
            if not (filename.endswith('.js') or filename.endswith('.css')):
                continue
            filepath = os.path.join(dirpath, filename)
            count, changed = process_file(filepath, src_root)
            if changed:
                rel = os.path.relpath(filepath, src_root)
                changed_files.append((rel, count))
                total_replacements += count

    print(f"\n{'='*60}")
    print(f"PHASE 1 — Résultats")
    print(f"{'='*60}")
    print(f"Fichiers modifiés : {len(changed_files)}")
    print(f"Remplacements estimés : {total_replacements}")
    print(f"\nFichiers modifiés :")
    for f, c in sorted(changed_files):
        print(f"  {c:4d}×  {f}")
    print(f"\nFichiers SKIPPÉS (no-touch) :")
    for f in sorted(SKIP_FILES):
        print(f"  {f}")

if __name__ == '__main__':
    main()
