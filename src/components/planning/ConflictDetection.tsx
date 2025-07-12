import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Target,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Team, Allocation, Epic, Project, Person, Cycle } from '@/types';
import {
  detectAllocationConflicts,
  AllocationConflict,
  ConflictDetectionResult,
  getConflictTypeIcon,
  getConflictSeverityColor,
  ConflictSeverity,
} from '@/utils/conflictDetection';

interface ConflictDetectionProps {
  allocations: Allocation[];
  teams: Team[];
  epics: Epic[];
  projects: Project[];
  people: Person[];
  iterations: Cycle[];
  selectedCycleId: string;
  onConflictResolve?: (conflictId: string, resolutionAction: string) => void;
}

const ConflictDetection: React.FC<ConflictDetectionProps> = ({
  allocations,
  teams,
  epics,
  projects,
  people,
  iterations,
  selectedCycleId,
  onConflictResolve,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedConflicts, setExpandedConflicts] = React.useState<Set<string>>(
    new Set()
  );

  const conflictDetectionResult: ConflictDetectionResult = useMemo(() => {
    return detectAllocationConflicts(
      allocations,
      teams,
      epics,
      projects,
      people,
      iterations,
      selectedCycleId
    );
  }, [
    allocations,
    teams,
    epics,
    projects,
    people,
    iterations,
    selectedCycleId,
  ]);

  const toggleConflictExpansion = (conflictId: string) => {
    setExpandedConflicts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conflictId)) {
        newSet.delete(conflictId);
      } else {
        newSet.add(conflictId);
      }
      return newSet;
    });
  };

  const getSeverityIcon = (severity: ConflictSeverity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getRiskLevel = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'High Risk', color: 'text-red-600' };
    if (score >= 60) return { label: 'Medium Risk', color: 'text-orange-600' };
    if (score >= 40) return { label: 'Low Risk', color: 'text-yellow-600' };
    return { label: 'Minimal Risk', color: 'text-green-600' };
  };

  const riskLevel = getRiskLevel(conflictDetectionResult.overallRiskScore);

  if (conflictDetectionResult.conflicts.length === 0) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-green-500" />
              <span>Conflict Detection</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-normal text-green-700">
                No Conflicts
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="text-sm text-gray-600">
              All allocations appear to be conflict-free. Your planning looks
              good!
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
            <span>Conflict Detection</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="text-xs">
              {conflictDetectionResult.summary.total} conflict
              {conflictDetectionResult.summary.total !== 1 ? 's' : ''}
            </Badge>
            <div className="text-xs text-gray-600">
              Risk: <span className={riskLevel.color}>{riskLevel.label}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Risk Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  Overall Risk Level
                </div>
                <div className={`text-lg font-bold ${riskLevel.color}`}>
                  {riskLevel.label}
                </div>
                <Progress
                  value={conflictDetectionResult.overallRiskScore}
                  className="mt-2 h-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Risk Score: {conflictDetectionResult.overallRiskScore}/100
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Affected Teams</div>
                  <div className="text-lg font-bold">
                    {conflictDetectionResult.affectedTeamsCount}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Affected Epics</div>
                  <div className="text-lg font-bold">
                    {conflictDetectionResult.affectedEpicsCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conflict Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-lg font-bold text-red-600">
                {conflictDetectionResult.summary.critical}
              </div>
              <div className="text-xs text-red-600">Critical</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-lg font-bold text-orange-600">
                {conflictDetectionResult.summary.high}
              </div>
              <div className="text-xs text-orange-600">High</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-lg font-bold text-yellow-600">
                {conflictDetectionResult.summary.medium}
              </div>
              <div className="text-xs text-yellow-600">Medium</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-600">
                {conflictDetectionResult.summary.low}
              </div>
              <div className="text-xs text-blue-600">Low</div>
            </div>
          </div>

          {/* Conflict List */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              Detected Conflicts
            </div>
            {conflictDetectionResult.conflicts.map(conflict => (
              <Collapsible
                key={conflict.id}
                open={expandedConflicts.has(conflict.id)}
                onOpenChange={() => toggleConflictExpansion(conflict.id)}
              >
                <Card
                  className={`border ${getConflictSeverityColor(conflict.severity)}`}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-lg">
                            {getConflictTypeIcon(conflict.type)}
                          </div>
                          <div>
                            <div className="font-medium">{conflict.title}</div>
                            <div className="text-sm text-gray-600">
                              {conflict.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={getConflictSeverityColor(
                              conflict.severity
                            )}
                          >
                            {getSeverityIcon(conflict.severity)}
                            <span className="ml-1">{conflict.severity}</span>
                          </Badge>
                          {expandedConflicts.has(conflict.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Impact Assessment */}
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Impact Assessment
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-gray-600">Delay Risk</div>
                            <div className="flex items-center space-x-2">
                              <Progress
                                value={conflict.impact.delayRisk}
                                className="flex-1 h-2"
                              />
                              <span className="text-xs">
                                {conflict.impact.delayRisk}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Quality Risk</div>
                            <div className="flex items-center space-x-2">
                              <Progress
                                value={conflict.impact.qualityRisk}
                                className="flex-1 h-2"
                              />
                              <span className="text-xs">
                                {conflict.impact.qualityRisk}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Resource Waste</div>
                            <div className="flex items-center space-x-2">
                              <Progress
                                value={conflict.impact.resourceWaste}
                                className="flex-1 h-2"
                              />
                              <span className="text-xs">
                                {conflict.impact.resourceWaste}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Affected Resources */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-1">
                            Affected Teams
                          </div>
                          <div className="text-xs text-gray-600">
                            {conflict.affectedTeams.length} team
                            {conflict.affectedTeams.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">
                            Affected Epics
                          </div>
                          <div className="text-xs text-gray-600">
                            {conflict.affectedEpics.length} epic
                            {conflict.affectedEpics.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">
                            Affected Allocations
                          </div>
                          <div className="text-xs text-gray-600">
                            {conflict.affectedAllocations.length} allocation
                            {conflict.affectedAllocations.length !== 1
                              ? 's'
                              : ''}
                          </div>
                        </div>
                      </div>

                      {/* Suggested Actions */}
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Suggested Actions
                        </div>
                        <div className="space-y-2">
                          {conflict.suggestedActions.map((action, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <div className="text-sm text-gray-700">
                                • {action}
                              </div>
                              {onConflictResolve && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onConflictResolve(conflict.id, action)
                                  }
                                  className="text-xs"
                                >
                                  Apply
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-1" />
                Auto-resolve Low Priority
              </Button>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-1" />
                Rebalance Teams
              </Button>
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-1" />
                Adjust Timelines
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ConflictDetection;
