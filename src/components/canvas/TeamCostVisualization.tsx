import React, { useMemo, useState, Suspense, lazy } from 'react';

// Lazy load ReactFlow to reduce initial bundle size
const ReactFlowComponent = lazy(() =>
  import('@xyflow/react').then(module => ({
    default: ({ children, ...props }) => {
      const { ReactFlow, Controls, Background, useNodesState, useEdgesState } =
        module;
      return React.createElement(ReactFlow, props, children);
    },
  }))
);

// Type imports can still be synchronous
import type { Node, Edge, Position } from '@xyflow/react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { calculatePersonCost } from '@/utils/financialCalculations';
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Building,
  Target,
  Layers,
  Filter,
} from 'lucide-react';

interface TeamNode extends Node {
  data: {
    teamName: string;
    divisionName: string;
    memberCount: number;
    permanentCount: number;
    contractorCount: number;
    totalCost: number;
    avgSalary: number;
    riskScore: number;
    utilization: number;
    costPerHour: number;
    projects: string[];
    teamId: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CostVisualizationProps {}

type ViewMode =
  | 'hierarchy'
  | 'cost-clusters'
  | 'risk-analysis'
  | 'efficiency-matrix';
type NodeSizing = 'team-size' | 'cost' | 'risk' | 'utilization';
type ColorCoding =
  | 'division'
  | 'cost-efficiency'
  | 'contractor-ratio'
  | 'risk-level';

const TeamCostVisualization: React.FC<CostVisualizationProps> = () => {
  const { teams, people, divisions, roles, projects, allocations } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [nodeSizing, setNodeSizing] = useState<NodeSizing>('team-size');
  const [colorCoding, setColorCoding] = useState<ColorCoding>('division');
  const [showCostLabels, setShowCostLabels] = useState(true);
  const [minTeamSize, setMinTeamSize] = useState([1]);
  const [maxCostFilter, setMaxCostFilter] = useState([10000000]);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');

  const {
    nodes: initialNodes,
    edges: initialEdges,
    stats,
  } = useMemo(() => {
    // Calculate team metrics
    const teamMetrics = teams.map(team => {
      const teamMembers = people.filter(
        p => p.teamId === team.id && p.isActive
      );
      const permanentMembers = teamMembers.filter(
        p => p.employmentType === 'permanent'
      );
      const contractorMembers = teamMembers.filter(
        p => p.employmentType === 'contractor'
      );

      // Cost calculations
      let totalCost = 0;
      let totalSalary = 0;
      let salaryCount = 0;

      teamMembers.forEach(person => {
        const role = roles.find(r => r.id === person.roleId);
        if (role) {
          const costCalc = calculatePersonCost(person, role);
          totalCost += costCalc.costPerYear;
          if (person.annualSalary) {
            totalSalary += person.annualSalary;
            salaryCount++;
          }
        }
      });

      const avgSalary = salaryCount > 0 ? totalSalary / salaryCount : 0;
      const contractorRatio = contractorMembers.length / teamMembers.length;

      // Risk calculation
      let riskScore = 0;
      if (teamMembers.length < 5) riskScore += 30;
      if (teamMembers.length > 12) riskScore += 20;
      if (contractorRatio > 0.5) riskScore += 35;
      if (contractorRatio > 0.3) riskScore += 15;

      // Get division
      const division = divisions.find(d => d.id === team.divisionId);

      // Get team projects
      const teamAllocations = allocations.filter(a => a.teamId === team.id);
      const teamProjectIds = [
        ...new Set(teamAllocations.map(a => a.epicId).filter(Boolean)),
      ];
      const teamProjects = projects
        .filter(p =>
          teamProjectIds.some(epicId => p.milestones.some(m => m.id === epicId))
        )
        .map(p => p.name);

      return {
        teamId: team.id,
        teamName: team.name,
        divisionName: division?.name || 'No Division',
        divisionId: team.divisionId,
        memberCount: teamMembers.length,
        permanentCount: permanentMembers.length,
        contractorCount: contractorMembers.length,
        totalCost,
        avgSalary,
        riskScore: Math.min(riskScore, 100),
        utilization: 85, // Mock data - would calculate from actual allocations
        costPerHour: totalCost / (260 * 8),
        contractorRatio,
        projects: teamProjects,
      };
    });

    // Filter teams based on criteria
    const filteredTeams = teamMetrics.filter(team => {
      if (selectedDivision !== 'all' && team.divisionName !== selectedDivision)
        return false;
      if (team.memberCount < minTeamSize[0]) return false;
      if (team.totalCost > maxCostFilter[0]) return false;
      return true;
    });

    // Generate nodes and edges based on view mode
    const nodes: TeamNode[] = [];
    const edges: Edge[] = [];

    // Color mapping functions
    const getNodeColor = (team: TeamNode['data']): string => {
      switch (colorCoding) {
        case 'division': {
          const divisionColors = [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#06b6d4',
          ];
          const divisionIndex = divisions.findIndex(
            d => d.name === team.divisionName
          );
          return divisionColors[divisionIndex % divisionColors.length];
        }
        case 'cost-efficiency': {
          const costPerPerson = team.totalCost / team.memberCount;
          if (costPerPerson > 150000) return '#ef4444'; // High cost
          if (costPerPerson > 120000) return '#f59e0b'; // Medium cost
          return '#10b981'; // Low cost
        }
        case 'contractor-ratio': {
          if (team.contractorRatio > 0.5) return '#ef4444'; // High contractor ratio
          if (team.contractorRatio > 0.3) return '#f59e0b'; // Medium contractor ratio
          return '#10b981'; // Low contractor ratio
        }
        case 'risk-level': {
          if (team.riskScore > 60) return '#ef4444'; // High risk
          if (team.riskScore > 30) return '#f59e0b'; // Medium risk
          return '#10b981'; // Low risk
        }
        default:
          return '#3b82f6';
      }
    };

    const getNodeSize = (team: TeamNode['data']): number => {
      switch (nodeSizing) {
        case 'team-size':
          return Math.max(80, Math.min(200, team.memberCount * 15));
        case 'cost':
          return Math.max(80, Math.min(200, (team.totalCost / 2000000) * 150));
        case 'risk':
          return Math.max(80, Math.min(200, team.riskScore * 2));
        case 'utilization':
          return Math.max(80, Math.min(200, team.utilization * 2));
        default:
          return 120;
      }
    };

    switch (viewMode) {
      case 'hierarchy': {
        // Hierarchical layout by division
        const divisionGroups = new Map<string, any[]>(); // eslint-disable-line @typescript-eslint/no-explicit-any
        filteredTeams.forEach(team => {
          const divisionName = team.divisionName;
          if (!divisionGroups.has(divisionName)) {
            divisionGroups.set(divisionName, []);
          }
          divisionGroups.get(divisionName)!.push(team);
        });

        let yOffset = 0;
        divisionGroups.forEach((teams, divisionName) => {
          // Division header node
          nodes.push({
            id: `division-${divisionName}`,
            type: 'default',
            position: { x: 0, y: yOffset },
            data: {
              label: divisionName,
              teamName: divisionName,
              divisionName,
              memberCount: teams.reduce((sum, t) => sum + t.memberCount, 0),
              permanentCount: teams.reduce(
                (sum, t) => sum + t.permanentCount,
                0
              ),
              contractorCount: teams.reduce(
                (sum, t) => sum + t.contractorCount,
                0
              ),
              totalCost: teams.reduce((sum, t) => sum + t.totalCost, 0),
              avgSalary:
                teams.reduce((sum, t) => sum + t.avgSalary, 0) / teams.length,
              riskScore:
                teams.reduce((sum, t) => sum + t.riskScore, 0) / teams.length,
              utilization:
                teams.reduce((sum, t) => sum + t.utilization, 0) / teams.length,
              costPerHour: 0,
              projects: [],
              teamId: `division-${divisionName}`,
            },
            style: {
              background: '#f3f4f6',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              width: '200px',
              height: '60px',
            },
          } as TeamNode);

          // Team nodes
          teams.forEach((team, index) => {
            const nodeSize = getNodeSize(team);
            nodes.push({
              id: team.teamId,
              type: 'default',
              position: {
                x: 250 + (index % 4) * 220,
                y: yOffset + Math.floor(index / 4) * 150,
              },
              data: {
                ...team,
                label: showCostLabels
                  ? `${team.teamName}\n$${(team.totalCost / 1000).toFixed(0)}K`
                  : team.teamName,
              },
              style: {
                background: getNodeColor(team),
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                width: `${nodeSize}px`,
                height: `${nodeSize}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
              },
              sourcePosition: Position.Right,
              targetPosition: Position.Left,
            } as TeamNode);

            // Edge from division to team
            edges.push({
              id: `edge-${divisionName}-${team.teamId}`,
              source: `division-${divisionName}`,
              target: team.teamId,
              type: 'smoothstep',
              style: { stroke: '#9ca3af', strokeWidth: 2 },
            });
          });

          yOffset += Math.ceil(teams.length / 4) * 150 + 100;
        });
        break;
      }

      case 'cost-clusters': {
        // Cluster teams by cost ranges
        const costRanges = [
          { min: 0, max: 500000, label: 'Low Cost (<$500K)', x: 100, y: 100 },
          {
            min: 500000,
            max: 1500000,
            label: 'Medium Cost ($500K-$1.5M)',
            x: 400,
            y: 100,
          },
          {
            min: 1500000,
            max: 5000000,
            label: 'High Cost ($1.5M-$5M)',
            x: 700,
            y: 100,
          },
          {
            min: 5000000,
            max: Infinity,
            label: 'Very High Cost (>$5M)',
            x: 1000,
            y: 100,
          },
        ];

        costRanges.forEach(range => {
          const teamsInRange = filteredTeams.filter(
            team => team.totalCost >= range.min && team.totalCost < range.max
          );

          if (teamsInRange.length > 0) {
            // Cluster header
            nodes.push({
              id: `cluster-${range.label}`,
              type: 'default',
              position: { x: range.x, y: range.y },
              data: {
                label: `${range.label}\n${teamsInRange.length} teams`,
                teamName: range.label,
                divisionName: '',
                memberCount: teamsInRange.reduce(
                  (sum, t) => sum + t.memberCount,
                  0
                ),
                permanentCount: 0,
                contractorCount: 0,
                totalCost: teamsInRange.reduce(
                  (sum, t) => sum + t.totalCost,
                  0
                ),
                avgSalary: 0,
                riskScore: 0,
                utilization: 0,
                costPerHour: 0,
                projects: [],
                teamId: `cluster-${range.label}`,
              },
              style: {
                background: '#f9fafb',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                width: '180px',
                height: '80px',
              },
            } as TeamNode);

            // Teams in cluster
            teamsInRange.forEach((team, index) => {
              const nodeSize = getNodeSize(team);
              nodes.push({
                id: team.teamId,
                type: 'default',
                position: {
                  x: range.x + (index % 3) * 100 - 100,
                  y: range.y + 120 + Math.floor(index / 3) * 100,
                },
                data: {
                  ...team,
                  label: showCostLabels
                    ? `${team.teamName}\n$${(team.totalCost / 1000).toFixed(0)}K`
                    : team.teamName,
                },
                style: {
                  background: getNodeColor(team),
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  width: `${nodeSize}px`,
                  height: `${nodeSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                },
              } as TeamNode);

              edges.push({
                id: `edge-cluster-${team.teamId}`,
                source: `cluster-${range.label}`,
                target: team.teamId,
                type: 'straight',
                style: { stroke: '#d1d5db', strokeWidth: 1 },
              });
            });
          }
        });
        break;
      }

      case 'risk-analysis':
        // Position teams based on risk vs cost
        filteredTeams.forEach(team => {
          const nodeSize = getNodeSize(team);
          nodes.push({
            id: team.teamId,
            type: 'default',
            position: {
              x: Math.max(50, Math.min(950, team.riskScore * 10)),
              y: Math.max(
                50,
                Math.min(600, (team.totalCost / 10000000) * 500 + 100)
              ),
            },
            data: {
              ...team,
              label: showCostLabels
                ? `${team.teamName}\nRisk: ${team.riskScore}`
                : team.teamName,
            },
            style: {
              background: getNodeColor(team),
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              width: `${nodeSize}px`,
              height: `${nodeSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
            },
          } as TeamNode);
        });
        break;

      case 'efficiency-matrix':
        // Position teams based on cost efficiency vs utilization
        filteredTeams.forEach(team => {
          const costPerPerson = team.totalCost / team.memberCount;
          const nodeSize = getNodeSize(team);
          nodes.push({
            id: team.teamId,
            type: 'default',
            position: {
              x: Math.max(50, Math.min(950, team.utilization * 10)),
              y: Math.max(
                50,
                Math.min(600, 600 - (costPerPerson / 200000) * 500)
              ),
            },
            data: {
              ...team,
              label: showCostLabels
                ? `${team.teamName}\n${team.utilization}% util`
                : team.teamName,
            },
            style: {
              background: getNodeColor(team),
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              width: `${nodeSize}px`,
              height: `${nodeSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
            },
          } as TeamNode);
        });
        break;
    }

    // Calculate stats
    const stats = {
      totalTeams: filteredTeams.length,
      totalCost: filteredTeams.reduce((sum, team) => sum + team.totalCost, 0),
      totalPeople: filteredTeams.reduce(
        (sum, team) => sum + team.memberCount,
        0
      ),
      avgRisk:
        filteredTeams.reduce((sum, team) => sum + team.riskScore, 0) /
        filteredTeams.length,
    };

    return { nodes, edges, stats };
  }, [
    teams,
    people,
    divisions,
    roles,
    viewMode,
    nodeSizing,
    colorCoding,
    showCostLabels,
    minTeamSize,
    maxCostFilter,
    selectedDivision,
    allocations,
    projects,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="h-5 w-5 mr-2" />
            Team Cost Visualization Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                View Mode
              </label>
              <Select
                value={viewMode}
                onValueChange={value => setViewMode(value as ViewMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hierarchy">Division Hierarchy</SelectItem>
                  <SelectItem value="cost-clusters">Cost Clusters</SelectItem>
                  <SelectItem value="risk-analysis">Risk Analysis</SelectItem>
                  <SelectItem value="efficiency-matrix">
                    Efficiency Matrix
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Node Sizing
              </label>
              <Select
                value={nodeSizing}
                onValueChange={value => setNodeSizing(value as NodeSizing)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team-size">Team Size</SelectItem>
                  <SelectItem value="cost">Total Cost</SelectItem>
                  <SelectItem value="risk">Risk Score</SelectItem>
                  <SelectItem value="utilization">Utilization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Color Coding
              </label>
              <Select
                value={colorCoding}
                onValueChange={value => setColorCoding(value as ColorCoding)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="division">Division</SelectItem>
                  <SelectItem value="cost-efficiency">
                    Cost Efficiency
                  </SelectItem>
                  <SelectItem value="contractor-ratio">
                    Contractor Ratio
                  </SelectItem>
                  <SelectItem value="risk-level">Risk Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Division Filter
              </label>
              <Select
                value={selectedDivision}
                onValueChange={setSelectedDivision}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions.map(division => (
                    <SelectItem key={division.id} value={division.name}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Minimum Team Size: {minTeamSize[0]}
              </label>
              <Slider
                value={minTeamSize}
                onValueChange={setMinTeamSize}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Maximum Cost: ${(maxCostFilter[0] / 1000000).toFixed(1)}M
              </label>
              <Slider
                value={maxCostFilter}
                onValueChange={setMaxCostFilter}
                max={10000000}
                min={100000}
                step={100000}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={showCostLabels}
                onCheckedChange={setShowCostLabels}
              />
              <label className="text-sm font-medium">Show Cost Labels</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible Teams</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPeople}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalCost / 1000000).toFixed(1)}M
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRisk.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization */}
      <Card>
        <CardContent className="p-0">
          <div style={{ width: '100%', height: '700px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              style={{ backgroundColor: '#f8fafc' }}
            >
              <Controls />
              <Background color="#e2e8f0" gap={16} />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Visualization Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium mb-2">Node Size ({nodeSizing})</h4>
              <div className="space-y-1 text-sm">
                <div>Small: Low value</div>
                <div>Medium: Medium value</div>
                <div>Large: High value</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Color Coding ({colorCoding})</h4>
              <div className="space-y-1 text-sm">
                {colorCoding === 'division' && (
                  <div>Each color = Different division</div>
                )}
                {colorCoding === 'cost-efficiency' && (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 mr-2"></div>Low cost
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 mr-2"></div>Medium
                      cost
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 mr-2"></div>High cost
                    </div>
                  </>
                )}
                {colorCoding === 'contractor-ratio' && (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 mr-2"></div>Low
                      contractor ratio
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 mr-2"></div>Medium
                      contractor ratio
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 mr-2"></div>High
                      contractor ratio
                    </div>
                  </>
                )}
                {colorCoding === 'risk-level' && (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 mr-2"></div>Low risk
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 mr-2"></div>Medium
                      risk
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 mr-2"></div>High risk
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">View Modes</h4>
              <div className="space-y-1 text-sm">
                <div>Hierarchy: Division grouping</div>
                <div>Clusters: Cost-based grouping</div>
                <div>Risk: Risk vs Cost scatter</div>
                <div>Efficiency: Utilization vs Cost</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Interactions</h4>
              <div className="space-y-1 text-sm">
                <div>Drag nodes to reposition</div>
                <div>Zoom and pan canvas</div>
                <div>Filter by division/size/cost</div>
                <div>Toggle cost labels</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamCostVisualization;
