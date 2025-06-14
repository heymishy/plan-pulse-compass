
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Team, Cycle, Allocation, Project, Epic, RunWorkCategory } from '@/types';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

interface AllocationMatrixProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
}

const AllocationMatrix: React.FC<AllocationMatrixProps> = ({
  teams,
  iterations,
  allocations,
  projects,
  epics,
  runWorkCategories,
}) => {
  const getTeamIterationAllocations = (teamId: string, iterationNumber: number) => {
    return allocations.filter(a => a.teamId === teamId && a.iterationNumber === iterationNumber);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-100';
    if (percentage < 100) return 'bg-yellow-100';
    if (percentage === 100) return 'bg-green-100';
    return 'bg-red-100';
  };

  const getCapacityTextColor = (percentage: number) => {
    if (percentage === 0) return 'text-gray-500';
    if (percentage < 100) return 'text-yellow-700';
    if (percentage === 100) return 'text-green-700';
    return 'text-red-700';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border font-semibold bg-gray-50">Team</th>
                {iterations.map((iteration, index) => (
                  <th key={iteration.id} className="text-center p-3 border font-semibold bg-gray-50 min-w-32">
                    <div>Iteration {index + 1}</div>
                    <div className="text-xs text-gray-500 font-normal">
                      {new Date(iteration.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                      {new Date(iteration.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </th>
                ))}
                <th className="text-center p-3 border font-semibold bg-gray-50">Total</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => {
                let totalAllocatedHours = 0;
                let totalCapacityHours = 0;

                return (
                  <tr key={team.id} className="border">
                    <td className="p-3 border font-medium bg-gray-50">
                      <div>
                        {team.name}
                        <div className="text-xs text-gray-500">
                          {team.capacity}h/week
                        </div>
                      </div>
                    </td>
                    {iterations.map((iteration, index) => {
                      const teamAllocations = getTeamIterationAllocations(team.id, index + 1);
                      const capacity = calculateTeamCapacity(team, index + 1, allocations, iterations);
                      
                      totalAllocatedHours += capacity.capacityHours * (capacity.allocatedPercentage / 100);
                      totalCapacityHours += capacity.capacityHours;

                      return (
                        <td key={iteration.id} className={`p-3 border text-center ${getCapacityColor(capacity.allocatedPercentage)}`}>
                          <div className={`font-semibold ${getCapacityTextColor(capacity.allocatedPercentage)}`}>
                            {capacity.allocatedPercentage}%
                          </div>
                          <div className="text-xs text-gray-600">
                            {Math.round(capacity.capacityHours * (capacity.allocatedPercentage / 100))}h / {Math.round(capacity.capacityHours)}h
                          </div>
                          {teamAllocations.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {teamAllocations.map(allocation => (
                                <div key={allocation.id} className="text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    {allocation.percentage}%
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 border text-center bg-gray-50">
                      <div className="font-semibold">
                        {totalCapacityHours > 0 ? Math.round((totalAllocatedHours / totalCapacityHours) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-600">
                        {Math.round(totalAllocatedHours)}h / {Math.round(totalCapacityHours)}h
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Matrix Legend */}
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border"></div>
            <span>100% allocated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border"></div>
            <span>Under allocated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border"></div>
            <span>Over allocated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border"></div>
            <span>No allocation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllocationMatrix;
