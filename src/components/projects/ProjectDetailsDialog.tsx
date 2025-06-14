
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Project, Epic } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Target, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import EpicDialog from '@/components/projects/EpicDialog';
import { useToast } from '@/hooks/use-toast';

interface ProjectDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({ isOpen, onClose, project }) => {
  const { epics, setEpics } = useApp();
  const { toast } = useToast();
  const [isEpicDialogOpen, setIsEpicDialogOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);

  if (!project) return null;

  const projectEpics = epics.filter(epic => epic.projectId === project.id);

  const getStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      planning: { variant: 'secondary' as const, label: 'Planning' },
      active: { variant: 'default' as const, label: 'Active' },
      completed: { variant: 'outline' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEpicStatusBadge = (status: Epic['status']) => {
    const statusConfig = {
      'not-started': { variant: 'secondary' as const, label: 'Not Started' },
      'in-progress': { variant: 'default' as const, label: 'In Progress' },
      completed: { variant: 'outline' as const, label: 'Completed' },
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMilestoneStatusBadge = (status: string) => {
    const statusConfig = {
      'not-started': { variant: 'secondary' as const, label: 'Not Started' },
      'in-progress': { variant: 'default' as const, label: 'In Progress' },
      completed: { variant: 'outline' as const, label: 'Completed' },
      'at-risk': { variant: 'destructive' as const, label: 'At Risk' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCreateEpic = () => {
    setSelectedEpic(null);
    setIsEpicDialogOpen(true);
  };

  const handleEditEpic = (epic: Epic) => {
    setSelectedEpic(epic);
    setIsEpicDialogOpen(true);
  };

  const handleDeleteEpic = (epicId: string) => {
    setEpics(prev => prev.filter(epic => epic.id !== epicId));
    toast({
      title: "Success",
      description: "Epic deleted successfully",
    });
  };

  const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
  const totalEffort = projectEpics.reduce((sum, epic) => sum + epic.estimatedEffort, 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{project.name}</span>
              {getStatusBadge(project.status)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Project Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div>Start: {format(new Date(project.startDate), 'MMM dd, yyyy')}</div>
                    {project.endDate && (
                      <div>End: {format(new Date(project.endDate), 'MMM dd, yyyy')}</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {project.budget && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Budget
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      ${project.budget.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    Milestones: {completedMilestones}/{project.milestones.length}
                  </div>
                  <div className="text-sm">
                    Epics: {projectEpics.filter(e => e.status === 'completed').length}/{projectEpics.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {project.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </div>
            )}

            {/* Milestones */}
            {project.milestones.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Milestones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {project.milestones.map((milestone) => (
                    <Card key={milestone.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{milestone.name}</CardTitle>
                          {getMilestoneStatusBadge(milestone.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600">
                          Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                        </div>
                        {milestone.description && (
                          <p className="text-sm mt-1">{milestone.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Epics Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Epics</h3>
                <div className="flex items-center space-x-2">
                  {totalEffort > 0 && (
                    <Badge variant="outline">
                      Total Effort: {totalEffort} points
                    </Badge>
                  )}
                  <Button onClick={handleCreateEpic} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Epic
                  </Button>
                </div>
              </div>

              {projectEpics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No epics yet. Create your first epic to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectEpics.map((epic) => (
                    <Card key={epic.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{epic.name}</CardTitle>
                          {getEpicStatusBadge(epic.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {epic.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {epic.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {epic.estimatedEffort} points
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEpic(epic)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEpic(epic.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EpicDialog
        isOpen={isEpicDialogOpen}
        onClose={() => setIsEpicDialogOpen(false)}
        epic={selectedEpic}
        projectId={project.id}
      />
    </>
  );
};

export default ProjectDetailsDialog;
