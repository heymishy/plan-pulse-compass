
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { analyzeProjectTeamAvailability } from '@/utils/scenarioAnalysis';

interface ProjectTeamFinderDialogProps {
  children: React.ReactNode;
}

const ProjectTeamFinderDialog: React.FC<ProjectTeamFinderDialogProps> = ({ children }) => {
  const {
    projects, teams, people, skills, personSkills, projectSolutions,
    projectSkills, solutions, allocations, cycles
  } = useApp();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [open, setOpen] = useState(false);

  const analysis = useMemo(() => {
    if (!selectedProjectId) return null;

    try {
      return analyzeProjectTeamAvailability(selectedProjectId, {
        projects, teams, people, skills, personSkills, projectSolutions,
        projectSkills, solutions, allocations, cycles
      });
    } catch (error) {
      console.error('Analysis error:', error);
      return null;
    }
  }, [selectedProjectId, projects, teams, people, skills, personSkills, projectSolutions, projectSkills, solutions, allocations, cycles]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 50) return 'bg-green-500';
    if (availability >= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Find Available Teams for Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project:</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project to analyze..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {analysis && (
            <>
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysis.requiredSkills.length}
                      </div>
                      <div className="text-sm text-gray-600">Required Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analysis.teamMatches.filter(t => t.overallScore >= 70).length}
                      </div>
                      <div className="text-sm text-gray-600">Good Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {analysis.skillGaps.length}
                      </div>
                      <div className="text-sm text-gray-600">Skill Gaps</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {analysis.recommendedActions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Recommendations:</h4>
                      {analysis.recommendedActions.map((action, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Matches */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Team Analysis Results</h3>
                {analysis.teamMatches.map(team => (
                  <Card key={team.teamId} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          {team.teamName}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getScoreColor(team.overallScore)}>
                            {Math.round(team.overallScore)}% Match
                          </Badge>
                          <Badge variant="secondary">
                            {team.availablePeople.length} People
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress Bars */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Skill Match</span>
                            <span>{Math.round(team.skillMatchPercentage)}%</span>
                          </div>
                          <Progress value={team.skillMatchPercentage} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Availability</span>
                            <span>{Math.round(team.availabilityPercentage)}%</span>
                          </div>
                          <Progress 
                            value={team.availabilityPercentage} 
                            className="h-2"
                          />
                        </div>
                      </div>

                      {/* Skill Breakdown */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Skill Coverage:</h5>
                        <div className="flex flex-wrap gap-2">
                          {team.skillBreakdown.map(skill => (
                            <Badge
                              key={skill.skillId}
                              variant={skill.hasSkill ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {skill.skillName}
                              {skill.hasSkill && skill.proficiencyLevel && (
                                <span className="ml-1">({skill.proficiencyLevel})</span>
                              )}
                              {skill.hasSkill && (
                                <span className="ml-1">({skill.personIds.length})</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Current Allocations */}
                      {team.conflictingAllocations.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Current Commitments:
                          </h5>
                          <div className="text-sm text-gray-600">
                            {Math.round(team.usedCapacity)}% capacity currently allocated
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Skill Gaps */}
              {analysis.skillGaps.length > 0 && (
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-600">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Skill Gaps Identified
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.skillGaps.map(gap => (
                        <div key={gap.skillId} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <span className="font-medium">{gap.skillName}</span>
                          <Badge variant="destructive">{gap.importance}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectTeamFinderDialog;
