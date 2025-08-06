import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Filter, X, TrendingUp, Users, Target } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { filterTeamsBySkills } from '@/utils/skillBasedPlanning';
import { Team, Skill } from '@/types';

interface SkillsBasedTeamFilterProps {
  onFilteredTeamsChange: (
    filteredTeams: Array<{
      team: Team;
      compatibilityScore: number;
      matchingSkills: string[];
    }>
  ) => void;
  selectedSkills?: string[];
  onSelectedSkillsChange?: (skills: string[]) => void;
  showCompatibilityScores?: boolean;
  minCompatibilityScore?: number;
  onMinCompatibilityChange?: (score: number) => void;
}

const SkillsBasedTeamFilter: React.FC<SkillsBasedTeamFilterProps> = ({
  onFilteredTeamsChange,
  selectedSkills = [],
  onSelectedSkillsChange,
  showCompatibilityScores = true,
  minCompatibilityScore = 0.3,
  onMinCompatibilityChange,
}) => {
  const { teams, skills } = useApp();
  const [localSelectedSkills, setLocalSelectedSkills] =
    useState<string[]>(selectedSkills);
  const [localMinScore, setLocalMinScore] = useState<number>(
    minCompatibilityScore
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique skill categories
  const skillCategories = useMemo(() => {
    const categories = new Set(skills.map(skill => skill.category));
    return Array.from(categories).sort();
  }, [skills]);

  // Filter skills by category
  const filteredSkills = useMemo(() => {
    if (selectedCategory === 'all') {
      return skills.sort((a, b) => a.name.localeCompare(b.name));
    }
    return skills
      .filter(skill => skill.category === selectedCategory)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [skills, selectedCategory]);

  // Calculate filtered teams
  const filteredTeams = useMemo(() => {
    const skillsToUse = onSelectedSkillsChange
      ? selectedSkills
      : localSelectedSkills;
    const scoreToUse = onMinCompatibilityChange
      ? minCompatibilityScore
      : localMinScore;

    return filterTeamsBySkills(teams, skillsToUse, skills, scoreToUse);
  }, [
    teams,
    skills,
    selectedSkills,
    localSelectedSkills,
    minCompatibilityScore,
    localMinScore,
    onSelectedSkillsChange,
    onMinCompatibilityChange,
  ]);

  // Update parent component when filtered teams change
  React.useEffect(() => {
    onFilteredTeamsChange(filteredTeams);
  }, [filteredTeams, onFilteredTeamsChange]);

  const handleSkillToggle = (skillId: string) => {
    const currentSkills = onSelectedSkillsChange
      ? selectedSkills
      : localSelectedSkills;
    const newSkills = currentSkills.includes(skillId)
      ? currentSkills.filter(id => id !== skillId)
      : [...currentSkills, skillId];

    if (onSelectedSkillsChange) {
      onSelectedSkillsChange(newSkills);
    } else {
      setLocalSelectedSkills(newSkills);
    }
  };

  const handleMinScoreChange = (value: number[]) => {
    const newScore = value[0];
    if (onMinCompatibilityChange) {
      onMinCompatibilityChange(newScore);
    } else {
      setLocalMinScore(newScore);
    }
  };

  const clearAllFilters = () => {
    if (onSelectedSkillsChange) {
      onSelectedSkillsChange([]);
    } else {
      setLocalSelectedSkills([]);
    }

    if (onMinCompatibilityChange) {
      onMinCompatibilityChange(0.3);
    } else {
      setLocalMinScore(0.3);
    }

    setSelectedCategory('all');
  };

  const currentSkills = onSelectedSkillsChange
    ? selectedSkills
    : localSelectedSkills;
  const currentMinScore = onMinCompatibilityChange
    ? minCompatibilityScore
    : localMinScore;

  return (
    <Card className="w-full" data-testid="skills-based-team-filter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Skills-Based Team Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Controls */}
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Category</label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {skillCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skills Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Required Skills</label>
            <div className="flex flex-wrap gap-2 min-h-[100px] p-3 border rounded-lg">
              {filteredSkills.map(skill => {
                const isSelected = currentSkills.includes(skill.id);
                return (
                  <Badge
                    key={skill.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleSkillToggle(skill.id)}
                  >
                    {skill.name}
                    {isSelected && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
            {currentSkills.length > 0 && (
              <div className="text-sm text-gray-600">
                Selected: {currentSkills.length} skill
                {currentSkills.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Compatibility Score Threshold */}
          {showCompatibilityScores && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Minimum Compatibility Score: {Math.round(currentMinScore * 100)}
                %
              </label>
              <Slider
                value={[currentMinScore]}
                onValueChange={handleMinScoreChange}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(currentSkills.length > 0 ||
            currentMinScore > 0.3 ||
            selectedCategory !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All Filters
            </Button>
          )}
        </div>

        <Separator />

        {/* Results Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filter Results</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{filteredTeams.length} teams</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{currentSkills.length} skills</span>
              </div>
            </div>
          </div>

          {/* Filtered Teams List */}
          {filteredTeams.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {filteredTeams.map(
                ({ team, compatibilityScore, matchingSkills }) => (
                  <div
                    key={team.id}
                    className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{team.name}</div>
                      {showCompatibilityScores && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            {Math.round(compatibilityScore * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {matchingSkills.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          Matching Skills:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {matchingSkills.map(skillName => (
                            <Badge
                              key={skillName}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skillName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {team.description && (
                      <div className="text-sm text-gray-600 mt-2">
                        {team.description}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {currentSkills.length === 0 ? (
                <div>
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select skills to filter teams</p>
                </div>
              ) : (
                <div>
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No teams match the selected criteria</p>
                  <p className="text-sm mt-2">
                    Try lowering the compatibility threshold or selecting
                    different skills
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsBasedTeamFilter;
