#!/usr/bin/env bash
# Empeche lecture/ecriture .env*. Detecte secrets hardcodes (Supabase service_role, JWT, Stripe).
INPUT=$(cat)
PATH_ARG=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Bloque lecture .env*
if echo "$PATH_ARG" | grep -Eq '\.env(\.local|\.production|\.development)?$'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Lecture de .env interdite. Utilise import.meta.env.VITE_* dans le code, jamais lire le fichier directement."}}'
  exit 0
fi

# Bloque cat .env via Bash
if echo "$CMD" | grep -Eq '(cat|less|head|tail|more|bat)[[:space:]]+.*\.env'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Pas de cat sur .env. Utilise import.meta.env.VITE_*."}}'
  exit 0
fi

# Detecte secrets hardcodes dans le contenu ecrit
SECRET_PATTERNS='(sk_live_|sk_test_|rk_live_|eyJhbGciOiJIUzI1NiIs[A-Za-z0-9_-]{50,}|service_role_key.*=.*[a-zA-Z0-9]{20}|SUPABASE_SERVICE_ROLE.*=.*ey)'
if echo "$CONTENT" | grep -Eq "$SECRET_PATTERNS"; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Secret hardcode detecte. Utilise import.meta.env.VITE_* (front) ou Deno.env.get() (edge function) avec .env.local."}}'
  exit 0
fi
exit 0
