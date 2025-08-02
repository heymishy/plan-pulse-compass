#!/bin/bash

# Token-Optimized File Section Reader
# Usage: ./scripts/targeted-grep.sh <pattern> <file> [context-lines]

set -e

PATTERN="$1"
FILE="$2"
CONTEXT="${3:-5}"

if [ -z "$PATTERN" ] || [ -z "$FILE" ]; then
    echo "Usage: $0 <pattern> <file> [context-lines]"
    exit 1
fi

echo "🎯 TARGETED SECTION - Pattern: '$PATTERN'"
echo "📁 File: $FILE"
echo "📏 Context: ±$CONTEXT lines"
echo "----------------------------------------"

# Use ripgrep for fast, context-aware search
if command -v rg &> /dev/null; then
    rg -n -C "$CONTEXT" "$PATTERN" "$FILE" || echo "No matches found"
else
    # Fallback to grep
    grep -n -C "$CONTEXT" "$PATTERN" "$FILE" || echo "No matches found"
fi

echo "----------------------------------------"
echo "💡 Found sections related to: $PATTERN"