import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ProjectSolution,
  ProjectSkill,
  Solution,
  Skill,
  PersonSkill,
  Person,
  Team,
} from '@/types';
import { getProjectRequiredSkills } from '@/utils/skillBasedPlanning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  X,
  Star,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';

interface ProjectSolutionsSkillsSectionProps {
  projectId: string;
  projectSolutions: ProjectSolution[];
  projectSkills: ProjectSkill[];
  onSolutionsChange: (solutions: ProjectSolution[]) => void;
  onSkillsChange: (skills: ProjectSkill[]) => void;
}

interface SkillAnalysis {
  skillId: string;
  skillName: string;
  category: string;
  required: boolean;
  importance: 'low' | 'medium' | 'high';
  source: 'solution' | 'manual';
  teamCoverage: {
    available: number;
    total: number;
    proficiencyLevels: { [key: string]: number };
  };
  gap: 'covered' | 'partial' | 'missing';
}

const ProjectSolutionsSkillsSection: React.FC<
  ProjectSolutionsSkillsSectionProps
> = ({
  projectId,
  projectSolutions,
  projectSkills,
  onSolutionsChange,
  onSkillsChange,
}) => {
  const { projects, solutions, skills, people, teams, personSkills } = useApp();
  const project = projects.find(p => p.id === projectId);

  // Form states
  const [showAddSolution, setShowAddSolution] = useState(false);
  const [selectedSolutionId, setSelectedSolutionId] = useState('');
  const [solutionImportance, setSolutionImportance] = useState<
    'low' | 'medium' | 'high'
  >('medium');
  const [solutionNotes, setSolutionNotes] = useState('');

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillImportance, setSkillImportance] = useState<
    'low' | 'medium' | 'high'
  >('medium');
  const [skillNotes, setSkillNotes] = useState('');

  // Get available solutions (not already added)
  const availableSolutions = useMemo(
    () =>
      (solutions || []).filter(
        solution =>
          !(projectSolutions || []).some(ps => ps.solutionId === solution.id)
      ),
    [solutions, projectSolutions]
  );

  const allProjectSkillsInfo = useMemo(() => {
    if (!project) return [];
    return getProjectRequiredSkills(
      project,
      projectSkills,
      solutions,
      skills,
      projectSolutions
    );
  }, [project, projectSkills, solutions, skills, projectSolutions]);

  // Combined skills (from solutions + manual)
  const allProjectSkills = useMemo(() => {
    const combined = allProjectSkillsInfo.map(info => ({
      id: `${info.source}-${projectId}-${info.skillId}`,
      projectId,
      skillId: info.skillId,
      importance:
        projectSkills.find(ps => ps.skillId === info.skillId)?.importance ||
        'medium',
      notes: projectSkills.find(ps => ps.skillId === info.skillId)?.notes,
    }));

    return combined;
  }, [allProjectSkillsInfo, projectId, projectSkills]);

  // Skill analysis for forward planning
  const skillAnalysis = useMemo((): SkillAnalysis[] => {
    if (!allProjectSkillsInfo) return [];
    return allProjectSkillsInfo
      .map(ps => {
        const skill = (skills || []).find(s => s.id === ps.skillId);
        if (!skill) return null;

        // Calculate team coverage
        const teamMembers = (people || []).filter(p =>
          (teams || []).some(t => t.id === p.teamId)
        );

        const skillHolders = teamMembers.filter(person =>
          (personSkills || []).some(
            pSkill =>
              pSkill.personId === person.id && pSkill.skillId === ps.skillId
          )
        );

        const proficiencyLevels = skillHolders.reduce(
          (acc, person) => {
            const pSkill = (personSkills || []).find(
              pSkill =>
                pSkill.personId === person.id && pSkill.skillId === ps.skillId
            );
            if (pSkill) {
              acc[pSkill.proficiencyLevel] =
                (acc[pSkill.proficiencyLevel] || 0) + 1;
            }
            return acc;
          },
          {} as { [key: string]: number }
        );

        const coveragePercent =
          teamMembers.length > 0
            ? (skillHolders.length / teamMembers.length) * 100
            : 0;

        let gap: 'covered' | 'partial' | 'missing';
        if (coveragePercent >= 50) gap = 'covered';
        else if (coveragePercent > 0) gap = 'partial';
        else gap = 'missing';

        return {
          skillId: ps.skillId,
          skillName: skill.name,
          category: skill.category,
          required:
            projectSkills.find(p => p.skillId === ps.skillId)?.importance ===
            'high',
          importance:
            projectSkills.find(p => p.skillId === ps.skillId)?.importance ||
            'medium',
          source: ps.source,
          teamCoverage: {
            available: skillHolders.length,
            total: teamMembers.length,
            proficiencyLevels,
          },
          gap,
        };
      })
      .filter(Boolean) as SkillAnalysis[];
  }, [
    allProjectSkillsInfo,
    skills,
    people,
    teams,
    personSkills,
    projectSkills,
  ]);

  // Available skills for manual addition
  const availableSkills = useMemo(
    () =>
      (skills || []).filter(
        skill => !allProjectSkills.some(ps => ps.skillId === skill.id)
      ),
    [skills, allProjectSkills]
  );

  const handleAddSolution = () => {
    if (!selectedSolutionId) return;

    const newSolution: ProjectSolution = {
      id: `ps-${Date.now()}`,
      projectId,
      solutionId: selectedSolutionId,
      importance: solutionImportance,
      notes: solutionNotes.trim() || undefined,
    };

    onSolutionsChange([...projectSolutions, newSolution]);

    // Reset form
    setSelectedSolutionId('');
    setSolutionImportance('medium');
    setSolutionNotes('');
    setShowAddSolution(false);
  };

  const handleRemoveSolution = (solutionId: string) => {
    onSolutionsChange(
      projectSolutions.filter(ps => ps.solutionId !== solutionId)
    );
  };

  const handleAddSkill = () => {
    if (!selectedSkillId) return;

    const newSkill: ProjectSkill = {
      id: `pk-${Date.now()}`,
      projectId,
      skillId: selectedSkillId,
      importance: skillImportance,
      notes: skillNotes.trim() || undefined,
    };

    onSkillsChange([...projectSkills, newSkill]);

    // Reset form
    setSelectedSkillId('');
    setSkillImportance('medium');
    setSkillNotes('');
    setShowAddSkill(false);
  };

  const handleRemoveSkill = (skillId: string) => {
    onSkillsChange(projectSkills.filter(ps => ps.skillId !== skillId));
  };

  const getImportanceBadgeVariant = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getGapIcon = (gap: string) => {
    switch (gap) {
      case 'covered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'missing':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="project-solutions-skills-section">
      <Tabs defaultValue="solutions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="analysis">Team Analysis</TabsTrigger>
        </TabsList>

        {/* Solutions Tab */}
        <TabsContent value="solutions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Project Solutions</span>
                <Button
                  onClick={() => setShowAddSolution(true)}
                  size="sm"
                  disabled={availableSolutions.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Solution
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectSolutions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No solutions selected. Add solutions to automatically populate
                  required skills.
                </p>
              ) : (
                <div className="space-y-3">
                  {(projectSolutions || []).map(ps => {
                    const solution = (solutions || []).find(
                      s => s.id === ps.solutionId
                    );
                    if (!solution) return null;

                    return (
                      <div
                        key={ps.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{solution.name}</h4>
                            <Badge
                              variant={getImportanceBadgeVariant(ps.importance)}
                            >
                              {ps.importance}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {solution.description}
                          </p>
                          {solution.skills && solution.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {solution.skills.map(skillId => {
                                const skill = (skills || []).find(
                                  s => s.id === skillId
                                );
                                return skill ? (
                                  <Badge
                                    key={skillId}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {skill.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}
                          {ps.notes && (
                            <p className="text-sm text-gray-500 mt-1">
                              {ps.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSolution(ps.solutionId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Solution Form */}
              {showAddSolution && (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="solution-select">Solution</Label>
                        <Select
                          value={selectedSolutionId}
                          onValueChange={setSelectedSolutionId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a solution" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSolutions.map(solution => (
                              <SelectItem key={solution.id} value={solution.id}>
                                {solution.name} ({solution.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="solution-importance">Importance</Label>
                        <Select
                          value={solutionImportance}
                          onValueChange={(value: 'low' | 'medium' | 'high') =>
                            setSolutionImportance(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="solution-notes">Notes (optional)</Label>
                      <Textarea
                        id="solution-notes"
                        value={solutionNotes}
                        onChange={e => setSolutionNotes(e.target.value)}
                        placeholder="Additional notes about this solution..."
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddSolution(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddSolution}
                        disabled={!selectedSolutionId}
                      >
                        Add Solution
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Project Skills</span>
                <Button
                  onClick={() => setShowAddSkill(true)}
                  size="sm"
                  disabled={availableSkills.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Custom Skill
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allProjectSkills.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No skills defined. Add solutions or custom skills to define
                  project requirements.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Importance</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allProjectSkills.map(ps => {
                      const skill = (skills || []).find(
                        s => s.id === ps.skillId
                      );
                      const isFromSolution =
                        allProjectSkillsInfo?.find(
                          sfs => sfs.skillId === ps.skillId
                        )?.source === 'solution';

                      if (!skill) return null;

                      return (
                        <TableRow key={ps.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{skill.name}</div>
                              {ps.notes && (
                                <div className="text-sm text-gray-500">
                                  {ps.notes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{skill.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getImportanceBadgeVariant(ps.importance)}
                            >
                              {ps.importance}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isFromSolution ? 'default' : 'secondary'}
                            >
                              {isFromSolution ? 'Solution' : 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {!isFromSolution && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSkill(ps.skillId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Add Skill Form */}
              {showAddSkill && (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="skill-select">Skill</Label>
                        <Select
                          value={selectedSkillId}
                          onValueChange={setSelectedSkillId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a skill" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSkills.map(skill => (
                              <SelectItem key={skill.id} value={skill.id}>
                                {skill.name} ({skill.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="skill-importance">Importance</Label>
                        <Select
                          value={skillImportance}
                          onValueChange={(value: 'low' | 'medium' | 'high') =>
                            setSkillImportance(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="skill-notes">Notes (optional)</Label>
                      <Textarea
                        id="skill-notes"
                        value={skillNotes}
                        onChange={e => setSkillNotes(e.target.value)}
                        placeholder="Additional notes about this skill requirement..."
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddSkill(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddSkill}
                        disabled={!selectedSkillId}
                      >
                        Add Skill
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Skill Coverage Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {skillAnalysis.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No skills to analyze. Add solutions or skills to see team
                  coverage.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {
                                skillAnalysis.filter(s => s.gap === 'covered')
                                  .length
                              }
                            </div>
                            <div className="text-sm text-gray-600">
                              Covered Skills
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <div>
                            <div className="text-2xl font-bold text-yellow-600">
                              {
                                skillAnalysis.filter(s => s.gap === 'partial')
                                  .length
                              }
                            </div>
                            <div className="text-sm text-gray-600">
                              Partial Coverage
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <X className="h-4 w-4 text-red-600" />
                          <div>
                            <div className="text-2xl font-bold text-red-600">
                              {
                                skillAnalysis.filter(s => s.gap === 'missing')
                                  .length
                              }
                            </div>
                            <div className="text-sm text-gray-600">
                              Missing Skills
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Analysis */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill</TableHead>
                        <TableHead>Importance</TableHead>
                        <TableHead>Team Coverage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Proficiency Levels</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {skillAnalysis
                        .sort((a, b) => {
                          // Sort by importance then by gap status
                          const importanceOrder = {
                            high: 3,
                            medium: 2,
                            low: 1,
                          };
                          const gapOrder = {
                            missing: 3,
                            partial: 2,
                            covered: 1,
                          };

                          const importanceDiff =
                            importanceOrder[b.importance] -
                            importanceOrder[a.importance];
                          if (importanceDiff !== 0) return importanceDiff;

                          return gapOrder[b.gap] - gapOrder[a.gap];
                        })
                        .map(analysis => (
                          <TableRow key={analysis.skillId}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {analysis.skillName}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {analysis.category}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getImportanceBadgeVariant(
                                  analysis.importance
                                )}
                              >
                                {analysis.importance}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={
                                      analysis.teamCoverage.total > 0
                                        ? (analysis.teamCoverage.available /
                                            analysis.teamCoverage.total) *
                                          100
                                        : 0
                                    }
                                    className="flex-1"
                                  />
                                  <span className="text-sm text-gray-600">
                                    {analysis.teamCoverage.available}/
                                    {analysis.teamCoverage.total}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getGapIcon(analysis.gap)}
                                <span className="capitalize">
                                  {analysis.gap}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(
                                  analysis.teamCoverage.proficiencyLevels || {}
                                ).map(([level, count]) => (
                                  <Badge
                                    key={level}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {level}: {count}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectSolutionsSkillsSection;
