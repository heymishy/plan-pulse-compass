import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Target,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Zap,
  CheckCircle,
} from 'lucide-react';
import {
  analyzeProjectsFeasibility,
  createPlanningScenario,
} from '@/utils/advancedPlanningEngine';
import { getDefaultConfig } from '@/utils/financialCalculations';
import {
  ProjectFeasibilityAnalysis,
  PlanningFilters,
} from '@/types/planningTypes';
import ProjectFeasibilityCard from './ProjectFeasibilityCard';
import TeamResourceAnalysis from './TeamResourceAnalysis';
import BudgetImpactAnalyzer from './BudgetImpactAnalyzer';
import ScenarioComparison from './ScenarioComparison';

const AdvancedPlanningDashboard = () => {
  const {
    projects,
    teams,
    people,
    skills,
    personSkills,
    projectSkills,
    projectSolutions,
    solutions,
    allocations,
    cycles,
    divisions,
    roles,
    config,
  } = useApp();

  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<PlanningFilters>({
    projectStatus: ['planning'],
    divisionIds: [],
    skillCategories: [],
    riskLevels: [],
  });

  // Get planning projects
  const planningProjects = useMemo(() => {
    return projects.filter(
      p =>
        filters.projectStatus.includes(
          p.status as PlanningFilters['projectStatus'][0]
        ) &&
        (filters.divisionIds.length === 0 ||
          filters.divisionIds.some(divId =>
            teams.some(
              t =>
                t.divisionId === divId &&
                allocations.some(
                  a =>
                    a.teamId === t.id &&
                    projectSolutions.some(ps => ps.projectId === p.id)
                )
            )
          ))
    );
  }, [projects, filters, teams, allocations, projectSolutions]);

  // Analyze selected projects
  const feasibilityAnalyses = useMemo(() => {
    if (selectedProjects.length === 0) return [];

    return analyzeProjectsFeasibility(selectedProjects, {
      projects,
      teams,
      people,
      skills,
      personSkills,
      projectSkills,
      projectSolutions,
      solutions,
      allocations,
      cycles,
      divisions,
      roles,
      divisionBudgets: [], // TODO: Add division budgets to context
      config: config || getDefaultConfig(),
    });
  }, [
    selectedProjects,
    projects,
    teams,
    people,
    skills,
    personSkills,
    projectSkills,
    projectSolutions,
    solutions,
    allocations,
    cycles,
    divisions,
    roles,
    config,
  ]);

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  const handleSelectAllProjects = () => {
    setSelectedProjects(planningProjects.map(p => p.id));
  };

  const handleClearSelection = () => {
    setSelectedProjects([]);
  };

  const getOverviewStats = () => {
    const totalProjects = planningProjects.length;
    const selectedCount = selectedProjects.length;
    const highFeasibility = feasibilityAnalyses.filter(
      a => a.feasibilityScore >= 70
    ).length;
    const criticalRisks = feasibilityAnalyses.reduce(
      (sum, a) =>
        sum + a.riskFactors.filter(r => r.severity === 'critical').length,
      0
    );
    const totalBudget = feasibilityAnalyses.reduce(
      (sum, a) => sum + a.budgetRequirement,
      0
    );

    return {
      totalProjects,
      selectedCount,
      highFeasibility,
      criticalRisks,
      totalBudget,
    };
  };

  const stats = getOverviewStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Advanced Project Planning
          </h1>
          <p className="text-gray-600">
            Analyze project feasibility, team allocation, and budget impact
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleClearSelection}>
            Clear Selection
          </Button>
          <Button onClick={handleSelectAllProjects}>
            <Target className="h-4 w-4 mr-2" />
            Select All Projects
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Planning Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-gray-500">Available for planning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Selected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.selectedCount}
            </div>
            <p className="text-xs text-gray-500">Projects selected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              High Feasibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.highFeasibility}
            </div>
            <p className="text-xs text-gray-500">≥70% feasibility score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Critical Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.criticalRisks}
            </div>
            <p className="text-xs text-gray-500">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalBudget / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500">Selected projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Project Selection & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Project Status</label>
              <Select
                value={filters.projectStatus[0] || 'planning'}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    projectStatus: [
                      value as PlanningFilters['projectStatus'][0],
                    ],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Division</label>
              <Select
                value={filters.divisionIds[0] || 'all'}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    divisionIds: value === 'all' ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions.map(division => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <label className="text-sm font-medium">
              Select Projects to Analyze
            </label>
            <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
              {planningProjects.map(project => (
                <div key={project.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={checked =>
                      handleProjectSelection(project.id, checked as boolean)
                    }
                  />
                  <span className="text-sm">{project.name}</span>
                  <Badge variant="outline">{project.status}</Badge>
                  {project.budget && (
                    <span className="text-xs text-gray-500">
                      ${(project.budget / 1000000).toFixed(1)}M
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {selectedProjects.length > 0 && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="overview">Project Overview</TabsTrigger>
            <TabsTrigger value="teams">Team Analysis</TabsTrigger>
            <TabsTrigger value="budget">Budget Impact</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {feasibilityAnalyses.map(analysis => (
                <ProjectFeasibilityCard
                  key={analysis.projectId}
                  analysis={analysis}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <TeamResourceAnalysis
              projectAnalyses={feasibilityAnalyses}
              teams={teams}
              people={people}
              roles={roles}
              config={config || getDefaultConfig()}
            />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetImpactAnalyzer
              projectAnalyses={feasibilityAnalyses}
              divisions={divisions}
            />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenarioComparison
              selectedProjects={selectedProjects}
              feasibilityAnalyses={feasibilityAnalyses}
            />
          </TabsContent>
        </Tabs>
      )}

      {selectedProjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Projects Selected
            </h3>
            <p className="text-gray-600 mb-4">
              Select one or more projects to analyze their feasibility, team
              requirements, and budget impact.
            </p>
            <Button onClick={handleSelectAllProjects}>
              Select All Planning Projects
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedPlanningDashboard;
