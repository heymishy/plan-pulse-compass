
import React from 'react';
import { useApp } from '@/context/AppContext';
import { ProjectSkill, ProjectSolution } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Star, Cog } from 'lucide-react';

interface ProjectSkillsDisplayProps {
  projectId: string;
  compact?: boolean;
}

const ProjectSkillsDisplay: React.FC<ProjectSkillsDisplayProps> = ({
  projectId,
  compact = false,
}) => {
  const { skills, solutions, projectSkills, projectSolutions } = useApp();

  const currentProjectSkills = projectSkills.filter(ps => ps.projectId === projectId);
  const currentProjectSolutions = projectSolutions.filter(ps => ps.projectId === projectId);

  // Get skills from solutions
  const skillsFromSolutions = React.useMemo(() => {
    const skillIds = new Set<string>();
    const result: Array<ProjectSkill & { sourceSolutionName?: string }> = [];

    currentProjectSolutions.forEach(ps => {
      const solution = solutions.find(s => s.id === ps.solutionId);
      if (solution) {
        solution.skillIds.forEach(skillId => {
          if (!skillIds.has(skillId)) {
            skillIds.add(skillId);
            result.push({
              id: `solution-${ps.solutionId}-${skillId}`,
              projectId,
              skillId,
              sourceType: 'solution',
              sourceSolutionId: ps.solutionId,
              importance: 'important',
              sourceSolutionName: solution.name,
            });
          }
        });
      }
    });

    return result;
  }, [currentProjectSolutions, solutions, projectId]);

  // Get direct skills
  const directSkills = currentProjectSkills.filter(ps => ps.sourceType === 'direct');

  const getSkillName = (skillId: string) => {
    return skills.find(s => s.id === skillId)?.name || 'Unknown Skill';
  };

  const getImportanceBadgeVariant = (importance: string) => {
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

  if (compact) {
    const allSkillIds = new Set([
      ...skillsFromSolutions.map(s => s.skillId),
      ...directSkills.map(s => s.skillId)
    ]);

    return (
      <div className="flex flex-wrap gap-1">
        {Array.from(allSkillIds).slice(0, 3).map(skillId => (
          <Badge key={skillId} variant="outline" className="text-xs">
            {getSkillName(skillId)}
          </Badge>
        ))}
        {allSkillIds.size > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{allSkillIds.size - 3} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {skillsFromSolutions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Cog className="h-4 w-4 mr-1" />
            From Solutions:
          </h4>
          <div className="space-y-1">
            {skillsFromSolutions.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getSkillName(skill.skillId)}</Badge>
                  <span className="text-xs text-gray-500">
                    via {skill.sourceSolutionName}
                  </span>
                </div>
                <Badge variant={getImportanceBadgeVariant(skill.importance)}>
                  {skill.importance}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {directSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Star className="h-4 w-4 mr-1" />
            Additional Skills:
          </h4>
          <div className="space-y-1">
            {directSkills.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between text-sm">
                <Badge variant="outline">{getSkillName(skill.skillId)}</Badge>
                <Badge variant={getImportanceBadgeVariant(skill.importance)}>
                  {skill.importance}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {skillsFromSolutions.length === 0 && directSkills.length === 0 && (
        <p className="text-sm text-gray-500">No skills defined for this project.</p>
      )}
    </div>
  );
};

export default ProjectSkillsDisplay;
