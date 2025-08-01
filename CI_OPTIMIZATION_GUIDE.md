# GitHub Actions CI/CD Re-Enablement & Optimization Guide

## Overview

The GitHub Actions CI/CD pipeline has been **re-enabled** with significant optimizations to stay within the GitHub free tier limits (2,000 minutes/month).

## Previous Issue

- **Usage**: 19,320 minutes (965% over 2,000 limit)
- **Status**: Actions suspended until monthly reset
- **Impact**: CI/CD pipeline completely disabled

## Solution: Resource-Optimized 3-Tier Pipeline

### Architecture Overview

```
Tier 1: ⚡ Lightning Validation (4min, 512MB)
├── Core tests + lint + typecheck
├── Essential quality gates
└── Fast feedback loop

Tier 2: 🔍 Comprehensive Testing (15min, 512MB)
├── Integration tests
├── Critical E2E smoke tests (Chromium only)
└── Broader functionality validation

Tier 3: 🏆 Quality Assurance (25min, 768MB)
├── Full coverage tests
├── Security audit
├── Production build
└── Main branch only
```

## Key Optimizations

### 1. Memory Allocation Reductions

- **Lightning Validation**: 768MB → 512MB (-33%)
- **Comprehensive Testing**: 768MB → 512MB (-33%)
- **Quality Assurance**: 1024MB → 768MB (-25%)

### 2. Browser Installation Optimization

- **Smoke Tests**: Chromium only (instead of all browsers)
- **Quality Tests**: Chromium + Firefox only (instead of all browsers)
- **Skip Download**: `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` unless needed

### 3. Test Execution Streamlining

- **Direct npm scripts**: Eliminates custom command overhead
- **Single worker E2E**: Prevents memory competition
- **Path-based ignoring**: Skip CI for documentation changes

### 4. Resource Management Enhancements

- **Aggressive caching**: Dependencies, browsers, build outputs
- **Memory cleanup**: Explicit cleanup before quality tests
- **Reduced output**: `FORCE_COLOR=0` to minimize log size

## Expected Resource Savings

| Optimization Area    | Previous Usage    | Optimized Usage   | Savings  |
| -------------------- | ----------------- | ----------------- | -------- |
| Memory per job       | 768-1024MB        | 512-768MB         | ~35%     |
| Browser downloads    | All browsers      | Selective install | ~60%     |
| Test execution       | Parallel overhead | Streamlined       | ~25%     |
| **Total CI minutes** | **~500min/month** | **~300min/month** | **~40%** |

## CI Pipeline Behavior

### Push to Main Branch

```yaml
Triggers: lightning-validation → comprehensive-testing → quality-assurance
Parallel: build (after lightning-validation)
Deploy: production (after build + comprehensive-testing)
```

### Pull Requests

```yaml
Triggers: lightning-validation → comprehensive-testing → build
Deploy: preview (after build)
```

### Manual Trigger

```yaml
Available: workflow_dispatch for all jobs
Use case: Testing, debugging, or manual deployments
```

## Quality Gates

### Lightning Validation (MANDATORY)

- ✅ Core test suite passes
- ✅ ESLint validation clean
- ✅ TypeScript compilation successful
- ⏱️ Completes under 4 minutes

### Comprehensive Testing

- ✅ Integration tests pass
- ✅ Critical E2E smoke tests pass
- ✅ No console errors in tested pages
- ⏱️ Completes under 15 minutes

### Quality Assurance (Main branch only)

- ✅ Full test coverage ≥90%
- ✅ Security audit clean (high-level vulnerabilities)
- ✅ Production build successful
- ✅ Bundle analysis within limits
- ⏱️ Completes under 25 minutes

## Monitoring & Alerts

### Success Indicators

- ✅ All quality gates pass
- ✅ Memory usage within allocated limits
- ✅ Execution time within timeouts
- ✅ Monthly CI minutes usage <1,800 (90% of limit)

### Failure Scenarios & Actions

- ❌ **Memory exhaustion (Exit 137)**: Reduce worker count, optimize test setup
- ❌ **Timeout exceeded**: Split test suites, optimize slow tests
- ❌ **Monthly limit approaching**: Disable non-essential jobs temporarily

### Usage Monitoring

```bash
# Check current month usage
gh api /rate_limit

# View workflow runs
gh run list --limit 10

# Monitor specific workflow
gh run view --log [run-id]
```

## Developer Workflow

### Before Committing (MANDATORY)

```bash
# 1. Run complete local test suite (per CLAUDE.md)
npm run test:core
npm run type-check
npm run lint
npm run build

# 2. Run critical E2E tests locally
npx playwright test tests/e2e/smoke-test-ci.spec.ts
npx playwright test tests/e2e/page-console-errors.spec.ts
```

### Monitoring CI Status

```bash
# Check current pipeline status
gh run list --branch main --limit 5

# View detailed logs for failed runs
gh run view [run-id] --log

# Re-run failed jobs
gh run rerun [run-id] --failed
```

### Emergency Procedures

#### If CI Minutes Exceeded Again

1. **Immediate**: Add `[skip ci]` to commit messages for non-code changes
2. **Temporary**: Disable comprehensive-testing and quality-assurance jobs
3. **Long-term**: Further optimize resource usage or consider paid plan

#### If Memory Issues Persist (Exit 137)

1. **Reduce worker count**: Change `--workers=1` in E2E tests
2. **Split test suites**: Break large test files into smaller ones
3. **Optimize test setup**: Reduce mock data size, cleanup between tests

## Configuration Files

### Primary Workflow

- **File**: `.github/workflows/ci.yml`
- **Triggers**: Push to main, PRs, manual dispatch
- **Resources**: 3-tier architecture with optimized allocations

### Maintenance Workflow

- **File**: `.github/workflows/weekly-maintenance.yml`
- **Schedule**: Sunday 2 AM UTC
- **Purpose**: Security audits, dependency reports, maintenance tasks

### Test Configurations

- **Core tests**: `npm run test:core` - Essential functionality
- **Integration**: `npm run test:integration` - Cross-component testing
- **Coverage**: `npm run test:coverage` - Full suite with coverage
- **E2E Smoke**: Playwright with single worker, Chromium only

## Continuous Improvement

### Performance Monitoring

- Track CI execution times and memory usage
- Monitor GitHub Actions usage dashboard
- Optimize based on actual resource consumption

### Regular Reviews

- **Weekly**: Review CI performance and resource usage
- **Monthly**: Analyze GitHub Actions usage vs. free tier limits
- **Quarterly**: Evaluate need for paid plan based on growth

### Future Optimizations

- **Test parallelization**: Smart test splitting for reduced execution time
- **Cache optimization**: More aggressive caching strategies
- **Selective testing**: Run only tests affected by code changes
- **Resource scheduling**: Distribute CI load across different times

---

## Quick Reference

### Environment Variables

```bash
NODE_OPTIONS='--max-old-space-size=512'  # Lightning & Comprehensive
NODE_OPTIONS='--max-old-space-size=768'  # Quality Assurance
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD='1'      # Skip unless needed
FORCE_COLOR='0'                           # Reduce output size
```

### Key Commands

```bash
# Local development
npm run test:core          # Essential tests (matches Lightning tier)
npm run test:integration   # Integration tests (matches Comprehensive tier)
npm run test:coverage      # Full coverage (matches Quality tier)

# E2E testing
npx playwright test tests/e2e/smoke-test-ci.spec.ts --workers=1
npx playwright install chromium --with-deps
```

### Troubleshooting

```bash
# Check CI status
gh run list --limit 5

# View logs
gh run view --log

# Re-run failed jobs
gh run rerun --failed

# Manual trigger
gh workflow run ci.yml
```

**The CI/CD pipeline is now optimized for sustained operation within GitHub's free tier while maintaining comprehensive quality assurance.**
