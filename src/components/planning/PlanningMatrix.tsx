
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Team, Cycle, Allocation, Project, Epic, RunWorkCategory } from '@/types';
import { Plus, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

interface PlanningMatrixProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  onEditAllocation: (allocation: Allocation) => void;
  onCreateAllocation: (teamId: string, iterationNumber: number) => void;
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
}

const PlanningMatrix: React.FC<PlanningMatrixProps> = ({
  teams,
  iterations,
  allocations,
  onEditAllocation,
  onCreateAllocation,
  projects,
  epics,
  runWorkCategories,
}) => {
  const getTeamIterationAllocations = (teamId: string, iterationNumber: number) => {
    return allocations.filter(a => a.teamId === teamId && a.iterationNumber === iterationNumber);
  };

  const getAllocationBadge = (percentage: number, capacityHours: number) => {
    if (percentage === 0) return null;
    if (percentage < 100) return <Badge variant="secondary">{percentage}% ({Math.round(capacityHours * (percentage / 100))}h)</Badge>;
    if (percentage === 100) return <Badge className="bg-green-500">{percentage}% ({Math.round(capacityHours)}h)</Badge>;
    return <Badge variant="destructive">{percentage}% ({Math.round(capacityHours * (percentage / 100))}h)</Badge>;
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

  const getTeamEpics = (teamId: string) => {
    return epics.filter(epic => epic.assignedTeamId === teamId);
  };

  const handleEmptyCellClick = (teamId: string, iterationNumber: number) => {
    onCreateAllocation(teamId, iterationNumber);
  };

  return (
    <div className="space-y-4">
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
                {teams.map(team => {
                  const teamEpics = getTeamEpics(team.id);
                  return (
                    <tr key={team.id} className="border-b">
                      <td className="p-3 font-medium">
                        <div>
                          {team.name}
                          <div className="text-xs text-gray-500">
                            {team.capacity}h/week capacity
                          </div>
                          {teamEpics.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              <Users className="h-3 w-3 inline mr-1" />
                              {teamEpics.length} epic{teamEpics.length !== 1 ? 's' : ''} assigned
                            </div>
                          )}
                        </div>
                      </td>
                      {iterations.map((iteration, index) => {
                        const iterationAllocations = getTeamIterationAllocations(team.id, index + 1);
                        const capacityCheck = calculateTeamCapacity(team, index + 1, allocations, iterations);
                        
                        return (
                          <td key={iteration.id} className="p-3 text-center">
                            <div className="space-y-2">
                              <div className="flex items-center justify-center space-x-2">
                                {getAllocationBadge(capacityCheck.allocatedPercentage, capacityCheck.capacityHours)}
                                {getAllocationStatus(capacityCheck.allocatedPercentage)}
                              </div>
                              
                              {iterationAllocations.length > 0 ? (
                                <div className="space-y-1">
                                  {iterationAllocations.map(allocation => {
                                    const epic = allocation.epicId ? epics.find(e => e.id === allocation.epicId) : null;
                                    const isAssignedToTeam = epic?.assignedTeamId === team.id;
                                    
                                    return (
                                      <div
                                        key={allocation.id}
                                        className={`text-xs p-1 rounded cursor-pointer hover:bg-gray-100 ${
                                          epic && !isAssignedToTeam ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                                        }`}
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
                                        {epic && !isAssignedToTeam && (
                                          <div className="text-red-600 text-xs">
                                            ⚠️ Epic not assigned to this team
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div 
                                  className="min-h-12 border-2 border-dashed border-gray-200 rounded cursor-pointer hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center transition-colors"
                                  onClick={() => handleEmptyCellClick(team.id, index + 1)}
                                >
                                  <Plus className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
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
            <div className="flex items-center space-x-1">
              <Plus className="h-4 w-4 text-gray-400" />
              <span>Click empty cells to add allocation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Epic Assignments Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Team Epic Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => {
              const teamEpics = getTeamEpics(team.id);
              return (
                <div key={team.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {team.capacity}h/week capacity
                  </div>
                  {teamEpics.length === 0 ? (
                    <div className="text-sm text-gray-500">No epics assigned</div>
                  ) : (
                    <div className="space-y-1">
                      {teamEpics.map(epic => {
                        const project = projects.find(p => p.id === epic.projectId);
                        return (
                          <div key={epic.id} className="text-xs p-2 bg-blue-50 rounded">
                            <div className="font-medium">{epic.name}</div>
                            <div className="text-gray-600">{project?.name}</div>
                            <div className="text-blue-600">{epic.estimatedEffort} points</div>
                            {epic.targetEndDate && (
                              <div className="text-gray-500">
                                Target: {new Date(epic.targetEndDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanningMatrix;
