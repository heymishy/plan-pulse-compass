# ULTRA Token Optimization Protocol - 95% Reduction

## MANDATORY Rules for ALL Claude Sessions

### 🚫 PROHIBITED Actions (Claude NEVER does)

- ❌ Run test commands (`npm run test:*`, `npx playwright`, etc.)
- ❌ Read entire files (use targeted line ranges only)
- ❌ Execute bash commands for test validation
- ❌ Request full error outputs or stack traces
- ❌ Build context upfront (build incrementally only)

### ✅ REQUIRED Actions (Claude ALWAYS does)

- ✅ Provide code changes ONLY
- ✅ Request specific line ranges: "Show me lines X-Y in file.ts"
- ✅ Work from minimal error summaries provided by USER
- ✅ Ask for targeted information only when needed
- ✅ Focus on fixing rather than investigating

## USER Testing Protocol

### Mandatory Test Sequence

```bash
# USER runs this and reports brief results
npm run test:core && npm run typecheck && npm run lint && npm run build
```

### Error Reporting Examples

```
✅ "All tests pass, ready to commit"
❌ "3 test fails: skillBasedPlanning.test.ts:45,67,89 - calc errors"
❌ "TypeScript error: Teams.tsx:15 - Select import missing"
❌ "Lint: 2 unused imports in utils/math.ts"
❌ "Build failed: import error in Teams.tsx"
```

## File Investigation Protocol

### Request Format (Claude)

```
"Show me lines 45-67 in src/utils/skillBasedPlanning.ts where the error occurs"
"Copy the function around line 89 in Teams.tsx that has the Select issue"
"Share the import section (lines 1-20) of utils/math.ts"
```

### Response Format (USER)

```typescript
// Lines 45-67 of skillBasedPlanning.ts
export function calculateTeamProjectCompatibility(
  team: Team,
  project: Project,
  projectSkills: ProjectSkill[]
) {
  // Error occurs here - projectSkills.map is undefined
  return projectSkills.map(skill => {
    // Line 45 - ERROR HERE
    // ... function body
  });
}
```

## Workflow Examples

### Successful Workflow

1. **Claude**: "Here's the fix for Teams.tsx - add Select import on line 10"
2. **USER**: _applies change_
3. **USER**: "✅ All tests pass, ready to commit"
4. **Total tokens**: ~500

### Error Workflow

1. **Claude**: "Here's the fix for skillBasedPlanning.ts"
2. **USER**: _applies change, runs tests_
3. **USER**: "❌ Still 2 fails: lines 67,89 - mock data issues"
4. **Claude**: "Show me lines 60-75 where mock data is used"
5. **USER**: _copies only those lines_
6. **Claude**: "Fix the mock data structure - change X to Y"
7. **USER**: "✅ All tests pass"
8. **Total tokens**: ~800

## Token Savings Breakdown

| Activity              | Before     | After     | Savings   |
| --------------------- | ---------- | --------- | --------- |
| Test execution        | 8,000      | 50        | 99%       |
| File reading          | 2,500      | 300       | 88%       |
| Error analysis        | 5,000      | 200       | 96%       |
| Context building      | 10,000     | 500       | 95%       |
| **Total per session** | **25,500** | **1,050** | **95.9%** |

## Communication Templates

### Claude Requests

- "Show me lines X-Y in [file] where [specific issue]"
- "Copy the [function/component/interface] that has the [specific error]"
- "Share the import section of [file] (usually lines 1-15)"

### USER Responses

- "✅ All pass" or "❌ [count] fails: [file]:[lines] - [brief description]"
- Only copy requested line ranges
- Never share full console outputs or stack traces

## Success Metrics

- Session token usage: 1,000-3,000 (down from 15,000-25,000)
- Fix accuracy: Maintained at 95%+
- Development speed: 3x faster due to reduced back-and-forth
- Context efficiency: 95% relevant information only

## Emergency Protocols

### If Claude Requests Prohibited Actions

**USER Response**: "Use ultra-optimized protocol - I'll run tests and share brief results"

### If USER Shares Too Much Information

**Claude Response**: "Thanks - I only need the brief error summary: file:line - error type"

### If Session Exceeds 3,000 Tokens

**Action**: Stop, summarize findings, start new session with minimal context

---

**Remember**: This protocol achieves 95% token reduction while maintaining development quality. Every token counts!
