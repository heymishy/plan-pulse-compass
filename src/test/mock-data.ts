export const mockPeople = [
  {
    id: '1',
    name: 'John Doe',
    annualSalary: 120000,
    teamId: '1',
    roleId: '1',
    email: 'john.doe@example.com',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2025-01-01',
  },
];

export const mockTeams = [
  {
    id: '1',
    name: 'Team A',
    description: 'Team A',
    type: 'permanent',
    status: 'active',
    capacity: 40,
    targetSkills: [],
    createdDate: '2025-01-01',
    lastModified: '2025-01-01',
  },
];

export const mockAllocations = [
  { id: '1', teamId: '1', cycleId: '1', iterationNumber: 1, percentage: 100 },
];
