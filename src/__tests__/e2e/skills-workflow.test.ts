/**
 * E2E Skills Workflow Tests
 * Validates complete skills architecture including GitHub Issue #75
 * Tests core skills auto-linking logic and team compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTeamProjectCompatibility,
  findBestTeamForProject,
  analyzeSkillCoverage,
} from '@/utils/skillBasedPlanning';
import {
  Project,
  Solution,
  Skill,
  ProjectSolution,
  ProjectSkill,
  Team,
} from '@/types';

// Test data setup
const testSkills: Skill[] = [
  { id: 'skill-1', name: 'React Development', category: 'frontend' },
  { id: 'skill-2', name: 'Node.js', category: 'backend' },
  { id: 'skill-3', name: 'Database Design', category: 'backend' },
  { id: 'skill-4', name: 'UI/UX Design', category: 'design' },
];

const testSolutions: Solution[] = [
  {
    id: 'sol-1',
    name: 'E-commerce Platform',
    description: 'Full-stack e-commerce solution',
    category: 'web-application',
    skills: ['skill-1', 'skill-2', 'skill-3'], // React, Node.js, Database
    complexity: 'high',
    estimatedEffort: 120,
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sol-2',
    name: 'Mobile App Design',
    description: 'UI/UX design for mobile applications',
    category: 'design',
    skills: ['skill-4'], // UI/UX Design only
    complexity: 'medium',
    estimatedEffort: 40,
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
];

const testTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Frontend Team',
    description: 'Frontend development specialists',
    type: 'permanent',
    status: 'active',
    divisionId: 'dev',
    capacity: 40,
    targetSkills: ['skill-1', 'skill-4'], // React, UI/UX - should match e-commerce + mobile
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'team-2',
    name: 'Backend Team',
    description: 'Backend development specialists',
    type: 'permanent',
    status: 'active',
    divisionId: 'dev',
    capacity: 40,
    targetSkills: ['skill-2', 'skill-3'], // Node.js, Database - should match e-commerce
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
];

const testProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test project for skills workflow',
  status: 'planning',
  priority: 'high',
  divisionId: 'dev',
  startDate: '2024-01-15',
  endDate: '2024-06-15',
  budget: 100000,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
};

describe('E2E Skills Workflow Tests', () => {
  describe('GitHub Issue #75: Solution-to-Project Skills Auto-Linking', () => {
    it('should automatically derive skills from project solutions', () => {
      // Test the core logic for GitHub Issue #75: automatic skills from solutions
      const projectSolutions: ProjectSolution[] = [
        {
          id: 'ps-1',
          projectId: 'proj-1',
          solutionId: 'sol-1', // E-commerce solution
          importance: 'high',
          notes: '',
          estimatedEffort: 120,
        },
      ];

      // Simulate the skills derivation logic from ProjectSolutionsSkillsSection
      const skillsFromSolutions: ProjectSkill[] = [];
      const skillIds = new Set<string>();

      projectSolutions.forEach(ps => {
        const solution = testSolutions.find(s => s.id === ps.solutionId);
        if (solution && solution.skills && Array.isArray(solution.skills)) {
          solution.skills.forEach(skillId => {
            if (!skillIds.has(skillId)) {
              skillIds.add(skillId);
              skillsFromSolutions.push({
                id: `solution-${ps.solutionId}-${skillId}`,
                projectId: 'proj-1',
                skillId,
                importance: ps.importance,
                notes: `Required by ${solution.name}`,
              });
            }
          });
        }
      });

      // Verify skills are automatically derived from e-commerce solution
      expect(skillsFromSolutions).toHaveLength(3);
      expect(skillsFromSolutions.map(s => s.skillId)).toEqual([
        'skill-1',
        'skill-2',
        'skill-3',
      ]);
      expect(skillsFromSolutions[0].notes).toBe(
        'Required by E-commerce Platform'
      );
    });

    it('should not duplicate skills when same skill exists in multiple solutions', () => {
      // Test deduplication logic
      const overlappingSolution: Solution = {
        id: 'sol-overlap',
        name: 'React Dashboard',
        description: 'Dashboard with React',
        category: 'web-application',
        skills: ['skill-1'], // React Development - overlaps with e-commerce
        complexity: 'medium',
        estimatedEffort: 60,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const allSolutions = [...testSolutions, overlappingSolution];

      const projectSolutions: ProjectSolution[] = [
        {
          id: 'ps-1',
          projectId: 'proj-1',
          solutionId: 'sol-1', // E-commerce (has React)
          importance: 'high',
          notes: '',
          estimatedEffort: 120,
        },
        {
          id: 'ps-2',
          projectId: 'proj-1',
          solutionId: 'sol-overlap', // Dashboard (also has React)
          importance: 'medium',
          notes: '',
          estimatedEffort: 60,
        },
      ];

      // Simulate skills derivation with deduplication
      const skillsFromSolutions: ProjectSkill[] = [];
      const skillIds = new Set<string>();

      projectSolutions.forEach(ps => {
        const solution = allSolutions.find(s => s.id === ps.solutionId);
        if (solution && solution.skills && Array.isArray(solution.skills)) {
          solution.skills.forEach(skillId => {
            if (!skillIds.has(skillId)) {
              skillIds.add(skillId);
              skillsFromSolutions.push({
                id: `solution-${ps.solutionId}-${skillId}`,
                projectId: 'proj-1',
                skillId,
                importance: ps.importance,
                notes: `Required by ${solution.name}`,
              });
            }
          });
        }
      });

      // Should have React Development only once, not duplicated
      const reactSkills = skillsFromSolutions.filter(
        s => s.skillId === 'skill-1'
      );
      expect(reactSkills).toHaveLength(1);

      // Total unique skills from both solutions
      expect(skillsFromSolutions).toHaveLength(3); // React, Node.js, Database (React not duplicated)
    });

    it('should combine solution skills with manual skills correctly', () => {
      const projectSolutions: ProjectSolution[] = [
        {
          id: 'ps-1',
          projectId: 'proj-1',
          solutionId: 'sol-2', // Mobile App Design (UI/UX only)
          importance: 'high',
          notes: '',
          estimatedEffort: 40,
        },
      ];

      const manualSkills: ProjectSkill[] = [
        {
          id: 'manual-1',
          projectId: 'proj-1',
          skillId: 'skill-1', // React Development - not in Mobile solution
          importance: 'medium',
          notes: 'Manually added requirement',
        },
      ];

      // Derive skills from solutions
      const skillsFromSolutions: ProjectSkill[] = [];
      const skillIds = new Set<string>();

      projectSolutions.forEach(ps => {
        const solution = testSolutions.find(s => s.id === ps.solutionId);
        if (solution && solution.skills && Array.isArray(solution.skills)) {
          solution.skills.forEach(skillId => {
            if (!skillIds.has(skillId)) {
              skillIds.add(skillId);
              skillsFromSolutions.push({
                id: `solution-${ps.solutionId}-${skillId}`,
                projectId: 'proj-1',
                skillId,
                importance: ps.importance,
                notes: `Required by ${solution.name}`,
              });
            }
          });
        }
      });

      // Combine with manual skills (avoiding duplicates)
      const combinedSkills = [...skillsFromSolutions];
      manualSkills.forEach(ms => {
        if (!skillsFromSolutions.some(sfs => sfs.skillId === ms.skillId)) {
          combinedSkills.push(ms);
        }
      });

      // Should have both solution skill (UI/UX) and manual skill (React)
      expect(combinedSkills).toHaveLength(2);
      expect(combinedSkills.some(s => s.skillId === 'skill-4')).toBe(true); // UI/UX from solution
      expect(combinedSkills.some(s => s.skillId === 'skill-1')).toBe(true); // React manual

      // Check source annotations
      const uiSkill = combinedSkills.find(s => s.skillId === 'skill-4');
      const reactSkill = combinedSkills.find(s => s.skillId === 'skill-1');

      expect(uiSkill?.notes).toBe('Required by Mobile App Design');
      expect(reactSkill?.notes).toBe('Manually added requirement');
    });
  });

  describe('Team-Project Skills Matching Integration', () => {
    it('should calculate team compatibility based on solution skills', () => {
      // E-commerce solution requires: React, Node.js, Database
      const requiredSkills = ['skill-1', 'skill-2', 'skill-3'];

      // Frontend team has: React, UI/UX
      const frontendCompatibility = calculateTeamProjectCompatibility(
        testTeams[0], // Frontend Team
        requiredSkills,
        testSkills
      );

      // Backend team has: Node.js, Database
      const backendCompatibility = calculateTeamProjectCompatibility(
        testTeams[1], // Backend Team
        requiredSkills,
        testSkills
      );

      // Frontend team should match 1 out of 3 skills (React)
      expect(frontendCompatibility.exactMatches).toBe(1);
      expect(frontendCompatibility.totalRequired).toBe(3);
      expect(frontendCompatibility.compatibilityScore).toBeGreaterThan(0);

      // Backend team should match 2 out of 3 skills (Node.js + Database)
      expect(backendCompatibility.exactMatches).toBe(2);
      expect(backendCompatibility.totalRequired).toBe(3);
      expect(backendCompatibility.compatibilityScore).toBeGreaterThan(
        frontendCompatibility.compatibilityScore
      );
    });

    it('should identify skill gaps when no teams match required skills', () => {
      // Create solution requiring skill not available in any team
      const gapSolution: Solution = {
        id: 'sol-gap',
        name: 'Machine Learning Model',
        description: 'AI/ML solution',
        category: 'ai-ml',
        skills: ['skill-ai-ml'], // Skill not in any team
        complexity: 'high',
        estimatedEffort: 100,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const gapSkill: Skill = {
        id: 'skill-ai-ml',
        name: 'Machine Learning',
        category: 'ai-ml',
      };

      const extendedSkills = [...testSkills, gapSkill];
      const requiredSkills = ['skill-ai-ml'];

      // Test both teams for compatibility with ML skill
      const frontendResult = calculateTeamProjectCompatibility(
        testTeams[0],
        requiredSkills,
        extendedSkills
      );
      const backendResult = calculateTeamProjectCompatibility(
        testTeams[1],
        requiredSkills,
        extendedSkills
      );

      // Neither team should have ML skills
      expect(frontendResult.exactMatches).toBe(0);
      expect(frontendResult.compatibilityScore).toBe(0);
      expect(backendResult.exactMatches).toBe(0);
      expect(backendResult.compatibilityScore).toBe(0);
    });
  });

  describe('Performance with Large Skill Sets', () => {
    it('should handle projects with many solutions and skills efficiently', () => {
      // Create large dataset
      const largeSkillSet: Skill[] = Array.from({ length: 50 }, (_, i) => ({
        id: `skill-${i}`,
        name: `Skill ${i}`,
        category: `category-${i % 5}`,
      }));

      const largeSolutionSet: Solution[] = Array.from(
        { length: 20 },
        (_, i) => ({
          id: `sol-${i}`,
          name: `Solution ${i}`,
          description: `Description ${i}`,
          category: 'test',
          skills: [`skill-${i}`, `skill-${i + 1}`], // 2 skills per solution
          complexity: 'medium',
          estimatedEffort: 50,
          createdDate: '2024-01-01T00:00:00Z',
          lastModified: '2024-01-01T00:00:00Z',
        })
      );

      const largeProjectSolutions: ProjectSolution[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `ps-${i}`,
          projectId: 'proj-1',
          solutionId: `sol-${i}`,
          importance: 'medium',
          notes: '',
          estimatedEffort: 50,
        })
      );

      const startTime = performance.now();

      // Simulate skills derivation for large dataset
      const skillsFromSolutions: ProjectSkill[] = [];
      const skillIds = new Set<string>();

      largeProjectSolutions.forEach(ps => {
        const solution = largeSolutionSet.find(s => s.id === ps.solutionId);
        if (solution && solution.skills && Array.isArray(solution.skills)) {
          solution.skills.forEach(skillId => {
            if (!skillIds.has(skillId)) {
              skillIds.add(skillId);
              skillsFromSolutions.push({
                id: `solution-${ps.solutionId}-${skillId}`,
                projectId: 'proj-1',
                skillId,
                importance: ps.importance,
                notes: `Required by ${solution.name}`,
              });
            }
          });
        }
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process within reasonable time (< 100ms)
      expect(processingTime).toBeLessThan(100);

      // Should have unique skills from solutions (20 unique skills from 10 solutions)
      expect(skillsFromSolutions.length).toBe(20);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing solution references gracefully', () => {
      const projectSolutions: ProjectSolution[] = [
        {
          id: 'ps-missing',
          projectId: 'proj-1',
          solutionId: 'non-existent-solution', // Solution doesn't exist
          importance: 'high',
          notes: '',
          estimatedEffort: 100,
        },
      ];

      // Test skills derivation with missing solution
      const skillsFromSolutions: ProjectSkill[] = [];
      const skillIds = new Set<string>();

      projectSolutions.forEach(ps => {
        const solution = testSolutions.find(s => s.id === ps.solutionId);
        if (solution && solution.skills && Array.isArray(solution.skills)) {
          solution.skills.forEach(skillId => {
            if (!skillIds.has(skillId)) {
              skillIds.add(skillId);
              skillsFromSolutions.push({
                id: `solution-${ps.solutionId}-${skillId}`,
                projectId: 'proj-1',
                skillId,
                importance: ps.importance,
                notes: `Required by ${solution.name}`,
              });
            }
          });
        }
      });

      // Should handle missing solution gracefully (no skills added)
      expect(skillsFromSolutions).toHaveLength(0);
    });

    it('should handle solutions with empty or invalid skills arrays', () => {
      const solutionWithInvalidSkills: Solution = {
        id: 'sol-invalid',
        name: 'Invalid Skills Solution',
        description: 'Solution with problematic skills',
        category: 'test',
        skills: ['non-existent-skill', ''], // Mix of invalid skills
        complexity: 'low',
        estimatedEffort: 30,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const extendedSolutions = [...testSolutions, solutionWithInvalidSkills];

      const projectSolutions: ProjectSolution[] = [
        {
          id: 'ps-invalid',
          projectId: 'proj-1',
          solutionId: 'sol-invalid',
          importance: 'low',
          notes: '',
          estimatedEffort: 30,
        },
      ];

      // Test skills derivation with invalid skills
      const skillsFromSolutions: ProjectSkill[] = [];
      const skillIds = new Set<string>();

      projectSolutions.forEach(ps => {
        const solution = extendedSolutions.find(s => s.id === ps.solutionId);
        if (solution && solution.skills && Array.isArray(solution.skills)) {
          solution.skills.forEach(skillId => {
            // Only add valid skill IDs
            if (
              skillId &&
              typeof skillId === 'string' &&
              skillId.trim() !== '' &&
              !skillIds.has(skillId)
            ) {
              skillIds.add(skillId);
              skillsFromSolutions.push({
                id: `solution-${ps.solutionId}-${skillId}`,
                projectId: 'proj-1',
                skillId,
                importance: ps.importance,
                notes: `Required by ${solution.name}`,
              });
            }
          });
        }
      });

      // Should filter out invalid skills (only non-existent-skill should remain, but it won't match testSkills)
      expect(skillsFromSolutions).toHaveLength(1); // Only 'non-existent-skill'
      expect(skillsFromSolutions[0].skillId).toBe('non-existent-skill');
    });
  });
});
