
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, TrendingUp, AlertTriangle, Target 
} from 'lucide-react';
import { ProjectFeasibilityAnalysis } from '@/types/planningTypes';
import { Division } from '@/types';

interface BudgetImpactAnalyzerProps {
  projectAnalyses: ProjectFeasibilityAnalysis[];
  divisions: Division[];
}

const BudgetImpactAnalyzer: React.FC<BudgetImpactAnalyzerProps> = ({
  projectAnalyses,
  divisions
}) => {
  const calculateBudgetSummary = () => {
    const totalProjectBudget = projectAnalyses.reduce((sum, analysis) => 
      sum + analysis.budgetRequirement, 0
    );
    
    const totalDivisionBudget = divisions.reduce((sum, division) => 
      sum + (division.budget || 0), 0
    );
    
    const utilizationPercentage = totalDivisionBudget > 0 
      ? (totalProjectBudget / totalDivisionBudget) * 100 
      : 0;
    
    return {
      totalProjectBudget,
      totalDivisionBudget,
      utilizationPercentage,
      remainingBudget: totalDivisionBudget - totalProjectBudget
    };
  };

  const getBudgetRiskLevel = (utilization: number) => {
    if (utilization > 90) return { level: 'high', color: 'text-red-600', bg: 'bg-red-50' };
    if (utilization > 70) return { level: 'medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'low', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const budgetSummary = calculateBudgetSummary();
  const riskLevel = getBudgetRiskLevel(budgetSummary.utilizationPercentage);

  return (
    <div className="space-y-6">
      {/* Overall Budget Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Budget Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Budget Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                ${(budgetSummary.totalProjectBudget / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-gray-600">Total Project Budget</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Target className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <div className="text-2xl font-bold text-gray-600">
                ${(budgetSummary.totalDivisionBudget / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-gray-600">Total Division Budget</p>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${riskLevel.bg}`}>
              <TrendingUp className={`h-8 w-8 mx-auto mb-2 ${riskLevel.color}`} />
              <div className={`text-2xl font-bold ${riskLevel.color}`}>
                {budgetSummary.utilizationPercentage.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Budget Utilization</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">
                ${(budgetSummary.remainingBudget / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-gray-600">Remaining Budget</p>
            </div>
          </div>

          {/* Budget Utilization Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Division Budget Utilization</span>
              <Badge className={riskLevel.color} variant="outline">
                {riskLevel.level.toUpperCase()} RISK
              </Badge>
            </div>
            <Progress value={budgetSummary.utilizationPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>${(budgetSummary.totalDivisionBudget / 1000000).toFixed(1)}M</span>
            </div>
          </div>

          {/* Budget Warnings */}
          {budgetSummary.utilizationPercentage > 80 && (
            <div className={`p-4 rounded-lg ${riskLevel.bg} border border-opacity-20`}>
              <div className="flex items-start space-x-2">
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${riskLevel.color}`} />
                <div>
                  <h4 className={`font-medium ${riskLevel.color}`}>Budget Utilization Warning</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Selected projects would utilize {budgetSummary.utilizationPercentage.toFixed(1)}% 
                    of available division budgets. Consider:
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• Phasing project implementation across quarters</li>
                    <li>• Reviewing project priorities and scope</li>
                    <li>• Optimizing team allocations for cost efficiency</li>
                    <li>• Exploring budget reallocation options</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project-by-Project Budget Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Project Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectAnalyses.map(analysis => (
              <div key={analysis.projectId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{analysis.projectName}</h4>
                  <p className="text-sm text-gray-600">
                    Duration: {analysis.timelineRequirement.durationInIterations} iterations
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    ${(analysis.budgetRequirement / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-gray-600">
                    {((analysis.budgetRequirement / budgetSummary.totalProjectBudget) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Division Budget Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Division Budget Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {divisions.map(division => {
              const divisionUtilization = division.budget 
                ? (budgetSummary.totalProjectBudget / divisions.length / division.budget) * 100
                : 0;
              
              return (
                <div key={division.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{division.name}</h4>
                    <span className="text-sm text-gray-600">
                      ${((division.budget || 0) / 1000000).toFixed(1)}M budget
                    </span>
                  </div>
                  <Progress value={divisionUtilization} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{divisionUtilization.toFixed(1)}% utilized</span>
                    <span>
                      ${(((division.budget || 0) - (budgetSummary.totalProjectBudget / divisions.length)) / 1000000).toFixed(1)}M remaining
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetImpactAnalyzer;
