import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Users,
  Clock,
  Zap,
  TrendingDown,
  TrendingUp,
  Target,
  Activity,
  Layers,
  Shield,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import {
  Team,
  Project,
  Epic,
  Allocation,
  Cycle,
  Person,
  PersonSkill,
  Skill,
} from '@/types';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

// Types for bottleneck analysis
interface BottleneckType {
  id: string;
  type: 'capacity' | 'skills' | 'dependencies' | 'coordination' | 'knowledge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  affectedTeams: string[];
  affectedProjects: string[];
  recommendations: string[];
  timeToResolve: string;
  costToResolve: string;
}

interface TeamBottleneckAnalysis {
  teamId: string;
  teamName: string;
  bottlenecks: BottleneckType[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  capacityUtilization: number;
  skillCoverage: number;
  coordinationIndex: number;
  riskScore: number;
}

interface BottleneckDetectionProps {
  teams: Team[];
  projects: Project[];
  epics: Epic[];
  allocations: Allocation[];
  people: Person[];
  personSkills: PersonSkill[];
  skills: Skill[];
  cycles: Cycle[];
  selectedCycleId: string;
}

const BottleneckDetection: React.FC<BottleneckDetectionProps> = ({
  teams,
  projects,
  epics,
  allocations,
  people,
  personSkills,
  skills,
  cycles,
  selectedCycleId,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [bottleneckTypeFilter, setBottleneckTypeFilter] =
    useState<string>('all');

  // Analyze bottlenecks for each team
  const teamBottleneckAnalysis = useMemo(() => {
    const relevantAllocations = allocations.filter(
      a => a.cycleId === selectedCycleId
    );
    const currentCycle = cycles.find(c => c.id === selectedCycleId);

    if (!currentCycle) return [];

    return teams.map(team => {
      const teamMembers = people.filter(
        p => p.teamId === team.id && p.isActive
      );
      const teamAllocations = relevantAllocations.filter(
        a => a.teamId === team.id
      );

      // Calculate capacity utilization
      const totalAllocatedPercentage = teamAllocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );
      const capacityUtilization =
        totalAllocatedPercentage / teamAllocations.length || 0;

      // Analyze skill coverage
      const teamSkills = personSkills.filter(ps =>
        teamMembers.some(member => member.id === ps.personId)
      );
      const requiredSkills = new Set();
      teamAllocations.forEach(allocation => {
        if (allocation.epicId) {
          const epic = epics.find(e => e.id === allocation.epicId);
          if (epic) {
            const project = projects.find(p => p.id === epic.projectId);
            // Mock adding required skills based on project
            requiredSkills.add('javascript');
            requiredSkills.add('react');
          }
        }
      });

      const availableSkills = new Set(teamSkills.map(ts => ts.skillId));
      const skillCoverage =
        requiredSkills.size > 0
          ? (Array.from(requiredSkills).filter(skill =>
              availableSkills.has(skill as string)
            ).length /
              requiredSkills.size) *
            100
          : 100;

      // Detect specific bottlenecks
      const bottlenecks: BottleneckType[] = [];

      // 1. Capacity Bottlenecks
      if (capacityUtilization > 100) {
        bottlenecks.push({
          id: `capacity-${team.id}`,
          type: 'capacity',
          severity:
            capacityUtilization > 150
              ? 'critical'
              : capacityUtilization > 120
                ? 'high'
                : 'medium',
          title: 'Over-allocation Detected',
          description: `Team is allocated ${Math.round(capacityUtilization)}% of capacity`,
          impact: `Risk of burnout, missed deadlines, and quality issues`,
          affectedTeams: [team.id],
          affectedProjects: Array.from(
            new Set(
              teamAllocations
                .map(a => {
                  const epic = epics.find(e => e.id === a.epicId);
                  return epic?.projectId;
                })
                .filter(Boolean)
            )
          ) as string[],
          recommendations: [
            'Redistribute work to other teams',
            'Extend iteration timelines',
            'Reduce scope of current work',
            'Add temporary resources',
          ],
          timeToResolve: '1-2 iterations',
          costToResolve: 'Medium',
        });
      }

      // 2. Skills Bottlenecks
      if (skillCoverage < 70) {
        bottlenecks.push({
          id: `skills-${team.id}`,
          type: 'skills',
          severity:
            skillCoverage < 40
              ? 'critical'
              : skillCoverage < 60
                ? 'high'
                : 'medium',
          title: 'Skill Gap Detected',
          description: `Only ${Math.round(skillCoverage)}% of required skills are covered`,
          impact: 'Slower development, increased risk of technical debt',
          affectedTeams: [team.id],
          affectedProjects: Array.from(
            new Set(
              teamAllocations
                .map(a => {
                  const epic = epics.find(e => e.id === a.epicId);
                  return epic?.projectId;
                })
                .filter(Boolean)
            )
          ) as string[],
          recommendations: [
            'Provide training in missing skills',
            'Hire specialists',
            'Partner with other teams',
            'Adjust project scope to match skills',
          ],
          timeToResolve: '2-3 months',
          costToResolve: 'High',
        });
      }

      // 3. Knowledge Bottlenecks (single point of failure)
      if (teamMembers.length === 1) {
        bottlenecks.push({
          id: `knowledge-${team.id}`,
          type: 'knowledge',
          severity: 'high',
          title: 'Single Point of Failure',
          description:
            'Team has only one member - knowledge concentration risk',
          impact: 'High risk if member becomes unavailable',
          affectedTeams: [team.id],
          affectedProjects: Array.from(
            new Set(
              teamAllocations
                .map(a => {
                  const epic = epics.find(e => e.id === a.epicId);
                  return epic?.projectId;
                })
                .filter(Boolean)
            )
          ) as string[],
          recommendations: [
            'Add team members',
            'Document knowledge',
            'Cross-train with other teams',
            'Create backup plans',
          ],
          timeToResolve: '1-2 months',
          costToResolve: 'High',
        });
      }

      // 4. Coordination Bottlenecks (too many projects)
      const projectCount = new Set(
        teamAllocations
          .map(a => {
            const epic = epics.find(e => e.id === a.epicId);
            return epic?.projectId;
          })
          .filter(Boolean)
      ).size;

      if (projectCount > 3) {
        bottlenecks.push({
          id: `coordination-${team.id}`,
          type: 'coordination',
          severity: projectCount > 5 ? 'high' : 'medium',
          title: 'Excessive Context Switching',
          description: `Team is working on ${projectCount} different projects`,
          impact: 'Reduced efficiency due to context switching',
          affectedTeams: [team.id],
          affectedProjects: Array.from(
            new Set(
              teamAllocations
                .map(a => {
                  const epic = epics.find(e => e.id === a.epicId);
                  return epic?.projectId;
                })
                .filter(Boolean)
            )
          ) as string[],
          recommendations: [
            'Reduce number of concurrent projects',
            'Group related work together',
            'Assign dedicated project teams',
            'Improve handoff processes',
          ],
          timeToResolve: '1 iteration',
          costToResolve: 'Low',
        });
      }

      // Calculate overall risk score
      const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
      const riskScore = bottlenecks.reduce(
        (sum, b) => sum + severityWeights[b.severity],
        0
      );

      let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (riskScore >= 8) overallRisk = 'critical';
      else if (riskScore >= 5) overallRisk = 'high';
      else if (riskScore >= 2) overallRisk = 'medium';

      return {
        teamId: team.id,
        teamName: team.name,
        bottlenecks,
        overallRisk,
        capacityUtilization,
        skillCoverage,
        coordinationIndex: projectCount,
        riskScore,
      };
    });
  }, [
    teams,
    people,
    allocations,
    epics,
    projects,
    selectedCycleId,
    cycles,
    personSkills,
  ]);

  // Filter analysis based on selections
  const filteredAnalysis = useMemo(() => {
    let filtered = teamBottleneckAnalysis;

    if (selectedTeam !== 'all') {
      filtered = filtered.filter(analysis => analysis.teamId === selectedTeam);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(analysis =>
        analysis.bottlenecks.some(b => b.severity === severityFilter)
      );
    }

    if (bottleneckTypeFilter !== 'all') {
      filtered = filtered.filter(analysis =>
        analysis.bottlenecks.some(b => b.type === bottleneckTypeFilter)
      );
    }

    return filtered;
  }, [
    teamBottleneckAnalysis,
    selectedTeam,
    severityFilter,
    bottleneckTypeFilter,
  ]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const allBottlenecks = teamBottleneckAnalysis.flatMap(
      analysis => analysis.bottlenecks
    );

    return {
      totalBottlenecks: allBottlenecks.length,
      criticalBottlenecks: allBottlenecks.filter(b => b.severity === 'critical')
        .length,
      highRiskTeams: teamBottleneckAnalysis.filter(
        a => a.overallRisk === 'high' || a.overallRisk === 'critical'
      ).length,
      averageCapacityUtilization:
        teamBottleneckAnalysis.reduce(
          (sum, a) => sum + a.capacityUtilization,
          0
        ) / teamBottleneckAnalysis.length,
      averageSkillCoverage:
        teamBottleneckAnalysis.reduce((sum, a) => sum + a.skillCoverage, 0) /
        teamBottleneckAnalysis.length,
    };
  }, [teamBottleneckAnalysis]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBottleneckTypeIcon = (type: string) => {
    switch (type) {
      case 'capacity':
        return <Users className="h-4 w-4" />;
      case 'skills':
        return <Target className="h-4 w-4" />;
      case 'dependencies':
        return <Layers className="h-4 w-4" />;
      case 'coordination':
        return <Activity className="h-4 w-4" />;
      case 'knowledge':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (!selectedCycleId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Please select a cycle to analyze bottlenecks.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Resource Bottleneck Detection
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {summaryStats.totalBottlenecks}
              </div>
              <div className="text-sm text-gray-600">Total Bottlenecks</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">
                {summaryStats.criticalBottlenecks}
              </div>
              <div className="text-sm text-gray-600">Critical Issues</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {summaryStats.highRiskTeams}
              </div>
              <div className="text-sm text-gray-600">High Risk Teams</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(summaryStats.averageCapacityUtilization)}%
              </div>
              <div className="text-sm text-gray-600">Avg Capacity</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(summaryStats.averageSkillCoverage)}%
              </div>
              <div className="text-sm text-gray-600">Avg Skill Coverage</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Team:</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Severity:</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Type:</label>
              <Select
                value={bottleneckTypeFilter}
                onValueChange={setBottleneckTypeFilter}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                  <SelectItem value="coordination">Coordination</SelectItem>
                  <SelectItem value="knowledge">Knowledge</SelectItem>
                  <SelectItem value="dependencies">Dependencies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottleneck Analysis */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Team Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Critical Bottlenecks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  Critical Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredAnalysis
                  .flatMap(analysis =>
                    analysis.bottlenecks.filter(b => b.severity === 'critical')
                  )
                  .slice(0, 5)
                  .map(bottleneck => (
                    <div key={bottleneck.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getBottleneckTypeIcon(bottleneck.type)}
                          <span className="font-medium text-sm">
                            {bottleneck.title}
                          </span>
                        </div>
                        <Badge
                          className={getSeverityColor(bottleneck.severity)}
                        >
                          {bottleneck.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {bottleneck.description}
                      </div>
                      <div className="text-xs text-red-600">
                        Impact: {bottleneck.impact}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Team Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                  Team Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredAnalysis.map(analysis => (
                  <div
                    key={analysis.teamId}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {analysis.teamName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {analysis.bottlenecks.length} bottleneck(s) detected
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(analysis.overallRisk)}>
                        {analysis.overallRisk}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        Risk: {analysis.riskScore}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detailed Team Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredAnalysis.map(analysis => (
                  <div key={analysis.teamId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{analysis.teamName}</h3>
                        <div className="text-sm text-gray-600">
                          Risk Score: {analysis.riskScore} | Capacity:{' '}
                          {Math.round(analysis.capacityUtilization)}% | Skills:{' '}
                          {Math.round(analysis.skillCoverage)}%
                        </div>
                      </div>
                      <Badge className={getSeverityColor(analysis.overallRisk)}>
                        {analysis.overallRisk} risk
                      </Badge>
                    </div>

                    {/* Team Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Capacity Utilization
                        </div>
                        <Progress
                          value={Math.min(analysis.capacityUtilization, 150)}
                          className="h-2"
                        />
                        <div className="text-xs mt-1">
                          {Math.round(analysis.capacityUtilization)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Skill Coverage
                        </div>
                        <Progress
                          value={analysis.skillCoverage}
                          className="h-2"
                        />
                        <div className="text-xs mt-1">
                          {Math.round(analysis.skillCoverage)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Project Count
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="h-3 w-3" />
                          <span className="text-sm">
                            {analysis.coordinationIndex}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottlenecks */}
                    {analysis.bottlenecks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">
                          Detected Bottlenecks
                        </h4>
                        <div className="space-y-2">
                          {analysis.bottlenecks.map(bottleneck => (
                            <div
                              key={bottleneck.id}
                              className="bg-gray-50 rounded p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {getSeverityIcon(bottleneck.severity)}
                                  <span className="font-medium text-sm">
                                    {bottleneck.title}
                                  </span>
                                </div>
                                <Badge
                                  className={getSeverityColor(
                                    bottleneck.severity
                                  )}
                                >
                                  {bottleneck.severity}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-700 mb-2">
                                {bottleneck.description}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                <strong>Impact:</strong> {bottleneck.impact}
                              </div>
                              <div className="text-xs text-gray-600">
                                <strong>Time to Resolve:</strong>{' '}
                                {bottleneck.timeToResolve} |
                                <strong> Cost:</strong>{' '}
                                {bottleneck.costToResolve}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Bottleneck Resolution Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAnalysis
                  .flatMap(analysis => analysis.bottlenecks)
                  .sort((a, b) => {
                    const severityOrder = {
                      critical: 4,
                      high: 3,
                      medium: 2,
                      low: 1,
                    };
                    return (
                      severityOrder[b.severity] - severityOrder[a.severity]
                    );
                  })
                  .slice(0, 10)
                  .map(bottleneck => (
                    <div key={bottleneck.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getBottleneckTypeIcon(bottleneck.type)}
                          <span className="font-medium">
                            {bottleneck.title}
                          </span>
                        </div>
                        <Badge
                          className={getSeverityColor(bottleneck.severity)}
                        >
                          {bottleneck.severity}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-700 mb-3">
                        {bottleneck.description}
                      </div>

                      <div className="mb-3">
                        <h4 className="font-medium text-sm mb-2">
                          Recommended Actions:
                        </h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {bottleneck.recommendations.map((rec, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Time to Resolve: {bottleneck.timeToResolve}</span>
                        <span>Cost Impact: {bottleneck.costToResolve}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BottleneckDetection;
