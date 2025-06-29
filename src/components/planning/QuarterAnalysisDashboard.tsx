import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Flag,
  Star,
} from 'lucide-react';
import {
  Team,
  Cycle,
  Allocation,
  Project,
  Epic,
  Milestone,
  RunWorkCategory,
  Division,
  Person,
} from '@/types';

interface QuarterAnalysisDashboardProps {
  cycleId: string;
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  projects: Project[];
  epics: Epic[];
  milestones: Milestone[];
  runWorkCategories: RunWorkCategory[];
  divisions: Division[];
  people: Person[];
}

const QuarterAnalysisDashboard: React.FC<QuarterAnalysisDashboardProps> = ({
  cycleId,
  teams,
  iterations,
  allocations,
  projects,
  epics,
  milestones,
  runWorkCategories,
  divisions,
  people,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'quarter' | 'iteration'>('quarter');

  const analysisData = useMemo(() => {
    const quarterAllocations = allocations.filter(a => a.cycleId === cycleId);
    const quarterEpics = epics.filter(e =>
      quarterAllocations.some(a => a.epicId === e.id)
    );
    const quarterMilestones = milestones.filter(m => {
      const milestoneDate = new Date(m.dueDate);
      const quarterStart = new Date(iterations[0]?.startDate || '');
      const quarterEnd = new Date(
        iterations[iterations.length - 1]?.endDate || ''
      );
      return milestoneDate >= quarterStart && milestoneDate <= quarterEnd;
    });

    // Filter by division and team
    let filteredTeams = teams;
    if (selectedDivision !== 'all') {
      filteredTeams = teams.filter(t => t.divisionId === selectedDivision);
    }
    if (selectedTeam !== 'all') {
      filteredTeams = teams.filter(t => t.id === selectedTeam);
    }

    const filteredTeamIds = new Set(filteredTeams.map(t => t.id));
    const filteredAllocations = quarterAllocations.filter(a =>
      filteredTeamIds.has(a.teamId)
    );

    // Key items analysis
    const keyEpics = quarterEpics.filter(e => e.isKey);
    const keyMilestones = quarterMilestones.filter(m => m.isKey);

    // Risk analysis
    const atRiskMilestones = quarterMilestones.filter(
      m => m.status === 'at-risk'
    );
    const overdueMilestones = quarterMilestones.filter(m => {
      const dueDate = new Date(m.dueDate);
      const now = new Date();
      return dueDate < now && m.status !== 'completed';
    });

    // Resource constraint analysis
    const resourceConstraints = teams.map(team => {
      const teamMembers = people.filter(
        p => p.teamId === team.id && p.isActive
      );
      const teamAllocations = filteredAllocations.filter(
        a => a.teamId === team.id
      );

      // Check for team member availability issues
      const unavailableMembers = teamMembers.filter(member => {
        const memberAllocations = teamAllocations.filter(
          a =>
            a.epicId &&
            quarterEpics.find(e => e.id === a.epicId)?.assignedTeamId ===
              team.id
        );
        return memberAllocations.length === 0;
      });

      const totalAllocation = teamAllocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );
      const isOverAllocated = totalAllocation > 100;
      const isUnderAllocated = totalAllocation < 60;

      return {
        teamId: team.id,
        teamName: team.name,
        memberCount: teamMembers.length,
        unavailableMembers: unavailableMembers.length,
        totalAllocation,
        isOverAllocated,
        isUnderAllocated,
        riskLevel:
          unavailableMembers.length > 1 || isOverAllocated
            ? 'high'
            : unavailableMembers.length > 0 || isUnderAllocated
              ? 'medium'
              : 'low',
      };
    });

    // Iteration progress data
    const iterationProgress = iterations.map(iteration => {
      const iterationNumber = parseInt(iteration.name.match(/\d+/)?.[0] || '0');
      const iterationAllocations = filteredAllocations.filter(
        a => a.iterationNumber === iterationNumber
      );

      const plannedEpics = new Set(
        iterationAllocations.filter(a => a.epicId).map(a => a.epicId!)
      );

      const plannedMilestones = quarterMilestones.filter(m => {
        const milestoneDate = new Date(m.dueDate);
        const iterationStart = new Date(iteration.startDate);
        const iterationEnd = new Date(iteration.endDate);
        return milestoneDate >= iterationStart && milestoneDate <= iterationEnd;
      });

      return {
        iteration: iteration.name,
        iterationNumber,
        plannedEpics: plannedEpics.size,
        plannedMilestones: plannedMilestones.length,
        keyMilestones: plannedMilestones.filter(m => m.isKey).length,
        keyEpics: Array.from(plannedEpics).filter(
          epicId => quarterEpics.find(e => e.id === epicId)?.isKey
        ).length,
        totalAllocation: iterationAllocations.reduce(
          (sum, a) => sum + a.percentage,
          0
        ),
      };
    });

    // Division summary
    const divisionSummary = divisions.map(division => {
      const divisionTeams = teams.filter(t => t.divisionId === division.id);
      const divisionTeamIds = new Set(divisionTeams.map(t => t.id));
      const divisionAllocations = filteredAllocations.filter(a =>
        divisionTeamIds.has(a.teamId)
      );

      const divisionEpics = quarterEpics.filter(e =>
        divisionAllocations.some(a => a.epicId === e.id)
      );
      const divisionMilestones = quarterMilestones.filter(m => {
        const project = projects.find(p => p.id === m.projectId);
        return (
          project &&
          divisionAllocations.some(a => {
            const epic = quarterEpics.find(e => e.id === a.epicId);
            return epic && epic.projectId === project.id;
          })
        );
      });

      return {
        divisionId: division.id,
        divisionName: division.name,
        teamCount: divisionTeams.length,
        epicCount: divisionEpics.length,
        keyEpicCount: divisionEpics.filter(e => e.isKey).length,
        milestoneCount: divisionMilestones.length,
        keyMilestoneCount: divisionMilestones.filter(m => m.isKey).length,
        completedMilestones: divisionMilestones.filter(
          m => m.status === 'completed'
        ).length,
        atRiskMilestones: divisionMilestones.filter(m => m.status === 'at-risk')
          .length,
      };
    });

    return {
      keyEpics,
      keyMilestones,
      atRiskMilestones,
      overdueMilestones,
      resourceConstraints,
      iterationProgress,
      divisionSummary,
      summary: {
        totalEpics: quarterEpics.length,
        keyEpics: keyEpics.length,
        totalMilestones: quarterMilestones.length,
        keyMilestones: keyMilestones.length,
        atRiskCount: atRiskMilestones.length,
        overdueCount: overdueMilestones.length,
        teamsWithConstraints: resourceConstraints.filter(
          r => r.riskLevel !== 'low'
        ).length,
      },
    };
  }, [
    cycleId,
    teams,
    iterations,
    allocations,
    projects,
    epics,
    milestones,
    selectedDivision,
    selectedTeam,
    people,
  ]);

  const {
    keyEpics,
    keyMilestones,
    atRiskMilestones,
    resourceConstraints,
    iterationProgress,
    divisionSummary,
    summary,
  } = analysisData;

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  const getRiskLevelBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Risk</Badge>;
      default:
        return <Badge variant="outline">Low Risk</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Division:</label>
            <Select
              value={selectedDivision}
              onValueChange={setSelectedDivision}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {divisions.map(division => (
                  <SelectItem key={division.id} value={division.id}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Team:</label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams
                  .filter(
                    t =>
                      selectedDivision === 'all' ||
                      t.divisionId === selectedDivision
                  )
                  .map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">View:</label>
          <Select
            value={viewMode}
            onValueChange={(value: 'quarter' | 'iteration') =>
              setViewMode(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="iteration">Iteration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Key Epics</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary.keyEpics}
            </div>
            <p className="text-xs text-gray-500">
              of {summary.totalEpics} total epics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Key Milestones
            </CardTitle>
            <Flag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.keyMilestones}
            </div>
            <p className="text-xs text-gray-500">
              of {summary.totalMilestones} total milestones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.atRiskCount}
            </div>
            <p className="text-xs text-gray-500">
              {summary.overdueCount} overdue items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resource Constraints
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.teamsWithConstraints}
            </div>
            <p className="text-xs text-gray-500">teams with issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="key-items">Key Items</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="resources">Resource Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Iteration Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Iteration Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={iterationProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="iteration" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="keyEpics" fill="#fbbf24" name="Key Epics" />
                  <Bar
                    dataKey="keyMilestones"
                    fill="#3b82f6"
                    name="Key Milestones"
                  />
                  <Bar
                    dataKey="plannedEpics"
                    fill="#10b981"
                    name="Total Epics"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Division Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Division Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {divisionSummary.map(division => (
                  <div
                    key={division.divisionId}
                    className="p-4 border rounded-lg"
                  >
                    <div className="font-medium mb-2">
                      {division.divisionName}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Teams:</span>
                        <span>{division.teamCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Key Epics:</span>
                        <span className="text-yellow-600 font-medium">
                          {division.keyEpicCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Key Milestones:</span>
                        <span className="text-blue-600 font-medium">
                          {division.keyMilestoneCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>At Risk:</span>
                        <span className="text-red-600 font-medium">
                          {division.atRiskMilestones}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="key-items" className="space-y-6">
          {/* Key Epics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-600" />
                Key Epics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {keyEpics.map(epic => {
                  const project = projects.find(p => p.id === epic.projectId);
                  const team = teams.find(t => t.id === epic.assignedTeamId);
                  return (
                    <div key={epic.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{epic.name}</div>
                          <div className="text-sm text-gray-600">
                            {project?.name} • {team?.name || 'Unassigned'}
                          </div>
                        </div>
                        <Badge
                          variant={
                            epic.status === 'completed'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {epic.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {keyEpics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No key epics found for this quarter
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Key Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flag className="h-5 w-5 mr-2 text-blue-600" />
                Key Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {keyMilestones.map(milestone => {
                  const project = projects.find(
                    p => p.id === milestone.projectId
                  );
                  return (
                    <div key={milestone.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{milestone.name}</div>
                          <div className="text-sm text-gray-600">
                            {project?.name} • Due:{' '}
                            {new Date(milestone.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge
                          variant={
                            milestone.status === 'completed'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {milestone.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {keyMilestones.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No key milestones found for this quarter
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          {/* At Risk Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                At Risk Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {atRiskMilestones.map(milestone => {
                  const project = projects.find(
                    p => p.id === milestone.projectId
                  );
                  return (
                    <div
                      key={milestone.id}
                      className="p-3 border border-red-200 rounded-lg bg-red-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-red-800">
                            {milestone.name}
                          </div>
                          <div className="text-sm text-red-600">
                            {project?.name} • Due:{' '}
                            {new Date(milestone.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="destructive">At Risk</Badge>
                      </div>
                    </div>
                  );
                })}
                {atRiskMilestones.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No at-risk items found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          {/* Resource Constraints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-orange-600" />
                Resource Constraints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resourceConstraints
                  .filter(r => r.riskLevel !== 'low')
                  .map(constraint => (
                    <div
                      key={constraint.teamId}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {constraint.teamName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {constraint.memberCount} members •{' '}
                            {constraint.unavailableMembers} unavailable
                          </div>
                        </div>
                        <div className="text-right">
                          {getRiskLevelBadge(constraint.riskLevel)}
                          <div className="text-sm text-gray-600 mt-1">
                            {constraint.totalAllocation}% allocated
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {resourceConstraints.filter(r => r.riskLevel !== 'low')
                  .length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No resource constraints found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuarterAnalysisDashboard;
