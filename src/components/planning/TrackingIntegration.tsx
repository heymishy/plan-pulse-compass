
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
  LineChart, Line
} from 'recharts';
import { 
  Activity, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, Target, Users, Zap, Clock 
} from 'lucide-react';

const TrackingIntegration = () => {
  const { projects, teams, allocations, cycles, people } = useApp();
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  // Get current cycle
  const currentCycle = useMemo(() => {
    const now = new Date();
    return cycles.find(c => 
      new Date(c.startDate) <= now && new Date(c.endDate) >= now
    ) || cycles[0];
  }, [cycles]);

  // Generate tracking metrics
  const trackingMetrics = useMemo(() => {
    const cycleToAnalyze = selectedCycle ? 
      cycles.find(c => c.id === selectedCycle) : currentCycle;
    
    if (!cycleToAnalyze) return null;

    const cycleAllocations = allocations.filter(a => a.cycleId === cycleToAnalyze.id);
    const activeTeams = selectedTeam === 'all' ? 
      teams : teams.filter(t => t.id === selectedTeam);
    
    // Mock actual vs planned data
    const teamMetrics = activeTeams.map(team => {
      const teamAllocations = cycleAllocations.filter(a => a.teamId === team.id);
      const plannedCapacity = teamAllocations.reduce((sum, a) => sum + a.percentage, 0);
      const actualUtilization = Math.max(0, plannedCapacity + (Math.random() - 0.5) * 20);
      
      return {
        teamId: team.id,
        teamName: team.name,
        plannedCapacity,
        actualUtilization,
        variance: actualUtilization - plannedCapacity,
        efficiency: Math.floor(Math.random() * 30) + 70,
        deliveryScore: Math.floor(Math.random() * 25) + 75
      };
    });

    return {
      cycle: cycleToAnalyze,
      teamMetrics,
      overallVariance: teamMetrics.reduce((sum, tm) => sum + Math.abs(tm.variance), 0) / teamMetrics.length,
      avgEfficiency: teamMetrics.reduce((sum, tm) => sum + tm.efficiency, 0) / teamMetrics.length,
      avgDelivery: teamMetrics.reduce((sum, tm) => sum + tm.deliveryScore, 0) / teamMetrics.length
    };
  }, [selectedCycle, selectedTeam, cycles, currentCycle, allocations, teams]);

  // Velocity trends data
  const velocityTrends = useMemo(() => {
    return cycles.slice(-6).map(cycle => ({
      cycle: cycle.name,
      planned: Math.floor(Math.random() * 20) + 40,
      actual: Math.floor(Math.random() * 25) + 35,
      efficiency: Math.floor(Math.random() * 20) + 75
    }));
  }, [cycles]);

  // Budget vs actual tracking
  const budgetTracking = useMemo(() => {
    return teams.slice(0, 8).map(team => {
      const teamMembers = people.filter(p => p.teamId === team.id && p.isActive);
      const estimatedMonthlyCost = teamMembers.length * 8000; // Rough estimate
      
      return {
        name: team.name,
        budgeted: estimatedMonthlyCost,
        actual: estimatedMonthlyCost * (0.85 + Math.random() * 0.3),
        variance: (Math.random() - 0.5) * estimatedMonthlyCost * 0.2
      };
    });
  }, [teams, people]);

  if (!trackingMetrics) {
    return (
      <div className="p-6 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tracking Data</h3>
        <p className="text-gray-600">No cycles available for tracking analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tracking Integration</h2>
          <p className="text-gray-600">Real-time tracking and variance analysis for planning accuracy</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Current cycle" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map(cycle => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All teams" />
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Planning Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(100 - trackingMetrics.overallVariance).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Avg variance: {trackingMetrics.overallVariance.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Team Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {trackingMetrics.avgEfficiency.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Across {trackingMetrics.teamMetrics.length} teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Delivery Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {trackingMetrics.avgDelivery.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Cycle: {trackingMetrics.cycle.name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {trackingMetrics.teamMetrics.filter(tm => Math.abs(tm.variance) > 15).length}
            </div>
            <p className="text-xs text-gray-500">Teams over variance threshold</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList>
          <TabsTrigger value="realtime">Real-time Tracking</TabsTrigger>
          <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
          <TabsTrigger value="trends">Historical Trends</TabsTrigger>
          <TabsTrigger value="budget">Budget vs Actual</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Current Cycle Performance - {trackingMetrics.cycle.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {trackingMetrics.teamMetrics.map(team => (
                  <div key={team.teamId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{team.teamName}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={Math.abs(team.variance) > 15 ? 'destructive' : 'outline'}
                        >
                          {team.variance > 0 ? '+' : ''}{team.variance.toFixed(1)}% variance
                        </Badge>
                        <Badge variant="secondary">
                          {team.efficiency}% efficiency
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Planned Capacity</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={team.plannedCapacity} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{team.plannedCapacity.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Actual Utilization</p>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={team.actualUtilization} 
                            className="flex-1 h-2" 
                          />
                          <span className="text-sm font-medium">{team.actualUtilization.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Delivery Score</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={team.deliveryScore} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{team.deliveryScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Variance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={trackingMetrics.teamMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="teamName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="plannedCapacity" fill="#8884d8" name="Planned %" />
                  <Bar dataKey="actualUtilization" fill="#82ca9d" name="Actual %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Variance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <h4 className="font-medium text-red-800">High Variance Teams</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {trackingMetrics.teamMetrics.filter(tm => Math.abs(tm.variance) > 15).length} teams 
                      showing >15% variance from plan. Requires immediate attention.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <h4 className="font-medium text-yellow-800">Capacity Adjustment Needed</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Consider rebalancing workload across teams with high over/under utilization.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trackingMetrics.teamMetrics
                    .filter(tm => Math.abs(tm.variance) > 10)
                    .slice(0, 4)
                    .map(team => (
                    <div key={team.teamId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{team.teamName}</span>
                      <Badge variant={team.variance > 0 ? 'destructive' : 'default'}>
                        {team.variance > 0 ? 'Reduce load' : 'Add capacity'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Velocity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={velocityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cycle" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="planned" stroke="#8884d8" name="Planned Velocity" />
                  <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual Velocity" />
                  <Line type="monotone" dataKey="efficiency" stroke="#ffc658" name="Efficiency %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">6-Cycle Average</span>
                    <Badge variant="outline">76% efficiency</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Best Performance</span>
                    <Badge className="bg-green-500">Q2 2024</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Improvement Trend</span>
                    <Badge className="bg-blue-500">+8% YoY</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Based on current trends:</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Next cycle forecast:</span>
                      <span className="font-medium">82% efficiency</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Confidence level:</span>
                      <span className="font-medium">78%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-blue-50 rounded">
                    <span className="font-medium">Seasonal Impact:</span> Q4 shows 12% efficiency drop
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <span className="font-medium">Team Learning:</span> New teams improve 15% by cycle 3
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={budgetTracking}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Bar dataKey="budgeted" fill="#8884d8" name="Budgeted" />
                  <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Variance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {budgetTracking.map(team => (
                  <div key={team.name} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">{team.name}</span>
                      <div className="text-sm text-gray-600">
                        Budget: ${(team.budgeted / 1000).toFixed(0)}K | 
                        Actual: ${(team.actual / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <Badge 
                      variant={team.variance > 0 ? 'destructive' : 'default'}
                      className={team.variance < 0 ? 'bg-green-500' : ''}
                    >
                      {team.variance > 0 ? '+' : ''}${(team.variance / 1000).toFixed(0)}K
                    </Badge>
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

export default TrackingIntegration;
