import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  CheckCircle,
  Users,
  Search,
  Target,
  Zap,
  Brain,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { Project, Team, Skill, Solution } from '@/types';
import {
  calculateTeamProjectCompatibility,
  getProjectRequiredSkills,
  TeamProjectCompatibility,
} from '@/utils/skillBasedPlanning';

interface ProjectTeamMatchingViewProps {
  projects: Project[];
  teams: Team[];
  skills: Skill[];
  solutions: Solution[];
  projectSolutions: any[];
  projectSkills: any[];
  people: any[];
  personSkills: any[];
  allocations: any[];
  cycles: any[];
}

interface MatchingMatrix {
  projectId: string;
  projectName: string;
  priority: string;
  requiredSkills: number;
  teamMatches: Array<{
    teamId: string;
    teamName: string;
    compatibility: TeamProjectCompatibility;
    capacityStatus: 'available' | 'partial' | 'overloaded';
    capacityPercentage: number;
  }>;
}

const ProjectTeamMatchingView: React.FC<ProjectTeamMatchingViewProps> = ({
  projects,
  teams,
  skills,
  solutions,
  projectSolutions,
  projectSkills,
  people,
  personSkills,
  allocations,
  cycles,
}) => {
  // Filter states
  const [projectFilter, setProjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [matchFilter, setMatchFilter] = useState('all');
  const [sortBy, setSortBy] = useState('compatibility');

  // Calculate team capacity utilization
  const teamCapacityMap = useMemo(() => {
    const capacityMap = new Map<string, number>();

    // Get current quarter cycles
    const now = new Date();
    const currentQuarterCycles = cycles.filter((cycle: any) => {
      const cycleStart = new Date(cycle.startDate);
      const cycleEnd = new Date(cycle.endDate);
      return (
        (now >= cycleStart && now <= cycleEnd) ||
        (cycleStart.getFullYear() === now.getFullYear() &&
          Math.floor(cycleStart.getMonth() / 3) ===
            Math.floor(now.getMonth() / 3))
      );
    });

    const currentQuarterCycleIds = currentQuarterCycles.map((c: any) => c.id);

    teams.forEach(team => {
      const teamAllocations = allocations.filter(
        (alloc: any) =>
          alloc.teamId === team.id &&
          currentQuarterCycleIds.includes(alloc.cycleId)
      );

      // Calculate maximum allocation percentage for this team
      const totalPercentage = teamAllocations.reduce(
        (sum: number, alloc: any) => sum + alloc.percentage,
        0
      );

      capacityMap.set(team.id, Math.min(totalPercentage, 100));
    });

    return capacityMap;
  }, [teams, allocations, cycles]);

  // Create matching matrix
  const matchingMatrix = useMemo((): MatchingMatrix[] => {
    return projects.map(project => {
      const requiredSkillsInfo = getProjectRequiredSkills(
        project,
        projectSkills,
        solutions,
        skills,
        projectSolutions
      );

      const teamMatches = teams.map(team => {
        const compatibility = calculateTeamProjectCompatibility(
          team,
          project,
          skills,
          people,
          personSkills,
          projectSkills,
          solutions,
          projectSolutions
        );

        const capacityPercentage = teamCapacityMap.get(team.id) || 0;
        let capacityStatus: 'available' | 'partial' | 'overloaded';

        if (capacityPercentage <= 60) {
          capacityStatus = 'available';
        } else if (capacityPercentage <= 85) {
          capacityStatus = 'partial';
        } else {
          capacityStatus = 'overloaded';
        }

        return {
          teamId: team.id,
          teamName: team.name,
          compatibility,
          capacityStatus,
          capacityPercentage,
        };
      });

      return {
        projectId: project.id,
        projectName: project.name,
        priority: project.priority || 'medium',
        requiredSkills: requiredSkillsInfo.length,
        teamMatches: teamMatches.sort(
          (a, b) =>
            b.compatibility.compatibilityScore -
            a.compatibility.compatibilityScore
        ),
      };
    });
  }, [
    projects,
    teams,
    skills,
    solutions,
    projectSolutions,
    projectSkills,
    people,
    personSkills,
    teamCapacityMap,
  ]);

  // Apply filters and sorting
  const filteredMatrix = useMemo(() => {
    const filtered = matchingMatrix.filter(item => {
      // Project name filter
      if (
        projectFilter &&
        !item.projectName.toLowerCase().includes(projectFilter.toLowerCase())
      ) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }

      // Match quality filter
      if (matchFilter !== 'all') {
        const bestMatch = item.teamMatches[0]?.compatibility.recommendation;
        if (matchFilter === 'excellent' && bestMatch !== 'excellent')
          return false;
        if (
          matchFilter === 'good' &&
          !['excellent', 'good'].includes(bestMatch)
        )
          return false;
        if (matchFilter === 'poor' && bestMatch !== 'poor') return false;
      }

      return true;
    });

    // Apply sorting
    if (sortBy === 'compatibility') {
      filtered.sort((a, b) => {
        const aScore = a.teamMatches[0]?.compatibility.compatibilityScore || 0;
        const bScore = b.teamMatches[0]?.compatibility.compatibilityScore || 0;
        return bScore - aScore;
      });
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filtered.sort(
        (a, b) =>
          (priorityOrder as any)[b.priority] -
          (priorityOrder as any)[a.priority]
      );
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.projectName.localeCompare(b.projectName));
    }

    return filtered;
  }, [matchingMatrix, projectFilter, priorityFilter, matchFilter, sortBy]);

  const getCompatibilityIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'fair':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCapacityIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'overloaded':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Project-Team Skills Matching
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter projects..."
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Select value={matchFilter} onValueChange={setMatchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Match Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="excellent">Excellent Matches</SelectItem>
                <SelectItem value="good">Good Matches</SelectItem>
                <SelectItem value="poor">Poor Matches</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compatibility">Best Match</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="name">Project Name</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Info className="h-4 w-4" />
              {filteredMatrix.length} projects
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg mb-6">
            <div className="text-sm font-medium">Skill Match:</div>
            <div className="flex items-center gap-1 text-xs">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Excellent (90%+)
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              Good (70-89%)
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Minus className="h-3 w-3 text-yellow-600" />
              Fair (50-69%)
            </div>
            <div className="flex items-center gap-1 text-xs">
              <XCircle className="h-3 w-3 text-red-600" />
              Poor (&lt;50%)
            </div>

            <div className="border-l pl-4 ml-4 text-sm font-medium">
              Capacity:
            </div>
            <div className="flex items-center gap-1 text-xs">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Available (&lt;60%)
            </div>
            <div className="flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              Partial (60-85%)
            </div>
            <div className="flex items-center gap-1 text-xs">
              <XCircle className="h-3 w-3 text-red-600" />
              Overloaded (&gt;85%)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredMatrix.map(project => (
          <Card key={project.projectId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">
                    {project.projectName}
                  </CardTitle>
                  <Badge variant={getPriorityBadgeVariant(project.priority)}>
                    {project.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    {project.requiredSkills} skills
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Team matches */}
              <div className="space-y-3">
                {project.teamMatches.slice(0, 5).map(teamMatch => (
                  <TooltipProvider key={teamMatch.teamId}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getCompatibilityIcon(
                                teamMatch.compatibility.recommendation
                              )}
                              <span className="font-medium">
                                {teamMatch.teamName}
                              </span>
                            </div>
                            <Progress
                              value={
                                teamMatch.compatibility.compatibilityScore * 100
                              }
                              className="w-24"
                            />
                            <span className="text-sm text-gray-600">
                              {Math.round(
                                teamMatch.compatibility.compatibilityScore * 100
                              )}
                              %
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {getCapacityIcon(teamMatch.capacityStatus)}
                              <span className="text-sm text-gray-600">
                                {teamMatch.capacityPercentage}% capacity
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {teamMatch.compatibility.skillsMatched}/
                              {teamMatch.compatibility.skillsRequired} skills
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <div className="space-y-2">
                          <div className="font-medium">
                            {teamMatch.teamName} - {project.projectName}
                          </div>
                          <div className="text-sm">
                            <div>
                              Skills Match:{' '}
                              {teamMatch.compatibility.skillsMatched} of{' '}
                              {teamMatch.compatibility.skillsRequired}
                            </div>
                            <div>
                              Compatibility:{' '}
                              {Math.round(
                                teamMatch.compatibility.compatibilityScore * 100
                              )}
                              %
                            </div>
                            <div>
                              Current Capacity: {teamMatch.capacityPercentage}%
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                              {teamMatch.compatibility.reasoning.join('. ')}
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}

                {project.teamMatches.length > 5 && (
                  <div className="text-center py-2">
                    <Button variant="ghost" size="sm">
                      View {project.teamMatches.length - 5} more teams
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMatrix.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2" />
              No projects match your current filters.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default React.memo(ProjectTeamMatchingView);
