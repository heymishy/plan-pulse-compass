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
import { formatCycleName } from '@/utils/teamUtils';
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
import SearchableSelect from '@/components/common/SearchableSelect';
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
  projectSkills: ProjectSkill[]; // Still needed for backward compatibility, but only used for Team Analysis
  onSolutionsChange: (solutions: ProjectSolution[]) => void;
  onSkillsChange: (skills: ProjectSkill[]) => void; // Still needed for backward compatibility
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
  teamsWithSkill: Array<{
    id: string;
    name: string;
    memberCount: number;
    currentAllocations: Array<{
      projectId: string;
      projectName: string;
      percentage: number;
      cycleId: string;
      isCurrentProject: boolean;
      allocationType: string;
      iterationBreakdown: Array<{
        cycleId: string;
        cycleName: string;
        percentage: number;
      }>;
      totalRunWork: number;
      totalProject: number;
    }>;
  }>;
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
  const {
    projects,
    solutions,
    skills,
    people,
    teams,
    personSkills,
    allocations,
    cycles,
    epics,
  } = useApp();
  const project = projects.find(p => p.id === projectId);

  // Form states
  const [showAddSolution, setShowAddSolution] = useState(false);
  const [selectedSolutionId, setSelectedSolutionId] = useState('');
  const [solutionImportance, setSolutionImportance] = useState<
    'low' | 'medium' | 'high'
  >('medium');
  const [solutionNotes, setSolutionNotes] = useState('');

  // Get available solutions (not already added)
  const availableSolutions = useMemo(
    () =>
      (solutions || []).filter(
        solution =>
          !(projectSolutions || []).some(ps => ps.solutionId === solution.id)
      ),
    [solutions, projectSolutions]
  );

  // Convert solutions to searchable select options
  const solutionOptions = useMemo(
    () =>
      availableSolutions.map(solution => ({
        value: solution.id,
        label: solution.name,
        description: solution.description,
        category: solution.category.replace('-', ' '),
      })),
    [availableSolutions]
  );

  const allProjectSkillsInfo = useMemo(() => {
    if (!project) return [];
    const result = getProjectRequiredSkills(
      project,
      projectSkills,
      solutions,
      skills,
      projectSolutions
    );

    return result;
  }, [project, projectSkills, solutions, skills, projectSolutions]);

  // Solution-derived skills only (no manual project skills)
  const solutionDerivedSkills = useMemo(() => {
    const solutionSkills = allProjectSkillsInfo.filter(
      info => info.source === 'solution'
    );
    const result = solutionSkills.map(info => ({
      id: `solution-${projectId}-${info.skillId}`,
      projectId,
      skillId: info.skillId,
      importance: 'medium' as const, // Default importance for solution-derived skills
      source: info.source,
    }));

    return result;
  }, [allProjectSkillsInfo, projectId]);

  // Skill analysis for forward planning (only solution-derived skills)
  const skillAnalysis = useMemo((): SkillAnalysis[] => {
    const solutionSkills = allProjectSkillsInfo.filter(
      info => info.source === 'solution'
    );
    if (!solutionSkills.length) return [];

    return solutionSkills
      .map(ps => {
        const skill = (skills || []).find(s => s.id === ps.skillId);
        if (!skill) return null;

        // Calculate team coverage - check teams directly (supports 0-member teams)
        const teamsWithSkill = (teams || []).filter(team =>
          team.targetSkills?.includes(ps.skillId)
        );

        // Get all team members from teams that have the skill
        const peopleInSkillTeams = (people || []).filter(person =>
          teamsWithSkill.some(team => team.id === person.teamId)
        );

        // Also get people who have the skill individually (not in skill teams)
        const peopleWithPersonalSkill = (people || []).filter(
          person =>
            (personSkills || []).some(
              pSkill =>
                pSkill.personId === person.id && pSkill.skillId === ps.skillId
            ) && !teamsWithSkill.some(team => team.id === person.teamId)
        );

        // Total people who have access to this skill
        const skillHolders = [
          ...peopleInSkillTeams,
          ...peopleWithPersonalSkill,
        ];

        // Total potential people (all people in organization)
        const allPeople = people || [];

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
          allPeople.length > 0
            ? (skillHolders.length / allPeople.length) * 100
            : teamsWithSkill.length > 0
              ? 100
              : 0; // 100% if teams exist but no people, 0% if no teams

        let gap: 'covered' | 'partial' | 'missing';
        // If teams have the skill, consider it covered even with 0 members
        if (teamsWithSkill.length > 0) {
          gap = skillHolders.length > 0 ? 'covered' : 'partial'; // covered if people in teams, partial if empty teams
        } else if (coveragePercent >= 50) {
          gap = 'covered';
        } else if (coveragePercent > 0) {
          gap = 'partial';
        } else {
          gap = 'missing';
        }

        return {
          skillId: ps.skillId,
          skillName: skill.name,
          category: skill.category,
          required: false, // Solution skills are required by default, but not "high" priority
          importance: 'medium' as const, // Default importance for solution-derived skills
          source: ps.source,
          teamCoverage: {
            available: skillHolders.length,
            total: allPeople.length,
            proficiencyLevels,
          },
          gap,
          teamsWithSkill: teamsWithSkill.map(team => {
            const memberCount = (people || []).filter(
              p => p.teamId === team.id
            ).length;

            // Get current quarter allocations for this team
            const now = new Date();
            const currentQuarterCycles = (cycles || []).filter(c => {
              const cycleStart = new Date(c.startDate);
              const cycleEnd = new Date(c.endDate);
              // Include cycles that overlap with current time or are in current quarter
              return (
                (now >= cycleStart && now <= cycleEnd) ||
                (cycleStart.getFullYear() === now.getFullYear() &&
                  Math.floor(cycleStart.getMonth() / 3) ===
                    Math.floor(now.getMonth() / 3))
              );
            });

            const currentQuarterCycleIds = currentQuarterCycles.map(c => c.id);

            const teamAllocations = (allocations || []).filter(
              alloc =>
                alloc.teamId === team.id &&
                currentQuarterCycleIds.includes(alloc.cycleId) // All current quarter allocations
            );

            // Group by project/epic and create detailed breakdown
            const allocationsByProject = new Map<
              string,
              {
                projectId: string;
                projectName: string;
                isCurrentProject: boolean;
                allocationType: string;
                allocations: Array<{ cycleId: string; percentage: number }>;
              }
            >();

            // Process each allocation
            teamAllocations.forEach(alloc => {
              let allocationType = 'unknown';
              let displayName = 'Unknown';
              let targetProjectId = '';

              if (alloc.epicId) {
                // Epic-based allocation
                const epic = (epics || []).find(e => e.id === alloc.epicId);
                if (epic) {
                  const epicProject = (projects || []).find(
                    p => p.id === epic.projectId
                  );
                  if (epicProject) {
                    allocationType = 'project';
                    displayName = epicProject.name;
                    targetProjectId = epicProject.id;
                  }
                }
              } else if (alloc.projectId) {
                // Direct project allocation
                const directProject = (projects || []).find(
                  p => p.id === alloc.projectId
                );
                if (directProject) {
                  allocationType = 'project';
                  displayName = directProject.name;
                  targetProjectId = directProject.id;
                }
              } else {
                // Run work or other allocation types
                allocationType = 'runwork';
                displayName = 'Run Work';
                targetProjectId = 'runwork';
              }

              if (allocationType === 'unknown') return;

              const key = `${targetProjectId}-${allocationType}`;
              if (!allocationsByProject.has(key)) {
                allocationsByProject.set(key, {
                  projectId: targetProjectId,
                  projectName: displayName,
                  isCurrentProject: targetProjectId === projectId,
                  allocationType,
                  allocations: [],
                });
              }

              allocationsByProject.get(key)!.allocations.push({
                cycleId: alloc.cycleId,
                percentage: alloc.percentage,
              });
            });

            // Calculate total run work and project percentages for this team
            // Use max instead of sum to prevent 600% display from 6x100% iterations
            const runWorkPercentages = teamAllocations
              .filter(alloc => !alloc.epicId && !alloc.projectId)
              .map(alloc => alloc.percentage);
            const totalRunWork =
              runWorkPercentages.length > 0
                ? Math.max(...runWorkPercentages)
                : 0;

            const projectPercentages = teamAllocations
              .filter(alloc => alloc.epicId || alloc.projectId)
              .map(alloc => alloc.percentage);
            const totalProject =
              projectPercentages.length > 0
                ? Math.max(...projectPercentages)
                : 0;

            // Convert to final format with iteration breakdown
            const projectAllocations = Array.from(
              allocationsByProject.values()
            ).map(allocation => {
              // Create iteration breakdown for all cycles in quarter
              const iterationBreakdown = currentQuarterCycles.map(cycle => {
                const cycleAllocation = allocation.allocations.find(
                  a => a.cycleId === cycle.id
                );
                return {
                  cycleId: cycle.id,
                  cycleName:
                    cycle.name || `I${currentQuarterCycles.indexOf(cycle) + 1}`,
                  percentage: cycleAllocation?.percentage || 0,
                };
              });

              const totalPercentage = allocation.allocations.reduce(
                (sum, a) => sum + a.percentage,
                0
              );

              return {
                projectId: allocation.projectId,
                projectName: allocation.projectName,
                percentage: totalPercentage,
                cycleId: allocation.allocations[0]?.cycleId || '',
                isCurrentProject: allocation.isCurrentProject,
                allocationType: allocation.allocationType,
                iterationBreakdown,
                totalRunWork,
                totalProject,
              };
            });

            return {
              id: team.id,
              name: team.name,
              memberCount,
              currentAllocations: projectAllocations,
            };
          }),
        };
      })
      .filter(Boolean) as SkillAnalysis[];
  }, [
    allProjectSkillsInfo,
    skills,
    people,
    teams,
    personSkills,
    allocations,
    projects,
  ]);

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
                      <SearchableSelect
                        label="Solution"
                        placeholder="Select a solution"
                        value={selectedSolutionId}
                        onValueChange={setSelectedSolutionId}
                        options={solutionOptions}
                        searchPlaceholder="Search solutions..."
                        emptyMessage="No available solutions found"
                      />
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

        {/* Skills Tab - Read-only, derived from solutions */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Required Skills (From Solutions)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {solutionDerivedSkills.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No skills defined. Add solutions in the Solutions tab to
                  automatically populate required skills.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <Info className="h-4 w-4 inline mr-2" />
                    Skills are automatically derived from selected solutions. To
                    modify skills, add or remove solutions in the Solutions tab.
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Importance</TableHead>
                        <TableHead>From Solution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solutionDerivedSkills.map(ps => {
                        const skill = (skills || []).find(
                          s => s.id === ps.skillId
                        );
                        const solution = allProjectSkillsInfo
                          .filter(
                            info =>
                              info.skillId === ps.skillId &&
                              info.source === 'solution'
                          )
                          .map(info => {
                            const projectSolution = projectSolutions.find(
                              pSol =>
                                solutions
                                  .find(s => s.id === pSol.solutionId)
                                  ?.skills?.includes(info.skillId)
                            );
                            return projectSolution
                              ? solutions.find(
                                  s => s.id === projectSolution.solutionId
                                )
                              : null;
                          })
                          .filter(Boolean)[0];

                        if (!skill) return null;

                        return (
                          <TableRow key={ps.id}>
                            <TableCell>
                              <div className="font-medium">{skill.name}</div>
                              {skill.description && (
                                <div className="text-sm text-gray-500">
                                  {skill.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{skill.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getImportanceBadgeVariant(
                                  ps.importance
                                )}
                              >
                                {ps.importance}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                {solution?.name || 'Solution'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
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
                        <TableHead className="w-48">Skill</TableHead>
                        <TableHead className="w-64">Teams with Skill</TableHead>
                        <TableHead>Current Allocations</TableHead>
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
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {analysis.skillName}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {analysis.category}
                                  </Badge>
                                  <Badge
                                    variant={getImportanceBadgeVariant(
                                      analysis.importance
                                    )}
                                    className="text-xs"
                                  >
                                    {analysis.importance}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    {getGapIcon(analysis.gap)}
                                    <span className="text-xs text-gray-600 capitalize">
                                      {analysis.gap}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                {analysis.teamsWithSkill.length === 0 ? (
                                  <div className="text-sm text-gray-500 italic">
                                    No teams assigned
                                  </div>
                                ) : (
                                  analysis.teamsWithSkill.map(team => {
                                    // Get proficiency levels for this team and skill
                                    const teamProficiencies = Object.entries(
                                      analysis.teamCoverage.proficiencyLevels ||
                                        {}
                                    )
                                      .filter(([_, count]) => count > 0)
                                      .map(
                                        ([level, count]) => `${level}(${count})`
                                      )
                                      .join(', ');

                                    return (
                                      <div
                                        key={team.id}
                                        className="p-2 bg-gray-50 rounded border"
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="font-medium text-sm">
                                            {team.name}
                                          </div>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {team.memberCount === 0
                                              ? 'Available'
                                              : 'Active'}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          <div>{team.memberCount} members</div>
                                          {teamProficiencies && (
                                            <div>
                                              Skills: {teamProficiencies}
                                            </div>
                                          )}
                                          {team.currentAllocations.length >
                                            0 && (
                                            <div>
                                              {team.currentAllocations.length}{' '}
                                              allocation
                                              {team.currentAllocations.length >
                                              1
                                                ? 's'
                                                : ''}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                {analysis.teamsWithSkill.length === 0 ? (
                                  <div className="text-sm text-gray-500 italic">
                                    No teams with this skill
                                  </div>
                                ) : (
                                  analysis.teamsWithSkill.map(team => (
                                    <div key={team.id} className="space-y-1">
                                      <div className="text-sm font-medium">
                                        {team.name}
                                      </div>
                                      {team.currentAllocations.length === 0 ? (
                                        <div className="text-xs text-gray-500 italic">
                                          No current allocations - Available
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          {/* Summary: Run Work vs Project Split */}
                                          {team.currentAllocations.length >
                                            0 && (
                                            <div className="p-2 bg-gray-50 rounded border text-xs">
                                              <div className="font-semibold text-gray-700 mb-1">
                                                Quarter Summary:
                                              </div>
                                              <div className="flex justify-between">
                                                <span>
                                                  Run Work:{' '}
                                                  {team.currentAllocations[0]
                                                    ?.totalRunWork || 0}
                                                  %
                                                </span>
                                                <span>
                                                  Projects:{' '}
                                                  {team.currentAllocations[0]
                                                    ?.totalProject || 0}
                                                  %
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Individual Project/RunWork Allocations */}
                                          {team.currentAllocations.map(
                                            alloc => (
                                              <div
                                                key={`${alloc.projectId}-${alloc.allocationType}`}
                                                className={`p-2 rounded border text-xs space-y-2 ${
                                                  alloc.isCurrentProject
                                                    ? 'bg-green-50 border-green-200'
                                                    : alloc.allocationType ===
                                                        'runwork'
                                                      ? 'bg-yellow-50 border-yellow-200'
                                                      : 'bg-blue-50 border-blue-200'
                                                }`}
                                              >
                                                {/* Project/RunWork Name and Total */}
                                                <div className="flex items-center justify-between">
                                                  <span className="font-medium">
                                                    {alloc.isCurrentProject
                                                      ? 'Current project allocated'
                                                      : alloc.allocationType ===
                                                          'runwork'
                                                        ? 'Run Work'
                                                        : alloc.projectName}
                                                  </span>
                                                  <Badge
                                                    variant={
                                                      alloc.isCurrentProject
                                                        ? 'default'
                                                        : alloc.allocationType ===
                                                            'runwork'
                                                          ? 'secondary'
                                                          : 'outline'
                                                    }
                                                    className="text-xs"
                                                  >
                                                    {alloc.percentage}%
                                                  </Badge>
                                                </div>

                                                {/* Iteration Breakdown */}
                                                <div className="text-xs text-gray-600">
                                                  <div className="grid grid-cols-3 gap-1">
                                                    {alloc.iterationBreakdown.map(
                                                      iter => (
                                                        <div
                                                          key={iter.cycleId}
                                                          className={`text-center p-1 rounded ${
                                                            iter.percentage > 0
                                                              ? 'bg-white border'
                                                              : 'bg-gray-100'
                                                          }`}
                                                        >
                                                          <div className="font-mono text-xs">
                                                            {iter.cycleName.includes(
                                                              'Q'
                                                            ) &&
                                                            !iter.cycleName.includes(
                                                              'Iteration'
                                                            )
                                                              ? formatCycleName(
                                                                  iter.cycleName,
                                                                  true,
                                                                  false
                                                                )
                                                              : formatCycleName(
                                                                  iter.cycleName,
                                                                  false,
                                                                  true
                                                                )}
                                                          </div>
                                                          <div
                                                            className={
                                                              iter.percentage >
                                                              0
                                                                ? 'font-semibold'
                                                                : ''
                                                            }
                                                          >
                                                            {iter.percentage}%
                                                          </div>
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
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
