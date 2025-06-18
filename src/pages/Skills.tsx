
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Cog } from 'lucide-react';

const Skills = () => {
  const { skills, personSkills, solutions, people } = useApp();

  const getSkillStats = (skillId: string) => {
    const peopleWithSkill = personSkills.filter(ps => ps.skillId === skillId);
    const solutionsWithSkill = solutions.filter(s => s.skillIds.includes(skillId));
    
    return {
      peopleCount: peopleWithSkill.length,
      solutionsCount: solutionsWithSkill.length,
    };
  };

  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skills Overview</h1>
          <p className="text-gray-600">View skills across people, projects, and solutions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skills.length}</div>
            <Badge variant="outline" className="mt-1">Skills Defined</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">People with Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(personSkills.map(ps => ps.personId)).size}
            </div>
            <Badge variant="secondary" className="mt-1">Active</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solutions with Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {solutions.filter(s => s.skillIds.length > 0).length}
            </div>
            <Badge className="mt-1 bg-green-500">Configured</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySkills.map(skill => {
                  const stats = getSkillStats(skill.id);
                  return (
                    <div key={skill.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{skill.name}</h3>
                        <Badge variant="outline">{skill.category}</Badge>
                      </div>
                      {skill.description && (
                        <p className="text-sm text-gray-600 mb-2">{skill.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-blue-500" />
                          <span>{stats.peopleCount} people</span>
                        </div>
                        <div className="flex items-center">
                          <Cog className="h-4 w-4 mr-1 text-green-500" />
                          <span>{stats.solutionsCount} solutions</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Skills;
