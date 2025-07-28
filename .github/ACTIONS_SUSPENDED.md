# ⚠️ GitHub Actions SUSPENDED

## Current Status

- **Actions Disabled**: All workflows suspended until August 1st, 2025
- **Usage**: 19,320 minutes used (965% over 2,000 minute limit)
- **Job Runs**: 3,345 runs this month
- **Cause**: Multiple redundant workflows running simultaneously

## What Happened

1. **4 workflows** were running on every push:
   - `3-Tier Optimized CI Pipeline`
   - `Test` (deleted)
   - `Quick Check` (deleted)
   - `Essential Checks` (deleted)

2. **Each push triggered 3-4 parallel workflows** = massive usage

3. **No credit card on file** = Actions suspended, no charges

## Actions Taken

✅ **GitHub Actions disabled** - stopped usage bleeding  
✅ **Redundant workflows deleted** - removed 3 duplicate workflows  
✅ **Emergency mode activated** - manual triggers only until reset

## When Actions Resume (Aug 1st)

- Only **1 optimized workflow** will run (vs 4 previously)
- **Expected usage**: ~600-800 minutes/month (vs 19,320)
- **Reduction**: ~75% fewer CI minutes used

## Development During Suspension (July 28 - Aug 1)

### ✅ What Still Works

- Push code to GitHub
- Create/merge pull requests
- Local development and testing
- Manual deployments

### ❌ What's Suspended

- Automated CI/CD pipelines
- Automated testing on push
- Automated deployments
- GitHub Pages builds

## Required Local Testing (MANDATORY)

Since CI is suspended, **ALL testing must be done locally**:

```bash
# REQUIRED before every commit
npm run test:core        # Core functionality
npm run typecheck        # Type validation
npm run lint            # Code quality
npm run build           # Build verification

# OPTIONAL but recommended
npm run test:coverage    # Full test suite
npm run test:e2e        # End-to-end tests
```

## Manual Deployment Process

```bash
# Build and deploy manually
npm run build
# Upload dist/ folder to hosting provider manually
```

## Estimated Timeline

- **July 28**: Actions suspended, emergency mode active
- **August 1**: Fresh 2,000 minutes, actions resume with optimized pipeline
- **August ongoing**: Normal CI/CD with 75% reduced usage

---

_Last updated: July 28, 2025 - Actions suspended due to usage limits_
