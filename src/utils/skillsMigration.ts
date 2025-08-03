import { Team, Skill } from '@/types';

/**
 * Skills Migration Utilities
 *
 * Handles migration from team.targetSkills containing skill names (strings)
 * to team.targetSkills containing skill IDs (references to Skill entities)
 */

export interface SkillMigrationResult {
  teamId: string;
  originalSkills: string[];
  automaticMatches: SkillMatch[];
  ambiguousMatches: AmbiguousMatch[];
  missingSkills: string[];
  success: boolean;
}

export interface SkillMatch {
  originalName: string;
  skillId: string;
  skillName: string;
  confidence: number; // 0-1 score
  matchType: 'exact' | 'fuzzy' | 'partial';
}

export interface AmbiguousMatch {
  originalName: string;
  candidates: SkillMatch[];
  requiresManualReview: boolean;
}

export interface MigrationSummary {
  totalTeams: number;
  teamsProcessed: number;
  automaticMatches: number;
  ambiguousMatches: number;
  missingSkills: number;
  results: SkillMigrationResult[];
}

/**
 * Fuzzy string matching using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
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
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Find skill matches for a given skill name
 */
export function findSkillMatches(
  skillName: string,
  availableSkills: Skill[],
  confidenceThreshold = 0.8
): SkillMatch[] {
  const matches: SkillMatch[] = [];

  for (const skill of availableSkills) {
    // Exact match (highest priority)
    if (skill.name.toLowerCase() === skillName.toLowerCase()) {
      matches.push({
        originalName: skillName,
        skillId: skill.id,
        skillName: skill.name,
        confidence: 1.0,
        matchType: 'exact',
      });
      continue;
    }

    // Partial match (contains or is contained)
    const skillLower = skill.name.toLowerCase();
    const searchLower = skillName.toLowerCase();

    if (skillLower.includes(searchLower) || searchLower.includes(skillLower)) {
      const confidence =
        Math.min(searchLower.length, skillLower.length) /
        Math.max(searchLower.length, skillLower.length);

      if (confidence >= confidenceThreshold) {
        matches.push({
          originalName: skillName,
          skillId: skill.id,
          skillName: skill.name,
          confidence,
          matchType: 'partial',
        });
      }
    }

    // Fuzzy match
    const similarity = calculateSimilarity(skillName, skill.name);
    if (similarity >= confidenceThreshold && similarity < 1.0) {
      matches.push({
        originalName: skillName,
        skillId: skill.id,
        skillName: skill.name,
        confidence: similarity,
        matchType: 'fuzzy',
      });
    }
  }

  // Sort by confidence (descending) and match type priority
  return matches.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }

    const typePriority = { exact: 3, partial: 2, fuzzy: 1 };
    return typePriority[b.matchType] - typePriority[a.matchType];
  });
}

/**
 * Analyze team skills and determine migration strategy
 */
export function analyzeTeamSkillMigration(
  team: Team,
  availableSkills: Skill[],
  confidenceThreshold = 0.8
): SkillMigrationResult {
  const result: SkillMigrationResult = {
    teamId: team.id,
    originalSkills: team.targetSkills || [],
    automaticMatches: [],
    ambiguousMatches: [],
    missingSkills: [],
    success: false,
  };

  // Skip if team already uses skill IDs (check if skills exist with these IDs)
  const hasSkillIds = result.originalSkills.every(skill =>
    availableSkills.some(s => s.id === skill)
  );

  if (hasSkillIds) {
    result.success = true;
    return result;
  }

  for (const skillName of result.originalSkills) {
    const matches = findSkillMatches(
      skillName,
      availableSkills,
      confidenceThreshold
    );

    if (matches.length === 0) {
      result.missingSkills.push(skillName);
    } else if (matches.length === 1 || matches[0].confidence >= 0.95) {
      // High confidence or single match - automatic
      result.automaticMatches.push(matches[0]);
    } else {
      // Multiple matches or lower confidence - needs review
      result.ambiguousMatches.push({
        originalName: skillName,
        candidates: matches,
        requiresManualReview: true,
      });
    }
  }

  result.success =
    result.missingSkills.length === 0 && result.ambiguousMatches.length === 0;
  return result;
}

/**
 * Create missing skills automatically
 */
export function createMissingSkills(
  missingSkillNames: string[],
  defaultCategory = 'General'
): Skill[] {
  return missingSkillNames.map(name => ({
    id: crypto.randomUUID(),
    name: name.trim(),
    category: defaultCategory,
    description: `Auto-created during team skills migration`,
    createdDate: new Date().toISOString(),
  }));
}

/**
 * Apply migration results to update team skills
 */
export function applySkillMigration(
  team: Team,
  migrationResult: SkillMigrationResult,
  manualMappings: Record<string, string> = {}
): Team {
  const newSkillIds: string[] = [];

  // Add automatic matches
  for (const match of migrationResult.automaticMatches) {
    newSkillIds.push(match.skillId);
  }

  // Add manual mappings for ambiguous matches
  for (const ambiguous of migrationResult.ambiguousMatches) {
    const manualMapping = manualMappings[ambiguous.originalName];
    if (manualMapping) {
      newSkillIds.push(manualMapping);
    }
  }

  return {
    ...team,
    targetSkills: newSkillIds,
  };
}

/**
 * Run migration analysis on all teams
 */
export function analyzeAllTeamsMigration(
  teams: Team[],
  availableSkills: Skill[],
  confidenceThreshold = 0.8
): MigrationSummary {
  const results = teams.map(team =>
    analyzeTeamSkillMigration(team, availableSkills, confidenceThreshold)
  );

  const summary: MigrationSummary = {
    totalTeams: teams.length,
    teamsProcessed: results.length,
    automaticMatches: results.reduce(
      (sum, r) => sum + r.automaticMatches.length,
      0
    ),
    ambiguousMatches: results.reduce(
      (sum, r) => sum + r.ambiguousMatches.length,
      0
    ),
    missingSkills: results.reduce((sum, r) => sum + r.missingSkills.length, 0),
    results,
  };

  return summary;
}

/**
 * Generate migration preview for team skills
 */
export function generateMigrationPreview(
  teams: Team[],
  availableSkills: Skill[],
  confidenceThreshold = 0.8
): {
  summary: MigrationSummary;
  recommendations: {
    autoCreate: string[];
    needsReview: Array<{
      teamName: string;
      skill: string;
      candidates: string[];
    }>;
    highConfidence: number;
  };
} {
  const summary = analyzeAllTeamsMigration(
    teams,
    availableSkills,
    confidenceThreshold
  );

  const allMissingSkills = new Set<string>();
  const needsReview: Array<{
    teamName: string;
    skill: string;
    candidates: string[];
  }> = [];
  let highConfidenceCount = 0;

  for (const result of summary.results) {
    const team = teams.find(t => t.id === result.teamId);

    // Collect missing skills for auto-creation
    result.missingSkills.forEach(skill => allMissingSkills.add(skill));

    // Collect ambiguous matches for review
    result.ambiguousMatches.forEach(ambiguous => {
      needsReview.push({
        teamName: team?.name || result.teamId,
        skill: ambiguous.originalName,
        candidates: ambiguous.candidates.map(c => c.skillName),
      });
    });

    // Count high confidence matches
    highConfidenceCount += result.automaticMatches.filter(
      m => m.confidence >= 0.95
    ).length;
  }

  return {
    summary,
    recommendations: {
      autoCreate: Array.from(allMissingSkills),
      needsReview,
      highConfidence: highConfidenceCount,
    },
  };
}

/**
 * Validate migration results
 */
export function validateMigration(
  originalTeams: Team[],
  migratedTeams: Team[],
  availableSkills: Skill[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (originalTeams.length !== migratedTeams.length) {
    errors.push('Team count mismatch after migration');
  }

  for (const team of migratedTeams) {
    // Validate all skill IDs exist
    for (const skillId of team.targetSkills || []) {
      if (!availableSkills.find(s => s.id === skillId)) {
        errors.push(`Team ${team.name}: Invalid skill ID ${skillId}`);
      }
    }

    // Check for data loss
    const originalTeam = originalTeams.find(t => t.id === team.id);
    if (originalTeam) {
      const originalSkillCount = originalTeam.targetSkills?.length || 0;
      const migratedSkillCount = team.targetSkills?.length || 0;

      if (migratedSkillCount < originalSkillCount) {
        warnings.push(
          `Team ${team.name}: Skill count reduced from ${originalSkillCount} to ${migratedSkillCount}`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
