
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Team, Cycle, Allocation, Project, Epic, RunWorkCategory } from '@/types';

interface TeamQuarterPlansProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
}

const TeamQuarterPlans: React.FC<TeamQuarterPlansProps> = ({
  teams,
  iterations,
  allocations,
  projects,
  epics,
  runWorkCategories,
}) => {
  const getIterationNumber = (iteration: Cycle) => {
    const match = iteration.name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getTeamIterationAllocations = (teamId: string, iterationNumber: number) => {
    return allocations.filter(a => a.teamId === teamId && a.iterationNumber === iterationNumber);
  };

  const getWorkItemDetails = (allocation: Allocation) => {
    if (allocation.epicId) {
      const epic = epics.find(e => e.id === allocation.epicId);
      if (epic) {
        const project = projects.find(p => p.id === epic.projectId);
        return {
          name: epic.name,
          type: 'epic',
          projectName: project?.name || 'Unknown Project',
          color: 'bg-blue-50 border-blue-200 text-blue-800',
        };
      }
    } else if (allocation.runWorkCategoryId) {
      const category = runWorkCategories.find(c => c.id === allocation.runWorkCategoryId);
      return {
        name: category?.name || 'Unknown Category',
        type: 'run',
        projectName: 'Run Work',
        color: 'bg-gray-50 border-gray-200 text-gray-800',
      };
    }
    return {
      name: 'Unknown Work',
      type: 'unknown',
      projectName: 'Unknown',
      color: 'bg-red-50 border-red-200 text-red-800',
    };
  };

  const getTeamTotalAllocation = (teamId: string, iterationNumber: number) => {
    const teamAllocations = getTeamIterationAllocations(teamId, iterationNumber);
    return teamAllocations.reduce((sum, a) => sum + a.percentage, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Quarter Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[1600px]">
            <div className="space-y-6">
              {/* Header */}
              <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-2 text-sm font-medium border-b pb-2">
                <div className="col-span-3">Team</div>
                {iterations.map((iteration) => (
                  <div key={iteration.id} className="col-span-2 text-center">
                    <div>{iteration.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(iteration.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                      {new Date(iteration.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
                <div className="col-span-1 text-center">Avg Load</div>
              </div>

              {/* Team Rows */}
              {teams.map(team => {
                const avgLoad = iterations.reduce((sum, iteration) => {
                  const iterationNumber = getIterationNumber(iteration);
                  return sum + getTeamTotalAllocation(team.id, iterationNumber)
                }, 0) / (iterations.length || 1);

                return (
                  <div key={team.id} className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-2 py-4 border-b border-gray-100">
                    <div className="col-span-3">
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-gray-500">{team.capacity}h/week</div>
                    </div>
                    
                    {iterations.map((iteration) => {
                      const iterationNumber = getIterationNumber(iteration);
                      if (iterationNumber === 0) return <div key={iteration.id} className="col-span-2" />;
                      
                      const teamAllocations = getTeamIterationAllocations(team.id, iterationNumber);
                      const totalAllocation = getTeamTotalAllocation(team.id, iterationNumber);
                      
                      return (
                        <div key={iteration.id} className="col-span-2">
                          <div className="space-y-1">
                            {/* Total allocation indicator */}
                            <div className="flex items-center justify-between mb-2">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                totalAllocation === 100 ? 'bg-green-100 text-green-800' :
                                totalAllocation > 100 ? 'bg-red-100 text-red-800' :
                                totalAllocation > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {totalAllocation}%
                              </div>
                            </div>
                            
                            {/* Work items */}
                            {teamAllocations.map(allocation => {
                              const workItem = getWorkItemDetails(allocation);
                              return (
                                <div
                                  key={allocation.id}
                                  className={`p-2 rounded border text-xs ${workItem.color}`}
                                >
                                  <div className="font-medium truncate" title={workItem.name}>{workItem.name}</div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs opacity-75 truncate" title={workItem.projectName}>
                                      {workItem.projectName}
                                    </span>
                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                      {allocation.percentage}%
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {teamAllocations.length === 0 && (
                              <div className="p-2 rounded border border-dashed border-gray-200 text-xs text-gray-400 text-center">
                                No allocation
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Average Load */}
                    <div className="col-span-1 text-center">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        Math.round(avgLoad) === 100 ? 'bg-green-100 text-green-800' :
                        Math.round(avgLoad) > 100 ? 'bg-red-100 text-red-800' :
                        Math.round(avgLoad) > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {Math.round(avgLoad)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Project Epics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Run Work</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>100% Allocated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span>Over Allocated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            <span>Under Allocated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamQuarterPlans;
