#!/usr/bin/env node

/**
 * CI Configuration Generator
 * Generates optimized CI/CD configurations based on test inventory and configuration
 */

import fs from 'fs';
import path from 'path';
// import { testConfigManager } from '../src/utils/testConfigManager.js';

const PROJECT_ROOT = process.cwd();
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.github/workflows');

function getDefaultConfig() {
  return {
    ciConfig: {
      lightning: {
        timeout: 5000,
        retries: 1,
        parallel: true,
        maxWorkers: 4,
        include: ['src/utils/**/*.test.ts', 'src/hooks/**/*.test.ts'],
        exclude: ['**/*.integration.test.*', '**/*.e2e.*'],
      },
      comprehensive: {
        timeout: 10000,
        retries: 2,
        parallel: true,
        maxWorkers: 4,
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['tests/e2e/**/*'],
      },
      quality: {
        timeout: 30000,
        retries: 3,
        parallel: false,
        maxWorkers: 2,
        include: ['src/**/*.test.{ts,tsx}', 'tests/e2e/**/*.spec.ts'],
        exclude: [],
      },
    },
    pyramidTargets: {
      unit: { min: 60, max: 80, target: 70 },
      integration: { min: 15, max: 30, target: 20 },
      e2e: { min: 5, max: 15, target: 10 },
    },
    qualityGates: {
      coverage: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  };
}

// Ensure .github/workflows directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate GitHub Actions workflow for a specific CI tier
 */
function generateGitHubWorkflow(tier, config) {
  const tierConfig = config.ciConfig[tier];

  const workflow = {
    name: `CI Pipeline - ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,

    on: {
      push: {
        branches:
          tier === 'lightning' ? ['main', 'develop', 'feature/*'] : ['main'],
      },
      pull_request: {
        branches: ['main'],
      },
      ...(tier === 'quality' && {
        schedule: [
          {
            cron: '0 2 * * *', // Run quality tests nightly
          },
        ],
      }),
    },

    env: {
      NODE_VERSION: '18',
      CI: 'true',
      NODE_OPTIONS: `--max-old-space-size=${getTierMemoryLimit(tier)}`,
    },

    jobs: {
      [`${tier}-tests`]: {
        'runs-on': 'ubuntu-latest',

        strategy:
          tier === 'quality'
            ? {
                matrix: {
                  browser: ['chromium', 'firefox', 'webkit'],
                  'node-version': ['18', '20'],
                },
              }
            : undefined,

        timeout: Math.ceil(tierConfig.timeout / 1000 / 60), // Convert to minutes

        steps: [
          {
            name: 'Checkout code',
            uses: 'actions/checkout@v4',
          },
          {
            name: 'Setup Node.js',
            uses: 'actions/setup-node@v4',
            with: {
              'node-version':
                tier === 'quality' ? '\${{ matrix.node-version }}' : '18',
              cache: 'npm',
            },
          },
          {
            name: 'Install dependencies',
            run: 'npm ci',
          },
          ...(tier === 'quality' || tier === 'comprehensive'
            ? [
                {
                  name: 'Install Playwright browsers',
                  run: 'npx playwright install --with-deps',
                },
              ]
            : []),
          {
            name: `Run ${tier} tests`,
            run: generateTestCommand(tier, tierConfig),
            env: {
              ...(tier === 'quality' && {
                BROWSER: '\${{ matrix.browser }}',
              }),
            },
          },
          ...(tier === 'quality'
            ? [
                {
                  name: 'Upload test results',
                  uses: 'actions/upload-artifact@v4',
                  if: 'always()',
                  with: {
                    name: `test-results-${tier}-\${{ matrix.browser || 'default' }}`,
                    path: 'test-results/',
                    retention: 30,
                  },
                },
                {
                  name: 'Upload coverage reports',
                  uses: 'codecov/codecov-action@v3',
                  with: {
                    file: './coverage/lcov.info',
                    flags: tier,
                    name: `${tier}-coverage`,
                  },
                },
              ]
            : []),
        ],
      },
    },
  };

  return workflow;
}

/**
 * Generate test command for specific tier
 */
function generateTestCommand(tier, tierConfig) {
  const commands = [];

  switch (tier) {
    case 'lightning':
      commands.push('npm run test:core');
      commands.push('npm run typecheck');
      commands.push('npm run lint');
      break;

    case 'comprehensive':
      commands.push('npm run test:integration');
      commands.push('npm run test:unit');
      commands.push('npm run test:e2e:smoke');
      commands.push('npm run typecheck');
      commands.push('npm run lint');
      break;

    case 'quality':
      commands.push('npm run test:coverage');
      commands.push('npm run test:e2e');
      commands.push('npm run test:accessibility');
      commands.push('npm run test:performance');
      commands.push('npm audit --audit-level=high');
      commands.push('npm run build');
      break;
  }

  return commands.join(' && ');
}

/**
 * Get memory limit for tier
 */
function getTierMemoryLimit(tier) {
  switch (tier) {
    case 'lightning':
      return '512';
    case 'comprehensive':
      return '1024';
    case 'quality':
      return '2048';
    default:
      return '1024';
  }
}

/**
 * Generate Vitest configuration for tier
 */
function generateVitestConfig(tier, config) {
  const tierConfig = config.ciConfig[tier];

  const vitestConfig = {
    import: "{ defineConfig } from 'vitest/config'",
    plugins: ['react()'],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      testTimeout: tierConfig.timeout,
      hookTimeout: Math.min(tierConfig.timeout / 2, 10000),

      // Include/exclude patterns
      include: getTestPatterns(tier, 'include'),
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        ...getTestPatterns(tier, 'exclude'),
      ],

      // Performance settings
      pool: tierConfig.parallel ? 'forks' : 'threads',
      poolOptions: {
        forks: {
          singleFork: !tierConfig.parallel,
          maxForks: tierConfig.maxWorkers,
          minForks: 1,
          isolate: true,
        },
        threads: {
          singleThread: !tierConfig.parallel,
          maxThreads: tierConfig.maxWorkers,
          minThreads: 1,
          isolate: true,
        },
      },

      // Reporting
      reporters: tier === 'quality' ? ['default', 'json', 'html'] : ['default'],
      outputFile:
        tier === 'quality'
          ? {
              json: './test-results/results.json',
              html: './test-results/html/index.html',
            }
          : undefined,

      // Coverage
      coverage:
        tier === 'quality'
          ? {
              enabled: true,
              provider: 'v8',
              reporter: ['text', 'json', 'html', 'lcov'],
              reportsDirectory: './coverage',
              exclude: [
                'node_modules/',
                'src/test/',
                '**/*.test.{ts,tsx}',
                '**/*.spec.{ts,tsx}',
                'src/types/',
                'vite.config.*',
                'vitest.config.*',
              ],
              thresholds: config.qualityGates.coverage,
            }
          : { enabled: false },

      // Retry settings
      retry: tierConfig.retries,
      bail: tier === 'lightning' ? 1 : 0,
    },

    resolve: {
      alias: {
        '@': "path.resolve(__dirname, './src')",
      },
    },
  };

  return vitestConfig;
}

/**
 * Get test patterns for specific tier and type
 */
function getTestPatterns(tier, type) {
  const patterns = {
    lightning: {
      include: [
        'src/utils/**/*.test.ts',
        'src/hooks/**/*.test.ts',
        'src/components/ui/**/*.test.tsx',
      ],
      exclude: ['**/*.integration.test.*', '**/*.e2e.spec.*', 'tests/e2e/**/*'],
    },
    comprehensive: {
      include: [
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/integration/**/*.test.{ts,tsx}',
      ],
      exclude: ['tests/e2e/**/*', 'src/__tests__/performance/**/*'],
    },
    quality: {
      include: [
        'src/**/*.test.{ts,tsx}',
        'tests/e2e/**/*.spec.{ts,tsx}',
        'src/__tests__/**/*.test.{ts,tsx}',
      ],
      exclude: [],
    },
  };

  return patterns[tier]?.[type] || [];
}

/**
 * Generate package.json test scripts
 */
function generateTestScripts(config) {
  return {
    // Core test commands
    'test:lightning': 'vitest run --config vitest.config.lightning.ts',
    'test:comprehensive': 'vitest run --config vitest.config.comprehensive.ts',
    'test:quality': 'vitest run --config vitest.config.quality.ts',

    // Specific type commands
    'test:unit': 'vitest run src/components/ui/ src/hooks/ src/utils/',
    'test:integration':
      'vitest run src/context/ src/pages/ src/__tests__/integration/',
    'test:e2e': 'playwright test tests/e2e/',
    'test:e2e:smoke': 'playwright test tests/e2e/smoke-test-ci.spec.ts',
    'test:accessibility': 'vitest run src/__tests__/accessibility/',
    'test:performance': 'vitest run src/__tests__/performance/',

    // Coverage and quality
    'test:coverage': 'vitest run --config vitest.config.quality.ts',
    'test:watch': 'vitest',

    // CI-specific commands
    'ci:lightning':
      'npm run test:lightning && npm run typecheck && npm run lint',
    'ci:comprehensive': 'npm run test:comprehensive && npm run test:e2e:smoke',
    'ci:quality': 'npm run test:quality && npm audit --audit-level=high',

    // Maintenance commands
    'test:update-snapshots': 'vitest run --update-snapshots',
    'test:clear-cache': 'vitest --clearCache',
  };
}

/**
 * Generate Playwright configuration for E2E tests
 */
function generatePlaywrightConfig(tier) {
  const config = {
    testDir: './tests/e2e',
    timeout: tier === 'quality' ? 30000 : 10000,
    expect: {
      timeout: 5000,
    },
    fullyParallel: tier !== 'lightning',
    forbidOnly: true,
    retries: tier === 'quality' ? 2 : 1,
    workers: tier === 'lightning' ? 1 : undefined,
    reporter:
      tier === 'quality'
        ? [['html'], ['json', { outputFile: 'test-results/results.json' }]]
        : 'line',

    use: {
      baseURL: 'http://localhost:8080',
      trace: tier === 'quality' ? 'on-first-retry' : 'off',
      screenshot: tier === 'quality' ? 'only-on-failure' : 'off',
      video: tier === 'quality' ? 'retain-on-failure' : 'off',
    },

    projects:
      tier === 'quality'
        ? [
            {
              name: 'chromium',
              use: { channel: 'chrome' },
            },
            {
              name: 'firefox',
              use: { browserName: 'firefox' },
            },
            {
              name: 'webkit',
              use: { browserName: 'webkit' },
            },
            {
              name: 'Mobile Chrome',
              use: {
                browserName: 'chromium',
                viewport: { width: 393, height: 851 },
                isMobile: true,
              },
            },
          ]
        : [
            {
              name: 'chromium',
              use: { channel: 'chrome' },
            },
          ],

    webServer: {
      command: 'npm run dev',
      port: 8080,
      reuseExistingServer: !process.env.CI,
    },
  };

  return config;
}

/**
 * Main function to generate all CI configurations
 */
async function generateCIConfigurations() {
  console.log('🔧 Generating CI/CD configurations...');

  try {
    // Load test inventory and create default config
    const config = getDefaultConfig();

    // Generate GitHub Actions workflows
    const tiers = ['lightning', 'comprehensive', 'quality'];

    for (const tier of tiers) {
      const workflow = generateGitHubWorkflow(tier, config);
      const workflowPath = path.join(OUTPUT_DIR, `${tier}-tests.yml`);

      // Convert to YAML format
      const yamlContent = `# Auto-generated CI workflow for ${tier} tests
# Do not edit manually - regenerate using npm run generate:ci

name: ${workflow.name}

on:
${Object.entries(workflow.on)
  .map(
    ([key, value]) =>
      `  ${key}:\n${
        typeof value === 'object'
          ? Object.entries(value)
              .map(([k, v]) => `    ${k}: ${JSON.stringify(v)}`)
              .join('\n')
          : `    ${value}`
      }`
  )
  .join('\n')}

env:
${Object.entries(workflow.env)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\n')}

jobs:
  ${Object.entries(workflow.jobs)
    .map(
      ([jobName, job]) =>
        `${jobName}:\n    runs-on: ${job['runs-on']}\n    timeout-minutes: ${job.timeout}\n    ${
          job.strategy
            ? `strategy:\n      matrix:\n${Object.entries(job.strategy.matrix)
                .map(([k, v]) => `        ${k}: ${JSON.stringify(v)}`)
                .join('\n')}\n    `
            : ''
        }steps:\n${job.steps
          .map(
            step =>
              `    - name: ${step.name}\n      ${Object.entries(step)
                .filter(([k]) => k !== 'name')
                .map(([k, v]) =>
                  k === 'with' || k === 'env'
                    ? `${k}:\n${Object.entries(v)
                        .map(([wk, wv]) => `        ${wk}: ${wv}`)
                        .join('\n')}`
                    : `${k}: ${v}`
                )
                .join('\n      ')}`
          )
          .join('\n')}`
    )
    .join('\n  ')}`;

      fs.writeFileSync(workflowPath, yamlContent);
      console.log(`✅ Generated ${tier} workflow: ${workflowPath}`);
    }

    // Generate Vitest configurations
    for (const tier of tiers) {
      const vitestConfig = generateVitestConfig(tier, config);
      const configPath = path.join(PROJECT_ROOT, `vitest.config.${tier}.ts`);

      const configContent = `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Auto-generated Vitest configuration for ${tier} tests
// Do not edit manually - regenerate using npm run generate:ci

export default defineConfig({
  plugins: [react()],
  test: ${JSON.stringify(vitestConfig.test, null, 4)},
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});`;

      fs.writeFileSync(configPath, configContent);
      console.log(`✅ Generated ${tier} Vitest config: ${configPath}`);
    }

    // Generate Playwright configurations
    for (const tier of ['comprehensive', 'quality']) {
      const playwrightConfig = generatePlaywrightConfig(tier);
      const configPath = path.join(
        PROJECT_ROOT,
        `playwright.config.${tier}.ts`
      );

      const configContent = `import { defineConfig, devices } from '@playwright/test';

// Auto-generated Playwright configuration for ${tier} tests
// Do not edit manually - regenerate using npm run generate:ci

export default defineConfig(${JSON.stringify(playwrightConfig, null, 2)});`;

      fs.writeFileSync(configPath, configContent);
      console.log(`✅ Generated ${tier} Playwright config: ${configPath}`);
    }

    // Update package.json scripts
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const newScripts = generateTestScripts(config);
    packageJson.scripts = { ...packageJson.scripts, ...newScripts };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json test scripts');

    // Generate summary report
    const summaryPath = path.join(PROJECT_ROOT, 'CI_CONFIGURATION_SUMMARY.md');
    const summary = generateSummaryReport(config, tiers);
    fs.writeFileSync(summaryPath, summary);
    console.log(`✅ Generated configuration summary: ${summaryPath}`);

    console.log('\n🎉 CI/CD configuration generation complete!');
    console.log('\nGenerated files:');
    console.log('- GitHub Actions workflows (.github/workflows/)');
    console.log('- Vitest configurations (vitest.config.*.ts)');
    console.log('- Playwright configurations (playwright.config.*.ts)');
    console.log('- Updated package.json scripts');
    console.log('- Configuration summary (CI_CONFIGURATION_SUMMARY.md)');
  } catch (error) {
    console.error('❌ Failed to generate CI configurations:', error);
    process.exit(1);
  }
}

/**
 * Generate summary report
 */
function generateSummaryReport(config, tiers) {
  return `# CI/CD Configuration Summary

Generated on: ${new Date().toISOString()}

## Test Pyramid Targets

- **Unit Tests**: ${config.pyramidTargets.unit.target}% (${config.pyramidTargets.unit.min}-${config.pyramidTargets.unit.max}%)
- **Integration Tests**: ${config.pyramidTargets.integration.target}% (${config.pyramidTargets.integration.min}-${config.pyramidTargets.integration.max}%)
- **E2E Tests**: ${config.pyramidTargets.e2e.target}% (${config.pyramidTargets.e2e.min}-${config.pyramidTargets.e2e.max}%)

## CI Tiers

${tiers
  .map(tier => {
    const tierConfig = config.ciConfig[tier];
    return `### ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier

- **Timeout**: ${tierConfig.timeout}ms
- **Retries**: ${tierConfig.retries}
- **Parallel**: ${tierConfig.parallel}
- **Max Workers**: ${tierConfig.maxWorkers}
- **Memory Limit**: ${getTierMemoryLimit(tier)}MB`;
  })
  .join('\n\n')}

## Quality Gates

### Coverage Requirements
- Lines: ${config.qualityGates.coverage.lines}%
- Functions: ${config.qualityGates.coverage.functions}%
- Branches: ${config.qualityGates.coverage.branches}%
- Statements: ${config.qualityGates.coverage.statements}%

### Stability Requirements
- Minimum: ${config.qualityGates.stability.minimum * 100}%
- Critical: ${config.qualityGates.stability.critical * 100}%

### Performance Limits
- Unit Tests: ${config.qualityGates.performance.unitMaxDuration}ms
- Integration Tests: ${config.qualityGates.performance.integrationMaxDuration}ms
- E2E Tests: ${config.qualityGates.performance.e2eMaxDuration}ms

## Usage

### Run Tests Locally
\`\`\`bash
# Lightning tests (fast, essential)
npm run test:lightning

# Comprehensive tests (broader coverage)
npm run test:comprehensive  

# Quality tests (full suite with coverage)
npm run test:quality
\`\`\`

### CI/CD Integration
Each tier has its own GitHub Actions workflow that runs automatically based on triggers:

- **Lightning**: All pushes and PRs (fast feedback)
- **Comprehensive**: Main branch pushes and PRs
- **Quality**: Main branch pushes, PRs, and nightly runs

### Updating Configuration
To update test configuration:

1. Modify test inventory using \`npm run generate:inventory\`
2. Update test configuration in the Test Dashboard
3. Regenerate CI configs using \`npm run generate:ci\`

## Generated Files

This configuration generates the following files (do not edit manually):

- \`.github/workflows/lightning-tests.yml\`
- \`.github/workflows/comprehensive-tests.yml\`
- \`.github/workflows/quality-tests.yml\`
- \`vitest.config.lightning.ts\`
- \`vitest.config.comprehensive.ts\`
- \`vitest.config.quality.ts\`
- \`playwright.config.comprehensive.ts\`
- \`playwright.config.quality.ts\`
- Updated \`package.json\` scripts
`;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCIConfigurations().catch(console.error);
}

export { generateCIConfigurations };
