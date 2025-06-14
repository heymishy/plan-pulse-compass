
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Zap, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Allocation, Team, Cycle, Project, Epic, RunWorkCategory } from '@/types';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

interface AllocationStatsProps {
  allocations: Allocation[];
  teams: Team[];
  iterations: Cycle[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
}

const AllocationStats: React.FC<AllocationStatsProps> = ({
  allocations,
  teams,
  iterations,
  projects,
  epics,
  runWorkCategories,
}) => {
  const getStats = () => {
    const allocatedTeams = new Set(allocations.map(a => a.teamId)).size;
    const totalCapacity = teams.reduce((sum, team) => sum + team.capacity, 0);
    
    // Calculate allocation health
    let overAllocatedTeams = 0;
    let underAllocatedTeams = 0;
    let fullyAllocatedTeams = 0;
    
    teams.forEach(team => {
      iterations.forEach((_, index) => {
        const capacity = calculateTeamCapacity(team, index + 1, allocations, iterations);
        if (capacity.allocatedPercentage > 100) overAllocatedTeams++;
        else if (capacity.allocatedPercentage === 100) fullyAllocatedTeams++;
        else if (capacity.allocatedPercentage > 0) underAllocatedTeams++;
      });
    });

    // Epic vs Run Work breakdown
    const epicAllocations = allocations.filter(a => a.epicId).length;
    const runWorkAllocations = allocations.filter(a => a.runWorkCategoryId).length;

    return {
      totalTeams: teams.length,
      allocatedTeams,
      totalIterations: iterations.length,
      totalCapacity,
      overAllocatedTeams,
      underAllocatedTeams,
      fullyAllocatedTeams,
      epicAllocations,
      runWorkAllocations,
      totalAllocations: allocations.length,
    };
  };

  const stats = getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Team Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.allocatedTeams}/{stats.totalTeams}
          </div>
          <p className="text-sm text-gray-600">Teams with allocations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Iterations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalIterations}</div>
          <p className="text-sm text-gray-600">Planning periods</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Work Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Epics:</span>
              <Badge variant="secondary">{stats.epicAllocations}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Run Work:</span>
              <Badge variant="outline">{stats.runWorkAllocations}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Allocation Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                Optimal:
              </span>
              <Badge className="bg-green-500">{stats.fullyAllocatedTeams}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                Issues:
              </span>
              <Badge variant="destructive">{stats.overAllocatedTeams}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllocationStats;
