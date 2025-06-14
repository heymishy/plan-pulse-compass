
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Eye, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectTableProps {
  projects: Project[];
  onEditProject: (projectId: string) => void;
  onViewProject: (projectId: string) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onEditProject, onViewProject }) => {
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Epics</TableHead>
            <TableHead>Milestones</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const projectEpics = getProjectEpics(project.id);
            const completedMilestones = getCompletedMilestones(project);
            
            return (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{getStatusBadge(project.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">
                      {format(new Date(project.startDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {project.endDate ? (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">
                        {format(new Date(project.endDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  {project.budget ? (
                    <span className="font-medium">
                      ${project.budget.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {projectEpics.length} epic{projectEpics.length !== 1 ? 's' : ''}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Target className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">
                      {completedMilestones}/{project.milestones.length}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewProject(project.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditProject(project.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectTable;
