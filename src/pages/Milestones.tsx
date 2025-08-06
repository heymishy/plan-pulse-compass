import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Grid,
  Table,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import MilestoneTable from '@/components/milestones/MilestoneTable';
import MilestoneCards from '@/components/milestones/MilestoneCards';
import MilestoneDialog from '@/components/milestones/MilestoneDialog';
import { Milestone } from '@/types';
import SearchAndFilter from '@/components/planning/SearchAndFilter';

const Milestones = () => {
  const { projects, setProjects } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState({
    searchQuery: '',
    projectId: 'all',
    status: 'all',
  });

  // Get all milestones from all projects
  const allMilestones = projects.flatMap(project =>
    project.milestones.map(milestone => ({
      ...milestone,
      projectName: project.name,
      projectStatus: project.status,
    }))
  );

  const filteredMilestones = allMilestones.filter(milestone => {
    return (
      (filters.searchQuery === '' || milestone.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) &&
      (filters.projectId === 'all' || milestone.projectId === filters.projectId) &&
      (filters.status === 'all' || milestone.status === filters.status)
    );
  });

  const handleCreateMilestone = () => {
    setSelectedMilestone(null);
    setSelectedProjectId(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    const project = projects.find(p =>
      p.milestones.some(m => m.id === milestone.id)
    );
    setSelectedMilestone(milestone);
    setSelectedProjectId(project?.id || null);
    setIsEditDialogOpen(true);
  };

  const getStatusCounts = () => {
    return {
      notStarted: allMilestones.filter(m => m.status === 'not-started').length,
      inProgress: allMilestones.filter(m => m.status === 'in-progress').length,
      completed: allMilestones.filter(m => m.status === 'completed').length,
      atRisk: allMilestones.filter(m => m.status === 'at-risk').length,
    };
  };

  const getUpcomingMilestones = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return allMilestones.filter(milestone => {
      const dueDate = new Date(milestone.dueDate);
      return (
        dueDate >= now &&
        dueDate <= nextWeek &&
        milestone.status !== 'completed'
      );
    }).length;
  };

  const getOverdueMilestones = () => {
    const now = new Date();
    return allMilestones.filter(milestone => {
      const dueDate = new Date(milestone.dueDate);
      return dueDate < now && milestone.status !== 'completed';
    }).length;
  };

  const statusCounts = getStatusCounts();
  const upcomingCount = getUpcomingMilestones();
  const overdueCount = getOverdueMilestones();

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        className="flex-1 p-6 space-y-6 w-full overflow-auto"
        data-testid="milestones-content"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Milestones</h1>
            <p className="text-gray-600">
              Track project milestones and delivery dates
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Table className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleCreateMilestone}>
              <Plus className="h-4 w-4 mr-2" />
              New Milestone
            </Button>
          </div>
        </div>

        <SearchAndFilter
          filters={filters}
          onFiltersChange={setFilters}
          filterFields={[
            { id: 'searchQuery', label: 'Search', type: 'text', placeholder: 'Search milestones...' },
            { id: 'projectId', label: 'Project', type: 'select', options: projects.map(p => ({ value: p.id, label: p.name })) },
            { id: 'status', label: 'Status', type: 'select', options: [{ value: 'not-started', label: 'Not Started' }, { value: 'in-progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }, { value: 'at-risk', label: 'At Risk' }] },
          ]}
        />

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Not Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statusCounts.notStarted}
              </div>
              <Badge variant="secondary" className="mt-1">
                Pending
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statusCounts.inProgress}
              </div>
              <Badge className="mt-1 bg-blue-500">Active</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.completed}</div>
              <Badge className="mt-1 bg-green-500">Done</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                At Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.atRisk}</div>
              <Badge variant="destructive" className="mt-1">
                Risk
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingCount}</div>
              <Badge variant="outline" className="mt-1">
                Next 7 days
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueCount}</div>
              <Badge variant="destructive" className="mt-1">
                Past Due
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Milestones List */}
        {viewMode === 'table' ? (
          <MilestoneTable
            milestones={filteredMilestones}
            onEditMilestone={handleEditMilestone}
          />
        ) : (
          <MilestoneCards
            milestones={filteredMilestones}
            onEditMilestone={handleEditMilestone}
          />
        )}

        {/* Dialogs */}
        <MilestoneDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          milestone={null}
          projectId={selectedProjectId}
        />
        <MilestoneDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          milestone={selectedMilestone}
          projectId={selectedProjectId}
        />
      </div>
    </div>
  );
};

export default Milestones;
