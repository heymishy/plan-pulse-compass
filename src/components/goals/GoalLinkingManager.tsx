
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/context/AppContext';
import { Goal } from '@/types/goalTypes';
import { Link, Plus, X, Users, Target, Calendar } from 'lucide-react';

interface GoalLinkingManagerProps {
  goalId?: string;
}

const GoalLinkingManager: React.FC<GoalLinkingManagerProps> = ({ goalId }) => {
  const { 
    goals, 
    epics, 
    projects, 
    teams, 
    goalEpics, 
    setGoalEpics, 
    goalTeams, 
    setGoalTeams 
  } = useApp();
  
  const [selectedGoal, setSelectedGoal] = useState<string>(goalId || '');
  const [newEpicId, setNewEpicId] = useState<string>('');
  const [newTeamId, setNewTeamId] = useState<string>('');

  const currentGoal = goals.find(g => g.id === selectedGoal);
  const linkedEpics = goalEpics.filter(ge => ge.goalId === selectedGoal);
  const linkedTeams = goalTeams.filter(gt => gt.goalId === selectedGoal);

  const availableEpics = epics.filter(e => 
    !linkedEpics.some(ge => ge.epicId === e.id)
  );

  const availableTeams = teams.filter(t => 
    !linkedTeams.some(gt => gt.teamId === t.id)
  );

  const addEpicLink = () => {
    if (!newEpicId || !selectedGoal) return;
    
    const newGoalEpic = {
      id: Date.now().toString(),
      goalId: selectedGoal,
      epicId: newEpicId,
      contribution: 0.5,
      createdDate: new Date().toISOString()
    };
    
    setGoalEpics(prev => [...prev, newGoalEpic]);
    setNewEpicId('');
  };

  const removeEpicLink = (goalEpicId: string) => {
    setGoalEpics(prev => prev.filter(ge => ge.id !== goalEpicId));
  };

  const addTeamLink = () => {
    if (!newTeamId || !selectedGoal) return;
    
    const newGoalTeam = {
      id: Date.now().toString(),
      goalId: selectedGoal,
      teamId: newTeamId,
      responsibility: 'supporting' as const,
      allocation: 0.3,
      createdDate: new Date().toISOString()
    };
    
    setGoalTeams(prev => [...prev, newGoalTeam]);
    setNewTeamId('');
  };

  const removeTeamLink = (goalTeamId: string) => {
    setGoalTeams(prev => prev.filter(gt => gt.id !== goalTeamId));
  };

  const getProjectName = (epicId: string) => {
    const epic = epics.find(e => e.id === epicId);
    if (!epic) return 'Unknown';
    const project = projects.find(p => p.id === epic.projectId);
    return project?.name || 'Unknown';
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Link className="h-5 w-5 mr-2" />
          Goal Linking Manager
        </h3>
        {!goalId && (
          <Select value={selectedGoal} onValueChange={setSelectedGoal}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a goal to manage" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {currentGoal ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-4 w-4 mr-2" />
                {currentGoal.title}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Epic Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linked Epics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {linkedEpics.length > 0 ? (
                <div className="space-y-2">
                  {linkedEpics.map((goalEpic) => {
                    const epic = epics.find(e => e.id === goalEpic.epicId);
                    if (!epic) return null;
                    
                    return (
                      <div key={goalEpic.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{epic.name}</div>
                          <div className="text-sm text-gray-500">
                            Project: {getProjectName(epic.id)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Contribution: {Math.round(goalEpic.contribution * 100)}%
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEpicLink(goalEpic.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm border rounded border-dashed">
                  No epics linked to this goal
                </div>
              )}

              {availableEpics.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center space-x-2">
                    <Select value={newEpicId} onValueChange={setNewEpicId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select an epic to link" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEpics.map((epic) => (
                          <SelectItem key={epic.id} value={epic.id}>
                            <div>
                              <div className="font-medium">{epic.name}</div>
                              <div className="text-xs text-gray-500">
                                {getProjectName(epic.id)}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addEpicLink} disabled={!newEpicId}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Team Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Linked Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {linkedTeams.length > 0 ? (
                <div className="space-y-2">
                  {linkedTeams.map((goalTeam) => {
                    const team = teams.find(t => t.id === goalTeam.teamId);
                    if (!team) return null;
                    
                    return (
                      <div key={goalTeam.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{team.name}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">
                              {goalTeam.responsibility}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {Math.round(goalTeam.allocation * 100)}% allocation
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamLink(goalTeam.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm border rounded border-dashed">
                  No teams linked to this goal
                </div>
              )}

              {availableTeams.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center space-x-2">
                    <Select value={newTeamId} onValueChange={setNewTeamId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a team to link" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addTeamLink} disabled={!newTeamId}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            {goals.length === 0 ? 'No goals available' : 'Select a goal to manage its links'}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoalLinkingManager;
