
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Team, Allocation, ActualAllocation, Project, Epic, RunWorkCategory, VarianceAnalysis as VarianceAnalysisType } from '@/types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface VarianceAnalysisProps {
  cycleId: string;
  teams: Team[];
  allocations: Allocation[];
  actualAllocations: ActualAllocation[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
}

const VarianceAnalysis: React.FC<VarianceAnalysisProps> = ({
  cycleId,
  teams,
  allocations,
  actualAllocations,
  projects,
  epics,
  runWorkCategories,
}) => {
  const varianceData = useMemo(() => {
    const plannedAllocations = allocations.filter(a => a.cycleId === cycleId);
    const actualAllocationsByIteration = actualAllocations.filter(a => a.cycleId === cycleId);
    
    const analyses: VarianceAnalysisType[] = [];
    const teamVariances: Record<string, { planned: number; actual: number; variance: number; iterations: number }> = {};
    const epicVariances: Record<string, { planned: number; actual: number; variance: number }> = {};
    
    // Calculate variances by team and iteration
    teams.forEach(team => {
      const teamPlanned = plannedAllocations.filter(a => a.teamId === team.id);
      const teamActuals = actualAllocationsByIteration.filter(a => a.teamId === team.id);
      
      // Group by iteration
      const iterationMap = new Map<number, { planned: number; actual: number }>();
      
      teamPlanned.forEach(planned => {
        const key = planned.iterationNumber;
        const current = iterationMap.get(key) || { planned: 0, actual: 0 };
        current.planned += planned.percentage;
        iterationMap.set(key, current);
      });
      
      teamActuals.forEach(actual => {
        const key = actual.iterationNumber;
        const current = iterationMap.get(key) || { planned: 0, actual: 0 };
        current.actual += actual.actualPercentage;
        iterationMap.set(key, current);
      });
      
      // Calculate team summary
      let totalPlanned = 0;
      let totalActual = 0;
      let iterationCount = 0;
      
      iterationMap.forEach((data, iterationNumber) => {
        if (data.actual > 0 || data.planned > 0) {
          const variance = data.actual - data.planned;
          
          analyses.push({
            allocationId: `${team.id}-${iterationNumber}`,
            teamId: team.id,
            iterationNumber,
            plannedPercentage: data.planned,
            actualPercentage: data.actual,
            variance,
            varianceType: variance > 5 ? 'over' : variance < -5 ? 'under' : 'on-track',
            impactLevel: Math.abs(variance) > 20 ? 'high' : Math.abs(variance) > 10 ? 'medium' : 'low',
          });
          
          totalPlanned += data.planned;
          totalActual += data.actual;
          iterationCount++;
        }
      });
      
      if (iterationCount > 0) {
        teamVariances[team.id] = {
          planned: totalPlanned / iterationCount,
          actual: totalActual / iterationCount,
          variance: (totalActual - totalPlanned) / iterationCount,
          iterations: iterationCount,
        };
      }
    });
    
    // Calculate epic variances
    epics.forEach(epic => {
      const epicPlanned = plannedAllocations.filter(a => a.epicId === epic.id);
      const epicActuals = actualAllocationsByIteration.filter(a => a.actualEpicId === epic.id);
      
      const totalPlanned = epicPlanned.reduce((sum, a) => sum + a.percentage, 0);
      const totalActual = epicActuals.reduce((sum, a) => sum + a.actualPercentage, 0);
      
      if (totalPlanned > 0 || totalActual > 0) {
        epicVariances[epic.id] = {
          planned: totalPlanned,
          actual: totalActual,
          variance: totalActual - totalPlanned,
        };
      }
    });
    
    return { analyses, teamVariances, epicVariances };
  }, [cycleId, teams, allocations, actualAllocations, epics]);

  const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  
  const getEpicName = (epicId: string) => {
    const epic = epics.find(e => e.id === epicId);
    if (!epic) return 'Unknown Epic';
    const project = projects.find(p => p.id === epic.projectId);
    return `${project?.name || 'Unknown'} - ${epic.name}`;
  };

  const getVarianceColor = (varianceType: string) => {
    switch (varianceType) {
      case 'over': return 'text-red-600 bg-red-50';
      case 'under': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 5) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (variance < -5) return <TrendingDown className="h-4 w-4 text-yellow-500" />;
    return <Minus className="h-4 w-4 text-green-500" />;
  };

  const getImpactBadge = (impact: string) => {
    const variants = {
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const,
    };
    return <Badge variant={variants[impact as keyof typeof variants]}>{impact}</Badge>;
  };

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalVariances = varianceData.analyses.length;
    const highImpact = varianceData.analyses.filter(a => a.impactLevel === 'high').length;
    const overAllocated = varianceData.analyses.filter(a => a.varianceType === 'over').length;
    const underAllocated = varianceData.analyses.filter(a => a.varianceType === 'under').length;
    const onTrack = varianceData.analyses.filter(a => a.varianceType === 'on-track').length;
    
    return { totalVariances, highImpact, overAllocated, underAllocated, onTrack };
  }, [varianceData.analyses]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Variances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalVariances}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryStats.highImpact}</div>
            <p className="text-xs text-gray-600">Require attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Over Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{summaryStats.overAllocated}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{summaryStats.onTrack}</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Variance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Team Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(varianceData.teamVariances).map(([teamId, data]) => (
              <div key={teamId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{getTeamName(teamId)}</h3>
                  <div className="flex items-center space-x-2">
                    {getVarianceIcon(data.variance)}
                    <span className={`text-sm px-2 py-1 rounded ${getVarianceColor(
                      data.variance > 5 ? 'over' : data.variance < -5 ? 'under' : 'on-track'
                    )}`}>
                      {data.variance > 0 ? '+' : ''}{data.variance.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Avg Planned:</span>
                    <div className="font-medium">{data.planned.toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg Actual:</span>
                    <div className="font-medium">{data.actual.toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Iterations:</span>
                    <div className="font-medium">{data.iterations}</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Utilization</span>
                    <span>{data.actual.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(data.actual, 100)} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Variance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Team</th>
                  <th className="text-left p-2">Iteration</th>
                  <th className="text-right p-2">Planned %</th>
                  <th className="text-right p-2">Actual %</th>
                  <th className="text-right p-2">Variance</th>
                  <th className="text-center p-2">Impact</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {varianceData.analyses
                  .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
                  .map(analysis => (
                    <tr key={analysis.allocationId} className="border-b">
                      <td className="p-2 font-medium">{getTeamName(analysis.teamId)}</td>
                      <td className="p-2">Iteration {analysis.iterationNumber}</td>
                      <td className="p-2 text-right">{analysis.plannedPercentage}%</td>
                      <td className="p-2 text-right">{analysis.actualPercentage}%</td>
                      <td className="p-2 text-right">
                        <span className={`flex items-center justify-end space-x-1 ${
                          analysis.variance > 0 ? 'text-red-600' : 
                          analysis.variance < 0 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {getVarianceIcon(analysis.variance)}
                          <span>{analysis.variance > 0 ? '+' : ''}{analysis.variance}%</span>
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        {getImpactBadge(analysis.impactLevel)}
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={
                          analysis.varianceType === 'on-track' ? 'default' :
                          analysis.varianceType === 'over' ? 'destructive' : 'secondary'
                        }>
                          {analysis.varianceType.replace('-', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Epic Variance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Epic Allocation Variance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(varianceData.epicVariances)
              .sort(([,a], [,b]) => Math.abs(b.variance) - Math.abs(a.variance))
              .map(([epicId, data]) => (
                <div key={epicId} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{getEpicName(epicId)}</div>
                    <div className="text-sm text-gray-600">
                      Planned: {data.planned}% → Actual: {data.actual}%
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getVarianceIcon(data.variance)}
                    <span className={`text-sm px-2 py-1 rounded ${getVarianceColor(
                      data.variance > 5 ? 'over' : data.variance < -5 ? 'under' : 'on-track'
                    )}`}>
                      {data.variance > 0 ? '+' : ''}{data.variance}%
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VarianceAnalysis;
