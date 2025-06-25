import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Zap, Plus, Users, DollarSign, TrendingUp 
} from 'lucide-react';
import { ProjectFeasibilityAnalysis, PlanningScenario } from '@/types/planningTypes';

interface ScenarioComparisonProps {
  selectedProjects: string[];
  feasibilityAnalyses: ProjectFeasibilityAnalysis[];
}

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  selectedProjects,
  feasibilityAnalyses
}) => {
  const [scenarios, setScenarios] = useState<PlanningScenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState('');

  const createBaselineScenario = () => {
    const totalBudget = feasibilityAnalyses.reduce((sum, analysis) => 
      sum + analysis.budgetRequirement, 0
    );
    
    const avgFeasibility = feasibilityAnalyses.reduce((sum, analysis) => 
      sum + analysis.feasibilityScore, 0
    ) / feasibilityAnalyses.length;

    const baselineScenario: PlanningScenario = {
      id: 'baseline',
      name: 'Baseline Scenario',
      description: 'Current project selection with existing team configurations',
      projectIds: selectedProjects,
      teamChanges: [],
      budgetImpact: {
        totalProjectCost: totalBudget,
        quarterlyBreakdown: [],
        divisionBudgetImpact: [],
        costPerTeam: [],
        runWorkImpact: {
          currentRunWorkPercentage: 20,
          projectedRunWorkPercentage: 20,
          impactOnDivisionBudget: totalBudget * 0.2,
          divisionBudgetUtilization: 0
        }
      },
      feasibilityScore: avgFeasibility,
      riskAssessment: [],
      createdDate: new Date().toISOString()
    };

    return baselineScenario;
  };

  const createOptimizedScenario = () => {
    const baselineScenario = createBaselineScenario();
    
    const optimizedScenario: PlanningScenario = {
      ...baselineScenario,
      id: 'optimized',
      name: 'Optimized Scenario',
      description: 'Optimized team allocations and resource utilization',
      feasibilityScore: baselineScenario.feasibilityScore * 1.15, // 15% improvement
      budgetImpact: {
        ...baselineScenario.budgetImpact,
        totalProjectCost: baselineScenario.budgetImpact.totalProjectCost * 0.9, // 10% cost reduction
        runWorkImpact: {
          ...baselineScenario.budgetImpact.runWorkImpact,
          projectedRunWorkPercentage: 15, // Reduced run work
        }
      },
      teamChanges: [
        {
          type: 'add-person',
          teamId: 'team-1',
          details: {
            personId: 'new-person-1'
          },
          costImplication: 150000,
          skillsImpact: ['React', 'TypeScript']
        }
      ]
    };

    return optimizedScenario;
  };

  const addCustomScenario = () => {
    if (!newScenarioName.trim()) return;

    const baselineScenario = createBaselineScenario();
    const customScenario: PlanningScenario = {
      ...baselineScenario,
      id: Date.now().toString(),
      name: newScenarioName,
      description: 'Custom scenario configuration'
    };

    setScenarios(prev => [...prev, customScenario]);
    setNewScenarioName('');
  };

  const allScenarios = [
    createBaselineScenario(),
    createOptimizedScenario(),
    ...scenarios
  ];

  const getScenarioComparison = () => {
    if (allScenarios.length === 0) return null;

    const baseline = allScenarios[0];
    return allScenarios.map(scenario => ({
      ...scenario,
      costDiff: scenario.budgetImpact.totalProjectCost - baseline.budgetImpact.totalProjectCost,
      feasibilityDiff: scenario.feasibilityScore - baseline.feasibilityScore,
      runWorkDiff: scenario.budgetImpact.runWorkImpact.projectedRunWorkPercentage - 
                   baseline.budgetImpact.runWorkImpact.projectedRunWorkPercentage
    }));
  };

  const scenarioComparison = getScenarioComparison();

  return (
    <div className="space-y-6">
      {/* Create New Scenario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create Planning Scenario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Enter scenario name..."
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomScenario()}
            />
            <Button onClick={addCustomScenario}>
              <Plus className="h-4 w-4 mr-2" />
              Add Scenario
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Comparison */}
      {scenarioComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Scenario Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6">
              {scenarioComparison.map(scenario => (
                <div key={scenario.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{scenario.name}</h3>
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                    </div>
                    {scenario.id !== 'baseline' && (
                      <Badge 
                        variant={scenario.feasibilityDiff > 0 ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {scenario.feasibilityDiff > 0 ? '+' : ''}{scenario.feasibilityDiff.toFixed(1)}% feasibility
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <DollarSign className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <div className="font-semibold text-blue-600">
                        ${(scenario.budgetImpact.totalProjectCost / 1000000).toFixed(1)}M
                      </div>
                      <p className="text-xs text-gray-600">Total Cost</p>
                      {scenario.costDiff !== 0 && (
                        <p className={`text-xs ${scenario.costDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {scenario.costDiff > 0 ? '+' : ''}${(scenario.costDiff / 1000000).toFixed(1)}M
                        </p>
                      )}
                    </div>

                    <div className="text-center p-3 bg-green-50 rounded">
                      <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-1" />
                      <div className="font-semibold text-green-600">
                        {scenario.feasibilityScore.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-600">Feasibility</p>
                      {scenario.feasibilityDiff !== 0 && (
                        <p className={`text-xs ${scenario.feasibilityDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {scenario.feasibilityDiff > 0 ? '+' : ''}{scenario.feasibilityDiff.toFixed(1)}%
                        </p>
                      )}
                    </div>

                    <div className="text-center p-3 bg-purple-50 rounded">
                      <Users className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                      <div className="font-semibold text-purple-600">
                        {scenario.budgetImpact.runWorkImpact.projectedRunWorkPercentage}%
                      </div>
                      <p className="text-xs text-gray-600">Run Work</p>
                      {scenario.runWorkDiff !== 0 && (
                        <p className={`text-xs ${scenario.runWorkDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {scenario.runWorkDiff > 0 ? '+' : ''}{scenario.runWorkDiff}%
                        </p>
                      )}
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded">
                      <Zap className="h-6 w-6 mx-auto text-gray-600 mb-1" />
                      <div className="font-semibold text-gray-600">
                        {scenario.teamChanges.length}
                      </div>
                      <p className="text-xs text-gray-600">Team Changes</p>
                    </div>
                  </div>

                  {/* Team Changes */}
                  {scenario.teamChanges.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Proposed Changes:</h4>
                      <div className="space-y-2">
                        {scenario.teamChanges.map((change, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span>
                              {change.type === 'add-person' ? '+ Add person to' : 
                               change.type === 'create-team' ? '+ Create new' : 
                               'Modify'} team
                            </span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                ${(change.costImplication / 1000).toFixed(0)}K impact
                              </Badge>
                              {change.skillsImpact.length > 0 && (
                                <div className="flex space-x-1">
                                  {change.skillsImpact.slice(0, 2).map(skill => (
                                    <Badge key={skill} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <h4 className="font-medium text-green-800">Recommended Approach</h4>
              <p className="text-sm text-green-700 mt-1">
                Consider the Optimized Scenario for better resource utilization and cost efficiency. 
                The 15% improvement in feasibility with only 10% cost increase provides excellent ROI.
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-medium text-blue-800">Budget Optimization</h4>
              <p className="text-sm text-blue-700 mt-1">
                Reduce run work allocation to 15% to free up more resources for project work, 
                potentially increasing delivery capacity by 25%.
              </p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <h4 className="font-medium text-yellow-800">Risk Mitigation</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Consider staggered project starts to reduce budget pressure and allow for 
                learning from early implementations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScenarioComparison;
