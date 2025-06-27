import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFullTestData,
  validateTestData,
} from '@/test/utils/testDataLoader';
import { getTestRoleById, getTestPeopleByTeamId } from '@/test/data/testData';

describe('Skills Integration Tests', () => {
  let testData: ReturnType<typeof loadFullTestData>;

  beforeEach(() => {
    testData = loadFullTestData();
    const validation = validateTestData(testData);
    expect(validation.isValid).toBe(true);
  });

  describe('Skills Data Structure', () => {
    it('should have skills across different categories', () => {
      const skillCategories = testData.skills.map(skill => skill.category);
      expect(skillCategories).toContain('programming-language');
      expect(skillCategories).toContain('framework');
      expect(skillCategories).toContain('platform');
      expect(skillCategories).toContain('domain-knowledge');
    });

    it('should have realistic skill names', () => {
      const skillNames = testData.skills.map(skill => skill.name);
      expect(skillNames).toContain('JavaScript/TypeScript');
      expect(skillNames).toContain('React');
      expect(skillNames).toContain('AWS');
      expect(skillNames).toContain('Lending & Credit');
    });

    it('should have skills with proper descriptions', () => {
      testData.skills.forEach(skill => {
        expect(skill.description).toBeDefined();
        expect(skill.description!.length).toBeGreaterThan(0);
        expect(skill.createdDate).toBe('2024-01-01');
      });
    });
  });

  describe('Person-Skill Relationships', () => {
    it('should have people with assigned skills', () => {
      expect(testData.personSkills.length).toBeGreaterThan(0);

      testData.personSkills.forEach(personSkill => {
        const person = testData.people.find(p => p.id === personSkill.personId);
        const skill = testData.skills.find(s => s.id === personSkill.skillId);

        expect(person).toBeDefined();
        expect(skill).toBeDefined();
        expect(personSkill.proficiencyLevel).toMatch(
          /^(beginner|intermediate|advanced|expert)$/
        );
        expect(personSkill.yearsOfExperience).toBeGreaterThan(0);
      });
    });

    it('should have realistic skill proficiency distributions', () => {
      const proficiencyLevels = testData.personSkills.map(
        ps => ps.proficiencyLevel
      );
      const levelCounts = proficiencyLevels.reduce(
        (acc, level) => {
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Should have a mix of proficiency levels
      expect(Object.keys(levelCounts).length).toBeGreaterThan(1);

      // Should have some advanced/expert skills
      expect(levelCounts.advanced || levelCounts.expert).toBeGreaterThan(0);
    });

    it('should have people with multiple skills', () => {
      const personSkillCounts = testData.people.map(person => {
        const skills = testData.personSkills.filter(
          ps => ps.personId === person.id
        );
        return {
          personId: person.id,
          personName: person.name,
          skillCount: skills.length,
          skills: skills.map(ps => {
            const skill = testData.skills.find(s => s.id === ps.skillId);
            return {
              name: skill?.name,
              proficiency: ps.proficiencyLevel,
              years: ps.yearsOfExperience,
            };
          }),
        };
      });

      // Some people should have multiple skills
      const peopleWithMultipleSkills = personSkillCounts.filter(
        p => p.skillCount > 1
      );
      expect(peopleWithMultipleSkills.length).toBeGreaterThan(0);
    });
  });

  describe('Role-Skill Alignment', () => {
    it('should have Product Owners with domain skills', () => {
      const productOwners = testData.people.filter(person => {
        const role = getTestRoleById(person.roleId);
        return role?.name === 'Product Owner';
      });

      productOwners.forEach(po => {
        const poSkills = testData.personSkills.filter(
          ps => ps.personId === po.id
        );
        const skillNames = poSkills.map(ps => {
          const skill = testData.skills.find(s => s.id === ps.skillId);
          return skill?.name;
        });

        // Product Owners should have domain knowledge skills
        expect(skillNames).toContain('Lending & Credit');
      });
    });

    it('should have Software Engineers with technical skills', () => {
      const softwareEngineers = testData.people.filter(person => {
        const role = getTestRoleById(person.roleId);
        return role?.name === 'Software Engineer';
      });

      softwareEngineers.forEach(se => {
        const seSkills = testData.personSkills.filter(
          ps => ps.personId === se.id
        );
        const skillNames = seSkills.map(ps => {
          const skill = testData.skills.find(s => s.id === ps.skillId);
          return skill?.name;
        });

        // Software Engineers should have programming skills
        expect(skillNames).toContain('JavaScript/TypeScript');
        expect(skillNames).toContain('React');
      });
    });

    it('should have Platform Engineers with infrastructure skills', () => {
      const platformEngineers = testData.people.filter(person => {
        const role = getTestRoleById(person.roleId);
        return role?.name === 'Platform Engineer';
      });

      platformEngineers.forEach(pe => {
        const peSkills = testData.personSkills.filter(
          ps => ps.personId === pe.id
        );
        const skillNames = peSkills.map(ps => {
          const skill = testData.skills.find(s => s.id === ps.skillId);
          return skill?.name;
        });

        // Platform Engineers should have platform skills
        expect(skillNames).toContain('AWS');
      });
    });
  });

  describe('Team Skill Analysis', () => {
    it('should calculate team skill coverage', () => {
      const teamSkillAnalysis = testData.teams.map(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const teamSkills = teamPeople.flatMap(person => {
          return testData.personSkills
            .filter(ps => ps.personId === person.id)
            .map(ps => {
              const skill = testData.skills.find(s => s.id === ps.skillId);
              return {
                skillName: skill?.name,
                category: skill?.category,
                proficiency: ps.proficiencyLevel,
                personName: person.name,
              };
            });
        });

        const uniqueSkills = [...new Set(teamSkills.map(ts => ts.skillName))];

        return {
          teamId: team.id,
          teamName: team.name,
          peopleCount: teamPeople.length,
          skillCount: uniqueSkills.length,
          skills: uniqueSkills,
          skillCategories: [...new Set(teamSkills.map(ts => ts.category))],
        };
      });

      expect(teamSkillAnalysis).toHaveLength(4);
      teamSkillAnalysis.forEach(analysis => {
        expect(analysis.peopleCount).toBeGreaterThan(0);
        expect(analysis.skillCount).toBeGreaterThan(0);
        expect(analysis.skills.length).toBeGreaterThan(0);
      });
    });

    it('should identify skill gaps in teams', () => {
      const criticalSkills = [
        'JavaScript/TypeScript',
        'React',
        'AWS',
        'Lending & Credit',
      ];

      const teamSkillGaps = testData.teams.map(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const teamSkillNames = teamPeople.flatMap(person => {
          return testData.personSkills
            .filter(ps => ps.personId === person.id)
            .map(ps => {
              const skill = testData.skills.find(s => s.id === ps.skillId);
              return skill?.name;
            });
        });

        const missingSkills = criticalSkills.filter(
          skill => !teamSkillNames.includes(skill)
        );

        return {
          teamId: team.id,
          teamName: team.name,
          hasAllCriticalSkills: missingSkills.length === 0,
          missingSkills,
        };
      });

      // At least some teams should have all critical skills
      const teamsWithAllSkills = teamSkillGaps.filter(
        t => t.hasAllCriticalSkills
      );
      expect(teamsWithAllSkills.length).toBeGreaterThan(0);
    });
  });

  describe('Skill Proficiency Analysis', () => {
    it('should calculate average proficiency by skill', () => {
      const skillProficiencyMap = testData.skills.map(skill => {
        const skillAssignments = testData.personSkills.filter(
          ps => ps.skillId === skill.id
        );
        const proficiencyScores = skillAssignments.map(ps => {
          switch (ps.proficiencyLevel) {
            case 'beginner':
              return 1;
            case 'intermediate':
              return 2;
            case 'advanced':
              return 3;
            case 'expert':
              return 4;
            default:
              return 0;
          }
        });

        const avgProficiency =
          proficiencyScores.length > 0
            ? proficiencyScores.reduce((sum, score) => sum + score, 0) /
              proficiencyScores.length
            : 0;

        return {
          skillName: skill.name,
          category: skill.category,
          assignments: skillAssignments.length,
          avgProficiency,
          proficiencyDistribution: skillAssignments.reduce(
            (acc, ps) => {
              acc[ps.proficiencyLevel] = (acc[ps.proficiencyLevel] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        };
      });

      expect(skillProficiencyMap).toHaveLength(5);
      skillProficiencyMap.forEach(skill => {
        expect(skill.assignments).toBeGreaterThan(0);
        expect(skill.avgProficiency).toBeGreaterThan(0);
        expect(skill.avgProficiency).toBeLessThanOrEqual(4);
      });
    });

    it('should identify expert-level skills', () => {
      const expertSkills = testData.personSkills
        .filter(ps => ps.proficiencyLevel === 'expert')
        .map(ps => {
          const skill = testData.skills.find(s => s.id === ps.skillId);
          const person = testData.people.find(p => p.id === ps.personId);
          return {
            skillName: skill?.name,
            personName: person?.name,
            yearsOfExperience: ps.yearsOfExperience,
          };
        });

      expect(expertSkills.length).toBeGreaterThan(0);
      expertSkills.forEach(expert => {
        expect(expert.yearsOfExperience).toBeGreaterThanOrEqual(5);
      });
    });
  });
});
