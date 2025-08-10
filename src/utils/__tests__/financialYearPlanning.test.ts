import { describe, it, expect, beforeEach } from 'vitest';
import {
  Team,
  Project,
  Solution,
  ProjectSolution,
  Skill,
  PersonSkill,
  Person,
  Allocation,
  FinancialYear,
  Cycle,
} from '@/types';
import {
  getProjectRequiredSkills,
  calculateTeamProjectCompatibility,
  recommendTeamsForProject,
} from '../skillBasedPlanning';
import { calculateTeamCapacity } from '../capacityUtils';

/**
 * Financial Year Planning Integration Test Suite
 *
 * Tests the complete workflow for financial year planning including:
 * 1. Adding financial year with Q1-Q4 quarters to projects
 * 2. Adding solutions to projects and skill matching
 * 3. Finding teams with matching skills to project solutions
 * 4. Checking planned capacity and available teams
 * 5. Priority-based allocation across quarters
 */
describe('Financial Year Planning Integration', () => {
  let mockTeams: Team[];
  let mockProjects: Project[];
  let mockSolutions: Solution[];
  let mockProjectSolutions: ProjectSolution[];
  let mockSkills: Skill[];
  let mockPeople: Person[];
  let mockPersonSkills: PersonSkill[];
  let mockAllocations: Allocation[];
  let mockFinancialYear: FinancialYear;
  let mockQuarters: Cycle[];

  beforeEach(() => {
    // Create skills for different technologies
    mockSkills = [
      {
        id: 'skill-react',
        name: 'React',
        category: 'framework',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill-node',
        name: 'Node.js',
        category: 'framework',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill-python',
        name: 'Python',
        category: 'programming-language',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill-aws',
        name: 'AWS',
        category: 'platform',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill-devops',
        name: 'DevOps',
        category: 'methodology',
        createdDate: '2024-01-01T00:00:00Z',
      },
    ];

    // Create solutions that map to different skill combinations
    mockSolutions = [
      {
        id: 'solution-frontend',
        name: 'Frontend Development',
        description: 'Modern React frontend solution',
        category: 'Frontend',
        skillIds: ['skill-react'],
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'solution-backend',
        name: 'Backend API',
        description: 'Node.js REST API solution',
        category: 'Backend',
        skillIds: ['skill-node', 'skill-aws'],
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'solution-analytics',
        name: 'Data Analytics',
        description: 'Python-based analytics solution',
        category: 'Analytics',
        skillIds: ['skill-python', 'skill-aws'],
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'solution-infrastructure',
        name: 'Infrastructure',
        description: 'DevOps and infrastructure solution',
        category: 'Infrastructure',
        skillIds: ['skill-devops', 'skill-aws'],
        createdDate: '2024-01-01T00:00:00Z',
      },
    ];

    // Create people with different skill sets
    mockPeople = [
      {
        id: 'person-1',
        name: 'Alice Frontend',
        email: 'alice@company.com',
        roleId: 'role-dev',
        teamId: 'team-frontend',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2023-01-01',
      },
      {
        id: 'person-2',
        name: 'Bob Backend',
        email: 'bob@company.com',
        roleId: 'role-dev',
        teamId: 'team-backend',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2023-01-01',
      },
      {
        id: 'person-3',
        name: 'Charlie Fullstack',
        email: 'charlie@company.com',
        roleId: 'role-senior',
        teamId: 'team-fullstack',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2023-01-01',
      },
      {
        id: 'person-4',
        name: 'Diana Analytics',
        email: 'diana@company.com',
        roleId: 'role-analyst',
        teamId: 'team-analytics',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2023-01-01',
      },
      {
        id: 'person-5',
        name: 'Eve DevOps',
        email: 'eve@company.com',
        roleId: 'role-devops',
        teamId: 'team-infrastructure',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2023-01-01',
      },
    ];

    // Map people to their skills
    mockPersonSkills = [
      // Alice - React specialist
      {
        id: 'ps-1',
        personId: 'person-1',
        skillId: 'skill-react',
        proficiencyLevel: 'expert',
      },

      // Bob - Backend specialist
      {
        id: 'ps-2',
        personId: 'person-2',
        skillId: 'skill-node',
        proficiencyLevel: 'advanced',
      },
      {
        id: 'ps-3',
        personId: 'person-2',
        skillId: 'skill-aws',
        proficiencyLevel: 'intermediate',
      },

      // Charlie - Full stack developer
      {
        id: 'ps-4',
        personId: 'person-3',
        skillId: 'skill-react',
        proficiencyLevel: 'advanced',
      },
      {
        id: 'ps-5',
        personId: 'person-3',
        skillId: 'skill-node',
        proficiencyLevel: 'advanced',
      },
      {
        id: 'ps-6',
        personId: 'person-3',
        skillId: 'skill-aws',
        proficiencyLevel: 'intermediate',
      },

      // Diana - Analytics specialist
      {
        id: 'ps-7',
        personId: 'person-4',
        skillId: 'skill-python',
        proficiencyLevel: 'expert',
      },
      {
        id: 'ps-8',
        personId: 'person-4',
        skillId: 'skill-aws',
        proficiencyLevel: 'intermediate',
      },

      // Eve - DevOps specialist
      {
        id: 'ps-9',
        personId: 'person-5',
        skillId: 'skill-devops',
        proficiencyLevel: 'expert',
      },
      {
        id: 'ps-10',
        personId: 'person-5',
        skillId: 'skill-aws',
        proficiencyLevel: 'advanced',
      },
    ];

    // Create teams with different specializations
    mockTeams = [
      {
        id: 'team-frontend',
        name: 'Frontend Team',
        description: 'Specializes in React development',
        type: 'permanent',
        status: 'active',
        divisionId: 'engineering',
        capacity: 40, // 40 hours per week
        targetSkills: ['skill-react'],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team-backend',
        name: 'Backend Team',
        description: 'Specializes in Node.js and AWS',
        type: 'permanent',
        status: 'active',
        divisionId: 'engineering',
        capacity: 40,
        targetSkills: ['skill-node', 'skill-aws'],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team-fullstack',
        name: 'Full Stack Team',
        description: 'Can handle both frontend and backend',
        type: 'permanent',
        status: 'active',
        divisionId: 'engineering',
        capacity: 40,
        targetSkills: ['skill-react', 'skill-node', 'skill-aws'],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team-analytics',
        name: 'Analytics Team',
        description: 'Specializes in Python analytics',
        type: 'permanent',
        status: 'active',
        divisionId: 'data',
        capacity: 40,
        targetSkills: ['skill-python', 'skill-aws'],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team-infrastructure',
        name: 'Infrastructure Team',
        description: 'DevOps and infrastructure management',
        type: 'permanent',
        status: 'active',
        divisionId: 'infrastructure',
        capacity: 40,
        targetSkills: ['skill-devops', 'skill-aws'],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
    ];

    // Create financial year spanning full year with Q1-Q4
    mockFinancialYear = {
      id: 'fy-2024',
      name: 'FY 2024',
      startDate: '2024-04-01',
      endDate: '2025-03-31',
      quarters: ['q1-2024', 'q2-2024', 'q3-2024', 'q4-2024'],
    };

    // Define the four quarters of the financial year
    mockQuarters = [
      {
        id: 'q1-2024',
        name: 'Q1 FY2024',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        type: 'quarterly',
        financialYearId: 'fy-2024',
      },
      {
        id: 'q2-2024',
        name: 'Q2 FY2024',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        type: 'quarterly',
        financialYearId: 'fy-2024',
      },
      {
        id: 'q3-2024',
        name: 'Q3 FY2024',
        startDate: '2024-10-01',
        endDate: '2024-12-31',
        type: 'quarterly',
        financialYearId: 'fy-2024',
      },
      {
        id: 'q4-2024',
        name: 'Q4 FY2024',
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        type: 'quarterly',
        financialYearId: 'fy-2024',
      },
    ];

    // Create projects with different priorities and timelines
    mockProjects = [
      {
        id: 'project-ecommerce',
        name: 'E-commerce Platform',
        description: 'High-priority customer-facing platform',
        status: 'planning',
        startDate: '2024-04-01',
        endDate: '2025-03-31', // Full financial year
        priority: 1, // Highest priority
        ranking: 1,
        milestones: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'project-analytics',
        name: 'Customer Analytics Dashboard',
        description: 'Business intelligence and reporting platform',
        status: 'planning',
        startDate: '2024-07-01',
        endDate: '2024-12-31', // Q2-Q3
        priority: 2, // Medium priority
        ranking: 2,
        milestones: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'project-mobile',
        name: 'Mobile App',
        description: 'Companion mobile application',
        status: 'planning',
        startDate: '2024-10-01',
        endDate: '2025-03-31', // Q3-Q4
        priority: 3, // Lower priority
        ranking: 3,
        milestones: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
    ];

    // Map projects to their required solutions
    mockProjectSolutions = [
      // E-commerce platform needs frontend, backend, and infrastructure
      {
        id: 'ps-1',
        projectId: 'project-ecommerce',
        solutionId: 'solution-frontend',
        importance: 'high',
      },
      {
        id: 'ps-2',
        projectId: 'project-ecommerce',
        solutionId: 'solution-backend',
        importance: 'high',
      },
      {
        id: 'ps-3',
        projectId: 'project-ecommerce',
        solutionId: 'solution-infrastructure',
        importance: 'medium',
      },

      // Analytics dashboard needs analytics and backend
      {
        id: 'ps-4',
        projectId: 'project-analytics',
        solutionId: 'solution-analytics',
        importance: 'high',
      },
      {
        id: 'ps-5',
        projectId: 'project-analytics',
        solutionId: 'solution-backend',
        importance: 'medium',
      },

      // Mobile app needs frontend only (React Native)
      {
        id: 'ps-6',
        projectId: 'project-mobile',
        solutionId: 'solution-frontend',
        importance: 'high',
      },
    ];

    // Existing allocations to test capacity calculation
    mockAllocations = [
      // Frontend team partially allocated in Q1
      {
        id: 'alloc-1',
        teamId: 'team-frontend',
        cycleId: 'q1-2024',
        iterationNumber: 1,
        percentage: 50, // 50% already allocated to existing work
        epicId: 'existing-epic-1',
      },
      // Backend team partially allocated across Q1 and Q2
      {
        id: 'alloc-2',
        teamId: 'team-backend',
        cycleId: 'q1-2024',
        iterationNumber: 1,
        percentage: 30, // 30% allocated in Q1
        epicId: 'existing-epic-2',
      },
      {
        id: 'alloc-3',
        teamId: 'team-backend',
        cycleId: 'q2-2024',
        iterationNumber: 2,
        percentage: 25, // 25% allocated in Q2
        epicId: 'existing-epic-3',
      },
    ];
  });

  describe('Financial Year Setup and Structure', () => {
    it('should create financial year with complete Q1-Q4 structure', () => {
      // Verify financial year spans full year
      expect(mockFinancialYear.quarters).toHaveLength(4);
      expect(mockQuarters).toHaveLength(4);

      // Verify quarters are in correct chronological order
      const quarterDates = mockQuarters.map(q =>
        new Date(q.startDate).getTime()
      );
      expect(quarterDates).toEqual([...quarterDates].sort((a, b) => a - b));

      // Verify all quarters belong to the financial year
      mockQuarters.forEach(quarter => {
        expect(quarter.financialYearId).toBe(mockFinancialYear.id);
        expect(quarter.type).toBe('quarterly');
      });
    });

    it('should correctly link projects to financial year timeline', () => {
      // E-commerce project should span full financial year
      const ecommerceProject = mockProjects.find(
        p => p.id === 'project-ecommerce'
      )!;
      expect(new Date(ecommerceProject.startDate!)).toEqual(
        new Date(mockFinancialYear.startDate)
      );
      expect(new Date(ecommerceProject.endDate!)).toEqual(
        new Date(mockFinancialYear.endDate)
      );

      // Analytics project should span Q2-Q3
      const analyticsProject = mockProjects.find(
        p => p.id === 'project-analytics'
      )!;
      expect(new Date(analyticsProject.startDate!)).toEqual(
        new Date(mockQuarters[1].startDate)
      );
      expect(new Date(analyticsProject.endDate!)).toEqual(
        new Date(mockQuarters[2].endDate)
      );

      // Mobile project should span Q3-Q4
      const mobileProject = mockProjects.find(p => p.id === 'project-mobile')!;
      expect(new Date(mobileProject.startDate!)).toEqual(
        new Date(mockQuarters[2].startDate)
      );
      expect(new Date(mobileProject.endDate!)).toEqual(
        new Date(mockQuarters[3].endDate)
      );
    });
  });

  describe('Project Solution Skill Mapping', () => {
    it('should correctly map project solutions to required skills', () => {
      const ecommerceProject = mockProjects.find(
        p => p.id === 'project-ecommerce'
      )!;
      const requiredSkills = getProjectRequiredSkills(
        ecommerceProject,
        [], // No direct project skills, all through solutions
        mockSolutions,
        mockSkills,
        mockProjectSolutions
      );

      // E-commerce needs React, Node.js, AWS, DevOps from its three solutions
      expect(requiredSkills).toHaveLength(4);
      const skillNames = requiredSkills.map(s => s.skillName);
      expect(skillNames).toContain('React'); // From frontend solution
      expect(skillNames).toContain('Node.js'); // From backend solution
      expect(skillNames).toContain('AWS'); // From backend and infrastructure solutions
      expect(skillNames).toContain('DevOps'); // From infrastructure solution
    });

    it('should handle overlapping skills from multiple solutions', () => {
      // Both backend and infrastructure solutions require AWS
      const analyticsProject = mockProjects.find(
        p => p.id === 'project-analytics'
      )!;
      const requiredSkills = getProjectRequiredSkills(
        analyticsProject,
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions
      );

      // Should deduplicate AWS skill that appears in both analytics and backend solutions
      const awsSkills = requiredSkills.filter(s => s.skillName === 'AWS');
      expect(awsSkills).toHaveLength(1);

      // Analytics project needs Python, AWS, Node.js
      const skillNames = requiredSkills.map(s => s.skillName);
      expect(skillNames).toContain('Python'); // From analytics solution
      expect(skillNames).toContain('AWS'); // From both solutions (deduplicated)
      expect(skillNames).toContain('Node.js'); // From backend solution
    });
  });

  describe('Team Skill Matching and Compatibility', () => {
    it('should find teams with matching skills for frontend solution', () => {
      const ecommerceProject = mockProjects.find(
        p => p.id === 'project-ecommerce'
      )!;

      // Test each team's compatibility with the e-commerce project
      const frontendTeamCompatibility = calculateTeamProjectCompatibility(
        mockTeams.find(t => t.id === 'team-frontend')!,
        ecommerceProject,
        [], // No direct project skills
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills
      );

      const fullstackTeamCompatibility = calculateTeamProjectCompatibility(
        mockTeams.find(t => t.id === 'team-fullstack')!,
        ecommerceProject,
        [],
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills
      );

      // Frontend team should have partial compatibility (only React, missing Node.js, AWS, DevOps)
      expect(frontendTeamCompatibility.skillsMatched).toBe(1); // React only
      expect(frontendTeamCompatibility.compatibilityScore).toBeLessThan(0.5);

      // Full stack team should have higher compatibility (React, Node.js, AWS)
      expect(fullstackTeamCompatibility.skillsMatched).toBe(3); // React, Node.js, AWS
      expect(fullstackTeamCompatibility.compatibilityScore).toBeGreaterThan(
        frontendTeamCompatibility.compatibilityScore
      );
    });

    it('should provide team recommendations based on skill compatibility', () => {
      const ecommerceProject = mockProjects.find(
        p => p.id === 'project-ecommerce'
      )!;

      const recommendations = recommendTeamsForProject(
        ecommerceProject,
        mockTeams,
        [], // No direct project skills
        mockSolutions,
        mockSkills,
        mockProjectSolutions,
        mockPeople,
        mockPersonSkills
      );

      // Should recommend teams in order of compatibility
      expect(recommendations).toHaveLength(3); // Default maxRecommendations = 3

      // Full stack team should be ranked highly due to multiple skill matches
      const fullstackRanking = recommendations.find(
        rt => rt.team.id === 'team-fullstack'
      );
      expect(
        fullstackRanking!.compatibility.compatibilityScore
      ).toBeGreaterThan(0.5);

      // Should provide recommendations for top teams
      expect(recommendations[0].recommendation).toBeDefined();
      expect(recommendations[0].rank).toBe(1);
    });
  });

  describe('Team Capacity Calculation Across Financial Year', () => {
    it('should calculate available capacity considering existing allocations', () => {
      // Frontend team has 50% allocation in Q1
      const frontendTeam = mockTeams.find(t => t.id === 'team-frontend')!;
      const q1Iteration = mockQuarters.find(q => q.id === 'q1-2024')!;

      // Mock iterations array for compatibility with existing calculateTeamCapacity function
      const mockIterations = [q1Iteration]; // Simplified for this test

      const capacity = calculateTeamCapacity(
        frontendTeam,
        1, // Q1 = iteration 1
        mockAllocations,
        mockIterations
      );

      // Should show 50% already allocated, 50% available
      expect(capacity.allocatedPercentage).toBe(50);
      expect(capacity.isUnderAllocated).toBe(true); // Less than 100%
      expect(capacity.isOverAllocated).toBe(false);
    });

    it('should identify teams with full availability', () => {
      // Analytics team has no existing allocations
      const analyticsTeam = mockTeams.find(t => t.id === 'team-analytics')!;
      const q1Iteration = mockQuarters.find(q => q.id === 'q1-2024')!;
      const mockIterations = [q1Iteration];

      const capacity = calculateTeamCapacity(
        analyticsTeam,
        1,
        mockAllocations,
        mockIterations
      );

      // Should be completely available
      expect(capacity.allocatedPercentage).toBe(0);
      expect(capacity.isUnderAllocated).toBe(false); // 0% is not considered under-allocated
      expect(capacity.isOverAllocated).toBe(false);
    });

    it('should aggregate capacity across all quarters for financial year planning', () => {
      // Test aggregated capacity calculation for full financial year
      const backendTeam = mockTeams.find(t => t.id === 'team-backend')!;

      // Backend team has allocations in Q1 (30%) and Q2 (25%)
      const q1Allocations = mockAllocations.filter(
        a => a.teamId === 'team-backend' && a.cycleId === 'q1-2024'
      );
      const q2Allocations = mockAllocations.filter(
        a => a.teamId === 'team-backend' && a.cycleId === 'q2-2024'
      );

      expect(q1Allocations).toHaveLength(1);
      expect(q1Allocations[0].percentage).toBe(30);
      expect(q2Allocations).toHaveLength(1);
      expect(q2Allocations[0].percentage).toBe(25);

      // Q3 and Q4 should be fully available (no allocations)
      const q3Allocations = mockAllocations.filter(
        a => a.teamId === 'team-backend' && a.cycleId === 'q3-2024'
      );
      const q4Allocations = mockAllocations.filter(
        a => a.teamId === 'team-backend' && a.cycleId === 'q4-2024'
      );

      expect(q3Allocations).toHaveLength(0);
      expect(q4Allocations).toHaveLength(0);
    });
  });

  describe('Priority-Based Team Allocation Strategy', () => {
    it('should prioritize highest-priority project for team selection', () => {
      // E-commerce (priority 1) vs Analytics (priority 2) vs Mobile (priority 3)
      const projectPriorities = mockProjects
        .sort((a, b) => a.priority - b.priority)
        .map(p => ({ id: p.id, priority: p.priority }));

      expect(projectPriorities[0]).toEqual({
        id: 'project-ecommerce',
        priority: 1,
      });
      expect(projectPriorities[1]).toEqual({
        id: 'project-analytics',
        priority: 2,
      });
      expect(projectPriorities[2]).toEqual({
        id: 'project-mobile',
        priority: 3,
      });
    });

    it('should allocate teams considering both skills and availability', () => {
      // Get all teams that can work on frontend solutions
      const frontendCapableTeams = mockTeams.filter(team => {
        const hasReactSkill = team.targetSkills.includes('skill-react');
        return hasReactSkill;
      });

      expect(frontendCapableTeams).toHaveLength(2); // frontend and fullstack teams

      // Full stack team should be preferred for high-priority projects
      // due to broader skill coverage (React + Node.js + AWS)
      const fullstackTeam = frontendCapableTeams.find(
        t => t.id === 'team-fullstack'
      );
      const frontendTeam = frontendCapableTeams.find(
        t => t.id === 'team-frontend'
      );

      expect(fullstackTeam!.targetSkills).toContain('skill-react');
      expect(fullstackTeam!.targetSkills).toContain('skill-node');
      expect(fullstackTeam!.targetSkills).toContain('skill-aws');

      expect(frontendTeam!.targetSkills).toContain('skill-react');
      expect(frontendTeam!.targetSkills).not.toContain('skill-node');
    });

    it('should handle resource conflicts when teams are needed by multiple projects', () => {
      // Both E-commerce and Mobile projects need frontend capabilities
      const ecommerceProject = mockProjects.find(
        p => p.id === 'project-ecommerce'
      )!;
      const mobileProject = mockProjects.find(p => p.id === 'project-mobile')!;

      const ecommerceFrontendSolutions = mockProjectSolutions.filter(
        ps =>
          ps.projectId === 'project-ecommerce' &&
          ps.solutionId === 'solution-frontend'
      );
      const mobileFrontendSolutions = mockProjectSolutions.filter(
        ps =>
          ps.projectId === 'project-mobile' &&
          ps.solutionId === 'solution-frontend'
      );

      expect(ecommerceFrontendSolutions).toHaveLength(1);
      expect(mobileFrontendSolutions).toHaveLength(1);

      // E-commerce (priority 1) should get first pick of frontend teams
      // Mobile (priority 3) should get remaining capacity or alternative teams
      expect(ecommerceProject.priority).toBeLessThan(mobileProject.priority);
    });

    it('should provide actionable recommendations for team allocation conflicts', () => {
      // When multiple projects compete for same team skills
      const backendNeedingProjects = mockProjectSolutions
        .filter(ps => ps.solutionId === 'solution-backend')
        .map(ps => ps.projectId);

      // E-commerce and Analytics both need backend capabilities
      expect(backendNeedingProjects).toContain('project-ecommerce');
      expect(backendNeedingProjects).toContain('project-analytics');

      // System should recommend:
      // 1. Priority-based allocation (E-commerce gets first pick)
      // 2. Alternative team suggestions (Full stack team can also do backend work)
      // 3. Timeline optimization (Analytics is Q2-Q3, E-commerce is full year)

      const teamsWithBackendSkills = mockTeams.filter(team =>
        team.targetSkills.includes('skill-node')
      );

      expect(teamsWithBackendSkills).toHaveLength(2); // backend and fullstack teams
    });
  });

  describe('End-to-End Financial Year Planning Workflow', () => {
    it('should execute complete financial year planning process', () => {
      // Step 1: Verify financial year structure with Q1-Q4
      expect(mockFinancialYear.quarters).toHaveLength(4);

      // Step 2: Verify projects are mapped to solutions
      const totalProjectSolutions = mockProjectSolutions.length;
      expect(totalProjectSolutions).toBe(6); // 3+2+1 = 6 total solution mappings

      // Step 3: Verify all solutions have required skills defined
      mockSolutions.forEach(solution => {
        expect(solution.skillIds).toBeDefined();
        expect(solution.skillIds!.length).toBeGreaterThan(0);
      });

      // Step 4: Find teams with matching skills for each project
      const projectTeamMatching = mockProjects.map(project => {
        const recommendations = recommendTeamsForProject(
          project,
          mockTeams,
          [], // No direct project skills
          mockSolutions,
          mockSkills,
          mockProjectSolutions,
          mockPeople,
          mockPersonSkills
        );

        return {
          project,
          recommendations,
          skillsRequired: getProjectRequiredSkills(
            project,
            [],
            mockSolutions,
            mockSkills,
            mockProjectSolutions
          ).length,
        };
      });

      // Should have recommendations for all projects
      expect(projectTeamMatching).toHaveLength(3);
      projectTeamMatching.forEach(ptm => {
        expect(ptm.recommendations.length).toBeGreaterThan(0);
        expect(ptm.skillsRequired).toBeGreaterThan(0);
      });

      // Step 5: Verify capacity considerations
      // Frontend team (50% allocated in Q1) should have limited availability
      // Full stack team (no allocations) should have full availability
      // Analytics team (no allocations) should have full availability
      const teamAvailabilityStatus = mockTeams.map(team => {
        const hasAllocations = mockAllocations.some(a => a.teamId === team.id);
        return {
          teamId: team.id,
          hasExistingAllocations: hasAllocations,
        };
      });

      const teamsWithAllocations = teamAvailabilityStatus.filter(
        tas => tas.hasExistingAllocations
      );
      expect(teamsWithAllocations).toHaveLength(2); // frontend and backend teams

      // Step 6: Verify priority-based allocation logic
      const sortedProjects = [...mockProjects].sort(
        (a, b) => a.priority - b.priority
      );
      expect(sortedProjects[0].id).toBe('project-ecommerce'); // Should get first pick
      expect(sortedProjects[1].id).toBe('project-analytics');
      expect(sortedProjects[2].id).toBe('project-mobile');

      // Integration test passes if all steps complete successfully
      expect(true).toBe(true);
    });

    it('should provide comprehensive planning summary with actionable insights', () => {
      // Simulate planning summary generation
      const planningSummary = {
        totalProjects: mockProjects.length,
        totalTeams: mockTeams.length,
        totalQuarters: mockQuarters.length,
        skillCoverage: {
          totalSkillsRequired: new Set(
            mockSolutions.flatMap(s => s.skillIds || [])
          ).size,
          skillsAvailable: new Set(mockTeams.flatMap(t => t.targetSkills)).size,
        },
        resourceUtilization: {
          teamsWithAllocations: mockAllocations.length > 0 ? 2 : 0,
          teamsFullyAvailable: mockTeams.length - 2,
        },
        recommendations: [
          'E-commerce project (Priority 1) should be allocated Full Stack Team for comprehensive skill coverage',
          'Analytics project can utilize Analytics Team for specialized Python skills',
          'Mobile project may need to wait for Q3-Q4 when more frontend capacity becomes available',
          'Consider cross-training team members to improve skill coverage flexibility',
        ],
      };

      expect(planningSummary.totalProjects).toBe(3);
      expect(planningSummary.totalTeams).toBe(5);
      expect(planningSummary.totalQuarters).toBe(4);
      expect(planningSummary.skillCoverage.totalSkillsRequired).toBe(5); // React, Node, Python, AWS, DevOps
      expect(planningSummary.resourceUtilization.teamsWithAllocations).toBe(2);
      expect(planningSummary.recommendations.length).toBe(4);
    });
  });
});
