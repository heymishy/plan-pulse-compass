import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Lightbulb,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  Squad,
  SquadMember,
  Person,
  Skill,
  SquadSkillGap,
  SquadRecommendation,
} from '@/types';

interface SquadSkillsAnalyzerProps {
  selectedSquad?: Squad;
}

const SquadSkillsAnalyzer: React.FC<SquadSkillsAnalyzerProps> = ({
  selectedSquad,
}) => {
  const {
    squads,
    squadMembers,
    people,
    skills,
    getSquadMembers,
    getSquadSkillGaps,
    generateSquadRecommendations,
  } = useApp();

  const [analysisMode, setAnalysisMode] = useState<
    'overview' | 'gaps' | 'recommendations'
  >('overview');
  const [selectedSkillCategory, setSelectedSkillCategory] =
    useState<string>('all');

  // Calculate skill coverage for all squads or selected squad
  const skillAnalysis = useMemo(() => {
    const targetSquads = selectedSquad ? [selectedSquad] : squads;

    const analysis = targetSquads.map(squad => {
      const members = getSquadMembers(squad.id);
      const memberIds = members.map(m => m.personId);
      const squadPeople = people.filter(p => memberIds.includes(p.id));

      // Get all skills in this squad
      const allMemberSkills = squadPeople.flatMap(
        person =>
          person.skills?.map(skill => ({
            ...skill,
            personId: person.id,
            personName: person.name,
          })) || []
      );

      // Group skills by skill name
      const skillGroups = allMemberSkills.reduce(
        (acc, skill) => {
          if (!acc[skill.skillName]) {
            acc[skill.skillName] = [];
          }
          acc[skill.skillName].push(skill);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Calculate skill metrics
      const skillMetrics = Object.entries(skillGroups).map(
        ([skillName, skillInstances]) => {
          const proficiencyLevels = {
            expert: 4,
            advanced: 3,
            intermediate: 2,
            beginner: 1,
          };
          const avgProficiency =
            skillInstances.reduce(
              (sum, skill) => sum + (proficiencyLevels[skill.proficiency] || 1),
              0
            ) / skillInstances.length;

          const coverage = skillInstances.length / squad.capacity;
          const maxProficiency = Math.max(
            ...skillInstances.map(s => proficiencyLevels[s.proficiency] || 1)
          );

          return {
            skillName,
            coverage: Math.min(coverage * 100, 100),
            avgProficiency,
            maxProficiency,
            memberCount: skillInstances.length,
            members: skillInstances,
            isRequired: squad.targetSkills.includes(skillName),
          };
        }
      );

      // Identify skill gaps
      const skillGaps = getSquadSkillGaps(squad.id);

      return {
        squad,
        skillMetrics: skillMetrics.sort((a, b) => b.coverage - a.coverage),
        skillGaps,
        totalSkills: skillMetrics.length,
        requiredSkillsCovered: skillMetrics.filter(s => s.isRequired).length,
        avgSkillCoverage:
          skillMetrics.reduce((sum, s) => sum + s.coverage, 0) /
            skillMetrics.length || 0,
      };
    });

    return analysis;
  }, [
    selectedSquad,
    squads,
    squadMembers,
    people,
    getSquadMembers,
    getSquadSkillGaps,
  ]);

  // Generate recommendations for selected squad
  const recommendations = useMemo(() => {
    if (!selectedSquad) return [];
    return generateSquadRecommendations(selectedSquad.id);
  }, [selectedSquad, generateSquadRecommendations]);

  const getProficiencyColor = (level: number) => {
    if (level >= 3.5) return 'bg-purple-500';
    if (level >= 2.5) return 'bg-blue-500';
    if (level >= 1.5) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return 'text-green-600';
    if (coverage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGapSeverity = (gap: SquadSkillGap) => {
    if (gap.currentLevel === 0) return 'critical';
    if (gap.requiredLevel - gap.currentLevel >= 2) return 'high';
    if (gap.requiredLevel - gap.currentLevel >= 1) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Skills Analysis</h2>
          <p className="text-muted-foreground">
            {selectedSquad
              ? `Analyzing skills for ${selectedSquad.name}`
              : 'Overview of skills across all squads'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Select
            value={selectedSkillCategory}
            onValueChange={setSelectedSkillCategory}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="leadership">Leadership</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        value={analysisMode}
        onValueChange={(value: any) => setAnalysisMode(value)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {skillAnalysis.map(analysis => (
            <Card key={analysis.squad.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    {analysis.squad.name}
                  </CardTitle>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">
                      {analysis.totalSkills} skills
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(analysis.avgSkillCoverage)}% avg coverage
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.skillMetrics.slice(0, 9).map(skill => (
                    <Card key={skill.skillName} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">
                            {skill.skillName}
                          </h4>
                          {skill.isRequired && (
                            <Star className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getCoverageColor(skill.coverage)}`}
                        >
                          {Math.round(skill.coverage)}%
                        </Badge>
                      </div>

                      <Progress value={skill.coverage} className="h-2 mb-2" />

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{skill.memberCount} members</span>
                        <div className="flex items-center space-x-1">
                          <div
                            className={`w-2 h-2 rounded-full ${getProficiencyColor(skill.avgProficiency)}`}
                          />
                          <span>Avg proficiency</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {analysis.skillMetrics.length > 9 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm">
                      View all {analysis.skillMetrics.length} skills
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6">
          {selectedSquad ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Skill Gaps for {selectedSquad.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skillAnalysis[0]?.skillGaps.length > 0 ? (
                  <div className="space-y-3">
                    {skillAnalysis[0].skillGaps.map((gap, index) => {
                      const severity = getGapSeverity(gap);
                      return (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium">{gap.skillName}</h4>
                              <Badge
                                variant="secondary"
                                className={`text-white ${getSeverityColor(severity)}`}
                              >
                                {severity} priority
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Gap: {gap.requiredLevel - gap.currentLevel}{' '}
                              level(s)
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Current:{' '}
                              </span>
                              <Badge variant="outline">
                                {gap.currentLevel}/4
                              </Badge>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">
                                Required:{' '}
                              </span>
                              <Badge variant="outline">
                                {gap.requiredLevel}/4
                              </Badge>
                            </div>
                          </div>

                          {gap.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {gap.description}
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Skill Gaps</h3>
                    <p>This squad meets all required skill levels</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Squad</h3>
              <p>Choose a squad to analyze skill gaps</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {selectedSquad ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-blue-500" />
                  Recommendations for {selectedSquad.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(rec.priority)}`}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {rec.description}
                            </p>
                            {rec.suggestedAction && (
                              <Button variant="outline" size="sm">
                                {rec.suggestedAction}
                              </Button>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-auto">
                            {rec.priority}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-blue-500 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      No Recommendations
                    </h3>
                    <p>This squad is optimally configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Squad</h3>
              <p>Choose a squad to get optimization recommendations</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SquadSkillsAnalyzer;
