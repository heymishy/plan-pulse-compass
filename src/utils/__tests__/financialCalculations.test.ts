import {
  calculatePersonCost,
  calculateTeamWeeklyCost,
  calculateTeamMonthlyCost,
  calculateTeamQuarterlyCost,
  calculateTeamAnnualCost,
  calculateAllocationCost,
} from '../financialCalculations';
import { Person, Role, Allocation, Cycle, AppConfig } from '@/types';

describe('Financial Calculations', () => {
  const mockConfig: AppConfig = {
    financialYear: {
      id: 'fy2024',
      name: 'FY 2024',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    },
    iterationLength: 'fortnightly',
    quarters: [],
    workingDaysPerWeek: 5,
    workingHoursPerDay: 8,
    workingDaysPerYear: 260,
    workingDaysPerMonth: 22,
    currencySymbol: '$',
  };

  const mockRole: Role = {
    id: 'dev-role',
    name: 'Developer',
    rateType: 'hourly',
    defaultRate: 50, // Legacy fallback
    defaultHourlyRate: 60,
    defaultDailyRate: 480,
    defaultAnnualSalary: 120000,
  };

  const mockPersonPermanent: Person = {
    id: 'p1',
    name: 'Alice',
    email: 'alice@example.com',
    roleId: 'dev-role',
    teamId: 't1',
    isActive: true,
    employmentType: 'permanent',
    annualSalary: 100000,
    startDate: '2023-01-01',
  };

  const mockPersonContractor: Person = {
    id: 'p2',
    name: 'Bob',
    email: 'bob@example.com',
    roleId: 'dev-role',
    teamId: 't1',
    isActive: true,
    employmentType: 'contractor',
    contractDetails: {
      hourlyRate: 75,
    },
    startDate: '2023-01-01',
  };

  const mockPersonContractorDaily: Person = {
    id: 'p3',
    name: 'Charlie',
    email: 'charlie@example.com',
    roleId: 'dev-role',
    teamId: 't1',
    isActive: true,
    employmentType: 'contractor',
    contractDetails: {
      dailyRate: 600,
    },
    startDate: '2023-01-01',
  };

  const mockPersonPermanentNoSalary: Person = {
    id: 'p4',
    name: 'David',
    email: 'david@example.com',
    roleId: 'dev-role',
    teamId: 't1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2023-01-01',
  };

  const mockPersonContractorNoRate: Person = {
    id: 'p5',
    name: 'Eve',
    email: 'eve@example.com',
    roleId: 'dev-role',
    teamId: 't1',
    isActive: true,
    employmentType: 'contractor',
    startDate: '2023-01-01',
  };

  const mockCycle: Cycle = {
    id: 'c1',
    type: 'iteration',
    name: 'Iteration 1',
    startDate: '2024-01-01',
    endDate: '2024-01-14', // 14 days
    status: 'active',
  };

  describe('calculatePersonCost', () => {
    it('should calculate cost for a permanent employee with annual salary', () => {
      const result = calculatePersonCost(
        mockPersonPermanent,
        mockRole,
        mockConfig
      );
      expect(result.costPerHour).toBeCloseTo(
        100000 / (mockConfig.workingDaysPerYear * mockConfig.workingHoursPerDay)
      );
      expect(result.rateSource).toBe('personal');
    });

    it('should calculate cost for a contractor with hourly rate', () => {
      const result = calculatePersonCost(
        mockPersonContractor,
        mockRole,
        mockConfig
      );
      expect(result.costPerHour).toBe(75);
      expect(result.rateSource).toBe('personal');
    });

    it('should calculate cost for a contractor with daily rate', () => {
      const result = calculatePersonCost(
        mockPersonContractorDaily,
        mockRole,
        mockConfig
      );
      expect(result.costPerHour).toBeCloseTo(
        600 / mockConfig.workingHoursPerDay
      );
      expect(result.rateSource).toBe('personal');
    });

    it('should use role default annual salary for permanent employee if no personal salary', () => {
      const result = calculatePersonCost(
        mockPersonPermanentNoSalary,
        mockRole,
        mockConfig
      );
      expect(result.costPerHour).toBeCloseTo(
        mockRole.defaultAnnualSalary! /
          (mockConfig.workingDaysPerYear * mockConfig.workingHoursPerDay)
      );
      expect(result.rateSource).toBe('role-default');
    });

    it('should use role default hourly rate for contractor if no personal rate', () => {
      const result = calculatePersonCost(
        mockPersonContractorNoRate,
        mockRole,
        mockConfig
      );
      expect(result.costPerHour).toBe(mockRole.defaultHourlyRate);
      expect(result.rateSource).toBe('role-default');
    });

    it('should use legacy fallback if no other rates are available', () => {
      const person: Person = {
        ...mockPersonPermanentNoSalary,
        employmentType: 'permanent',
      };
      const role: Role = {
        ...mockRole,
        defaultAnnualSalary: undefined,
        defaultHourlyRate: undefined,
        defaultDailyRate: undefined,
      };
      const result = calculatePersonCost(person, role, mockConfig);
      expect(result.costPerHour).toBe(mockRole.defaultRate);
      expect(result.rateSource).toBe('legacy-fallback');
    });
  });

  describe('calculateTeamWeeklyCost', () => {
    it('should calculate the total weekly cost for a team', () => {
      const teamMembers: Person[] = [mockPersonPermanent, mockPersonContractor];
      const roles: Role[] = [mockRole];
      const expectedCost =
        (100000 /
          (mockConfig.workingDaysPerYear * mockConfig.workingHoursPerDay)) *
          mockConfig.workingHoursPerDay *
          mockConfig.workingDaysPerWeek +
        75 * mockConfig.workingHoursPerDay * mockConfig.workingDaysPerWeek;
      const result = calculateTeamWeeklyCost(teamMembers, roles, mockConfig);
      expect(result).toBeCloseTo(expectedCost);
    });
  });

  describe('calculateTeamMonthlyCost', () => {
    it('should calculate the total monthly cost for a team', () => {
      const teamMembers: Person[] = [mockPersonPermanent, mockPersonContractor];
      const roles: Role[] = [mockRole];
      const expectedCost =
        (100000 /
          (mockConfig.workingDaysPerYear * mockConfig.workingHoursPerDay)) *
          mockConfig.workingHoursPerDay *
          mockConfig.workingDaysPerMonth +
        75 * mockConfig.workingHoursPerDay * mockConfig.workingDaysPerMonth;
      const result = calculateTeamMonthlyCost(teamMembers, roles, mockConfig);
      expect(result).toBeCloseTo(expectedCost);
    });
  });

  describe('calculateTeamQuarterlyCost', () => {
    it('should calculate the total quarterly cost for a team', () => {
      const teamMembers: Person[] = [mockPersonPermanent, mockPersonContractor];
      const roles: Role[] = [mockRole];
      const expectedMonthlyCost =
        (100000 /
          (mockConfig.workingDaysPerYear * mockConfig.workingHoursPerDay)) *
          mockConfig.workingHoursPerDay *
          mockConfig.workingDaysPerMonth +
        75 * mockConfig.workingHoursPerDay * mockConfig.workingDaysPerMonth;
      const expectedCost = expectedMonthlyCost * 3;
      const result = calculateTeamQuarterlyCost(teamMembers, roles, mockConfig);
      expect(result).toBeCloseTo(expectedCost);
    });
  });

  describe('calculateTeamAnnualCost', () => {
    it('should calculate the total annual cost for a team', () => {
      const teamMembers: Person[] = [mockPersonPermanent, mockPersonContractor];
      const roles: Role[] = [mockRole];
      const expectedCost =
        (100000 /
          (mockConfig.workingDaysPerYear * mockConfig.workingHoursPerDay)) *
          mockConfig.workingHoursPerDay *
          mockConfig.workingDaysPerYear +
        75 * mockConfig.workingHoursPerDay * mockConfig.workingDaysPerYear;
      const result = calculateTeamAnnualCost(teamMembers, roles, mockConfig);
      expect(result).toBeCloseTo(expectedCost);
    });
  });

  describe('calculateAllocationCost', () => {
    it('should calculate the cost of an allocation', () => {
      const allocation: Allocation = {
        id: 'a1',
        teamId: 't1',
        cycleId: 'c1',
        iterationNumber: 1,
        epicId: 'e1',
        percentage: 50,
      };
      const teamMembers: Person[] = [mockPersonPermanent];
      const roles: Role[] = [mockRole];

      const cycleDurationInDays = Math.ceil(
        (new Date(mockCycle.endDate).getTime() -
          new Date(mockCycle.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const expectedCost =
        (100000 /
          (mockConfig.workingDaysPerYear * mockConfig.workingHoursPerDay)) *
        mockConfig.workingHoursPerDay *
        cycleDurationInDays *
        (allocation.percentage / 100);

      const result = calculateAllocationCost(
        allocation,
        mockCycle,
        teamMembers,
        roles,
        mockConfig
      );
      expect(result).toBeCloseTo(expectedCost);
    });
  });
});
