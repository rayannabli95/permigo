#!/bin/bash
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command')
if echo "$CMD" | grep -qE '(rm -rf /|drop database|truncate.*users|supabase db reset)'; then
  echo '{"decision":"block","reason":"Dangerous command blocked"}'
  exit 2
fi
exit 0
