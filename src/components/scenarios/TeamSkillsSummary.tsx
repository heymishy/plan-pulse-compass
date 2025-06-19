
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Star, TrendingUp } from 'lucide-react';

interface TeamSkillsSummaryProps {
  teamId: string;
}

const TeamSkillsSummary: React.FC<TeamSkillsSummaryProps> = ({ teamId }) => {
  const { teams, people, skills, personSkills } = useApp();

  const team = teams.find(t => t.id === teamId);
  const teamMembers = people.filter(p => p.teamId === teamId && p.isActive);

  if (!team) return null;

  // Calculate team skill summary
  const teamSkillsMap = new Map<string, {
    skillName: string;
    category: string;
    peopleCount: number;
    proficiencyLevels: string[];
    averageProficiency: number;
  }>();

  teamMembers.forEach(person => {
    const memberSkills = personSkills.filter(ps => ps.personId === person.id);
    memberSkills.forEach(ps => {
      const skill = skills.find(s => s.id === ps.skillId);
      if (skill) {
        if (!teamSkillsMap.has(ps.skillId)) {
          teamSkillsMap.set(ps.skillId, {
            skillName: skill.name,
            category: skill.category,
            peopleCount: 1,
            proficiencyLevels: [ps.proficiencyLevel],
            averageProficiency: getProficiencyValue(ps.proficiencyLevel)
          });
        } else {
          const existing = teamSkillsMap.get(ps.skillId)!;
          existing.peopleCount++;
          existing.proficiencyLevels.push(ps.proficiencyLevel);
          existing.averageProficiency = existing.proficiencyLevels
            .reduce((sum, level) => sum + getProficiencyValue(level), 0) / existing.proficiencyLevels.length;
        }
      }
    });
  });

  const teamSkills = Array.from(teamSkillsMap.entries()).map(([skillId, data]) => ({
    skillId,
    ...data
  }));

  // Group by category
  const skillsByCategory = teamSkills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof teamSkills>);

  const getProficiencyColor = (level: number) => {
    if (level >= 3) return 'bg-green-500';
    if (level >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCoverageColor = (coverage: number, totalMembers: number) => {
    const percentage = (coverage / totalMembers) * 100;
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          {team.name} - Skills Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
            <div className="text-sm text-gray-600">Team Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{teamSkills.length}</div>
            <div className="text-sm text-gray-600">Unique Skills</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(skillsByCategory).length}
            </div>
            <div className="text-sm text-gray-600">Skill Categories</div>
          </div>
        </div>

        {/* Skills by Category */}
        {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-semibold text-gray-700 flex items-center">
              <Star className="h-4 w-4 mr-1" />
              {category}
            </h4>
            <div className="space-y-2">
              {categorySkills.map(skill => (
                <div key={skill.skillId} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{skill.skillName}</span>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary" 
                        className={getCoverageColor(skill.peopleCount, teamMembers.length)}
                      >
                        {skill.peopleCount}/{teamMembers.length} people
                      </Badge>
                      <Badge variant="outline">
                        Avg: {getProficiencyLabel(skill.averageProficiency)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Proficiency Distribution */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Team Coverage</span>
                      <span>{Math.round((skill.peopleCount / teamMembers.length) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(skill.peopleCount / teamMembers.length) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Proficiency Levels */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['beginner', 'intermediate', 'advanced', 'expert'].map(level => {
                      const count = skill.proficiencyLevels.filter(l => l === level).length;
                      return count > 0 ? (
                        <Badge key={level} variant="outline" className="text-xs">
                          {level}: {count}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {teamSkills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No skills data available for this team.</p>
            <p className="text-sm">Add skills to team members to see analysis.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const getProficiencyValue = (level: string): number => {
  switch (level) {
    case 'expert': return 4;
    case 'advanced': return 3;
    case 'intermediate': return 2;
    case 'beginner': return 1;
    default: return 0;
  }
};

const getProficiencyLabel = (value: number): string => {
  if (value >= 3.5) return 'Expert';
  if (value >= 2.5) return 'Advanced';
  if (value >= 1.5) return 'Intermediate';
  return 'Beginner';
};

export default TeamSkillsSummary;
