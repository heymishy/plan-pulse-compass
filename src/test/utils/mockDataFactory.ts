import { vi } from 'vitest';
import {
  Squad,
  SquadMember,
  Person,
  UnmappedPerson,
  Skill,
  SquadSkillGap,
  SquadRecommendation,
} from '@/types';

// Complete mock data factory with all relationships
export const createMockSquads = (): Squad[] => [
  {
    id: 'squad1',
    name: 'Alpha Squad',
    type: 'project',
    status: 'active',
    capacity: 5,
    targetSkills: ['React', 'TypeScript', 'Node.js'],
    createdDate: '2024-01-01',
    lastModified: '2024-01-01',
    description: 'Frontend development squad',
    divisionId: 'div1',
    projectIds: ['project1'],
    duration: { start: '2024-01-01', end: '2024-12-31' },
  },
  {
    id: 'squad2',
    name: 'Beta Squad',
    type: 'feature-team',
    status: 'active',
    capacity: 3,
    targetSkills: ['Python', 'Machine Learning'],
    createdDate: '2024-01-15',
    lastModified: '2024-01-15',
    description: 'Backend development squad',
    divisionId: 'div1',
    projectIds: [],
    duration: { start: '2024-01-15', end: '2024-12-31' },
  },
];

export const createMockPeople = (): Person[] => [
  {
    id: 'person1',
    name: 'John Doe',
    email: 'john@example.com',
    roleId: 'role1',
    teamId: 'team1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2024-01-01',
    skills: [
      { skillId: 'skill1', skillName: 'React', proficiency: 'expert' },
      { skillId: 'skill2', skillName: 'TypeScript', proficiency: 'advanced' },
    ],
  },
  {
    id: 'person2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roleId: 'role2',
    teamId: 'team1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2024-01-01',
    skills: [
      { skillId: 'skill1', skillName: 'React', proficiency: 'intermediate' },
      { skillId: 'skill3', skillName: 'CSS', proficiency: 'advanced' },
    ],
  },
];

export const createMockSquadMembers = (): SquadMember[] => [
  {
    id: 'member1',
    squadId: 'squad1',
    personId: 'person1',
    role: 'lead',
    allocation: 100,
    startDate: '2024-01-01',
    isActive: true,
  },
  {
    id: 'member2',
    squadId: 'squad1',
    personId: 'person2',
    role: 'member',
    allocation: 80,
    startDate: '2024-01-01',
    isActive: true,
  },
];

export const createMockUnmappedPeople = (): UnmappedPerson[] => [
  {
    id: 'unmapped1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    skills: [
      { skillId: 'skill1', skillName: 'React', proficiency: 'advanced' },
      { skillId: 'skill2', skillName: 'TypeScript', proficiency: 'expert' },
    ],
    availability: 80,
    joinDate: '2024-01-15',
    importedDate: '2024-01-15',
  },
  {
    id: 'unmapped2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    skills: [
      { skillId: 'skill3', skillName: 'Python', proficiency: 'expert' },
      {
        skillId: 'skill4',
        skillName: 'Machine Learning',
        proficiency: 'advanced',
      },
    ],
    availability: 100,
    joinDate: '2024-02-01',
    importedDate: '2024-02-01',
  },
  {
    id: 'unmapped3',
    name: 'Carol Wilson',
    email: 'carol@example.com',
    skills: [
      {
        skillId: 'skill5',
        skillName: 'Product Management',
        proficiency: 'expert',
      },
    ],
    availability: 60,
    joinDate: '2024-01-20',
    importedDate: '2024-01-20',
  },
];

export const createMockSkills = (): Skill[] => [
  { id: 'skill1', name: 'React', category: 'Technical' },
  { id: 'skill2', name: 'TypeScript', category: 'Technical' },
  { id: 'skill3', name: 'Node.js', category: 'Technical' },
  { id: 'skill4', name: 'CSS', category: 'Technical' },
  { id: 'skill5', name: 'Python', category: 'Technical' },
  { id: 'skill6', name: 'Machine Learning', category: 'Technical' },
  { id: 'skill7', name: 'Product Management', category: 'Product' },
];

export const createMockSkillGaps = (): SquadSkillGap[] => [
  {
    squadId: 'squad1',
    skillName: 'Node.js',
    requiredLevel: 3,
    currentLevel: 0,
    gap: 3,
    description: 'Backend development skills needed',
  },
  {
    squadId: 'squad1',
    skillName: 'DevOps',
    requiredLevel: 2,
    currentLevel: 0,
    gap: 2,
    description: 'Infrastructure skills needed',
  },
];

export const createMockRecommendations = (): SquadRecommendation[] => [
  {
    squadId: 'squad1',
    type: 'skill_gap',
    priority: 'high',
    title: 'Add Backend Developer',
    description: 'Squad lacks Node.js expertise for full-stack development',
    suggestedAction: 'Recruit Node.js developer',
  },
  {
    squadId: 'squad1',
    type: 'optimization',
    priority: 'medium',
    title: 'Improve Team Balance',
    description: 'Consider redistributing workload for better efficiency',
    suggestedAction: 'Adjust member allocations',
  },
];

// Complete AppContext mock factory
export const createCompleteAppContextMock = () => {
  const squads = createMockSquads();
  const people = createMockPeople();
  const squadMembers = createMockSquadMembers();
  const unmappedPeople = createMockUnmappedPeople();
  const skills = createMockSkills();
  const skillGaps = createMockSkillGaps();
  const recommendations = createMockRecommendations();

  return {
    // Core data
    squads,
    people,
    squadMembers,
    unmappedPeople,
    skills,
    roles: [
      { id: 'role1', name: 'Senior Developer', level: 'senior' },
      { id: 'role2', name: 'Frontend Developer', level: 'mid' },
    ],
    teams: [
      {
        id: 'team1',
        name: 'Engineering Team',
        divisionId: 'div1',
        capacity: 100,
        productOwnerId: 'person1',
      },
    ],
    divisions: [{ id: 'div1', name: 'Engineering Division', color: '#3B82F6' }],
    projects: [],
    epics: [],
    milestones: [],
    allocations: [],
    workItems: [],

    // Functions with proper implementations
    getSquadMembers: vi.fn((squadId: string) =>
      squadMembers.filter(m => m.squadId === squadId)
    ),
    getSquadSkillGaps: vi.fn((squadId: string) =>
      skillGaps.filter(gap => gap.squadId === squadId)
    ),
    generateSquadRecommendations: vi.fn((squadId: string) =>
      recommendations.filter(rec => rec.squadId === squadId)
    ),
    getPersonSquads: vi.fn((personId: string) =>
      squadMembers
        .filter(m => m.personId === personId)
        .map(m => squads.find(s => s.id === m.squadId)!)
    ),

    // CRUD operations
    addSquad: vi.fn(),
    updateSquad: vi.fn(),
    deleteSquad: vi.fn(),
    addSquadMember: vi.fn(),
    updateSquadMember: vi.fn(),
    removeSquadMember: vi.fn(),
    addPerson: vi.fn(),
    updatePerson: vi.fn(),
    deletePerson: vi.fn(),
    addUnmappedPerson: vi.fn(),
    removeUnmappedPerson: vi.fn(),
    addTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    addRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    addSkill: vi.fn(),
    updateSkill: vi.fn(),
    deleteSkill: vi.fn(),
    addProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    addEpic: vi.fn(),
    updateEpic: vi.fn(),
    deleteEpic: vi.fn(),
    addMilestone: vi.fn(),
    updateMilestone: vi.fn(),
    deleteMilestone: vi.fn(),
    addAllocation: vi.fn(),
    updateAllocation: vi.fn(),
    deleteAllocation: vi.fn(),
    addWorkItem: vi.fn(),
    updateWorkItem: vi.fn(),
    deleteWorkItem: vi.fn(),
    addDivision: vi.fn(),
    updateDivision: vi.fn(),
    deleteDivision: vi.fn(),

    // State
    isLoading: false,

    // Utility functions
    exportData: vi.fn(),
    importData: vi.fn(),
    clearAllData: vi.fn(),
    refreshData: vi.fn(),
    hasSampleData: vi.fn(),
    loadSampleData: vi.fn(),
  };
};
