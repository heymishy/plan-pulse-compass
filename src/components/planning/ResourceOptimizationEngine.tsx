
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter
} from 'recharts';
import { 
  Target, Users, TrendingUp, AlertCircle, Zap, 
  RefreshCw, CheckCircle, ArrowRight 
} from 'lucide-react';
import { optimizeBudgetAllocation } from '@/utils/budgetOptimization';

const ResourceOptimizationEngine = () => {
  const { teams, people, projects, divisions, roles, allocations, cycles } = useApp();
  const [optimizationMode, setOptimizationMode] = useState<'efficiency' | 'capacity' | 'skills'>('efficiency');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Generate optimization recommendations
  const optimizationData = useMemo(() => {
    const filteredTeams = selectedDivision === 'all' ? 
      teams : teams.filter(t => t.divisionId === selectedDivision);

    return filteredTeams.map(team => {
      const teamMembers = people.filter(p => p.teamId === team.id && p.isActive);
      const currentUtilization = 75 + Math.random() * 20; // Mock current utilization
      const optimalUtilization = 85;
      const skillBalance = Math.random() * 40 + 60; // Mock skill balance score
      
      return {
        teamId: team.id,
        teamName: team.name,
        currentUtilization,
        optimalUtilization,
        utilizationGap: optimalUtilization - currentUtilization,
        skillBalance,
        memberCount: teamMembers.length,
        capacity: team.capacity,
        efficiency: currentUtilization < 60 ? 'low' : currentUtilization > 90 ? 'high' : 'optimal'
      };
    });
  }, [teams, people, selectedDivision]);

  const runOptimization = async () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = {
      improvements: [
        {
          type: 'rebalance',
          teamId: optimizationData[0]?.teamId,
          teamName: optimizationData[0]?.teamName,
          action: 'Redistribute 15% workload to underutilized team members',
          impact: '+12% efficiency',
          effort: 'Medium'
        },
        {
          type: 'skill-gap',
          teamId: optimizationData[1]?.teamId,
          teamName: optimizationData[1]?.teamName,
          action: 'Cross-train 2 team members in React development',
          impact: '+8% project velocity',
          effort: 'High'
        },
        {
          type: 'capacity',
          teamId: optimizationData[2]?.teamId,
          teamName: optimizationData[2]?.teamName,
          action: 'Add 1 senior developer to reduce bottlenecks',
          impact: '+20% capacity',
          effort: 'High'
        }
      ],
      projectedGains: {
        efficiencyImprovement: 15,
        capacityIncrease: 12,
        costSavings: 85000,
        timeToImplement: '6-8 weeks'
      }
    };
    
    setOptimizationResults(results);
    setIsOptimizing(false);
  };

  const getEfficiencyDistribution = () => {
    const distribution = { low: 0, optimal: 0, high: 0 };
    optimizationData.forEach(team => {
      distribution[team.efficiency as keyof typeof distribution]++;
    });
    
    return [
      { name: 'Low Efficiency', value: distribution.low, color: '#ef4444' },
      { name: 'Optimal', value: distribution.optimal, color: '#10b981' },
      { name: 'Over-utilized', value: distribution.high, color: '#f59e0b' }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resource Optimization Engine</h2>
          <p className="text-gray-600">AI-powered resource allocation and efficiency optimization</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="w-48">
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
          <Button onClick={runOptimization} disabled={isOptimizing}>
            {isOptimizing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Avg Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(optimizationData.reduce((sum, t) => sum + t.currentUtilization, 0) / optimizationData.length).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Target: 85%</p>
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
            <div className="text-2xl font-bold text-green-600">
              {optimizationData.length}
            </div>
            <p className="text-xs text-gray-500">Active teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Optimization Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {optimizationData.filter(t => Math.abs(t.utilizationGap) > 10).length}
            </div>
            <p className="text-xs text-gray-500">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Potential Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {optimizationResults ? optimizationResults.projectedGains.efficiencyImprovement : 0}%
            </div>
            <p className="text-xs text-gray-500">Efficiency gain</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analysis">Current Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="simulation">What-If Simulation</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          {/* Team Utilization Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Team Utilization Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={optimizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="teamName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="currentUtilization" fill="#8884d8" name="Current %" />
                  <Bar dataKey="optimalUtilization" fill="#82ca9d" name="Optimal %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Details */}
          <Card>
            <CardHeader>
              <CardTitle>Team Optimization Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationData.map(team => (
                  <div key={team.teamId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{team.teamName}</h4>
                      <Badge variant={
                        team.efficiency === 'optimal' ? 'default' :
                        team.efficiency === 'low' ? 'destructive' : 'secondary'
                      }>
                        {team.efficiency === 'optimal' ? 'Optimal' :
                         team.efficiency === 'low' ? 'Under-utilized' : 'Over-utilized'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Current Utilization</p>
                        <Progress value={team.currentUtilization} className="h-2" />
                        <span className="text-sm font-medium">{team.currentUtilization.toFixed(1)}%</span>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Skill Balance</p>
                        <Progress value={team.skillBalance} className="h-2" />
                        <span className="text-sm font-medium">{team.skillBalance.toFixed(1)}%</span>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Team Size</p>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{team.memberCount} members</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          {optimizationResults ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Optimization Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Projected Improvements</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Efficiency Improvement:</span>
                          <span className="font-medium text-green-600">
                            +{optimizationResults.projectedGains.efficiencyImprovement}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Capacity Increase:</span>
                          <span className="font-medium text-blue-600">
                            +{optimizationResults.projectedGains.capacityIncrease}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual Cost Savings:</span>
                          <span className="font-medium text-purple-600">
                            ${(optimizationResults.projectedGains.costSavings / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Implementation Time:</span>
                          <span className="font-medium">{optimizationResults.projectedGains.timeToImplement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {optimizationResults.improvements.map((improvement: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline">{improvement.teamName}</Badge>
                              <Badge className={
                                improvement.effort === 'Low' ? 'bg-green-500' :
                                improvement.effort === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                              }>
                                {improvement.effort} Effort
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{improvement.action}</p>
                            <p className="text-sm font-medium text-green-600">{improvement.impact}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Run Optimization Analysis</h3>
                <p className="text-gray-600 mb-4">
                  Click "Run Optimization" to analyze your teams and generate AI-powered recommendations.
                </p>
                <Button onClick={runOptimization}>
                  <Zap className="h-4 w-4 mr-2" />
                  Start Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="simulation">
          <Card>
            <CardHeader>
              <CardTitle>What-If Scenario Simulation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Scenario Simulation</h3>
                <p className="text-gray-600 mb-4">
                  Model different resource allocation scenarios and their impact on team performance.
                </p>
                <Button variant="outline">
                  Configure Scenarios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceOptimizationEngine;
