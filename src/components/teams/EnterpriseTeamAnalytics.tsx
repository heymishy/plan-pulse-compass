import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Building,
  Target,
  Activity,
  DollarSign,
  UserCheck,
  Calendar,
  Zap,
  Shield,
  Award,
  AlertCircle,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import { calculatePersonCost } from '@/utils/financialCalculations';

interface TeamAnalytics {
  teamId: string;
  teamName: string;
  divisionName: string;
  memberCount: number;
  permanentCount: number;
  contractorCount: number;
  avgSalary: number;
  totalCost: number;
  costPerHour: number;
  capacityHours: number;
  utilization: number;
  roleDistribution: Record<string, number>;
  seniorityMix: Record<string, number>;
  riskScore: number;
  recommendedActions: string[];
  quarterlyTrend: number;
  skillGaps: string[];
  optimalSize: number;
  isOverSized: boolean;
  isUnderSized: boolean;
  contractorRisk: 'low' | 'medium' | 'high';
  burnRate: number;
}

const EnterpriseTeamAnalytics = () => {
  const { teams, people, divisions, roles, allocations, cycles } = useApp();
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [timeFrame, setTimeFrame] = useState<
    'current' | 'quarterly' | 'yearly'
  >('current');

  const analytics = useMemo(() => {
    const teamAnalytics: TeamAnalytics[] = teams.map(team => {
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
      const costPerHour = totalCost / (260 * 8); // 260 working days, 8 hours

      // Role distribution
      const roleDistribution: Record<string, number> = {};
      teamMembers.forEach(person => {
        const role = roles.find(r => r.id === person.roleId);
        if (role) {
          roleDistribution[role.name] = (roleDistribution[role.name] || 0) + 1;
        }
      });

      // Seniority analysis (based on role names containing keywords)
      const seniorityMix: Record<string, number> = {
        Junior: 0,
        Mid: 0,
        Senior: 0,
        Lead: 0,
        Principal: 0,
      };
      teamMembers.forEach(person => {
        const role = roles.find(r => r.id === person.roleId);
        if (role) {
          const roleName = role.name.toLowerCase();
          if (roleName.includes('junior') || roleName.includes('graduate'))
            seniorityMix.Junior++;
          else if (roleName.includes('senior')) seniorityMix.Senior++;
          else if (roleName.includes('lead') || roleName.includes('staff'))
            seniorityMix.Lead++;
          else if (
            roleName.includes('principal') ||
            roleName.includes('architect')
          )
            seniorityMix.Principal++;
          else seniorityMix.Mid++;
        }
      });

      // Risk assessment
      let riskScore = 0;
      const recommendedActions: string[] = [];

      // Team size risk
      if (teamMembers.length < 5) {
        riskScore += 20;
        recommendedActions.push(
          'Consider growing team to minimum viable size (5-7 people)'
        );
      } else if (teamMembers.length > 12) {
        riskScore += 15;
        recommendedActions.push(
          'Consider splitting large team for better coordination'
        );
      }

      // Contractor dependency risk
      const contractorRatio = contractorMembers.length / teamMembers.length;
      let contractorRisk: 'low' | 'medium' | 'high' = 'low';
      if (contractorRatio > 0.5) {
        riskScore += 25;
        contractorRisk = 'high';
        recommendedActions.push(
          'High contractor dependency - consider permanent hires'
        );
      } else if (contractorRatio > 0.3) {
        riskScore += 10;
        contractorRisk = 'medium';
        recommendedActions.push(
          'Monitor contractor dependency and succession planning'
        );
      }

      // Seniority balance risk
      const seniorRatio =
        (seniorityMix.Senior + seniorityMix.Lead + seniorityMix.Principal) /
        teamMembers.length;
      if (seniorRatio < 0.3) {
        riskScore += 15;
        recommendedActions.push(
          'Low senior talent ratio - add senior expertise'
        );
      } else if (seniorRatio > 0.7) {
        riskScore += 10;
        recommendedActions.push(
          'Top-heavy team - consider junior talent for growth'
        );
      }

      // Cost efficiency
      const division = divisions.find(d => d.id === team.divisionId);
      const budgetUtilization = division?.budget
        ? (totalCost / division.budget) * 100
        : 0;
      if (budgetUtilization > 80) {
        riskScore += 15;
        recommendedActions.push(
          'Approaching budget limits - review cost optimization'
        );
      }

      return {
        teamId: team.id,
        teamName: team.name,
        divisionName: division?.name || 'No Division',
        memberCount: teamMembers.length,
        permanentCount: permanentMembers.length,
        contractorCount: contractorMembers.length,
        avgSalary,
        totalCost,
        costPerHour,
        capacityHours: team.capacity,
        utilization: 85, // Would calculate from allocations
        roleDistribution,
        seniorityMix,
        riskScore: Math.min(riskScore, 100),
        recommendedActions,
        quarterlyTrend: Math.random() * 20 - 10, // Mock data
        skillGaps: [], // Would analyze from required vs available skills
        optimalSize: Math.max(5, Math.min(8, teamMembers.length)),
        isOverSized: teamMembers.length > 12,
        isUnderSized: teamMembers.length < 5,
        contractorRisk,
        burnRate: totalCost / 12, // Monthly burn rate
      };
    });

    return teamAnalytics.filter(
      team =>
        selectedDivision === 'all' || team.divisionName === selectedDivision
    );
  }, [teams, people, divisions, roles, selectedDivision]);

  // Portfolio-level metrics
  const portfolioMetrics = useMemo(() => {
    const totalTeams = analytics.length;
    const totalPeople = analytics.reduce(
      (sum, team) => sum + team.memberCount,
      0
    );
    const totalCost = analytics.reduce((sum, team) => sum + team.totalCost, 0);
    const avgTeamSize = totalPeople / totalTeams;
    const totalContractors = analytics.reduce(
      (sum, team) => sum + team.contractorCount,
      0
    );
    const contractorRatio = totalContractors / totalPeople;
    const highRiskTeams = analytics.filter(team => team.riskScore > 50).length;
    const avgCostPerPerson = totalCost / totalPeople;

    // Optimization opportunities
    const oversizedTeams = analytics.filter(team => team.isOverSized).length;
    const undersizedTeams = analytics.filter(team => team.isUnderSized).length;
    const highContractorRiskTeams = analytics.filter(
      team => team.contractorRisk === 'high'
    ).length;

    return {
      totalTeams,
      totalPeople,
      totalCost,
      avgTeamSize,
      contractorRatio,
      highRiskTeams,
      avgCostPerPerson,
      oversizedTeams,
      undersizedTeams,
      highContractorRiskTeams,
      monthlyBurnRate: totalCost / 12,
    };
  }, [analytics]);

  // Chart data
  const teamSizeData = analytics.map(team => ({
    name: team.teamName,
    size: team.memberCount,
    optimal: team.optimalSize,
    cost: team.totalCost / 1000, // In thousands
    risk: team.riskScore,
  }));

  const contractorDistribution = analytics.map(team => ({
    name: team.teamName,
    permanent: team.permanentCount,
    contractor: team.contractorCount,
    ratio: team.contractorCount / team.memberCount,
  }));

  const costAnalysisData = analytics.map(team => ({
    name: team.teamName,
    totalCost: team.totalCost / 1000,
    costPerPerson: team.totalCost / team.memberCount / 1000,
    utilization: team.utilization,
  }));

  const riskHeatmapData = analytics.map(team => ({
    name: team.teamName,
    risk: team.riskScore,
    size: team.memberCount,
    contractorRisk:
      team.contractorRisk === 'high'
        ? 80
        : team.contractorRisk === 'medium'
          ? 50
          : 20,
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Division" />
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

          <Select
            value={timeFrame}
            onValueChange={value =>
              setTimeFrame(value as 'current' | 'quarterly' | 'yearly')
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioMetrics.totalPeople}
            </div>
            <p className="text-xs text-gray-500">
              Across {portfolioMetrics.totalTeams} teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(portfolioMetrics.totalCost / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500">
              ${(portfolioMetrics.monthlyBurnRate / 1000).toFixed(0)}K/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contractor Ratio
            </CardTitle>
            <UserCheck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(portfolioMetrics.contractorRatio * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500">
              {portfolioMetrics.highContractorRiskTeams} high-risk teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Teams</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioMetrics.highRiskTeams}
            </div>
            <p className="text-xs text-gray-500">Need immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="composition" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="composition">Team Composition</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="recommendations">Growth Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="composition" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Size Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Team Size vs Optimal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamSizeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="size" fill="#3b82f6" name="Current Size" />
                    <Bar dataKey="optimal" fill="#10b981" name="Optimal Size" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contractor Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Permanent vs Contractor Split</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contractorDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="permanent"
                      stackId="a"
                      fill="#3b82f6"
                      name="Permanent"
                    />
                    <Bar
                      dataKey="contractor"
                      stackId="a"
                      fill="#f59e0b"
                      name="Contractor"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Team Composition Table */}
          <Card>
            <CardHeader>
              <CardTitle>Team Composition Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Team</th>
                      <th className="text-left py-2">Division</th>
                      <th className="text-left py-2">Size</th>
                      <th className="text-left py-2">Permanent</th>
                      <th className="text-left py-2">Contractors</th>
                      <th className="text-left py-2">Contractor Risk</th>
                      <th className="text-left py-2">Avg Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map(team => (
                      <tr key={team.teamId} className="border-b">
                        <td className="py-2 font-medium">{team.teamName}</td>
                        <td className="py-2">{team.divisionName}</td>
                        <td className="py-2">
                          <Badge
                            variant={
                              team.isOverSized
                                ? 'destructive'
                                : team.isUnderSized
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {team.memberCount}
                          </Badge>
                        </td>
                        <td className="py-2">{team.permanentCount}</td>
                        <td className="py-2">{team.contractorCount}</td>
                        <td className="py-2">
                          <Badge
                            variant={
                              team.contractorRisk === 'high'
                                ? 'destructive'
                                : team.contractorRisk === 'medium'
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {team.contractorRisk}
                          </Badge>
                        </td>
                        <td className="py-2">
                          ${(team.avgSalary / 1000).toFixed(0)}K
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost per Team */}
            <Card>
              <CardHeader>
                <CardTitle>Team Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip formatter={value => [`$${value}K`, '']} />
                    <Bar
                      dataKey="totalCost"
                      fill="#10b981"
                      name="Total Cost ($K)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Efficiency Scatter */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Efficiency vs Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={costAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="utilization" name="Utilization %" />
                    <YAxis
                      dataKey="costPerPerson"
                      name="Cost per Person ($K)"
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter dataKey="costPerPerson" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${(portfolioMetrics.avgCostPerPerson / 1000).toFixed(0)}K
                    </div>
                    <p className="text-sm text-gray-500">Avg Cost per Person</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${(portfolioMetrics.monthlyBurnRate / 1000).toFixed(0)}K
                    </div>
                    <p className="text-sm text-gray-500">Monthly Burn Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {portfolioMetrics.avgTeamSize.toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-500">Avg Team Size</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          {/* Risk Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Team Risk Assessment Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={riskHeatmapData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="size" name="Team Size" />
                  <YAxis dataKey="risk" name="Risk Score" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter dataKey="risk" fill="#ef4444" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* High Risk Teams */}
          <Card>
            <CardHeader>
              <CardTitle>High Risk Teams Requiring Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics
                  .filter(team => team.riskScore > 50)
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map(team => (
                    <div key={team.teamId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{team.teamName}</h4>
                          <p className="text-sm text-gray-500">
                            {team.divisionName}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          Risk: {team.riskScore}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {team.recommendedActions.map((action, index) => (
                          <div
                            key={index}
                            className="flex items-center text-sm"
                          >
                            <ArrowRight className="h-3 w-3 mr-2 text-red-500" />
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {/* Optimization Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-4 w-4 mr-2 text-green-600" />
                  Teams to Grow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {portfolioMetrics.undersizedTeams}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Teams below optimal size
                </p>
                <div className="space-y-2">
                  {analytics
                    .filter(team => team.isUnderSized)
                    .map(team => (
                      <div
                        key={team.teamId}
                        className="flex justify-between text-sm"
                      >
                        <span>{team.teamName}</span>
                        <Badge variant="secondary">
                          {team.memberCount} → {team.optimalSize}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Minus className="h-4 w-4 mr-2 text-red-600" />
                  Teams to Split
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {portfolioMetrics.oversizedTeams}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Teams above optimal size
                </p>
                <div className="space-y-2">
                  {analytics
                    .filter(team => team.isOverSized)
                    .map(team => (
                      <div
                        key={team.teamId}
                        className="flex justify-between text-sm"
                      >
                        <span>{team.teamName}</span>
                        <Badge variant="destructive">
                          {team.memberCount} people
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-orange-600" />
                  Contractor Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {portfolioMetrics.highContractorRiskTeams}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  High contractor dependency
                </p>
                <div className="space-y-2">
                  {analytics
                    .filter(team => team.contractorRisk === 'high')
                    .map(team => (
                      <div
                        key={team.teamId}
                        className="flex justify-between text-sm"
                      >
                        <span>{team.teamName}</span>
                        <Badge variant="destructive">
                          {Math.round(
                            (team.contractorCount / team.memberCount) * 100
                          )}
                          %
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Optimization */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Potential Annual Savings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Right-sizing teams:</span>
                      <span className="font-medium">$2.4M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Contractor optimization:</span>
                      <span className="font-medium">$1.8M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Role level optimization:</span>
                      <span className="font-medium">$0.9M</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total Potential:</span>
                      <span className="text-green-600">$5.1M</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Implementation Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Q1: Team restructuring</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm">
                        Q2: Contractor transitions
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm">Q3: Role optimizations</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Strategic Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium">
                      Expand High-Performing Teams
                    </h4>
                    <p className="text-sm text-gray-600">
                      3 teams show excellent productivity metrics and could
                      benefit from strategic growth
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium">New Team Formation</h4>
                    <p className="text-sm text-gray-600">
                      Consider forming 2 new teams in the Platform division to
                      support growing demand
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium">Cross-Team Collaboration</h4>
                    <p className="text-sm text-gray-600">
                      Establish shared services team to reduce duplication
                      across 8 teams
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-4 w-4 mr-2 text-yellow-600" />
                  Talent Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-medium">Senior Talent Acquisition</h4>
                    <p className="text-sm text-gray-600">
                      Prioritize hiring 12 senior engineers across 6 teams to
                      improve mentorship ratios
                    </p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-medium">Contractor Transition Plan</h4>
                    <p className="text-sm text-gray-600">
                      Convert 8 high-performing contractors to permanent roles
                      to reduce risk
                    </p>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-medium">Leadership Development</h4>
                    <p className="text-sm text-gray-600">
                      Develop 4 technical leads for future team expansion
                      opportunities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Roadmap */}
          <Card>
            <CardHeader>
              <CardTitle>12-Month Implementation Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    quarter: 'Q1 2024',
                    focus: 'Stabilization & Assessment',
                    actions: [
                      'Complete team composition analysis',
                      'Begin contractor conversion process',
                      'Implement team size optimizations',
                    ],
                  },
                  {
                    quarter: 'Q2 2024',
                    focus: 'Strategic Hiring',
                    actions: [
                      'Hire 8 senior engineers',
                      'Form new Platform Services team',
                      'Launch leadership development program',
                    ],
                  },
                  {
                    quarter: 'Q3 2024',
                    focus: 'Optimization & Growth',
                    actions: [
                      'Split oversized teams',
                      'Establish cross-team collaboration',
                      'Implement cost optimization measures',
                    ],
                  },
                  {
                    quarter: 'Q4 2024',
                    focus: 'Scale & Efficiency',
                    actions: [
                      'Launch shared services initiatives',
                      'Complete team restructuring',
                      'Measure and adjust team performance',
                    ],
                  },
                ].map((quarter, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{quarter.quarter}</h4>
                        <p className="text-sm text-gray-600">{quarter.focus}</p>
                      </div>
                    </div>
                    <div className="ml-11 space-y-1">
                      {quarter.actions.map((action, actionIndex) => (
                        <div
                          key={actionIndex}
                          className="flex items-center text-sm"
                        >
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                          {action}
                        </div>
                      ))}
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

export default EnterpriseTeamAnalytics;
