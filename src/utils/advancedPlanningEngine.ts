import {
  Project,
  Team,
  Person,
  Skill,
  PersonSkill,
  ProjectSkill,
  ProjectSolution,
  Solution,
  Allocation,
  Cycle,
  Division,
  Role,
  AppConfig,
} from '@/types';
import {
  ProjectFeasibilityAnalysis,
  TeamRecommendation,
  BudgetImpactAnalysis,
  PlanningScenario,
  ProjectSkillRequirement,
  FeasibilityRisk,
  DivisionBudget,
} from '@/types/planningTypes';
import {
  calculatePersonCost,
  calculateProjectCost,
} from '@/utils/financialCalculations';
import { analyzeProjectTeamAvailability } from '@/utils/scenarioAnalysis';

export interface PlanningEngineData {
  projects: Project[];
  teams: Team[];
  people: Person[];
  skills: Skill[];
  personSkills: PersonSkill[];
  projectSkills: ProjectSkill[];
  projectSolutions: ProjectSolution[];
  solutions: Solution[];
  allocations: Allocation[];
  cycles: Cycle[];
  divisions: Division[];
  roles: Role[];
  divisionBudgets: DivisionBudget[];
  config: AppConfig;
}

export const analyzeProjectsFeasibility = (
  projectIds: string[],
  data: PlanningEngineData
): ProjectFeasibilityAnalysis[] => {
  console.log('Analyzing feasibility for projects:', projectIds);

  const analyses: ProjectFeasibilityAnalysis[] = [];

  projectIds.forEach(projectId => {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return;

    console.log(`Analyzing project: ${project.name}`);

    // Get project skill requirements
    const skillRequirements = getProjectSkillRequirements(projectId, data);

    // Analyze team recommendations
    const teamRecommendations = getTeamRecommendations(projectId, data);

    // Calculate budget impact
    const budgetImpact = calculateProjectBudgetImpact(
      project,
      teamRecommendations,
      data
    );

    // Assess risks
    const riskFactors = assessProjectRisks(
      project,
      skillRequirements,
      teamRecommendations,
      data
    );

    // Calculate feasibility score
    const feasibilityScore = calculateFeasibilityScore(
      skillRequirements,
      teamRecommendations,
      budgetImpact,
      riskFactors
    );

    analyses.push({
      projectId,
      projectName: project.name,
      requiredSkills: skillRequirements,
      budgetRequirement: project.budget || 0,
      timelineRequirement: {
        startDate: project.startDate,
        endDate: project.endDate || '',
        durationInIterations: calculateProjectDuration(project, data.cycles),
      },
      feasibilityScore,
      riskFactors,
      recommendedTeams: teamRecommendations,
      budgetImpact,
    });
  });

  return analyses.sort((a, b) => b.feasibilityScore - a.feasibilityScore);
};

const getProjectSkillRequirements = (
  projectId: string,
  data: PlanningEngineData
): ProjectSkillRequirement[] => {
  const requirements: ProjectSkillRequirement[] = [];
  const skillMap = new Map<string, ProjectSkillRequirement>();

  // Get skills from solutions
  const projectSolutions = data.projectSolutions.filter(
    ps => ps.projectId === projectId
  );
  projectSolutions.forEach(ps => {
    const solution = data.solutions.find(s => s.id === ps.solutionId);
    if (solution) {
      solution.skillIds.forEach(skillId => {
        const skill = data.skills.find(s => s.id === skillId);
        if (skill && !skillMap.has(skillId)) {
          skillMap.set(skillId, {
            skillId,
            skillName: skill.name,
            importance: ps.isPrimary ? 'critical' : 'important',
            minimumProficiency: 'intermediate',
            requiredHeadcount: 1,
          });
        }
      });
    }
  });

  // Get direct project skills
  const directSkills = data.projectSkills.filter(
    ps => ps.projectId === projectId
  );
  directSkills.forEach(ps => {
    const skill = data.skills.find(s => s.id === ps.skillId);
    if (skill) {
      if (skillMap.has(ps.skillId)) {
        const existing = skillMap.get(ps.skillId)!;
        existing.importance = ps.importance;
      } else {
        skillMap.set(ps.skillId, {
          skillId: ps.skillId,
          skillName: skill.name,
          importance: ps.importance,
          minimumProficiency: 'intermediate',
          requiredHeadcount: 1,
        });
      }
    }
  });

  return Array.from(skillMap.values());
};

const getTeamRecommendations = (
  projectId: string,
  data: PlanningEngineData
): TeamRecommendation[] => {
  try {
    const scenarioResults = analyzeProjectTeamAvailability(projectId, data);

    return scenarioResults.teamMatches.map(match => ({
      teamId: match.teamId,
      teamName: match.teamName,
      matchScore: match.overallScore,
      skillMatch: match.skillMatchPercentage,
      availabilityMatch: match.availabilityPercentage,
      costEfficiency: calculateTeamCostEfficiency(match.teamId, data),
      availabilityWindows: getTeamAvailabilityWindows(match.teamId, data),
      currentAllocations: getCurrentTeamAllocations(match.teamId, data),
      skillGaps: match.skillBreakdown
        .filter(sb => !sb.hasSkill)
        .map(sb => ({
          skillId: sb.skillId,
          skillName: sb.skillName,
          required: true,
          importance: 'important' as const,
          availableInTeam: false,
          alternativeSkills: [],
        })),
    }));
  } catch (error) {
    console.error('Error getting team recommendations:', error);
    return [];
  }
};

const calculateTeamCostEfficiency = (
  teamId: string,
  data: PlanningEngineData
): number => {
  const team = data.teams.find(t => t.id === teamId);
  if (!team) return 0;

  const teamMembers = data.people.filter(
    p => p.teamId === teamId && p.isActive
  );
  if (teamMembers.length === 0) return 0;

  let totalCost = 0;
  teamMembers.forEach(person => {
    const role = data.roles.find(r => r.id === person.roleId);
    if (role) {
      const personCost = calculatePersonCost(person, role, data.config);
      totalCost += personCost.costPerWeek;
    }
  });

  // Calculate cost efficiency as capacity per dollar
  return team.capacity / totalCost;
};

const getTeamAvailabilityWindows = (
  teamId: string,
  data: PlanningEngineData
): any[] => {
  const now = new Date();
  const futureQuarters = data.cycles
    .filter(c => c.type === 'quarterly' && new Date(c.endDate) > now)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  return futureQuarters.map(quarter => {
    const quarterAllocations = data.allocations.filter(
      a => a.teamId === teamId && a.cycleId === quarter.id
    );

    const totalAllocation = quarterAllocations.reduce(
      (sum, a) => sum + a.percentage,
      0
    );

    return {
      startDate: quarter.startDate,
      endDate: quarter.endDate,
      availableCapacity: Math.max(0, 100 - totalAllocation),
      cycleId: quarter.id,
      cycleName: quarter.name,
    };
  });
};

const getCurrentTeamAllocations = (
  teamId: string,
  data: PlanningEngineData
): any[] => {
  const now = new Date();
  const currentAllocations = data.allocations.filter(
    a =>
      a.teamId === teamId &&
      data.cycles.some(
        c =>
          c.id === a.cycleId &&
          new Date(c.startDate) <= now &&
          new Date(c.endDate) >= now
      )
  );

  return currentAllocations.map(allocation => {
    const cycle = data.cycles.find(c => c.id === allocation.cycleId);
    let projectName = 'Run Work';
    let epicName = '';

    if (allocation.epicId) {
      const epic = data.projects
        .flatMap(p => p.milestones)
        .find(m => m.id === allocation.epicId);
      if (epic) {
        const project = data.projects.find(p =>
          p.milestones.some(m => m.id === allocation.epicId)
        );
        projectName = project?.name || 'Unknown Project';
        epicName = epic.name;
      }
    }

    return {
      projectId: allocation.epicId
        ? data.projects.find(p =>
            p.milestones.some(m => m.id === allocation.epicId)
          )?.id || ''
        : '',
      projectName,
      epicId: allocation.epicId,
      epicName,
      percentage: allocation.percentage,
      endDate: cycle?.endDate || '',
      cycleId: allocation.cycleId,
    };
  });
};

const calculateProjectBudgetImpact = (
  project: Project,
  teamRecommendations: TeamRecommendation[],
  data: PlanningEngineData
): BudgetImpactAnalysis => {
  // This is a simplified implementation - would need more complex logic
  const totalProjectCost = project.budget || 0;

  return {
    totalProjectCost,
    quarterlyBreakdown: [],
    divisionBudgetImpact: [],
    costPerTeam: teamRecommendations.map(team => ({
      teamId: team.teamId,
      teamName: team.teamName,
      currentSize: data.people.filter(
        p => p.teamId === team.teamId && p.isActive
      ).length,
      totalCost: 0,
      projectAllocationCost: 0,
      runWorkCost: 0,
      costPerPerson: 0,
    })),
    runWorkImpact: {
      currentRunWorkPercentage: 0,
      projectedRunWorkPercentage: 0,
      impactOnDivisionBudget: 0,
      divisionBudgetUtilization: 0,
    },
  };
};

const assessProjectRisks = (
  project: Project,
  skillRequirements: ProjectSkillRequirement[],
  teamRecommendations: TeamRecommendation[],
  data: PlanningEngineData
): FeasibilityRisk[] => {
  const risks: FeasibilityRisk[] = [];

  // Skill gap risks
  const criticalSkillGaps = skillRequirements.filter(
    req =>
      req.importance === 'critical' &&
      !teamRecommendations.some(
        team =>
          team.skillGaps.length === 0 ||
          !team.skillGaps.some(gap => gap.skillId === req.skillId)
      )
  );

  if (criticalSkillGaps.length > 0) {
    risks.push({
      type: 'skill-gap',
      severity: 'high',
      description: `Critical skills missing: ${criticalSkillGaps.map(s => s.skillName).join(', ')}`,
      impact: 80,
      mitigation: 'Consider training or hiring for these skills',
    });
  }

  // Budget constraint risks
  if (project.budget && project.budget > 0) {
    const availableBudget = data.divisionBudgets
      .filter(db => data.divisions.some(d => d.id === db.divisionId))
      .reduce((sum, db) => sum + db.projectBudget, 0);

    if (project.budget > availableBudget * 0.8) {
      risks.push({
        type: 'budget-constraint',
        severity: 'medium',
        description: 'Project budget approaches division budget limits',
        impact: 60,
        mitigation: 'Review budget allocation or consider phased approach',
      });
    }
  }

  return risks;
};

const calculateFeasibilityScore = (
  skillRequirements: ProjectSkillRequirement[],
  teamRecommendations: TeamRecommendation[],
  budgetImpact: BudgetImpactAnalysis,
  risks: FeasibilityRisk[]
): number => {
  if (teamRecommendations.length === 0) return 0;

  const avgTeamScore =
    teamRecommendations.reduce((sum, team) => sum + team.matchScore, 0) /
    teamRecommendations.length;
  const riskPenalty = risks.reduce((sum, risk) => sum + risk.impact, 0) / 100;

  return Math.max(0, avgTeamScore - riskPenalty);
};

const calculateProjectDuration = (
  project: Project,
  cycles: Cycle[]
): number => {
  if (!project.endDate) return 0;

  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const iterationCycles = cycles.filter(c => c.type === 'iteration');

  if (iterationCycles.length === 0) return 0;

  // Estimate based on typical iteration length
  const avgIterationLength =
    iterationCycles.reduce((sum, cycle) => {
      const duration =
        new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime();
      return sum + duration;
    }, 0) / iterationCycles.length;

  const projectDuration = end.getTime() - start.getTime();
  return Math.ceil(projectDuration / avgIterationLength);
};

export const createPlanningScenario = (
  name: string,
  projectIds: string[],
  data: PlanningEngineData
): PlanningScenario => {
  const analyses = analyzeProjectsFeasibility(projectIds, data);

  return {
    id: Date.now().toString(),
    name,
    description: `Planning scenario for ${projectIds.length} projects`,
    projectIds,
    teamChanges: [],
    budgetImpact: {
      totalProjectCost: analyses.reduce(
        (sum, a) => sum + a.budgetRequirement,
        0
      ),
      quarterlyBreakdown: [],
      divisionBudgetImpact: [],
      costPerTeam: [],
      runWorkImpact: {
        currentRunWorkPercentage: 0,
        projectedRunWorkPercentage: 0,
        impactOnDivisionBudget: 0,
        divisionBudgetUtilization: 0,
      },
    },
    feasibilityScore:
      analyses.reduce((sum, a) => sum + a.feasibilityScore, 0) /
      analyses.length,
    riskAssessment: [],
    createdDate: new Date().toISOString(),
  };
};
