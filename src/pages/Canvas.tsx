import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, FolderOpen, Target, Zap, Eye, EyeOff, Building } from 'lucide-react';

type ViewType = 'all' | 'teams-projects' | 'projects-epics' | 'team-allocations';

const Canvas = () => {
  const { teams, projects, epics, allocations, divisions, runWorkCategories } = useApp();
  const [viewType, setViewType] = useState<ViewType>('all');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Generate nodes and edges based on view type
  const { initialNodes, initialEdges, stats } = useMemo(() => {
    let divisionsToShow = [...divisions];
    let teamsToShow = [...teams];
    let projectsToShow = [...projects];

    if (selectedDivision !== 'all') {
        divisionsToShow = divisionsToShow.filter(d => d.id === selectedDivision);
        teamsToShow = teamsToShow.filter(t => t.divisionId === selectedDivision);
    }

    if (selectedTeam !== 'all') {
        teamsToShow = teamsToShow.filter(t => t.id === selectedTeam);
        const team = teams.find(t => t.id === selectedTeam);
        if (team?.divisionId) {
            divisionsToShow = divisionsToShow.filter(d => d.id === team.divisionId);
        } else if (selectedDivision === 'all') {
            divisionsToShow = [];
        }
    }
    
    let epicsToShow;
    if (selectedProject !== 'all') {
        projectsToShow = projectsToShow.filter(p => p.id === selectedProject);
        epicsToShow = epics.filter(e => e.projectId === selectedProject);
        const teamsForProject = new Set(epicsToShow.map(e => e.assignedTeamId).filter(Boolean));
        teamsToShow = teamsToShow.filter(t => teamsForProject.has(t.id));
        
        const divisionsForTeams = new Set(teamsToShow.map(t => t.divisionId).filter(Boolean));
        divisionsToShow = divisionsToShow.filter(d => divisionsForTeams.has(d.id));
    } else {
        const teamsToRender = new Set(teamsToShow.map(t => t.id));
        epicsToShow = epics.filter(e => e.assignedTeamId && teamsToRender.has(e.assignedTeamId));
        const projectsForTeams = new Set(epicsToShow.map(e => e.projectId));
        projectsToShow = projects.filter(p => projectsForTeams.has(p.id));
    }
    
    const allocationsToShow = allocations.filter(a => new Set(teamsToShow.map(t => t.id)).has(a.teamId));

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;

    if (viewType === 'all' || viewType === 'teams-projects') {
      // Add division nodes
      divisionsToShow.forEach((division, index) => {
        nodes.push({
          id: `division-${division.id}`,
          type: 'default',
          position: { x: index * 300, y: 0 },
          data: { 
            label: (
              <div className="text-center">
                <div className="font-semibold text-blue-600">{division.name}</div>
                <div className="text-xs text-gray-500">Division</div>
              </div>
            )
          },
          style: { 
            background: '#dbeafe', 
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            width: 150,
            height: 60
          },
        });
      });

      // Add team nodes
      teamsToShow.forEach((team, index) => {
        const division = divisionsToShow.find(d => d.id === team.divisionId);
        const divisionIndex = divisionsToShow.findIndex(d => d.id === team.divisionId);
        
        nodes.push({
          id: `team-${team.id}`,
          type: 'default',
          position: { 
            x: divisionIndex >= 0 ? divisionIndex * 300 + (index % 3) * 100 : index * 200, 
            y: 120 
          },
          data: { 
            label: (
              <div className="text-center">
                <Users className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium">{team.name}</div>
                <div className="text-xs text-gray-500">{team.capacity}h/week</div>
              </div>
            )
          },
          style: { 
            background: '#dcfce7', 
            border: '2px solid #16a34a',
            borderRadius: '8px',
            width: 120,
            height: 80
          },
        });

        // Connect team to division
        if (team.divisionId) {
          edges.push({
            id: `division-team-${team.divisionId}-${team.id}`,
            source: `division-${team.divisionId}`,
            target: `team-${team.id}`,
            type: 'smoothstep',
            style: { stroke: '#3b82f6' },
          });
        }
      });

      // Add project nodes
      projectsToShow.forEach((project, index) => {
        nodes.push({
          id: `project-${project.id}`,
          type: 'default',
          position: { x: index * 180, y: 300 },
          data: { 
            label: (
              <div className="text-center">
                <FolderOpen className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium text-sm">{project.name}</div>
                <Badge 
                  variant={project.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {project.status}
                </Badge>
              </div>
            )
          },
          style: { 
            background: '#fef3c7', 
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            width: 140,
            height: 90
          },
        });
      });
    }

    if (viewType === 'all' || viewType === 'projects-epics') {
      // Add epic nodes
      epicsToShow.forEach((epic, index) => {
        const project = projectsToShow.find(p => p.id === epic.projectId);
        const projectIndex = projectsToShow.findIndex(p => p.id === epic.projectId);
        
        nodes.push({
          id: `epic-${epic.id}`,
          type: 'default',
          position: { 
            x: projectIndex >= 0 ? projectIndex * 180 + (index % 2) * 80 : index * 150, 
            y: 450 
          },
          data: { 
            label: (
              <div className="text-center">
                <Target className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium text-xs">{epic.name}</div>
                <div className="text-xs text-gray-500">{epic.estimatedEffort} pts</div>
                <Badge 
                  variant={epic.status === 'completed' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {epic.status}
                </Badge>
              </div>
            )
          },
          style: { 
            background: '#fce7f3', 
            border: '2px solid #ec4899',
            borderRadius: '8px',
            width: 110,
            height: 85
          },
        });

        // Connect epic to project
        if (epic.projectId) {
          edges.push({
            id: `project-epic-${epic.projectId}-${epic.id}`,
            source: `project-${epic.projectId}`,
            target: `epic-${epic.id}`,
            type: 'smoothstep',
            style: { stroke: '#f59e0b' },
          });
        }

        // Connect epic to assigned team
        if (epic.assignedTeamId) {
          edges.push({
            id: `team-epic-${epic.assignedTeamId}-${epic.id}`,
            source: `team-${epic.assignedTeamId}`,
            target: `epic-${epic.id}`,
            type: 'smoothstep',
            style: { stroke: '#16a34a', strokeDasharray: '5,5' },
          });
        }
      });
    }

    if (viewType === 'team-allocations') {
      // Add run work category nodes
      runWorkCategories.forEach((category, index) => {
        nodes.push({
          id: `category-${category.id}`,
          type: 'default',
          position: { x: index * 200, y: 300 },
          data: { 
            label: (
              <div className="text-center">
                <Zap className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium text-sm">{category.name}</div>
                <div className="text-xs text-gray-500">Run Work</div>
              </div>
            )
          },
          style: { 
            background: category.color || '#f3f4f6', 
            border: '2px solid #6b7280',
            borderRadius: '8px',
            width: 120,
            height: 70
          },
        });
      });

      // Show allocation connections
      allocationsToShow.forEach(allocation => {
        if (allocation.epicId) {
          const epicExists = nodes.some(n => n.id === `epic-${allocation.epicId}`);
          const teamExists = nodes.some(n => n.id === `team-${allocation.teamId}`);
          
          if (epicExists && teamExists) {
            edges.push({
              id: `allocation-epic-${allocation.id}`,
              source: `team-${allocation.teamId}`,
              target: `epic-${allocation.epicId}`,
              type: 'smoothstep',
              label: `${allocation.percentage}%`,
              style: { stroke: '#8b5cf6' },
            });
          }
        } else if (allocation.runWorkCategoryId) {
          const categoryExists = nodes.some(n => n.id === `category-${allocation.runWorkCategoryId}`);
          const teamExists = nodes.some(n => n.id === `team-${allocation.teamId}`);
          
          if (categoryExists && teamExists) {
            edges.push({
              id: `allocation-category-${allocation.id}`,
              source: `team-${allocation.teamId}`,
              target: `category-${allocation.runWorkCategoryId}`,
              type: 'smoothstep',
              label: `${allocation.percentage}%`,
              style: { stroke: '#6b7280' },
            });
          }
        }
      });
    }

    const finalStats = {
      teams: teamsToShow.length,
      projects: projectsToShow.length,
      epics: epicsToShow.length,
      allocations: allocationsToShow.length,
    };

    return { initialNodes: nodes, initialEdges: edges, stats: finalStats };
  }, [teams, projects, epics, allocations, divisions, runWorkCategories, viewType, selectedDivision, selectedTeam, selectedProject]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Update nodes and edges when data or view type changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const getStats = () => {
    return {
      teams: teams.length,
      projects: projects.length,
      epics: epics.length,
      allocations: allocations.length,
    };
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canvas View</h1>
          <p className="text-gray-600">Interactive visualization of team and project relationships</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={showMiniMap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMiniMap(!showMiniMap)}
          >
            {showMiniMap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            MiniMap
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">View:</label>
          <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Relationships</SelectItem>
              <SelectItem value="teams-projects">Teams & Projects</SelectItem>
              <SelectItem value="projects-epics">Projects & Epics</SelectItem>
              <SelectItem value="team-allocations">Team Allocations</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium flex items-center"><Building className="h-4 w-4 mr-1" />Division:</label>
          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by division"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium flex items-center"><Users className="h-4 w-4 mr-1" />Team:</label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by team"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium flex items-center"><FolderOpen className="h-4 w-4 mr-1" />Project:</label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by project"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FolderOpen className="h-4 w-4 mr-2" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Epics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.epics}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Allocations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.allocations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <div style={{ width: '100%', height: '600px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              style={{ backgroundColor: '#f8fafc' }}
            >
              <Controls />
              <Background color="#e2e8f0" gap={16} />
              {showMiniMap && (
                <MiniMap 
                  zoomable 
                  pannable 
                  style={{
                    height: 120,
                    width: 200,
                    backgroundColor: '#f1f5f9',
                  }}
                />
              )}
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 border-2 border-blue-500 rounded"></div>
              <span>Divisions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-200 border-2 border-green-500 rounded"></div>
              <span>Teams</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-500 rounded"></div>
              <span>Projects</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-pink-200 border-2 border-pink-500 rounded"></div>
              <span>Epics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-500 rounded"></div>
              <span>Run Work</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-green-500"></div>
              <span>Assignment</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-green-500"></div>
              <span>Epic Assignment</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-purple-500"></div>
              <span>Allocation</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Canvas;
