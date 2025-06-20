
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, TrendingUp, AlertTriangle, Target, 
  Calendar, Settings, PieChart, BarChart3 
} from 'lucide-react';
import { DivisionBudget, DivisionQuarterBudget } from '@/types/planningTypes';

const DivisionBudgetManager = () => {
  const { divisions, cycles, projects, teams, allocations } = useApp();
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [budgets, setBudgets] = useState<DivisionBudget[]>([]);

  // Generate mock division budgets for demonstration
  const generateDivisionBudgets = useMemo(() => {
    return divisions.map(division => {
      const divisionTeams = teams.filter(t => t.divisionId === division.id);
      const totalTeamBudget = divisionTeams.reduce((sum, team) => sum + (team.capacity * 52 * 2000), 0); // Rough calculation
      
      const quarters = cycles
        .filter(c => c.type === 'quarterly' && c.name.includes(selectedYear))
        .map(quarter => ({
          quarterId: quarter.id,
          quarterName: quarter.name,
          budgetAllocation: totalTeamBudget / 4,
          forecastSpend: totalTeamBudget / 4 * 0.85,
          actualSpend: totalTeamBudget / 4 * 0.78,
          projectSpend: totalTeamBudget / 4 * 0.6,
          runWorkSpend: totalTeamBudget / 4 * 0.18
        }));

      return {
        id: `budget-${division.id}`,
        divisionId: division.id,
        financialYearId: selectedYear,
        totalBudget: totalTeamBudget,
        runWorkBudget: totalTeamBudget * 0.2,
        projectBudget: totalTeamBudget * 0.8,
        forecastSpend: totalTeamBudget * 0.85,
        actualSpend: totalTeamBudget * 0.78,
        variance: totalTeamBudget * 0.07,
        quarters
      };
    });
  }, [divisions, teams, cycles, selectedYear]);

  const selectedDivisionBudget = generateDivisionBudgets.find(b => b.divisionId === selectedDivision);
  const selectedDivisionData = divisions.find(d => d.id === selectedDivision);

  const getBudgetHealthColor = (utilization: number) => {
    if (utilization > 95) return 'text-red-600';
    if (utilization > 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBudgetHealthBadge = (utilization: number) => {
    if (utilization > 95) return <Badge variant="destructive">Over Budget</Badge>;
    if (utilization > 80) return <Badge className="bg-yellow-500">At Risk</Badge>;
    return <Badge className="bg-green-500">Healthy</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Division Budget Management</h2>
          <p className="text-gray-600">Manage and monitor division-level budget allocation and spending</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Division Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {generateDivisionBudgets.map(budget => {
          const division = divisions.find(d => d.id === budget.divisionId);
          const utilization = (budget.actualSpend / budget.totalBudget) * 100;
          
          return (
            <Card 
              key={budget.id} 
              className={`cursor-pointer transition-all ${
                selectedDivision === budget.divisionId ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedDivision(budget.divisionId)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {division?.name}
                  {getBudgetHealthBadge(utilization)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Budget</span>
                    <span className="font-semibold">
                      ${(budget.totalBudget / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Spent</span>
                    <span className={`font-semibold ${getBudgetHealthColor(utilization)}`}>
                      {utilization.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={utilization} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Division Budget */}
      {selectedDivisionBudget && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly Breakdown</TabsTrigger>
            <TabsTrigger value="allocation">Budget Allocation</TabsTrigger>
            <TabsTrigger value="forecast">Forecast & Variance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  {selectedDivisionData?.name} - Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      ${(selectedDivisionBudget.totalBudget / 1000000).toFixed(1)}M
                    </div>
                    <p className="text-sm text-gray-600">Total Annual Budget</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      ${(selectedDivisionBudget.actualSpend / 1000000).toFixed(1)}M
                    </div>
                    <p className="text-sm text-gray-600">Actual Spend YTD</p>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      ${(selectedDivisionBudget.variance / 1000000).toFixed(1)}M
                    </div>
                    <p className="text-sm text-gray-600">Budget Variance</p>
                  </div>
                </div>

                {/* Budget Breakdown */}
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Budget Allocation</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <span>Project Work</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${(selectedDivisionBudget.projectBudget / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-sm text-gray-600">
                          {((selectedDivisionBudget.projectBudget / selectedDivisionBudget.totalBudget) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                        <span>Run Work</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${(selectedDivisionBudget.runWorkBudget / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-sm text-gray-600">
                          {((selectedDivisionBudget.runWorkBudget / selectedDivisionBudget.totalBudget) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quarterly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Quarterly Budget Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {selectedDivisionBudget.quarters.map(quarter => (
                    <div key={quarter.quarterId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">{quarter.quarterName}</h4>
                        <Badge variant="outline">
                          {((quarter.actualSpend / quarter.budgetAllocation) * 100).toFixed(1)}% utilized
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-semibold text-blue-600">
                            ${(quarter.budgetAllocation / 1000000).toFixed(1)}M
                          </div>
                          <p className="text-xs text-gray-600">Allocated</p>
                        </div>
                        
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-semibold text-green-600">
                            ${(quarter.actualSpend / 1000000).toFixed(1)}M
                          </div>
                          <p className="text-xs text-gray-600">Actual</p>
                        </div>
                        
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="font-semibold text-purple-600">
                            ${(quarter.projectSpend / 1000000).toFixed(1)}M
                          </div>
                          <p className="text-xs text-gray-600">Projects</p>
                        </div>
                        
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-semibold text-gray-600">
                            ${(quarter.runWorkSpend / 1000000).toFixed(1)}M
                          </div>
                          <p className="text-xs text-gray-600">Run Work</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Progress 
                          value={(quarter.actualSpend / quarter.budgetAllocation) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allocation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Budget Allocation Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Project Work Allocation (%)</label>
                      <Input 
                        type="number" 
                        value={80} 
                        min={0} 
                        max={100}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Run Work Allocation (%)</label>
                      <Input 
                        type="number" 
                        value={20} 
                        min={0} 
                        max={100}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Allocation Impact</h4>
                    <p className="text-sm text-blue-700">
                      Current allocation provides capacity for approximately 
                      {Math.floor((selectedDivisionBudget.projectBudget / 500000))} concurrent projects 
                      while maintaining {((selectedDivisionBudget.runWorkBudget / selectedDivisionBudget.totalBudget) * 100).toFixed(0)}% 
                      run work capacity.
                    </p>
                  </div>
                  
                  <Button className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Update Budget Allocation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Forecast & Variance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">Budget Variance Alert</h4>
                    <p className="text-sm text-yellow-700">
                      Current spending is tracking ${(selectedDivisionBudget.variance / 1000).toFixed(0)}K 
                      under budget. Consider reallocating funds to high-priority projects or 
                      maintaining reserve for Q4 initiatives.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded">
                      <div className="text-lg font-bold text-green-600">12%</div>
                      <p className="text-sm text-gray-600">Under Budget</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-lg font-bold text-blue-600">94%</div>
                      <p className="text-sm text-gray-600">Forecast Accuracy</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-lg font-bold text-purple-600">Q4</div>
                      <p className="text-sm text-gray-600">Next Review</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default DivisionBudgetManager;
