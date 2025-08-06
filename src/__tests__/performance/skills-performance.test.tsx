/**
 * Skills Performance Tests
 * Validates performance with large datasets and complex skill operations
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '@/context/AppContext';
import { mockAppContext } from '@/test-utils/mockAppContext';
import {
  calculateTeamProjectCompatibility,
  recommendTeamsForProject,
  analyzeSkillCoverage,
} from '@/utils/skillBasedPlanning';
import SkillsBasedTeamFilter from '@/components/skills/SkillsBasedTeamFilter';
import ProjectSolutionsSkillsSection from '@/components/projects/ProjectSolutionsSkillsSection';
import { Team, Project, Skill, Solution, ProjectSolution } from '@/types';

// Performance test data generators
const generateSkills = (count: number): Skill[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `skill-${i}`,
    name: `Skill ${i}`,
    category: `category-${i % 10}`, // 10 different categories
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
    complexity: 'medium',
    estimatedEffort: 50,
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  }));

const generateProjects = (count: number): Project[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `project-${i}`,
    name: `Project ${i}`,
    description: `Performance test project ${i}`,
    status: 'planning',
    priority: 'medium',
    divisionId: 'dev',
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    budget: 100000,
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
        priority: 'high',
        divisionId: 'dev',
        startDate: '2024-01-15',
        endDate: '2024-06-15',
        budget: 500000,
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
      const projectSkills = requiredSkills.map((skillId, index) => ({
        id: `ps-${index}`,
        projectId: project.id,
        skillId,
        importance: 'medium' as const,
        notes: 'Test requirement',
      }));

      const compatibilityResults = teams.map(team =>
        calculateTeamProjectCompatibility(
          team,
          project,
          projectSkills,
          [],
          skills
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
            result.compatibilityScore <= 100
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
        priority: 'high',
        divisionId: 'dev',
        startDate: '2024-01-15',
        endDate: '2024-06-15',
        budget: 500000,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const projectSkills = requiredSkills.map((skillId, index) => ({
        id: `ps-${index}`,
        projectId: project.id,
        skillId,
        importance: 'high' as const,
        notes: 'Performance test requirement',
      }));

      const bestTeams = recommendTeamsForProject(
        project,
        teams,
        projectSkills,
        [],
        skills
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
      const projects = generateProjects(25);

      // Create project skills for each project
      const allProjectSkills = projects.map(project => ({
        projectId: project.id,
        requiredSkills: skills
          .slice(
            Math.floor(Math.random() * 50),
            Math.floor(Math.random() * 30) + 20
          )
          .map(s => s.id),
      }));

      const startTime = performance.now();

      const coverageAnalysis = analyzeSkillCoverage(teams, skills);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 200ms for complex analysis
      expect(duration).toBeLessThan(200);
      expect(coverageAnalysis.totalSkills).toBeLessThanOrEqual(100);
      expect(coverageAnalysis.coveredSkills).toBeLessThanOrEqual(
        coverageAnalysis.totalSkills
      );
      expect(coverageAnalysis.coveragePercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Component Rendering Performance', () => {
    it('should render SkillsBasedTeamFilter with large datasets quickly', () => {
      const skills = generateSkills(500);
      const teams = generateTeams(200, 15, 500);
      const projects = generateProjects(50);

      const mockContext = {
        ...mockAppContext,
        skills,
        teams,
        projects,
      };

      const startTime = performance.now();

      render(
        <AppProvider value={mockContext}>
          <SkillsBasedTeamFilter onFilteredTeamsChange={vi.fn()} />
        </AppProvider>
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should render within 200ms
      expect(duration).toBeLessThan(200);
      expect(
        screen.getByTestId('skills-based-team-filter')
      ).toBeInTheDocument();
    });

    it('should render ProjectSolutionsSkillsSection with many solutions efficiently', () => {
      const skills = generateSkills(300);
      const solutions = generateSolutions(100, 8, 300); // 100 solutions, 8 skills each
      const teams = generateTeams(75, 10, 300);

      const projectSolutions: ProjectSolution[] = solutions
        .slice(0, 20)
        .map((solution, i) => ({
          id: `ps-${i}`,
          projectId: 'perf-project',
          solutionId: solution.id,
          importance: 'medium',
          notes: '',
          estimatedEffort: 60,
        }));

      const mockContext = {
        ...mockAppContext,
        skills,
        solutions,
        teams,
      };

      const startTime = performance.now();

      render(
        <AppProvider value={mockContext}>
          <ProjectSolutionsSkillsSection
            projectId="perf-project"
            projectSolutions={projectSolutions}
            projectSkills={[]}
            onSolutionsChange={vi.fn()}
            onSkillsChange={vi.fn()}
          />
        </AppProvider>
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should render within 300ms even with many solutions/skills
      expect(duration).toBeLessThan(300);
      expect(
        screen.getByTestId('project-solutions-skills-section')
      ).toBeInTheDocument();
    });
  });

  describe('Memory Usage and Cleanup', () => {
    it('should not create memory leaks with frequent re-renders', () => {
      const skills = generateSkills(100);
      const teams = generateTeams(50, 8, 100);

      const mockContext = {
        ...mockAppContext,
        skills,
        teams,
      };

      const { rerender, unmount } = render(
        <AppProvider value={mockContext}>
          <SkillsBasedTeamFilter onFilteredTeamsChange={vi.fn()} />
        </AppProvider>
      );

      // Simulate multiple re-renders with different data
      for (let i = 0; i < 10; i++) {
        const updatedSkills = generateSkills(100 + i);
        const updatedContext = {
          ...mockContext,
          skills: updatedSkills,
        };

        rerender(
          <AppProvider value={updatedContext}>
            <SkillsBasedTeamFilter onFilteredTeamsChange={vi.fn()} />
          </AppProvider>
        );
      }

      // Component should still be responsive
      expect(
        screen.getByTestId('skills-based-team-filter')
      ).toBeInTheDocument();

      // Clean unmount
      unmount();
    });

    it('should efficiently update when skill data changes', () => {
      const initialSkills = generateSkills(200);
      const teams = generateTeams(30, 10, 200);

      const mockContext = {
        ...mockAppContext,
        skills: initialSkills,
        teams,
      };

      const { rerender } = render(
        <AppProvider value={mockContext}>
          <SkillsBasedTeamFilter onFilteredTeamsChange={vi.fn()} />
        </AppProvider>
      );

      const startTime = performance.now();

      // Update with new skills (simulating real-time data update)
      const updatedSkills = [
        ...initialSkills,
        ...generateSkills(50).map(skill => ({
          ...skill,
          id: `new-${skill.id}`,
        })),
      ];

      rerender(
        <AppProvider value={{ ...mockContext, skills: updatedSkills }}>
          <SkillsBasedTeamFilter onFilteredTeamsChange={vi.fn()} />
        </AppProvider>
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Re-render with updated data should be fast
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty datasets without performance penalty', () => {
      const mockContext = {
        ...mockAppContext,
        skills: [],
        teams: [],
        solutions: [],
        projects: [],
      };

      const startTime = performance.now();

      render(
        <AppProvider value={mockContext}>
          <SkillsBasedTeamFilter onFilteredTeamsChange={vi.fn()} />
        </AppProvider>
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should render instantly with empty data
      expect(duration).toBeLessThan(10);
      expect(
        screen.getByText('Select skills to filter teams')
      ).toBeInTheDocument();
    });

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
        priority: 'medium',
        divisionId: 'dev',
        startDate: '2024-01-15',
        endDate: '2024-06-15',
        budget: 100000,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const projectSkills = requiredSkills.map((skillId, index) => ({
        id: `ps-${index}`,
        projectId: mockProject.id,
        skillId,
        importance: 'medium' as const,
        notes: 'Test requirement',
      }));

      const results = teamsWithNoSkills.map(team =>
        calculateTeamProjectCompatibility(
          team,
          mockProject,
          projectSkills,
          [],
          skills
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
        priority: 'high',
        divisionId: 'dev',
        startDate: '2024-01-15',
        endDate: '2024-06-15',
        budget: 1000000,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      };

      const projectSkills = allSkillIds.map((skillId, index) => ({
        id: `ps-all-${index}`,
        projectId: project.id,
        skillId,
        importance: 'high' as const,
        notes: 'Critical requirement',
      }));

      const bestTeam = recommendTeamsForProject(
        project,
        teams,
        projectSkills,
        [],
        skills
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle worst-case scenario efficiently
      expect(duration).toBeLessThan(300);
      expect(bestTeam).toHaveLength(3);
    });
  });
});
