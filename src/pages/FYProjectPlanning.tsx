import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCurrentFinancialYear } from '@/utils/dateUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar,
  TrendingUp,
  Search,
  Target,
  Zap,
  Brain,
  Clock,
  DollarSign,
  X,
  Info,
} from 'lucide-react';
import { Project, Team, Cycle, Skill, Solution } from '@/types';
import { getProjectRequiredSkills } from '@/utils/skillBasedPlanning';
import { getDivisionName } from '@/utils/teamUtils';
import ProjectTeamMatchingView from '@/components/planning/ProjectTeamMatchingView';
import {
  AllocationClipboardProvider,
  ClipboardStatus,
} from '@/components/planning/AllocationClipboard';

interface FYProjectPlanningData {
  fyProjects: Project[];
  teamCapacityAnalysis: TeamCapacityAnalysis[];
  skillBottlenecks: SkillBottleneck[];
  projectRiskAssessment: ProjectRisk[];
  capacityGaps: CapacityGap[];
  recommendations: Recommendation[];
}

interface TeamCapacityAnalysis {
  team: Team;
  division: string;
  currentCapacity: number; // hours per quarter
  utilization: number; // percentage
  availableCapacity: number; // hours available
  skills: string[];
  currentProjects: string[];
  recommendedProjects: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SkillBottleneck {
  skill: Skill;
  demandProjects: string[];
  availableTeams: string[];
  demandHours: number;
  supplyHours: number;
  gapHours: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ProjectRisk {
  project: Project;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: {
    skillAvailability: number; // 0-1 score
    teamCapacity: number; // 0-1 score
    competitionForResources: number; // 0-1 score
  };
  recommendedTeams: string[];
  skillGaps: string[];
  timeline: string;
}

interface CapacityGap {
  skill: string;
  division: string;
  gapHours: number;
  recommendedHires: number;
  timeToHire: number; // quarters
  impact: string[];
}

interface Recommendation {
  type: 'hire' | 'upskill' | 'redistribute' | 'defer';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  cost: number;
  timeline: string;
  affectedProjects: string[];
}

const FYProjectPlanning: React.FC = () => {
  const {
    projects,
    teams,
    cycles,
    skills,
    solutions,
    projectSkills,
    projectSolutions,
    people,
    personSkills,
    divisions,
    allocations,
    setAllocations,
    epics,
  } = useApp();

  // Get current FY based on organization's fiscal year start (assuming April 1st for now)
  const currentFY = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    // If current date is before April 1st, we're in previous FY
    if (currentDate < new Date(currentYear, 3, 1)) {
      // April is month 3 (0-indexed)
      return String(currentYear - 1);
    }
    return String(currentYear);
  }, []);

  const [selectedFY, setSelectedFY] = useState<string>(currentFY);
  const [searchFilter, setSearchFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectRisk | null>(
    null
  );

  // Get financial years from cycles
  const availableFYs = useMemo(() => {
    console.log('All cycles:', cycles);

    // Extract unique financial year IDs from cycles
    const fyIds = cycles.map(c => c.financialYearId).filter(Boolean);

    const uniqueFYs = [...new Set(fyIds)];
    console.log('Financial Year IDs from cycles:', uniqueFYs);

    // If we have financial year IDs, use them
    if (uniqueFYs.length > 0) {
      return uniqueFYs.sort();
    }

    // Fallback: extract years from cycle names or create default range
    const cycleYears = cycles
      .map(c => {
        const name = c.name || c.id;
        const yearMatch = name.match(/(\d{4})/);
        return yearMatch ? yearMatch[1] : null;
      })
      .filter(Boolean);

    if (cycleYears.length > 0) {
      return [...new Set(cycleYears)].sort();
    }

    // Final fallback: current and nearby years
    const currentYear = new Date().getFullYear();
    return [
      String(currentYear - 1),
      String(currentYear),
      String(currentYear + 1),
    ];
  }, [cycles]);

  // Get projects for selected FY - for now, show all projects for portfolio planning
  const fyProjects = useMemo(() => {
    // For portfolio planning, we want to analyze all active projects
    // regardless of current allocations, so we can plan capacity for them
    const filtered = projects.filter(
      p =>
        p.status === 'active' ||
        p.status === 'planned' ||
        p.status === 'planning' || // Added this - your projects have 'planning' status
        !p.status
    );

    return filtered;
  }, [projects]);

  // Analyze team capacity across the FY
  const teamCapacityAnalysis = useMemo((): TeamCapacityAnalysis[] => {
    return teams.map(team => {
      const teamMembers = people.filter(
        p => p.teamId === team.id && p.isActive
      );
      // Calculate quarterly capacity: team capacity * weeks per quarter
      const quarterlyCapacity = team.capacity * 13; // 13 weeks per quarter

      // Get current allocations for this team in the FY
      const fyQuarters = cycles.filter(
        c => c.type === 'quarterly' && c.financialYearId === selectedFY
      );

      const currentAllocations = allocations.filter(
        a =>
          a.teamId === team.id &&
          fyQuarters.some(
            q =>
              q.id === a.cycleId ||
              cycles.some(
                iter => iter.id === a.cycleId && iter.parentCycleId === q.id
              )
          )
      );

      const currentUtilization = currentAllocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );
      const utilization = Math.min(currentUtilization / 4, 100); // Average across 4 quarters

      // Get team skills
      const teamSkillIds = new Set<string>();
      teamMembers.forEach(member => {
        personSkills
          .filter(ps => ps.personId === member.id)
          .forEach(ps => teamSkillIds.add(ps.skillId));
      });

      if (team.targetSkills) {
        team.targetSkills.forEach(skillId => teamSkillIds.add(skillId));
      }

      const teamSkillNames = Array.from(teamSkillIds)
        .map(skillId => skills.find(s => s.id === skillId)?.name)
        .filter(Boolean) as string[];

      // Get current project names
      const currentProjectIds = [
        ...new Set(currentAllocations.map(a => a.projectId).filter(Boolean)),
      ] as string[];
      const currentProjects = currentProjectIds
        .map(pid => projects.find(p => p.id === pid)?.name)
        .filter(Boolean) as string[];

      // Calculate risk level based on utilization and skill demand
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (utilization > 90) riskLevel = 'critical';
      else if (utilization > 75) riskLevel = 'high';
      else if (utilization > 60) riskLevel = 'medium';

      const division =
        divisions.find(d => d.id === team.divisionId)?.name || 'Unassigned';

      return {
        team,
        division,
        currentCapacity: quarterlyCapacity * 4, // Full FY capacity
        utilization,
        availableCapacity: quarterlyCapacity * 4 * (1 - utilization / 100),
        skills: teamSkillNames,
        currentProjects,
        recommendedProjects: [], // Will be populated by recommendation engine
        riskLevel,
      };
    });
  }, [
    teams,
    people,
    cycles,
    allocations,
    selectedFY,
    skills,
    personSkills,
    divisions,
    projects,
  ]);

  // Analyze skill bottlenecks
  const skillBottlenecks = useMemo((): SkillBottleneck[] => {
    const skillDemand = new Map<
      string,
      { projects: Set<string>; hours: number }
    >();
    const skillSupply = new Map<
      string,
      { teams: Set<string>; hours: number }
    >();

    // Calculate demand from FY projects
    fyProjects.forEach(project => {
      const requiredSkills = getProjectRequiredSkills(
        project,
        projectSkills,
        solutions,
        skills,
        projectSolutions
      );

      requiredSkills.forEach(skillInfo => {
        // Use skillInfo structure correctly - it has skillName not skill.name
        const skillName = skillInfo.skillName;
        if (!skillName) {
          return;
        }

        if (!skillDemand.has(skillName)) {
          skillDemand.set(skillName, { projects: new Set(), hours: 0 });
        }
        const demand = skillDemand.get(skillName)!;
        demand.projects.add(project.name);
        demand.hours += 40 * 13; // Assume full quarter of work per skill per project
      });
    });

    // Calculate supply from team capacity
    teamCapacityAnalysis.forEach(analysis => {
      analysis.skills.forEach(skillName => {
        if (!skillName) {
          return;
        }

        if (!skillSupply.has(skillName)) {
          skillSupply.set(skillName, { teams: new Set(), hours: 0 });
        }
        const supply = skillSupply.get(skillName)!;
        supply.teams.add(analysis.team.name);
        supply.hours += analysis.availableCapacity;
      });
    });

    // Create bottleneck analysis
    const bottlenecks: SkillBottleneck[] = [];
    skillDemand.forEach((demand, skillName) => {
      const skill = skills.find(s => s.name === skillName);
      if (!skill) return;

      const supply = skillSupply.get(skillName) || {
        teams: new Set(),
        hours: 0,
      };
      const gapHours = Math.max(0, demand.hours - supply.hours);

      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const gapRatio = supply.hours > 0 ? gapHours / supply.hours : Infinity;

      if (gapRatio === Infinity || gapRatio > 2) severity = 'critical';
      else if (gapRatio > 1) severity = 'high';
      else if (gapRatio > 0.5) severity = 'medium';

      if (gapHours > 0) {
        bottlenecks.push({
          skill,
          demandProjects: Array.from(demand.projects),
          availableTeams: Array.from(supply.teams),
          demandHours: demand.hours,
          supplyHours: supply.hours,
          gapHours,
          severity,
        });
      }
    });

    return bottlenecks.sort((a, b) => b.gapHours - a.gapHours);
  }, [
    fyProjects,
    teamCapacityAnalysis,
    skills,
    projectSkills,
    solutions,
    projectSolutions,
  ]);

  // Assess project risks
  const projectRiskAssessment = useMemo((): ProjectRisk[] => {
    return fyProjects.map(project => {
      const requiredSkills = getProjectRequiredSkills(
        project,
        projectSkills,
        solutions,
        skills,
        projectSolutions
      );

      const skillIds = requiredSkills.map(s => s.skillId);

      // Calculate skill availability score
      const skillAvailability =
        skillIds.length > 0
          ? skillIds.reduce((sum, skillId) => {
              const skill = skills.find(s => s.id === skillId);
              const skillName = skill?.name || '';
              const bottleneck = skillBottlenecks.find(
                b => b.skill.name === skillName
              );
              if (!bottleneck) return sum + 1;
              return (
                sum +
                Math.max(0, 1 - bottleneck.gapHours / bottleneck.demandHours)
              );
            }, 0) / skillIds.length
          : 1;

      // Calculate team capacity score
      const suitableTeams = teamCapacityAnalysis.filter(
        analysis =>
          analysis.availableCapacity > 200 && // At least 200 hours available
          skillIds.some(skillId => {
            const skill = skills.find(s => s.id === skillId);
            return skill && analysis.skills.includes(skill.name);
          })
      );
      const teamCapacity =
        suitableTeams.length > 2 ? 1 : suitableTeams.length / 2;

      // Calculate competition score (how many other projects need same skills)
      const competingProjects = fyProjects.filter(
        p =>
          p.id !== project.id &&
          getProjectRequiredSkills(
            p,
            projectSkills,
            solutions,
            skills,
            projectSolutions
          ).some(s => skillIds.includes(s.skillId))
      );
      const competitionForResources = Math.max(
        0,
        1 - competingProjects.length / fyProjects.length
      );

      // Overall risk level
      const overallScore =
        (skillAvailability + teamCapacity + competitionForResources) / 3;
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (overallScore < 0.3) riskLevel = 'critical';
      else if (overallScore < 0.5) riskLevel = 'high';
      else if (overallScore < 0.7) riskLevel = 'medium';

      // Recommended teams
      const recommendedTeams = suitableTeams
        .sort((a, b) => a.utilization - b.utilization)
        .slice(0, 3)
        .map(a => a.team.name);

      // Skill gaps
      const skillGaps = skillIds
        .filter(skillId => {
          const skill = skills.find(s => s.id === skillId);
          return (
            skill &&
            skillBottlenecks.some(
              b => b.skill.name === skill.name && b.severity === 'critical'
            )
          );
        })
        .map(skillId => skills.find(s => s.id === skillId)?.name)
        .filter(Boolean) as string[];

      return {
        project,
        riskLevel,
        risks: {
          skillAvailability,
          teamCapacity,
          competitionForResources,
        },
        recommendedTeams,
        skillGaps,
        timeline: `FY ${selectedFY}`,
      };
    });
  }, [
    fyProjects,
    teamCapacityAnalysis,
    skillBottlenecks,
    skills,
    projectSkills,
    solutions,
    projectSolutions,
    selectedFY,
  ]);

  // Filter data based on user selections
  const filteredData = useMemo(() => {
    let filteredProjects = projectRiskAssessment;
    let filteredTeams = teamCapacityAnalysis;

    if (searchFilter) {
      filteredProjects = filteredProjects.filter(p =>
        p.project.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
      filteredTeams = filteredTeams.filter(
        t =>
          t.team.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          t.skills.some(s =>
            s.toLowerCase().includes(searchFilter.toLowerCase())
          )
      );
    }

    if (divisionFilter !== 'all') {
      filteredTeams = filteredTeams.filter(t => t.division === divisionFilter);
    }

    if (riskFilter !== 'all') {
      filteredProjects = filteredProjects.filter(
        p => p.riskLevel === riskFilter
      );
    }

    return { projects: filteredProjects, teams: filteredTeams };
  }, [
    projectRiskAssessment,
    teamCapacityAnalysis,
    searchFilter,
    divisionFilter,
    riskFilter,
  ]);

  // Create project allocation data for the new tab
  const projectAllocations = useMemo(() => {
    const fyQuarters = cycles
      .filter(c => c.type === 'quarterly' && c.financialYearId === selectedFY)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    const quarterNames = fyQuarters.map(q => q.name || q.id);

    return fyProjects.map(project => {
      // Get all allocations for this project in the selected FY
      const projectAllocations = allocations.filter(
        a =>
          a.projectId === project.id && fyQuarters.some(q => q.id === a.cycleId)
      );

      // Group by team
      const teamAllocations = new Map<
        string,
        {
          team: any;
          quarters: Record<string, number>;
        }
      >();

      projectAllocations.forEach(allocation => {
        const team = teams.find(t => t.id === allocation.teamId);
        const quarter = fyQuarters.find(q => q.id === allocation.cycleId);

        if (team && quarter) {
          const quarterName = quarter.name || quarter.id;
          if (!teamAllocations.has(team.id)) {
            teamAllocations.set(team.id, {
              team,
              quarters: {},
            });
          }
          const teamAlloc = teamAllocations.get(team.id)!;
          teamAlloc.quarters[quarterName] =
            (teamAlloc.quarters[quarterName] || 0) + allocation.percentage;
        }
      });

      return {
        project,
        teams: Array.from(teamAllocations.values()),
        quarterNames,
      };
    });
  }, [fyProjects, allocations, teams, cycles, selectedFY]);

  const getRiskColor = (risk: 'low' | 'medium' | 'high' | 'critical') => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <AllocationClipboardProvider
      onAllocationsChange={setAllocations}
      allAllocations={allocations}
      selectedCycleId={selectedFY}
    >
      <div className="h-full w-full flex flex-col overflow-hidden">
        <div className="flex-1 p-6 space-y-6 w-full overflow-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">
                FY Project Portfolio Planning
              </h1>
              <p className="text-muted-foreground">
                Strategic planning for project allocation, team capacity, and
                skill requirements
              </p>
            </div>
            <div className="flex gap-4">
              <Select value={selectedFY} onValueChange={setSelectedFY}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableFYs.map(fy => (
                    <SelectItem key={fy} value={fy}>
                      FY {fy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clipboard Status */}
          <ClipboardStatus epics={epics} />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {fyProjects.length}
                    </div>
                    <div className="text-sm text-gray-600">FY Projects</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {
                        projectRiskAssessment.filter(
                          p =>
                            p.riskLevel === 'critical' || p.riskLevel === 'high'
                        ).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      High Risk Projects
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {
                        skillBottlenecks.filter(b => b.severity === 'critical')
                          .length
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      Critical Skill Bottlenecks
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {
                        teamCapacityAnalysis.filter(
                          t => t.availableCapacity > 400
                        ).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Available Teams</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects or teams..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={divisionFilter}
                  onValueChange={setDivisionFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {divisions.map(div => (
                      <SelectItem key={div.id} value={div.name}>
                        {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Risk Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="critical">Critical Risk</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Export Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="allocations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="allocations">Project Allocations</TabsTrigger>
              <TabsTrigger value="matching">Project-Team Matching</TabsTrigger>
              <TabsTrigger value="projects">
                Project Risk Assessment
              </TabsTrigger>
              <TabsTrigger value="teams">Team Capacity Analysis</TabsTrigger>
              <TabsTrigger value="skills">Skill Bottlenecks</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            {/* Project Allocations Tab */}
            <TabsContent value="allocations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Project Allocations by Quarter - FY {selectedFY}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {projectAllocations.map(
                      ({ project, teams, quarterNames }) => (
                        <div key={project.id} className="border rounded-lg p-4">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {project.description}
                              </p>
                            )}
                          </div>

                          {teams.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Team
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Division
                                    </th>
                                    {quarterNames.map(quarter => (
                                      <th
                                        key={quarter}
                                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        {quarter}
                                      </th>
                                    ))}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {teams.map(({ team, quarters }) => {
                                    const total = Object.values(
                                      quarters
                                    ).reduce((sum, val) => sum + val, 0);
                                    const division = divisions.find(
                                      d => d.id === team.divisionId
                                    );

                                    return (
                                      <tr key={team.id}>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                          <div className="text-sm font-medium text-gray-900">
                                            {team.name}
                                          </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-500">
                                            {division?.name || 'Unassigned'}
                                          </div>
                                        </td>
                                        {quarterNames.map(quarter => {
                                          const percentage =
                                            quarters[quarter] || 0;
                                          return (
                                            <td
                                              key={quarter}
                                              className="px-4 py-4 whitespace-nowrap text-center"
                                            >
                                              <span
                                                className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                                  percentage > 0
                                                    ? percentage >= 80
                                                      ? 'bg-red-100 text-red-800'
                                                      : percentage >= 50
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}
                                              >
                                                {percentage > 0
                                                  ? `${percentage}%`
                                                  : '-'}
                                              </span>
                                            </td>
                                          );
                                        })}
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                          <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                              total >= 200
                                                ? 'bg-red-100 text-red-800'
                                                : total >= 100
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : total > 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                          >
                                            {total > 0
                                              ? `${Math.round(total)}%`
                                              : '-'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              No team allocations found for this project in FY{' '}
                              {selectedFY}
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {projectAllocations.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        No projects found for FY {selectedFY}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Project-Team Matching Tab */}
            <TabsContent value="matching" className="space-y-4">
              <ProjectTeamMatchingView
                projects={projects}
                teams={teams}
                skills={skills}
                solutions={solutions}
                projectSolutions={projectSolutions}
                projectSkills={projectSkills}
                people={people}
                personSkills={personSkills}
                allocations={allocations}
                cycles={cycles}
                divisions={divisions}
              />
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Project Risk Assessment for FY {selectedFY}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Skill Availability</TableHead>
                        <TableHead>Team Capacity</TableHead>
                        <TableHead>Competition</TableHead>
                        <TableHead>Recommended Teams</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.projects.map(project => (
                        <TableRow key={project.project.id}>
                          <TableCell className="font-medium">
                            {project.project.name}
                          </TableCell>
                          <TableCell>
                            <Badge className={getRiskColor(project.riskLevel)}>
                              {project.riskLevel.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {Math.round(
                                project.risks.skillAvailability * 100
                              )}
                              %
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {Math.round(project.risks.teamCapacity * 100)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {Math.round(
                                project.risks.competitionForResources * 100
                              )}
                              %
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {project.recommendedTeams
                                .slice(0, 2)
                                .map(team => (
                                  <Badge
                                    key={team}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {team}
                                  </Badge>
                                ))}
                              {project.recommendedTeams.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{project.recommendedTeams.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    {project.project.name} - Risk Assessment
                                    Details
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6">
                                  {/* Risk Overview */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                      <CardContent className="pt-4">
                                        <div className="text-center">
                                          <div className="text-2xl font-bold mb-1">
                                            {Math.round(
                                              ((project.risks
                                                .skillAvailability +
                                                project.risks.teamCapacity +
                                                project.risks
                                                  .competitionForResources) /
                                                3) *
                                                100
                                            )}
                                            %
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            Overall Score
                                          </div>
                                          <Badge
                                            className={`mt-2 ${getRiskColor(project.riskLevel)}`}
                                          >
                                            {project.riskLevel.toUpperCase()}
                                          </Badge>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardContent className="pt-4">
                                        <div className="space-y-3">
                                          <div>
                                            <div className="flex justify-between text-sm mb-1">
                                              <span>Skill Availability</span>
                                              <span>
                                                {Math.round(
                                                  project.risks
                                                    .skillAvailability * 100
                                                )}
                                                %
                                              </span>
                                            </div>
                                            <Progress
                                              value={
                                                project.risks
                                                  .skillAvailability * 100
                                              }
                                              className="h-2"
                                            />
                                          </div>
                                          <div>
                                            <div className="flex justify-between text-sm mb-1">
                                              <span>Team Capacity</span>
                                              <span>
                                                {Math.round(
                                                  project.risks.teamCapacity *
                                                    100
                                                )}
                                                %
                                              </span>
                                            </div>
                                            <Progress
                                              value={
                                                project.risks.teamCapacity * 100
                                              }
                                              className="h-2"
                                            />
                                          </div>
                                          <div>
                                            <div className="flex justify-between text-sm mb-1">
                                              <span>Resource Competition</span>
                                              <span>
                                                {Math.round(
                                                  project.risks
                                                    .competitionForResources *
                                                    100
                                                )}
                                                %
                                              </span>
                                            </div>
                                            <Progress
                                              value={
                                                project.risks
                                                  .competitionForResources * 100
                                              }
                                              className="h-2"
                                            />
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardContent className="pt-4">
                                        <div className="text-center">
                                          <div className="text-2xl font-bold mb-1">
                                            {project.recommendedTeams.length}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            Suitable Teams
                                          </div>
                                          <div className="text-2xl font-bold mb-1 mt-2">
                                            {project.skillGaps.length}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            Skill Gaps
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Recommended Teams */}
                                  {project.recommendedTeams.length > 0 && (
                                    <div>
                                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Recommended Teams
                                      </h3>
                                      <div className="space-y-2">
                                        {project.recommendedTeams.map(
                                          (teamName, index) => {
                                            const teamAnalysis =
                                              teamCapacityAnalysis.find(
                                                t => t.team.name === teamName
                                              );
                                            return (
                                              <div
                                                key={teamName}
                                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                              >
                                                <div className="flex items-center gap-3">
                                                  <div className="text-sm font-medium text-primary">
                                                    #{index + 1}
                                                  </div>
                                                  <div>
                                                    <div className="font-medium">
                                                      {teamName}
                                                    </div>
                                                    {teamAnalysis && (
                                                      <div className="text-sm text-muted-foreground">
                                                        {teamAnalysis.division}{' '}
                                                        •{' '}
                                                        {Math.round(
                                                          teamAnalysis.utilization
                                                        )}
                                                        % utilized
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="text-right">
                                                  {teamAnalysis && (
                                                    <div className="text-sm">
                                                      <div className="font-medium">
                                                        {Math.round(
                                                          teamAnalysis.availableCapacity
                                                        )}
                                                        h available
                                                      </div>
                                                      <div className="text-xs text-muted-foreground">
                                                        {
                                                          teamAnalysis.skills
                                                            .length
                                                        }{' '}
                                                        skills
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Skill Gaps */}
                                  {project.skillGaps.length > 0 && (
                                    <div>
                                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                                        Critical Skill Gaps
                                      </h3>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {project.skillGaps.map(skillName => {
                                          const bottleneck =
                                            skillBottlenecks.find(
                                              b => b.skill.name === skillName
                                            );
                                          return (
                                            <div
                                              key={skillName}
                                              className="p-3 border border-red-200 bg-red-50 rounded-lg"
                                            >
                                              <div className="font-medium text-red-800">
                                                {skillName}
                                              </div>
                                              {bottleneck && (
                                                <div className="text-sm text-red-600 mt-1">
                                                  <div>
                                                    Gap:{' '}
                                                    {Math.round(
                                                      bottleneck.gapHours
                                                    )}{' '}
                                                    hours
                                                  </div>
                                                  <div>
                                                    Available teams:{' '}
                                                    {bottleneck.availableTeams
                                                      .length || 'None'}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Project Required Skills */}
                                  <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                      <Target className="h-5 w-5" />
                                      Required Skills
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {(() => {
                                        const requiredSkills =
                                          getProjectRequiredSkills(
                                            project.project,
                                            projectSkills,
                                            solutions,
                                            skills,
                                            projectSolutions
                                          );
                                        return requiredSkills.map(skillInfo => (
                                          <Badge
                                            key={skillInfo.skillId}
                                            variant="outline"
                                            className="justify-start"
                                          >
                                            {skillInfo.skillName}
                                            <span className="ml-1 text-xs text-muted-foreground">
                                              ({skillInfo.source})
                                            </span>
                                          </Badge>
                                        ));
                                      })()}
                                    </div>
                                  </div>

                                  {/* Timeline */}
                                  <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                      <Calendar className="h-5 w-5" />
                                      Timeline
                                    </h3>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <div className="text-lg font-medium">
                                        {project.timeline}
                                      </div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        Strategic planning for financial year
                                        capacity allocation
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teams" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Capacity Analysis for FY {selectedFY}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead>Available Capacity</TableHead>
                        <TableHead>Key Skills</TableHead>
                        <TableHead>Current Projects</TableHead>
                        <TableHead>Risk Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.teams.map(analysis => (
                        <TableRow key={analysis.team.id}>
                          <TableCell className="font-medium">
                            {analysis.team.name}
                          </TableCell>
                          <TableCell>{analysis.division}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-sm">
                                {Math.round(analysis.utilization)}%
                              </div>
                              <div className="w-16 h-2 bg-gray-200 rounded-full">
                                <div
                                  className={`h-2 rounded-full ${
                                    analysis.utilization > 90
                                      ? 'bg-red-500'
                                      : analysis.utilization > 75
                                        ? 'bg-orange-500'
                                        : analysis.utilization > 60
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(analysis.utilization, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {Math.round(analysis.availableCapacity)}h
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {analysis.skills.slice(0, 3).map(skill => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {analysis.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{analysis.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {analysis.currentProjects.length > 0
                                ? analysis.currentProjects.join(', ')
                                : 'Available'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRiskColor(analysis.riskLevel)}>
                              {analysis.riskLevel.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Skill Bottlenecks for FY {selectedFY}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Demand (Hours)</TableHead>
                        <TableHead>Supply (Hours)</TableHead>
                        <TableHead>Gap (Hours)</TableHead>
                        <TableHead>Demanding Projects</TableHead>
                        <TableHead>Available Teams</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {skillBottlenecks.map(bottleneck => (
                        <TableRow key={bottleneck.skill.id}>
                          <TableCell className="font-medium">
                            {bottleneck.skill.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getRiskColor(bottleneck.severity)}
                            >
                              {bottleneck.severity.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {Math.round(bottleneck.demandHours)}
                          </TableCell>
                          <TableCell>
                            {Math.round(bottleneck.supplyHours)}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {Math.round(bottleneck.gapHours)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {bottleneck.demandProjects.slice(0, 2).join(', ')}
                              {bottleneck.demandProjects.length > 2 &&
                                ` (+${bottleneck.demandProjects.length - 2})`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {bottleneck.availableTeams.length > 0
                                ? bottleneck.availableTeams
                                    .slice(0, 2)
                                    .join(', ')
                                : 'None'}
                              {bottleneck.availableTeams.length > 2 &&
                                ` (+${bottleneck.availableTeams.length - 2})`}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Strategic Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Based on the analysis above, here are key recommendations
                      for FY {selectedFY} planning:
                    </div>

                    {/* Hiring Recommendations */}
                    {skillBottlenecks.filter(b => b.severity === 'critical')
                      .length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">
                          🚨 Critical Skill Shortages - Immediate Hiring
                          Required
                        </h4>
                        <ul className="space-y-1 text-sm text-red-700">
                          {skillBottlenecks
                            .filter(b => b.severity === 'critical')
                            .map(bottleneck => (
                              <li key={bottleneck.skill.id}>
                                • <strong>{bottleneck.skill.name}</strong>: Need
                                ~{Math.ceil(bottleneck.gapHours / 2000)}{' '}
                                additional team members (Gap:{' '}
                                {Math.round(bottleneck.gapHours)} hours across{' '}
                                {bottleneck.demandProjects.length} projects)
                              </li>
                            ))}
                        </ul>
                        <div className="mt-2 text-xs text-red-600">
                          ⏰ Assuming 1 quarter hiring lead time, start
                          immediately to avoid Q2 delays
                        </div>
                      </div>
                    )}

                    {/* Team Redistribution */}
                    {teamCapacityAnalysis.filter(t => t.availableCapacity > 400)
                      .length > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          🔄 Optimize Team Allocation
                        </h4>
                        <div className="text-sm text-blue-700">
                          <strong>
                            {
                              teamCapacityAnalysis.filter(
                                t => t.availableCapacity > 400
                              ).length
                            }{' '}
                            teams
                          </strong>{' '}
                          have significant available capacity. Consider
                          redistributing workload from over-utilized teams.
                        </div>
                        <div className="mt-2">
                          {teamCapacityAnalysis
                            .filter(t => t.availableCapacity > 400)
                            .slice(0, 3)
                            .map(team => (
                              <Badge
                                key={team.team.id}
                                variant="outline"
                                className="mr-2 mb-1"
                              >
                                {team.team.name} (
                                {Math.round(team.availableCapacity)}h available)
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* High Risk Projects */}
                    {projectRiskAssessment.filter(
                      p => p.riskLevel === 'critical'
                    ).length > 0 && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">
                          ⚠️ High Risk Projects - Require Immediate Attention
                        </h4>
                        <ul className="space-y-1 text-sm text-orange-700">
                          {projectRiskAssessment
                            .filter(p => p.riskLevel === 'critical')
                            .slice(0, 5)
                            .map(project => (
                              <li key={project.project.id}>
                                • <strong>{project.project.name}</strong>:
                                {project.skillGaps.length > 0 &&
                                  ` Missing skills: ${project.skillGaps.join(', ')}`}
                                {project.recommendedTeams.length > 0 &&
                                  ` | Consider: ${project.recommendedTeams.slice(0, 2).join(', ')}`}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Upskilling Opportunities */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        📈 Upskilling Opportunities
                      </h4>
                      <div className="text-sm text-green-700">
                        Cross-train teams in high-demand skills to increase
                        flexibility and reduce bottlenecks. Focus on skills with
                        medium severity bottlenecks that can be addressed
                        through training.
                      </div>
                      <div className="mt-2">
                        {skillBottlenecks
                          .filter(
                            b =>
                              b.severity === 'medium' || b.severity === 'high'
                          )
                          .slice(0, 4)
                          .map(bottleneck => (
                            <Badge
                              key={bottleneck.skill.id}
                              variant="outline"
                              className="mr-2 mb-1"
                            >
                              {bottleneck.skill.name}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AllocationClipboardProvider>
  );
};

export default FYProjectPlanning;
