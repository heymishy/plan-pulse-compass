import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Network,
  Search,
  Filter,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Team, Project, Epic, Milestone, Allocation, Cycle } from '@/types';

// Types for dependencies
interface ProjectDependency {
  id: string;
  fromProjectId: string;
  toProjectId: string;
  fromMilestoneId?: string;
  toMilestoneId?: string;
  dependencyType: 'blocks' | 'enables' | 'related';
  description?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'at-risk';
}

interface EpicDependency {
  id: string;
  fromEpicId: string;
  toEpicId: string;
  dependencyType: 'blocks' | 'enables' | 'related';
  description?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'at-risk';
}

interface DependenciesViewProps {
  projects: Project[];
  epics: Epic[];
  teams: Team[];
  allocations: Allocation[];
  cycles: Cycle[];
  selectedCycleId: string;
}

const DependenciesView: React.FC<DependenciesViewProps> = ({
  projects,
  epics,
  teams,
  allocations,
  cycles,
  selectedCycleId,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'epics'>(
    'overview'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('all');

  // Mock dependencies data - in real implementation this would come from the backend
  const projectDependencies: ProjectDependency[] = useMemo(() => {
    const deps: ProjectDependency[] = [];

    // Generate some realistic dependencies based on projects
    projects.forEach((project, index) => {
      if (index > 0 && Math.random() > 0.7) {
        const previousProject = projects[index - 1];
        deps.push({
          id: `dep-${project.id}-${previousProject.id}`,
          fromProjectId: previousProject.id,
          toProjectId: project.id,
          dependencyType: 'enables',
          description: `${previousProject.name} provides infrastructure needed for ${project.name}`,
          criticality: 'high',
          status: 'active',
        });
      }
    });

    return deps;
  }, [projects]);

  const epicDependencies: EpicDependency[] = useMemo(() => {
    const deps: EpicDependency[] = [];

    // Generate epic dependencies within projects
    projects.forEach(project => {
      const projectEpics = epics.filter(epic => epic.projectId === project.id);

      projectEpics.forEach((epic, index) => {
        if (index > 0 && Math.random() > 0.6) {
          const previousEpic = projectEpics[index - 1];
          deps.push({
            id: `epic-dep-${epic.id}-${previousEpic.id}`,
            fromEpicId: previousEpic.id,
            toEpicId: epic.id,
            dependencyType: 'blocks',
            description: `${previousEpic.name} must be completed before ${epic.name}`,
            criticality: 'medium',
            status: epic.status === 'completed' ? 'resolved' : 'active',
          });
        }
      });
    });

    return deps;
  }, [epics, projects]);

  // Analyze dependency impact on current planning
  const dependencyAnalysis = useMemo(() => {
    const relevantAllocations = allocations.filter(
      a => a.cycleId === selectedCycleId
    );
    const allocatedEpics = new Set(
      relevantAllocations.map(a => a.epicId).filter(Boolean)
    );

    // Find critical path dependencies
    const criticalDependencies = epicDependencies.filter(
      dep => dep.criticality === 'critical' || dep.criticality === 'high'
    );

    // Find blocked epics
    const blockedEpics = epicDependencies
      .filter(dep => dep.dependencyType === 'blocks' && dep.status === 'active')
      .map(dep => dep.toEpicId);

    // Find at-risk dependencies
    const atRiskDependencies = [
      ...projectDependencies,
      ...epicDependencies,
    ].filter(dep => dep.status === 'at-risk');

    return {
      totalDependencies: projectDependencies.length + epicDependencies.length,
      criticalDependencies: criticalDependencies.length,
      blockedEpics: blockedEpics.length,
      atRiskDependencies: atRiskDependencies.length,
      allocatedBlockedEpics: blockedEpics.filter(epicId =>
        allocatedEpics.has(epicId)
      ).length,
    };
  }, [projectDependencies, epicDependencies, allocations, selectedCycleId]);

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'at-risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const getEpicName = (epicId: string) => {
    return epics.find(e => e.id === epicId)?.name || 'Unknown Epic';
  };

  const filteredProjectDependencies = projectDependencies.filter(dep => {
    const matchesSearch =
      searchQuery === '' ||
      getProjectName(dep.fromProjectId)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      getProjectName(dep.toProjectId)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (dep.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);

    const matchesProject =
      selectedProject === 'all' ||
      dep.fromProjectId === selectedProject ||
      dep.toProjectId === selectedProject;

    const matchesCriticality =
      criticalityFilter === 'all' || dep.criticality === criticalityFilter;

    return matchesSearch && matchesProject && matchesCriticality;
  });

  const filteredEpicDependencies = epicDependencies.filter(dep => {
    const fromEpic = epics.find(e => e.id === dep.fromEpicId);
    const toEpic = epics.find(e => e.id === dep.toEpicId);

    const matchesSearch =
      searchQuery === '' ||
      (fromEpic?.name.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (toEpic?.name.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (dep.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);

    const matchesProject =
      selectedProject === 'all' ||
      fromEpic?.projectId === selectedProject ||
      toEpic?.projectId === selectedProject;

    const matchesCriticality =
      criticalityFilter === 'all' || dep.criticality === criticalityFilter;

    return matchesSearch && matchesProject && matchesCriticality;
  });

  if (!selectedCycleId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Please select a cycle to view dependencies.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Overview Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Network className="h-5 w-5 mr-2" />
              Dependencies Overview
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {dependencyAnalysis.totalDependencies}
              </div>
              <div className="text-sm text-gray-600">Total Dependencies</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">
                {dependencyAnalysis.criticalDependencies}
              </div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {dependencyAnalysis.blockedEpics}
              </div>
              <div className="text-sm text-gray-600">Blocked Epics</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {dependencyAnalysis.atRiskDependencies}
              </div>
              <div className="text-sm text-gray-600">At Risk</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {dependencyAnalysis.allocatedBlockedEpics}
              </div>
              <div className="text-sm text-gray-600">Planned & Blocked</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search dependencies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Projects" />
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

            <div className="flex items-center space-x-2">
              <Select
                value={criticalityFilter}
                onValueChange={setCriticalityFilter}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value: any) => setActiveTab(value)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Project Dependencies</TabsTrigger>
          <TabsTrigger value="epics">Epic Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Critical Dependencies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  Critical Dependencies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...filteredProjectDependencies, ...filteredEpicDependencies]
                  .filter(
                    dep =>
                      dep.criticality === 'critical' ||
                      dep.criticality === 'high'
                  )
                  .slice(0, 5)
                  .map(dep => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {'fromProjectId' in dep
                            ? `${getProjectName(dep.fromProjectId)} → ${getProjectName(dep.toProjectId)}`
                            : `${getEpicName(dep.fromEpicId)} → ${getEpicName(dep.toEpicId)}`}
                        </div>
                        <div className="text-xs text-gray-600">
                          {dep.description}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getCriticalityColor(dep.criticality)}>
                          {dep.criticality}
                        </Badge>
                        {getStatusIcon(dep.status)}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Blocked Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-orange-500" />
                  Currently Blocked
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {epicDependencies
                  .filter(
                    dep =>
                      dep.dependencyType === 'blocks' && dep.status === 'active'
                  )
                  .slice(0, 5)
                  .map(dep => {
                    const blockedEpic = epics.find(e => e.id === dep.toEpicId);
                    const blockingEpic = epics.find(
                      e => e.id === dep.fromEpicId
                    );
                    return (
                      <div key={dep.id} className="p-3 border rounded">
                        <div className="font-medium text-sm text-orange-700">
                          {blockedEpic?.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Blocked by: {blockingEpic?.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {dep.description}
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProjectDependencies.map(dep => (
                  <div key={dep.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium">
                          {getProjectName(dep.fromProjectId)}
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <div className="font-medium">
                          {getProjectName(dep.toProjectId)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getCriticalityColor(dep.criticality)}>
                          {dep.criticality}
                        </Badge>
                        {getStatusIcon(dep.status)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Type:</strong> {dep.dependencyType}
                    </div>

                    {dep.description && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {dep.description}
                      </div>
                    )}
                  </div>
                ))}

                {filteredProjectDependencies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Network className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <div className="font-medium">
                      No project dependencies found
                    </div>
                    <div className="text-sm">
                      Try adjusting your filters or search terms.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="epics">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Epic Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEpicDependencies.map(dep => {
                  const fromEpic = epics.find(e => e.id === dep.fromEpicId);
                  const toEpic = epics.find(e => e.id === dep.toEpicId);
                  return (
                    <div key={dep.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium">{fromEpic?.name}</div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <div className="font-medium">{toEpic?.name}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={getCriticalityColor(dep.criticality)}
                          >
                            {dep.criticality}
                          </Badge>
                          {getStatusIcon(dep.status)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Type:</strong> {dep.dependencyType}
                      </div>

                      <div className="text-xs text-gray-500 mb-2">
                        Projects: {getProjectName(fromEpic?.projectId || '')} →{' '}
                        {getProjectName(toEpic?.projectId || '')}
                      </div>

                      {dep.description && (
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {dep.description}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredEpicDependencies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <div className="font-medium">
                      No epic dependencies found
                    </div>
                    <div className="text-sm">
                      Try adjusting your filters or search terms.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Dependency Management Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dependencyAnalysis.allocatedBlockedEpics > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-medium text-red-800">
                  Critical Planning Issue
                </div>
                <div className="text-sm text-red-700 mt-1">
                  {dependencyAnalysis.allocatedBlockedEpics} epic(s) in your
                  current plan are blocked by dependencies. Consider
                  reallocating resources or resolving blockers before the
                  iteration starts.
                </div>
              </div>
            )}

            {dependencyAnalysis.atRiskDependencies > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800">
                  Dependencies at Risk
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  {dependencyAnalysis.atRiskDependencies} dependencies are
                  marked as at-risk. Review these dependencies and create
                  mitigation plans.
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800">Best Practices</div>
              <div className="text-sm text-blue-700 mt-1">
                • Regularly review and update dependency status • Communicate
                dependency impacts to stakeholders • Create buffer time for
                critical dependencies • Consider alternative approaches to
                reduce dependencies
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DependenciesView;
