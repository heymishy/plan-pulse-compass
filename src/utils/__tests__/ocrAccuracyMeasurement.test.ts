/**
 * Tests for OCR Accuracy Measurement utilities
 * Phase 3 implementation testing
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  calculateAccuracyMetrics,
  generateBenchmarkReport,
  type GroundTruthDataset,
  type AccuracyBenchmark,
  type AccuracyMetrics,
  type EntityAccuracy,
} from '../ocrAccuracyMeasurement';
import type { OCRExtractionResult } from '@/types/ocrTypes';

// Mock data for testing
const mockGroundTruth: GroundTruthDataset = {
  documentId: 'test-doc-1',
  expectedProjectStatuses: [
    {
      projectName: 'Digital Transformation',
      status: 'green',
      ragReason: 'On track with all deliverables',
      position: { page: 1, section: 'Project Status' },
    },
    {
      projectName: 'Customer Portal',
      status: 'amber',
      ragReason: 'Minor delays in testing',
      position: { page: 1, section: 'Project Status' },
    },
    {
      projectName: 'Data Migration',
      status: 'red',
      ragReason: 'Critical blocker identified',
      position: { page: 1, section: 'Project Status' },
    },
  ],
  expectedRisks: [
    {
      riskDescription: 'Resource availability during peak season',
      impact: 'high',
      probability: 'medium',
      mitigation: 'Identify backup resources',
      position: { page: 2, section: 'Risks' },
    },
    {
      riskDescription: 'Third-party API integration complexity',
      impact: 'medium',
      probability: 'high',
      mitigation: 'Technical spike to assess complexity',
      position: { page: 2, section: 'Risks' },
    },
  ],
  expectedFinancials: [
    {
      projectName: 'Digital Transformation',
      budgetAmount: 500000,
      actualAmount: 350000,
      forecastAmount: 480000,
      currency: 'USD',
      position: { page: 3, section: 'Financials' },
    },
    {
      projectName: 'Customer Portal',
      budgetAmount: 200000,
      actualAmount: 150000,
      forecastAmount: 190000,
      currency: 'USD',
      position: { page: 3, section: 'Financials' },
    },
  ],
  expectedMilestones: [
    {
      milestoneName: 'Design Complete',
      projectName: 'Digital Transformation',
      targetDate: '2024-08-15',
      status: 'completed',
      position: { page: 4, section: 'Milestones' },
    },
    {
      milestoneName: 'Testing Phase',
      projectName: 'Customer Portal',
      targetDate: '2024-09-30',
      status: 'in-progress',
      position: { page: 4, section: 'Milestones' },
    },
  ],
  expectedTeamUpdates: [
    {
      teamName: 'Development Team',
      utilization: 85,
      commentary: 'Focused on critical deliverables',
      position: { page: 5, section: 'Team Updates' },
    },
    {
      teamName: 'QA Team',
      utilization: 75,
      position: { page: 5, section: 'Team Updates' },
    },
  ],
  totalExpectedEntities: 11,
  documentMetadata: {
    pages: 5,
    format: 'pdf',
    quality: 'high',
    textDensity: 0.8,
  },
};

const mockExtractionResult: OCRExtractionResult = {
  rawText: 'Sample OCR extracted text...',
  projectStatuses: [
    {
      text: 'Digital Transformation: green',
      confidence: 0.9,
      projectName: 'Digital Transformation',
      status: 'green',
      ragReason: 'On track with all deliverables',
    },
    {
      text: 'Customer Portal: amber',
      confidence: 0.8,
      projectName: 'Customer Portal',
      status: 'amber',
      ragReason: 'Minor delays in testing',
    },
    // Missing 'Data Migration' project (false negative)
    {
      text: 'New Project: blue',
      confidence: 0.7,
      projectName: 'New Project',
      status: 'blue',
    }, // False positive
  ],
  risks: [
    {
      text: 'Resource availability risk',
      confidence: 0.85,
      riskDescription: 'Resource availability during peak season',
      impact: 'high',
      probability: 'medium',
      mitigation: 'Identify backup resources',
    },
    // Missing second risk (false negative)
  ],
  financials: [
    {
      text: 'Digital Transformation budget: $500,000',
      confidence: 0.9,
      projectName: 'Digital Transformation',
      budgetAmount: 500000,
      actualAmount: 350000,
      forecastAmount: 480000,
      currency: 'USD',
    },
    {
      text: 'Customer Portal budget: $200,000',
      confidence: 0.85,
      projectName: 'Customer Portal',
      budgetAmount: 200000,
      actualAmount: 150000,
      forecastAmount: 190000,
      currency: 'USD',
    },
  ],
  milestones: [
    {
      text: 'Design Complete milestone',
      confidence: 0.8,
      milestoneName: 'Design Complete',
      projectName: 'Digital Transformation',
      targetDate: '2024-08-15',
      status: 'completed',
    },
    {
      text: 'Testing Phase milestone',
      confidence: 0.75,
      milestoneName: 'Testing Phase',
      projectName: 'Customer Portal',
      targetDate: '2024-09-30',
      status: 'in-progress',
    },
  ],
  teamUpdates: [
    {
      text: 'Development Team: 85% utilization',
      confidence: 0.9,
      teamName: 'Development Team',
      utilization: 85,
      commentary: 'Focused on critical deliverables',
    },
    // Missing QA Team (false negative)
    {
      text: 'Design Team: 60% utilization',
      confidence: 0.7,
      teamName: 'Design Team',
      utilization: 60,
    }, // False positive
  ],
  extractionMetadata: {
    totalConfidence: 0.82,
    processingTime: 5000,
    extractedEntities: 8,
    documentType: 'steering-committee',
  },
};

describe('calculateAccuracyMetrics', () => {
  let accuracyMetrics: AccuracyMetrics;

  beforeAll(() => {
    accuracyMetrics = calculateAccuracyMetrics(
      mockGroundTruth,
      mockExtractionResult
    );
  });

  describe('overall accuracy', () => {
    it('should calculate correct overall accuracy metrics', () => {
      const overall = accuracyMetrics.overall;

      // Based on individual entity type calculations:
      // Project statuses: TP=2, FP=1, FN=1
      // Risks: TP=1, FP=0, FN=1
      // Financials: TP=2, FP=0, FN=0
      // Milestones: TP=2, FP=0, FN=0
      // Team updates: TP=1, FP=1, FN=1
      // Total: TP=8, FP=2, FN=3

      expect(overall.truePositives).toBe(8);
      expect(overall.falsePositives).toBe(2);
      expect(overall.falseNegatives).toBe(3);
    });

    it('should calculate precision correctly', () => {
      const overall = accuracyMetrics.overall;
      // Precision = TP / (TP + FP) = 8 / (8 + 2) = 0.8
      expect(overall.precision).toBeCloseTo(0.8, 2);
    });

    it('should calculate recall correctly', () => {
      const overall = accuracyMetrics.overall;
      // Recall = TP / (TP + FN) = 8 / (8 + 3) = 0.727
      expect(overall.recall).toBeCloseTo(0.727, 2);
    });

    it('should calculate F1 score correctly', () => {
      const overall = accuracyMetrics.overall;
      // F1 = 2 * (precision * recall) / (precision + recall)
      // F1 = 2 * (0.8 * 0.727) / (0.8 + 0.727) ≈ 0.762
      expect(overall.f1Score).toBeCloseTo(0.762, 2);
    });

    it('should calculate accuracy score correctly', () => {
      const overall = accuracyMetrics.overall;
      // Accuracy = TP / (TP + FP + FN) = 8 / (8 + 2 + 3) = 61.54%
      expect(overall.accuracyScore).toBeCloseTo(61.54, 1);
    });
  });

  describe('entity-specific accuracy', () => {
    it('should calculate project status accuracy correctly', () => {
      const projectAccuracy = accuracyMetrics.byEntityType.projectStatuses;

      // Expected: 3, Extracted: 3 (2 correct + 1 false positive)
      // True positives: 2, False positives: 1, False negatives: 1
      expect(projectAccuracy.truePositives).toBe(2);
      expect(projectAccuracy.falsePositives).toBe(1);
      expect(projectAccuracy.falseNegatives).toBe(1);
      expect(projectAccuracy.precision).toBeCloseTo(0.67, 2);
      expect(projectAccuracy.recall).toBeCloseTo(0.67, 2);
    });

    it('should calculate risk accuracy correctly', () => {
      const riskAccuracy = accuracyMetrics.byEntityType.risks;

      // Expected: 2, Extracted: 1 (1 correct)
      // True positives: 1, False positives: 0, False negatives: 1
      expect(riskAccuracy.truePositives).toBe(1);
      expect(riskAccuracy.falsePositives).toBe(0);
      expect(riskAccuracy.falseNegatives).toBe(1);
      expect(riskAccuracy.precision).toBe(1.0);
      expect(riskAccuracy.recall).toBe(0.5);
    });

    it('should calculate financial accuracy correctly', () => {
      const financialAccuracy = accuracyMetrics.byEntityType.financials;

      // Expected: 2, Extracted: 2 (both correct)
      // True positives: 2, False positives: 0, False negatives: 0
      expect(financialAccuracy.truePositives).toBe(2);
      expect(financialAccuracy.falsePositives).toBe(0);
      expect(financialAccuracy.falseNegatives).toBe(0);
      expect(financialAccuracy.precision).toBe(1.0);
      expect(financialAccuracy.recall).toBe(1.0);
      expect(financialAccuracy.f1Score).toBe(1.0);
    });

    it('should calculate milestone accuracy correctly', () => {
      const milestoneAccuracy = accuracyMetrics.byEntityType.milestones;

      // Expected: 2, Extracted: 2 (both correct)
      // True positives: 2, False positives: 0, False negatives: 0
      expect(milestoneAccuracy.truePositives).toBe(2);
      expect(milestoneAccuracy.falsePositives).toBe(0);
      expect(milestoneAccuracy.falseNegatives).toBe(0);
      expect(milestoneAccuracy.precision).toBe(1.0);
      expect(milestoneAccuracy.recall).toBe(1.0);
    });

    it('should calculate team update accuracy correctly', () => {
      const teamAccuracy = accuracyMetrics.byEntityType.teamUpdates;

      // Expected: 2, Extracted: 2 (1 correct + 1 false positive)
      // True positives: 1, False positives: 1, False negatives: 1
      expect(teamAccuracy.truePositives).toBe(1);
      expect(teamAccuracy.falsePositives).toBe(1);
      expect(teamAccuracy.falseNegatives).toBe(1);
      expect(teamAccuracy.precision).toBe(0.5);
      expect(teamAccuracy.recall).toBe(0.5);
    });
  });

  describe('quality metrics', () => {
    it('should calculate average confidence correctly', () => {
      const qualityMetrics = accuracyMetrics.qualityMetrics;

      // Average of all extracted entity confidences
      const allConfidences = [
        0.9,
        0.8,
        0.7, // project statuses
        0.85, // risks
        0.9,
        0.85, // financials
        0.8,
        0.75, // milestones
        0.9,
        0.7, // team updates
      ];
      const expectedAvg =
        allConfidences.reduce((sum, conf) => sum + conf, 0) /
        allConfidences.length;

      expect(qualityMetrics.averageConfidence).toBeCloseTo(expectedAvg, 2);
    });

    it('should calculate confidence distribution correctly', () => {
      const qualityMetrics = accuracyMetrics.qualityMetrics;

      // High (>0.8): 4 entities, Medium (0.6-0.8): 4 entities, Low (<0.6): 0 entities
      // Total: 8 entities
      expect(qualityMetrics.confidenceDistribution.high).toBeCloseTo(50, 0); // 4/8 * 100
      expect(qualityMetrics.confidenceDistribution.medium).toBeCloseTo(50, 0); // 4/8 * 100
      expect(qualityMetrics.confidenceDistribution.low).toBe(0);
    });

    it('should assess text quality', () => {
      const qualityMetrics = accuracyMetrics.qualityMetrics;

      // Text quality should be reasonable for the sample text
      expect(qualityMetrics.textQualityScore).toBeGreaterThan(0);
      expect(qualityMetrics.textQualityScore).toBeLessThanOrEqual(100);
    });

    it('should assess structural accuracy', () => {
      const qualityMetrics = accuracyMetrics.qualityMetrics;

      // Structural accuracy should be reasonable
      expect(qualityMetrics.structuralAccuracy).toBeGreaterThan(0);
      expect(qualityMetrics.structuralAccuracy).toBeLessThanOrEqual(100);
    });
  });
});

describe('generateBenchmarkReport', () => {
  let mockBenchmarks: AccuracyBenchmark[];

  beforeAll(() => {
    const accuracy1 = calculateAccuracyMetrics(
      mockGroundTruth,
      mockExtractionResult
    );

    // Create a second extraction result with different accuracy
    const mockExtractionResult2: OCRExtractionResult = {
      ...mockExtractionResult,
      projectStatuses: [
        ...mockExtractionResult.projectStatuses,
        {
          text: 'Data Migration: red',
          confidence: 0.75,
          projectName: 'Data Migration',
          status: 'red',
          ragReason: 'Critical blocker identified',
        },
      ],
      extractionMetadata: {
        ...mockExtractionResult.extractionMetadata,
        extractedEntities: 9,
        totalConfidence: 0.85,
      },
    };

    const accuracy2 = calculateAccuracyMetrics(
      mockGroundTruth,
      mockExtractionResult2
    );

    mockBenchmarks = [
      {
        groundTruth: mockGroundTruth,
        extractionResult: mockExtractionResult,
        accuracy: accuracy1,
        performance: {
          processingTime: 5000,
          memoryUsage: 50 * 1024 * 1024,
          ocrTime: 3500,
          extractionTime: 1000,
          mappingTime: 500,
          throughput: 1.6,
        },
        timestamp: '2024-01-01T10:00:00Z',
        documentType: 'steering-committee',
        documentId: 'test-doc-1',
      },
      {
        groundTruth: mockGroundTruth,
        extractionResult: mockExtractionResult2,
        accuracy: accuracy2,
        performance: {
          processingTime: 4500,
          memoryUsage: 45 * 1024 * 1024,
          ocrTime: 3000,
          extractionTime: 900,
          mappingTime: 600,
          throughput: 2.0,
        },
        timestamp: '2024-01-01T11:00:00Z',
        documentType: 'steering-committee',
        documentId: 'test-doc-2',
      },
    ];
  });

  it('should generate a complete benchmark report', () => {
    const report = generateBenchmarkReport(mockBenchmarks);

    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('benchmarks');
    expect(report).toHaveProperty('recommendations');
    expect(report).toHaveProperty('improvementAreas');
    expect(report).toHaveProperty('trend');
  });

  it('should calculate correct summary statistics', () => {
    const report = generateBenchmarkReport(mockBenchmarks);
    const summary = report.summary;

    expect(summary.totalDocuments).toBe(2);
    expect(summary.dateRange.start).toBe('2024-01-01T10:00:00.000Z');
    expect(summary.dateRange.end).toBe('2024-01-01T11:00:00.000Z');
    expect(summary.bestPerforming.documentId).toBe('test-doc-2'); // Should have higher accuracy
    expect(summary.worstPerforming.documentId).toBe('test-doc-1');
  });

  it('should provide meaningful recommendations', () => {
    const report = generateBenchmarkReport(mockBenchmarks);
    const recommendations = report.recommendations;

    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);

    // Should include recommendations based on accuracy levels
    const hasAccuracyRecommendation = recommendations.some(
      rec =>
        rec.includes('accuracy') ||
        rec.includes('precision') ||
        rec.includes('recall')
    );
    expect(hasAccuracyRecommendation).toBe(true);
  });

  it('should identify improvement areas', () => {
    const report = generateBenchmarkReport(mockBenchmarks);
    const improvementAreas = report.improvementAreas;

    expect(Array.isArray(improvementAreas)).toBe(true);

    // Should have areas sorted by priority
    for (let i = 0; i < improvementAreas.length - 1; i++) {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const currentPriority = priorityOrder[improvementAreas[i].priority];
      const nextPriority = priorityOrder[improvementAreas[i + 1].priority];
      expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
    }

    // Each improvement area should have required properties
    improvementAreas.forEach(area => {
      expect(area).toHaveProperty('area');
      expect(area).toHaveProperty('currentScore');
      expect(area).toHaveProperty('targetScore');
      expect(area).toHaveProperty('priority');
      expect(area).toHaveProperty('suggestedActions');
      expect(Array.isArray(area.suggestedActions)).toBe(true);
    });
  });

  it('should analyze trends correctly', () => {
    const report = generateBenchmarkReport(mockBenchmarks);
    const trend = report.trend;

    expect(trend).toHaveProperty('trend');
    expect(trend).toHaveProperty('changeRate');
    expect(trend).toHaveProperty('significantChanges');
    expect(['improving', 'declining', 'stable']).toContain(trend.trend);
    expect(Array.isArray(trend.significantChanges)).toBe(true);
  });

  it('should handle empty benchmarks array', () => {
    expect(() => {
      generateBenchmarkReport([]);
    }).toThrow('Cannot generate report from empty benchmarks array');
  });

  it('should handle single benchmark', () => {
    const report = generateBenchmarkReport([mockBenchmarks[0]]);

    expect(report.summary.totalDocuments).toBe(1);
    expect(report.trend.trend).toBe('stable');
    expect(report.trend.changeRate).toBe(0);
    expect(report.trend.significantChanges).toHaveLength(0);
  });
});

describe('edge cases and error handling', () => {
  it('should handle extraction result with no entities', () => {
    const emptyExtractionResult: OCRExtractionResult = {
      rawText: 'Some text with no recognizable entities',
      projectStatuses: [],
      risks: [],
      financials: [],
      milestones: [],
      teamUpdates: [],
      commentary: [],
      extractionMetadata: {
        totalConfidence: 0,
        processingTime: 1000,
        extractedEntities: 0,
        documentType: 'steering-committee',
      },
    };

    const accuracy = calculateAccuracyMetrics(
      mockGroundTruth,
      emptyExtractionResult
    );

    expect(accuracy.overall.truePositives).toBe(0);
    expect(accuracy.overall.falsePositives).toBe(0);
    expect(accuracy.overall.falseNegatives).toBe(11);
    expect(accuracy.overall.precision).toBe(0);
    expect(accuracy.overall.recall).toBe(0);
    expect(accuracy.overall.f1Score).toBe(0);
  });

  it('should handle ground truth with no expected entities', () => {
    const emptyGroundTruth: GroundTruthDataset = {
      documentId: 'empty-doc',
      expectedProjectStatuses: [],
      expectedRisks: [],
      expectedFinancials: [],
      expectedMilestones: [],
      expectedTeamUpdates: [],
      totalExpectedEntities: 0,
      documentMetadata: {
        pages: 1,
        format: 'pdf',
        quality: 'high',
        textDensity: 0.1,
      },
    };

    const accuracy = calculateAccuracyMetrics(
      emptyGroundTruth,
      mockExtractionResult
    );

    expect(accuracy.overall.truePositives).toBe(0);
    expect(accuracy.overall.falsePositives).toBe(10); // Total extracted entities
    expect(accuracy.overall.falseNegatives).toBe(0);
    expect(accuracy.overall.precision).toBe(0);
    expect(accuracy.overall.recall).toBe(0);
  });

  it('should handle perfect extraction accuracy', () => {
    // Create extraction result that perfectly matches ground truth
    const perfectExtractionResult: OCRExtractionResult = {
      rawText: 'Perfect OCR text',
      projectStatuses: mockGroundTruth.expectedProjectStatuses.map(p => ({
        text: `${p.projectName}: ${p.status}`,
        confidence: 0.95,
        projectName: p.projectName,
        status: p.status,
        ragReason: p.ragReason,
      })),
      risks: mockGroundTruth.expectedRisks.map(r => ({
        text: r.riskDescription,
        confidence: 0.9,
        riskDescription: r.riskDescription,
        impact: r.impact,
        probability: r.probability,
        mitigation: r.mitigation,
      })),
      financials: mockGroundTruth.expectedFinancials.map(f => ({
        text: `${f.projectName} budget`,
        confidence: 0.92,
        projectName: f.projectName,
        budgetAmount: f.budgetAmount,
        actualAmount: f.actualAmount,
        forecastAmount: f.forecastAmount,
        currency: f.currency,
      })),
      milestones: mockGroundTruth.expectedMilestones.map(m => ({
        text: `${m.milestoneName} milestone`,
        confidence: 0.88,
        milestoneName: m.milestoneName,
        projectName: m.projectName,
        targetDate: m.targetDate,
        status: m.status,
      })),
      teamUpdates: mockGroundTruth.expectedTeamUpdates.map(t => ({
        text: `${t.teamName}: ${t.utilization}%`,
        confidence: 0.9,
        teamName: t.teamName,
        utilization: t.utilization,
        commentary: t.commentary,
      })),
      commentary: [],
      extractionMetadata: {
        totalConfidence: 0.91,
        processingTime: 3000,
        extractedEntities: mockGroundTruth.totalExpectedEntities,
        documentType: 'steering-committee',
      },
    };

    const accuracy = calculateAccuracyMetrics(
      mockGroundTruth,
      perfectExtractionResult
    );

    expect(accuracy.overall.truePositives).toBe(11);
    expect(accuracy.overall.falsePositives).toBe(0);
    expect(accuracy.overall.falseNegatives).toBe(0);
    expect(accuracy.overall.precision).toBe(1.0);
    expect(accuracy.overall.recall).toBe(1.0);
    expect(accuracy.overall.f1Score).toBe(1.0);
    expect(accuracy.overall.accuracyScore).toBe(100);
  });
});
