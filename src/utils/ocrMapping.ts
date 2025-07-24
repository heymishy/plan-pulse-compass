/**
 * OCR Entity Mapping Utilities
 * Maps extracted entities to existing planning data structures
 */

import type {
  OCRExtractionResult,
  EntityMappingResult,
  MappingCandidate,
  ExtractedEntity,
  ExtractedProjectStatus,
  ExtractedRisk,
  ExtractedFinancial,
  ExtractedMilestone,
  ExtractedTeamUpdate,
} from '@/types/ocrTypes';

import type {
  Project,
  Epic,
  Team,
  Milestone,
  ActualAllocation,
  Person,
} from '@/types';

/**
 * Main mapping function that matches extracted entities to existing data
 */
export function mapExtractedEntitiesToExisting(
  extractionResult: OCRExtractionResult,
  existingData: {
    projects: Project[];
    epics: Epic[];
    teams: Team[];
    milestones: Milestone[];
    people: Person[];
  }
): EntityMappingResult {
  const mappings: MappingCandidate[] = [];
  const unmappedEntities: ExtractedEntity[] = [];
  const conflicts: MappingCandidate[] = [];

  // Map project statuses
  for (const status of extractionResult.projectStatuses) {
    const mapping = mapProjectStatus(
      status,
      existingData.projects,
      existingData.epics
    );
    if (mapping) {
      if (mapping.conflictLevel === 'none' || mapping.conflictLevel === 'low') {
        mappings.push(mapping);
      } else {
        conflicts.push(mapping);
      }
    } else {
      unmappedEntities.push(status);
    }
  }

  // Map team updates
  for (const teamUpdate of extractionResult.teamUpdates) {
    const mapping = mapTeamUpdate(teamUpdate, existingData.teams);
    if (mapping) {
      if (mapping.conflictLevel === 'none' || mapping.conflictLevel === 'low') {
        mappings.push(mapping);
      } else {
        conflicts.push(mapping);
      }
    } else {
      unmappedEntities.push(teamUpdate);
    }
  }

  // Map milestones
  for (const milestone of extractionResult.milestones) {
    const mapping = mapMilestone(
      milestone,
      existingData.milestones,
      existingData.projects
    );
    if (mapping) {
      if (mapping.conflictLevel === 'none' || mapping.conflictLevel === 'low') {
        mappings.push(mapping);
      } else {
        conflicts.push(mapping);
      }
    } else {
      unmappedEntities.push(milestone);
    }
  }

  // Add other entity types as needed...

  const autoApplyCount = mappings.filter(m => m.matchConfidence > 0.8).length;
  const requiresReviewCount =
    mappings.filter(m => m.matchConfidence <= 0.8).length + conflicts.length;

  return {
    mappings,
    unmappedEntities,
    conflicts,
    recommendations: {
      autoApplyCount,
      requiresReviewCount,
      suggestedActions: generateRecommendations(
        mappings,
        conflicts,
        unmappedEntities
      ),
    },
  };
}

/**
 * Map extracted project status to existing projects/epics
 */
function mapProjectStatus(
  status: ExtractedProjectStatus,
  projects: Project[],
  epics: Epic[]
): MappingCandidate | null {
  // Try to match against projects first
  let bestMatch = findBestTextMatch(status.projectName, projects, 'name');
  let entityType: 'project' | 'epic' = 'project';

  // If no good project match, try epics
  if (!bestMatch || bestMatch.score < 0.6) {
    const epicMatch = findBestTextMatch(status.projectName, epics, 'name');
    if (epicMatch && epicMatch.score > (bestMatch?.score || 0)) {
      bestMatch = epicMatch;
      entityType = 'epic';
    }
  }

  if (!bestMatch || bestMatch.score < 0.4) {
    return null;
  }

  // Check for conflicts (existing status vs extracted status)
  const existingEntity = bestMatch.entity as Project | Epic;
  const conflictLevel = determineStatusConflictLevel(existingEntity, status);

  return {
    extractedEntity: status,
    existingEntityId: existingEntity.id,
    existingEntityType: entityType,
    matchConfidence: bestMatch.score,
    mappingReason: `Matched "${status.projectName}" to ${entityType} "${existingEntity.name}" (${Math.round(bestMatch.score * 100)}% confidence)`,
    conflictLevel,
  };
}

/**
 * Map extracted team update to existing teams
 */
function mapTeamUpdate(
  teamUpdate: ExtractedTeamUpdate,
  teams: Team[]
): MappingCandidate | null {
  const bestMatch = findBestTextMatch(teamUpdate.teamName, teams, 'name');

  if (!bestMatch || bestMatch.score < 0.5) {
    return null;
  }

  const existingTeam = bestMatch.entity as Team;
  const conflictLevel = determineTeamConflictLevel(existingTeam, teamUpdate);

  return {
    extractedEntity: teamUpdate,
    existingEntityId: existingTeam.id,
    existingEntityType: 'team',
    matchConfidence: bestMatch.score,
    mappingReason: `Matched "${teamUpdate.teamName}" to team "${existingTeam.name}" (${Math.round(bestMatch.score * 100)}% confidence)`,
    conflictLevel,
  };
}

/**
 * Map extracted milestone to existing milestones
 */
function mapMilestone(
  milestone: ExtractedMilestone,
  milestones: Milestone[],
  projects: Project[]
): MappingCandidate | null {
  // First try to match milestone by name
  let bestMatch = findBestTextMatch(
    milestone.milestoneName,
    milestones,
    'name'
  );

  // If no direct match, try to find milestones within the same project
  if (!bestMatch || bestMatch.score < 0.6) {
    const projectMatch = findBestTextMatch(
      milestone.projectName,
      projects,
      'name'
    );
    if (projectMatch && projectMatch.score > 0.7) {
      const projectMilestones = milestones.filter(
        m => m.projectId === projectMatch.entity.id
      );
      const projectMilestoneMatch = findBestTextMatch(
        milestone.milestoneName,
        projectMilestones,
        'name'
      );
      if (
        projectMilestoneMatch &&
        projectMilestoneMatch.score > (bestMatch?.score || 0)
      ) {
        bestMatch = projectMilestoneMatch;
      }
    }
  }

  if (!bestMatch || bestMatch.score < 0.4) {
    return null;
  }

  const existingMilestone = bestMatch.entity as Milestone;
  const conflictLevel = determineMilestoneConflictLevel(
    existingMilestone,
    milestone
  );

  const mappingResult = {
    extractedEntity: milestone,
    existingEntityId: existingMilestone.id,
    existingEntityType: 'milestone' as const,
    matchConfidence: bestMatch.score,
    mappingReason: `Matched "${milestone.milestoneName}" to milestone "${existingMilestone.name}" (${Math.round(bestMatch.score * 100)}% confidence)`,
    conflictLevel,
  };
  return mappingResult;
}

/**
 * Generate context updates for planning data based on mappings
 */
export function generateContextUpdates(
  mappingResult: EntityMappingResult,
  extractionResult: OCRExtractionResult,
  existingData: {
    projects: Project[];
    epics: Epic[];
    teams: Team[];
    milestones: Milestone[];
    actualAllocations: ActualAllocation[];
  }
) {
  const updates = {
    projects: [...existingData.projects],
    epics: [...existingData.epics],
    milestones: [...existingData.milestones],
    actualAllocations: [...existingData.actualAllocations],
    newRisks: [] as Array<{
      id: string;
      description: string;
      impact: string;
      probability?: string;
      mitigation?: string;
      status: string;
      category?: string;
      identifiedDate: string;
      source: string;
    }>,
  };

  // Apply high-confidence mappings
  const autoApplyMappings = mappingResult.mappings.filter(
    m => m.matchConfidence > 0.8
  );

  for (const mapping of autoApplyMappings) {
    switch (mapping.existingEntityType) {
      case 'project': {
        const projectIndex = updates.projects.findIndex(
          p => p.id === mapping.existingEntityId
        );
        if (projectIndex >= 0 && isProjectStatusMapping(mapping)) {
          const extractedStatus =
            mapping.extractedEntity as ExtractedProjectStatus;
          updates.projects[projectIndex] = {
            ...updates.projects[projectIndex],
            status: mapRAGStatusToProjectStatus(extractedStatus.status),
            lastUpdated: new Date().toISOString(),
          };
        }
        break;
      }

      case 'epic': {
        const epicIndex = updates.epics.findIndex(
          e => e.id === mapping.existingEntityId
        );
        if (epicIndex >= 0 && isProjectStatusMapping(mapping)) {
          const extractedStatus =
            mapping.extractedEntity as ExtractedProjectStatus;
          updates.epics[epicIndex] = {
            ...updates.epics[epicIndex],
            status: mapRAGStatusToEpicStatus(extractedStatus.status),
          };
        }
        break;
      }

      case 'milestone': {
        const milestoneIndex = updates.milestones.findIndex(
          m => m.id === mapping.existingEntityId
        );
        if (milestoneIndex >= 0 && isMilestoneMapping(mapping)) {
          const extractedMilestone =
            mapping.extractedEntity as ExtractedMilestone;

          // If milestone is completed and has a target date, use it as actual date
          let actualDate =
            extractedMilestone.actualDate ||
            updates.milestones[milestoneIndex].actualDate;
          if (
            extractedMilestone.status === 'completed' &&
            extractedMilestone.targetDate &&
            !actualDate
          ) {
            actualDate = extractedMilestone.targetDate;
          }

          updates.milestones[milestoneIndex] = {
            ...updates.milestones[milestoneIndex],
            status: extractedMilestone.status,
            actualDate,
          };
        }
        break;
      }

      case 'team': {
        if (isTeamUpdateMapping(mapping)) {
          const extractedTeamUpdate =
            mapping.extractedEntity as ExtractedTeamUpdate;
          // Create actual allocation entry for team utilization
          if (extractedTeamUpdate.utilization !== undefined) {
            const newActualAllocation: Partial<ActualAllocation> = {
              id: crypto.randomUUID(),
              teamId: mapping.existingEntityId,
              actualPercentage: extractedTeamUpdate.utilization,
              enteredDate: new Date().toISOString(),
              notes:
                extractedTeamUpdate.commentary || 'Updated from SteerCo OCR',
              varianceReason: 'steering-committee-update',
            };
            // Would need proper typing for ActualAllocation
            // updates.actualAllocations.push(newActualAllocation as ActualAllocation);
          }
        }
        break;
      }
    }
  }

  // Handle extracted risks (create new risk entries)
  for (const risk of extractionResult.risks) {
    updates.newRisks.push({
      id: crypto.randomUUID(),
      description: risk.riskDescription,
      impact: risk.impact,
      probability: risk.probability || 'medium',
      mitigation: risk.mitigation,
      status: 'open',
      category: risk.category || 'operational',
      identifiedDate: new Date().toISOString(),
      source: 'steering-committee-ocr',
    });
  }

  return updates;
}

// ===== Helper Functions =====

interface TextMatchResult {
  entity: Project | Epic | Team | Milestone | Person;
  score: number;
}

function findBestTextMatch(
  searchText: string,
  entities: (Project | Epic | Team | Milestone | Person)[],
  propertyName: string
): TextMatchResult | null {
  let bestMatch: TextMatchResult | null = null;

  for (const entity of entities) {
    const entityText = (entity as any)[propertyName];
    if (!entityText || typeof entityText !== 'string') continue;

    const score = calculateSimilarity(searchText, entityText);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { entity, score };
    }
  }

  return bestMatch;
}

function calculateSimilarity(text1: string, text2: string): number {
  const str1 = text1.toLowerCase().trim();
  const str2 = text2.toLowerCase().trim();

  // Exact match
  if (str1 === str2) return 1.0;

  // Contains match
  if (str1.includes(str2) || str2.includes(str1)) return 0.8;

  // Word overlap - require at least 2 words in common or high word match ratio
  const words1 = str1.split(/\\s+/).filter(word => word.length > 2); // Filter short words
  const words2 = str2.split(/\\s+/).filter(word => word.length > 2);
  const commonWords = words1.filter(word => words2.includes(word));

  // Require either multiple matching words or high proportion of words matching
  if (commonWords.length >= 2) {
    const overlapRatio =
      (commonWords.length * 2) / (words1.length + words2.length);
    if (overlapRatio > 0.6) return overlapRatio;
  }

  // Levenshtein distance for character-level similarity
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  const characterSimilarity = 1 - distance / maxLength;

  // Only return high character similarity if it's really close
  if (characterSimilarity > 0.8) return characterSimilarity;

  // For weak matches, return low score
  return Math.min(characterSimilarity * 0.5, 0.3);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

function determineStatusConflictLevel(
  existingEntity: Project | Epic,
  extractedStatus: ExtractedProjectStatus
): 'none' | 'low' | 'medium' | 'high' {
  // Compare existing status with extracted status
  const existingStatus = existingEntity.status;
  const extractedStatusMapped = mapRAGStatusToProjectStatus(
    extractedStatus.status
  );

  // Special handling for RAG status conflicts
  // Red/amber status should be flagged as conflict even if mapped status matches
  if (extractedStatus.status === 'red') {
    if (existingStatus === 'completed') {
      return 'high'; // Red status on completed project is a major concern
    }
    if (existingStatus === 'in-progress') {
      return 'high'; // Red status indicates serious issues
    }
  }
  if (extractedStatus.status === 'amber' && existingStatus === 'in-progress') {
    return 'medium'; // Amber status indicates caution
  }

  if (existingStatus === extractedStatusMapped) return 'none';

  // Define conflict severity based on status transitions
  const statusSeverity: Record<string, number> = {
    'not-started': 1,
    planning: 2,
    'in-progress': 3,
    completed: 4,
    'on-hold': 2,
    cancelled: 0,
  };

  const existingSeverity = statusSeverity[existingStatus] || 2;
  const extractedSeverity = statusSeverity[extractedStatusMapped] || 2;
  const difference = Math.abs(existingSeverity - extractedSeverity);

  if (difference <= 1) return 'low';
  if (difference === 2) return 'medium';
  return 'high';
}

function determineTeamConflictLevel(
  existingTeam: Team,
  extractedTeamUpdate: ExtractedTeamUpdate
): 'none' | 'low' | 'medium' | 'high' {
  // Check if utilization conflicts with existing capacity/utilization data
  if (extractedTeamUpdate.utilization === undefined) return 'none';

  // Would need to compare with existing team utilization data
  // For now, assume low conflict
  return 'low';
}

function determineMilestoneConflictLevel(
  existingMilestone: Milestone,
  extractedMilestone: ExtractedMilestone
): 'none' | 'low' | 'medium' | 'high' {
  // Check for date conflicts
  if (extractedMilestone.actualDate && existingMilestone.actualDate) {
    const extractedDate = new Date(extractedMilestone.actualDate);
    const existingDate = new Date(existingMilestone.actualDate);
    const daysDifference = Math.abs(
      (extractedDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference === 0) return 'none';
    if (daysDifference <= 7) return 'low';
    if (daysDifference <= 30) return 'medium';
    return 'high';
  }

  // Check status conflicts - only consider severe conflicts as medium/high
  if (existingMilestone.status !== extractedMilestone.status) {
    // Status progression is usually acceptable (in-progress -> completed)
    if (
      existingMilestone.status === 'in-progress' &&
      extractedMilestone.status === 'completed'
    ) {
      return 'low'; // Normal progression
    }
    if (
      existingMilestone.status === 'not-started' &&
      extractedMilestone.status === 'in-progress'
    ) {
      return 'low'; // Normal progression
    }
    // Other status changes are medium conflict
    return 'medium';
  }

  return 'none';
}

function generateRecommendations(
  mappings: MappingCandidate[],
  conflicts: MappingCandidate[],
  unmappedEntities: ExtractedEntity[]
): string[] {
  const recommendations: string[] = [];

  const autoApplyCount = mappings.filter(m => m.matchConfidence > 0.8).length;
  if (autoApplyCount > 0) {
    recommendations.push(
      `${autoApplyCount} high-confidence mappings can be applied automatically`
    );
  }

  const reviewCount = mappings.filter(m => m.matchConfidence <= 0.8).length;
  if (reviewCount > 0) {
    recommendations.push(
      `${reviewCount} mappings require manual review due to lower confidence`
    );
  }

  if (conflicts.length > 0) {
    recommendations.push(
      `${conflicts.length} potential conflicts detected - manual resolution recommended`
    );
  }

  if (unmappedEntities.length > 0) {
    recommendations.push(
      `${unmappedEntities.length} entities could not be mapped - consider creating new entries`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'All entities successfully mapped with high confidence'
    );
  }

  return recommendations;
}

function mapRAGStatusToProjectStatus(ragStatus: string): string {
  const statusMap: Record<string, string> = {
    green: 'in-progress',
    amber: 'in-progress',
    red: 'in-progress',
    blue: 'on-hold',
    complete: 'completed',
  };
  return statusMap[ragStatus] || 'in-progress';
}

function mapRAGStatusToEpicStatus(
  ragStatus: string
): 'todo' | 'in-progress' | 'completed' {
  const statusMap: Record<string, 'todo' | 'in-progress' | 'completed'> = {
    green: 'in-progress',
    amber: 'in-progress',
    red: 'in-progress',
    blue: 'todo',
    complete: 'completed',
  };
  return statusMap[ragStatus] || 'in-progress';
}

// Type guards
function isProjectStatusMapping(mapping: MappingCandidate): boolean {
  return (
    'projectName' in mapping.extractedEntity &&
    'status' in mapping.extractedEntity
  );
}

function isMilestoneMapping(mapping: MappingCandidate): boolean {
  return 'milestoneName' in mapping.extractedEntity;
}

function isTeamUpdateMapping(mapping: MappingCandidate): boolean {
  return (
    'teamName' in mapping.extractedEntity &&
    'utilization' in mapping.extractedEntity
  );
}
