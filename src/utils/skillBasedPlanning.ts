import { Team, Project, Skill, ProjectSkill, Solution } from '@/types';

/**
 * Skills-Based Planning Utilities
 *
 * Provides comprehensive functionality for team-project skill matching,
 * compatibility scoring, and skill gap analysis using the unified skills architecture.
 */

export interface SkillMatch {
  skillId: string;
  skillName: string;
  category: string;
  required: boolean;
  teamHasSkill: boolean;
  matchType: 'exact' | 'category' | 'missing';
}

export interface TeamProjectCompatibility {
  teamId: string;
  projectId: string;
  compatibilityScore: number; // 0-1 score
  skillMatches: SkillMatch[];
  skillsMatched: number;
  skillsRequired: number;
  skillsGap: number;
  categoryDistribution: Record<string, { required: number; matched: number }>;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  reasoning: string[];
}

export interface SkillGapAnalysis {
  projectId: string;
  projectName: string;
  requiredSkills: Array<{
    skillId: string;
    skillName: string;
    category: string;
    priority: 'critical' | 'important' | 'nice-to-have';
  }>;
  availableTeams: Array<{
    teamId: string;
    teamName: string;
    compatibility: TeamProjectCompatibility;
    missingSkills: string[];
    strengths: string[];
  }>;
  recommendations: {
    bestTeam: string | null;
    skillGaps: Array<{
      skillName: string;
      category: string;
      teamsNeeding: string[];
      priority: 'critical' | 'important' | 'nice-to-have';
    }>;
    trainingNeeds: string[];
    hiringNeeds: string[];
  };
}

/**
 * Get all skills required by a project (from project skills and solutions)
 */
export function getProjectRequiredSkills(
  project: Project,
  projectSkills: ProjectSkill[],
  solutions: Solution[],
  skills: Skill[]
): Array<{
  skillId: string;
  skillName: string;
  category: string;
  source: 'project' | 'solution';
}> {
  const requiredSkillIds = new Set<string>();
  const skillSources: Record<string, 'project' | 'solution'> = {};

  // Add project-specific skills
  const projectSpecificSkills = projectSkills.filter(
    ps => ps.projectId === project.id
  );
  projectSpecificSkills.forEach(ps => {
    requiredSkillIds.add(ps.skillId);
    skillSources[ps.skillId] = 'project';
  });

  // Add solution skills
  project.solutionIds?.forEach(solutionId => {
    const solution = solutions.find(s => s.id === solutionId);
    if (solution?.skills) {
      solution.skills.forEach(skillId => {
        requiredSkillIds.add(skillId);
        if (!skillSources[skillId]) {
          skillSources[skillId] = 'solution';
        }
      });
    }
  });

  // Map to skill details
  return Array.from(requiredSkillIds)
    .map(skillId => {
      const skill = skills.find(s => s.id === skillId);
      return skill
        ? {
            skillId: skill.id,
            skillName: skill.name,
            category: skill.category,
            source: skillSources[skillId],
          }
        : null;
    })
    .filter(Boolean) as Array<{
    skillId: string;
    skillName: string;
    category: string;
    source: 'project' | 'solution';
  }>;
}

/**
 * Calculate compatibility score between a team and project based on skills
 */
export function calculateTeamProjectCompatibility(
  team: Team,
  project: Project,
  projectSkills: ProjectSkill[],
  solutions: Solution[],
  skills: Skill[]
): TeamProjectCompatibility {
  const requiredSkills = getProjectRequiredSkills(
    project,
    projectSkills,
    solutions,
    skills
  );
  const teamSkillIds = new Set(team.targetSkills || []);

  const skillMatches: SkillMatch[] = [];
  const categoryDistribution: Record<
    string,
    { required: number; matched: number }
  > = {};

  let exactMatches = 0;
  let categoryMatches = 0;

  // Analyze each required skill
  requiredSkills.forEach(reqSkill => {
    const skill = skills.find(s => s.id === reqSkill.skillId);
    if (!skill) return;

    // Initialize category tracking
    if (!categoryDistribution[skill.category]) {
      categoryDistribution[skill.category] = { required: 0, matched: 0 };
    }
    categoryDistribution[skill.category].required++;

    const teamHasSkill = teamSkillIds.has(reqSkill.skillId);
    let matchType: 'exact' | 'category' | 'missing' = 'missing';

    if (teamHasSkill) {
      matchType = 'exact';
      exactMatches++;
      categoryDistribution[skill.category].matched++;
    } else {
      // Check for category match (team has other skills in same category)
      const teamHasCategorySkill = (team.targetSkills || []).some(
        teamSkillId => {
          const teamSkill = skills.find(s => s.id === teamSkillId);
          return teamSkill?.category === skill.category;
        }
      );

      if (teamHasCategorySkill) {
        matchType = 'category';
        categoryMatches++;
      }
    }

    skillMatches.push({
      skillId: reqSkill.skillId,
      skillName: skill.name,
      category: skill.category,
      required: true,
      teamHasSkill,
      matchType,
    });
  });

  // Calculate compatibility score
  const totalRequired = requiredSkills.length;
  const skillsMatched = exactMatches;
  const skillsGap = totalRequired - exactMatches;

  let compatibilityScore = 0;
  if (totalRequired > 0) {
    // Only exact matches count for core compatibility score
    compatibilityScore = exactMatches / totalRequired;

    // Add small bonus for category matches (max 10% bonus)
    const categoryBonus = Math.min(
      0.1,
      (categoryMatches * 0.1) / totalRequired
    );
    compatibilityScore = Math.min(1, compatibilityScore + categoryBonus);
  }

  // Determine recommendation level
  let recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  const reasoning: string[] = [];

  if (compatibilityScore >= 0.9) {
    recommendation = 'excellent';
    reasoning.push(
      `High skill match (${Math.round(compatibilityScore * 100)}%)`
    );
  } else if (compatibilityScore >= 0.7) {
    recommendation = 'good';
    reasoning.push(
      `Good skill compatibility (${Math.round(compatibilityScore * 100)}%)`
    );
  } else if (compatibilityScore >= 0.5) {
    recommendation = 'fair';
    reasoning.push(
      `Moderate skill match (${Math.round(compatibilityScore * 100)}%)`
    );
    if (skillsGap > 0) {
      reasoning.push(
        `${skillsGap} skill gap${skillsGap > 1 ? 's' : ''} need addressing`
      );
    }
  } else {
    recommendation = 'poor';
    reasoning.push(
      `Low skill compatibility (${Math.round(compatibilityScore * 100)}%)`
    );
    reasoning.push(`${skillsGap} critical skills missing`);
  }

  // Add category-specific insights
  const strongCategories = Object.entries(categoryDistribution)
    .filter(([_, data]) => data.matched === data.required && data.required > 0)
    .map(([category]) => category);

  const weakCategories = Object.entries(categoryDistribution)
    .filter(([_, data]) => data.matched === 0 && data.required > 0)
    .map(([category]) => category);

  if (strongCategories.length > 0) {
    reasoning.push(`Strong in: ${strongCategories.join(', ')}`);
  }
  if (weakCategories.length > 0) {
    reasoning.push(`Needs development in: ${weakCategories.join(', ')}`);
  }

  return {
    teamId: team.id,
    projectId: project.id,
    compatibilityScore,
    skillMatches,
    skillsMatched,
    skillsRequired: totalRequired,
    skillsGap,
    categoryDistribution,
    recommendation,
    reasoning,
  };
}

/**
 * Analyze skill gaps for a project across all available teams
 */
export function analyzeProjectSkillGaps(
  project: Project,
  teams: Team[],
  projectSkills: ProjectSkill[],
  solutions: Solution[],
  skills: Skill[]
): SkillGapAnalysis {
  const requiredSkills = getProjectRequiredSkills(
    project,
    projectSkills,
    solutions,
    skills
  );

  // Calculate compatibility for each team
  const teamCompatibilities = teams.map(team =>
    calculateTeamProjectCompatibility(
      team,
      project,
      projectSkills,
      solutions,
      skills
    )
  );

  // Find best team
  const bestTeam = teamCompatibilities.reduce((best, current) =>
    current.compatibilityScore > best.compatibilityScore ? current : best
  );

  // Analyze available teams
  const availableTeams = teamCompatibilities.map(compatibility => {
    const team = teams.find(t => t.id === compatibility.teamId)!;
    const missingSkills = compatibility.skillMatches
      .filter(match => match.matchType === 'missing')
      .map(match => match.skillName);

    const strengths = compatibility.skillMatches
      .filter(match => match.matchType === 'exact')
      .map(match => match.skillName);

    return {
      teamId: team.id,
      teamName: team.name,
      compatibility,
      missingSkills,
      strengths,
    };
  });

  // Analyze skill gaps across all teams
  const skillGapMap = new Map<
    string,
    {
      skillName: string;
      category: string;
      teamsNeeding: string[];
      priority: 'critical' | 'important' | 'nice-to-have';
    }
  >();

  teamCompatibilities.forEach(compatibility => {
    const team = teams.find(t => t.id === compatibility.teamId)!;
    compatibility.skillMatches
      .filter(match => match.matchType === 'missing')
      .forEach(match => {
        if (!skillGapMap.has(match.skillId)) {
          skillGapMap.set(match.skillId, {
            skillName: match.skillName,
            category: match.category,
            teamsNeeding: [],
            priority: 'important', // Default priority
          });
        }
        skillGapMap.get(match.skillId)!.teamsNeeding.push(team.name);
      });
  });

  // Determine priority levels based on how many teams need the skill
  const skillGaps = Array.from(skillGapMap.values()).map(gap => ({
    ...gap,
    priority:
      gap.teamsNeeding.length >= teams.length * 0.7
        ? ('critical' as const)
        : gap.teamsNeeding.length >= teams.length * 0.3
          ? ('important' as const)
          : ('nice-to-have' as const),
  }));

  // Generate recommendations
  const trainingNeeds = skillGaps
    .filter(gap => gap.priority === 'important' && gap.teamsNeeding.length > 1)
    .map(gap => gap.skillName);

  const hiringNeeds = skillGaps
    .filter(gap => gap.priority === 'critical')
    .map(gap => gap.skillName);

  const requiredSkillsWithPriority = requiredSkills.map(skill => ({
    skillId: skill.skillId,
    skillName: skill.skillName,
    category: skill.category,
    priority:
      skillGaps.find(gap => gap.skillName === skill.skillName)?.priority ||
      ('nice-to-have' as const),
  }));

  return {
    projectId: project.id,
    projectName: project.name,
    requiredSkills: requiredSkillsWithPriority,
    availableTeams,
    recommendations: {
      bestTeam: bestTeam.compatibilityScore > 0.5 ? bestTeam.teamId : null,
      skillGaps,
      trainingNeeds,
      hiringNeeds,
    },
  };
}

/**
 * Filter teams based on required skills
 */
export function filterTeamsBySkills(
  teams: Team[],
  requiredSkillIds: string[],
  skills: Skill[],
  minCompatibilityScore = 0.3
): Array<{ team: Team; compatibilityScore: number; matchingSkills: string[] }> {
  if (requiredSkillIds.length === 0)
    return teams.map(team => ({
      team,
      compatibilityScore: 1,
      matchingSkills: [],
    }));

  return teams
    .map(team => {
      const teamSkillIds = new Set(team.targetSkills || []);
      const matchingSkillIds = requiredSkillIds.filter(skillId =>
        teamSkillIds.has(skillId)
      );
      const compatibilityScore =
        matchingSkillIds.length / requiredSkillIds.length;

      const matchingSkills = matchingSkillIds
        .map(skillId => skills.find(s => s.id === skillId)?.name)
        .filter(Boolean) as string[];

      return {
        team,
        compatibilityScore,
        matchingSkills,
      };
    })
    .filter(result => result.compatibilityScore >= minCompatibilityScore)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

/**
 * Get skill coverage analysis across all teams
 */
export function analyzeSkillCoverage(
  teams: Team[],
  skills: Skill[]
): {
  totalSkills: number;
  coveredSkills: number;
  coveragePercentage: number;
  skillCoverage: Array<{
    skillId: string;
    skillName: string;
    category: string;
    teamsWithSkill: Array<{ teamId: string; teamName: string }>;
    coverageCount: number;
    isWellCovered: boolean;
    isAtRisk: boolean;
  }>;
  categoryAnalysis: Record<
    string,
    {
      totalSkills: number;
      coveredSkills: number;
      coveragePercentage: number;
      averageTeamsPerSkill: number;
    }
  >;
  recommendations: {
    skillsAtRisk: string[]; // Skills with low coverage
    skillsWellCovered: string[]; // Skills with good coverage
    categoriesNeedingAttention: string[];
  };
} {
  const skillCoverage = skills.map(skill => {
    const teamsWithSkill = teams
      .filter(team => (team.targetSkills || []).includes(skill.id))
      .map(team => ({ teamId: team.id, teamName: team.name }));

    const coverageCount = teamsWithSkill.length;
    const isWellCovered = coverageCount >= Math.max(2, teams.length * 0.3);
    const isAtRisk = coverageCount <= 1;

    return {
      skillId: skill.id,
      skillName: skill.name,
      category: skill.category,
      teamsWithSkill,
      coverageCount,
      isWellCovered,
      isAtRisk,
    };
  });

  const coveredSkills = skillCoverage.filter(sc => sc.coverageCount > 0).length;
  const coveragePercentage =
    skills.length > 0 ? (coveredSkills / skills.length) * 100 : 0;

  // Category analysis
  const categoryAnalysis: Record<
    string,
    {
      totalSkills: number;
      coveredSkills: number;
      coveragePercentage: number;
      averageTeamsPerSkill: number;
    }
  > = {};

  skills.forEach(skill => {
    if (!categoryAnalysis[skill.category]) {
      categoryAnalysis[skill.category] = {
        totalSkills: 0,
        coveredSkills: 0,
        coveragePercentage: 0,
        averageTeamsPerSkill: 0,
      };
    }
    categoryAnalysis[skill.category].totalSkills++;

    const skillCov = skillCoverage.find(sc => sc.skillId === skill.id);
    if (skillCov && skillCov.coverageCount > 0) {
      categoryAnalysis[skill.category].coveredSkills++;
    }
  });

  // Calculate category percentages and averages
  Object.keys(categoryAnalysis).forEach(category => {
    const catData = categoryAnalysis[category];
    catData.coveragePercentage =
      catData.totalSkills > 0
        ? (catData.coveredSkills / catData.totalSkills) * 100
        : 0;

    const categorySkills = skillCoverage.filter(sc => sc.category === category);
    catData.averageTeamsPerSkill =
      categorySkills.length > 0
        ? categorySkills.reduce((sum, sc) => sum + sc.coverageCount, 0) /
          categorySkills.length
        : 0;
  });

  // Generate recommendations
  const skillsAtRisk = skillCoverage
    .filter(sc => sc.isAtRisk)
    .map(sc => sc.skillName);

  const skillsWellCovered = skillCoverage
    .filter(sc => sc.isWellCovered)
    .map(sc => sc.skillName);

  const categoriesNeedingAttention = Object.entries(categoryAnalysis)
    .filter(
      ([_, data]) =>
        data.coveragePercentage < 60 || data.averageTeamsPerSkill < 1.5
    )
    .map(([category]) => category);

  return {
    totalSkills: skills.length,
    coveredSkills,
    coveragePercentage,
    skillCoverage,
    categoryAnalysis,
    recommendations: {
      skillsAtRisk,
      skillsWellCovered,
      categoriesNeedingAttention,
    },
  };
}

/**
 * Recommend teams for a project based on skill requirements
 */
export function recommendTeamsForProject(
  project: Project,
  teams: Team[],
  projectSkills: ProjectSkill[],
  solutions: Solution[],
  skills: Skill[],
  maxRecommendations = 3
): Array<{
  team: Team;
  compatibility: TeamProjectCompatibility;
  rank: number;
  recommendation: string;
}> {
  const teamCompatibilities = teams.map(team =>
    calculateTeamProjectCompatibility(
      team,
      project,
      projectSkills,
      solutions,
      skills
    )
  );

  return teamCompatibilities
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, maxRecommendations)
    .map((compatibility, index) => {
      const team = teams.find(t => t.id === compatibility.teamId)!;

      let recommendation = '';
      if (index === 0) {
        recommendation =
          compatibility.compatibilityScore > 0.8
            ? 'Excellent match - highly recommended'
            : compatibility.compatibilityScore > 0.6
              ? 'Good match with some skill gaps'
              : 'Best available option but requires skill development';
      } else {
        recommendation =
          compatibility.compatibilityScore > 0.7
            ? 'Strong alternative choice'
            : compatibility.compatibilityScore > 0.5
              ? 'Viable option with training'
              : 'Requires significant skill development';
      }

      return {
        team,
        compatibility,
        rank: index + 1,
        recommendation,
      };
    });
}
