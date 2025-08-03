import { describe, it, expect } from 'vitest';
import { Person, Team } from '@/types';
import {
  calculateTeamCost,
  analyzeTeamMoveImpact,
} from '../financialImpactUtils';

const mockPeople: Person[] = [
  {
    id: '1',
    name: 'Alice',
    teamId: 'team-1',
    annualSalary: 100000,
    email: 'alice@example.com',
    roleId: 'role-1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2023-01-01',
  },
  {
    id: '2',
    name: 'Bob',
    teamId: 'team-1',
    annualSalary: 120000,
    email: 'bob@example.com',
    roleId: 'role-1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2023-01-01',
  },
  {
    id: '3',
    name: 'Charlie',
    teamId: 'team-2',
    annualSalary: 90000,
    email: 'charlie@example.com',
    roleId: 'role-2',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2023-01-01',
  },
];

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Team Alpha',
    capacity: 80,
    type: 'permanent',
    status: 'active',
    createdDate: '2023-01-01',
    lastModified: '2023-01-01',
    targetSkills: [],
  },
  {
    id: 'team-2',
    name: 'Team Bravo',
    capacity: 40,
    type: 'permanent',
    status: 'active',
    createdDate: '2023-01-01',
    lastModified: '2023-01-01',
    targetSkills: [],
  },
];

describe('financialImpactUtils', () => {
  describe('calculateTeamCost', () => {
    it('should correctly calculate the total cost of a team', () => {
      const team1 = mockTeams.find(t => t.id === 'team-1')!;
      const teamCost = calculateTeamCost(team1, mockPeople);
      expect(teamCost).toBe(220000);
    });

    it('should return 0 for a team with no members', () => {
      const team3: Team = {
        id: 'team-3',
        name: 'Team Charlie',
        capacity: 40,
        type: 'permanent',
        status: 'active',
        createdDate: '2023-01-01',
        lastModified: '2023-01-01',
        targetSkills: [],
      };
      const teamCost = calculateTeamCost(team3, mockPeople);
      expect(teamCost).toBe(0);
    });
  });

  describe('analyzeTeamMoveImpact', () => {
    it('should correctly analyze the financial impact of moving a person', () => {
      const personToMove = mockPeople.find(p => p.id === '1')!; // Alice
      const newTeam = mockTeams.find(t => t.id === 'team-2')!; // Team Bravo

      const impact = analyzeTeamMoveImpact(personToMove, newTeam, mockPeople);

      expect(impact.personName).toBe('Alice');
      expect(impact.originalTeamId).toBe('team-1');
      expect(impact.newTeamId).toBe('team-2');
      expect(impact.impactOnOriginalTeam).toBe(-100000);
      expect(impact.impactOnNewTeam).toBe(100000);
      expect(impact.newCostOfOriginalTeam).toBe(120000);
      expect(impact.newCostOfNewTeam).toBe(190000);
    });
  });
});
