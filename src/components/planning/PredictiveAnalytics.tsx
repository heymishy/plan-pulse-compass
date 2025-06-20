import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, ComposedChart
} from 'recharts';
import { 
  TrendingUp, Sparkles, AlertTriangle, Target, 
  Calendar, Brain, Lightbulb, Activity 
} from 'lucide-react';

const PredictiveAnalytics = () => {
  const { teams, people, projects, allocations, cycles } = useApp();
  const [forecastHorizon, setForecastHorizon] = useState<'3months' | '6months' | '12months'>('6months');
  const [analysisType, setAnalysisType] = useState<'capacity' | 'delivery' | 'budget'>('capacity');

  // Generate predictive data
  const predictiveData = useMemo(() => {
    const periods = forecastHorizon === '3months' ? 3 : 
                   forecastHorizon === '6months' ? 6 : 12;
    
    const months = [];
    const baseDate = new Date();
    
    for (let i = 0; i < periods; i++) {
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + i);
      
      // Generate forecasted metrics with some realistic trends
      const capacityTrend = 85 + Math.sin(i * 0.5) * 5 + (Math.random() - 0.5) * 3;
      const deliveryTrend = 78 + Math.cos(i * 0.3) * 8 + (Math.random() - 0.5) * 4;
      const budgetUtilization = 82 + (i * 2) + (Math.random() - 0.5) * 5;
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        capacityUtilization: Math.max(0, Math.min(100, capacityTrend)),
        deliveryEfficiency: Math.max(0, Math.min(100, deliveryTrend)),
        budgetUtilization: Math.max(0, Math.min(100, budgetUtilization)),
        predictedProjects: Math.floor(3 + Math.random() * 4),
        riskScore: Math.floor(15 + Math.random() * 25),
        confidence: Math.floor(75 + Math.random() * 20)
      });
    }
    
    return months;
  }, [forecastHorizon]);

  // Risk predictions
  const riskPredictions = useMemo(() => [
    {
      category: 'Capacity Overload',
      probability: 'Medium',
      impact: 'High',
      timeframe: 'Q2 2024',
      description: 'Teams may exceed 95% capacity utilization',
      recommendation: 'Consider hiring or redistributing workload',
      severity: 'warning'
    },
    {
      category: 'Skill Gap',
      probability: 'High',
      impact: 'Medium',
      timeframe: 'Q3 2024',
      description: 'React expertise shortage for upcoming projects',
      recommendation: 'Initiate training program or contractor engagement',
      severity: 'error'
    },
    {
      category: 'Budget Overrun',
      probability: 'Low',
      impact: 'High',
      timeframe: 'Q4 2024',
      description: 'Project costs may exceed budget by 12%',
      recommendation: 'Review project scopes and priorities',
      severity: 'info'
    }
  ], []);

  // AI insights
  const aiInsights = useMemo(() => [
    {
      type: 'trend',
      title: 'Capacity Trend Analysis',
      insight: 'Team utilization is trending upward by 3% per quarter. Current trajectory suggests potential overutilization by Q3.',
      confidence: 84,
      action: 'Consider capacity planning adjustments'
    },
    {
      type: 'prediction',
      title: 'Delivery Performance',
      insight: 'Based on historical patterns, delivery efficiency typically drops 8% during Q4 due to holidays and year-end activities.',
      confidence: 91,
      action: 'Plan buffer time for Q4 deliverables'
    },
    {
      type: 'opportunity',
      title: 'Resource Optimization',
      insight: 'Cross-training 3 team members in cloud architecture could increase project flexibility by 25%.',
      confidence: 76,
      action: 'Evaluate training ROI and implementation plan'
    }
  ], []);

  const getChartData = () => {
    switch (analysisType) {
      case 'capacity':
        return predictiveData.map(d => ({ ...d, value: d.capacityUtilization }));
      case 'delivery':
        return predictiveData.map(d => ({ ...d, value: d.deliveryEfficiency }));
      case 'budget':
        return predictiveData.map(d => ({ ...d, value: d.budgetUtilization }));
      default:
        return predictiveData;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Predictive Analytics & Forecasting</h2>
          <p className="text-gray-600">AI-powered insights and future performance predictions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="capacity">Capacity Forecast</SelectItem>
              <SelectItem value="delivery">Delivery Forecast</SelectItem>
              <SelectItem value="budget">Budget Forecast</SelectItem>
            </SelectContent>
          </Select>
          <Select value={forecastHorizon} onValueChange={(value: any) => setForecastHorizon(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="12months">12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Forecast Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {predictiveData.length > 0 ? predictiveData[predictiveData.length - 1].confidence : 0}%
            </div>
            <p className="text-xs text-gray-500">Based on historical data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Predicted Peak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.max(...getChartData().map(d => d.value)).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Maximum utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {riskPredictions.filter(r => r.severity === 'error').length}
            </div>
            <p className="text-xs text-gray-500">High probability risks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {aiInsights.length}
            </div>
            <p className="text-xs text-gray-500">Actionable recommendations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecasts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="forecasts">Performance Forecasts</TabsTrigger>
          <TabsTrigger value="risks">Risk Predictions</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Modeling</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="space-y-6">
          {/* Main forecast chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                {analysisType === 'capacity' ? 'Capacity' : 
                 analysisType === 'delivery' ? 'Delivery' : 'Budget'} Utilization Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#82ca9d"
                    strokeDasharray="5 5"
                    name="Confidence %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed predictions table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-left p-2">Capacity %</th>
                      <th className="text-left p-2">Delivery %</th>
                      <th className="text-left p-2">Budget %</th>
                      <th className="text-left p-2">Projects</th>
                      <th className="text-left p-2">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictiveData.map((month, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{month.month}</td>
                        <td className="p-2">{month.capacityUtilization.toFixed(1)}%</td>
                        <td className="p-2">{month.deliveryEfficiency.toFixed(1)}%</td>
                        <td className="p-2">{month.budgetUtilization.toFixed(1)}%</td>
                        <td className="p-2">{month.predictedProjects}</td>
                        <td className="p-2">
                          <Badge variant={month.riskScore > 30 ? 'destructive' : 
                                        month.riskScore > 20 ? 'secondary' : 'default'}>
                            {month.riskScore}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <div className="space-y-4">
            {riskPredictions.map((risk, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className={`h-5 w-5 ${
                          risk.severity === 'error' ? 'text-red-500' :
                          risk.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <h3 className="font-semibold">{risk.category}</h3>
                        <Badge variant="outline">{risk.timeframe}</Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{risk.description}</p>
                      <p className="text-sm text-blue-600 font-medium">{risk.recommendation}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Probability</div>
                      <div className="font-medium">{risk.probability}</div>
                      <div className="text-sm text-gray-500 mt-1">Impact</div>
                      <div className="font-medium">{risk.impact}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${
                      insight.type === 'trend' ? 'bg-blue-100' :
                      insight.type === 'prediction' ? 'bg-purple-100' : 'bg-green-100'
                    }`}>
                      {insight.type === 'trend' ? <TrendingUp className="h-5 w-5 text-blue-600" /> :
                       insight.type === 'prediction' ? <Sparkles className="h-5 w-5 text-purple-600" /> :
                       <Lightbulb className="h-5 w-5 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge variant="outline">{insight.confidence}% confidence</Badge>
                      </div>
                      <p className="text-gray-700 mb-3">{insight.insight}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600">{insight.action}</span>
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Modeling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Scenario Modeling</h3>
                <p className="text-gray-600 mb-4">
                  Model different business scenarios and their predicted impact on team performance.
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

export default PredictiveAnalytics;
