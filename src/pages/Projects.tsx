
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FolderOpen, Search, Grid, Target, DollarSign, Calendar, Users } from 'lucide-react';
import ProjectTable from '@/components/projects/ProjectTable';
import ProjectCards from '@/components/projects/ProjectCards';
import ProjectDialog from '@/components/projects/ProjectDialog';
import ProjectDetailsDialog from '@/components/projects/ProjectDetailsDialog';
import ProjectTeamFinderDialog from '@/components/scenarios/ProjectTeamFinderDialog';

const Projects = () => {
  const { projects, epics, allocations, cycles, isSetupComplete } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  if (!isSetupComplete) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Please complete the initial setup to manage projects.
          </p>
        </div>
      </div>
    );
  }

  const getProjectStats = () => {
    const now = new Date();
    const activeCycle = cycles.find(c => new Date(c.startDate) <= now && new Date(c.endDate) >= now);
    
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      planning: projects.filter(p => p.status === 'planning').length,
      completed: projects.filter(p => p.status === 'completed').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      allocatedProjects: activeCycle 
        ? new Set(allocations.filter(a => a.cycleId === activeCycle.id && a.epicId).map(a => {
            const epic = epics.find(e => e.id === a.epicId);
            return epic?.projectId;
          })).size
        : 0
    };
  };

  const handleEditProject = (projectId: string) => {
    setSelectedProject(projectId);
    setIsCreateDialogOpen(true);
  };

  const handleViewProject = (projectId: string) => {
    setSelectedProject(projectId);
    setIsViewDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setSelectedProject(null);
  };

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedProject(null);
  };

  const stats = getProjectStats();
  const currentProject = selectedProject ? projects.find(p => p.id === selectedProject) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your project portfolio and team allocations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link to="/scenario-analysis">
              <Search className="h-4 w-4 mr-2" />
              Scenario Analysis
            </Link>
          </Button>
          <ProjectTeamFinderDialog>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Find Teams
            </Button>
          </ProjectTeamFinderDialog>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <Badge variant="outline" className="mt-1">All Status</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <Badge className="mt-1 bg-green-500">In Progress</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalBudget / 1000000).toFixed(1)}M
            </div>
            <Badge variant="secondary" className="mt-1">
              <DollarSign className="h-3 w-3 mr-1" />
              Budget
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.allocatedProjects}</div>
            <Badge variant="secondary" className="mt-1">
              <Users className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="analysis">Team Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
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
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Project Team Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Analyze team availability and skill matches for your projects
              </p>
              <ProjectTeamFinderDialog>
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Start Team Analysis
                </Button>
              </ProjectTeamFinderDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Project Dialog */}
      <ProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        project={currentProject}
      />

      {/* Project Details Dialog */}
      <ProjectDetailsDialog
        isOpen={isViewDialogOpen}
        onClose={handleCloseViewDialog}
        project={currentProject}
      />
    </div>
  );
};

export default Projects;
