
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Eye, Calendar, Target, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectCardsProps {
  projects: Project[];
  onEditProject: (projectId: string) => void;
  onViewProject: (projectId: string) => void;
}

const ProjectCards: React.FC<ProjectCardsProps> = ({ projects, onEditProject, onViewProject }) => {
  const { epics } = useApp();

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

  const getProjectEpics = (projectId: string) => {
    return epics.filter(epic => epic.projectId === projectId);
  };

  const getCompletedMilestones = (project: Project) => {
    return project.milestones.filter(m => m.status === 'completed').length;
  };

  const getMilestoneProgress = (project: Project) => {
    if (project.milestones.length === 0) return 0;
    return (getCompletedMilestones(project) / project.milestones.length) * 100;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const projectEpics = getProjectEpics(project.id);
        const completedMilestones = getCompletedMilestones(project);
        const milestoneProgress = getMilestoneProgress(project);
        
        return (
          <Card key={project.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                {getStatusBadge(project.status)}
              </div>
              {project.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {project.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span>Start: {format(new Date(project.startDate), 'MMM dd, yyyy')}</span>
                </div>
                {project.endDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>End: {format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>

              {project.budget && (
                <div className="flex items-center space-x-1 text-sm">
                  <DollarSign className="h-3 w-3 text-gray-400" />
                  <span>Budget: ${project.budget.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {projectEpics.length} epic{projectEpics.length !== 1 ? 's' : ''}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Target className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {completedMilestones}/{project.milestones.length} milestones
                    </span>
                  </div>
                </div>
              </div>

              {project.milestones.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-600">{Math.round(milestoneProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        milestoneProgress === 100 ? 'bg-green-500' :
                        milestoneProgress > 50 ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${milestoneProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProject(project.id)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditProject(project.id)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProjectCards;
