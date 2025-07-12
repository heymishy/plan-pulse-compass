import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Bell,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Clock,
  Target,
  X,
} from 'lucide-react';
import { Team, Allocation, Cycle } from '@/types';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

export type WarningType =
  | 'approaching-capacity'
  | 'over-capacity'
  | 'under-utilized'
  | 'uneven-distribution'
  | 'rapid-change';

export type WarningLevel = 'info' | 'warning' | 'error' | 'critical';

export interface CapacityWarning {
  id: string;
  type: WarningType;
  level: WarningLevel;
  teamId: string;
  teamName: string;
  iterationNumber: number;
  currentCapacity: number;
  targetCapacity: number;
  message: string;
  suggestion: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  canAutoDismiss?: boolean;
}

interface CapacityWarningsProps {
  teams: Team[];
  allocations: Allocation[];
  iterations: Cycle[];
  selectedCycleId: string;
  onWarningDismiss?: (warningId: string) => void;
  onAutoFix?: (warningId: string, action: string) => void;
  realTimeUpdates?: boolean;
}

const CapacityWarnings: React.FC<CapacityWarningsProps> = ({
  teams,
  allocations,
  iterations,
  selectedCycleId,
  onWarningDismiss,
  onAutoFix,
  realTimeUpdates = true,
}) => {
  const [dismissedWarnings, setDismissedWarnings] = React.useState<Set<string>>(
    new Set()
  );

  const warnings = useMemo(() => {
    const relevantAllocations = allocations.filter(
      a => a.cycleId === selectedCycleId
    );
    const detectedWarnings: CapacityWarning[] = [];

    teams.forEach(team => {
      iterations.forEach((iteration, index) => {
        const iterationNumber = index + 1;
        const capacityCheck = calculateTeamCapacity(
          team,
          iterationNumber,
          relevantAllocations,
          iterations
        );

        const percentage = capacityCheck.allocatedPercentage;

        // Generate warnings based on capacity levels
        if (percentage > 120) {
          detectedWarnings.push({
            id: `critical-overallocation-${team.id}-${iterationNumber}`,
            type: 'over-capacity',
            level: 'critical',
            teamId: team.id,
            teamName: team.name,
            iterationNumber,
            currentCapacity: percentage,
            targetCapacity: 100,
            message: `Critical overallocation: ${Math.round(percentage)}% capacity`,
            suggestion: 'Immediately rebalance allocations or extend timeline',
            trend: 'increasing',
          });
        } else if (percentage > 100) {
          detectedWarnings.push({
            id: `overallocation-${team.id}-${iterationNumber}`,
            type: 'over-capacity',
            level: 'error',
            teamId: team.id,
            teamName: team.name,
            iterationNumber,
            currentCapacity: percentage,
            targetCapacity: 100,
            message: `Team over capacity: ${Math.round(percentage)}%`,
            suggestion: 'Reduce allocations or redistribute work',
            trend: 'increasing',
          });
        } else if (percentage > 90) {
          detectedWarnings.push({
            id: `approaching-capacity-${team.id}-${iterationNumber}`,
            type: 'approaching-capacity',
            level: 'warning',
            teamId: team.id,
            teamName: team.name,
            iterationNumber,
            currentCapacity: percentage,
            targetCapacity: 100,
            message: `Approaching capacity limit: ${Math.round(percentage)}%`,
            suggestion: 'Monitor closely or add buffer capacity',
            trend: 'stable',
            canAutoDismiss: true,
          });
        } else if (percentage < 40 && percentage > 0) {
          detectedWarnings.push({
            id: `under-utilized-${team.id}-${iterationNumber}`,
            type: 'under-utilized',
            level: 'info',
            teamId: team.id,
            teamName: team.name,
            iterationNumber,
            currentCapacity: percentage,
            targetCapacity: 80,
            message: `Team under-utilized: ${Math.round(percentage)}%`,
            suggestion: 'Consider adding more work or reassigning capacity',
            trend: 'stable',
            canAutoDismiss: true,
          });
        }
      });

      // Check for uneven distribution across iterations
      const teamCapacities = iterations.map((_, index) => {
        const iterationNumber = index + 1;
        const capacityCheck = calculateTeamCapacity(
          team,
          iterationNumber,
          relevantAllocations,
          iterations
        );
        return capacityCheck.allocatedPercentage;
      });

      const maxCapacity = Math.max(...teamCapacities);
      const minCapacity = Math.min(...teamCapacities.filter(c => c > 0));
      const variance = maxCapacity - minCapacity;

      if (variance > 60 && teamCapacities.filter(c => c > 0).length > 1) {
        detectedWarnings.push({
          id: `uneven-distribution-${team.id}`,
          type: 'uneven-distribution',
          level: 'warning',
          teamId: team.id,
          teamName: team.name,
          iterationNumber: 0, // Applies to all iterations
          currentCapacity: variance,
          targetCapacity: 30, // Target variance threshold
          message: `Uneven workload distribution (${Math.round(variance)}% variance)`,
          suggestion:
            'Smooth workload across iterations for better predictability',
          trend: 'stable',
        });
      }
    });

    return detectedWarnings.filter(w => !dismissedWarnings.has(w.id));
  }, [teams, allocations, iterations, selectedCycleId, dismissedWarnings]);

  const warningCounts = useMemo(() => {
    return {
      critical: warnings.filter(w => w.level === 'critical').length,
      error: warnings.filter(w => w.level === 'error').length,
      warning: warnings.filter(w => w.level === 'warning').length,
      info: warnings.filter(w => w.level === 'info').length,
      total: warnings.length,
    };
  }, [warnings]);

  const handleDismiss = (warningId: string) => {
    setDismissedWarnings(prev => new Set([...prev, warningId]));
    onWarningDismiss?.(warningId);
  };

  const getWarningIcon = (type: WarningType) => {
    switch (type) {
      case 'over-capacity':
        return <AlertTriangle className="h-4 w-4" />;
      case 'approaching-capacity':
        return <TrendingUp className="h-4 w-4" />;
      case 'under-utilized':
        return <TrendingDown className="h-4 w-4" />;
      case 'uneven-distribution':
        return <Target className="h-4 w-4" />;
      case 'rapid-change':
        return <Zap className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getWarningColor = (level: WarningLevel) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  if (warnings.length === 0) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-500" />
            Capacity Monitoring
            {realTimeUpdates && (
              <Badge variant="outline" className="ml-2 text-xs">
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-lg font-semibold text-green-700">
                All Systems Normal
              </div>
              <div className="text-sm text-gray-600">
                No capacity issues detected. Team allocations are within healthy
                ranges.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-orange-500" />
            <span>Capacity Warnings</span>
            {realTimeUpdates && (
              <Badge variant="outline" className="ml-2 text-xs">
                Live
              </Badge>
            )}
          </div>
          <Badge variant="secondary">
            {warningCounts.total} warning{warningCounts.total !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-lg font-bold text-red-600">
              {warningCounts.critical + warningCounts.error}
            </div>
            <div className="text-xs text-red-600">Critical/Error</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-lg font-bold text-orange-600">
              {warningCounts.warning}
            </div>
            <div className="text-xs text-orange-600">Warning</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-blue-600">
              {warningCounts.info}
            </div>
            <div className="text-xs text-blue-600">Info</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-600">
              {teams.length - new Set(warnings.map(w => w.teamId)).size}
            </div>
            <div className="text-xs text-gray-600">Healthy Teams</div>
          </div>
        </div>

        {/* Warning List */}
        <div className="space-y-2">
          {warnings.slice(0, 10).map(warning => (
            <Card
              key={warning.id}
              className={`border ${getWarningColor(warning.level)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div
                      className={`p-2 rounded-lg ${getWarningColor(warning.level)}`}
                    >
                      {getWarningIcon(warning.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{warning.teamName}</span>
                        {warning.iterationNumber > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Iteration {warning.iterationNumber}
                          </Badge>
                        )}
                        {getTrendIcon(warning.trend)}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        {warning.message}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        💡 {warning.suggestion}
                      </div>

                      {/* Capacity Bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Capacity Usage</span>
                          <span>{Math.round(warning.currentCapacity)}%</span>
                        </div>
                        <Progress
                          value={Math.min(warning.currentCapacity, 150)}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {onAutoFix && warning.level !== 'info' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAutoFix(warning.id, 'auto-rebalance')}
                        className="text-xs"
                      >
                        Auto-fix
                      </Button>
                    )}
                    {warning.canAutoDismiss && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(warning.id)}
                        className="p-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {warnings.length > 10 && (
            <div className="text-center text-sm text-gray-500 py-2">
              ... and {warnings.length - 10} more warnings
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {warningCounts.total > 0 && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-1" />
                Auto-rebalance All
              </Button>
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-1" />
                Extend Timelines
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissedWarnings(new Set())}
              >
                Show All Warnings
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CapacityWarnings;
