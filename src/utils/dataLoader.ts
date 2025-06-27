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
} from '../types';
import {
  sampleDivisions,
  sampleTeams,
  samplePeople,
  sampleRoles,
  getTeamById,
  getDivisionById,
  getPeopleByTeamId,
  getTeamsByDivisionId,
  getRoleById,
} from '../data/sampleData';

export interface DataLoaderOptions {
  loadSampleData?: boolean;
  loadTestData?: boolean;
  clearExistingData?: boolean;
  includeSkills?: boolean;
  includeSolutions?: boolean;
  includeCycles?: boolean;
  includeRunWorkCategories?: boolean;
}

export interface LoadedData {
  divisions: Division[];
  teams: Team[];
  people: Person[];
  roles: Role[];
  cycles?: Cycle[];
  runWorkCategories?: RunWorkCategory[];
  skills?: Skill[];
  personSkills?: PersonSkill[];
  solutions?: Solution[];
  projectSkills?: ProjectSkill[];
  projectSolutions?: ProjectSolution[];
  config?: AppConfig;
}

/**
 * Load comprehensive sample data for the banking application
 * This includes 50 teams across 4 divisions with realistic team structures
 */
export const loadSampleData = (options: DataLoaderOptions = {}): LoadedData => {
  const {
    loadSampleData = true,
    loadTestData = false,
    clearExistingData = false,
    includeSkills = true,
    includeSolutions = true,
    includeCycles = true,
    includeRunWorkCategories = true,
  } = options;

  const data: LoadedData = {
    divisions: [],
    teams: [],
    people: [],
    roles: [],
  };

  if (loadSampleData) {
    // Load core sample data
    data.divisions = [...sampleDivisions];
    data.teams = [...sampleTeams];
    data.people = [...samplePeople];
    data.roles = [...sampleRoles];
  }

  if (includeCycles) {
    data.cycles = generateSampleCycles();
  }

  if (includeRunWorkCategories) {
    data.runWorkCategories = generateSampleRunWorkCategories();
  }

  if (includeSkills) {
    const skillsData = generateSampleSkills();
    data.skills = skillsData.skills;
    data.personSkills = skillsData.personSkills;
  }

  if (includeSolutions) {
    const solutionsData = generateSampleSolutions();
    data.solutions = solutionsData.solutions;
    data.projectSkills = solutionsData.projectSkills;
    data.projectSolutions = solutionsData.projectSolutions;
  }

  data.config = generateSampleConfig();

  return data;
};

/**
 * Generate sample cycles for the application
 */
const generateSampleCycles = (): Cycle[] => {
  const currentYear = new Date().getFullYear();

  return [
    // Annual cycle
    {
      id: `annual-${currentYear}`,
      name: `${currentYear} Annual`,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      type: 'annual',
      status: 'active',
    },
    // Quarterly cycles
    {
      id: `q1-${currentYear}`,
      name: `Q1 ${currentYear}`,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-03-31`,
      type: 'quarterly',
      status: 'active',
      parentCycleId: `annual-${currentYear}`,
    },
    {
      id: `q2-${currentYear}`,
      name: `Q2 ${currentYear}`,
      startDate: `${currentYear}-04-01`,
      endDate: `${currentYear}-06-30`,
      type: 'quarterly',
      status: 'planning',
      parentCycleId: `annual-${currentYear}`,
    },
    {
      id: `q3-${currentYear}`,
      name: `Q3 ${currentYear}`,
      startDate: `${currentYear}-07-01`,
      endDate: `${currentYear}-09-30`,
      type: 'quarterly',
      status: 'planning',
      parentCycleId: `annual-${currentYear}`,
    },
    {
      id: `q4-${currentYear}`,
      name: `Q4 ${currentYear}`,
      startDate: `${currentYear}-10-01`,
      endDate: `${currentYear}-12-31`,
      type: 'quarterly',
      status: 'planning',
      parentCycleId: `annual-${currentYear}`,
    },
    // Monthly cycles for current quarter
    {
      id: `month-${currentYear}-01`,
      name: `January ${currentYear}`,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-01-31`,
      type: 'monthly',
      status: 'completed',
      parentCycleId: `q1-${currentYear}`,
    },
    {
      id: `month-${currentYear}-02`,
      name: `February ${currentYear}`,
      startDate: `${currentYear}-02-01`,
      endDate: `${currentYear}-02-29`,
      type: 'monthly',
      status: 'completed',
      parentCycleId: `q1-${currentYear}`,
    },
    {
      id: `month-${currentYear}-03`,
      name: `March ${currentYear}`,
      startDate: `${currentYear}-03-01`,
      endDate: `${currentYear}-03-31`,
      type: 'monthly',
      status: 'active',
      parentCycleId: `q1-${currentYear}`,
    },
  ];
};

/**
 * Generate sample run work categories
 */
const generateSampleRunWorkCategories = (): RunWorkCategory[] => {
  return [
    {
      id: 'run-bau',
      name: 'Business as Usual',
      description: 'Ongoing operational work and maintenance',
      color: '#6B7280',
    },
    {
      id: 'run-support',
      name: 'Production Support',
      description: 'Incident response and production issues',
      color: '#EF4444',
    },
    {
      id: 'run-bugfix',
      name: 'Bug Fixes',
      description: 'Defect resolution and bug fixes',
      color: '#F59E0B',
    },
    {
      id: 'run-compliance',
      name: 'Compliance & Security',
      description: 'Regulatory compliance and security updates',
      color: '#10B981',
    },
    {
      id: 'run-optimization',
      name: 'Performance Optimization',
      description: 'System performance improvements',
      color: '#3B82F6',
    },
    {
      id: 'run-documentation',
      name: 'Documentation',
      description: 'Technical documentation and knowledge sharing',
      color: '#8B5CF6',
    },
  ];
};

/**
 * Generate sample skills relevant to banking/financial services
 */
const generateSampleSkills = (): {
  skills: Skill[];
  personSkills: PersonSkill[];
} => {
  const skills: Skill[] = [
    // Programming Languages
    {
      id: 'skill-js',
      name: 'JavaScript/TypeScript',
      category: 'programming-language',
      description: 'Frontend and backend JavaScript development',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-java',
      name: 'Java',
      category: 'programming-language',
      description: 'Enterprise Java development',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-python',
      name: 'Python',
      category: 'programming-language',
      description: 'Data analysis and automation',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-sql',
      name: 'SQL',
      category: 'programming-language',
      description: 'Database querying and management',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-csharp',
      name: 'C#',
      category: 'programming-language',
      description: '.NET development',
      createdDate: '2024-01-01',
    },

    // Frameworks
    {
      id: 'skill-react',
      name: 'React',
      category: 'framework',
      description: 'Frontend React development',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-spring',
      name: 'Spring Boot',
      category: 'framework',
      description: 'Java Spring framework',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-node',
      name: 'Node.js',
      category: 'framework',
      description: 'Server-side JavaScript',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-angular',
      name: 'Angular',
      category: 'framework',
      description: 'Frontend Angular development',
      createdDate: '2024-01-01',
    },

    // Platforms
    {
      id: 'skill-aws',
      name: 'AWS',
      category: 'platform',
      description: 'Amazon Web Services cloud platform',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-azure',
      name: 'Azure',
      category: 'platform',
      description: 'Microsoft Azure cloud platform',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-kubernetes',
      name: 'Kubernetes',
      category: 'platform',
      description: 'Container orchestration',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-docker',
      name: 'Docker',
      category: 'platform',
      description: 'Containerization technology',
      createdDate: '2024-01-01',
    },

    // Domain Knowledge
    {
      id: 'skill-lending',
      name: 'Lending & Credit',
      category: 'domain-knowledge',
      description: 'Banking lending and credit assessment',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-payments',
      name: 'Payments Processing',
      category: 'domain-knowledge',
      description: 'Payment systems and processing',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-compliance',
      name: 'Banking Compliance',
      category: 'domain-knowledge',
      description: 'Regulatory compliance and risk management',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-fraud',
      name: 'Fraud Detection',
      category: 'domain-knowledge',
      description: 'Financial fraud detection and prevention',
      createdDate: '2024-01-01',
    },

    // Methodologies
    {
      id: 'skill-agile',
      name: 'Agile/Scrum',
      category: 'methodology',
      description: 'Agile development methodologies',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-devops',
      name: 'DevOps',
      category: 'methodology',
      description: 'DevOps practices and culture',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-tdd',
      name: 'TDD/BDD',
      category: 'methodology',
      description: 'Test-driven development',
      createdDate: '2024-01-01',
    },

    // Tools
    {
      id: 'skill-git',
      name: 'Git',
      category: 'tool',
      description: 'Version control system',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-jenkins',
      name: 'Jenkins',
      category: 'tool',
      description: 'CI/CD automation',
      createdDate: '2024-01-01',
    },
    {
      id: 'skill-jira',
      name: 'Jira',
      category: 'tool',
      description: 'Project management and issue tracking',
      createdDate: '2024-01-01',
    },
  ];

  // Generate person skills (assign skills to people based on their roles)
  const personSkills: PersonSkill[] = [];
  const skillId = 1;

  samplePeople.forEach(person => {
    const role = getRoleById(person.roleId);
    if (!role) return;

    // Assign skills based on role
    let skillsToAssign: string[] = [];

    if (role.name === 'Product Owner') {
      skillsToAssign = [
        'skill-agile',
        'skill-jira',
        'skill-lending',
        'skill-compliance',
      ];
    } else if (role.name === 'Software Engineer') {
      skillsToAssign = [
        'skill-js',
        'skill-react',
        'skill-node',
        'skill-git',
        'skill-agile',
        'skill-tdd',
        'skill-aws',
        'skill-docker',
      ];
    } else if (role.name === 'Quality Engineer') {
      skillsToAssign = [
        'skill-js',
        'skill-python',
        'skill-tdd',
        'skill-jenkins',
        'skill-git',
        'skill-agile',
        'skill-docker',
      ];
    } else if (role.name === 'Platform Engineer') {
      skillsToAssign = [
        'skill-aws',
        'skill-azure',
        'skill-kubernetes',
        'skill-docker',
        'skill-jenkins',
        'skill-devops',
        'skill-git',
      ];
    }

    // Randomly assign 3-6 skills per person
    const numSkills = Math.floor(Math.random() * 4) + 3;
    const shuffledSkills = skillsToAssign.sort(() => 0.5 - Math.random());
    const selectedSkills = shuffledSkills.slice(
      0,
      Math.min(numSkills, skillsToAssign.length)
    );

    selectedSkills.forEach(skillId => {
      const proficiencyLevels: (
        | 'beginner'
        | 'intermediate'
        | 'advanced'
        | 'expert'
      )[] = ['beginner', 'intermediate', 'advanced', 'expert'];
      const randomProficiency =
        proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)];

      personSkills.push({
        id: `person-skill-${skillId.toString().padStart(6, '0')}`,
        personId: person.id,
        skillId: skillId,
        proficiencyLevel: randomProficiency,
        yearsOfExperience: Math.floor(Math.random() * 8) + 1,
        lastUsed: new Date().toISOString(),
        notes: '',
      });
      skillId++;
    });
  });

  return { skills, personSkills };
};

/**
 * Generate sample solutions for banking projects
 */
const generateSampleSolutions = (): {
  solutions: Solution[];
  projectSkills: ProjectSkill[];
  projectSolutions: ProjectSolution[];
} => {
  const solutions: Solution[] = [
    {
      id: 'solution-microservices',
      name: 'Microservices Architecture',
      description:
        'Distributed microservices architecture for scalable banking applications',
      category: 'architecture-pattern',
      skillIds: [
        'skill-java',
        'skill-spring',
        'skill-kubernetes',
        'skill-docker',
      ],
      createdDate: '2024-01-01',
    },
    {
      id: 'solution-react-spa',
      name: 'React Single Page Application',
      description: 'Modern React-based frontend for banking applications',
      category: 'framework-stack',
      skillIds: ['skill-js', 'skill-react', 'skill-node'],
      createdDate: '2024-01-01',
    },
    {
      id: 'solution-cloud-native',
      name: 'Cloud-Native Platform',
      description: 'AWS/Azure cloud-native banking platform',
      category: 'platform',
      skillIds: [
        'skill-aws',
        'skill-azure',
        'skill-kubernetes',
        'skill-docker',
      ],
      createdDate: '2024-01-01',
    },
    {
      id: 'solution-devops-pipeline',
      name: 'DevOps CI/CD Pipeline',
      description: 'Automated deployment and testing pipeline',
      category: 'methodology',
      skillIds: ['skill-jenkins', 'skill-git', 'skill-docker', 'skill-devops'],
      createdDate: '2024-01-01',
    },
    {
      id: 'solution-api-gateway',
      name: 'API Gateway Pattern',
      description: 'Centralized API management and security',
      category: 'architecture-pattern',
      skillIds: ['skill-java', 'skill-spring', 'skill-aws', 'skill-azure'],
      createdDate: '2024-01-01',
    },
  ];

  // For now, return empty arrays for project-related data
  // These would be populated when projects are created
  return {
    solutions,
    projectSkills: [],
    projectSolutions: [],
  };
};

/**
 * Generate sample application configuration
 */
const generateSampleConfig = (): AppConfig => {
  const currentYear = new Date().getFullYear();

  return {
    financialYear: {
      id: `fy-${currentYear}`,
      name: `FY ${currentYear}`,
      startDate: `${currentYear}-07-01`,
      endDate: `${currentYear + 1}-06-30`,
    },
    iterationLength: 'fortnightly',
    quarters: [
      {
        id: `q1-${currentYear}`,
        name: `Q1 ${currentYear}`,
        startDate: `${currentYear}-07-01`,
        endDate: `${currentYear}-09-30`,
        type: 'quarterly',
        status: 'completed',
      },
      {
        id: `q2-${currentYear}`,
        name: `Q2 ${currentYear}`,
        startDate: `${currentYear}-10-01`,
        endDate: `${currentYear}-12-31`,
        type: 'quarterly',
        status: 'completed',
      },
      {
        id: `q3-${currentYear + 1}`,
        name: `Q3 ${currentYear + 1}`,
        startDate: `${currentYear + 1}-01-01`,
        endDate: `${currentYear + 1}-03-31`,
        type: 'quarterly',
        status: 'active',
      },
      {
        id: `q4-${currentYear + 1}`,
        name: `Q4 ${currentYear + 1}`,
        startDate: `${currentYear + 1}-04-01`,
        endDate: `${currentYear + 1}-06-30`,
        type: 'quarterly',
        status: 'planning',
      },
    ],
  };
};

/**
 * Get data summary for reporting
 */
export const getDataSummary = (data: LoadedData) => {
  return {
    divisions: data.divisions.length,
    teams: data.teams.length,
    people: data.people.length,
    roles: data.roles.length,
    cycles: data.cycles?.length || 0,
    runWorkCategories: data.runWorkCategories?.length || 0,
    skills: data.skills?.length || 0,
    personSkills: data.personSkills?.length || 0,
    solutions: data.solutions?.length || 0,
  };
};

/**
 * Validate loaded data for consistency
 */
export const validateLoadedData = (
  data: LoadedData
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for required data
  if (data.divisions.length === 0) errors.push('No divisions loaded');
  if (data.teams.length === 0) errors.push('No teams loaded');
  if (data.people.length === 0) errors.push('No people loaded');
  if (data.roles.length === 0) errors.push('No roles loaded');

  // Check team-division relationships
  data.teams.forEach(team => {
    if (!data.divisions.find(div => div.id === team.divisionId)) {
      errors.push(
        `Team ${team.name} references non-existent division ${team.divisionId}`
      );
    }
  });

  // Check person-team relationships
  data.people.forEach(person => {
    if (!data.teams.find(team => team.id === person.teamId)) {
      errors.push(
        `Person ${person.name} references non-existent team ${person.teamId}`
      );
    }
    if (!data.roles.find(role => role.id === person.roleId)) {
      errors.push(
        `Person ${person.name} references non-existent role ${person.roleId}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
