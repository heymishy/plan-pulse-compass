import { PriorityLevel } from '@/types';

// Default priority levels for backward compatibility
export const DEFAULT_PRIORITY_LEVELS: PriorityLevel[] = [
  {
    id: 1,
    label: 'Priority 1',
    description: 'Critical - Highest priority',
    color: 'bg-red-100 text-red-800',
  },
  {
    id: 2,
    label: 'Priority 2',
    description: 'High - Important but not critical',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: 3,
    label: 'Priority 3',
    description: 'Medium - Standard priority',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 4,
    label: 'Priority 4',
    description: 'Low - Can be deferred',
    color: 'bg-blue-100 text-blue-800',
  },
];

/**
 * Get priority levels from configuration with fallback to defaults
 */
export const getPriorityLevels = (
  configuredLevels?: PriorityLevel[]
): PriorityLevel[] => {
  return configuredLevels && configuredLevels.length > 0
    ? configuredLevels
    : DEFAULT_PRIORITY_LEVELS;
};

/**
 * Get a specific priority level by ID
 */
export const getPriorityLevel = (
  priorityId: number,
  configuredLevels?: PriorityLevel[]
): PriorityLevel => {
  const priorityLevels = getPriorityLevels(configuredLevels);
  return (
    priorityLevels.find(level => level.id === priorityId) || priorityLevels[1]
  ); // Default to Priority 2
};

/**
 * Get priority label for display
 */
export const getPriorityLabel = (
  priorityId: number,
  configuredLevels?: PriorityLevel[]
): string => {
  return getPriorityLevel(priorityId, configuredLevels).label;
};

/**
 * Get priority description for display
 */
export const getPriorityDescription = (
  priorityId: number,
  configuredLevels?: PriorityLevel[]
): string => {
  return getPriorityLevel(priorityId, configuredLevels).description;
};

/**
 * Get priority color class for styling
 */
export const getPriorityColor = (
  priorityId: number,
  configuredLevels?: PriorityLevel[]
): string => {
  return getPriorityLevel(priorityId, configuredLevels).color;
};
