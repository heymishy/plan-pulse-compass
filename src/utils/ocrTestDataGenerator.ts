/**
 * OCR Test Data Generator - Ground Truth Dataset Creation
 * Phase 3 implementation for SteerCo OCR feature evaluation
 */

import type {
  GroundTruthDataset,
  GroundTruthProjectStatus,
  GroundTruthRisk,
  GroundTruthFinancial,
  GroundTruthMilestone,
  GroundTruthTeamUpdate,
  AccuracyBenchmark,
  PerformanceMetrics,
} from './ocrAccuracyMeasurement';
import type { OCRExtractionResult } from '@/types/ocrTypes';

export interface TestDocumentTemplate {
  id: string;
  name: string;
  format: 'pdf' | 'pptx' | 'image';
  quality: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
  pages: number;
  textDensity: number;
  template: string;
}

export interface SyntheticDocumentConfig {
  template: TestDocumentTemplate;
  projects: string[];
  teams: string[];
  risks: string[];
  seed?: number; // For reproducible results
}

/**
 * Built-in test document templates for various scenarios
 */
export const TEST_DOCUMENT_TEMPLATES: TestDocumentTemplate[] = [
  {
    id: 'simple-steerco',
    name: 'Simple Steering Committee Report',
    format: 'pdf',
    quality: 'high',
    complexity: 'simple',
    pages: 3,
    textDensity: 0.7,
    template: `
# Steering Committee Report - {{date}}

## Executive Summary
Overall portfolio status: {{portfolioStatus}}

## Project Status Updates

{{#projects}}
### {{name}}
- Status: {{status}}
- RAG Reason: {{ragReason}}
- Progress: {{progress}}%

{{/projects}}

## Key Risks

{{#risks}}
- Risk: {{description}}
- Impact: {{impact}}
- Probability: {{probability}}
- Mitigation: {{mitigation}}

{{/risks}}

## Financial Summary

{{#financials}}
### {{projectName}}
- Budget: {{currency}}{{budgetAmount}}
- Actual: {{currency}}{{actualAmount}}
- Forecast: {{currency}}{{forecastAmount}}
- Variance: {{variance}}%

{{/financials}}

## Upcoming Milestones

{{#milestones}}
- {{name}} ({{projectName}}): {{targetDate}} - {{status}}
{{/milestones}}

## Team Utilization

{{#teams}}
- {{name}}: {{utilization}}% utilization
{{/teams}}
    `,
  },
  {
    id: 'complex-steerco',
    name: 'Complex Multi-Project Report',
    format: 'pptx',
    quality: 'medium',
    complexity: 'complex',
    pages: 15,
    textDensity: 0.8,
    template: `
# Q{{quarter}} {{year}} Portfolio Review

## Portfolio Overview
Total Projects: {{totalProjects}}
Portfolio RAG: {{portfolioRag}}

## Executive Dashboard

| Project | Status | Budget | Actual | Variance |
|---------|--------|--------|--------|----------|
{{#projects}}
| {{name}} | {{status}} | {{budget}} | {{actual}} | {{variance}} |
{{/projects}}

## Project Deep Dives

{{#projects}}
### {{name}} - {{status}} Status

**Key Metrics:**
- Budget: {{currency}}{{budgetAmount}}K
- Spent: {{currency}}{{actualAmount}}K  
- Forecast: {{currency}}{{forecastAmount}}K
- Team: {{teamName}} ({{utilization}}% utilized)

**Progress Update:**
{{progressUpdate}}

**Risks & Issues:**
{{#projectRisks}}
• {{description}} - {{impact}} impact, {{probability}} probability
  Mitigation: {{mitigation}}
{{/projectRisks}}

**Next Milestones:**
{{#projectMilestones}}
• {{name}}: {{targetDate}} ({{status}})
{{/projectMilestones}}

---
{{/projects}}

## Cross-Project Risks

{{#portfolioRisks}}
### {{category}} Risk: {{title}}
- **Description:** {{description}}
- **Impact:** {{impact}} ({{impactDescription}})
- **Probability:** {{probability}}
- **Projects Affected:** {{affectedProjects}}
- **Mitigation Strategy:** {{mitigation}}
- **Owner:** {{owner}}
- **Due Date:** {{mitigationDate}}

{{/portfolioRisks}}

## Resource Allocation

{{#teams}}
### {{name}} Team
- **Current Utilization:** {{utilization}}%
- **Capacity:** {{capacity}} FTE
- **Key Projects:** {{assignedProjects}}
- **Commentary:** {{commentary}}

{{/teams}}

## Financial Deep Dive

### Budget vs Actual Analysis
{{#quarterlyFinancials}}
**Q{{quarter}} {{year}}:**
- Planned Spend: {{currency}}{{plannedSpend}}K
- Actual Spend: {{currency}}{{actualSpend}}K
- Variance: {{variance}}% ({{varianceAmount}}K)
- Forecast: {{currency}}{{forecastSpend}}K

{{/quarterlyFinancials}}

### Project Financial Summary
{{#projectFinancials}}
**{{projectName}}:**
- Original Budget: {{currency}}{{originalBudget}}K
- Current Budget: {{currency}}{{currentBudget}}K
- Spent to Date: {{currency}}{{spentToDate}}K ({{spentPercentage}}%)
- Forecast to Complete: {{currency}}{{forecastToComplete}}K
- Expected Final Cost: {{currency}}{{expectedFinalCost}}K
- Variance from Original: {{varianceFromOriginal}}% ({{varianceAmount}}K)

{{/projectFinancials}}

## Milestone Tracking

### Completed This Quarter
{{#completedMilestones}}
✅ {{name}} ({{projectName}}) - Completed {{completedDate}}
{{/completedMilestones}}

### Due Next Quarter  
{{#upcomingMilestones}}
🎯 {{name}} ({{projectName}}) - Due {{dueDate}} - {{status}}
{{#if atRisk}}⚠️ AT RISK: {{riskReason}}{{/if}}
{{/upcomingMilestones}}

### Overdue
{{#overdueMilestones}}
🚨 {{name}} ({{projectName}}) - Was due {{originalDueDate}} - {{daysOverdue}} days overdue
   Revised date: {{revisedDueDate}}
   Reason: {{delayReason}}
{{/overdueMilestones}}

## Action Items & Next Steps

{{#actionItems}}
### {{category}}
{{#items}}
- **Action:** {{description}}
- **Owner:** {{owner}}  
- **Due Date:** {{dueDate}}
- **Status:** {{status}}
{{#if dependencies}}
- **Dependencies:** {{dependencies}}
{{/if}}

{{/items}}
{{/actionItems}}

## Appendix

### Definitions
- **RAG Status:** Red (Critical Issues), Amber (At Risk), Green (On Track), Blue (Complete)
- **Utilization:** Percentage of team capacity allocated to tracked projects
- **Variance:** Difference between planned and actual spend as percentage

### Contact Information
- **Portfolio Manager:** {{portfolioManager}}
- **Finance Lead:** {{financeLead}}  
- **PMO Lead:** {{pmoLead}}

---
*Report generated on {{reportDate}}*
*Next report due: {{nextReportDate}}*
    `,
  },
  {
    id: 'low-quality-scan',
    name: 'Low Quality Scanned Document',
    format: 'image',
    quality: 'low',
    complexity: 'moderate',
    pages: 5,
    textDensity: 0.6,
    template: `
// This template simulates OCR challenges from poor quality scans
STEERING C0MMITTEE REP0RT
Date: {{date}}

PR0JECT STATUS UPD4TES

{{#projects}}
{{name}} - St4tus: {{status}}
RAG Re4son: {{ragReason}}
{{/projects}}

R1SKS 4ND ISSUES

{{#risks}}
Risk: {{description}}
lmpact: {{impact}} | Prob4bility: {{probability}}
Mitigation: {{mitigation}}
{{/risks}}

BUDG3T UPD4TES

{{#financials}}
{{projectName}}
Budget: $100K
4ctual: $85K
V4riance: -15%
{{/financials}}

TE4M UTILIZ4TION

{{#teams}}
{{name}} Team: {{utilization}}% utilized
{{#if commentary}}Commentary: {{commentary}}{{/if}}
{{/teams}}

M1LEST0NES

{{#milestones}}
{{name}} ({{projectName}}) - {{targetDate}} - {{status}}
{{/milestones}}
    `,
  },
];

/**
 * Generate a ground truth dataset from a template
 */
export function generateGroundTruthDataset(
  config: SyntheticDocumentConfig
): GroundTruthDataset {
  const { template, projects, teams, risks, seed = 12345 } = config;

  // Set up deterministic random number generator
  const rng = createSeededRandom(seed);

  const documentId = `test-doc-${template.id}-${Date.now()}`;

  // Generate expected entities based on template complexity
  const expectedProjectStatuses = generateProjectStatuses(
    projects,
    template.complexity,
    rng
  );
  const expectedRisks = generateRisks(risks, template.complexity, rng);
  const expectedFinancials = generateFinancials(
    projects,
    template.complexity,
    rng
  );
  const expectedMilestones = generateMilestones(
    projects,
    template.complexity,
    rng
  );
  const expectedTeamUpdates = generateTeamUpdates(
    teams,
    template.complexity,
    rng
  );

  const totalExpectedEntities =
    expectedProjectStatuses.length +
    expectedRisks.length +
    expectedFinancials.length +
    expectedMilestones.length +
    expectedTeamUpdates.length;

  return {
    documentId,
    expectedProjectStatuses,
    expectedRisks,
    expectedFinancials,
    expectedMilestones,
    expectedTeamUpdates,
    totalExpectedEntities,
    documentMetadata: {
      pages: template.pages,
      format: template.format,
      quality: template.quality,
      textDensity: template.textDensity,
    },
  };
}

/**
 * Generate test project statuses
 */
function generateProjectStatuses(
  projects: string[],
  complexity: string,
  rng: () => number
): GroundTruthProjectStatus[] {
  const statuses: ('red' | 'amber' | 'green' | 'blue' | 'complete')[] = [
    'red',
    'amber',
    'green',
    'blue',
    'complete',
  ];

  const reasons = [
    'On track with all deliverables',
    'Minor delays in testing phase',
    'Resource constraints affecting timeline',
    'Critical blocker identified',
    'Scope changes impacting delivery',
    'Dependencies causing delays',
    'Budget variance requires attention',
    'Quality issues in development',
    'Stakeholder approval pending',
    'Technical debt being addressed',
  ];

  const count =
    complexity === 'simple'
      ? Math.min(3, projects.length)
      : complexity === 'moderate'
        ? Math.min(5, projects.length)
        : projects.length;

  return projects.slice(0, count).map((project, index) => ({
    projectName: project,
    status: statuses[Math.floor(rng() * statuses.length)],
    ragReason: reasons[Math.floor(rng() * reasons.length)],
    position: {
      page: Math.floor(index / 3) + 1,
      section: 'Project Status Updates',
    },
  }));
}

/**
 * Generate test risks
 */
function generateRisks(
  riskDescriptions: string[],
  complexity: string,
  rng: () => number
): GroundTruthRisk[] {
  const impacts: ('low' | 'medium' | 'high' | 'critical')[] = [
    'low',
    'medium',
    'high',
    'critical',
  ];

  const probabilities: ('low' | 'medium' | 'high')[] = [
    'low',
    'medium',
    'high',
  ];

  const mitigations = [
    'Monitor closely and escalate if needed',
    'Implement contingency plan',
    'Increase resource allocation',
    'Engage external consultants',
    'Adjust timeline and scope',
    'Enhanced stakeholder communication',
    'Technical architecture review',
    'Process improvement initiative',
  ];

  const count = complexity === 'simple' ? 2 : complexity === 'moderate' ? 4 : 6;

  return riskDescriptions.slice(0, count).map((description, index) => ({
    riskDescription: description,
    impact: impacts[Math.floor(rng() * impacts.length)],
    probability: probabilities[Math.floor(rng() * probabilities.length)],
    mitigation: mitigations[Math.floor(rng() * mitigations.length)],
    position: {
      page: Math.floor(index / 2) + 2,
      section: 'Risks and Issues',
    },
  }));
}

/**
 * Generate test financial data
 */
function generateFinancials(
  projects: string[],
  complexity: string,
  rng: () => number
): GroundTruthFinancial[] {
  const currencies = ['USD', 'GBP', 'EUR'];

  const count =
    complexity === 'simple'
      ? Math.min(2, projects.length)
      : complexity === 'moderate'
        ? Math.min(4, projects.length)
        : projects.length;

  return projects.slice(0, count).map((project, index) => {
    const budget = Math.floor(rng() * 1000 + 100) * 1000; // 100K to 1.1M
    const actual = Math.floor(budget * (0.5 + rng() * 0.6)); // 50% to 110% of budget
    const forecast = Math.floor(budget * (0.8 + rng() * 0.4)); // 80% to 120% of budget

    return {
      projectName: project,
      budgetAmount: budget,
      actualAmount: actual,
      forecastAmount: forecast,
      currency: currencies[Math.floor(rng() * currencies.length)],
      position: {
        page: Math.floor(index / 2) + 2,
        section: 'Financial Summary',
      },
    };
  });
}

/**
 * Generate test milestones
 */
function generateMilestones(
  projects: string[],
  complexity: string,
  rng: () => number
): GroundTruthMilestone[] {
  const milestoneNames = [
    'Project Kickoff',
    'Requirements Complete',
    'Design Review',
    'Development Complete',
    'Testing Complete',
    'UAT Sign-off',
    'Go-Live',
    'Post-Implementation Review',
  ];

  const statuses: ('not-started' | 'in-progress' | 'completed' | 'delayed')[] =
    ['not-started', 'in-progress', 'completed', 'delayed'];

  const count =
    complexity === 'simple' ? 3 : complexity === 'moderate' ? 6 : 10;

  const milestones: GroundTruthMilestone[] = [];

  for (let i = 0; i < count; i++) {
    const project = projects[Math.floor(rng() * projects.length)];
    const name = milestoneNames[Math.floor(rng() * milestoneNames.length)];
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() + Math.floor(rng() * 12 - 3)); // -3 to +9 months

    milestones.push({
      milestoneName: name,
      projectName: project,
      targetDate: baseDate.toISOString().split('T')[0],
      status: statuses[Math.floor(rng() * statuses.length)],
      position: {
        page: Math.floor(i / 4) + 3,
        section: 'Upcoming Milestones',
      },
    });
  }

  return milestones;
}

/**
 * Generate test team updates
 */
function generateTeamUpdates(
  teams: string[],
  complexity: string,
  rng: () => number
): GroundTruthTeamUpdate[] {
  const commentaries = [
    'Team operating at full capacity',
    'Some bandwidth available for additional work',
    'Overallocated due to concurrent projects',
    'Waiting for new team members to start',
    'Cross-training in progress',
    'Focus on technical debt reduction',
    'Supporting multiple high-priority initiatives',
  ];

  const count =
    complexity === 'simple'
      ? Math.min(2, teams.length)
      : complexity === 'moderate'
        ? Math.min(4, teams.length)
        : teams.length;

  return teams.slice(0, count).map((team, index) => ({
    teamName: team,
    utilization: Math.floor(rng() * 50 + 50), // 50% to 100%
    commentary:
      rng() > 0.5
        ? commentaries[Math.floor(rng() * commentaries.length)]
        : undefined,
    position: {
      page: Math.floor(index / 3) + 3,
      section: 'Team Utilization',
    },
  }));
}

/**
 * Create a benchmark with simulated performance metrics
 */
export async function createBenchmarkWithSimulatedPerformance(
  groundTruth: GroundTruthDataset,
  extractionResult: OCRExtractionResult,
  simulatedPerformance?: Partial<PerformanceMetrics>
): Promise<AccuracyBenchmark> {
  const defaultPerformance: PerformanceMetrics = {
    processingTime: 5000 + Math.random() * 10000, // 5-15 seconds
    memoryUsage: 50 * 1024 * 1024 + Math.random() * 100 * 1024 * 1024, // 50-150MB
    ocrTime: 2000 + Math.random() * 5000, // 2-7 seconds
    extractionTime: 500 + Math.random() * 1000, // 0.5-1.5 seconds
    mappingTime: 200 + Math.random() * 300, // 0.2-0.5 seconds
    throughput: 0, // Will be calculated
  };

  const performance = { ...defaultPerformance, ...simulatedPerformance };
  performance.throughput =
    groundTruth.totalExpectedEntities / (performance.processingTime / 1000);

  // Import dynamically to avoid circular dependency
  const { calculateAccuracyMetrics } = await import('./ocrAccuracyMeasurement');
  const accuracy = calculateAccuracyMetrics(groundTruth, extractionResult);

  return {
    groundTruth,
    extractionResult,
    accuracy,
    performance,
    timestamp: new Date().toISOString(),
    documentType: 'steering-committee',
    documentId: groundTruth.documentId,
  };
}

/**
 * Generate a complete test suite with multiple documents
 */
export function generateTestSuite(config: {
  templateIds?: string[];
  projectCount?: number;
  teamCount?: number;
  riskCount?: number;
  seed?: number;
}): {
  groundTruthDatasets: GroundTruthDataset[];
  syntheticDocuments: string[];
} {
  const {
    templateIds = ['simple-steerco', 'complex-steerco', 'low-quality-scan'],
    projectCount = 8,
    teamCount = 5,
    riskCount = 6,
    seed = 54321,
  } = config;

  const rng = createSeededRandom(seed);

  // Generate test data
  const projects = generateProjectNames(projectCount, rng);
  const teams = generateTeamNames(teamCount, rng);
  const risks = generateRiskDescriptions(riskCount, rng);

  const groundTruthDatasets: GroundTruthDataset[] = [];
  const syntheticDocuments: string[] = [];

  for (const templateId of templateIds) {
    const template = TEST_DOCUMENT_TEMPLATES.find(t => t.id === templateId);
    if (!template) continue;

    const dataset = generateGroundTruthDataset({
      template,
      projects,
      teams,
      risks,
      seed: seed + templateIds.indexOf(templateId),
    });

    groundTruthDatasets.push(dataset);

    // Generate synthetic document content (simplified)
    syntheticDocuments.push(generateSyntheticDocument(template, dataset, rng));
  }

  return {
    groundTruthDatasets,
    syntheticDocuments,
  };
}

/**
 * Simple seeded random number generator for reproducible results
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return (state >>> 0) / 0x100000000;
  };
}

/**
 * Generate realistic project names
 */
function generateProjectNames(count: number, rng: () => number): string[] {
  const prefixes = [
    'Digital',
    'Customer',
    'Platform',
    'Data',
    'Cloud',
    'Mobile',
    'AI',
    'Legacy',
  ];
  const suffixes = [
    'Transformation',
    'Migration',
    'Modernization',
    'Enhancement',
    'Initiative',
    'Platform',
    'System',
    'Portal',
  ];

  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const prefix = prefixes[Math.floor(rng() * prefixes.length)];
    const suffix = suffixes[Math.floor(rng() * suffixes.length)];
    names.push(`${prefix} ${suffix}`);
  }

  return [...new Set(names)].slice(0, count); // Remove duplicates
}

/**
 * Generate realistic team names
 */
function generateTeamNames(count: number, rng: () => number): string[] {
  const teams = [
    'Frontend Development',
    'Backend Engineering',
    'DevOps & Infrastructure',
    'Quality Assurance',
    'Product Management',
    'UX/UI Design',
    'Data Engineering',
    'Security',
    'Architecture',
    'Business Analysis',
  ];

  return teams.slice(0, count);
}

/**
 * Generate realistic risk descriptions
 */
function generateRiskDescriptions(count: number, rng: () => number): string[] {
  const risks = [
    'Key technical resources may become unavailable during critical delivery phase',
    'Third-party API integration complexity higher than anticipated',
    'Regulatory compliance requirements not fully defined',
    'Budget constraints may limit scope delivery',
    'Dependency on legacy system modernization causing delays',
    'Change management resistance from end users',
    'Technical architecture decisions impacting performance',
    'Vendor delivery timeline uncertainty',
    'Cross-functional team coordination challenges',
    'Data migration complexity and quality issues',
  ];

  return risks.slice(0, count);
}

/**
 * Generate synthetic document content (simplified template rendering)
 */
function generateSyntheticDocument(
  template: TestDocumentTemplate,
  groundTruth: GroundTruthDataset,
  rng: () => number
): string {
  let content = template.template;

  // Simple template variable replacement
  content = content.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
  content = content.replace(/\{\{portfolioStatus\}\}/g, 'Green');

  // Replace project sections (simplified)
  const projectSection = groundTruth.expectedProjectStatuses
    .map(
      p =>
        `${p.projectName}: ${p.status}${p.ragReason ? ` - ${p.ragReason}` : ''}`
    )
    .join('\n');
  content = content.replace(
    /\{\{#projects\}\}.*?\{\{\/projects\}\}/gs,
    projectSection
  );

  // Replace risk sections (simplified)
  const riskSection = groundTruth.expectedRisks
    .map(
      r =>
        `${r.riskDescription} (${r.impact} impact, ${r.probability || 'unknown'} probability)`
    )
    .join('\n');
  content = content.replace(/\{\{#risks\}\}.*?\{\{\/risks\}\}/gs, riskSection);

  return content;
}

/**
 * Create sample test cases for different document qualities
 */
export const SAMPLE_TEST_CASES = {
  highQuality: {
    template: TEST_DOCUMENT_TEMPLATES[0], // simple-steerco
    projects: ['Digital Transformation', 'Customer Portal', 'Data Migration'],
    teams: ['Development Team', 'QA Team'],
    risks: ['Resource availability', 'Technical complexity'],
  },
  mediumQuality: {
    template: TEST_DOCUMENT_TEMPLATES[1], // complex-steerco
    projects: [
      'Platform Modernization',
      'Mobile App',
      'Analytics Dashboard',
      'Legacy System',
    ],
    teams: ['Frontend', 'Backend', 'DevOps', 'Design'],
    risks: [
      'Third-party dependencies',
      'Compliance requirements',
      'Budget constraints',
    ],
  },
  lowQuality: {
    template: TEST_DOCUMENT_TEMPLATES[2], // low-quality-scan
    projects: ['Cloud Migration', 'Security Enhancement'],
    teams: ['Infrastructure', 'Security'],
    risks: ['Migration complexity', 'Downtime risk'],
  },
};
