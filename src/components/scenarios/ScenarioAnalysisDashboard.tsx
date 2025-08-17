import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  Search,
  TrendingUp,
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  Activity,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { analyzeProjectTeamAvailability } from '@/utils/scenarioAnalysis';
import SkillGapAnalysis from './SkillGapAnalysis';
import TeamEfficiencyMetrics from './TeamEfficiencyMetrics';
import RecommendationsEngine from './RecommendationsEngine';
import ScenarioFinancialTest from './ScenarioFinancialTest';

const ScenarioAnalysisDashboard = () => {
  const {
    projects,
    teams,
    people,
    skills,
    personSkills,
    projectSolutions,
    projectSkills,
    solutions,
    allocations,
    cycles,
  } = useApp();

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const runAnalysis = () => {
    if (!selectedProject) return;

    try {
      const results = analyzeProjectTeamAvailability(selectedProject, {
        projects,
        teams,
        people,
        skills,
        personSkills,
        projectSolutions,
        projectSkills,
        solutions,
        allocations,
        cycles,
      });
      setAnalysisResults(results);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const getTeamEfficiencyData = () => {
    if (!analysisResults) return [];

    return analysisResults.teamMatches.map((team: any) => ({
      name: team.teamName,
      efficiency: team.overallScore,
      skillMatch: team.skillMatchPercentage,
      availability: team.availabilityPercentage,
      capacity: team.totalCapacity,
    }));
  };

  const getSkillCoverageData = () => {
    if (!analysisResults) return [];

    const skillCoverage = analysisResults.teamMatches.reduce(
      (acc: any, team: any) => {
        team.skillBreakdown.forEach((skill: any) => {
          if (!acc[skill.skillName]) {
            acc[skill.skillName] = { covered: 0, total: 0 };
          }
          acc[skill.skillName].total++;
          if (skill.hasSkill) acc[skill.skillName].covered++;
        });
        return acc;
      },
      {}
    );

    return Object.entries(skillCoverage).map(
      ([skill, data]: [string, any]) => ({
        skill,
        coverage: (data.covered / data.total) * 100,
        teams: data.total,
      })
    );
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Scenario Analysis Dashboard
          </h1>
          <p className="text-gray-600">
            Advanced project-team matching and analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select project to analyze..." />
            </SelectTrigger>
            <SelectContent>
              {(projects || []).map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={runAnalysis} disabled={!selectedProject}>
            <Search className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList>
          <TabsTrigger value="financial">Financial Testing</TabsTrigger>
          {analysisResults && (
            <>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="efficiency">Team Efficiency</TabsTrigger>
              <TabsTrigger value="skills">Skill Analysis</TabsTrigger>
              <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">
                AI Recommendations
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <ScenarioFinancialTest />
        </TabsContent>

        {analysisResults && (
          <>
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Best Match
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        analysisResults.teamMatches[0]?.overallScore || 0
                      )}
                      %
                    </div>
                    <p className="text-xs text-gray-500">
                      {analysisResults.teamMatches[0]?.teamName}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Teams Analyzed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResults.teamMatches.length}
                    </div>
                    <p className="text-xs text-gray-500">Available teams</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Skill Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {analysisResults.skillGaps.length}
                    </div>
                    <p className="text-xs text-gray-500">Critical gaps</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Good Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {
                        analysisResults.teamMatches.filter(
                          (t: any) => t.overallScore >= 70
                        ).length
                      }
                    </div>
                    <p className="text-xs text-gray-500">≥70% match</p>
                  </CardContent>
                </Card>
              </div>

              {/* Team Efficiency Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Team Efficiency Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getTeamEfficiencyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="efficiency"
                        fill="#8884d8"
                        name="Overall Score"
                      />
                      <Bar
                        dataKey="skillMatch"
                        fill="#82ca9d"
                        name="Skill Match"
                      />
                      <Bar
                        dataKey="availability"
                        fill="#ffc658"
                        name="Availability"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="efficiency">
              <TeamEfficiencyMetrics teams={analysisResults.teamMatches} />
            </TabsContent>

            <TabsContent value="skills" className="space-y-6">
              {/* Skill Coverage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Skill Coverage Across Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={getSkillCoverageData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="coverage" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Skill Radar Chart for Top Teams */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysisResults.teamMatches.slice(0, 2).map((team: any) => (
                  <Card key={team.teamId}>
                    <CardHeader>
                      <CardTitle>{team.teamName} - Skill Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart
                          data={team.skillBreakdown.map((skill: any) => ({
                            skill: skill.skillName,
                            value: skill.hasSkill ? 100 : 0,
                          }))}
                        >
                          <PolarGrid />
                          <PolarAngleAxis dataKey="skill" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          <Radar
                            name={team.teamName}
                            dataKey="value"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gaps">
              <SkillGapAnalysis
                skillGaps={analysisResults.skillGaps}
                teamMatches={analysisResults.teamMatches}
              />
            </TabsContent>

            <TabsContent value="recommendations">
              <RecommendationsEngine
                teamMatches={analysisResults.teamMatches}
                skillGaps={analysisResults.skillGaps}
                projectBudget={
                  projects.find(p => p.id === selectedProject)?.budget
                }
                projectTimeline="Q2 2024"
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default ScenarioAnalysisDashboard;
