import {
  TestConfiguration,
  TestSuite,
  TestCase,
  CITier,
  TestPyramidMetrics,
} from '@/types/testTypes';

/**
 * Test Configuration Manager
 * Handles loading, saving, and managing test configurations
 */
export class TestConfigManager {
  private config: TestConfiguration | null = null;
  private configPath = 'test-config.json';

  /**
   * Load test configuration from storage
   */
  async loadConfig(): Promise<TestConfiguration> {
    try {
      // In browser environment, use localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('test-configuration');
        if (stored) {
          this.config = JSON.parse(stored);
          return this.config!;
        }
      }

      // Return default configuration
      this.config = this.getDefaultConfig();
      return this.config;
    } catch (error) {
      console.error('Failed to load test configuration:', error);
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  /**
   * Save test configuration to storage
   */
  async saveConfig(config: TestConfiguration): Promise<void> {
    try {
      this.config = config;

      // In browser environment, use localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('test-configuration', JSON.stringify(config));
      }

      console.log('Test configuration saved successfully');
    } catch (error) {
      console.error('Failed to save test configuration:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): TestConfiguration {
    return this.config || this.getDefaultConfig();
  }

  /**
   * Update a specific test suite configuration
   */
  async updateTestSuite(
    suiteId: string,
    updates: Partial<TestSuite>
  ): Promise<void> {
    const config = this.getConfig();
    const suiteIndex = config.suites.findIndex(s => s.id === suiteId);

    if (suiteIndex === -1) {
      throw new Error(`Test suite ${suiteId} not found`);
    }

    config.suites[suiteIndex] = { ...config.suites[suiteIndex], ...updates };
    config.lastUpdated = new Date().toISOString();

    await this.saveConfig(config);
  }

  /**
   * Enable/disable test suite for specific CI tier
   */
  async toggleSuiteForTier(
    suiteId: string,
    tier: keyof TestSuite['ciConfig'],
    enabled: boolean
  ): Promise<void> {
    const config = this.getConfig();
    const suite = config.suites.find(s => s.id === suiteId);

    if (!suite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }

    suite.ciConfig[tier] = enabled;
    config.lastUpdated = new Date().toISOString();

    await this.saveConfig(config);
  }

  /**
   * Get tests for specific CI tier
   */
  getTestsForTier(tier: CITier): TestCase[] {
    const config = this.getConfig();
    const enabledSuites = config.suites.filter(suite => {
      switch (tier) {
        case 'lightning':
          return suite.ciConfig.lightning;
        case 'comprehensive':
          return suite.ciConfig.comprehensive;
        case 'quality':
          return suite.ciConfig.quality;
        case 'all':
          return true;
        default:
          return false;
      }
    });

    // This would need to be populated with actual test data
    // For now, return empty array - would be populated by test inventory
    return [];
  }

  /**
   * Generate CI configuration for different tiers
   */
  generateCIConfig(tier: CITier) {
    const config = this.getConfig();
    const tierConfig = config.ciConfig[tier as keyof typeof config.ciConfig];

    if (!tierConfig) {
      throw new Error(`Invalid CI tier: ${tier}`);
    }

    return {
      timeout: tierConfig.timeout,
      retries: tierConfig.retries,
      parallel: tierConfig.parallel,
      maxWorkers: tierConfig.maxWorkers,
      include: tierConfig.include,
      exclude: tierConfig.exclude,
      testPattern: this.getTestPatternForTier(tier),
    };
  }

  /**
   * Get test file patterns for specific CI tier
   */
  private getTestPatternForTier(tier: CITier): string[] {
    const config = this.getConfig();
    const enabledSuites = config.suites.filter(suite => {
      switch (tier) {
        case 'lightning':
          return suite.ciConfig.lightning;
        case 'comprehensive':
          return suite.ciConfig.comprehensive;
        case 'quality':
          return suite.ciConfig.quality;
        case 'all':
          return true;
        default:
          return false;
      }
    });

    // Generate patterns based on enabled suites
    const patterns: string[] = [];

    enabledSuites.forEach(suite => {
      switch (suite.type) {
        case 'unit':
          patterns.push('src/**/*.test.{ts,tsx}');
          break;
        case 'integration':
          patterns.push('src/__tests__/integration/**/*.test.{ts,tsx}');
          break;
        case 'e2e':
          patterns.push('tests/e2e/**/*.spec.{ts,tsx}');
          break;
        case 'accessibility':
          patterns.push('src/__tests__/accessibility/**/*.test.{ts,tsx}');
          break;
        case 'performance':
          patterns.push('src/__tests__/performance/**/*.test.{ts,tsx}');
          break;
      }
    });

    return [...new Set(patterns)]; // Remove duplicates
  }

  /**
   * Validate test pyramid compliance
   */
  validatePyramid(metrics: TestPyramidMetrics): {
    isValid: boolean;
    violations: string[];
  } {
    const config = this.getConfig();
    const violations: string[] = [];

    // Check unit test percentage
    if (metrics.unit.percentage < config.pyramidTargets.unit.min) {
      violations.push(
        `Unit tests below minimum: ${metrics.unit.percentage}% < ${config.pyramidTargets.unit.min}%`
      );
    }
    if (metrics.unit.percentage > config.pyramidTargets.unit.max) {
      violations.push(
        `Unit tests above maximum: ${metrics.unit.percentage}% > ${config.pyramidTargets.unit.max}%`
      );
    }

    // Check integration test percentage
    if (
      metrics.integration.percentage < config.pyramidTargets.integration.min
    ) {
      violations.push(
        `Integration tests below minimum: ${metrics.integration.percentage}% < ${config.pyramidTargets.integration.min}%`
      );
    }
    if (
      metrics.integration.percentage > config.pyramidTargets.integration.max
    ) {
      violations.push(
        `Integration tests above maximum: ${metrics.integration.percentage}% > ${config.pyramidTargets.integration.max}%`
      );
    }

    // Check E2E test percentage
    if (metrics.e2e.percentage < config.pyramidTargets.e2e.min) {
      violations.push(
        `E2E tests below minimum: ${metrics.e2e.percentage}% < ${config.pyramidTargets.e2e.min}%`
      );
    }
    if (metrics.e2e.percentage > config.pyramidTargets.e2e.max) {
      violations.push(
        `E2E tests above maximum: ${metrics.e2e.percentage}% > ${config.pyramidTargets.e2e.max}%`
      );
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Get recommended test distribution
   */
  getRecommendedDistribution(totalTests: number) {
    const config = this.getConfig();

    return {
      unit: {
        target: Math.round(
          (totalTests * config.pyramidTargets.unit.target) / 100
        ),
        percentage: config.pyramidTargets.unit.target,
      },
      integration: {
        target: Math.round(
          (totalTests * config.pyramidTargets.integration.target) / 100
        ),
        percentage: config.pyramidTargets.integration.target,
      },
      e2e: {
        target: Math.round(
          (totalTests * config.pyramidTargets.e2e.target) / 100
        ),
        percentage: config.pyramidTargets.e2e.target,
      },
    };
  }

  /**
   * Export configuration for CI/CD systems
   */
  exportForCI(tier: CITier): string {
    const config = this.generateCIConfig(tier);

    // Generate different formats based on needs
    return JSON.stringify(
      {
        testPathPatterns: config.testPattern,
        testTimeout: config.timeout,
        maxWorkers: config.maxWorkers,
        retries: config.retries,
        verbose: tier === 'quality',
        coverage: tier === 'quality',
        parallel: config.parallel,
      },
      null,
      2
    );
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): TestConfiguration {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      suites: [], // Will be populated by inventory
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
        stability: {
          minimum: 0.9,
          critical: 0.95,
        },
        performance: {
          unitMaxDuration: 1000,
          integrationMaxDuration: 5000,
          e2eMaxDuration: 30000,
        },
      },
    };
  }
}

// Export singleton instance
export const testConfigManager = new TestConfigManager();
