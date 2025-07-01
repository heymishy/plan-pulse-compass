import { describe, it, expect } from 'vitest';
import {
  getProductOwnerName,
  getTeamMembers,
  getNaturalProductOwner,
  isNaturalProductOwner,
  getProductOwnerCandidates,
  getDivisionName,
} from '../teamUtils';
import { Team, Person, Role } from '@/types';

describe('teamUtils', () => {
  const mockRoles: Role[] = [
    {
      id: 'role-po',
      name: 'Product Owner',
      rateType: 'annual',
      defaultRate: 120000,
    },
    {
      id: 'role-se',
      name: 'Software Engineer',
      rateType: 'annual',
      defaultRate: 100000,
    },
    {
      id: 'role-qe',
      name: 'Quality Engineer',
      rateType: 'annual',
      defaultRate: 95000,
    },
  ];

  const mockPeople: Person[] = [
    {
      id: 'person-1',
      name: 'John Doe',
      email: 'john@example.com',
      roleId: 'role-po',
      teamId: 'team-1',
      isActive: true,
      employmentType: 'permanent',
      annualSalary: 120000,
      startDate: '2023-01-15',
    },
    {
      id: 'person-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      roleId: 'role-se',
      teamId: 'team-1',
      isActive: true,
      employmentType: 'permanent',
      annualSalary: 100000,
      startDate: '2023-01-15',
    },
    {
      id: 'person-3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      roleId: 'role-po',
      teamId: 'team-2',
      isActive: true,
      employmentType: 'permanent',
      annualSalary: 120000,
      startDate: '2023-01-15',
    },
    {
      id: 'person-4',
      name: 'Alice Brown',
      email: 'alice@example.com',
      roleId: 'role-se',
      teamId: 'team-1',
      isActive: false, // Inactive person
      employmentType: 'permanent',
      annualSalary: 100000,
      startDate: '2023-01-15',
    },
    {
      id: 'person-5',
      name: 'Charlie Wilson',
      email: 'charlie@example.com',
      roleId: 'role-se',
      teamId: 'team-2',
      isActive: true,
      employmentType: 'permanent',
      annualSalary: 100000,
      startDate: '2023-01-15',
    },
  ];

  const mockTeams: Team[] = [
    {
      id: 'team-1',
      name: 'Engineering Team 1',
      divisionId: 'div-1',
      productOwnerId: 'person-1', // Natural PO
      capacity: 40,
    },
    {
      id: 'team-2',
      name: 'Engineering Team 2',
      divisionId: 'div-1',
      productOwnerId: 'person-5', // Acting PO (Charlie, not natural PO Bob)
      capacity: 40,
    },
    {
      id: 'team-3',
      name: 'Engineering Team 3',
      divisionId: 'div-2',
      productOwnerId: undefined, // No PO assigned
      capacity: 40,
    },
  ];

  const mockDivisions = [
    { id: 'div-1', name: 'Engineering' },
    { id: 'div-2', name: 'Product' },
  ];

  describe('getProductOwnerName', () => {
    it('should return "No Product Owner" when no PO is assigned', () => {
      const result = getProductOwnerName(mockTeams[2], mockPeople, mockRoles);
      expect(result).toBe('No Product Owner');
    });

    it('should return "Unknown Product Owner" when assigned PO does not exist', () => {
      const teamWithInvalidPO: Team = {
        ...mockTeams[0],
        productOwnerId: 'non-existent-person',
      };
      const result = getProductOwnerName(
        teamWithInvalidPO,
        mockPeople,
        mockRoles
      );
      expect(result).toBe('Unknown Product Owner');
    });

    it('should return natural PO name with "(Team PO)" suffix', () => {
      const result = getProductOwnerName(mockTeams[0], mockPeople, mockRoles);
      expect(result).toBe('John Doe (Team PO)');
    });

    it('should return acting PO name with "(Acting)" suffix', () => {
      const result = getProductOwnerName(mockTeams[1], mockPeople, mockRoles);
      expect(result).toBe('Charlie Wilson (Acting)');
    });

    it('should return external PO name with "(External)" suffix when PO is not in team', () => {
      const teamWithExternalPO: Team = {
        ...mockTeams[0],
        productOwnerId: 'person-3', // Bob from team-2
      };
      const result = getProductOwnerName(
        teamWithExternalPO,
        mockPeople,
        mockRoles
      );
      expect(result).toBe('Bob Johnson (External)');
    });

    it('should return just the name when no PO role exists', () => {
      const rolesWithoutPO: Role[] = [
        {
          id: 'role-se',
          name: 'Software Engineer',
          rateType: 'annual',
          defaultRate: 100000,
        },
        {
          id: 'role-qe',
          name: 'Quality Engineer',
          rateType: 'annual',
          defaultRate: 95000,
        },
      ];
      const result = getProductOwnerName(
        mockTeams[0],
        mockPeople,
        rolesWithoutPO
      );
      expect(result).toBe('John Doe');
    });
  });

  describe('getTeamMembers', () => {
    it('should return only active team members', () => {
      const result = getTeamMembers('team-1', mockPeople);
      expect(result).toHaveLength(2);
      expect(result.map(p => p.name)).toEqual(['John Doe', 'Jane Smith']);
    });

    it('should return empty array for team with no members', () => {
      const result = getTeamMembers('non-existent-team', mockPeople);
      expect(result).toHaveLength(0);
    });

    it('should exclude inactive members', () => {
      const result = getTeamMembers('team-1', mockPeople);
      const inactiveMember = result.find(p => p.name === 'Alice Brown');
      expect(inactiveMember).toBeUndefined();
    });
  });

  describe('getNaturalProductOwner', () => {
    it('should return the person with PO role in the team', () => {
      const result = getNaturalProductOwner('team-1', mockPeople, mockRoles);
      expect(result?.name).toBe('John Doe');
    });

    it('should return null when no PO role exists', () => {
      const rolesWithoutPO: Role[] = [
        {
          id: 'role-se',
          name: 'Software Engineer',
          rateType: 'annual',
          defaultRate: 100000,
        },
        {
          id: 'role-qe',
          name: 'Quality Engineer',
          rateType: 'annual',
          defaultRate: 95000,
        },
      ];
      const result = getNaturalProductOwner(
        'team-1',
        mockPeople,
        rolesWithoutPO
      );
      expect(result).toBeNull();
    });

    it('should return the natural PO when person with PO role exists in team', () => {
      const result = getNaturalProductOwner('team-2', mockPeople, mockRoles);
      expect(result?.name).toBe('Bob Johnson');
    });
  });

  describe('isNaturalProductOwner', () => {
    it('should return true for person who is natural PO', () => {
      const result = isNaturalProductOwner('person-1', mockPeople, mockRoles);
      expect(result).toBe(true);
    });

    it('should return false for person who is not natural PO', () => {
      const result = isNaturalProductOwner('person-2', mockPeople, mockRoles);
      expect(result).toBe(false);
    });

    it('should return false for person who does not exist', () => {
      const result = isNaturalProductOwner(
        'non-existent-person',
        mockPeople,
        mockRoles
      );
      expect(result).toBe(false);
    });

    it('should return false for person without team', () => {
      const personWithoutTeam: Person = {
        ...mockPeople[0],
        id: 'person-no-team',
        teamId: '',
      };
      const peopleWithPersonWithoutTeam = [...mockPeople, personWithoutTeam];
      const result = isNaturalProductOwner(
        personWithoutTeam.id,
        peopleWithPersonWithoutTeam,
        mockRoles
      );
      expect(result).toBe(false);
    });
  });

  describe('getProductOwnerCandidates', () => {
    it('should prioritize natural PO at the beginning', () => {
      const result = getProductOwnerCandidates('team-1', mockPeople, mockRoles);
      expect(result[0].name).toBe('John Doe'); // Natural PO should be first
      expect(result).toHaveLength(2);
    });

    it('should return all team members when no natural PO exists', () => {
      // Create a team with no natural PO
      const peopleWithoutNaturalPO = mockPeople.filter(
        p => p.teamId !== 'team-2' || p.roleId !== 'role-po'
      );
      const result = getProductOwnerCandidates(
        'team-2',
        peopleWithoutNaturalPO,
        mockRoles
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charlie Wilson');
    });

    it('should return empty array for team with no members', () => {
      const result = getProductOwnerCandidates(
        'non-existent-team',
        mockPeople,
        mockRoles
      );
      expect(result).toHaveLength(0);
    });
  });

  describe('getDivisionName', () => {
    it('should return division name when division exists', () => {
      const result = getDivisionName('div-1', mockDivisions);
      expect(result).toBe('Engineering');
    });

    it('should return "No Division" when divisionId is undefined', () => {
      const result = getDivisionName(undefined, mockDivisions);
      expect(result).toBe('No Division');
    });

    it('should return "Unknown Division" when division does not exist', () => {
      const result = getDivisionName('non-existent-division', mockDivisions);
      expect(result).toBe('Unknown Division');
    });
  });
});
