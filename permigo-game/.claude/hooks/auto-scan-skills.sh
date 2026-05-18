#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Hook PermiGo — UserPromptSubmit
# Force Claude à scanner les skills disponibles à chaque message
# et à invoquer la plus pertinente AVANT de répondre.
# ═══════════════════════════════════════════════════════════════

# Path absolu vers le dossier skills (peut être appelé depuis n'importe où)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$(dirname "$SCRIPT_DIR")/skills"

if [ ! -d "$SKILLS_DIR" ]; then
  exit 0
fi

# Construire la liste skill + extrait de description
SKILLS_LIST=""
for skill_dir in "$SKILLS_DIR"/*/; do
  skill_name=$(basename "$skill_dir")
  skill_file="$skill_dir/SKILL.md"
  if [ -f "$skill_file" ]; then
    # Extract description from YAML frontmatter (1ère ligne après "description:")
    desc=$(awk '/^description:/ {
      sub(/^description: *"?/, "");
      sub(/"?$/, "");
      print;
      exit
    }' "$skill_file" | head -c 220)
    SKILLS_LIST="${SKILLS_LIST}- **${skill_name}** : ${desc}
"
  fi
done

# Output (stdout) = injecté dans le contexte de Claude comme system-reminder
cat <<EOF
<system-reminder>
RÈGLE PERMIGO #0 — ABSOLUE.

Avant de répondre au message ci-dessous, tu DOIS examiner les skills installées dans \`.claude/skills/\` et invoquer la plus pertinente. Pour 80% des messages, au moins une skill match.

Skills disponibles (descriptions abrégées) :
${SKILLS_LIST}

Si UNE skill correspond au message (même partiellement) → INVOQUE-LA explicitement dans ta réponse en annonçant "J'utilise la skill X" puis applique sa méthodologie.

Si AUCUNE skill ne match (cas rare : question triviale, factuelle, conversationnelle simple) → réponds normalement.

Aucune exception. Pas d'auto-rationalisation type "je sais déjà répondre". Le user a installé ces skills pour qu'elles soient utilisées proactivement.
</system-reminder>
EOF

exit 0
