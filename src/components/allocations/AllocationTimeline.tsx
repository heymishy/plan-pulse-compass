import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Team, Cycle, Allocation, Project, Epic, RunWorkCategory } from '@/types';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

interface AllocationTimelineProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
}

const AllocationTimeline: React.FC<AllocationTimelineProps> = ({
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

  const getWorkItemName = (allocation: Allocation) => {
    if (allocation.epicId) {
      const epic = epics.find(e => e.id === allocation.epicId);
      if (epic) {
        const project = projects.find(p => p.id === epic.projectId);
        return `${project?.name || 'Unknown'} - ${epic.name}`;
      }
    } else if (allocation.runWorkCategoryId) {
      const category = runWorkCategories.find(c => c.id === allocation.runWorkCategoryId);
      return category?.name || 'Unknown Category';
    }
    return 'Unknown Work';
  };

  const getWorkItemColor = (allocation: Allocation) => {
    if (allocation.epicId) {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    } else {
      const category = runWorkCategories.find(c => c.id === allocation.runWorkCategoryId);
      return category?.color ? `bg-gray-100 border-gray-300 text-gray-800` : 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="space-y-6 min-w-[1024px]">
            {/* Timeline Header */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium">
              <div className="col-span-2">Team</div>
              {iterations.map((iteration) => (
                <div key={iteration.id} className="col-span-2 text-center">
                  <div>{iteration.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(iteration.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                    {new Date(iteration.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Content */}
            {teams.map(team => (
              <div key={team.id} className="grid grid-cols-12 gap-2 py-4 border-b">
                <div className="col-span-2">
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-gray-500">{team.capacity}h/week</div>
                </div>
                
                {iterations.map((iteration) => {
                  const iterationNumber = getIterationNumber(iteration);
                  if (iterationNumber === 0) return <div key={iteration.id} className="col-span-2"></div>;

                  const teamAllocations = getTeamIterationAllocations(team.id, iterationNumber);
                  const capacity = calculateTeamCapacity(team, iterationNumber, allocations, iterations);
                  
                  return (
                    <div key={iteration.id} className="col-span-2">
                      <div className="space-y-1">
                        {/* Capacity indicator */}
                        <div className="flex items-center space-x-1 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            capacity.allocatedPercentage === 100 ? 'bg-green-500' :
                            capacity.allocatedPercentage > 100 ? 'bg-red-500' :
                            capacity.allocatedPercentage > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-xs">{capacity.allocatedPercentage}%</span>
                        </div>
                        
                        {/* Allocation blocks */}
                        {teamAllocations.map(allocation => (
                          <div
                            key={allocation.id}
                            className={`p-2 rounded text-xs border ${getWorkItemColor(allocation)}`}
                          >
                            <div className="font-medium">{allocation.percentage}%</div>
                            <div className="truncate" title={getWorkItemName(allocation)}>
                              {getWorkItemName(allocation)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>100% allocated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Under allocated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Over allocated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>No allocation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllocationTimeline;
