import {
  getHeatMapLevel,
  getHeatMapIntensity,
  getHeatMapColors,
  generateHeatMapData,
  getHeatMapStats,
  getHeatMapLegend,
} from '../heatMapUtils';
import { Team, Cycle, Allocation } from '@/types';

// Mock data
const mockTeams: Team[] = [
  { id: 'team1', name: 'Frontend Team', divisionId: 'dev', capacity: 40 },
  { id: 'team2', name: 'Backend Team', divisionId: 'dev', capacity: 40 },
];

const mockIterations: Cycle[] = [
  {
    id: 'iter1',
    name: 'Q1 2024 - Iteration 1',
    startDate: '2024-01-01',
    endDate: '2024-01-14',
    type: 'iteration',
    parentCycleId: 'q1-2024',
    status: 'planning',
  },
  {
    id: 'iter2',
    name: 'Q1 2024 - Iteration 2',
    startDate: '2024-01-15',
    endDate: '2024-01-28',
    type: 'iteration',
    parentCycleId: 'q1-2024',
    status: 'planning',
  },
];

const mockAllocations: Allocation[] = [
  {
    id: 'alloc1',
    teamId: 'team1',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 50,
    epicId: 'epic1',
    runWorkCategoryId: '',
    notes: '',
  },
  {
    id: 'alloc2',
    teamId: 'team1',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 30,
    epicId: 'epic2',
    runWorkCategoryId: '',
    notes: '',
  },
  {
    id: 'alloc3',
    teamId: 'team2',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 120,
    epicId: 'epic1',
    runWorkCategoryId: '',
    notes: '',
  },
];

describe('heatMapUtils', () => {
  describe('getHeatMapLevel', () => {
    it('should return empty for 0%', () => {
      expect(getHeatMapLevel(0)).toBe('empty');
    });

    it('should return under for low percentages', () => {
      expect(getHeatMapLevel(30)).toBe('under');
      expect(getHeatMapLevel(59)).toBe('under');
    });

    it('should return optimal for good percentages', () => {
      expect(getHeatMapLevel(60)).toBe('optimal');
      expect(getHeatMapLevel(80)).toBe('optimal');
      expect(getHeatMapLevel(89)).toBe('optimal');
    });

    it('should return near-full for high percentages', () => {
      expect(getHeatMapLevel(90)).toBe('near-full');
      expect(getHeatMapLevel(100)).toBe('near-full');
    });

    it('should return over for overallocated percentages', () => {
      expect(getHeatMapLevel(110)).toBe('over');
      expect(getHeatMapLevel(120)).toBe('over');
    });

    it('should return critical for very high percentages', () => {
      expect(getHeatMapLevel(130)).toBe('critical');
      expect(getHeatMapLevel(200)).toBe('critical');
    });
  });

  describe('getHeatMapIntensity', () => {
    it('should return 0 for empty level', () => {
      expect(getHeatMapIntensity(0, 'empty')).toBe(0);
    });

    it('should return appropriate intensity for under level', () => {
      expect(getHeatMapIntensity(30, 'under')).toBe(30);
      expect(getHeatMapIntensity(10, 'under')).toBe(20); // minimum 20
    });

    it('should return appropriate intensity for optimal level', () => {
      expect(getHeatMapIntensity(70, 'optimal')).toBe(70);
      expect(getHeatMapIntensity(50, 'optimal')).toBe(60); // minimum 60
    });

    it('should return appropriate intensity for critical level', () => {
      expect(getHeatMapIntensity(200, 'critical')).toBe(150); // capped at 150
      expect(getHeatMapIntensity(130, 'critical')).toBe(130);
    });
  });

  describe('getHeatMapColors', () => {
    it('should return appropriate colors for empty level', () => {
      const colors = getHeatMapColors('empty', 0);
      expect(colors.backgroundColor).toContain('rgba(243, 244, 246');
      expect(colors.textColor).toContain('rgb(107, 114, 128');
    });

    it('should return appropriate colors for optimal level', () => {
      const colors = getHeatMapColors('optimal', 80);
      expect(colors.backgroundColor).toContain('rgba(167, 243, 208');
      expect(colors.textColor).toContain('rgb(22, 101, 52');
    });

    it('should return appropriate colors for critical level', () => {
      const colors = getHeatMapColors('critical', 150);
      expect(colors.backgroundColor).toContain('rgba(220, 38, 38');
      expect(colors.textColor).toBe('white');
    });

    it('should adjust alpha based on intensity', () => {
      const lowIntensity = getHeatMapColors('optimal', 30);
      const highIntensity = getHeatMapColors('optimal', 90);

      // Extract alpha values (rough check)
      expect(lowIntensity.backgroundColor).toContain('0.21'); // 30/100 * 0.7
      expect(highIntensity.backgroundColor).toContain('0.63'); // 90/100 * 0.7
    });
  });

  describe('generateHeatMapData', () => {
    it('should generate heat map data for all team-iteration combinations', () => {
      const heatMapData = generateHeatMapData(
        mockTeams,
        mockIterations,
        mockAllocations
      );

      expect(heatMapData).toHaveLength(4); // 2 teams * 2 iterations

      // Check first cell (team1, iteration 1) - should have 80% (50% + 30%)
      const team1Iter1 = heatMapData.find(
        cell => cell.teamId === 'team1' && cell.iterationNumber === 1
      );
      expect(team1Iter1).toBeDefined();
      expect(team1Iter1!.percentage).toBe(80);
      expect(team1Iter1!.level).toBe('optimal');

      // Check team2, iteration 1 - should have 120%
      const team2Iter1 = heatMapData.find(
        cell => cell.teamId === 'team2' && cell.iterationNumber === 1
      );
      expect(team2Iter1).toBeDefined();
      expect(team2Iter1!.percentage).toBe(120);
      expect(team2Iter1!.level).toBe('over');

      // Check empty cells
      const team1Iter2 = heatMapData.find(
        cell => cell.teamId === 'team1' && cell.iterationNumber === 2
      );
      expect(team1Iter2).toBeDefined();
      expect(team1Iter2!.percentage).toBe(0);
      expect(team1Iter2!.level).toBe('empty');
    });
  });

  describe('getHeatMapStats', () => {
    it('should calculate correct statistics', () => {
      const heatMapData = generateHeatMapData(
        mockTeams,
        mockIterations,
        mockAllocations
      );
      const stats = getHeatMapStats(heatMapData);

      expect(stats.total).toBe(4);
      expect(stats.empty).toBe(2); // team1-iter2, team2-iter2
      expect(stats.optimal).toBe(1); // team1-iter1 (80%)
      expect(stats.over).toBe(1); // team2-iter1 (120%)
      expect(stats.under).toBe(0);
      expect(stats.nearFull).toBe(0);
      expect(stats.critical).toBe(0);

      expect(stats.healthScore).toBe(25); // 1 optimal out of 4 total = 25%
      expect(stats.utilizationRate).toBe(50); // 2 allocated out of 4 total = 50%
    });

    it('should handle edge cases', () => {
      const emptyData = generateHeatMapData([], [], []);
      const stats = getHeatMapStats(emptyData);

      expect(stats.total).toBe(0);
      expect(stats.healthScore).toBe(0);
      expect(stats.utilizationRate).toBe(0);
    });
  });

  describe('getHeatMapLegend', () => {
    it('should return complete legend data', () => {
      const legend = getHeatMapLegend();

      expect(legend).toHaveLength(6);
      expect(legend[0]).toEqual({
        level: 'empty',
        label: 'No allocation',
        range: '0%',
      });
      expect(legend[1]).toEqual({
        level: 'under',
        label: 'Under-utilized',
        range: '< 60%',
      });
      expect(legend[5]).toEqual({
        level: 'critical',
        label: 'Critical',
        range: '> 120%',
      });
    });
  });

  describe('integration test', () => {
    it('should work end-to-end with realistic data', () => {
      // More comprehensive allocation data
      const complexAllocations: Allocation[] = [
        {
          id: '1',
          teamId: 'team1',
          cycleId: 'q1',
          iterationNumber: 1,
          percentage: 60,
          epicId: 'e1',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: '2',
          teamId: 'team1',
          cycleId: 'q1',
          iterationNumber: 1,
          percentage: 30,
          epicId: 'e2',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: '3',
          teamId: 'team1',
          cycleId: 'q1',
          iterationNumber: 2,
          percentage: 100,
          epicId: 'e1',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: '4',
          teamId: 'team2',
          cycleId: 'q1',
          iterationNumber: 1,
          percentage: 40,
          epicId: 'e3',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: '5',
          teamId: 'team2',
          cycleId: 'q1',
          iterationNumber: 2,
          percentage: 130,
          epicId: 'e1',
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const heatMapData = generateHeatMapData(
        mockTeams,
        mockIterations,
        complexAllocations
      );
      const stats = getHeatMapStats(heatMapData);

      expect(heatMapData).toHaveLength(4);

      // Verify specific calculations
      const team1Iter1Cell = heatMapData.find(
        cell => cell.teamId === 'team1' && cell.iterationNumber === 1
      );
      expect(team1Iter1Cell!.percentage).toBe(90); // 60 + 30
      expect(team1Iter1Cell!.level).toBe('near-full');

      const team2Iter2Cell = heatMapData.find(
        cell => cell.teamId === 'team2' && cell.iterationNumber === 2
      );
      expect(team2Iter2Cell!.percentage).toBe(130);
      expect(team2Iter2Cell!.level).toBe('critical');

      // Verify stats
      expect(stats.utilizationRate).toBe(100); // All 4 cells have allocations
      expect(stats.healthScore).toBe(50); // 2 optimal/near-full out of 4 = 50%
      expect(stats.critical).toBe(1);
      expect(stats.under).toBe(1);
      expect(stats.nearFull).toBe(2);
      expect(stats.optimal).toBe(0);
    });
  });
});
