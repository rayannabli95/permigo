#!/usr/bin/env bash
# Bloque les commandes Bash destructrices. Déterministe, pas négociable.
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

DENY_PATTERNS=(
  'rm[[:space:]]+-rf[[:space:]]+/'
  'rm[[:space:]]+-rf[[:space:]]+~'
  'rm[[:space:]]+-rf[[:space:]]+\*'
  'rm[[:space:]]+-rf[[:space:]]+\.'
  'sudo[[:space:]]+rm'
  'mkfs'
  'dd[[:space:]]+if='
  'chmod[[:space:]]+-R[[:space:]]+777'
  'git[[:space:]]+push[[:space:]]+.*--force.*(main|master|production)'
  'git[[:space:]]+push[[:space:]]+.*-f.*(main|master|production)'
  'git[[:space:]]+reset[[:space:]]+--hard[[:space:]]+origin'
  'DROP[[:space:]]+DATABASE'
  'TRUNCATE[[:space:]]+TABLE.*CASCADE'
  'curl.*\|[[:space:]]*sh'
  'wget.*\|[[:space:]]*sh'
  'cat[[:space:]]+\.env($|[^.])'
  'cat[[:space:]]+\.env\.local'
)

for p in "${DENY_PATTERNS[@]}"; do
  if echo "$CMD" | grep -Eiq "$p"; then
    cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Commande dangereuse bloquee par hook PermiGo. Pattern: $p. Si vraiment necessaire, demande a Rayan de la lancer manuellement."}}
EOF
    exit 0
  fi
done
exit 0
