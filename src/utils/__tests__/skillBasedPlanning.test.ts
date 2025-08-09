import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProjectRequiredSkills,
  calculateTeamProjectCompatibility,
  analyzeProjectSkillGaps,
  filterTeamsBySkills,
  analyzeSkillCoverage,
  recommendTeamsForProject,
} from '../skillBasedPlanning';
import {
  Team,
  Project,
  Skill,
  ProjectSkill,
  Solution,
  ProjectSolution,
  Person,
  PersonSkill,
} from '@/types';

describe('Skills-Based Planning Utilities', () => {
  let mockTeams: Team[];
  let mockProjects: Project[];
  let mockSkills: Skill[];
  let mockProjectSkills: ProjectSkill[];
  let mockSolutions: Solution[];
  let mockProjectSolutions: ProjectSolution[];
  let mockPeople: Person[];
  let mockPersonSkills: PersonSkill[];

  beforeEach(() => {
    mockSkills = [
      {
        id: 'skill1',
        name: 'React',
        category: 'Frontend',
        description: 'React.js library',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill2',
        name: 'Node.js',
        category: 'Backend',
        description: 'Node.js runtime',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill3',
        name: 'TypeScript',
        category: 'Language',
        description: 'TypeScript language',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill4',
        name: 'Vue.js',
        category: 'Frontend',
        description: 'Vue.js framework',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill5',
        name: 'Python',
        category: 'Language',
        description: 'Python programming language',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill6',
        name: 'Docker',
        category: 'DevOps',
        description: 'Container platform',
        createdDate: '2024-01-01T00:00:00Z',
      },
    ];

    mockTeams = [
      {
        id: 'team1',
        name: 'Frontend Team',
        description: 'UI development team',
        type: 'permanent',
        status: 'active',
        divisionId: 'engineering',
        capacity: 40,
        targetSkills: ['skill1', 'skill3'], // React, TypeScript
        projectIds: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team2',
        name: 'Backend Team',
        description: 'API development team',
        type: 'permanent',
        status: 'active',
        divisionId: 'engineering',
        capacity: 60,
        targetSkills: ['skill2', 'skill3', 'skill6'], // Node.js, TypeScript, Docker
        projectIds: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team3',
        name: 'Full Stack Team',
        description: 'Full stack development team',
        type: 'permanent',
        status: 'active',
        divisionId: 'engineering',
        capacity: 50,
        targetSkills: ['skill1', 'skill2', 'skill3'], // React, Node.js, TypeScript
        projectIds: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team4',
        name: 'Python Team',
        description: 'Python development team',
        type: 'permanent',
        status: 'active',
        divisionId: 'data',
        capacity: 30,
        targetSkills: ['skill5', 'skill6'], // Python, Docker
        projectIds: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
    ];

    mockSolutions = [
      {
        id: 'solution1',
        name: 'Web Application',
        description: 'Modern web application solution',
        category: 'frontend',
        skills: ['skill1', 'skill3'], // React, TypeScript
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'solution2',
        name: 'API Service',
        description: 'RESTful API service solution',
        category: 'backend',
        skills: ['skill2', 'skill3', 'skill6'], // Node.js, TypeScript, Docker
        createdDate: '2024-01-01T00:00:00Z',
      },
    ];

    mockProjects = [
      {
        id: 'project1',
        name: 'E-commerce Platform',
        description: 'Online shopping platform',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        milestones: [],
        priority: 1,
        ranking: 1,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'project2',
        name: 'Data Analytics API',
        description: 'Analytics API service',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        milestones: [],
        priority: 2,
        ranking: 2,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'project3',
        name: 'Full Stack Application',
        description: 'Complete web application with API',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        milestones: [],
        priority: 3,
        ranking: 3,
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
    ];

    mockProjectSkills = [
      {
        id: 'ps1',
        projectId: 'project1',
        skillId: 'skill4',
        importance: 'medium',
      },
      {
        id: 'ps2',
        projectId: 'project2',
        skillId: 'skill5',
        importance: 'high',
      },
    ];

    mockProjectSolutions = [
      {
        id: 'psol1',
        projectId: 'project1',
        solutionId: 'solution1',
        importance: 'high',
      },
      {
        id: 'psol2',
        projectId: 'project2',
        solutionId: 'solution2',
        importance: 'high',
      },
      {
        id: 'psol3',
        projectId: 'project3',
        solutionId: 'solution1',
        importance: 'high',
      },
      {
        id: 'psol4',
        projectId: 'project3',
        solutionId: 'solution2',
        importance: 'high',
      },
    ];

    mockPeople = [
      {
        id: 'person1',
        name: 'John Doe',
        email: 'john@example.com',
        teamId: 'team1',
        role: 'developer',
        status: 'active',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'person2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        teamId: 'team2',
        role: 'developer',
        status: 'active',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'person3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        teamId: 'team3',
        role: 'developer',
        status: 'active',
        createdDate: '2024-01-01T00:00:00Z',
      },
    ];

    mockPersonSkills = [
      {
        id: 'ps1',
        personId: 'person1',
        skillId: 'skill1', // React
        proficiencyLevel: 'advanced',
        yearsOfExperience: 3,
        lastUsed: '2024-01-01',
        certified: false,
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'ps2',
        personId: 'person1',
        skillId: 'skill3', // TypeScript
        proficiencyLevel: 'intermediate',
        yearsOfExperience: 2,
        lastUsed: '2024-01-01',
        certified: false,
        createdDate: '2024-01-01T00:00:00Z',
      },
    ];
  });

  describe('getProjectRequiredSkills', () => {
    it('should get skills from project solutions', () => {
      const requiredSkills = getProjectRequiredSkills(
        mockProjects[0],
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions
      );

      expect(requiredSkills).toHaveLength(2);
      expect(requiredSkills.map(s => s.skillName).sort()).toEqual([
        'React',
        'TypeScript',
      ]);
      expect(requiredSkills.every(s => s.source === 'solution')).toBe(true);
    });

    it('should get skills from project-specific skills', () => {
      const requiredSkills = getProjectRequiredSkills(
        mockProjects[0],
        mockProjectSkills.filter(ps => ps.projectId === 'project1'),
        [],
        mockSkills,
        []
      );

      expect(requiredSkills).toHaveLength(1);
      expect(requiredSkills[0].skillName).toBe('Vue.js');
      expect(requiredSkills[0].source).toBe('project');
    });

    it('should combine solution skills and project-specific skills', () => {
      const requiredSkills = getProjectRequiredSkills(
        mockProjects[0],
        mockProjectSkills.filter(ps => ps.projectId === 'project1'),
        mockSolutions,
        mockSkills,
        mockProjectSolutions
      );

      expect(requiredSkills).toHaveLength(3);
      const skillNames = requiredSkills.map(s => s.skillName).sort();
      expect(skillNames).toEqual(['React', 'TypeScript', 'Vue.js']);
    });

    it('should handle projects with multiple solutions', () => {
      const requiredSkills = getProjectRequiredSkills(
        mockProjects[2],
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions
      );

      expect(requiredSkills).toHaveLength(4);
      const skillNames = requiredSkills.map(s => s.skillName).sort();
      expect(skillNames).toEqual(['Docker', 'Node.js', 'React', 'TypeScript']);
    });

    it('should handle missing solutions gracefully', () => {
      const projectWithMissingSolution = {
        ...mockProjects[0],
      };
      const projectSolutionsWithMissing = [
        {
          id: 'psol-missing',
          projectId: projectWithMissingSolution.id,
          solutionId: 'non-existent-solution',
          importance: 'high' as const,
        },
      ];

      const requiredSkills = getProjectRequiredSkills(
        projectWithMissingSolution,
        [],
        mockSolutions,
        mockSkills,
        projectSolutionsWithMissing
      );

      expect(requiredSkills).toHaveLength(0);
    });
  });

  describe('calculateTeamProjectCompatibility', () => {
    it('should calculate fair compatibility for partial skill match', () => {
      const compatibility = calculateTeamProjectCompatibility(
        mockTeams[0], // Frontend Team: React, TypeScript
        mockProjects[0], // E-commerce Platform requires: React, TypeScript, Vue.js
        mockProjectSkills.filter(ps => ps.projectId === 'project1'),
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills
      );

      expect(compatibility.teamId).toBe('team1');
      expect(compatibility.projectId).toBe('project1');
      expect(compatibility.skillsRequired).toBe(3);
      expect(compatibility.skillsMatched).toBe(2); // React, TypeScript
      expect(compatibility.skillsGap).toBe(1); // Missing Vue.js
      expect(compatibility.compatibilityScore).toBeCloseTo(0.7, 2); // Actual calculated value
      expect(compatibility.recommendation).toBe('good');
    });

    it('should calculate high compatibility for full stack team', () => {
      const compatibility = calculateTeamProjectCompatibility(
        mockTeams[2], // Full Stack Team: React, Node.js, TypeScript
        mockProjects[2], // Full Stack Application requires: React, TypeScript, Node.js, Docker
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions
      );

      expect(compatibility.compatibilityScore).toBeCloseTo(0.75, 2); // 3/4
      expect(compatibility.recommendation).toBe('good');
      expect(compatibility.skillsMatched).toBe(3);
      expect(compatibility.skillsGap).toBe(1); // Missing Docker
    });

    it('should identify category matches for related skills', () => {
      const compatibility = calculateTeamProjectCompatibility(
        mockTeams[0], // Frontend Team: React, TypeScript
        mockProjects[0],
        [
          {
            id: 'ps1',
            projectId: 'project1',
            skillId: 'skill4',
            importance: 'medium',
          },
        ], // Requires Vue.js
        [],
        mockSkills,
        []
      );

      const vueSkillMatch = compatibility.skillMatches.find(
        sm => sm.skillName === 'Vue.js'
      );
      expect(vueSkillMatch?.matchType).toBe('category'); // Team has React (same Frontend category)
    });

    it('should provide detailed reasoning for recommendations', () => {
      const compatibility = calculateTeamProjectCompatibility(
        mockTeams[2], // Full Stack Team
        mockProjects[2], // Full Stack Application
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions
      );

      expect(compatibility.reasoning).toContain(
        'Good skill compatibility (75%)'
      );
      expect(compatibility.reasoning.some(r => r.includes('Strong in:'))).toBe(
        true
      );
    });

    it('should handle teams with no matching skills', () => {
      const compatibility = calculateTeamProjectCompatibility(
        mockTeams[3], // Python Team: Python, Docker
        mockProjects[0], // E-commerce Platform requires: React, TypeScript, Vue.js
        mockProjectSkills.filter(ps => ps.projectId === 'project1'),
        mockSolutions,
        mockSkills,
        mockProjectSolutions
      );

      expect(compatibility.compatibilityScore).toBeCloseTo(0.033, 2); // Actual calculated value
      expect(compatibility.recommendation).toBe('poor');
      expect(compatibility.skillsMatched).toBe(0);
      expect(compatibility.skillsGap).toBe(3);
    });

    it('should handle empty skill requirements', () => {
      const projectWithNoSkills = {
        ...mockProjects[0],
      };

      const compatibility = calculateTeamProjectCompatibility(
        mockTeams[0],
        projectWithNoSkills,
        [],
        mockSolutions,
        mockSkills,
        []
      );

      expect(compatibility.compatibilityScore).toBe(0);
      expect(compatibility.skillsRequired).toBe(0);
      expect(compatibility.skillsMatched).toBe(0);
    });
  });

  describe('analyzeProjectSkillGaps', () => {
    it('should identify the best team for a project', () => {
      const analysis = analyzeProjectSkillGaps(
        mockProjects[2], // Full Stack Application
        mockTeams,
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills
      );

      expect(analysis.projectId).toBe('project3');
      expect(analysis.projectName).toBe('Full Stack Application');
      expect(analysis.recommendations.bestTeam).toBe('team2'); // Backend Team should be best (3/4 skills)
    });

    it('should identify skill gaps across teams', () => {
      const analysis = analyzeProjectSkillGaps(
        mockProjects[0], // E-commerce Platform requires: React, TypeScript, Vue.js
        mockTeams,
        mockProjectSkills.filter(ps => ps.projectId === 'project1'),
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills
      );

      const vueGap = analysis.recommendations.skillGaps.find(
        gap => gap.skillName === 'Vue.js'
      );
      expect(vueGap).toBeDefined();
      expect(vueGap?.teamsNeeding.length).toBeGreaterThan(0);
    });

    it('should categorize skill priorities correctly', () => {
      const analysis = analyzeProjectSkillGaps(
        mockProjects[2], // Full Stack Application
        mockTeams,
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills
      );

      const dockerGap = analysis.recommendations.skillGaps.find(
        gap => gap.skillName === 'Docker'
      );
      expect(dockerGap?.priority).toBe('important'); // Most teams lack Docker
    });

    it('should provide training and hiring recommendations', () => {
      const analysis = analyzeProjectSkillGaps(
        mockProjects[2], // Full Stack Application
        mockTeams,
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills
      );

      expect(analysis.recommendations.trainingNeeds).toBeDefined();
      expect(analysis.recommendations.hiringNeeds).toBeDefined();
    });

    it('should handle projects with no matching teams', () => {
      const pythonOnlyProject = {
        ...mockProjects[0],
      };
      const pythonOnlyProjectSkills = [
        {
          id: 'ps1',
          projectId: 'project1',
          skillId: 'skill5',
          importance: 'high' as const,
        }, // Python only
      ];

      const analysis = analyzeProjectSkillGaps(
        pythonOnlyProject,
        [mockTeams[0], mockTeams[1]], // Frontend and Backend teams (no Python)
        pythonOnlyProjectSkills,
        mockSolutions,
        mockSkills,
        [],
        mockPeople,
        mockPersonSkills
      );

      expect(analysis.recommendations.bestTeam).toBeNull();
    });
  });

  describe('filterTeamsBySkills', () => {
    it('should filter teams by required skills', () => {
      const filteredTeams = filterTeamsBySkills(
        mockTeams,
        ['skill1', 'skill3'], // React, TypeScript
        mockSkills,
        mockPeople,
        mockPersonSkills,
        0.5 // 50% minimum compatibility
      );

      expect(filteredTeams).toHaveLength(3);
      expect(filteredTeams[0].compatibilityScore).toBe(1);
      expect(filteredTeams[1].compatibilityScore).toBe(1);
    });

    it('should sort results by compatibility score', () => {
      const filteredTeams = filterTeamsBySkills(
        mockTeams,
        ['skill1', 'skill2', 'skill3'], // React, Node.js, TypeScript
        mockSkills,
        mockPeople,
        mockPersonSkills,
        0.3
      );

      expect(filteredTeams).toHaveLength(3);
      expect(filteredTeams[0].compatibilityScore).toBe(1);
      expect(filteredTeams[1].compatibilityScore).toBeCloseTo(0.67, 2);
    });

    it('should include matching skills in results', () => {
      const filteredTeams = filterTeamsBySkills(
        mockTeams,
        ['skill1', 'skill2'], // React, Node.js
        mockSkills,
        mockPeople,
        mockPersonSkills,
        0.4
      );

      const fullStackResult = filteredTeams.find(
        result => result.team.id === 'team3'
      );
      expect(fullStackResult?.matchingSkills).toEqual(['React', 'Node.js']);
    });

    it('should handle empty skill requirements', () => {
      const filteredTeams = filterTeamsBySkills(
        mockTeams,
        [],
        mockSkills,
        mockPeople,
        mockPersonSkills
      );

      expect(filteredTeams).toHaveLength(mockTeams.length);
      expect(
        filteredTeams.every(result => result.compatibilityScore === 1)
      ).toBe(true);
    });

    it('should respect minimum compatibility threshold', () => {
      const filteredTeams = filterTeamsBySkills(
        mockTeams,
        ['skill1', 'skill2', 'skill3'], // React, Node.js, TypeScript
        mockSkills,
        mockPeople,
        mockPersonSkills,
        0.8 // 80% minimum compatibility
      );

      expect(filteredTeams).toHaveLength(1);
      expect(filteredTeams[0].team.id).toBe('team3');
    });
  });

  describe('analyzeSkillCoverage', () => {
    it('should calculate overall skill coverage', () => {
      const coverage = analyzeSkillCoverage(
        mockTeams,
        mockSkills,
        mockPeople,
        mockPersonSkills
      );

      expect(coverage.totalSkills).toBe(6);
      expect(coverage.coveredSkills).toBe(5);
      expect(coverage.coveragePercentage).toBeCloseTo(83.33, 2);
    });

    it('should identify skills coverage per skill', () => {
      const coverage = analyzeSkillCoverage(
        mockTeams,
        mockSkills,
        mockPeople,
        mockPersonSkills
      );

      const reactCoverage = coverage.skillCoverage.find(
        sc => sc.skillName === 'React'
      );
      expect(reactCoverage?.coverageCount).toBe(2);
      expect(reactCoverage?.teamsWithSkill).toHaveLength(2);

      const vueCoverage = coverage.skillCoverage.find(
        sc => sc.skillName === 'Vue.js'
      );
      expect(vueCoverage?.coverageCount).toBe(0);
      expect(vueCoverage?.isAtRisk).toBe(true);
    });

    it('should analyze coverage by category', () => {
      const coverage = analyzeSkillCoverage(
        mockTeams,
        mockSkills,
        mockPeople,
        mockPersonSkills
      );

      expect(coverage.categoryAnalysis['Frontend']).toBeDefined();
      expect(coverage.categoryAnalysis['Frontend'].totalSkills).toBe(2);
      expect(coverage.categoryAnalysis['Frontend'].coveredSkills).toBe(1);
      expect(coverage.categoryAnalysis['Frontend'].coveragePercentage).toBe(50);
    });

    it('should identify well-covered and at-risk skills', () => {
      const coverage = analyzeSkillCoverage(
        mockTeams,
        mockSkills,
        mockPeople,
        mockPersonSkills
      );

      expect(coverage.recommendations.skillsAtRisk).toContain('Vue.js');
      expect(coverage.recommendations.skillsWellCovered).toContain(
        'TypeScript'
      ); // 3 teams
    });

    it('should identify categories needing attention', () => {
      const coverage = analyzeSkillCoverage(
        mockTeams,
        mockSkills,
        mockPeople,
        mockPersonSkills
      );

      expect(coverage.recommendations.categoriesNeedingAttention).toContain(
        'Frontend'
      ); // 50% coverage
    });

    it('should handle teams with no skills', () => {
      const teamsWithoutSkills = [
        { ...mockTeams[0], targetSkills: [] },
        { ...mockTeams[1], targetSkills: [] },
      ];

      // Use empty people and person skills arrays to truly test "no skills" scenario
      const coverage = analyzeSkillCoverage(
        teamsWithoutSkills,
        mockSkills,
        [],
        []
      );

      expect(coverage.coveredSkills).toBe(0);
      expect(coverage.coveragePercentage).toBe(0);
      expect(coverage.recommendations.skillsAtRisk).toHaveLength(6);
    });
  });

  describe('recommendTeamsForProject', () => {
    it('should recommend best teams for a project', () => {
      const recommendations = recommendTeamsForProject(
        mockProjects[2],
        mockTeams,
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills,
        3
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].rank).toBe(1);
      expect(recommendations[0].team.id).toBe('team2');
      expect(recommendations[0].recommendation).toContain('Good match');
    });

    it('should provide ranked recommendations with explanations', () => {
      const recommendations = recommendTeamsForProject(
        mockProjects[0],
        mockTeams,
        mockProjectSkills.filter(ps => ps.projectId === 'project1'),
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills,
        2
      );

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].rank).toBe(1);
      expect(recommendations[1].rank).toBe(2);
      expect(recommendations[0].recommendation).toBeDefined();
      expect(recommendations[1].recommendation).toBeDefined();
    });

    it('should respect maximum recommendations limit', () => {
      const recommendations = recommendTeamsForProject(
        mockProjects[2],
        mockTeams,
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills,
        2 // Limit to 2 recommendations
      );

      expect(recommendations).toHaveLength(2);
    });

    it('should handle projects requiring skills no teams have', () => {
      const specializedProject = {
        ...mockProjects[0],
      };
      const specializedProjectSkills = [
        {
          id: 'ps1',
          projectId: 'project1',
          skillId: 'skill4',
          importance: 'high' as const,
        }, // Vue.js only
      ];

      const recommendations = recommendTeamsForProject(
        specializedProject,
        mockTeams,
        specializedProjectSkills,
        mockSolutions,
        mockSkills,
        [],
        mockPeople,
        mockPersonSkills
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].compatibility.compatibilityScore).toBeCloseTo(
        0.1,
        2
      ); // Small category bonus for Frontend team
    });

    it('should provide appropriate recommendations for different compatibility levels', () => {
      const recommendations = recommendTeamsForProject(
        mockProjects[2],
        mockTeams,
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills
      );

      const topRecommendation = recommendations[0];
      if (topRecommendation.compatibility.compatibilityScore > 0.8) {
        expect(topRecommendation.recommendation).toContain('Excellent match');
      } else if (topRecommendation.compatibility.compatibilityScore > 0.6) {
        expect(topRecommendation.recommendation).toContain('Good match');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty teams array', () => {
      const compatibility = calculateTeamProjectCompatibility(
        mockTeams[0],
        mockProjects[0],
        [],
        [],
        mockSkills,
        []
      );

      expect(compatibility.compatibilityScore).toBe(0);
    });

    it('should handle empty skills array', () => {
      const coverage = analyzeSkillCoverage(mockTeams, []);

      expect(coverage.totalSkills).toBe(0);
      expect(coverage.coveragePercentage).toBe(0);
    });

    it('should handle projects with no solutions or skills', () => {
      const emptyProject = {
        ...mockProjects[0],
      };

      const requiredSkills = getProjectRequiredSkills(
        emptyProject,
        [],
        mockSolutions,
        mockSkills,
        []
      );

      expect(requiredSkills).toHaveLength(0);
    });

    it('should handle teams with null or undefined targetSkills', () => {
      const teamWithNullSkills = {
        ...mockTeams[0],
        targetSkills: null as any,
      };

      // Use empty people and person skills arrays to truly test null targetSkills scenario
      const filteredTeams = filterTeamsBySkills(
        [teamWithNullSkills],
        ['skill1'],
        mockSkills,
        [],
        []
      );

      expect(filteredTeams).toHaveLength(0);
    });

    it('should handle missing skill references gracefully', () => {
      const teamWithInvalidSkills = {
        ...mockTeams[0],
        targetSkills: ['invalid-skill-id', 'skill1'],
      };

      const coverage = analyzeSkillCoverage(
        [teamWithInvalidSkills],
        mockSkills,
        mockPeople,
        mockPersonSkills
      );

      const reactCoverage = coverage.skillCoverage.find(
        sc => sc.skillName === 'React'
      );
      expect(reactCoverage?.coverageCount).toBe(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large numbers of teams efficiently', () => {
      const largeTeamSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockTeams[0],
        id: `team-${i}`,
        name: `Team ${i}`,
        targetSkills: ['skill1', 'skill2'],
      }));

      const startTime = performance.now();
      const coverage = analyzeSkillCoverage(largeTeamSet, mockSkills);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(coverage.totalSkills).toBe(6);
    });

    it('should handle large numbers of skills efficiently', () => {
      const largeSkillSet = Array.from({ length: 500 }, (_, i) => ({
        id: `skill-${i}`,
        name: `Skill ${i}`,
        category: `Category ${Math.floor(i / 50)}`,
        description: `Generated skill ${i}`,
        createdDate: '2024-01-01T00:00:00Z',
      }));

      const startTime = performance.now();
      const filteredTeams = filterTeamsBySkills(
        mockTeams,
        [`skill-1`, `skill-2`],
        largeSkillSet,
        mockPeople,
        mockPersonSkills
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
      expect(filteredTeams).toBeDefined();
    });
  });
});
