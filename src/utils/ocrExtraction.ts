/**
 * OCR Entity Extraction Utilities
 * Phase 2 implementation for SteerCo OCR feature
 */

import type {
  OCRExtractionResult,
  ExtractedProjectStatus,
  ExtractedRisk,
  ExtractedFinancial,
  ExtractedMilestone,
  ExtractedTeamUpdate,
  ExtractedCommentary,
  SteerCoTemplate,
  OCRProcessingOptions,
} from '@/types/ocrTypes';

import { BUILTIN_STEERCO_TEMPLATES } from '@/types/ocrTypes';

/**
 * Main entity extraction function
 */
export function extractEntitiesFromText(
  rawText: string,
  options: Partial<OCRProcessingOptions> = {}
): OCRExtractionResult {
  const startTime = performance.now();

  const defaultOptions: OCRProcessingOptions = {
    language: 'en',
    documentType: 'steering-committee',
    extractionMode: 'comprehensive',
    confidenceThreshold: 0.6,
    enableAutoMapping: true,
    ...options,
  };

  // Get template based on document type
  const template =
    BUILTIN_STEERCO_TEMPLATES.find(t => t.id === 'standard-steerco') ||
    BUILTIN_STEERCO_TEMPLATES[0];

  // Extract different entity types
  const projectStatuses = extractProjectStatuses(rawText, template);
  const risks = extractRisks(rawText, template);
  const financials = extractFinancials(rawText, template);
  const milestones = extractMilestones(rawText, template);
  const teamUpdates = extractTeamUpdates(rawText, template);
  const commentary = extractCommentary(rawText, template);

  // Calculate metadata
  const allExtractedEntities = [
    ...projectStatuses,
    ...risks,
    ...financials,
    ...milestones,
    ...teamUpdates,
    ...commentary,
  ];

  const totalConfidence =
    allExtractedEntities.length > 0
      ? allExtractedEntities.reduce(
          (sum, entity) => sum + entity.confidence,
          0
        ) / allExtractedEntities.length
      : 0;

  const processingTime = performance.now() - startTime;

  return {
    rawText,
    projectStatuses,
    risks,
    financials,
    milestones,
    teamUpdates,
    commentary,
    extractionMetadata: {
      totalConfidence,
      processingTime,
      extractedEntities: allExtractedEntities.length,
      documentType: defaultOptions.documentType || 'unknown',
    },
  };
}

/**
 * Extract project status updates
 */
function extractProjectStatuses(
  text: string,
  template: SteerCoTemplate
): ExtractedProjectStatus[] {
  const statuses: ExtractedProjectStatus[] = [];

  for (const pattern of template.patterns.projectStatus) {
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      if (match[1] && match[2]) {
        const projectName = match[1].trim();
        const status = normalizeStatus(match[2].toLowerCase().trim());

        if (status && projectName.length > 2) {
          statuses.push({
            text: match[0],
            confidence: calculateConfidence(match[0], 'project-status'),
            projectName,
            status,
            ragReason: extractStatusReason(text, match.index || 0),
          });
        }
      }
    }
  }

  return deduplicateEntities(statuses, 'projectName');
}

/**
 * Extract risks and issues
 */
function extractRisks(
  text: string,
  template: SteerCoTemplate
): ExtractedRisk[] {
  const risks: ExtractedRisk[] = [];

  for (const pattern of template.patterns.risks) {
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      if (match[1]) {
        const riskDescription = match[1].trim();

        if (riskDescription.length > 10) {
          risks.push({
            text: match[0],
            confidence: calculateConfidence(match[0], 'risk'),
            riskDescription,
            impact: extractImpactLevel(text, match.index || 0),
            probability: extractProbabilityLevel(text, match.index || 0),
            mitigation: extractMitigation(text, match.index || 0),
          });
        }
      }
    }
  }

  return deduplicateEntities(risks, 'riskDescription');
}

/**
 * Extract financial information
 */
function extractFinancials(
  text: string,
  template: SteerCoTemplate
): ExtractedFinancial[] {
  const financials: ExtractedFinancial[] = [];
  const projectContext = extractProjectContext(text);

  for (const pattern of template.patterns.financials) {
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      if (match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        const projectName = findNearestProject(
          text,
          match.index || 0,
          projectContext
        );

        if (!isNaN(amount) && projectName) {
          const financialType = determineMajorAccountType(match[0]);

          financials.push({
            text: match[0],
            confidence: calculateConfidence(match[0], 'financial'),
            projectName,
            [financialType]: amount,
            currency: extractCurrency(match[0]),
          });
        }
      }
    }
  }

  return consolidateFinancials(financials);
}

/**
 * Extract milestone information
 */
function extractMilestones(
  text: string,
  template: SteerCoTemplate
): ExtractedMilestone[] {
  const milestones: ExtractedMilestone[] = [];
  const projectContext = extractProjectContext(text);

  for (const pattern of template.patterns.milestones) {
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      if (match[1] && match[2]) {
        const milestoneName = match[1].trim();
        const dateStr = match[2].trim();
        const projectName = findNearestProject(
          text,
          match.index || 0,
          projectContext
        );

        if (milestoneName.length > 2 && projectName) {
          milestones.push({
            text: match[0],
            confidence: calculateConfidence(match[0], 'milestone'),
            milestoneName,
            projectName,
            targetDate: normalizeDate(dateStr),
            status: determineMilestoneStatus(text, match.index || 0),
          });
        }
      }
    }
  }

  return deduplicateEntities(milestones, 'milestoneName');
}

/**
 * Extract team updates
 */
function extractTeamUpdates(
  text: string,
  template: SteerCoTemplate
): ExtractedTeamUpdate[] {
  const teamUpdates: ExtractedTeamUpdate[] = [];

  for (const pattern of template.patterns.teamUpdates) {
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      if (match[1] && match[2]) {
        const teamName = match[1].trim();
        const utilizationStr = match[2].replace('%', '').trim();
        const utilization = parseFloat(utilizationStr);

        if (teamName.length > 1 && !isNaN(utilization)) {
          teamUpdates.push({
            text: match[0],
            confidence: calculateConfidence(match[0], 'team-update'),
            teamName,
            utilization,
            commentary: extractTeamCommentary(text, match.index || 0),
          });
        }
      }
    }
  }

  return deduplicateEntities(teamUpdates, 'teamName');
}

/**
 * Extract commentary and progress notes
 */
function extractCommentary(
  text: string,
  template: SteerCoTemplate
): ExtractedCommentary[] {
  const commentary: ExtractedCommentary[] = [];
  const projectContext = extractProjectContext(text);

  // Extract commentary from section headers
  for (const section of template.sections) {
    const sectionRegex = new RegExp(
      `(${section.keywords.join('|')})\\s*:?\\s*([^\\n]{20,200})`,
      'gi'
    );

    const matches = text.matchAll(sectionRegex);

    for (const match of matches) {
      if (match[2]) {
        const content = match[2].trim();
        const projectName = findNearestProject(
          text,
          match.index || 0,
          projectContext
        );

        if (content.length > 10 && projectName) {
          commentary.push({
            text: match[0],
            confidence: calculateConfidence(match[0], 'commentary'),
            projectName,
            section: mapSectionType(section.name),
            content,
            sentiment: analyzeSentiment(content),
          });
        }
      }
    }
  }

  return commentary;
}

// ===== Helper Functions =====

function normalizeStatus(
  status: string
): 'red' | 'amber' | 'green' | 'blue' | 'complete' | null {
  const cleanStatus = status.toLowerCase().trim().replace(/[\s-]/g, '');

  const statusMap: Record<
    string,
    'red' | 'amber' | 'green' | 'blue' | 'complete'
  > = {
    red: 'red',
    amber: 'amber',
    yellow: 'amber',
    orange: 'amber',
    green: 'green',
    blue: 'blue',
    complete: 'complete',
    completed: 'complete',
    done: 'complete',
    finished: 'complete',
    ontrack: 'green',
    atrisk: 'amber',
    delayed: 'red',
    blocked: 'red',
    critical: 'red',
  };

  return statusMap[cleanStatus] || null;
}

function calculateConfidence(matchText: string, entityType: string): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence based on context clues
  if (matchText.includes(':')) confidence += 0.1;
  if (matchText.includes('-')) confidence += 0.05;
  if (/[A-Z]/.test(matchText)) confidence += 0.05;
  if (/\d/.test(matchText)) confidence += 0.1;

  // Entity-specific adjustments
  switch (entityType) {
    case 'project-status':
      if (/project|epic/i.test(matchText)) confidence += 0.2;
      break;
    case 'financial':
      if (/[$£€]/.test(matchText)) confidence += 0.2;
      break;
    case 'risk':
      if (/risk|issue|problem/i.test(matchText)) confidence += 0.2;
      break;
  }

  return Math.min(confidence, 1.0);
}

function extractProjectContext(text: string): string[] {
  const projectPatterns = [
    /project\s*:?\s*([^\\n]+)/gi,
    /epic\s*:?\s*([^\\n]+)/gi,
    /^([A-Z][^\\n]*?project[^\\n]*?)$/gim,
  ];

  const projects: string[] = [];

  for (const pattern of projectPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 2) {
        projects.push(match[1].trim());
      }
    }
  }

  return [...new Set(projects)];
}

function findNearestProject(
  text: string,
  position: number,
  projectContext: string[]
): string | null {
  if (projectContext.length === 0) return null;

  // Simple heuristic: find project mentioned within 200 characters before the match
  const contextWindow = text.substring(
    Math.max(0, position - 200),
    position + 100
  );

  for (const project of projectContext) {
    if (contextWindow.toLowerCase().includes(project.toLowerCase())) {
      return project;
    }
  }

  // Fallback to first project if no specific match
  return projectContext[0];
}

function deduplicateEntities<T extends { text: string }>(
  entities: T[],
  keyProperty: keyof T
): T[] {
  const seen = new Set();
  return entities.filter(entity => {
    const key = entity[keyProperty];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractStatusReason(
  text: string,
  position: number
): string | undefined {
  // Look for reason/explanation near the status
  const contextWindow = text.substring(position, position + 200);
  const reasonMatch = contextWindow.match(
    /(?:because|due to|reason)\s*:?\s*([^\\n.]+)/i
  );
  return reasonMatch?.[1]?.trim();
}

function extractImpactLevel(
  text: string,
  position: number
): 'low' | 'medium' | 'high' | 'critical' {
  const contextWindow = text.substring(position - 100, position + 100);
  if (/critical|severe|major/i.test(contextWindow)) return 'critical';
  if (/high|significant/i.test(contextWindow)) return 'high';
  if (/medium|moderate/i.test(contextWindow)) return 'medium';
  return 'low';
}

function extractProbabilityLevel(
  text: string,
  position: number
): 'low' | 'medium' | 'high' | undefined {
  const contextWindow = text.substring(position - 100, position + 100);
  if (/likely|probable|high/i.test(contextWindow)) return 'high';
  if (/possible|medium/i.test(contextWindow)) return 'medium';
  if (/unlikely|low/i.test(contextWindow)) return 'low';
  return undefined;
}

function extractMitigation(text: string, position: number): string | undefined {
  const contextWindow = text.substring(position, position + 300);
  const mitigationMatch = contextWindow.match(
    /(?:mitigation|action|plan)\s*:?\s*([^\\n.]+)/i
  );
  return mitigationMatch?.[1]?.trim();
}

function determineMajorAccountType(
  matchText: string
): 'budgetAmount' | 'actualAmount' | 'forecastAmount' {
  if (/budget/i.test(matchText)) return 'budgetAmount';
  if (/actual|spent/i.test(matchText)) return 'actualAmount';
  if (/forecast|projected/i.test(matchText)) return 'forecastAmount';
  return 'budgetAmount'; // Default
}

function extractCurrency(text: string): string {
  if (/[$]/.test(text)) return 'USD';
  if (/[£]/.test(text)) return 'GBP';
  if (/[€]/.test(text)) return 'EUR';
  return 'USD'; // Default
}

function consolidateFinancials(
  financials: ExtractedFinancial[]
): ExtractedFinancial[] {
  const consolidated: Record<string, ExtractedFinancial> = {};

  for (const financial of financials) {
    const key = financial.projectName;
    if (!consolidated[key]) {
      consolidated[key] = { ...financial };
    } else {
      // Merge financial data for same project
      Object.assign(consolidated[key], financial);
    }
  }

  return Object.values(consolidated);
}

function normalizeDate(dateStr: string): string {
  // Simple date normalization - could be enhanced
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

function determineMilestoneStatus(
  text: string,
  position: number
): 'not-started' | 'in-progress' | 'completed' | 'delayed' {
  const contextWindow = text.substring(position - 50, position + 100);
  if (/complete|done|finished/i.test(contextWindow)) return 'completed';
  if (/delayed|late|overdue/i.test(contextWindow)) return 'delayed';
  if (/progress|working|ongoing/i.test(contextWindow)) return 'in-progress';
  return 'not-started';
}

function extractTeamCommentary(
  text: string,
  position: number
): string | undefined {
  const contextWindow = text.substring(position, position + 200);
  const commentMatch = contextWindow.match(/[.:]\\s*([^\\n.]{20,})/);
  return commentMatch?.[1]?.trim();
}

function mapSectionType(
  sectionName: string
): 'progress' | 'risks' | 'issues' | 'achievements' | 'next-steps' {
  const name = sectionName.toLowerCase();
  if (name.includes('risk')) return 'risks';
  if (name.includes('issue')) return 'issues';
  if (name.includes('achievement')) return 'achievements';
  if (name.includes('next') || name.includes('action')) return 'next-steps';
  return 'progress';
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'success',
    'complete',
    'on track',
    'ahead',
  ];
  const negativeWords = [
    'bad',
    'poor',
    'failed',
    'delayed',
    'behind',
    'risk',
    'issue',
    'problem',
  ];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word =>
    lowerText.includes(word)
  ).length;
  const negativeCount = negativeWords.filter(word =>
    lowerText.includes(word)
  ).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
