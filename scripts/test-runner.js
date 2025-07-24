#!/usr/bin/env node
/**
 * Advanced test runner with parallelization and optimization
 * Implements test pyramid execution strategy
 */

const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.cpuCount = os.cpus().length;
    this.maxParallelTests = Math.min(
      4,
      Math.max(1, Math.floor(this.cpuCount / 2))
    );
    this.testResults = {
      unit: null,
      integration: null,
      e2e: null,
    };
    this.totalStartTime = Date.now();
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      console.log(`🚀 Running: ${command} ${args.join(' ')}`);

      const proc = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options,
      });

      proc.on('close', code => {
        const duration = Date.now() - startTime;
        console.log(`⏱️  Completed in ${duration}ms with exit code ${code}`);

        if (code === 0) {
          resolve({ code, duration });
        } else {
          reject({ code, duration });
        }
      });

      proc.on('error', error => {
        reject({ error, duration: Date.now() - startTime });
      });
    });
  }

  async runUnitTests() {
    console.log('\n📋 Running Unit Tests (70% of test pyramid)');
    console.log('─'.repeat(50));

    try {
      const result = await this.runCommand('npm', ['run', 'test:unit']);
      this.testResults.unit = { passed: true, ...result };
      console.log('✅ Unit tests passed');
      return true;
    } catch (error) {
      this.testResults.unit = { passed: false, ...error };
      console.log('❌ Unit tests failed');
      return false;
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests (25% of test pyramid)');
    console.log('─'.repeat(50));

    try {
      const result = await this.runCommand('npm', ['run', 'test:integration']);
      this.testResults.integration = { passed: true, ...result };
      console.log('✅ Integration tests passed');
      return true;
    } catch (error) {
      this.testResults.integration = { passed: false, ...error };
      console.log('❌ Integration tests failed');
      return false;
    }
  }

  async runE2ETests() {
    console.log('\n🌐 Running E2E Tests (5% of test pyramid)');
    console.log('─'.repeat(50));

    try {
      const result = await this.runCommand('npm', ['run', 'test:e2e']);
      this.testResults.e2e = { passed: true, ...result };
      console.log('✅ E2E tests passed');
      return true;
    } catch (error) {
      this.testResults.e2e = { passed: false, ...error };
      console.log('❌ E2E tests failed');
      return false;
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests');
    console.log('─'.repeat(50));

    try {
      const result = await this.runCommand('npm', ['run', 'test:performance']);
      console.log('✅ Performance tests passed');
      return true;
    } catch (error) {
      console.log('❌ Performance tests failed');
      return false;
    }
  }

  async runParallelTests() {
    console.log('\n🚀 Running Tests in Parallel');
    console.log(`💻 Using ${this.maxParallelTests} parallel workers`);
    console.log('─'.repeat(50));

    const testPromises = [];

    // Run unit and integration tests in parallel (they're isolated)
    testPromises.push(
      this.runUnitTests().catch(() => false),
      this.runIntegrationTests().catch(() => false)
    );

    const [unitResult, integrationResult] = await Promise.all(testPromises);

    // Only run E2E if unit and integration pass
    let e2eResult = true;
    if (unitResult && integrationResult) {
      e2eResult = await this.runE2ETests();
    } else {
      console.log('⏭️  Skipping E2E tests due to earlier failures');
    }

    return unitResult && integrationResult && e2eResult;
  }

  async runSequentialTests() {
    console.log('\n📋 Running Tests Sequentially (Test Pyramid)');
    console.log('─'.repeat(50));

    // Follow test pyramid: Unit → Integration → E2E
    const unitResult = await this.runUnitTests();
    if (!unitResult) {
      console.log('🛑 Stopping due to unit test failures');
      return false;
    }

    const integrationResult = await this.runIntegrationTests();
    if (!integrationResult) {
      console.log('🛑 Stopping due to integration test failures');
      return false;
    }

    const e2eResult = await this.runE2ETests();
    return e2eResult;
  }

  generateReport() {
    const totalDuration = Date.now() - this.totalStartTime;
    const totalSeconds = Math.round(totalDuration / 1000);

    console.log('\n📊 Test Execution Report');
    console.log('═'.repeat(50));

    Object.entries(this.testResults).forEach(([testType, result]) => {
      if (result) {
        const status = result.passed ? '✅ PASSED' : '❌ FAILED';
        const duration = result.duration
          ? `${Math.round(result.duration / 1000)}s`
          : 'N/A';
        console.log(
          `${testType.toUpperCase().padEnd(12)} ${status} (${duration})`
        );
      }
    });

    console.log('─'.repeat(50));
    console.log(`⏱️  Total execution time: ${totalSeconds}s`);
    console.log(
      `💻 System: ${this.cpuCount} CPUs, ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB RAM`
    );

    const allPassed = Object.values(this.testResults).every(
      r => !r || r.passed
    );
    console.log(
      `🎯 Overall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`
    );

    return allPassed;
  }

  async run(mode = 'pyramid') {
    console.log('🧪 Plan Pulse Compass - Advanced Test Runner');
    console.log(`🏗️  Test Pyramid Strategy (Mode: ${mode})`);
    console.log('═'.repeat(50));

    let success = false;

    switch (mode) {
      case 'parallel':
        success = await this.runParallelTests();
        break;
      case 'performance':
        success = await this.runPerformanceTests();
        break;
      case 'unit':
        success = await this.runUnitTests();
        break;
      case 'integration':
        success = await this.runIntegrationTests();
        break;
      case 'e2e':
        success = await this.runE2ETests();
        break;
      case 'pyramid':
      default:
        success = await this.runSequentialTests();
        break;
    }

    const reportSuccess = this.generateReport();

    // Exit with appropriate code
    process.exit(success && reportSuccess ? 0 : 1);
  }
}

// CLI interface
const mode = process.argv[2] || 'pyramid';
const validModes = [
  'pyramid',
  'parallel',
  'performance',
  'unit',
  'integration',
  'e2e',
];

if (!validModes.includes(mode)) {
  console.error(`❌ Invalid mode: ${mode}`);
  console.error(`Valid modes: ${validModes.join(', ')}`);
  process.exit(1);
}

const runner = new TestRunner();
runner.run(mode).catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
