
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Grid, Table, Eye, ListPlus } from 'lucide-react';
import ProjectTable from '@/components/projects/ProjectTable';
import ProjectCards from '@/components/projects/ProjectCards';
import ProjectDialog from '@/components/projects/ProjectDialog';
import ProjectDetailsDialog from '@/components/projects/ProjectDetailsDialog';
import BulkEpicEntryDialog from '@/components/projects/BulkEpicEntryDialog';
import { Project } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const Projects = () => {
  const { projects } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isBulkEpicDialogOpen, setIsBulkEpicDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [bulkEpicProjectId, setBulkEpicProjectId] = useState('');

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setIsEditDialogOpen(true);
    }
  };

  const handleViewProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setIsDetailsDialogOpen(true);
    }
  };

  const handleBulkAddEpics = () => {
    if (bulkEpicProjectId) {
      const project = projects.find(p => p.id === bulkEpicProjectId);
      if (project) {
        setSelectedProject(project);
        setIsBulkEpicDialogOpen(true);
      }
    }
  };

  const getStatusCounts = () => {
    return {
      planning: projects.filter(p => p.status === 'planning').length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your projects and epics</p>
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
          <Button onClick={handleCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Bulk Epic Entry Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bulk Add Epics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="project-select">Select Project</Label>
              <Select value={bulkEpicProjectId} onValueChange={setBulkEpicProjectId}>
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {activeProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleBulkAddEpics}
              disabled={!bulkEpicProjectId}
            >
              <ListPlus className="h-4 w-4 mr-2" />
              Bulk Add Epics
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Quickly add multiple epics to a project with story points and target dates
          </p>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.planning}</div>
            <Badge variant="secondary" className="mt-1">In Planning</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.active}</div>
            <Badge className="mt-1 bg-green-500">Active</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
            <Badge variant="outline" className="mt-1">Completed</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.cancelled}</div>
            <Badge variant="destructive" className="mt-1">Cancelled</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {viewMode === 'table' ? (
        <ProjectTable 
          projects={projects} 
          onEditProject={handleEditProject}
          onViewProject={handleViewProject}
        />
      ) : (
        <ProjectCards 
          projects={projects} 
          onEditProject={handleEditProject}
          onViewProject={handleViewProject}
        />
      )}

      {/* Dialogs */}
      <ProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        project={null}
      />
      <ProjectDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        project={selectedProject}
      />
      <ProjectDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        project={selectedProject}
      />
      <BulkEpicEntryDialog
        isOpen={isBulkEpicDialogOpen}
        onClose={() => setIsBulkEpicDialogOpen(false)}
        projectId={selectedProject?.id || ''}
        projectName={selectedProject?.name || ''}
      />
    </div>
  );
};

export default Projects;
