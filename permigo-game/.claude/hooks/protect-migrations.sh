#!/usr/bin/env bash
# Empeche modif d'une migration Supabase deja commitee. Force la creation d'une nouvelle.
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$TOOL" == "Edit" || "$TOOL" == "MultiEdit" ]]; then
  if echo "$FILE" | grep -Eq 'supabase/migrations/.*\.sql$'; then
    if git -C "$(dirname "$FILE")" ls-files --error-unmatch "$FILE" >/dev/null 2>&1; then
      cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Migration deja commitee. CREE UNE NOUVELLE migration au lieu d'editer celle-ci (sinon prod et dev divergent). Utilise: supabase migration new <nom>"}}
EOF
      exit 0
    fi
  fi
fi
exit 0
