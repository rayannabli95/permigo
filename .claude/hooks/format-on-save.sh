#!/bin/bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [[ "$FILE" =~ \.(ts|tsx|js|jsx|json)$ ]]; then
  npx prettier --write "$FILE" 2>/dev/null || true
fi
