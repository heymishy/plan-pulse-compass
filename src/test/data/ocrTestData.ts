/**
 * Test data for OCR functionality
 */

import type {
  OCRExtractionResult,
  EntityMappingResult,
  ExtractedProjectStatus,
  ExtractedRisk,
  ExtractedFinancial,
  ExtractedMilestone,
  ExtractedTeamUpdate,
  ExtractedCommentary,
  MappingCandidate,
} from '@/types/ocrTypes';

export const mockSteeringCommitteeText = `
Executive Summary
================
Q2 2024 Steering Committee Review

Project Status Updates
======================
Project Alpha: Green - MVP delivered on schedule, user feedback positive
Project Beta: Amber - Behind schedule due to integration challenges  
Project Gamma: Red - Critical path issues with third-party dependencies
Project Delta: Blue - On hold pending strategic review
Project Epsilon: Complete - Successfully launched to production

Financial Summary
=================
Project Alpha Budget: $150,000 | Actual: $142,000 | Variance: -$8,000
Project Beta Forecast: $280,000 | Spent: $320,000 | Over budget by $40,000
Project Gamma Budget: €200,000 | Actual: €195,000

Risk & Issues
=============
Risk: Database migration complexity - High impact - Medium probability - Mitigation: Database specialist consultant hired
Risk: Third-party API rate limits - Medium impact - High probability - Mitigation: Implement caching layer
Issue: Team capacity constraints in Q3 - Low impact - Plan: Temporary contractor support

Milestone Updates
=================
Milestone: Alpha MVP due 2024-06-15 - Completed on 2024-06-12
Milestone: Beta Integration Testing due 2024-07-30 - In Progress  
Milestone: Gamma Architecture Review due 2024-08-15 - Delayed to 2024-08-30

Team Utilization
================
Team Engineering: 90% utilization - Working on performance optimization and bug fixes
Team Design: 75% utilization - Focusing on user experience improvements
Team QA: 85% utilization - Expanding automated testing coverage
Team DevOps: 95% utilization - Supporting multiple production deployments

Progress Commentary
===================
Alpha team demonstrates excellent execution and delivery capability
Beta team facing integration complexity but making steady progress
Gamma team requires immediate attention and additional resources
Design team producing high-quality deliverables with positive stakeholder feedback
QA team improving overall product quality through comprehensive testing
`;

export const mockExtractedProjectStatus: ExtractedProjectStatus[] = [
  {
    text: 'Project Alpha: Green',
    confidence: 0.95,
    projectName: 'Project Alpha',
    status: 'green',
    ragReason: 'MVP delivered on schedule, user feedback positive',
  },
  {
    text: 'Project Beta: Amber',
    confidence: 0.92,
    projectName: 'Project Beta',
    status: 'amber',
    ragReason: 'Behind schedule due to integration challenges',
  },
  {
    text: 'Project Gamma: Red',
    confidence: 0.89,
    projectName: 'Project Gamma',
    status: 'red',
    ragReason: 'Critical path issues with third-party dependencies',
  },
  {
    text: 'Project Delta: Blue',
    confidence: 0.87,
    projectName: 'Project Delta',
    status: 'blue',
  },
  {
    text: 'Project Epsilon: Complete',
    confidence: 0.94,
    projectName: 'Project Epsilon',
    status: 'complete',
  },
];

export const mockExtractedRisks: ExtractedRisk[] = [
  {
    text: 'Risk: Database migration complexity',
    confidence: 0.88,
    riskDescription: 'Database migration complexity',
    impact: 'high',
    probability: 'medium',
    mitigation: 'Database specialist consultant hired',
    category: 'technical',
  },
  {
    text: 'Risk: Third-party API rate limits',
    confidence: 0.85,
    riskDescription: 'Third-party API rate limits',
    impact: 'medium',
    probability: 'high',
    mitigation: 'Implement caching layer',
    category: 'external',
  },
  {
    text: 'Issue: Team capacity constraints in Q3',
    confidence: 0.82,
    riskDescription: 'Team capacity constraints in Q3',
    impact: 'low',
    mitigation: 'Temporary contractor support',
    category: 'resource',
  },
];

export const mockExtractedFinancials: ExtractedFinancial[] = [
  {
    text: 'Project Alpha Budget: $150,000',
    confidence: 0.93,
    projectName: 'Project Alpha',
    budgetAmount: 150000,
    actualAmount: 142000,
    variance: -8000,
    currency: 'USD',
  },
  {
    text: 'Project Beta Forecast: $280,000',
    confidence: 0.91,
    projectName: 'Project Beta',
    forecastAmount: 280000,
    actualAmount: 320000,
    variance: 40000,
    currency: 'USD',
  },
  {
    text: 'Project Gamma Budget: €200,000',
    confidence: 0.89,
    projectName: 'Project Gamma',
    budgetAmount: 200000,
    actualAmount: 195000,
    currency: 'EUR',
  },
];

export const mockExtractedMilestones: ExtractedMilestone[] = [
  {
    text: 'Milestone: Alpha MVP due 2024-06-15',
    confidence: 0.92,
    milestoneName: 'Alpha MVP',
    projectName: 'Project Alpha',
    targetDate: '2024-06-15',
    actualDate: '2024-06-12',
    status: 'completed',
  },
  {
    text: 'Milestone: Beta Integration Testing due 2024-07-30',
    confidence: 0.88,
    milestoneName: 'Beta Integration Testing',
    projectName: 'Project Beta',
    targetDate: '2024-07-30',
    status: 'in-progress',
  },
  {
    text: 'Milestone: Gamma Architecture Review due 2024-08-15',
    confidence: 0.85,
    milestoneName: 'Gamma Architecture Review',
    projectName: 'Project Gamma',
    targetDate: '2024-08-15',
    actualDate: '2024-08-30',
    status: 'delayed',
  },
];

export const mockExtractedTeamUpdates: ExtractedTeamUpdate[] = [
  {
    text: 'Team Engineering: 90% utilization',
    confidence: 0.94,
    teamName: 'Team Engineering',
    utilization: 90,
    commentary: 'Working on performance optimization and bug fixes',
  },
  {
    text: 'Team Design: 75% utilization',
    confidence: 0.91,
    teamName: 'Team Design',
    utilization: 75,
    commentary: 'Focusing on user experience improvements',
  },
  {
    text: 'Team QA: 85% utilization',
    confidence: 0.89,
    teamName: 'Team QA',
    utilization: 85,
    commentary: 'Expanding automated testing coverage',
  },
  {
    text: 'Team DevOps: 95% utilization',
    confidence: 0.87,
    teamName: 'Team DevOps',
    utilization: 95,
    commentary: 'Supporting multiple production deployments',
  },
];

export const mockExtractedCommentary: ExtractedCommentary[] = [
  {
    text: 'Alpha team demonstrates excellent execution',
    confidence: 0.86,
    projectName: 'Project Alpha',
    section: 'progress',
    content:
      'Alpha team demonstrates excellent execution and delivery capability',
    sentiment: 'positive',
  },
  {
    text: 'Beta team facing integration complexity',
    confidence: 0.83,
    projectName: 'Project Beta',
    section: 'issues',
    content:
      'Beta team facing integration complexity but making steady progress',
    sentiment: 'neutral',
  },
  {
    text: 'Gamma team requires immediate attention',
    confidence: 0.88,
    projectName: 'Project Gamma',
    section: 'risks',
    content: 'Gamma team requires immediate attention and additional resources',
    sentiment: 'negative',
  },
  {
    text: 'Design team producing high-quality deliverables',
    confidence: 0.84,
    projectName: 'Project Design',
    section: 'achievements',
    content:
      'Design team producing high-quality deliverables with positive stakeholder feedback',
    sentiment: 'positive',
  },
];

export const mockOCRExtractionResult: OCRExtractionResult = {
  rawText: mockSteeringCommitteeText,
  projectStatuses: mockExtractedProjectStatus,
  risks: mockExtractedRisks,
  financials: mockExtractedFinancials,
  milestones: mockExtractedMilestones,
  teamUpdates: mockExtractedTeamUpdates,
  commentary: mockExtractedCommentary,
  extractionMetadata: {
    totalConfidence: 0.89,
    processingTime: 245,
    extractedEntities: 19,
    documentType: 'steering-committee',
  },
};

export const mockMappingCandidates: MappingCandidate[] = [
  {
    extractedEntity: mockExtractedProjectStatus[0],
    existingEntityId: 'proj-alpha-1',
    existingEntityType: 'project',
    matchConfidence: 0.98,
    mappingReason: 'Exact name match for "Project Alpha"',
    conflictLevel: 'none',
  },
  {
    extractedEntity: mockExtractedProjectStatus[1],
    existingEntityId: 'proj-beta-1',
    existingEntityType: 'project',
    matchConfidence: 0.95,
    mappingReason: 'High confidence name match for "Project Beta"',
    conflictLevel: 'low',
  },
  {
    extractedEntity: mockExtractedTeamUpdates[0],
    existingEntityId: 'team-eng-1',
    existingEntityType: 'team',
    matchConfidence: 0.92,
    mappingReason: 'Team name similarity match for "Team Engineering"',
    conflictLevel: 'none',
  },
  {
    extractedEntity: mockExtractedMilestones[0],
    existingEntityId: 'milestone-alpha-mvp',
    existingEntityType: 'milestone',
    matchConfidence: 0.88,
    mappingReason: 'Milestone name and project context match',
    conflictLevel: 'low',
  },
];

export const mockConflictingMappings: MappingCandidate[] = [
  {
    extractedEntity: mockExtractedProjectStatus[2], // Gamma - Red status
    existingEntityId: 'proj-gamma-1',
    existingEntityType: 'project',
    matchConfidence: 0.85,
    mappingReason: 'Project name match but status conflict detected',
    conflictLevel: 'high',
  },
];

export const mockEntityMappingResult: EntityMappingResult = {
  mappings: mockMappingCandidates,
  unmappedEntities: [
    mockExtractedProjectStatus[4], // Project Epsilon - no existing match
    mockExtractedRisks[2], // Team capacity risk - standalone
  ],
  conflicts: mockConflictingMappings,
  recommendations: {
    autoApplyCount: 3,
    requiresReviewCount: 2,
    suggestedActions: [
      '3 high-confidence mappings can be applied automatically',
      '2 mappings require manual review due to lower confidence',
      '1 potential conflict detected - manual resolution recommended',
      '2 entities could not be mapped - consider creating new entries',
    ],
  },
};

// Edge case test data
export const mockMalformedText = `
Project: Green
: Red  
Project Alpha Green
Beta: 
Team: 
Risk Database
Milestone due
Budget: 
`;

export const mockEmptyExtractionResult: OCRExtractionResult = {
  rawText: '',
  projectStatuses: [],
  risks: [],
  financials: [],
  milestones: [],
  teamUpdates: [],
  commentary: [],
  extractionMetadata: {
    totalConfidence: 0,
    processingTime: 5,
    extractedEntities: 0,
    documentType: 'steering-committee',
  },
};

export const mockLargeExtractionResult: OCRExtractionResult = {
  rawText: mockSteeringCommitteeText.repeat(10),
  projectStatuses: [
    ...mockExtractedProjectStatus,
    ...mockExtractedProjectStatus.map((status, index) => ({
      ...status,
      projectName: `${status.projectName} Copy ${index + 1}`,
    })),
  ],
  risks: [...mockExtractedRisks, ...mockExtractedRisks],
  financials: [...mockExtractedFinancials],
  milestones: [...mockExtractedMilestones],
  teamUpdates: [...mockExtractedTeamUpdates],
  commentary: [...mockExtractedCommentary],
  extractionMetadata: {
    totalConfidence: 0.87,
    processingTime: 1250,
    extractedEntities: 38,
    documentType: 'steering-committee',
  },
};

// Test utility functions
export const createMockFile = (
  name: string,
  type: string,
  content = 'mock file content'
): File => {
  return new File([content], name, { type });
};

export const createMockImageFile = (): File => {
  return createMockFile('test-image.png', 'image/png');
};

export const createMockPDFFile = (): File => {
  return createMockFile('test-document.pdf', 'application/pdf');
};

export const createMockInvalidFile = (): File => {
  return createMockFile('test-document.txt', 'text/plain');
};

// Confidence threshold test helpers
export const filterByConfidence = <T extends { confidence: number }>(
  entities: T[],
  threshold: number
): T[] => {
  return entities.filter(entity => entity.confidence >= threshold);
};

export const getHighConfidenceEntities = <T extends { confidence: number }>(
  entities: T[]
): T[] => {
  return filterByConfidence(entities, 0.8);
};

export const getLowConfidenceEntities = <T extends { confidence: number }>(
  entities: T[]
): T[] => {
  return entities.filter(
    entity => entity.confidence < 0.8 && entity.confidence >= 0.5
  );
};

// Mapping result helpers
export const getAutoApplyMappings = (
  mappingResult: EntityMappingResult
): MappingCandidate[] => {
  return mappingResult.mappings.filter(
    mapping => mapping.matchConfidence > 0.8
  );
};

export const getReviewRequiredMappings = (
  mappingResult: EntityMappingResult
): MappingCandidate[] => {
  return [
    ...mappingResult.mappings.filter(mapping => mapping.matchConfidence <= 0.8),
    ...mappingResult.conflicts,
  ];
};
