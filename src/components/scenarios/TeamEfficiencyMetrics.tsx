
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell
} from 'recharts';
import { 
  Users, Clock, Target, TrendingUp, Activity, 
  Zap, AlertCircle, CheckCircle 
} from 'lucide-react';

interface TeamEfficiencyMetricsProps {
  teams: any[];
}

const TeamEfficiencyMetrics: React.FC<TeamEfficiencyMetricsProps> = ({ teams }) => {
  const getEfficiencyCategory = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getUtilizationStatus = (availability: number) => {
    if (availability >= 60) return { label: 'Available', color: 'text-green-600', icon: CheckCircle };
    if (availability >= 30) return { label: 'Moderate', color: 'text-yellow-600', icon: Clock };
    return { label: 'Overloaded', color: 'text-red-600', icon: AlertCircle };
  };

  const efficiencyDistribution = teams.reduce((acc, team) => {
    const category = getEfficiencyCategory(team.overallScore);
    acc[category.label] = (acc[category.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(efficiencyDistribution).map(([category, count]) => ({
    category,
    count,
  }));

  const scatterData = teams.map(team => ({
    skillMatch: team.skillMatchPercentage,
    availability: team.availabilityPercentage,
    name: team.teamName,
    overall: team.overallScore,
  }));

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Avg Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(teams.reduce((sum, t) => sum + t.overallScore, 0) / teams.length)}%
            </div>
            <p className="text-xs text-gray-500">Across all teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              High Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {teams.filter(t => t.overallScore >= 80).length}
            </div>
            <p className="text-xs text-gray-500">≥80% efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Available Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {teams.filter(t => t.availabilityPercentage >= 50).length}
            </div>
            <p className="text-xs text-gray-500">≥50% available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {teams.filter(t => t.availabilityPercentage < 20).length}
            </div>
            <p className="text-xs text-gray-500">Overutilized</p>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Team Efficiency Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Skill vs Availability Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Skill Match vs Availability Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="skillMatch" 
                name="Skill Match"
                unit="%" 
                domain={[0, 100]}
              />
              <YAxis 
                dataKey="availability" 
                name="Availability"
                unit="%" 
                domain={[0, 100]}
              />
              <Tooltip 
                formatter={(value, name) => [`${value}%`, name]}
                labelFormatter={(_, payload) => payload[0]?.payload?.name}
              />
              <Scatter dataKey="availability" fill="#8884d8">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={
                    entry.overall >= 80 ? '#22c55e' :
                    entry.overall >= 60 ? '#3b82f6' :
                    entry.overall >= 40 ? '#f59e0b' : '#ef4444'
                  } />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <p>• Top-right quadrant: High skill match + High availability (Ideal)</p>
            <p>• Top-left quadrant: Low skill match + High availability (Training opportunity)</p>
            <p>• Bottom-right quadrant: High skill match + Low availability (Capacity constraint)</p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Team Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Detailed Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teams
            .sort((a, b) => b.overallScore - a.overallScore)
            .map((team, index) => {
              const efficiency = getEfficiencyCategory(team.overallScore);
              const utilization = getUtilizationStatus(team.availabilityPercentage);
              const UtilizationIcon = utilization.icon;
              
              return (
                <div key={team.teamId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold">#{index + 1}</div>
                      <div>
                        <h4 className="font-semibold">{team.teamName}</h4>
                        <p className="text-sm text-gray-600">
                          {team.availablePeople.length} people • {team.totalCapacity}h capacity
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${efficiency.bgColor} ${efficiency.color}`}>
                        {efficiency.label}
                      </Badge>
                      <Badge variant="outline" className={utilization.color}>
                        <UtilizationIcon className="h-3 w-3 mr-1" />
                        {utilization.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Score</span>
                        <span className="font-medium">{Math.round(team.overallScore)}%</span>
                      </div>
                      <Progress value={team.overallScore} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Skill Match</span>
                        <span className="font-medium">{Math.round(team.skillMatchPercentage)}%</span>
                      </div>
                      <Progress value={team.skillMatchPercentage} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Availability</span>
                        <span className="font-medium">{Math.round(team.availabilityPercentage)}%</span>
                      </div>
                      <Progress value={team.availabilityPercentage} className="h-2" />
                    </div>
                  </div>
                  
                  {team.conflictingAllocations.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <div className="flex items-center text-yellow-700">
                        <Clock className="h-4 w-4 mr-1" />
                        {team.usedCapacity}% capacity currently allocated across {team.conflictingAllocations.length} projects
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamEfficiencyMetrics;
