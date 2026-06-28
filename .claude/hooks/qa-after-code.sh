#!/usr/bin/env bash
# QA hook: fires on Stop event, checks if TS/TSX files were changed.
# If yes, outputs a trigger message so Claude runs /qa-review automatically.

# Check for changes in TypeScript/React Native files (committed or staged)
CHANGED=$(git diff HEAD~1 --name-only 2>/dev/null | grep -E '\.(ts|tsx)$')
if [ -z "$CHANGED" ]; then
  # Fall back to staged/unstaged diff if nothing committed yet
  CHANGED=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx)$')
fi

if [ -n "$CHANGED" ]; then
  echo "QA_TRIGGER: Code files were modified:"
  echo "$CHANGED" | sed 's/^/  - /'
  echo ""
  echo "Running /qa-review to verify implementation against original request..."
fi
