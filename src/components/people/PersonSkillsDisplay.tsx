
import React from 'react';
import { useApp } from '@/context/AppContext';
import { PersonSkill } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Star, Cog, User } from 'lucide-react';

interface PersonSkillsDisplayProps {
  personId: string;
  compact?: boolean;
}

const PersonSkillsDisplay: React.FC<PersonSkillsDisplayProps> = ({
  personId,
  compact = false,
}) => {
  const { 
    skills, 
    personSkills, 
    solutions, 
    projectSolutions, 
    allocations, 
    projects, 
    cycles 
  } = useApp();

  const currentPersonSkills = personSkills.filter(ps => ps.personId === personId);

  // Get skills from solutions via project allocations
  const skillsFromSolutions = React.useMemo(() => {
    const now = new Date();
    const activeCycle = cycles.find(c => new Date(c.startDate) <= now && new Date(c.endDate) >= now);
    
    if (!activeCycle) return [];

    const personAllocations = allocations.filter(a => 
      a.personId === personId && a.cycleId === activeCycle.id
    );

    const skillIds = new Set<string>();
    const result: Array<PersonSkill & { 
      sourceSolutionName?: string; 
      sourceProjectName?: string;
    }> = [];

    personAllocations.forEach(allocation => {
      const project = projects.find(p => 
        allocation.epicId && 
        p.milestones?.some(m => m.id === allocation.epicId)
      );
      
      if (project) {
        const projectSols = projectSolutions.filter(ps => ps.projectId === project.id);
        
        projectSols.forEach(ps => {
          const solution = solutions.find(s => s.id === ps.solutionId);
          if (solution) {
            solution.skillIds.forEach(skillId => {
              if (!skillIds.has(skillId)) {
                skillIds.add(skillId);
                result.push({
                  id: `solution-${ps.solutionId}-${skillId}`,
                  personId,
                  skillId,
                  level: 'intermediate',
                  sourceType: 'solution',
                  sourceSolutionId: ps.solutionId,
                  sourceSolutionName: solution.name,
                  sourceProjectName: project.name,
                });
              }
            });
          }
        });
      }
    });

    return result;
  }, [personId, allocations, cycles, projects, projectSolutions, solutions]);

  // Get direct skills
  const directSkills = currentPersonSkills.filter(ps => !ps.sourceType || ps.sourceType === 'direct');

  const getSkillName = (skillId: string) => {
    return skills.find(s => s.id === skillId)?.name || 'Unknown Skill';
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'expert':
        return 'default';
      case 'intermediate':
        return 'secondary';
      case 'beginner':
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
            From Current Projects:
          </h4>
          <div className="space-y-1">
            {skillsFromSolutions.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getSkillName(skill.skillId)}</Badge>
                  <span className="text-xs text-gray-500">
                    via {skill.sourceSolutionName} ({skill.sourceProjectName})
                  </span>
                </div>
                <Badge variant={getLevelBadgeVariant(skill.level)}>
                  {skill.level}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {directSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <User className="h-4 w-4 mr-1" />
            Personal Skills:
          </h4>
          <div className="space-y-1">
            {directSkills.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between text-sm">
                <Badge variant="outline">{getSkillName(skill.skillId)}</Badge>
                <Badge variant={getLevelBadgeVariant(skill.level)}>
                  {skill.level}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {skillsFromSolutions.length === 0 && directSkills.length === 0 && (
        <p className="text-sm text-gray-500">No skills defined for this person.</p>
      )}
    </div>
  );
};

export default PersonSkillsDisplay;
