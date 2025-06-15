
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Eye, Calendar, Trash2, Layers, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateProjectCost } from '@/utils/financialCalculations';
import { Separator } from '@/components/ui/separator';

interface ProjectCardsProps {
  projects: Project[];
  onEditProject: (projectId: string) => void;
  onViewProject: (projectId: string) => void;
}

const ProjectCards: React.FC<ProjectCardsProps> = ({ projects, onEditProject, onViewProject }) => {
  const { setProjects, setEpics, epics, allocations, cycles, people, roles, teams } = useApp();
  const { toast } = useToast();
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planning: { label: 'Planning', variant: 'secondary' as const },
      active: { label: 'Active', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'outline' as const },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSelectProject = (projectId: string, checked: boolean) => {
    const newSelected = new Set(selectedProjects);
    if (checked) {
      newSelected.add(projectId);
    } else {
      newSelected.delete(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleBulkDelete = () => {
    // Remove selected projects
    setProjects(prevProjects => prevProjects.filter(project => !selectedProjects.has(project.id)));
    
    // Remove epics associated with deleted projects
    setEpics(prevEpics => prevEpics.filter(epic => !selectedProjects.has(epic.projectId)));

    toast({
      title: "Projects Deleted",
      description: `Successfully deleted ${selectedProjects.size} project${selectedProjects.size !== 1 ? 's' : ''} and their associated epics`,
    });

    setSelectedProjects(new Set());
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-4">
      {selectedProjects.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const projectEpics = epics.filter(e => e.projectId === project.id);
          const { totalCost } = calculateProjectCost(project, epics, allocations, cycles, people, roles, teams);
          
          return (
          <Card key={project.id} className="flex flex-col hover:shadow-md transition-shadow relative">
            <div className="absolute top-4 left-4">
              <Checkbox
                checked={selectedProjects.has(project.id)}
                onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                aria-label={`Select ${project.name}`}
              />
            </div>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pl-14">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
                {getStatusBadge(project.status)}
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onViewProject(project.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEditProject(project.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow pl-14">
              {project.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {project.description}
                </p>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Epics
                  </span>
                  <span className="font-medium">{projectEpics.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Est. Cost
                  </span>
                  <span className="font-semibold">
                    {totalCost.toLocaleString(undefined, {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Start Date
                  </span>
                  <span>{new Date(project.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    End Date
                  </span>
                  <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Projects</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''}? 
              This action cannot be undone and will also delete all associated epics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectCards;
