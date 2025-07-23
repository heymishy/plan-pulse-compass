/**
 * OCR Accuracy Measurement and Benchmarking Utilities
 * Phase 3 implementation for SteerCo OCR feature evaluation
 */

import type {
  OCRExtractionResult,
  ExtractedEntity,
  ExtractedProjectStatus,
  ExtractedRisk,
  ExtractedFinancial,
  ExtractedMilestone,
  ExtractedTeamUpdate,
} from '@/types/ocrTypes';

export interface AccuracyBenchmark {
  groundTruth: GroundTruthDataset;
  extractionResult: OCRExtractionResult;
  accuracy: AccuracyMetrics;
  performance: PerformanceMetrics;
  timestamp: string;
  documentType: string;
  documentId: string;
}

export interface GroundTruthDataset {
  documentId: string;
  expectedProjectStatuses: GroundTruthProjectStatus[];
  expectedRisks: GroundTruthRisk[];
  expectedFinancials: GroundTruthFinancial[];
  expectedMilestones: GroundTruthMilestone[];
  expectedTeamUpdates: GroundTruthTeamUpdate[];
  totalExpectedEntities: number;
  documentMetadata: {
    pages: number;
    format: string;
    quality: 'low' | 'medium' | 'high';
    textDensity: number;
  };
}

export interface GroundTruthProjectStatus {
  projectName: string;
  status: 'red' | 'amber' | 'green' | 'blue' | 'complete';
  ragReason?: string;
  position: { page: number; section: string };
}

export interface GroundTruthRisk {
  riskDescription: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability?: 'low' | 'medium' | 'high';
  mitigation?: string;
  position: { page: number; section: string };
}

export interface GroundTruthFinancial {
  projectName: string;
  budgetAmount?: number;
  actualAmount?: number;
  forecastAmount?: number;
  currency: string;
  position: { page: number; section: string };
}

export interface GroundTruthMilestone {
  milestoneName: string;
  projectName: string;
  targetDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
  position: { page: number; section: string };
}

export interface GroundTruthTeamUpdate {
  teamName: string;
  utilization: number;
  commentary?: string;
  position: { page: number; section: string };
}

export interface AccuracyMetrics {
  overall: EntityAccuracy;
  byEntityType: {
    projectStatuses: EntityAccuracy;
    risks: EntityAccuracy;
    financials: EntityAccuracy;
    milestones: EntityAccuracy;
    teamUpdates: EntityAccuracy;
  };
  qualityMetrics: QualityMetrics;
}

export interface EntityAccuracy {
  precision: number; // TP / (TP + FP)
  recall: number; // TP / (TP + FN)
  f1Score: number; // 2 * (precision * recall) / (precision + recall)
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracyScore: number; // Overall accuracy percentage
}

export interface QualityMetrics {
  averageConfidence: number;
  confidenceDistribution: {
    high: number; // >0.8
    medium: number; // 0.6-0.8
    low: number; // <0.6
  };
  textQualityScore: number; // OCR text quality assessment
  structuralAccuracy: number; // How well document structure was preserved
}

export interface PerformanceMetrics {
  processingTime: number; // milliseconds
  memoryUsage: number; // bytes peak usage
  ocrTime: number; // milliseconds for OCR step
  extractionTime: number; // milliseconds for entity extraction
  mappingTime: number; // milliseconds for mapping step
  throughput: number; // entities per second
}

export interface BenchmarkReport {
  summary: BenchmarkSummary;
  benchmarks: AccuracyBenchmark[];
  recommendations: string[];
  improvementAreas: ImprovementArea[];
  trend: AccuracyTrend;
}

export interface BenchmarkSummary {
  totalDocuments: number;
  averageAccuracy: AccuracyMetrics;
  averagePerformance: PerformanceMetrics;
  dateRange: { start: string; end: string };
  bestPerforming: { documentId: string; accuracy: number };
  worstPerforming: { documentId: string; accuracy: number };
}

export interface ImprovementArea {
  area: string;
  currentScore: number;
  targetScore: number;
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
}

export interface AccuracyTrend {
  trend: 'improving' | 'declining' | 'stable';
  changeRate: number; // percentage change per benchmark
  significantChanges: Array<{
    metric: string;
    change: number;
    date: string;
  }>;
}

/**
 * Calculate accuracy metrics for OCR extraction results
 */
export function calculateAccuracyMetrics(
  groundTruth: GroundTruthDataset,
  extractionResult: OCRExtractionResult
): AccuracyMetrics {
  const overallAccuracy = calculateOverallAccuracy(
    groundTruth,
    extractionResult
  );

  const byEntityType = {
    projectStatuses: calculateProjectStatusAccuracy(
      groundTruth.expectedProjectStatuses,
      extractionResult.projectStatuses
    ),
    risks: calculateRiskAccuracy(
      groundTruth.expectedRisks,
      extractionResult.risks
    ),
    financials: calculateFinancialAccuracy(
      groundTruth.expectedFinancials,
      extractionResult.financials
    ),
    milestones: calculateMilestoneAccuracy(
      groundTruth.expectedMilestones,
      extractionResult.milestones
    ),
    teamUpdates: calculateTeamUpdateAccuracy(
      groundTruth.expectedTeamUpdates,
      extractionResult.teamUpdates
    ),
  };

  const qualityMetrics = calculateQualityMetrics(extractionResult);

  return {
    overall: overallAccuracy,
    byEntityType,
    qualityMetrics,
  };
}

/**
 * Calculate overall accuracy across all entity types
 */
function calculateOverallAccuracy(
  groundTruth: GroundTruthDataset,
  extractionResult: OCRExtractionResult
): EntityAccuracy {
  // Calculate accuracy for each entity type
  const projectAccuracy = calculateProjectStatusAccuracy(
    groundTruth.expectedProjectStatuses,
    extractionResult.projectStatuses
  );
  const riskAccuracy = calculateRiskAccuracy(
    groundTruth.expectedRisks,
    extractionResult.risks
  );
  const financialAccuracy = calculateFinancialAccuracy(
    groundTruth.expectedFinancials,
    extractionResult.financials
  );
  const milestoneAccuracy = calculateMilestoneAccuracy(
    groundTruth.expectedMilestones,
    extractionResult.milestones
  );
  const teamAccuracy = calculateTeamUpdateAccuracy(
    groundTruth.expectedTeamUpdates,
    extractionResult.teamUpdates
  );

  // Aggregate results
  const totalTruePositives =
    projectAccuracy.truePositives +
    riskAccuracy.truePositives +
    financialAccuracy.truePositives +
    milestoneAccuracy.truePositives +
    teamAccuracy.truePositives;

  const totalFalsePositives =
    projectAccuracy.falsePositives +
    riskAccuracy.falsePositives +
    financialAccuracy.falsePositives +
    milestoneAccuracy.falsePositives +
    teamAccuracy.falsePositives;

  const totalFalseNegatives =
    projectAccuracy.falseNegatives +
    riskAccuracy.falseNegatives +
    financialAccuracy.falseNegatives +
    milestoneAccuracy.falseNegatives +
    teamAccuracy.falseNegatives;

  return calculateAccuracyFromCounts(
    totalTruePositives,
    totalFalsePositives,
    totalFalseNegatives
  );
}

/**
 * Calculate accuracy for project status entities
 */
function calculateProjectStatusAccuracy(
  expected: GroundTruthProjectStatus[],
  extracted: ExtractedProjectStatus[]
): EntityAccuracy {
  const matches = findProjectStatusMatches(expected, extracted);

  const truePositives = matches.length;
  const falsePositives = extracted.length - truePositives;
  const falseNegatives = expected.length - truePositives;

  return calculateAccuracyFromCounts(
    truePositives,
    falsePositives,
    falseNegatives
  );
}

/**
 * Calculate accuracy for risk entities
 */
function calculateRiskAccuracy(
  expected: GroundTruthRisk[],
  extracted: ExtractedRisk[]
): EntityAccuracy {
  const matches = findRiskMatches(expected, extracted);

  const truePositives = matches.length;
  const falsePositives = extracted.length - truePositives;
  const falseNegatives = expected.length - truePositives;

  return calculateAccuracyFromCounts(
    truePositives,
    falsePositives,
    falseNegatives
  );
}

/**
 * Calculate accuracy for financial entities
 */
function calculateFinancialAccuracy(
  expected: GroundTruthFinancial[],
  extracted: ExtractedFinancial[]
): EntityAccuracy {
  const matches = findFinancialMatches(expected, extracted);

  const truePositives = matches.length;
  const falsePositives = extracted.length - truePositives;
  const falseNegatives = expected.length - truePositives;

  return calculateAccuracyFromCounts(
    truePositives,
    falsePositives,
    falseNegatives
  );
}

/**
 * Calculate accuracy for milestone entities
 */
function calculateMilestoneAccuracy(
  expected: GroundTruthMilestone[],
  extracted: ExtractedMilestone[]
): EntityAccuracy {
  const matches = findMilestoneMatches(expected, extracted);

  const truePositives = matches.length;
  const falsePositives = extracted.length - truePositives;
  const falseNegatives = expected.length - truePositives;

  return calculateAccuracyFromCounts(
    truePositives,
    falsePositives,
    falseNegatives
  );
}

/**
 * Calculate accuracy for team update entities
 */
function calculateTeamUpdateAccuracy(
  expected: GroundTruthTeamUpdate[],
  extracted: ExtractedTeamUpdate[]
): EntityAccuracy {
  const matches = findTeamUpdateMatches(expected, extracted);

  const truePositives = matches.length;
  const falsePositives = extracted.length - truePositives;
  const falseNegatives = expected.length - truePositives;

  return calculateAccuracyFromCounts(
    truePositives,
    falsePositives,
    falseNegatives
  );
}

/**
 * Calculate accuracy metrics from TP, FP, FN counts
 */
function calculateAccuracyFromCounts(
  truePositives: number,
  falsePositives: number,
  falseNegatives: number
): EntityAccuracy {
  const precision =
    truePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
  const recall =
    truePositives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  const f1Score =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;
  const accuracyScore =
    (truePositives / (truePositives + falsePositives + falseNegatives)) * 100;

  return {
    precision,
    recall,
    f1Score,
    truePositives,
    falsePositives,
    falseNegatives,
    accuracyScore,
  };
}

/**
 * Calculate quality metrics for extraction results
 */
function calculateQualityMetrics(
  extractionResult: OCRExtractionResult
): QualityMetrics {
  const allEntities = [
    ...extractionResult.projectStatuses,
    ...extractionResult.risks,
    ...extractionResult.financials,
    ...extractionResult.milestones,
    ...extractionResult.teamUpdates,
  ];

  const confidences = allEntities.map(e => e.confidence);
  const averageConfidence =
    confidences.length > 0
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : 0;

  const high = confidences.filter(c => c > 0.8).length;
  const medium = confidences.filter(c => c >= 0.6 && c <= 0.8).length;
  const low = confidences.filter(c => c < 0.6).length;

  const confidenceDistribution = {
    high: confidences.length > 0 ? (high / confidences.length) * 100 : 0,
    medium: confidences.length > 0 ? (medium / confidences.length) * 100 : 0,
    low: confidences.length > 0 ? (low / confidences.length) * 100 : 0,
  };

  const textQualityScore = assessTextQuality(extractionResult.rawText);
  const structuralAccuracy = assessStructuralAccuracy(extractionResult);

  return {
    averageConfidence,
    confidenceDistribution,
    textQualityScore,
    structuralAccuracy,
  };
}

/**
 * Assess OCR text quality based on various indicators
 */
function assessTextQuality(rawText: string): number {
  let score = 100;

  // Check for common OCR errors
  const ocrErrorPatterns = [
    /[Il1|]{3,}/g, // Consecutive similar chars that might be OCR errors
    /[^\w\s.,!?;:()\-'"]/g, // Unusual characters
    /\s{3,}/g, // Multiple consecutive spaces
    /[A-Z]{10,}/g, // Very long uppercase sequences (might be garbled)
  ];

  for (const pattern of ocrErrorPatterns) {
    const matches = rawText.match(pattern) || [];
    score -= matches.length * 5; // Deduct 5 points per error
  }

  // Check for reasonable word-to-character ratio
  const words = rawText.split(/\s+/).filter(w => w.length > 0);
  const avgWordLength =
    words.reduce((sum, word) => sum + word.length, 0) / words.length;

  if (avgWordLength < 2 || avgWordLength > 15) {
    score -= 20; // Unreasonable average word length
  }

  // Check for proper sentence structure
  const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength =
    sentences.reduce((sum, sent) => sum + sent.split(/\s+/).length, 0) /
    sentences.length;

  if (avgSentenceLength < 3 || avgSentenceLength > 50) {
    score -= 15; // Unreasonable sentence structure
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Assess how well document structure was preserved
 */
function assessStructuralAccuracy(
  extractionResult: OCRExtractionResult
): number {
  let score = 100;

  const allEntities = [
    ...extractionResult.projectStatuses,
    ...extractionResult.risks,
    ...extractionResult.financials,
    ...extractionResult.milestones,
    ...extractionResult.teamUpdates,
  ];

  // Check if entities have reasonable distribution
  const entityTypes = 5;
  const avgEntitiesPerType = allEntities.length / entityTypes;

  if (avgEntitiesPerType < 1) {
    score -= 30; // Very sparse extraction
  }

  // Check for reasonable confidence distribution
  const lowConfidenceCount = allEntities.filter(e => e.confidence < 0.4).length;
  const lowConfidenceRatio =
    allEntities.length > 0 ? lowConfidenceCount / allEntities.length : 0;

  if (lowConfidenceRatio > 0.5) {
    score -= 25; // Too many low-confidence extractions
  }

  // Check for text coherence in extracted content
  const textSnippets = allEntities.map(e => e.text);
  const avgSnippetLength =
    textSnippets.reduce((sum, text) => sum + text.length, 0) /
    textSnippets.length;

  if (avgSnippetLength < 10 || avgSnippetLength > 200) {
    score -= 20; // Unreasonable snippet lengths
  }

  return Math.max(0, Math.min(100, score));
}

// Entity matching functions
function findProjectStatusMatches(
  expected: GroundTruthProjectStatus[],
  extracted: ExtractedProjectStatus[]
): Array<{
  expected: GroundTruthProjectStatus;
  extracted: ExtractedProjectStatus;
}> {
  const matches: Array<{
    expected: GroundTruthProjectStatus;
    extracted: ExtractedProjectStatus;
  }> = [];

  for (const exp of expected) {
    const match = extracted.find(
      ext =>
        normalizeText(ext.projectName) === normalizeText(exp.projectName) &&
        ext.status === exp.status
    );

    if (match) {
      matches.push({ expected: exp, extracted: match });
    }
  }

  return matches;
}

function findRiskMatches(
  expected: GroundTruthRisk[],
  extracted: ExtractedRisk[]
): Array<{ expected: GroundTruthRisk; extracted: ExtractedRisk }> {
  const matches: Array<{
    expected: GroundTruthRisk;
    extracted: ExtractedRisk;
  }> = [];

  for (const exp of expected) {
    const match = extracted.find(
      ext =>
        calculateTextSimilarity(ext.riskDescription, exp.riskDescription) >
          0.7 && ext.impact === exp.impact
    );

    if (match) {
      matches.push({ expected: exp, extracted: match });
    }
  }

  return matches;
}

function findFinancialMatches(
  expected: GroundTruthFinancial[],
  extracted: ExtractedFinancial[]
): Array<{ expected: GroundTruthFinancial; extracted: ExtractedFinancial }> {
  const matches: Array<{
    expected: GroundTruthFinancial;
    extracted: ExtractedFinancial;
  }> = [];

  for (const exp of expected) {
    const match = extracted.find(
      ext =>
        normalizeText(ext.projectName) === normalizeText(exp.projectName) &&
        ((exp.budgetAmount &&
          ext.budgetAmount &&
          Math.abs(ext.budgetAmount - exp.budgetAmount) <
            exp.budgetAmount * 0.1) ||
          (exp.actualAmount &&
            ext.actualAmount &&
            Math.abs(ext.actualAmount - exp.actualAmount) <
              exp.actualAmount * 0.1) ||
          (exp.forecastAmount &&
            ext.forecastAmount &&
            Math.abs(ext.forecastAmount - exp.forecastAmount) <
              exp.forecastAmount * 0.1))
    );

    if (match) {
      matches.push({ expected: exp, extracted: match });
    }
  }

  return matches;
}

function findMilestoneMatches(
  expected: GroundTruthMilestone[],
  extracted: ExtractedMilestone[]
): Array<{ expected: GroundTruthMilestone; extracted: ExtractedMilestone }> {
  const matches: Array<{
    expected: GroundTruthMilestone;
    extracted: ExtractedMilestone;
  }> = [];

  for (const exp of expected) {
    const match = extracted.find(
      ext =>
        calculateTextSimilarity(ext.milestoneName, exp.milestoneName) > 0.8 &&
        normalizeText(ext.projectName) === normalizeText(exp.projectName)
    );

    if (match) {
      matches.push({ expected: exp, extracted: match });
    }
  }

  return matches;
}

function findTeamUpdateMatches(
  expected: GroundTruthTeamUpdate[],
  extracted: ExtractedTeamUpdate[]
): Array<{ expected: GroundTruthTeamUpdate; extracted: ExtractedTeamUpdate }> {
  const matches: Array<{
    expected: GroundTruthTeamUpdate;
    extracted: ExtractedTeamUpdate;
  }> = [];

  for (const exp of expected) {
    const match = extracted.find(
      ext =>
        normalizeText(ext.teamName) === normalizeText(exp.teamName) &&
        ext.utilization !== undefined &&
        Math.abs(ext.utilization - exp.utilization) < 5 // Within 5% tolerance
    );

    if (match) {
      matches.push({ expected: exp, extracted: match });
    }
  }

  return matches;
}

/**
 * Generic entity accuracy calculation for heterogeneous arrays
 */
function calculateEntityAccuracy(
  expected: unknown[],
  extracted: ExtractedEntity[]
): EntityAccuracy {
  // For overall accuracy, we sum up the individual entity type results
  // This is a placeholder - the real calculation is done by aggregating individual type results
  const truePositives = 0;
  const falsePositives = 0;
  const falseNegatives = 0;

  return calculateAccuracyFromCounts(
    truePositives,
    falsePositives,
    falseNegatives
  );
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate text similarity using simple word overlap
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeText(text1).split(' '));
  const words2 = new Set(normalizeText(text2).split(' '));

  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Generate benchmark report from multiple accuracy benchmarks
 */
export function generateBenchmarkReport(
  benchmarks: AccuracyBenchmark[]
): BenchmarkReport {
  if (benchmarks.length === 0) {
    throw new Error('Cannot generate report from empty benchmarks array');
  }

  const summary = calculateBenchmarkSummary(benchmarks);
  const recommendations = generateRecommendations(benchmarks);
  const improvementAreas = identifyImprovementAreas(benchmarks);
  const trend = analyzeTrend(benchmarks);

  return {
    summary,
    benchmarks,
    recommendations,
    improvementAreas,
    trend,
  };
}

/**
 * Calculate summary statistics from benchmarks
 */
function calculateBenchmarkSummary(
  benchmarks: AccuracyBenchmark[]
): BenchmarkSummary {
  const totalDocuments = benchmarks.length;

  // Calculate averages
  const avgAccuracy = calculateAverageAccuracy(benchmarks);
  const avgPerformance = calculateAveragePerformance(benchmarks);

  // Find best and worst performing
  const accuracyScores = benchmarks.map(b => ({
    documentId: b.documentId,
    accuracy: b.accuracy.overall.accuracyScore,
  }));

  const bestPerforming = accuracyScores.reduce((best, current) =>
    current.accuracy > best.accuracy ? current : best
  );

  const worstPerforming = accuracyScores.reduce((worst, current) =>
    current.accuracy < worst.accuracy ? current : worst
  );

  // Date range
  const dates = benchmarks.map(b => new Date(b.timestamp)).sort();
  const dateRange = {
    start: dates[0].toISOString(),
    end: dates[dates.length - 1].toISOString(),
  };

  return {
    totalDocuments,
    averageAccuracy: avgAccuracy,
    averagePerformance: avgPerformance,
    dateRange,
    bestPerforming,
    worstPerforming,
  };
}

function calculateAverageAccuracy(
  benchmarks: AccuracyBenchmark[]
): AccuracyMetrics {
  const overallAccuracy = calculateAverageEntityAccuracy(
    benchmarks.map(b => b.accuracy.overall)
  );

  const byEntityType = {
    projectStatuses: calculateAverageEntityAccuracy(
      benchmarks.map(b => b.accuracy.byEntityType.projectStatuses)
    ),
    risks: calculateAverageEntityAccuracy(
      benchmarks.map(b => b.accuracy.byEntityType.risks)
    ),
    financials: calculateAverageEntityAccuracy(
      benchmarks.map(b => b.accuracy.byEntityType.financials)
    ),
    milestones: calculateAverageEntityAccuracy(
      benchmarks.map(b => b.accuracy.byEntityType.milestones)
    ),
    teamUpdates: calculateAverageEntityAccuracy(
      benchmarks.map(b => b.accuracy.byEntityType.teamUpdates)
    ),
  };

  const qualityMetrics = calculateAverageQualityMetrics(
    benchmarks.map(b => b.accuracy.qualityMetrics)
  );

  return {
    overall: overallAccuracy,
    byEntityType,
    qualityMetrics,
  };
}

function calculateAverageEntityAccuracy(
  accuracies: EntityAccuracy[]
): EntityAccuracy {
  const n = accuracies.length;
  if (n === 0) {
    return {
      precision: 0,
      recall: 0,
      f1Score: 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      accuracyScore: 0,
    };
  }

  return {
    precision: accuracies.reduce((sum, acc) => sum + acc.precision, 0) / n,
    recall: accuracies.reduce((sum, acc) => sum + acc.recall, 0) / n,
    f1Score: accuracies.reduce((sum, acc) => sum + acc.f1Score, 0) / n,
    truePositives: Math.round(
      accuracies.reduce((sum, acc) => sum + acc.truePositives, 0) / n
    ),
    falsePositives: Math.round(
      accuracies.reduce((sum, acc) => sum + acc.falsePositives, 0) / n
    ),
    falseNegatives: Math.round(
      accuracies.reduce((sum, acc) => sum + acc.falseNegatives, 0) / n
    ),
    accuracyScore:
      accuracies.reduce((sum, acc) => sum + acc.accuracyScore, 0) / n,
  };
}

function calculateAverageQualityMetrics(
  qualityMetrics: QualityMetrics[]
): QualityMetrics {
  const n = qualityMetrics.length;
  if (n === 0) {
    return {
      averageConfidence: 0,
      confidenceDistribution: { high: 0, medium: 0, low: 0 },
      textQualityScore: 0,
      structuralAccuracy: 0,
    };
  }

  return {
    averageConfidence:
      qualityMetrics.reduce((sum, qm) => sum + qm.averageConfidence, 0) / n,
    confidenceDistribution: {
      high:
        qualityMetrics.reduce(
          (sum, qm) => sum + qm.confidenceDistribution.high,
          0
        ) / n,
      medium:
        qualityMetrics.reduce(
          (sum, qm) => sum + qm.confidenceDistribution.medium,
          0
        ) / n,
      low:
        qualityMetrics.reduce(
          (sum, qm) => sum + qm.confidenceDistribution.low,
          0
        ) / n,
    },
    textQualityScore:
      qualityMetrics.reduce((sum, qm) => sum + qm.textQualityScore, 0) / n,
    structuralAccuracy:
      qualityMetrics.reduce((sum, qm) => sum + qm.structuralAccuracy, 0) / n,
  };
}

function calculateAveragePerformance(
  benchmarks: AccuracyBenchmark[]
): PerformanceMetrics {
  const n = benchmarks.length;
  if (n === 0) {
    return {
      processingTime: 0,
      memoryUsage: 0,
      ocrTime: 0,
      extractionTime: 0,
      mappingTime: 0,
      throughput: 0,
    };
  }

  return {
    processingTime:
      benchmarks.reduce((sum, b) => sum + b.performance.processingTime, 0) / n,
    memoryUsage:
      benchmarks.reduce((sum, b) => sum + b.performance.memoryUsage, 0) / n,
    ocrTime: benchmarks.reduce((sum, b) => sum + b.performance.ocrTime, 0) / n,
    extractionTime:
      benchmarks.reduce((sum, b) => sum + b.performance.extractionTime, 0) / n,
    mappingTime:
      benchmarks.reduce((sum, b) => sum + b.performance.mappingTime, 0) / n,
    throughput:
      benchmarks.reduce((sum, b) => sum + b.performance.throughput, 0) / n,
  };
}

/**
 * Generate recommendations based on benchmark results
 */
function generateRecommendations(benchmarks: AccuracyBenchmark[]): string[] {
  const recommendations: string[] = [];
  const avgAccuracy = calculateAverageAccuracy(benchmarks);

  // Overall accuracy recommendations
  if (avgAccuracy.overall.accuracyScore < 70) {
    recommendations.push(
      'Overall accuracy is below 70%. Consider improving OCR pre-processing and entity extraction patterns.'
    );
  }

  if (avgAccuracy.overall.precision < 0.7) {
    recommendations.push(
      'Precision is low. Review extraction patterns to reduce false positives.'
    );
  }

  if (avgAccuracy.overall.recall < 0.7) {
    recommendations.push(
      'Recall is low. Expand extraction patterns to capture more entities.'
    );
  }

  // Entity-specific recommendations
  if (avgAccuracy.byEntityType.projectStatuses.f1Score < 0.6) {
    recommendations.push(
      'Project status extraction needs improvement. Review status keyword patterns and mapping logic.'
    );
  }

  if (avgAccuracy.byEntityType.risks.f1Score < 0.6) {
    recommendations.push(
      'Risk extraction accuracy is low. Consider expanding risk identification patterns.'
    );
  }

  if (avgAccuracy.byEntityType.financials.f1Score < 0.6) {
    recommendations.push(
      'Financial data extraction needs attention. Review number parsing and currency detection.'
    );
  }

  // Quality-based recommendations
  if (avgAccuracy.qualityMetrics.averageConfidence < 0.6) {
    recommendations.push(
      'Average confidence is low. Consider improving OCR quality or document preprocessing.'
    );
  }

  if (avgAccuracy.qualityMetrics.textQualityScore < 70) {
    recommendations.push(
      'OCR text quality is poor. Consider using higher resolution images or better OCR engines.'
    );
  }

  if (avgAccuracy.qualityMetrics.confidenceDistribution.low > 40) {
    recommendations.push(
      'Too many low-confidence extractions. Review extraction thresholds and patterns.'
    );
  }

  return recommendations;
}

/**
 * Identify specific improvement areas
 */
function identifyImprovementAreas(
  benchmarks: AccuracyBenchmark[]
): ImprovementArea[] {
  const areas: ImprovementArea[] = [];
  const avgAccuracy = calculateAverageAccuracy(benchmarks);

  // Check each entity type
  Object.entries(avgAccuracy.byEntityType).forEach(([entityType, accuracy]) => {
    if (accuracy.f1Score < 0.8) {
      areas.push({
        area: `${entityType} extraction`,
        currentScore: Math.round(accuracy.f1Score * 100),
        targetScore: 80,
        priority: accuracy.f1Score < 0.6 ? 'high' : 'medium',
        suggestedActions: [
          `Review ${entityType} extraction patterns`,
          `Increase training data for ${entityType}`,
          `Improve ${entityType} confidence scoring`,
        ],
      });
    }
  });

  // Overall performance
  if (avgAccuracy.overall.accuracyScore < 75) {
    areas.push({
      area: 'Overall OCR accuracy',
      currentScore: Math.round(avgAccuracy.overall.accuracyScore),
      targetScore: 75,
      priority: 'high',
      suggestedActions: [
        'Improve document preprocessing',
        'Use higher quality OCR engine',
        'Implement post-processing corrections',
      ],
    });
  }

  return areas.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Analyze accuracy trends over time
 */
function analyzeTrend(benchmarks: AccuracyBenchmark[]): AccuracyTrend {
  if (benchmarks.length < 2) {
    return {
      trend: 'stable',
      changeRate: 0,
      significantChanges: [],
    };
  }

  // Sort by timestamp
  const sorted = [...benchmarks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const first = sorted[0].accuracy.overall.accuracyScore;
  const last = sorted[sorted.length - 1].accuracy.overall.accuracyScore;
  const changeRate = ((last - first) / first) * 100;

  let trend: 'improving' | 'declining' | 'stable';
  if (Math.abs(changeRate) < 5) {
    trend = 'stable';
  } else if (changeRate > 0) {
    trend = 'improving';
  } else {
    trend = 'declining';
  }

  // Find significant changes (>10% change between consecutive benchmarks)
  const significantChanges = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].accuracy.overall.accuracyScore;
    const curr = sorted[i].accuracy.overall.accuracyScore;
    const change = ((curr - prev) / prev) * 100;

    if (Math.abs(change) > 10) {
      significantChanges.push({
        metric: 'Overall Accuracy',
        change: Math.round(change * 100) / 100,
        date: sorted[i].timestamp,
      });
    }
  }

  return {
    trend,
    changeRate: Math.round(changeRate * 100) / 100,
    significantChanges,
  };
}
