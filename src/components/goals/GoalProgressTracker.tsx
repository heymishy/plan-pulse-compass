
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { Goal } from '@/types/goalTypes';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, Target } from 'lucide-react';

interface GoalProgressTrackerProps {
  goalId?: string;
}

const GoalProgressTracker: React.FC<GoalProgressTrackerProps> = ({ goalId }) => {
  const { goals, updateGoal, cycles, people } = useApp();

  const targetGoal = goalId ? goals.find(g => g.id === goalId) : null;
  const goalsToShow = targetGoal ? [targetGoal] : goals;

  const updateGoalProgress = (goal: Goal, newValue: number) => {
    updateGoal(goal.id, {
      metric: {
        ...goal.metric,
        current: newValue
      }
    });
  };

  const getProgressPercentage = (goal: Goal) => {
    if (goal.metric.target === 0) return 0;
    return Math.min((goal.metric.current / goal.metric.target) * 100, 100);
  };

  const getProgressColor = (goal: Goal) => {
    const progress = getProgressPercentage(goal);
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLevel = (goal: Goal) => {
    const progress = getProgressPercentage(goal);
    const confidence = goal.confidence;
    
    if (progress < 30 && confidence < 0.5) return 'high';
    if (progress < 60 && confidence < 0.7) return 'medium';
    return 'low';
  };

  const getCycleName = (cycleId: string) => {
    const cycle = cycles.find(c => c.id === cycleId);
    return cycle?.name || 'Unknown';
  };

  const getPersonName = (personId?: string) => {
    if (!personId) return 'Unassigned';
    const person = people.find(p => p.id === personId);
    return person?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Goal Progress Tracking</h3>
        {goalId && (
          <Badge variant="outline">
            Tracking Single Goal
          </Badge>
        )}
      </div>

      {goalsToShow.map((goal) => {
        const progress = getProgressPercentage(goal);
        const riskLevel = getRiskLevel(goal);
        
        return (
          <Card key={goal.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{goal.title}</CardTitle>
                  <div className="flex items-center mt-2 text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {getCycleName(goal.timeFrame)}
                    </div>
                    <div className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      {getPersonName(goal.ownerId)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={riskLevel === 'high' ? 'border-red-500 text-red-700' : 
                              riskLevel === 'medium' ? 'border-yellow-500 text-yellow-700' : 
                              'border-green-500 text-green-700'}
                  >
                    {riskLevel === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {riskLevel.toUpperCase()} Risk
                  </Badge>
                  <Badge variant="secondary">
                    {Math.round(goal.confidence * 100)}% Confidence
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className={`text-sm font-semibold ${getProgressColor(goal)}`}>
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>Current: {goal.metric.current}{goal.metric.unit}</span>
                  <span>Target: {goal.metric.target}{goal.metric.unit}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {goal.metric.direction === 'increase' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-xs ml-1">
                    {goal.metric.direction === 'increase' ? 'Higher is better' : 'Lower is better'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newValue = prompt(`Update current value for "${goal.title}"`, goal.metric.current.toString());
                    if (newValue !== null && !isNaN(Number(newValue))) {
                      updateGoalProgress(goal, Number(newValue));
                    }
                  }}
                >
                  Update Progress
                </Button>
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(goal.updatedDate).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {goalsToShow.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            No goals available for tracking.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoalProgressTracker;
