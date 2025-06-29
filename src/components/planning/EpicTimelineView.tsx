import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
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

interface EpicTimelineViewProps {
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

const EpicTimelineView: React.FC<EpicTimelineViewProps> = ({
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
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const timelineData = useMemo(() => {
    const quarterAllocations = allocations.filter(a => a.cycleId === cycleId);

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

    // Get epics with timeline data
    const epicTimeline = epics
      .filter(e => filteredAllocations.some(a => a.epicId === e.id))
      .map(epic => {
        const project = projects.find(p => p.id === epic.projectId);
        const team = teams.find(t => t.id === epic.assignedTeamId);
        const epicAllocations = filteredAllocations.filter(
          a => a.epicId === epic.id
        );

        // Find iteration range for this epic
        const iterationNumbers = epicAllocations
          .map(a => a.iterationNumber)
          .sort();
        const startIteration = iterations.find(i => {
          const iterNum = parseInt(i.name.match(/\d+/)?.[0] || '0');
          return iterNum === iterationNumbers[0];
        });
        const endIteration = iterations.find(i => {
          const iterNum = parseInt(i.name.match(/\d+/)?.[0] || '0');
          return iterNum === iterationNumbers[iterationNumbers.length - 1];
        });

        return {
          id: epic.id,
          name: epic.name,
          projectName: project?.name || 'Unknown Project',
          teamName: team?.name || 'Unassigned',
          startDate: startIteration?.startDate || '',
          endDate: endIteration?.endDate || '',
          status: epic.status,
          isKey: epic.isKey || false,
          totalAllocation: epicAllocations.reduce(
            (sum, a) => sum + a.percentage,
            0
          ),
          iterations: iterationNumbers,
        };
      })
      .filter(
        epic =>
          selectedProject === 'all' ||
          projects.find(p => p.name === epic.projectName)?.id ===
            selectedProject
      );

    // Get milestones with timeline data
    const milestoneTimeline = milestones
      .filter(m => {
        const project = projects.find(p => p.id === m.projectId);
        return (
          project &&
          (selectedProject === 'all' || project.id === selectedProject)
        );
      })
      .map(milestone => {
        const project = projects.find(p => p.id === milestone.projectId);
        const milestoneDate = new Date(milestone.dueDate);

        // Find which iteration this milestone belongs to
        const iteration = iterations.find(iter => {
          const iterStart = new Date(iter.startDate);
          const iterEnd = new Date(iter.endDate);
          return milestoneDate >= iterStart && milestoneDate <= iterEnd;
        });

        return {
          id: milestone.id,
          name: milestone.name,
          projectName: project?.name || 'Unknown Project',
          dueDate: milestone.dueDate,
          status: milestone.status,
          isKey: milestone.isKey || false,
          iteration: iteration?.name || 'Unknown',
        };
      });

    return {
      epics: epicTimeline,
      milestones: milestoneTimeline,
      summary: {
        totalEpics: epicTimeline.length,
        keyEpics: epicTimeline.filter(e => e.isKey).length,
        totalMilestones: milestoneTimeline.length,
        keyMilestones: milestoneTimeline.filter(m => m.isKey).length,
        completedEpics: epicTimeline.filter(e => e.status === 'completed')
          .length,
        completedMilestones: milestoneTimeline.filter(
          m => m.status === 'completed'
        ).length,
        atRiskMilestones: milestoneTimeline.filter(m => m.status === 'at-risk')
          .length,
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
    selectedProject,
  ]);

  const {
    epics: timelineEpics,
    milestones: timelineMilestones,
    summary,
  } = timelineData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'at-risk':
        return <Badge variant="destructive">At Risk</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'in-progress':
        return 'border-blue-500 bg-blue-50';
      case 'at-risk':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
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
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Project:</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Epics</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalEpics}
            </div>
            <p className="text-xs text-gray-500">
              {summary.keyEpics} key epics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <Flag className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.totalMilestones}
            </div>
            <p className="text-xs text-gray-500">
              {summary.keyMilestones} key milestones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.completedEpics + summary.completedMilestones}
            </div>
            <p className="text-xs text-gray-500">epics & milestones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.atRiskMilestones}
            </div>
            <p className="text-xs text-gray-500">milestones at risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Views */}
      <Tabs defaultValue="epics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="epics">Epic Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestone Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="epics" className="space-y-6">
          {/* Epic Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Epic Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineEpics.map(epic => (
                  <div
                    key={epic.id}
                    className={`p-4 border-l-4 rounded-lg ${getStatusColor(epic.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center">
                          {epic.name}
                          {epic.isKey && (
                            <Star className="h-4 w-4 ml-2 text-yellow-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {epic.projectName} • {epic.teamName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(epic.startDate).toLocaleDateString()} -{' '}
                          {new Date(epic.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {epic.totalAllocation}%
                        </Badge>
                        <div className="mt-1">
                          {getStatusBadge(epic.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {timelineEpics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No epics found for the selected filters
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          {/* Milestone Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flag className="h-5 w-5 mr-2" />
                Milestone Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineMilestones.map(milestone => (
                  <div
                    key={milestone.id}
                    className={`p-4 border-l-4 rounded-lg ${getStatusColor(milestone.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center">
                          {milestone.name}
                          {milestone.isKey && (
                            <Flag className="h-4 w-4 ml-2 text-blue-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {milestone.projectName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Due:{' '}
                          {new Date(milestone.dueDate).toLocaleDateString()} •{' '}
                          {milestone.iteration}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(milestone.status)}
                      </div>
                    </div>
                  </div>
                ))}
                {timelineMilestones.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No milestones found for the selected filters
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

export default EpicTimelineView;
