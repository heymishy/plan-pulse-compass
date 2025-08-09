import {
  Person,
  Team,
  Project,
  Skill,
  PersonSkill,
  ProjectSolution,
  Solution,
  Allocation,
  Cycle,
  ProjectSkill,
} from '@/types';
import { getProjectRequiredSkills as getRequiredSkillsUtil } from './skillBasedPlanning';

export interface SkillMatchDetail {
  skillId: string;
  skillName: string;
  hasSkill: boolean;
  proficiencyLevel?: string;
  personIds: string[];
}

export interface TeamMatch {
  teamId: string;
  teamName: string;
  skillMatchPercentage: number;
  availabilityPercentage: number;
  overallScore: number;
  skillBreakdown: SkillMatchDetail[];
  conflictingAllocations: Allocation[];
  availablePeople: Person[];
  totalCapacity: number;
  usedCapacity: number;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  required: boolean;
  importance: 'low' | 'medium' | 'high';
  availableInTeam: boolean;
  alternativeSkills: string[];
}

export interface ScenarioAnalysisResult {
  projectId: string;
  projectName: string;
  requiredSkills: string[];
  teamMatches: TeamMatch[];
  skillGaps: SkillGap[];
  recommendedActions: string[];
}

export const analyzeProjectTeamAvailability = (
  projectId: string,
  data: {
    projects: Project[];
    teams: Team[];
    people: Person[];
    skills: Skill[];
    personSkills: PersonSkill[];
    projectSolutions: ProjectSolution[];
    projectSkills: ProjectSkill[];
    solutions: Solution[];
    allocations: Allocation[];
    cycles: Cycle[];
  }
): ScenarioAnalysisResult => {
  const {
    projects,
    teams,
    people,
    skills,
    personSkills,
    projectSolutions,
    projectSkills,
    solutions,
    allocations,
    cycles,
  } = data;

  const project = projects.find(p => p.id === projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Get current cycle for allocation analysis
  const now = new Date();
  const activeCycle = cycles.find(
    c => new Date(c.startDate) <= now && new Date(c.endDate) >= now
  );

  // Get required skills for the project
  const requiredSkills = getProjectRequiredSkills(project, {
    projectSolutions,
    projectSkills,
    solutions,
    skills,
  });

  // Analyze each team
  const teamMatches = teams
    .map(team =>
      analyzeTeamMatch(team, requiredSkills, {
        people,
        skills,
        personSkills,
        allocations,
        activeCycle,
      })
    )
    .sort((a, b) => b.overallScore - a.overallScore);

  // Identify skill gaps
  const skillGaps = identifySkillGaps(requiredSkills, teamMatches, skills);

  // Generate recommendations
  const recommendedActions = generateRecommendations(teamMatches, skillGaps);

  return {
    projectId,
    projectName: project.name,
    requiredSkills: requiredSkills.map(s => s.skillId),
    teamMatches,
    skillGaps,
    recommendedActions,
  };
};

const getProjectRequiredSkills = (
  project: Project,
  data: {
    projectSolutions: ProjectSolution[];
    projectSkills: ProjectSkill[];
    solutions: Solution[];
    skills: Skill[];
  }
) => {
  const { projectSolutions, projectSkills, solutions, skills } = data;

  const requiredSkills = getRequiredSkillsUtil(
    project,
    projectSkills,
    solutions,
    skills,
    projectSolutions
  );

  return requiredSkills.map(skill => ({
    skillId: skill.skillId,
    importance:
      projectSkills.find(ps => ps.skillId === skill.skillId)?.importance ||
      'medium',
  }));
};

const analyzeTeamMatch = (
  team: Team,
  requiredSkills: Array<{ skillId: string; importance: string }>,
  data: {
    people: Person[];
    skills: Skill[];
    personSkills: PersonSkill[];
    allocations: Allocation[];
    activeCycle: Cycle | undefined;
  }
): TeamMatch => {
  const { people, skills, personSkills, allocations, activeCycle } = data;

  // Get team members
  const teamMembers = people.filter(p => p.teamId === team.id && p.isActive);

  // Get team's available skills
  const teamSkillsMap = new Map<string, SkillMatchDetail>();

  teamMembers.forEach(person => {
    const memberSkills = personSkills.filter(ps => ps.personId === person.id);
    memberSkills.forEach(ps => {
      const skill = skills.find(s => s.id === ps.skillId);
      if (skill) {
        if (!teamSkillsMap.has(ps.skillId)) {
          teamSkillsMap.set(ps.skillId, {
            skillId: ps.skillId,
            skillName: skill.name,
            hasSkill: true,
            proficiencyLevel: ps.proficiencyLevel,
            personIds: [person.id],
          });
        } else {
          const existing = teamSkillsMap.get(ps.skillId)!;
          existing.personIds.push(person.id);
          // Keep highest proficiency level
          if (
            getProficiencyValue(ps.proficiencyLevel) >
            getProficiencyValue(existing.proficiencyLevel || '')
          ) {
            existing.proficiencyLevel = ps.proficiencyLevel;
          }
        }
      }
    });
  });

  // Calculate skill match
  const skillBreakdown: SkillMatchDetail[] = requiredSkills.map(req => {
    const skill = skills.find(s => s.id === req.skillId);
    const teamSkill = teamSkillsMap.get(req.skillId);

    return {
      skillId: req.skillId,
      skillName: skill?.name || 'Unknown',
      hasSkill: !!teamSkill,
      proficiencyLevel: teamSkill?.proficiencyLevel,
      personIds: teamSkill?.personIds || [],
    };
  });

  const matchedSkills = skillBreakdown.filter(s => s.hasSkill).length;
  const skillMatchPercentage =
    requiredSkills.length > 0
      ? (matchedSkills / requiredSkills.length) * 100
      : 100;

  // Calculate availability
  let usedCapacity = 0;
  const conflictingAllocations: Allocation[] = [];

  if (activeCycle) {
    const teamAllocations = allocations.filter(
      a => a.teamId === team.id && a.cycleId === activeCycle.id
    );

    usedCapacity = teamAllocations.reduce(
      (sum, alloc) => sum + alloc.percentage,
      0
    );
    conflictingAllocations.push(...teamAllocations);
  }

  const availabilityPercentage = Math.max(0, 100 - usedCapacity);

  // Calculate overall score (weighted)
  const overallScore =
    skillMatchPercentage * 0.7 + availabilityPercentage * 0.3;

  return {
    teamId: team.id,
    teamName: team.name,
    skillMatchPercentage,
    availabilityPercentage,
    overallScore,
    skillBreakdown,
    conflictingAllocations,
    availablePeople: teamMembers,
    totalCapacity: team.capacity,
    usedCapacity,
  };
};

const identifySkillGaps = (
  requiredSkills: Array<{ skillId: string; importance: string }>,
  teamMatches: TeamMatch[],
  skills: Skill[]
): SkillGap[] => {
  const gaps: SkillGap[] = [];

  requiredSkills.forEach(req => {
    const skill = skills.find(s => s.id === req.skillId);
    const availableInAnyTeam = teamMatches.some(team =>
      team.skillBreakdown.find(sb => sb.skillId === req.skillId && sb.hasSkill)
    );

    if (!availableInAnyTeam) {
      gaps.push({
        skillId: req.skillId,
        skillName: skill?.name || 'Unknown',
        required: true,
        importance: req.importance as 'low' | 'medium' | 'high',
        availableInTeam: false,
        alternativeSkills: [], // Could be enhanced with skill similarity
      });
    }
  });

  return gaps;
};

const generateRecommendations = (
  teamMatches: TeamMatch[],
  skillGaps: SkillGap[]
): string[] => {
  const recommendations: string[] = [];

  if (teamMatches.length > 0) {
    const bestMatch = teamMatches[0];
    if (bestMatch.overallScore > 70) {
      recommendations.push(
        `Consider ${bestMatch.teamName} - excellent match (${Math.round(bestMatch.overallScore)}% overall score)`
      );
    } else if (
      bestMatch.skillMatchPercentage > 80 &&
      bestMatch.availabilityPercentage < 30
    ) {
      recommendations.push(
        `${bestMatch.teamName} has the right skills but limited availability. Consider adjusting timelines.`
      );
    }
  }

  if (skillGaps.length > 0) {
    const criticalGaps = skillGaps.filter(g => g.importance === 'critical');
    if (criticalGaps.length > 0) {
      recommendations.push(
        `Critical skill gaps identified: ${criticalGaps.map(g => g.skillName).join(', ')}. Consider training or hiring.`
      );
    }
  }

  const highUtilizationTeams = teamMatches.filter(
    t => t.availabilityPercentage < 20
  );
  if (highUtilizationTeams.length > 0) {
    recommendations.push(
      `High utilization detected in ${highUtilizationTeams.length} teams. Consider resource balancing.`
    );
  }

  return recommendations;
};

const getProficiencyValue = (level: string): number => {
  switch (level) {
    case 'expert':
      return 4;
    case 'advanced':
      return 3;
    case 'intermediate':
      return 2;
    case 'beginner':
      return 1;
    default:
      return 0;
  }
};
