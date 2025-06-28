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

  describe('Person-Skill Integration', () => {
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

    it('should have people with multiple skills', () => {
      const personSkillCounts = testData.people.map(person => {
        const skills = testData.personSkills.filter(
          ps => ps.personId === person.id
        );
        return {
          personId: person.id,
          personName: person.name,
          skillCount: skills.length,
        };
      });

      // Some people should have multiple skills
      const peopleWithMultipleSkills = personSkillCounts.filter(
        p => p.skillCount > 1
      );
      expect(peopleWithMultipleSkills.length).toBeGreaterThan(0);
    });
  });

  describe('Role-Skill Integration', () => {
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
  });

  describe('Skills Analytics Integration', () => {
    it('should calculate team skill coverage', () => {
      testData.teams.forEach(team => {
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
              };
            });
        });

        const uniqueSkills = [...new Set(teamSkills.map(ts => ts.skillName))];
        const skillCategories = [...new Set(teamSkills.map(ts => ts.category))];

        const teamMetrics = {
          peopleCount: teamPeople.length,
          skillCount: uniqueSkills.length,
          categoryCount: skillCategories.length,
        };

        expect(teamMetrics.peopleCount).toBeGreaterThan(0);
        expect(teamMetrics.skillCount).toBeGreaterThan(0);
        expect(teamMetrics.categoryCount).toBeGreaterThan(0);
      });
    });

    it('should calculate organization skill metrics', () => {
      const orgSkillMetrics = {
        totalSkills: testData.skills.length,
        totalPersonSkills: testData.personSkills.length,
        uniqueSkillCategories: [
          ...new Set(testData.skills.map(s => s.category)),
        ].length,
        avgSkillsPerPerson:
          testData.personSkills.length / testData.people.length,
      };

      expect(orgSkillMetrics.totalSkills).toBeGreaterThan(0);
      expect(orgSkillMetrics.totalPersonSkills).toBeGreaterThan(0);
      expect(orgSkillMetrics.uniqueSkillCategories).toBeGreaterThan(0);
      expect(orgSkillMetrics.avgSkillsPerPerson).toBeGreaterThan(0);
    });

    it('should identify high-proficiency skills', () => {
      const expertSkills = testData.personSkills.filter(
        ps => ps.proficiencyLevel === 'expert'
      );

      if (expertSkills.length > 0) {
        expertSkills.forEach(personSkill => {
          expect(personSkill.yearsOfExperience).toBeGreaterThan(3);
        });
      }
    });
  });

  describe('Data Consistency Checks', () => {
    it('should have consistent data types', () => {
      testData.skills.forEach(skill => {
        expect(typeof skill.name).toBe('string');
        expect(typeof skill.category).toBe('string');
        expect(typeof skill.description).toBe('string');
        expect(typeof skill.createdDate).toBe('string');
      });

      testData.personSkills.forEach(personSkill => {
        expect(typeof personSkill.personId).toBe('string');
        expect(typeof personSkill.skillId).toBe('string');
        expect(typeof personSkill.proficiencyLevel).toBe('string');
        expect(typeof personSkill.yearsOfExperience).toBe('number');
      });
    });

    it('should have valid skill proficiency levels', () => {
      testData.personSkills.forEach(personSkill => {
        expect(personSkill.proficiencyLevel).toMatch(
          /^(beginner|intermediate|advanced|expert)$/
        );
        expect(personSkill.yearsOfExperience).toBeGreaterThan(0);
        expect(personSkill.yearsOfExperience).toBeLessThan(20);
      });
    });

    it('should have valid skill categories', () => {
      const validCategories = [
        'programming-language',
        'framework',
        'platform',
        'domain-knowledge',
      ];

      testData.skills.forEach(skill => {
        expect(validCategories).toContain(skill.category);
      });
    });
  });
});
