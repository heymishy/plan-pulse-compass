
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { Goal } from '@/types/goalTypes';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Users,
  BarChart3
} from 'lucide-react';

const JourneyInsightsDashboard: React.FC = () => {
  const { goals, northStar, people, cycles } = useApp();

  const insights = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'in-progress').length;
    const atRiskGoals = goals.filter(g => g.status === 'at-risk').length;
    
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    
    const averageConfidence = goals.length > 0 
      ? goals.reduce((sum, goal) => sum + goal.confidence, 0) / goals.length 
      : 0;

    const averageProgress = goals.length > 0 
      ? goals.reduce((sum, goal) => {
          const progress = goal.metric.target > 0 ? (goal.metric.current / goal.metric.target) : 0;
          return sum + Math.min(progress, 1);
        }, 0) / goals.length * 100
      : 0;

    const highRiskGoals = goals.filter(goal => {
      const progress = goal.metric.target > 0 ? (goal.metric.current / goal.metric.target) * 100 : 0;
      return progress < 30 && goal.confidence < 0.5;
    });

    const topPerformers = goals
      .filter(g => g.status === 'in-progress')
      .sort((a, b) => {
        const aProgress = a.metric.target > 0 ? (a.metric.current / a.metric.target) : 0;
        const bProgress = b.metric.target > 0 ? (b.metric.current / b.metric.target) : 0;
        return bProgress - aProgress;
      })
      .slice(0, 3);

    const timeFrameDistribution = goals.reduce((acc, goal) => {
      const cycleName = cycles.find(c => c.id === goal.timeFrame)?.name || 'Unknown';
      acc[cycleName] = (acc[cycleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalGoals,
      completedGoals,
      activeGoals,
      atRiskGoals,
      completionRate,
      averageConfidence,
      averageProgress,
      highRiskGoals,
      topPerformers,
      timeFrameDistribution
    };
  }, [goals, cycles]);

  const getPersonName = (personId?: string) => {
    if (!personId) return 'Unassigned';
    const person = people.find(p => p.id === personId);
    return person?.name || 'Unknown';
  };

  const getGoalProgress = (goal: Goal) => {
    if (goal.metric.target === 0) return 0;
    return Math.min((goal.metric.current / goal.metric.target) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Journey Insights</h2>
        <Badge variant="outline" className="text-sm">
          {insights.totalGoals} Total Goals
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {insights.completionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {insights.completedGoals} of {insights.totalGoals} goals
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
              Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {insights.averageProgress.toFixed(1)}%
            </div>
            <Progress value={insights.averageProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Target className="h-4 w-4 mr-2 text-purple-500" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(insights.averageConfidence * 100).toFixed(1)}%
            </div>
            <Progress value={insights.averageConfidence * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {insights.atRiskGoals}
            </div>
            <div className="text-xs text-gray-500">
              {insights.highRiskGoals.length} high risk
            </div>
          </CardContent>
        </Card>
      </div>

      {/* North Star Progress */}
      {northStar && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-yellow-500" />
              North Star Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{northStar.title}</span>
                <Badge variant="outline">{northStar.timeHorizon}</Badge>
              </div>
              <Progress 
                value={northStar.metric.target > 0 ? (northStar.metric.current / northStar.metric.target) * 100 : 0} 
                className="h-3" 
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{northStar.metric.current}{northStar.metric.unit}</span>
                <span>Target: {northStar.metric.target}{northStar.metric.unit}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Top Performing Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {insights.topPerformers.map((goal, index) => (
                  <div key={goal.id} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{goal.title}</div>
                      <div className="text-xs text-gray-500">{getPersonName(goal.ownerId)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {getGoalProgress(goal).toFixed(1)}%
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No goals in progress
              </div>
            )}
          </CardContent>
        </Card>

        {/* High Risk Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Goals Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.highRiskGoals.length > 0 ? (
              <div className="space-y-3">
                {insights.highRiskGoals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-2 rounded border border-red-200 bg-red-50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{goal.title}</div>
                      <div className="text-xs text-gray-500">{getPersonName(goal.ownerId)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">
                        {getGoalProgress(goal).toFixed(1)}%
                      </div>
                      <div className="text-xs text-red-500">
                        {Math.round(goal.confidence * 100)}% confident
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No high-risk goals detected
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Frame Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Goals by Time Frame
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(insights.timeFrameDistribution).map(([timeFrame, count]) => (
              <div key={timeFrame} className="text-center p-3 border rounded">
                <div className="text-lg font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600">{timeFrame}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JourneyInsightsDashboard;
