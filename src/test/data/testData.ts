import {
  Division,
  Team,
  Person,
  Role,
  Cycle,
  RunWorkCategory,
  Skill,
  PersonSkill,
  Solution,
  ProjectSkill,
  ProjectSolution,
  AppConfig,
} from '../../types';

// Custom interfaces for test data that match integration test expectations
interface TestProject {
  id: string;
  name: string;
  description: string;
  teamId: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  budget: number;
}

interface TestWorkItem {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'feature' | 'bug' | 'task' | 'story';
  estimatedHours: number;
  actualHours: number;
}

/**
 * Test data for CI and unit testing
 * This provides a consistent, smaller dataset for reliable testing
 */

export const testDivisions: Division[] = [
  {
    id: 'div-test-001',
    name: 'Consumer Lending',
    description: 'Personal loans, mortgages, and consumer credit products',
    budget: 25000000,
  },
  {
    id: 'div-test-002',
    name: 'Business Lending',
    description: 'Commercial loans, business credit, and corporate financing',
    budget: 35000000,
  },
];

export const testRoles: Role[] = [
  {
    id: 'role-test-po',
    name: 'Product Owner',
    rateType: 'annual',
    defaultRate: 120000,
    defaultAnnualSalary: 120000,
    description: 'Product strategy and backlog management',
  },
  {
    id: 'role-test-se',
    name: 'Software Engineer',
    rateType: 'annual',
    defaultRate: 95000,
    defaultAnnualSalary: 95000,
    description: 'Full-stack development and software delivery',
  },
  {
    id: 'role-test-qe',
    name: 'Quality Engineer',
    rateType: 'annual',
    defaultRate: 90000,
    defaultAnnualSalary: 90000,
    description: 'Testing, automation, and quality assurance',
  },
  {
    id: 'role-test-pe',
    name: 'Platform Engineer',
    rateType: 'annual',
    defaultRate: 110000,
    defaultAnnualSalary: 110000,
    description: 'Infrastructure, DevOps, and platform services',
  },
];

export const testTeams: Team[] = [
  {
    id: 'team-test-001',
    name: 'Mortgage Origination',
    divisionId: 'div-test-001',
    divisionName: 'Consumer Lending',
    capacity: 160,
  },
  {
    id: 'team-test-002',
    name: 'Personal Loans Platform',
    divisionId: 'div-test-001',
    divisionName: 'Consumer Lending',
    capacity: 160,
  },
  {
    id: 'team-test-003',
    name: 'Commercial Lending Platform',
    divisionId: 'div-test-002',
    divisionName: 'Business Lending',
    capacity: 160,
  },
  {
    id: 'team-test-004',
    name: 'Business Credit Assessment',
    divisionId: 'div-test-002',
    divisionName: 'Business Lending',
    capacity: 160,
  },
];

export const testPeople: Person[] = [
  // Team 1 - Mortgage Origination
  {
    id: 'person-test-001',
    name: 'John Smith',
    email: 'john.smith@bankcorp.com',
    roleId: 'role-test-po',
    teamId: 'team-test-001',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 135000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@bankcorp.com',
    roleId: 'role-test-se',
    teamId: 'team-test-001',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 98000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-003',
    name: 'Michael Chen',
    email: 'michael.chen@bankcorp.com',
    roleId: 'role-test-qe',
    teamId: 'team-test-001',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 95000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-004',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@bankcorp.com',
    roleId: 'role-test-pe',
    teamId: 'team-test-001',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 110000,
    startDate: '2023-01-15',
  },

  // Team 2 - Personal Loans Platform
  {
    id: 'person-test-005',
    name: 'David Kim',
    email: 'david.kim@bankcorp.com',
    roleId: 'role-test-po',
    teamId: 'team-test-002',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 140000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-006',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@bankcorp.com',
    roleId: 'role-test-se',
    teamId: 'team-test-002',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 105000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-007',
    name: 'Robert Taylor',
    email: 'robert.taylor@bankcorp.com',
    roleId: 'role-test-se',
    teamId: 'team-test-002',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 95000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-008',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@bankcorp.com',
    roleId: 'role-test-qe',
    teamId: 'team-test-002',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 92000,
    startDate: '2023-01-15',
  },

  // Team 3 - Commercial Lending Platform
  {
    id: 'person-test-009',
    name: 'Christopher Martinez',
    email: 'christopher.martinez@bankcorp.com',
    roleId: 'role-test-po',
    teamId: 'team-test-003',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 145000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-010',
    name: 'Amanda Wilson',
    email: 'amanda.wilson@bankcorp.com',
    roleId: 'role-test-se',
    teamId: 'team-test-003',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 115000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-011',
    name: 'James Thompson',
    email: 'james.thompson@bankcorp.com',
    roleId: 'role-test-pe',
    teamId: 'team-test-003',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 125000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-012',
    name: 'Rachel Green',
    email: 'rachel.green@bankcorp.com',
    roleId: 'role-test-qe',
    teamId: 'team-test-003',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 93000,
    startDate: '2023-01-15',
  },

  // Team 4 - Business Credit Assessment
  {
    id: 'person-test-013',
    name: 'Daniel Brown',
    email: 'daniel.brown@bankcorp.com',
    roleId: 'role-test-po',
    teamId: 'team-test-004',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 150000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-014',
    name: 'Jessica Davis',
    email: 'jessica.davis@bankcorp.com',
    roleId: 'role-test-se',
    teamId: 'team-test-004',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 108000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-015',
    name: 'Kevin Johnson',
    email: 'kevin.johnson@bankcorp.com',
    roleId: 'role-test-pe',
    teamId: 'team-test-004',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 120000,
    startDate: '2023-01-15',
  },
  {
    id: 'person-test-016',
    name: 'Michelle Garcia',
    email: 'michelle.garcia@bankcorp.com',
    roleId: 'role-test-qe',
    teamId: 'team-test-004',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 94000,
    startDate: '2023-01-15',
  },
];

export const testCycles: Cycle[] = [
  {
    id: 'cycle-test-annual-2024',
    name: '2024 Annual',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    type: 'annual',
    status: 'active',
  },
  {
    id: 'cycle-test-q1-2024',
    name: 'Q1 2024',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    type: 'quarterly',
    status: 'active',
    parentCycleId: 'cycle-test-annual-2024',
  },
  {
    id: 'cycle-test-q2-2024',
    name: 'Q2 2024',
    startDate: '2024-04-01',
    endDate: '2024-06-30',
    type: 'quarterly',
    status: 'planning',
    parentCycleId: 'cycle-test-annual-2024',
  },
];

export const testRunWorkCategories: RunWorkCategory[] = [
  {
    id: 'run-test-bau',
    name: 'Business as Usual',
    description: 'Ongoing operational work and maintenance',
    color: '#6B7280',
  },
  {
    id: 'run-test-support',
    name: 'Production Support',
    description: 'Incident response and production issues',
    color: '#EF4444',
  },
  {
    id: 'run-test-bugfix',
    name: 'Bug Fixes',
    description: 'Defect resolution and bug fixes',
    color: '#F59E0B',
  },
];

export const testSkills: Skill[] = [
  {
    id: 'skill-test-js',
    name: 'JavaScript/TypeScript',
    category: 'programming-language',
    description: 'Frontend and backend JavaScript development',
    createdDate: '2024-01-01',
  },
  {
    id: 'skill-test-java',
    name: 'Java',
    category: 'programming-language',
    description: 'Enterprise Java development',
    createdDate: '2024-01-01',
  },
  {
    id: 'skill-test-react',
    name: 'React',
    category: 'framework',
    description: 'Frontend React development',
    createdDate: '2024-01-01',
  },
  {
    id: 'skill-test-aws',
    name: 'AWS',
    category: 'platform',
    description: 'Amazon Web Services cloud platform',
    createdDate: '2024-01-01',
  },
  {
    id: 'skill-test-lending',
    name: 'Lending & Credit',
    category: 'domain-knowledge',
    description: 'Banking lending and credit assessment',
    createdDate: '2024-01-01',
  },
];

export const testPersonSkills: PersonSkill[] = [
  // Product Owners - should have domain skills
  {
    id: 'person-skill-test-001',
    personId: 'person-test-001', // John Smith - Product Owner
    skillId: 'skill-test-lending',
    proficiencyLevel: 'expert',
    yearsOfExperience: 8,
    lastUsed: '2024-01-01',
    notes: 'Domain expert',
  },
  {
    id: 'person-skill-test-002',
    personId: 'person-test-005', // David Kim - Product Owner
    skillId: 'skill-test-lending',
    proficiencyLevel: 'expert',
    yearsOfExperience: 7,
    lastUsed: '2024-01-01',
    notes: 'Domain expert',
  },
  {
    id: 'person-skill-test-003',
    personId: 'person-test-009', // Christopher Martinez - Product Owner
    skillId: 'skill-test-lending',
    proficiencyLevel: 'expert',
    yearsOfExperience: 6,
    lastUsed: '2024-01-01',
    notes: 'Domain expert',
  },
  {
    id: 'person-skill-test-004',
    personId: 'person-test-013', // Daniel Brown - Product Owner
    skillId: 'skill-test-lending',
    proficiencyLevel: 'expert',
    yearsOfExperience: 9,
    lastUsed: '2024-01-01',
    notes: 'Senior domain expert',
  },

  // Software Engineers - should have technical skills
  {
    id: 'person-skill-test-005',
    personId: 'person-test-002', // Sarah Johnson - Software Engineer
    skillId: 'skill-test-js',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 5,
    lastUsed: '2024-01-01',
    notes: 'Primary frontend developer',
  },
  {
    id: 'person-skill-test-006',
    personId: 'person-test-002', // Sarah Johnson - Software Engineer
    skillId: 'skill-test-react',
    proficiencyLevel: 'expert',
    yearsOfExperience: 5,
    lastUsed: '2024-01-01',
    notes: 'React specialist',
  },
  {
    id: 'person-skill-test-007',
    personId: 'person-test-006', // Lisa Anderson - Software Engineer
    skillId: 'skill-test-js',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 5,
    lastUsed: '2024-01-01',
    notes: 'Frontend development',
  },
  {
    id: 'person-skill-test-008',
    personId: 'person-test-006', // Lisa Anderson - Software Engineer
    skillId: 'skill-test-react',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 4,
    lastUsed: '2024-01-01',
    notes: 'React development',
  },
  {
    id: 'person-skill-test-009',
    personId: 'person-test-007', // Robert Taylor - Software Engineer
    skillId: 'skill-test-js',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 3,
    lastUsed: '2024-01-01',
    notes: 'Backend development',
  },
  {
    id: 'person-skill-test-010',
    personId: 'person-test-007', // Robert Taylor - Software Engineer
    skillId: 'skill-test-react',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
    lastUsed: '2024-01-01',
    notes: 'React development',
  },
  {
    id: 'person-skill-test-011',
    personId: 'person-test-010', // Amanda Wilson - Software Engineer
    skillId: 'skill-test-java',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 3,
    lastUsed: '2024-01-01',
    notes: 'Backend development',
  },
  {
    id: 'person-skill-test-012',
    personId: 'person-test-010', // Amanda Wilson - Software Engineer
    skillId: 'skill-test-js',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 4,
    lastUsed: '2024-01-01',
    notes: 'Full-stack development',
  },
  {
    id: 'person-skill-test-013',
    personId: 'person-test-010', // Amanda Wilson - Software Engineer
    skillId: 'skill-test-react',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
    lastUsed: '2024-01-01',
    notes: 'React development',
  },
  {
    id: 'person-skill-test-014',
    personId: 'person-test-014', // Jessica Davis - Software Engineer
    skillId: 'skill-test-js',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 5,
    lastUsed: '2024-01-01',
    notes: 'Frontend development',
  },
  {
    id: 'person-skill-test-015',
    personId: 'person-test-014', // Jessica Davis - Software Engineer
    skillId: 'skill-test-react',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 4,
    lastUsed: '2024-01-01',
    notes: 'React development',
  },

  // Platform Engineers - should have infrastructure skills
  {
    id: 'person-skill-test-016',
    personId: 'person-test-004', // Emily Rodriguez - Platform Engineer
    skillId: 'skill-test-aws',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 6,
    lastUsed: '2024-01-01',
    notes: 'Cloud infrastructure',
  },
  {
    id: 'person-skill-test-017',
    personId: 'person-test-011', // James Thompson - Platform Engineer
    skillId: 'skill-test-aws',
    proficiencyLevel: 'expert',
    yearsOfExperience: 7,
    lastUsed: '2024-01-01',
    notes: 'Senior cloud engineer',
  },
  {
    id: 'person-skill-test-018',
    personId: 'person-test-015', // Kevin Johnson - Platform Engineer
    skillId: 'skill-test-aws',
    proficiencyLevel: 'expert',
    yearsOfExperience: 8,
    lastUsed: '2024-01-01',
    notes: 'Senior cloud engineer',
  },
  // Additional expert skills to meet the minimum count
  {
    id: 'person-skill-test-019',
    personId: 'person-test-002', // Sarah Johnson - Software Engineer
    skillId: 'skill-test-java',
    proficiencyLevel: 'expert',
    yearsOfExperience: 6,
    lastUsed: '2024-01-01',
    notes: 'Senior Java developer',
  },
  {
    id: 'person-skill-test-020',
    personId: 'person-test-006', // Lisa Anderson - Software Engineer
    skillId: 'skill-test-java',
    proficiencyLevel: 'expert',
    yearsOfExperience: 7,
    lastUsed: '2024-01-01',
    notes: 'Senior Java developer',
  },
];

export const testSolutions: Solution[] = [
  {
    id: 'solution-test-microservices',
    name: 'Microservices Architecture',
    description:
      'Distributed microservices architecture for scalable banking applications',
    category: 'architecture-pattern',
    skillIds: ['skill-test-java', 'skill-test-aws'],
    createdDate: '2024-01-01',
  },
  {
    id: 'solution-test-react-spa',
    name: 'React Single Page Application',
    description: 'Modern React-based frontend for banking applications',
    category: 'framework-stack',
    skillIds: ['skill-test-js', 'skill-test-react'],
    createdDate: '2024-01-01',
  },
];

export const testProjects: TestProject[] = [
  {
    id: 'project-test-001',
    name: 'Digital Mortgage Platform',
    description:
      'Modern digital platform for mortgage origination and processing',
    teamId: 'team-test-001',
    status: 'in-progress',
    priority: 'high',
    startDate: '2024-01-01',
    endDate: '06-30-2024',
    budget: 500000,
  },
  {
    id: 'project-test-002',
    name: 'Personal Loan Automation',
    description: 'Automated personal loan application and approval system',
    teamId: 'team-test-002',
    status: 'planning',
    priority: 'medium',
    startDate: '2024-02-01',
    endDate: '08-31-2024',
    budget: 300000,
  },
  {
    id: 'project-test-003',
    name: 'Commercial Credit Scoring',
    description: 'Advanced credit scoring system for commercial lending',
    teamId: 'team-test-003',
    status: 'in-progress',
    priority: 'critical',
    startDate: '2024-01-15',
    endDate: '07-15-2024',
    budget: 750000,
  },
  {
    id: 'project-test-004',
    name: 'Business Lending Portal',
    description: 'Self-service portal for business loan applications',
    teamId: 'team-test-004',
    status: 'planning',
    priority: 'high',
    startDate: '2024-03-01',
    endDate: '09-30-2024',
    budget: 400000,
  },
];

export const testWorkItems: TestWorkItem[] = [
  {
    id: 'work-test-001',
    title: 'Implement Digital User Authentication',
    description:
      'Build secure user authentication system for mortgage platform',
    projectId: 'project-test-001',
    status: 'in-progress',
    priority: 'high',
    type: 'feature',
    estimatedHours: 40,
    actualHours: 25,
  },
  {
    id: 'work-test-002',
    title: 'Design Digital Database Schema',
    description: 'Design and implement database schema for loan processing',
    projectId: 'project-test-001',
    status: 'done',
    priority: 'high',
    type: 'task',
    estimatedHours: 24,
    actualHours: 28,
  },
  {
    id: 'work-test-003',
    title: 'Create Personal Loan API Endpoints',
    description:
      'Develop RESTful API endpoints for loan application processing',
    projectId: 'project-test-002',
    status: 'todo',
    priority: 'medium',
    type: 'feature',
    estimatedHours: 32,
    actualHours: 0,
  },
  {
    id: 'work-test-004',
    title: 'Write Commercial Credit Scoring Tests',
    description:
      'Comprehensive unit test coverage for credit scoring algorithms',
    projectId: 'project-test-003',
    status: 'in-progress',
    priority: 'high',
    type: 'task',
    estimatedHours: 16,
    actualHours: 8,
  },
  {
    id: 'work-test-005',
    title: 'Setup Business Lending CI/CD Pipeline',
    description: 'Configure continuous integration and deployment pipeline',
    projectId: 'project-test-004',
    status: 'todo',
    priority: 'medium',
    type: 'task',
    estimatedHours: 20,
    actualHours: 0,
  },
  {
    id: 'work-test-006',
    title: 'Implement Commercial Credit Scoring Model',
    description: 'Develop machine learning model for credit risk assessment',
    projectId: 'project-test-003',
    status: 'review',
    priority: 'critical',
    type: 'feature',
    estimatedHours: 60,
    actualHours: 56,
  },
];

export const testConfig: AppConfig = {
  financialYear: {
    id: 'fy-test-2024',
    name: 'FY 2024',
    startDate: '2024-07-01',
    endDate: '2025-06-30',
  },
  iterationLength: 'fortnightly',
  quarters: [
    {
      id: 'q1-test-2024',
      name: 'Q1 2024',
      startDate: '2024-07-01',
      endDate: '2024-09-30',
      type: 'quarterly',
      status: 'completed',
    },
    {
      id: 'q2-test-2024',
      name: 'Q2 2024',
      startDate: '2024-10-01',
      endDate: '2024-12-31',
      type: 'quarterly',
      status: 'active',
    },
  ],
};

// Export all test data
export const testData = {
  divisions: testDivisions,
  teams: testTeams,
  people: testPeople,
  roles: testRoles,
  cycles: testCycles,
  runWorkCategories: testRunWorkCategories,
  skills: testSkills,
  personSkills: testPersonSkills,
  solutions: testSolutions,
  projects: testProjects,
  workItems: testWorkItems,
  config: testConfig,
};

// Helper functions for test data
export const getTestTeamById = (teamId: string): Team | undefined => {
  return testTeams.find(team => team.id === teamId);
};

export const getTestDivisionById = (
  divisionId: string
): Division | undefined => {
  return testDivisions.find(division => division.id === divisionId);
};

export const getTestPeopleByTeamId = (teamId: string): Person[] => {
  return testPeople.filter(person => person.teamId === teamId);
};

export const getTestTeamsByDivisionId = (divisionId: string): Team[] => {
  return testTeams.filter(team => team.divisionId === divisionId);
};

export const getTestRoleById = (roleId: string): Role | undefined => {
  return testRoles.find(role => role.id === roleId);
};

export const getTestProjectById = (
  projectId: string
): TestProject | undefined => {
  return testProjects.find(project => project.id === projectId);
};

export const getTestWorkItemsByProjectId = (
  projectId: string
): TestWorkItem[] => {
  return testWorkItems.filter(workItem => workItem.projectId === projectId);
};

export const getTestWorkItemsByTeamId = (teamId: string): TestWorkItem[] => {
  const teamProjects = testProjects.filter(
    project => project.teamId === teamId
  );
  const projectIds = teamProjects.map(project => project.id);
  return testWorkItems.filter(workItem =>
    projectIds.includes(workItem.projectId)
  );
};

/**
 * Get test data summary for reporting
 */
export const getTestDataSummary = () => {
  return {
    divisions: testDivisions.length,
    teams: testTeams.length,
    people: testPeople.length,
    roles: testRoles.length,
    cycles: testCycles.length,
    runWorkCategories: testRunWorkCategories.length,
    skills: testSkills.length,
    personSkills: testPersonSkills.length,
    solutions: testSolutions.length,
    projects: testProjects.length,
    workItems: testWorkItems.length,
  };
};
