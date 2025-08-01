import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Project, Epic, Milestone } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarDays,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  BarChart3,
  X,
  Edit,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateProjectCost } from '@/utils/financialCalculations';
import { calculateProjectedEndDate } from '@/utils/calculateProjectedEndDate';
import { format } from 'date-fns';

export interface ProjectCommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  mode?: 'view' | 'edit';
}

export const ProjectCommandCenterModal: React.FC<
  ProjectCommandCenterModalProps
> = ({ isOpen, onClose, project, mode = 'view' }) => {
  const {
    epics,
    milestones,
    allocations,
    cycles,
    teams,
    people,
    roles,
    projects,
    setProjects,
    projectSolutions,
    projectSkills,
  } = useApp();

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(mode === 'edit');

  // Reset edit mode when mode prop changes
  useEffect(() => {
    setIsEditMode(mode === 'edit');
  }, [mode]);

  // Calculate financial data
  const projectFinancials = useMemo(() => {
    if (!project) {
      return {
        totalCost: 0,
        breakdown: [],
        teamBreakdown: [],
        monthlyBurnRate: 0,
        totalDurationInDays: 0,
      };
    }
    return calculateProjectCost(
      project,
      epics,
      allocations,
      cycles,
      people,
      roles,
      teams
    );
  }, [project, epics, allocations, cycles, people, roles, teams]);

  // Calculate projected end date
  const projectedEndDate = useMemo(() => {
    if (!project) return null;
    return calculateProjectedEndDate(
      project,
      epics,
      milestones,
      allocations,
      teams,
      people,
      roles,
      cycles
    );
  }, [project, epics, milestones, allocations, teams, people, roles, cycles]);

  // Filter data for this project
  const projectEpics = useMemo(
    () => epics.filter(epic => epic.projectId === project?.id),
    [epics, project?.id]
  );

  const projectMilestones = useMemo(
    () => milestones.filter(milestone => milestone.projectId === project?.id),
    [milestones, project?.id]
  );

  const handleClose = () => {
    setIsEditMode(false);
    setActiveTab('overview');
    onClose();
  };

  const handleSave = () => {
    // Save logic will be implemented in edit mode
    toast({
      title: 'Success',
      description: 'Project updated successfully',
    });
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    handleClose();
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  if (!isOpen || !project) {
    return null;
  }

  const getStatusBadgeVariant = (status: Project['status']) => {
    const statusConfig = {
      planning: 'secondary' as const,
      'in-progress': 'default' as const,
      completed: 'outline' as const,
      'on-hold': 'secondary' as const,
      cancelled: 'destructive' as const,
    };
    return statusConfig[status] || 'secondary';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        data-testid="project-command-center-modal"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-2xl font-bold">
                {project.name}
              </DialogTitle>
              <Badge variant={getStatusBadgeVariant(project.status)}>
                {project.status.replace('-', ' ')}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span
                data-testid="mode-indicator"
                className="text-sm text-gray-500"
              >
                {isEditMode ? 'edit' : 'view'}
              </span>
              {!isEditMode && (
                <Button variant="outline" size="sm" onClick={toggleEditMode}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                data-testid="close-button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="grid w-full grid-cols-6"
            data-testid="tab-navigation"
          >
            <TabsTrigger value="overview" data-testid="overview-tab">
              <CalendarDays className="h-4 w-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="epics-timeline"
              data-testid="epics-timeline-tab"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Epics & Timeline
            </TabsTrigger>
            <TabsTrigger value="financials" data-testid="financials-tab">
              <DollarSign className="h-4 w-4 mr-1" />
              Financials
            </TabsTrigger>
            <TabsTrigger
              value="solutions-skills"
              data-testid="solutions-skills-tab"
            >
              <Users className="h-4 w-4 mr-1" />
              Solutions & Skills
            </TabsTrigger>
            <TabsTrigger
              value="progress-tracking"
              data-testid="progress-tracking-tab"
            >
              <Target className="h-4 w-4 mr-1" />
              Progress & Tracking
            </TabsTrigger>
            <TabsTrigger
              value="steerco-report"
              data-testid="steerco-report-tab"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              SteerCo Report
            </TabsTrigger>
          </TabsList>

          <div data-testid="tab-content" className="mt-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div data-testid="overview-content">
                {/* Core Project Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Project Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div
                        data-testid="project-name"
                        className="font-semibold text-lg"
                      >
                        {project.name}
                      </div>
                      <div
                        data-testid="project-description"
                        className="text-sm text-gray-600"
                      >
                        {project.description || 'No description provided'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Status:</span>
                        <span data-testid="project-status" className="text-sm">
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Priority:</span>
                        <span
                          data-testid="project-priority"
                          className="text-sm"
                        >
                          {project.priority}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Start Date:</span>
                        <span
                          data-testid="project-start-date"
                          className="text-sm"
                        >
                          {project.startDate
                            ? format(
                                new Date(project.startDate),
                                'MMM dd, yyyy'
                              )
                            : 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">End Date:</span>
                        <span
                          data-testid="project-end-date"
                          className="text-sm"
                        >
                          {project.endDate
                            ? format(new Date(project.endDate), 'MMM dd, yyyy')
                            : 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-sm font-medium text-blue-600">
                          Projected End:
                        </span>
                        <span
                          data-testid="projected-end-date"
                          className="text-sm font-semibold text-blue-600"
                        >
                          {projectedEndDate
                            ? format(new Date(projectedEndDate), 'MMM dd, yyyy')
                            : 'Not calculated'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Budget & Cost
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Budget:</span>
                        <span data-testid="project-budget" className="text-sm">
                          {project.budget
                            ? `$${project.budget.toLocaleString()}`
                            : 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Est. Cost:</span>
                        <span className="text-sm">
                          ${projectFinancials.totalCost.toLocaleString()}
                        </span>
                      </div>
                      {project.budget && (
                        <div className="flex items-center justify-between border-t pt-2">
                          <span className="text-sm font-medium">Variance:</span>
                          <span
                            className={`text-sm font-semibold ${
                              project.budget - projectFinancials.totalCost >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            $
                            {Math.abs(
                              project.budget - projectFinancials.totalCost
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {projectEpics.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Epics</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {
                          projectEpics.filter(e => e.status === 'completed')
                            .length
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        Completed Epics
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {projectMilestones.length}
                      </div>
                      <div className="text-sm text-gray-600">Milestones</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        $
                        {Math.round(
                          projectFinancials.monthlyBurnRate
                        ).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Monthly Burn</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Epics & Timeline Tab */}
            <TabsContent value="epics-timeline" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Project Epics</h3>
                {projectEpics.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      No epics defined for this project yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectEpics.map(epic => (
                      <Card key={epic.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                              {epic.name}
                            </CardTitle>
                            <Badge
                              variant={
                                epic.status === 'completed'
                                  ? 'outline'
                                  : 'default'
                              }
                            >
                              {epic.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {epic.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {epic.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              Effort: {epic.estimatedEffort || 0} points
                            </span>
                            <span>Priority: {epic.priority}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Financials Tab */}
            <TabsContent value="financials" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Financial Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Estimated Cost:</span>
                          <span className="font-semibold">
                            ${projectFinancials.totalCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Burn Rate:</span>
                          <span>
                            $
                            {Math.round(
                              projectFinancials.monthlyBurnRate
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Project Duration:</span>
                          <span>
                            {projectFinancials.totalDurationInDays} days
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Budget Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Allocated Budget:</span>
                          <span>
                            {project.budget
                              ? `$${project.budget.toLocaleString()}`
                              : 'Not set'}
                          </span>
                        </div>
                        {project.budget && (
                          <>
                            <div className="flex justify-between">
                              <span>Remaining Budget:</span>
                              <span
                                className={
                                  project.budget -
                                    projectFinancials.totalCost >=
                                  0
                                    ? 'text-green-600 font-semibold'
                                    : 'text-red-600 font-semibold'
                                }
                              >
                                $
                                {(
                                  project.budget - projectFinancials.totalCost
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Budget Utilization:</span>
                              <span>
                                {Math.round(
                                  (projectFinancials.totalCost /
                                    project.budget) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Solutions & Skills Tab */}
            <TabsContent value="solutions-skills" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Solutions & Skills
                </h3>
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    Solutions and skills management will be implemented here.
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Progress & Tracking Tab */}
            <TabsContent value="progress-tracking" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Progress & Milestones
                </h3>
                {projectMilestones.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      No milestones defined for this project yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {projectMilestones.map(milestone => (
                      <Card key={milestone.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">
                                {milestone.name}
                              </h4>
                              {milestone.description && (
                                <p className="text-sm text-gray-600">
                                  {milestone.description}
                                </p>
                              )}
                              <p className="text-sm text-gray-500">
                                Due:{' '}
                                {format(
                                  new Date(milestone.dueDate),
                                  'MMM dd, yyyy'
                                )}
                              </p>
                            </div>
                            <Badge
                              variant={
                                milestone.isCompleted ? 'outline' : 'default'
                              }
                            >
                              {milestone.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* SteerCo Report Tab */}
            <TabsContent value="steerco-report" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Executive Summary
                </h3>
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    Executive reporting features will be implemented here.
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Edit Mode Actions */}
        {isEditMode && (
          <div
            data-testid="edit-actions"
            className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t"
          >
            <Button
              variant="outline"
              onClick={handleCancel}
              data-testid="cancel-button"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="save-button">
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
