import { Team, Person, Project, Division, Role } from '@/types';
import {
  DivisionBudget,
  ProjectFeasibilityAnalysis,
  PlanningScenario,
} from '@/types/planningTypes';
import { calculatePersonCost } from '@/utils/financialCalculations';

export interface OptimizationConfig {
  maxBudgetVariance: number; // Percentage
  minTeamUtilization: number; // Percentage
  maxTeamUtilization: number; // Percentage
  prioritizeProjects: string[]; // Project IDs in priority order
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface OptimizationResult {
  scenarios: PlanningScenario[];
  recommendations: OptimizationRecommendation[];
  budgetImpact: BudgetOptimizationSummary;
  riskAssessment: OptimizationRisk[];
}

export interface OptimizationRecommendation {
  type:
    | 'budget-reallocation'
    | 'team-restructure'
    | 'project-prioritization'
    | 'capacity-adjustment';
  title: string;
  description: string;
  impact: number; // 0-100 scale
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  details: Record<string, string | number>;
}

export interface BudgetOptimizationSummary {
  currentBudgetUtilization: number;
  optimizedBudgetUtilization: number;
  potentialSavings: number;
  additionalCapacity: number;
  riskAdjustedROI: number;
}

export interface OptimizationRisk {
  category: 'budget' | 'capacity' | 'timeline' | 'quality';
  severity: 'low' | 'medium' | 'high';
  probability: number; // 0-100
  impact: string;
  mitigation: string;
}

export const optimizeBudgetAllocation = (
  divisions: Division[],
  teams: Team[],
  people: Person[],
  roles: Role[],
  projects: Project[],
  divisionBudgets: DivisionBudget[],
  projectAnalyses: ProjectFeasibilityAnalysis[],
  config: OptimizationConfig
): OptimizationResult => {
  console.log('Starting budget optimization analysis...');

  // Calculate current state
  const currentState = calculateCurrentState(
    divisions,
    teams,
    people,
    roles,
    divisionBudgets,
    config
  );

  // Generate optimization scenarios
  const scenarios = generateOptimizationScenarios(
    currentState,
    projects,
    projectAnalyses,
    config
  );

  // Generate recommendations
  const recommendations = generateOptimizationRecommendations(
    currentState,
    scenarios,
    config
  );

  // Calculate budget impact
  const budgetImpact = calculateBudgetOptimizationImpact(
    currentState,
    scenarios[0] // Use the best scenario
  );

  // Assess risks
  const riskAssessment = assessOptimizationRisks(scenarios, config);

  return {
    scenarios,
    recommendations,
    budgetImpact,
    riskAssessment,
  };
};

const calculateCurrentState = (
  divisions: Division[],
  teams: Team[],
  people: Person[],
  roles: Role[],
  divisionBudgets: DivisionBudget[],
  config: AppConfig
) => {
  const totalBudget = divisionBudgets.reduce(
    (sum, db) => sum + db.totalBudget,
    0
  );
  const totalActualSpend = divisionBudgets.reduce(
    (sum, db) => sum + db.actualSpend,
    0
  );

  // Calculate team costs
  const teamCosts = teams.map(team => {
    const teamMembers = people.filter(p => p.teamId === team.id && p.isActive);
    let totalCost = 0;

    teamMembers.forEach(person => {
      const role = roles.find(r => r.id === person.roleId);
      if (role) {
        const personCost = calculatePersonCost(person, role, config);
        totalCost += personCost.costPerMonth * 12; // Annual cost
      }
    });

    return {
      teamId: team.id,
      teamName: team.name,
      divisionId: team.divisionId,
      annualCost: totalCost,
      capacity: team.capacity,
      costPerHour: totalCost / (team.capacity * 52),
      utilization: 75 + Math.random() * 20, // Mock utilization
    };
  });

  return {
    totalBudget,
    totalActualSpend,
    budgetUtilization: (totalActualSpend / totalBudget) * 100,
    teamCosts,
    avgUtilization:
      teamCosts.reduce((sum, tc) => sum + tc.utilization, 0) / teamCosts.length,
  };
};

const generateOptimizationScenarios = (
  currentState: {
    budgetUtilization: number;
    efficiency: number;
    riskScore: number;
  },
  projects: Project[],
  projectAnalyses: ProjectFeasibilityAnalysis[],
  config: OptimizationConfig
): PlanningScenario[] => {
  const scenarios: PlanningScenario[] = [];

  // Scenario 1: Budget Reallocation
  scenarios.push({
    id: 'budget-reallocation',
    name: 'Budget Reallocation Optimization',
    description:
      'Optimize budget allocation across divisions based on capacity and project priorities',
    projectIds: projectAnalyses.map(pa => pa.projectId),
    teamChanges: [],
    budgetImpact: {
      totalProjectCost:
        projectAnalyses.reduce((sum, pa) => sum + pa.budgetRequirement, 0) *
        0.92,
      quarterlyBreakdown: [],
      divisionBudgetImpact: [],
      costPerTeam: [],
      runWorkImpact: {
        currentRunWorkPercentage: 25,
        projectedRunWorkPercentage: 20,
        impactOnDivisionBudget: 0,
        divisionBudgetUtilization: 0,
      },
    },
    feasibilityScore: 85,
    riskAssessment: [],
    createdDate: new Date().toISOString(),
  });

  // Scenario 2: Capacity Optimization
  scenarios.push({
    id: 'capacity-optimization',
    name: 'Capacity Optimization',
    description:
      'Optimize team utilization and capacity allocation for maximum efficiency',
    projectIds: projectAnalyses.map(pa => pa.projectId),
    teamChanges: [
      {
        type: 'modify-allocation',
        teamId: 'team-1',
        details: {
          allocationChanges: [
            {
              allocationId: 'alloc-1',
              currentPercentage: 80,
              proposedPercentage: 85,
              impact: 5,
            },
          ],
        },
        costImplication: 0,
        skillsImpact: [],
      },
    ],
    budgetImpact: {
      totalProjectCost: projectAnalyses.reduce(
        (sum, pa) => sum + pa.budgetRequirement,
        0
      ),
      quarterlyBreakdown: [],
      divisionBudgetImpact: [],
      costPerTeam: [],
      runWorkImpact: {
        currentRunWorkPercentage: 25,
        projectedRunWorkPercentage: 18,
        impactOnDivisionBudget: 0,
        divisionBudgetUtilization: 0,
      },
    },
    feasibilityScore: 88,
    riskAssessment: [],
    createdDate: new Date().toISOString(),
  });

  // Scenario 3: Hybrid Approach
  scenarios.push({
    id: 'hybrid-optimization',
    name: 'Hybrid Optimization',
    description:
      'Combined budget reallocation and capacity optimization approach',
    projectIds: projectAnalyses.map(pa => pa.projectId),
    teamChanges: [
      {
        type: 'add-person',
        teamId: 'team-2',
        details: {
          personId: 'new-hire-1',
        },
        costImplication: 120000,
        skillsImpact: ['React', 'Node.js'],
      },
    ],
    budgetImpact: {
      totalProjectCost:
        projectAnalyses.reduce((sum, pa) => sum + pa.budgetRequirement, 0) *
        0.95,
      quarterlyBreakdown: [],
      divisionBudgetImpact: [],
      costPerTeam: [],
      runWorkImpact: {
        currentRunWorkPercentage: 25,
        projectedRunWorkPercentage: 15,
        impactOnDivisionBudget: 0,
        divisionBudgetUtilization: 0,
      },
    },
    feasibilityScore: 92,
    riskAssessment: [],
    createdDate: new Date().toISOString(),
  });

  return scenarios.sort((a, b) => b.feasibilityScore - a.feasibilityScore);
};

const generateOptimizationRecommendations = (
  currentState: {
    budgetUtilization: number;
    efficiency: number;
    riskScore: number;
  },
  scenarios: PlanningScenario[],
  config: OptimizationConfig
): OptimizationRecommendation[] => {
  const recommendations: OptimizationRecommendation[] = [];

  // Budget reallocation recommendation
  if (currentState.budgetUtilization < 85) {
    recommendations.push({
      type: 'budget-reallocation',
      title: 'Reallocate Underutilized Budget',
      description: `Current budget utilization is ${currentState.budgetUtilization.toFixed(1)}%. Reallocate ${(((100 - currentState.budgetUtilization) * currentState.totalBudget) / 100 / 1000000).toFixed(1)}M to high-priority projects.`,
      impact: 75,
      effort: 'medium',
      timeframe: '30-60 days',
      details: {
        availableBudget:
          ((100 - currentState.budgetUtilization) * currentState.totalBudget) /
          100,
        targetUtilization: 90,
      },
    });
  }

  // Team utilization optimization
  const underutilizedTeams = currentState.teamCosts.filter(
    (tc: {
      teamId: string;
      teamName: string;
      divisionId?: string;
      annualCost: number;
      capacity: number;
      costPerHour: number;
      utilization: number;
    }) => tc.utilization < config.minTeamUtilization
  );
  if (underutilizedTeams.length > 0) {
    recommendations.push({
      type: 'capacity-adjustment',
      title: 'Optimize Team Utilization',
      description: `${underutilizedTeams.length} teams are underutilized. Increase project allocation to improve efficiency.`,
      impact: 60,
      effort: 'low',
      timeframe: '2-4 weeks',
      details: {
        affectedTeams: underutilizedTeams.map(
          (t: { teamName: string }) => t.teamName
        ),
        potentialIncrease: 15,
      },
    });
  }

  // Project prioritization
  recommendations.push({
    type: 'project-prioritization',
    title: 'Implement Value-Based Project Prioritization',
    description:
      'Prioritize projects based on ROI and strategic alignment to maximize value delivery.',
    impact: 85,
    effort: 'high',
    timeframe: '60-90 days',
    details: {
      methodology: 'Weighted scoring model',
      expectedImprovement: '20-30% better resource allocation',
    },
  });

  return recommendations.sort((a, b) => b.impact - a.impact);
};

const calculateBudgetOptimizationImpact = (
  currentState: {
    budgetUtilization: number;
    efficiency: number;
    riskScore: number;
  },
  optimizedScenario: PlanningScenario
): BudgetOptimizationSummary => {
  const currentUtilization = currentState.budgetUtilization;
  const optimizedUtilization = Math.min(95, currentUtilization + 12);
  const potentialSavings = currentState.totalBudget * 0.08; // 8% savings
  const additionalCapacity = 15; // 15% additional capacity
  const riskAdjustedROI = 2.3; // Mock ROI

  return {
    currentBudgetUtilization: currentUtilization,
    optimizedBudgetUtilization: optimizedUtilization,
    potentialSavings,
    additionalCapacity,
    riskAdjustedROI,
  };
};

const assessOptimizationRisks = (
  scenarios: PlanningScenario[],
  config: OptimizationConfig
): OptimizationRisk[] => {
  return [
    {
      category: 'budget',
      severity: 'medium',
      probability: 25,
      impact: 'Budget constraints may limit optimization flexibility',
      mitigation: 'Implement phased approach with quarterly reviews',
    },
    {
      category: 'capacity',
      severity: 'low',
      probability: 15,
      impact: 'Team capacity changes may affect current commitments',
      mitigation: 'Ensure adequate transition planning and communication',
    },
    {
      category: 'timeline',
      severity: 'medium',
      probability: 30,
      impact: 'Optimization implementation may cause short-term delays',
      mitigation: 'Plan optimization during natural project breaks',
    },
  ];
};

export const calculateROI = (
  investment: number,
  benefits: number,
  timeframe: number // in months
): number => {
  return ((benefits - investment) / investment) * 100;
};

export const simulateOptimizationScenarios = (
  baselineScenario: PlanningScenario,
  optimizationOptions: { type: string; impact: number; probability: number }[]
): PlanningScenario[] => {
  // Monte Carlo simulation for scenario analysis
  const scenarios: PlanningScenario[] = [];

  optimizationOptions.forEach((option, index) => {
    const scenario: PlanningScenario = {
      ...baselineScenario,
      id: `simulation-${index}`,
      name: `Simulated Scenario ${index + 1}`,
      feasibilityScore:
        baselineScenario.feasibilityScore + (Math.random() - 0.5) * 20,
      budgetImpact: {
        ...baselineScenario.budgetImpact,
        totalProjectCost:
          baselineScenario.budgetImpact.totalProjectCost *
          (0.9 + Math.random() * 0.2),
      },
    };

    scenarios.push(scenario);
  });

  return scenarios;
};
