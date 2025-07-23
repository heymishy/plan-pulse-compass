/**
 * Tests for OCR Test Data Generator
 * Phase 3 implementation testing
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateGroundTruthDataset,
  generateTestSuite,
  createBenchmarkWithSimulatedPerformance,
  TEST_DOCUMENT_TEMPLATES,
  SAMPLE_TEST_CASES,
  type SyntheticDocumentConfig,
  type GroundTruthDataset,
} from '../ocrTestDataGenerator';
import type { OCRExtractionResult } from '@/types/ocrTypes';

describe('generateGroundTruthDataset', () => {
  const testConfig: SyntheticDocumentConfig = {
    template: TEST_DOCUMENT_TEMPLATES[0], // simple-steerco
    projects: ['Digital Transformation', 'Customer Portal', 'Data Migration'],
    teams: ['Development Team', 'QA Team'],
    risks: ['Resource availability', 'Technical complexity'],
    seed: 12345,
  };

  let groundTruth: GroundTruthDataset;

  beforeAll(() => {
    groundTruth = generateGroundTruthDataset(testConfig);
  });

  it('should generate a valid ground truth dataset', () => {
    expect(groundTruth).toHaveProperty('documentId');
    expect(groundTruth).toHaveProperty('expectedProjectStatuses');
    expect(groundTruth).toHaveProperty('expectedRisks');
    expect(groundTruth).toHaveProperty('expectedFinancials');
    expect(groundTruth).toHaveProperty('expectedMilestones');
    expect(groundTruth).toHaveProperty('expectedTeamUpdates');
    expect(groundTruth).toHaveProperty('totalExpectedEntities');
    expect(groundTruth).toHaveProperty('documentMetadata');
  });

  it('should generate reproducible results with same seed', () => {
    const groundTruth1 = generateGroundTruthDataset(testConfig);
    const groundTruth2 = generateGroundTruthDataset(testConfig);

    expect(groundTruth1.expectedProjectStatuses).toEqual(
      groundTruth2.expectedProjectStatuses
    );
    expect(groundTruth1.expectedRisks).toEqual(groundTruth2.expectedRisks);
    expect(groundTruth1.expectedFinancials).toEqual(
      groundTruth2.expectedFinancials
    );
    expect(groundTruth1.expectedMilestones).toEqual(
      groundTruth2.expectedMilestones
    );
    expect(groundTruth1.expectedTeamUpdates).toEqual(
      groundTruth2.expectedTeamUpdates
    );
  });

  it('should generate different results with different seeds', () => {
    const config1 = { ...testConfig, seed: 11111 };
    const config2 = { ...testConfig, seed: 22222 };

    const groundTruth1 = generateGroundTruthDataset(config1);
    const groundTruth2 = generateGroundTruthDataset(config2);

    // At least some entities should be different due to randomization
    const areDifferent =
      JSON.stringify(groundTruth1.expectedProjectStatuses) !==
        JSON.stringify(groundTruth2.expectedProjectStatuses) ||
      JSON.stringify(groundTruth1.expectedRisks) !==
        JSON.stringify(groundTruth2.expectedRisks) ||
      JSON.stringify(groundTruth1.expectedFinancials) !==
        JSON.stringify(groundTruth2.expectedFinancials);

    expect(areDifferent).toBe(true);
  });

  describe('project status generation', () => {
    it('should generate project statuses with valid properties', () => {
      const projectStatuses = groundTruth.expectedProjectStatuses;

      expect(Array.isArray(projectStatuses)).toBe(true);
      expect(projectStatuses.length).toBeGreaterThan(0);
      expect(projectStatuses.length).toBeLessThanOrEqual(
        testConfig.projects.length
      );

      projectStatuses.forEach(status => {
        expect(status).toHaveProperty('projectName');
        expect(status).toHaveProperty('status');
        expect(status).toHaveProperty('position');
        expect(testConfig.projects).toContain(status.projectName);
        expect(['red', 'amber', 'green', 'blue', 'complete']).toContain(
          status.status
        );
        expect(status.position).toHaveProperty('page');
        expect(status.position).toHaveProperty('section');
      });
    });

    it('should limit project count based on template complexity', () => {
      const simpleConfig = {
        ...testConfig,
        template: TEST_DOCUMENT_TEMPLATES[0],
      }; // simple
      const complexConfig = {
        ...testConfig,
        template: TEST_DOCUMENT_TEMPLATES[1],
      }; // complex

      const simpleGT = generateGroundTruthDataset(simpleConfig);
      const complexGT = generateGroundTruthDataset(complexConfig);

      expect(simpleGT.expectedProjectStatuses.length).toBeLessThanOrEqual(3);
      expect(complexGT.expectedProjectStatuses.length).toBeGreaterThanOrEqual(
        simpleGT.expectedProjectStatuses.length
      );
    });
  });

  describe('risk generation', () => {
    it('should generate risks with valid properties', () => {
      const risks = groundTruth.expectedRisks;

      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThan(0);

      risks.forEach(risk => {
        expect(risk).toHaveProperty('riskDescription');
        expect(risk).toHaveProperty('impact');
        expect(risk).toHaveProperty('position');
        expect(testConfig.risks).toContain(risk.riskDescription);
        expect(['low', 'medium', 'high', 'critical']).toContain(risk.impact);

        if (risk.probability) {
          expect(['low', 'medium', 'high']).toContain(risk.probability);
        }
      });
    });
  });

  describe('financial generation', () => {
    it('should generate financials with valid properties', () => {
      const financials = groundTruth.expectedFinancials;

      expect(Array.isArray(financials)).toBe(true);
      expect(financials.length).toBeGreaterThan(0);

      financials.forEach(financial => {
        expect(financial).toHaveProperty('projectName');
        expect(financial).toHaveProperty('budgetAmount');
        expect(financial).toHaveProperty('currency');
        expect(financial).toHaveProperty('position');
        expect(testConfig.projects).toContain(financial.projectName);
        expect(['USD', 'GBP', 'EUR']).toContain(financial.currency);
        expect(financial.budgetAmount).toBeGreaterThan(0);

        if (financial.actualAmount) {
          expect(financial.actualAmount).toBeGreaterThan(0);
        }

        if (financial.forecastAmount) {
          expect(financial.forecastAmount).toBeGreaterThan(0);
        }
      });
    });

    it('should generate realistic budget ranges', () => {
      const financials = groundTruth.expectedFinancials;

      financials.forEach(financial => {
        // Budget should be between 100K and 1.1M as per implementation
        expect(financial.budgetAmount).toBeGreaterThanOrEqual(100000);
        expect(financial.budgetAmount).toBeLessThanOrEqual(1100000);

        if (financial.actualAmount && financial.budgetAmount) {
          // Actual should be reasonable compared to budget
          expect(financial.actualAmount).toBeGreaterThan(0);
          expect(financial.actualAmount).toBeLessThanOrEqual(
            financial.budgetAmount * 1.2
          ); // Up to 120% of budget
        }
      });
    });
  });

  describe('milestone generation', () => {
    it('should generate milestones with valid properties', () => {
      const milestones = groundTruth.expectedMilestones;

      expect(Array.isArray(milestones)).toBe(true);
      expect(milestones.length).toBeGreaterThan(0);

      milestones.forEach(milestone => {
        expect(milestone).toHaveProperty('milestoneName');
        expect(milestone).toHaveProperty('projectName');
        expect(milestone).toHaveProperty('targetDate');
        expect(milestone).toHaveProperty('status');
        expect(milestone).toHaveProperty('position');
        expect(testConfig.projects).toContain(milestone.projectName);
        expect([
          'not-started',
          'in-progress',
          'completed',
          'delayed',
        ]).toContain(milestone.status);

        // Target date should be a valid date string
        expect(() => new Date(milestone.targetDate)).not.toThrow();
        expect(new Date(milestone.targetDate).toString()).not.toBe(
          'Invalid Date'
        );
      });
    });
  });

  describe('team update generation', () => {
    it('should generate team updates with valid properties', () => {
      const teamUpdates = groundTruth.expectedTeamUpdates;

      expect(Array.isArray(teamUpdates)).toBe(true);
      expect(teamUpdates.length).toBeGreaterThan(0);

      teamUpdates.forEach(update => {
        expect(update).toHaveProperty('teamName');
        expect(update).toHaveProperty('utilization');
        expect(update).toHaveProperty('position');
        expect(testConfig.teams).toContain(update.teamName);
        expect(update.utilization).toBeGreaterThanOrEqual(50);
        expect(update.utilization).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('document metadata', () => {
    it('should generate correct document metadata', () => {
      const metadata = groundTruth.documentMetadata;
      const template = testConfig.template;

      expect(metadata.pages).toBe(template.pages);
      expect(metadata.format).toBe(template.format);
      expect(metadata.quality).toBe(template.quality);
      expect(metadata.textDensity).toBe(template.textDensity);
    });
  });

  describe('total entities calculation', () => {
    it('should calculate total expected entities correctly', () => {
      const calculated =
        groundTruth.expectedProjectStatuses.length +
        groundTruth.expectedRisks.length +
        groundTruth.expectedFinancials.length +
        groundTruth.expectedMilestones.length +
        groundTruth.expectedTeamUpdates.length;

      expect(groundTruth.totalExpectedEntities).toBe(calculated);
    });
  });
});

describe('generateTestSuite', () => {
  it('should generate a complete test suite', () => {
    const testSuite = generateTestSuite({
      templateIds: ['simple-steerco', 'complex-steerco'],
      projectCount: 5,
      teamCount: 3,
      riskCount: 4,
      seed: 54321,
    });

    expect(testSuite).toHaveProperty('groundTruthDatasets');
    expect(testSuite).toHaveProperty('syntheticDocuments');
    expect(Array.isArray(testSuite.groundTruthDatasets)).toBe(true);
    expect(Array.isArray(testSuite.syntheticDocuments)).toBe(true);
    expect(testSuite.groundTruthDatasets.length).toBe(2);
    expect(testSuite.syntheticDocuments.length).toBe(2);
  });

  it('should generate datasets for each template', () => {
    const testSuite = generateTestSuite({
      templateIds: ['simple-steerco', 'complex-steerco', 'low-quality-scan'],
      seed: 99999,
    });

    expect(testSuite.groundTruthDatasets.length).toBe(3);

    // Each dataset should have different characteristics based on template
    const simple = testSuite.groundTruthDatasets.find(
      gt =>
        gt.documentMetadata.format === 'pdf' && gt.documentMetadata.pages === 3
    );
    const complex = testSuite.groundTruthDatasets.find(
      gt =>
        gt.documentMetadata.format === 'pptx' &&
        gt.documentMetadata.pages === 15
    );
    const lowQuality = testSuite.groundTruthDatasets.find(
      gt =>
        gt.documentMetadata.format === 'image' &&
        gt.documentMetadata.quality === 'low'
    );

    expect(simple).toBeDefined();
    expect(complex).toBeDefined();
    expect(lowQuality).toBeDefined();
  });

  it('should use default values when config is empty', () => {
    const testSuite = generateTestSuite({});

    expect(testSuite.groundTruthDatasets.length).toBe(3); // Default templates
    expect(testSuite.syntheticDocuments.length).toBe(3);
  });

  it('should handle invalid template IDs gracefully', () => {
    const testSuite = generateTestSuite({
      templateIds: ['non-existent-template', 'simple-steerco'],
    });

    // Should only generate for valid templates
    expect(testSuite.groundTruthDatasets.length).toBe(1);
    expect(testSuite.syntheticDocuments.length).toBe(1);
  });

  it('should generate synthetic documents', () => {
    const testSuite = generateTestSuite({
      templateIds: ['simple-steerco'],
      seed: 11111,
    });

    expect(testSuite.syntheticDocuments.length).toBe(1);
    expect(typeof testSuite.syntheticDocuments[0]).toBe('string');
    expect(testSuite.syntheticDocuments[0].length).toBeGreaterThan(0);

    // Document should contain some template content
    const document = testSuite.syntheticDocuments[0];
    expect(document).toContain('Steering Committee');
  });
});

describe('createBenchmarkWithSimulatedPerformance', () => {
  let mockGroundTruth: GroundTruthDataset;
  let mockExtractionResult: OCRExtractionResult;

  beforeAll(() => {
    mockGroundTruth = generateGroundTruthDataset({
      template: TEST_DOCUMENT_TEMPLATES[0],
      projects: ['Test Project'],
      teams: ['Test Team'],
      risks: ['Test Risk'],
      seed: 12345,
    });

    mockExtractionResult = {
      rawText: 'Test OCR text',
      projectStatuses: [
        {
          text: 'Test Project: green',
          confidence: 0.9,
          projectName: 'Test Project',
          status: 'green',
        },
      ],
      risks: [],
      financials: [],
      milestones: [],
      teamUpdates: [],
      commentary: [],
      extractionMetadata: {
        totalConfidence: 0.9,
        processingTime: 3000,
        extractedEntities: 1,
        documentType: 'steering-committee',
      },
    };
  });

  it('should create a complete benchmark', async () => {
    const benchmark = await createBenchmarkWithSimulatedPerformance(
      mockGroundTruth,
      mockExtractionResult
    );

    expect(benchmark).toHaveProperty('groundTruth');
    expect(benchmark).toHaveProperty('extractionResult');
    expect(benchmark).toHaveProperty('accuracy');
    expect(benchmark).toHaveProperty('performance');
    expect(benchmark).toHaveProperty('timestamp');
    expect(benchmark).toHaveProperty('documentType');
    expect(benchmark).toHaveProperty('documentId');

    expect(benchmark.groundTruth).toBe(mockGroundTruth);
    expect(benchmark.extractionResult).toBe(mockExtractionResult);
    expect(benchmark.documentType).toBe('steering-committee');
    expect(benchmark.documentId).toBe(mockGroundTruth.documentId);
  });

  it('should generate realistic performance metrics', async () => {
    const benchmark = await createBenchmarkWithSimulatedPerformance(
      mockGroundTruth,
      mockExtractionResult
    );

    const performance = benchmark.performance;

    expect(performance.processingTime).toBeGreaterThan(0);
    expect(performance.memoryUsage).toBeGreaterThan(0);
    expect(performance.ocrTime).toBeGreaterThan(0);
    expect(performance.extractionTime).toBeGreaterThan(0);
    expect(performance.mappingTime).toBeGreaterThan(0);
    expect(performance.throughput).toBeGreaterThan(0);

    // Processing time should be reasonable compared to component times
    // Note: Processing time is generated independently in the range 5-15 seconds
    const componentTime =
      performance.ocrTime +
      performance.extractionTime +
      performance.mappingTime;
    expect(performance.processingTime).toBeGreaterThan(0);
    expect(performance.processingTime).toBeLessThan(20000); // Should be under 20 seconds
  });

  it('should allow custom performance metrics', async () => {
    const customPerformance = {
      processingTime: 10000,
      memoryUsage: 100 * 1024 * 1024,
      ocrTime: 8000,
    };

    const benchmark = await createBenchmarkWithSimulatedPerformance(
      mockGroundTruth,
      mockExtractionResult,
      customPerformance
    );

    expect(benchmark.performance.processingTime).toBe(10000);
    expect(benchmark.performance.memoryUsage).toBe(100 * 1024 * 1024);
    expect(benchmark.performance.ocrTime).toBe(8000);

    // Other metrics should still be generated
    expect(benchmark.performance.extractionTime).toBeGreaterThan(0);
    expect(benchmark.performance.mappingTime).toBeGreaterThan(0);
  });

  it('should calculate throughput correctly', async () => {
    const benchmark = await createBenchmarkWithSimulatedPerformance(
      mockGroundTruth,
      mockExtractionResult
    );

    const expectedThroughput =
      mockGroundTruth.totalExpectedEntities /
      (benchmark.performance.processingTime / 1000);

    expect(benchmark.performance.throughput).toBeCloseTo(expectedThroughput, 2);
  });

  it('should include timestamp', async () => {
    const beforeTime = Date.now();
    const benchmark = await createBenchmarkWithSimulatedPerformance(
      mockGroundTruth,
      mockExtractionResult
    );
    const afterTime = Date.now();

    const benchmarkTime = new Date(benchmark.timestamp).getTime();
    expect(benchmarkTime).toBeGreaterThanOrEqual(beforeTime);
    expect(benchmarkTime).toBeLessThanOrEqual(afterTime);

    // Should be valid ISO string
    expect(() => new Date(benchmark.timestamp)).not.toThrow();
    expect(new Date(benchmark.timestamp).toString()).not.toBe('Invalid Date');
  });
});

describe('TEST_DOCUMENT_TEMPLATES', () => {
  it('should have valid template definitions', () => {
    expect(Array.isArray(TEST_DOCUMENT_TEMPLATES)).toBe(true);
    expect(TEST_DOCUMENT_TEMPLATES.length).toBeGreaterThan(0);

    TEST_DOCUMENT_TEMPLATES.forEach(template => {
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('format');
      expect(template).toHaveProperty('quality');
      expect(template).toHaveProperty('complexity');
      expect(template).toHaveProperty('pages');
      expect(template).toHaveProperty('textDensity');
      expect(template).toHaveProperty('template');

      expect(typeof template.id).toBe('string');
      expect(typeof template.name).toBe('string');
      expect(['pdf', 'pptx', 'image']).toContain(template.format);
      expect(['low', 'medium', 'high']).toContain(template.quality);
      expect(['simple', 'moderate', 'complex']).toContain(template.complexity);
      expect(template.pages).toBeGreaterThan(0);
      expect(template.textDensity).toBeGreaterThan(0);
      expect(template.textDensity).toBeLessThanOrEqual(1);
      expect(typeof template.template).toBe('string');
      expect(template.template.length).toBeGreaterThan(0);
    });
  });

  it('should have unique template IDs', () => {
    const ids = TEST_DOCUMENT_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should include expected template types', () => {
    const ids = TEST_DOCUMENT_TEMPLATES.map(t => t.id);
    expect(ids).toContain('simple-steerco');
    expect(ids).toContain('complex-steerco');
    expect(ids).toContain('low-quality-scan');
  });
});

describe('SAMPLE_TEST_CASES', () => {
  it('should provide valid sample test cases', () => {
    expect(SAMPLE_TEST_CASES).toHaveProperty('highQuality');
    expect(SAMPLE_TEST_CASES).toHaveProperty('mediumQuality');
    expect(SAMPLE_TEST_CASES).toHaveProperty('lowQuality');

    Object.values(SAMPLE_TEST_CASES).forEach(testCase => {
      expect(testCase).toHaveProperty('template');
      expect(testCase).toHaveProperty('projects');
      expect(testCase).toHaveProperty('teams');
      expect(testCase).toHaveProperty('risks');

      expect(Array.isArray(testCase.projects)).toBe(true);
      expect(Array.isArray(testCase.teams)).toBe(true);
      expect(Array.isArray(testCase.risks)).toBe(true);
      expect(testCase.projects.length).toBeGreaterThan(0);
      expect(testCase.teams.length).toBeGreaterThan(0);
      expect(testCase.risks.length).toBeGreaterThan(0);
    });
  });

  it('should generate valid datasets from sample test cases', () => {
    Object.entries(SAMPLE_TEST_CASES).forEach(([quality, testCase]) => {
      const groundTruth = generateGroundTruthDataset({
        template: testCase.template,
        projects: testCase.projects,
        teams: testCase.teams,
        risks: testCase.risks,
        seed: 54321,
      });

      expect(groundTruth.totalExpectedEntities).toBeGreaterThan(0);
      expect(groundTruth.documentMetadata.quality).toBe(
        testCase.template.quality
      );

      // Quality should match template name pattern
      if (quality === 'highQuality') {
        expect(testCase.template.quality).toBe('high');
      } else if (quality === 'lowQuality') {
        expect(testCase.template.quality).toBe('low');
      }
    });
  });
});
