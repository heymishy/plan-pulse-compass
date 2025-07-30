import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Equal,
  Plus,
  Minus,
  Users,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
} from 'lucide-react';
import type { ScenarioChange, ScenarioComparison } from '@/types/scenarioTypes';

interface ScenarioVisualDiffProps {
  comparison: ScenarioComparison;
}

const ScenarioVisualDiff: React.FC<ScenarioVisualDiffProps> = ({
  comparison,
}) => {
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <Equal className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'resources':
        return <Users className="h-4 w-4" />;
      case 'timeline':
        return <Calendar className="h-4 w-4" />;
      case 'scope':
        return <Target className="h-4 w-4" />;
      case 'organizational':
        return <Users className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const groupedChanges = comparison.changes.reduce(
    (acc, change) => {
      if (!acc[change.category]) {
        acc[change.category] = [];
      }
      acc[change.category].push(change);
      return acc;
    },
    {} as Record<string, ScenarioChange[]>
  );

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Impact Summary</span>
            <Badge
              variant={
                comparison.summary.impactLevel === 'high'
                  ? 'destructive'
                  : comparison.summary.impactLevel === 'medium'
                    ? 'secondary'
                    : 'default'
              }
            >
              {comparison.summary.impactLevel.toUpperCase()} IMPACT
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {comparison.summary.categorizedChanges.financial}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <DollarSign className="h-3 w-3 mr-1" />
                Financial
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {comparison.summary.categorizedChanges.resources}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <Users className="h-3 w-3 mr-1" />
                Resources
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {comparison.summary.categorizedChanges.timeline}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <Calendar className="h-3 w-3 mr-1" />
                Timeline
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {comparison.summary.categorizedChanges.scope}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <Target className="h-3 w-3 mr-1" />
                Scope
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {comparison.summary.categorizedChanges.organizational}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <Users className="h-3 w-3 mr-1" />
                Organizational
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Impact */}
      {comparison.financialImpact.totalCostDifference !== 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Financial Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Total Budget Change</span>
                <span
                  className={`text-lg font-bold ${
                    comparison.financialImpact.totalCostDifference >= 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {comparison.financialImpact.totalCostDifference >= 0
                    ? '+'
                    : ''}
                  {formatCurrency(
                    comparison.financialImpact.totalCostDifference
                  )}
                </span>
              </div>

              {comparison.financialImpact.projectCostChanges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">
                    Project Budget Changes
                  </h4>
                  {comparison.financialImpact.projectCostChanges.map(
                    (change, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-white border rounded"
                      >
                        <span className="text-sm">{change.projectName}</span>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-sm font-medium ${
                              change.costDifference >= 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {change.costDifference >= 0 ? '+' : ''}
                            {formatCurrency(change.costDifference)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({formatPercentage(change.percentageChange)})
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Impact */}
      {comparison.resourceImpact.teamCapacityChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Resource Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparison.resourceImpact.peopleChanges.added !== 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                  <span className="text-sm font-medium text-green-800">
                    People Added
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    +{comparison.resourceImpact.peopleChanges.added}
                  </span>
                </div>
              )}

              {comparison.resourceImpact.peopleChanges.removed !== 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                  <span className="text-sm font-medium text-red-800">
                    People Removed
                  </span>
                  <span className="text-lg font-bold text-red-600">
                    -{comparison.resourceImpact.peopleChanges.removed}
                  </span>
                </div>
              )}

              {comparison.resourceImpact.teamCapacityChanges.map(
                (change, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-white border rounded"
                  >
                    <span className="text-sm">{change.teamName}</span>
                    <span
                      className={`text-sm font-medium ${
                        change.capacityDifference >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {change.capacityDifference >= 0 ? '+' : ''}
                      {change.capacityDifference}h capacity
                    </span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Changes by Category */}
      {Object.entries(groupedChanges).map(([category, changes]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getCategoryIcon(category)}
              <span className="capitalize">{category} Changes</span>
              <Badge variant="outline">{changes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {changes.map((change, index) => (
                <div
                  key={change.id}
                  className={`p-3 border rounded-lg ${getImpactColor(change.impact)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getChangeIcon(change.changeType)}
                      <div>
                        <div className="font-medium text-sm">
                          {change.entityName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {change.description}
                        </div>

                        {change.details.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {change.details.map((detail, detailIndex) => (
                              <div
                                key={detailIndex}
                                className="text-xs bg-white/50 p-2 rounded"
                              >
                                <span className="font-medium">
                                  {detail.fieldDisplayName}:{' '}
                                </span>
                                <span className="text-red-600">
                                  {detail.formattedOldValue}
                                </span>
                                <span className="mx-1">→</span>
                                <span className="text-green-600">
                                  {detail.formattedNewValue}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        change.impact === 'high'
                          ? 'border-red-300'
                          : change.impact === 'medium'
                            ? 'border-yellow-300'
                            : 'border-green-300'
                      }`}
                    >
                      {change.impact}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {comparison.changes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Equal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              No Changes Detected
            </div>
            <div className="text-gray-600">
              This scenario is identical to the current live data.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScenarioVisualDiff;
