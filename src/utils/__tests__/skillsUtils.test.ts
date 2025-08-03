import { describe, it, expect } from 'vitest';
import {
  getSkillNames,
  getSkillsFromIds,
  validateSkillIds,
  getSkillsByCategory,
  getAvailableSkills,
} from '../skillsUtils';
import { Skill } from '@/types';

// Test data
const createMockSkills = (): Skill[] => [
  {
    id: 'skill1',
    name: 'React',
    category: 'Frontend',
    description: 'React.js framework',
  },
  {
    id: 'skill2',
    name: 'Node.js',
    category: 'Backend',
    description: 'Node.js runtime',
  },
  {
    id: 'skill3',
    name: 'TypeScript',
    category: 'Language',
    description: 'TypeScript language',
  },
  {
    id: 'skill4',
    name: 'PostgreSQL',
    category: 'Database',
    description: 'PostgreSQL database',
  },
  {
    id: 'skill5',
    name: 'Design Systems',
    category: 'Frontend',
    description: 'Design system development',
  },
  {
    id: 'skill6',
    name: 'API Design',
    category: 'Backend',
    description: 'RESTful API design',
  },
  {
    id: 'skill7',
    name: 'Uncategorized Skill',
    category: '', // Empty category
    description: 'Skill without category',
  },
  {
    id: 'skill8',
    name: 'Null Category Skill',
    // @ts-expect-error - Testing null category
    category: null,
    description: 'Skill with null category',
  },
];

describe('skillsUtils', () => {
  let mockSkills: Skill[];

  beforeEach(() => {
    mockSkills = createMockSkills();
  });

  describe('getSkillNames', () => {
    it('should return skill names for valid skill IDs', () => {
      const skillIds = ['skill1', 'skill2', 'skill3'];
      const result = getSkillNames(skillIds, mockSkills);

      expect(result).toEqual(['React', 'Node.js', 'TypeScript']);
    });

    it('should filter out invalid skill IDs', () => {
      const skillIds = ['skill1', 'invalid-skill', 'skill2', 'another-invalid'];
      const result = getSkillNames(skillIds, mockSkills);

      expect(result).toEqual(['React', 'Node.js']);
    });

    it('should return empty array for empty skill IDs', () => {
      const result = getSkillNames([], mockSkills);
      expect(result).toEqual([]);
    });

    it('should return empty array for null/undefined skill IDs', () => {
      expect(getSkillNames(null as any, mockSkills)).toEqual([]);
      expect(getSkillNames(undefined as any, mockSkills)).toEqual([]);
    });

    it('should return empty array for null/undefined skills', () => {
      const skillIds = ['skill1', 'skill2'];
      expect(getSkillNames(skillIds, null as any)).toEqual([]);
      expect(getSkillNames(skillIds, undefined as any)).toEqual([]);
    });

    it('should handle empty skills array', () => {
      const skillIds = ['skill1', 'skill2'];
      const result = getSkillNames(skillIds, []);
      expect(result).toEqual([]);
    });

    it('should preserve order of skill IDs', () => {
      const skillIds = ['skill3', 'skill1', 'skill2'];
      const result = getSkillNames(skillIds, mockSkills);

      expect(result).toEqual(['TypeScript', 'React', 'Node.js']);
    });

    it('should handle duplicate skill IDs', () => {
      const skillIds = ['skill1', 'skill1', 'skill2'];
      const result = getSkillNames(skillIds, mockSkills);

      expect(result).toEqual(['React', 'React', 'Node.js']);
    });
  });

  describe('getSkillsFromIds', () => {
    it('should return skill objects for valid skill IDs', () => {
      const skillIds = ['skill1', 'skill2'];
      const result = getSkillsFromIds(skillIds, mockSkills);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockSkills[0]);
      expect(result[1]).toEqual(mockSkills[1]);
    });

    it('should filter out invalid skill IDs', () => {
      const skillIds = ['skill1', 'invalid-skill', 'skill2'];
      const result = getSkillsFromIds(skillIds, mockSkills);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('skill1');
      expect(result[1].id).toBe('skill2');
    });

    it('should return empty array for empty skill IDs', () => {
      const result = getSkillsFromIds([], mockSkills);
      expect(result).toEqual([]);
    });

    it('should return empty array for null/undefined inputs', () => {
      expect(getSkillsFromIds(null as any, mockSkills)).toEqual([]);
      expect(getSkillsFromIds(['skill1'], null as any)).toEqual([]);
    });

    it('should preserve order of skill IDs', () => {
      const skillIds = ['skill3', 'skill1'];
      const result = getSkillsFromIds(skillIds, mockSkills);

      expect(result[0].id).toBe('skill3');
      expect(result[1].id).toBe('skill1');
    });

    it('should handle duplicate skill IDs', () => {
      const skillIds = ['skill1', 'skill1'];
      const result = getSkillsFromIds(skillIds, mockSkills);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('skill1');
      expect(result[1].id).toBe('skill1');
    });
  });

  describe('validateSkillIds', () => {
    it('should validate all valid skill IDs', () => {
      const skillIds = ['skill1', 'skill2', 'skill3'];
      const result = validateSkillIds(skillIds, mockSkills);

      expect(result).toEqual({
        isValid: true,
        validIds: ['skill1', 'skill2', 'skill3'],
        invalidIds: [],
        missingSkills: [],
      });
    });

    it('should identify invalid skill IDs', () => {
      const skillIds = ['skill1', 'invalid-skill', 'skill2', 'another-invalid'];
      const result = validateSkillIds(skillIds, mockSkills);

      expect(result).toEqual({
        isValid: false,
        validIds: ['skill1', 'skill2'],
        invalidIds: ['invalid-skill', 'another-invalid'],
        missingSkills: ['invalid-skill', 'another-invalid'],
      });
    });

    it('should handle all invalid skill IDs', () => {
      const skillIds = ['invalid1', 'invalid2'];
      const result = validateSkillIds(skillIds, mockSkills);

      expect(result).toEqual({
        isValid: false,
        validIds: [],
        invalidIds: ['invalid1', 'invalid2'],
        missingSkills: ['invalid1', 'invalid2'],
      });
    });

    it('should handle empty skill IDs array', () => {
      const result = validateSkillIds([], mockSkills);

      expect(result).toEqual({
        isValid: true,
        validIds: [],
        invalidIds: [],
        missingSkills: [],
      });
    });

    it('should handle null/undefined inputs gracefully', () => {
      const result1 = validateSkillIds(null as any, mockSkills);
      const result2 = validateSkillIds(['skill1'], null as any);

      const expectedResult = {
        isValid: true,
        validIds: [],
        invalidIds: [],
        missingSkills: [],
      };

      expect(result1).toEqual(expectedResult);
      expect(result2).toEqual(expectedResult);
    });

    it('should handle duplicate skill IDs', () => {
      const skillIds = ['skill1', 'skill1', 'invalid-skill'];
      const result = validateSkillIds(skillIds, mockSkills);

      expect(result).toEqual({
        isValid: false,
        validIds: ['skill1', 'skill1'],
        invalidIds: ['invalid-skill'],
        missingSkills: ['invalid-skill'],
      });
    });

    it('should handle empty skills array', () => {
      const skillIds = ['skill1', 'skill2'];
      const result = validateSkillIds(skillIds, []);

      expect(result).toEqual({
        isValid: false,
        validIds: [],
        invalidIds: ['skill1', 'skill2'],
        missingSkills: ['skill1', 'skill2'],
      });
    });
  });

  describe('getSkillsByCategory', () => {
    it('should group skills by category', () => {
      const skillIds = ['skill1', 'skill2', 'skill5', 'skill6'];
      const result = getSkillsByCategory(skillIds, mockSkills);

      expect(result).toEqual({
        Frontend: [mockSkills[0], mockSkills[4]], // React, Design Systems
        Backend: [mockSkills[1], mockSkills[5]], // Node.js, API Design
      });
    });

    it('should handle skills with empty or null categories', () => {
      const skillIds = ['skill1', 'skill7', 'skill8'];
      const result = getSkillsByCategory(skillIds, mockSkills);

      expect(result).toEqual({
        Frontend: [mockSkills[0]], // React
        Other: [mockSkills[6], mockSkills[7]], // Both uncategorized skills
      });
    });

    it('should handle invalid skill IDs', () => {
      const skillIds = ['skill1', 'invalid-skill', 'skill2'];
      const result = getSkillsByCategory(skillIds, mockSkills);

      expect(result).toEqual({
        Frontend: [mockSkills[0]], // React
        Backend: [mockSkills[1]], // Node.js
      });
    });

    it('should return empty object for empty skill IDs', () => {
      const result = getSkillsByCategory([], mockSkills);
      expect(result).toEqual({});
    });

    it('should handle null/undefined inputs', () => {
      expect(getSkillsByCategory(null as any, mockSkills)).toEqual({});
      expect(getSkillsByCategory(['skill1'], null as any)).toEqual({});
    });

    it('should handle single category', () => {
      const skillIds = ['skill1', 'skill5']; // Both Frontend
      const result = getSkillsByCategory(skillIds, mockSkills);

      expect(result).toEqual({
        Frontend: [mockSkills[0], mockSkills[4]],
      });
    });

    it('should preserve skill order within categories', () => {
      const skillIds = ['skill5', 'skill1']; // Design Systems, React (both Frontend)
      const result = getSkillsByCategory(skillIds, mockSkills);

      expect(result['Frontend'][0].name).toBe('Design Systems');
      expect(result['Frontend'][1].name).toBe('React');
    });
  });

  describe('getAvailableSkills', () => {
    it('should return unselected skills', () => {
      const selectedSkillIds = ['skill1', 'skill2'];
      const result = getAvailableSkills(mockSkills, selectedSkillIds);

      expect(result).toHaveLength(6);
      expect(result.map(s => s.id)).toEqual([
        'skill3',
        'skill4',
        'skill5',
        'skill6',
        'skill7',
        'skill8',
      ]);
    });

    it('should return all skills when no skills are selected', () => {
      const result = getAvailableSkills(mockSkills, []);
      expect(result).toEqual(mockSkills);
    });

    it('should return all skills when selectedSkillIds is null/undefined', () => {
      expect(getAvailableSkills(mockSkills, null as any)).toEqual(mockSkills);
      expect(getAvailableSkills(mockSkills, undefined as any)).toEqual(
        mockSkills
      );
    });

    it('should return empty array when allSkills is null/undefined', () => {
      expect(getAvailableSkills(null as any, ['skill1'])).toEqual([]);
      expect(getAvailableSkills(undefined as any, ['skill1'])).toEqual([]);
    });

    it('should handle all skills selected', () => {
      const allSkillIds = mockSkills.map(s => s.id);
      const result = getAvailableSkills(mockSkills, allSkillIds);
      expect(result).toEqual([]);
    });

    it('should handle invalid selected skill IDs', () => {
      const selectedSkillIds = ['skill1', 'invalid-skill', 'skill2'];
      const result = getAvailableSkills(mockSkills, selectedSkillIds);

      // Should filter out skill1 and skill2, invalid-skill should have no effect
      expect(result).toHaveLength(6);
      expect(result.map(s => s.id)).not.toContain('skill1');
      expect(result.map(s => s.id)).not.toContain('skill2');
    });

    it('should handle duplicate selected skill IDs', () => {
      const selectedSkillIds = ['skill1', 'skill1', 'skill2'];
      const result = getAvailableSkills(mockSkills, selectedSkillIds);

      // Should still filter out skill1 and skill2 despite duplicates
      expect(result).toHaveLength(6);
      expect(result.map(s => s.id)).not.toContain('skill1');
      expect(result.map(s => s.id)).not.toContain('skill2');
    });

    it('should preserve original skills array order', () => {
      const selectedSkillIds = ['skill2', 'skill4'];
      const result = getAvailableSkills(mockSkills, selectedSkillIds);

      // Should maintain original order of unselected skills
      expect(result[0].id).toBe('skill1');
      expect(result[1].id).toBe('skill3');
      expect(result[2].id).toBe('skill5');
    });

    it('should handle empty allSkills array', () => {
      const result = getAvailableSkills([], ['skill1']);
      expect(result).toEqual([]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed skill objects', () => {
      const malformedSkills = [
        { id: 'skill1', name: 'React' }, // Missing required fields
        { name: 'Node.js', category: 'Backend' }, // Missing id
        null,
        undefined,
      ] as any;

      // Functions should not crash with malformed data
      expect(() => getSkillNames(['skill1'], malformedSkills)).not.toThrow();
      expect(() => getSkillsFromIds(['skill1'], malformedSkills)).not.toThrow();
      expect(() => validateSkillIds(['skill1'], malformedSkills)).not.toThrow();
    });

    it('should handle very large skill arrays efficiently', () => {
      const largeSkillsArray = Array.from({ length: 10000 }, (_, i) => ({
        id: `skill${i}`,
        name: `Skill ${i}`,
        category: `Category ${i % 10}`,
        description: `Description ${i}`,
      }));

      const skillIds = ['skill1', 'skill100', 'skill9999'];

      const startTime = performance.now();
      const result = getSkillNames(skillIds, largeSkillsArray);
      const endTime = performance.now();

      expect(result).toEqual(['Skill 1', 'Skill 100', 'Skill 9999']);
      expect(endTime - startTime).toBeLessThan(10); // Should be fast
    });

    it('should handle circular references gracefully', () => {
      const circularSkill: any = {
        id: 'circular',
        name: 'Circular Skill',
        category: 'Test',
      };
      circularSkill.self = circularSkill;

      const skillsWithCircular = [circularSkill, ...mockSkills];

      // Should not cause infinite loops
      expect(() =>
        getSkillNames(['circular'], skillsWithCircular)
      ).not.toThrow();
      expect(() =>
        validateSkillIds(['circular'], skillsWithCircular)
      ).not.toThrow();
    });

    it('should handle special characters in skill IDs and names', () => {
      const specialSkills: Skill[] = [
        {
          id: 'skill-with-dashes',
          name: 'Skill with Special Characters !@#$%^&*()',
          category: 'Category/With/Slashes',
          description: 'Description with "quotes" and \'apostrophes\'',
        },
        {
          id: 'skill_with_underscores',
          name: 'Skill with émojis 🚀 and unicode ñ',
          category: 'Unicode Category 中文',
          description: 'Unicode description',
        },
      ];

      const skillIds = ['skill-with-dashes', 'skill_with_underscores'];

      expect(() => getSkillNames(skillIds, specialSkills)).not.toThrow();
      expect(() => getSkillsByCategory(skillIds, specialSkills)).not.toThrow();

      const names = getSkillNames(skillIds, specialSkills);
      expect(names[0]).toBe('Skill with Special Characters !@#$%^&*()');
      expect(names[1]).toBe('Skill with émojis 🚀 and unicode ñ');
    });
  });
});
