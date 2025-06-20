
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, DollarSign, Users, Target, AlertTriangle, 
  FileText, Download, Calendar, Award, Activity 
} from 'lucide-react';

const ExecutiveReporting = () => {
  const { divisions, teams, projects, people, allocations, cycles } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Q4-2024');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');

  // Generate executive summary data
  const executiveSummary = useMemo(() => {
    const totalBudget = divisions.reduce((sum, div) => sum + (div.budget || 0), 0);
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalTeams = teams.length;
    const totalPeople = people.filter(p => p.isActive).length;
    
    return {
      totalBudget,
      activeProjects,
      totalTeams,
      totalPeople,
      budgetUtilization: 78, // Mock percentage
      deliveryEfficiency: 85, // Mock percentage
      riskProjects: projects.filter(p => p.status === 'active').length * 0.15,
      onTrackProjects: projects.filter(p => p.status === 'active').length * 0.85
    };
  }, [divisions, projects, teams, people]);

  // Portfolio performance data
  const portfolioData = useMemo(() => {
    return divisions.map(division => {
      const divisionTeams = teams.filter(t => t.divisionId === division.id);
      const divisionProjects = projects.filter(p => 
        divisionTeams.some(team => 
          allocations.some(a => a.teamId === team.id)
        )
      );
      
      return {
        name: division.name,
        budget: (division.budget || 0) / 1000000,
        projects: divisionProjects.length,
        teams: divisionTeams.length,
        efficiency: Math.floor(Math.random() * 30) + 70,
        utilization: Math.floor(Math.random() * 20) + 75
      };
    });
  }, [divisions, teams, projects, allocations]);

  // Resource utilization data
  const resourceUtilization = useMemo(() => {
    return teams.map(team => ({
      name: team.name,
      capacity: team.capacity,
      utilization: Math.floor(Math.random() * 30) + 60,
      efficiency: Math.floor(Math.random() * 25) + 70
    }));
  }, [teams]);

  // Financial metrics
  const financialTrends = [
    { month: 'Jan', budget: 2.5, actual: 2.3, forecast: 2.4 },
    { month: 'Feb', budget: 2.8, actual: 2.6, forecast: 2.7 },
    { month: 'Mar', budget: 3.2, actual: 3.0, forecast: 3.1 },
    { month: 'Apr', budget: 3.0, actual: 2.9, forecast: 2.95 },
    { month: 'May', budget: 3.5, actual: 3.3, forecast: 3.4 },
    { month: 'Jun', budget: 3.8, actual: 3.6, forecast: 3.7 }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const exportReport = () => {
    console.log('Exporting executive report...');
    // Implementation for report export
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p className="text-gray-600">Strategic overview of portfolio performance and resource utilization</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q4-2024">Q4 2024</SelectItem>
              <SelectItem value="Q3-2024">Q3 2024</SelectItem>
              <SelectItem value="Q2-2024">Q2 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(executiveSummary.totalBudget / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500">Annual allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {executiveSummary.activeProjects}
            </div>
            <p className="text-xs text-gray-500">In delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {executiveSummary.totalPeople}
            </div>
            <p className="text-xs text-gray-500">Active people</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {executiveSummary.budgetUtilization}%
            </div>
            <p className="text-xs text-gray-500">Budget used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {executiveSummary.deliveryEfficiency}%
            </div>
            <p className="text-xs text-gray-500">Delivery rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Math.floor(executiveSummary.riskProjects)}
            </div>
            <p className="text-xs text-gray-500">Projects</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio View</TabsTrigger>
          <TabsTrigger value="financial">Financial Performance</TabsTrigger>
          <TabsTrigger value="resources">Resource Analysis</TabsTrigger>
          <TabsTrigger value="strategic">Strategic Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Division Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={portfolioData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#8884d8" name="Efficiency %" />
                    <Bar dataKey="utilization" fill="#82ca9d" name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={portfolioData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, value}) => `${name}: $${value.toFixed(1)}M`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="budget"
                    >
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-green-600">94%</div>
                  <p className="text-sm text-gray-600">Project Success Rate</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-blue-600">2.3x</div>
                  <p className="text-sm text-gray-600">ROI Multiple</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-purple-600">15%</div>
                  <p className="text-sm text-gray-600">Cost Savings</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-orange-600">87%</div>
                  <p className="text-sm text-gray-600">Team Satisfaction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={financialTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="budget" stroke="#8884d8" name="Budget ($M)" />
                  <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual ($M)" />
                  <Line type="monotone" dataKey="forecast" stroke="#ffc658" name="Forecast ($M)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Variance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span>Under Budget</span>
                    <Badge className="bg-green-500">12% savings</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span>Forecast Accuracy</span>
                    <Badge variant="outline">94%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <span>Reserve Fund</span>
                    <Badge className="bg-yellow-500">$2.1M available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Personnel (65%)</span>
                    <span className="font-semibold">$13.2M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Technology (20%)</span>
                    <span className="font-semibold">$4.1M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Operations (10%)</span>
                    <span className="font-semibold">$2.0M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other (5%)</span>
                    <span className="font-semibold">$1.0M</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={resourceUtilization.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="utilization" fill="#8884d8" name="Utilization %" />
                  <Bar dataKey="efficiency" fill="#82ca9d" name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Capacity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Total Capacity</span>
                    <span className="font-semibold">2,240h/week</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Utilized</span>
                    <span className="font-semibold text-blue-600">1,792h/week</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Available</span>
                    <span className="font-semibold text-green-600">448h/week</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Development</span>
                    <Badge variant="outline">45%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Design</span>
                    <Badge variant="outline">25%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Product</span>
                    <Badge variant="outline">20%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Other</span>
                    <Badge variant="outline">10%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>High Performing</span>
                    <Badge className="bg-green-500">8 teams</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Standard</span>
                    <Badge variant="outline">12 teams</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Needs Support</span>
                    <Badge className="bg-yellow-500">3 teams</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategic Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-800">Capacity Optimization</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Consider redistributing 20% capacity from over-allocated teams to 
                      increase overall portfolio throughput by 15%.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded border border-green-200">
                    <h4 className="font-medium text-green-800">Budget Reallocation</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Current 12% budget surplus can fund 2-3 additional high-priority 
                      initiatives in Q1 2025.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                    <h4 className="font-medium text-yellow-800">Skill Gap Mitigation</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Investment in cloud architecture skills training could reduce 
                      external consulting costs by 30%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <div>
                      <div className="font-medium text-red-800">Resource Constraints</div>
                      <div className="text-sm text-red-600">3 projects at risk</div>
                    </div>
                    <Badge variant="destructive">High</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <div>
                      <div className="font-medium text-yellow-800">Budget Overrun</div>
                      <div className="text-sm text-yellow-600">2 divisions tracking high</div>
                    </div>
                    <Badge className="bg-yellow-500">Medium</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div>
                      <div className="font-medium text-green-800">Delivery Risk</div>
                      <div className="text-sm text-green-600">All projects on track</div>
                    </div>
                    <Badge className="bg-green-500">Low</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Actions Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Immediate (Next 30 days)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Review Project Alpha resource allocation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Approve additional designer hire</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Finalize Q1 2025 budget allocations</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Strategic (Next 90 days)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Launch skills development program</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Implement capacity optimization model</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Establish portfolio governance framework</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveReporting;
