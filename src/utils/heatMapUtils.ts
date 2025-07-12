import { Team, Allocation, Cycle } from '@/types';
import { calculateTeamCapacity } from './capacityUtils';

export type HeatMapLevel =
  | 'empty'
  | 'under'
  | 'optimal'
  | 'near-full'
  | 'over'
  | 'critical';

export interface HeatMapCell {
  teamId: string;
  iterationNumber: number;
  level: HeatMapLevel;
  percentage: number;
  intensity: number; // 0-100 for gradient intensity
}

export const getHeatMapLevel = (percentage: number): HeatMapLevel => {
  if (percentage === 0) return 'empty';
  if (percentage < 60) return 'under';
  if (percentage >= 60 && percentage < 90) return 'optimal';
  if (percentage >= 90 && percentage <= 100) return 'near-full';
  if (percentage > 100 && percentage <= 120) return 'over';
  return 'critical';
};

export const getHeatMapIntensity = (
  percentage: number,
  level: HeatMapLevel
): number => {
  switch (level) {
    case 'empty':
      return 0;
    case 'under':
      return Math.max(20, Math.min(60, percentage)); // 20-60%
    case 'optimal':
      return Math.max(60, Math.min(90, percentage)); // 60-90%
    case 'near-full':
      return Math.max(90, Math.min(100, percentage)); // 90-100%
    case 'over':
      return Math.max(100, Math.min(120, percentage)); // 100-120%
    case 'critical':
      return Math.min(150, percentage); // 120%+ capped at 150 for display
    default:
      return 0;
  }
};

export const getHeatMapColors = (level: HeatMapLevel, intensity: number) => {
  const alpha = Math.min(1, intensity / 100);

  switch (level) {
    case 'empty':
      return {
        backgroundColor: 'rgba(243, 244, 246, 0.5)', // gray-100
        borderColor: 'rgba(209, 213, 219, 0.7)', // gray-300
        textColor: 'rgb(107, 114, 128)', // gray-500
      };
    case 'under':
      return {
        backgroundColor: `rgba(254, 240, 138, ${alpha * 0.6})`, // yellow-200
        borderColor: `rgba(251, 191, 36, ${alpha})`, // yellow-400
        textColor: 'rgb(146, 64, 14)', // yellow-800
      };
    case 'optimal':
      return {
        backgroundColor: `rgba(167, 243, 208, ${alpha * 0.7})`, // green-200
        borderColor: `rgba(34, 197, 94, ${alpha})`, // green-500
        textColor: 'rgb(22, 101, 52)', // green-800
      };
    case 'near-full':
      return {
        backgroundColor: `rgba(147, 197, 253, ${alpha * 0.7})`, // blue-300
        borderColor: `rgba(59, 130, 246, ${alpha})`, // blue-500
        textColor: 'rgb(30, 58, 138)', // blue-800
      };
    case 'over':
      return {
        backgroundColor: `rgba(252, 165, 165, ${alpha * 0.8})`, // red-300
        borderColor: `rgba(239, 68, 68, ${alpha})`, // red-500
        textColor: 'rgb(153, 27, 27)', // red-800
      };
    case 'critical':
      return {
        backgroundColor: `rgba(220, 38, 38, ${Math.min(1, alpha * 0.9)})`, // red-600
        borderColor: 'rgb(185, 28, 28)', // red-700
        textColor: 'white',
      };
    default:
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: 'inherit',
      };
  }
};

export const generateHeatMapData = (
  teams: Team[],
  iterations: Cycle[],
  allocations: Allocation[]
): HeatMapCell[] => {
  const heatMapData: HeatMapCell[] = [];

  teams.forEach(team => {
    iterations.forEach((iteration, index) => {
      const iterationNumber = index + 1;
      const capacityCheck = calculateTeamCapacity(
        team,
        iterationNumber,
        allocations,
        iterations
      );

      const percentage = capacityCheck.allocatedPercentage;
      const level = getHeatMapLevel(percentage);
      const intensity = getHeatMapIntensity(percentage, level);

      heatMapData.push({
        teamId: team.id,
        iterationNumber,
        level,
        percentage,
        intensity,
      });
    });
  });

  return heatMapData;
};

export const getHeatMapLegend = () => [
  { level: 'empty' as HeatMapLevel, label: 'No allocation', range: '0%' },
  { level: 'under' as HeatMapLevel, label: 'Under-utilized', range: '< 60%' },
  { level: 'optimal' as HeatMapLevel, label: 'Optimal', range: '60-89%' },
  {
    level: 'near-full' as HeatMapLevel,
    label: 'Near capacity',
    range: '90-100%',
  },
  { level: 'over' as HeatMapLevel, label: 'Over-allocated', range: '101-120%' },
  { level: 'critical' as HeatMapLevel, label: 'Critical', range: '> 120%' },
];

export const getHeatMapStats = (heatMapData: HeatMapCell[]) => {
  const stats = {
    empty: 0,
    under: 0,
    optimal: 0,
    nearFull: 0,
    over: 0,
    critical: 0,
    total: heatMapData.length,
  };

  heatMapData.forEach(cell => {
    switch (cell.level) {
      case 'empty':
        stats.empty++;
        break;
      case 'under':
        stats.under++;
        break;
      case 'optimal':
        stats.optimal++;
        break;
      case 'near-full':
        stats.nearFull++;
        break;
      case 'over':
        stats.over++;
        break;
      case 'critical':
        stats.critical++;
        break;
    }
  });

  return {
    ...stats,
    healthScore: Math.round(
      ((stats.optimal + stats.nearFull) / stats.total) * 100
    ),
    utilizationRate: Math.round(
      ((stats.total - stats.empty) / stats.total) * 100
    ),
  };
};
