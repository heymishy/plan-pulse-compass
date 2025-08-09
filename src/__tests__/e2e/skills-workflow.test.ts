/**
 * E2E Skills Workflow Tests
 * Validates complete skills architecture including GitHub Issue #75
 * Tests core skills auto-linking logic and team compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTeamProjectCompatibility,
  getProjectRequiredSkills,
} from '@/utils/skillBasedPlanning';
import {
  Project,
  Solution,
  Skill,
  ProjectSolution,
  ProjectSkill,
  Team,
  Person,
  PersonSkill,
} from '@/types';

// Helper function to create simple compatibility test
// Uses team-level skills (team.targetSkills) for simplicity
const calculateSimpleTeamCompatibility = (
  team: Team,
  requiredSkills: string[],
  skills: Skill[]
) => {
  const mockProject: Project = {
    id: 'test-project',
    name: 'Test Project',
    description: 'Test project for compatibility',
    status: 'planning',
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    milestones: [],
    priority: 1,
    ranking: 1,
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  };

  const mockProjectSkills: ProjectSkill[] = requiredSkills.map(
    (skillId, index) => ({
      id: `ps-${index}`,
      projectId: 'test-project',
      skillId,
      importance: 'medium',
      notes: 'Test skill requirement',
    })
  );

  // Use team-level skills - no need for person data in this case
  return calculateTeamProjectCompatibility(
    team,
    mockProject,
    mockProjectSkills,
    [],
    skills,
    []
  );
};

// Test data setup
const testSkills: Skill[] = [
  {
    id: 'skill-1',
    name: 'React Development',
    category: 'frontend',
    createdDate: '2024-01-01T00:00:00Z',
  },
  {
    id: 'skill-2',
    name: 'Node.js',
    category: 'backend',
    createdDate: '2024-01-01T00:00:00Z',
  },
  {
    id: 'skill-3',
    name: 'Database Design',
    category: 'backend',
    createdDate: '2024-01-01T00:00:00Z',
  },
  {
    id: 'skill-4',
    name: 'UI/UX Design',
    category: 'design',
    createdDate: '2024-01-01T00:00:00Z',
  },
];

const testSolutions: Solution[] = [
  {
    id: 'sol-1',
    name: 'E-commerce Platform',
    description: 'Full-stack e-commerce solution',
    category: 'web-application',
    skills: ['skill-1', 'skill-2', 'skill-3'], // React, Node.js, Database
    createdDate: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sol-2',
    name: 'Mobile App Design',
    description: 'UI/UX design for mobile applications',
    category: 'design',
    skills: ['skill-4'], // UI/UX Design only
    createdDate: '2024-01-01T00:00:00Z',
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
  startDate: '2024-01-15',
  endDate: '2024-06-15',
  milestones: [],
  priority: 1,
  ranking: 1,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
};

describe('E2E Skills Workflow Tests', () => {
  describe('GitHub Issue #75: Solution-to-Project Skills Auto-Linking', () => {
    it('should automatically derive skills from project solutions', () => {
      const projectSolutions: ProjectSolution[] = [
        {
          id: 'ps-1',
          projectId: 'proj-1',
          solutionId: 'sol-1', // E-commerce solution
          importance: 'high',
        },
      ];

      const derivedSkills = getProjectRequiredSkills(
        testProject,
        [],
        testSolutions,
        testSkills,
        projectSolutions
      );

      expect(derivedSkills).toHaveLength(3);
      expect(derivedSkills.map(s => s.skillId).sort()).toEqual([
        'skill-1',
        'skill-2',
        'skill-3',
      ]);
    });

    it('should not duplicate skills when same skill exists in multiple solutions', () => {
      const overlappingSolution: Solution = {
        id: 'sol-overlap',
        name: 'React Dashboard',
        description: 'Dashboard with React',
        category: 'web-application',
        skills: ['skill-1'], // React Development - overlaps with e-commerce
        createdDate: '2024-01-01T00:00:00Z',
      };
      const allSolutions = [...testSolutions, overlappingSolution];
      const projectSolutions: ProjectSolution[] = [
        {
          id: 'ps-1',
          projectId: 'proj-1',
          solutionId: 'sol-1',
          importance: 'high',
        },
        {
          id: 'ps-2',
          projectId: 'proj-1',
          solutionId: 'sol-overlap',
          importance: 'medium',
        },
      ];

      const derivedSkills = getProjectRequiredSkills(
        testProject,
        [],
        allSolutions,
        testSkills,
        projectSolutions
      );

      const reactSkills = derivedSkills.filter(s => s.skillId === 'skill-1');
      expect(reactSkills).toHaveLength(1);
      expect(derivedSkills).toHaveLength(3);
    });

    it('should combine solution skills with manual skills correctly', () => {
      const projectSolutions: ProjectSolution[] = [
        {
          id: 'ps-1',
          projectId: 'proj-1',
          solutionId: 'sol-2',
          importance: 'high',
        },
      ];
      const manualSkills: ProjectSkill[] = [
        {
          id: 'manual-1',
          projectId: 'proj-1',
          skillId: 'skill-1',
          importance: 'medium',
        },
      ];

      const derivedSkills = getProjectRequiredSkills(
        testProject,
        manualSkills,
        testSolutions,
        testSkills,
        projectSolutions
      );

      expect(derivedSkills).toHaveLength(2);
      expect(derivedSkills.some(s => s.skillId === 'skill-4')).toBe(true);
      expect(derivedSkills.some(s => s.skillId === 'skill-1')).toBe(true);
    });
  });

  describe('Team-Project Skills Matching Integration', () => {
    it('should calculate team compatibility based on solution skills', () => {
      const requiredSkills = ['skill-1', 'skill-2', 'skill-3'];
      const frontendCompatibility = calculateSimpleTeamCompatibility(
        testTeams[0],
        requiredSkills,
        testSkills
      );
      const backendCompatibility = calculateSimpleTeamCompatibility(
        testTeams[1],
        requiredSkills,
        testSkills
      );

      expect(frontendCompatibility.skillsMatched).toBe(1);
      expect(frontendCompatibility.skillsRequired).toBe(3);
      expect(backendCompatibility.skillsMatched).toBe(2);
      expect(backendCompatibility.skillsRequired).toBe(3);
      expect(backendCompatibility.compatibilityScore).toBeGreaterThan(
        frontendCompatibility.compatibilityScore
      );
    });

    it('should identify skill gaps when no teams match required skills', () => {
      const gapSkill: Skill = {
        id: 'skill-ai-ml',
        name: 'Machine Learning',
        category: 'ai-ml',
        createdDate: '2024-01-01T00:00:00Z',
      };
      const extendedSkills = [...testSkills, gapSkill];
      const requiredSkills = ['skill-ai-ml'];

      const frontendResult = calculateSimpleTeamCompatibility(
        testTeams[0],
        requiredSkills,
        extendedSkills
      );
      const backendResult = calculateSimpleTeamCompatibility(
        testTeams[1],
        requiredSkills,
        extendedSkills
      );

      expect(frontendResult.skillsMatched).toBe(0);
      expect(backendResult.skillsMatched).toBe(0);
    });
  });
});
