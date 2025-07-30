import React from 'react';
import { useApp } from '@/context/AppContext';
import { ProjectSkill, ProjectSolution } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus } from 'lucide-react';

interface ProjectSkillsSectionProps {
  projectSolutions: ProjectSolution[];
  projectSkills: ProjectSkill[];
  onSkillsChange: (skills: ProjectSkill[]) => void;
}

const ProjectSkillsSection: React.FC<ProjectSkillsSectionProps> = ({
  projectSolutions,
  projectSkills,
  onSkillsChange,
}) => {
  const { skills, solutions } = useApp();
  const [showAddSkill, setShowAddSkill] = React.useState(false);
  const [selectedSkillId, setSelectedSkillId] = React.useState('');
  const [selectedImportance, setSelectedImportance] = React.useState<
    'critical' | 'important' | 'nice-to-have'
  >('important');

  // Get skills from solutions (read-only)
  const skillsFromSolutions = React.useMemo(() => {
    const skillIds = new Set<string>();
    const result: ProjectSkill[] = [];

    projectSolutions.forEach(ps => {
      const solution = solutions.find(s => s.id === ps.solutionId);
      if (solution) {
        solution.skillIds.forEach(skillId => {
          if (!skillIds.has(skillId)) {
            skillIds.add(skillId);
            result.push({
              id: `solution-${ps.solutionId}-${skillId}`,
              projectId: '', // Will be set by parent
              skillId,
              sourceType: 'solution',
              sourceSolutionId: ps.solutionId,
              importance: 'important' as
                | 'critical'
                | 'important'
                | 'nice-to-have',
            });
          }
        });
      }
    });

    return result;
  }, [projectSolutions, solutions]);

  // Get direct skills (user-added)
  const directSkills = projectSkills.filter(ps => ps.sourceType === 'direct');

  // Available skills for adding (not already included)
  const availableSkills = skills.filter(
    skill =>
      !skillsFromSolutions.some(sfs => sfs.skillId === skill.id) &&
      !directSkills.some(ds => ds.skillId === skill.id)
  );

  const handleAddDirectSkill = () => {
    if (!selectedSkillId) return;

    const newSkill: ProjectSkill = {
      id: `direct-${Date.now()}`,
      projectId: '', // Will be set by parent
      skillId: selectedSkillId,
      sourceType: 'direct',
      importance: selectedImportance,
    };

    onSkillsChange([...projectSkills, newSkill]);
    setSelectedSkillId('');
    setShowAddSkill(false);
  };

  const handleRemoveDirectSkill = (skillId: string) => {
    onSkillsChange(projectSkills.filter(ps => ps.id !== skillId));
  };

  const handleUpdateImportance = (
    skillId: string,
    importance: 'critical' | 'important' | 'nice-to-have'
  ) => {
    onSkillsChange(
      projectSkills.map(ps => (ps.id === skillId ? { ...ps, importance } : ps))
    );
  };

  const getSkillName = (skillId: string) => {
    return skills.find(s => s.id === skillId)?.name || 'Unknown Skill';
  };

  const getSolutionName = (solutionId: string) => {
    return solutions.find(s => s.id === solutionId)?.name || 'Unknown Solution';
  };

  const getImportanceBadgeVariant = (
    importance: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (importance) {
      case 'critical':
        return 'destructive';
      case 'important':
        return 'default';
      case 'nice-to-have':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Label>Required Skills</Label>

      {/* Skills from solutions */}
      {skillsFromSolutions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            From Solutions:
          </h4>
          <div className="space-y-2">
            {skillsFromSolutions.map(skill => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getSkillName(skill.skillId)}</Badge>
                  <span className="text-xs text-gray-500">
                    from {getSolutionName(skill.sourceSolutionId!)}
                  </span>
                </div>
                <Badge
                  variant={getImportanceBadgeVariant(
                    skill.importance || 'important'
                  )}
                >
                  {skill.importance || 'important'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct skills */}
      {directSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Additional Skills:
          </h4>
          <div className="space-y-2">
            {directSkills.map(skill => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getSkillName(skill.skillId)}</Badge>
                  <Select
                    value={skill.importance}
                    onValueChange={(value: string) =>
                      handleUpdateImportance(
                        skill.id,
                        value as 'critical' | 'important' | 'nice-to-have'
                      )
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="nice-to-have">Nice to Have</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDirectSkill(skill.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add skill button */}
      {!showAddSkill && availableSkills.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddSkill(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Additional Skill
        </Button>
      )}

      {/* Add skill form */}
      {showAddSkill && (
        <div className="p-3 border rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Skill</Label>
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
              <Label>Importance</Label>
              <Select
                value={selectedImportance}
                onValueChange={(value: string) =>
                  setSelectedImportance(
                    value as 'critical' | 'important' | 'nice-to-have'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="nice-to-have">Nice to Have</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddDirectSkill}
              disabled={!selectedSkillId}
            >
              Add Skill
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddSkill(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {availableSkills.length === 0 &&
        !showAddSkill &&
        directSkills.length === 0 &&
        skillsFromSolutions.length === 0 && (
          <p className="text-sm text-gray-500">
            No skills required. Add solutions to automatically include their
            associated skills.
          </p>
        )}
    </div>
  );
};

export default ProjectSkillsSection;
