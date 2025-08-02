# Claude Code Token Optimization Framework

**Priority**: 🔥 **CRITICAL** - Use for ALL development sessions to minimize token consumption

## Core Philosophy

**"Think First, Read Only What's Needed"** - Transform from "read everything, then think" to targeted, progressive problem-solving.

## 🎯 Target Metrics

| Metric            | Before        | After        | Savings    |
| ----------------- | ------------- | ------------ | ---------- |
| File Reading      | 8,000 tokens  | 800 tokens   | **90%**    |
| Test Output       | 6,000 tokens  | 400 tokens   | **93%**    |
| Context Loading   | 10,000 tokens | 2,000 tokens | **80%**    |
| **Session Total** | **~25,000**   | **~3,200**   | **🏆 87%** |

---

## 1. 🎯 Targeted File Sections

### Use Cases

- **❌ Avoid**: Reading entire files (2000+ tokens)
- **✅ Prefer**: Specific sections (200-400 tokens)

### Implementation

```bash
# Token-efficient file reading
./scripts/targeted-grep.sh "failing-pattern" "path/to/file.tsx" 10

# Use Read tool with line ranges
Read({ file_path: "/path/file.tsx", offset: 45, limit: 25 })

# Grep for specific patterns with minimal context
Grep({ pattern: "describe.*Currency", output_mode: "content", -A: 10, -B: 2 })
```

### Decision Matrix

| Scenario             | Tool               | Tokens  | Example                       |
| -------------------- | ------------------ | ------- | ----------------------------- |
| Find failing test    | Grep + context     | 200-400 | `describe.*failing.*test`     |
| Understand error     | Read + offset      | 300-500 | Lines 45-70 of error location |
| Check implementation | Targeted grep      | 200-300 | Function/class name pattern   |
| Full file needed     | Read (last resort) | 2000+   | Only when truly necessary     |

---

## 2. 📊 Summary-First Approach

### Progressive Investigation Phases

#### Phase 1: High-Level Assessment (50-100 tokens)

```typescript
'🔍 Status: 2 failing, 838 passing. Focus: currency formatting context issues';
```

#### Phase 2: Targeted Investigation (200-300 tokens)

```typescript
"📍 Root cause: Missing SettingsProvider in test setup.
 Files: ProjectCommandCenterModal.currency.test.tsx:61"
```

#### Phase 3: Minimal Implementation (300-500 tokens)

```typescript
'🔧 Fix: Add renderWithContext wrapper + proper mocks';
```

### Implementation Pattern

1. **Quick scan** → Identify problem area
2. **Targeted read** → Understand specific issue
3. **Minimal fix** → Implement solution
4. **Validation** → Confirm resolution

---

## 3. 🔄 Incremental Context Building

### Context Layers (Load Only When Needed)

#### Layer 1: Task Context (100 tokens)

```typescript
'Fix failing currency tests';
```

#### Layer 2: Problem Context (200 tokens)

```typescript
'describe.skip indicates disabled tests, likely context issues';
```

#### Layer 3: Solution Context (300 tokens)

```typescript
'Need SettingsProvider wrapper + mock configuration';
```

#### Layer 4: Implementation Context (400 tokens)

```typescript
'Add renderWithContext helper + comprehensive mocks';
```

### Context Loading Rules

- Start minimal, expand only if needed
- Each layer builds on previous
- Stop when sufficient understanding achieved
- Cache context for session reuse

---

## 4. 📦 Tool Result Compression

### Test Execution Optimization

#### Current (Inefficient)

```bash
npm run test -- --run currency.test.tsx
# Output: 6000+ tokens of verbose test results
```

#### Optimized

```bash
./scripts/test-summary.sh "currency" --failures-only
# Output: 200-400 tokens focused on failures
```

### Compression Strategies

#### Test Results

```typescript
// Instead of full output, use:
"✅ 10 passing ❌ 2 failing:
- Currency formatting context error (line 61)
- Zero amount assertion multiple elements (line 365)"
```

#### File Changes

```typescript
// Instead of full diffs, use:
"📝 Modified: currency.test.tsx
- Added: renderWithContext helper (line 172)
- Fixed: SettingsProvider mock (line 103)
- Updated: 12 test cases to use wrapper"
```

#### Status Updates

```typescript
// Symbol-based progress
'🔴 Tests failing → 🔍 Context missing → 🔧 Mock added → ✅ Tests passing';
```

---

## 5. 🎛️ Strategic Batching

### Batch Operations by Logical Groups

#### Instead of: 6 separate operations

```typescript
Bash(git status) → Read(file1) → Read(file2) → Edit(file1) → Bash(test) → Bash(commit)
```

#### Use: 2 strategic batches

```typescript
// Batch 1: Investigation
[git status, targeted-grep for failures, minimal-test-run]

// Batch 2: Implementation
[targeted-edit, test-specific-section, commit]
```

### Batching Guidelines

- **Investigation phase**: Gather all needed info in one batch
- **Implementation phase**: Make all changes in one batch
- **Validation phase**: Run all checks in one batch
- **Completion phase**: Commit and push in one batch

---

## 🛠️ Optimization Tools

### Available Scripts

#### Test Summary Tool

```bash
# Quick test overview
./scripts/test-summary.sh "pattern"

# Failures only
./scripts/test-summary.sh "pattern" --failures-only
```

#### Targeted File Reader

```bash
# Find specific sections
./scripts/targeted-grep.sh "failing-test-pattern" "test-file.tsx" 5
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:summary": "./scripts/test-summary.sh",
    "grep:targeted": "./scripts/targeted-grep.sh"
  }
}
```

---

## 📋 Session Workflow Template

### 1. Initial Assessment (100-200 tokens)

```typescript
// Quick status check
"🔍 What needs to be done?"
- Use: git status, test summary, quick grep
```

### 2. Problem Investigation (200-400 tokens)

```typescript
// Targeted analysis
"📍 Where is the specific issue?"
- Use: Targeted grep, specific file sections
```

### 3. Solution Implementation (300-600 tokens)

```typescript
// Minimal changes
"🔧 How to fix efficiently?"
- Use: Targeted edits, specific line changes
```

### 4. Validation (100-200 tokens)

```typescript
// Confirm success
"✅ Does it work correctly?"
- Use: Test summary, specific validation
```

---

## 🚫 Anti-Patterns to Avoid

### High Token Waste

- ❌ Reading entire large files without purpose
- ❌ Running full test suites for small changes
- ❌ Loading complete context upfront
- ❌ Verbose tool outputs with irrelevant details
- ❌ Multiple sequential reads of same content

### Inefficient Workflows

- ❌ Investigation → Implementation → Investigation → Implementation (scattered)
- ✅ Investigation batch → Implementation batch → Validation batch (grouped)

---

## 📊 Success Metrics

### Per Session Tracking

- **Token usage**: Target <5,000 per session
- **File operations**: Target <10 reads per session
- **Test executions**: Target <3 full runs per session
- **Context efficiency**: Target >80% relevant content

### Quality Gates

- **Problem identification**: <200 tokens
- **Solution implementation**: <800 tokens
- **Validation**: <200 tokens
- **Total session**: <5,000 tokens

---

## 🔧 Implementation Checklist

### Before Starting Any Session

- [ ] Use test summary for quick status
- [ ] Identify specific problem areas with targeted grep
- [ ] Plan minimal investigation approach
- [ ] Batch related operations

### During Development

- [ ] Read only necessary file sections
- [ ] Use compressed test outputs
- [ ] Build context incrementally
- [ ] Group operations logically

### Before Completion

- [ ] Validate with minimal test runs
- [ ] Use summary outputs for confirmation
- [ ] Track token usage efficiency
- [ ] Document optimization wins

---

**🎯 Remember**: Every token saved is efficiency gained. Think first, read only what's needed, and always optimize for the next session.
