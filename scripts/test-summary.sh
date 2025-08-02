#!/bin/bash

# Token-Optimized Test Summary Script
# Usage: ./scripts/test-summary.sh [test-pattern] [--failures-only]

set -e

TEST_PATTERN="${1:-.*}"
FAILURES_ONLY="${2:-false}"

echo "🔍 TEST SUMMARY MODE - Token Optimized"
echo "Pattern: $TEST_PATTERN"
echo "----------------------------------------"

# Run tests with minimal output
if [ "$FAILURES_ONLY" = "--failures-only" ]; then
    # Only show failures with minimal context
    npm run test -- --run --reporter=verbose --grep="$TEST_PATTERN" 2>/dev/null | \
    grep -E "(FAIL|✗|Error:|Failed)" | \
    head -20
else
    # Show concise summary without jq dependency
    echo "📊 Running tests for pattern: $TEST_PATTERN"
    
    # Run tests and capture minimal output
    TEST_OUTPUT=$(npm run test -- --run --reporter=dot --grep="$TEST_PATTERN" 2>&1 | tail -10)
    
    # Extract simple pass/fail counts
    PASSED=$(echo "$TEST_OUTPUT" | grep -o "[0-9]\+ passed" || echo "0 passed")
    FAILED=$(echo "$TEST_OUTPUT" | grep -o "[0-9]\+ failed" || echo "0 failed")
    
    echo "✅ $PASSED"
    echo "❌ $FAILED"
    
    # Show failures if any
    if echo "$TEST_OUTPUT" | grep -q "failed"; then
        echo ""
        echo "🔍 Recent failures:"
        echo "$TEST_OUTPUT" | grep -E "(FAIL|Error)" | head -5
    fi
fi

echo "----------------------------------------"
echo "🎯 Use targeted debugging for failures"