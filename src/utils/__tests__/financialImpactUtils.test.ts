import { describe, it, expect, vi } from 'vitest';
import {
  calculateTeamCost,
  analyzeTeamMoveImpact,
} from '../financialImpactUtils';
import { Person, Team, Role, AppConfig } from '../../types';

// Mock data for testing
const mockPeople: Person[] = [
  {
    id: '1',
    name: 'Alice',
    teamId: 't1',
    roleId: 'r1',
    annualSalary: 100000,
    employmentType: 'permanent',
  },
  {
    id: '2',
    name: 'Bob',
    teamId: 't1',
    roleId: 'r2',
    annualSalary: 120000,
    employmentType: 'permanent',
  },
  {
    id: '3',
    name: 'Charlie',
    teamId: 't2',
    roleId: 'r1',
    annualSalary: 90000,
    employmentType: 'permanent',
  },
  {
    id: '4',
    name: 'David',
    teamId: 't2',
    roleId: 'r3',
    contractDetails: { hourlyRate: 100 },
    employmentType: 'contract',
  },
];

const mockTeams: Team[] = [
  { id: 't1', name: 'Team Alpha', memberIds: ['1', '2'] },
  { id: 't2', name: 'Team Bravo', memberIds: ['3', '4'] },
];

const mockRoles: Role[] = [
  { id: 'r1', name: 'Developer' },
  { id: 'r2', name: 'Senior Developer' },
  { id: 'r3', name: 'Consultant', defaultRate: 100, defaultRateType: 'hourly' },
];

const mockConfig: AppConfig = {
  workingDaysPerWeek: 5,
  workingHoursPerDay: 8,
  financialYear: {
    id: 'fy2024',
    name: 'FY 2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  currencySymbol: '$',
};

// Mock the financialCalculations module
vi.mock('../financialCalculations', () => ({
  calculatePersonCost: (person: Person, role: Role, config: AppConfig) => {
    if (person.employmentType === 'permanent') {
      return { costPerYear: person.annualSalary || 0 };
    }
    if (
      person.employmentType === 'contract' &&
      person.contractDetails?.hourlyRate
    ) {
      const hoursPerYear =
        config.workingDaysPerWeek * 52 * config.workingHoursPerDay;
      return { costPerYear: person.contractDetails.hourlyRate * hoursPerYear };
    }
    return { costPerYear: 0 };
  },
}));

describe('financialImpactUtils', () => {
  describe('calculateTeamCost', () => {
    it('should correctly calculate the total cost of a team with mixed employment types', () => {
      const team1 = mockTeams.find(t => t.id === 't1')!;
      const team2 = mockTeams.find(t => t.id === 't2')!;

      const team1Cost = calculateTeamCost(
        team1,
        mockPeople,
        mockRoles,
        mockConfig
      );
      expect(team1Cost).toBe(220000); // 100000 + 120000

      const team2Cost = calculateTeamCost(
        team2,
        mockPeople,
        mockRoles,
        mockConfig
      );
      const expectedContractorCost = 100 * 8 * 5 * 52; // hourlyRate * hoursPerDay * daysPerWeek * weeksPerYear
      expect(team2Cost).toBe(90000 + expectedContractorCost);
    });
  });

  describe('analyzeTeamMoveImpact', () => {
    it('should correctly analyze the financial impact of moving a person', () => {
      const personToMove = mockPeople.find(p => p.id === '1')!; // Alice
      const newTeam = mockTeams.find(t => t.id === 't2')!;

      const impact = analyzeTeamMoveImpact(
        personToMove,
        newTeam,
        mockPeople,
        mockRoles,
        mockTeams,
        mockConfig
      );

      const originalTeamCost = 220000;
      const newTeamCost = 90000 + 100 * 8 * 5 * 52;
      const personCost = 100000;

      expect(impact.personName).toBe('Alice');
      expect(impact.originalTeamId).toBe('t1');
      expect(impact.newTeamId).toBe('t2');
      expect(impact.impactOnOriginalTeam).toBe(-personCost);
      expect(impact.impactOnNewTeam).toBe(personCost);
      expect(impact.newCostOfOriginalTeam).toBe(originalTeamCost - personCost);
      expect(impact.newCostOfNewTeam).toBe(newTeamCost + personCost);
    });

    it('should throw an error if the original team is not found', () => {
      const personWithNoTeam = {
        ...mockPeople[0],
        teamId: 'non-existent-team',
      };
      const newTeam = mockTeams[1];
      expect(() =>
        analyzeTeamMoveImpact(
          personWithNoTeam,
          newTeam,
          mockPeople,
          mockRoles,
          mockTeams,
          mockConfig
        )
      ).toThrow('Original team not found');
    });

    it('should throw an error if the person role is not found', () => {
      const personWithNoRole = {
        ...mockPeople[0],
        roleId: 'non-existent-role',
      };
      const newTeam = mockTeams[1];
      expect(() =>
        analyzeTeamMoveImpact(
          personWithNoRole,
          newTeam,
          mockPeople,
          mockRoles,
          mockTeams,
          mockConfig
        )
      ).toThrow('Person role not found');
    });
  });
});
