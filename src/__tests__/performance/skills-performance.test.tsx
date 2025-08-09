/**
 * Skills Performance Tests
 * Validates performance with large datasets and complex skill operations
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  calculateTeamProjectCompatibility,
  recommendTeamsForProject,
  analyzeSkillCoverage,
} from '@/utils/skillBasedPlanning';
import {
  Team,
  Project,
  Skill,
  Solution,
  ProjectSolution,
  ProjectSkill,
} from '@/types';

// Performance test data generators
const generateSkills = (count: number): Skill[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `skill-${i}`,
    name: `Skill ${i}`,
    category: `category-${i % 10}`,
    createdDate: '2024-01-01T00:00:00Z',
  }));

const generateTeams = (
  count: number,
  skillsPerTeam: number,
  totalSkills: number
): Team[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `team-${i}`,
    name: `Team ${i}`,
    description: `Performance test team ${i}`,
    type: 'permanent',
    status: 'active',
    divisionId: 'dev',
    capacity: 40,
    targetSkills: Array.from(
      { length: skillsPerTeam },
      (_, j) => `skill-${(i * skillsPerTeam + j) % totalSkills}`
    ),
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  }));

const generateSolutions = (
  count: number,
  skillsPerSolution: number,
  totalSkills: number
): Solution[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `solution-${i}`,
    name: `Solution ${i}`,
    description: `Performance test solution ${i}`,
    category: 'web-application',
    skills: Array.from(
      { length: skillsPerSolution },
      (_, j) => `skill-${(i * skillsPerSolution + j) % totalSkills}`
    ),
    createdDate: '2024-01-01T00:00:00Z',
  }));

const generateProjects = (count: number): Project[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `project-${i}`,
    name: `Project ${i}`,
    description: `Performance test project ${i}`,
    status: 'planning',
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    milestones: [],
    priority: 500,
    ranking: i + 1,
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  }));

describe('Skills Performance Tests', () => {
  describe('Skill-Based Planning Performance', () => {
    it('should handle large skill sets efficiently (1000 skills, 100 teams)', () => {
      const skills = generateSkills(1000);
      const teams = generateTeams(100, 10, 1000); // 10 skills per team
      const project: Project = {
        id: 'perf-project',
        name: 'Performance Test Project',
        description: 'Large scale performance test',
        status: 'planning',
        startDate: '2024-01-15',
        endDate: '2024-06-15',
        milestones: [],
        priority: 500,
        ranking: 1,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const requiredSkills = [
        'skill-0',
        'skill-1',
        'skill-2',
        'skill-3',
        'skill-4',
      ];

      const startTime = performance.now();

      // Test compatibility calculation for all teams
      const projectSkills: ProjectSkill[] = requiredSkills.map(
        (skillId, index) => ({
          id: `ps-${index}`,
          projectId: project.id,
          skillId,
          importance: 'medium' as const,
          notes: 'Test requirement',
        })
      );

      const compatibilityResults = teams.map(team =>
        calculateTeamProjectCompatibility(
          team,
          project,
          projectSkills,
          [],
          skills,
          []
        )
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 50ms for 1000 skills x 100 teams
      expect(duration).toBeLessThan(50);
      expect(compatibilityResults).toHaveLength(100);
      expect(
        compatibilityResults.every(
          result =>
            typeof result.compatibilityScore === 'number' &&
            result.compatibilityScore >= 0 &&
            result.compatibilityScore <= 1
        )
      ).toBe(true);
    });

    it('should efficiently find best teams from large pool (500 teams)', () => {
      const skills = generateSkills(200);
      const teams = generateTeams(500, 8, 200); // 500 teams, 8 skills each
      const requiredSkills = skills.slice(0, 10).map(s => s.id); // First 10 skills

      const startTime = performance.now();

      const project: Project = {
        id: 'perf-project',
        name: 'Performance Test Project',
        description: 'Large scale performance test',
        status: 'planning',
        startDate: '2024-01-15',
        endDate: '2024-06-15',
        milestones: [],
        priority: 500,
        ranking: 1,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const projectSkills: ProjectSkill[] = requiredSkills.map(
        (skillId, index) => ({
          id: `ps-${index}`,
          projectId: project.id,
          skillId,
          importance: 'high' as const,
          notes: 'Performance test requirement',
        })
      );

      const bestTeams = recommendTeamsForProject(
        project,
        teams,
        projectSkills,
        [],
        skills,
        [],
        3
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 100ms for 500 teams
      expect(duration).toBeLessThan(100);
      expect(bestTeams).toHaveLength(3); // Top 3 teams
      expect(
        bestTeams[0].compatibility.compatibilityScore
      ).toBeGreaterThanOrEqual(bestTeams[1].compatibility.compatibilityScore);
    });

    it('should handle complex skill coverage analysis efficiently', () => {
      const skills = generateSkills(100);
      const teams = generateTeams(50, 12, 100);

      const startTime = performance.now();

      const coverageAnalysis = analyzeSkillCoverage(teams, skills);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 200ms for complex analysis
      expect(duration).toBeLessThan(200);
      expect(coverageAnalysis.totalSkills).toBe(100);
      expect(coverageAnalysis.coveredSkills).toBeLessThanOrEqual(
        coverageAnalysis.totalSkills
      );
      expect(coverageAnalysis.coveragePercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Algorithm Performance with Edge Cases', () => {
    it('should handle teams with no skills efficiently', () => {
      const skills = generateSkills(100);
      const teamsWithNoSkills: Team[] = Array.from({ length: 50 }, (_, i) => ({
        id: `empty-team-${i}`,
        name: `Empty Team ${i}`,
        description: 'Team with no skills',
        type: 'permanent',
        status: 'active',
        divisionId: 'dev',
        capacity: 40,
        targetSkills: [], // No skills
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      }));

      const requiredSkills = skills.slice(0, 5).map(s => s.id);

      const startTime = performance.now();

      const mockProject: Project = {
        id: 'test-project',
        name: 'Test Project',
        description: 'Test project',
        status: 'planning',
        startDate: '2024-01-15',
        endDate: '2024-06-15',
        milestones: [],
        priority: 500,
        ranking: 1,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const projectSkills: ProjectSkill[] = requiredSkills.map(
        (skillId, index) => ({
          id: `ps-${index}`,
          projectId: mockProject.id,
          skillId,
          importance: 'medium' as const,
          notes: 'Test requirement',
        })
      );

      const results = teamsWithNoSkills.map(team =>
        calculateTeamProjectCompatibility(
          team,
          mockProject,
          projectSkills,
          [],
          skills,
          []
        )
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle empty skill arrays efficiently
      expect(duration).toBeLessThan(20);
      expect(results.every(result => result.compatibilityScore === 0)).toBe(
        true
      );
    });

    it('should handle projects requiring all available skills', () => {
      const skills = generateSkills(200);
      const teams = generateTeams(25, 20, 200); // 25 teams with 20 skills each
      const allSkillIds = skills.map(s => s.id);

      const startTime = performance.now();

      const project: Project = {
        id: 'perf-project-all',
        name: 'All Skills Performance Test',
        description: 'Test requiring all skills',
        status: 'planning',
        startDate: '2024-01-15',
        endDate: '2024-06-15',
        milestones: [],
        priority: 500,
        ranking: 1,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const projectSkills: ProjectSkill[] = allSkillIds.map(
        (skillId, index) => ({
          id: `ps-all-${index}`,
          projectId: project.id,
          skillId,
          importance: 'high' as const,
          notes: 'Critical requirement',
        })
      );

      const bestTeam = recommendTeamsForProject(
        project,
        teams,
        projectSkills,
        [],
        skills,
        [],
        3
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle worst-case scenario efficiently
      expect(duration).toBeLessThan(300);
      expect(bestTeam).toHaveLength(3);
    });
  });
});
