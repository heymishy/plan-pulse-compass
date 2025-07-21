/**
 * Types for OCR entity extraction and mapping
 * Supporting Phase 2 of SteerCo OCR implementation
 */

export interface ExtractedEntity {
  text: string;
  confidence: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractedProjectStatus extends ExtractedEntity {
  projectName: string;
  status: 'red' | 'amber' | 'green' | 'blue' | 'complete';
  ragReason?: string;
}

export interface ExtractedRisk extends ExtractedEntity {
  riskDescription: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability?: 'low' | 'medium' | 'high';
  mitigation?: string;
  category?: string;
}

export interface ExtractedFinancial extends ExtractedEntity {
  projectName: string;
  budgetAmount?: number;
  actualAmount?: number;
  forecastAmount?: number;
  variance?: number;
  variancePercentage?: number;
  currency?: string;
}

export interface ExtractedMilestone extends ExtractedEntity {
  milestoneName: string;
  projectName: string;
  targetDate?: string;
  actualDate?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
}

export interface ExtractedTeamUpdate extends ExtractedEntity {
  teamName: string;
  utilization?: number;
  capacity?: number;
  commentary?: string;
  members?: string[];
}

export interface ExtractedCommentary extends ExtractedEntity {
  projectName: string;
  section: 'progress' | 'risks' | 'issues' | 'achievements' | 'next-steps';
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface OCRExtractionResult {
  rawText: string;
  projectStatuses: ExtractedProjectStatus[];
  risks: ExtractedRisk[];
  financials: ExtractedFinancial[];
  milestones: ExtractedMilestone[];
  teamUpdates: ExtractedTeamUpdate[];
  commentary: ExtractedCommentary[];
  extractionMetadata: {
    totalConfidence: number;
    processingTime: number;
    extractedEntities: number;
    documentType: 'steering-committee' | 'project-report' | 'unknown';
  };
}

export interface MappingCandidate {
  extractedEntity: ExtractedEntity;
  existingEntityId?: string;
  existingEntityType: 'project' | 'epic' | 'team' | 'milestone' | 'risk';
  matchConfidence: number;
  mappingReason: string;
  conflictLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface EntityMappingResult {
  mappings: MappingCandidate[];
  unmappedEntities: ExtractedEntity[];
  conflicts: MappingCandidate[];
  recommendations: {
    autoApplyCount: number;
    requiresReviewCount: number;
    suggestedActions: string[];
  };
}

export interface OCRProcessingOptions {
  language: string;
  documentType?: 'steering-committee' | 'project-report' | 'financial-report';
  extractionMode: 'comprehensive' | 'targeted' | 'quick';
  confidenceThreshold: number;
  enableAutoMapping: boolean;
}

export interface SteerCoTemplate {
  id: string;
  name: string;
  description: string;
  patterns: {
    projectStatus: RegExp[];
    risks: RegExp[];
    financials: RegExp[];
    milestones: RegExp[];
    teamUpdates: RegExp[];
  };
  sections: {
    name: string;
    keywords: string[];
    position: 'header' | 'body' | 'footer' | 'sidebar';
  }[];
}

export const BUILTIN_STEERCO_TEMPLATES: SteerCoTemplate[] = [
  {
    id: 'standard-steerco',
    name: 'Standard Steering Committee',
    description: 'Generic steering committee presentation format',
    patterns: {
      projectStatus: [
        /(?:project|epic)\s*:?\s*([^\n]+?)(?:\s|\n)*(?:status|rag)\s*:?\s*(red|amber|green|blue|complete)/gi,
        /([^\n]+?)\s*-\s*(red|amber|green|blue|complete)/gi,
        /([^:]+?):\s*(red|amber|green|blue|complete)\s*-/gi,
      ],
      risks: [
        /risk\s*:?\s*([^\n]+?)(?:\n|impact|probability)/gi,
        /(?:risk|issue|blocker)\s*-\s*([^\n]+)/gi,
        /(?:risk|issue):\s*([^-]+?)\s*-\s*(high|medium|low)\s*impact/gi,
      ],
      financials: [
        /budget\s*:?\s*[$£€]?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /forecast\s*:?\s*[$£€]?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /variance\s*:?\s*([-+]?[$£€]?\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(\w+\s+\w+)\s+budget:\s*([$£€]?\d+(?:,\d{3})*)/gi,
      ],
      milestones: [
        /milestone\s*:?\s*([^\n]+?)(?:\s|\n)*(?:due|target|actual)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
        /milestone:\s*([^\n]+?)\s+due\s+(\d{4}-\d{2}-\d{2})/gi,
      ],
      teamUpdates: [
        /team\s*:?\s*([^\n]+?)(?:\s|\n)*(?:utilization|capacity)\s*:?\s*(\d+%?)/gi,
        /(team\s+[^:]+?):\s*(\d+%)\s*utilization/gi,
      ],
    },
    sections: [
      {
        name: 'Executive Summary',
        keywords: ['summary', 'overview', 'highlights'],
        position: 'header',
      },
      {
        name: 'Project Status',
        keywords: ['status', 'rag', 'progress'],
        position: 'body',
      },
      {
        name: 'Risks & Issues',
        keywords: ['risk', 'issue', 'blocker', 'concern'],
        position: 'body',
      },
      {
        name: 'Financials',
        keywords: ['budget', 'cost', 'financial', 'spend'],
        position: 'body',
      },
      {
        name: 'Next Steps',
        keywords: ['next steps', 'actions', 'recommendations'],
        position: 'footer',
      },
    ],
  },
];
