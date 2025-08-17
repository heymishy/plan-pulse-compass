#!/usr/bin/env node

/**
 * Test Inventory Generator
 * Automatically scans and categorizes all test files in the project
 * Generates comprehensive test metadata for the Test Management Dashboard
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const PROJECT_ROOT = process.cwd();
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'test-inventory.json');

// Test type patterns
const TEST_PATTERNS = {
  unit: [
    'src/components/**/*.test.{ts,tsx}',
    'src/hooks/**/*.test.{ts,tsx}',
    'src/utils/**/*.test.{ts,tsx}',
    'src/lib/**/*.test.{ts,tsx}',
    'src/services/**/*.test.{ts,tsx}',
  ],
  integration: [
    'src/context/**/*.test.{ts,tsx}',
    'src/pages/**/*.test.{ts,tsx}',
    'src/__tests__/integration/**/*.test.{ts,tsx}',
  ],
  e2e: ['tests/e2e/**/*.spec.{ts,tsx}'],
  accessibility: ['src/__tests__/accessibility/**/*.test.{ts,tsx}'],
  performance: ['src/__tests__/performance/**/*.test.{ts,tsx}'],
};

// Feature area mapping based on file paths
const FEATURE_MAPPING = {
  dashboard: ['dashboard', 'stat-cards', 'metrics'],
  teams: ['teams', 'people', 'roles'],
  projects: ['projects', 'epics', 'milestones'],
  planning: ['planning', 'allocation', 'capacity'],
  tracking: ['tracking', 'variance', 'iteration'],
  financials: ['financial', 'cost', 'budget'],
  canvas: ['canvas', 'visualization', 'graph'],
  skills: ['skills', 'competency', 'proficiency'],
  goals: ['goals', 'journey', 'objective'],
  scenarios: ['scenario', 'comparison', 'analysis'],
  settings: ['settings', 'config', 'import', 'export'],
  mobile: ['mobile', 'responsive', 'pwa'],
  core: ['app', 'context', 'utils', 'types'],
};

// CI tier classification
const CI_TIER_RULES = {
  lightning: testCase => {
    return (
      testCase.type === 'unit' &&
      testCase.priority === 'critical' &&
      !testCase.metadata.slow
    );
  },
  comprehensive: testCase => {
    return (
      testCase.type === 'integration' ||
      (testCase.type === 'unit' && testCase.priority !== 'low') ||
      (testCase.type === 'e2e' && testCase.priority === 'critical')
    );
  },
  quality: testCase => {
    return (
      testCase.type === 'e2e' ||
      testCase.type === 'accessibility' ||
      testCase.type === 'performance' ||
      testCase.priority === 'critical'
    );
  },
};

/**
 * Determine test type from file path
 */
function getTestType(filePath) {
  for (const [type, patterns] of Object.entries(TEST_PATTERNS)) {
    if (
      patterns.some(pattern => {
        const normalizedPattern = pattern.replace(/\{ts,tsx\}$/, '{ts,tsx}');
        return filePath.match(
          new RegExp(
            normalizedPattern
              .replace(/\*/g, '.*')
              .replace(/\{ts,tsx\}/, '(ts|tsx)')
          )
        );
      })
    ) {
      return type;
    }
  }
  return 'unit'; // default
}

/**
 * Determine feature area from file path and content
 */
function getFeatureArea(filePath, content) {
  const pathLower = filePath.toLowerCase();

  for (const [feature, keywords] of Object.entries(FEATURE_MAPPING)) {
    if (keywords.some(keyword => pathLower.includes(keyword))) {
      return feature;
    }
  }

  // Check content for feature keywords
  const contentLower = content.toLowerCase();
  for (const [feature, keywords] of Object.entries(FEATURE_MAPPING)) {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      return feature;
    }
  }

  return 'core'; // default
}

/**
 * Extract test metadata from file content
 */
function extractTestMetadata(content, filePath) {
  const metadata = {
    browser: [],
    viewport: [],
    requires: [],
    flaky: false,
    slow: false,
  };

  // Check for browser-specific tests
  if (content.includes('chromium') || content.includes('chrome'))
    metadata.browser.push('chromium');
  if (content.includes('firefox')) metadata.browser.push('firefox');
  if (content.includes('webkit') || content.includes('safari'))
    metadata.browser.push('webkit');

  // Check for viewport tests
  if (content.includes('setViewportSize') || content.includes('mobile')) {
    metadata.viewport.push('mobile');
  }
  if (content.includes('desktop')) metadata.viewport.push('desktop');

  // Check for external dependencies
  if (content.includes('@testing-library'))
    metadata.requires.push('testing-library');
  if (content.includes('playwright')) metadata.requires.push('playwright');
  if (content.includes('vitest')) metadata.requires.push('vitest');

  // Check for flaky indicators
  if (
    content.includes('test.skip') ||
    content.includes('it.skip') ||
    content.includes('flaky') ||
    content.includes('unstable')
  ) {
    metadata.flaky = true;
  }

  // Check for slow test indicators
  if (
    content.includes('test.slow') ||
    content.includes('timeout') ||
    content.includes('waitFor') ||
    content.includes('sleep')
  ) {
    metadata.slow = true;
  }

  return metadata;
}

/**
 * Determine test priority based on content and location
 */
function getTestPriority(content, filePath, testType) {
  const contentLower = content.toLowerCase();
  const pathLower = filePath.toLowerCase();

  // Critical tests
  if (
    contentLower.includes('critical') ||
    pathLower.includes('core') ||
    pathLower.includes('app.test') ||
    (testType === 'e2e' && contentLower.includes('smoke'))
  ) {
    return 'critical';
  }

  // High priority tests
  if (
    testType === 'integration' ||
    pathLower.includes('context') ||
    contentLower.includes('important') ||
    contentLower.includes('essential')
  ) {
    return 'high';
  }

  // Low priority tests
  if (
    contentLower.includes('edge case') ||
    contentLower.includes('optional') ||
    pathLower.includes('experimental')
  ) {
    return 'low';
  }

  return 'medium'; // default
}

/**
 * Extract test cases from a test file
 */
function extractTestCases(content, filePath) {
  const testCases = [];
  const type = getTestType(filePath);
  const featureArea = getFeatureArea(filePath, content);
  const metadata = extractTestMetadata(content, filePath);

  // Extract describe blocks and test cases
  const describeRegex = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const testRegex = /(test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g;

  let match;
  let currentDescribe = path.basename(filePath, path.extname(filePath));

  // Get describe block name
  const describeMatch = describeRegex.exec(content);
  if (describeMatch) {
    currentDescribe = describeMatch[1];
  }

  // Extract individual test cases
  while ((match = testRegex.exec(content)) !== null) {
    const testName = match[2];
    const priority = getTestPriority(content, filePath, type);

    const testCase = {
      id: `${path.relative(PROJECT_ROOT, filePath)}::${testName}`.replace(
        /[^a-zA-Z0-9]/g,
        '_'
      ),
      name: testName,
      filePath: path.relative(PROJECT_ROOT, filePath),
      type,
      category: getTestCategory(content, testName),
      featureArea,
      priority,
      status: metadata.flaky ? 'flaky' : 'active',
      ciTiers: [],
      description: `${currentDescribe} - ${testName}`,
      tags: extractTags(content, testName),
      estimatedDuration: estimateDuration(type, content),
      dependencies: [],
      maintainer: 'team', // Could be extracted from git blame
      lastModified: new Date().toISOString(),
      stability: metadata.flaky ? 0.7 : 0.95,
      coverage: {},
      metadata,
    };

    // Determine CI tiers
    Object.entries(CI_TIER_RULES).forEach(([tier, rule]) => {
      if (rule(testCase)) {
        testCase.ciTiers.push(tier);
      }
    });

    testCases.push(testCase);
  }

  return testCases;
}

/**
 * Get test category from content and test name
 */
function getTestCategory(content, testName) {
  const combined = (content + ' ' + testName).toLowerCase();

  if (combined.includes('component') || combined.includes('render'))
    return 'component';
  if (combined.includes('hook')) return 'hook';
  if (combined.includes('util') || combined.includes('helper'))
    return 'utility';
  if (combined.includes('context') || combined.includes('provider'))
    return 'context';
  if (combined.includes('workflow') || combined.includes('journey'))
    return 'workflow';
  if (combined.includes('api') || combined.includes('service')) return 'api';
  if (combined.includes('ui') || combined.includes('interface')) return 'ui';
  if (combined.includes('performance') || combined.includes('speed'))
    return 'performance';
  if (combined.includes('security') || combined.includes('auth'))
    return 'security';
  if (combined.includes('accessibility') || combined.includes('a11y'))
    return 'accessibility';

  return 'component'; // default
}

/**
 * Extract tags from test content
 */
function extractTags(content, testName) {
  const tags = [];
  const combined = (content + ' ' + testName).toLowerCase();

  if (combined.includes('async')) tags.push('async');
  if (combined.includes('mock')) tags.push('mocked');
  if (combined.includes('integration')) tags.push('integration');
  if (combined.includes('unit')) tags.push('unit');
  if (combined.includes('e2e')) tags.push('e2e');
  if (combined.includes('smoke')) tags.push('smoke');
  if (combined.includes('regression')) tags.push('regression');
  if (combined.includes('responsive')) tags.push('responsive');
  if (combined.includes('mobile')) tags.push('mobile');
  if (combined.includes('desktop')) tags.push('desktop');

  return tags;
}

/**
 * Estimate test duration based on type and content
 */
function estimateDuration(testType, content) {
  const contentLower = content.toLowerCase();

  let baseDuration =
    {
      unit: 100,
      integration: 500,
      e2e: 5000,
      accessibility: 1000,
      performance: 3000,
    }[testType] || 100;

  // Adjust based on content complexity
  if (contentLower.includes('timeout') || contentLower.includes('waitfor')) {
    baseDuration *= 2;
  }

  if (contentLower.includes('navigation') || contentLower.includes('page')) {
    baseDuration *= 1.5;
  }

  if (contentLower.includes('async') || contentLower.includes('promise')) {
    baseDuration *= 1.3;
  }

  return Math.round(baseDuration);
}

/**
 * Scan all test files and generate inventory
 */
async function generateTestInventory() {
  console.log('🔍 Scanning test files...');

  const allPatterns = Object.values(TEST_PATTERNS).flat();
  const testFiles = [];

  for (const pattern of allPatterns) {
    const files = await glob(pattern, { cwd: PROJECT_ROOT });
    testFiles.push(...files);
  }

  // Remove duplicates
  const uniqueTestFiles = [...new Set(testFiles)];

  console.log(`📁 Found ${uniqueTestFiles.length} test files`);

  const allTestCases = [];
  const testSuites = {};

  for (const filePath of uniqueTestFiles) {
    try {
      const fullPath = path.join(PROJECT_ROOT, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const testCases = extractTestCases(content, filePath);

      allTestCases.push(...testCases);

      // Group into suites by feature area
      testCases.forEach(testCase => {
        const suiteKey = `${testCase.featureArea}_${testCase.type}`;
        if (!testSuites[suiteKey]) {
          testSuites[suiteKey] = {
            id: suiteKey,
            name: `${testCase.featureArea} ${testCase.type} tests`,
            tests: [],
            type: testCase.type,
            featureArea: testCase.featureArea,
            enabled: true,
            ciConfig: {
              lightning: testCase.ciTiers.includes('lightning'),
              comprehensive: testCase.ciTiers.includes('comprehensive'),
              quality: testCase.ciTiers.includes('quality'),
            },
          };
        }
        testSuites[suiteKey].tests.push(testCase.id);
      });
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  console.log(`✅ Processed ${allTestCases.length} test cases`);

  // Generate test pyramid metrics
  const pyramidMetrics = calculatePyramidMetrics(allTestCases);

  // Create final inventory
  const inventory = {
    metadata: {
      generated: new Date().toISOString(),
      version: '1.0.0',
      totalTests: allTestCases.length,
      totalSuites: Object.keys(testSuites).length,
    },
    testCases: allTestCases,
    testSuites: Object.values(testSuites),
    pyramidMetrics,
    summary: {
      byType: getCountByProperty(allTestCases, 'type'),
      byFeature: getCountByProperty(allTestCases, 'featureArea'),
      byPriority: getCountByProperty(allTestCases, 'priority'),
      byStatus: getCountByProperty(allTestCases, 'status'),
    },
  };

  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(inventory, null, 2));
  console.log(`💾 Test inventory saved to ${OUTPUT_FILE}`);

  // Print summary
  printSummary(inventory);

  return inventory;
}

/**
 * Calculate test pyramid metrics
 */
function calculatePyramidMetrics(testCases) {
  const total = testCases.length;
  const byType = getCountByProperty(testCases, 'type');

  const unit = {
    count: byType.unit || 0,
    percentage: Math.round(((byType.unit || 0) / total) * 100),
    avgDuration: getAverageDuration(testCases.filter(t => t.type === 'unit')),
    stability: getAverageStability(testCases.filter(t => t.type === 'unit')),
  };

  const integration = {
    count: byType.integration || 0,
    percentage: Math.round(((byType.integration || 0) / total) * 100),
    avgDuration: getAverageDuration(
      testCases.filter(t => t.type === 'integration')
    ),
    stability: getAverageStability(
      testCases.filter(t => t.type === 'integration')
    ),
  };

  const e2e = {
    count: byType.e2e || 0,
    percentage: Math.round(((byType.e2e || 0) / total) * 100),
    avgDuration: getAverageDuration(testCases.filter(t => t.type === 'e2e')),
    stability: getAverageStability(testCases.filter(t => t.type === 'e2e')),
  };

  // Determine pyramid health (ideal: 70% unit, 20% integration, 10% e2e)
  let pyramidHealth = 'optimal';
  const recommendations = [];

  if (unit.percentage < 60) {
    pyramidHealth = 'warning';
    recommendations.push(
      'Increase unit test coverage - should be 60-80% of total tests'
    );
  }

  if (e2e.percentage > 20) {
    pyramidHealth = 'inverted';
    recommendations.push(
      'Reduce E2E test proportion - should be <20% of total tests'
    );
  }

  if (integration.percentage > 30) {
    pyramidHealth = 'warning';
    recommendations.push(
      'Consider converting some integration tests to unit tests'
    );
  }

  return {
    unit,
    integration,
    e2e,
    total,
    pyramidHealth,
    recommendations,
  };
}

/**
 * Helper functions
 */
function getCountByProperty(array, property) {
  return array.reduce((acc, item) => {
    const key = item[property];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function getAverageDuration(tests) {
  if (tests.length === 0) return 0;
  return Math.round(
    tests.reduce((sum, test) => sum + test.estimatedDuration, 0) / tests.length
  );
}

function getAverageStability(tests) {
  if (tests.length === 0) return 1;
  return (
    Math.round(
      (tests.reduce((sum, test) => sum + test.stability, 0) / tests.length) *
        100
    ) / 100
  );
}

function printSummary(inventory) {
  console.log('\n📊 Test Inventory Summary');
  console.log('========================');
  console.log(`Total Tests: ${inventory.metadata.totalTests}`);
  console.log(`Test Suites: ${inventory.metadata.totalSuites}`);
  console.log('\nBy Type:');
  Object.entries(inventory.summary.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\nTest Pyramid Health:', inventory.pyramidMetrics.pyramidHealth);
  console.log(`Unit: ${inventory.pyramidMetrics.unit.percentage}%`);
  console.log(
    `Integration: ${inventory.pyramidMetrics.integration.percentage}%`
  );
  console.log(`E2E: ${inventory.pyramidMetrics.e2e.percentage}%`);

  if (inventory.pyramidMetrics.recommendations.length > 0) {
    console.log('\nRecommendations:');
    inventory.pyramidMetrics.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTestInventory().catch(console.error);
}

export { generateTestInventory };
