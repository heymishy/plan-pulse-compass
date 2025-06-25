
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { Goal } from '@/types/goalTypes';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface ProjectImpact {
  projectId: string;
  projectName: string;
  linkedGoals: Goal[];
  totalGoalProgress: number;
  riskLevel: 'low' | 'medium' | 'high';
  epicCount: number;
  completedEpics: number;
}

const GoalProjectImpactAnalysis: React.FC = () => {
  const { goals, projects, epics, goalEpics } = useApp();

  const projectImpacts = useMemo(() => {
    const impacts: ProjectImpact[] = [];

    projects.forEach(project => {
      // Find epics for this project
      const projectEpics = epics.filter(e => e.projectId === project.id);
      
      // Find goals linked to these epics
      const linkedGoalIds = new Set<string>();
      projectEpics.forEach(epic => {
        goalEpics.forEach(ge => {
          if (ge.epicId === epic.id) {
            linkedGoalIds.add(ge.goalId);
          }
        });
      });

      const linkedGoals = goals.filter(g => linkedGoalIds.has(g.id));
      
      if (linkedGoals.length === 0) return;

      // Calculate metrics
      const totalGoalProgress = linkedGoals.reduce((sum, goal) => {
        const progress = goal.metric.target > 0 ? (goal.metric.current / goal.metric.target) : 0;
        return sum + Math.min(progress, 1);
      }, 0) / linkedGoals.length * 100;

      const averageConfidence = linkedGoals.reduce((sum, goal) => sum + goal.confidence, 0) / linkedGoals.length;
      const atRiskGoals = linkedGoals.filter(g => g.status === 'at-risk').length;

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (totalGoalProgress < 30 || averageConfidence < 0.5 || atRiskGoals > 0) {
        riskLevel = 'high';
      } else if (totalGoalProgress < 60 || averageConfidence < 0.7) {
        riskLevel = 'medium';
      }

      const completedEpics = projectEpics.filter(e => e.status === 'completed').length;

      impacts.push({
        projectId: project.id,
        projectName: project.name,
        linkedGoals,
        totalGoalProgress,
        riskLevel,
        epicCount: projectEpics.length,
        completedEpics
      });
    });

    return impacts.sort((a, b) => b.totalGoalProgress - a.totalGoalProgress);
  }, [goals, projects, epics, goalEpics]);

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high': return 'border-red-500 text-red-700 bg-red-50';
      case 'medium': return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'low': return 'border-green-500 text-green-700 bg-green-50';
    }
  };

  const getRiskIcon = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Goal-to-Project Impact Analysis
        </h3>
        <Badge variant="outline">
          {projectImpacts.length} Projects Analyzed
        </Badge>
      </div>

      {projectImpacts.length > 0 ? (
        <div className="space-y-4">
          {projectImpacts.map(impact => (
            <Card key={impact.projectId} className={`border-l-4 ${getRiskColor(impact.riskLevel)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{impact.projectName}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getRiskColor(impact.riskLevel)}>
                      {getRiskIcon(impact.riskLevel)}
                      <span className="ml-1">{impact.riskLevel.toUpperCase()} Risk</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Goal Progress</span>
                    <span className="text-sm font-semibold">
                      {impact.totalGoalProgress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={impact.totalGoalProgress} className="h-2" />
                </div>

                {/* Epic Progress */}
                <div className="flex items-center justify-between text-sm">
                  <span>Epic Completion</span>
                  <span>
                    {impact.completedEpics} / {impact.epicCount} completed
                  </span>
                </div>

                {/* Linked Goals */}
                <div>
                  <div className="text-sm font-medium mb-2">
                    Linked Goals ({impact.linkedGoals.length})
                  </div>
                  <div className="space-y-2">
                    {impact.linkedGoals.map(goal => {
                      const progress = goal.metric.target > 0 ? (goal.metric.current / goal.metric.target) * 100 : 0;
                      return (
                        <div key={goal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{goal.title}</div>
                            <div className="text-xs text-gray-500">
                              {Math.round(goal.confidence * 100)}% confidence
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {Math.min(progress, 100).toFixed(1)}%
                            </div>
                            <Badge 
                              variant="outline" 
                              className={
                                goal.status === 'completed' ? 'border-green-500 text-green-700' :
                                goal.status === 'at-risk' ? 'border-red-500 text-red-700' :
                                goal.status === 'in-progress' ? 'border-blue-500 text-blue-700' :
                                'border-gray-500 text-gray-700'
                              }
                            >
                              {goal.status.replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            No projects with linked goals found. Link goals to epics to see impact analysis.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoalProjectImpactAnalysis;
