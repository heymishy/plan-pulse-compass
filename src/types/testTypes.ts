export type TestType =
  | 'unit'
  | 'integration'
  | 'e2e'
  | 'visual'
  | 'accessibility'
  | 'performance';

export type TestCategory =
  | 'component'
  | 'hook'
  | 'utility'
  | 'context'
  | 'workflow'
  | 'api'
  | 'ui'
  | 'performance'
  | 'security'
  | 'accessibility';

export type FeatureArea =
  | 'dashboard'
  | 'teams'
  | 'projects'
  | 'planning'
  | 'tracking'
  | 'financials'
  | 'canvas'
  | 'skills'
  | 'goals'
  | 'scenarios'
  | 'settings'
  | 'mobile'
  | 'pwa'
  | 'core';

export type CITier = 'lightning' | 'comprehensive' | 'quality' | 'all';

export type TestPriority = 'critical' | 'high' | 'medium' | 'low';

export type TestStatus = 'active' | 'disabled' | 'flaky' | 'deprecated';

export interface TestCase {
  id: string;
  name: string;
  filePath: string;
  type: TestType;
  category: TestCategory;
  featureArea: FeatureArea;
  priority: TestPriority;
  status: TestStatus;
  ciTiers: CITier[];
  description: string;
  tags: string[];
  estimatedDuration: number; // in milliseconds
  dependencies: string[]; // other test IDs this depends on
  maintainer: string;
  lastModified: string;
  stability: number; // 0-1, based on historical pass/fail rate
  coverage: {
    lines?: number;
    functions?: number;
    branches?: number;
    statements?: number;
  };
  metadata: {
    browser?: string[];
    viewport?: string[];
    requires?: string[]; // external dependencies
    flaky?: boolean;
    slow?: boolean;
  };
}

export interface TestSuite {
  id: string;
  name: string;
  tests: TestCase[];
  type: TestType;
  featureArea: FeatureArea;
  enabled: boolean;
  ciConfig: {
    lightning: boolean;
    comprehensive: boolean;
    quality: boolean;
  };
}

export interface TestPyramidMetrics {
  unit: {
    count: number;
    percentage: number;
    avgDuration: number;
    stability: number;
  };
  integration: {
    count: number;
    percentage: number;
    avgDuration: number;
    stability: number;
  };
  e2e: {
    count: number;
    percentage: number;
    avgDuration: number;
    stability: number;
  };
  total: number;
  pyramidHealth: 'optimal' | 'warning' | 'inverted';
  recommendations: string[];
}

export interface TestExecution {
  id: string;
  timestamp: string;
  testId: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  duration: number;
  ciTier: CITier;
  error?: string;
  retries: number;
  environment: {
    os: string;
    browser?: string;
    viewport?: string;
    node: string;
  };
}

export interface TestConfiguration {
  version: string;
  lastUpdated: string;
  suites: TestSuite[];
  ciConfig: {
    lightning: {
      timeout: number;
      retries: number;
      parallel: boolean;
      maxWorkers: number;
      include: string[];
      exclude: string[];
    };
    comprehensive: {
      timeout: number;
      retries: number;
      parallel: boolean;
      maxWorkers: number;
      include: string[];
      exclude: string[];
    };
    quality: {
      timeout: number;
      retries: number;
      parallel: boolean;
      maxWorkers: number;
      include: string[];
      exclude: string[];
    };
  };
  pyramidTargets: {
    unit: { min: number; max: number; target: number };
    integration: { min: number; max: number; target: number };
    e2e: { min: number; max: number; target: number };
  };
  qualityGates: {
    coverage: {
      lines: number;
      functions: number;
      branches: number;
      statements: number;
    };
    stability: {
      minimum: number;
      critical: number;
    };
    performance: {
      unitMaxDuration: number;
      integrationMaxDuration: number;
      e2eMaxDuration: number;
    };
  };
}

export interface TestAnalytics {
  historical: {
    date: string;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    coverage: number;
  }[];
  trends: {
    stability: 'improving' | 'stable' | 'declining';
    coverage: 'improving' | 'stable' | 'declining';
    performance: 'improving' | 'stable' | 'declining';
  };
  hotspots: {
    flaky: TestCase[];
    slow: TestCase[];
    failing: TestCase[];
  };
  coverage: {
    byFeature: Record<FeatureArea, number>;
    byType: Record<TestType, number>;
    gaps: string[];
  };
}
