
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Team, Cycle, Allocation, Project, Epic, RunWorkCategory } from '@/types';
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react';

interface PlanningMatrixProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  onEditAllocation: (allocation: Allocation) => void;
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
}

const PlanningMatrix: React.FC<PlanningMatrixProps> = ({
  teams,
  iterations,
  allocations,
  onEditAllocation,
  projects,
  epics,
  runWorkCategories,
}) => {
  const getTeamIterationAllocations = (teamId: string, iterationNumber: number) => {
    return allocations.filter(a => a.teamId === teamId && a.iterationNumber === iterationNumber);
  };

  const getTotalAllocation = (teamId: string, iterationNumber: number) => {
    const teamAllocations = getTeamIterationAllocations(teamId, iterationNumber);
    return teamAllocations.reduce((sum, a) => sum + a.percentage, 0);
  };

  const getAllocationBadge = (percentage: number) => {
    if (percentage === 0) return null;
    if (percentage < 100) return <Badge variant="secondary">{percentage}%</Badge>;
    if (percentage === 100) return <Badge className="bg-green-500">{percentage}%</Badge>;
    return <Badge variant="destructive">{percentage}%</Badge>;
  };

  const getAllocationStatus = (percentage: number) => {
    if (percentage === 0) return null;
    if (percentage < 100) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (percentage === 100) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getEpicName = (epicId: string) => {
    const epic = epics.find(e => e.id === epicId);
    if (!epic) return 'Unknown Epic';
    const project = projects.find(p => p.id === epic.projectId);
    return `${project?.name || 'Unknown'} - ${epic.name}`;
  };

  const getRunWorkCategoryName = (categoryId: string) => {
    const category = runWorkCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Allocation Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b font-semibold">Team</th>
                {iterations.map((iteration, index) => (
                  <th key={iteration.id} className="text-center p-3 border-b font-semibold min-w-32">
                    Iteration {index + 1}
                    <div className="text-xs text-gray-500 font-normal">
                      {new Date(iteration.startDate).toLocaleDateString()} - 
                      {new Date(iteration.endDate).toLocaleDateString()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id} className="border-b">
                  <td className="p-3 font-medium">
                    <div>
                      {team.name}
                      <div className="text-xs text-gray-500">
                        {team.capacity}h/week capacity
                      </div>
                    </div>
                  </td>
                  {iterations.map((iteration, index) => {
                    const iterationAllocations = getTeamIterationAllocations(team.id, index + 1);
                    const totalPercentage = getTotalAllocation(team.id, index + 1);
                    
                    return (
                      <td key={iteration.id} className="p-3 text-center">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center space-x-2">
                            {getAllocationBadge(totalPercentage)}
                            {getAllocationStatus(totalPercentage)}
                          </div>
                          
                          {iterationAllocations.length > 0 && (
                            <div className="space-y-1">
                              {iterationAllocations.map(allocation => (
                                <div
                                  key={allocation.id}
                                  className="text-xs p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                                  onClick={() => onEditAllocation(allocation)}
                                >
                                  <div className="font-medium">
                                    {allocation.percentage}%
                                  </div>
                                  <div className="text-gray-600">
                                    {allocation.epicId 
                                      ? getEpicName(allocation.epicId)
                                      : getRunWorkCategoryName(allocation.runWorkCategoryId!)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>100% allocated</span>
          </div>
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span>Under allocated</span>
          </div>
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>Over allocated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanningMatrix;
